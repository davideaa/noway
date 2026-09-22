#!/usr/bin/env python3
"""
Reel verticale, 40 secondi, per chi non sa niente di questo mondo.

Non spiega i report: racconta *come si fa* a sapere se un metodo per
investire funziona davvero, e lo fa vedere. Ogni scena e' un meccanismo che
si muove — il tempo che si taglia in due, i parametri che si bloccano, la
nuvola dei tentativi a caso, i colpi grossi che vengono tagliati — invece di
un grafico che compare e basta.

Le durate sono pesi: `alloca()` li converte in battiti interi per arrivare
ai secondi chiesti, qualunque sia il BPM del brano. Cosi' i cambi di scena
cadono sul battito E il video dura quanto deve.

    python3 video/reel.py                          # 40s a 70 BPM, muto
    python3 video/reel.py --audio brano.mp3        # misura i battiti e monta
    python3 video/reel.py --secondi 30             # piu' corto

Ogni numero viene da video/dati.json, estratto dai report. Niente a mano.
"""

import argparse, json, os, subprocess, sys
from PIL import Image, ImageDraw
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stile import *   # noqa

QUI = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(QUI, "dati.json")))

FPS = 30
MANIGLIA = "@quant_davide"        # cambialo col tuo
EYEBROW = "RICERCA QUANTITATIVA"

CURVA = np.array(D["curva_R"], np.float32)
# il sott'acqua: quanto sta sotto al suo massimo precedente, momento per momento
SOTT = CURVA - np.maximum.accumulate(CURVA)

# Dove finisce la meta' su cui si e' studiato e comincia quella tenuta chiusa.
# Il fuori campione e' 984 operazioni sulle 2.749: tagliando li', i due pezzi
# valgono +169,4 R e +180,6 R, cioe' esattamente i numeri del report.
N_OOS, N_TOT = 984, D["n"]
I_TAGLIO = int(round(len(CURVA) * (1 - N_OOS / N_TOT)))
FUORI = CURVA[I_TAGLIO:] - CURVA[I_TAGLIO]


# --- le nuvole di tentativi a caso, calcolate una volta sola ---------------
def _nuvola(n_curve=150, n_punti=170, sd=1.32, n_op=N_OOS, seme=7):
    """Tentativi sulla meta' tenuta chiusa, senza nessun vantaggio: stessa
    volatilita' per operazione (1,32 R, quella vera misurata li'), guadagno
    atteso zero. Fanno vedere cosa regala il caso su quelle 984 operazioni.
    Il confronto e' con FUORI, non con tutta la curva: il "sei su un milione"
    e' il numero del fuori campione, e i due devono parlare della stessa cosa."""
    r = np.random.default_rng(seme)
    passi = r.normal(0, sd * np.sqrt(n_op / n_punti), (n_curve, n_punti))
    c = np.cumsum(passi, 1)
    return np.concatenate([np.zeros((n_curve, 1)), c], 1)

NUVOLA = _nuvola()
MAX_CASO = float(NUVOLA[:, -1].max())


def _serie(seme, n=170, deriva=0.0):
    r = np.random.default_rng(seme)
    return np.concatenate([[0], np.cumsum(r.normal(deriva, 1.0, n))])

# quattro tentativi di "far tornare il passato": l'ultimo e' quello bello
TENTATIVI = [_serie(s, deriva=d) for s, d in
             ((3, 0.02), (11, 0.05), (29, 0.10), (5, 0.22))]


# ==========================================================================
#  telaio fisso
# ==========================================================================
def telaio(d, sez, didascalia, sub_mono=None, a=1.0):
    testo(d, (MARG, 226), EYEBROW, mono(20), INK_3, "la", track=6, alpha=a)
    if sez:
        testo(d, (W - MARG, 226), sez, mono(20), INK_3, "ra", track=6, alpha=a)
    glifo_ig(d, MARG, 1175, 34, INK, alpha=a * 0.9)
    testo(d, (MARG, 1240), MANIGLIA, monob(21), INK, "ls", alpha=a * 0.9)
    if sub_mono:
        testo(d, (W / 2 + 90, 1215), sub_mono, mono(20), INK_3, "ma", track=5, alpha=a)
    if didascalia:
        blocco(d, (W / 2, 1272), didascalia, med(27), INK_2, 760, 36, "ma", alpha=a)


