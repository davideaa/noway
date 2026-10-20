"""Employment Situation (NFP) — valori come pubblicati, dai comunicati BLS archiviati.

Dalle "Summary table" (presenti dal febbraio 2010) si leggono, per ogni
comunicato: variazione dei payroll degli ultimi mesi (i due precedenti già
rivisti), tasso di disoccupazione, partecipazione, ore settimanali medie,
salario orario medio. Le revisioni si ottengono confrontando questi valori
con le prime stampe dei comunicati precedenti.
"""

from __future__ import annotations

import html as htmlmod
import logging
import re
from datetime import date

import numpy as np
import pandas as pd

from ..providers.bls import BLSProvider

log = logging.getLogger("xnb.phase2.nfp_bls")
_N = r"-?\$?\d[\d,]*\.?\d*"


def _nums(s: str) -> list[float]:
    return [float(x.replace(",", "").replace("$", "")) for x in re.findall(_N, s)]


def _row(block: str, label: str, n: int = 4) -> list[float] | None:
    m = re.search(re.escape(label) + r"\s*(?:\(\s*\d\s*\)\s*)?((?:" + _N + r"\s+){%d}" % (n - 1) + _N + ")", block)
    return _nums(m.group(1))[:n] if m else None


def parse_release(txt: str) -> dict:
    out = {}
    b = re.search(r"Summary table B\.? Establishment data", txt)
    if b:
        blk = txt[b.start(): b.start() + 6000]
        tn = _row(blk, "Total nonfarm")
        if tn:
            out.update(nfp_yearago=tn[0], nfp_m2=tn[1], nfp_m1=tn[2], nfp_m0=tn[3])
        ahe = _row(blk, "Average hourly earnings")
        if ahe:
            out.update(ahe_yearago=ahe[0], ahe_m2=ahe[1], ahe_m1=ahe[2], ahe_m0=ahe[3])
        hrs = _row(blk, "Average weekly hours")
        if hrs:
            out.update(hours_m1=hrs[2], hours_m0=hrs[3])
    a = re.search(r"Summary table A\.? Household data", txt)
    if a:
        blk = txt[a.start(): a.start() + 3000]
        ur = _row(blk, "Unemployment rate", 5)
        if ur:
            out.update(ur_yearago=ur[0], ur_m2=ur[1], ur_m1=ur[2], ur_m0=ur[3])
        pr = _row(blk, "Participation rate", 5)
        if pr:
            out.update(part_m1=pr[2], part_m0=pr[3])
    return out


def load_nfp_releases() -> pd.DataFrame:
    b = BLSProvider()
    rows = []
    for e in b.archive_entries("NFP"):
        if not e["htm"] or e["date"].year < 2010 or e["date"] >= date.today():
            continue
        try:
            raw = b._fetch(e["htm"], e["htm"].rsplit("/", 1)[-1])
        except Exception as exc:  # noqa: BLE001
            log.warning("NFP %s non letto: %s", e["date"], exc)
            continue
        txt = re.sub(r"\s+", " ", htmlmod.unescape(re.sub(r"<[^>]+>", " ", raw)).replace("\xa0", " "))
        v = parse_release(txt)
        if v:
            v["release_date"] = e["date"]
            rows.append(v)
    df = pd.DataFrame(rows).sort_values("release_date").reset_index(drop=True)
    # revisioni: il mese M-1 di questa release contro il mese M0 della precedente (prima stampa)
    df["rev_m1"] = df["nfp_m1"] - df["nfp_m0"].shift(1)
    df["rev_m2"] = df["nfp_m2"] - df["nfp_m1"].shift(1)
    df["rev_net2"] = df["rev_m1"] + (df["nfp_m2"] - df["nfp_m0"].shift(2))
    df["ahe_mom_pct"] = (df["ahe_m0"] / df["ahe_m1"] - 1) * 100
    df["ahe_yoy_pct"] = (df["ahe_m0"] / df["ahe_yearago"] - 1) * 100
    return df


def nfp_level_features(rel: pd.DataFrame, t0_date: date) -> dict:
    """Ultimo comunicato NFP uscito PRIMA del giorno ``t0_date`` (quindi noto prima di T0)."""
    prev = rel[rel.release_date < t0_date]
    if prev.empty:
        return {}
    r = prev.iloc[-1]
    f = {"nfp_last_k": r.get("nfp_m0", np.nan), "nfp_avg3_k": float(np.nanmean([r.get("nfp_m0"), r.get("nfp_m1"), r.get("nfp_m2")])),
         "nfp_rev_net2_k": r.get("rev_net2", np.nan), "ur_last": r.get("ur_m0", np.nan),
         "ur_chg_12m": r.get("ur_m0", np.nan) - r.get("ur_yearago", np.nan),
         "ahe_mom_last": r.get("ahe_mom_pct", np.nan), "ahe_yoy_last": r.get("ahe_yoy_pct", np.nan),
         "hours_chg": r.get("hours_m0", np.nan) - r.get("hours_m1", np.nan),
         "part_last": r.get("part_m0", np.nan)}
    if len(prev) >= 4:
        f["ur_chg_3m"] = r.get("ur_m0", np.nan) - prev.iloc[-4].get("ur_m0", np.nan)
        f["nfp_rev_sum3_k"] = float(np.nansum(prev["rev_net2"].tail(3)))
    return {k: (float(v) if v is not None else np.nan) for k, v in f.items()}
