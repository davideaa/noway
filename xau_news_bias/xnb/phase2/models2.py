"""Modelli della fase 2 (protocollo §6): valore atteso del trade e decisione LONG/SHORT/NO TRADE.

Per ogni evento il modello stima E[R_LONG] ed E[R_SHORT] (costi base già
dentro gli R). Azione = la direzione con valore atteso più alto se supera
τ, altrimenti NO TRADE. Walk-forward annuale: training su tutti gli eventi
precedenti (anche 2008-2013, con i pesi della configurazione), previsioni
sugli anni del regime principale.
"""

from __future__ import annotations

import itertools
import logging

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.neighbors import KNeighborsRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

log = logging.getLogger("xnb.phase2.models")

FAMILIES = {
    "PRICE": ("f_xau_", "f_pa_"),
    "MACRO": ("f_cpi_", "f_core_", "f_nfp_", "f_ur_", "f_ahe_", "f_hours_", "f_part_", "f_surp_", "f_react_"),
    "RATES": ("f_y2y", "f_y10y", "f_y3m", "f_r10y", "f_slope_", "f_y2_minus", "f_rt_be", "f_rt_slope", "f_rt_y",
              "f_rt_r10y", "f_rel_xau_2y", "f_rel_xau_real10y"),
    "DXYFX": ("f_dxy_", "f_usd_", "f_xm_eur", "f_xm_jpy", "f_rel_xau_dxy"),
    "VOLRISK": ("f_vix", "f_rt_vix", "f_news_", "f_xm_spx", "f_xm_ndx", "f_rel_xau_spx"),
    "CONSENSUS": ("f_cons_", "f_gap_", "f_nowcast_"),
    "FED": ("f_cal_days_since_fomc", "f_cal_days_to_fomc", "f_y3m", "f_y2_minus_3m", "f_surp_fed_funds"),
    "POSITIONING": ("f_cot_",),
    "CAL": ("f_cal_",),
}
FEATURE_SETS = {
    "PRICE": ["PRICE"], "PRICE+MACRO": ["PRICE", "MACRO"], "PRICE+RATES": ["PRICE", "RATES"],
    "PRICE+DXYFX": ["PRICE", "DXYFX"], "PRICE+VOLRISK": ["PRICE", "VOLRISK"], "PRICE+CONSENSUS": ["PRICE", "CONSENSUS"],
    "PRICE+FED": ["PRICE", "FED"], "PRICE+POSITIONING": ["PRICE", "POSITIONING"],
    "PRICE+MACRO+RATES": ["PRICE", "MACRO", "RATES"], "ALL": list(FAMILIES),
}
MODELS = ["ridge", "lgbm", "knn"]
ADAPT = ["expanding", "rolling5y", "decay3y"]
TAUS = [0.0, 0.1, 0.2, 0.3]
EXCLUDE = {"f_xau_px_age_min", "f_rates_age_days", "f_cot_age_days"}


def columns_for(all_cols: list[str], fset: str) -> list[str]:
    pref = tuple(p for fam in FEATURE_SETS[fset] for p in FAMILIES[fam])
    return [c for c in all_cols if c.startswith(pref) and c not in EXCLUDE]


def _estimator(name: str):
    if name == "ridge":
        return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), Ridge(alpha=30.0))
    if name == "lgbm":
        import lightgbm as lgb

        return lgb.LGBMRegressor(n_estimators=150, learning_rate=0.03, num_leaves=4, min_child_samples=15,
                                 colsample_bytree=0.5, subsample=0.8, subsample_freq=1, reg_lambda=2.0,
                                 random_state=7, verbose=-1, n_jobs=1)
    if name == "knn":
        return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), PCA(n_components=8, random_state=7),
                             KNeighborsRegressor(n_neighbors=15, weights="distance"))
    raise ValueError(name)


def _weights(train: pd.DataFrame, year: int, adapt: str) -> np.ndarray | None:
    if adapt == "decay3y":
        age = year - train["year"].to_numpy() - 0.5
        return 0.5 ** (np.clip(age, 0, None) / 3.0)
    return None


def _fit_predict(name: str, Xtr, ytr, w, Xte):
    est = _estimator(name)
    # colonne interamente vuote nel training: fuori (l'imputer le scarterebbe in modo incoerente)
    keep = ~np.all(np.isnan(Xtr), axis=0)
    Xtr, Xte = Xtr[:, keep], Xte[:, keep]
    if name == "lgbm":
        est.fit(Xtr, ytr, sample_weight=w)
    elif name == "ridge":
        est.fit(Xtr, ytr, ridge__sample_weight=w)
    else:
        est.fit(Xtr, ytr)  # k-NN: i pesi di recenza non si applicano
    return est.predict(Xte)


def walk_forward(data: pd.DataFrame, cols: list[str], model: str, adapt: str, years: list[int]) -> pd.DataFrame:
    """``data``: una riga per evento con R_long, R_short, year, t0_utc e le feature."""
    out = []
    for yr in years:
        tr = data[data.t0_utc < pd.Timestamp(f"{yr}-01-01", tz="UTC")]
        if adapt == "rolling5y":
            tr = tr[tr.t0_utc >= pd.Timestamp(f"{yr - 5}-01-01", tz="UTC")]
        te = data[data.year == yr]
        if len(te) == 0 or len(tr) < 40:
            continue
        w = _weights(tr, yr, adapt)
        Xtr = tr[cols].to_numpy(dtype=float)
        Xte = te[cols].to_numpy(dtype=float)
        evl = _fit_predict(model, Xtr, tr.R_long.to_numpy(), w, Xte)
        evs = _fit_predict(model, Xtr, tr.R_short.to_numpy(), w, Xte)
        out.append(pd.DataFrame({"event_id": te.event_id.to_numpy(), "family": te.family.to_numpy(),
                                 "year": yr, "t0_utc": te.t0_utc.to_numpy(), "ev_long": evl, "ev_short": evs,
                                 "R_long": te.R_long.to_numpy(), "R_short": te.R_short.to_numpy()}))
    return pd.concat(out, ignore_index=True) if out else pd.DataFrame()


