"""Fonti ufficiali gratuite senza chiave: Treasury, NY Fed, CFTC, Cboe.

Ogni serie giornaliera porta ``available_from_utc``, calcolato con una regola
PRUDENTE (più tardi del vero, mai prima): meglio perdere un'informazione
che usarne una che il mercato non aveva ancora.

| Serie                         | Riferita a   | Disponibile da (regola)              |
|-------------------------------|--------------|--------------------------------------|
| Treasury par/real/bill curve  | giorno D     | D 18:00 ET (chiusura ~15:30 ET)       |
| NY Fed EFFR                   | giorno D     | D+1 lavorativo 09:00 ET (pubblicata ~08:00) |
| Cboe VIX chiusura             | giorno D     | D 17:00 ET                           |
| CFTC COT (martedì)            | martedì T    | T+3 giorni 15:30 ET, +7 giorni negli shutdown |
"""

from __future__ import annotations

import io
import logging
from datetime import date, datetime, time, timedelta
from pathlib import Path

import pandas as pd

from .. import http
from ..config import get_settings
from ..timeutil import NY, UTC
from .base import PositioningProvider, RatesProvider

log = logging.getLogger("xnb.official")


def _avail(d: date, hh: int, mm: int = 0, add_days: int = 0) -> datetime:
    return datetime.combine(d + timedelta(days=add_days), time(hh, mm), tzinfo=NY).astimezone(UTC)


class _YearCache:
    def __init__(self, name: str):
        self.dir = get_settings().cache_dir / name
        self.dir.mkdir(parents=True, exist_ok=True)

    def path(self, key: str) -> Path:
        return self.dir / key

    def fresh(self, key: str, closed: bool, max_age_h: float) -> bool:
        p = self.path(key)
        if not p.exists():
            return False
        if closed:
            return True
        return (datetime.now().timestamp() - p.stat().st_mtime) < max_age_h * 3600


class TreasuryProvider(RatesProvider):
    """home.treasury.gov — curve ufficiali giornaliere (nominale, reale TIPS, T-bill)."""

    source_id = "treasury"
    URL = ("https://home.treasury.gov/resource-center/data-chart-center/interest-rates/"
           "daily-treasury-rates.csv/{y}/all?type={t}&field_tdr_date_value={y}&page&_format=csv")
    TYPES = {"nominal": "daily_treasury_yield_curve", "real": "daily_treasury_real_yield_curve"}

    def __init__(self):
        self.cache = _YearCache("treasury")

    def _year(self, kind: str, y: int) -> pd.DataFrame:
        key = f"{kind}_{y}.csv"
        closed = y < date.today().year
        if not self.cache.fresh(key, closed, max_age_h=3):
            r = http.get(self.URL.format(y=y, t=self.TYPES[kind]), self.source_id, timeout=60)
            self.cache.path(key).write_text(r.text, encoding="utf-8")
        try:
            df = pd.read_csv(self.cache.path(key))
        except pd.errors.EmptyDataError:
            return pd.DataFrame()  # es. curva reale prima del 2003
        df["Date"] = pd.to_datetime(df["Date"], format="%m/%d/%Y").dt.date
        return df.set_index("Date").sort_index()

    def daily(self, start: date, end: date) -> pd.DataFrame:
        nom = pd.concat([self._year("nominal", y) for y in range(start.year, end.year + 1)])
        real = pd.concat([d for d in (self._year("real", y) for y in range(start.year, end.year + 1)) if len(d)])
        out = pd.DataFrame(index=nom.index)
        colmap = {"1 Mo": "y1m", "3 Mo": "y3m", "6 Mo": "y6m", "1 Yr": "y1y", "2 Yr": "y2y",
                  "5 Yr": "y5y", "10 Yr": "y10y", "30 Yr": "y30y"}
        for c, n in colmap.items():
            if c in nom:
                out[n] = pd.to_numeric(nom[c], errors="coerce")
        rc = {"5 YR": "r5y", "10 YR": "r10y"}
        for c, n in rc.items():
            if c in real:
                out = out.join(pd.to_numeric(real[c], errors="coerce").rename(n), how="left")
        out = out[~out.index.duplicated()].sort_index()
        out = out.loc[(out.index >= start) & (out.index <= end)]
        out["available_from_utc"] = [_avail(d, 18) for d in out.index]
        return out


