/* XAU NEWS BIAS — interfaccia. Solo lettura dalle API: nessun numero è calcolato o inventato qui,
   a parte gli arrotondamenti di visualizzazione. */
"use strict";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pct = (x, d = 0) => (x == null || isNaN(x) ? "n/d" : (x * 100).toFixed(d) + "%");
const num = (x, d = 2) => (x == null || isNaN(x) ? "n/d" : Number(x).toFixed(d));
const pips = (x) => (x == null || isNaN(x) ? "n/d" : Math.round(x) + " pips");
const fmtTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("it-IT", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
};
const fmtShort = (iso) => (iso ? new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");
async function api(path, opts) {
  const r = await fetch(path, opts);
  if (!r.ok) throw new Error(path + " → HTTP " + r.status);
  return r.json();
}

/* ---------- tooltip ---------- */
const tip = $("#tip");
function showTip(e, html) { tip.innerHTML = html; tip.hidden = false; tip.style.left = e.clientX + 12 + "px"; tip.style.top = e.clientY + 12 + "px"; }
function hideTip() { tip.hidden = true; }
document.addEventListener("mouseover", (e) => { const t = e.target.closest("[data-tip]"); if (t) showTip(e, t.getAttribute("data-tip")); });
document.addEventListener("mousemove", (e) => { if (!tip.hidden) { tip.style.left = e.clientX + 12 + "px"; tip.style.top = e.clientY + 12 + "px"; } });
document.addEventListener("mouseout", (e) => { if (e.target.closest("[data-tip]")) hideTip(); });

/* ---------- tabs ---------- */
let currentEvent = null;
document.querySelectorAll("#tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll("#tabs button").forEach((x) => x.classList.toggle("on", x === b));
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.id === b.dataset.tab));
    if (b.dataset.tab === "why") loadWhy(currentEvent);
    if (b.dataset.tab === "lab") loadLab();
    if (b.dataset.tab === "track") loadTrack();
    if (b.dataset.tab === "sources") loadSources();
  }));

/* ---------- small SVG charts ---------- */
function svgEl(w, h, inner) { return `<svg viewBox="0 0 ${w} ${h}" role="img">${inner}</svg>`; }

function probChart(points) {
  // points: [{t: Date, p: prob_up, bias, label}]
  if (!points.length) return '<p class="muted small">Nessuna previsione ancora registrata per questo evento.</p>';
  const W = 560, H = 190, L = 36, R = 10, T = 10, B = 26;
  const t0 = points[0].t.getTime(), t1 = Math.max(points[points.length - 1].t.getTime(), t0 + 60000);
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const y = (p) => T + (1 - (p - 0.2) / 0.6) * (H - T - B);
  let g = "";
  for (const v of [0.3, 0.4, 0.5, 0.6, 0.7]) g += `<g class="grid"><line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" ${v === 0.5 ? 'stroke-dasharray="4 3"' : ""}/></g><text x="${L - 4}" y="${y(v) + 4}" text-anchor="end">${v * 100}%</text>`;
  const pts = points.filter((p) => p.p != null);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p.t.getTime()).toFixed(1)},${y(Math.min(0.8, Math.max(0.2, p.p))).toFixed(1)}`).join("");
  let marks = "";
  for (const p of pts) {
    const col = p.p >= 0.5 ? "var(--bull)" : "var(--bear)";
    marks += `<circle cx="${x(p.t.getTime())}" cy="${y(Math.min(0.8, Math.max(0.2, p.p)))}" r="${p.label && p.label !== "ROLLING" ? 5 : 3}" fill="${col}" stroke="var(--surface)" stroke-width="2"
      data-tip="${esc(fmtShort(p.t.toISOString()))} · ${esc(p.label)}<br>P(BULLISH) ${pct(p.p, 1)}<br>esito mostrato: ${esc(p.bias)}"/>`;
  }
  const lab = `<text x="${L}" y="${H - 6}">${esc(fmtShort(points[0].t.toISOString()))}</text><text x="${W - R}" y="${H - 6}" text-anchor="end">${esc(fmtShort(points[points.length - 1].t.toISOString()))}</text>`;
  return svgEl(W, H, g + `<path d="${d}" fill="none" stroke="var(--text-2)" stroke-width="2"/>` + marks + lab);
}

function barCI(rows, { label, value, lo, hi, n, ref = 0.5, min = 0.2, max = 0.9, fmt = (v) => pct(v, 0), L = 150 }) {
  const W = 640, rowH = 26, R = 120, H = rows.length * rowH + 24;
  const x = (v) => L + ((v - min) / (max - min)) * (W - L - R);
  let s = `<g class="grid"><line x1="${x(ref)}" x2="${x(ref)}" y1="0" y2="${H - 18}" stroke-dasharray="4 3"/></g><text x="${x(ref)}" y="${H - 4}" text-anchor="middle">${fmt(ref)}</text>`;
  rows.forEach((r, i) => {
    const cy = i * rowH + 14, v = r[value];
    s += `<text x="${L - 8}" y="${cy + 4}" text-anchor="end">${esc(r[label])}</text>`;
    if (v == null) { s += `<text x="${L}" y="${cy + 4}">nessun caso</text>`; return; }
    const w = Math.max(2, x(Math.min(max, v)) - x(min));
    s += `<rect x="${x(min)}" y="${cy - 7}" width="${w}" height="14" rx="4" fill="var(--accent)" opacity=".75"
      data-tip="${esc(r[label])}<br>${fmt(v)} su ${r[n]} casi${r[lo] != null ? `<br>IC 95%: ${fmt(r[lo])} – ${fmt(r[hi])}` : ""}"/>`;
    if (r[lo] != null) s += `<line x1="${x(Math.max(min, r[lo]))}" x2="${x(Math.min(max, r[hi]))}" y1="${cy}" y2="${cy}" stroke="var(--text)" stroke-width="2"/>`;
    s += `<text x="${W - R + 6}" y="${cy + 4}">${fmt(v)} · n=${r[n]}</text>`;
  });
  return svgEl(W, H, s);
}

function reliabilityChart(rel) {
  const W = 320, H = 320, L = 44, B = 40, T = 16, R = 22;
  const x = (v) => L + v * (W - L - R), y = (v) => T + (1 - v) * (H - T - B);
  let s = `<g class="grid"><line x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}" stroke-dasharray="4 3"/></g>`;
  for (const v of [0, 0.25, 0.5, 0.75, 1]) s += `<text x="${x(v)}" y="${H - 22}" text-anchor="middle">${v * 100}%</text><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v * 100}%</text>`;
  s += `<text x="${(W + L) / 2}" y="${H - 2}" text-anchor="middle">probabilità prevista (BULLISH)</text>`;
  for (const b of rel) {
    if (!b.n) continue;
    const r = Math.max(4, Math.min(14, Math.sqrt(b.n) * 1.6));
    s += `<circle cx="${x(b.mean_pred)}" cy="${y(b.obs_up)}" r="${r}" fill="var(--accent)" fill-opacity=".7" stroke="var(--surface)" stroke-width="2"
      data-tip="previsto ${pct(b.mean_pred, 1)}<br>osservato ${pct(b.obs_up, 1)}<br>${b.n} eventi"/>`;
  }
  return svgEl(W, H, s);
}

