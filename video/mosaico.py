#!/usr/bin/env python3
"""
Il motore delle tessere.

La versione prima era fatta di linee che si scrivono. Questa e' fatta di
**tessere che migrano**: gli stessi 85 mesi si ridispongono da soli da una
forma all'altra — calendario, ordinati per valore, istogramma, due colonne —
e ogni tessera parte con un ritardo suo, cosi' il cambio attraversa il
mosaico come un'onda invece di scattare tutto insieme.

Una tessera non nasce e non muore mai: e' sempre lo stesso mese, solo in un
posto diverso. E' questo che rende leggibile il passaggio — si vede *dove
va a finire* ogni mese.
"""

import numpy as np


def liscia2(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)


class Disposizione:
    """Una posa del mosaico: dove sta ogni tessera e quanto e' grande."""

    def __init__(self, x, y, w, h, a=None):
        self.x = np.asarray(x, np.float64)
        self.y = np.asarray(y, np.float64)
        self.w = np.asarray(w, np.float64)
        self.h = np.asarray(h, np.float64)
        self.a = np.ones(len(self.x)) if a is None else np.asarray(a, np.float64)

    def __len__(self):
        return len(self.x)


def fondi(d1, d2, t, onda=0.45, ordine=None):
    """Passa da una disposizione all'altra. `ordine` decide chi parte prima:
    se non lo si dice, partono da sinistra verso destra."""
    n = len(d1)
    if ordine is None:
        ordine = np.argsort(d1.x)
    rango = np.empty(n)
    rango[np.asarray(ordine)] = np.linspace(0.0, 1.0, n)
    rit = rango * onda
    k = liscia2((t - rit) / max(1.0 - onda, 1e-6))
    return Disposizione(
        d1.x * (1 - k) + d2.x * k,
        d1.y * (1 - k) + d2.y * k,
        d1.w * (1 - k) + d2.w * k,
        d1.h * (1 - k) + d2.h * k,
        d1.a * (1 - k) + d2.a * k), k


# --- le pose --------------------------------------------------------------
def calendario(box, righe, colonne, presente, lato=0.82):
    """La griglia del calendario: una riga per anno, una colonna per mese."""
    x0, y0, x1, y1 = box
    pw = (x1 - x0) / colonne
    ph = (y1 - y0) / righe
    s = min(pw, ph) * lato
    xs, ys, ws, hs, al = [], [], [], [], []
    for r, c in presente:
        xs.append(x0 + (c + 0.5) * pw)
        ys.append(y0 + (r + 0.5) * ph)
        ws.append(s); hs.append(s); al.append(1.0)
    return Disposizione(xs, ys, ws, hs, al)


def ordinate(box, valori, alt_max=None, larghezza=0.72):
    """Ordinate per valore: diventano un grafico a colonne, dal peggiore al
    migliore. Stessa tessera, altezza proporzionale al mese."""
    x0, y0, x1, y1 = box
    v = np.asarray(valori, np.float64)
    ordine = np.argsort(v)
    n = len(v)
    pw = (x1 - x0) / n
    mx = max(abs(v).max(), 1e-9)
    alt = (y1 - y0) * 0.44 if alt_max is None else alt_max
    yz = (y0 + y1) / 2
    xs = np.zeros(n); ys = np.zeros(n); ws = np.zeros(n); hs = np.zeros(n)
    for posto, i in enumerate(ordine):
        h = abs(v[i]) / mx * alt
        xs[i] = x0 + (posto + 0.5) * pw
        ys[i] = yz - h / 2 if v[i] > 0 else yz + h / 2
        ws[i] = pw * larghezza
        hs[i] = max(h, 2.0)
    return Disposizione(xs, ys, ws, hs), yz


def istogramma(box, valori, passo=2.0, lato=0.86):
    """Impilate per fascia di valore: la distribuzione dei mesi."""
    x0, y0, x1, y1 = box
    v = np.asarray(valori, np.float64)
    fasce = np.round(v / passo).astype(int)
    f_min, f_max = fasce.min(), fasce.max()
    nc = f_max - f_min + 1
    pw = (x1 - x0) / nc
    s = min(pw * lato, 26.0)
    conta = {}
    xs = np.zeros(len(v)); ys = np.zeros(len(v))
    for i in np.argsort(v):
        f = fasce[i]
        k = conta.get(f, 0); conta[f] = k + 1
        xs[i] = x0 + (f - f_min + 0.5) * pw
        ys[i] = y1 - (k + 0.5) * (s + 3)
    return Disposizione(xs, ys, np.full(len(v), s), np.full(len(v), s)), \
           (lambda val: x0 + (round(val / passo) - f_min + 0.5) * pw)


