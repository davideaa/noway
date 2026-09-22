#!/usr/bin/env python3
"""
Reel verticale sul portafoglio oro + nasdaq, costruito sulla specifica
misurata negli otto reel di riferimento (vedi video/RIFERIMENTI.md).

Quello che cambia rispetto alle versioni prima, e perche':

  - il ritmo. I riferimenti hanno un movimento medio fra 0,25 e 0,9 su 255:
    sono calmi. Le scene durano 6-8 secondi, non 4, e dentro la scena le
    cose si trasformano invece di comparire.
  - la scala. Titoli 50 px e numeri 60-70, non 80 e 150. Il grafico puo'
    occupare meta' schermo e lasciare il resto vuoto.
  - l'impaginato. Titolo allineato a sinistra come nel loro reel sull'oro,
    etichette a staffa appese ai punti del grafico, didascalia a due righe
    con la parola chiave accesa.
  - i colori. L'accento segue lo strumento: oro per l'oro, ciano per il
    nasdaq, verde per l'insieme.

    python3 video/reel.py                       # 48s a 70 BPM, muto
    python3 video/reel.py --audio brano.mp3     # misura i battiti e monta
"""

import argparse, json, os, subprocess, sys
from PIL import Image, ImageDraw
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stile import *   # noqa

QUI = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(QUI, "dati.json")))

FPS = 30
MANIGLIA = "QUANT_LAB"
STRUM = "XAUUSD + NQ · 2019—2026"

CURVA = np.array(D["curva_R"], np.float32)
CAP = np.array(D["capitale"], np.float32)
DDC = np.array(D["dd_capitale"], np.float32) * 100
ANNI = D["anni"]
G = D["gambe"]

N_OOS = D["t"]["oos_n"]
I_TAGLIO = int(round(len(CURVA) * (1 - N_OOS / D["n"])))
FUORI = CURVA[I_TAGLIO:] - CURVA[I_TAGLIO]


def _nuvola(n_curve=150, n_punti=170, seme=7):
    """Tentativi sulla meta' chiusa senza nessun vantaggio."""
    r = np.random.default_rng(seme)
    sd = D["t"]["oos_sd"]
    passi = r.normal(0, sd * np.sqrt(N_OOS / n_punti), (n_curve, n_punti))
    return np.concatenate([np.zeros((n_curve, 1)), np.cumsum(passi, 1)], 1)

NUVOLA = _nuvola()
MAX_CASO = float(NUVOLA[:, -1].max())


# ==========================================================================
#  telaio
# ==========================================================================
def testata(d, destra=None, a=1.0):
    testo(d, (98, 249), MANIGLIA + ".DE", mono(19), INK_3, "lm", track=7, alpha=a)
    if destra:
        testo(d, (982, 249), destra, mono(19), INK_3, "rm", track=5, alpha=a)


def titolo(d, righe_, y=320, a=1.0, dy=0.0, px=52, col=INK, col2=None,
           occhiello=None, col_occ=None):
    """Titolo allineato a sinistra, come nel loro reel sull'oro."""
    if occhiello:
        testo(d, (98, y - 34 + dy), occhiello, mono(18), col_occ or INK_3, "lm",
              track=6, alpha=a)
    for i, r in enumerate(righe_):
        testo(d, (98, y + i * (px + 12) + dy), r, bold(px),
              col if i == 0 else (col2 or col), "la", alpha=a)
    return y + len(righe_) * (px + 12) + dy


def pie(d, mono_riga, parti, a=1.0):
    """Il piede a due righe: la riga mono coi dati, sotto la frase corta."""
    if mono_riga:
        testo(d, (W / 2, 1232), mono_riga, mono(18), INK_3, "mm", track=5, alpha=a)
    if parti:
        frase(d, (W / 2, 1278), parti, 27, "mm", a)


