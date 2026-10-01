/**
 * Risolutore per `node --test` sui file TypeScript del progetto (Node >= 22.18, nessuna compilazione).
 * Node legge i `.ts` da solo (type stripping) ma non sa risolvere gli import senza estensione
 * (`import ... from "../../content/copy"`) né l'alias `@/` di tsconfig: li risolve questo hook.
 * Non va in `src/`: è solo per i test. Uso (dalla cartella del progetto):
 *
 *   node --import ./tests/unit/ts-resolve.mjs --test "tests/unit/*.test.ts"
 */
import { registerHooks } from "node:module";
import { existsSync, statSync } from "node:fs";
import { dirname, resolve as risolviPercorso } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const radice = risolviPercorso(dirname(fileURLToPath(import.meta.url)), "..", "..");

function provaFile(base) {
  for (const cand of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (existsSync(cand) && statSync(cand).isFile()) return pathToFileURL(cand).href;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, next) {
    let base = null;
    if (specifier.startsWith("@/")) base = risolviPercorso(radice, "src", specifier.slice(2));
    else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
      base = risolviPercorso(dirname(fileURLToPath(context.parentURL)), specifier);
    }
    if (base && !/\.(m?js|cjs|json|tsx?)$/.test(base)) {
      const url = provaFile(base);
      if (url) return { url, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