/* ---------- dashboard ---------- */
function biasClass(b) { return b === "BULLISH" || b === "BEARISH" ? b : "NONE"; }
function statusPill(s) {
  const c = s === "HEALTHY" ? "ok" : s === "DATA QUALITY WARNING" || s === "STALE" || s === "NEVER USED" ? "warn" : s === "N/A" || s === "NOT CONFIGURED" ? "off" : "bad";
  return `<span class="pill ${c}">${esc(s)}</span>`;
}

async function loadDash() {
  let o;
  try { o = await api("/api/overview"); } catch (e) { $("#headline").textContent = "Backend non raggiungibile: " + e.message; return; }
  const ev = o.next_event, p = o.prediction;
  currentEvent = ev ? ev.event_id : null;
  $("#ev-name").textContent = ev ? ev.name : "Nessun evento in calendario";
  $("#ev-time").innerHTML = ev ? esc(fmtTime(ev.t0_utc)) + " (ora locale)" +
    (o.earlier_unmodelled && o.earlier_unmodelled.length ? `<div class="small muted">Prima ancora: ${o.earlier_unmodelled.map((e) => esc(e.name) + " " + esc(fmtShort(e.t0_utc))).join(", ")} — famiglie non ancora studiate, nessun modello.</div>` : "") : "";
  const b = $("#bias");
  if (p) {
    const pr = p.calibrated_prob_up;
    const lean = pr == null ? "" : (pr >= 0.5 ? "BULLISH" : "BEARISH");
    if (p.bias === "BULLISH" || p.bias === "BEARISH") b.textContent = `${p.bias} — ${pct(Math.max(pr, 1 - pr))}`;
    else b.textContent = p.bias;
    b.className = "bias " + biasClass(p.bias);
    $("#headline").textContent = o.headline || "";
    const extra = (p.features && p.features.extra) || {};
    const rows = [
      ["Confidence", esc(p.confidence)],
      ["Out-of-Sample validated", p.oos_validated ? "YES" : "NO"],
      ["Inclinazione del modello (non validata)", pr == null ? "n/d" : `${lean} ${pct(Math.max(pr, 1 - pr))} <span class="muted small">(grezza ${pct(p.raw_prob_up, 1)})</span>`],
      ["Casi storici comparabili", p.comparable_cases == null ? "n/d" : `${p.comparable_cases}${p.comparable && !p.comparable.strict ? " <span class=\"muted small\">(pochi: mostrati i 10 più vicini)</span>" : ""}`],
      ["Affidabilità storica della fascia", p.prob_ci_low != null ? `${pct(p.prob_ci_low)} – ${pct(p.prob_ci_high)} (IC 95%)` : "n/d"],
      ["Modello", `${esc(p.model_version || "—")} ${extra.algo ? "· " + esc(extra.algo) : ""} ${extra.submodel_checkpoint ? "· sottomodello " + esc(extra.submodel_checkpoint) : ""}`],
      ["Ultimo aggiornamento", fmtTime(p.prediction_utc)],
      ["Prossimo ricalcolo", fmtTime(o.next_event_recalc_utc)],
    ];
    $("#kv").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    const mv = extra.movement || {};
    $("#movement").innerHTML = mv.range_median_pips == null ? '<p class="muted">n/d</p>' : `
      <div class="grid3">
        <div><div class="label">RANGE MEDIANO M1</div><div class="stat">~${Math.round(mv.range_median_pips)} pips</div><div class="muted small">tipico ${Math.round(mv.range_p25_pips)}–${Math.round(mv.range_p75_pips)}</div></div>
        <div><div class="label">BODY MEDIANO</div><div class="stat">~${Math.round(mv.body_median_pips)} pips</div><div class="muted small">tipico ${Math.round(mv.body_p25_pips)}–${Math.round(mv.body_p75_pips)}</div></div>
        <div><div class="label">MFE / MAE MEDIANI</div><div class="stat">${Math.round(mv.mfe_median_pips)} / ${Math.round(mv.mae_median_pips)}</div><div class="muted small">pips, nel verso della chiusura</div></div>
      </div>`;
    const issues = p.data_issues || [];
    $("#datastatus").innerHTML = `<p>${statusPill(p.data_status)}</p>` +
      (issues.length ? "<ul>" + issues.map((i) => `<li class="small">${esc(i.message)}</li>`).join("") + "</ul>" : '<p class="small muted">Nessun problema rilevato nella fotografia.</p>') +
      (o.last_quote ? `<p class="small muted">Ultimo prezzo XAU: ${num((o.last_quote.bid + o.last_quote.ask) / 2)} (${esc(o.last_quote.provider)}, ${fmtTime(o.last_quote.ts_utc)}) · mercato ${o.market_open ? "aperto" : "chiuso"}</p>` : "") +
      (o.sources_warning.length ? "<p class=\"small\">Fonti critiche: " + o.sources_warning.map((s) => `${esc(s.id)} ${statusPill(s.state)}`).join(" ") + "</p>" : "");
  } else {
    b.textContent = "—"; b.className = "bias NONE";
    $("#headline").textContent = ev ? `Previsioni automatiche da ${fmtTime(o.auto_from_utc)} (7 giorni prima), poi sempre più fitte fino alla release. Puoi anche calcolarla ora.` : "";
    $("#kv").innerHTML = `<dt>Prossimo ricalcolo</dt><dd>${fmtTime(o.next_event_recalc_utc)}</dd>`;
  }
  // timeline
  if (o.timeline) {
    $("#timeline").innerHTML = o.timeline.map((r) => {
      const v = r.calibrated_prob_up;
      const txt = r.bias ? (r.bias === "BULLISH" || r.bias === "BEARISH" ? `${r.bias} ${pct(Math.max(v, 1 - v))}` : `${r.bias}${v != null ? ` <span class="muted small">(inclinazione ${v >= 0.5 ? "bullish" : "bearish"} ${pct(Math.max(v, 1 - v))})</span>` : ""}`) : '<span class="muted">non ancora</span>';
      return `<tr><td>${r.checkpoint}</td><td>${txt}</td><td class="muted small">${r.prediction_utc ? fmtShort(r.prediction_utc) : ""}</td></tr>`;
    }).join("") + (p ? `<tr><td><b>NOW</b></td><td>${p.bias === "BULLISH" || p.bias === "BEARISH" ? p.bias + " " + pct(Math.max(p.calibrated_prob_up, 1 - p.calibrated_prob_up)) : esc(p.bias)}</td><td class="muted small">${fmtShort(p.prediction_utc)}</td></tr>` : "");
  }
  if (ev) {
    try {
      const d = await api("/api/event/" + encodeURIComponent(ev.event_id));
      $("#probchart").innerHTML = probChart(d.predictions.filter((x) => x.calibrated_prob_up != null).map((x) => ({ t: new Date(x.prediction_utc), p: x.calibrated_prob_up, bias: x.bias, label: x.checkpoint })));
    } catch (e) { $("#probchart").textContent = e.message; }
  }
  $("#upcoming").innerHTML = "<tr><th>Release</th><th>Quando</th><th>Famiglia</th><th>Ultimo bias</th><th>Data status</th></tr>" +
    o.upcoming.map((e) => `<tr><td><a href="#" data-ev="${esc(e.event_id)}">${esc(e.name)}</a></td><td>${fmtTime(e.t0_utc)}</td><td>${esc(e.family)}</td>
      <td>${e.latest ? esc(e.latest.bias) : '<span class="muted">—</span>'}</td><td>${e.latest ? statusPill(e.latest.data_status) : ""}</td></tr>`).join("");
  document.querySelectorAll("[data-ev]").forEach((a) => a.addEventListener("click", (ev2) => {
    ev2.preventDefault(); currentEvent = a.dataset.ev; document.querySelector('[data-tab="why"]').click();
  }));
}

