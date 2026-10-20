"""Descrittivo per H-X41 (dopo i risultati, non decide niente): quando scatta il break even (0,5R, senza TP) e cosa avrebbero fatto quei trade tenuti fino a 5 min."""
import json, sys
from pathlib import Path
S = Path(__file__).resolve().parent; sys.path.insert(0, str(S.parent)); sys.path.insert(0, str(S))
import numpy as np, pandas as pd
from hx41_be_tp import fav_fino, primo
from hx38_stop_contro import s4
from xnb.config import get_settings
from xnb.providers.dukascopy import DukascopyProvider
R = get_settings().research_dir / "phase2"
h = json.loads((R / "hx16" / "hx41_be_tp.json").read_text())
site = {e["id"]: e for e in json.loads((R / "hx11" / "site.json").read_text())["ev"]}
duka, rows = DukascopyProvider(), []
for ev in h["eventi"]:
    if ev["f"] != "NFP":
        continue
    e = site[ev["id"]]; t0 = pd.Timestamp(e["d"], tz="UTC")
    tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=6))
    t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
    b, a = s4(t, tk.bid.to_numpy(float), tk.ask.to_numpy(float))
    d = 1 if e["rule"] == "LONG" else -1; stop = ev["stop_pips"] / 10
    j = int(np.searchsorted(t, -60_000, side="right") - 1)
    k = np.nonzero((t > t[j]) & (t < 300_000))[0]; tt = t[k]
    fav, sp, fixed, en = fav_fino(t, b, a, d, 300_000)
    s_i, be_i = primo(fav <= -stop), primo(fav >= 0.5 * stop)
    if be_i is None or (s_i is not None and s_i < be_i):
        continue
    bs_i = primo(fav <= 0, be_i + 1)
    rows.append({"id": ev["id"], "y": ev["y"], "be_on_s": tt[be_i] / 1000, "be_out_s": tt[bs_i] / 1000 if bs_i is not None else None,
                 "U1": ev["U1"], "U5": ev["U5"], "noTP": ev["D5_noTP"]})
df = pd.DataFrame(rows); out = df[df.be_out_s.notna()]
print("break even attivato:", len(df), "su", sum(1 for e in h["eventi"] if e["f"] == "NFP"))
print("attivato entro +10 s:", int((df.be_on_s <= 10).sum()))
print("usciti a break even:", len(out), "| uscita entro +10 s:", int((out.be_out_s <= 10).sum()), "| +10..60 s:", int(((out.be_out_s > 10) & (out.be_out_s <= 60)).sum()), "| dopo 60 s:", int((out.be_out_s > 60).sum()))
print("quei trade usciti a BE, tenuti fino a 5 min (U5): media", round(out.U5.mean(), 3), "in guadagno", int((out.U5 > 0).sum()), "su", len(out), "| chiusi alle 14:31 (U1): media", round(out.U1.mean(), 3), "in guadagno", int((out.U1 > 0).sum()))
