// Checks the hero film: node khero.js <w> <h> <name> [rm]  -> shots/<name>.png + play state, clearance between copy and kite, overflow
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.json': 'application/json', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };
(async () => {
  const [w, h, name, rm] = process.argv.slice(2), root = __dirname, miss = [];
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    const f = path.join(root, u); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { miss.push(u); res.writeHead(404); return res.end(); }
    const buf = fs.readFileSync(f), type = TYPES[path.extname(f)] || 'application/octet-stream', range = req.headers.range;
    if (range) { const [s, e] = range.replace('bytes=', '').split('-'); const a = +s, b = e ? +e : buf.length - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); return res.end(buf.subarray(a, b + 1)); }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': buf.length }); res.end(buf);
  }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, reducedMotion: rm ? 'reduce' : 'no-preference' });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  await page.goto(`http://127.0.0.1:${server.address().port}/website/index.html`); await page.waitForTimeout(3600);
  await page.screenshot({ path: `shots/${name}.png` });
  const r = await page.evaluate(() => {
    const hero = document.querySelector('#hero'), v = hero.querySelector('video'), film = hero.querySelector('.hero-film'), d = hero.querySelector('.hero-description').getBoundingClientRect(), f = film.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    return { src: v.currentSrc.split('/').pop(), paused: v.paused, t: +v.currentTime.toFixed(2), filming: film.classList.contains('is-filming'), videoOpacity: getComputedStyle(v).opacity, heroBottom: Math.round(hr.bottom), viewport: innerHeight, film: [Math.round(f.width), Math.round(f.height)], bleed: film.hasAttribute('data-bleed'), kiteHighest: Math.round(f.top + f.height * 0.30), copyBottom: Math.round(d.bottom), clearance: Math.round(f.top + f.height * 0.30 - d.bottom), hScroll: document.documentElement.scrollWidth > innerWidth };
  });
  await page.evaluate(() => scrollTo(0, 300)); await page.waitForTimeout(300);
  r.driftAt300 = await page.evaluate(() => document.querySelector('.hero-film-drift').style.transform);
  console.log(name, JSON.stringify(r), 'missing', JSON.stringify(miss), 'errors', JSON.stringify(errs));
  await browser.close(); server.close();
})();
