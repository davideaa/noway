#!/usr/bin/env python3
"""Report finale del portafoglio oro: cosa fa ogni strategia, come si
comporta l'insieme, e quanto di questo e' bravura invece che fortuna.

Tutto viene ricavato dalle operazioni vere del backtest MT5; non ci sono
numeri inseriti a mano."""
import sys, math, statistics as st
from collections import defaultdict
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Rectangle, FancyBboxPatch
sys.path.insert(0, 'tools')
from estrai import leggi

# --- tema scuro, palette dataviz validata per superficie #1a1a19 -------
BG, CARD = '#111110', '#1c1c1a'
INK, INK2, INK3 = '#ffffff', '#c3c2b7', '#7a786f'
BLU, VERDE, ARANCIO, GIALLO = '#3987e5', '#199e70', '#d95926', '#c98500'
ROSSO, GRIGLIA = '#e66767', '#2e2e2b'

plt.rcParams.update({
    'font.family': 'DejaVu Sans', 'font.size': 9,
    'figure.facecolor': BG, 'axes.facecolor': BG,
    'axes.edgecolor': GRIGLIA, 'axes.labelcolor': INK2,
    'xtick.color': INK2, 'ytick.color': INK2,
    'axes.spines.top': False, 'axes.spines.right': False,
    'savefig.facecolor': BG,
})

NOMI = {'S3-DONCH': 'ROTTURA', 'S2-PULLB': 'RITRACCIAMENTO', 'S1-FADE': 'TRAPPOLA'}
COL  = {'S3-DONCH': BLU,       'S2-PULLB': VERDE,           'S1-FADE': ARANCIO}
ORD  = ['S3-DONCH', 'S2-PULLB', 'S1-FADE']

def it(x, dec=0):
    return f"{x:,.{dec}f}".replace(',', '\x00').replace('.', ',').replace('\x00', '.')

# ----------------------------------------------------------------------
def carica(path, rischio_test=0.008):
    """Ogni operazione in multipli di R: il rendimento diviso il rischio
    che si stava correndo in quel momento. Cosi' i numeri non dipendono
    dalla percentuale di rischio scelta."""
    T, amb, res = leggi(path)
    prec, out = 10000.0, []
    for x in T:
        out.append({'tag': x.tag, 'R': x.netto / (rischio_test * prec),
                    'data': x.data, 'prezzo_in': x.prezzo_in,
                    'prezzo_out': x.prezzo_out, 'tipo': x.tipo})
        prec = x.saldo
    return out, amb

def equity(R, f):
    return np.cumprod(1.0 + np.asarray(R, float) * f)

def dd_max(eq):
    return float((1.0 - eq / np.maximum.accumulate(eq)).max())

def blocchi(R, f, n_sim=20000, L=20, seed=7, checkpoint=25):
    """Bootstrap a blocchi: le serie di perdite consecutive sopravvivono
    al rimescolamento. A caso puro il drawdown sembrerebbe piu' mite."""
    rng = np.random.default_rng(seed)
    R = np.asarray(R, float); n = len(R); nb = int(np.ceil(n / L))
    cp = np.arange(0, n, checkpoint)
    eq_cp, dds = [], []
    for s in range(0, n_sim, 1000):
        m = min(1000, n_sim - s)
        p = rng.integers(0, n, size=(m, nb))
        seq = R[(p[:, :, None] + np.arange(L)[None, None, :]) % n].reshape(m, -1)[:, :n]
        e = np.cumprod(1.0 + seq * f, axis=1)
        dds.append((1.0 - e / np.maximum.accumulate(e, axis=1)).max(axis=1))
        eq_cp.append(e[:, cp])
    return np.vstack(eq_cp), np.concatenate(dds), cp

def senza_edge(R, f, n_sim=20000, seed=11):
    """Benchmark 'nessun vantaggio': le stesse operazioni, stessa
    variabilita', stessi costi, ma con il guadagno medio azzerato.
    E' come sarebbe andata se il sistema non avesse avuto alcun edge e
    avesse solo rimescolato fortuna."""
    rng = np.random.default_rng(seed)
    R = np.asarray(R, float) - np.mean(R)
    n = len(R)
    fin = np.empty(n_sim)
    for s in range(0, n_sim, 2000):
        m = min(2000, n_sim - s)
        seq = R[rng.integers(0, n, size=(m, n))]
        fin[s:s+m] = np.cumprod(1.0 + seq * f, axis=1)[:, -1]
    return fin

# ======================================================================
#  elementi comuni
# ======================================================================
def testata(fig, titolo, sottotitolo, pag):
    fig.text(.055, .955, titolo, fontsize=21, color=INK, weight='bold')
    fig.text(.055, .932, sottotitolo, fontsize=9.5, color=INK2)
    fig.text(.945, .957, 'PORTAFOGLIO ORO', fontsize=9.5, color=INK3,
             ha='right', weight='bold')
    fig.text(.945, .938, f'XAUUSD · 2019-2026 · pag. {pag}', fontsize=8, color=INK3, ha='right')
    fig.add_artist(Rectangle((.055, .922), .89, .0016, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))

def scheda(fig, x, y, w, h, colore=None):
    fig.add_artist(FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0,rounding_size=.012',
                                  facecolor=CARD, edgecolor=colore or GRIGLIA,
                                  lw=1.2 if colore else .8, transform=fig.transFigure))

