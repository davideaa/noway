# CPI in situazioni simili a oggi: cosa ha fatto l'oro (descrittivo, scritto prima di calcolare)

Scritto il 10/11/2026 verso le 10:38 UTC (ora del commit), **prima** di calcolare e prima del CPI delle 13:30 UTC.

## Domanda di Davide

La Fed vuole alzare i tassi a dicembre e il CPI di oggi serve da conferma. In situazioni simili, cosa ha fatto di solito l'oro nel primo minuto? Usare i dati di NFP e inflazione.

## Cosa è e cosa non è

- **È un descrittivo.** Non decide niente e non cambia il sito né il registro dal vivo.
- **Non è una prova.** Sul CPI abbiamo già cercato in 4,66 milioni di ipotesi e l'holdout è già stato aperto: verdetto NO RELIABLE EDGE. Qualunque gruppo "simile a oggi" trovato adesso sugli stessi anni è contaminato.
- I gruppi piccoli (meno di 20 casi) si riportano con il numero di casi, senza conclusioni.

## La situazione di oggi (dalle notizie, prima del dato)

- La Fed ha già alzato a settembre 2026 (3,75 → 4,00) e il mercato dà circa l'84% a un rialzo a dicembre.
- L'ultima NFP (06/11) è stata forte.
- Il CPI precedente (settembre, uscito il 14/10) è stato alto: 0,6% e 0,3% core.
- Per oggi il consenso è in calo: 0,3% (non arrotondato ~0,23) e core 0,2%.

## Definizioni, fissate prima

