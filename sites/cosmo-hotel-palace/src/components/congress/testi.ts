/**
 * Testi e piccole funzioni di formato della pagina Centro Congressi (modulo 13).
 *
 * I testi di COPY stanno in `content/copy.ts` e qui si leggono, non si copiano. Quello che COPY
 * non ha (UX 15 «NUOVO TESTO», DECISIONI 12) è scritto qui, con commento, perché il modulo 13
 * non modifica i file degli altri moduli. Il coordinatore può spostarli in `copy.ts`.
 */

import { copy, fmt } from "@/content/copy";
import type { CongressHall, Disposizione } from "@/content/types";
import { etichettaDisposizione } from "@/lib/congress/availability";

const cfg = copy.congressi.configuratore;

/* ───────────────────────── Formato ───────────────────────── */

/** 18.5 -> «18,5». */
export const numIt = (n: number): string => String(n).replace(".", ",");

/** «25 × 20» (come pubblicato, nell'ordine di `dims`). */
export const misureSala = (h: CongressHall): string => `${numIt(h.dims[0])} × ${numIt(h.dims[1])}`;

export const pianoSala = (h: CongressHall): string =>
  h.floor === 0 ? cfg.risultato.pianoTerra : cfg.risultato.pianoInferiore;

/** «Platea» -> «platea» (nelle frasi). */
export const minuscolo = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

export const etichettaMin = (d: Disposizione): string => minuscolo(etichettaDisposizione(d));

/** «Banchi di scuola e Ferro di cavallo». */
export function elencoE(voci: readonly string[]): string {
  if (voci.length <= 1) return voci.join("");
  return `${voci.slice(0, -1).join(", ")} e ${voci[voci.length - 1]}`;
}

/** Riga dati sotto il risultato: «325 m² · 18,5 × 17,5 m · altezza 4,22 m · piano terra». */
export function datiSala(h: CongressHall): string {
  return fmt(cfg.risultato.dati, {
    superficie: h.areaM2,
    dimensioni: misureSala(h),
    h: numIt(h.heightM),
    piano: pianoSala(h),
  });
}

/** «fino a 500 persone» della riga risultato. */
export function rigaRisultato(h: CongressHall, d: Disposizione, cap: number): string {
  return fmt(cfg.risultato.riga, { sala: h.name, disposizione: etichettaMin(d), n: cap });
}

/** Il numero di ospiti scritto dall'utente, se è una cifra sensata; altrimenti `null`. */
export function leggiOspiti(s: string): number | null {
  const t = s.trim();
  if (!/^\d{1,5}$/.test(t)) return null;
  const n = Number(t);
  return n > 0 ? n : null;
}

/* ───────────────────────── NUOVO TESTO ───────────────────────── */

