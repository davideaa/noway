# Puntata 35 (ven 20/11/2026) — «Quanto costa davvero uno smartphone a rate» — fonti (verificate l'11/11/2026)

Caso reale, ma **con una avvertenza di perimetro**: l'esempio rappresentativo che si documenta è un'offerta **di finanziamento di una catena (MediaWorld, finanziatore Findomestic Banca)**, riferita a un **bene da 789 €** (non dichiarato come smartphone: la pagina dice «prezzo del bene»). Per uno smartphone vero e dichiarato esiste, nella stessa pagina, l'offerta a tasso zero su Vivo X Fold 6 (1.599 €). Il gancio della scheda (1.000 € a 47 € al mese) NON è un'offerta reale: resta «cifre illustrative, non dati».

Fonte primaria (letta per intero il 11/11/2026, testo della pagina, non articoli):
- **MediaWorld (MediaMarket S.p.A. con Socio Unico), pagina «Finanziamento»**, sezione «Finanziamenti tasso standard» e «Finanziamento tasso zero»: https://www.mediaworld.it/it/service/finanziamento
- Finanziatore: **Findomestic Banca S.p.A.**; MediaMarket «opera quale intermediario del credito, in esclusiva». Dicitura in pagina: «Messaggio pubblicitario con finalità promozionale». Nessun numero di messaggio pubblicitario né link al SECCI/foglio informativo letti: **IEBCC (SECCI) citato come disponibile «nel punto vendita e nel percorso online», non scaricato**.
- Le offerte sono a tempo: lo standard vale **dal 01/11/2026 al 30/11/2026**, il tasso zero Vivo **dal 29/10/2026 al 29/11/2026**. Il reel esce il 20/11: dentro la finestra, ma ricontrollare il giorno di uscita (le pagine cambiano).

## A. Offerta a tasso standard (il caso del calcolo)

