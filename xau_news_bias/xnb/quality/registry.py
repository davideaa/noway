"""Registro delle fonti: metadati statici + stato dinamico dal database.

Ogni voce dice da dove arriva un dato, quanto è fresco, se è point-in-time,
quanto costa, che limiti ha e qual è il fallback. Lo stato
HEALTHY / STALE / FAILED / NOT CONFIGURED viene calcolato dalle ultime
richieste registrate in ``source_status``.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta

from ..config import get_settings
from ..db import session
from ..timeutil import parse_iso, utc_now, xau_market_open


@dataclass
class Source:
    id: str
    name: str
    provider: str
    category: str
    variables: list[str]
    endpoint: str
    frequency: str
    latency: str
    history: str
    live: str
    point_in_time: str
    cost: str
    limits: str
    timezone: str
    fallback: str | None
    used_in: list[str]
    notes: str = ""
    key_env: str | None = None
    stale_after_s: int | None = None  # oltre questa età dall'ultimo successo: STALE
    market_hours_only: bool = False  # lo STALE conta solo a mercato XAU aperto
    critical_for_live: bool = False


SOURCES: list[Source] = [
    Source(
        id="dukascopy", name="Dukascopy historical (tick, M1, H1)", provider="Dukascopy Bank SA",
        category="market", variables=["XAUUSD tick/M1/H1", "EURUSD, USDJPY, GBPUSD, USDCAD, USDSEK, USDCHF H1/M1",
                                            "USA500.IDX, USATECH.IDX M1 (fase 2, dal 2012)"],
        endpoint="https://jetta.dukascopy.com/v1 (JSON) · fallback https://datafeed.dukascopy.com/datafeed (.bi5)",
        frequency="tick", latency="file orario pubblicato dopo la chiusura dell'ora (+ qualche minuto)",
        history="XAUUSD tick dal 2003-05-05; FX dal 2003", live="no (solo storico, ritardo ~1 h)",
        point_in_time="SÌ (prezzi, timestamp UTC al ms)", cost="gratuito",
        limits="nessun limite pubblicato; il datafeed .bi5 risponde 503 sotto carico",
        timezone="UTC", fallback="MT5 del broker (export tick con script MQL5 incluso)",
        used_in=["research", "live: esito post-release e contesto H1"],
        notes=("Termini d'uso Dukascopy: uso personale non commerciale; vietano scraping/bot senza permesso e "
               "la costruzione di database. Il download automatico è in zona grigia: vedi docs/FONTI-DATI.md."),
        stale_after_s=6 * 3600, market_hours_only=True,
    ),
    Source(
        id="swissquote", name="Swissquote public quotes XAU/USD", provider="Swissquote Bank",
        category="market", variables=["XAUUSD bid/ask live"],
        endpoint="https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD",
        frequency="tempo reale (polling)", latency="< 1 s", history="nessuno", live="sì",
        point_in_time="SÌ", cost="gratuito, senza chiave",
        limits="endpoint pubblico non documentato come API: può cambiare senza preavviso",
        timezone="UTC (ms)", fallback="goldapi", used_in=["live"],
        stale_after_s=180, market_hours_only=True, critical_for_live=True,
    ),
    Source(
        id="goldapi", name="gold-api.com spot", provider="gold-api.com", category="market",
        variables=["XAU spot (solo mid)"], endpoint="https://api.gold-api.com/price/XAU",
        frequency="tempo reale", latency="secondi", history="nessuno", live="sì", point_in_time="SÌ",
        cost="gratuito, senza chiave", limits="non documentati", timezone="UTC", fallback=None,
        used_in=["live: fallback e controllo incrociato del prezzo"], stale_after_s=600, market_hours_only=True,
    ),
    Source(
        id="bls", name="BLS — archivio comunicati, calendario iCal, Tabella A CPI, Summary table NFP",
        provider="U.S. Bureau of Labor Statistics",
        category="calendar+macro", variables=["date/ore release CPI, NFP, PPI", "CPI e core CPI m/m e y/y come pubblicati",
                                              "NFP: payrolls, revisioni dei 2 mesi prima, disoccupazione, salari, ore "
                                              "(Summary table A/B dei comunicati Employment Situation, dal 2010)"],
        endpoint="https://www.bls.gov/bls/news-release/cpi.htm · /schedule/news_release/bls.ics · /news.release/archives/",
        frequency="mensile", latency="il comunicato è pubblico alle 08:30 ET", history="comunicati dal 1994 (HTML dal 2008)",
        live="sì (calendario futuro con ora esatta)", point_in_time="SÌ (testo del comunicato del giorno)",
        cost="gratuito", limits="403 senza email di contatto nello User-Agent (XNB_CONTACT_EMAIL)",
        timezone="America/New_York", fallback="fred (release dates) · forexfactory (settimana corrente)",
        used_in=["research", "live"], key_env="XNB_CONTACT_EMAIL", stale_after_s=8 * 86400, critical_for_live=True,
    ),
    Source(
        id="fred", name="FRED / ALFRED (vintage)", provider="Federal Reserve Bank of St. Louis", category="macro+rates",
        variables=["serie macro con vintage", "date di release"], endpoint="https://api.stlouisfed.org/fred",
        frequency="varia", latency="minuti dopo la release", history="decenni, vintage ALFRED",
        live="sì", point_in_time="SÌ con ALFRED (realtime_start/end)", cost="gratuito con chiave",
        limits="~120 richieste/minuto", timezone="America/Chicago (date)", fallback="bls",
        used_in=["estensione: PCE, GDP, payrolls con vintage"], key_env="FRED_API_KEY", stale_after_s=None,
        notes="Non indispensabile per il POC CPI (i comunicati BLS sono già point-in-time).",
    ),
    Source(
        id="treasury", name="U.S. Treasury — curve giornaliere", provider="U.S. Department of the Treasury",
        category="rates", variables=["rendimenti 1M–30Y", "rendimenti reali TIPS 5Y, 10Y"],
        endpoint="https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv",
        frequency="giornaliera", latency="fine giornata", history="nominali dal 1990, reali dal 2003",
        live="sì (giornaliero)", point_in_time="SÌ con regola prudente: dato del giorno D noto da D 18:00 ET",
        cost="gratuito", limits="nessuno rilevante", timezone="America/New_York", fallback="fred (DGS2, DGS10, DFII10)",
        used_in=["research", "live"], stale_after_s=4 * 86400,
    ),
    Source(
        id="nyfed", name="NY Fed — EFFR e fascia obiettivo", provider="Federal Reserve Bank of New York",
        category="rates", variables=["EFFR", "target range Fed"],
        endpoint="https://markets.newyorkfed.org/api/rates/unsecured/effr/search.json",
        frequency="giornaliera", latency="mattina del giorno lavorativo successivo", history="dal 2016-03",
        live="sì", point_in_time="SÌ (regola: D+1 09:00 ET)", cost="gratuito", limits="nessuno rilevante",
        timezone="America/New_York", fallback="fred (DFF)", used_in=["live (regime Fed)"], stale_after_s=5 * 86400,
    ),
    Source(
        id="cboe", name="Cboe — VIX storico", provider="Cboe Global Markets", category="cross-market",
        variables=["VIX chiusura giornaliera"],
        endpoint="https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv",
        frequency="giornaliera", latency="fine giornata", history="dal 1990", live="giornaliero",
        point_in_time="SÌ (regola: D 17:00 ET)", cost="gratuito", limits="nessuno rilevante",
        timezone="America/New_York", fallback="fred (VIXCLS)", used_in=["research", "live"], stale_after_s=4 * 86400,
    ),
    Source(
        id="cftc", name="CFTC — Commitments of Traders (oro)", provider="U.S. CFTC", category="positioning",
        variables=["managed money netto % OI, oro COMEX 088691"],
        endpoint="https://publicreporting.cftc.gov/resource/72hh-3qpy.json",
        frequency="settimanale (dati del martedì)", latency="venerdì 15:30 ET",
        history="disaggregato dal 2006-06", live="settimanale",
        point_in_time="SÌ con regola T+3 giorni 15:30 ET; esclusi i periodi di shutdown", cost="gratuito",
        limits="Socrata, nessuno rilevante", timezone="America/New_York", fallback=None,
        used_in=["research", "live"], stale_after_s=10 * 86400,
    ),
    Source(
        id="clevelandfed_nowcast", name="Cleveland Fed Inflation Nowcasting", provider="Federal Reserve Bank of Cleveland",
        category="consensus", variables=["nowcast CPI, core CPI, PCE, core PCE m/m"],
        endpoint="https://www.clevelandfed.org/-/media/files/webcharts/inflationnowcasting/nowcast_month.json",
        frequency="giornaliera (giorni lavorativi)", latency="in giornata",
        history="dal 2013-07, valori come pubblicati in tempo reale", live="sì",
        point_in_time="SÌ (regola prudente: valore del giorno d noto da d 23:59 ET)", cost="gratuito",
        limits="file JSON per grafici, formato non garantito", timezone="America/New_York", fallback=None,
        used_in=["research (ipotesi H2)", "live"], stale_after_s=4 * 86400,
    ),
    Source(
        id="ff_history_github", name="ForexFactory storico (dataset di terzi)", provider="github.com/janickfarrell/newfac",
        category="consensus", variables=["forecast, previous, actual CPI 2007–2026",
                                         "fase 2: prime stampe e forecast di NFP, disoccupazione, salari, PPI, PCE, "
                                         "vendite al dettaglio, ISM, claims, ADP, JOLTS, UoM, Fed funds (memoria delle sorprese)"],
        endpoint="https://github.com/janickfarrell/newfac/releases/download/calendar-data/forexfactory_calendar.csv",
        frequency="aggiornamenti sporadici", latency="—", history="2007–2026", live="no",
        point_in_time="PARZIALE: forecast mostrato alla release (noto prima di T0, non garantito a T−3D); "
                      "'previous' è quello rivisto, quindi NON usato",
        cost="gratuito", limits="—", timezone="GMT", fallback="nessuno gratuito (vedi docs/FONTI-DATI.md)",
        used_in=["research"],
        notes="Non ufficiale: dati raccolti da ForexFactory. Solo per ricerca personale.",
    ),
    Source(
        id="forexfactory", name="ForexFactory — calendario settimana corrente", provider="Fair Economy / ForexFactory",
        category="calendar+consensus", variables=["titolo, ora, impatto, forecast, previous"],
        endpoint="https://nfs.faireconomy.media/ff_calendar_thisweek.json", frequency="aggiornato più volte al giorno",
        latency="minuti", history="solo settimana corrente", live="sì",
        point_in_time="SÌ se archiviato a ogni lettura (lo fa il motore live)", cost="gratuito",
        limits="richiede poche richieste l'ora (lo scheduler legge ogni 30 min)", timezone="America/New_York (ISO con offset)",
        fallback="bls (solo date/ore, senza consensus)", used_in=["live"], stale_after_s=6 * 3600,
        critical_for_live=True,
    ),
    Source(
        id="news_indices", name="Indici di incertezza dal testo dei giornali (EPU, GPR)",
        provider="Baker-Bloom-Davis (policyuncertainty.com) · Caldara-Iacoviello (matteoiacoviello.com)",
        category="news", variables=["EPU giornaliero USA", "GPR giornaliero, minacce, atti"],
        endpoint="https://www.policyuncertainty.com/media/All_Daily_Policy_Data.csv · "
                 "https://www.matteoiacoviello.com/gpr_files/data_gpr_daily_recent.xls",
        frequency="giornaliera", latency="EPU 1-2 giorni; GPR aggiornato a blocchi, fino a una settimana",
        history="EPU dal 1985, GPR dal 1985", live="giornaliero (in ritardo)",
        point_in_time="PARZIALE: le serie possono essere ricalcolate; regole prudenti EPU D+2, GPR D+8",
        cost="gratuito", limits="file accademici, formato non garantito", timezone="date (USA)", fallback=None,
        used_in=["research (fase 2)"], stale_after_s=None,
        notes="Unica forma di 'news/geopolitica' ricostruibile point-in-time senza etichette a posteriori.",
    ),
]


def source_by_id(sid: str) -> Source | None:
    return next((s for s in SOURCES if s.id == sid), None)


def _configured(s: Source) -> bool:
    if not s.key_env:
        return True
    st = get_settings()
    return bool({"FRED_API_KEY": st.fred_api_key, "XNB_CONTACT_EMAIL": st.contact_email,
                 "BLS_API_KEY": st.bls_api_key, "BEA_API_KEY": st.bea_api_key}.get(s.key_env))


def evaluate(s: Source, row: dict | None, now: datetime | None = None) -> tuple[str, str]:
    now = now or utc_now()
    if not _configured(s):
        return "NOT CONFIGURED", f"manca {s.key_env} nel file .env"
    if not row or not row.get("last_attempt_utc"):
        return "NEVER USED", "nessuna richiesta registrata"
    fails = row.get("consecutive_failures") or 0
    if fails >= 2:
        return "FAILED", f"{fails} errori consecutivi: {row.get('last_error') or ''}"[:300]
    last_ok = parse_iso(row["last_success_utc"]) if row.get("last_success_utc") else None
    if last_ok is None:
        return "FAILED", row.get("last_error") or "mai riuscita"
    if s.stale_after_s:
        age = (now - last_ok).total_seconds()
        closed = s.market_hours_only and not xau_market_open(now)
        if age > s.stale_after_s and not closed:
            return "STALE", f"ultimo aggiornamento {int(age // 60)} min fa (soglia {s.stale_after_s // 60} min)"
    if fails == 1:
        return "HEALTHY", f"ultimo tentativo fallito, precedente riuscito: {row.get('last_error') or ''}"[:300]
    return "HEALTHY", "ok"


def registry_status() -> list[dict]:
    with session() as con:
        rows = {r["source_id"]: dict(r) for r in con.execute("SELECT * FROM source_status")}
    out = []
    for s in SOURCES:
        state, detail = evaluate(s, rows.get(s.id))
        d = asdict(s)
        d.update(state=state, detail=detail, status_row=rows.get(s.id))
        out.append(d)
    return out
