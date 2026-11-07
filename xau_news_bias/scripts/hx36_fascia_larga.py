"""H-X36 (docs/IPOTESI-HX36-FASCIA-LARGA.md): fascia 10-90 della candela, stesso metodo EW3 (B0 di H-X33), NFP e 12 famiglie."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402

PER = {"2019-22": (2019, 2022), "2023-26": (2023, 2026)}
NB = 24


def fasce(g: pd.DataFrame) -> pd.DataFrame:
    r = g.r1
    e = r.shift(1).ewm(halflife=3, min_periods=6).mean()
    z = np.log(r / e)
    q = lambda p: np.log(e) + z.shift(1).rolling(NB, min_periods=NB).quantile(p)  # noqa: E731
    return pd.DataFrame({"y": g.y, "v": np.log(r), "L10": q(.10), "L25": q(.25), "U75": q(.75), "U90": q(.90)})


def misura(o: pd.DataFrame) -> dict:
    out = {}
    for p, (a, b) in PER.items():
        s = o[o.y.between(a, b)]
        out[p] = {"n": int(len(s)), "larga": round(float(((s.v >= s.L10) & (s.v <= s.U90)).mean()), 3),
                  "sopra_larga": int((s.v > s.U90).sum()), "sotto_larga": int((s.v < s.L10).sum()),
                  "stretta": round(float(((s.v >= s.L25) & (s.v <= s.U75)).mean()), 3)}
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    df = pd.read_parquet(R / "hx23_dataset.parquet")
    df = df[(df.r1 > 0) & df.adr21.notna()].sort_values("t0")
    o = pd.concat([fasce(g.reset_index(drop=True)).assign(fam=f) for f, g in df.groupby("fam")], ignore_index=True)
    o = o[np.isfinite(o[["L10", "U90"]]).all(axis=1)]
    N, A = misura(o[o.fam == "NFP"]), misura(o[o.fam != "NFP"])
    cal = bool(all(.70 <= X[p]["larga"] <= .90 for X in (N, A) for p in PER))
    out = {"nfp": N, "altre": A, "calibrata": cal}
    (R / "hx36_fascia_larga.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps(out, indent=1))
