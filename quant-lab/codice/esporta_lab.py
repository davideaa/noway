"""Compute everything the visual lab shows and inject it into app/laboratorio.html.

All numbers are computed here (Python), the page only draws them.
Run:  python3 codice/esporta_lab.py
"""
import csv, itertools, json, sys
from pathlib import Path

import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import coint

sys.path.insert(0, str(Path(__file__).parent))
from strategia_a_pairs import bh
from validazione import deflated_sharpe

ROOT = Path(__file__).resolve().parents[1]
PROC = ROOT / "dati" / "processed"
APP = ROOT / "app"


def pair_years(price):
    lp = np.log(price)
    lr = lp.diff()
    out, years = [], list(range(2019, 2027))
    cols = list(price.columns)
    for y in years:
        w = lp.loc[str(y)]
        ok = [c for c in cols if w[c].notna().sum() >= 0.95 * len(w)]
        rows = []
        for a, b in itertools.combinations(cols, 2):
            rec = dict(y=y, a=a, b=b)
            if a in ok and b in ok:
                ww = w[[a, b]].dropna()
                p_ab = coint(ww[a], ww[b])[1]
                p_ba = coint(ww[b], ww[a])[1]
                beta = np.polyfit(ww[b], ww[a], 1)[0]
                s = ww[a] - beta * ww[b]
                ds, sl = s.diff().dropna().values, (s - s.mean()).shift(1).dropna().values
                lam = np.dot(sl, ds) / np.dot(sl, sl)
                hl = float(-np.log(2) / lam) if lam < 0 else None
                corr = lr.loc[str(y), [a, b]].dropna().corr().iloc[0, 1]
                rec.update(p_ab=round(float(p_ab), 4), p_ba=round(float(p_ba), 4),
                           beta=round(float(beta), 4), hl=None if hl is None else round(hl, 1),
                           corr=round(float(corr), 3))
            rows.append(rec)
        tested = [r for r in rows if "p_ab" in r]
        mask = bh([r["p_ab"] for r in tested]) if tested else []
        for r, m in zip(tested, mask):
            r["bh"] = bool(m)
        out += rows
    return out


def persistence(rows):
    """Of pairs with p<0.05 in year Y, share still p<0.05 in Y+1."""
    by = {(r["y"], r["a"], r["b"]): r for r in rows if "p_ab" in r}
    res = []
    for y in range(2019, 2026):
        hits = [k for k in by if k[0] == y and by[k]["p_ab"] < 0.05]
        tested = [k for k in by if k[0] == y]
        nxt = [k for k in hits if (y + 1, k[1], k[2]) in by and by[(y + 1, k[1], k[2])]["p_ab"] < 0.05]
        res.append(dict(anno=y, testate=len(tested), sotto_005=len(hits),
                        attese_per_caso=round(0.05 * len(tested), 1),
                        bh=sum(by[k].get("bh", False) for k in tested),
                        ancora_anno_dopo=len(nxt)))
    return res


def weekly(s):
    s = s.resample("W").last().dropna()
    return [[d.strftime("%Y-%m-%d"), round(float(v), 5)] for d, v in s.items()]


def read_csv(p):
    with open(p, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main():
    price = pd.read_parquet(PROC / "spot_close.parquet").loc["2018-01-01":"2026-10-31"]
    fund = pd.read_parquet(PROC / "funding_daily.parquet")
    rf = pd.to_numeric(pd.read_csv(ROOT / "dati/raw/fred_DTB3.csv", index_col=0, parse_dates=True).iloc[:, 0],
                       errors="coerce").ffill() / 100 / 365
    rf = rf.reindex(pd.date_range("2019-01-01", "2026-10-31")).ffill()

    rows = pair_years(price)
    prices = {c: [None if np.isnan(v) else round(float(np.log(v)), 5) for v in price[c].values]
              for c in price.columns}

    a = pd.read_parquet(ROOT / "esperimenti/A_main_pnl.parquet").pnl
    b = pd.read_parquet(ROOT / "esperimenti/B_main_pnl.parquet").pnl
    curves = {
        "A": weekly(a.cumsum()),
        "B": weekly(b.reindex(pd.date_range("2019-01-01", "2026-10-31")).fillna(0).cumsum()),
        "TBILL": weekly(rf.cumsum()),
    }
    fm = fund[["BTC", "ETH"]].loc["2020":].resample("ME").sum() * 12 * 100
    funding = [[d.strftime("%Y-%m"), round(float(r.BTC), 2), round(float(r.ETH), 2)] for d, r in fm.iterrows()]

    resA = json.load(open(ROOT / "esperimenti/A_risultati.json"))
    dsr_A = deflated_sharpe(a.loc["2023-01-01":].values, [v["OOS"]["sharpe"] for k, v in resA.items() if k.endswith("cost1")])
    data = dict(
        dsr_A=round(float(dsr_A), 6),
        aggiornato="2026-11-14",
        universo=list(price.columns),
        date0=price.index[0].strftime("%Y-%m-%d"),
        logprezzi=prices,
        coppie=rows,
        persistenza=persistence(rows),
        curve=curves,
        funding=funding,
        risultati_A=json.load(open(ROOT / "esperimenti/A_risultati.json")),
        risultati_B=json.load(open(ROOT / "esperimenti/B_risultati.json")),
        trade_A=read_csv(ROOT / "esperimenti/A_main_trades.csv"),
        letteratura=read_csv(ROOT / "registri/ACADEMIC_RESEARCH_DATABASE.csv"),
        idee=read_csv(ROOT / "registri/RESEARCH_IDEA_REGISTRY.csv"),
        fonti=read_csv(ROOT / "registri/DATA_SOURCE_REGISTRY.csv"),
        strategie=read_csv(ROOT / "registri/STRATEGY_REGISTRY.csv"),
        deviazioni=(ROOT / "registri/DEVIAZIONI.md").read_text(encoding="utf-8"),
        convenienza=json.load(open(ROOT / "esperimenti/convenienza.json")),
        dove=json.load(open(ROOT / "ricerca/dove_si_fa.json")),
        dati_eco=json.load(open(ROOT / "ricerca/dati_economici.json")),
        copertura=json.load(open(ROOT / "registri/copertura_prompt.json")),
        test_motore=read_csv(ROOT / "registri/TEST_MOTORE.csv"),
        mestiere=json.load(open(ROOT / "ricerca/mestiere.json")) if (ROOT / "ricerca/mestiere.json").exists() else None,
    )
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    tpl = (APP / "laboratorio.template.html").read_text(encoding="utf-8")
    (APP / "laboratorio.html").write_text(tpl.replace("/*__DATA__*/null", blob), encoding="utf-8")
    print("ok", len(blob) // 1024, "KB;", "persistenza:", data["persistenza"])


if __name__ == "__main__":
    main()
