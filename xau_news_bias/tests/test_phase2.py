"""Fase 2: trade tick-by-tick, motore di ricerca, correzioni multiple, protezione del test finale."""

import numpy as np
import pandas as pd
import pytest

from xnb.phase2.discovery import build_space, search
from xnb.phase2.ticktrade import SCENARIOS, simulate
from xnb.phase2.trades import FINAL_KEY, final_nfp_outcomes, period
from xnb.phase2.validate import holm, one_sided_t


def _path(ts, bids, spread=0.2):
    t = np.asarray(ts, dtype=np.int64)
    b = np.asarray(bids, dtype=float)
    return {"t": t, "bid": b, "ask": b + spread}


def test_simulate_long_close_without_costs():
    p = _path([-20_000, -10_000, 5_000, 30_000, 59_000, 61_000], [100, 100, 101, 102, 103, 90])
    r = simulate(p, +1, 2.0, "m10", SCENARIOS["optimistic"])
    # ingresso all'ask di T-10 s (100,2), uscita al bid dell'ultimo tick < 60 s (103); il tick a 61 s non conta
    assert r["ok"] and not r["stopped"]
    assert r["pnl_usd"] == pytest.approx(2.8)
    assert r["r"] == pytest.approx(1.4)


def test_simulate_stop_includes_gap_and_costs():
    p = _path([-10_000, 1_000, 2_000, 50_000], [100, 99.9, 96.0, 110])
    r = simulate(p, +1, 2.0, "m10", SCENARIOS["optimistic"])
    # lo stop a 98,2 viene saltato: si esce al primo bid oltre (96), non allo stop teorico
    assert r["stopped"] and r["pnl_usd"] == pytest.approx(96.0 - 100.2)
    assert r["gap_usd"] == pytest.approx(4.2 - 2.0)
    rb = simulate(p, +1, 2.0, "m10", SCENARIOS["base"])
    assert rb["pnl_usd"] < r["pnl_usd"]  # i costi peggiorano sempre


def test_simulate_short_is_symmetric():
    p = _path([-10_000, 30_000, 59_000], [100, 99, 98])
    r = simulate(p, -1, 1.0, "m10", SCENARIOS["optimistic"])
    assert r["pnl_usd"] == pytest.approx(100.0 - 98.2)  # vende al bid, ricompra all'ask


def test_search_finds_planted_rule_and_counts():
    rng = np.random.default_rng(0)
    n = 200
    X = pd.DataFrame({"f_a": rng.normal(size=n), "f_b": rng.normal(size=n), "f_pa_c": rng.integers(0, 2, n)})
    r = rng.normal(0, 1, n)
    r[X.f_a.to_numpy() > np.quantile(X.f_a, 0.75)] += 1.5
    sp = build_space(X, 15)
    s = search(sp, r, 15, keep_top=True)
    best_idx, best_t = max(s["top"], key=lambda h: h[1])
    assert best_t == pytest.approx(s["max"])
    assert any(sp.feature[i] == "f_a" for i in best_idx)
    # la maschera congelata riapplicata agli stessi dati restituisce lo stesso supporto
    m = sp.apply(X, list(best_idx))
    assert m.sum() == int(sp.M[list(best_idx)].prod(0).sum())


def test_holm_with_padding():
    assert holm([0.01, 0.04]) == pytest.approx([0.02, 0.04])
    # m = 5 anche con 2 test: più severo
    assert holm([0.01, 0.04], m=5) == pytest.approx([0.05, 0.16])
    assert holm([0.5, 0.001, 0.2], m=5)[1] == pytest.approx(0.005)


def test_one_sided_t_needs_trades():
    assert one_sided_t(np.array([1.0, 2.0]))[1] == 1.0
    t, p = one_sided_t(np.array([1.0, 1.2, 0.8, 1.1, 0.9, 1.0]))
    assert t > 0 and p < 0.001


