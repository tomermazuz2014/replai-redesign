// Renders the "does" scene at fixed points of its loop. Usage: node scene-shot.js <width> <height> <name> u1,u2,... [strip]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const [w, h, name, us, a = '0'] = process.argv.slice(2);
  const server = http.createServer((req, res) => { const f = path.join(__dirname, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.end(fs.readFileSync(f)); }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, reducedMotion: 'reduce' });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('#scene'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 110); });
  await page.waitForTimeout(700);
  const el = await page.$('#scene'); let i = 0;
  for (const u of us.split(',')) { await page.evaluate(([u, a]) => window.__scene.render(u, a, false), [+u, +a]); await page.waitForTimeout(350); await el.screenshot({ path: `shots/${name}-${i++}.png` }); }
  await browser.close(); server.close();
})();
