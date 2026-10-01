/**
 * Contatti, indirizzo, social. SOLO dati del BRIEF (verificati riga per riga).
 * Il reparto «Ristorante» non è un ufficio a sé nel BRIEF: COPY sez. 10 lo mappa sul centralino
 * e su info@ (stessi dati del reparto Prenotazioni). Nessun orario degli uffici (DA CONFERMARE).
 */

export type Reparto = {
  id: "prenotazioni" | "eventi" | "commerciale" | "ristorante";
  nome: string;
  /** «Per cosa» (COPY sez. 10). */
  perCosa: string;
  /** Telefono come si legge. */
  telefono: string;
  /** Telefono per `tel:` (senza spazi). */
  telHref: string;
  email: string;
};

export const reparti = [
  { id: "prenotazioni", nome: "Prenotazioni", perCosa: "Camere, soggiorni, richieste speciali", telefono: "+39 02 617771", telHref: "+3902617771", email: "info@cosmohotelpalace.it" },
  { id: "eventi", nome: "Eventi", perCosa: "Centro Congressi, meeting, eventi privati", telefono: "+39 02 61 777 726", telHref: "+390261777726", email: "events@cosmohotelpalace.it" },
  { id: "commerciale", nome: "Commerciale", perCosa: "Accordi aziendali e collaborazioni", telefono: "+39 02 61 777 686", telHref: "+390261777686", email: "sales@cosmohotelpalace.it" },
  { id: "ristorante", nome: "Ristorante", perCosa: "Tavoli al Cosmo Grill e Lounge Bar", telefono: "+39 02 617771", telHref: "+3902617771", email: "info@cosmohotelpalace.it" },
] as const satisfies readonly Reparto[];

export type RepartoId = (typeof reparti)[number]["id"];

export function repartoById(id: RepartoId): (typeof reparti)[number] {
  const r = reparti.find((x) => x.id === id);
  if (!r) throw new Error(`Reparto sconosciuto: ${id}`);
  return r;
}

/** Centralino e email generale (telefono pubblicato anche nel footer e nel menu). */
export const centralino = {
  telefono: "+39 02 617771",
  telHref: "+3902617771",
  email: "info@cosmohotelpalace.it",
} as const;

export const indirizzo = {
  via: "Via F. De Sanctis, 5",
  cap: "20092",
  comune: "Cinisello Balsamo",
  provincia: "Milano",
  /** Come sul sito: «Via F. De Sanctis, 5 — 20092 Cinisello Balsamo (Milano)». */
  unaRiga: "Via F. De Sanctis, 5 — 20092 Cinisello Balsamo (Milano)",
  /** Valore per la ricerca su mappe (UX 8, `…/maps/search/?api=1&query=`): niente coordinate (non confermate). */
  perMappe: "Via F. De Sanctis, 5, 20092 Cinisello Balsamo (Milano)",
} as const;

export const cin = "IT015077A1P24TCBBO";

/**
 * Social. Le URL: Instagram dal BRIEF; Facebook dall'id di profilo del BRIEF (100071873230654),
 * nella forma `profile.php?id=` usata da COPY sez. 14.3 (JSON-LD `sameAs`).
 */
export const social = {
  instagram: { nome: "Instagram", url: "https://www.instagram.com/cosmohotelpalace" },
  facebook: { nome: "Facebook", url: "https://www.facebook.com/profile.php?id=100071873230654" },
  hashtag: "#YOURCOSMOHOTELPALACE",
} as const;

/** Altre strutture (BRIEF «Partner»). DA CONFERMARE: rapporto tra le strutture e link; non dire «gruppo». */
export const partner = ["Cosmo Hotel Torri", "Cosmo Residence", "Villa Trivulzio"] as const;
