"""Esecuzione del protocollo CPI (docs/PROTOCOLLO-CPI.md) sul dataset congelato.

Produce ``research_output/cpi_results.json``, letto dal Research Lab.
Tutto ciò che è qui è deciso dal protocollo: sample, split, modelli,
criterio di scelta, soglie del verdetto.
"""

from __future__ import annotations

import json
import logging
import math
from datetime import datetime

import numpy as np
import pandas as pd
from joblib import Parallel, delayed
from scipy import stats as sps

from ..timeutil import CHECKPOINTS, PRIMARY_CHECKPOINT, iso, utc_now
from . import stats as S
from .models import MODEL_NAMES, SIMPLICITY_ORDER, full_features
from .walkforward import usable, walk_forward

log = logging.getLogger("xnb.run_cpi")

PRIMARY_START = pd.Timestamp("2008-02-01", tz="UTC")
DEV_YEARS = range(2013, 2020)
HOLDOUT_FROM = 2020

CRIT = {"accuracy_min": 0.55, "perm_p_max": 0.05, "logloss_max": math.log(2),
        "bucket70_min_n": 15, "bucket70_min_hit": 0.65, "bucket70_wilson_lo_min": 0.50}


def _clean(o):
    if isinstance(o, dict):
        return {k: _clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_clean(v) for v in o]
    if isinstance(o, (np.floating, float)):
        return None if (o != o or o in (float("inf"), float("-inf"))) else float(o)
    if isinstance(o, np.integer):
        return int(o)
    if isinstance(o, (pd.Timestamp, datetime)):
        return o.isoformat()
    return o


def sample_accounting(df: pd.DataFrame) -> dict:
    ev = df[df.checkpoint == PRIMARY_CHECKPOINT].copy()
    total = len(ev)
    primary = ev[ev.t0_utc >= PRIMARY_START]
    reasons = {}
    for _, r in primary.iterrows():
        if pd.isna(r.get("y_direction")) and pd.isna(r.get("y_quality")):
            reasons["esito non calcolato"] = reasons.get("esito non calcolato", 0) + 1
        elif r["y_quality"] != "OK":
            reasons[r["y_quality"]] = reasons.get(r["y_quality"], 0) + 1
        elif r["y_direction"] == "FLAT":
            reasons["FLAT"] = reasons.get("FLAT", 0) + 1
    u = usable(primary)
    by_year = u.groupby("year")["y"].agg(["count", "sum"]).reset_index()
    return {
        "events_total_archive": int(total),
        "events_secondary_2003_2008": int((ev.t0_utc < PRIMARY_START).sum()),
        "events_primary": int(len(primary)),
        "events_usable": int(len(u)),
        "excluded": reasons,
        "bullish": int(u["y"].sum()), "bearish": int((1 - u["y"]).sum()),
        "bullish_share": float(u["y"].mean()),
        "by_year": [{"year": int(r.year), "n": int(r["count"]), "bullish": int(r["sum"])} for _, r in by_year.iterrows()],
        "first_event": str(primary.t0_utc.min()), "last_event": str(primary.t0_utc.max()),
    }


def target_diagnostics(u: pd.DataFrame) -> dict:
    agree_bid = float((u.y_dir_bid == u.y_direction).mean())
    agree_m1 = float((u.y_dir_m1_bid == u.y_direction).mean())
    fr = u.y_first_reaction_ms.dropna()
    mv = u.y_move_pips.abs()
    return {
        "label_agreement_mid_vs_bid": agree_bid,
        "label_agreement_mid_vs_m1_candle_open": agree_m1,
        "first_reaction_ms": {"n": int(len(fr)), "median": float(fr.median()) if len(fr) else None,
                              "p10": float(fr.quantile(0.1)) if len(fr) else None,
                              "p90": float(fr.quantile(0.9)) if len(fr) else None,
                              "before_t0": int((fr < 0).sum()), "after_5s": int((fr > 5000).sum())},
        "abs_move_pips": {"median": float(mv.median()), "p25": float(mv.quantile(0.25)), "p75": float(mv.quantile(0.75))},
        "range_pips": {"median": float(u.y_range_pips.median()), "p25": float(u.y_range_pips.quantile(0.25)),
                       "p75": float(u.y_range_pips.quantile(0.75))},
        "small_moves_under_5_pips": int((mv < 5).sum()),
    }


