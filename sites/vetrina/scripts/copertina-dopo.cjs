// Fotografa la PRIMA SCHERMATA (1440x900) del sito "dopo": serve per l'anteprima del riquadro nella vetrina.
// Uso: node scripts/copertina-dopo.cjs <file .html o url> <uscita.png> [attesa in ms, predefinita 4000]
// Il sito si apre senza rete (i "dopo" a pagina unica hanno tutto dentro).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const [src, out, attesa] = process.argv.slice(2);
  const url = /^https?:|^file:/.test(src) ? src : 'file://' + path.resolve(src);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'it-IT' });
  await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, r => r.abort());
  const pg = await ctx.newPage();
  await pg.goto(url, { waitUntil: 'load' });
  await pg.waitForTimeout(+attesa || 4000);
  await pg.screenshot({ path: out });
  console.log('ok', out);
  await b.close();
})();