def test_final_nfp_is_locked():
    df = pd.DataFrame({"t0_utc": pd.to_datetime(["2019-06-07 12:30", "2021-06-04 12:30"], utc=True),
                       "family": ["NFP", "NFP"]})
    with pytest.raises(PermissionError):
        final_nfp_outcomes(df, "chiave-sbagliata")
    with pytest.raises(ValueError):
        period(df, "final_nfp")
    assert len(final_nfp_outcomes(df, FINAL_KEY)) == 1
    assert len(period(df, "discovery")) == 1


# ------------------------------------------------------------------ live (scheda di fase 2)
def _m1(end, n=180, rng=1.0):
    idx = pd.date_range(end=end - pd.Timedelta(minutes=1), periods=n, freq="1min", tz="UTC")
    return pd.DataFrame({"o": 100.0, "h": 100.0 + rng, "l": 100.0, "c": 100.0, "v": 1.0}, index=idx)


def test_live_card_stop_and_action():
    from xnb.phase2.live_card import _frozen, card, history

    t = pd.Timestamp("2026-10-02 12:25", tz="UTC")
    c = card("NFP", t, _m1(t), spread=0.5)
    h = history("NFP", t)
    med6 = float(np.median(h.range_over_atr.dropna().iloc[-6:]))
    assert c["available"] and c["atr_m1_60_usd"] == pytest.approx(1.0)
    assert c["U_news_usd"] == pytest.approx(med6)
    assert c["sl_usd"] == pytest.approx(0.60 * med6)
    # nessun candidato robusto: l'azione deve essere NO TRADE
    assert c["action"] == "NO TRADE" and c["verdict"] == "NO RELIABLE EDGE"
    assert 0 <= c["p_up_hist"] <= 1 and c["ev_long_R"] < 0.5
    # la storia usa solo release precedenti a t
    assert (h.t0_utc < t).all() and _frozen()["trades"] is not None
    # con meno di 60 M1 chiuse la scheda non inventa un'unità
    assert card("NFP", t, _m1(t, n=30), spread=0.5)["available"] is False


def test_live_trade_result_on_ticks():
    from xnb.phase2.live_card import trade_result

    t0 = pd.Timestamp("2026-10-02 12:30", tz="UTC")
    ms = int(t0.value // 1_000_000)
    rel = np.array([-30_000, -20_000, -12_000, -10_000, 1_000, 10_000, 30_000, 59_000, 61_000])
    bid = np.array([100, 100, 100, 100, 101, 104, 106, 108, 90], dtype=float)
    ticks = pd.DataFrame({"ts_ms": ms + rel, "bid": bid, "ask": bid + 0.2})
    c = {"sl_usd": 3.0, "U_news_usd": 5.0, "atr_m1_60_usd": 0.5, "action": "NO TRADE"}
    r = trade_result(c, ticks, t0)
    assert r["r_long"] > 2 and r["stopped_short"] is True and r["r_action"] is None
    assert r["range_over_atr"] == pytest.approx(r["actual_range_usd"] / 0.5)


def test_live_trades_append_only():
    import sqlite3

    from xnb.db import append_chained, session, verify_chain

    with session() as con:
        append_chained(con, "live_trades", {"resolved_utc": "2026-10-02T13:45:00.000Z", "event_id": "NFP_X",
                                            "family": "NFP", "r_long": 1.2, "r_short": -1.0})
    with pytest.raises(sqlite3.DatabaseError):
        with session() as con:
            con.execute("UPDATE live_trades SET r_long=5 WHERE event_id='NFP_X'")
    with session() as con:
        assert verify_chain(con, "live_trades") == (True, None)


def test_phase2_api_smoke():
    from fastapi.testclient import TestClient

    from xnb.api.app import app

    c = TestClient(app)
    d = c.get("/api/phase2").json()
    assert d["verdict"] == "NO RELIABLE EDGE" and len(d["final_tests"]) == 5
    s = c.get("/api/phase2/simulate", params={"family": "NFP", "strategy": "always_long"}).json()
    assert s["metrics"]["n"] > 100 and s["metrics"]["mean_R"] < 0
    assert c.get("/api/phase2/simulate", params={"strategy": "boh"}).status_code == 400
    assert "hardware" in c.get("/api/compute").json()
    assert c.get("/api/livetrades").json()["chain_ok"] is True
