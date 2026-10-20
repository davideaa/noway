"""Libreria di feature della fase 2, sopra quella della fase 1.

Stessa regola point-in-time: una candela entra solo se chiusa prima del
cutoff; una serie giornaliera solo se ``available_from_utc`` ≤ cutoff.
Ogni famiglia ha un prefisso, usato per le ablazioni e nel FEATURE-REGISTRY:

    pa_     price action XAU su M1, M5, M15, H1, H4, D1 (candele, pattern, indicatori)
    xm_     mercati incrociati intraday (EURUSD, USDJPY, S&P 500, Nasdaq 100)
    rel_    relazioni variabili nel tempo (correlazioni, beta, divergenze)
    rt_     tassi estesi (curva, breakeven, z-score)
    news_   indici EPU e GPR
    cal_    calendario (FOMC, altre release, fine mese)
    surp_   memoria delle sorprese (prime stampe)
    cons_   consensus della release corrente
    react_  memoria delle reazioni dell'oro
    nfp_/ur_/ahe_  livelli del mercato del lavoro come pubblicati
    unit_   unità di volatilità pre-news (per lo stop, non per la direzione)
"""

from __future__ import annotations

from datetime import date

import numpy as np
import pandas as pd

from ..research.features import MarketContext, trading_day_index

M1 = pd.Timedelta(minutes=1)
H1 = pd.Timedelta(hours=1)
TF_RULE = {"M5": "5min", "M15": "15min", "H4": "4h"}


def _resample(df: pd.DataFrame, rule: str) -> pd.DataFrame:
    g = df.resample(rule, label="left", closed="left")
    return pd.DataFrame({"o": g.o.first(), "h": g.h.max(), "l": g.l.min(), "c": g.c.last()}).dropna()


def _closed(df: pd.DataFrame, t: pd.Timestamp, dur: pd.Timedelta) -> pd.DataFrame:
    return df.iloc[: df.index.searchsorted(t - dur, side="right")]


def _rsi(c: np.ndarray, n: int = 14) -> float:
    if len(c) < n + 1:
        return np.nan
    d = np.diff(c[-(n * 3):])
    up = pd.Series(np.clip(d, 0, None)).ewm(alpha=1 / n, adjust=False).mean().iloc[-1]
    dn = pd.Series(np.clip(-d, 0, None)).ewm(alpha=1 / n, adjust=False).mean().iloc[-1]
    return float(100 - 100 / (1 + up / dn)) if dn > 0 else 100.0


