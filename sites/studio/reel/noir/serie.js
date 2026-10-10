// Parti FISSE della serie «Dalla teoria alla realtà», uguali in ogni puntata.
// Una puntata definisce P = { EP, DAY, CAP, NEXT, FONTE, QUANDO } (QUANDO facoltativo, default 'DOMANI': la scritta sopra NEXT nella scena fine; DAY 0 = lunedì, CAP 0 = capitolo 1), le sue scene e ORDER,
// poi chiama serie(FN, ORDER, FLASH). Scene fisse: num (numero gigante), dove (sentiero dei 12 capitoli), fine («Oggi è …»),
// cta (like · commento · segui), end (firma col numero). Il circuito dei 5 attori serve a tutto il capitolo 1.
const S = (k) => ((window.CUES || {})[k] || [0, 1])[0], E = (k) => ((window.CUES || {})[k] || [0, 1])[1];
// WT('grano', 'euro', 1, 2.0): secondo assoluto in cui la voce dice la n-esima parola che inizia con «euro» nella scena «grano».
// I tempi vengono da Whisper sulla voce vera (cues.json → window.WORDS). Senza voce (anteprima) usa S(scena) + riserva.
// Meglio agganciarsi a parole, non a numeri (Whisper scrive «4» per «quattro»): WT accetta anche le cifre ('4').
const _nw = (w) => w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const WT = (k, w, n = 1, riserva = 0.8) => { const L = ((window.WORDS || {})[k]) || []; let c = 0;
  for (const [p, t] of L) if (_nw(p).startsWith(_nw(w)) && ++c === n) return t;
  return S(k) + riserva; };
const zoom = (t, a, b, z0 = 1.06) => { const z = lerp(z0, 1, oC(seg(t, a, b))); x.translate(540, 1000); x.scale(z, z); x.translate(-540, -1000); };

// ---------- il circuito ----------
const N = { fam: [290, 700, 'FAMIGLIE'], imp: [790, 700, 'IMPRESE'], stato: [170, 1100, 'STATO'], banche: [910, 1100, 'BANCHE'], estero: [540, 1290, 'ESTERO'] };
function icon(k, cx, cy, col) {
  x.save(); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 5; x.lineCap = 'round'; x.lineJoin = 'round';
  if (k === 'fam') { for (const [dx, r] of [[-22, 16], [20, 13]]) { x.beginPath(); x.arc(cx + dx, cy - 18, r, 0, 7); x.stroke(); x.beginPath(); x.arc(cx + dx, cy + 26, r * 1.5, Math.PI, 0); x.stroke(); } }
  if (k === 'imp') { x.beginPath(); x.moveTo(cx - 40, cy + 30); x.lineTo(cx - 40, cy - 5); x.lineTo(cx - 15, cy + 8); x.lineTo(cx - 15, cy - 5); x.lineTo(cx + 10, cy + 8); x.lineTo(cx + 10, cy - 30); x.lineTo(cx + 40, cy - 30); x.lineTo(cx + 40, cy + 30); x.closePath(); x.stroke(); }
  if (k === 'stato') { x.beginPath(); x.moveTo(cx - 44, cy - 14); x.lineTo(cx, cy - 40); x.lineTo(cx + 44, cy - 14); x.closePath(); x.stroke(); for (const dx of [-28, 0, 28]) { x.beginPath(); x.moveTo(cx + dx, cy - 6); x.lineTo(cx + dx, cy + 26); x.stroke(); } x.beginPath(); x.moveTo(cx - 46, cy + 34); x.lineTo(cx + 46, cy + 34); x.stroke(); }
  if (k === 'banche') { x.beginPath(); x.roundRect(cx - 42, cy - 28, 84, 60, 10); x.stroke(); txt('€', cx, cy + 2, { size: 46, weight: 800, color: col }); }
  if (k === 'estero') { x.beginPath(); x.arc(cx, cy, 36, 0, 7); x.stroke(); x.beginPath(); x.ellipse(cx, cy, 16, 36, 0, 0, 7); x.stroke(); x.beginPath(); x.moveTo(cx - 36, cy); x.lineTo(cx + 36, cy); x.stroke(); }
  x.restore();
}
function node(k, kIn, hot) {
  if (kIn <= 0) return; const [cx, cy, lab] = N[k]; const s = lerp(0.7, 1, oB(clamp(kIn)));
  x.save(); x.translate(cx, cy); x.scale(s, s); x.translate(-cx, -cy);
  if (hot > 0) glow(cx, cy, 190, '200,250,114', 0.28 * hot);
  glass(cx, cy, 190, 190, 95, clamp(kIn * 2));
  if (hot > 0) { x.save(); x.globalAlpha = hot; x.strokeStyle = C.lime; x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, 97, 0, 7); x.stroke(); x.restore(); }
  icon(k, cx, cy, hot > 0.5 ? C.lime : C.ink);
  txt(lab, cx, cy + 128, { fam: 'mono', size: 26, weight: 600, color: hot > 0.5 ? C.lime : C.muted, ls: 3, alpha: clamp(kIn * 2) });
  x.restore();
}
// flussi: [da, a, etichetta, chiave di inizio, ritardo, curvatura]
const FL = [['imp', 'fam', 'stipendi', 'fam', 1.6, -0.25], ['fam', 'imp', 'spesa', 'fam', 3.6, -0.25],
  ['fam', 'stato', 'tasse', 'stato', 1.0, 0.2], ['stato', 'fam', 'servizi · pensioni', 'stato', 2.4, 0.2],
  ['fam', 'banche', 'risparmi', 'banche', 1.0, 0.18], ['banche', 'imp', 'prestiti', 'banche', 3.0, -0.3],
  ['estero', 'imp', 'import', 'estero', 1.2, -0.25], ['imp', 'estero', 'export', 'estero', 3.2, -0.25]];
