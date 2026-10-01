/**
 * Tutte le stringhe dei componenti, raggruppate per sezione, con chiavi stabili.
 * Fonte: COPY.md (v1, 1 ottobre 2026). Dove DECISIONI.md o UX.md correggono COPY, vince il documento
 * con più autorità (DECISIONI > BRIEF > UX > DESIGN > MOTION > COPY) e il punto è commentato.
 *
 * Convenzioni
 * - `{nome}` = valore dinamico: si riempie con `fmt()` (qui sotto).
 * - `// NUOVO TESTO` = testo scritto qui perché COPY non lo ha (UX 15, DECISIONI 12).
 * - `// DA CONFERMARE` = dato non confermato dal cliente: il testo è il ripiego onesto di COPY.
 * - I testi `[DA CONFERMARE: …]` di COPY non compaiono mai come testo visibile.
 *
 * Non qui di proposito (non servono nella fase 1, UX 2.1): /dintorni/, «Un weekend da Cosmo»,
 * banner cookie, mappa incorporata (DECISIONI 8), pulsante «Metti in pausa l'animazione» (UX 11.3),
 * aiuto «Dai 18 anni» sugli adulti (non confermato), claim «migliori tariffe garantite» (DA CONFERMARE:
 * il cliente lo vuole ancora?), «4 stelle», prezzi, orari di Grill e Lounge, check-in/out.
 */

/* ------------------------------------------------------------------ */
/* Utilità (pure)                                                      */
/* ------------------------------------------------------------------ */

/** Riempie `{chiave}` con i valori. Una chiave mancante resta com'è, così l'errore si vede. */
export function fmt(modello: string, valori: Readonly<Record<string, string | number>>): string {
  return modello.replace(/\{(\w+)\}/g, (intero, chiave: string) =>
    Object.prototype.hasOwnProperty.call(valori, chiave) ? String(valori[chiave]) : intero,
  );
}

/** Singolari e plurali corretti (COPY 4.2). */
export const plurale = {
  notti: (n: number): string => (n === 1 ? "1 notte" : `${n} notti`),
  camere: (n: number): string => (n === 1 ? "1 camera" : `${n} camere`),
  adulti: (n: number): string => (n === 1 ? "1 adulto" : `${n} adulti`),
  bambini: (n: number): string => (n === 1 ? "1 bambino" : `${n} bambini`),
} as const;

/** «{n} notti, dal {data} al {data}.» (COPY 4.2, aria-live). */
export function riepilogoNotti(notti: number, dal: string, al: string): string {
  return `${plurale.notti(notti)}, dal ${dal} al ${al}.`;
}

/** «{n} camere · {a} adulti · {b} bambini» (COPY 4.2). */
export function riepilogoPersone(camere: number, adulti: number, bambini: number): string {
  return `${plurale.camere(camere)} · ${plurale.adulti(adulti)} · ${plurale.bambini(bambini)}`;
}

/* ------------------------------------------------------------------ */
/* Contenuti                                                           */
/* ------------------------------------------------------------------ */

