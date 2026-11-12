// Click through the simulated flows and check each outcome.
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs';
import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PAGE = 'file://' + (fs.existsSync(path.join(ROOT, 'site', 'index.html')) ? path.join(ROOT, 'site') : ROOT) + '/index.html';
const out = process.argv[2] || path.join(ROOT, 'test', 'flows');
const mode = process.argv[3] || 'desktop';
fs.mkdirSync(out, { recursive: true });
const vp = mode === 'phone' ? { width: 390, height: 844 } : { width: 1366, height: 860 };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: vp, isMobile: mode === 'phone', hasTouch: mode === 'phone', timezoneId: 'America/Chicago' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const shot = n => page.screenshot({ path: `${out}/${mode}-${n}.png` });
const check = async (cond, msg) => { try { if (!(await cond())) errors.push('FAIL ' + msg); } catch (e) { errors.push('FAIL ' + msg + ' (' + e.message.split('\n')[0] + ')'); } };
const go = async h => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(300); };
const fill = async (form, o) => { for (const [k, v] of Object.entries(o)) await page.fill(`${form} [name=${k}]`, v); };
page.setDefaultTimeout(5000);

await page.goto(PAGE, { waitUntil: 'load' });
await page.waitForTimeout(900);

// home: header is clear over the hero, solid after scrolling
await check(async () => await page.evaluate(() => document.body.classList.contains('over')), 'header clear over hero');
await page.evaluate(() => window.scrollTo(0, 1200)); await page.waitForTimeout(200);
await check(async () => !(await page.evaluate(() => document.body.classList.contains('over'))), 'header solid after scroll');
await page.evaluate(() => window.scrollTo(0, 0));

// first row of today's list books
await check(async () => { const n = await page.locator('#today-list .krow').count(); return n >= 1 && n <= 5; }, 'today list shows 1 to 5 rows');
await page.locator('#today-list .krow [data-action=book]').first().click(); await page.waitForTimeout(500); await shot('01-book-sheet');
await check(async () => (await page.locator('#sheet .path').count()) === 2 && await page.locator('#book-form').isVisible(), 'booking offers quick sign-up and WellnessLiving');
await page.click('#sheet .path[data-path=wl]'); await page.waitForTimeout(150);
await check(async () => (await page.locator('#wl-go').getAttribute('href')) === 'https://www.wellnessliving.com/schedule/lincolnparkpilates' && !(await page.locator('#book-form').isVisible()), 'WellnessLiving path links to the live schedule');
await page.evaluate(() => { const a = document.getElementById('wl-go'); a.removeAttribute('href'); a.click(); }); await page.waitForTimeout(150);
await check(async () => await page.evaluate(() => window.__lpp.STATE.events.filter(e => e.kind === 'WellnessLiving' && !e.sample).length === 1), 'click-through is logged for the front desk');
await page.click('#sheet .path[data-path=quick]'); await page.waitForTimeout(150);
await page.click('#book-go'); await page.waitForTimeout(200);
await check(async () => (await page.locator('.field--err').count()) >= 3, 'validation flags empty fields');
await fill('#book-form', { first: 'Jason', last: 'Kemp', email: 'jason@example.com' }); await page.check('#book-form [name=newbie]');
await page.click('#book-go'); await page.waitForTimeout(500); await shot('02-book-confirmed');
await check(async () => (await page.locator('.conf__big').textContent()).includes('booked'), 'booking confirmation');
await check(async () => (await page.locator('a[href*="calendar.google.com"]').count()) === 1, 'calendar link');
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
await check(async () => (await page.locator('#today-list .krow [data-action=book]').first().textContent()).trim() === 'Booked', 'first row shows Booked');
await check(async () => (await page.locator('#today-list .krow.mine').count()) === 1, 'today list marks booking');

