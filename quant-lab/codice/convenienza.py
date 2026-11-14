"""Business case: is running stat-arb from home worth it? Deterministic scenario calculator.

Scenario returns are EXCESS returns over cash, on capital, after trading costs, before tax.
Every scenario is anchored to a measured or published number (see 'fonte').
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SCENARI = [
    ("perde", -0.03, "Come i nostri due test: coppie cripto −9% annuo, carry sotto la liquidità di circa 1,6 punti."),
    ("niente", 0.00, "Il vantaggio è sparito dopo la pubblicazione: McLean-Pontiff misurano −58% di rendimento dopo la pubblicazione; Do-Faff trovano pairs quasi a zero dopo il 2002."),
    ("come un fondo", 0.03, "HFRI Equity Market Neutral 2017–2023: media semplice ≈ 2,9% annuo, già al netto delle commissioni del fondo (e non tutto sopra la liquidità)."),
    ("letteratura migliore", 0.045, "Rad-Low-Faff, distance pairs su azioni USA 1962–2014: 38 punti base al mese dopo i costi ≈ 4,6% annuo, in calo dopo il 2009."),
    ("eccezionale", 0.10, "Sopra quasi tutto ciò che è documentato per strategie neutrali al mercato accessibili a un privato. Messo solo come limite superiore."),
]
CAPITALI = [5_000, 10_000, 25_000, 50_000, 100_000]
TASSE = 0.26                      # imposta italiana sui redditi finanziari (plusvalenze/redditi diversi)
COSTI_FISSI = {                   # €/anno
    "gratis": 0,                  # dati gratuiti, esecuzione manuale o PC di casa
    "base": 12 * (20 + 10),       # dati ~20 €/mese (EODHD) + server ~10 €/mese
}
ORE_SVILUPPO = 300                # ipotesi dichiarata: ricerca + codice + test di una strategia nuova
ORE_MESE = 6                      # ipotesi dichiarata: controllo e manutenzione


def calc():
    rows = []
    for nome, r, fonte in SCENARI:
        for C in CAPITALI:
            for k, fix in COSTI_FISSI.items():
                lordo = C * r
                tasse = TASSE * lordo if lordo > 0 else 0
                netto = lordo - tasse - fix
                ore_anno = ORE_MESE * 12
                rows.append(dict(scenario=nome, rendimento=r, capitale=C, costi=k, costi_fissi=fix,
                                 netto_anno=round(netto), euro_ora_regime=round(netto / ore_anno, 1),
                                 euro_ora_primo_anno=round(netto / (ore_anno + ORE_SVILUPPO), 1)))
    # capital needed for 1,000 €/yr net in each scenario (base costs)
    soglie = {}
    for nome, r, _ in SCENARI:
        if r <= 0:
            soglie[nome] = None
        else:
            soglie[nome] = round((1000 + COSTI_FISSI["base"]) / (r * (1 - TASSE)))
    return rows, soglie


if __name__ == "__main__":
    rows, soglie = calc()
    out = dict(scenari=[dict(nome=n, rendimento=r, fonte=f) for n, r, f in SCENARI], capitali=CAPITALI,
               tasse=TASSE, costi_fissi=COSTI_FISSI, ore_sviluppo=ORE_SVILUPPO, ore_mese=ORE_MESE,
               righe=rows, capitale_per_1000_euro=soglie)
    (ROOT / "esperimenti" / "convenienza.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    for n, r, _ in SCENARI:
        print(n, [f"{C//1000}k:{next(x['netto_anno'] for x in rows if x['scenario']==n and x['capitale']==C and x['costi']=='base')}" for C in CAPITALI])
    print("capitale per 1000€/anno netti:", soglie)
