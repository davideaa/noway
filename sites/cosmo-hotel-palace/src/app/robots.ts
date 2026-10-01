/*
 * robots.txt (COPY 14.1): permette tutto e indica la sitemap. Statico (scritto a build in out/).
 */
import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/seo/metadata"

export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
