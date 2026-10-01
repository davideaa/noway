/**
 * Test del generatore delle disposizioni e della morfologia (src/lib/congress/layout.ts).
 *
 * COME SI ESEGUONO (Node >= 22.18, TypeScript letto direttamente, nessuna compilazione):
 *
 *   cd sites/cosmo-hotel-palace
 *   node --import ./tests/unit/ts-resolve.mjs --test tests/unit/congress-layout.test.ts
 *   # tutti i test dei congressi (availability, layout, mailto):
 *   node --import ./tests/unit/ts-resolve.mjs --test tests/unit/congress-*.test.ts
 *
 * `ts-resolve.mjs` (accanto a questo file) risolve gli import senza estensione e l'alias `@/`.
 * Il test principale è il primo: tutte le 25 sale × tutte le disposizioni dichiarate (UX 7.2 e
 * MOTION 5.2): nessuna sedia o tavolo fuori dalla sala, nessuna coppia di sedie a meno di 0,35 m,
 * nessuna sedia dentro un tavolo o sul palco, scala mai sotto 0,6.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { congressHalls, DISPOSIZIONI } from "../../src/content/congress-halls";
import type { CongressHall } from "../../src/content/types";
import {
  DURATE,
  ESPANSIONE_MAX,
  MAX_PANNELLI,
  MAX_SEDIE,
  MAX_TAVOLI,
  SALTO,
  SCALA_MIN,
  SFALSAMENTO,
  SPESSORE_MURO,
  STRIDE,
  accoppia,
  avanzamentoIstanza,
  controllaDisegno,
  distanzaVista,
  faseAt,
  layout,
  layoutSala,
  layoutVuoto,
  morfaMatrici,
  numeroSedie,
  pianoTempi,
  schemaPareti,
  scriviPannelli,
  telaio,
  type Disegno,
} from "../../src/lib/congress/layout";

const sala = (id: string): CongressHall => {
  const h: CongressHall | undefined = congressHalls.find((x) => x.id === id);
  assert.ok(h, id);
  return h;
};

const posizioni = (d: Disegno) =>
  Array.from({ length: d.n }, (_, i) => [d.sedie[STRIDE * i], d.sedie[STRIDE * i + 1]] as const);

/* ───────────── il test di UX 7.2: tutte le sale, tutte le disposizioni ───────────── */

test("25 sale × disposizioni dichiarate: tutto dentro la sala, sedie distanziate, scala >= 0,6", (t) => {
  let casi = 0;
  const ridotte: string[] = [];
  let scalaMinima = 1;
  for (const h of congressHalls) {
    for (const disp of DISPOSIZIONI) {
      const cap = h.cap[disp];
      if (cap === null) continue;
      casi++;
      const d = layoutSala(h, disp);
      assert.ok(d, `${h.id}/${disp}`);
      const etichetta = `${h.id}/${disp}`;
      assert.equal(d.n, cap, `${etichetta}: numero di sedie = capienza della tabella`);
      assert.equal(d.sedie.length, cap * STRIDE, etichetta);
      assert.ok(!d.sporge, `${etichetta}: nemmeno a scala ${SCALA_MIN} le sedie stanno nella sala`);
      assert.ok(d.scala >= SCALA_MIN - 1e-9 && d.scala <= 1, `${etichetta}: scala ${d.scala}`);
      assert.ok(d.n <= MAX_SEDIE, `${etichetta}: oltre ${MAX_SEDIE} sedie`);
      assert.ok(d.nTavoli <= MAX_TAVOLI, `${etichetta}: oltre ${MAX_TAVOLI} tavoli`);
      const c = controllaDisegno(d);
      assert.equal(c.fuori, 0, `${etichetta}: ${c.fuori} sedie fuori dalla sala`);
      assert.equal(c.tavoliFuori, 0, `${etichetta}: ${c.tavoliFuori} tavoli fuori dalla sala`);
      assert.equal(c.sedieSuTavoli, 0, `${etichetta}: ${c.sedieSuTavoli} sedie dentro un tavolo`);
      assert.equal(c.sedieSulPalco, 0, `${etichetta}: ${c.sedieSulPalco} sedie sul palco`);
      assert.ok(c.distanzaMinima >= 0.35, `${etichetta}: due sedie a ${c.distanzaMinima.toFixed(2)} m`);
      if (d.ridotta) ridotte.push(`${etichetta} ${d.scala.toFixed(2)}`);
      scalaMinima = Math.min(scalaMinima, d.scala);
    }
  }
  assert.equal(casi, 96); // 25 sale x 4 disposizioni - 2 sale (Costellazioni, Divinità) x 2 assenti
  t.diagnostic(`casi: ${casi}; scala minima: ${scalaMinima.toFixed(2)}; ridotte (scala < 1): ${ridotte.length}`);
});

