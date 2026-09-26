"""Sezione "WHY?": spiegazione in italiano costruita SOLO dai numeri salvati.

Nessun LLM decide o modifica la probabilità: il testo è generato da regole
fisse a partire dalle feature della fotografia e dalle statistiche fuori
campione. Un LLM potrà in futuro riformulare questo testo, ricevendo gli
stessi numeri, ma non produrli.
"""

from __future__ import annotations

import math


def _f(x, nd=2):
    return "n/d" if x is None or (isinstance(x, float) and not math.isfinite(x)) else f"{x:.{nd}f}"


def regimes(f: dict) -> list[dict]:
    out = []
    cy, ca = f.get("core_yoy_last"), f.get("core_accel")
    if cy is not None:
        lvl = "alta" if cy > 3 else "moderata" if cy > 2.2 else "vicina all'obiettivo"
        trend = ("in accelerazione" if (ca or 0) > 0.05 else "in rallentamento" if (ca or 0) < -0.05 else "stabile")
        out.append({"area": "Macro / inflazione",
                    "text": f"Inflazione core {lvl} ({_f(cy, 1)}% su 12 mesi), {trend} "
                            f"(ultimo m/m meno media 6 mesi: {_f(ca)} punti).",
                    "values": {"core_yoy_last": cy, "core_mom_last": f.get("core_mom_last"), "core_accel": ca}})
    y2, d5, sl = f.get("y2y"), f.get("y2y_chg_5d"), f.get("slope_2s10s")
    if y2 is not None:
        mv = "in salita" if (d5 or 0) > 0.05 else "in discesa" if (d5 or 0) < -0.05 else "fermi"
        out.append({"area": "Fed e tassi",
                    "text": f"Treasury 2 anni al {_f(y2)}%, {mv} negli ultimi 5 giorni ({_f(d5)}); "
                            f"curva 2s10s {_f(sl)}; 2Y meno 3M {_f(f.get('y2_minus_3m'))} "
                            f"(positivo = il mercato prezza tassi più alti, negativo = tagli).",
                    "values": {"y2y": y2, "y2y_chg_5d": d5, "slope_2s10s": sl, "r10y": f.get("r10y")}})
    r20, pos, atr = f.get("xau_ret_20d_atrd"), f.get("xau_pos_20d"), f.get("xau_atr_ratio_5_20")
    if r20 is not None:
        tr = "rialzista" if r20 > 1 else "ribassista" if r20 < -1 else "laterale"
        out.append({"area": "Tecnica XAU",
                    "text": f"Trend a 20 giorni {tr} ({_f(r20, 1)} ATR); prezzo al {_f((pos or 0) * 100, 0)}% del range "
                            f"a 20 giorni; volatilità {'in espansione' if (atr or 1) > 1.1 else 'normale o compressa'} "
                            f"(ATR5/ATR20 {_f(atr)}). Ultima ora: {_f(f.get('xau_ret_60m_atrh'))} ATR H1.",
                    "values": {k: f.get(k) for k in ("xau_ret_20d_atrd", "xau_pos_20d", "xau_atr_ratio_5_20",
                                                    "xau_ret_60m_atrh", "xau_ret_24h_atrd", "xau_dist_pdh_atrd",
                                                    "xau_dist_pdl_atrd")}})
    dx, vix = f.get("dxy_ret_20d_pct"), f.get("vix")
    if dx is not None:
        out.append({"area": "Cross-market",
                    "text": f"Dollaro (DXY sintetico) {_f(dx)}% in 20 giorni, {_f(f.get('dxy_ret_24h_pct'))}% in 24 ore; "
                            f"VIX {_f(vix, 1)}; posizionamento speculativo COT {_f(f.get('cot_mm_net_pct_oi'), 1)}% "
                            f"dell'open interest.",
                    "values": {"dxy_ret_20d_pct": dx, "dxy_ret_24h_pct": f.get("dxy_ret_24h_pct"), "vix": vix,
                               "cot_mm_net_pct_oi": f.get("cot_mm_net_pct_oi")}})
    g = f.get("gap_core")
    if g is not None:
        out.append({"area": "Aspettative",
                    "text": f"Nowcast Cleveland Fed core {_f(f.get('nowcast_core_mom'))}% contro consensus "
                            f"{_f(f.get('cons_core_mom'), 1)}%: scarto {_f(g)} "
                            f"({'nowcast più caldo' if g > 0 else 'nowcast più freddo'}).",
                    "values": {"gap_core": g, "gap_headline": f.get("gap_headline")}})
    return out


def headline(pred: dict, research: dict | None) -> str:
    bias = pred.get("bias")
    if bias == "NO RELIABLE EDGE":
        v = (research or {}).get("holdout", {}).get("metrics", {})
        acc = v.get("accuracy")
        return ("Il protocollo pre-registrato non ha trovato un vantaggio statistico affidabile per questa release: "
                f"fuori campione il modello scelto ha indovinato il {_f((acc or 0) * 100, 0)}% delle volte, "
                "un risultato compatibile con il caso. Per questo la direzione non viene mostrata come previsione.")
    if bias == "NO MODEL":
        return "Per questa famiglia di release la ricerca non è ancora stata fatta: nessun modello, nessuna previsione."
    if bias == "NO DATA":
        return "I dati necessari non sono affidabili in questo momento: previsione sospesa (vedi DATA STATUS)."
    p = pred.get("calibrated_prob_up") or 0.5
    return (f"Il modello indica {bias} con probabilità calibrata {max(p, 1 - p) * 100:.0f}%. "
            f"Segnali di questa fascia, fuori campione, hanno avuto ragione fra il "
            f"{_f((pred.get('prob_ci_low') or 0) * 100, 0)}% e il {_f((pred.get('prob_ci_high') or 0) * 100, 0)}% delle volte.")
