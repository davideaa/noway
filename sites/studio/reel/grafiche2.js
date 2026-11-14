// Reel 2 (MONTAGEM ALQUIMIA): animazioni nuove, dati veri
const L2 = '#c8fa72', R2 = '#ff5a4e', W2 = '#f3f6ef', GD = '#e8b04a', BL = '#5b9dff', PU = '#a78bfa';
const e3 = (u) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);
const c3 = (x, a, b) => Math.max(a, Math.min(b, x));
const hash = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const GL3 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%·.-';
function bx(id) { let el = document.getElementById(id); if (!el) { el = document.createElement('div'); el.id = id; el.className = 'gx'; document.getElementById('stage').appendChild(el); } el.style.display = 'block'; return el; }
function cv(el, w = 1080, h = 1920) { let c = el.querySelector('canvas'); if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; c.style.cssText = 'position:absolute;left:0;top:0;width:' + w + 'px;height:' + h + 'px'; el.appendChild(c); } return c.getContext('2d'); }
const mono = (px, w = 600) => `${w} ${px}px 'IBM Plex Mono', monospace`;
const sans = (px, w = 800) => `${w} ${px}px Manrope, sans-serif`;

// tabellone a palette (split-flap)
function flapRows(x, rows, age, y0, size, gap, stagger = 0.035) {
  const cw = size * 0.78, ch = size * 1.28;
  rows.forEach((r, ri) => {
    const txt = r.t, col = r.c || W2, n = txt.length, x0 = 540 - (n * (cw + 6)) / 2, y = y0 + ri * (ch + gap);
    for (let i = 0; i < n; i++) {
      const X = x0 + i * (cw + 6), stop = (r.d || 0) + 0.12 + i * stagger + ri * 0.05;
      let ch_ = txt[i];
      const flipping = age < stop;
      if (flipping) ch_ = GL3[Math.floor(hash(i * 31 + ri * 7 + Math.floor(age * 28)) * GL3.length)];
      x.fillStyle = '#101416'; x.fillRect(X, y, cw, ch);
      x.fillStyle = '#1a2024'; x.fillRect(X, y, cw, ch / 2 - 1);
      x.fillStyle = '#000'; x.fillRect(X, y + ch / 2 - 1, cw, 3);
      if (txt[i] !== ' ' || flipping) {
        x.fillStyle = flipping ? 'rgba(243,246,239,.55)' : col; x.font = mono(size, 700); x.textAlign = 'center'; x.textBaseline = 'middle';
        x.save(); if (flipping) { x.translate(X + cw / 2, y + ch / 2); x.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(age * 40 + i))); x.fillText(ch_, 0, 4); } else { if (col !== W2) { x.shadowColor = col; x.shadowBlur = 18; } x.fillText(ch_, X + cw / 2, y + ch / 2 + 4); } x.restore();
      }
    }
  });
}
G.flap = (age, s) => { const el = bx('g2_flap'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); flapRows(x, s.rows, age, s.y || 760, s.size || 84, 26); };

// terminale quant
G.term = (age, s) => {
  const el = bx('g2_term'); const x = cv(el); x.clearRect(0, 0, 1080, 1920);
  x.fillStyle = 'rgba(10,14,12,.94)'; x.strokeStyle = 'rgba(200,250,114,.4)'; x.lineWidth = 2;
  const X = 60, Y = 520, Wd = 960, H = 820; x.beginPath(); x.roundRect(X, Y, Wd, H, 30); x.fill(); x.stroke();
  [['#ff5f57', 0], ['#febc2e', 1], ['#28c840', 2]].forEach(([c, i]) => { x.fillStyle = c; x.beginPath(); x.arc(X + 44 + i * 36, Y + 42, 11, 0, 7); x.fill(); });
  x.font = mono(26, 500); x.fillStyle = 'rgba(255,255,255,.45)'; x.fillText('pam — quant', X + 170, Y + 50);
  let tt = 0.15, y = Y + 140; x.font = mono(34, 600);
  for (const [txt, ok] of s.lines) {
    const n = c3(Math.floor((age - tt) / 0.022), 0, txt.length); const shown = txt.slice(0, n);
    x.fillStyle = L2; x.fillText('>', X + 44, y); x.fillStyle = W2; x.fillText(shown, X + 84, y);
    const done = age > tt + txt.length * 0.022;
    if (ok && done) { x.fillStyle = L2; x.shadowColor = L2; x.shadowBlur = 14; x.fillText(ok, X + Wd - 44 - x.measureText(ok).width, y); x.shadowBlur = 0; }
    if (!done) { if (Math.floor(age * 6) % 2 === 0) { x.fillStyle = L2; x.fillRect(X + 84 + x.measureText(shown).width + 6, y - 30, 18, 36); } break; }
    tt += txt.length * 0.022 + 0.12; y += 96;
  }
};

