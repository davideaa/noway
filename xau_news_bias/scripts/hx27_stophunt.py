"""H-X27 (docs/IPOTESI-HX27-STOP-HUNT.md): il primo scatto dei primi secondi alla news torna indietro?

Eventi: CPI/NFP (cpi_nfp.parquet) + slot rossi (calendario_tutti.parquet), 2011-01-01 -> ultimo slot passato.
Tick Dukascopy dalla cache hx15 (finestra T0-62 min .. T0+61 min). Spread tagliato a 40 pips (S1).
Scrive research_output/phase2/hx27/hx27_stophunt.json.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import binom  # noqa: E402

from hx11_site import quotes  # noqa: E402
from hx15_build import CACHE  # noqa: E402
from xnb.config import get_settings  # noqa: E402

PIP = 0.1
S100 = 10.0  # 100 pips
SX_MIN = 1.0  # 10 pips
GROUPS = ["NFP", "CPI", "RETAIL_PPI", "ALTRE"]
PERIODS = {"studio_2011_18": (2011, 2018), "conferma_2019_26": (2019, 2026)}
RULES = [f"F{k}_{s}_E{e}" for k in (5, 10) for s in ("S100", "SX") for e in (60, 300)] + ["W_S100_E300", "W_SX_E300"]


def group(fam: str) -> str:
    if fam in ("CPI", "NFP"):
        return fam
    return "RETAIL_PPI" if fam in ("RETAIL", "PPI") else "ALTRE"


def load(t0: pd.Timestamp):
    p = CACHE / f"{t0:%Y%m%d_%H%M}.npz"
    if not p.exists():
        from hx18_inversione import fetch_retry
        p = fetch_retry(t0)
    z = np.load(p)
    return z["t"], z["bid"], z["ask"]


def sim(t, b, a, j, d, stop, end_ms):
    """Ingresso al tick j (ask LONG / bid SHORT), stop in $ sul lato di uscita, uscita all'ultimo tick < end_ms. R >= -1."""
    entry = a[j] if d > 0 else b[j]
    k = np.nonzero((t > t[j]) & (t < end_ms))[0]
    if not len(k):
        fav = np.array([d * ((b[j] if d > 0 else a[j]) - entry)])
    else:
        fav = d * ((b[k] if d > 0 else a[k]) - entry)
    if (fav <= -stop).any():
        return -1.0
    return max(float(fav[-1]) / stop, -1.0)


def sx_stop(t, b, a, j, d):
    """Stop oltre l'estremo dello scatto: SHORT max ask da T0 al tick j, LONG min bid; minimo 10 pips."""
    w = (t >= 0) & (np.arange(len(t)) <= j)
    if not w.any():
        return SX_MIN
    dist = float(a[w].max() - b[j]) if d < 0 else float(a[j] - b[w].min())
    return max(dist, SX_MIN)


def trades(t, b, a, j, d_fade, end_ms):
    """R per fade, segui e caso con S100 e SX."""
    out = {}
    for sn in ("S100", "SX"):
        r = {}
        for d in (1, -1):
            st = S100 if sn == "S100" else sx_stop(t, b, a, j, d)
            r[d] = sim(t, b, a, j, d, st, end_ms)
        out[sn] = {"fade": r[d_fade], "segui": r[-d_fade], "caso": (r[1] + r[-1]) / 2,
                   "caso_win": ((r[1] > 0) + (r[-1] > 0)) / 2}
    return out


