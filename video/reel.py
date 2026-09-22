#!/usr/bin/env python3
"""
Reel verticale con apertura e chiusura sul logo.

Niente maniglie, niente didascalie in fondo: lo schermo e' tutto per il
numero e per il grafico. Ogni scena e' un meccanismo che si muove.

    python3 video/reel.py                          # 42s a 70 BPM, muto
    python3 video/reel.py --audio brano.mp3        # misura i battiti e monta
    python3 video/reel.py --secondi 30             # piu' corto

Tutto viene da video/dati.json. La curva del capitale e' ricostruita dalle
1.597 tappe vere in R: vedi LEGGIMI.md per come, e per i controlli che la
dicono fedele.
"""

import argparse, json, os, subprocess, sys
from PIL import Image, ImageDraw
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stile import *   # noqa

QUI = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(QUI, "dati.json")))

FPS = 30
EYEBROW = "RICERCA QUANTITATIVA"

CURVA = np.array(D["curva_R"], np.float32)
CAP = np.array(D["capitale"], np.float32)
DDC = np.array(D["dd_capitale"], np.float32) * 100        # in punti percentuali
I_PDF = D["i_pdf"]
ANNI = D["anni"]

# la meta' tenuta chiusa: 984 operazioni su 2.749
N_OOS = D["t"]["oos_n"]
I_TAGLIO = int(round(len(CURVA) * (1 - N_OOS / D["n"])))
FUORI = CURVA[I_TAGLIO:] - CURVA[I_TAGLIO]

# l'anno in cui comincia il fuori campione
A_OOS = 5                                                  # 2024, sesto anno


def _nuvola(n_curve=150, n_punti=170, sd=None, seme=7):
    """Tentativi sulla meta' chiusa senza nessun vantaggio: stessa
    volatilita' per operazione, guadagno atteso zero."""
    sd = sd or D["t"]["oos_sd"]
    r = np.random.default_rng(seme)
    passi = r.normal(0, sd * np.sqrt(N_OOS / n_punti), (n_curve, n_punti))
    return np.concatenate([np.zeros((n_curve, 1)), np.cumsum(passi, 1)], 1)

NUVOLA = _nuvola()
MAX_CASO = float(NUVOLA[:, -1].max())


def _serie(seme, n=170, deriva=0.0):
    r = np.random.default_rng(seme)
    return np.concatenate([[0], np.cumsum(r.normal(deriva, 1.0, n))])

TENTATIVI = [_serie(s, deriva=d) for s, d in
             ((3, 0.02), (11, 0.05), (29, 0.10), (5, 0.22))]


# ==========================================================================
#  il telaio: solo una riga in alto, niente altro
# ==========================================================================
def testata(d, sez=None, a=1.0):
    testo(d, (MARG, 210), EYEBROW, mono(21), INK_3, "la", track=7, alpha=a)
    if sez:
        testo(d, (W - MARG, 210), sez, mono(21), ACC, "ra", track=7, alpha=a)
    linea_h(d, MARG, W - MARG, 248, (28, 31, 39), 1, a)


def titolo(d, righe_, y, a=1.0, dy=0.0, col=INK, px=82, occhiello=None, acc=None):
    """Il titolo grosso, con l'occhiello sopra e il filetto sotto."""
    if occhiello:
        testo(d, (W / 2, y - 52 + dy), occhiello, mono(24), INK_3, "ma",
              track=8, alpha=a)
    for i, r in enumerate(righe_):
        testo(d, (W / 2, y + i * (px + 8) + dy), r, bold(px),
              col if i == 0 or acc is None else acc, "ma", alpha=a)
    yb = y + len(righe_) * (px + 8) + dy
    d.line([(W / 2 - 44, yb + 14), (W / 2 + 44, yb + 14)],
           fill=tuple(int(round(k * a + b * (1 - a))) for k, b in zip(ACC, BG_C)),
           width=3)
    return yb + 40


# ==========================================================================
#  curve
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
        ImageDraw.Draw(ov).polygon(px + [(px[-1][0], box[3]), (box[0], box[3])],
                                   fill=(oc[0], oc[1], oc[2], int(34 * alpha)))
        d._image.paste(Image.alpha_composite(
            d._image.convert("RGBA"), ov).convert("RGB"), (0, 0))
    c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(col, BG_C))
    d.line(px, fill=c, width=w, joint="curve")
    if testina and n < len(v):
        d.ellipse([px[-1][0] - 6, px[-1][1] - 6, px[-1][0] + 6, px[-1][1] + 6], fill=c)
    return px


