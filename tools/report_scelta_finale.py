#!/usr/bin/env python3
"""LA SCELTA: drawdown sotto il 33% nel 95% dei casi, nello scenario magro.

Vincolo posto da Davide: il drawdown al 95o percentile deve stare entro
il 33% NELLO SCENARIO PRUDENTE (solo 2019-2023, il periodo senza il
boom del 2024-2026). Risposta: oro 0,65% e nasdaq 0,98%.

Una cosa che il report deve dire chiaro: Davide sperava, con quel
drawdown, in un rendimento intorno al 1300-1400%. Le due cose non
stanno insieme. Nello scenario prudente quel rischio da' una mediana
del +578%; il +1.222% e' il numero dello scenario col boom dentro. Per
avere +1.350% nello scenario prudente servirebbe x0,94, che porta il
drawdown al 44,7%. Si sceglie l'uno o l'altro, non tutti e due.

Uso:  python3 tools/report_scelta_finale.py <oro.html> <nasdaq.html> [uscita.pdf]
"""
import sys, os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Rectangle
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from montecarlo_portafoglio import tabella
from report_rischio_portafoglio import (carica, mc, cagr, fascia, peso_per_dd,
                                        DEP, R_ORO, R_NAS, CC, CT, SIM)
from report_validazione import (INK, INK2, INK3, BLU, ARANCIO, VERDE, ROSSO,
                                GIALLO, GRIGLIA, VIOLA, it, pc, card, kpi,
                                griglia, riga_tab, linea, testo)

TETTO  = 33.0
SCELTO = 0.65                      # oro 0,65% · nasdaq 0,98%
SPERATO = 1350.0                   # il rendimento che Davide sperava
GRIGLIA_PESI = (0.45, 0.55, 0.65, 0.75, 0.85, 0.95)
NPAG = 3
PAG = [0]


def pagina(titolo, sottotitolo):
    PAG[0] += 1
    fig = plt.figure(figsize=(8.27, 11.69))
    fig.text(.058, .958, titolo, fontsize=19, color=INK, weight='bold')
    fig.text(.058, .937, sottotitolo, fontsize=8.5, color=INK2)
    fig.text(.942, .960, 'LA SCELTA', fontsize=8.6, color=INK3,
             ha='right', weight='bold')
    fig.text(.942, .943, f'ORO + NASDAQ · pag. {PAG[0]} di {NPAG}',
             fontsize=7.6, color=INK3, ha='right')
    fig.add_artist(Rectangle((.058, .928), .884, .0015, facecolor=GRIGLIA,
                             edgecolor='none', transform=fig.transFigure))
    return fig


def tit(fig, y, s, c=None):
    fig.text(.058, y, s, fontsize=11.5, color=c or INK, weight='bold')


