"""Scarica in cache tutti i dati di prezzo necessari al POC CPI (una tantum)."""
import logging, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from xnb.logging_setup import setup_logging
from xnb.research.pipeline import build_events, prefetch_market
from xnb.providers.dukascopy import DukascopyProvider

setup_logging()
events = [e for e in build_events("CPI") if e.t0_utc.year >= 2003]
logging.getLogger("xnb").info("eventi CPI: %d", len(events))
prefetch_market(events, DukascopyProvider(), workers=6)
logging.getLogger("xnb").info("prefetch completato")
