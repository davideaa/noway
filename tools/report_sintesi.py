#!/usr/bin/env python3
"""Dossier breve: otto pagine, due broker, due letture degli stessi dati.

  RISCHIO FISSO   ogni operazione rischia 100, l'1% del deposito
                  INIZIALE, per tutta la storia. Dice com'e' fatta la
                  strategia, senza che gli anni recenti vengano
                  amplificati dalla dimensione del conto.
  COMPOSTO        il saldo vero della passata, con le posizioni che
                  crescono insieme al conto. Dice quanto avrebbe fatto
                  davvero, e quanto avrebbe fatto male il drawdown.

Le due letture sono entrambe giuste e rispondono a domande diverse: in
ogni pagina stanno affiancate e non vengono mai mescolate.
"""
import sys, math, statistics as st
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Rectangle
sys.path.insert(0, 'tools')
from dati_validazione import (leggi, stat, stat_composto, per_anno, taglia,
                              equity_fissa, equity_composta, cagr,
                              prezzo_mensile, CONFINE_OOS, DEPOSITO)
from report_validazione import (BG, CARD, INK, INK2, INK3, BLU, ARANCIO, VERDE,
                                ROSSO, GIALLO, GRIGLIA, CB, it, pc, card, kpi,
                                griglia, riga_tab, linea, testo, anni_su,
                                ratios, corr_mesi, mensili_pct, rend_anno,
                                regimi, FASCE, costi_misurati, NLEG, CLEG)
import montecarlo_validazione as MC

PAG = [0]
def pagina(titolo, sottotitolo, sezione=''):
    PAG[0] += 1
    fig = plt.figure(figsize=(8.27, 11.69))
    fig.text(.062, .960, titolo, fontsize=20, color=INK, weight='bold')
    fig.text(.062, .938, sottotitolo, fontsize=8.6, color=INK2)
    fig.text(.938, .962, sezione, fontsize=8.4, color=INK3, ha='right', weight='bold')
    fig.text(.938, .945, f'V1XAU · pag. {PAG[0]} di 9', fontsize=7.4, color=INK3, ha='right')
    fig.add_artist(Rectangle((.062, .928), .876, .0015, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))
    return fig

def titoletto(fig, y, s, col=None):
    fig.text(.062, y, s, fontsize=11.5, color=col or INK, weight='bold')

# ======================================================================
#  COMPRA E TIENI — serie XAUUSD ricavata dalle esecuzioni del backtest
#
#  Si prende la MEDIANA dei prezzi di ogni giorno: toglie il rimbalzo fra
#  prezzo in acquisto e in vendita senza perdere risoluzione. Resta
#  un'approssimazione ricavata dal backtest, non il listino ufficiale.
# ======================================================================
def oro_giornaliero(b):
    from collections import defaultdict
    g = defaultdict(list)
    for o in b['ops']:
        if o.prezzo_in > 0:  g[o.apertura[:10]].append(o.prezzo_in)
        if o.prezzo_out > 0: g[o.chiusura[:10]].append(o.prezzo_out)
    gg = sorted(g)
    return gg, [st.median(g[k]) for k in gg]

def _dd(v):
    v = np.asarray(v, float); pk = np.maximum.accumulate(v)
    return 100*float(((pk - v)/pk).max())

def bh_stat(b):
    gg, v = oro_giornaliero(b)
    rend = 100*(v[-1]/v[0] - 1)
    dd = _dd(v)
    ann = {}
    for a in sorted({k[:4] for k in gg}):
        dentro = [i for i, k in enumerate(gg) if k[:4] == a]
        i0 = dentro[0]-1 if dentro[0] > 0 else dentro[0]
        ann[a] = 100*(v[dentro[-1]]/v[i0] - 1)
    return {'date': gg, 'px': v, 'rend': rend, 'dd': dd,
            'rd': rend/dd if dd else float('nan'), 'anni': ann,
            'picco': max(v), 'minimo': min(v)}

def strategia_a_rischio(b, f):
    """Curva composta a un rischio qualunque, dalle stesse operazioni."""
    eq = np.cumprod(1.0 + np.asarray(b['R'], float) * f)
    return 100*(eq[-1] - 1), _dd(eq), eq

def rischio_pari_dd(b, dd_bersaglio):
    """A che rischio la strategia soffre quanto il compra-e-tieni."""
    lo, hi = 0.0005, 0.030
    for _ in range(40):
        m = (lo + hi)/2
        if strategia_a_rischio(b, m)[1] < dd_bersaglio: lo = m
        else: hi = m
    r, d, _e = strategia_a_rischio(b, lo)
    return lo, r, d

# ======================================================================
def carica_tutto(percorsi, nomi, qualita, rt):
    B = []
    for p, nome, r in zip(percorsi, nomi, rt):
        ops, amb, res = leggi(p, rischio_test=r)
        b = {'nome': nome, 'ops': ops, 'amb': amb, 'aperte': res,
             'R': [o.R for o in ops], 'date': [o.chiusura for o in ops],
             'anni': per_anno(ops), 'prezzi': prezzo_mensile(ops),
             'tot': stat(ops), 'cmp': stat_composto(ops),
             'eqF': equity_fissa(ops), 'eqC': equity_composta(ops),
             'IS': taglia(ops, al='2023.12.31'), 'OOS': taglia(ops, dal=CONFINE_OOS)}
        b['sIS'], b['sOOS'] = stat(b['IS']), stat(b['OOS'])
        b['cIS'], b['cOOS'] = stat_composto(b['IS']), stat_composto(b['OOS'])
        b['mesi'] = {}
        for o in ops: b['mesi'].setdefault(o.chiusura[:7], []).append(o)
        B.append(b)
    d0, d1 = B[0]['date'][0], B[0]['date'][-1]
    C = {'b': B, 'nomi': nomi, 'qualita': qualita, 'bh': bh_stat(B[0]),
         'dal': min(x['date'][0][:10] for x in B), 'al': max(x['date'][-1][:10] for x in B),
         'anni_tot': sorted(set().union(*[set(x['anni']) for x in B])),
         'durata': (int(d1[:4])+int(d1[5:7])/12) - (int(d0[:4])+int(d0[5:7])/12)}
    return C

def verifica(C):
    print('--- riconciliazioni ---')
    ok = True
    for b in C['b']:
        t, c = b['tot'], b['cmp']
        prove = [
          ('utile fisso = 100 x R', abs(t['utile'] - 100*t['R']) < 1e-6),
          ('anni fisso = totale',
           abs(sum(sum(o.utile for o in v) for v in b['anni'].values()) - t['utile']) < 1e-6),
          ('anni composto = totale',
           abs(sum(sum(o.netto for o in v) for v in b['anni'].values()) - c['utile']) < 1e-6),
          ('IS + OOS = campione', len(b['IS']) + len(b['OOS']) == t['n']),
          ('saldo finale = dep + utile', abs(b['eqC'][-1] - (DEPOSITO + c['utile'])) < 1e-6),
          ('nessuna posizione aperta', b['aperte'] == 0),
        ]
        for n, e in prove:
            print(f"  {b['nome']:12} {n:28} {'OK' if e else '*** ERRORE ***'}"); ok &= e
    if not ok: raise SystemExit('riconciliazione fallita')
    print('  tutte le riconciliazioni passano\n')