# =============================================================== pag. 1
def pag_risposta(C, R, pdf):
    fig = pagina('La scelta',
                 'drawdown entro il 33% nel 95% dei casi, misurato sullo scenario magro')

    a, b = R['pre'], R['tot']
    for i, (v, et, col) in enumerate((
            (f"{it(R_ORO*SCELTO, 2)}%", 'ORO   InpRiskPercent', GIALLO),
            (f"{it(R_NAS*SCELTO, 2)}%", 'NASDAQ   RiskPercent', BLU),
            (f"{it(a['d'][95], 1)}%", 'DD 95% — scenario magro', VERDE),
            (f"{it(b['d'][95], 1)}%", 'DD 95% — tutto il periodo', VERDE))):
        kpi(fig, .058 + i*.2235, .850, .2105, v, et, col, h=.058)

    testo(fig, .058, .800,
          "Il drawdown sta sotto il 33% in tutti e due gli scenari, come volevi. Sull'oro scendi da\n"
          "0,70% a 0,65%, sul nasdaq da 1,50% a 0,98%.", 8.8, INK)

    tit(fig, .752, 'Cosa aspettarsi')
    xs = [(.070, 'left'), (.400, 'right'), (.520, 'right'), (.630, 'right'),
          (.730, 'right'), (.830, 'right'), (.930, 'right')]
    card(fig, .058, .590, .884, .152)
    riga_tab(fig, .712, ['scenario', 'peggio 5%', 'MEDIANA', "all'anno",
                         'DD 90%', 'DD 95%', 'DD 99%'], xs, 8.0, INK3, 'bold')
    linea(fig, .702, .070, .930)
    for i, (et, k, col) in enumerate((
            ('MAGRO  (come il 2019-2023)', 'pre', CC),
            ('TUTTO  (col boom dentro)', 'tot', CT))):
        r = R[k]
        riga_tab(fig, .678 - i*.030,
                 [et, pc(r['t'][5], 0), pc(r['t'][50], 0),
                  pc(cagr(C, r['t'][50]), 1), f"{it(r['d'][90],1)}%",
                  f"{it(r['d'][95],1)}%", f"{it(r['d'][99],1)}%"],
                 xs, 8.6, col, 'bold')
    testo(fig, .070, .620,
          "12.000 storie, bootstrap a blocchi da 20, orizzonte di sette anni per tutti e due.",
          7.8, INK3)

    # ---- la cosa che va detta ----
    tit(fig, .548, 'Il 1300-1400% che speravi: non con questo drawdown', ROSSO)
    card(fig, .058, .368, .884, .164, ROSSO)
    testo(fig, .078, .512,
          f"Quel numero esiste, ma e' la colonna sbagliata. Il +{it(b['t'][50],0)}% e' la mediana dello\n"
          f"scenario COL BOOM: si avvera solo se i prossimi sette anni somigliano ai\n"
          f"migliori due che abbiamo visto. La previsione prudente, quella che mi hai\n"
          f"chiesto di usare, e' +{it(a['t'][50],0)}%.\n\n"
          f"Per avere +{it(SPERATO,0)}% nello scenario magro servirebbe oro {it(R_ORO*R['k_sperato'],2)}% e nasdaq "
          f"{it(R_NAS*R['k_sperato'],2)}%,\n"
          f"che porta il drawdown al {it(R['sperato_dd'][95],1)}% al 95o percentile e al {it(R['sperato_dd'][99],1)}% al 99o.", 8.8, INK)

    tit(fig, .326, 'Le due cose che puoi scegliere')
    xs2 = [(.070, 'left'), (.420, 'right'), (.600, 'right'), (.780, 'right'), (.930, 'right')]
    card(fig, .058, .196, .884, .118)
    riga_tab(fig, .296, ['', 'oro / nasdaq', 'mediana magra', 'DD 95%', ''],
             xs2, 8.0, INK3, 'bold')
    linea(fig, .286, .070, .930)
    riga_tab(fig, .262, ['tenere il drawdown al 33%', f"{it(R_ORO*SCELTO,2)}% / {it(R_NAS*SCELTO,2)}%",
                         pc(a['t'][50], 0), f"{it(a['d'][95],1)}%", '<< la tua regola'],
             xs2, 8.6, VERDE, 'bold')
    riga_tab(fig, .232, [f"avere il +{it(SPERATO,0)}% comunque",
                         f"{it(R_ORO*R['k_sperato'],2)}% / {it(R_NAS*R['k_sperato'],2)}%",
                         pc(SPERATO, 0), f"{it(R['sperato_dd'][95],1)}%", 'fuori dal tetto'],
             xs2, 8.6, ROSSO, 'bold')

    tit(fig, .156, 'Il numero sobrio')
    testo(fig, .058, .130,
          f"A rischio fisso — lotto costante, niente reinvestimento — la stessa impostazione da' una\n"
          f"mediana di {pc(R['fisso_pre'][50],0)} nello scenario magro e {pc(R['fisso_tot'][50],0)} su tutto il periodo, con drawdown al\n"
          f"95o percentile del {it(R['fisso_pre_dd'][95],1)}% e {it(R['fisso_tot_dd'][95],1)}%. E' la lettura da usare per fare i piani: il composto\n"
          f"moltiplica il rendimento, ma moltiplica anche l'errore che c'e' gia' dentro la misura.\n\n"
          f"Il bootstrap rimescola le STESSE operazioni: dice quanto puo' variare il percorso dato che\n"
          f"il vantaggio esista, non se esista. Per questo il rischio e' scelto sul periodo magro.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 2
def pag_grafico(C, R, F, pdf):
    fig = pagina('Come ci si arriva',
                 f'oro {it(R_ORO*SCELTO,2)}% e nasdaq {it(R_NAS*SCELTO,2)}%, la fascia dentro cui cadono le 12.000 storie')

    testo(fig, .058, .888,
          "La linea al centro e' la mediana. La fascia scura tiene meta' delle storie, quella chiara\n"
          "nove su dieci. Il capitale e' su scala logaritmica: una crescita costante e' una retta.", 8.8)

    for j, (k, et, col) in enumerate((('pre', 'SCENARIO MAGRO — la previsione da usare', CC),
                                      ('tot', 'TUTTO IL PERIODO — il caso favorevole', CT))):
        y0 = .812 - j*.398
        tit(fig, y0, et, col)
        ax = fig.add_axes([.098, y0 - .292, .844, .274])
        x, B = F[k]
        anni = x / x[-1] * C['d_tot']
        ax.fill_between(anni, B[5], B[95], color=col, alpha=.16, label='9 storie su 10')
        ax.fill_between(anni, B[25], B[75], color=col, alpha=.34, label="meta' delle storie")
        ax.plot(anni, B[50], color=col, lw=2.2,
                label=f"mediana  {pc(100*(B[50][-1]/DEP-1),0)}")
        ax.axhline(DEP, color=INK3, lw=.9, ls='--')
        ax.set_yscale('log'); griglia(ax)
        ax.set_xlabel('anni', fontsize=7.8)
        ax.set_ylabel('capitale (scala log)', fontsize=7.8)
        ax.tick_params(labelsize=7.2)
        ax.legend(fontsize=7.6, facecolor='#1c1c1a', edgecolor=GRIGLIA,
                  labelcolor=INK2, loc='upper left')
        fig.text(.930, y0 - .336,
                 f"dopo sette anni: {it(B[5][-1],0)} (5%)  ·  {it(B[50][-1],0)} (mediana)  ·  {it(B[95][-1],0)} (95%)",
                 fontsize=7.8, color=INK3, ha='right')

    testo(fig, .058, .060,
          "La fascia si allarga perche' con l'interesse composto l'incertezza si moltiplica, non si\n"
          "somma. Una previsione puntuale non ha senso: l'unica cosa governabile e' il drawdown.", 8.8)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== pag. 3
def pag_scambio(C, R, S, pdf):
    fig = pagina('Il baratto',
                 'ogni punto di rendimento in piu\' si paga in drawdown, e il cambio non e\' negoziabile')

    tit(fig, .888, 'Rendimento e drawdown salgono insieme')
    ax = fig.add_axes([.098, .586, .844, .282])
    dd = [S[w]['d'][95] for w in GRIGLIA_PESI]
    md = [S[w]['t'][50] for w in GRIGLIA_PESI]
    ax.plot(dd, md, 'o-', color=CC, lw=1.9, ms=5)
    for w, x, y in zip(GRIGLIA_PESI, dd, md):
        ax.annotate(f"  oro {it(R_ORO*w,2)}%", (x, y), fontsize=7.0, color=INK3,
                    va='center')
    i = GRIGLIA_PESI.index(SCELTO)
    ax.plot([dd[i]], [md[i]], 'o', color=VERDE, ms=11, mfc='none', mew=2)
    ax.axvline(TETTO, color=ROSSO, lw=1.6, ls=':')
    ax.text(TETTO - .4, max(md)*.95, 'il tuo tetto: 33% ', fontsize=7.8,
            color=ROSSO, ha='right')
    ax.axhline(SPERATO, color=VIOLA, lw=1.4, ls='--')
    ax.text(min(dd), SPERATO*1.06, f" il +{it(SPERATO,0)}% che speravi", fontsize=7.8, color=VIOLA)
    griglia(ax)
    ax.set_xlabel('drawdown al 95o percentile, scenario magro (%)', fontsize=7.8)
    ax.set_ylabel('rendimento mediano su 7 anni (%)', fontsize=7.8)
    ax.tick_params(labelsize=7.2)

    testo(fig, .058, .552,
          "Ogni pallino e' un'impostazione. Il cerchio verde e' quella scelta: sta esattamente sulla\n"
          "riga rossa, cioe' prende tutto il rendimento che il tuo tetto permette e non un punto di\n"
          "piu'. La riga viola e' il rendimento che speravi: per raggiungerla bisogna andare molto\n"
          "a destra della riga rossa.", 8.8)

    tit(fig, .468, 'La stessa cosa in tabella')
    xs = [(.070, 'left'), (.360, 'right'), (.500, 'right'), (.620, 'right'),
          (.740, 'right'), (.930, 'right')]
    card(fig, .058, .246, .884, .206)
    riga_tab(fig, .424, ['oro / nasdaq', 'MEDIANA magra', "all'anno",
                         'DD 95% magro', 'DD 95% tutto', ''], xs, 8.0, INK3, 'bold')
    linea(fig, .414, .070, .930)
    for i, w in enumerate(GRIGLIA_PESI):
        r, rt = S[w], S[w]['tot']
        fuori = r['d'][95] > TETTO
        col = VERDE if w == SCELTO else (ROSSO if fuori else INK2)
        nota = '<< SCELTO' if w == SCELTO else ('oltre il tetto' if fuori else '')
        riga_tab(fig, .390 - i*.028,
                 [f"{it(R_ORO*w,2)}%  /  {it(R_NAS*w,2)}%", pc(r['t'][50], 0),
                  pc(cagr(C, r['t'][50]), 1), f"{it(r['d'][95],1)}%",
                  f"{it(rt['d'][95],1)}%", nota],
                 xs, 8.5, col, 'bold' if w == SCELTO else 'normal')

    tit(fig, .208, 'Cosa cambiare, in pratica')
    xs2 = [(.070, 'left'), (.470, 'right'), (.650, 'right'), (.930, 'right')]
    card(fig, .058, .092, .884, .100)
    riga_tab(fig, .172, ['EA / parametro', 'adesso', 'da mettere', 'gambe interessate'],
             xs2, 8.0, INK3, 'bold')
    linea(fig, .162, .070, .930)
    riga_tab(fig, .138, ['ORO — InpRiskPercent', '0,70%', f"{it(R_ORO*SCELTO,2)}%",
                         'ROTTURA + RITRACCIAMENTO'], xs2, 8.6, GIALLO)
    riga_tab(fig, .112, ['NASDAQ — RiskPercent', '1,50%', f"{it(R_NAS*SCELTO,2)}%",
                         'la base, prima dell\'adattivo'], xs2, 8.6, BLU)

    testo(fig, .058, .070,
          "Le due strategie non sono mai girate insieme dentro MetaTrader (il tester prende un simbolo\n"
          "alla volta): esecuzioni in contesa e ordini rifiutati non sono simulati. L'arrotondamento\n"
          "del lotto neanche: su 10.000 allo 0,65% il lotto e' piccolo e il broker lo arrotonda, quindi\n"
          "il rischio vero puo' scostarsi di qualche punto. Si legge nel pannello, riga RISCHIO.", 8.6)
    pdf.savefig(fig); plt.close(fig)


# =============================================================== calcoli
def main(p_oro, p_nas, out):
    C = carica(p_oro, p_nas)
    print(f"magro {C['dal']} -> {C['al_pre']}  ({it(C['d_pre'],2)} anni, orizzonte x{it(C['oriz'],3)})")
    print(f"tutto {C['dal']} -> {C['al']}  ({it(C['d_tot'],2)} anni)")

    R = {}
    for scen in ('pre', 'tot'):
        r = mc(C, scen, SCELTO)
        R[scen] = {'t': tabella(r, 'rend'), 'd': tabella(r, 'dd_pct')}
        f = mc(C, scen, SCELTO, composto=False)
        R[f'fisso_{scen}'] = tabella(f, 'rend')
        R[f'fisso_{scen}_dd'] = tabella(f, 'dd_pct')
    print(f"  scelto x{SCELTO}: magro mediana {R['pre']['t'][50]:.0f}% DD95 {R['pre']['d'][95]:.2f}%"
          f" | tutto mediana {R['tot']['t'][50]:.0f}% DD95 {R['tot']['d'][95]:.2f}%")

    # il controllo che regge tutta la pagina 1: il tetto deve essere
    # rispettato in TUTTI E DUE gli scenari, altrimenti la scelta e' sbagliata
    assert R['pre']['d'][95] <= TETTO + 0.2, f"magro sfora: {R['pre']['d'][95]:.2f}%"
    assert R['tot']['d'][95] <= TETTO + 0.2, f"tutto sfora: {R['tot']['d'][95]:.2f}%"

    # quanto servirebbe per il rendimento sperato, e cosa costerebbe
    lo, hi = 0.5, 2.0
    for _ in range(20):
        m = (lo + hi) / 2
        if tabella(mc(C, 'pre', m, 4000), 'rend')[50] < SPERATO: lo = m
        else: hi = m
    R['k_sperato'] = round(lo, 2)
    rs = mc(C, 'pre', R['k_sperato'])
    R['sperato_dd'] = tabella(rs, 'dd_pct')
    print(f"  per +{SPERATO:.0f}% nel magro servirebbe x{R['k_sperato']:.2f}"
          f" -> DD95 {R['sperato_dd'][95]:.1f}%")

    S = {}
    for w in GRIGLIA_PESI:
        a = mc(C, 'pre', w); b = mc(C, 'tot', w)
        S[w] = {'t': tabella(a, 'rend'), 'd': tabella(a, 'dd_pct'),
                'tot': {'t': tabella(b, 'rend'), 'd': tabella(b, 'dd_pct')}}
    F = {k: fascia(C, k, SCELTO) for k in ('pre', 'tot')}

    with PdfPages(out) as pdf:
        pag_risposta(C, R, pdf)
        pag_grafico(C, R, F, pdf)
        pag_scambio(C, R, S, pdf)
    print('scritto', out)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2],
         sys.argv[3] if len(sys.argv) > 3 else 'report/la-scelta.pdf')
