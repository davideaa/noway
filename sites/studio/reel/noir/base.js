// Aiuti comuni dello stile noir (testo, fondi, grana, oggetti). Estratti da b2.html.
// Bozza 2 — «Record oil, expensive gas». Stile noir, testo grande al centro legato all'oggetto.
// render(t) è funzione pura del tempo. Fonti dei numeri: b2-fonti.md.
// Zone sicure Instagram: contenuti tra y 14% e 76% (269–1459 px), x 5–90%.
const W = 1080, H = 1920;
const C = { bg: '#050607', ink: '#F1F4EE', muted: '#8B958F', lime: '#C8FA72', red: '#FF5A4E', amber: '#F5A524',
            light: '#E9ECE6', dark: '#0B0D0C', grey: '#59615C' };
const cv = document.getElementById('c'), x = cv.getContext('2d');
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const oC = (k) => 1 - Math.pow(1 - k, 3), ioC = (k) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const oB = (k, s = 1.7) => (k <= 0 ? 0 : 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2));
const F = (w, s, fam) => `${w} ${s}px ${fam === 'mono' ? '"IBM Plex Mono"' : 'Manrope'}`;
function txt(s, px, py, o = {}) {
  const { size = 40, weight = 800, color = C.ink, align = 'center', fam = 'Manrope', alpha = 1, blur = 0, ls = 0 } = o;
  if (alpha <= 0.002 || !s) return;
  x.save(); x.globalAlpha *= alpha; x.font = F(weight, size, fam); x.letterSpacing = ls + 'px';
  x.textAlign = align; x.textBaseline = 'middle'; x.fillStyle = color; if (blur > 0.2) x.filter = `blur(${blur}px)`;
  x.fillText(s, px, py); x.restore();
}
function tw(s, size, weight = 800, fam = 'Manrope', ls = 0) { x.save(); x.font = F(weight, size, fam); x.letterSpacing = ls + 'px'; const w = x.measureText(s).width; x.restore(); return w; }
const typed = (s, t, a, cps = 34) => s.slice(0, Math.max(0, Math.floor((t - a) * cps)));
const mono = (s, px, py, t, a, o = {}) => txt(typed(s, t, a), px, py, { fam: 'mono', size: 26, weight: 600, color: C.muted, ls: 3, ...o });

// --- frase grande: righe di parole che entrano una alla volta (sfocate → nitide, dal basso) ---
// lines: [[testo, colore], ...]; parole sfalsate di `st` secondi a partire da a
function phrase(t, a, lines, y0, o = {}) {
  let { size = 96, lh = 1.12, st = 0.13, out = null, align = 'center', x0 = 540, maxW = 960 } = o;
  const widest = Math.max(...lines.map(([s]) => tw(s, size))); if (widest > maxW) size = Math.floor(size * maxW / widest);
  let wi = 0, y = y0;
  const ko = out ? oC(seg(t, out, out + 0.25)) : 0;
  for (const [s, col] of lines) {
    const words = s.split(' '), sp = tw(' ', size);
    const tot = words.reduce((q, w) => q + tw(w, size), 0) + sp * (words.length - 1);
    let cx = align === 'center' ? x0 - tot / 2 : x0;
    for (const w of words) {
      const k = oC(seg(t, a + wi * st, a + wi * st + 0.35)), ww = tw(w, size);
      txt(w, cx + ww / 2, y + (1 - k) * 40 + ko * 60, { size, weight: 800, color: col, alpha: k * (1 - ko), blur: (1 - k) * 14 + ko * 10, ls: -2 });
      cx += ww + sp; wi++;
    }
    y += size * lh;
  }
}

const grain = (() => { const g = document.createElement('canvas'); g.width = 540; g.height = 960; const gx = g.getContext('2d');
  const id = gx.createImageData(540, 960); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  gx.putImageData(id, 0, 0); return g; })();
