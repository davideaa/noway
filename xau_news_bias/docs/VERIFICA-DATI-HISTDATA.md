# Verifica dei dati NFP con una seconda fonte (HistData.com)

Fatta il 26/09/2026 perché Davide dubitava dei movimenti: "le NFP di
solito sparano molto di più di +0,4R".

## Come

- Scaricate le candele XAUUSD M1 gratuite di HistData.com, 2014–2026, in
  `data/cache/histdata/` (non nel repository).
- Per ogni NFP del sito si confrontano la candela prima e la candela della
  news, costruite dai tick bid Dukascopy, con le stesse candele di
  HistData.
- Codice: `scripts/verify_histdata.py`. Risultato:
  `research_output/phase2/hx8/verify_histdata.json`.

## Errore trovato e corretto durante il controllo

- HistData dichiara "EST senza ora legale", ma l'orario segue l'ora
  legale europea: ora del file = ora di Berlino − 6 h.
- Al primo tentativo ho usato UTC − 5 fisso: le NFP estive risultavano
  diverse, perché confrontavo il minuto sbagliato.
- Verificato sulla pausa giornaliera 17:00–18:00 e sulle NFP di fine
  ottobre/inizio novembre, quando USA ed Europa hanno l'ora legale
  diversa.

## Risultato

| | |
|---|---|
| NFP confrontate | 145 su 148 |
| Stessa direzione della candela della news | 97% (le diverse sono movimenti di pochi pips, 2014–18) |
| Correlazione del movimento | 0,999 |
| Differenza mediana della chiusura | meno di 1 pip |
| Ultimi 3 anni | uguali entro 1 pip; nel 2026 fino a 9 pips su movimenti di 400–700 |

- **Attenzione:** le chiusure coincidono al centesimo nel 77% dei casi.
  Quindi HistData usa probabilmente lo stesso flusso di prezzi di
  Dukascopy, o uno molto simile.
- Il controllo conferma che orari, candele e calcoli sono giusti. **Non**
  dimostra che il broker di Davide (PUPrime) abbia gli stessi prezzi: per
  quello serve il suo grafico MT5.

## Perché spesso si chiude solo a +0,4R

Negli ultimi 3 anni (34 NFP, dati HistData):
- la candela della news misura in mediana **145 pips** dal minimo al
  massimo;
- ma chiude in mediana solo **89 pips** più in là della candela prima;
- in 18 NFP su 34 chiude a meno di 100 pips (meno di 1R con stop 100);
- in 7 su 34 chiude a 200 pips o più.

La candela della news fa spesso una wick lunga e poi torna indietro.
Chiudendo a fine candela si prende solo il netto.
