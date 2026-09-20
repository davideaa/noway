#!/usr/bin/env python3
"""UN CONTO O DUE? — e quanto vale davvero mettere insieme oro e nasdaq.

Domanda di Davide: se le tengo separate rendono meno, se le metto
insieme rendono molto di piu'. Perche'? E allora conviene un conto solo
o due conti distinti?

La risposta breve, che questo report dimostra pagina per pagina:

1. Quel confronto era truccato, e l'errore era mio. "Insieme a peso
   pieno" non e' "insieme": e' RISCHIARE IL DOPPIO. Due strategie che
   dimensionano ognuna sul totale condiviso mettono a rischio il doppio
   dei soldi di due conti separati a meta' testa. Il 4572% contro il
   644% non misura la diversificazione, misura la leva.

2. A parita' di soldi rischiati, un conto e due conti danno lo stesso
   identico risultato a rischio fisso (209,3% tutti e due, al decimale)
   e quasi lo stesso col composto. La scelta non si fa sui numeri.

3. La diversificazione NON si vede nel rendimento. Si vede nel
   drawdown, e si incassa alzando il rischio fino a tornare alla
   sofferenza di prima. Li' l'insieme stacca nettamente le due gambe
   da sole.

4. Ma si vede solo se il drawdown si misura bene. Normalizzando sul
   drawdown DEL BACKTEST, l'insieme sembra inutile (pareggia con il
   nasdaq da solo). Normalizzando sul drawdown VERO, quello del
   bootstrap, l'insieme vince largamente. Il backtest del nasdaq ha
   pescato un drawdown fortunato, e quel colpo di fortuna si travestiva
   da superiorita'.

Uso:  python3 tools/report_uno_o_due.py <oro.html> <nasdaq.html> [uscita.pdf]
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
from montecarlo_portafoglio import simula, tabella, METODI
from report_validazione import (INK, INK2, INK3, BLU, ARANCIO, VERDE, ROSSO,
                                GIALLO, GRIGLIA, VIOLA, it, pc, card, kpi,
                                griglia, riga_tab, linea, testo)

DEP = 10000.0
CO, CN, CI = GIALLO, BLU, VERDE          # oro, nasdaq, insieme
NPAG = 6
PAG = [0]
SIM = 8000
DD_OBIETTIVO = 25.0                      # la sofferenza che accettiamo


def pagina(titolo, sottotitolo):
    PAG[0] += 1
    fig = plt.figure(figsize=(8.27, 11.69))
    fig.text(.058, .958, titolo, fontsize=19, color=INK, weight='bold')
    fig.text(.058, .937, sottotitolo, fontsize=8.5, color=INK2)
    fig.text(.942, .960, 'UN CONTO O DUE', fontsize=8.6, color=INK3,
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
    """Rendimento dell'operazione in frazione del conto di quel momento."""
    p = o.saldo - o.netto
    return o.netto / p if p > 0 else 0.0


def carica(p_oro, p_nas):
    oro, _, _ = leggi(p_oro, rischio_test=0.01)
    nas, _, _ = leggi(p_nas, rischio_test=0.015)
    dal = max(oro[0].chiusura[:10], nas[0].chiusura[:10])
    al = min(oro[-1].chiusura[:10], nas[-1].chiusura[:10])
    oro = [o for o in oro if dal <= o.chiusura[:10] <= al]
    nas = [o for o in nas if dal <= o.chiusura[:10] <= al]
    ins = sorted([(o.chiusura, frazione(o), 'oro') for o in oro] +
                 [(o.chiusura, frazione(o), 'nas') for o in nas])
    d0, d1 = ins[0][0], ins[-1][0]
    durata = (int(d1[:4]) + int(d1[5:7])/12) - (int(d0[:4]) + int(d0[5:7])/12)
    return {'oro': oro, 'nas': nas, 'ins': ins, 'dal': dal, 'al': al,
            'durata': durata,
            'G': {'oro': [frazione(o) for o in oro],
                  'nas': [frazione(o) for o in nas]}}


def dd_max(v):
    pk = np.maximum.accumulate(v)
    return 100 * float(((pk - v) / pk).max())


def dd_serie(v):
    pk = np.maximum.accumulate(v)
    return -100 * (pk - v) / pk


def un_conto(ins, peso, composto):
    """Un conto solo: tutte e due dimensionano sul totale condiviso."""
    eq = [DEP]
    for _, x, _ in ins:
        eq.append(eq[-1]*(1 + peso*x) if composto else eq[-1] + peso*x*DEP)
    return np.array(eq)


