"""H-X46 (docs/IPOTESI-HX46-STOP-DALLE-ULTIME-NFP.md): stop = (media o massimo di quanto è andato contro il lato giusto
nelle ultime k NFP) × 1,2. Prezzi S4, tetto -1R, stesso trade di H-X44."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import first_minute_move, load_ticks, trade  # noqa: E402
from hx38_stop_contro import PER, contro, eventi, s4  # noqa: E402
from hx44_stop_margine import calo_massimo  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

KS = [3, 4, 5, 6, 8, 12]
MARG = 1.2


def t_appaiata(a, b):
    d = np.asarray(a) - np.asarray(b)
    return {"n": int(len(d)), "diff_media": round(float(d.mean()), 3), "t": round(float(d.mean() / (d.std(ddof=1) / np.sqrt(len(d)))), 2)}


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    h44 = {t["id"]: t["res"] for t in json.loads((R / "hx16" / "hx44_stop_margine.json").read_text())["trade"]}
    duka = DukascopyProvider()
    storia, rows = [], []
    for e in eventi():
        t, bid, ask = load_ticks(duka, e["t0"])
        if len(t) < 10:
            continue
        b, q = s4(t, bid, ask)
        mv = e["mv"] if e["mv"] is not None else first_minute_move(t, bid, ask)
        if mv == 0:
            continue
        dwin = 1 if mv > 0 else -1
        c = contro(t, b, q, dwin)
        if e["rule"] and e["id"] in h44 and len(storia) >= max(KS):
            d = 1 if e["rule"] == "LONG" else -1
            j = np.searchsorted(t, -60_000, side="right") - 1
            px = (b[j] + q[j]) / 2
            res = {}
            for k in KS:
                w = np.array(storia[-k:])
                for nome, v in (("MED", w.mean()), ("MAX", w.max())):
                    stop = max(float(v), 0.01) * MARG / 100 * px
                    tr = trade(t, b, q, d, stop, "full")
                    res[f"{nome}{k}"] = {"stop_pips": round(stop * 10, 1), "r": tr["r"], "st": bool(tr["st"])}
            for n in ("B37x1.0", "B37x1.2"):
                res[n] = h44[e["id"]][n]
            rows.append({"id": e["id"], "d": str(e["t0"]), "y": e["y"], "giusta": bool(d == dwin), "res": res})
        storia.append(c)
        print(e["id"], flush=True)
    df = pd.DataFrame(rows)
    last3 = df.d >= "2023-10-01"
    names = [f"{s}{k}" for s in ("MED", "MAX") for k in KS] + ["B37x1.0", "B37x1.2"]

    def col(n, f):
        return df.res.map(lambda x: x[n][f])

    def summ(n):
        r, st = col(n, "r"), col(n, "st").astype(bool)
        out = {}
        for p, ab in PER.items():
            s = last3 if ab is None else df.y.between(*ab)
            g = s & df.giusta
            w, lo = r[s][r[s] > 0], r[s][r[s] <= 0]
            out[p] = {"n": int(s.sum()), "R": round(float(r[s].mean()), 3), "salvato": round(float(1 - st[g].mean()), 3),
                      "RR": round(float(w.mean() / -lo.mean()), 2), "calo_massimo": calo_massimo(r[s].to_numpy())}
        out["stop_mediano_per_anno"] = {int(y): float(np.median([x[n]["stop_pips"] for x in g.res])) for y, g in df.groupby("y")}
        out["t_vs_B37x1.2"] = t_appaiata(r, col("B37x1.2", "r"))
        out["t_vs_B37x1.0"] = t_appaiata(r, col("B37x1.0", "r"))
        return out
    S = {n: summ(n) for n in names}

    def batte(n):
        return all(S[n][p]["R"] > S["B37x1.2"][p]["R"] for p in ("IS 2014-19", "OOS 2020-26"))
    funz = {}
    for s in ("MED", "MAX"):
        for i, k in enumerate(KS):
            vic = [f"{s}{KS[j]}" for j in (i - 1, i + 1) if 0 <= j < len(KS)]
            funz[f"{s}{k}"] = bool(0 < i < len(KS) - 1 and batte(f"{s}{k}") and all(batte(v) for v in vic))
    px_now = json.loads((R / "hx16" / "hx32_ampiezza_nfp.json").read_text())["prossima"]["prezzo"]
    prossima = {f"{s}{k}": round(float((np.mean if s == "MED" else np.max)(storia[-k:])) * MARG / 100 * px_now * 10) for s in ("MED", "MAX") for k in KS}
    out = {"riassunto": S, "funziona": funz, "prossima": prossima, "trade": rows}
    (R / "hx16" / "hx46_stop_ultime.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    print("NFP", len(df), df.d.min()[:10], "→", df.d.max()[:10])
    for n in names:
        v = S[n]
        print(n, {p: (v[p]["R"], v[p]["salvato"], v[p]["calo_massimo"]) for p in PER}, "t vs B37x1.2", v["t_vs_B37x1.2"]["t"],
              "stop 2014/19/24/26", [v["stop_mediano_per_anno"].get(y) for y in (2014, 2019, 2024, 2026)], "prossima", prossima.get(n))
    print("funziona", {k: v for k, v in funz.items() if v} or "nessuna")
