"""Costruisce docs/replay.html (il sito) da site/news_bias.template.html e dai dati H-X11 + registro live."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

if __name__ == "__main__":
    data = json.loads((ROOT / "research_output" / "phase2" / "hx11" / "site.json").read_text(encoding="utf-8"))
    log = ROOT / "live" / "hx8_live.jsonl"
    data["live"] = [json.loads(x) for x in log.read_text(encoding="utf-8").splitlines() if x.strip()] if log.exists() else []
    data["cal"] = json.loads((ROOT / "live" / "calendar.json").read_text(encoding="utf-8"))["eventi"]
    tpl = (ROOT / "site" / "news_bias.template.html").read_text(encoding="utf-8")
    html = tpl.replace("/*DATA*/null", json.dumps(data, separators=(",", ":"), ensure_ascii=False))
    (ROOT / "docs" / "replay.html").write_text(html, encoding="utf-8")
    print("docs/replay.html", len(html), "byte")
