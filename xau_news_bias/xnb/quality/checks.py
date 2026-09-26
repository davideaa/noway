"""Data Quality Engine: decide se una fotografia live è affidabile.

Esiti:
    HEALTHY                 tutto fresco e completo
    DATA QUALITY WARNING    qualcosa manca o è vecchio: confidenza forzata a LOW
    DATA INSUFFICIENT       manca il prezzo XAU o troppe feature: previsione bloccata

Non si usa mai in silenzio un valore vecchio: ogni problema finisce
nell'elenco ``issues`` salvato con la previsione.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from ..research.models import CORE


@dataclass
class QualityReport:
    status: str = "HEALTHY"
    issues: list[dict] = field(default_factory=list)

    def add(self, severity: str, code: str, message: str) -> None:
        self.issues.append({"severity": severity, "code": code, "message": message})
        order = {"HEALTHY": 0, "DATA QUALITY WARNING": 1, "DATA INSUFFICIENT": 2}
        new = "DATA INSUFFICIENT" if severity == "block" else "DATA QUALITY WARNING"
        if order[new] > order[self.status]:
            self.status = new


def assess(features: dict, *, market_open: bool, live_px_age_s: float | None, cross_check_diff_pct: float | None,
           rates_age_days: float | None, consensus_present: bool, nowcast_age_days: float | None,
           sources: list[dict]) -> QualityReport:
    q = QualityReport()
    if market_open:
        if live_px_age_s is None:
            q.add("block", "XAU_MISSING", "Nessun prezzo XAU live disponibile")
        elif live_px_age_s > 600:
            q.add("block", "XAU_STALE", f"Prezzo XAU vecchio di {live_px_age_s / 60:.0f} minuti")
        elif live_px_age_s > 120:
            q.add("warn", "XAU_LAGGING", f"Prezzo XAU in ritardo di {live_px_age_s:.0f} s")
    if cross_check_diff_pct is not None and cross_check_diff_pct > 0.3:
        q.add("warn", "XAU_CROSSCHECK", f"Le due fonti XAU differiscono dello {cross_check_diff_pct:.2f}%")
    if rates_age_days is not None and rates_age_days > 4:
        q.add("warn", "RATES_STALE", f"Curva Treasury vecchia di {rates_age_days:.0f} giorni")
    if not consensus_present:
        q.add("warn", "CONSENSUS_MISSING", "Consensus della release non disponibile (ForexFactory)")
    if nowcast_age_days is not None and nowcast_age_days > 5:
        q.add("warn", "NOWCAST_STALE", f"Nowcast Cleveland Fed vecchio di {nowcast_age_days:.0f} giorni")
    core_missing = [c[2:] for c in CORE if not np.isfinite(features.get(c[2:], np.nan))]
    if len(core_missing) >= 4:
        q.add("block", "FEATURES_MISSING", "Mancano troppe feature principali: " + ", ".join(core_missing))
    elif core_missing:
        q.add("warn", "FEATURES_PARTIAL", "Feature principali mancanti: " + ", ".join(core_missing))
    for s in sources:
        if s.get("critical_for_live") and s.get("state") in ("FAILED", "STALE"):
            q.add("warn", f"SOURCE_{s['id'].upper()}", f"Fonte {s['name']}: {s['state']} — {s['detail']}")
    return q
