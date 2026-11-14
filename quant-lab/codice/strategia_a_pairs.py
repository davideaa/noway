"""Strategy A — cointegration pairs, walk-forward, as declared in PROTOCOLLO_01.md.

Non-compounded accounting: capital = 1, each of K slots gets 1/K gross notional at entry.
Signal at close d -> trade at close d+1. P&L uses fixed quantities from the entry price.
"""
import itertools, json, sys
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.tsa.stattools import coint

sys.path.insert(0, str(Path(__file__).parent))
from validazione import summary

ROOT = Path(__file__).resolve().parents[1]
PROC = ROOT / "dati" / "processed"


def bh(pvals, q=0.05):
    p = np.asarray(pvals)
    n = len(p)
    if n == 0:
        return np.zeros(0, bool)
    order = np.argsort(p)
    thr = q * np.arange(1, n + 1) / n
    ok = p[order] <= thr
    k = np.max(np.where(ok)[0]) + 1 if ok.any() else 0
    mask = np.zeros(n, bool)
    mask[order[:k]] = True
    return mask


def form_pairs(lp, k_max, q=0.05):
    cols = [c for c in lp.columns if lp[c].notna().all()]
    rows = []
    for a, b in itertools.combinations(cols, 2):
        y, x = lp[a].values, lp[b].values
        p = coint(y, x, trend="c")[1]
        X = sm.add_constant(x)
        beta = sm.OLS(y, X).fit().params
        s = y - beta[1] * x
        ds, sl = np.diff(s), s[:-1] - s[:-1].mean()
        lam = np.dot(sl, ds) / np.dot(sl, sl)
        hl = -np.log(2) / lam if lam < 0 else np.inf
        rows.append(dict(y=a, x=b, p=p, beta=beta[1], mu=s.mean(), sd=s.std(ddof=1), hl=hl))
    df = pd.DataFrame(rows)
    n_tests = len(df)
    if df.empty:
        return df, 0
    df["bh"] = bh(df.p.values, q)
    sel = df[df.bh & (df.hl >= 2) & (df.hl <= 60)].sort_values("p").head(k_max)
    return sel, n_tests