def _seg(p: pd.DataFrame, which: str) -> pd.DataFrame:
    if which == "dev":
        return p[p.year.isin(DEV_YEARS)]
    if which == "holdout":
        return p[p.year >= HOLDOUT_FROM]
    return p


def evaluate_preds(p: pd.DataFrame, col: str = "p_cal") -> dict:
    out = {}
    for seg in ("dev", "holdout", "all"):
        s = _seg(p, seg)
        m = S.metrics(s.y.to_numpy(), s[col].to_numpy()) if len(s) else {"n": 0}
        out[seg] = m
    return out


def _perm_once(u: pd.DataFrame, name: str, seed: int) -> float:
    rng = np.random.default_rng(seed)
    v = u.copy()
    v["y"] = rng.permutation(v["y"].to_numpy())
    p = walk_forward(v, name)
    h = _seg(p, "holdout")
    return S.acc_fn(h.y.to_numpy(), h.p_cal.to_numpy()) if len(h) else float("nan")


def permutation_test(u: pd.DataFrame, name: str, observed: float, n_perm: int, n_jobs: int = 4) -> dict:
    vals = Parallel(n_jobs=n_jobs)(delayed(_perm_once)(u, name, 1000 + i) for i in range(n_perm))
    vals = np.array([v for v in vals if v == v])
    p = (1 + np.sum(vals >= observed)) / (1 + len(vals))
    return {"n_perm": int(len(vals)), "observed_accuracy": observed, "p_value": float(p),
            "null_mean": float(vals.mean()), "null_p95": float(np.percentile(vals, 95))}


def mde(n: int, alpha: float = 0.05, power: float = 0.8) -> float:
    """Accuratezza minima distinguibile da 0,5 con n eventi (test unilaterale)."""
    za, zb = sps.norm.ppf(1 - alpha), sps.norm.ppf(power)
    p1 = 0.5
    for _ in range(50):
        p1 = 0.5 + (za * 0.5 + zb * math.sqrt(p1 * (1 - p1))) / math.sqrt(max(n, 1))
    return float(p1)


def h2_analysis(u_all_cp: pd.DataFrame) -> dict:
    """Ipotesi H2 / regola R3 sul checkpoint T-1H (zero parametri stimati)."""
    d = u_all_cp[u_all_cp["f_gap_core"].notna()].copy()
    g = d["f_gap_core"]
    sig = np.where(g >= 0.05, -1, np.where(g <= -0.05, 1, 0))
    d["sig"] = sig
    s = d[d.sig != 0]
    hit = ((s.sig > 0) == (s.y == 1))
    k, n = int(hit.sum()), int(len(s))
    hold = s[s.year >= HOLDOUT_FROM]
    hk, hn = int(((hold.sig > 0) == (hold.y == 1)).sum()), int(len(hold))
    out = {
        "events_with_gap": int(len(d)), "signals": n, "hits": k,
        "hit_rate": k / n if n else None, "wilson": S.wilson(k, n), "binom_p": S.binom_p_greater(k, n),
        "holdout_signals": hn, "holdout_hits": hk, "holdout_hit_rate": hk / hn if hn else None,
        "gap_core_quantiles": [float(x) for x in g.quantile([0.1, 0.25, 0.5, 0.75, 0.9])],
    }
    # meccanismo (diagnostica post-release, mai feature)
    m = d[d["diag_surprise_core"].notna()]
    if len(m) > 10:
        rho, pv = sps.spearmanr(m["f_gap_core"], m["diag_surprise_core"])
        out["mechanism_spearman_gap_vs_surprise"] = {"rho": float(rho), "p": float(pv), "n": int(len(m))}
        sign_ok = np.sign(m["f_gap_core"].round(3)) == np.sign(m["diag_surprise_core"].round(3))
        nz = (m["f_gap_core"].abs() >= 0.05) & (m["diag_surprise_core"] != 0)
        out["gap_predicts_surprise_sign"] = {"n": int(nz.sum()),
                                            "hit_rate": float(sign_ok[nz].mean()) if nz.any() else None}
    out["criteria"] = {"signals>=40": n >= 40, "hit>=0.55": (k / n if n else 0) >= 0.55,
                       "binom_p<0.05": (out["binom_p"] or 1) < 0.05,
                       "holdout_hit>=0.55": (hk / hn if hn else 0) >= 0.55}
    out["verdict"] = "PROMETTENTE" if all(out["criteria"].values()) else "NON SUPERATO"
    return out


