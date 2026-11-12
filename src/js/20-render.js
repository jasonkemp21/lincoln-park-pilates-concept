/* ---------- renderers ---------- */
const byDay = d => SCHEDULE.filter(k => k.d === d).sort((a, b) => a.t - b.t);
const dayWord = (off, d) => off === 0 ? 'Today' : off === 1 ? 'Tomorrow' : DAYS[d];

function nextClass(now, filter) {
  for (let off = 0; off < 8; off++) {
    const d = (now.d + off) % 7;
    const list = byDay(d).filter(k => (!filter || filter(k)) && (off > 0 || k.t > now.mins));
    if (list.length) return { k: list[0], off };
  }
  return null;
}

/* one class row, shared by the home page and the schedule */
function rowHTML(k, past, withId) {
  const c = CLASSES[k.c], left = spotsLeft(k), mine = STATE.booked[k.id];
  const spots = past ? 'Finished' : left > 3 ? left + ' spots left' : left > 0 ? left + (left === 1 ? ' spot left' : ' spots left') : 'Full';
  const label = mine ? 'Booked' : left > 0 ? 'Book' : 'Join waitlist';
  return `<div class="krow${past ? ' past' : ''}${mine ? ' mine' : ''}" ${withId ? ` id="row-${k.id}"` : ''} data-row="${k.id}">
    <div class="krow__time">${fmtT(k.t)}</div>
    <div class="krow__name">${esc(c.name)}<small>${k.min} minutes, ${esc(c.level.toLowerCase())}</small></div>
    <div class="krow__who">${esc(k.i)}${k.s !== 'Studio 1' ? `<small>${esc(k.s)}</small>` : ''}</div>
    <div class="krow__spots${!past && left <= 3 && left > 0 ? ' low' : ''}">${spots}</div>
    <div class="krow__act"><button class="btn btn-s ${mine ? 'btn-ink' : left > 0 ? 'btn-red' : 'btn-line'}" type="button" data-action="book" data-k="${k.id}">${label}</button></div>
  </div>`;
}

/* home: today's list, five rows at most */
function renderToday() {
  const now = chicagoNow();
  let d = now.d, off = 0, list = byDay(d).filter(k => k.t + k.min > now.mins);
  if (!list.length) { off = 1; d = (now.d + 1) % 7; list = byDay(d); }
  $('#today-title').textContent = off === 0 ? 'Today’s classes' : 'Tomorrow’s classes';
  $('#today-list').innerHTML = list.slice(0, 5).map(k => rowHTML(k, false)).join('');
  const more = list.length - 5, m = $('#today-more');
  m.hidden = more <= 0;
  if (more > 0) m.innerHTML = `<a class="u" href="#schedule">${more} more ${more === 1 ? 'class' : 'classes'} ${off === 0 ? 'today' : 'tomorrow'}</a>`;
}

/* class tiles and the class list */
function renderTiles() {
  $('#ctiles').innerHTML = CLASS_ORDER.map(id => { const c = CLASSES[id]; return `<a class="ctile" href="#classes" data-action="goto-class" data-c="${id}">
    <div class="photo r-34"><img src="img/${c.photo}.webp" alt="" loading="lazy"></div>
    <h3>${esc(c.short)}</h3><p>${esc(c.line)}</p><span class="ctile__lvl">${esc(c.level)}</span></a>`; }).join('');
}
function renderClassList() {
  const now = chicagoNow();
  $('#cl-list').innerHTML = CLASS_ORDER.map(id => {
    const c = CLASSES[id], n = nextClass(now, k => k.c === id), per = SCHEDULE.filter(k => k.c === id).length;
    return `<article class="cl" id="cl-${id}">
      <div class="photo r-34"><img src="img/${c.photo}.webp" alt="${esc(c.name)}" loading="lazy"></div>
      <div>
        <h2 class="h-l">${esc(c.name)}</h2>
        <p class="lead">${esc(c.desc)}</p>
        <p class="cl__meta"><span>${esc(c.level)}</span><span>${c.min} minutes</span><span>${per} ${per === 1 ? 'class' : 'classes'} a week</span></p>
        <div class="btn-row">${n ? `<button class="btn btn-red" type="button" data-action="book" data-k="${n.k.id}">Book ${n.off < 2 ? dayWord(n.off, n.k.d).toLowerCase() : dayWord(n.off, n.k.d)} at ${fmtT(n.k.t)}</button>` : ''}<button class="u" type="button" data-action="sched-filter" data-c="${id}">All ${esc(c.short)} times</button></div>
      </div>
    </article>`; }).join('');
}

