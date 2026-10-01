# ART-REVIEW — Cosmo Hotel Palace

Direzione artistica, giudizio finale sull'output reale (non sul codice).
Come ho lavorato: copia di `out/` servita con un server statico, Chromium con SwiftShader e `?3d=forza`,
screenshot a 1440 e 390 px a molti punti di scroll di home (hero alba/mattina/sera, hall a più `p`,
Perché sceglierci, camere, percorso, Grill nei 4 momenti, wellness, congressi con 4 disposizioni, prenota, footer),
hub camere + le tre camere (giorno, sera, pianta, desktop e telefono), congressi (configuratore, tabella, modulo),
ristorazione, wellness, come arrivare, contatti, prenota, menu e bottom sheet del telefono. Confronto con le foto in `/tmp/cosmo-ref/`.
Non ho usato Figma (non autorizzato) né `frontend-design` (non disponibile). Non ho misurato fps su un iPhone vero.

## Voto: 7,5 / 10

Home e pagine camera sono da 8,5. Le pagine interne "di servizio" (ristorazione, wellness, contatti, come arrivare,
hub camere) sono da 6: ordinate e pulite, ma senza un momento visivo sopra la piega. Il sito oggi non sembra "fatto in serie",
ma un cliente che apre solo `/ristorazione` o `/wellness` vede una pagina da template.

## Cosa approvo

- **Identità.** Sabbia, verde pianta, un solo miele, Fraunces + Hanken: coerente con DESIGN.md in tutte le 17 pagine.
  Nessun viola, nessun lime, nessun nero e oro, nessuna emoji, nessun prezzo o stella inventati. Il segno dell'arco regge
  su home, camere, congressi, Grill.
- **Hall (hero).** È il pezzo migliore. Tronco d'ulivo, lucernario con il raggio di sole, porta girevole, tende, divanetti:
  riconoscibile al primo colpo contro `home.jpg`. L'alba e la sera cambiano davvero l'atmosfera (la sera con il tronco
  illuminato e i faretti è un vero "wow"). Poster e 3D coerenti, nessun testo sopra la scena.
- **Camere 3D (Classic).** Beige, testiera, tre stampe, abat-jour, parquet, tenda, scrivania con la sedia forata: si riconosce
  la camera della foto. La sera, con l'arco che diventa quasi nero e le lampade accese, è il momento più bello delle pagine interne.
- **Grill.** Pilastri bruni, canalizzazioni, specchi con cornice scura, lampade miele, sedie forate: riconoscibile. Il cursore
  Mattina/Pranzo/Aperitivo/Sera è fatto bene, e il testo a pranzo dice onestamente "pranzo per eventi".
- **Schede camera in home.** Tre forme diverse (arco stretto, arco largo, due archi): è l'unico punto dove il sito rompe la
  griglia con intenzione, ed è quello che DESIGN.md chiedeva. Le piante isometriche 2D sono piacevoli e leggibili.
- **Perché sceglierci.** Numeri grandi in serif su filetti, niente card: è la risposta giusta al divieto 2.
- **Configuratore congressi.** Serio e utile: 20 sale con misure, disposizioni non valide spiegate (con icona e testo, non solo
  colore), 3D/pianta, "Usa questa configurazione" che precompila il modulo. Qui il sito sembra costare migliaia di euro.
- **Telefono.** Nessuno scroll orizzontale in nessuna pagina, menu chiaro, bottom sheet ben fatto, pillola Prenota rispettosa
  dell'iPhone. Gerarchia tipografica solida: titoli in Fraunces con ritmo, righe corte, spazi generosi.

## Correzioni, in ordine di impatto

### PRIMA della consegna a Davide

1. **Le pagine interne non hanno nulla da guardare sopra la piega.**
   `/ristorazione`, `/wellness`, `/contatti`, `/come-arrivare`, `/camere`: titolone a sinistra, metà schermo a destra vuota,
   200 px di aria in alto. Il diorama (che è il motivo per cui il sito vale) compare solo dopo uno o due scroll.
   Cosa fare: in `src/components/pages/pages.module.css` e nei componenti pagina, mettere nell'hero della pagina il suo diorama o
   poster in cornice ad arco (Grill su `/ristorazione`, wellness su `/wellness`, mappa su `/come-arrivare`, i tre archi su `/camere`),
   e dimezzare il padding alto. Perché: oggi la prima impressione di quattro pagine su sei è "testo su carta".