test("il controllo accorge di una sedia fuori, di due troppo vicine e di una sul tavolo", () => {
  const h = sala("sole-plenaria");
  const d = layoutSala(h, "banchi")!;
  assert.equal(controllaDisegno(d).fuori, 0);
  const guasto: Disegno = { ...d, sedie: Float32Array.from(d.sedie) };
  guasto.sedie[0] = 100; // fuori
  guasto.sedie[STRIDE + 0] = guasto.sedie[2 * STRIDE + 0] + 0.1; // vicine
  guasto.sedie[STRIDE + 1] = guasto.sedie[2 * STRIDE + 1];
  guasto.sedie[3 * STRIDE] = guasto.tavoli[0]; // su un tavolo
  guasto.sedie[3 * STRIDE + 1] = guasto.tavoli[1];
  const c = controllaDisegno(guasto);
  assert.ok(c.fuori >= 1);
  assert.ok(c.distanzaMinima < 0.35);
  assert.ok(c.sedieSuTavoli >= 1);
});

/* ───────────── determinismo, telaio, numero di sedie ───────────── */

test("deterministico: stessa scelta, stesso disegno (bit per bit)", () => {
  for (const [id, disp] of [
    ["costellazioni", "platea"],
    ["sole-plenaria", "ferro"],
    ["divinita", "banchetto"],
    ["oro", "banchi"],
  ] as const) {
    const a = layoutSala(sala(id), disp)!;
    const b = layoutSala(sala(id), disp)!;
    assert.deepEqual(Array.from(a.sedie), Array.from(b.sedie));
    assert.deepEqual(Array.from(a.tavoli), Array.from(b.tavoli));
    assert.equal(a.scala, b.scala);
  }
});

test("telaio: il palco sta sul lato corto, la sala si ruota se larghezza > profondità", () => {
  assert.deepEqual(telaio([25, 20]), { larghezza: 20, profondita: 25, ruotata: true });
  assert.deepEqual(telaio([7.1, 18.5]), { larghezza: 7.1, profondita: 18.5, ruotata: false });
  assert.deepEqual(telaio([7.1, 7.1]), { larghezza: 7.1, profondita: 7.1, ruotata: false });
  const d = layoutSala(sala("costellazioni"), "platea")!;
  assert.equal(d.larghezza, 20);
  assert.equal(d.profondita, 25);
  assert.ok(d.ruotata);
  // il palco è sul lato z negativo e prende il 12% della profondità (tetto 3,2 m)
  assert.ok(d.palco.zCentro < 0);
  assert.ok(Math.abs(d.palco.profondita - 3) < 1e-9);
});

test("numero di sedie: min(ospiti, capienza); senza numero valido, la capienza", () => {
  assert.equal(numeroSedie(400), 400);
  assert.equal(numeroSedie(400, null), 400);
  assert.equal(numeroSedie(400, 0), 400);
  assert.equal(numeroSedie(400, -5), 400);
  assert.equal(numeroSedie(400, Number.NaN), 400);
  assert.equal(numeroSedie(400, 120), 120);
  assert.equal(numeroSedie(400, 120.9), 120);
  assert.equal(numeroSedie(400, 9999), 400); // il tetto è la tabella, mai di più
  assert.equal(numeroSedie(400, 0.5), 1);

  const h = sala("sole-plenaria");
  assert.equal(layoutSala(h, "platea", 120)!.n, 120);
  assert.equal(layoutSala(h, "platea", 9999)!.n, 400);
  assert.equal(layoutSala(h, "banchetto", 95)!.nTavoli, 10);
});

test("disposizione non indicata: nessun disegno (il disegno non cambia)", () => {
  assert.equal(layoutSala(sala("costellazioni"), "banchi"), null);
  assert.equal(layoutSala(sala("divinita"), "ferro"), null);
});