function curve(a, b, bend) { const [x0, y0] = N[a], [x1, y1] = N[b]; const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0;
  const cx = mx - dy * bend, cy = my + dx * bend; const r = 110; const L0 = Math.hypot(cx - x0, cy - y0), L1 = Math.hypot(x1 - cx, y1 - cy);
  return { p0: [x0 + (cx - x0) / L0 * r, y0 + (cy - y0) / L0 * r], c: [cx, cy], p1: [x1 - (x1 - cx) / L1 * r, y1 - (y1 - cy) / L1 * r] }; }
const qp = (q, u) => [ (1 - u) * (1 - u) * q.p0[0] + 2 * (1 - u) * u * q.c[0] + u * u * q.p1[0], (1 - u) * (1 - u) * q.p0[1] + 2 * (1 - u) * u * q.c[1] + u * u * q.p1[1] ];
function circuit(t, o = {}) {
  const { speed = 1, jam = 0, scale = 1, hotKey = null, nodesIn = null, flowsAll = false } = o;
  x.save(); x.translate(540, 1000); x.scale(scale, scale); x.translate(-540, -1000);
  FL.forEach(([a, b, lab, key, d, bend], i) => {
    const st = S(key) + d, k = flowsAll ? 1 : oC(seg(t, st, st + 0.6)); if (k <= 0) return;
    const q = curve(a, b, bend), recent = !flowsAll && t < st + 3.5, isJam = jam > 0 && i === 1;
    const col = isJam ? `rgba(255,90,78,${0.5 + 0.5 * jam})` : recent ? C.lime : 'rgba(241,244,238,0.45)';
    x.save(); x.globalAlpha = k; x.strokeStyle = col; x.lineWidth = recent ? 4 : 2.5; x.setLineDash([2, 10]); x.beginPath(); x.moveTo(...q.p0); x.quadraticCurveTo(...q.c, ...q.p1); x.stroke(); x.setLineDash([]);
    // freccia
    const e = qp(q, 0.97), e2 = qp(q, 0.9), ang = Math.atan2(e[1] - e2[1], e[0] - e2[0]); x.fillStyle = col; x.beginPath(); x.moveTo(e[0] + Math.cos(ang) * 14, e[1] + Math.sin(ang) * 14); x.lineTo(e[0] + Math.cos(ang + 2.5) * 16, e[1] + Math.sin(ang + 2.5) * 16); x.lineTo(e[0] + Math.cos(ang - 2.5) * 16, e[1] + Math.sin(ang - 2.5) * 16); x.closePath(); x.fill();
    // monete che scorrono (la velocità si «inceppa»)
    const sp = speed * (isJam ? 1 - 0.9 * jam : 1);
    for (let j = 0; j < 3; j++) { const u = ((t - st) * 0.45 * sp + j / 3) % 1; if (u < 0) continue; const [px, py] = qp(q, u); x.fillStyle = col; x.beginPath(); x.arc(px, py, recent ? 9 : 6, 0, 7); x.fill(); if (recent) glow(px, py, 30, isJam ? '255,90,78' : '200,250,114', 0.35); }
    const m = qp(q, 0.5); txt(lab, m[0], m[1] - 24, { fam: 'mono', size: 27, weight: 600, color: col, alpha: k * (recent || flowsAll ? 1 : 0.7), ls: 1 });
    if (isJam && jam > 0.3) { x.save(); x.strokeStyle = C.red; x.lineWidth = 10; x.lineCap = 'round'; const [jx, jy] = qp(q, 0.5); const r = 26 * jam; x.beginPath(); x.moveTo(jx - r, jy - r + 26); x.lineTo(jx + r, jy + r + 26); x.moveTo(jx + r, jy - r + 26); x.lineTo(jx - r, jy + r + 26); x.stroke(); x.restore(); }
    x.restore();
  });
  Object.keys(N).forEach((k, i) => node(k, nodesIn ? nodesIn[i] : 1, hotKey === k ? 1 : 0));
  x.restore();
}

