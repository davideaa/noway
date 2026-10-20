"""H-X37 (docs/IPOTESI-HX37-STOP-DALLA-CANDELA-PREVISTA.md): stop NFP = 30 pips + k x candela prevista (EW3, H-X32).
Stessa funzione trade e stessi prezzi S1 di H-X12 (hx12_atr_stop.py)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import MODE, load_ticks, quotes, trade  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.phase2 import hx5  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

KS = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]
BASE = 30  # pips di slittamento, idea di Davide
PER = {"IS 2014-19": (2014, 2019), "OOS 2020-26": (2020, 2026), "ultimi 3 anni": None, "tutto": (2014, 2026)}


def simula(ks):
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx11" / "site.json").read_text())
    a = json.loads((R / "hx16" / "hx32_ampiezza_nfp.json").read_text())
    est = {c["data"]: c["stima"] for c in a["casi_tutti"]} | {c["data"]: c["stima"] for c in a["recenti_fuori_dataset"] if "stima" in c}
    ev = [e for e in site["ev"] if e["f"] == "NFP" and e["rule"] and e["mv"] != 0]
    duka = DukascopyProvider()
    rows = []
    for e in ev:
        if e["d"][:10] not in est:
            print("senza stima", e["id"]); continue
        t0 = pd.Timestamp(e["d"], tz="UTC")
        t, bid, ask = load_ticks(duka, t0)
        b, q = quotes(bid, ask, "S1")
        d = 1 if e["rule"] == "LONG" else -1
        confs = {"fisso_60": 6.0, "rif_60_100": hx5.stop_usd(t0)} | {f"k{k:.2f}": (BASE + k * est[e["d"][:10]]) / 10 for k in ks}
        res = {}
        for name, stop in confs.items():
            tr = trade(t, b, q, d, stop, MODE["S1"])
            res[name] = {"stop_pips": round(stop * 10), "r": tr["r"], "raw": round(d * (tr["ex"] - tr["en"]) / stop, 3), "st": bool(tr["st"])}
        rows.append({"id": e["id"], "d": e["d"], "y": e["y"], "stima": est[e["d"][:10]], "res": res})
    return rows


def riassunto(rows, names):
    df = pd.DataFrame([{"d": r["d"], "y": r["y"], **{f"{n}|{k}": r["res"][n][k] for n in names for k in ("r", "raw", "st", "stop_pips")}} for r in rows])
    last3 = df.d >= "2023-10-01"
    out = {}
    for n in names:
        o = {}
        for p, ab in PER.items():
            s = last3 if ab is None else df.y.between(*ab)
            o[p] = {"n": int(s.sum()), "R": round(float(df[f"{n}|r"][s].mean()), 3), "R_vera": round(float(df[f"{n}|raw"][s].mean()), 3),
                    "stop_presi": round(float(df[f"{n}|st"][s].mean()), 3)}
        o["stop_mediano_per_anno"] = {int(y): int(g[f"{n}|stop_pips"].median()) for y, g in df.groupby("y")}
        out[n] = o
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    ks = list(KS)
    rows = simula(ks)
    names = ["fisso_60", "rif_60_100"] + [f"k{k:.2f}" for k in ks]
    S = riassunto(rows, names)
    meglio = lambda n: all(S[n][p]["R"] > max(S["fisso_60"][p]["R"], S["rif_60_100"][p]["R"]) for p in ("IS 2014-19", "OOS 2020-26"))  # noqa: E731
    best = max(ks, key=lambda k: S[f"k{k:.2f}"]["tutto"]["R"])
    # estensione della griglia se il migliore sta sul bordo (regola scritta prima)
    if best in (ks[0], ks[-1]):
        step = 0.05
        ext = [round(ks[0] - step * i, 2) for i in (1, 2) if ks[0] - step * i > 0] if best == ks[0] else [round(ks[-1] + step * i, 2) for i in (1, 2)]
        print("griglia estesa:", ext)
        extra = simula(ext)
        for r, x in zip(rows, extra):
            r["res"].update({k: v for k, v in x["res"].items() if k.startswith("k")})
        ks = sorted(ks + ext)
        names = ["fisso_60", "rif_60_100"] + [f"k{k:.2f}" for k in ks]
        S = riassunto(rows, names)
    passa = {f"k{k:.2f}": bool(meglio(f"k{k:.2f}") and 0 < i < len(ks) - 1 and meglio(f"k{ks[i - 1]:.2f}") and meglio(f"k{ks[i + 1]:.2f}"))
             for i, k in enumerate(ks)}
    out = {"base_pips": BASE, "k": ks, "riassunto": S, "passa": passa, "trade": rows}
    (R / "hx37_stop_candela.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    for n in names:
        print(n, {p: (S[n][p]["R"], S[n][p]["R_vera"], S[n][p]["stop_presi"]) for p in PER}, passa.get(n, ""))
    print({n: S[n]["stop_mediano_per_anno"] for n in names if n in ("k0.20", "fisso_60")})
