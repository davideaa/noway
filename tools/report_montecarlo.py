#!/usr/bin/env python3
"""
Genera un PDF per un dato livello di rischio: cosa dice il Monte Carlo,
tradotto in italiano leggibile.

I percentili sono espressi come "nel X% dei casi": e' la stessa cosa dei
percentili, detta in un modo che si puo' usare per decidere.
"""
import re, html, sys, math
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Rectangle

# --- palette validata (dataviz reference, light mode) -----------------
BLU      = '#2a78d6'
ARANCIO  = '#eb6834'
INK      = '#0b0b0b'
INK2     = '#52514e'
INK3     = '#8a8880'
SURFACE  = '#fcfcfb'
GRIGLIA  = '#e4e3de'

plt.rcParams.update({
    'font.family': 'DejaVu Sans', 'font.size': 9,
    'axes.edgecolor': GRIGLIA, 'axes.labelcolor': INK2,
    'xtick.color': INK2, 'ytick.color': INK2,
    'axes.facecolor': SURFACE, 'figure.facecolor': SURFACE,
    'axes.spines.top': False, 'axes.spines.right': False,
})

def carica_R(path, rischio_test):
    """Rendimento di ogni trade in multipli di R, dal report MT5."""
    raw = open(path, encoding='utf-16', errors='ignore').read()
    if '<html' not in raw.lower():
        raw = open(path, encoding='utf-8', errors='ignore').read()
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', raw, re.S)
    cl = lambda r: [html.unescape(re.sub(r'<[^>]+>', '', x)).strip()
                    for x in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.S)]
    h = next(i for i, r in enumerate(rows) if 'Direzione' in cl(r))
    R, prec = [], 10000.0
    for r in rows[h + 1:]:
        c = cl(r)
        if len(c) < 13 or c[4] != 'out':
            continue
        b = float(c[11].replace(' ', '').replace(' ', ''))
        R.append((b / prec - 1.0) / rischio_test)
        prec = b
    return np.array(R)

def percorsi(R, rischio, n_sim=20000, blocco=20, seed=1, checkpoint=25):
    """Bootstrap a blocchi. Restituisce equity ai checkpoint e drawdown
    massimo di ogni percorso.

    A blocchi e non a caso puro: dentro un blocco l'ordine resta, quindi
    le serie di perdite sopravvivono al rimescolamento. Spezzarle
    farebbe sembrare il drawdown piu' piccolo di quello che e'."""
    rng = np.random.default_rng(seed)
    n = len(R)
    nb = int(np.ceil(n / blocco))
    idx_cp = np.arange(0, n, checkpoint)
    eq_cp, dd_max = [], []
    for start in range(0, n_sim, 1000):
        m = min(1000, n_sim - start)
        partenze = rng.integers(0, n, size=(m, nb))
        off = np.arange(blocco)
        seq = R[(partenze[:, :, None] + off[None, None, :]) % n].reshape(m, -1)[:, :n]
        eq = np.cumprod(1.0 + seq * rischio, axis=1)
        picco = np.maximum.accumulate(eq, axis=1)
        dd_max.append((1.0 - eq / picco).max(axis=1))
        eq_cp.append(eq[:, idx_cp])
    return np.vstack(eq_cp), np.concatenate(dd_max), idx_cp

def it(x, dec=0):
    """Numero all'italiana: virgola per i decimali, punto per le migliaia."""
    return f"{x:,.{dec}f}".replace(',', '\x00').replace('.', ',').replace('\x00', '.')

