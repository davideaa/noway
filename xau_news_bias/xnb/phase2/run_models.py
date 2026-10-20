"""Campagna modelli (protocollo §6): walk-forward di scoperta 2014-2019, scelta, ablazioni."""

from __future__ import annotations

import json
import logging
from concurrent.futures import ProcessPoolExecutor

import numpy as np
import pandas as pd
from scipy import stats as sps

from ..config import get_settings
from . import registry as REG
from .models2 import (ADAPT, FEATURE_SETS, MODELS, TAUS, baselines, columns_for, decide, direction_classifier_wf,
                      trade_stats, walk_forward)
from .trades import REGIME_START, SPLIT

log = logging.getLogger("xnb.phase2.models")
DISC_YEARS = [2014, 2015, 2016, 2017, 2018, 2019]
GROUPS = {"CPI": ["CPI"], "NFP": ["NFP"], "SHARED": ["CPI", "NFP"]}
_D: dict = {}


def build_data(tr: pd.DataFrame, ft: pd.DataFrame, cutoff: str = "T-1M") -> pd.DataFrame:
    x = ft[ft.cutoff == cutoff].drop(columns=["family", "t0_utc"])
    d = tr[tr.ok == True].merge(x, on="event_id")  # noqa: E712
    return d.sort_values("t0_utc").reset_index(drop=True)


def _job(args):
    from threadpoolctl import threadpool_limits

    g, model, fset, adapt = args
    with threadpool_limits(1):
        data = _D["data"]
        d = data[data.family.isin(GROUPS[g])]
        d = d[d.t0_utc < SPLIT]
        cols = columns_for(list(d.columns), fset)
        pred = walk_forward(d, cols, model, adapt, DISC_YEARS)
    return args, pred


def run(tr_base: pd.DataFrame, ft: pd.DataFrame, workers: int) -> dict:
    import multiprocessing as mp

    data = build_data(tr_base, ft)
    _D["data"] = data
    grid = [(g, m, f, a) for g in GROUPS for m in MODELS for f in FEATURE_SETS for a in ADAPT]
    rows, preds = [], {}
    with ProcessPoolExecutor(max_workers=workers, mp_context=mp.get_context("fork")) as ex:
        for k, (args, pred) in enumerate(ex.map(_job, grid, chunksize=3), 1):
            g, m, f, a = args
            preds[args] = pred
            for tau in TAUS:
                st = trade_stats(decide(pred, tau)) if len(pred) else {"n_trades": 0}
                rows.append({"group": g, "model": m, "features": f, "adapt": a, "tau": tau, **st})
            if k % 30 == 0:
                REG.campaign_update("p2_models_v1", stage="walk-forward scoperta", total=len(grid), done=k)
                log.info("configurazioni %d/%d", k, len(grid))
    table = pd.DataFrame(rows)
    REG.log_experiment_once("models_discovery", "ALL", "model_configs", len(table),
                       {"models": MODELS, "features": list(FEATURE_SETS), "adapt": ADAPT, "taus": TAUS,
                        "years": DISC_YEARS}, "p2", 7)
    res: dict = {"table": table.to_dict("records"), "groups": {}}
    for g in GROUPS:
        t = table[(table.group == g) & (table.n_trades >= 20)].sort_values("t", ascending=False)
        if t.empty:
            continue
        best = t.iloc[0].to_dict()
        key = (g, best["model"], best["features"], best["adapt"])
        pred = decide(preds[key], best["tau"])
        dg = data[data.family.isin(GROUPS[g]) & (data.t0_utc < SPLIT)]
        # ablazione: stesso modello e adattività, tutti gli insiemi di feature
        abl = table[(table.group == g) & (table.model == best["model"]) & (table.adapt == best["adapt"]) &
                    (table.tau == best["tau"])][["features", "n_trades", "mean_R", "t", "win_rate", "pf"]]
        # quante configurazioni battono lo zero: un modo semplice di vedere quanto è rara la migliore
        tt = table[(table.group == g) & (table.n_trades >= 20)]
        res["groups"][g] = {
            "chosen": best, "n_configs": int(len(tt)),
            "share_configs_positive": float((tt.mean_R > 0).mean()),
            "t_quantiles_all_configs": {q: float(tt.t.quantile(q)) for q in (0.5, 0.9, 0.99)},
            "baselines": baselines(dg, DISC_YEARS),
            "ablation": abl.to_dict("records"),
            "by_year": pred.dropna(subset=["R"]).groupby("year").R.agg(["size", "mean", "sum"]).reset_index().to_dict("records"),
            "predictions": pred.assign(t0_utc=pred.t0_utc.astype(str)).to_dict("records"),
        }
    return res


