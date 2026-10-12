// Guarda il sito di ogni contatto come lo vede un cliente: prima schermata da telefono e da computer, più alcune prove.
// Uso: node scripts/guarda.cjs dati/lead-*.json   -> dati/schermate/<id>-tel.png, <id>-pc.png e dati/visti.json
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const { execFile } = require('child_process');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const UA_TEL = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
function scarica(url, ua) {   // il browser qui perde richieste attraverso il proxy: le scarica curl
  const f = path.join(os.tmpdir(), 'guarda-' + Math.random().toString(36).slice(2));
  return new Promise(res => execFile('curl', ['-sS', '-L', '-m', '30', '--retry', '2', '-A', ua, '-o', f, '-w', '%{content_type}|%{http_code}', url], (err, out) => {
    let body = null; try { body = fs.readFileSync(f); fs.unlinkSync(f); } catch (e) {}
    if (err || !body) return res(null);
    const [ct, code] = String(out).split('|'); res({ body, ct: ct || 'application/octet-stream', status: +code || 200 });
  }));
}
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const QUI = path.join(__dirname, '..', 'dati'), SCH = path.join(QUI, 'schermate'); fs.mkdirSync(SCH, { recursive: true });
  const lead = process.argv.slice(2).flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')));
  const vistiF = path.join(QUI, 'visti.json'); const visti = fs.existsSync(vistiF) ? JSON.parse(fs.readFileSync(vistiF, 'utf8')) : {};
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const l of lead) {
    if (visti[l.id] && !process.env.RIFAI) continue;
    const v = {};
    for (const [tag, w, h, tel] of [['tel', 390, 844, true], ['pc', 1440, 900, false]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: tel ? 2 : 1, isMobile: tel, hasTouch: tel, locale: 'it-IT', ignoreHTTPSErrors: true, userAgent: tel ? UA_TEL : UA });
      await ctx.route('**/*', async route => {
        const u = route.request().url();
        if (/googletagmanager|google-analytics|facebook\.net|doubleclick|hotjar|clarity\.ms/.test(u)) return route.abort();
        if (!/^https?:/.test(u) || route.request().method() !== 'GET') return route.continue();
        const r = await scarica(u, tel ? UA_TEL : UA); if (!r) return route.abort();
        return route.fulfill({ status: r.status, body: r.body, contentType: r.ct });
      });
      const pg = await ctx.newPage();
      try {
        await pg.goto(l.sito, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
        await wait(3500);
        const x = await pg.evaluate(() => {
          const vp = document.querySelector('meta[name=viewport]');
          const testo = document.body ? document.body.innerText : '';
          return {
            titolo: document.title, viewport: vp ? vp.content : null,
            larghezza_pagina: document.documentElement.scrollWidth, larghezza_schermo: innerWidth,
            copyright: (testo.match(/(©|copyright)[^\n]{0,60}/gi) || []).slice(0, 2),
            anni_nel_testo: [...new Set((testo.match(/\b20(0\d|1\d|2[0-5])\b/g) || []))].sort(),
            corpo_testo_px: getComputedStyle(document.body).fontSize,
          };
        });
        v[tag] = x;
        await pg.screenshot({ path: path.join(SCH, `${l.id}-${tag}.png`) });
        if (tel) { await pg.evaluate(() => scrollBy(0, innerHeight * 1.5)); await wait(1500); await pg.screenshot({ path: path.join(SCH, `${l.id}-tel2.png`) }); }
      } catch (e) { v[tag] = { errore: String(e).slice(0, 200) }; }
      await ctx.close();
    }
    visti[l.id] = v; fs.writeFileSync(vistiF, JSON.stringify(visti, null, 1));
    console.log(l.id, JSON.stringify(v.tel && { vp: v.tel.viewport, w: v.tel.larghezza_pagina, c: v.tel.copyright, t: v.tel.titolo }));
  }
  await b.close();
})();
