// Where does the ink of the heading and of the first paragraph start? (top edge of the glyphs, in page px)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const [w, h] = process.argv.slice(2);
  const server = http.createServer((req, res) => { const f = path.join(__dirname, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.end(fs.readFileSync(f)); }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, reducedMotion: 'reduce' });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.addStyleTag({ content: '.nav,.drone{display:none!important}' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#does').getBoundingClientRect().top + scrollY); });
  await page.waitForTimeout(500);
  const out = {};
  for (const [k, sel] of [['h2', '#doesT'], ['p', '.does__copy p']]) {
    const el = await page.$(sel); const box = await el.boundingBox(); const buf = await el.screenshot();
    const top = await page.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) { const o = (y * c.width + i) * 4; if (d[o] + d[o + 1] + d[o + 2] < 300) return y; } return -1; }, buf.toString('base64'));
    out[k] = { boxTop: +box.y.toFixed(1), inkTop: +(box.y + top).toFixed(1), h: +box.height.toFixed(1), w: +box.width.toFixed(1), fs: await el.evaluate((e) => getComputedStyle(e).fontSize) };
  }
  console.log(JSON.stringify(out));
  await browser.close(); server.close();
})();
