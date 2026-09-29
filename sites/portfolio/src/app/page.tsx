import { Film } from "@/components/film/Film";
import { FilmTopBar } from "@/components/film/FilmTopBar";
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

/**
 * Home = il film a scroll (SPEC-FILM.md). Nessuna sezione: una traccia, una
 * stage, un canvas. Titolo e due frasi; tutto il resto e' in /dettagli.
 */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, "\\u003c") }}
      />
      <FilmTopBar />
      <main id="contenuto" className="flex-1">
        <Film />
      </main>
    </>
  );
}
