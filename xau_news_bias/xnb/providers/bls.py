"""Bureau of Labor Statistics — fonte primaria per calendario e valori CPI.

Tre usi:
1. **Date storiche** delle release: pagina d'archivio ufficiale
   ``/bls/news-release/{cpi,empsit,ppi}.htm``, un link per ogni comunicato
   (``cpi_MMDDYYYY.htm``). Include anche le date irregolari (es. le
   release spostate dallo shutdown dell'autunno 2025).
2. **Calendario futuro** con data e ORA: il file iCalendar ufficiale
   ``/schedule/news_release/bls.ics``.
3. **Valori point-in-time**: la Tabella A di ogni comunicato archiviato,
   cioè i numeri esattamente come furono pubblicati quel giorno (prima
   stampa, con le revisioni note fino a quel momento). È la definizione
   più pulita di "ciò che il mercato sapeva".

BLS risponde 403 alle richieste senza un contatto nello User-Agent:
impostare ``XNB_CONTACT_EMAIL`` nel file ``.env``.
"""

from __future__ import annotations

import html as htmlmod
import logging
import re
from datetime import date, datetime, time
from pathlib import Path

from .. import http
from ..config import get_settings
from ..timeutil import NY, UTC, ny_to_utc
from .base import EconomicCalendarProvider, EventSpec, MacroProvider

log = logging.getLogger("xnb.bls")

BASE = "https://www.bls.gov"
ARCHIVE_PAGES = {"CPI": "cpi", "NFP": "empsit", "PPI": "ppi"}
ICS_SUMMARY = {
    "CPI": "Consumer Price Index",
    "NFP": "Employment Situation",
    "PPI": "Producer Price Index",
}
RELEASE_TIME = time(8, 30)  # tutte e tre escono alle 08:30 ET
MONTHS = {m: i for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June", "July", "August",
     "September", "October", "November", "December"], start=1)}


class BLSProvider(EconomicCalendarProvider, MacroProvider):
    source_id = "bls"

    def __init__(self, cache_dir: Path | None = None):
        self.cache_dir = (cache_dir or get_settings().cache_dir) / "bls"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------ fetching
    def _fetch(self, path: str, cache_name: str | None, max_age_days: float | None = None) -> str:
        """Scarica una pagina BLS. I comunicati archiviati non cambiano: cache permanente."""
        if cache_name:
            fp = self.cache_dir / cache_name
            if fp.exists():
                age_days = (datetime.now().timestamp() - fp.stat().st_mtime) / 86400
                if max_age_days is None or age_days < max_age_days:
                    return fp.read_text(encoding="utf-8", errors="replace")
        r = http.get(BASE + path, self.source_id, timeout=60)
        text = r.text
        if cache_name and len(text) > 1000:  # mai in cache una risposta vuota o troncata
            (self.cache_dir / cache_name).write_text(text, encoding="utf-8")
        return text

    # ------------------------------------------------------ calendar: past
    def archive_entries(self, family: str, max_age_days: float = 1.0) -> list[dict]:
        page = ARCHIVE_PAGES[family]
        text = self._fetch(f"/bls/news-release/{page}.htm", f"archive_{page}.htm", max_age_days)
        out: dict[date, dict] = {}
        pat = re.compile(
            rf'href="/news\.release/archives/{page}_(\d{{2}})(\d{{2}})(\d{{4}})\.(htm|pdf)"[^>]*>([^<]*)<'
        )
        for mm, dd, yyyy, ext, label in pat.findall(text):
            d = date(int(yyyy), int(mm), int(dd))
            e = out.setdefault(d, {"date": d, "htm": None, "pdf": None, "label": ""})
            e[ext] = f"/news.release/archives/{page}_{mm}{dd}{yyyy}.{ext}"
            if label.strip() and not e["label"]:
                e["label"] = htmlmod.unescape(label.strip())
        return [out[d] for d in sorted(out)]

    @staticmethod
    def _ref_period(label: str) -> str | None:
        m = re.search(r"(January|February|March|April|May|June|July|August|September|October|"
                      r"November|December)\s+(\d{4})", label)
        return f"{m.group(2)}-{MONTHS[m.group(1)]:02d}" if m else None

    def historical_events(self, family: str) -> list[EventSpec]:
        events = []
        for e in self.archive_entries(family):
            t0 = ny_to_utc(e["date"], RELEASE_TIME)
            events.append(
                EventSpec(
                    event_id=f"{family}_{e['date'].isoformat()}",
                    family=family,
                    name=ICS_SUMMARY[family],
                    t0_utc=t0,
                    reference_period=self._ref_period(e["label"]),
                    source="bls_archive",
                    source_url=BASE + (e["htm"] or e["pdf"] or ""),
                    status="released",
                )
            )
        return events

    # ---------------------------------------------------- calendar: future
    def schedule(self, max_age_days: float = 1.0) -> list[tuple[str, datetime]]:
        text = self._fetch("/schedule/news_release/bls.ics", "bls.ics", max_age_days)
        items, cur = [], {}
        for line in text.splitlines():
            if line.startswith("BEGIN:VEVENT"):
                cur = {}
            elif line.startswith("DTSTART"):
                cur["dt"] = line
            elif line.startswith("SUMMARY:"):
                cur["summary"] = line[8:].strip()
            elif line.startswith("END:VEVENT") and "dt" in cur and "summary" in cur:
                m = re.search(r"(\d{8})T(\d{6})", cur["dt"])
                if m and "TZID=US-Eastern" in cur["dt"]:
                    local = datetime.strptime(m.group(1) + m.group(2), "%Y%m%d%H%M%S").replace(tzinfo=NY)
                    items.append((cur["summary"], local.astimezone(UTC)))
        return items

    def upcoming_events(self, family: str) -> list[EventSpec]:
        name = ICS_SUMMARY[family]
        out = []
        for summary, t0 in self.schedule():
            if summary == name:
                out.append(EventSpec(f"{family}_{t0.astimezone(NY).date().isoformat()}", family, name, t0,
                                     source="bls_ics", source_url=BASE + "/schedule/news_release/bls.ics"))
        return sorted(out, key=lambda e: e.t0_utc)

    # ------------------------------------------------- point-in-time values
    def release_text(self, event: EventSpec) -> str | None:
        path = event.source_url.replace(BASE, "")
        if not path.endswith(".htm"):
            return None  # prima del 2008 solo PDF: non usati nel POC
        raw = self._fetch(path, path.rsplit("/", 1)[-1])
        txt = re.sub(r"<[^>]+>", " ", raw)
        txt = htmlmod.unescape(txt).replace("\xa0", " ")
        return re.sub(r"\s+", " ", txt)

    def release_values(self, event: EventSpec) -> dict[str, float]:
        if event.family != "CPI":
            raise NotImplementedError(event.family)
        txt = self.release_text(event)
        return parse_cpi_table_a(txt) if txt else {}


