import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { MotionPrefsProvider } from "@/components/motion/MotionPrefs";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { RiskBar } from "@/components/site/RiskBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { DESCRIPTION, SITE_NAME, SITE_URL, TITLE } from "@/lib/site";

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
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    // Immagine social: [DA COMPLETARE] in COPY.md, quindi omessa.
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
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
        <MotionPrefsProvider>
          <SiteHeader />
          <main id="contenuto" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <RiskBar />
        </MotionPrefsProvider>
        <RevealObserver />
      </body>
    </html>
  );
}
