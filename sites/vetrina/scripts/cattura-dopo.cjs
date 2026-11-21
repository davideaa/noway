// Fotografa a pagina intera i siti "prima" (quelli originali dei clienti), da computer e da telefono.
// Copia di scripts/cattura.cjs per il sito NUOVO (agente confronto): in piu' forza il caricamento di tutte le foto.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const UA_PC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
// Il browser in questo ambiente perde richieste (ERR_TOO_MANY_RETRIES): le risorse le scarica curl.
function scarica(url) {
  const f = path.join(os.tmpdir(), 'cattura-' + Math.random().toString(36).slice(2));
  return new Promise(res => execFile('curl', ['-sS', '-L', '-m', '40', '--retry', '3', '-A', UA_PC, '-o', f, '-w', '%{content_type}|%{http_code}', url],
    (err, out) => {
      let body = null; try { body = fs.readFileSync(f); fs.unlinkSync(f); } catch (e) {}
      if (err || !body) return res(null);
      const [ct, code] = String(out).split('|');
      res({ body, ct: ct || 'application/octet-stream', status: +code || 200 });
    }));
}
(async () => {
  const [out, ...urls] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, h, tag, mobile] of [[1440, 900, 'pc', false], [390, 844, 'tel', true]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, ignoreHTTPSErrors: true, locale: 'it-IT',
      userAgent: mobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' : undefined });
    await ctx.route('**/*', async route => {
      const u = route.request().url();
      if (/googletagmanager|google-analytics|secureprivacy|facebook\.net|doubleclick|hotjar/.test(u)) return route.abort();
      if (!/^https:/.test(u) || route.request().method() !== 'GET') return route.continue();
      const r = await scarica(u);
      if (!r) return route.abort();
      return route.fulfill({ status: r.status, body: r.body, contentType: r.ct });
    });
    const pg = await ctx.newPage();
    for (const u of urls) {
      await pg.goto(u, { waitUntil: 'load', timeout: 90000 }).catch(e => console.log('timeout', u));
      // anche le foto dei caroselli orizzontali (fuori schermo di lato): tutte subito
      await pg.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; }));
      // scorre tutta la pagina per caricare le immagini pigre
      await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 450) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 350)); } window.scrollTo(0, 0); });
      await pg.waitForTimeout(4000);
      await pg.evaluate(() => Promise.race([new Promise(r => setTimeout(r, 15000)),
        Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))]));
      await pg.waitForTimeout(1500);
      if (process.env.ALTO) {   // pagine che mostrano le foto solo quando sono nello schermo
        const H = await pg.evaluate(() => document.documentElement.scrollHeight);
        await pg.setViewportSize({ width: w, height: Math.min(H, 12000) });
        await pg.waitForTimeout(5000);
      }
      // copertina: sempre la prima foto della presentazione (la facciata), non quella capitata in quell'istante
      if (await pg.$('.punti-diapo button')) { await pg.evaluate(() => document.querySelector('.punti-diapo button').click()); await pg.waitForTimeout(2500); }
      // decodifica sincrona: senza, nello scatto a pagina intera alcune foto restano vuote
      await pg.evaluate(async () => { const im = [...document.images]; im.forEach(i => { i.decoding = 'sync'; }); await Promise.all(im.map(i => i.decode ? i.decode().catch(() => {}) : 0)); });
      await pg.waitForTimeout(800);
      const nome = new URL(u).pathname.replace(/\//g, '_').replace(/^_|_$/g, '') || 'home';
      await pg.screenshot({ path: path.join(out, `${nome}-${tag}.png`), fullPage: true, timeout: 90000 });
      console.log('ok', tag, nome);
      if (process.env.ALTO) await pg.setViewportSize({ width: w, height: h });
    }
    await ctx.close();
  }
  await b.close();
})();
