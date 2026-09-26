"""Database SQLite: un solo file, modalità WAL, schema versionato.

Le tabelle delle previsioni e degli esiti live sono APPEND-ONLY: dei trigger
impediscono UPDATE e DELETE, e ogni riga porta l'hash della precedente
(catena di hash), così qualunque modifica fatta aggirando i trigger — per
esempio editando il file a mano — viene rilevata da ``verify_chain``.
"""

from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from .config import get_settings

SCHEMA_VERSION = 1

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS source_status(
  source_id TEXT PRIMARY KEY,
  last_attempt_utc TEXT, last_success_utc TEXT, last_error_utc TEXT,
  last_error TEXT, last_http_status INTEGER, last_latency_ms REAL,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_data_ts_utc TEXT
);

CREATE TABLE IF NOT EXISTS fetch_log(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL, ts_utc TEXT NOT NULL, ok INTEGER NOT NULL,
  http_status INTEGER, latency_ms REAL, url TEXT, error TEXT
);
CREATE INDEX IF NOT EXISTS ix_fetch_log_src ON fetch_log(source_id, ts_utc);

CREATE TABLE IF NOT EXISTS events(
  event_id TEXT PRIMARY KEY,
  family TEXT NOT NULL, name TEXT NOT NULL,
  t0_utc TEXT NOT NULL, t0_local TEXT, tz TEXT,
  reference_period TEXT,
  source TEXT, source_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  inserted_utc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_events_t0 ON events(t0_utc);

-- Valori macro con l'istante in cui sono diventati pubblici (point-in-time).
CREATE TABLE IF NOT EXISTS release_values(
  event_id TEXT NOT NULL, series TEXT NOT NULL, period TEXT NOT NULL,
  kind TEXT NOT NULL, value REAL, known_at_utc TEXT NOT NULL, source TEXT,
  PRIMARY KEY(event_id, series, period, kind)
);

CREATE TABLE IF NOT EXISTS event_outcomes(
  event_id TEXT PRIMARY KEY, feed TEXT NOT NULL,
  p0 REAL, p0_tick_utc TEXT, open_m1 REAL, high REAL, low REAL, close REAL,
  c1_tick_utc TEXT, direction TEXT, move_pips REAL, body_pips REAL,
  upper_wick_pips REAL, lower_wick_pips REAL, range_pips REAL,
  mfe_pips REAL, mae_pips REAL, n_ticks INTEGER, first_reaction_ms INTEGER,
  spread_p0 REAL, quality TEXT, computed_utc TEXT NOT NULL
);

-- Calendario visto dal vivo: archivio del consensus così come appariva,
-- per costruire da ora in avanti uno storico point-in-time vero.
CREATE TABLE IF NOT EXISTS calendar_snapshots(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fetched_utc TEXT NOT NULL, provider TEXT NOT NULL,
  title TEXT, country TEXT, event_time_utc TEXT, impact TEXT,
  forecast TEXT, previous TEXT, actual TEXT, raw_json TEXT
);
CREATE INDEX IF NOT EXISTS ix_cal_snap ON calendar_snapshots(event_time_utc, title);

CREATE TABLE IF NOT EXISTS datasets(
  dataset_hash TEXT PRIMARY KEY, family TEXT, created_utc TEXT, path TEXT,
  n_rows INTEGER, description TEXT
);

CREATE TABLE IF NOT EXISTS models(
  model_version TEXT PRIMARY KEY, family TEXT NOT NULL, checkpoint TEXT,
  created_utc TEXT NOT NULL, status TEXT NOT NULL, algo TEXT,
  features_json TEXT, train_start TEXT, train_end TEXT, n_train INTEGER,
  dataset_hash TEXT, artifact_path TEXT, artifact_sha256 TEXT,
  validation_json TEXT, oos_validated INTEGER NOT NULL DEFAULT 0,
  verdict TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS predictions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prediction_utc TEXT NOT NULL,
  event_id TEXT NOT NULL, event_t0_utc TEXT NOT NULL,
  checkpoint TEXT, seconds_to_event INTEGER,
  model_version TEXT, family TEXT,
  bias TEXT NOT NULL, raw_prob_up REAL, calibrated_prob_up REAL,
  prob_ci_low REAL, prob_ci_high REAL,
  confidence TEXT, oos_validated INTEGER,
  comparable_cases INTEGER, comparable_json TEXT,
  expected_move_pips REAL, move_p25 REAL, move_p75 REAL,
  data_status TEXT, data_issues_json TEXT,
  features_json TEXT, snapshot_sha256 TEXT,
  prev_hash TEXT, row_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_pred_event ON predictions(event_id, prediction_utc);
CREATE TRIGGER IF NOT EXISTS predictions_no_update BEFORE UPDATE ON predictions
BEGIN SELECT RAISE(ABORT, 'predictions: append-only'); END;
CREATE TRIGGER IF NOT EXISTS predictions_no_delete BEFORE DELETE ON predictions
BEGIN SELECT RAISE(ABORT, 'predictions: append-only'); END;

CREATE TABLE IF NOT EXISTS live_outcomes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resolved_utc TEXT NOT NULL, event_id TEXT NOT NULL UNIQUE,
  direction TEXT, p0 REAL, close REAL, move_pips REAL, range_pips REAL,
  mfe_pips REAL, mae_pips REAL, feed TEXT, quality TEXT,
  t1h_prediction_id INTEGER, final_prediction_id INTEGER,
  prev_hash TEXT, row_hash TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS live_outcomes_no_update BEFORE UPDATE ON live_outcomes
BEGIN SELECT RAISE(ABORT, 'live_outcomes: append-only'); END;
CREATE TRIGGER IF NOT EXISTS live_outcomes_no_delete BEFORE DELETE ON live_outcomes
BEGIN SELECT RAISE(ABORT, 'live_outcomes: append-only'); END;

CREATE TABLE IF NOT EXISTS job_runs(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job TEXT NOT NULL, started_utc TEXT NOT NULL, finished_utc TEXT,
  ok INTEGER, message TEXT
);
CREATE INDEX IF NOT EXISTS ix_job_runs ON job_runs(job, started_utc);

CREATE TABLE IF NOT EXISTS live_quotes(
  ts_utc TEXT NOT NULL, provider TEXT NOT NULL, symbol TEXT NOT NULL,
  bid REAL, ask REAL, PRIMARY KEY(ts_utc, provider, symbol)
);
"""

_lock = threading.RLock()


def connect(path: Path | None = None) -> sqlite3.Connection:
    path = path or get_settings().db_path
    path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(path, timeout=30, check_same_thread=False)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA foreign_keys=ON")
    con.executescript(SCHEMA)
    con.execute("INSERT OR IGNORE INTO meta(key,value) VALUES('schema_version',?)", (str(SCHEMA_VERSION),))
    con.commit()
    return con


@contextmanager
def session(path: Path | None = None) -> Iterator[sqlite3.Connection]:
    with _lock:
        con = connect(path)
        try:
            yield con
            con.commit()
        finally:
            con.close()


def canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str, allow_nan=True)


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _sql_value(v: Any) -> Any:
    """Normalizza al tipo che SQLite restituirà, così l'hash si ricalcola identico."""
    if v is None or isinstance(v, str):
        return v
    if isinstance(v, bool):
        return int(v)
    if isinstance(v, (dict, list)):
        return canonical_json(v)
    try:
        import numpy as np

        if isinstance(v, np.generic):
            v = v.item()
    except ImportError:  # pragma: no cover
        pass
    if isinstance(v, float) and v != v:  # NaN -> NULL
        return None
    return v


def append_chained(con: sqlite3.Connection, table: str, row: dict[str, Any]) -> int:
    """Inserisce una riga in una tabella append-only con catena di hash."""
    prev = con.execute(f"SELECT row_hash FROM {table} ORDER BY id DESC LIMIT 1").fetchone()
    prev_hash = prev["row_hash"] if prev else "GENESIS"
    body = {k: _sql_value(v) for k, v in row.items() if k not in ("prev_hash", "row_hash", "id")}
    body = {k: v for k, v in body.items() if v is not None}  # NULL = assente, identico in rilettura
    row_hash = sha256_text(prev_hash + canonical_json(body))
    cols = list(body) + ["prev_hash", "row_hash"]
    vals = [body[c] for c in body] + [prev_hash, row_hash]
    cur = con.execute(
        f"INSERT INTO {table}({','.join(cols)}) VALUES({','.join('?' * len(cols))})", vals
    )
    return int(cur.lastrowid)


def verify_chain(con: sqlite3.Connection, table: str) -> tuple[bool, int | None]:
    """Ricalcola la catena: (True, None) se integra, altrimenti (False, id della prima riga rotta)."""
    prev_hash = "GENESIS"
    for r in con.execute(f"SELECT * FROM {table} ORDER BY id"):
        d = dict(r)
        body = {k: v for k, v in d.items() if k not in ("prev_hash", "row_hash", "id") and v is not None}
        expect = sha256_text(prev_hash + canonical_json(body))
        if d["prev_hash"] != prev_hash or d["row_hash"] != expect:
            return False, d["id"]
        prev_hash = d["row_hash"]
    return True, None
