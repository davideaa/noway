"""Costruisce docs/retail_ppi.html (sito Retail Sales e PPI, separato dal foglio NFP) da hx16/retail_ppi.json e hx16_analisi.json."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from xnb.config import get_settings  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent

if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    data = json.loads((R / "retail_ppi.json").read_text())
    an = json.loads((R / "hx16_analisi.json").read_text())
    dir_rows = [r for r in an["direzione"] if r["gruppo"] in ("TUTTE",)] + [r for r in an["direzione"] if r["gruppo"] != "TUTTE"]
    out = {"ev": data["ev"], "atr_oggi": data["atr_oggi"], "creato": data["creato"], "n_ricerca": an["n_ricerca"],
           "amp": {"cop": an["ampiezza"]["m1_bid"]["copertura_2020_26"]},
           "dir": [{k: r[k] for k in ("gruppo", "regola", "n", "quota")} for r in dir_rows]}
    import pandas as pd
    cal = pd.read_parquet(R.parent / "hx15" / "calendario_tutti.parquet")
    nxt = cal[cal.fam.isin(["RETAIL", "PPI"]) & (cal.t0 > pd.Timestamp.now(tz="UTC"))].head(3)
    out["prossime"] = [{"t0": t.isoformat(), "titoli": x} for t, x in zip(nxt.t0, nxt.titoli)]
    tp = json.loads((R / "hx19_tp.json").read_text())
    out["tp"] = {**tp["RETAIL_PPI"], "prezzo": tp["prezzo_oggi"]}
    out["vol"] = json.loads((R / "hx21_range.json").read_text(encoding="utf-8"))
    out["liv"] = json.loads((R / "hx28_livelli.json").read_text(encoding="utf-8"))
    out["liv"]["per_ora"] = json.loads((R / "hx28_per_ora.json").read_text(encoding="utf-8"))
    out["reg"] = json.loads((R / "hx22_regime.json").read_text(encoding="utf-8"))
    tpl = (ROOT / "site" / "retail_ppi.template.html").read_text(encoding="utf-8")
    html = tpl.replace("__DATA__", json.dumps(out, separators=(",", ":"), ensure_ascii=False))
    (ROOT / "docs" / "retail_ppi.html").write_text(html, encoding="utf-8")
    print("docs/retail_ppi.html", len(html), "byte")
