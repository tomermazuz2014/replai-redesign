// Interaction test: mobile menu, and the Plai hotspot (sleep -> wake -> sit -> catch -> sit).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const miss = [];
  const server = http.createServer((req, res) => {
    const f = path.join(__dirname, req.url.split('?')[0] === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
    if (!fs.existsSync(f)) { miss.push(req.url); res.writeHead(404); return res.end(); }
    const buf = fs.readFileSync(f), range = req.headers.range, type = f.endsWith('.mp4') ? 'video/mp4' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream';
    if (range) { const [s, e] = range.replace('bytes=', '').split('-'); const a = +s, b = e ? +e : buf.length - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); return res.end(buf.subarray(a, b + 1)); }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': buf.length }); res.end(buf);
  }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const url = `http://127.0.0.1:${server.address().port}/`;
  // mobile menu
  let page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url); await page.click('#menuBtn'); await page.waitForTimeout(500); await page.screenshot({ path: 'shots/it-menu.png' });
  await page.close();
  // hotspot
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(url); await page.waitForTimeout(800);
  const st = () => page.evaluate(() => ({ cur: window.__heroClip.cur, t: +window.__heroClip.clips[window.__heroClip.cur].currentTime.toFixed(2), plai: !document.querySelector('#heroPlai').hidden, label: document.querySelector('#heroReplay').textContent.trim() }));
  await page.evaluate(() => window.__heroClip.show(2)); await page.waitForTimeout(1200); console.log('sleeping', JSON.stringify(await st()));
  await page.click('#heroPlai'); await page.waitForTimeout(1500); console.log('after click', JSON.stringify(await st())); await page.screenshot({ path: 'shots/it-wake.png' });
  await page.waitForTimeout(5200); console.log('after wake ends', JSON.stringify(await st()));
  await page.mouse.move(100, 100); await page.click('#heroPlai'); await page.waitForTimeout(2600); console.log('after second click', JSON.stringify(await st())); await page.screenshot({ path: 'shots/it-catch.png' });
  await page.waitForTimeout(3200); console.log('after catch ends', JSON.stringify(await st()));
  await page.click('#heroReplay'); await page.waitForTimeout(900); console.log('after replay', JSON.stringify(await st()));
  console.log('missing files', JSON.stringify(miss), 'errors', JSON.stringify(errs));
  await browser.close(); server.close();
})();
