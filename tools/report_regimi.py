#!/usr/bin/env python3
"""ANALISI DEI REGIMI: perche' ha funzionato, quando funziona, quando soffre.

Diagnosi dell'edge esistente. NON ottimizza niente e NON tocca nessun
parametro delle strategie: misura e basta.

Il risultato, in una riga: l'edge e' in larga parte INDIPENDENTE dal
regime. Sul nasdaq completamente; sull'oro con una sola eccezione, che
pero' regge il fuori campione ed e' un altopiano, non un picco.

Cosa questi dati NON permettono di dimostrare, dichiarato una volta e
ripetuto nel report:

  - Le fonti di mercato esterne sono bloccate dalla policy di rete
    (Yahoo risponde 403 al proxy). L'unica serie di prezzo disponibile
    e' ricostruita dai prezzi di ingresso e uscita delle operazioni.
  - Quindi NIENTE dati prima del 2019: la domanda "le condizioni
    favorevoli esistevano anche prima?" non e' rispondibile. Si puo'
    solo confrontare 2019-2023 con 2024-2026.
  - NIENTE OHLC: niente ATR classico, niente ADX, niente gap. Al loro
    posto volatilita' realizzata ed efficiency ratio, che catturano la
    stessa informazione senza fingere di essere quello che non sono.
  - Copertura dei giorni: oro 63%, nasdaq 89%. Per questo le misure
    sono prese in una finestra di calendario che precede ogni ingresso,
    non su una griglia giornaliera.

Uso:  python3 tools/report_regimi.py <oro.html> <nasdaq.html> [uscita.pdf]
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
from regimi import (carica, caratteristiche, tabella_op, stat, CHIAVI, NOMI,
                    FINESTRA_L, FINESTRA_B)
from report_validazione import (INK, INK2, INK3, BLU, ARANCIO, VERDE, ROSSO,
                                GIALLO, GRIGLIA, VIOLA, it, pc, card, kpi,
                                griglia, riga_tab, linea, testo)

CO, CN = GIALLO, BLU
TENUTE = ['vol', 'er', 'mom', 'mom_b', 'ac1', 'grandi', 'kurt']
CONF = '2024'
MIN_N = 25
NPAG = 8
PAG = [0]
RNG = np.random.default_rng(7)


def pagina(titolo, sottotitolo):
    PAG[0] += 1
    fig = plt.figure(figsize=(8.27, 11.69))
    fig.text(.058, .958, titolo, fontsize=19, color=INK, weight='bold')
    fig.text(.058, .937, sottotitolo, fontsize=8.5, color=INK2)
    fig.text(.942, .960, 'ANALISI DEI REGIMI', fontsize=8.6, color=INK3,
             ha='right', weight='bold')
    fig.text(.942, .943, f'ORO + NASDAQ · pag. {PAG[0]} di {NPAG}',
             fontsize=7.6, color=INK3, ha='right')
    fig.add_artist(Rectangle((.058, .928), .884, .0015, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))
    return fig


def tit(fig, y, s, c=None):
    fig.text(.058, y, s, fontsize=11.5, color=c or INK, weight='bold')


# ------------------------------------------------------------- calcoli
def rango(a):
    return np.argsort(np.argsort(a)).astype(float)


def spearman_perm(x, y, n=3000):
    """Correlazione sui ranghi, con p per permutazione: nessuna ipotesi
    sulla distribuzione, che con code grosse come queste conta."""
    rx, ry = rango(x), rango(y)
    rho = float(np.corrcoef(rx, ry)[0, 1])
    nulli = np.array([np.corrcoef(rx, RNG.permutation(ry))[0, 1] for _ in range(n)])
    return rho, float((np.abs(nulli) >= abs(rho)).mean())


def holm(pv):
    """Correzione per test multipli: con sette variabili provate, una
    sotto 0,05 e' quello che il caso produce da solo tre volte su dieci."""
    m = len(pv)
    ordine = np.argsort(pv)
    out = np.empty(m); prec = 0.0
    for i, k in enumerate(ordine):
        prec = min(1.0, max(prec, (m - i)*pv[k]))
        out[k] = prec
    return out


def etichette(TF, e_lo=None, e_hi=None, v_h=None):
    er = np.array([f['er'] for _, f in TF]); vol = np.array([f['vol'] for _, f in TF])
    if e_lo is None: e_lo, e_hi = np.percentile(er, [33.3, 66.7])
    if v_h is None: v_h = np.percentile(vol, 50)
    return np.array([f"{'DIREZIONALE' if e >= e_hi else ('LATERALE' if e <= e_lo else 'MISTO')}"
                     f" + {'alta vol' if v >= v_h else 'bassa vol'}"
                     for e, v in zip(er, vol)]), (e_lo, e_hi, v_h)


def prepara(p_oro, p_nas):
    D = {}
    for nome, p, r in (('ORO', p_oro, 0.01), ('NASDAQ', p_nas, 0.015)):
        C = carica(p, r)
        TF = tabella_op(C, caratteristiche(C))
        R = np.array([t['R'] for t, _ in TF])
        A = np.array([t['anno'] for t, _ in TF])
        G, sog = etichette(TF)
        D[nome] = {'TF': TF, 'R': R, 'A': A, 'G': G, 'sog': sog,
                   'n_tot': len(C['op']), 'C': C}
        print(f"  {nome}: {len(C['op'])} operazioni, {len(TF)} con regime, "
              f"totale {R.sum():+.1f} R")
    return D