def colonne(box, valori, lato=24.0, gap=3.0, per_colonna=9):
    """Due pile: i mesi in utile e quelli in perdita."""
    x0, y0, x1, y1 = box
    v = np.asarray(valori, np.float64)
    xs = np.zeros(len(v)); ys = np.zeros(len(v))
    centri = (x0 + (x1 - x0) * 0.30, x0 + (x1 - x0) * 0.70)
    conta = [0, 0]
    for i in np.argsort(-v):
        lato_i = 0 if v[i] > 0 else 1
        k = conta[lato_i]; conta[lato_i] += 1
        col = k % per_colonna
        fila = k // per_colonna
        xs[i] = centri[lato_i] + (col - (per_colonna - 1) / 2) * (lato + gap)
        ys[i] = y1 - (fila + 0.5) * (lato + gap)
    return Disposizione(xs, ys, np.full(len(v), lato), np.full(len(v), lato)), \
           centri, conta


def campo(box, n, per_riga, lato=9.0, gap=2.0):
    """Un campo fitto di tessere piccole, per le migliaia di operazioni."""
    x0, y0, x1, y1 = box
    passo = lato + gap
    righe = int(np.ceil(n / per_riga))
    lx = x0 + ((x1 - x0) - per_riga * passo) / 2
    ly = y0 + ((y1 - y0) - righe * passo) / 2
    i = np.arange(n)
    xs = lx + (i % per_riga) * passo
    ys = ly + (i // per_riga) * passo
    return Disposizione(xs, ys, np.full(n, lato), np.full(n, lato))


def in_fila(box, valori, per_riga, lato=9.0, gap=2.0):
    """Le stesse tessere, ma ordinate dalla piu' grande alla piu' piccola."""
    n = len(valori)
    d = campo(box, n, per_riga, lato, gap)
    ordine = np.argsort(-np.asarray(valori, np.float64))
    xs = np.zeros(n); ys = np.zeros(n)
    xs[ordine] = d.x; ys[ordine] = d.y
    return Disposizione(xs, ys, d.w, d.h)


def dipingi(arr, disp, colori, alpha=1.0):
    """Disegna le tessere direttamente nella matrice del fotogramma: con
    qualche migliaio di pezzi passare da PIL uno per uno e' troppo lento."""
    H_, W_ = arr.shape[:2]
    xs = np.round(disp.x).astype(int)
    ys = np.round(disp.y).astype(int)
    s = int(round(float(disp.w[0])))
    if s < 1:
        return arr
    col = np.asarray(colori, np.float32)
    a = np.asarray(disp.a, np.float32)[:, None] * alpha
    for dy in range(s):
        yy = ys + dy
        ok = (yy >= 0) & (yy < H_)
        for dx in range(s):
            xx = xs + dx
            m = ok & (xx >= 0) & (xx < W_)
            if not m.any():
                continue
            arr[yy[m], xx[m]] = (arr[yy[m], xx[m]] * (1 - a[m])
                                 + col[m] * a[m])
    return arr


def dipingi_varie(d, disp, colori, alpha=1.0, raggio=2):
    """Come dipingi, ma con ogni tessera della sua misura. Serve per le
    disposizioni in cui l'altezza porta un significato — nel grafico a
    colonne l'altezza *e'* il rendimento del mese, e schiacciarla a un
    quadrato buttava via il dato."""
    from stile import BG_C
    for i in range(len(disp)):
        a = float(disp.a[i]) * alpha
        if a <= 0.01:
            continue
        w2 = max(float(disp.w[i]), 1.0) / 2
        h2 = max(float(disp.h[i]), 1.0) / 2
        c = tuple(int(round(float(colori[i][k]) * a + BG_C[k] * (1 - a)))
                  for k in range(3))
        x, y = float(disp.x[i]), float(disp.y[i])
        if w2 < 3 or h2 < 3:
            d.rectangle([x - w2, y - h2, x + w2, y + h2], fill=c)
        else:
            d.rounded_rectangle([x - w2, y - h2, x + w2, y + h2],
                                radius=min(raggio, w2 - 1, h2 - 1), fill=c)
