#!/usr/bin/env python3
"""
Reel verticale: un solo piano sequenza di 50 secondi.

Non ci sono scene che si dissolvono l'una nell'altra. C'e' una sola curva,
una sola inquadratura, e tutto si trasforma senza mai fermarsi:

  0,0 - 4,5   il logo si forma e il suo bagliore diventa la punta della curva
  4,5 - 15    la curva si scrive dal vivo. La finestra si allarga da sola
              mentre cresce, quindi ogni pixel si muove a ogni fotogramma
  15  - 23    la curva si sdoppia in tre: oro, nasdaq, insieme
  23  - 31    l'insieme si ripiega sott'acqua — stessi 1.597 punti, la linea
              scende sotto lo zero e si riempie di rosso
  31  - 38    il sott'acqua si spegne a onda mentre sale la distribuzione
  38  - 45,5  150 tentativi a caso entrano lasciando la scia, la curva vera
              li scavalca
  45,5 - 50   il logo si richiude

I meccanismi stanno in fluido.py, le misure dei riferimenti in
RIFERIMENTI.md, i numeri in dati.json.
"""

import argparse, json, os, subprocess, sys
from PIL import Image, ImageDraw
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stile import *      # noqa
from fluido import *     # noqa

QUI = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(QUI, "dati.json")))

FPS = 30
DURATA = 50.0
MANIGLIA = "QUANT_LAB.DE"

CAP = np.array(D["capitale"], np.float64)
LCAP = np.log10(CAP)
DDC = np.array(D["dd_capitale"], np.float64) * 100.0
CURVA = np.array(D["curva_R"], np.float64)
N = len(CAP)
G = D["gambe"]
M = D["mc"]

N_OOS = D["t"]["oos_n"]
I_TAGLIO = int(round(len(CURVA) * (1 - N_OOS / D["n"])))
FUORI = CURVA[I_TAGLIO:] - CURVA[I_TAGLIO]

# le tappe d'anno sulla curva, per far scorrere l'anno nel cruscotto
BORDI = [(a, v[1]) for a, v in sorted(D["bordi_anno"].items())]

# le tre gambe, riportate sugli stessi 1.597 punti della curva grande, cosi'
# si possono fondere una nell'altra: i valori annuali sono le tappe vere, in
# mezzo si interpola.
def _gamba(nome):
    y = np.array(G[nome], np.float64)
    tappe = np.linspace(0, N - 1, len(y))
    return np.interp(np.arange(N), tappe, np.log10(y))

GAMBE = {k: _gamba(k) for k in ("oro", "nasdaq", "insieme")}


def _nuvola(n_curve=150, n_punti=170, seme=7):
    r = np.random.default_rng(seme)
    sd = D["t"]["oos_sd"]
    passi = r.normal(0, sd * np.sqrt(N_OOS / n_punti), (n_curve, n_punti))
    return np.concatenate([np.zeros((n_curve, 1)), np.cumsum(passi, 1)], 1)

NUVOLA = _nuvola()
MAX_CASO = float(NUVOLA[:, -1].max())

# le serie normalizzate: e' in questo spazio che si fondono fra loro
N_CAP = normalizza(LCAP)
N_UW = normalizza(DDC)

VISTA = Vista(N_CAP, margine=0.08)

# una sola inquadratura per tutto il video
CAMERA = Camera([
    (0.0,  (150, 640, 930, 980)),
    (4.5,  (150, 640, 930, 980)),
    (11.0, (130, 610, 950, 1000)),
    (15.0, (130, 600, 950, 1010)),
    (23.0, (140, 620, 940, 990)),
    (31.0, (150, 640, 930, 960)),
    (34.0, (150, 660, 930, 1000)),
    (38.0, (150, 620, 930, 1030)),
    (45.5, (150, 620, 930, 1030)),
    (50.0, (150, 620, 930, 1030)),
])


def anno_a(i):
    for a, fine in BORDI:
        if i < fine:
            return a
    return BORDI[-1][0]


