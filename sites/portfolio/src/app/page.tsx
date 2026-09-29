import { Avviso } from "@/components/sections/Avviso";
import { Contatti } from "@/components/sections/Contatti";
import { Hero } from "@/components/sections/Hero";
import { Metodo } from "@/components/sections/Metodo";
import { Monitoraggio } from "@/components/sections/Monitoraggio";
import { Rischio } from "@/components/sections/Rischio";
import { Scartate } from "@/components/sections/Scartate";
import { Strategie } from "@/components/sections/Strategie";
import { DESCRIPTION, SITE_NAME, SITE_URL, TITLE } from "@/lib/site";

// JSON-LD minimo (COPY.md sez. 2): solo WebSite e WebPage. Gli url si
// aggiungono solo quando l'URL pubblico e' noto (NEXT_PUBLIC_SITE_URL).
function jsonLd() {
  const site = SITE_URL ? { "@id": `${SITE_URL}/#website`, url: SITE_URL } : {};
  const page = SITE_URL
    ? { "@id": `${SITE_URL}/#pagina`, url: SITE_URL, isPartOf: { "@id": `${SITE_URL}/#website` } }
    : {};
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", ...site, name: SITE_NAME, inLanguage: "it" },
      { "@type": "WebPage", ...page, name: TITLE, description: DESCRIPTION, inLanguage: "it" },
    ],
  };
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <Metodo />
      <Strategie />
      <Scartate />
      <Rischio />
      <Monitoraggio />
      <Contatti />
      <Avviso />
    </>
  );
}
