#!/usr/bin/env python3
"""Estrae da un report HTML del tester MT5 le operazioni chiuse, ciascuna
attribuita alla strategia che l'ha aperta.

MT5 non mette il magic number nel report, e su conto hedging le
operazioni non si alternano, quindi l'abbinamento apertura->chiusura si
fa per volume e direzione opposta. Con una posizione per strategia e
volumi calcolati da distanze di stop diverse la coppia e' quasi sempre
unica: il campo `ambigui` dice quante volte non lo e' stato, e il totale
attribuito va confrontato con quello del report."""
import re, html
from collections import namedtuple

Trade = namedtuple('Trade', 'data tag netto saldo prezzo_in prezzo_out tipo')

def _num(s):
    s = (s or '').replace(' ', '').replace(' ', '')
    try: return float(s)
    except ValueError: return 0.0

def leggi(path):
    raw = open(path, encoding='utf-16', errors='ignore').read()
    if '<html' not in raw.lower():
        raw = open(path, encoding='utf-8', errors='ignore').read()
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', raw, re.S)
    cl = lambda r: [html.unescape(re.sub(r'<[^>]+>', '', x)).strip()
                    for x in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.S)]
    h = next(i for i, r in enumerate(rows) if 'Direzione' in cl(r))
    D = [c for c in (cl(r) for r in rows[h + 1:]) if len(c) >= 13]

    aperte, trade, ambigui = [], [], 0
    for c in D:
        tipo, dirz, vol = c[3], c[4], c[5]
        costo_in = _num(c[8]) + _num(c[9])
        if dirz == 'in':
            aperte.append([c[12], tipo, vol, costo_in, _num(c[6]), c[0]])
        elif dirz == 'out':
            opp = 'buy' if tipo == 'sell' else 'sell'
            cand = [i for i, a in enumerate(aperte) if a[1] == opp and a[2] == vol]
            if not cand:
                continue
            if len(cand) > 1:
                ambigui += 1
            a = aperte.pop(cand[-1])
            netto = _num(c[10]) + _num(c[8]) + _num(c[9]) + a[3]
            trade.append(Trade(c[0], a[0], netto, _num(c[11]), a[4], _num(c[6]),
                               'long' if a[1] == 'buy' else 'short'))
    return trade, ambigui, len(aperte)

def prezzi(path):
    """Serie del prezzo dell'oro ricavata dai prezzi di esecuzione:
    serve per il confronto con il compra-e-tieni."""
    t, _, _ = leggi(path)
    s = [(x.data, x.prezzo_in) for x in t] + [(x.data, x.prezzo_out) for x in t]
    return sorted(s)

if __name__ == '__main__':
    import sys
    from collections import defaultdict
    t, amb, res = leggi(sys.argv[1])
    print(f"{len(t)} operazioni   ambigui {amb}   non chiuse {res}")
    print(f"totale attribuito {sum(x.netto for x in t):,.2f}")
    g = defaultdict(list)
    for x in t: g[x.tag].append(x.netto)
    for k in sorted(g): print(f"  {k:10s} {len(g[k]):5d}  {sum(g[k]):+12,.2f}")
