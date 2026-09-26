"""H-X5: ultimi 5 anni (docs/IPOTESI-HX5-ULTIMI5ANNI.md)."""
import json
import logging
import pickle
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.logging_setup import setup_logging  # noqa: E402
from xnb.phase2 import hx5  # noqa: E402
from xnb.phase2 import registry as REG  # noqa: E402
from xnb.phase2.discovery import run_permutations  # noqa: E402

if __name__ == "__main__":
    setup_logging()
    log = logging.getLogger("xnb.phase2.hx5")
    w = REG.workers_for("MAXIMUM")
    R = get_settings().research_dir / "phase2"
    ev = pd.read_parquet(R / "p2_events.parquet")
    ev = ev[(ev.t0_utc >= hx5.STUDY[0]) & (ev.t0_utc < hx5.TEST[1])].sort_values("t0_utc")
    ft = pd.read_parquet(R / "p2_features.parquet")
    cache = get_settings().data_dir / "p2_cache" / "hx5_paths.pkl"
    P = pickle.loads(cache.read_bytes()) if cache.exists() else hx5.paths(ev)
    cache.write_bytes(pickle.dumps(P))
    log.info("percorsi tick: %d news", len(P))
    out = {"descrittivo": {}, "ricerca": {}, "test": [], "soldi": {}}
    tabs = {}
    for ex in hx5.EXITS:
        tb = hx5.trades(ev, P, ex, "base")
        tc = hx5.trades(ev, P, ex, "conservative")
        tabs[ex] = tb
        for lab, (a, b) in (("studio", hx5.STUDY), ("test", hx5.TEST)):
            out["descrittivo"][f"{ex}|{lab}"] = hx5.describe(tb[(tb.t0_utc >= a) & (tb.t0_utc < b)])
        prep = hx5.prepare(tb, ft)
        obs = hx5.observed(prep, tc, ex)
        camp = f"hx5_{ex}"
        run_permutations({"SHARED": prep["per_cut"]}, 1000, camp, hx5.SEED, w, "MAXIMUM")
        REG.campaign_update(camp, stage="completata")
        res = hx5.fwer(obs, camp)
        cands = hx5.select_candidates(res["top"], k_max=3)
        sp_by_cut = {c: v[0] for c, v in prep["per_cut"].items()}
        out["ricerca"][ex] = {"n_studio": int(len(prep["events"])), "n_hyp": obs["n_hyp"], "null_max": res["null_max"],
                              "best_p_fwer": float(res["top"].p_fwer.min()),
                              "top": res["top"].head(15).drop(columns=["mask"]).to_dict("records")}
        for i, c in enumerate(cands.to_dict("records") if len(cands) else []):
            t = hx5.test_rule(c, sp_by_cut, ft, tb)
            ins = [x for x in (prep["events"].R_long if c["direction"] == "LONG" else prep["events"].R_short)]
            out["test"].append({"id": f"{ex}-R{i + 1}", "exit": ex, "cutoff": c["cutoff"], "direction": c["direction"],
                                "conditions": c["conditions"], "studio_n": c["n"], "studio_mean_R": c["mean_R"],
                                "studio_win": c["win_rate"], "studio_t": c["t_search"], "studio_p_fwer": c["p_fwer"], **t})
        log.info("uscita %s fatta: ipotesi %d", ex, obs["n_hyp"])
    hx5.apply_holm(out["test"])
    for x in out["test"]:
        x["soldi_test_da_10000"] = hx5.money([t["R"] for t in x["trades"]])
    for ex, tb in tabs.items():
        tt = tb[(tb.ok == True) & (tb.t0_utc >= hx5.TEST[0])]  # noqa: E712
        out["soldi"][ex] = {"a_caso_test": hx5.money(((tt.R_long + tt.R_short) / 2).tolist()),
                            "sempre_long_test": hx5.money(tt.R_long.tolist()),
                            "sempre_short_test": hx5.money(tt.R_short.tolist())}
    d = R / "hx5"
    d.mkdir(exist_ok=True)
    json.dump(out, open(d / "hx5_results.json", "w"), indent=1, default=lambda o: o.tolist() if hasattr(o, "tolist") else str(o))
    pickle.dump(tabs, open(get_settings().data_dir / "p2_cache" / "hx5_trades.pkl", "wb"))
    log.info("fatto")