# ==========================================================================
#  curve
# ==========================================================================
def traccia(d, v, box, lo, hi, col, w=3, prog=1.0, ombra=False, alpha=1.0,
            testina=False):
    n = max(int(len(v) * min(max(prog, 0.0), 1.0)), 2)
    x0, y0, x1, y1 = box
    px = [(x0 + i / (len(v) - 1) * (x1 - x0),
           y1 - (v[i] - lo) / (hi - lo) * (y1 - y0)) for i in range(n)]
    if ombra:
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(ov).polygon(px + [(px[-1][0], y1), (x0, y1)],
                                   fill=(col[0], col[1], col[2], int(20 * alpha)))
        d._image.paste(Image.alpha_composite(
            d._image.convert("RGBA"), ov).convert("RGB"), (0, 0))
    c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(col, BG_C))
    d.line(px, fill=c, width=w, joint="curve")
    if testina and n < len(v):
        d.ellipse([px[-1][0] - 5, px[-1][1] - 5, px[-1][0] + 5, px[-1][1] + 5], fill=c)
    return px


def griglia_log(d, box, tacche, lo, hi, alpha=1.0):
    for t, et in tacche:
        y = box[3] - (np.log10(t) - lo) / (hi - lo) * (box[3] - box[1])
        linea_h(d, box[0], box[2], y, INK_5, 1, alpha)
        testo(d, (box[0] - 14, y), et, mono(17), INK_3, "rm", alpha=alpha)


# ==========================================================================
#  scene
# ==========================================================================
def s_logo_in(d, p, dur, img=None):
    """Il logo sale dal buio, una lama di luce lo attraversa, si assesta."""
    a = out_cubic(p / 0.34)
    sc = 1.0 + 0.13 * (1 - out_quint(p / 0.62))
    bag = 0.85 * (1 - out_cubic(p / 0.50)) + 0.14
    sw = (p - 0.30) / 0.44 if 0.30 < p < 0.74 else None
    img[0] = logo(img[0], W / 2, 860, 700 * sc, a, bag, sw)
    if p > 0.54:
        ar = out_cubic((p - 0.54) / 0.30)
        dd = ImageDraw.Draw(img[0]); dd._image = img[0]
        testo(dd, (W / 2, 1276), MANIGLIA + ".DE", mono(25), INK_2, "mm",
              track=12, alpha=ar)
        dd.line([(W / 2 - 54 * ar, 1330), (W / 2 + 54 * ar, 1330)],
                fill=ORO_CHI, width=2)


def s_gancio(d, p, dur):
    testata(d, "CURVA REALE", out_cubic(p / 0.14))
    a, dy = entra(p * dur, 0.0, 0.5)
    titolo(d, ["SETTE ANNI,", "DUE MERCATI."], 318, a, dy, 52,
           occhiello="ORO + NASDAQ", col_occ=ORO_CHI)

    box = (150, 620, 700, 950)
    lo, hi = np.log10(9000), np.log10(160000)
    q = out_cubic(p / 0.66)
    griglia_log(d, box, ((10000, "10k"), (30000, "30k"), (100000, "100k")),
                lo, hi, a)
    # niente riempimento: chiuso sul fondo fa un rettangolo dai bordi netti,
    # e il reel di riferimento sull'oro tiene solo la linea
    px = traccia(d, np.log10(CAP), box, lo, hi, ORO_CHI, 3, q, False, a, True)

    if q > 0.985:
        af = out_cubic((q - 0.985) / 0.015)
        staffa(d, (px[-1][0] + 4, px[-1][1]), "132.328 €", ORO_CHI, 19, "d", af * a)

    a3, dy3 = entra(p * dur, dur * 0.46, 0.5)
    v = num(0, 1223, p * dur, dur * 0.46, 0.9)
    testo(d, (760, 700 + dy3), f"+{v:,.0f}%".replace(",", "."), bold(66), INK,
          "la", alpha=a3)
    testo(d, (762, 772 + dy3), "IN SETTE ANNI", mono(18), INK_3, "la", track=4,
          alpha=a3)

    a4, _ = entra(p * dur, dur * 0.70, 0.5)
    pie(d, "2.520 OPERAZIONI · SCALA LOGARITMICA",
        [("Da 10.000 a ", None), ("132.328", ORO_CHI), (" euro.", None)], a4)


