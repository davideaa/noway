#!/usr/bin/env python3
"""QUANTO RISCHIARE su un conto da 10.000 con oro + nasdaq insieme.

Il tetto lo ha scelto Davide: il drawdown non deve superare il 35%.
Questo report trova il rischio che lo rispetta e dice cosa aspettarsi.

Due scelte di metodo, che cambiano tutto:

1. DUE SCENARI, e si decide sul peggiore.
   Il 2024-2026 e' stato un boom: l'oro rende 16,1 punti base per
   operazione su tutto il periodo ma solo 9,9 nel 2019-2023. Prendere
   la media di tutto vuol dire aspettarsi che il boom continui. Quindi
   si simula anche il solo 2019-2023 ("scenario calmo") e il rischio si
   decide su quello.

2. STESSO ORIZZONTE per tutti e due.
   Il periodo calmo dura 4,32 anni, tutto il periodo 7,03. Un drawdown
   misurato su quattro anni e' per forza piu' piccolo di uno misurato su
   sette: ci sono meno occasioni di incolonnare le perdite. Perche' i
   due numeri siano confrontabili, il periodo calmo viene ricampionato
   fino a coprire sette anni: "e se questo regime durasse".

Il rischio si scala in proporzione su tutte le gambe. Le operazioni si
riscalano linearmente, perche' il lotto e' proporzionale al rischio:
raddoppiare la percentuale raddoppia il risultato di ogni operazione.

Uso:  python3 tools/report_rischio_portafoglio.py <oro.html> <nasdaq.html> [uscita.pdf]
"""
import sys, os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Rectangle
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dati_validazione import leggi
from montecarlo_portafoglio import simula, tabella
from report_validazione import (INK, INK2, INK3, BLU, ARANCIO, VERDE, ROSSO,
                                GIALLO, GRIGLIA, VIOLA, it, pc, card, kpi,
                                griglia, riga_tab, linea, testo)

DEP      = 10000.0
R_ORO    = 1.00          # rischio % con cui e' girato il backtest dell'oro
R_NAS    = 1.50          # idem per il nasdaq (base, prima dell'adattivo)
CONFINE  = '2024.01.01'  # dove finisce lo scenario calmo
TETTO    = 35.0          # il drawdown massimo accettato
SIM      = 12000
SCELTO   = 0.70          # il peso raccomandato (vedi pagina 4)
PESI     = (0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00)
CC, CT   = ARANCIO, BLU  # calmo, tutto
NPAG     = 7
PAG      = [0]


def pagina(titolo, sottotitolo):
    PAG[0] += 1
    fig = plt.figure(figsize=(8.27, 11.69))
    fig.text(.058, .958, titolo, fontsize=19, color=INK, weight='bold')
    fig.text(.058, .937, sottotitolo, fontsize=8.5, color=INK2)
    fig.text(.942, .960, 'QUANTO RISCHIARE', fontsize=8.6, color=INK3,
             ha='right', weight='bold')
    fig.text(.942, .943, f'ORO + NASDAQ · pag. {PAG[0]} di {NPAG}',
             fontsize=7.6, color=INK3, ha='right')
    fig.add_artist(Rectangle((.058, .928), .884, .0015, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))
    return fig


def tit(fig, y, s, c=None):
    fig.text(.058, y, s, fontsize=11.5, color=c or INK, weight='bold')


# ------------------------------------------------------------- dati
def frazione(o):
    p = o.saldo - o.netto
    return o.netto / p if p > 0 else 0.0


def anni_fra(a, b):
    f = lambda d: int(d[:4]) + int(d[5:7])/12 + int(d[8:10])/365
    return f(b) - f(a)


def carica(p_oro, p_nas):
    oro, _, _ = leggi(p_oro, rischio_test=R_ORO/100)
    nas, _, _ = leggi(p_nas, rischio_test=R_NAS/100)
    dal = max(oro[0].chiusura[:10], nas[0].chiusura[:10])
    al  = min(oro[-1].chiusura[:10], nas[-1].chiusura[:10])
    op = sorted([(o.chiusura, frazione(o), 'oro') for o in oro
                 if dal <= o.chiusura[:10] <= al] +
                [(o.chiusura, frazione(o), 'nas') for o in nas
                 if dal <= o.chiusura[:10] <= al])
    pre = [x for x in op if x[0] < CONFINE]
    d_tot = anni_fra(op[0][0][:10], op[-1][0][:10])
    d_pre = anni_fra(pre[0][0][:10], pre[-1][0][:10])
    g = lambda s, k: np.array([x for _, x, kk in s if kk == k])
    return {'op': op, 'pre': pre,
            'G_tot': {'oro': g(op, 'oro'),  'nas': g(op, 'nas')},
            'G_pre': {'oro': g(pre, 'oro'), 'nas': g(pre, 'nas')},
            'd_tot': d_tot, 'd_pre': d_pre,
            'oriz': d_tot / d_pre,               # allunga il calmo a 7 anni
            'dal': op[0][0][:10], 'al': op[-1][0][:10],
            'al_pre': pre[-1][0][:10],
            'anni': sorted({d[:4] for d, _, _ in op})}