test("meno ospiti della capienza: stesse file, nessuna sedia fuori, blocco vicino al palco", () => {
  const h = sala("sole-plenaria");
  const pieno = layoutSala(h, "platea")!;
  const poco = layoutSala(h, "platea", 40)!;
  assert.equal(poco.n, 40);
  const c = controllaDisegno(poco);
  assert.equal(c.fuori, 0);
  const zMedia = (d: Disegno) => posizioni(d).reduce((s, p) => s + p[1], 0) / d.n;
  assert.ok(zMedia(poco) < zMedia(pieno), "con pochi ospiti il blocco sta più vicino al palco");
  assert.ok(poco.scala >= pieno.scala);
});

/* ───────────── forma delle singole disposizioni ───────────── */

test("platea: file rivolte al palco (passi 0,5 x 0,9 m allargati fino a x1,25 se la sala è larga), corridoi, ultima fila centrata", () => {
  const d = layoutSala(sala("costellazioni"), "platea")!;
  assert.equal(d.scala, 1);
  assert.ok(d.espansione > 1 && d.espansione <= ESPANSIONE_MAX, `espansione ${d.espansione}`);
  // tutte guardano -z
  for (let i = 0; i < d.n; i++) assert.equal(d.sedie[STRIDE * i + 2], 0);
  const righe = new Map<number, number[]>();
  for (const [x, z] of posizioni(d)) {
    const k = Math.round(z * 100);
    righe.set(k, [...(righe.get(k) ?? []), x]);
  }
  const zs = [...righe.keys()].sort((a, b) => a - b);
  for (let i = 1; i < zs.length; i++) assert.ok(Math.abs((zs[i] - zs[i - 1]) / 100 - 0.9 * d.espansione) < 0.02, "passo fila 0,9 m x espansione");
  const prima = righe.get(zs[0])!.sort((a, b) => a - b);
  for (let j = 1; j < prima.length; j++) {
    const passo = prima[j] - prima[j - 1];
    assert.ok(passo > 0.5 - 1e-4, "mai sedie sovrapposte");
  }
  // corridoio: nella prima fila c'è un salto più largo del passo
  const salti = prima.slice(1).map((x, j) => x - prima[j]);
  assert.ok(Math.max(...salti) > 1.2, "corridoio centrale");
  // simmetria della fila piena
  assert.ok(Math.abs(prima[0] + prima[prima.length - 1]) < 1e-6);
  // le file stanno nel blocco davanti al fondo: z crescente = verso il fondo
  assert.ok(zs.length >= 10);
});

test("banchi di scuola: n/2 banchi da 2, sedie dietro al banco, rivolte al relatore", () => {
  const d = layoutSala(sala("sole-plenaria"), "banchi")!;
  assert.equal(d.tipoTavoli, "rettangolari");
  assert.equal(d.nTavoli, 94); // 188 / 2
  for (let i = 0; i < d.n; i++) assert.equal(d.sedie[STRIDE * i + 2], 0);
  // ogni sedia sta dietro (z maggiore) al suo banco e a meno di un metro
  for (let i = 0; i < d.n; i++) {
    const x = d.sedie[STRIDE * i];
    const z = d.sedie[STRIDE * i + 1];
    let vicino = false;
    for (let q = 0; q < d.nTavoli; q++) {
      const dx = x - d.tavoli[STRIDE * q];
      const dz = z - d.tavoli[STRIDE * q + 1];
      if (Math.abs(dx) < 0.5 && dz > 0 && dz < 0.9) vicino = true;
    }
    assert.ok(vicino, `sedia ${i} senza banco`);
  }
  // numero dispari: l'ultimo banco ha una sola sedia
  const dispari = layoutSala(sala("stella"), "banchi", 7)!;
  assert.equal(dispari.n, 7);
  assert.equal(dispari.nTavoli, 4);
});