def due_conti(ins, composto, quota=0.5):
    """Due conti separati: ognuno compone sul PROPRIO capitale."""
    a = {'oro': DEP*quota, 'nas': DEP*(1-quota)}
    base = dict(a)
    w = [DEP]
    for _, x, k in ins:
        a[k] = a[k]*(1 + x) if composto else a[k] + x*base[k]
        w.append(a['oro'] + a['nas'])
    return np.array(w)


def una_gamba(ins, k, peso, composto):
    eq = [DEP]
    for _, x, kk in ins:
        if kk != k: continue
        eq.append(eq[-1]*(1 + peso*x) if composto else eq[-1] + peso*x*DEP)
    return np.array(eq)


def cagr(tot_pct, anni):
    return 100 * ((1 + tot_pct/100) ** (1/anni) - 1)


def peso_per_dd(fn, target, composto, giri=40):
    """Scala il peso finche' il drawdown non arriva al bersaglio."""
    lo, hi = 0.02, 6.0
    for _ in range(giri):
        m = (lo + hi) / 2
        if dd_max(fn(m, composto)) < target: lo = m
        else: hi = m
    return lo


# =============================================================== pag. 1
def pag_domanda(C, pdf):
    ins = C['ins']; a = C['durata']
    fig = pagina('Un conto o due?',
                 'perche\' "insieme" sembrava rendere sette volte tanto, e cosa misurava davvero')

    e2 = due_conti(ins, True); e1 = un_conto(ins, .5, True); ep = un_conto(ins, 1., True)
    y = .845
    for i, (v, et, col) in enumerate((
            (f"{pc(100*(e2[-1]/DEP-1), 0)}", 'DUE conti da 5.000', CI),
            (f"{pc(100*(e1[-1]/DEP-1), 0)}", 'UN conto, meta\' peso', CI),
            (f"{pc(100*(ep[-1]/DEP-1), 0)}", 'UN conto, peso pieno', ROSSO))):
        kpi(fig, .058 + i*.298, y, .284, v, et + '  ·  composto', col, h=.058)

    y -= .052
    testo(fig, .058, y,
          "I primi due numeri sono la stessa cosa. Il terzo non e' \"insieme\": e' il doppio del rischio.",
          9.2, INK, 'bold')

    y -= .048
    tit(fig, y, 'Dove stava il trucco, ed era mio'); y -= .030
    testo(fig, .058, y,
          "Due strategie su un conto solo, ognuna a peso pieno, dimensionano ognuna sul TOTALE.\n"
          "L'oro rischia lo 0,70% di 10.000 e il nasdaq l'1,50% di 10.000: settanta piu' centocinquanta\n"
          "euro. Due conti da 5.000 rischiano trentacinque piu' settantacinque. E' esattamente il\n"
          "doppio di soldi. Quel 4572% contro 644% non misura la diversificazione: misura la leva.\n\n"
          "La diversificazione non regala rendimento. Regala DRAWDOWN PIU' BASSO. Il rendimento si\n"
          "incassa dopo, alzando il rischio fino a tornare alla sofferenza che si sopportava prima.",
          8.8)

    y -= .180
    tit(fig, y, 'Il conto del rischio, a inizio periodo'); y -= .026
    xs = [(.070, 'left'), (.430, 'right'), (.610, 'right'), (.790, 'right'), (.930, 'right')]
    card(fig, .058, y - .118, .884, .128)
    riga_tab(fig, y - .016, ['impostazione', 'capitale', 'rischio oro', 'rischio nas', 'totale a rischio'],
             xs, 8.0, INK3, 'bold')
    linea(fig, y - .026, .070, .930)
    for i, (n, cap, ro, rn) in enumerate((
            ('due conti da 5.000', '5.000 + 5.000', 35.0, 75.0),
            ("un conto, meta' peso (0,35% / 0,75%)", '10.000', 35.0, 75.0),
            ('un conto, peso pieno (0,70% / 1,50%)', '10.000', 70.0, 150.0))):
        yy = y - .046 - i*.028
        c = ROSSO if i == 2 else INK2
        riga_tab(fig, yy, [n, cap, f"{it(ro,0)} EUR", f"{it(rn,0)} EUR",
                           f"{it(ro+rn,0)} EUR"], xs, 8.4, c,
                 'bold' if i == 2 else 'normal')

    y -= .175
    tit(fig, y, 'Le tre curve, con il composto'); y -= .022
    ax = fig.add_axes([.088, y - .215, .854, .205])
    x = np.arange(len(ins) + 1)
    for v, n, c in ((e2, "due conti da 5.000", ARANCIO),
                    (e1, "un conto, meta' peso", CI),
                    (ep, "un conto, peso pieno (doppio rischio)", ROSSO)):
        ax.plot(x, v, color=c, lw=1.5, label=f"{n}   {pc(100*(v[-1]/DEP-1),0)}")
    ax.set_yscale('log'); griglia(ax)
    ax.set_xlabel('operazioni in ordine di tempo', fontsize=7.6)
    ax.set_ylabel('capitale (scala logaritmica)', fontsize=7.6)
    ax.legend(fontsize=7.4, facecolor='#1c1c1a', edgecolor=GRIGLIA,
              labelcolor=INK2, loc='upper left')
    ax.tick_params(labelsize=7.2)

    y -= .245
    testo(fig, .058, y,
          "Le prime due sono sovrapposte perche' SONO la stessa cosa. La terza sta piu' in alto per lo\n"
          "stesso motivo per cui un mutuo piu' grande compra una casa piu' grande.", 8.6, INK2)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 2
