#!/usr/bin/env python3
"""Portafoglio ORO + NASDAQ su un conto solo, con e senza composto.

Come si combinano due backtest girati separatamente.
Ogni operazione ha un rendimento in frazione del saldo del momento:

    f = netto / saldo_prima

Siccome tutte e due le strategie dimensionano in percentuale del conto,
quel numero si trasferisce identico a un conto condiviso: se un trade ha
reso l'1,2% del suo conto, rende l'1,2% anche del conto comune. Non
serve sapere il rischio per operazione, che sul Nasdaq e' adattivo e dal
report non si ricava.

    composto        eq = eq * (1 + peso * f)
    rischio fisso   eq = eq + peso * f * capitale_iniziale

Il PESO serve perche' due strategie a peso pieno sullo stesso conto
rischiano il doppio di ciascuna da sola. A meta' peso il rischio totale
resta quello di una.

IPOTESI DICHIARATA: che le due possano stare sullo stesso conto senza
bloccarsi. Con il NAS100 v2.57 originale NON e' vero (blocca su
qualunque posizione aperta); serve la versione MULTI con
BlockOnAnyAccountPosition = false.
"""
import sys, math, statistics as st
from collections import defaultdict
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Rectangle
sys.path.insert(0, 'tools')
from dati_validazione import leggi
from report_validazione import (INK, INK2, INK3, BLU, ARANCIO, VERDE, ROSSO,
                                GIALLO, GRIGLIA, VIOLA, it, pc, card, kpi,
                                griglia, riga_tab, linea, testo)
DEP = 10000.0
CO, CN, CI = GIALLO, BLU, VERDE      # oro, nasdaq, insieme
PAG = [0]

def pagina(tit, sot, sez=''):
    PAG[0] += 1
    fig = plt.figure(figsize=(8.27, 11.69))
    fig.text(.062, .960, tit, fontsize=19, color=INK, weight='bold')
    fig.text(.062, .938, sot, fontsize=8.5, color=INK2)
    fig.text(.938, .962, sez, fontsize=8.4, color=INK3, ha='right', weight='bold')
    fig.text(.938, .945, f'PORTAFOGLIO · pag. {PAG[0]} di 5', fontsize=7.4, color=INK3, ha='right')
    fig.add_artist(Rectangle((.062, .928), .876, .0015, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))
    return fig

def tit(fig, y, s, c=None):
    fig.text(.062, y, s, fontsize=11.5, color=c or INK, weight='bold')

# ----------------------------------------------------------------------
def frazione(o):
    p = o.saldo - o.netto
    return o.netto/p if p > 0 else 0.0

def curva(seq, peso, composto):
    eq = [DEP]
    for x in seq:
        eq.append(eq[-1]*(1 + peso*x) if composto else eq[-1] + peso*x*DEP)
    return np.array(eq)

def dd_max(v):
    pk = np.maximum.accumulate(v); return 100*float(((pk - v)/pk).max())

def dd_serie(v):
    pk = np.maximum.accumulate(v); return -100*(pk - v)/pk

def carica(p_oro, p_nas):
    oro, _, _ = leggi(p_oro, rischio_test=0.01)
    nas, _, _ = leggi(p_nas, rischio_test=0.015)
    dal = max(oro[0].chiusura[:10], nas[0].chiusura[:10])
    al  = min(oro[-1].chiusura[:10], nas[-1].chiusura[:10])
    oro = [o for o in oro if dal <= o.chiusura[:10] <= al]
    nas = [o for o in nas if dal <= o.chiusura[:10] <= al]
    ins = sorted([(o.chiusura, frazione(o), 'oro') for o in oro] +
                 [(o.chiusura, frazione(o), 'nas') for o in nas])
    anni = sorted({d[:4] for d, _, _ in ins})
    d0, d1 = ins[0][0], ins[-1][0]
    durata = (int(d1[:4]) + int(d1[5:7])/12) - (int(d0[:4]) + int(d0[5:7])/12)
    # serie prezzi per il compra-e-tieni (mediana giornaliera)
    def prezzi(ops):
        g = defaultdict(list)
        for o in ops:
            if o.prezzo_in > 0:  g[o.apertura[:10]].append(o.prezzo_in)
            if o.prezzo_out > 0: g[o.chiusura[:10]].append(o.prezzo_out)
        gg = sorted(g); return gg, [st.median(g[k]) for k in gg]
    return {'oro': oro, 'nas': nas, 'ins': ins, 'anni': anni, 'dal': dal, 'al': al,
            'durata': durata, 'pz_oro': prezzi(oro), 'pz_nas': prezzi(nas)}