def curva_capitale(d, box, prog=1.0, alpha=1.0, testina=True, col=INK, w=4,
                   ombra=True, griglia=True):
    """Il capitale in scala logaritmica, come nel pdf: cosi' un raddoppio
    occupa lo stesso spazio all'inizio e alla fine."""
    lv = np.log10(CAP)
    lo, hi = np.log10(9000), np.log10(160000)
    if griglia:
        for t, et in ((10000, "10 mila"), (30000, "30"), (100000, "100 mila")):
            y = box[3] - (np.log10(t) - lo) / (hi - lo) * (box[3] - box[1])
            linea_h(d, box[0], box[2], y, (30, 33, 41), 1, alpha)
            testo(d, (box[0] - 12, y + 7), et, mono(18), INK_3, "ra", alpha=alpha)
    return traccia(d, lv, box, lo, hi, col, w, prog, ombra, alpha, testina)


# ==========================================================================
#  scene
# ==========================================================================
def s_logo_in(d, p, dur, img=None):
    """Il logo entra: sale dal buio, una lama di luce lo attraversa, pulsa."""
    a = out_cubic(p / 0.30)
    sc = 1.0 + 0.16 * (1 - out_quint(p / 0.55))
    bag = 0.9 * (1 - out_cubic(p / 0.45)) + 0.16
    sw = None
    if 0.26 < p < 0.68:
        sw = (p - 0.26) / 0.42
    img[0] = logo(img[0], W / 2, 880, 720 * sc, a, bag, sw)
    if p > 0.52:
        ar = out_cubic((p - 0.52) / 0.26)
        dd = ImageDraw.Draw(img[0])
        dd._image = img[0]
        testo(dd, (W / 2, 1300), "RICERCA QUANTITATIVA", mono(26), INK_2, "ma",
              track=10, alpha=ar)
        dd.line([(W / 2 - 60 * ar, 1360), (W / 2 + 60 * ar, 1360)], fill=ACC, width=3)


def s_gancio(d, p, dur):
    testata(d, None, out_cubic(p / 0.2))
    a, dy = entra(p * dur, 0.0, 0.4)
    testo(d, (W / 2, 330 + dy), "SETTE ANNI, DUE MERCATI", mono(25), INK_3, "ma",
          track=8, alpha=a)
    v = num(0, 1223, p * dur, 0.1, 1.1)
    testo(d, (W / 2, 396 + dy), f"+{v:,.0f}%".replace(",", "."), bold(150), INK,
          "ma", alpha=a)
    a2, _ = entra(p * dur, dur * 0.34, 0.4)
    testo(d, (W / 2, 590), "DA 10.000 A 132.328 EURO", monob(30), ACC, "ma",
          track=3, alpha=a2)
    curva_capitale(d, (MARG + 76, 690, W - MARG - 30, 1180), out_cubic(p / 0.70))
    a3, _ = entra(p * dur, dur * 0.72, 0.4)
    testo(d, (W / 2, 1250), "2.520 OPERAZIONI, UNA DI SEGUITO ALL'ALTRA",
          mono(21), INK_3, "ma", track=4, alpha=a3)


def s_problema(d, p, dur):
    testata(d, "IL PROBLEMA")
    a, dy = entra(p * dur, 0.0, 0.35)
    titolo(d, ["UN BEL GRAFICO", "NON E' UNA PROVA"], 340, a, dy, INK, 78,
           "PRIMA DI CREDERCI")

    q = min(p / 0.82, 1.0)
    fase = q * (len(TENTATIVI) - 1)
    i = min(int(fase), len(TENTATIVI) - 2)
    serie = TENTATIVI[i] * (1 - in_out(fase - i)) + TENTATIVI[i + 1] * in_out(fase - i)

    for j, (et, f, off) in enumerate((("A", 1.7, 0.0), ("B", 2.3, 0.4), ("C", 1.3, 0.8))):
        cursore(d, MARG + 130, W - MARG - 90, 620 + j * 74,
                0.5 + 0.34 * np.sin((q * f + off) * 6.2), ACC, et, 0.0, a)

    lo, hi = min(t.min() for t in TENTATIVI), max(t.max() for t in TENTATIVI)
    traccia(d, serie, (MARG + 60, 880, W - MARG - 60, 1210), lo, hi, INK_2, 3,
            1.0, False, a)
    a2, _ = entra(p * dur, dur * 0.70, 0.35)
    testo(d, (W / 2, 1265), "SI CHIAMA ADATTARE, NON PREVEDERE", monob(27), WARN,
          "ma", track=3, alpha=a2)


