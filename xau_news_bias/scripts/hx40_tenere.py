"""H-X40 (docs/IPOTESI-HX40-TENERE-OLTRE-LA-M1-NEGLI-ANNI.md): tenere la NFP oltre la M1, anno per anno.
Solo prova: il sito non cambia."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import spearmanr  # noqa: E402

from hx13_vol_exits import trade_until  # noqa: E402
from hx38_stop_contro import s4  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

FISSE = {"U1": 60, "U2": 120, "U3": 180, "U5": 300, "U10": 600, "U15": 900}
TIENI = {"W3": "U3", "W5": "U5", "W10": "U10"}
VICINE = {"U2": ("U1", "U3"), "U3": ("U2", "U5"), "U5": ("U3", "U10"), "U10": ("U5", "U15"), "U15": ("U10", "U30"),
          "W3": ("W5",), "W5": ("W3", "W10"), "W10": ("W5",)}


def righe(site, st37, stima, uscite, minuti):
    duka = DukascopyProvider()
    out = []
    for e in site["ev"]:
        if e["f"] not in ("NFP", "CPI") or not e["rule"] or e["mv"] == 0 or e["y"] < 2014:
            continue
        if e["f"] == "NFP" and e["id"] not in st37:
            continue
        stop = (st37[e["id"]] if e["f"] == "NFP" else 60) / 10
        t0 = pd.Timestamp(e["d"], tz="UTC")
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=minuti))
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        if len(t) < 10:
            continue
        b, a = s4(t, tk.bid.to_numpy(float), tk.ask.to_numpy(float))
        d = 1 if e["rule"] == "LONG" else -1
        r = {"id": e["id"], "f": e["f"], "y": e["y"], "d": e["d"], "stima": stima.get(e["id"])}
        for n, s in uscite.items():
            r[n] = trade_until(t, b, a, d, stop, s)[0]
        for w, u in TIENI.items():
            r[w] = r[u] if r["U1"] > 0 else r["U1"]  # in guadagno alle 14:31: tieni; se no chiudi
        out.append(r)
        print(e["id"], r["U1"], r["U5"], r["W5"], flush=True)
    return pd.DataFrame(out)


def stat(x):
    w, l = x[x > 0], x[x <= 0]
    return {"n": int(len(x)), "r": round(float(x.mean()), 3), "somma": round(float(x.sum()), 1), "vinti": round(float((x > 0).mean()), 3),
            "vinto_medio": round(float(w.mean()), 3) if len(w) else None, "perso_medio": round(float(-l.mean()), 3) if len(l) else None,
            "RR": round(float(w.mean() / -l.mean()), 2) if len(w) and len(l) and l.mean() < 0 else None}


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx11" / "site.json").read_text())
    st37 = {t["id"]: t["res"]["hx37"]["stop_pips"] for t in json.loads((R / "hx16" / "hx38_stop_contro.json").read_text())["trade"]}
    stima = {t["id"]: t["stima"] for t in json.loads((R / "hx16" / "hx37_stop_candela.json").read_text())["trade"]}
    df = righe(site, st37, stima, FISSE, 16)
    h39 = {e["id"]: e["B"] for e in json.loads((R / "hx16" / "hx39_sorpresa.json").read_text())["eventi"]}
    ok = sum(abs(r.U1 - h39[r.id]) < 1e-6 for r in df.itertuples() if r.id in h39)
    print("controllo U1 = B di H-X39:", ok, "su", sum(r.id in h39 for r in df.itertuples()))
    nfp = df[df.f == "NFP"]
    per = {"NFP IS 2014-19": nfp[nfp.y.between(2014, 2019)], "NFP OOS 2020-26": nfp[nfp.y >= 2020],
           "NFP ultimi 3 anni": nfp[nfp.d >= "2023-10-01"], "NFP tutto": nfp, "CPI 2014-26": df[df.f == "CPI"]}
    migliore = max(FISSE, key=lambda u: per["NFP IS 2014-19"][u].mean() + per["NFP OOS 2020-26"][u].mean())
    regole = list(FISSE) + list(TIENI)
    if migliore == "U15":  # bordo della griglia: si aggiunge U30 (pre-registrato)
        print("U15 sul bordo: aggiungo U30")
        d30 = righe(site, st37, stima, {"U30": 1800}, 31).set_index("id")["U30"]
        df["U30"] = df.id.map(d30)
        nfp = df[df.f == "NFP"]
        per = {"NFP IS 2014-19": nfp[nfp.y.between(2014, 2019)], "NFP OOS 2020-26": nfp[nfp.y >= 2020],
               "NFP ultimi 3 anni": nfp[nfp.d >= "2023-10-01"], "NFP tutto": nfp, "CPI 2014-26": df[df.f == "CPI"]}
        regole.append("U30")
    S = {p: {u: stat(g[u]) for u in regole} for p, g in per.items()}

    def batte(u):
        return all(S[p][u]["r"] > S[p]["U1"]["r"] for p in ("NFP IS 2014-19", "NFP OOS 2020-26")) if u in S["NFP tutto"] else False
    funz = {u: bool(batte(u) and any(batte(v) for v in VICINE[u]) and S["CPI 2014-26"][u]["r"] > S["CPI 2014-26"]["U1"]["r"])
            for u in regole if u != "U1" and u in VICINE}
    anni = {int(y): {u: round(float(g[u].mean()), 3) for u in ("U1", "U3", "U5", "U10", "W5")} | {
        "n": int(len(g)), "U5_meglio": int((g.U5 > g.U1 + 1e-9).sum()), "U5_peggio": int((g.U5 < g.U1 - 1e-9).sum()),
        "stima_mediana_pips": float(g.stima.median())} for y, g in nfp.groupby("y")}
    gain = nfp.U5 - nfp.U1
    rho_s, p_s = spearmanr(gain, nfp.stima)
    rho_y, p_y = spearmanr(gain, nfp.y)
    terzi = pd.qcut(nfp.stima, 3, labels=["piccola", "media", "grande"])
    per_terzi = {str(k): {"n": int(len(g)), "stima_pips": [int(nfp.stima[g.index].min()), int(nfp.stima[g.index].max())],
                          "U1": round(float(nfp.U1[g.index].mean()), 3), "U5": round(float(nfp.U5[g.index].mean()), 3),
                          "guadagno_U5": round(float(g.mean()), 3)} for k, g in gain.groupby(terzi, observed=True)}
    g_is, g_oos = float(gain[nfp.y <= 2019].mean()), float(gain[nfp.y >= 2020].mean())
    a1, a2 = g_is > 0 and g_oos <= 0, rho_s < 0 and p_s < 0.05
    idea = "confermata" if a1 and a2 else "segnale debole" if a1 or a2 else "non confermata"
    davide = {"guadagno_U5_IS": round(g_is, 3), "guadagno_U5_OOS": round(g_oos, 3), "spearman_stima": [round(float(rho_s), 3), round(float(p_s), 4)],
              "spearman_anno": [round(float(rho_y), 3), round(float(p_y), 4)], "terzi_candela": per_terzi, "idea_di_davide": idea}
    out = {"riassunto": S, "funziona": funz, "anni": anni, "davide": davide, "controllo_U1": [ok, len(nfp) + len(df[df.f == "CPI"])],
           "eventi": df.to_dict(orient="records")}
    (R / "hx16" / "hx40_tenere.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    for p, v in S.items():
        print(p, {u: v[u]["r"] for u in regole})
    print("funziona", funz)
    for y, v in anni.items():
        print(y, v)
    print("davide", davide)
