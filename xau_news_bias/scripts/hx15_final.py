"""H-X15 test finale 2024-01 -> 2026-10 (docs/PROTOCOLLO-NEWS-ROSSE.md §8). Si apre UNA volta sola, e solo se ci sono finalisti.

Finalisti = principali P1-P4 promossi + candidati della ricerca promossi in validazione (analisi.json).
"""
import json
import sys
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

import hx15_build as B  # noqa: E402
from hx15_analysis import holm, one_test, pval, signals  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

END = pd.Timestamp("2026-10-07", tz="UTC")


def fetch_final(t0: pd.Timestamp) -> Path:
    p = B.CACHE / f"{t0:%Y%m%d_%H%M}.npz"
    if not p.exists():
        tk = DukascopyProvider().ticks("XAUUSD", (t0 - pd.Timedelta(minutes=62)).to_pydatetime(),
                                       (t0 + pd.Timedelta(minutes=61)).to_pydatetime())
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        np.savez_compressed(p, t=t, bid=tk.bid.to_numpy(float), ask=tk.ask.to_numpy(float))
    return p


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx15"
    an = json.loads((R / "analisi.json").read_text())
    fin = [{"nome": k, **{x: v[x] for x in ("gruppo", "regola", "verso", "config")}} for k, v in an["principali"].items() if v["passa"]]
    fin += [{"nome": k, **dict(zip(("gruppo", "regola", "verso", "config"), k.split("|")))} for k, v in an["validazione"].items() if v["passa"]]
    for f in fin:
        f["verso"] = int(f["verso"])
    if not fin:
        print("nessun finalista: il test finale 2024-26 NON si apre e resta vergine")
        sys.exit(0)
    flag = R / "FINAL_OPENED.json"
    assert not flag.exists(), "il test finale è già stato aperto una volta"
    flag.write_text(json.dumps({"aperto_utc": datetime.now(timezone.utc).isoformat(), "finalisti": fin}, indent=1))
    old = pd.read_parquet(R / "slots_2008_2023.parquet")
    cal = pd.read_parquet(R / "calendario_tutti.parquet")
    new = cal[(cal.t0 >= B.LOCK) & (cal.t0 < END)].reset_index(drop=True)
    with ThreadPoolExecutor(8) as ex:
        paths = list(ex.map(fetch_final, new.t0))
    hist = {f: deque(g[g.ok].sort_values("t0").rng1.tail(12), maxlen=12) for f, g in old.groupby("fam")}
    rows = []
    for (_, r), p in zip(new.iterrows(), paths):
        q = hist.setdefault(r.fam, deque(maxlen=12))
        U = float(np.median(q)) if len(q) >= 6 else None
        row = {"t0": r.t0, "fam": r.fam, "sorpresa": r.sorpresa, "titoli": r.titoli, **B.slot_row(p, U)}
        if row["ok"]:
            q.append(row["rng1"])
        rows.append(row)
    df = pd.concat([old, pd.DataFrame(rows)], ignore_index=True).sort_values("t0").reset_index(drop=True)
    df.to_parquet(R / "slots_2008_2026.parquet")
    cn = pd.read_parquet(R / "cpi_nfp.parquet")
    sig = signals(df, cn, h1_end=date(2026, 10, 7))
    d = df[df.ok & df.U.notna()].merge(sig, on=["t0", "fam"])
    T = d[d.t0 >= B.LOCK].reset_index(drop=True)
    res, ps = {}, {}
    for f in fin:
        Rb = one_test(T, T, f["gruppo"], f["regola"], f["verso"], f["config"])
        Rc = one_test(T, T, f["gruppo"], f["regola"], f["verso"], f["config"], cost="c")
        t, p = pval(Rb)
        res[f["nome"]] = {**f, "n": len(Rb), "R_medio": float(Rb.mean()) if len(Rb) else None, "t": t, "p": p,
                          "R_medio_conservative": float(Rc.mean()) if len(Rc) else None,
                          "vinti": float((Rb > 0).mean()) if len(Rb) else None}
        ps[f["nome"]] = p if p == p else 1.0
    for k, ph in holm(ps).items():
        x = res[k]
        x["p_holm"] = ph
        x["passa"] = bool(x["R_medio"] and x["R_medio"] > 0 and ph < 0.05 and x["R_medio_conservative"] > 0)
    out = {"slot_finali": len(T), "per_famiglia": T.fam.value_counts().to_dict(), "risultati": res,
           "verdetto": "EDGE CONFERMATO SU DATI MAI VISTI" if any(x["passa"] for x in res.values()) else "NO RELIABLE EDGE"}
    (R / "finale.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    print(json.dumps(out, indent=1, default=float))
