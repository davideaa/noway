import type { Metadata } from "next";
import { Esplora } from "@/components/esplora/Esplora";
import { Avviso } from "@/components/sections/Avviso";
import { Contatti } from "@/components/sections/Contatti";
import { Hero } from "@/components/sections/Hero";
import { esploraData } from "@/lib/esplora";
import { DESCRIPTION, DETTAGLI_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: DETTAGLI_TITLE,
  description: DESCRIPTION,
  alternates: SITE_URL ? { canonical: "/dettagli" } : undefined,
  openGraph: { title: DETTAGLI_TITLE, description: DESCRIPTION },
  twitter: { title: DETTAGLI_TITLE, description: DESCRIPTION },
};

function jsonLd() {
  const page = SITE_URL
    ? { "@id": `${SITE_URL}/dettagli#pagina`, url: `${SITE_URL}/dettagli`, isPartOf: { "@id": `${SITE_URL}/#website` } }
    : {};
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    ...page,
    name: DETTAGLI_TITLE,
    description: DESCRIPTION,
    inLanguage: "it",
  };
}

/**
 * La pagina dei risultati (Davide): corta. In cima l'ingresso, poi le quattro
 * schede da scegliere (Oro, Nasdaq, USDJPY, Portafoglio): ognuna apre la sua
 * pagina di soli risultati. In fondo contatti e avviso sul rischio.
 * Niente regole, niente storia del metodo, niente prove scartate.
 */
export default function Dettagli() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, "\\u003c") }}
      />
      <Esplora
        data={esploraData()}
        hero={<Hero />}
        rest={
          <>
            <Contatti />
            <Avviso />
          </>
        }
      />
    </>
  );
}