def mc(C, scen, k, n=SIM, seed=7, composto=True):
    """scen: 'pre' (calmo) o 'tot'. k: il moltiplicatore del rischio."""
    G  = C['G_pre'] if scen == 'pre' else C['G_tot']
    oz = C['oriz']  if scen == 'pre' else 1.0
    return simula({'oro': G['oro']*k, 'nas': G['nas']*k}, 'blocchi',
                  peso=1.0, composto=composto, n_sim=n, per_gamba=True,
                  seed=seed, orizzonte=oz)


def cagr(C, tot_pct):
    return 100 * ((1 + tot_pct/100) ** (1/C['d_tot']) - 1)


def peso_per_dd(C, scen, perc, target, seed=7):
    lo, hi = 0.10, 2.0
    for _ in range(20):
        m = (lo + hi) / 2
        if tabella(mc(C, scen, m, 3000, seed), 'dd_pct')[perc] < target: lo = m
        else: hi = m
    return lo


def per_anno(C):
    """Rendimento composto di ogni anno, alle impostazioni di prova."""
    out = {}
    for et, sel in (('oro', [x for x in C['op'] if x[2] == 'oro']),
                    ('nas', [x for x in C['op'] if x[2] == 'nas']),
                    ('ins', C['op'])):
        r = []
        for a in C['anni']:
            e = 1.0
            for d, x, _ in sel:
                if d[:4] == a: e *= (1 + x)
            r.append(100*(e - 1))
        out[et] = r
    return out


# =============================================================== pag. 1
def pag_risposta(C, T, pdf):
    fig = pagina('Quanto rischiare',
                 'conto da 10.000, oro e nasdaq insieme, con il drawdown sotto il 35%')

    a = T[(SCELTO, 'pre')]; b = T[(SCELTO, 'tot')]
    for i, (v, et, col) in enumerate((
            (f"{it(R_ORO*SCELTO, 2)}%", 'ORO   InpRiskPercent', GIALLO),
            (f"{it(R_NAS*SCELTO, 2)}%", 'NASDAQ   RiskPercent', BLU),
            (f"{it(a['d'][95], 1)}%", 'drawdown 95%, scenario calmo', VERDE),
            (f"{it(b['d'][95], 1)}%", 'drawdown 95%, tutto il periodo', VERDE))):
        kpi(fig, .058 + i*.2235, .850, .2105, v, et, col, h=.058)

    testo(fig, .058, .800,
          "Sono le due uniche caselle da cambiare. Nell'EA dell'oro InpRiskPercent vale per tutte e\n"
          "due le sue gambe (i moltiplicatori S2 e S3 sono a 1,0), quindi tre gambe, due caselle.", 8.8, INK)

    tit(fig, .748, 'Cosa aspettarsi, nei due scenari')
    xs = [(.070, 'left'), (.360, 'right'), (.510, 'right'), (.640, 'right'),
          (.785, 'right'), (.930, 'right')]
    card(fig, .058, .586, .884, .152)
    riga_tab(fig, .708, ['scenario', 'peggio (5%)', 'MEDIANA', "all'anno",
                         'DD 90%', 'DD 95%'], xs, 8.0, INK3, 'bold')
    linea(fig, .698, .070, .930)
    for i, (et, k, col) in enumerate((
            ('CALMO — come il 2019-2023', 'pre', CC),
            ('TUTTO — col boom 2024-2026', 'tot', CT))):
        r = T[(SCELTO, k)]
        riga_tab(fig, .674 - i*.030,
                 [et, pc(r['t'][5], 0), pc(r['t'][50], 0),
                  pc(cagr(C, r['t'][50]), 1), f"{it(r['d'][90],1)}%",
                  f"{it(r['d'][95],1)}%"], xs, 8.6, col, 'bold')
    testo(fig, .070, .618,
          "Tutti e due simulati su SETTE anni, 12.000 storie, bootstrap a blocchi da 20.", 7.8, INK3)

    tit(fig, .552, 'Sul tuo x0,80: non passa la tua stessa regola', ROSSO)
    testo(fig, .058, .524,
          f"Avevi scelto oro 0,80% / nasdaq 1,20% guardando la tabella di tutto il periodo, dove il\n"
          f"drawdown al 95o percentile e' {it(T[(0.80,'tot')]['d'][95],1)}%. Ma nello scenario calmo, quello che mi hai detto\n"
          f"di usare come riferimento, lo stesso rischio da' **{it(T[(0.80,'pre')]['d'][95],1)}%** al 95o e "
          f"{it(T[(0.80,'pre')]['d'][99],1)}% al 99o.\n"
          f"E' oltre il tetto che hai messo tu, e non di poco.\n\n"
          f"Il massimo difendibile leggendo il tetto al 90o percentile (la lettura piu' permissiva che\n"
          f"hai indicato) e' x{it(T['w90'],2)}, cioe' oro {it(R_ORO*T['w90'],2)}% e nasdaq {it(R_NAS*T['w90'],2)}%. Anche cosi' x0,80 resta appena fuori.",
          8.8)

    tit(fig, .388, 'Il confronto che conta')
    ax = fig.add_axes([.098, .108, .844, .248])
    ks = np.array(PESI)
    for k, et, col in (('pre', 'scenario calmo', CC), ('tot', 'tutto il periodo', CT)):
        ax.plot(ks, [T[(w, k)]['d'][95] for w in PESI], 'o-', color=col, lw=1.8,
                ms=4, label=f'drawdown 95% — {et}')
        ax.plot(ks, [T[(w, k)]['d'][90] for w in PESI], 's--', color=col, lw=1.1,
                ms=3, alpha=.6, label=f'drawdown 90% — {et}')
    ax.axhline(TETTO, color=ROSSO, lw=1.6, ls=':')
    ax.text(ks[0], TETTO + .7, f' il tuo tetto: {it(TETTO,0)}%', fontsize=7.6, color=ROSSO)
    ax.axvline(SCELTO, color=VERDE, lw=1.4)
    ax.text(SCELTO + .01, 6, f' scelto x{it(SCELTO,2)}', fontsize=7.6, color=VERDE)
    ax.axvline(0.80, color=ROSSO, lw=1.0, alpha=.5)
    ax.text(0.80 + .01, 12, ' x0,80', fontsize=7.6, color=ROSSO, alpha=.8)
    griglia(ax); ax.set_xlabel('moltiplicatore del rischio', fontsize=7.8)
    ax.set_ylabel('drawdown atteso (%)', fontsize=7.8)
    ax.set_ylim(0, 52); ax.tick_params(labelsize=7.2)
    ax.legend(fontsize=7.2, facecolor='#1c1c1a', edgecolor=GRIGLIA,
              labelcolor=INK2, loc='upper left')

    testo(fig, .058, .078,
          "La riga rossa e' il limite che hai posto. La curva arancione — lo scenario prudente letto al\n"
          "95o percentile — e' quella che decide, e taglia il tetto proprio a x0,70.", 8.8, INK)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 2
