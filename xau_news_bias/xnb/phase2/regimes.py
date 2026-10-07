"""Regimi e rotture strutturali nell'anatomia delle news (descrittivo, senza direzione).

Serie per evento: log(range news / range di controllo), log(range / unità news),
spread a P0, ritardo di reazione, persistenza (la direzione dei primi 5 s
coincide con quella a fine minuto?), frazione del range raggiunta in 15 s.
Strumenti: segmentazione binaria sulla media con test di permutazione,
CUSUM, KS fra epoche, PSI delle feature fra scoperta e periodi successivi.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats as sps


def binary_segmentation(x: np.ndarray, min_size: int = 12, n_perm: int = 500, alpha: float = 0.01,
                        seed: int = 3, depth: int = 3) -> list[int]:
    """Punti di rottura della media (indici), ciascuno significativo per permutazione."""
    rng = np.random.default_rng(seed)
    out = []

    def best_split(v):
        n = len(v)
        cs = np.cumsum(v)
        tot = cs[-1]
        best, bi = -1.0, None
        for i in range(min_size, n - min_size):
            m1, m2 = cs[i - 1] / i, (tot - cs[i - 1]) / (n - i)
            s = i * (n - i) / n * (m1 - m2) ** 2
            if s > best:
                best, bi = s, i
        return best, bi

    def rec(lo, hi, d):
        v = x[lo:hi]
        if len(v) < 2 * min_size or d > depth:
            return
        s, i = best_split(v)
        if i is None:
            return
        null = [best_split(rng.permutation(v))[0] for _ in range(n_perm)]
        p = (1 + sum(n >= s for n in null)) / (1 + n_perm)
        if p < alpha:
            out.append(lo + i)
            rec(lo, lo + i, d + 1)
            rec(lo + i, hi, d + 1)

    rec(0, len(x), 0)
    return sorted(out)


def psi(a: np.ndarray, b: np.ndarray, bins: int = 10) -> float:
    a, b = a[np.isfinite(a)], b[np.isfinite(b)]
    if len(a) < 20 or len(b) < 20:
        return np.nan
    qs = np.unique(np.quantile(a, np.linspace(0, 1, bins + 1)))
    if len(qs) < 3:
        return np.nan
    pa = np.histogram(a, qs)[0] / len(a) + 1e-4
    pb = np.histogram(np.clip(b, qs[0], qs[-1]), qs)[0] / len(b) + 1e-4
    return float(np.sum((pb - pa) * np.log(pb / pa)))


def anatomy_series(ev: pd.DataFrame) -> pd.DataFrame:
    s = pd.DataFrame({"event_id": ev.event_id, "family": ev.family, "t0_utc": ev.t0_utc, "year": ev.year})
    s["log_range_vs_ctrl"] = np.log(ev.a_range / ev.ctrl_range_usd)
    s["log_range_vs_unit"] = np.log(ev.a_range / ev.ctrl_unit_m1)
    s["spread_p0_bp"] = ev.a_spread_p0 / ev.a_p0 * 1e4
    s["spread_max_bp"] = ev.a_spread_max_m1 / ev.a_p0 * 1e4
    s["persist_5s"] = (np.sign(ev.a_move_5s) == np.sign(ev.a_move)).astype(float)
    s["frac_range_15s"] = (ev.a_up_exc_15s + ev.a_down_exc_15s) / ev.a_range.replace(0, np.nan)
    return s.replace([np.inf, -np.inf], np.nan)


def run(ev: pd.DataFrame) -> dict:
    s = anatomy_series(ev)
    out: dict = {"series": {}}
    for fam, g in s.groupby("family"):
        g = g.sort_values("t0_utc")
        res = {}
        for col in ("log_range_vs_ctrl", "log_range_vs_unit", "spread_p0_bp", "spread_max_bp", "persist_5s",
                    "frac_range_15s"):
            x = g[col].to_numpy()
            ok = np.isfinite(x)
            xs, dates = x[ok], g.t0_utc.to_numpy()[ok]
            cps = binary_segmentation(xs)
            segs = []
            bounds = [0] + cps + [len(xs)]
            for a, b in zip(bounds[:-1], bounds[1:]):
                segs.append({"from": str(pd.Timestamp(dates[a]).date()), "to": str(pd.Timestamp(dates[b - 1]).date()),
                             "n": int(b - a), "mean": float(np.mean(xs[a:b]))})
            cus = np.cumsum(xs - xs.mean())
            res[col] = {"breaks": [str(pd.Timestamp(dates[i]).date()) for i in cps], "segments": segs,
                        "cusum_max_at": str(pd.Timestamp(dates[int(np.argmax(np.abs(cus)))]).date())}
        eras = pd.cut(g.year, [2007, 2012, 2019, 2022, 2026], labels=["2008-12", "2013-19", "2020-22", "2023-26"])
        ks = {}
        e_list = [e for e in eras.cat.categories if (eras == e).sum() >= 10]
        for a, b in zip(e_list[:-1], e_list[1:]):
            xa = g.loc[eras == a, "log_range_vs_ctrl"].dropna()
            xb = g.loc[eras == b, "log_range_vs_ctrl"].dropna()
            ks[f"{a} vs {b}"] = {"ks": float(sps.ks_2samp(xa, xb).statistic), "p": float(sps.ks_2samp(xa, xb).pvalue),
                                 "energy": float(sps.energy_distance(xa, xb))}
        res["_ks_eras_log_range_vs_ctrl"] = ks
        out["series"][fam] = res
    return out


def feature_shift(ft: pd.DataFrame, families: list[str], split: str = "2020-01-01", cutoff: str = "T-1M") -> list[dict]:
    """PSI di ogni feature fra scoperta (<2020) e dopo, solo per le famiglie indicate."""
    x = ft[(ft.cutoff == cutoff) & ft.family.isin(families)]
    a = x[x.t0_utc < pd.Timestamp(split, tz="UTC")]
    b = x[x.t0_utc >= pd.Timestamp(split, tz="UTC")]
    rows = []
    for c in [c for c in x.columns if c.startswith("f_")]:
        v = psi(a[c].to_numpy(dtype=float), b[c].to_numpy(dtype=float))
        if v == v:
            rows.append({"feature": c[2:], "psi": v})
    return sorted(rows, key=lambda r: -r["psi"])
