"""H-X28 (docs/IPOTESI-HX28-LIVELLI-IN-PREZZO.md): livelli del giorno e della settimana in prezzo."""
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx21_range import bars  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

H2 = pd.Timedelta(hours=2)
CFG = {"D": {"win": 21, "kmax": 23, "tb": 2}, "W": {"win": 4, "kmax": 119, "tb": 12}}
KEYS = {"A": ["tb"], "B": ["tb", "ub"], "C": ["tb", "ub", "pb"]}
MIN_N = 30
PERIODS = {"2019-22": (2019, 2022), "2023-26": (2023, 2026)}


def checkpoints(h1: pd.DataFrame, freq: str) -> pd.DataFrame:
    c = CFG[freq]
    b = bars(h1, freq)
    S = b.r.shift(1).rolling(c["win"]).mean()
    day = (h1.index + H2).normalize().tz_localize(None)
    key = day if freq == "D" else day - pd.to_timedelta(day.dayofweek, unit="D")
    df = h1[["o", "h", "l", "c"]].copy()
    df["key"] = key
    df = df[df.key.isin(b.index)]
    g = df.groupby("key")
    df["H"], df["L"], df["P"] = g.h.cummax(), g.l.cummin(), df.c
    for col, src in (("O", b.o), ("Hf", b.h), ("Lf", b.l), ("S", S)):
        df[col] = df.key.map(src)
    rel = (df.index + H2).tz_localize(None) - df.key
    df["k"] = (rel // pd.Timedelta(hours=1)).clip(0, c["kmax"]).astype(int)
    df["tb"] = df.k // c["tb"]
    sc = df.O / 100 * df.S
    df["u"] = ((df.Hf - df.H) / sc).clip(lower=0)
    df["v"] = ((df.L - df.Lf) / sc).clip(lower=0)
    used = (df.H - df.L) / sc
    pos = np.where(df.H > df.L, (df.P - df.L) / (df.H - df.L).where(df.H > df.L, 1), .5)
    df["ub"] = np.digitize(used, [.5, 1.0])
    df["pb"] = np.digitize(pos, [1 / 3, 2 / 3])
    df["y"] = df.key.dt.year
    return df.dropna(subset=["S"])


def table(tr: pd.DataFrame, keys: list) -> pd.DataFrame:
    g = tr.groupby(keys)
    t = pd.DataFrame({"n": g.size(), "qu": g.u.quantile(.9), "qv": g.v.quantile(.9),
                      "pu": g.u.agg(lambda x: float((x > 0).mean())), "pv": g.v.agg(lambda x: float((x > 0).mean()))})
    gu, gv = tr[tr.u > 0].groupby(keys).u, tr[tr.v > 0].groupby(keys).v
    t["mu"], t["nu"], t["mv"], t["nv"] = gu.median(), gu.size(), gv.median(), gv.size()
    return t.fillna({"nu": 0, "nv": 0})


def apply(te: pd.DataFrame, tr: pd.DataFrame, m: str) -> pd.DataFrame:
    a = table(tr, KEYS["A"]).add_suffix("_a")
    t = table(tr, KEYS[m])
    x = te.join(t, on=KEYS[m]).join(a, on="tb")
    small = ~(x.n >= MIN_N)
    for col in ("qu", "qv", "pu", "pv"):
        x[col] = x[col].where(~small, x[col + "_a"])
    x["mu"] = x.mu.where(x.nu >= MIN_N, x.mu_a)
    x["mv"] = x.mv.where(x.nv >= MIN_N, x.mv_a)
    sc = x.O / 100 * x.S
    x["su90"], x["giu90"] = x.H + x.qu * sc, x.L - x.qv * sc
    x["su_tip"], x["giu_tip"] = x.H + x.mu * sc, x.L - x.mv * sc
    return x


def walk(df: pd.DataFrame, m: str) -> pd.DataFrame:
    out = []
    for Y in range(2016, 2027):
        te = df[df.y == Y]
        if len(te):
            out.append(apply(te, df[df.key < pd.Timestamp(f"{Y}-01-01")], m))
    return pd.concat(out)


def quality(x: pd.DataFrame, a: int, b: int, price: float) -> dict:
    s = x[(x.y >= a) & (x.y <= b)]
    eps = 1e-9
    nu, nv = s.u > 0, s.v > 0
    w = (s.su90 - s.giu90) / s.P * 100
    return {"n": int(len(s)),
            "cop90_su": round(float((s.Hf <= s.su90 + eps).mean()), 3), "cop90_giu": round(float((s.Lf >= s.giu90 - eps).mean()), 3),
            "dentro_90": round(float(((s.Hf <= s.su90 + eps) & (s.Lf >= s.giu90 - eps)).mean()), 3),
            "p_su_prevista": round(float(s.pu.mean()), 3), "p_su_vera": round(float(nu.mean()), 3),
            "p_giu_prevista": round(float(s.pv.mean()), 3), "p_giu_vera": round(float(nv.mean()), 3),
            "tipico_su": round(float((s.Hf[nu] <= s.su_tip[nu] + eps).mean()), 3),
            "tipico_giu": round(float((s.Lf[nv] >= s.giu_tip[nv] - eps).mean()), 3),
            "larghezza_pct": round(float(w.median()), 4), "larghezza_pips_oggi": round(float(w.median() / 100 * price * 10), 0)}


def reliable(q: dict) -> bool:
    return all(.87 <= q[c] <= .93 for c in ("cop90_su", "cop90_giu")) and \
        abs(q["p_su_prevista"] - q["p_su_vera"]) < .05 and abs(q["p_giu_prevista"] - q["p_giu_vera"]) < .05 and \
        all(.45 <= q[c] <= .55 for c in ("tipico_su", "tipico_giu"))


def classic(df: pd.DataFrame, a: int, b: int) -> dict:
    s = df[(df.y >= a) & (df.y <= b)]
    sc = s.O / 100 * s.S
    su, giu = s.L + sc, s.H - sc
    return {"massimo_sotto_L+ADR": round(float((s.Hf <= su).mean()), 3), "minimo_sopra_H-ADR": round(float((s.Lf >= giu).mean()), 3),
            "larghezza_pct": round(float(((su - giu) / s.P * 100).median()), 4)}


def run(df: pd.DataFrame, freq: str, price: float) -> dict:
    res = {"metodi": {}, "classico": {p: classic(df, a, b) for p, (a, b) in PERIODS.items()}}
    xs = {}
    for m in KEYS:
        xs[m] = walk(df, m)
        q = {p: quality(xs[m], a, b, price) for p, (a, b) in PERIODS.items()}
        q["affidabile"] = bool(all(reliable(q[p]) for p in PERIODS))
        q["per_anno"] = {int(y): {"cop90_su": round(float((g.Hf <= g.su90 + 1e-9).mean()), 3), "cop90_giu": round(float((g.Lf >= g.giu90 - 1e-9).mean()), 3),
                                  "larghezza_pct": round(float(((g.su90 - g.giu90) / g.P * 100).median()), 4)} for y, g in xs[m].groupby("y")}
        s = xs[m][xs[m].y >= 2023]
        q["larghezza_per_fascia_2023_26"] = {int(t): round(float(((g.su90 - g.giu90) / g.P * 100).median()), 4) for t, g in s.groupby("tb")}
        res["metodi"][m] = q
    ok = [m for m in KEYS if res["metodi"][m]["affidabile"]]
    win = None
    if ok:
        best = min(res["metodi"][m]["2023-26"]["larghezza_pct"] for m in ok)
        win = next(m for m in ok if res["metodi"][m]["2023-26"]["larghezza_pct"] <= best * 1.03)
    res["scelto"] = win
    return res


def fresh(h1: pd.DataFrame) -> pd.DataFrame:
    """Ore complete dopo l'ultima H1 pubblicata, rifatte dai tick bid. Solo per lo stato di adesso, mai nella prova."""
    start, end = h1.index[-1] + pd.Timedelta(hours=1), pd.Timestamp.now(tz="UTC").floor("h")
    if end <= start:
        return h1
    import time
    tk = None
    for wait in (0, 5, 15, 30):
        time.sleep(wait)
        try:
            tk = DukascopyProvider().ticks("XAUUSD", start.to_pydatetime(), end.to_pydatetime())
            break
        except Exception as e:  # il datafeed risponde 503 a volte
            print("tick di oggi non disponibili, riprovo:", e)
    if tk is None or not len(tk):
        return h1
    s = pd.Series(tk.bid.to_numpy(), index=pd.to_datetime(tk.ts_ms, unit="ms", utc=True))
    o = s.resample("1h").ohlc().dropna().rename(columns={"open": "o", "high": "h", "low": "l", "close": "c"})
    return pd.concat([h1[["o", "h", "l", "c"]], o]).sort_index()


def live(h1: pd.DataFrame, df: pd.DataFrame, m: str, freq: str) -> dict:
    c = CFG[freq]
    day = (h1.index + H2).normalize().tz_localize(None)
    key = day if freq == "D" else day - pd.to_timedelta(day.dayofweek, unit="D")
    cur_key = key[-1]
    cur = h1[key == cur_key]
    b = bars(h1, freq)
    S = float(b.r[b.index < cur_key].iloc[-c["win"]:].mean())
    O, H, L, P = float(cur.o.iat[0]), float(cur.h.max()), float(cur.l.min()), float(cur.c.iat[-1])
    k = int(min(c["kmax"], ((cur.index[-1] + H2).tz_localize(None) - cur_key) // pd.Timedelta(hours=1)))
    sc = O / 100 * S
    row = pd.DataFrame([{"O": O, "H": H, "L": L, "P": P, "S": S, "k": k, "tb": k // c["tb"],
                         "ub": int(np.digitize((H - L) / sc, [.5, 1.0])), "pb": int(np.digitize((P - L) / (H - L) if H > L else .5, [1 / 3, 2 / 3]))}])
    tr = df[df.key < cur_key]
    x = apply(row, tr, m).iloc[0]
    fmt = lambda d: [{kk: (None if (isinstance(v, float) and not np.isfinite(v)) else (round(float(v), 4) if isinstance(v, (float, np.floating)) else int(v))) for kk, v in r.items()} for r in d.to_dict("records")]
    return {"metodo": m, "S_pct": round(S, 4), "apertura": O, "massimo": H, "minimo": L, "prezzo": P, "k": k,
            "inizio": str(cur_key.date()), "ultima_candela_utc": str(cur.index[-1]),
            "livelli": {kk: round(float(x[kk]), 2) for kk in ("su90", "giu90", "su_tip", "giu_tip")} | {"p_su": round(float(x.pu), 3), "p_giu": round(float(x.pv), 3)},
            "tabella": fmt(table(tr, KEYS[m]).reset_index()), "tabella_A": fmt(table(tr, KEYS["A"]).reset_index()),
            "min_n": MIN_N, "fascia_ore": c["tb"],
            # solo per il grafico del sito: candele H1 di ieri e di oggi
            "candele": [[str(t), round(float(r.o), 2), round(float(r.h), 2), round(float(r.l), 2), round(float(r.c), 2)]
                        for t, r in h1[key >= sorted(set(key[key < cur_key]))[-1]].iterrows()] if (key < cur_key).any() else []}


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    h1 = DukascopyProvider().h1_range("XAUUSD", date(2012, 1, 1), date.today())
    price = float(h1.c.iat[-1])
    h1_now = fresh(h1)
    price = float(h1_now.c.iat[-1])
    out = {"prezzo_oggi": price, "ultima_candela_utc": str(h1_now.index[-1])}
    for freq, lab in (("D", "giorno"), ("W", "settimana")):
        df = checkpoints(h1, freq)
        out[lab] = run(df[df.key < df.key.max()], freq, price)  # il giorno/la settimana in corso non è finito
        out[lab]["n_controlli"] = int(len(df))
        if out[lab]["scelto"]:
            out[lab]["oggi"] = live(h1_now, df, out[lab]["scelto"], freq)
        print(lab, "scelto", out[lab]["scelto"])
        for m, q in out[lab]["metodi"].items():
            print(" ", m, q["affidabile"], {p: {k: q[p][k] for k in ("cop90_su", "cop90_giu", "dentro_90", "p_su_prevista", "p_su_vera", "tipico_su", "tipico_giu", "larghezza_pips_oggi")} for p in PERIODS})
        print("  classico", out[lab]["classico"])
    (R / "hx28_livelli.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
