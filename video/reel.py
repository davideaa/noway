#!/usr/bin/env python3
"""
Reel verticale sul portafoglio oro + nasdaq, nello stile del reel di
riferimento (@quant_labde), ma con i numeri veri di questo progetto.

I cambi di scena e le entrate degli elementi cadono sui battiti: la griglia
dei battiti e' in BPM e OFFSET qui sotto. Finche' non c'e' il file audio la
griglia e' un'ipotesi; con l'mp3 si misura e si rigenera (vedi battiti.py).

    python3 video/reel.py                  # rende reel.mp4 muto
    python3 video/reel.py --bpm 68         # altra griglia
    python3 video/reel.py --audio bra.mp3  # misura i battiti e monta l'audio

Ogni numero che compare a schermo viene da video/dati.json, che e' estratto
dai due report. Niente e' scritto a mano: se cambia il report, cambia il reel.
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


# ==========================================================================
#  telaio fisso — quello che c'e' in ogni fotogramma
# ==========================================================================
def telaio(d, sez, didascalia, sub_mono=None, a=1.0):
    testo(d, (MARG, 226), EYEBROW, mono(20), INK_3, "la", track=6, alpha=a)
    if sez:
        testo(d, (W - MARG, 226), sez, mono(20), INK_3, "ra", track=6, alpha=a)
    glifo_ig(d, MARG, 1175, 34, INK, alpha=a * 0.9)
    testo(d, (MARG, 1240), MANIGLIA, monob(21), INK, "ls", alpha=a * 0.9)
    if sub_mono:
        # centrata nello spazio a destra della maniglia, se no ci finisce sopra
        testo(d, (W / 2 + 90, 1215), sub_mono, mono(20), INK_3, "ma", track=5, alpha=a)
    if didascalia:
        blocco(d, (W / 2, 1272), didascalia, med(26), INK_2, 720, 34, "ma", alpha=a)


# ==========================================================================
#  grafici
# ==========================================================================
def curva_equity(d, box, prog=1.0, col=INK, spessore=3, ombra=True,
                 evidenzia=None, alpha=1.0):
    """La curva vera in R, 1.597 punti. prog = quanta se ne disegna."""
    x0, y0, x1, y1 = box
    v = D["curva_R"]
    n = max(int(len(v) * min(max(prog, 0.0), 1.0)), 2)
    lo, hi = min(v), max(v) * 1.04
    px = [(x0 + i / (len(v) - 1) * (x1 - x0),
           y1 - (v[i] - lo) / (hi - lo) * (y1 - y0)) for i in range(n)]

    if ombra and n > 3:
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        od.polygon(px + [(px[-1][0], y1), (x0, y1)],
                   fill=(ACC[0], ACC[1], ACC[2], int(26 * alpha)))
        d._image.paste(Image.alpha_composite(
            d._image.convert("RGBA"), ov).convert("RGB"), (0, 0))

    c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(col, BG_C))
    d.line(px, fill=c, width=spessore, joint="curve")

    if evidenzia:                       # (i0, i1, colore) su un tratto
        i0, i1, cc = evidenzia
        seg = [p for j, p in enumerate(px) if i0 <= j <= i1]
        if len(seg) > 1:
            d.line(seg, fill=cc, width=spessore + 1, joint="curve")
    if n < len(v):                      # testina luminosa
        hx, hy = px[-1]
        d.ellipse([hx - 5, hy - 5, hx + 5, hy + 5], fill=c)
    return px


def barre_t(d, box, t, alpha=1.0):
    """Le t contro la soglia del rumore. La barra grigia e' la soglia."""
    x0, y0, x1, y1 = box
    righe_ = [("DENTRO CAMPIONE", D["t"]["is"], INK_4, "2019-2023 · qui si e' ottimizzato"),
              ("FUORI CAMPIONE", D["t"]["oos"], OK, "2024-2026 · guardato una volta sola"),
              ("TUTTO INSIEME", D["t"]["tot"], ACC, f"{D['n']} operazioni")]
    mx = 6.0
    X = lambda v: x0 + v / mx * (x1 - x0)
    bh, gap = 54, 40

    sg = D["t"]["soglia272"]
    ap, _ = entra(t, 0.05, 0.4)
    d.rectangle([X(0), y0 - 10, X(sg), y0 + 3 * bh + 2 * gap],
                fill=(26, 18, 18))
    tratteggio(d, (X(sg), y0 - 10), (X(sg), y0 + 3 * bh + 2 * gap), NEG, 8, 7, 2,
               alpha=ap * alpha)
    testo(d, (X(sg), y0 - 26), f"{sg:.2f}".replace(".", ","), monob(22), NEG, "ma",
          alpha=ap * alpha)

    for i, (nome, val, col, nota) in enumerate(righe_):
        y = y0 + i * (bh + gap)
        a, dy = entra(t, 0.25 + i * 0.16, 0.45)
        a *= alpha
        w = X(num(0, val, t, 0.25 + i * 0.16, 0.7)) - X(0)
        riquadro(d, [X(0), y + dy, X(0) + max(w, 2), y + bh + dy],
                 fill=col, bordo=None, r=3, alpha=a * (1.0 if i == 1 else 0.78))
        testo(d, (X(0) - 18, y + 21 + dy), nome, monob(21), INK if i == 1 else INK_2,
              "ra", track=2, alpha=a)
        testo(d, (X(0) - 18, y + 46 + dy), nota, mono(17), INK_3, "ra", alpha=a)
        vv = num(0, val, t, 0.25 + i * 0.16, 0.7)
        testo(d, (X(0) + max(w, 2) + 16, y + bh / 2 + 9 + dy),
              "t " + f"{vv:.2f}".replace(".", ","), monob(26), col, "la", alpha=a)

    testo(d, (x1, y0 + 3 * bh + 2 * gap + 34),
          "quanto regala il caso con 272 configurazioni provate",
          mono(18), NEG, "ra", alpha=ap * alpha)


