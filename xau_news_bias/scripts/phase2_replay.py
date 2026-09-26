"""Replay per la pagina pubblica: per ogni NFP e CPI dal 2014 la decisione del modello di famiglia
(walk-forward 2014-19, congelato 2020-26, identico al sigillo) e il risultato nel setup di Davide
(H-X3: T−60 s, stop ATR giornaliero, perdita tagliata a −1R). Scrive research_output/phase2/replay.json."""
import json
import pickle
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.phase2.models2 import _fit_predict, _weights, columns_for, decide  # noqa: E402
from xnb.phase2.run_models import build_data  # noqa: E402
from xnb.phase2.trades import SPLIT  # noqa: E402

if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    models = json.loads((R / "p2_models_discovery.json").read_text())
    val = json.loads((R / "p2_validation.json").read_text())
    tr = pickle.loads((get_settings().data_dir / "p2_cache" / "trades.pkl").read_bytes())
    ft = pd.read_parquet(R / "p2_features.parquet")
    ev = pd.read_parquet(R / "p2_events.parquet").set_index("event_id")
    data = build_data(tr["base"], ft)
    hx3 = pd.read_csv(R / "hx3_main_trades.csv").set_index("event_id")
    rows = []
    for fam in ("CPI", "NFP"):
        ch = models["groups"][fam]["chosen"]
        for r in pd.DataFrame(models["groups"][fam]["predictions"]).itertuples():
            rows.append((r.event_id, fam, "studio", r.ev_long, r.ev_short, r.action))
        trn = data[(data.family == fam) & (data.t0_utc < SPLIT)]
        if ch["adapt"] == "rolling5y":
            trn = trn[trn.t0_utc >= pd.Timestamp("2015-01-01", tz="UTC")]
        cols = columns_for(list(data.columns), ch["features"])
        w = _weights(trn, 2020, ch["adapt"])
        te = data[(data.family == fam) & (data.t0_utc >= SPLIT)]
        el = _fit_predict(ch["model"], trn[cols].to_numpy(float), trn.R_long.to_numpy(), w, te[cols].to_numpy(float))
        es = _fit_predict(ch["model"], trn[cols].to_numpy(float), trn.R_short.to_numpy(), w, te[cols].to_numpy(float))
        d = decide(pd.DataFrame({"event_id": te.event_id.to_numpy(), "ev_long": el, "ev_short": es,
                                 "R_long": 0.0, "R_short": 0.0}), ch["tau"])
        it = next(i for i in val["items"] if i["id"] == f"MODEL-{fam}")
        st = "final" if fam == "NFP" else "cpi_validation"
        sealed = {t["event_id"]: t["action"] for t in it[st]["eval"]["trades"]}
        assert sealed == {r.event_id: r.action for r in d.itertuples() if r.action != "NO TRADE"}, "diverso dal sigillo"
        rows += [(r.event_id, fam, "test", r.ev_long, r.ev_short, r.action) for r in d.itertuples()]
    out = []
    for e, fam, per, el, es, act in rows:
        if e not in hx3.index:
            continue
        h, E = hx3.loc[e], ev.loc[e]
        rl, rs = max(h.rl, -1), max(h.rs, -1)
        res = rl if act == "LONG" else rs if act == "SHORT" else None
        out.append({"id": e, "f": fam, "d": str(E.t0_utc)[:10], "p": per, "lean": "LONG" if el >= es else "SHORT",
                    "a": act, "mv": round(float(E.a_move), 2), "rg": round(float(E.a_range), 2),
                    "st": round(float(h.stop_usd) * 10), "rl": round(float(rl), 2), "rs": round(float(rs), 2),
                    "r": None if res is None else round(float(res), 2)})
    out.sort(key=lambda x: x["d"])
    (R / "replay.json").write_text(json.dumps(out), encoding="utf-8")
    print(len(out), "news")
