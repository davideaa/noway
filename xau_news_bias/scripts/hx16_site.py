"""Costruisce docs/retail_ppi.html (sito Retail Sales e PPI, separato dal foglio NFP): solo i dati che la pagina usa."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_site import livelli, load, pips29  # noqa: E402
from xnb.config import get_settings  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent

if __name__ == "__main__":
    import pandas as pd
    R = get_settings().research_dir / "phase2" / "hx16"
    data = load(R / "retail_ppi.json")
    ev = [{"d": e["d"], "y": e["y"], "tipo": e["tipo"], "prezzo": e["prezzo"], "m1_bid": e["m1_bid"], "m1_mov": e["m1_mov"],
           "m1c5": e["m1c"][5] if e.get("m1c") and len(e["m1c"]) > 5 else None} for e in data["ev"]]
    cal = pd.read_parquet(R.parent / "hx15" / "calendario_tutti.parquet")
    nxt = cal[cal.fam.isin(["RETAIL", "PPI"]) & (cal.t0 > pd.Timestamp.now(tz="UTC"))].head(3)
    out = {"ev": ev, "prossime": [{"t0": t.isoformat(), "titoli": x} for t, x in zip(nxt.t0, nxt.titoli)],
           "liv": livelli(), "pips29": pips29("RETAIL_PPI")}
    tpl = (ROOT / "site" / "retail_ppi.template.html").read_text(encoding="utf-8")
    html = tpl.replace("__DATA__", json.dumps(out, separators=(",", ":"), ensure_ascii=False))
    (ROOT / "docs" / "retail_ppi.html").write_text(html, encoding="utf-8")
    print("docs/retail_ppi.html", len(html), "byte")
