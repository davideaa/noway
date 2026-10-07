"""Analisi descrittive di stop, MAE e MFE (protocollo §9). Non producono verdetti.

Si esegue DOPO l'apertura del test finale NFP (usa tutti gli anni):
- il tetto: R medio di un trade che conosce in anticipo la direzione della
  M1 (oracolo), al variare di k e dei costi. Se anche l'oracolo stenta,
  nessun modello realistico può fare di meglio;
- quanti trade giusti vengono stoppati al variare di k e dell'unità;
- MAE e MFE a 5, 10, 15, 30, 45 s e a fine minuto, in unità U_news;
- quanto dei costi si mangia il movimento, per anno.
"""

from __future__ import annotations

import json

import numpy as np
import pandas as pd

from ..config import get_settings
from .anatomy_study import load, units_table
from .ticktrade import SCENARIOS, path_class, simulate
from .trades import REGIME_START, u_news

K_GRID = [0.3, 0.42, 0.5, 0.6, 0.78, 1.0, 1.5, 2.0, None]


def run() -> dict:
    ev, ft, paths = load()
    ev = ev[ev.a_ok.fillna(False).astype(bool) & (ev.t0_utc >= REGIME_START)].copy()
    u = units_table(ev, ft)
    ev = ev.join(u, on="event_id")
    ev["U"] = ev.event_id.map(u_news(ft))
    ev = ev[ev.U > 0]
    ev["era"] = pd.cut(ev.year, [2012, 2019, 2022, 2026], labels=["2013-19", "2020-22", "2023-26"])
    ev["right_dir"] = np.sign(ev.a_move).astype(int)
    res: dict = {"n_events": int(len(ev)), "note": "regime principale 2013-07 → 2026-09, CPI e NFP"}

    # 1. oracolo: direzione giusta nota in anticipo
    rows = []
    for r in ev.itertuples():
        p = paths.get(r.event_id)
        if p is None or r.right_dir == 0:
            continue
        for sc in ("optimistic", "base", "conservative", "stress"):
            for k in K_GRID:
                s = simulate(p, r.right_dir, None if k is None else k * r.U, "m10", SCENARIOS[sc])
                if not s.get("ok"):
                    continue
                rows.append({"event_id": r.event_id, "family": r.family, "era": str(r.era), "year": r.year,
                             "scenario": sc, "k": "none" if k is None else k, "pnl": s["pnl_usd"],
                             "R_at_060": s["pnl_usd"] / (0.6 * r.U), "stopped": bool(s.get("stopped")),
                             "mae_U": s["mae_usd"] / r.U, "mfe_U": s["mfe_usd"] / r.U})
    o = pd.DataFrame(rows)
    # R sempre nella stessa unità (0,60 U) così i k sono confrontabili
    agg = o.groupby(["family", "scenario", "k"]).agg(n=("pnl", "size"), mean_R=("R_at_060", "mean"),
                                                     win=("pnl", lambda x: float((x > 0).mean())),
                                                     stopped=("stopped", "mean")).reset_index()
    res["oracle"] = agg.to_dict("records")
    ob = o[(o.scenario == "base") & (o.k == 0.6)]
    res["oracle_base_by_era"] = ob.groupby(["family", "era"]).agg(n=("pnl", "size"), mean_R=("R_at_060", "mean"),
                                                                  stopped=("stopped", "mean")).reset_index().to_dict("records")
    # 2. trade giusti stoppati: unità alternative (k in multipli del 75° percentile di ciascuna)
    on = o[(o.scenario == "base") & (o.k == "none")].merge(ev[["event_id", "U_m1", "U_h1", "U_d1", "U_px"]],
                                                          on="event_id")
    units = {"U_news": on.mae_U * 1.0}
    for c in ("U_m1", "U_h1", "U_d1", "U_px"):
        units[c] = on.mae_U * ev.set_index("event_id").loc[on.event_id, "U"].to_numpy() / on[c].to_numpy()
    surv = []
    for name, m in units.items():
        m = m.replace([np.inf, -np.inf], np.nan).dropna()
        q75 = float(m.quantile(0.75))
        yq = m.groupby(on.loc[m.index, "year"]).quantile(0.75)
        for mult in (0.5, 0.7, 1.0, 1.3, 2.0):
            # dispersione fra anni del 75° percentile in scala log: confrontabile fra unità diverse
            surv.append({"unit": name, "mult_of_q75": mult, "correct_not_stopped": float((m < mult * q75).mean()),
                         "between_year_sd_log_q75": float(np.log(yq[yq > 0]).std())})
    res["correct_trade_survival_by_unit"] = surv
    # 3. MAE/MFE nel tempo (direzione giusta), in unità U_news
    tl = []
    for s in (5, 10, 15, 30, 45):
        fav = np.where(ev.right_dir > 0, ev[f"a_up_exc_{s}s"], ev[f"a_down_exc_{s}s"]) / ev.U
        adv = np.where(ev.right_dir > 0, ev[f"a_down_exc_{s}s"], ev[f"a_up_exc_{s}s"]) / ev.U
        for fam in ("CPI", "NFP"):
            m = (ev.family == fam).to_numpy()
            tl.append({"family": fam, "seconds": s, "mfe_U_median": float(np.nanmedian(fav[m])),
                       "mae_U_median": float(np.nanmedian(adv[m])), "mae_U_p75": float(np.nanquantile(adv[m], 0.75))})
    res["excursions_over_time"] = tl
    # 4. costi contro movimento, per anno: quota dello spread sul movimento assoluto
    ev["cost_share"] = ev.a_spread_m10 / ev.a_move.abs().replace(0, np.nan)
    res["spread_over_move_by_year"] = ev.groupby(["family", "year"]).cost_share.median().reset_index().to_dict("records")
    # 5. classi di percorso (stessa definizione pre-protocollo: unità = M1 media dell'ora prima)
    ev["cls"] = [path_class({k[2:]: r[k] for k in r.index if k.startswith("a_")}, r.U_m1) for _, r in ev.iterrows()]
    pc = ev.groupby(["family", "era", "cls"], observed=True).size().unstack(fill_value=0)
    res["path_classes"] = {f"{f}|{e}": {k: int(v) for k, v in row.items()} for (f, e), row in pc.iterrows()}
    # R medio dell'oracolo per classe: dove i soldi si perdono anche sapendo la direzione
    oc = ob.merge(ev[["event_id", "cls"]], on="event_id")
    res["oracle_base_by_path_class"] = oc.groupby(["family", "cls"]).agg(
        n=("pnl", "size"), mean_R=("R_at_060", "mean"), stopped=("stopped", "mean")).reset_index().to_dict("records")
    return res


def save(res: dict):
    p = get_settings().research_dir / "phase2" / "p2_stops.json"
    p.write_text(json.dumps(res, indent=1, default=lambda o: o.tolist() if hasattr(o, "tolist") else str(o)),
                 encoding="utf-8")
    return p
