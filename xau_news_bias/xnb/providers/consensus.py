"""Aspettative pre-release: nowcast Cleveland Fed e consensus ForexFactory.

**Cleveland Fed Inflation Nowcasting** (ufficiale, gratuito, senza chiave).
Un grafico JSON per mese di riferimento, con un valore per giorno
lavorativo: è il nowcast *come pubblicato quel giorno* (dal 2013-07 la
Cleveland Fed conserva i valori in tempo reale, non ristimati). Il valore
del giorno d si considera noto dalle 23:59 ET di d (regola prudente).

**ForexFactory storico** (dataset di terzi su GitHub, NON ufficiale).
Il campo forecast è il consensus mostrato da FF al momento della release:
noto prima di T0, ma non è garantito che fosse già quello a T−3D; FF può
aggiornarlo negli ultimi giorni. Usato solo per la ricerca, con questa
avvertenza scritta nel registro fonti. Dal vivo il consensus arriva dal
JSON settimanale ufficiale di FF e viene archiviato a ogni lettura.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import date, datetime, time, timedelta

import numpy as np
import pandas as pd

from .. import http
from ..config import get_settings
from ..timeutil import NY, UTC

log = logging.getLogger("xnb.consensus")

NOWCAST_URL = "https://www.clevelandfed.org/-/media/files/webcharts/inflationnowcasting/nowcast_month.json"
FF_HISTORY_URL = "https://github.com/janickfarrell/newfac/releases/download/calendar-data/forexfactory_calendar.csv"

NOWCAST_SERIES = {
    "CPI Inflation": "nc_cpi",
    "Core CPI Inflation": "nc_core",
    "PCE Inflation": "nc_pce",
    "Core PCE Inflation": "nc_core_pce",
}


def _cache_path(name: str):
    p = get_settings().cache_dir / "consensus"
    p.mkdir(parents=True, exist_ok=True)
    return p / name


def _fresh(path, max_age_h: float) -> bool:
    return path.exists() and (datetime.now().timestamp() - path.stat().st_mtime) < max_age_h * 3600


class ClevelandFedNowcast:
    source_id = "clevelandfed_nowcast"

    def load(self, max_age_h: float = 6) -> pd.DataFrame:
        """Tabella lunga: target (YYYY-MM), series, obs_date, value, available_from_utc."""
        path = _cache_path("nowcast_month.json")
        if not _fresh(path, max_age_h):
            r = http.get(NOWCAST_URL, self.source_id, timeout=120)
            path.write_text(r.text, encoding="utf-8")
        charts = json.loads(path.read_text(encoding="utf-8"))
        rows = []
        for ch in charts:
            y, m = (int(x) for x in ch["chart"]["subcaption"].split("-"))
            labels = [c["label"] for c in ch["categories"][0]["category"] if not c.get("vline")]
            dates = [self._infer_date(lab, y, m) for lab in labels]
            for ds in ch["dataset"]:
                key = NOWCAST_SERIES.get(ds["seriesname"])
                if not key:
                    continue
                for d, pt in zip(dates, ds["data"]):
                    v = pt.get("value", "")
                    if d is None or v in ("", None):
                        continue
                    rows.append((f"{y}-{m:02d}", key, d, float(v)))
        df = pd.DataFrame(rows, columns=["target", "series", "obs_date", "value"])
        df["available_from_utc"] = [
            datetime.combine(d, time(23, 59), tzinfo=NY).astimezone(UTC) for d in df["obs_date"]
        ]
        return df

    @staticmethod
    def _infer_date(label: str, y: int, m: int) -> date | None:
        mm = re.match(r"^(\d{2})/(\d{2})$", label)
        if not mm:
            return None
        lm, ld = int(mm.group(1)), int(mm.group(2))
        target_mid = date(y, m, 15)
        best = None
        for yy in (y - 1, y, y + 1):
            try:
                d = date(yy, lm, ld)
            except ValueError:
                continue
            if best is None or abs((d - target_mid).days) < abs((best - target_mid).days):
                best = d
        return best

    @staticmethod
    def asof(df: pd.DataFrame, target: str, series: str, t: datetime) -> float:
        sub = df[(df.target == target) & (df.series == series) & (df.available_from_utc <= t)]
        return float(sub.sort_values("obs_date").value.iloc[-1]) if len(sub) else np.nan


def _pct(x) -> float:
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return np.nan
    s = str(x).strip().replace("%", "")
    try:
        return float(s)
    except ValueError:
        return np.nan


class ForexFactoryHistory:
    source_id = "ff_history_github"
    TITLES = {"CPI m/m": "cpi_mom", "Core CPI m/m": "core_mom", "CPI y/y": "cpi_yoy", "Core CPI y/y": "core_yoy"}

    def load(self, max_age_h: float = 24 * 7) -> pd.DataFrame:
        path = _cache_path("forexfactory_calendar.csv")
        if not _fresh(path, max_age_h):
            r = http.get(FF_HISTORY_URL, self.source_id, timeout=180)
            path.write_bytes(r.content)
        df = pd.read_csv(path, encoding="utf-8-sig")
        return df

    def cpi_table(self) -> pd.DataFrame:
        """Una riga per data di release CPI: forecast/previous/actual (m/m e y/y)."""
        df = self.load()
        u = df[(df.currency == "USD") & (df.event.isin(self.TITLES))].copy()
        u["d"] = pd.to_datetime(u["date"], format="%a %b %d %Y").dt.date
        out = {}
        for _, r in u.iterrows():
            k = self.TITLES[r.event]
            row = out.setdefault(r.d, {"release_date": r.d, "time_gmt": r.time})
            row[f"ff_fc_{k}"] = _pct(r.forecast)
            row[f"ff_prev_{k}"] = _pct(r.previous)
            row[f"ff_act_{k}"] = _pct(r.actual)
        return pd.DataFrame(list(out.values())).sort_values("release_date").reset_index(drop=True)