2. **La scheda "Pianta" è il punto più debole delle camere.**
   (a) Se si passa a Pianta dopo aver scelto Sera, la pianta resta su arco nero e il selettore Giorno/Sera sparisce: l'utente
   non sa come tornare chiaro (DESIGN §6: piante a tratto su sabbia). Forzare la Pianta sempre sul tono giorno, o mantenere il
   selettore. (b) Mancano le quote in metri (DESIGN §6 le chiede: "le misure dichiarate compaiono sulle piante"): c'è solo "22 m²".
   (c) Nell'hub `/camere` le tre piante sono impilate in 400 px a sinistra con il 70% della riga vuoto e un tratto nero pesante,
   senza etichette di stanza: allinearle in tre colonne sotto la tabella di confronto, tratto 1,5 px come da DESIGN.
   File: `src/components/art/FloorPlan.tsx`, `src/components/rooms/rooms.module.css`.

3. **Griglie di schede tutte uguali (divieto 2).**
   `/ristorazione`: 6 riquadri bordati identici (Travi, Lampade, Tavoli, Specchi, Rami, Cemento). `/camere/<camera>`: 7 riquadri
   "Punti della camera" che ripetono gli hotspot e la lista Dotazioni (Wi-Fi/TV/cassaforte compaiono tre volte nella stessa pagina).
   `/centro-congressi`: 3 card identiche Costellazioni/Divinità/Eventi con la stessa barretta verde in alto (e la stessa lista c'è
   già in home). `/contatti`: 4 colonne identiche Chiama/Scrivi.
   Cosa fare: trasformarli in liste a filetti con voce grande, come "Perché sceglierci"; togliere "Punti della camera" (o la
   colonna Dotazioni, non entrambe); per Costellazioni/Divinità/Eventi usare una riga con numero (500 / 5 sale / su misura).

4. **Suite e Family: la camera è piccola nell'arco.**
   La stanza occupa circa un terzo dell'altezza della cornice, con un grande vuoto sopra e sotto; a 390 px gli hotspot da 44 px
   coprono la stanza (si vedono 7 cerchi su una camera alta 90 px). Cosa fare: in `src/scenes/rooms` inquadrare per larghezza
   (zoom più stretto o cornice 4:3 per le stanze da 44 m²), oppure mostrare solo 3 hotspot sul telefono e il resto nell'elenco.

5. **Barra di prenotazione e pillola coprono il contenuto.**
   Desktop: la barra da 100 px è sempre in basso, anche sopra titoli e chip (`Nei dintorni`, `Il percorso del 6° piano`, `Tre modi`):
   in quasi ogni screenshot taglia un titolo. Farla ritirare a una linguetta "Prenota" dopo due secondi di scroll fermo, o
   nasconderla nelle sezioni che hanno già un modulo (home "Ti aspettiamo", congressi `#richiesta`). I pulsanti "−" disabilitati
   hanno bordo tratteggiato e sembrano rotti: usare il fondo `--bg-sunk` pieno, senza tratteggio.
   Telefono: su `/centro-congressi` la pillola "Richiedi una proposta" si sovrappone a "Usa questa configurazione" e ai campi del
   modulo; va nascosta o spostata quando c'è un pulsante primario nella vista.
   File: `src/components/booking/*`.

6. **Il segno dell'arco non è applicato dappertutto.**
   Il diorama del wellness in `/wellness` è un rettangolo con angoli arrotondati (in home è un arco). La mappa del percorso in
   `/come-arrivare` sta in un rettangolo, in home in una composizione libera. Il Grill in `/ristorazione` è un arco ma a sinistra,
   in home a destra. Uniformare con `--r-arco` e fissare una regola (diorama a destra su desktop, tranne alternanza dichiarata).

7. **Diorama Grill: manca la finestra ad arco e le lampade sono piccole.**
   Nella foto la forza della sala sono le grandi finestre ad arco con tenda velata e le lampade enormi; nel 3D di giorno la sala
   sembra una cantina senza luce naturale. Aggiungere sulla parete di fondo una finestra ad arco con velo che si accende in
   Mattina/Pranzo, e ingrandire i paralumi di circa il 60%. Inoltre `/ristorazione` parte con il cursore su "Sera" mentre la home
   parte su "Mattina": scegliere un solo stato iniziale (consiglio Aperitivo, è la luce più bella). File: `src/scenes/grill`.

8. **Ordine e nomi incoerenti.**
   Camere: home = Classic, Suite, Family; hub e linguette = Classic, Family, Suite. Righe dati: home = letti/ospiti/bagni,
   hub = ospiti/letti/bagni. Ristorante: nav desktop "Ristorante", menu telefono e footer "Cosmo Grill & Lounge", pagina
   "Ristorazione". Scegliere un ordine (consiglio Classic, Family, Suite, cioè per capienza) e un nome ("Ristorante" nella nav,
   "Cosmo Grill & Lounge" come titolo) e usarli ovunque. File: `src/content`, `src/components/shell/nav-items.ts`.

9. **Hall, primo fotogramma: il basamento vuoto.**
   Il 28% inferiore dell'arco è una lastra piatta beige (viola-grigia di sera) senza niente: sembra un errore di inquadratura.
   Abbassare la camera di iniziale, o mettere sulla lastra il percorso d'ingresso, il tram 31 o due vasi. Nel poster SVG e nel 3D.