def measure(t, bid, ask):
    pre = np.nonzero(t < 0)[0]
    if not len(pre) or t[pre[-1]] < -120_000 or t.max() < 300_000:
        return None
    mid = (bid + ask) / 2
    spreads = {"real": quotes(bid, ask, "S1"), "s40": (mid - 2.0, mid + 2.0)}

    def le(ms):
        return int(np.searchsorted(t, ms, side="right") - 1)

    def lt(ms):
        return int(np.searchsorted(t, ms, side="left") - 1)
    i0 = pre[-1]
    p0 = float(mid[i0])
    i60, i300 = lt(60_000), lt(300_000)
    row = {"p0": p0}
    sp_cap = spreads["real"][1] - spreads["real"][0]
    for k in (5, 10, 60):  # spread (tagliato a 40 pips) all'ingresso, solo descrittivo
        row[f"sp{k}"] = float(sp_cap[le(k * 1000) if k < 60 else i60]) / PIP
    # scatti e "dopo" (descrittivo)
    for k in (3, 5, 10):
        ik = le(k * 1000)
        s = 0 if t[ik] < 0 else int(np.sign(mid[ik] - p0))
        row[f"s{k}"] = s
        row[f"spike{k}"] = abs(float(mid[ik] - p0)) / PIP
        row[f"dopo{k}_60"] = s * float(mid[i60] - mid[ik]) / PIP if s else np.nan
        row[f"dopo{k}_300"] = s * float(mid[i300] - mid[ik]) / PIP if s else np.nan
    # regole F (fade dello scatto)
    for k in (5, 10):
        s = row[f"s{k}"]
        if not s:
            continue
        j = le(k * 1000)
        for sc, (b, a) in spreads.items():
            for e in (60, 300):
                tr = trades(t, b, a, j, -s, e * 1000)
                for sn, v in tr.items():
                    for kk, vv in v.items():
                        row[f"F{k}_{sn}_E{e}|{kk}|{sc}"] = vv
    # sweep
    w15 = (t >= -900_000) & (t < 0)
    H, L = float(mid[w15].max()), float(mid[w15].min())
    f10 = np.nonzero((t >= 0) & (t <= 10_000))[0]
    up = f10[mid[f10] > H]
    dn = f10[mid[f10] < L]
    bd = 0
    if len(up) and (not len(dn) or up[0] <= dn[0]):
        bd = 1
    elif len(dn):
        bd = -1
    row["rottura"] = bd
    row["sweep"] = bool(bd and L <= mid[i60] <= H)
    row["sweep_dopo"] = -bd * float(mid[i300] - mid[i60]) / PIP if row["sweep"] else np.nan
    row["rottura_dopo"] = -bd * float(mid[i300] - mid[i60]) / PIP if bd else np.nan
    if row["sweep"] and t[i60] >= 0:
        for sc, (b, a) in spreads.items():
            tr = trades(t, b, a, i60, -bd, 300_000)
            for sn, v in tr.items():
                for kk, vv in v.items():
                    row[f"W_{sn}_E300|{kk}|{sc}"] = vv
    # riferimento: trade di Davide (T0-30 s, 100 pips), direzione a caso, diviso per scatto a 5 s
    j30 = le(-30_000)
    if t[j30] >= -120_000:
        b, a = spreads["real"]
        for d, dn_ in ((1, "L"), (-1, "S")):
            row[f"D_{dn_}_E60"] = sim(t, b, a, j30, d, S100, 60_000)
            row[f"D_{dn_}_E300"] = sim(t, b, a, j30, d, S100, 300_000)
            row[f"D_{dn_}_E5"] = sim(t, b, a, j30, d, S100, 5_001)
    return row


def pval(w, n):
    return float(binom.sf(w - 1, n, 0.5)) if n else float("nan")


def rule_stats(g: pd.DataFrame, rule: str) -> dict:
    c = f"{rule}|fade|real"
    if c not in g or g[c].notna().sum() == 0:
        return {"n": 0}
    m = g[c].notna()
    r = g.loc[m, c]
    n, w = int(len(r)), int((r > 0).sum())
    sd = float(r.std(ddof=1)) if n > 1 else float("nan")
    out = {"n": n, "vinti": w, "quota": round(w / n, 3), "p": pval(w, n), "R_medio": round(float(r.mean()), 3),
           "t": round(float(r.sum() / (sd * np.sqrt(n))), 2) if sd and sd == sd else None}
    out["caso_R"] = round(float(g.loc[m, f"{rule}|caso|real"].mean()), 3)
    out["caso_quota"] = round(float(g.loc[m, f"{rule}|caso_win|real"].mean()), 3)
    out["segui_R"] = round(float(g.loc[m, f"{rule}|segui|real"].mean()), 3)
    out["segui_quota"] = round(float((g.loc[m, f"{rule}|segui|real"] > 0).mean()), 3)
    out["fade_R_spread40"] = round(float(g.loc[m, f"{rule}|fade|s40"].mean()), 3)
    out["caso_R_spread40"] = round(float(g.loc[m, f"{rule}|caso|s40"].mean()), 3)
    return out


