"""H-X30 (docs/IPOTESI-HX30-MASSIMO-DI-IERI.md): probabilità di toccare massimo/minimo di ieri entro sera."""
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx21_range import bars  # noqa: E402
from hx28_livelli import fresh  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

H2 = pd.Timedelta(hours=2)
DB = [0, .1, .25, .5, .75, 1.0]
MIN_N = 30
PERIODS = {"2019-22": (2019, 2022), "2023-26": (2023, 2026)}
BINS = np.round(np.arange(0, 1.01, .1), 2)


def checkpoints(h1: pd.DataFrame) -> pd.DataFrame:
    b = bars(h1, "D")
    b["S"] = b.r.shift(1).rolling(21).mean()
    b["pdh"], b["pdl"] = b.h.shift(1), b.l.shift(1)
    day = (h1.index + H2).normalize().tz_localize(None)
    df = h1[["o", "h", "l", "c"]].copy()
    df["key"] = day
    df = df[df.key.isin(b.index)]
    g = df.groupby("key")
    df["H"], df["L"], df["P"] = g.h.cummax(), g.l.cummin(), df.c
    for col, src in (("O", b.o), ("Hf", b.h), ("Lf", b.l), ("S", b.S), ("pdh", b.pdh), ("pdl", b.pdl)):
        df[col] = df.key.map(src)
    df["k"] = (((df.index + H2).tz_localize(None) - df.key) // pd.Timedelta(hours=1)).clip(0, 23).astype(int)
    df["tb"] = df.k // 2
    df["y"] = df.key.dt.year
    return df.dropna(subset=["S", "pdh", "pdl"])


def sides(df: pd.DataFrame) -> dict:
    up = df[df.H < df.pdh].assign(d=lambda x: (x.pdh - x.P) / (x.O / 100 * x.S), hit=lambda x: (x.Hf >= x.pdh).astype(float))
    dn = df[df.L > df.pdl].assign(d=lambda x: (x.P - x.pdl) / (x.O / 100 * x.S), hit=lambda x: (x.Lf <= x.pdl).astype(float))
    for s in (up, dn):
        s["db"] = np.digitize(s.d.clip(lower=0), DB[1:])
    return {"massimo": up, "minimo": dn}


def table(tr: pd.DataFrame):
    t = tr.groupby(["tb", "db"]).hit.agg(["mean", "size"])
    a = tr.groupby("db").hit.agg(["mean", "size"])
    return t, a


def predict(te: pd.DataFrame, tr: pd.DataFrame) -> np.ndarray:
    t, a = table(tr)
    x = te.join(t, on=["tb", "db"]).join(a.add_suffix("_a"), on="db")
    return np.where(x["size"] >= MIN_N, x["mean"], x["mean_a"])


def walk(s: pd.DataFrame) -> pd.DataFrame:
    out = []
    for Y in range(2016, 2027):
        te = s[s.y == Y].copy()
        if len(te):
            te["p"] = predict(te, s[s.key < pd.Timestamp(f"{Y}-01-01")])
            out.append(te)
    return pd.concat(out)


def quality(x: pd.DataFrame) -> dict:
    res = {}
    for p, (a, b) in PERIODS.items():
        s = x[(x.y >= a) & (x.y <= b)]
        cal = []
        for lo, hi in zip(BINS[:-1], BINS[1:]):
            m = (s.p >= lo) & ((s.p < hi) | ((hi == 1.0) & (s.p <= 1.0)))
            if m.sum():
                cal.append({"fascia": f"{int(lo * 100)}-{int(hi * 100)}", "n": int(m.sum()), "prevista": round(float(s.p[m].mean()), 3), "vera": round(float(s.hit[m].mean()), 3)})
        res[p] = {"n": int(len(s)), "prevista": round(float(s.p.mean()), 3), "vera": round(float(s.hit.mean()), 3), "calibrazione": cal,
                  "ok": bool(abs(s.p.mean() - s.hit.mean()) < .03 and all(abs(c["prevista"] - c["vera"]) < .05 for c in cal if c["n"] >= 200))}
    return res


def descr(df: pd.DataFrame) -> dict:
    d = df.groupby("key").agg(Hf=("Hf", "first"), Lf=("Lf", "first"), pdh=("pdh", "first"), pdl=("pdl", "first"), y=("y", "first"))
    out = {}
    for p, (a, b) in PERIODS.items():
        s = d[(d.y >= a) & (d.y <= b)]
        u, l = s.Hf >= s.pdh, s.Lf <= s.pdl
        out[p] = {"giorni": int(len(s)), "tocca_massimo": round(float(u.mean()), 3), "tocca_minimo": round(float(l.mean()), 3),
                  "tutti_e_due": round(float((u & l).mean()), 3), "nessuno": round(float((~u & ~l).mean()), 3)}
    return out


def news_days(x: pd.DataFrame) -> dict:
    R = get_settings().research_dir / "phase2"
    cal = pd.read_parquet(R / "hx15" / "calendario_tutti.parquet")
    cn = pd.read_parquet(R / "hx15" / "cpi_nfp.parquet")
    ev = pd.concat([cal[["t0", "fam"]], cn[["t0", "fam"]]]).drop_duplicates("t0")
    ev = ev[ev.fam.isin(["NFP", "CPI", "RETAIL", "PPI"]) & (ev.t0 >= pd.Timestamp("2016-01-01", tz="UTC"))]
    res = {}
    for g, fams in (("NFP", ["NFP"]), ("CPI", ["CPI"]), ("RETAIL_PPI", ["RETAIL", "PPI"])):
        rows = []
        for t0 in ev[ev.fam.isin(fams)].t0:
            key = (t0 + H2).normalize().tz_localize(None)
            last = t0.floor("h") - pd.Timedelta(hours=1)  # ultima candela H1 chiusa prima della news
            r = x[(x.key == key) & (x.index == last)]
            rows.append(r)
        s = pd.concat(rows) if rows else x.iloc[:0]
        res[g] = {p: {"n": int(((s.y >= a) & (s.y <= b)).sum()), "prevista": round(float(s.p[(s.y >= a) & (s.y <= b)].mean()), 3),
                      "vera": round(float(s.hit[(s.y >= a) & (s.y <= b)].mean()), 3)} for p, (a, b) in PERIODS.items()}
    return res


def curve(tr: pd.DataFrame) -> dict:
    t, a = table(tr)
    return {int(db): {int(tb): (round(float(t.loc[(tb, db), "mean"]), 3) if (tb, db) in t.index and t.loc[(tb, db), "size"] >= MIN_N else round(float(a.loc[db, "mean"]), 3))
                      for tb in range(12)} for db in range(len(DB))}


def now_state(h1_now: pd.DataFrame, df: pd.DataFrame) -> dict:
    b = bars(h1_now, "D")
    day = (h1_now.index + H2).normalize().tz_localize(None)
    cur_key = day[-1]
    cur = h1_now[day == cur_key]
    prev = b[b.index < cur_key]
    O = float(cur.o.iat[0])
    S = float(prev.r.iloc[-21:].mean())
    k = int(min(23, ((cur.index[-1] + H2).tz_localize(None) - cur_key) // pd.Timedelta(hours=1)))
    return {"inizio": str(cur_key.date()), "ultima_candela_utc": str(cur.index[-1]), "k": k, "apertura": O, "S_pct": round(S, 4),
            "massimo": float(cur.h.max()), "minimo": float(cur.l.min()), "prezzo": float(cur.c.iat[-1]),
            "pdh": float(prev.h.iat[-1]), "pdl": float(prev.l.iat[-1]), "ieri": str(prev.index[-1].date())}


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    h1 = DukascopyProvider().h1_range("XAUUSD", date(2012, 1, 1), date.today())
    df = checkpoints(h1)
    cur_key = (h1.index[-1] + H2).normalize().tz_localize(None)
    done = df[df.key < cur_key]  # il giorno in corso non entra
    out = {"fasce_distanza_adr": DB, "min_n": MIN_N, "descrittivo": descr(done)}
    for lab, s in sides(done).items():
        x = walk(s)
        q = quality(x)
        out[lab] = {"qualita": q, "affidabile": bool(all(q[p]["ok"] for p in PERIODS)), "giorni_di_news": news_days(x),
                    "curva_oggi": curve(s)}
        print(lab, "affidabile", out[lab]["affidabile"])
        for p in PERIODS:
            print(" ", p, {k: q[p][k] for k in ("n", "prevista", "vera", "ok")})
            print("   ", [(c["fascia"], c["n"], c["prevista"], c["vera"]) for c in q[p]["calibrazione"]])
        print("  news", out[lab]["giorni_di_news"])
    out["adesso"] = now_state(fresh(h1), df)
    print(out["descrittivo"]); print(out["adesso"])
    (R / "hx30_ieri.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
