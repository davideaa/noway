#!/usr/bin/env python3
"""Due strategie su UN conto solo: la storia vera e il Monte Carlo.

Perche' esiste accanto a montecarlo_portafoglio.py: quello e' lo
strumento con cui e' stata presa la decisione sul rischio, questo e'
il controllo indipendente che quella decisione reggesse. Stessa
domanda, codice scritto a parte apposta. Se i due divergono, si
guarda quale ha ragione — non si sceglie il piu' comodo.

UNITA' DI CONTO
    f = netto / saldo_prima      (frazione di conto resa dall'operazione)

E' l'unica grandezza che si trasferisce a un conto condiviso: il
rischio e' gia' una percentuale dell'equity del momento, quindi f non
dipende dal saldo su cui e' girato il backtest. Le operazioni si
fondono in ordine di CHIUSURA, che e' quando il P&L tocca il saldo.

I DUE RICAMPIONAMENTI, che rispondono a domande diverse
    'unito'  rimescola il flusso gia' fuso. Dove i blocchi cadono
             interi tiene anche la struttura incrociata (quando l'oro
             perdeva, il nasdaq che faceva?). E' la misura PRUDENTE.
    'gambe'  rimescola ogni gamba per conto suo e poi le rifonde.
             Rompe apposta l'accoppiamento: e' il test della
             diversificazione, ed e' la misura OTTIMISTA.
    Il tetto sul drawdown va letto su 'unito', non su 'gambe'.

AVVERTENZA CHE CAMBIA LA LETTURA
    Il drawdown qui e' sul BILANCIO, cioe' sulle operazioni chiuse.
    MT5 misura anche quello sull'EQUITY, che include il flottante
    delle posizioni aperte ed e' sempre piu' alto (sull'oro 19,2%
    contro 17,0%). Il drawdown vero vissuto sul conto e' quello di
    equity: questi numeri sono un pavimento, non un soffitto.

Uso:
    python3 tools/fusione_conto_unico.py \
        dati/oro_puprime_065.html.gz:0.65 \
        dati/nasdaq_puprime_098.html.gz:0.98
"""
import sys, os
from collections import defaultdict

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dati_validazione import leggi

DEPOSITO = 10000.0
BLOCCO   = 20           # blocchi da 20: non spezza le serie di perdite
N_SIM    = 10000
CONFINE  = '2023.12.31'  # fine dello scenario prudente, gia' fissato nel progetto


def _anni(a, b):
    ya, ma, da = (int(x) for x in a[:10].split('.'))
    yb, mb, db = (int(x) for x in b[:10].split('.'))
    return ((yb - ya) * 372 + (mb - ma) * 31 + (db - da)) / 372.0


def carica(path, rischio_pct):
    """Operazioni come (chiusura, frazione di conto). Il totale va
    confrontato col report: `residui` deve essere 0."""
    ops, ambigui, residui = leggi(path, rischio_pct / 100.0)
    if residui:
        raise SystemExit('%s: %d aperture senza chiusura' % (path, residui))
    return [(o.chiusura, o.netto / (o.saldo - o.netto)) for o in ops], ambigui


def curva(f, deposito=DEPOSITO):
    """Equity composta e drawdown massimo in percentuale."""
    eq = np.concatenate([[deposito], deposito * np.cumprod(1.0 + np.asarray(f))])
    picco = np.maximum.accumulate(eq)
    return eq, 100.0 * ((picco - eq) / picco).max()


def _blocchi(pool, m, n_out, L, rng):
    n = len(pool)
    k = int(np.ceil(n_out / L))
    idx = rng.integers(0, n - L + 1, size=(m, k))
    pezzi = [pool[idx[:, j][:, None] + np.arange(L)] for j in range(k)]
    return np.concatenate(pezzi, axis=1)[:, :n_out]


def monte_carlo(n_out, pool=None, gambe=None, n_sim=N_SIM, L=BLOCCO,
                seed=7, deposito=DEPOSITO, lotto=2000):
    """pool  -> metodo 'unito'.  gambe [(pool, quota), ...] -> 'gambe'."""
    rng = np.random.default_rng(seed)
    rend, dd = [], []
    for s in range(0, n_sim, lotto):
        m = min(lotto, n_sim - s)
        if gambe is None:
            seq = _blocchi(pool, m, n_out, L, rng)
        else:
            pezzi = [_blocchi(p, m, int(round(n_out * q)), L, rng) for p, q in gambe]
            lung = [p.shape[1] for p in pezzi]
            et = np.concatenate([np.full(l, i) for i, l in enumerate(lung)])
            lab = et[np.argsort(rng.random((m, sum(lung))), axis=1)]
            seq = np.empty((m, sum(lung)))
            for i, pz in enumerate(pezzi):
                seq[lab == i] = pz.ravel()
        eq = deposito * np.cumprod(1.0 + seq, axis=1)
        eq = np.concatenate([np.full((m, 1), deposito), eq], axis=1)
        picco = np.maximum.accumulate(eq, axis=1)
        dd.append(100.0 * ((picco - eq) / picco).max(axis=1))
        rend.append(100.0 * (eq[:, -1] / deposito - 1.0))
    return np.concatenate(rend), np.concatenate(dd)


