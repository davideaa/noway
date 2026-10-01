#!/usr/bin/env node
/**
 * Confronta le 25 righe di src/content/congress-halls.ts con la tabella di COPY.md sez. 15.
 * Esce con codice 1 se un solo numero (o nome, id, piano) differisce.
 * Controlla anche le lunghezze dei meta title (<= 60) e description (<= 155) in copy.ts.
 *
 * Uso: node scripts/check-content.mjs     (serve Node >= 22.18: legge i .ts senza compilarli)
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const radice = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errori = [];
const err = (m) => errori.push(m);

/* ---------------- 1. Tabella di COPY.md sez. 15 ---------------- */
const copyMd = readFileSync(resolve(radice, "COPY.md"), "utf8");
const inizio = copyMd.indexOf("## 15. Dati per il configuratore");
if (inizio < 0) {
  console.error("COPY.md: sezione 15 non trovata.");
  process.exit(1);
}
const dopo = copyMd.indexOf("\n## ", inizio + 5);
const sezione = copyMd.slice(inizio, dopo < 0 ? undefined : dopo);

const num = (t) => Number(t.trim().replace(",", "."));
const capCell = (t) => (t.trim() === "-" ? null : Number(t.trim()));

const righeCopy = [];
for (const riga of sezione.split("\n")) {
  if (!riga.startsWith("|")) continue;
  const c = riga.slice(1, riga.lastIndexOf("|")).split("|").map((x) => x.trim());
  if (c.length !== 10 || c[0] === "id" || /^-+$/.test(c[0])) continue;
  const [w, d] = c[3].split("×").map(num);
  righeCopy.push({
    id: c[0],
    name: c[1],
    floor: Number(c[2]),
    dims: [w, d],
    areaM2: num(c[4]),
    heightM: num(c[5]),
    cap: { platea: capCell(c[6]), banchi: capCell(c[7]), ferro: capCell(c[8]), banchetto: capCell(c[9]) },
  });
}

// «Divisibili con pareti mobili: Costellazioni (fino a 8 sale), Divinità (fino a 5 sale).»
const divisibili = {};
const mDiv = sezione.match(/Divisibili con pareti mobili:([^\n]*)/);
if (mDiv) {
  const mapNome = { Costellazioni: "costellazioni", Divinità: "divinita" };
  for (const m of mDiv[1].matchAll(/([A-Za-zÀ-ÿ]+) \(fino a (\d+) sale\)/g)) {
    if (mapNome[m[1]]) divisibili[mapNome[m[1]]] = Number(m[2]);
  }
} else {
  err("COPY.md: riga «Divisibili con pareti mobili» non trovata.");
}

/* ---------------- 2. congress-halls.ts ---------------- */
let hallsMod;
try {
  hallsMod = await import(pathToFileURL(resolve(radice, "src/content/congress-halls.ts")).href);
} catch (e) {
  console.error("Impossibile leggere congress-halls.ts (serve Node >= 22.18):", e);
  process.exit(1);
}
const halls = hallsMod.congressHalls;

if (righeCopy.length !== 25) err(`COPY.md: attese 25 righe, trovate ${righeCopy.length}.`);
if (halls.length !== 25) err(`congress-halls.ts: attese 25 righe, trovate ${halls.length}.`);

const perId = new Map(halls.map((h) => [h.id, h]));
if (perId.size !== halls.length) err("congress-halls.ts: id duplicati.");

let confrontate = 0;
for (const r of righeCopy) {
  const h = perId.get(r.id);
  if (!h) {
    err(`${r.id}: presente in COPY.md, assente in congress-halls.ts.`);
    continue;
  }
  confrontate++;
  const dif = (campo, atteso, trovato) => {
    if (JSON.stringify(atteso) !== JSON.stringify(trovato)) {
      err(`${r.id}: ${campo} — COPY.md ${JSON.stringify(atteso)} contro congress-halls.ts ${JSON.stringify(trovato)}`);
    }
  };
  dif("name", r.name, h.name);
  dif("floor", r.floor, h.floor);
  dif("dims", r.dims, [...h.dims]);
  dif("areaM2", r.areaM2, h.areaM2);
  dif("heightM", r.heightM, h.heightM);
  for (const k of ["platea", "banchi", "ferro", "banchetto"]) dif(`cap.${k}`, r.cap[k], h.cap[k] ?? null);
  dif("divisibleInto", divisibili[r.id] ?? null, h.divisibleInto ?? null);
}
for (const h of halls) {
  if (!righeCopy.some((r) => r.id === h.id)) err(`${h.id}: presente in congress-halls.ts, assente in COPY.md.`);
}
// Stesso ordine della tabella
const ordC = righeCopy.map((r) => r.id).join(",");
const ordH = halls.map((h) => h.id).join(",");
if (ordC !== ordH) err("L'ordine delle righe differisce da COPY.md.");

/* ---------------- 3. Lunghezza dei meta (COPY 14.2/14.5) ---------------- */
let metaControllati = 0;
try {
  const { copy } = await import(pathToFileURL(resolve(radice, "src/content/copy.ts")).href);
  for (const [pagina, m] of Object.entries(copy.meta)) {
    metaControllati++;
    if (m.title.length > 60) err(`meta.${pagina}.title: ${m.title.length} caratteri (max 60).`);
    if (m.description.length > 155) err(`meta.${pagina}.description: ${m.description.length} caratteri (max 155).`);
  }
} catch (e) {
  err(`copy.ts non leggibile: ${e instanceof Error ? e.message : e}`);
}

/* ---------------- Esito ---------------- */
if (errori.length) {
  console.error(`FALLITO: ${errori.length} differenze.`);
  for (const e of errori) console.error(" - " + e);
  process.exit(1);
}
console.log(`OK: ${confrontate} righe di congress-halls.ts coincidono con COPY.md sez. 15 (id, nome, piano, dimensioni, m², altezza, 4 capienze, divisibilità).`);
console.log(`OK: ${metaControllati} meta title/description entro i limiti (60/155).`);