def bar_primitives(bars: pd.DataFrame, tag: str, atr: float, n_last: int = 3) -> dict:
    """Primitive di price action sulle ultime candele chiuse di un timeframe."""
    f: dict[str, float] = {}
    if len(bars) < 25 or not atr or not np.isfinite(atr) or atr <= 0:
        return f
    o, h, l, c = (bars[k].to_numpy() for k in ("o", "h", "l", "c"))
    rng = h - l
    for k in range(1, n_last + 1):
        i = -k
        r = rng[i] if rng[i] > 0 else np.nan
        f[f"pa_{tag}_b{k}_dir"] = float(np.sign(c[i] - o[i]))
        f[f"pa_{tag}_b{k}_body"] = abs(c[i] - o[i]) / r if r == r else np.nan
        f[f"pa_{tag}_b{k}_cloc"] = (c[i] - l[i]) / r if r == r else np.nan
        f[f"pa_{tag}_b{k}_range_atr"] = rng[i] / atr
        f[f"pa_{tag}_b{k}_uwick"] = (h[i] - max(o[i], c[i])) / r if r == r else np.nan
        f[f"pa_{tag}_b{k}_lwick"] = (min(o[i], c[i]) - l[i]) / r if r == r else np.nan
    f[f"pa_{tag}_inside"] = float(h[-1] <= h[-2] and l[-1] >= l[-2])
    f[f"pa_{tag}_outside"] = float(h[-1] > h[-2] and l[-1] < l[-2])
    f[f"pa_{tag}_bull_engulf"] = float(c[-1] > o[-1] and c[-2] < o[-2] and c[-1] >= o[-2] and o[-1] <= c[-2])
    f[f"pa_{tag}_bear_engulf"] = float(c[-1] < o[-1] and c[-2] > o[-2] and c[-1] <= o[-2] and o[-1] >= c[-2])
    f[f"pa_{tag}_hh"] = float(h[-1] > h[-2])
    f[f"pa_{tag}_ll"] = float(l[-1] < l[-2])
    f[f"pa_{tag}_hl"] = float(l[-1] > l[-2])
    f[f"pa_{tag}_lh"] = float(h[-1] < h[-2])
    dirs = np.sign(c[-3:] - o[-3:])
    f[f"pa_{tag}_seq3"] = float(sum((d > 0) * 2 ** j for j, d in enumerate(dirs)))  # 0..7, categorica
    f[f"pa_{tag}_upbars5"] = float(np.sum(c[-5:] > o[-5:]))
    # indicatori
    f[f"pa_{tag}_rsi14"] = _rsi(c)
    f[f"pa_{tag}_roc10_atr"] = (c[-1] - c[-11]) / atr if len(c) > 11 else np.nan
    w = c[-20:]
    sd = w.std()
    f[f"pa_{tag}_bb_pctb"] = (c[-1] - (w.mean() - 2 * sd)) / (4 * sd) if sd > 0 else np.nan
    f[f"pa_{tag}_bb_width_atr"] = 4 * sd / atr
    hi20, lo20 = h[-20:].max(), l[-20:].min()
    f[f"pa_{tag}_donch_pos"] = (c[-1] - lo20) / (hi20 - lo20) if hi20 > lo20 else np.nan
    f[f"pa_{tag}_donch_break"] = float(c[-1] >= h[-21:-1].max()) - float(c[-1] <= l[-21:-1].min()) if len(h) > 21 else np.nan
    ema20 = pd.Series(c).ewm(span=20, adjust=False).mean().to_numpy()
    f[f"pa_{tag}_ema20_dist_atr"] = (c[-1] - ema20[-1]) / atr
    f[f"pa_{tag}_ema20_slope_atr"] = (ema20[-1] - ema20[-4]) / atr
    # compressione: range delle ultime 5 candele contro la media
    f[f"pa_{tag}_compress5"] = (h[-5:].max() - l[-5:].min()) / (np.mean(rng[-25:]) * 5)
    return f


def pa_features(ctx: MarketContext, m1: pd.DataFrame | None, t: pd.Timestamp) -> dict:
    f: dict[str, float] = {}
    h1 = ctx.h1_until(t)
    d1 = ctx.d1_complete(t)
    if len(h1) < 200 or len(d1) < 60:
        return f
    atr_h = float(h1["atr14"].iloc[-1])
    atr_d = float(d1["atr14"].iloc[-1])
    f.update(bar_primitives(h1, "h1", atr_h))
    f.update(bar_primitives(_resample(h1, "4h"), "h4", atr_h * 2))
    f.update(bar_primitives(d1.rename(columns={}), "d1", atr_d))
    if m1 is not None and len(m1):
        mm = _closed(m1, t, M1)
        mm = mm[mm.index >= t - pd.Timedelta(days=2)]
        if len(mm) >= 120:
            atr_m1 = float((mm.h - mm.l).iloc[-60:].mean())
            f["unit_atr_m1_60"] = atr_m1
            f.update(bar_primitives(mm, "m1", atr_m1))
            m5 = _resample(mm, "5min")
            f.update(bar_primitives(m5, "m5", float((m5.h - m5.l).iloc[-24:].mean())))
            m15 = _resample(mm, "15min")
            f.update(bar_primitives(m15, "m15", float((m15.h - m15.l).iloc[-16:].mean())))
            px = float(mm.c.iloc[-1])
            for mins in (5, 15, 30, 60):
                w = mm[mm.index >= t - pd.Timedelta(minutes=mins)]
                if len(w):
                    f[f"pa_range_{mins}m_atrh"] = (w.h.max() - w.l.min()) / atr_h
            # distanza dai livelli tondi (in ATR H1)
            for step in (10, 50):
                r = round(px / step) * step
                f[f"pa_dist_round{step}_atrh"] = (px - r) / atr_h
            # falsa rottura: nell'ultima ora ha superato il range delle 4 ore precedenti ed è rientrato
            last1 = mm[mm.index >= t - pd.Timedelta(hours=1)]
            prev4 = mm[(mm.index >= t - pd.Timedelta(hours=5)) & (mm.index < t - pd.Timedelta(hours=1))]
            if len(last1) > 10 and len(prev4) > 60:
                ph, pl = prev4.h.max(), prev4.l.min()
                f["pa_false_break_up_1h"] = float(last1.h.max() > ph and px < ph)
                f["pa_false_break_dn_1h"] = float(last1.l.min() < pl and px > pl)
                f["pa_break_up_1h"] = float(px > ph)
                f["pa_break_dn_1h"] = float(px < pl)
    f["unit_atr_h1"] = atr_h
    f["unit_atr_d1"] = atr_d
    f["unit_px"] = float(h1["c"].iloc[-1])
    return f