def pag_uno_o_due(C, pdf):
    ins = C['ins']; a = C['durata']
    fig = pagina('A parita\' di soldi rischiati',
                 'un conto solo contro due conti separati: la differenza e\' quasi nulla, e si sa perche\'')

    tit(fig, .868, 'Stesso capitale, stesso rischio, due strutture')
    xs = [(.070, 'left'), (.470, 'right'), (.620, 'right'), (.760, 'right'), (.930, 'right')]
    card(fig, .058, .612, .884, .230)
    riga_tab(fig, .822, ['', 'rendimento', 'all\'anno', 'drawdown', 'rend / DD'],
             xs, 8.0, INK3, 'bold')
    yy = .796
    for composto in (False, True):
        riga_tab(fig, yy, ['CON INTERESSE COMPOSTO' if composto else 'A RISCHIO FISSO',
                           None, None, None, None], xs, 8.0, VIOLA, 'bold')
        linea(fig, yy - .009, .070, .930)
        yy -= .028
        for n, v in (('due conti da 5.000 + 5.000', due_conti(ins, composto)),
                     ("un conto da 10.000, meta\' peso", un_conto(ins, .5, composto))):
            r = 100*(v[-1]/DEP - 1); d = dd_max(v)
            riga_tab(fig, yy, [n, pc(r, 1), pc(cagr(r, a), 1), f"{it(d,2)}%",
                               f"{it(r/d, 2)}"], xs, 8.4, INK2)
            yy -= .026
        yy -= .018

    tit(fig, .578, 'Perche\' a rischio fisso sono identiche al decimale')
    testo(fig, .058, .550,
          "Senza composto ogni operazione muove il conto di una cifra fissa, decisa dal capitale di\n"
          "partenza. Sommare prima dentro un conto e poi fra i due, oppure sommare tutto insieme, da\'\n"
          "lo stesso totale: e\' la proprieta\' associativa della somma, non una coincidenza.", 8.8)

    e2 = due_conti(ins, True); e1 = un_conto(ins, True and .5, True)
    tit(fig, .472, 'Col composto un conto solo vince di pochissimo, e non per magia')
    testo(fig, .058, .444,
          f"Il conto unico chiude a {pc(100*(e1[-1]/DEP-1),1)} contro {pc(100*(e2[-1]/DEP-1),1)}: "
          f"{it(100*(e1[-1]-e2[-1])/DEP,1)} punti in sette anni. L\'unica differenza vera\n"
          "fra le due strutture e\' che su un conto solo i profitti dell\'oro ingrandiscono anche le\n"
          "posizioni del nasdaq, e viceversa; su due conti separati ognuno cresce per conto suo.\n"
          "Siccome l\'insieme oscilla meno delle due gambe prese a se\', il conto condiviso paga meno\n"
          "\"attrito da oscillazione\": perdere il 20% e poi guadagnare il 20% non riporta al punto di\n"
          "partenza, e meno si oscilla meno si paga quel pedaggio.\n\n"
          "Ma sono due punti l\'anno scarsi: NON E\' UN MOTIVO PER SCEGLIERE. Vedere pagina 6.", 8.8)

    tit(fig, .300, 'Il drawdown: qui invece qualcosa succede')
    ax = fig.add_axes([.088, .108, .854, .170])
    n_ins = len(ins)
    for v, n, c in ((una_gamba(ins, 'oro', 1., True), 'solo oro', CO),
                    (una_gamba(ins, 'nas', 1., True), 'solo nasdaq', CN),
                    (un_conto(ins, .5, True), "insieme, meta\' peso", CI)):
        xx = np.linspace(0, n_ins, len(v))
        ax.fill_between(xx, dd_serie(v), 0, color=c, alpha=.30)
        ax.plot(xx, dd_serie(v), color=c, lw=1.1, label=f"{n}   max {it(dd_max(v),1)}%")
    griglia(ax); ax.set_ylabel('sotto il massimo (%)', fontsize=7.6)
    ax.set_xlabel('operazioni in ordine di tempo', fontsize=7.6)
    ax.legend(fontsize=7.4, facecolor='#1c1c1a', edgecolor=GRIGLIA,
              labelcolor=INK2, loc='lower left')
    ax.tick_params(labelsize=7.2)

    do = dd_max(una_gamba(ins, 'oro', 1., True)); dn = dd_max(una_gamba(ins, 'nas', 1., True))
    di = dd_max(un_conto(ins, .5, True))
    testo(fig, .058, .072,
          f"Se le due sofferenze si sommassero, meta\' per uno, il drawdown dell\'insieme sarebbe il "
          f"{it((do+dn)/2, 1)}%.\nE\' il {it(di,1)}%. Quello che manca e\' la diversificazione: "
          f"correlazione mensile +0,075.", 8.8, INK)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 3