def barre_tetto(d, box, t, alpha=1.0):
    """Cosa resta tagliando ogni vincita a un tetto."""
    x0, y0, x1, y1 = box
    T = D["tetto"]
    bw = (x1 - x0) / len(T)
    bar = bw * 0.52
    Y = lambda v: y0 + (380 - v) / 500 * (y1 - y0)
    for g in (-100, 0, 100, 200, 300):
        linea_h(d, x0, x1, Y(g), INK_4 if g == 0 else (32, 35, 43),
                2 if g == 0 else 1, alpha)
        testo(d, (x0 - 14, Y(g) + 7), ("+" if g > 0 else "") + str(g),
              mono(18), INK_3, "ra", alpha=alpha)
    for i, r in enumerate(T):
        a, dy = entra(t, 0.15 + i * 0.13, 0.4)
        a *= alpha
        cx = x0 + i * bw + bw / 2
        v = num(0, r["r"], t, 0.15 + i * 0.13, 0.6)
        neg = r["r"] < 0
        col = NEG if neg else (OK if r["cap"] is None else (ACC if r["cap"] >= 3 else WARN))
        riquadro(d, [cx - bar / 2, Y(max(0, v)), cx + bar / 2, max(Y(min(0, v)), Y(0))],
                 fill=col, bordo=None, r=3, alpha=a)
        testo(d, (cx, Y(v) + (34 if neg else -14)),
              ("+" if v >= 0 else "−") + f"{abs(v):.0f}", monob(23),
              NEG if neg else INK_2, "ma", alpha=a)
        et = "com'e'" if r["cap"] is None else "max " + str(r["cap"]).replace(".", ",") + " R"
        testo(d, (cx, y1 + 34), et, mono(18), INK_3, "ma", alpha=a)