_NUM = r"-?\d*\.\d+|-?\d+|-(?=\s|$)"  # "-" = mese non rilevato (shutdown 2025)


def _row_numbers(block: str, label_regex: str) -> list[float] | None:
    m = re.search(label_regex + r"(?:\s|\.(?!\d))*((?:(?:" + _NUM + r")\s+){5,}(?:" + _NUM + r"))", block)
    if not m:
        return None
    return [float("nan") if x == "-" else float(x) for x in re.findall(_NUM, m.group(1))]


def parse_cpi_table_a(txt: str) -> dict[str, float]:
    """Estrae dalla Tabella A le variazioni come pubblicate quel giorno.

    Restituisce le ultime variazioni mensili destagionalizzate (``*_mom_0`` =
    mese di riferimento, ``*_mom_1`` = mese prima, ...) e la variazione su 12
    mesi non destagionalizzata, per l'indice generale e per il core.
    """
    i = txt.find("Table A.")
    if i < 0:
        return {}
    block = txt[i : i + 6000]
    j = block.find("Table B")
    if j > 0:
        block = block[:j]
    out: dict[str, float] = {}
    rows = {
        "cpi": r"(?i:All items)(?! less)",
        "core": r"(?i:All items less food and energy)",
    }
    # Quanti mesi ci sono nell'intestazione? Contiamo le etichette mese/anno
    # prima della prima riga di dati.
    head = block[: block.find("All items")]
    n_months = len(re.findall(r"\b(Jan|Feb|Mar|Apr|May|June?|July?|Aug|Sept?|Oct|Nov|Dec)[a-z]*\.?\s", head))
    compound = "Compound" in head or "annual rate" in head
    for key, lab in rows.items():
        nums = _row_numbers(block, lab)
        if not nums:
            continue
        yoy = nums[-1]
        n_mom = len(nums) - 1 - (1 if compound else 0)
        if n_months >= 3:
            # intestazione: n mesi MoM + (compound: 1 mese) + (12-mos: 1 mese)
            expected = n_months - 1 - (1 if compound else 0)
            if expected in (6, 7):
                n_mom = expected
        mom = nums[:n_mom]
        if len(mom) < 3:
            continue
        out[f"{key}_yoy"] = yoy
        for k, v in enumerate(reversed(mom)):
            if v == v:  # i mesi non rilevati restano assenti, non zero
                out[f"{key}_mom_{k}"] = v
    return out
