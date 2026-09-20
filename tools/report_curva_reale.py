#!/usr/bin/env python3
"""LA CURVA VERA delle operazioni, ai rischi scelti, con interesse composto.

Non e' una simulazione: e' la sequenza storica delle 2.520 operazioni
dei due backtest PU Prime (tick reali, qualita' oltre il 90%), messe in
ordine di tempo su un conto solo e riscalate ai rischi decisi —
ORO 0,65% e NASDAQ 0,98%.

Il riscalamento e' esatto, non approssimato: il lotto e' proporzionale
alla percentuale di rischio, quindi il risultato di ogni operazione in
frazione di conto si moltiplica per (rischio nuovo / rischio del test).

    f = netto / saldo_prima        misurato nel backtest
    f' = f x (rischio nuovo / rischio del test)
    equity = 10.000 x prodotto(1 + f')

E' UNA STORIA SOLA. Il Monte Carlo dice che a questi rischi il drawdown
al 95o percentile e' il 28,1%; questa storia ne ha pescato uno del
21,3%. Non e' il caso tipico: e' il caso che e' capitato.

Uso:  python3 tools/report_curva_reale.py <oro.html> <nasdaq.html> [uscita.pdf]
"""
import sys, os
import numpy as np
from collections import defaultdict
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Rectangle
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dati_validazione import leggi
from report_validazione import (INK, INK2, INK3, BLU, ARANCIO, VERDE, ROSSO,
                                GIALLO, GRIGLIA, VIOLA, it, pc, card, kpi,
                                griglia, riga_tab, linea, testo)

DEP   = 10000.0
R_ORO, R_NAS = 1.00, 1.50      # rischio dei backtest
N_ORO, N_NAS = 0.65, 0.98      # rischio scelto
CO, CN, CI = GIALLO, BLU, VERDE
DD_MC_95 = 28.1                # il drawdown atteso dal Monte Carlo
NPAG = 5
PAG  = [0]
MESI = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic']


def pagina(titolo, sottotitolo):
    PAG[0] += 1
    fig = plt.figure(figsize=(8.27, 11.69))
    fig.text(.058, .958, titolo, fontsize=19, color=INK, weight='bold')
    fig.text(.058, .937, sottotitolo, fontsize=8.5, color=INK2)
    fig.text(.942, .960, 'LA CURVA VERA', fontsize=8.6, color=INK3,
             ha='right', weight='bold')
    fig.text(.942, .943, f'oro {it(N_ORO,2)}% · nasdaq {it(N_NAS,2)}% · pag. {PAG[0]} di {NPAG}',
             fontsize=7.6, color=INK3, ha='right')
    fig.add_artist(Rectangle((.058, .928), .884, .0015, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))
    return fig


def tit(fig, y, s, c=None):
    fig.text(.058, y, s, fontsize=11.5, color=c or INK, weight='bold')


# ------------------------------------------------------------- dati
def carica(p_oro, p_nas):
    oro, _, _ = leggi(p_oro, rischio_test=R_ORO/100)
    nas, _, _ = leggi(p_nas, rischio_test=R_NAS/100)
    dal = max(oro[0].chiusura[:10], nas[0].chiusura[:10])
    al  = min(oro[-1].chiusura[:10], nas[-1].chiusura[:10])

    def f(o, scala):
        p = o.saldo - o.netto
        return (o.netto / p * scala) if p > 0 else 0.0

    op = sorted([(o.chiusura, f(o, N_ORO/R_ORO), 'oro') for o in oro
                 if dal <= o.chiusura[:10] <= al] +
                [(o.chiusura, f(o, N_NAS/R_NAS), 'nas') for o in nas
                 if dal <= o.chiusura[:10] <= al])

    eq = [DEP]
    for _, x, _ in op: eq.append(eq[-1]*(1 + x))
    eq = np.array(eq)
    date = [op[0][0][:10]] + [d[:10] for d, _, _ in op]
    dur = ((int(al[:4]) + int(al[5:7])/12 + int(al[8:10])/365)
           - (int(dal[:4]) + int(dal[5:7])/12 + int(dal[8:10])/365))
    return {'op': op, 'eq': eq, 'date': date, 'dal': dal, 'al': al,
            'durata': dur, 'anni': sorted({d[:4] for d, _, _ in op})}


