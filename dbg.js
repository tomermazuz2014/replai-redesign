const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const server = http.createServer((req, res) => { const f = path.join(__dirname, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.end(fs.readFileSync(f)); }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 760 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  console.log(await page.evaluate(() => { const g = document.querySelector('.hero__grid'), s = getComputedStyle(g), r = g.getBoundingClientRect(); return JSON.stringify({ pl: s.paddingLeft, w: r.width, x: r.x, mw: s.maxWidth, bs: s.boxSizing, ml: s.marginLeft, heroH: document.querySelector('.hero').getBoundingClientRect().height, copyX: document.querySelector('.hero__copy').getBoundingClientRect().x }); }));
  await browser.close(); server.close();
})();