def surprise_ceiling(u: pd.DataFrame) -> dict:
    """Tetto teorico: chi conoscesse il segno della sorpresa (actual − forecast) in anticipo."""
    out = {}
    for key in ("diag_surprise_core", "diag_surprise_cpi"):
        if key not in u:
            continue
        m = u[u[key].notna() & (u[key] != 0)]
        if len(m) < 10:
            continue
        pred_bear = m[key] > 0
        hit = (pred_bear == (m.y == 0))
        out[key] = {"n": int(len(m)), "hit_rate": float(hit.mean()), "wilson": S.wilson(int(hit.sum()), int(len(m))),
                    "zero_surprise_events": int((u[key] == 0).sum())}
    # sorpresa combinata: core se diverso da zero, altrimenti headline
    if "diag_surprise_core" in u and "diag_surprise_cpi" in u:
        comb = u["diag_surprise_core"].where(u["diag_surprise_core"] != 0, u["diag_surprise_cpi"])
        m = u[comb.notna() & (comb != 0)]
        c = comb[m.index]
        hit = ((c > 0) == (m.y == 0))
        out["combined"] = {"n": int(len(m)), "hit_rate": float(hit.mean()),
                           "wilson": S.wilson(int(hit.sum()), int(len(m)))}
        big = m[c.abs() >= 0.2]
        if len(big):
            hb = ((comb[big.index] > 0) == (big.y == 0))
            out["combined_abs_ge_0.2"] = {"n": int(len(big)), "hit_rate": float(hb.mean())}
        for lab, mm in (("move_ge_20_pips", m.y_move_pips.abs() >= 20), ("move_lt_20_pips", m.y_move_pips.abs() < 20)):
            sub = m[mm]
            if len(sub):
                hs = ((comb[sub.index] > 0) == (sub.y == 0))
                out[f"combined_{lab}"] = {"n": int(len(sub)), "hit_rate": float(hs.mean())}
        zero = u[comb == 0]
        out["in_line_releases"] = {"n": int(len(zero)), "bullish_share": float(zero.y.mean()) if len(zero) else None}
    return out


def univariate_screen(u: pd.DataFrame) -> list[dict]:
    """Esplorativo: correlazione di ogni feature con l'esito in sviluppo, e replica sull'holdout."""
    dev = u[u.year < HOLDOUT_FROM]
    hold = u[u.year >= HOLDOUT_FROM]
    rows, pv = [], {}
    for c in full_features(u):
        a = dev[[c, "y"]].dropna()
        if len(a) < 40 or a[c].nunique() < 3:
            continue
        rho, p = sps.spearmanr(a[c], a["y"])
        b = hold[[c, "y"]].dropna()
        rho_h, p_h = sps.spearmanr(b[c], b["y"]) if len(b) > 20 and b[c].nunique() > 2 else (np.nan, np.nan)
        rows.append({"feature": c[2:], "n_dev": int(len(a)), "rho_dev": float(rho), "p_dev": float(p),
                     "n_holdout": int(len(b)), "rho_holdout": float(rho_h), "p_holdout": float(p_h)})
        pv[c[2:]] = p
    q = S.bh(pv)
    for r in rows:
        r["q_dev_bh"] = q.get(r["feature"])
        r["same_sign_holdout"] = bool(np.sign(r["rho_dev"]) == np.sign(r["rho_holdout"])) if r["rho_holdout"] == r["rho_holdout"] else None
    return sorted(rows, key=lambda r: r["p_dev"])


