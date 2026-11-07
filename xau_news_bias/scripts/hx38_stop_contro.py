"""H-X38 (docs/IPOTESI-HX38-STOP-DA-QUANTO-VA-CONTRO.md): stop NFP = percentile di quanto il prezzo è andato contro, quando la
direzione era giusta, nelle 24 NFP precedenti. Prezzi S4 = S1 con spread almeno 30 pips da -20 s a +10 s."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import first_minute_move, load_ticks, quotes, trade  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.phase2 import hx5  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

QS = [0.5, 0.6, 0.7, 0.8, 0.9]
NB = 24
PER = {"IS 2014-19": (2014, 2019), "OOS 2020-26": (2020, 2026), "ultimi 3 anni": None, "tutto": (2014, 2026)}


def s4(t, bid, ask):
    """S1 più lo spread del broker di Davide: almeno 30 pips (3 $) da 20 s prima a 10 s dopo la news."""
    b, q = quotes(bid, ask, "S1")
    mid, s = (b + q) / 2, q - b
    s2 = np.where((t >= -20_000) & (t <= 10_000), np.maximum(s, 3.0), s)
    return mid - s2 / 2, mid + s2 / 2


def contro(t, b, q, dwin):
    """Massima escursione contro il lato giusto dall'ingresso T0-60 s a T0+60 s, senza stop, in % del prezzo d'ingresso."""
    tr = trade(t, b, q, dwin, 1e9, "full")
    return max(0.0, -tr["mae"]) / tr["en"] * 100


def eventi():
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx11" / "site.json").read_text())
    ev = [{"id": e["id"], "t0": pd.Timestamp(e["d"], tz="UTC"), "y": e["y"], "rule": e["rule"], "mv": e["mv"]}
          for e in site["ev"] if e["f"] == "NFP" and e["rule"] and e["mv"] != 0]
    cn = pd.read_parquet(R / "hx15" / "cpi_nfp.parquet")
    prima = [{"id": f"NFP_{t.date()}", "t0": t, "y": t.year, "rule": None, "mv": None}
             for t in cn[(cn.fam == "NFP") & (cn.t0 >= "2012-01-01") & (cn.t0 < "2014-01-01")].t0]
    return sorted(prima + ev, key=lambda e: e["t0"])


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    a = json.loads((R / "hx16" / "hx32_ampiezza_nfp.json").read_text())
    est = {c["data"]: c["stima"] for c in a["casi_tutti"]} | {c["data"]: c["stima"] for c in a["recenti_fuori_dataset"] if "stima" in c}
    duka = DukascopyProvider()
    storia, rows = [], []
    qs = list(QS)
    for e in eventi():
        t, bid, ask = load_ticks(duka, e["t0"])
        if len(t) < 10:
            print("niente tick", e["id"]); continue
        b, q = s4(t, bid, ask)
        mv = e["mv"] if e["mv"] is not None else first_minute_move(t, bid, ask)
        if mv == 0:
            continue
        dwin = 1 if mv > 0 else -1
        c = contro(t, b, q, dwin)
        if e["rule"] and len(storia) >= NB:
            d = 1 if e["rule"] == "LONG" else -1
            px = (b[np.searchsorted(t, -60_000, side="right") - 1] + q[np.searchsorted(t, -60_000, side="right") - 1]) / 2
            prev = np.array(storia[-NB:])
            confs = {"fisso_60": 6.0, "rif_60_100": hx5.stop_usd(e["t0"])}
            if str(e["t0"].date()) in est:
                confs["hx37"] = (30 + 0.10 * est[str(e["t0"].date())]) / 10
            confs |= {f"Q{int(x * 100)}": float(np.quantile(prev, x)) / 100 * px for x in qs + [0.4, 0.95]}
            res = {}
            for n, stop in confs.items():
                tr = trade(t, b, q, d, stop, "full")
                res[n] = {"stop_pips": round(stop * 10), "r": tr["r"], "st": bool(tr["st"])}
            rows.append({"id": e["id"], "d": str(e["t0"]), "y": e["y"], "giusta": bool(d == dwin), "contro_pips": round(c / 100 * px * 10), "res": res})
        storia.append(c)
        print(e["id"], round(c / 100 * 4000 * 10), flush=True)
    df = pd.DataFrame(rows)
    last3 = df.d >= "2023-10-01"

    def summ(n):
        r = df.res.map(lambda x: x[n]["r"] if n in x else np.nan)
        st = df.res.map(lambda x: x[n]["st"] if n in x else np.nan)
        out = {}
        for p, ab in PER.items():
            s = (last3 if ab is None else df.y.between(*ab)) & r.notna()
            g = s & df.giusta
            out[p] = {"n": int(s.sum()), "R": round(float(r[s].mean()), 3), "salvato": round(float(1 - st[g].astype(float).mean()), 3)}
        return out

    names = ["fisso_60", "rif_60_100", "hx37"] + [f"Q{int(x * 100)}" for x in [0.4] + qs + [0.95]]
    S = {n: summ(n) for n in names}
    base = ["fisso_60", "rif_60_100", "hx37"]
    meglio = lambda n: all(S[n][p]["R"] > max(S[b][p]["R"] for b in base) for p in ("IS 2014-19", "OOS 2020-26"))  # noqa: E731
    best = max(qs, key=lambda x: S[f"Q{int(x * 100)}"]["tutto"]["R"])
    if best == qs[0]:
        qs = [0.4] + qs
    elif best == qs[-1]:
        qs = qs + [0.95]
    grid = [f"Q{int(x * 100)}" for x in qs]
    passa = {n: bool(0 < i < len(grid) - 1 and meglio(n) and meglio(grid[i - 1]) and meglio(grid[i + 1])) for i, n in enumerate(grid)}
    hx37_s4 = bool(all(S["hx37"][p]["R"] > max(S["fisso_60"][p]["R"], S["rif_60_100"][p]["R"]) for p in ("IS 2014-19", "OOS 2020-26")))
    out = {"griglia": grid, "esteso": best in (QS[0], QS[-1]), "riassunto": S, "passa": passa, "hx37_regge_con_S4": hx37_s4, "trade": rows}
    (R / "hx16" / "hx38_stop_contro.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    for n in names:
        print(n, {p: (S[n][p]["R"], S[n][p]["salvato"], S[n][p]["n"]) for p in PER}, passa.get(n, ""))
    print("griglia", grid, "hx37 regge con S4:", hx37_s4)
