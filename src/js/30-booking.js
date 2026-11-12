/* ---------- booking, purchases, requests, bag. All simulated: nothing is charged or sent. ---------- */
function sheetSet(label, title, body, foot) {
  $('#sheet-label').textContent = label; $('#sheet-title').textContent = title;
  $('#sheet-body').innerHTML = body; $('#sheet-foot').innerHTML = foot || '';
  $('#sheet-body').scrollTop = 0;
  delete $('#sheet').dataset.person;
}
const stepsBar = (n, total) => `<div class="steps-bar" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
const DEMO = 'This is a concept, so nothing is sent or charged and no card is asked for. On the real site this goes to the front desk and into WellnessLiving as a new lead.';
const WL_REAL = 'This opens the studio’s real WellnessLiving page in a new tab. Unlike the rest of this concept, anything you book or buy there is real.';
function detailsFields(extra = '') {
  return `<div class="form-grid">
    <label class="field"><span>First name</span><input name="first" required autocomplete="given-name"></label>
    <label class="field"><span>Last name</span><input name="last" required autocomplete="family-name"></label>
    <label class="field span2"><span>Email</span><input name="email" type="email" required autocomplete="email"></label>
    <label class="field span2"><span>Mobile, for class reminders (optional)</span><input name="phone" type="tel" autocomplete="tel"></label>
    ${extra}
  </div>`;
}
const personOf = f => ({ first: f.get('first'), last: f.get('last'), email: f.get('email'), phone: f.get('phone'), newbie: !!f.get('newbie') });
function validate(form) {
  let ok = true;
  $$('[required]', form).forEach(i => {
    const bad = i.type === 'checkbox' ? !i.checked : (!i.value.trim() || (i.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value)));
    const f = i.closest('.field, .check'); if (f) f.classList.toggle('field--err', bad); if (bad) ok = false;
  });
  if (!ok) toast('Fill in the fields marked in red');
  return ok;
}
function gcalLink(title, k, details) {
  const now = chicagoNow(); let off = (k.d - now.d + 7) % 7; if (off === 0 && k.t <= now.mins) off = 7;
  const d = new Date(); d.setDate(d.getDate() + off);
  const ymd = d.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }).replace(/-/g, '');
  const hm = m => String(Math.floor(m / 60)).padStart(2, '0') + String(m % 60).padStart(2, '0') + '00';
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + ymd + 'T' + hm(k.t) + '/' + ymd + 'T' + hm(k.t + k.min) + '&ctz=America/Chicago&location=' + encodeURIComponent('Lincoln Park Pilates, 2105 N Southport Ave Suite 200, Chicago, IL 60614') + '&details=' + encodeURIComponent(details);
}

/* Two ways through every booking and purchase: a quick sign-up on this site, or the studio's own WellnessLiving page.
   Returns the sheet body and footer. bindPaths() wires the switch and records a click-through for the front desk. */
function twoPaths(o) {
  const body = `<p class="q">${esc(o.ask)}</p>
    <div class="paths" role="tablist">
      <button type="button" class="path on" role="tab" aria-selected="true" data-path="quick"><b>Quick sign-up</b><small>No account or password</small></button>
      <button type="button" class="path" role="tab" aria-selected="false" data-path="wl"><b>WellnessLiving</b><small>${esc(o.wlSub)}</small></button>
    </div>
    <div data-pane="quick">${o.quick}<p class="note" style="margin-top:16px">${DEMO}</p></div>
    <div data-pane="wl" hidden><div class="wlbox"><h3>${esc(o.wlTitle)}</h3><p>${esc(o.wlText)}</p><p class="note">${WL_REAL}</p></div></div>`;
  const foot = `<div class="foot-pane" data-pane="quick">${o.quickFoot}</div>
    <div class="foot-pane" data-pane="wl" hidden><span class="small">Opens in a new tab</span><a class="btn btn-red" id="wl-go" href="${esc(o.wlHref)}" target="_blank" rel="noopener">${esc(o.wlLabel)}</a></div>`;
  return { body, foot };
}
function bindPaths(onWl) {
  $$('#sheet .path').forEach(b => b.onclick = () => {
    $$('#sheet .path').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
    $$('#sheet [data-pane]').forEach(p => { p.hidden = p.dataset.pane !== b.dataset.path; });
  });
  const go = $('#wl-go'); if (go) go.onclick = () => { onWl(); };
}

/* ---- book a class ---- */
function openBooking(id) {
  const k = SCHEDULE.find(x => x.id === id); if (!k) return;
  const c = CLASSES[k.c], left = spotsLeft(k), wait = left <= 0, mine = STATE.booked[id];
  const what = `${c.name}, ${DAYS[k.d]} ${fmtT(k.t)}`;
  const summary = `<div class="summary"><div class="summary__name">${esc(c.name)}</div><div><b>${DAYS[k.d]} at ${fmtT(k.t)}</b><br><small>${k.min} minutes with ${esc(k.i)}, ${esc(k.s)}</small></div><div style="text-align:right"><small>${wait ? 'Full' : left + ' of 12 spots left'}</small></div></div>`;
  if (mine) {
    sheetSet('Your booking', c.name, summary + `<div class="ok-box">You're booked. The door code is in your confirmation email.</div><p class="note" style="margin-top:16px">You can cancel free up to 12 hours before class.</p>`,
      `<button class="btn btn-line" type="button" id="cancel-booking">Cancel booking</button><button class="btn btn-red" type="button" data-action="overlay-close">Done</button>`);
    openOverlay('sheet');
    $('#cancel-booking').onclick = () => {
      const who = STATE.people.find(p => p.id === mine);
      delete STATE.booked[id]; STATE.spots[id] = spotsLeft(k) + 1; save();
      inboxAdd('Cancellation', what, 'Cancelled online by the client.', who ? { name: who.name, email: who.email, phone: who.phone } : null);
      closeOverlay(); refreshAll(); toast('Booking cancelled');
    };
    return;
  }
  const quick = `<form id="book-form" novalidate>${detailsFields(`<label class="check span2"><input type="checkbox" name="newbie"> This is my first time at the studio</label>`)}</form>
  <p class="q" style="margin-top:24px">How will you pay?</p><div class="pay" style="margin-bottom:16px">
    <label><input type="radio" name="pay" value="intro" checked><span><b>Intro pack, 3 classes</b><small>New clients only</small></span><span class="amt">$39</span></label>
    <label><input type="radio" name="pay" value="drop"><span><b>Drop-in</b><small>This class only</small></span><span class="amt">$40</span></label>
    <label><input type="radio" name="pay" value="member"><span><b>My membership or class pack</b><small>We'll find you by email and use a class you already have</small></span><span class="amt"></span></label>
  </div>
  <label class="field"><span>Promo code for a drop-in (optional)</span><input name="promo" id="book-promo" autocapitalize="characters" placeholder="NEW25 takes $25 off your first class"></label>`;
  const p = twoPaths({
    ask: wait ? 'How do you want to join the waitlist?' : 'How do you want to book?', quick,
    quickFoot: `<span class="small">Pay at the desk. Free to cancel up to 12 hours before</span><button class="btn btn-red" type="button" id="book-go">${wait ? 'Join waitlist' : 'Book my spot'}</button>`,
    wlSub: 'Use your account or pay now', wlTitle: 'Book with your WellnessLiving account',
    wlText: 'If you have a membership or a class pack, book there and the class comes off your account. You can also pay by card there.',
    wlHref: LPP.wlSchedule, wlLabel: 'Continue on WellnessLiving',
  });
  sheetSet(wait ? 'Join the waitlist' : 'Book a class', c.name, stepsBar(1, 2) + summary + p.body, p.foot);
  openOverlay('sheet');
  bindPaths(() => inboxAdd('WellnessLiving', what, 'Left the site to book this class on WellnessLiving.'));
  $('#book-go').onclick = () => {
    const form = $('#book-form'); if (!validate(form)) return;
    const f = new FormData(form), pay = $('input[name=pay]:checked').value;
    const promo = ($('#book-promo').value || '').trim().toUpperCase(), off = promo === PROMO.code && pay === 'drop';
    const payTxt = { intro: 'Intro pack, 3 classes for $39', drop: off ? 'Drop-in, $15 after ' + PROMO.code : 'Drop-in, $40', member: 'Existing membership or class pack' }[pay] + (promo && !off ? ' (code ' + promo + ' not applied)' : '');
    const due = pay === 'member' ? 'Nothing to pay. Match them to their WellnessLiving account.' : 'To pay at the desk.';
    const rec = inboxAdd(wait ? 'Waitlist' : 'Booking', what, `Quick sign-up. ${payTxt}. ${due}${f.get('newbie') ? ' First visit: send the door code and what to bring.' : ''}`, personOf(f));
    STATE.booked[id] = rec ? rec.id : true; if (!wait) STATE.spots[id] = left - 1; save();
    const cal = gcalLink(c.name + ' at Lincoln Park Pilates', k, 'With ' + k.i + ', ' + k.s + '. The door code is in your confirmation email. Cancel at least 12 hours before to avoid the $25 fee.');
    sheetSet(wait ? 'Waitlist' : 'Booked', c.name, stepsBar(2, 2) + `<div class="conf">
      <div class="conf__big">${wait ? 'You’re on the waitlist' : 'You’re booked for ' + DAYS[k.d]}</div>
      <ul class="conf__list"><li><span>Class</span><span>${esc(c.name)}</span></li><li><span>When</span><span>${DAYS[k.d]}, ${fmtT(k.t)} to ${fmtEnd(k.t, k.min)}</span></li><li><span>Instructor</span><span>${esc(k.i)}, ${esc(k.s)}</span></li><li><span>Paying with</span><span>${esc(payTxt)}${pay === 'member' ? '' : ', at the front desk when you arrive'}</span></li><li><span>Where</span><span>2105 N Southport Ave, second floor. Entrances on Southport and on Clybourn.</span></li></ul>
      ${wait ? '<div class="conf__tip">If a spot opens, you’ll get an email saying you’re in.</div>' : '<div class="conf__tip"><b>Before you come:</b> the door code is in your confirmation email. Wear something you can move in, go barefoot or bring grip socks, and bring water.</div>'}
      <div class="btn-row"><a class="btn btn-line" href="${cal}" target="_blank" rel="noopener"><svg class="ic"><use href="#i-cal"/></svg>Add to Google Calendar</a></div>
      </div>`,
      `<a class="u small" href="#schedule" data-action="overlay-close">Book another class</a><button class="btn btn-red" type="button" data-action="overlay-close">Done</button>`);
    refreshAll();
  };
}