export const testi = {
  // NUOVO TESTO
  aiutoPartecipanti: "Facoltativo. Se lo scrivi, il disegno mostra quel numero di sedie.",
  // NUOVO TESTO: etichetta del segmento 3D / Pianta e dei pulsanti della vista
  vista: {
    aria: "Vista della sala",
    tre_d: "3D",
    pianta: "Pianta",
    ruotaSinistra: "Ruota la sala a sinistra",
    ruotaDestra: "Ruota la sala a destra",
    ripristina: "Ripristina vista",
    istruzioni: "Trascina per ruotare la sala. Con la tastiera usa le frecce.",
    // la pianta è un disegno: l'alternativa testuale è la riga risultato
    legenda: { palco: "Palco", sedia: "Sedia", tavolo: "Tavolo" },
    palcoASinistra: "Il palco è a sinistra.",
  },
  // NUOVO TESTO: annuncio quando la sala torna unita (COPY ha solo «Sala divisa in {k} parti.»)
  salaUnita: "Sala riunita.",
  // NUOVO TESTO (UX 7.2: sulla sala divisa non c'è nessuna capienza)
  salaDivisaSenzaSedie: "Nessuna sedia: le capienze delle singole sale sono nell'elenco.",
  // NUOVO TESTO: sotto i chip quando la sala è divisa (i numeri dei chip sono quelli della sala unita)
  capienzeSalaUnita: "Con le pareti mobili chiuse non ci sono sedie. Le capienze qui sopra sono quelle della sala unita.",
  // NUOVO TESTO: più disposizioni non indicate insieme. {elenco}, {sala}, {disposizioni}
  nonIndicatePiu: "{elenco}: non indicate per {sala}. Prova con {disposizioni}.",
  // NUOVO TESTO: il chip senza capienza
  nonIndicata: "non indicata",
  // NUOVO TESTO: «fino a {n}» sotto l'etichetta del chip
  finoA: "fino a {n}",
  // NUOVO TESTO: elenco delle sale, scelta sul telefono
  elenco: {
    // aria-label del gruppo di radio
    ariaGruppo: "Sala",
    finoA: "fino a {n}",
    chiudi: "Chiudi l'elenco delle sale",
    misure: "{mq} m² · {dims} m",
  },
  // NUOVO TESTO: link «Modifica» e riepilogo con sala divisa. {sala}, {k}
  riepilogoDivisa: "La tua configurazione: {sala} · divisa in fino a {k} sale.",
  // NUOVO TESTO: riga di invito sopra la tabella e regione scorrevole
  tabella: {
    regione: "Tabella delle sale e delle capienze. Su schermi stretti scorre di lato.",
    ordinaPer: "Ordina per",
    nome: "Nome",
    colonne: {
      sala: "Sala",
      platea: "Platea",
      banchi: "Banchi",
      ferro: "Ferro",
      banchetto: "Banchetto",
      superficie: "m²",
      dimensioni: "Dimensioni (m)",
      altezza: "Altezza (m)",
      piano: "Piano",
    },
    // parte nascosta del nome della colonna, per i lettori di schermo
    nascosta: { banchi: " di scuola", ferro: " di cavallo" },
    ordinePerAnnuncio: "Sale ordinate per {criterio}.",
    nonIndicata: "non indicata",
    intro: "Capienze in numero di persone, come da tabella del Centro Congressi. Un trattino vuol dire che la disposizione non è indicata per quella sala.",
    ariaOrdina: "Ordina per {colonna}",
  },
  // NUOVO TESTO: modulo
  modulo: {
    sceglisala: "Scegli la sala",
    scegliTipo: "Scegli il tipo di evento",
    nonIndicataNelLabel: "(non indicata per questa sala)",
    obbligatorio: "obbligatorio",
    informativaNuovaScheda: "Informativa privacy (si apre in una nuova scheda)",
    messaggioTagliato:
      "Il messaggio è lungo: nella email precompilata l'ho accorciato. Con «Copia il testo della richiesta» lo hai intero.",
    copiaFallita: "Non sono riuscito a copiare. Seleziona il testo qui sotto e copialo a mano.",
    senzaJs:
      "Senza JavaScript il pulsante prova ad aprire la tua email con i campi compilati. Se non si apre, scrivi a events@cosmohotelpalace.it.",
    areaTesto: "Testo della richiesta",
    contatti: "Preferisci parlare con qualcuno?",
    salaPlaceholder: "",
  },
  // NUOVO TESTO: senza JavaScript
  senzaJs:
    "Il configuratore ha bisogno di JavaScript. Qui sotto trovi comunque la tabella delle sale e il modulo per chiedere una proposta.",
  // NUOVO TESTO: «Trova la sala»
  trova: {
    sottotitolo: "Dimmi quante persone sono e come vuoi disporle: ti indico la sala più piccola che basta.",
    persone: "Quante persone?",
    disposizione: "Disposizione",
    vedi: "Vedi la sala nel configuratore",
    cifre: "Scrivi il numero con le cifre, ad esempio 120.",
    vuoto: "Scrivi quante persone sono per vedere le sale adatte.",
  },
  // NUOVO TESTO: link sulle schede dell'intro (aprono il configuratore su quella sala)
  hero: { vediSala: "Vedila nel configuratore" },
} as const;

/**
 * Risultato di «Trova la sala»: COPY (`trovaSala.risultato`) più i casi di 1 persona e delle altre sale.
 * Niente conteggi: «Altre {k} sale» con k = 24 direbbe quante sono in tutto (DECISIONI 7). Si
 * nominano invece le prossime sale adatte (al massimo tre), dalla più piccola in su.
 */
export function risultatoTrova(
  n: number,
  d: Disposizione,
  migliore: CongressHall,
  altre: readonly CongressHall[],
): string {
  const c = migliore.cap[d] ?? 0;
  const base = fmt(cfg.trovaSala.risultato, {
    n,
    disposizione: etichettaMin(d),
    sala: migliore.name,
    c,
    k: altre.length,
  });
  // «… (fino a 500). Altre 3 sale vanno bene.»: si tiene solo la prima frase
  const taglio = base.indexOf(" Altre ");
  const testa = taglio >= 0 ? base.slice(0, taglio) : base;
  const persone = n === 1 ? testa.replace(/^1 persone/, "1 persona") : testa;
  if (altre.length === 0) return persone;
  const nomi = altre.slice(0, 3).map((h) => h.name);
  const coda = altre.length > 3 ? `${nomi.join(", ")} e altre` : elencoE(nomi);
  return `${persone} Vanno bene anche ${coda}.`;
}