def run(price, funding, entry=2.0, exit_=0.0, stop=4.0, form_days=365, trade_days=90,
        k=5, fee=0.0005, slip=0.0003, cost_mult=1.0, start="2019-01-01", end="2026-10-31"):
    lp = np.log(price)
    days = price.loc[start:end].index
    pnl = pd.Series(0.0, index=price.index)
    c = (fee + slip) * cost_mult
    trades, log = [], []
    total_tests = 0
    t0 = pd.Timestamp(start)
    while t0 <= pd.Timestamp(end):
        f_start = t0 - pd.Timedelta(days=form_days)
        form = lp.loc[f_start:t0 - pd.Timedelta(days=1)]
        win = price.loc[t0:t0 + pd.Timedelta(days=trade_days - 1)].index
        if len(form) < form_days * 0.95 or len(win) == 0:
            t0 += pd.Timedelta(days=trade_days); continue
        sel, n_tests = form_pairs(form.dropna(axis=1, how="any"), k)
        total_tests += n_tests
        log.append(dict(start=str(t0.date()), tested=n_tests, selected=len(sel),
                        pairs=[f"{r.y}/{r.x}" for r in sel.itertuples()]))
        slot = 1.0 / k
        for r in sel.itertuples():
            py, px = price[r.y].loc[win], price[r.x].loc[win]
            fy = funding[r.y].reindex(win).fillna(0) if r.y in funding else pd.Series(0, index=win)
            fx = funding[r.x].reindex(win).fillna(0) if r.x in funding else pd.Series(0, index=win)
            z = ((np.log(py) - r.beta * np.log(px)) - r.mu) / r.sd
            wy, wx = slot / (1 + abs(r.beta)), slot * abs(r.beta) / (1 + abs(r.beta))
            sx = np.sign(r.beta) if r.beta != 0 else 1
            state, pending, stopped = 0, None, False
            qy = qx = 0.0
            entry_day = None
            idx = list(win)
            for i, d in enumerate(idx):
                # 1) P&L of day d for the position held since previous close
                if state != 0 and i > 0:
                    p0y, p1y = py.iloc[i - 1], py.iloc[i]
                    p0x, p1x = px.iloc[i - 1], px.iloc[i]
                    pl = qy * (p1y - p0y) + qx * (p1x - p0x)
                    pl -= qy * p1y * fy.iloc[i] + qx * p1x * fx.iloc[i]  # long pays positive funding
                    pnl[d] += pl
                # 2) execute order decided at previous close
                if pending is not None:
                    if pending == 0 and state != 0:
                        pnl[d] -= c * (abs(qy) * py.iloc[i] + abs(qx) * px.iloc[i])
                        trades.append(dict(pair=f"{r.y}/{r.x}", open=str(entry_day.date()), close=str(d.date()),
                                           side=state, reason=reason))
                        state, qy, qx = 0, 0.0, 0.0
                    elif pending != 0 and state == 0:
                        state = pending
                        qy = state * wy / py.iloc[i]
                        qx = -state * sx * wx / px.iloc[i]
                        pnl[d] -= c * (wy + wx)
                        entry_day = d
                    pending = None
                # 3) signal at close d (executed at close d+1); last day: close
                zd = z.iloc[i]
                if i >= len(idx) - 2:
                    if state != 0 and i == len(idx) - 2:
                        pending, reason = 0, "fine_finestra"
                    continue
                if state == 0 and not stopped:
                    if zd >= entry: pending = -1
                    elif zd <= -entry: pending = 1
                elif state != 0:
                    if abs(zd) >= stop:
                        pending, reason, stopped = 0, "stop", True
                    elif (state == -1 and zd <= exit_) or (state == 1 and zd >= -exit_):
                        pending, reason = 0, "media"
        t0 += pd.Timedelta(days=trade_days)
    return pnl.loc[start:end], pd.DataFrame(trades), log, total_tests


def main():
    price = pd.read_parquet(PROC / "spot_close.parquet").ffill(limit=3)
    funding = pd.read_parquet(PROC / "funding_daily.parquet")
    rf = pd.read_csv(ROOT / "dati/raw/fred_DTB3.csv", index_col=0, parse_dates=True).iloc[:, 0]
    rf = pd.to_numeric(rf, errors="coerce").ffill() / 100 / 365
    rf = rf.reindex(pd.date_range("2018-01-01", "2026-10-31")).ffill()
    out = {}
    configs = [(e, f) for f in (365, 180) for e in (2.0, 1.5, 2.5)]
    for e, f in configs:
        for cm in ((1, 2, 3) if (e, f) == (2.0, 365) else (1,)):
            pnl, tr, log, nt = run(price, funding, entry=e, form_days=f, cost_mult=cm)
            key = f"entry{e}_form{f}_cost{cm}"
            is_, oos = pnl.loc[:"2022-12-31"], pnl.loc["2023-01-01":]
            rev = (tr.reason == "media").mean() if len(tr) else np.nan
            out[key] = dict(trades=len(tr), test_totali=nt,
                            ritorno_alla_media=round(float(rev), 3) if len(tr) else None,
                            IS=summary(is_, rf), OOS=summary(oos, rf),
                            OOS_trades=int((pd.to_datetime(tr.open) >= "2023-01-01").sum()) if len(tr) else 0)
            if key == "entry2.0_form365_cost1":
                pnl.to_frame("pnl").to_parquet(ROOT / "esperimenti" / "A_main_pnl.parquet")
                tr.to_csv(ROOT / "esperimenti" / "A_main_trades.csv", index=False)
                json.dump(log, open(ROOT / "esperimenti" / "A_main_formazioni.json", "w"), indent=1)
            print(key, json.dumps(out[key]), flush=True)
    json.dump(out, open(ROOT / "esperimenti" / "A_risultati.json", "w"), indent=1)


if __name__ == "__main__":
    main()