def linea_costi(d, box, t, alpha=1.0):
    """Quanto resta moltiplicando i costi. Lo zero si incrocia a 5,8 volte."""
    x0, y0, x1, y1 = box
    S = D["stress"]
    X = lambda k: x0 + (k - 1) / 7 * (x1 - x0)
    Y = lambda v: y0 + (380 - v) / 580 * (y1 - y0)
    for g in (-200, -100, 0, 100, 200, 300):
        linea_h(d, x0, x1, Y(g), INK_4 if g == 0 else (32, 35, 43),
                2 if g == 0 else 1, alpha)
        testo(d, (x0 - 14, Y(g) + 7), ("+" if g > 0 else "") + str(g),
              mono(18), INK_3, "ra", alpha=alpha)
    p = out_cubic(t / 0.9)
    npt = max(int(len(S) * p), 2)
    px = [(X(s["k"]), Y(s["r"])) for s in S[:npt]]
    c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(ACC, BG_C))
    d.line(px, fill=c, width=4, joint="curve")
    for i, s in enumerate(S[:npt]):
        col = NEG if s["r"] < 0 else ACC
        d.ellipse([X(s["k"]) - 6, Y(s["r"]) - 6, X(s["k"]) + 6, Y(s["r"]) + 6],
                  fill=col, outline=BG_C, width=2)
        testo(d, (X(s["k"]), y1 + 34), f"{s['k']}×", mono(18), INK_3, "ma", alpha=alpha)
    if p > 0.92:
        a = out_cubic((p - 0.92) / 0.08)
        # dove la spezzata incrocia lo zero, interpolando fra l'ultimo punto
        # positivo e il primo negativo. Viene 5,76: si scrive 5,8, non 5,5.
        u = [s for s in S if s["r"] > 0][-1]
        w_ = [s for s in S if s["r"] <= 0][0]
        kx = u["k"] + u["r"] / (u["r"] - w_["r"]) * (w_["k"] - u["k"])
        tratteggio(d, (X(kx), y0), (X(kx), y1), NEG, 8, 7, 2, alpha=a * alpha)
        testo(d, (X(kx) - 16, y0 + 26), f"muore a {kx:.1f}×".replace(".", ","),
              monob(24), NEG, "ra", alpha=a * alpha)


def istogramma(d, box, t, alpha=1.0):
    """2.749 operazioni ordinate per risultato: la montagna a sinistra e la coda."""
    x0, y0, x1, y1 = box
    I = D["isto"]
    n = len(I["x"])
    mx = max(I["y"])
    bw = (x1 - x0) / n
    p = out_cubic(t / 0.8)
    zero = next(i for i, v in enumerate(I["x"]) if v >= 0)
    for i, v in enumerate(I["y"]):
        if not v:
            continue
        h = (v / mx) * (y1 - y0) * p
        col = ORO if I["x"][i] >= 2 else (NEG if I["x"][i] < 0 else ACC)
        c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(col, BG_C))
        d.rectangle([x0 + i * bw + 1, y1 - h, x0 + (i + 1) * bw - 1, y1], fill=c)
    linea_h(d, x0, x1, y1, INK_4, 2, alpha)
    d.line([(x0 + zero * bw, y0), (x0 + zero * bw, y1)], fill=INK_3, width=2)
    for g in (-2, 0, 2, 4, 6, 8, 10):
        i = next((i for i, v in enumerate(I["x"]) if v >= g), None)
        if i is None:
            continue
        testo(d, (x0 + i * bw, y1 + 30), ("+" if g > 0 else "") + f"{g} R",
              mono(18), INK_3, "ma", alpha=alpha)
    if p > 0.8:
        a = out_cubic((p - 0.8) / 0.2) * alpha
        testo(d, (x0 + zero * bw - 16, y0 - 40), "perde spesso poco",
              monob(20), NEG, "ra", alpha=a)
        testo(d, (x0 + zero * bw + 22, y0 - 40), "guadagna raramente molto  →",
              monob(20), ORO, "la", alpha=a)


