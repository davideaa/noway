"""Verifica fuori campione (protocollo §7-§8 ed emendamento 1).

1. VALIDAZIONE CPI 2020-2026 (PREVIOUSLY EXPOSED OOS): candidati regola CPI
   e CONDIVISI applicati al CPI, modello CPI e modello CONDIVISO. Holm su
   tutti i test CPI.
2. CONFERMA FINALE NFP 2020-2026, una volta: le 3 regole migliori fra NFP e
   CONDIVISO (punteggio di selezione), modello NFP, modello CONDIVISO.
   Holm con m = 5.

Tutto è congelato prima: soglie delle regole dalla scoperta, modelli
addestrati una volta sugli eventi prima del 2020, τ scelto nel
walk-forward di scoperta. Qui non si sceglie niente.
"""

from __future__ import annotations

import hashlib
import json
import logging

import numpy as np
import pandas as pd
from scipy import stats as sps

from ..config import get_settings
from ..timeutil import iso, utc_now
from . import registry as REG
from .models2 import _fit_predict, _weights, columns_for, decide
from .run_models import GROUPS as MODEL_GROUPS
from .run_models import build_data
from .run_rules import prepare
from .trades import FINAL_KEY, SPLIT, build_trades, final_nfp_outcomes, period

log = logging.getLogger("xnb.phase2.validate")
K_GRID = [0.42, 0.51, 0.60, 0.69, 0.78]
SCEN = ["optimistic", "base", "conservative", "stress"]
FINAL_M = 5
MIN_TRADES_TEST = 5
OUT = "p2_validation.json"
SEAL = "FINAL_NFP_OPENED.json"


def _dir():
    return get_settings().research_dir / "phase2"


def _sha(p) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()[:12]


# ------------------------------------------------------------------ statistica
def one_sided_t(r: np.ndarray) -> tuple[float, float]:
    n = len(r)
    if n < MIN_TRADES_TEST or np.std(r) == 0:
        return 0.0, 1.0
    t = float(r.mean() / (r.std(ddof=1) / np.sqrt(n)))
    return t, float(sps.t.sf(t, n - 1))


def holm(p: list[float], m: int | None = None) -> list[float]:
    """p aggiustati di Holm; con ``m`` > len(p) i test mancanti contano come p = 1."""
    m = max(m or len(p), len(p))
    order = np.argsort(p)
    adj = np.empty(len(p))
    run = 0.0
    for rank, i in enumerate(order):
        run = max(run, min(1.0, (m - rank) * p[i]))
        adj[i] = run
    return adj.tolist()


def bootstrap_ci(r: np.ndarray, n_boot: int = 10_000, seed: int = 5) -> list[float]:
    if len(r) < 2:
        return [float("nan"), float("nan")]
    rng = np.random.default_rng(seed)
    mu = r[rng.integers(0, len(r), (n_boot, len(r)))].mean(1)
    return [float(np.quantile(mu, 0.025)), float(np.quantile(mu, 0.975))]


# ------------------------------------------------------------------ decisioni congelate
def rule_decisions(cand: dict, spaces: dict, ft: pd.DataFrame, events: pd.DataFrame) -> pd.DataFrame:
    """Eventi in cui la regola scatta, con la sua direzione. Soglie della scoperta."""
    sp = spaces[cand["group"]][cand["cutoff"]]
    labels = [sp.labels[i] for i in cand["idx"]]
    if labels != list(cand["conditions"]):
        raise RuntimeError(f"spazio ricostruito diverso: {labels} != {cand['conditions']}")
    X = ft[ft.cutoff == cand["cutoff"]].set_index("event_id").loc[events.event_id].reset_index()
    m = sp.apply(X, cand["idx"])
    act = "LONG" if cand["direction"] == "LONG" else "SHORT"
    return pd.DataFrame({"event_id": events.event_id.to_numpy()[m], "action": act})


def model_decisions(chosen: dict, g: str, data: pd.DataFrame, target: pd.DataFrame) -> pd.DataFrame:
    """Modello addestrato UNA volta sugli eventi del gruppo prima del 2020, applicato a ``target``."""
    tr = data[data.family.isin(MODEL_GROUPS[g]) & (data.t0_utc < SPLIT)]
    if chosen["adapt"] == "rolling5y":
        tr = tr[tr.t0_utc >= pd.Timestamp("2015-01-01", tz="UTC")]
    cols = columns_for(list(data.columns), chosen["features"])
    w = _weights(tr, 2020, chosen["adapt"])
    Xtr, Xte = tr[cols].to_numpy(dtype=float), target[cols].to_numpy(dtype=float)
    pred = pd.DataFrame({"event_id": target.event_id.to_numpy(),
                         "ev_long": _fit_predict(chosen["model"], Xtr, tr.R_long.to_numpy(), w, Xte),
                         "ev_short": _fit_predict(chosen["model"], Xtr, tr.R_short.to_numpy(), w, Xte),
                         "R_long": 0.0, "R_short": 0.0})
    d = decide(pred, chosen["tau"])
    d = d[d.action != "NO TRADE"]
    return d[["event_id", "action", "ev_long", "ev_short"]]


