"""H-X13 (docs/IPOTESI-HX13-VOLATILITA-USCITE-LUNGHE.md): volatilità NFP per anno (A) e uscite oltre la M1 (B)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import C, quotes, trade  # noqa: E402
from hx12_atr_stop import atrs  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.phase2 import hx5  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

EXITS = {"U1": 60, "U2": 120, "U3": 180, "U5": 300, "U10": 600, "U15": 900}
PIP = 0.10


def trade_until(t, b, a, d, stop, end_s):
    """Come trade(..., "full") di hx11_site, ma con uscita a T0 + end_s. R col tetto -1R e perdita vera."""
    j = int(np.searchsorted(t, -60_000, side="right") - 1)
    sp0 = a[j] - b[j]
    k = np.nonzero((t > t[j]) & (t < end_s * 1000))[0]
    side, sp = (b[k] if d > 0 else a[k]), a[k] - b[k]
    fixed = C.bp * (b[j] + a[j]) / 2
    entry = a[j] + C.entry_spreads * sp0 + fixed if d > 0 else b[j] - C.entry_spreads * sp0 - fixed
    hit = np.nonzero(d * (side - entry) <= -stop)[0]
    h, stopped = (int(hit[0]), True) if len(hit) else (len(k) - 1, False)
    ex = side[h] - d * ((C.stop_spreads if stopped else C.exit_spreads) * sp[h] + fixed)
    raw = d * (ex - entry) / stop
    return round(float(max(raw, -1.0)), 3), round(float(raw), 3)


def mid_at(t, mid, ms):
    return float(mid[int(np.searchsorted(t, ms, side="left") - 1)])


def rng(t, mid, lo, hi):
    pre = mid_at(t, mid, 0)
    m = mid[(t >= lo) & (t < hi)]
    return float(max(m.max(), pre) - min(m.min(), pre)) if len(m) else 0.0


def event(duka, e, atr):
    t0 = pd.Timestamp(e["d"], tz="UTC")
    tk = duka.ticks("XAUUSD", (t0 - pd.Timedelta(minutes=3)).to_pydatetime(), (t0 + pd.Timedelta(minutes=16)).to_pydatetime())
    t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
    bid, ask = tk.bid.to_numpy(float), tk.ask.to_numpy(float)
    mid, sp = (bid + ask) / 2, ask - bid
    j = int(np.searchsorted(t, -60_000, side="right") - 1)
    p0 = mid_at(t, mid, 0)
    up = e["mv"] > 0
    b1, a1 = quotes(bid, ask, "S1")
    stop = hx5.stop_usd(t0)
    mae = trade(t, b1, a1, 1 if up else -1, 1e9, "full")["mae"]  # lato giusto, senza stop
    vol = {"atr_h1": atr["H1"] / PIP, "atr_m1": atr["M1"] / PIP, "sp0": sp[j] / PIP,
           "spmax10": sp[(t >= 0) & (t < 10_000)].max() / PIP, "salto3s": rng(t, mid, 0, 3_000) / PIP,
           "m1_mov": abs(mid_at(t, mid, 60_000) - p0) / PIP, "m1_range": rng(t, mid, 0, 60_000) / PIP,
           "m5_mov": abs(mid_at(t, mid, 300_000) - p0) / PIP, "m5_range": rng(t, mid, 0, 300_000) / PIP,
           "mae_giusto": -mae / PIP}
    ex = {}
    if e["rule"] and not e["live"]:
        d = 1 if e["rule"] == "LONG" else -1
        for name, s in EXITS.items():
            r, r_raw = trade_until(t, b1, a1, d, stop, s)
            o, o_raw = trade_until(t, b1, a1, -d, stop, s)
            mv = mid_at(t, mid, s * 1000) - p0
            ex[name] = {"r": r, "o": o, "r_raw": r_raw, "o_raw": o_raw, "hit": bool(mv != 0 and (mv > 0) == (d > 0))}
        assert abs(ex["U1"]["r"] - e["sc"]["S1"][e["rule"][0]]["r"]) < 1e-3, e["id"]  # controllo: U1 = sito S1
    return {"id": e["id"], "d": e["d"], "y": e["y"], "live": e["live"], "vol": {k: round(float(v), 1) for k, v in vol.items()}, "ex": ex}


def tables(rows):
    va = pd.DataFrame([{"anno": r["y"], **r["vol"]} for r in rows])
    g = va.groupby("anno")
    a = g.median().round(0).astype(int)
    a.insert(0, "NFP", g.size())
    a["mae_p80"] = g.mae_giusto.quantile(0.8).round(0).astype(int)
    a["mae_p90"] = g.mae_giusto.quantile(0.9).round(0).astype(int)
    per = {"IS 2014-19": lambda r: r["y"] <= 2019, "OOS 2020-26": lambda r: r["y"] >= 2020,
           "ultimi 3 anni": lambda r: r["d"] >= "2023-10-01", "tutto": lambda r: True}
    out = []
    hist = [r for r in rows if r["ex"]]
    for name in EXITS:
        for pn, f in per.items():
            sel = [r["ex"][name] for r in hist if f(r)]
            n = len(sel)
            for loss, sfx in (("tetto -1R", ""), ("perdita vera", "_raw")):
                b = np.array([x["r" + sfx] for x in sel])
                o = np.array([x["o" + sfx] for x in sel])
                diff = b - o
                out.append({"uscita": name, "periodo": pn, "perdita": loss, "n": n,
                            "indovina": round(sum(x["hit"] for x in sel) / n, 3), "R_medio": round(b.mean(), 3),
                            "R_caso": round(((b + o) / 2).mean(), 3), "vantaggio": round((diff / 2).mean(), 3),
                            "t": round(diff.mean() / (diff.std(ddof=1) / np.sqrt(n)), 2), "somma": round(b.sum(), 1),
                            "vinti": int((b > 0).sum())})
    return a, pd.DataFrame(out)


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx11" / "site.json").read_text())
    atr = {x["id"]: x["atr"] for x in json.loads((R / "hx11" / "hx12_atr_stop.json").read_text())}
    duka = DukascopyProvider()
    rows = []
    for e in site["ev"]:
        if e["f"] != "NFP" or e["mv"] == 0:
            continue
        a = atr.get(e["id"]) or atrs(duka, pd.Timestamp(e["d"], tz="UTC"))
        rows.append(event(duka, e, a))
    vol, ex = tables(rows)
    (R / "hx11" / "hx13_vol_exits.json").write_text(json.dumps({"eventi": rows, "volatilita": vol.reset_index().to_dict("records"),
                                                               "uscite": ex.to_dict("records")}, indent=1), encoding="utf-8")
    pd.set_option("display.width", 250)
    print("controllo U1 = sito S1: ok su", sum(1 for r in rows if r["ex"]), "NFP\n")
    print(vol.to_string())
    for loss in ("tetto -1R", "perdita vera"):
        print("\n=====", loss)
        print(ex[ex.perdita == loss].drop(columns="perdita").to_string(index=False))