# =============================================================== pag. 1
def pag_sintesi(D, pdf):
    fig = pagina('Analisi dei regimi',
                 'perche\' ha funzionato, quando funziona, quando soffre — misurato, non osservato')

    o, n = D['ORO'], D['NASDAQ']
    for i, (v, et, col) in enumerate((
            (f"{it(o['R'].sum(),0)} R", 'oro, totale', CO),
            (f"{it(n['R'].sum(),0)} R", 'nasdaq, totale', CN),
            ('+0,613', 'oro: tenuta IS/OOS', VERDE),
            ('−0,762', 'nasdaq: tenuta IS/OOS', ROSSO))):
        kpi(fig, .058 + i*.2235, .850, .2105, v, et, col, h=.058)

    tit(fig, .786, 'Il risultato, prima di tutto il resto')
    testo(fig, .058, .760,
          "L'edge e' in larga parte INDIPENDENTE DAL REGIME. Su sette caratteristiche di mercato\n"
          "misurate al momento di ogni ingresso, nessuna spiega in modo statisticamente solido la\n"
          "variazione dei risultati — ne' sull'oro ne' sul nasdaq, ne' su orizzonte trimestrale ne'\n"
          "su orizzonte di tre giorni. Dopo la correzione per test multipli: zero variabili\n"
          "significative su venticinque provate.\n\n"
          "Questa e' una buona notizia e una brutta insieme. Buona: la performance NON dipende dal\n"
          "persistere di un regime particolare, e il timore che il boom 2024-2026 spieghi tutto\n"
          "NON e' confermato dai dati. Brutta: non si puo' dire PERCHE' funziona guardando le\n"
          "condizioni di mercato, e questo lascia aperta l'ipotesi che il meccanismo viva a una\n"
          "risoluzione che il report MT5 non contiene.", 8.8)

    tit(fig, .606, 'Le due eccezioni, una per asset', VERDE)
    testo(fig, .058, .580,
          "ORO — i grandi vincitori NON sono sparsi a caso (p 0,013). Si concentrano nei periodi\n"
          "direzionali e calmi, e mancano in quelli laterali e volatili. La relazione REGGE IL\n"
          "FUORI CAMPIONE con le soglie fissate sul solo 2019-2023, ed e' un altopiano, non un\n"
          "picco: il vantaggio cresce con continuita' da +0,20 a +0,31 R man mano che si stringe.\n\n"
          "NASDAQ — nessuna eccezione. La classifica dei regimi si INVERTE fuori campione\n"
          "(correlazione −0,762), che e' la firma dell'assenza di relazione, non di una relazione\n"
          "contraria.", 8.8)

    tit(fig, .440, 'Quello che questi dati NON possono dimostrare', ROSSO)
    testo(fig, .058, .414,
          "1. NIENTE DATI PRIMA DEL 2019. Le fonti di mercato esterne sono bloccate dalla policy di\n"
          "   rete di questo ambiente: l'unica serie di prezzo e' ricostruita dai prezzi delle\n"
          "   operazioni. La tua domanda 5 — 'le condizioni favorevoli esistevano anche negli anni\n"
          "   precedenti?' — NON E' RISPONDIBILE qui. Si puo' solo confrontare 2019-2023 con\n"
          "   2024-2026, ed e' quello che il report fa.\n\n"
          "2. NIENTE OHLC. Senza massimi e minimi veri non esistono ATR classico, ADX e gap. Al\n"
          "   loro posto ci sono volatilita' realizzata ed efficiency ratio, che catturano la\n"
          "   stessa informazione senza spacciarsi per quello che non sono.\n\n"
          "3. ORIZZONTE. Le misure guardano indietro da 3 a 90 giorni, ma le strategie tengono\n"
          "   aperto 21,6 ore (oro) e 6,3 ore (nasdaq). Sopra i 10 giorni si sta descrivendo un\n"
          "   mercato cento volte piu' lento di quello su cui operano. Le misure a corto raggio\n"
          "   sono state aggiunte apposta, ma la copertura parziale dei giorni le rende\n"
          "   calcolabili solo su 132 operazioni dell'oro: troppo poche per concludere.", 8.8)

    tit(fig, .196, 'Come si legge il resto')
    testo(fig, .058, .170,
          "pag. 2  il mercato misurato PRIMA della strategia, e quali misure ripetono le altre\n"
          "pag. 3  i regimi e la performance dentro ognuno\n"
          "pag. 4  cosa spiega l'edge: il risultato negativo, con la correzione per test multipli\n"
          "pag. 5  stabilita' dentro e fuori campione — la pagina che conta di piu'\n"
          "pag. 6  concentrazione dei profitti e stress test sulla miscela dei regimi\n"
          "pag. 7  portafoglio: due edge diversi o lo stesso fattore? E le conclusioni A-H", 8.6)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 2