// schedule: day tabs, week view, filters, waitlist
await go('#schedule');
await page.click('#days button[data-day="all"]'); await page.waitForTimeout(200);
await check(async () => (await page.locator('#sched .kday').count()) === 7, 'week view shows 7 days');
await page.selectOption('#f-class', 'power'); await page.waitForTimeout(200);
await check(async () => (await page.locator('#sched .krow__name').allTextContents()).every(t => t.includes('Power')), 'class filter');
await page.selectOption('#f-class', ''); await page.selectOption('#f-inst', 'Rachel'); await page.waitForTimeout(200);
await check(async () => { const t = await page.locator('#sched .krow__who').allTextContents(); return t.length === 11 && t.every(x => x.includes('Rachel')); }, 'instructor filter shows Rachel x11');
await page.selectOption('#f-inst', '');
await page.click('#days button[data-day="6"]'); await page.waitForTimeout(200);
await check(async () => (await page.locator('#sched .kday').first().textContent()).includes('Saturday'), 'day switch');
await page.evaluate(() => { const { SCHEDULE, STATE, save, renderSchedule } = window.__lpp; const k = SCHEDULE.find(x => x.d === 6 && x.c === 'intro'); STATE.spots[k.id] = 0; save(); renderSchedule(); window.__k = k.id; });
const wl = page.locator('#row-' + await page.evaluate(() => window.__k) + ' [data-action=book]');
await check(async () => (await wl.textContent()).includes('waitlist'), 'full class offers waitlist');
await wl.click(); await page.waitForTimeout(400);
await fill('#book-form', { first: 'Nate', last: 'R', email: 'nate@example.com' });
await page.click('#book-go'); await page.waitForTimeout(400); await shot('03-waitlist');
await check(async () => (await page.locator('.conf__big').textContent()).includes('waitlist'), 'waitlist confirmation');
await page.keyboard.press('Escape'); await page.waitForTimeout(300); await shot('04-schedule');

// intro pack from the offer bar
await page.click('.offerbar [data-action=buy]'); await page.waitForTimeout(400); await shot('05-intro');
await check(async () => (await page.locator('#buy-form [name=promo]').count()) === 0, 'intro pack has no promo field');
await fill('#buy-form', { first: 'Amy', last: 'L', email: 'amy@example.com' });
await page.click('#buy-go'); await page.waitForTimeout(300);
await check(async () => (await page.locator('.conf__list').textContent()).includes('$39'), 'intro pack total $39');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// pricing: membership join, promo on a pack, calculator, jump
await go('#pricing');
await page.locator('#price-body [data-action=buy][data-plan=m4]').click(); await page.waitForTimeout(400);
await page.click('#sheet .path[data-path=wl]'); await page.waitForTimeout(150);
await check(async () => (await page.locator('#wl-go').getAttribute('href')) === 'https://www.wellnessliving.com/rs/catalog-view.html?k_business=321493&id_sale=1&k_id=3057633', '4-class membership links to its WellnessLiving store page');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.locator('#price-body [data-action=buy][data-plan=m8]').click(); await page.waitForTimeout(400);
await fill('#buy-form', { first: 'Jason', last: 'Kemp', email: 'jason@example.com' });
await page.click('#buy-go'); await page.waitForTimeout(200);
await check(async () => (await page.locator('.check.field--err').count()) === 1, 'membership needs the agreement ticked');
await page.check('#buy-form [name=agree]'); await page.click('#buy-go'); await page.waitForTimeout(300);
await check(async () => (await page.locator('.conf__big').textContent()).includes('Welcome'), 'membership confirmation');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.locator('#price-body [data-action=buy][data-plan=p5]').click(); await page.waitForTimeout(400);
await fill('#buy-form', { first: 'Bo', last: 'K', email: 'bo@example.com', promo: 'new25' });
await page.click('#buy-go'); await page.waitForTimeout(300);
await check(async () => (await page.locator('.conf__list').textContent()).includes('$165'), 'NEW25 takes $25 off the 5-pack');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await check(async () => (await page.locator('#shop .rrow').count()) === 11 && (await page.locator('#shop .rrow button').count()) === 11, 'every shop row can be added to the bag');
await page.evaluate(() => { const r = document.getElementById('calc-range'); r.value = 4; r.dispatchEvent(new Event('input')); }); await page.waitForTimeout(200);
await check(async () => (await page.locator('#calc-best').textContent()).length > 3, 'calculator names a best plan');
await page.locator('#calc-range').scrollIntoViewIfNeeded(); await shot('06-calc');
const bestName = await page.locator('#calc-best').textContent();
await page.locator('#calc-go button').click(); await page.waitForTimeout(400);
await check(async () => await page.locator('#sheet.on #buy-form').isVisible(), 'the cheapest plan has its own button (' + bestName + ')');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await check(async () => (await page.locator('#calc-table tbody tr').count()) === (await page.locator('#calc-table tbody tr button').count()), 'every plan in the comparison can be opened');

