import type { NextConfig } from "next";

// EXPORT_STATIC=1 produce una versione statica (cartella out-export) con
// percorsi relativi, usata solo per le anteprime pubblicate fuori da un server
// Node. La build normale (`next build`) non cambia.
const staticExport = process.env.EXPORT_STATIC === "1";
// EXPORT_HOST=1: export statico per un hosting vero (Netlify, Vercel, Pages):
// percorsi assoluti normali, cartella out-host.
const hostExport = process.env.EXPORT_HOST === "1";

const nextConfig: NextConfig = hostExport
  ? {
      output: "export",
      distDir: "out-host",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : staticExport
  ? {
      output: "export",
      distDir: "out-export",
      assetPrefix: "./",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {
      // /simulatore/ e' un HTML autonomo di Davide in public/simulatore/index.html:
      // Next non serve l'indice di una cartella, quindi la rotta si riscrive sul file.
      // Nell'export statico non serve: l'host serve index.html da solo.
      async rewrites() {
        return [{ source: "/simulatore", destination: "/simulatore/index.html" }];
      },
    };

export default nextConfig;