def pag_parita(C, MCP, pdf):
    ins = C['ins']; a = C['durata']
    fig = pagina('A parita\' di sofferenza',
                 'quanto rende ciascuna opzione lasciandola correre fino allo stesso drawdown del 25%')

    testo(fig, .058, .888,
          "Confrontare rendimenti ottenuti con rischi diversi non dice niente. La domanda giusta e\':\n"
          "se accetto di perdere al massimo un quarto del conto, quale delle tre opzioni mi paga di\n"
          "piu\'? Ogni riga e\' la stessa strategia col rischio scalato fino a quella soglia. Ma la\n"
          "soglia si puo\' misurare in due modi, e danno risposte opposte.", 8.8)

    # una tabella sola, le due letture affiancate
    tit(fig, .795, 'Le due letture, affiancate')
    fig.text(.353, .767, 'soglia sul DD DEL BACKTEST', fontsize=7.6, color=ROSSO,
             ha='center', weight='bold')
    fig.text(.755, .767, 'soglia sul DD VERO (bootstrap)', fontsize=7.6, color=VERDE,
             ha='center', weight='bold')
    xs = [(.070, 'left'), (.315, 'right'), (.445, 'right'),
          (.610, 'right'), (.755, 'right'), (.930, 'right')]
    card(fig, .058, .498, .884, .280)
    riga_tab(fig, .748, ['', 'peso', 'rendimento', 'peso', 'peggio (5%)', 'MEDIANA'],
             xs, 8.0, INK3, 'bold')
    yy = .722
    for composto in (False, True):
        riga_tab(fig, yy, ['CON COMPOSTO' if composto else 'A RISCHIO FISSO',
                           None, None, None, None, None], xs, 8.0, VIOLA, 'bold')
        linea(fig, yy - .009, .070, .930)
        yy -= .028
        k = 'composto' if composto else 'fisso'
        for n, fn in (('solo oro', lambda w, c: una_gamba(ins, 'oro', w, c)),
                      ('solo nasdaq', lambda w, c: una_gamba(ins, 'nas', w, c)),
                      ('INSIEME', lambda w, c: un_conto(ins, w, c))):
            w = peso_per_dd(fn, DD_OBIETTIVO, composto)
            r = 100*(fn(w, composto)[-1]/DEP - 1)
            t = MCP[k][n]
            riga_tab(fig, yy, [n, f"x{it(w,2)}", pc(r, 0), f"x{it(t['peso'],2)}",
                               pc(t['p5'], 0), pc(t['p50'], 0)], xs, 8.4,
                     INK if n == 'INSIEME' else INK2,
                     'bold' if n == 'INSIEME' else 'normal')
            yy -= .026
        yy -= .018

    tit(fig, .464, 'Cosa dicono le due colonne')
    b = MCP['composto']
    testo(fig, .058, .436,
          "A SINISTRA, col drawdown del backtest, mettere insieme e\' quasi indifferente: pareggia con\n"
          "il nasdaq da solo, e basta spostare la soglia di qualche punto perche\' il vincitore cambi.\n"
          "E\' un risultato fragile, e sotto c\'e\' il perche\'.\n\n"
          f"A DESTRA, col drawdown vero, si ribalta: l\'insieme rende {pc(b['INSIEME']['p50'],0)} contro "
          f"{pc(b['solo nasdaq']['p50'],0)} del\nnasdaq da solo, e soprattutto il suo scenario "
          f"sfortunato e\' {pc(b['INSIEME']['p5'],0)} contro {pc(b['solo nasdaq']['p5'],0)}: il doppio.\n"
          "La diversificazione non si incassa nel rendimento medio. Si incassa nella tenuta del peggio.",
          8.8)

    tit(fig, .292, 'Perche\' la lettura di sinistra inganna', ROSSO)
    testo(fig, .058, .264,
          "Il drawdown del backtest e\' UN SOLO tiro di dadi. Il nasdaq, in quei sette anni, ha pescato\n"
          "un drawdown fortunato: le sue perdite non si sono mai incolonnate nel modo peggiore. Chi\n"
          "normalizza su quel numero sta premiando quella fortuna e scambiandola per superiorita\', e\n"
          "lascia correre il nasdaq con un peso che nella storia vera non reggerebbe.\n\n"
          "Il drawdown vero si misura col bootstrap a blocchi: migliaia di storie plausibili fatte con\n"
          "le stesse identiche operazioni, senza spezzare le serie di perdite consecutive. Li\' il\n"
          "nasdaq da solo mostra la coda che il backtest non gli aveva fatto vedere, mentre l\'insieme\n"
          "ha un drawdown non solo piu\' basso ma anche piu\' STABILE fra una storia e l\'altra. Ed e\'\n"
          "la stabilita\', non la media, che permette di alzare il peso senza saltare per aria.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 4
def pag_montecarlo(C, TAB, pdf):
    a = C['durata']
    fig = pagina('Monte Carlo del portafoglio',
                 'le stesse 2.520 operazioni rimescolate in quattro modi, a peso pieno')

    y = .868
    testo(fig, .058, y,
          "Il backtest e' una storia sola. Qui le operazioni vengono ripescate migliaia di volte per\n"
          "costruire storie alternative, con quattro tecniche che rispondono a domande diverse.", 8.8)

    y -= .058
    xs = [(.070, 'left'), (.930, 'right')]
    card(fig, .058, y - .148, .884, .158)
    for i, (n, d) in enumerate((
        ('permutazione', 'stesse identiche operazioni, ordine diverso. Non cambia il punto d\'arrivo: solo il percorso'),
        ('IID', 'ripescate a caso con rimpiazzo, una alla volta. Spezza le serie di perdite: sottostima il drawdown'),
        ('blocchi mobili (20)', 'ripescate a gruppi contigui di venti. Tiene le serie di perdite. E\' quello a cui credere'),
        ('stazionario', 'come i blocchi, ma di lunghezza casuale: non privilegia nessuna durata'))):
        yy = y - .020 - i*.036
        fig.text(.070, yy, n, fontsize=8.6, color=INK, weight='bold')
        fig.text(.070, yy - .015, d, fontsize=7.8, color=INK2)

    y -= .178
    tit(fig, y, 'Rendimento e drawdown, per metodo'); y -= .026
    xs = [(.070, 'left'), (.360, 'right'), (.490, 'right'), (.620, 'right'),
          (.760, 'right'), (.930, 'right')]
    card(fig, .058, y - .285, .884, .295)
    riga_tab(fig, y - .016, ['metodo', 'rend 5%', 'rend 50%', 'rend 95%',
                             'DD 50%', 'DD 95%'], xs, 8.0, INK3, 'bold')
    yy = y - .034
    for composto in (False, True):
        et = 'CON COMPOSTO' if composto else 'A RISCHIO FISSO'
        riga_tab(fig, yy, [et, None, None, None, None, None], xs, 8.0, VIOLA, 'bold')
        linea(fig, yy - .009, .070, .930); yy -= .026
        for m in METODI:
            t = TAB['composto' if composto else 'fisso'][m]
            riga_tab(fig, yy, [m, pc(t['r5'], 0), pc(t['r50'], 0), pc(t['r95'], 0),
                               f"{it(t['d50'],1)}%", f"{it(t['d95'],1)}%"],
                     xs, 8.4, INK if m == 'blocchi' else INK2,
                     'bold' if m == 'blocchi' else 'normal')
            yy -= .025
        yy -= .014

    y -= .330
    tf = TAB['fisso']['blocchi']; tc = TAB['composto']['blocchi']
    tit(fig, y, 'Le due cose da portare via'); y -= .030
    testo(fig, .058, y,
          f"1. L'ORDINE NON SPOSTA IL PUNTO D'ARRIVO. La permutazione da' sempre lo stesso rendimento,\n"
          f"   a rischio fisso come col composto: sommare o moltiplicare gli stessi numeri in ordine\n"
          f"   diverso da' lo stesso risultato. L'ordine decide solo quanto si soffre per strada.\n\n"
          f"2. IL COMPOSTO MOLTIPLICA L'INCERTEZZA. A rischio fisso il ventaglio plausibile va da\n"
          f"   {pc(tf['r5'],0)} a {pc(tf['r95'],0)}: due volte scarse fra il peggio e il meglio. Col composto va da\n"
          f"   {pc(tc['r5'],0)} a {pc(tc['r95'],0)}: quasi VENTI volte. Non e' che la mediana composta sia\n"
          f"   sbagliata — e' inutile come previsione, perche' il suo intorno copre un ordine di\n"
          f"   grandezza. Si pianifica sul rischio fisso. Il composto e' quello che succede, non\n"
          f"   quello che si promette.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 5
def pag_4572(C, TAB, DIST, pdf):
    ins = C['ins']
    fig = pagina('Quel 4572% sotto esame',
                 'il numero non e\' inventato, ma da solo non significa quasi niente')

    ep = un_conto(ins, 1., True)
    vero = 100*(ep[-1]/DEP - 1)
    t = TAB['composto']['blocchi']
    for i, (v, et, col) in enumerate((
            (pc(t['r5'], 0), 'scenario sfortunato (5%)', ROSSO),
            (pc(t['r50'], 0), 'mediana plausibile', INK),
            (pc(vero, 0), 'il backtest vero', VIOLA),
            (pc(t['r95'], 0), 'scenario fortunato (95%)', VERDE))):
        kpi(fig, .058 + i*.2235, .850, .2105, v, et, col, h=.058)

    testo(fig, .058, .800,
          "Il backtest e\' praticamente sulla mediana: non e\' un caso fortunato, e\' il caso tipico DI\n"
          "QUESTE OPERAZIONI. Il problema e\' un altro — guarda quanto e\' largo l\'intorno.", 8.8, INK)

    tit(fig, .748, 'La distribuzione, a peso pieno, con il composto')
    ax = fig.add_axes([.088, .555, .854, .162])
    d = DIST['composto']
    ax.hist(np.clip(d, 0, np.percentile(d, 99)), bins=90, color=VIOLA,
            alpha=.75, edgecolor='none')
    for v, c, n in ((t['r5'], ROSSO, '5%'), (t['r50'], INK, 'mediana'),
                    (vero, VERDE, 'backtest')):
        ax.axvline(v, color=c, lw=1.4, ls='--')
        ax.text(v, ax.get_ylim()[1]*.90, f' {n}', fontsize=7.2, color=c)
    griglia(ax); ax.set_xlabel('rendimento su sette anni (%)', fontsize=7.6)
    ax.set_ylabel('storie simulate', fontsize=7.6); ax.tick_params(labelsize=7.2)

    tit(fig, .498, 'Lo stesso portafoglio, letto a rischio fisso')
    ax = fig.add_axes([.088, .305, .854, .162])
    d2 = DIST['fisso']; tf = TAB['fisso']['blocchi']
    ax.hist(d2, bins=90, color=BLU, alpha=.75, edgecolor='none')
    for v, c, n in ((tf['r5'], ROSSO, '5%'), (tf['r50'], INK, 'mediana'),
                    (100*(un_conto(ins, 1., False)[-1]/DEP - 1), VERDE, 'backtest')):
        ax.axvline(v, color=c, lw=1.4, ls='--')
        ax.text(v, ax.get_ylim()[1]*.90, f' {n}', fontsize=7.2, color=c)
    griglia(ax); ax.set_xlabel('rendimento su sette anni (%)', fontsize=7.6)
    ax.set_ylabel('storie simulate', fontsize=7.6); ax.tick_params(labelsize=7.2)

    testo(fig, .058, .248,
          "Stessa identica strategia, stesse identiche operazioni. Sopra una campana lunghissima con la\n"
          "coda a destra, sotto una campana stretta e simmetrica. E\' la stessa informazione letta con\n"
          "due lenti: il composto e\' una lente che ingrandisce, e ingrandisce anche l\'errore.\n\n"
          "Se l\'edge reale fosse l\'80% di quello misurato, a rischio fisso incassi l\'80% e lo sai in\n"
          "partenza. Col composto, su sette anni, quell\'attrito si eleva alla settima: di quel 4572%\n"
          "resterebbe una frazione, e non sapresti dire quale.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 6
def pag_pratica(C, MCP, DDW, pdf):
    fig = pagina('Cosa fare, in pratica',
                 'la risposta operativa alle due domande: un conto o due, e con quale rischio')

    tit(fig, .878, 'Un conto o due conti?')
    testo(fig, .058, .852,
          "Sui numeri: praticamente pari. A rischio fisso identici, col composto due punti l\'anno a\n"
          "favore del conto unico. Non abbastanza per decidere. Quindi si decide sul resto:", 8.8)

    card(fig, .058, .612, .430, .196)
    card(fig, .512, .612, .430, .196)
    fig.text(.076, .786, 'UN CONTO SOLO', fontsize=9.6, color=VERDE, weight='bold')
    testo(fig, .076, .770,
          "+ una piattaforma, una equity,\n   un drawdown da guardare\n"
          "+ i profitti di una gamba fanno\n   crescere anche l\'altra\n"
          "+ margine condiviso: mai stretto\n"
          "- se sbagli un\'impostazione la\n   sbagli su tutto\n"
          "- il broker e\' un punto solo di\n   rottura", 8.0)
    fig.text(.530, .786, 'DUE CONTI SEPARATI', fontsize=9.6, color=ARANCIO, weight='bold')
    testo(fig, .530, .770,
          "+ un broker giu\' non ferma\n   l\'altra strategia\n"
          "+ vedi subito quale gamba sta\n   funzionando\n"
          "+ puoi spegnerne una senza\n   toccare l\'altra\n"
          "- due depositi, due prelievi,\n   due estratti conto\n"
          "- capitale diviso: ogni gamba\n   compone piu\' piano", 8.0)

    testo(fig, .058, .586,
          "Per adesso, in demo su Fusion: UN CONTO SOLO. Serve proprio a vedere se si pestano i piedi, e\n"
          "su due conti quell\'informazione non la ottieni. Dividere in due ha senso dopo, quando i soldi\n"
          "sono veri e il rischio da coprire non e\' piu\' la strategia ma il broker.", 8.8, INK)

    tit(fig, .512, 'Con quale rischio?')
    xs = [(.070, 'left'), (.500, 'right'), (.700, 'right'), (.930, 'right')]
    card(fig, .058, .352, .884, .134)
    riga_tab(fig, .470, ['impostazione', 'oro', 'nasdaq (base)', 'drawdown atteso'],
             xs, 8.0, INK3, 'bold')
    linea(fig, .460, .070, .930)
    for i, (n, ro, rn, w, c) in enumerate((
            ('prudente, per iniziare', '0,35%', '0,75%', 0.5, VERDE),
            ('quello che c\'e\' nel codice oggi', '0,70%', '1,50%', 1.0, GIALLO),
            ('oltre: non consigliato', '1,00%', '2,00%', 1.43, ROSSO))):
        riga_tab(fig, .440 - i*.028, [n, ro, rn, f"{it(DDW[w],0)}%"], xs, 8.4, c)

    testo(fig, .058, .326,
          "Il \"drawdown atteso\" e\' il 95o percentile del bootstrap a blocchi SENZA composto, non quello\n"
          "del backtest: e\' il numero da guardare per decidere quanto si e\' disposti a soffrire. Col\n"
          "composto quegli stessi drawdown sono piu\' profondi di una decina di punti. Il rischio\n"
          "del nasdaq e\' una BASE: il moltiplicatore adattivo lo porta fra lo 0,5x e il 2,0x, quindi un\n"
          "1,50% puo\' diventare un 3,00% vero nel momento sbagliato. Nella colonna sopra e\' gia\' tenuto\n"
          "in conto, perche\' il bootstrap usa le operazioni vere, che quel moltiplicatore ce l\'hanno\n"
          "gia\' dentro.", 8.8)

    tit(fig, .208, 'Quello che questo report NON dimostra', ROSSO)
    testo(fig, .058, .182,
          "· Le due strategie non sono mai state testate insieme dentro MetaTrader, perche\' il tester\n"
          "  prende un simbolo alla volta. Questa e\' la fusione esatta di due backtest separati: giusta\n"
          "  sui rendimenti e sul drawdown, muta su esecuzioni in contesa e ordini rifiutati.\n"
          "· Il fuori campione dell\'oro (2024.01-2026.09) e\' gia\' stato speso una volta.\n"
          "· Il nasdaq e\' la gamba meno verificata: il test del plateau non e\' ancora stato fatto.\n"
          "  Finche\' non c\'e\', il suo contributo qui va letto come il piu\' ottimistico dei due.\n"
          "· Tutti i numeri vengono da PU Prime. Su Fusion i costi del nasdaq sono equivalenti al netto,\n"
          "  ma per composizione diversa: spread piu\' largo, swap piu\' basso.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== calcoli
def monte_carlo(C):
    """Tabelle per metodo, a peso pieno, piu' le distribuzioni dei blocchi."""
    G = C['G']
    TAB = {'fisso': {}, 'composto': {}}
    DIST = {}
    for composto in (False, True):
        k = 'composto' if composto else 'fisso'
        for m in METODI:
            r = simula(G, m, peso=1.0, composto=composto, n_sim=SIM,
                       per_gamba=True, seed=7)
            tr, td = tabella(r, 'rend'), tabella(r, 'dd_pct')
            TAB[k][m] = {'r5': tr[5], 'r50': tr[50], 'r95': tr[95],
                         'd50': td[50], 'd95': td[95]}
            if m == 'blocchi':
                DIST[k] = r['rend']
    return TAB, DIST


def parita_vera(C):
    """Peso che porta il DRAWDOWN VERO (95o perc. dei blocchi) al bersaglio."""
    G = C['G']
    opzioni = {'solo oro': {'oro': G['oro']},
               'solo nasdaq': {'nas': G['nas']},
               'INSIEME': G}
    out = {'fisso': {}, 'composto': {}}
    for composto in (False, True):
        k = 'composto' if composto else 'fisso'
        for nome, g in opzioni.items():
            pg = len(g) > 1
            lo, hi = 0.05, 5.0
            for _ in range(16):                    # bisezione: cerca il peso
                m = (lo + hi) / 2
                d = tabella(simula(g, 'blocchi', peso=m, composto=composto,
                                   n_sim=1500, per_gamba=pg, seed=7), 'dd_pct')[95]
                if d < DD_OBIETTIVO: lo = m
                else: hi = m
            r = simula(g, 'blocchi', peso=lo, composto=composto,
                       n_sim=SIM, per_gamba=pg, seed=11)
            t = tabella(r, 'rend')
            out[k][nome] = {'peso': lo, 'p5': t[5], 'p50': t[50],
                            'dd95': tabella(r, 'dd_pct')[95]}
    return out


def drawdown_per_peso(C, pesi=(0.5, 1.0, 1.43)):
    """95o percentile del drawdown, bootstrap a blocchi, a rischio fisso."""
    return {w: tabella(simula(C['G'], 'blocchi', peso=w, composto=False,
                              n_sim=SIM, per_gamba=True, seed=7), 'dd_pct')[95]
            for w in pesi}


def main(p_oro, p_nas, out):
    C = carica(p_oro, p_nas)
    print(f"periodo {C['dal']} -> {C['al']}  ({it(C['durata'],2)} anni)")
    print(f"oro {len(C['oro'])} + nasdaq {len(C['nas'])} = {len(C['ins'])} operazioni")

    # controllo che regge tutto il resto: a rischio fisso un conto e due
    # conti DEVONO coincidere. Se non coincidono, il modello e' sbagliato.
    u = un_conto(C['ins'], .5, False)[-1]
    d = due_conti(C['ins'], False)[-1]
    assert abs(u - d) < 1e-6, f"un conto {u} != due conti {d}"
    print(f"verifica: un conto e due conti a rischio fisso coincidono "
          f"({pc(100*(u/DEP-1),4)})")

    print('Monte Carlo...'); TAB, DIST = monte_carlo(C)
    print('ricerca dei pesi a parita\' di drawdown vero...'); MCP = parita_vera(C)
    DDW = drawdown_per_peso(C)
    for w, d in DDW.items(): print(f'  peso x{w}: DD vero (95%) {it(d,1)}%')

    with PdfPages(out) as pdf:
        pag_domanda(C, pdf)
        pag_uno_o_due(C, pdf)
        pag_parita(C, MCP, pdf)
        pag_montecarlo(C, TAB, pdf)
        pag_4572(C, TAB, DIST, pdf)
        pag_pratica(C, MCP, DDW, pdf)
    print('scritto', out)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2],
         sys.argv[3] if len(sys.argv) > 3 else 'report/un-conto-o-due.pdf')
