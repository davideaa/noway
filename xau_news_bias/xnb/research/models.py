"""Modelli candidati del protocollo CPI (iperparametri fissi, dichiarati prima).

Ogni modello espone ``fit(X, y)`` e ``predict_proba_up(X)`` (probabilità di
BULLISH). Le trasformazioni (imputazione, standardizzazione) vivono dentro
la pipeline e vengono stimate solo sul training di ciascun passo.
"""

from __future__ import annotations

import warnings

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore", category=UserWarning)

CORE = [
    "f_xau_ret_60m_atrh",
    "f_xau_ret_24h_atrd",
    "f_xau_ret_20d_atrd",
    "f_xau_pos_20d",
    "f_dxy_ret_24h_pct",
    "f_y2y_chg_5d",
    "f_core_accel",
    "f_prev_reaction",
]
NOWCAST_EXTRA = ["f_gap_core", "f_gap_headline", "f_cons_core_minus_prev"]
REGIME = [
    "f_cpi_yoy_last",
    "f_core_yoy_last",
    "f_core_accel",
    "f_y2y",
    "f_slope_2s10s",
    "f_r10y",
    "f_y2_minus_3m",
    "f_dxy_ret_20d_pct",
    "f_xau_atr_ratio_5_20",
    "f_xau_dist_ema50d_atrd",
]
# escluse dal set FULL: ritardi di dati (diagnostica), non informazione di mercato
FULL_EXCLUDE = {"f_xau_px_age_min", "f_rates_age_days", "f_cot_age_days", "f_days_since_prev_release"}

SIMPLICITY_ORDER = ["M0", "R1", "R2", "M1", "M1N", "M5", "M2", "M3", "M4"]


def full_features(df: pd.DataFrame) -> list[str]:
    return sorted(c for c in df.columns if c.startswith("f_") and c not in FULL_EXCLUDE)


class Climatology:
    """M0: frequenza di BULLISH nel training (con lisciatura di Laplace)."""

    def fit(self, X, y):
        self.p = (np.sum(y) + 1) / (len(y) + 2)
        return self

    def predict_proba_up(self, X):
        return np.full(len(X), self.p)


class MomentumRule:
    """R1 (sign=+1): continua il movimento dell'ultima ora; R2 (sign=-1): lo inverte.

    Probabilità = tasso di successo della regola nel training (Laplace)."""

    def __init__(self, sign: int, feature: str = "f_xau_ret_60m_atrh"):
        self.sign, self.feature = sign, feature

    def _signal(self, X):
        v = X[self.feature].to_numpy(dtype=float)
        s = np.sign(v) * self.sign
        return np.where(np.isnan(s), 0, s)

    def fit(self, X, y):
        s = self._signal(X)
        m = s != 0
        hits = np.sum((s[m] > 0) == (y[m] == 1))
        self.hit = (hits + 1) / (m.sum() + 2)
        return self

    def predict_proba_up(self, X):
        s = self._signal(X)
        return np.where(s > 0, self.hit, np.where(s < 0, 1 - self.hit, 0.5))


class GapRule:
    """R3 (ipotesi H2): gap_core ≥ +thr → BEARISH, ≤ −thr → BULLISH. Zero parametri stimati."""

    def __init__(self, thr: float = 0.05, feature: str = "f_gap_core"):
        self.thr, self.feature = thr, feature

    def signal(self, X):
        g = X[self.feature].to_numpy(dtype=float)
        return np.where(g >= self.thr, -1, np.where(g <= -self.thr, 1, 0))

    def fit(self, X, y):
        s = self.signal(X)
        m = s != 0
        hits = np.sum((s[m] > 0) == (y[m] == 1))
        self.hit = (hits + 1) / (m.sum() + 2)
        return self

    def predict_proba_up(self, X):
        s = self.signal(X)
        return np.where(s > 0, self.hit, np.where(s < 0, 1 - self.hit, 0.5))


class SkModel:
    def __init__(self, est, features):
        self.est, self.features = est, features

    def fit(self, X, y):
        self.cols = [c for c in self.features if c in X.columns and X[c].notna().any()]
        self.est.fit(X[self.cols].to_numpy(dtype=float), y)
        return self

    def predict_proba_up(self, X):
        return self.est.predict_proba(X[self.cols].to_numpy(dtype=float))[:, 1]


class LGBMModel(SkModel):
    def __init__(self, features):
        import lightgbm as lgb

        super().__init__(lgb.LGBMClassifier(
            n_estimators=100, learning_rate=0.03, num_leaves=4, min_child_samples=15,
            colsample_bytree=0.7, subsample=0.8, subsample_freq=1, reg_lambda=1.0,
            random_state=7, verbose=-1, n_jobs=1), features)


def _lr(C):
    return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                         LogisticRegression(C=C, max_iter=2000))


def make_model(name: str, df_cols: list[str], n_train: int = 100):
    full = [c for c in df_cols if c.startswith("f_") and c not in FULL_EXCLUDE]
    if name == "M0":
        return Climatology()
    if name == "R1":
        return MomentumRule(+1)
    if name == "R2":
        return MomentumRule(-1)
    if name == "R3":
        return GapRule()
    if name == "M1":
        return SkModel(_lr(0.1), CORE)
    if name == "M1N":
        return SkModel(_lr(0.1), CORE + NOWCAST_EXTRA)
    if name == "M2":
        return SkModel(_lr(0.05), full)
    if name == "M3":
        return SkModel(make_pipeline(SimpleImputer(strategy="median"), RandomForestClassifier(
            n_estimators=500, max_depth=3, min_samples_leaf=10, random_state=7, n_jobs=1)), full)
    if name == "M4":
        return LGBMModel(full)
    if name == "M5":
        k = int(max(5, min(25, n_train // 3)))
        return SkModel(make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                                     KNeighborsClassifier(n_neighbors=k, weights="distance")), REGIME)
    raise ValueError(name)


MODEL_NAMES = ["M0", "R1", "R2", "M1", "M1N", "M2", "M3", "M4", "M5"]
CALIBRATE = {"M1", "M1N", "M2", "M3", "M4", "M5"}
