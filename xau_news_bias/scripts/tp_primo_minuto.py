"""docs/DESCRITTIVO-TP-PRIMO-MINUTO.md: nel caso vero di Davide (B0 + 10 di sens_stop_spread), quanto va a favore nel
1° minuto e cosa fa un target fisso (in pips riportati a 3.930 $) rispetto a nessun target."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import C, load_ticks  # noqa: E402
from hx38_stop_contro import PER, eventi  # noqa: E402
from sens_stop_spread import prezzi  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

OGGI, TPS = 3930.0, [300, 400, 500, 600, 700, 800]


def trade_tp(t, b, a, d, stop, tp, ingresso=-30_000):
    """Come sens_stop_spread.trade, con un target limite (None = nessuno). Ritorna pips, mfe in $, target toccato."""
    j = int(np.searchsorted(t, ingresso, side="right") - 1)
    sp0 = a[j] - b[j]
    k = np.nonzero((t > t[j]) & (t < 60_000))[0]
    side, sp = (b[k] if d > 0 else a[k]), a[k] - b[k]
    fixed = C.bp * (b[j] + a[j]) / 2
    entry = a[j] + C.entry_spreads * sp0 + fixed if d > 0 else b[j] - C.entry_spreads * sp0 - fixed
    fav = d * (side - entry)
    hs = np.nonzero(fav <= -stop)[0]
    ht = np.nonzero(fav >= tp)[0] if tp is not None else np.array([], int)
    i_s, i_t = (hs[0] if len(hs) else 10**9), (ht[0] if len(ht) else 10**9)
    fine = min(i_s, i_t, len(k) - 1)
    mfe = float(fav[: fine + 1].max())
    if i_t < i_s and i_t < 10**9:
        return tp, mfe, True
    if i_s < 10**9:
        ex = side[i_s] - d * (C.stop_spreads * sp[i_s] + fixed)
        return max(d * (ex - entry), -stop), mfe, False
    ex = side[-1] - d * (C.exit_spreads * sp[-1] + fixed)
    return d * (ex - entry), mfe, False


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    h44 = {t["id"]: t for t in json.loads((R / "hx16" / "hx44_stop_margine.json").read_text())["trade"]}
    duka, rows = DukascopyProvider(), []
    for e in eventi():
        if e["id"] not in h44 or not e["rule"]:
            continue
        t, bid, ask = load_ticks(duka, e["t0"])
        if len(t) < 10:
            continue
        d = 1 if e["rule"] == "LONG" else -1
        stop = h44[e["id"]]["res"]["B37x1.2"]["stop_pips"] / 10 + 1.0
        b, q = prezzi(t, bid, ask, d, 3.0, -20_000, 0, False)
        px = (b[0] + q[0]) / 2
        row = {"id": e["id"], "d": str(e["t0"]), "y": e["y"], "giusta": h44[e["id"]]["giusta"], "px": px}
        for tp in [None] + TPS:
            tp_usd = None if tp is None else tp / 10 * px / OGGI  # target riportato al prezzo di allora
            pnl, mfe, hit = trade_tp(t, b, q, d, stop, tp_usd)
            n = "no" if tp is None else str(tp)
            row[n] = pnl / px * OGGI * 10  # pips riportati a 3.930 $
            row[n + "_hit"] = hit
            if tp is None:
                row["mfe"] = mfe / px * OGGI * 10
        rows.append(row)
    df = pd.DataFrame(rows)
    df.to_csv(R / "hx16" / "tp_primo_minuto.csv", index=False)
    last3 = df.d >= "2023-10-01"
    g = df[df.giusta]
    out = {"n": len(df), "a_favore_nelle_giuste": {p: {"n": int((m & df.giusta).sum()), "mediana": round(float(g.loc[m[df.giusta], "mfe"].median())),
                                                         "1_su_4": round(float(g.loc[m[df.giusta], "mfe"].quantile(.75))),
                                                         "1_su_10": round(float(g.loc[m[df.giusta], "mfe"].quantile(.9))),
                                                         "max": round(float(g.loc[m[df.giusta], "mfe"].max()))}
                                                     for p, m in {"tutto": df.y > 0, "2020-26": df.y >= 2020, "ultimi 3 anni": last3}.items()},
           "pips_medi": {}, "toccano": {}}
    for n in ["no"] + [str(x) for x in TPS]:
        out["pips_medi"][n] = {p: round(float(df.loc[(last3 if ab is None else df.y.between(*ab)), n].mean()), 1) for p, ab in PER.items()}
        if n != "no":
            out["toccano"][n] = {p: int(df.loc[(last3 if ab is None else df.y.between(*ab)), n + "_hit"].sum()) for p, ab in PER.items()}
    batte = {n: all(out["pips_medi"][n][p] > out["pips_medi"]["no"][p] for p in ("IS 2014-19", "OOS 2020-26")) for n in ("500", "600", "700")}
    out["regola_600_conviene"] = bool(all(batte.values()))
    out["batte"] = batte
    (R / "hx16" / "tp_primo_minuto.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(out, indent=1, ensure_ascii=False))