| Detto nel reel | Dato esatto | Fonte |
|---|---|---|
| «Un prodotto da settecentoottantanove euro» | **Prezzo del bene 789,00 €**; importo del credito 789,00 € (nessun anticipo, nessuna spesa aggiunta all'importo) | MediaWorld, pagina Finanziamento, esempio rappresentativo valido 01/11–30/11/2026 |
| «In ventiquattro rate da trentasette euro e venti» | **24 rate da 37,20 €**; finanziamento «da 12 a 48 mesi» come da esempio | stessa |
| «Tasso fisso circa dodici per cento» | **TAN fisso 12,16 %**, **TAEG 12,86 %** | stessa |
| «In tutto paghi ottocentonovantadue euro e ottanta» | **Importo totale dovuto 892,80 €** (= 24 × 37,20) | stessa |
| «Centotré euro e ottanta in più» | 892,80 − 789,00 = **103,80 €** (calcolo nostro, +13,2 %). Pari a **quasi tre rate** (103,80 / 37,20 = 2,79) | calcolo nostro |
| «Prima rata dopo circa trenta giorni» | «Decorrenza media prima rata a 30 giorni» | stessa |

## B. Calcoli (rifatti, python, 11/11/2026)

Flussi: +789 oggi; −37,20 a ogni mese k = 1…24 (prima rata a 30 giorni).

1. Totale pagato: 24 × 37,20 = **892,80 €**. Differenza dal contanti: **103,80 €**.
2. Tasso mensile i che azzera il valore attuale delle rate = 789: **i = 1,0133 % al mese**.
   - TAN implicito = i × 12 = **12,160 %** → dichiarato **12,16 %**: coincide.
   - TAEG = (1 + i)^12 − 1 = **12,861 %** → dichiarato **12,86 %**: coincide.
3. Controllo inverso: rata a TAN 12,16 % su 789 € in 24 mesi = **37,1999 €** → arrotondata **37,20 €**: coincide.
4. Ammortamento: interessi totali ≈ **103,80 €** (tutta la differenza è interesse), debito residuo finale 0.
5. Lettura: poiché il TAEG calcolato dai soli flussi coincide con quello dichiarato, **nell'esempio non ci sono spese nascoste né costi accessori** (se ci fossero, il TAEG sarebbe più alto del TAN-equivalente per effetto delle spese). Questo vale **solo per l'esempio**: spese diverse in un contratto reale vanno lette nel SECCI.
6. Perché TAEG > TAN: il TAEG include la capitalizzazione mensile (12,16 % nominale ≈ 12,86 % effettivo annuo) più le eventuali spese (qui zero). Non è un costo in più nascosto.

## C. Offerta a tasso zero (dove stanno i costi)

| Detto nel reel | Dato esatto | Fonte |
|---|---|---|
| «Anche a tasso zero c'è un conto da fare» | Vivo X Fold 6 e X500 Pro Max, **solo online**: prezzo del bene **1.599,00 €**, **TAN 0 %, TAEG 0 %, 10 rate da 159,90 €**, «Spese e costi accessori azzerati», totale dovuto **1.599,00 €**; valida 29/10–29/11/2026. «Salvo approvazione» di Findomestic | MediaWorld, pagina Finanziamento |
| Costo del tasso zero | Interessi dichiarati: **0 €**. Costo per chi paga: **costo-opportunità**, non un addebito. Valore attuale delle 10 rate (calcolo nostro, con rendimento alternativo ipotetico annuo): 2 % → 1.584,57 € (−14,43 €); 3 % → 1.577,52 € (−21,48 €); 4 % → 1.570,58 € (−28,42 €). Significa che a tasso zero **il valore reale delle rate è un po' inferiore al prezzo**: lo sconto implicito è a favore di chi paga a rate, se il prezzo è lo stesso del contanti | calcolo nostro; i tassi 2–4 % sono **ipotesi didattiche, non dati** |
| Dove potrebbe stare un costo | (a) **prezzo contanti più basso** a parità di bene: **NON VERIFICATO**, nessuna fonte confronta prezzo contanti e prezzo a rate; (b) **vincoli**: «salvo approvazione», merito creditizio; (c) nelle offerte operatore (TIMFin) lo zero è legato a un vincolo di linea (v. sotto) | pagina MediaWorld; TIM |

Esempio di vincolo contrattuale reale (letto, non usato nel calcolo): **TIM, TIMFin tasso zero**, pagina https://www.tim.it/prodotti/nuovo-per-sempre (letta l'11/11/2026, **senza data di validità in pagina**): TAN 0 %/TAEG 0 % «per clienti TIM che mantengono una linea mobile per 24 mesi o che sono titolari di una linea fissa»; in caso di cessazione anticipata della linea mobile l'esempio indica **TAN 14,50 % e TAEG 14,62 %**; nel programma Next Evolution c'è una «rata finale» (Valore Futuro Garantito, 181 € nell'esempio) e l'estinzione anticipata fa perdere il programma. Costi di attivazione: **non indicati** in pagina. Da usare, se mai, solo come riga «a volte lo zero ha una condizione», con data di lettura.

## D. Cosa l'esempio inventato della scheda NON è

- Scheda: «1.000 € in 24 rate da 47 € → TAN circa 11,8 %, TAEG circa 12,5 %». Rifatto: totale **1.128 €**, **+128 €**, TAN implicito **11,84 %**, TAEG **12,51 %**. Corretto, ma è un **esempio inventato**: in sovrimpressione «cifre illustrative, non dati». Se il reel usa i numeri reali (789 / 37,20), il gancio va riscritto di conseguenza («Un prodotto da 789 € a "sole" 37,20 € al mese») o resta quello illustrativo con il caso reale solo come riscontro.

## Immagine d'apertura da confrontare (prova settimana 7)

Proposta: **lo scontrino contro i 24 scontrini.** A sinistra un cartellino prezzo da 789 €; a destra 24 piccole ricevute da 37,20 € che si impilano in una colonna di altezza proporzionale, fino a superare il cartellino: **le ultime tre (quasi) sono interesse**. Alternativa della scheda: lo smartphone di vetro che si spezza in 24 tasselli, con il conteggio finale che supera il prezzo; per tenerla fedele ai dati, i tasselli sono 24 e la somma finale 892,80 contro 789,00 (differenza 103,80 € evidenziata). Il confronto è tra **prezzo in contanti e somma delle rate**, non tra marchi: niente logo.

## Come dirlo a voce

- «Un prodotto da settecentoottantanove euro, in ventiquattro rate da trentasette euro e venti.»
- «In tutto sono ottocentonovantadue euro e ottanta: centotré euro e ottanta in più, quasi tre rate.»
- «Il tasso fisso dichiarato è circa dodici e un sesto per cento; il TAEG, dodici virgola ottantasei.» Più semplice: «circa tredici per cento l'anno».
- «Il TAEG si ritrova dai flussi: è il tasso che rende uguali il prezzo di oggi e le ventiquattro rate.»
- «A tasso zero non paghi interessi, ma non è gratis: contano le condizioni e il prezzo di partenza.»

## Cosa NON si può dire

- NON «lo smartphone da 789 euro»: la pagina dice «prezzo del bene», non smartphone. Dire «un prodotto» o «un acquisto a rate». Per uno smartphone vero c'è il Vivo X Fold 6 a tasso zero (1.599 €).
- NON «MediaWorld ti fa pagare 103,80 euro di più»: gli interessi vanno al finanziatore (**Findomestic**), l'esempio è dell'offerta di credito. Nessun giudizio sull'azienda. Il reel non nomina il marchio (regola: dati, non pubblicità né accuse); la fonte sta nella caption.
- NON «è l'offerta standard di tutti»: è un **esempio rappresentativo** per un importo (789 €) e una durata (24 mesi); da 12 a 48 rate le condizioni cambiano. Il TAEG di un altro importo/durata può differire.
- NON «a tasso zero paghi di più sul prezzo»: nessuna fonte confronta contanti e rate (**NON VERIFICATO**). Dire solo «controlla se il prezzo cambia».
- NON dare i valori al 2–4 % come dato: sono ipotesi didattiche.
- NON dire «è truffa» o «costo nascosto»: il TAEG dichiarato coincide con quello ricalcolato.
- NON dire che la differenza è «tasse»: è interesse (ammortamento).
- NON citare il TAN 14,50 % di TIM come «quanto paghi se rompi il contratto» in generale: è l'esempio di quella pagina, per quel contratto.

## Dubbi aperti

1. **Smartphone vs 789 €**: il caso standard non è un telefono; se serve un telefono dichiarato, usare il Vivo (zero), che però non permette il calcolo del TAEG (è 0). Alternativa: cercare un SECCI di un telefono a tasso positivo (Samsung Smart Line / Cofidis PagoDIL: TAN 9,52 %, TAEG 9,95 % su 199 € in 20 rate da 10,80 € secondo un risultato di ricerca **non letto in fonte primaria**, NON VERIFICATO).
2. **SECCI ufficiale** non scaricato: la pagina cita l'IEBCC ma non ho trovato il PDF; il documento firmato è nel percorso d'acquisto. L'esempio rappresentativo in pagina è la fonte usata.
3. **Validità**: l'offerta scade il 30/11/2026; ricontrollare il 19–20/11 e allineare la caption con la data di lettura.
4. **Gancio**: «47 € al mese» è illustrativo; decidere se riscriverlo sul caso reale.
5. **Revisioni**: nessuna revisione Istat/Eurostat in gioco; unico rischio è che MediaWorld cambi l'offerta.
6. **TIM**: pagina senza data; non usata nei calcoli.

Calcoli rifatti con python (bisezione sul valore attuale), arrotondamenti a 2 decimali sulla rata, a 3 sul tasso.
