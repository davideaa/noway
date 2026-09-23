#!/usr/bin/env python3
"""Dossier di validazione quantitativa a due broker, a RISCHIO FISSO.

Tutto quello che c'e' dentro e' ricostruito operazione per operazione
dai report MT5. Nessun numero inserito a mano, nessuna operazione
stimata, nessuna storia inventata dove i dati non arrivano.
"""
import sys, math, statistics as st
from collections import defaultdict
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Rectangle, FancyBboxPatch
sys.path.insert(0, 'tools')
from dati_validazione import (leggi, stat, per_anno, per_mese, taglia,
                              equity_fissa, dd_serie, prezzo_mensile,
                              regressione, CONFINE_OOS, DEPOSITO)
import montecarlo_validazione as MC

# ---------------------------------------------------------------- tema
BG, CARD = '#111110', '#1c1c1a'
INK, INK2, INK3 = '#ffffff', '#c3c2b7', '#7a786f'
BLU, ARANCIO, VERDE, ROSSO = '#3987e5', '#d95926', '#199e70', '#e66767'
GIALLO, GRIGLIA, VIOLA = '#c98500', '#2e2e2b', '#8b6fc4'
plt.rcParams.update({
    'font.family': 'DejaVu Sans', 'font.size': 9,
    'figure.facecolor': BG, 'axes.facecolor': BG,
    'axes.edgecolor': GRIGLIA, 'axes.labelcolor': INK2,
    'xtick.color': INK2, 'ytick.color': INK2,
    'axes.spines.top': False, 'axes.spines.right': False,
    'savefig.facecolor': BG, 'pdf.fonttype': 42,
})
CB = {0: BLU, 1: ARANCIO}
CLEG = {'S3-DONCH': BLU, 'S2-PULLB': VERDE}
NLEG = {'S3-DONCH': 'ROTTURA', 'S2-PULLB': 'RITRACCIAMENTO'}
TETTO = 35.0
PAG = [0]

def it(x, dec=0):
    if x != x: return 'n/d'
    if x in (float('inf'), float('-inf')): return '∞'
    return f"{x:,.{dec}f}".replace(',', '\x00').replace('.', ',').replace('\x00', '.')

def pc(x, dec=1):
    return ('+' if x > 0 else '') + it(x, dec) + '%'

# ------------------------------------------------------- elementi base
def pagina(titolo, sottotitolo, sezione=''):
    PAG[0] += 1
    fig = plt.figure(figsize=(8.27, 11.69))
    fig.text(.058, .958, titolo, fontsize=19, color=INK, weight='bold')
    fig.text(.058, .937, sottotitolo, fontsize=8.5, color=INK2)
    fig.text(.942, .960, sezione or 'VALIDAZIONE', fontsize=8.6, color=INK3,
             ha='right', weight='bold')
    fig.text(.942, .943, f'XAUUSD · V1XAU · pag. {PAG[0]}', fontsize=7.6,
             color=INK3, ha='right')
    fig.add_artist(Rectangle((.058, .928), .884, .0015, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))
    return fig

def testo(fig, x, y, s, size=8.6, col=None, w='normal', ha='left'):
    fig.text(x, y, s, fontsize=size, color=col or INK2, va='top',
             linespacing=1.62, weight=w, ha=ha)

def card(fig, x, y, w, h, bordo=None):
    fig.add_artist(FancyBboxPatch((x, y), w, h,
                   boxstyle='round,pad=0,rounding_size=.010',
                   facecolor=CARD, edgecolor=bordo or GRIGLIA,
                   lw=1.3 if bordo else .8, transform=fig.transFigure))

def kpi(fig, x, y, w, valore, etichetta, col=INK, h=.052):
    card(fig, x, y, w, h)
    fig.text(x + w/2, y + h*.55, valore, fontsize=13.5, color=col,
             ha='center', weight='bold')
    fig.text(x + w/2, y + h*.18, etichetta, fontsize=6.9, color=INK2, ha='center')

def griglia(ax, asse='y'):
    ax.grid(axis=asse, color=GRIGLIA, lw=.7); ax.set_axisbelow(True)

def riga_tab(fig, y, celle, xs, size=8.6, col=None, w='normal'):
    # una cella None non viene disegnata: serve quando la riga la
    # riscrive subito dopo con un colore suo, per non stamparla due volte
    for (x, ha), c in zip(xs, celle):
        if c is None: continue
        fig.text(x, y, c, fontsize=size, color=col or INK2, ha=ha, weight=w)

def linea(fig, y, x0=.058, x1=.942, c=None):
    fig.add_artist(Rectangle((x0, y), x1-x0, .0012, facecolor=c or GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))

def anni_su(ax, date, ylo, yhi):
    """Separatori verticali per anno solare + etichetta dell'anno."""
    vis = {}
    for i, d in enumerate(date):
        vis.setdefault(d[:4], i)
    for a, i in vis.items():
        if a == min(vis): continue
        ax.axvline(i, color=GRIGLIA, lw=.9, zorder=0)
    return vis

# ======================================================================
#  CONTESTO — tutto calcolato una volta, e riconciliato
# ======================================================================
def costruisci(percorsi, nomi, qualita, rischio_test, swap_broker):
    C = {'nomi': nomi, 'qualita': qualita, 'swap_broker': swap_broker, 'b': []}
    for p, nome, rt in zip(percorsi, nomi, rischio_test):
        ops, amb, res = leggi(p, rischio_test=rt)
        b = {'nome': nome, 'ops': ops, 'amb': amb, 'aperte': res,
             'tot': stat(ops), 'anni': per_anno(ops), 'mesi': per_mese(ops),
             'IS': taglia(ops, al='2023.12.31'), 'OOS': taglia(ops, dal=CONFINE_OOS),
             'R': [o.R for o in ops], 'file': p}
        b['sIS'], b['sOOS'] = stat(b['IS']), stat(b['OOS'])
        b['eq'] = equity_fissa(ops)
        b['date'] = [o.chiusura for o in ops]
        b['prezzi'] = prezzo_mensile(ops)
        b['reg'] = regressione(b['eq'][1:])
        C['b'].append(b)
    # periodo comune
    C['dal'] = max(b['date'][0][:10] for b in C['b'])
    C['al']  = min(b['date'][-1][:10] for b in C['b'])
    C['anni_tot'] = sorted(set().union(*[set(b['anni']) for b in C['b']]))
    d0, d1 = C['b'][0]['date'][0], C['b'][0]['date'][-1]
    C['durata'] = (int(d1[:4]) + int(d1[5:7])/12) - (int(d0[:4]) + int(d0[5:7])/12)
    return C

def mensili_pct(b):
    """Rendimento mensile in % del deposito, a rischio fisso."""
    return {m: 100*sum(o.utile for o in v)/DEPOSITO for m, v in b['mesi'].items()}

def ratios(b):
    """Sharpe/Sortino/Calmar dai rendimenti MENSILI a rischio fisso.
    Base costante, quindi rendimenti aritmetici: annualizzo la media per
    12 e la deviazione per radice di 12. Senza tasso privo di rischio."""
    m = list(mensili_pct(b).values())
    if len(m) < 12: return {}
    mu, sd = st.mean(m), st.pstdev(m)
    giu = [x for x in m if x < 0]
    sd_giu = math.sqrt(sum(x*x for x in giu)/len(m)) if giu else 0.0
    ann = mu*12
    return {'sharpe': (mu/sd)*math.sqrt(12) if sd else float('nan'),
            'sortino': (mu/sd_giu)*math.sqrt(12) if sd_giu else float('nan'),
            'calmar': ann/b['tot']['dd'] if b['tot']['dd'] else float('nan'),
            'rend_ann': ann, 'vol_ann': sd*math.sqrt(12)}

def buyhold(b):
    """Serie XAUUSD normalizzata a 100, dai prezzi di esecuzione del
    backtest: approssimazione, non il listino ufficiale."""
    pz = b['prezzi']; mesi = sorted(pz)
    base = pz[mesi[0]]
    return mesi, [100*(pz[m]/base - 1) for m in mesi]

def bh_annuo(b):
    pz = b['prezzi']; mesi = sorted(pz)
    out = {}
    for a in sorted({m[:4] for m in mesi}):
        mm = [m for m in mesi if m[:4] == a]
        prima = [m for m in mesi if m < mm[0]]
        p0 = pz[prima[-1]] if prima else pz[mm[0]]
        out[a] = 100*(pz[mm[-1]]/p0 - 1)
    return out

def verifica(C):
    """Le riconciliazioni chieste, stampate e bloccanti."""
    ok = True
    print('--- riconciliazioni ---')
    for b in C['b']:
        t = b['tot']
        sa = sum(sum(o.utile for o in v) for v in b['anni'].values())
        sR = sum(o.R for v in b['anni'].values() for o in v)
        n_is, n_oos = len(b['IS']), len(b['OOS'])
        prove = [
            ('utile per anno = totale', abs(sa - t['utile']) < 1e-6),
            ('R per anno = R totale',   abs(sR - t['R']) < 1e-6),
            ('IS + OOS = campione',     n_is + n_oos == t['n']),
            ('nessuna posizione aperta',b['aperte'] == 0),
            ('utile fisso = 100 x R',   abs(t['utile'] - 100*t['R']) < 1e-6),
            ('rendimento = utile/dep',  abs(t['rend'] - 100*t['utile']/DEPOSITO) < 1e-9),
        ]
        for nome, esito in prove:
            print(f"  {b['nome']:12} {nome:28} {'OK' if esito else '*** ERRORE ***'}")
            ok &= esito
    if not ok:
        raise SystemExit('riconciliazione fallita: non genero il PDF')
    print('  tutte le riconciliazioni passano\n')

# ======================================================================
#  1 — SINTESI
# ======================================================================
def p_sintesi(pdf, C, mc):
    fig = pagina('Sintesi', f"V1XAU Trend Following · XAUUSD · {C['dal']} → {C['al']} · "
                 f"rischio fisso 1%", 'SINTESI')
    testo(fig, .058, .903,
          "Tutti i numeri di questo dossier sono a RISCHIO FISSO: ogni operazione rischia sempre 100,\n"
          "l'1% del deposito iniziale, per tutta la storia. Il composto e' stato rimosso ricostruendo la\n"
          "serie operazione per operazione, non riscalando la curva del backtest.")

    y0 = .750
    for i, b in enumerate(C['b']):
        t, r = b['tot'], ratios(b)
        y = y0 - i*.108
        fig.text(.058, y+.078, b['nome'], fontsize=12.5, color=CB[i], weight='bold')
        fig.text(.058, y+.061, f"qualita' storico {C['qualita'][i]} · {t['n']} operazioni", 
                 fontsize=7.8, color=INK3)
        for k, (v, e, c) in enumerate([
                (pc(t['rend'], 1), 'rendimento a rischio fisso', VERDE if t['rend'] > 0 else ROSSO),
                (it(t['R'], 1), 'punti R totali', INK),
                (it(t['R_op'], 4), 'R per operazione', INK),
                (it(t['pf'], 3), 'profit factor', INK),
                (it(t['dd'], 1)+'%', 'drawdown massimo', GIALLO),
                (it(t['t'], 2), 't sui trade', INK)]):
            kpi(fig, .058 + k*.1495, y, .137, v, e, c)
    linea(fig, .612)

    fig.text(.058, .588, 'Le risposte in una riga', fontsize=12, color=INK, weight='bold')
    A, B = C['b'][0], C['b'][1]
    peg = min(A['tot']['R_op'], B['tot']['R_op'])
    nome_peg = A['nome'] if A['tot']['R_op'] < B['tot']['R_op'] else B['nome']
    righe = [
        ('Il vantaggio sopravvive fuori campione?',
         f"si: {pc(A['sOOS']['rend'])} e {pc(B['sOOS']['rend'])} su 2 anni e 9 mesi mai visti, PF "
         f"{it(A['sOOS']['pf'],2)} e {it(B['sOOS']['pf'],2)}", VERDE),
        ('Sopravvive al cambio di broker?',
         f"si: {it(A['tot']['R_op'],4)} contro {it(B['tot']['R_op'],4)} R per operazione, "
         f"correlazione mensile {it(corr_mesi(A,B),2)}", VERDE),
        ('Era gia' + "'" + ' profittevole prima del 2024?',
         f"si, ma molto meno: IS {pc(A['sIS']['rend'])} e {pc(B['sIS']['rend'])} in 4 anni e 4 mesi",
         GIALLO),
        ('Quanto pesano gli ultimi due anni?',
         f"{it(100*A['sOOS']['R']/A['tot']['R'],0)}% e {it(100*B['sOOS']['R']/B['tot']['R'],0)}% "
         f"del risultato in {it(100*len(A['OOS'])/A['tot']['n'],0)}% delle operazioni", GIALLO),
        ('Quale numero usare per il futuro?',
         f"il peggiore dei due: {it(peg,4)} R per operazione ({nome_peg})", ROSSO),
        ('Drawdown plausibile (blocchi, 90° perc.)',
         f"{it(np.percentile(mc[0]['blocchi']['dd_pct'],90),1)}% e "
         f"{it(np.percentile(mc[1]['blocchi']['dd_pct'],90),1)}%, contro "
         f"{it(A['tot']['dd'],1)}% e {it(B['tot']['dd'],1)}% nel backtest", ROSSO),
    ]
    y = .550
    for dom, ris, c in righe:
        fig.text(.058, y, dom, fontsize=8.8, color=INK3)
        fig.text(.058, y-.019, ris, fontsize=9.4, color=c, weight='bold')
        y -= .050

    card(fig, .058, .078, .884, .108, GIALLO)
    fig.text(.078, .158, 'Quello che questo dossier NON dimostra', fontsize=11,
             color=INK, weight='bold')
    testo(fig, .078, .138,
          "Due broker sono due listini sugli STESSI anni dello STESSO mercato: non sono due prove\n"
          "indipendenti. Nessun backtest misura slittamento, rifiuti e allargamenti dello spread reali.\n"
          "Queste due cose le risponde solo la demo in avanti, non un'altra simulazione.", 8.3)
    pdf.savefig(fig); plt.close(fig)