def s_gambe(d, p, dur):
    testata(d, "LE DUE GAMBE", 1.0)
    a, dy = entra(p * dur, 0.0, 0.5)
    titolo(d, ["INSIEME NON È", "UNA SOMMA."], 318, a, dy, 52,
           occhiello="PERCHÉ DUE E NON UNA", col_occ=ACC)

    box = (170, 600, 940, 910)
    lo, hi = np.log10(0.8), np.log10(17.0)
    griglia_log(d, box, ((1, "×1"), (3, "×3"), (10, "×10")), lo, hi, a)
    fine = []
    for k, col, w, t0, et, dy_ in (("oro", ORO_CHI, 3, 0.10, "ORO", 16),
                                   ("nasdaq", ACC, 3, 0.26, "NASDAQ", 0),
                                   ("insieme", OK, 4, 0.44, "INSIEME", -16)):
        pr = out_cubic(max(p - t0, 0) / 0.40)
        if pr <= 0.01:
            continue
        px = traccia(d, np.log10(np.array(G[k])), box, lo, hi, col, w, pr,
                     False, a, True)
        fine.append((px[-1], col, et, pr, dy_))
    # sfalsate in verticale: a fine corsa le tre punte sono troppo vicine
    for pt, col, et, pr, dy_ in fine:
        if pr > 0.985:
            staffa(d, (pt[0] + 6, pt[1] + dy_), et, col, 18, "d", a, 20)

    a2, _ = entra(p * dur, dur * 0.60, 0.5)
    specifiche(d, (150, 990, 950, 0),
               [("ORO", "+179%", ORO_CHI), ("NASDAQ", "+375%", ACC),
                ("INSIEME", "+1.223%", OK)], a2, 1.0)

    a3, _ = entra(p * dur, dur * 0.76, 0.5)
    testo(d, (W / 2, 1110), "2,79 × 4,75 = 13,23", bold(44), INK, "ma", alpha=a3)
    testo(d, (W / 2, 1168), "NON UNA SOMMA · UNA MOLTIPLICAZIONE", mono(18),
          INK_3, "ma", track=4, alpha=a3)
    a4, _ = entra(p * dur, dur * 0.84, 0.4)
    pie(d, "CORRELAZIONE 0,067 SU 85 MESI",
        [("I profitti di una fanno crescere ", None), ("l'altra", OK), (".", None)],
        a4)


def s_prova(d, p, dur):
    testata(d, "FUORI CAMPIONE", 1.0)
    a, dy = entra(p * dur, 0.0, 0.5)
    titolo(d, ["METÀ DEL TEMPO,", "CHIUSA A CHIAVE."], 318, a, dy, 52,
           occhiello="COME SI VERIFICA", col_occ=WARN)

    taglio = 0.02 + in_out(p / 0.26) * 0.62
    chiuso = out_cubic(max(p - 0.28, 0) / 0.14)
    box = (150, 620, 950, 676)
    xt = barra_tempo(d, box, taglio, chiuso, a)
    staffa(d, (box[0], 590), "2019—2023  QUI STUDIO", ACC, 18, "d", a)
    if chiuso > 0.05:
        staffa(d, (box[2], 590), "2024—2026  MAI VISTE", WARN, 18, "s", chiuso * a)

    blocc = out_cubic(max(p - 0.40, 0) / 0.14)
    for j, (et, pos) in enumerate((("A", 0.38), ("B", 0.71), ("C", 0.55))):
        cursore(d, 260, 900, 760 + j * 60, pos, ACC, et, blocc, a)
    if blocc > 0.4:
        testo(d, (W / 2, 950), "PARAMETRI BLOCCATI", mono(20), WARN, "ma",
              track=5, alpha=(blocc - 0.4) / 0.6 * a)

    ap = out_cubic(max(p - 0.58, 0) / 0.34)
    if ap > 0.01:
        bx = (xt, 1020, 950, 1140)
        px = traccia(d, FUORI, bx, FUORI.min(), FUORI.max() * 1.06, OK, 3, ap,
                     True, a, True)
        testo(d, (150, 1030), "POI SI APRE,", mono(19), INK_2, "la", track=4,
              alpha=ap * a)
        testo(d, (150, 1062), "UNA VOLTA SOLA", monob(19), OK, "la", track=4,
              alpha=ap * a)
        if ap > 0.97:
            staffa(d, (px[-1][0] + 4, px[-1][1]), "+180,6 R", OK, 18, "s", a)

    a4, _ = entra(p * dur, dur * 0.80, 0.4)
    pie(d, "984 OPERAZIONI · NESSUNA CONFIGURAZIONE PROVATA",
        [("Guardate ", None), ("una volta sola", WARN), (".", None)], a4)