test("ferro di cavallo: U aperta verso il palco; se una U non basta, U concentriche", () => {
  const piccola = layoutSala(sala("pepita"), "ferro")!;
  assert.ok(piccola.nTavoli >= Math.ceil(10 / 3) && piccola.nTavoli <= Math.ceil(10 / 3) + 1);
  const grande = layoutSala(sala("sole-plenaria"), "ferro")!; // 188 sedie: più anelli (MOTION 5.2)
  assert.equal(grande.n, 188);
  // 3 sedie per tavolo; sull'ultima coppia di bracci le sedie restanti si dividono a metà (tavoli simmetrici)
  assert.ok(grande.nTavoli >= Math.ceil(188 / 3) && grande.nTavoli <= Math.ceil(188 / 3) + 1, `tavoli ${grande.nTavoli}`);
  // più anelli: le basi (tavoli con rotY 0) stanno a z diverse
  const zBasi = new Set<number>();
  for (let q = 0; q < grande.nTavoli; q++) {
    if (Math.abs(grande.tavoli[STRIDE * q + 2]) < 1e-9) zBasi.add(Math.round(grande.tavoli[STRIDE * q + 1] * 100));
  }
  assert.ok(zBasi.size >= 2, `anelli concentrici: basi a ${zBasi.size} quote`);
  // le sedie guardano verso l'interno: 0,6 m davanti a ogni sedia c'è un tavolo
  for (let i = 0; i < grande.n; i++) {
    const rot = grande.sedie[STRIDE * i + 2];
    const px = grande.sedie[STRIDE * i] - Math.sin(rot) * 0.6 * grande.scala;
    const pz = grande.sedie[STRIDE * i + 1] - Math.cos(rot) * 0.6 * grande.scala;
    let sopra = false;
    for (let q = 0; q < grande.nTavoli; q++) {
      const dx = px - grande.tavoli[STRIDE * q];
      const dz = pz - grande.tavoli[STRIDE * q + 1];
      const r = grande.tavoli[STRIDE * q + 2];
      const lx = Math.cos(r) * dx - Math.sin(r) * dz;
      const lz = Math.sin(r) * dx + Math.cos(r) * dz;
      if (Math.abs(lx) <= 0.9 * grande.scala + 0.05 && Math.abs(lz) <= 0.3 * grande.scala + 0.05) sopra = true;
    }
    assert.ok(sopra, `sedia ${i} non rivolta a un tavolo`);
  }
});

test("banchetto: ceil(n/10) tavoli tondi, 10 sedie ciascuno (l'ultimo ne ha meno)", () => {
  const d = layoutSala(sala("sole-plenaria"), "banchetto")!;
  assert.equal(d.tipoTavoli, "tondi");
  assert.equal(d.nTavoli, 30);
  assert.equal(d.n, 300);
  const resto = layoutSala(sala("fiori"), "banchetto")!; // 15 -> 2 tavoli, 10 + 5
  assert.equal(resto.nTavoli, 2);
  const perTavolo = [0, 0];
  for (let i = 0; i < resto.n; i++) {
    const x = resto.sedie[STRIDE * i];
    const z = resto.sedie[STRIDE * i + 1];
    const q = Math.hypot(x - resto.tavoli[0], z - resto.tavoli[1]) < Math.hypot(x - resto.tavoli[STRIDE], z - resto.tavoli[STRIDE + 1]) ? 0 : 1;
    perTavolo[q]++;
  }
  assert.deepEqual(perTavolo.sort((a, b) => b - a), [10, 5]);
  // sedie a raggio costante dal loro tavolo e rivolte al centro
  const sed = layoutSala(sala("pepita"), "banchetto")!;
  for (let i = 0; i < sed.n; i++) {
    const dx = sed.tavoli[0] - sed.sedie[STRIDE * i];
    const dz = sed.tavoli[1] - sed.sedie[STRIDE * i + 1];
    const rot = sed.sedie[STRIDE * i + 2];
    const dist = Math.hypot(dx, dz);
    assert.ok(Math.abs((-Math.sin(rot) * dx + -Math.cos(rot) * dz) / dist - 1) < 1e-6, "sedia rivolta al centro del tavolo");
  }
});

test("espansione: i passi si allargano solo se a scala 1 stanno già; mai gli oggetti; ferro mai", () => {
  let allargati = 0;
  for (const h of congressHalls) {
    for (const disp of DISPOSIZIONI) {
      const d = layoutSala(h, disp);
      if (!d) continue;
      assert.ok(d.espansione >= 1 && d.espansione <= ESPANSIONE_MAX + 1e-9, `${h.id}/${disp}`);
      if (d.espansione > 1) {
        allargati++;
        assert.equal(d.scala, 1, `${h.id}/${disp}: allargata ma già rimpicciolita`);
        assert.notEqual(disp, "ferro");
      }
    }
  }
  assert.ok(allargati > 5, `solo ${allargati} disegni allargati`);
  // Costellazioni: la platea occupa la sala, non solo le prime file (l'ultima fila sta oltre la metà della profondità)
  const d = layoutSala(sala("costellazioni"), "platea")!;
  const zMax = Math.max(...posizioni(d).map((p) => p[1]));
  assert.ok(zMax > 0, `ultima fila a z=${zMax.toFixed(1)}`);
});

