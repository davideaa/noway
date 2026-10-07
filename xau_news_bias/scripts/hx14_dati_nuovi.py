"""H-X14 (docs/IPOTESI-HX14-DATI-NUOVI.md): regola H-X8 su XAUUSD 2003-07 ed EURUSD, dati mai usati."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import binom  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.providers.bls import BLSProvider  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

SYMS = ("XAUUSD", "EURUSD")


def first_minute(duka, sym, t0):
    """Movimento della prima M1 sul prezzo medio, o None se l'evento non è valido."""
    tk = duka.ticks(sym, (t0 - pd.Timedelta(minutes=3)).to_pydatetime(), (t0 + pd.Timedelta(minutes=2)).to_pydatetime())
    if tk.empty:
        return None, 0
    t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
    mid = (tk.bid.to_numpy(float) + tk.ask.to_numpy(float)) / 2
    pre = np.nonzero(t < 0)[0]
    n1 = int(((t >= 0) & (t < 60_000)).sum())
    if len(pre) == 0 or t[pre[-1]] < -120_000 or n1 < 5:
        return None, n1
    i1 = int(np.searchsorted(t, 60_000, side="left") - 1)
    return float(mid[i1] - mid[pre[-1]]), n1


def binom_p(k, n):
    return float(binom.sf(k - 1, n, 0.5)) if n else None


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    ev = [e for e in BLSProvider().historical_events("NFP") if e.t0_utc >= pd.Timestamp("2003-01-01", tz="UTC")
          and e.t0_utc < pd.Timestamp("2026-10-03", tz="UTC")]
    duka = DukascopyProvider()
    rows = []
    for e in ev:
        t0 = pd.Timestamp(e.t0_utc)
        r = {"id": e.event_id, "d": str(t0)[:16], "y": t0.year}
        for s in SYMS:
            mv, n1 = first_minute(duka, s, t0)
            r[s] = mv
            r[s + "_n1"] = n1
        rows.append(r)
        print(r["id"], {s: r[s] for s in SYMS}, flush=True)
    df = pd.DataFrame(rows)
    for s in SYMS:  # bias = opposto della NFP valida precedente dello stesso strumento
        prev, bias = None, []
        for mv in df[s]:
            if mv is None or mv != mv:
                bias.append(None)
                continue
            bias.append(None if prev is None or prev == 0 else (-1 if prev > 0 else 1))
            prev = mv
        df[s + "_bias"] = bias
        df[s + "_hit"] = [None if b is None or m == 0 else bool((m > 0) == (b > 0)) for b, m in zip(bias, df[s])]

    def score(s, a, b):
        g = df[(df.y >= a) & (df.y <= b) & df[s + "_hit"].notna()]
        k, n = int(g[s + "_hit"].sum()), len(g)
        return {"strumento": s, "periodo": f"{a}-{b}", "n": n, "indovinate": k, "quota": round(k / n, 3) if n else None,
                "p": round(binom_p(k, n), 4) if n else None}

    tests = {"T1": score("XAUUSD", 2003, 2007), "T2": score("EURUSD", 2003, 2013)}
    ps = sorted(tests.items(), key=lambda x: x[1]["p"])
    for i, (name, t) in enumerate(ps):  # Holm su 2
        t["p_holm"] = round(min(1.0, max(t["p"] * (2 - i), ps[i - 1][1].get("p_holm", 0) if i else 0)), 4)
    desc = [score("EURUSD", 2003, 2007), score("EURUSD", 2008, 2013), score("EURUSD", 2014, 2026),
            score("XAUUSD", 2008, 2013), score("XAUUSD", 2014, 2026)]
    both = df[df.XAUUSD.notna() & df.EURUSD.notna() & (df.XAUUSD != 0) & (df.EURUSD != 0)]
    same = {f"{a}-{b}": round(float(((both.XAUUSD > 0) == (both.EURUSD > 0))[(both.y >= a) & (both.y <= b)].mean()), 3)
            for a, b in ((2003, 2007), (2008, 2013), (2014, 2026))}
    quality = df.groupby("y")[["XAUUSD_n1", "EURUSD_n1"]].median().astype(int).to_dict("index")
    invalid = {s: {int(y): int(v) for y, v in df[df[s].isna()].groupby("y").size().items()} for s in SYMS}
    out = {"test": tests, "descrittivo": desc, "stessa_direzione_oro_euro": same, "tick_primo_minuto_mediana": quality,
           "eventi_non_validi": invalid, "eventi": df.where(df.notna(), None).to_dict("records")}
    (R / "hx11" / "hx14_dati_nuovi.json").write_text(json.dumps(out, indent=1, default=str), encoding="utf-8")
    print(json.dumps({k: v for k, v in out.items() if k != "eventi"}, indent=1))