/* ---------- WHY ---------- */
async function loadWhy(eventId) {
  const box = $("#why-body");
  if (!eventId) { box.innerHTML = '<p class="muted">Nessun evento selezionato.</p>'; return; }
  let d;
  try { d = await api("/api/event/" + encodeURIComponent(eventId)); } catch (e) { box.textContent = e.message; return; }
  if (!d.why) { box.innerHTML = `<h3>${esc(d.event.name)} — ${fmtTime(d.event.t0_utc)}</h3><p class="muted">Nessuna fotografia disponibile per questo evento (${d.latest ? esc(d.latest.bias) : "nessuna previsione"}).</p>`; return; }
  const w = d.why, c = w.comparable || {};
  let h = `<h3>${esc(d.event.name)} — ${fmtTime(d.event.t0_utc)}</h3><p>${esc(w.headline)}</p>`;
  h += '<div class="grid2">' + w.regimes.map((r) => `<div class="card"><div class="label">${esc(r.area.toUpperCase())}</div><p>${esc(r.text)}</p></div>`).join("") + "</div>";
  h += `<div class="card"><div class="label">CASI STORICI COMPARABILI</div>
    <p>${c.n ?? 0} eventi CPI su ${c.total_history ?? "?"} hanno un regime simile (distanza RMS ≤ ${c.max_rms ?? "?"} deviazioni standard su inflazione, tassi, dollaro, volatilità e trend dell'oro).
    ${c.strict ? "" : "Sono pochi: sotto sono mostrati i 10 più vicini, da leggere con cautela."}
    Fra quelli mostrati la prima M1 è stata BULLISH ${c.bullish ?? "?"} volte su ${c.shown ?? "?"}.</p>
    <div class="table-wrap"><table class="tbl"><tr><th>Evento</th><th>Esito</th><th class="num">Move</th><th class="num">Range</th><th class="num">Distanza</th></tr>
    ${(c.cases || []).slice(0, 25).map((x) => `<tr><td>${esc(x.event_id)}</td><td class="dir-${x.direction}">${x.direction}</td><td class="num">${num(x.move_pips, 0)}</td><td class="num">${num(x.range_pips, 0)}</td><td class="num">${num(x.distance)}</td></tr>`).join("")}
    </table></div></div>`;
  if (w.class_performance) {
    const rows = w.class_performance.filter((b) => !b.cumulative).map((b) => ({ ...b, name: `${Math.round(b.from * 100)}–${Math.round(Math.min(b.to, 1) * 100)}%` }));
    h += `<div class="card"><div class="label">PERFORMANCE STORICA FUORI CAMPIONE PER FASCIA DI CONFIDENZA (HOLDOUT)</div>
      ${barCI(rows, { label: "name", value: "hit_rate", lo: "wilson_lo", hi: "wilson_hi", n: "n" })}
      <p class="small muted">Barre: quante volte la direzione indicata si è verificata. Linea nera: intervallo di confidenza 95% (Wilson). Linea tratteggiata: 50%, il caso.</p></div>`;
  }
  const f = (d.latest.features || {}).features || {};
  h += `<details class="card"><summary>Tutte le feature della fotografia (${Object.keys(f).length})</summary><div class="table-wrap"><table class="tbl">${Object.entries(f).sort().map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${typeof v === "number" ? num(v, 4) : esc(v)}</td></tr>`).join("")}</table></div>
    <p class="small muted">Hash della fotografia: ${esc(d.latest.snapshot_sha256)}</p></details>`;
  box.innerHTML = h;
}

/* ---------- RESEARCH LAB ---------- */
async function loadLab() {
  const box = $("#lab-body");
  let r;
  try { r = await api("/api/research/cpi"); } catch (e) { box.innerHTML = `<div class="card">Ricerca CPI non ancora eseguita (${esc(e.message)}).</div>`; return; }
  const s = r.sample, ho = r.holdout, v = r.verdict;
  let h = `<div class="card"><div class="label">VERDETTO DEL PROTOCOLLO PRE-REGISTRATO — CPI @ T−1H</div>
    <div class="verdict ${v.primary === "PROMETTENTE" ? "pass" : "fail"}">${esc(v.primary)}</div>
    <p>Modello scelto in sviluppo (2013–2019, log loss minima): <b>${esc(r.selection.chosen)}</b>. Holdout 2020–2026 (${ho.metrics.n} eventi, mai usati per scegliere):
    accuracy <b>${pct(ho.metrics.accuracy, 1)}</b> (IC 95% ${pct(ho.accuracy_ci95[0], 1)}–${pct(ho.accuracy_ci95[1], 1)}),
    Brier ${num(ho.metrics.brier, 4)} contro ${num(ho.brier_baseline_M0, 4)} della baseline, log loss ${num(ho.metrics.log_loss, 4)},
    test di permutazione p = ${num(ho.permutation.p_value, 3)}.</p>
    <p class="small muted">Criteri: ${Object.entries(ho.criteria).map(([k, ok]) => `${esc(k)} ${ok ? "✔" : "✘"}`).join(" · ")}.
    Con ${ho.metrics.n} eventi l'accuratezza minima distinguibile dal caso (80% di potenza) è ${pct(ho.min_detectable_accuracy, 0)}.
    Dataset SHA-256 ${esc(r.dataset_sha256.slice(0, 16))}… · generato ${fmtShort(r.generated_utc)}</p></div>`;
  h += `<div class="grid3">
    <div class="card"><div class="label">EVENTI</div><div class="stat">${s.events_usable}</div><p class="small muted">utilizzabili su ${s.events_primary} CPI (feb 2008 → oggi); ${s.events_total_archive} nell'archivio BLS.</p>
      <p class="small">Esclusi: ${Object.entries(s.excluded).map(([k, n]) => `${esc(k)} ${n}`).join(", ") || "nessuno"}</p></div>
    <div class="card"><div class="label">BULLISH / BEARISH</div><div class="stat">${s.bullish} / ${s.bearish}</div><p class="small muted">${pct(s.bullish_share, 1)} bullish sulla prima M1.</p></div>
    <div class="card"><div class="label">STABILITÀ DELL'ETICHETTA</div><div class="stat">${pct(r.target.label_agreement_mid_vs_bid, 1)}</div><p class="small muted">accordo mid vs bid; vs candela M1 dal primo tick dopo T0: ${pct(r.target.label_agreement_mid_vs_m1_candle_open, 1)}. Prima reazione a +${Math.round(r.target.first_reaction_ms.median)} ms (mediana).</p></div>
  </div>`;
  // model comparison
  const mt = r.model_table.filter((x) => x.checkpoint === "T-1H");
  h += `<div class="card"><div class="label">CONFRONTO MODELLI — T−1H (walk-forward, probabilità calibrate)</div><div class="table-wrap"><table class="tbl">
    <tr><th>Modello</th><th class="num">Acc. sviluppo</th><th class="num">LogLoss sviluppo</th><th class="num">Acc. holdout</th><th class="num">Brier holdout</th><th class="num">LogLoss holdout</th><th class="num">AUC holdout</th><th class="num">p permutazione (Holm)</th></tr>
    ${mt.map((x) => `<tr${x.model === r.selection.chosen ? ' style="font-weight:700"' : ""}><td>${x.model}</td><td class="num">${pct(x.dev_accuracy, 1)}</td><td class="num">${num(x.dev_log_loss, 4)}</td><td class="num">${pct(x.holdout_accuracy, 1)}</td><td class="num">${num(x.holdout_brier, 4)}</td><td class="num">${num(x.holdout_log_loss, 4)}</td><td class="num">${num(x.holdout_auc, 3)}</td><td class="num">${num(((r.exploratory_holdout_perm || {}).holm || {})[x.model], 3)}</td></tr>`).join("")}
    </table></div><p class="small muted">M0 frequenza storica · R1/R2 regole momentum/inversione ultima ora · M1 logistica set CORE · M1N CORE + nowcast/consensus · M2 logistica tutte le feature · M3 random forest · M4 LightGBM · M5 k-NN di regime.</p></div>`;
  // checkpoints
  const cps = ["T-3D", "T-24H", "T-4H", "T-1H", "T-30M", "T-5M"];
  const ch = r.selection.chosen;
  const cprows = cps.map((cp) => { const x = r.model_table.find((y) => y.checkpoint === cp && y.model === ch) || {}; return { name: cp, acc: x.all_accuracy, n: x.all_n, lo: null, hi: null }; });
  h += `<div class="grid2"><div class="card"><div class="label">ACCURATEZZA PER CHECKPOINT — ${esc(ch)}, TUTTO IL FUORI CAMPIONE 2013–2026</div>${barCI(cprows, { label: "name", value: "acc", lo: "lo", hi: "hi", n: "n" })}
    <p class="small muted">Stabilità: stessa direzione di T−1H → ${cps.map((cp) => `${cp} ${pct((r.checkpoint_stability[cp] || {})["same_direction_as_T-1H"], 0)}`).join(" · ")}</p></div>`;
  h += `<div class="card"><div class="label">CALIBRAZIONE (TUTTO IL FUORI CAMPIONE)</div><div style="max-width:320px">${reliabilityChart(r.oos_all.reliability)}</div>
    <p class="small muted">Ogni cerchio: eventi con probabilità prevista simile. Sulla diagonale = probabilità affidabili. Brier ${num(r.oos_all.metrics.brier, 4)}, log loss ${num(r.oos_all.metrics.log_loss, 4)}.</p></div></div>`;
  // buckets
  const bk = (ho.buckets || []).filter((b) => b.cumulative).map((b) => ({ ...b, name: "≥ " + Math.round(b.from * 100) + "%" }));
  const bk2 = (r.oos_all.buckets || []).filter((b) => b.cumulative).map((b) => ({ ...b, name: "≥ " + Math.round(b.from * 100) + "%" }));
  h += `<div class="grid2"><div class="card"><div class="label">SEGNALI PER SOGLIA — HOLDOUT 2020–2026</div>${barCI(bk, { label: "name", value: "hit_rate", lo: "wilson_lo", hi: "wilson_hi", n: "n" })}</div>
    <div class="card"><div class="label">SEGNALI PER SOGLIA — TUTTO IL FUORI CAMPIONE</div>${barCI(bk2, { label: "name", value: "hit_rate", lo: "wilson_lo", hi: "wilson_hi", n: "n" })}</div></div>`;
  // per year / regime
  const yr = r.oos_all.by_year.map((y) => ({ name: String(y.year), acc: y.accuracy, n: y.n }));
  h += `<div class="grid2"><div class="card"><div class="label">ACCURATEZZA PER ANNO (${esc(ch)})</div>${barCI(yr, { label: "name", value: "acc", lo: "x", hi: "x", n: "n", min: 0, max: 1 })}<p class="small muted">Ogni anno ha 9–12 eventi: una differenza di un solo CPI sposta l'accuratezza di 8–11 punti.</p></div>
    <div class="card"><div class="label">PER REGIME (ESPLORATIVO)</div>${barCI(r.oos_all.by_regime.map((x) => ({ ...x, name: x.regime, wlo: x.wilson ? x.wilson[0] : null, whi: x.wilson ? x.wilson[1] : null })), { label: "name", value: "accuracy", lo: "wlo", hi: "whi", n: "n", min: 0.2, max: 0.9, L: 250 })}</div></div>`;
  // H2 and ceiling
  const h2 = r.h2, sc = r.surprise_ceiling || {};
  h += `<div class="grid2"><div class="card"><div class="label">IPOTESI H2 — NOWCAST CLEVELAND FED MENO CONSENSUS</div>
    <div class="verdict ${h2.verdict === "PROMETTENTE" ? "pass" : "fail"}">${esc(h2.verdict)}</div>
    <p>${h2.signals} segnali su ${h2.events_with_gap} eventi con nowcast; direzione giusta ${h2.hits} volte (${pct(h2.hit_rate, 1)}, IC ${pct(h2.wilson[0], 0)}–${pct(h2.wilson[1], 0)}), p = ${num(h2.binom_p, 3)}. Holdout: ${pct(h2.holdout_hit_rate, 1)} su ${h2.holdout_signals}.</p>
    <p class="small muted">Meccanismo: correlazione fra scarto e sorpresa realizzata ρ = ${num((h2.mechanism_spearman_gap_vs_surprise || {}).rho)} (p ${num((h2.mechanism_spearman_gap_vs_surprise || {}).p, 3)}); lo scarto indovina il segno della sorpresa il ${pct((h2.gap_predicts_surprise_sign || {}).hit_rate, 0)} delle volte.</p></div>
    <div class="card"><div class="label">TETTO TEORICO — SE SI CONOSCESSE LA SORPRESA IN ANTICIPO</div>
    <p>Sapendo il segno della sorpresa (actual − consensus FF) la direzione della prima M1 si indovina il <b>${pct((sc.combined || {}).hit_rate, 1)}</b> delle volte (${(sc.combined || {}).n} eventi): ${pct((sc.combined_move_ge_20_pips || {}).hit_rate, 0)} quando l'oro si muove di almeno 20 pips, solo ${pct((sc.combined_move_lt_20_pips || {}).hit_rate, 0)} quando si muove meno. Release in linea: ${(sc.in_line_releases || {}).n} eventi, ${pct((sc.in_line_releases || {}).bullish_share, 0)} bullish.</p>
    <p class="small muted">È informazione post-release, usata solo come diagnostica: dice quanto è prevedibile il target nel migliore dei casi.</p></div></div>`;
  // magnitude
  const mg = r.magnitude;
  h += `<div class="card"><div class="label">MOVIMENTO (NON DIREZIONE): È PREVEDIBILE?</div>
    <p>Range della prima M1 in unità di ATR H1: mediana ${num(mg.range_atr_median)}. Previsione walk-forward (mediana storica × ATR attuale) contro il realizzato: Spearman ρ = ${num(mg.spearman_pred_vs_actual)} su ${mg.oos_n} eventi (p ${num(mg.p, 4)});
    ${pct(mg.share_within_50pct, 0)} dei casi entro ±50% della stima. Errore log mediano ${num(mg.median_abs_log_error_atr_model)} contro ${num(mg.median_abs_log_error_naive_pips)} della mediana fissa in pips.</p></div>`;
  // feature importance
  const fi = r.feature_importance || {};
  if (fi.M2_logistic_std_coef) {
    const row = (x) => `<tr><td>${esc(x.feature)}</td><td class="num">${num(x.value, 3)}</td></tr>`;
    h += `<div class="grid2"><div class="card"><div class="label">FEATURE IMPORTANCE — M2 (coefficienti standardizzati)</div><div class="table-wrap"><table class="tbl">${fi.M2_logistic_std_coef.slice(0, 12).map(row).join("")}</table></div></div>
      <div class="card"><div class="label">FEATURE IMPORTANCE — M3 (random forest)</div><div class="table-wrap"><table class="tbl">${fi.M3_forest_impurity.slice(0, 12).map(row).join("")}</table></div></div></div>
      <p class="small muted">Importanza = quanto il modello usa una feature, non quanto prevede: fuori campione nessun modello batte il caso, quindi queste classifiche non indicano segnali affidabili.</p>`;
  }
  if (r.posthoc_train_from_2013) {
    const ph = r.posthoc_train_from_2013;
    h += `<div class="card"><div class="label">CONTROLLO POST-HOC — ADDESTRAMENTO SOLO DAL 2013 (ESPLORATIVO, NON PRE-REGISTRATO)</div><div class="table-wrap"><table class="tbl">
      <tr><th>Modello</th><th class="num">Acc. holdout</th><th class="num">Balanced acc.</th><th class="num">AUC</th><th class="num">Brier</th><th class="num">p perm.</th></tr>
      ${Object.entries(ph).map(([k, x]) => `<tr><td>${k}</td><td class="num">${pct(x.accuracy, 1)}</td><td class="num">${pct(x.balanced_accuracy, 1)}</td><td class="num">${num(x.auc, 3)}</td><td class="num">${num(x.brier, 4)}</td><td class="num">${num(x.perm_p, 3)}</td></tr>`).join("")}
      </table></div><p class="small muted">Accuratezza vicina al 61% ma AUC sotto 0,5 e balanced accuracy 50%: i modelli dicono quasi sempre "sale" perché l'holdout è stato un periodo rialzista. Nessuna capacità di distinguere.</p></div>`;
  }
  // univariate
  const uv = r.univariate.slice(0, 20);
  h += `<div class="card"><div class="label">SCREENING UNIVARIATO (ESPLORATIVO) — SVILUPPO 2008–2019 E REPLICA SU HOLDOUT</div><div class="table-wrap"><table class="tbl">
    <tr><th>Feature</th><th class="num">ρ sviluppo</th><th class="num">p</th><th class="num">q (BH)</th><th class="num">ρ holdout</th><th>Stesso segno?</th></tr>
    ${uv.map((x) => `<tr><td>${esc(x.feature)}</td><td class="num">${num(x.rho_dev, 3)}</td><td class="num">${num(x.p_dev, 3)}</td><td class="num">${num(x.q_dev_bh, 3)}</td><td class="num">${num(x.rho_holdout, 3)}</td><td>${x.same_sign_holdout == null ? "" : x.same_sign_holdout ? "sì" : "no"}</td></tr>`).join("")}
    </table></div><p class="small muted">${r.univariate.length} feature testate: con tanti test, alcuni p &lt; 0,05 sono attesi per puro caso. Conta la colonna q e la replica sull'holdout.</p></div>`;
  // errors
  const pr = (r.oos_predictions || []).filter((x) => x.year >= 2020).sort((a, b) => Math.abs(b.p_cal - 0.5) - Math.abs(a.p_cal - 0.5)).slice(0, 12);
  h += `<div class="card"><div class="label">ANALISI DEGLI ERRORI — LE PREVISIONI PIÙ CONVINTE DELL'HOLDOUT</div><div class="table-wrap"><table class="tbl"><tr><th>Evento</th><th class="num">P(bull)</th><th>Previsto</th><th>Esito</th></tr>
    ${pr.map((x) => { const pd = x.p_cal >= 0.5 ? "BULLISH" : "BEARISH", od = x.y ? "BULLISH" : "BEARISH"; return `<tr><td>${esc(x.event_id)}</td><td class="num">${pct(x.p_cal, 1)}</td><td class="dir-${pd}">${pd}</td><td class="dir-${od}">${od} ${pd === od ? "✔" : "✘"}</td></tr>`; }).join("")}
    </table></div></div>`;
  box.innerHTML = h;
}