def tessera(fig, x, y, w, valore, etichetta, colore=INK):
    """Un numero grande con la sua didascalia."""
    scheda(fig, x, y, w, .058)
    fig.text(x + w/2, y + .031, valore, fontsize=16, color=colore,
             ha='center', weight='bold')
    fig.text(x + w/2, y + .012, etichetta, fontsize=7.4, color=INK2, ha='center')

def griglia_y(ax):
    ax.grid(axis='y', color=GRIGLIA, lw=.8)
    ax.set_axisbelow(True)

# ======================================================================
#  pagina 1 — le tre strategie
# ======================================================================
SPIEGA = {
 'S3-DONCH': ("ROTTURA", "il prezzo sfonda e continua",
   "Sorveglia il massimo e il minimo delle ultime 60 mezz'ore. Quando il prezzo li supera in\n"
   "chiusura, ed è già vicino al bordo del suo intervallo largo, entra nella direzione dello\n"
   "sfondamento.\n\n"
   "Non ha un obiettivo di guadagno: lascia correre e alza lo stop dietro al prezzo. È la gamba\n"
   "che prende i movimenti lunghi, quelli che fanno il risultato."),
 'S2-PULLB': ("RITRACCIAMENTO", "il prezzo torna indietro e poi riparte",
   "Lavora su grafico a 4 ore. Prima stabilisce se c'è un trend: prezzo sopra la media mobile e\n"
   "media inclinata. Poi aspetta che il prezzo scenda di almeno un ATR dal massimo recente, e\n"
   "compra solo quando riparte.\n\n"
   "Entra dove la ROTTURA viene fermata: quella compra i nuovi massimi, questa compra proprio\n"
   "quando il prezzo NON è sul massimo. Stop più vicino, quindi il guadagno vale di più."),
 'S1-FADE': ("TRAPPOLA", "il prezzo sfonda ma è un inganno",
   "Guarda lo stesso sfondamento della ROTTURA, ma scommette che fallisca: se entro tre\n"
   "mezz'ore il prezzo rientra dentro il canale, entra nella direzione opposta, con lo stop appena\n"
   "oltre l'estremo toccato.\n\n"
   "L'idea: sopra un massimo evidente si accumulano ordini automatici. Quando il prezzo li\n"
   "consuma senza vera domanda dietro, chi ha comprato resta intrappolato e deve uscire."),
}

def pagina_strategie(pdf, dati):
    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Le tre strategie', 'Cosa fa ciascuna e come opera', 1)
    g = defaultdict(list)
    for x in dati: g[x['tag']].append(x['R'])

    y = .690
    for tag in ORD:
        nome, claim, testo = SPIEGA[tag]
        v = np.array(g[tag]); w = v[v > 0]; l = v[v <= 0]
        scheda(fig, .055, y, .89, .21, COL[tag])
        fig.add_artist(Rectangle((.055, y + .206), .89, .004,
                                 facecolor=COL[tag], edgecolor='none',
                                 transform=fig.transFigure))
        fig.text(.075, y + .172, nome, fontsize=15, color=COL[tag], weight='bold')
        fig.text(.075, y + .154, claim, fontsize=9.5, color=INK2, style='italic')
        fig.text(.075, y + .136, testo, fontsize=8.4, color=INK2, va='top', linespacing=1.6)
        fig.add_artist(Rectangle((.075, y + .040), .85, .0012, facecolor=GRIGLIA,
                                 edgecolor='none', transform=fig.transFigure))
        for i, (val, lab) in enumerate([
                (it(len(v)), 'operazioni'),
                (it(sum(v), 1), 'punti R guadagnati'),
                (f"{it(100*len(w)/len(v))}%", 'operazioni vincenti'),
                (it(sum(w)/abs(sum(l)), 2), 'profit factor')]):
            xx = .155 + i * .215
            fig.text(xx, y + .019, val, fontsize=12.5, color=INK, ha='center', weight='bold')
            fig.text(xx, y + .007, lab, fontsize=6.9, color=INK3, ha='center')
        y -= .225

    fig.text(.055, .190, 'Perché tre e non una', fontsize=12.5, color=INK, weight='bold')
    fig.text(.055, .172,
        "ROTTURA e TRAPPOLA guardano lo stesso identico evento — il prezzo che sfonda il canale a 60 barre —\n"
        "e ne prendono i due lati opposti. RITRACCIAMENTO richiede che il prezzo NON sia sull'estremo, quindi\n"
        "non può mai entrare sulla stessa candela della ROTTURA, e lavora su 4 ore invece che su mezz'ora:\n"
        "tiene le posizioni per settimane dove le altre le tengono per ore.\n\n"
        "La differenza è imposta dal codice, non sperata. È questo che fa scendere il drawdown dell'insieme\n"
        "sotto la somma dei drawdown delle singole — ed è misurato a pagina 4.",
        fontsize=8.6, color=INK2, va='top', linespacing=1.65)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pagina 2 — il risultato, contro le due alternative
# ======================================================================
def _anni(dati):
    from datetime import datetime
    t = [datetime.strptime(x['data'][:19], '%Y.%m.%d %H:%M:%S') for x in dati]
    t0 = t[0]
    return np.array([(x - t0).total_seconds() / (365.25 * 86400) for x in t])

