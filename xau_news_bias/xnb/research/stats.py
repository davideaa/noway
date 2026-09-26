"""Statistica di validazione: metriche, intervalli, calibrazione, test."""

from __future__ import annotations

import math

import numpy as np
from scipy import stats as sps
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score

EPS = 1e-6


def logit(p):
    p = np.clip(p, EPS, 1 - EPS)
    return np.log(p / (1 - p))


def brier(y, p):
    return float(np.mean((p - y) ** 2))


def log_loss(y, p):
    p = np.clip(p, EPS, 1 - EPS)
    return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))


def metrics(y, p) -> dict:
    y = np.asarray(y, dtype=float)
    p = np.asarray(p, dtype=float)
    pred = (p >= 0.5).astype(float)
    # p esattamente 0,5 = nessuna opinione: conta come errore per metà
    ties = p == 0.5
    hit = np.where(ties, 0.5, (pred == y).astype(float))
    out = {
        "n": int(len(y)),
        "accuracy": float(hit.mean()) if len(y) else float("nan"),
        "brier": brier(y, p) if len(y) else float("nan"),
        "log_loss": log_loss(y, p) if len(y) else float("nan"),
        "base_rate_up": float(y.mean()) if len(y) else float("nan"),
    }
    tp = np.mean(hit[y == 1]) if (y == 1).any() else np.nan
    tn = np.mean(hit[y == 0]) if (y == 0).any() else np.nan
    out["balanced_accuracy"] = float(np.nanmean([tp, tn]))
    try:
        out["auc"] = float(roc_auc_score(y, p)) if len(np.unique(y)) == 2 and len(np.unique(p)) > 1 else float("nan")
    except ValueError:
        out["auc"] = float("nan")
    return out


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (float("nan"), float("nan"))
    ph = k / n
    den = 1 + z * z / n
    c = (ph + z * z / (2 * n)) / den
    h = z * math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / den
    return (c - h, c + h)


def binom_p_greater(k: int, n: int, p0: float = 0.5) -> float:
    if n == 0:
        return float("nan")
    return float(sps.binomtest(k, n, p0, alternative="greater").pvalue)


def bootstrap_ci(y, p, fn, n_boot: int = 10000, seed: int = 11) -> tuple[float, float]:
    rng = np.random.default_rng(seed)
    y, p = np.asarray(y), np.asarray(p)
    n = len(y)
    if n < 5:
        return (float("nan"), float("nan"))
    idx = rng.integers(0, n, size=(n_boot, n))
    vals = np.array([fn(y[i], p[i]) for i in idx])
    return (float(np.nanpercentile(vals, 2.5)), float(np.nanpercentile(vals, 97.5)))


def acc_fn(y, p):
    return float(np.mean(np.where(p == 0.5, 0.5, ((p >= 0.5) == (y == 1)).astype(float))))


def buckets(y, p, edges=(0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 1.01)) -> list[dict]:
    """Fasce di confidenza = max(p, 1-p). Per ognuna: n, successi, IC Wilson."""
    y, p = np.asarray(y, dtype=float), np.asarray(p, dtype=float)
    conf = np.maximum(p, 1 - p)
    pred_up = p > 0.5
    out = []
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (conf >= lo) & (conf < hi) & (p != 0.5)
        n = int(m.sum())
        k = int(np.sum((pred_up[m]) == (y[m] == 1)))
        lo_ci, hi_ci = wilson(k, n)
        out.append({"from": lo, "to": min(hi, 1.0), "n": n, "hits": k,
                    "hit_rate": k / n if n else None, "mean_conf": float(conf[m].mean()) if n else None,
                    "wilson_lo": lo_ci if n else None, "wilson_hi": hi_ci if n else None})
    # soglie cumulative richieste: >=60, 65, 70, 75
    for thr in (0.6, 0.65, 0.7, 0.75):
        m = (conf >= thr) & (p != 0.5)
        n = int(m.sum())
        k = int(np.sum((pred_up[m]) == (y[m] == 1)))
        lo_ci, hi_ci = wilson(k, n)
        out.append({"from": thr, "to": None, "cumulative": True, "n": n, "hits": k,
                    "hit_rate": k / n if n else None, "wilson_lo": lo_ci if n else None,
                    "wilson_hi": hi_ci if n else None, "binom_p": binom_p_greater(k, n) if n else None})
    return out


def reliability(y, p, bins=(0, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 1.0)) -> list[dict]:
    y, p = np.asarray(y, dtype=float), np.asarray(p, dtype=float)
    out = []
    for lo, hi in zip(bins[:-1], bins[1:]):
        m = (p >= lo) & (p < hi) if hi < 1 else (p >= lo) & (p <= hi)
        n = int(m.sum())
        out.append({"from": lo, "to": hi, "n": n, "mean_pred": float(p[m].mean()) if n else None,
                    "obs_up": float(y[m].mean()) if n else None})
    return out


class Platt:
    """Calibrazione a due parametri su logit(p)."""

    def __init__(self):
        self.lr = None

    def fit(self, p_raw, y):
        if len(y) < 30 or len(np.unique(y)) < 2:
            return self
        self.lr = LogisticRegression(C=1.0).fit(logit(np.asarray(p_raw)).reshape(-1, 1), y)
        return self

    def transform(self, p_raw):
        if self.lr is None:
            return np.asarray(p_raw)
        return self.lr.predict_proba(logit(np.asarray(p_raw)).reshape(-1, 1))[:, 1]


def holm(pvals: dict[str, float]) -> dict[str, float]:
    items = sorted((v, k) for k, v in pvals.items() if v == v)
    m = len(items)
    out, running = {}, 0.0
    for i, (v, k) in enumerate(items):
        adj = min(1.0, (m - i) * v)
        running = max(running, adj)
        out[k] = running
    return out


def bh(pvals: dict[str, float]) -> dict[str, float]:
    items = sorted((v, k) for k, v in pvals.items() if v == v)
    m = len(items)
    out = {}
    prev = 1.0
    for i in range(m - 1, -1, -1):
        v, k = items[i]
        prev = min(prev, v * m / (i + 1))
        out[k] = prev
    return out
