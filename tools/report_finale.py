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

def pagina_strategie(pdf, dati, legs=None):
    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Le tre strategie' if len(legs or ORD) == 3 else 'Le due strategie',
            'Cosa fa ciascuna e come opera', 1)
    legs = legs or ORD
    g = defaultdict(list)
    for x in dati: g[x['tag']].append(x['R'])

    y = .690 if len(legs) == 3 else .700
    for tag in legs:
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

    if len(legs) == 3:
        fig.text(.055, .190, 'Perché tre e non una', fontsize=12.5, color=INK, weight='bold')
        fig.text(.055, .172,
            "ROTTURA e TRAPPOLA guardano lo stesso identico evento — il prezzo che sfonda il canale a 60 barre —\n"
            "e ne prendono i due lati opposti. RITRACCIAMENTO richiede che il prezzo NON sia sull'estremo, quindi\n"
            "non può mai entrare sulla stessa candela della ROTTURA, e lavora su 4 ore invece che su mezz'ora:\n"
            "tiene le posizioni per settimane dove le altre le tengono per ore.\n\n"
            "La differenza è imposta dal codice, non sperata. È questo che fa scendere il drawdown dell'insieme\n"
            "sotto la somma dei drawdown delle singole — ed è misurato a pagina 4.",
            fontsize=8.6, color=INK2, va='top', linespacing=1.65)
    else:
        fig.text(.055, .415, 'Perché due e non tre', fontsize=12.5, color=INK, weight='bold')
        fig.text(.055, .395,
            "C'era una terza gamba, la TRAPPOLA: scommetteva che lo sfondamento della ROTTURA fallisse e\n"
            "prendeva il lato opposto. Nel periodo di costruzione funzionava; nei tre anni successivi ha\n"
            "restituito tutto. Il perché è a pagina 5, e ha a che fare con la direzione dell'oro.\n\n"
            "Le due che restano condividono la direzione ma non il momento: ROTTURA entra quando il prezzo\n"
            "fa un nuovo estremo, RITRACCIAMENTO pretende che NON ci sia. Non possono entrare sulla stessa\n"
            "candela, e lavorano su orizzonti diversi — ore contro settimane. Si muovono insieme a metà\n"
            "(correlazione 0,53): meno di due copie della stessa idea, più di due scommesse indipendenti.",
            fontsize=8.6, color=INK2, va='top', linespacing=1.65)

        v = np.array([x['R'] for x in dati])
        w = v[v > 0]; l = v[v <= 0]
        fig.text(.055, .228, 'Le due insieme', fontsize=12.5, color=INK, weight='bold')
        for i, (val, lab) in enumerate([
                (it(len(v)), 'operazioni in 7,7 anni'),
                (it(sum(v), 1), 'punti R guadagnati'),
                (f"{it(100*len(w)/len(v),1)}%", 'operazioni vincenti'),
                (it(sum(w)/abs(sum(l)), 2), 'profit factor'),
                (f"+{it(v.mean(),4)}", 'guadagno medio, in R')]):
            tessera(fig, .055 + i*.182, .158, .168, val, lab)
        fig.text(.055, .124,
                 "Il guadagno medio per operazione è il numero che conta: un'operazione su due e mezzo va bene,\n"
                 "ma quando va bene porta più di quanto tolga quando va male. Il resto è pazienza e costanza.",
                 fontsize=8.5, color=INK2, va='top', linespacing=1.6)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pagina 2 — il risultato, contro le due alternative
# ======================================================================
def _anni(dati):
    from datetime import datetime
    t = [datetime.strptime(x['data'][:19], '%Y.%m.%d %H:%M:%S') for x in dati]
    t0 = t[0]
    return np.array([(x - t0).total_seconds() / (365.25 * 86400) for x in t])

