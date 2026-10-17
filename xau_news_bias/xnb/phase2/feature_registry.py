"""FEATURE REGISTRY generato dal dataset congelato: famiglia, fonte, disponibilità, copertura."""

from __future__ import annotations

import pandas as pd

from ..config import PROJECT_DIR, get_settings
from .models2 import EXCLUDE, FAMILIES
from .trades import REGIME_START, SPLIT

# (prefisso, fonte, regola di disponibilità, descrizione) — il primo che combacia vince
SOURCES = [
    ("f_pa_", "Dukascopy XAUUSD M1 → M5, M15, H1, H4, D1", "chiusura della candela prima del cutoff",
     "price action: direzione, corpo, stoppini, posizione di chiusura, inside/outside/engulfing, massimi e minimi "
     "crescenti, sequenze, RSI, ROC, Bollinger, Donchian, EMA20, compressione, livelli tondi, falsi breakout"),
    ("f_xau_", "Dukascopy XAUUSD", "chiusura della candela", "rendimenti, volatilità, trend dell'oro (fase 1)"),
    ("f_xm_", "Dukascopy EURUSD, USDJPY, USA500, USATECH M1", "chiusura della candela",
     "rendimenti 15/60/240/1440 min e range dell'ultima ora dei mercati incrociati"),
    ("f_rel_", "Dukascopy + Treasury", "chiusura della candela / D 18:00 ET",
     "correlazioni e beta oro-dollaro, oro-azionario, oro-tassi; divergenze"),
    ("f_dxy_", "Dukascopy (6 valute, formula ICE)", "chiusura della candela", "DXY ricostruito"),
    ("f_usd_", "Dukascopy", "chiusura della candela", "dollaro nell'ultima ora"),
    ("f_rt_vix", "Cboe", "D 17:00 ET", "VIX in z-score a un anno"),
    ("f_rt_", "U.S. Treasury", "D 18:00 ET", "breakeven 5Y/10Y, 5s30s, z-score e percentili dei tassi"),
    ("f_y", "U.S. Treasury", "D 18:00 ET", "rendimenti 3M/2Y/10Y e variazioni"),
    ("f_r10y", "U.S. Treasury (TIPS)", "D 18:00 ET", "rendimento reale 10Y"),
    ("f_slope", "U.S. Treasury", "D 18:00 ET", "pendenza della curva"),
    ("f_vix", "Cboe", "D 17:00 ET", "livello e variazioni del VIX"),
    ("f_cot_", "CFTC", "martedì + 3 giorni 15:30 ET", "posizionamento managed money"),
    ("f_news_", "EPU / GPR", "EPU D+2, GPR D+8", "incertezza politica e rischio geopolitico dal testo dei giornali"),
    ("f_surp_", "storico ForexFactory (prime stampe verificate con BLS)", "release + 60 s",
     "memoria delle sorprese di 18 serie: ultima, media di 3, serie dello stesso segno, giorni; indice hawkish"),
    ("f_cons_", "storico ForexFactory (forecast)", "prima di T0 (non garantito a T−3D)",
     "consensus della release corrente e distanza dal precedente e dalla media recente"),
    ("f_gap_", "Cleveland Fed + ForexFactory", "prima di T0", "nowcast meno consensus"),
    ("f_nowcast_", "Cleveland Fed", "giorno d 23:59 ET", "nowcast dell'inflazione"),
    ("f_react_", "Dukascopy tick delle release precedenti", "T0 precedente + 60 s",
     "memoria delle reazioni dell'oro alle release precedenti (stessa famiglia e altra famiglia)"),
    ("f_cal_", "calendario BLS/Fed/ForexFactory", "noto in anticipo",
     "giorni dall'ultimo e al prossimo FOMC, altre news ad alto impatto vicine, mese, settimana"),
    ("f_nfp_", "comunicati BLS Employment Situation", "release + 60 s", "livelli e revisioni NFP della release precedente"),
    ("f_ur_", "comunicati BLS", "release + 60 s", "disoccupazione"),
    ("f_ahe_", "comunicati BLS", "release + 60 s", "salari orari"),
    ("f_hours_", "comunicati BLS", "release + 60 s", "ore settimanali"),
    ("f_part_", "comunicati BLS", "release + 60 s", "partecipazione"),
    ("f_cpi_", "Tabella A BLS", "release + 60 s", "CPI della release precedente"),
    ("f_core_", "Tabella A BLS", "release + 60 s", "core CPI della release precedente"),
    ("f_rates_", "—", "—", "età del dato (solo controllo qualità, esclusa dai modelli)"),
]