def pag_scenari(C, pdf):
    fig = pagina('Perche\' due scenari',
                 'il 2024-2026 e\' stato un boom, e fare la media con dentro un boom significa aspettarsene un altro')

    PA = per_anno(C)
    testo(fig, .058, .888,
          "Il rendimento di ogni anno, alle impostazioni con cui sono girati i backtest\n"
          "(oro 1,00%, nasdaq 1,50% base). Guarda le ultime due colonne.", 8.8)

    tit(fig, .828, 'Anno per anno, composto')
    nA = len(C['anni'])
    x0, dx = .120, (.930 - .120) / nA
    xs = [(.070, 'left')] + [(x0 + dx*(i + .9), 'right') for i in range(nA)]
    card(fig, .058, .672, .884, .146)
    riga_tab(fig, .788, [''] + [a[2:] for a in C['anni']], xs, 8.0, INK3, 'bold')
    linea(fig, .778, .070, .930)
    for i, (et, k, col) in enumerate((('oro', 'oro', GIALLO),
                                      ('nasdaq', 'nas', BLU),
                                      ('INSIEME', 'ins', VERDE))):
        riga_tab(fig, .754 - i*.026, [et] + [pc(v, 0) for v in PA[k]],
                 xs, 8.2, col, 'bold' if k == 'ins' else 'normal')
    fig.add_artist(Rectangle((x0 + dx*5.02, .676), dx*2.96, .118,
                             facecolor='none', edgecolor=ROSSO, lw=1.2,
                             transform=fig.transFigure))
    fig.text(x0 + dx*6.5, .662, 'il boom', fontsize=7.8, color=ROSSO,
             ha='center', weight='bold')

    tit(fig, .620, 'La stessa cosa, misurata per operazione')
    mo_t, mn_t = C['G_tot']['oro'].mean()*1e4, C['G_tot']['nas'].mean()*1e4
    mo_p, mn_p = C['G_pre']['oro'].mean()*1e4, C['G_pre']['nas'].mean()*1e4
    xs2 = [(.070, 'left'), (.430, 'right'), (.620, 'right'), (.930, 'right')]
    card(fig, .058, .488, .884, .122)
    riga_tab(fig, .580, ['', 'oro', 'nasdaq', 'operazioni'], xs2, 8.0, INK3, 'bold')
    linea(fig, .570, .070, .930)
    riga_tab(fig, .546, [f"TUTTO  {C['dal']} - {C['al']}  ({it(C['d_tot'],2)} anni)",
                         f"{mo_t:+.1f} bp", f"{mn_t:+.1f} bp", it(len(C['op']))],
             xs2, 8.4, CT)
    riga_tab(fig, .518, [f"CALMO  {C['dal']} - {C['al_pre']}  ({it(C['d_pre'],2)} anni)",
                         f"{mo_p:+.1f} bp", f"{mn_p:+.1f} bp", it(len(C['pre']))],
             xs2, 8.4, CC)
    testo(fig, .070, .506,
          f"Nel periodo calmo l'oro rende il {it(100*mo_p/mo_t,0)}% di quanto rende su tutto, "
          f"il nasdaq l'{it(100*mn_p/mn_t,0)}%.", 7.8, INK3)

    tit(fig, .452, 'Le due curve, alle impostazioni di prova')
    ax = fig.add_axes([.098, .232, .844, .200])
    eq = [DEP]
    for _, x, _ in C['op']: eq.append(eq[-1]*(1 + x))
    eq = np.array(eq)
    n_pre = len(C['pre'])
    ax.plot(np.arange(n_pre + 1), eq[:n_pre + 1], color=CC, lw=1.8,
            label=f"2019-2023  {pc(100*(eq[n_pre]/DEP-1),0)} in {it(C['d_pre'],2)} anni")
    ax.plot(np.arange(n_pre, len(eq)), eq[n_pre:], color=ROSSO, lw=1.8,
            label=f"2024-2026  {pc(100*(eq[-1]/eq[n_pre]-1),0)} in {it(C['d_tot']-C['d_pre'],2)} anni")
    ax.set_yscale('log'); griglia(ax)
    ax.set_xlabel('operazioni in ordine di tempo', fontsize=7.8)
    ax.set_ylabel('capitale (scala log)', fontsize=7.8)
    ax.tick_params(labelsize=7.2)
    ax.legend(fontsize=7.6, facecolor='#1c1c1a', edgecolor=GRIGLIA,
              labelcolor=INK2, loc='upper left')

    testo(fig, .058, .196,
          "Due anni e tre quarti hanno prodotto piu' di quanto abbiano prodotto i quattro e mezzo\n"
          "precedenti. Non e' un difetto dei dati: e' successo davvero. Ma pianificare sulla media che\n"
          "lo contiene vuol dire scommettere che si ripeta, e non c'e' niente che lo garantisca.\n\n"
          "Da qui in poi il rischio si decide sul periodo CALMO, e il periodo intero resta come\n"
          "secondo riferimento — il caso favorevole, non quello da mettere a bilancio.", 8.8)

    tit(fig, .100, 'Una precisazione sul confronto', INK)
    testo(fig, .058, .074,
          f"Il periodo calmo dura {it(C['d_pre'],2)} anni, tutto il periodo {it(C['d_tot'],2)}. Un drawdown misurato su quattro anni\n"
          f"e' per forza piu' piccolo: ha meno occasioni di incolonnare le perdite. Per questo nelle\n"
          f"simulazioni il periodo calmo viene allungato a sette anni (x{it(C['oriz'],3)}): 'e se questo regime durasse'.",
          8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 3
def pag_tabella(C, T, pdf):
    fig = pagina('Il rischio, riga per riga',
                 'ogni impostazione nei due scenari, con il drawdown letto a tre profondita\' diverse')

    testo(fig, .058, .888,
          "Le percentuali si scalano tutte insieme: x0,70 vuol dire oro allo 0,70% E nasdaq all'1,05%.\n"
          "Il drawdown al 90% vuol dire: in nove storie su dieci non si e' mai sceso sotto quel numero.\n"
          "Al 95% e' una storia su venti, al 99% una su cento.", 8.8)

    for j, (scen, et, col) in enumerate((('pre', 'SCENARIO CALMO — solo 2019-2023, allungato a sette anni', CC),
                                         ('tot', 'TUTTO IL PERIODO — 2019-2026, col boom dentro', CT))):
        y0 = .800 - j*.376
        tit(fig, y0, et, col)
        xs = [(.070, 'left'), (.255, 'right'), (.390, 'right'), (.530, 'right'),
              (.655, 'right'), (.735, 'right'), (.815, 'right'), (.930, 'right')]
        card(fig, .058, y0 - .296, .884, .316)
        riga_tab(fig, y0 - .030, ['oro / nasdaq', 'peggio 5%', 'MEDIANA',
                                  "all'anno", 'DD 90%', 'DD 95%', 'DD 99%', ''],
                 xs, 8.0, INK3, 'bold')
        linea(fig, y0 - .040, .070, .930)
        for i, w in enumerate(PESI):
            r = T[(w, scen)]
            sfora = r['d'][95] > TETTO
            c = VERDE if w == SCELTO else (ROSSO if sfora else INK2)
            nota = '<< SCELTO' if w == SCELTO else ('oltre il tetto' if sfora else '')
            riga_tab(fig, y0 - .062 - i*.032,
                     [f"{it(R_ORO*w,2)}%  /  {it(R_NAS*w,2)}%",
                      pc(r['t'][5], 0), pc(r['t'][50], 0),
                      pc(cagr(C, r['t'][50]), 1),
                      f"{it(r['d'][90],1)}%", f"{it(r['d'][95],1)}%",
                      f"{it(r['d'][99],1)}%", nota],
                     xs, 8.4, c, 'bold' if w == SCELTO else 'normal')

    testo(fig, .058, .052,
          "Nello scenario calmo il tetto del 35% cade fra x0,70 e x0,80. In tutto il periodo cade fra\n"
          "x0,80 e x0,90: due righe piu' in la'. E' esattamente la differenza che passa fra pianificare\n"
          "sul boom e pianificare senza.", 8.8, INK)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 4
def pag_scelta(C, T, pdf):
    fig = pagina('La scelta',
                 'perche\' x0,70 e non x0,80, e perche\' nessuna formula puo\' deciderlo al posto tuo')

    tit(fig, .888, 'I tre candidati, tutti letti sullo scenario calmo')
    xs = [(.070, 'left'), (.330, 'right'), (.470, 'right'), (.600, 'right'),
          (.700, 'right'), (.800, 'right'), (.930, 'right')]
    card(fig, .058, .724, .884, .142)
    riga_tab(fig, .836, ['', 'oro / nasdaq', 'MEDIANA', "all'anno",
                         'DD 90%', 'DD 95%', 'DD 99%'], xs, 8.0, INK3, 'bold')
    linea(fig, .826, .070, .930)
    cand = [(SCELTO, 'dentro il tetto', VERDE),
            (T['w90'], 'il massimo difendibile', GIALLO),
            (0.80, 'il tuo: fuori', ROSSO)]
    for i, (w, nota, col) in enumerate(cand):
        r = T[(w, 'pre')]
        riga_tab(fig, .800 - i*.030,
                 [nota, f"{it(R_ORO*w,2)}%  /  {it(R_NAS*w,2)}%",
                  pc(r['t'][50], 0), pc(cagr(C, r['t'][50]), 1),
                  f"{it(r['d'][90],1)}%", f"{it(r['d'][95],1)}%",
                  f"{it(r['d'][99],1)}%"], xs, 8.6, col, 'bold')

    testo(fig, .058, .700,
          f"Fra x0,70 e x0,80 ci sono {it(T[(0.80,'pre')]['t'][50] - T[(SCELTO,'pre')]['t'][50], 0)} punti di rendimento mediano in sette anni, e "
          f"{it(T[(0.80,'pre')]['d'][95] - T[(SCELTO,'pre')]['d'][95], 1)} punti di\n"
          f"drawdown in piu'. Il rendimento lo incassi solo se resti seduto: il drawdown lo devi\n"
          f"attraversare per forza, e il 99o percentile dice che una volta su cento saresti a "
          f"-{it(T[(0.80,'pre')]['d'][99],0)}%.", 8.8, INK)

    tit(fig, .620, 'Perche\' il "rapporto ottimale" non decide niente', ROSSO)
    ax = fig.add_axes([.098, .408, .844, .180])
    ks = np.array(PESI)
    rap = [cagr(C, T[(w, 'pre')]['t'][50]) / T[(w, 'pre')]['d'][95] for w in PESI]
    ax.plot(ks, rap, 'o-', color=VIOLA, lw=1.8, ms=4)
    ax.axvline(SCELTO, color=VERDE, lw=1.4)
    griglia(ax); ax.set_xlabel('moltiplicatore del rischio', fontsize=7.8)
    ax.set_ylabel('rendimento annuo / drawdown 95%', fontsize=7.8)
    ax.tick_params(labelsize=7.2)

    testo(fig, .058, .380,
          "Il rapporto fra crescita e sofferenza non ha un massimo: sale sempre. Piu' rischi, piu'\n"
          "rendimento per ogni punto di drawdown — e continua a salire ben oltre qualunque drawdown\n"
          "sopportabile. Non e' un errore del calcolo: e' cosi' che funziona l'interesse composto,\n"
          "finche' non si arriva al punto in cui il conto si azzera (e quel punto e' lontanissimo,\n"
          "a un drawdown del 95% e passa).\n\n"
          "Conclusione: NESSUNA FORMULA TI DICE QUANTO RISCHIARE. Lo decide solo il drawdown che sei\n"
          "disposto ad attraversare senza spegnere tutto. Tu hai detto 35%, e questo e' il numero che\n"
          "comanda in tutto il report.", 8.8)

    tit(fig, .238, 'I numeri sono stabili')
    xs2 = [(.070, 'left'), (.400, 'right'), (.560, 'right'), (.760, 'right'), (.930, 'right')]
    card(fig, .058, .098, .884, .124)
    riga_tab(fig, .192, ['', 'mediana', 'scarto', 'DD 95%', 'scarto'], xs2, 8.0, INK3, 'bold')
    linea(fig, .182, .070, .930)
    for i, w in enumerate((0.65, 0.70, 0.80)):
        s = T['stab'][w]
        riga_tab(fig, .158 - i*.026,
                 [f"x{it(w,2)}", pc(s['m'], 0), f"±{it(s['sm'],0)}",
                  f"{it(s['d'],2)}%", f"±{it(s['sd'],2)}"], xs2, 8.4,
                 VERDE if w == SCELTO else INK2)
    testo(fig, .070, .112,
          "Cinque semi diversi, 12.000 storie ciascuno. Il drawdown si muove di un decimo di punto.",
          7.8, INK3)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 5
def pag_distribuzioni(C, T, D, pdf):
    fig = pagina('Cosa aspettarsi davvero',
                 f'le 12.000 storie all\'impostazione scelta: oro {it(R_ORO*SCELTO,2)}%, nasdaq {it(R_NAS*SCELTO,2)}%')

    tit(fig, .888, 'Il rendimento su sette anni')
    ax = fig.add_axes([.098, .672, .844, .188])
    for k, et, col in (('pre', 'scenario calmo', CC), ('tot', 'tutto il periodo', CT)):
        d = D[k]['rend']
        lim = np.percentile(D['tot']['rend'], 98)
        ax.hist(np.clip(d, 0, lim), bins=80, color=col, alpha=.55,
                edgecolor='none', label=f"{et} — mediana {pc(np.median(d),0)}")
        ax.axvline(np.median(d), color=col, lw=1.6, ls='--')
    griglia(ax); ax.set_xlabel('rendimento su sette anni (%)', fontsize=7.8)
    ax.set_ylabel('storie', fontsize=7.8); ax.tick_params(labelsize=7.2)
    ax.legend(fontsize=7.6, facecolor='#1c1c1a', edgecolor=GRIGLIA,
              labelcolor=INK2, loc='upper right')

    tit(fig, .636, 'Il drawdown')
    ax = fig.add_axes([.098, .420, .844, .188])
    for k, et, col in (('pre', 'scenario calmo', CC), ('tot', 'tutto il periodo', CT)):
        d = D[k]['dd_pct']
        ax.hist(d, bins=80, color=col, alpha=.55, edgecolor='none',
                label=f"{et} — 95% a {it(np.percentile(d,95),1)}%")
    ax.axvline(TETTO, color=ROSSO, lw=1.8, ls=':')
    ax.text(TETTO + .4, ax.get_ylim()[1]*.86, ' il tuo tetto', fontsize=7.6, color=ROSSO)
    griglia(ax); ax.set_xlabel('drawdown massimo della storia (%)', fontsize=7.8)
    ax.set_ylabel('storie', fontsize=7.8); ax.tick_params(labelsize=7.2)
    ax.legend(fontsize=7.6, facecolor='#1c1c1a', edgecolor=GRIGLIA,
              labelcolor=INK2, loc='upper right')

    tit(fig, .384, 'In numeri, a tutte le profondita\'')
    xs = [(.070, 'left')] + [(.180 + .107*i, 'right') for i in range(7)]
    card(fig, .058, .208, .884, .162)
    riga_tab(fig, .352, ['percentile', '5%', '10%', '25%', '50%', '75%', '90%', '95%'],
             xs, 8.0, INK3, 'bold')
    linea(fig, .342, .070, .930)
    P = (5, 10, 25, 50, 75, 90, 95)
    yy = .318
    for k, et, col in (('pre', 'CALMO', CC), ('tot', 'TUTTO', CT)):
        riga_tab(fig, yy, [f'{et} · rendimento'] +
                 [pc(np.percentile(D[k]['rend'], p), 0) for p in P], xs, 8.2, col)
        yy -= .026
        riga_tab(fig, yy, [f'{et} · drawdown'] +
                 [f"{it(np.percentile(D[k]['dd_pct'], p), 1)}%" for p in P], xs, 8.2, col)
        yy -= .034

    testo(fig, .058, .176,
          f"Come si legge la riga del drawdown: nello scenario calmo, meta' delle storie non scende\n"
          f"mai sotto il {it(np.percentile(D['pre']['dd_pct'],50),1)}%, nove su dieci restano sopra il "
          f"-{it(np.percentile(D['pre']['dd_pct'],90),1)}%, diciannove su venti sopra il "
          f"-{it(np.percentile(D['pre']['dd_pct'],95),1)}%.\n"
          f"Una storia su venti scende piu' di cosi'. Non e' un caso remoto: e' una probabilita' su\n"
          f"venti, e su sette anni va messa in conto come qualcosa che puo' capitare.", 8.8)

    tit(fig, .092, 'Il numero sobrio, per chi non si fida del composto')
    testo(fig, .058, .066,
          f"A rischio fisso — lotto costante, niente reinvestimento — la stessa impostazione da' una\n"
          f"mediana di {pc(T['fisso_pre'][50],0)} nello scenario calmo e {pc(T['fisso_tot'][50],0)} su tutto il periodo, con drawdown\n"
          f"al 95o percentile del {it(T['fisso_pre_dd'][95],1)}% e {it(T['fisso_tot_dd'][95],1)}%. E' la lettura da usare per fare i piani.",
          8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 6
def pag_curve(C, F, pdf):
    fig = pagina('Come ci si arriva',
                 'la fascia dei percorsi possibili, anno per anno, all\'impostazione scelta')

    testo(fig, .058, .888,
          "Non una curva sola: la fascia dentro cui cadono le 12.000 storie. La linea centrale e' la\n"
          "mediana, la fascia scura tiene meta' delle storie, quella chiara nove su dieci.", 8.8)

    for j, (k, et, col) in enumerate((('pre', 'SCENARIO CALMO — il riferimento', CC),
                                      ('tot', 'TUTTO IL PERIODO — il caso favorevole', CT))):
        y0 = .812 - j*.400
        tit(fig, y0, et, col)
        ax = fig.add_axes([.098, y0 - .296, .844, .278])
        x, B = F[k]
        anni = x / x[-1] * C['d_tot']
        ax.fill_between(anni, B[5], B[95], color=col, alpha=.16, label='9 storie su 10')
        ax.fill_between(anni, B[25], B[75], color=col, alpha=.34, label='meta\' delle storie')
        ax.plot(anni, B[50], color=col, lw=2.0, label=f'mediana  {pc(100*(B[50][-1]/DEP-1),0)}')
        ax.axhline(DEP, color=INK3, lw=.9, ls='--')
        ax.set_yscale('log'); griglia(ax)
        ax.set_xlabel('anni', fontsize=7.8)
        ax.set_ylabel('capitale (scala log)', fontsize=7.8)
        ax.tick_params(labelsize=7.2)
        ax.legend(fontsize=7.4, facecolor='#1c1c1a', edgecolor=GRIGLIA,
                  labelcolor=INK2, loc='upper left')
        fig.text(.930, y0 - .318,
                 f"da 10.000 a {it(B[5][-1],0)} (5%)  ·  {it(B[50][-1],0)} (mediana)  ·  {it(B[95][-1],0)} (95%)",
                 fontsize=7.8, color=INK3, ha='right')

    testo(fig, .058, .072,
          "La fascia si allarga con gli anni perche' l'incertezza si moltiplica, non si somma. Dopo\n"
          "sette anni di interesse composto la distanza fra la storia sfortunata e quella fortunata\n"
          "e' un fattore dieci: e' il motivo per cui una previsione puntuale non ha senso, e l'unica\n"
          "cosa che si puo' davvero governare e' il drawdown.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 7
def pag_fare(C, T, pdf):
    fig = pagina('Cosa fare', 'due caselle, e le cose che questo report non puo\' dimostrare')

    tit(fig, .888, 'Le due caselle')
    xs = [(.070, 'left'), (.430, 'right'), (.620, 'right'), (.930, 'right')]
    card(fig, .058, .746, .884, .124)
    riga_tab(fig, .840, ['EA / parametro', 'adesso', 'da mettere', 'gambe interessate'],
             xs, 8.0, INK3, 'bold')
    linea(fig, .830, .070, .930)
    riga_tab(fig, .806, ['ORO — InpRiskPercent', '0,70%', f"{it(R_ORO*SCELTO,2)}%",
                         'ROTTURA + RITRACCIAMENTO'], xs, 8.6, GIALLO)
    riga_tab(fig, .778, ['NASDAQ — RiskPercent', '1,50%', f"{it(R_NAS*SCELTO,2)}%",
                         'la base, prima dell\'adattivo'], xs, 8.6, BLU)
    testo(fig, .070, .762,
          "Sull'oro non cambia niente: era gia' a 0,70%. Cambia solo il nasdaq.", 7.8, INK3)

    tit(fig, .710, 'Perche\' sembra che tocchi una gamba sola')
    testo(fig, .058, .684,
          "I due backtest sono girati a oro 1,00% e nasdaq 1,50%. Nel codice oggi c'e' oro 0,70% e\n"
          "nasdaq 1,50%: l'oro sta gia' a x0,70 del suo test, il nasdaq a x1,00. Non erano\n"
          "proporzionali. Portare il nasdaq a 1,05% li mette tutti e due a x0,70, ed e' proprio la\n"
          "scalatura proporzionale che avevi chiesto. Da qui in avanti si muovono insieme.", 8.8)

    tit(fig, .592, 'Il riassunto in una riga')
    card(fig, .058, .496, .884, .080, VERDE)
    r = T[(SCELTO, 'pre')]
    fig.text(.5, .544, f"oro {it(R_ORO*SCELTO,2)}%  ·  nasdaq {it(R_NAS*SCELTO,2)}%", fontsize=13.5,
             color=VERDE, ha='center', weight='bold')
    fig.text(.5, .516,
             f"da aspettarsi {pc(r['t'][50],0)} in sette anni ({pc(cagr(C, r['t'][50]),1)} l'anno), "
             f"con un drawdown che 19 volte su 20 resta sotto il {it(r['d'][95],1)}%",
             fontsize=8.6, color=INK2, ha='center')

    tit(fig, .452, 'Quello che questo report NON dimostra', ROSSO)
    testo(fig, .058, .426,
          "1. IL BOOTSTRAP NON SA SE IL VANTAGGIO E' VERO. Rimescola le stesse operazioni: misura\n"
          "   quanto puo' variare il percorso DATO che il vantaggio esista. Se nella realta' la\n"
          "   strategia vale il 70% di quanto misurato, il drawdown resta quello e il rendimento\n"
          "   crolla. E' il motivo per cui il rischio e' stato scelto sul periodo piu' magro invece\n"
          "   che sulla media, e per cui non si e' preso il massimo consentito.\n\n"
          "2. LE DUE STRATEGIE NON SONO MAI GIRATE INSIEME DENTRO METATRADER. Il tester prende un\n"
          "   simbolo alla volta. Questa e' la fusione esatta di due backtest separati: giusta sui\n"
          "   rendimenti e sul drawdown, muta su esecuzioni in contesa e ordini rifiutati.\n\n"
          "3. IL FUORI CAMPIONE DELL'ORO (2024.01-2026.09) E' GIA' STATO SPESO una volta sola, e ha\n"
          "   passato i criteri. Non c'e' piu' dato vergine su quegli anni.\n\n"
          "4. IL NASDAQ E' LA GAMBA MENO VERIFICATA. Il test del plateau non e' ancora stato fatto.\n"
          "   Finche' non c'e', il suo contributo qui va letto come il piu' ottimistico dei due.\n\n"
          "5. TUTTI I NUMERI VENGONO DA PU PRIME. Su Fusion i costi del nasdaq si equivalgono al\n"
          "   netto, ma per composizione diversa: spread piu' largo, swap piu' basso.\n\n"
          "6. L'ARROTONDAMENTO DEL LOTTO non e' simulato. Su 10.000 euro allo 0,70% il lotto viene\n"
          "   piccolo e il broker lo arrotonda al passo minimo: il rischio vero puo' scostarsi di\n"
          "   qualche punto percentuale da quello teorico, in su o in giu'. Si legge nel pannello.")

    tit(fig, .166, 'Come e\' stato calcolato')
    testo(fig, .058, .140,
          f"Bootstrap a blocchi mobili da 20 operazioni, che non spezza le serie di perdite\n"
          f"consecutive; 12.000 storie per ogni riga; ogni gamba ricampionata per conto suo e poi\n"
          f"rifusa, cosi' nessuna sincronia fortunata fra oro e nasdaq viene regalata. Orizzonte\n"
          f"sempre di sette anni: il periodo calmo ({it(C['d_pre'],2)} anni) viene allungato x{it(C['oriz'],3)} perche' i\n"
          f"drawdown siano confrontabili. Le operazioni si riscalano linearmente col rischio, perche'\n"
          f"il lotto e' proporzionale alla percentuale scelta.\n\n"
          f"Rigenerare: python3 tools/report_rischio_portafoglio.py <oro.html> <nasdaq.html>", 8.4)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== calcoli
def fascia(C, scen, k, n=4000, punti=90):
    """La fascia di percentili della curva, per il grafico dei percorsi."""
    G  = C['G_pre'] if scen == 'pre' else C['G_tot']
    oz = C['oriz']  if scen == 'pre' else 1.0
    from montecarlo_portafoglio import _allunga, _intreccia
    rng = np.random.default_rng(31)
    nomi = list(G)
    lung = [max(1, int(round(len(G[x])*oz))) for x in nomi]
    pezzi = [_allunga(G[x]*k, 'blocchi', n, rng, 20, lung[i])
             for i, x in enumerate(nomi)]
    seq = _intreccia(pezzi, lung, rng)
    eq = DEP * np.cumprod(1.0 + seq, axis=1)
    eq = np.concatenate([np.full((n, 1), DEP), eq], axis=1)
    cp = np.linspace(0, eq.shape[1]-1, punti).astype(int)
    E = eq[:, cp]
    return cp, {p: np.percentile(E, p, axis=0) for p in (5, 25, 50, 75, 95)}


def calcola(C):
    T = {}
    pesi = sorted(set(PESI) | {SCELTO, 0.65, 0.80})
    for w in pesi:
        for scen in ('pre', 'tot'):
            r = mc(C, scen, w)
            T[(w, scen)] = {'t': tabella(r, 'rend'), 'd': tabella(r, 'dd_pct')}
            print(f"  x{w:4.2f} {scen}: mediana {T[(w,scen)]['t'][50]:7.0f}%  "
                  f"DD90 {T[(w,scen)]['d'][90]:5.1f}%  DD95 {T[(w,scen)]['d'][95]:5.1f}%")
    # il massimo difendibile leggendo il tetto al 90o percentile
    T['w90'] = round(peso_per_dd(C, 'pre', 90, TETTO), 2)
    if (T['w90'], 'pre') not in T:
        for scen in ('pre', 'tot'):
            r = mc(C, scen, T['w90'])
            T[(T['w90'], scen)] = {'t': tabella(r, 'rend'), 'd': tabella(r, 'dd_pct')}
    print(f"  massimo al 90o percentile: x{T['w90']:.2f}")
    # stabilita' su cinque semi
    T['stab'] = {}
    for w in (0.65, 0.70, 0.80):
        m, d = [], []
        for sd in (7, 11, 23, 101, 997):
            r = mc(C, 'pre', w, SIM, sd)
            m.append(tabella(r, 'rend')[50]); d.append(tabella(r, 'dd_pct')[95])
        T['stab'][w] = {'m': float(np.mean(m)), 'sm': float(np.std(m)),
                        'd': float(np.mean(d)), 'sd': float(np.std(d))}
    # la lettura sobria, a rischio fisso
    for scen in ('pre', 'tot'):
        r = mc(C, scen, SCELTO, composto=False)
        T[f'fisso_{scen}'] = tabella(r, 'rend')
        T[f'fisso_{scen}_dd'] = tabella(r, 'dd_pct')
    D = {k: mc(C, k, SCELTO) for k in ('pre', 'tot')}
    F = {k: fascia(C, k, SCELTO) for k in ('pre', 'tot')}
    return T, D, F


def main(p_oro, p_nas, out):
    C = carica(p_oro, p_nas)
    print(f"tutto {C['dal']} -> {C['al']}  {it(C['d_tot'],2)} anni, {len(C['op'])} operazioni")
    print(f"calmo {C['dal']} -> {C['al_pre']}  {it(C['d_pre'],2)} anni, {len(C['pre'])} operazioni"
          f"  (orizzonte x{it(C['oriz'],3)})")
    # controllo: il periodo calmo DEVE essere piu' magro, altrimenti la
    # premessa di tutto il report non sta in piedi
    assert C['G_pre']['oro'].mean() < C['G_tot']['oro'].mean(), 'il periodo calmo non e\' piu\' magro'
    print('Monte Carlo...')
    T, D, F = calcola(C)
    with PdfPages(out) as pdf:
        pag_risposta(C, T, pdf)
        pag_scenari(C, pdf)
        pag_tabella(C, T, pdf)
        pag_scelta(C, T, pdf)
        pag_distribuzioni(C, T, D, pdf)
        pag_curve(C, F, pdf)
        pag_fare(C, T, pdf)
    print('scritto', out)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2],
         sys.argv[3] if len(sys.argv) > 3 else 'report/quanto-rischiare.pdf')
