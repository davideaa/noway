/** Costanti del sito. Il nome e' provvisorio (COPY.md): va confermato da Davide. */
export const SITE_NAME = "Portfolio Algo Manager";

export const TITLE = "Strategie algoritmiche sull'oro (XAUUSD): metodo e rischio";
export const DESCRIPTION =
  "Strategie trend following su XAUUSD con criteri fissati prima del test, fuori campione, scarti e drawdown vero. Sono backtest, non risultati reali.";

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
