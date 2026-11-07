"""Scheda di trade della fase 2 per il motore live (protocollo §4, verdetto di `p2_validation.json`).

Prima della release, per CPI e NFP:
    U_news     mediana di (range della prima M1 / ATR M1 dell'ora prima) delle ultime 6 release
               della famiglia × ATR M1 dell'ultima ora adesso
    SL         0,60 × U_news
    EV_LONG/SHORT  R medio storico senza condizioni (ultimi 5 anni, costi base): NON è un segnale,
               è quanto costa tradare alla cieca
    P(up)      frequenza storica di M1 rialziste (ultimi 5 anni): nessun modello validato
    MFE/MAE    mediane storiche nella direzione giusta, in unità U_news
    AZIONE     NO TRADE finché nessun candidato della famiglia è ROBUST OOS EDGE

Dopo la release: lo stesso trade simulato sui tick reali (R LONG e R SHORT), l'errore
sull'ampiezza, e il ratio della release per aggiornare U_news delle successive.
"""

from __future__ import annotations

import json
import logging
from functools import lru_cache

import numpy as np
import pandas as pd

from ..config import get_settings
from .ticktrade import SCENARIOS, anatomy, extract_path, simulate
from .trades import K_STOP

log = logging.getLogger("xnb.phase2.live")
FAMILIES = ("CPI", "NFP")
CARD_VERSION = "p2-card-1"


def _dir():
    return get_settings().research_dir / "phase2"


@lru_cache(maxsize=1)
def _frozen() -> dict:
    d = _dir()
    out: dict = {"trades": None, "stops": None, "validation": None}
    p = d / "p2_trades_base.csv"
    if p.exists():
        t = pd.read_csv(p)
        t["t0_utc"] = pd.to_datetime(t.t0_utc, utc=True)
        out["trades"] = t
    for k, f in (("stops", "p2_stops.json"), ("validation", "p2_validation.json")):
        if (d / f).exists():
            out[k] = json.loads((d / f).read_text(encoding="utf-8"))
    return out


def verdict_for(family: str) -> dict:
    """Classe migliore fra i candidati che riguardano la famiglia, e azione conseguente."""
    v = _frozen()["validation"]
    if not v:
        return {"verdict": "NO RESEARCH", "evidence": "nessuna ricerca di fase 2 trovata", "robust": []}
    items = [it for it in v["items"] if it["group"] in (family, "SHARED")]
    robust = [it["id"] for it in items if it["class"].startswith("ROBUST")]
    classes = sorted({it["class"] for it in items})
    return {"verdict": "EDGE" if robust else "NO RELIABLE EDGE", "robust": robust, "classes": classes,
            "evidence": ("ROBUST OOS EDGE: " + ", ".join(robust)) if robust else
            "NO EVIDENCE fuori campione (fase 2: 4,66 milioni di ipotesi, conferma finale NFP fallita)"}


def atr_m1_60(m1: pd.DataFrame | None, t: pd.Timestamp) -> float | None:
    """Media (massimo − minimo) delle ultime 60 M1 CHIUSE prima di ``t`` (come `unit_atr_m1_60`)."""
    if m1 is None or not len(m1):
        return None
    mm = m1[(m1.index + pd.Timedelta(minutes=1) <= t) & (m1.index >= t - pd.Timedelta(days=2))]
    if len(mm) < 60:
        return None
    return float((mm.h - mm.l).iloc[-60:].mean())


def history(family: str, t: pd.Timestamp, live_rows: list[dict] | None = None) -> pd.DataFrame:
    """Release passate della famiglia: tabella congelata + release risolte dal vivo dopo il congelamento."""
    tr = _frozen()["trades"]
    h = tr[(tr.family == family) & (tr.t0_utc < t)].copy() if tr is not None else pd.DataFrame()
    if live_rows:
        last = h.t0_utc.max() if len(h) else pd.Timestamp("1900-01-01", tz="UTC")
        extra = [r for r in live_rows if r.get("family") == family and r.get("range_over_atr")
                 and pd.Timestamp(r["t0_utc"]) > last and pd.Timestamp(r["t0_utc"]) < t]
        if extra:
            e = pd.DataFrame(extra)
            e["t0_utc"] = pd.to_datetime(e.t0_utc, utc=True)
            h = pd.concat([h, e], ignore_index=True)
    return h.sort_values("t0_utc") if len(h) else h