# ======================================================================
#  1 — SINTESI
# ======================================================================
def p1(pdf, C, mc):
    fig = pagina('Sintesi', f"V1XAU Trend Following · XAUUSD · {C['dal']} → {C['al']} · "
                 f"deposito {it(DEPOSITO)}", 'SINTESI')
    testo(fig, .062, .905,
          "Gli stessi dati letti in due modi. A RISCHIO FISSO ogni operazione rischia sempre 100 e la\n"
          "pendenza della curva e' la bravura. A COMPOSTO le posizioni crescono col conto: dice quanto\n"
          "avrebbe fatto davvero, e quanto sarebbe stato profondo il drawdown. Nessuno dei due e'\n"
          "«quello giusto» — rispondono a domande diverse e non vanno mai mescolati.")
    y0 = .716
    for i, b in enumerate(C['b']):
        t, c = b['tot'], b['cmp']
        y = y0 - i*.172
        fig.text(.062, y+.096, b['nome'], fontsize=13, color=CB[i], weight='bold')
        fig.text(.062, y+.080, f"qualita' storico {C['qualita'][i]} · {t['n']} operazioni · "
                 f"{it(t['n']/C['durata'],0)} l'anno", fontsize=7.6, color=INK3)
        fig.text(.062, y+.062, 'RISCHIO FISSO', fontsize=7.4, color=INK3, weight='bold')
        for k, (v, e, col) in enumerate([
                (pc(t['rend']), 'rendimento', VERDE),
                (it(t['R'],1), 'punti R', INK),
                (it(t['pf'],3), 'profit factor', INK),
                (it(t['dd'],1)+'%', 'drawdown max', GIALLO)]):
            kpi(fig, .062 + k*.222, y+.012, .206, v, e, col, h=.044)
        fig.text(.062, y+.000, 'COMPOSTO', fontsize=7.4, color=INK3, weight='bold')
        for k, (v, e, col) in enumerate([
                (pc(c['rend'],0), 'rendimento', VERDE),
                (pc(cagr(c['finale'], C['durata']),1), 'CAGR', INK),
                (it(c['pf'],3), 'profit factor', INK),
                (it(c['dd'],1)+'%', 'drawdown max', ROSSO)]):
            kpi(fig, .062 + k*.222, y-.050, .206, v, e, col, h=.044)
    linea(fig, .462, .062, .938)
    titoletto(fig, .438, 'Le risposte in breve')
    A, B = C['b']
    R = [("Il vantaggio regge fuori campione?",
          f"si: {pc(A['sOOS']['rend'])} e {pc(B['sOOS']['rend'])} a rischio fisso su dati mai visti, "
          f"PF {it(A['sOOS']['pf'],2)} e {it(B['sOOS']['pf'],2)}", VERDE),
         ("Regge al cambio di broker?",
          f"si: {it(A['tot']['R_op'],4)} contro {it(B['tot']['R_op'],4)} R per operazione, "
          f"correlazione mensile {it(corr_mesi(A,B),2)}", VERDE),
         ("Il risultato e' distribuito nel tempo?",
          f"no: il {it(100*A['sOOS']['R']/A['tot']['R'],0)}% dei punti R arriva dagli ultimi 2 anni "
          f"e 9 mesi, che sono il {it(100*len(A['OOS'])/A['tot']['n'],0)}% delle operazioni", ROSSO),
         ("Che numero usare per il futuro?",
          f"il peggiore dei due: {it(min(A['tot']['R_op'], B['tot']['R_op']),4)} R per operazione", GIALLO),
         ("Che drawdown mettere in conto?",
          f"Monte Carlo al 90° percentile: {it(np.percentile(mc[0]['blocchi']['dd_pct'],90),1)}% e "
          f"{it(np.percentile(mc[1]['blocchi']['dd_pct'],90),1)}% a rischio fisso", ROSSO)]
    y = .400
    for d, r, c in R:
        fig.text(.062, y, d, fontsize=8.8, color=INK3)
        fig.text(.062, y-.019, r, fontsize=9.3, color=c, weight='bold')
        y -= .050
    card(fig, .062, .058, .876, .098, GIALLO)
    fig.text(.082, .129, "Quello che il dossier NON dimostra", fontsize=11, color=INK, weight='bold')
    testo(fig, .082, .109,
          "Due broker sono due listini sugli STESSI anni dello STESSO mercato: non sono due prove\n"
          "indipendenti. E nessun backtest misura slittamento, rifiuti e allargamenti di spread veri.\n"
          "Quelle due cose le risponde solo la demo in avanti.", 8.3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  2 — LE DUE LETTURE
# ======================================================================
def p2(pdf, C):
    fig = pagina('Le due letture a confronto', 'stessa passata, stessi trade, due modi di contare',
                 'CURVE')
    A, B = C['b']
    for j, (chiave, tit, nota) in enumerate([
            ('eqF', 'A RISCHIO FISSO — ogni operazione rischia 100',
             'la pendenza e\' la bravura: nessun anno viene amplificato dalla dimensione del conto'),
            ('eqC', 'A INTERESSE COMPOSTO — con il compra-e-tieni a confronto',
             'e\' il saldo vero della passata, ed e\' l\'unico piano su cui il confronto col compra-e-tieni ha senso')]):
        alto = .650 - j*.255
        ax = fig.add_axes([.095, alto, .845, .190])
        for i, b in enumerate(C['b']):
            e = b[chiave]
            ax.plot(range(len(e)), [100*(x-DEPOSITO)/DEPOSITO for x in e],
                    color=CB[i], lw=1.9,
                    label=f"{b['nome']}  {pc(b['tot' if j==0 else 'cmp']['rend'],0)}")
        if j == 1:      # il confronto col compra-e-tieni ha senso solo a composto
            bh = C['bh']
            idx = []
            for d in bh['date']:
                k = [t for t, x in enumerate(A['date']) if x[:10] <= d]
                idx.append(k[-1] if k else 0)
            ax.plot(idx, [100*(x/bh['px'][0]-1) for x in bh['px']], color=INK3, lw=1.7,
                    ls='--', label=f"compra e tieni XAUUSD  {pc(bh['rend'],0)}")
        ax.axhline(0, color=INK3, lw=.9)
        vis = anni_su(ax, A['date'], 0, 0)
        ax.set_xticks(list(vis.values())); ax.set_xticklabels(list(vis), fontsize=8.4)
        griglia(ax); ax.legend(frameon=False, fontsize=8.6, labelcolor=INK2, loc='upper left')
        ax.set_ylabel('rendimento cumulato %', fontsize=8)
        fig.text(.095, alto + .212, tit, fontsize=9.5, color=INK, weight='bold')
        fig.text(.095, alto + .197, nota, fontsize=7.8, color=INK3)

    y = .345
    xs = [(.062,'left'), (.40,'right'), (.545,'right'), (.72,'right'), (.895,'right')]
    riga_tab(fig, y, ['', f"{A['nome']}\nfisso", f"{A['nome']}\ncomposto",
                      f"{B['nome']}\nfisso", f"{B['nome']}\ncomposto"], xs, 7.4, INK3, 'bold')
    linea(fig, y-.016, .062, .938); y -= .034
    F = [('Rendimento totale', 'rend', lambda v: pc(v,0)),
         ('Saldo finale', None, None),
         ('Profit factor', 'pf', lambda v: it(v,3)),
         ('Vincita media / perdita media', None, 'medie'),
         ('Drawdown massimo', 'dd', lambda v: it(v,2)+'%'),
         ('Fattore di recupero', 'recupero', lambda v: it(v,2))]
    for et, k, f in F:
        if f == 'medie':
            riga_tab(fig, y, [et,
                f"{it(A['tot']['media_v'],0)} / {it(A['tot']['media_p'],0)}",
                f"{it(A['cmp']['media_v'],0)} / {it(A['cmp']['media_p'],0)}",
                f"{it(B['tot']['media_v'],0)} / {it(B['tot']['media_p'],0)}",
                f"{it(B['cmp']['media_v'],0)} / {it(B['cmp']['media_p'],0)}"], xs, 8.5, INK)
        elif k is None:
            riga_tab(fig, y, [et, it(DEPOSITO + A['tot']['utile'],0), it(A['cmp']['finale'],0),
                              it(DEPOSITO + B['tot']['utile'],0), it(B['cmp']['finale'],0)], xs, 8.5, INK)
        else:
            riga_tab(fig, y, [et, f(A['tot'][k]), f(A['cmp'][k]),
                              f(B['tot'][k]), f(B['cmp'][k])], xs, 8.5, INK)
        y -= .0225
    y -= .016
    card(fig, .062, y-.106, .876, .098)
    fig.text(.082, y-.026, "Perche' i due drawdown sono diversi", fontsize=11, color=INK, weight='bold')
    testo(fig, .082, y-.046,
          f"A composto il drawdown e' {it(A['cmp']['dd'],1)}% e {it(B['cmp']['dd'],1)}%, contro "
          f"{it(A['tot']['dd'],1)}% e {it(B['tot']['dd'],1)}% a rischio fisso. Non e' un errore: a\n"
          "composto una serie di perdite che arriva quando il conto e' grande costa molto di piu' in\n"
          "percentuale. Per DECIDERE quanto rischiare si guarda il composto, che e' quello che si\n"
          "soffre davvero; per CAPIRE se la strategia funziona si guarda il rischio fisso.", 8.3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  3 — CONVIENE, RISPETTO AL COMPRA-E-TIENI?
# ======================================================================
def p_conviene(pdf, C):
    A, B = C['b']; bh = C['bh']
    fig = pagina('Conviene, rispetto al compra-e-tieni?',
                 'la domanda vera: valeva la pena costruire una strategia?', 'CONFRONTO')
    testo(fig, .062, .905,
          "Confrontare i rendimenti e basta non risponde: con piu' rischio si alza il rendimento di\n"
          "qualunque strategia. La domanda giusta e' A PARITA' DI SOFFERENZA — cioe' con lo stesso\n"
          "drawdown massimo del compra-e-tieni — chi porta a casa di piu'.")

    # --- la risposta, grande ---
    y = .830
    for i, b in enumerate(C['b']):
        f, rend, dd = rischio_pari_dd(b, bh['dd'])
        card(fig, .062 + i*.452, y-.105, .424, .100, CB[i])
        fig.text(.082 + i*.452, y-.024, b['nome'], fontsize=10, color=CB[i], weight='bold')
        fig.text(.082 + i*.452, y-.052, pc(rend,0), fontsize=22, color=VERDE, weight='bold')
        fig.text(.082 + i*.452, y-.072, f"contro {pc(bh['rend'],0)} del compra-e-tieni",
                 fontsize=8.2, color=INK2)
        fig.text(.082 + i*.452, y-.090,
                 f"stesso drawdown ({it(bh['dd'],1)}%), rischio {it(100*f,2)}% per operazione",
                 fontsize=7.6, color=INK3)
    fig.text(.062, y-.130, f"Cioe' {it(rischio_pari_dd(A, bh['dd'])[1]/bh['rend'],1)}× e "
             f"{it(rischio_pari_dd(B, bh['dd'])[1]/bh['rend'],1)}× il compra-e-tieni, "
             "sopportando esattamente lo stesso calo massimo.", fontsize=9.6, color=INK, weight='bold')

    # --- la scala del rischio ---
    y = .655
    titoletto(fig, y, 'La scala completa: rendimento e drawdown a ogni rischio'); y -= .030
    xs = [(.062,'left'), (.30,'right'), (.44,'right'), (.575,'right'),
          (.715,'right'), (.855,'right'), (.938,'right')]
    riga_tab(fig, y, ['rischio', f"{A['nome']}\nrendimento", 'drawdown',
                      f"{B['nome']}\nrendimento", 'drawdown', '', ''], xs, 7.4, INK3, 'bold')
    linea(fig, y-.016, .062, .938); y -= .034
    for f in (0.0025, 0.0050, 0.0070, 0.0100, 0.0150):
        ra, da, _ = strategia_a_rischio(A, f)
        rb, db, _ = strategia_a_rischio(B, f)
        riga_tab(fig, y, [it(100*f,2)+'%', pc(ra,0), it(da,1)+'%', pc(rb,0), it(db,1)+'%', '', ''],
                 xs, 8.5, INK)
        y -= .0225
    linea(fig, y+.012, .062, .938); y -= .014
    riga_tab(fig, y, ['COMPRA E TIENI', pc(bh['rend'],0), it(bh['dd'],1)+'%',
                      pc(bh['rend'],0), it(bh['dd'],1)+'%', '', ''], xs, 8.6, INK3, 'bold')
    y -= .030
    testo(fig, .062, y,
          "Si legge cosi': si cerca la riga con lo stesso drawdown dell'ultima, e si confrontano i\n"
          "rendimenti. A rischi piu' bassi la strategia rende meno del compra-e-tieni, ma soffre anche\n"
          "molto meno: a 0,50% fa circa il rendimento dell'oro con meta' del suo drawdown.", 8.1, INK3)

    # --- anno per anno contro l'oro ---
    y -= .072
    titoletto(fig, y, "Anno per anno contro l'oro, a composto all'1%"); y -= .030
    xs2 = [(.062,'left'), (.34,'right'), (.56,'right'), (.80,'right')]
    riga_tab(fig, y, ['anno', A['nome'], B['nome'], 'compra e tieni'], xs2, 7.8, INK3, 'bold')
    linea(fig, y-.009, .062, .938); y -= .024
    def comp_anno(b, a):
        ops = b['anni'].get(a, [])
        if not ops: return 0.0
        i = b['ops'].index(ops[0])
        inizio = DEPOSITO if i == 0 else b['ops'][i-1].saldo
        return 100*(ops[-1].saldo/inizio - 1) if inizio > 0 else 0.0
    meglio = 0
    for a in C['anni_tot']:
        va, vb, vo = comp_anno(A, a), comp_anno(B, a), bh['anni'].get(a, 0.0)
        if va > vo: meglio += 1
        riga_tab(fig, y, [a, None, None, None], xs2, 8.5, INK)
        for k, v, col in ((1, va, CB[0]), (2, vb, CB[1]), (3, vo, INK3)):
            fig.text(xs2[k][0], y, pc(v), fontsize=8.5, ha='right', weight='bold',
                     color=(VERDE if v > 0 else ROSSO) if k < 3 else INK3)
        y -= .0205
    y -= .014
    card(fig, .062, y-.112, .876, .104, VERDE)
    fig.text(.082, y-.026, 'La risposta, per intero', fontsize=11, color=INK, weight='bold')
    testo(fig, .082, y-.046,
          f"Si, e' valsa la pena: a parita' di drawdown la strategia rende fra 2 e 3 volte il compra-e-\n"
          f"tieni, e batte l'oro in {meglio} anni su {len(C['anni_tot'])}. Ma il vantaggio vero non e' solo il rendimento:\n"
          f"e' che lo stop e' sempre a mercato e il rischio per operazione e' deciso da te, mentre chi\n"
          f"tiene e basta si prende ogni discesa per intero — compreso il {it(bh['dd'],1)}% del 2026.", 8.3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  4 — ANNO PER ANNO
# ======================================================================
def p3(pdf, C):
    fig = pagina('Anno per anno', 'distribuito nel tempo, o concentrato di recente?', 'CONSISTENZA')
    A, B = C['b']
    rA, rB = rend_anno(A), rend_anno(B)
    anni = C['anni_tot']
    ax = fig.add_axes([.095, .655, .845, .200])
    x = np.arange(len(anni)); w = .38
    for i, (b, r) in enumerate(((A, rA), (B, rB))):
        v = [r.get(a, 0) for a in anni]
        ax.bar(x+(i-.5)*w, v, w, color=CB[i], label=b['nome'])
        for j, val in enumerate(v):
            ax.text(x[j]+(i-.5)*w, val + (2 if val >= 0 else -5.5), pc(val,0),
                    fontsize=7.6, color=CB[i], ha='center', weight='bold')
    ax.set_xticks(x); ax.set_xticklabels(anni, fontsize=9)
    ax.axhline(0, color=INK3, lw=1); griglia(ax)
    ax.legend(frameon=False, fontsize=8.6, labelcolor=INK2, loc='upper left')
    ax.set_ylabel('rendimento annuo %, a rischio fisso', fontsize=8)
    lo, hi = ax.get_ylim(); ax.set_ylim(lo-5, hi+9)
    fig.text(.095, .863, 'A rischio fisso, cosi\' gli anni sono confrontabili fra loro',
             fontsize=7.8, color=INK3)

    y = .610
    xs = [(.062,'left'), (.255,'right'), (.395,'right'), (.545,'right'),
          (.685,'right'), (.815,'right'), (.938,'right')]
    riga_tab(fig, y, ['anno', f"{A['nome']}\nfisso", f"{A['nome']}\ncomposto",
                      f"{B['nome']}\nfisso", f"{B['nome']}\ncomposto",
                      'compra\ne tieni', 'operazioni'], xs, 7.2, INK3, 'bold')
    linea(fig, y-.016, .062, .938); y -= .034
    # a composto il rendimento dell'anno va misurato sul saldo di INIZIO
    # anno, non sul deposito iniziale: altrimenti gli ultimi anni
    # risultano enormi solo perche' il conto era gia' cresciuto
    def comp_anno(b, a):
        ops = b['anni'].get(a, [])
        if not ops: return 0.0
        i = b['ops'].index(ops[0])
        inizio = DEPOSITO if i == 0 else b['ops'][i-1].saldo
        return 100*(ops[-1].saldo/inizio - 1) if inizio > 0 else 0.0

    for a in anni:
        oa, ob = A['anni'].get(a, []), B['anni'].get(a, [])
        ca, cb = comp_anno(A, a), comp_anno(B, a)
        riga_tab(fig, y, [a + (' *' if a in (anni[0], anni[-1]) else ''),
                          None, None, None, None, None,
                          f"{len(oa)} / {len(ob)}"], xs, 8.4, INK)
        for k, v in ((1, rA.get(a,0)), (2, ca), (3, rB.get(a,0)), (4, cb)):
            fig.text(xs[k][0], y, pc(v), fontsize=8.4, ha='right',
                     color=VERDE if v > 0 else ROSSO, weight='bold')
        fig.text(xs[5][0], y, pc(C['bh']['anni'].get(a, 0.0)), fontsize=8.4, ha='right',
                 color=INK3, weight='bold')
        y -= .0215
    linea(fig, y+.012, .062, .938); y -= .014
    riga_tab(fig, y, ['TOTALE', pc(A['tot']['rend'],0), pc(A['cmp']['rend'],0),
                      pc(B['tot']['rend'],0), pc(B['cmp']['rend'],0),
                      pc(C['bh']['rend'],0),
                      f"{A['tot']['n']} / {B['tot']['n']}"], xs, 8.6, INK, 'bold')
    y -= .030
    testo(fig, .062, y+.006,
          "* anno parziale: il test parte a settembre 2019 e finisce a settembre 2026.\n"
          "A composto ogni anno e' misurato sul saldo di INIZIO anno, non sul deposito iniziale.",
          7.4, INK3)

    y -= .034
    xs2 = [(.062,'left'), (.50,'right'), (.78,'right')]
    riga_tab(fig, y, ['a rischio fisso', A['nome'], B['nome']], xs2, 8.0, INK3, 'bold')
    linea(fig, y-.009, .062, .938); y -= .024
    vA, vB = list(rA.values()), list(rB.values())
    for et, a, b_ in [
        ('Rendimento annuo medio', pc(st.mean(vA)), pc(st.mean(vB))),
        ('Rendimento annuo mediano', pc(st.median(vA)), pc(st.median(vB))),
        ('Deviazione standard fra anni', it(st.pstdev(vA),1)+'%', it(st.pstdev(vB),1)+'%'),
        ('Anni in utile', f"{sum(1 for v in vA if v>0)} su {len(vA)}",
                          f"{sum(1 for v in vB if v>0)} su {len(vB)}"),
        ('Anni sopra il +10%', f"{sum(1 for v in vA if v>10)} su {len(vA)}",
                               f"{sum(1 for v in vB if v>10)} su {len(vB)}"),
        ('Quota di R dal 2024 in poi', it(100*A['sOOS']['R']/A['tot']['R'],0)+'%',
                                       it(100*B['sOOS']['R']/B['tot']['R'],0)+'%')]:
        riga_tab(fig, y, [et, a, b_], xs2, 8.5, INK); y -= .0215

    y -= .014
    deboli = [a for a in anni if rA.get(a,0) < 10 and rB.get(a,0) < 10]
    card(fig, .062, y-.092, .876, .086, ROSSO)
    fig.text(.082, y-.026, f"{len(deboli)} anni su {len(anni)} sotto il +10%: "
             f"{', '.join(deboli)}", fontsize=11, color=INK, weight='bold')
    testo(fig, .082, y-.046,
          "Non sono anni brutti a caso: sono quelli in cui l'oro e' stato fermo. Tradotto in pratica,\n"
          "12-18 mesi senza guadagnare sono dentro la normalita' storica di questa strategia.", 8.3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  4 — IS/OOS E BROKER
# ======================================================================
def p4(pdf, C):
    fig = pagina('Fuori campione e broker',
                 f"confine fissato prima del test: IS fino al 2023.12.31, OOS dal {CONFINE_OOS}",
                 'VALIDAZIONE')
    A, B = C['b']
    ax = fig.add_axes([.095, .680, .845, .190])
    for i, b in enumerate(C['b']):
        ax.plot(range(len(b['eqF'])), [100*(x-DEPOSITO)/DEPOSITO for x in b['eqF']],
                color=CB[i], lw=1.9, label=b['nome'])
    k = next(j for j, d in enumerate(A['date']) if d[:10] >= CONFINE_OOS)
    ylo, yhi = ax.get_ylim(); top = yhi*1.38
    ax.set_ylim(ylo, top)
    ax.axvline(k, color=GIALLO, lw=1.8, ls='--')
    ax.axhline(yhi*1.06, color=GRIGLIA, lw=.8)
    for xm, et, ch in ((k*.5, 'DENTRO CAMPIONE', 'sIS'),
                       (k+(len(A['eqF'])-k)*.5, 'FUORI CAMPIONE', 'sOOS')):
        ax.text(xm, top*.975, et, fontsize=8.4, color=GIALLO, ha='center', va='top', weight='bold')
        for i, b in enumerate(C['b']):
            ax.text(xm, top*(.915-.055*i), f"{b['nome']}  {pc(b[ch]['rend'])}",
                    fontsize=8.4, color=CB[i], ha='center', va='top', weight='bold')
    vis = anni_su(ax, A['date'], 0, 0)
    ax.set_xticks(list(vis.values())); ax.set_xticklabels(list(vis), fontsize=8.4)
    ax.axhline(0, color=INK3, lw=.9); griglia(ax)
    ax.legend(frameon=False, fontsize=8.2, labelcolor=INK2, loc='upper left')
    ax.set_ylabel('rendimento % a rischio fisso', fontsize=8)

    y = .640
    xs = [(.062,'left'), (.34,'right'), (.50,'right'), (.68,'right'), (.855,'right')]
    riga_tab(fig, y, ['a rischio fisso', f"IS {A['nome']}", f"OOS {A['nome']}",
                      f"IS {B['nome']}", f"OOS {B['nome']}"], xs, 7.4, INK3, 'bold')
    linea(fig, y-.009, .062, .938); y -= .026
    for et, kk, f in [('Rendimento', 'rend', lambda v: pc(v)),
                      ('Punti R', 'R', lambda v: it(v,1)),
                      ('R per operazione', 'R_op', lambda v: it(v,4)),
                      ('Profit factor', 'pf', lambda v: it(v,3)),
                      ('Operazioni', 'n', lambda v: it(v)),
                      ('Drawdown massimo', 'dd', lambda v: it(v,1)+'%')]:
        riga_tab(fig, y, [et, f(A['sIS'][kk]), f(A['sOOS'][kk]),
                          f(B['sIS'][kk]), f(B['sOOS'][kk])], xs, 8.5, INK)
        y -= .0215
    riga_tab(fig, y, ['Rendimento a composto', pc(A['cIS']['rend'],0), pc(A['cOOS']['rend'],0),
                      pc(B['cIS']['rend'],0), pc(B['cOOS']['rend'],0)], xs, 8.5, INK2)
    y -= .040

    titoletto(fig, y, 'I due broker, sullo stesso periodo'); y -= .028
    xs2 = [(.062,'left'), (.52,'right'), (.74,'right'), (.938,'right')]
    riga_tab(fig, y, ['', A['nome'], B['nome'], 'scarto'], xs2, 8.0, INK3, 'bold')
    linea(fig, y-.009, .062, .938); y -= .024
    def sc(a, b_):
        m = max(abs(a), abs(b_))
        return it(100*abs(a-b_)/m,1)+'%' if m else '—'
    F = [('R per operazione (fisso)', it(A['tot']['R_op'],4), it(B['tot']['R_op'],4),
          sc(A['tot']['R_op'], B['tot']['R_op'])),
         ('Operazioni', it(A['tot']['n']), it(B['tot']['n']), sc(A['tot']['n'], B['tot']['n'])),
         ('Profit factor (fisso)', it(A['tot']['pf'],3), it(B['tot']['pf'],3),
          sc(A['tot']['pf'], B['tot']['pf'])),
         ('Drawdown (composto)', it(A['cmp']['dd'],1)+'%', it(B['cmp']['dd'],1)+'%',
          sc(A['cmp']['dd'], B['cmp']['dd'])),
         ('Tenuta media', it(A['tot']['durata_media'],0)+' h', it(B['tot']['durata_media'],0)+' h',
          sc(A['tot']['durata_media'], B['tot']['durata_media']))]
    for et, a, b_, s in F:
        riga_tab(fig, y, [et, a, b_, None], xs2, 8.5, INK)
        fig.text(.938, y, s, fontsize=8.4, ha='right',
                 color=VERDE if float(s[:-1].replace(',','.')) < 10 else GIALLO, weight='bold')
        y -= .0215
    for tag in ('S2-PULLB', 'S3-DONCH'):
        sa = stat([o for o in A['ops'] if o.tag == tag])
        sb = stat([o for o in B['ops'] if o.tag == tag])
        d = 100*abs(sa['n']-sb['n'])/max(sa['n'], sb['n'])
        riga_tab(fig, y, [None, f"{sa['n']} oper.", f"{sb['n']} oper.", None], xs2, 8.5, INK)
        fig.text(.062, y, NLEG[tag], fontsize=8.5, color=CLEG[tag], weight='bold')
        fig.text(.938, y, it(d,1)+'%', fontsize=8.4, ha='right',
                 color=VERDE if d < 3 else GIALLO, weight='bold')
        y -= .0215

    y -= .014
    card(fig, .062, y-.158, .876, .150, VERDE)
    fig.text(.082, y-.028, 'Che cosa dicono queste due tabelle', fontsize=11, color=INK, weight='bold')
    testo(fig, .082, y-.048,
          f"Il vantaggio sopravvive ai dati mai visti: PF {it(A['sOOS']['pf'],2)} e "
          f"{it(B['sOOS']['pf'],2)} fuori campione, guardato una volta sola.\n"
          f"E sopravvive al cambio di listino: correlazione mensile {it(corr_mesi(A,B),2)}, e la gamba "
          f"lenta su H4 fa\nlo stesso identico numero di operazioni su tutti e due i broker.\n\n"
          "L'avvertimento e' che il fuori campione rende PIU' del periodo di costruzione. Non e' una\n"
          "buona notizia: il 2024-2026 e' stato eccezionale per l'oro. Per il futuro vale il numero piu'\n"
          "basso dei due periodi, non il piu' alto.", 8.3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  5 — REGIMI
# ======================================================================
def p5(pdf, C):
    fig = pagina('Quando funziona e quando no', 'il fattore singolo piu\' importante del risultato',
                 'REGIMI')
    A, B = C['b']
    regA, volA, _ = regimi(A)
    ax = fig.add_axes([.095, .640, .845, .200])
    x = np.arange(len(FASCE)); w = .38
    for i, b in enumerate(C['b']):
        r, _v, _x = regimi(b)
        v = [(sum(o.R for o in r[n][1])/r[n][0] if r[n][0] else 0.0) for n, _, _2 in FASCE]
        ax.bar(x+(i-.5)*w, v, w, color=CB[i], label=b['nome'])
        for j, val in enumerate(v):
            ax.text(x[j]+(i-.5)*w, val + (.15 if val >= 0 else -.45), it(val,1),
                    fontsize=7.6, color=CB[i], ha='center', weight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels([f"{n}\n({regA[n][0]} mesi)" for n, _, _2 in FASCE], fontsize=8.4)
    ax.axhline(0, color=INK3, lw=1); griglia(ax)
    ax.legend(frameon=False, fontsize=8.6, labelcolor=INK2, loc='upper center')
    ax.set_ylabel('punti R medi al mese', fontsize=8)
    lo, hi = ax.get_ylim(); ax.set_ylim(lo-.6, hi+1.0)
    fig.text(.095, .848, "Punti R al mese secondo quanto si e' mosso l'oro in quel mese",
             fontsize=7.8, color=INK3)

    y = .595
    xs = [(.062,'left'), (.30,'right'), (.44,'right'), (.60,'right'), (.76,'right'), (.938,'right')]
    for i, b in enumerate(C['b']):
        r, vv, _ = regimi(b)
        fig.text(.062, y, b['nome'], fontsize=10, color=CB[i], weight='bold'); y -= .024
        riga_tab(fig, y, ['regime', 'mesi', 'oper.', 'punti R', 'R per oper.', 'profit factor'],
                 xs, 7.6, INK3, 'bold')
        linea(fig, y-.009, .062, .938); y -= .024
        for nome, _, _2 in FASCE:
            nm, ops = r[nome]
            if not ops: continue
            s = stat(ops)
            riga_tab(fig, y, [nome, it(nm), it(s['n']), None, it(s['R_op'],3), it(s['pf'],2)],
                     xs, 8.3, INK)
            fig.text(.60, y, it(s['R'],1), fontsize=8.3, ha='right',
                     color=VERDE if s['R'] > 0 else ROSSO, weight='bold')
            y -= .0205
        linea(fig, y+.011, .062, .938); y -= .012
        for k, col in (('alta', VERDE), ('bassa', ROSSO)):
            nm, ops = vv[k]
            s = stat(ops)
            riga_tab(fig, y, [f"volatilita' {k}", it(nm), it(s['n']), None,
                              it(s['R_op'],3), it(s['pf'],2)], xs, 8.3, INK2)
            fig.text(.60, y, it(s['R'],1), fontsize=8.3, ha='right', color=col, weight='bold')
            y -= .0205
        y -= .022

    card(fig, .062, y-.130, .876, .122, GIALLO)
    fig.text(.082, y-.028, "Il nemico non e' la direzione: e' l'immobilita'",
             fontsize=11.5, color=INK, weight='bold')
    sA = stat(volA['alta'][1]); sB = stat(volA['bassa'][1])
    testo(fig, .082, y-.050,
          f"Guadagna ai due estremi — forte salita E forte discesa — e perde quando l'oro non va da\n"
          f"nessuna parte. Non serve che l'oro salga: serve che si muova.\n\n"
          f"La volatilita' separa il risultato meglio della direzione: su {A['nome']} i mesi ad alta\n"
          f"volatilita' fanno {it(sA['R'],1)} punti R, quelli a bassa {it(sB['R'],1)}. Stesso numero di mesi.\n"
          f"E' anche il motivo per cui gli anni a vuoto sono quelli che sono.", 8.3)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  6 — MONTE CARLO
# ======================================================================
def p6(pdf, C, mc, mcC):
    fig = pagina('Monte Carlo', 'bootstrap a blocchi di 20 · 20.000 scenari · le serie di perdite restano intere',
                 'RISCHIO')
    testo(fig, .062, .905,
          "Il backtest e' UN SOLO percorso. Si rimescolano le operazioni vere a blocchi contigui — cosi'\n"
          "le perdite in fila non vengono spezzate — e si guarda dove finiscono gli altri percorsi possibili.")
    for j, (dati, tit) in enumerate([(mc, 'A RISCHIO FISSO'), (mcC, 'A COMPOSTO')]):
        ax = fig.add_axes([.095 + j*.455, .700, .390, .150])
        for i, b in enumerate(C['b']):
            ax.hist(dati[i]['blocchi']['dd_pct'], bins=60, color=CB[i], alpha=.58, label=b['nome'])
        ax.axvline(35, color=ROSSO, lw=1.4, ls='--')
        ax.text(35.8, ax.get_ylim()[1]*.90, 'tetto 35%', fontsize=7.4, color=ROSSO)
        griglia(ax)
        if j == 0: ax.legend(frameon=False, fontsize=7.6, labelcolor=INK2)
        ax.set_xlabel('drawdown massimo %', fontsize=8)
        ax.set_title(tit, fontsize=9, color=INK, loc='left', pad=6, weight='bold')

    y = .645
    titoletto(fig, y, 'Rendimento finale: percentili BASSI = scenari peggiori'); y -= .030
    xs = [(.062,'left')] + [(.325 + k*.088, 'right') for k in range(7)]
    riga_tab(fig, y, [''] + [f'P{p}' for p in MC.PERCENTILI], xs, 7.8, INK3, 'bold')
    linea(fig, y-.009, .062, .938); y -= .024
    for i, b in enumerate(C['b']):
        for et, dati, f in ((f"{b['nome']} · fisso", mc, lambda v: pc(v,0)),
                            (f"{b['nome']} · composto", mcC, lambda v: pc(v,0))):
            t = MC.tabella(dati[i]['blocchi'], 'rend')
            riga_tab(fig, y, [None] + [f(t[p]) for p in MC.PERCENTILI], xs, 8.2, INK)
            fig.text(.062, y, et, fontsize=8.2, color=CB[i] if 'fisso' in et else INK2,
                     weight='bold' if 'fisso' in et else 'normal')
            y -= .0205
    y -= .018
    titoletto(fig, y, 'Drawdown massimo: percentili ALTI = scenari peggiori'); y -= .030
    riga_tab(fig, y, [''] + [f'P{p}' for p in MC.PERCENTILI], xs, 7.8, INK3, 'bold')
    linea(fig, y-.009, .062, .938); y -= .024
    for i, b in enumerate(C['b']):
        for et, dati in ((f"{b['nome']} · fisso", mc), (f"{b['nome']} · composto", mcC)):
            t = MC.tabella(dati[i]['blocchi'], 'dd_pct')
            riga_tab(fig, y, [None] + [it(t[p],1)+'%' for p in MC.PERCENTILI], xs, 8.2, INK)
            fig.text(.062, y, et, fontsize=8.2, color=CB[i] if 'fisso' in et else INK2,
                     weight='bold' if 'fisso' in et else 'normal')
            y -= .0205
    y -= .018
    titoletto(fig, y, 'Gli altri metodi, per controllo (a rischio fisso)'); y -= .030
    xs2 = [(.062,'left'), (.34,'right'), (.50,'right'), (.66,'right'), (.80,'right'), (.938,'right')]
    riga_tab(fig, y, ['metodo', 'rend. P5', 'rend. P50', 'rend. P95', 'DD P50', 'DD P90'],
             xs2, 7.8, INK3, 'bold')
    linea(fig, y-.009, .062, .938); y -= .024
    for met, et in (('permutazione','permutazione (solo ordine)'), ('iid','bootstrap IID'),
                    ('blocchi','blocchi mobili L=20'), ('stazionario','blocchi stazionari'),
                    ('regime','per regime di mercato')):
        r = mc[0][met]
        tr, td = MC.tabella(r,'rend'), MC.tabella(r,'dd_pct')
        riga_tab(fig, y, [et, pc(tr[5],0), pc(tr[50],0), pc(tr[95],0),
                          it(td[50],1)+'%', it(td[90],1)+'%'], xs2, 8.2, INK)
        y -= .0205
    y -= .012
    testo(fig, .062, y,
          f"Solo {C['b'][0]['nome']}, per non appesantire. Due righe meritano una nota:\n"
          "la PERMUTAZIONE da' lo stesso rendimento a ogni percentile perche' a rischio fisso l'utile e'\n"
          "100 x somma(R), e una somma non dipende dall'ordine: quel metodo misura solo il drawdown.\n"
          "Il bootstrap PER REGIME da' i drawdown peggiori di tutti, perche' raggruppa le operazioni\n"
          "per fase di mercato e quindi concentra le perdite: e' lo scenario piu' severo dei cinque.", 8.2)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  7 — COSTI E ASPETTATIVE LIVE
# ======================================================================
def p7(pdf, C, mc, mcC, swap_b):
    A, B = C['b']
    fig = pagina('Costi e aspettative live',
                 f"su {B['nome']}, il broker su cui si andrebbe live · scenari, non promesse", 'LIVE')
    cA, cB = costi_misurati(A), costi_misurati(B)
    titoletto(fig, .900, 'Costi per lotto')
    testo(fig, .062, .882,
          "MISURATO = dalle operazioni del backtest.   DICHIARATO = tariffe fornite dall'utente/broker,\n"
          "NON verificate su una specifica ufficiale aggiornata: possono essere cambiate.", 7.8, INK3)
    y = .826
    xs = [(.062,'left'), (.40,'right'), (.575,'right'), (.755,'right'), (.938,'right')]
    riga_tab(fig, y, ['', f"{A['nome']}\nmisurato", f"{A['nome']}\ndichiarato",
                      f"{B['nome']}\nmisurato", f"{B['nome']}\ndichiarato"], xs, 7.2, INK3, 'bold')
    linea(fig, y-.016, .062, .938); y -= .034
    for et, a1, a2, b1, b2 in [
        ('Swap sui long', it(cA['swap_long'],2), it(swap_b[0][0],2),
         it(cB['swap_long'],2), it(swap_b[1][0],2)),
        ('Swap sugli short', it(cA['swap_short'],2), it(swap_b[0][1],2),
         it(cB['swap_short'],2), it(swap_b[1][1],2)),
        ('Commissioni', it(cA['comm_lotto'],2), '—', it(cB['comm_lotto'],2), '—'),
        ('Costo totale (mix reale)', it(cA['comm_lotto']+cA['swap_lotto'],2), '—',
         it(cB['comm_lotto']+cB['swap_lotto'],2), '—')]:
        riga_tab(fig, y, [et, a1, a2, b1, b2], xs, 8.5, INK); y -= .0225
    y -= .008
    testo(fig, .062, y,
          f"Il mix operato e' {it(cA['quota_long'],0)}% long su {A['nome']} e {it(cB['quota_long'],0)}% "
          f"su {B['nome']}: i long pagano swap, gli short lo incassano,\nquindi il costo medio dipende "
          "dal mix e non solo dalle tariffe. Lo swap triplo del mercoledi' e'\ngia' dentro i numeri "
          "misurati. Il sistema muore a tre volte i costi attuali.", 8.0, INK3)

    y -= .072
    titoletto(fig, y, f"Scenari annui, su circa {it(B['tot']['n']/C['durata'],0)} operazioni l'anno")
    y -= .030
    xs2 = [(.062,'left'), (.40,'right'), (.545,'right'), (.70,'right'), (.875,'right')]
    riga_tab(fig, y, ['scenario', 'base', 'R/anno', 'fisso a 1%', 'composto a 1%'],
             xs2, 7.8, INK3, 'bold')
    linea(fig, y-.009, .062, .938); y -= .026
    tpa = B['tot']['n']/C['durata']
    for nome, base, rop, c in [
            ('Avverso', f"costruzione di {A['nome']}", A['sIS']['R_op'], ROSSO),
            ('Prudente', f"tutto il periodo di {A['nome']}", A['tot']['R_op'], GIALLO),
            ('Centrale', f"tutto il periodo di {B['nome']}", B['tot']['R_op'], INK),
            ('Favorevole', f"fuori campione di {B['nome']}", B['sOOS']['R_op'], VERDE)]:
        Rann = tpa*rop
        riga_tab(fig, y, [None, base, it(Rann,1), None, None], xs2, 8.5, INK)
        fig.text(.062, y, nome, fontsize=8.6, color=c, weight='bold')
        fig.text(.70, y, pc(Rann,1), fontsize=9.2, ha='right', color=c, weight='bold')
        fig.text(.875, y, pc(100*((1.01)**Rann - 1),1), fontsize=9.2, ha='right',
                 color=c, weight='bold')
        y -= .0235
    y -= .010
    testo(fig, .062, y,
          "A rischio fisso il rendimento annuo e' lineare nella percentuale scelta. A composto no: si\n"
          "accumula, e anche il drawdown cresce piu' che proporzionalmente.", 8.0, INK3)

    y -= .058
    titoletto(fig, y, 'Drawdown da mettere in conto, a 1%'); y -= .030
    xs3 = [(.062,'left'), (.42,'right'), (.62,'right'), (.82,'right')]
    riga_tab(fig, y, ['', 'mediano', '90° perc.', '99° perc.'], xs3, 7.8, INK3, 'bold')
    linea(fig, y-.009, .062, .938); y -= .024
    for i, b in enumerate(C['b']):
        for et, dati in ((f"{b['nome']} · fisso", mc), (f"{b['nome']} · composto", mcC)):
            d = dati[i]['blocchi']['dd_pct']
            riga_tab(fig, y, [None, it(np.percentile(d,50),1)+'%', it(np.percentile(d,90),1)+'%',
                              it(np.percentile(d,99),1)+'%'], xs3, 8.4, INK)
            fig.text(.062, y, et, fontsize=8.4, color=CB[i] if 'fisso' in et else INK2,
                     weight='bold' if 'fisso' in et else 'normal')
            y -= .0205

    y -= .016
    card(fig, .062, y-.176, .876, .168, ROSSO)
    fig.text(.082, y-.026, 'Cinque motivi per cui il live NON riprodurra\' questi numeri',
             fontsize=11, color=INK, weight='bold')
    testo(fig, .082, y-.046,
          "1.  REGIME. Il piu' grosso: meta' del risultato viene da due anni eccezionali per l'oro. In una\n"
          "     fase ferma questo sistema PERDE, non guadagna meno.\n"
          "2.  SLITTAMENTO. Il tester non ce l'ha. Dal vivo una rottura e' proprio quando il libro si\n"
          "     assottiglia.\n"
          "3.  SPREAD. Nel test e' quello storico; dal vivo si allarga sulle notizie, che e' quando questa\n"
          "     strategia entra piu' spesso.\n"
          "4.  LATENZA E RIFIUTI. Non esistono nel tester.\n"
          "5.  SWAP CHE CAMBIA. E' il costo piu' grosso e il broker lo modifica quando vuole.\n\n"
          "Tutti e cinque tirano verso il basso. Per questo la riga da guardare e' «Avverso».", 8.2)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  8 — CONCLUSIONI E LIMITI
# ======================================================================
def p8(pdf, C, mc, mcC):
    A, B = C['b']
    fig = pagina('Conclusioni e limiti', 'ogni risposta e\' tracciabile a un numero di questo dossier',
                 'CONCLUSIONI')
    Q = [("Il vantaggio esiste?",
          f"Si. t = {it(A['tot']['t'],2)} e {it(B['tot']['t'],2)} sui rendimenti per operazione, su "
          f"{A['tot']['n']} e {B['tot']['n']} operazioni.", VERDE),
         ("Regge fuori dai dati di costruzione?",
          f"Si. A rischio fisso {pc(A['sOOS']['rend'])} e {pc(B['sOOS']['rend'])}, PF "
          f"{it(A['sOOS']['pf'],2)} e {it(B['sOOS']['pf'],2)}, guardato una volta sola.", VERDE),
         ("Regge al cambio di broker?",
          f"Si. {it(A['tot']['R_op'],4)} contro {it(B['tot']['R_op'],4)} R per operazione, correlazione "
          f"mensile {it(corr_mesi(A,B),2)}.", VERDE),
         ("Era profittevole prima del rialzo dell'oro?",
          f"Si, ma molto meno: {pc(A['sIS']['rend'])} e {pc(B['sIS']['rend'])} dal 2019.09 al 2023.12.",
          GIALLO),
         ("Il risultato e' distribuito nel tempo?",
          f"No. Il {it(100*A['sOOS']['R']/A['tot']['R'],0)}% dei punti R arriva dal "
          f"{it(100*len(A['OOS'])/A['tot']['n'],0)}% delle operazioni, tutte dopo il 2024.", ROSSO),
         ("Dipende dal regime di mercato?",
          "Molto. Guadagna ai due estremi del movimento e perde quando l'oro sta fermo.", ROSSO),
         ("Che aspetto ha senza il composto?",
          f"{pc(A['tot']['rend'],0)} e {pc(B['tot']['rend'],0)} in {it(C['durata'],1)} anni, contro "
          f"{pc(A['cmp']['rend'],0)} e {pc(B['cmp']['rend'],0)} col composto.", INK),
         ("Che drawdown c'e' stato, e quale e' plausibile?",
          f"Nel backtest {it(A['cmp']['dd'],1)}% e {it(B['cmp']['dd'],1)}% a composto. Monte Carlo al "
          f"90° percentile: {it(np.percentile(mcC[0]['blocchi']['dd_pct'],90),1)}% e "
          f"{it(np.percentile(mcC[1]['blocchi']['dd_pct'],90),1)}%.", ROSSO),
         ("Che numero usare per il futuro?",
          f"Il peggiore dei due broker: {it(min(A['tot']['R_op'], B['tot']['R_op']),4)} R per "
          f"operazione, e lo scenario del periodo di costruzione, non quello recente.", GIALLO),
         ("Che cosa manca prima di dire «live»?",
          "Una demo in avanti di tre-sei mesi su Fusion, e la verifica dello swap reale sulla specifica\n"
          "del simbolo. Nessun altro backtest su questi anni aggiunge informazione.", INK)]
    y = .895
    for d, r, c in Q:
        fig.text(.062, y, d, fontsize=9.4, color=INK, weight='bold')
        testo(fig, .062, y-.017, r, 8.5, c)
        y -= .017 + .0165*(r.count('\n')+1) + .020
    linea(fig, y+.014, .062, .938)
    titoletto(fig, y-.010, 'I limiti, per intero'); y -= .038
    testo(fig, .062, y,
          "1.  Due broker sono due listini sugli STESSI anni dello STESSO mercato: riducono il rischio di\n"
          "     un artefatto del feed, non quello di aver misurato un periodo fortunato dell'oro.\n"
          "2.  Il fuori campione e' stato speso, guardato una volta sola: non ci sono piu' dati vergini\n"
          "     su questi anni.\n"
          "3.  Il Monte Carlo rimescola solo cio' che e' successo: un mercato mai visto in questi sette\n"
          "     anni non sta in nessuno scenario.\n"
          "4.  Nessuna esecuzione reale e' stata misurata: slittamento, rifiuti e latenza non esistono\n"
          "     nel tester, e tirano tutti verso il basso.\n"
          "5.  Le tariffe di swap dichiarate non sono verificate, e lo swap e' il costo piu' grosso.\n"
          "6.  Le statistiche per anno sono su circa 150 operazioni: numeri rumorosi.", 8.4)
    card(fig, .062, .058, .876, .078, GIALLO)
    testo(fig, .082, .122,
          f"In una riga: il vantaggio esiste ed e' misurabile ({it(min(A['tot']['R_op'], B['tot']['R_op']),4)} "
          f"R per operazione nel caso peggiore),\nsopravvive a dati mai visti e a un cambio di listino, "
          "ma non e' costante nel tempo. Quello che\nmanca non e' un'altra simulazione: e' l'esecuzione vera.",
          8.8, INK)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
def main(percorsi, nomi, qualita, rt, swap_b, out):
    C = carica_tutto(percorsi, nomi, qualita, rt)
    verifica(C)
    print('--- Monte Carlo ---')
    mc, mcC = [], []
    for b in C['b']:
        d, dC = {}, {}
        for met in ('permutazione', 'iid', 'blocchi', 'stazionario', 'regime'):
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
                if resto: strati.append(np.array(resto))
            d[met] = MC.simula(b['R'], met, n_sim=n, strati=strati)
        # versione composta: stessa sequenza di R, capitalizzata
        dC['blocchi'] = MC.simula(b['R'], 'blocchi', n_sim=20000, composto=True)
        print(f"  {b['nome']:12} 5 metodi a rischio fisso + blocchi a composto")
        mc.append(d); mcC.append(dC)
    print()
    with PdfPages(out) as pdf:
        p1(pdf, C, mc); p2(pdf, C); p_conviene(pdf, C); p3(pdf, C); p4(pdf, C)
        p5(pdf, C); p6(pdf, C, mc, mcC); p7(pdf, C, mc, mcC, swap_b)
        p8(pdf, C, mc, mcC)
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
    ap.add_argument('-o', '--out', default='report/sintesi.pdf')
    x = ap.parse_args()
    main([x.a, x.b], x.nomi, x.qualita, [r/100 for r in x.rischio_test],
         [tuple(x.swap_a), tuple(x.swap_b)], x.out)
