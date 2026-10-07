"""H-X15 (docs/PROTOCOLLO-NEWS-ROSSE.md): eventi rossi, tick e trade A/B. Solo slot prima del 2024 (test finale chiuso).

    python scripts/hx15_build.py            # eventi + tick + trade fino al 2023
"""
import json
import sys
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import quotes  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.phase2.ticktrade import SCENARIOS  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FF = ROOT / "data" / "cache" / "consensus" / "forexfactory_calendar.csv"
CACHE = ROOT / "data" / "p2_cache" / "hx15"
LOCK = pd.Timestamp("2024-01-01", tz="UTC")  # test finale: nessun prezzo da qui in poi in questo script

TITLES = {"FOMC": ["Federal Funds Rate", "FOMC Statement"], "VERBALI": ["FOMC Meeting Minutes"],
          "RETAIL": ["Retail Sales m/m", "Core Retail Sales m/m"], "PPI": ["PPI m/m", "Core PPI m/m"],
          "PIL": ["Advance GDP q/q", "Prelim GDP q/q", "Final GDP q/q"], "ISM_M": ["ISM Manufacturing PMI"],
          "ISM_S": ["ISM Services PMI"], "ADP": ["ADP Non-Farm Employment Change"], "FIDUCIA": ["CB Consumer Confidence"],
          "MICHIGAN": ["Prelim UoM Consumer Sentiment"], "CLAIMS": ["Unemployment Claims"]}
PRIORITY = ["FOMC", "RETAIL", "PPI", "PIL", "ISM_M", "ISM_S", "ADP", "FIDUCIA", "MICHIGAN", "VERBALI", "CLAIMS"]
ET = {"FOMC": {"14:00", "12:30"}, "VERBALI": {"14:00"}, "RETAIL": {"08:30"}, "PPI": {"08:30"}, "PIL": {"08:30"},
      "ISM_M": {"10:00"}, "ISM_S": {"10:00"}, "ADP": {"08:15"}, "FIDUCIA": {"10:00"}, "MICHIGAN": {"10:00", "09:55"},
      "CLAIMS": {"08:30"}}
SKIP = ("Speaks", "Testifies", "Election", "Vote", "Auction", "Hearings", "Bill", "Stress", "Report", "Nomination", "Revision")
BURNED = r"CPI|Non-Farm Employment Change|Unemployment Rate|Average Hourly"
CAP = 4.0  # 40 pips
COSTS = {"b": SCENARIOS["base"], "c": SCENARIOS["conservative"]}
A_EXITS = {"E1": 60, "E5": 300, "E15": 900}
B_EXITS = {"X5": (300, None), "X15": (900, None), "X60": (3600, None), "TP1R": (3600, 1.0), "TP2R": (3600, 2.0)}


def num(x):
    """Valore FF in numero: '0.3%', '245K', '-1.2B' -> float (stessa scala per actual e forecast)."""
    if not isinstance(x, str) or not x.strip():
        return None
    s = x.strip().replace(",", "").replace("<", "").replace(">", "")
    mult = {"%": 1, "K": 1e3, "M": 1e6, "B": 1e9, "T": 1e12}
    m = 1.0
    if s[-1] in mult:
        m, s = mult[s[-1]], s[:-1]
    try:
        return float(s) * m
    except ValueError:
        return None


def ff_table() -> pd.DataFrame:
    df = pd.read_csv(FF)
    u = df[(df.currency == "USD") & (df.impact == "High") & df.time.str.contains(":", na=False)].copy()
    d = pd.to_datetime(u.date, format="%a %b %d %Y")
    hm = u.time.str.split(":", expand=True).astype(int)
    u["t0"] = (d + pd.to_timedelta(hm[0], unit="h") + pd.to_timedelta(hm[1], unit="m")).dt.tz_localize("UTC")
    return u[~u.event.str.contains("|".join(SKIP))]


