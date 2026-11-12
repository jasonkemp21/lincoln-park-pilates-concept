// QA crawl: list every link and control on every page and panel, click each control, and report anything that does nothing.
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs';
import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PAGE = 'file://' + (fs.existsSync(path.join(ROOT, 'site', 'index.html')) ? path.join(ROOT, 'site') : ROOT) + '/index.html';
const mode = process.argv[2] || 'desktop';
const vp = mode === 'phone' ? { width: 390, height: 844 } : { width: 1366, height: 860 };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: vp, isMobile: mode === 'phone', hasTouch: mode === 'phone', timezoneId: 'America/Chicago' });
const page = await ctx.newPage();
const problems = [], external = new Map(), internal = new Map(), errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('popup', p => p.close().catch(() => {}));
const URL0 = PAGE;
const VALID = ['home', 'new', 'classes', 'schedule', 'pricing', 'studio', 'events', 'faq', 'shop', 'admin', 'training', 'sauna', 'visit'];

const sig = () => page.evaluate(() => {
  // a hash of everything a visitor could see change: the whole document's markup, field values, the address and the scroll position
  let h = 0; const str = document.body.outerHTML + '|' + Array.from(document.querySelectorAll('input, select, textarea')).map(i => i.type === 'checkbox' || i.type === 'radio' ? i.checked : i.value).join(',');
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return location.hash + '|' + h + '|' + Math.round(window.scrollY) + '|' + (document.querySelector('.pitch__body') ? Math.round(document.querySelector('.pitch__body').scrollTop) : 0);
});
// every visible link and button inside a scope, described well enough to find again
const list = scope => page.evaluate(scope => {
  const root = document.querySelector(scope); if (!root) return [];
  return Array.from(root.querySelectorAll('a, button, summary, [role=button], input[type=submit]')).map((el, i) => {
    const r = el.getBoundingClientRect(), st = getComputedStyle(el);
    const visible = r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none' && !el.closest('[hidden]');
    return { selected: el.classList.contains('on') || el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-pressed') === 'true', i, tag: el.tagName.toLowerCase(), text: (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 60), href: el.getAttribute('href'), target: el.getAttribute('target'), rel: el.getAttribute('rel'), action: el.dataset.action || '', type: el.getAttribute('type') || '', visible, disabled: !!el.disabled, w: Math.round(r.width), h: Math.round(r.height) };
  });
}, scope);
async function setup(hash, prep) {
  await page.goto(URL0 + '#home'); await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(URL0 + hash); await page.reload(); await page.waitForTimeout(350);
  if (prep) { await prep(); await page.waitForTimeout(350); }
}
async function audit(name, hash, scope, prep) {
  await setup(hash, prep);
  const items = await list(scope);
  for (const it of items) {
    if (!it.visible) continue;
    const label = `[${mode}] ${name}: <${it.tag}> "${it.text}"`;
    if (it.tag === 'a') {
      if (!it.href) { problems.push(label + ' has no href'); continue; }
      if (it.href.startsWith('#')) { const h = it.href.slice(1); internal.set(it.href, (internal.get(it.href) || 0) + 1); if (!VALID.includes(h)) problems.push(label + ' points to unknown ' + it.href); }
      else if (/^https?:/.test(it.href)) { external.set(it.href, (external.get(it.href) || new Set()).add(name + ': ' + it.text)); if (it.target !== '_blank') problems.push(label + ' external link does not open a new tab'); if (!/noopener/.test(it.rel || '')) problems.push(label + ' external link lacks rel=noopener'); }
      else if (/^(mailto|sms|tel):/.test(it.href)) { external.set(it.href, (external.get(it.href) || new Set()).add(name + ': ' + it.text)); }
      else problems.push(label + ' odd href ' + it.href);
    }
    if (mode === 'phone' && (it.h < 30 || it.w < 30) && it.tag !== 'summary') problems.push(label + ` small tap target ${it.w}x${it.h}`);
  }
  // click each control from a fresh state and see whether anything happens
  for (const it of items) {
    if (!it.visible || it.disabled) continue;
    if (it.tag === 'a' && it.href && !it.href.startsWith('#')) continue;          // external and mailto links are checked by URL
    await setup(hash, prep);
    const el = page.locator(scope).locator('a, button, summary, [role=button], input[type=submit]').nth(it.i);
    const before = await sig();
    try { await el.click({ timeout: 2500 }); } catch (e) { problems.push(`[${mode}] ${name}: could not click <${it.tag}> "${it.text}" (${e.message.split('\n')[0].slice(0, 90)})`); continue; }
    await page.waitForTimeout(280);
    const after = await sig();
    const sameHashNav = it.tag === 'a' && it.href && it.href.startsWith('#') && ('#' + (before.split('|')[0].slice(1) || 'home')) === it.href;
    if (before === after && !sameHashNav && !it.selected) problems.push(`[${mode}] ${name}: nothing happens on <${it.tag}> "${it.text}"${it.action ? ' [' + it.action + ']' : ''}`);
  }
  // page-level checks
  const extra = await page.evaluate(() => {
    const out = []; const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
    Object.entries(ids).filter(([, n]) => n > 1).forEach(([id, n]) => out.push('duplicate id #' + id + ' x' + n));
    document.querySelectorAll('.page.on img, #sheet.on img').forEach(i => { if (!i.hasAttribute('alt')) out.push('image without alt: ' + i.getAttribute('src')); });
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push('page scrolls sideways');
    // every listed option has to carry its own way to act on it
    document.querySelectorAll('.page.on .rrow, .page.on .krow:not(.past), .page.on .elist > div, .page.on .ctable tbody tr, .page.on .cl, .page.on .ctile, .page.on .also > *, #sheet.on .cart-line').forEach(row => {
      const ok = row.matches('a, button') || Array.from(row.querySelectorAll('a, button')).some(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(b).visibility !== 'hidden'; });
      if (!ok) out.push('listed option with no button or link: "' + row.textContent.trim().replace(/\s+/g, ' ').slice(0, 70) + '"');
    });
    return out;
  });
  extra.forEach(x => problems.push(`[${mode}] ${name}: ${x}`));
}
const first = sel => async () => { await page.locator(sel).first().click(); };