def passivo(C):
    """50/50 oro+nasdaq ribilanciato, sulle date comuni."""
    (go, gv), (no, nv) = C['pz_oro'], C['pz_nas']
    gi = dict(zip(go, gv)); ni = dict(zip(no, nv))
    com = sorted(set(go) & set(no))
    v = [1.0]
    for i in range(1, len(com)):
        rg = gi[com[i]]/gi[com[i-1]] - 1
        rn = ni[com[i]]/ni[com[i-1]] - 1
        v.append(v[-1]*(1 + .5*rg + .5*rn))
    return com, np.array(v)*DEP

def per_anno(C, peso, composto):
    """Rendimento di ogni anno, per gamba e per l'insieme."""
    out = {}
    for et, sel in (('oro', [(d, x) for d, x, k in C['ins'] if k == 'oro']),
                    ('nas', [(d, x) for d, x, k in C['ins'] if k == 'nas']),
                    ('ins', [(d, x) for d, x, _ in C['ins']])):
        eq = DEP; r = {}
        for a in C['anni']:
            i0 = eq
            for d, x in sel:
                if d[:4] == a: eq = eq*(1 + peso*x) if composto else eq + peso*x*DEP
            r[a] = 100*(eq/i0 - 1) if composto else 100*(eq - i0)/DEP
        out[et] = r
    return out

def anni_x(ax, date):
    vis = {}
    for i, d in enumerate(date): vis.setdefault(d[:4], i)
    for a, i in vis.items():
        if a != min(vis): ax.axvline(i, color=GRIGLIA, lw=.9, zorder=0)
    return vis

