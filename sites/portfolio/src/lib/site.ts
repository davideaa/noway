/** Costanti del sito. Il nome e' provvisorio (COPY.md): va confermato da Davide. */
export const SITE_NAME = "Portfolio Algo Manager";

/** COPY.md v2 (sez. 2, versione "tre strategie"). */
export const TITLE = "Strategie algoritmiche su XAUUSD, Nasdaq e USDJPY: il metodo";
export const DESCRIPTION =
  "Tre strategie su XAUUSD, Nasdaq e USDJPY: criteri fissati prima del test, correlazioni e drawdown. Risultati validati fuori campione, non garantiti.";
export const DETTAGLI_TITLE = "Tre strategie algoritmiche: metodo, numeri e rischio";

/**
 * Il PROLOGO del film (brief di Davide, testi esatti): tre schermate sopra la
 * figura dell'atto 1. S1 e' l'unico h1 della home.
 */
export const FILM_H1 = "Tre strategie algoritmiche validate attraverso modelli quantitativi.";
export const FILM_SUB = "USDJPY · NASDAQ · XAUUSD";
export const FILM_S2 = "Analisi quantitativa, IA e conoscenza dei mercati trasformano ipotesi di trading in sistemi statistici verificabili.";
export const FILM_S3_WORDS = ["OSSERVIAMO", "VERIFICHIAMO", "COSTRUIAMO"];
export const FILM_S3 = "Dal comportamento del mercato all'ipotesi. Dall'ipotesi ai dati. Dai dati a un sistema replicabile.";
/** La schermata finale: un titolo, UN bottone (porta a /dettagli). */
export const FILM_END = "L’innovazione è il nostro modo di procedere.";
export const FILM_CTA = "ESPLORA IL PORTFOLIO →";
/** Le due frasi ricorrenti degli atti 2-5 (COPY.md 3.2). */
export const FILM_PHRASE_A = "Si decide prima, si misura dopo.";
/**
 * Scena 5 (Davide): al posto della frase B, i due periodi. "\n" = a capo voluto
 * (due righe centrate). Anni dai dati: oro e Nasdaq ottimizzati 2019-2023 e
 * validati da gen 2024; USDJPY validata gia' da gen 2023 (fuori campione piu'
 * lungo). Il 2023 non va in entrambi i periodi: sarebbe falso.
 */
export const FILM_S5 = "Ottimizzato su un arco temporale 2019–2023,\nvalidato su un altro: 2024–2026.";
/** Scena 6 (Davide): "Questo è" piccolo e sotto, in grande e su UNA riga, il nome. */
export const FILM_S6_PRE = "Questo è";

/**
 * La frase sul rischio (COPY.md, "Navigazione e barra fissa" e 3.9; fonte:
 * richiesta di Davide, riformulata). Versione completa (avviso, finale del film)
 * e versione breve (barra fissa). Mai "machine learning", mai "alta probabilita'".
 */
export const RISK_STATEMENT =
  "Risultati di backtest validati fuori campione con metodo quantitativo: criteri fissati prima del test, dati mai visti, bootstrap a blocchi. Non garantiscono rendimenti futuri: indicano la mediana di cosa aspettarsi, e il suo intervallo, se il vantaggio esiste e non si è rotto.";
/** La barra fissa in basso (brief di Davide, testo esatto): mono, piccola, sempre visibile. */
export const RISK_BAR = "V2 · BACKTEST SU DATI STORICI · TRADING AD ALTO RISCHIO · NON È CONSULENZA FINANZIARIA";

/** Testo alternativo dell'immagine social (COPY.md sez. 5). */
export const OG_ALT = "Portfolio Algo Manager: strategie algoritmiche su XAUUSD, backtest e rischio dichiarati.";

/** Indirizzo come scritto nel mailto; in pagina si mostra in minuscolo (DESIGN.md sez. 7). */
export const EMAIL = "PORTFOLIOALGOMANAGER21@gmail.com";
export const EMAIL_SHOWN = EMAIL.toLowerCase();
export const MAILTO = `mailto:${EMAIL}?subject=Domanda%20sul%20metodo&body=Ciao%2C%0A%0Avorrei%20chiedere%3A%0A%0A`;
/** Nel film il mailto e' in minuscolo (le email non distinguono le maiuscole). */
export const MAILTO_LOWER = `mailto:${EMAIL_SHOWN}?subject=Domanda%20sul%20metodo&body=Ciao%2C%0A%0Avorrei%20chiedere%3A%0A%0A`;

/**
 * URL pubblico: non e' ancora deciso (COPY.md, [DA COMPLETARE: URL]).
 * Si imposta con NEXT_PUBLIC_SITE_URL al momento del deploy; senza, sitemap,
 * canonical e i campi url del JSON-LD vengono omessi invece di inventare un dominio.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || undefined;

export type Scene = { id: string; n: string; label: string; nav?: boolean };

/** Ordine delle scene di /dettagli (COPY.md v2, sezioni 3.1-3.9, piu' il simulatore incorporato). `nav` = compare nel menu. */
export const SCENES: Scene[] = [
  { id: "ingresso", n: "01", label: "Ingresso" },
  { id: "esplora", n: "02", label: "Strategie", nav: true },
  { id: "contatti", n: "03", label: "Contatti", nav: true },
  { id: "avviso", n: "04", label: "Avviso", nav: true },
];
