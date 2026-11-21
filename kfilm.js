// Captures a Kite section with its film playing and reports what the scene shows. Usage: node kfilm.js <w> <h> <name> <selector> [rm]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.json': 'application/json', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };
(async () => {
  const [w, h, name, sel, rm] = process.argv.slice(2), root = __dirname;
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    const f = path.join(root, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    const buf = fs.readFileSync(f), type = TYPES[path.extname(f)] || 'application/octet-stream', range = req.headers.range;
    if (range) { const [s, e] = range.replace('bytes=', '').split('-'); const a = +s, b = e ? +e : buf.length - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); return res.end(buf.subarray(a, b + 1)); }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': buf.length }); res.end(buf);
  }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, reducedMotion: rm ? 'reduce' : 'no-preference' });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  await page.goto(`http://127.0.0.1:${server.address().port}/website/index.html`); await page.waitForTimeout(500);
  const before = await page.evaluate(() => [...document.querySelectorAll('.scene-film')].map((v) => ({ src: v.currentSrc.split('/').pop(), paused: v.paused, net: v.networkState })));
  await page.evaluate((s) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 40); }, sel);
  await page.waitForTimeout(3200);
  await page.screenshot({ path: `shots/${name}.png` });
  const after = await page.evaluate(() => [...document.querySelectorAll('.scene-film')].map((v) => ({ src: v.currentSrc.split('/').pop(), paused: v.paused, t: +v.currentTime.toFixed(2), filming: v.closest('.animated-scene').classList.contains('is-filming'), opacity: getComputedStyle(v).opacity })));
  console.log(name, 'before', JSON.stringify(before), '\n  after', JSON.stringify(after), 'errors', JSON.stringify(errs));
  await browser.close(); server.close();
})();