def pagina_sintesi(pdf, rischio, eq_fin, dd, reale, anni, n_trade):
    fig = plt.figure(figsize=(8.27, 11.69))
    fig.text(.08, .945, f"Portafoglio oro — rischio {it(rischio*100,2)}% per operazione",
             fontsize=19, color=INK, weight='bold')
    fig.text(.08, .922, f"{it(len(eq_fin))} scenari simulati su {it(n_trade)} operazioni reali "
                        f"({it(anni,1)} anni)",
             fontsize=10, color=INK2)

    med_p = np.percentile(eq_fin, 50) - 1
    med_a = (np.percentile(eq_fin, 50)) ** (1 / anni) - 1
    med_d = np.percentile(dd, 50)

    # --- tre numeri grandi
    y = .845
    for x, val, lab in [(.08, f"+{100*med_p:.0f}%", f"guadagno tipico in {it(anni,1)} anni"),
                        (.40, f"{it(100*med_a,1)}%",  "all'anno"),
                        (.70, f"{it(100*med_d)}%",  "perdita massima tipica")]:
        fig.text(x, y, val, fontsize=27, color=BLU if '%' in val and val[0] == '+' else INK,
                 weight='bold')
        fig.text(x, y - .028, lab, fontsize=9, color=INK2)
    fig.text(.08, y - .058, "«Tipico» = il caso che sta esattamente a metà: "
                            "metà degli scenari è andata meglio, metà peggio.",
             fontsize=8.5, color=INK3, style='italic')

    def blocco_testo(y0, titolo, righe, colore):
        fig.text(.08, y0, titolo, fontsize=12.5, color=INK, weight='bold')
        fig.add_artist(Rectangle((.08, y0 - .008), .84, .0025,
                                 facecolor=colore, edgecolor='none',
                                 transform=fig.transFigure))
        for i, (sx, dx) in enumerate(righe):
            yy = y0 - .032 - i * .0235
            fig.text(.085, yy, sx, fontsize=10, color=INK2)
            fig.text(.90, yy, dx, fontsize=10.5, color=INK, weight='bold', ha='right')

    q = lambda p: np.percentile(dd, p)
    blocco_testo(.715, "Quanto puoi perdere (dal punto più alto del conto)", [
        ("Nella metà degli scenari la perdita massima è rimasta sotto",  f"{100*q(50):.0f}%"),
        ("In 7 scenari su 10 è rimasta sotto",                            f"{100*q(70):.0f}%"),
        ("In 9 scenari su 10 è rimasta sotto",                            f"{100*q(90):.0f}%"),
        ("In 19 scenari su 20 è rimasta sotto",                           f"{100*q(95):.0f}%"),
        ("Solo in 1 scenario su 100 ha superato",                         f"{100*q(99):.0f}%"),
        ("", ""),
        ("Nel backtest vero è stata",                                     f"{it(100*reale,1)}%"),
    ], ARANCIO)

    p = lambda x: np.percentile(eq_fin, x) - 1
    blocco_testo(.490, f"Quanto puoi guadagnare in {it(anni,1)} anni", [
        ("Nella metà degli scenari hai guadagnato almeno",  f"+{100*p(50):.0f}%"),
        ("In 3 scenari su 4 hai guadagnato almeno",         f"+{100*p(25):.0f}%"),
        ("In 19 su 20 hai guadagnato almeno",               f"+{100*p(5):.0f}%"),
        ("Nel miglior 5% degli scenari",                    f"+{100*p(95):.0f}%"),
        ("", ""),
        ("Scenari finiti in perdita",
         f"{it(100*np.mean(eq_fin < 1),1)}%"),
    ], BLU)

    fig.text(.08, .268, "Come leggere questi numeri", fontsize=12.5, color=INK, weight='bold')
    testo = (
        "Ho preso le 2.478 operazioni vere del backtest e le ho rimescolate 20.000 volte, a blocchi,\n"
        "ottenendo 20.000 storie alternative altrettanto plausibili di quella capitata davvero.\n\n"
        "Il backtest è UNA storia. Il Monte Carlo mostra tutte quelle che potevano capitare con le stesse\n"
        "operazioni in ordine diverso: risponde a «quanto può andare male», non a «quanto è andata\n"
        "male questa volta». A blocchi e non a caso puro, così le serie di perdite consecutive\n"
        "sopravvivono al rimescolamento: spezzandole, il drawdown sembrerebbe più piccolo del vero.\n\n"
        "Attenzione: queste cifre usano il rendimento medio di TUTTO il 2019-2026, che comprende i\n"
        "cinque anni su cui i parametri sono stati scelti. Sul periodo mai visto prima (2024-2026) il\n"
        "rendimento per operazione è stato circa un terzo più basso."
    )
    fig.text(.08, .249, testo, fontsize=9.3, color=INK2, va='top', linespacing=1.65)
    fig.text(.08, .045, "Simulazione su dati storici. Non è una previsione: il passato non garantisce il futuro.",
             fontsize=8, color=INK3, style='italic')
    pdf.savefig(fig); plt.close(fig)

