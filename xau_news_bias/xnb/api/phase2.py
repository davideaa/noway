"""API della fase 2: risultati di ricerca, simulatore di trade, Compute Center, trade live.

Tutto viene letto dai file congelati in ``research_output/phase2`` e dal database: niente qui
ricalcola o sceglie modelli.
"""

from __future__ import annotations

import json
import subprocess
import sys
from functools import lru_cache

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import PROJECT_DIR, get_settings
from ..db import session, verify_chain
from ..phase2 import registry as REG

router = APIRouter(prefix="/api")
_PROCS: dict[str, subprocess.Popen] = {}
CAMPAIGNS = {"rules": ("p2_rules_v1", "scripts/phase2_rules.py"), "models": ("p2_models_v1", "scripts/phase2_models.py")}


def _p2():
    return get_settings().research_dir / "phase2"


def _load(name: str):
    p = _p2() / name
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def _clean(o):
    """JSON rigoroso: NaN e infiniti diventano null."""
    if isinstance(o, float):
        return o if np.isfinite(o) else None
    if isinstance(o, dict):
        return {k: _clean(v) for k, v in o.items()}
    if isinstance(o, list):
        return [_clean(v) for v in o]
    return o


@router.get("/phase2")
def phase2_summary():
    val = _load("p2_validation.json")
    if val is None:
        raise HTTPException(404, "ricerca di fase 2 non eseguita")
    rules = _load("p2_rules_discovery.json") or {}
    models = _load("p2_models_discovery.json") or {}
    summ = _load("p2_summary.json") or {}
    stops = _load("p2_stops.json") or {}
    anat = _load("p2_anatomy_prereg.json") or {}
    eras = _load("p2_eras.json") or []
    regimes = _load("p2_regimes_all.json") or {}
    seal = _load("FINAL_NFP_OPENED.json")
    items = []
    for it in val["items"]:
        x = {k: it[k] for k in ("id", "kind", "group", "class", "discovery_t", "p_fwer", "discovery_mean_R",
                                "discovery_n") if k in it}
        sp = it["spec"]
        x["spec"] = ({"cutoff": sp["cutoff"], "direction": sp["direction"], "conditions": sp["conditions"],
                      "win_rate": sp["win_rate"], "mean_R_conservative": sp["mean_R_conservative"],
                      "sel_score": sp["sel_score"]} if it["kind"] == "rule" else
                     {k: sp[k] for k in ("model", "features", "adapt", "tau")})
        for st in ("cpi_validation", "final"):
            if st in it:
                e = {k: v for k, v in it[st]["eval"].items() if k != "trades"}
                x[st] = {"holm_p": it[st]["holm_p"], "holm_m": it[st]["holm_m"], **e}
        items.append(x)
    groups = {}
    for g, r in (models.get("groups") or {}).items():
        groups[g] = {k: r[k] for k in ("chosen", "n_configs", "share_configs_positive", "t_quantiles_all_configs",
                                       "baselines", "ablation", "by_year")}
    rules_out = {g: {k: r[k] for k in ("n_hyp", "n_perm", "null_max_quantiles", "null_pa_quantiles", "observed_best")}
                 | {"top": r["top"][:25], "candidates": r["candidates"]} for g, r in rules.items()}
    return _clean({
        "verdict": val["verdict"], "final_tests": val.get("final_tests"), "sealed": seal,
        "cpi_validation_label": val.get("cpi_validation_label"), "items": items,
        "rules": rules_out, "models": groups,
        "models_checkpoints": models.get("checkpoints_direction_magnitude"),
        "summary": {k: summ.get(k) for k in ("by_k_conditions", "adaptivity", "family_value", "oos_direction_accuracy",
                                             "exploratory_HX1_magnitude_selection", "pa_simple_baselines",
                                             "scenario_tests", "rules_null")},
        "stops": stops, "anatomy": {k: anat.get(k) for k in ("asymmetry", "unit_study", "stop_choice",
                                                              "time_to_extreme_s")},
        "eras": eras, "regimes": {k: v for k, v in regimes.items() if k != "series"},
        "regime_breaks": {f: {c: x.get("segments") for c, x in s.items() if not c.startswith("_")}
                          for f, s in (regimes.get("series") or {}).items()},
    })