def cross_features(m1s: dict[str, pd.DataFrame], t: pd.Timestamp) -> dict:
    """Rendimenti intraday pre-news di EURUSD, USDJPY, S&P 500 e Nasdaq (in %)."""
    f: dict[str, float] = {}
    for sym, tag in (("EURUSD", "eur"), ("USDJPY", "jpy"), ("USA500IDXUSD", "spx"), ("USATECHIDXUSD", "ndx")):
        m = m1s.get(sym)
        if m is None or not len(m):
            continue
        mm = _closed(m, t, M1)
        if len(mm) < 60 or (t - (mm.index[-1] + M1)) > pd.Timedelta(minutes=30):
            continue
        c = mm.c
        last = float(c.iloc[-1])
        for mins in (15, 60, 240, 1440):
            j = c.index.searchsorted(t - pd.Timedelta(minutes=mins) - M1, side="right") - 1
            if j >= 0 and (t - pd.Timedelta(minutes=mins) - c.index[j]) < pd.Timedelta(minutes=45):
                f[f"xm_{tag}_ret_{mins}m_pct"] = (last / float(c.iloc[j]) - 1) * 100
        w = mm[mm.index >= t - pd.Timedelta(minutes=60)]
        if len(w) > 10:
            f[f"xm_{tag}_range_60m_pct"] = (w.h.max() - w.l.min()) / last * 100
    return f


def relationship_features(ctx: MarketContext, spx_h1: pd.DataFrame | None, t: pd.Timestamp) -> dict:
    """Correlazioni e beta su rendimenti H1 (ultimi 5 e 20 giorni), divergenze."""
    f: dict[str, float] = {}
    xau = np.log(ctx.h1_until(t)["c"])
    dxy = np.log(ctx.dxy_h1.iloc[: ctx.dxy_h1.index.searchsorted(t - H1, side="right")])
    j = pd.concat({"x": xau.diff(), "d": dxy.diff()}, axis=1).dropna()
    for n, tag in ((120, "5d"), (480, "20d")):
        w = j.iloc[-n:]
        if len(w) > n * 0.7 and w.d.std() > 0:
            f[f"rel_xau_dxy_corr_{tag}"] = float(w.x.corr(w.d))
            f[f"rel_xau_dxy_beta_{tag}"] = float(np.polyfit(w.d, w.x, 1)[0])
    if "rel_xau_dxy_beta_20d" in f and len(j) > 24:
        last24 = j.iloc[-24:].sum()
        f["rel_xau_dxy_div_24h_pct"] = float((last24.x - f["rel_xau_dxy_beta_20d"] * last24.d) * 100)
    if spx_h1 is not None and len(spx_h1):
        s = np.log(_closed(spx_h1, t, H1)["c"])
        k = pd.concat({"x": xau.diff(), "s": s.diff()}, axis=1).dropna().iloc[-480:]
        if len(k) > 300 and k.s.std() > 0:
            f["rel_xau_spx_corr_20d"] = float(k.x.corr(k.s))
    # relazione giornaliera oro-tassi (60 giorni): variazioni del 2Y e del reale 10Y
    d1 = ctx.d1_complete(t)
    r = ctx.daily_asof(ctx.rates, t)
    if len(d1) > 80 and r is not None and len(r) > 80:
        xd = pd.Series(np.log(d1["c"].to_numpy()), index=pd.to_datetime(d1.index)).diff()
        rr = r.copy()
        rr.index = pd.to_datetime(rr.index)
        for col, tag in (("y2y", "2y"), ("r10y", "real10y")):
            if col in rr:
                jj = pd.concat({"x": xd, "y": rr[col].diff()}, axis=1).dropna().iloc[-60:]
                if len(jj) > 40 and jj.y.std() > 0:
                    f[f"rel_xau_{tag}_corr_60d"] = float(jj.x.corr(jj.y))
    return f


