"""Test dell'occhio di Davide (docs/TEST-OCCHIO-DAVIDE.md): per ogni NFP degli ultimi 3 anni una schermata ferma alle
14:29:00 (ora italiana), con Daily, H4, H1 e M30 come su MT5, senza data. La chiave (cos'è successo dopo) va in un file
a parte che si legge solo dopo la risposta di Davide.

Uso: python scripts/screen_nfp.py            -> chiave + tutte le schermate
     python scripts/screen_nfp.py 1 5        -> solo le schermate dalla 1 alla 5"""
import json
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import matplotlib  # noqa: E402

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402
from matplotlib.patches import Rectangle  # noqa: E402

from descr_nfp_minuto import NY, SYM, nfp_lista  # noqa: E402
from hx38_stop_contro import eventi  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

DA = pd.Timestamp("2023-11-01", tz="UTC")
OUT = get_settings().research_dir / "phase2" / "screen_nfp"
PANNELLI = [("Daily", "1D", 30), ("H4", "4h", 60), ("H1", "1h", 72), ("M30", "30min", 48)]


def broker(idx):
    """Ora del server del broker (New York + 7 h): giorni e H4 come su MT5 PU Prime."""
    return (idx.tz_convert(NY) + pd.Timedelta(hours=7)).tz_localize(None)


def serie(duka, t0):
    """Candele fino alle 14:29:00 italiane (ultima M1 completa: quella delle 14:28), in ora del broker."""
    fine = t0 - pd.Timedelta(minutes=1)
    m1 = duka.m1_range(SYM, (t0 - pd.Timedelta(days=2)).date(), t0.date())
    m1 = m1[m1.index < fine]
    h1 = duka.h1_range(SYM, (t0 - timedelta(days=45)).date(), t0.date())
    h1 = h1[h1.index < m1.index[0].floor("h")]
    tutto = pd.concat([h1, m1]).sort_index()
    tutto.index = broker(tutto.index)
    return tutto


def ricampiona(df, regola):
    g = df.resample(regola, label="left", closed="left", origin="start_day")
    out = pd.DataFrame({"o": g.o.first(), "h": g.h.max(), "l": g.l.min(), "c": g.c.last()}).dropna()
    return out[out.index.dayofweek != 5] if regola == "1D" else out  # niente sabato


def candele(ax, b, titolo, ore):
    for i, (ts, r) in enumerate(b.iterrows()):
        su = r.c >= r.o
        col = "#139c72" if su else "#d64545"
        ax.plot([i, i], [r.l, r.h], color=col, lw=0.8, zorder=1)
        ax.add_patch(Rectangle((i - 0.35, min(r.o, r.c)), 0.7, max(abs(r.c - r.o), 1e-6), facecolor=col, edgecolor=col, lw=0.6, zorder=2))
    i = len(b) - 1
    ax.add_patch(Rectangle((i - 0.5, b.l.iloc[-1]), 1.0, b.h.iloc[-1] - b.l.iloc[-1], fill=False, ls="--", lw=0.8, edgecolor="#555", zorder=3))
    ax.set_xlim(-1, len(b) + 1)
    ax.set_title(f"{titolo}  (ultima candela ancora in formazione)", fontsize=10, loc="left")
    ax.yaxis.tick_right()
    ax.grid(alpha=0.25)
    if ore:  # ora italiana sulle candele intraday, senza la data
        step = max(1, len(b) // 8)
        pos = list(range(0, len(b), step))
        lab = [(pd.Timestamp(b.index[p]) - pd.Timedelta(hours=7)).tz_localize(NY).tz_convert("Europe/Rome").strftime("%H:%M") for p in pos]
        ax.set_xticks(pos, lab, fontsize=8)
    else:
        ax.set_xticks([])


def schermata(df, n, path):
    fig, axs = plt.subplots(2, 2, figsize=(14, 8.5))
    for ax, (nome, regola, k) in zip(axs.flat, PANNELLI, strict=True):
        b = ricampiona(df, regola).tail(k)
        candele(ax, b, nome, ore=nome in ("H1", "M30"))
    fig.suptitle(f"NFP #{n} — fermo alle 14:29:00 ora italiana (la news esce alle 14:30). Data nascosta.", fontsize=12)
    fig.tight_layout()
    fig.savefig(path, dpi=110)
    plt.close(fig)


def chiave(duka, lista):
    regola = {e["id"]: e["rule"] for e in eventi()}
    righe = []
    for n, t0 in enumerate(lista, 1):
        m1 = duka.m1_range(SYM, t0.date(), t0.date())
        rif = m1.loc[t0 - pd.Timedelta(minutes=1), "c"]  # prezzo alle 14:30:00, appena prima del dato
        c1 = m1.loc[t0, "c"]
        c5 = m1[(m1.index >= t0) & (m1.index < t0 + pd.Timedelta(minutes=5))].c.iloc[-1]
        righe.append({"n": n, "data": str(t0.tz_convert("Europe/Rome").date()), "ora_it": t0.tz_convert("Europe/Rome").strftime("%H:%M"),
                      "m1": "LONG" if c1 > rif else "SHORT", "m1_pips": round((c1 - rif) * 10),
                      "m5": "LONG" if c5 > rif else "SHORT", "m5_pips": round((c5 - rif) * 10),
                      "sito": regola.get(f"NFP_{t0.date()}")})
    return righe


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    duka = DukascopyProvider()
    lista = [t for t in nfp_lista() if t >= DA]
    if not (OUT / "chiave.json").exists():
        (OUT / "chiave.json").write_text(json.dumps(chiave(duka, lista), indent=1, ensure_ascii=False), encoding="utf-8")
    a, b = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) == 3 else (1, len(lista))
    for n in range(a, b + 1):
        schermata(serie(duka, lista[n - 1]), n, OUT / f"nfp_{n:02d}.png")
        print("schermata", n, flush=True)
