import type { NextConfig } from "next";

// EXPORT_STATIC=1 produce una versione statica (cartella out-export) con
// percorsi relativi, usata solo per le anteprime pubblicate fuori da un server
// Node. La build normale (`next build`) non cambia.
const staticExport = process.env.EXPORT_STATIC === "1";

const nextConfig: NextConfig = staticExport
  ? {
      output: "export",
      distDir: "out-export",
      assetPrefix: "./",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
