/**
 * Test del `mailto:` precompilato e del testo da copiare (src/lib/congress/mailto.ts).
 *
 *   cd sites/cosmo-hotel-palace
 *   node --import ./tests/unit/ts-resolve.mjs --test tests/unit/congress-mailto.test.ts
 *   # tutti i test dei congressi:
 *   node --import ./tests/unit/ts-resolve.mjs --test tests/unit/congress-*.test.ts
 *
 * (Node >= 22.18, TypeScript letto direttamente; `ts-resolve.mjs` risolve gli import senza estensione.)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { HAS_BACKEND, MAX_MESSAGGIO_MAILTO, MAX_URL_MAILTO } from "../../src/lib/congress/config";
import {
  EMAIL_EVENTI,
  mailto,
  mailtoUrl,
  oggettoEmail,
  tagliaMessaggio,
  testoRichiesta,
  type RichiestaProposta,
} from "../../src/lib/congress/mailto";

const base: RichiestaProposta = {
  sala: "Plenaria del Sole",
  disposizione: "banchetto",
  ospiti: 120,
  data: "marzo 2027",
  nome: "Mario Rossi",
  azienda: "Rossi & Figli S.r.l.",
  email: "mario@rossi.it",
  telefono: "+39 02 1234567",
  tipoEvento: "Banchetto aziendale",
  camere: 10,
  messaggio: "Serve il coffee break alle 10:30.\nGrazie!",
};

/** Corpo dell'URL decodificato, con i CRLF riportati a `\n`. */
function corpoDecodificato(url: string): string {
  const q = url.slice(url.indexOf("?") + 1);
  const body = q.split("&").find((p) => p.startsWith("body="))!.slice(5);
  return decodeURIComponent(body).replace(/\r\n/g, "\n");
}

test("HAS_BACKEND è false: il sito non invia nulla da solo", () => {
  assert.equal(HAS_BACKEND, false);
});

test("oggetto: «Richiesta di proposta · {sala} · {disposizione}»", () => {
  assert.equal(oggettoEmail(base), "Richiesta di proposta · Plenaria del Sole · Banchetto");
});

test("mailto: indirizzo dell'Ufficio Eventi, oggetto e corpo codificati, a capo CRLF", () => {
  const { url, messaggioTagliato } = mailto(base);
  assert.ok(url.startsWith(`mailto:${EMAIL_EVENTI}?subject=`));
  assert.equal(EMAIL_EVENTI, "events@cosmohotelpalace.it");
  assert.equal(messaggioTagliato, false);
  assert.ok(url.includes("%0D%0A"), "a capo CRLF");
  assert.ok(!url.includes("\n") && !url.includes(" "), "URL senza spazi né a capo letterali");
  assert.ok(url.includes(encodeURIComponent("Richiesta di proposta · Plenaria del Sole · Banchetto")));
  assert.equal(mailtoUrl(base), url);
});

test("il corpo contiene sala, disposizione, ospiti, data, nome e contatti, su righe separate", () => {
  const corpo = corpoDecodificato(mailtoUrl(base));
  const righe = corpo.split("\n");
  for (const atteso of [
    "Sala: Plenaria del Sole",
    "Disposizione: Banchetto",
    "Numero di partecipanti: 120",
    "Data o periodo: marzo 2027",
    "Tipo di evento: Banchetto aziendale",
    "Camere per gli ospiti: 10",
    "Nome e cognome: Mario Rossi",
    "Azienda o organizzazione: Rossi & Figli S.r.l.",
    "Email: mario@rossi.it",
    "Telefono: +39 02 1234567",
  ]) {
    assert.ok(righe.includes(atteso), `manca la riga «${atteso}»`);
  }
  assert.ok(corpo.includes("Serve il coffee break alle 10:30.\nGrazie!"));
  // l'etichetta non porta «(facoltativo)»
  assert.ok(!corpo.includes("facoltativo"));
  // caratteri speciali sopravvivono alla codifica (& non rompe i parametri)
  assert.ok(corpo.includes("Rossi & Figli"));
});

