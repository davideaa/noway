"""Stop fisso 60 pips (H-X12) anche per le NFP dal vivo, con le stesse funzioni e gli stessi prezzi S1 di hx12_atr_stop.py.
Serve al sito per rigiocare le ultime NFP; non cambia nessun risultato di H-X12."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import pandas as pd  # noqa: E402

from hx11_site import MODE, load_ticks, quotes, trade  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx11"
    site = json.loads((R / "site.json").read_text())
    fatti = {r["id"] for r in json.loads((R / "hx12_atr_stop.json").read_text())}
    out_p = R / "hx12_live_60.json"
    out = json.loads(out_p.read_text()) if out_p.exists() else {}
    duka = DukascopyProvider()
    for e in site["ev"]:
        if e["f"] != "NFP" or not e["rule"] or e["mv"] == 0 or e["id"] in fatti or e["id"] in out:
            continue
        t0 = pd.Timestamp(e["d"], tz="UTC")
        t, bid, ask = load_ticks(duka, t0)
        d = 1 if e["rule"] == "LONG" else -1
        tr = trade(t, *quotes(bid, ask, "S1"), d, 6.0, MODE["S1"])
        out[e["id"]] = {"S1": tr["r"], "st": tr["st"], "en": tr["en"], "ex": tr["ex"], "sl": tr["sl"]}
        print(e["id"], out[e["id"]])
    out_p.write_text(json.dumps(out, indent=1), encoding="utf-8")
