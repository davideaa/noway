// Aiuti aggiuntivi dello stile noir: monete, vetro liquido, pillole di vetro, click. Estratti da t1.html.
function coin(cx, cy, r, k, rim = '200,250,114', label = '$') {
  x.save(); x.globalAlpha *= k;
  x.fillStyle = '#0c0f0d'; x.beginPath(); x.ellipse(cx, cy + 10, r, r * 0.32, 0, 0, 7); x.fill();
  const g = x.createLinearGradient(cx - r, cy, cx + r, cy); g.addColorStop(0, '#1d2420'); g.addColorStop(0.5, '#0f1311'); g.addColorStop(1, '#1a201c');
  x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, r, r * 0.32, 0, 0, 7); x.fill();
  x.strokeStyle = `rgba(${rim},0.85)`; x.lineWidth = 2.5; x.beginPath(); x.ellipse(cx, cy, r, r * 0.32, 0, Math.PI, Math.PI * 2); x.stroke();
  x.save(); x.translate(cx, cy); x.scale(1, 0.32); txt(label, 0, 0, { size: r * 0.9, weight: 800, color: `rgba(${rim},0.6)` }); x.restore();
  x.restore();
}

function glass(cx, cy, w, h, r, k, tint = '255,255,255') {
  if (k <= 0) return; const m = x.getTransform();
  const p0 = m.transformPoint(new DOMPoint(cx - w / 2, cy - h / 2)), p1 = m.transformPoint(new DOMPoint(cx + w / 2, cy + h / 2));
  x.save(); x.globalAlpha *= clamp(k); x.beginPath(); x.roundRect(cx - w / 2, cy - h / 2, w, h, r); x.clip();
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.filter = 'blur(18px) saturate(150%)';
  const pad = 40, sx = Math.max(0, p0.x - pad), sy = Math.max(0, p0.y - pad), sw = Math.min(W, p1.x + pad) - sx, sh = Math.min(H, p1.y + pad) - sy;
  if (sw > 0 && sh > 0) x.drawImage(cv, sx, sy, sw, sh, sx, sy, sw, sh); x.restore();
  const g = x.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2); g.addColorStop(0, `rgba(${tint},0.20)`); g.addColorStop(0.5, `rgba(${tint},0.06)`); g.addColorStop(1, `rgba(${tint},0.14)`);
  x.fillStyle = g; x.fillRect(cx - w / 2, cy - h / 2, w, h);
  const sp = x.createLinearGradient(0, cy - h / 2, 0, cy - h / 2 + h * 0.5); sp.addColorStop(0, 'rgba(255,255,255,0.22)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = sp; x.fillRect(cx - w / 2, cy - h / 2, w, h * 0.5); x.restore();
  x.save(); x.globalAlpha *= clamp(k); x.beginPath(); x.roundRect(cx - w / 2 + 1, cy - h / 2 + 1, w - 2, h - 2, r);
  const b = x.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2); b.addColorStop(0, 'rgba(255,255,255,0.65)'); b.addColorStop(0.45, 'rgba(255,255,255,0.08)'); b.addColorStop(1, 'rgba(255,255,255,0.40)');
  x.strokeStyle = b; x.lineWidth = 2.5; x.stroke(); x.restore();
}

function glassPill(cx, cy, label, k, col = C.ink, size = 44) {
  if (k <= 0) return 0; const w = tw(label, size, 700) + 90, s = lerp(0.85, 1, oB(clamp(k)));
  x.save(); x.translate(cx, cy); x.scale(s, s); x.translate(-cx, -cy); glass(cx, cy, w, 96, 48, clamp(k * 2)); txt(label, cx, cy + 2, { size, weight: 700, color: col, alpha: clamp(k * 2) }); x.restore(); return w;
}
// click: dito (cerchio chiaro) che arriva, preme a t0, onda che si allarga

function tap(px, py, t, t0) {
  const ka = seg(t, t0 - 0.55, t0), kr = seg(t, t0, t0 + 0.55), kout = seg(t, t0 + 0.35, t0 + 0.8);
  if (ka <= 0 || kout >= 1) return;
  const e = oC(ka), fx = lerp(px + 170, px, e), fy = lerp(py + 230, py, e), press = t >= t0 ? 1 - 0.18 * Math.sin(Math.PI * clamp((t - t0) / 0.2)) : 1;
  if (kr > 0 && kr < 1) { x.save(); x.strokeStyle = `rgba(200,250,114,${1 - kr})`; x.lineWidth = 4; x.beginPath(); x.arc(px, py, 20 + 70 * oC(kr), 0, 7); x.stroke(); x.restore(); glow(px, py, 90, '200,250,114', 0.35 * (1 - kr)); }
  x.save(); x.globalAlpha = (1 - kout) * clamp(ka * 3); glow(fx, fy, 70, '255,255,255', 0.25);
  x.fillStyle = 'rgba(255,255,255,0.92)'; x.beginPath(); x.arc(fx, fy, 30 * press, 0, 7); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 3; x.beginPath(); x.arc(fx, fy, 42 * press, 0, 7); x.stroke(); x.restore();
}

// ---------------- scene ----------------
