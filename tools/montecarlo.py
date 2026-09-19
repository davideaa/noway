#!/usr/bin/env python3
"""
Monte Carlo sul portafoglio a tre gambe.

Legge la sequenza dei trade da un report HTML del Strategy Tester MT5,
la converte in multipli di R e la rimescola in quattro modi diversi.
Ogni modo risponde a una domanda diversa; nessuno da solo basta.

  permutazione   stessi trade, ordine diverso  -> l'ordine e' stato fortunato?
  bootstrap IID  ripescati con rimpiazzo       -> il campione e' stato fortunato?
  blocchi        ripescati a blocchi di N      -> come sopra, ma tenendo le serie
  rimozione 10%  butta un trade su dieci       -> dipende da pochi trade grossi?

Il bootstrap a blocchi e' quello a cui credere: gli altri due spezzano la
dipendenza fra trade vicini, e sui mercati quella dipendenza esiste
(le perdite arrivano in fila). Spezzandola si sottostima il drawdown.
"""
import re, html, sys, random, math, statistics as st

def leggi_trade(path):
    raw = open(path, encoding='utf-16', errors='ignore').read()
    if '<html' not in raw.lower():
        raw = open(path, encoding='utf-8', errors='ignore').read()
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', raw, re.S)
    def cells(r):
        return [html.unescape(re.sub(r'<[^>]+>', '', x)).strip()
                for x in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.S)]
    hdr = next(i for i, r in enumerate(rows) if 'Direzione' in cells(r))
    bal = []
    for r in rows[hdr + 1:]:
        c = cells(r)
        if len(c) < 13 or c[4] != 'out':
            continue
        bal.append(float(c[11].replace(' ', '').replace(' ', '')))
    return bal

def in_R(bal, dep, rischio):
    """Rendimento di ogni trade come multiplo del rischio per trade.

    Si usa il saldo, non la colonna profitto: cosi' commissioni e swap
    sono gia' dentro. E si normalizza per il saldo del momento, perche'
    con il rischio in percentuale un trade vale in euro sempre di piu'
    man mano che il conto cresce."""
    out, prec = [], dep
    for b in bal:
        out.append((b / prec - 1.0) / rischio)
        prec = b
    return out

def simula(Rs, rischio):
    """Equity finale e drawdown massimo di una sequenza di R."""
    eq = 1.0; picco = 1.0; dd = 0.0
    for R in Rs:
        eq *= (1.0 + R * rischio)
        if eq <= 0.0:
            return 0.0, 1.0
        if eq > picco: picco = eq
        d = 1.0 - eq / picco
        if d > dd: dd = d
    return eq, dd

def permutazione(R, rnd):  return rnd.sample(R, len(R))
def bootstrap(R, rnd):     return [rnd.choice(R) for _ in R]
def rimozione(R, rnd, q=0.10):
    return [x for x in R if rnd.random() > q]

def blocchi(R, rnd, L=20):
    """Ripesca blocchi contigui: dentro il blocco l'ordine resta, quindi
    le serie di perdite sopravvivono al rimescolamento."""
    n = len(R); out = []
    while len(out) < n:
        i = rnd.randrange(n)
        out.extend(R[i:i + L] if i + L <= n else R[i:] + R[:(i + L) % n])
    return out[:n]

def pct(v, p): 
    v = sorted(v); k = (len(v) - 1) * p / 100.0
    lo, hi = int(k), min(int(k) + 1, len(v) - 1)
    return v[lo] + (v[hi] - v[lo]) * (k - lo)

if __name__ == '__main__':
    path   = sys.argv[1]
    dep    = 10000.0
    r_base = 0.006
    N      = 20000

    bal = leggi_trade(path)
    R   = in_R(bal, dep, r_base)
    print(f"Trade letti: {len(R)}   saldo finale reale: {bal[-1]:,.2f}")
    somma = sum(R)
    print(f"Somma dei multipli di R: {somma:.1f}   media per trade: {somma/len(R):+.4f} R")
    print(f"Deviazione standard per trade: {st.pstdev(R):.2f} R")
    print(f"t = {somma/(st.pstdev(R)*math.sqrt(len(R))):.2f}   (misurata sui trade veri, non stimata)")

    for rischio in (0.006, 0.010):
        eq0, dd0 = simula(R, rischio)
        print(f"\n{'='*66}\nRISCHIO {rischio*100:.1f}% PER TRADE")
        print(f"  sequenza reale: saldo {dep*eq0:,.0f}  ({100*(eq0-1):+.0f}%)   drawdown {100*dd0:.1f}%")
        print(f"\n  {'metodo':<16}{'DD mediano':>12}{'DD 95%':>10}{'DD 99%':>10}"
              f"{'profitto med.':>15}{'perdenti':>10}")
        for nome, fn in (('permutazione', permutazione), ('bootstrap IID', bootstrap),
                         ('blocchi (20)', blocchi), ('rimozione 10%', rimozione)):
            rnd = random.Random(12345)
            eqs, dds = [], []
            for _ in range(N):
                e, d = simula(fn(R, rnd), rischio)
                eqs.append(e); dds.append(d)
            perdenti = 100.0 * sum(1 for e in eqs if e < 1.0) / N
            print(f"  {nome:<16}{100*pct(dds,50):11.1f}%{100*pct(dds,95):9.1f}%"
                  f"{100*pct(dds,99):9.1f}%{100*(pct(eqs,50)-1):14.0f}%{perdenti:9.1f}%")