def checklist(d, box, voci, t, alpha=1.0, passo=0.30):
    """I riquadri numerati che entrano uno alla volta, come nell'esempio."""
    x0, y0, x1, _ = box
    bh, gap = 100, 22
    for i, (n_, tit, sot, col) in enumerate(voci):
        a, dy = entra(t, i * passo, 0.35)
        a *= alpha
        if a <= 0.004:
            continue
        y = y0 + i * (bh + gap) + dy
        riquadro(d, [x0, y, x1, y + bh], BOX, col or ACC_DIM, 5, 1, a)
        d.rectangle([x0, y + 1, x0 + 4, y + bh - 1],
                    fill=tuple(int(round(k * a + b * (1 - a)))
                               for k, b in zip(col or ACC, BG_C)))
        testo(d, (x0 + 34, y + 44), n_, monob(30), col or ACC, "lm", alpha=a)
        testo(d, (x0 + 104, y + 36), tit, monob(25), INK, "lm", track=1, alpha=a)
        testo(d, (x0 + 104, y + 70), sot, mono(20), INK_3, "lm", track=2, alpha=a)
        if i and a > 0.5:
            tratteggio(d, (x0 + 26, y - gap), (x0 + 26, y), INK_4, 5, 5, 1, alpha=a)


# ==========================================================================
#  le scene — la durata e' in battiti
# ==========================================================================
def s_hook(d, t, dur):
    telaio(d, "", "Questo e' il risultato di sette anni. E da solo non vuol dire niente.",
           "CURVA REALE · ORO + NASDAQ")
    a, dy = entra(t, 0.0, 0.45)
    v = num(0, 1223, t, 0.15, 1.1)
    testo(d, (W / 2, 350 + dy), "SETTE ANNI, DUE MERCATI", mono(24), INK_2, "ma",
          track=7, alpha=a)
    testo(d, (W / 2, 440 + dy), f"+{v:,.0f}%".replace(",", "."), bold(126), INK, "ma",
          alpha=a)
    a2, _ = entra(t, 0.8, 0.4)
    testo(d, (W / 2, 610), "da 10.000 a 132.328 euro in 7,03 anni", med(28), INK_3,
          "ma", alpha=a2)
    curva_equity(d, (MARG + 40, 700, W - MARG - 40, 1090), out_cubic(t / 2.4))
    testo(d, (MARG + 40, 1130), "CAPITALE, OPERAZIONE PER OPERAZIONE", mono(18),
          INK_3, "la", track=4, alpha=a2)


def s_ma(d, t, dur):
    telaio(d, "", "Un backtest non e' una prova. E' un'ipotesi da rompere.",
           "BACKTEST ≠ PROVA")
    a, dy = entra(t, 0.0, 0.35)
    testo(d, (W / 2, 400 + dy), "UN BACKTEST", bold(88), INK_3, "ma", alpha=a)
    a2, dy2 = entra(t, 0.28, 0.35)
    testo(d, (W / 2, 500 + dy2), "NON E' UNA PROVA", bold(88), INK, "ma", alpha=a2)
    curva_equity(d, (MARG + 40, 680, W - MARG - 40, 1020), 1.0,
                 col=INK_4, spessore=2, ombra=False, alpha=0.9)
    a3, _ = entra(t, 0.75, 0.4)
    testo(d, (W / 2, 1075), "LA STESSA CURVA PUO' ESSERE FORTUNA",
          monob(24), WARN, "ma", track=3, alpha=a3)
    testo(d, (MARG + 40, 1130), f"{D['n']} OPERAZIONI · 2019.01 → 2026.09", mono(18),
          INK_3, "la", track=4, alpha=a3)


def s_forma(d, t, dur):
    telaio(d, "00 COM'E' FATTA",
           "Perde spesso poco e guadagna raramente molto. E' un inseguitore di tendenza.",
           "DISTRIBUZIONE DEI RISULTATI")
    a, dy = entra(t, 0.0, 0.35)
    testo(d, (W / 2, 330 + dy), "CHE COSA E'", mono(24), INK_2, "ma", track=7, alpha=a)
    a2, dy2 = entra(t, 0.2, 0.35)
    testo(d, (W / 2, 410 + dy2), "L'OPERAZIONE", bold(78), INK, "ma", alpha=a2)
    testo(d, (W / 2, 496 + dy2), "TIPICA PERDE", bold(78), NEG, "ma", alpha=a2)
    istogramma(d, (MARG + 60, 680, W - MARG - 20, 1010), t - 0.45)
    a3, _ = entra(t, 1.1, 0.4)
    testo(d, (W / 2, 1100), f"mediana {D['mediana']} R".replace(".", ",") +
          "  ·  coda fino a +10,8 R", monob(23), INK_2, "ma", alpha=a3)


