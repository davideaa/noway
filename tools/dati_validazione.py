#!/usr/bin/env python3
"""Livello dati del report di validazione: dal report HTML di MT5 alle
operazioni, e da li' a tutte le statistiche, a RISCHIO FISSO.

RISCHIO FISSO significa: ogni operazione rischia sempre la stessa cifra,
l'1% del deposito INIZIALE, per tutta la storia. Il backtest e' girato
a percentuale del capitale corrente (composto), quindi la serie va
ricostruita operazione per operazione, non riscalata:

    R_i            = netto_i / (rischio_test * saldo_prima_i)
    utile_fisso_i  = R_i * (rischio_fisso * deposito_iniziale)

R non dipende dalla percentuale scelta, quindi e' la grandezza con cui
si confrontano passate e broker diversi.

Il confine dentro/fuori campione e' quello gia' fissato nel progetto e
non va indovinato: IS fino al 2023.12.31, OOS dal 2024.01.01.
"""
import re, html, math, statistics as st
from collections import defaultdict, namedtuple

CONFINE_OOS = '2024.01.01'
DEPOSITO    = 10000.0

Op = namedtuple('Op', 'apertura chiusura tag tipo volume lordo comm swap netto '
                      'saldo prezzo_in prezzo_out R utile durata')

def _num(s):
    s = (s or '').replace(' ', '').replace(' ', '').replace(' ', '')
    try: return float(s)
    except ValueError: return 0.0

def _ts(s):
    """'2019.09.03 08:00:00' -> secondi, per le durate."""
    try:
        d, t = s.split(' ')
        Y, M, D = (int(x) for x in d.split('.'))
        h, m, sec = (int(x) for x in t.split(':'))
        return ((Y*372 + (M-1)*31 + D) * 24 + h) * 3600 + m*60 + sec
    except Exception:
        return 0

def leggi(path, rischio_test, rischio_fisso=0.01, deposito=DEPOSITO):
    """Operazioni chiuse, attribuite alla strategia che le ha aperte.

    MT5 non mette il magic nel report: l'abbinamento apertura->chiusura
    si fa per volume e direzione opposta, LIFO (vedi tools/estrai.py e
    l'errore n.4 del progetto). `ambigui` conta quante volte la coppia
    non era unica; il totale attribuito va confrontato col report."""
    raw = open(path, encoding='utf-16', errors='ignore').read()
    if '<html' not in raw.lower():
        raw = open(path, encoding='utf-8', errors='ignore').read()
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', raw, re.S)
    cl = lambda r: [html.unescape(re.sub(r'<[^>]+>', '', x)).strip()
                    for x in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.S)]
    h = next(i for i, r in enumerate(rows) if 'Direzione' in cl(r))
    D = [c for c in (cl(r) for r in rows[h+1:]) if len(c) >= 13]

    aperte, ops, ambigui = [], [], 0
    prec = deposito
    for c in D:
        tipo, dirz, vol = c[3], c[4], c[5]
        if dirz == 'in':
            aperte.append({'t': c[0], 'tag': c[12], 'tipo': tipo, 'vol': vol,
                           'comm': _num(c[8]), 'swap': _num(c[9]), 'px': _num(c[6])})
        elif dirz == 'out':
            opp = 'buy' if tipo == 'sell' else 'sell'
            cand = [i for i, a in enumerate(aperte) if a['tipo'] == opp and a['vol'] == vol]
            if not cand: continue
            if len(cand) > 1: ambigui += 1
            a = aperte.pop(cand[-1])
            lordo = _num(c[10]); comm = _num(c[8]) + a['comm']; swap = _num(c[9]) + a['swap']
            netto = lordo + comm + swap
            saldo = _num(c[11])
            R = netto / (rischio_test * prec) if prec > 0 else 0.0
            ops.append(Op(a['t'], c[0], a['tag'],
                          'long' if a['tipo'] == 'buy' else 'short',
                          _num(vol), lordo, comm, swap, netto, saldo,
                          a['px'], _num(c[6]), R, R * rischio_fisso * deposito,
                          (_ts(c[0]) - _ts(a['t'])) / 3600.0))
            prec = saldo
    return ops, ambigui, len(aperte)

# ----------------------------------------------------------------------
#  serie e statistiche, tutte a rischio fisso
# ----------------------------------------------------------------------
def equity_fissa(ops, deposito=DEPOSITO):
    e, v = deposito, [deposito]
    for o in ops:
        e += o.utile; v.append(e)
    return v

def dd_serie(v):
    picco, dd = v[0], 0.0
    for x in v:
        picco = max(picco, x)
        dd = max(dd, (picco - x) / picco)
    return dd

def dd_in_R(ops):
    """Drawdown della curva in punti R: non dipende dal deposito."""
    c = 0.0; picco = 0.0; dd = 0.0
    for o in ops:
        c += o.R; picco = max(picco, c); dd = max(dd, picco - c)
    return dd

def strisce(ops):
    vmax = pmax = v = p = 0
    for o in ops:
        if o.netto > 0: v += 1; p = 0
        else:           p += 1; v = 0
        vmax = max(vmax, v); pmax = max(pmax, p)
    return vmax, pmax