def decide(pred: pd.DataFrame, tau: float) -> pd.DataFrame:
    p = pred.copy()
    best_long = p.ev_long >= p.ev_short
    best = np.where(best_long, p.ev_long, p.ev_short)
    p["action"] = np.where(best > tau, np.where(best_long, "LONG", "SHORT"), "NO TRADE")
    p["R"] = np.where(p.action == "LONG", p.R_long, np.where(p.action == "SHORT", p.R_short, np.nan))
    return p


def trade_stats(p: pd.DataFrame) -> dict:
    r = p["R"].dropna().to_numpy()
    n = len(r)
    if n == 0:
        return {"n_trades": 0, "trade_share": 0.0}
    wins, losses = r[r > 0], r[r <= 0]
    eq = np.cumsum(r)
    dd = float(np.max(np.maximum.accumulate(np.r_[0, eq])[1:] - eq)) if n else 0.0
    # serie di perdite più lunga
    streak = mx = 0
    for v in r:
        streak = streak + 1 if v <= 0 else 0
        mx = max(mx, streak)
    return {"n_trades": int(n), "trade_share": float(n / len(p)), "mean_R": float(r.mean()),
            "t": float(r.mean() / (r.std(ddof=1) / np.sqrt(n))) if n > 2 and r.std() > 0 else 0.0,
            "win_rate": float((r > 0).mean()), "avg_win_R": float(wins.mean()) if len(wins) else 0.0,
            "avg_loss_R": float(losses.mean()) if len(losses) else 0.0,
            "pf": float(wins.sum() / -losses.sum()) if losses.sum() < 0 else float("inf"),
            "total_R": float(r.sum()), "max_dd_R": dd, "worst_R": float(r.min()), "max_loss_streak": int(mx),
            "cvar10_R": float(np.mean(np.sort(r)[: max(1, n // 10)]))}


def baselines(data: pd.DataFrame, years: list[int]) -> dict:
    """Regole semplici, stesse annate del walk-forward."""
    d = data[data.year.isin(years)].copy()
    rng = np.random.default_rng(99)
    rules = {
        "always_long": np.ones(len(d)), "always_short": -np.ones(len(d)),
        "prev_news_direction": np.sign(d.get("f_react_same_last_dir", pd.Series(0, index=d.index)).fillna(0)).to_numpy(),
        "xau_momentum_1h": np.sign(d.get("f_xau_ret_60m_atrh", pd.Series(0, index=d.index)).fillna(0)).to_numpy(),
        "xau_reversal_1h": -np.sign(d.get("f_xau_ret_60m_atrh", pd.Series(0, index=d.index)).fillna(0)).to_numpy(),
        "dxy_rule": -np.sign(d.get("f_usd_ret_1h_pct", pd.Series(0, index=d.index)).fillna(0)).to_numpy(),
        "yield_rule": -np.sign(d.get("f_y2y_chg_1d", pd.Series(0, index=d.index)).fillna(0)).to_numpy(),
        "random": rng.choice([-1.0, 1.0], len(d)),
    }
    out = {}
    for name, s in rules.items():
        p = d.assign(R=np.where(s > 0, d.R_long, np.where(s < 0, d.R_short, np.nan)))
        out[name] = trade_stats(p)
    # frequenza storica: la direzione con R medio più alto nel training di ogni anno
    rows = []
    for yr in years:
        tr = data[data.t0_utc < pd.Timestamp(f"{yr}-01-01", tz="UTC")]
        te = d[d.year == yr]
        side = "R_long" if tr.R_long.mean() >= tr.R_short.mean() else "R_short"
        rows.append(te.assign(R=te[side]))
    out["historical_frequency"] = trade_stats(pd.concat(rows)) if rows else {}
    return out


def direction_classifier_wf(data: pd.DataFrame, cols: list[str], years: list[int]) -> pd.DataFrame:
    """P(up) calibrata (logistica L1) per la dashboard e per l'accuratezza di direzione."""
    out = []
    y = (data.R_long > data.R_short).astype(int)
    for yr in years:
        trm = data.t0_utc < pd.Timestamp(f"{yr}-01-01", tz="UTC")
        tem = data.year == yr
        if tem.sum() == 0 or trm.sum() < 40:
            continue
        est = make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                            LogisticRegression(penalty="l1", C=0.05, solver="liblinear"))
        Xtr = data.loc[trm, cols].to_numpy(dtype=float)
        keep = ~np.all(np.isnan(Xtr), axis=0)
        est.fit(Xtr[:, keep], y[trm])
        p = est.predict_proba(data.loc[tem, cols].to_numpy(dtype=float)[:, keep])[:, 1]
        out.append(pd.DataFrame({"event_id": data.loc[tem, "event_id"], "p_up": p, "y_up": y[tem]}))
    return pd.concat(out) if out else pd.DataFrame()


def config_grid(groups: list[str]):
    return list(itertools.product(groups, MODELS, FEATURE_SETS, ADAPT))
