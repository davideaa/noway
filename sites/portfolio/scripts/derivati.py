#!/usr/bin/env python3
"""
Precalcola in data/derivati.json tutto quello che /dettagli disegna, cosi' il
browser non fa nessun conto pesante.

Legge data/operazioni.json (4.206 operazioni: strategia, R, mese) e produce,
per ogni strategia e per il portafoglio a pari rischio (1 R per operazione,
tutte e tre insieme, nell'ordine cronologico del file):

  - statistiche dentro / fuori campione / tutto (n, R/op, somma R, dev.std, t,
    % vinte, drawdown del backtest in R, perdite consecutive, anno migliore e
    peggiore);
  - curva cumulata in R, drawdown operazione per operazione, media mobile di R
    su 250 operazioni;
  - R per anno e per mese (anno x mese);
  - distribuzione del drawdown massimo con il bootstrap a blocchi di 20
    (stessa logica di tools/montecarlo.py, funzione `blocchi`: si ripescano
    blocchi contigui di 20 operazioni, con avvolgimento in fondo, finche' la
    sequenza e' lunga quanto l'originale; le serie di perdite restano intere);
  - per il portafoglio: correlazioni mensili con intervallo (Fisher, 95%),
    i 10 mesi peggiori, i mesi in cui perdono o guadagnano tutte e tre.

Tutto e' in R: il drawdown in R non dipende dal rischio per operazione scelto
(a rischio 1% per operazione, 10 R sono circa il 10%, senza composto).

Uso:  python3 scripts/derivati.py            (10.000 campioni, seme 12345)
      python3 scripts/derivati.py --campioni 10000

Alla fine confronta i propri conti con data/strategie.json e si ferma se
qualcosa non torna: i due file devono dire le stesse cose.
"""
import argparse
import itertools
import json
import math
import operator
import random
import statistics as st
import sys
from pathlib import Path

QUI = Path(__file__).resolve().parent
DATA = QUI.parent / "data"

# fuori campione: da COPY.md / strategie.json (oro e nasdaq dal 2024-01, usdjpy dal 2023-01)
FUORI_DA_DEFAULT = {"oro": "2024-01", "nasdaq": "2024-01", "usdjpy": "2023-01"}
ROLLING = 250
BLOCCO = 20


# ---------------------------------------------------------------- utilita'
def r2(x):
    return round(x + 0.0, 2)


def cumsum(xs):
    return list(itertools.accumulate(xs))


def drawdown_serie(cum):
    """Drawdown in R operazione per operazione (>= 0), dal picco precedente (picco iniziale 0)."""
    picchi = list(itertools.accumulate(cum, max, initial=0.0))[1:]
    return [p - c for p, c in zip(picchi, cum)]


def dd_max(cum):
    picchi = itertools.accumulate(cum, max, initial=0.0)
    next(picchi)  # scarta il picco iniziale per allineare
    return max(map(operator.sub, picchi, cum), default=0.0)


def perdite_consecutive(R):
    best = cur = 0
    for x in R:
        if x < 0:
            cur += 1
            best = max(best, cur)
        else:
            cur = 0
    return best


def pct(v, p):
    """Percentile con interpolazione lineare (come tools/montecarlo.py)."""
    v = sorted(v)
    k = (len(v) - 1) * p / 100.0
    lo, hi = int(k), min(int(k) + 1, len(v) - 1)
    return v[lo] + (v[hi] - v[lo]) * (k - lo)


def blocchi(R, rnd, L=BLOCCO):
    """Ripesca blocchi contigui (tools/montecarlo.py): dentro il blocco l'ordine resta."""
    n = len(R)
    out = []
    while len(out) < n:
        i = rnd.randrange(n)
        out.extend(R[i : i + L] if i + L <= n else R[i:] + R[: (i + L) % n])
    return out[:n]


