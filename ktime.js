// node ktime.js <w> <h> <name> t1,t2,...  -> screenshots when the hero film reaches each time
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
(async () => {
  const [w, h, name, ts] = process.argv.slice(2), root = __dirname;
  const server = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    const buf = fs.readFileSync(f), type = TYPES[path.extname(f)] || 'application/octet-stream', range = req.headers.range;
    if (range) { const [s, e] = range.replace('bytes=', '').split('-'); const a = +s, b = e ? +e : buf.length - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); return res.end(buf.subarray(a, b + 1)); }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': buf.length }); res.end(buf); }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  await page.goto(`http://127.0.0.1:${server.address().port}/website/index.html`);
  for (const t of ts.split(',').map(Number)) {
    await page.waitForFunction((t) => { const v = document.querySelector('#hero video'); return v && !v.paused && v.currentTime >= t && v.currentTime < t + 0.6; }, t, { timeout: 30000, polling: 40 });
    await page.screenshot({ path: `shots/${name}-${String(t).replace('.', '_')}.png` });
  }
  await browser.close(); server.close(); console.log('done', name);
})();
