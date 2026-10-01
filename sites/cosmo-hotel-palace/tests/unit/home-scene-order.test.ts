/*
 * Test di lib/home/scene-order (ordine delle scene e interruttore «Come viaggi?»).
 *
 *   node --test --import ./tests/unit/_register.mjs tests/unit/home-scene-order.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ID_SEZIONE,
  ORDINE,
  impostaModo,
  leggiModo,
  modoServer,
  primaScenaCambiata,
  sottoscriviModo,
} from "@/lib/home/scene-order";

test("l'ordine di base è «piacere» e le due liste hanno le stesse otto scene", () => {
  assert.equal(modoServer(), "piacere");
  assert.equal(leggiModo(), "piacere"); // al caricamento non si riordina mai
  assert.equal(ORDINE.piacere.length, 8);
  assert.deepEqual([...ORDINE.lavoro].sort(), [...ORDINE.piacere].sort());
});

test("hero e chiusura non si muovono; Congressi sale al terzo posto per lavoro", () => {
  for (const m of ["piacere", "lavoro"] as const) {
    assert.equal(ORDINE[m][0], "hero");
    assert.equal(ORDINE[m][1], "perche");
    assert.equal(ORDINE[m][7], "prenota");
  }
  assert.equal(ORDINE.lavoro[2], "congressi");
  assert.equal(ORDINE.piacere[6], "congressi");
});

test("UX 4.1: hero e ristorante separati da almeno tre scene, due scene fissate mai adiacenti", () => {
  const fisse = new Set(["hero", "grill", "congressi"]);
  for (const m of ["piacere", "lavoro"] as const) {
    const o = ORDINE[m];
    assert.ok(o.indexOf("grill") - o.indexOf("hero") >= 4, `${m}: troppo vicine`);
    for (let i = 1; i < o.length; i++) assert.ok(!(fisse.has(o[i - 1]) && fisse.has(o[i])), `${m}: ${o[i - 1]} e ${o[i]} adiacenti`);
  }
});

test("la prima scena cambiata è quella da cui scorrere", () => {
  assert.equal(primaScenaCambiata("piacere", "lavoro"), "congressi");
  assert.equal(primaScenaCambiata("lavoro", "piacere"), "camere");
  assert.equal(primaScenaCambiata("piacere", "piacere"), null);
});

test("ogni scena ha un id HTML e lo store avvisa chi ascolta una volta sola per cambio", () => {
  for (const id of ORDINE.piacere) assert.ok(ID_SEZIONE[id]);
  let n = 0;
  const off = sottoscriviModo(() => n++);
  impostaModo("lavoro");
  impostaModo("lavoro"); // stesso valore: nessun avviso
  assert.equal(leggiModo(), "lavoro");
  assert.equal(n, 1);
  impostaModo("piacere");
  assert.equal(n, 2);
  off();
  impostaModo("lavoro");
  assert.equal(n, 2);
  impostaModo("piacere");
});