# ======================================================================
#  1 — SINTESI
# ======================================================================
def p1(pdf, C):
    fig = pagina('Oro + Nasdaq su un conto solo',
                 f"{C['dal']} → {C['al']} · {len(C['oro'])} operazioni sull'oro, "
                 f"{len(C['nas'])} sul Nasdaq", 'SINTESI')
    testo(fig, .062, .905,
          "Le due strategie sullo stesso conto, in ordine di tempo. A PESO PIENO ognuna rischia\n"
          "quanto rischierebbe da sola, quindi il rischio totale raddoppia. A META' PESO il rischio\n"
          "complessivo resta quello di una sola strategia — ed e' li' che si vede cosa aggiunge il\n"
          "metterle insieme.")
    s_oro = [x for _, x, k in C['ins'] if k == 'oro']
    s_nas = [x for _, x, k in C['ins'] if k == 'nas']
    s_ins = [x for _, x, _ in C['ins']]
    y = .760
    for comp, et in ((False, 'SENZA COMPOSTO — ogni operazione pesa sempre uguale'),
                     (True,  'CON INTERESSE COMPOSTO — le posizioni crescono col conto')):
        fig.text(.062, y + .052, et, fontsize=10, color=INK, weight='bold')
        for k, (nome, s, w, col) in enumerate((
                ('solo ORO', s_oro, 1.0, CO), ('solo NASDAQ', s_nas, 1.0, CN),
                ('INSIEME, meta\' peso', s_ins, 0.5, CI),
                ('INSIEME, peso pieno', s_ins, 1.0, VIOLA))):
            e = curva(s, w, comp); d = dd_max(e)
            x = .062 + k*.222
            card(fig, x, y - .012, .206, .060)
            fig.text(x + .103, y + .030, nome, fontsize=7.4, color=col, ha='center', weight='bold')
            fig.text(x + .103, y + .010, pc(100*(e[-1]/DEP - 1), 0), fontsize=15,
                     color=VERDE, ha='center', weight='bold')
            fig.text(x + .103, y - .004, f"drawdown {it(d,1)}%", fontsize=7.2,
                     color=INK2, ha='center')
        y -= .108
    linea(fig, .602, .062, .938)

    tit(fig, .578, 'Che cosa aggiunge il metterle insieme')
    e_o = curva(s_oro, .5, False); e_n = curva(s_nas, .5, False); e_i = curva(s_ins, .5, False)
    somma_dd = dd_max(e_o) + dd_max(e_n)
    y = .540
    xs = [(.062,'left'), (.52,'right'), (.75,'right'), (.938,'right')]
    riga_tab(fig, y, ['a meta\' peso, senza composto', 'rendimento', 'drawdown', 'rend/DD'],
             xs, 8.0, INK3, 'bold')
    linea(fig, y - .009, .062, .938); y -= .026
    for nome, e, col in (('solo oro', e_o, CO), ('solo nasdaq', e_n, CN),
                         ('le due insieme', e_i, CI)):
        r = 100*(e[-1]/DEP - 1); d = dd_max(e)
        riga_tab(fig, y, [None, pc(r), it(d,1)+'%', it(r/d,1)], xs, 8.6, INK)
        fig.text(.062, y, nome, fontsize=8.6, color=col, weight='bold')
        y -= .0225
    y -= .012
    testo(fig, .062, y,
          f"I rendimenti si sommano esatti: {pc(100*(e_o[-1]/DEP-1),1)} + "
          f"{pc(100*(e_n[-1]/DEP-1),1)} = {pc(100*(e_i[-1]/DEP-1),1)}. Senza composto e' aritmetica.\n"
          f"I drawdown NO: {it(dd_max(e_o),1)}% + {it(dd_max(e_n),1)}% farebbero {it(somma_dd,1)}%, "
          f"invece l'insieme fa {it(dd_max(e_i),1)}%.\n"
          f"Quei {it(somma_dd - dd_max(e_i),1)} punti di drawdown risparmiati sono tutto il guadagno "
          "del mettere insieme due\nstrategie che non si muovono insieme.", 8.4)

    # correlazione
    mo, mn = defaultdict(float), defaultdict(float)
    for d, x, k in C['ins']:
        (mo if k == 'oro' else mn)[d[:7]] += x
    km = sorted(set(mo) | set(mn))
    a = [mo.get(i, 0) for i in km]; b = [mn.get(i, 0) for i in km]
    sa, sb = st.pstdev(a), st.pstdev(b); ma, mb = st.mean(a), st.mean(b)
    r = sum((p-ma)*(q-mb) for p, q in zip(a, b))/(len(km)*sa*sb)
    card(fig, .062, .125, .876, .168, CI)
    fig.text(.082, .262, f"Correlazione mensile fra le due: {it(r,2)}", fontsize=13,
             color=CI, weight='bold')
    testo(fig, .082, .238,
          f"Su {len(km)} mesi. Vicina a zero vuol dire che vanno bene e male in momenti diversi:\n"
          "quando una perde, l'altra spesso non sta perdendo. Non e' una scelta furba nostra, e' il\n"
          "fatto che una lavora sull'oro in giorni e settimane e l'altra sul Nasdaq in poche ore.\n\n"
          "E' l'unico motivo per cui il drawdown dell'insieme e' piu' basso della somma. Se le due\n"
          "fossero correlate a 1, mettere insieme non servirebbe a niente: raddoppierebbe tutto,\n"
          "guadagno e sofferenza.", 8.4)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  2 / 3 — LE CURVE