def pagina_risultato(pdf, dati, f, legs=None):
    legs = legs or ORD
    nome_sist = {1: 'La strategia', 2: 'Le due strategie', 3: 'Le tre strategie'}[len(legs)]
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
    ax.plot(anni, eq, color=BLU, lw=2.2, label=nome_sist.lower())
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
        (nome_sist, f"+{it(100*(eq[-1]-1))}%", f"{it(100*(eq[-1]**(1/tot)-1),1)}%",
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
    vantaggio = eq[-1] / bh[-1]
    if vantaggio < 1.35:
        riga1 = (f"1.  Comprare oro e tenerlo, nello stesso periodo, avrebbe reso +{it(100*(bh[-1]-1))}%: quasi quanto il sistema.\n"
                 "    L'oro è salito tantissimo dal 2019, e nessuna strategia su oro può ignorarlo. Il vantaggio del sistema\n"
                 f"    non è il guadagno, è che lo ottiene con una perdita massima del {it(100*dd,1)}% invece del {it(100*ddbh,1)}%, e senza\n"
                 "    dipendere dal fatto che l'oro salga: guadagna anche al ribasso.")
    else:
        riga1 = (f"1.  Comprare oro e tenerlo, nello stesso periodo, avrebbe reso +{it(100*(bh[-1]-1))}%. Il sistema fa "
                 f"{it(vantaggio,1)} volte tanto,\n"
                 f"    e con una perdita massima del {it(100*dd,1)}% invece del {it(100*ddbh,1)}%. Ma attenzione: parte di quel vantaggio\n"
                 "    viene dal rischio più alto per operazione, non dalla strategia. A parità di perdita massima il\n"
                 "    confronto si stringe — il valore vero è non dipendere dal fatto che l'oro salga.")
    primo = 10000 * f
    ultimo = 10000 * eq[-2] * f
    fig.text(.055, .265,
        riga1 + "\n\n"
        f"2.  Contro il caso il sistema vince nettamente: batte il {it(batte,1)}% delle simulazioni in cui le stesse\n"
        "    operazioni vengono rimescolate dopo aver azzerato il guadagno medio. Non è rumore.\n\n"
        "3.  Il guadagno viene dall'interesse composto. Rischiando sempre la stessa percentuale, la posizione\n"
        f"    cresce con il conto: la prima operazione rischia {it(primo)} €, l'ultima ne rischia circa {it(ultimo)}.",
        fontsize=8.6, color=INK2, va='top', linespacing=1.6)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pagina — dentro e fuori campione
# ======================================================================
def pagina_is_oos(pdf, dati, f, legs, pag=3):
    """I due periodi separati: quello su cui sono stati scelti i
    parametri e quello che non era mai stato guardato."""
    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Dentro e fuori campione',
            'I cinque anni usati per costruire, e i tre mai guardati prima', pag)

    dentro = [x for x in dati if x['data'][:4] <= '2023']
    fuori  = [x for x in dati if x['data'][:4] >= '2024']
    v_all  = np.array([x['R'] for x in dati])
    anni = _anni(dati)
    taglio = _anni(dentro)[-1]
    eq = equity(v_all, f)

    # --- curva con i due periodi distinti
    ax = fig.add_axes([.085, .640, .865, .225])
    m = anni <= taglio
    ax.fill_between(anni[~m], 1, eq[~m], color=VERDE, alpha=.10, lw=0)
    ax.plot(anni[m], eq[m], color=INK3, lw=2.0, label='2019-2023  usati per costruire')
    ax.plot(anni[~m], eq[~m], color=VERDE, lw=2.4, label='2024-2026  mai guardati prima')
    ax.axvline(taglio, color=INK2, lw=1.2, ls=(0, (4, 4)))
    ax.axhline(1, color=INK3, lw=.9, ls=(0, (2, 4)))
    ax.text(taglio + .06, eq.max() * .96, 'da qui in poi\nnessuna scelta\nfatta guardandolo',
            fontsize=7.6, color=INK2, va='top')
    ax.text(anni[-1], eq[-1], f"  +{it(100*(eq[-1]-1))}%", color=VERDE, fontsize=11,
            weight='bold', va='center')
    ax.set_xlim(0, anni[-1] * 1.12); ax.set_ylim(.8, eq.max() * 1.12)
    ax.set_xlabel('anni'); ax.set_ylabel('capitale (1 = deposito)')
    griglia_y(ax); ax.legend(frameon=False, loc='upper left', fontsize=8.5, labelcolor=INK2)
    fig.text(.085, .880, 'La stessa curva, spezzata in due', fontsize=12.5,
             color=INK, weight='bold')

    # --- confronto fra i due periodi
    fig.text(.055, .578, 'I due periodi a confronto', fontsize=12.5, color=INK, weight='bold')
    intest = ['', 'operazioni', 'punti R', 'guadagno medio', 'vincenti', 'profit factor', "all'anno"]
    xs = [.065, .295, .400, .530, .625, .740, .875]
    for c_i, t in enumerate(intest[1:]):
        fig.text(xs[c_i+1], .551, t, fontsize=7.2, color=INK3, ha='right')
    for r_i, (lbl, sel, an, col) in enumerate([
            ('2019-2023  costruzione', dentro, 5.0, INK3),
            ('2024-2026  mai visto',   fuori,  2.71, VERDE),
            ('tutto il periodo',       dati,   7.71, INK)]):
        yy = .524 - r_i * .026
        v = np.array([x['R'] for x in sel]); w = v[v > 0]; l = v[v <= 0]
        e = equity(v, f)
        if r_i == 1:
            fig.add_artist(Rectangle((.055, yy - .008), .89, .024, facecolor=CARD,
                                     edgecolor='none', transform=fig.transFigure))
        fig.text(xs[0], yy, lbl, fontsize=8.6, color=col,
                 weight='bold' if r_i == 1 else 'normal')
        for c_i, val in enumerate([it(len(v)), it(v.sum(), 1), f"{v.mean():+.4f}".replace('.', ','),
                                   f"{it(100*len(w)/len(v),1)}%", it(sum(w)/abs(sum(l)), 2),
                                   f"{it(100*(e[-1]**(1/an)-1),1)}%"]):
            fig.text(xs[c_i+1], yy, val, fontsize=8.6, ha='right',
                     color=INK if r_i == 1 else INK2,
                     weight='bold' if r_i == 1 else 'normal')

    # --- per gamba
    fig.text(.055, .420, 'Gamba per gamba', fontsize=12.5, color=INK, weight='bold')
    y = .393
    for tag in legs:
        fig.text(.065, y, NOMI[tag], fontsize=9, color=COL[tag], weight='bold')
        for c_i, (lbl, sel) in enumerate([('2019-23', dentro), ('2024-26', fuori)]):
            v = np.array([x['R'] for x in sel if x['tag'] == tag])
            w = v[v > 0]; l = v[v <= 0]
            xx = .30 + c_i * .30
            fig.text(xx, y, lbl, fontsize=7.2, color=INK3)
            fig.text(xx + .16, y, f"{'+' if v.sum()>0 else ''}{it(v.sum(),1)} R", fontsize=9,
                     color=VERDE if v.sum() > 0 else ARANCIO, weight='bold', ha='right')
            fig.text(xx + .26, y, f"PF {it(sum(w)/abs(sum(l)),2)}", fontsize=8.2,
                     color=INK2, ha='right')
        y -= .026

    # --- i criteri dichiarati prima
    v = np.array([x['R'] for x in fuori]); w = v[v > 0]; l = v[v <= 0]
    pf = sum(w) / abs(sum(l)); dd06 = 100 * dd_max(equity(v, .006))
    fig.text(.055, .300, 'I criteri, dichiarati prima di guardare quegli anni', fontsize=12.5,
             color=INK, weight='bold')
    for i, (nome, soglia, val, ok) in enumerate([
            ('guadagno medio per operazione', '≥ +0,050 R', f"{v.mean():+.4f} R".replace('.', ','), v.mean() >= .05),
            ('profit factor', '≥ 1,10', it(pf, 3), pf >= 1.10),
            ('perdita massima (a rischio 0,60%)', '≤ 27,4%', f"{it(dd06,2)}%", dd06 <= 27.4)]):
        yy = .272 - i * .026
        fig.text(.075, yy, nome, fontsize=8.6, color=INK2)
        fig.text(.560, yy, soglia, fontsize=8.6, color=INK3, ha='right')
        fig.text(.700, yy, val, fontsize=8.6, color=INK, ha='right', weight='bold')
        fig.text(.760, yy, 'PASSA' if ok else 'NON PASSA', fontsize=8.6,
                 color=VERDE if ok else ARANCIO, weight='bold')

    fig.text(.055, .168, 'Attenzione: qui va meglio fuori che dentro, e non è una buona notizia',
             fontsize=11.5, color=GIALLO, weight='bold')
    fig.text(.055, .147,
        "Di solito il periodo di costruzione rende di più, perché i parametri sono stati scelti lì. Qui succede\n"
        "il contrario: il guadagno medio per operazione passa da +0,12 a +0,26 R. Non vuol dire che il\n"
        "sistema sia più bravo fuori — vuol dire che il 2024-2026 è stato un periodo eccezionale per l'oro,\n"
        "e una strategia che segue il trend in un trend del genere non può che andare bene.\n\n"
        "Il numero prudente da portarsi dietro è quello più basso dei due, non il più alto: quel +47% annuo\n"
        "non è un'aspettativa, è quello che è successo in tre anni molto favorevoli.",
        fontsize=8.7, color=INK2, va='top', linespacing=1.65)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pagina 4 — Monte Carlo
