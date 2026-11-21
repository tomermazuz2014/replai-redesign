const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const server = http.createServer((req, res) => { const f = path.join(__dirname, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.end(fs.readFileSync(f)); }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const [name, tab, ms, rm] of [['m0', 0, 9800, 0], ['m2', 2, 9000, 0], ['m3', 3, 1200, 1]]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: rm ? 'reduce' : 'no-preference' });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('.tour__tabs'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 90); });
    await page.waitForTimeout(500); await page.click(`#tt${tab}`); await page.waitForTimeout(ms);
    await page.evaluate(() => { const e = document.querySelector('#map'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 330); });
    await page.waitForTimeout(300); await page.screenshot({ path: `shots/${name}.png` }); await page.close();
  }
  await browser.close(); server.close();
})();
