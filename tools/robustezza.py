#!/usr/bin/env python3
"""E' vera o e' overfittata: le prove, tutte in un posto.

Rigenera i numeri di `docs/verdetto-robustezza.md`. Sei domande, e per
ognuna la prova con dichiarato quanto e' solida.

DUE COSE CHE CAMBIANO LA LETTURA, e vanno dette prima dei numeri.

1. IL t NON SI CONFRONTA CON 2. Se si sono provate K configurazioni, il
   caso da solo regala un t di circa radice(2 x log(K)): con 272
   configurazioni la soglia e' 3,35, non 2. Vale pero' SOLO dentro
   campione. Il fuori campione, guardato una volta sola e senza aver
   provato niente li', non va sgonfiato: la sua soglia resta 2.
   Per il nasdaq K NON E' NOTO (gamba costruita altrove), quindi il suo
   t dentro campione non e' sgonfiabile e va trattato come non
   verificato.

2. "META' DEL PROFITTO VIENE DA 11 OPERAZIONI" E' UNA TRAPPOLA. Il netto
   e' la differenza fra due numeri grandi e quasi uguali (+1.473 R di
   vincite contro -1.123 R di perdite), quindi e' solo il 24% delle
   vincite. Bastano poche operazioni a coprirne meta' perche' il
   confronto e' sbilanciato, non perche' le altre non guadagnino. Il
   test onesto e' `tetto()`: azzoppare TUTTE le vincite sopra una
   soglia, che non sceglie niente a mano.

Uso:
    python3 tools/robustezza.py dati/oro_puprime_065.html.gz:0.65 \
                                dati/nasdaq_puprime_098.html.gz:0.98
"""
import sys, os, math
import statistics as st

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dati_validazione import leggi, CONFINE_OOS


def t_stat(R):
    """t = somma(R) / (deviazione standard x radice(n)), col suo p a una coda."""
    n = len(R); s = sum(R); sd = st.stdev(R)
    t = s / (sd * math.sqrt(n))
    return {'n': n, 'somma': s, 'media': s / n, 'sd': sd, 't': t,
            'p': 0.5 * math.erfc(t / math.sqrt(2))}


def soglia_rumore(K):
    """Il t che il caso da solo produce avendo provato K configurazioni.

    Limite superiore: le configurazioni vicine non sono indipendenti fra
    loro (parametri simili danno risultati simili), quindi la soglia vera
    sta piu' in basso. Non e' calcolabile con precisione."""
    return math.sqrt(2 * math.log(K)) if K > 1 else 0.0


def tetto(R, cap):
    """Ogni vincita azzoppata a `cap`. Il test di robustezza piu' severo:
    non toglie operazioni scelte a mano, cancella TUTTA la coda."""
    return sum(min(x, cap) for x in R)


def costi(ops, rischio):
    """Costo riportato alla stessa unita' del risultato, cioe' in R.

    ATTENZIONE: qui c'e' solo cio' che il report espone, commissione e
    swap. Lo spread e' gia' dentro i prezzi di apertura e chiusura e NON
    E' SEPARABILE: il costo vero e' piu' alto, e di quanto non si sa.
    Ogni margine calcolato qui e' quindi ottimista."""
    return sum(-(o.comm + o.swap) / (rischio * (o.saldo - o.netto)) for o in ops)


def muore_a(ops_per_gamba):
    """Quante volte i costi attuali prima che il totale vada sotto zero."""
    k = 1.0
    while k < 40:
        tot = sum(
            (o.netto - (k - 1) * (-(o.comm + o.swap))) / (r * (o.saldo - o.netto))
            for ops, r in ops_per_gamba for o in ops)
        if tot <= 0:
            return k
        k += 0.1
    return None


def per_durata(ops, fasce=((0, 4), (4, 12), (12, 24), (24, 72), (72, 1e9))):
    """Risultato per quanto a lungo l'operazione e' rimasta aperta.

    Descrive il meccanismo dei falsi breakout, ma NON E' UN PARAMETRO DA
    OTTIMIZZARE: la durata si conosce solo a cose fatte. Le operazioni
    che muoiono entro 4 ore perdono perche' hanno gia' colpito lo stop —
    a 4 ore non sono piu' aperte, quindi nessuno stop temporale le
    taglierebbe."""
    out = []
    for a, b in fasce:
        v = [o for o in ops if a <= o.durata < b]
        if not v:
            continue
        R = [o.R for o in v]
        out.append({'da': a, 'a': b, 'n': len(v),
                    'vinte': 100 * sum(1 for x in R if x > 0) / len(v),
                    'media': sum(R) / len(R), 'somma': sum(R)})
    return out