// ---------- scene nuove della struttura fissa ----------
function sNum(t, a, b) { bg('30,44,26'); x.save();
  const k = oC(seg(t, 0, 0.5)), ko = ioC(seg(t, b - 0.45, b));
  const s = lerp(1.25, 1, k) * lerp(1, 0.25, ko), y = lerp(960, 330, ko);
  glow(540, y, 520 * s, '200,250,114', 0.25 * k * (1 - ko));
  x.save(); x.translate(540, y); x.scale(s, s); txt(String(P.EP), 0, 0, { size: 820, weight: 800, color: C.ink, alpha: k * (1 - ko * 0.9), blur: (1 - k) * 20, ls: -30 }); x.restore();
  txt('DALLA TEORIA ALLA REALTÀ', 540, 1380, { fam: 'mono', size: 30, weight: 600, color: C.lime, ls: 6, alpha: k * (1 - ko) });
  x.restore(); finish(t); }
const CAPS = ['Come gira l’economia', 'Soldi e banche', 'Inflazione', 'Banche centrali', 'Stato e tasse', 'Mercati finanziari', 'Macro e mercati', 'Europa e geopolitica', 'Aziende e bilanci', 'Investire', 'Trading', 'Portafoglio'];
function sDove(t, a, b) { bg(); x.save(); zoom(t, a, b, 1.05);
  mono('IL PERCORSO', 540, 300, t, a, { size: 26, color: C.lime });
  phrase(t, a + 0.1, [['Dall’economia di base', C.ink], ['agli investimenti.', C.lime]], 400, { size: 84 });
  // sentiero di 12 tappe a serpentina
  const PT = []; for (let i = 0; i < 12; i++) { const row = Math.floor(i / 4), col = i % 4, cx = row % 2 ? 840 - col * 200 : 240 + col * 200; PT.push([cx, 720 + row * 240]); }
  const d = b - a, kp = seg(t, a + 0.4, a + 0.4 + d * 0.6);
  x.save(); x.strokeStyle = 'rgba(241,244,238,0.25)'; x.lineWidth = 4; x.setLineDash([4, 12]); x.beginPath(); PT.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke(); x.setLineDash([]); x.restore();
  PT.forEach(([px, py], i) => { const ki = oB(seg(kp, i / 12, i / 12 + 0.15)); if (ki <= 0) return; const on = i === P.CAP;
    x.save(); x.translate(px, py); x.scale(clamp(ki, 0, 1.3), clamp(ki, 0, 1.3)); if (on) glow(0, 0, 90, '200,250,114', 0.4);
    x.beginPath(); x.arc(0, 0, on ? 38 : 26, 0, 7); x.fillStyle = on ? C.lime : '#121714'; x.fill(); x.strokeStyle = on ? C.lime : 'rgba(241,244,238,0.4)'; x.lineWidth = 3; x.stroke();
    txt(String(i + 1), 0, 2, { size: on ? 34 : 24, weight: 800, color: on ? '#15200C' : C.muted }); x.restore();
    txt(CAPS[i], px, py + 60, { fam: 'mono', size: 18, weight: 600, color: on ? C.lime : C.muted, alpha: clamp(ki) * (on ? 1 : 0.8) }); });
  const kh = seg(t, a + 0.4 + d * 0.65, a + 0.4 + d * 0.65 + 0.4); if (kh > 0) glassPill(PT[P.CAP][0] + 10, PT[P.CAP][1] - 110, 'SEI QUI', kh, C.lime, 30);
  x.restore(); finish(t); }