def s_fortuna(d, p, dur):
    testata(d, "IL METRO GIUSTO", 1.0)
    a, dy = entra(p * dur, 0.0, 0.5)
    titolo(d, ["BATTI LA FORTUNA,", "NON LO ZERO."], 318, a, dy, 52,
           occhiello="SECONDA VERIFICA", col_occ=OK)

    box = (150, 610, 950, 1030)
    lo, hi = -150.0, 210.0
    Y = lambda v: box[3] - (v - lo) / (hi - lo) * (box[3] - box[1])
    linea_h(d, box[0], box[2], Y(0), INK_4, 2, a)

    q = lineare(p / 0.44)
    quante = int(len(NUVOLA) * q)
    for i in range(quante):
        traccia(d, NUVOLA[i], box, lo, hi, INK_4, 2, 1.0, False,
                a * (0.62 if i > quante - 8 else 0.20))
    if quante:
        testo(d, (box[0], 580), f"{quante} TENTATIVI A CASO", mono(18), INK_3,
              "lm", track=4, alpha=a)

    pm = out_cubic(max(p - 0.38, 0) / 0.14)
    if pm > 0.01:
        tratteggio(d, (box[0], Y(MAX_CASO)), (box[2], Y(MAX_CASO)), WARN, 10, 8,
                   2, alpha=pm * a)
        staffa(d, (box[0] + 6, Y(MAX_CASO) - 26), "IL MEGLIO DEL CASO  +122 R",
               WARN, 18, "d", pm * a)

    pv = lineare((p - 0.44) / 0.30)
    if pv > 0.01:
        px = traccia(d, FUORI[::max(len(FUORI) // 170, 1)], box, lo, hi, OK, 4,
                     pv, False, a, True)
        if pv > 0.97:
            staffa(d, (px[-1][0] + 4, px[-1][1]), "+180,6 R", OK, 19, "s", a)

    af = out_cubic(max(p - 0.72, 0) / 0.24)
    if af > 0.01:
        testo(d, (150, 1090), "SU UN MILIONE DI TENTATIVI A CASO", mono(19),
              INK_3, "la", track=4, alpha=af * a)
        testo(d, (150, 1125), "SEI ARRIVANO QUI", bold(50), OK, "la", alpha=af * a)
    a4, _ = entra(p * dur, dur * 0.86, 0.4)
    pie(d, "t 4,36 · NON SGONFIABILE",
        [("Sei su un ", None), ("milione", OK), (".", None)], a4)


def s_prezzo(d, p, dur):
    testata(d, "IL PREZZO", 1.0)
    a, dy = entra(p * dur, 0.0, 0.5)
    titolo(d, ["QUANTO SI STA", "SOTT'ACQUA."], 318, a, dy, 52,
           occhiello="LA PARTE SCOMODA", col_occ=NEG)

    box = (170, 620, 950, 900)
    prog = out_cubic(p / 0.52)
    Y = area_neg(d, DDC, box, -24.0, NEG, prog, a)
    for g in (-10, -20):
        linea_h(d, box[0], box[2], Y(g), INK_5, 1, a)
        testo(d, (box[0] - 14, Y(g)), f"{g}%", mono(17), INK_3, "rm", alpha=a)

    imin = int(np.argmin(DDC))
    if prog > imin / len(DDC):
        am = out_cubic((prog - imin / len(DDC)) / 0.14)
        xm = box[0] + imin / (len(DDC) - 1) * (box[2] - box[0])
        d.ellipse([xm - 6, Y(DDC[imin]) - 6, xm + 6, Y(DDC[imin]) + 6], fill=NEG)
        staffa(d, (xm + 10, Y(DDC[imin]) + 30), "−21,7%", NEG, 19, "d", am * a)

    a2, _ = entra(p * dur, dur * 0.50, 0.5)
    barre_orizz(d, (150, 980, 950, 0), [
        ("PEGGIORE", 0.217 / 0.24, "−21,7%", NEG),
        ("SOTTO IL MASSIMO", 0.87, "87% DEL TEMPO", WARN),
        ("PIÙ LUNGO", 17 / 24, "17 MESI", INK_4),
    ], out_cubic(max(p - 0.50, 0) / 0.34), a2)

    a3, _ = entra(p * dur, dur * 0.82, 0.4)
    pie(d, "DRAWDOWN SULLA CURVA REALE",
        [("Un quinto del conto, ", None), ("per mesi", NEG), (".", None)], a3)


def s_attesa(d, p, dur):
    testata(d, "COSA ASPETTARSI", 1.0)
    a, dy = entra(p * dur, 0.0, 0.5)
    titolo(d, ["DIECIMILA ANNI", "SIMULATI."], 318, a, dy, 52,
           occhiello="UN ANNO QUALUNQUE", col_occ=ACC)

    M = D["mc"]
    box = (150, 640, 950, 980)
    x0, y0, x1, y1 = box
    xs, ys = M["x"], M["y"]
    lo, hi = xs[0], xs[-1] + 5
    X = lambda v: x0 + (v - lo) / (hi - lo) * (x1 - x0)
    mx = max(ys)
    q = out_cubic(p / 0.46)

    pf = out_cubic(max(p - 0.30, 0) / 0.20)
    if pf > 0.01:
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(ov).rectangle([X(M["p"]["5"]), y0, X(M["p"]["95"]), y1],
                                     fill=(ACC[0], ACC[1], ACC[2], int(20 * pf * a)))
        d._image.paste(Image.alpha_composite(
            d._image.convert("RGBA"), ov).convert("RGB"), (0, 0))

    bw = (x1 - x0) / len(xs)
    for i, v in enumerate(ys):
        if not v:
            continue
        h = v / mx * (y1 - y0) * q
        col = NEG if xs[i] < 0 else ACC_DIM
        c = tuple(int(round(k * a + b * (1 - a))) for k, b in zip(col, BG_C))
        d.rectangle([X(xs[i]) + 1, y1 - h, X(xs[i]) + bw - 1, y1], fill=c)
    linea_h(d, x0, x1, y1, INK_4, 2, a)
    for g in (-50, 0, 50, 100, 150):
        testo(d, (X(g), y1 + 26), ("+" if g > 0 else "") + str(g), mono(17),
              INK_3, "ma", alpha=a)

    pm = out_cubic(max(p - 0.40, 0) / 0.18)
    if pm > 0.01:
        xm = X(M["p"]["50"])
        d.line([(xm, y0 + 40), (xm, y1)], fill=ACC, width=2)
        staffa(d, (xm, y0 + 24), "MEDIANA  +44,7 R", ACC, 18, "d", pm * a, 34)

    a2, _ = entra(p * dur, dur * 0.56, 0.5)
    specifiche(d, (150, 1060, 950, 0),
               [("ANNO TIPICO", "~29%", INK),
                ("IN PERDITA", "5,2%", NEG),
                ("90% DEI CASI", "−0,5 → +92 R", ACC)], a2, 1.0)
    a3, _ = entra(p * dur, dur * 0.80, 0.4)
    pie(d, "BOOTSTRAP A BLOCCHI DA 20",
        [("Un anno su venti ", None), ("in perdita", NEG), (".", None)], a3)


def s_logo_out(d, p, dur, img=None):
    dd = ImageDraw.Draw(img[0]); dd._image = img[0]
    a1, dy1 = entra(p * dur, 0.0, 0.5)
    testo(dd, (W / 2, 400 + dy1), "MISURATO PRIMA", bold(52), INK_2, "ma", alpha=a1)
    a2, dy2 = entra(p * dur, 0.36, 0.5)
    testo(dd, (W / 2, 466 + dy2), "DI RISCHIARE.", bold(52), INK, "ma", alpha=a2)
    a = out_cubic(p / 0.30)
    sc = 1.0 + 0.06 * (1 - out_quint(p / 0.66))
    bag = 0.5 * (1 - out_cubic(p / 0.56)) + 0.18
    sw = (p - 0.38) / 0.42 if 0.38 < p < 0.80 else None
    img[0] = logo(img[0], W / 2, 980, 620 * sc, a, bag, sw)
    a3, _ = entra(p * dur, 0.70, 0.5)
    dd2 = ImageDraw.Draw(img[0]); dd2._image = img[0]
    testo(dd2, (W / 2, 1290), MANIGLIA + ".DE", mono(24), INK_3, "mm",
          track=12, alpha=a3)


SCENE = [
    (4.0, s_logo_in,  True),
    (7.0, s_gancio,   False),
    (7.0, s_gambe,    False),
    (8.0, s_prova,    False),
    (8.0, s_fortuna,  False),
    (7.0, s_prezzo,   False),
    (7.0, s_attesa,   False),
    (4.0, s_logo_out, True),
]


# ==========================================================================
#  montaggio
# ==========================================================================
def alloca(pesi, bpm, secondi, minimo=3):
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


def rendi(bpm, offset, battiti_brano, out, audio=None, secondi=48.0, crf=17):
    sb = 60.0 / bpm
    nb = alloca([s[0] for s in SCENE], bpm, secondi)
    inizi, acc = [], offset
    for k in nb:
        inizi.append(acc)
        acc += k * sb
    durata = acc
    nfr = int(durata * FPS)
    print("battiti per scena:", nb, f"· scena piu' corta {min(nb) * sb:.1f}s")

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
        _, fn, su_immagine = SCENE[idx]

        if su_immagine:
            box = [im]
            fn(d, min(loc / dur, 1.0), dur, box)
            im = box[0]
        else:
            fn(d, min(loc / dur, 1.0), dur)

        # i riferimenti sono calmi: la dissolvenza e' lunga, non uno stacco
        fade = min(out_cubic(loc / (sb * 0.75)), 1.0)
        rest = dur - loc
        if rest < sb * 0.55:
            fade *= out_cubic(rest / (sb * 0.55))
        arr = np.asarray(im, np.float32)
        if fade < 0.999:
            arr = bgn + (arr - bgn) * fade

        if battiti_brano is not None and len(battiti_brano) and tt >= battiti_brano[0]:
            db = tt - battiti_brano[np.searchsorted(battiti_brano, tt, "right") - 1]
        else:
            db = (tt - offset) % sb
        k = max(0.0, 1.0 - db / (sb * 0.5)) ** 2
        if k > 0.02:
            # respiro appena accennato: il movimento medio dei riferimenti
            # sta fra 0,25 e 0,9 su 255, non si puo' zoomare di piu'
            z = 1.0 + 0.004 * k
            im2 = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
            nw, nh = int(W * z), int(H * z)
            im2 = im2.resize((nw, nh), Image.BILINEAR).crop(
                ((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
            arr = np.asarray(im2, np.float32) * (1 + 0.018 * k)

        proc.stdin.write(np.clip(arr, 0, 255).astype(np.uint8).tobytes())
        if f % 180 == 0:
            print(f"  {f}/{nfr}  ({tt:5.1f}s)", flush=True)

    proc.stdin.close()
    proc.wait()
    print(f"scritto {out} · {durata:.2f}s · {bpm:.1f} BPM")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--bpm", type=float, default=70.0)
    ap.add_argument("--offset", type=float, default=0.0)
    ap.add_argument("--secondi", type=float, default=48.0)
    ap.add_argument("--audio", default=None)
    ap.add_argument("--out", default=os.path.join(QUI, "reel.mp4"))
    a = ap.parse_args()
    bt = None
    if a.audio:
        from battiti import misura
        a.bpm, a.offset, bt = misura(a.audio)
        print(f"misurati dal brano: {a.bpm:.1f} BPM, primo battito {a.offset:.3f}s")
    rendi(a.bpm, a.offset, bt, a.out, a.audio, a.secondi)
