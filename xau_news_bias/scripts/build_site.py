"""Costruisce docs/replay.html (il sito) da site/news_bias.template.html e dai dati H-X11 + registro live."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

if __name__ == "__main__":
    data = json.loads((ROOT / "research_output" / "phase2" / "hx11" / "site.json").read_text(encoding="utf-8"))
    log = ROOT / "live" / "hx8_live.jsonl"
    data["live"] = [json.loads(x) for x in log.read_text(encoding="utf-8").splitlines() if x.strip()] if log.exists() else []
    data["cal"] = json.loads((ROOT / "live" / "calendar.json").read_text(encoding="utf-8"))["eventi"]
    tp = json.loads((ROOT / "research_output" / "phase2" / "hx16" / "hx19_tp.json").read_text(encoding="utf-8"))
    data["tp"] = {**tp["NFP"], "prezzo": tp["prezzo_oggi"]}
    data["vol"] = json.loads((ROOT / "research_output" / "phase2" / "hx16" / "hx21_range.json").read_text(encoding="utf-8"))
    data["liv"] = json.loads((ROOT / "research_output" / "phase2" / "hx16" / "hx28_livelli.json").read_text(encoding="utf-8"))
    data["liv"]["per_ora"] = json.loads((ROOT / "research_output" / "phase2" / "hx16" / "hx28_per_ora.json").read_text(encoding="utf-8"))
    data["reg"] = json.loads((ROOT / "research_output" / "phase2" / "hx16" / "hx22_regime.json").read_text(encoding="utf-8"))
    tpl = (ROOT / "site" / "news_bias.template.html").read_text(encoding="utf-8")
    html = tpl.replace("/*DATA*/null", json.dumps(data, separators=(",", ":"), ensure_ascii=False))
    (ROOT / "docs" / "replay.html").write_text(html, encoding="utf-8")
    print("docs/replay.html", len(html), "byte")