/* ---- buy a membership or pack ---- */
function openPurchase(id) {
  const p = [...MEMBERSHIPS, ANNUAL, ...PACKAGES].find(x => x.id === id); if (!p) return;
  const isMember = MEMBERSHIPS.includes(p) || p === ANNUAL, isIntro = p.id === 'intro3';
  const title = isIntro ? 'Intro pack' : p.name.charAt(0).toUpperCase() + p.name.slice(1);
  const priceTxt = money(p.price) + (p.per ? ' a ' + (p.per === 'mo' ? 'month' : 'year') : '');
  const extra = (isIntro ? '' : `<label class="field span2"><span>Promo code (optional)</span><input name="promo" autocapitalize="characters"></label>`) + (isMember ? '<label class="check span2"><input type="checkbox" name="agree" required> I understand that classes don’t roll over and that cancelling takes 30 days’ notice by email.</label>' : '');
  const summary = `<div class="summary"><div class="summary__name">${isIntro ? '3 classes for $39' : esc(title)}</div><div><b>${priceTxt}</b><br><small>${esc(p.terms)}</small></div></div>`;
  const two = twoPaths({
    ask: isMember ? 'How do you want to join?' : 'How do you want to buy it?', quick: `<form id="buy-form" novalidate>${detailsFields(extra)}</form>`,
    quickFoot: `<span class="small">Pay at your first visit</span><button class="btn btn-red" type="button" id="buy-go">${isMember ? 'Sign me up' : isIntro ? 'Get the intro pack' : 'Reserve this pack'}</button>`,
    wlSub: 'Pay by card now', wlTitle: isMember ? 'Join on WellnessLiving' : 'Buy on WellnessLiving',
    wlText: `Pay by card and the ${isMember ? 'membership is' : 'classes are'} on your account straight away. You'll sign in or create a WellnessLiving account there.`,
    wlHref: wlItem(p), wlLabel: isMember ? 'Join on WellnessLiving' : 'Buy on WellnessLiving',
  });
  sheetSet(isMember ? 'Join' : 'Buy', title, stepsBar(1, 2) + summary + two.body, two.foot);
  openOverlay('sheet');
  bindPaths(() => inboxAdd('WellnessLiving', title + ', ' + priceTxt, 'Left the site to buy this on WellnessLiving.'));
  $('#buy-go').onclick = () => {
    const form = $('#buy-form'); if (!validate(form)) return;
    const f = new FormData(form), promo = (f.get('promo') || '').trim().toUpperCase(), disc = promo === 'NEW25' && !isMember && !isIntro ? Math.min(25, p.price) : 0;
    inboxAdd(isMember ? 'New member' : isIntro ? 'Intro pack' : 'Class pack', isIntro ? '3 classes for $39' : title, `Quick sign-up. ${money(p.price - disc)}${p.per ? ' a ' + (p.per === 'mo' ? 'month' : 'year') : ''}${disc ? ' after NEW25' : ''}${promo && !disc ? ' (code ' + promo + ' not applied)' : ''}, to pay at the first visit. Set it up in WellnessLiving.`, personOf(f));
    sheetSet('Done', title, stepsBar(2, 2) + `<div class="conf"><div class="conf__big">${isMember ? 'Welcome to the studio' : 'You’re signed up'}</div><ul class="conf__list"><li><span>Signed up for</span><span>${isIntro ? '3 classes for $39' : esc(title)}</span></li><li><span>Total</span><span>${money(p.price - disc)}${p.per ? ' a ' + (p.per === 'mo' ? 'month' : 'year') : ''}${disc ? ' with NEW25' : ''}</span></li><li><span>Paying</span><span>At the front desk on your first visit, or with the link we text you</span></li><li><span>Next</span><span>Pick a class. Your ${isMember ? 'membership' : 'classes'} will be applied when you book.</span></li></ul><div class="btn-row"><a class="btn btn-red" href="#schedule" data-action="overlay-close">Book a class</a></div></div>`, `<span></span><button class="btn btn-line" type="button" data-action="overlay-close">Close</button>`);
  };
}