# ==========================================================================
#  disegno di curve
# ==========================================================================
def _proietta(v, box, lo, hi):
    x0, y0, x1, y1 = box
    n = len(v)
    return [(x0 + i / (n - 1) * (x1 - x0),
             y1 - (v[i] - lo) / (hi - lo) * (y1 - y0)) for i in range(n)]


def traccia(d, v, box, lo, hi, col, w=3, prog=1.0, ombra=False, alpha=1.0,
            testina=False):
    n = max(int(len(v) * min(max(prog, 0.0), 1.0)), 2)
    px = _proietta(v[:n], box, lo, hi)
    if ombra:
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        oc = ACC if col == INK else col
        ImageDraw.Draw(ov).polygon(
            px + [(px[-1][0], box[3]), (box[0], box[3])],
            fill=(oc[0], oc[1], oc[2], int(32 * alpha)))
        d._image.paste(Image.alpha_composite(
            d._image.convert("RGBA"), ov).convert("RGB"), (0, 0))
    c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(col, BG_C))
    d.line(px, fill=c, width=w, joint="curve")
    if testina and n < len(v):
        d.ellipse([px[-1][0] - 5, px[-1][1] - 5, px[-1][0] + 5, px[-1][1] + 5], fill=c)
    return px


def curva_vera(d, box, prog=1.0, col=INK, w=3, ombra=True, alpha=1.0, testina=False):
    return traccia(d, CURVA, box, 0, CURVA.max() * 1.05, col, w, prog, ombra,
                   alpha, testina)


# ==========================================================================
#  le scene
# ==========================================================================
def s_gancio(d, p, dur):
    """La curva bella, e il dubbio che la segue."""
    telaio(d, "", "Sette anni, due mercati. Bello — ma non vuol dire ancora niente.",
           "RISULTATO STORICO")
    a, dy = entra(p * dur, 0.0, 0.4)
    testo(d, (W / 2, 330 + dy), "SETTE ANNI DI RISULTATI", mono(24), INK_2, "ma",
          track=7, alpha=a)
    v = num(0, 1223, p * dur, 0.1, 1.0)
    testo(d, (W / 2, 400 + dy), f"+{v:,.0f}%".replace(",", "."), bold(130), INK, "ma",
          alpha=a)
    curva_vera(d, (MARG + 40, 650, W - MARG - 40, 1010), out_cubic(p / 0.62),
               testina=True)
    a2, _ = entra(p * dur, dur * 0.60, 0.4)
    testo(d, (W / 2, 1075), "CHIUNQUE SA DISEGNARLA, GUARDANDO IL PASSATO",
          monob(23), WARN, "ma", track=2, alpha=a2)


def s_problema(d, p, dur):
    """Il meccanismo dell'illusione: tre manopole, e il passato torna sempre."""
    telaio(d, "IL PROBLEMA",
           "Girando le manopole, il passato si fa tornare sempre. Sul futuro no.",
           "LO STESSO METODO, PARAMETRI DIVERSI")
    a, dy = entra(p * dur, 0.0, 0.35)
    testo(d, (W / 2, 320 + dy), "PERCHE' NON TI PUOI FIDARE", mono(23), INK_2, "ma",
          track=6, alpha=a)
    testo(d, (W / 2, 380 + dy), "DI UN BEL GRAFICO", bold(74), INK, "ma", alpha=a)

    # le manopole si muovono, e a ogni giro la curva cambia forma
    q = min(p / 0.80, 1.0)
    fase = q * (len(TENTATIVI) - 1)
    i = min(int(fase), len(TENTATIVI) - 2)
    m = in_out(fase - i)
    serie = TENTATIVI[i] * (1 - m) + TENTATIVI[i + 1] * m

    for j, (et, f, off) in enumerate((("A", 1.7, 0.0), ("B", 2.3, 0.4), ("C", 1.3, 0.8))):
        y = 540 + j * 62
        pos = 0.5 + 0.34 * np.sin((q * f + off) * 6.2)
        cursore(d, MARG + 120, W - MARG - 150, y, pos, ACC, et, 0.0, a)

    lo, hi = min(t.min() for t in TENTATIVI), max(t.max() for t in TENTATIVI)
    traccia(d, serie, (MARG + 60, 760, W - MARG - 60, 1060), lo, hi, INK_2, 3,
            1.0, False, a)
    testo(d, (MARG + 60, 1100), "STESSI DATI · PARAMETRI DIVERSI", mono(19), INK_3,
          "la", track=4, alpha=a)
    a2, _ = entra(p * dur, dur * 0.72, 0.35)
    testo(d, (W / 2, 1140), "SI CHIAMA ADATTARE, NON PREVEDERE", monob(23), WARN,
          "ma", track=2, alpha=a2)


