"""H-X39 (docs/IPOTESI-HX39-SORPRESA-NEI-PRIMI-SECONDI.md): uscita decisa dalla sorpresa del dato nei primi secondi.
Solo prova: il sito non cambia."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import C, trade  # noqa: E402
from hx38_stop_contro import s4  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.phase2.memory import load_surprise_table  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

NB = 24
KEY = {"NFP": "nfp", "CPI": "cpi"}


def trade_to(t, b, a, d, stop, exit_ms):
    """Come trade() di hx11_site in modo "full", ma con l'uscita al tempo exit_ms invece che a T0 + 60 s."""
    j = int(np.searchsorted(t, -60_000, side="right") - 1)
    sp0 = a[j] - b[j]
    k = np.nonzero((t > t[j]) & (t < exit_ms))[0]
    side, sp = (b[k] if d > 0 else a[k]), a[k] - b[k]
    fixed = C.bp * (b[j] + a[j]) / 2
    entry = a[j] + C.entry_spreads * sp0 + fixed if d > 0 else b[j] - C.entry_spreads * sp0 - fixed
    fav = d * (side - entry)
    hit = np.nonzero(fav <= -stop)[0]
    h, stopped = (int(hit[0]), True) if len(hit) else (len(k) - 1, False)
    ex = side[h] - d * ((C.stop_spreads if stopped else C.exit_spreads) * sp[h] + fixed)
    return round(float(max(d * (ex - entry) / stop, -1.0)), 3), bool(stopped)


def sorprese():
    t = load_surprise_table()
    out = {}
    for fam, k in KEY.items():
        g = t[t.key == k].dropna(subset=["surprise"]).sort_values("release_utc").reset_index(drop=True)
        g["soglia"] = g.surprise.abs().shift(1).rolling(NB, min_periods=NB).median()
        out[fam] = {str(r.release_utc.date()): (float(r.surprise), float(r.soglia) if r.soglia == r.soglia else None, r.actual, r.forecast) for r in g.itertuples()}
        out[fam + "_oggi"] = float(g.surprise.abs().iloc[-NB:].median())
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx11" / "site.json").read_text())
    st37 = {t["id"]: t["res"]["hx37"]["stop_pips"] for t in json.loads((R / "hx16" / "hx38_stop_contro.json").read_text())["trade"]}
    SO = sorprese()
    duka = DukascopyProvider()
    rows = []
    for e in site["ev"]:
        if e["f"] not in KEY or not e["rule"] or e["mv"] == 0 or e["y"] < 2014:
            continue
        s = SO[e["f"]].get(e["d"][:10])
        if s is None or s[1] is None:
            print("senza sorpresa", e["id"]); continue
        if e["f"] == "NFP" and e["id"] not in st37:
            continue
        stop = (st37[e["id"]] if e["f"] == "NFP" else 60) / 10
        t0 = pd.Timestamp(e["d"], tz="UTC")
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=6))
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        if len(t) < 10:
            continue
        b, a = s4(t, tk.bid.to_numpy(float), tk.ask.to_numpy(float))
        d = 1 if e["rule"] == "LONG" else -1
        sur, soglia = s[0], s[1]
        favore = sur != 0 and np.sign(-sur) == d          # sorpresa positiva = oro giù
        contro = sur != 0 and np.sign(-sur) == -d
        grande = abs(sur) > soglia
        r60, st60 = trade_to(t, b, a, d, stop, 60_000)
        r20, _ = trade_to(t, b, a, d, stop, 20_000)
        r10, _ = trade_to(t, b, a, d, stop, 10_000)
        r300, _ = trade_to(t, b, a, d, stop, 300_000)
        mid = (b + a) / 2
        w = (t >= 0) & (t < 60_000)
        i0 = int(np.searchsorted(t, 0, side="left") - 1)
        rng = float(mid[w].max() - mid[w].min()) * 10 if w.any() else np.nan
        mv1 = float(mid[np.searchsorted(t, 60_000, side="left") - 1] - mid[i0])
        rows.append({"id": e["id"], "f": e["f"], "y": e["y"], "d": e["d"], "sorpresa": sur, "soglia": soglia, "favore": bool(favore),
                     "contro": bool(contro), "grande": bool(grande), "range_pips": round(rng), "mv1": mv1,
                     "B": r60, "R1": r20 if contro else r60, "R1_10s": r10 if contro else r60, "R2": r300 if favore and grande else r60,
                     "R3": r20 if contro else (r300 if favore and grande else r60), "check": trade(t, b, a, d, stop, "full")["r"]})
        print(e["id"], sur, round(soglia), "favore" if favore else "contro" if contro else "zero", "grande" if grande else "", r60, flush=True)
    df = pd.DataFrame(rows)
    print("controllo B = trade():", int((abs(df.B - df.check) < 1e-6).sum()), "su", len(df))
    per = {"NFP IS 2014-19": (df.f == "NFP") & df.y.between(2014, 2019), "NFP OOS 2020-26": (df.f == "NFP") & df.y.between(2020, 2026),
           "NFP ultimi 3 anni": (df.f == "NFP") & (df.d >= "2023-10-01"), "CPI 2014-26": df.f == "CPI"}
    regole = ["B", "R1", "R1_10s", "R2", "R3"]
    S = {p: {r: round(float(df[r][m].mean()), 3) for r in regole} | {"n": int(m.sum()), "contro": int(df.contro[m].sum()),
         "favore_grande": int((df.favore & df.grande)[m].sum())} for p, m in per.items()}
    funz = {r: bool(S["NFP IS 2014-19"][r] > S["NFP IS 2014-19"]["B"] and S["NFP OOS 2020-26"][r] > S["NFP OOS 2020-26"]["B"]
                    and S["CPI 2014-26"][r] > S["CPI 2014-26"]["B"]) for r in ("R1", "R2", "R3")}
    nf = df[df.f == "NFP"]
    nz = nf[nf.sorpresa != 0]
    descr = {"soglia_grande_oggi_posti": round(SO["NFP_oggi"]), "range_mediano_piccola": float(nf[~nf.grande].range_pips.median()),
             "range_mediano_grande": float(nf[nf.grande].range_pips.median()),
             "primo_minuto_nel_verso_della_sorpresa": round(float((np.sign(nz.mv1) == np.sign(-nz.sorpresa)).mean()), 3), "n_nfp": int(len(nf))}
    out = {"riassunto": S, "funziona": funz, "descrittivo": descr, "eventi": rows}
    (R / "hx16" / "hx39_sorpresa.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    for p, v in S.items():
        print(p, v)
    print("funziona", funz)
    print("descrittivo", descr)