function bg(tint = '42,50,45', spot = 1) {
  x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(540, -150, 0, 540, -150, 1500);
  g.addColorStop(0, `rgba(${tint},${0.9 * spot})`); g.addColorStop(1, 'rgba(5,6,7,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
}
function glow(cx, cy, r, rgb, a) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
function finish(t) {
  const v = x.createRadialGradient(540, 960, 500, 540, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  const f = Math.floor(t * 60); x.save(); x.globalAlpha = 0.06; x.globalCompositeOperation = 'overlay';
  x.drawImage(grain, -(f * 37) % 540, -(f * 61) % 960, 2160, 3840); x.restore();
}
// riflesso sul pavimento: disegna fn() specchiato sotto floorY e sfuma
function reflect(floorY, fn, a = 0.16) {
  x.save(); x.globalAlpha = a; x.translate(0, floorY * 2); x.scale(1, -1); fn(); x.restore();
  const g = x.createLinearGradient(0, floorY, 0, floorY + 300); g.addColorStop(0, 'rgba(5,6,7,0.15)'); g.addColorStop(1, 'rgba(5,6,7,1)');
  x.fillStyle = g; x.fillRect(0, floorY, W, 300);
}
const rr = (a, b, w, h, r) => { x.beginPath(); x.roundRect(a, b, w, h, r); };
function metal(x0, y0, x1, y1, dark = false) {
  const g = x.createLinearGradient(x0, y0, x1, y1);
  if (dark) { g.addColorStop(0, '#2a302c'); g.addColorStop(0.45, '#151a17'); g.addColorStop(0.55, '#0e1210'); g.addColorStop(1, '#232925'); }
  else { g.addColorStop(0, '#9aa29c'); g.addColorStop(0.35, '#e8ece6'); g.addColorStop(0.6, '#6f7771'); g.addColorStop(1, '#c9cfca'); }
  return g;
}

// ================= OGGETTI =================
function barrel(cx, by, s, k, rim) { // by = base; s scala
  x.save(); x.translate(cx, by); x.scale(s, s);
  const w = 300, h = 400;
  x.fillStyle = metal(-w / 2, 0, w / 2, 0, true); rr(-w / 2, -h, w, h, 26); x.fill();
  // anelli
  for (const yy of [-h + 40, -h / 2, -40]) { x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(-w / 2, yy - 8, w, 16); x.strokeStyle = `rgba(${rim},0.55)`; x.lineWidth = 2; x.beginPath(); x.moveTo(-w / 2 + 10, yy - 8); x.lineTo(w / 2 - 10, yy - 8); x.stroke(); }
  // tappo ellisse
  x.fillStyle = '#1c221e'; x.beginPath(); x.ellipse(0, -h, w / 2 - 4, 34, 0, 0, Math.PI * 2); x.fill();
  x.strokeStyle = `rgba(${rim},0.9)`; x.lineWidth = 3; x.beginPath(); x.ellipse(0, -h, w / 2 - 4, 34, 0, Math.PI, Math.PI * 2); x.stroke();
  x.fillStyle = '#0c0f0d'; x.beginPath(); x.ellipse(70, -h, 22, 8, 0, 0, Math.PI * 2); x.fill();
  // filo di luce laterale
  x.fillStyle = `rgba(${rim},0.35)`; x.fillRect(-w / 2 + 6, -h + 30, 5, h - 60);
  x.restore();
}
function pump(cx, by, s, val, kOn) {
  x.save(); x.translate(cx, by); x.scale(s, s);
  // corpo
  x.fillStyle = metal(-170, 0, 170, 0, true); rr(-170, -560, 340, 560, 30); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = 2; rr(-170, -560, 340, 560, 30); x.stroke();
  // schermo
  x.fillStyle = '#020302'; rr(-130, -500, 260, 150, 14); x.fill();
  x.strokeStyle = 'rgba(245,165,36,0.35)'; x.lineWidth = 2; rr(-130, -500, 260, 150, 14); x.stroke();
  txt(val.toFixed(2), 0, -425, { size: 92, weight: 800, color: C.amber, alpha: kOn, ls: 2 });
  txt('$ / GALLON', 0, -372, { fam: 'mono', size: 18, weight: 600, color: 'rgba(245,165,36,0.7)', alpha: kOn, ls: 3 });
  // tasti
  for (let i = 0; i < 3; i++) { x.fillStyle = '#1b201d'; rr(-110 + i * 80, -320, 60, 40, 8); x.fill(); }
  // pistola e tubo
  x.strokeStyle = '#141815'; x.lineWidth = 16; x.lineCap = 'round'; x.beginPath(); x.moveTo(170, -380); x.bezierCurveTo(260, -380, 250, -120, 200, -140); x.stroke();
  x.fillStyle = '#20261f'; rr(160, -260, 50, 120, 10); x.fill();
  x.restore();
}
function gallon(cx, by, layers, k) { // vaso di vetro con strati [altezza(0-1), colore, etichetta, kStrato]
  const w = 320, h = 560, x0 = cx - w / 2, y0 = by - h;
  x.save(); x.globalAlpha = k;
  let acc = 0;
  for (const [hh, col, , kk] of layers) {
    const th = hh * h * oC(kk); if (th <= 0.5) { acc += 0; continue; }
    x.fillStyle = col; x.fillRect(x0 + 8, by - 8 - acc - th, w - 16, th);
    x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(x0 + 8, by - 8 - acc - th, w - 16, 3);
    acc += th;
  }
  // vetro
  const g = x.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.2, 'rgba(255,255,255,0.02)'); g.addColorStop(0.85, 'rgba(255,255,255,0.03)'); g.addColorStop(1, 'rgba(255,255,255,0.12)');
  x.fillStyle = g; rr(x0, y0, w, h, 28); x.fill();
  x.strokeStyle = 'rgba(241,244,238,0.55)'; x.lineWidth = 3; rr(x0, y0, w, h, 28); x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(x0 + 22, y0 + 40, 8, h - 80);
  x.restore();
}
function refinery(cx, by, s, k, lit = 1, col = '200,250,114') {
  x.save(); x.translate(cx, by); x.scale(s, s); x.globalAlpha *= k;
  const body = (fx) => { x.fillStyle = metal(-300, 0, 300, 0, true); fx(); x.fill(); };
  // torri
  [[-210, 110, 360], [-60, 80, 470], [70, 70, 300], [190, 100, 420]].forEach(([tx, tw2, th]) => {
    body(() => rr(tx - tw2 / 2, -th, tw2, th, 10));
    x.strokeStyle = `rgba(${col},${0.6 * lit})`; x.lineWidth = 2.5; x.beginPath(); x.moveTo(tx - tw2 / 2, -th + 10); x.lineTo(tx - tw2 / 2, -10); x.stroke();
    for (let yy = -th + 40; yy < -20; yy += 60) { x.fillStyle = `rgba(${col},${0.25 * lit})`; x.fillRect(tx - tw2 / 2 + 6, yy, tw2 - 12, 3); }
  });
  // serbatoi
  [-260, 260].forEach((tx) => { body(() => { x.beginPath(); x.ellipse(tx, -70, 60, 70, 0, 0, Math.PI * 2); }); });
  // ciminiera con fiamma
  body(() => rr(-10, -560, 28, 560, 6));
  const fl = 0.8 + 0.2 * Math.sin(by * 0.01 + cx);
  if (lit > 0.05) { glow(4, -580, 70, col, 0.55 * lit); x.fillStyle = `rgba(${col},${0.9 * lit})`; x.beginPath(); x.ellipse(4, -585, 10 * fl, 26 * fl, 0, 0, Math.PI * 2); x.fill(); }
  x.restore();
}
function sack(cx, by, s, k, label = 'CRUDE') {
  x.save(); x.translate(cx, by); x.scale(s, s); x.globalAlpha *= k;
  const g = x.createLinearGradient(-120, 0, 120, 0); g.addColorStop(0, '#d8d3c4'); g.addColorStop(0.5, '#f4f0e4'); g.addColorStop(1, '#b9b3a3');
  x.fillStyle = g; x.beginPath(); x.moveTo(-100, -300); x.quadraticCurveTo(0, -270, 100, -300); x.lineTo(130, -20); x.quadraticCurveTo(0, 10, -130, -20); x.closePath(); x.fill();
  x.fillStyle = '#c9c3b2'; x.beginPath(); x.moveTo(-100, -300); x.quadraticCurveTo(-60, -345, 0, -330); x.quadraticCurveTo(60, -345, 100, -300); x.quadraticCurveTo(0, -270, -100, -300); x.fill();
  txt(label, 0, -150, { fam: 'mono', size: 34, weight: 600, color: '#3a3528', ls: 6 });
  x.restore();
}
function loaf(cx, by, s, k, label = 'GASOLINE') {
  x.save(); x.translate(cx, by); x.scale(s, s); x.globalAlpha *= k;
  const g = x.createLinearGradient(0, -230, 0, 0); g.addColorStop(0, '#e6a85a'); g.addColorStop(1, '#8a5524');
  x.fillStyle = g; x.beginPath(); x.moveTo(-170, 0); x.bezierCurveTo(-190, -220, 190, -220, 170, 0); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,230,190,0.6)'; x.lineWidth = 6; x.lineCap = 'round';
  for (const dx of [-80, 0, 80]) { x.beginPath(); x.moveTo(dx - 30, -120); x.lineTo(dx + 30, -160); x.stroke(); }
  txt(label, 0, -60, { fam: 'mono', size: 30, weight: 600, color: '#2b1806', ls: 5 });
  x.restore();
}
function gauge(cx, cy, r, v, k) { // v 0..100
  x.save(); x.globalAlpha *= k;
  const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
  x.lineCap = 'round'; x.lineWidth = 34; x.strokeStyle = '#161b18'; x.beginPath(); x.arc(cx, cy, r, a0, a1); x.stroke();
  const av = lerp(a0, a1, v / 100);
  const g = x.createLinearGradient(cx - r, 0, cx + r, 0); g.addColorStop(0, '#C8FA72'); g.addColorStop(0.7, '#F5A524'); g.addColorStop(1, '#FF5A4E');
  x.strokeStyle = g; x.beginPath(); x.arc(cx, cy, r, a0, av); x.stroke();
  for (let i = 0; i <= 10; i++) { const a = lerp(a0, a1, i / 10); x.strokeStyle = 'rgba(241,244,238,0.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx + Math.cos(a) * (r - 40), cy + Math.sin(a) * (r - 40)); x.lineTo(cx + Math.cos(a) * (r - 58), cy + Math.sin(a) * (r - 58)); x.stroke(); }
  x.strokeStyle = C.ink; x.lineWidth = 8; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(av) * (r - 70), cy + Math.sin(av) * (r - 70)); x.stroke();
  x.fillStyle = C.ink; x.beginPath(); x.arc(cx, cy, 16, 0, Math.PI * 2); x.fill();
  x.restore();
}
function truck(cx, by, s, k) { x.save(); x.translate(cx, by); x.scale(s, s); x.globalAlpha *= k; x.fillStyle = metal(-150, 0, 150, 0, true);
  rr(-150, -170, 200, 130, 10); x.fill(); rr(55, -130, 95, 90, 12); x.fill(); x.fillStyle = 'rgba(200,250,114,0.5)'; rr(95, -120, 40, 35, 6); x.fill();
  for (const wx of [-100, -30, 100]) { x.fillStyle = '#0a0c0b'; x.beginPath(); x.arc(wx, -30, 28, 0, 7); x.fill(); x.strokeStyle = '#3a423d'; x.lineWidth = 6; x.stroke(); }
  x.restore(); }
