"""Statistical validation: stationary block bootstrap, Sharpe, Deflated Sharpe Ratio."""
import numpy as np
from scipy import stats

ANN = 365  # crypto trades every day


def sharpe(r, ann=ANN):
    r = np.asarray(r, float)
    sd = r.std(ddof=1)
    return 0.0 if sd == 0 else r.mean() / sd * np.sqrt(ann)


def block_bootstrap_p(r, block=20, n_boot=5000, seed=0):
    """One-sided p-value for mean>0. Resample the demeaned series in circular blocks
    (keeps serial dependence, e.g. runs of losses)."""
    r = np.asarray(r, float)
    n = len(r)
    if n < 2 * block:
        return np.nan
    rng = np.random.default_rng(seed)
    x = r - r.mean()
    nb = int(np.ceil(n / block))
    starts = rng.integers(0, n, size=(n_boot, nb))
    idx = (starts[:, :, None] + np.arange(block)[None, None, :]) % n
    means = x[idx.reshape(n_boot, -1)[:, :n]].mean(axis=1)
    return float((means >= r.mean()).mean())


def deflated_sharpe(r, trial_sharpes, ann=ANN):
    """Bailey & López de Prado (2014). Sharpes in per-period units internally.
    Returns probability that the true Sharpe > expected max Sharpe of N null trials."""
    r = np.asarray(r, float)
    n = len(r)
    sr = r.mean() / r.std(ddof=1)
    ts = np.asarray(trial_sharpes, float) / np.sqrt(ann)
    N = max(len(ts), 1)
    var_sr = ts.var(ddof=1) if N > 1 else 0.0
    g = 0.5772156649
    if N > 1 and var_sr > 0:
        sr0 = np.sqrt(var_sr) * ((1 - g) * stats.norm.ppf(1 - 1 / N) + g * stats.norm.ppf(1 - 1 / (N * np.e)))
    else:
        sr0 = 0.0
    sk = stats.skew(r)
    ku = stats.kurtosis(r, fisher=False)
    den = np.sqrt(max(1 - sk * sr + (ku - 1) / 4 * sr ** 2, 1e-12))
    return float(stats.norm.cdf((sr - sr0) * np.sqrt(n - 1) / den))


def max_drawdown(cum):
    cum = np.asarray(cum, float)
    peak = np.maximum.accumulate(cum)
    return float((cum - peak).min())


def summary(r, rf=None):
    """r: pandas Series of daily returns (fraction of initial capital, non-compounded)."""
    ex = r - rf.reindex(r.index).fillna(0) if rf is not None else r
    cum = r.cumsum()
    yearly = r.groupby(r.index.year).sum()
    return {
        "giorni": int(len(r)),
        "rend_annuo_%": round(r.mean() * ANN * 100, 2),
        "vol_annua_%": round(r.std() * np.sqrt(ANN) * 100, 2),
        "sharpe": round(sharpe(r), 2),
        "sharpe_eccesso": round(sharpe(ex), 2),
        "max_dd_%": round(max_drawdown(cum) * 100, 2),
        "p_boot": round(block_bootstrap_p(ex), 4),
        "anni": {int(k): round(v * 100, 2) for k, v in yearly.items()},
    }
