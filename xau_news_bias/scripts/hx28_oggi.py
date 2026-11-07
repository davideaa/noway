"""Aggiornamento leggero dei livelli di oggi (H-X28) per il sito: usa le tabelle già calcolate da hx28_livelli.py
e scarica solo gli ultimi due mesi di candele più le ore di oggi. Non cambia nessun risultato della prova."""
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx21_range import bars  # noqa: E402
from hx28_livelli import CFG, H2, fresh  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402


def stato(h1: pd.DataFrame, O: dict) -> dict:
    c = CFG["D"]
    key = (h1.index + H2).normalize().tz_localize(None)
    cur_key = key[-1]
    cur = h1[key == cur_key]
    b = bars(h1, "D")
    S = float(b.r[b.index < cur_key].iloc[-c["win"]:].mean())
    op, hi, lo, px = float(cur.o.iat[0]), float(cur.h.max()), float(cur.l.min()), float(cur.c.iat[-1])
    k = int(min(c["kmax"], ((cur.index[-1] + H2).tz_localize(None) - cur_key) // pd.Timedelta(hours=1)))
    # livelli come nella pagina: tabella del metodo scelto, ripiego sulla tabella A con meno di MIN_N casi
    sc, tb = op / 100 * S, k // c["tb"]
    used, pos = (hi - lo) / sc, (px - lo) / (hi - lo) if hi > lo else .5
    ub, pb = int(np.digitize(used, [.5, 1.0])), int(np.digitize(pos, [1 / 3, 2 / 3]))
    want = {"A": {"tb": tb}, "B": {"tb": tb, "ub": ub}, "C": {"tb": tb, "ub": ub, "pb": pb}}[O["metodo"]]
    r = next((x for x in O["tabella"] if all(x.get(kk) == v for kk, v in want.items())), None)
    a = next(x for x in O["tabella_A"] if x["tb"] == tb)
    s = r if r and r["n"] >= O["min_n"] else a
    mu = r["mu"] if r and r["nu"] >= O["min_n"] else a["mu"]
    mv = r["mv"] if r and r["nv"] >= O["min_n"] else a["mv"]
    prev_key = sorted(set(key[key < cur_key]))[-1]
    candele = [[str(t), round(float(x.o), 2), round(float(x.h), 2), round(float(x.l), 2), round(float(x.c), 2)] for t, x in h1[key >= prev_key].iterrows()]
    return {"S_pct": round(S, 4), "apertura": op, "massimo": hi, "minimo": lo, "prezzo": px, "k": k,
            "inizio": str(cur_key.date()), "ultima_candela_utc": str(cur.index[-1]), "candele": candele,
            "livelli": {"su90": round(hi + s["qu"] * sc, 2), "giu90": round(lo - s["qv"] * sc, 2), "su_tip": round(hi + mu * sc, 2),
                        "giu_tip": round(lo - mv * sc, 2), "p_su": round(s["pu"], 3), "p_giu": round(s["pv"], 3)}}


if __name__ == "__main__":
    p = get_settings().research_dir / "phase2" / "hx16" / "hx28_livelli.json"
    J = json.loads(p.read_text(encoding="utf-8"))
    O = J["giorno"]["oggi"]
    h1 = DukascopyProvider().h1_range("XAUUSD", date.today() - timedelta(days=45), date.today())
    O.update(stato(fresh(h1), O))
    p.write_text(json.dumps(J, indent=1, default=float), encoding="utf-8")
    print(O["ultima_candela_utc"], O["prezzo"], O["livelli"])