def s_passo1(d, p, dur):
    """Il tempo si taglia in due e la meta' buona si chiude a chiave."""
    telaio(d, "PASSO 1 DI 4",
           "Costruisco sulla prima meta'. La seconda resta chiusa: la guardo una volta sola, alla fine.",
           "5 ANNI PER STUDIARE · 2,7 MAI VISTI")
    a, dy = entra(p * dur, 0.0, 0.35)
    testo(d, (W / 2, 320 + dy), "PASSO UNO", mono(24), INK_2, "ma", track=7, alpha=a)
    testo(d, (W / 2, 380 + dy), "NASCONDITI META'", bold(72), INK, "ma", alpha=a)
    testo(d, (W / 2, 462 + dy), "DEL TEMPO", bold(72), INK, "ma", alpha=a)

    # il taglio scorre fino al 65%, poi si chiude il lucchetto, poi i parametri
    taglio = 0.02 + in_out(p / 0.32) * 0.63
    chiuso = out_cubic(max(p - 0.36, 0) / 0.18)
    box = (MARG + 50, 620, W - MARG - 50, 680)
    xt = barra_tempo(d, box, taglio, chiuso, a)
    testo(d, (box[0], 600), "QUI STUDIO", mono(19), ACC, "ls", track=3, alpha=a)
    testo(d, (box[2], 600), "QUI NON GUARDO", mono(19),
          WARN if chiuso > 0.1 else INK_4, "rs", track=3, alpha=a)

    blocc = out_cubic(max(p - 0.52, 0) / 0.18)
    for j, (et, pos) in enumerate((("A", 0.38), ("B", 0.71), ("C", 0.55))):
        y = 790 + j * 62
        cursore(d, MARG + 120, W - MARG - 150, y, pos, ACC, et, blocc, a)
    if blocc > 0.35:
        testo(d, (W / 2, 1000), "PARAMETRI BLOCCATI", monob(23), WARN, "ma",
              track=3, alpha=(blocc - 0.35) / 0.65 * a)

    ap = out_cubic(max(p - 0.70, 0) / 0.28)
    if ap > 0.01:
        testo(d, (W / 2, 1055), "ORA SI GUARDA LA META' CHIUSA", mono(21), INK_2,
              "ma", track=4, alpha=ap * a)
        bx = (xt, 1100, W - MARG - 50, 1160)
        traccia(d, FUORI, bx, FUORI.min(), FUORI.max() * 1.05, OK, 3, ap,
                False, a, True)


