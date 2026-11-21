// Plays the scene for real and captures it at given clip times. Usage: node scene-live.js <w> <h> <name> t1,t2,...
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const [w, h, name, ts] = process.argv.slice(2);
  const server = http.createServer((req, res) => {
    const f = path.join(__dirname, req.url.split('?')[0] === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    const buf = fs.readFileSync(f), range = req.headers.range, type = f.endsWith('.mp4') ? 'video/mp4' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream';
    if (range) { const [s, e] = range.replace('bytes=', '').split('-'); const a = +s, b = e ? +e : buf.length - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); return res.end(buf.subarray(a, b + 1)); }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': buf.length }); res.end(buf);
  }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('#scene'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 110); });
  await page.waitForTimeout(1500);
  const el = await page.$('#scene'); let i = 0;
  for (const t of ts.split(',')) {
    await page.evaluate(async (t) => { const v = window.__scene.v; v.pause(); v.currentTime = t; for (let k = 0; k < 100 && (v.seeking || v.readyState < 2); k++) await new Promise((r) => setTimeout(r, 40)); await new Promise((r) => setTimeout(r, 450)); }, +t);
    await el.screenshot({ path: `shots/${name}-${i++}.png` });
  }
  console.log(name, 'live', await page.evaluate(() => document.querySelector('#scene').className), 'errors', JSON.stringify(errs));
  await browser.close(); server.close();
})();