// pages
for (const p of ['home', 'new', 'classes', 'schedule', 'pricing', 'studio', 'events', 'faq', 'shop']) await audit(p, '#' + p, `[data-page=${p}]`);
// chrome
await audit('offer bar + header', '#pricing', '.offerbar, .head');
await audit('footer', '#home', '.foot');
if (mode === 'phone') { await audit('phone menu', '#home', '#menu', first('.menu-btn')); await audit('phone book bar', '#home', '.bookbar'); }
await audit('concept tab', '#home', '.concept');
// sheets
await audit('booking sheet', '#schedule', '#sheet', async () => { await page.click('#days button[data-day="all"]'); await page.locator('#sched .krow:not(.past) [data-action=book]').first().click(); });
await audit('booking sheet, WellnessLiving path', '#schedule', '#sheet', async () => { await page.click('#days button[data-day="all"]'); await page.locator('#sched .krow:not(.past) [data-action=book]').first().click(); await page.click('#sheet .path[data-path=wl]'); });
await audit('booking confirmed', '#schedule', '#sheet', async () => { await page.click('#days button[data-day="all"]'); await page.locator('#sched .krow:not(.past) [data-action=book]').first().click(); await page.fill('#book-form [name=first]', 'A'); await page.fill('#book-form [name=last]', 'B'); await page.fill('#book-form [name=email]', 'a@example.com'); await page.click('#book-go'); });
await audit('your booking (already booked)', '#schedule', '#sheet', async () => { await page.click('#days button[data-day="all"]'); const b = page.locator('#sched .krow:not(.past) [data-action=book]').first(); await b.click(); await page.fill('#book-form [name=first]', 'A'); await page.fill('#book-form [name=last]', 'B'); await page.fill('#book-form [name=email]', 'a@example.com'); await page.click('#book-go'); await page.waitForTimeout(200); await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.locator('#sched .krow.mine [data-action=book]').first().click(); });
await audit('intro pack sheet', '#home', '#sheet', first('.offerbar [data-action=buy]'));
await audit('membership sheet, WellnessLiving path', '#pricing', '#sheet', async () => { await page.locator('#price-body [data-action=buy][data-plan=m12]').click(); await page.click('#sheet .path[data-path=wl]'); });
await audit('purchase confirmed', '#pricing', '#sheet', async () => { await page.locator('#price-body [data-action=buy][data-plan=p10]').click(); await page.fill('#buy-form [name=first]', 'A'); await page.fill('#buy-form [name=last]', 'B'); await page.fill('#buy-form [name=email]', 'a@example.com'); await page.click('#buy-go'); });
await audit('training request sheet', '#pricing', '#sheet', first('#pg-training [data-action=inq-training]'));
await audit('sauna request sheet', '#pricing', '#sheet', first('#pg-sauna [data-action=inq-sauna]'));
await audit('bag', '#shop', '#sheet', async () => { await page.locator('[data-action=add]').first().click(); await page.evaluate(() => document.getElementById('bag-btn').click()); });
await audit('checkout', '#shop', '#sheet', async () => { await page.locator('[data-action=add]').first().click(); await page.evaluate(() => document.getElementById('bag-btn').click()); await page.waitForTimeout(200); await page.click('[data-action=checkout]'); });
// pitch notes, each tab
for (const t of ['changed', 'model', 'today', 'plan', 'questions', 'inbox']) await audit('pitch notes: ' + t, '#home', '#pitch', async () => { await page.click('.concept button'); await page.waitForTimeout(200); await page.click(`.ptabs button[data-ptab=${t}]`); });
// staff portal
await audit('portal gate', '#admin', '[data-page=admin]');
await audit('portal people', '#admin', '[data-page=admin]', first('[data-do=in]'));
await audit('portal activity', '#admin', '[data-page=admin]', async () => { await page.click('[data-do=in]'); await page.click('[data-do=tab][data-v=activity]'); });
if (mode === 'phone') await audit('portal person sheet', '#admin', '#sheet', async () => { await page.click('[data-do=in]'); await page.locator('.prow').first().click(); });

