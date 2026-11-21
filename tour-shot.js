// Captures the tour section: lets a tab play for a while, then screenshots. Usage: node tour-shot.js <w> <h> <name> <tab> <ms> [rm]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const [w, h, name, tab, ms, rm] = process.argv.slice(2);
  const server = http.createServer((req, res) => {
    const f = path.join(__dirname, req.url.split('?')[0] === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    const buf = fs.readFileSync(f), range = req.headers.range, type = f.endsWith('.mp4') ? 'video/mp4' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream';
    if (range) { const [s, e] = range.replace('bytes=', '').split('-'); const a = +s, b = e ? +e : buf.length - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); return res.end(buf.subarray(a, b + 1)); }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': buf.length }); res.end(buf);
  }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, reducedMotion: rm ? 'reduce' : 'no-preference' });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('#tour'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 10); });
  await page.waitForTimeout(600);
  await page.click(`#tt${tab}`); await page.waitForTimeout(+ms);
  await page.screenshot({ path: `shots/${name}.png` });
  console.log(name, 'overflowX', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'errors', JSON.stringify(errs));
  await browser.close(); server.close();
})();
