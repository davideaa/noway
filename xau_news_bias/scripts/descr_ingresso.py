"""Solo descrittivo (non pre-registrato, nessuna decisione; docs/DESCRITTIVO-ORA-DI-INGRESSO.md): stesso trade NFP (regola H-X8, stop H-X37, prezzi S4, uscita 14:31) con ingresso a 14:29:00, 14:29:30, 14:29:45."""
import json
import sys
from pathlib import Path
S = Path(__file__).resolve().parent
sys.path.insert(0, str(S.parent)); sys.path.insert(0, str(S))
import numpy as np, pandas as pd
from hx11_site import C
from hx38_stop_contro import s4
from xnb.config import get_settings
from xnb.providers.dukascopy import DukascopyProvider

def trade_at(t, b, a, d, stop, en_ms, ex_ms=60_000):
    j = int(np.searchsorted(t, en_ms, side="right") - 1)
    sp0 = a[j] - b[j]
    k = np.nonzero((t > t[j]) & (t < ex_ms))[0]
    side, sp = (b[k] if d > 0 else a[k]), a[k] - b[k]
    fixed = C.bp * (b[j] + a[j]) / 2
    entry = a[j] + C.entry_spreads * sp0 + fixed if d > 0 else b[j] - C.entry_spreads * sp0 - fixed
    fav = d * (side - entry)
    hit = np.nonzero(fav <= -stop)[0]
    h, stopped = (int(hit[0]), True) if len(hit) else (len(k) - 1, False)
    ex = side[h] - d * ((C.stop_spreads if stopped else C.exit_spreads) * sp[h] + fixed)
    return float(max(d * (ex - entry) / stop, -1.0)), bool(stopped), float(sp0 * 10)

R = get_settings().research_dir / "phase2"
site = json.loads((R / "hx11" / "site.json").read_text())
st37 = {t["id"]: t["res"]["hx37"]["stop_pips"] for t in json.loads((R / "hx16" / "hx38_stop_contro.json").read_text())["trade"]}
duka = DukascopyProvider()
E = {"14:29:00": -60_000, "14:29:30": -30_000, "14:29:45": -15_000}
rows = []
for e in site["ev"]:
    if e["f"] != "NFP" or not e["rule"] or e["mv"] == 0 or e["y"] < 2014 or e["id"] not in st37:
        continue
    t0 = pd.Timestamp(e["d"], tz="UTC")
    tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=6))
    t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
    if len(t) < 10:
        continue
    b, a = s4(t, tk.bid.to_numpy(float), tk.ask.to_numpy(float))
    d = 1 if e["rule"] == "LONG" else -1
    giusta = np.sign(e["mv"]) == d
    r = {"id": e["id"], "y": e["y"], "d": e["d"], "giusta": bool(giusta)}
    for n, ms in E.items():
        r[n], r[n + "_st"], r[n + "_sp"] = trade_at(t, b, a, d, st37[e["id"]] / 10, ms)
    rows.append(r)
df = pd.DataFrame(rows)
per = {"2014-19": df.y.between(2014, 2019), "2020-26": df.y >= 2020, "ultimi 3 anni": df.d >= "2023-10-01", "tutto": df.y >= 2014}
for p, m in per.items():
    print(p, int(m.sum()), {n: (round(df[n][m].mean(), 3), round(df[n][m].sum(), 1)) for n in E})
g = df[df.giusta]
print("salvato quando giusta", {n: f"{int((~g[n + '_st']).sum())}/{len(g)}" for n in E})
print("spread all'ingresso mediano pips", {n: round(df[n + "_sp"].median(), 1) for n in E})
h39 = {e["id"]: e["B"] for e in json.loads((R / "hx16" / "hx39_sorpresa.json").read_text())["eventi"] if e["f"] == "NFP"}
print("controllo 14:29:00 = B di hx39:", sum(abs(round(r["14:29:00"], 3) - h39[r["id"]]) < 1e-6 for r in rows if r["id"] in h39), "su", len(rows))
