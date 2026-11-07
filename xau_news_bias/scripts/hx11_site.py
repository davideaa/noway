"""H-X11 (docs/IPOTESI-HX11-SPREAD40.md): dati del sito NFP + CPI con tre scenari di spread.

Per ogni CPI e NFP dal 2014 (più quelle risolte dal vivo in live/hx8_live.jsonl):
- bias "contrario della release precedente" e calcolatore (H-X7);
- per ogni scenario di spread (S0 senza, S1 max 40 pips, S2 Dukascopy): candele 5 s bid/ask, prezzi alle
  14:29/14:30/14:31, trade LONG e SHORT (ingresso T0-60 s, stop 60/100 pips, uscita fine M1, -1R).
Scrive research_output/phase2/hx11/site.json e summary.json.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.phase2 import hx5  # noqa: E402
from xnb.phase2.ticktrade import SCENARIOS  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
BINS = np.arange(-120, 120, 5)
C = SCENARIOS["base"]
SPREAD_CAP = {"S0": 0.0, "S1": 4.0, "S2": None, "S3": 4.0}  # dollari; 4 $ = 40 pips
# S0 nessun costo; S1/S2 costi base; S3 (emendamento 1): lo spread conta solo per lo stop,
# ingresso e uscita al prezzo medio senza costi
MODE = {"S0": "none", "S1": "full", "S2": "full", "S3": "stop_only"}


def quotes(bid, ask, scen):
    mid, s = (bid + ask) / 2, ask - bid
    cap = SPREAD_CAP[scen]
    s2 = s if cap is None else np.minimum(s, cap)
    return mid - s2 / 2, mid + s2 / 2


def trade(t, b, a, d, stop, mode):
    j = int(np.searchsorted(t, -60_000, side="right") - 1)
    sp0 = a[j] - b[j]
    k = np.nonzero((t > t[j]) & (t < 60_000))[0]
    side, sp = (b[k] if d > 0 else a[k]), a[k] - b[k]
    if mode == "stop_only":
        mid = (b[k] + a[k]) / 2
        entry = (b[j] + a[j]) / 2
        hit = np.nonzero(d * (side - entry) <= -stop)[0]
        fav = d * (mid - entry)
        h, stopped = (int(hit[0]), True) if len(hit) else (len(k) - 1, False)
        ex = side[h] - d * C.stop_spreads * sp[h] if stopped else mid[h]
    else:
        fixed = C.bp * (b[j] + a[j]) / 2 if mode == "full" else 0.0
        entry = a[j] + C.entry_spreads * sp0 + fixed if d > 0 else b[j] - C.entry_spreads * sp0 - fixed
        fav = d * (side - entry)
        hit = np.nonzero(fav <= -stop)[0]
        h, stopped = (int(hit[0]), True) if len(hit) else (len(k) - 1, False)
        ex = side[h] - d * ((C.stop_spreads if stopped else C.exit_spreads) * sp[h] + fixed)
    return {"en": round(float(entry), 2), "sl": round(float(entry - d * stop), 2), "ex": round(float(ex), 2),
            "et": int(t[k][h]), "st": stopped, "r": round(float(max(d * (ex - entry) / stop, -1.0)), 3),
            "mfe": round(float(fav[: h + 1].max()), 2), "mae": round(float(fav[: h + 1].min()), 2),
            "sp0": round(float(sp0), 2), "spmax": round(float(sp.max()), 2)}


def first_minute_move(t, bid, ask):
    mid = (bid + ask) / 2
    i0 = int(np.searchsorted(t, 0, side="left") - 1)
    i1 = int(np.searchsorted(t, 60_000, side="left") - 1)
    return float(mid[i1] - mid[i0])


def load_ticks(duka, t0):
    tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=3))
    t0ms = int(t0.value // 1_000_000)
    return tk.ts_ms.to_numpy(np.int64) - t0ms, tk.bid.to_numpy(float), tk.ask.to_numpy(float)


def event_rows(duka, ev, pred):
    """ev: DataFrame event_id, family, t0_utc, year, mv, live (ordinata). Restituisce le righe del sito dal 2014."""
    rows, last = [], {}
    for r in ev.itertuples():
        prev = last.get(r.family)
        last[r.family] = r.mv
        if r.year < 2014:
            continue
        rule = None if prev is None or prev == 0 else ("SHORT" if prev > 0 else "LONG")
        q = pred.get(r.event_id)
        t, bid, ask = load_ticks(duka, r.t0_utc)
        if len(t) < 20:
            continue
        stop = hx5.stop_usd(r.t0_utc)
        j = int(np.searchsorted(t, -60_000, side="right") - 1)
        ref = (bid[j] + ask[j]) / 2
        ts = t / 1000
        sc = {}
        for s in SPREAD_CAP:
            b, a = quotes(bid, ask, s)
            cand = []
            for x in BINS:
                m = (ts >= x) & (ts < x + 5)
                if not m.any():
                    cand.append(None)
                    continue
                bb, aa = b[m], a[m]
                cand.append([int(round((v - ref) * 100)) for v in (bb[0], bb.max(), bb.min(), bb[-1], aa.max(), aa.min())])

            def px(ms, b=b, a=a):
                i = int(np.searchsorted(t, ms, side="right") - 1)
                return [round(float(b[i]), 2), round(float(a[i]), 2)]
            sc[s] = {"c": cand, "p29": px(-60_000), "p30": px(-1), "p31": px(59_999),
                     "L": trade(t, b, a, 1, stop, MODE[s]), "S": trade(t, b, a, -1, stop, MODE[s])}
        rows.append({"id": r.event_id, "f": r.family, "d": str(r.t0_utc)[:16], "y": int(r.year),
                     "live": bool(r.live), "mv": round(float(r.mv), 2), "stop": stop, "ref": round(float(ref), 2),
                     "rule": rule, "model": None if q is None else ("LONG" if q >= 0.5 else "SHORT"),
                     "pm": None if q is None else round(float(q), 3), "sc": sc})
    return rows


def live_events(path: Path) -> pd.DataFrame:
    """Release risolte dal vivo (record 'result' del registro live)."""
    cols = ["event_id", "family", "t0_utc", "year", "mv", "live"]
    res = [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines() if x.strip()] if path.exists() else []
    res = [x for x in res if x["type"] == "result"]
    if not res:
        return pd.DataFrame(columns=cols)
    return pd.DataFrame([{"event_id": x["event_id"], "family": x["family"], "t0_utc": pd.Timestamp(x["t0_utc"]),
                          "year": pd.Timestamp(x["t0_utc"]).year, "mv": x["mv"], "live": True} for x in res])


def summary(rows):
    per = {"IS 2014-19": lambda r: r["y"] <= 2019 and not r["live"], "OOS 2020-26": lambda r: 2020 <= r["y"] and not r["live"],
           "ultimi 3 anni": lambda r: r["d"] >= "2023-10-01" and not r["live"], "tutto": lambda r: not r["live"]}
    groups = {"NFP": ("NFP",), "CPI": ("CPI",), "entrambi": ("NFP", "CPI")}
    out = []
    for g, fams in groups.items():
        for pn, f in per.items():
            for src in ("rule", "model"):
                sel = [r for r in rows if r["f"] in fams and f(r) and r[src] and r["mv"] != 0]
                n = len(sel)
                hit = sum((r[src] == "LONG") == (r["mv"] > 0) for r in sel)
                o = {"gruppo": g, "periodo": pn, "bias": src, "n": n, "indovina": round(hit / n, 3) if n else None}
                for s in SPREAD_CAP:
                    b = np.array([r["sc"][s][r[src][0]]["r"] for r in sel])
                    op = np.array([r["sc"][s]["S" if r[src] == "LONG" else "L"]["r"] for r in sel])
                    rnd = (b + op) / 2
                    diff = b - op
                    bal = 10_000.0
                    for v in b:
                        bal += bal / 24 * v
                    o[s] = {"R_medio": round(float(b.mean()), 3), "R_caso": round(float(rnd.mean()), 3),
                            "vantaggio": round(float((b - rnd).mean()), 3),
                            "t": round(float(diff.mean() / (diff.std(ddof=1) / np.sqrt(n))), 2),
                            "vinti": round(float((b > 0).mean()), 3), "somma": round(float(b.sum()), 1), "soldi": round(bal)}
                out.append(o)
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    ev = pd.read_parquet(R / "p2_events.parquet")
    ev = ev[ev.a_ok.fillna(False).astype(bool) & ev.family.isin(["CPI", "NFP"]) & (ev.year >= 2013)]
    ev = ev.rename(columns={"a_move": "mv"})[["event_id", "family", "t0_utc", "year", "mv"]].assign(live=False)
    lv = live_events(ROOT / "live" / "hx8_live.jsonl")
    lv = lv[~lv.event_id.isin(ev.event_id)]
    ev = pd.concat([ev, lv], ignore_index=True).sort_values("t0_utc")
    pred = json.loads((R / "hx7" / "hx7_results.json").read_text())["pred_ALL"]
    duka = DukascopyProvider()
    rows = event_rows(duka, ev, pred)
    # controlli: il movimento dai tick deve essere quello del registro eventi; S2 deve rifare il sito NFP
    old = {e["id"]: e for e in json.loads((R / "hx8" / "nfp_site.json").read_text())["ev"]}
    d_tr = max(abs(r["sc"]["S2"][r["rule"][0]]["r"] - old[r["id"]]["tr"]["r"]) for r in rows if r["id"] in old)
    print("controllo S2 contro il sito NFP, differenza massima R:", d_tr)
    s = summary(rows)
    out_dir = R / "hx11"
    out_dir.mkdir(exist_ok=True)
    (out_dir / "site.json").write_text(json.dumps({"bins": BINS.tolist(), "ev": rows}, separators=(",", ":")), encoding="utf-8")
    (out_dir / "summary.json").write_text(json.dumps(s, indent=1), encoding="utf-8")
    flat = [{"gruppo": x["gruppo"], "periodo": x["periodo"], "bias": x["bias"], "n": x["n"], "indovina": x["indovina"],
             **{f"{k}_{m}": x[k][m] for k in SPREAD_CAP for m in ("R_medio", "vantaggio", "t")}} for x in s]
    pd.set_option("display.width", 250)
    print(pd.DataFrame(flat).to_string(index=False))
