"""Strategy B — cash-and-carry on perpetual funding (long spot, short perp), PROTOCOLLO_01.md.

Capital accounting (non-compounded, capital = 1): per coin, spot notional N is paid in full and
the short perp carries margin = 50% of N (2x on that leg), so capital per coin = 1.5 N.
With BTC+ETH at half capital each: N = 0.5 / 1.5 per coin.
"""
import json, sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))
from validazione import summary, sharpe, deflated_sharpe

ROOT = Path(__file__).resolve().parents[1]
PROC = ROOT / "dati" / "processed"


def run_coin(spot, perp, fund, n_notional, enter=0.10, exit_=0.0, always=False,
             fee_spot=0.0010, fee_perp=0.0005, slip=0.0003, cost_mult=1.0):
    idx = spot.index.intersection(perp.index).intersection(fund.index)
    s, f, fr = spot[idx], perp[idx], fund[idx]
    sig = fr.rolling(7).mean() * 365
    c_rt = ((fee_spot + slip) + (fee_perp + slip)) * cost_mult
    pnl = pd.Series(0.0, index=idx)
    state, pending, qs = 0, None, 0.0
    n_trades = 0
    for i, d in enumerate(idx):
        if state and i > 0:
            # constant notional N (rebalanced daily): no hidden leverage as price trends
            rs = s.iloc[i] / s.iloc[i - 1] - 1
            rp = f.iloc[i] / f.iloc[i - 1] - 1
            pnl[d] += n_notional * (rs - rp)
            pnl[d] += n_notional * (1 + rp) * fr.iloc[i]   # short perp receives positive funding
            # daily rebalance cost: traded notional ~ N*|rs - rp| per leg pair (small)
            pnl[d] -= c_rt * n_notional * abs(rs - rp)
        if pending is not None:
            if pending == 1 and not state:
                state, qs = 1, n_notional / s.iloc[i]
                pnl[d] -= c_rt * n_notional; n_trades += 1
            elif pending == 0 and state:
                pnl[d] -= c_rt * n_notional
                state, qs = 0, 0.0
            pending = None
        if np.isnan(sig.iloc[i]):
            continue
        want = 1 if always else (1 if (not state and sig.iloc[i] > enter) else
                                 (0 if (state and sig.iloc[i] < exit_) else state))
        if want != state:
            pending = want
    return pnl, n_trades, (pnl != 0).mean()


def run(spot, perp, fund, coins=("BTC", "ETH"), **kw):
    n = 0.5 / 1.5
    tot = None; trades = 0; expo = []
    for c in coins:
        p, t, e = run_coin(spot[c].dropna(), perp[c].dropna(), fund[c].dropna(), n, **kw)
        tot = p if tot is None else tot.add(p, fill_value=0)
        trades += t; expo.append(e)
    return tot.sort_index(), trades, float(np.mean(expo))


def main():
    spot = pd.read_parquet(PROC / "spot_close.parquet")
    perp = pd.read_parquet(PROC / "perp_close.parquet")
    fund = pd.read_parquet(PROC / "funding_daily.parquet")
    rf = pd.read_csv(ROOT / "dati/raw/fred_DTB3.csv", index_col=0, parse_dates=True).iloc[:, 0]
    rf = pd.to_numeric(rf, errors="coerce").ffill() / 100 / 365
    rf = rf.reindex(pd.date_range("2018-01-01", "2026-10-31")).ffill()
    configs = {"soglia10": dict(enter=0.10), "soglia0": dict(enter=0.0), "soglia5": dict(enter=0.05),
               "soglia20": dict(enter=0.20), "sempre": dict(always=True)}
    out, oos_sharpes = {}, {}
    for name, kw in configs.items():
        for cm in ((1, 2, 3) if name == "soglia10" else (1,)):
            pnl, tr, ex = run(spot, perp, fund, cost_mult=cm, **kw)
            pnl = pnl.loc["2020-01-01":"2026-10-31"]
            is_, oos = pnl.loc[:"2022-12-31"], pnl.loc["2023-01-01":]
            key = f"{name}_cost{cm}"
            out[key] = dict(ingressi=tr, esposizione=round(ex, 3), IS=summary(is_, rf), OOS=summary(oos, rf))
            if cm == 1:
                oos_sharpes[name] = sharpe(oos - rf.reindex(oos.index))
            if key == "soglia10_cost1":
                pnl.to_frame("pnl").to_parquet(ROOT / "esperimenti" / "B_main_pnl.parquet")
            print(key, json.dumps(out[key]), flush=True)
    main_oos = pd.read_parquet(ROOT / "esperimenti" / "B_main_pnl.parquet").pnl.loc["2023-01-01":]
    ex = main_oos - rf.reindex(main_oos.index)
    out["DSR_soglia10"] = deflated_sharpe(ex.values, list(oos_sharpes.values()))
    out["oos_sharpes_eccesso"] = {k: round(v, 2) for k, v in oos_sharpes.items()}
    print("DSR", out["DSR_soglia10"], out["oos_sharpes_eccesso"])
    json.dump(out, open(ROOT / "esperimenti" / "B_risultati.json", "w"), indent=1)


if __name__ == "__main__":
    main()