def slots() -> tuple[pd.DataFrame, dict]:
    """Uno slot per orario: famiglia per priorità, sorpresa orientata per l'oro. Più i CPI/NFP (per A6-A8)."""
    u = ff_table()
    fam_of = {t: f for f, ts in TITLES.items() for t in ts}
    rows, dropped = [], {}
    for t0, g in u.groupby("t0"):
        titles = set(g.event)
        if any(pd.Series(list(titles)).str.contains(BURNED) & ~pd.Series(list(titles)).str.contains("ADP")):
            continue
        fams = [f for f in PRIORITY if any(fam_of.get(x) == f for x in titles)]
        if not fams:
            continue
        fam = fams[0]
        hm = t0.tz_convert("America/New_York").strftime("%H:%M")
        fomc_ok = fam == "FOMC" and ("14:00" <= hm <= "14:25" or "12:25" <= hm <= "12:35")  # emendamento 1
        if hm not in ET[fam] and not fomc_ok:
            dropped[fam] = dropped.get(fam, 0) + 1
            continue
        sur = None
        for title in TITLES[fam]:
            r = g[g.event == title]
            if len(r):
                a, f = num(r.actual.iat[0]), num(r.forecast.iat[0])
                if a is not None and f is not None:
                    sur = float(np.sign(a - f)) * (1 if fam == "CLAIMS" else -1)
                break
        rows.append({"t0": t0, "fam": fam, "titoli": " + ".join(sorted(titles)), "sorpresa": sur})
    return pd.DataFrame(rows).sort_values("t0").reset_index(drop=True), dropped


def cpi_nfp() -> pd.DataFrame:
    """Reazione (prima M1, fase 2) e sorpresa orientata di CPI e NFP."""
    ev = pd.read_parquet(get_settings().research_dir / "phase2" / "p2_events.parquet")
    ev = ev[ev.a_ok.fillna(False).astype(bool) & ev.family.isin(["CPI", "NFP"])][["family", "t0_utc", "a_move"]]
    u = ff_table()
    out = []
    for r in ev.itertuples():
        title = "CPI m/m" if r.family == "CPI" else "Non-Farm Employment Change"
        m = u[(u.event == title) & (u.t0 == r.t0_utc)]
        a, f = (num(m.actual.iat[0]), num(m.forecast.iat[0])) if len(m) else (None, None)
        out.append({"t0": r.t0_utc, "fam": r.family, "mv": float(r.a_move),
                    "sorpresa": None if a is None or f is None else -float(np.sign(a - f))})
    return pd.DataFrame(out).sort_values("t0").reset_index(drop=True)


def fetch(t0: pd.Timestamp) -> Path:
    p = CACHE / f"{t0:%Y%m%d_%H%M}.npz"
    if not p.exists():
        assert t0 < LOCK
        tk = DukascopyProvider().ticks("XAUUSD", (t0 - pd.Timedelta(minutes=62)).to_pydatetime(),
                                       (t0 + pd.Timedelta(minutes=61)).to_pydatetime())
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        np.savez_compressed(p, t=t, bid=tk.bid.to_numpy(float), ask=tk.ask.to_numpy(float))
    return p


def sim(t, b, a, d, te, stop, tx, tp, C):
    """Trade nella direzione d: ingresso all'ultimo tick <= te (ms), stop in $, uscita all'ultimo tick < tx o al TP (in R)."""
    j = int(np.searchsorted(t, te, side="right") - 1)
    sp0 = a[j] - b[j]
    fixed = C.bp * (b[j] + a[j]) / 2
    entry = a[j] + C.entry_spreads * sp0 + fixed if d > 0 else b[j] - C.entry_spreads * sp0 - fixed
    k = np.nonzero((t > t[j]) & (t < tx))[0]
    side, sp = (b[k] if d > 0 else a[k]), a[k] - b[k]
    fav = d * (side - entry)
    hs = np.nonzero(fav <= -stop)[0]
    ht = np.nonzero(fav >= tp * stop)[0] if tp else np.zeros(0, int)
    s_i = int(hs[0]) if len(hs) else len(k)
    t_i = int(ht[0]) if len(ht) else len(k)
    if s_i < len(k) and s_i <= t_i:
        h, cost = s_i, C.stop_spreads
    else:
        h, cost = (t_i if t_i < len(k) else len(k) - 1), C.exit_spreads
    ex = side[h] - d * (cost * sp[h] + fixed)
    return round(float(d * (ex - entry) / stop), 4)


def mid_before(t, mid, ms):
    i = int(np.searchsorted(t, ms, side="left") - 1)
    return float(mid[i]) if i >= 0 else np.nan