def s_dom1(d, t, dur):
    telaio(d, "01 FUORI CAMPIONE",
           "Prima domanda: e' fortuna? Con 272 configurazioni provate, il caso regala t alte.",
           "LA DOMANDA VERA")
    a, dy = entra(t, 0.0, 0.35)
    testo(d, (W / 2, 330 + dy), "DOMANDA UNO", mono(24), INK_2, "ma", track=7, alpha=a)
    a2, dy2 = entra(t, 0.2, 0.35)
    testo(d, (W / 2, 430 + dy2), "E' FORTUNA?", bold(88), INK, "ma", alpha=a2)
    barre_t(d, (MARG + 300, 620, W - MARG - 110, 1010), t - 0.45)


def s_risp1(d, t, dur):
    telaio(d, "01 FUORI CAMPIONE",
           "Sul fuori campione, guardato una volta sola, la t e' 4,36. Non si sgonfia.",
           "2024.01 → 2026.09 · SPESO UNA VOLTA")
    a, dy = entra(t, 0.0, 0.35)
    testo(d, (W / 2, 380 + dy), "PROBABILITA' CHE SIA CASO", mono(24), INK_2, "ma",
          track=6, alpha=a)
    a2, dy2 = entra(t, 0.25, 0.4)
    testo(d, (W / 2, 500 + dy2), "6 SU UN MILIONE", bold(96), OK, "ma", alpha=a2)
    a3, _ = entra(t, 0.7, 0.4)
    blocco(d, (W / 2, 660),
           "Il fuori campione non va sgonfiato, perche' li' non si e' provato\n"
           "niente: si e' guardato una volta sola.", med(27), INK_2, 780, 40, "ma",
           alpha=a3)
    a4, dy4 = entra(t, 1.1, 0.4)
    riquadro(d, [MARG + 60, 800 + dy4, W - MARG - 60, 990 + dy4], (26, 22, 14),
             WARN, 5, 1, a4)
    testo(d, (MARG + 100, 850 + dy4), "IL SEGNALE SCOMODO", monob(21), WARN, "la",
          track=3, alpha=a4)
    blocco(d, (MARG + 100, 890 + dy4),
           "Il fuori campione va MEGLIO del dentro campione:\n"
           "+66,6 R all'anno contro +33,9. Di solito e' il contrario.",
           med(24), INK_2, 800, 34, "la", alpha=a4)


def s_dom2(d, t, dur):
    telaio(d, "02 CONTROLLO",
           "Seconda: dipende da pochi colpi grossi? Si azzoppa ogni vincita sopra una soglia.",
           "OGNI VINCITA TAGLIATA A UN TETTO")
    a, dy = entra(t, 0.0, 0.35)
    testo(d, (W / 2, 320 + dy), "DOMANDA DUE", mono(24), INK_2, "ma", track=7, alpha=a)
    a2, dy2 = entra(t, 0.2, 0.35)
    testo(d, (W / 2, 420 + dy2), "SENZA I COLPI", bold(78), INK, "ma", alpha=a2)
    testo(d, (W / 2, 506 + dy2), "GROSSI?", bold(78), INK_3, "ma", alpha=a2)
    barre_tetto(d, (MARG + 80, 630, W - MARG - 40, 1030), t - 0.4)
    a3, _ = entra(t, 1.5, 0.4)
    testo(d, (W / 2, 1120), "a 3 R di tetto restano +180 R · sotto i 2 R si rompe",
          monob(22), INK_2, "ma", alpha=a3)


