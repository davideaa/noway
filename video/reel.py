#!/usr/bin/env python3
"""
Reel verticale: il mosaico.

Versione visivamente opposta a quella a linee. Qui non si scrive niente:
ci sono **tessere che migrano**. Gli stessi 85 mesi del calendario del pdf
si ridispongono da soli — calendario, ordinati per valore, distribuzione,
due pile — e ogni tessera parte con un ritardo suo, cosi' il cambio
attraversa il mosaico come un'onda. Una tessera non nasce e non muore mai:
e' sempre lo stesso mese, solo in un posto diverso, e si vede dove va a
finire.

  0    - 4,5   il logo
  4,5  - 13,5  il calendario si riempie, un mese alla volta
  13,5 - 20    i mesi si ordinano dal peggiore al migliore
  20   - 27    si impilano nella distribuzione
  27   - 34    si dividono in due pile: 58 in utile, 27 in perdita
  34   - 44    2.749 operazioni, ordinate: il 25% piu' grandi fa il 61%
  44   - 50    il logo

Il calendario e i numeri sulle operazioni vengono dalle pagine 3 e 5 del pdf
"La curva vera", che le versioni prima non avevano mai aperto.
"""

import argparse, json, os, subprocess, sys
from PIL import Image, ImageDraw
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stile import *      # noqa
from fluido import liscia, liscia2, finestra, Camera
import mosaico as MO

QUI = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(QUI, "dati.json")))
FPS = 30
DURATA = 50.0
MANIGLIA = "QUANT_LAB.DE"

ANNI = sorted(D["mesi"])
MESE_NOMI = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU",
             "LUG", "AGO", "SET", "OTT", "NOV", "DIC"]

# le 85 tessere: valore, anno, mese, e il posto nel calendario
PRES, VAL, ETICH = [], [], []
for r, a in enumerate(ANNI):
    for c, v in enumerate(D["mesi"][a]):
        if v is None:
            continue
        PRES.append((r, c)); VAL.append(float(v)); ETICH.append((a, c))
VAL = np.array(VAL)
NM = len(VAL)
C = D["calendario"]

# le operazioni, riespanse dall'istogramma dei report
_I = D["isto"]
OPS = np.repeat(np.array(_I["x"], float), np.array(_I["y"], int))
OPS_ORD = np.sort(OPS)[::-1]
_vin = OPS_ORD[OPS_ORD > 0]
CONC25 = 100 * _vin[:int(len(_vin) * .25)].sum() / _vin.sum()

BOX = (128, 560, 952, 1090)
CAMERA = Camera([(0, BOX), (13.5, BOX), (20, (128, 600, 952, 1050)),
                 (27, (128, 570, 952, 1080)), (34, (128, 560, 952, 1090)),
                 (44, (128, 540, 952, 1110)), (50, (128, 540, 952, 1110))])

CAL = MO.calendario(BOX, 8, 12, PRES)
ORD, Y_ZERO = MO.ordinate(BOX, VAL)
IST, X_DI = MO.istogramma(BOX, VAL)
COL, CENTRI, CONTA = MO.colonne(BOX, VAL)

CAMPO = MO.campo((128, 560, 952, 1076), len(OPS), 64, 9.0, 2.0)
FILA = MO.in_fila((128, 560, 952, 1076), OPS, 64, 9.0, 2.0)


def colore_mese(v, spento=0.0):
    """Verde o rosso, tanto piu' pieno quanto piu' grosso e' il mese."""
    f = min(abs(v) / 14.0, 1.0) * 0.72 + 0.28
    base = OK if v > 0 else NEG
    c = np.array(base, np.float64) * f + np.array(BG_C, np.float64) * (1 - f)
    if spento > 0:
        c = c * (1 - spento) + np.array(INK_5, np.float64) * spento
    return c

COL_MESI = np.array([colore_mese(v) for v in VAL])
COL_OPS = np.array([(OK if v > 0 else NEG) for v in OPS], np.float64)


def cruscotto(d, campi, a=1.0):
    testo(d, (98, 240), MANIGLIA, mono(19), INK_3, "lm", track=7, alpha=a)
    testo(d, (982, 240), "XAUUSD + NQ", mono(19), INK_3, "rm", track=5, alpha=a)
    linea_h(d, 98, 982, 272, INK_5, 1, a)
    x = 98
    for et, val, col in campi:
        testo(d, (x, 312), et, mono(16), INK_3, "lm", track=3, alpha=a)
        testo(d, (x, 344), val, monob(26), col, "lm", track=1, alpha=a)
        x += 300


