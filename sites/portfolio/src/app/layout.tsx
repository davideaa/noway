import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { MotionPrefsProvider } from "@/components/motion/MotionPrefs";
import { RiskBar } from "@/components/site/RiskBar";
import { DESCRIPTION, OG_ALT, SITE_NAME, SITE_URL, TITLE } from "@/lib/site";

// Font self-hosted da next/font: nessuna chiamata a Google dal visitatore.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: TITLE,
  description: DESCRIPTION,
  alternates: SITE_URL ? { canonical: "/" } : undefined,
  // Icone dal kit di brand (public/). favicon.ico di Next rimosso: prevaleva sull'SVG.
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    // og:image deve essere assoluta. Senza NEXT_PUBLIC_SITE_URL Next scriverebbe
    // http://localhost:3000/og.png: meglio nessuna immagine che un indirizzo sbagliato.
    images: SITE_URL ? [{ url: "/og.png", width: 1200, height: 630, alt: OG_ALT }] : undefined,
  },
  twitter: {
    card: SITE_URL ? "summary_large_image" : "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: SITE_URL ? ["/og.png"] : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#080b0e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// Aggiunge .js prima del primo disegno: lo stato "nascosto" delle entrate
// esiste solo se JavaScript gira. Senza JS il contenuto e' sempre visibile.
const JS_FLAG = "document.documentElement.classList.add('js')";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${manrope.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#contenuto" className="skip">
          Vai al contenuto
        </a>
        {/* Ogni rotta porta il proprio <main id="contenuto">: il film (/) e i dettagli (/dettagli).
            La barra del rischio e' qui: sempre visibile, in entrambe. */}
        <MotionPrefsProvider>
          {children}
          <RiskBar />
        </MotionPrefsProvider>
      </body>
    </html>
  );
}