test("le sale piccole si adattano rimpicciolendo, ma restano dentro (scala 0,6-1)", () => {
  for (const [id, disp] of [
    ["pepita", "ferro"],
    ["oro", "banchetto"],
    ["fiori", "banchetto"],
  ] as const) {
    const d = layoutSala(sala(id), disp)!;
    assert.ok(d.ridotta && d.scala >= SCALA_MIN, `${id}/${disp}: scala ${d.scala}`);
  }
});

test("sala impossibile: disegno più fitto a scala minima e `sporge` true (non si inganna)", () => {
  const d = layout({ dims: [3, 3], disposizione: "platea", capienza: 300 });
  assert.equal(d.sporge, true);
  assert.equal(d.scala, SCALA_MIN);
  assert.ok(controllaDisegno(d).fuori > 0);
});

test("layoutVuoto: nessuna sedia (sala divisa: nessuna capienza inventata)", () => {
  const d = layoutVuoto(sala("costellazioni"), "platea");
  assert.equal(d.n, 0);
  assert.equal(d.nTavoli, 0);
  assert.equal(d.larghezza, 20);
});

/* ───────────── morfologia: funzione pura di k ───────────── */

test("accoppia: stesso numero di istanze, extra dal parcheggio con scala 0, in meno spariscono sul posto", () => {
  const h = sala("sole-plenaria");
  const platea = layoutSala(h, "platea")!; // 400
  const banchi = layoutSala(h, "banchi")!; // 188
  const su = accoppia(banchi.sedie, platea.sedie, [8, 8]);
  assert.equal(su.n, 400);
  let dalParcheggio = 0;
  for (let i = 0; i < su.n; i++) {
    if (su.da[STRIDE * i + 3] === 0) {
      dalParcheggio++;
      assert.equal(su.da[STRIDE * i], 8);
      assert.equal(su.da[STRIDE * i + 1], 8);
      assert.ok(su.a[STRIDE * i + 3] > 0);
    }
  }
  assert.equal(dalParcheggio, 400 - 188);
  const giu = accoppia(platea.sedie, banchi.sedie, [8, 8]);
  assert.equal(giu.n, 400);
  let spariscono = 0;
  for (let i = 0; i < giu.n; i++) {
    if (giu.a[STRIDE * i + 3] === 0) {
      spariscono++;
      assert.equal(giu.a[STRIDE * i], giu.da[STRIDE * i]); // sul posto
      assert.equal(giu.a[STRIDE * i + 1], giu.da[STRIDE * i + 1]);
    }
  }
  assert.equal(spariscono, 400 - 188);
  // accoppiamento per vicinanza: lo spostamento medio è molto minore di una scelta a caso
  let somma = 0;
  let conta = 0;
  for (let i = 0; i < su.n; i++) {
    if (su.da[STRIDE * i + 3] === 0) continue;
    somma += Math.hypot(su.a[STRIDE * i] - su.da[STRIDE * i], su.a[STRIDE * i + 1] - su.da[STRIDE * i + 1]);
    conta++;
  }
  assert.ok(somma / conta < 7, `spostamento medio ${(somma / conta).toFixed(1)} m`);
});

test("accoppia scarta le istanze già invisibili della partenza", () => {
  const da = Float32Array.from([1, 1, 0, 1, 2, 2, 0, 0, 3, 3, 0, 1]);
  const a = Float32Array.from([5, 5, 0, 1]);
  const c = accoppia(da, a, [0, 0]);
  assert.equal(c.n, 2); // 2 visibili in partenza, 1 in arrivo: 2 istanze, una sparisce
});

