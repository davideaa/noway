#!/usr/bin/env python3
"""Monte Carlo a RISCHIO FISSO, con piu' metodi di ricampionamento.

Un punto che cambia la lettura di tutto e va detto subito:

  A RISCHIO FISSO IL RISULTATO FINALE NON DIPENDE DALL'ORDINE.
  L'utile e' 100 x somma(R): rimescolare le stesse operazioni sposta il
  percorso e il drawdown, ma il punto d'arrivo resta identico.

Quindi i metodi rispondono a domande diverse e non sono intercambiabili:

  permutazione        stesse operazioni, ordine diverso
                      -> SOLO il drawdown. Il finale e' una costante.
                         E' il test di sensibilita' all'ordine.
  bootstrap IID       ripescate con rimpiazzo, indipendenti
                      -> finale e drawdown. Spezza pero' le serie di
                         perdite consecutive: sottostima il drawdown.
  blocchi mobili      ripescati a blocchi contigui di L
                      -> tiene le serie. E' quello a cui credere.
  blocchi stazionari  come sopra, ma la lunghezza del blocco e'
                      casuale (geometrica, media L): non privilegia
                      nessuna lunghezza particolare.
  per regime          blocchi ripescati dentro la stessa fascia di
                      mercato, mantenendone le proporzioni
                      -> e se il mix di regimi restasse quello visto?

Verso dei percentili, da non confondere:
  UTILE     -> percentili BASSI = scenari PEGGIORI
  DRAWDOWN  -> percentili ALTI  = scenari PEGGIORI
"""
import numpy as np

def _dd_e_finale(seq, deposito, per_R):
    """seq: (m, n) di R. Torna (R finale, DD%, DD in R, striscia perdente)."""
    c = np.cumsum(seq, axis=1)
    picco = np.maximum.accumulate(c, axis=1)
    dd_R = (picco - c).max(axis=1)
    eq = deposito + per_R * c
    peq = np.maximum.accumulate(eq, axis=1)
    dd_pct = 100.0 * ((peq - eq) / peq).max(axis=1)
    perdente = (seq <= 0).astype(np.int16)
    # lunghezza massima di perdite consecutive, riga per riga
    mx = np.zeros(seq.shape[0], dtype=np.int32)
    cur = np.zeros(seq.shape[0], dtype=np.int32)
    for j in range(seq.shape[1]):
        cur = (cur + perdente[:, j]) * perdente[:, j]
        mx = np.maximum(mx, cur)
    return c[:, -1], dd_pct, dd_R, mx

def _genera(metodo, R, m, rng, L=20, strati=None):
    n = len(R)
    if metodo == 'permutazione':
        idx = np.argsort(rng.random((m, n)), axis=1)
        return R[idx]
    if metodo == 'iid':
        return R[rng.integers(0, n, size=(m, n))]
    if metodo == 'blocchi':
        nb = int(np.ceil(n / L))
        p = rng.integers(0, n, size=(m, nb))
        return R[(p[:, :, None] + np.arange(L)[None, None, :]) % n].reshape(m, -1)[:, :n]
    if metodo == 'stazionario':
        # lunghezze geometriche di media L: nessuna lunghezza privilegiata
        out = np.empty((m, n))
        for i in range(m):
            v, pos = [], 0
            while pos < n:
                s = rng.integers(0, n)
                ln = max(1, int(rng.geometric(1.0 / L)))
                v.append(R[(s + np.arange(ln)) % n]); pos += ln
            out[i] = np.concatenate(v)[:n]
        return out
    if metodo == 'regime':
        # blocchi ripescati dentro lo stesso strato, proporzioni intatte
        out = np.empty((m, n))
        for i in range(m):
            v = []
            for idx in strati:
                k = len(idx)
                if k == 0: continue
                a = R[idx]
                ll = min(L, k)
                nb = int(np.ceil(k / ll))
                p = rng.integers(0, k, size=nb)
                b = a[(p[:, None] + np.arange(ll)[None, :]) % k].reshape(-1)[:k]
                v.append(b)
            seq = np.concatenate(v) if v else R.copy()
            if len(seq) < n:      # gli strati non coprono tutto: completa a caso
                seq = np.concatenate([seq, R[rng.integers(0, n, size=n-len(seq))]])
            out[i] = seq[:n]
        return out
    raise ValueError(metodo)

def simula(R, metodo, n_sim=20000, L=20, seed=7, deposito=10000.0,
           rischio_fisso=0.01, strati=None, blocco=2000):
    """Torna un dizionario di array lunghi n_sim."""
    R = np.asarray(R, float)
    per_R = rischio_fisso * deposito
    rng = np.random.default_rng(seed)
    fin, ddp, ddr, str_ = [], [], [], []
    for s in range(0, n_sim, blocco):
        m = min(blocco, n_sim - s)
        seq = _genera(metodo, R, m, rng, L, strati)
        a, b, c, d = _dd_e_finale(seq, deposito, per_R)
        fin.append(a); ddp.append(b); ddr.append(c); str_.append(d)
    Rf = np.concatenate(fin)
    return {'R_finale': Rf,
            'utile': per_R * Rf,
            'rend': 100.0 * per_R * Rf / deposito,
            'dd_pct': np.concatenate(ddp),
            'dd_R': np.concatenate(ddr),
            'striscia': np.concatenate(str_)}

PERCENTILI = (5, 10, 25, 50, 75, 90, 95)

def tabella(res, chiave, perc=PERCENTILI):
    return {p: float(np.percentile(res[chiave], p)) for p in perc}

def percorsi(R, metodo, n_sim=2000, L=20, seed=11, deposito=10000.0,
             rischio_fisso=0.01, punti=120):
    """Fascia di percentili della curva, piu' alcuni percorsi veri.
    Serve a disegnare bande leggibili invece di mille righe sovrapposte."""
    R = np.asarray(R, float); n = len(R)
    per_R = rischio_fisso * deposito
    rng = np.random.default_rng(seed)
    seq = _genera(metodo, R, n_sim, rng, L, None)
    eq = deposito + per_R * np.cumsum(seq, axis=1)
    cp = np.linspace(0, n-1, punti).astype(int)
    E = eq[:, cp]
    band = {p: np.percentile(E, p, axis=0) for p in (5, 25, 50, 75, 95)}
    fin = E[:, -1]
    ex = [int(np.argsort(fin)[int(q*(n_sim-1))]) for q in (0.05, 0.50, 0.95)]
    return cp, band, E[ex]