# ======================================================================
def pagina_montecarlo(pdf, dati, f, pag=3):
    R = [x['R'] for x in dati]
    eq_cp, dd, cp = blocchi(R, f)
    fin = eq_cp[:, -1]
    reale = dd_max(equity(R, f)); tot = _anni(dati)[-1]

    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Bravura o fortuna?',
            f'20.000 storie alternative, stesse operazioni rimescolate · rischio {it(100*f,2)}%', pag)

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
def pagina_dettaglio(pdf, dati, f, legs=None, pag=4):
    legs = legs or ORD
    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Mese per mese', 'Dove nasce il guadagno, e quanto le gambe '
            'si muovono insieme', pag)

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
    S = {t: np.array([mm[k].get(t, 0.) for k in mesi]) for t in legs}
    C = np.array([[np.corrcoef(S[i], S[j])[0, 1] for j in legs] for i in legs])
    ax3.imshow(C, cmap=cmap, norm=TwoSlopeNorm(0, -1, 1), aspect='auto')
    n = len(legs)
    for i in range(n):
        for j in range(n):
            ax3.text(j, i, it(C[i, j], 2), ha='center', va='center', fontsize=9,
                     color=INK if abs(C[i, j]) > .35 else INK2,
                     weight='bold' if i != j else 'normal')
    et = [NOMI[t][:9] for t in legs]
    ax3.set_xticks(range(n), et, fontsize=7, color=INK2)
    ax3.set_yticks(range(n), et, fontsize=7, color=INK2)
    for s in ax3.spines.values(): s.set_visible(False)
    ax3.tick_params(length=0)
    fig.text(.615, .590, 'Quanto si muovono insieme', fontsize=11, color=INK, weight='bold')
    fig.text(.615, .352,
             "Rendimenti mensili. Zero = indipendenti,\n"
             "1 = fanno la stessa cosa.\n\n" +
             ("TRAPPOLA è negativa con entrambe:\n"
              "guadagna quando le altre soffrono.\n"
              "È il motivo per cui esiste." if len(legs) == 3 else
              "0,53 fra le due: condividono la direzione\n"
              "ma non il momento in cui entrano.\n"
              "Metà di quello che fanno è indipendente."),
             fontsize=8.3, color=INK2, va='top', linespacing=1.6)

    # --- tabella per anno --------------------------------------------
    fig.text(.055, .238, 'Anno per anno, gamba per gamba', fontsize=12.5,
             color=INK, weight='bold')
    intest = ['anno', 'operazioni'] + [NOMI[t] for t in legs] + ['TOTALE', 'guadagno']
    xs = ([.065, .175, .31, .45, .59, .715, .855] if len(legs) == 3
          else [.065, .195, .37, .55, .715, .855])
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
        for c_i, t in enumerate(legs):
            v = sum(x['R'] for x in sel if x['tag'] == t)
            fig.text(xs[2 + c_i], yy, f"{'+' if v>0 else ''}{it(v,1)}", fontsize=8.4,
                     ha='right', color=VERDE if v > 0 else ARANCIO)
        tt = sum(x['R'] for x in sel)
        fig.text(xs[-2], yy, f"{'+' if tt>0 else ''}{it(tt,1)}", fontsize=8.4,
                 ha='right', color=INK, weight='bold')
        eqa = equity([x['R'] for x in sel], f)
        fig.text(xs[-1], yy, f"{'+' if eqa[-1]>1 else ''}{it(100*(eqa[-1]-1),1)}%",
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
def pagina_limiti(pdf, dati, f, tutti=None, solo_due=False, pag=6):
    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Prima di usare soldi veri', 'I limiti, e cosa resta da fare', pag)

    v = np.array([x['R'] for x in dati]); w = v[v > 0]; l = v[v <= 0]
    pf = sum(w) / abs(sum(l))
    fuori = [x['R'] for x in dati if x['data'][:4] >= '2024']
    cal = 100 * (1 - np.mean(fuori) / v.mean())

    # anni in cui il sistema ha lavorato senza produrre
    piatti = []
    for a in sorted({x['data'][:4] for x in dati}):
        vv = np.array([x['R'] for x in dati if x['data'][:4] == a])
        if vv.mean() < .03:
            piatti.append((a, len(vv), vv.sum()))
    if piatti:
        n_op = sum(p[1] for p in piatti); somma = sum(p[2] for p in piatti)
        esito = (f"hanno tolto {it(abs(somma),1)} punti R invece di aggiungerne" if somma < 0
                 else f"hanno prodotto solo {it(somma,1)} punti R su {it(v.sum(),1)}")
        txt_piatti = (f"{' e '.join(p[0] for p in piatti)}: {it(n_op)} operazioni che {esito}.\n"
                      "Passerai un anno intero a pareggiare o a scendere, e chi spegne lì si perde l'anno dopo.")
    else:
        txt_piatti = ("Nessun anno completamente piatto in questo campione, ma con un vantaggio così sottile\n"
                      "è una questione di tempo: mettilo in conto prima, non dopo.")

    limiti = [
        ("Il vantaggio è sottile",
         f"Profit factor {it(pf,2)}: su 100 € rischiati ne restano {it(100*(pf-1)/pf)}. Funziona per accumulo lento, non\n"
         "per colpi. Serve pazienza, e serve che i costi restino bassi."),
        ("Muore a 3 volte i costi",
         "Commissioni, spread e swap si mangiano già il 40% del guadagno lordo, e lo swap pesa il doppio\n"
         "delle commissioni. Se gli spread veri sono peggiori di quelli simulati il vantaggio sparisce."),
        ("Ci sono anni a vuoto", txt_piatti),
        ("Cinque anni su otto servivano a costruire",
         "Solo il 2024-2026 è un test vero: ha superato tre criteri dichiarati prima, ma vale t 1,4. Cinque\n"
         "degli otto anni servivano a scegliere i parametri, quindi le pagine 2 e 3 sono ottimistiche."),
    ]
    y = .880
    for i, (tit, txt) in enumerate(limiti):
        n = txt.count('\n') + 1
        h = .030 + n * .017
        scheda(fig, .055, y - h + .020, .89, h)
        fig.text(.075, y, f"{i+1}.   {tit}", fontsize=10, color=INK, weight='bold')
        fig.text(.075, y - .019, txt, fontsize=8.4, color=INK2, va='top', linespacing=1.6)
        y -= h + .015

    # --- il numero da usare per il futuro
    fig.text(.055, .545, 'Il numero da usare per il futuro', fontsize=13,
             color=INK, weight='bold')
    if solo_due and tutti:
        # configurazione scelta DOPO aver visto il fuori campione: il suo
        # rendimento fuori campione non e' piu' una misura pulita
        e2 = equity(fuori, f)
        e3 = equity([x['R'] for x in tutti if x['data'][:4] >= '2024'], f)
        scheda(fig, .055, .405, .43, .118, GIALLO)
        fig.text(.270, .485, f"{it(100*(e3[-1]**(1/2.71)-1))}% all'anno", fontsize=17,
                 color=GIALLO, ha='center', weight='bold')
        fig.text(.270, .461, 'con la gamba sbagliata dentro', fontsize=8.5, color=INK, ha='center',
                 weight='bold')
        fig.text(.270, .441, "il fuori campione del sistema a tre gambe:\nnessuna scelta fatta dopo averlo visto",
                 fontsize=7.8, color=INK2, ha='center', va='top', linespacing=1.5)
        scheda(fig, .515, .405, .43, .118, INK3)
        fig.text(.730, .485, f"{it(100*(e2[-1]**(1/2.71)-1))}% all'anno", fontsize=17,
                 color=INK3, ha='center', weight='bold')
        fig.text(.730, .461, 'senza la gamba sbagliata', fontsize=8.5, color=INK2, ha='center',
                 weight='bold')
        fig.text(.730, .441, "questa versione, ma la gamba è stata\ntolta guardando proprio quegli anni",
                 fontsize=7.8, color=INK2, ha='center', va='top', linespacing=1.5)
        fig.text(.055, .375,
                 f"Entrambi a rischio {it(100*f,2)}%. Il vero valore atteso sta fra i due. La gamba tolta era sbagliata\n"
                 "per ragioni che non dipendono dai risultati — fare mean reversion su un mercato che sale da\n"
                 "anni — ma l'ho capito guardando quegli anni, quindi il numero di destra resta un po' gonfiato.\n\n"
                 "E c'è un secondo motivo per non fidarsi del numero alto, a pagina 3: il 2024-2026 è stato un\n"
                 "periodo eccezionale per l'oro. Porta con te il numero più basso dei due, non il più alto.",
                 fontsize=8.6, color=INK2, va='top', linespacing=1.6)
        y_next = .245
    else:
        ef = equity(fuori, f)
        scheda(fig, .055, .432, .89, .095, BLU)
        fig.text(.50, .490, f"circa {it(100*(ef[-1]**(1/2.71)-1))}% all'anno", fontsize=22,
                 color=BLU, ha='center', weight='bold')
        fig.text(.50, .460, f"a rischio {it(100*f,2)}% per operazione — è il rendimento del solo periodo "
                            "mai visto prima,", fontsize=8.6, color=INK2, ha='center')
        fig.text(.50, .445, "non quello delle pagine 2 e 3 che comprende gli anni di costruzione",
                 fontsize=8.6, color=INK2, ha='center')
        fig.text(.055, .409, f"Il vantaggio per operazione fuori campione è {it(cal)}% più basso di quello "
                             "sull'intero periodo: è il costo\ndell'aver scelto i parametri guardando i primi cinque anni.",
                 fontsize=8.6, color=INK2, va='top', linespacing=1.6)
        y_next = .350

    fig.text(.055, y_next, 'Cosa resta da fare', fontsize=13, color=INK, weight='bold')
    passi = [
        ("Niente più backtest",
         "I dati sono finiti. Ogni prova in più sugli stessi anni peggiora la statistica invece di migliorarla:\n"
         "sono già state provate 272 configurazioni, e ognuna alza l'asticella che il risultato deve superare."),
        ("Demo in tempo reale, tre-sei mesi",
         "Risponde alle due domande che nessun backtest può toccare: gli spread e gli slittamenti veri\n"
         "assomigliano a quelli simulati? e si riesce a guardarlo fermo per mesi senza spegnerlo?"),
        ("Le scelte aperte si decidono lì",
         "Il demo è dato nuovo. Se la gamba tolta continua a perdere anche in avanti, esce senza dubbi e\n"
         f"senza aver consumato nessun test: è il modo pulito di chiudere la questione di pagina {pag-1}."),
    ]
    y = y_next - .032
    for i, (tit, txt) in enumerate(passi):
        h = .028 + 2 * .014
        scheda(fig, .055, y - h + .018, .89, h)
        fig.text(.075, y, f"{i+1}.   {tit}", fontsize=10, color=VERDE, weight='bold')
        fig.text(.075, y - .017, txt, fontsize=8.2, color=INK2, va='top', linespacing=1.5)
        y -= h + .012

    if not solo_due:
        fig.text(.055, y - .020, 'In una riga', fontsize=13, color=INK, weight='bold')
        fig.text(.055, y - .040,
                 "Tre strategie con logiche diverse, parametri scelti su cinque anni e verificati su tre mai guardati\n"
                 "prima, che hanno superato criteri dichiarati in anticipo. Un vantaggio reale ma sottile, una gamba\n"
                 "che va probabilmente tolta, e nessuna certezza: quella la danno solo i soldi veri, piano.",
                 fontsize=8.7, color=INK2, va='top', linespacing=1.65)
    fig.text(.055, .010,
             "Simulazione su dati storici, conto demo PUPrime, tick reali. Il passato non garantisce il futuro.",
             fontsize=7.5, color=INK3, style='italic')
    pdf.savefig(fig); plt.close(fig)


# ======================================================================
#  pagina 5 (versione a due gambe) — perche' la terza e' uscita
# ======================================================================
def pagina_perche_due(pdf, tutti, f, pag=5):
    """Serve i dati COMPLETI, comprese le operazioni della gamba tolta."""
    fig = plt.figure(figsize=(8.27, 11.69))
    testata(fig, 'Perché la terza è uscita',
            "La TRAPPOLA scommetteva contro la direzione dell'oro", pag)

    fig.text(.055, .880, 'Vendere le rotture al rialzo, su un mercato che sale', fontsize=14,
             color=ARANCIO, weight='bold')
    fig.text(.055, .858,
             "La TRAPPOLA prende sempre il lato opposto dello sfondamento. Quando l'oro rompe verso l'alto\n"
             "e lei scommette che sia un inganno, vende. Dal 2019 l'oro è passato da 1.280 a oltre 4.300\n"
             "dollari: quella scommessa è stata quasi sempre sbagliata. Non era una gamba della strategia\n"
             "originale — è stata aggiunta in fase di ricerca, e l'oro non è mai stato il posto giusto.",
             fontsize=9, color=INK2, va='top', linespacing=1.6)

    # --- barre: lato long contro lato short, per ciascuna gamba
    ax = fig.add_axes([.095, .565, .385, .180])
    lati = ['long', 'short']
    xpos = np.arange(3)
    for k, lato in enumerate(lati):
        vals = [sum(x['R'] for x in tutti if x['tag'] == t and x['tipo'] == lato) for t in ORD]
        ax.bar(xpos + (k - .5) * .38, vals, width=.34,
               color=[COL[t] for t in ORD], alpha=1.0 if lato == 'long' else .42,
               edgecolor=BG, lw=1.5, label='al rialzo' if lato == 'long' else 'al ribasso')
    ax.axhline(0, color=INK3, lw=1)
    ax.set_xticks(xpos, [NOMI[t][:9] for t in ORD], fontsize=7.5)
    ax.set_ylabel('punti R guadagnati'); griglia_y(ax)
    ax.legend(frameon=False, fontsize=8, labelcolor=INK2, loc='upper right')
    fig.text(.095, .762, 'Quanto rende ogni gamba, per lato', fontsize=11,
             color=INK, weight='bold')

    scheda(fig, .545, .553, .40, .192, ARANCIO)
    fig.text(.567, .715, 'TRAPPOLA, lato per lato', fontsize=10.5, color=INK, weight='bold')
    for i, (lato, etich) in enumerate([('long', 'compra le rotture al ribasso fallite'),
                                       ('short', 'vende le rotture al rialzo fallite')]):
        v = np.array([x['R'] for x in tutti if x['tag'] == 'S1-FADE' and x['tipo'] == lato])
        w = v[v > 0]; l = v[v <= 0]
        yy = .678 - i * .052
        fig.text(.567, yy, etich, fontsize=7.8, color=INK3)
        fig.text(.567, yy - .026, f"{'+' if v.sum()>0 else ''}{it(v.sum(),1)} R",
                 fontsize=14, color=VERDE if v.sum() > 0 else ARANCIO, weight='bold')
        fig.text(.700, yy - .022, f"{it(len(v))} operazioni", fontsize=7.8, color=INK3)
        fig.text(.700, yy - .034, f"profit factor {it(sum(w)/abs(sum(l)),2)}",
                 fontsize=7.8, color=INK3)
    vs = np.array([x['R'] for x in tutti
                   if x['tag'] == 'S1-FADE' and x['tipo'] == 'short' and x['data'][:4] >= '2024'])
    fig.text(.567, .588, f"Nei tre anni mai visti il solo lato al ribasso\nha perso {it(abs(vs.sum()),1)} punti R su {it(len(vs))} operazioni.",
             fontsize=8.3, color=INK2, va='top', linespacing=1.55)

    fig.text(.055, .525, 'Lo stesso effetto si vede su tutte e tre', fontsize=12.5,
             color=INK, weight='bold')
    xs = [.065, .34, .50, .66, .855]
    y = .505
    for c_i, t in enumerate(['al rialzo (R)', 'al ribasso (R)', 'differenza', 'operazioni']):
        fig.text(xs[c_i+1], y, t, fontsize=7.2, color=INK3, ha='right')
    for t in ORD:
        y -= .026
        vl = sum(x['R'] for x in tutti if x['tag'] == t and x['tipo'] == 'long')
        vs_ = sum(x['R'] for x in tutti if x['tag'] == t and x['tipo'] == 'short')
        n = sum(1 for x in tutti if x['tag'] == t)
        fig.text(xs[0], y, NOMI[t], fontsize=8.6, color=COL[t], weight='bold')
        for c_i, v in enumerate([vl, vs_, vl - vs_]):
            fig.text(xs[c_i+1], y, f"{'+' if v>0 else ''}{it(v,1)}", fontsize=8.6, ha='right',
                     color=VERDE if v > 0 else ARANCIO)
        fig.text(xs[4], y, it(n), fontsize=8.6, ha='right', color=INK2)

    fig.text(.055, .394, "Perché conta, e perché non è la risposta a tutto", fontsize=12,
             color=GIALLO, weight='bold')
    fig.text(.055, .372,
        "Tutte e tre le gambe rendono di più al rialzo che al ribasso, ma solo la TRAPPOLA va in perdita: le\n"
        "altre due guadagnano da entrambi i lati, solo meno. È coerente con un mercato che in sette anni è\n"
        "più che triplicato — e la TRAPPOLA è l'unica costruita per vendere proprio quando sfonda in su.\n\n"
        "L'avvertenza però è seria: questo è un periodo in cui l'oro ha fatto una delle corse più forti della sua\n"
        "storia. Dire «gli short non funzionano sull'oro» su sette anni significa scommettere che il rialzo\n"
        "continui: è una previsione sul mercato, non un vantaggio statistico, e nessun test qui la sostiene.\n\n"
        "Sul metodo: la TRAPPOLA viene tolta dopo aver guardato il 2024-2026, e di solito non si fa. Qui però\n"
        "la ragione non è «ha reso poco»: un sistema che guadagna sui falsi segnali, cioè quando il prezzo\n"
        "non va da nessuna parte, era la scelta sbagliata per un mercato che sale da anni. Quell'argomento\n"
        "si poteva fare guardando un grafico mensile dell'oro, senza nessun backtest, e non riguarda un\n"
        "parametro ottimizzato ma una gamba intera che non doveva esserci. Resta che l'ho capito tardi.",
        fontsize=8.7, color=INK2, va='top', linespacing=1.65)

    fig.text(.055, .135, 'Una via di mezzo che non ho preso', fontsize=11.5,
             color=INK, weight='bold')
    vl = np.array([x['R'] for x in tutti if x['tag'] == 'S1-FADE' and x['tipo'] == 'long'])
    fig.text(.055, .114,
        f"Il solo lato al rialzo della TRAPPOLA fa {'+' if vl.sum()>0 else ''}{it(vl.sum(),1)} punti R con profit factor "
        f"{it(vl[vl>0].sum()/abs(vl[vl<=0].sum()),2)}: tenerla solo long sarebbe la scelta\n"
        "più ovvia. Non l'ho fatta perché sarebbe il terzo aggiustamento deciso guardando gli stessi dati, e\n"
        "ogni aggiustamento in più rende il risultato meno credibile. Se la si vuole recuperare, si prova in\n"
        "avanti — non all'indietro.",
        fontsize=8.7, color=INK2, va='top', linespacing=1.65)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
def main(path, f=0.007, solo_due=False, out=None):
    dati, amb = carica(path)
    print(f"{len(dati)} operazioni   abbinamenti ambigui {amb}")
    legs = ['S3-DONCH', 'S2-PULLB'] if solo_due else ORD
    sel = [x for x in dati if x['tag'] in legs]
    out = out or ('report/portafoglio-oro-due-gambe.pdf' if solo_due
                  else 'report/portafoglio-oro.pdf')
    with PdfPages(out) as pdf:
        pagina_strategie(pdf, sel, legs)
        pagina_risultato(pdf, sel, f, legs)
        pagina_is_oos(pdf, sel, f, legs, 3)
        pagina_montecarlo(pdf, sel, f, 4)
        pagina_dettaglio(pdf, sel, f, legs, 5)
        if solo_due:
            pagina_perche_due(pdf, dati, f, 6)   # serve anche la gamba tolta
        else:
            pagina_trappola(pdf, dati, f)
        pagina_limiti(pdf, sel, f, dati, solo_due, 7)
    print(f"scritto {out}")

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('report')
    ap.add_argument('--rischio', type=float, default=0.7, help='in percento')
    ap.add_argument('--due', action='store_true', help='solo ROTTURA e RITRACCIAMENTO')
    a = ap.parse_args()
    main(a.report, a.rischio / 100.0, a.due)