# ======================================================================
def p_curve(pdf, C, composto):
    et = 'CON interesse composto' if composto else 'SENZA composto (rischio fisso)'
    fig = pagina(f"Le curve — {et}",
                 'peso pieno e meta\' peso, con il rendimento di ogni anno scritto sopra',
                 'CURVE')
    date = [d for d, _, _ in C['ins']]
    s_oro = [x for _, x, k in C['ins'] if k == 'oro']
    s_nas = [x for _, x, k in C['ins'] if k == 'nas']
    s_ins = [x for _, x, _ in C['ins']]
    ann = per_anno(C, 1.0 if composto else 1.0, composto)

    ax = fig.add_axes([.095, .600, .845, .255])
    for nome, s, col, w in (('solo oro', s_oro, CO, 1.0), ('solo Nasdaq', s_nas, CN, 1.0),
                            ('insieme, peso pieno', s_ins, VIOLA, 1.0),
                            ("insieme, meta' peso", s_ins, CI, 0.5)):
        # ogni serie ha il suo asse dei tempi: le gambe singole sono piu' corte
        dd_ = date if len(s) == len(date) else [d for d, _, k in C['ins']
                                                if k == ('oro' if nome.endswith('oro') else 'nas')]
        e = curva(s, w, composto)
        xs_ = np.linspace(0, len(date), len(e))
        ax.plot(xs_, 100*(e/DEP - 1), color=col, lw=2.0 if 'insieme' in nome else 1.5,
                label=f"{nome}  {pc(100*(e[-1]/DEP-1),0)}",
                alpha=1.0 if 'insieme' in nome else .75)
    if composto:
        com, pv = passivo(C)
        idx = np.linspace(0, len(date), len(pv))
        ax.plot(idx, 100*(pv/DEP - 1), color=INK3, lw=1.6, ls='--',
                label=f"compra e tieni 50/50  {pc(100*(pv[-1]/DEP-1),0)}")
    ax.axhline(0, color=INK3, lw=.9)
    vis = anni_x(ax, date)
    ax.set_xticks(list(vis.values())); ax.set_xticklabels(list(vis), fontsize=8.6)
    griglia(ax); ax.legend(frameon=False, fontsize=8.2, labelcolor=INK2, loc='upper left')
    ax.set_ylabel('rendimento cumulato %', fontsize=8)
    if composto: ax.set_yscale('symlog', linthresh=100)

    # etichette annue dell'insieme a meta' peso
    ai = per_anno(C, 0.5, composto)['ins']
    y = .560
    tit(fig, y, "Rendimento di ogni anno — insieme, meta' peso"); y -= .030
    xs = [(.062,'left')] + [(.175 + k*.098, 'right') for k in range(8)]
    riga_tab(fig, y, [''] + C['anni'], xs, 8.2, INK3, 'bold')
    linea(fig, y - .009, .062, .938); y -= .026
    for nome, dati, col in (('oro', per_anno(C, .5, composto)['oro'], CO),
                            ('Nasdaq', per_anno(C, .5, composto)['nas'], CN),
                            ('insieme', ai, CI)):
        riga_tab(fig, y, [None] + [None]*len(C['anni']), xs, 8.4, INK)
        fig.text(.062, y, nome, fontsize=8.6, color=col, weight='bold')
        for k, a in enumerate(C['anni']):
            v = dati.get(a, 0.0)
            fig.text(xs[k+1][0], y, pc(v, 0), fontsize=8.4, ha='right',
                     color=VERDE if v > 0 else ROSSO, weight='bold')
        y -= .024
    y -= .014
    testo(fig, .062, y,
          ("Col composto ogni anno e' misurato sul saldo con cui quell'anno e' cominciato."
           if composto else
           "Senza composto ogni anno e' in punti percentuali del capitale iniziale, quindi\n"
           "gli anni si possono sommare fra loro e confrontare direttamente."), 8.0, INK3)

    # drawdown
    y -= .050
    ax = fig.add_axes([.095, y - .175, .845, .160])
    for nome, s, col, w in (('insieme, peso pieno', s_ins, VIOLA, 1.0),
                            ("insieme, meta' peso", s_ins, CI, 0.5)):
        e = curva(s, w, composto)
        ax.plot(np.linspace(0, len(date), len(e)), dd_serie(e), color=col, lw=1.4,
                label=f"{nome}  max {it(dd_max(e),1)}%")
    ax.set_xticks(list(vis.values())); ax.set_xticklabels(list(vis), fontsize=8.4)
    griglia(ax); ax.legend(frameon=False, fontsize=8.2, labelcolor=INK2, loc='lower left')
    ax.set_ylabel('sotto il massimo, %', fontsize=8)
    ax.set_title('Drawdown', fontsize=9, color=INK2, loc='left', pad=6)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  4 — ANNO PER ANNO