Dati: `hx26_release.csv` (attese e dati usciti, ForexFactory), `p2_events.parquet` (prima candela M1 dell'oro sui tick), dal 2008.

| Sigla | Condizione |
|---|---|
| C1 | la riunione Fed successiva al CPI ha alzato i tassi |
| C2 | l'ultima NFP prima del CPI è uscita sopra le attese |
| C3 | il CPI precedente è uscito caldo: core sopra le attese, oppure core in linea e totale sopra |
| C4 | il consenso sul CPI totale m/m è più basso del dato precedente |

Esito del CPI: **CALDO** se il core esce sopra le attese (a parità di core vale il totale), **FREDDO** se sotto, **IN LINEA** se entrambi uguali alle attese.

Gruppi: tutti i CPI; C1; C1+C2; C1+C4; C1+C3+C4; C1+C2+C3+C4.

Per ogni gruppo:
- quanti casi;
- quante volte la prima candela M1 dell'oro chiude su;
- la mossa mediana in % del prezzo;
- le stesse cose divise per esito (caldo, in linea, freddo).

Si elencano anche uno per uno i CPI del gruppo C1.

## Risultati

File: `research_output/phase2/hx16/descr_cpi_simili.json` (`scripts/descr_cpi_simili.py`). 221 CPI con tick e attese, dal 16/01/2008 all'11/09/2026. Il CPI del 14/10/2026 non c'è: nel file delle attese manca dal set con i tick.

**Prima del dato la direzione è una moneta.** Nel gruppo C1 (Fed che alza alla riunione dopo) l'oro ha chiuso la prima candela su 17 volte su 35.

**Dopo il dato segue la sorpresa**, e con la Fed in rialzo di più:

| Gruppo | Esito | Casi | Oro giù | Oro su | Mossa mediana |
|---|---|---|---|---|---|
| Tutti i CPI | caldo | 86 | 54 | 32 | −0,06% |
| Tutti i CPI | in linea | 35 | 16 | 19 | +0,01% |
| Tutti i CPI | freddo | 100 | 20 | 80 | +0,09% |
| C1, Fed in rialzo | caldo | 12 | 10 | 2 | −0,26% |
| C1, Fed in rialzo | in linea | 11 | 7 | 4 | −0,11% |
| C1, Fed in rialzo | freddo | 12 | 1 | 11 | +0,34% |
| C1 dal 2022 | caldo | 8 | 7 | 1 | −0,26% |
| C1 dal 2022 | in linea | 4 | 3 | 1 | −0,30% |
| C1 dal 2022 | freddo | 6 | 0 | 6 | +0,68% |

**Gruppi più stretti: troppo pochi casi.**
- C1+C2 (anche NFP forte prima): 26 casi. Caldo 12 (oro giù 10), in linea 7 (giù 4), freddo 7 (su 7, mediana +0,55%).
- C1+C4: 13 casi. C1+C3+C4 e tutte e quattro: 5 casi (2 caldi giù, 1 in linea su, 2 freddi su). Non dicono niente.

**Gli ultimi due casi C1, nel 2026, sono stati molto più grandi della mediana:** 12/08 in linea −0,76% (−33 $), 11/09 core caldo −1,03% (−45 $).

**Lettura.**
- Il dato che conta è il core rispetto alle attese (oggi 0,2%).
- Senza conoscere il dato non c'è direzione: resta il verdetto NO RELIABLE EDGE.
- 12 casi per esito sono pochi. La regolarità (21 su 24 nel verso della sorpresa) è coerente con il tetto già misurato (73–87% conoscendo la sorpresa), non una scoperta nuova.

## Ampiezza della prima candela (oro) e indice del dollaro

File: `research_output/phase2/hx16/descr_cpi_oro_dxy.json` (`scripts/descr_cpi_oro_dxy.py`).

**Oro.** Stima EW3 con fascia 25–75, la stessa formula usata per la NFP, mai provata sul CPI. Qui si conta solo quante volte la candela vera stava nella fascia: 49% nel 2019–22 (47 CPI) e 49% nel 2023–26 (45 CPI). Il livello "1 volta su 10" è stato superato più spesso: 19% e 13%.

- Per il 10/11/2026: stima 0,76% del prezzo, fascia 0,55–1,41%, livello alto 1,69%.
- Nelle ultime 5 CPI la candela vera è sempre stata sopra la stima: 341, 605, 503, 565, 372 pips contro 112, 139, 225, 253, 295.

## Il dollaro anticipa l'oro nei primi secondi? (definizione scritta prima di calcolare)

Chiesto da Davide alle 11:50 italiane del 10/11/2026: guardare il DXY per capire cosa fa l'oro nei primi minuti.

- CPI dal 2025 con i tick di oro e delle sei valute del DXY.
- Oro e DXY su una griglia da 100 ms, nei primi 10 secondi dopo il dato.
- **Mezza mossa**: il primo istante in cui la serie ha coperto metà della sua mossa dei primi 10 secondi.
- **Anticipo** = istante dell'oro − istante del DXY. Positivo vuol dire che il dollaro arriva prima.
- Si riportano: la mediana, quante volte il dollaro arriva prima di almeno 0,5 s e di almeno 1 s, quante volte i due vanno in verso opposto nei primi 10 s e nel primo minuto.
- Per servire a un trader a mano l'anticipo dovrebbe essere di almeno 1–2 secondi nella maggior parte dei casi. Sotto, è solo una conferma.
- I tick Dukascopy hanno l'ora del loro server: sotto il mezzo secondo la misura non è affidabile.

## La candela M1 e la M5 dicono la direzione del resto della giornata? (definizione scritta prima di calcolare)

Chiesto da Davide verso le 12:15 italiane del 10/11/2026.

- CPI dal 2015, candele M1 Dukascopy (bid). **p0** = apertura del minuto del dato.
- **Verso della M1** = chiusura del primo minuto contro p0. **Verso della M5** = chiusura del quinto minuto contro p0.
- **Continua dopo la M1**: dal prezzo di chiusura della M1 il prezzo va ancora nel verso della M1, misurato a +5, +15, +60 minuti e alla chiusura del giorno (17:00 di New York).
- **Continua dopo la M5**: lo stesso partendo dalla chiusura della M5, a +15, +60 minuti e alla chiusura del giorno.
- La mossa si misura **dalla chiusura della candela in poi**, non da p0: se no la candela stessa trucca il conto (errore già dichiarato sul descrittivo NFP).
- Gruppi: 2015–26, 2020–26, 2023–26, e le M1 grandi (sopra la mediana del periodo).
- Si riportano: quante volte continua, il p contro la moneta, la mossa mediana e media in pips al prezzo di oggi nel verso della candela.
- Per servire deve continuare ben sopra il 50% **e** la mossa media deve restare positiva tolti 30–40 pips di costi. Nessuna decisione: descrittivo.
- Già provato in H-X17 (deriva nel verso della sorpresa a +5 e +15 minuti): CPI in conferma 2019–26 47% e 51%, non passa.

## Risultati: indice del dollaro (dopo i commit con le definizioni)

File: `descr_cpi_oro_dxy.json` e `descr_cpi_anticipo_dxy.json` in `research_output/phase2/hx16/`. 21 CPI, dal 15/01/2025 al 14/10/2026.

- **Verso.** Nel primo minuto il DXY è andato al contrario dell'oro 21 volte su 21; nei primi 10 secondi 20 su 21.
- **Ampiezza del DXY nel primo minuto.** Mediana 0,25% (circa 0,25 punti con il DXY a 101,65), tre quarti dei casi sotto 0,36%, massimo 0,44%. Su EURUSD: mediana 20 pips, tre quarti sotto 29, massimo 43.
- **L'oro si muove di più.** In % fa circa 1,7 volte il DXY (mediana). Nel 2026 molto di più: oro 0,8–1,5%, DXY 0,08–0,43%.
- **Anticipo.** Mediana −100 ms, cioè insieme (sotto il mezzo secondo la misura non è affidabile). Il DXY arriva a metà mossa almeno 0,5 s prima dell'oro in 5 casi su 21, almeno 1 s prima in 4. L'oro non è mai arrivato prima di 0,5 s.
- **Lettura.** Il dollaro conferma il verso ma non lo anticipa in modo usabile a mano: nella maggior parte dei casi reagiscono nello stesso istante.