# ------------------------------------------------------------------ simulatore
@lru_cache(maxsize=1)
def _base_trades() -> pd.DataFrame | None:
    p = _p2() / "p2_trades_base.csv"
    if not p.exists():
        return None
    t = pd.read_csv(p)
    t["t0_utc"] = pd.to_datetime(t.t0_utc, utc=True)
    return t


@lru_cache(maxsize=64)
def _trades_for(k: float, entry: str, scenario: str) -> pd.DataFrame | None:
    """Trade ricostruiti dai tick (servono i percorsi congelati, che non sono nel repository)."""
    if not (_p2() / "p2_paths.parquet").exists():
        return None
    from ..phase2.anatomy_study import load
    from ..phase2.trades import build_trades

    ev, ft, paths = load()
    t = build_trades(scenario, k=k, entry=entry, ev=ev, ft=ft, paths=paths)
    return t[t.ok == True].copy()  # noqa: E712


def _metrics(r: np.ndarray) -> dict:
    if not len(r):
        return {"n": 0}
    w, lo = r[r > 0], r[r <= 0]
    eq = np.cumsum(r)
    dd = float(np.max(np.maximum.accumulate(np.r_[0, eq])[1:] - eq))
    t = float(r.mean() / (r.std(ddof=1) / np.sqrt(len(r)))) if len(r) > 2 and r.std() > 0 else None
    return {"n": int(len(r)), "mean_R": float(r.mean()), "win_rate": float((r > 0).mean()),
            "avg_win_R": float(w.mean()) if len(w) else None, "avg_loss_R": float(lo.mean()) if len(lo) else None,
            "pf": float(w.sum() / -lo.sum()) if lo.sum() < 0 else None, "max_dd_R": dd, "total_R": float(r.sum()),
            "t": t}


@router.get("/phase2/simulate")
def simulate(family: str = "NFP", strategy: str = "always_long", k: float = 0.60, entry: str = "m10",
             scenario: str = "base", start: int = 2013, end: int = 2026):
    """Strategie semplici o candidati testati, su eventi storici. Solo descrittivo."""
    if entry not in ("m60", "m30", "m10", "m5", "last") or scenario not in ("optimistic", "base", "conservative", "stress"):
        raise HTTPException(400, "parametri non validi")
    if not 0.1 <= k <= 5:
        raise HTTPException(400, "k fuori intervallo (0,1–5)")
    custom = not (abs(k - 0.60) < 1e-9 and entry == "m10" and scenario in ("base", "conservative"))
    t = _trades_for(round(k, 3), entry, scenario) if custom else _base_trades()
    note = None
    if t is None:
        if custom:
            raise HTTPException(409, "percorsi tick non presenti: eseguire scripts/phase2_build.py per stop/ingressi diversi")
        raise HTTPException(404, "tabella dei trade di fase 2 assente")
    rl, rs = ("R_long", "R_short")
    if not custom and scenario == "conservative":
        rl, rs = "R_long_cons", "R_short_cons"
    fams = ["CPI", "NFP"] if family == "ALL" else [family]
    d = t[t.family.isin(fams) & (t.year >= start) & (t.year <= end)].sort_values("t0_utc")
    if strategy == "always_long":
        side = np.ones(len(d))
    elif strategy == "always_short":
        side = -np.ones(len(d))
    elif strategy == "oracle":
        side = np.where(d[rl] >= d[rs], 1.0, -1.0)
        note = "ORACOLO: conosce in anticipo il lato migliore. È il tetto, non una strategia."
    elif strategy == "random":
        side = np.random.default_rng(12345).choice([-1.0, 1.0], len(d))
    elif strategy.startswith("candidate:"):
        val = _load("p2_validation.json") or {"items": []}
        it = next((i for i in val["items"] if i["id"] == strategy.split(":", 1)[1]), None)
        if it is None:
            raise HTTPException(404, "candidato sconosciuto")
        acts = {}
        for st in ("cpi_validation", "final"):
            for tr in (it.get(st) or {}).get("eval", {}).get("trades", []):
                acts[tr["event_id"]] = 1.0 if tr["action"] == "LONG" else -1.0
        side = d.event_id.map(acts).fillna(0).to_numpy()
        note = "Decisioni del candidato fuori campione (congelate). Fuori da quei periodi: nessun trade."
    else:
        raise HTTPException(400, "strategia sconosciuta")
    r = np.where(side > 0, d[rl], np.where(side < 0, d[rs], np.nan))
    m = np.isfinite(r)
    rr = r[m]
    ids = d.event_id.to_numpy()[m]
    return _clean({"params": {"family": family, "strategy": strategy, "k": k, "entry": entry, "scenario": scenario,
                              "start": start, "end": end}, "note": note, "metrics": _metrics(rr),
                   "equity": [{"event_id": e, "R": float(x), "cum": float(c)} for e, x, c in zip(ids, rr, np.cumsum(rr))]})


