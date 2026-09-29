import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Statico anche nell'export (EXPORT_STATIC=1): non dipende da richieste.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // Senza URL pubblico non si inventa un dominio (COPY.md: [DA COMPLETARE: URL]).
    sitemap: SITE_URL ? `${SITE_URL}/sitemap.xml` : undefined,
  };
}