test("morfaMatrici: k=0 è la partenza, k=1 è l'arrivo, a metà la sedia salta di 22 cm", () => {
  const h = sala("sole-plenaria");
  const c = accoppia(layoutSala(h, "platea")!.sedie, layoutSala(h, "banchi")!.sedie, [8, 8]);
  const out = new Float32Array(16 * c.n);
  const leggi = (i: number) => ({
    x: out[16 * i + 12],
    y: out[16 * i + 13],
    z: out[16 * i + 14],
    s: Math.hypot(out[16 * i], out[16 * i + 2]),
  });

  morfaMatrici(0, c, out);
  for (let i = 0; i < c.n; i++) {
    const m = leggi(i);
    assert.ok(Math.abs(m.x - c.da[STRIDE * i]) < 1e-5 && Math.abs(m.z - c.da[STRIDE * i + 1]) < 1e-5, `k=0 sedia ${i}`);
    assert.ok(Math.abs(m.s - c.da[STRIDE * i + 3]) < 1e-5);
    assert.equal(m.y, 0);
  }
  morfaMatrici(1, c, out);
  for (let i = 0; i < c.n; i++) {
    const m = leggi(i);
    assert.ok(Math.abs(m.x - c.a[STRIDE * i]) < 1e-5 && Math.abs(m.z - c.a[STRIDE * i + 1]) < 1e-5, `k=1 sedia ${i}`);
    assert.ok(Math.abs(m.s - c.a[STRIDE * i + 3]) < 1e-5);
    assert.ok(Math.abs(m.y) < 1e-6, "a fine tween la sedia è a terra");
  }
  // il salto: nessuna sedia supera 22 cm e almeno una lo sfiora
  let massimo = 0;
  for (const k of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
    morfaMatrici(k, c, out);
    for (let i = 0; i < c.n; i++) massimo = Math.max(massimo, leggi(i).y);
  }
  assert.ok(massimo <= SALTO + 1e-6, `salto massimo ${massimo}`);
  assert.ok(massimo > SALTO * 0.9, `il salto si vede: ${massimo}`);
});

test("morfaMatrici: stagger. L'ultima sedia parte a 0,33, la prima subito; stesso k, stesso risultato", () => {
  const c = accoppia(Float32Array.from([0, 0, 0, 1, 1, 1, 0, 1, 2, 2, 0, 1]), Float32Array.from([0, 5, 0, 1, 1, 6, 0, 1, 2, 7, 0, 1]), [0, 0]);
  assert.ok(avanzamentoIstanza(0.05, 0, 3) > 0);
  assert.equal(avanzamentoIstanza(SFALSAMENTO, 2, 3), 0);
  assert.ok(avanzamentoIstanza(SFALSAMENTO + 0.05, 2, 3) > 0);
  assert.equal(avanzamentoIstanza(1, 2, 3), 1);
  assert.equal(avanzamentoIstanza(1, 0, 3), 1);
  const a = new Float32Array(16 * 3);
  const b = new Float32Array(16 * 3);
  morfaMatrici(0.4, c, a);
  morfaMatrici(0.4, c, b);
  assert.deepEqual(Array.from(a), Array.from(b));
  // a k=0,2 la prima sedia si è mossa più dell'ultima (ritardo)
  morfaMatrici(0.2, c, a);
  assert.ok(a[14] - 0 > a[16 * 2 + 14] - 2);
  // monotona in k: la posizione z della prima sedia non torna mai indietro
  let prec = -Infinity;
  for (let k = 0; k <= 1.0001; k += 0.05) {
    morfaMatrici(k, c, a);
    assert.ok(a[14] >= prec - 1e-6);
    prec = a[14];
  }
});

test("tempi: sedie 720 ms con ultima che parte a 240; pareti 600; sala 480", () => {
  assert.equal(DURATE.sedie, 720);
  assert.equal(DURATE.pareti, 600);
  assert.equal(DURATE.stanza, 480);
  assert.ok(Math.abs(SFALSAMENTO * DURATE.sedie - 240) < 5);
  const normale = pianoTempi({ cambiaDivisa: false, dividendo: false });
  assert.equal(normale.totale, 720);
  assert.equal(faseAt(0, normale.sedie), 0);
  assert.equal(faseAt(720, normale.sedie), 1);
  assert.equal(faseAt(360, normale.sedie), 0.5);
  const dividi = pianoTempi({ cambiaDivisa: true, dividendo: true });
  assert.deepEqual(dividi.sedie, [0, 720]);
  assert.deepEqual(dividi.pareti, [360, 600]);
  assert.equal(dividi.totale, 960);
  const riunisci = pianoTempi({ cambiaDivisa: true, dividendo: false });
  assert.deepEqual(riunisci.pareti, [0, 600]);
  assert.deepEqual(riunisci.sedie, [360, 720]);
  assert.equal(riunisci.totale, 1080);
  assert.equal(faseAt(10, [0, 0]), 1); // fase senza durata: già compiuta
});

