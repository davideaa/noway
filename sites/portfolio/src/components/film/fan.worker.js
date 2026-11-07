/**
 * Web Worker del bake della figura: costruisce il ventaglio (plate.ts) fuori
 * dal thread principale e lo restituisce TRASFERENDO i buffer (zero copie).
 * Nessun DOM, nessun three: solo aritmetica. bake.ts lo avvia e, se manca o
 * fallisce, ripiega sul bake a fette sul thread principale.
 *
 * E' un .js e non un .ts di proposito: Turbopack, oltre al chunk del worker,
 * copia il file sorgente tra gli asset statici (`_next/static/media`), e una
 * copia .ts dentro out-host finiva nel typecheck della build successiva
 * (tsconfig include `**\/*.ts`) rompendola. Una copia .js e' innocua.
 */
import { buildFan } from "./plate";

/** @param {MessageEvent<import("./plate").FanParams>} e */
self.onmessage = (e) => {
  const t0 = performance.now();
  const fan = buildFan(e.data.count, e.data.curves, e.data.width, e.data.height, e.data.depth, e.data.seed);
  const ms = performance.now() - t0;
  self.postMessage({ fan, ms }, [fan.pos.buffer, fan.info.buffer, fan.col.buffer, fan.med.buffer, fan.samples.buffer]);
};