# ==========================================================================
#  il cruscotto, sempre acceso, sempre in movimento
# ==========================================================================
def testina_di(t):
    """Dove sta la testina che scorre. Ripassa la curva da capo nei tratti
    in cui altrimenti non si muoverebbe niente: sulle tre gambe e sulla
    ripiegatura. Cosi' il cruscotto ha sempre qualcosa da leggere."""
    if 19.6 < t < 23.4:
        return int(np.clip((t - 19.6) / 3.6, 0, 1) * (N - 1))
    if 24.6 < t < 30.6:
        return int(np.clip((t - 24.6) / 5.6, 0, 1) * (N - 1))
    return None


def cruscotto(d, t, i, mostra_dd=0.0, a=1.0):
    testo(d, (98, 240), MANIGLIA, mono(19), INK_3, "lm", track=7, alpha=a)
    testo(d, (982, 240), "XAUUSD + NQ", mono(19), INK_3, "rm", track=5, alpha=a)
    linea_h(d, 98, 982, 272, INK_5, 1, a)

    cap = float(CAP[min(i, N - 1)])
    dd = float(DDC[min(i, N - 1)])
    campi = [("CAPITALE", f"{cap:,.0f} €".replace(",", "."), ORO_CHI),
             ("ANNO", anno_a(i), INK)]
    if mostra_dd > 0.01:
        campi.append(("SOTT'ACQUA", f"{dd:+.1f}%".replace(".", ","),
                      NEG if dd < -0.05 else INK_3))
    x = 98
    for k, (et, val, col) in enumerate(campi):
        aa = a * (mostra_dd if k == 2 else 1.0)
        testo(d, (x, 312), et, mono(16), INK_3, "lm", track=3, alpha=aa)
        testo(d, (x, 344), val, monob(26), col, "lm", track=1, alpha=aa)
        x += 300


def titolo_vivo(d, t, a, b, righe, occhiello=None, col_occ=None, px=50):
    """Un titolo che vive fra a e b, entra salendo ed esce salendo: non si
    accende e si spegne, passa."""
    v = finestra(t, a, b, 0.9, 0.7)
    if v <= 0.01:
        return
    dy = (1 - liscia2(min((t - a) / 0.9, 1.0))) * 30 - \
         (1 - liscia2(min((b - t) / 0.7, 1.0))) * 22
    if occhiello:
        testo(d, (98, 420 + dy), occhiello, mono(18), col_occ or INK_3, "lm",
              track=6, alpha=v)
    for i, r in enumerate(righe):
        testo(d, (98, 448 + i * (px + 10) + dy), r, bold(px), INK, "la", alpha=v)


def piede(d, t, a, b, mono_riga, parti):
    v = finestra(t, a, b, 0.8, 0.6)
    if v <= 0.01:
        return
    dy = (1 - liscia2(min((t - a) / 0.8, 1.0))) * 16
    if mono_riga:
        testo(d, (W / 2, 1236 + dy), mono_riga, mono(18), INK_3, "mm", track=5,
              alpha=v)
    if parti:
        frase(d, (W / 2, 1282 + dy), parti, 27, "mm", v)