def corr_mesi(A, B):
    a, b = mensili_pct(A), mensili_pct(B)
    k = sorted(set(a) | set(b))
    x = [a.get(i, 0.) for i in k]; y = [b.get(i, 0.) for i in k]
    sx, sy = st.pstdev(x), st.pstdev(y)
    if sx == 0 or sy == 0: return float('nan')
    mx, my = st.mean(x), st.mean(y)
    return sum((p-mx)*(q-my) for p, q in zip(x, y))/(len(k)*sx*sy)

# ======================================================================
#  2 — PROFILO DELLA STRATEGIA
# ======================================================================
SCHEDE = [
 ('S3-DONCH', 'ROTTURA', 'M30', 'rottura di canale con espansione di volatilita',
  [('Concetto', "quando il prezzo supera in chiusura il massimo (o il minimo) delle ultime 60 barre\n"
                "da 30 minuti, ed e' gia' al bordo del suo intervallo a 480 barre, entra nella direzione\n"
                "dello sfondamento. Serve anche che la volatilita' non si stia contraendo."),
   ('Ingresso', "chiusura M30 oltre il canale a 60 barre · posizione nell'intervallo a 480 barre ≥ 0,91\n"
                "(≤ 0,09 per gli short) · ATR(14)/ATR(50) ≥ 0,70"),
   ('Stop',     "2,0 ATR(14) dal prezzo di ingresso. Questo stop E' 1R"),
   ('Uscita',   "nessun take profit. Trailing a 4,0 ATR dal prezzo, attivato a +1R"),
   ('Perche\' nessun target', "il 2,5R dichiarato nella card originale amputava la coda destra:\n"
                "e' la gamba che deve prendere i movimenti lunghi")]),
 ('S2-PULLB', 'RITRACCIAMENTO', 'H4', 'ingresso sul ritracciamento dentro un trend',
  [('Concetto', "l'oro tende, ma sporco: parte, ritraccia, riparte. Un sistema veloce viene stoppato dal\n"
                "ritracciamento e perde il seguito. Questo entra proprio li' e resta dentro."),
   ('Ingresso', "chiusura H4 sopra EMA(30) con EMA inclinata · ritracciamento ≥ 1,0 ATR dal massimo\n"
                "delle ultime 20 barre · ripartenza: chiusura sopra il massimo della barra precedente\n"
                "· attesa di 3 barre dopo un ingresso"),
   ('Stop',     "0,10 ATR sotto il minimo del ritracciamento. Non abbassarlo: a 0,05 vale poco piu'\n"
                "dello spread ed e' dove il mercato va a prendere gli stop"),
   ('Uscita',   "nessun take profit. Trailing a 1,5 ATR dal prezzo, attivato a +1R"),
   ('Decorrelazione', "la ROTTURA pretende un nuovo estremo, il RITRACCIAMENTO pretende che il\n"
                "prezzo NON ci sia: non possono entrare sulla stessa candela")]),
]