function train(cx, by, s, k) { x.save(); x.translate(cx, by); x.scale(s, s); x.globalAlpha *= k; x.fillStyle = metal(-150, 0, 150, 0, true);
  rr(-150, -190, 300, 150, 16); x.fill(); x.fillStyle = 'rgba(200,250,114,0.45)'; for (const wx of [-110, -40, 30]) { rr(wx, -165, 50, 40, 6); x.fill(); }
  x.fillStyle = 'rgba(245,165,36,0.8)'; x.beginPath(); x.arc(125, -80, 10, 0, 7); x.fill();
  for (const wx of [-100, -40, 40, 100]) { x.fillStyle = '#0a0c0b'; x.beginPath(); x.arc(wx, -30, 22, 0, 7); x.fill(); }
  x.restore(); }
function tractor(cx, by, s, k) { x.save(); x.translate(cx, by); x.scale(s, s); x.globalAlpha *= k; x.fillStyle = metal(-150, 0, 150, 0, true);
  rr(-90, -150, 170, 80, 10); x.fill(); rr(-40, -230, 90, 90, 10); x.fill(); x.fillStyle = 'rgba(200,250,114,0.45)'; rr(-25, -215, 60, 45, 6); x.fill();
  x.fillStyle = '#0a0c0b'; x.beginPath(); x.arc(-70, -60, 62, 0, 7); x.fill(); x.strokeStyle = '#3a423d'; x.lineWidth = 8; x.stroke();
  x.beginPath(); x.arc(80, -40, 38, 0, 7); x.fillStyle = '#0a0c0b'; x.fill(); x.stroke();
  x.restore(); }
function pill(cx, cy, label, k, col = C.ink, fill = 'rgba(255,255,255,0.04)', size = 44) {
  const w = tw(label, size, 700) + 80; x.save(); x.translate(cx, cy); const s = lerp(0.8, 1, oB(k)); x.scale(s, s); x.globalAlpha *= clamp(k * 2);
  rr(-w / 2, -46, w, 92, 46); x.fillStyle = fill; x.fill(); x.strokeStyle = col; x.lineWidth = 3; x.stroke();
  txt(label, 0, 2, { size, weight: 700, color: col }); x.restore(); return w;
}
function cross(cx, cy, r, k) { if (k <= 0) return; x.save(); x.strokeStyle = C.red; x.lineWidth = 14; x.lineCap = 'round'; x.globalAlpha = clamp(k * 3);
  const a = oC(clamp(k * 2)), b = oC(clamp(k * 2 - 1)); x.beginPath(); x.moveTo(cx - r, cy - r); x.lineTo(cx - r + 2 * r * a, cy - r + 2 * r * a); x.stroke();
  if (b > 0) { x.beginPath(); x.moveTo(cx + r, cy - r); x.lineTo(cx + r - 2 * r * b, cy - r + 2 * r * b); x.stroke(); } x.restore(); }

