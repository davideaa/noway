"""Configurazione: percorsi e segreti.

I segreti (API key, email di contatto) arrivano SOLO da variabili d'ambiente
o dal file ``.env`` nella cartella del progetto, che è escluso da git.
Nessuna chiave è scritta nel codice.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv() -> None:
    env = PROJECT_DIR / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


_load_dotenv()


@dataclass(frozen=True)
class Settings:
    data_dir: Path
    cache_dir: Path
    db_path: Path
    models_dir: Path
    logs_dir: Path
    research_dir: Path
    contact_email: str | None
    fred_api_key: str | None
    bls_api_key: str | None
    bea_api_key: str | None
    twelvedata_api_key: str | None
    host: str
    port: int

    @property
    def http_user_agent(self) -> str:
        # BLS rifiuta (403) le richieste che non indicano un contatto.
        contact = self.contact_email or "unset@example.invalid"
        return f"xau-news-bias/0.1 (personal research; contact: {contact})"


def get_settings() -> Settings:
    data_dir = Path(os.environ.get("XNB_DATA_DIR", PROJECT_DIR / "data"))
    s = Settings(
        data_dir=data_dir,
        cache_dir=data_dir / "cache",
        db_path=Path(os.environ.get("XNB_DB_PATH", data_dir / "xnb.sqlite")),
        models_dir=data_dir / "models",
        logs_dir=data_dir / "logs",
        research_dir=PROJECT_DIR / "research_output",
        contact_email=os.environ.get("XNB_CONTACT_EMAIL") or None,
        fred_api_key=os.environ.get("FRED_API_KEY") or None,
        bls_api_key=os.environ.get("BLS_API_KEY") or None,
        bea_api_key=os.environ.get("BEA_API_KEY") or None,
        twelvedata_api_key=os.environ.get("TWELVEDATA_API_KEY") or None,
        host=os.environ.get("XNB_HOST", "127.0.0.1"),
        port=int(os.environ.get("XNB_PORT", "8765")),
    )
    for d in (s.data_dir, s.cache_dir, s.models_dir, s.logs_dir, s.research_dir):
        d.mkdir(parents=True, exist_ok=True)
    return s