/* ───────────── pareti mobili: due stati ───────────── */

test("schema pareti: Costellazioni 8 parti (3+1 pareti), Divinità 5 parti (4 pareti); pannelli entro il tetto", () => {
  const c = sala("costellazioni");
  const tc = telaio(c.dims);
  const sc = schemaPareti(c.divisibleInto!, tc.larghezza, tc.profondita);
  assert.equal(sc.parti, 8);
  assert.equal(sc.segmenti.length, 4);
  assert.equal(sc.segmenti.filter((s) => s.asse === "x").length, 3);
  assert.equal(sc.segmenti.filter((s) => s.asse === "z").length, 1);
  assert.equal(sc.pannelli, 3 * Math.ceil(20 / 1.2) + Math.ceil(25 / 1.2)); // 72
  assert.ok(sc.pannelli <= MAX_PANNELLI);

  const d = sala("divinita");
  const td = telaio(d.dims);
  const sd = schemaPareti(d.divisibleInto!, td.larghezza, td.profondita);
  assert.equal(sd.parti, 5);
  assert.equal(sd.segmenti.length, 4);
  assert.ok(sd.segmenti.every((s) => s.asse === "x"));
  assert.equal(sd.pannelli, 4 * Math.ceil(17.2 / 1.2)); // 60
  assert.ok(sd.pannelli <= MAX_PANNELLI);
  // parti uguali: frazioni equispaziate
  assert.deepEqual(sd.segmenti.map((s) => s.frazione), [0.2, 0.4, 0.6, 0.8]);
});

test("pannelli: w=0 ritirati nella tasca del muro (invisibili), w=1 allineati sul binario e senza buchi", () => {
  const s = schemaPareti(5, 17.2, 25.3);
  const out = new Float32Array(16 * MAX_PANNELLI);
  const h = 3.4;
  const n0 = scriviPannelli(out, 0, s, 17.2, 25.3, h);
  assert.equal(n0, s.pannelli);
  for (let i = 0; i < n0; i++) {
    // sala unita: oltre la faccia interna del muro laterale e dentro il suo spessore (x < -larghezza/2, > -larghezza/2 - 0,6)
    const x = out[16 * i + 12];
    assert.ok(x < -17.2 / 2 && x > -17.2 / 2 - SPESSORE_MURO, `pannello ${i} nella tasca: x=${x}`);
    // di taglio (ruotati di 90°): la colonna 0 della matrice punta lungo z
    assert.ok(Math.abs(out[16 * i + 2]) > 0.9 * Math.hypot(out[16 * i], out[16 * i + 2]));
    assert.ok(out[16 * i + 5] <= h && out[16 * i + 5] > h - 0.05, "altezza vera della sala (meno 2 cm: niente z-fighting col muro)");
  }
  scriviPannelli(out, 1, s, 17.2, 25.3, h);
  const per = s.segmenti[0].pannelli;
  const lp = 17.2 / per;
  for (let j = 0; j < per; j++) {
    const cx = out[16 * j + 12];
    assert.ok(Math.abs(cx - (-17.2 / 2 + (j + 0.5) * lp)) < 1e-4, `pannello ${j} sul binario`);
    assert.ok(Math.abs(out[16 * j + 0] - lp) < 1e-4, "il pannello copre il suo tratto, senza buchi");
    assert.ok(Math.abs(out[16 * j + 2]) < 1e-5, "allineato alla parete");
    assert.ok(Math.abs(out[16 * j + 14] - (-25.3 / 2 + 0.2 * 25.3)) < 1e-6, "sul binario della parete");
  }
  // la parete lungo z (Costellazioni) si ritira nel muro del palco (z < -profondita/2), non davanti allo schermo
  const c = sala("costellazioni");
  const tc = telaio(c.dims);
  const s8 = schemaPareti(8, tc.larghezza, tc.profondita);
  const out8 = new Float32Array(16 * MAX_PANNELLI);
  scriviPannelli(out8, 0, s8, tc.larghezza, tc.profondita, c.heightM);
  const zIdx = s8.segmenti.findIndex((g) => g.asse === "z");
  const primoZ = s8.segmenti.slice(0, zIdx).reduce((n, g) => n + g.pannelli, 0);
  for (let j = 0; j < s8.segmenti[zIdx].pannelli; j++) {
    assert.ok(out8[16 * (primoZ + j) + 14] < -tc.profondita / 2, `pannello z ${j} nella tasca del muro del palco`);
  }
  scriviPannelli(out8, 1, s8, tc.larghezza, tc.profondita, c.heightM);
  const zs: number[] = [];
  for (let j = 0; j < s8.segmenti[zIdx].pannelli; j++) zs.push(out8[16 * (primoZ + j) + 14]);
  zs.sort((p, q) => p - q);
  assert.ok(Math.abs(zs[0] - (-tc.profondita / 2 + 0.5 * (tc.profondita / s8.segmenti[zIdx].pannelli))) < 1e-4);
  // a metà gli estremi sono ancora distinti: i pannelli escono uno alla volta (il più lontano per primo)
  const meta = new Float32Array(16 * MAX_PANNELLI);
  scriviPannelli(meta, 0.3, s, 17.2, 25.3, h);
  assert.ok(meta[16 * (per - 1) + 12] > meta[16 * 0 + 12], "il pannello più lontano è già avanti");
  // funzione pura di w
  const a = new Float32Array(16 * MAX_PANNELLI);
  const b = new Float32Array(16 * MAX_PANNELLI);
  scriviPannelli(a, 0.37, s, 17.2, 25.3, h);
  scriviPannelli(b, 0.37, s, 17.2, 25.3, h);
  assert.deepEqual(Array.from(a), Array.from(b));
});

