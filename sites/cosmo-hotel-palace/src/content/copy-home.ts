/**
 * Testi NUOVI della home (modulo 11). Stanno qui e non in `copy.ts` (modulo 2) per non toccare un
 * file di altri; seguono DECISIONI 12: tono di COPY (frasi brevi, concrete, mai «esperienza
 * esclusiva») e commento `// NUOVO TESTO`. Tutto il resto della home legge `copy.ts`.
 */

export const copyHome = {
  /* ---------------------------- Hero ---------------------------- */
  hero: {
    // NUOVO TESTO (UX 5.2: ◀ ▶ per la hall; i testi di COPY sono quelli della camera)
    ruotaSinistra: "Guarda a sinistra",
    ruotaDestra: "Guarda a destra",
    ripristina: "Ripristina vista",
    // NUOVO TESTO (elenco testuale degli hotspot, UX 11.3)
    puntiTitolo: "Cosa c'è nella hall",
    puntiAria: "Punti della hall",
    // NUOVO TESTO (aiuto del cursore, letto dopo il valore)
    aiutoLuce: "Cambia la luce della scena.",
  },

  /* ---------------------------- Camere ---------------------------- */
  camere: {
    // NUOVO TESTO (nome accessibile del binario delle schede, UX 4.3 scena 3)
    ariaBinario: "Le tre camere. Scorri di lato per vederle tutte.",
    // NUOVO TESTO (stringhe dei tre dati veri sulla scheda)
    datoLetti: "Letti",
    datoOspiti: "Ospiti",
    datoBagni: "Bagni",
  },

  /* ---------------------------- Percorso ---------------------------- */
  percorso: {
    // NUOVO TESTO (nome dell'elenco numerato delle 5 tappe)
    ariaTappe: "Le cinque tappe da qui a Milano",
  },

  /* ---------------------------- Cosmo Grill ---------------------------- */
  grill: {
    // NUOVO TESTO (elenco testuale degli hotspot della sala)
    puntiTitolo: "I punti della sala",
    puntiAria: "Punti della sala",
    // NUOVO TESTO (aiuto del cursore)
    aiutoLuce: "Cambia la luce della sala.",
  },

  /* ---------------------------- Wellness ---------------------------- */
  wellness: {
    // NUOVO TESTO (nome dell'elenco dei 3 passi)
    ariaPassi: "Il percorso al sesto piano, in tre tappe",
    // NUOVO TESTO (frase di apertura breve: COPY ha solo il sottotitolo con gli orari)
    intro: "Sauna finlandese, bagno turco e sala attrezzi, al sesto piano dell'hotel.",
  },

  /* ---------------------------- Centro Congressi ---------------------------- */
  congressi: {
    // NUOVO TESTO (nome del gruppo di chip della scena)
    ariaDisposizione: "Disposizione della sala",
    // NUOVO TESTO (frase sotto la scena: sala e capienza della tabella)
    // (la riga è copy.congressi.configuratore.risultato.riga)
    // NUOVO TESTO (titolo dell'elenco delle sale)
    saleTitolo: "Tre modi di usare gli spazi",
    // NUOVO TESTO (esempio del selettore, per chi non ha ancora scritto un numero)
    selettoreVuoto: "Scrivi quante persone siete e ti diciamo da quale sala partire.",
    // NUOVO TESTO (aiuto del campo numerico)
    selettoreAiuto: "Una stima va bene.",
    // NUOVO TESTO (nome del gruppo dei 4 chip del selettore)
    ariaSelettore: "Disposizione per cercare la sala",
  },

  /* ---------------------------- Chiusura ---------------------------- */
  chiusura: {
    // NUOVO TESTO (la home non ha un testo di chiusura in COPY)
    h2: "Ti aspettiamo a 2 km da Milano.",
    corpo: "Scegli le date e cerca la tua camera sul motore di prenotazione del Cosmo.",
  },
} as const;
