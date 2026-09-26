"""Riepiloghi della fase 2 per i report e per la dashboard (dopo validazione e conferma finale).

Legge i risultati salvati; le sole cose ricalcolate sono descrittive:
- accuratezza di direzione dei modelli scelti su TUTTI gli eventi fuori campione;
- massimi osservati per numero di condizioni (singole, coppie, terne);
- confronto delle adattività nella griglia dei modelli;
- ESPLORATIVO (nuova ipotesi H-X1, dichiarata dopo la conferma finale): l'ampiezza
  attesa relativa allo spread migliora la selezione? Non entra in nessun verdetto.
"""

from __future__ import annotations

import json
import pickle

import numpy as np
import pandas as pd

from ..config import get_settings
from . import registry as REG
from .anatomy_study import load
from .discovery import CUTOFFS_SEARCH, search
from .models2 import _fit_predict, _weights, columns_for
from .run_models import GROUPS as MODEL_GROUPS
from .run_models import build_data
from .run_rules import prepare
from .trades import REGIME_START, SPLIT


def _dir():
    return get_settings().research_dir / "phase2"


def _dd(r: np.ndarray) -> float:
    if not len(r):
        return 0.0
    eq = np.cumsum(r)
    return float(np.max(np.maximum.accumulate(np.r_[0, eq])[1:] - eq))


def _trade_metrics(trades: list[dict]) -> dict:
    r = np.array([t["R"] for t in trades], dtype=float)
    if not len(r):
        return {"n": 0}
    w, lo = r[r > 0], r[r <= 0]
    return {"n": int(len(r)), "win_rate": float((r > 0).mean()), "mean_R": float(r.mean()),
            "avg_win_R": float(w.mean()) if len(w) else 0.0, "avg_loss_R": float(lo.mean()) if len(lo) else 0.0,
            "pf": float(w.sum() / -lo.sum()) if lo.sum() < 0 else None, "max_dd_R": _dd(r),
            "total_R": float(r.sum())}


def validation_table(val: dict) -> pd.DataFrame:
    rows = []
    for it in val["items"]:
        for stage in ("cpi_validation", "final"):
            if stage not in it:
                continue
            e = it[stage]["eval"]
            m = _trade_metrics(e.get("trades", []))
            rows.append({"id": it["id"], "kind": it["kind"], "group": it["group"],
                         "stage": "CPI 2020-26 (PREVIOUSLY EXPOSED)" if stage == "cpi_validation" else "NFP 2020-26 FINALE",
                         "discovery_n": it["discovery_n"], "discovery_mean_R": it["discovery_mean_R"],
                         "discovery_t": it["discovery_t"], "p_fwer_discovery": it.get("p_fwer"),
                         "n_events": e["n_events"], "n_trades": e["n_trades"],
                         "trade_share": e["n_trades"] / e["n_events"] if e["n_events"] else None,
                         "win_rate": m.get("win_rate"), "mean_R": m.get("mean_R"), "avg_win_R": m.get("avg_win_R"),
                         "avg_loss_R": m.get("avg_loss_R"), "pf": m.get("pf"), "max_dd_R": m.get("max_dd_R"),
                         "t": e["t"], "p_one_sided": e["p_one_sided"], "holm_p": it[stage]["holm_p"],
                         "holm_m": it[stage]["holm_m"], "boot_lo": e["bootstrap95_mean_R"][0],
                         "boot_hi": e["bootstrap95_mean_R"][1],
                         **{f"R_{k}": v for k, v in e.get("by_scenario", {}).items()},
                         **{f"R_k{k}": v for k, v in e.get("by_stop_k", {}).items()},
                         "best_year_share": e.get("best_year_share"), "class": it["class"]})
    return pd.DataFrame(rows)