/* ───────────── camera ───────────── */

test("distanzaVista: gli otto angoli della sala stanno nell'inquadratura (verificato con una proiezione indipendente)", () => {
  const fov = 38;
  for (const h of [sala("costellazioni"), sala("pepita"), sala("oro")]) {
    const tl = telaio(h.dims);
    for (const aspetto of [390 / 600, 1, 1440 / 800]) {
      for (const az of [-20, 0, 20]) {
        const pol = 40;
        const D = distanzaVista(tl.larghezza, tl.profondita, h.heightM, { az, pol, fov, aspetto, riempimento: 1 });
        const a = (az * Math.PI) / 180;
        const p = (pol * Math.PI) / 180;
        const bersaglio = [0, 0.6, 0];
        const cam = [bersaglio[0] + D * Math.sin(p) * Math.sin(a), bersaglio[1] + D * Math.cos(p), bersaglio[2] + D * Math.sin(p) * Math.cos(a)];
        // base della camera
        const f = [bersaglio[0] - cam[0], bersaglio[1] - cam[1], bersaglio[2] - cam[2]];
        const fl = Math.hypot(...f);
        const fw = f.map((v) => v / fl);
        const r = [fw[1] * 0 - fw[2] * 1, fw[2] * 0 - fw[0] * 0, fw[0] * 1 - fw[1] * 0]; // cross(f, up)
        const rl = Math.hypot(...r);
        const rt = r.map((v) => v / rl);
        const u = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
        const tv = Math.tan((fov * Math.PI) / 360);
        for (const sx of [-1, 1]) {
          for (const sz of [-1, 1]) {
            for (const y of [0, h.heightM]) {
              const v = [(sx * tl.larghezza) / 2 - cam[0], y - cam[1], (sz * tl.profondita) / 2 - cam[2]];
              const depth = v[0] * fw[0] + v[1] * fw[1] + v[2] * fw[2];
              const nx = (v[0] * rt[0] + v[1] * rt[1] + v[2] * rt[2]) / (depth * tv * aspetto);
              const ny = (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / (depth * tv);
              assert.ok(depth > 0, "davanti alla camera");
              assert.ok(Math.abs(nx) <= 1 + 1e-6 && Math.abs(ny) <= 1 + 1e-6, `${h.id} az ${az} asp ${aspetto.toFixed(2)}: (${nx.toFixed(2)}, ${ny.toFixed(2)})`);
            }
          }
        }
      }
    }
  }
});