def checkpoints_and_direction(tr_base: pd.DataFrame, ft: pd.DataFrame, res: dict) -> dict:
    """La configurazione scelta a ogni cutoff (descrittivo) + accuratezza di direzione + ampiezza."""
    out = {}
    for g, r in res["groups"].items():
        ch = r["chosen"]
        per_cut = {}
        for cut in ft.cutoff.unique():
            data = build_data(tr_base, ft, cut)
            d = data[data.family.isin(GROUPS[g]) & (data.t0_utc < SPLIT)]
            cols = columns_for(list(d.columns), ch["features"])
            pred = walk_forward(d, cols, ch["model"], ch["adapt"], DISC_YEARS)
            per_cut[cut] = trade_stats(decide(pred, ch["tau"])) if len(pred) else {}
        data = build_data(tr_base, ft)
        d = data[data.family.isin(GROUPS[g]) & (data.t0_utc < SPLIT)]
        cols = columns_for(list(d.columns), ch["features"])
        cl = direction_classifier_wf(d, cols, DISC_YEARS)
        acc = float(((cl.p_up >= 0.5) == (cl.y_up == 1)).mean()) if len(cl) else None
        base_up = float(cl.y_up.mean()) if len(cl) else None
        # ampiezza: range della prima M1 in unità U_news, previsto da tutte le feature (ridge)
        mag = _magnitude_wf(d, ft)
        out[g] = {"by_cutoff": per_cut, "direction_accuracy": acc, "direction_base_up": base_up,
                  "direction_brier": float(np.mean((cl.p_up - cl.y_up) ** 2)) if len(cl) else None,
                  "magnitude": mag}
    return out


def _magnitude_wf(d: pd.DataFrame, ft: pd.DataFrame) -> dict:
    from sklearn.impute import SimpleImputer
    from sklearn.linear_model import Ridge
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler

    ev = pd.read_parquet(get_settings().research_dir / "phase2" / "p2_events.parquet")[["event_id", "a_range"]]
    x = d.merge(ev, on="event_id")
    x = x[(x.a_range > 0) & (x.U > 0)]
    x["y"] = np.log(x.a_range / x.U)
    cols = [c for c in x.columns if c.startswith("f_")]
    preds = []
    for yr in DISC_YEARS:
        tr = x[x.t0_utc < pd.Timestamp(f"{yr}-01-01", tz="UTC")]
        te = x[x.year == yr]
        if len(te) == 0 or len(tr) < 40:
            continue
        Xtr = tr[cols].to_numpy(dtype=float)
        keep = ~np.all(np.isnan(Xtr), axis=0)
        est = make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), Ridge(alpha=50.0))
        est.fit(Xtr[:, keep], tr.y)
        p = est.predict(te[cols].to_numpy(dtype=float)[:, keep])
        preds.append(pd.DataFrame({"pred": p, "y": te.y.to_numpy(), "U": te.U.to_numpy(), "range": te.a_range.to_numpy()}))
    p = pd.concat(preds)
    rho_u = sps.spearmanr(p.U, p.range).statistic
    rho_m = sps.spearmanr(np.exp(p.pred) * p.U, p.range).statistic
    return {"n": int(len(p)), "spearman_U_news_only": float(rho_u), "spearman_model_x_U": float(rho_m),
            "spearman_model_residual": float(sps.spearmanr(p.pred, p.y).statistic)}


def save(res: dict, extra: dict) -> None:
    res = dict(res)
    res["checkpoints_direction_magnitude"] = extra
    p = get_settings().research_dir / "phase2" / "p2_models_discovery.json"
    p.write_text(json.dumps(res, indent=1, default=lambda o: o.tolist() if hasattr(o, "tolist") else str(o)),
                 encoding="utf-8")
