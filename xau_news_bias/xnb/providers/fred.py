"""FRED / ALFRED (Federal Reserve Bank of St. Louis) — richiede FRED_API_KEY gratuita.

ALFRED conserva ogni "vintage" di una serie: il valore come appariva a una
certa data. ``vintage_asof(series, when)`` restituisce la serie esattamente
com'era nota in quel giorno, e ``release_dates(release_id)`` le date storiche
di pubblicazione.

Senza chiave l'adattatore resta inattivo e il registro fonti lo segnala
come ``NOT CONFIGURED``: il POC CPI usa i comunicati BLS archiviati, che
sono già point-in-time. Con la chiave diventa la via più pulita per
estendere il progetto (PCE, GDP, payrolls, sussidi) con i vintage.
"""

from __future__ import annotations

from datetime import date

import pandas as pd

from .. import http
from ..config import get_settings

BASE = "https://api.stlouisfed.org/fred"

# id di release FRED utili (fred/releases)
RELEASES = {"CPI": 10, "NFP": 50, "PPI": 46, "PCE": 54, "GDP": 53, "RETAIL": 9}


class FredNotConfigured(RuntimeError):
    pass


class FredProvider:
    source_id = "fred"

    def __init__(self, api_key: str | None = None):
        self.key = api_key or get_settings().fred_api_key

    @property
    def configured(self) -> bool:
        return bool(self.key)

    def _get(self, path: str, **params) -> dict:
        if not self.key:
            raise FredNotConfigured("FRED_API_KEY mancante nel file .env")
        params.update(api_key=self.key, file_type="json")
        return http.get(f"{BASE}/{path}", self.source_id, params=params, timeout=60).json()

    def release_dates(self, release_id: int) -> list[date]:
        js = self._get("release/dates", release_id=release_id, include_release_dates_with_no_data="true",
                       sort_order="asc", limit=10000)
        return [date.fromisoformat(r["date"]) for r in js.get("release_dates", [])]

    def vintage_asof(self, series_id: str, when: date) -> pd.Series:
        """La serie come nota il giorno ``when`` (ALFRED real-time period)."""
        js = self._get("series/observations", series_id=series_id,
                       realtime_start=when.isoformat(), realtime_end=when.isoformat())
        obs = {o["date"]: float(o["value"]) for o in js.get("observations", []) if o["value"] not in (".", "")}
        return pd.Series(obs, dtype=float)

    def latest(self, series_id: str, start: date | None = None) -> pd.Series:
        params = {"series_id": series_id}
        if start:
            params["observation_start"] = start.isoformat()
        js = self._get("series/observations", **params)
        obs = {o["date"]: float(o["value"]) for o in js.get("observations", []) if o["value"] not in (".", "")}
        return pd.Series(obs, dtype=float)
