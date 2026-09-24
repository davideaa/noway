#!/usr/bin/env python3
"""ANALISI DEI REGIMI: misurare il mercato PRIMA della strategia.

Serve a rispondere a "perche' ha funzionato, quando funziona, quando
soffre", con numeri e non con l'occhio sul grafico.

DA DOVE VENGONO I DATI, e cosa NON si puo' fare con questi.

Le fonti di mercato esterne sono bloccate dalla policy di rete di
questo ambiente (Yahoo risponde 403 al proxy). L'unica serie di prezzo
disponibile e' quella ricostruita dai prezzi di ingresso e uscita delle
operazioni dei report MT5. Questo comporta tre limiti, dichiarati qui e
ripetuti nelle conclusioni:

1. NIENTE DATI PRIMA DEL 2019. La domanda "le condizioni favorevoli
   esistevano anche negli anni precedenti?" NON e' rispondibile. Si puo'
   solo confrontare 2019-2023 con 2024-2026 dentro il campione.

2. NIENTE OHLC. Senza massimi e minimi veri non si calcolano ATR
   classico, ADX, gap. Al loro posto si usano misure su chiusure, che
   catturano la stessa informazione (volatilita' realizzata al posto
   dell'ATR, efficiency ratio al posto dell'ADX) senza fingere di
   essere quello che non sono.

3. COPERTURA PARZIALE dei giorni: oro 63%, nasdaq 89%. I giorni con un
   prezzo sono quelli in cui la strategia ha operato, quindi la serie e'
   condizionata all'attivita' della strategia. Per questo le
   caratteristiche NON vengono misurate su una griglia di calendario ma
   in una finestra di calendario che precede ogni ingresso: cosi' la
   domanda diventa "com'era il mercato nei tre mesi prima di questa
   operazione", che e' esattamente quello che serve sapere e che non
   soffre dei buchi.

NIENTE SGUARDO IN AVANTI: ogni caratteristica di un'operazione usa
solo prezzi con data STRETTAMENTE PRECEDENTE alla sua apertura.
"""
import sys, os
import numpy as np
from collections import defaultdict
from datetime import date, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dati_validazione import leggi

FINESTRA_L = 90      # giorni: la finestra "lenta" (un trimestre)
FINESTRA_B = 21      # giorni: la finestra "breve" (un mese)
FINESTRA_DD = 252    # giorni: per il drawdown dell'asset (un anno)
MIN_PUNTI = 25       # meno di cosi' e la finestra non dice niente
CONFINE = '2024.01.01'


def _d(s):
    return date(int(s[:4]), int(s[5:7]), int(s[8:10]))


def carica(percorso, rischio):
    """Operazioni + serie di prezzo giornaliera ricostruita."""
    ops, _, _ = leggi(percorso, rischio_test=rischio)
    g = defaultdict(list)
    for o in ops:
        if o.prezzo_in > 0:  g[o.apertura[:10]].append(o.prezzo_in)
        if o.prezzo_out > 0: g[o.chiusura[:10]].append(o.prezzo_out)
    gg = sorted(g)
    px = np.array([float(np.median(g[k])) for k in gg])
    dt = np.array([_d(k) for k in gg])
    T = []
    for o in ops:
        p = o.saldo - o.netto
        if p <= 0: continue
        f = o.netto / p
        T.append({'apre': o.apertura[:10], 'chiude': o.chiusura[:10],
                  'f': f, 'R': f/rischio, 'tipo': o.tipo,
                  'prezzo_in': o.prezzo_in, 'anno': o.chiusura[:4],
                  'ore': _ore(o)})
    return {'op': T, 'dt': dt, 'px': px, 'rischio': rischio}


def _ore(o):
    from datetime import datetime
    try:
        a = datetime.strptime(o.apertura[:16], '%Y.%m.%d %H:%M')
        b = datetime.strptime(o.chiusura[:16], '%Y.%m.%d %H:%M')
        return (b - a).total_seconds()/3600
    except Exception:
        return float('nan')


def _finestra(dt, px, fino, giorni):
    """I prezzi nei 'giorni' che precedono STRETTAMENTE la data 'fino'."""
    da = fino - timedelta(days=giorni)
    m = (dt >= da) & (dt < fino)
    return px[m]