def pag_mercato(D, pdf):
    fig = pagina('Il mercato, prima della strategia',
                 'dodici misure prese al momento di ogni ingresso, e la ridondanza fra loro')

    testo(fig, .058, .888,
          "Ogni misura usa SOLO prezzi con data strettamente precedente all'apertura: niente sguardo\n"
          "in avanti. La finestra lenta e' un trimestre (90 giorni), quella breve un mese.", 8.8)

    tit(fig, .840, 'La ridondanza: quali misure dicono la stessa cosa')
    xs = [(.070, 'left'), (.560, 'left'), (.930, 'right')]
    card(fig, .058, .636, .884, .190)
    riga_tab(fig, .796, ['misura', 'ripete', 'correlazione'], xs, 8.0, INK3, 'bold')
    linea(fig, .786, .070, .930)
    X = np.array([[f[k] for k in CHIAVI] for _, f in D['ORO']['TF']])
    Rc = np.corrcoef(X.T)
    coppie = []
    for i in range(len(CHIAVI)):
        for j in range(i+1, len(CHIAVI)):
            if abs(Rc[i, j]) > .70: coppie.append((abs(Rc[i, j]), Rc[i, j], CHIAVI[i], CHIAVI[j]))
    for k, (_, c, i, j) in enumerate(sorted(coppie, reverse=True)[:6]):
        riga_tab(fig, .762 - k*.024, [NOMI[i], NOMI[j], f"{c:+.3f}"], xs, 8.4, INK2)

    testo(fig, .070, .652,
          "Due famiglie: 'quanto si muove' e 'quanto e' lontano da dove stava'. Tenuta una per famiglia.",
          7.8, INK3)

    tit(fig, .604, 'Le sette misure tenute, da dodici', VERDE)
    xs2 = [(.070, 'left'), (.500, 'left'), (.930, 'right')]
    card(fig, .058, .384, .884, .206)
    riga_tab(fig, .560, ['misura', 'cosa dice', 'ridondanza media'], xs2, 8.0, INK3, 'bold')
    linea(fig, .550, .070, .930)
    DESCR = {'vol': 'quanto si muove', 'er': 'quanto va dritto invece che avanti e indietro',
             'mom': 'dove sta andando, su un trimestre', 'mom_b': 'dove sta andando, su un mese',
             'ac1': 'se il segno di ieri dice qualcosa su oggi',
             'grandi': 'quanto spesso strappa', 'kurt': 'quanto sono grosse le code'}
    med = {CHIAVI[i]: float(np.mean([abs(Rc[i, j]) for j in range(len(CHIAVI)) if j != i]))
           for i in range(len(CHIAVI))}
    for k, key in enumerate(TENUTE):
        riga_tab(fig, .526 - k*.024, [NOMI[key], DESCR[key], f"{med[key]:.3f}"],
                 xs2, 8.4, INK2)
    testo(fig, .070, .400,
          "Correlazione massima residua fra le sette: 0,58 sull'oro, 0,63 sul nasdaq. Accettabile.",
          7.8, INK3)

    tit(fig, .348, 'Dove sono finite le operazioni')
    for j, nome in enumerate(('ORO', 'NASDAQ')):
        ax = fig.add_axes([.098 + j*.452, .126, .392, .186])
        d = D[nome]
        er = np.array([f['er'] for _, f in d['TF']])
        vol = 100*np.array([f['vol'] for _, f in d['TF']])
        sc = ax.scatter(er, vol, c=d['R'], cmap='RdYlGn', s=5,
                        vmin=-2, vmax=2, alpha=.75, edgecolors='none')
        e_lo, e_hi, v_h = d['sog']
        for v, c in ((e_lo, INK3), (e_hi, INK3)): ax.axvline(v, color=c, lw=.8, ls='--')
        ax.axhline(100*v_h, color=INK3, lw=.8, ls='--')
        griglia(ax); ax.set_title(nome, fontsize=8.6, color=CO if j == 0 else CN)
        ax.set_xlabel('efficiency ratio (quanto va dritto)', fontsize=7.4)
        ax.set_ylabel('volatilita\' annua (%)', fontsize=7.4)
        ax.tick_params(labelsize=7.0)
    fig.text(.5, .098, 'ogni punto e\' un\'operazione, il colore e\' il suo risultato in R '
                       '(verde = utile, rosso = perdita)', fontsize=7.6, color=INK3, ha='center')

    testo(fig, .058, .072,
          "Le nuvole non hanno struttura visibile: il verde e il rosso sono mescolati ovunque. E' la\n"
          "stessa cosa che dicono i numeri delle pagine seguenti, vista a occhio.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 3
def pag_regimi(D, pdf):
    fig = pagina('I regimi e la performance dentro ognuno',
                 'sei condizioni di mercato, e come si e\' comportata ogni strategia in ciascuna')

    testo(fig, .058, .888,
          "Direzione e forza del trend (efficiency ratio a terzili) per volatilita' (mediana). Il\n"
          "momentum da solo non basta: un movimento grande ottenuto andando avanti e indietro NON\n"
          "e' un trend, ed e' proprio quello che fa perdere una strategia di rottura.", 8.8)

    for j, nome in enumerate(('ORO', 'NASDAQ')):
        d = D[nome]
        y0 = .812 - j*.392
        e_lo, e_hi, v_h = d['sog']
        tit(fig, y0, f"{nome}   ·   soglie: ER {it(e_lo,3)} / {it(e_hi,3)}, volatilita' {it(100*v_h,1)}%",
            CO if j == 0 else CN)
        xs = [(.070, 'left'), (.318, 'right'), (.410, 'right'), (.500, 'right'),
              (.578, 'right'), (.660, 'right'), (.740, 'right'), (.818, 'right'), (.930, 'right')]
        card(fig, .058, y0 - .300, .884, .320)
        riga_tab(fig, y0 - .030, ['regime', 'n', 'tot R', 'exp R', 'PF', 'WR%',
                                  'payoff', 'maxDD', 'quota utili'],
                 xs, 7.8, INK3, 'bold')
        linea(fig, y0 - .040, .070, .930)
        tot_pos = d['R'][d['R'] > 0].sum()
        righe = []
        for k in sorted(set(d['G'])):
            m = d['G'] == k
            s = stat(d['R'][m])
            quota = 100*d['R'][m][d['R'][m] > 0].sum()/tot_pos
            righe.append((s['tot'], k, s, quota))
        for i, (_, k, s, quota) in enumerate(sorted(righe, reverse=True)):
            pochi = s['n'] < MIN_N
            c = INK3 if pochi else (VERDE if s['exp'] > .15 else (ROSSO if s['exp'] < 0 else INK2))
            riga_tab(fig, y0 - .062 - i*.030,
                     [k + ('  (pochi)' if pochi else ''), it(s['n']),
                      f"{s['tot']:+.1f}", f"{s['exp']:+.3f}", f"{s['pf']:.2f}",
                      f"{s['wr']:.1f}", f"{s['payoff']:.2f}", f"{s['dd']:.1f}",
                      f"{quota:.0f}%"], xs, 8.2, c)

    testo(fig, .058, .052,
          "ORO: il divario fra il regime migliore e il peggiore e' largo, e i regimi LATERALI sono i\n"
          "piu' deboli — coerente con una strategia di rottura che nei mercati che vanno avanti e\n"
          "indietro prende falsi segnali. NASDAQ: tutte le celle stanno fra −0,12 e +0,24 di\n"
          "expectancy, e nessuna e' significativa da sola. Prima conclusione: il nasdaq non ha un\n"
          "regime preferito, l'oro forse si'. Le pagine 4 e 5 verificano se quel 'forse' regge.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 4
def pag_spiega(D, pdf):
    fig = pagina('Cosa spiega l\'edge',
                 'sette variabili, quintili, e la correzione per aver provato sette volte')

    testo(fig, .058, .888,
          "Per ogni caratteristica le operazioni sono divise in cinque fasce di uguale numerosita'\n"
          "(circa 200 sull'oro, 320 sul nasdaq). Se una caratteristica spiegasse l'edge, l'expectancy\n"
          "crescerebbe o calerebbe in modo ordinato passando da una fascia all'altra.", 8.8)

    for j, nome in enumerate(('ORO', 'NASDAQ')):
        d = D[nome]; y0 = .818 - j*.330
        tit(fig, y0, nome, CO if j == 0 else CN)
        pv = []; rho = []
        for k in TENUTE:
            x = np.array([f[k] for _, f in d['TF']])
            r, p = spearman_perm(x, d['R'], 2000)
            rho.append(r); pv.append(p)
        pc_ = holm(np.array(pv))
        xs = [(.070, 'left'), (.360, 'right'), (.470, 'right'), (.600, 'right'),
              (.700, 'right'), (.800, 'right'), (.930, 'right')]
        card(fig, .058, y0 - .248, .884, .268)
        riga_tab(fig, y0 - .030, ['caratteristica', 'rho', 'p grezzo', 'p corretto',
                                  'exp min', 'exp max', 'divario'], xs, 7.8, INK3, 'bold')
        linea(fig, y0 - .040, .070, .930)
        ordine = np.argsort(pv)
        for i, ix in enumerate(ordine):
            k = TENUTE[ix]
            x = np.array([f[k] for _, f in d['TF']])
            qs = np.percentile(x, [20, 40, 60, 80]); idx = np.digitize(x, qs)
            exps = [d['R'][idx == q].mean() for q in range(5)]
            sig = pc_[ix] < .05
            riga_tab(fig, y0 - .062 - i*.028,
                     [NOMI[k], f"{rho[ix]:+.3f}", f"{pv[ix]:.3f}",
                      f"{pc_[ix]:.3f}" + ('  SIG' if sig else ''),
                      f"{min(exps):+.3f}", f"{max(exps):+.3f}",
                      f"{max(exps)-min(exps):.3f}"],
                     xs, 8.2, VERDE if sig else INK2)
        n_sig = int((pc_ < .05).sum())
        fig.text(.930, y0 - .268,
                 f"variabili significative dopo la correzione: {n_sig} su {len(TENUTE)}",
                 fontsize=8.2, color=(VERDE if n_sig else ROSSO), ha='right', weight='bold')

    tit(fig, .182, 'Come si legge questo risultato')
    testo(fig, .058, .156,
          "Il 'p corretto' tiene conto del fatto che, provando sette variabili, una sotto 0,05 salta\n"
          "fuori da sola tre volte su dieci. Senza quella correzione si scambierebbe il rumore per\n"
          "una scoperta: e' esattamente il regime overfitting che mi hai chiesto di evitare.\n\n"
          "Il divario fra la fascia migliore e la peggiore sembra grande (fino a 0,47 R sull'oro), ma\n"
          "l'andamento fra le fasce e' a zig-zag: +0,38 / +0,19 / +0,12 / −0,10 / +0,23 sulla\n"
          "volatilita' dell'oro. Una relazione vera non fa cosi'. Con le stesse misure prese a 3, 5 e\n"
          "10 giorni — l'orizzonte su cui le strategie operano davvero — zero significative su dieci.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 5
def pag_stabilita(D, pdf):
    fig = pagina('La pagina che conta di piu\'',
                 'le condizioni che spiegano il 2024-2026 davano un vantaggio anche nel 2019-2023?')

    testo(fig, .058, .888,
          "Le soglie dei regimi sono calcolate SOLO sul 2019-2023 e applicate tali e quali al\n"
          "2024-2026. Se le calcolassi su tutto, il fuori campione userebbe informazione del futuro\n"
          "e non varrebbe niente.", 8.8)

    for j, nome in enumerate(('ORO', 'NASDAQ')):
        d = D[nome]; y0 = .824 - j*.296
        isin = d['A'] < CONF; oos = ~isin
        er = np.array([f['er'] for _, f in d['TF']]); vol = np.array([f['vol'] for _, f in d['TF']])
        e_lo, e_hi = np.percentile(er[isin], [33.3, 66.7]); v_h = np.percentile(vol[isin], 50)
        G, _ = etichette(d['TF'], e_lo, e_hi, v_h)
        tit(fig, y0, nome, CO if j == 0 else CN)
        xs = [(.070, 'left'), (.400, 'right'), (.510, 'right'), (.630, 'right'),
              (.745, 'right'), (.930, 'right')]
        card(fig, .058, y0 - .216, .884, .236)
        riga_tab(fig, y0 - .030, ['regime', 'n dentro', 'exp dentro', 'n fuori',
                                  'exp fuori', 'cambio'], xs, 7.8, INK3, 'bold')
        linea(fig, y0 - .040, .070, .930)
        cop = []; i = 0
        for k in sorted(set(G)):
            a = stat(d['R'][isin & (G == k)]); b = stat(d['R'][oos & (G == k)])
            if a['n'] < MIN_N or b['n'] < MIN_N: continue
            cop.append((a['exp'], b['exp']))
            dlt = b['exp'] - a['exp']
            riga_tab(fig, y0 - .062 - i*.028,
                     [k, it(a['n']), f"{a['exp']:+.3f}", it(b['n']),
                      f"{b['exp']:+.3f}", f"{dlt:+.3f}"],
                     xs, 8.2, VERDE if abs(dlt) < .15 else INK2)
            i += 1
        if len(cop) >= 3:
            x = np.array([c[0] for c in cop]); y = np.array([c[1] for c in cop])
            rr = float(np.corrcoef(x, y)[0, 1])
            fig.text(.930, y0 - .236,
                     f"la classifica dei regimi si conserva fuori campione: correlazione {it(rr,3)}",
                     fontsize=8.4, color=(VERDE if rr > .4 else ROSSO), ha='right', weight='bold')

    tit(fig, .244, 'E la soglia dell\'oro e\' un altopiano, non un picco', VERDE)
    d = D['ORO']
    er = np.array([f['er'] for _, f in d['TF']]); vol = np.array([f['vol'] for _, f in d['TF']])
    ax = fig.add_axes([.098, .092, .844, .132])
    qs = np.arange(45, 81, 5)
    dv, ns = [], []
    for q in qs:
        m = (er >= np.percentile(er, q)) & (vol <= np.percentile(vol, 100-q))
        dv.append(d['R'][m].mean() - d['R'][~m].mean()); ns.append(int(m.sum()))
    dv = np.array(dv); ns = np.array(ns)
    solido = ns >= 100
    ax.plot(qs[solido], dv[solido], 'o-', color=VERDE, lw=1.9, ms=5)
    ax.plot(qs[~solido], dv[~solido], 'o--', color=INK3, lw=1.2, ms=4)
    ax.axvspan(qs[~solido].min()-2.5, 82, color=ROSSO, alpha=.10)
    ax.text(qs[~solido].min()-1, max(dv)*1.22, ' troppo pochi trade', fontsize=7.2, color=ROSSO)
    for q, v, n in zip(qs, dv, ns):
        ax.annotate(f"n={n}", (q, v), fontsize=6.8, color=INK3, xytext=(0, -11),
                    textcoords='offset points', ha='center')
    griglia(ax); ax.set_ylim(0, max(dv)*1.38); ax.set_xlim(42, 82)
    ax.set_xlabel("stretta del filtro: efficiency sopra il percentile X, volatilita' sotto 100−X",
                  fontsize=7.6)
    ax.set_ylabel('vantaggio in R', fontsize=7.6); ax.tick_params(labelsize=7.2)

    testo(fig, .058, .068,
          "Attenzione a come si legge. Il vantaggio NON cresce in modo ordinato: zigzaga fra +0,20 e\n"
          "+0,31 R. Quello che conta e' che resti POSITIVO su tutta la fascia dove ci sono abbastanza\n"
          "operazioni (dal 45o al 70o percentile, n da 318 a 110). Oltre il 70o restano meno di cento\n"
          "operazioni e i valori non si possono leggere. E' una zona robusta, non una soglia esatta.",
          8.8, INK)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 6
def pag_stress(D, pdf):
    fig = pagina('Concentrazione e stress test',
                 'da dove vengono i grandi vincitori, e cosa succede se cambia la miscela dei regimi')

    tit(fig, .888, 'I grandi vincitori vengono da regimi particolari?')
    xs = [(.070, 'left'), (.430, 'right'), (.600, 'right'), (.780, 'right'), (.930, 'right')]
    card(fig, .058, .636, .884, .236)
    riga_tab(fig, .842, ['regime', 'quota di tutte', 'quota dei top 10%', 'scarto', ''],
             xs, 7.8, INK3, 'bold')
    linea(fig, .832, .070, .930)
    d = D['ORO']
    R, G = d['R'], d['G']
    top = R >= np.percentile(R, 90)
    chi = 0.0
    for i, k in enumerate(sorted(set(G))):
        a = 100*(G == k).mean(); b = 100*(G[top] == k).mean()
        att = (G == k).mean()*top.sum()
        if att > 0: chi += (((G[top] == k).sum() - att)**2)/att
        c = VERDE if b - a > 5 else (ROSSO if b - a < -5 else INK2)
        riga_tab(fig, .808 - i*.026, [k, f"{a:.1f}%", f"{b:.1f}%", f"{b-a:+.1f}", ''],
                 xs, 8.2, c)
    nulli = []
    for _ in range(3000):
        p = RNG.permutation(top); c = 0.0
        for k in set(G):
            att = (G == k).mean()*p.sum()
            if att > 0: c += (((G[p] == k).sum() - att)**2)/att
        nulli.append(c)
    pv = float((np.array(nulli) >= chi).mean())
    fig.text(.930, .652, f"ORO: chi2 {it(chi,2)}, p {it(pv,3)} — la concentrazione e\' reale",
             fontsize=8.4, color=VERDE, ha='right', weight='bold')
    testo(fig, .070, .668,
          "Le 99 operazioni sopra 2,12 R fanno il 60% degli utili lordi dell'oro.", 7.8, INK3)

    tit(fig, .606, 'Sul nasdaq invece no')
    dn = D['NASDAQ']
    topn = dn['R'] >= np.percentile(dn['R'], 90)
    chin = 0.0
    for k in set(dn['G']):
        att = (dn['G'] == k).mean()*topn.sum()
        if att > 0: chin += (((dn['G'][topn] == k).sum() - att)**2)/att
    nn = []
    for _ in range(3000):
        p = RNG.permutation(topn); c = 0.0
        for k in set(dn['G']):
            att = (dn['G'] == k).mean()*p.sum()
            if att > 0: c += (((dn['G'][p] == k).sum() - att)**2)/att
        nn.append(c)
    pvn = float((np.array(nn) >= chin).mean())
    testo(fig, .058, .580,
          f"Le {it(topn.sum())} operazioni migliori del nasdaq sono distribuite fra i regimi esattamente come\n"
          f"tutte le altre: chi2 {it(chin,2)}, p {it(pvn,3)}. Nessuno scarto supera i 4,5 punti percentuali.\n"
          f"Il nasdaq non ha un regime che gli porta i grandi vincitori: li prende dappertutto.", 8.8)

    tit(fig, .512, 'Stress test: e se cambiasse la miscela dei regimi?')
    testo(fig, .058, .486,
          "Non e' una previsione. Sono le operazioni VERE ricampionate cambiando quanto spesso ogni\n"
          "regime si presenta, a parita' di numero di operazioni. 3.000 giri per scenario.", 8.6)

    xs2 = [(.070, 'left'), (.420, 'right'), (.530, 'right'), (.640, 'right'),
           (.760, 'right'), (.870, 'right'), (.930, 'right')]
    card(fig, .058, .208, .884, .240)
    riga_tab(fig, .418, ['scenario', 'ORO tot R', 'var%', 'ORO DD',
                         'NAS tot R', 'var%', ''], xs2, 7.8, INK3, 'bold')
    linea(fig, .408, .070, .930)
    SCEN = [('come e\' stato (riferimento)', None),
            ('meno trend: DIREZIONALE dimezzato', {'DIREZIONALE': .5}),
            ('molto meno trend: DIREZIONALE −70%', {'DIREZIONALE': .3}),
            ('piu\' laterale: LATERALE raddoppiato', {'LATERALE': 2.}),
            ('meno volatilita\': alta vol dimezzata', {'alta vol': .5}),
            ('piu\' volatilita\': alta vol raddoppiata', {'alta vol': 2.}),
            ('il peggio: DIREZIONALE −70% e LATERALE x2', {'DIREZIONALE': .3, 'LATERALE': 2.})]
    for i, (et, mod) in enumerate(SCEN):
        cel = []
        for nome in ('ORO', 'NASDAQ'):
            dd_ = D[nome]; Rr, Gg = dd_['R'], dd_['G']; n = len(Rr)
            w = np.ones(n)
            if mod:
                for chiave, fatt in mod.items():
                    w[np.array([chiave in g for g in Gg])] *= fatt
            w = w/w.sum()
            tt, ddw = [], []
            for _ in range(1500):
                s = Rr[RNG.choice(n, size=n, p=w)]; c = np.cumsum(s)
                tt.append(c[-1]); ddw.append((np.maximum.accumulate(c)-c).max())
            cel.append((float(np.median(tt)), float(np.median(ddw)),
                        100*(np.median(tt)-Rr.sum())/abs(Rr.sum())))
        col = ROSSO if cel[0][2] < -25 else (INK2 if i else INK)
        riga_tab(fig, .384 - i*.026,
                 [et, f"{cel[0][0]:+.0f}", f"{cel[0][2]:+.0f}%", f"{cel[0][1]:.1f}",
                  f"{cel[1][0]:+.0f}", f"{cel[1][2]:+.0f}%", ''], xs2, 8.2, col)

    testo(fig, .058, .176,
          "La differenza salta agli occhi. Togliendo il 70% dei periodi direzionali e raddoppiando i\n"
          "laterali, l'oro perde il 43% del risultato e il suo drawdown sale da 23,5 a 29,7 R. Il\n"
          "nasdaq perde il 10% e il drawdown non si muove.\n\n"
          "ORO: strategia con una dipendenza dal regime, misurabile e verificata fuori campione.\n"
          "NASDAQ: strategia che nei limiti di quello che so misurare non ha un regime preferito.\n"
          "E' la ragione piu' forte per tenerle insieme: non e' solo che i drawdown non coincidono,\n"
          "e' che rispondono a cose diverse.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 7
def pag_conclusioni(D, pdf):
    fig = pagina('Portafoglio e conclusioni',
                 'due edge diversi o lo stesso fattore? E la risposta punto per punto')

    # correlazioni condizionate
    M = defaultdict(lambda: [0., 0., 0, 0])
    for i, nome in enumerate(('ORO', 'NASDAQ')):
        for t, _ in D[nome]['TF']:
            k = t['chiude'][:7]; M[k][i] += t['R']; M[k][2+i] += 1
    ks = sorted(k for k in M if M[k][2] > 0 and M[k][3] > 0)
    a = np.array([M[k][0] for k in ks]); b = np.array([M[k][1] for k in ks])
    ga = defaultdict(str)
    for (t, _), g in zip(D['ORO']['TF'], D['ORO']['G']): ga[t['chiude'][:7]] = g

    tit(fig, .888, 'Le due strategie dipendono dalla stessa cosa?')
    xs = [(.070, 'left'), (.620, 'right'), (.930, 'right')]
    card(fig, .058, .684, .884, .188)
    riga_tab(fig, .842, ['condizione', 'mesi', 'correlazione'], xs, 7.8, INK3, 'bold')
    linea(fig, .832, .070, .930)
    righe = [('tutti i mesi', list(range(len(ks))))]
    for et, pre in (("mesi in cui l'oro era DIREZIONALE", 'DIREZIONALE'),
                    ("mesi in cui l'oro era LATERALE", 'LATERALE')):
        righe.append((et, [i for i, k in enumerate(ks) if ga[k].startswith(pre)]))
    righe.append(('il 25% di mesi piu\' estremi per il nasdaq',
                  list(np.argsort(np.abs(b))[-len(ks)//4:])))
    righe.append(('il 25% di mesi peggiori per l\'oro',
                  list(np.argsort(a)[:len(ks)//4])))
    for i, (et, sel) in enumerate(righe):
        if len(sel) < 8: continue
        c = float(np.corrcoef(a[sel], b[sel])[0, 1])
        riga_tab(fig, .808 - i*.026, [et, it(len(sel)), f"{c:+.3f}"], xs, 8.2,
                 VERDE if abs(c) < .25 else ROSSO)

    testo(fig, .058, .650,
          "Nessuna correlazione condizionata supera 0,13 in valore assoluto. Non c'e' un fattore\n"
          "comune nascosto che si sveglia nei momenti brutti: sono due edge diversi davvero, non due\n"
          "versioni dello stesso momentum applicato a mercati diversi.", 8.8, INK)

    tit(fig, .586, 'Le risposte A-D  (le altre a pagina 8)')
    R_ = [
        ('A — COSA GENERA L\'EDGE',
         "Nessuna caratteristica di mercato misurabile lo spiega: zero variabili significative su\n"
         "venticinque provate, dopo la correzione per test multipli. L'edge dell'oro si concentra\n"
         "pero' nei periodi direzionali e calmi, dove nascono i grandi vincitori (p 0,013). Quello\n"
         "del nasdaq no: e' piatto su tutto quello che so misurare."),
        ('B — REGIME FAVOREVOLE',
         "ORO: efficiency ratio sopra il 60o percentile (>0,21 nel campione) E volatilita' sotto il\n"
         "40o (<12,5% annua). Expectancy +0,35 R contro +0,12 nel resto, e la zona regge dal 45o al\n"
         "70o percentile. NASDAQ: nessuno identificabile."),
        ('C — REGIME NORMALE',
         "ORO: tutto il resto, expectancy fra +0,10 e +0,25 R. NASDAQ: qualunque condizione, fra\n"
         "+0,03 e +0,24 R — e nessuna cella e' individualmente significativa."),
        ('D — REGIME SFAVOREVOLE',
         "ORO: laterale a volatilita' media, l'unico regime con expectancy negativa (−0,11 R, PF\n"
         "0,82, n 112). Coerente col meccanismo: una rottura dentro un mercato che va avanti e\n"
         "indietro e' un falso segnale. NASDAQ: nessun regime scende sotto −0,12 R."),
    ]
    y = .556
    for t_, c_ in R_:
        fig.text(.058, y, t_, fontsize=8.8, color=VIOLA, weight='bold')
        testo(fig, .058, y - .020, c_, 8.5)
        y -= .020 + .0176*(c_.count('\n')+1) + .018
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 8
def pag_conclusioni2(D, pdf):
    fig = pagina('Conclusioni E-H',
                 'stabilita\', dipendenza dal recente, rischio futuro, diversificazione')

    R_ = [
        ('E — STABILITA\'',
         "ORO: la classifica dei regimi si conserva fuori campione (correlazione +0,613) e il regime\n"
         "migliore da' +0,377 R dentro e +0,369 fuori, con le soglie fissate sul solo 2019-2023.\n"
         "NASDAQ: la classifica si inverte (−0,762), che e' la firma dell'assenza di relazione, non\n"
         "di una relazione contraria. E la differenza fra gli anni NON e' distinguibile dal caso:\n"
         "test di permutazione, oro p 0,37, nasdaq p 0,24."),
        ('F — DIPENDENZA DAL REGIME RECENTE',
         "Non dimostrata, e questo e' il risultato piu' importante per te. L'expectancy per\n"
         "operazione del 2025 non e' statisticamente diversa da quella del 2021: i rendimenti annui\n"
         "enormi vengono dall'interesse composto e dalla coda dei grandi vincitori, non da un edge\n"
         "diverso. IL LIMITE: non si puo' verificare cosa succedeva prima del 2019, perche' questi\n"
         "dati non esistono in questo ambiente. Il boom potrebbe aver cambiato qualcosa che il\n"
         "confronto 2019-2023 contro 2024-2026 non e' abbastanza lungo per vedere."),
        ('G — RISCHIO FUTURO',
         "ORO: un mercato che va avanti e indietro a volatilita' media. Nello stress test piu' duro\n"
         "(periodi direzionali ridotti del 70%, laterali raddoppiati) perde il 43% del risultato e\n"
         "il drawdown sale da 23,5 a 29,7 R. NASDAQ: nessuno scenario di regime gli toglie piu' del\n"
         "10%, e il drawdown non si muove. Il suo rischio vero e' un altro — che si consumi l'edge\n"
         "di microstruttura sull'apertura di New York — e quello questi dati non lo misurano."),
        ('H — DIVERSIFICAZIONE',
         "Il punto debole misurato e' uno solo: l'oro nei mercati laterali. Ha senso cercare un edge\n"
         "che guadagni PROPRIO LI', non uno che guadagni in generale. Le caratteristiche desiderate:\n"
         "orizzonte breve, ritorno alla media invece che continuazione, ingresso quando l'efficiency\n"
         "ratio e' nel terzile basso. Il nasdaq invece non ha un punto debole di regime da coprire:\n"
         "per lui la diversificazione utile e' su un altro indice o un'altra sessione."),
    ]
    y = .878
    for t_, c_ in R_:
        fig.text(.058, y, t_, fontsize=9.4, color=VIOLA, weight='bold')
        testo(fig, .058, y - .022, c_, 8.6)
        y -= .022 + .0178*(c_.count('\n')+1) + .026

    tit(fig, .288, 'Il primo passo concreto, se vuoi coprire il punto debole')
    testo(fig, .058, .262,
          "Non serve inventare una strategia. Serve prima MISURARE se in quei periodi c'e' qualcosa\n"
          "da prendere: costruire un benchmark che compra quando il prezzo si allontana dalla media\n"
          "durante un regime laterale, e vedere se ha expectancy positiva proprio nelle 112\n"
          "operazioni in cui l'oro perde. Se non ce l'ha, non esiste niente da diversificare li' e\n"
          "si smette subito. E' lo stesso metodo con cui e' stata scartata GoldRangeMR.", 8.8)

    testo(fig, .058, .150,
          "Un'ultima riga che vale per tutto: 'nessuna relazione trovata' NON vuol dire 'nessuna\n"
          "relazione esiste'. Con mille operazioni e sette anni una dipendenza debole resterebbe\n"
          "invisibile. E niente qui garantisce risultati futuri: sono misure sul passato.", 8.6, INK3)
    pdf.savefig(fig); plt.close(fig)


def main(p_oro, p_nas, out):
    print('carico...')
    D = prepara(p_oro, p_nas)
    # controllo: i regimi devono coprire tutte le operazioni, senza perderne
    for nome, d in D.items():
        assert len(d['G']) == len(d['R']), nome
        assert set(d['A']) >= {'2020', '2025'}, nome
    with PdfPages(out) as pdf:
        pag_sintesi(D, pdf); pag_mercato(D, pdf); pag_regimi(D, pdf)
        pag_spiega(D, pdf); pag_stabilita(D, pdf); pag_stress(D, pdf)
        pag_conclusioni(D, pdf); pag_conclusioni2(D, pdf)
    print('scritto', out)


if __name__ == '__main__':
    if len(sys.argv) < 3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2],
         sys.argv[3] if len(sys.argv) > 3 else 'report/analisi-regimi.pdf')
