"""Campagna di ricerca massiva delle regole (protocollo §5): osservato, nullo, candidati."""

from __future__ import annotations

import json
import logging

import numpy as np
import pandas as pd
from scipy import stats as sps

from ..config import get_settings
from . import registry as REG
from .discovery import CUTOFFS_SEARCH, GROUPS, MIN_SUPPORT, build_space, run_permutations, search
from .trades import period

log = logging.getLogger("xnb.phase2.rules")
CAMPAIGN = "p2_rules_v1"
SEED = 20260926


def prepare(tr_base: pd.DataFrame, ft: pd.DataFrame) -> dict:
    """Per gruppo e cutoff: spazio delle primitive ed esiti, sugli eventi di scoperta."""
    d = period(tr_base[tr_base.ok == True], "discovery").sort_values("t0_utc")  # noqa: E712
    out = {}
    for g, fams in GROUPS.items():
        e = d[d.family.isin(fams)].reset_index(drop=True)
        strata = (e.family + "_" + e.year.astype(str)).to_numpy()
        per_cut = {}
        for cut in CUTOFFS_SEARCH:
            X = ft[ft.cutoff == cut].set_index("event_id").loc[e.event_id].reset_index()
            sp = build_space(X, MIN_SUPPORT[g])
            pa_rows = np.nonzero(sp.is_pa)[0]
            per_cut[cut] = (sp, e.R_long.to_numpy(), e.R_short.to_numpy(), strata, MIN_SUPPORT[g], pa_rows)
        out[g] = {"events": e, "per_cut": per_cut}
    return out


def _stats(r: np.ndarray, rc: np.ndarray, years: np.ndarray) -> dict:
    n = len(r)
    wins, losses = r[r > 0], r[r <= 0]
    yr = pd.Series(r).groupby(years).agg(["mean", "size"])
    yr = yr[yr["size"] >= 2]
    return {"n": int(n), "mean_R": float(r.mean()), "median_R": float(np.median(r)),
            "win_rate": float((r > 0).mean()), "avg_win_R": float(wins.mean()) if len(wins) else 0.0,
            "avg_loss_R": float(losses.mean()) if len(losses) else 0.0,
            "pf": float(wins.sum() / -losses.sum()) if losses.sum() < 0 else float("inf"),
            "t": float(r.mean() / (r.std(ddof=1) / np.sqrt(n))) if n > 2 and r.std() > 0 else 0.0,
            "mean_R_conservative": float(rc.mean()),
            "years_positive_share": float((yr["mean"] > 0).mean()) if len(yr) else 0.0,
            "n_years": int(len(yr))}


def observed(prep: dict, tr_cons: pd.DataFrame) -> dict:
    cons = tr_cons.set_index("event_id")
    res = {}
    for g, obj in prep.items():
        e = obj["events"]
        rows, n_hyp = [], 0
        best = {}
        for cut, (sp, rL, rS, strata, ms, pa_rows) in obj["per_cut"].items():
            for dname, r in (("LONG", rL), ("SHORT", rS)):
                s = search(sp, r, ms, keep_top=True)
                n_hyp += s["n_hyp"]
                best[f"{cut}|{dname}"] = s["max"]
                spa = search(sp, r, ms, rows=pa_rows) if len(pa_rows) > 10 else {"max": -np.inf}
                best[f"{cut}|{dname}|pa"] = spa["max"]
                rc_all = cons.loc[e.event_id, "R_long" if dname == "LONG" else "R_short"].to_numpy()
                for idx, t in s["top"]:
                    m = sp.M[list(idx)].prod(0).astype(bool)
                    st = _stats(r[m], rc_all[m], e.year.to_numpy()[m])
                    rows.append({"group": g, "cutoff": cut, "direction": dname, "idx": list(idx),
                                 "conditions": [sp.labels[i] for i in idx], "k": len(idx),
                                 "pa_only": bool(all(sp.is_pa[i] for i in idx)), "t_search": t,
                                 "mask": np.packbits(m).tobytes().hex(), **st})
        REG.log_experiment_once("rules_discovery", g, "rule_search", n_hyp,
                           {"cutoffs": CUTOFFS_SEARCH, "min_support": MIN_SUPPORT[g], "beam": 300,
                            "thresholds": "q25/q50/q75, binarie, categoriche<=8"}, "p2", None, best)
        res[g] = {"top": pd.DataFrame(rows).drop_duplicates(subset=["cutoff", "direction", "mask"])
                  .sort_values("t_search", ascending=False), "n_hyp": n_hyp, "best": best}
    return res


