from datetime import datetime, timedelta, timezone

from xnb.quality.checks import assess
from xnb.quality.registry import evaluate, source_by_id

NOW = datetime(2026, 9, 24, 14, 0, tzinfo=timezone.utc)  # giovedì, mercato aperto
CORE_OK = {"xau_ret_60m_atrh": 0.1, "xau_ret_24h_atrd": 0.1, "xau_ret_20d_atrd": 1, "xau_pos_20d": 0.5,
           "dxy_ret_24h_pct": 0.1, "y2y_chg_5d": 0.01, "core_accel": 0.0, "prev_reaction": 1}


def _iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S.00Z")


def test_healthy():
    q = assess(CORE_OK, market_open=True, live_px_age_s=10, cross_check_diff_pct=0.02, rates_age_days=1,
               consensus_present=True, nowcast_age_days=1, sources=[])
    assert q.status == "HEALTHY"


def test_stale_price_blocks_prediction():
    q = assess(CORE_OK, market_open=True, live_px_age_s=3600, cross_check_diff_pct=None, rates_age_days=1,
               consensus_present=True, nowcast_age_days=1, sources=[])
    assert q.status == "DATA INSUFFICIENT"


def test_missing_consensus_is_a_warning():
    q = assess(CORE_OK, market_open=True, live_px_age_s=10, cross_check_diff_pct=0.5, rates_age_days=7,
               consensus_present=False, nowcast_age_days=1, sources=[])
    assert q.status == "DATA QUALITY WARNING"
    assert {i["code"] for i in q.issues} == {"XAU_CROSSCHECK", "RATES_STALE", "CONSENSUS_MISSING"}


def test_registry_states():
    s = source_by_id("swissquote")
    ok = {"last_attempt_utc": _iso(NOW), "last_success_utc": _iso(NOW - timedelta(seconds=30)), "consecutive_failures": 0}
    assert evaluate(s, ok, NOW)[0] == "HEALTHY"
    stale = dict(ok, last_success_utc=_iso(NOW - timedelta(hours=1)))
    assert evaluate(s, stale, NOW)[0] == "STALE"
    # a mercato chiuso un prezzo vecchio non è STALE
    assert evaluate(s, stale, datetime(2026, 9, 26, 12, tzinfo=timezone.utc))[0] == "HEALTHY"
    failed = dict(ok, consecutive_failures=3, last_error="HTTP 503")
    assert evaluate(s, failed, NOW)[0] == "FAILED"
    assert evaluate(source_by_id("fred"), None, NOW)[0] in ("NOT CONFIGURED", "NEVER USED")
