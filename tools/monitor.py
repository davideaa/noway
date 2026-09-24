#!/usr/bin/env python3
"""Monitoraggio live: la strategia si comporta ancora come nel backtest?

LA DOMANDA A CUI RISPONDE, e quella a cui NON risponde.

Risponde a: «il live e' ancora COMPATIBILE con l'edge misurato?». Cioe':
se l'edge fosse intatto, quanto sarebbe raro vedere quello che sto
vedendo? Se e' molto raro, qualcosa e' cambiato.

NON risponde a: «funziona?». Per CONFERMARE un edge dal live servono
molte operazioni — la Minimum Track Record Length di Bailey e López de
Prado, che su questo portafoglio vale circa 450 operazioni al 95%,
cioe' ~15 mesi. Prima di allora il live puo' solo dire «non si e'
rotto», mai «funziona».

L'asimmetria e' voluta: un edge MORTO si vede molto prima di uno VIVO,
perche' un crollo fuori dal cono e' raro, mentre un guadagno dentro il
cono e' compatibile anche col caso.

TRE CONTROLLI, calibrati sul riferimento con bootstrap a blocchi da 20:

  1. CONO    il risultato cumulato in R, contro la fascia di 10.000
             percorsi simulati con lo stesso numero di operazioni.
             Coglie il crollo.
  2. CADUTA  il drawdown massimo in R finora, contro la distribuzione
             dei drawdown simulati allo stesso punto.
             Coglie la serie di perdite anomala.
  3. CUSUM   somma cumulata delle deviazioni dalla media attesa (Page,
             1954; Philips per i portafogli). Si accorge di un calo
             LENTO che nessuno dei due controlli sopra vede, perche'
             ogni singolo tratto resta dentro il cono.

LA REGOLA, e il suo prezzo.

  VERDE   tutto dentro
  GIALLO  cono sotto il 10° percentile, o caduta sopra il 90°. Avviso.
  ROSSO   uno dei tre controlli oltre la sua soglia. Le tre soglie NON
          sono scelte a occhio: `calibra()` le ricava INSIEME, simulando
          un edge intatto, perche' il ROSSO complessivo scatti per
          sbaglio solo nel 5% dei casi su tutto l'orizzonte. Scelte a mano
          (2,5° / 99° / CUSUM al 5%) davano il 15%, e sul 2024-2026 — il
          periodo migliore di sempre — sarebbero andate ROSSO dopo 50
          operazioni.

  QUELLO CHE NON SA FARE, misurato con `ritardo()`:
    strategia rotta (perde quanto guadagnava)   presa nell'88%, ~200 operazioni
    edge morto (media a zero)                   presa nel 41%,  ~275 operazioni
    edge dimezzato                              presa nel 18%
  Un calo lento non si vede prima di un anno. Non e' un difetto dello
  strumento: e' lo stesso limite della Minimum Track Record Length, con
  uno Sharpe di 0,07 per operazione. Nessun monitor fa meglio.

  Il GIALLO nei primi mesi e' NORMALE: sul 2024-2026 e' rimasto giallo
  per 175 operazioni prima di diventare il periodo migliore. Non si
  spegne niente sul giallo.

  Il ROSSO non spegne niente da solo. Vuol dire: si ferma e si guarda.
  Cosa fare dopo un ROSSO si decide PRIMA di andare live (regola 1).

IL CONTROLLO VELOCE NON E' QUESTO. I guasti di esecuzione (broker,
slittamenti, un bug dopo un riavvio) si vedono in giorni, non in mesi:
si rigira il backtest sugli stessi giorni del live e si confrontano le
operazioni una per una, coi cinque criteri del test sui broker. Quello
va fatto ogni mese dal primo giorno; questo monitor serve per l'edge.

Uso — funziona con QUALUNQUE strategia: tutto si ricava dal suo backtest.

    # calibrazione e prova: quanto sbaglia, quanto e' lento, e il periodo
    # dopo --fino rigiocato come se fosse il live
    python3 tools/monitor.py --rif backtest.html:0.65 --fino=2023.12.31

    # controllo del live vero contro il suo backtest
    python3 tools/monitor.py --rif backtest.html:0.65 --live live.html:0.65

    Piu' file dopo --rif (o --live) si fondono in ordine di tempo: un
    portafoglio si monitora come un'unica serie. Il numero dopo i due
    punti e' il rischio % con cui e' girato il report.
"""
import sys, os, math
import statistics as st

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dati_validazione import leggi

