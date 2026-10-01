import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sito statico: `next build` produce la cartella out/ (DECISIONI 13)
  output: "export",
  // /camere → /camere/ ed emette /camere/index.html
  trailingSlash: true,
  // nessun server di immagini in un export statico (e nessuna foto raster nel sito)
  images: { unoptimized: true },
};

export default nextConfig;
