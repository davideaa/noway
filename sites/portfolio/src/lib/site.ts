/** Costanti del sito. Il nome e' provvisorio (COPY.md): va confermato da Davide. */
export const SITE_NAME = "Portfolio Algo Manager";

/** COPY.md v2 (sez. 2, versione "tre strategie"). */
export const TITLE = "Strategie algoritmiche su oro, Nasdaq e USDJPY: il metodo";
export const DESCRIPTION =
  "Tre strategie su oro, Nasdaq e USDJPY: criteri fissati prima del test, fuori campione, correlazioni e drawdown. Sono backtest, non risultati reali.";
export const DETTAGLI_TITLE = "Tre strategie algoritmiche: metodo, numeri e rischio";

/** L'unico h1 (COPY.md 3.1) e le due frasi del film (COPY.md 3.2 e footer): il film non ha altro testo. */
export const FILM_H1 = "Tre strategie algoritmiche, misurate e raccontate senza ritocchi";
export const FILM_PHRASE_A = "Si decide prima, si misura dopo.";
export const FILM_PHRASE_B = "Backtest, non risultati reali.";

/** Testo alternativo dell'immagine social (COPY.md sez. 5). */
export const OG_ALT = "Portfolio Algo Manager: strategie algoritmiche su XAUUSD, backtest e rischio dichiarati.";

/** Indirizzo come scritto nel mailto; in pagina si mostra in minuscolo (DESIGN.md sez. 7). */
export const EMAIL = "PORTFOLIOALGOMANAGER21@gmail.com";
export const EMAIL_SHOWN = EMAIL.toLowerCase();
export const MAILTO = `mailto:${EMAIL}?subject=Domanda%20sul%20metodo&body=Ciao%2C%0A%0Avorrei%20chiedere%3A%0A%0A`;

/**
 * URL pubblico: non e' ancora deciso (COPY.md, [DA COMPLETARE: URL]).
 * Si imposta con NEXT_PUBLIC_SITE_URL al momento del deploy; senza, sitemap,
 * canonical e i campi url del JSON-LD vengono omessi invece di inventare un dominio.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || undefined;

export type Scene = { id: string; n: string; label: string; nav?: boolean };

/** Ordine delle scene (COPY.md, sezioni 3.1-3.8). `nav` = compare nel menu. */
export const SCENES: Scene[] = [
  { id: "ingresso", n: "01", label: "Ingresso" },
  { id: "metodo", n: "02", label: "Metodo", nav: true },
  { id: "strategie", n: "03", label: "Strategie", nav: true },
  { id: "scartate", n: "04", label: "Scartate" },
  { id: "rischio", n: "05", label: "Rischio", nav: true },
  { id: "monitoraggio", n: "06", label: "Monitoraggio", nav: true },
  { id: "contatti", n: "07", label: "Contatti", nav: true },
  { id: "avviso", n: "08", label: "Avviso" },
];