def rates_ext_features(ctx: MarketContext, t: pd.Timestamp) -> dict:
    f: dict[str, float] = {}
    r = ctx.daily_asof(ctx.rates, t)
    if r is None or len(r) < 260:
        return f
    last = r.iloc[-1]
    for a, b, name in (("y5y", "r5y", "be5y"), ("y10y", "r10y", "be10y")):
        if a in r and b in r:
            s = (r[a] - r[b]).dropna()
            if len(s) > 260:
                f[f"rt_{name}"] = float(s.iloc[-1])
                f[f"rt_{name}_chg_5d"] = float(s.iloc[-1] - s.iloc[-6])
                f[f"rt_{name}_chg_20d"] = float(s.iloc[-1] - s.iloc[-21])
    if "y30y" in r and "y5y" in r:
        f["rt_slope_5s30s"] = float(last["y30y"] - last["y5y"])
    for col in ("y2y", "y10y", "r10y"):
        if col in r:
            s = r[col].dropna().iloc[-252:]
            if len(s) > 200 and s.std() > 0:
                f[f"rt_{col}_z1y"] = float((s.iloc[-1] - s.mean()) / s.std())
                f[f"rt_{col}_pct1y"] = float((s < s.iloc[-1]).mean())
    v = ctx.daily_asof(ctx.vix, t)
    if v is not None and len(v) > 260:
        s = v["vix"].iloc[-252:]
        f["rt_vix_z1y"] = float((s.iloc[-1] - s.mean()) / s.std())
    return f


def news_index_features(epu: pd.DataFrame, gpr: pd.DataFrame, t: pd.Timestamp) -> dict:
    f: dict[str, float] = {}
    for df, cols in ((epu, ["epu"]), (gpr, ["gpr", "gpr_threat", "gpr_act"])):
        k = df[df["available_from_utc"] <= t]
        if len(k) < 400:
            continue
        for c in cols:
            s = k[c].astype(float)
            f[f"news_{c}_ma7"] = float(s.iloc[-7:].mean())
            f[f"news_{c}_pct1y"] = float((s.iloc[-365:] < s.iloc[-7:].mean()).mean())
            f[f"news_{c}_chg_30d"] = float(s.iloc[-7:].mean() - s.iloc[-37:-30].mean())
    return f


def calendar_features(t0: pd.Timestamp, t: pd.Timestamp, fomc_dates: list[date], ff_high: pd.DataFrame,
                      family: str) -> dict:
    """Calendario noto in anticipo: date FOMC (pubblicate un anno prima), altre release ad alto impatto."""
    d0 = t0.tz_convert("America/New_York").date()
    f: dict[str, float] = {"cal_weekday": float(d0.weekday()), "cal_month": float(d0.month)}
    past = [d for d in fomc_dates if d < d0]
    fut = [d for d in fomc_dates if d >= d0]
    if past:
        f["cal_days_since_fomc"] = float((d0 - past[-1]).days)
    if fut:
        f["cal_days_to_fomc"] = float((fut[0] - d0).days)
    nxt = pd.Timestamp(d0) + pd.offsets.MonthEnd(0)
    f["cal_days_to_month_end"] = float((nxt.date() - d0).days)
    same = ff_high[(ff_high["d"] == d0)]
    f["cal_high_same_day"] = float(len(same) - 1)  # esclusa la release stessa
    f["cal_high_same_time"] = float(((same["release_utc"] - t0).abs() <= pd.Timedelta(minutes=1)).sum() - 1)
    prev24 = ff_high[(ff_high["release_utc"] < t0 - pd.Timedelta(minutes=1)) &
                     (ff_high["release_utc"] >= t0 - pd.Timedelta(hours=24))]
    f["cal_high_prev24h"] = float(len(prev24))
    f["cal_is_nfp"] = float(family == "NFP")
    return f
