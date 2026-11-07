"""Descrittivo per H-X41 (dopo i risultati, non decide niente): quando scatta il break even (0,5R, senza TP) e cosa
avrebbero fatto quei trade chiusi alle 14:31 o alle 14:35."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx38_stop_contro import s4  # noqa: E402
from hx41_be_tp import fav_fino, primo  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    h = json.loads((R / "hx16" / "hx41_be_tp.json").read_text())
    site = {e["id"]: e for e in json.loads((R / "hx11" / "site.json").read_text())["ev"]}
    duka, rows = DukascopyProvider(), []
    nfp = [ev for ev in h["eventi"] if ev["f"] == "NFP"]
    for ev in nfp:
        e = site[ev["id"]]
        t0 = pd.Timestamp(e["d"], tz="UTC")
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=6))
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        b, a = s4(t, tk.bid.to_numpy(float), tk.ask.to_numpy(float))
        d, stop = (1 if e["rule"] == "LONG" else -1), ev["stop_pips"] / 10
        j = int(np.searchsorted(t, -60_000, side="right") - 1)
        tt = t[np.nonzero((t > t[j]) & (t < 300_000))[0]]
        fav = fav_fino(t, b, a, d, 300_000)[0]
        s_i, be_i = primo(fav <= -stop), primo(fav >= 0.5 * stop)
        if be_i is None or (s_i is not None and s_i < be_i):
            continue
        bs_i = primo(fav <= 0, be_i + 1)
        rows.append({"id": ev["id"], "be_on_s": tt[be_i] / 1000, "be_out_s": tt[bs_i] / 1000 if bs_i is not None else None,
                     "U1": ev["U1"], "U5": ev["U5"]})
    df = pd.DataFrame(rows)
    out = df[df.be_out_s.notna()]
    print("break even attivato:", len(df), "su", len(nfp), "| entro +10 s:", int((df.be_on_s <= 10).sum()))
    print("usciti a break even:", len(out), "| entro +10 s:", int((out.be_out_s <= 10).sum()),
          "| +10..60 s:", int(((out.be_out_s > 10) & (out.be_out_s <= 60)).sum()), "| dopo 60 s:", int((out.be_out_s > 60).sum()))
    print("quei trade chiusi alle 14:31 (U1): media", round(out.U1.mean(), 3), "in guadagno", int((out.U1 > 0).sum()), "su", len(out),
          "| alle 14:35 (U5): media", round(out.U5.mean(), 3), "in guadagno", int((out.U5 > 0).sum()))
