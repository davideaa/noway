import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // Senza URL pubblico non si inventa un dominio (COPY.md: [DA COMPLETARE: URL]).
    sitemap: SITE_URL ? `${SITE_URL}/sitemap.xml` : undefined,
  };
}