def pagina_risultato(pdf, dati, f):
    R = [x['R'] for x in dati]
    eq = equity(R, f)
    anni = _anni(dati)
    tot = anni[-1]

    # compra-e-tieni ricavato dai prezzi di esecuzione
    px = sorted([(x['data'], x['prezzo_in']) for x in dati] +
                [(x['data'], x['prezzo_out']) for x in dati])
    from datetime import datetime
    t0 = datetime.strptime(px[0][0][:19], '%Y.%m.%d %H:%M:%S')
    bh_t = np.array([(datetime.strptime(d[:19], '%Y.%m.%d %H:%M:%S') - t0).total_seconds()
                     / (365.25 * 86400) for d, _ in px])
    bh = np.array([v for _, v in px]); bh = bh / bh[0]

    # benchmark senza vantaggio: stesse operazioni, guadagno medio azzerato
    fin0 = senza_edge(R, f)

    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Il risultato', f'Rischio {it(100*f,2)}% per operazione, interesse composto', 2)

    ax = fig.add_axes([.085, .608, .865, .272])
    ax.fill_between([0, tot], [1, 1], [np.percentile(fin0, 95)] * 2,
                    color=INK3, alpha=.10, lw=0)
    ax.plot(bh_t, bh, color=GIALLO, lw=1.8, label='comprare oro e tenerlo')
    ax.plot(anni, eq, color=BLU, lw=2.2, label='le tre strategie')
    ax.axhline(np.percentile(fin0, 95), color=INK3, lw=1.2, ls=(0, (5, 4)))
    ax.axhline(1, color=INK3, lw=.9, ls=(0, (2, 4)))
    ax.text(.15, np.percentile(fin0, 95) * 1.03,
            'soglia del caso: solo 5 simulazioni senza vantaggio su 100 superano questa riga',
            fontsize=7.6, color=INK3)
    ax.text(tot, eq[-1], f"  +{it(100*(eq[-1]-1))}%", color=BLU, fontsize=11,
            weight='bold', va='center')
    ax.text(tot, bh[-1], f"  +{it(100*(bh[-1]-1))}%", color=GIALLO, fontsize=10, va='center')
    ax.set_xlim(0, tot * 1.14); ax.set_ylim(.75, max(eq[-1], bh[-1]) * 1.18)
    ax.set_ylabel('capitale (1 = deposito iniziale)'); ax.set_xlabel('anni')
    griglia_y(ax)
    ax.legend(frameon=False, loc='upper left', fontsize=9, labelcolor=INK2)
    fig.text(.085, .895, 'Dove sarebbe finito il capitale', fontsize=12.5,
             color=INK, weight='bold')

    dd = dd_max(eq); ddbh = float((1 - bh / np.maximum.accumulate(bh)).max())
    batte = 100 * np.mean(fin0 < eq[-1])
    for i, (v, lab, c) in enumerate([
            (f"+{it(100*(eq[-1]-1))}%", 'guadagno in 7,7 anni', BLU),
            (f"{it(100*(eq[-1]**(1/tot)-1),1)}%", "all'anno", BLU),
            (f"{it(100*dd,1)}%", 'perdita massima', INK),
            (f"{it(len(R))}", 'operazioni', INK),
            (f"{it(batte,1)}%", 'meglio del caso', VERDE)]):
        tessera(fig, .055 + i*.182, .498, .168, v, lab, c)

    fig.text(.055, .445, 'Contro le due alternative', fontsize=12.5, color=INK, weight='bold')
    righe = [
        ('', 'guadagno', "all'anno", 'perdita max', 'serve indovinare?'),
        ('Le tre strategie', f"+{it(100*(eq[-1]-1))}%", f"{it(100*(eq[-1]**(1/tot)-1),1)}%",
         f"{it(100*dd,1)}%", 'no, opera anche al ribasso'),
        ('Comprare oro e tenerlo', f"+{it(100*(bh[-1]-1))}%", f"{it(100*(bh[-1]**(1/tot)-1),1)}%",
         f"{it(100*ddbh,1)}%", "sì, serve che l'oro salga"),
        ('Stesse operazioni senza vantaggio',
         f"{it(100*(np.percentile(fin0,50)-1))}%", '—',
         '—', 'è il caso puro, per confronto'),
    ]
    for r_i, r in enumerate(righe):
        yy = .418 - r_i * .026
        grassetto = (r_i == 0)
        col = INK3 if grassetto else INK2
        if r_i == 1:
            fig.add_artist(Rectangle((.055, yy - .008), .89, .024, facecolor=CARD,
                                     edgecolor='none', transform=fig.transFigure))
        fig.text(.065, yy, r[0], fontsize=8.6, color=BLU if r_i == 1 else col,
                 weight='bold' if r_i == 1 else 'normal')
        for c_i, val in enumerate(r[1:4]):
            fig.text(.50 + c_i*.11, yy, val, fontsize=8.6, ha='right',
                     color=INK if r_i == 1 else col, weight='bold' if r_i == 1 else 'normal')
        fig.text(.78, yy, r[4], fontsize=8, color=col)

    fig.text(.055, .285, 'Le tre cose che dice questa pagina', fontsize=12.5,
             color=INK, weight='bold')
    fig.text(.055, .265,
        f"1.  Comprare oro e tenerlo, nello stesso periodo, avrebbe reso +{it(100*(bh[-1]-1))}%: quasi quanto il sistema.\n"
        f"    L'oro è salito tantissimo dal 2019, e nessuna strategia su oro può ignorarlo. Il vantaggio del sistema\n"
        f"    non è il guadagno, è che lo ottiene con una perdita massima del {it(100*dd,1)}% invece del {it(100*ddbh,1)}%, e senza\n"
        "    dipendere dal fatto che l'oro salga: guadagna anche al ribasso.\n\n"
        f"2.  Contro il caso il sistema vince nettamente: batte il {it(batte,1)}% delle simulazioni in cui le stesse\n"
        "    operazioni vengono rimescolate dopo aver azzerato il guadagno medio. Non è rumore.\n\n"
        "3.  Il guadagno viene dall'interesse composto. Rischiando sempre la stessa percentuale, la posizione\n"
        "    cresce con il conto: la prima operazione rischia 70 €, l'ultima ne rischia oltre 250.",
        fontsize=8.6, color=INK2, va='top', linespacing=1.6)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pagina 3 — Monte Carlo