def bootstrap_dd(R, campioni, seme, storico):
    rnd = random.Random(seme)
    dds = []
    for _ in range(campioni):
        seq = blocchi(R, rnd)
        dds.append(dd_max(cumsum(seq)))
    passo = 1.0
    tetto = int(math.ceil(max(dds) / passo)) * passo
    conteggi = [0] * int(tetto / passo)
    for d in dds:
        k = min(int(d / passo), len(conteggi) - 1)
        conteggi[k] += 1
    # percentile del drawdown storico dentro la distribuzione simulata
    quota_storico = 100.0 * sum(1 for d in dds if d <= storico) / len(dds)
    return {
        "campioni": campioni,
        "blocco": BLOCCO,
        "seme": seme,
        "p50": r2(pct(dds, 50)),
        "p90": r2(pct(dds, 90)),
        "p95": r2(pct(dds, 95)),
        "p99": r2(pct(dds, 99)),
        "min": r2(min(dds)),
        "max": r2(max(dds)),
        "storico": r2(storico),
        "percentile_storico": round(quota_storico, 1),
        "istogramma": {"da": 0, "passo": passo, "conteggi": conteggi},
    }


def statistiche(R, mesi):
    n = len(R)
    somma = sum(R)
    dev = st.stdev(R) if n > 1 else 0.0  # campionaria (n-1): e' quella del simulatore
    per_anno = {}
    for x, m in zip(R, mesi):
        per_anno[m[:4]] = per_anno.get(m[:4], 0.0) + x
    anni = sorted(per_anno)
    mig = max(anni, key=lambda a: per_anno[a])
    peg = min(anni, key=lambda a: per_anno[a])
    cum = cumsum(R)
    return {
        "da": mesi[0],
        "a": mesi[-1],
        "n": n,
        "somma_R": r2(somma),
        "R_per_op": round(somma / n, 4),
        "dev_std": round(dev, 3),
        "t": round(somma / (dev * math.sqrt(n)), 2) if dev else 0.0,
        "vinte_pct": round(100.0 * sum(1 for x in R if x > 0) / n, 1),
        "dd_max_R": r2(dd_max(cum)),
        "perdite_consecutive_max": perdite_consecutive(R),
        "anno_migliore": {"anno": mig, "R": r2(per_anno[mig])},
        "anno_peggiore": {"anno": peg, "R": r2(per_anno[peg])},
    }


def rolling(R, w=ROLLING):
    if len(R) < w:
        return {"finestra": w, "inizio": None, "valori": []}
    cum = [0.0] + cumsum(R)
    vals = [round((cum[i + 1] - cum[i + 1 - w]) / w, 4) for i in range(w - 1, len(R))]
    return {"finestra": w, "inizio": w - 1, "valori": vals}


def pearson(a, b):
    ma, mb = st.fmean(a), st.fmean(b)
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    den = math.sqrt(sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b))
    return num / den


def fisher_ci(r, n, z=1.96):
    zr = math.atanh(r)
    se = 1.0 / math.sqrt(n - 3)
    return math.tanh(zr - z * se), math.tanh(zr + z * se)


def mesi_tra(primo, ultimo):
    y, m = map(int, primo.split("-"))
    y2, m2 = map(int, ultimo.split("-"))
    out = []
    while (y, m) <= (y2, m2):
        out.append(f"{y}-{m:02d}")
        m += 1
        if m == 13:
            y, m = y + 1, 1
    return out


# ---------------------------------------------------------------- per strategia
def scheda(nome, R, mesi, fuori_da, campioni, seme, tutti_i_mesi):
    idx_fuori = next((i for i, m in enumerate(mesi) if m >= fuori_da), len(R))
    cum = cumsum(R)
    per_mese = {m: 0.0 for m in tutti_i_mesi}
    for x, m in zip(R, mesi):
        per_mese[m] += x
    per_anno = {}
    for m, v in per_mese.items():
        per_anno[m[:4]] = per_anno.get(m[:4], 0.0) + v
    mesi_neg = sum(1 for v in per_mese.values() if v < 0)
    mese_peg = min(per_mese, key=per_mese.get)
    mese_mig = max(per_mese, key=per_mese.get)
    tutto = statistiche(R, mesi)
    return {
        "fuori_da": fuori_da,
        "indice_fuori": idx_fuori,
        "n": len(R),
        "periodi": {
            "dentro": statistiche(R[:idx_fuori], mesi[:idx_fuori]),
            "fuori": statistiche(R[idx_fuori:], mesi[idx_fuori:]),
            "tutto": tutto,
        },
        "curva": [r2(c) for c in cum],
        "drawdown": [r2(d) for d in drawdown_serie(cum)],
        "rolling": rolling(R),
        "per_anno": {a: r2(v) for a, v in sorted(per_anno.items())},
        "per_mese": {m: r2(v) for m, v in per_mese.items()},
        "mesi_negativi": mesi_neg,
        "mese_peggiore": {"mese": mese_peg, "R": r2(per_mese[mese_peg])},
        "mese_migliore": {"mese": mese_mig, "R": r2(per_mese[mese_mig])},
        "bootstrap_dd": bootstrap_dd(R, campioni, seme, tutto["dd_max_R"]),
    }


