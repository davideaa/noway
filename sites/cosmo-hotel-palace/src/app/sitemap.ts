/*
 * sitemap.xml (COPY 14.1): le pagine della fase 1, con slash finale. Statico: è scritto a build
 * dentro out/. Gli indirizzi sono assoluti: usano NEXT_PUBLIC_SITE_URL, o il dominio del sito
 * attuale se la variabile manca (DA CONFERMARE: dominio finale). Nessuna `lastModified`: non
 * abbiamo una data vera per pagina, e una data finta è peggio di nessuna data.
 */
import type { MetadataRoute } from "next"
import { absoluteUrl, LIVE_PAGES, pagePath } from "@/lib/seo/metadata"

export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  return LIVE_PAGES.map((chiave) => ({ url: absoluteUrl(pagePath(chiave)) }))
}
