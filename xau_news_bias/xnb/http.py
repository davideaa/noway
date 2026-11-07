"""Client HTTP comune: rate limit per host, retry con backoff, esito registrato.

Ogni richiesta dichiara la ``source_id`` a cui appartiene: il risultato
(successo, codice HTTP, latenza, errore) finisce in ``source_status`` e
``fetch_log``, da cui il Data Quality Engine legge lo stato dei feed.
"""

from __future__ import annotations

import logging
import threading
import time
from urllib.parse import urlparse

import requests

from .config import get_settings
from .timeutil import iso, utc_now

log = logging.getLogger("xnb.http")

_session_lock = threading.Lock()
_sessions: dict[int, requests.Session] = {}
_last_call: dict[str, float] = {}
_host_lock = threading.Lock()

# Intervallo minimo fra due richieste allo stesso host (secondi).
MIN_INTERVAL = {
    "datafeed.dukascopy.com": 0.25,
    "jetta.dukascopy.com": 0.15,
    "www.bls.gov": 1.5,
    "api.bls.gov": 1.0,
    "api.stlouisfed.org": 0.6,
    "home.treasury.gov": 1.0,
    "publicreporting.cftc.gov": 1.0,
    "nfs.faireconomy.media": 5.0,
}
DEFAULT_INTERVAL = 0.5


class FetchError(RuntimeError):
    def __init__(self, msg: str, status: int | None = None):
        super().__init__(msg)
        self.status = status


def _session() -> requests.Session:
    tid = threading.get_ident()
    with _session_lock:
        s = _sessions.get(tid)
        if s is None:
            s = requests.Session()
            s.headers["User-Agent"] = get_settings().http_user_agent
            _sessions[tid] = s
        return s


def _throttle(host: str) -> None:
    gap = MIN_INTERVAL.get(host, DEFAULT_INTERVAL)
    with _host_lock:
        now = time.monotonic()
        wait = _last_call.get(host, 0.0) + gap - now
        _last_call[host] = max(now, _last_call.get(host, 0.0) + gap)
    if wait > 0:
        time.sleep(wait)


def record_status(source_id: str, ok: bool, status: int | None, latency_ms: float | None,
                  url: str | None, error: str | None = None, data_ts: str | None = None) -> None:
    """Scrive l'esito nel registro. Non deve mai far fallire il chiamante."""
    try:
        from .db import session

        now = iso(utc_now())
        with session() as con:
            con.execute(
                "INSERT INTO fetch_log(source_id,ts_utc,ok,http_status,latency_ms,url,error) VALUES(?,?,?,?,?,?,?)",
                (source_id, now, int(ok), status, latency_ms, url, error),
            )
            con.execute("INSERT OR IGNORE INTO source_status(source_id) VALUES(?)", (source_id,))
            if ok:
                con.execute(
                    "UPDATE source_status SET last_attempt_utc=?, last_success_utc=?, last_http_status=?,"
                    " last_latency_ms=?, consecutive_failures=0,"
                    " last_data_ts_utc=COALESCE(?, last_data_ts_utc) WHERE source_id=?",
                    (now, now, status, latency_ms, data_ts, source_id),
                )
            else:
                con.execute(
                    "UPDATE source_status SET last_attempt_utc=?, last_error_utc=?, last_error=?,"
                    " last_http_status=?, last_latency_ms=?, consecutive_failures=consecutive_failures+1"
                    " WHERE source_id=?",
                    (now, now, (error or "")[:500], status, latency_ms, source_id),
                )
    except Exception as exc:  # pragma: no cover - il log non deve rompere il fetch
        log.warning("record_status fallito per %s: %s", source_id, exc)


def get(url: str, source_id: str, *, params: dict | None = None, headers: dict | None = None,
        timeout: float = 60, retries: int = 4, ok_statuses: tuple[int, ...] = (200,),
        record: bool = True, allow_404: bool = False) -> requests.Response | None:
    """GET con throttling e retry. Restituisce None solo se ``allow_404`` e la risorsa non esiste."""
    host = urlparse(url).netloc
    last_exc: Exception | None = None
    status: int | None = None
    for attempt in range(retries + 1):
        _throttle(host)
        t0 = time.monotonic()
        try:
            r = _session().get(url, params=params, headers=headers, timeout=timeout)
            latency = (time.monotonic() - t0) * 1000
            status = r.status_code
            if status in ok_statuses:
                if record:
                    record_status(source_id, True, status, latency, r.url)
                return r
            if status == 404 and allow_404:
                if record:
                    record_status(source_id, True, status, latency, r.url)
                return None
            if status in (429, 500, 502, 503, 504):
                last_exc = FetchError(f"HTTP {status}", status)
                time.sleep(min(60, 2 ** attempt + 0.5))
                continue
            last_exc = FetchError(f"HTTP {status}: {r.text[:200]}", status)
            break
        except requests.RequestException as exc:
            last_exc = exc
            time.sleep(min(60, 2 ** attempt + 0.5))
    if record:
        record_status(source_id, False, status, None, url, str(last_exc))
    raise FetchError(f"{source_id}: GET {url} fallita: {last_exc}", status)