test("i campi vuoti non compaiono", () => {
  const minimo: RichiestaProposta = { sala: "Pepita", disposizione: "platea", nome: "Anna", email: "anna@x.it" };
  const corpo = corpoDecodificato(mailtoUrl(minimo));
  assert.ok(corpo.includes("Sala: Pepita"));
  assert.ok(corpo.includes("Email: anna@x.it"));
  for (const assente of ["Numero di partecipanti", "Data o periodo", "Telefono", "Azienda", "Camere", "Tipo di evento", "Altro da sapere"]) {
    assert.ok(!corpo.includes(assente), `«${assente}» non dovrebbe esserci`);
  }
});

test("il messaggio libero si taglia a 1000 caratteri nel mailto, non nel testo da copiare", () => {
  const lungo = "parola ".repeat(400); // 2800 caratteri
  const r: RichiestaProposta = { ...base, messaggio: lungo };
  const m = mailto(r);
  assert.equal(m.messaggioTagliato, true);
  const corpo = corpoDecodificato(m.url);
  const messaggio = corpo.split("Altro da sapere:\n")[1].split("\n\nGrazie.")[0];
  assert.ok(messaggio.length <= MAX_MESSAGGIO_MAILTO, `messaggio di ${messaggio.length} caratteri`);
  assert.ok(messaggio.endsWith("…"));
  assert.ok(m.url.length <= MAX_URL_MAILTO, `URL di ${m.url.length} caratteri`);
  // il testo da copiare resta intero
  assert.ok(testoRichiesta(r).includes(lungo.trim()));
});

test("l'URL resta sotto il limite anche con un messaggio di sole lettere accentate/emoji (codifica lunga)", () => {
  const r: RichiestaProposta = { ...base, messaggio: "à è ì ò ù €😀 ".repeat(120) };
  const m = mailto(r);
  assert.ok(m.url.length <= MAX_URL_MAILTO, `URL di ${m.url.length} caratteri`);
  assert.equal(m.messaggioTagliato, true);
  // gli altri campi non si toccano mai
  const corpo = corpoDecodificato(m.url);
  assert.ok(corpo.includes("Email: mario@rossi.it"));
  assert.ok(corpo.includes("Plenaria del Sole"));
});

test("taglia senza spezzare le coppie surrogate", () => {
  const t = tagliaMessaggio("😀".repeat(50), 11);
  assert.equal(Array.from(t).length, 11);
  assert.ok(t.endsWith("…"));
  assert.equal(tagliaMessaggio("breve", 100), "breve");
});

test("testo da copiare: oggetto in cima, riga vuota, poi il corpo (a capo semplici)", () => {
  const t = testoRichiesta(base);
  const righe = t.split("\n");
  assert.equal(righe[0], "Richiesta di proposta · Plenaria del Sole · Banchetto");
  assert.equal(righe[1], "");
  assert.equal(righe[2], "Buongiorno,");
  assert.ok(righe.includes("Grazie."));
  assert.equal(righe[righe.length - 1], "Mario Rossi");
  assert.ok(!t.includes("\r"));
  // stesso contenuto del mailto (messaggio breve): il corpo coincide
  assert.equal(t.split("\n").slice(2).join("\n"), corpoDecodificato(mailtoUrl(base)));
});

test("spazi e a capo nei campi a riga singola vengono ripuliti", () => {
  const r: RichiestaProposta = { ...base, nome: "  Mario \n Rossi ", data: " 12/03/2027   o   marzo 2027 " };
  const corpo = corpoDecodificato(mailtoUrl(r));
  assert.ok(corpo.includes("Nome e cognome: Mario Rossi"));
  assert.ok(corpo.includes("Data o periodo: 12/03/2027 o marzo 2027"));
});
