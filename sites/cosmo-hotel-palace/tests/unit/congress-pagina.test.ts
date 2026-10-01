/**
 * Test delle funzioni pure della pagina Centro Congressi (modulo 13):
 * controlli del modulo e frasi di «Trova la sala».
 *
 *   cd sites/cosmo-hotel-palace
 *   node --import ./tests/unit/ts-resolve.mjs --test tests/unit/congress-pagina.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { validaCampo, validaModulo, type CampiModulo } from "../../src/components/congress/validazione";
import { leggiOspiti, numIt, risultatoTrova, misureSala } from "../../src/components/congress/testi";
import { saleAdatte, trovaSala } from "../../src/lib/congress/availability";
import { congressHalls } from "../../src/content/congress-halls";

const OGGI = "2026-10-01";
const buono: CampiModulo = {
  nome: "Mario Rossi",
  email: "mario@azienda.it",
  telefono: "+39 02 1234567",
  ospiti: "120",
  data: "marzo 2027",
  consenso: true,
};

test("un modulo a posto non ha errori", () => {
  assert.deepEqual(validaModulo(buono, OGGI), {});
});

test("nome, email e consenso sono obbligatori", () => {
  const e = validaModulo({ ...buono, nome: "  ", email: "", consenso: false }, OGGI);
  assert.deepEqual(Object.keys(e).sort(), ["consenso", "email", "nome"]);
});

test("email incompleta: errore con il rimedio", () => {
  assert.match(validaCampo("email", { ...buono, email: "mario@" }, OGGI) ?? "", /nome@azienda\.it/);
  assert.equal(validaCampo("email", { ...buono, email: "a@b.it" }, OGGI), undefined);
});

test("telefono: solo numeri, spazi e il + davanti", () => {
  assert.ok(validaCampo("telefono", { ...buono, telefono: "abc" }, OGGI));
  assert.ok(validaCampo("telefono", { ...buono, telefono: "12+34 56" }, OGGI));
  assert.equal(validaCampo("telefono", { ...buono, telefono: "" }, OGGI), undefined);
  assert.equal(validaCampo("telefono", { ...buono, telefono: "02 6177726" }, OGGI), undefined);
});

test("partecipanti: solo cifre; vuoto va bene", () => {
  assert.ok(validaCampo("ospiti", { ...buono, ospiti: "12x" }, OGGI));
  assert.ok(validaCampo("ospiti", { ...buono, ospiti: "0" }, OGGI));
  assert.equal(validaCampo("ospiti", { ...buono, ospiti: "" }, OGGI), undefined);
});

test("data: il passato si controlla solo se è completa (gg/mm/aaaa)", () => {
  assert.ok(validaCampo("data", { ...buono, data: "01/01/2020" }, OGGI));
  assert.ok(validaCampo("data", { ...buono, data: "30/9/2026" }, OGGI));
  assert.equal(validaCampo("data", { ...buono, data: "01/10/2026" }, OGGI), undefined);
  assert.equal(validaCampo("data", { ...buono, data: "12/03/2027" }, OGGI), undefined);
  assert.equal(validaCampo("data", { ...buono, data: "marzo 2020" }, OGGI), undefined);
  assert.equal(validaCampo("data", { ...buono, data: "31/02/2020" }, OGGI), undefined); // data inesistente: non è «passata»
});

test("leggiOspiti: cifre sensate o null", () => {
  assert.equal(leggiOspiti("120"), 120);
  assert.equal(leggiOspiti(" 7 "), 7);
  assert.equal(leggiOspiti("0"), null);
  assert.equal(leggiOspiti("12x"), null);
  assert.equal(leggiOspiti(""), null);
  assert.equal(leggiOspiti("123456"), null);
});

test("formato italiano delle misure", () => {
  assert.equal(numIt(18.5), "18,5");
  const sole = trovaSala("sole-plenaria");
  assert.ok(sole);
  assert.equal(misureSala(sole), "18,5 × 17,5");
});

test("Trova la sala: nessun conteggio del totale delle sale", () => {
  // 1 persona a platea: tutte le 25 sale vanno bene. La frase non deve dire «24 sale» (= 25 - 1).
  const sale = saleAdatte(1, "platea");
  assert.equal(sale.length, congressHalls.length);
  const frase = risultatoTrova(1, "platea", sale[0], sale.slice(1));
  assert.match(frase, /^1 persona a platea/);
  assert.doesNotMatch(frase, /\b(13|24|25)\b/);
  assert.match(frase, /Vanno bene anche .+ e altre\.$/);
});

test("Trova la sala: nessuna altra sala, una sola, poche", () => {
  const una = saleAdatte(430, "banchetto"); // solo Costellazioni (450)
  assert.equal(una.length, 1);
  assert.doesNotMatch(risultatoTrova(430, "banchetto", una[0], []), /Vanno bene/);
  const due = saleAdatte(300, "banchetto"); // Costellazioni, Divinità, Plenaria del Sole (300)
  const f = risultatoTrova(300, "banchetto", due[0], due.slice(1));
  assert.match(f, /Vanno bene anche Plenaria delle Divinità e Plenaria delle Costellazioni\.$/);
});