def desc(g: pd.DataFrame) -> dict:
    out = {"release": len(g)}
    for k in (3, 5, 10):
        h = g[g[f"s{k}"] != 0]
        d = {"n_con_scatto": len(h), "scatto_pips_mediana": round(float(h[f"spike{k}"].median()), 1) if len(h) else None}
        for e in (60, 300):
            x = h[f"dopo{k}_{e}"]
            x = x[x != 0]
            inv = int((x < 0).sum())
            d[f"torna_{e}"] = {"n": len(x), "quota": round(inv / len(x), 3) if len(x) else None, "p": pval(inv, len(x)),
                               "p_continua": pval(int((x > 0).sum()), len(x)),
                               "pips_mediana_verso_scatto": round(float(x.median()), 1) if len(x) else None,
                               "pips_media_verso_scatto": round(float(x.mean()), 1) if len(x) else None}
        out[f"scatto_{k}s"] = d
    out["spread_ingresso_pips_mediana"] = {f"T0+{k}s": round(float(g[f"sp{k}"].median()), 1) for k in (5, 10, 60)}
    rot = g[g.rottura != 0]
    sw = g[g.sweep]
    xs = sw.sweep_dopo[sw.sweep_dopo != 0]
    out["sweep"] = {"rotture_10s": len(rot), "quota_rotture": round(len(rot) / len(g), 3) if len(g) else None,
                    "sweep": len(sw), "quota_sweep_su_rotture": round(len(sw) / len(rot), 3) if len(rot) else None,
                    "dopo_sweep_va_contro_rottura": round(float((xs > 0).mean()), 3) if len(xs) else None,
                    "p": pval(int((xs > 0).sum()), len(xs)),
                    "pips_mediana_contro_rottura": round(float(xs.median()), 1) if len(xs) else None}
    # trade di Davide come riferimento
    if "D_L_E60" in g:
        h = g.dropna(subset=["D_L_E60"])
        ref = {"n": len(h)}
        for e in ("E60", "E300"):
            ref[f"caso_R_{e}"] = round(float(((h[f"D_L_{e}"] + h[f"D_S_{e}"]) / 2).mean()), 3)
        # posizioni con lo scatto a 5 s contro: LONG con s5<0, SHORT con s5>0
        con = pd.concat([h.loc[h.s5 < 0, ["D_L_E5", "D_L_E60", "D_L_E300"]].set_axis(["E5", "E60", "E300"], axis=1),
                         h.loc[h.s5 > 0, ["D_S_E5", "D_S_E60", "D_S_E300"]].set_axis(["E5", "E60", "E300"], axis=1)])
        fav = pd.concat([h.loc[h.s5 > 0, ["D_L_E5", "D_L_E60", "D_L_E300"]].set_axis(["E5", "E60", "E300"], axis=1),
                         h.loc[h.s5 < 0, ["D_S_E5", "D_S_E60", "D_S_E300"]].set_axis(["E5", "E60", "E300"], axis=1)])
        for lab, x in (("scatto_contro", con), ("scatto_a_favore", fav)):
            ref[lab] = {"n": len(x), **{f"R_{c}": round(float(x[c].mean()), 3) for c in x},
                        "quota_vinti_E60": round(float((x.E60 > 0).mean()), 3) if len(x) else None}
        out["trade_davide_T0-30s"] = ref
    return out


def holm(ps: dict) -> dict:
    keys = [k for k, v in ps.items() if v == v]
    order = sorted(keys, key=lambda k: ps[k])
    m, run, adj = len(order), 0.0, {}
    for i, k in enumerate(order):
        run = max(run, min(1.0, (m - i) * ps[k]))
        adj[k] = run
    return adj


