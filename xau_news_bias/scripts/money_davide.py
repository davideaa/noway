"""Metodo soldi di Davide (26/09/2026), solo NFP con la regola "contrario della precedente".

Ogni anno si parte da un budget B (es. 3.000). A ogni NFP si rischia: cassa / NFP rimaste nell'anno
(rimaste = 13 - mese della release: gennaio 12, dicembre 1). Full margin: se va male si perde la puntata
(-1R), se va bene si guadagna puntata x R. Quando il profitto dell'anno arriva a B (cassa >= 2B), si mettono
via i B iniziali e si continua a rischiare solo il profitto. L'anno dopo si riparte da B.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def run_year(trades, budget):
    """trades: lista di (data, mese, R). Restituisce righe e riepilogo dell'anno."""
    cassa, messi_via, rows = float(budget), 0.0, []
    for d, month, r in trades:
        rimaste = 13 - month
        puntata = cassa / rimaste
        pl = puntata * r
        cassa += pl
        nota = ""
        if not messi_via and cassa >= 2 * budget:
            cassa -= budget
            messi_via = float(budget)
            nota = f"messi via {budget:.0f}"
        rows.append({"data": d, "rimaste": rimaste, "puntata": round(puntata, 2), "R": r, "pl": round(pl, 2),
                     "cassa": round(cassa, 2), "nota": nota})
    fine = cassa + messi_via
    return rows, {"inizio": budget, "fine": round(fine, 2), "profitto": round(fine - budget, 2), "trade": len(trades)}


if __name__ == "__main__":
    budget = float(sys.argv[1]) if len(sys.argv) > 1 else 3000.0
    site = json.loads((ROOT / "research_output" / "phase2" / "hx11" / "site.json").read_text())
    ev = [e for e in site["ev"] if e["f"] == "NFP" and e["rule"] and e["mv"] != 0 and not e["live"]]
    out = {}
    for s in ("S1", "S3"):
        years = {}
        for e in ev:
            years.setdefault(e["y"], []).append((e["d"][:10], int(e["d"][5:7]), e["sc"][s][e["rule"][0]]["r"]))
        out[s] = {y: run_year(t, budget) for y, t in years.items()}
    for s in out:
        print("==", s)
        tot = 0
        for y, (rows, summ) in out[s].items():
            tot += summ["profitto"]
            print(y, summ)
        print("profitto totale", round(tot, 2))
    print("\nDettaglio S1 2024-2026")
    for y in (2024, 2025, 2026):
        for r in out["S1"][y][0]:
            print(y, r)
    (ROOT / "research_output" / "phase2" / "hx11" / "money_davide.json").write_text(
        json.dumps({s: {str(y): {"righe": v[0], "anno": v[1]} for y, v in out[s].items()} for s in out}, indent=1), encoding="utf-8")
