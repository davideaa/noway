"""Modello di produzione: addestramento, registro versioni, previsione.

Un "model version" (es. CPI-V1) contiene un sottomodello per ciascun
checkpoint, addestrato su tutti gli eventi storici utilizzabili, più le
statistiche fuori campione che il protocollo ha misurato (fasce di
confidenza, verdetto). Una nuova versione entra in servizio solo se
``promote`` la approva: non basta che arrivi un dato nuovo.
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime

import joblib
import numpy as np
import pandas as pd

from ..config import get_settings
from ..db import session
from ..research.models import REGIME
from ..research.walkforward import fit_final, usable
from ..timeutil import CHECKPOINTS, PRIMARY_CHECKPOINT, iso, utc_now

log = logging.getLogger("xnb.live.predictor")


def checkpoint_for(seconds_to_event: float) -> str:
    """Il sottomodello da usare a una certa distanza dalla release."""
    bounds = [("T-3D", 36 * 3600), ("T-24H", 10 * 3600), ("T-4H", 2 * 3600), ("T-1H", 45 * 60),
              ("T-30M", 15 * 60), ("T-5M", -1e18)]
    for cp, lo in bounds:
        if seconds_to_event > lo:
            return cp
    return "T-5M"


def train_version(df: pd.DataFrame, results: dict, family: str, version: str, dataset_hash: str) -> dict:
    """Addestra i sottomodelli del modello scelto dal protocollo e li salva su disco."""
    chosen = results["selection"]["chosen"]
    prim = df[df.t0_utc >= pd.Timestamp("2008-02-01", tz="UTC")]
    sub = {}
    for cp in CHECKPOINTS:
        u = usable(prim[prim.checkpoint == cp])
        m, cal = fit_final(u, chosen)
        sub[cp] = {"model": m, "calibrator": cal, "n_train": len(u)}
    hist = usable(prim[prim.checkpoint == PRIMARY_CHECKPOINT])
    keep = ["event_id", "t0_utc", "y", "y_move_pips", "y_range_pips", "y_body_pips", "y_mfe_pips", "y_mae_pips",
            "meta_atr_h1_usd", "meta_px"] + [c for c in REGIME if c in hist]
    artifact = {
        "family": family, "version": version, "algo": chosen, "submodels": sub,
        "history": hist[keep].reset_index(drop=True), "regime_features": [c for c in REGIME if c in hist],
        "verdict": results["verdict"], "holdout": results["holdout"], "oos_all_buckets": results["oos_all"]["buckets"],
        "dataset_sha256": dataset_hash, "created_utc": iso(utc_now()),
    }
    s = get_settings()
    path = s.models_dir / f"{version}.joblib"
    joblib.dump(artifact, path)
    sha = hashlib.sha256(path.read_bytes()).hexdigest()
    validated = results["verdict"]["primary"] == "PROMETTENTE"
    with session() as con:
        con.execute(
            "INSERT OR REPLACE INTO models(model_version,family,checkpoint,created_utc,status,algo,features_json,"
            "train_start,train_end,n_train,dataset_hash,artifact_path,artifact_sha256,validation_json,oos_validated,verdict,notes)"
            " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (version, family, "ALL", iso(utc_now()), "candidate", chosen,
             json.dumps(sorted(getattr(sub[PRIMARY_CHECKPOINT]["model"], "cols", []))),
             str(hist.t0_utc.min()), str(hist.t0_utc.max()), len(hist), dataset_hash, str(path), sha,
             json.dumps({"holdout": results["holdout"]["metrics"], "criteria": results["holdout"]["criteria"],
                         "permutation": results["holdout"]["permutation"]}),
             int(validated), results["verdict"]["primary"], "addestrato da scripts/train_model.py"),
        )
    log.info("modello %s salvato (%s, verdetto %s)", version, chosen, results["verdict"]["primary"])
    return {"version": version, "path": str(path), "sha256": sha}


def promote(version: str) -> None:
    """Mette in servizio una versione e ritira la precedente della stessa famiglia.

    Il controllo di validazione è qui: una versione senza verdetto registrato
    non può entrare. Una versione con NO RELIABLE EDGE può entrare, ma il
    motore live mostrerà NO RELIABLE EDGE come esito principale."""
    with session() as con:
        r = con.execute("SELECT * FROM models WHERE model_version=?", (version,)).fetchone()
        if r is None or not r["verdict"]:
            raise ValueError(f"{version}: nessuna validazione registrata, non promuovibile")
        con.execute("UPDATE models SET status='retired' WHERE family=? AND status='active'", (r["family"],))
        con.execute("UPDATE models SET status='active' WHERE model_version=?", (version,))


class LoadedModel:
    def __init__(self, row: dict):
        self.row = row
        path = row["artifact_path"]
        data = open(path, "rb").read()
        if hashlib.sha256(data).hexdigest() != row["artifact_sha256"]:
            raise RuntimeError(f"artefatto {path} alterato: hash diverso da quello registrato")
        self.a = joblib.load(path)
        hist = self.a["history"]
        feats = self.a["regime_features"]
        X = hist[feats].astype(float)
        self.mu = X.mean()
        self.sd = X.std().replace(0, 1)
        self.Z = ((X - self.mu) / self.sd).fillna(0).to_numpy()

    @property
    def version(self) -> str:
        return self.a["version"]

    @property
    def validated(self) -> bool:
        return self.a["verdict"]["primary"] == "PROMETTENTE"

    def predict(self, features: dict, checkpoint: str) -> dict:
        sub = self.a["submodels"][checkpoint]
        X = pd.DataFrame([{f"f_{k}": v for k, v in features.items()}])
        for c in getattr(sub["model"], "cols", []):
            if c not in X:
                X[c] = np.nan
        raw = float(sub["model"].predict_proba_up(X)[0])
        cal = float(sub["calibrator"].transform(np.array([raw]))[0])
        return {"raw": raw, "cal": cal, "algo": self.a["algo"], "n_train": sub["n_train"]}

    def bucket_for(self, p_up: float) -> dict | None:
        conf = max(p_up, 1 - p_up)
        for b in self.a["holdout"]["buckets"]:
            if not b.get("cumulative") and b["from"] <= conf < (b["to"] if b["to"] < 1 else 1.01):
                return b
        return None

    def comparable(self, features: dict, max_rms: float = 0.8, min_cases: int = 10) -> dict:
        """Motore di similarità: eventi storici con regime simile (distanza RMS in deviazioni standard)."""
        feats = self.a["regime_features"]
        q = np.array([features.get(c[2:], np.nan) for c in feats], dtype=float)
        z = (q - self.mu.to_numpy()) / self.sd.to_numpy()
        avail = np.isfinite(z)
        if avail.sum() < 3:
            return {"n": 0, "strict": False, "cases": []}
        d = np.sqrt(np.mean((self.Z[:, avail] - z[avail]) ** 2, axis=1))
        hist = self.a["history"].assign(dist=d).sort_values("dist")
        strict = hist[hist.dist <= max_rms]
        use = strict if len(strict) >= min_cases else hist.head(min_cases)
        atr_now = features.get("meta_atr_h1_usd")
        ratio = (use.y_range_pips * 0.1 / use.meta_atr_h1_usd)
        body_ratio = (use.y_body_pips * 0.1 / use.meta_atr_h1_usd)
        out = {
            "n": int(len(strict)), "strict": bool(len(strict) >= min_cases), "shown": int(len(use)),
            "total_history": int(len(hist)), "max_rms": max_rms,
            "bullish": int(use.y.sum()), "bullish_share": float(use.y.mean()),
            "cases": [{"event_id": r.event_id, "t0_utc": str(r.t0_utc), "direction": "BULLISH" if r.y else "BEARISH",
                       "move_pips": float(r.y_move_pips), "range_pips": float(r.y_range_pips), "distance": float(r.dist)}
                      for r in use.head(40).itertuples()],
        }
        if atr_now and np.isfinite(atr_now):
            q25, q50, q75 = np.nanpercentile(ratio, [25, 50, 75]) * atr_now / 0.1
            b25, b50, b75 = np.nanpercentile(body_ratio, [25, 50, 75]) * atr_now / 0.1
            mfe = np.nanpercentile(use.y_mfe_pips * 0.1 / use.meta_atr_h1_usd, 50) * atr_now / 0.1
            mae = np.nanpercentile(use.y_mae_pips * 0.1 / use.meta_atr_h1_usd, 50) * atr_now / 0.1
            out["movement"] = {"range_median_pips": q50, "range_p25_pips": q25, "range_p75_pips": q75,
                               "body_median_pips": b50, "body_p25_pips": b25, "body_p75_pips": b75,
                               "mfe_median_pips": mfe, "mae_median_pips": mae,
                               "method": "rapporti range/ATR H1 dei casi comparabili x ATR H1 attuale"}
        return out


def active_model(family: str) -> LoadedModel | None:
    with session() as con:
        r = con.execute("SELECT * FROM models WHERE family=? AND status='active' ORDER BY created_utc DESC LIMIT 1",
                        (family,)).fetchone()
    return LoadedModel(dict(r)) if r else None
