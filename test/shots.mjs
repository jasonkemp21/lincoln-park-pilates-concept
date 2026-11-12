// Screenshot every page at desktop and phone widths; report console errors and failed requests.
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs';
import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PAGE = 'file://' + (fs.existsSync(path.join(ROOT, 'site', 'index.html')) ? path.join(ROOT, 'site') : ROOT) + '/index.html';
const out = process.argv[2] || path.join(ROOT, 'test', 'out');
fs.mkdirSync(out, { recursive: true });
const pages = ['home', 'new', 'classes', 'schedule', 'pricing', 'studio', 'events', 'faq', 'shop', 'admin'];
const browser = await chromium.launch();
const errors = [];
for (const [name, vp] of [['desktop', { width: 1366, height: 860 }], ['phone', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: name === 'phone', hasTouch: name === 'phone', timezoneId: 'America/Chicago' });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(name + ' console.' + m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push(name + ' pageerror: ' + e.message));
  page.on('requestfailed', r => errors.push(name + ' requestfailed: ' + r.url().slice(0, 120) + ' ' + (r.failure() || {}).errorText));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  for (const p of pages) {
    await page.evaluate(h => { location.hash = h; }, '#' + p);
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${out}/${name}-${p}-fold.png` });
    await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 250)); });
    await page.screenshot({ path: `${out}/${name}-${p}-full.png`, fullPage: true });
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    if (w > vp.width + 1) errors.push(`${name} ${p}: horizontal overflow, scrollWidth ${w}`);
  }
  // pitch notes
  await page.evaluate(() => { location.hash = '#home'; });
  await page.click('.concept button');
  await page.waitForTimeout(500);
  for (const t of ['changed', 'model', 'today', 'plan', 'questions', 'inbox']) {
    await page.click(`.ptabs button[data-ptab=${t}]`);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/${name}-pitch-${t}.png` });
  }
  await page.keyboard.press('Escape');
  await ctx.close();
}
await browser.close();
fs.writeFileSync(out + '/errors.txt', errors.join('\n'));
console.log(errors.length ? errors.join('\n') : 'no errors');
