import type { Metadata } from "next";
import { Avviso } from "@/components/sections/Avviso";
import { Contatti } from "@/components/sections/Contatti";
import { Hero } from "@/components/sections/Hero";
import { Metodo } from "@/components/sections/Metodo";
import { Monitoraggio } from "@/components/sections/Monitoraggio";
import { Rischio } from "@/components/sections/Rischio";
import { Scartate } from "@/components/sections/Scartate";
import { Strategie } from "@/components/sections/Strategie";
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

/** La pagina onesta: tabelle, metodo, scarti, rischio e avviso completo (la vecchia home). */
export default function Dettagli() {
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