/* instructors by name */
function renderNames() {
  const html = TEAM.map(p => { const n = SCHEDULE.filter(k => k.i === p.n).length; return `<button type="button" data-action="sched-filter" data-i="${esc(p.n)}" aria-label="${esc(p.n)}, ${n} ${n === 1 ? 'class' : 'classes'} this week">${esc(p.n)}<small>${n} ${n === 1 ? 'class' : 'classes'} this week</small></button>`; }).join('');
  $('#names').innerHTML = html; $('#names-2').innerHTML = html;
}
function renderQuotes() {
  $('#quotes').innerHTML = REVIEWS.map(r => `<figure class="quote" style="margin:0"><p>“${esc(r.q)}”</p><cite>${r.who ? esc(r.who) + ', ' : ''}${esc(r.src)}</cite></figure>`).join('');
}

/* schedule page */
const SF = { day: null, c: '', i: '', time: '', all: false };
function renderSchedule() {
  const now = chicagoNow();
  if (SF.day == null) SF.day = now.d;
  const order = [1, 2, 3, 4, 5, 6, 0];
  $('#days').innerHTML = order.map(d => `<button type="button" class="${!SF.all && SF.day === d ? 'on' : ''}${now.d === d ? ' today' : ''}" data-day="${d}">${now.d === d ? 'Today' : DAYS_S[d]}<small>${byDay(d).length}</small></button>`).join('') + `<button type="button" class="${SF.all ? 'on' : ''}" data-day="all">All week<small>${SCHEDULE.length}</small></button>`;
  $$('#days button').forEach(b => b.onclick = () => { if (b.dataset.day === 'all') SF.all = true; else { SF.all = false; SF.day = +b.dataset.day; } renderSchedule(); });
  const fc = $('#f-class'); if (fc.options.length === 1) CLASS_ORDER.forEach(id => fc.add(new Option(CLASSES[id].name, id)));
  const fi = $('#f-inst'); if (fi.options.length === 1) TEAM.forEach(p => fi.add(new Option(p.n, p.n)));
  fc.value = SF.c; fi.value = SF.i; $('#f-time').value = SF.time;
  fc.onchange = () => { SF.c = fc.value; renderSchedule(); };
  fi.onchange = () => { SF.i = fi.value; renderSchedule(); };
  $('#f-time').onchange = e => { SF.time = e.target.value; renderSchedule(); };

  const days = SF.all ? order : [SF.day];
  const html = days.map(d => {
    let list = byDay(d);
    if (SF.c) list = list.filter(k => k.c === SF.c);
    if (SF.i) list = list.filter(k => k.i === SF.i);
    if (SF.time) list = list.filter(k => SF.time === 'am' ? k.t < 660 : SF.time === 'mid' ? (k.t >= 660 && k.t < 900) : k.t >= 900);
    if (!list.length) return days.length > 1 ? '' : `<div class="klist"><p class="kempty">Nothing on ${DAYS[d]} matches those filters. Try another day, or choose All week.</p></div>`;
    return `<h2 class="h-m kday">${DAYS[d]}${d === now.d ? '<span>today</span>' : ''}</h2><div class="klist">${list.map(k => rowHTML(k, d === now.d && k.t + k.min < now.mins, true)).join('')}</div>`;
  }).join('');
  $('#sched').innerHTML = html || '<div class="klist"><p class="kempty">Nothing matches those filters. Clear one and try again.</p></div>';
}