// private training request (routed from #training)
await go('#training');
await check(async () => await page.evaluate(() => document.querySelector('[data-page=classes]').classList.contains('on')), '#training opens the classes page');
await check(async () => (await page.locator('#training-rates [data-action=inq-training]').count()) === 5, 'every training option has its own button');
await page.locator('#training-rates [data-action=inq-training][data-opt="3"]').click(); await page.waitForTimeout(300);
await check(async () => (await page.locator('#sheet-title').textContent()).includes('pack') && (await page.locator('#inq-form [name=opt]').inputValue()).startsWith('Five sessions'), 'Ask us opens a pack request with Five sessions chosen');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.locator('#training-rates [data-action=inq-training][data-opt="2"]').click(); await page.waitForTimeout(300);
await check(async () => (await page.locator('#inq-form [name=opt]').inputValue()).startsWith('Single session, 60 min'), 'a priced row opens a request for that session');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.locator('#training-rates [data-action=inq-training]').first().click(); await page.waitForTimeout(300);
await fill('#inq-form', { first: 'Jason', last: 'Kemp', email: 'jason@example.com', goal: 'Marathon in spring' });
await page.click('#inq-go'); await page.waitForTimeout(300);
await check(async () => (await page.locator('.conf__big').textContent()).includes('text you'), 'training request confirmation');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// sauna (routed from #sauna), contact form (#visit)
await go('#sauna');
await check(async () => await page.evaluate(() => document.querySelector('[data-page=studio]').classList.contains('on') && window.scrollY > 300), '#sauna opens the studio page at the sauna');
await go('#visit');
await fill('#contact-form', { name: 'Sam', contact: 'sam@example.com', msg: 'Do you have a student rate?' });
await page.click('#contact-form button[type=submit]'); await page.waitForTimeout(300);
await check(async () => (await page.locator('#contact-form .ok-box').count()) === 1, 'contact form thanks');

// events
await go('#events');
await page.locator('.elist [data-action=ev-pick][data-type=Filming]').click(); await page.waitForTimeout(500);
await check(async () => (await page.locator('#ev-form [name=type]').inputValue()) === 'Filming', 'an event type button fills the form');
await fill('#ev-form', { name: 'Dana', email: 'dana@example.com', guests: '14' });
await page.click('#ev-form button[type=submit]'); await page.waitForTimeout(300);
await check(async () => (await page.locator('#ev-form .ok-box').count()) === 1, 'event form thanks');

// drop-in booking with the promo code
await go('#schedule'); await page.click('#days button[data-day="all"]'); await page.waitForTimeout(200);
await page.locator('#sched .krow:not(.past):not(.mine) [data-action=book]').nth(3).click(); await page.waitForTimeout(400);
await page.locator('#sheet input[name=pay][value=drop]').check({ force: true });
await fill('#book-form', { first: 'Promo', last: 'Tester', email: 'promo@example.com' }); await page.fill('#book-promo', 'new25');
await page.click('#book-go'); await page.waitForTimeout(400);
await check(async () => (await page.locator('.conf__list').textContent()).includes('$15 after NEW25'), 'NEW25 takes $25 off a drop-in booking');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// shop + bag
await go('#shop');
await page.locator('[data-action=add][data-p=flexi]').click(); await page.locator('[data-action=add][data-p=band]').click(); await page.locator('[data-action=add][data-p=band]').click(); await page.waitForTimeout(200);
await check(async () => (await page.locator('.cart-count').textContent()) === '3', 'bag badge 3');
await page.evaluate(() => window.scrollTo(0, 0));
await check(async () => await page.locator('#bag-btn').isVisible(), 'bag button is visible once something is in it');
await page.click('#bag-btn');
await page.waitForTimeout(400); await shot('07-bag');
await check(async () => (await page.locator('.cart-total').textContent()).includes('$83'), 'bag total $83');
await page.click('[data-action=checkout]'); await page.waitForTimeout(300);
await fill('#co-form', { first: 'Jason', last: 'Kemp', email: 'jason@example.com' });
await page.click('#co-go'); await page.waitForTimeout(300);
await check(async () => (await page.locator('.conf__big').textContent()).includes('front desk'), 'order confirmation');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// questions search, class finder, instructor names
await go('#faq');
await page.fill('#faq-q', 'parking'); await page.waitForTimeout(200);
await check(async () => (await page.locator('#faq-list details').count()) === 1, 'question search narrows to one');
await go('#new');
await page.locator('#finder input[name=exp][value=regular]').check({ force: true }); await page.locator('#finder input[name=goal][value=strong]').check({ force: true }); await page.waitForTimeout(150);
await check(async () => (await page.locator('#finder-out h3').textContent()).includes('Power'), 'finder suggests Power for regular + stronger');
await shot('08-finder');
await go('#home');
await page.locator('#names button', { hasText: 'Grace' }).click(); await page.waitForTimeout(400);
await check(async () => { const t = await page.locator('#sched .krow__who').allTextContents(); return t.length === 9 && t.every(x => x.includes('Grace')); }, 'instructor name opens their 9 classes');

