const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
(async () => {
  const root = __dirname;
  const server = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f)); }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/website/index.html`);
  for (const t of [300, 1500, 3000]) { await page.waitForTimeout(t === 300 ? 300 : 1300); console.log(t, await page.evaluate(() => ({ live: document.querySelector('.hero-wind').className, op: getComputedStyle(document.querySelector('.hero-wind')).opacity, n: document.querySelectorAll('.hero-leaf').length, pos: [...document.querySelectorAll('.hero-leaf')].map((e) => e.style.transform.slice(12, 34)), size: [...document.querySelectorAll('.hero-leaf')].slice(0, 2).map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }) }))); }
  await page.mouse.move(400, 500); await page.mouse.move(900, 450, { steps: 8 }); await page.waitForTimeout(150);
  await page.screenshot({ path: 'shots/k-leaf2.png' });
  await browser.close(); server.close();
})();
