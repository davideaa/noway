// Renderizza noir/comp.html fotogramma per fotogramma (60 fps) in <cartella>/NNNN.jpg.
// Uso (dalla cartella noir/): node render.cjs out   ·   LIST="0 300 600" solo alcuni   ·   PARTE=0/4 divide il lavoro
const { chromium } = require('../node_modules/playwright-core'); const fs = require('fs'); const path = require('path');
(async () => {
  const dir = process.argv[2] || 'out'; fs.mkdirSync(dir, { recursive: true });
  const cpi = JSON.parse(fs.readFileSync(path.join(__dirname, 'cpi.json'), 'utf8'));
  const exe = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('file://' + path.join(__dirname, process.env.COMP || 'comp.html'));
  await p.evaluate((c) => { window.CPI = c; }, cpi);
  if (process.env.WARP) { const wp = JSON.parse(fs.readFileSync(process.env.WARP, 'utf8')); await p.evaluate((w) => { window.WARP = w; window.DUR = w[w.length - 1][0]; }, wp); }
  await p.evaluate(() => Promise.all(['800 50px Manrope', '700 50px Manrope', '600 50px Manrope', '500 50px Manrope', '600 50px "IBM Plex Mono"', '500 50px "IBM Plex Mono"'].map((f) => document.fonts.load(f))));
  await p.evaluate(() => document.fonts.ready);
  const FPS = 60, N = Math.round((await p.evaluate(() => window.DUR)) * FPS);
  let L = process.env.LIST ? process.env.LIST.split(' ').map(Number) : [...Array(N).keys()];
  if (process.env.PARTE) { const [a, k] = process.env.PARTE.split('/').map(Number); L = L.filter((i) => i % k === a); }
  const canvas = await p.$('canvas');
  for (const i of L) { await p.evaluate((t) => render(t), i / FPS); await canvas.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 93 }); }
  await b.close();
})();
