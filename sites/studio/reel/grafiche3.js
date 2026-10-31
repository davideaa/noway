// Reel 2, versione 2: dentro/fuori campione, discese, wormhole
const BPM3 = 0.5455;
const fmtR = (v, d = 2) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d).replace('.', ',');


// segno a pennarello che si disegna (p da 0 a 1)
function marker(x, pts, p, col, w = 6) {
  if (p <= 0) return; let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let left = L * Math.min(1, p); x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = col; x.shadowBlur = 10; x.beginPath(); x.moveTo(...pts[0]);
  for (let i = 1; i < pts.length && left > 0; i++) { const f = Math.min(1, left / seg[i - 1]); x.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f); left -= seg[i - 1]; }
  x.stroke(); x.shadowBlur = 0;
}
const wobble = (cx, cy, rx, ry, seed = 1) => { const P = []; for (let k = 0; k <= 60; k++) { const a = -2.2 + k / 60 * 6.283 * 1.08; const j = 1 + 0.05 * Math.sin(k * 0.9 + seed); P.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]); } return P; };

// pannello in stile sito: curva in R di una strategia, prima dentro poi fuori campione
G.isoos = (age, s) => {
  const el = bx('g3_iso'); const x = cv(el); x.clearRect(0, 0, 1080, 1920);
  const D = window.D3[s.k], col = s.col, tap = s.tapA || 2 * BPM3, on = age >= tap;
  x.textAlign = 'left'; x.font = sans(104); x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 30; x.fillText(s.name, 70, 330); x.shadowBlur = 0;
  x.font = mono(28, 500); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText(s.sub, 74, 385);
  // pillole del periodo
  [['TUTTO', 70, 180], ['DENTRO CAMPIONE', 250, 372], ['FUORI CAMPIONE', 622, 388]].forEach(([t, px, w], i) => {
    const act = on ? i === 2 : i === 1; x.fillStyle = act ? L2 : 'rgba(255,255,255,.05)'; x.strokeStyle = act ? L2 : 'rgba(255,255,255,.18)'; x.lineWidth = 2;
    x.beginPath(); x.roundRect(px, 430, w - 12, 78, 39); x.fill(); x.stroke();
    x.font = mono(26, 700); x.textAlign = 'center'; x.fillStyle = act ? '#0c1a04' : 'rgba(255,255,255,.7)'; x.fillText(t, px + (w - 12) / 2, 479); });
  // grafico
  const X0 = 70, X1 = 1010, Y0 = 560, Y1 = 1060; x.fillStyle = 'rgba(12,16,18,.92)'; x.strokeStyle = 'rgba(255,255,255,.1)'; x.lineWidth = 2; x.beginPath(); x.roundRect(X0, Y0, X1 - X0, Y1 - Y0 + 40, 26); x.fill(); x.stroke();
  const c = D.c, I = D.i, lo = Math.min(0, ...c) - 8, hi = Math.max(...c) + 12;
  const px = (j) => X0 + 30 + (I[j] / (D.n - 1)) * (X1 - X0 - 60), py = (v) => Y1 - 10 - (v - lo) / (hi - lo) * (Y1 - Y0 - 60);
  const cutJ = I.findIndex(v => v >= D.cut), cx = px(cutJ);
  x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 1; for (let v = 0; v <= hi; v += 50) { x.beginPath(); x.moveTo(X0 + 20, py(v)); x.lineTo(X1 - 20, py(v)); x.stroke(); x.font = mono(22, 500); x.fillStyle = 'rgba(255,255,255,.4)'; x.textAlign = 'left'; x.fillText((v ? '+' : '') + v + ' R', X0 + 24, py(v) - 8); }
  if (on) { const f = e3((age - tap) / 0.3); x.fillStyle = col; x.globalAlpha = 0.1 * f; x.fillRect(cx, Y0 + 20, X1 - 30 - cx, Y1 - Y0 - 10); x.globalAlpha = 1; }
  x.setLineDash([10, 10]); x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx, Y0 + 20); x.lineTo(cx, Y1 + 10); x.stroke(); x.setLineDash([]);
  x.font = mono(24, 600); x.textAlign = 'left'; x.fillStyle = on ? col : 'rgba(255,255,255,.6)'; x.fillText('FUORI CAMPIONE ▸', cx + 12, Y0 + 50); x.fillStyle = 'rgba(255,255,255,.5)'; x.fillText('dal ' + s.dal, cx + 12, Y0 + 82);
  const pI = e3((age - 0.05) / (tap - 0.15)), pO = e3((age - tap - 0.05) / 0.6);
  const nI = Math.max(1, Math.floor(pI * cutJ)), nO = cutJ + Math.floor(pO * (c.length - 1 - cutJ));
  const line = (a, b, color, w, glow) => { x.strokeStyle = color; x.lineWidth = w; x.lineJoin = 'round'; if (glow) { x.shadowColor = color; x.shadowBlur = glow; } x.beginPath(); for (let j = a; j <= b; j++) { j === a ? x.moveTo(px(j), py(c[j])) : x.lineTo(px(j), py(c[j])); } x.stroke(); x.shadowBlur = 0; };
  line(0, nI, on ? 'rgba(255,255,255,.4)' : col, 5, on ? 0 : 16);
  if (on && nO > cutJ) line(cutJ, nO, col, 7, 24);
  // mirino con valore
  const hj = on ? nO : nI; const hx = px(hj), hy = py(c[hj]);
  if (!(on && pO >= 1) && pI > 0) { x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(hx, Y0 + 20); x.lineTo(hx, Y1 + 10); x.stroke();
    x.fillStyle = '#fff'; x.shadowColor = col; x.shadowBlur = 20; x.beginPath(); x.arc(hx, hy, 11, 0, 7); x.fill(); x.shadowBlur = 0;
    const lab = 'op. ' + (I[hj] + 1).toLocaleString('it-IT') + '  ' + fmtR(c[hj], 0) + ' R'; x.font = mono(26, 700); const w = x.measureText(lab).width + 36; const bx_ = Math.min(X1 - 20 - w, Math.max(X0 + 20, hx - w / 2)), by = Math.max(Y0 + 100, hy - 90);
    x.fillStyle = 'rgba(8,10,11,.95)'; x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.roundRect(bx_, by, w, 54, 14); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.textAlign = 'left'; x.fillText(lab, bx_ + 18, by + 37); }
  if (on) { const m = (age - tap - 0.55) / 0.35; const tj = Math.round(cutJ + (c.length - 1 - cutJ) * 0.45), tx = px(tj), ty = py(c[tj]);
    x.globalAlpha = c3(m / 0.4, 0, 1); x.font = sans(34, 700); x.fillStyle = W2; x.textAlign = 'left'; x.fillText('dati mai usati', X0 + 50, Y0 + 90); x.fillText('per ottimizzare', X0 + 50, Y0 + 130); x.globalAlpha = 1;
    marker(x, [[X0 + 310, Y0 + 115], [(X0 + 310 + tx) / 2, Y0 + 70], [tx - 10, ty - 30]], (m - 0.25) / 0.75, W2, 4);
    if (m > 1) marker(x, [[tx - 34, ty - 44], [tx - 10, ty - 30], [tx - 38, ty - 18]], (m - 1) / 0.25, W2, 4); }
  // le due schede dei numeri
  [['DENTRO CAMPIONE', D.IS, 0], ['FUORI CAMPIONE', D.OOS, 1]].forEach(([k, st, i]) => {
    const X = 70 + i * 480, act = on ? i === 1 : i === 0, show = i === 0 ? e3((age - 0.3) / 0.4) : e3((age - tap - 0.25) / 0.45);
    x.fillStyle = 'rgba(14,18,20,.95)'; x.strokeStyle = act ? col : 'rgba(255,255,255,.12)'; x.lineWidth = act ? 3 : 2; if (act) { x.shadowColor = col; x.shadowBlur = 30; }
    x.beginPath(); x.roundRect(X, 1140, 460, 260, 28); x.fill(); x.stroke(); x.shadowBlur = 0;
    x.textAlign = 'left'; x.font = mono(24, 600); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText(k, X + 34, 1192);
    x.font = sans(96); x.fillStyle = i === 1 && on ? col : W2; x.fillText(show > 0 ? fmtR(st.R_per_op * show) + ' R' : '—', X + 30, 1300);
    x.font = mono(24, 500); x.fillStyle = 'rgba(255,255,255,.6)'; x.fillText('medio a operazione · ' + st.n + ' op.', X + 34, 1360); });
};