/* pricing */
function priceRow(p, kind) {
  const n = p.per === 'yr' ? p.classes * 12 : p.classes;
  const per = p.classes && p.id !== 'mu' ? money(Math.round(p.price / n * 100) / 100).replace(/\.00$/, '') + ' a class' : p.id === 'mu' ? 'as many classes as you like' : '';
  const price = money(p.price) + (p.per ? `<small>/ ${p.per === 'mo' ? 'month' : 'year'}</small>` : '');
  return `<div class="rrow${p.pick ? ' rrow--pick' : ''}">
    <div class="rrow__name">${esc(p.name)}${p.flag ? `<span class="tag">${esc(p.flag)}</span>` : ''}<small>${esc(p.terms)}</small></div>
    <div class="rrow__price">${price}<span class="rrow__per">${per}</span></div>
    <button class="btn btn-s ${p.pick ? 'btn-red' : 'btn-line'}" type="button" data-action="buy" data-plan="${p.id}">${kind === 'member' ? 'Join' : 'Buy'}</button>
  </div>`;
}
/* training and sauna rows: every row has its own button, so each option can be requested */
function rateRows(list, kind) {
  return list.map((r, n) => `<div class="rrow">
    <div class="rrow__name">${esc(r.name)}${r.len ? ', ' + esc(r.len) : ''}${r.note ? `<small>${esc(r.note)}</small>` : ''}</div>
    <div class="rrow__price">${r.price != null ? money(r.price) + (r.per ? '<small>/ month</small>' : '') : ''}</div>
    <button class="btn btn-s ${kind === 'training' && n === 0 ? 'btn-red' : 'btn-line'}" type="button" data-action="inq-${kind}" data-opt="${n}">${r.price == null ? 'Ask us' : kind === 'sauna' ? 'Book' : 'Request'}</button>
  </div>`).join('');
}
function group(id, title, blurb, rows, extra = '') {
  return `<section class="pgroup" id="${id}"><div class="pgroup__intro"><h2 class="h-l">${title}</h2><p>${blurb}</p></div><div><div class="rows">${rows}</div>${extra}</div></section>`;
}
function renderPricing() {
  const intro = { ...PACKAGES[0], name: 'Intro pack, 3 classes', terms: 'New clients only. Any class, any instructor', pick: true, flag: 'Start here' };
  const drop = PACKAGES[1];
  $('#price-body').innerHTML =
    group('pg-new', 'New here', 'Start with the intro pack. It costs less than a single drop-in.', priceRow(intro, 'pack') + priceRow(drop, 'pack'), `<p class="note" style="margin-top:14px">Code ${PROMO.code} takes $25 off your first class or package.</p>`) +
    group('pg-member', 'Memberships', 'A set number of classes each month, billed monthly. Every plan except Unlimited has a 3-month minimum. Classes don’t roll over. Cancel with 30 days’ notice.', MEMBERSHIPS.map(p => priceRow(p, 'member')).join('') + priceRow(ANNUAL, 'member')) +
    group('pg-pack', 'Class packs', 'Buy classes up front and use them on any format. The clock starts when you buy.', PACKAGES.slice(2).map(p => priceRow(p, 'pack')).join('')) +
    group('pg-training', 'Private training', 'One client, one instructor, on the tower reformer. Start with the intro session, or request any option and we’ll text you to set it up.', rateRows(TRAINING, 'training')) +
    group('pg-sauna', 'Infrared sauna', 'Booked by the session, after class or on its own.', rateRows(SAUNA, 'sauna'));
}
function renderCalc() {
  const n = +$('#calc-range').value, monthly = Math.round(n * 52 / 12);
  $('#calc-n').textContent = n === 6 ? '6+' : n; $('#calc-month').textContent = 'about ' + monthly + ' a month';
  const rows = [];
  MEMBERSHIPS.forEach(m => {
    const allot = m.id === 'mu' ? Infinity : m.classes, covers = allot >= monthly;
    rows.push({ id: m.id, join: true, name: m.id === 'mu' ? 'Unlimited membership' : m.classes + '-class membership', price: money(m.price) + ' a month', per: m.price / Math.min(allot, monthly), covers, note: covers ? (allot !== Infinity && allot > monthly ? (allot - monthly) + ' classes left over' : '') : 'covers ' + allot + ' of your ' + monthly });
  });
  PACKAGES.slice(1).forEach(p => rows.push({ id: p.id, name: p.classes > 1 ? p.classes + '-class pack' : 'Drop-in', price: money(p.price), per: p.price / p.classes, covers: true, note: p.classes > 1 ? p.terms.toLowerCase() : '' }));
  rows.sort((a, b) => (a.covers === b.covers ? a.per - b.per : a.covers ? -1 : 1));
  const best = rows.find(r => r.covers);
  const m2 = v => money(Math.round(v * 100) / 100);
  $('#calc-best').textContent = best.name;
  $('#calc-best-note').textContent = m2(best.per) + ' a class at ' + monthly + ' classes a month';
  $('#calc-go').innerHTML = `<button class="btn btn-red" type="button" data-action="buy" data-plan="${best.id}">${best.join ? 'Join on this plan' : 'Buy this'}</button>`;
  const yr = ANNUAL.price / 12 / Math.min(20, monthly);
  $('#calc-also').innerHTML = (monthly > 20
    ? 'The Elite annual (' + money(ANNUAL.price) + ' a year) covers 20 classes a month, fewer than you would take.'
    : 'The Elite annual is ' + money(ANNUAL.price) + ' paid up front for 20 classes a month. At ' + monthly + ' a month that is ' + m2(yr) + ' a class, ' + (yr < best.per ? 'less' : 'more') + ' than the ' + esc(best.name.toLowerCase()) + '.')
    + ' <button class="u" type="button" data-action="buy" data-plan="elite">Join the Elite annual</button>';
  $('#calc-table tbody').innerHTML = rows.map(r => `<tr class="${r === best ? 'best' : r.covers ? '' : 'dim'}"><td><button class="u" type="button" data-action="buy" data-plan="${r.id}">${esc(r.name)}</button>${r.note ? `<small>${esc(r.note)}</small>` : ''}</td><td class="num">${r.price}</td><td class="num">${m2(r.per)}</td></tr>`).join('');
}
function renderRates() { $('#training-rates').innerHTML = rateRows(TRAINING, 'training'); $('#sauna-rates').innerHTML = rateRows(SAUNA, 'sauna'); }