# ------------------------------------------------------------------ valutazione
def evaluate(dec: pd.DataFrame, n_events: int, trk: dict, trs: dict, entries: dict) -> dict:
    """Esito dei trade decisi, con le varianti di robustezza a decisioni fisse."""
    def r_of(tab: pd.DataFrame) -> np.ndarray:
        t = tab.set_index("event_id").loc[dec.event_id]
        return np.where(dec.action.to_numpy() == "LONG", t.R_long.to_numpy(), t.R_short.to_numpy()).astype(float)

    base = trs["base"]
    r = r_of(base)
    ok = np.isfinite(r)
    dec, r = dec[ok].reset_index(drop=True), r[ok]
    years = base.set_index("event_id").loc[dec.event_id, "year"].to_numpy()
    t, p = one_sided_t(r)
    out = {"n_events": int(n_events), "n_trades": int(len(r)),
           "n_long": int((dec.action == "LONG").sum()), "n_short": int((dec.action == "SHORT").sum()),
           "mean_R": float(r.mean()) if len(r) else None, "t": t, "p_one_sided": p,
           "win_rate": float((r > 0).mean()) if len(r) else None, "total_R": float(r.sum()),
           "bootstrap95_mean_R": bootstrap_ci(r)}
    if not len(r):
        return out
    out["by_scenario"] = {s: float(np.nanmean(r_of(trs[s]))) for s in SCEN}
    out["by_stop_k"] = {str(k): float(np.nanmean(r_of(trk[k]))) for k in K_GRID}
    out["by_entry"] = {e: float(np.nanmean(r_of(tab))) for e, tab in entries.items()}
    yr = pd.Series(r).groupby(years).agg(["size", "mean", "sum"])
    out["by_year"] = [{"year": int(y), "n": int(v["size"]), "mean_R": float(v["mean"]), "sum_R": float(v["sum"])}
                      for y, v in yr.iterrows()]
    tot = r.sum()
    out["best_year_share"] = float(yr["sum"].max() / tot) if tot > 0 else None
    for tag, ex in (("ex_2020", [2020]), ("ex_2022", [2022]), ("ex_2020_2022", [2020, 2022])):
        m = ~np.isin(years, ex)
        out[f"mean_R_{tag}"] = float(r[m].mean()) if m.any() else None
    out["trades"] = [{"event_id": e, "action": a, "R": float(x), "year": int(y)}
                     for e, a, x, y in zip(dec.event_id, dec.action, r, years)]
    return out


def classify(item: dict) -> str:
    """Protocollo §8, deterministico."""
    fin = item.get("final")
    cpi = item.get("cpi_validation")
    cls = "NO EVIDENCE"
    robust = False
    if fin and fin.get("holm_p") is not None and fin["holm_p"] < 0.05:
        e = fin["eval"]
        robust = (e["n_trades"] >= 20 and e.get("by_scenario", {}).get("conservative", -1) > 0
                  and all(v > 0 for v in e.get("by_stop_k", {"x": -1}).values())
                  and e.get("best_year_share") is not None and e["best_year_share"] <= 0.5)
    if robust:
        cls = "ROBUST OOS EDGE"
    elif (fin and fin.get("holm_p") is not None and fin["holm_p"] < 0.10) or \
            (cpi and cpi.get("holm_p") is not None and cpi["holm_p"] < 0.05):
        cls = "PROMISING BUT UNPROVEN"
    elif (item.get("discovery_t") or 0) > 2 or (item.get("p_fwer") is not None and item["p_fwer"] < 0.20):
        cls = "WEAK / EXPLORATORY"
    if cls != "NO EVIDENCE" and item["group"] in ("CPI", "SHARED"):
        cls += " + LIVE CONFIRMATION REQUIRED"
    return cls


