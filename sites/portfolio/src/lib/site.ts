/** Costanti del sito. Il nome e' provvisorio (COPY.md): va confermato da Davide. */
export const SITE_NAME = "Portfolio Algo Manager";

/** COPY.md v2 (sez. 2, versione "tre strategie"). */
export const TITLE = "Strategie algoritmiche su oro, Nasdaq e USDJPY: il metodo";
export const DESCRIPTION =
  "Tre strategie su oro, Nasdaq e USDJPY: criteri fissati prima del test, correlazioni e drawdown. Risultati validati fuori campione, non garantiti.";
export const DETTAGLI_TITLE = "Tre strategie algoritmiche: metodo, numeri e rischio";

/** L'unico h1 (COPY.md 3.1) e le due frasi del film (COPY.md 3.2 e footer): il film non ha altro testo. */
export const FILM_H1 = "Tre strategie algoritmiche, misurate e raccontate senza ritocchi";
export const FILM_PHRASE_A = "Si decide prima, si misura dopo.";
/** Frase B del film (una sola costante: se Davide manda la sua versione, si cambia qui). */
export const FILM_PHRASE_B = "Misurato fuori campione. Non promesso.";

/**
 * La frase sul rischio (COPY.md, "Navigazione e barra fissa" e 3.9; fonte:
 * richiesta di Davide, riformulata). Versione completa (avviso, finale del film)
 * e versione breve (barra fissa). Mai "machine learning", mai "alta probabilita'".
 */
export const RISK_STATEMENT =
  "Risultati di backtest validati fuori campione con metodo quantitativo: criteri fissati prima del test, dati mai visti, bootstrap a blocchi. Non garantiscono rendimenti futuri: indicano la mediana di cosa aspettarsi, e il suo intervallo, se il vantaggio esiste e non si è rotto.";
export const RISK_SHORT = "Backtest validati fuori campione · non garantiscono rendimenti futuri · non è consulenza finanziaria";

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

/** Ordine delle scene di /dettagli (COPY.md v2, sezioni 3.1-3.9). `nav` = compare nel menu. */
export const SCENES: Scene[] = [
  { id: "ingresso", n: "01", label: "Ingresso" },
  { id: "metodo", n: "02", label: "Metodo", nav: true },
  { id: "strategie", n: "03", label: "Strategie", nav: true },
  { id: "portafoglio", n: "04", label: "Portafoglio", nav: true },
  { id: "scartate", n: "05", label: "Scartate" },
  { id: "rischio", n: "06", label: "Rischio", nav: true },
  { id: "monitoraggio", n: "07", label: "Monitoraggio", nav: true },
  { id: "contatti", n: "08", label: "Contatti", nav: true },
  { id: "avviso", n: "09", label: "Avviso" },
];
