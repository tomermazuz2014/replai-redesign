const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const server = http.createServer((req, res) => { const f = path.join(__dirname, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.end(fs.readFileSync(f)); }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/`); await page.waitForTimeout(400);
  console.log(await page.evaluate(() => { const h = document.querySelector('#doesT'), r = document.createRange(); r.selectNodeContents(h); return JSON.stringify({ textW: r.getBoundingClientRect().width, colW: h.getBoundingClientRect().width, fs: getComputedStyle(h).fontSize }); }));
  await browser.close(); server.close();
})();