def family_of(col: str) -> str:
    for fam, pref in FAMILIES.items():
        if fam in ("FED",):
            continue
        if col.startswith(pref):
            return fam
    return "esclusa"


def prefix_of(col: str) -> str | None:
    return next((pre for pre, *_ in SOURCES if col.startswith(pre)), None)


def source_of(col: str) -> tuple[str, str, str]:
    pre = prefix_of(col)
    return next((tuple(x[1:]) for x in SOURCES if x[0] == pre), ("—", "—", "—"))


def build() -> pd.DataFrame:
    ft = pd.read_parquet(get_settings().research_dir / "phase2" / "p2_features.parquet")
    disc = ft[(ft.t0_utc >= REGIME_START) & (ft.t0_utc < SPLIT)]
    cols = [c for c in ft.columns if c.startswith("f_")]
    rows = []
    for c in cols:
        src, avail, desc = source_of(c)
        cov = {f: float(disc[(disc.family == f) & (disc.cutoff == "T-1M")][c].notna().mean()) for f in ("CPI", "NFP")}
        rows.append({"feature": c, "family": family_of(c), "fed_subset": c.startswith(FAMILIES["FED"]),
                     "price_action": c.startswith("f_pa_"), "source": src, "available_from": avail,
                     "description": desc, "coverage_cpi_discovery": round(cov["CPI"], 3),
                     "coverage_nfp_discovery": round(cov["NFP"], 3), "in_models": c not in EXCLUDE and family_of(c) != "esclusa",
                     "rule_primitive_eligible": c not in EXCLUDE})
    return pd.DataFrame(rows)


def write() -> pd.DataFrame:
    reg = build()
    out = get_settings().research_dir / "phase2"
    reg.to_csv(out / "feature_registry.csv", index=False)
    g = reg.groupby("family").agg(n=("feature", "size"), cov_cpi=("coverage_cpi_discovery", "median"),
                                  cov_nfp=("coverage_nfp_discovery", "median")).reset_index()
    lines = ["# Feature registry (fase 2)", "",
             "Generato da `xnb/phase2/feature_registry.py` sul dataset congelato "
             "(`research_output/phase2/p2_features.parquet`). L'elenco completo, una riga per feature, è in "
             "`research_output/phase2/feature_registry.csv`.", "",
             f"**{len(reg)} feature** a 8 cutoff (T−3D, T−24H, T−4H, T−1H, T−30M, T−15M, T−5M, T−1M), "
             f"di cui {int(reg.price_action.sum())} di price action. Copertura = quota di eventi di scoperta "
             "(2013-07 → 2019) con il valore presente a T−1M.", "",
             "## Per famiglia (insiemi dei modelli, protocollo §6)", "",
             "| Famiglia | Feature | Copertura mediana CPI | Copertura mediana NFP |", "|---|---|---|---|"]
    for r in g.itertuples():
        lines.append(f"| {r.family} | {r.n} | {r.cov_cpi:.0%} | {r.cov_nfp:.0%} |")
    lines += ["", f"FED è un sottoinsieme trasversale ({int(reg.fed_subset.sum())} feature: giorni da/al FOMC, "
              "3M, 2Y − 3M, sorpresa Fed funds).", "",
              "## Per fonte, con la regola di disponibilità", "",
              "| Prefisso | Fonte | Disponibile da | Contenuto | Feature |", "|---|---|---|---|---|"]
    for pre, src, avail, desc in SOURCES:
        n = sum(1 for c in reg.feature if prefix_of(c) == pre)
        if n:
            lines.append(f"| `{pre}` | {src} | {avail} | {desc} | {n} |")
    lines += ["", "## Esclusioni", "",
              "- `f_xau_px_age_min`, `f_rates_age_days`, `f_cot_age_days`: età del dato, solo controllo qualità.",
              "- Una feature diventa primitiva di regola solo con copertura ≥ 70% nella scoperta del gruppo.",
              "- Le revisioni NFP del 'previous' ForexFactory sono state tolte: FF riporta la prima stampa, "
              "non la revisione (verificato: 99,5% dei casi). Le revisioni vengono dai comunicati BLS.", ""]
    (PROJECT_DIR / "docs" / "FEATURE-REGISTRY.md").write_text("\n".join(lines), encoding="utf-8")
    return reg
