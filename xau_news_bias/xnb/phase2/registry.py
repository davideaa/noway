"""Registro degli esperimenti e stato delle campagne (Compute Center).

Ogni ipotesi valutata viene contata. Le campagne lunghe scrivono qui il
proprio avanzamento, così un crash non perde il lavoro fatto e la
dashboard mostra lavori completati, velocità ed ETA.
"""

from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime

from ..config import PROJECT_DIR
from ..db import canonical_json, session
from ..timeutil import iso, utc_now

SCHEMA = """
CREATE TABLE IF NOT EXISTS experiments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_utc TEXT NOT NULL, stage TEXT NOT NULL, grp TEXT, kind TEXT,
  n_hypotheses INTEGER, config_json TEXT, dataset_sha TEXT, code_commit TEXT, seed INTEGER,
  result_json TEXT
);
CREATE TABLE IF NOT EXISTS campaign(
  name TEXT PRIMARY KEY, stage TEXT, total INTEGER, done INTEGER, errors INTEGER DEFAULT 0,
  started_utc TEXT, updated_utc TEXT, workers INTEGER, mode TEXT, note TEXT
);
CREATE TABLE IF NOT EXISTS perm_results(
  campaign TEXT NOT NULL, perm INTEGER NOT NULL, grp TEXT NOT NULL, key TEXT NOT NULL, value REAL,
  PRIMARY KEY(campaign, perm, grp, key)
);
"""


def _con():
    from ..db import connect

    con = connect()
    con.executescript(SCHEMA)
    return con


def code_commit() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=PROJECT_DIR, text=True).strip()
    except Exception:  # noqa: BLE001
        return "unknown"


def log_experiment(stage: str, grp: str, kind: str, n_hyp: int, config: dict, dataset_sha: str,
                   seed: int | None, result: dict | None = None) -> None:
    con = _con()
    with con:
        con.execute("INSERT INTO experiments(created_utc,stage,grp,kind,n_hypotheses,config_json,dataset_sha,code_commit,seed,result_json)"
                    " VALUES(?,?,?,?,?,?,?,?,?,?)",
                    (iso(utc_now()), stage, grp, kind, int(n_hyp), canonical_json(config), dataset_sha, code_commit(),
                     seed, canonical_json(result or {})))
    con.close()


def log_experiment_once(stage: str, grp: str, kind: str, n_hyp: int, config: dict, dataset_sha: str,
                        seed: int | None, result: dict | None = None) -> None:
    """Come ``log_experiment`` ma una sola volta per (stage, grp, kind): rieseguire non gonfia i conteggi."""
    con = _con()
    n = con.execute("SELECT COUNT(*) FROM experiments WHERE stage=? AND grp=? AND kind=?", (stage, grp, kind)).fetchone()[0]
    con.close()
    if not n:
        log_experiment(stage, grp, kind, n_hyp, config, dataset_sha, seed, result)


def campaign_update(name: str, **kw) -> None:
    con = _con()
    with con:
        con.execute("INSERT OR IGNORE INTO campaign(name, started_utc) VALUES(?,?)", (name, iso(utc_now())))
        kw["updated_utc"] = iso(utc_now())
        sets = ", ".join(f"{k}=?" for k in kw)
        con.execute(f"UPDATE campaign SET {sets} WHERE name=?", (*kw.values(), name))
    con.close()


def perm_done(campaign: str) -> set[int]:
    con = _con()
    rows = con.execute("SELECT DISTINCT perm FROM perm_results WHERE campaign=?", (campaign,)).fetchall()
    con.close()
    return {r[0] for r in rows}


def perm_save(campaign: str, perm: int, values: dict[tuple[str, str], float]) -> None:
    con = _con()
    with con:  # transazione: o tutta la permutazione o niente
        con.executemany("INSERT OR REPLACE INTO perm_results(campaign,perm,grp,key,value) VALUES(?,?,?,?,?)",
                        [(campaign, perm, g, k, float(v)) for (g, k), v in values.items()])
    con.close()


def perm_load(campaign: str):
    import pandas as pd

    con = _con()
    df = pd.read_sql("SELECT * FROM perm_results WHERE campaign=?", con, params=(campaign,))
    con.close()
    return df


def registry_summary() -> dict:
    con = _con()
    rows = con.execute("SELECT stage, grp, kind, SUM(n_hypotheses), COUNT(*) FROM experiments GROUP BY stage, grp, kind").fetchall()
    camp = [dict(zip(("name", "stage", "total", "done", "errors", "started_utc", "updated_utc", "workers", "mode", "note"), r))
            for r in con.execute("SELECT name, stage, total, done, errors, started_utc, updated_utc, workers, mode, note FROM campaign")]
    con.close()
    return {"by_stage": [{"stage": a, "group": b, "kind": c, "hypotheses": int(d or 0), "runs": e} for a, b, c, d, e in rows],
            "total_hypotheses": int(sum(r[3] or 0 for r in rows)), "campaigns": camp}


def compute_info() -> dict:
    import shutil

    try:
        mem = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 1e9
    except (ValueError, OSError):
        mem = None
    du = shutil.disk_usage(PROJECT_DIR)
    return {"cpu_cores": os.cpu_count(), "ram_gb": round(mem, 1) if mem else None,
            "disk_free_gb": round(du.free / 1e9, 1)}


MODES = {"AUTO": lambda n: max(1, n - 1), "BALANCED": lambda n: max(1, n // 2),
         "MAXIMUM": lambda n: n, "CUSTOM": None}


def workers_for(mode: str, custom: int | None = None) -> int:
    n = os.cpu_count() or 1
    if mode == "CUSTOM":
        return max(1, min(n, int(custom or 1)))
    return MODES[mode](n)