def card(family: str, t: pd.Timestamp, m1: pd.DataFrame | None, spread: float | None = None,
         live_rows: list[dict] | None = None) -> dict:
    t = pd.Timestamp(t)
    fz = _frozen()
    if family not in FAMILIES or fz["trades"] is None:
        return {"version": CARD_VERSION, "available": False, "reason": "famiglia non studiata o dati di fase 2 assenti"}
    h = history(family, t, live_rows)
    rec = h[h.t0_utc >= t - pd.DateOffset(years=5)] if len(h) else h
    last6 = h.range_over_atr.dropna().iloc[-6:] if len(h) else pd.Series(dtype=float)
    atr = atr_m1_60(m1, t)
    last_bar = None
    if m1 is not None and len(m1):
        closed = m1[m1.index + pd.Timedelta(minutes=1) <= t]
        last_bar = closed.index[-1] if len(closed) else None
    med6 = float(np.median(last6)) if len(last6) == 6 else None
    U = med6 * atr if (med6 is not None and atr) else None
    exc = {}
    st = fz["stops"] or {}
    for r in st.get("excursions_over_time", []):
        if r["family"] == family and r["seconds"] == 45:
            exc = r
    v = verdict_for(family)
    up = rec.a_move.dropna() if len(rec) else pd.Series(dtype=float)
    p_up = float((up > 0).mean()) if len(up) else None
    out = {
        "version": CARD_VERSION, "available": U is not None, "family": family,
        "U_news_usd": U, "range_med6_over_atr": med6, "atr_m1_60_usd": atr,
        "atr_last_bar_utc": str(last_bar) if last_bar is not None else None,
        "atr_age_min": float((t - last_bar).total_seconds() / 60) if last_bar is not None else None,
        "sl_k": K_STOP, "sl_usd": (K_STOP * U) if U else None,
        "sl_model": f"{K_STOP:.2f} × U_news (mediana delle ultime 6 release {family} in ATR M1 × ATR M1 dell'ultima ora)",
        "expected_range_usd": U,
        "expected_mfe_usd": (exc.get("mfe_U_median") * U) if (U and exc) else None,
        "expected_mae_usd": (exc.get("mae_U_p75") * U) if (U and exc) else None,
        "p_up_hist": p_up, "p_down_hist": (1 - p_up) if p_up is not None else None,
        "p_source": "frequenza storica di M1 rialziste, ultimi 5 anni: nessun modello di direzione validato",
        "ev_long_R": float(rec.R_long.mean()) if len(rec) else None,
        "ev_short_R": float(rec.R_short.mean()) if len(rec) else None,
        "ev_long_R_conservative": float(rec.R_long_cons.mean()) if len(rec) and "R_long_cons" in rec else None,
        "ev_short_R_conservative": float(rec.R_short_cons.mean()) if len(rec) and "R_short_cons" in rec else None,
        "ev_source": f"R medio storico senza condizioni, ultimi 5 anni ({len(rec)} release), costi base",
        "action": "NO TRADE" if v["verdict"] != "EDGE" else "SEE ROBUST CANDIDATE",
        "verdict": v["verdict"], "evidence_level": v["evidence"],
        "history_last_release": str(h.t0_utc.max()) if len(h) else None,
        "n_history": int(len(h)),
    }
    # regime: volatilità dell'ultima ora e "spazio" (U_news / spread) rispetto alla storia della famiglia
    if atr and len(rec) and rec.unit_atr_m1_60.notna().any():
        out["atr_percentile_5y"] = float((rec.unit_atr_m1_60 < atr).mean())
    if U and spread and spread > 0:
        room = U / spread
        hist_room = (rec.U / rec.a_spread_m10).replace([np.inf, -np.inf], np.nan).dropna() if len(rec) else pd.Series()
        out["room_U_over_spread"] = room
        out["room_percentile_5y"] = float((hist_room < room).mean()) if len(hist_room) else None
    return out


def trade_result(c: dict, ticks: pd.DataFrame, t0) -> dict:
    """Dopo la release: il trade della scheda sui tick reali, e l'errore sull'ampiezza."""
    p = extract_path(ticks, t0)
    if p is None:
        return {"quality": "NO_TICKS"}
    an = anatomy(p)
    out: dict = {"quality": "OK" if an.get("ok") else "INCOMPLETE", "actual_range_usd": an.get("range"),
                 "actual_move_usd": an.get("move")}
    sl = c.get("sl_usd")
    if sl:
        lo = simulate(p, +1, sl, "m10", SCENARIOS["base"])
        sh = simulate(p, -1, sl, "m10", SCENARIOS["base"])
        out.update(r_long=lo.get("r"), r_short=sh.get("r"), stopped_long=lo.get("stopped"),
                   stopped_short=sh.get("stopped"), mfe_long_usd=lo.get("mfe_usd"), mae_long_usd=lo.get("mae_usd"))
        act = c.get("action")
        out["r_action"] = lo.get("r") if act == "LONG" else sh.get("r") if act == "SHORT" else None
    U, atr = c.get("U_news_usd"), c.get("atr_m1_60_usd")
    if U and an.get("range"):
        out["range_log_error"] = float(np.log(an["range"] / U))
    if atr and an.get("range"):
        out["range_over_atr"] = float(an["range"] / atr)
    return out
