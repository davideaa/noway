"""Feed usati SOLO dal motore live.

- Swissquote public quotes: bid/ask XAU/USD in tempo reale, senza chiave.
  Endpoint pubblico non documentato ufficialmente come API: è la fonte
  primaria live perché gratuita e con timestamp, ma ha un fallback.
- gold-api.com: prezzo spot senza chiave (fallback, solo mid).
- ForexFactory (faireconomy.media) JSON della settimana: titolo, ora,
  impatto, forecast e previous. Serve a conoscere il consensus live e,
  archiviandolo a ogni lettura, a costruire uno storico point-in-time
  vero da oggi in avanti.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime

from .. import http
from ..timeutil import UTC, from_ms, parse_iso
from .base import CalendarItem, LiveQuoteProvider, Quote

log = logging.getLogger("xnb.live_feeds")


class SwissquoteQuotes(LiveQuoteProvider):
    source_id = "swissquote"
    URL = "https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/{base}/{quote}"

    def quote(self, symbol: str = "XAUUSD") -> Quote:
        r = http.get(self.URL.format(base=symbol[:3], quote=symbol[3:]), self.source_id, timeout=15, retries=1)
        data = r.json()
        best = None
        for platform in data:
            ts = platform.get("ts")
            for p in platform.get("spreadProfilePrices", []):
                if p.get("spreadProfile") in ("prime", "premium", "standard"):
                    q = Quote(from_ms(int(ts)), float(p["bid"]), float(p["ask"]), self.source_id)
                    if best is None or q.ts_utc > best.ts_utc or (
                        q.ts_utc == best.ts_utc and (q.ask - q.bid) < (best.ask - best.bid)
                    ):
                        best = q
        if best is None:
            raise http.FetchError("swissquote: risposta senza prezzi")
        return best


class GoldApiQuotes(LiveQuoteProvider):
    source_id = "goldapi"
    URL = "https://api.gold-api.com/price/XAU"

    def quote(self, symbol: str = "XAUUSD") -> Quote:
        r = http.get(self.URL, self.source_id, timeout=15, retries=1)
        js = r.json()
        px = float(js["price"])
        return Quote(parse_iso(js["updatedAt"]), px, px, self.source_id)


# Titoli ForexFactory -> famiglie del progetto (solo USD, alto impatto).
FF_FAMILY = [
    (r"^Core CPI m/m$", "CPI"),
    (r"^CPI m/m$", "CPI"),
    (r"^CPI y/y$", "CPI"),
    (r"^Non-Farm Employment Change$", "NFP"),
    (r"^Unemployment Rate$", "NFP"),
    (r"^Average Hourly Earnings m/m$", "NFP"),
    (r"^Core PPI m/m$", "PPI"),
    (r"^PPI m/m$", "PPI"),
    (r"^Core PCE Price Index m/m$", "PCE"),
    (r"^Federal Funds Rate$", "FOMC"),
    (r"^Core Retail Sales m/m$", "RETAIL"),
    (r"^Retail Sales m/m$", "RETAIL"),
    (r"^(Advance|Prelim|Final) GDP q/q$", "GDP"),
    (r"^ISM Manufacturing PMI$", "ISM_M"),
    (r"^ISM Services PMI$", "ISM_S"),
]


def ff_family(title: str) -> str | None:
    for pat, fam in FF_FAMILY:
        if re.search(pat, title):
            return fam
    return None


class ForexFactoryCalendar:
    source_id = "forexfactory"
    URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"

    def this_week(self) -> list[CalendarItem]:
        r = http.get(self.URL, self.source_id, timeout=30, retries=2)
        items = []
        for e in r.json():
            try:
                t = datetime.fromisoformat(e["date"]).astimezone(UTC)
            except (KeyError, ValueError):
                continue
            items.append(CalendarItem(
                title=e.get("title", ""), country=e.get("country", ""), event_time_utc=t,
                impact=e.get("impact", ""), forecast=e.get("forecast") or None,
                previous=e.get("previous") or None, actual=e.get("actual") or None,
                family=ff_family(e.get("title", "")) if e.get("country") == "USD" else None,
                raw=e,
            ))
        return items

    @staticmethod
    def raw_json(item: CalendarItem) -> str:
        return json.dumps(item.raw, sort_keys=True)