BLOCCO   = 20
N_SIM    = 10000
SEED     = 7

# L'UNICA scelta di questo file, dichiarata prima di vedere il live: con
# l'edge INTATTO il ROSSO deve scattare per sbaglio al massimo in questa
# frazione dei casi, lungo tutto l'orizzonte e contando i tre controlli
# insieme. E' la stessa scelta del «5%» di qualunque test statistico.
# Tutto il resto si ricava dalla strategia stessa:
#   - le tre soglie del rosso: calibrate da `calibra()`
#   - l'orizzonte: la Minimum Track Record Length della strategia, cioe'
#     quante operazioni le servono per dimostrare l'edge al 95%
#   - il controllo si fa a OGNI operazione: il CUSUM e il cono sono
#     nati per il controllo continuo, e le soglie sono calibrate per
#     quello, quindi guardare spesso non aumenta i falsi allarmi.
#     (La prima versione controllava ogni 25 operazioni: un numero
#     scelto da me a occhio, e non c'era motivo.)
FALSO_ALLARME = 0.05
GIALLO_CONO, GIALLO_CAD = 10.0, 90.0      # il giallo e' un avviso, non si calibra
PASSO = 1
ORIZZ_MIN, ORIZZ_MAX = 100, 2000          # sotto: troppo poco; sopra: anni di live


def orizzonte(rif, conf_z=1.6449):
    """Minimum Track Record Length (Bailey, Lopez de Prado), in operazioni.

    Quante operazioni servono per dire al 95% che la media non e' zero,
    tenendo conto di asimmetria e code. E' anche l'orizzonte naturale del
    monitor: prima di li' il live non puo' confermare niente."""
    x = np.asarray(rif, float); m = x.mean(); sd = x.std(ddof=1)
    sk = ((x - m) ** 3).mean() / sd ** 3; ku = ((x - m) ** 4).mean() / sd ** 4
    sr = m / sd
    if sr <= 0:
        raise SystemExit('il riferimento non ha edge (media %.4f): niente da monitorare' % m)
    n = 1 + (1 - sk * sr + (ku - 1) / 4 * sr ** 2) * (conf_z / sr) ** 2
    return int(min(ORIZZ_MAX, max(ORIZZ_MIN, math.ceil(n))))


def _blocchi(pool, m, n, rng, L=BLOCCO):
    pool = np.asarray(pool, float)
    k = int(np.ceil(n / L))
    idx = rng.integers(0, len(pool) - L + 1, size=(m, k))
    return np.concatenate([pool[idx[:, j][:, None] + np.arange(L)] for j in range(k)],
                          axis=1)[:, :n]


def _cusum(seq, mu0, sd):
    """CUSUM a una coda per un calo della media da mu0 a zero.

    Incremento: di quanto l'operazione e' andata sotto la meta' strada
    fra la media attesa e lo zero, misurato in unita' di varianza. Se
    l'edge e' intatto la somma resta vicino a zero; se e' morto sale."""
    k = mu0 / 2.0
    s = np.zeros(seq.shape[0]); out = np.empty_like(seq)
    for j in range(seq.shape[1]):
        s = np.maximum(0.0, s + (mu0 / sd ** 2) * (k - seq[:, j]))
        out[:, j] = s
    return out


