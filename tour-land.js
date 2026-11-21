const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const server = http.createServer((req, res) => { const f = path.join(__dirname, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.end(fs.readFileSync(f)); }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const [name, w, h, tab] of [['ld0', 852, 393, 0], ['ld2', 852, 393, 2], ['ld3', 740, 340, 3]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('.tour__tabs'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 66); });
    await page.waitForTimeout(500); await page.click(`#tt${tab}`); await page.waitForTimeout(8500);
    await page.screenshot({ path: `shots/${name}.png` }); await page.close();
  }
  await browser.close(); server.close();
})();
