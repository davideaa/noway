"""H-X41 (docs/IPOTESI-HX41-BREAK-EVEN-E-TP-AL-MASSIMO-PREVISTO.md): break even a 0,5R e TP al massimo previsto (linea verde),
uscita a tempo se non succede niente. Massimo previsto = EW3 di r1 × mediana di (massimo vero ÷ EW3) sulle 24 release prima."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import C, first_minute_move, trade  # noqa: E402
from hx13_vol_exits import trade_until  # noqa: E402
from hx38_stop_contro import s4  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

NB = 24
TEMPI = [2, 3, 5, 10]
BES = [0.25, 0.5, 1.0, None]
MAIN = (5, 0.5)
VICINI = [(3, 0.5), (10, 0.5), (5, 0.25), (5, 1.0)]


def entrata(t, b, a, d):
    j = int(np.searchsorted(t, -60_000, side="right") - 1)
    sp0 = a[j] - b[j]
    fixed = C.bp * (b[j] + a[j]) / 2
    entry = a[j] + C.entry_spreads * sp0 + fixed if d > 0 else b[j] - C.entry_spreads * sp0 - fixed
    return j, entry, fixed


def fav_fino(t, b, a, d, end_ms):
    """Guadagno sul lato di chiusura (costi d'ingresso compresi) tick per tick dall'ingresso a end_ms, e spread."""
    j, entry, fixed = entrata(t, b, a, d)
    k = np.nonzero((t > t[j]) & (t < end_ms))[0]
    side, sp = (b[k] if d > 0 else a[k]), a[k] - b[k]
    return d * (side - entry), sp, fixed, entry


def primo(mask, da=0):
    i = np.nonzero(mask[da:])[0]
    return int(i[0]) + da if len(i) else None


def gestione(t, b, a, d, stop, tgt, be, end_s):
    """Regola D: stop (poi break even), TP alla distanza tgt ($), break even a be × stop, uscita a T0 + end_s. R col tetto -1R."""
    fav, sp, fixed, _ = fav_fino(t, b, a, d, end_s * 1000)
    n = len(fav)
    s_i = primo(fav <= -stop)
    tp_i = primo(fav >= tgt) if tgt is not None else None
    be_i = primo(fav >= be * stop) if be is not None else None
    bs_i = primo(fav <= 0, be_i + 1) if be_i is not None else None  # dal tick dopo l'attivazione
    cand = []
    if s_i is not None and (be_i is None or s_i < be_i):
        cand.append((s_i, "stop"))
    if tp_i is not None:
        cand.append((tp_i, "tp"))
    if bs_i is not None:
        cand.append((bs_i, "be"))
    if cand:
        i, come = min(cand)
    else:
        i, come = n - 1, "tempo"
    slip = C.stop_spreads if come in ("stop", "be") else C.exit_spreads
    r = (fav[i] - (slip * sp[i] + fixed)) / stop
    return round(float(max(r, -1.0)), 3), come


def stime(n):
    """EW3 di r1 e linea verde (mediana di massimo ÷ EW3 sulle 24 release prima), in % del prezzo."""
    n = n.sort_values("t0").reset_index(drop=True)
    ew = n.r1.shift(1).ewm(halflife=3, min_periods=6).mean()
    rat = (n.massimo / ew).shift(1).rolling(NB, min_periods=NB).median()
    n["ew3"], n["verde_pct"] = ew, ew * rat
    return n


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx11" / "site.json").read_text())
    st37 = {t["id"]: t["res"]["hx37"]["stop_pips"] for t in json.loads((R / "hx16" / "hx38_stop_contro.json").read_text())["trade"]}
    arancio = {t["id"]: t["stima"] for t in json.loads((R / "hx16" / "hx37_stop_candela.json").read_text())["trade"]}
    ds = pd.read_parquet(R / "hx16" / "hx23_dataset.parquet")
    ds = ds[ds.fam.isin(["NFP", "CPI"]) & (ds.r1 > 0)][["t0", "fam", "y", "r1"]].copy()
    trade_ev = {(e["f"], e["d"][:10]): e for e in site["ev"]
                if e["f"] in ("NFP", "CPI") and e["rule"] and e["mv"] != 0 and e["y"] >= 2014 and (e["f"] == "CPI" or e["id"] in st37)}
    duka = DukascopyProvider()
    # release uscite dopo la fine del dataset (es. NFP del 2/10/2026): r1 dai tick, come recenti() di H-X32
    extra = []
    for (f, _), e in trade_ev.items():
        t0 = pd.Timestamp(e["d"], tz="UTC")
        if t0 <= ds[ds.fam == f].t0.max():
            continue
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=3))
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        mid = (tk.bid.to_numpy(float) + tk.ask.to_numpy(float)) / 2
        pre, w1 = np.nonzero(t < 0)[0], (t >= 0) & (t < 60_000)
        if len(pre) and w1.sum() >= 5:
            m0 = float(mid[pre[-1]])
            extra.append({"t0": t0, "fam": f, "y": t0.year, "r1": (max(mid[w1].max(), m0) - min(mid[w1].min(), m0)) / m0 * 100})
            print("aggiunta fuori dataset:", f, t0.date())
    ds = pd.concat([ds, pd.DataFrame(extra)], ignore_index=True) if extra else ds
    tk_cache, mx, mx5 = {}, [], []
    for r in ds.itertuples():
        key = (r.fam, str(r.t0.date()))
        ev = trade_ev.get(key)
        t0 = pd.Timestamp(ev["d"], tz="UTC") if ev else r.t0
        dopo = 16 if ev else 1
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=dopo + 0.5))
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        mv = 0
        if len(t) >= 10 and t.min() <= -60_000 and t.max() >= 30_000:
            bid, ask = tk.bid.to_numpy(float), tk.ask.to_numpy(float)
            b, a = s4(t, bid, ask)
            mv = ev["mv"] if ev else first_minute_move(t, bid, ask)
        if mv == 0:  # niente tick sufficienti o primo minuto fermo
            mx.append(np.nan)
            mx5.append(np.nan)
            continue
        dw = 1 if mv > 0 else -1
        f1, _, _, en = fav_fino(t, b, a, dw, 60_000)
        tr = trade(t, b, a, dw, 1e9, "full")
        assert abs(max(f1.max(), 0) - max(tr["mfe"], 0)) < 0.011, key  # controllo: stesso massimo di trade()
        mx.append(max(float(f1.max()), 0.0) / en * 100)
        mx5.append(max(float(fav_fino(t, b, a, dw, 300_000)[0].max()), 0.0) / en * 100 if ev else np.nan)
        if ev:
            tk_cache[key] = (t, b, a, dw)
        print(r.fam, key[1], round(mx[-1], 4), flush=True)
    ds["massimo"], ds["massimo5"] = mx, mx5
    S = pd.concat([stime(ds[ds.fam == f]) for f in ("NFP", "CPI")], ignore_index=True)

    rows = []
    for s in S.itertuples():
        key = (s.fam, str(s.t0.date()))
        if key not in tk_cache or not s.verde_pct == s.verde_pct:
            continue
        e = trade_ev[key]
        t, b, a, dw = tk_cache[key]
        d = 1 if e["rule"] == "LONG" else -1
        stop = (st37[e["id"]] if s.fam == "NFP" else 60) / 10
        _, en, _ = entrata(t, b, a, d)
        verde = s.verde_pct / 100 * en
        ar = arancio.get(e["id"])
        row = {"id": e["id"], "f": s.fam, "y": int(s.y), "d": e["d"], "giusta": bool(dw == d), "stop_pips": round(stop * 10),
               "verde_pips": round(verde * 10, 1), "arancio_pips": ar, "massimo_pips": round(s.massimo / 100 * en * 10, 1),
               "massimo5_pips": round(s.massimo5 / 100 * en * 10, 1),
               "U1": trade_until(t, b, a, d, stop, 60)[0], "U5": trade_until(t, b, a, d, stop, 300)[0]}
        chk = gestione(t, b, a, d, stop, None, None, 60)[0]
        assert abs(chk - row["U1"]) < 1e-6, e["id"]  # controllo: senza TP né break even, a 1 minuto = U1
        for m in TEMPI + [15]:
            for be in BES + [0.1, 1.5]:
                row[f"D{m}_{be}"], row[f"D{m}_{be}_come"] = gestione(t, b, a, d, stop, verde, be, m * 60)
        row["D5_noTP"], _ = gestione(t, b, a, d, stop, None, 0.5, 300)
        row["D5_arancio"] = gestione(t, b, a, d, stop, ar / 10, 0.5, 300)[0] if ar else None
        rows.append(row)
    df = pd.DataFrame(rows)
    nfp, cpi = df[df.f == "NFP"], df[df.f == "CPI"]
    P = {"NFP IS 2014-19": nfp[nfp.y <= 2019], "NFP OOS 2020-26": nfp[nfp.y >= 2020], "NFP ultimi 3 anni": nfp[nfp.d >= "2023-10-01"],
         "NFP tutto": nfp, "CPI 2014-26": cpi}

    def m(g, c):
        return round(float(g[c].mean()), 3)
    griglia = {f"{mm}_{be}": {p: m(g, f"D{mm}_{be}") for p, g in P.items()} for mm in TEMPI for be in BES}
    best = max(griglia, key=lambda k: griglia[k]["NFP IS 2014-19"] + griglia[k]["NFP OOS 2020-26"])
    bm, bb = best.split("_")
    estesa = []
    if bm == "10":
        estesa.append("tempo 15")
    if bb in ("1.0", "0.25"):
        estesa.append("break even " + ("1.5" if bb == "1.0" else "0.1"))
    if estesa:
        for mm in TEMPI + [15]:
            for be in BES + [0.1, 1.5]:
                griglia.setdefault(f"{mm}_{be}", {p: m(g, f"D{mm}_{be}") for p, g in P.items()})

    def batte(c, ref, per=("NFP IS 2014-19", "NFP OOS 2020-26")):
        return all(m(P[p], c) > m(P[p], ref) for p in per)
    main = f"D{MAIN[0]}_{MAIN[1]}"
    vic = {f"{a}_{b}": batte(f"D{a}_{b}", "U1") for a, b in VICINI}
    funz = bool(batte(main, "U1") and all(vic.values()) and m(cpi, main) > m(cpi, "U1"))
    meglio_u5 = batte(main, "U5")

    def dettaglio(g, c):
        x = g[c]
        w, p = x[x > 0], x[x <= 0]
        out = {"r": round(float(x.mean()), 3), "somma": round(float(x.sum()), 1), "vinti": round(float((x > 0).mean()), 3),
               "a_meno_1R": round(float((x <= -0.999).mean()), 3), "perso_medio": round(float(-p.mean()), 3) if len(p) else None,
               "RR": round(float(w.mean() / -p.mean()), 2) if len(w) and len(p) and p.mean() < 0 else None}
        if c + "_come" in g:
            out["come"] = {k: round(float(v), 3) for k, v in g[c + "_come"].value_counts(normalize=True).items()}
        return out
    conf = {p: {c: dettaglio(g.dropna(subset=[c]) if c == "D5_arancio" else g, c)
                for c in ("U1", "U5", main, "D5_None", "D5_noTP", "D5_arancio") if c != "D5_arancio" or p.startswith("NFP")}
            for p, g in P.items()}
    giusta = nfp[nfp.giusta]
    cal = {p: round(float((g.massimo_pips >= g.verde_pips).mean()), 3) for p, g in
           (("2014-19", nfp[nfp.y <= 2019]), ("2020-26", nfp[nfp.y >= 2020]))}
    cal_cpi = {p: round(float((g.massimo_pips >= g.verde_pips).mean()), 3) for p, g in
               (("2014-19", cpi[cpi.y <= 2019]), ("2020-26", cpi[cpi.y >= 2020]))}
    calibrata = bool(all(.40 <= v <= .60 for v in cal.values()))
    anni = {int(y): {"n": int(len(g)), "verde_mediana_pips": float(g.verde_pips.median()), "arancio_mediana_pips": float(g.arancio_pips.median()),
                     "massimo_mediano_pips": float(g.massimo_pips.median()),
                     "tocca_verde_1m": round(float((g.massimo_pips >= g.verde_pips).mean()), 3),
                     "tocca_verde_5m": round(float((g.massimo5_pips >= g.verde_pips).mean()), 3),
                     "tocca_arancio_1m": round(float((g.massimo_pips >= g.arancio_pips).mean()), 3),
                     "tocca_arancio_5m": round(float((g.massimo5_pips >= g.arancio_pips).mean()), 3),
                     "U1": m(g, "U1"), "U5": m(g, "U5"), "D": m(g, main)} for y, g in nfp.groupby("y")}
    tocchi = {"tocca_verde_1m": round(float((nfp.massimo_pips >= nfp.verde_pips).mean()), 3),
              "tocca_arancio_1m": round(float((nfp.massimo_pips >= nfp.arancio_pips).mean()), 3),
              "tocca_verde_5m": round(float((nfp.massimo5_pips >= nfp.verde_pips).mean()), 3),
              "tocca_arancio_5m": round(float((nfp.massimo5_pips >= nfp.arancio_pips).mean()), 3),
              "massimo_su_arancio_mediano": round(float((nfp.massimo_pips / nfp.arancio_pips).median()), 3)}
    # massimo previsto della prossima NFP: EW3 con tutte le NFP note, mediana degli ultimi 24 rapporti
    n_all = S[S.fam == "NFP"].sort_values("t0")
    ew_next = float(n_all.r1.ewm(halflife=3, min_periods=6).mean().iloc[-1])
    rat_next = float((n_all.massimo / n_all.ew3).iloc[-NB:].median())
    h32 = json.loads((R / "hx16" / "hx32_ampiezza_nfp.json").read_text())
    nx = h32.get("prossima") or {}
    prossima = {"ultima_nfp": str(n_all.t0.iloc[-1].date()), "verde_pct": round(ew_next * rat_next, 5)}
    if nx.get("prezzo"):
        prossima |= {"prezzo": nx["prezzo"], "verde_pips": round(ew_next * rat_next / 100 * nx["prezzo"] * 10)}
    out = {"griglia": griglia, "migliore": best, "estesa": estesa, "vicini": vic, "funziona": funz, "meglio_di_U5": meglio_u5,
           "confronto": conf, "calibrazione_verde": cal, "calibrazione_verde_cpi": cal_cpi, "verde_calibrata": calibrata,
           "tocchi_nfp": tocchi, "anni": anni, "prossima": prossima, "eventi": df.to_dict(orient="records")}
    (R / "hx16" / "hx41_be_tp.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    print("griglia (IS, OOS, 3 anni, CPI):")
    for k, v in griglia.items():
        print(" ", k, v["NFP IS 2014-19"], v["NFP OOS 2020-26"], v["NFP ultimi 3 anni"], v["CPI 2014-26"])
    print("migliore", best, "estesa", estesa, "vicini", vic, "funziona", funz, "meglio di U5", meglio_u5)
    for p, v in conf.items():
        print(p, v)
    print("calibrazione verde NFP", cal, "CPI", cal_cpi, "calibrata", calibrata)
    print("tocchi", tocchi)
    for y, v in anni.items():
        print(y, v)
    print("prossima", prossima, "candela prevista hx32", nx.get("stima"))
