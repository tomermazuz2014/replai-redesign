// Usage: node shot.js <width> <height> <name> [scrollSelector|y] [waitMs] [fullPage]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const [w, h, name, target = '0', wait = '5200', full = ''] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: process.env.RM ? 'reduce' : 'no-preference' });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto('file://' + __dirname + '/dist/replai-redesign.html');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  if (isNaN(+target)) await page.evaluate((s) => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 20); }, target);
  else await page.evaluate((y) => window.scrollTo(0, y), +target);
  if (process.env.TYPE) { await page.fill('#q', process.env.TYPE); }
  if (process.env.CLICK) { await page.click(process.env.CLICK); }
  await page.waitForTimeout(+wait);
  await page.screenshot({ path: `shots/${name}.png`, fullPage: !!full });
  const info = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth > innerWidth,
    docH: document.documentElement.scrollHeight,
    small: [...document.querySelectorAll('a,button,input')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44); }).map((e) => (e.textContent.trim() || e.id || e.className).slice(0, 24) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)),
    tiny: [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 12 && e.getBoundingClientRect().width > 0).length,
    sizes: [...new Set([...document.querySelectorAll('body *')].filter((e) => e.textContent.trim() && e.getBoundingClientRect().width > 0).map((e) => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10))].sort((a, b) => a - b),
  }));
  console.log(name, JSON.stringify(info), errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no console errors');
  await browser.close();
})();