// every wellnessliving link the site can produce, by plan
await setup('#pricing');
const wl = await page.evaluate(() => Array.from(document.querySelectorAll('[data-action=buy][data-plan]')).map(b => b.dataset.plan).filter((v, i, a) => a.indexOf(v) === i));
const wlLinks = {};
for (const id of wl) { await setup('#pricing'); await page.locator(`#price-body [data-action=buy][data-plan=${id}]`).first().click(); await page.waitForTimeout(250); wlLinks[id] = await page.locator('#wl-go').getAttribute('href'); }
await setup('#schedule'); await page.click('#days button[data-day="all"]'); await page.locator('#sched .krow:not(.past) [data-action=book]').first().click(); await page.waitForTimeout(250);
const cal = await (async () => { await page.fill('#book-form [name=first]', 'A'); await page.fill('#book-form [name=last]', 'B'); await page.fill('#book-form [name=email]', 'a@example.com'); await page.click('#book-go'); await page.waitForTimeout(250); return page.locator('a[href*="calendar.google.com"]').getAttribute('href'); })();

await browser.close();
const ext = {}; external.forEach((v, k) => { ext[k] = Array.from(v).slice(0, 4); });
fs.writeFileSync(path.join(ROOT, 'test', `crawl-${mode}.json`), JSON.stringify({ problems, errors, internal: Object.fromEntries(internal), external: ext, wlLinks, cal }, null, 1));
console.log(mode, 'problems:', problems.length, 'errors:', errors.length, 'external urls:', external.size);
console.log(problems.join('\n')); console.log(errors.join('\n'));