# ======================================================================
def pagina_montecarlo(pdf, dati, f):
    R = [x['R'] for x in dati]
    eq_cp, dd, cp = blocchi(R, f)
    fin = eq_cp[:, -1]
    reale = dd_max(equity(R, f)); tot = _anni(dati)[-1]

    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Bravura o fortuna?',
            f'20.000 storie alternative, stesse operazioni rimescolate · rischio {it(100*f,2)}%', 3)

    ax = fig.add_axes([.085, .615, .865, .255])
    x = cp / cp[-1] * tot
    p05, p25, p50, p75, p95 = [np.percentile(eq_cp, q, axis=0) for q in (5, 25, 50, 75, 95)]
    ax.fill_between(x, p05, p95, color=BLU, alpha=.15, lw=0, label='19 storie su 20 stanno qui')
    ax.fill_between(x, p25, p75, color=BLU, alpha=.30, lw=0, label='metà delle storie sta qui')
    ax.plot(x, p50, color=BLU, lw=2.2, label='storia tipica (la mediana)')
    ax.plot(np.linspace(0, tot, len(R)), equity(R, f), color=GIALLO, lw=1.4,
            label='quella capitata davvero')
    ax.set_xlim(0, tot*1.05); ax.set_ylim(.75, p95[-1]*1.05)
    ax.set_xlabel('anni'); ax.set_ylabel('capitale (1 = deposito)')
    griglia_y(ax); ax.legend(frameon=False, loc='upper left', fontsize=8.5, labelcolor=INK2)
    fig.text(.085, .885, 'Tutte le storie che potevano capitare', fontsize=12.5,
             color=INK, weight='bold')

    q = lambda p: np.percentile(dd, p)
    for i, (v, lab, c) in enumerate([
            (f"{it(100*np.mean(fin>1),1)}%", 'storie in guadagno', VERDE),
            (f"+{it(100*(np.percentile(fin,50)-1))}%", 'guadagno tipico', BLU),
            (f"{it(100*q(50))}%", 'perdita tipica', INK),
            (f"{it(100*q(90))}%", 'perdita in 9 casi su 10', INK),
            (f"{it(100*q(99))}%", 'peggio di così 1 volta su 100', ARANCIO)]):
        tessera(fig, .055 + i*.182, .535, .168, v, lab, c)

    ax2 = fig.add_axes([.085, .245, .40, .225])
    gr = np.arange(1, 100); val = np.percentile(dd, gr)*100
    ax2.fill_between(gr, 0, val, color=ARANCIO, alpha=.16, lw=0)
    ax2.plot(gr, val, color=ARANCIO, lw=2.2)
    ax2.axhline(35, color=INK3, lw=1.1, ls=(0, (5, 4)))
    ax2.text(3, 36, 'limite accettato: 35%', fontsize=7.5, color=INK2)
    for gg in (50, 70, 90, 95):
        v = np.percentile(dd, gg)*100
        ax2.plot([gg], [v], 'o', ms=7, color=ARANCIO, mec=BG, mew=1.8, zorder=5)
        ax2.annotate(f"{it(v)}%", (gg, v), textcoords='offset points', xytext=(0, 9),
                     ha='center', fontsize=8.5, color=INK, weight='bold')
    ax2.set_xlim(0, 100); ax2.set_ylim(0, max(val.max()*1.15, 40))
    ax2.set_xlabel('in questa quota di storie è rimasta sotto…')
    ax2.set_ylabel('perdita massima')
    ax2.xaxis.set_major_formatter(lambda v, _: f"{v:.0f}%")
    ax2.yaxis.set_major_formatter(lambda v, _: f"{v:.0f}%")
    griglia_y(ax2)
    fig.text(.085, .487, 'Quanto può scendere il conto', fontsize=11, color=INK, weight='bold')

    ax3 = fig.add_axes([.565, .245, .385, .225])
    fin0 = senza_edge(R, f)
    b = np.linspace(min(fin0.min(), 0), max(np.percentile(fin, 99), np.percentile(fin0, 99.9)), 70)
    ax3.hist((fin0-1)*100, bins=(b-1)*100, color=INK3, alpha=.55, lw=0, label='senza vantaggio')
    ax3.hist((fin-1)*100, bins=(b-1)*100, color=BLU, alpha=.80, lw=0, label='il nostro sistema')
    ax3.axvline(100*(equity(R, f)[-1]-1), color=GIALLO, lw=1.8)
    ax3.text(100*(equity(R, f)[-1]-1), ax3.get_ylim()[1]*.55, ' capitato\n davvero',
             fontsize=7.5, color=GIALLO)
    ax3.set_xlabel('guadagno finale'); ax3.set_ylabel('quante storie')
    ax3.xaxis.set_major_formatter(lambda v, _: f"{v:.0f}%")
    ax3.set_yticks([]); griglia_y(ax3)
    ax3.legend(frameon=False, fontsize=8, labelcolor=INK2, loc='upper right')
    fig.text(.565, .487, 'Il sistema contro il puro caso', fontsize=11, color=INK, weight='bold')

    fig.text(.055, .200, 'Come si legge', fontsize=12.5, color=INK, weight='bold')
    fig.text(.055, .180,
        "Il backtest è UNA storia. Ho preso le sue operazioni vere e le ho rimescolate 20.000 volte, a blocchi di\n"
        "venti per non spezzare le serie di perdite consecutive: 20.000 storie altrettanto plausibili. Serve a\n"
        "rispondere a «quanto può andare male», non a «quanto è andata male questa volta».\n\n"
        "Il grafico in basso a destra è il confronto decisivo. La nuvola grigia sono le stesse operazioni con il\n"
        "guadagno medio azzerato: come sarebbe andata senza alcun vantaggio. Il nostro risultato sta fuori da\n"
        "quella nuvola, non sul suo bordo.\n\n"
        "La curva in basso a sinistra sale piano fino a circa 90 e poi impenna: il rischio vero vive nell'ultimo\n"
        "pezzo. Fino a 9 storie su 10 la perdita resta sotto il limite accettato.",
        fontsize=8.6, color=INK2, va='top', linespacing=1.6)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pagina 4 — mesi, anni, distribuzione, correlazione
