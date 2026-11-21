// Still-only screenshots of the hero (film blocked): node kstill.js <w> <h> <name>
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
(async () => {
  const [w, h, name] = process.argv.slice(2), root = __dirname;
  const server = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, u); if (u.endsWith('.mp4') || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f)); }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  await page.goto(`http://127.0.0.1:${server.address().port}/website/index.html`); await page.waitForTimeout(1800);
  await page.screenshot({ path: `shots/${name}.png` });
  console.log(name, await page.evaluate(() => { const h = document.querySelector('#hero').getBoundingClientRect(); return [Math.round(h.bottom), innerHeight, document.documentElement.scrollWidth > innerWidth]; }));
  await browser.close(); server.close();
})();