# ------------------------------------------------------------------ esecuzione
def run(open_final: bool = True) -> dict:
    from .anatomy_study import load

    d = _dir()
    rules_p, models_p = d / "p2_rules_discovery.json", d / "p2_models_discovery.json"
    rules, models = json.loads(rules_p.read_text()), json.loads(models_p.read_text())
    inputs = {"rules_sha": _sha(rules_p), "models_sha": _sha(models_p),
              "features_sha": _sha(d / "p2_features.parquet"), "events_sha": _sha(d / "p2_events.parquet")}
    seal = d / SEAL
    if open_final and seal.exists():
        prev = json.loads(seal.read_text())
        if prev["inputs"] != inputs:
            raise PermissionError("il test finale NFP è già stato aperto con candidati diversi: non si ripete")
    ev, ft, paths = load()
    trs = {s: build_trades(s, ev=ev, ft=ft, paths=paths) for s in SCEN}
    trk = {k: (trs["base"] if k == 0.60 else build_trades("base", k=k, ev=ev, ft=ft, paths=paths)) for k in K_GRID}
    entries = {e: build_trades("base", entry=e, ev=ev, ft=ft, paths=paths) for e in ("m30", "m10", "m5")}
    prep = prepare(trs["base"], ft)
    spaces = {g: {c: v[0] for c, v in o["per_cut"].items()} for g, o in prep.items()}
    data = build_data(trs["base"], ft)

    items: list[dict] = []
    for g in ("CPI", "NFP", "SHARED"):
        for i, c in enumerate(rules[g]["candidates"]):
            items.append({"id": f"RULE-{g}-{i + 1}", "kind": "rule", "group": g, "spec": c,
                          "discovery_t": c["t_search"], "p_fwer": c.get("p_fwer"),
                          "sel_score": c["sel_score"], "discovery_mean_R": c["mean_R"], "discovery_n": c["n"]})
    for g, r in models["groups"].items():
        ch = r["chosen"]
        items.append({"id": f"MODEL-{g}", "kind": "model", "group": g, "spec": ch, "discovery_t": ch["t"],
                      "p_fwer": None, "discovery_mean_R": ch["mean_R"], "discovery_n": ch["n_trades"]})

    def decisions(it: dict, target_fam: str, target: pd.DataFrame) -> pd.DataFrame:
        if it["kind"] == "rule":
            return rule_decisions({**it["spec"], "group": it["group"]}, spaces, ft, target)
        tgt = data[data.event_id.isin(target.event_id)]
        return model_decisions(it["spec"], it["group"], data, tgt)

    # 1. validazione CPI (esposta)
    cpi_ev = period(trs["base"][trs["base"].ok == True], "cpi_validation")  # noqa: E712
    cpi_items = [it for it in items if it["group"] in ("CPI", "SHARED")]
    for it in cpi_items:
        dec = decisions(it, "CPI", cpi_ev)
        it["cpi_validation"] = {"eval": evaluate(dec, len(cpi_ev), trk, trs, entries)}
    adj = holm([it["cpi_validation"]["eval"]["p_one_sided"] for it in cpi_items])
    for it, a in zip(cpi_items, adj):
        it["cpi_validation"]["holm_p"] = a
        it["cpi_validation"]["holm_m"] = len(cpi_items)
    REG.log_experiment("cpi_validation", "CPI", "oos_tests", len(cpi_items), {"items": [i["id"] for i in cpi_items]},
                       inputs["features_sha"], None,
                       {i["id"]: i["cpi_validation"]["holm_p"] for i in cpi_items})

    res = {"inputs": inputs, "cpi_validation_label": "PREVIOUSLY EXPOSED OOS", "cpi_holm_m": len(cpi_items)}
    # 2. conferma finale NFP: selezione dei test fissata PRIMA di aprire gli esiti
    rule_pool = sorted([it for it in items if it["kind"] == "rule" and it["group"] in ("NFP", "SHARED")],
                       key=lambda it: -it["sel_score"])[:3]
    fin_items = rule_pool + [it for it in items if it["kind"] == "model" and it["group"] in ("NFP", "SHARED")]
    res["final_tests"] = [it["id"] for it in fin_items]
    if open_final:
        nfp_ev = final_nfp_outcomes(trs["base"][trs["base"].ok == True], FINAL_KEY)  # noqa: E712
        seal.write_text(json.dumps({"opened_utc": iso(utc_now()), "inputs": inputs, "tests": res["final_tests"],
                                    "holm_m": FINAL_M, "code_commit": REG.code_commit()}, indent=1))
        for it in fin_items:
            dec = decisions(it, "NFP", nfp_ev)
            it["final"] = {"eval": evaluate(dec, len(nfp_ev), trk, trs, entries)}
        adj = holm([it["final"]["eval"]["p_one_sided"] for it in fin_items], m=FINAL_M)
        for it, a in zip(fin_items, adj):
            it["final"]["holm_p"] = a
            it["final"]["holm_m"] = FINAL_M
        REG.log_experiment("nfp_final", "NFP", "oos_tests", len(fin_items), {"items": res["final_tests"], "m": FINAL_M},
                           inputs["features_sha"], None, {i["id"]: i["final"]["holm_p"] for i in fin_items})
    for it in items:
        it["class"] = classify(it)
    res["items"] = items
    res["verdict"] = ("EDGE FOUND" if any(it["class"].startswith("ROBUST") for it in items)
                      else "NO RELIABLE EDGE")
    (d / OUT).write_text(json.dumps(res, indent=1, default=lambda o: o.tolist() if hasattr(o, "tolist") else str(o)),
                         encoding="utf-8")
    return res
