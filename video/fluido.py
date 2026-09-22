#!/usr/bin/env python3
"""
La macchina del movimento.

Il difetto delle versioni prima era che ogni cosa *compariva*: alpha da 0 a
1 e poi ferma. Qui non compare niente — si trasforma. Quattro meccanismi:

1. `Vista`  — la finestra sul grafico si allarga da sola mentre la curva
   cresce, come in un terminale dal vivo. Siccome la x occupa sempre tutta
   la larghezza e la y segue il minimo e il massimo di quello che e' gia'
   disegnato, ogni pixel della curva si muove a ogni fotogramma: la parte
   vecchia si comprime a sinistra mentre la punta avanza. E' questo che da'
   la sensazione di fluidita', non le dissolvenze.

2. `morph`  — due serie della stessa lunghezza si fondono con un ritardo che
   cresce lungo la serie, cosi' il cambio attraversa la curva come un'onda
   invece di scattare tutto insieme.

3. `Camera` — una sola inquadratura per tutto il video, che scorre e zooma
   fra un atto e l'altro. Non si azzera mai: quando un atto finisce, la
   cornice e' gia' in viaggio verso quella dopo.

4. `scia`   — accumula un pezzo del fotogramma precedente, cosi' quello che
   si muove veloce lascia una traccia invece di sfarfallare.
"""

import numpy as np


# --- addolcimenti ---------------------------------------------------------
def liscia(t):
    """smoothstep: parte piano, finisce piano, in mezzo corre."""
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def liscia2(t):
    """smootherstep: ancora piu' morbida agli estremi."""
    t = np.clip(t, 0.0, 1.0)
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)


def finestra(t, a, b, salita=0.18, discesa=0.18):
    """Quanto e' 'presente' un elemento fra a e b, con entrata e uscita
    morbide. Serve per far vivere le cose senza farle lampeggiare."""
    if t <= a or t >= b:
        return 0.0
    return float(min(liscia((t - a) / max(salita, 1e-6)),
                     liscia((b - t) / max(discesa, 1e-6))))


# --- 1. la finestra che si allarga da sola --------------------------------
class Vista:
    """Segue la punta della curva. Il minimo e il massimo sono cumulativi,
    quindi crescono senza scatti e la finestra non trema mai."""

    def __init__(self, serie, margine=0.10, base=None):
        v = np.asarray(serie, np.float64)
        self.v = v
        self.lo = np.minimum.accumulate(v) if base is None else np.full(len(v), base)
        self.hi = np.maximum.accumulate(v)
        self.margine = margine

    def limiti(self, n):
        n = max(int(n), 2)
        lo, hi = float(self.lo[n - 1]), float(self.hi[n - 1])
        if hi - lo < 1e-9:
            hi = lo + 1e-9
        m = (hi - lo) * self.margine
        return lo - m, hi + m

    def punti(self, n, box, lisciatura=0.0):
        """I punti a schermo. La x occupa sempre tutta la larghezza: e' per
        questo che la curva si comprime mentre avanza."""
        n = max(int(n), 2)
        x0, y0, x1, y1 = box
        lo, hi = self.limiti(n)
        v = self.v[:n]
        xs = x0 + np.arange(n) / (n - 1) * (x1 - x0)
        ys = y1 - (v - lo) / (hi - lo) * (y1 - y0)
        return list(zip(xs.tolist(), ys.tolist())), (lo, hi)

    def y_di(self, valore, n, box):
        lo, hi = self.limiti(n)
        return box[3] - (valore - lo) / (hi - lo) * (box[3] - box[1])


# --- 2. la fusione a onda -------------------------------------------------
def morph(a, b, t, onda=0.40):
    """Fonde due serie con un ritardo che cresce lungo la serie: il cambio
    parte da sinistra e attraversa la curva. `onda` e' quanto ritardo c'e'
    fra il primo punto e l'ultimo, in frazione del tempo totale."""
    a = np.asarray(a, np.float64)
    b = np.asarray(b, np.float64)
    n = len(a)
    rit = np.linspace(0.0, onda, n)
    tt = liscia2((t - rit) / max(1.0 - onda, 1e-6))
    return a * (1.0 - tt) + b * tt


def normalizza(v):
    """Porta una serie in 0..1, per poterla fondere con un'altra di scala
    completamente diversa."""
    v = np.asarray(v, np.float64)
    lo, hi = float(v.min()), float(v.max())
    return (v - lo) / (hi - lo if hi - lo > 1e-12 else 1.0)


# --- 3. la cornice che non si azzera mai ----------------------------------
class Camera:
    """Una sola inquadratura per tutto il video. Si passa la lista delle
    tappe (istante, riquadro) e lei sta sempre in viaggio fra due tappe."""

    def __init__(self, tappe):
        self.t = [x[0] for x in tappe]
        self.b = [np.array(x[1], np.float64) for x in tappe]

    def box(self, t):
        if t <= self.t[0]:
            return tuple(self.b[0])
        if t >= self.t[-1]:
            return tuple(self.b[-1])
        i = int(np.searchsorted(self.t, t) - 1)
        i = max(0, min(i, len(self.t) - 2))
        f = (t - self.t[i]) / (self.t[i + 1] - self.t[i])
        k = liscia2(f)
        return tuple(self.b[i] * (1 - k) + self.b[i + 1] * k)


# --- 4. la scia -----------------------------------------------------------
class Scia:
    """Tiene un pezzo del fotogramma prima. Quello che corre lascia una
    traccia invece di saltare da una posizione all'altra."""

    def __init__(self, quanto=0.0):
        self.quanto = quanto
        self.prec = None

    def applica(self, arr, quanto=None):
        q = self.quanto if quanto is None else quanto
        if self.prec is not None and q > 0.01:
            arr = np.maximum(arr, self.prec * q)
        self.prec = arr.copy()
        return arr
