/*
 * Hook di risoluzione per eseguire i file .ts di src/ con `node --test` senza compilarli.
 * Node 22 toglie i tipi da solo, ma non capisce due cose che usa il codice del sito:
 *   - l'alias `@/…`  (tsconfig: "@/*" -> "./src/*");
 *   - gli import relativi senza estensione (`./dates`).
 * Qui si risolvono entrambi cercando il file con estensione .ts / .tsx.
 */
import { existsSync, statSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = resolvePath(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const EXT = [".ts", ".tsx", "/index.ts", "/index.tsx"];

function trova(base) {
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const e of EXT) if (existsSync(base + e)) return base + e;
  return null;
}

export async function resolve(specifier, context, next) {
  let base = null;
  if (specifier.startsWith("@/")) {
    base = resolvePath(SRC, specifier.slice(2));
  } else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (base) {
    const file = trova(base);
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  return next(specifier, context);
}