/* ---- request private training or a sauna session. opt is the row the visitor pressed. ---- */
function openInquiry(kind, opt) {
  const isT = kind === 'training', n = Math.max(0, parseInt(opt, 10) || 0);
  const slots = ['Early morning', 'Midday', 'Afternoon', 'Evening'];
  const opts = isT ? TRAINING.map(r => r.name + ', ' + r.len + (r.price != null ? ', ' + money(r.price) : ', price on request'))
    : ['Single session, $45', '10 sessions, $315', 'Unlimited, $199 a month', 'Swap for a missed membership class'];
  const pick = Math.min(n, opts.length - 1), pack = isT && TRAINING[pick].price == null;
  const extra = `<label class="field span2"><span>Which option</span><select name="opt">${opts.map((o, i) => `<option${i === pick ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></label>
    <label class="field"><span>Preferred day</span><input name="date" type="date"></label><label class="field"><span>Time of day</span><select name="slot">${slots.map(s => `<option>${s}</option>`).join('')}</select></label>` +
    (isT ? `<label class="field span2"><span>What would you like to work on? (optional)</span><textarea name="goal"></textarea></label>` : '');
  const title = !isT ? 'Book a sauna session' : pack ? 'Ask about a training pack' : pick === 0 ? 'Request an intro session' : 'Request a private session';
  const lead = !isT ? 'Sessions are booked around the class schedule. We’ll text you to confirm a time.'
    : pack ? 'Packs of five and ten sessions are priced individually. Send this and we’ll text you the price and some times.'
    : pick === 0 ? 'The intro session is 30 minutes and costs $45. It covers a movement assessment, your health history and your goals. We’ll text you to confirm a time.'
    : 'Tell us when suits you and we’ll text you to confirm a time with an instructor.';
  sheetSet(isT ? 'Private training' : 'Infrared sauna', title, `<p style="margin-bottom:20px">${lead}</p><form id="inq-form" novalidate>${detailsFields(extra)}</form>
    <p class="note" style="margin-top:16px">Have a WellnessLiving account? You can also <a class="u" id="wl-go" href="${esc(LPP.wlStore)}" target="_blank" rel="noopener">buy sessions on WellnessLiving</a>. ${WL_REAL}</p>`,
    `<span class="small">Nothing is charged until we confirm</span><button class="btn btn-red" type="button" id="inq-go">Send request</button>`);
  openOverlay('sheet');
  $('#wl-go').onclick = () => { inboxAdd('WellnessLiving', isT ? 'Private training' : 'Infrared sauna', 'Left the site to buy sessions on WellnessLiving.'); };
  $('#inq-go').onclick = () => {
    const form = $('#inq-form'); if (!validate(form)) return;
    const f = new FormData(form), chosen = String(f.get('opt')), ask = chosen.includes('price on request');
    inboxAdd(isT ? 'Training request' : 'Sauna request', chosen.replace(', price on request', ''), `${f.get('date') || 'Any day'}, ${String(f.get('slot')).toLowerCase()}.${f.get('goal') ? ' Wants to work on: ' + String(f.get('goal')).trim().replace(/\.+$/, '') + '.' : ''} ${ask ? 'Text them the pack price and some times.' : 'Text them to confirm a time.'}`, personOf(f));
    sheetSet('Sent', 'Request sent', `<div class="conf"><div class="conf__big">${ask ? 'We’ll text you the price and times' : 'We’ll text you to confirm a time'}</div><p>If you need an answer sooner, text 312-286-5845.</p></div>`, `<span></span><button class="btn btn-red" type="button" data-action="overlay-close">Done</button>`);
  };
}

/* ---- bag ---- */
function cartLines() { return Object.entries(STATE.cart).map(([id, n]) => ({ p: PRODUCTS.find(x => x.id === id), n })).filter(l => l.p); }
function openCart() {
  const lines = cartLines(), total = lines.reduce((a, l) => a + l.p.price * l.n, 0);
  sheetSet('Shop', 'Your bag', lines.length ? lines.map(l => `<div class="cart-line"><span>${esc(l.p.name)}<br><small>${money(l.p.price)} each</small></span><span class="qty"><button type="button" data-action="qty" data-p="${l.p.id}" data-n="-1" aria-label="Remove one">−</button><output>${l.n}</output><button type="button" data-action="qty" data-p="${l.p.id}" data-n="1" aria-label="Add one">+</button></span><b>${money(l.p.price * l.n)}</b></div>`).join('') + `<div class="cart-total"><span>Total</span><span>${money(total)}</span></div><p class="note" style="margin-top:12px">Pick up at the front desk before or after any class. We don't ship.</p>` : '<p class="kempty" style="border:0">Your bag is empty. <a class="u" href="#shop" data-action="overlay-close">See the shop</a></p>',
    lines.length ? `<span class="small">Pick up at the desk</span><button class="btn btn-red" type="button" data-action="checkout">Check out</button>` : `<span></span><button class="btn btn-line" type="button" data-action="overlay-close">Close</button>`);
  if (!$('#sheet').classList.contains('on')) openOverlay('sheet');
}
function openCheckout() {
  const lines = cartLines(), total = lines.reduce((a, l) => a + l.p.price * l.n, 0), count = lines.reduce((a, l) => a + l.n, 0);
  sheetSet('Shop', 'Check out', `<div class="summary"><div class="summary__name">${count} item${count === 1 ? '' : 's'}, ${money(total)}</div><div><small>${lines.map(l => l.n + ' x ' + esc(l.p.name)).join(', ')}</small></div></div><form id="co-form" novalidate>${detailsFields()}</form><p class="note" style="margin-top:16px">${DEMO}</p>`,
    `<span class="small">Pay when you pick up</span><button class="btn btn-red" type="button" id="co-go">Place order, ${money(total)}</button>`);
  $('#co-go').onclick = () => {
    const form = $('#co-form'); if (!validate(form)) return;
    const f = new FormData(form);
    inboxAdd('Pickup order', money(total) + ', ' + count + ' item' + (count === 1 ? '' : 's'), lines.map(l => l.n + ' x ' + l.p.name).join(', ') + '. Hold at the desk.', personOf(f));
    STATE.cart = {}; save(); renderCartBadge();
    sheetSet('Done', 'Order placed', `<div class="conf"><div class="conf__big">Pick it up at the front desk</div><p>We'll have it ready before your next class.</p></div>`, `<span></span><button class="btn btn-red" type="button" data-action="overlay-close">Done</button>`);
  };
}