def s_dom3(d, t, dur):
    telaio(d, "03 COSTI",
           "Terza: i costi se la mangiano? C'e' quasi sei volte di margine.",
           "COSA RESTA MOLTIPLICANDO I COSTI")
    a, dy = entra(t, 0.0, 0.35)
    testo(d, (W / 2, 320 + dy), "DOMANDA TRE", mono(24), INK_2, "ma", track=7, alpha=a)
    a2, dy2 = entra(t, 0.2, 0.35)
    testo(d, (W / 2, 420 + dy2), "I COSTI SE LA", bold(78), INK, "ma", alpha=a2)
    testo(d, (W / 2, 506 + dy2), "MANGIANO?", bold(78), INK, "ma", alpha=a2)
    linea_costi(d, (MARG + 80, 630, W - MARG - 60, 950), t - 0.4)
    a3, dy3 = entra(t, 1.4, 0.4)
    riquadro(d, [MARG + 60, 1010 + dy3, W - MARG - 60, 1160 + dy3], (26, 22, 14),
             WARN, 5, 1, a3)
    testo(d, (MARG + 100, 1055 + dy3), "IL BUCO NELLA PROVA", monob(21), WARN, "la",
          track=3, alpha=a3)
    blocco(d, (MARG + 100, 1093 + dy3),
           "Lo spread e' dentro i prezzi e dal report non si separa.\n"
           "Il costo vero e' piu' alto. Il margine di 5,5× e' ottimista.",
           med(23), INK_2, 800, 32, "la", alpha=a3)


def s_dom4(d, t, dur):
    telaio(d, "04 RISCHIO",
           "Quarta, e qui la risposta e' scomoda: il tetto di drawdown che avevo posto e' sforato.",
           "10.000 ANNI SIMULATI")
    a, dy = entra(t, 0.0, 0.35)
    testo(d, (W / 2, 320 + dy), "DOMANDA QUATTRO", mono(24), INK_2, "ma", track=6, alpha=a)
    a2, dy2 = entra(t, 0.2, 0.35)
    testo(d, (W / 2, 420 + dy2), "QUANTO PUO'", bold(78), INK, "ma", alpha=a2)
    testo(d, (W / 2, 506 + dy2), "ANDARE MALE?", bold(78), INK, "ma", alpha=a2)

    a3, dy3 = entra(t, 0.55, 0.4)
    riquadro(d, [MARG + 40, 650 + dy3, W / 2 - 10, 830 + dy3], BOX, ACC_DIM, 5, 1, a3)
    testo(d, (MARG + 76, 700 + dy3), "ANNO MEDIANO", mono(19), INK_3, "la", track=3, alpha=a3)
    testo(d, (MARG + 76, 770 + dy3),
          "+" + f"{num(0, D['mc']['50'], t, 0.6, 0.7):.1f}".replace(".", ",") + " R",
          monob(46), ACC, "ls", alpha=a3)

    a4, dy4 = entra(t, 0.8, 0.4)
    riquadro(d, [W / 2 + 10, 650 + dy4, W - MARG - 40, 830 + dy4], (30, 18, 14),
             NEG, 5, 1, a4)
    testo(d, (W / 2 + 46, 700 + dy4), "DRAWDOWN 95°", mono(19), INK_3, "la", track=3, alpha=a4)
    testo(d, (W / 2 + 46, 770 + dy4), "34–37%", monob(46), NEG, "ls", alpha=a4)

    a5, dy5 = entra(t, 1.25, 0.45)
    testo(d, (W / 2, 910 + dy5), "IL MIO TETTO ERA 33%", monob(30), INK_2, "ma",
          track=4, alpha=a5)
    a6, _ = entra(t, 1.55, 0.4)
    testo(d, (W / 2, 975), "SFORATO", bold(76), NEG, "ma", alpha=a6)
    blocco(d, (W / 2, 1080), "E' il vincolo che avevo scritto prima del test.\n"
           "Non si sposta dopo, perche' il risultato e' bello.", med(24), INK_3, 820,
           33, "ma", alpha=a6)


def s_numero(d, t, dur):
    telaio(d, "IL NUMERO",
           "Per fare i piani si usa il numero basso. Non quello che hai visto all'inizio.",
           "SCENARIO PRUDENTE")
    a, dy = entra(t, 0.0, 0.35)
    testo(d, (W / 2, 340 + dy), "COSA METTO A BILANCIO", mono(24), INK_2, "ma",
          track=6, alpha=a)
    a2, dy2 = entra(t, 0.25, 0.4)
    testo(d, (W / 2, 440 + dy2), "~29% L'ANNO", bold(96), INK, "ma", alpha=a2)
    a3, _ = entra(t, 0.65, 0.4)
    testo(d, (W / 2, 570), "composto · non il +1.223%, non il +66 R", med(27), INK_3,
          "ma", alpha=a3)

    a4, dy4 = entra(t, 1.0, 0.45)
    curva_equity(d, (MARG + 60, 660, W - MARG - 60, 1010), 1.0, col=INK_4,
                 spessore=2, ombra=False, alpha=a4 * 0.8)
    blocco(d, (W / 2, 1075),
           "Il 2024-2026 e' stato eccezionale per l'oro. Pianificare sul numero\n"
           "alto significa scommettere che si ripeta.", med(25), INK_2, 820, 35, "ma",
           alpha=a4)