def calibra(rif, n=None, n_sim=N_SIM, seed=SEED):
    """Cono, cadute e soglie del ROSSO, tutto supponendo l'edge INTATTO.

    Due insiemi di percorsi indipendenti: il primo disegna il cono, il
    secondo misura quante volte il ROSSO scatterebbe per sbaglio. Usare
    lo stesso insieme per entrambe le cose sottostimerebbe i falsi allarmi."""
    n = n or orizzonte(rif)
    rng = np.random.default_rng(seed)
    mu, sd = float(np.mean(rif)), float(np.std(rif, ddof=1))
    P = _blocchi(rif, n_sim, n, rng)
    cum = np.cumsum(P, axis=1)
    cad = _cadute(cum)
    cal = {'mu': mu, 'sd': sd, 'n': n,
           'cum': np.sort(cum, axis=0), 'cad': np.sort(cad, axis=0)}
    # soglie congiunte: un solo livello di coda t per i tre controlli,
    # cercato finche' il ROSSO complessivo scatta per sbaglio FALSO_ALLARME
    Q = _blocchi(rif, 3000, n, np.random.default_rng(seed + 1))
    pc, pd, cs = _stati(Q, cal)
    peggio_cono, peggio_cad, peggio_cs = pc.min(axis=1), pd.max(axis=1), cs.max(axis=1)
    lo, hi = 0.0, FALSO_ALLARME
    for _ in range(40):
        t = (lo + hi) / 2
        A = np.percentile(peggio_cono, 100 * t)
        B = np.percentile(peggio_cad, 100 * (1 - t))
        H = np.percentile(peggio_cs, 100 * (1 - t))
        fa = np.mean((peggio_cono < A) | (peggio_cad > B) | (peggio_cs > H))
        lo, hi = (t, hi) if fa < FALSO_ALLARME else (lo, t)
    cal.update({'rosso_cono': float(A), 'rosso_cad': float(B), 'h': float(H),
                'falso_allarme': float(fa)})
    return cal


def _cadute(cum):
    picco = np.maximum.accumulate(
        np.concatenate([np.zeros((cum.shape[0], 1)), cum], axis=1), axis=1)[:, 1:]
    return np.maximum.accumulate(picco - cum, axis=1)


def _stati(P, cal):
    """Per ogni percorso e ogni controllo (uno ogni PASSO operazioni):
    percentile nel cono, percentile della caduta, CUSUM massimo finora."""
    n = P.shape[1]
    ks = np.arange(PASSO, n + 1, PASSO) - 1
    cum = np.cumsum(P, axis=1); cad = _cadute(cum)
    m = cal['cum'].shape[0]
    pc = np.stack([np.searchsorted(cal['cum'][:, j], cum[:, j], 'right') for j in ks], 1) * 100.0 / m
    pd = np.stack([np.searchsorted(cal['cad'][:, j], cad[:, j], 'right') for j in ks], 1) * 100.0 / m
    cs = np.maximum.accumulate(_cusum(P, cal['mu'], cal['sd']), axis=1)[:, ks]
    return pc, pd, cs


def _luci(pc, pd, cs, cal):
    rosso = (pc < cal['rosso_cono']) | (pd > cal['rosso_cad']) | (cs > cal['h'])
    giallo = (pc < GIALLO_CONO) | (pd > GIALLO_CAD)
    return rosso, giallo


def valuta(live, cal):
    """Semaforo a ogni PASSO operazioni. `live` e' la lista delle R vere.
    Una volta ROSSO, resta ROSSO: e' un segnale da guardare, non un umore."""
    live = np.asarray(live, float)[:cal['n']]
    live = live[:len(live) - len(live) % PASSO]
    if not len(live):
        return []
    pc, pd, cs = _stati(live[None, :], cal)
    rosso, giallo = _luci(pc, pd, cs, cal)
    rosso = np.maximum.accumulate(rosso[0])
    cum = np.cumsum(live); cad = _cadute(cum[None, :])[0]
    out = []
    for c, k in enumerate(range(PASSO, len(live) + 1, PASSO)):
        out.append({'k': k, 'cum': float(cum[k - 1]), 'p_cono': float(pc[0, c]),
                    'cad': float(cad[k - 1]), 'p_cad': float(pd[0, c]), 'cusum': float(cs[0, c]),
                    'luce': 'ROSSO' if rosso[c] else ('GIALLO' if giallo[0, c] else 'VERDE')})
    return out


def ritardo(rif, cal, calo, n_prove=3000, seed=11):
    """Se l'edge calasse di `calo` (1 = morto, 0,5 = dimezzato, 2 = rotto,
    cioe' perde quanto prima guadagnava), in quanti casi scatterebbe il
    ROSSO entro l'orizzonte, e dopo quante operazioni?"""
    P = _blocchi(rif, n_prove, cal['n'], np.random.default_rng(seed)) - calo * cal['mu']
    rosso, _ = _luci(*_stati(P, cal), cal)
    preso = rosso.any(axis=1)
    primo = (np.argmax(rosso, axis=1) + 1) * PASSO
    return {'presi': float(preso.mean()),
            'mediana': float(np.median(primo[preso])) if preso.any() else None}


