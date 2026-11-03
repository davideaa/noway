"""Sensibilità dello stop del sito (B37 x 1,2) allo spread del broker e all'ora d'ingresso
(docs/SENSIBILITA-STOP-SPREAD.md). Varianti A-E, stesse NFP e stessi stop di H-X44."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import C, load_ticks, quotes  # noqa: E402
from hx38_stop_contro import PER, eventi  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

# nome: (spread minimo in $, da ms, a ms, tutto dal lato dello stop, ingresso ms)
VAR = {"A": (3.0, -20_000, 10_000, False, -60_000), "B": (3.0, -20_000, 10_000, False, -30_000),
       "C": (4.0, -20_000, 10_000, False, -30_000), "D": (4.0, -20_000, 30_000, False, -30_000),
       "E": (4.0, -20_000, 10_000, True, -30_000),
       # aggiunte dopo aver visto A-E (non decidono): la proposta della regola, stop + 10 pips
       "B+10": (3.0, -20_000, 10_000, False, -30_000, 1.0), "C+10": (4.0, -20_000, 10_000, False, -30_000, 1.0)}


def prezzi(t, bid, ask, d, minsp, da, a, lato):
    b, q = quotes(bid, ask, "S1")
    w = (t >= da) & (t <= a)
    if lato:  # si apre solo il lato che chiude la posizione
        if d > 0:
            return np.where(w, np.minimum(b, q - minsp), b), q
        return b, np.where(w, np.maximum(q, b + minsp), q)
    mid, s = (b + q) / 2, q - b
    s2 = np.where(w, np.maximum(s, minsp), s)
    return mid - s2 / 2, mid + s2 / 2


def trade(t, b, a, d, stop, ingresso):
    """Come trade(..., "full") di hx11_site, con l'ora d'ingresso come parametro."""
    j = int(np.searchsorted(t, ingresso, side="right") - 1)
    sp0 = a[j] - b[j]
    k = np.nonzero((t > t[j]) & (t < 60_000))[0]
    side, sp = (b[k] if d > 0 else a[k]), a[k] - b[k]
    fixed = C.bp * (b[j] + a[j]) / 2
    entry = a[j] + C.entry_spreads * sp0 + fixed if d > 0 else b[j] - C.entry_spreads * sp0 - fixed
    fav = d * (side - entry)
    hit = np.nonzero(fav <= -stop)[0]
    h, stopped = (int(hit[0]), True) if len(hit) else (len(k) - 1, False)
    ex = side[h] - d * ((C.stop_spreads if stopped else C.exit_spreads) * sp[h] + fixed)
    return max(d * (ex - entry) / stop, -1.0), stopped


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    h44 = {t["id"]: t for t in json.loads((R / "hx16" / "hx44_stop_margine.json").read_text())["trade"]}
    duka = DukascopyProvider()
    rows = []
    for e in eventi():
        if e["id"] not in h44 or not e["rule"]:
            continue
        t, bid, ask = load_ticks(duka, e["t0"])
        if len(t) < 10:
            continue
        d = 1 if e["rule"] == "LONG" else -1
        stop = h44[e["id"]]["res"]["B37x1.2"]["stop_pips"] / 10
        row = {"id": e["id"], "d": str(e["t0"]), "y": e["y"], "giusta": h44[e["id"]]["giusta"], "rif": h44[e["id"]]["res"]["B37x1.2"]["r"]}
        for n, (ms, da, a, lato, ing, *piu) in VAR.items():
            b, q = prezzi(t, bid, ask, d, ms, da, a, lato)
            row[n], row[n + "_st"] = trade(t, b, q, d, stop + (piu[0] if piu else 0.0), ing)
        rows.append(row)
        print(e["id"], flush=True)
    df = pd.DataFrame(rows)
    df.to_csv(R / "hx16" / "sens_stop_spread.csv", index=False)
    last3 = df.d >= "2023-10-01"
    out = {"n": len(df), "controllo_A_uguale_a_hx44": int((df.A.round(3) - df.rif).abs().lt(0.002).sum()), "varianti": {}}
    for n in VAR:
        v = {}
        for p, ab in PER.items():
            s = last3 if ab is None else df.y.between(*ab)
            g = s & df.giusta
            v[p] = {"n": int(s.sum()), "R": round(float(df.loc[s, n].mean()), 3), "salvate": round(float(1 - df.loc[g, n + "_st"].mean()), 3)}
        v["cambiano_esito_rispetto_ad_A"] = int((df[n + "_st"] != df["A_st"]).sum())
        dd = (df[n] - df.A)[df.y >= 2020]
        v["t_contro_A_2020_26"] = round(float(dd.mean() / (dd.std(ddof=1) / np.sqrt(len(dd)))), 2) if dd.std(ddof=1) > 0 else None
        out["varianti"][n] = v
    a, c = out["varianti"]["A"]["OOS 2020-26"], out["varianti"]["C"]["OOS 2020-26"]
    out["aggiungere_10_pips"] = bool(a["R"] - c["R"] > 0.05 or a["salvate"] - c["salvate"] > 0.05)
    (R / "hx16" / "sens_stop_spread.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(out, indent=1, ensure_ascii=False))
