"""Eventi CPI e NFP con T0 ufficiale (08:30 America/New_York).

Fonte primaria delle date: archivio comunicati BLS. Dove l'archivio non ha
un comunicato (capita per qualche mese), la data viene dallo storico
ForexFactory e l'evento è marcato ``source = ff_history``.
"""

from __future__ import annotations

import logging
from datetime import datetime, time

import pandas as pd

from ..providers.base import EventSpec
from ..providers.bls import ICS_SUMMARY, RELEASE_TIME, BLSProvider
from ..providers.consensus import ForexFactoryHistory
from ..research.pipeline import store_events
from ..timeutil import NY, UTC, ny_to_utc

log = logging.getLogger("xnb.phase2.events")

FF_TITLE = {"CPI": "CPI m/m", "NFP": "Non-Farm Employment Change"}


def family_events(family: str, start_year: int = 2008) -> list[EventSpec]:
    bls = BLSProvider()
    evs = {e.t0_utc.astimezone(NY).date(): e for e in bls.historical_events(family)}
    ff = ForexFactoryHistory().load()
    u = ff[(ff.currency == "USD") & (ff.event == FF_TITLE[family])].copy()
    u["d"] = pd.to_datetime(u["date"], format="%a %b %d %Y").dt.date
    added = 0
    for _, r in u.iterrows():
        d = r["d"]
        if d in evs or d.year < start_year or pd.isna(r.get("actual")):
            continue
        # FF registra l'ora in GMT: deve coincidere con le 08:30 ET di quel giorno
        t0 = ny_to_utc(d, RELEASE_TIME)
        hh, mm = (int(x) for x in str(r["time"]).split(":")) if ":" in str(r["time"]) else (None, None)
        if hh is None or (hh, mm) != (t0.hour, t0.minute):
            log.warning("%s %s: ora FF %s diversa da 08:30 ET, evento scartato", family, d, r["time"])
            continue
        evs[d] = EventSpec(f"{family}_{d.isoformat()}", family, ICS_SUMMARY[family],
                           t0, None, source="ff_history", status="released")
        added += 1
    out = [e for d, e in sorted(evs.items()) if d.year >= start_year and e.t0_utc < datetime.now(UTC)]
    log.info("%s: %d eventi dal %d (%d aggiunti da ForexFactory)", family, len(out), start_year, added)
    store_events(out)
    return out