def s_aperte(d, t, dur):
    telaio(d, "RESTA APERTO",
           "Tre cose non sono risolte, e non sono piccole.",
           "QUELLO CHE ANCORA NON SO")
    a, dy = entra(t, 0.0, 0.35)
    testo(d, (W / 2, 330 + dy), "TRE COSE APERTE", bold(62), INK, "ma", alpha=a)
    checklist(d, (MARG + 30, 450, W - MARG - 30, 0), [
        ("01", "TETTO DI DRAWDOWN SFORATO", "34-37% CONTRO IL 33% CHE AVEVO POSTO", NEG),
        ("02", "LA GAMBA NASDAQ NON HA IL PLATEAU", "LA SUA t NON SI PUO' SGONFIARE", WARN),
        ("03", "MAI PROVATA SU UN ALTRO STRUMENTO", "E' IL TEST CHE COSTA MEZZ'ORA", WARN),
    ], t - 0.35)
    a2, _ = entra(t, 1.5, 0.4)
    blocco(d, (W / 2, 850),
           "Un sistema sovra-ottimizzato fallisce il primo test, non li passa tutti.\n"
           "Ma passarli non chiude queste tre.", med(25), INK_2, 840, 35, "ma", alpha=a2)


def s_verdetto(d, t, dur):
    telaio(d, "", "Non e' overfittata. Ma il numero da usare e' quello basso.",
           "LA RISPOSTA SECCA")
    a, dy = entra(t, 0.0, 0.4)
    testo(d, (W / 2, 400 + dy), "NON E'", bold(96), INK_3, "ma", alpha=a)
    a2, dy2 = entra(t, 0.3, 0.4)
    testo(d, (W / 2, 505 + dy2), "OVERFITTATA", bold(96), OK, "ma", alpha=a2)
    a3, dy3 = entra(t, 0.7, 0.45)
    linea_h(d, MARG + 120, W - MARG - 120, 610, INK_4, 1, a3)
    for i, (k, v, n, col) in enumerate([
            ("NON E' CASO", "6 su 1 mln", "fuori campione, t 4,36", OK),
            ("PER I PIANI", "~29%", "all'anno composto", INK),
            ("DRAWDOWN", "34–37%", "il tetto era 33%", NEG)]):
        aa, ddy = entra(t, 0.75 + i * 0.18, 0.4)
        y = 680 + i * 150 + ddy
        testo(d, (MARG + 80, y), k, mono(19), INK_3, "la", track=4, alpha=aa)
        testo(d, (MARG + 80, y + 62), v, monob(44), col, "ls", alpha=aa)
        testo(d, (W - MARG - 80, y + 56), n, mono(21), INK_3, "rs", alpha=aa)
        if i < 2:
            linea_h(d, MARG + 80, W - MARG - 80, y + 100, (30, 33, 41), 1, aa)


def s_follow(d, t, dur):
    telaio(d, "", "Tutto misurato, criteri dichiarati prima del test.", None)
    a, dy = entra(t, 0.0, 0.4)
    testo(d, (W / 2, 420 + dy), "I CRITERI SI DICHIARANO", bold(52), INK, "ma", alpha=a)
    a2, dy2 = entra(t, 0.25, 0.4)
    testo(d, (W / 2, 495 + dy2), "PRIMA DEL TEST", bold(52), ACC, "ma", alpha=a2)
    a3, _ = entra(t, 0.6, 0.5)
    curva_equity(d, (MARG + 60, 640, W - MARG - 60, 980), 1.0, col=INK_4, spessore=2,
                 ombra=False, alpha=a3 * 0.55)
    a4, dy4 = entra(t, 0.9, 0.45)
    glifo_ig(d, W / 2 - 34, 790 + dy4, 68, INK, alpha=a4)
    testo(d, (W / 2, 900 + dy4), MANIGLIA, monob(34), INK, "ma", alpha=a4)
    testo(d, (W / 2, 950 + dy4), "anche i numeri che non convengono", mono(21), INK_3,
          "ma", alpha=a4)