def slot_row(p: Path, U: float | None) -> dict:
    z = np.load(p)
    t, bid, ask = z["t"], z["bid"], z["ask"]
    mid = (bid + ask) / 2
    pre = np.nonzero(t < 0)[0]
    n1 = int(((t >= 0) & (t < 60_000)).sum())
    ok = bool(len(pre) and t[pre[-1]] >= -120_000 and n1 >= 5 and len(t) and t.max() > 3_600_000)
    out = {"ok": ok, "n1": n1}
    if not ok:
        return out
    p0 = float(mid[pre[-1]])
    m1 = mid[(t >= 0) & (t < 60_000)]
    out.update({"mv": mid_before(t, mid, 60_000) - p0, "rng1": float(max(m1.max(), p0) - min(m1.min(), p0)),
                "rng5": float(np.ptp(np.r_[p0, mid[(t >= 0) & (t < 300_000)]])),
                "mv15": mid_before(t, mid, 900_000) - p0, "mv60": mid_before(t, mid, 3_600_000) - p0,
                "drift1h": mid_before(t, mid, -60_000) - mid_before(t, mid, -3_660_000),
                "spmax10": float(np.max((ask - bid)[(t >= 0) & (t < 10_000)], initial=-np.inf))})
    if U is None:
        return out
    out["U"] = U
    b, a = quotes(bid, ask, "S1")
    win = (t >= 0) & (t < 60_000)
    for cn, C in COSTS.items():
        for dn, d in (("L", 1), ("S", -1)):
            for en, tx in A_EXITS.items():
                out[f"A_{en}_{dn}_{cn}"] = sim(t, b, a, d, -60_000, 0.6 * U, tx * 1000, None, C)
            j = int(np.searchsorted(t, 60_000, side="right") - 1)
            sp0, fixed = a[j] - b[j], C.bp * (b[j] + a[j]) / 2
            entry = a[j] + C.entry_spreads * sp0 + fixed if d > 0 else b[j] - C.entry_spreads * sp0 - fixed
            sb1 = entry - b[win].min() if d > 0 else a[win].max() - entry  # stop esattamente oltre la candela
            stops = {"SB1": max(sb1, 0.1 * U), "SB2": max(0.5 * out["rng1"], 0.1 * U), "SB3": 0.6 * U}
            for sn, st in stops.items():
                for xn, (tx, tp) in B_EXITS.items():
                    out[f"B_{sn}_{xn}_{dn}_{cn}"] = sim(t, b, a, d, 60_000, st, tx * 1000, tp, C)
    return out


if __name__ == "__main__":
    out_dir = get_settings().research_dir / "phase2" / "hx15"
    out_dir.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    sl, dropped = slots()
    print("slot per famiglia (tutti gli anni, solo etichette):", sl.fam.value_counts().to_dict(), "scartati per ora:", dropped)
    work = sl[(sl.t0 >= pd.Timestamp("2008-01-01", tz="UTC")) & (sl.t0 < LOCK)].copy()
    with ThreadPoolExecutor(8) as ex:
        paths = list(ex.map(fetch, work.t0))
    hist: dict[str, deque] = {}
    rows = []
    for (_, r), p in zip(work.iterrows(), paths):
        q = hist.setdefault(r.fam, deque(maxlen=12))
        U = float(np.median(q)) if len(q) >= 6 else None
        row = {"t0": r.t0, "fam": r.fam, "sorpresa": r.sorpresa, "titoli": r.titoli, **slot_row(p, U)}
        if row["ok"]:
            q.append(row["rng1"])
        rows.append(row)
    df = pd.DataFrame(rows)
    df.to_parquet(out_dir / "slots_2008_2023.parquet")
    sl.to_parquet(out_dir / "calendario_tutti.parquet")
    cpi_nfp().to_parquet(out_dir / "cpi_nfp.parquet")
    json.dump({"scartati_per_ora": dropped, "slot_lavorati": len(df), "validi": int(df.ok.sum()),
               "con_U": int(df.U.notna().sum())}, open(out_dir / "build_info.json", "w"), indent=1)
    print("slot 2008-2023:", len(df), "validi:", int(df.ok.sum()), "con U:", int(df.U.notna().sum()))