/* shop */
function renderShop() {
  $('#shop').innerHTML = PRODUCTS.filter(p => p.price != null).map(p => `<div class="rrow"><div class="rrow__name">${esc(p.name)}<small>${esc(p.desc)}</small></div><div class="rrow__price">${money(p.price)}</div><button class="btn btn-s btn-line" type="button" data-action="add" data-p="${p.id}">Add to bag</button></div>`).join('');
}
function cartCount() { return Object.values(STATE.cart).reduce((a, b) => a + b, 0); }
function renderCartBadge() { const n = cartCount(); $('#bag-btn').hidden = !n; $('.cart-count').textContent = n; }
function addToCart(id) { STATE.cart[id] = (STATE.cart[id] || 0) + 1; save(); renderCartBadge(); toast(PRODUCTS.find(p => p.id === id).name + ' added to your bag'); }
function changeQty(id, n) { STATE.cart[id] = Math.max(0, (STATE.cart[id] || 0) + n); if (!STATE.cart[id]) delete STATE.cart[id]; save(); renderCartBadge(); openCart(); }

/* questions */
const FQ = { cat: '', q: '' };
const qaHTML = (f, open) => `<details${open ? ' open' : ''}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`;
function renderFaq() {
  const cats = [...new Set(FAQ.map(f => f.c))];
  $('#faq-cats').innerHTML = `<button type="button" class="${FQ.cat ? '' : 'on'}" data-cat="">All</button>` + cats.map(c => `<button type="button" class="${FQ.cat === c ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  $$('#faq-cats button').forEach(b => b.onclick = () => { FQ.cat = b.dataset.cat; renderFaq(); });
  const q = FQ.q.toLowerCase();
  const list = FAQ.filter(f => (!FQ.cat || f.c === FQ.cat) && (!q || (f.q + ' ' + f.a).toLowerCase().includes(q)));
  $('#faq-list').innerHTML = list.length ? list.map(f => qaHTML(f, !!q)).join('') : '<p class="kempty">No question matches that. Text 312-286-5845 and we’ll answer it.</p>';
}
$('#faq-q').addEventListener('input', e => { FQ.q = e.target.value.trim(); renderFaq(); });
function renderNewFaq() { $('#new-faq').innerHTML = FAQ.filter(f => f.c === 'First visit').map(f => qaHTML(f, false)).join(''); }

/* class hours */
function renderHours() {
  const now = chicagoNow();
  $('#hours').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => { const l = byDay(d), f = l[0], e = l[l.length - 1]; return `<div class="${d === now.d ? 'now' : ''}"><span>${DAYS[d]}</span><span>${f ? fmtT(f.t) + ' to ' + fmtEnd(e.t, e.min) : 'No classes'}</span></div>`; }).join('');
}

/* which class first */
function renderFinder() {
  const f = new FormData($('#finder')), exp = f.get('exp'), goal = f.get('goal'), hard = f.get('hard');
  let id, why;
  if (exp === 'never') { id = 'intro'; why = 'Start here. You’ll learn the carriage, springs and straps before anyone asks you to keep up. Form Focus and Flow are good second and third classes.'; }
  else if (goal === 'learn') { id = 'form'; why = 'It’s the slowest class, with the most time spent on how each exercise should feel.'; }
  else if (goal === 'tone') { id = 'sculpt'; why = 'The sculpt class on the schedule. It’s open to all levels.'; }
  else if (goal === 'strong' && (hard === 'hard' || exp === 'regular')) { id = 'power'; why = 'The most athletic class on the schedule. Take it once the reformer feels familiar.'; }
  else if (goal === 'strong') { id = 'flow'; why = 'Take Flow for a few weeks first, then move up to Power.'; }
  else { id = 'flow'; why = 'Traditional reformer Pilates at a steady pace. It runs six days a week, so it’s easy to fit in.'; }
  const c = CLASSES[id], n = nextClass(chicagoNow(), k => k.c === id);
  $('#finder-out').innerHTML = `<p style="margin:0;font-weight:600">We’d start you with</p><h3>${esc(c.name)}</h3><p>${esc(why)}</p>${n ? `<p style="margin-top:14px">Next one: ${dayWord(n.off, n.k.d)} at ${fmtT(n.k.t)} with ${esc(n.k.i)}.</p>` : ''}<div class="btn-row">${n ? `<button class="btn btn-white" type="button" data-action="book" data-k="${n.k.id}">Book it</button>` : ''}<button class="u" type="button" data-action="sched-filter" data-c="${id}">All ${esc(c.short)} times</button></div>`;
}
$('#finder').addEventListener('change', renderFinder);
