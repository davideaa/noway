/**
 * «Perché sceglierci»: sette fatti veri (COPY sez. 2, BRIEF). Niente numeri o recensioni inventati.
 * Testi introduttivi della sezione: copy.perche.
 *
 * Differenze rispetto a COPY, per ordine di autorità (DECISIONI > BRIEF > UX > DESIGN > MOTION > COPY):
 * - Fatto 3: tolto «13 sale» dal dettaglio (DECISIONI 7: nessun conteggio di sale finché il cliente non chiarisce).
 * - Fatto 6: dal dettaglio è tolta l'etichetta interna `[DA CONFERMARE: camere e servizi attrezzati…]`.
 */

export type Fact = {
  id: "vicino-milano" | "camere" | "congressi" | "parcheggio" | "wifi" | "accessibile" | "famiglia";
  /** Parte in grande della scheda (COPY: il grassetto). */
  grande: string;
  /** Resto della riga accanto al numero («da Milano»); stringa vuota se il grande basta. */
  resto: string;
  /** Riga sotto il numero. */
  riga: string;
  /** Dettaglio al tocco (dentro il `<details>`). */
  dettaglio: string;
  /** Contatore (MOTION 6.1, 8.3): solo sui 4 numeri veri (2, 201, 900, 200). */
  contatore?: { fino: number; suffisso?: string };
  /** Alt dell'illustrazione del fatto (COPY sez. 2). */
  alt: string;
  /** Zona dello schema SVG dell'hotel che si accende (MOTION 6.1). Stessa chiave dell'id. */
  zona: Fact["id"];
  /** Nota interna, mai mostrata. */
  nota?: string;
};

export const facts = [
  {
    id: "vicino-milano",
    grande: "2 km",
    resto: "da Milano",
    riga: "Alle porte della città.",
    dettaglio: "Il tram 31 è a pochi passi. In poche fermate arriva alla metro M5, fermata Bignami.",
    contatore: { fino: 2, suffisso: " km" },
    alt: "Illustrazione: tram che porta alla metro.",
    zona: "vicino-milano",
  },
  {
    id: "camere",
    grande: "201",
    resto: "camere e suite",
    riga: "Classic, Family Room, Suite.",
    dettaglio: "Stile contemporaneo, toni naturali, tessuti di pregio.",
    contatore: { fino: 201 },
    // NUOVO TESTO: COPY dà 6 alt per 7 fatti; manca quello delle camere.
    alt: "Illustrazione: una fila di porte di camere in un corridoio dell'hotel.",
    zona: "camere",
    nota: "COPY sez. 2 elenca solo 6 alt per 7 schede: questo è scritto qui.",
  },
  {
    id: "congressi",
    grande: "900",
    resto: "posti per eventi",
    riga: "Il Centro Congressi su due piani.",
    // DA CONFERMARE: numero sale (COPY sez. 2, domanda aperta 4). «13 sale» NON si scrive (DECISIONI 7).
    dettaglio: "Sale modulabili con pareti mobili, luce naturale, un team dedicato.",
    contatore: { fino: 900 },
    alt: "Illustrazione: edificio con due piani.",
    zona: "congressi",
  },
  {
    id: "parcheggio",
    grande: "200",
    resto: "posti auto gratuiti",
    riga: "E un'area riservata ai bus.",
    // DA CONFERMARE: serve prenotare il posto?
    dettaglio: "Il parcheggio è gratuito.",
    contatore: { fino: 200 },
    alt: "Illustrazione: auto in un parcheggio.",
    zona: "parcheggio",
  },
  {
    id: "wifi",
    grande: "Wi-Fi gratuito",
    resto: "",
    riga: "Nelle camere.",
    dettaglio: "Connessione gratuita in tutte le tipologie di camera.",
    alt: "Illustrazione: segnale Wi-Fi.",
    zona: "wifi",
  },
  {
    id: "accessibile",
    grande: "Senza barriere",
    resto: "architettoniche",
    riga: "L'hotel è strutturato per essere accessibile.",
    // DA CONFERMARE: camere e servizi attrezzati, ascensori, percorsi.
    dettaglio: "Per esigenze specifiche scrivi a info@cosmohotelpalace.it.",
    alt: "Illustrazione: ingresso senza gradini.",
    zona: "accessibile",
  },
  {
    id: "famiglia",
    grande: "Una famiglia",
    resto: "dietro l'hotel",
    riga: "Impresa familiare italiana.",
    dettaglio: "Nasce dall'idea e dalla creatività di una famiglia che si dedica all'ospitalità.",
    alt: "Illustrazione: tavolo di famiglia.",
    zona: "famiglia",
  },
] as const satisfies readonly Fact[];

/**
 * Dati numerici veri dell'hotel (BRIEF). Un solo posto, così nessun componente li riscrive.
 * Non si calcola nulla da qui: sono costanti dichiarate dal cliente.
 */
export const hotelDati = {
  camere: 201,
  kmDaMilano: 2,
  postiAuto: 200,
  capienzaCongressiMax: 900,
  /** Wellness & Fitness, 6° piano, tutti i giorni (BRIEF). Ore intere, ora di Roma. */
  wellness: { apre: 7, chiude: 22, fusoOrario: "Europe/Rome", piano: 6 },
} as const;
