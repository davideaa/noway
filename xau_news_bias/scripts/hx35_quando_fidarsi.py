"""H-X35 (docs/IPOTESI-HX35-QUANDO-FIDARSI.md): la fascia della candela è più affidabile quando il segnale di esplosione è spento?"""
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx21_range import bars  # noqa: E402
from hx33_fascia_adattiva import tutte  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
PER = {"2019-22": (2019, 2022), "2023-26": (2023, 2026)}


def segnale(b: pd.DataFrame) -> pd.DataFrame:
    """Per ogni giorno: W1 e W2 con dati fino al giorno prima."""
    r = b.r
    w1 = r.shift(1).rolling(21).mean() >= 1.2 * r.shift(22).rolling(126).mean()
    g = pd.read_csv(ROOT / "data" / "cache" / "cboe" / "GVZCLS.csv")
    gvz = pd.Series(pd.to_numeric(g.GVZCLS, errors="coerce").values, index=pd.to_datetime(g.observation_date)).dropna()
    w2g = gvz >= 1.2 * gvz.shift(1).rolling(252).median()
    # GVZ dell'ultima chiusura prima del giorno della release
    w2 = pd.Series([bool(w2g[w2g.index < d].iat[-1]) if (w2g.index < d).any() else False for d in b.index], index=b.index)
    return pd.DataFrame({"W1": w1, "W2": w2, "on": w1 | w2})


def misura(o: pd.DataFrame) -> dict:
    y, c, L, U = np.log(o.r1), o.B0_c, o.B0_L, o.B0_U
    e, d = (y - c).abs(), (y >= L) & (y <= U)
    out = {}
    for p, (a, z) in PER.items():
        out[p] = {}
        for st, lab in ((True, "acceso"), (False, "spento")):
            s = o.y.between(a, z) & (o.on == st)
            out[p][lab] = {"n": int(s.sum()), "errore": round(float(e[s].median()), 3) if s.any() else None,
                           "copertura": round(float(d[s].mean()), 3) if s.any() else None, "sopra": int((y > U)[s].sum())}
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    df = pd.read_parquet(R / "hx23_dataset.parquet")
    df = df[(df.r1 > 0) & df.adr21.notna()]
    o = tutte(df)
    o = o[np.isfinite(o[["B0_c", "B0_L", "B0_U"]]).all(axis=1)].reset_index(drop=True)
    b = bars(DukascopyProvider().h1_range("XAUUSD", date(2010, 11, 1), date(2026, 10, 16)), "D")
    sg = segnale(b)
    day = (o.t0 + pd.Timedelta(hours=2)).dt.normalize().dt.tz_localize(None)
    o["on"] = day.map(sg.on).fillna(False).astype(bool)
    A, N = misura(o[o.fam != "NFP"]), misura(o[o.fam == "NFP"])
    passa = bool(all(A[p]["acceso"]["errore"] - A[p]["spento"]["errore"] >= .05 and .40 <= A[p]["spento"]["copertura"] <= .60 for p in PER))
    out = {"altre": A, "nfp_descrittivo": N, "passa": passa}
    (R / "hx35_quando_fidarsi.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps(out, indent=1))
