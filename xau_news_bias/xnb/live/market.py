"""Dati di mercato per il motore LIVE, con la stessa forma di quelli di ricerca.

Stratificazione (dal più affidabile al più recente):
1. mesi chiusi: candele H1 Dukascopy (in cache, identiche alla ricerca);
2. giorni chiusi del mese corrente: M1 Dukascopy aggregate in H1;
3. oggi: M1 Dukascopy se disponibili, altrimenti tick delle ore chiuse
   aggregati in M1, poi le quotazioni raccolte dal vivo (Swissquote) per
   l'ultimo pezzo d'ora.

Le feature live sono calcolate dallo STESSO codice della ricerca
(``research.features.snapshot``): nessuna divergenza fra backtest e live.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta

import numpy as np
import pandas as pd

from ..db import session
from ..providers.dukascopy import DXY_WEIGHTS, DukascopyProvider
from ..providers.live_feeds import GoldApiQuotes, SwissquoteQuotes
from ..providers.official import CboeProvider, CFTCProvider, TreasuryProvider
from ..research.features import MarketContext, build_context
from ..timeutil import UTC, iso, parse_iso, utc_now, xau_market_open

log = logging.getLogger("xnb.live.market")


def _agg(df: pd.DataFrame, rule: str) -> pd.DataFrame:
    if df.empty:
        return df
    g = df.resample(rule, label="left", closed="left")
    out = pd.DataFrame({"o": g.o.first(), "h": g.h.max(), "l": g.l.min(), "c": g.c.last(), "v": g.v.sum()})
    return out.dropna(subset=["o"])


class LiveMarket:
    def __init__(self, duka: DukascopyProvider | None = None):
        self.duka = duka or DukascopyProvider()
        self.primary = SwissquoteQuotes()
        self.fallback = GoldApiQuotes()
        self._ctx_cache: tuple[datetime, MarketContext] | None = None

    # ------------------------------------------------------------ quotes
    def collect_quote(self) -> dict:
        """Una lettura del prezzo live, con controllo incrociato quando possibile."""
        q1 = q2 = None
        err = []
        try:
            q1 = self.primary.quote("XAUUSD")
        except Exception as exc:  # noqa: BLE001
            err.append(f"swissquote: {exc}")
        try:
            q2 = self.fallback.quote("XAUUSD")
        except Exception as exc:  # noqa: BLE001
            err.append(f"goldapi: {exc}")
        q = q1 or q2
        with session() as con:
            for qq in (q1, q2):
                if qq is not None:
                    con.execute("INSERT OR IGNORE INTO live_quotes(ts_utc,provider,symbol,bid,ask) VALUES(?,?,?,?,?)",
                                (iso(qq.ts_utc), qq.provider, "XAUUSD", qq.bid, qq.ask))
        diff = None
        if q1 and q2:
            diff = abs(q1.mid - q2.mid) / q1.mid * 100
        return {"quote": q, "cross_check_diff_pct": diff, "errors": err,
                "age_s": (utc_now() - q.ts_utc).total_seconds() if q else None}

    def last_quote(self) -> dict | None:
        with session() as con:
            r = con.execute("SELECT * FROM live_quotes WHERE symbol='XAUUSD' ORDER BY ts_utc DESC LIMIT 1").fetchone()
        return dict(r) if r else None

    def quotes_m1(self, since: datetime) -> pd.DataFrame:
        with session() as con:
            rows = con.execute("SELECT ts_utc,bid,ask FROM live_quotes WHERE symbol='XAUUSD' AND provider='swissquote'"
                               " AND ts_utc>=? ORDER BY ts_utc", (iso(since),)).fetchall()
        if not rows:
            return pd.DataFrame(columns=["o", "h", "l", "c", "v"])
        df = pd.DataFrame([dict(r) for r in rows])
        df.index = pd.to_datetime(df.ts_utc, utc=True, format="ISO8601")
        bid = df["bid"].astype(float)
        m = pd.DataFrame({"o": bid, "h": bid, "l": bid, "c": bid, "v": 1.0})
        return _agg(m, "1min")

    # ------------------------------------------------------------ bars
    def _today_m1(self, symbol: str, day: date, now: datetime) -> pd.DataFrame:
        try:
            m = self.duka.m1(symbol, day)
            if len(m):
                return m
        except Exception as exc:  # noqa: BLE001
            log.debug("M1 odierne %s non disponibili: %s", symbol, exc)
        frames = []
        h = datetime(day.year, day.month, day.day, tzinfo=UTC)
        while h + timedelta(hours=1) <= now:
            try:
                t = self.duka.tick_hour(symbol, h)
                if len(t):
                    s = pd.Series(t.bid.to_numpy(), index=pd.to_datetime(t.ts_ms, unit="ms", utc=True))
                    frames.append(_agg(pd.DataFrame({"o": s, "h": s, "l": s, "c": s, "v": 1.0}), "1min"))
            except Exception as exc:  # noqa: BLE001
                log.debug("tick %s %s non disponibili: %s", symbol, h, exc)
            h += timedelta(hours=1)
        return pd.concat(frames) if frames else pd.DataFrame(columns=["o", "h", "l", "c", "v"])

    def recent_m1(self, symbol: str, start_day: date, now: datetime, live: bool = True) -> pd.DataFrame:
        """M1 recenti. ``live=False``: solo candele Dukascopy (range veri), senza le quotazioni live
        aggregate, che hanno una lettura al minuto e quindi massimo = minimo."""
        frames = []
        d = start_day
        while d < now.date():
            frames.append(self.duka.m1(symbol, d))
            d += timedelta(days=1)
        frames.append(self._today_m1(symbol, now.date(), now))
        df = pd.concat([f for f in frames if len(f)]) if any(len(f) for f in frames) else pd.DataFrame()
        if symbol == "XAUUSD" and live:
            last = df.index[-1] if len(df) else now - timedelta(days=5)
            live = self.quotes_m1(last + timedelta(minutes=1))
            if len(live):
                df = pd.concat([df, live])
        return df[~df.index.duplicated(keep="first")].sort_index() if len(df) else df

    def h1_series(self, symbol: str, start: date, now: datetime) -> pd.DataFrame:
        month_start = date(now.year, now.month, 1)
        hist = self.duka.h1_range(symbol, start, month_start - timedelta(days=1))
        recent = self.recent_m1(symbol, month_start, now)
        cur = _agg(recent, "1h") if len(recent) else pd.DataFrame()
        df = pd.concat([hist, cur]) if len(cur) else hist
        return df[~df.index.duplicated(keep="first")].sort_index()

    # ------------------------------------------------------------ context
    def context(self, now: datetime, max_age_min: float = 10) -> MarketContext:
        if self._ctx_cache and (now - self._ctx_cache[0]).total_seconds() < max_age_min * 60:
            return self._ctx_cache[1]
        start = date(now.year - 3, 1, 1)
        xau = self.h1_series("XAUUSD", start, now)
        fx = {s: self.h1_series(s, start, now) for s in DXY_WEIGHTS}
        rates = TreasuryProvider().daily(start, now.date())
        vix = CboeProvider().daily(start, now.date())
        cot = CFTCProvider().gold_cot(start, now.date())
        ctx = build_context(xau, fx, rates, vix, cot)
        self._ctx_cache = (now, ctx)
        return ctx

    def market_open(self, now: datetime | None = None) -> bool:
        return xau_market_open(now or utc_now())
