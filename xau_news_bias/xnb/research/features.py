"""Fotografia pre-news: le feature disponibili all'istante ``t`` (checkpoint).

Regola unica: una candela entra solo se è CHIUSA prima di ``t``
(apertura + durata ≤ t); una serie giornaliera entra solo se il suo
``available_from_utc`` ≤ t; un comunicato macro entra solo se è uscito
prima di ``t``. ``MarketContext.assert_no_future`` lo verifica.

Unità: i movimenti di prezzo sono espressi in ATR (H1 per l'intraday,
giornaliero per i giorni), così sono confrontabili fra un oro a 900 $ e
uno a 4.000 $.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

from ..providers.dukascopy import synthetic_dxy
from ..timeutil import NY, UTC

H1 = pd.Timedelta(hours=1)
M1 = pd.Timedelta(minutes=1)


class LeakageError(AssertionError):
    pass


def trading_day_index(idx: pd.DatetimeIndex) -> pd.Index:
    """Giornata di trading con chiusura alle 17:00 New York."""
    return (idx.tz_convert(NY) + pd.Timedelta(hours=7)).date


def daily_from_h1(h1: pd.DataFrame) -> pd.DataFrame:
    df = h1.copy()
    df["td"] = trading_day_index(df.index)
    g = df.groupby("td")
    d = pd.DataFrame({"o": g["o"].first(), "h": g["h"].max(), "l": g["l"].min(), "c": g["c"].last(),
                      "n": g["c"].size(), "last_bar": g.apply(lambda x: x.index[-1], include_groups=False)})
    d = d[d.n >= 4]  # scarta giornate-frammento (apertura domenicale, festività)
    prev_c = d["c"].shift(1)
    d["tr"] = np.maximum(d.h - d.l, np.maximum((d.h - prev_c).abs(), (d.l - prev_c).abs()))
    d["atr14"] = d["tr"].rolling(14, min_periods=10).mean()
    d["atr5"] = d["tr"].rolling(5, min_periods=4).mean()
    d["atr20"] = d["tr"].rolling(20, min_periods=15).mean()
    for n in (20, 50, 200):
        d[f"ema{n}"] = d["c"].ewm(span=n, adjust=False, min_periods=n // 2).mean()
    d["hi20"] = d["h"].rolling(20, min_periods=15).max()
    d["lo20"] = d["l"].rolling(20, min_periods=15).min()
    return d


def enrich_h1(h1: pd.DataFrame) -> pd.DataFrame:
    df = h1.copy()
    prev_c = df["c"].shift(1)
    df["tr"] = np.maximum(df.h - df.l, np.maximum((df.h - prev_c).abs(), (df.l - prev_c).abs()))
    df["atr14"] = df["tr"].rolling(14, min_periods=10).mean()
    df["ema20"] = df["c"].ewm(span=20, adjust=False).mean()
    df["ema100"] = df["c"].ewm(span=100, adjust=False).mean()
    return df


@dataclass
class MarketContext:
    """Tutto il materiale di mercato già caricato, con accessi point-in-time."""

    xau_h1: pd.DataFrame
    xau_d1: pd.DataFrame
    dxy_h1: pd.Series
    rates: pd.DataFrame
    vix: pd.DataFrame
    cot: pd.DataFrame
    m1_cache: dict = field(default_factory=dict)  # (symbol) -> DataFrame M1 già unito

    # ---- accessi sicuri -------------------------------------------------
    def h1_until(self, t: pd.Timestamp) -> pd.DataFrame:
        end = self.xau_h1.index.searchsorted(t - H1, side="right")
        return self.xau_h1.iloc[:end]

    def d1_complete(self, t: pd.Timestamp) -> pd.DataFrame:
        td_now = trading_day_index(pd.DatetimeIndex([t]))[0]
        d = self.xau_d1
        return d[d.index < td_now]

    def daily_asof(self, df: pd.DataFrame, t: pd.Timestamp) -> pd.DataFrame:
        if df is None or df.empty:
            return df
        return df[df["available_from_utc"] <= t]

    @staticmethod
    def m1_until(m1: pd.DataFrame, t: pd.Timestamp) -> pd.DataFrame:
        end = m1.index.searchsorted(t - M1, side="right")
        return m1.iloc[:end]

    @staticmethod
    def assert_no_future(frames: dict[str, pd.DataFrame], t: pd.Timestamp) -> None:
        for name, (df, dur) in frames.items():
            if df is not None and len(df) and df.index[-1] + dur > t:
                raise LeakageError(f"{name}: barra {df.index[-1]} chiude dopo {t}")


def _last(s: pd.Series, default=np.nan):
    return s.iloc[-1] if len(s) else default


def _chg(s: pd.Series, n: int):
    s = s.dropna()
    return s.iloc[-1] - s.iloc[-1 - n] if len(s) > n else np.nan


def xau_features(ctx: MarketContext, m1: pd.DataFrame, t: pd.Timestamp) -> dict:
    f: dict[str, float] = {}
    h1 = ctx.h1_until(t)
    d1 = ctx.d1_complete(t)
    mm = ctx.m1_until(m1, t) if m1 is not None else None
    ctx.assert_no_future({"xau_h1": (h1, H1), "xau_m1": (mm, M1)}, t)
    if len(h1) < 200 or len(d1) < 60:
        return f
    atr_h = h1["atr14"].iloc[-1]
    atr_d = d1["atr14"].iloc[-1]
    # prezzo corrente: ultima M1 chiusa se disponibile e recente, altrimenti ultima H1
    px = h1["c"].iloc[-1]
    px_time = h1.index[-1] + H1
    if mm is not None and len(mm) and mm.index[-1] > h1.index[-1]:
        px = mm["c"].iloc[-1]
        px_time = mm.index[-1] + M1
    f["xau_px_age_min"] = (t - px_time).total_seconds() / 60
    # meta: livelli non stazionari, servono per convertire ATR <-> pips, MAI feature di modello
    f["meta_px"] = px
    f["meta_atr_h1_usd"] = atr_h
    f["meta_atr_d1_usd"] = atr_d
    f["xau_atr_h1_pct"] = atr_h / px * 100
    f["xau_atr_d1_pct"] = atr_d / px * 100
    f["xau_atr_ratio_5_20"] = d1["atr5"].iloc[-1] / d1["atr20"].iloc[-1]

    def ret_m1(minutes: int):
        if mm is None or not len(mm):
            return np.nan
        ref_t = t - pd.Timedelta(minutes=minutes)
        j = mm.index.searchsorted(ref_t - M1, side="right") - 1
        if j < 0 or (ref_t - (mm.index[j] + M1)) > pd.Timedelta(minutes=30):
            return np.nan
        return (px - mm["c"].iloc[j]) / atr_h

    for mins in (5, 15, 60, 240):
        f[f"xau_ret_{mins}m_atrh"] = ret_m1(mins)

    def ret_h1(hours: int):
        j = h1.index.searchsorted(t - pd.Timedelta(hours=hours) - H1, side="right") - 1
        return (px - h1["c"].iloc[j]) / atr_d if j >= 0 else np.nan

    f["xau_ret_24h_atrd"] = ret_h1(24)
    f["xau_ret_5d_atrd"] = (px - d1["c"].iloc[-6]) / atr_d
    f["xau_ret_20d_atrd"] = (px - d1["c"].iloc[-21]) / atr_d

    # range intraday recenti
    if mm is not None and len(mm) >= 30:
        last60 = mm[mm.index >= t - pd.Timedelta(minutes=60)]
        last240 = mm[mm.index >= t - pd.Timedelta(minutes=240)]
        if len(last60) >= 10:
            f["xau_range_1h_atrh"] = (last60.h.max() - last60.l.min()) / atr_h
            r = np.diff(np.log(last60.c.to_numpy()))
            f["xau_rv_1h_vs_atr"] = (np.std(r) * np.sqrt(60) * px) / atr_h if len(r) > 5 else np.nan
        if len(last240) >= 30:
            f["xau_range_4h_atrd"] = (last240.h.max() - last240.l.min()) / atr_d

    # medie mobili
    f["xau_dist_ema20h_atrh"] = (px - h1["ema20"].iloc[-1]) / atr_h
    f["xau_dist_ema100h_atrh"] = (px - h1["ema100"].iloc[-1]) / atr_h
    f["xau_dist_ema50d_atrd"] = (px - d1["ema50"].iloc[-1]) / atr_d
    f["xau_dist_ema200d_atrd"] = (px - d1["ema200"].iloc[-1]) / atr_d
    f["xau_ema50d_slope5_atrd"] = (d1["ema50"].iloc[-1] - d1["ema50"].iloc[-6]) / atr_d

    # livelli: giorno precedente, giorno corrente, settimana, 20 giorni
    pdh, pdl = d1["h"].iloc[-1], d1["l"].iloc[-1]
    f["xau_dist_pdh_atrd"] = (px - pdh) / atr_d
    f["xau_dist_pdl_atrd"] = (px - pdl) / atr_d
    f["xau_pos_prevday"] = (px - pdl) / (pdh - pdl) if pdh > pdl else np.nan
    td_now = trading_day_index(pd.DatetimeIndex([t]))[0]
    today = h1[trading_day_index(h1.index) == td_now]
    if mm is not None and len(mm):
        mtoday = mm[trading_day_index(mm.index) == td_now]
    else:
        mtoday = today
    if len(mtoday):
        dh, dl = max(mtoday.h.max(), px), min(mtoday.l.min(), px)
        f["xau_pos_day"] = (px - dl) / (dh - dl) if dh > dl else 0.5
        f["xau_day_range_atrd"] = (dh - dl) / atr_d
        f["xau_sweep_pdh"] = float(dh > pdh and px < pdh)
        f["xau_sweep_pdl"] = float(dl < pdl and px > pdl)
    hi20, lo20 = d1["hi20"].iloc[-1], d1["lo20"].iloc[-1]
    f["xau_pos_20d"] = (px - lo20) / (hi20 - lo20) if hi20 > lo20 else np.nan
    f["xau_breakout_20d"] = float(px > hi20) - float(px < lo20)
    # settimana corrente (da domenica sera NY) e settimana precedente
    wk = pd.Timestamp(td_now) - pd.Timedelta(days=pd.Timestamp(td_now).weekday())
    wk_days = d1[pd.to_datetime(d1.index) >= wk]
    wh = max([px] + ([wk_days.h.max()] if len(wk_days) else []) + ([mtoday.h.max()] if len(mtoday) else []))
    wl = min([px] + ([wk_days.l.min()] if len(wk_days) else []) + ([mtoday.l.min()] if len(mtoday) else []))
    f["xau_pos_week"] = (px - wl) / (wh - wl) if wh > wl else 0.5
    prev_wk = d1[(pd.to_datetime(d1.index) >= wk - pd.Timedelta(days=7)) & (pd.to_datetime(d1.index) < wk)]
    if len(prev_wk):
        f["xau_dist_pwh_atrd"] = (px - prev_wk.h.max()) / atr_d
        f["xau_dist_pwl_atrd"] = (px - prev_wk.l.min()) / atr_d

    # sessioni (UTC): Asia 00-07, Londra 07-12
    if mm is not None and len(mm):
        day0 = t.normalize()
        asia = mm[(mm.index >= day0) & (mm.index < day0 + pd.Timedelta(hours=7))]
        lon = mm[(mm.index >= day0 + pd.Timedelta(hours=7)) & (mm.index < day0 + pd.Timedelta(hours=12))]
        if len(asia) >= 60:
            ah, al = asia.h.max(), asia.l.min()
            f["xau_dist_asia_hi_atrh"] = (px - ah) / atr_h
            f["xau_dist_asia_lo_atrh"] = (px - al) / atr_h
            if len(lon) >= 30:
                f["xau_sweep_asia_hi"] = float(lon.h.max() > ah and px < ah)
                f["xau_sweep_asia_lo"] = float(lon.l.min() < al and px > al)
        if len(lon) >= 30:
            f["xau_dist_london_hi_atrh"] = (px - lon.h.max()) / atr_h
            f["xau_dist_london_lo_atrh"] = (px - lon.l.min()) / atr_h
    return f


def dxy_features(ctx: MarketContext, eur_m1: pd.DataFrame | None, t: pd.Timestamp) -> dict:
    f: dict[str, float] = {}
    s = ctx.dxy_h1
    end = s.index.searchsorted(t - H1, side="right")
    s = s.iloc[:end]
    if len(s) < 600:
        return f
    lv = np.log(s)
    f["dxy_ret_4h_pct"] = (lv.iloc[-1] - lv.iloc[-5]) * 100
    f["dxy_ret_24h_pct"] = (lv.iloc[-1] - lv.iloc[-25]) * 100
    f["dxy_ret_5d_pct"] = (lv.iloc[-1] - lv.iloc[-121]) * 100
    f["dxy_ret_20d_pct"] = (lv.iloc[-1] - lv.iloc[-481]) * 100
    win = s.iloc[-480:]
    f["dxy_pos_20d"] = (s.iloc[-1] - win.min()) / (win.max() - win.min())
    if eur_m1 is not None and len(eur_m1):
        mm = MarketContext.m1_until(eur_m1, t)
        if len(mm):
            j = mm.index.searchsorted(t - pd.Timedelta(minutes=61), side="right") - 1
            if j >= 0 and (t - (mm.index[-1] + M1)) < pd.Timedelta(minutes=30):
                f["usd_ret_1h_pct"] = -(np.log(mm.c.iloc[-1]) - np.log(mm.c.iloc[j])) * 100
    return f


def rates_features(ctx: MarketContext, t: pd.Timestamp) -> dict:
    f: dict[str, float] = {}
    r = ctx.daily_asof(ctx.rates, t)
    if r is not None and len(r) > 130:
        for c in ("y3m", "y2y", "y10y", "r10y"):
            if c in r:
                f[c] = _last(r[c].dropna())
        f["slope_2s10s"] = f.get("y10y", np.nan) - f.get("y2y", np.nan)
        f["y2_minus_3m"] = f.get("y2y", np.nan) - f.get("y3m", np.nan)
        f["y2y_chg_1d"] = _chg(r["y2y"], 1)
        f["y2y_chg_5d"] = _chg(r["y2y"], 5)
        f["y10y_chg_5d"] = _chg(r["y10y"], 5)
        f["r10y_chg_5d"] = _chg(r["r10y"], 5) if "r10y" in r else np.nan
        f["y2y_chg_20d"] = _chg(r["y2y"], 20)
        f["y3m_chg_126d"] = _chg(r["y3m"], 126)
        f["rates_age_days"] = (t.date() - r.index[-1]).days
    v = ctx.daily_asof(ctx.vix, t)
    if v is not None and len(v) > 260:
        f["vix"] = v["vix"].iloc[-1]
        f["vix_chg_5d"] = _chg(v["vix"], 5)
        f["vix_pct_1y"] = (v["vix"].iloc[-252:] < v["vix"].iloc[-1]).mean()
    c = ctx.daily_asof(ctx.cot, t)
    if c is not None and len(c) > 160:
        f["cot_mm_net_pct_oi"] = c["cot_mm_net_pct_oi"].iloc[-1]
        f["cot_mm_chg_4w"] = _chg(c["cot_mm_net_pct_oi"], 4)
        f["cot_mm_pct_3y"] = (c["cot_mm_net_pct_oi"].iloc[-156:] < c["cot_mm_net_pct_oi"].iloc[-1]).mean()
        f["cot_age_days"] = (t.date() - c.index[-1]).days
    return f


def macro_features(prior: list[dict]) -> dict:
    """``prior``: comunicati CPI usciti prima di t, dal più recente, con i valori as-published."""
    f: dict[str, float] = {}
    if not prior:
        return f
    last = prior[0]["values"]

    def mom(v: dict, key: str, k: int):
        return v.get(f"{key}_mom_{k}", np.nan)

    for key in ("cpi", "core"):
        m = [mom(last, key, k) for k in range(7)]
        f[f"{key}_mom_last"] = m[0]
        f[f"{key}_yoy_last"] = last.get(f"{key}_yoy", np.nan)
        f[f"{key}_mom_avg3"] = np.nanmean(m[:3]) if np.isfinite(m[:3]).any() else np.nan
        f[f"{key}_mom_avg6"] = np.nanmean(m[:6]) if np.isfinite(m[:6]).any() else np.nan
        f[f"{key}_accel"] = m[0] - f[f"{key}_mom_avg6"]
        f[f"{key}_accel_3v3"] = (np.nanmean(m[:3]) - np.nanmean(m[3:6])
                                 if np.isfinite(m[:3]).any() and np.isfinite(m[3:6]).any() else np.nan)
    if len(prior) > 3:
        f["core_yoy_chg_3m"] = f["core_yoy_last"] - prior[3]["values"].get("core_yoy", np.nan)
    if len(prior) > 12:
        f["core_yoy_chg_12m"] = f["core_yoy_last"] - prior[12]["values"].get("core_yoy", np.nan)
    # reazioni dell'oro ai CPI precedenti (note: ogni esito è pubblico da T0+60s)
    dirs = [p["direction"] for p in prior if p.get("direction") in ("BULLISH", "BEARISH")]
    sgn = [1.0 if d == "BULLISH" else -1.0 for d in dirs]
    if sgn:
        f["prev_reaction"] = sgn[0]
        f["prev_reactions_mean6"] = float(np.mean(sgn[:6]))
    moves = [abs(p["move_pips"]) for p in prior[:6] if p.get("move_pips") is not None]
    if moves:
        f["prev_abs_move_median6_pips"] = float(np.median(moves))
    f["days_since_prev_release"] = prior[0].get("days_before", np.nan)
    return f


def build_context(xau_h1: pd.DataFrame, fx_h1: dict[str, pd.DataFrame], rates: pd.DataFrame,
                  vix: pd.DataFrame, cot: pd.DataFrame) -> MarketContext:
    def ns(df):
        df = df.copy()
        df.index = pd.DatetimeIndex(df.index).as_unit("ns")
        return df

    xau_h1 = ns(xau_h1)
    fx_h1 = {k: ns(v) for k, v in fx_h1.items()}
    closes = pd.DataFrame({s: df["c"] for s, df in fx_h1.items()}).sort_index().astype(float).ffill().dropna()
    dxy = synthetic_dxy(closes)
    return MarketContext(
        xau_h1=enrich_h1(xau_h1), xau_d1=daily_from_h1(xau_h1), dxy_h1=dxy,
        rates=rates, vix=vix, cot=cot,
    )


def snapshot(ctx: MarketContext, t: datetime, xau_m1: pd.DataFrame | None, eur_m1: pd.DataFrame | None,
             prior_releases: list[dict]) -> dict:
    tt = pd.Timestamp(t).tz_convert(UTC) if pd.Timestamp(t).tzinfo else pd.Timestamp(t, tz=UTC)
    tt = tt.floor("s").as_unit("ns")
    if xau_m1 is not None and len(xau_m1):
        xau_m1 = xau_m1.copy()
        xau_m1.index = pd.DatetimeIndex(xau_m1.index).as_unit("ns")
    if eur_m1 is not None and len(eur_m1):
        eur_m1 = eur_m1.copy()
        eur_m1.index = pd.DatetimeIndex(eur_m1.index).as_unit("ns")
    f = {}
    f.update(xau_features(ctx, xau_m1, tt))
    f.update(dxy_features(ctx, eur_m1, tt))
    f.update(rates_features(ctx, tt))
    f.update(macro_features(prior_releases))
    return f