def stat(ops, deposito=DEPOSITO):
    """Il blocco di statistiche standard, a rischio fisso."""
    if not ops: return None
    R = [o.R for o in ops]; U = [o.utile for o in ops]
    vinc = [x for x in U if x > 0]; pers = [x for x in U if x <= 0]
    lordo_v, lordo_p = sum(vinc), abs(sum(pers))
    eq = equity_fissa(ops, deposito)
    sd = st.pstdev(R) if len(R) > 1 else 0.0
    vmax, pmax = strisce(ops)
    return {
        'n': len(ops), 'R': sum(R), 'R_op': sum(R)/len(R), 'sd_R': sd,
        't': sum(R)/(sd*math.sqrt(len(R))) if sd > 0 else float('nan'),
        'utile': sum(U), 'rend': 100*sum(U)/deposito,
        'pf': lordo_v/lordo_p if lordo_p > 0 else float('inf'),
        'wr': 100*len(vinc)/len(ops),
        'media_v': st.mean(vinc) if vinc else 0.0,
        'media_p': st.mean(pers) if pers else 0.0,
        'payoff': (st.mean(vinc)/abs(st.mean(pers))) if pers and st.mean(pers) != 0 else float('nan'),
        'attesa': st.mean(U), 'lordo_v': lordo_v, 'lordo_p': -lordo_p,
        'dd': 100*dd_serie(eq), 'dd_R': dd_in_R(ops),
        'comm': sum(o.comm for o in ops), 'swap': sum(o.swap for o in ops),
        'volume': sum(o.volume for o in ops),
        'v_max': vmax, 'p_max': pmax,
        'durata_media': st.mean([o.durata for o in ops]),
        'durata_max': max(o.durata for o in ops),
        'recupero': (sum(U)/ (dd_serie(eq)*deposito)) if dd_serie(eq) > 0 else float('nan'),
    }

def per_anno(ops):
    g = defaultdict(list)
    for o in ops: g[o.chiusura[:4]].append(o)
    return {a: g[a] for a in sorted(g)}

def per_mese(ops):
    g = defaultdict(list)
    for o in ops: g[o.chiusura[:7]].append(o)
    return {m: g[m] for m in sorted(g)}

def taglia(ops, dal=None, al=None):
    return [o for o in ops
            if (dal is None or o.chiusura[:10] >= dal)
            and (al is None or o.chiusura[:10] <= al)]

def prezzo_mensile(ops):
    """Serie XAUUSD di fine mese, dall'ultima esecuzione del mese.
    E' un'approssimazione ricavata dai prezzi di esecuzione del
    backtest, non la chiusura ufficiale: va etichettata come tale."""
    s = sorted([(o.apertura, o.prezzo_in) for o in ops if o.prezzo_in > 0] +
               [(o.chiusura, o.prezzo_out) for o in ops if o.prezzo_out > 0])
    fine = {}
    for t, p in s: fine[t[:7]] = p
    return fine

def regressione(y):
    """Retta ai minimi quadrati su y contro l'indice. Torna pendenza,
    intercetta, R^2 e dispersione dei residui.

    ATTENZIONE, e' il punto statistico delicato: y qui e' una serie
    CUMULATA, quindi fortemente autocorrelata. Anche una passeggiata
    casuale senza nessun vantaggio produce R^2 alti. L'R^2 misura
    quanto il percorso e' regolare, NON se il vantaggio esiste: per
    quello serve la t sui rendimenti per operazione."""
    n = len(y)
    x = list(range(n))
    mx, my = (n-1)/2, sum(y)/n
    sxx = sum((i-mx)**2 for i in x)
    sxy = sum((x[i]-mx)*(y[i]-my) for i in range(n))
    b = sxy/sxx if sxx else 0.0
    a = my - b*mx
    res = [y[i] - (a + b*x[i]) for i in range(n)]
    sst = sum((v-my)**2 for v in y)
    r2 = 1 - sum(r*r for r in res)/sst if sst else float('nan')
    return {'pendenza': b, 'intercetta': a, 'r2': r2,
            'res_sd': st.pstdev(res), 'res': res,
            'res_max': max(abs(r) for r in res)}

# ----------------------------------------------------------------------
#  la stessa passata letta a INTERESSE COMPOSTO
# ----------------------------------------------------------------------
def equity_composta(ops, deposito=DEPOSITO):
    """Il saldo vero della passata: e' gia' composto, perche' il backtest
    e' girato a percentuale del capitale corrente."""
    return [deposito] + [o.saldo for o in ops]

def stat_composto(ops, deposito=DEPOSITO):
    """Stesse voci di stat(), ma sui valori in valuta VERI della passata.
    Utile per dire quanto avrebbe fatto davvero il conto, con le
    posizioni che crescono insieme a lui."""
    if not ops: return None
    U = [o.netto for o in ops]
    vinc = [x for x in U if x > 0]; pers = [x for x in U if x <= 0]
    lv, lp = sum(vinc), abs(sum(pers))
    eq = equity_composta(ops, deposito)
    vmax, pmax = strisce(ops)
    dd = dd_serie(eq)
    return {
        'n': len(ops), 'utile': sum(U), 'rend': 100*sum(U)/deposito,
        'finale': eq[-1],
        'pf': lv/lp if lp > 0 else float('inf'),
        'wr': 100*len(vinc)/len(ops),
        'media_v': st.mean(vinc) if vinc else 0.0,
        'media_p': st.mean(pers) if pers else 0.0,
        'attesa': st.mean(U), 'lordo_v': lv, 'lordo_p': -lp,
        'dd': 100*dd, 'v_max': vmax, 'p_max': pmax,
        'recupero': (sum(U)/(dd*deposito)) if dd > 0 else float('nan'),
        'comm': sum(o.comm for o in ops), 'swap': sum(o.swap for o in ops),
    }

def cagr(valore_finale, anni, deposito=DEPOSITO):
    """Tasso annuo composto. Ha senso SOLO sulla serie composta: su
    quella a rischio fisso il capitale non si reinveste, quindi li' si
    usa la media annua aritmetica."""
    if anni <= 0 or valore_finale <= 0: return float('nan')
    return 100*((valore_finale/deposito)**(1/anni) - 1)
