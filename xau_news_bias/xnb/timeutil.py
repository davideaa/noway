"""Tempo: tutto è salvato in UTC; New York serve solo per le regole di calendario.

Le release USA sono dichiarate in ora di New York (es. CPI alle 08:30 ET).
La conversione passa sempre da zoneinfo, che conosce l'ora legale storica:
08:30 ET è 13:30 UTC d'inverno e 12:30 UTC d'estate.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

UTC = timezone.utc
NY = ZoneInfo("America/New_York")

# Punti di controllo della previsione, in secondi prima di T0.
CHECKPOINTS: dict[str, int] = {
    "T-3D": 3 * 86400,
    "T-24H": 86400,
    "T-4H": 4 * 3600,
    "T-1H": 3600,
    "T-30M": 1800,
    "T-5M": 300,
}
PRIMARY_CHECKPOINT = "T-1H"


def ny_to_utc(d: date, t: time) -> datetime:
    return datetime.combine(d, t, tzinfo=NY).astimezone(UTC)


def utc_now() -> datetime:
    return datetime.now(UTC)


def to_ms(dt: datetime) -> int:
    return int(dt.timestamp() * 1000)


def from_ms(ms: int) -> datetime:
    return datetime.fromtimestamp(ms / 1000, UTC)


def iso(dt: datetime | None) -> str | None:
    return None if dt is None else dt.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%S.%fZ")[:-4] + "Z"


def parse_iso(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(UTC)


def trading_day_ny(dt: datetime) -> date:
    """Giornata di trading con chiusura alle 17:00 New York (convenzione FX/oro).

    Una barra delle 17:30 ET di lunedì appartiene alla giornata di martedì.
    """
    local = dt.astimezone(NY)
    return (local + timedelta(hours=7)).date()


def xau_market_open(dt: datetime) -> bool:
    """Mercato XAUUSD aperto? Chiuso da ven 17:00 ET a dom 18:00 ET,
    più la pausa giornaliera 17:00-18:00 ET."""
    local = dt.astimezone(NY)
    wd, hm = local.weekday(), local.hour * 60 + local.minute
    if wd == 5:
        return False
    if wd == 4 and hm >= 17 * 60:
        return False
    if wd == 6 and hm < 18 * 60:
        return False
    if 17 * 60 <= hm < 18 * 60:
        return False
    return True
