"""Memoria point-in-time delle release: sorprese passate e reazioni dell'oro.

Sorprese: dallo storico ForexFactory (actual = prima stampa, verificato
identico ai comunicati BLS su 221 CPI su 221), per molte serie USA. Ogni
actual è noto dall'istante della sua release; il forecast della release
futura è il consensus. La sorpresa è normalizzata con la deviazione standard
delle sorprese PASSATE della stessa serie (finestra espandente).

Reazioni: dagli esiti tick-by-tick di CPI e NFP già avvenuti (noti da T0+60 s).
"""

from __future__ import annotations

from datetime import datetime, time, timedelta

import numpy as np
import pandas as pd

from ..providers.consensus import ForexFactoryHistory
from ..timeutil import UTC

# serie usate come "memoria delle sorprese" (titolo FF -> chiave)
SERIES = {
    "CPI m/m": "cpi", "Core CPI m/m": "core_cpi", "CPI y/y": "cpi_yoy",
    "Non-Farm Employment Change": "nfp", "Unemployment Rate": "ur", "Average Hourly Earnings m/m": "ahe",
    "PPI m/m": "ppi", "Core PPI m/m": "core_ppi", "Core PCE Price Index m/m": "core_pce",
    "Retail Sales m/m": "retail", "Core Retail Sales m/m": "core_retail",
    "ISM Manufacturing PMI": "ism_m", "ISM Services PMI": "ism_s",
    "Unemployment Claims": "claims", "ADP Non-Farm Employment Change": "adp",
    "JOLTS Job Openings": "jolts", "Prelim UoM Inflation Expectations": "uom_infl",
    "Federal Funds Rate": "fed_funds",
}
# segno "hawkish" della sorpresa: +1 se un actual sopra le attese è caldo/forte per la Fed
HAWKISH_SIGN = {"ur": -1, "claims": -1}


def _num(x) -> float:
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return np.nan
    s = str(x).strip().replace("%", "").replace(",", "")
    mult = 1.0
    if s.endswith("K"):
        mult, s = 1e3, s[:-1]
    elif s.endswith("M"):
        mult, s = 1e6, s[:-1]
    elif s.endswith("B"):
        mult, s = 1e9, s[:-1]
    try:
        return float(s) * mult
    except ValueError:
        return np.nan


def load_surprise_table() -> pd.DataFrame:
    """Una riga per (serie, release): release_utc, actual, forecast, previous, surprise, z."""
    ff = ForexFactoryHistory().load()
    u = ff[(ff.currency == "USD") & (ff.event.isin(SERIES))].copy()
    u["d"] = pd.to_datetime(u["date"], format="%a %b %d %Y")

    def ts(row):
        tm = str(row["time"])
        if ":" not in tm:
            return pd.Timestamp(row["d"].date(), tz=UTC) + pd.Timedelta(hours=23, minutes=59)
        hh, mm = (int(x) for x in tm.split(":"))
        return pd.Timestamp(datetime.combine(row["d"].date(), time(hh, mm)), tz=UTC)

    u["release_utc"] = u.apply(ts, axis=1)
    u["key"] = u["event"].map(SERIES)
    for c in ("actual", "forecast", "previous"):
        u[c] = u[c].map(_num)
    u["surprise"] = u["actual"] - u["forecast"]
    u = u.sort_values(["key", "release_utc"]).reset_index(drop=True)
    out = []
    for k, g in u.groupby("key"):
        g = g.copy()
        # scala robusta delle sorprese precedenti (MAD, min 12 osservazioni): la
        # deviazione standard esploderebbe con gli outlier del 2020 (NFP a milioni)
        def mad(x):
            x = x[~np.isnan(x)]
            return 1.4826 * np.median(np.abs(x - np.median(x))) if len(x) else np.nan

        prev_sd = g["surprise"].expanding(min_periods=12).apply(mad, raw=True).shift(1)
        g["z"] = g["surprise"] / prev_sd.replace(0, np.nan)
        g["hawk_z"] = g["z"] * HAWKISH_SIGN.get(k, 1)
        out.append(g)
    return pd.concat(out)[["key", "release_utc", "actual", "forecast", "previous", "surprise", "z", "hawk_z"]]