// class tile jumps to that class
await go('#home');
await page.locator('.ctile', { hasText: 'Power' }).click(); await page.waitForTimeout(500);
await check(async () => await page.evaluate(() => document.querySelector('[data-page=classes]').classList.contains('on') && Math.abs(document.getElementById('cl-power').getBoundingClientRect().top) < 200), 'class tile opens the class');

// staff portal
await go('#admin');
await check(async () => await page.evaluate(() => document.body.classList.contains('admin') && getComputedStyle(document.querySelector('.head')).display === 'none' && getComputedStyle(document.querySelector('.concept')).display !== 'none'), 'portal hides the site chrome and keeps the concept label');
await check(async () => (await page.locator('.prow').count()) === 0 && (await page.locator('[data-do=in]').count()) === 1, 'portal starts at the staff gate');
await page.click('[data-do=in]'); await page.waitForTimeout(300); await shot('12-portal');
const people = await page.locator('.prow').count();
await check(async () => people === 13, 'portal lists 7 real and 6 sample people (got ' + people + ')');
await page.locator('.prow', { hasText: 'Jason Kemp' }).click(); await page.waitForTimeout(400);
const pd = mode === 'phone' ? '#sheet .pd' : '#adm-detail .pd';
await check(async () => (await page.locator(pd + ' .pd__log li').count()) === 4, 'one person, four things in their history');
await page.locator(pd + ' [data-do=status][data-s=Contacted]').click(); await page.waitForTimeout(300);
await check(async () => (await page.locator('.prow', { hasText: 'Jason Kemp' }).locator('.prow__status').textContent()) === 'Contacted', 'status change shows in the list');
await page.fill(pd + ' textarea', 'Paid at the desk'); await page.waitForTimeout(100);
await check(async () => await page.evaluate(() => JSON.parse(localStorage.getItem('lpp-concept-3')).people.some(p => p.name === 'Jason Kemp' && p.notes === 'Paid at the desk' && p.status === 'Contacted')), 'notes and status are saved');
await shot('13-portal-person');
if (mode === 'phone') { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
await page.fill('#adm-q', 'dana'); await page.waitForTimeout(200);
await check(async () => (await page.locator('.prow').count()) === 1, 'search narrows to one person');
await page.fill('#adm-q', ''); await page.waitForTimeout(200);
await page.click('[data-do=csv]'); await page.waitForTimeout(400);
await check(async () => (await page.locator('#toast.on').count()) === 1 || (await page.locator('#sheet textarea').inputValue()).includes('Jason Kemp'), 'copy as CSV copies or shows the text');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.click('[data-do=tab][data-v=activity]'); await page.waitForTimeout(300); await shot('14-portal-activity');
const acts = await page.locator('.alog__row').count();
await check(async () => acts === 19, 'activity lists 11 real and 8 sample events (got ' + acts + ')');
await page.click('[data-do=tab][data-v=people]'); await page.waitForTimeout(200);
await page.click('[data-do=clear]'); await page.waitForTimeout(300);
await check(async () => (await page.locator('.prow').count()) === 7, 'removing samples leaves the seven real people');
await page.click('.adm__right a'); await page.waitForTimeout(400);
await check(async () => await page.evaluate(() => !document.body.classList.contains('admin') && document.querySelector('[data-page=home]').classList.contains('on')), 'back to site leaves the portal');

// pitch notes + inbox
await page.click('.concept button'); await page.waitForTimeout(400); await shot('09-pitch');
await page.click('.ptabs button[data-ptab=inbox]'); await page.waitForTimeout(300); await shot('10-inbox');
const n = await page.locator('.inbox-item').count();
await check(async () => n === 11, 'pitch notes list 11 submitted items (got ' + n + ')');
await page.click('.ptabs button[data-ptab=changed]'); await page.locator('.jumpto[href="#new"]').click(); await page.waitForTimeout(400);
await check(async () => await page.evaluate(() => document.querySelector('[data-page=new]').classList.contains('on') && !document.getElementById('pitch').classList.contains('on')), 'Show me closes notes and opens the page');

// phone menu and book bar
if (mode === 'phone') {
  await page.click('.menu-btn'); await page.waitForTimeout(500); await shot('11-menu');
  await page.locator('.menu__links a', { hasText: 'Pricing' }).click(); await page.waitForTimeout(400);
  await check(async () => await page.evaluate(() => document.querySelector('[data-page=pricing]').classList.contains('on') && !document.getElementById('menu').classList.contains('on')), 'menu link navigates and closes');
  await check(async () => await page.locator('.bookbar').isVisible(), 'book bar pinned on phone');
}

await browser.close();
fs.writeFileSync(`${out}/${mode}-errors.txt`, errors.join('\n'));
console.log(mode + ': ' + (errors.length ? errors.join('\n') : 'all flows passed'));