def magnitude_analysis(u: pd.DataFrame) -> dict:
    """Il movimento (non la direzione) è prevedibile? Walk-forward su range in unità ATR H1."""
    d = u.dropna(subset=["meta_atr_h1_usd", "y_range_pips"]).copy()
    d["range_atr"] = d.y_range_pips * 0.1 / d.meta_atr_h1_usd
    d["body_atr"] = d.y_body_pips * 0.1 / d.meta_atr_h1_usd
    preds = []
    for yr in sorted(d.year.unique()):
        if yr < 2013:
            continue
        tr, te = d[d.t0_utc < pd.Timestamp(f"{yr}-01-01", tz="UTC")], d[d.year == yr]
        if len(tr) < 30:
            continue
        med_ratio = tr.range_atr.median()
        for _, r in te.iterrows():
            preds.append({"year": yr, "pred_range_pips": med_ratio * r.meta_atr_h1_usd / 0.1,
                          "naive_pips": tr.y_range_pips.median(), "actual": r.y_range_pips})
    p = pd.DataFrame(preds)
    out = {"range_atr_median": float(d.range_atr.median()), "body_atr_median": float(d.body_atr.median())}
    if len(p) > 20:
        rho, pv = sps.spearmanr(p.pred_range_pips, p.actual)
        mae_model = float(np.median(np.abs(np.log(p.pred_range_pips / p.actual))))
        mae_naive = float(np.median(np.abs(np.log(p.naive_pips / p.actual))))
        inside = float(((p.actual >= 0.5 * p.pred_range_pips) & (p.actual <= 1.5 * p.pred_range_pips)).mean())
        out.update({"oos_n": int(len(p)), "spearman_pred_vs_actual": float(rho), "p": float(pv),
                    "median_abs_log_error_atr_model": mae_model, "median_abs_log_error_naive_pips": mae_naive,
                    "share_within_50pct": inside})
    return out


def feature_importance(u: pd.DataFrame) -> dict:
    """Quanto pesa ogni feature nei modelli addestrati su tutto lo storico (T-1H).

    Attenzione: "importanza" = quanto il modello usa la feature, NON quanto
    prevede. Un modello senza capacità fuori campione ha comunque feature
    "importanti"."""
    from .models import make_model

    cols = list(u.columns)
    out = {}
    m2 = make_model("M2", cols, len(u)).fit(u, u["y"].to_numpy())
    coef = m2.est[-1].coef_[0]
    out["M2_logistic_std_coef"] = sorted(
        [{"feature": c[2:], "value": float(v)} for c, v in zip(m2.cols, coef)], key=lambda r: -abs(r["value"]))[:25]
    m3 = make_model("M3", cols, len(u)).fit(u, u["y"].to_numpy())
    imp = m3.est[-1].feature_importances_
    out["M3_forest_impurity"] = sorted(
        [{"feature": c[2:], "value": float(v)} for c, v in zip(m3.cols, imp)], key=lambda r: -r["value"])[:25]
    return out


def checkpoint_stability(preds_by_cp: dict[str, pd.DataFrame]) -> dict:
    base = preds_by_cp.get(PRIMARY_CHECKPOINT)
    if base is None or base.empty:
        return {}
    out = {}
    b = base.set_index("event_id")
    for cp, p in preds_by_cp.items():
        if p.empty:
            continue
        j = p.set_index("event_id").join(b[["p_cal"]], rsuffix="_t1h", how="inner")
        same = ((j.p_cal >= 0.5) == (j.p_cal_t1h >= 0.5)).mean()
        out[cp] = {"n": int(len(j)), "same_direction_as_T-1H": float(same),
                   "mean_abs_prob_diff": float((j.p_cal - j.p_cal_t1h).abs().mean())}
    return out


