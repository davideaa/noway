"""H-X18 (docs/IPOTESI-HX18-INVERSIONE-DOPO-CANDELA.md): dopo la prima M1, a T0+5 min l'oro torna indietro? Altre 9 famiglie rosse."""
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import binom  # noqa: E402

from hx15_final import fetch_final  # noqa: E402
from xnb.config import get_settings  # noqa: E402

FAMS = ["FOMC", "VERBALI", "PIL", "ISM_M", "ISM_S", "ADP", "FIDUCIA", "MICHIGAN", "CLAIMS"]


def fetch_retry(t0):
    import time
    for k in range(7):
        try:
            return fetch_final(t0)
        except Exception:  # noqa: BLE001  (il datafeed risponde a volte 503)
            time.sleep(5 * 2 ** k)
    raise RuntimeError(f"tick non scaricabili per {t0}")


def measure(p: Path):
    z = np.load(p)
    t, bid, ask = z["t"], z["bid"], z["ask"]
    pre = np.nonzero(t < 0)[0]
    if not len(pre) or t[pre[-1]] < -120_000 or ((t >= 0) & (t < 60_000)).sum() < 5 or not len(t) or t.max() < 300_000:
        return None
    mid = (bid + ask) / 2

    def at(ms):
        return float(mid[int(np.searchsorted(t, ms, side="left") - 1)])
    p0, p1, p5 = float(mid[pre[-1]]), at(60_000), at(300_000)
    w = mid[(t >= 0) & (t < 60_000)]
    rng = float(max(w.max(), p0) - min(w.min(), p0))
    mv = p1 - p0
    if mv == 0:
        return None
    after = np.sign(mv) * (p5 - p1)  # positivo = continua, negativo = torna indietro
    return {"mv": mv / 0.1, "rng": rng / 0.1, "dopo": after / 0.1}


def stats(g):
    n = len(g)
    if not n:
        return {"n": 0}
    inv = int((g.dopo < 0).sum())
    fade = -g.dopo  # pips di chi va contro la candela da T0+1 a T0+5 min
    return {"n": n, "inversioni": inv, "quota": round(inv / n, 3), "p": float(binom.sf(inv - 1, n, 0.5)),
            "pips_mediana": round(float(fade.median()), 1), "pips_media": round(float(fade.mean()), 1),
            "frazione_candela": round(float((g.dopo / g.rng).median()), 3),
            "netto_10": round(float(fade.mean() - 10), 1), "netto_20": round(float(fade.mean() - 20), 1)}


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    cal = pd.read_parquet(R / "hx15" / "calendario_tutti.parquet")
    old = pd.read_parquet(R / "hx15" / "slots_2008_2023.parquet")
    new = cal[cal.fam.isin(FAMS) & (cal.t0 >= pd.Timestamp("2024-01-01", tz="UTC"))
              & (cal.t0 < pd.Timestamp.now(tz="UTC") - pd.Timedelta(hours=1))].reset_index(drop=True)
    flag = R / "hx15" / "HX18_2024_26_APERTO.json"
    flag.write_text(json.dumps({"aperto_utc": pd.Timestamp.now(tz="UTC").isoformat(), "famiglie": FAMS, "slot": len(new)}))
    with ThreadPoolExecutor(4) as ex:
        paths = list(ex.map(fetch_retry, new.t0))
    rows = []
    for (_, r), p in zip(new.iterrows(), paths):
        m = measure(p)
        if m:
            rows.append({"t0": r.t0, "fam": r.fam, "y": r.t0.year, **m})
    test = pd.DataFrame(rows)
    # confronto: stesse famiglie 2011-2023 (già viste)
    oldr = []
    o = old[old.fam.isin(FAMS) & old.ok & (old.t0.dt.year >= 2011)]
    for r in o.itertuples():
        m = measure(Path("data/p2_cache/hx15") / f"{r.t0:%Y%m%d_%H%M}.npz")
        if m:
            oldr.append({"t0": r.t0, "fam": r.fam, "y": r.t0.year, **m})
    ref = pd.DataFrame(oldr)
    out = {"TEST_2024_26": stats(test), "per_famiglia_2024_26": {f: stats(g) for f, g in test.groupby("fam")},
           "confronto_2011_18": stats(ref[ref.y <= 2018]), "confronto_2019_23": stats(ref[ref.y >= 2019])}
    out["passa"] = bool(out["TEST_2024_26"]["quota"] > 0.5 and out["TEST_2024_26"]["p"] < 0.05)
    (R / "hx16" / "hx18_inversione.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps(out, indent=1))