function sPerche(t, a, b) { bg(); x.save(); zoom(t, a, b, 1.05);
  phrase(t, a + 0.05, [['Prima: come', C.ink], ['girano i soldi.', C.lime]], 360, { size: 92 });
  const d = b - a, L = ['TASSI', 'INFLAZIONE', 'BORSA'];
  L.forEach((l, i) => { const cx = 210 + i * 330, cy = 900, ki = oC(seg(t, a + 0.5 + i * 0.25, a + 0.9 + i * 0.25)), open = seg(t, a + d * 0.62 + i * 0.18, a + d * 0.62 + i * 0.18 + 0.35);
    glass(cx, cy + 40, 250, 230, 30, ki); txt(l, cx, cy + 110, { fam: 'mono', size: 26, weight: 600, color: open > 0.5 ? C.lime : C.ink, alpha: ki, ls: 2 });
    // lucchetto che si apre
    x.save(); x.globalAlpha = ki; x.strokeStyle = open > 0.5 ? C.lime : C.ink; x.lineWidth = 10; x.lineCap = 'round'; const lift = 26 * oC(open);
    x.beginPath(); x.arc(cx, cy - 20 - lift, 32, Math.PI, 0); x.lineTo(cx + 32, cy - 20 - lift + (open > 0.5 ? -10 : 0)); x.stroke();
    rr(cx - 48, cy - 20, 96, 80, 14); x.fillStyle = open > 0.5 ? 'rgba(200,250,114,0.2)' : '#141916'; x.fill(); x.strokeStyle = 'rgba(241,244,238,0.4)'; x.lineWidth = 3; x.stroke(); x.restore(); });
  // chiave «il circuito»
  const kk = oC(seg(t, a + d * 0.35, a + d * 0.6)); if (kk > 0) { const kx = lerp(-200, 540, kk); glassPill(kx, 1260, 'la chiave: il circuito', kk, C.lime, 44); }
  x.restore(); finish(t); }
const GIORNI = ['LUN', 'MAR', 'MER', 'GIO', 'VEN'], GIORNO_LUNGO = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì'];
function sFine(t, a, b) { bg(); x.save(); zoom(t, a, b, 1.04);
  phrase(t, a + 0.05, [['Oggi è ' + GIORNO_LUNGO[P.DAY] + ':', C.ink], ['lezione ' + (P.DAY + 1) + ' di 5', C.lime]], 340, { size: 88 });
  GIORNI.forEach((g, i) => { const cx = 180 + i * 180, k = oB(seg(t, a + 0.4 + i * 0.1, a + 0.8 + i * 0.1)), on = i === P.DAY;
    if (k <= 0) return; x.save(); x.translate(cx, 820); x.scale(clamp(k, 0, 1.2), clamp(k, 0, 1.2));
    if (on) glow(0, 0, 120, '200,250,114', 0.35); glass(0, 0, 150, 190, 28, 1);
    if (on) { x.save(); x.strokeStyle = C.lime; x.lineWidth = 4; rr(-75, -95, 150, 190, 28); x.stroke(); x.restore(); }
    txt(g, 0, -40, { fam: 'mono', size: 26, weight: 600, color: on ? C.lime : C.muted, ls: 2 }); txt(String(i + 1), 0, 30, { size: 70, weight: 800, color: on ? C.lime : 'rgba(241,244,238,0.35)' }); x.restore(); });
  const d = b - a; mono(P.QUANDO || 'DOMANI', 540, 1080, t, a + d * 0.45, { size: 26, color: C.lime });
  phrase(t, a + d * 0.5, P.NEXT.map((l) => [l, C.ink]), 1170, { size: 72 });
  x.restore(); finish(t); }