def fwer(obs: dict, n_perm: int) -> dict:
    perm = REG.perm_load(CAMPAIGN)
    out = {}
    for g, o in obs.items():
        pg = perm[perm.grp == g]
        null_all = pg[pg.key == "max_all"].value.to_numpy()
        null_pa = pg[pg.key == "max_pa"].value.to_numpy()
        top = o["top"].copy()
        top["p_fwer"] = [(1 + np.sum(null_all >= t)) / (1 + len(null_all)) for t in top.t_search]
        top["p_fwer_pa"] = [((1 + np.sum(null_pa >= t)) / (1 + len(null_pa))) if pa else np.nan
                            for t, pa in zip(top.t_search, top.pa_only)]
        # FDR (BH) informativo: p nominale t di Student, rango fra TUTTE le ipotesi valutate
        m_tot = o["n_hyp"]
        top["p_nominal"] = sps.t.sf(top.t_search, top.n - 1)
        top = top.sort_values("p_nominal").reset_index(drop=True)
        top["q_bh"] = np.minimum.accumulate((top.p_nominal * m_tot / (np.arange(len(top)) + 1))[::-1])[::-1]
        top["q_bh"] = top["q_bh"].clip(upper=1.0)
        out[g] = {"top": top.sort_values("t_search", ascending=False),
                  "null_max_quantiles": {q: float(np.quantile(null_all, q)) for q in (0.5, 0.9, 0.95, 0.99)},
                  "null_pa_quantiles": {q: float(np.quantile(null_pa, q)) for q in (0.5, 0.9, 0.95, 0.99)},
                  "observed_best": o["best"], "n_hyp": o["n_hyp"], "n_perm": int(len(null_all))}
    return out


def select_candidates(top: pd.DataFrame, k_max: int = 5) -> pd.DataFrame:
    """Protocollo §5: filtri di costo e stabilità, punteggio t − 0,5 (k−1), Jaccard < 0,7."""
    t = top.copy()
    t = t[(t.mean_R_conservative > 0) & (t.years_positive_share >= 0.6)]
    t["sel_score"] = t.t_search - 0.5 * (t.k - 1)
    t = t.sort_values("sel_score", ascending=False)
    chosen, masks = [], []
    for _, r in t.iterrows():
        m = np.unpackbits(np.frombuffer(bytes.fromhex(r["mask"]), dtype=np.uint8)).astype(bool)
        ok = True
        for m2 in masks:
            n = min(len(m), len(m2))
            inter = np.sum(m[:n] & m2[:n])
            uni = np.sum(m[:n] | m2[:n])
            if uni and inter / uni >= 0.7:
                ok = False
                break
        if ok:
            chosen.append(r)
            masks.append(m)
        if len(chosen) == k_max:
            break
    return pd.DataFrame(chosen)


def save(res: dict, cands: dict) -> None:
    out = {}
    for g, r in res.items():
        top = r["top"].head(60).drop(columns=["mask"]).to_dict("records")
        out[g] = {k: v for k, v in r.items() if k != "top"}
        out[g]["top"] = top
        out[g]["candidates"] = cands[g].drop(columns=["mask"]).to_dict("records") if len(cands[g]) else []
    p = get_settings().research_dir / "phase2" / "p2_rules_discovery.json"
    p.write_text(json.dumps(out, indent=1, default=lambda o: o.tolist() if hasattr(o, "tolist") else str(o)),
                 encoding="utf-8")
