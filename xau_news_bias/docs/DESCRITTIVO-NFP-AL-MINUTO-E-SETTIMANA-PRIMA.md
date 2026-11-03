# Descrittivo — NFP al minuto e settimana prima (regole scritte prima di calcolare)

Scritto il 03/11/2026 **prima** di scaricare i dati e calcolare.

## Richiesta di Davide

Per ogni NFP dal 2015:
- quanto si muove l'oro nel 1° minuto, nei primi 5, 15 e 60 minuti e nel giorno;
- in che verso va.

Poi va confrontato con la settimana prima: volatilità in salita, settimana in calo o in rialzo. Da qui esce una previsione per la NFP del 06/11/2026, a ~3.930 $.

Vanno verificati anche i numeri che Davide ha ottenuto sull'oro di Fusion, con candele da 5, 15 e 60 minuti, 78 NFP dal 2019.

**È un descrittivo, non una prova di trading.**
- Come scritto in CLAUDE.md, non esiste più nessun periodo NFP vergine.
- Un verso che "funziona" qui non diventa una regola: andrebbe pre-registrato e confermato solo dal vivo.

## Dati

- Candele da 1 minuto Dukascopy, prezzo **bid**. Fusion e altri broker hanno spread e minuti diversi: nel minuto della news l'escursione bid può differire da quella del broker.
- Candele orarie Dukascopy per costruire i giorni della settimana prima.
- NFP dal 2015 a oggi:
  - lista `research_output/phase2/hx15/cpi_nfp.parquet`;
  - più la NFP del 02/10/2026, presa dal registro dal vivo.
- La lista comprende le uscite spostate:
  - 20/11/2025 e 16/12/2025, per lo shutdown;
  - 11/02/2026;
  - le NFP di gennaio e quelle di giovedì 3 luglio.
- Una NFP senza candele attorno alle 8:30 di New York si toglie e si dice: è il caso dei Venerdì Santi a mercato chiuso, come il 03/04/2026.

## Definizioni

**Ora.** Si usa l'ora di New York, che tiene conto da sola del cambio d'ora americano. Le settimane in cui Italia e USA sono sfasate non cambiano niente: il dato esce sempre alle 8:30 di New York.

**Prezzo di partenza.** È p0, l'apertura della candela delle 8:30.

**Escursioni** (massimo − minimo, in $, in pip con 1 $ = 10 pip, e in % di p0):
- 1° minuto: la candela 8:30;
- primi 5, 15 e 60 minuti: dalle 8:30 alle 8:34, alle 8:44 e alle 9:29;
- "ora del dato + ora dopo", solo per il confronto con Fusion: dalle 8:00 alle 9:59;
- giorno: dalle 17:00 di New York del giorno prima alle 17:00 del giorno NFP, cioè il giorno del broker.

**Al prezzo di oggi.** Ogni escursione in % viene riportata a 3.930 $.

**Verso dalla partenza.** È il segno della chiusura rispetto a p0:
- dopo il 1° minuto: chiusura delle 8:30;
- dopo 15 minuti: chiusura delle 8:44;
- dopo 60 minuti: chiusura delle 9:29;
- a fine giornata: ultima chiusura prima delle 17:00.

**Come si chiude il giorno.** Chiusura del giorno contro apertura del giorno, cioè la candela giornaliera.

**Falsa partenza.** A 60 minuti il prezzo è dall'altra parte di p0 rispetto al 1° minuto, e se ne è allontanato almeno quanto si era mosso nel 1° minuto. Si riporta anche il semplice "a 60 minuti è girato".

## Settimana prima

Si misura alla chiusura del giorno prima della NFP, con i giorni del broker.

**Volatilità.**
- Escursione giornaliera in % = (massimo − minimo) ÷ chiusura.
- Rapporto = media degli ultimi 5 giorni ÷ media dei 20 giorni prima.
- **In salita** se il rapporto è almeno 1,25, altrimenti **normale/in calo**.

**Verso.** Variazione dalla chiusura di 5 giorni prima alla chiusura del giorno prima della NFP:
- oltre +2% → in rialzo;
- sotto −2% → in calo;
- altrimenti piatta.

**Gruppi:**
- in salita / normale;
- in calo / in rialzo / piatta;
- in salita **e** in calo, cioè il caso di adesso.

**Per ogni gruppo e ogni escursione:** numero di NFP, media, mediana, valore superato 1 volta su 10 (quantile 90%) e massimo. Tutto in % e in $ / pip a 3.930 $.

**Legame ampiezza ↔ volatilità.** Correlazione di Spearman fra la volatilità dei 5 giorni prima (in %) e le escursioni della NFP (in %).

## Verso: come si legge

- Ogni quota viene data come "x su n", con la probabilità che una moneta faccia altrettanto o di più: test binomiale a due code contro il 50%.
- Le quote calcolate sono una decina. Una sola p sotto 0,05 è quindi attesa per caso.
- **Conta come segnale solo una quota con p sotto 0,005 su almeno 30 NFP.** Tutto il resto è "come una moneta".
- I gruppi con meno di 15 NFP si riportano ma si leggono come aneddoti.

## Previsione per il 06/11/2026, scritta prima

