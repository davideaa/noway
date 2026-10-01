/**
 * Testi aggiuntivi del modulo 14 (Ristorazione, Wellness, Come arrivare, Contatti, Privacy).
 * Sta in un file proprio, e non in `copy.ts`, per non toccare un file condiviso con gli altri moduli
 * (DECISIONI 14); le chiavi di COPY restano in `copy.ts` e qui si pesca da lì.
 *
 * `// NUOVO TESTO` = non c'è in COPY: scritto qui seguendo il tono di COPY (DECISIONI 12).
 * `// DA CONFERMARE` = affermazione che il cliente deve confermare; si vede in pagina dove è detto.
 * Nessun numero, orario o servizio che non sia nel BRIEF.
 */

export const copyPagine = {
  /* ------------------------------ Ristorazione ------------------------------ */
  ristorazione: {
    // NUOVO TESTO
    eyebrow: "Ristorazione",
    // NUOVO TESTO: due locali, due righe di fatti dal BRIEF
    grill: {
      titolo: "Cosmo Grill",
      fatti: [
        "Cucina contemporanea ispirata alla tradizione milanese",
        "Aperto ogni sera, anche a chi non dorme in hotel",
        "Menu à la carte",
        "A pranzo, per eventi aziendali e privati",
      ],
    },
    lounge: {
      titolo: "Lounge Bar",
      fatti: ["Caffè", "Tè del pomeriggio", "Aperitivo", "Happy hour"],
    },
    orariTitolo: "Orari",
    // NUOVO TESTO: onesto sul menu, senza inventarne uno (DA CONFERMARE: se il cliente vuole pubblicarlo)
    menuNota: "Il menu non è pubblicato su questo sito.",
    // NUOVO TESTO
    giornataTitolo: "Una giornata al Grill & Lounge",
    // NUOVO TESTO
    giornataIntro: "Sposta il cursore: la luce della sala cambia. Il testo dice cosa c'è davvero in quel momento.",
    // NUOVO TESTO: descrizione del cursore per i lettori di schermo (COPY dice «Cambia la luce della sala.»)
    ariaCursoreAiuto: "Cambia la luce della sala.",
    // NUOVO TESTO: il pranzo non è un servizio per tutti (COPY 6): il link porta alla richiesta
    scriviEventi: "Scrivi all'Ufficio Eventi",
    // NUOVO TESTO
    elencoPunti: "Dettagli della sala",
    // NUOVO TESTO: pulsanti ◀ ▶ e «Ripristina vista» (UX 5.2) per la sala
    rig: { sinistra: "Ruota la vista a sinistra", destra: "Ruota la vista a destra", ripristina: "Ripristina vista" },
    // NUOVO TESTO
    contattoTitolo: "Parla con il ristorante",
    // NUOVO TESTO (UX 4.3: «Prenota un tavolo» apre due scelte da 48 px)
    tavoloScelta: "Come vuoi prenotare",
  },

  /* -------------------------------- Wellness -------------------------------- */
  wellness: {
    // NUOVO TESTO
    eyebrow: "6° piano",
    // NUOVO TESTO
    percorsoTitolo: "Il percorso del 6° piano",
    // NUOVO TESTO
    percorsoAiuto: "Tocca una tappa o un punto sull'illustrazione.",
    // NUOVO TESTO
    tappaVisibile: "In evidenza: {tappa}",
    // NUOVO TESTO
    tuttoIlPiano: "Tutto il piano",
    // NUOVO TESTO: etichetta del gruppo di bottoni sull'illustrazione
    ariaPunti: "Punti dell'illustrazione",
    // NUOVO TESTO
    cosaTrovi: "Cosa trovi al 6° piano",
    // NUOVO TESTO
    accessoTitolo: "Accesso e condizioni",
    // NUOVO TESTO
    orarioTitolo: "Orario",
    // NUOVO TESTO
    orarioRiga: "Tutti i giorni, dalle 7:00 alle 22:00",
  },

  /* ------------------------------ Come arrivare ------------------------------ */
  comeArrivare: {
    // NUOVO TESTO
    eyebrow: "Dove siamo",
    // NUOVO TESTO (UX 8: nome accessibile dei link esterni dice «si apre in una nuova scheda»)
    ariaIndicazioni: "Indicazioni stradali su Google Maps (si apre in una nuova scheda)",
    // NUOVO TESTO
    indirizzoTitolo: "Indirizzo",
    // NUOVO TESTO: 200 posti auto, dal BRIEF
    parcheggio: { numero: "200", testo: "posti auto gratuiti, con un'area per gli autobus" },
    // NUOVO TESTO: onesto, non scrive tempi
    tempiNota: "Per tempi e coincidenze aggiornati chiedi alla reception o chiama +39 02 617771.",
    // NUOVO TESTO
    ariaPercorso: "Tappe del percorso",
    // NUOVO TESTO: letto dopo il nome della tappa (il numero è nel testo, non solo nel colore)
    tappa: "Tappa {n} di {tot}",
    // NUOVO TESTO
    modiTitolo: "Come si arriva",
    // NUOVO TESTO
    stazioni: ["Sesto FS", "Milano Centrale"],
    // NUOVO TESTO
    aeroporti: ["Linate", "Malpensa", "Orio al Serio"],
    // NUOVO TESTO
    fiere: ["Rho Fiera", "Milano City Fiera", "MiCo Milano Congressi"],
    dintorni: {
      // COPY 5: titolo e sottotitolo della pagina Dintorni, adattati a una sezione
      titolo: "Nei dintorni",
      sottotitolo: "Milano, Monza, il Lago di Como.",
      // COPY 5: nota
      nota: "Controlla orari, biglietti e giorni di apertura sul sito di ogni luogo prima di partire.",
      // COPY 5: filtri
      filtri: { tutto: "Tutto", milano: "Milano", monza: "Monza", como: "Como" },
      // COPY 5: `Filtra i luoghi per zona: {zona}`
      ariaFiltro: "Filtra i luoghi per zona: {zona}",
      // NUOVO TESTO: nome del gruppo di filtri
      ariaGruppo: "Filtra i luoghi per zona",
      // NUOVO TESTO: annuncio ai lettori di schermo dopo il filtro
      annuncio: "Mostro {zona}: {n} luoghi.",
    },
  },

  /* --------------------------------- Contatti --------------------------------- */
  contatti: {
    // NUOVO TESTO
    eyebrow: "Parla con noi",
    // NUOVO TESTO
    repartiTitolo: "I reparti",
    // NUOVO TESTO
    telefono: "Telefono",
    // NUOVO TESTO
    email: "Email",
    // NUOVO TESTO
    comeArrivare: "Come arrivare",
    // NUOVO TESTO
    ariaCopiaIndirizzo: "Copia l'indirizzo dell'hotel",
    // NUOVO TESTO: se il browser non permette di copiare
    copiaFallita: "Non riesco a copiare. L'indirizzo è Via F. De Sanctis, 5, 20092 Cinisello Balsamo (Milano).",
    // NUOVO TESTO
    hashtagEtichetta: "Il nostro hashtag",
    // (Le altre strutture sono solo testo: gli indirizzi dei loro siti non sono nel materiale del cliente.)
  },

  /* ---------------------------------- Privacy --------------------------------- */
  privacy: {
    // NUOVO TESTO
    eyebrow: "Informativa",
    // NUOVO TESTO
    daConfermare: "Da confermare",
    sezioni: {
      titolare: {
        titolo: "Chi tratta i tuoi dati",
        // COPY 12: titolare indicato sul sito attuale
        testo: "Sul sito attuale il titolare del trattamento è indicato in Cosmo Hotel S.p.A.",
        // DA CONFERMARE: il titolare del nuovo sito e i suoi recapiti
        nota: "Titolare e recapiti per il nuovo sito: il cliente deve confermarli.",
      },
      moduli: {
        titolo: "Quando ci scrivi",
        // COPY 12: testo breve accanto ai moduli
        testo: "Usiamo i dati che inserisci per rispondere alla tua richiesta.",
      },
      prenotazione: {
        titolo: "Quando prenoti",
        // COPY 12: riga sotto il widget
        testo: "Aprendo il motore di prenotazione lasci il sito del Cosmo. Lì valgono le regole di quel servizio.",
        // NUOVO TESTO: vero per come è costruito il sito (DECISIONI 9, 11)
        testo2: "Il sito non ha un suo archivio di prenotazioni: le date e gli ospiti che scegli restano nel tuo browser, nella scheda aperta.",
      },
      cookie: {
        titolo: "Cookie e memoria del browser",
        // NUOVO TESTO (UX 8: la fase 1 usa solo memoria tecnica e nessun tracciamento)
        testo: "Il sito usa solo la memoria tecnica del browser, per ricordare le date scelte mentre navighi. Non carica servizi di tracciamento e non mostra mappe di terze parti.",
        // DA CONFERMARE: se il cliente aggiunge tracciamento, serve un banner di consenso (COPY 12)
        nota: "Se in futuro si aggiunge un tracciamento, qui e nel banner cookie va scritto prima di attivarlo.",
      },
      completa: {
        titolo: "L'informativa completa",
        // COPY 12
        daConfermare:
          "L'informativa va aggiornata per il nuovo sito (moduli, motore di prenotazione, cookie). Il testo legale lo redige il cliente o il suo consulente.",
      },
    },
    // NUOVO TESTO
    scrivici: "Per domande sui tuoi dati scrivi a questo indirizzo.",
  },
} as const;
