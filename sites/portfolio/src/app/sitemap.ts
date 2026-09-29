import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Pagina unica. Fase 2 (inglese): aggiungere /en/. Senza URL pubblico la lista resta vuota.
  return SITE_URL ? [{ url: `${SITE_URL}/` }] : [];
}
