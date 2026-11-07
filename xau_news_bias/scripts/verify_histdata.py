"""Controllo indipendente: le candele M1 delle NFP da Dukascopy contro quelle di HistData.com.

HistData: XAUUSD M1 gratuito, file in data/cache/histdata/. Il sito dice "EST senza ora legale", ma
l'orario segue l'ora legale europea: ora del file = ora di Berlino - 6 h (verificato sulla pausa
giornaliera 17:00-18:00 e sulle NFP di fine ottobre/inizio novembre, quando USA ed Europa differiscono).
Per ogni NFP si confrontano la candela prima (T0-60 s) e la candela della news (T0), costruite dai
tick bid Dukascopy, con le stesse candele di HistData.
"""
import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402


def load_histdata(folder: Path) -> pd.DataFrame:
    parts = []
    for z in sorted(folder.glob("xau_*.zip")):
        with zipfile.ZipFile(z) as f:
            name = [n for n in f.namelist() if n.endswith(".csv")][0]
            df = pd.read_csv(f.open(name), sep=";", header=None, names=["t", "o", "h", "l", "c", "v"])
        parts.append(df)
    df = pd.concat(parts, ignore_index=True)
    loc = (pd.to_datetime(df.t, format="%Y%m%d %H%M%S") + pd.Timedelta(hours=6)).dt.tz_localize(
        "Europe/Berlin", ambiguous="NaT", nonexistent="NaT")
    df["utc"] = loc.dt.tz_convert("UTC")
    df = df.dropna(subset=["utc"])
    return df.drop_duplicates("utc").set_index("utc").sort_index()[["o", "h", "l", "c"]]


def duka_m1(e: dict, k: int):
    """Candela bid da 1 minuto numero k (0 = minuto della news) dalle candele 5 s del sito."""
    vs = [v for b, v in zip(BINS, e["c"]) if v and b // 60 == k]
    if not vs:
        return None
    ref = e["ref"]
    return [ref + vs[0][0] / 100, ref + max(v[1] for v in vs) / 100, ref + min(v[2] for v in vs) / 100, ref + vs[-1][3] / 100]


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx8" / "nfp_site.json").read_text())
    BINS = site["bins"]
    hd = load_histdata(get_settings().data_dir / "cache" / "histdata")
    rows = []
    for e in site["ev"]:
        t0 = pd.Timestamp(e["d"], tz="UTC")
        if t0 not in hd.index or (t0 - pd.Timedelta(minutes=1)) not in hd.index:
            rows.append({"id": e["id"], "histdata": False})
            continue
        h_prev, h_news = hd.loc[t0 - pd.Timedelta(minutes=1)], hd.loc[t0]
        d_prev, d_news = duka_m1(e, -1), duka_m1(e, 0)
        rows.append({
            "id": e["id"], "histdata": True,
            # movimento della candela della news: chiusura news - chiusura candela prima (pips)
            "mv_duka": round((d_news[3] - d_prev[3]) * 10), "mv_hd": round((h_news.c - h_prev.c) * 10),
            # dal tuo ingresso alla chiusura: chiusura news - apertura candela prima
            "tr_duka": round((d_news[3] - d_prev[0]) * 10), "tr_hd": round((h_news.c - h_prev.o) * 10),
            # ampiezza della candela della news
            "rg_duka": round((d_news[1] - d_news[2]) * 10), "rg_hd": round((h_news.h - h_news.l) * 10),
            "close_duka": round(d_news[3], 2), "close_hd": round(float(h_news.c), 2),
        })
    df = pd.DataFrame(rows)
    ok = df[df.histdata == True].copy()  # noqa: E712
    ok["dir_ok"] = np.sign(ok.mv_duka) == np.sign(ok.mv_hd)
    out = {"nfp": len(df), "con_histdata": int(len(ok)),
           "direzione_uguale": float(ok.dir_ok.mean()),
           "corr_movimento": float(np.corrcoef(ok.mv_duka, ok.mv_hd)[0, 1]),
           "diff_mediana_movimento_pips": float((ok.mv_duka - ok.mv_hd).abs().median()),
           "diff_mediana_ampiezza_pips": float((ok.rg_duka - ok.rg_hd).abs().median()),
           "diff_mediana_chiusura_pips": float(((ok.close_duka - ok.close_hd).abs() * 10).median()),
           "ampiezza_media_duka": float(ok.rg_duka.mean()), "ampiezza_media_hd": float(ok.rg_hd.mean()),
           "eventi": ok.to_dict("records")}
    (R / "hx8" / "verify_histdata.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    print({k: v for k, v in out.items() if k != "eventi"})
    print(ok[ok.id >= "NFP_2023-10"].to_string())
    print(ok.sort_values("id").assign(dd=lambda x: (x.mv_duka - x.mv_hd).abs()).nlargest(8, "dd")[["id", "mv_duka", "mv_hd", "rg_duka", "rg_hd"]])
