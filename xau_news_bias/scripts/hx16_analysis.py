"""H-X16 (docs/IPOTESI-HX16-RETAIL-PPI.md): A) quanto muove la prima M1 dato l'ATR H1; B) direzione dal contesto tecnico."""
import json
import sys
import time
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import binom  # noqa: E402

from hx15_build import CACHE  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

RULES = [f"C{i}" for i in range(1, 10)]
GROUPS = {"TUTTE": ("RETAIL", "PPI", "RETAIL+PPI"), "RETAIL": ("RETAIL", "RETAIL+PPI"), "PPI": ("PPI", "RETAIL+PPI")}
N_PERM, SEED, MIN_N = 1000, 16, 25


def rsi(c: pd.Series, n=14) -> float:
    d = c.diff().dropna().iloc[-200:]
    up, dn = d.clip(lower=0), -d.clip(upper=0)
    au, ad = up.ewm(alpha=1 / n, adjust=False).mean().iat[-1], dn.ewm(alpha=1 / n, adjust=False).mean().iat[-1]
    return 100.0 if ad == 0 else float(100 - 100 / (1 + au / ad))


def bars(m1, rule, cut):
    g = m1.resample(rule, label="left", closed="left")
    b = pd.DataFrame({"o": g.o.first(), "h": g.h.max(), "l": g.l.min(), "c": g.c.last()}).dropna()
    return b[b.index + pd.Timedelta(rule) <= cut]


def context(duka, h1, t0) -> dict:
    cut = t0 - pd.Timedelta(seconds=60)
    m1 = duka.m1_range("XAUUSD", (t0 - timedelta(days=4)).date(), t0.date())
    m1 = m1[m1.index + pd.Timedelta(minutes=1) <= cut]
    m5, m15 = bars(m1, "5min", cut), bars(m1, "15min", cut)
    hh = h1[h1.index + pd.Timedelta(hours=1) <= cut]
    px = float(m1.c.iat[-1])
    s = {}
    for name, b in (("C1", m1), ("C2", m5), ("C3", m15)):
        r = rsi(b.c)
        s[name] = -1 if r > 70 else (1 if r < 30 else 0)
    for name, hrs in (("C4", 24), ("C5", 4)):
        w = m1[m1.index >= cut - pd.Timedelta(hours=hrs)]
        hi, lo = w.h.max(), w.l.min()
        pos = (px - lo) / (hi - lo) if hi > lo else 0.5
        s[name] = -1 if pos >= 0.8 else (1 if pos <= 0.2 else 0)
    s["C6"] = int(np.sign(px - hh.c.iloc[-20:].mean()))
    s["C7"] = int(np.sign(px - m5.c.iloc[-20:].mean()))
    c24 = hh.c.iloc[-25:]
    eff = abs(c24.iat[-1] - c24.iat[0]) / c24.diff().abs().sum()
    last_h = px - float(m1[m1.index >= cut - pd.Timedelta(hours=1)].o.iat[0])
    s["C8"] = int(np.sign(c24.iat[-1] - c24.iat[0])) if eff > 0.3 else -int(np.sign(last_h))
    day_open = m1[m1.index >= cut.normalize()]
    s["C9"] = int(np.sign(px - day_open.o.iat[0])) if len(day_open) else 0
    return s


def excursions(t0) -> tuple[float, float]:
    z = np.load(CACHE / f"{t0:%Y%m%d_%H%M}.npz")
    t, mid = z["t"], (z["bid"] + z["ask"]) / 2
    j = int(np.searchsorted(t, -60_000, side="right") - 1)
    w = mid[(t > t[j]) & (t < 60_000)]
    return float(w.max() - mid[j]) / 0.1, float(mid[j] - w.min()) / 0.1


def fit(x, y):
    X = np.column_stack([np.ones(len(x[0]))] + [np.asarray(v, float) for v in x])
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    return beta


