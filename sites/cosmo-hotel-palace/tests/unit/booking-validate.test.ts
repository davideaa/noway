/*
 * Test di lib/booking/validate. Come si eseguono: vedi l'intestazione di booking-url.test.ts.
 *   node --test --import ./tests/unit/_register.mjs tests/unit/booking-url.test.ts tests/unit/booking-validate.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { copy } from "@/content/copy";
import type { BookingState } from "@/content/types";
import { capienzaAvviso, firstInvalid, isValid, riepilogoErrori, validateBooking } from "@/lib/booking/validate";

const OGGI = "2026-10-01";
const e = copy.prenota.errori;

const stato = (p: Partial<BookingState> = {}): BookingState => ({
  arrivo: "2026-11-15",
  partenza: "2026-11-17",
  camere: 1,
  adulti: 2,
  bambini: 0,
  ...p,
});

test("uno stato giusto non ha errori", () => {
  assert.deepEqual(validateBooking(stato(), OGGI), {});
  assert.equal(isValid(validateBooking(stato(), OGGI)), true);
});

test("arrivo vuoto o illeggibile: «Scegli la data di arrivo…»", () => {
  assert.equal(validateBooking(stato({ arrivo: "" }), OGGI).arrivo, e.arrivoMancante);
  assert.equal(validateBooking(stato({ arrivo: "2026-02-30" }), OGGI).arrivo, e.arrivoMancante);
});

test("partenza vuota: «Scegli anche la data di partenza.»", () => {
  assert.equal(validateBooking(stato({ partenza: "" }), OGGI).partenza, e.partenzaMancante);
});

test("partenza uguale o prima dell'arrivo: «La partenza deve essere dopo l'arrivo…»", () => {
  assert.equal(validateBooking(stato({ partenza: "2026-11-15" }), OGGI).partenza, e.partenzaNonDopo);
  assert.equal(validateBooking(stato({ partenza: "2026-11-01" }), OGGI).partenza, e.partenzaNonDopo);
});

test("senza arrivo, la partenza piena non dà un errore in più", () => {
  const r = validateBooking(stato({ arrivo: "" }), OGGI);
  assert.deepEqual(Object.keys(r), ["arrivo"]);
});

test("arrivo nel passato: «Questa data è già passata…»; oggi stesso va bene", () => {
  assert.equal(validateBooking(stato({ arrivo: "2026-09-30", partenza: "2026-10-02" }), OGGI).arrivo, e.arrivoPassato);
  assert.deepEqual(validateBooking(stato({ arrivo: OGGI, partenza: "2026-10-02" }), OGGI), {});
});

test("senza «oggi» (server) non si controlla il passato", () => {
  assert.deepEqual(validateBooking(stato({ arrivo: "2020-01-01", partenza: "2020-01-03" }), ""), {});
});

test("zero adulti: «Serve almeno un adulto.» (stato ripristinato da sessione)", () => {
  const r = validateBooking(stato({ adulti: 0 as unknown as BookingState["adulti"] }), OGGI);
  assert.equal(r.adulti, e.nessunAdulto);
  assert.equal(r.camere, undefined);
});

test("più camere che adulti: blocca con il testo della camera senza adulto", () => {
  const r = validateBooking(stato({ camere: 3, adulti: 2 }), OGGI);
  assert.equal(r.camere, e.cameraSenzaAdulto);
  assert.equal(validateBooking(stato({ camere: 2, adulti: 2 }), OGGI).camere, undefined);
});

test("più errori insieme, e il primo nell'ordine visivo", () => {
  const r = validateBooking(stato({ arrivo: "", partenza: "", camere: 4, adulti: 1 }), OGGI);
  assert.deepEqual(Object.keys(r).sort(), ["arrivo", "camere", "partenza"]);
  assert.equal(firstInvalid(r), "arrivo");
  assert.equal(firstInvalid({}), null);
  assert.equal(firstInvalid({ camere: "x", adulti: "y" }), "camere");
});

test("capienza: avviso che non blocca quando gli ospiti superano 4 per camera", () => {
  assert.equal(capienzaAvviso(stato({ camere: 1, adulti: 4, bambini: 1 })), e.capienzaAvviso);
  assert.equal(capienzaAvviso(stato({ camere: 1, adulti: 2, bambini: 2 })), null);
  assert.equal(capienzaAvviso(stato({ camere: 2, adulti: 4, bambini: 4 })), null);
  // l'avviso non è un errore
  assert.deepEqual(validateBooking(stato({ camere: 1, adulti: 4, bambini: 4 }), OGGI), {});
});

test("riepilogo errori: singolare e plurale", () => {
  assert.equal(riepilogoErrori(1), "C'è 1 campo da controllare.");
  assert.equal(riepilogoErrori(2), "Ci sono 2 campi da controllare.");
  assert.equal(riepilogoErrori(3), "Ci sono 3 campi da controllare.");
});