def verdict(res: dict, holm_adj: dict, key) -> bool:
    c, s = res["conferma_2019_26"], res["studio_2011_18"]
    if not c.get("n") or not s.get("n"):
        return False
    return bool(c["quota"] > 0.5 and holm_adj.get(key, 1.0) < 0.05 and c["R_medio"] > 0
                and s["quota"] > 0.5 and s["R_medio"] > 0)


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    out_dir = R / "hx27"
    out_dir.mkdir(parents=True, exist_ok=True)
    cal = pd.read_parquet(R / "hx15" / "calendario_tutti.parquet")[["t0", "fam"]]
    cn = pd.read_parquet(R / "hx15" / "cpi_nfp.parquet")[["t0", "fam"]]
    ev = pd.concat([cal, cn]).sort_values("t0")
    end = pd.Timestamp.now(tz="UTC") - pd.Timedelta(hours=1)
    ev = ev[(ev.t0 >= pd.Timestamp("2011-01-01", tz="UTC")) & (ev.t0 < end)].reset_index(drop=True)
    assert not ev.t0.duplicated().any()
    rows, scartati = [], []
    for e in ev.itertuples():
        t, bid, ask = load(e.t0)
        m = measure(t, bid, ask) if len(t) else None
        if m is None:
            scartati.append(str(e.t0))
            continue
        rows.append({"t0": e.t0, "fam": e.fam, "g": group(e.fam), "y": e.t0.year, **m})
    df = pd.DataFrame(rows)
    df["per"] = np.where(df.y <= 2018, "studio_2011_18", "conferma_2019_26")
    out = {"eventi": len(ev), "validi": len(df), "scartati": scartati,
           "per_gruppo_periodo": df.groupby(["g", "per"]).size().unstack().to_dict()}
    # descrittivo
    out["descrittivo"] = {p: {"TUTTE": desc(df[df.per == p]), **{g: desc(df[(df.per == p) & (df.g == g)]) for g in GROUPS}}
                          for p in PERIODS}
    out["descrittivo_per_anno_scatto5_torna60"] = {}
    for y, g in df.groupby("y"):
        x = g.dopo5_60.dropna()
        x = x[x != 0]
        out["descrittivo_per_anno_scatto5_torna60"][int(y)] = {"n": len(x), "quota_torna": round(float((x < 0).mean()), 3)}
    # regole
    reg = {}
    for scope in ["TUTTE"] + GROUPS:
        sub = df if scope == "TUTTE" else df[df.g == scope]
        reg[scope] = {rule: {p: rule_stats(sub[sub.per == p], rule) for p in PERIODS} for rule in RULES}
    h_main = holm({r: reg["TUTTE"][r]["conferma_2019_26"].get("p", float("nan")) for r in RULES})
    h_grp = holm({(g, r): reg[g][r]["conferma_2019_26"].get("p", float("nan")) for g in GROUPS for r in RULES})
    for r in RULES:
        reg["TUTTE"][r]["p_holm_conferma"] = h_main.get(r)
        reg["TUTTE"][r]["passa"] = verdict(reg["TUTTE"][r], h_main, r)
        for g in GROUPS:
            reg[g][r]["p_holm_conferma_40"] = h_grp.get((g, r))
            reg[g][r]["passa"] = verdict(reg[g][r], h_grp, (g, r))
    out["regole"] = reg
    out["passa"] = any(reg["TUTTE"][r]["passa"] for r in RULES)
    out["passa_gruppi_secondario"] = {g: [r for r in RULES if reg[g][r]["passa"]] for g in GROUPS}
    (out_dir / "hx27_stophunt.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    df.to_parquet(out_dir / "hx27_eventi.parquet")
    print(json.dumps({"eventi": out["eventi"], "validi": out["validi"], "scartati": len(scartati), "passa": out["passa"],
                      "gruppi": out["passa_gruppi_secondario"]}, indent=1))
