"""Download Binance public bulk data (data.binance.vision) — official, free, no auth.

Kinds:
  spot_kl   : spot klines            data/spot/monthly/klines/{S}/{iv}/{S}-{iv}-{YYYY-MM}.zip
  um_kl     : USD-M perp klines      data/futures/um/monthly/klines/...
  um_fund   : USD-M funding rates    data/futures/um/monthly/fundingRate/{S}/{S}-fundingRate-{YYYY-MM}.zip

Every zip is verified against the published .CHECKSUM (sha256). Output: one parquet per
(kind, symbol, interval) in dati/raw/binance/. Missing months are recorded, not invented.
"""
import argparse, hashlib, io, json, sys, time, zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen
from urllib.error import HTTPError, URLError

import pandas as pd

BASE = "https://data.binance.vision/"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dati" / "raw" / "binance"
KL_COLS = ["open_time", "open", "high", "low", "close", "volume", "close_time",
           "quote_volume", "trades", "taker_buy_base", "taker_buy_quote", "ignore"]


def months(start, end):
    return [p.strftime("%Y-%m") for p in pd.period_range(start, end, freq="M")]


def get(url, tries=3):
    for k in range(tries):
        try:
            with urlopen(url, timeout=60) as r:
                return r.read()
        except HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(2 * (k + 1))
        except (URLError, TimeoutError, ConnectionError):
            time.sleep(2 * (k + 1))
    raise RuntimeError(f"failed after {tries}: {url}")


def path_for(kind, sym, iv, ym):
    if kind == "spot_kl":
        return f"data/spot/monthly/klines/{sym}/{iv}/{sym}-{iv}-{ym}.zip"
    if kind == "um_kl":
        return f"data/futures/um/monthly/klines/{sym}/{iv}/{sym}-{iv}-{ym}.zip"
    if kind == "um_fund":
        return f"data/futures/um/monthly/fundingRate/{sym}/{sym}-fundingRate-{ym}.zip"
    raise ValueError(kind)


def fetch_month(kind, sym, iv, ym):
    rel = path_for(kind, sym, iv, ym)
    blob = get(BASE + rel)
    if blob is None:
        return ym, None, "missing"
    chk = get(BASE + rel + ".CHECKSUM")
    status = "nochecksum"
    if chk:
        expected = chk.decode().split()[0]
        status = "ok" if hashlib.sha256(blob).hexdigest() == expected else "BADSUM"
        if status == "BADSUM":
            return ym, None, status
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        raw = z.read(z.namelist()[0]).decode()
    first = raw.split("\n", 1)[0]
    has_header = not first.split(",")[0].strip().lstrip("-").isdigit()
    df = pd.read_csv(io.StringIO(raw), header=0 if has_header else None)
    if kind != "um_fund":
        df = df.iloc[:, :12]
        df.columns = KL_COLS
    return ym, df, status


def run(kind, sym, iv, start, end, workers=8):
    yms = months(start, end)
    with ThreadPoolExecutor(workers) as ex:
        res = list(ex.map(lambda m: fetch_month(kind, sym, iv, m), yms))
    frames = [d for _, d, _ in res if d is not None]
    log = {s: [m for m, _, st in res if st == s] for s in {"ok", "missing", "BADSUM", "nochecksum"}}
    if not frames:
        return None, log
    df = pd.concat(frames, ignore_index=True)
    if kind == "um_fund":
        tcol = [c for c in df.columns if "time" in c.lower()][0]
        df["ts"] = pd.to_datetime(df[tcol].astype("int64"), unit="ms", utc=True)
        rcol = [c for c in df.columns if "rate" in c.lower() and "funding" in c.lower()][0]
        df = df.rename(columns={rcol: "funding_rate"})[["ts", "funding_rate"]]
    else:
        ot = df["open_time"].astype("int64")
        # Binance switched spot timestamps to microseconds in 2025
        ot = ot.where(ot < 10**14, ot // 1000)
        df["ts"] = pd.to_datetime(ot, unit="ms", utc=True)
        df = df[["ts", "open", "high", "low", "close", "volume", "quote_volume", "trades"]]
    df = df.drop_duplicates("ts").sort_values("ts").reset_index(drop=True)
    OUT.mkdir(parents=True, exist_ok=True)
    name = f"{kind}_{sym}_{iv}.parquet" if kind != "um_fund" else f"{kind}_{sym}.parquet"
    df.to_parquet(OUT / name)
    return df, log


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("kind")
    ap.add_argument("symbols", nargs="+")
    ap.add_argument("--iv", default="1d")
    ap.add_argument("--start", default="2017-08")
    ap.add_argument("--end", default="2026-10")
    a = ap.parse_args()
    summary = {}
    for s in a.symbols:
        df, log = run(a.kind, s, a.iv, a.start, a.end)
        n = 0 if df is None else len(df)
        rng = "" if df is None else f"{df.ts.min().date()}..{df.ts.max().date()}"
        summary[s] = {"rows": n, "range": rng, "ok": len(log["ok"]), "missing": len(log["missing"]),
                      "badsum": log["BADSUM"], "nochecksum": len(log["nochecksum"])}
        print(s, json.dumps(summary[s]), flush=True)
    logf = ROOT / "dati" / "quality" / f"download_{a.kind}_{a.iv}.json"
    logf.parent.mkdir(parents=True, exist_ok=True)
    old = json.loads(logf.read_text()) if logf.exists() else {}
    old.update(summary)
    logf.write_text(json.dumps(old, indent=1))
