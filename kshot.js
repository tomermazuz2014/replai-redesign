// Screenshot tool for the Kite kit. Usage: node kshot.js <root> <page> <w> <h> <name> [full|y|#selector] [waitMs] [rm]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf', '.json': 'application/json', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
(async () => {
  const [root, pg, w, h, name, where = '0', ms = '1500', rm] = process.argv.slice(2);
  const miss = [];
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    const f = path.join(root, u);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { miss.push(u); res.writeHead(404); return res.end(); }
    const buf = fs.readFileSync(f), type = TYPES[path.extname(f)] || 'application/octet-stream', range = req.headers.range;
    if (range) { const [s, e] = range.replace('bytes=', '').split('-'); const a = +s, b = e ? +e : buf.length - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); return res.end(buf.subarray(a, b + 1)); }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': buf.length }); res.end(buf);
  }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, reducedMotion: rm ? 'reduce' : 'no-preference' });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.goto(`http://127.0.0.1:${server.address().port}/${pg}`);
  await page.waitForTimeout(600);
  if (where === 'full') { await page.waitForTimeout(+ms); await page.screenshot({ path: `/home/claude/replai/shots/${name}.png`, fullPage: true }); }
  else {
    await page.evaluate((wh) => { document.documentElement.style.scrollBehavior = 'auto'; if (wh.startsWith('#') || wh.startsWith('.')) { const e = document.querySelector(wh); scrollTo(0, e.getBoundingClientRect().top + scrollY); } else scrollTo(0, +wh); }, where);
    await page.waitForTimeout(+ms); await page.screenshot({ path: `/home/claude/replai/shots/${name}.png` });
  }
  console.log(name, 'missing', JSON.stringify(miss), 'errors', JSON.stringify(errs));
  await browser.close(); server.close();
})();