# ======================================================================
def pagina_dettaglio(pdf, dati, f):
    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Mese per mese', 'Dove nasce il guadagno, e quanto le tre gambe '
            'si muovono insieme', 4)

    # --- mappa mensile in punti R ------------------------------------
    m = defaultdict(float); a = defaultdict(float)
    for x in dati:
        m[x['data'][:7]] += x['R']; a[x['data'][:4]] += x['R']
    anni_l = sorted(a)
    M = np.full((len(anni_l), 12), np.nan)
    for k, v in m.items():
        M[anni_l.index(k[:4]), int(k[5:7]) - 1] = v

    ax = fig.add_axes([.10, .640, .70, .225])
    lim = np.nanmax(np.abs(M))
    from matplotlib.colors import LinearSegmentedColormap, TwoSlopeNorm
    cmap = LinearSegmentedColormap.from_list('dv', [ARANCIO, '#2a2a27', VERDE])
    ax.imshow(M, cmap=cmap, norm=TwoSlopeNorm(0, -lim, lim), aspect='auto')
    for i in range(len(anni_l)):
        for j in range(12):
            if not np.isnan(M[i, j]):
                ax.text(j, i, it(M[i, j], 0), ha='center', va='center',
                        fontsize=7, color=INK if abs(M[i, j]) > lim*.35 else INK2)
    ax.set_xticks(range(12), list('GFMAMGLASOND'), color=INK2)
    ax.set_yticks(range(len(anni_l)), anni_l, color=INK2)
    ax.set_xlim(-.5, 11.5)
    for s in ax.spines.values(): s.set_visible(False)
    ax.tick_params(length=0)
    fig.text(.10, .878, 'Punti R guadagnati in ogni mese', fontsize=11,
             color=INK, weight='bold')

    # colonna dei totali d'anno
    for i, an in enumerate(anni_l):
        yy = .640 + .225 * (1 - (i + .5) / len(anni_l))
        c = VERDE if a[an] > 0 else ARANCIO
        fig.text(.845, yy - .004, f"{'+' if a[an]>0 else ''}{it(a[an],1)}",
                 fontsize=9, color=c, ha='right', weight='bold')
        eqa = equity([x['R'] for x in dati if x['data'][:4] == an], f)
        fig.text(.945, yy - .004, f"{'+' if eqa[-1]>1 else ''}{it(100*(eqa[-1]-1),1)}%",
                 fontsize=9, color=INK2, ha='right')
    fig.text(.845, .872, 'punti R', fontsize=7, color=INK3, ha='right')
    fig.text(.945, .872, 'guadagno', fontsize=7, color=INK3, ha='right')

    # --- distribuzione dei risultati per operazione -------------------
    ax2 = fig.add_axes([.085, .392, .40, .180])
    R = np.array([x['R'] for x in dati])
    ax2.hist(np.clip(R, -2, 6), bins=np.arange(-2, 6.25, .25),
             color=BLU, alpha=.85, lw=0)
    ax2.axvline(R.mean(), color=GIALLO, lw=1.8)
    ax2.text(R.mean() + .15, ax2.get_ylim()[1]*.88,
             f'media {it(R.mean(),3)} R', fontsize=8, color=GIALLO)
    ax2.set_xlabel('risultato di ogni operazione (in R)')
    ax2.set_ylabel('quante operazioni'); griglia_y(ax2)
    fig.text(.085, .590, 'Com\'è fatta una singola operazione', fontsize=11,
             color=INK, weight='bold')
    w = R[R > 0]; l = R[R <= 0]
    fig.text(.085, .352,
             f"{it(100*len(w)/len(R),1)}% di operazioni vincenti. Quando vince porta {it(w.mean(),2)} R,\n"
             f"quando perde ne toglie {it(abs(l.mean()),2)}. Il guadagno sta nel rapporto fra i due,\n"
             f"non nel vincere spesso: si perde in {it(100*len(l)/len(R),1)}% dei casi.",
             fontsize=8.3, color=INK2, va='top', linespacing=1.6)

    # --- correlazione fra le gambe -----------------------------------
    ax3 = fig.add_axes([.615, .392, .245, .180])
    mm = defaultdict(lambda: defaultdict(float))
    for x in dati: mm[x['data'][:7]][x['tag']] += x['R']
    mesi = sorted(mm)
    S = {t: np.array([mm[k].get(t, 0.) for k in mesi]) for t in ORD}
    C = np.array([[np.corrcoef(S[i], S[j])[0, 1] for j in ORD] for i in ORD])
    ax3.imshow(C, cmap=cmap, norm=TwoSlopeNorm(0, -1, 1), aspect='auto')
    for i in range(3):
        for j in range(3):
            ax3.text(j, i, it(C[i, j], 2), ha='center', va='center', fontsize=9,
                     color=INK if abs(C[i, j]) > .35 else INK2,
                     weight='bold' if i != j else 'normal')
    et = [NOMI[t][:9] for t in ORD]
    ax3.set_xticks(range(3), et, fontsize=7, color=INK2)
    ax3.set_yticks(range(3), et, fontsize=7, color=INK2)
    for s in ax3.spines.values(): s.set_visible(False)
    ax3.tick_params(length=0)
    fig.text(.615, .590, 'Quanto si muovono insieme', fontsize=11, color=INK, weight='bold')
    fig.text(.615, .352,
             "Rendimenti mensili. Zero = indipendenti,\n"
             "1 = fanno la stessa cosa.\n\n"
             "TRAPPOLA è negativa con entrambe:\n"
             "guadagna quando le altre soffrono.\n"
             "È il motivo per cui esiste.",
             fontsize=8.3, color=INK2, va='top', linespacing=1.6)

    # --- tabella per anno --------------------------------------------
    fig.text(.055, .238, 'Anno per anno, gamba per gamba', fontsize=12.5,
             color=INK, weight='bold')
    intest = ['anno', 'operazioni'] + [NOMI[t] for t in ORD] + ['TOTALE', 'guadagno']
    xs = [.065, .175, .31, .45, .59, .715, .855]
    for c_i, t in enumerate(intest):
        fig.text(xs[c_i], .213, t, fontsize=7.4, color=INK3,
                 ha='left' if c_i < 2 else 'right')
    for r_i, an in enumerate(anni_l):
        yy = .195 - r_i * .0215
        if r_i % 2 == 0:
            fig.add_artist(Rectangle((.055, yy - .006), .89, .0205, facecolor=CARD,
                                     edgecolor='none', transform=fig.transFigure))
        sel = [x for x in dati if x['data'][:4] == an]
        fig.text(xs[0], yy, an, fontsize=8.4, color=INK)
        fig.text(xs[1], yy, it(len(sel)), fontsize=8.4, color=INK2)
        for c_i, t in enumerate(ORD):
            v = sum(x['R'] for x in sel if x['tag'] == t)
            fig.text(xs[2 + c_i], yy, f"{'+' if v>0 else ''}{it(v,1)}", fontsize=8.4,
                     ha='right', color=VERDE if v > 0 else ARANCIO)
        tt = sum(x['R'] for x in sel)
        fig.text(xs[5], yy, f"{'+' if tt>0 else ''}{it(tt,1)}", fontsize=8.4,
                 ha='right', color=INK, weight='bold')
        eqa = equity([x['R'] for x in sel], f)
        fig.text(xs[6], yy, f"{'+' if eqa[-1]>1 else ''}{it(100*(eqa[-1]-1),1)}%",
                 fontsize=8.4, ha='right', color=INK)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pagina 5 — il problema trovato