def oos_direction_accuracy(tr_base: pd.DataFrame, ft: pd.DataFrame, models: dict) -> dict:
    """Modelli congelati (come nella verifica): segno di EV_LONG − EV_SHORT contro l'esito, su tutti gli eventi."""
    data = build_data(tr_base, ft)
    out = {}
    for g, r in models["groups"].items():
        ch = r["chosen"]
        trn = data[data.family.isin(MODEL_GROUPS[g]) & (data.t0_utc < SPLIT)]
        if ch["adapt"] == "rolling5y":
            trn = trn[trn.t0_utc >= pd.Timestamp("2015-01-01", tz="UTC")]
        cols = columns_for(list(data.columns), ch["features"])
        w = _weights(trn, 2020, ch["adapt"])
        for fam in MODEL_GROUPS[g]:
            te = data[(data.family == fam) & (data.t0_utc >= SPLIT)]
            Xtr, Xte = trn[cols].to_numpy(dtype=float), te[cols].to_numpy(dtype=float)
            el = _fit_predict(ch["model"], Xtr, trn.R_long.to_numpy(), w, Xte)
            es = _fit_predict(ch["model"], Xtr, trn.R_short.to_numpy(), w, Xte)
            y_up = (te.R_long > te.R_short).to_numpy()
            pred_up = el >= es
            out[f"{g}->{fam}"] = {"n": int(len(te)), "accuracy_all_events": float((pred_up == y_up).mean()),
                                  "share_up": float(y_up.mean())}
    return out


def by_k_conditions(prep: dict) -> dict:
    """Miglior t osservato per numero di condizioni (singole, coppie, terne)."""
    out = {}
    for g, obj in prep.items():
        for cut, (sp, rL, rS, strata, ms, pa_rows) in obj["per_cut"].items():
            for d, r in (("LONG", rL), ("SHORT", rS)):
                s = search(sp, r, ms)
                out[f"{g}|{cut}|{d}"] = {"max1": s["max1"], "max2": s["max2"], "max3": s["max3"],
                                         "n_primitives": int(sp.M.shape[0])}
    return out


def adaptivity(models: dict) -> list[dict]:
    t = pd.DataFrame(models["table"])
    t = t[t.n_trades >= 20]
    return (t.groupby(["group", "adapt"]).agg(configs=("t", "size"), t_median=("t", "median"), t_max=("t", "max"),
                                              mean_R_median=("mean_R", "median"))
            .reset_index().to_dict("records"))


def family_value(models: dict) -> list[dict]:
    """Per ogni insieme di feature: miglior t e t mediano su modelli, adattività e τ (scoperta)."""
    t = pd.DataFrame(models["table"])
    t = t[t.n_trades >= 20]
    return (t.groupby(["group", "features"]).agg(configs=("t", "size"), t_median=("t", "median"), t_max=("t", "max"))
            .reset_index().to_dict("records"))


def magnitude_selection(tr_base: pd.DataFrame, ev: pd.DataFrame) -> list[dict]:
    """ESPLORATIVO H-X1: terzili di U_news / spread a T−10 s (noto prima), per periodo."""
    x = tr_base[tr_base.ok == True].merge(ev[["event_id", "a_spread_m10", "a_move"]], on="event_id")  # noqa: E712
    x = x[x.t0_utc >= REGIME_START].copy()
    x["room"] = x.U / x.a_spread_m10
    x["period"] = np.where(x.t0_utc < SPLIT, "2013-19", "2020-26")
    x["oracle_R"] = np.maximum(x.R_long, x.R_short)
    x["cost_R"] = -(x.R_long + x.R_short) / 2
    rows = []
    for (fam, per), g in x.groupby(["family", "period"]):
        q = g.room.quantile([1 / 3, 2 / 3]).to_numpy()
        # soglie dei terzili dalla scoperta, riusate dopo (niente sbirciate)
        qd = x[(x.family == fam) & (x.period == "2013-19")].room.quantile([1 / 3, 2 / 3]).to_numpy()
        lab = np.where(g.room <= qd[0], "basso", np.where(g.room <= qd[1], "medio", "alto"))
        for t, h in g.groupby(lab):
            rows.append({"family": fam, "period": per, "room_tercile": t, "n": int(len(h)),
                         "cost_R": float(h.cost_R.mean()), "oracle_R": float(h.oracle_R.mean()),
                         "mean_R_long": float(h.R_long.mean()), "mean_R_short": float(h.R_short.mean())})
        del q
    return rows


