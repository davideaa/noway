"""H-X4 (docs/IPOTESI-HX4-DAVIDE.md): la ricerca della fase 2 rifatta con il trade di Davide.

Trade: ingresso T−60 s, stop 60 pips prima del 2024 e 100 pips dopo (variante: ATR giornaliero con
tetto 120 pips), uscita a fine prima M1, perdita tagliata a −1R. Stesso motore di regole e modelli,
campagna e file separati: i risultati della fase 2 restano intatti.
"""

from __future__ import annotations

import json
import logging
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor

import numpy as np
import pandas as pd
from scipy import stats as sps

from ..config import get_settings
from . import registry as REG
from . import run_models as RM
from .anatomy_study import load
from .discovery import CUTOFFS_SEARCH, GROUPS, MIN_SUPPORT, run_permutations, search
from .models2 import ADAPT, FEATURE_SETS, MODELS, TAUS, baselines, decide, trade_stats
from .run_rules import _stats, prepare, select_candidates
from .setup_dyn import stops_table
from .ticktrade import SCENARIOS, simulate
from .trades import REGIME_START, SPLIT
from .validate import holm, model_decisions, rule_decisions

log = logging.getLogger("xnb.phase2.hx4")
CAMPAIGN = "hx4_rules_v1"
SEED = 20260927
BUDGET = 10_000.0


def out_dir():
    d = get_settings().research_dir / "phase2" / "hx4"
    d.mkdir(parents=True, exist_ok=True)
    return d


# ------------------------------------------------------------------ il trade
def stop_usd(t0: pd.Timestamp, variant: str, atr_stop: float | None) -> float:
    if variant == "main":
        return 6.0 if t0 < pd.Timestamp("2024-01-01", tz="UTC") else 10.0
    return min(atr_stop, 12.0) if atr_stop == atr_stop else np.nan  # ATR giornaliero, tetto 120 pips


def build_trades(scenario: str, variant: str = "main", ev=None, ft=None, paths=None) -> pd.DataFrame:
    if ev is None:
        ev, ft, paths = load()
    st = stops_table(ev, ft)
    rows = []
    for r in ev.itertuples():
        p = paths.get(r.event_id)
        s = stop_usd(r.t0_utc, variant, st.at[r.event_id, "S1_ATR_D1"] if r.event_id in st.index else np.nan)
        row = {"event_id": r.event_id, "family": r.family, "t0_utc": r.t0_utc, "year": r.year, "sl_usd": s}
        if p is None or not (s == s and s > 0):
            rows.append({**row, "ok": False})
            continue
        lo = simulate(p, +1, s, "m60", SCENARIOS[scenario])
        sh = simulate(p, -1, s, "m60", SCENARIOS[scenario])
        ok = bool(lo.get("ok") and sh.get("ok"))
        rows.append({**row, "ok": ok, "U": s,
                     "R_long": max(lo.get("r", np.nan), -1.0) if ok else np.nan,
                     "R_short": max(sh.get("r", np.nan), -1.0) if ok else np.nan})
    return pd.DataFrame(rows)


# ------------------------------------------------------------------ regole
def observed(prep: dict, tr_cons: pd.DataFrame) -> dict:
    cons = tr_cons.set_index("event_id")
    res = {}
    for g, obj in prep.items():
        e = obj["events"]
        rows, n_hyp, best = [], 0, {}
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
        REG.log_experiment_once("hx4_rules", g, "rule_search", n_hyp,
                                {"trade": "T-60s, 60/100 pips, cap -1R", "cutoffs": CUTOFFS_SEARCH}, "p2", SEED, best)
        res[g] = {"top": pd.DataFrame(rows).drop_duplicates(subset=["cutoff", "direction", "mask"])
                  .sort_values("t_search", ascending=False), "n_hyp": n_hyp, "best": best}
    return res


def fwer(obs: dict) -> dict:
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
        out[g] = {"top": top, "n_hyp": o["n_hyp"], "observed_best": o["best"], "n_perm": int(len(null_all)),
                  "null_max_quantiles": {q: float(np.quantile(null_all, q)) for q in (0.5, 0.9, 0.95, 0.99)},
                  "null_pa_quantiles": {q: float(np.quantile(null_pa, q)) for q in (0.5, 0.9, 0.95, 0.99)}}
    return out


# ------------------------------------------------------------------ modelli
def run_models(tr: pd.DataFrame, ft: pd.DataFrame, workers: int) -> dict:
    data = RM.build_data(tr, ft)
    RM._D["data"] = data
    grid = [(g, m, f, a) for g in RM.GROUPS for m in MODELS for f in FEATURE_SETS for a in ADAPT]
    rows, preds = [], {}
    with ProcessPoolExecutor(max_workers=workers, mp_context=mp.get_context("fork")) as ex:
        for args, pred in ex.map(RM._job, grid, chunksize=3):
            preds[args] = pred
            for tau in TAUS:
                st = trade_stats(decide(pred, tau)) if len(pred) else {"n_trades": 0}
                rows.append({"group": args[0], "model": args[1], "features": args[2], "adapt": args[3], "tau": tau, **st})
    table = pd.DataFrame(rows)
    REG.log_experiment_once("hx4_models", "ALL", "model_configs", len(table), {"trade": "T-60s, 60/100 pips"}, "p2", 7)
    res = {"table": table, "groups": {}}
    for g in RM.GROUPS:
        t = table[(table.group == g) & (table.n_trades >= 20)].sort_values("t", ascending=False)
        if t.empty:
            continue
        best = t.iloc[0].to_dict()
        pred = decide(preds[(g, best["model"], best["features"], best["adapt"])], best["tau"])
        dg = data[data.family.isin(RM.GROUPS[g]) & (data.t0_utc < SPLIT)]
        res["groups"][g] = {"chosen": best, "n_configs": int(len(t)), "share_positive": float((t.mean_R > 0).mean()),
                            "baselines": baselines(dg, RM.DISC_YEARS), "predictions": pred}
    return res


