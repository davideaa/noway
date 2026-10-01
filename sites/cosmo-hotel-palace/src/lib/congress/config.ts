/**
 * Configurazione del modulo congressi (UX 7.3, DECISIONI 11).
 *
 * `HAS_BACKEND = false`: il sito è statico (`output: 'export'`) e non ha un server che riceva le
 * richieste. Finché è false:
 *  - il pulsante principale del modulo si chiama «Apri la email con la richiesta»
 *    (`copy.congressi.modulo.senzaBackend.pulsante`) e apre un `mailto:` precompilato (`mailto.ts`);
 *  - sotto compaiono «Copia il testo della richiesta» e l'indirizzo dell'Ufficio Eventi;
 *  - non si mostra MAI «Richiesta inviata» (i testi `soloConBackend` di COPY restano inutilizzati).
 * Va a `true` solo quando esiste un invio vero (e allora cambiano i testi, non questa logica).
 */
export const HAS_BACKEND = false;

/** Limite di caratteri del messaggio libero nel `mailto:` (UX 7.3: i mailto lunghi falliscono). */
export const MAX_MESSAGGIO_MAILTO = 1000;

/**
 * Lunghezza massima, in caratteri, dell'URL `mailto:` completo (già codificato). Oltre questa
 * soglia diversi client di posta (e alcuni browser) non aprono il messaggio: si accorcia il
 * messaggio libero. Valore prudente, NON verificato sui client reali.
 */
export const MAX_URL_MAILTO = 1900;
