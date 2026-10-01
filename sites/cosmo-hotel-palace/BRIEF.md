# BRIEF — Rifacimento sito Cosmo Hotel Palace

Cliente finale: Cosmo Hotel Palace (sito attuale: https://www.cosmohotelpalace.it/, costruito da Amadeus).
Committente del lavoro: Davide. Obiettivo: un sito nuovo da "migliaia di euro": professionale, innovativo, animato con lo scroll,
molto interattivo, perfetto sia da telefono sia da computer. Lingua: italiano (inglese in seconda fase, `/en` esiste già sul sito vecchio).

## Cosa chiede Davide (parole sue, riassunte)
- Capire l'hotel dalle foto e dal sito e **ricostruire gli ambienti in modo interattivo, artificialmente** (non riusare le foto).
- Scroll con animazioni che mostrano tutto l'hotel; **le camere esplorabili in modo interattivo**.
- Bottoni che cambiano sezione/contenuto; **sezione prenotazioni** curata.
- Idee libere: es. «Perché sceglierci», cose da sperimentare. Sfruttare la massima potenza.

## Decisioni già prese (non rimetterle in discussione senza motivo)
1. **Niente foto del sito vecchio nel repo.** Le foto sono di un fotografo (Simona Bruno) e il repo `davideaa/noway` è pubblico.
   Si usano solo come riferimento (luce, materiali, pianta) e gli ambienti si **ricostruiscono da zero**: 3D con three / @react-three/fiber, SVG, CSS.
   Se in futuro il cliente fornisce le foto con licenza, si aggiungono a parte.
2. **Prenotazioni:** il motore vero è VerticalBooking
   (`https://reservations.verticalbooking.com/premium/index2.html?id_albergo=146&dc=785&lingua_int=ita&id_stile=19500`).
   Il sito costruisce un widget proprio (date, camere, adulti, bambini) e al «Cerca» apre il motore vero con i dati scelti. Non si inventa disponibilità né prezzi.
   Verificare i nomi dei parametri data del motore; se non confermabili, aprire il motore e dichiararlo.
3. **Niente numeri o recensioni inventati.** Solo i dati qui sotto. Niente stelle, premi, punteggi, percentuali "soddisfazione".
4. Mobile-first sul serio: lezioni del progetto Portfolio (`sites/studio/STUDIO.md` sez. 3): pochi layer compositi, niente `will-change` diffuso,
   niente `backdrop-filter` su touch, WebGL solo quando la sezione è in vista, qualità adattiva misurata in fps.
5. `prefers-reduced-motion` rispettato. Contrasti AA. Hotel «senza barriere architettoniche»: il sito deve essere accessibile.
6. Next.js 16: leggere `node_modules/next/dist/docs/` prima di scrivere codice Next (API cambiate). Export statico.

## Dati veri dell'hotel (fonte: sito attuale)
- **Nome:** Cosmo Hotel Palace — Hotel & Centro Congressi. «Lo stile italiano dell'ospitalità alle porte di Milano», impresa familiare italiana.
- **Indirizzo:** Via F. De Sanctis, 5 — 20092 Cinisello Balsamo (Milano). **A 2 km da Milano.** CIN: IT015077A1P24TCBBO
- **Contatti:** tel +39 02 617771 · info@cosmohotelpalace.it · Eventi: events@cosmohotelpalace.it, +39 02 61 777 726 · Commerciale: sales@cosmohotelpalace.it, +39 02 61 777 686
- **Social:** instagram.com/cosmohotelpalace · facebook (profilo id 100071873230654) · hashtag #YOURCOSMOHOTELPALACE
- **Architettura:** esterno classico; interni con volumi ampi e luminosi, design contemporaneo. Hall con grande lucernario e una scultura di tronco d'ulivo; vetrate; tende bianche.
- **201 camere e suite.** Struttura senza barriere architettoniche. Toni naturali/neutri (beige, sabbia), parquet in rovere, testiere imbottite, lampade a pieghe, stampe incorniciate, fiori freschi.
- **Camere:**
  - *Classic Double Room* — 22 m², 1 letto matrimoniale 160 cm, 2 adulti, bagno con vasca o doccia.
  - *Family Room* — 44 m², 2 camere Classic comunicanti (una matrimoniale, una con due letti singoli), ognuna con bagno (vasca o doccia); 2 adulti + 2 bambini; letto singolo extra o culla su richiesta.
  - *Suite* — 44 m², due ambienti con ingressi separati: zona soggiorno (divano letto, ampia scrivania, piccole riunioni) + camera matrimoniale con armadio; due bagni separati (vasca o doccia); 4 adulti oppure 2 adulti + 2 bambini; coffee maker con prodotti selezionati, ricco set di cortesia, accappatoio, pantofole, stirapantaloni, cassaforte.
  - Comuni: Wi-Fi gratuito, TV satellitare (28 canali stranieri, Sky TV e Sky Sport), climatizzazione regolabile, set di cortesia, cassaforte, minibar con rifornimento dal distributore self-service al piano.
- **Ristorazione:** *Cosmo Grill* (cucina contemporanea ispirata alla tradizione milanese, aperto ogni sera anche ai non ospiti, menu à la carte; a pranzo per eventi aziendali e privati) e *Lounge Bar* (caffè, tè del pomeriggio, aperitivo, happy hour). Ambiente: cemento lisciato, travi e canalizzazioni a vista, lampade ad abat-jour color miele, tavoli bianchi, sedie in alluminio forato, specchi con cornice scura, rami secchi.
- **Centro Congressi:** oltre 900 m², fino a 900 persone, 13 sale modulabili con pareti mobili, su due piani, luce naturale, tecnologia all'avanguardia, team dedicato.
  - *Plenaria delle Costellazioni* (piano terra): 25×20 m, 500 m², h 4,22 m, platea 500, banchetto 450; modulabile fino a 8 sale.
  - *Plenaria del Sole*: 18,5×17,5 m, 325 m², h 4,22 m, platea 400, banchi di scuola 188, ferro di cavallo 188, banchetto 300.
  - *Oro* (plenaria): 7,1×18,5 m, 147 m², platea 180, banchi 70, ferro di cavallo 70, banchetto 140.
  - *Sala plenaria delle Divinità* (piano inferiore): fino a 400 persone, divisibile in 5 sale. Le altre sale (Argento ecc.) e i dati completi sono nella pagina `/meeting-ed-eventi` del sito vecchio: rileggerla per la tabella intera, non inventare.
  - 200 posti auto gratuiti + area bus.
- **Wellness & Fitness (6° piano):** sauna finlandese, bagno turco; sala attrezzi con 2 tapis roulant (14 programmi), cyclette, chest press, pulldown, leg extension. Aperto tutti i giorni 7:00–22:00.
- **Come arrivare:** A4 Milano–Venezia, Tangenziale Est e Nord. Tram 31 a pochi passi → metro M5 fermata Bignami (poche fermate). Rho Fiera, Milano City Fiera, MiCo, stazioni Sesto FS e Milano Centrale, aeroporti Linate, Malpensa, Orio al Serio. Parcheggio 200 posti.
- **Nei dintorni:** Duomo di Milano, Corso Vittorio Emanuele II, Galleria Vittorio Emanuele II, Castello Sforzesco, Pinacoteca di Brera, Cenacolo Vinciano; Reggia di Monza, Parco di Monza (700 ha, 14 km di mura), Autodromo (GP d'Italia), Duomo di Monza e Corona Ferrea, Arengario; Leolandia (25 min); Como, Lago di Como, Villa Carlotta.
- **Partner:** Cosmo Hotel Torri, Cosmo Residence, Villa Trivulzio.
- Privacy policy: pagina esistente sul sito vecchio.

## Idee di partenza da sviluppare (il team può cambiarle, migliorarle, scartarle con motivo)
- **Hero:** ingresso nella hall ricostruita in 3D (lucernario, tronco d'ulivo come scultura-simbolo, luce che cambia dall'alba alla sera con uno slider).
- **Camere interattive:** per ogni tipologia un diorama 3D esplorabile (trascina per ruotare, hotspot su letto, scrivania, bagno, finestra), pianta in scala dei m² con i metri veri, giorno/sera, confronto affiancato Classic/Suite/Family, «chi sei?» (coppia, famiglia, lavoro) che consiglia la camera.
- **Il Cosmo a 2 km da Milano:** mappa/percorso animato verso il Duomo, tram 31 → M5, tempi non inventati (solo dove dichiarati dal sito: «2 km», «poche fermate»).
- **Centro congressi configuratore:** scegli la sala e la disposizione (platea, banchi di scuola, ferro di cavallo, banchetto) e vedi le sedie disporsi, con la capienza vera dalla tabella; pareti mobili che dividono la plenaria; «Richiesta di proposta» precompilata.
- **Cosmo Grill & Lounge:** una giornata scorrevole (caffè → pranzo → aperitivo → cena) con la luce dell'ambiente che cambia.
- **Wellness:** il 6° piano come percorso (sauna, turco, fitness), orari 7–22 con indicatore «aperto ora».
- **Perché scegliere noi:** sezione interattiva con soli fatti veri (2 km da Milano, 201 camere, 900 posti, 200 parcheggi gratis, Wi-Fi gratuito, senza barriere, impresa familiare).
- **Prenotazione sempre a portata:** barra sticky su desktop, pannello a scorrimento su telefono; «migliori tariffe garantite» è scritto sul sito vecchio come claim dell'hotel: si può riusare solo come claim del cliente, da confermare.
- **Contatti per reparto** (prenotazioni, eventi, commerciale) con tap-to-call/mail.
- Idee extra libere: itinerari «un weekend da Cosmo» (Milano, Monza, Como) con scorrimento orizzontale; modalità «viaggio di lavoro» vs «viaggio di piacere» che riordina la home.

## Da chiedere a Davide / al cliente (non bloccanti: il sito parte con un default dichiarato)
1. Logo e colori ufficiali dell'hotel (nel sito vecchio il logo è un'immagine; si parte da una palette neutra caldo-sabbia coerente con gli interni, da confermare).
2. Il nome/dominio/hosting finale e se il motore VerticalBooking resta.
3. Orari reali di Cosmo Grill e Lounge Bar (non sono sul sito vecchio).
4. Prezzi: nessuno mostrato. Si vuole un «da €» (serve dato)?
5. Inglese e altre lingue: seconda fase.
6. Foto con licenza da affiancare agli ambienti ricostruiti, se esistono.

## Consegna
Anteprima animata mandata presto (Davide vuole vedere, non leggere). Elenco breve di cosa è cambiato, cosa NON è stato verificato, poi domanda cosa cambiare.
