const { chromium } = require('../../reel/node_modules/playwright-core'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage(); await p.goto('file://' + path.join(__dirname, 'programma.html')); await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: process.argv[2] || 'programma.pdf', format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<div></div>', footerTemplate: '<div style="font-size:7px;width:100%;text-align:center;color:#888;font-family:monospace">Dalla teoria alla realtà · @macro.algo.desk · <span class="pageNumber"></span>/<span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' } });
  await b.close();
})();