# ==========================================================================
#  il fotogramma
# ==========================================================================
def disegna(t, im, scia):
    d = ImageDraw.Draw(im)
    d._image = im
    box = CAMERA.box(t)
    # la cornice respira: un movimento lentissimo che non si ferma mai,
    # cosi' anche quando la curva e' ferma il fotogramma non lo e'
    r1_ = np.sin(t * 0.47) * 15.0
    r2_ = np.sin(t * 0.31 + 1.7) * 11.0
    zz_ = np.sin(t * 0.19 + 0.6) * 9.0
    box = (box[0] + r1_ - zz_, box[1] + r2_ - zz_,
           box[2] + r1_ * 0.6 + zz_, box[3] + r2_ * 0.7 + zz_)
    x0, y0, x1, y1 = box

    # --- quanto della curva e' gia' scritta --------------------------------
    if t < 4.5:
        n = 2
    elif t < 15.0:
        n = int(2 + liscia2((t - 4.5) / 9.6) * (N - 2))
    else:
        n = N
    i = min(n - 1, N - 1)

    a_gen = liscia((t - 4.0) / 1.0)
    if t > 45.0:
        a_gen *= 1 - liscia((t - 45.0) / 1.2)

    # --- il logo, in apertura e in chiusura --------------------------------
    if t < 5.6:
        va = liscia(t / 1.3) * (1 - liscia((t - 3.6) / 1.6))
        if va > 0.005:
            sc = 1.0 + 0.12 * (1 - liscia2(t / 2.6))
            sw = (t - 1.0) / 2.0 if 1.0 < t < 3.0 else None
            im = logo(im, W / 2, 900, 700 * sc, va, 0.7 * (1 - liscia(t / 2.2)) + 0.14, sw)
            d = ImageDraw.Draw(im); d._image = im
            if t < 3.4:
                testo(d, (W / 2, 1290), MANIGLIA, mono(25), INK_2, "mm",
                      track=12, alpha=va * liscia((t - 1.4) / 1.0))
    if t > 45.2:
        va = liscia((t - 45.2) / 1.4)
        im = logo(im, W / 2, 900, 640 * (1 + 0.07 * (1 - liscia2((t - 45.2) / 4.6))),
                  va, 0.5 * (1 - liscia((t - 45.2) / 2.0)) + 0.18,
                  (t - 46.2) / 3.2 if 46.2 < t < 49.4 else None)
        d = ImageDraw.Draw(im); d._image = im
        testo(d, (W / 2, 470), "MISURATO PRIMA", bold(50), INK_2, "ma",
              alpha=liscia((t - 45.6) / 1.0))
        testo(d, (W / 2, 532), "DI RISCHIARE.", bold(50), INK, "ma",
              alpha=liscia((t - 46.0) / 1.0))
        testo(d, (W / 2, 1320), MANIGLIA, mono(23), INK_3, "mm", track=12,
              alpha=liscia((t - 47.4) / 1.2))
        return im, d

    if a_gen <= 0.004:
        return im, d

    ts_ = testina_di(t)
    cruscotto(d, t, ts_ if ts_ is not None else i,
              finestra(t, 22.0, 33.0, 1.2, 1.2), a_gen)

    # ======================================================================
    #  ATTO 1-2  la curva si scrive, poi si sdoppia in tre
    # ======================================================================
    if t < 31.6:
        sdop = liscia2((t - 14.1) / 7.4)          # quanto sono separate
        fold = liscia2((t - 23.5) / 5.5)          # quanto e' ripiegata
        # si spegne mentre la distribuzione sale, non con uno stacco
        a_gen = a_gen * (1 - liscia((t - 30.0) / 1.5))

        base = N_CAP
        if sdop > 0.003:
            base = morph(N_CAP, normalizza(GAMBE["insieme"]), sdop, 0.30)
        if fold > 0.003:
            base = morph(base, N_UW, fold, 0.45)

        v = Vista(base, 0.08)
        px, _ = v.punti(n, box)

        # le due gambe che escono da sotto quella grande
        if 0.003 < sdop and fold < 0.55:
            for nome, col, dy_et in (("oro", ORO_CHI, 26), ("nasdaq", ACC, -26)):
                g = morph(N_CAP, normalizza(GAMBE[nome]), sdop, 0.30)
                lo, hi = v.limiti(n)
                xs = np.linspace(x0, x1, n)
                ys = y1 - (g[:n] - lo) / (hi - lo) * (y1 - y0)
                aa = a_gen * sdop * (1 - fold / 0.55)
                c = tuple(int(round(k * aa + b * (1 - aa)))
                          for k, b in zip(col, BG_C))
                d.line(list(zip(xs.tolist(), ys.tolist())), fill=c, width=3,
                       joint="curve")
                if sdop > 0.85 and fold < 0.2:
                    # le tre punte convergono: senza sfalsarle le etichette
                    # finiscono una sull'altra
                    staffa(d, (xs[-1] - 4, ys[-1] + dy_et),
                           "ORO +179%" if nome == "oro" else "NASDAQ +375%",
                           col, 18, "s", aa, 20)
                if ts_ is not None and fold < 0.2:
                    cx_ = xs[min(ts_, n - 1)]
                    cy_ = ys[min(ts_, n - 1)]
                    d.ellipse([cx_ - 6, cy_ - 6, cx_ + 6, cy_ + 6],
                              fill=tuple(int(round(k * aa + b * (1 - aa)))
                                         for k, b in zip(col, BG_C)))

        # il riempimento, che arriva con la ripiegatura
        if fold > 0.02:
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ImageDraw.Draw(ov).polygon(
                px + [(px[-1][0], y0), (x0, y0)],
                fill=(NEG[0], NEG[1], NEG[2], int(46 * fold * a_gen)))
            im = Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
            d = ImageDraw.Draw(im); d._image = im

        col = tuple(int(round(ORO_CHI[k] * (1 - fold) + NEG[k] * fold))
                    for k in range(3))
        cc = tuple(int(round(k * a_gen + b * (1 - a_gen)))
                   for k, b in zip(col, BG_C))
        d.line(px, fill=cc, width=3 if fold < 0.5 else 2, joint="curve")

        # la punta viva: pallino, riga tratteggiata e valore a destra
        hx, hy = px[-1]
        if n < N:
            d.ellipse([hx - 5, hy - 5, hx + 5, hy + 5], fill=cc)
            tratteggio(d, (hx, hy), (x1 + 18, hy), INK_4, 6, 6, 1, alpha=a_gen * 0.7)
        elif fold < 0.3:
            staffa(d, (hx + 6, hy), "132.328 €", ORO_CHI, 19, "s", a_gen)

        # le tacche degli anni che scorrono sotto
        if fold < 0.4:
            for a_, fine in BORDI:
                if fine > n:
                    continue
                xx = x0 + (fine - 1) / max(n - 1, 1) * (x1 - x0)
                d.line([(xx, y1), (xx, y1 + 8)], fill=INK_4, width=1)
                if a_ in ("2020", "2022", "2024", "2026"):
                    testo(d, (xx, y1 + 26), a_, mono(16), INK_3, "ma",
                          alpha=a_gen * 0.8 * (1 - fold / 0.4))

        if ts_ is not None and (fold > 0.35 or sdop > 0.5):
            lo, hi = v.limiti(n)
            xs_t = x0 + ts_ / (N - 1) * (x1 - x0)
            ys_t = y1 - (base[ts_] - lo) / (hi - lo) * (y1 - y0)
            at = a_gen * liscia((fold - 0.35) / 0.25)
            d.line([(xs_t, y0 - 16), (xs_t, y1 + 10)], fill=tuple(
                int(round(k * at * 0.55 + b * (1 - at * 0.55)))
                for k, b in zip(INK_2, BG_C)), width=2)
            d.ellipse([xs_t - 7, ys_t - 7, xs_t + 7, ys_t + 7],
                      fill=tuple(int(round(k * at + b * (1 - at)))
                                 for k, b in zip(INK, BG_C)))

        if fold > 0.5:
            imin = int(np.argmin(DDC))
            xm = x0 + imin / (N - 1) * (x1 - x0)
            lo, hi = v.limiti(n)
            ym = y1 - (base[imin] - lo) / (hi - lo) * (y1 - y0)
            av = a_gen * liscia((fold - 0.5) / 0.3)
            d.ellipse([xm - 5, ym - 5, xm + 5, ym + 5], fill=NEG)
            staffa(d, (xm + 10, ym + 32), "−21,7%", NEG, 19, "d", av)

    a_gen = liscia((t - 4.0) / 1.0)
    if t > 45.0:
        a_gen *= 1 - liscia((t - 45.0) / 1.2)

    # ======================================================================
    #  ATTO 3  la distribuzione sale mentre il sott'acqua si spegne
    # ======================================================================
    if 30.0 < t < 38.6:
        s = liscia2((t - 30.5) / 4.4)
        xs_, ys_ = M["x"], M["y"]
        lo, hi = xs_[0], xs_[-1] + 5
        X = lambda vv: x0 + (vv - lo) / (hi - lo) * (x1 - x0)
        mx = max(ys_)
        bw = (x1 - x0) / len(xs_)
        rit = np.linspace(0.0, 0.45, len(xs_))
        fuori = 1 - liscia((t - 37.4) / 1.2)
        for k2, vv in enumerate(ys_):
            if not vv:
                continue
            g = liscia2((s - rit[k2]) / 0.55) * fuori
            if g <= 0.004:
                continue
            h = vv / mx * (y1 - y0) * g
            col = NEG if xs_[k2] < 0 else ACC_DIM
            aa = a_gen
            c = tuple(int(round(k * aa + b * (1 - aa))) for k, b in zip(col, BG_C))
            d.rectangle([X(xs_[k2]) + 1, y1 - h, X(xs_[k2]) + bw - 1, y1], fill=c)
        # la testina ripassa la distribuzione e riempie la cumulata: e'
        # il tratto in cui prima non si muoveva piu' niente
        if 34.2 < t < 37.6:
            fr = np.clip((t - 34.2) / 3.0, 0, 1)
            cum = np.cumsum(ys_) / max(sum(ys_), 1)
            k3 = int(fr * (len(xs_) - 1))
            xp = X(xs_[k3]) + bw
            for k2 in range(k3 + 1):
                if not ys_[k2]:
                    continue
                h = ys_[k2] / mx * (y1 - y0) * fuori
                c = tuple(int(round(k * a_gen + b * (1 - a_gen)))
                          for k, b in zip(ACC if xs_[k2] >= 0 else NEG, BG_C))
                d.rectangle([X(xs_[k2]) + 1, y1 - h, X(xs_[k2]) + bw - 1, y1],
                            fill=c)
            d.line([(xp, y0 + 20), (xp, y1)], fill=tuple(
                int(round(k * a_gen * 0.7 + b * (1 - a_gen * 0.7)))
                for k, b in zip(INK, BG_C)), width=2)
            staffa(d, (xp + 8, y0 + 40),
                   f"{cum[k3] * 100:.0f}% DEGLI ANNI SOTTO {xs_[k3]:+.0f} R",
                   INK_2, 17, "d" if fr < 0.6 else "s", a_gen * fuori, 26)

        if s > 0.25:
            av = a_gen * liscia((s - 0.25) / 0.4) * fuori
            linea_h(d, x0, x1, y1, INK_4, 2, av)
            xm = X(M["p"]["50"])
            d.line([(xm, y0 + 30), (xm, y1)], fill=ACC, width=2)
            staffa(d, (xm, y0 + 16), "MEDIANA  +44,7 R", ACC, 18, "d", av, 32)
            for g2 in (-50, 0, 50, 100, 150):
                testo(d, (X(g2), y1 + 26), ("+" if g2 > 0 else "") + str(g2),
                      mono(16), INK_3, "ma", alpha=av)

    # ======================================================================
    #  ATTO 4  la nuvola del caso, con la scia
    # ======================================================================
    if 37.8 < t < 46.0:
        s = (t - 38.2) / 6.2
        lo, hi = -150.0, 215.0
        Y = lambda vv: y1 - (vv - lo) / (hi - lo) * (y1 - y0)
        av = a_gen * liscia((t - 38.0) / 0.8)
        linea_h(d, x0, x1, Y(0), INK_4, 2, av)
        quante = int(len(NUVOLA) * np.clip(s / 0.62, 0, 1))
        for k2 in range(quante):
            vv = NUVOLA[k2]
            xs = np.linspace(x0, x1, len(vv))
            ys = Y(vv)
            f = 0.70 if k2 > quante - 10 else 0.26
            c = tuple(int(round(k * av * f + b * (1 - av * f)))
                      for k, b in zip(INK_4, BG_C))
            d.line(list(zip(xs.tolist(), ys.tolist())), fill=c, width=2,
                   joint="curve")
        if quante:
            testo(d, (x0, y0 - 26), f"{quante} TENTATIVI A CASO", mono(18),
                  INK_3, "lm", track=4, alpha=av)
        pm = liscia((s - 0.55) / 0.16)
        if pm > 0.01:
            tratteggio(d, (x0, Y(MAX_CASO)), (x1, Y(MAX_CASO)), WARN, 10, 8, 2,
                       alpha=pm * av)
            staffa(d, (x0 + 6, Y(MAX_CASO) - 26), "IL MEGLIO DEL CASO  +122 R",
                   WARN, 18, "d", pm * av)
        pv = np.clip((s - 0.56) / 0.44, 0, 1)
        if pv > 0.01:
            vv = FUORI[::max(len(FUORI) // 170, 1)]
            nn = max(int(len(vv) * pv), 2)
            xs = np.linspace(x0, x1, len(vv))[:nn]
            ys = Y(vv[:nn])
            c = tuple(int(round(k * av + b * (1 - av))) for k, b in zip(OK, BG_C))
            d.line(list(zip(xs.tolist(), ys.tolist())), fill=c, width=4,
                   joint="curve")
            d.ellipse([xs[-1] - 5, ys[-1] - 5, xs[-1] + 5, ys[-1] + 5], fill=c)
            if pv > 0.97:
                staffa(d, (xs[-1] + 6, ys[-1]), "+180,6 R", OK, 19, "s", av)

    # ======================================================================
    #  i titoli e i piedi, che passano sopra a tutto
    # ======================================================================
    titolo_vivo(d, t, 5.6, 14.0, ["SETTE ANNI,", "DUE MERCATI."],
                "ORO + NASDAQ", ORO_CHI)
    titolo_vivo(d, t, 15.6, 22.6, ["INSIEME NON È", "UNA SOMMA."],
                "PERCHÉ DUE E NON UNA", ACC)
    titolo_vivo(d, t, 24.0, 30.2, ["QUANTO SI STA", "SOTT'ACQUA."],
                "LA PARTE SCOMODA", NEG)
    titolo_vivo(d, t, 31.4, 37.6, ["DIECIMILA ANNI", "SIMULATI."],
                "UN ANNO QUALUNQUE", ACC)
    titolo_vivo(d, t, 38.6, 45.0, ["BATTI LA FORTUNA,", "NON LO ZERO."],
                "LA VERIFICA VERA", OK)

    if 19.0 < t < 23.4:
        vv = finestra(t, 19.0, 23.4, 0.9, 0.8)
        testo(d, (W / 2, 1120), "2,79 × 4,75 = 13,23", bold(42), INK, "ma",
              alpha=vv)
        testo(d, (W / 2, 1176), "NON UNA SOMMA · UNA MOLTIPLICAZIONE", mono(17),
              INK_3, "ma", track=4, alpha=vv)
    if 41.6 < t < 45.2:
        vv = finestra(t, 41.6, 45.2, 0.9, 0.8)
        testo(d, (98, 1108), "SU UN MILIONE DI TENTATIVI A CASO", mono(18),
              INK_3, "la", track=4, alpha=vv)
        testo(d, (98, 1142), "SEI ARRIVANO QUI", bold(48), OK, "la", alpha=vv)

    piede(d, t, 6.4, 14.0, "2.520 OPERAZIONI · SCALA LOGARITMICA",
          [("Da 10.000 a ", None), ("132.328", ORO_CHI), (" euro.", None)])
    piede(d, t, 16.4, 22.6, "CORRELAZIONE 0,067 SU 85 MESI",
          [("I profitti di una fanno crescere ", None), ("l'altra", OK), (".", None)])
    piede(d, t, 24.8, 30.2, "DRAWDOWN SULLA CURVA REALE",
          [("Un quinto del conto, ", None), ("per mesi", NEG), (".", None)])
    piede(d, t, 32.2, 37.6, "BOOTSTRAP A BLOCCHI DA 20",
          [("Un anno su venti ", None), ("in perdita", NEG), (".", None)])
    piede(d, t, 39.4, 45.0, "984 OPERAZIONI MAI VISTE · t 4,36",
          [("Sei su un ", None), ("milione", OK), (".", None)])
    return im, d


# ==========================================================================
def rendi(out, audio=None, durata=DURATA, crf=17):
    nfr = int(durata * FPS)
    bg = fondo()
    scia = Scia(0.0)
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
        t = f / FPS
        im = bg.copy()
        im, _ = disegna(t, im, scia)
        arr = np.asarray(im, np.float32)
        # la scia serve solo dove qualcosa corre: la nuvola
        arr = scia.applica(arr, 0.60 if 38.0 < t < 44.6 else 0.0)
        proc.stdin.write(np.clip(arr, 0, 255).astype(np.uint8).tobytes())
        if f % 180 == 0:
            print(f"  {f}/{nfr}  ({t:5.1f}s)", flush=True)
    proc.stdin.close()
    proc.wait()
    print(f"scritto {out} · {durata:.1f}s")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", default=None)
    ap.add_argument("--secondi", type=float, default=DURATA)
    ap.add_argument("--out", default=os.path.join(QUI, "reel.mp4"))
    a = ap.parse_args()
    rendi(a.out, a.audio, a.secondi)
