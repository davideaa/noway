"""H-X4: ricerca completa con il trade di Davide (docs/IPOTESI-HX4-DAVIDE.md). Riprendibile."""
import json
import logging
import pickle
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.logging_setup import setup_logging  # noqa: E402
from xnb.phase2 import hx4  # noqa: E402
from xnb.phase2 import registry as REG  # noqa: E402
from xnb.phase2.anatomy_study import load  # noqa: E402
from xnb.phase2.discovery import GROUPS, run_permutations  # noqa: E402
from xnb.phase2.run_rules import prepare, select_candidates  # noqa: E402
from xnb.phase2.trades import REGIME_START  # noqa: E402


def era(y):
    return "2013-19" if y <= 2019 else "2020-23" if y <= 2023 else "2024-26"


def describe(t: pd.DataFrame) -> list:
    t = t[(t.ok == True) & (t.t0_utc >= REGIME_START)].copy()  # noqa: E712
    t["era"] = t.year.map(era)
    out = []
    for (fam, e), g in [(("CPI+NFP", "tutto"), t)] + [((("CPI+NFP", e)), g) for e, g in t.groupby("era")] + \
            [((f, "tutto"), g) for f, g in t.groupby("family")]:
        right, wrong = np.maximum(g.R_long, g.R_short), np.minimum(g.R_long, g.R_short)
        mr, mw = right.mean(), wrong.mean()
        out.append({"gruppo": fam, "era": e, "news": int(len(g)), "stop_pips": float(g.sl_usd.median() * 10),
                    "serve_indovinare": float(-mw / (mr - mw)), "a_caso": float((mr + mw) / 2),
                    "al_60": float(.6 * mr + .4 * mw), "giusto_ge2R": float((right >= 2).mean())})
    return out


if __name__ == "__main__":
    setup_logging()
    log = logging.getLogger("xnb.phase2.hx4")
    w = REG.workers_for("MAXIMUM")
    cache = get_settings().data_dir / "p2_cache" / "hx4_trades.pkl"
    ev, ft, paths = load()
    if cache.exists():
        tr = pickle.loads(cache.read_bytes())
    else:
        tr = {"base": hx4.build_trades("base", ev=ev, ft=ft, paths=paths),
              "conservative": hx4.build_trades("conservative", ev=ev, ft=ft, paths=paths),
              "atr120": hx4.build_trades("base", "atr120", ev=ev, ft=ft, paths=paths)}
        cache.write_bytes(pickle.dumps(tr))
    desc = {"main": describe(tr["base"]), "conservative": describe(tr["conservative"]), "atr120": describe(tr["atr120"])}
    log.info("descrittivo pronto")
    REG.campaign_update(hx4.CAMPAIGN, stage="preparazione", workers=w, mode="MAXIMUM")
    prep = prepare(tr["base"], ft)
    obs = hx4.observed(prep, tr["conservative"])
    log.info("ipotesi: %s", {g: o["n_hyp"] for g, o in obs.items()})
    run_permutations({g: o["per_cut"] for g, o in prep.items()}, 1000, hx4.CAMPAIGN, hx4.SEED, w, "MAXIMUM")
    REG.campaign_update(hx4.CAMPAIGN, stage="completata")
    res = hx4.fwer(obs)
    cands = {g: select_candidates(r["top"]) for g, r in res.items()}
    log.info("modelli...")
    models = hx4.run_models(tr["base"], ft, w)
    tests = hx4.evaluate_tests(res, cands, models, tr["base"], ft, prep, tr["atr120"])
    strat = hx4.strategies(tr["base"], models, tests)
    evc = ev[ev.t0_utc >= pd.Timestamp("2014-01-01", tz="UTC")][["event_id", "family", "t0_utc"]]
    money = {}
    for name, seq in strat.items():
        fams = GROUPS.get(name.replace("MODEL-", ""), ["CPI", "NFP"])
        cal = evc[evc.family.isin(fams)]
        money[name] = {"A_10k_ogni_anno": hx4.money(seq, cal, carry=False), "B_composto": hx4.money(seq, cal, carry=True)}
    d = hx4.out_dir()
    rules_out = {g: {"n_hyp": r["n_hyp"], "n_perm": r["n_perm"], "null_max": r["null_max_quantiles"],
                     "null_pa": r["null_pa_quantiles"], "observed_best": r["observed_best"],
                     "best_p_fwer": float(r["top"].p_fwer.min()),
                     "top": r["top"].sort_values("t_search", ascending=False).head(30).drop(columns=["mask"]).to_dict("records"),
                     "candidates": cands[g].drop(columns=["mask"]).to_dict("records") if len(cands[g]) else []}
                 for g, r in res.items()}
    models_out = {g: {k: v for k, v in m.items() if k != "predictions"} for g, m in models["groups"].items()}
    json.dump({"descrittivo": desc, "regole": rules_out, "modelli": models_out, "test_2020_26": tests,
               "soldi": {k: {kk: {x: y for x, y in vv.items() if x != "curve"} for kk, vv in v.items()} for k, v in money.items()}},
              open(d / "hx4_results.json", "w"), indent=1, default=lambda o: o.tolist() if hasattr(o, "tolist") else str(o))
    json.dump({k: v["B_composto"]["curve"] for k, v in money.items()}, open(d / "hx4_money_curves.json", "w"))
    models["table"].to_csv(d / "hx4_model_grid.csv", index=False)
    for g, m in models["groups"].items():
        m["predictions"].assign(t0_utc=m["predictions"].t0_utc.astype(str)).to_csv(d / f"hx4_pred_{g}.csv", index=False)
    log.info("fatto")
