"""Motore LIVE: calendario, previsioni a cadenza variabile, esiti, track record.

Cadenza di ricalcolo (distanza τ dalla release):
    τ > 24 h        ogni 30 min
    4 h < τ ≤ 24 h  ogni 15 min
    1 h < τ ≤ 4 h   ogni 5 min
    τ ≤ 1 h         ogni minuto
più una previsione esattamente a ogni checkpoint (T−3D … T−5M) e una
immediata quando cambia il consensus o il nowcast (event-driven).

Ogni previsione è una riga nuova e immutabile di ``predictions``.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

from ..db import append_chained, canonical_json, session, sha256_text
from ..phase2.live_card import card as p2_card
from ..phase2.live_card import trade_result as p2_trade_result
from ..providers.base import EventSpec
from ..providers.bls import BLSProvider
from ..providers.consensus import ClevelandFedNowcast
from ..providers.live_feeds import ForexFactoryCalendar
from ..quality.checks import assess
from ..quality.registry import registry_status
from ..research.features import snapshot
from ..research.pipeline import store_events
from ..research.targets import compute_outcome
from ..timeutil import CHECKPOINTS, NY, iso, parse_iso, utc_now
from .market import LiveMarket
from .predictor import LoadedModel, active_model, checkpoint_for

log = logging.getLogger("xnb.live.engine")

MODELLED = {"CPI"}
P2_FAMILIES = {"CPI", "NFP"}  # famiglie con la scheda di trade della fase 2
WATCHED = ["CPI", "NFP", "PPI", "PCE", "FOMC", "RETAIL", "GDP", "ISM_M", "ISM_S"]
FAMILY_NAMES = {"CPI": "CPI", "NFP": "Non-Farm Payrolls", "PPI": "PPI", "PCE": "Core PCE", "FOMC": "FOMC Rate Decision",
                "RETAIL": "Retail Sales", "GDP": "GDP", "ISM_M": "ISM Manufacturing", "ISM_S": "ISM Services"}


def cadence_seconds(tau: float) -> int:
    if tau > 24 * 3600:
        return 1800
    if tau > 4 * 3600:
        return 900
    if tau > 3600:
        return 300
    return 60


class LiveEngine:
    def __init__(self):
        self.market = LiveMarket()
        self.bls = BLSProvider()
        self.ff = ForexFactoryCalendar()
        self.nowcast = ClevelandFedNowcast()
        self._nowcast_df: pd.DataFrame | None = None
        self._nowcast_at: datetime | None = None
        self._models: dict[str, LoadedModel | None] = {}
        self._force: set[str] = set()
        self._last_quote: dict | None = None

    # ---------------------------------------------------------------- calendar
    def refresh_calendar(self) -> list[EventSpec]:
        """BLS iCal (date/ore ufficiali) + ForexFactory (tutte le famiglie, consensus). Archivia il consensus."""
        events: dict[str, EventSpec] = {}
        horizon_start = utc_now() - timedelta(days=1)
        for fam in ("CPI", "NFP", "PPI"):
            try:
                for e in self.bls.upcoming_events(fam):
                    if e.t0_utc >= horizon_start:
                        events[e.event_id] = e
            except Exception as exc:  # noqa: BLE001
                log.error("calendario BLS non aggiornato (%s): %s", fam, exc)
        changed = False
        try:
            items = self.ff.this_week()
            with session() as con:
                for it in items:
                    if it.country != "USD":
                        continue
                    prev = con.execute(
                        "SELECT forecast, previous, actual FROM calendar_snapshots WHERE title=? AND event_time_utc=?"
                        " ORDER BY id DESC LIMIT 1", (it.title, iso(it.event_time_utc))).fetchone()
                    cur = (it.forecast, it.previous, it.actual)
                    if prev is None or tuple(prev) != cur:
                        con.execute(
                            "INSERT INTO calendar_snapshots(fetched_utc,provider,title,country,event_time_utc,impact,"
                            "forecast,previous,actual,raw_json) VALUES(?,?,?,?,?,?,?,?,?,?)",
                            (iso(utc_now()), "forexfactory", it.title, it.country, iso(it.event_time_utc), it.impact,
                             it.forecast, it.previous, it.actual, self.ff.raw_json(it)))
                        if prev is not None and it.family:
                            changed = True
                    if it.family and it.impact == "High":
                        eid = f"{it.family}_{it.event_time_utc.astimezone(NY).date().isoformat()}"
                        if eid not in events:
                            events[eid] = EventSpec(eid, it.family, FAMILY_NAMES.get(it.family, it.title),
                                                    it.event_time_utc, source="forexfactory", source_url=self.ff.URL)
        except Exception as exc:  # noqa: BLE001
            log.error("calendario ForexFactory non aggiornato: %s", exc)
        evs = list(events.values())
        store_events(evs)
        if changed:
            log.info("consensus cambiato: ricalcolo immediato delle previsioni")
            self._force.update(e.event_id for e in evs)
        return evs

    def upcoming(self, horizon_days: float = 10) -> list[dict]:
        now = utc_now()
        with session() as con:
            rows = con.execute("SELECT * FROM events WHERE t0_utc>=? AND t0_utc<=? ORDER BY t0_utc",
                               (iso(now - timedelta(hours=2)), iso(now + timedelta(days=horizon_days)))).fetchall()
        return [dict(r) for r in rows]

    def consensus_for(self, event: dict) -> dict:
        """Ultimo consensus FF archiviato per l'evento (per CPI: m/m e core m/m)."""
        titles = {"CPI": ["CPI m/m", "Core CPI m/m", "CPI y/y"]}.get(event["family"], [])
        out = {}
        with session() as con:
            for t in titles:
                r = con.execute("SELECT forecast FROM calendar_snapshots WHERE title=? AND event_time_utc=? ORDER BY id DESC LIMIT 1",
                                (t, event["t0_utc"])).fetchone()
                if r and r["forecast"]:
                    try:
                        out[t] = float(str(r["forecast"]).replace("%", ""))
                    except ValueError:
                        pass
        return out

    # ---------------------------------------------------------------- models
    def model(self, family: str) -> LoadedModel | None:
        if family not in self._models:
            try:
                self._models[family] = active_model(family)
            except Exception as exc:  # noqa: BLE001
                log.error("modello %s non caricabile: %s", family, exc)
                self._models[family] = None
        return self._models[family]

    def reload_models(self) -> None:
        self._models.clear()

    # ---------------------------------------------------------------- snapshot
    def _prior_releases(self, family: str, t: datetime) -> list[dict]:
        with session() as con:
            evs = con.execute("SELECT e.event_id, e.t0_utc, o.direction, o.move_pips FROM events e LEFT JOIN event_outcomes o"
                              " ON o.event_id=e.event_id WHERE e.family=? AND e.t0_utc<? ORDER BY e.t0_utc DESC LIMIT 20",
                              (family, iso(t - timedelta(seconds=60)))).fetchall()
            out = []
            for r in evs:
                vals = {v["series"]: v["value"] for v in con.execute(
                    "SELECT series, value FROM release_values WHERE event_id=? AND kind='as_published'", (r["event_id"],))}
                out.append({"event_id": r["event_id"], "values": vals, "direction": r["direction"],
                            "move_pips": r["move_pips"], "days_before": (t - parse_iso(r["t0_utc"])).total_seconds() / 86400})
        return out

    def _nowcast(self) -> pd.DataFrame | None:
        now = utc_now()
        if self._nowcast_df is None or (now - self._nowcast_at).total_seconds() > 3 * 3600:
            try:
                prev_max = None if self._nowcast_df is None else self._nowcast_df.obs_date.max()
                self._nowcast_df = self.nowcast.load(max_age_h=3)
                self._nowcast_at = now
                if prev_max is not None and self._nowcast_df.obs_date.max() > prev_max:
                    log.info("nuovo nowcast Cleveland Fed: ricalcolo immediato")
                    self._force.update(e["event_id"] for e in self.upcoming())
            except Exception as exc:  # noqa: BLE001
                log.error("nowcast Cleveland Fed non aggiornato: %s", exc)
        return self._nowcast_df

    def build_features(self, event: dict, t: datetime) -> tuple[dict, dict]:
        """Fotografia live con lo stesso codice della ricerca. Restituisce (feature, info qualità)."""
        ctx = self.market.context(t)
        start = (t - timedelta(days=4)).date()
        xm1 = self.market.recent_m1("XAUUSD", start, t)
        em1 = self.market.recent_m1("EURUSD", start, t)
        prior = self._prior_releases(event["family"], t)
        f = snapshot(ctx, t, xm1, em1, prior)
        info = {"rates_age_days": f.get("rates_age_days"), "consensus_present": False, "nowcast_age_days": None}
        if event["family"] == "CPI":
            cons = self.consensus_for(event)
            info["consensus_present"] = bool(cons)
            prev_vals = prior[0]["values"] if prior else {}
            if "Core CPI m/m" in cons:
                f["cons_core_mom"] = cons["Core CPI m/m"]
                f["cons_core_minus_prev"] = cons["Core CPI m/m"] - prev_vals.get("core_mom_0", np.nan)
            if "CPI m/m" in cons:
                f["cons_cpi_mom"] = cons["CPI m/m"]
                f["cons_cpi_minus_prev"] = cons["CPI m/m"] - prev_vals.get("cpi_mom_0", np.nan)
            nc = self._nowcast()
            t0 = parse_iso(event["t0_utc"])
            ref = event.get("reference_period")
            if not ref:
                m = (t0.astimezone(NY).replace(day=1) - timedelta(days=1))
                ref = f"{m.year}-{m.month:02d}"
            if nc is not None:
                sub = nc[(nc.target == ref) & (nc.available_from_utc <= t)]
                if len(sub):
                    f["nowcast_core_mom"] = float(sub[sub.series == "nc_core"].sort_values("obs_date").value.iloc[-1])
                    f["nowcast_cpi_mom"] = float(sub[sub.series == "nc_cpi"].sort_values("obs_date").value.iloc[-1])
                    info["nowcast_age_days"] = (t.date() - sub.obs_date.max()).days
                    if "cons_core_mom" in f:
                        f["gap_core"] = f["nowcast_core_mom"] - f["cons_core_mom"]
                    if "cons_cpi_mom" in f:
                        f["gap_headline"] = f["nowcast_cpi_mom"] - f["cons_cpi_mom"]
        return f, info

    # ---------------------------------------------------------------- predict
    def predict(self, event: dict, now: datetime | None = None, label: str | None = None) -> dict:
        now = now or utc_now()
        t0 = parse_iso(event["t0_utc"])
        tau = (t0 - now).total_seconds()
        cp = checkpoint_for(tau)
        fam = event["family"]
        row = {"prediction_utc": iso(now), "event_id": event["event_id"], "event_t0_utc": event["t0_utc"],
               "checkpoint": label or "ROLLING", "seconds_to_event": int(tau), "family": fam}
        mdl = self.model(fam) if fam in MODELLED else None
        if mdl is None:
            if fam in P2_FAMILIES:
                # studiata nella fase 2 senza modello di direzione valido: solo la scheda del trade
                row.update(bias="NO RELIABLE EDGE", confidence="NONE", oos_validated=0, model_version=None,
                           data_status="N/A", data_issues_json=json.dumps(
                               [{"severity": "info", "code": "NO_DIRECTION_MODEL",
                                 "message": f"{fam}: fase 2 senza edge fuori campione, nessun modello di direzione"}]))
                return self._store(row, {}, {"phase2": self.phase2_card(fam, now)})
            row.update(bias="NO MODEL", confidence="NONE", oos_validated=0, model_version=None,
                       data_status="N/A", data_issues_json=json.dumps(
                           [{"severity": "info", "code": "NOT_RESEARCHED",
                             "message": f"{fam}: ricerca non ancora eseguita, nessun modello"}]))
            return self._store(row, {})
        feats, info = self.build_features(event, now)
        q = self._last_quote or self.market.collect_quote()
        sources = registry_status()
        dq = assess(feats, market_open=self.market.market_open(now), live_px_age_s=q.get("age_s"),
                    cross_check_diff_pct=q.get("cross_check_diff_pct"), rates_age_days=info["rates_age_days"],
                    consensus_present=info["consensus_present"], nowcast_age_days=info["nowcast_age_days"],
                    sources=sources)
        pr = mdl.predict(feats, cp)
        comp = mdl.comparable(feats)
        p = pr["cal"]
        lean = "BULLISH" if p > 0.5 else "BEARISH"
        bucket = mdl.bucket_for(p)
        if dq.status == "DATA INSUFFICIENT":
            bias, conf = "NO DATA", "NONE"
        elif not mdl.validated:
            bias, conf = "NO RELIABLE EDGE", "NONE"
        else:
            bias = lean
            lo = (bucket or {}).get("wilson_lo") or 0
            conf = "HIGH" if lo >= 0.6 else "MEDIUM" if lo >= 0.53 else "LOW"
            if dq.status != "HEALTHY":
                conf = "LOW"
        mv = comp.get("movement", {})
        row.update(
            model_version=mdl.version, bias=bias, raw_prob_up=pr["raw"], calibrated_prob_up=p,
            prob_ci_low=(bucket or {}).get("wilson_lo"), prob_ci_high=(bucket or {}).get("wilson_hi"),
            confidence=conf, oos_validated=int(mdl.validated), comparable_cases=comp.get("n"),
            comparable_json=json.dumps({k: v for k, v in comp.items() if k != "movement"}, default=str),
            expected_move_pips=mv.get("range_median_pips"), move_p25=mv.get("range_p25_pips"),
            move_p75=mv.get("range_p75_pips"), data_status=dq.status, data_issues_json=json.dumps(dq.issues),
        )
        extra = {"lean": lean, "submodel_checkpoint": cp, "bucket": bucket, "movement": mv, "algo": pr["algo"]}
        if fam in P2_FAMILIES:
            extra["phase2"] = self.phase2_card(fam, now)
        return self._store(row, feats, extra)

    def phase2_card(self, family: str, now: datetime) -> dict:
        """Scheda del trade di fase 2 (stop normalizzato, EV storici, azione). Un errore qui non blocca la previsione."""
        try:
            # solo candele Dukascopy: le quotazioni live aggregate hanno range nullo e sporcherebbero l'ATR
            m1 = self.market.recent_m1("XAUUSD", (now - timedelta(days=2)).date(), now, live=False)
            q = self._last_quote or {}
            qq = q.get("quote")
            spread = (qq.ask - qq.bid) if qq is not None else None
            with session() as con:
                live = [dict(r) for r in con.execute("SELECT family, t0_utc, range_over_atr FROM live_trades")]
            return p2_card(family, pd.Timestamp(now), m1, spread, live)
        except Exception as exc:  # noqa: BLE001
            log.warning("scheda di fase 2 non calcolata per %s: %s", family, exc)
            return {"available": False, "reason": f"errore: {exc}"}

    def _store(self, row: dict, feats: dict, extra: dict | None = None) -> dict:
        clean = {k: (None if isinstance(v, float) and not np.isfinite(v) else v) for k, v in feats.items()}
        payload = {"features": clean, "extra": extra or {}}
        row["features_json"] = canonical_json(payload)
        row["snapshot_sha256"] = sha256_text(row["features_json"])
        with session() as con:
            row["id"] = append_chained(con, "predictions", row)
        return row

    def due(self, event: dict, now: datetime) -> str | None:
        """Serve una previsione adesso? Restituisce l'etichetta (checkpoint o ROLLING) oppure None."""
        t0 = parse_iso(event["t0_utc"])
        tau = (t0 - now).total_seconds()
        if tau <= 0:
            return None
        with session() as con:
            last = con.execute("SELECT prediction_utc, checkpoint FROM predictions WHERE event_id=? ORDER BY id DESC LIMIT 1",
                               (event["event_id"],)).fetchone()
            done_cps = {r["checkpoint"] for r in con.execute(
                "SELECT DISTINCT checkpoint FROM predictions WHERE event_id=?", (event["event_id"],))}
        for cp, secs in CHECKPOINTS.items():
            # checkpoint esatto: entro 3 minuti dopo l'istante, se non già registrato
            if cp not in done_cps and 0 <= (secs - tau) <= 180:
                return cp
        if event["family"] not in MODELLED:
            return None  # senza modello: solo le righe dei checkpoint, niente ricalcoli inutili
        if event["event_id"] in self._force:
            self._force.discard(event["event_id"])
            return "EVENT-DRIVEN"
        if last is None:
            return "ROLLING"
        age = (now - parse_iso(last["prediction_utc"])).total_seconds()
        return "ROLLING" if age >= cadence_seconds(tau) - 5 else None

    def step(self) -> list[dict]:
        """Chiamato ogni minuto dallo scheduler."""
        now = utc_now()
        out = []
        for ev in self.upcoming(horizon_days=7):
            label = self.due(ev, now)
            if label:
                try:
                    out.append(self.predict(ev, now, label))
                except Exception as exc:  # noqa: BLE001
                    log.exception("previsione fallita per %s: %s", ev["event_id"], exc)
        return out

    def collect_quote(self) -> dict:
        self._last_quote = self.market.collect_quote()
        return self._last_quote

    # ---------------------------------------------------------------- resolve
    def resolve(self) -> list[dict]:
        """Dopo la release: esito dai tick Dukascopy (stesso target della ricerca), poi valori BLS."""
        now = utc_now()
        with session() as con:
            pend = con.execute(
                "SELECT e.* FROM events e WHERE e.t0_utc<=? AND e.t0_utc>=? AND e.event_id NOT IN (SELECT event_id FROM live_outcomes)"
                " AND e.event_id IN (SELECT DISTINCT event_id FROM predictions)",
                (iso(now - timedelta(minutes=75)), iso(now - timedelta(days=10)))).fetchall()
        done = []
        for ev in pend:
            ev = dict(ev)
            t0 = parse_iso(ev["t0_utc"])
            try:
                ticks = self.market.duka.ticks("XAUUSD", t0 - timedelta(minutes=5), t0 + timedelta(minutes=5))
            except Exception as exc:  # noqa: BLE001
                log.warning("tick per l'esito di %s non ancora disponibili: %s", ev["event_id"], exc)
                continue
            o = compute_outcome(ev["event_id"], t0, ticks)
            if o.quality in ("NO_TICKS", "NO_PRE_TICK", "NO_TICKS_IN_WINDOW") and now - t0 < timedelta(hours=6):
                continue  # il feed non ha ancora pubblicato l'ora: si riprova
            with session() as con:
                row = o.db_row()
                row["computed_utc"] = iso(now)
                cols = list(row)
                con.execute(f"INSERT OR REPLACE INTO event_outcomes({','.join(cols)}) VALUES({','.join('?' * len(cols))})",
                            [row[c] for c in cols])
                t1h = con.execute("SELECT id FROM predictions WHERE event_id=? AND checkpoint='T-1H' ORDER BY id LIMIT 1",
                                  (ev["event_id"],)).fetchone()
                final = con.execute("SELECT id FROM predictions WHERE event_id=? AND prediction_utc<? ORDER BY id DESC LIMIT 1",
                                    (ev["event_id"], ev["t0_utc"])).fetchone()
                append_chained(con, "live_outcomes", {
                    "resolved_utc": iso(now), "event_id": ev["event_id"], "direction": o.direction, "p0": o.p0,
                    "close": o.close, "move_pips": o.move_pips, "range_pips": o.range_pips, "mfe_pips": o.mfe_pips,
                    "mae_pips": o.mae_pips, "feed": o.feed, "quality": o.quality,
                    "t1h_prediction_id": t1h["id"] if t1h else None, "final_prediction_id": final["id"] if final else None,
                })
                con.execute("UPDATE events SET status='released' WHERE event_id=?", (ev["event_id"],))
            if ev["family"] in P2_FAMILIES:
                self._resolve_phase2(ev, t0, ticks, now)
            if ev["family"] == "CPI":
                try:
                    spec = EventSpec(ev["event_id"], "CPI", ev["name"], t0, ev.get("reference_period"),
                                     source_url=f"https://www.bls.gov/news.release/archives/cpi_{t0.astimezone(NY):%m%d%Y}.htm")
                    vals = self.bls.release_values(spec)
                    with session() as con:
                        for k, v in vals.items():
                            con.execute("INSERT OR REPLACE INTO release_values(event_id,series,period,kind,value,known_at_utc,source)"
                                        " VALUES(?,?,?,?,?,?,?)", (ev["event_id"], k, ev.get("reference_period") or "",
                                                                  "as_published", v, ev["t0_utc"], "bls_table_a"))
                except Exception as exc:  # noqa: BLE001
                    log.warning("valori BLS di %s non ancora letti: %s", ev["event_id"], exc)
            log.info("esito registrato %s: %s (%.1f pips)", ev["event_id"], o.direction, o.move_pips or 0)
            done.append({"event_id": ev["event_id"], "direction": o.direction})
        return done

    def _resolve_phase2(self, ev: dict, t0: datetime, ticks: pd.DataFrame, now: datetime) -> None:
        """Il trade della scheda di fase 2 sui tick reali, registrato in modo immutabile."""
        with session() as con:
            if con.execute("SELECT 1 FROM live_trades WHERE event_id=?", (ev["event_id"],)).fetchone():
                return
            r = con.execute("SELECT id, features_json FROM predictions WHERE event_id=? AND prediction_utc<? "
                            "ORDER BY id DESC LIMIT 1", (ev["event_id"], ev["t0_utc"])).fetchone()
        if not r:
            return
        try:
            c = (json.loads(r["features_json"] or "{}").get("extra") or {}).get("phase2") or {}
        except json.JSONDecodeError:
            c = {}
        if not c.get("available"):
            return
        res = p2_trade_result(c, ticks, t0)
        with session() as con:
            append_chained(con, "live_trades", {
                "resolved_utc": iso(now), "event_id": ev["event_id"], "family": ev["family"], "t0_utc": ev["t0_utc"],
                "prediction_id": r["id"], "card_version": c.get("version"), "action": c.get("action"),
                "u_news_usd": c.get("U_news_usd"), "sl_usd": c.get("sl_usd"), "atr_m1_60_usd": c.get("atr_m1_60_usd"),
                "expected_range_usd": c.get("expected_range_usd"), "ev_long_r": c.get("ev_long_R"),
                "ev_short_r": c.get("ev_short_R"), "p_up_hist": c.get("p_up_hist"),
                "actual_range_usd": res.get("actual_range_usd"), "actual_move_usd": res.get("actual_move_usd"),
                "range_log_error": res.get("range_log_error"), "range_over_atr": res.get("range_over_atr"),
                "r_long": res.get("r_long"), "r_short": res.get("r_short"), "r_action": res.get("r_action"),
                "stopped_long": res.get("stopped_long"), "stopped_short": res.get("stopped_short"),
                "quality": res.get("quality"),
            })
        log.info("trade di fase 2 registrato per %s: R long %s, R short %s", ev["event_id"], res.get("r_long"),
                 res.get("r_short"))
