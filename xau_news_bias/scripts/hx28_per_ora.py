"""H-X28, descrittivo dopo i risultati: affidabilità per fascia oraria e calibrazione della probabilità (2023-26)."""
import sys, json
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent)); sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent.parent))
from datetime import date
import pandas as pd, numpy as np
from hx28_livelli import checkpoints, walk
from xnb.config import get_settings
from xnb.providers.dukascopy import DukascopyProvider
h1 = DukascopyProvider().h1_range("XAUUSD", date(2012, 1, 1), date.today())
df = checkpoints(h1, "D"); df = df[df.key < df.key.max()]
x = walk(df, "C"); s = x[x.y >= 2023]
rows = []
for tb, g in s.groupby("tb"):
    nu, nv = g.u > 0, g.v > 0
    rows.append({"tb": int(tb), "n": len(g), "p_su_prev": round(g.pu.mean(), 3), "p_su_vera": round(nu.mean(), 3),
                 "p_giu_prev": round(g.pv.mean(), 3), "p_giu_vera": round(nv.mean(), 3),
                 "cop_su": round((g.Hf <= g.su90 + 1e-9).mean(), 3), "cop_giu": round((g.Lf >= g.giu90 - 1e-9).mean(), 3),
                 "tip_su": round((g.Hf[nu] <= g.su_tip[nu] + 1e-9).mean(), 3), "tip_giu": round((g.Lf[nv] >= g.giu_tip[nv] - 1e-9).mean(), 3)})
# calibrazione della probabilità per fasce di probabilità prevista
s = s.assign(bin=pd.cut(s.pu, [0, .1, .2, .3, .4, .5, .6, .7, .8, 1.0], include_lowest=True))
cal = [{"fascia": str(b), "n": len(g), "prevista": round(g.pu.mean(), 3), "vera": round((g.u > 0).mean(), 3)} for b, g in s.groupby("bin", observed=True)]
out = {"per_fascia_oraria_2023_26": rows, "calibrazione_p_su_2023_26": cal}
json.dump(out, open(get_settings().research_dir / "phase2" / "hx16" / "hx28_per_ora.json", "w"), indent=1, default=float)
for r in rows: print(r)
for c in cal: print(c)