def s_passo1(d, p, dur):
    testata(d, "PASSO 1 DI 3")
    a, dy = entra(p * dur, 0.0, 0.35)
    titolo(d, ["NASCONDI META'", "DEL TEMPO"], 330, a, dy, INK, 80, "COME SI VERIFICA")

    taglio = 0.02 + in_out(p / 0.30) * 0.62
    chiuso = out_cubic(max(p - 0.33, 0) / 0.16)
    box = (MARG + 40, 640, W - MARG - 40, 706)
    xt = barra_tempo(d, box, taglio, chiuso, a)
    testo(d, (box[0], 616), "QUI STUDIO", mono(21), ACC, "ls", track=4, alpha=a)
    testo(d, (box[2], 616), "QUI NON GUARDO", mono(21),
          WARN if chiuso > 0.1 else INK_4, "rs", track=4, alpha=a)

    blocc = out_cubic(max(p - 0.48, 0) / 0.16)
    for j, (et, pos) in enumerate((("A", 0.38), ("B", 0.71), ("C", 0.55))):
        cursore(d, MARG + 130, W - MARG - 96, 830 + j * 74, pos, ACC, et, blocc, a)
    if blocc > 0.3:
        testo(d, (W / 2, 1055), "PARAMETRI BLOCCATI", monob(27), WARN, "ma",
              track=4, alpha=(blocc - 0.3) / 0.7 * a)

    ap = out_cubic(max(p - 0.66, 0) / 0.30)
    if ap > 0.01:
        testo(d, (W / 2, 1130), "POI SI APRE, UNA VOLTA SOLA", mono(22), INK_2,
              "ma", track=5, alpha=ap * a)
        traccia(d, FUORI, (xt, 1180, W - MARG - 40, 1280), FUORI.min(),
                FUORI.max() * 1.05, OK, 4, ap, False, a, True)