PA_SIGNALS = ["f_pa_m1_b1_dir", "f_pa_m5_b1_dir", "f_pa_m15_b1_dir", "f_pa_h1_b1_dir", "f_pa_h4_b1_dir",
              "f_pa_d1_b1_dir", "f_pa_m5_roc10_atr", "f_pa_m15_roc10_atr", "f_pa_h1_roc10_atr", "f_pa_h4_roc10_atr",
              "f_pa_d1_roc10_atr", "f_xau_ret_5m_atrh", "f_xau_ret_15m_atrh", "f_xau_ret_60m_atrh",
              "f_xau_ret_240m_atrh", "f_xau_ret_24h_atrd"]


def pa_baselines(tr_base: pd.DataFrame, ev: pd.DataFrame, ft: pd.DataFrame) -> list[dict]:
    """Regole di price action semplici (baseline): la M1 della news segue (o inverte) il segno del segnale?

    Accuratezza di direzione (la domanda dell'ipotesi manuale) ed R medio del trade, per periodo."""
    from scipy import stats as sps

    x = ft[ft.cutoff == "T-1M"][["event_id"] + PA_SIGNALS]
    d = tr_base[tr_base.ok == True].merge(x, on="event_id").merge(ev[["event_id", "a_move"]], on="event_id")  # noqa: E712
    d = d[(d.t0_utc >= REGIME_START) & (d.a_move != 0)]
    d["period"] = np.where(d.t0_utc < SPLIT, "2013-19", "2020-26")
    rows = []
    for sig in PA_SIGNALS:
        for (fam, per), g in d.groupby(["family", "period"]):
            s = np.sign(g[sig].to_numpy(dtype=float))
            m = np.isfinite(s) & (s != 0)
            hit = (s[m] == np.sign(g.a_move.to_numpy()[m]))
            n = int(m.sum())
            k = int(hit.sum())
            r_mom = np.where(s[m] > 0, g.R_long.to_numpy()[m], g.R_short.to_numpy()[m])
            r_rev = np.where(s[m] > 0, g.R_short.to_numpy()[m], g.R_long.to_numpy()[m])
            rows.append({"signal": sig[2:], "family": fam, "period": per, "n": n,
                         "momentum_hit_rate": k / n if n else None,
                         "p_two_sided": float(sps.binomtest(k, n, 0.5).pvalue) if n else None,
                         "mean_R_momentum": float(r_mom.mean()) if n else None,
                         "mean_R_reversal": float(r_rev.mean()) if n else None})
    return rows


def scenario_tests(val: dict, tr: dict) -> list[dict]:
    """Stessi trade dei test fuori campione, t e p unilaterale per ogni scenario di costo (descrittivo)."""
    from .validate import holm, one_sided_t

    rows = []
    for it in val["items"]:
        for stage in ("cpi_validation", "final"):
            if stage not in it or not it[stage]["eval"].get("trades"):
                continue
            tt = pd.DataFrame(it[stage]["eval"]["trades"])
            for sc, tab in tr.items():
                t = tab.set_index("event_id").loc[tt.event_id]
                r = np.where(tt.action.to_numpy() == "LONG", t.R_long.to_numpy(), t.R_short.to_numpy())
                tv, pv = one_sided_t(r)
                rows.append({"id": it["id"], "stage": stage, "scenario": sc, "n": int(len(r)),
                             "mean_R": float(r.mean()), "t": tv, "p_one_sided": pv})
    df = pd.DataFrame(rows)
    for (stage, sc), g in df.groupby(["stage", "scenario"]):
        m = 5 if stage == "final" else None
        df.loc[g.index, "holm_p"] = holm(g.p_one_sided.tolist(), m)
    return df.to_dict("records")


def _hx1(tr_base, ev):
    rows = magnitude_selection(tr_base, ev)
    REG.log_experiment_once("exploratory", "ALL", "HX1_magnitude_selection", 6,
                            {"note": "dichiarata dopo la conferma finale; terzili di U_news/spread; descrittiva"},
                            "p2", None, {})
    return rows