# ======================================================================
def p_annuale(pdf, C):
    fig = pagina('Anno per anno', "le due gambe, l'insieme, e il compra-e-tieni 50/50",
                 'CONSISTENZA')
    ff = per_anno(C, 0.5, False); cc = per_anno(C, 0.5, True)
    com, pv = passivo(C)
    pass_ann = {}
    for a in C['anni']:
        d = [i for i, k in enumerate(com) if k[:4] == a]
        if not d: continue
        i0 = max(0, d[0]-1)
        pass_ann[a] = 100*(pv[d[-1]]/pv[i0] - 1)

    y = .890
    tit(fig, y, "A META' PESO, senza composto (punti % del capitale iniziale)"); y -= .030
    xs = [(.062,'left'), (.30,'right'), (.47,'right'), (.66,'right'), (.855,'right')]
    riga_tab(fig, y, ['anno', 'oro', 'Nasdaq', 'insieme', 'compra-tieni'], xs, 8.0, INK3, 'bold')
    linea(fig, y - .009, .062, .938); y -= .026
    for a in C['anni']:
        riga_tab(fig, y, [a, None, None, None, None], xs, 8.6, INK)
        for k, (v, col) in enumerate(((ff['oro'][a], CO), (ff['nas'][a], CN),
                                      (ff['ins'][a], CI), (pass_ann.get(a, 0), INK3))):
            fig.text(xs[k+1][0], y, pc(v), fontsize=8.6, ha='right',
                     color=(VERDE if v > 0 else ROSSO) if k < 3 else INK3, weight='bold')
        y -= .0215
    linea(fig, y + .012, .062, .938); y -= .014
    e = curva([x for _, x, _ in C['ins']], .5, False)
    riga_tab(fig, y, ['TOTALE',
                      pc(sum(ff['oro'].values())), pc(sum(ff['nas'].values())),
                      pc(100*(e[-1]/DEP-1)), pc(100*(pv[-1]/DEP-1))], xs, 8.8, INK, 'bold')

    y -= .050
    tit(fig, y, "A META' PESO, con interesse composto (% del saldo di inizio anno)"); y -= .030
    riga_tab(fig, y, ['anno', 'oro', 'Nasdaq', 'insieme', 'compra-tieni'], xs, 8.0, INK3, 'bold')
    linea(fig, y - .009, .062, .938); y -= .026
    for a in C['anni']:
        riga_tab(fig, y, [a, None, None, None, None], xs, 8.6, INK)
        for k, (v, col) in enumerate(((cc['oro'][a], CO), (cc['nas'][a], CN),
                                      (cc['ins'][a], CI), (pass_ann.get(a, 0), INK3))):
            fig.text(xs[k+1][0], y, pc(v), fontsize=8.6, ha='right',
                     color=(VERDE if v > 0 else ROSSO) if k < 3 else INK3, weight='bold')
        y -= .0215
    linea(fig, y + .012, .062, .938); y -= .014
    ec = curva([x for _, x, _ in C['ins']], .5, True)
    riga_tab(fig, y, ['TOTALE', pc(100*(curva([x for _,x,k in C['ins'] if k=='oro'],.5,True)[-1]/DEP-1),0),
                      pc(100*(curva([x for _,x,k in C['ins'] if k=='nas'],.5,True)[-1]/DEP-1),0),
                      pc(100*(ec[-1]/DEP-1),0), pc(100*(pv[-1]/DEP-1),0)], xs, 8.8, INK, 'bold')

    y -= .054
    vinti = sum(1 for a in C['anni'] if ff['ins'][a] > pass_ann.get(a, 0))
    neg = [a for a in C['anni'] if ff['ins'][a] < 0]
    card(fig, .062, y - .130, .876, .122, CI)
    fig.text(.082, y - .028, f"L'insieme batte il compra-e-tieni in {vinti} anni su {len(C['anni'])}",
             fontsize=12, color=INK, weight='bold')
    testo(fig, .082, y - .050,
          (f"Anni in perdita dell'insieme: {len(neg)} su {len(C['anni'])}"
           + (f" ({', '.join(neg)})" if neg else "") + ".\n"
           "2019 e 2026 sono anni parziali: il periodo comune parte a settembre 2019 e finisce a\n"
           "settembre 2026.\n\n"
           "La riga del compra-e-tieni e' la stessa in tutte e due le tabelle: un investimento\n"
           "passivo non ha ne' peso ne' rischio per operazione, quindi non cambia fra le due\n"
           "letture. E' il metro fisso contro cui si confrontano entrambe."), 8.4)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  5 — RISCHIO E LIMITI
