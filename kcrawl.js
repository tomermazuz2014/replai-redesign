// Loads every Kite website page (wide and narrow, scrolled through) and records which files are actually requested.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = process.argv[2], used = new Set(), miss = new Set();
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.json': 'application/json', '.ico': 'image/x-icon', '.md': 'text/plain', '.txt': 'text/plain' };
(async () => {
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
    const f = path.join(root, u);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { miss.add(u); res.writeHead(404); return res.end(); }
    used.add(u.replace(/^\//, '')); res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
  }).listen(0);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const pages = fs.readdirSync(path.join(root, 'website')).filter((f) => f.endsWith('.html'));
  for (const [w, h] of [[1440, 900], [390, 844]]) for (const pg of pages) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`http://127.0.0.1:${server.address().port}/website/${pg}`); await page.waitForTimeout(700);
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 700) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(120); }
    await page.waitForTimeout(400); await page.close();
  }
  await browser.close(); server.close();
  fs.writeFileSync('/home/claude/replai/kite-used.json', JSON.stringify([...used].sort(), null, 1));
  console.log('used', used.size, 'missing', JSON.stringify([...miss]));
})();