export const copy = {
  /* ------------------------------ Sito ------------------------------ */
  sito: {
    nome: "Cosmo Hotel Palace",
    qualifica: "Hotel & Centro Congressi",
    slogan: "Lo stile italiano dell'ospitalità, alle porte di Milano.",
    skipLink: "Vai al contenuto",
    // NUOVO TESTO (UX 11.3: aria-label del livello con i bottoni degli hotspot)
    ariaPuntiScena: "Punti della scena",
  },

  /* ------------------------- Azioni comuni -------------------------- */
  azioni: {
    cercaDisponibilita: "Cerca disponibilità",
    esploraHotel: "Esplora l'hotel",
    vediCamere: "Vedi le camere",
    scopriCongressi: "Scopri il Centro Congressi",
    prenota: "Prenota",
    chiamaHotel: "Chiama l'hotel",
    tornaAllaHome: "Torna alla home",
    tornaSu: "Torna all'inizio della pagina",
    // NUOVO TESTO (UX 4.3 scena 4: pulsante verso /come-arrivare/)
    comeArrivare: "Come arrivare",
    // NUOVO TESTO (UX 4.1: Carica la vista 3D con saveData o poca memoria)
    caricaVista3D: "Carica la vista 3D",
  },

  /* ------------------------ Navigazione (UX 3) ----------------------- */
  nav: {
    // UX 3.1: voci dell'header desktop
    header: {
      camere: "Camere",
      congressi: "Congressi",
      ristorante: "Ristorante",
      wellness: "Wellness",
      contatti: "Contatti",
      prenota: "Prenota",
    },
    // UX 3.2: menu del telefono
    menu: {
      // NUOVO TESTO (UX 3.2)
      apri: "Menu",
      // NUOVO TESTO (UX 3.2)
      chiudi: "Chiudi il menu",
      voci: {
        camere: "Camere",
        congressi: "Centro Congressi",
        ristorazione: "Cosmo Grill & Lounge",
        wellness: "Wellness",
        contatti: "Contatti",
      },
      chiama: "Chiama +39 02 617771",
      scrivi: "Scrivi a info@cosmohotelpalace.it",
      comeArrivare: "Come arrivare",
      privacy: "Privacy",
    },
    // UX 5.2: <nav aria-label="Tipi di camera"> (NUOVO TESTO: etichetta non in COPY)
    ariaTipiCamera: "Tipi di camera",
  },

  /* -------------------------- 1. Hero (hall) ------------------------- */
  hero: {
    eyebrow: "A 2 km da Milano",
    h1: "Lo stile italiano dell'ospitalità, alle porte di Milano.",
    sottotitolo:
      "Cosmo Hotel Palace è un hotel e Centro Congressi a Cinisello Balsamo. Lo gestisce una famiglia italiana. Ha 201 camere e suite.",
    corpo:
      "Fuori, un'architettura classica. Dentro, volumi ampi e luminosi, design contemporaneo. Entra nella hall e scorri.",
    ctaPrimaria: "Cerca disponibilità",
    ctaSecondaria: "Esplora l'hotel",
    luce: {
      etichetta: "Ora del giorno",
      valori: ["Alba", "Mattina", "Pomeriggio", "Sera"],
      ariaSlider: "Ora del giorno nella hall: {valore}. Cambia la luce della scena.",
    },
    ariaDiorama:
      "Ricostruzione 3D della hall del Cosmo Hotel Palace: un grande lucernario sopra una scultura in tronco d'ulivo, vetrate e tende bianche. La luce cambia dall'alba alla sera.",
    nota: "Ricostruzione illustrativa, non una fotografia.",
    istruzione: "Trascina per guardarti intorno.",
    istruzioneTastiera: "Usa le frecce per ruotare la vista.",
    ridottoMovimento: "Animazione ridotta. Usa lo slider per cambiare la luce.",
    comeViaggi: {
      etichetta: "Come viaggi?",
      lavoro: "Per lavoro",
      piacere: "Per piacere",
      // {tipo} = «lavoro» | «piacere»
      conferma: "Home riordinata per un viaggio di {tipo}.",
    },
  },

  /** aria-label di ogni hotspot (COPY sez. 1): `{titolo}: apri la didascalia`. */
  hotspot: {
    aria: "{titolo}: apri la didascalia",
  },

  /* ----------------------- 2. Perché sceglierci ---------------------- */
  perche: {
    h2: "Sette cose vere, senza giri di parole.",
    sottotitolo: "Quello che trovi al Cosmo, in ordine di quanto ti serve quando arrivi.",
    // UX 4.3 scena 2 e 15.2 correggono COPY («Tocca una scheda per vedere dove si trova nell'hotel»).
    // NUOVO TESTO
    intro: "Tocca una scheda per i dettagli.",
    ctaCamere: "Vedi le camere",
    ctaCongressi: "Scopri il Centro Congressi",
    // Testi delle schede: facts.ts
  },

  /* ------------------------------ 3. Camere --------------------------- */
  camere: {
    h1: "Camere e suite",
    sottotitolo: "201 camere, tre tipologie. Scegli quella che somiglia al tuo viaggio.",
    corpo:
      "Stile contemporaneo, toni naturali, dettagli curati. In ogni camera: Wi-Fi gratuito, TV satellitare (28 canali stranieri, Sky TV e Sky Sport), climatizzazione regolabile, set di cortesia, cassaforte e minibar. Il minibar si rifornisce al distributore self-service del piano. L'hotel è senza barriere architettoniche.",
    notaDiorama:
      "Ricostruzione 3D illustrativa. Arredi e proporzioni sono indicativi: le misure in metri quadri sono quelle reali.",
    // UX 11.4 e 15.1 correggono COPY («Pizzica per avvicinarti», «+ e −»): lo zoom è bloccato (DECISIONI 2).
    // NUOVO TESTO
    comandi: "Trascina per ruotare · Tocca i punti per i dettagli",
    // NUOVO TESTO
    comandiTastiera: "Frecce per ruotare, Tab per passare da un punto all'altro.",
    controlli: {
      giornoSera: {
        giorno: "Giorno",
        sera: "Sera",
        // {valore} = «giorno» | «sera»
        aria: "Luce della camera: {valore}",
      },
      vista: {
        tre_d: "3D",
        pianta: "Pianta",
        // {vista} = «camera in 3D» | «pianta in scala»
        aria: "Mostra la {vista}",
        ariaVista3D: "camera in 3D",
        ariaVistaPianta: "pianta in scala",
      },
      // NUOVO TESTO (UX 5.2: pulsanti ◀ ▶ e «Ripristina vista»)
      ruotaSinistra: "Ruota la camera a sinistra",
      ruotaDestra: "Ruota la camera a destra",
      ripristinaVista: "Ripristina vista",
    },
    // NUOVO TESTO (UX 5.2: titoli dei blocchi della pagina camera)
    puntiTitolo: "Punti della camera",
    schedaTecnicaTitolo: "Scheda tecnica",
    comuniTitolo: "In ogni camera",
    esploraCamera: "Esplora la camera",
    // NUOVO TESTO (UX 4.3 scena 3)
    consigliataPerTe: "Consigliata per te",
    vediTreCamere: "Vedi le tre camere",
    consigliere: {
      titolo: "Chi viaggia?",
      sottotitolo: "Dicci chi sei, ti diciamo da dove cominciare.",
      opzioni: {
        coppia: "Una coppia",
        famiglia: "Una famiglia",
        lavoro: "Lavoro",
        quattroAdulti: "Quattro adulti",
      },
      risposte: {
        coppia: { camera: "Classic Double Room.", testo: "22 m², letto matrimoniale da 160 cm, bagno con vasca o doccia." },
        famiglia: { camera: "Family Room.", testo: "44 m², due camere comunicanti con due bagni. Fino a 2 adulti e 2 bambini." },
        lavoro: { camera: "Suite.", testo: "Zona soggiorno con ampia scrivania, anche per piccole riunioni, e camera separata." },
        quattroAdulti: { camera: "Suite.", testo: "Letto matrimoniale più divano letto: fino a 4 adulti." },
      },
      chiusura:
        "È un consiglio, non un obbligo. Sul motore di prenotazione vedi quello che c'è davvero libero nelle tue date.",
      // {camera} = nome della camera consigliata
      vedi: "Vedi {camera}",
      confrontaLeTre: "Confronta le tre",
    },
    confronto: {
      titolo: "Le tre camere a confronto",
      righe: {
        superficie: "Superficie",
        letti: "Letti",
        ospiti: "Ospiti",
        ambienti: "Ambienti",
        bagni: "Bagni",
        extra: "Extra",
      },
      // Pulsante di riga: `Cerca {nome}`
      cerca: "Cerca {nome}",
      // UX 5.1 e 15.3: sotto i 600 px non si scorre di lato, si scelgono due camere. NUOVO TESTO
      scegliDue: "Scegli due camere da confrontare.",
      // NUOVO TESTO (UX 5.1)
      proporzioni: "Proporzioni indicative. Le superfici totali sono quelle reali.",
    },
    stati: {
      caricamento: "Stiamo preparando la scena…",
      fallback3D: "La vista 3D non è disponibile su questo dispositivo. Ecco la versione semplificata.",
    },
    // Testi delle singole camere (h1, sottotitolo, corpo, scheda tecnica, aria): rooms.ts
    // Dotazioni comuni: rooms.ts (`dotazioniComuni`)
  },

  /* ----------------------------- 4. Prenotazione ---------------------- */
  prenota: {
    pagina: {
      h1: "Prenota il tuo soggiorno",
      sottotitolo:
        "Scegli date e ospiti. Ti portiamo sul motore di prenotazione del Cosmo, dove vedi disponibilità e tariffe aggiornate.",
      nota: "Il sito non mostra prezzi né disponibilità: li trovi sul motore di prenotazione ufficiale, che si apre in una nuova scheda.",
      // COPY 12: riga breve sotto il widget
      motoreEsterno: "Aprendo il motore di prenotazione lasci il sito del Cosmo. Lì valgono le regole di quel servizio.",
    },
    pannello: {
      pillola: "Prenota",
      titolo: "Il tuo soggiorno",
      ariaChiudi: "Chiudi il pannello di prenotazione",
    },
    campi: {
      arrivo: { etichetta: "Arrivo", aiuto: "Scegli prima l'arrivo, poi la partenza." },
      partenza: { etichetta: "Partenza" },
      camere: { etichetta: "Camere" },
      // Aiuto «Dai 18 anni»: NON mostrare (DA CONFERMARE: età adulti nel motore). UX 6.1.
      adulti: { etichetta: "Adulti" },
      // DA CONFERMARE: il motore chiede le età? UX 6.5: non le chiediamo, ma l'avviso resta onesto.
      bambini: { etichetta: "Bambini", aiuto: "Le età dei bambini si indicano sul motore di prenotazione." },
      placeholderData: "gg/mm/aaaa",
      // {tipo} = «arrivo» | «partenza»
      ariaCalendario: "Scegli la data di {tipo}. Usa le frecce per cambiare giorno.",
      // NUOVO TESTO (UX 6.1)
      partenzaSpostata: "Partenza spostata a {data}.",
    },
    barra: {
      arrivo: "Arrivo",
      partenza: "Partenza",
      camere: "Camere",
      adulti: "Adulti",
      bambini: "Bambini",
      cerca: "Cerca disponibilità",
    },
    errori: {
      arrivoMancante: "Scegli la data di arrivo per continuare.",
      partenzaMancante: "Scegli anche la data di partenza.",
      partenzaNonDopo: "La partenza deve essere dopo l'arrivo. Scegli un'altra data.",
      arrivoPassato: "Questa data è già passata. Scegli da oggi in avanti.",
      nessunAdulto: "Serve almeno un adulto.",
      // NUOVO TESTO (UX 6.2)
      cameraSenzaAdulto: "Ogni camera ha bisogno di almeno un adulto: aggiungi adulti o riduci le camere.",
      // Ripiego di COPY 4.3 (DA CONFERMARE: regola di capienza nel motore): avviso, non blocca.
      capienzaAvviso: "Il motore verifica la capienza delle camere.",
      // Riepilogo errori in cima: `Ci sono {n} campi da controllare.` (COPY 8.3, stesso schema)
      riepilogo: "Ci sono {n} campi da controllare.",
    },
    stati: {
      pronto: "Cerca disponibilità",
      apertura: "Stiamo aprendo il motore di prenotazione…",
      aperto: "Il motore di prenotazione si è aperto in una nuova scheda.",
      // Non può succedere con un vero <a target="_blank"> (UX 6.3); tenuto per sicurezza.
      popupBloccato: "Il browser ha bloccato la nuova scheda. Apri il motore da qui.",
      apriMotore: "Apri il motore di prenotazione",
      offline: "Non riusciamo a raggiungere il motore di prenotazione. Riprova tra poco, oppure chiama +39 02 617771.",
      // Piano B: da usare finché ENGINE_PARAMS_VERIFIED=false (DECISIONI 9).
      parametriNonVerificati: "Il motore si apre con la sua ricerca. Inserisci di nuovo le date.",
      // DECISIONI 9 + UX 6: «Scegli le date sul motore» (nota onesta quando si apre con i soli id)
      // NUOVO TESTO
      scegliDateSulMotore: "Scegli le date sul motore.",
    },
    riepilogo: {
      // {camera} = nome della camera scelta (COPY 4.6)
      cameraScelta: "Hai scelto: {camera}. Aggiungi le date per cercare.",
      // NUOVO TESTO (UX 3.3: segno «Camera: Family Room ✕»; il ✕ è un'icona)
      segnoCamera: "Camera: {nome}",
      // NUOVO TESTO
      ariaTogliCamera: "Togli la camera scelta",
      // NUOVO TESTO (UX 5.3 punto 4)
      cercaSulMotore: "Sul motore cerca la {camera} tra le camere disponibili.",
    },
    alternativaUmana: {
      titolo: "Preferisci parlare con qualcuno?",
      corpo: "L'Ufficio Prenotazioni risponde per telefono e per email.",
      chiama: "Chiama +39 02 617771",
      scrivi: "Scrivi a info@cosmohotelpalace.it",
      // DA CONFERMARE: orari dell'Ufficio Prenotazioni → nessun orario scritto.
    },
  },

  /* ---------------------- 6. Cosmo Grill & Lounge --------------------- */
  ristorazione: {
    h1: "Cosmo Grill & Lounge",
    sottotitolo:
      "Cucina contemporanea ispirata alla tradizione milanese, e un bar per ogni momento della giornata.",
    intro:
      "Il Cosmo Grill è aperto ogni sera anche a chi non dorme in hotel, con menu à la carte. Il Lounge Bar accompagna la giornata: dal caffè di metà mattina al tè del pomeriggio, dall'aperitivo all'happy hour.",
    // DA CONFERMARE: orari di apertura Cosmo Grill e Lounge Bar → ripiego di COPY.
    orariRipiego: "Grill aperto ogni sera. Per gli orari chiama +39 02 617771.",
    cursore: {
      etichetta: "Momento della giornata",
      valori: ["Mattina", "Pranzo", "Aperitivo", "Sera"],
      ariaSlider: "Momento della giornata nel ristorante: {valore}. Cambia la luce della sala.",
    },
    momenti: [
      { id: "mattina", valore: "Mattina", titolo: "Un caffè, con calma", testo: "Il Lounge Bar apre la giornata con il caffè di metà mattina." },
      {
        id: "pranzo",
        valore: "Pranzo",
        titolo: "Pranzo per eventi",
        testo:
          "A pranzo il Cosmo Grill ospita eventi aziendali e privati. Non è un servizio à la carte per tutti: se vuoi organizzare un pranzo, scrivi all'Ufficio Eventi.",
      },
      {
        id: "aperitivo",
        valore: "Aperitivo",
        titolo: "Aperitivo e happy hour",
        testo:
          "Il tè del pomeriggio, l'aperitivo prima di pranzo, l'happy hour: il Lounge Bar è un posto tranquillo per vedersi o per lavorare.",
      },
      {
        id: "sera",
        valore: "Sera",
        titolo: "Cena al Cosmo Grill",
        testo: "Cucina contemporanea che parte dalla tradizione milanese. Ogni sera, anche per chi non è ospite.",
      },
    ],
    // DA CONFERMARE: prenotazione tavoli online? Per ora apre telefono/email (UX 4.3 scena 5, ContactChoice).
    prenotaTavolo: "Prenota un tavolo",
    organizzaEvento: "Organizza un evento",
    contattoReparto: "Ristorante: +39 02 617771 · info@cosmohotelpalace.it",
    chiama: "Chiama +39 02 617771",
    scrivi: "Scrivi a info@cosmohotelpalace.it",
    ariaDiorama:
      "Ricostruzione 3D della sala del Cosmo Grill e Lounge: cemento lisciato, travi e canalizzazioni a vista, lampade ad abat-jour color miele, tavoli bianchi e sedie in alluminio forato. La luce cambia dal mattino alla sera.",
    nota: "Ricostruzione illustrativa, non una fotografia.",
  },

  /* ------------------------ 7. Wellness & Fitness ---------------------- */
  wellness: {
    h1: "Wellness & Fitness al sesto piano",
    sottotitolo:
      "Sauna finlandese, bagno turco e sala attrezzi. Aperti tutti i giorni dalle 7:00 alle 22:00.",
    corpo:
      "Il sesto piano dell'hotel è dedicato al benessere. La sauna finlandese e il bagno turco servono a staccare dopo una giornata di lavoro o di viaggio. Per allenarti c'è una sala attrezzi con due tapis roulant (14 programmi di lavoro interattivi), cyclette, chest press, pulldown e leg extension.",
    // DA CONFERMARE: accesso incluso o a pagamento, età minima, prenotazione, cosa portare → ripiego di COPY.
    accessoRipiego: "Per condizioni di accesso chiedi alla reception o scrivi a info@cosmohotelpalace.it.",
    // Testo fisso nell'HTML statico, prima del calcolo dell'ora di Roma (UX 4.3 scena 6, MOTION 6.3).
    orarioFisso: "Aperto tutti i giorni dalle 7:00 alle 22:00",
    aperto: {
      aperto: "Aperto ora · chiude alle 22:00",
      chiusoPrima: "Chiuso · apre alle 7:00",
      chiusoDopo: "Chiuso · riapre domani alle 7:00",
      ultimaOra: "Aperto ora · chiude tra poco, alle 22:00",
      nota: "Orario indicato sul sito dell'hotel. Controlla eventuali variazioni con la reception.",
    },
    tappe: [
      { id: "sauna", titolo: "Sauna finlandese", testo: "Calore secco, per rilassare muscoli e testa." },
      { id: "turco", titolo: "Bagno turco", testo: "Vapore, per un momento di pausa." },
      {
        id: "attrezzi",
        titolo: "Sala attrezzi",
        testo: "Due tapis roulant con 14 programmi, cyclette, chest press, pulldown, leg extension.",
      },
    ],
    cercaSoggiorno: "Cerca un soggiorno",
    chiediInformazioni: "Chiedi informazioni",
    // UX 4.3 scena 6
    scopri: "Scopri il Wellness",
    // DECISIONI 3: il wellness è un SVG isometrico, non 3D né ruotabile. Il testo di COPY
    // («Ricostruzione 3D … Trascina per ruotare») non è più vero.
    // NUOVO TESTO
    ariaIllustrazione:
      "Illustrazione isometrica del percorso benessere al sesto piano: sauna finlandese, bagno turco e sala attrezzi con tapis roulant, cyclette e macchine per il lavoro muscolare.",
    nota: "Ricostruzione illustrativa, non una fotografia.",
  },

  /* ------------------------- 8. Centro Congressi ----------------------- */
  congressi: {
    presentazione: {
      h1: "Centro Congressi",
      // DECISIONI 7: nessun «13 sale» visibile. COPY dice «Fino a 900 persone, 13 sale modulabili, a 2 km da Milano.»
      // NUOVO TESTO
      sottotitolo: "Fino a 900 persone, sale modulabili, a 2 km da Milano.",
      // DA CONFERMARE (domanda aperta 4): «oltre 900 m²» è del brief; la tabella delle sale somma molto di più.
      corpo:
        "Il Centro Congressi occupa oltre 900 m² su due piani. Le sale si dividono e si uniscono con pareti mobili: configuri lo spazio giusto per ogni evento. Entra la luce naturale. Un team dedicato segue l'evento dal primo contatto.",
      piani:
        "Al piano terra c'è la Plenaria delle Costellazioni (500 m², fino a 8 sale). Al piano inferiore la Plenaria delle Divinità, divisibile in 5 sale.",
      comeCiSiArriva:
        "Il parcheggio è gratuito, fino a 200 posti auto, con un'area per gli autobus. A4 Milano–Venezia, Tangenziale Est e Nord sono vicine.",
      contatto: "Ufficio Eventi · +39 02 61 777 726 · events@cosmohotelpalace.it",
      pulsanti: {
        configura: "Configura la tua sala",
        richiediProposta: "Richiedi una proposta",
        chiamaEventi: "Chiama l'Ufficio Eventi",
      },
      sottoSchede: [
        { id: "costellazioni", titolo: "Costellazioni", testo: "Piano terra. Tinte neutre, design contemporaneo. Fino a 500 persone." },
        { id: "divinita", titolo: "Divinità", testo: "Piano inferiore. Fino a 5 sale indipendenti." },
        {
          id: "eventi",
          titolo: "Eventi aziendali e privati",
          testo: "Spazi adattabili e menu su misura, per banchetti aziendali o privati.",
        },
      ],
      // UX 4.3 scena 7: numeri grandi della scena in home
      // NUOVO TESTO
      numeri: {
        superficie: "oltre 900 m²",
        persone: "fino a 900 persone",
        parcheggio: "200 posti auto gratuiti",
        piani: "2 piani",
      },
    },
    configuratore: {
      titolo: "Configura la tua sala",
      sottotitolo: "Scegli la sala e la disposizione. Vedi le sedie disporsi e la capienza.",
      passi: {
        sala: "1. Scegli la sala",
        disposizione: "2. Scegli la disposizione",
        proposta: "3. Chiedi una proposta",
      },
      // NUOVO TESTO (UX 7.1: l'elenco non porta un conteggio di sale)
      elencoTitolo: "Le sale e le loro misure",
      filtri: { piano0: "Piano terra", pianoMeno1: "Piano inferiore", tutte: "Tutte" },
      ordina: { etichetta: "Ordina per", capienza: "Capienza", superficie: "Superficie" },
      // NUOVO TESTO (UX 7.2)
      salaScelta: "Sala scelta: {sala}",
      divisibile: "Divisibile",
      // {sala}, {disposizioni}
      disposizioneNonPrevista: "Questa disposizione non è indicata per {sala}. Prova con {disposizioni}.",
      // NUOVO TESTO (UX 7.2)
      disposizioneRipiego: "{sala} non ha {disposizione}: ti mostro Platea.",
      vuoto: "Scegli una sala per vedere come si dispone.",
      disposizioni: {
        platea: { etichetta: "Platea", aiuto: "Sedie in file rivolte al palco. Per conferenze e presentazioni." },
        banchi: {
          etichetta: "Banchi di scuola",
          aiuto: "File di tavoli con sedie, tutti rivolti al relatore. Per formazione e corsi.",
        },
        ferro: { etichetta: "Ferro di cavallo", aiuto: "Tavoli a U, aperti verso il relatore. Per workshop e riunioni di lavoro." },
        banchetto: { etichetta: "Banchetto", aiuto: "Tavoli rotondi con commensali. Per pranzi e cene." },
      },
      // NUOVO TESTO (UX 7.2: «Quanti partecipanti?» e indicatore «{n} su {capienza}»)
      partecipanti: { etichetta: "Quanti partecipanti?", indicatore: "{n} su {capienza}" },
      risultato: {
        // {sala}, {disposizione}, {n}
        riga: "{sala}, {disposizione}: fino a {n} persone.",
        // {superficie}, {dimensioni}, {h}, {piano}
        dati: "{superficie} m² · {dimensioni} m · altezza {h} m · {piano}",
        pianoTerra: "piano terra",
        pianoInferiore: "piano inferiore",
        divisibile: "Si può dividere con pareti mobili in fino a {k} sale.",
        notaCapienze:
          "Capienze indicative, dalla tabella del Centro Congressi. Per il tuo evento ci sono altri fattori, come palco, regia e allestimento: lo valuta l'Ufficio Eventi.",
        // DA CONFERMARE: coerenza dimensioni/superfici (domanda aperta 4). UX 7.1: nota accanto ai dati della sala.
        notaMisure: "Dimensioni e superfici come pubblicate.",
      },
      pareti: {
        dividi: "Dividi la sala",
        riunisci: "Riunisci la sala",
        // {k}
        annuncio: "Sala divisa in {k} parti.",
        // NUOVO TESTO (UX 7.2)
        schemaIndicativo: "Schema indicativo. Le sale reali hanno misure diverse: le trovi nell'elenco.",
        // NUOVO TESTO (UX 7.2). {sala}, {k}
        risultatoDivisa:
          "{sala} divisa in fino a {k} sale con pareti mobili. Le capienze delle singole sale sono nell'elenco.",
      },
      scena: {
        vista3D: "3D",
        vistaPianta: "Pianta",
        // {sala}, {disposizione}, {n}, {superficie}
        ariaCanvas:
          "Pianta 3D della sala {sala}, disposizione {disposizione}: {n} sedie in una sala di {superficie} metri quadri.",
        // NUOVO TESTO (UX 7.2)
        notaBanchetto: "Tavoli rotondi: disposizione illustrativa",
        // MOTION 5.2
        notaDisposizione: "Disposizione illustrativa",
      },
      pulsanti: { usa: "Usa questa configurazione", cambiaSala: "Cambia sala" },
      // NUOVO TESTO (UX 4.3 scena 7, mini-selettore «Trova la sala»). {n}, {disposizione}, {sala}, {c}, {k}
      trovaSala: {
        titolo: "Trova la sala",
        risultato: "{n} persone a {disposizione}: la sala più piccola adatta è {sala} (fino a {c}). Altre {k} sale vanno bene.",
        oltreMassimo: "Il Centro Congressi ospita fino a 900 persone. Scrivi all'Ufficio Eventi per capire come.",
      },
    },
    modulo: {
      h2: "Richiesta di proposta",
      sottotitolo: "Raccontaci l'evento. L'Ufficio Eventi ti risponde con una proposta.",
      // DA CONFERMARE: tempo di risposta dell'Ufficio Eventi → non scrivere tempi.
      riepilogoConfigurazione: "La tua configurazione: {sala} · {disposizione} · fino a {n} persone.",
      modifica: "Modifica",
      campi: {
        nome: { etichetta: "Nome e cognome" },
        azienda: { etichetta: "Azienda o organizzazione (facoltativo)" },
        email: { etichetta: "Email", aiuto: "Ti scriviamo qui la proposta." },
        telefono: { etichetta: "Telefono (facoltativo)", aiuto: "Solo se preferisci essere richiamato." },
        tipo: {
          etichetta: "Tipo di evento",
          opzioni: [
            "Convegno o congresso",
            "Riunione aziendale",
            "Formazione",
            "Banchetto aziendale",
            "Evento privato o cerimonia",
            "Altro",
          ],
        },
        // UX 7.3: campo di testo libero. L'esempio è NUOVO TESTO.
        data: { etichetta: "Data o periodo", aiuto: "Anche solo il mese, se non l'hai ancora fissata.", esempio: "12/03/2027 o marzo 2027" },
        ospiti: { etichetta: "Numero di partecipanti", aiuto: "Una stima va bene." },
        sala: { etichetta: "Sala" },
        disposizione: { etichetta: "Disposizione" },
        camere: { etichetta: "Camere per gli ospiti (facoltativo)", aiuto: "Quante camere ti servono, se ti servono." },
        messaggio: { etichetta: "Altro da sapere", aiuto: "Pranzo, coffee break, allestimento… scrivi quello che hai in mente." },
        consenso: { etichetta: "Ho letto l'informativa privacy", linkTesto: "informativa" },
      },
      errori: {
        nomeVuoto: "Scrivi il tuo nome, così sappiamo come chiamarti.",
        emailVuota: "Scrivi la tua email: è dove arriva la proposta.",
        emailNonValida: "Questa email sembra incompleta. Controlla che ci siano @ e il dominio, ad esempio nome@azienda.it.",
        telefonoNonValido: "Usa solo numeri, spazi e il +. Esempio: +39 02 1234567.",
        ospitiNonNumerico: "Scrivi il numero con le cifre, ad esempio 120.",
        // {n}, {disp}, {sala}: avviso, non blocca
        ospitiOltreCapienza:
          "Per {n} persone con la disposizione {disp} la sala {sala} potrebbe essere stretta. Puoi scegliere un'altra sala o inviare comunque: l'Ufficio Eventi ti consiglia.",
        dataPassata: "Questa data è già passata. Scegli da oggi in avanti.",
        consensoMancante: "Per inviare la richiesta spunta la casella dell'informativa privacy.",
        riepilogo: "Ci sono {n} campi da controllare.",
      },
      // Senza backend (HAS_BACKEND=false, DECISIONI 11, UX 7.3): UX 15.5 cambia il nome del pulsante.
      senzaBackend: {
        // NUOVO TESTO
        pulsante: "Apri la email con la richiesta",
        apertura: "Si apre la tua email con la richiesta già scritta. Premi Invia per mandarla.",
        // NUOVO TESTO
        copia: "Copia il testo della richiesta",
        // NUOVO TESTO
        copiato: "Testo copiato.",
        chiamaEventi: "Chiama l'Ufficio Eventi",
        // Oggetto della email: `Richiesta di proposta · {sala} · {disposizione}`
        oggettoEmail: "Richiesta di proposta · {sala} · {disposizione}",
        // NUOVO TESTO (UX 7.3: per chi non ha un programma di posta; l'indirizzo è in contacts.ts)
        indirizzoAlternativo: "Non si apre la posta? Scrivi a events@cosmohotelpalace.it.",
        // NUOVO TESTO (modulo 10, lib/congress/mailto.ts): righe fisse del corpo della email precompilata.
        corpoEmail: {
          saluto: "Buongiorno,",
          intro: "vorrei ricevere una proposta per un evento al Centro Congressi.",
          altro: "Altro da sapere:",
          chiusura: "Grazie.",
        },
      },
      /**
       * NON USARE finché HAS_BACKEND=false (COPY 8.3, UX 7.3): il sito è statico e non deve mai
       * dire «Richiesta inviata». Tenuti pronti per quando ci sarà un invio vero.
       */
      soloConBackend: {
        invia: "Invia la richiesta",
        preferisciScrivere: "Preferisci scrivere? Apri una email",
        inviando: "Stiamo inviando la richiesta…",
        successo: "Richiesta inviata. L'Ufficio Eventi la riceve e ti risponde all'indirizzo che hai scritto.",
        successoRiepilogo: "Riepilogo: {sala}, {disposizione}, {n} persone.",
        erroreRete:
          "La richiesta non è partita. Riprova, oppure scrivi a events@cosmohotelpalace.it o chiama +39 02 61 777 726.",
      },
    },
  },

  /* --------------------------- 9. Come arrivare ------------------------ */
  comeArrivare: {
    h1: "Come arrivare al Cosmo Hotel Palace",
    sottotitolo: "Via F. De Sanctis, 5 — 20092 Cinisello Balsamo (Milano). A 2 km da Milano.",
    intro: "L'hotel è vicino alle principali strade e ben collegato a Milano e Monza.",
    // I `[DA CONFERMARE]` di COPY (come arrivare da stazioni e aeroporti, distanze delle fiere) non si scrivono.
    blocchi: [
      {
        id: "auto",
        titolo: "In auto",
        testo: "A4 Milano–Venezia, Tangenziale Est e Tangenziale Nord. Parcheggio gratuito fino a 200 posti auto, con un'area per gli autobus.",
      },
      {
        id: "tram-metro",
        titolo: "In tram e metro",
        testo: "Il tram 31 si prende a pochi passi dall'hotel. In poche fermate arriva alla metro M5, fermata Bignami. Da lì si arriva in centro a Milano.",
      },
      { id: "treno", titolo: "In treno", testo: "Le stazioni di riferimento sono Sesto FS e Milano Centrale." },
      { id: "aereo", titolo: "In aereo", testo: "Gli aeroporti di riferimento sono Linate, Malpensa e Orio al Serio." },
      { id: "fiere", titolo: "Per fiere e congressi", testo: "Rho Fiera, Milano City Fiera, MiCo Milano Congressi: tutti collegati." },
    ],
    pulsanti: {
      indicazioni: "Indicazioni stradali",
      copia: "Copia l'indirizzo",
      copiato: "Indirizzo copiato.",
      chiama: "Chiama l'hotel",
    },
    // Niente mappa incorporata (DECISIONI 8, UX 15.6): alt e testo «mappa non caricata» di COPY non servono.
    percorso: {
      titolo: "Da qui al centro di Milano",
      corpo:
        "Il Cosmo è a 2 km da Milano. Il tram 31 parte a pochi passi dall'hotel e in poche fermate arriva alla metro M5, fermata Bignami. Da lì sei in città.",
      // DA CONFERMARE: tempo totale e cambi per arrivare al Duomo → non scrivere minuti.
      passi: ["Cosmo Hotel Palace", "Tram 31, a pochi passi", "Poche fermate", "Metro M5, fermata Bignami", "Milano"],
      ariaMappa:
        "Mappa animata: dal Cosmo Hotel Palace il tram 31 porta in poche fermate alla metro M5 Bignami, verso il centro di Milano.",
    },
  },

  /* ----------------------------- 10. Contatti -------------------------- */
  contatti: {
    h1: "Contatti",
    sottotitolo: "Scegli il reparto giusto: ti risponde chi si occupa di quella cosa.",
    // DA CONFERMARE: orari degli uffici → nessun orario scritto.
    chiama: "Chiama",
    scrivi: "Scrivi",
    // {reparto}, {numero}
    ariaChiama: "Chiama {reparto} al {numero}",
    // {reparto}, {email}
    ariaScrivi: "Scrivi a {reparto}: {email}",
    // {social}
    ariaSocial: "Cosmo Hotel Palace su {social} (si apre in una nuova scheda)",
    // NUOVO TESTO (titoli dei blocchi della pagina)
    indirizzoTitolo: "Indirizzo",
    socialTitolo: "Seguici",
    partner: {
      titolo: "Nel mondo Cosmo",
      // Ripiego di COPY 10 (UX 8): senza la parola «gruppo». DA CONFERMARE: rapporto tra le strutture.
      testo: "Altre strutture Cosmo: Cosmo Hotel Torri, Cosmo Residence, Villa Trivulzio.",
    },
  },

  /* ------------------------------ 11. Footer --------------------------- */
  footer: {
    hotel: { titolo: "Hotel", riga1: "Cosmo Hotel Palace", riga2: "Hotel & Centro Congressi" },
    contatti: { titolo: "Contatti" },
    // UX 2.1: il footer non linka pagine che non esistono. «Dintorni» e «Domande frequenti» tornano in fase 2.
    esplora: {
      titolo: "Esplora",
      voci: {
        camere: "Camere",
        ristorazione: "Cosmo Grill & Lounge",
        wellness: "Wellness",
        congressi: "Centro Congressi",
        comeArrivare: "Come arrivare",
      },
    },
    seguici: { titolo: "Seguici" },
    legale: {
      // {cin}
      cin: "CIN {cin}",
      privacy: "Privacy",
      copyright: "© Cosmo Hotel Palace",
      // DA CONFERMARE: gestione cookie (UX 8: nessun banner nella fase 1). Credito sito: DA CONFERMARE.
    },
    cta: "Cerca disponibilità",
    ariaTornaSu: "Torna all'inizio della pagina",
  },

  /* ------------------------------ 12. Privacy -------------------------- */
  privacy: {
    h1: "Privacy",
    sottotitolo: "Come usiamo i tuoi dati quando visiti il sito o ci scrivi.",
    // Segnaposto finché il cliente non manda l'informativa (UX 8). DA CONFERMARE: l'informativa va
    // aggiornata per il nuovo sito (moduli, motore di prenotazione); il testo legale non è del copy.
    corpo:
      "Qui va il testo dell'informativa vigente, trasferito senza modifiche. Il sito attuale la intitola «Informativa sul trattamento dei dati personali» e indica come titolare la società Cosmo Hotel S.p.A.",
    daConfermare:
      "DA CONFERMARE: l'informativa va aggiornata per il nuovo sito (moduli, motore di prenotazione, cookie). Il testo legale lo redige il cliente o il suo consulente.",
    // Testo breve accanto ai moduli
    testoBreveModuli:
      "Usiamo i dati che inserisci per rispondere alla tua richiesta. Il titolare è Cosmo Hotel S.p.A. Leggi l'informativa completa.",
    linkInformativa: "informativa",
  },

  /* ------------------------ 13. Pagine di servizio --------------------- */
  servizio: {
    paginaNonTrovata: {
      h1: "Pagina non trovata",
      corpo: "Questo indirizzo non esiste, o la pagina è cambiata di posto. Torna alla home o cerca una camera.",
      home: "Torna alla home",
      cerca: "Cerca disponibilità",
    },
    configuratoreVuoto: "Scegli una sala per vedere come si dispone.",
    caricamento3D: "Stiamo preparando la scena…",
    fallback3D: "La vista 3D non è disponibile su questo dispositivo. Ecco la versione semplificata.",
  },

  /* -------------------------- 14.4 Domande frequenti -------------------- */
  // I `[DA CONFERMARE]` di COPY (tempi per il Duomo, prenotare il posto, Wi-Fi nelle aree comuni,
  // camere attrezzate, condizioni di accesso, orari) non compaiono nelle risposte. Fase 2 (UX 2.1),
  // ma servono già alla pagina FAQPage in lib/seo.
  faq: [
    {
      id: "dove",
      domanda: "Dov'è il Cosmo Hotel Palace e quanto dista da Milano?",
      risposta:
        "Il Cosmo Hotel Palace è in Via F. De Sanctis, 5, a Cinisello Balsamo (Milano), a 2 km da Milano. È un hotel con Centro Congressi, vicino alle principali strade verso Milano e Monza.",
    },
    {
      id: "senza-auto",
      domanda: "Come si arriva in centro a Milano senza auto?",
      risposta:
        "Dal Cosmo Hotel Palace si prende il tram 31, a pochi passi dall'hotel. In poche fermate arriva alla metro M5, fermata Bignami, che porta in città.",
    },
    {
      id: "parcheggio",
      domanda: "C'è il parcheggio? È gratuito?",
      risposta:
        "Sì. Il Cosmo Hotel Palace ha un parcheggio gratuito con 200 posti auto e un'area riservata agli autobus.",
    },
    {
      id: "come-si-raggiunge",
      domanda: "Come si raggiunge l'hotel in auto, in treno o in aereo?",
      risposta:
        "In auto: A4 Milano–Venezia, Tangenziale Est o Tangenziale Nord. In treno: stazioni di Sesto FS o Milano Centrale. In aereo: aeroporti di Linate, Malpensa e Orio al Serio. L'hotel è vicino anche a Rho Fiera, Milano City Fiera e MiCo.",
    },
    {
      id: "wifi",
      domanda: "C'è il Wi-Fi? È gratuito?",
      risposta:
        "Sì. Il Wi-Fi è gratuito in tutte le camere del Cosmo Hotel Palace: Classic Double Room, Family Room e Suite.",
    },
    {
      id: "accessibilita",
      domanda: "L'hotel è accessibile a chi ha difficoltà motorie?",
      risposta:
        "Il Cosmo Hotel Palace è strutturato senza barriere architettoniche. Per esigenze specifiche scrivi a info@cosmohotelpalace.it o chiama +39 02 617771.",
    },
    {
      id: "bambini",
      domanda: "Posso viaggiare con i bambini? Quante persone dormono in camera?",
      risposta:
        "Sì. La Family Room (44 m², due camere comunicanti con due bagni) ospita 2 adulti e 2 bambini, con un letto singolo extra o una culla su richiesta. La Suite ospita 4 adulti oppure 2 adulti e 2 bambini. La Classic Double Room ospita 2 adulti.",
    },
    {
      id: "wellness",
      domanda: "Quali sono gli orari della sauna, del bagno turco e della palestra?",
      risposta:
        "Il centro benessere e l'area fitness, al sesto piano del Cosmo Hotel Palace, sono aperti tutti i giorni dalle 7:00 alle 22:00. Ci sono una sauna finlandese, un bagno turco e una sala attrezzi.",
    },
    {
      id: "ristorante",
      domanda: "Il ristorante è aperto anche a chi non dorme in hotel?",
      risposta:
        "Sì. Il Cosmo Grill è aperto ogni sera anche ai clienti esterni, con menu à la carte. Propone cucina contemporanea ispirata alla tradizione milanese. Il Lounge Bar serve caffè, tè del pomeriggio, aperitivo e happy hour.",
    },
    {
      id: "congressi",
      domanda: "Quante persone ospita il Centro Congressi e come si prepara un evento?",
      risposta:
        "Il Centro Congressi del Cosmo Hotel Palace ospita fino a 900 persone, su due piani, con sale modulabili con pareti mobili e luce naturale. La sala più grande, la Plenaria delle Costellazioni, ha 500 m² e fino a 500 posti a platea. Per una proposta scrivi a events@cosmohotelpalace.it o chiama +39 02 61 777 726.",
    },
  ],

  /* ------------------------------- 14.2 Meta --------------------------- */
  // Title <= 60 caratteri, description <= 155 (verificato da scripts/check-content.mjs).
  // La description del Centro Congressi in COPY cita «13 sale»: qui è tolto (DECISIONI 7).
  meta: {
    home: {
      title: "Hotel a 2 km da Milano con parcheggio | Cosmo Hotel Palace",
      description:
        "Hotel e Centro Congressi a Cinisello Balsamo, a 2 km da Milano. 201 camere, Cosmo Grill, wellness e 200 posti auto gratuiti. Cerca disponibilità.",
    },
    camere: {
      title: "Camere, Family Room e Suite a Milano | Cosmo Hotel Palace",
      description:
        "201 camere e suite a 2 km da Milano: Classic Double, Family Room e Suite. Wi-Fi gratuito, senza barriere architettoniche. Esplora le camere in 3D.",
    },
    classic: {
      title: "Classic Double Room, 22 m² | Cosmo Hotel Palace",
      description:
        "Camera doppia da 22 m² con letto matrimoniale da 160 cm e bagno con vasca o doccia. Wi-Fi gratuito, TV satellitare. Guarda la camera in 3D.",
    },
    family: {
      title: "Family Room per 4 persone, 44 m² | Cosmo Hotel Palace",
      description:
        "Due camere comunicanti, due bagni, 44 m². Per 2 adulti e 2 bambini. Su richiesta letto singolo extra o culla. Guarda la camera in 3D.",
    },
    suite: {
      title: "Suite con soggiorno, 44 m² | Cosmo Hotel Palace",
      description:
        "Suite da 44 m² con due ambienti e ingressi separati, scrivania, divano letto e due bagni. Fino a 4 adulti. Guarda la suite in 3D.",
    },
    prenota: {
      title: "Prenota un hotel a Milano nord | Cosmo Hotel Palace",
      description:
        "Scegli date e ospiti: ti portiamo sul motore di prenotazione del Cosmo Hotel Palace per vedere disponibilità e tariffe.",
    },
    ristorazione: {
      title: "Ristorante e bar a Cinisello Balsamo | Cosmo Hotel Palace",
      description:
        "Cosmo Grill: cucina contemporanea ispirata a Milano, aperto ogni sera anche ai non ospiti. Lounge Bar per caffè, aperitivo e happy hour.",
    },
    wellness: {
      title: "Sauna, bagno turco e fitness vicino a Milano | Cosmo",
      description:
        "Al sesto piano: sauna finlandese, bagno turco e sala attrezzi. Aperto tutti i giorni dalle 7:00 alle 22:00, al Cosmo Hotel Palace.",
    },
    centroCongressi: {
      title: "Centro Congressi a Milano nord, 900 posti | Cosmo",
      // NUOVO TESTO: COPY dice «13 sale modulabili su due piani…»; DECISIONI 7 vieta il conteggio.
      description:
        "Sale modulabili su due piani, fino a 900 persone, luce naturale e 200 posti auto gratuiti. Configura la sala e chiedi una proposta.",
    },
    richiestaProposta: {
      title: "Richiedi una proposta per il tuo evento | Cosmo Hotel",
      description:
        "Raccontaci evento, data e numero di ospiti: l'Ufficio Eventi del Cosmo Hotel Palace prepara una proposta per la sala giusta.",
    },
    comeArrivare: {
      title: "Come arrivare: tram 31 e M5 a Milano | Cosmo Hotel Palace",
      description:
        "Cinisello Balsamo, a 2 km da Milano. In auto da A4 e Tangenziali, in tram 31 fino alla metro M5 Bignami. Parcheggio gratuito di 200 posti.",
    },
    dintorni: {
      title: "Cosa vedere vicino a Milano, Monza e Como | Cosmo Hotel",
      description:
        "Duomo, Castello Sforzesco, Reggia di Monza, Lago di Como: i luoghi da vedere partendo dal Cosmo Hotel Palace, alle porte di Milano.",
    },
    contatti: {
      title: "Contatti e reparti | Cosmo Hotel Palace",
      description:
        "Prenotazioni, Eventi, Commerciale, Ristorante: telefono ed email di ogni reparto del Cosmo Hotel Palace, Via De Sanctis 5, Cinisello Balsamo.",
    },
    faq: {
      title: "Domande frequenti | Cosmo Hotel Palace",
      description:
        "Parcheggio, Wi-Fi, accessibilità, come arrivare a Milano, camere per famiglie, wellness e Centro Congressi: le risposte del Cosmo Hotel Palace.",
    },
    partner: {
      title: "Cosmo Hotel Torri, Residence e Villa Trivulzio | Cosmo",
      description: "Le altre strutture Cosmo: Cosmo Hotel Torri, Cosmo Residence e Villa Trivulzio.",
    },
    privacy: {
      title: "Privacy | Cosmo Hotel Palace",
      description: "Informativa sul trattamento dei dati personali del sito del Cosmo Hotel Palace.",
    },
  },

  /** Descrizione dello schema JSON-LD `Hotel` (COPY 14.3). Niente stelle, premi, prezzi, orari di check-in. */
  schema: {
    descrizioneHotel:
      "Hotel e Centro Congressi a Cinisello Balsamo, a 2 km da Milano. 201 camere e suite, ristorante Cosmo Grill, Lounge Bar, area wellness e fitness.",
  },
} as const;