// logo che sbatte con separazione colori
G.slam = (age, s) => {
  const el = bx('g2_slam');
  if (!el.dataset.ok) { el.innerHTML = `<img class="sl r" src="logo-grande.webp"><img class="sl c" src="logo-grande.webp"><img class="sl w" src="logo-grande.webp"><div class="sln">PORTFOLIO</div><div class="sls">ALGO MANAGER</div>`; el.dataset.ok = 1; }
  const p = Math.exp(-age / 0.12), sc = 1 + 0.35 * p + 0.03 * Math.sin(age * 9);
  const off = 26 * p + 4 * Math.abs(Math.sin(age * 23));
  el.querySelector('.r').style.transform = `translate(${-off}px,0) scale(${sc})`; el.querySelector('.c').style.transform = `translate(${off}px,0) scale(${sc})`; el.querySelector('.w').style.transform = `scale(${sc})`;
  const q = e3((age - 0.1) / 0.3); el.querySelector('.sln').style.opacity = q; el.querySelector('.sls').style.opacity = e3((age - 0.25) / 0.3);
  el.querySelector('.sln').style.letterSpacing = (0.3 - 0.22 * q) + 'em';
};

// candele 3D (portafoglio, 1% per operazione, 93 mesi veri)
G.candles = (age, s, dur) => {
  const el = bx('g2_cd'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const C = window.D2.candele;
  const u = e3(age / (dur * 0.92)); const k = u * C.length; const lo = Math.log(Math.min(...C.map(c => c[2]))), hi = Math.log(Math.max(...C.map(c => c[1])));
  const Y = (v) => 1440 - (Math.log(v) - lo) / (hi - lo) * 800; const step = 34, camX = Math.max(0, k * step - 700);
  x.save(); x.translate(-camX + 120, 0);
  for (let i = 0; i < Math.min(C.length, Math.ceil(k)); i++) {
    const [o, h, l, c] = C[i]; const X = i * step, up = c >= o, col = up ? L2 : R2; const a = c3(k - i, 0, 1);
    x.globalAlpha = a; x.strokeStyle = col; x.lineWidth = 3; x.beginPath(); x.moveTo(X + 11, Y(h)); x.lineTo(X + 11, Y(l)); x.stroke();
    x.fillStyle = col; const y1 = Y(Math.max(o, c)), y2 = Y(Math.min(o, c)); x.shadowColor = col; x.shadowBlur = i > k - 3 ? 20 : 0; x.fillRect(X, y1, 22, Math.max(3, (y2 - y1) * a)); x.shadowBlur = 0;
  }
  x.restore(); x.globalAlpha = 1;
  const i = Math.min(C.length - 1, Math.floor(k)); const m = window.D2.mesi[i] || '';
  x.font = mono(34, 600); x.fillStyle = 'rgba(255,255,255,.6)'; x.textAlign = 'left'; x.fillText('PORTAFOGLIO · MESE PER MESE', 70, 420);
  x.font = sans(120); x.fillStyle = W2; x.fillText(m.replace('-', ' · '), 70, 540);
};

// contachilometri
function odo(x, str, cx, cy, size, age, col, t0 = 0) {
  x.font = sans(size); x.textAlign = 'center'; x.textBaseline = 'middle'; const w = size * 0.62; const n = str.length; const x0 = cx - (n * w) / 2 + w / 2;
  x.save(); x.beginPath(); x.rect(0, cy - size * 0.62, 1080, size * 1.24); x.clip();
  for (let i = 0; i < n; i++) {
    const ch = str[i]; const X = x0 + i * w; x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 30;
    if (!/[0-9]/.test(ch)) { x.globalAlpha = e3((age - t0) / 0.3); x.fillText(ch, X, cy); x.globalAlpha = 1; continue; }
    const stop = t0 + 0.25 + (n - 1 - i) * 0.09; const d = +ch; const turns = 2 + (n - i);
    const p = e3((age - t0) / (stop - t0)); const pos = (turns * 10 + d) * p; const f = pos - Math.floor(pos);
    for (let j = -1; j <= 1; j++) { const dig = ((Math.floor(pos) + j) % 10 + 10) % 10; x.fillText(String(dig), X, cy + (j - f) * size * 1.1); }
  }
  x.restore(); x.shadowBlur = 0;
}
G.odo = (age, s) => { const el = bx('g2_odo'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); odo(x, s.v, 540, 900, s.size || 300, age, L2); x.font = sans(84); x.fillStyle = W2; x.textAlign = 'center'; x.globalAlpha = e3((age - 0.3) / 0.3); x.fillText(s.label, 540, 1140); x.font = mono(30, 500); x.fillStyle = 'rgba(255,255,255,.6)'; x.fillText(s.sub || '', 540, 1230); x.globalAlpha = 1; };

// citta' 3D dei mesi (somma in R del portafoglio), 6 mesi con tutte e tre in perdita evidenziati
G.city = (age, s, dur) => {
  const el = bx('g2_city'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const V = window.D2.mesiR, NEG = window.EXTRA.neg;
  const ang = -0.75 + age * 0.12, ca = Math.cos(ang), sa = Math.sin(ang), cell = 60;
  const P = (gx, gy, z) => { const X = gx * ca - gy * sa, Yd = gx * sa + gy * ca; return [540 + X * 1.0, 930 + Yd * 0.5 - z]; };
  const items = V.map((v, i) => ({ v, i, gx: (i % 12 - 5.5) * cell, gy: (Math.floor(i / 12) - 3.5) * cell }));
  items.sort((a, b) => (a.gx * sa + a.gy * ca) - (b.gx * sa + b.gy * ca));
  let negSeen = 0;
  for (const it of items) {
    const grow = e3((age - 0.1 - it.i * 0.008) / 0.5); const h = Math.abs(it.v) * 9 * grow; const up = it.v >= 0; const isNeg = NEG[it.i];
    const col = isNeg ? [255, 90, 78] : up ? [200, 250, 114] : [120, 130, 125]; const z0 = up ? 0 : -h, z1 = up ? h : 0; const hs = cell * 0.36;
    const c = [[-hs, -hs], [hs, -hs], [hs, hs], [-hs, hs]].map(([a, b]) => [it.gx + a, it.gy + b]);
    const top = c.map(([a, b]) => P(a, b, z1)), bot = c.map(([a, b]) => P(a, b, z0));
    const face = (i1, i2, sh) => { x.fillStyle = `rgba(${col.map(v => Math.round(v * sh)).join(',')},.95)`; x.beginPath(); x.moveTo(...bot[i1]); x.lineTo(...bot[i2]); x.lineTo(...top[i2]); x.lineTo(...top[i1]); x.closePath(); x.fill(); };
    face(1, 2, 0.55); face(2, 3, 0.75); face(0, 1, 0.45); face(3, 0, 0.65);
    x.fillStyle = `rgb(${col.join(',')})`; if (isNeg && grow > 0.5) { x.shadowColor = '#ff5a4e'; x.shadowBlur = 30; }
    x.beginPath(); x.moveTo(...top[0]); for (let k = 1; k < 4; k++) x.lineTo(...top[k]); x.closePath(); x.fill(); x.shadowBlur = 0;
    if (isNeg && grow > 0.9) negSeen++;
  }
  x.textAlign = 'center'; x.font = sans(92); x.fillStyle = W2; x.fillText('93 mesi.', 540, 430);
  x.font = sans(190); x.fillStyle = R2; x.shadowColor = R2; x.shadowBlur = 40; x.globalAlpha = e3((age - 0.9) / 0.3); x.fillText('6', 540, 1370); x.shadowBlur = 0;
  x.font = mono(30, 500); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText('MESI IN CUI HANNO PERSO TUTTE E TRE', 540, 1440); x.globalAlpha = 1;
};

// linea del tempo con laser
G.scan = (age, s) => {
  const el = bx('g2_scan'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const u = e3((age - 0.1) / 1.4); const X0 = 80, X1 = 1000, cut = X0 + (X1 - X0) * (5 / 7.75);
  x.textAlign = 'center'; x.font = sans(70); x.fillStyle = W2; x.fillText('Ottimizzato su un periodo.', 540, 560); x.fillStyle = L2; x.fillText('Verificato su un altro.', 540, 660);
  const lx = X0 + (X1 - X0) * u; x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(X0, 900, X1 - X0, 120);
  x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(X0, 900, Math.min(lx, cut) - X0, 120);
  if (lx > cut) { x.fillStyle = L2; x.shadowColor = L2; x.shadowBlur = 30; x.fillRect(cut, 900, lx - cut, 120); x.shadowBlur = 0; }
  x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 40; x.fillRect(lx - 3, 860, 6, 200); x.shadowBlur = 0;
  x.font = mono(28, 500); x.fillStyle = 'rgba(255,255,255,.6)';
  for (let y = 2019; y <= 2026; y++) { const X = X0 + (X1 - X0) * (y - 2019) / 7.75; x.fillText(String(y), X + 20, 1080); }
  x.globalAlpha = e3((u - 0.4) / 0.2); x.textAlign = 'left'; x.font = mono(30, 600); x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText('OTTIMIZZAZIONE', X0, 1170);
  x.globalAlpha = e3((u - 0.8) / 0.2); x.textAlign = 'right'; x.fillStyle = L2; x.fillText('FUORI CAMPIONE', X1, 1170); x.globalAlpha = 1;
};

// quadrante del rischio
G.gauge = (age, s) => {
  const el = bx('g2_gauge'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const cx = 540, cy = 1080, r = 380;
  const stops = [[0, 1, 28.0], [0.5455, 0, 15.0], [1.091, 2, 49.0]]; let cur = stops[0];
  for (const st of stops) if (age >= st[0]) cur = st;
  const idx = stops.indexOf(cur), prev = stops[Math.max(0, idx - 1)]; const f = e3((age - cur[0]) / 0.35);
  const posA = [-150, -90, -30]; const a0 = posA[prev[1]], a1 = posA[cur[1]]; const ang = (a0 + (a1 - a0) * f) * Math.PI / 180;
  const val = prev[2] + (cur[2] - prev[2]) * f; const col = val < 20 ? L2 : val < 35 ? '#ffb057' : R2;
  x.textAlign = 'center'; x.font = sans(100); x.fillStyle = W2; x.fillText('Tu scegli', 540, 470); x.fillStyle = L2; x.fillText('il rischio.', 540, 580);
  x.lineWidth = 34; x.lineCap = 'round';
  [[-165, -115, L2], [-115, -65, '#ffb057'], [-65, -15, R2]].forEach(([s1, s2, c]) => { x.strokeStyle = c; x.globalAlpha = 0.85; x.beginPath(); x.arc(cx, cy, r, s1 * Math.PI / 180, s2 * Math.PI / 180); x.stroke(); });
  x.globalAlpha = 1; x.font = mono(38, 700); x.fillStyle = W2;
  ['0,5%', '1%', '2%'].forEach((t, i) => { const a = posA[i] * Math.PI / 180; x.fillText(t, cx + Math.cos(a) * (r - 90), cy + Math.sin(a) * (r - 90) + 12); });
  x.strokeStyle = '#fff'; x.lineWidth = 12; x.shadowColor = col; x.shadowBlur = 30; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ang) * (r - 30), cy + Math.sin(ang) * (r - 30)); x.stroke(); x.shadowBlur = 0;
  x.fillStyle = '#fff'; x.beginPath(); x.arc(cx, cy, 26, 0, 7); x.fill();
  x.font = sans(190); x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 50; x.fillText('−' + val.toFixed(1).replace('.', ',') + '%', 540, 1330); x.shadowBlur = 0;
  x.font = mono(30, 500); x.fillStyle = 'rgba(255,255,255,.65)'; x.fillText('DISCESA MASSIMA NEL BACKTEST · RISCHIO PER OPERAZIONE', 540, 1420);
};

// esplosione dei 500 futuri
G.burst = (age, s) => {
  const el = bx('g2_burst'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const M = window.MC; const k = 0.957;
  const X0 = 110, X1 = 980, Y0 = 520, Y1 = 1420, lo = 0.8, hi = 7.2; const u = e3((age - 0.05) / 0.9);
  const map = (j, v) => [X0 + (X1 - X0) * j / 60, Y1 - (v * k - lo) / (hi - lo) * (Y1 - Y0)];
  M.p.forEach((p, i) => { const d = hash(i) * 0.25; const uu = c3((u - d) / (1 - d), 0, 1); if (uu <= 0) return; const n = Math.max(1, Math.floor(uu * 60));
    x.strokeStyle = `rgba(200,250,114,${0.12 + 0.3 * (1 - uu)})`; x.lineWidth = 2; x.beginPath(); x.moveTo(...map(0, p[0])); for (let j = 1; j <= n; j++) x.lineTo(...map(j, p[j])); x.stroke();
    if (uu < 1) { const e = map(n, p[n]); x.fillStyle = '#fff'; x.shadowColor = L2; x.shadowBlur = 12; x.fillRect(e[0] - 2, e[1] - 2, 5, 5); x.shadowBlur = 0; } });
  const b = e3((age - 0.95) / 0.4);
  if (b > 0) { x.globalAlpha = b; x.strokeStyle = L2; x.lineWidth = 7; x.shadowColor = L2; x.shadowBlur = 20; x.beginPath(); M.q[1].forEach((v, j) => { const P = map(j, v); j ? x.lineTo(...P) : x.moveTo(...P); }); x.stroke(); x.shadowBlur = 0; x.globalAlpha = 1; }
  x.textAlign = 'center'; x.font = sans(200); x.fillStyle = W2; x.globalAlpha = 0.95; x.fillText('500', 540, 420); x.font = mono(34, 600); x.fillStyle = L2; x.fillText('FUTURI POSSIBILI · 5 ANNI · 10.000 €', 540, 480); x.globalAlpha = 1;
};

// slot machine degli scenari
G.slots = (age, s) => {
  const el = bx('g2_slot'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const rows = [['SE VA MALE', '20.852 €', W2], ['CASO TIPICO', '35.317 €', L2], ['SE VA BENE', '66.198 €', W2]];
  rows.forEach(([k, v, c], i) => { const y = 560 + i * 310; x.fillStyle = 'rgba(14,18,20,.95)'; x.strokeStyle = i === 1 ? L2 : 'rgba(255,255,255,.12)'; x.lineWidth = 3; x.beginPath(); x.roundRect(80, y - 150, 920, 280, 30); x.fill(); x.stroke();
    x.textAlign = 'left'; x.font = mono(28, 600); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText(k, 130, y - 90); odo(x, v, 540, y + 20, 150, age, c, i * 0.18); });
  x.textAlign = 'center'; x.font = mono(26, 500); x.fillStyle = 'rgba(255,255,255,.55)'; x.globalAlpha = e3((age - 0.9) / 0.3); x.fillText('SIMULAZIONE SU DATI STORICI · NON È UNA PROMESSA', 540, 1400); x.globalAlpha = 1;
};

// il globo pieno schermo con gli archi fra i mercati
let GPTS = null;
G.globe = (age, s) => {
  const el = bx('g2_globe'); const x = cv(el); x.clearRect(0, 0, 1080, 1920);
  if (!GPTS) { const P = window.GLOBO; GPTS = []; for (let i = 0; i < P.length; i += 2) { const la = P[i] / 10 * Math.PI / 180, lo = P[i + 1] / 10 * Math.PI / 180; GPTS.push([Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]); } }
  const R = 430 * (0.85 + 0.15 * e3(age / 1.5)), c = [540, 1000], th = -0.2 + age * 0.3, ci = Math.cos(-0.35), sn = Math.sin(-0.35), ct = Math.cos(th), st = Math.sin(th);
  const pr = (p) => { const x1 = p[0] * ct + p[2] * st, z1 = -p[0] * st + p[2] * ct, y2 = p[1] * ci - z1 * sn, z2 = p[1] * sn + z1 * ci; return [c[0] + x1 * R, c[1] - y2 * R, z2]; };
  const g = x.createRadialGradient(c[0], c[1], R * 0.8, c[0], c[1], R * 1.5); g.addColorStop(0, 'rgba(200,250,114,.18)'); g.addColorStop(1, 'rgba(200,250,114,0)'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
  x.fillStyle = 'rgba(10,22,6,.6)'; x.beginPath(); x.arc(c[0], c[1], R, 0, 7); x.fill(); x.strokeStyle = 'rgba(200,250,114,.55)'; x.lineWidth = 3; x.beginPath(); x.arc(c[0], c[1], R, 0, 7); x.stroke();
  for (const p of GPTS) { const [X, Y, z] = pr(p); const a = z > 0 ? 0.45 + 0.55 * z : 0.1; x.fillStyle = `rgba(200,250,114,${a.toFixed(2)})`; const sz = z > 0 ? 4.5 : 2.5; x.fillRect(X - sz / 2, Y - sz / 2, sz, sz); }
  const V = (la, lo) => { la *= Math.PI / 180; lo *= Math.PI / 180; return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]; };
  const cities = [[40.7, -74], [51.5, -0.1], [35.7, 139.7], [22.3, 114.2], [25.2, 55.3], [1.3, 103.8]];
  const pairs = [[0, 1], [1, 4], [4, 5], [5, 2], [2, 3], [0, 2]];
  pairs.forEach(([a, b], i) => { const A = V(...cities[a]), B = V(...cities[b]); const pp = c3((age - 0.3 - i * 0.15) / 0.6, 0, 1); if (!pp) return;
    x.strokeStyle = 'rgba(200,250,114,.8)'; x.lineWidth = 3; x.shadowColor = L2; x.shadowBlur = 12; x.beginPath(); let first = true;
    for (let k = 0; k <= 40 * pp; k++) { const t = k / 40; const m = [0, 1, 2].map(j => A[j] * (1 - t) + B[j] * t); const L = Math.hypot(...m); const lift = 1 + 0.25 * Math.sin(Math.PI * t); const q = pr(m.map(v => v / L * lift)); if (q[2] < -0.1) { first = true; continue; } first ? x.moveTo(q[0], q[1]) : x.lineTo(q[0], q[1]); first = false; }
    x.stroke(); x.shadowBlur = 0; });
  x.textAlign = 'center'; x.font = sans(96); x.fillStyle = W2; x.globalAlpha = e3((age - 0.4) / 0.4); x.fillText('Tre mercati.', 540, 330); x.fillStyle = L2; x.fillText('Un solo metodo.', 540, 440); x.globalAlpha = 1;
};

// il simulatore come mazzo di carte che si girano
G.deck = (age, s) => {
  const el = bx('g2_deck');
  if (!el.dataset.ok) { el.innerHTML = `<div class="dk">${[['CAPITALE', '10.000 €'], ['DISCESA MASSIMA ACCETTATA', '20%'], ['ORIZZONTE', '5 anni'], ['', '▶ AVVIA']].map(([k, v], i) => `<div class="dc${i === 3 ? ' go' : ''}"><div class="dcb"></div><div class="dcf"><div class="gk">${k}</div><div class="dv">${v}</div></div></div>`).join('')}</div><div class="dkt">Simulatore<br><span>Monte Carlo</span></div>`; el.dataset.ok = 1; }
  [...el.querySelectorAll('.dc')].forEach((c, i) => { const t0 = 0.05 + i * 0.5455 * 0.5; const f = e3((age - t0) / 0.35); const inn = e3((age - i * 0.08) / 0.3);
    c.style.transform = `translate(-50%,-50%) translateY(${(i - 1.5) * 250 + (1 - inn) * 900}px) rotateX(8deg) rotateY(${180 - 180 * f}deg) scale(${1 + (i === 3 && age > t0 + 0.4 ? 0.06 * Math.exp(-(age - t0 - 0.4) / 0.2) : 0)})`; });
};

// discesa come acqua che sale
G.water = (age, s) => {
  const el = bx('g2_water'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const u = e3((age - 0.15) / 1.3); const dd = 22.5 * u; const lvl = 520 + dd / 30 * 900;
  x.fillStyle = 'rgba(255,90,78,.14)'; x.beginPath(); x.moveTo(0, 1920); for (let X = 0; X <= 1080; X += 20) x.lineTo(X, lvl + Math.sin(X / 90 + age * 4) * 14); x.lineTo(1080, 1920); x.fill();
  x.strokeStyle = R2; x.lineWidth = 4; x.shadowColor = R2; x.shadowBlur = 20; x.beginPath(); for (let X = 0; X <= 1080; X += 20) { const Y = lvl + Math.sin(X / 90 + age * 4) * 14; X ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); x.shadowBlur = 0;
  x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = 2; x.font = mono(28, 500); x.fillStyle = 'rgba(255,255,255,.55)'; x.textAlign = 'left';
  for (let v = 0; v <= 30; v += 5) { const Y = 520 + v / 30 * 900; x.beginPath(); x.moveTo(40, Y); x.lineTo(90, Y); x.stroke(); x.fillText('−' + v + '%', 100, Y + 10); }
  x.textAlign = 'center'; x.font = sans(230); x.fillStyle = R2; x.shadowColor = R2; x.shadowBlur = 50; x.fillText('−' + dd.toFixed(1).replace('.', ',') + '%', 600, 900); x.shadowBlur = 0;
  x.font = sans(60); x.fillStyle = W2; x.fillText('la discesa massima,', 600, 1010); x.fillText('in 95 simulazioni su 100', 600, 1085);
  x.font = sans(96); x.fillStyle = W2; x.fillText('Conosci il rischio.', 540, 380);
};

// gara con gli indici (5 anni)
G.race = (age, s) => {
  const el = bx('g2_race'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const rows = [['STRATEGIE · MEDIANA', 35317, L2], ['NASDAQ-100', 26581, '#5eead4'], ['S&P 500', 19027, '#e8ecef']];
  x.textAlign = 'center'; x.font = sans(92); x.fillStyle = W2; x.fillText('10.000 € · 5 anni', 540, 470); x.font = mono(28, 500); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText('INDICI: STORICO 2019–2023 · STRATEGIE: SIMULAZIONE', 540, 540);
  rows.forEach(([k, v, c], i) => { const y = 700 + i * 260; const u = e3((age - 0.15 - i * 0.05) / 1.1); const w = (v / 36000) * 900 * u;
    x.textAlign = 'left'; x.font = mono(30, 600); x.fillStyle = c; x.fillText(k, 90, y - 30); x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(90, y, 900, 90);
    x.fillStyle = c; x.shadowColor = c; x.shadowBlur = i === 0 ? 30 : 0; x.fillRect(90, y, w, 90); x.shadowBlur = 0;
    x.font = sans(64); x.fillStyle = W2; x.fillText(Math.round(10000 + (v - 10000) * u).toLocaleString('it-IT') + ' €', 110, y + 190); });
};

// conto alla rovescia
G.count3 = (age, s) => { const el = bx('g2_c3'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const b = 0.5455; const k = Math.min(2, Math.floor(age / b)); const a = age - k * b; const n = ['3', '2', '1'][k];
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = sans(700 * (1.15 - 0.15 * e3(a / 0.2))); x.globalAlpha = 1 - c3((a - 0.35) / 0.15, 0, 1);
  x.fillStyle = 'rgba(255,0,80,.6)'; x.fillText(n, 540 - 12, 960); x.fillStyle = 'rgba(0,229,255,.6)'; x.fillText(n, 540 + 12, 960); x.fillStyle = L2; x.fillText(n, 540, 960); x.globalAlpha = 1; x.textBaseline = 'alphabetic'; };

// cubo 3D delle strategie
G.cube = (age, s) => {
  const el = bx('g2_cube');
  if (!el.dataset.ok) { const F = [['XAUUSD', GD], ['NASDAQ', BL], ['USDJPY', PU], ['PORTAFOGLIO', L2]]; el.innerHTML = `<div class="cub">${F.map(([n, c], i) => `<div class="cf" style="transform:rotateY(${i * 90}deg) translateZ(300px);border-color:${c};box-shadow:inset 0 0 80px ${c}44,0 0 60px ${c}55"><span style="color:${c}">${n}</span></div>`).join('')}</div>`; el.dataset.ok = 1; }
  const spin = age < 0.9 ? 720 * e3(age / 0.9) : 720 + 270 * e3((age - 0.9) / 0.25); el.querySelector('.cub').style.transform = `translate(-50%,-50%) rotateX(-14deg) rotateY(${-spin}deg)`;
};

// pioggia delle operazioni
G.rain = (age, s) => {
  const el = bx('g2_rain'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const R = window.EXTRA.R; const cols = 16, cw = 1080 / cols;
  x.font = mono(26, 600); x.textAlign = 'center';
  for (let c = 0; c < cols; c++) { const sp = 700 + hash(c) * 600, off = hash(c + 50) * 1920;
    for (let j = 0; j < 30; j++) { const idx = (c * 263 + j * 17) % R.length; const y = ((age * sp + off + j * 64) % 2100) - 100; const r = R[idx]; const head = j === 29;
      x.fillStyle = r > 0 ? `rgba(200,250,114,${0.25 + 0.6 * j / 30})` : `rgba(255,90,78,${0.25 + 0.6 * j / 30})`; x.fillText((r > 0 ? '+' : '') + r.toFixed(1) + 'R', c * cw + cw / 2, y); } }
  x.fillStyle = 'rgba(4,6,7,.72)'; x.fillRect(0, 800, 1080, 330);
  odo(x, '4.206', 540, 930, 200, age, L2, 0.05); x.font = mono(32, 600); x.fillStyle = W2; x.textAlign = 'center'; x.fillText('OPERAZIONI · NESSUNA ESCLUSA', 540, 1080);
};

// le 3 curve affiancate
G.split3 = (age, s) => {
  const el = bx('g2_s3'); const x = cv(el); x.clearRect(0, 0, 1080, 1920); const C = window.CURVE; const D = [['oro', 'XAUUSD', GD], ['nasdaq', 'NASDAQ', BL], ['usdjpy', 'USDJPY', PU]];
  D.forEach(([k, n, c], i) => { const X0 = i * 360; const on = s.at ? Math.min(2, s.at.filter(a => s.t0 + age >= a).length - 1) === i : true; x.fillStyle = on ? c + '22' : 'rgba(255,255,255,.02)'; x.fillRect(X0 + 6, 300, 348, 1170);
    x.save(); x.translate(X0 + 180, 880); x.rotate(-Math.PI / 2); x.textAlign = 'center'; x.font = sans(120); x.fillStyle = on ? c : 'rgba(255,255,255,.15)'; if (on) { x.shadowColor = c; x.shadowBlur = 30; } x.fillText(n, 0, 40); x.restore(); x.shadowBlur = 0;
    const v = C[k]; const u = e3((age - i * 0.1) / 1.2); const n2 = Math.max(2, Math.floor(u * v.length)); x.strokeStyle = c; x.lineWidth = 5; x.globalAlpha = on ? 1 : 0.35; x.beginPath();
    for (let j = 0; j < n2; j++) { const X = X0 + 30 + j / (v.length - 1) * 300, Y = 1420 - v[j] * 1030; j ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); x.globalAlpha = 1; });
};

// le carte che si aprono a ventaglio
G.fanc = (age, s) => {
  const el = bx('g2_fanc'); const C = window.CURVE;
  if (!el.dataset.ok) { const D = [['oro', 'XAUUSD', GD], ['nasdaq', 'Nasdaq', BL], ['usdjpy', 'USDJPY', PU], ['port', 'Portafoglio', L2]];
    el.innerHTML = D.map(([k, n, c]) => { const v = C[k]; const p = v.map((y, j) => `${(j / (v.length - 1) * 420).toFixed(1)},${(260 - y * 220).toFixed(1)}`).join(' ');
      return `<div class="fc" style="border-color:${c};box-shadow:0 0 50px ${c}44"><div class="fcn" style="color:${c}">${n}</div><svg viewBox="0 0 420 280"><polyline points="${p}" fill="none" stroke="${c}" stroke-width="5"/></svg></div>`; }).join('') + `<div class="fct">Scegli.<br><span>O prendile tutte.</span></div>`; el.dataset.ok = 1; }
  const f = e3((age - 0.1) / 0.6); [...el.querySelectorAll('.fc')].forEach((c, i) => { const a = (i - 1.5) * 16 * f; c.style.transform = `translate(-50%,-100%) rotate(${a}deg) translateY(${-f * 30}px)`; c.style.opacity = e3(age / 0.2); });
};

// chiusura: logo al centro, nome che gira in cerchio, invito al sito
G.outro2 = (age, s) => {
  const el = bx('g2_out');
  if (!el.dataset.ok) { el.innerHTML = `<img class="sl r" src="logo-grande.webp" style="top:690px;width:300px;margin-left:-150px"><img class="sl c" src="logo-grande.webp" style="top:690px;width:300px;margin-left:-150px"><img class="sl w" src="logo-grande.webp" style="top:690px;width:300px;margin-left:-150px">`; el.dataset.ok = 1; }
  const p = Math.exp(-age / 0.14), q = e3(age / 0.35), off = 22 * p + 3 * Math.abs(Math.sin(age * 19)) * (age < 0.5 ? 1 : 0);
  const imgs = el.querySelectorAll('.sl'); const sc = (0.4 + 0.6 * q) * (1 + 0.25 * p);
  imgs[0].style.transform = `translate(${-off}px,0) scale(${sc})`; imgs[1].style.transform = `translate(${off}px,0) scale(${sc})`; imgs[2].style.transform = `scale(${sc})`; imgs.forEach(i => i.style.opacity = q);
  const x = cv(el); x.clearRect(0, 0, 1080, 1920); const cx = 540, cy = 850, r = 330;
  const txt = 'PORTFOLIO · ALGO MANAGER · PORTFOLIO · ALGO MANAGER · '; const n = txt.length; const shown = e3((age - 0.2) / 0.6) * n;
  x.font = mono(40, 700); x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 0; i < Math.floor(shown); i++) { const a = i / n * Math.PI * 2 - Math.PI / 2 + age * 0.55; x.save(); x.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.rotate(a + Math.PI / 2); x.fillStyle = txt[i] === '·' ? L2 : W2; x.fillText(txt[i], 0, 0); x.restore(); }
  x.strokeStyle = 'rgba(200,250,114,.35)'; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, r - 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * q); x.stroke();
  const b = e3((age - 0.9) / 0.35); if (b > 0) { const pulse = 1 + 0.03 * Math.exp(-((age - 0.9) % 0.5455) / 0.12);
    x.save(); x.translate(540, 1370); x.scale((0.7 + 0.3 * b) * pulse, (0.7 + 0.3 * b) * pulse); x.globalAlpha = b; x.fillStyle = L2; x.shadowColor = L2; x.shadowBlur = 60; x.beginPath(); x.roundRect(-380, -80, 760, 160, 80); x.fill(); x.shadowBlur = 0;
    x.fillStyle = '#0c1a04'; x.font = sans(60); x.fillText('Esplora il portfolio  →', 0, 4); x.restore(); x.globalAlpha = 1; }
  const tq = e3((age - 0.5) / 0.4); x.globalAlpha = tq; x.font = sans(92); x.fillStyle = W2; x.fillText('Guarda i numeri.', 540, 300); x.fillStyle = L2; x.fillText('Tutti.', 540, 410); x.globalAlpha = 1; x.textBaseline = 'alphabetic';
};