# ------------------------------------------------------------------ test sul 2020-26 (esposto)
def evaluate_tests(rules: dict, cands: dict, models: dict, tr: pd.DataFrame, ft: pd.DataFrame, prep: dict,
                   tr_var: pd.DataFrame) -> list[dict]:
    spaces = {g: {c: v[0] for c, v in o["per_cut"].items()} for g, o in prep.items()}
    ok = tr[tr.ok == True]  # noqa: E712
    test = ok[ok.t0_utc >= SPLIT]
    data = RM.build_data(tr, ft)
    var = tr_var.set_index("event_id")
    items = []
    for g, c in cands.items():
        for i, cand in enumerate(c.to_dict("records") if len(c) else []):
            items.append(("rule", g, f"RULE-{g}-{i + 1}", cand))
    for g, m in models["groups"].items():
        items.append(("model", g, f"MODEL-{g}", m["chosen"]))
    out = []
    for kind, g, iid, spec in items:
        target = test[test.family.isin(GROUPS[g])]
        if kind == "rule":
            dec = rule_decisions({**spec, "group": g}, spaces, ft, target)
        else:
            dec = model_decisions(spec, g, data, data[data.event_id.isin(target.event_id)])
        t = target.set_index("event_id").loc[dec.event_id]
        r = np.where(dec.action.to_numpy() == "LONG", t.R_long.to_numpy(), t.R_short.to_numpy())
        v = var.loc[dec.event_id]
        rv = np.where(dec.action.to_numpy() == "LONG", v.R_long.to_numpy(), v.R_short.to_numpy())
        n = len(r)
        tt = float(r.mean() / (r.std(ddof=1) / np.sqrt(n))) if n > 2 and r.std() > 0 else 0.0
        mv = target.set_index("event_id").loc[dec.event_id]
        out.append({"id": iid, "kind": kind, "group": g, "n_events": int(len(target)), "n_trades": int(n),
                    "win_rate": float((r > 0).mean()) if n else None, "mean_R": float(r.mean()) if n else None,
                    "total_R": float(r.sum()), "t": tt, "p_one_sided": float(sps.t.sf(tt, n - 1)) if n >= 5 else 1.0,
                    "mean_R_variant_atr120": float(np.nanmean(rv)) if n else None,
                    "spec": {k: spec[k] for k in ("cutoff", "direction", "conditions", "n", "mean_R", "t_search",
                                                  "p_fwer", "sel_score") if k in spec} if kind == "rule" else
                    {k: spec[k] for k in ("model", "features", "adapt", "tau", "n_trades", "mean_R", "t")},
                    "decisions": dec[["event_id", "action"]].to_dict("records")})
    adj = holm([x["p_one_sided"] for x in out])
    for x, a in zip(out, adj):
        x["holm_p"] = a
    return out


# ------------------------------------------------------------------ soldi
def money(seq: pd.DataFrame, calendar: pd.DataFrame, carry: bool) -> dict:
    """``seq``: event_id, t0_utc, R (NaN = nessun trade). Puntata = saldo ÷ news rimaste nell'anno."""
    cal = calendar.sort_values("t0_utc")
    seq = seq.set_index("event_id")
    bal, years, curve = BUDGET, [], []
    for y, g in cal.groupby(cal.t0_utc.dt.year):
        start = bal if carry else BUDGET
        b = start
        ids = g.event_id.tolist()
        for k, e in enumerate(ids):
            rem = len(ids) - k
            if e in seq.index and seq.at[e, "R"] == seq.at[e, "R"]:
                stake = b / rem
                b += stake * float(seq.at[e, "R"])
            curve.append({"event_id": e, "t0_utc": str(g.set_index("event_id").at[e, "t0_utc"]), "balance": b})
        years.append({"year": int(y), "start": start, "end": b, "pnl": b - start})
        bal = b
    return {"years": years, "final": bal, "curve": curve,
            "total_pnl_fresh_each_year": float(sum(x["pnl"] for x in years)) if not carry else None}


def strategies(tr: pd.DataFrame, models: dict, tests: list[dict]) -> dict:
    ok = tr[tr.ok == True].set_index("event_id")  # noqa: E712
    out = {}
    for g in ("SHARED", "NFP", "CPI"):
        if g not in models["groups"]:
            continue
        pred = models["groups"][g]["predictions"]
        disc = {r.event_id: r.action for r in pred.itertuples()}
        tst = next((x for x in tests if x["id"] == f"MODEL-{g}"), None)
        testd = {d["event_id"]: d["action"] for d in tst["decisions"]} if tst else {}
        rows = []
        for e, r in ok[ok.family.isin(GROUPS[g]) & (ok.t0_utc >= pd.Timestamp("2014-01-01", tz="UTC"))].iterrows():
            a = disc.get(e) if r.t0_utc < SPLIT else testd.get(e)
            R = r.R_long if a == "LONG" else r.R_short if a == "SHORT" else np.nan
            rows.append({"event_id": e, "t0_utc": r.t0_utc, "R": R, "action": a or "NO TRADE"})
        out[f"MODEL-{g}"] = pd.DataFrame(rows)
    base = ok[ok.t0_utc >= pd.Timestamp("2014-01-01", tz="UTC")].reset_index()
    out["SEMPRE-LONG"] = base.assign(R=base.R_long)[["event_id", "t0_utc", "R"]]
    out["A-CASO"] = base.assign(R=(base.R_long + base.R_short) / 2)[["event_id", "t0_utc", "R"]]
    return out
