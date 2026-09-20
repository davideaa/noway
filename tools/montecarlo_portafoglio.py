#!/usr/bin/env python3
"""Monte Carlo su un PORTAFOGLIO di piu' strategie, in frazione di conto.

Perche' un modulo a parte e non montecarlo_validazione.py: quello lavora
in multipli di R su una strategia sola. Qui l'unita' e'

    f = netto / saldo_prima        (rendimento in frazione del conto)

che e' l'unica grandezza che si trasferisce identica a un conto
condiviso, e che si puo' sommare fra strategie con rischi diversi.

I due livelli di ricampionamento rispondono a domande diverse:

  'unito'  rimescola il flusso gia' fuso delle due strategie.
           Tiene per caso anche la struttura incrociata (quando l'oro
           perdeva, il nasdaq che faceva?), ma la tiene solo dove i
           blocchi cadono interi: e' una misura conservativa.

  'gambe'  rimescola OGNI GAMBA per conto suo e poi le rifonde in
           ordine di tempo. Rompe apposta l'accoppiamento fra le due:
           risponde a "e se le due strategie si fossero incontrate in
           un altro ordine?". E' il test vero della diversificazione,
           perche' non regala nessuna sincronia fortunata.

E due avvertimenti che cambiano la lettura di tutto.

PRIMO: L'ORDINE NON SPOSTA IL PUNTO D'ARRIVO. Ne' a rischio fisso
(la somma e' la somma) ne' col composto (il prodotto e' il prodotto:
moltiplicare e' commutativo). La permutazione sposta SOLO il drawdown.
Il punto d'arrivo cambia solo quando il ricampionamento cambia anche
la COMPOSIZIONE, cioe' con IID, blocchi e stazionario, che ripescano
con rimpiazzo.

SECONDO, e' il motivo per cui questo file esiste: IL COMPOSTO
MOLTIPLICA L'INCERTEZZA. Sulle stesse 2.520 operazioni, a rischio
fisso la forbice fra il 5o e il 95o percentile e' circa 2 volte; col
composto e' quasi 18 volte. La mediana composta non e' sbagliata:
e' inutile come previsione, perche' il suo intorno copre un ordine di
grandezza. Si pianifica sul rischio fisso; il composto e' il di piu'.
"""
import numpy as np
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from montecarlo_validazione import _genera

PERCENTILI = (5, 10, 25, 50, 75, 90, 95)
METODI = ('permutazione', 'iid', 'blocchi', 'stazionario')


def _valuta(seq, peso, composto, deposito):
    """seq: (m, n) di frazioni. Torna (rendimento %, drawdown %)."""
    if composto:
        eq = deposito * np.cumprod(1.0 + peso * seq, axis=1)
        eq = np.maximum(eq, 1e-9)
    else:
        eq = deposito + deposito * peso * np.cumsum(seq, axis=1)
    eq = np.concatenate([np.full((seq.shape[0], 1), deposito), eq], axis=1)
    pk = np.maximum.accumulate(eq, axis=1)
    dd = 100.0 * ((pk - eq) / pk).max(axis=1)
    return 100.0 * (eq[:, -1] / deposito - 1.0), dd


def simula(gambe, metodo, peso=1.0, composto=False, n_sim=20000,
           L=20, seed=7, deposito=10000.0, blocco=2000, per_gamba=False):
    """gambe: dict {nome: array di frazioni} gia' in ordine di tempo.

    per_gamba=False -> metodo 'unito'  (rimescola il flusso fuso)
    per_gamba=True  -> metodo 'gambe'  (rimescola ogni gamba a parte)
    """
    rng = np.random.default_rng(seed)
    nomi = list(gambe)
    F = np.concatenate([np.asarray(gambe[k], float) for k in nomi])
    n = len(F)
    rend, dd = [], []
    for s in range(0, n_sim, blocco):
        m = min(blocco, n_sim - s)
        if per_gamba:
            # ogni gamba ricampionata da sola, poi affiancate nello
            # stesso ordine temporale medio in cui si presentano
            pezzi = [_genera(metodo, np.asarray(gambe[k], float), m, rng, L)
                     for k in nomi]
            seq = _intreccia(pezzi, [len(gambe[k]) for k in nomi], rng)
        else:
            seq = _genera(metodo, F, m, rng, L)
        a, b = _valuta(seq, peso, composto, deposito)
        rend.append(a); dd.append(b)
    return {'rend': np.concatenate(rend), 'dd_pct': np.concatenate(dd)}


def _intreccia(pezzi, lunghezze, rng):
    """Fonde le gambe ricampionate mantenendo le proporzioni di frequenza.

    Non inventa date: costruisce un ordine di arrivo casuale in cui ogni
    gamba compare tante volte quante ne ha davvero. E' l'equivalente di
    "le stesse due strategie, incontrate in un altro ordine"."""
    m = pezzi[0].shape[0]
    tot = sum(lunghezze)
    etichette = np.concatenate([np.full(l, i) for i, l in enumerate(lunghezze)])
    out = np.empty((m, tot))
    ordine = np.argsort(rng.random((m, tot)), axis=1)
    lab = etichette[ordine]                       # (m, tot) chi arriva quando
    for i, _ in enumerate(pezzi):
        mask = (lab == i)
        # le posizioni di questa gamba, riempite nel suo ordine ricampionato
        out[mask] = pezzi[i].ravel()
    return out


def tabella(res, chiave, perc=PERCENTILI):
    return {p: float(np.percentile(res[chiave], p)) for p in perc}