def pagina_curva(pdf, rischio, eq, idx_cp, anni, dep=10000.0):
    fig, ax = plt.subplots(figsize=(8.27, 5.4))
    fig.subplots_adjust(left=.11, right=.95, top=.80, bottom=.13)
    x = idx_cp / idx_cp[-1] * anni
    p05, p25, p50, p75, p95 = [np.percentile(eq, q, axis=0) * dep for q in (5, 25, 50, 75, 95)]

    ax.fill_between(x, p05, p95, color=BLU, alpha=.13, lw=0,
                    label='19 scenari su 20 stanno qui dentro')
    ax.fill_between(x, p25, p75, color=BLU, alpha=.28, lw=0,
                    label='metà degli scenari sta qui dentro')
    ax.plot(x, p50, color=BLU, lw=2.2, label='scenario tipico (la mediana)', solid_capstyle='round')
    ax.axhline(dep, color=INK3, lw=1, ls=(0, (4, 4)))

    ax.text(x[-1], p50[-1], "  " + it(p50[-1]),
            color=BLU, fontsize=10.5, weight='bold', va='center')
    ax.text(x[-1], p95[-1], "  " + it(p95[-1]),
            color=INK3, fontsize=8.5, va='center')
    ax.text(x[-1], p05[-1], "  " + it(p05[-1]),
            color=INK3, fontsize=8.5, va='center')

    ax.set_xlim(0, anni * 1.13); ax.set_ylim(dep * .78, p95[-1] * 1.07)
    ax.set_xlabel('anni'); ax.set_ylabel('saldo del conto (€)')
    ax.grid(axis='y', color=GRIGLIA, lw=.8); ax.set_axisbelow(True)
    ax.yaxis.set_major_formatter(lambda v, _: it(v))
    ax.legend(frameon=False, loc='upper left', fontsize=9, labelcolor=INK2)

    fig.text(.08, .93, "Dove va il conto, partendo da 10.000 €",
             fontsize=15, color=INK, weight='bold')
    fig.text(.08, .885, f"Rischio {it(rischio*100,2)}% per operazione. La linea piena è lo scenario tipico; "
                        "le fasce\nmostrano dove finisce la maggior parte degli altri.",
             fontsize=9.3, color=INK2, va='top', linespacing=1.5)
    pdf.savefig(fig); plt.close(fig)

def pagina_drawdown(pdf, rischio, dd, reale):
    fig, ax = plt.subplots(figsize=(8.27, 5.4))
    fig.subplots_adjust(left=.11, right=.95, top=.80, bottom=.13)
    gr = np.arange(1, 100)
    val = np.percentile(dd, gr) * 100

    ax.fill_between(gr, 0, val, color=ARANCIO, alpha=.14, lw=0)
    ax.plot(gr, val, color=ARANCIO, lw=2.2, solid_capstyle='round')
    ax.axhline(35, color=INK3, lw=1.2, ls=(0, (5, 4)))
    ax.text(2, 35.9, 'il tuo limite: 35%', fontsize=8.8, color=INK2)
    ax.axhline(reale * 100, color=BLU, lw=1.2, ls=(0, (2, 3)))
    ax.text(2, reale * 100 + .9, f'backtest vero: {it(100*reale,1)}%', fontsize=8.8, color=BLU)

    for g in (50, 70, 90, 95):
        v = np.percentile(dd, g) * 100
        ax.plot([g], [v], 'o', ms=8, color=ARANCIO, mec=SURFACE, mew=2, zorder=5)
        ax.annotate(f"{v:.0f}%", (g, v), textcoords='offset points', xytext=(0, 11),
                    ha='center', fontsize=10, color=INK, weight='bold')

    ax.set_xlim(0, 100); ax.set_ylim(0, max(val.max() * 1.12, 40))
    ax.set_xlabel('in questa percentuale di scenari la perdita è rimasta sotto…')
    ax.set_ylabel('perdita massima dal picco (%)')
    ax.grid(axis='y', color=GRIGLIA, lw=.8); ax.set_axisbelow(True)
    ax.xaxis.set_major_formatter(lambda v, _: f"{v:.0f}%")
    ax.yaxis.set_major_formatter(lambda v, _: f"{v:.0f}%")

    fig.text(.08, .93, "Quanto può scendere il conto", fontsize=15, color=INK, weight='bold')
    fig.text(.08, .885,
             "Si legge da sinistra. Nel 70% degli scenari la perdita massima è rimasta sotto il valore\n"
             "segnato a 70. La curva sale piano fino a circa 90 e poi impenna: il rischio vero sta in fondo.",
             fontsize=9.3, color=INK2, va='top', linespacing=1.5)
    pdf.savefig(fig); plt.close(fig)

if __name__ == '__main__':
    sorgente = sys.argv[1]
    rischi   = [float(a) for a in sys.argv[2:]] or [0.007, 0.008]
    n_sim    = 20000
    anni     = 7.71

    R = carica_R(sorgente, 0.008)
    print(f"{len(R)} operazioni caricate, somma {R.sum():.1f} R")

    for f in rischi:
        eq, dd, idx = percorsi(R, f, n_sim=n_sim)
        eq_fin = eq[:, -1]
        # drawdown della sequenza vera, allo stesso rischio
        e = np.cumprod(1 + R * f); ddr = float((1 - e / np.maximum.accumulate(e)).max())
        out = f"report/montecarlo-rischio-{f*100:.2f}.pdf"
        with PdfPages(out) as pdf:
            pagina_sintesi(pdf, f, eq_fin, dd, ddr, anni, len(R))
            pagina_curva(pdf, f, eq, idx, anni)
            pagina_drawdown(pdf, f, dd, ddr)
        print(f"  {out}   mediana +{100*(np.percentile(eq_fin,50)-1):.0f}%  "
              f"dd50 {100*np.percentile(dd,50):.1f}%  dd90 {100*np.percentile(dd,90):.1f}%  "
              f"dd95 {100*np.percentile(dd,95):.1f}%")
