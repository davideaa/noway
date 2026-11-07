"""Ricerca massiva di regole con controllo del data mining (protocollo §5).

Ogni ipotesi è una congiunzione di 1-3 condizioni su feature point-in-time
più una direzione. Il punteggio è la t-statistica dell'R medio dei trade.
Tutte le coppie si calcolano con prodotti matriciali (maschere × esiti),
le terne con un beam sulle 300 coppie migliori.

Controllo: la procedura INTERA si ripete su esiti permutati dentro ogni
anno (e famiglia); il massimo punteggio di ogni ripetizione forma la
distribuzione nulla del "migliore di tutta la ricerca". Il p familywise di
un'ipotesi è la quota di ripetizioni che fanno almeno altrettanto bene.
"""

from __future__ import annotations

import logging
import time
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from . import registry as REG

log = logging.getLogger("xnb.phase2.discovery")

CUTOFFS_SEARCH = ["T-1H", "T-1M"]
GROUPS = {"CPI": ["CPI"], "NFP": ["NFP"], "SHARED": ["CPI", "NFP"]}
MIN_SUPPORT = {"CPI": 15, "NFP": 15, "SHARED": 30}
BEAM = 300
GROUP_SEED = {"CPI": 11, "NFP": 23, "SHARED": 37}
TOP_KEEP = 3000
EXCLUDE = {"f_xau_px_age_min", "f_rates_age_days", "f_cot_age_days"}


@dataclass
class Space:
    """Primitive (condizioni) di un gruppo a un cutoff, calcolate sugli eventi di scoperta."""

    labels: list[str]
    feature: list[str]
    op: list[str]
    thr: list[float]
    feat_id: np.ndarray
    is_pa: np.ndarray
    M: np.ndarray  # P x n, float32 (0/1)
    N2: np.ndarray = field(default=None)  # P x P supporti delle coppie

    def apply(self, X: pd.DataFrame, idx: list[int]) -> np.ndarray:
        """Maschera della congiunzione ``idx`` su nuovi eventi (soglie congelate)."""
        m = np.ones(len(X), dtype=bool)
        for i in idx:
            v = X[self.feature[i]].to_numpy(dtype=float)
            ok = np.isfinite(v)
            t, op = self.thr[i], self.op[i]
            c = {"<=": v <= t, ">": v > t, ">=": v >= t, "==": v == t}[op]
            m &= c & ok
        return m


def build_space(X: pd.DataFrame, min_support: int) -> Space:
    labels, feats, ops, thrs, fid, pa, masks = [], [], [], [], [], [], []
    seen = set()
    cols = [c for c in X.columns if c.startswith("f_") and c not in EXCLUDE]
    for j, c in enumerate(cols):
        v = X[c].to_numpy(dtype=float)
        ok = np.isfinite(v)
        if ok.mean() < 0.70:
            continue
        vals = v[ok]
        uniq = np.unique(vals)
        if len(uniq) <= 1:
            continue
        if set(uniq.tolist()) <= {0.0, 1.0}:
            conds = [("==", 1.0), ("==", 0.0)]
        elif np.all(uniq == np.round(uniq)) and len(uniq) <= 8:
            conds = [("==", float(u)) for u in uniq]
        else:
            q25, q50, q75 = np.quantile(vals, [0.25, 0.5, 0.75])
            conds = [("<=", q25), ("<=", q50), (">", q50), (">=", q75)]
        for op, t in conds:
            m = {"<=": v <= t, ">": v > t, ">=": v >= t, "==": v == t}[op] & ok
            if m.sum() < min_support or m.sum() == len(m):
                continue
            key = np.packbits(m).tobytes()
            if key in seen:
                continue  # stessa maschera di una primitiva già presente
            seen.add(key)
            labels.append(f"{c[2:]} {op} {t:.4g}")
            feats.append(c)
            ops.append(op)
            thrs.append(float(t))
            fid.append(j)
            pa.append(c.startswith("f_pa_"))
            masks.append(m)
    M = np.array(masks, dtype=np.float32)
    sp = Space(labels, feats, ops, thrs, np.array(fid), np.array(pa), M)
    sp.N2 = M @ M.T
    return sp


def _t(S, Q, N):
    with np.errstate(divide="ignore", invalid="ignore"):
        mean = S / N
        var = (Q - S * S / N) / (N - 1)
        t = mean / np.sqrt(var / N)
    t[~np.isfinite(t)] = 0.0
    return t