def hits_table(df, perm=None):
    rows = []
    y = df.up.to_numpy() if perm is None else df.up.to_numpy()[perm]
    for g, types in GROUPS.items():
        m = df.tipo.isin(types).to_numpy()
        for r in RULES:
            s = df[r].to_numpy()
            sel = m & (s != 0)
            n = int(sel.sum())
            if n < MIN_N:
                continue
            k = int(((s[sel] > 0) == y[sel]).sum())
            rows.append((g, r, n, k, (k - n / 2) / np.sqrt(n / 4)))
    return pd.DataFrame(rows, columns=["gruppo", "regola", "n", "giuste", "z"])


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    data = json.loads((R / "retail_ppi.json").read_text())
    df = pd.DataFrame(data["ev"])
    df["t0"] = pd.to_datetime(df.d).dt.tz_localize("UTC")
    duka = DukascopyProvider()
    h1 = duka.h1_range("XAUUSD", (df.t0.min() - timedelta(days=10)).date(), df.t0.max().date())
    cpath = R / "contesto_cache.json"
    cache = json.loads(cpath.read_text()) if cpath.exists() else {}
    for t in df.t0:
        if str(t) in cache:
            continue
        for k in range(6):  # il datafeed Dukascopy risponde a volte 503: si riprova
            try:
                cache[str(t)] = context(duka, h1, t)
                break
            except Exception as e:  # noqa: BLE001
                print("riprovo", t, e, flush=True)
                time.sleep(5 * 2 ** k)
        cpath.write_text(json.dumps(cache))
    ctx = [cache[str(t)] for t in df.t0]
    df = pd.concat([df, pd.DataFrame(ctx)], axis=1)
    ex = [excursions(t) for t in df.t0]
    df["su"], df["giu"] = [e[0] for e in ex], [e[1] for e in ex]
    df = df[(df.m1_mov != 0) & df.atr.notna()].reset_index(drop=True)
    df["up"] = df.m1_mov > 0
    D, V = df[df.y <= 2019], df[df.y >= 2020]
    # ----- A: ampiezza
    amp = {}
    for target in ("m1_bid", "m5_mid", "su", "giu"):
        x = [np.log(D.atr), (D.tipo == "RETAIL+PPI").astype(float)]
        yv = np.log(np.maximum(D[target], 1.0))
        beta = fit(x, yv)
        res = yv - (beta[0] + beta[1] * x[0] + beta[2] * x[1])
        q10, q50, q90 = np.quantile(res, [0.1, 0.5, 0.9])

        def pred(atr, both, q, b=beta):
            return float(np.exp(b[0] + b[1] * np.log(atr) + b[2] * both + q))
        pv = np.array([pred(a, t == "RETAIL+PPI", q50) for a, t in zip(V.atr, V.tipo)])
        lo = np.array([pred(a, t == "RETAIL+PPI", q10) for a, t in zip(V.atr, V.tipo)])
        hi = np.array([pred(a, t == "RETAIL+PPI", q90) for a, t in zip(V.atr, V.tipo)])
        yt = V[target].to_numpy()
        amp[target] = {"beta": beta.tolist(), "q": [q10, q50, q90],
                       "copertura_2020_26": float(((yt >= lo) & (yt <= hi)).mean()),
                       "errore_mediano_rel": float(np.median(np.abs(yt - pv) / pv)),
                       "per_anno": {int(yy): {"vero": float(np.median(yt[V.y == yy])), "previsto": float(np.median(pv[V.y == yy]))}
                                    for yy in sorted(V.y.unique())}}
    # ----- B: direzione
    obs = hits_table(D)
    rng = np.random.default_rng(SEED)
    maxz = np.array([hits_table(D, rng.permutation(len(D))).z.abs().max() for _ in range(N_PERM)])
    obs["p_fw"] = [float((maxz >= abs(z)).mean()) for z in obs.z]
    obs["quota"] = obs.giuste / obs.n
    cands = []
    for r in obs.itertuples():
        if r.p_fw >= 0.10:
            continue
        verso = 1 if r.z > 0 else -1
        ok = True
        for a, b in ((2011, 2015), (2016, 2019)):
            h = D[(D.y >= a) & (D.y <= b) & D.tipo.isin(GROUPS[r.gruppo]) & (D[r.regola] != 0)]
            ok &= bool(len(h) and (((verso * h[r.regola] > 0) == h.up).mean() > 0.5))
        cands.append({"gruppo": r.gruppo, "regola": r.regola, "verso": verso, "n": r.n, "quota": r.quota, "p_fw": r.p_fw,
                      "candidato": ok})
    conf = {}
    fin = [c for c in cands if c["candidato"]]
    for i, c in enumerate(sorted(fin, key=lambda c: c["p_fw"])):
        h = V[V.tipo.isin(GROUPS[c["gruppo"]]) & (V[c["regola"]] != 0)]
        k = int(((c["verso"] * h[c["regola"]] > 0) == h.up).sum())
        p = float(binom.sf(k - 1, len(h), 0.5)) if len(h) else 1.0
        conf[f'{c["gruppo"]}|{c["regola"]}|{c["verso"]}'] = {"n": len(h), "giuste": k, "p": p, "p_holm": min(1.0, p * (len(fin) - i))}
    out = {"n_ricerca": len(D), "n_conferma": len(V), "ampiezza": amp, "direzione": obs.sort_values("p_fw").round(4).to_dict("records"),
           "maxz_nullo": {q: float(np.quantile(maxz, q)) for q in (0.5, 0.9, 0.95)}, "candidati": cands, "conferma": conf,
           "eventi": df[["d", "up"] + RULES].assign(up=df.up.astype(int)).to_dict("records")}
    (R / "hx16_analisi.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    pd.set_option("display.width", 200)
    print("ricerca", len(D), "conferma", len(V))
    for k, v in amp.items():
        print(k, "copertura 10-90% nel 2020-26:", round(v["copertura_2020_26"], 2), "errore mediano", round(v["errore_mediano_rel"], 2),
              {y: (round(a["vero"]), round(a["previsto"])) for y, a in v["per_anno"].items()})
    print("z massimo per caso", out["maxz_nullo"])
    print(obs.sort_values("p_fw").head(12).round(3).to_string(index=False))
    print("candidati", cands, "conferma", conf)
