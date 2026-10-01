/**
 * Le tre tipologie di camera. Fonti: BRIEF (dati veri), COPY sez. 3 (testi), UX 5.1-5.3.
 * Nessun prezzo, nessuna disponibilità, nessun numero inventato (BRIEF 3).
 * Le superfici sono quelle reali; le proporzioni dei diorami sono indicative.
 */
import type { Ospiti, Room, RoomId } from "./types";

/** Dotazioni comuni a tutte le camere (BRIEF, COPY sez. 3 «Corpo»). */
export const dotazioniComuni = [
  "Wi-Fi gratuito",
  "TV satellitare (28 canali stranieri, Sky TV e Sky Sport)",
  "Climatizzazione regolabile",
  "Set di cortesia",
  "Cassaforte",
  "Minibar, rifornito dal distributore self-service al piano",
] as const;

export const rooms = [
  {
    id: "classic",
    slug: "classic-double-room",
    nome: "Classic Double Room",
    nomeBreve: "Classic Double",
    sottotitolo: "22 m² luminosi per due. Design moderno, nessun fronzolo.",
    corpo:
      "La camera doppia è luminosa e ariosa. Ha un letto matrimoniale da 160 cm e un bagno con vasca o doccia. Gli arredi sono in toni naturali e delicati. Il minibar si rifornisce di snack e bevande dal distributore self-service al piano.",
    mq: 22,
    ospiti: { adulti: 2, bambini: 0 },
    ospitiPreimpostati: { adulti: 2, bambini: 0 },
    confronto: {
      superficie: "22 m²",
      letti: "1 matrimoniale da 160 cm",
      ospiti: "2 adulti",
      ambienti: "1 camera",
      bagni: "1 (vasca o doccia)",
      extra: null,
    },
    schedaTecnica: [
      "22 m²",
      "1 letto matrimoniale",
      "2 adulti",
      "Wi-Fi gratuito",
      "TV satellitare (28 canali stranieri, Sky TV e Sky Sport)",
      "climatizzazione regolabile",
      "set di cortesia",
      "cassaforte",
      "minibar",
    ],
    dotazioni: dotazioniComuni,
    cta: "Cerca la Classic Double",
    ctaSecondaria: "Chiedi all'Ufficio Prenotazioni",
    ariaDiorama:
      "Ricostruzione 3D di una Classic Double Room da 22 metri quadri: letto matrimoniale con testiera imbottita, parquet in rovere, lampade a pieghe e una finestra. Trascina per ruotare la camera.",
    piantaAlt:
      "Pianta in scala della Classic Double Room: 22 metri quadri, un letto matrimoniale da 160 centimetri e il bagno.",
    sceneId: "classic",
  },
  {
    id: "family",
    slug: "family-room",
    nome: "Family Room",
    nomeBreve: "Family Room",
    sottotitolo: "Due camere comunicanti, 44 m², due bagni. Ognuno ha il suo spazio.",
    corpo:
      "La Family Room unisce due camere Classic comunicanti. Una ha il letto matrimoniale, l'altra due letti singoli. Ognuna ha il suo bagno, con vasca o doccia. Ospita 2 adulti e 2 bambini. Su richiesta si aggiunge un letto singolo extra o una culla.",
    mq: 44,
    // UX 5.1: «per la Family 22 + 22 m²» (due Classic comunicanti).
    mqParti: [22, 22],
    ospiti: { adulti: 2, bambini: 2 },
    ospitiPreimpostati: { adulti: 2, bambini: 2 },
    confronto: {
      superficie: "44 m²",
      letti: "1 matrimoniale + 2 singoli (in due camere)",
      ospiti: "2 adulti + 2 bambini",
      ambienti: "2 camere comunicanti",
      bagni: "2 (vasca o doccia)",
      extra: "Letto singolo extra o culla su richiesta",
    },
    schedaTecnica: [
      "44 m²",
      "2 camere comunicanti",
      "2 adulti e 2 bambini",
      "letto singolo extra o culla su richiesta",
      "Wi-Fi gratuito",
      "TV satellitare",
      "climatizzazione regolabile",
      "set di cortesia",
      "cassaforte",
      "minibar",
    ],
    dotazioni: dotazioniComuni,
    cta: "Cerca la Family Room",
    // COPY 3.4: apre una email a info@ con oggetto «Richiesta culla/letto extra» (vedi contacts.ts).
    ctaSecondaria: "Chiedi una culla o un letto extra",
    ariaDiorama:
      "Ricostruzione 3D di una Family Room da 44 metri quadri: due camere comunicanti, una con letto matrimoniale e una con due letti singoli. Trascina per ruotare.",
    piantaAlt:
      "Pianta in scala della Family Room: 44 metri quadri, due camere comunicanti, ognuna con il proprio bagno.",
    sceneId: "family",
  },
  {
    id: "suite",
    slug: "suite",
    nome: "Suite",
    nomeBreve: "Suite",
    sottotitolo: "44 m², due ambienti, due ingressi. Si lavora da una parte, si dorme dall'altra.",
    corpo:
      "La Suite ha due ambienti con ingressi separati. Da un lato il soggiorno, con un divano comodo e un'ampia scrivania: ci si può anche riunire in pochi. Dall'altro la camera matrimoniale con armadio. I bagni sono due, separati, con vasca o doccia. Ospita 4 adulti, oppure 2 adulti e 2 bambini.",
    mq: 44,
    ospiti: { adulti: 4, bambini: 0 },
    ospitiAlternativa: { adulti: 2, bambini: 2 },
    // UX 5.3: nel foglio di prenotazione la Suite parte con 2 adulti.
    ospitiPreimpostati: { adulti: 2, bambini: 0 },
    confronto: {
      superficie: "44 m²",
      letti: "1 matrimoniale + divano letto",
      ospiti: "4 adulti, oppure 2 adulti + 2 bambini",
      ambienti: "2 ambienti, ingressi separati",
      bagni: "2 separati (vasca o doccia)",
      extra: "Coffee maker, accappatoio, pantofole, stirapantaloni",
    },
    // NUOVO TESTO: COPY non dà una scheda tecnica per la Suite; è composta con dati di COPY 3.5 e BRIEF.
    schedaTecnica: [
      "44 m²",
      "2 ambienti con ingressi separati",
      "4 adulti, oppure 2 adulti e 2 bambini",
      "2 bagni separati (vasca o doccia)",
    ],
    // COPY 3.5 «Dotazioni».
    dotazioni: [
      "Coffee maker con prodotti selezionati",
      "Ricco set di cortesia",
      "Accappatoio",
      "Pantofole",
      "Stirapantaloni",
      "Cassaforte",
      "Wi-Fi gratuito",
      "TV satellitare",
      "Climatizzazione regolabile",
      "Minibar",
    ],
    cta: "Cerca la Suite",
    ctaSecondaria: "Parla con l'Ufficio Prenotazioni",
    ariaDiorama:
      "Ricostruzione 3D di una Suite da 44 metri quadri con due ambienti: zona soggiorno con divano letto e ampia scrivania, camera matrimoniale con armadio. Trascina per ruotare.",
    piantaAlt:
      "Pianta in scala della Suite: 44 metri quadri, soggiorno e camera con ingressi separati, due bagni.",
    sceneId: "suite",
  },
] as const satisfies readonly Room[];

