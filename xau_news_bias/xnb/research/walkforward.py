"""Walk-forward a finestra espandente con calibrazione interna al training."""

from __future__ import annotations

import numpy as np
import pandas as pd

from .models import CALIBRATE, make_model
from .stats import Platt


def usable(df: pd.DataFrame) -> pd.DataFrame:
    """Eventi con esito valido: BULLISH/BEARISH e qualità OK."""
    m = df["y_direction"].isin(["BULLISH", "BEARISH"]) & (df["y_quality"] == "OK")
    out = df[m].copy()
    out["y"] = (out["y_direction"] == "BULLISH").astype(int)
    return out.sort_values("t0_utc").reset_index(drop=True)


def _inner_calibration(name: str, train: pd.DataFrame, cols: list[str], folds: int = 4) -> Platt:
    """Previsioni fuori campione DENTRO il training (fold cronologici), poi Platt."""
    n = len(train)
    edges = np.linspace(0, n, folds + 1).astype(int)
    raws, ys = [], []
    for k in range(1, folds):
        tr, te = train.iloc[: edges[k]], train.iloc[edges[k]: edges[k + 1]]
        if len(tr) < 25 or len(te) == 0 or tr["y"].nunique() < 2:
            continue
        m = make_model(name, cols, len(tr)).fit(tr, tr["y"].to_numpy())
        raws.append(m.predict_proba_up(te))
        ys.append(te["y"].to_numpy())
    if not raws:
        return Platt()
    return Platt().fit(np.concatenate(raws), np.concatenate(ys))


def walk_forward(df: pd.DataFrame, name: str, first_year: int = 2013, y_col: str = "y") -> pd.DataFrame:
    """``df``: righe di UN checkpoint, già filtrate con ``usable``. Restituisce le previsioni OOS."""
    cols = list(df.columns)
    out = []
    years = sorted(y for y in df["year"].unique() if y >= first_year)
    for yr in years:
        train = df[df["t0_utc"] < pd.Timestamp(f"{yr}-01-01", tz="UTC")]
        test = df[df["year"] == yr]
        if len(test) == 0 or len(train) < 30 or train[y_col].nunique() < 2:
            continue
        if y_col != "y":
            train = train.assign(y=train[y_col])
        m = make_model(name, cols, len(train)).fit(train, train["y"].to_numpy())
        raw = m.predict_proba_up(test)
        cal = raw
        if name in CALIBRATE:
            cal = _inner_calibration(name, train, cols).transform(raw)
        out.append(pd.DataFrame({
            "event_id": test["event_id"].to_numpy(), "t0_utc": test["t0_utc"].to_numpy(),
            "year": test["year"].to_numpy(), "y": test[y_col].to_numpy(),
            "p_raw": raw, "p_cal": cal, "n_train": len(train),
        }))
    return pd.concat(out, ignore_index=True) if out else pd.DataFrame()


def fit_final(df: pd.DataFrame, name: str):
    """Modello di produzione: addestrato su TUTTI gli eventi disponibili, con calibrazione interna."""
    cols = list(df.columns)
    m = make_model(name, cols, len(df)).fit(df, df["y"].to_numpy())
    cal = _inner_calibration(name, df, cols) if name in CALIBRATE else Platt()
    return m, cal