// il confronto delle tre: resa media a operazione, dentro contro fuori
G.isoos3 = (age, s) => {
  const el = bx('g3_iso3'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const D = window.D3;
  x.textAlign = 'center'; x.font = sans(92); x.fillStyle = W2; x.fillText('Dentro vs fuori', 540, 320); x.fillStyle = L2; x.fillText('campione.', 540, 420);
  const rows = [['oro', 'XAUUSD', GD], ['nasdaq', 'NASDAQ', BL], ['usdjpy', 'USDJPY', PU]]; const sc = 620 / 0.26;
  rows.forEach(([k, n, c], i) => { const y = 560 + i * 250, a = age - i * BPM3 * 0.5; if (a < 0) return; const p1 = e3(a / 0.35), p2 = e3((a - 0.25) / 0.4);
    x.globalAlpha = e3(a / 0.15); x.textAlign = 'left'; x.font = sans(52); x.fillStyle = c; x.fillText(n, 90, y);
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(90, y + 30, D[k].IS.R_per_op * sc * p1, 50); x.fillStyle = c; x.shadowColor = c; x.shadowBlur = 20; x.fillRect(90, y + 95, D[k].OOS.R_per_op * sc * p2, 50); x.shadowBlur = 0;
    x.font = mono(26, 700); x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText('DENTRO ' + fmtR(D[k].IS.R_per_op * p1) + ' R', 110 + D[k].IS.R_per_op * sc * p1, y + 64);
    x.fillStyle = c; x.fillText('FUORI ' + fmtR(D[k].OOS.R_per_op * p2) + ' R', 110 + D[k].OOS.R_per_op * sc * p2, y + 129); x.globalAlpha = 1; });
  const f = e3((age - 3 * BPM3 * 0.5 - 0.5) / 0.35); x.globalAlpha = f; x.textAlign = 'center'; x.font = sans(48); x.fillStyle = W2; x.fillText('Oro e Nasdaq migliorano.', 540, 1360);
  x.fillStyle = R2; x.fillText('USDJPY rende meno della metà.', 540, 1425); x.globalAlpha = 1;
  marker(x, [[210, 1448], [540, 1442], [870, 1450]], (age - 3 * BPM3 * 0.5 - 0.85) / 0.3, R2, 5);
  marker(x, wobble(470, 1120, 400, 95, 2), (age - 3 * BPM3 * 0.5 - 1.1) / 0.4, R2, 5);
};

// il portafoglio sott'acqua: tutte le discese del backtest
G.under = (age, s) => {
  const el = bx('g3_under'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const H = window.STORIA, dd = H.dd, M = H.mesi, N = dd.length;
  x.textAlign = 'center'; x.font = sans(92); x.fillStyle = W2; x.fillText('Le discese ci sono.', 540, 320); x.fillStyle = L2; x.fillText('Te le mostriamo tutte.', 540, 420);
  const X0 = 80, X1 = 1000, Y0 = 640, Y1 = 1240, px = (i) => X0 + i / (N - 1) * (X1 - X0), py = (v) => Y0 + (-v / 0.3) * (Y1 - Y0);
  x.strokeStyle = 'rgba(255,255,255,.1)'; x.lineWidth = 1; x.font = mono(24, 500); x.fillStyle = 'rgba(255,255,255,.45)'; x.textAlign = 'right';
  for (let v = 0; v <= 0.3; v += 0.1) { x.beginPath(); x.moveTo(X0, py(-v)); x.lineTo(X1, py(-v)); x.stroke(); x.fillText(v ? '−' + Math.round(v * 100) + '%' : '0%', X0 - 8 + 70, py(-v) - 8); }
  let y0 = -1; x.textAlign = 'center'; for (let i = 0; i < N; i++) { const yy = +M[i].slice(0, 4); if (yy !== y0 && M[i].endsWith('01')) { y0 = yy; x.fillText(String(yy), px(i), Y1 + 50); } }
  const u = e3((age - 0.05) / 1.3), n = Math.max(2, Math.floor(u * N)); let mi = 0; for (let i = 0; i < n; i++) if (dd[i] < dd[mi]) mi = i;
  x.fillStyle = 'rgba(255,90,78,.22)'; x.beginPath(); x.moveTo(px(0), py(0)); for (let i = 0; i < n; i++) x.lineTo(px(i), py(dd[i])); x.lineTo(px(n - 1), py(0)); x.fill();
  x.strokeStyle = R2; x.lineWidth = 4; x.shadowColor = R2; x.shadowBlur = 16; x.beginPath(); for (let i = 0; i < n; i++) i ? x.lineTo(px(i), py(dd[i])) : x.moveTo(px(i), py(dd[i])); x.stroke(); x.shadowBlur = 0;
  x.fillStyle = '#fff'; x.beginPath(); x.arc(px(n - 1), py(dd[n - 1]), 9, 0, 7); x.fill();
  const f = e3((age - 1.4) / 0.3); if (f > 0) { const mx = px(mi), my = py(dd[mi]); x.globalAlpha = f; marker(x, wobble(mx, my, 60, 46, 3), f * 1.2, '#fff', 4);
    x.font = sans(70); x.fillStyle = R2; x.textAlign = 'center'; x.textAlign = 'left'; x.fillText('−' + (-H.ddmin * 100).toFixed(1).replace('.', ',') + '%', mx + 80, my + 24); x.globalAlpha = 1; }
  x.font = mono(26, 500); x.fillStyle = 'rgba(255,255,255,.6)'; x.textAlign = 'center'; x.fillText('PORTAFOGLIO · 1% DI RISCHIO A OPERAZIONE · BACKTEST', 540, 1400);
};

// il wormhole dentro l'ologramma
G.worm = (age, s, dur) => {
  const el = bx('g3_worm'); const x = cv(el); x.fillStyle = '#020403'; x.fillRect(0, 0, 1080, 1920);
  const sp = 1 + 5 * age * age, trav = age * 3 + age * age * age * 6;
  const path = (z) => [540 + Math.sin(z * 0.35 + 1) * 160 * Math.min(1, z / 6), 960 + Math.cos(z * 0.28) * 200 * Math.min(1, z / 6)];
  for (let k = 40; k >= 0; k--) { const zr = k * 0.5 - (trav % 0.5); if (zr <= 0.05) continue; const [cx, cy] = path(zr + trav); const R = 520 / zr; const a = Math.min(1, 1.6 / zr) * Math.min(1, (20 - zr) / 6);
    if (a <= 0) continue; x.strokeStyle = `rgba(200,250,114,${(a * 0.8).toFixed(3)})`; x.lineWidth = Math.max(1, 5 / zr); x.beginPath(); x.ellipse(cx, cy, R, R * 1.08, 0, 0, 7); x.stroke();
    const nd = 24; x.fillStyle = `rgba(230,255,190,${a.toFixed(3)})`; for (let d = 0; d < nd; d++) { const an = d / nd * 6.283 + zr * 0.4 + age * 1.5; x.fillRect(cx + Math.cos(an) * R - 3, cy + Math.sin(an) * R * 1.08 - 3, 6, 6); } }
  for (let i = 0; i < 90; i++) { const an = hash(i) * 6.283, r0 = ((hash(i + 7) * 900 + age * 1400 * sp) % 1100) + 40; const L = 30 + 90 * sp;
    x.strokeStyle = `rgba(220,255,170,${Math.min(0.8, r0 / 900).toFixed(2)})`; x.lineWidth = 2.5; x.beginPath(); x.moveTo(540 + Math.cos(an) * r0, 960 + Math.sin(an) * r0); x.lineTo(540 + Math.cos(an) * (r0 + L), 960 + Math.sin(an) * (r0 + L)); x.stroke(); }
  const g = x.createRadialGradient(540, 960, 0, 540, 960, 300); g.addColorStop(0, `rgba(240,255,210,${(0.35 + 0.65 * Math.pow(age / dur, 3)).toFixed(3)})`); g.addColorStop(1, 'rgba(200,250,114,0)'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
  const w = Math.pow(c3((age - dur + 0.2) / 0.2, 0, 1), 2); if (w > 0) { x.fillStyle = `rgba(246,255,228,${w.toFixed(3)})`; x.fillRect(0, 0, 1080, 1920); }
};