def main(argv):
    if len(argv) < 2:
        raise SystemExit(__doc__)
    nomi, flussi = [], {}
    for a in argv:
        path, _, pct = a.partition(':')
        nome = os.path.basename(path).split('_')[0]
        ops, ambigui = carica(path, float(pct or 1.0))
        nomi.append(nome)
        flussi[nome] = ops
        print('%-10s %5d operazioni  %s -> %s  (ambigui %d)'
              % (nome, len(ops), ops[0][0][:10], ops[-1][0][:10], ambigui))

    fusi = sorted((t, f, n) for n in nomi for t, f in flussi[n])
    F    = np.array([f for _, f, _ in fusi])
    CHI  = np.array([n for _, _, n in fusi])
    durata = _anni(fusi[0][0], fusi[-1][0])

    print('\n' + '=' * 70)
    print('LA STORIA VERA — %d operazioni su un conto da %.0f, %.2f anni'
          % (len(F), DEPOSITO, durata))
    print('=' * 70)
    eq, dd = curva(F)
    print('saldo finale %10.0f    rendimento %+7.0f%%    CAGR %5.1f%%    DD %5.1f%%'
          % (eq[-1], 100 * (eq[-1] / DEPOSITO - 1),
             100 * ((eq[-1] / DEPOSITO) ** (1 / durata) - 1), dd))
    for n in nomi:
        e, d = curva(F[CHI == n])
        print('  solo %-8s        rendimento %+7.0f%%                   DD %5.1f%%'
              % (n, 100 * (e[-1] / DEPOSITO - 1), d))

    if len(nomi) == 2:
        mesi = defaultdict(lambda: defaultdict(float))
        for t, f, n in fusi:
            mesi[t[:7]][n] += f
        M = np.array([[m[n] for n in nomi] for _, m in sorted(mesi.items())])
        print('\ncorrelazione mensile %s/%s  %+.3f  (su %d mesi) — vicino a zero = '
              'diversificazione vera' % (nomi[0], nomi[1],
                                         np.corrcoef(M[:, 0], M[:, 1])[0, 1], len(M)))

    # scenario prudente: il tratto senza il boom, allungato allo stesso orizzonte.
    # Senza l'allungamento sembrerebbe falsamente tranquillo: meno anni vuol dire
    # meno occasioni di incolonnare le perdite.
    mag = [(t, f, n) for t, f, n in fusi if t[:10] <= CONFINE]
    fatt = durata / _anni(fusi[0][0], CONFINE)
    n_mag = int(round(len(mag) * fatt))

    print('\n' + '=' * 70)
    print('MONTE CARLO — %d storie, blocchi da %d, composto' % (N_SIM, BLOCCO))
    print('scenario MAGRO = fino al %s, allungato x%.3f -> %d operazioni'
          % (CONFINE, fatt, n_mag))
    print('=' * 70)
    print('%-16s %10s %10s %10s  | %7s %7s %7s'
          % ('', 'rend 25%', 'MEDIANA', 'rend 75%', 'DD 90%', 'DD 95%', 'DD 99%'))
    print('-' * 70)
    for etichetta, sorgente, n_out in (('TUTTO', fusi, len(F)), ('MAGRO', mag, n_mag)):
        tot = len(sorgente)
        per_gamba = [(np.array([f for _, f, k in sorgente if k == n]),
                      sum(1 for _, _, k in sorgente if k == n) / tot) for n in nomi]
        for metodo, kw in (('unito', dict(pool=np.array([f for _, f, _ in sorgente]))),
                           ('gambe', dict(gambe=per_gamba))):
            r, d = monte_carlo(n_out, **kw)
            print('%-6s %-9s %+9.0f%% %+9.0f%% %+9.0f%%  | %6.1f%% %6.1f%% %6.1f%%'
                  % (etichetta, metodo, *(np.percentile(r, p) for p in (25, 50, 75)),
                     *(np.percentile(d, p) for p in (90, 95, 99))))
    print('\nIl tetto sul drawdown si legge sulla riga MAGRO/unito: e\' la piu\' prudente.')


if __name__ == '__main__':
    main(sys.argv[1:])