def main(argv):
    if not argv:
        raise SystemExit(__doc__)
    gambe = {}
    for a in argv:
        path, _, pct = a.partition(':')
        nome = os.path.basename(path).split('_')[0]
        ops, ambigui, residui = leggi(path, float(pct) / 100.0)
        if residui:
            raise SystemExit('%s: %d aperture senza chiusura' % (path, residui))
        gambe[nome] = (ops, float(pct) / 100.0)

    tutti = [o for ops, _ in gambe.values() for o in ops]
    R = [o.R for o in tutti]

    print('=' * 68)
    print('1. CHE TIPO DI STRATEGIA E\'')
    print('=' * 68)
    vin = [x for x in R if x > 0]; per = [x for x in R if x <= 0]
    print('  %d operazioni, %.1f%% vinte' % (len(R), 100 * len(vin) / len(R)))
    print('  vincita media %+.3f R   perdita media %+.3f R   rapporto %.2f'
          % (st.mean(vin), st.mean(per), st.mean(vin) / abs(st.mean(per))))
    print('  MEDIANA %+.3f R  <- l\'operazione tipica perde: e\' normale, non e\' un difetto'
          % st.median(R))

    print('\n' + '=' * 68)
    print('2. E\' FORTUNA? il t, dentro e fuori campione')
    print('=' * 68)
    IS = [o.R for o in tutti if o.chiusura[:10] <= CONFINE_OOS]
    OOS = [o.R for o in tutti if o.chiusura[:10] > CONFINE_OOS]
    for et, v in (('tutto', R), ('dentro campione', IS), ('FUORI campione', OOS)):
        s = t_stat(v)
        print('  %-16s n=%4d  somma %+7.1f R  t = %.2f   p = %.1g'
              % (et, s['n'], s['somma'], s['t'], s['p']))
    for nome, (ops, _) in gambe.items():
        s = t_stat([o.R for o in ops])
        print('    %-14s n=%4d  somma %+7.1f R  t = %.2f' % (nome, s['n'], s['somma'], s['t']))
    print('  soglia del rumore dentro campione: K=25 -> %.2f   K=272 -> %.2f'
          % (soglia_rumore(25), soglia_rumore(272)))
    print('  il FUORI campione non va sgonfiato: soglia 2')

    print('\n' + '=' * 68)
    print('3. DIPENDE DA POCHI COLPI? il tetto sulle vincite')
    print('=' * 68)
    for cap in (99, 5, 4, 3, 2, 1.5):
        et = "com'e'" if cap > 90 else 'max %.1f R' % cap
        print('  %-12s %+8.1f R' % (et, tetto(R, cap)))

    print('\n' + '=' * 68)
    print('4. I COSTI')
    print('=' * 68)
    tot_c = 0.0
    for nome, (ops, r) in gambe.items():
        c = costi(ops, r); tot_c += c
        Rn = sum(o.R for o in ops)
        print('  %-8s netti %+7.1f R   costo %5.1f R   = %.0f%% del vantaggio grezzo'
              % (nome, Rn, c, 100 * c / (Rn + c)))
    k = muore_a([(ops, r) for ops, r in gambe.values()])
    print('  costo totale %.1f R -> muore a %.1f volte i costi attuali' % (tot_c, k))
    print('  NB: lo spread non e\' in questi numeri (vedi la docstring di costi())')

    print('\n' + '=' * 68)
    print('5. I FALSI BREAKOUT — descrittivo, NON ottimizzabile')
    print('=' * 68)
    tags = sorted({o.tag for o in tutti if o.tag})
    for tag in tags or [None]:
        v = [o for o in tutti if o.tag == tag] if tag else tutti
        if len(v) < 50:
            continue
        print('  --- %s: %d operazioni, %+.1f R' % (tag or 'tutte', len(v), sum(o.R for o in v)))
        for f in per_durata(v):
            et = ('< %dh' % f['a']) if f['da'] == 0 else (
                 ('> %dh' % f['da']) if f['a'] > 1e8 else ('%d-%dh' % (f['da'], f['a'])))
            print('      %-8s n=%4d  %5.1f%% vinte  medio %+.3f  totale %+7.1f'
                  % (et, f['n'], f['vinte'], f['media'], f['somma']))
        rap = [o for o in v if o.durata < 12]
        print('      le %d rapide (<12h) costano %+.1f R, le altre %d rendono %+.1f R'
              % (len(rap), sum(o.R for o in rap),
                 len(v) - len(rap), sum(o.R for o in v if o.durata >= 12)))


if __name__ == '__main__':
    main(sys.argv[1:])
