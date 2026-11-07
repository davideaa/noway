"""H-X44 (docs/IPOTESI-HX44-STOP-CON-MARGINE.md): stop = base × margine. Basi: formula del sito (H-X37) e percentili Q70, Q80,
Q90 di quanto il prezzo va contro quando la direzione è giusta, sulle 24 NFP prima (H-X38). Prezzi S4, tetto -1R."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import first_minute_move, load_ticks, trade  # noqa: E402
from hx38_stop_contro import NB, PER, contro, eventi, s4  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

BASI = ["B37", "Q70", "Q80", "Q90"]
MARGINI = [1.0, 1.1, 1.2, 1.3, 1.5]
PROPOSTE = [("B37", 1.2), ("Q80", 1.2)]


def calo_massimo(r):
    c = np.cumsum(r)
    return round(float((np.maximum.accumulate(np.concatenate([[0], c]))[1:] - c).max()), 2)


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    a = json.loads((R / "hx16" / "hx32_ampiezza_nfp.json").read_text())
    est = {c["data"]: c["stima"] for c in a["casi_tutti"]} | {c["data"]: c["stima"] for c in a["recenti_fuori_dataset"] if "stima" in c}
    h38 = {t["id"]: t["res"] for t in json.loads((R / "hx16" / "hx38_stop_contro.json").read_text())["trade"]}
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
        if e["rule"] and len(storia) >= NB and str(e["t0"].date()) in est:
            d = 1 if e["rule"] == "LONG" else -1
            j = np.searchsorted(t, -60_000, side="right") - 1
            px = (b[j] + q[j]) / 2
            prev = np.array(storia[-NB:])
            base = {"B37": (30 + 0.10 * est[str(e["t0"].date())]) / 10} | {f"Q{x}": float(np.quantile(prev, x / 100)) / 100 * px for x in (70, 80, 90)}
            res = {}
            for n, s0 in base.items():
                for m in MARGINI:
                    tr = trade(t, b, q, d, s0 * m, "full")
                    res[f"{n}x{m}"] = {"stop_pips": round(s0 * m * 10, 1), "r": tr["r"], "st": bool(tr["st"])}
            # controllo: base × 1,0 = H-X38 (hx37 e Q80), a meno dell'arrotondamento dello stop
            for n, k in (("B37", "hx37"), ("Q80", "Q80")):
                if e["id"] in h38 and k in h38[e["id"]]:
                    assert abs(res[f"{n}x1.0"]["r"] - h38[e["id"]][k]["r"]) < 0.02, (e["id"], n)
            rows.append({"id": e["id"], "d": str(e["t0"]), "y": e["y"], "giusta": bool(d == dwin), "res": res})
        storia.append(c)
        print(e["id"], flush=True)
    df = pd.DataFrame(rows)
    last3 = df.d >= "2023-10-01"

    def summ(n):
        r = df.res.map(lambda x: x[n]["r"])
        st = df.res.map(lambda x: x[n]["st"])
        out = {}
        for p, ab in PER.items():
            s = last3 if ab is None else df.y.between(*ab)
            g = s & df.giusta
            w, lo = r[s][r[s] > 0], r[s][r[s] <= 0]
            out[p] = {"n": int(s.sum()), "R": round(float(r[s].mean()), 3), "somma": round(float(r[s].sum()), 1),
                      "salvato": round(float(1 - st[g].astype(float).mean()), 3), "salvati": int((~st[g].astype(bool)).sum()), "giuste": int(g.sum()),
                      "RR": round(float(w.mean() / -lo.mean()), 2) if len(w) and len(lo) and lo.mean() < 0 else None,
                      "calo_massimo": calo_massimo(r[s].to_numpy())}
        out["stop_mediano_per_anno"] = {int(y): float(np.median([x[n]["stop_pips"] for x in g.res])) for y, g in df.groupby("y")}
        out["anno_2026"] = {"salvati": int((~df[(df.y == 2026) & df.giusta].res.map(lambda x: x[n]["st"])).sum()), "giuste": int(((df.y == 2026) & df.giusta).sum())}
        return out

    names = [f"{b}x{m}" for b in BASI for m in MARGINI]
    S = {n: summ(n) for n in names}
    ref = S["B37x1.0"]

    def ok(n):
        return all(S[n][p]["R"] >= ref[p]["R"] - 0.05 and S[n][p]["salvato"] > ref[p]["salvato"] for p in ("IS 2014-19", "OOS 2020-26"))

    def accettabile(b, m):  # lui e i due margini vicini
        i = MARGINI.index(m)
        return all(ok(f"{b}x{MARGINI[j]}") for j in (i - 1, i, i + 1))
    acc = {f"{b}x{m}": accettabile(b, m) for b, m in PROPOSTE}
    scelta = next((f"{b}x{m}" for b, m in PROPOSTE if acc[f"{b}x{m}"]), "B37x1.0")
    out = {"riassunto": S, "accettabile": acc, "scelta": scelta, "trade": rows}
    (R / "hx16" / "hx44_stop_margine.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    for n in names:
        v = S[n]
        print(n, {p: (v[p]["R"], v[p]["salvato"], v[p]["RR"], v[p]["calo_massimo"]) for p in PER}, "2026 stop", v["stop_mediano_per_anno"].get(2026), v["anno_2026"])
    print("accettabile", acc, "scelta", scelta)