class NYFedProvider(RatesProvider):
    """markets.newyorkfed.org — EFFR e fascia obiettivo Fed (dal 2016-03)."""

    source_id = "nyfed"
    URL = "https://markets.newyorkfed.org/api/rates/unsecured/effr/search.json"

    def __init__(self):
        self.cache = _YearCache("nyfed")

    def daily(self, start: date, end: date) -> pd.DataFrame:
        frames = []
        for y in range(max(start.year, 2016), end.year + 1):
            key = f"effr_{y}.json"
            closed = y < date.today().year
            if not self.cache.fresh(key, closed, max_age_h=3):
                r = http.get(self.URL, self.source_id,
                             params={"startDate": f"{y}-01-01", "endDate": f"{y}-12-31"}, timeout=60)
                self.cache.path(key).write_text(r.text, encoding="utf-8")
            js = pd.read_json(self.cache.path(key))
            rows = js["refRates"].tolist()
            if rows:
                frames.append(pd.DataFrame(rows))
        if not frames:
            return pd.DataFrame(columns=["effr", "ff_lo", "ff_hi", "available_from_utc"])
        df = pd.concat(frames)
        df["d"] = pd.to_datetime(df["effectiveDate"]).dt.date
        df = df.set_index("d").sort_index()
        out = pd.DataFrame({"effr": df["percentRate"], "ff_lo": df["targetRateFrom"], "ff_hi": df["targetRateTo"]})
        out = out[~out.index.duplicated()]
        out = out.loc[(out.index >= start) & (out.index <= end)]
        # pubblicata la mattina del giorno lavorativo successivo
        out["available_from_utc"] = [_avail(d, 9, add_days=3 if d.weekday() == 4 else 1) for d in out.index]
        return out


class CboeProvider(RatesProvider):
    """cdn.cboe.com — storico giornaliero ufficiale del VIX dal 1990."""

    source_id = "cboe"
    URL = "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv"

    def __init__(self):
        self.cache = _YearCache("cboe")

    def daily(self, start: date, end: date) -> pd.DataFrame:
        key = "VIX_History.csv"
        if not self.cache.fresh(key, False, max_age_h=6):
            r = http.get(self.URL, self.source_id, timeout=60)
            self.cache.path(key).write_text(r.text, encoding="utf-8")
        df = pd.read_csv(self.cache.path(key))
        df["d"] = pd.to_datetime(df["DATE"], format="%m/%d/%Y").dt.date
        df = df.set_index("d").sort_index()
        out = pd.DataFrame({"vix": df["CLOSE"].astype(float)})
        out = out.loc[(out.index >= start) & (out.index <= end)]
        out["available_from_utc"] = [_avail(d, 17) for d in out.index]
        return out


# Periodi in cui la CFTC ha sospeso o ritardato i report (shutdown federali).
COT_DELAYED = [
    (date(2013, 10, 1), date(2013, 11, 8)),
    (date(2018, 12, 22), date(2019, 3, 8)),
    (date(2025, 10, 1), date(2026, 1, 31)),
]


class CFTCProvider(PositioningProvider):
    """publicreporting.cftc.gov — COT Disaggregated, oro COMEX (codice 088691)."""

    source_id = "cftc"
    URL = "https://publicreporting.cftc.gov/resource/72hh-3qpy.json"

    def __init__(self):
        self.cache = _YearCache("cftc")

    def gold_cot(self, start: date, end: date) -> pd.DataFrame:
        key = "gold_disagg.json"
        if not self.cache.fresh(key, False, max_age_h=12):
            r = http.get(self.URL, self.source_id, timeout=90, params={
                "$where": "cftc_contract_market_code='088691'",
                "$order": "report_date_as_yyyy_mm_dd ASC", "$limit": 5000})
            self.cache.path(key).write_text(r.text, encoding="utf-8")
        df = pd.read_json(self.cache.path(key))
        df["d"] = pd.to_datetime(df["report_date_as_yyyy_mm_dd"]).dt.date
        df = df.set_index("d").sort_index()
        oi = df["open_interest_all"].astype(float)
        mm_net = df["m_money_positions_long_all"].astype(float) - df["m_money_positions_short_all"].astype(float)
        out = pd.DataFrame({"cot_mm_net_pct_oi": mm_net / oi * 100, "cot_oi": oi})
        out = out.loc[(out.index >= start) & (out.index <= end)]

        def avail(d: date) -> datetime:
            delayed = any(a <= d <= b for a, b in COT_DELAYED)
            if delayed:
                # durante gli shutdown i report sono usciti settimane dopo: esclusi
                return datetime(2100, 1, 1, tzinfo=UTC)
            return _avail(d, 15, 30, add_days=3)

        out["available_from_utc"] = [avail(d) for d in out.index]
        return out
