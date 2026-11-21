// Usage: node shot.js <width> <height> <name> [scrollSelector|y] [waitMs]   env: SEEK=<seconds> RM=1 TYPE=... CLICK=...
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const types = { '.html': 'text/html', '.mp4': 'video/mp4', '.webp': 'image/webp', '.png': 'image/png' };
(async () => {
  const [w, h, name, target = '0', wait = '5200'] = process.argv.slice(2);
  const server = http.createServer((req, res) => {
    const f = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(__dirname) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    const buf = fs.readFileSync(f); const range = req.headers.range;
    if (range) { const [s, e] = range.replace('bytes=', '').split('-'); const a = +s, b = e ? +e : buf.length - 1;
      res.writeHead(206, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Content-Range': `bytes ${a}-${b}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); return res.end(buf.subarray(a, b + 1)); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Content-Length': buf.length }); res.end(buf);
  }).listen(0);
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: process.env.RM ? 'reduce' : 'no-preference' });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  if (isNaN(+target)) await page.evaluate((s) => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 20); }, target);
  else await page.evaluate((y) => window.scrollTo(0, y), +target);
  if (process.env.TYPE) await page.fill('#q', process.env.TYPE);
  if (process.env.CLICK) await page.click(process.env.CLICK);
  await page.waitForTimeout(+wait);
  let clip = null;
  if (process.env.SEEK) clip = await page.evaluate(async ([i, t]) => {
    const h = window.__heroClip; if (!h) return 'no clip handle';
    h.clips.forEach((v) => { if (!v.src && v.dataset.src) v.src = v.dataset.src; });
    h.show(i); const v = h.clips[i];
    const until = async (f) => { for (let k = 0; k < 150 && !f(); k++) await new Promise((r) => setTimeout(r, 50)); };
    await until(() => v.readyState >= 2 && !v.seeking); v.pause(); v.currentTime = t;
    await until(() => !v.seeking && v.readyState >= 2 && Math.abs(v.currentTime - t) < .1);
    await new Promise((r) => setTimeout(r, 250)); v.pause(); h.draw(true); return 'clip ' + i + ' @ ' + v.currentTime.toFixed(2);
  }, process.env.SEEK.split(':').length > 1 ? process.env.SEEK.split(':').map(Number) : [0, +process.env.SEEK]);
  await page.screenshot({ path: `shots/${name}.png` });
  const info = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth > innerWidth, docH: document.documentElement.scrollHeight,
    live: document.querySelector('#heroFx')?.classList.contains('is-live'), cur: window.__heroClip ? window.__heroClip.cur : null,
    small: [...document.querySelectorAll('a,button,input')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44); }).map((e) => (e.textContent.trim() || e.id).slice(0, 20)),
    tiny: [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 12 && e.getBoundingClientRect().width > 0).length,
  }));
  console.log(name, JSON.stringify(info), clip || '', errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no console errors');
  await browser.close(); server.close();
})();
