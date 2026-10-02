"""Dukascopy: tick e candele storiche gratuite, timestamp UTC al millisecondo.

Due endpoint dello stesso database, verificati identici al tick (differenza
massima 2e-13 su un'ora di tick e una giornata di M1):

1. PRIMARIO — API JSON ``jetta.dukascopy.com/v1`` (quella usata dalla
   libreria ufficiale dukascopy-node), mese 1-based, valori codificati a
   differenze. Risponde in 0,2-0,5 s.
2. FALLBACK — il datafeed storico ``.bi5``, descritto sotto. Da settembre
   2026 risponde in 10-20 s a file e con frequenti 503.

URL datafeed (mese con indice ZERO: gennaio = 00):
    tick     /datafeed/{SYM}/{YYYY}/{MM}/{DD}/{HH}h_ticks.bi5
    M1 BID   /datafeed/{SYM}/{YYYY}/{MM}/{DD}/BID_candles_min_1.bi5
    H1 BID   /datafeed/{SYM}/{YYYY}/{MM}/BID_candles_hour_1.bi5

Formato: LZMA; tick = 20 byte big-endian (ms dall'inizio dell'ora, ask, bid,
vol ask, vol bid); candela = 24 byte (s dall'inizio del periodo, open,
close, low, high, volume). I prezzi sono interi da dividere per il
divisore del simbolo (XAUUSD: 1000).

Cache: ogni file scaricato viene salvato così com'è e non viene mai
riscaricato. I file dell'ora/giorno/mese ancora in corso NON vengono messi
in cache (sarebbero incompleti).
"""

from __future__ import annotations

import gzip
import json
import logging
import lzma
from datetime import date, datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from .. import http
from ..config import get_settings
from ..timeutil import UTC, utc_now
from .base import MarketDataProvider

log = logging.getLogger("xnb.dukascopy")

BASE = "https://datafeed.dukascopy.com/datafeed"
JETTA = "https://jetta.dukascopy.com/v1"
DIVISOR = {
    "XAUUSD": 1000,
    "EURUSD": 100000,
    "GBPUSD": 100000,
    "USDCAD": 100000,
    "USDSEK": 100000,
    "USDCHF": 100000,
    "USDJPY": 1000,
    "USA500IDXUSD": 1000,
    "USATECHIDXUSD": 1000,
}
# nomi dell'API jetta per gli strumenti che non sono coppie di valute
JETTA_NAMES = {"USA500IDXUSD": "USA500.IDX-USD", "USATECHIDXUSD": "USATECH.IDX-USD"}
TICK_DT = np.dtype([("ms", ">u4"), ("ask", ">u4"), ("bid", ">u4"), ("av", ">f4"), ("bv", ">f4")])
CANDLE_DT = np.dtype([("t", ">u4"), ("o", ">u4"), ("c", ">u4"), ("l", ">u4"), ("h", ">u4"), ("v", ">f4")])


