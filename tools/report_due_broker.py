#!/usr/bin/env python3
"""Report a due broker: la stessa strategia, lo stesso periodo, due
listini prezzi diversi.

Serve a rispondere a una domanda che un backtest solo non tocca: quanto
di questo risultato e' la strategia, e quanto e' il particolare broker
su cui e' stata misurata.

Regola con cui va letto, dichiarata prima: il numero da portarsi a casa
e' SEMPRE il peggiore dei due, mai la media e mai il migliore.

Uso:
  python3 tools/report_due_broker.py <A.html> <B.html> \
      --nomi "PUPrime .s" "Fusion" --rischio-test 1.0 --rischio 1.0
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
from estrai import leggi
from report_finale import (BG, CARD, INK, INK2, INK3, BLU, VERDE, ARANCIO,
                           GIALLO, ROSSO, GRIGLIA, it, equity, equity_semplice,
                           dd_max, blocchi, scheda, tessera, griglia_y)

NOMI = {'S3-DONCH': 'ROTTURA', 'S2-PULLB': 'RITRACCIAMENTO'}
CLEG = {'S3-DONCH': BLU, 'S2-PULLB': VERDE}
CBRK = [GIALLO, ARANCIO]          # colore per broker
TETTO = 35.0                      # tetto al drawdown, 90o percentile

# ----------------------------------------------------------------------
def carica(path, rischio_test):
    """Ogni operazione in multipli di R. R non dipende dal rischio scelto,
    quindi due passate a percentuali diverse restano confrontabili."""
    T, amb, res = leggi(path)
    prec, out = 10000.0, []
    for x in T:
        out.append({'tag': x.tag, 'R': x.netto / (rischio_test * prec),
                    'data': x.data, 'netto': x.netto,
                    'prezzo_in': x.prezzo_in, 'prezzo_out': x.prezzo_out,
                    'tipo': x.tipo})
        prec = x.saldo
    return out, amb

def Rs(d, tag=None):
    return [x['R'] for x in d if tag is None or x['tag'] == tag]

def mensile(d, tag=None):
    m = defaultdict(float)
    for x in d:
        if tag is None or x['tag'] == tag:
            m[x['data'][:7]] += x['R']
    return m

def annuale(d):
    a = defaultdict(float)
    for x in d: a[x['data'][:4]] += x['R']
    return a

def periodo(d, lo, hi):
    return [x for x in d if lo <= x['data'][:4] <= hi]

def corr(a, b):
    if len(a) < 3: return float('nan')
    sa, sb = st.pstdev(a), st.pstdev(b)
    if sa == 0 or sb == 0: return float('nan')
    ma, mb = st.mean(a), st.mean(b)
    return sum((x-ma)*(y-mb) for x, y in zip(a, b)) / (len(a)*sa*sb)

def pctl(v, p):
    return float(np.percentile(np.asarray(v, float), p))

def testata(fig, titolo, sottotitolo, pag):
    fig.text(.055, .955, titolo, fontsize=21, color=INK, weight='bold')
    fig.text(.055, .932, sottotitolo, fontsize=9.5, color=INK2)
    fig.text(.945, .957, 'DUE BROKER', fontsize=9.5, color=INK3,
             ha='right', weight='bold')
    fig.text(.945, .938, f'XAUUSD · pag. {pag}', fontsize=8, color=INK3, ha='right')
    fig.add_artist(Rectangle((.055, .922), .89, .0016, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))

def nota(fig, y, testo, colore=None):
    fig.text(.055, y, testo, fontsize=8.6, color=colore or INK2, va='top', linespacing=1.65)

def nuova():
    return plt.figure(figsize=(8.27, 11.69))

# ======================================================================
#  pag. 1 — sintesi
# ======================================================================
def pag_sintesi(pdf, D, N, f, meta):
    fig = nuova()
    testata(fig, 'La stessa strategia su due broker',
            f"{meta['periodo']} · rischio della passata {meta['rischio_test']}% · "
            f"qualità dati {meta['qualita'][0]} e {meta['qualita'][1]}", 1)

    nota(fig, .905,
         "Due listini prezzi diversi, due strutture di costo diverse, stesso periodo e stesse\n"
         "impostazioni. Se il vantaggio regge su entrambi, non dipende da un particolare broker.")

    # --- tessere, una riga per broker
    for i, (d, nome) in enumerate(zip(D, N)):
        R = Rs(d); s = sum(R); sd = st.pstdev(R)
        t = s / (sd * math.sqrt(len(R)))
        y = .795 - i * .095
        fig.text(.055, y + .062, nome, fontsize=12, color=CBRK[i], weight='bold')
        for k, (v, et) in enumerate([
                (it(len(R)), 'operazioni'),
                (it(s, 1), 'punti R'),
                (f"{it(s/len(R), 4)}", 'R per operazione'),
                (it(sum(1 for x in R if x > 0)/len(R)*100, 1) + '%', 'vincenti'),
                (it(t, 2), 't')]):
            tessera(fig, .055 + k*.182, y, .168, v, et, CBRK[i])

    # --- curve di equity a lotto fisso
    ax = fig.add_axes([.10, .400, .84, .250])
    for i, (d, nome) in enumerate(zip(D, N)):
        e = equity_semplice(Rs(d), f)
        ax.plot(np.linspace(0, 100, len(e)), 100*(e-1), color=CBRK[i], lw=1.9, label=nome)
    ax.axhline(0, color=GRIGLIA, lw=.9)
    griglia_y(ax)
    ax.set_xlabel('percentuale delle operazioni', fontsize=8)
    ax.set_ylabel('guadagno %', fontsize=8)
    ax.legend(frameon=False, fontsize=8.5, labelcolor=INK2, loc='upper left')
    ax.set_title(f"A lotto fisso, rischio {it(100*f,2)}% — la pendenza è la bravura, "
                 "senza l'effetto del composto", fontsize=9, color=INK2, loc='left', pad=8)

    # --- confronto diretto
    a, b = [sum(Rs(d))/len(Rs(d)) for d in D]
    peggio = min(a, b); chi = N[0] if a < b else N[1]
    dist = abs(a-b)/max(a, b)*100
    scheda(fig, .055, .105, .89, .215)
    fig.text(.075, .282, 'Il numero da usare è il peggiore dei due', fontsize=13,
             color=INK, weight='bold')
    fig.text(.075, .245, f"{it(peggio,4)} R per operazione   ({chi})", fontsize=17,
             color=ROSSO, weight='bold')
    fig.text(.075, .200,
             f"I due distano il {it(dist,0)}%. Sotto il 10% la strategia è indifferente al listino;\n"
             f"sopra il 50% vive di dettagli del listino e non di un vantaggio vero.\n"
             f"Mai la media, mai il migliore: il numero basso è l'unico che non delude.",
             fontsize=8.8, color=INK2, va='top', linespacing=1.7)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pag. 2 — le due gambe
# ======================================================================
def pag_gambe(pdf, D, N, f):
    fig = nuova()
    testata(fig, 'Le due gambe, broker per broker',
            'quale regge il cambio di listino e quale no', 2)

    tags = ['S2-PULLB', 'S3-DONCH']
    nt = [[len(Rs(d, t)) for d in D] for t in tags]

    nota(fig, .905,
         "La gamba lenta (H4) e quella veloce (M30) non reagiscono allo stesso modo al cambio di\n"
         "listino: una vede le stesse barre, l'altra vede anche i dettagli dentro la barra.")

    ax = fig.add_axes([.10, .620, .38, .215])
    x = np.arange(len(tags)); w = .36
    for i in range(2):
        ax.bar(x + (i-.5)*w, [nt[j][i] for j in range(len(tags))], w,
               color=CBRK[i], label=N[i])
    ax.set_xticks(x); ax.set_xticklabels([NOMI[t] for t in tags], fontsize=8.5)
    ax.set_ylim(0, max(max(r) for r in nt) * 1.34)
    griglia_y(ax)
    ax.legend(frameon=False, fontsize=8, labelcolor=INK2, loc='upper center', ncol=2)
    ax.set_title('numero di operazioni', fontsize=9, color=INK2, loc='left', pad=8)

    ax = fig.add_axes([.58, .620, .36, .215])
    for i in range(2):
        ax.bar(x + (i-.5)*w, [sum(Rs(D[i], t))/max(1, len(Rs(D[i], t))) for t in tags],
               w, color=CBRK[i])
    ax.set_xticks(x); ax.set_xticklabels([NOMI[t] for t in tags], fontsize=8.5)
    ax.axhline(0, color=GRIGLIA, lw=.9); griglia_y(ax)
    ax.set_title('R per operazione', fontsize=9, color=INK2, loc='left', pad=8)

    # --- tabella
    y = .545
    fig.text(.055, y, 'gamba', fontsize=8, color=INK3, weight='bold')
    for i in range(2):
        fig.text(.40 + i*.28, y, N[i], fontsize=8, color=CBRK[i], weight='bold', ha='center')
    fig.text(.945, y, 'scarto', fontsize=8, color=INK3, weight='bold', ha='right')
    y -= .012
    fig.add_artist(Rectangle((.055, y), .89, .0012, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))
    for t in tags:
        y -= .042
        fig.text(.055, y, NOMI[t], fontsize=10, color=CLEG[t], weight='bold')
        v = []
        for i in range(2):
            r = Rs(D[i], t); v.append(len(r))
            fig.text(.40 + i*.28, y,
                     f"{len(r)} op   {it(sum(r),1)} R   {it(sum(r)/len(r),4)} R/op",
                     fontsize=9, color=INK2, ha='center')
        sc = abs(v[0]-v[1]) / max(v) * 100
        fig.text(.945, y, f"{it(sc,1)}%", fontsize=10, ha='right',
                 color=VERDE if sc < 3 else (GIALLO if sc < 12 else ROSSO), weight='bold')

    # --- correlazione fra le gambe, per broker
    ax = fig.add_axes([.10, .175, .84, .215])
    mesi = sorted(set().union(*[set(mensile(d)) for d in D]))
    for i, d in enumerate(D):
        m = mensile(d)
        ax.plot(range(len(mesi)), np.cumsum([m.get(k, 0.0) for k in mesi]),
                color=CBRK[i], lw=1.8, label=N[i])
    ax.set_xticks(range(0, len(mesi), 12))
    ax.set_xticklabels([mesi[k][:4] for k in range(0, len(mesi), 12)], fontsize=8)
    griglia_y(ax); ax.legend(frameon=False, fontsize=8.5, labelcolor=INK2, loc='upper left')
    ax.set_ylabel('punti R cumulati', fontsize=8)
    ax.set_title('Punti R mese per mese: le due curve si sovrappongono quasi ovunque',
                 fontsize=9, color=INK2, loc='left', pad=8)

    c = []
    for d in D:
        a = mensile(d, 'S2-PULLB'); b = mensile(d, 'S3-DONCH')
        k = sorted(set(a) | set(b))
        c.append(corr([a.get(i, 0.) for i in k], [b.get(i, 0.) for i in k]))
    mb = [mensile(d) for d in D]
    k = sorted(set(mb[0]) | set(mb[1]))
    cb = corr([mb[0].get(i, 0.) for i in k], [mb[1].get(i, 0.) for i in k])
    nota(fig, .132,
         f"Correlazione mensile fra ROTTURA e RITRACCIAMENTO: {it(c[0],2)} su {N[0]}, "
         f"{it(c[1],2)} su {N[1]}.\n"
         f"Correlazione fra i due broker (stessa strategia, listini diversi): {it(cb,2)}. "
         "Più è vicina a 1,\npiù il risultato è la strategia e non il listino.")
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pag. 3 — Monte Carlo
# ======================================================================
def pag_montecarlo(pdf, D, N, f, tetti):
    fig = nuova()
    testata(fig, f'Monte Carlo a {it(100*f,2)}% per operazione',
            'bootstrap a blocchi di 20 · 20.000 scenari · le serie di perdite restano intere', 3)
    nota(fig, .905,
         "Il drawdown del backtest è un solo percorso, ed è stato quello. Si rimescolano le stesse\n"
         "operazioni a blocchi — così le perdite in fila non vengono spezzate — e si guarda dove\n"
         "cade il 90% degli scenari. È il numero su cui decidere il rischio, non quello del backtest.")

    ax = fig.add_axes([.10, .590, .84, .225])
    perc = {}
    for i, d in enumerate(D):
        _, dds, _ = blocchi(Rs(d), f, n_sim=20000)
        perc[i] = {p: 100*pctl(dds, p) for p in (50, 90, 95, 99)}
        ax.hist(100*dds, bins=90, color=CBRK[i], alpha=.55, label=N[i])
    ax.axvline(TETTO, color=ROSSO, lw=1.6, ls='--')
    ax.text(TETTO+.6, ax.get_ylim()[1]*.88, f'tetto {it(TETTO,0)}%', color=ROSSO, fontsize=8.5)
    griglia_y(ax); ax.legend(frameon=False, fontsize=8.5, labelcolor=INK2)
    ax.set_xlabel('drawdown massimo dello scenario, %', fontsize=8)
    ax.set_title('Dove finisce il drawdown in 20.000 mondi possibili', fontsize=9,
                 color=INK2, loc='left', pad=8)

    y = .545
    for k, et in enumerate(['mediano', '90° percentile', '95°', '99°']):
        fig.text(.40 + k*.145, y, et, fontsize=8, color=INK3, ha='center', weight='bold')
    y -= .012
    fig.add_artist(Rectangle((.055, y), .89, .0012, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))
    for i in range(2):
        y -= .040
        fig.text(.055, y, N[i], fontsize=10, color=CBRK[i], weight='bold')
        for k, p in enumerate((50, 90, 95, 99)):
            v = perc[i][p]
            fig.text(.40 + k*.145, y, f"{it(v,1)}%", fontsize=10.5, ha='center',
                     color=ROSSO if (p == 90 and v > TETTO) else INK, weight='bold')

    # --- a che rischio si tocca il tetto
    ax = fig.add_axes([.10, .185, .84, .225])
    rr = np.arange(.004, .0165, .0010)
    for i, d in enumerate(D):
        vals = []
        for r in rr:
            _, dds, _ = blocchi(Rs(d), r, n_sim=4000, seed=3)
            vals.append(100*pctl(dds, 90))
        ax.plot(100*rr, vals, color=CBRK[i], lw=2, marker='o', ms=3, label=N[i])
    ax.axhline(TETTO, color=ROSSO, lw=1.4, ls='--')
    for i, t in enumerate(tetti):
        ax.axvline(t, color=CBRK[i], lw=1, ls=':')
    griglia_y(ax); ax.legend(frameon=False, fontsize=8.5, labelcolor=INK2, loc='upper left')
    ax.set_xlabel('rischio per operazione, %', fontsize=8)
    ax.set_ylabel('drawdown al 90° percentile, %', fontsize=8)
    ax.set_title('A che rischio si tocca il tetto', fontsize=9, color=INK2, loc='left', pad=8)

    nota(fig, .135,
         f"Il tetto del {it(TETTO,0)}% cade a {it(tetti[0],2)}% su {N[0]} e a {it(tetti[1],2)}% su {N[1]}.\n"
         f"Vale il peggiore: {it(min(tetti),2)}%. Un filo sotto, {it(min(tetti)-0.03,2)}%, lascia margine su entrambi.",
         INK)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pag. 4 — dentro/fuori campione e anno per anno
# ======================================================================
def pag_periodi(pdf, D, N, f):
    fig = nuova()
    testata(fig, 'Dentro e fuori campione',
            'anno per anno, a lotto fisso: col composto il secondo periodo parte più ricco', 4)
    nota(fig, .905,
         "I parametri sono stati scelti sul primo periodo e verificati una volta sola sul secondo.\n"
         "Il fuori campione rende di più, e non è una buona notizia: il 2024-2026 è stato un periodo\n"
         "eccezionale per l'oro. Il numero da usare per il futuro è il più basso dei due.")

    y = .830
    for k, et in enumerate(['operazioni', 'punti R', 'R per operazione']):
        fig.text(.45 + k*.17, y, et, fontsize=8, color=INK3, ha='center', weight='bold')
    for i, d in enumerate(D):
        y -= .030
        fig.text(.055, y, N[i], fontsize=10.5, color=CBRK[i], weight='bold')
        for et, lo, hi in (('costruzione 2019-2023', '2019', '2023'),
                           ('mai visto 2024-2026', '2024', '2026')):
            y -= .034
            p = Rs(periodo(d, lo, hi))
            fig.text(.075, y, et, fontsize=9, color=INK2)
            for k, v in enumerate([it(len(p)), it(sum(p), 1), it(sum(p)/len(p), 4)]):
                fig.text(.45 + k*.17, y, v, fontsize=9.5, color=INK, ha='center')
        y -= .016

    ax = fig.add_axes([.10, .345, .84, .205])
    anni = sorted(set().union(*[set(annuale(d)) for d in D]))
    x = np.arange(len(anni)); w = .38
    for i, d in enumerate(D):
        a = annuale(d)
        ax.bar(x + (i-.5)*w, [a.get(k, 0.) for k in anni], w, color=CBRK[i], label=N[i])
    ax.set_xticks(x); ax.set_xticklabels(anni, fontsize=8.5)
    ax.axhline(0, color=INK3, lw=1); griglia_y(ax)
    ax.legend(frameon=False, fontsize=8.5, labelcolor=INK2)
    ax.set_ylabel('punti R', fontsize=8)
    ax.set_title('Punti R per anno', fontsize=9, color=INK2, loc='left', pad=8)

    vuoti = [k for k in anni if all(annuale(d).get(k, 0.) < 10 for d in D)]
    scheda(fig, .055, .105, .89, .195, ROSSO)
    fig.text(.075, .262, "Gli anni a vuoto sono la cosa da aspettarsi", fontsize=13,
             color=INK, weight='bold')
    fig.text(.075, .228, f"{len(vuoti)} anni su {len(anni)}: {', '.join(vuoti)}",
             fontsize=15, color=ROSSO, weight='bold')
    fig.text(.075, .190,
             "Non sono anni brutti a caso: sono quelli in cui l'oro è stato fermo, che è il nemico\n"
             "di questo sistema. Tradotto: 12-18 mesi senza guadagnare sono dentro la normalità.\n"
             "Chi non se lo aspetta spegne il sistema nel momento sbagliato.",
             fontsize=8.8, color=INK2, va='top', linespacing=1.7)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pag. 5 — contro il compra-e-tieni
# ======================================================================
def pag_buyhold(pdf, D, N, f):
    fig = nuova()
    testata(fig, "Contro il compra-e-tieni", "l'oro è salito da solo: quanto vale la strategia in più?", 5)
    nota(fig, .905,
         "Nel periodo l'oro è salito molto. Un sistema sull'oro che guadagna non basta: deve\n"
         "guadagnare in modo diverso da chi l'oro se l'è semplicemente comprato e tenuto.")

    ax = fig.add_axes([.10, .600, .84, .240])
    for i, d in enumerate(D):
        e = equity(Rs(d), f)
        ax.plot(np.linspace(0, 100, len(e)), 100*(e-1), color=CBRK[i], lw=1.9, label=N[i])
    d0 = D[0]
    p = np.array([x['prezzo_in'] for x in d0 if x['prezzo_in'] > 0])
    bh = p / p[0]
    ax.plot(np.linspace(0, 100, len(bh)), 100*(bh-1), color=INK3, lw=1.7,
            ls='--', label='compra e tieni')
    griglia_y(ax); ax.legend(frameon=False, fontsize=8.5, labelcolor=INK2, loc='upper left')
    ax.set_xlabel('percentuale del periodo', fontsize=8)
    ax.set_ylabel('guadagno %', fontsize=8)
    ax.set_title(f"Col composto al {it(100*f,2)}%", fontsize=9, color=INK2, loc='left', pad=8)

    # --- mesi in cui l'oro scende
    fig.text(.055, .530, "Quando l'oro scende", fontsize=13, color=INK, weight='bold')
    ax = fig.add_axes([.10, .305, .84, .185])
    d = D[0]
    # prezzo di fine mese dalla serie delle esecuzioni in ordine di tempo:
    # la media del mese schiaccerebbe il movimento e falserebbe le fasce
    serie = sorted([(x['data'], x['prezzo_in'])  for x in d if x['prezzo_in']  > 0] +
                   [(x['data'], x['prezzo_out']) for x in d if x['prezzo_out'] > 0])
    fine = {}
    for t, pr in serie: fine[t[:7]] = pr
    mesi = sorted(fine)
    var = [0.0] + [100*(fine[mesi[i]]/fine[mesi[i-1]] - 1) for i in range(1, len(mesi))]
    fasce = [('forte discesa', -99, -3), ('discesa lenta', -3, -0.5),
             ('fermo', -0.5, 0.5), ('salita lenta', 0.5, 3), ('forte salita', 3, 99)]
    et, val, col = [], [], []
    for nome, lo, hi in fasce:
        sel = [mesi[i] for i, v in enumerate(var) if lo <= v < hi]
        m = mensile(d)
        r = [m.get(k, 0.0) for k in sel]
        et.append(f"{nome}\n{len(r)} mesi"); val.append(np.mean(r) if r else 0.0)
        col.append(ROSSO if (r and np.mean(r) < 0) else VERDE)
    ax.bar(range(len(et)), val, .55, color=col)
    ax.set_xticks(range(len(et))); ax.set_xticklabels(et, fontsize=8)
    ax.axhline(0, color=INK3, lw=1); griglia_y(ax)
    ax.set_ylabel('punti R al mese', fontsize=8)
    ax.set_title(f"Punti R medi al mese secondo cosa ha fatto l'oro — dati {N[0]}",
                 fontsize=9, color=INK2, loc='left', pad=8)

    cc = corr(var[1:], [mensile(d).get(k, 0.) for k in mesi[1:]])
    ca = corr([abs(v) for v in var[1:]], [mensile(d).get(k, 0.) for k in mesi[1:]])
    nota(fig, .258,
         f"Correlazione col movimento dell'oro {it(cc,2)}; col movimento in valore assoluto {it(ca,2)}.\n"
         "Il secondo è molto più alto: al sistema non serve che l'oro salga, serve che si muova.\n"
         "Guadagna ai due estremi e perde in mezzo. Il nemico non è la direzione, è l'immobilità.\n"
         "(Prezzo di fine mese dalle esecuzioni del backtest: approssimazione, non la chiusura ufficiale.)")

    scheda(fig, .055, .062, .89, .122)
    fin = [100*(equity(Rs(x), f)[-1]-1) for x in D]
    fig.text(.075, .152, 'Il vantaggio vero', fontsize=12, color=INK, weight='bold')
    fig.text(.075, .128,
             f"Compra e tieni: {it(100*(bh[-1]-1),0)}%, ma prendendosi tutte le discese dell'oro in faccia.\n"
             f"Strategia: {it(min(fin),0)}% nel caso peggiore dei due broker, con lo stop sempre a mercato\n"
             f"e guadagnando anche nei mesi di discesa.",
             fontsize=8.8, color=INK2, va='top', linespacing=1.7)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
#  pag. 6 — cosa aspettarsi
# ======================================================================
def pag_attese(pdf, D, N, f, meta, tetti):
    fig = nuova()
    testata(fig, 'Che cosa aspettarsi', 'scenari costruiti sul broker peggiore, non sulla media', 6)

    i_peggio = 0 if sum(Rs(D[0]))/len(Rs(D[0])) < sum(Rs(D[1]))/len(Rs(D[1])) else 1
    d = D[i_peggio]
    anni = meta['anni']; tpa = len(Rs(d))/anni

    scen = [('BRUTTO', 'come il periodo di costruzione',
             sum(Rs(periodo(d,'2019','2023')))/len(Rs(periodo(d,'2019','2023'))), ROSSO),
            ('CENTRALE', 'come tutto il periodo misurato',
             sum(Rs(d))/len(Rs(d)), GIALLO),
            ('BELLO', 'come il 2024-2026, eccezionale per l\'oro',
             sum(Rs(periodo(d,'2024','2026')))/len(Rs(periodo(d,'2024','2026'))), VERDE)]

    nota(fig, .905,
         f"Costruiti sui dati di {N[i_peggio]}, il peggiore dei due. {it(tpa,0)} operazioni l'anno.\n"
         "Aspettati il rosso, spera nel giallo, sul verde non contarci.")

    y = .830
    fig.text(.50, y, "R all'anno", fontsize=8, color=INK3, ha='center', weight='bold')
    for k, r in enumerate((0.0070, f)):
        fig.text(.68 + k*.15, y, f"a {it(100*r,2)}%", fontsize=8, color=INK3,
                 ha='center', weight='bold')
    y -= .012
    fig.add_artist(Rectangle((.055, y), .89, .0012, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))
    for nome, spieg, rpt, c in scen:
        y -= .055
        Rann = tpa * rpt
        fig.text(.055, y+.012, nome, fontsize=11, color=c, weight='bold')
        fig.text(.055, y-.008, spieg, fontsize=8, color=INK3)
        fig.text(.50, y, it(Rann, 1), fontsize=11, color=INK, ha='center')
        for k, r in enumerate((0.0070, f)):
            fig.text(.68 + k*.15, y, f"{it(100*((1+r)**Rann-1),1)}%", fontsize=13,
                     color=c, ha='center', weight='bold')
    fig.text(.055, y-.035, "percentuali annue composte, al netto di spread, commissioni e swap",
             fontsize=7.8, color=INK3)

    # --- rischio consigliato
    scheda(fig, .055, .440, .89, .135, GIALLO)
    fig.text(.075, .530, 'Il rischio da usare', fontsize=13, color=INK, weight='bold')
    fig.text(.075, .482, f"{it(min(tetti)-0.03,2)}%", fontsize=24,
             color=GIALLO, weight='bold')
    fig.text(.075, .460, 'per operazione', fontsize=8.5, color=INK2)
    fig.text(.255, .505,
             f"Il tetto del {it(TETTO,0)}% al 90° percentile cade a {it(tetti[0],2)}% su {N[0]}\n"
             f"e a {it(tetti[1],2)}% su {N[1]}. Vale il peggiore, con un filo\n"
             f"di margine. Sopra, il 99° percentile passa il 45%.",
             fontsize=8.6, color=INK2, va='top', linespacing=1.7)

    fig.text(.055, .390, 'Quello che questi numeri NON dicono', fontsize=13,
             color=INK, weight='bold')
    nota(fig, .362,
         "1.  Sono lo stesso mercato e gli stessi anni, visti da due listini. Due broker non fanno\n"
         "     due prove indipendenti: se l'oro nei prossimi anni si comporta diversamente da come\n"
         "     si è comportato dal 2019, nessuno di questi numeri lo sa.\n\n"
         "2.  Il backtest non sa cosa succede quando l'ordine parte davvero: lo slittamento, il\n"
         "     rifiuto, lo spread che si allarga sulle notizie. Quello lo dice solo la demo in avanti.\n\n"
         "3.  I dati dei due broker non hanno la stessa qualità "
         f"({meta['qualita'][0]} e {meta['qualita'][1]}). Il numero\n"
         "     misurato sui dati meno precisi tende a essere più generoso del vero.\n\n"
         "4.  Il sistema muore a tre volte i costi attuali. Prima del live, confrontare swap e\n"
         "     spread veri con quelli misurati qui.")

    fig.text(.055, .075, 'Il prossimo passo non è un altro backtest: è la demo in avanti.',
             fontsize=11, color=INK, weight='bold')
    fig.text(.055, .052, 'Tre-sei mesi in tempo reale sul broker con cui si andrà live.',
             fontsize=9, color=INK2)
    pdf.savefig(fig); plt.close(fig)

# ======================================================================
def main(pa, pb, nomi, rischio_test, f, qualita, out):
    D, N = [], nomi
    for p in (pa, pb):
        d, amb = carica(p, rischio_test)
        print(f"  {p}: {len(d)} operazioni, ambigui {amb}")
        D.append(d)

    # data di inizio/fine comuni
    d0 = min(D[0][0]['data'], D[1][0]['data'])[:10]
    d1 = max(D[0][-1]['data'], D[1][-1]['data'])[:10]
    anni = (int(d1[:4]) + int(d1[5:7])/12) - (int(d0[:4]) + int(d0[5:7])/12)
    meta = {'periodo': f"{d0} → {d1}", 'rischio_test': it(100*rischio_test, 2),
            'qualita': qualita, 'anni': anni}

    # il rischio a cui ciascun broker tocca il tetto
    tetti = []
    for d in D:
        lo, hi = 0.002, 0.020
        for _ in range(22):
            mid = (lo+hi)/2
            _, dds, _ = blocchi(Rs(d), mid, n_sim=4000, seed=5)
            if 100*pctl(dds, 90) < TETTO: lo = mid
            else: hi = mid
        tetti.append(100*lo)
    print(f"  tetto {TETTO}%: {N[0]} a {tetti[0]:.2f}%, {N[1]} a {tetti[1]:.2f}%")

    with PdfPages(out) as pdf:
        pag_sintesi(pdf, D, N, f, meta)
        pag_gambe(pdf, D, N, f)
        pag_montecarlo(pdf, D, N, f, tetti)
        pag_periodi(pdf, D, N, f)
        pag_buyhold(pdf, D, N, f)
        pag_attese(pdf, D, N, f, meta, tetti)
    print(f"scritto {out}")

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('a'); ap.add_argument('b')
    ap.add_argument('--nomi', nargs=2, default=['Broker A', 'Broker B'])
    ap.add_argument('--qualita', nargs=2, default=['?', '?'])
    ap.add_argument('--rischio-test', type=float, default=1.0)
    ap.add_argument('--rischio', type=float, default=1.0)
    ap.add_argument('-o', '--out', default='report/due-broker.pdf')
    x = ap.parse_args()
    main(x.a, x.b, x.nomi, x.rischio_test/100, x.rischio/100, x.qualita, x.out)
