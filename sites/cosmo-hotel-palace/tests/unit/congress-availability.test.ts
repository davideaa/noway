/**
 * Test della disponibilità delle disposizioni per sala (src/lib/congress/availability.ts).
 *
 * COME SI ESEGUONO (Node >= 22.18, TypeScript letto direttamente, nessuna compilazione):
 *
 *   cd sites/cosmo-hotel-palace
 *   node --import ./tests/unit/ts-resolve.mjs --test tests/unit/congress-availability.test.ts
 *   # tutti i test dei congressi:
 *   node --import ./tests/unit/ts-resolve.mjs --test tests/unit/congress-*.test.ts
 *
 * `ts-resolve.mjs` (accanto a questo file) serve solo a risolvere gli import senza estensione e
 * l'alias `@/`; senza, Node si ferma su `import ... from "../../content/copy"`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { congressHalls } from "../../src/content/congress-halls";
import {
  capienza,
  capienzaMassima,
  disponibilita,
  disposizioneEffettiva,
  disposizioniDisponibili,
  eDisponibile,
  eDisposizione,
  elencoEtichette,
  oltreCapienza,
  saleAdatte,
  saleOrdinate,
  trovaSala,
  tutteLeDisponibilita,
} from "../../src/lib/congress/availability";

const sala = (id: string) => {
  const h = trovaSala(id);
  assert.ok(h, `sala ${id} non trovata`);
  return h;
};

test("la tabella ha 25 righe: 16 al piano terra, 9 al piano inferiore", () => {
  assert.equal(congressHalls.length, 25);
  assert.equal(congressHalls.filter((h) => h.floor === 0).length, 16);
  assert.equal(congressHalls.filter((h) => h.floor === -1).length, 9);
});

test("platea e banchetto ci sono in tutte le 25 righe", () => {
  for (const h of congressHalls) {
    assert.ok(eDisponibile(h, "platea"), `${h.id}: platea`);
    assert.ok(eDisponibile(h, "banchetto"), `${h.id}: banchetto`);
  }
});

test("Costellazioni e Divinità: solo platea e banchetto (niente banchi né ferro)", () => {
  for (const id of ["costellazioni", "divinita"]) {
    assert.deepEqual(disposizioniDisponibili(sala(id)), ["platea", "banchetto"], id);
  }
  // tutte le altre sale hanno le quattro
  for (const h of congressHalls) {
    if (h.id === "costellazioni" || h.id === "divinita") continue;
    assert.equal(disposizioniDisponibili(h).length, 4, h.id);
  }
});

test("la capienza si legge dalla tabella, senza correzioni (anche dove è incoerente)", () => {
  assert.equal(capienza(sala("costellazioni"), "platea"), 500);
  assert.equal(capienza(sala("costellazioni"), "banchi"), null);
  assert.equal(capienza(sala("sole-plenaria"), "banchetto"), 300);
  // DA CONFERMARE: Lingotto ha platea 29 < banchetto 30; non si corregge
  assert.equal(capienza(sala("lingotto"), "platea"), 29);
  assert.equal(capienza(sala("lingotto"), "banchetto"), 30);
  assert.equal(capienzaMassima(sala("lingotto")), 30);
  // DA CONFERMARE: Divinità 440 / 400 dalla tabella
  assert.equal(capienza(sala("divinita"), "platea"), 440);
  assert.equal(capienza(sala("divinita"), "banchetto"), 400);
});

test("disponibilità: motivo testuale solo dove la disposizione manca", () => {
  const c = sala("costellazioni");
  const ok = disponibilita(c, "platea");
  assert.deepEqual(ok, { disposizione: "platea", disponibile: true, capienza: 500, motivo: null });

  const no = disponibilita(c, "banchi");
  assert.equal(no.disponibile, false);
  assert.equal(no.capienza, null);
  assert.equal(
    no.motivo,
    "Questa disposizione non è indicata per Plenaria delle Costellazioni. Prova con Platea e Banchetto.",
  );

  const tutte = tutteLeDisponibilita(sala("sole-plenaria"));
  assert.deepEqual(
    tutte.map((d) => d.disposizione),
    ["platea", "banchi", "ferro", "banchetto"],
  );
  assert.ok(tutte.every((d) => d.disponibile && d.motivo === null));
});

test("elenco di etichette in italiano", () => {
  assert.equal(elencoEtichette(["platea"]), "Platea");
  assert.equal(elencoEtichette(["platea", "banchetto"]), "Platea e Banchetto");
  assert.equal(elencoEtichette(["platea", "banchi", "banchetto"]), "Platea, Banchi di scuola e Banchetto");
});

test("cambiando sala una disposizione assente ripiega su Platea e lo dice", () => {
  const r = disposizioneEffettiva(sala("divinita"), "ferro");
  assert.equal(r.disposizione, "platea");
  assert.equal(r.ripiego, true);
  assert.equal(r.avviso, "Plenaria delle Divinità non ha Ferro di cavallo: ti mostro Platea.");

  const ok = disposizioneEffettiva(sala("sole-plenaria"), "ferro");
  assert.deepEqual(ok, { disposizione: "ferro", ripiego: false, avviso: null });
});

test("avviso oltre la capienza (non bloccante)", () => {
  const s = sala("sole-plenaria");
  assert.equal(oltreCapienza(s, "banchi", 188), false);
  assert.equal(oltreCapienza(s, "banchi", 189), true);
  assert.equal(oltreCapienza(sala("costellazioni"), "banchi", 10), false); // non indicata: nessun avviso numerico
  assert.equal(oltreCapienza(s, "platea", null), false);
  assert.equal(oltreCapienza(s, "platea", Number.NaN), false);
});

test("eDisposizione valida i valori del link profondo", () => {
  assert.ok(eDisposizione("platea"));
  assert.ok(eDisposizione("ferro"));
  assert.equal(eDisposizione("teatro"), false);
  assert.equal(eDisposizione(null), false);
  assert.equal(trovaSala("non-esiste"), undefined);
  assert.equal(trovaSala(null), undefined);
});

test("ordine iniziale: capienza decrescente; a parità resta l'ordine della tabella", () => {
  const e = saleOrdinate();
  assert.equal(e.length, 25);
  assert.equal(e[0].id, "costellazioni");
  assert.equal(e[1].id, "divinita");
  for (let i = 1; i < e.length; i++) assert.ok(capienzaMassima(e[i - 1]) >= capienzaMassima(e[i]));
  // Oro Plenaria e Argento Plenaria hanno le stesse capienze: Oro viene prima come nella tabella
  const iOro = e.findIndex((h) => h.id === "oro-plenaria");
  const iArg = e.findIndex((h) => h.id === "argento-plenaria");
  assert.ok(iOro < iArg);
});

test("filtri per piano e ordine per superficie", () => {
  assert.equal(saleOrdinate({ piano: 0 }).length, 16);
  assert.equal(saleOrdinate({ piano: -1 }).length, 9);
  const s = saleOrdinate({ ordine: "superficie" });
  for (let i = 1; i < s.length; i++) assert.ok(s[i - 1].areaM2 >= s[i].areaM2);
  assert.equal(s[0].id, "costellazioni");
  assert.equal(s[1].id, "divinita");
});

test("«Trova la sala»: la più piccola adatta per prima", () => {
  assert.deepEqual(
    saleAdatte(300, "banchetto").map((h) => h.id),
    ["sole-plenaria", "divinita", "costellazioni"],
  );
  assert.deepEqual(saleAdatte(450, "platea").map((h) => h.id), ["costellazioni"]);
  assert.deepEqual(saleAdatte(501, "platea"), []);
  assert.deepEqual(saleAdatte(0, "platea"), []);
  // le sale senza la disposizione non compaiono
  assert.ok(saleAdatte(50, "banchi").every((h) => h.cap.banchi !== null));
});