/** Ordine di presentazione: Classic, Family, Suite (tab, confronto, schede). */
export const roomIds = ["classic", "family", "suite"] as const satisfies readonly RoomId[];

export function roomById(id: RoomId): (typeof rooms)[number] {
  const r = rooms.find((x) => x.id === id);
  if (!r) throw new Error(`Camera sconosciuta: ${id}`);
  return r;
}

export function roomBySlug(slug: string): (typeof rooms)[number] | undefined {
  return rooms.find((x) => x.slug === slug);
}

/**
 * Consigliere «Chi viaggia?» (UX 5.1): quale camera propone e quali ospiti preimposta.
 * Le etichette e le risposte sono in copy.camere.consigliere (stesse chiavi).
 */
export type ChiViaggia = "coppia" | "famiglia" | "lavoro" | "quattroAdulti";

export const consigliere: Readonly<Record<ChiViaggia, { camera: RoomId; ospiti: Ospiti }>> = {
  coppia: { camera: "classic", ospiti: { adulti: 2, bambini: 0 } },
  famiglia: { camera: "family", ospiti: { adulti: 2, bambini: 2 } },
  lavoro: { camera: "suite", ospiti: { adulti: 2, bambini: 0 } },
  quattroAdulti: { camera: "suite", ospiti: { adulti: 4, bambini: 0 } },
};

export const consigliereOrdine = ["coppia", "famiglia", "lavoro", "quattroAdulti"] as const satisfies readonly ChiViaggia[];
