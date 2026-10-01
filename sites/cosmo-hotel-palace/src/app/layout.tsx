import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

/*
 * Font (DESIGN 3). Self-hosted da next/font: nessuna richiesta a Google a runtime.
 * Solo sottoinsieme latin (copre le lettere accentate italiane), display: swap.
 * Fraunces: asse variabile del peso + SOFT + opsz (WONK resta al valore di default).
 * Il corsivo di Fraunces (solo asse del peso, 40 KB) non viene precaricato
 * (preload: false): il browser lo scarica solo se in pagina c'è davvero del testo
 * in corsivo (una parola per titolo, DESIGN 3).
 * Peso misurato (latin, woff2): Fraunces 121 KB + Hanken 35 KB = 155 KB (budget 180).
 * Con il corsivo in pagina: 196 KB, cioè oltre il budget: usarlo con parsimonia.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  display: "swap",
  variable: "--font-fraunces",
});

const frauncesItalic = Fraunces({
  subsets: ["latin"],
  style: "italic",
  display: "swap",
  preload: false,
  variable: "--font-fraunces-italic",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // permette a env(safe-area-inset-*) di valere qualcosa (pillola, foglio, menu)
  viewportFit: "cover",
  // sabbia-50: il colore del fondo pagina (la barra del browser si fonde con l'header)
  themeColor: "#FAF6EE",
};

// Titolo e descrizione di ripiego (da COPY 14, home). Le pagine li sostituiscono
// (modulo 15 «SEO e statico»).
export const metadata: Metadata = {
  title: {
    default: "Hotel a 2 km da Milano con parcheggio | Cosmo Hotel Palace",
    template: "%s | Cosmo Hotel Palace",
  },
  description:
    "Hotel e Centro Congressi a Cinisello Balsamo, a 2 km da Milano. 201 camere, Cosmo Grill, wellness e 200 posti auto gratuiti.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="it"
      className={`${fraunces.variable} ${frauncesItalic.variable} ${hanken.variable}`}
    >
      <body>
        {/* SLOT skip-link: primo elemento tabulabile. Il modulo 7 (SkipLink.tsx) può sostituirlo. */}
        <a className="skip-link" href="#contenuto">
          Vai al contenuto
        </a>

        {/* SLOT header: modulo 7 (components/shell/Header) */}

        {/* Unico <main> del sito: le pagine NON ne rendono un altro. */}
        <main id="contenuto" tabIndex={-1}>
          {children}
        </main>

        {/* SLOT footer: modulo 7 (components/shell/Footer)
            SLOT barra/pillola prenotazione: modulo 4 (BookingProvider, BookingBar, BookingPill) */}

        {/* Regioni aria-live (lib/a11y.ts → announce()). Presenti fin dal primo HTML:
            i lettori di schermo registrano meglio una regione che esiste già. */}
        <div
          id="a11y-polite"
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />
        <div
          id="a11y-assertive"
          className="sr-only"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        />
      </body>
    </html>
  );
}