def caratteristiche(C):
    """Le misure di mercato al momento di ogni ingresso.

    Scelte con un criterio: una misura per ogni famiglia di informazione
    (quanto si muove, quanto dritto va, dove sta, come sono fatte le
    code), invece di venti indicatori che dicono la stessa cosa. La
    ridondanza che resta viene poi misurata e dichiarata, non nascosta.
    """
    dt, px = C['dt'], C['px']
    out = []
    for t in C['op']:
        d = _d(t['apre'])
        pl = _finestra(dt, px, d, FINESTRA_L)
        pb = _finestra(dt, px, d, FINESTRA_B)
        pa = _finestra(dt, px, d, FINESTRA_DD)
        if len(pl) < MIN_PUNTI or len(pb) < 5:
            out.append(None); continue
        rl = np.diff(np.log(pl))
        n_anno = len(pl) / (FINESTRA_L/365.25)      # punti per anno
        vol = rl.std(ddof=1) * np.sqrt(n_anno)
        lordo = np.abs(np.diff(pl)).sum()
        er = abs(pl[-1] - pl[0]) / lordo if lordo > 0 else 0.0
        sd = rl.std(ddof=1)
        out.append({
            'vol':    vol,                                   # quanto si muove
            'er':     er,                                    # quanto va dritto
            'mom':    pl[-1]/pl[0] - 1,                      # dove sta andando (trimestre)
            'mom_b':  pb[-1]/pb[0] - 1,                      # dove sta andando (mese)
            'dist_ma': pl[-1]/pl.mean() - 1,                 # quanto e' lontano dalla media
            'dd_asset': pa[-1]/pa.max() - 1 if len(pa) else 0.0,   # quanto e' sotto il massimo
            'ac1':    _ac(rl, 1),                            # memoria del segno
            'skew':   _skew(rl),                             # asimmetria
            'kurt':   _kurt(rl),                             # code
            'ampiezza': np.abs(rl).mean(),                   # movimento tipico
            'grandi': float((np.abs(rl) > 2*sd).mean()),     # quanto spesso strappa
            'pos_range': (pl[-1]-pl.min())/(pl.max()-pl.min()) if pl.max() > pl.min() else .5,
        })
    return out


def _ac(x, k):
    if len(x) <= k + 2: return 0.0
    a, b = x[:-k], x[k:]
    if a.std() == 0 or b.std() == 0: return 0.0
    return float(np.corrcoef(a, b)[0, 1])


def _skew(x):
    s = x.std(ddof=1)
    return float(((x - x.mean())**3).mean()/s**3) if s > 0 else 0.0


def _kurt(x):
    s = x.std(ddof=1)
    return float(((x - x.mean())**4).mean()/s**4 - 3) if s > 0 else 0.0


NOMI = {'vol': 'volatilita\' (annua)', 'er': 'efficiency ratio',
        'mom': 'momentum 90g', 'mom_b': 'momentum 21g',
        'dist_ma': 'distanza dalla media', 'dd_asset': 'drawdown dell\'asset',
        'ac1': 'autocorrelazione', 'skew': 'asimmetria', 'kurt': 'curtosi',
        'ampiezza': 'movimento tipico', 'grandi': 'frequenza strappi',
        'pos_range': 'posizione nel range'}
CHIAVI = list(NOMI)


def tabella_op(C, F):
    """Solo le operazioni con caratteristiche calcolabili."""
    return [(t, f) for t, f in zip(C['op'], F) if f is not None]


# ------------------------------------------------------- statistiche
def stat(R):
    """Le misure di performance di un gruppo di operazioni, in R."""
    R = np.asarray(R, float)
    n = len(R)
    if n == 0:
        return {'n': 0}
    v = R[R > 0]; p = R[R <= 0]
    lordo_v = v.sum(); lordo_p = -p.sum()
    pk = np.maximum.accumulate(np.cumsum(R))
    dd = (pk - np.cumsum(R)).max() if n else 0.0
    # striscia perdente piu' lunga
    mx = cur = 0
    for x in R:
        cur = cur + 1 if x <= 0 else 0
        mx = max(mx, cur)
    return {'n': n, 'tot': float(R.sum()), 'exp': float(R.mean()),
            'pf': float(lordo_v/lordo_p) if lordo_p > 0 else float('inf'),
            'wr': float(100*len(v)/n),
            'avg_v': float(v.mean()) if len(v) else 0.0,
            'avg_p': float(p.mean()) if len(p) else 0.0,
            'payoff': float(v.mean()/-p.mean()) if len(p) and p.mean() < 0 else float('inf'),
            'dd': float(dd), 'striscia': mx,
            't': float(R.mean()/(R.std(ddof=1)/np.sqrt(n))) if n > 2 and R.std(ddof=1) > 0 else 0.0}