10. **"Perché sceglierci": righe a ritmo irregolare.**
    La prima riga aperta (2 km) è alta il doppio delle altre, con l'illustrazione del tram sola in basso a destra; le voci testuali
    (Wi-Fi gratuito, Senza barriere, Una famiglia) sono nello stesso corpo dei numeri ma con baseline diverse dal sottotitolo.
    Allineare numero/titolo e descrizione sulla stessa linea di base, altezza riga fissa, riga aperta solo su richiesta
    (oggi è aperta di default). File: `src/components/home`.

### DOPO la consegna (non bloccanti)

11. **Footer.** Le intestazioni HOTEL / CONTATTI / ESPLORA / SEGUICI sono in Fraunces maiuscolo spaziato: DESIGN vieta il serif
    in maiuscolo e chiede label in Hanken 600. Inoltre tutti i link sono sottolineati: sembra un modulo, non una chiusura.
    Sottolineatura solo al passaggio, spazio più respirato. È anche la parte meno "disegnata" del sito: un arco o il tram 31
    in linea sottile aiuterebbe.

12. **Mappa del percorso (`RouteMap.tsx`).** È il disegno meno rifinito: l'etichetta "Tang. Nord" si sovrappone alla strada
    tratteggiata, "Tang. Est" e "A4" galleggiano senza ancoraggio, il cerchio "Milano" è fantasma. Pulire le etichette
    (posizione e sfondo sabbia) e portare il tratto allo stesso peso delle piante.

13. **Hall in scroll.** Il testo a sinistra resta fermo per circa tre schermate mentre la scena a destra si muove. Far cambiare una
    didascalia di una riga con `p` (Ingresso, Tronco d'ulivo, Lucernario). Regola 12 rispettata (scroll nativo): è un'aggiunta di valore.

14. **Congressi, 3D della platea.** Dall'alto le sedie sono puntini rosa-salmone: la foto ha sedute beige-tortora su moquette e
    pilastri oro. Riportarle a `#D2BEA8` come da DESIGN §5.2 e dare ai pilastri il `#C9A862`. Il poster 2D dell'hero della pagina
    (frontale, con i pilastri oro) è più riuscito del 3D: usare lo stesso punto di vista come seconda inquadratura. Nelle statistiche
    "oltre 900 m²" e "fino a 900 persone" affiancate sembrano lo stesso dato: aggiungere un'etichetta più chiara.

15. **Contenuti e prove ancora da fare.** Logo e colori ufficiali; foto con licenza (se esistono) in cornice ad arco; il campo data
    mostra `mm/dd/yyyy` nel mio browser (probabile effetto del locale del browser di prova, non verificato su un browser italiano:
    controllare e, se serve, forzare `lang="it"`/formato); chip alti 40 px (DESIGN §4.5 li accetta se l'area di tocco arriva a 44:
    non l'ho misurata); verificare su iPhone reale fps e memoria. Controllare anche "Plenaria delle Divinità: fino a 440" nella
    tabella contro il BRIEF ("fino a 400"): la tabella pubblicata e il brief non coincidono.

## I 13 divieti, esito

| # | Divieto | Esito |
|---|---|---|
| 1 | Gradienti viola/blu/neon | Rispettato (solo alone miele e fascia sotto il testo) |
| 2 | Carte tutte uguali / tre feature identiche | **Violato in 4 pagine** (correzione 3); rispettato in home |
| 3 | Testo su immagine senza pannello | Rispettato: il testo sta sempre su fondo pieno |
| 4 | Nero e oro, serif maiuscolo sottile, effetto spa | Rispettato nel corpo; **footer in serif maiuscolo** (correzione 11) |
| 5 | Lime, #080b0e, mono maiuscolo, wormhole | Rispettato |
| 6 | Emoji / icone di librerie diverse | Rispettato (un solo set a tratto) |
| 7 | Stelle, punteggi, prezzi, scarsità | Rispettato |
| 8 | backdrop-filter, will-change diffusi, più canvas | Nessun backdrop-filter usato (solo la base Tailwind nel CSS); un solo canvas non verificato su telefono vero |
| 9 | Foto stock / foto del sito vecchio | Rispettato |
| 10 | Più di un miele pieno per schermata | Rispettato in tutti gli screenshot |
| 11 | Informazione solo nel colore o nell'hover | Rispettato: stati con icona e testo, elenco testuale per gli hotspot |
| 12 | Carosello automatico, scroll-jacking | Rispettato: scroll nativo |
| 13 | Corpo sotto 16 px, label sotto 12, tocco sotto 44 | Label a 12 px (minimo); chip a 40 px di altezza (vedi 15) |

Stato: **da correggere** per le voci 1-10 prima di mostrarlo a Davide; l'impianto è solido e le correzioni sono di montaggio e rifinitura, non di direzione.
