/**
 * Web Worker del bake della figura: costruisce il ventaglio (plate.ts) fuori
 * dal thread principale e lo restituisce TRASFERENDO i buffer (zero copie).
 * Nessun DOM, nessun three: solo aritmetica. bake.ts lo avvia e, se manca o
 * fallisce, ripiega sul bake a fette sul thread principale.
 */
import { buildFan, type FanParams } from "./plate";

self.onmessage = (e: MessageEvent<FanParams>) => {
  const t0 = performance.now();
  const fan = buildFan(e.data.count, e.data.curves, e.data.width, e.data.height, e.data.depth, e.data.seed);
  const ms = performance.now() - t0;
  (self as unknown as Worker).postMessage({ fan, ms }, [fan.pos.buffer, fan.info.buffer, fan.col.buffer, fan.med.buffer, fan.samples.buffer]);
};