def regime_breakdown(u: pd.DataFrame, p: pd.DataFrame) -> list[dict]:
    j = p.merge(u[["event_id", "f_core_yoy_last", "f_xau_atr_ratio_5_20", "f_y2y_chg_20d", "f_xau_ret_20d_atrd"]],
                on="event_id", how="left")
    out = []
    specs = [
        ("inflazione core > 3%", j.f_core_yoy_last > 3), ("inflazione core ≤ 3%", j.f_core_yoy_last <= 3),
        ("volatilità in espansione (ATR5/ATR20 > 1,1)", j.f_xau_atr_ratio_5_20 > 1.1),
        ("volatilità normale/compressa", j.f_xau_atr_ratio_5_20 <= 1.1),
        ("tassi 2Y in salita (20 gg)", j.f_y2y_chg_20d > 0), ("tassi 2Y in discesa (20 gg)", j.f_y2y_chg_20d <= 0),
        ("oro in trend rialzista (20 gg)", j.f_xau_ret_20d_atrd > 0), ("oro in trend ribassista (20 gg)", j.f_xau_ret_20d_atrd <= 0),
    ]
    pv = {}
    for name, m in specs:
        s_ = j[m.fillna(False)]
        if len(s_) < 5:
            continue
        mt = S.metrics(s_.y.to_numpy(), s_.p_cal.to_numpy())
        k = int(round(mt["accuracy"] * mt["n"]))
        maj = max(mt["base_rate_up"], 1 - mt["base_rate_up"])
        p = S.binom_p_greater(k, mt["n"], maj)
        pv[name] = p
        out.append({"regime": name, "n": mt["n"], "accuracy": mt["accuracy"], "brier": mt["brier"],
                    "bullish_share": mt["base_rate_up"], "majority_rate": maj, "wilson": S.wilson(k, mt["n"]),
                    "binom_p_vs_majority": p})
    hp = S.holm(pv)
    for r in out:
        r["holm_p"] = hp.get(r["regime"])
    return out


