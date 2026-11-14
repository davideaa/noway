#!/usr/bin/env python3
"""
Precalcola la "plate" della figura del film (src/components/film/plate-data.ts).

Fonte: data/operazioni.json (4206 operazioni in ordine cronologico, R per
operazione). Curva mediana = somma cumulata in R del portafoglio intero
(oro + nasdaq + usdjpy). Fascio = bootstrap a blocchi di 20 operazioni
consecutive (lo stesso metodo di tools/montecarlo.py), N traiettorie.

Solo FORMA: le curve sono ricampionate a 160 punti e normalizzate insieme
su [0, 4095] (interi). Nessun numero finisce nel film.

Uso:  python3 scripts/plate.py            (portafoglio intero)
      python3 scripts/plate.py --solo-oro (solo la gamba oro, chi == 0)
      python3 scripts/plate.py --n 48     (numero di traiettorie del fascio)
"""
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUNTI = 160
TRAIETTORIE = 48
if "--n" in sys.argv:
    TRAIETTORIE = int(sys.argv[sys.argv.index("--n") + 1])
BLOCCO = 20
SEME = 20260929

solo_oro = "--solo-oro" in sys.argv
op = json.loads((ROOT / "data" / "operazioni.json").read_text())
R = [r for r, chi in zip(op["R"], op["chi"]) if (chi == 0 if solo_oro else True)]
n = len(R)


def cumulata(seq):
    # parte da 0: tutte le traiettorie hanno lo STESSO punto di partenza (il ventaglio si apre da li')
    out, acc = [0.0], 0.0
    for r in seq:
        acc += r
        out.append(acc)
    return out


def ricampiona(curva, k):
    m = len(curva)
    return [curva[min(m - 1, round(i * (m - 1) / (k - 1)))] for i in range(k)]


def bootstrap_blocchi(rng):
    seq = []
    while len(seq) < n:
        i = rng.randrange(0, n - BLOCCO + 1)
        seq.extend(R[i : i + BLOCCO])
    return seq[:n]


rng = random.Random(SEME)
mediana = ricampiona(cumulata(R), PUNTI)
fascio = [ricampiona(cumulata(bootstrap_blocchi(rng)), PUNTI) for _ in range(TRAIETTORIE)]

tutte = [mediana, *fascio]
lo = min(min(c) for c in tutte)
hi = max(max(c) for c in tutte)


def q(v):
    return round((v - lo) / (hi - lo) * 4095)


righe = [",".join(str(q(v)) for v in c) for c in tutte]
fonte = "solo oro (chi == 0)" if solo_oro else "portafoglio intero (oro + nasdaq + usdjpy)"
ts = f"""// GENERATO da scripts/plate.py: non modificare a mano.
// Fonte: data/operazioni.json, {n} operazioni, {fonte}.
// Riga 0 = somma cumulata in R del portafoglio, righe 1..{TRAIETTORIE} = bootstrap a
// blocchi di {BLOCCO} (seme {SEME}). {PUNTI} punti per curva (la prima e' lo zero comune),
// quantizzati insieme su 0..4095. E' solo la FORMA della figura: nel film non compare nessun numero.
export const PLATE_POINTS = {PUNTI};
export const PLATE_CURVES: string[] = [
{chr(10).join('  "' + r + '",' for r in righe)}
];
"""
out = ROOT / "src" / "components" / "film" / "plate-data.ts"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(ts)
print(f"{out}: {len(tutte)} curve x {PUNTI} punti, {out.stat().st_size} byte, fonte {fonte}")
