"""Log leggibili su console e su file a rotazione (data/logs/xnb.log)."""

from __future__ import annotations

import logging
import logging.handlers

from .config import get_settings

_CONFIGURED = False


def setup_logging(level: int = logging.INFO) -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return
    s = get_settings()
    fmt = logging.Formatter("%(asctime)s %(levelname)-7s %(name)s: %(message)s", "%Y-%m-%d %H:%M:%S")
    root = logging.getLogger()
    root.setLevel(level)
    console = logging.StreamHandler()
    console.setFormatter(fmt)
    root.addHandler(console)
    fileh = logging.handlers.RotatingFileHandler(
        s.logs_dir / "xnb.log", maxBytes=5_000_000, backupCount=5, encoding="utf-8"
    )
    fileh.setFormatter(fmt)
    root.addHandler(fileh)
    for noisy in ("urllib3", "apscheduler", "httpx"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
    _CONFIGURED = True
