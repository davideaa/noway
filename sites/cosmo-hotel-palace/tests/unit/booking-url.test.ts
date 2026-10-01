/*
 * Test di lib/booking/{url,dates,distribute}.
 *
 * Come si eseguono (dalla cartella del sito, Node >= 22.18; con 22.6-22.17 serve in più
 * `--experimental-strip-types`):
 *
 *   node --test --import ./tests/unit/_register.mjs tests/unit/booking-url.test.ts tests/unit/booking-validate.test.ts
 *
 * Node toglie i tipi da solo. `_register.mjs` + `_resolve.mjs` insegnano a Node l'alias `@/`
 * e gli import senza estensione, così si testa il codice vero di src/, senza compilare.
 * Nessuna dipendenza nuova.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { BookingState } from "@/content/types";
import { ENGINE_BASE, ENGINE_PARAMS_VERIFIED } from "@/lib/booking/config";
import {
  addDays,
  compareIso,
  engineParts,
  ensureDeparture,
  formatLong,
  isValidIso,
  nights,
  parseIso,
} from "@/lib/booking/dates";
import { distribuisci, splitEven } from "@/lib/booking/distribute";
import { buildEngineUrl } from "@/lib/booking/url";

const stato = (p: Partial<BookingState> = {}): BookingState => ({
  arrivo: "2026-11-15",
  partenza: "2026-11-17",
  camere: 1,
  adulti: 2,
  bambini: 0,
  ...p,
});

/* ------------------------------ url ------------------------------ */

test("config: l'interruttore parte spento e la base è quella del BRIEF", () => {
  assert.equal(ENGINE_PARAMS_VERIFIED, false);
  assert.equal(
    ENGINE_BASE,
    "https://reservations.verticalbooking.com/premium/index2.html?id_albergo=146&dc=785&lingua_int=ita&id_stile=19500",
  );
});

test("UX 6.5, esempio 1: 15-17 novembre 2026, 1 camera, 2 adulti, 0 bambini", () => {
  assert.equal(
    buildEngineUrl(stato(), true),
    `${ENGINE_BASE}&gg=15&mm=11&aa=2026&ggf=17&mmf=11&aaf=2026&tot_camere=1&tot_adulti=2&tot_bambini=0&adulti1=2&bambini1=0&notti_1=2`,
  );
});

test("UX 6.5, esempio 2: stesse date, 2 camere, 3 adulti, 1 bambino", () => {
  assert.equal(
    buildEngineUrl(stato({ camere: 2, adulti: 3, bambini: 1 }), true),
    `${ENGINE_BASE}&gg=15&mm=11&aa=2026&ggf=17&mmf=11&aaf=2026&tot_camere=2&tot_adulti=3&tot_bambini=1&adulti1=2&bambini1=1&adulti2=1&bambini2=0&notti_1=2`,
  );
});

test("giorni e mesi a 2 cifre, anno a 4, e passaggio di mese e di anno", () => {
  const url = buildEngineUrl(stato({ arrivo: "2026-12-30", partenza: "2027-01-02" }), true);
  assert.match(url, /&gg=30&mm=12&aa=2026&ggf=02&mmf=01&aaf=2027&/);
  assert.match(url, /&notti_1=3$/);
});

test("3 camere e 4 adulti: 2, 1, 1 (mai una camera senza adulti)", () => {
  const url = buildEngineUrl(stato({ camere: 3, adulti: 4 }), true);
  assert.match(url, /&adulti1=2&bambini1=0&adulti2=1&bambini2=0&adulti3=1&bambini3=0&notti_1=2$/);
});

test("lingua_int non si ripete e il tipo di camera non entra nel link", () => {
  const url = buildEngineUrl(stato({ camera: "family" }), true);
  assert.equal(url.match(/lingua_int/g)?.length, 1);
  assert.doesNotMatch(url, /camera=|family/);
});

test("FALLBACK: con l'interruttore spento (default) il link è la sola base", () => {
  assert.equal(buildEngineUrl(stato()), ENGINE_BASE);
  assert.equal(buildEngineUrl(stato(), false), ENGINE_BASE);
});

test("FALLBACK: date mancanti, non valide o partenza non dopo l'arrivo -> base, anche se verificato", () => {
  assert.equal(buildEngineUrl(stato({ arrivo: "" }), true), ENGINE_BASE);
  assert.equal(buildEngineUrl(stato({ partenza: "" }), true), ENGINE_BASE);
  assert.equal(buildEngineUrl(stato({ arrivo: "2026-02-30" }), true), ENGINE_BASE);
  assert.equal(buildEngineUrl(stato({ partenza: "2026-11-15" }), true), ENGINE_BASE);
  assert.equal(buildEngineUrl(stato({ partenza: "2026-11-10" }), true), ENGINE_BASE);
});