- **Valore normale** = mediana in %; **1 volta su 10** = quantile 90% in %. Si riportano a 3.930 $.
- Gruppo usato: **volatilità in salita**. Se ha meno di 15 NFP, si usano tutte le NFP.
- Il gruppo "in salita e in calo" si mostra accanto, come aneddoto se ha meno di 15 casi.
- Controllo: lo stesso calcolo sugli ultimi 3 anni. Se cambia più del 25%, si dice.
- Le condizioni di adesso si misurano con i dati disponibili al momento del calcolo: la settimana prima finisce giovedì 5/11 e non è ancora completa.

## Confronto con Fusion

- Stesse misure sulle NFP dal 2019, in $ ai prezzi di allora, come ha fatto Davide.
- Poi si spiega dove i numeri tornano e dove no.

## Risultati (dopo il commit `c55f5e4`)

File: `research_output/phase2/hx16/descr_nfp_minuto.json` (gruppi, verso, previsione) e `.csv` (una riga per NFP).

**137 NFP**, dal 09/01/2015 al 02/10/2026. Nessuna esclusa: il 03/04/2026 (Venerdì Santo) non era nella lista.

**Controllo con le foto di Fusion.** Le ultime 3 NFP al 1° minuto fanno:

| | 07/08/2026 | 04/09/2026 | 02/10/2026 |
|---|---|---|---|
| Dukascopy | 46,0 $ | 82,2 $ | 40,7 $ |
| Fusion | 47 $ | 81 $ | 40 $ |

**Escursioni, tutte le NFP, riportate a 3.930 $** (mediana / 1 volta su 10):

| | Mediana | 1 volta su 10 |
|---|---|---|
| 1° minuto | 19 $ | 36 $ |
| 15 minuti | 28 $ | 47 $ |
| 60 minuti | 37 $ | 61 $ |
| Giorno | 56 $ | 111 $ |

**Volatilità "in salita"** (22 NFP): **non** sono più grandi delle altre.
- La correlazione di Spearman fra il rapporto 5/20 e l'escursione è circa 0 in tutte le finestre.
- Conta invece il **livello** della volatilità dei 5 giorni prima. Spearman: 0,19 al 1° minuto, 0,28 a 15 minuti, 0,33 a 60 minuti, 0,46 nel giorno.
- Adesso il livello è 2,3%: più alto del 92% delle NFP dal 2015.

**Verso.**
- 1° minuto contro la settimana prima: segue 63 volte su 137 (46%).
- 15 minuti contro la settimana prima: segue 56 su 137 (41%, p 0,04). Sotto la soglia scritta prima (0,005), quindi resta "come una moneta".
- Settimana in calo oltre il 2%: il giorno NFP chiude in rialzo 13 volte su 18 (p 0,10). Su tutte le NFP chiude in rialzo 76 su 137 (56%).
- Falsa partenza: 27 volte su 137 (20%). A 60 minuti il verso è girato 38 su 137 (28%).

**Errore mio nelle regole.** Il test "il verso resta lo stesso dopo 60 minuti / a fine giornata" contro il 50% era sbagliato.
- La regola lo segnala come segnale: 72–76% a 60 minuti, 67–68% a fine giornata.
- Ma il prezzo a 60 minuti contiene già il primo scatto, quindi resta dalla stessa parte anche se dopo si muove a caso.
- Mescolando i tratti successivi fra le NFP, a caso ci si aspetta 73% (1° minuto→60), 80% (15→60), 68% (1°→fine) e 72% (15→fine). L'osservato è uguale o più basso.
- Misurato dopo lo scatto:
  - dalle 8:31 il prezzo prosegue nello stesso verso fino alle 9:30 il 44% delle volte, fino a fine giornata il 51%;
  - dalle 8:45, il 42% e il 43%.
- **Nessun segnale di verso.** I quattro "segnali" della regola sono un effetto aritmetico.

**Previsione per il 06/11, regola scritta prima** (gruppo "in salita", 22 NFP, a 3.930 $; normale / 1 volta su 10):

| | Normale | 1 volta su 10 |
|---|---|---|
| 1° minuto | 17 $ | 30 $ |
| 15 minuti | 27 $ | 45 $ |
| 60 minuti | 37 $ | 52 $ |
| Giorno | 54 $ | 114 $ |

- Il controllo sugli ultimi 3 anni supera il +25% (da +22% a +44%), quindi va detto.
- **Queste stime sono troppo basse.** Il gruppo "in salita" non separa le NFP grandi dalle piccole, come mostra la correlazione circa 0.

**Stima aggiunta dopo, non scritta prima.** Escursione in % contro il livello della volatilità dei 5 giorni prima, in log.
- Stimata solo con le NFP fino al 2025 e verificata sulle 9 del 2026:
  - per 60 minuti e giorno è giusta: sopra la mediana 44% e 56%, sopra il "1 su 10" 11% e 11%;
  - per 1° minuto e 15 minuti è troppo bassa: sopra il "1 su 10" 5 e 3 volte su 9.
- Le NFP del 2026 al 1° minuto, riportate a 3.930 $: 13, 52, 31, 12, 16, 54, 42, 72, 38 $ (mediana 38).
- La stima del sito, validata in avanti (H-X32), dà ~36 $.

**Previsione finale data a Davide** (arrotondata):
- 1° minuto 35 / 65 $ (dal 2026 e dalla stima del sito);
- 15 minuti 40 / 75 $ (dal 2026);
- prima ora 50 / 80 $ (livello di volatilità e 2026 d'accordo);
- giorno 90 / 135 $ (livello di volatilità e 2026 d'accordo).
