"""Build clean daily panels from raw Binance parquet + run data-quality checks."""
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "dati" / "raw" / "binance"
UNIVERSE = ["BTC", "ETH", "XRP", "BCH", "EOS", "TRX", "BNB", "ADA", "XLM", "LTC",
            "NEO", "ETC", "ONT", "VET", "ICX"]


def _load(kind, sym, iv="1d"):
    f = RAW / (f"{kind}_{sym}_{iv}.parquet" if kind != "um_fund" else f"{kind}_{sym}.parquet")
    return pd.read_parquet(f) if f.exists() else None


def spot_close():
    out = {}
    for c in UNIVERSE:
        if c == "BCH":
            a, b = _load("spot_kl", "BCHABCUSDT"), _load("spot_kl", "BCHUSDT")
            df = pd.concat([a[a.ts < b.ts.min()], b])
        else:
            df = _load("spot_kl", c + "USDT")
        s = df.set_index(df.ts.dt.tz_localize(None).dt.normalize())["close"].astype(float)
        out[c] = s[~s.index.duplicated()]
    return pd.DataFrame(out).sort_index()


def perp_close():
    out = {}
    for c in UNIVERSE:
        df = _load("um_kl", c + "USDT")
        if df is None:
            continue
        s = df.set_index(df.ts.dt.tz_localize(None).dt.normalize())["close"].astype(float)
        out[c] = s[~s.index.duplicated()]
    return pd.DataFrame(out).sort_index()


def funding_daily():
    """Sum of funding rates paid within each UTC day (fraction of notional; long pays if >0)."""
    out = {}
    for c in UNIVERSE:
        df = _load("um_fund", c + "USDT")
        if df is None:
            continue
        d = df.set_index(df.ts.dt.tz_localize(None).dt.floor("D"))["funding_rate"].astype(float)
        out[c] = d.groupby(level=0).sum()
    return pd.DataFrame(out).sort_index()


def quality(df, name, max_abs_logret=0.5):
    rep = {}
    for c in df.columns:
        s = df[c].dropna()
        if s.empty:
            continue
        full = pd.date_range(s.index.min(), s.index.max(), freq="D")
        lr = np.log(s).diff().dropna()
        rep[c] = {
            "first": str(s.index.min().date()), "last": str(s.index.max().date()),
            "n": int(len(s)), "missing_days": int(len(full) - len(s)),
            "nonpositive": int((s <= 0).sum()),
            "jumps_gt_50pct": [str(d.date()) for d in lr[lr.abs() > max_abs_logret].index],
        }
    (ROOT / "dati" / "quality").mkdir(parents=True, exist_ok=True)
    (ROOT / "dati" / "quality" / f"qc_{name}.json").write_text(json.dumps(rep, indent=1))
    return rep


if __name__ == "__main__":
    sp, pp, fd = spot_close(), perp_close(), funding_daily()
    proc = ROOT / "dati" / "processed"
    proc.mkdir(parents=True, exist_ok=True)
    sp.to_parquet(proc / "spot_close.parquet")
    pp.to_parquet(proc / "perp_close.parquet")
    fd.to_parquet(proc / "funding_daily.parquet")
    for name, df in [("spot", sp), ("perp", pp)]:
        r = quality(df, name)
        print(name, {k: (v["missing_days"], len(v["jumps_gt_50pct"])) for k, v in r.items()})
    # perp vs spot consistency: basis outliers suggest bad data
    common = sp.index.intersection(pp.index)
    basis = (pp.loc[common] / sp.loc[common, pp.columns] - 1)
    print("basis |>5%| days:", {c: int((basis[c].abs() > 0.05).sum()) for c in basis})
    print("funding: days, mean annualized %:",
          {c: (int(fd[c].count()), round(fd[c].mean() * 365 * 100, 1)) for c in fd})