/* ---------- TRACK ---------- */
async function loadTrack() {
  const box = $("#track-body");
  let t;
  try { t = await api("/api/trackrecord"); } catch (e) { box.textContent = e.message; return; }
  box.innerHTML = `<div class="label">TRACK RECORD LIVE (IMMUTABILE)</div>
    <p>Integrità della catena di hash: ${t.chain_ok ? '<span class="pill ok">INTEGRA</span>' : `<span class="pill bad">ALTERATA alla riga ${esc(t.chain_broken_at)}</span>`} · ${t.n_predictions} previsioni registrate · ${t.outcomes.length} release risolte.</p>
    <p>Previsioni direzionali a T−1H valutabili: ${t.scored_t1h}, corrette ${t.hits_t1h}.</p>
    <div class="table-wrap"><table class="tbl"><tr><th>Evento</th><th>T−1H</th><th>Ultima pre-release</th><th>Esito reale</th><th class="num">Move</th><th class="num">Range</th><th>Qualità</th></tr>
    ${t.outcomes.map((o) => `<tr><td>${esc(o.event_id)}</td><td>${esc(o.t1h_bias || "—")} ${o.t1h_prob != null ? pct(o.t1h_prob) : ""}</td><td>${esc(o.final_bias || "—")}</td><td class="dir-${o.direction}">${esc(o.direction)}</td><td class="num">${num(o.move_pips, 0)}</td><td class="num">${num(o.range_pips, 0)}</td><td>${esc(o.quality)}</td></tr>`).join("") || '<tr><td colspan="7" class="muted">Nessuna release ancora risolta in LIVE MODE.</td></tr>'}
    </table></div>`;
}