def dd_serie(v):
    pk = np.maximum.accumulate(v)
    return 100*(pk - v)/pk, pk


def episodi(C, quanti=5):
    """I drawdown piu' profondi: dove sono cominciati, dove hanno toccato
    il fondo, e se e quando il conto e' tornato sopra il picco."""
    eq, dt = C['eq'], C['date']
    d, pk = dd_serie(eq)
    ep, i, n = [], 0, len(eq)
    while i < n:
        if d[i] <= 1e-9: i += 1; continue
        j = i
        while j < n and d[j] > 1e-9: j += 1      # fine dell'episodio
        k = i + int(np.argmax(d[i:j]))           # il fondo
        ep.append({'da': dt[i-1] if i > 0 else dt[0], 'fondo': dt[k],
                   'fine': dt[j-1] if j < n else None,
                   'prof': float(d[k]), 'op': j - i,
                   'recuperato': j < n})
        i = j
    ep.sort(key=lambda e: -e['prof'])
    sotto = float((d > 1e-9).mean())
    return ep[:quanti], sotto


def per_mese(C):
    m = defaultdict(list)
    for dd_, x, _ in C['op']: m[dd_[:7]].append(x)
    ks = sorted(m)
    r = {}
    for k in ks:
        p = 1.0
        for x in m[k]: p *= (1 + x)
        r[k] = 100*(p - 1)
    return r


def per_anno(C, chi=None):
    r = {}
    for a in C['anni']:
        p, n = 1.0, 0
        for d, x, k in C['op']:
            if d[:4] != a: continue
            if chi and k != chi: continue
            p *= (1 + x); n += 1
        r[a] = (100*(p - 1), n)
    return r


def gamba(C, chi):
    eq = [DEP]
    for _, x, k in C['op']:
        eq.append(eq[-1]*(1 + x) if k == chi else eq[-1])
    return np.array(eq)


def anni_su(ax, date, eq):
    """Separatori verticali a ogni cambio d'anno, con l'etichetta."""
    visti = {}
    for i, d in enumerate(date):
        a = d[:4]
        if a not in visti: visti[a] = i
    lo, hi = ax.get_ylim()
    for a, i in visti.items():
        if i == 0: continue
        ax.axvline(i, color=GRIGLIA, lw=.8, zorder=0)
    # dentro il riquadro, non sotto: su un grafico di drawdown il fondo
    # e' negativo e le etichette finivano sopra i numeri dell'asse
    y = lo + (hi - lo)*0.03
    for a, i in visti.items():
        ax.text(i + 12, y, a, fontsize=7.0, color=INK3)
    return visti