def export_trades(tr: dict, ev: pd.DataFrame, ft: pd.DataFrame) -> pd.DataFrame:
    """Tabella piccola e congelata dei trade storici (serve al motore live e al simulatore anche
    senza i percorsi tick, che non sono nel repository)."""
    b = tr["base"][tr["base"].ok == True].copy()  # noqa: E712
    c = tr["conservative"].set_index("event_id")
    x = ft[ft.cutoff == "T-1M"].set_index("event_id")
    b["R_long_cons"] = b.event_id.map(c.R_long)
    b["R_short_cons"] = b.event_id.map(c.R_short)
    b["unit_atr_m1_60"] = b.event_id.map(x.unit_atr_m1_60)
    e = ev.set_index("event_id")
    b["a_move"] = b.event_id.map(e.a_move)
    b["a_range"] = b.event_id.map(e.a_range)
    b["a_spread_m10"] = b.event_id.map(e.a_spread_m10)
    b["range_over_atr"] = b.a_range / b.unit_atr_m1_60
    cols = ["event_id", "family", "t0_utc", "year", "U", "sl_usd", "R_long", "R_short", "R_long_cons", "R_short_cons",
            "stop_long", "stop_short", "a_move", "a_range", "a_spread_m10", "unit_atr_m1_60", "range_over_atr"]
    out = b[cols].sort_values("t0_utc")
    out.assign(t0_utc=out.t0_utc.astype(str)).to_csv(_dir() / "p2_trades_base.csv", index=False)
    return out


def run() -> dict:
    d = _dir()
    val = json.loads((d / "p2_validation.json").read_text())
    models = json.loads((d / "p2_models_discovery.json").read_text())
    rules = json.loads((d / "p2_rules_discovery.json").read_text())
    ev, ft, _ = load()
    tr = pickle.loads((get_settings().data_dir / "p2_cache" / "trades.pkl").read_bytes())
    vt = validation_table(val)
    vt.to_csv(d / "validation_tests.csv", index=False)
    cands = []
    for g, r in rules.items():
        for i, c in enumerate(r["candidates"]):
            cands.append({"id": f"RULE-{g}-{i + 1}", "group": g, "cutoff": c["cutoff"], "direction": c["direction"],
                          "conditions": " AND ".join(c["conditions"]), "n": c["n"], "mean_R": c["mean_R"],
                          "mean_R_conservative": c["mean_R_conservative"], "win_rate": c["win_rate"],
                          "t": c["t_search"], "p_fwer": c["p_fwer"], "q_bh": c["q_bh"], "sel_score": c["sel_score"]})
    pd.DataFrame(cands).to_csv(d / "rule_candidates.csv", index=False)
    pd.DataFrame(models["table"]).to_csv(d / "model_grid_discovery.csv", index=False)
    export_trades(tr, ev, ft)
    prep = prepare(tr["base"], ft)
    out = {
        "rules_null": {g: {"n_hyp": r["n_hyp"], "n_perm": r["n_perm"], "null_max": r["null_max_quantiles"],
                           "null_pa": r["null_pa_quantiles"], "observed_best": r["observed_best"],
                           "best_p_fwer": min(t["p_fwer"] for t in r["top"]),
                           "best_pa_p_fwer": min((t["p_fwer_pa"] for t in r["top"] if t["pa_only"]), default=None)}
                       for g, r in rules.items()},
        "by_k_conditions": by_k_conditions(prep),
        "adaptivity": adaptivity(models),
        "family_value": family_value(models),
        "oos_direction_accuracy": oos_direction_accuracy(tr["base"], ft, models),
        "exploratory_HX1_magnitude_selection": _hx1(tr["base"], ev),
        "pa_simple_baselines": pa_baselines(tr["base"], ev, ft),
        "scenario_tests": scenario_tests(val, tr),
        "registry": REG.registry_summary(),
        "verdict": val["verdict"],
    }
    (d / "p2_summary.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    reg = REG.registry_summary()
    (d / "experiment_registry.json").write_text(json.dumps(reg, indent=1), encoding="utf-8")
    return out