export type Copy = typeof copy;

/* ------------------------------------------------------------------ */
/* Prenotazione: testi aggiunti dal modulo 4 (UX 6, 12)               */
/* In coda e separati da `copy`: il resto del file non è stato toccato. */
/* ------------------------------------------------------------------ */

export const copyPrenotazione = {
  // NUOVO TESTO (UX 12: il nome accessibile di un link esterno dice «si apre in una nuova scheda»)
  ariaCerca: "Cerca disponibilità (si apre in una nuova scheda)",
  // NUOVO TESTO (idem, per il link di ripiego e per il link semplice senza JavaScript)
  ariaApriMotore: "Apri il motore di prenotazione (si apre in una nuova scheda)",
  // NUOVO TESTO (UX 9: stepper al minimo o al massimo, annunciato se si preme comunque)
  limiteMax: "Hai raggiunto il massimo: {n}.",
  limiteMin: "Hai raggiunto il minimo: {n}.",
  // NUOVO TESTO (nomi per i lettori di schermo degli stepper: «2 camere»)
  unita: {
    camere: { uno: "camera", altro: "camere" },
    adulti: { uno: "adulto", altro: "adulti" },
    bambini: { uno: "bambino", altro: "bambini" },
  },
  // NUOVO TESTO (UX 6.3: /prenota/ senza JavaScript mostra il link semplice, telefono ed email)
  senzaJs: "Senza JavaScript il modulo non funziona: apri il motore di prenotazione da qui e scegli le date lì.",
  // NUOVO TESTO (singolare del riepilogo errori: `copy.prenota.errori.riepilogo` dice «Ci sono {n} campi…»)
  riepilogoUno: "C'è 1 campo da controllare.",
  // NUOVO TESTO (nome del gruppo dei campi, per i lettori di schermo)
  nomeGruppo: "Date e ospiti del soggiorno",
} as const;
