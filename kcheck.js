const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
(async () => {
  const root = __dirname;
  const server = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } const buf = fs.readFileSync(f), range = req.headers.range, type = TYPES[path.extname(f)] || 'application/octet-stream'; if (range) { const [s, e] = range.replace('bytes=', '').split('-'); const a = +s, b = e ? +e : buf.length - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); return res.end(buf.subarray(a, b + 1)); } res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': buf.length }); res.end(buf); }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('[console] ' + m.text().slice(0, 200)); });
  await page.goto(`http://127.0.0.1:${server.address().port}/website/index.html`);
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({
    kiteMotion: !!window.KiteMotion,
    h2Words: document.querySelectorAll('h2 .m-word').length,
    h2Ready: [...document.querySelectorAll('h2.m-ready')].map((h) => h.textContent.trim().slice(0, 30)),
    windLayers: document.querySelectorAll('.m-wind').length,
    marquees: document.querySelectorAll('.m-marquee').length,
    cards: document.querySelectorAll('.capability-list article, .question-card').length,
    parallax: document.querySelectorAll('[data-m-parallax]').length,
    sectionsWithMotion: document.querySelectorAll('[data-m-section]').length,
    heroIntact: !!document.querySelector('#hero.hero--film .hero-film'),
    videoPlaying: (() => { const v = document.querySelector('#hero video'); return v && !v.paused; })(),
  }));
  // scroll to each section and check reveals
  const sections = ['wind', 'context', 'capabilities', 'questions'];
  const states = {};
  for (const id of sections) {
    await page.evaluate((id) => { const s = document.getElementById(id); if (s) s.scrollIntoView({ behavior: 'instant', block: 'center' }); }, id);
    await page.waitForTimeout(1000);
    states[id] = await page.evaluate((id) => {
      const s = document.getElementById(id); if (!s) return null;
      const h = s.querySelector('h2'); const ready = h ? h.classList.contains('m-ready') : null;
      const live = [...s.querySelectorAll('.m-live')].length;
      const rect = s.getBoundingClientRect();
      return { ready, live, h2: h && h.textContent.trim().slice(0, 30), top: Math.round(rect.top) };
    }, id);
  }
  console.log('base', JSON.stringify(r, null, 2));
  console.log('states', JSON.stringify(states, null, 2));
  console.log('errors', JSON.stringify(errs));
  await browser.close(); server.close();
})();