# =============================================================== pag. 1
def pag_curva(C, pdf):
    eq, date = C['eq'], C['date']
    d, _ = dd_serie(eq)
    mesi = per_mese(C); rm = np.array(list(mesi.values()))
    tot = 100*(eq[-1]/DEP - 1)
    cg = 100*((eq[-1]/DEP)**(1/C['durata']) - 1)

    fig = pagina('La curva vera',
                 f"le {it(len(C['op']))} operazioni dei due backtest PU Prime in ordine di tempo, su un conto solo")

    for i, (v, et, col) in enumerate((
            (pc(tot, 0), 'rendimento totale', VERDE),
            (pc(cg, 1), "all'anno (composto)", VERDE),
            (f"-{it(d.max(),1)}%", 'drawdown massimo', ROSSO),
            (it(rm.mean()/rm.std()*np.sqrt(12), 2), 'rendimento / rischio', INK))):
        kpi(fig, .058 + i*.2235, .850, .2105, v, et, col, h=.058)

    testo(fig, .058, .800,
          f"Da 10.000 a {it(eq[-1],0)} euro in {it(C['durata'],2)} anni. Non e' una simulazione: e' la sequenza storica\n"
          f"delle operazioni, riscalata ai rischi scelti. Il riscalamento e' esatto, perche' il lotto e'\n"
          f"proporzionale alla percentuale di rischio.", 8.8, INK)

    tit(fig, .726, 'Il capitale, operazione per operazione')
    ax = fig.add_axes([.098, .448, .844, .258])
    ax.plot(np.arange(len(eq)), eq, color=CI, lw=1.6)
    ax.set_yscale('log'); ax.set_ylim(eq.min()*.82, eq.max()*1.9)
    griglia(ax)
    anni_su(ax, date, eq)
    pa = per_anno(C)
    visti = {}
    for i, dd_ in enumerate(date):
        if dd_[:4] not in visti: visti[dd_[:4]] = i
    ks = list(visti)
    for n, a in enumerate(ks):
        i0 = visti[a]
        i1 = visti[ks[n+1]] - 1 if n+1 < len(ks) else len(eq)-1
        ax.text((i0+i1)/2, eq.max()*1.35, pc(pa[a][0], 0), fontsize=7.6,
                color=(VERDE if pa[a][0] >= 0 else ROSSO), ha='center', weight='bold')
    ax.set_xlabel('operazioni in ordine di tempo', fontsize=7.8)
    ax.set_ylabel('capitale in euro (scala logaritmica)', fontsize=7.8)
    ax.tick_params(labelsize=7.2)
    fig.text(.930, .720, 'il rendimento di ogni anno e\' scritto sopra',
             fontsize=7.4, color=INK3, ha='right')

    tit(fig, .412, 'Quanto e\' stata sott\'acqua')
    ax = fig.add_axes([.098, .206, .844, .182])
    ax.fill_between(np.arange(len(eq)), -d, 0, color=ROSSO, alpha=.32)
    ax.plot(np.arange(len(eq)), -d, color=ROSSO, lw=.9)
    ax.axhline(-d.max(), color=ROSSO, lw=1.0, ls='--')
    ax.text(len(eq)*.01, -d.max() - 1.1, f'  il peggiore: -{it(d.max(),2)}%',
            fontsize=7.6, color=ROSSO)
    ax.axhline(-DD_MC_95, color=VIOLA, lw=1.2, ls=':')
    ax.text(len(eq)*.01, -DD_MC_95 + .8,
            f'  quello atteso dal Monte Carlo (95%): -{it(DD_MC_95,1)}%',
            fontsize=7.6, color=VIOLA)
    ax.set_ylim(-DD_MC_95*1.25, 1.5)
    griglia(ax); ax.set_ylabel('sotto il massimo (%)', fontsize=7.8)
    ax.set_xlabel('operazioni in ordine di tempo', fontsize=7.8)
    ax.tick_params(labelsize=7.2)

    testo(fig, .058, .170,
          f"E' UNA STORIA SOLA, e va letta sapendolo. Il Monte Carlo dice che a questi rischi, su sette\n"
          f"anni, il drawdown supera il {it(DD_MC_95,1)}% in una storia su venti: questa ne ha pescato uno del\n"
          f"{it(d.max(),1)}%, cioe' ha avuto le perdite distribuite bene. Lo stesso vale per il rendimento: il\n"
          f"{pc(tot,0)} coincide quasi esattamente con la mediana simulata sul periodo intero ({pc(1222,0)}),\n"
          f"ma quella mediana contiene il boom del 2024-2026. Sul periodo magro la mediana era {pc(576,0)}.\n\n"
          f"Detto altrimenti: questa curva e' un risultato plausibile e non fortunato nel rendimento, ma\n"
          f"e' stata fortunata nel percorso. Il drawdown da mettere a bilancio resta il {it(DD_MC_95,1)}%.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 2
def pag_drawdown(C, pdf):
    eq = C['eq']
    d, _ = dd_serie(eq)
    ep, sotto = episodi(C)
    fig = pagina('I drawdown, uno per uno',
                 'dove il conto e\' sceso, di quanto, e quanto ci ha messo a tornare sopra')

    for i, (v, et, col) in enumerate((
            (f"-{it(d.max(),2)}%", 'il peggiore', ROSSO),
            (f"{it(100*sotto,0)}%", 'del tempo sotto il massimo', ARANCIO),
            (it(ep[0]['op']), 'operazioni nel peggiore', INK),
            (it(sum(1 for e in ep if e['prof'] > 10)), 'episodi oltre il 10%', INK))):
        kpi(fig, .058 + i*.2235, .850, .2105, v, et, col, h=.058)

    tit(fig, .784, 'I cinque episodi piu\' profondi')
    xs = [(.070, 'left'), (.330, 'right'), (.480, 'right'), (.640, 'right'),
          (.790, 'right'), (.930, 'right')]
    card(fig, .058, .580, .884, .192)
    riga_tab(fig, .742, ['#', 'da', 'fondo', 'profondita\'', 'operazioni', 'recuperato il'],
             xs, 8.0, INK3, 'bold')
    linea(fig, .732, .070, .930)
    for i, e in enumerate(ep):
        riga_tab(fig, .708 - i*.026,
                 [f"{i+1}", e['da'], e['fondo'], f"-{it(e['prof'],2)}%",
                  it(e['op']), e['fine'] if e['recuperato'] else 'ancora aperto'],
                 xs, 8.4, ROSSO if i == 0 else INK2, 'bold' if i == 0 else 'normal')

    tit(fig, .556, 'Il profilo completo')
    ax = fig.add_axes([.098, .326, .844, .202])
    ax.fill_between(np.arange(len(eq)), -d, 0, color=ROSSO, alpha=.32)
    ax.plot(np.arange(len(eq)), -d, color=ROSSO, lw=.9)
    for i, e in enumerate(ep[:3]):
        k = int(np.argmin(np.abs(np.array([j for j in range(len(eq))]) -
                                 C['date'].index(e['fondo'])))) if e['fondo'] in C['date'] else None
        if k is not None:
            # dentro l'area, non sotto il fondo: li' sbatterebbe contro
            # le etichette degli anni
            ax.text(k, -e['prof']*0.45, f"#{i+1}", fontsize=7.6, color=INK,
                    ha='center', va='center', weight='bold')
    anni_su(ax, C['date'], eq)
    griglia(ax); ax.set_ylabel('sotto il massimo (%)', fontsize=7.8)
    ax.set_xlabel('operazioni in ordine di tempo', fontsize=7.8)
    ax.tick_params(labelsize=7.2)

    testo(fig, .058, .296,
          f"Il conto ha passato il {it(100*sotto,0)}% del tempo sotto il suo massimo precedente. Non e' un difetto:\n"
          f"e' la normalita' di qualunque strategia. Quello che conta e' quanto profondi sono i buchi e\n"
          f"quanto durano — e qui il peggiore e' costato {it(ep[0]['prof'],2)} punti su {it(ep[0]['op'])} operazioni.\n\n"
          f"La riga da tenere a mente e' un'altra: questo profilo e' quello che E' CAPITATO. Il Monte\n"
          f"Carlo, rimescolando le stesse identiche operazioni, produce percorsi in cui le perdite si\n"
          f"incolonnano peggio, e li' il drawdown arriva al {it(DD_MC_95,1)}% in una storia su venti. Il rischio\n"
          f"e' stato scelto su quel numero, non su questo.", 8.8)

    tit(fig, .134, 'Perche\' questo grafico e\' piu\' onesto della curva del capitale')
    testo(fig, .058, .108,
          "La curva del capitale sale e sembra facile. Questa dice quanto tempo si passa a guardare un\n"
          "conto che vale meno di quanto valeva, e quella e' l'unica cosa che decide se una strategia\n"
          "si riesce a tenere accesa. Un drawdown del 20% su un conto da 10.000 sono 2.000 euro che\n"
          "spariscono e non tornano per mesi: e' quello il momento in cui si spegne tutto, non quando\n"
          "il grafico sale.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 3
def pag_calendario(C, pdf):
    mesi = per_mese(C); pa = per_anno(C)
    rm = np.array(list(mesi.values()))
    fig = pagina('Anno per anno, mese per mese',
                 'la stessa curva letta sul calendario, per vedere dove sono arrivati i soldi')

    tit(fig, .888, 'Ogni anno')
    xs = [(.070, 'left'), (.330, 'right'), (.480, 'right'), (.650, 'right'), (.930, 'right')]
    card(fig, .058, .618, .884, .254)
    riga_tab(fig, .842, ['anno', 'rendimento', 'operazioni', 'capitale a fine anno', ''],
             xs, 8.0, INK3, 'bold')
    linea(fig, .832, .070, .930)
    cap = DEP
    for i, a in enumerate(C['anni']):
        r, n = pa[a]
        cap = cap*(1 + r/100)
        barra = '█' * max(1, int(abs(r)/12))
        riga_tab(fig, .808 - i*.024,
                 [a, pc(r, 1), it(n), it(cap, 0), barra],
                 xs, 8.4, VERDE if r >= 0 else ROSSO)

    tit(fig, .598, 'Ogni mese')
    ax = fig.add_axes([.098, .366, .844, .208])
    A = sorted({k[:4] for k in mesi})
    M = np.full((len(A), 12), np.nan)
    for k, v in mesi.items():
        M[A.index(k[:4]), int(k[5:7]) - 1] = v
    lim = np.nanmax(np.abs(M))
    im = ax.imshow(M, cmap='RdYlGn', vmin=-lim, vmax=lim, aspect='auto')
    ax.set_xticks(range(12)); ax.set_xticklabels(MESI, fontsize=7.0)
    ax.set_yticks(range(len(A))); ax.set_yticklabels(A, fontsize=7.4)
    ax.set_xticks(np.arange(-.5, 12, 1), minor=True)
    ax.set_yticks(np.arange(-.5, len(A), 1), minor=True)
    ax.grid(which='minor', color=INK3, lw=.5); ax.tick_params(which='minor', length=0)
    for i in range(len(A)):
        for j in range(12):
            if not np.isnan(M[i, j]):
                ax.text(j, i, f"{M[i,j]:+.0f}", ha='center', va='center',
                        fontsize=6.4, color='#111110', weight='bold')
    ax.grid(False, which='major')

    tit(fig, .326, 'I mesi, in numeri')
    xs2 = [(.070, 'left'), (.360, 'right'), (.530, 'right'), (.720, 'right'), (.930, 'right')]
    card(fig, .058, .206, .884, .108)
    riga_tab(fig, .294, ['', 'mesi in utile', 'migliore', 'peggiore', 'media'],
             xs2, 8.0, INK3, 'bold')
    linea(fig, .284, .070, .930)
    riga_tab(fig, .260, [f"{it(len(rm))} mesi", f"{it(100*(rm>0).mean(),0)}%",
                         pc(rm.max(), 1), pc(rm.min(), 1), pc(rm.mean(), 2)],
             xs2, 8.6, INK)
    riga_tab(fig, .234, ['deviazione standard mensile', f"{it(rm.std(),2)}%",
                         'mediana', pc(np.median(rm), 2), ''], xs2, 8.4, INK2)

    tit(fig, .166, 'Cosa dice il calendario')
    peggio = min(mesi, key=mesi.get); meglio = max(mesi, key=mesi.get)
    magri = [a for a in C['anni'] if pa[a][0] < 20]
    grasso = max(C['anni'], key=lambda a: pa[a][0])
    testo(fig, .058, .140,
          f"{it(len(magri))} anni su {it(len(C['anni']))} sono rimasti sotto il 20%: {', '.join(magri)}. Il {grasso} da solo ha fatto\n"
          f"{pc(pa[grasso][0],0)}, ed e' il motivo per cui il rischio e' stato deciso sul periodo 2019-2023 e\n"
          f"non sulla media che lo contiene.\n\n"
          f"Il mese peggiore e' stato {peggio} con {pc(mesi[peggio],1)}, il migliore {meglio} con {pc(mesi[meglio],1)}.\n"
          f"Su {it(len(rm))} mesi, {it(100*(rm>0).mean(),0)} su cento sono finiti in utile: vuol dire che circa un mese su tre e'\n"
          f"in perdita, e questo va messo in conto prima di cominciare, non dopo il primo mese rosso.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 4
def pag_gambe(C, pdf):
    eo, en = gamba(C, 'oro'), gamba(C, 'nas')
    eq = C['eq']
    fig = pagina('Chi ha portato cosa',
                 'le due gambe separate, e quanto ognuna ha contribuito al totale')

    to = 100*(eo[-1]/DEP - 1); tn = 100*(en[-1]/DEP - 1); tt = 100*(eq[-1]/DEP - 1)
    do = dd_serie(eo)[0].max(); dn = dd_serie(en)[0].max(); dt = dd_serie(eq)[0].max()
    for i, (v, et, col) in enumerate((
            (pc(to, 0), f'solo oro allo {it(N_ORO,2)}%', CO),
            (pc(tn, 0), f'solo nasdaq allo {it(N_NAS,2)}%', CN),
            (pc(tt, 0), 'insieme', CI),
            (f"-{it(dt,1)}%", 'drawdown insieme', ROSSO))):
        kpi(fig, .058 + i*.2235, .850, .2105, v, et, col, h=.058)

    tit(fig, .784, 'Le tre curve')
    ax = fig.add_axes([.098, .556, .844, .212])
    for v, n, c in ((eo, f"solo oro   {pc(to,0)}   DD {it(do,1)}%", CO),
                    (en, f"solo nasdaq   {pc(tn,0)}   DD {it(dn,1)}%", CN),
                    (eq, f"INSIEME   {pc(tt,0)}   DD {it(dt,1)}%", CI)):
        ax.plot(np.arange(len(v)), v, color=c, lw=1.7 if c == CI else 1.2, label=n)
    ax.set_yscale('log'); griglia(ax); anni_su(ax, C['date'], eq)
    ax.set_xlabel('operazioni in ordine di tempo', fontsize=7.8)
    ax.set_ylabel('capitale (scala log)', fontsize=7.8)
    ax.tick_params(labelsize=7.2)
    ax.legend(fontsize=7.6, facecolor='#1c1c1a', edgecolor=GRIGLIA,
              labelcolor=INK2, loc='upper left')

    tit(fig, .518, 'La diversificazione, misurata')
    m = defaultdict(lambda: [1.0, 1.0])
    for d_, x, k in C['op']:
        m[d_[:7]][0 if k == 'oro' else 1] *= (1 + x)
    ks = sorted(m)
    a = np.array([m[k][0] - 1 for k in ks]); b = np.array([m[k][1] - 1 for k in ks])
    cor = float(np.corrcoef(a, b)[0, 1])
    xs = [(.070, 'left'), (.430, 'right'), (.620, 'right'), (.930, 'right')]
    card(fig, .058, .348, .884, .162)
    riga_tab(fig, .496, ['', 'rendimento', 'drawdown', 'rend / DD'], xs, 8.0, INK3, 'bold')
    linea(fig, .486, .070, .930)
    for i, (n, t_, d_, c) in enumerate((('solo oro', to, do, CO),
                                        ('solo nasdaq', tn, dn, CN),
                                        ('INSIEME', tt, dt, CI))):
        riga_tab(fig, .462 - i*.026, [n, pc(t_, 0), f"{it(d_,2)}%", it(t_/d_, 1)],
                 xs, 8.6, c, 'bold' if n == 'INSIEME' else 'normal')
    riga_tab(fig, .366, ['se i due drawdown si sommassero', '',
                         f"{it(do+dn,2)}%", ''], xs, 8.0, INK3)

    testo(fig, .058, .326,
          f"Se le due sofferenze si sommassero, il drawdown dell'insieme sarebbe il {it(do+dn,1)}%. E' il {it(dt,1)}%:\n"
          f"quasi la meta'. Quello che manca e' la diversificazione, e si misura: la correlazione fra i\n"
          f"rendimenti mensili delle due gambe e' {it(cor,3)} su {it(len(ks))} mesi. Praticamente zero.", 8.8)

    tit(fig, .254, 'Col composto i due rendimenti si MOLTIPLICANO', VERDE)
    testo(fig, .058, .228,
          f"Guarda i tre numeri: {pc(to,0)} e {pc(tn,0)} da sole, {pc(tt,0)} insieme. Non e' una somma, e non e'\n"
          f"un errore: {it(1+to/100,2)} x {it(1+tn/100,2)} = {it((1+to/100)*(1+tn/100),2)}, cioe' {pc(100*((1+to/100)*(1+tn/100)-1),0)}. Col composto i profitti di una gamba\n"
          f"fanno crescere le posizioni dell'altra, e i due fattori si moltiplicano. Il programma lo\n"
          f"verifica: se non tornasse al centesimo, il report non verrebbe nemmeno generato.", 8.8)

    tit(fig, .138, 'Quanto ha lavorato ognuna')
    pa_o = per_anno(C, 'oro'); pa_n = per_anno(C, 'nas')
    nA = len(C['anni']); x0, dx = .130, (.930 - .130)/nA
    xs3 = [(.070, 'left')] + [(x0 + dx*(i + .92), 'right') for i in range(nA)]
    card(fig, .058, .030, .884, .100)
    riga_tab(fig, .110, [''] + [a[2:] for a in C['anni']], xs3, 8.0, INK3, 'bold')
    linea(fig, .100, .070, .930)
    riga_tab(fig, .078, ['oro'] + [pc(pa_o[a][0], 0) for a in C['anni']], xs3, 8.2, CO)
    riga_tab(fig, .054, ['nasdaq'] + [pc(pa_n[a][0], 0) for a in C['anni']], xs3, 8.2, CN)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 5
def pag_operazioni(C, pdf):
    v = np.array([x for _, x, _ in C['op']])*100
    vo = np.array([x for _, x, k in C['op'] if k == 'oro'])*100
    vn = np.array([x for _, x, k in C['op'] if k == 'nas'])*100
    fig = pagina('Le operazioni',
                 'come sono fatte le 2.520 operazioni che hanno prodotto quella curva')

    for i, (val, et, col) in enumerate((
            (f"{it(100*(v>0).mean(),1)}%", 'operazioni in utile', INK),
            (pc(v.mean(), 3), 'media per operazione', VERDE),
            (pc(v.max(), 2), 'la migliore', VERDE),
            (pc(v.min(), 2), 'la peggiore', ROSSO))):
        kpi(fig, .058 + i*.2235, .850, .2105, val, et, col, h=.058)

    testo(fig, .058, .800,
          f"Meno di una operazione su due finisce in utile, e il sistema guadagna lo stesso: le vincenti\n"
          f"sono molto piu' grandi delle perdenti. La peggiore in sette anni e' costata {it(abs(v.min()),2)}% del conto,\n"
          f"la migliore ne ha reso {it(v.max(),2)}%.", 8.8, INK)

    tit(fig, .726, 'Come sono distribuite')
    ax = fig.add_axes([.098, .508, .844, .206])
    lim = np.percentile(np.abs(v), 99.5)
    bins = np.linspace(-lim, lim, 90)
    ax.hist(np.clip(vo, -lim, lim), bins=bins, color=CO, alpha=.60,
            edgecolor='none', label=f"oro   {it(len(vo))} operazioni")
    ax.hist(np.clip(vn, -lim, lim), bins=bins, color=CN, alpha=.60,
            edgecolor='none', label=f"nasdaq   {it(len(vn))} operazioni")
    ax.axvline(0, color=INK3, lw=1.0)
    griglia(ax); ax.set_xlabel('risultato dell\'operazione, in % del conto', fontsize=7.8)
    ax.set_ylabel('operazioni', fontsize=7.8); ax.tick_params(labelsize=7.2)
    ax.legend(fontsize=7.6, facecolor='#1c1c1a', edgecolor=GRIGLIA,
              labelcolor=INK2, loc='upper left')

    tit(fig, .472, 'Le due gambe a confronto')
    xs = [(.070, 'left'), (.360, 'right'), (.510, 'right'), (.650, 'right'),
          (.790, 'right'), (.930, 'right')]
    card(fig, .058, .302, .884, .156)
    riga_tab(fig, .428, ['', 'operazioni', 'in utile', 'media', 'la migliore', 'la peggiore'],
             xs, 8.0, INK3, 'bold')
    linea(fig, .418, .070, .930)
    for i, (n, s, c) in enumerate((('oro', vo, CO), ('nasdaq', vn, CN),
                                   ('INSIEME', v, CI))):
        riga_tab(fig, .394 - i*.026,
                 [n, it(len(s)), f"{it(100*(s>0).mean(),1)}%", pc(s.mean(), 3),
                  pc(s.max(), 2), pc(s.min(), 2)],
                 xs, 8.6, c, 'bold' if n == 'INSIEME' else 'normal')
    g = np.sort(v)
    riga_tab(fig, .318, ['le cinque migliori: ' + '  '.join(pc(z, 2) for z in g[-5:][::-1]),
                         '', '', '', '', ''], xs, 7.8, INK3)

    tit(fig, .276, 'Quanto pesano le operazioni piu\' grandi')
    ax = fig.add_axes([.098, .116, .844, .152])
    ordinate = np.sort(v)[::-1]
    quota = 100*np.cumsum(ordinate[ordinate > 0])/ordinate[ordinate > 0].sum()
    ax.plot(np.arange(1, len(quota)+1), quota, color=VIOLA, lw=1.8)
    for q in (10, 25, 50):
        k = int(len(quota)*q/100)
        ax.plot([k], [quota[k-1]], 'o', color=VIOLA, ms=5)
        ax.text(k, quota[k-1] - 6, f"  il {q}% piu' grandi\n  fa il {quota[k-1]:.0f}% degli utili",
                fontsize=7.2, color=INK2)
    griglia(ax); ax.set_xlabel('operazioni in utile, dalla piu' + "' grande", fontsize=7.8)
    ax.set_ylabel('quota degli utili (%)', fontsize=7.8)
    ax.set_ylim(0, 105); ax.tick_params(labelsize=7.2)

    k10 = int(len(quota)*.10)
    testo(fig, .058, .082,
          f"Il {it(10,0)}% delle operazioni vincenti produce il {it(quota[k10-1],0)}% di tutti gli utili. E' il tratto tipico di una\n"
          f"strategia che segue il trend, non un difetto: si perde poco tante volte e si guadagna molto\n"
          f"poche volte. Vuol dire pero' che saltare i giorni sbagliati costa caro, e che le medie\n"
          f"calcolate su pochi mesi non dicono niente.", 8.8)
    pdf.savefig(fig); plt.close(fig)


def main(p_oro, p_nas, out):
    C = carica(p_oro, p_nas)
    eq = C['eq']; d, _ = dd_serie(eq)
    print(f"{C['dal']} -> {C['al']}  {it(C['durata'],2)} anni  {len(C['op'])} operazioni")
    print(f"da {DEP:,.0f} a {eq[-1]:,.0f}  ({pc(100*(eq[-1]/DEP-1),1)})  DD max {it(d.max(),2)}%")
    # controllo: la somma delle due gambe da sole NON deve fare il totale
    # (col composto non e' additivo), ma il totale deve stare in mezzo
    eo, en = gamba(C, 'oro')[-1], gamba(C, 'nas')[-1]
    assert eq[-1] > max(eo, en), 'l\'insieme rende meno della gamba migliore: impossibile'
    # col composto il totale e' il PRODOTTO dei due fattori, non la somma:
    # equity = DEP x prod(1+x) su tutte le operazioni = DEP x prod(oro) x prod(nas)
    atteso = eo * en / DEP
    assert abs(eq[-1] - atteso) < 1e-6, f'{eq[-1]:.6f} != {atteso:.6f}'
    print(f"verifica: {eo/DEP:.4f} x {en/DEP:.4f} = {atteso/DEP:.4f}  ->  {pc(100*(atteso/DEP-1),1)}")
    with PdfPages(out) as pdf:
        pag_curva(C, pdf)
        pag_drawdown(C, pdf)
        pag_calendario(C, pdf)
        pag_gambe(C, pdf)
        pag_operazioni(C, pdf)
    print('scritto', out)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2],
         sys.argv[3] if len(sys.argv) > 3 else 'report/curva-reale.pdf')
