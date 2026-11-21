// Rende un reel visivo in MP4 muto (o un foglio provini per controllarlo).
// Uso:  node render.cjs storia.html reel.mp4            → video 1080×1920, 30 fps, senza audio
//       node render.cjs storia.html provini.jpg --provini → un fotogramma al 75% di ogni scena, affiancati
// Serve: Node, il pacchetto «playwright» (npm i playwright; npx playwright install chromium) e ffmpeg.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
(async () => {
  const [html, out] = process.argv.slice(2), provini = process.argv.includes('--provini'), FPS = 30;
  if (!html || !out) { console.log('uso: node render.cjs storia.html uscita.mp4 [--provini]'); process.exit(1); }
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', (e) => console.log('ERRORE nella pagina:', e.message));
  await p.goto('file://' + path.resolve(html) + '?render'); await p.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
  const dur = await p.evaluate(() => window.DUR), tempi = await p.evaluate(() => window.TEMPI), cv = await p.$('canvas');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-')); const L = provini ? tempi : [...Array(Math.ceil(dur * FPS)).keys()].map((i) => i / FPS);
  for (let i = 0; i < L.length; i++) { await p.evaluate((t) => window.render(t), L[i]); await cv.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 }); }
  await b.close();
  if (provini) execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(dir, '%05d.jpg'), '-vf', `scale=360:640,tile=${Math.min(6, L.length)}x${Math.ceil(L.length / 6)}`, '-frames:v', '1', out]);
  else execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', out]);
  fs.rmSync(dir, { recursive: true, force: true }); console.log(`fatto: ${out} (${dur.toFixed(1)} s, ${L.length} fotogrammi)`);
})();
