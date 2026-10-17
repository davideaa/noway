// Renderizza scene.json fotogramma per fotogramma (60 fps) in out/NNNN.jpg.
// Uso: node render.cjs [cartella]   ·   LIST="0 60 120" solo alcuni fotogrammi   ·   FROM=1200 da un punto
//      PARTE=0/4 … PARTE=3/4 divide il lavoro su 4 processi in parallelo
const { chromium } = require('playwright-core'); const fs = require('fs');
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
(async () => {
  const S = J(process.env.SCENE || 'scene.json');
  S.forEach((s, i) => { const d = 'f/' + String(i).padStart(2, '0'); if (fs.existsSync(d)) s.n = fs.readdirSync(d).length; });
  const D = Object.fromEntries(['curve', 'mc', 'storia', 'extra', 'globo-punti', 'dati2', 'dati3'].map((k) => [k, J(`dati/${k}.json`)]));
  const dir = process.argv[2] || 'out'; fs.mkdirSync(dir, { recursive: true });
  const FPS = 60, N = Math.round(S[S.length - 1].t1 * FPS);
  let L = process.env.LIST ? process.env.LIST.split(' ').map(Number) : [...Array(N).keys()].filter((i) => !process.env.FROM || i >= +process.env.FROM);
  if (process.env.PARTE) { const [a, b] = process.env.PARTE.split('/').map(Number); L = L.filter((i) => i % b === a); }
  const exe = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('file://' + process.cwd() + '/comp.html');
  await p.evaluate(([s, d]) => { S = s; window.CURVE = d.curve; window.MC = d.mc; window.STORIA = d.storia; window.EXTRA = d.extra; window.GLOBO = d['globo-punti']; window.D2 = d.dati2; window.D3 = d.dati3; window.SMOOTH = true; }, [S, D]);
  await p.evaluate(() => Promise.all(['800 50px Manrope', '700 50px Manrope', '600 50px Manrope', '700 50px "IBM Plex Mono"', '600 50px "IBM Plex Mono"', '500 50px "IBM Plex Mono"'].map((f) => document.fonts.load(f))));
  await p.evaluate(() => document.fonts.ready);
  const t0 = Date.now();
  for (const i of L) { await p.evaluate((t) => render(t), i / FPS); await p.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 93 }); }
  console.log('fatto', (Date.now() - t0) / 1000, 's'); await b.close();
})();