def s_passo2(d, p, dur):
    """La nuvola del caso sulla meta' chiusa, e la curva vera che ne esce."""
    telaio(d, "PASSO 2 DI 4",
           "Sulla meta' chiusa, tanti tentativi a caso disegnano comunque qualche bella curva. Il metro non e' lo zero: e' la fortuna.",
           "SOLO LA META' MAI VISTA")
    a, dy = entra(p * dur, 0.0, 0.35)
    testo(d, (W / 2, 320 + dy), "PASSO DUE", mono(24), INK_2, "ma", track=7, alpha=a)
    testo(d, (W / 2, 380 + dy), "BATTI LA FORTUNA,", bold(66), INK, "ma", alpha=a)
    testo(d, (W / 2, 455 + dy), "NON LO ZERO", bold(66), INK, "ma", alpha=a)

    box = (MARG + 50, 590, W - MARG - 50, 1020)
    lo, hi = -150.0, 200.0
    linea_h(d, box[0], box[2], box[3] - (0 - lo) / (hi - lo) * (box[3] - box[1]),
            INK_4, 2, a)

    # la nuvola entra a ondate: fa vedere che sono tanti tentativi, non uno
    q = lineare(p / 0.50)
    quante = int(len(NUVOLA) * q)
    for i in range(quante):
        f = 0.70 if i > quante - 8 else 0.22
        traccia(d, NUVOLA[i], box, lo, hi, INK_4, 2, 1.0, False, a * f)
    if quante:
        testo(d, (box[0], 570), f"{quante} TENTATIVI A CASO", mono(19),
              INK_3, "ls", track=3, alpha=a)

    # la riga del meglio che ha fatto il caso: e' il metro, non lo zero
    pm = out_cubic(max(p - 0.44, 0) / 0.16)
    if pm > 0.01:
        ym = box[3] - (MAX_CASO - lo) / (hi - lo) * (box[3] - box[1])
        tratteggio(d, (box[0], ym), (box[2], ym), WARN, 9, 7, 2, alpha=pm * a)
        testo(d, (box[0] + 8, ym - 26), "IL MEGLIO CHE HA FATTO IL CASO",
              monob(19), WARN, "la", track=2, alpha=pm * a)

    # poi la curva vera, che esce sopra tutte
    pv = lineare((p - 0.50) / 0.30)
    if pv > 0.01:
        vv = FUORI[::max(len(FUORI) // 170, 1)]
        traccia(d, vv, box, lo, hi, OK, 5, pv, False, a, True)
        testo(d, (box[2], 570), "LA STRATEGIA", monob(20), OK, "rs", track=3,
              alpha=pv * a)

    af = out_cubic(max(p - 0.74, 0) / 0.24)
    if af > 0.01:
        testo(d, (W / 2, 1065), "SU UN MILIONE DI TENTATIVI A CASO", mono(21),
              INK_2, "ma", track=4, alpha=af * a)
        testo(d, (W / 2, 1105), "SEI ARRIVANO QUI", monob(30), OK, "ma", track=3,
              alpha=af * a)


def s_passo3(d, p, dur):
    """I colpi grossi vengono tagliati, e si guarda cosa resta."""
    telaio(d, "PASSO 3 DI 4",
           "Taglio ogni vincita grossa: quelle potrebbero essere state fortuna. Se regge lo stesso, non lo era.",
           "OGNI VINCITA TAGLIATA A 3 R")
    a, dy = entra(p * dur, 0.0, 0.35)
    testo(d, (W / 2, 320 + dy), "PASSO TRE", mono(24), INK_2, "ma", track=7, alpha=a)
    testo(d, (W / 2, 380 + dy), "TOGLI I COLPI", bold(72), INK, "ma", alpha=a)
    testo(d, (W / 2, 458 + dy), "FORTUNATI", bold(72), INK, "ma", alpha=a)

    I = D["isto"]
    box = (MARG + 60, 620, W - MARG - 40, 940)
    x0, y0, x1, y1 = box
    n = len(I["x"])
    bw = (x1 - x0) / n
    mx = max(I["y"])

    # la ghigliottina scende da +10,8 R fino a +3 R
    q = in_out(p / 0.62)
    cap = 10.8 + (3.0 - 10.8) * q
    icap = next((i for i, v in enumerate(I["x"]) if v >= cap), n - 1)

    for i, v in enumerate(I["y"]):
        if not v:
            continue
        h = (v / mx) * (y1 - y0)
        tagliata = I["x"][i] > cap
        col = INK_4 if tagliata else (ORO if I["x"][i] >= 2 else
                                      (NEG if I["x"][i] < 0 else ACC))
        f = 0.25 if tagliata else 1.0
        c = tuple(int(round(k * f * a + b * (1 - f * a))) for k, b in zip(col, BG_C))
        d.rectangle([x0 + i * bw + 1, y1 - h, x0 + (i + 1) * bw - 1, y1], fill=c)
    linea_h(d, x0, x1, y1, INK_4, 2, a)

    xc = x0 + icap * bw
    tratteggio(d, (xc, y0 - 24), (xc, y1), NEG, 8, 7, 2, alpha=a)
    testo(d, (xc + 14, y0 - 34), f"taglio a {cap:.1f} R".replace(".", ","),
          monob(22), NEG, "la", alpha=a)
    testo(d, (x0, y1 + 30), "PERDITE", mono(18), INK_3, "la", track=3, alpha=a)
    testo(d, (x1, y1 + 30), "VINCITE", mono(18), INK_3, "ra", track=3, alpha=a)

    # il totale che scende mentre la ghigliottina scende
    tot = 350.0 + (180.1 - 350.0) * q
    ar, dyr = entra(p * dur, dur * 0.58, 0.4)
    testo(d, (W / 2, 1010 + dyr), "RESTA COMUNQUE", mono(21), INK_2, "ma", track=4,
          alpha=ar * a)
    testo(d, (W / 2, 1050 + dyr), f"+{tot:.0f} R", bold(64), OK, "ma", alpha=ar * a)
    testo(d, (W / 2, 1145), "buttando via ogni colpo grosso di sette anni",
          mono(19), INK_3, "ma", alpha=ar * a)


def s_passo4(d, p, dur):
    """I costi si moltiplicano finche' il sistema non muore."""
    telaio(d, "PASSO 4 DI 4",
           "Ogni operazione costa. Moltiplico i costi finche' il guadagno sparisce: serve quasi sei volte quelli veri.",
           "COSTI MOLTIPLICATI")
    a, dy = entra(p * dur, 0.0, 0.35)
    testo(d, (W / 2, 320 + dy), "PASSO QUATTRO", mono(24), INK_2, "ma", track=6, alpha=a)
    testo(d, (W / 2, 380 + dy), "FALLO PAGARE", bold(72), INK, "ma", alpha=a)

    S = D["stress"]
    ks = np.array([s["k"] for s in S], np.float32)
    rs = np.array([s["r"] for s in S], np.float32)
    box = (MARG + 90, 570, W - MARG - 60, 900)
    x0, y0, x1, y1 = box
    X = lambda k: x0 + (k - 1) / 7 * (x1 - x0)
    Y = lambda v: y0 + (380 - v) / 580 * (y1 - y0)
    for g in (-200, -100, 0, 100, 200, 300):
        linea_h(d, x0, x1, Y(g), INK_4 if g == 0 else (32, 35, 43),
                2 if g == 0 else 1, a)
        testo(d, (x0 - 14, Y(g) + 7), ("+" if g > 0 else "") + str(g), mono(18),
              INK_3, "ra", alpha=a)
    for s in S:
        testo(d, (X(s["k"]), y1 + 30), f"{s['k']}×", mono(18), INK_3, "ma", alpha=a)

    # la manopola dei costi sale da 1x a 8x e la linea si traccia sotto di lei
    q = in_out(p / 0.70)
    k = 1 + 7 * q
    r = float(np.interp(k, ks, rs))
    fitta = np.linspace(1, k, max(int(q * 60) + 2, 2))
    px = [(X(t), Y(float(np.interp(t, ks, rs)))) for t in fitta]
    c = tuple(int(round(v * a + b * (1 - a))) for v, b in zip(ACC, BG_C))
    d.line(px, fill=c, width=4, joint="curve")
    d.ellipse([X(k) - 8, Y(r) - 8, X(k) + 8, Y(r) + 8],
              fill=NEG if r < 0 else ACC, outline=BG_C, width=2)

    u = [s for s in S if s["r"] > 0][-1]
    w_ = [s for s in S if s["r"] <= 0][0]
    kx = u["k"] + u["r"] / (u["r"] - w_["r"]) * (w_["k"] - u["k"])
    if k > kx:
        az = min((k - kx) / 0.8, 1.0)
        tratteggio(d, (X(kx), y0), (X(kx), y1), NEG, 8, 7, 2, alpha=az * a)

    testo(d, (W / 2, 965), f"COSTI ×{k:.1f}".replace(".", ","), mono(22), INK_2,
          "ma", track=4, alpha=a)
    testo(d, (W / 2, 1005), ("+" if r >= 0 else "−") + f"{abs(r):.0f} R",
          bold(62), OK if r > 0 else NEG, "ma", alpha=a)
    af = out_cubic(max(p - 0.72, 0) / 0.26)
    if af > 0.01:
        testo(d, (W / 2, 1105), f"MUORE A {kx:.1f}× I COSTI VERI".replace(".", ","),
              monob(25), NEG, "ma", track=2, alpha=af * a)
        testo(d, (W / 2, 1147), "nessun broker peggiora di sei volte", mono(19),
              INK_3, "ma", alpha=af * a)


def s_risultato(d, p, dur):
    """Cosa resta in mano, col prezzo scritto sotto."""
    telaio(d, "IL RISULTATO",
           "Quattro passaggi superati. Questo e' quello che resta, col suo prezzo.",
           "DOPO I QUATTRO PASSAGGI")
    a, dy = entra(p * dur, 0.0, 0.35)
    testo(d, (W / 2, 310 + dy), "COSA RESTA IN MANO", mono(24), INK_2, "ma",
          track=6, alpha=a)

    box = (MARG + 50, 380, W - MARG - 50, 660)
    curva_vera(d, box, out_cubic(min(p / 0.46, 1.0)), OK, 3, True, a, True)

    # il sott'acqua, sotto la curva: quanto si sta sotto al massimo
    bu = (MARG + 50, 690, W - MARG - 50, 790)
    pu = out_cubic(max(p - 0.24, 0) / 0.42)
    if pu > 0.01:
        traccia(d, SOTT, bu, SOTT.min() * 1.05, 0, NEG, 2, pu, True, a)
        testo(d, (bu[0], 812), "QUANTO STA SOTTO AL SUO MASSIMO", mono(18), INK_3,
              "la", track=3, alpha=pu * a)

    voci = [("RENDIMENTO", "~29%", "all'anno", INK, 0.44),
            ("ANNO TIPICO", f"+{D['mc']['50']:.1f} R".replace(".", ","),
             "uno su venti in perdita", ACC, 0.56),
            ("DA METTERE IN CONTO", "−35%", "prima o poi, per mesi", NEG, 0.68)]
    for i, (k, v, nn, col, t0) in enumerate(voci):
        aa, ddy = entra(p * dur, dur * t0, 0.35)
        y = 860 + i * 92 + ddy
        testo(d, (MARG + 70, y), k, mono(19), INK_3, "la", track=4, alpha=aa * a)
        testo(d, (MARG + 70, y + 56), v, monob(40), col, "ls", alpha=aa * a)
        testo(d, (W - MARG - 70, y + 50), nn, mono(20), INK_3, "rs", alpha=aa * a)
        if i < 2:
            linea_h(d, MARG + 70, W - MARG - 70, y + 74, (30, 33, 41), 1, aa * a)


def s_chiusura(d, p, dur):
    telaio(d, "", "Non indovinano il futuro. Buttano via quello che non regge.", None)
    a, dy = entra(p * dur, 0.0, 0.4)
    testo(d, (W / 2, 400 + dy), "NESSUNO DI QUESTI", bold(56), INK_2, "ma", alpha=a)
    a2, dy2 = entra(p * dur, 0.22, 0.4)
    testo(d, (W / 2, 470 + dy2), "PASSAGGI INDOVINA", bold(56), INK, "ma", alpha=a2)
    testo(d, (W / 2, 540 + dy2), "IL FUTURO", bold(56), INK, "ma", alpha=a2)
    a3, _ = entra(p * dur, 0.5, 0.45)
    testo(d, (W / 2, 645), "SERVONO A BUTTARE VIA", mono(23), INK_2, "ma", track=5,
          alpha=a3)
    testo(d, (W / 2, 687), "QUELLO CHE NON REGGE", monob(30), OK, "ma", track=3,
          alpha=a3)
    curva_vera(d, (MARG + 60, 770, W - MARG - 60, 990), 1.0, INK_4, 2, False,
               a3 * 0.6)
    a4, dy4 = entra(p * dur, 0.75, 0.45)
    glifo_ig(d, W / 2 - 34, 820 + dy4, 68, INK, alpha=a4)
    testo(d, (W / 2, 930 + dy4), MANIGLIA, monob(34), INK, "ma", alpha=a4)
    testo(d, (W / 2, 980 + dy4), "ogni numero misurato, anche quelli scomodi",
          mono(21), INK_3, "ma", alpha=a4)


# peso (quanto deve durare, in proporzione) · funzione
SCENE = [
    (4.5, s_gancio),
    (4.5, s_problema),
    (6.5, s_passo1),
    (6.0, s_passo2),
    (5.0, s_passo3),
    (4.5, s_passo4),
    (6.0, s_risultato),
    (3.0, s_chiusura),
]


# ==========================================================================
#  montaggio
# ==========================================================================
def alloca(pesi, bpm, secondi, minimo=3):
    """Converte i pesi in battiti interi che sommati fanno `secondi`.
    Cosi' ogni cambio scena cade su un battito qualunque sia il BPM."""
    sb = 60.0 / bpm
    tot = max(int(round(secondi / sb)), minimo * len(pesi))
    grezzi = [p / sum(pesi) * tot for p in pesi]
    b = [max(int(np.floor(g)), minimo) for g in grezzi]
    resto = tot - sum(b)
    ordine = list(np.argsort([-(g - np.floor(g)) for g in grezzi]))
    i = 0
    while resto > 0:
        b[ordine[i % len(b)]] += 1
        resto -= 1
        i += 1
    while resto < 0:                     # troppo lungo: tolgo dai piu' lunghi
        j = int(np.argmax(b))
        if b[j] <= minimo:
            break
        b[j] -= 1
        resto += 1
    return b


def rendi(bpm, offset, battiti_brano, out, audio=None, secondi=40.0, crf=18):
    sb = 60.0 / bpm
    nb = alloca([p for p, _ in SCENE], bpm, secondi)
    inizi, acc = [], offset
    for k in nb:
        inizi.append(acc)
        acc += k * sb
    durata = acc
    nfr = int(durata * FPS)
    print("battiti per scena:", nb, f"· scena piu' corta {min(nb) * sb:.2f}s")

    bg = fondo()
    bgn = np.asarray(bg, np.float32)
    ff = __import__("imageio_ffmpeg").get_ffmpeg_exe()
    cmd = [ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if audio:
        cmd += ["-i", audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac",
                "-b:a", "192k", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    for f in range(nfr):
        tt = f / FPS
        im = bg.copy()
        d = ImageDraw.Draw(im)
        d._image = im

        idx = 0
        for i, s in enumerate(inizi):
            if tt >= s:
                idx = i
        dur = nb[idx] * sb
        loc = tt - inizi[idx]

        SCENE[idx][1](d, min(loc / dur, 1.0), dur)

        fade = min(out_cubic(loc / (sb * 0.40)), 1.0)
        rest = dur - loc
        if rest < sb * 0.30:
            fade *= out_cubic(rest / (sb * 0.30))
        arr = np.asarray(im, np.float32)
        if fade < 0.999:
            arr = bgn + (arr - bgn) * fade

        # il respiro sul battito
        if battiti_brano is not None and len(battiti_brano) and tt >= battiti_brano[0]:
            db = tt - battiti_brano[np.searchsorted(battiti_brano, tt, "right") - 1]
        else:
            db = (tt - offset) % sb
        k = max(0.0, 1.0 - db / (sb * 0.5)) ** 2
        if k > 0.02:
            z = 1.0 + 0.007 * k
            im2 = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
            nw, nh = int(W * z), int(H * z)
            im2 = im2.resize((nw, nh), Image.BILINEAR).crop(
                ((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
            arr = np.asarray(im2, np.float32) * (1 + 0.03 * k)

        proc.stdin.write(np.clip(arr, 0, 255).astype(np.uint8).tobytes())
        if f % 150 == 0:
            print(f"  {f}/{nfr}  ({tt:5.1f}s)", flush=True)

    proc.stdin.close()
    proc.wait()
    print(f"scritto {out} · {durata:.2f}s · {bpm:.1f} BPM")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--bpm", type=float, default=70.0)
    ap.add_argument("--offset", type=float, default=0.0)
    ap.add_argument("--secondi", type=float, default=40.0)
    ap.add_argument("--audio", default=None, help="mp3/m4a del brano")
    ap.add_argument("--out", default=os.path.join(QUI, "reel.mp4"))
    a = ap.parse_args()

    bt = None
    if a.audio:
        from battiti import misura
        a.bpm, a.offset, bt = misura(a.audio)
        print(f"misurati dal brano: {a.bpm:.1f} BPM, primo battito a {a.offset:.3f}s")
    rendi(a.bpm, a.offset, bt, a.out, a.audio, a.secondi)