# ------------------------------------------------------------------ compute center
@router.get("/compute")
def compute():
    info = REG.compute_info()
    reg = REG.registry_summary()
    running = {k: (p.poll() is None) for k, p in _PROCS.items()}
    cps = {c["name"]: c for c in reg["campaigns"]}
    out = []
    for key, (name, _) in CAMPAIGNS.items():
        c = cps.get(name, {})
        done_before = None
        if key == "rules":
            done_before = len(REG.perm_done(name))
        out.append({"key": key, **c, "running": running.get(key, False), "checkpointed": done_before})
    return {"hardware": info, "modes": {m: REG.workers_for(m, info["cpu_cores"]) for m in REG.MODES},
            "campaigns": out, "registry": reg}


class StartReq(BaseModel):
    campaign: str
    mode: str = "AUTO"
    workers: int | None = None


@router.post("/compute/start")
def compute_start(req: StartReq):
    """Avvia (o riprende) una campagna in un processo separato. I risultati già salvati non si ricalcolano."""
    if req.campaign not in CAMPAIGNS or req.mode not in REG.MODES:
        raise HTTPException(400, "campagna o modalità sconosciuta")
    p = _PROCS.get(req.campaign)
    if p is not None and p.poll() is None:
        raise HTTPException(409, "campagna già in esecuzione")
    name, _ = CAMPAIGNS[req.campaign]
    st = next((c for c in REG.registry_summary()["campaigns"] if c["name"] == name), None)
    if st and st.get("stage") == "completata":
        # i risultati di una campagna completata sono congelati (la verifica finale li ha sigillati)
        raise HTTPException(409, f"{name} è completata: i suoi risultati sono congelati e non si rigenerano da qui")
    _, script = CAMPAIGNS[req.campaign]
    args = [sys.executable, str(PROJECT_DIR / script), "--mode", req.mode]
    if req.mode == "CUSTOM":
        args += ["--workers", str(max(1, int(req.workers or 1)))]
    log = open(get_settings().logs_dir / f"campaign_{req.campaign}.log", "a", encoding="utf-8")  # noqa: SIM115
    _PROCS[req.campaign] = subprocess.Popen(args, cwd=PROJECT_DIR, stdout=log, stderr=subprocess.STDOUT)
    return {"started": req.campaign, "mode": req.mode, "workers": REG.workers_for(req.mode, req.workers)}


# ------------------------------------------------------------------ trade live
@router.get("/livetrades")
def livetrades():
    with session() as con:
        rows = [dict(r) for r in con.execute("SELECT * FROM live_trades ORDER BY id DESC")]
        ok, bad = verify_chain(con, "live_trades")
    return {"trades": rows, "chain_ok": ok, "chain_broken_at": bad}


@router.get("/phase2/null")
def null_distribution():
    """Distribuzione del miglior t per caso (1.000 permutazioni) per gruppo, se il database locale la contiene."""
    df = REG.perm_load("p2_rules_v1")
    if df.empty:
        return {"available": False}
    out = {}
    for g, x in df.groupby("grp"):
        out[g] = {"max_all": sorted(x[x.key == "max_all"].value.round(3).tolist()),
                  "max_pa": sorted(x[x.key == "max_pa"].value.round(3).tolist())}
    return {"available": True, "groups": out}