def s_passo2(d, p, dur):
    testata(d, "PASSO 2 DI 3")
    a, dy = entra(p * dur, 0.0, 0.35)
    titolo(d, ["BATTI LA FORTUNA,", "NON LO ZERO"], 330, a, dy, INK, 72,
           "IL METRO GIUSTO")

    box = (MARG + 40, 640, W - MARG - 40, 1130)
    lo, hi = -150.0, 200.0
    linea_h(d, box[0], box[2], box[3] - (0 - lo) / (hi - lo) * (box[3] - box[1]),
            INK_4, 2, a)

    q = lineare(p / 0.48)
    quante = int(len(NUVOLA) * q)
    for i in range(quante):
        traccia(d, NUVOLA[i], box, lo, hi, INK_4, 2, 1.0, False,
                a * (0.70 if i > quante - 8 else 0.22))
    if quante:
        testo(d, (box[0], 614), f"{quante} TENTATIVI A CASO", mono(21), INK_3,
              "ls", track=4, alpha=a)

    pm = out_cubic(max(p - 0.42, 0) / 0.16)
    if pm > 0.01:
        ym = box[3] - (MAX_CASO - lo) / (hi - lo) * (box[3] - box[1])
        tratteggio(d, (box[0], ym), (box[2], ym), WARN, 10, 8, 2, alpha=pm * a)
        testo(d, (box[0] + 8, ym - 30), "IL MEGLIO CHE HA FATTO IL CASO",
              monob(21), WARN, "la", track=2, alpha=pm * a)

    pv = lineare((p - 0.48) / 0.30)
    if pv > 0.01:
        traccia(d, FUORI[::max(len(FUORI) // 170, 1)], box, lo, hi, OK, 5, pv,
                False, a, True)
        testo(d, (box[2], 614), "LA STRATEGIA", monob(22), OK, "rs", track=3,
              alpha=pv * a)

    af = out_cubic(max(p - 0.74, 0) / 0.24)
    if af > 0.01:
        testo(d, (W / 2, 1190), "SU UN MILIONE DI TENTATIVI A CASO", mono(23),
              INK_3, "ma", track=5, alpha=af * a)
        testo(d, (W / 2, 1232), "SEI ARRIVANO QUI", bold(50), OK, "ma", alpha=af * a)


def s_anni(d, p, dur):
    testata(d, "PASSO 3 DI 3")
    a, dy = entra(p * dur, 0.0, 0.35)
    titolo(d, ["OTTO ANNI SU OTTO", "IN UTILE"], 330, a, dy, INK, 70,
           "NON UN ANNO FORTUNATO")

    vals = [r[1] for r in D["per_anno_R"]]
    cols = [ACC if i < A_OOS else OK for i in range(len(vals))]
    prog = in_out(p / 0.55)
    box = (MARG + 60, 660, W - MARG - 40, 1080)
    barre(d, box, vals, cols, ANNI, prog, 0, 128, a)

    a2, _ = entra(p * dur, dur * 0.60, 0.4)
    for i, (et, col) in enumerate((("2019-2023   QUI SI E' STUDIATO", ACC),
                                   ("2024-2026   MAI VISTI PRIMA", OK))):
        y = 1150 + i * 46
        d.rounded_rectangle([MARG + 60, y - 2, MARG + 82, y + 20], radius=3,
                            fill=tuple(int(round(k * a2 + b * (1 - a2)))
                                       for k, b in zip(col, BG_C)))
        testo(d, (MARG + 100, y), et, mono(21), INK_2, "la", track=2, alpha=a2)
    testo(d, (W - MARG - 60, 1172), "NESSUN ANNO", bold(38), INK, "ra", alpha=a2)
    testo(d, (W - MARG - 60, 1216), "IN PERDITA", bold(38), OK, "ra", alpha=a2)


def s_drawdown(d, p, dur):
    testata(d, "IL PREZZO")
    a, dy = entra(p * dur, 0.0, 0.35)
    titolo(d, ["QUANTO SI STA", "SOTT'ACQUA"], 330, a, dy, INK, 76, "LA PARTE SCOMODA")

    box = (MARG + 66, 660, W - MARG - 30, 1010)
    prog = out_cubic(p / 0.58)
    Y = area_neg(d, DDC, box, -24.0, NEG, prog, a)
    for g in (-5, -10, -15, -20):
        linea_h(d, box[0], box[2], Y(g), (30, 33, 41), 1, a)
        testo(d, (box[0] - 12, Y(g) + 7), f"{g}%", mono(18), INK_3, "ra", alpha=a)

    # il punto piu' profondo, segnato mentre la curva ci arriva
    imin = int(np.argmin(DDC))
    if prog > imin / len(DDC):
        am = out_cubic((prog - imin / len(DDC)) / 0.18)
        xm = box[0] + imin / (len(DDC) - 1) * (box[2] - box[0])
        d.ellipse([xm - 7, Y(DDC[imin]) - 7, xm + 7, Y(DDC[imin]) + 7], fill=NEG)
        testo(d, (xm, Y(DDC[imin]) + 26), "−21,7%", monob(26), NEG, "ma",
              alpha=am * a)

    a2, _ = entra(p * dur, dur * 0.56, 0.4)
    for i, (k, v, col) in enumerate((("IL PEGGIORE", "−21,7%", NEG),
                                     ("SOTTO IL MASSIMO", "87% DEL TEMPO", INK_2),
                                     ("PIU' LUNGO", "17 MESI", WARN))):
        y = 1090 + i * 74
        testo(d, (MARG + 60, y), k, mono(21), INK_3, "la", track=4, alpha=a2)
        testo(d, (W - MARG - 60, y - 4), v, monob(30), col, "ra", alpha=a2)
        if i < 2:
            linea_h(d, MARG + 60, W - MARG - 60, y + 40, (28, 31, 39), 1, a2)


def s_montecarlo(d, p, dur):
    testata(d, "COSA ASPETTARSI")
    a, dy = entra(p * dur, 0.0, 0.35)
    titolo(d, ["DIECIMILA ANNI", "SIMULATI"], 330, a, dy, INK, 76, "UN ANNO QUALUNQUE")

    M = D["mc"]
    box = (MARG + 50, 680, W - MARG - 50, 1060)
    x0, y0, x1, y1 = box
    xs, ys = M["x"], M["y"]
    lo, hi = xs[0], xs[-1] + 5
    X = lambda v: x0 + (v - lo) / (hi - lo) * (x1 - x0)
    mx = max(ys)
    q = out_cubic(p / 0.50)

    # la fascia fra il 5° e il 95° percentile, dove cade l'anno nel 90% dei casi
    pf = out_cubic(max(p - 0.34, 0) / 0.22)
    if pf > 0.01:
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(ov).rectangle([X(M["p"]["5"]), y0, X(M["p"]["95"]), y1],
                                     fill=(ACC[0], ACC[1], ACC[2], int(26 * pf * a)))
        d._image.paste(Image.alpha_composite(
            d._image.convert("RGBA"), ov).convert("RGB"), (0, 0))

    bw = (x1 - x0) / len(xs)
    for i, v in enumerate(ys):
        if not v:
            continue
        h = v / mx * (y1 - y0) * q
        col = NEG if xs[i] < 0 else ACC
        c = tuple(int(round(k * a + b * (1 - a))) for k, b in zip(col, BG_C))
        d.rectangle([X(xs[i]) + 1, y1 - h, X(xs[i]) + bw - 1, y1], fill=c)
    linea_h(d, x0, x1, y1, INK_4, 2, a)
    for g in (-50, 0, 50, 100, 150):
        testo(d, (X(g), y1 + 28), ("+" if g > 0 else "") + str(g), mono(19),
              INK_3, "ma", alpha=a)

    pm = out_cubic(max(p - 0.44, 0) / 0.20)
    if pm > 0.01:
        xm = X(M["p"]["50"])
        d.line([(xm, y0 - 10), (xm, y1)], fill=ACC, width=3)
        testo(d, (xm, y0 - 66), "MEDIANA", mono(19), ACC, "ma", track=3, alpha=pm * a)
        testo(d, (xm, y0 - 42), f"+{M['p']['50']:.1f} R".replace(".", ","),
              monob(24), ACC, "ma", alpha=pm * a)

    a2, _ = entra(p * dur, dur * 0.62, 0.4)
    for i, (k, v, col) in enumerate(
            (("ANNO TIPICO", "~29%", INK),
             ("ANNI IN PERDITA", f"{M['neg']}%".replace(".", ","), NEG),
             ("NEL 90% DEI CASI", ("da %+.1f a %+.1f R"
                                  % (M["p"]["5"], M["p"]["95"])).replace(".", ","),
              ACC))):
        y = 1130 + i * 66
        testo(d, (MARG + 60, y), k, mono(21), INK_3, "la", track=4, alpha=a2)
        testo(d, (W - MARG - 60, y - 4), v, monob(28), col, "ra", alpha=a2)


def s_tre_curve(d, p, dur):
    testata(d, "PERCHE' DUE")
    a, dy = entra(p * dur, 0.0, 0.35)
    titolo(d, ["INSIEME NON E'", "UNA SOMMA"], 330, a, dy, INK, 76, "LE DUE GAMBE")

    G = D["gambe"]
    box = (MARG + 76, 660, W - MARG - 40, 1060)
    lo, hi = np.log10(0.8), np.log10(16.0)
    for t, et in ((1, "×1"), (3, "×3"), (10, "×10")):
        y = box[3] - (np.log10(t) - lo) / (hi - lo) * (box[3] - box[1])
        linea_h(d, box[0], box[2], y, (30, 33, 41), 1, a)
        testo(d, (box[0] - 12, y + 7), et, mono(18), INK_3, "ra", alpha=a)

    for i, (k, col, w, t0) in enumerate((("oro", ORO, 3, 0.05),
                                         ("nasdaq", ACC, 3, 0.22),
                                         ("insieme", OK, 5, 0.42))):
        pr = out_cubic(max(p - t0, 0) / 0.34)
        if pr <= 0.01:
            continue
        traccia(d, np.log10(np.array(G[k])), box, lo, hi, col, w, pr, False, a, True)

    a2, _ = entra(p * dur, dur * 0.52, 0.4)
    for i, (k, v, dd_, col) in enumerate(
            (("ORO", "+179%", "dd 17,8%", ORO),
             ("NASDAQ", "+375%", "dd 12,8%", ACC),
             ("INSIEME", "+1.223%", "dd 21,3%", OK))):
        y = 1110 + i * 62
        testo(d, (MARG + 60, y), k, monob(23), col, "la", track=3, alpha=a2)
        testo(d, (W / 2 + 130, y - 2), v, monob(28), INK, "ra", alpha=a2)
        testo(d, (W - MARG - 60, y + 2), dd_, mono(21), INK_3, "ra", alpha=a2)

    a3, _ = entra(p * dur, dur * 0.76, 0.4)
    testo(d, (W / 2, 1305), "2,79 × 4,75 = 13,23", bold(46), INK, "ma", alpha=a3)


def s_logo_out(d, p, dur, img=None):
    a = out_cubic(p / 0.26)
    dd = ImageDraw.Draw(img[0])
    dd._image = img[0]
    a1, dy1 = entra(p * dur, 0.0, 0.4)
    testo(dd, (W / 2, 420 + dy1), "MISURATO PRIMA", bold(64), INK_2, "ma", alpha=a1)
    a2, dy2 = entra(p * dur, 0.30, 0.4)
    testo(dd, (W / 2, 496 + dy2), "DI RISCHIARE", bold(64), INK, "ma", alpha=a2)
    sc = 1.0 + 0.07 * (1 - out_quint(p / 0.6))
    bag = 0.55 * (1 - out_cubic(p / 0.5)) + 0.20
    sw = (p - 0.34) / 0.40 if 0.34 < p < 0.74 else None
    img[0] = logo(img[0], W / 2, 1000, 640 * sc, a, bag, sw)


# peso · funzione · (True se disegna sul fotogramma invece che sul contesto)
SCENE = [
    (3.0, s_logo_in,    True),
    (5.0, s_gancio,     False),
    (4.5, s_problema,   False),
    (5.5, s_passo1,     False),
    (5.5, s_passo2,     False),
    (4.5, s_anni,       False),
    (5.0, s_drawdown,   False),
    (5.5, s_montecarlo, False),
    (5.0, s_tre_curve,  False),
    (3.5, s_logo_out,   True),
]


# ==========================================================================
#  montaggio
# ==========================================================================
def alloca(pesi, bpm, secondi, minimo=3):
    """Converte i pesi in battiti interi che sommati fanno `secondi`."""
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
    while resto < 0:
        j = int(np.argmax(b))
        if b[j] <= minimo:
            break
        b[j] -= 1
        resto += 1
    return b


def rendi(bpm, offset, battiti_brano, out, audio=None, secondi=42.0, crf=17):
    sb = 60.0 / bpm
    nb = alloca([s[0] for s in SCENE], bpm, secondi)
    inizi, acc = [], offset
    for k in nb:
        inizi.append(acc)
        acc += k * sb
    durata = acc
    nfr = int(durata * FPS)
    print("battiti per scena:", nb, f"· piu' corta {min(nb) * sb:.2f}s")

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
        peso, fn, su_immagine = SCENE[idx]

        if su_immagine:
            box = [im]
            fn(d, min(loc / dur, 1.0), dur, box)
            im = box[0]
        else:
            fn(d, min(loc / dur, 1.0), dur)

        fade = min(out_cubic(loc / (sb * 0.40)), 1.0)
        rest = dur - loc
        if rest < sb * 0.30:
            fade *= out_cubic(rest / (sb * 0.30))
        arr = np.asarray(im, np.float32)
        if fade < 0.999:
            arr = bgn + (arr - bgn) * fade

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
    ap.add_argument("--secondi", type=float, default=42.0)
    ap.add_argument("--audio", default=None, help="mp3/m4a del brano")
    ap.add_argument("--out", default=os.path.join(QUI, "reel.mp4"))
    a = ap.parse_args()

    bt = None
    if a.audio:
        from battiti import misura
        a.bpm, a.offset, bt = misura(a.audio)
        print(f"misurati dal brano: {a.bpm:.1f} BPM, primo battito a {a.offset:.3f}s")
    rendi(a.bpm, a.offset, bt, a.out, a.audio, a.secondi)
