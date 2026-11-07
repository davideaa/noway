"""XAU NEWS BIAS — motore quantitativo pre-news su XAUUSD.

Pacchetto organizzato per strati:

    providers/   adattatori verso le fonti esterne (sostituibili)
    research/    RESEARCH MODE: eventi, target, feature, validazione
    live/        LIVE MODE: scheduler, previsioni immutabili, esiti
    quality/     registro fonti e controlli di qualità dei dati
    api/         backend HTTP per la dashboard
"""

__version__ = "0.1.0"