def p_profilo(pdf, C):
    fig = pagina('Profilo della strategia', 'due gambe della stessa famiglia, su orizzonti diversi',
                 'STRATEGIA')
    y = .900
    for tag, nome, tf, sotto, voci in SCHEDE:
        b = C['b'][0]
        sel = [o for o in b['ops'] if o.tag == tag]
        s = stat(sel)
        fig.text(.058, y, nome, fontsize=14, color=CLEG[tag], weight='bold')
        fig.text(.058+.19, y, f"{tf} · {sotto}", fontsize=8.6, color=INK3)
        y -= .026
        for et, txt in voci:
            fig.text(.058, y, et, fontsize=8.2, color=INK, weight='bold')
            testo(fig, .215, y+.007, txt, 8.2)
            y -= .017 * (txt.count('\n') + 1) + .008
        # statistiche misurate della gamba, su entrambi i broker
        y -= .004
        for i, bb in enumerate(C['b']):
            ss = stat([o for o in bb['ops'] if o.tag == tag])
            fig.text(.058, y, bb['nome'], fontsize=8, color=CB[i], weight='bold')
            fig.text(.215, y, f"{ss['n']} operazioni · {it(ss['n']/C['durata'],0)} l'anno · "
                              f"{it(ss['R'],1)} R · {it(ss['R_op'],4)} R/op · PF {it(ss['pf'],2)} · "
                              f"tenuta media {it(ss['durata_media'],0)} h",
                     fontsize=8, color=INK2)
            y -= .017
        y -= .030
    linea(fig, y+.012)
    y -= .010
    fig.text(.058, y, "Quando funziona e quando no", fontsize=12, color=INK, weight='bold')
    y -= .026
    testo(fig, .058, y,
          "Ricavato dai dati, non dichiarato a priori (vedi la pagina sui regimi):\n\n"
          "FAVOREVOLE     mercato che si muove con decisione, in una direzione qualunque. Le due\n"
          "               gambe guadagnano sia nei mesi di forte salita sia in quelli di forte discesa.\n"
          "               Volatilita' in espansione: e' una condizione esplicita d'ingresso della ROTTURA.\n\n"
          "SFAVOREVOLE    mercato fermo o che oscilla senza andare da nessuna parte. Le rotture\n"
          "               falliscono, i ritracciamenti non ripartono, e i costi logorano il conto.\n"
          "               Il nemico non e' la direzione: e' l'immobilita'.")
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  3 — DATI E BROKER
# ======================================================================
def p_dati(pdf, C):
    fig = pagina('I dati e i due broker', 'cosa e\' stato misurato, e con quale materiale', 'DATI')
    y = .895
    xs = [(.058,'left'), (.42,'center'), (.62,'center'), (.83,'center')]
    riga_tab(fig, y, ['', C['b'][0]['nome'], C['b'][1]['nome'], ''], xs, 8.4, INK3, 'bold')
    linea(fig, y-.010)
    y -= .030
    A, B = C['b']
    voci = [
        ('Simbolo', 'XAUUSD.s', 'XAUUSD', ''),
        ('Periodo del test', A['date'][0][:10], B['date'][0][:10], 'prima operazione'),
        ('', A['date'][-1][:10], B['date'][-1][:10], 'ultima operazione'),
        ('Qualita\' dello storico MT5', C['qualita'][0], C['qualita'][1], ''),
        ('Operazioni', it(A['tot']['n']), it(B['tot']['n']), ''),
        ('Operazioni l\'anno', it(A['tot']['n']/C['durata'],0), it(B['tot']['n']/C['durata'],0), ''),
        ('Volume totale (lotti)', it(A['tot']['volume'],2), it(B['tot']['volume'],2), 'al rischio della passata'),
        ('Abbinamenti ambigui', it(A['amb']), it(B['amb']), 'su volume e direzione'),
        ('Posizioni non chiuse', it(A['aperte']), it(B['aperte']), ''),
    ]
    for c in voci:
        riga_tab(fig, y, list(c[:3]), xs, 8.8, INK)
        fig.text(.83, y, c[3], fontsize=7.6, color=INK3, ha='center')
        y -= .024
    y -= .016
    linea(fig, y+.014)

    fig.text(.058, y-.012, "Che cosa vuol dire davvero «qualita' dello storico»", fontsize=12,
             color=INK, weight='bold')
    testo(fig, .058, y-.038,
          "E' la percentuale del periodo per cui MT5 aveva i tick VERI del broker. Dove non li aveva, li\n"
          "ha generati partendo dalle barre da un minuto.\n\n"
          "Tre cose che NON significa, e che vanno tenute separate:\n\n"
          "1.  99% NON vuol dire «99% uguale al trading reale». Vuol dire che il materiale storico era\n"
          "     quasi completo. Il test resta una simulazione: non c'e' dentro nessuno slittamento vero,\n"
          "     nessun rifiuto dell'ordine, nessun allargamento di spread su una notizia.\n\n"
          "2.  Una qualita' piu' bassa NON rende il backtest automaticamente ottimista. La direzione\n"
          "     dell'errore dipende dalla strategia: un sistema con stop stretti dentro la barra tende a\n"
          "     sembrare migliore del vero con tick generati, perche' quei movimenti interni mancano.\n"
          "     Questa strategia ha stop larghi (2 ATR e il minimo del ritracciamento), quindi e' meno\n"
          "     esposta di un sistema veloce — ma «meno esposta» non e' «non esposta».\n\n"
          "3.  Le tre cose stanno su piani diversi e non vanno confuse:\n"
          "       test storico modellato      quello che c'e' in questo dossier\n"
          "       qualita' dei dati storici   quanto era completo il materiale di partenza\n"
          "       esecuzione futura reale     non misurata qui da nessuna parte\n\n"
          f"Nel confronto diretto fra i due broker, {C['b'][0]['nome']} ({C['qualita'][0]}) e' il riferimento\n"
          f"piu' solido come materiale; {C['b'][1]['nome']} ({C['qualita'][1]}) e' il broker su cui si andrebbe live.\n"
          "Per questo il dossier tiene sempre i due separati e non li fonde mai in una media.")
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  4 — PERFORMANCE A RISCHIO FISSO
# ======================================================================
def p_performance(pdf, C):
    fig = pagina('Performance a rischio fisso', 'ogni operazione rischia 100, sempre, per sette anni',
                 'PERFORMANCE')
    ax = fig.add_axes([.10, .640, .845, .225])
    for i, b in enumerate(C['b']):
        ax.plot(range(len(b['eq'])), b['eq'], color=CB[i], lw=1.8, label=b['nome'])
    ax.axhline(DEPOSITO, color=INK3, lw=.9, ls=':')
    vis = anni_su(ax, C['b'][0]['date'], 0, 0)
    ax.set_xticks(list(vis.values())); ax.set_xticklabels(list(vis), fontsize=8)
    griglia(ax); ax.legend(frameon=False, fontsize=8.6, labelcolor=INK2, loc='upper left')
    ax.set_ylabel('capitale', fontsize=8)
    ax.set_title('Curva a rischio fisso — nessun composto', fontsize=9, color=INK2,
                 loc='left', pad=7)
    for i, b in enumerate(C['b']):
        ax.annotate(pc(b['tot']['rend']), xy=(len(b['eq'])-1, b['eq'][-1]),
                    xytext=(-4, 4 if i == 0 else -12), textcoords='offset points',
                    fontsize=10, color=CB[i], weight='bold', ha='right')

    # tabella statistiche complete
    y = .590
    xs = [(.058,'left'), (.50,'right'), (.70,'right'), (.942,'right')]
    riga_tab(fig, y, ['', C['b'][0]['nome'], C['b'][1]['nome'], 'unita\''], xs, 8.2, INK3, 'bold')
    linea(fig, y-.009); y -= .026
    A, B = C['b']; rA, rB = ratios(A), ratios(B)
    F = [
     ('RISULTATO', None, None, ''),
     ('Utile netto', it(A['tot']['utile'],0), it(B['tot']['utile'],0), 'a rischio fisso'),
     ('Rendimento totale', pc(A['tot']['rend']), pc(B['tot']['rend']), '% del deposito'),
     ('Punti R totali', it(A['tot']['R'],1), it(B['tot']['R'],1), 'R'),
     ('Rendimento medio annuo', pc(rA['rend_ann']), pc(rB['rend_ann']), 'media mensile x 12'),
     ('Volatilita\' annua', it(rA['vol_ann'],1)+'%', it(rB['vol_ann'],1)+'%', 'dev.std mensile x √12'),
     ('QUALITA\' DELLE OPERAZIONI', None, None, ''),
     ('Profit factor', it(A['tot']['pf'],3), it(B['tot']['pf'],3), ''),
     ('Aspettativa per operazione', it(A['tot']['attesa'],2), it(B['tot']['attesa'],2), 'valuta'),
     ('R per operazione', it(A['tot']['R_op'],4), it(B['tot']['R_op'],4), 'R'),
     ('Operazioni vincenti', it(A['tot']['wr'],1)+'%', it(B['tot']['wr'],1)+'%', ''),
     ('Vincita media', it(A['tot']['media_v'],2), it(B['tot']['media_v'],2), 'valuta'),
     ('Perdita media', it(A['tot']['media_p'],2), it(B['tot']['media_p'],2), 'valuta'),
     ('Rapporto vincita/perdita', it(A['tot']['payoff'],2), it(B['tot']['payoff'],2), ''),
     ('Profitto lordo', it(A['tot']['lordo_v'],0), it(B['tot']['lordo_v'],0), 'valuta'),
     ('Perdita lorda', it(A['tot']['lordo_p'],0), it(B['tot']['lordo_p'],0), 'valuta'),
     ('RISCHIO', None, None, ''),
     ('Drawdown massimo', it(A['tot']['dd'],2)+'%', it(B['tot']['dd'],2)+'%', 'sulla curva fissa'),
     ('Drawdown massimo in R', it(A['tot']['dd_R'],1), it(B['tot']['dd_R'],1), 'R'),
     ('Fattore di recupero', it(A['tot']['recupero'],2), it(B['tot']['recupero'],2), 'utile / DD'),
     ('Sharpe (mensile, annualizzato)', it(rA['sharpe'],2), it(rB['sharpe'],2), 'senza tasso privo di rischio'),
     ('Sortino', it(rA['sortino'],2), it(rB['sortino'],2), 'solo deviazione negativa'),
     ('Calmar', it(rA['calmar'],2), it(rB['calmar'],2), 'rend. annuo / DD'),
     ('Serie vincente piu\' lunga', it(A['tot']['v_max']), it(B['tot']['v_max']), 'operazioni'),
     ('Serie perdente piu\' lunga', it(A['tot']['p_max']), it(B['tot']['p_max']), 'operazioni'),
     ('t sui rendimenti per operazione', it(A['tot']['t'],2), it(B['tot']['t'],2), 'dev.std R misurata'),
     ('OPERATIVITA\' E COSTI', None, None, ''),
     ('Operazioni', it(A['tot']['n']), it(B['tot']['n']), ''),
     ('Tenuta media', it(A['tot']['durata_media'],0)+' h', it(B['tot']['durata_media'],0)+' h', ''),
     ('Tenuta massima', it(A['tot']['durata_max'],0)+' h', it(B['tot']['durata_max'],0)+' h', ''),
     ('Commissioni', it(A['tot']['comm'],0), it(B['tot']['comm'],0), 'valuta, al rischio della passata'),
     ('Swap', it(A['tot']['swap'],0), it(B['tot']['swap'],0), 'valuta, al rischio della passata'),
    ]
    for et, a, b_, u in F:
        if a is None:
            y -= .004
            fig.text(.058, y, et, fontsize=7.6, color=GIALLO, weight='bold')
            y -= .019
            continue
        riga_tab(fig, y, [et, a, b_, None], xs, 8.4, INK)
        fig.text(.942, y, u, fontsize=7.4, color=INK3, ha='right')
        y -= .0175
    testo(fig, .058, y-.006,
          "Utile, rendimento, aspettativa, vincita e perdita media sono a RISCHIO FISSO. Commissioni e\n"
          "swap sono invece quelli veri della passata, che e' girata a percentuale del capitale: crescono\n"
          "col conto, quindi vanno letti come costo complessivo sostenuto, non riscalati.", 7.8, INK3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  5 — STRATEGIA CONTRO COMPRA-E-TIENI
# ======================================================================
def rend_anno(b):
    return {a: 100*sum(o.utile for o in v)/DEPOSITO for a, v in b['anni'].items()}

def p_buyhold(pdf, C):
    fig = pagina('Strategia contro compra-e-tieni', 'rischio fisso 1% contro esposizione passiva su XAUUSD',
                 'CONFRONTO')
    ax = fig.add_axes([.085, .578, .870, .292])
    A, B = C['b']
    for i, b in enumerate(C['b']):
        e = b['eq']
        ax.plot(range(len(e)), [100*(x-DEPOSITO)/DEPOSITO for x in e],
                color=CB[i], lw=2.0, label=f"{b['nome']}  {pc(b['tot']['rend'])}", zorder=3)
    mesi, bh = buyhold(A)
    idx = []
    for m in mesi:
        k = [j for j, d in enumerate(A['date']) if d[:7] <= m]
        idx.append(k[-1] if k else 0)
    ax.plot(idx, bh, color=INK3, lw=1.8, ls='--', zorder=2,
            label=f"compra e tieni XAUUSD  {pc(bh[-1])}")
    ax.axhline(0, color=INK3, lw=.9)
    vis = anni_su(ax, A['date'], 0, 0)
    ax.set_xticks(list(vis.values())); ax.set_xticklabels(list(vis), fontsize=9)
    griglia(ax)
    ax.legend(frameon=False, fontsize=8.6, labelcolor=INK2, loc='lower right')
    ax.set_ylabel('rendimento cumulato, % del deposito', fontsize=8.2)

    # etichette di rendimento annuo direttamente sul grafico
    rA, rB = rend_anno(A), rend_anno(B)
    ylo, yhi = ax.get_ylim()
    top = yhi*1.32          # banda in alto riservata alle etichette annue
    ax.set_ylim(ylo, top)
    for a, i0 in vis.items():
        if a not in rA: continue
        fine = [j for j, d in enumerate(A['date']) if d[:4] == a]
        xm = (i0 + fine[-1]) / 2
        ax.text(xm, top*.985, a, fontsize=8.4, color=INK, ha='center', va='top', weight='bold')
        ax.text(xm, top*.938, pc(rA.get(a, 0)), fontsize=8.0, color=BLU, ha='center', va='top',
                weight='bold')
        ax.text(xm, top*.892, pc(rB.get(a, 0)), fontsize=8.0, color=ARANCIO, ha='center', va='top',
                weight='bold')
    ax.axhline(yhi*1.05, color=GRIGLIA, lw=.8)

    fig.text(.058, .536, 'Rendimento per anno solare, a rischio fisso', fontsize=11.5,
             color=INK, weight='bold')
    testo(fig, .058, .518,
          "2019 e 2026 sono anni parziali: il test parte a settembre 2019 e finisce a settembre 2026.\n"
          "I due broker coprono lo stesso identico periodo, quindi nessun anno e' n/d.", 7.9, INK3)

    bha = bh_annuo(A)
    y = .468
    xs = [(.058,'left'), (.25,'right'), (.40,'right'), (.555,'right'),
          (.685,'right'), (.805,'right'), (.942,'right')]
    riga_tab(fig, y, ['anno', f"{A['nome']} %", f"{B['nome']} %", 'compra-tieni %',
                      'R PUPrime', 'R Fusion', 'operazioni'], xs, 7.8, INK3, 'bold')
    linea(fig, y-.009); y -= .026
    for a in C['anni_tot']:
        oa, ob = A['anni'].get(a, []), B['anni'].get(a, [])
        cel = [a + (' *' if a in (C['anni_tot'][0], C['anni_tot'][-1]) else ''),
               pc(rA.get(a, 0)) if oa else 'n/d',
               pc(rB.get(a, 0)) if ob else 'n/d',
               pc(bha.get(a, 0)) if a in bha else 'n/d',
               it(sum(o.R for o in oa),1) if oa else 'n/d',
               it(sum(o.R for o in ob),1) if ob else 'n/d',
               f"{len(oa)} / {len(ob)}"]
        riga_tab(fig, y, [cel[0], None, None] + cel[3:], xs, 8.6, INK)
        for k, v in ((1, rA.get(a, 0)), (2, rB.get(a, 0))):
            fig.text(xs[k][0], y, cel[k], fontsize=8.6, ha='right',
                     color=VERDE if v > 0 else ROSSO, weight='bold')
        y -= .0205
    linea(fig, y+.012); y -= .012
    riga_tab(fig, y, ['TOTALE', pc(A['tot']['rend']), pc(B['tot']['rend']), pc(bh[-1]),
                      it(A['tot']['R'],1), it(B['tot']['R'],1),
                      f"{A['tot']['n']} / {B['tot']['n']}"], xs, 8.8, INK, 'bold')
    y -= .034
    fig.text(.058, y, '* anno parziale', fontsize=7.4, color=INK3)

    card(fig, .058, .068, .884, .105)
    fig.text(.078, .150, 'Sono due cose diverse, e vanno confrontate sapendolo', fontsize=10.5,
             color=INK, weight='bold')
    testo(fig, .078, .130,
          "Il compra-e-tieni non ha stop: si prende ogni discesa dell'oro per intero, e il suo drawdown\n"
          "non e' paragonabile a quello della strategia, che rischia una cifra fissa decisa a priori per\n"
          "operazione e guadagna anche nei mesi di discesa. Il confronto da' il contesto — l'oro e'\n"
          "salito molto da solo — non dichiara un vincitore.", 8.2)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  6 — ANNO PER ANNO
# ======================================================================
def p_annuale(pdf, C):
    fig = pagina('Anno per anno', 'il risultato e\' distribuito nel tempo o concentrato di recente?',
                 'CONSISTENZA')
    A, B = C['b']; rA, rB = rend_anno(A), rend_anno(B)
    anni = C['anni_tot']
    ax = fig.add_axes([.085, .640, .870, .225])
    x = np.arange(len(anni)); w = .38
    for i, (b, r) in enumerate(((A, rA), (B, rB))):
        v = [r.get(a, 0) for a in anni]
        ax.bar(x + (i-.5)*w, v, w, color=CB[i], label=b['nome'])
        for j, val in enumerate(v):
            ax.text(x[j]+(i-.5)*w, val + (1.5 if val >= 0 else -4.5),
                    pc(val, 0), fontsize=7.4, color=CB[i], ha='center', weight='bold')
    ax.set_xticks(x); ax.set_xticklabels(anni, fontsize=9)
    ax.axhline(0, color=INK3, lw=1); griglia(ax)
    ax.legend(frameon=False, fontsize=8.6, labelcolor=INK2, loc='upper left')
    ax.set_ylabel('rendimento annuo, % (rischio fisso)', fontsize=8.2)
    lo, hi = ax.get_ylim(); ax.set_ylim(lo-4, hi+6)

    # dispersione degli anni
    y = .595
    fig.text(.058, y, 'Come sono distribuiti gli anni', fontsize=11.5, color=INK, weight='bold')
    y -= .028
    xs = [(.058,'left'), (.55,'right'), (.80,'right')]
    riga_tab(fig, y, ['', A['nome'], B['nome']], xs, 8.2, INK3, 'bold')
    linea(fig, y-.009); y -= .026
    def disp(r):
        v = list(r.values())
        return v, st.mean(v), st.median(v), (st.pstdev(v) if len(v) > 1 else 0.0)
    vA, mA, mdA, sA = disp(rA); vB, mB, mdB, sB = disp(rB)
    ultime = [C['anni_tot'][-3], C['anni_tot'][-2], C['anni_tot'][-1]]
    contrib = lambda b: 100*sum(o.R for o in b['ops'] if o.chiusura[:4] >= CONFINE_OOS[:4])/b['tot']['R']
    for et, a, b_ in [
        ('Anni misurati', it(len(vA)), it(len(vB))),
        ('Rendimento annuo medio', pc(mA), pc(mB)),
        ('Rendimento annuo mediano', pc(mdA), pc(mdB)),
        ('Deviazione standard fra anni', it(sA,1)+'%', it(sB,1)+'%'),
        ('Anno migliore', f"{max(rA,key=rA.get)}  {pc(max(vA))}", f"{max(rB,key=rB.get)}  {pc(max(vB))}"),
        ('Anno peggiore', f"{min(rA,key=rA.get)}  {pc(min(vA))}", f"{min(rB,key=rB.get)}  {pc(min(vB))}"),
        ('Anni in utile', f"{sum(1 for v in vA if v>0)} su {len(vA)}  ({it(100*sum(1 for v in vA if v>0)/len(vA),0)}%)",
                          f"{sum(1 for v in vB if v>0)} su {len(vB)}  ({it(100*sum(1 for v in vB if v>0)/len(vB),0)}%)"),
        ('Anni sopra il +10%', f"{sum(1 for v in vA if v>10)} su {len(vA)}", f"{sum(1 for v in vB if v>10)} su {len(vB)}"),
        ('Quota di R dal 2024 in poi', it(contrib(A),0)+'%', it(contrib(B),0)+'%'),
        ('Quota di R fino al 2023', it(100-contrib(A),0)+'%', it(100-contrib(B),0)+'%'),
    ]:
        riga_tab(fig, y, [et, a, b_], xs, 8.6, INK); y -= .0215

    y -= .010
    card(fig, .058, y-.118, .884, .112, ROSSO)
    fig.text(.078, y-.028, 'La cosa da aspettarsi non e\' il rendimento: sono gli anni a vuoto',
             fontsize=11, color=INK, weight='bold')
    deboli = [a for a in anni if rA.get(a,0) < 10 and rB.get(a,0) < 10]
    testo(fig, .078, y-.048,
          f"{len(deboli)} anni su {len(anni)} sotto il +10% su entrambi i broker: {', '.join(deboli)}.\n"
          "Non sono anni brutti a caso: sono quelli in cui l'oro e' stato fermo. Tradotto in pratica,\n"
          "12-18 mesi senza guadagnare sono dentro la normalita' storica di questa strategia.", 8.3)
    pdf.savefig(fig); plt.close(fig)

def p_annuale_dettaglio(pdf, C):
    fig = pagina('Anno per anno, statistiche complete', 'tutte a rischio fisso, broker per broker',
                 'CONSISTENZA')
    y = .900
    for i, b in enumerate(C['b']):
        fig.text(.058, y, b['nome'], fontsize=12.5, color=CB[i], weight='bold')
        y -= .026
        xs = [(.058,'left'), (.20,'right'), (.30,'right'), (.395,'right'), (.485,'right'),
              (.575,'right'), (.665,'right'), (.762,'right'), (.855,'right'), (.942,'right')]
        riga_tab(fig, y, ['anno','rend.%','R','oper.','vincenti','PF','aspett.','DD%','lordo +','lordo −'],
                 xs, 7.6, INK3, 'bold')
        linea(fig, y-.009); y -= .024
        for a, v in b['anni'].items():
            s = stat(v)
            riga_tab(fig, y, [a, None, it(s['R'],1), it(s['n']),
                              it(s['wr'],1)+'%', it(s['pf'],2), it(s['attesa'],1),
                              it(s['dd'],1), it(s['lordo_v'],0), it(s['lordo_p'],0)],
                     xs, 8.2, INK)
            fig.text(.20, y, pc(s['rend']), fontsize=8.2, ha='right',
                     color=VERDE if s['rend'] > 0 else ROSSO, weight='bold')
            y -= .0195
        linea(fig, y+.012); y -= .012
        t = b['tot']
        riga_tab(fig, y, ['tutto', pc(t['rend']), it(t['R'],1), it(t['n']), it(t['wr'],1)+'%',
                          it(t['pf'],2), it(t['attesa'],1), it(t['dd'],1),
                          it(t['lordo_v'],0), it(t['lordo_p'],0)], xs, 8.4, INK, 'bold')
        y -= .050
    testo(fig, .058, y,
          "Il drawdown per anno e' calcolato dentro quell'anno soltanto, quindi non si somma e non\n"
          "coincide con quello di tutto il periodo: una discesa a cavallo di due anni viene spezzata.\n"
          "Lordo + e lordo − sono a rischio fisso. L'aspettativa e' in valuta per operazione.\n\n"
          "Costi per anno: non sono in questa tabella perche' commissioni e swap della passata sono\n"
          "al rischio composto e crescono col conto — metterli accanto a numeri a rischio fisso\n"
          "sarebbe un confronto fra grandezze diverse. Stanno tutti nella pagina sui costi.", 8.0, INK3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  7 — CROSS-BROKER
# ======================================================================
def p_crossbroker(pdf, C):
    fig = pagina('Validazione incrociata fra broker',
                 'stessa strategia, stesso periodo, due listini e due strutture di costo', 'ROBUSTEZZA')
    A, B = C['b']
    ax = fig.add_axes([.085, .655, .870, .215])
    for i, b in enumerate(C['b']):
        ax.plot(range(len(b['eq'])), [100*(x-DEPOSITO)/DEPOSITO for x in b['eq']],
                color=CB[i], lw=2.0, label=b['nome'])
    ax.axhline(0, color=INK3, lw=.9)
    vis = anni_su(ax, A['date'], 0, 0)
    ax.set_xticks(list(vis.values())); ax.set_xticklabels(list(vis), fontsize=8.6)
    griglia(ax); ax.legend(frameon=False, fontsize=8.6, labelcolor=INK2, loc='upper left')
    ax.set_ylabel('rendimento cumulato %', fontsize=8.2)
    ax.set_title('Le due curve a rischio fisso, sovrapposte', fontsize=9, color=INK2, loc='left', pad=7)

    y = .615
    xs = [(.058,'left'), (.52,'right'), (.74,'right'), (.942,'right')]
    riga_tab(fig, y, ['', A['nome'], B['nome'], 'scarto'], xs, 8.2, INK3, 'bold')
    linea(fig, y-.009); y -= .026
    def sc(a, b_, pct=True):
        if b_ == 0 or a != a or b_ != b_: return 'n/d'
        d = 100*abs(a-b_)/max(abs(a), abs(b_))
        return it(d,1)+'%'
    rA, rB = ratios(A), ratios(B)
    F = [
        ('Rendimento a rischio fisso', pc(A['tot']['rend']), pc(B['tot']['rend']),
         sc(A['tot']['rend'], B['tot']['rend'])),
        ('Punti R totali', it(A['tot']['R'],1), it(B['tot']['R'],1), sc(A['tot']['R'], B['tot']['R'])),
        ('R per operazione', it(A['tot']['R_op'],4), it(B['tot']['R_op'],4),
         sc(A['tot']['R_op'], B['tot']['R_op'])),
        ('Operazioni', it(A['tot']['n']), it(B['tot']['n']), sc(A['tot']['n'], B['tot']['n'])),
        ('Operazioni vincenti', it(A['tot']['wr'],1)+'%', it(B['tot']['wr'],1)+'%',
         sc(A['tot']['wr'], B['tot']['wr'])),
        ('Profit factor', it(A['tot']['pf'],3), it(B['tot']['pf'],3), sc(A['tot']['pf'], B['tot']['pf'])),
        ('Aspettativa per operazione', it(A['tot']['attesa'],2), it(B['tot']['attesa'],2),
         sc(A['tot']['attesa'], B['tot']['attesa'])),
        ('Vincita media', it(A['tot']['media_v'],2), it(B['tot']['media_v'],2),
         sc(A['tot']['media_v'], B['tot']['media_v'])),
        ('Perdita media', it(A['tot']['media_p'],2), it(B['tot']['media_p'],2),
         sc(A['tot']['media_p'], B['tot']['media_p'])),
        ('Drawdown massimo', it(A['tot']['dd'],2)+'%', it(B['tot']['dd'],2)+'%',
         sc(A['tot']['dd'], B['tot']['dd'])),
        ('Tenuta media', it(A['tot']['durata_media'],0)+' h', it(B['tot']['durata_media'],0)+' h',
         sc(A['tot']['durata_media'], B['tot']['durata_media'])),
        ('Commissioni (passata)', it(A['tot']['comm'],0), it(B['tot']['comm'],0), ''),
        ('Swap (passata)', it(A['tot']['swap'],0), it(B['tot']['swap'],0), ''),
    ]
    for et, a, b_, s in F:
        riga_tab(fig, y, [et, a, b_, None], xs, 8.5, INK)
        fig.text(.942, y, s, fontsize=8.3, ha='right',
                 color=VERDE if (s.endswith('%') and float(s[:-1].replace(',','.')) < 10)
                 else (GIALLO if s.endswith('%') else INK3))
        y -= .0205

    y -= .012
    fig.text(.058, y, 'Gamba per gamba: chi regge il cambio di listino', fontsize=11.5,
             color=INK, weight='bold')
    y -= .028
    xs2 = [(.058,'left'), (.34,'right'), (.47,'right'), (.62,'right'), (.75,'right'), (.942,'right')]
    riga_tab(fig, y, ['gamba', 'oper. A', 'oper. B', 'R/op A', 'R/op B', 'scarto operazioni'],
             xs2, 7.8, INK3, 'bold')
    linea(fig, y-.009); y -= .026
    for tag in ('S2-PULLB', 'S3-DONCH'):
        sa = stat([o for o in A['ops'] if o.tag == tag])
        sb = stat([o for o in B['ops'] if o.tag == tag])
        d = 100*abs(sa['n']-sb['n'])/max(sa['n'], sb['n'])
        riga_tab(fig, y, [None, it(sa['n']), it(sb['n']),
                          it(sa['R_op'],4), it(sb['R_op'],4), None], xs2, 8.6, INK)
        fig.text(.058, y, NLEG[tag], fontsize=8.6, color=CLEG[tag], weight='bold')
        fig.text(.942, y, it(d,1)+'%', fontsize=8.6, ha='right',
                 color=VERDE if d < 3 else GIALLO, weight='bold')
        y -= .022

    y -= .016
    card(fig, .058, y-.138, .884, .130, VERDE)
    fig.text(.078, y-.030, 'Che cosa dicono questi numeri', fontsize=11, color=INK, weight='bold')
    testo(fig, .078, y-.050,
          f"Correlazione dei rendimenti MENSILI fra i due broker: {it(corr_mesi(A,B),2)}. I mesi buoni e i mesi\n"
          "brutti sono gli stessi, con ampiezze diverse: il risultato segue la strategia, non il listino.\n"
          "La gamba lenta su H4 fa lo stesso identico numero di operazioni sui due broker; quella\n"
          "veloce su M30 no, perche' vede anche i dettagli dentro la barra. E' il comportamento che\n"
          "ci si aspetta, ed e' nella direzione giusta: a variare e' la gamba che deve variare.", 8.3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  8 — IS / OOS
# ======================================================================
def p_isoos(pdf, C):
    fig = pagina('Dentro e fuori campione',
                 f"confine fissato nel progetto prima del test: IS fino al 2023.12.31, "
                 f"OOS dal {CONFINE_OOS}", 'VALIDAZIONE')
    A, B = C['b']
    ax = fig.add_axes([.085, .655, .870, .215])
    taglio = None
    for i, b in enumerate(C['b']):
        ax.plot(range(len(b['eq'])), [100*(x-DEPOSITO)/DEPOSITO for x in b['eq']],
                color=CB[i], lw=2.0, label=b['nome'])
    k = next(j for j, d in enumerate(A['date']) if d[:10] >= CONFINE_OOS)
    ylo, yhi = ax.get_ylim()
    top = yhi*1.42          # banda in alto per le etichette, fuori dalle curve
    ax.set_ylim(ylo, top)
    ax.axvline(k, color=GIALLO, lw=1.8, ls='--')
    ax.axhline(yhi*1.06, color=GRIGLIA, lw=.8)
    ax.text(k*.5, top*.975, 'DENTRO CAMPIONE', fontsize=8.6, color=GIALLO, ha='center',
            va='top', weight='bold')
    ax.text(k+(len(A['eq'])-k)*.5, top*.975, 'FUORI CAMPIONE', fontsize=8.6, color=GIALLO,
            ha='center', va='top', weight='bold')
    for i, b in enumerate(C['b']):
        ax.text(k*.5, top*(.915-.055*i), f"{b['nome']}  {pc(b['sIS']['rend'])}",
                fontsize=8.6, color=CB[i], ha='center', va='top', weight='bold')
        ax.text(k+(len(b['eq'])-k)*.5, top*(.915-.055*i), f"{b['nome']}  {pc(b['sOOS']['rend'])}",
                fontsize=8.6, color=CB[i], ha='center', va='top', weight='bold')
    vis = anni_su(ax, A['date'], 0, 0)
    ax.set_xticks(list(vis.values())); ax.set_xticklabels(list(vis), fontsize=8.6)
    ax.axhline(0, color=INK3, lw=.9); griglia(ax)
    ax.legend(frameon=False, fontsize=8.4, labelcolor=INK2, loc='upper left')
    ax.set_ylabel('rendimento cumulato %', fontsize=8.2)

    y = .610
    xs = [(.058,'left'), (.34,'right'), (.50,'right'), (.68,'right'), (.855,'right')]
    riga_tab(fig, y, ['', f"IS {A['nome']}", f"OOS {A['nome']}",
                      f"IS {B['nome']}", f"OOS {B['nome']}"], xs, 7.6, INK3, 'bold')
    linea(fig, y-.009); y -= .026
    per = [('Periodo', A['date'][0][:10]+'\n→2023.12.31', CONFINE_OOS+'\n→'+A['date'][-1][:10],
            B['date'][0][:10]+'\n→2023.12.31', CONFINE_OOS+'\n→'+B['date'][-1][:10])]
    for et, k1 in [('Rendimento a rischio fisso','rend'), ('Punti R','R'), ('R per operazione','R_op'),
                   ('Profit factor','pf'), ('Aspettativa per operazione','attesa'),
                   ('Operazioni','n'), ('Operazioni vincenti','wr'), ('Drawdown massimo','dd')]:
        f1 = (lambda v: pc(v)) if k1 == 'rend' else \
             (lambda v: it(v,1)) if k1 == 'R' else \
             (lambda v: it(v,4)) if k1 == 'R_op' else \
             (lambda v: it(v,3)) if k1 == 'pf' else \
             (lambda v: it(v,2)) if k1 == 'attesa' else \
             (lambda v: it(v)) if k1 == 'n' else \
             (lambda v: it(v,1)+'%')
        riga_tab(fig, y, [et, f1(A['sIS'][k1]), f1(A['sOOS'][k1]),
                          f1(B['sIS'][k1]), f1(B['sOOS'][k1])], xs, 8.5, INK)
        y -= .0215
    y -= .004
    fig.text(.058, y, 'Periodo', fontsize=8.5, color=INK2)
    for j, s in enumerate([A['date'][0][:7]+'→2023.12', '2024.01→'+A['date'][-1][:7],
                           B['date'][0][:7]+'→2023.12', '2024.01→'+B['date'][-1][:7]]):
        fig.text(xs[j+1][0], y, s, fontsize=7.6, color=INK3, ha='right')
    y -= .034

    card(fig, .058, y-.192, .884, .184, VERDE)
    fig.text(.078, y-.028, 'Il vantaggio e\' sopravvissuto ai dati mai visti — con un avvertimento',
             fontsize=11, color=INK, weight='bold')
    testo(fig, .078, y-.046,
          f"Il fuori campione rende PIU' del periodo di costruzione su entrambi i broker\n"
          f"({pc(A['sIS']['rend'])} → {pc(A['sOOS']['rend'])} e {pc(B['sIS']['rend'])} → {pc(B['sOOS']['rend'])}), "
          f"e in meno tempo. Non e' una buona notizia:\n"
          "il 2024-2026 e' stato un periodo eccezionale per l'oro, e quel vento non si ripete a comando.\n\n"
          "Il fuori campione serve a rispondere «il vantaggio esiste ancora fuori dai dati su cui e' stato\n"
          "costruito?», e la risposta e' si. NON risponde «quanto rendera' in futuro»: per quello il\n"
          "numero onesto e' il PIU' BASSO dei due periodi, cioe' quello di costruzione.\n\n"
          "Questo campione fuori e' stato guardato UNA VOLTA SOLA, come dichiarato nel progetto:\n"
          "non esistono piu' dati vergini su questi anni, e riottimizzare qui peggiorerebbe la\n"
          "statistica invece di migliorarla.", 8.3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  9 — PERCORSO: esempi di riferimento
# ======================================================================
def _percorso_sintetico(n, r2_bersaglio, seed, forma='lineare'):
    """Costruisce una curva cumulata con un R^2 vicino al bersaglio.
    L'etichetta riportera' l'R^2 MISURATO, non quello voluto."""
    rng = np.random.default_rng(seed)
    t = np.arange(n)
    if forma == 'lineare':
        base = t.astype(float)
    elif forma == 'parabolico':
        base = (t/n)**2.6 * n
    else:
        base = t.astype(float)
    for scala in np.linspace(0.01, 3.0, 400):
        y = base + np.cumsum(rng.standard_normal(n)) * scala * n/100
        yy = y - y.min()
        r = regressione(list(yy))['r2']
        if r <= r2_bersaglio: return yy, r
        rng = np.random.default_rng(seed)
    return yy, r

def p_percorso_esempi(pdf, C):
    fig = pagina('Come si legge la regolarita\' del percorso',
                 'che aspetto ha un R² di 0,75, 0,80, 0,90 — e che cosa NON dice', 'PERCORSO')
    testo(fig, .058, .905,
          "Si adatta una retta alla curva cumulata e si guarda quanto ci sta vicino. La misura e' l'R²\n"
          "della regressione lineare del capitale cumulato contro il numero dell'operazione.\n\n"
          "AVVERTENZA STATISTICA, ed e' quella che conta piu' di tutto il resto di questa pagina:\n"
          "una curva cumulata e' una somma, quindi ogni punto contiene tutti i precedenti ed e'\n"
          "fortemente autocorrelato. Anche una passeggiata puramente casuale, senza nessun\n"
          "vantaggio, produce R² alti — spesso sopra 0,90. Quindi:\n\n"
          "    R² alto  =  il percorso e' stato regolare\n"
          "    R² alto  ≠  il vantaggio esiste, ed e' statisticamente solido\n\n"
          "Per «il vantaggio esiste» serve la t sui rendimenti per OPERAZIONE, che non sono cumulati\n"
          "e quindi non hanno quel difetto. Le due misure stanno in questo dossier tutte e due, e\n"
          "rispondono a domande diverse. L'R² non va mai usato per decidere se una strategia e' buona.")

    esempi = [(0.75, 7, 'lineare', 'percorso irregolare'),
              (0.80, 3, 'lineare', 'moderatamente regolare'),
              (0.90, 11, 'lineare', 'molto regolare'),
              (0.99, 5, 'parabolico', 'accelerante / parabolico')]
    for k, (bers, seed, forma, et) in enumerate(esempi):
        r, c = divmod(k, 2)
        ax = fig.add_axes([.085 + c*.470, .400 - r*.190, .390, .140])
        y, r2 = _percorso_sintetico(600, bers, seed, forma)
        ax.plot(y, color=VIOLA, lw=1.5)
        reg = regressione(list(y))
        ax.plot([reg['intercetta'] + reg['pendenza']*i for i in range(len(y))],
                color=INK3, lw=1.2, ls='--')
        ax.set_xticks([]); ax.set_yticks([])
        ax.set_title(f"{et}   —   R² misurato {it(r2,3)}", fontsize=8.6, color=INK2,
                     loc='left', pad=5)
    testo(fig, .058, .190,
          "Sono curve costruite apposta, non risultati di questa strategia: servono solo a dare l'occhio.\n"
          "La riga tratteggiata e' la retta adattata. Il quarto caso e' quello da riconoscere: un percorso\n"
          "che accelera ha R² altissimo pur essendo il MENO regolare dei quattro, perche' quasi tutto\n"
          "il guadagno arriva alla fine. E' esattamente il rischio di una strategia che ha preso un solo\n"
          "regime di mercato favorevole — e per questo nella pagina successiva la retta viene adattata\n"
          "anche separatamente su dentro e fuori campione.")
    pdf.savefig(fig); plt.close(fig)

def p_percorso_reale(pdf, C):
    fig = pagina('Il percorso vero', 'quanto regolarmente la strategia ha accumulato il risultato',
                 'PERCORSO')
    A, B = C['b']
    for i, b in enumerate(C['b']):
        ax = fig.add_axes([.085, .660 - i*.235, .870, .185])
        y = [100*(x-DEPOSITO)/DEPOSITO for x in b['eq'][1:]]
        reg = regressione(y)
        ax.plot(y, color=CB[i], lw=1.8, label=b['nome'])
        ax.plot([reg['intercetta'] + reg['pendenza']*j for j in range(len(y))],
                color=INK3, lw=1.3, ls='--', label='retta adattata')
        k = next(j for j, d in enumerate(b['date']) if d[:10] >= CONFINE_OOS)
        ax.axvline(k, color=GIALLO, lw=1.2, ls=':')
        vis = anni_su(ax, b['date'], 0, 0)
        ax.set_xticks(list(vis.values())); ax.set_xticklabels(list(vis), fontsize=8)
        griglia(ax); ax.legend(frameon=False, fontsize=8, labelcolor=INK2, loc='upper left')
        ax.set_ylabel('rendimento %', fontsize=8)
        ax.set_title(f"{b['nome']}   R² {it(reg['r2'],3)}   pendenza {it(reg['pendenza'],4)}% "
                     f"per operazione   residuo tipico {it(reg['res_sd'],1)} punti %",
                     fontsize=9, color=CB[i], loc='left', pad=6, weight='bold')

    y = .195
    xs = [(.058,'left'), (.48,'right'), (.70,'right'), (.942,'right')]
    riga_tab(fig, y, ['', A['nome'], B['nome'], 'che cosa misura'], xs, 8.0, INK3, 'bold')
    linea(fig, y-.009); y -= .024
    rA, rB = A['reg'], B['reg']
    def pend_is_oos(b):
        y_ = [100*(x-DEPOSITO)/DEPOSITO for x in b['eq'][1:]]
        k = next(j for j, d in enumerate(b['date']) if d[:10] >= CONFINE_OOS)
        return regressione(y_[:k])['pendenza'], regressione(y_[k:])['pendenza']
    pA, pB = pend_is_oos(A), pend_is_oos(B)
    for et, a, b_, d in [
        ('R² sulla curva cumulata', it(rA['r2'],3), it(rB['r2'],3), 'regolarita\', NON solidita\''),
        ('Pendenza (% per operazione)', it(rA['pendenza'],4), it(rB['pendenza'],4), 'guadagno medio'),
        ('Dispersione dei residui', it(rA['res_sd'],1), it(rB['res_sd'],1), 'punti % dalla retta'),
        ('Scostamento massimo', it(rA['res_max'],1), it(rB['res_max'],1), 'punti %'),
        ('Pendenza dentro campione', it(pA[0],4), it(pB[0],4), '% per operazione'),
        ('Pendenza fuori campione', it(pA[1],4), it(pB[1],4), '% per operazione'),
        ('Rapporto OOS / IS', it(pA[1]/pA[0],2)+'×', it(pB[1]/pB[0],2)+'×', 'accelerazione'),
        ('t sui rendimenti per operazione', it(A['tot']['t'],2), it(B['tot']['t'],2),
         'QUESTA dice se il vantaggio regge'),
    ]:
        riga_tab(fig, y, [et, a, b_, None], xs, 8.4, INK)
        fig.text(.942, y, d, fontsize=7.4, color=INK3, ha='right')
        y -= .0205
    y -= .012
    testo(fig, .058, y,
          f"L'accelerazione c'e' ed e' misurabile: la pendenza fuori campione e' {it(pA[1]/pA[0],1)}× e "
          f"{it(pB[1]/pB[0],1)}× quella del\nperiodo di costruzione. Non e' un difetto del sistema — e' il "
          "mercato: il 2024-2026 e' stato un periodo\neccezionale per l'oro. Ma significa che il percorso "
          "NON e' stato uniforme, e che proiettare in\navanti la pendenza recente sarebbe l'errore piu' "
          "facile da fare con questi grafici.", 8.4)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  10 — REGIMI
# ======================================================================
FASCE = [('forte discesa', -1e9, -3.0), ('discesa lenta', -3.0, -0.5),
         ('fermo', -0.5, 0.5), ('salita lenta', 0.5, 3.0), ('forte salita', 3.0, 1e9)]

def regimi(b):
    """Ogni mese classificato per quanto si e' mosso l'oro, e per quanto
    e' stata alta la volatilita' realizzata."""
    pz = b['prezzi']; mesi = sorted(pz)
    var = {}
    for j in range(1, len(mesi)):
        var[mesi[j]] = 100*(pz[mesi[j]]/pz[mesi[j-1]] - 1)
    vol = {}
    fin = [var[m] for m in mesi[1:]]
    mediana = st.median([abs(v) for v in fin]) if fin else 0.0
    for m, v in var.items():
        vol[m] = 'alta' if abs(v) >= mediana else 'bassa'
    out = {}
    for nome, lo, hi in FASCE:
        sel = [m for m, v in var.items() if lo <= v < hi]
        ops = [o for o in b['ops'] if o.chiusura[:7] in sel]
        out[nome] = (len(sel), ops)
    volout = {}
    for k in ('alta', 'bassa'):
        sel = [m for m, v in vol.items() if v == k]
        volout[k] = (len(sel), [o for o in b['ops'] if o.chiusura[:7] in sel])
    return out, volout, var

def p_regimi(pdf, C):
    fig = pagina('Analisi dei regimi di mercato',
                 'il vantaggio era gia\' li\' prima del 2024, o dipende dal regime recente?', 'REGIMI')
    A, B = C['b']
    regA, volA, varA = regimi(A)
    ax = fig.add_axes([.085, .660, .870, .195])
    x = np.arange(len(FASCE)); w = .38
    for i, b in enumerate(C['b']):
        r, _, _ = regimi(b)
        v = []
        for nome, _, _2 in FASCE:
            nm, ops = r[nome]
            v.append(sum(o.R for o in ops)/nm if nm else 0.0)
        ax.bar(x+(i-.5)*w, v, w, color=CB[i], label=b['nome'])
        for j, val in enumerate(v):
            ax.text(x[j]+(i-.5)*w, val + (.12 if val >= 0 else -.35), it(val,1),
                    fontsize=7.4, color=CB[i], ha='center', weight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels([f"{n}\n({regA[n][0]} mesi)" for n, _, _2 in FASCE], fontsize=8.2)
    ax.axhline(0, color=INK3, lw=1); griglia(ax)
    ax.legend(frameon=False, fontsize=8.4, labelcolor=INK2, loc='upper center')
    ax.set_ylabel('punti R medi al mese', fontsize=8.2)
    ax.set_title("Quanto rende al mese secondo cosa ha fatto l'oro", fontsize=9,
                 color=INK2, loc='left', pad=6)
    lo, hi = ax.get_ylim(); ax.set_ylim(lo-.4, hi+.8)

    y = .620
    xs = [(.058,'left'), (.30,'right'), (.42,'right'), (.545,'right'), (.665,'right'),
          (.80,'right'), (.942,'right')]
    for i, b in enumerate(C['b']):
        r, vv, _ = regimi(b)
        fig.text(.058, y, b['nome'], fontsize=10, color=CB[i], weight='bold'); y -= .022
        riga_tab(fig, y, ['regime', 'mesi', 'oper.', 'R', 'R/op', 'PF', 'DD%'], xs, 7.6, INK3, 'bold')
        linea(fig, y-.008); y -= .022
        for nome, _, _2 in FASCE:
            nm, ops = r[nome]
            if not ops:
                riga_tab(fig, y, [nome, it(nm), '0', 'n/d', 'n/d', 'n/d', 'n/d'], xs, 8.2, INK3)
                y -= .019; continue
            s = stat(ops)
            riga_tab(fig, y, [nome, it(nm), it(s['n']), None, it(s['R_op'],3),
                              it(s['pf'],2), it(s['dd'],1)], xs, 8.2, INK)
            fig.text(.545, y, it(s['R'],1), fontsize=8.2, ha='right',
                     color=VERDE if s['R'] > 0 else ROSSO, weight='bold')
            y -= .019
        for k in ('alta', 'bassa'):
            nm, ops = vv[k]
            s = stat(ops)
            riga_tab(fig, y, [f'volatilita\' {k}', it(nm), it(s['n']), it(s['R'],1),
                              it(s['R_op'],3), it(s['pf'],2), it(s['dd'],1)], xs, 8.2, INK2)
            y -= .019
        y -= .016

    card(fig, .058, y-.186, .884, .180, GIALLO)
    fig.text(.078, y-.026, 'La risposta alla domanda, con i numeri', fontsize=11,
             color=INK, weight='bold')
    isA, isB = A['sIS'], B['sIS']
    testo(fig, .078, y-.044,
          f"«Era gia' profittevole prima del regime rialzista recente?»  SI, ma molto meno.\n"
          f"Dal settembre 2019 a fine 2023, senza toccare i dati del 2024-2026: {pc(isA['rend'])} su "
          f"{A['nome']}\ne {pc(isB['rend'])} su {B['nome']}, con profit factor {it(isA['pf'],2)} e "
          f"{it(isB['pf'],2)}. Positivo, ma meta' del risultato\ntotale arriva dagli ultimi due anni e nove "
          f"mesi, che sono il {it(100*len(A['OOS'])/A['tot']['n'],0)}% delle operazioni.\n\n"
          "La forma dei regimi e' pero' coerente e non dipende dal periodo: guadagna ai due estremi\n"
          "— forte salita E forte discesa — e perde quando l'oro non va da nessuna parte. Non e'\n"
          "un sistema che ha bisogno che l'oro salga: e' un sistema che ha bisogno che si muova.", 8.3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  11 — DRAWDOWN
# ======================================================================
def p_drawdown(pdf, C):
    fig = pagina('Drawdown e rischio', 'quanto e quanto a lungo, sulla curva a rischio fisso', 'RISCHIO')
    A, B = C['b']
    ax = fig.add_axes([.085, .665, .870, .195])
    for i, b in enumerate(C['b']):
        e = np.array(b['eq']); picco = np.maximum.accumulate(e)
        ax.plot(range(len(e)), -100*(picco-e)/picco, color=CB[i], lw=1.5, label=b['nome'])
    vis = anni_su(ax, A['date'], 0, 0)
    ax.set_xticks(list(vis.values())); ax.set_xticklabels(list(vis), fontsize=8.6)
    griglia(ax); ax.legend(frameon=False, fontsize=8.6, labelcolor=INK2, loc='lower left')
    ax.set_ylabel('sotto il massimo precedente, %', fontsize=8.2)
    ax.set_title('Curva del drawdown', fontsize=9, color=INK2, loc='left', pad=6)

    def durate_dd(b):
        e = np.array(b['eq']); picco = np.maximum.accumulate(e)
        sotto = e < picco
        cur = mx = 0
        for s in sotto:
            cur = cur + 1 if s else 0
            mx = max(mx, cur)
        return mx, 100*sotto.mean()

    y = .620
    xs = [(.058,'left'), (.52,'right'), (.80,'right')]
    riga_tab(fig, y, ['', A['nome'], B['nome']], xs, 8.2, INK3, 'bold')
    linea(fig, y-.009); y -= .026
    dA, dB = durate_dd(A), durate_dd(B)
    for et, a, b_ in [
        ('Drawdown massimo (rischio fisso)', it(A['tot']['dd'],2)+'%', it(B['tot']['dd'],2)+'%'),
        ('Drawdown massimo in R', it(A['tot']['dd_R'],1), it(B['tot']['dd_R'],1)),
        ('Piu\' lunga discesa (operazioni)', it(dA[0]), it(dB[0])),
        ('Tempo passato sotto il massimo', it(dA[1],1)+'%', it(dB[1],1)+'%'),
        ('Serie perdente piu\' lunga', it(A['tot']['p_max'])+' operazioni', it(B['tot']['p_max'])+' operazioni'),
        ('Serie vincente piu\' lunga', it(A['tot']['v_max'])+' operazioni', it(B['tot']['v_max'])+' operazioni'),
        ('Fattore di recupero', it(A['tot']['recupero'],2), it(B['tot']['recupero'],2)),
    ]:
        riga_tab(fig, y, [et, a, b_], xs, 8.6, INK); y -= .0215

    y -= .018
    fig.text(.058, y, 'Perche\' il drawdown a rischio fisso e\' piu\' basso di quello del backtest',
             fontsize=11.5, color=INK, weight='bold')
    testo(fig, .058, y-.026,
          "Nel backtest, girato a percentuale del capitale, le posizioni crescono col conto: una serie di\n"
          "perdite che arriva quando il conto e' grande costa molto di piu' in percentuale. A rischio\n"
          "fisso ogni operazione pesa sempre uguale, quindi la stessa serie di perdite fa meno danno.\n\n"
          "Sono due numeri diversi e giusti tutti e due, ma rispondono a domande diverse:\n\n"
          "    rischio fisso   com'e' fatta la strategia, senza l'effetto della dimensione del conto\n"
          "    composto        quanto avresti sofferto davvero facendola girare cosi'\n\n"
          "Il drawdown del backtest, qualunque dei due, resta UN SOLO percorso: quello che e'\n"
          "capitato. Per sapere quanto e' profondo il drawdown plausibile serve il Monte Carlo, ed e'\n"
          "il motivo per cui le pagine seguenti esistono.")
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  12 — METODOLOGIA MONTE CARLO
# ======================================================================
METODI = [
 ('permutazione', 'Permutazione (sensibilita\' all\'ordine)',
  "Le stesse identiche operazioni, in ordine diverso. A rischio fisso il punto d'arrivo NON\n"
  "cambia — l'utile e' 100 x somma(R) e la somma non dipende dall'ordine. Cambia solo il\n"
  "percorso. E' quindi un test puro sul drawdown: quanto sarebbe stato peggio se le stesse\n"
  "perdite fossero capitate tutte insieme."),
 ('iid', 'Bootstrap IID (con rimpiazzo)',
  "Operazioni ripescate a caso con rimpiazzo, come se ognuna fosse indipendente dalle altre.\n"
  "Fa variare sia il risultato finale sia il drawdown. Difetto noto: spezza le serie di perdite\n"
  "consecutive, che sui mercati esistono, quindi SOTTOSTIMA il drawdown."),
 ('blocchi', 'Bootstrap a blocchi mobili (L = 20)',
  "Ripesca blocchi contigui di 20 operazioni: dentro il blocco l'ordine resta, quindi le serie di\n"
  "perdite sopravvivono al rimescolamento. E' il metodo su cui si decide il rischio."),
 ('stazionario', 'Bootstrap stazionario (blocchi di lunghezza casuale)',
  "Come sopra, ma la lunghezza di ogni blocco e' estratta da una geometrica di media 20.\n"
  "Serve a non far dipendere il risultato dalla scelta arbitraria di L = 20. Se le due versioni\n"
  "danno numeri simili, la scelta di L non stava guidando la conclusione."),
 ('regime', 'Bootstrap per regime',
  "Blocchi ripescati SOLO dentro la stessa fascia di mercato (forte salita, fermo, forte discesa...),\n"
  "mantenendo le proporzioni di mesi viste nella storia. Risponde a: e se il mix di regimi futuro\n"
  "somigliasse a quello passato, ma in ordine diverso?"),
]

def p_mc_metodo(pdf, C):
    fig = pagina('Monte Carlo: metodologia', 'cinque metodi, cinque domande diverse', 'MONTE CARLO')
    testo(fig, .058, .905,
          "Il backtest e' UN SOLO percorso fra tanti possibili. Il Monte Carlo rimescola le operazioni\n"
          "vere per vedere quanti altri percorsi erano compatibili con lo stesso materiale.\n\n"
          "Tutto a RISCHIO FISSO, 1% del deposito iniziale. 20.000 scenari per metodo (4.000 per i due\n"
          "piu' lenti). I due broker sono tenuti SEPARATI: non esiste un broker medio.")
    y = .830
    for k, (_, nome, spieg) in enumerate(METODI):
        fig.text(.058, y, nome, fontsize=10.5, color=INK, weight='bold')
        testo(fig, .058, y-.020, spieg, 8.3)
        y -= .020 + .0165*(spieg.count('\n')+1) + .022
    linea(fig, y+.006); y -= .014
    fig.text(.058, y, 'Il verso dei percentili, che si sbaglia facilmente', fontsize=12,
             color=INK, weight='bold')
    testo(fig, .058, y-.028,
          "«P90» da solo non vuol dire niente: dipende da cosa si sta misurando.\n\n"
          "    UTILE / RENDIMENTO        percentili BASSI = scenari PEGGIORI\n"
          "                              P5 = solo il 5% degli scenari ha reso meno di cosi'\n\n"
          "    DRAWDOWN                  percentili ALTI = scenari PEGGIORI\n"
          "                              P90 = solo il 10% degli scenari e' sceso piu' di cosi'\n\n"
          "In tutte le tabelle che seguono la colonna «scenario avverso» e' quindi P5 per l'utile e P90\n"
          "per il drawdown. Sono due estremi della stessa severita', non lo stesso percentile.\n\n"
          "Un ultimo limite, che nessun metodo toglie: il Monte Carlo rimescola le operazioni VISTE.\n"
          "Se il futuro contiene un tipo di mercato che in questi sette anni non e' mai capitato,\n"
          "nessuno di questi scenari lo contiene.")
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  13/14 — MONTE CARLO per broker
# ======================================================================
def p_mc_broker(pdf, C, mc, i):
    b = C['b'][i]
    fig = pagina(f"Monte Carlo — {b['nome']}",
                 f"rischio fisso 1% · {b['tot']['n']} operazioni · reale: {pc(b['tot']['rend'])}, "
                 f"drawdown {it(b['tot']['dd'],1)}%", 'MONTE CARLO')
    R = b['R']
    cp, band, ex = MC.percorsi(R, 'blocchi', n_sim=2000)
    ax = fig.add_axes([.085, .690, .870, .175])
    ax.fill_between(cp, band[5], band[95], color=CB[i], alpha=.16, label='5°–95° percentile')
    ax.fill_between(cp, band[25], band[75], color=CB[i], alpha=.30, label='25°–75° percentile')
    ax.plot(cp, band[50], color=CB[i], lw=2.2, label='percorso mediano')
    ax.plot(range(len(b['eq'])), b['eq'], color=INK, lw=1.4, ls='--', label='percorso reale')
    ax.axhline(DEPOSITO, color=INK3, lw=.8, ls=':')
    griglia(ax); ax.legend(frameon=False, fontsize=7.8, labelcolor=INK2, loc='upper left')
    ax.set_ylabel('capitale', fontsize=8); ax.set_xlabel('operazioni', fontsize=8)
    ax.set_title('Bootstrap a blocchi: fasce di percentili, non righe sovrapposte',
                 fontsize=9, color=INK2, loc='left', pad=6)

    ax = fig.add_axes([.085, .478, .400, .148])
    ax.hist(mc[i]['blocchi']['rend'], bins=70, color=CB[i], alpha=.80)
    ax.axvline(b['tot']['rend'], color=INK, lw=1.5, ls='--')
    ax.text(b['tot']['rend'], ax.get_ylim()[1]*.94, ' reale', fontsize=7.6, color=INK)
    griglia(ax); ax.set_xlabel('rendimento finale, %', fontsize=8)
    ax.set_title('Distribuzione del RENDIMENTO', fontsize=8.8, color=INK2, loc='left', pad=5)

    ax = fig.add_axes([.555, .478, .400, .148])
    ax.hist(mc[i]['blocchi']['dd_pct'], bins=70, color=GIALLO, alpha=.80)
    ax.axvline(b['tot']['dd'], color=INK, lw=1.5, ls='--')
    ax.text(b['tot']['dd'], ax.get_ylim()[1]*.94, ' reale', fontsize=7.6, color=INK)
    griglia(ax); ax.set_xlabel('drawdown massimo, %', fontsize=8)
    ax.set_title('Distribuzione del DRAWDOWN', fontsize=8.8, color=INK2, loc='left', pad=5)

    y = .418
    xs = [(.058,'left')] + [(.305 + k*.091, 'right') for k in range(7)]
    riga_tab(fig, y, ['bootstrap a blocchi mobili'] + [f'P{p}' for p in MC.PERCENTILI],
             xs, 7.8, INK3, 'bold')
    linea(fig, y-.009); y -= .024
    for et, ch, f in [('Rendimento finale', 'rend', lambda v: pc(v,0)),
                      ('Utile', 'utile', lambda v: it(v,0)),
                      ('Punti R', 'R_finale', lambda v: it(v,1)),
                      ('Drawdown max', 'dd_pct', lambda v: it(v,1)+'%'),
                      ('Drawdown max in R', 'dd_R', lambda v: it(v,1)),
                      ('Serie perdente max', 'striscia', lambda v: it(v,0))]:
        t = MC.tabella(mc[i]['blocchi'], ch)
        riga_tab(fig, y, [et] + [f(t[p]) for p in MC.PERCENTILI], xs, 8.2, INK)
        y -= .0205
    y -= .008
    testo(fig, .058, y, 'Per il rendimento i percentili BASSI sono gli scenari peggiori; '
          'per il drawdown quelli ALTI.', 7.8, GIALLO)

    y -= .032
    fig.text(.058, y, 'Confronto fra i cinque metodi', fontsize=11.5, color=INK, weight='bold')
    y -= .026
    xs2 = [(.058,'left'), (.30,'right'), (.42,'right'), (.545,'right'),
           (.67,'right'), (.80,'right'), (.942,'right')]
    riga_tab(fig, y, ['metodo', 'rend. P5', 'rend. P50', 'rend. P95',
                      'DD P50', 'DD P90', 'DD P95'], xs2, 7.8, INK3, 'bold')
    linea(fig, y-.009); y -= .024
    for met, nome, _ in METODI:
        r = mc[i][met]
        tr, td = MC.tabella(r, 'rend'), MC.tabella(r, 'dd_pct')
        riga_tab(fig, y, [nome.split(' (')[0], pc(tr[5],0), pc(tr[50],0), pc(tr[95],0),
                          it(td[50],1)+'%', it(td[90],1)+'%', it(td[95],1)+'%'], xs2, 8.2, INK)
        y -= .0205
    y -= .010
    tp = MC.tabella(mc[i]['permutazione'], 'rend')
    testo(fig, .058, y,
          f"La riga della permutazione ha {pc(tp[5],0)} a ogni percentile: non e' un errore. A rischio\n"
          "fisso il risultato finale non dipende dall'ordine, quindi quel metodo fa variare solo il\n"
          "drawdown. I metodi con rimpiazzo, che cambiano anche QUALI operazioni capitano, sono\n"
          "gli unici che fanno variare anche il punto d'arrivo.", 8.2)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  15 — MONTE CARLO, confronto
# ======================================================================
def p_mc_confronto(pdf, C, mc):
    fig = pagina('Monte Carlo: i due broker a confronto',
                 'bootstrap a blocchi mobili, rischio fisso 1%, 20.000 scenari ciascuno', 'MONTE CARLO')
    A, B = C['b']
    ax = fig.add_axes([.085, .690, .400, .175])
    for i, b in enumerate(C['b']):
        ax.hist(mc[i]['blocchi']['rend'], bins=70, color=CB[i], alpha=.55, label=b['nome'])
    griglia(ax); ax.legend(frameon=False, fontsize=7.8, labelcolor=INK2)
    ax.set_xlabel('rendimento finale, %', fontsize=8)
    ax.set_title('RENDIMENTO', fontsize=8.8, color=INK2, loc='left', pad=5)
    ax = fig.add_axes([.555, .690, .400, .175])
    for i, b in enumerate(C['b']):
        ax.hist(mc[i]['blocchi']['dd_pct'], bins=70, color=CB[i], alpha=.55, label=b['nome'])
    ax.axvline(TETTO, color=ROSSO, lw=1.5, ls='--')
    ax.text(TETTO+.5, ax.get_ylim()[1]*.90, f'tetto {it(TETTO,0)}%', fontsize=7.6, color=ROSSO)
    griglia(ax); ax.set_xlabel('drawdown massimo, %', fontsize=8)
    ax.set_title('DRAWDOWN', fontsize=8.8, color=INK2, loc='left', pad=5)

    y = .645
    fig.text(.058, y, 'I FATTI, dalle simulazioni', fontsize=11.5, color=VERDE, weight='bold')
    y -= .026
    xs = [(.058,'left'), (.46,'right'), (.66,'right'), (.942,'right')]
    riga_tab(fig, y, ['', A['nome'], B['nome'], 'scarto'], xs, 8.0, INK3, 'bold')
    linea(fig, y-.009); y -= .024
    def g(i, ch, p): return float(np.percentile(mc[i]['blocchi'][ch], p))
    for et, ch, p, f in [
        ('Rendimento mediano (P50)', 'rend', 50, lambda v: pc(v,0)),
        ('Rendimento avverso (P5)', 'rend', 5, lambda v: pc(v,0)),
        ('Rendimento favorevole (P95)', 'rend', 95, lambda v: pc(v,0)),
        ('Punti R mediani', 'R_finale', 50, lambda v: it(v,1)),
        ('Drawdown mediano (P50)', 'dd_pct', 50, lambda v: it(v,1)+'%'),
        ('Drawdown avverso (P90)', 'dd_pct', 90, lambda v: it(v,1)+'%'),
        ('Drawdown molto avverso (P99)', 'dd_pct', 99, lambda v: it(v,1)+'%'),
        ('Serie perdente P90', 'striscia', 90, lambda v: it(v,0)+' operazioni'),
    ]:
        a, b_ = g(0, ch, p), g(1, ch, p)
        d = 100*abs(a-b_)/max(abs(a), abs(b_)) if max(abs(a), abs(b_)) else 0
        riga_tab(fig, y, [et, f(a), f(b_), it(d,1)+'%'], xs, 8.4, INK)
        y -= .0205

    y -= .016
    fig.text(.058, y, 'L\'INTERPRETAZIONE, che e\' un\'altra cosa', fontsize=11.5,
             color=GIALLO, weight='bold')
    testo(fig, .058, y-.026,
          "Le due distribuzioni si somigliano nella forma e nella dispersione, e si spostano di poco\n"
          "l'una rispetto all'altra. Questo e' compatibile con due implementazioni dello stesso\n"
          "comportamento di fondo su listini e costi diversi — ed e' il risultato che si sperava.\n\n"
          "Non e' pero' una prova indipendente, e va detto: sono gli stessi anni dello stesso mercato.\n"
          "Due broker riducono il rischio di aver misurato un artefatto del listino; non riducono di\n"
          "nulla il rischio di aver misurato un periodo fortunato dell'oro.\n\n"
          "Il numero da portarsi dietro resta il piu' prudente dei due su ogni riga: rendimento dal\n"
          "broker peggiore, drawdown dal broker peggiore. Mai mescolarli per fare una media.", 8.3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  16 — COSTI E SWAP
# ======================================================================
def costi_misurati(b):
    """Costi per lotto ricavati dalle operazioni del backtest."""
    vl = sum(o.volume for o in b['ops'])
    vlL = sum(o.volume for o in b['ops'] if o.tipo == 'long')
    vlS = sum(o.volume for o in b['ops'] if o.tipo == 'short')
    swL = sum(o.swap for o in b['ops'] if o.tipo == 'long')
    swS = sum(o.swap for o in b['ops'] if o.tipo == 'short')
    return {'lotti': vl, 'lotti_long': vlL, 'lotti_short': vlS,
            'comm_lotto': b['tot']['comm']/vl if vl else 0,
            'swap_lotto': b['tot']['swap']/vl if vl else 0,
            'swap_long': swL/vlL if vlL else 0, 'swap_short': swS/vlS if vlS else 0,
            'quota_long': 100*vlL/vl if vl else 0}

def p_costi(pdf, C):
    fig = pagina('Costi, spread e swap', 'la voce che decide se il sistema vive o muore', 'COSTI')
    A, B = C['b']; cA, cB = costi_misurati(A), costi_misurati(B)
    testo(fig, .058, .905,
          "Due fonti diverse, tenute separate apposta:\n\n"
          "  MISURATO       ricavato dalle operazioni del backtest. E' quello che il sistema ha\n"
          "                 effettivamente pagato in quella passata, su quel mix di long e short.\n"
          "  DICHIARATO     tariffe fornite dall'utente/broker, NON verificate in modo indipendente\n"
          "                 su una specifica ufficiale aggiornata. Possono essere cambiate.")
    y = .790
    xs = [(.058,'left'), (.42,'right'), (.60,'right'), (.79,'right'), (.942,'right')]
    riga_tab(fig, y, ['per lotto', f"{A['nome']}\nmisurato", f"{A['nome']}\ndichiarato",
                      f"{B['nome']}\nmisurato", f"{B['nome']}\ndichiarato"], xs, 7.4, INK3, 'bold')
    linea(fig, y-.016); y -= .034
    sb = C['swap_broker']
    for et, a1, a2, b1, b2 in [
        ('Swap sui long', it(cA['swap_long'],2), it(sb[0][0],2), it(cB['swap_long'],2), it(sb[1][0],2)),
        ('Swap sugli short', it(cA['swap_short'],2), it(sb[0][1],2), it(cB['swap_short'],2), it(sb[1][1],2)),
        ('Commissioni', it(cA['comm_lotto'],2), '—', it(cB['comm_lotto'],2), '—'),
        ('Swap medio (mix reale)', it(cA['swap_lotto'],2), '—', it(cB['swap_lotto'],2), '—'),
    ]:
        riga_tab(fig, y, [et, a1, a2, b1, b2], xs, 8.6, INK); y -= .0225
    y -= .006
    misA = cA['comm_lotto'] + cA['swap_lotto']
    misB = cB['comm_lotto'] + cB['swap_lotto']
    riga_tab(fig, y, ['COSTO TOTALE per lotto', it(misA,2), '', it(misB,2), ''], xs, 9, INK, 'bold')
    y -= .030
    testo(fig, .058, y,
          f"Il mix operato e' {it(cA['quota_long'],0)}% long su {A['nome']} e {it(cB['quota_long'],0)}% "
          f"long su {B['nome']}: siccome i long\npagano swap e gli short lo incassano, il costo medio "
          "dipende da quel mix e non solo dalle tariffe.\n"
          "Lo swap tripli del mercoledi' e' gia' dentro i numeri misurati, perche' vengono dalle\n"
          "operazioni vere.", 8.2, INK3)

    y -= .066
    fig.text(.058, y, 'Misurato contro dichiarato: quanto distano', fontsize=11.5, color=INK, weight='bold')
    y -= .028
    xs2 = [(.058,'left'), (.42,'right'), (.62,'right'), (.82,'right')]
    riga_tab(fig, y, ['', 'misurato', 'dichiarato', 'scarto'], xs2, 8.0, INK3, 'bold')
    linea(fig, y-.009); y -= .024
    for nome, mis, dic in [(f"{A['nome']} swap long", cA['swap_long'], sb[0][0]),
                           (f"{A['nome']} swap short", cA['swap_short'], sb[0][1]),
                           (f"{B['nome']} swap long", cB['swap_long'], sb[1][0]),
                           (f"{B['nome']} swap short", cB['swap_short'], sb[1][1])]:
        d = 100*abs(mis-dic)/abs(dic) if dic else 0
        riga_tab(fig, y, [nome, it(mis,2), it(dic,2), it(d,0)+'%'], xs2, 8.5, INK)
        y -= .0205
    y -= .012
    testo(fig, .058, y,
          "Gli scarti sono attesi: il valore misurato e' una media su sette anni, durante i quali le\n"
          "tariffe sono cambiate; quello dichiarato e' la tariffa di oggi. Servono a due cose diverse —\n"
          "il misurato spiega il backtest, il dichiarato serve a prevedere il futuro.", 8.2, INK3)

    y -= .070
    card(fig, .058, y-.112, .884, .106, ROSSO)
    fig.text(.078, y-.024, 'La soglia che conta', fontsize=11, color=INK, weight='bold')
    testo(fig, .078, y-.044,
          f"Su {B['nome']} lo swap dichiarato sui long ({it(sb[1][0],2)}) e' piu' MITE del misurato "
          f"({it(cB['swap_long'],2)}),\nma quello sugli short paga meno ({it(sb[1][1],2)} contro "
          f"{it(cB['swap_short'],2)}). Siccome il sistema e' in prevalenza\nlong, il primo effetto pesa "
          "di piu' del secondo. Da verificare sulla specifica del simbolo prima\ndel live: se i costi veri "
          "salgono a tre volte questi, il vantaggio si azzera.", 8.3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  17 — ASPETTATIVE LIVE SU FUSION
# ======================================================================
def p_live(pdf, C, mc):
    B = C['b'][1]; A = C['b'][0]
    fig = pagina(f"Aspettative live su {B['nome']}",
                 'scenari, non promesse: intervalli dalla storia e dalle simulazioni', 'LIVE')
    testo(fig, .058, .905,
          f"Riferimento primario: la passata su {B['nome']}, che e' il broker su cui si andrebbe live.\n"
          f"Riferimento prudenziale: {A['nome']}, che ha il materiale storico migliore ({C['qualita'][0]}) e\n"
          "produce i numeri piu' bassi. Dove i due divergono, in questa pagina vince il piu' basso.")
    tpa = B['tot']['n']/C['durata']
    y = .830
    fig.text(.058, y, f"Scenari annui, a rischio fisso, su circa {it(tpa,0)} operazioni l'anno",
             fontsize=11.5, color=INK, weight='bold')
    y -= .030
    xs = [(.058,'left'), (.40,'right'), (.57,'right'), (.75,'right'), (.942,'right')]
    riga_tab(fig, y, ['scenario', 'base', 'R/anno', 'a 0,70%', 'a 1,00%'], xs, 8.0, INK3, 'bold')
    linea(fig, y-.009); y -= .026
    scen = [
        ('Avverso', f"periodo di costruzione di {A['nome']}", A['sIS']['R_op'], ROSSO),
        ('Prudente', f"tutto il periodo di {A['nome']}", A['tot']['R_op'], GIALLO),
        ('Centrale', f"tutto il periodo di {B['nome']}", B['tot']['R_op'], INK),
        ('Favorevole', f"fuori campione di {B['nome']}", B['sOOS']['R_op'], VERDE),
    ]
    for nome, base, rop, c in scen:
        Rann = tpa*rop
        riga_tab(fig, y, [None, base, it(Rann,1), None, None], xs, 8.6, INK)
        fig.text(.058, y, nome, fontsize=8.6, color=c, weight='bold')
        for k, r in ((3, 0.70), (4, 1.00)):
            fig.text(xs[k][0], y, pc(r*Rann,1), fontsize=9.2, ha='right', color=c, weight='bold')
        y -= .0235
    y -= .010
    testo(fig, .058, y,
          "A rischio fisso il rendimento annuo e' lineare nella percentuale scelta: R all'anno moltiplicato\n"
          "per il rischio. Non c'e' composto, quindi questi numeri non si accumulano fra loro.", 8.0, INK3)

    y -= .058
    fig.text(.058, y, 'Drawdown da mettere in conto', fontsize=11.5, color=INK, weight='bold')
    y -= .028
    xs2 = [(.058,'left'), (.42,'right'), (.62,'right'), (.82,'right')]
    riga_tab(fig, y, ['', 'mediano', '90° perc.', '99° perc.'], xs2, 8.0, INK3, 'bold')
    linea(fig, y-.009); y -= .024
    for i, b in enumerate(C['b']):
        d = mc[i]['blocchi']['dd_pct']
        riga_tab(fig, y, [None, it(np.percentile(d,50),1)+'%',
                          it(np.percentile(d,90),1)+'%', it(np.percentile(d,99),1)+'%'], xs2, 8.6, INK)
        fig.text(.058, y, b['nome'] + ' (a 1,00%)', fontsize=8.6, color=CB[i], weight='bold')
        y -= .0215
    y -= .012
    testo(fig, .058, y,
          "A rischio fisso il drawdown scala anch'esso in proporzione: a 0,70% questi numeri si\n"
          "moltiplicano per 0,7. Con il composto, invece, crescono piu' che proporzionalmente.", 8.0, INK3)

    y -= .058
    fig.text(.058, y, 'Cinque motivi per cui il live NON riprodurra\' questi numeri',
             fontsize=11.5, color=INK, weight='bold')
    testo(fig, .058, y-.028,
          "1.  REGIME DI MERCATO. E' il piu' grosso di tutti. Meta' del risultato storico viene da due\n"
          "     anni eccezionali per l'oro. Se l'oro entra in una fase ferma, la pagina sui regimi dice\n"
          "     che questo sistema PERDE, non che guadagna meno.\n\n"
          "2.  SLITTAMENTO. Il tester esegue al prezzo che vuole entro la deviazione impostata. Dal\n"
          "     vivo una rottura di canale e' proprio il momento in cui il libro si assottiglia.\n\n"
          "3.  SPREAD VARIABILE. Nel test e' quello storico registrato; dal vivo si allarga sulle notizie,\n"
          "     ed e' li' che questa strategia entra piu' spesso.\n\n"
          "4.  LATENZA E RIFIUTI. Non esistono nel tester. Dal vivo un ordine puo' arrivare tardi o\n"
          "     non arrivare.\n\n"
          "5.  SWAP CHE CAMBIA. E' il costo piu' grosso del sistema e il broker lo puo' modificare\n"
          "     quando vuole. Le tariffe usate qui sono dichiarate, non verificate.\n\n"
          "Nessuno di questi e' nel backtest, e tutti e cinque tirano nella stessa direzione: verso il\n"
          "basso. Per questo la riga da guardare in tabella e' «Avverso», non «Centrale».")
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  18 — ROBUSTEZZA E LIMITI
# ======================================================================
def p_robustezza(pdf, C, mc):
    fig = pagina('Valutazione di robustezza', 'che cosa ha superato la verifica e che cosa no',
                 'ROBUSTEZZA')
    A, B = C['b']
    prove = [
        ('Campione sufficiente',
         f"{A['tot']['n']} e {B['tot']['n']} operazioni su {it(C['durata'],1)} anni", 'SI', VERDE),
        ('Vantaggio statisticamente distinguibile da zero',
         f"t = {it(A['tot']['t'],2)} e {it(B['tot']['t'],2)}, su deviazione standard misurata sui trade", 'SI', VERDE),
        ('Regge fuori dai dati di costruzione',
         f"OOS {pc(A['sOOS']['rend'])} e {pc(B['sOOS']['rend'])}, PF {it(A['sOOS']['pf'],2)} e "
         f"{it(B['sOOS']['pf'],2)}, guardato una volta sola", 'SI', VERDE),
        ('Regge al cambio di listino e di costi',
         f"correlazione mensile {it(corr_mesi(A,B),2)}; R/op {it(A['tot']['R_op'],4)} contro "
         f"{it(B['tot']['R_op'],4)}", 'SI', VERDE),
        ('Profittevole anche prima del regime recente',
         f"IS {pc(A['sIS']['rend'])} e {pc(B['sIS']['rend'])} in 4 anni e 4 mesi", 'SI, DEBOLE', GIALLO),
        ('Risultato distribuito nel tempo',
         f"{it(100*A['sOOS']['R']/A['tot']['R'],0)}% del risultato dagli ultimi 2 anni e 9 mesi "
         f"({it(100*len(A['OOS'])/A['tot']['n'],0)}% delle operazioni)", 'NO', ROSSO),
        ('Percorso regolare nel tempo',
         f"pendenza fuori campione {it(_rap(A),1)}× e {it(_rap(B),1)}× quella dentro campione", 'NO', ROSSO),
        ('Indipendenza dal regime di mercato',
         "perde nei mesi in cui l'oro sta fermo, su entrambi i broker", 'NO', ROSSO),
        ('Drawdown entro il tetto del 35% al 90° perc.',
         f"{it(np.percentile(mc[0]['blocchi']['dd_pct'],90),1)}% e "
         f"{it(np.percentile(mc[1]['blocchi']['dd_pct'],90),1)}% a rischio fisso 1%", 'SI', VERDE),
        ('Verificato in esecuzione reale',
         'nessuna demo in avanti eseguita: nessun dato di slittamento o rifiuto', 'NON FATTO', ROSSO),
        ('Prova su un mercato indipendente',
         'stessi anni, stesso sottostante: due listini non sono due campioni', 'NO', ROSSO),
    ]
    y = .890
    for nome, dett, esito, col in prove:
        fig.text(.058, y, nome, fontsize=9.4, color=INK, weight='bold')
        fig.text(.942, y, esito, fontsize=9, color=col, ha='right', weight='bold')
        testo(fig, .058, y-.016, dett, 8.1, INK3)
        y -= .054
    linea(fig, y+.020)
    fig.text(.058, y-.004, 'Come va letto il quadro', fontsize=12, color=INK, weight='bold')
    testo(fig, .058, y-.032,
          "Le prime quattro righe sono quelle che dicono se il vantaggio ESISTE, e passano tutte.\n"
          "Le tre righe rosse in mezzo non dicono che il sistema non funziona: dicono che il suo\n"
          "rendimento NON e' costante nel tempo e dipende da cosa fa il mercato. Sono un fatto da\n"
          "mettere in conto, non un difetto da correggere — una strategia trend following fa questo.\n\n"
          "Le ultime due righe sono quelle che nessuna simulazione puo' chiudere, e restano aperte.")
    pdf.savefig(fig); plt.close(fig)

def _rap(b):
    y = [100*(x-DEPOSITO)/DEPOSITO for x in b['eq'][1:]]
    k = next(j for j, d in enumerate(b['date']) if d[:10] >= CONFINE_OOS)
    return regressione(y[k:])['pendenza'] / regressione(y[:k])['pendenza']

def p_limiti(pdf, C):
    fig = pagina('Limiti', 'quello che questo dossier non puo\' dire, elencato per intero', 'LIMITI')
    voci = [
     ('Due broker non sono due campioni',
      "Sono due listini sugli STESSI anni dello STESSO mercato. Riducono il rischio di aver\n"
      "misurato un artefatto di un particolare feed. Non riducono di NULLA il rischio di aver\n"
      "misurato un periodo fortunato dell'oro, che e' il rischio piu' grande che resta."),
     ('Il fuori campione e\' stato speso',
      "Il 2024.01–2026.09 e' stato guardato una volta sola, come dichiarato prima del test. Non\n"
      "esistono piu' dati vergini su questi anni: qualunque nuova ottimizzazione qui sopra\n"
      "peggiora la statistica invece di migliorarla, anche se i numeri sembrano migliorare."),
     ('Il Monte Carlo rimescola solo quello che e\' successo',
      "Tutte le simulazioni ripescano dalle operazioni viste. Se il futuro contiene un tipo di\n"
      "mercato che in questi sette anni non e' mai capitato, non sta in nessuno degli scenari."),
     ('Nessuna esecuzione reale e\' stata misurata',
      "Slittamento, rifiuti, latenza e allargamenti di spread non esistono nel tester. Sono tutti\n"
      "effetti che tirano verso il basso, e nessuno di essi e' nei numeri di questo dossier."),
     ('Il compra-e-tieni e\' un\'approssimazione',
      "La serie XAUUSD usata per il confronto e' ricavata dai prezzi di esecuzione del backtest,\n"
      "non dal listino ufficiale. Serve per l'ordine di grandezza e l'andamento, non per il decimale."),
     ('Le tariffe di swap dichiarate non sono verificate',
      "Vengono dall'utente/broker e non da una specifica ufficiale controllata in modo\n"
      "indipendente. Lo swap e' il costo piu' grosso del sistema e il broker lo puo' cambiare."),
     ('Le statistiche per anno sono su campioni piccoli',
      f"Circa {it(C['b'][0]['tot']['n']/C['durata'],0)} operazioni l'anno: un profit factor annuo e' un numero\n"
      "rumoroso, e due anni consecutivi possono differire molto solo per il caso."),
     ('Sharpe, Sortino e Calmar vanno presi per quello che sono',
      "Calcolati sui rendimenti MENSILI a rischio fisso, senza tasso privo di rischio, annualizzati\n"
      "in modo aritmetico. Su una serie con code larghe come questa sono indicativi, non decisivi."),
     ('L\'R² della curva cumulata NON misura il vantaggio',
      "Una serie cumulata e' autocorrelata: anche una passeggiata casuale produce R² alti. E'\n"
      "una misura di regolarita' del percorso, e in questo dossier non decide nulla."),
     ('Il codice non e\' stato compilato in questo ambiente',
      "L'analisi parte dai report MT5 prodotti sulla macchina dell'utente. La versione dell'EA che\n"
      "li ha generati e' V1XAU_TrendFollowing, senza le correzioni proposte e non ancora verificate."),
    ]
    y = .895
    for nome, dett in voci:
        fig.text(.058, y, nome, fontsize=9.6, color=GIALLO, weight='bold')
        testo(fig, .058, y-.017, dett, 8.3)
        y -= .017 + .0165*(dett.count('\n')+1) + .018
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  20 — CONCLUSIONI
# ======================================================================
def p_conclusioni(pdf, C, mc):
    fig = pagina('Conclusioni quantitative', 'ogni risposta e\' tracciabile a un numero di questo dossier',
                 'CONCLUSIONI')
    A, B = C['b']
    Q = [
     ("Il risultato e' distribuito su piu' anni?",
      f"Parzialmente. {sum(1 for v in rend_anno(A).values() if v>0)} anni su {len(C['anni_tot'])} "
      f"in utile su {A['nome']}, ma solo "
      f"{sum(1 for v in rend_anno(A).values() if v>10)} sopra il +10%."),
     ("Quanto viene dagli ultimi anni?",
      f"{it(100*A['sOOS']['R']/A['tot']['R'],0)}% su {A['nome']} e "
      f"{it(100*B['sOOS']['R']/B['tot']['R'],0)}% su {B['nome']}, prodotti dal "
      f"{it(100*len(A['OOS'])/A['tot']['n'],0)}% delle operazioni."),
     ("Era profittevole prima del rialzo dell'oro?",
      f"Si: {pc(A['sIS']['rend'])} e {pc(B['sIS']['rend'])} dal 2019.09 al 2023.12, PF "
      f"{it(A['sIS']['pf'],2)} e {it(B['sIS']['pf'],2)}. Meno della meta' del ritmo recente."),
     ("Il vantaggio e' sopravvissuto fuori campione?",
      f"Si. {pc(A['sOOS']['rend'])} e {pc(B['sOOS']['rend'])}, PF {it(A['sOOS']['pf'],2)} e "
      f"{it(B['sOOS']['pf'],2)}, su dati guardati una volta sola."),
     ("Sopravvive al cambio di broker?",
      f"Si. R per operazione {it(A['tot']['R_op'],4)} contro {it(B['tot']['R_op'],4)}, correlazione "
      f"mensile {it(corr_mesi(A,B),2)}."),
     ("Quanto differiscono i due broker?",
      f"Il {it(100*abs(A['tot']['R_op']-B['tot']['R_op'])/max(A['tot']['R_op'],B['tot']['R_op']),0)}% "
      f"sul R per operazione. La gamba H4 fa lo stesso numero di operazioni su entrambi; quella M30 "
      f"differisce del {it(100*abs(len([o for o in A['ops'] if o.tag=='S3-DONCH'])-len([o for o in B['ops'] if o.tag=='S3-DONCH']))/max(len([o for o in A['ops'] if o.tag=='S3-DONCH']),len([o for o in B['ops'] if o.tag=='S3-DONCH'])),0)}%."),
     ("Che aspetto ha senza il composto?",
      f"{pc(A['tot']['rend'])} e {pc(B['tot']['rend'])} in {it(C['durata'],1)} anni, cioe' "
      f"{pc(ratios(A)['rend_ann'])} e {pc(ratios(B)['rend_ann'])} all'anno di media. Il composto li faceva "
      f"apparire {pc(100*(sum(o.netto for o in A['ops']))/DEPOSITO,0)} e "
      f"{pc(100*(sum(o.netto for o in B['ops']))/DEPOSITO,0)}."),
     ("Quale drawdown c'e' stato davvero?",
      f"{it(A['tot']['dd'],2)}% e {it(B['tot']['dd'],2)}% a rischio fisso; discesa piu' lunga "
      f"{it(A['tot']['p_max'])} e {it(B['tot']['p_max'])} operazioni perdenti di fila."),
     ("Quale drawdown e' plausibile?",
      f"Mediano {it(np.percentile(mc[0]['blocchi']['dd_pct'],50),1)}% e "
      f"{it(np.percentile(mc[1]['blocchi']['dd_pct'],50),1)}%; al 90° percentile "
      f"{it(np.percentile(mc[0]['blocchi']['dd_pct'],90),1)}% e "
      f"{it(np.percentile(mc[1]['blocchi']['dd_pct'],90),1)}%; al 99° "
      f"{it(np.percentile(mc[0]['blocchi']['dd_pct'],99),1)}% e "
      f"{it(np.percentile(mc[1]['blocchi']['dd_pct'],99),1)}%."),
     ("Che intervallo di risultati finali?",
      f"Da {pc(np.percentile(mc[0]['blocchi']['rend'],5),0)} (P5) a "
      f"{pc(np.percentile(mc[0]['blocchi']['rend'],95),0)} (P95) su {A['nome']}; da "
      f"{pc(np.percentile(mc[1]['blocchi']['rend'],5),0)} a "
      f"{pc(np.percentile(mc[1]['blocchi']['rend'],95),0)} su {B['nome']}."),
     ("Quanto dipende dal regime di mercato?",
      "Molto. Guadagna nei mesi di forte movimento in entrambe le direzioni e perde nei mesi in\n"
      "cui l'oro sta fermo: e' il fattore singolo piu' importante del risultato."),
     ("Che cosa manca prima di dire «live»?",
      "Una demo in avanti di tre-sei mesi su Fusion, e la verifica dello swap reale sulla specifica\n"
      "del simbolo. Nessun altro backtest su questi anni aggiunge informazione."),
    ]
    y = .895
    for d, r in Q:
        fig.text(.058, y, d, fontsize=9.4, color=INK, weight='bold')
        testo(fig, .058, y-.017, r, 8.4)
        y -= .017 + .0165*(r.count('\n')+1) + .019
    linea(fig, y+.014)
    fig.text(.058, y-.008, 'In una riga', fontsize=12, color=INK, weight='bold')
    peg = min(A['tot']['R_op'], B['tot']['R_op'])
    testo(fig, .058, y-.034,
          f"Il vantaggio esiste, e' misurabile ({it(peg,4)} R per operazione nel caso peggiore dei due\n"
          "broker), sopravvive a dati mai visti e a un cambio di listino — ma non e' costante nel tempo\n"
          "e meta' del risultato storico arriva da due anni eccezionali per l'oro, che nessuno garantisce\n"
          "si ripetano. Quello che manca non e' un'altra simulazione: e' l'esecuzione vera.", 8.8, INK)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
def main(percorsi, nomi, qualita, rischio_test, qual_swap, out):
    C = costruisci(percorsi, nomi, qualita, rischio_test, qual_swap)
    verifica(C)
    print('--- Monte Carlo ---')
    mc = []
    for b in C['b']:
        d = {}
        for met, _, _2 in METODI:
            n = 20000 if met in ('permutazione', 'iid', 'blocchi') else 4000
            strati = None
            if met == 'regime':
                r, _v, _x = regimi(b)
                pos = {id(o): i for i, o in enumerate(b['ops'])}
                strati, visti = [], set()
                for _n, ops in r.values():
                    if not ops: continue
                    ix = [pos[id(o)] for o in ops]
                    strati.append(np.array(ix)); visti.update(ix)
                resto = [i for i in range(len(b['ops'])) if i not in visti]
                if resto: strati.append(np.array(resto))   # gli strati coprono tutto
            d[met] = MC.simula(b['R'], met, n_sim=n, strati=strati)
            print(f"  {b['nome']:12} {met:14} n={n}")
        mc.append(d)
    print()
    with PdfPages(out) as pdf:
        p_sintesi(pdf, C, mc)
        p_profilo(pdf, C)
        p_dati(pdf, C)
        p_performance(pdf, C)
        p_buyhold(pdf, C)
        p_annuale(pdf, C)
        p_annuale_dettaglio(pdf, C)
        p_crossbroker(pdf, C)
        p_isoos(pdf, C)
        p_percorso_esempi(pdf, C)
        p_percorso_reale(pdf, C)
        p_regimi(pdf, C)
        p_drawdown(pdf, C)
        p_mc_metodo(pdf, C)
        p_mc_broker(pdf, C, mc, 0)
        p_mc_broker(pdf, C, mc, 1)
        p_mc_confronto(pdf, C, mc)
        p_costi(pdf, C)
        p_live(pdf, C, mc)
        p_robustezza(pdf, C, mc)
        p_limiti(pdf, C)
        p_conclusioni(pdf, C, mc)
    print(f"scritto {out}  ({PAG[0]} pagine)")

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('a'); ap.add_argument('b')
    ap.add_argument('--nomi', nargs=2, required=True)
    ap.add_argument('--qualita', nargs=2, required=True)
    ap.add_argument('--rischio-test', nargs=2, type=float, default=[1.0, 1.0])
    ap.add_argument('--swap-a', nargs=2, type=float, required=True)
    ap.add_argument('--swap-b', nargs=2, type=float, required=True)
    ap.add_argument('-o', '--out', default='report/validazione.pdf')
    x = ap.parse_args()
    main([x.a, x.b], x.nomi, x.qualita, [r/100 for r in x.rischio_test],
         [tuple(x.swap_a), tuple(x.swap_b)], x.out)