def titolo_vivo(d, t, a, b, righe, occhiello=None, col_occ=None, px=50):
    v = finestra(t, a, b, 0.9, 0.7)
    if v <= 0.01:
        return
    dy = (1 - liscia2(min((t - a) / 0.9, 1.0))) * 28 - \
         (1 - liscia2(min((b - t) / 0.7, 1.0))) * 20
    if occhiello:
        testo(d, (98, 412 + dy), occhiello, mono(18), col_occ or INK_3, "lm",
              track=6, alpha=v)
    for i, r in enumerate(righe):
        testo(d, (98, 440 + i * (px + 10) + dy), r, bold(px), INK, "la", alpha=v)


def piede(d, t, a, b, riga, parti):
    v = finestra(t, a, b, 0.8, 0.6)
    if v <= 0.01:
        return
    dy = (1 - liscia2(min((t - a) / 0.8, 1.0))) * 14
    if riga:
        testo(d, (W / 2, 1218 + dy), riga, mono(18), INK_3, "mm", track=5, alpha=v)
    if parti:
        frase(d, (W / 2, 1264 + dy), parti, 27, "mm", v)


# ==========================================================================
def disegna(t, im):
    d = ImageDraw.Draw(im); d._image = im
    box = CAMERA.box(t)
    r1_ = np.sin(t * 0.43) * 11.0
    r2_ = np.sin(t * 0.29 + 1.4) * 8.0
    box = (box[0] + r1_, box[1] + r2_, box[2] + r1_, box[3] + r2_)

    # --- logo -------------------------------------------------------------
    if t < 5.6:
        va = liscia(t / 1.3) * (1 - liscia((t - 3.7) / 1.6))
        if va > 0.005:
            im = logo(im, W / 2, 900, 700 * (1 + 0.12 * (1 - liscia2(t / 2.6))),
                      va, 0.7 * (1 - liscia(t / 2.2)) + 0.14,
                      (t - 1.0) / 2.0 if 1.0 < t < 3.0 else None)
            d = ImageDraw.Draw(im); d._image = im
            if t < 3.5:
                testo(d, (W / 2, 1290), MANIGLIA, mono(25), INK_2, "mm",
                      track=12, alpha=va * liscia((t - 1.4) / 1.0))
    if t > 44.2:
        va = liscia((t - 44.2) / 1.4)
        im = logo(im, W / 2, 900, 640 * (1 + 0.09 * (1 - liscia2((t - 44.2) / 6.0))),
                  va, 0.5 * (1 - liscia((t - 44.2) / 2.0)) + 0.18,
                  (t - 45.0) / 4.4 if 45.0 < t < 49.4 else None)
        d = ImageDraw.Draw(im); d._image = im
        testo(d, (W / 2, 470), "MISURATO PRIMA", bold(50), INK_2, "ma",
              alpha=liscia((t - 44.6) / 1.0))
        testo(d, (W / 2, 532), "DI RISCHIARE.", bold(50), INK, "ma",
              alpha=liscia((t - 45.0) / 1.0))
        testo(d, (W / 2, 1320), MANIGLIA, mono(23), INK_3, "mm", track=12,
              alpha=liscia((t - 46.4) / 1.2))
        return im

    a_gen = liscia((t - 4.2) / 1.0) * (1 - liscia((t - 43.6) / 1.0))
    if a_gen <= 0.005:
        return im

    arr = None

    # ======================================================================
    #  i mesi: calendario -> ordinati -> distribuzione -> due pile
    # ======================================================================
    if t < 35.2:
        sv = 1 - liscia((t - 33.6) / 1.6)
        if t < 13.8:
            disp, k = CAL, np.ones(NM)
            # entrano in ordine di tempo, uno alla volta
            q = liscia((t - 5.0) / 8.0)
            arrivo = np.clip((q * NM - np.arange(NM)) / 2.5, 0, 1)
            disp = MO.Disposizione(CAL.x, CAL.y + (1 - arrivo) * 26,
                                   CAL.w * (0.55 + 0.45 * arrivo),
                                   CAL.h * (0.55 + 0.45 * arrivo), arrivo)
        elif t < 20.4:
            disp, k = MO.fondi(CAL, ORD, liscia((t - 13.8) / 5.2), 0.5)
        elif t < 27.4:
            disp, k = MO.fondi(ORD, IST, liscia((t - 20.4) / 6.6), 0.5)
        else:
            disp, k = MO.fondi(IST, COL, liscia((t - 27.4) / 5.0), 0.5,
                               np.argsort(-VAL))

        MO.dipingi_varie(d, disp, COL_MESI, a_gen * sv)

        # la griglia del calendario, che sbiadisce quando si rompe
        gv = a_gen * (1 - liscia((t - 13.8) / 2.2)) * sv
        if gv > 0.01:
            x0, y0, x1, y1 = BOX
            pw = (x1 - x0) / 12; ph = (y1 - y0) / 8
            q = liscia((t - 5.0) / 8.0)
            for r, a_ in enumerate(ANNI):
                vis = gv if q * NM > sum(1 for p in PRES if p[0] < r) else gv * 0.35
                testo(d, (x0 - 16, y0 + (r + .5) * ph), a_, mono(17), INK_3,
                      "rm", alpha=vis)
            for c, m in enumerate(MESE_NOMI):
                testo(d, (x0 + (c + .5) * pw, y1 + 22), m[0], mono(15), INK_3,
                      "ma", alpha=gv * 0.8)

        # il mese su cui sta passando
        if t < 13.8:
            q = liscia((t - 5.0) / 8.0)
            j = int(np.clip(q * NM, 0, NM - 1))
            a_, c_ = ETICH[j]
            cruscotto(d, [("MESE", f"{a_}.{c_ + 1:02d}", INK),
                          ("RENDIMENTO", f"{VAL[j]:+.0f}%", OK if VAL[j] > 0 else NEG),
                          ("MESI", f"{j + 1} / {NM}", INK_3)], a_gen)
        elif t < 20.4:
            cruscotto(d, [("MESI", f"{NM}", INK),
                          ("MIGLIORE", "+19,5%", OK),
                          ("PEGGIORE", "−10,5%", NEG)], a_gen * sv)
        elif t < 27.4:
            cruscotto(d, [("MEDIA", "+3,28%", INK),
                          ("MEDIANA", "+3,30%", INK_2),
                          ("DEV. STD", "6,31%", INK_3)], a_gen * sv)
        else:
            cruscotto(d, [("IN UTILE", f"{CONTA[0]}", OK),
                          ("IN PERDITA", f"{CONTA[1]}", NEG),
                          ("SU", f"{NM} MESI", INK_3)], a_gen * sv)

        # gli estremi, quando sono ordinati
        if 17.0 < t < 21.6:
            av = finestra(t, 17.0, 21.6, 1.0, 0.8) * a_gen
            i_min, i_max = int(np.argmin(VAL)), int(np.argmax(VAL))
            staffa(d, (disp.x[i_min], disp.y[i_min] + 34), "2021.11  −10,5%",
                   NEG, 18, "d", av)
            staffa(d, (disp.x[i_max], disp.y[i_max] - 34), "2025.09  +19,5%",
                   OK, 18, "s", av)
        # le due pile
        if t > 29.6:
            av = liscia((t - 29.6) / 1.4) * a_gen * sv
            for cx, et, val, col in ((CENTRI[0], "IN UTILE", "68%", OK),
                                     (CENTRI[1], "IN PERDITA", "32%", NEG)):
                testo(d, (cx, 836), et, mono(18), INK_3, "ma", track=4, alpha=av)
                testo(d, (cx, 866), val, bold(46), col, "ma", alpha=av)

    # ======================================================================
    #  le operazioni
    # ======================================================================
    if 33.4 < t < 44.6:
        av = a_gen * liscia((t - 33.8) / 1.4) * (1 - liscia((t - 43.4) / 1.2))
        sf = liscia((t - 36.2) / 6.6)                    # quanto sono ordinate
        n_vis = int(np.clip((t - 34.0) / 2.2, 0, 1) * len(OPS))
        if n_vis > 4 and av > 0.01:
            if sf < 0.004:
                disp = CAMPO
            else:
                disp, _ = MO.fondi(CAMPO, FILA, sf, 0.45, np.argsort(-OPS))
            sel = slice(0, n_vis)
            colori = COL_OPS.copy()
            # il 25% piu' grandi si accende
            if sf > 0.48:
                aq = liscia((sf - 0.48) / 0.26)
                k25 = int((OPS > 0).sum() * 0.25)
                idx = np.argsort(-OPS)[:k25]
                colori[idx] = (np.array((236, 200, 130), float) * aq
                               + COL_OPS[idx] * (1 - aq))
            dd = MO.Disposizione(disp.x[sel] + r1_, disp.y[sel] + r2_,
                                 disp.w[sel], disp.h[sel], disp.a[sel])
            arr = np.asarray(im, np.float32)
            arr = MO.dipingi(arr, dd, colori[sel], av)
            im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
            d = ImageDraw.Draw(im); d._image = im

        cruscotto(d, [("OPERAZIONI", f"{len(OPS):,}".replace(",", "."), INK),
                      ("IN UTILE", "39%", OK),
                      ("MEDIA", "+0,13 R", INK_2)], av)
        if sf > 0.54:
            aq = liscia((sf - 0.54) / 0.26) * av
            testo(d, (98, 1104), "IL 25% PIÙ GRANDI FA IL", mono(19), INK_3,
                  "la", track=4, alpha=aq)
            testo(d, (98, 1136), f"{CONC25:.0f}% DEGLI UTILI", bold(46), ORO_CHI,
                  "la", alpha=aq)

    # --- titoli e piedi ---------------------------------------------------
    titolo_vivo(d, t, 5.4, 13.2, ["OTTANTACINQUE", "MESI."], "IL CALENDARIO VERO",
                ORO_CHI)
    titolo_vivo(d, t, 14.4, 19.8, ["DAL PEGGIORE", "AL MIGLIORE."],
                "GLI STESSI MESI, IN FILA", ACC)
    titolo_vivo(d, t, 21.2, 26.8, ["COM'È FATTO", "UN ANNO."], "LA DISTRIBUZIONE",
                ACC)
    titolo_vivo(d, t, 28.2, 33.2, ["UN MESE SU TRE", "È ROSSO."], "DUE PILE", NEG)
    titolo_vivo(d, t, 35.4, 43.0, ["POCHE OPERAZIONI", "FANNO TUTTO."],
                "2.749 OPERAZIONI", ORO_CHI)

    piede(d, t, 6.6, 13.2, "OGNI TESSERA È UN MESE · 2019.09 → 2026.09",
          [("Da 10.000 a ", None), ("132.328", ORO_CHI), (" euro.", None)])
    piede(d, t, 15.6, 19.8, "MIGLIORE +19,5% · PEGGIORE −10,5%",
          [("Il peggiore costa ", None), ("meno", OK), (" del migliore.", None)])
    piede(d, t, 22.4, 26.8, "MEDIA +3,28% · DEVIAZIONE 6,31%",
          [("Media e mediana ", None), ("coincidono", ACC), (".", None)])
    piede(d, t, 29.4, 33.2, "58 MESI IN UTILE SU 85",
          [("Va messo in conto ", None), ("prima", NEG), (".", None)])
    piede(d, t, 37.4, 43.0, "ORDINATE DALLA PIÙ GRANDE ALLA PIÙ PICCOLA",
          [("Il resto serve solo a ", None), ("restare dentro", ORO_CHI), (".", None)])
    return im


def rendi(out, audio=None, durata=DURATA, crf=17):
    nfr = int(durata * FPS)
    bg = fondo()
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
        im = disegna(f / FPS, bg.copy())
        proc.stdin.write(np.asarray(im, np.uint8).tobytes())
        if f % 180 == 0:
            print(f"  {f}/{nfr}  ({f / FPS:5.1f}s)", flush=True)
    proc.stdin.close(); proc.wait()
    print(f"scritto {out} · {durata:.1f}s")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", default=None)
    ap.add_argument("--secondi", type=float, default=DURATA)
    ap.add_argument("--out", default=os.path.join(QUI, "reel.mp4"))
    a = ap.parse_args()
    rendi(a.out, a.audio, a.secondi)
