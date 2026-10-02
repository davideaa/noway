"""Interfacce dei provider.

Il motore di ricerca e quello live parlano SOLO con queste interfacce.
Sostituire un fornitore significa scrivere un nuovo adattatore che le
implementa, senza toccare feature, modelli o dashboard.

Regola point-in-time comune a tutti: ogni dato restituito porta con sé
``available_from_utc``, l'istante in cui sarebbe stato effettivamente
disponibile a un osservatore. Le feature usano solo righe con
``available_from_utc <= istante della previsione``.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime

import pandas as pd


@dataclass
class EventSpec:
    event_id: str
    family: str
    name: str
    t0_utc: datetime
    reference_period: str | None = None
    source: str = ""
    source_url: str = ""
    status: str = "scheduled"  # scheduled | released


@dataclass
class Quote:
    ts_utc: datetime
    bid: float
    ask: float
    provider: str

    @property
    def mid(self) -> float:
        return (self.bid + self.ask) / 2


@dataclass
class CalendarItem:
    title: str
    country: str
    event_time_utc: datetime
    impact: str
    forecast: str | None
    previous: str | None
    actual: str | None = None
    family: str | None = None
    raw: dict = field(default_factory=dict)


class MarketDataProvider(ABC):
    source_id: str

    @abstractmethod
    def ticks(self, symbol: str, start: datetime, end: datetime) -> pd.DataFrame:
        """Tick nell'intervallo [start, end): colonne ts_ms, bid, ask (UTC)."""

    @abstractmethod
    def m1(self, symbol: str, day: date) -> pd.DataFrame:
        """Candele M1 (BID) della giornata UTC: indice ts (UTC), colonne o,h,l,c,v."""

    @abstractmethod
    def h1(self, symbol: str, year: int, month: int) -> pd.DataFrame:
        """Candele H1 (BID) del mese UTC."""


class LiveQuoteProvider(ABC):
    source_id: str

    @abstractmethod
    def quote(self, symbol: str) -> Quote: ...


class EconomicCalendarProvider(ABC):
    source_id: str

    @abstractmethod
    def historical_events(self, family: str) -> list[EventSpec]: ...

    @abstractmethod
    def upcoming_events(self, family: str) -> list[EventSpec]: ...


class MacroProvider(ABC):
    """Valori macro pubblicati a una data release (prima stampa, point-in-time)."""

    source_id: str

    @abstractmethod
    def release_values(self, event: EventSpec) -> dict[str, float]: ...


class RatesProvider(ABC):
    source_id: str

    @abstractmethod
    def daily(self, start: date, end: date) -> pd.DataFrame:
        """Indice: data di riferimento; colonne numeriche + available_from_utc."""


class PositioningProvider(ABC):
    source_id: str

    @abstractmethod
    def gold_cot(self, start: date, end: date) -> pd.DataFrame: ...


class ConsensusProvider(ABC):
    """Consensus/forecast noto PRIMA della release.

    Nessuna implementazione storica gratuita affidabile è stata trovata:
    vedi docs/FONTI-DATI.md. L'implementazione live archivia il consensus
    visto ora, per costruire uno storico point-in-time da qui in avanti.
    """

    source_id: str

    @abstractmethod
    def consensus(self, event: EventSpec) -> dict[str, float | None]: ...