/* ---- forms on the page ---- */
const EV_FORM = $('#ev-form').innerHTML;
/* an event type's own button: put that type in the form and move to it */
function pickEvent(type) {
  const form = $('#ev-form');
  if (!form.querySelector('[name=type]')) form.innerHTML = EV_FORM;
  form.querySelector('[name=type]').value = type;
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  form.querySelector('[name=name]').focus({ preventScroll: true });
  toast(type + ' selected. Add your details and a date.');
}

$('#ev-form').addEventListener('submit', e => {
  e.preventDefault(); const form = e.target; if (!validate(form)) return;
  const f = new FormData(form);
  inboxAdd('Event inquiry', `${f.get('type')}${f.get('guests') ? ', ' + f.get('guests') + ' guests' : ''}`, `${f.get('date') || 'No date given'}.${f.get('notes') ? ' ' + f.get('notes') : ''} Reply with availability and a quote.`, { name: f.get('name'), email: f.get('email') });
  form.innerHTML = `<h2 class="h-m" style="margin-bottom:14px">Inquiry sent</h2><div class="ok-box">Susan will reply with availability and a quote. If it's urgent, text 312-286-5845.</div>`;
});
$('#contact-form').addEventListener('submit', e => {
  e.preventDefault(); const form = e.target; if (!validate(form)) return;
  const f = new FormData(form);
  const msg = String(f.get('msg')).trim();
  inboxAdd('Message', msg.length > 80 ? msg.slice(0, 77) + '...' : msg, msg.length > 80 ? msg : 'Reply to them.', { name: f.get('name'), contact: f.get('contact') });
  form.innerHTML = `<h3 class="h-m" style="margin-bottom:14px">Message sent</h3><div class="ok-box">We'll reply to ${esc(f.get('contact'))}.</div>`;
});
$('#ev-form').setAttribute('novalidate', ''); $('#contact-form').setAttribute('novalidate', '');

/* ---- start ---- */
function refreshAll() { renderToday(); if (currentPage === 'schedule') renderSchedule(); renderClassList(); renderFinder(); }
function init() {
  seedSamples();
  renderTiles(); renderClassList(); renderNames(); renderQuotes(); renderShop(); renderCartBadge(); renderFaq(); renderNewFaq(); renderHours(); renderRates(); renderFinder(); renderInbox(); renderPricing();
  renderCalc(); $('#calc-range').addEventListener('input', renderCalc);
  renderToday(); setInterval(() => { if (currentPage === 'home') renderToday(); }, 60000);
  route();
}
init();

/* for the test harness */
window.__lpp = { SCHEDULE, STATE, save, renderSchedule, chicagoNow };
