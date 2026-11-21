// Full-viewport capture with the scene playing at a given clip time. Usage: node full.js <w> <h> <name> <t>
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const [w, h, name, t] = process.argv.slice(2);
  const server = http.createServer((req, res) => {
    const f = path.join(__dirname, req.url.split('?')[0] === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    const buf = fs.readFileSync(f), range = req.headers.range, type = f.endsWith('.mp4') ? 'video/mp4' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream';
    if (range) { const [s, e] = range.replace('bytes=', '').split('-'); const a = +s, b = e ? +e : buf.length - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); return res.end(buf.subarray(a, b + 1)); }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': buf.length }); res.end(buf);
  }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('#does'); scrollTo(0, e.getBoundingClientRect().top + scrollY); });
  await page.waitForTimeout(1500);
  await page.evaluate(async (t) => { const v = window.__scene.v; v.pause(); v.currentTime = t; for (let k = 0; k < 100 && (v.seeking || v.readyState < 2); k++) await new Promise((r) => setTimeout(r, 40)); await new Promise((r) => setTimeout(r, 450)); }, +t);
  await page.screenshot({ path: `shots/${name}.png` });
  console.log(name, await page.evaluate(() => JSON.stringify({ secH: document.querySelector('#does').offsetHeight, vh: innerHeight })));
  await browser.close(); server.close();
})();