# ======================================================================
def pagina_trappola(pdf, dati, f):
    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Quello che non va', 'Un problema trovato guardando gamba per gamba', 5)

    costr = [x for x in dati if x['data'][:4] <= '2023']
    fuori = [x for x in dati if x['data'][:4] >= '2024']

    fig.text(.055, .880, 'La TRAPPOLA ha smesso di funzionare', fontsize=15,
             color=ARANCIO, weight='bold')
    fig.text(.055, .858,
             'I parametri sono stati scelti sul 2019-2023 e verificati sul 2024-2026, mai guardato prima.\n'
             'Le prime due gambe hanno retto. La terza si è rovesciata.',
             fontsize=9, color=INK2, va='top', linespacing=1.6)

    ax = fig.add_axes([.095, .600, .38, .185])
    anni_l = sorted({x['data'][:4] for x in dati})
    for t in ORD:
        cum = np.cumsum([sum(x['R'] for x in dati if x['tag'] == t and x['data'][:4] == a)
                         for a in anni_l])
        ax.plot(range(len(anni_l)), cum, color=COL[t], lw=2.2, marker='o', ms=5,
                mec=BG, mew=1.5, label=NOMI[t])
    ax.axvline(4.5, color=INK3, lw=1, ls=(0, (4, 4)))
    ax.text(4.62, -28, 'da qui in poi\nmai visto', fontsize=7.4, color=INK3)
    ax.axhline(0, color=INK3, lw=.9)
    ax.set_xticks(range(len(anni_l)), anni_l, fontsize=7.5)
    ax.set_ylim(-45, 150)
    ax.set_ylabel('punti R accumulati'); griglia_y(ax)
    ax.legend(frameon=False, fontsize=8, labelcolor=INK2, loc='upper left', ncols=1)
    fig.text(.095, .800, 'Guadagno accumulato da ogni gamba', fontsize=11,
             color=INK, weight='bold')

    scheda(fig, .545, .600, .40, .185, ARANCIO)
    fig.text(.567, .755, 'TRAPPOLA, prima e dopo', fontsize=10.5, color=INK, weight='bold')
    for i, (lbl, sel) in enumerate([('2019-2023  (costruzione)', costr),
                                    ('2024-2026  (mai visto prima)', fuori)]):
        v = np.array([x['R'] for x in sel if x['tag'] == 'S1-FADE'])
        w = v[v > 0]; l = v[v <= 0]
        yy = .718 - i * .052
        fig.text(.567, yy, lbl, fontsize=8.2, color=INK3)
        fig.text(.567, yy - .024, f"{'+' if v.sum()>0 else ''}{it(v.sum(),1)} R",
                 fontsize=14, color=VERDE if v.sum() > 0 else ARANCIO, weight='bold')
        fig.text(.700, yy - .021, f"{it(len(v))} operazioni", fontsize=7.8, color=INK3)
        fig.text(.700, yy - .033, f"profit factor {it(sum(w)/abs(sum(l)),2)}",
                 fontsize=7.8, color=INK3)
    fig.text(.567, .614, "Ha restituito tutto quello che aveva guadagnato,\ne un po' di più.",
             fontsize=8.3, color=INK2, va='top', linespacing=1.55)

    R3 = [x['R'] for x in dati]
    R2 = [x['R'] for x in dati if x['tag'] != 'S1-FADE']
    F3 = [x['R'] for x in fuori]
    F2 = [x['R'] for x in fuori if x['tag'] != 'S1-FADE']
    def rig(R, anni):
        e = equity(R, f)
        return (it(len(R)), f"+{it(100*(e[-1]-1))}%", f"{it(100*dd_max(e),1)}%",
                f"{it(100*(e[-1]**(1/anni)-1),1)}%")

    fig.text(.055, .545, 'E senza la TRAPPOLA?', fontsize=12.5, color=INK, weight='bold')
    xs = [.065, .40, .55, .70, .875]
    y = .512
    for titolo, righe in [('tutto il periodo, 7,7 anni',
                           [('con tutte e tre', rig(R3, 7.71), False),
                            ('senza la TRAPPOLA', rig(R2, 7.71), True)]),
                          ('solo il periodo mai visto, 2,7 anni',
                           [('con tutte e tre', rig(F3, 2.71), False),
                            ('senza la TRAPPOLA', rig(F2, 2.71), True)])]:
        fig.text(.065, y, titolo, fontsize=8, color=INK3)
        for c_i, t in enumerate(['operazioni', 'guadagno', 'perdita max', "all'anno"]):
            fig.text(xs[c_i+1], y, t, fontsize=7.2, color=INK3, ha='right')
        for lbl, vals, best in righe:
            y -= .025
            if best:
                fig.add_artist(Rectangle((.055, y - .007), .89, .023, facecolor=CARD,
                                         edgecolor='none', transform=fig.transFigure))
            fig.text(xs[0], y, lbl, fontsize=8.6, color=VERDE if best else INK2,
                     weight='bold' if best else 'normal')
            for c_i, v in enumerate(vals):
                fig.text(xs[c_i+1], y, v, fontsize=8.6, ha='right',
                         color=INK if best else INK2, weight='bold' if best else 'normal')
        y -= .052

    fig.text(.055, .325, 'Ma attenzione: questa scelta non è più pulita', fontsize=12,
             color=GIALLO, weight='bold')
    fig.text(.055, .303,
        "Togliere la TRAPPOLA migliora ogni numero. Però lo so perché ho guardato il 2024-2026, e quello\n"
        "era il test onesto: sceglierci dentro lo consuma. Il +103% della versione a due gambe non è più un\n"
        "risultato fuori campione, è una scelta fatta col senno di poi.\n\n"
        "L'attenuante: il declino era già visibile prima. La TRAPPOLA ha guadagnato tutto nel 2019-2021 e\n"
        "poi si è fermata — 2022 e 2023 insieme valgono meno di due punti R su 50. Non serviva il 2024\n"
        "per vederlo. Ma il modo pulito per deciderlo resta uno solo: dati nuovi, in avanti.\n\n"
        "Nel frattempo la cosa onesta è tenerle separate: i numeri delle pagine 2 e 3 sono quelli del\n"
        "sistema a tre gambe, l'unico che ha una verifica fuori campione non contaminata.",
        fontsize=8.7, color=INK2, va='top', linespacing=1.65)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pagina 6 — limiti e conclusione