/* ---------- SOURCES ---------- */
async function loadSources() {
  let s, hl, md;
  try { [s, hl, md] = await Promise.all([api("/api/sources"), api("/api/health"), api("/api/models")]); } catch (e) { $("#sources-body").textContent = e.message; return; }
  $("#sources-body").innerHTML = `<div class="table-wrap"><table class="tbl"><tr><th>Fonte</th><th>Stato</th><th>Ultimo successo</th><th>Frequenza / latenza</th><th>Storico</th><th>Point-in-time</th><th>Costo / limiti</th><th>Fallback</th></tr>
    ${s.map((x) => `<tr><td><b>${esc(x.name)}</b><div class="small muted">${esc(x.provider)} · ${esc(x.variables.join("; "))}</div><div class="small muted">${esc(x.endpoint)}</div>${x.notes ? `<div class="small">${esc(x.notes)}</div>` : ""}</td>
      <td>${statusPill(x.state)}<div class="small muted">${esc(x.detail)}</div></td><td class="small">${fmtShort((x.status_row || {}).last_success_utc)}</td>
      <td class="small">${esc(x.frequency)}<br>${esc(x.latency)}</td><td class="small">${esc(x.history)}</td><td class="small">${esc(x.point_in_time)}</td><td class="small">${esc(x.cost)}<br>${esc(x.limits)}</td><td class="small">${esc(x.fallback || "—")}</td></tr>`).join("")}
    </table></div>`;
  $("#system-body").innerHTML = `<p>Scheduler: ${hl.scheduler ? '<span class="pill ok">ATTIVO</span>' : '<span class="pill bad">SPENTO</span>'} · avviato ${fmtShort(hl.state.started)}</p>
    <div class="table-wrap"><table class="tbl"><tr><th>Job</th><th>Ultima esecuzione</th><th>Esito</th><th>Messaggio</th></tr>
    ${hl.jobs.map((j) => `<tr><td>${esc(j.job)}</td><td>${fmtShort(j.started_utc)}</td><td>${j.ok == null ? "in corso" : j.ok ? '<span class="pill ok">OK</span>' : '<span class="pill bad">ERRORE</span>'}</td><td class="small">${esc(j.message)}</td></tr>`).join("")}</table></div>
    <div class="label mt">MODELLI</div><div class="table-wrap"><table class="tbl"><tr><th>Versione</th><th>Stato</th><th>Algoritmo</th><th>Eventi training</th><th>OOS validato</th><th>Verdetto</th><th>Creato</th></tr>
    ${md.map((m) => `<tr><td>${esc(m.model_version)}</td><td>${esc(m.status)}</td><td>${esc(m.algo)}</td><td>${m.n_train}</td><td>${m.oos_validated ? "YES" : "NO"}</td><td>${esc(m.verdict)}</td><td>${fmtShort(m.created_utc)}</td></tr>`).join("")}</table></div>`;
}

$("#recalc").addEventListener("click", async () => {
  $("#recalc-msg").textContent = "calcolo in corso…";
  try {
    const r = await api("/api/recalculate", { method: "POST" });
    $("#recalc-msg").textContent = `fatto: ${r.recalculated.length} previsioni registrate`;
    loadDash();
  } catch (e) { $("#recalc-msg").textContent = "errore: " + e.message; }
});
loadDash();
setInterval(() => { if ($("#dash").classList.contains("on")) loadDash(); }, 20000);