# durata in battiti · funzione
SCENE = [
    (8,  s_hook),
    (6,  s_ma),
    (7,  s_forma),
    (7,  s_dom1),
    (8,  s_risp1),
    (7,  s_dom2),
    (7,  s_dom3),
    (9,  s_dom4),
    (7,  s_numero),
    (8,  s_aperte),
    (7,  s_verdetto),
    (6,  s_follow),
]


# ==========================================================================
#  montaggio
# ==========================================================================
def rendi(bpm, offset, battiti, out, audio=None, qualita=18):
    sb = 60.0 / bpm
    # ogni scena comincia su un battito
    inizi, acc = [], offset
    for nb, _ in SCENE:
        inizi.append(acc)
        acc += nb * sb
    durata = acc + 0.5
    nfr = int(durata * FPS)

    bg = fondo()
    ff = __import__("imageio_ffmpeg").get_ffmpeg_exe()
    cmd = [ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if audio:
        cmd += ["-i", audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k",
                "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", str(qualita),
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    for f in range(nfr):
        tt = f / FPS
        im = bg.copy()
        d = ImageDraw.Draw(im)
        d._image = im

        # quale scena
        idx = 0
        for i, s in enumerate(inizi):
            if tt >= s:
                idx = i
        dur = SCENE[idx][0] * sb
        loc = tt - inizi[idx]

        # dissolvenza d'ingresso e d'uscita, mezzo battito
        fade = min(out_cubic(loc / (sb * 0.45)), 1.0)
        rest = dur - loc
        if rest < sb * 0.35:
            fade *= out_cubic(rest / (sb * 0.35))

        SCENE[idx][1](d, loc, dur)

        arr = np.asarray(im, np.float32)
        if fade < 0.999:
            bgn = np.asarray(bg, np.float32)
            arr = bgn + (arr - bgn) * fade

        # pulsazione sul battito: un respiro dell'1%, non uno zoom
        if battiti is not None and len(battiti):
            db = tt - battiti[np.searchsorted(battiti, tt, "right") - 1] if tt >= battiti[0] else 9
            k = max(0.0, 1.0 - db / (sb * 0.5)) ** 2
        else:
            k = max(0.0, 1.0 - ((tt - offset) % sb) / (sb * 0.5)) ** 2
        if k > 0.02:
            z = 1.0 + 0.006 * k
            im2 = Image.fromarray(arr.astype(np.uint8), "RGB")
            nw, nh = int(W * z), int(H * z)
            im2 = im2.resize((nw, nh), Image.BILINEAR).crop(
                ((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
            arr = np.asarray(im2, np.float32) * (1 + 0.025 * k)

        p.stdin.write(np.clip(arr, 0, 255).astype(np.uint8).tobytes())
        if f % 150 == 0:
            print(f"  {f}/{nfr}  ({tt:5.1f}s)", flush=True)

    p.stdin.close()
    p.wait()
    print(f"scritto {out} · {durata:.1f}s · {bpm} BPM")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--bpm", type=float, default=70.0)
    ap.add_argument("--offset", type=float, default=0.0)
    ap.add_argument("--audio", default=None, help="mp3/m4a del brano")
    ap.add_argument("--out", default=os.path.join(QUI, "reel.mp4"))
    a = ap.parse_args()

    bt = None
    if a.audio:
        from battiti import misura
        bpm, off, bt = misura(a.audio)
        a.bpm, a.offset = bpm, off
        print(f"misurati dal brano: {bpm:.1f} BPM, primo battito a {off:.3f}s")
    rendi(a.bpm, a.offset, bt, a.out, a.audio)
