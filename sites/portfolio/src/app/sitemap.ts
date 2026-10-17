import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Statico anche nell'export (EXPORT_STATIC=1): non dipende da richieste.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Film (/) e dettagli (/dettagli). Fase 2 (inglese): aggiungere /en/. Senza URL pubblico la lista resta vuota.
  return SITE_URL ? [{ url: `${SITE_URL}/` }, { url: `${SITE_URL}/dettagli` }] : [];
}