# ======================================================================
def p_rischio(pdf, C):
    fig = pagina('Rischio e limiti',
                 'i numeri, e le condizioni sotto cui valgono', 'LIMITI')
    s_ins = [x for _, x, _ in C['ins']]
    s_oro = [x for _, x, k in C['ins'] if k == 'oro']
    s_nas = [x for _, x, k in C['ins'] if k == 'nas']
    y = .890
    xs = [(.062,'left'), (.40,'right'), (.56,'right'), (.73,'right'), (.905,'right')]
    riga_tab(fig, y, ['', 'oro', 'Nasdaq', "insieme\nmeta' peso", 'insieme\npeso pieno'],
             xs, 7.6, INK3, 'bold')
    linea(fig, y - .016, .062, .938); y -= .034
    def riga(et, f):
        vals = [f(s_oro, 1.0), f(s_nas, 1.0), f(s_ins, 0.5), f(s_ins, 1.0)]
        riga_tab(fig, y, [et] + vals, xs, 8.6, INK)
    for comp, lab in ((False, 'SENZA COMPOSTO'), (True, 'CON COMPOSTO')):
        fig.text(.062, y, lab, fontsize=7.6, color=GIALLO, weight='bold'); y -= .022
        for et, fn in (
            ('Rendimento totale', lambda s, w: pc(100*(curva(s, w, comp)[-1]/DEP - 1), 0)),
            ('Drawdown massimo', lambda s, w: it(dd_max(curva(s, w, comp)), 1)+'%'),
            ('Rendimento / drawdown', lambda s, w: it(100*(curva(s, w, comp)[-1]/DEP - 1)/dd_max(curva(s, w, comp)), 1)),
            ('Media annua', lambda s, w: pc(100*(curva(s, w, comp)[-1]/DEP - 1)/C['durata'], 1)
                            if not comp else pc(100*((curva(s, w, comp)[-1]/DEP)**(1/C['durata']) - 1), 1)),
        ):
            riga(et, fn); y -= .0215
        y -= .012
    y -= .006
    testo(fig, .062, y,
          "Col composto la «media annua» e' il CAGR; senza composto e' il totale diviso gli anni,\n"
          "perche' li' il capitale non si reinveste e i rendimenti si sommano invece di comporsi.",
          7.9, INK3)

    y -= .064
    tit(fig, y, 'Le condizioni sotto cui questi numeri valgono'); y -= .030
    testo(fig, .062, y,
          "1.  SERVE LA VERSIONE MULTI DEL NASDAQ. Il v2.57 originale non apre se sul conto c'e'\n"
          "     QUALUNQUE posizione, di qualunque simbolo. Siccome l'oro sta a mercato il 64% del\n"
          "     tempo, il 65% degli ingressi del Nasdaq verrebbe saltato e il suo risultato\n"
          "     scenderebbe da +358,8% a +90,1%. Con v2.57_MULTI e BlockOnAnyAccountPosition=false\n"
          "     il problema non c'e'. Questa simulazione assume la versione MULTI.\n\n"
          "2.  E' L'UNIONE DI DUE BACKTEST GIRATI SEPARATAMENTE. Ogni operazione porta con se' il\n"
          "     suo rendimento in frazione del conto, che si trasferisce esatto a un conto\n"
          "     condiviso perche' tutte e due dimensionano in percentuale. Quello che NON e'\n"
          "     simulato e' l'interazione vera: margine occupato insieme, esecuzioni in contesa,\n"
          "     un ordine rifiutato perche' l'altro EA stava operando.\n\n"
          "3.  IL MARGINE REGGE, ed e' misurato: tre posizioni aperte insieme capitano nel 4,8% del\n"
          "     tempo, e nel caso peggiore in assoluto occupano il 49% di un conto da 10.000.\n"
          "     Tipicamente il 10%. Non e' il margine a limitare questo portafoglio.\n\n"
          "4.  STESSI ANNI, STESSO MONDO. Due strategie su due mercati diversi riducono il rischio\n"
          "     di aver misurato la fortuna di un solo mercato, ma sono sempre gli stessi sette\n"
          "     anni: se il futuro e' diverso da questi, nessuno dei due numeri lo sa.\n\n"
          "5.  LA SCORRELAZIONE E' MISURATA IN TEMPI NORMALI. Nelle crisi le correlazioni tendono a\n"
          "     convergere, e il beneficio del mettere insieme si riduce proprio quando servirebbe.\n\n"
          "6.  NESSUNA ESECUZIONE REALE. Slittamento, rifiuti, latenza e allargamenti di spread non\n"
          "     esistono nel tester, e tirano tutti verso il basso.")
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
def main(p_oro, p_nas, out):
    C = carica(p_oro, p_nas)
    print(f"periodo comune {C['dal']} -> {C['al']}  ({C['durata']:.2f} anni)")
    print(f"operazioni: oro {len(C['oro'])}  nasdaq {len(C['nas'])}  totale {len(C['ins'])}")
    # riconciliazione: senza composto i rendimenti devono sommarsi esatti
    so = curva([x for _, x, k in C['ins'] if k == 'oro'], 1.0, False)[-1]/DEP - 1
    sn = curva([x for _, x, k in C['ins'] if k == 'nas'], 1.0, False)[-1]/DEP - 1
    si = curva([x for _, x, _ in C['ins']], 1.0, False)[-1]/DEP - 1
    assert abs((so + sn) - si) < 1e-9, 'i rendimenti a rischio fisso non si sommano'
    print(f"[check] rischio fisso additivo: {100*so:.1f}% + {100*sn:.1f}% = {100*si:.1f}%  OK")
    with PdfPages(out) as pdf:
        p1(pdf, C); p_curve(pdf, C, True); p_curve(pdf, C, False)
        p_annuale(pdf, C); p_rischio(pdf, C)
    print(f"scritto {out}  ({PAG[0]} pagine)")

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('oro'); ap.add_argument('nasdaq')
    ap.add_argument('-o', '--out', default='report/portafoglio-oro-nasdaq.pdf')
    x = ap.parse_args()
    main(x.oro, x.nasdaq, x.out)