# ---------------------------------------------------------------- verifica
def verifica(derivati, riferimento):
    """Confronta i conti con data/strategie.json. Ritorna la lista delle differenze."""
    errori = []

    def vicino(a, b, tol):
        return abs(float(a) - float(b)) <= tol

    for nome, s in riferimento["strategie"].items():
        d = derivati["strategie"][nome]
        for blocco, chiave in (("dentro", "dentro_campione"), ("fuori", "fuori_campione"), ("tutto", "tutto")):
            mio, suo = d["periodi"][blocco], s[chiave]
            for k, tol in (("n", 0), ("somma_R", 0.05), ("R_per_op", 0.0005), ("dev_std", 0.002), ("t", 0.011), ("vinte_pct", 0.06)):
                if not vicino(mio[k], suo[k], tol):
                    errori.append(f"{nome}.{blocco}.{k}: qui {mio[k]}, strategie.json {suo[k]}")
        if d["periodi"]["fuori"]["da"] != s["fuori_campione"]["da"]:
            errori.append(f"{nome}: fuori campione da {d['periodi']['fuori']['da']} invece di {s['fuori_campione']['da']}")
        if not vicino(d["periodi"]["tutto"]["dd_max_R"], s["max_drawdown_R_backtest"], 0.06):
            errori.append(f"{nome}.dd_max: qui {d['periodi']['tutto']['dd_max_R']}, strategie.json {s['max_drawdown_R_backtest']}")
        if d["periodi"]["tutto"]["perdite_consecutive_max"] != s["perdite_consecutive_max"]:
            errori.append(f"{nome}.perdite_consecutive: qui {d['periodi']['tutto']['perdite_consecutive_max']}, strategie.json {s['perdite_consecutive_max']}")
        for anno, v in s["per_anno_R"].items():
            if not vicino(d["per_anno"][anno], v, 0.06):
                errori.append(f"{nome}.per_anno.{anno}: qui {d['per_anno'][anno]}, strategie.json {v}")
        for mese, v in s["per_mese_R"].items():
            if not vicino(d["per_mese"][mese], v, 0.02):
                errori.append(f"{nome}.per_mese.{mese}: qui {d['per_mese'][mese]}, strategie.json {v}")
        if d["periodi"]["tutto"]["anno_migliore"]["anno"] != s["anno_migliore"] or d["periodi"]["tutto"]["anno_peggiore"]["anno"] != s["anno_peggiore"]:
            errori.append(f"{nome}: anno migliore/peggiore non coincide")
        # la curva cumulata del file (2 decimali) deve coincidere con la mia
        for i, (a, b) in enumerate(zip(d["curva"], s["curva_R"])):
            if not vicino(a, b, 0.02):
                errori.append(f"{nome}.curva[{i}]: qui {a}, strategie.json {b}")
                break
    corr = riferimento["correlazione_mensile"]
    for c in derivati["portafoglio"]["correlazioni"]:
        if not vicino(c["r"], corr[c["id"]], 0.006):
            errori.append(f"correlazione {c['id']}: qui {c['r']}, strategie.json {corr[c['id']]}")
    return errori


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--campioni", type=int, default=10000)
    ap.add_argument("--seme", type=int, default=12345)
    args = ap.parse_args()

    ops = json.loads((DATA / "operazioni.json").read_text())
    rif = json.loads((DATA / "strategie.json").read_text())
    ordine = ops["ordine"]
    chi, R, mesi = ops["chi"], ops["R"], ops["mesi"]
    assert len(chi) == len(R) == len(mesi)
    assert mesi == sorted(mesi), "le operazioni devono essere in ordine cronologico"
    tutti_i_mesi = mesi_tra(mesi[0], mesi[-1])

    derivati = {
        "fonte": ops["fonte"],
        "generato_da": "scripts/derivati.py (bootstrap a blocchi di 20 come tools/montecarlo.py)",
        "operazioni": len(R),
        "primo_mese": mesi[0],
        "ultimo_mese": mesi[-1],
        "mesi": tutti_i_mesi,
        "bootstrap": {"campioni": args.campioni, "blocco": BLOCCO, "seme": args.seme},
        "strategie": {},
    }

    for k, nome in enumerate(ordine):
        Rk = [x for c, x in zip(chi, R) if c == k]
        Mk = [m for c, m in zip(chi, mesi) if c == k]
        fuori_da = rif["strategie"][nome]["fuori_campione"]["da"] if nome in rif["strategie"] else FUORI_DA_DEFAULT[nome]
        derivati["strategie"][nome] = scheda(nome, Rk, Mk, fuori_da, args.campioni, args.seme + k, tutti_i_mesi)
        print(f"{nome}: {len(Rk)} operazioni, bootstrap fatto", file=sys.stderr)

    # ---- portafoglio a pari rischio: le 4.206 operazioni nell'ordine del file
    S = derivati["strategie"]
    per_mese_tot = {m: sum(S[n]["per_mese"][m] for n in ordine) for m in tutti_i_mesi}
    cum_mensile = {n: [r2(c) for c in cumsum([S[n]["per_mese"][m] for m in tutti_i_mesi])] for n in ordine}
    cum_mensile["totale"] = [r2(c) for c in cumsum([per_mese_tot[m] for m in tutti_i_mesi])]
    peggiori = sorted(tutti_i_mesi, key=lambda m: per_mese_tot[m])[:10]
    tutte_neg = [m for m in tutti_i_mesi if all(S[n]["per_mese"][m] < 0 for n in ordine)]
    tutte_pos = [m for m in tutti_i_mesi if all(S[n]["per_mese"][m] > 0 for n in ordine)]
    coppie = [("oro", "nasdaq"), ("oro", "usdjpy"), ("nasdaq", "usdjpy")]
    correlazioni = []
    for a, b in coppie:
        sa = [S[a]["per_mese"][m] for m in tutti_i_mesi]
        sb = [S[b]["per_mese"][m] for m in tutti_i_mesi]
        r = pearson(sa, sb)
        lo, hi = fisher_ci(r, len(tutti_i_mesi))
        correlazioni.append({"id": f"{a}-{b}", "a": a, "b": b, "r": round(r, 2), "lo": round(lo, 2), "hi": round(hi, 2), "n": len(tutti_i_mesi)})
    tutto_port = statistiche(R, mesi)
    cum_port = cumsum(R)
    derivati["portafoglio"] = {
        "nota": "pari rischio: 1 R per operazione per ciascuna strategia, operazioni nell'ordine cronologico del file",
        "n": len(R),
        "stats": tutto_port,
        "per_mese": {m: r2(v) for m, v in per_mese_tot.items()},
        "per_anno": {a: r2(sum(per_mese_tot[m] for m in tutti_i_mesi if m.startswith(a))) for a in sorted({m[:4] for m in tutti_i_mesi})},
        "curva_mensile": cum_mensile,
        "drawdown_mensile": [r2(d) for d in drawdown_serie(cum_mensile["totale"])],
        "mesi_negativi": sum(1 for v in per_mese_tot.values() if v < 0),
        "mesi_peggiori": [
            {"mese": m, "totale": r2(per_mese_tot[m]), **{n: r2(S[n]["per_mese"][m]) for n in ordine}} for m in peggiori
        ],
        "mesi_tutte_negative": {"n": len(tutte_neg), "mesi": tutte_neg},
        "mesi_tutte_positive": {"n": len(tutte_pos), "mesi": tutte_pos},
        "correlazioni": correlazioni,
        "bootstrap_dd": bootstrap_dd(R, args.campioni, args.seme + 10, dd_max(cum_port)),
    }
    print("portafoglio: bootstrap fatto", file=sys.stderr)

    errori = verifica(derivati, rif)
    derivati["verifica"] = {"contro": "data/strategie.json", "differenze": errori}
    if errori:
        print("ATTENZIONE, differenze rispetto a strategie.json:", file=sys.stderr)
        for e in errori:
            print("  -", e, file=sys.stderr)
    out = DATA / "derivati.json"
    out.write_text(json.dumps(derivati, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"scritto {out} ({out.stat().st_size // 1024} kB); differenze: {len(errori)}", file=sys.stderr)
    return 1 if errori else 0


if __name__ == "__main__":
    sys.exit(main())