def carica(paths):
    tr = []
    for path, pct in paths:
        ops, _, residui = leggi(path, pct / 100.0)
        if residui:
            raise SystemExit('%s: %d aperture senza chiusura' % (path, residui))
        tr += [(o.chiusura, o.R) for o in ops]
    return sorted(tr)


def stampa(righe, righe_max=24):
    """Il controllo si fa a ogni operazione; a schermo se ne mostra una
    ogni tanto, piu' ogni cambio di colore."""
    if not righe:
        return
    ogni = max(1, len(righe) // righe_max)
    print('  %5s %9s %8s %9s %8s %8s   %s' % ('oper.', 'R cumul.', 'cono', 'caduta R', 'caduta', 'CUSUM', ''))
    prima = None
    for i, r in enumerate(righe):
        if (i + 1) % ogni == 0 or r['luce'] != prima or i == len(righe) - 1:
            print('  %5d %+9.1f %7.1f° %9.1f %7.1f° %8.2f   %s'
                  % (r['k'], r['cum'], r['p_cono'], r['cad'], r['p_cad'], r['cusum'], r['luce']))
        prima = r['luce']


def _argomenti(argv):
    rif, live, fino = [], [], None
    chi = None
    for a in argv:
        if a in ('--rif', '--live'):
            chi = rif if a == '--rif' else live; continue
        if a.startswith('--fino='):
            fino = a.split('=', 1)[1]; continue
        if chi is None:
            raise SystemExit(__doc__)
        path, _, pct = a.partition(':')
        chi.append((path, float(pct or 1)))
    if not rif:
        raise SystemExit(__doc__)
    return rif, live, fino


def main(argv):
    rif_f, live_f, fino = _argomenti(argv)
    tr = carica(rif_f)
    # riferimento PRUDENTE: se c'e' un confine dentro/fuori campione, il
    # dentro campione. Si pianifica sul numero basso, quindi si controlla
    # il live contro il numero basso.
    rif = [r for t, r in tr if fino is None or t[:10] <= fino]
    cal = calibra(rif)
    print('riferimento: %d operazioni%s, media %+.4f R, dev.st %.3f'
          % (len(rif), (' fino al %s' % fino) if fino else '', cal['mu'], cal['sd']))
    print('orizzonte = Minimum Track Record Length della strategia: %d operazioni' % cal['n'])
    print('  (prima di li\' il live puo\' dire «non si e\' rotto», non «funziona»)')
    print('soglie del ROSSO, calibrate insieme: cono sotto il %.2f°, caduta sopra il %.2f°, CUSUM oltre %.2f'
          % (cal['rosso_cono'], cal['rosso_cad'], cal['h']))
    print('falso allarme complessivo: %.1f%%' % (100 * cal['falso_allarme']))

    if live_f:
        live = [r for _, r in carica(live_f)]
        print('\n=== IL LIVE: %d operazioni ===' % len(live))
        stampa(valuta(live, cal))
        return

    print('\n=== QUANTO SPESSO SBAGLIA, e QUANTO E\' LENTO ===')
    for calo, et in ((0.0, 'edge INTATTO  (falso allarme)'),
                     (0.5, 'edge DIMEZZATO'),
                     (1.0, 'edge MORTO'),
                     (2.0, 'strategia ROTTA (perde quanto guadagnava)')):
        d = ritardo(rif, cal, calo)
        q = ('dopo %d operazioni in mediana' % d['mediana']) if d['mediana'] else ''
        print('  %-42s ROSSO nel %4.0f%% dei casi  %s' % (et, 100 * d['presi'], q))

    if fino:
        dopo = [r for t, r in tr if t[:10] > fino]
        print('\n=== PROVA: il periodo dopo il %s trattato come se fosse il live ===' % fino)
        stampa(valuta(dopo, cal))


if __name__ == '__main__':
    main(sys.argv[1:])
