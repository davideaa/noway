const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const FPS = 30, N = Math.round(29.9 * FPS);
  let frames = process.env.LIST ? process.env.LIST.split(' ').map(Number) : [...Array(N).keys()];
  if (process.env.PARTE) { const [k, n] = process.env.PARTE.split('/').map(Number); frames = frames.filter((_, i) => i % n === k); }
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', (e) => console.log('ERR', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto('file://' + path.resolve(__dirname, 'reel.html')); await p.waitForFunction(() => window.READY === true);
  const c = await p.$('canvas');
  for (const f of frames) { await p.evaluate((t) => window.seek(t), f / FPS); await c.screenshot({ path: path.join(out, String(f).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 93 }); }
  await b.close();
})();
