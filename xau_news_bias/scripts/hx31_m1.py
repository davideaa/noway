"""H-X31, emendamento 1: stesse regole con le candele M1 (ordine prudente dentro il minuto)."""
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import pandas as pd  # noqa: E402

import hx31_trading_livelli as M  # noqa: E402
from hx28_livelli import H2, checkpoints, walk  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

DK = DukascopyProvider()


def m1_direct(d):
    """Stesse candele M1 Dukascopy, prese direttamente dal datafeed storico (jetta per i giorni vecchi risponde 202 e rallenta)."""
    base = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    rel = f"XAUUSD/{d.year}/{d.month - 1:02d}/{d.day:02d}/BID_candles_min_1.bi5"
    return DK._candles(rel, base, base + timedelta(days=1), "XAUUSD")


def m1_retry(d):
    for wait in (0, 5, 20, 60, 120):
        time.sleep(wait)
        try:
            return d, m1_direct(d)
        except Exception as e:  # il datafeed risponde 503 a volte
            err = e
    print("M1 non disponibile", d, err)
    return d, None


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    h1 = DK.h1_range("XAUUSD", date(2012, 1, 1), date(2026, 10, 16))
    df = checkpoints(h1, "D")
    cur = (h1.index[-1] + H2).normalize().tz_localize(None)
    df = df[df.key < cur]
    x = walk(df, "C")
    cps = x[x.k.isin(M.KS)].copy()
    cps["t_end"] = cps.index + pd.Timedelta(hours=1)          # fine della candela H1 del controllo
    days = sorted({t.date() for t in cps.t_end})
    with ThreadPoolExecutor(8) as ex:
        m1 = dict(ex.map(m1_retry, days))
    rows, mancanti = [], 0
    for r in cps.itertuples():
        bars = m1.get(r.t_end.date())
        if bars is None or not len(bars):
            mancanti += 1
            continue
        stop = r.t_end.normalize() + pd.Timedelta(hours=22)
        b = bars[(bars.index >= r.t_end) & (bars.index < stop)][["h", "l", "c"]].to_numpy()
        if not len(b):
            mancanti += 1
            continue
        adr = r.O / 100 * r.S
        orders = {
            "R1": [(-1, r.su90, r.su_tip, r.su90 + .2 * adr, True), (1, r.giu90, r.giu_tip, r.giu90 - .2 * adr, False)],
            "R2": [(-1, r.su_tip, r.P, r.su90, True), (1, r.giu_tip, r.P, r.giu90, False)],
            "R3": [(1, r.su_tip, r.su90, r.P, True), (-1, r.giu_tip, r.giu90, r.P, False)],
        }
        for code, lst in orders.items():
            for side, e, tp, sl, upper in lst:
                res = M.run_order(b, side, e, tp, sl, upper)
                if res is not None:
                    rows.append({"regola": code, "k": int(r.k), "y": int(r.y), "lato": "su" if upper else "giu", "R": res})
    t = pd.DataFrame(rows)
    res = M.summary(t)
    res["_controlli"] = {"controlli": int(len(cps)), "senza_M1": mancanti, "giorni_M1": len(days)}
    (R / "hx31_m1.json").write_text(json.dumps(res, indent=1, default=float), encoding="utf-8")
    print(res["_controlli"])
    for k, v in res.items():
        if k.startswith("_"):
            continue
        print(k, {p: (v[p]["n"], v[p]["vinti"], v[p]["R_medio"]) for p in M.PERIODS}, v["2019-26"], "holm", v["p_holm"], "FUNZIONA" if v["funziona"] else "")