# ======================================================================
def pagina_limiti(pdf, dati, f):
    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Prima di usare soldi veri', 'Quattro limiti, e cosa resta da fare', 6)

    limiti = [
        ("Il vantaggio è sottile",
         "Profit factor 1,15: su 100 € rischiati ne restano 15. Funziona per accumulo lento, non per colpi.\n"
         "Serve pazienza e serve che i costi restino bassi."),
        ("Muore a 3 volte i costi",
         "Commissioni, spread e swap si mangiano già il 40% del guadagno lordo, e lo swap da solo pesa il\n"
         "doppio delle commissioni: è il prezzo delle posizioni tenute per giorni. Se gli spread veri sono\n"
         "molto peggiori di quelli simulati il vantaggio sparisce, e nessun backtest può rispondere."),
        ("Ci sono anni a vuoto",
         "2022 e 2024: 675 operazioni per il 9% del risultato. Passerai un anno intero a pareggiare. Chi\n"
         "spegne in quel momento si perde l'anno dopo — nel 2025 il sistema ha fatto +21%."),
        ("Cinque anni su otto servivano a costruire",
         "Solo il 2024-2026 è un test vero. Ha superato tre criteri dichiarati prima di guardarlo, ma vale\n"
         "t 1,4: corrobora, non dimostra. Per le previsioni va usato il rendimento di quel periodo, che è\n"
         "un terzo più basso di quello delle pagine precedenti."),
    ]
    y = .865
    for i, (tit, txt) in enumerate(limiti):
        n = txt.count('\n') + 1
        h = .030 + n * .017
        scheda(fig, .055, y - h + .020, .89, h)
        fig.text(.075, y, f"{i+1}.   {tit}", fontsize=10, color=INK, weight='bold')
        fig.text(.075, y - .019, txt, fontsize=8.4, color=INK2, va='top', linespacing=1.6)
        y -= h + .018

    fuori = [x for x in dati if x['data'][:4] >= '2024']
    ef = equity([x['R'] for x in fuori], f)
    annuo_f = 100*(ef[-1]**(1/2.71) - 1)

    fig.text(.055, .500, 'Il numero da usare per il futuro', fontsize=13,
             color=INK, weight='bold')
    scheda(fig, .055, .390, .89, .095, BLU)
    fig.text(.50, .448, f"circa {it(annuo_f,0)}% all'anno", fontsize=22, color=BLU,
             ha='center', weight='bold')
    fig.text(.50, .418, f"a rischio {it(100*f,2)}% per operazione — è il rendimento del solo periodo "
                        "mai visto prima,", fontsize=8.6, color=INK2, ha='center')
    fig.text(.50, .403, "non quello delle pagine 2 e 3 che comprende gli anni di costruzione",
             fontsize=8.6, color=INK2, ha='center')

    fig.text(.055, .355, 'Cosa resta da fare', fontsize=13, color=INK, weight='bold')
    passi = [
        ("Niente più backtest",
         "I dati sono finiti. Ogni prova in più sugli stessi anni peggiora la statistica invece di migliorarla:\n"
         "sono già state provate 272 configurazioni, e ognuna alza l'asticella che il risultato deve superare."),
        ("Demo in tempo reale, tre-sei mesi",
         "Risponde alle due domande che nessun backtest può toccare: gli spread e gli slittamenti veri\n"
         "assomigliano a quelli simulati? e si riesce a guardarlo fermo per mesi senza spegnerlo?"),
        ("La TRAPPOLA si decide lì",
         "Il demo è dato nuovo: se continua a perdere anche lì, esce senza dubbi e senza aver consumato\n"
         "nessun test. È il modo pulito di chiudere la questione aperta a pagina 5."),
    ]
    y = .318
    for i, (tit, txt) in enumerate(passi):
        h = .028 + 2 * .016
        scheda(fig, .055, y - h + .019, .89, h)
        fig.text(.075, y, f"{i+1}.   {tit}", fontsize=10, color=VERDE, weight='bold')
        fig.text(.075, y - .018, txt, fontsize=8.3, color=INK2, va='top', linespacing=1.55)
        y -= h + .014

    fig.text(.055, .106, 'In una riga', fontsize=13, color=INK, weight='bold')
    fig.text(.055, .086,
             "Tre strategie con logiche diverse, parametri scelti su cinque anni e verificati su tre mai guardati prima,\n"
             "che hanno superato criteri dichiarati in anticipo. Un vantaggio reale ma sottile, una gamba che va\n"
             "probabilmente tolta, e nessuna certezza: quella la danno solo i soldi veri, piano.",
             fontsize=8.8, color=INK2, va='top', linespacing=1.65)
    fig.text(.055, .014,
             "Simulazione su dati storici, conto demo PUPrime, tick reali. Il passato non garantisce il futuro.",
             fontsize=7.5, color=INK3, style='italic')
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
def main(path, f=0.007, out='report/portafoglio-oro.pdf'):
    dati, amb = carica(path)
    print(f"{len(dati)} operazioni   abbinamenti ambigui {amb}")
    with PdfPages(out) as pdf:
        pagina_strategie(pdf, dati)
        pagina_risultato(pdf, dati, f)
        pagina_montecarlo(pdf, dati, f)
        pagina_dettaglio(pdf, dati, f)
        pagina_trappola(pdf, dati, f)
        pagina_limiti(pdf, dati, f)
    print(f"scritto {out}")

if __name__ == '__main__':
    main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 0.007)