def search(sp: Space, r: np.ndarray, min_support: int, rows: np.ndarray | None = None,
           keep_top: bool = False) -> dict:
    """Massimo punteggio (e, se richiesto, le ipotesi migliori) per UNA direzione."""
    M = sp.M if rows is None else sp.M[rows]
    fid = sp.feat_id if rows is None else sp.feat_id[rows]
    N2 = sp.N2 if rows is None else sp.N2[np.ix_(rows, rows)]
    P = M.shape[0]
    r = r.astype(np.float32)
    r2 = r * r
    N1 = M.sum(1)
    t1 = _t(M @ r, M @ r2, N1)
    t1[N1 < min_support] = 0
    S2 = (M * r) @ M.T
    Q2 = (M * r2) @ M.T
    t2 = _t(S2, Q2, N2)
    invalid = (N2 < min_support) | (fid[:, None] == fid[None, :]) | np.tri(P, dtype=bool)
    t2[invalid] = -np.inf
    beam = min(BEAM, t2.size)
    flat = np.argpartition(t2.ravel(), -beam)[-beam:]
    bi, bj = np.unravel_index(flat, t2.shape)
    B = M[bi] * M[bj]
    N3 = B @ M.T
    t3 = _t((B * r) @ M.T, (B * r2) @ M.T, N3)
    inv3 = (N3 < min_support) | (fid[None, :] == fid[bi][:, None]) | (fid[None, :] == fid[bj][:, None])
    t3[inv3] = -np.inf
    t3[~np.isfinite(t2[bi, bj])] = -np.inf  # coppie non valide nel beam (solo con pochissime primitive)
    out = {"max1": float(t1.max()), "max2": float(np.max(t2)), "max3": float(np.max(t3))}
    out["max"] = max(out["max1"], out["max2"], out["max3"])
    if keep_top:
        base = np.arange(P) if rows is None else rows
        hyps = [((int(base[i]),), float(t1[i])) for i in np.argsort(-t1)[:TOP_KEEP]]
        f2 = np.argsort(-t2.ravel())[:TOP_KEEP]
        for k in f2:
            i, j = divmod(int(k), P)
            if np.isfinite(t2[i, j]):
                hyps.append(((int(base[i]), int(base[j])), float(t2[i, j])))
        f3 = np.argsort(-t3.ravel())[:TOP_KEEP]
        for k in f3:
            a, c = divmod(int(k), P)
            if np.isfinite(t3[a, c]):
                trip = tuple(sorted({int(base[bi[a]]), int(base[bj[a]]), int(base[c])}))
                if len(trip) == 3:
                    hyps.append((trip, float(t3[a, c])))
        out["top"] = hyps
        out["n_hyp"] = int((N1 >= min_support).sum() + np.isfinite(t2).sum() + np.isfinite(t3).sum())
    return out


# ------------------------------------------------------------------ permutazioni
_W: dict = {}


def _perm_index(strata: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    idx = np.arange(len(strata))
    out = idx.copy()
    for s in np.unique(strata):
        m = np.nonzero(strata == s)[0]
        out[m] = rng.permutation(m)
    return out


def _run_perm(p: int) -> tuple[int, dict]:
    from threadpoolctl import threadpool_limits

    with threadpool_limits(1):
        vals = {}
        for g, per_cut in _W["groups"].items():
            rng = np.random.default_rng(_W["seed"] + 100_003 * p + GROUP_SEED[g])  # hash() non è stabile fra processi
            best_all, best_pa = -np.inf, -np.inf
            perm = None
            for cut, (sp, rL, rS, strata, ms, pa_rows) in per_cut.items():
                if perm is None:
                    perm = _perm_index(strata, rng)  # stessa permutazione per i due cutoff
                for dname, r in (("L", rL[perm]), ("S", rS[perm])):
                    s = search(sp, r, ms)
                    best_all = max(best_all, s["max"])
                    vals[(g, f"{cut}|{dname}|max")] = s["max"]
                    if len(pa_rows) > 10:
                        sp_pa = search(sp, r, ms, rows=pa_rows)
                        best_pa = max(best_pa, sp_pa["max"])
            vals[(g, "max_all")] = best_all
            vals[(g, "max_pa")] = best_pa
    return p, vals


def run_permutations(groups: dict, n_perm: int, campaign: str, seed: int, workers: int, mode: str) -> None:
    import multiprocessing as mp

    done = REG.perm_done(campaign)
    todo = [p for p in range(n_perm) if p not in done]
    REG.campaign_update(campaign, stage="permutazioni", total=n_perm, done=len(done), workers=workers, mode=mode)
    if not todo:
        return
    _W.update(groups=groups, seed=seed)
    t0 = time.time()
    with ProcessPoolExecutor(max_workers=workers, mp_context=mp.get_context("fork")) as ex:
        for k, (p, vals) in enumerate(ex.map(_run_perm, todo, chunksize=2), 1):
            REG.perm_save(campaign, p, vals)
            if k % 10 == 0 or k == len(todo):
                rate = k / (time.time() - t0)
                REG.campaign_update(campaign, done=len(done) + k,
                                    note=f"{rate:.2f} perm/s, ETA {int((len(todo) - k) / max(rate, 1e-9))} s")
                log.info("permutazioni %d/%d (%.2f/s)", len(done) + k, n_perm, rate)