class DukascopyProvider(MarketDataProvider):
    source_id = "dukascopy"

    def __init__(self, cache_dir: Path | None = None):
        self.cache_dir = (cache_dir or get_settings().cache_dir) / "dukascopy"

    # ------------------------------------------------------------------ raw
    def _raw(self, rel: str, period_end: datetime) -> bytes:
        """Scarica (o legge dalla cache) un file .bi5. ``period_end``: fine del periodo coperto."""
        path = self.cache_dir / (rel.replace("/", "_"))
        if path.exists():
            return path.read_bytes()
        r = http.get(f"{BASE}/{rel}", self.source_id, allow_404=True, record=False, timeout=90)
        data = b"" if r is None else r.content
        # In cache solo se il periodo è chiuso da almeno 2 ore (il feed pubblica con ritardo).
        if period_end + timedelta(hours=2) < utc_now():
            path.parent.mkdir(parents=True, exist_ok=True)
            tmp = path.with_suffix(".tmp")
            tmp.write_bytes(data)
            tmp.replace(path)
        return data

    @staticmethod
    def _decode(data: bytes, dt: np.dtype) -> np.ndarray:
        if not data:
            return np.zeros(0, dtype=dt)
        return np.frombuffer(lzma.decompress(data), dtype=dt)

    # ---------------------------------------------------------------- jetta
    def _jetta(self, rel: str, period_end: datetime) -> dict | None:
        """JSON dell'API jetta, in cache compressa se il periodo è chiuso. None se non disponibile."""
        path = self.cache_dir / "jetta" / (rel.replace("/", "_") + ".json.gz")
        if path.exists():
            return json.loads(gzip.decompress(path.read_bytes()))
        try:
            r = http.get(f"{JETTA}/{rel}", self.source_id, allow_404=True, record=False, timeout=60, retries=2)
        except http.FetchError as exc:
            if exc.status == 400 and period_end > utc_now():
                return {}  # periodo in corso: jetta non lo serve ancora, e neppure il datafeed
            log.warning("jetta non disponibile (%s): uso il datafeed storico", exc)
            return None
        js = {} if r is None else r.json()
        if period_end + timedelta(hours=2) < utc_now():
            path.parent.mkdir(parents=True, exist_ok=True)
            tmp = path.with_suffix(".tmp")
            tmp.write_bytes(gzip.compress(json.dumps(js).encode()))
            tmp.replace(path)
        return js

    @staticmethod
    def _jsym(symbol: str) -> str:
        return JETTA_NAMES.get(symbol, f"{symbol[:3]}-{symbol[3:]}")

    @staticmethod
    def _jetta_candles(js: dict) -> pd.DataFrame:
        if not js or not js.get("times"):
            return pd.DataFrame(columns=["o", "h", "l", "c", "v"], index=pd.DatetimeIndex([], tz="UTC", name="ts"))
        m = js["multiplier"]
        t = js["timestamp"] + np.cumsum(np.asarray(js["times"], dtype=np.int64)) * js["shift"]
        df = pd.DataFrame(
            {
                "o": js["open"] + np.cumsum(js["opens"]) * m,
                "h": js["high"] + np.cumsum(js["highs"]) * m,
                "l": js["low"] + np.cumsum(js["lows"]) * m,
                "c": js["close"] + np.cumsum(js["closes"]) * m,
                "v": np.asarray(js["volumes"], dtype=np.float64),
            },
            index=pd.DatetimeIndex(pd.to_datetime(t, unit="ms", utc=True), name="ts"),
        )
        return df[df.v > 0].round(6)

    # ---------------------------------------------------------------- ticks
    def tick_hour(self, symbol: str, hour_start: datetime) -> pd.DataFrame:
        h = hour_start.astimezone(UTC).replace(minute=0, second=0, microsecond=0)
        legacy = self.cache_dir / f"{symbol}/{h.year}/{h.month - 1:02d}/{h.day:02d}/{h.hour:02d}h_ticks.bi5".replace("/", "_")
        if not legacy.exists():
            js = self._jetta(f"ticks/{self._jsym(symbol)}/{h.year}/{h.month}/{h.day}/{h.hour}", h + timedelta(hours=1))
            if js is not None:
                if not js.get("times"):
                    return pd.DataFrame({"ts_ms": np.zeros(0, np.int64), "bid": [], "ask": []})
                m = js["multiplier"]
                return pd.DataFrame({
                    "ts_ms": js["timestamp"] + np.cumsum(np.asarray(js["times"], dtype=np.int64)),
                    "bid": np.round(js["bid"] + np.cumsum(js["bids"]) * m, 6),
                    "ask": np.round(js["ask"] + np.cumsum(js["asks"]) * m, 6),
                })
        rel = f"{symbol}/{h.year}/{h.month - 1:02d}/{h.day:02d}/{h.hour:02d}h_ticks.bi5"
        arr = self._decode(self._raw(rel, h + timedelta(hours=1)), TICK_DT)
        div = DIVISOR[symbol]
        base_ms = int(h.timestamp() * 1000)
        return pd.DataFrame(
            {
                "ts_ms": base_ms + arr["ms"].astype(np.int64),
                "bid": arr["bid"].astype(np.float64) / div,
                "ask": arr["ask"].astype(np.float64) / div,
            }
        )

    def ticks(self, symbol: str, start: datetime, end: datetime) -> pd.DataFrame:
        frames = []
        h = start.astimezone(UTC).replace(minute=0, second=0, microsecond=0)
        while h < end:
            frames.append(self.tick_hour(symbol, h))
            h += timedelta(hours=1)
        df = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=["ts_ms", "bid", "ask"])
        s, e = int(start.timestamp() * 1000), int(end.timestamp() * 1000)
        return df[(df.ts_ms >= s) & (df.ts_ms < e)].reset_index(drop=True)

    # -------------------------------------------------------------- candles
    def _candles(self, rel: str, base: datetime, period_end: datetime, symbol: str) -> pd.DataFrame:
        arr = self._decode(self._raw(rel, period_end), CANDLE_DT)
        div = DIVISOR[symbol]
        idx = pd.to_datetime(int(base.timestamp()) + arr["t"].astype(np.int64), unit="s", utc=True)
        df = pd.DataFrame(
            {
                "o": arr["o"] / div,
                "h": arr["h"] / div,
                "l": arr["l"] / div,
                "c": arr["c"] / div,
                "v": arr["v"].astype(np.float64),
            },
            index=idx,
        )
        df.index.name = "ts"
        # Dukascopy riempie le ore senza scambi con candele piatte a volume 0.
        return df[df.v > 0]

    def m1(self, symbol: str, day: date) -> pd.DataFrame:
        base = datetime(day.year, day.month, day.day, tzinfo=UTC)
        if base > utc_now():
            return pd.DataFrame(columns=["o", "h", "l", "c", "v"], index=pd.DatetimeIndex([], tz="UTC", name="ts"))
        rel = f"{symbol}/{day.year}/{day.month - 1:02d}/{day.day:02d}/BID_candles_min_1.bi5"
        if not (self.cache_dir / rel.replace("/", "_")).exists():
            js = self._jetta(f"candles/minute/{self._jsym(symbol)}/BID/{day.year}/{day.month}/{day.day}",
                             base + timedelta(days=1))
            if js is not None:
                return self._jetta_candles(js)
        return self._candles(rel, base, base + timedelta(days=1), symbol)

    def h1(self, symbol: str, year: int, month: int) -> pd.DataFrame:
        base = datetime(year, month, 1, tzinfo=UTC)
        nxt = datetime(year + (month == 12), month % 12 + 1, 1, tzinfo=UTC)
        rel = f"{symbol}/{year}/{month - 1:02d}/BID_candles_hour_1.bi5"
        now = utc_now()
        if (year, month) == (now.year, now.month):
            # mese in corso: il feed non ha ancora il file mensile, si aggrega dalle M1 giornaliere
            m1 = self.m1_range(symbol, base.date(), now.date())
            if m1.empty:
                return m1
            g = m1.resample("1h", label="left", closed="left")
            h = pd.DataFrame({"o": g.o.first(), "h": g.h.max(), "l": g.l.min(), "c": g.c.last(), "v": g.v.sum()})
            h.index.name = "ts"
            return h.dropna(subset=["o"])
        if not (self.cache_dir / rel.replace("/", "_")).exists():
            js = self._jetta(f"candles/hour/{self._jsym(symbol)}/BID/{year}/{month}", nxt)
            if js is not None:
                return self._jetta_candles(js)
        return self._candles(rel, base, nxt, symbol)

    def h1_range(self, symbol: str, start: date, end: date) -> pd.DataFrame:
        frames, y, m = [], start.year, start.month
        while (y, m) <= (end.year, end.month):
            frames.append(self.h1(symbol, y, m))
            y, m = (y + 1, 1) if m == 12 else (y, m + 1)
        frames = [f for f in frames if len(f)]
        return pd.concat(frames).sort_index().astype(float) if frames else pd.DataFrame()

    def m1_range(self, symbol: str, start: date, end: date) -> pd.DataFrame:
        frames, d = [], start
        while d <= end:
            frames.append(self.m1(symbol, d))
            d += timedelta(days=1)
        frames = [f for f in frames if len(f)]
        return pd.concat(frames).sort_index().astype(float) if frames else pd.DataFrame(columns=["o", "h", "l", "c", "v"])


# Indice del dollaro ricostruito con la formula ufficiale ICE a sei valute.
DXY_WEIGHTS = {
    "EURUSD": -0.576,
    "USDJPY": 0.136,
    "GBPUSD": -0.119,
    "USDCAD": 0.091,
    "USDSEK": 0.042,
    "USDCHF": 0.036,
}
DXY_CONST = 50.14348112


def synthetic_dxy(closes: pd.DataFrame) -> pd.Series:
    """DXY = 50.14348112 · EURUSD^-0.576 · USDJPY^0.136 · GBPUSD^-0.119 ·
    USDCAD^0.091 · USDSEK^0.042 · USDCHF^0.036, su chiusure allineate."""
    logv = np.log(DXY_CONST) + sum(w * np.log(closes[s]) for s, w in DXY_WEIGHTS.items())
    return np.exp(logv)