def run(df: pd.DataFrame, dataset_hash: str, n_perm: int = 1000, n_explore_perm: int = 200) -> dict:
    res: dict = {"family": "CPI", "dataset_sha256": dataset_hash, "generated_utc": iso(utc_now()),
                 "protocol": "docs/PROTOCOLLO-CPI.md", "criteria": CRIT}
    res["sample"] = sample_accounting(df)
    prim = df[df.t0_utc >= PRIMARY_START]
    preds: dict[str, dict[str, pd.DataFrame]] = {}
    table = []
    for cp in CHECKPOINTS:
        u = usable(prim[prim.checkpoint == cp])
        preds[cp] = {}
        for name in MODEL_NAMES:
            p = walk_forward(u, name)
            preds[cp][name] = p
            ev = evaluate_preds(p)
            table.append({"checkpoint": cp, "model": name, **{f"{seg}_{k}": v for seg in ev for k, v in ev[seg].items()}})
        log.info("walk-forward %s completato", cp)
    res["model_table"] = table
    u1 = usable(prim[prim.checkpoint == PRIMARY_CHECKPOINT])
    res["target"] = target_diagnostics(u1)

    # scelta in sviluppo (T-1H): log loss minima, parità entro 0,002 -> più semplice
    dev_ll = {r["model"]: r["dev_log_loss"] for r in table if r["checkpoint"] == PRIMARY_CHECKPOINT}
    best = min(dev_ll.values())
    cands = [m for m in SIMPLICITY_ORDER if m in dev_ll and dev_ll[m] <= best + 0.002]
    chosen = cands[0]
    res["selection"] = {"dev_log_loss": dev_ll, "chosen": chosen, "rule": "log loss minima in sviluppo 2013-2019"}
    log.info("modello scelto in sviluppo: %s", chosen)

    p = preds[PRIMARY_CHECKPOINT][chosen]
    h = _seg(p, "holdout")
    mh = S.metrics(h.y.to_numpy(), h.p_cal.to_numpy())
    m0 = _seg(preds[PRIMARY_CHECKPOINT]["M0"], "holdout")
    brier_m0 = S.brier(m0.y.to_numpy(), m0.p_cal.to_numpy())
    # i modelli ad alberi sono lenti: 200 permutazioni danno comunque p con risoluzione 0,005
    n_eff = n_perm if chosen not in ("M3", "M4") else min(n_perm, 200)
    perm = permutation_test(u1, chosen, mh["accuracy"], n_eff) if chosen != "M0" else {"p_value": 1.0, "n_perm": 0}
    bk = S.buckets(h.y.to_numpy(), h.p_cal.to_numpy())
    b70 = next(b for b in bk if b.get("cumulative") and b["from"] == 0.7)
    crit = {
        "accuracy>=0.55": mh["accuracy"] >= CRIT["accuracy_min"],
        "permutation_p<0.05": perm["p_value"] < CRIT["perm_p_max"],
        "brier<baseline_M0": mh["brier"] < brier_m0,
        "logloss<0.693": mh["log_loss"] < CRIT["logloss_max"],
    }
    b70_ok = (b70["n"] >= CRIT["bucket70_min_n"] and (b70["hit_rate"] or 0) >= CRIT["bucket70_min_hit"]
              and (b70["wilson_lo"] or 0) > CRIT["bucket70_wilson_lo_min"])
    res["holdout"] = {
        "model": chosen, "metrics": mh, "brier_baseline_M0": brier_m0,
        "accuracy_ci95": S.bootstrap_ci(h.y.to_numpy(), h.p_cal.to_numpy(), S.acc_fn),
        "brier_ci95": S.bootstrap_ci(h.y.to_numpy(), h.p_cal.to_numpy(), lambda a, b: S.brier(a, b)),
        "permutation": perm, "criteria": crit, "buckets": bk, "bucket70_ok": b70_ok,
        "reliability": S.reliability(h.y.to_numpy(), h.p_cal.to_numpy()),
        "min_detectable_accuracy": mde(len(h)),
    }
    res["verdict"] = {
        "primary": "PROMETTENTE" if all(crit.values()) else "NO RELIABLE EDGE",
        "show_70pct": bool(all(crit.values()) and b70_ok),
    }
    # Tutti i modelli sull'holdout, per trasparenza (esplorativo). Test di
    # permutazione, NON binomiale contro il 50%: l'holdout è ~61% bullish e un
    # modello che dice sempre "sale" batterebbe il 50% senza sapere nulla.
    # (Correzione dopo il primo run, dichiarata in docs/RISULTATI-CPI.md.)
    pv, perm_all = {}, {}
    for name in MODEL_NAMES:
        hh = _seg(preds[PRIMARY_CHECKPOINT][name], "holdout")
        acc = S.acc_fn(hh.y.to_numpy(), hh.p_cal.to_numpy())
        if name == chosen and perm.get("n_perm"):
            pt = perm
        elif name == "M0":
            pt = {"p_value": 1.0, "n_perm": 0, "observed_accuracy": acc}
        else:
            pt = permutation_test(u1, name, acc, n_explore_perm)
        perm_all[name] = pt
        pv[name] = pt["p_value"]
    res["exploratory_holdout_perm"] = {"perm": perm_all, "raw": pv, "holm": S.holm(pv),
                                       "n_perm": n_explore_perm}
    # tutto il fuori campione 2013-2026 del modello scelto
    res["oos_all"] = {
        "metrics": S.metrics(p.y.to_numpy(), p.p_cal.to_numpy()),
        "buckets": S.buckets(p.y.to_numpy(), p.p_cal.to_numpy()),
        "reliability": S.reliability(p.y.to_numpy(), p.p_cal.to_numpy()),
        "by_year": [{"year": int(y), **S.metrics(g.y.to_numpy(), g.p_cal.to_numpy())} for y, g in p.groupby("year")],
        "by_regime": regime_breakdown(u1, p),
        "min_detectable_accuracy": mde(len(p)),
    }
    res["checkpoint_stability"] = checkpoint_stability({cp: preds[cp][chosen] for cp in CHECKPOINTS})
    res["h2"] = h2_analysis(u1)
    res["surprise_ceiling"] = surprise_ceiling(u1)
    res["univariate"] = univariate_screen(u1)
    res["magnitude"] = magnitude_analysis(u1)
    res["feature_importance"] = feature_importance(u1)
    res["feature_list"] = [c[2:] for c in full_features(u1)]
    res["feature_coverage"] = {c[2:]: float(u1[c].notna().mean()) for c in full_features(u1)}
    # previsioni OOS del modello scelto (per il Research Lab e l'analisi degli errori)
    res["oos_predictions"] = p.assign(t0_utc=p.t0_utc.astype(str)).to_dict("records")
    return _clean(res), preds