/* ------------------------------ dates ------------------------------ */

test("parseIso: legge solo date vere", () => {
  assert.deepEqual(parseIso("2026-11-15"), { y: 2026, m: 11, d: 15 });
  assert.equal(parseIso("2028-02-29")?.d, 29); // bisestile
  for (const male of ["", "2026-2-3", "15/11/2026", "2026-02-30", "2027-02-29", "2026-13-01", "2026-00-10", "2026-04-31", "abc"]) {
    assert.equal(parseIso(male), null, male);
    assert.equal(isValidIso(male), false, male);
  }
});

test("nights: notti intere, anche attraverso l'ora legale e l'anno bisestile", () => {
  assert.equal(nights("2026-11-15", "2026-11-17"), 2);
  assert.equal(nights("2026-03-28", "2026-03-30"), 2); // cambio all'ora legale (29 marzo 2026)
  assert.equal(nights("2026-10-24", "2026-10-26"), 2); // ritorno all'ora solare (25 ottobre 2026)
  assert.equal(nights("2028-02-28", "2028-03-01"), 2); // 29 febbraio esiste
  assert.equal(nights("2027-02-28", "2027-03-01"), 1);
  assert.equal(nights("2026-12-31", "2027-01-01"), 1);
  assert.equal(nights("2026-11-17", "2026-11-15"), -2);
  assert.equal(nights("2026-11-15", "2026-11-15"), 0);
  assert.equal(nights("", "2026-11-15"), null);
});

test("addDays e compareIso", () => {
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("boh", 1), null);
  assert.ok((compareIso("2026-11-15", "2026-11-16") as number) < 0);
  assert.equal(compareIso("2026-11-15", "2026-11-15"), 0);
  assert.equal(compareIso("", "2026-11-15"), null);
});

test("ensureDeparture: arrivo + 1 se la partenza è vuota o non dopo l'arrivo (UX 6.1)", () => {
  assert.deepEqual(ensureDeparture("2026-11-15", ""), { partenza: "2026-11-16", moved: true });
  assert.deepEqual(ensureDeparture("2026-11-15", "2026-11-15"), { partenza: "2026-11-16", moved: true });
  assert.deepEqual(ensureDeparture("2026-11-15", "2026-11-10"), { partenza: "2026-11-16", moved: true });
  assert.deepEqual(ensureDeparture("2026-11-15", "2026-11-20"), { partenza: "2026-11-20", moved: false });
  assert.deepEqual(ensureDeparture("2026-11-30", ""), { partenza: "2026-12-01", moved: true });
  // arrivo non valido: non si tocca nulla
  assert.deepEqual(ensureDeparture("", "2026-11-20"), { partenza: "2026-11-20", moved: false });
});

test("formati: motore e testo", () => {
  assert.deepEqual(engineParts("2026-01-05"), { gg: "05", mm: "01", aa: "2026" });
  assert.equal(engineParts("2026-02-30"), null);
  assert.equal(formatLong("2026-11-15"), "15 novembre 2026");
  assert.equal(formatLong("2026-03-01"), "1 marzo 2026");
  assert.equal(formatLong("boh"), "");
});

/* ------------------------------ distribute ------------------------------ */

test("splitEven: bilanciato, il resto alle prime", () => {
  assert.deepEqual(splitEven(4, 3), [2, 1, 1]);
  assert.deepEqual(splitEven(3, 2), [2, 1]);
  assert.deepEqual(splitEven(2, 1), [2]);
  assert.deepEqual(splitEven(0, 3), [0, 0, 0]);
  assert.deepEqual(splitEven(8, 4), [2, 2, 2, 2]);
  assert.deepEqual(splitEven(1, 4), [1, 0, 0, 0]);
});

test("distribuisci: la somma è sempre il totale", () => {
  for (let c = 1; c <= 4; c++)
    for (let a = 1; a <= 4; a++)
      for (let b = 0; b <= 4; b++) {
        const d = distribuisci(c, a, b);
        assert.equal(d.length, c);
        assert.equal(d.reduce((s, x) => s + x.adulti, 0), a);
        assert.equal(d.reduce((s, x) => s + x.bambini, 0), b);
        // nessuna camera ha più di 1 ospite in più di un'altra (stessa categoria)
        const ad = d.map((x) => x.adulti);
        assert.ok(Math.max(...ad) - Math.min(...ad) <= 1);
        // con camere <= adulti ogni camera ha almeno un adulto
        if (c <= a) assert.ok(Math.min(...ad) >= 1);
      }
  assert.deepEqual(distribuisci(2, 3, 1), [
    { adulti: 2, bambini: 1 },
    { adulti: 1, bambini: 0 },
  ]);
});