function heart(cx, cy, r, fill) { x.beginPath(); x.moveTo(cx, cy + r * 0.9); x.bezierCurveTo(cx - r * 1.6, cy - r * 0.2, cx - r * 0.7, cy - r * 1.4, cx, cy - r * 0.5); x.bezierCurveTo(cx + r * 0.7, cy - r * 1.4, cx + r * 1.6, cy - r * 0.2, cx, cy + r * 0.9); if (fill) x.fill(); else x.stroke(); }
function sCta(t, a, b) { bg('30,44,26'); x.save();
  phrase(t, a + 0.05, [['Ti è piaciuto?', C.ink]], 380, { size: 96 });
  const d = b - a, I = [['like', 270], ['commento', 540], ['segui', 810]];
  I.forEach(([lab, cx], i) => { const t0 = a + 0.4 + i * d * 0.22, k = oB(seg(t, t0 - 0.3, t0 + 0.1)), hit = t >= t0 + 0.15;
    if (k <= 0) return; x.save(); x.translate(cx, 900); x.scale(clamp(k, 0, 1.2) * (hit ? 1 + 0.12 * Math.sin(Math.PI * clamp((t - t0 - 0.15) / 0.3)) : 1), clamp(k, 0, 1.2) * (hit ? 1 + 0.12 * Math.sin(Math.PI * clamp((t - t0 - 0.15) / 0.3)) : 1));
    if (hit) glow(0, 0, 140, i === 0 ? '255,90,78' : '200,250,114', 0.35); glass(0, 0, 200, 200, 100, 1);
    x.strokeStyle = C.ink; x.fillStyle = i === 0 ? C.red : C.lime; x.lineWidth = 7; x.lineJoin = 'round';
    if (i === 0) { if (hit) heart(0, 4, 40, true); else heart(0, 4, 40, false); }
    if (i === 1) { x.strokeStyle = hit ? C.lime : C.ink; rr(-46, -38, 92, 66, 20); x.stroke(); x.beginPath(); x.moveTo(-20, 28); x.lineTo(-30, 50); x.lineTo(2, 28); x.stroke(); }
    if (i === 2) { x.strokeStyle = hit ? C.lime : C.ink; x.beginPath(); x.arc(-8, -16, 20, 0, 7); x.stroke(); x.beginPath(); x.arc(-8, 44, 38, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); x.beginPath(); x.moveTo(30, -6); x.lineTo(30, 30); x.moveTo(12, 12); x.lineTo(48, 12); x.stroke(); }
    x.restore(); txt(lab, cx, 1040, { fam: 'mono', size: 26, weight: 600, color: hit ? C.lime : C.muted, ls: 2, alpha: clamp(k) }); tap(cx + 20, 920, t, t0 + 0.15); });
  x.restore(); finish(t); }
function sEnd2(t, a) { bg('30,44,26'); x.save();
  const k = oB(seg(t, a, a + 0.6)); glow(540, 820, 420, '200,250,114', 0.25 * clamp(k));
  x.save(); x.translate(540, 820); x.scale(clamp(k, 0, 1.2), clamp(k, 0, 1.2)); txt(String(P.EP), 0, 0, { size: 520, weight: 800, color: C.lime, ls: -20 }); x.restore();
  txt(typed('@macro.algo.desk', t, a + 0.5, 28), 540, 1160, { size: 54, weight: 800, color: C.ink, ls: -1 });
  txt('CONTENUTO EDUCATIVO · NON È CONSULENZA FINANZIARIA', 540, 1300, { fam: 'mono', size: 20, weight: 500, color: '#6C756F', ls: 2, alpha: oC(seg(t, a + 0.8, a + 1.2)) });
  txt(P.FONTE, 540, 1340, { fam: 'mono', size: 20, weight: 500, color: '#6C756F', ls: 2, alpha: oC(seg(t, a + 0.8, a + 1.2)) });
  x.restore(); finish(t); }

function flash(t, a2, d = 0.14) { const k = seg(t, a2 - d / 2, a2 + d / 2); if (k <= 0 || k >= 1) return; x.fillStyle = `rgba(255,255,255,${Math.sin(k * Math.PI) * 0.55})`; x.fillRect(0, 0, W, H); }

function serie(FN, ORDER, FLASH = []) {
  const ALL = { num: sNum, dove: sDove, fine: sFine, cta: sCta, end: sEnd2, ...FN };
  window.render = function (t) {
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none';
    let i = ORDER.length - 1; while (i > 0 && t < S(ORDER[i])) i--;
    const k = ORDER[i], a = i === 0 ? 0 : S(k), b = i + 1 < ORDER.length ? S(ORDER[i + 1]) : window.DUR;
    if (!ALL[k]) throw new Error('scena mancante: ' + k);
    ALL[k](t, a, b);
    FLASH.forEach((q) => flash(t, S(q)));
    const fi = 1 - seg(t, 0, 0.05), fo = seg(t, window.DUR - 0.3, window.DUR);
    if (fi > 0) { x.fillStyle = `rgba(0,0,0,${fi})`; x.fillRect(0, 0, W, H); }
    if (fo > 0) { x.fillStyle = `rgba(0,0,0,${fo})`; x.fillRect(0, 0, W, H); }
  };
}
