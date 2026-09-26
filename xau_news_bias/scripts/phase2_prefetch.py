"""Fase 2: scarica in cache i dati di prezzo per CPI e NFP (una tantum, riprendibile).

Tick XAUUSD attorno a T0, candele M1 nei 4 giorni prima di ogni release per
XAUUSD, EURUSD, USDJPY, S&P 500 e Nasdaq 100, candele H1 storiche degli indici.
"""

import logging
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from xnb.logging_setup import setup_logging  # noqa: E402
from xnb.phase2.events import family_events  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

M1_SYMBOLS = ["XAUUSD", "EURUSD", "USDJPY", "USA500IDXUSD", "USATECHIDXUSD"]
INDEX_H1 = ["USA500IDXUSD", "USATECHIDXUSD"]

if __name__ == "__main__":
    setup_logging()
    log = logging.getLogger("xnb.phase2.prefetch")
    duka = DukascopyProvider()
    events = family_events("CPI") + family_events("NFP")
    jobs = []
    for e in events:
        d = (e.t0_utc - timedelta(days=4)).date()
        while d <= e.t0_utc.date():
            for s in M1_SYMBOLS:
                if s.endswith("IDXUSD") and d < date(2012, 6, 1):
                    continue
                jobs.append(("m1", s, d))
            d += timedelta(days=1)
        jobs.append(("tick", e.t0_utc))
    y, m = 2012, 6
    last = max(e.t0_utc for e in events).date()
    while (y, m) <= (last.year, last.month):
        for s in INDEX_H1:
            jobs.append(("h1", s, y, m))
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    jobs = list(dict.fromkeys(jobs))
    log.info("fase 2 prefetch: %d file", len(jobs))

    def run(j):
        if j[0] == "m1":
            duka.m1(j[1], j[2])
        elif j[0] == "h1":
            duka.h1(j[1], j[2], j[3])
        else:
            duka.ticks("XAUUSD", j[1] - timedelta(minutes=5), j[1] + timedelta(minutes=5))

    fails = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = [ex.submit(run, j) for j in jobs]
        for i, f in enumerate(as_completed(futs), 1):
            try:
                f.result()
            except Exception as exc:  # noqa: BLE001
                fails.append(str(exc)[:160])
            if i % 1000 == 0:
                log.info("prefetch %d/%d (errori %d)", i, len(jobs), len(fails))
    log.info("prefetch fase 2 completato: %d errori %s", len(fails), fails[:3])