def surprise_features(tab: pd.DataFrame, t: pd.Timestamp) -> dict:
    """Ultime sorprese note a ``t`` per ogni serie, più indici aggregati."""
    f: dict[str, float] = {}
    known = tab[tab.release_utc <= t - pd.Timedelta(seconds=60)]
    hawk_recent = []
    for k, g in known.groupby("key"):
        g = g.dropna(subset=["z"])
        if g.empty:
            continue
        z = g["hawk_z"].to_numpy()
        f[f"surp_{k}_last"] = float(z[-1])
        f[f"surp_{k}_mean3"] = float(np.mean(z[-3:]))
        s = np.sign(z)
        streak = 0
        for v in s[::-1]:
            if v == s[-1] and v != 0:
                streak += 1
            else:
                break
        f[f"surp_{k}_streak"] = float(streak * s[-1])
        f[f"surp_{k}_days"] = float((t - g.release_utc.iloc[-1]).total_seconds() / 86400)
        recent = g[g.release_utc >= t - pd.Timedelta(days=30)]
        hawk_recent.extend(recent["hawk_z"].tolist())
    if hawk_recent:
        f["surp_hawk_index_30d"] = float(np.mean(hawk_recent))
        f["surp_hawk_count_30d"] = float(len(hawk_recent))
    return f


def consensus_features(tab: pd.DataFrame, family: str, t0: pd.Timestamp) -> dict:
    """Consensus della release corrente (forecast FF), confrontato con le prime stampe precedenti.

    Mai l'actual della release corrente: solo il forecast, noto prima di T0."""
    f: dict[str, float] = {}
    keys = {"CPI": ["cpi", "core_cpi", "cpi_yoy"], "NFP": ["nfp", "ur", "ahe"]}[family]
    for k in keys:
        g = tab[tab.key == k]
        cur = g[(g.release_utc - t0).abs() <= pd.Timedelta(minutes=1)]
        prev = g[g.release_utc < t0 - pd.Timedelta(minutes=1)]
        if cur.empty or prev.empty:
            continue
        fc = cur["forecast"].iloc[0]
        acts = prev["actual"].to_numpy()
        f[f"cons_{k}"] = fc
        f[f"cons_{k}_minus_last"] = fc - acts[-1]
        if len(acts) >= 3:
            f[f"cons_{k}_minus_avg3"] = fc - float(np.mean(acts[-3:]))
        if len(acts) >= 6:
            sd = float(np.std(acts[-24:])) if len(acts) >= 12 else np.nan
            f[f"cons_{k}_z_vs_recent"] = (fc - float(np.mean(acts[-6:]))) / sd if sd and sd == sd and sd > 0 else np.nan
        # (le revisioni NON si leggono da FF: il suo "previous" è la prima stampa
        # nel 99,5% dei casi verificati; vengono dai comunicati BLS, vedi nfp_bls)
    return f


def reaction_features(outcomes: pd.DataFrame, tab: pd.DataFrame, family: str, t: pd.Timestamp) -> dict:
    """Come ha reagito l'oro alle release precedenti (stessa famiglia e l'altra).

    ``outcomes``: event_id, family, t0_utc, move, range, unit (ATR M1 pre-news)."""
    f: dict[str, float] = {}
    done = outcomes[outcomes.t0_utc <= t - pd.Timedelta(seconds=60)]
    skey = {"CPI": "core_cpi", "NFP": "nfp"}
    for fam in ("CPI", "NFP"):
        g = done[done.family == fam].sort_values("t0_utc")
        if g.empty:
            continue
        tag = "same" if fam == family else "other"
        mv = (g["move"] / g["unit"]).to_numpy()
        rg = (g["range"] / g["unit"]).to_numpy()
        f[f"react_{tag}_last_dir"] = float(np.sign(mv[-1]))
        f[f"react_{tag}_mean_dir3"] = float(np.mean(np.sign(mv[-3:])))
        f[f"react_{tag}_mean_dir6"] = float(np.mean(np.sign(mv[-6:])))
        f[f"react_{tag}_abs_move_med6"] = float(np.median(np.abs(mv[-6:])))
        f[f"react_{tag}_range_med6"] = float(np.median(rg[-6:]))
        # sensibilità: pendenza della reazione sulla sorpresa hawkish, ultime 12 release
        s = tab[tab.key == skey[fam]][["release_utc", "hawk_z"]].copy()
        j = pd.merge_asof(g.sort_values("t0_utc"), s.sort_values("release_utc"), left_on="t0_utc",
                          right_on="release_utc", tolerance=pd.Timedelta(minutes=2), direction="nearest")
        j = j.dropna(subset=["hawk_z"]).tail(12)
        if len(j) >= 8 and j["hawk_z"].std() > 0:
            x, y = j["hawk_z"].to_numpy(), (j["move"] / j["unit"]).to_numpy()
            b = np.polyfit(x, y, 1)[0]
            f[f"react_{tag}_beta12"] = float(b)
            f[f"react_{tag}_corr12"] = float(np.corrcoef(x, y)[0, 1])
    return f
