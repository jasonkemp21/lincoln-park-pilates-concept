/* ---------- Lincoln Park Pilates: content pulled from lincolnparkpilates.com and the studio's WellnessLiving account (Nov 2026) ---------- */
const LPP = {
  name: 'Lincoln Park Pilates',
  addr1: '2105 N Southport Ave, Suite 200',
  addr2: 'Chicago, IL 60614',
  phone: '312-286-5845',
  email: 'info@lincolnparkpilates.com',
  ig: 'https://www.instagram.com/lincolnparkpilates',
  fb: 'https://www.facebook.com/lincolnparkpilates',
  wlSchedule: 'https://www.wellnessliving.com/schedule/lincolnparkpilates',
  wlStore: 'https://www.wellnessliving.com/catalog/lincolnparkpilates',
  liveSite: 'https://www.lincolnparkpilates.com/',
  maps: 'https://www.google.com/maps/search/?api=1&query=Lincoln+Park+Pilates+2105+N+Southport+Ave+Chicago+IL+60614',
  wlBusiness: 321493,
  capacity: 12,
  temp: '75–85°F',
};

/* A plan's own page in the studio's WellnessLiving store. Plans whose catalog ID wasn't captured go to the store's front page. */
const wlItem = p => p && p.wl ? 'https://www.wellnessliving.com/rs/catalog-view.html?k_business=' + LPP.wlBusiness + '&id_sale=1&k_id=' + p.wl : LPP.wlStore;

/* class formats: the five that actually run on the WellnessLiving schedule, plus private training */
const CLASSES = {
  intro:  { id: 'intro',  name: 'Intro to Pilates Reformer',   short: 'Intro',      level: 'First-timers',    min: 45, photo: 'c-intro',
            line: 'Learn how the machine works before anything else.',
            desc: 'For people who have never been on a reformer. You learn how the carriage, springs and straps work and how to set the machine up, then try the basic movements. Saturdays at 11:30.' },
  form:   { id: 'form',   name: 'Form Focus Pilates Reformer', short: 'Form Focus', level: 'All levels',      min: 45, photo: 'c-form',
            line: 'Traditional exercises at a slower pace.',
            desc: 'Traditional Pilates exercises taken slowly, with more time spent on how each one should feel. A good first or second class, and a useful reset if you have been coming for years.' },
  flow:   { id: 'flow',   name: 'Pilates Reformer Flow',       short: 'Flow',       level: 'All levels',      min: 45, photo: 'c-flow',
            line: 'Traditional reformer Pilates, start to finish.',
            desc: 'Traditional Pilates technique, with each exercise leading into the next. Flow runs six days a week and is the class we suggest after Intro.' },
  power:  { id: 'power',  name: 'Pilates Power Reformer',      short: 'Power',      level: 'Some experience', min: 45, photo: 'c-power',
            line: 'Athletic resistance Pilates, for once you know the machine.',
            desc: 'Athletic, resistance-based Pilates. Expect to work harder than in Flow. Take it once you know your way around the reformer.' },
  sculpt: { id: 'sculpt', name: 'Reformer Sculpt',             short: 'Sculpt',     level: 'All levels',      min: 45, photo: 'c-sculpt',
            line: 'Six classes a week, including a 30-minute one on Fridays.',
            desc: 'Sculpt work on the reformer, open to all levels. Most classes run 45 minutes. Friday at 4:30 is a 30-minute version.' },
};
const CLASS_ORDER = ['intro', 'form', 'flow', 'power', 'sculpt'];

/* weekly timetable, taken from the WellnessLiving "All Classes" schedule for the week of Nov 2–8, 2026 (Central Time). d: 0=Sun … 6=Sat, t: minutes after midnight */
const T = (h, m) => h * 60 + m;
const SCHEDULE = [
  // Monday
  { d: 1, t: T(6, 0),  min: 45, c: 'power',  i: 'Miranda', s: 'Studio 1' },
  { d: 1, t: T(7, 0),  min: 45, c: 'sculpt', i: 'Miranda', s: 'Studio 1' },
  { d: 1, t: T(9, 0),  min: 45, c: 'form',   i: 'Lea',     s: 'Studio 1' },
  { d: 1, t: T(16, 30), min: 45, c: 'power', i: 'Rachel',  s: 'Studio 2' },
  { d: 1, t: T(17, 30), min: 45, c: 'flow',  i: 'Rachel',  s: 'Studio 1' },
  { d: 1, t: T(18, 30), min: 45, c: 'power', i: 'Griffin', s: 'Studio 1' },
  // Tuesday
  { d: 2, t: T(6, 0),  min: 45, c: 'power',  i: 'Grace',   s: 'Studio 1' },
  { d: 2, t: T(7, 0),  min: 45, c: 'power',  i: 'Grace',   s: 'Studio 1' },
  { d: 2, t: T(9, 0),  min: 45, c: 'flow',   i: 'Grace',   s: 'Studio 1' },
  { d: 2, t: T(16, 30), min: 45, c: 'power', i: 'Susan',   s: 'Studio 1' },
  { d: 2, t: T(17, 30), min: 45, c: 'flow',  i: 'Griffin', s: 'Studio 1' },
  { d: 2, t: T(18, 30), min: 45, c: 'power', i: 'Griffin', s: 'Studio 1' },
  // Wednesday
  { d: 3, t: T(7, 0),  min: 45, c: 'power',  i: 'Rachel',  s: 'Studio 1' },
  { d: 3, t: T(8, 0),  min: 45, c: 'flow',   i: 'Susan',   s: 'Studio 1' },
  { d: 3, t: T(9, 0),  min: 45, c: 'flow',   i: 'Lea',     s: 'Studio 1' },
  { d: 3, t: T(16, 30), min: 45, c: 'flow',  i: 'Grace',   s: 'Studio 1' },
  { d: 3, t: T(17, 30), min: 45, c: 'flow',  i: 'Grace',   s: 'Studio 1' },
  { d: 3, t: T(18, 30), min: 45, c: 'power', i: 'Grace',   s: 'Studio 1' },
  // Thursday
  { d: 4, t: T(6, 0),  min: 45, c: 'power',  i: 'Grace',   s: 'Studio 1' },
  { d: 4, t: T(7, 0),  min: 45, c: 'power',  i: 'Grace',   s: 'Studio 1' },
  { d: 4, t: T(9, 0),  min: 45, c: 'sculpt', i: 'Grace',   s: 'Studio 1' },
  { d: 4, t: T(17, 30), min: 45, c: 'sculpt', i: 'Emily',  s: 'Studio 2' },
  { d: 4, t: T(18, 30), min: 45, c: 'power', i: 'Emily',   s: 'Studio 1' },
  // Friday (spot counts as shown on WellnessLiving on Nov 6, 2026)
  { d: 5, t: T(6, 0),  min: 45, c: 'flow',   i: 'Rachel',  s: 'Studio 1', left: 9 },
  { d: 5, t: T(7, 0),  min: 45, c: 'flow',   i: 'Rachel',  s: 'Studio 1', left: 7 },
  { d: 5, t: T(8, 0),  min: 45, c: 'sculpt', i: 'Susan',   s: 'Studio 1', left: 8 },
  { d: 5, t: T(9, 0),  min: 45, c: 'flow',   i: 'Susan',   s: 'Studio 1', left: 8 },
  { d: 5, t: T(12, 0), min: 45, c: 'power',  i: 'Susan',   s: 'Studio 1', left: 9 },
  { d: 5, t: T(16, 30), min: 30, c: 'sculpt', i: 'Taylor', s: 'Studio 1', left: 11 },
  { d: 5, t: T(17, 30), min: 45, c: 'flow',  i: 'Taylor',  s: 'Studio 1', left: 9 },
  // Saturday
  { d: 6, t: T(8, 30),  min: 45, c: 'power', i: 'Rachel',  s: 'Studio 1', left: 10 },
  { d: 6, t: T(9, 30),  min: 45, c: 'flow',  i: 'Rachel',  s: 'Studio 1', left: 2 },
  { d: 6, t: T(10, 30), min: 45, c: 'power', i: 'Rachel',  s: 'Studio 1', left: 2 },
  { d: 6, t: T(11, 30), min: 45, c: 'intro', i: 'Susan',   s: 'Studio 1', left: 9 },
  // Sunday
  { d: 0, t: T(8, 30),  min: 45, c: 'flow',  i: 'Rachel',  s: 'Studio 1', left: 9 },
  { d: 0, t: T(9, 30),  min: 45, c: 'power', i: 'Rachel',  s: 'Studio 1', left: 11 },
  { d: 0, t: T(10, 30), min: 45, c: 'flow',  i: 'Rachel',  s: 'Studio 1', left: 6 },
  { d: 0, t: T(11, 30), min: 45, c: 'flow',  i: 'Susan',   s: 'Studio 1', left: 12 },
  { d: 0, t: T(17, 0),  min: 45, c: 'sculpt', i: 'Miranda', s: 'Studio 1', left: 11 },
].map((x, n) => ({ ...x, id: 'k' + n, left: x.left == null ? 12 - ((n * 7) % 9) : x.left }));

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_S = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* the team: names as they appear on the schedule. No bios exist on the current site, so none are invented here. */
const TEAM = [
  { n: 'Susan',   role: 'Owner & instructor', note: 'Opened the studio and teaches across the week, including Saturday\u2019s Intro.' },
  { n: 'Rachel',  role: 'Instructor', note: 'Anchors the weekend mornings, plus Monday evenings and Friday at dawn.' },
  { n: 'Grace',   role: 'Instructor', note: 'The early block Tuesday through Thursday, and Wednesday evenings.' },
  { n: 'Lea',     role: 'Instructor', note: 'Monday and Wednesday at nine.' },
  { n: 'Miranda', role: 'Instructor', note: 'Monday at six and seven, Sunday at five.' },
  { n: 'Griffin', role: 'Instructor', note: 'Monday and Tuesday evenings.' },
  { n: 'Emily',   role: 'Instructor', note: 'Thursday evenings.' },
  { n: 'Taylor',  role: 'Instructor', note: 'Friday afternoons.' },
];

/* pricing, from the WellnessLiving catalog (the system of record) with the website's descriptions where they agree */
const MEMBERSHIPS = [
  { id: 'm4',  name: '4 classes a month',  price: 129, per: 'mo', classes: 4,  terms: '3-month minimum, then month to month', wl: 3057633 },
  { id: 'm8',  name: '8 classes a month',  price: 199, per: 'mo', classes: 8,  terms: '3-month minimum, then month to month', wl: 3057635, hi: true },
  { id: 'm12', name: '12 classes a month', price: 249, per: 'mo', classes: 12, terms: '3-month minimum, then month to month', wl: 3258041 },
  { id: 'm16', name: '16 classes a month', price: 269, per: 'mo', classes: 16, terms: '3-month minimum, then month to month', wl: 0 },
  { id: 'm20', name: '20 classes a month', price: 289, per: 'mo', classes: 20, terms: '3-month minimum, then month to month', wl: 3057641 },
  { id: 'mu',  name: 'Unlimited',          price: 349, per: 'mo', classes: 30, terms: 'No contract. 30-day notice to cancel', wl: 2429108, red: true },
];
const ANNUAL = { id: 'elite', name: 'Elite annual, 20 classes a month', price: 2399, per: 'yr', classes: 20, terms: 'Prepaid for 12 months. Regularly $3,108', wl: 0 };
const PACKAGES = [
  { id: 'intro3', name: '3 classes for $39', price: 39, classes: 3, terms: 'New clients only. 2026 intro pack', flag: 'New here?', wl: 0 },
  { id: 'drop',   name: 'Drop-in class',     price: 40, classes: 1, terms: 'One class, any format', wl: 2080978 },
  { id: 'p5',     name: '5 classes',         price: 190, classes: 5, terms: 'Use within 3 months', wl: 2343310 },
  { id: 'p10',    name: '10 classes',        price: 380, classes: 10, terms: 'Use within 90 days', wl: 2099735 },
  { id: 'p20',    name: '20 classes',        price: 620, classes: 20, terms: 'Use within 180 days', wl: 2387826 },
];
const TRAINING = [
  { name: 'Intro session', len: '30 min', price: 45, note: 'First-timers. Assessment, measurements and goals', wl: 2625686 },
  { name: 'Single session', len: '30 min', price: 75, wl: 2618109 },
  { name: 'Single session', len: '60 min', price: 120, wl: 2343643 },
  { name: 'Five sessions', len: '30 min each', price: null, note: 'Pack price on request', wl: 2618139 },
  { name: 'Ten sessions', len: '30 min each', price: null, note: 'Pack price on request', wl: 2618105 },
];
const SAUNA = [
  { name: 'Single session', price: 45, per: '', wl: 2099878 },
  { name: '10 sessions', price: 315, per: '', note: '$31.50 a session', wl: 2576510 },
  { name: 'Unlimited', price: 199, per: 'mo', wl: 2218309 },
];
const PROMO = { code: 'NEW25', text: '$25 off your first class or package' };

const PRODUCTS = [
  { id: 'flexi', name: 'Flexistretcher', price: 59, desc: 'Elastic stretch strap.', art: 'strap' },
  { id: 'ball',  name: 'FLX Pilates ball', price: 59, desc: '9-inch inflatable ball.', art: 'ball' },
  { id: 'wheelL', name: 'Large yoga wheel', price: 36, desc: 'For stretching along the spine.', art: 'wheel' },
  { id: 'wheelS', name: 'Small yoga wheel', price: 26, desc: '5-inch wheel for rolling the spine.', art: 'wheel' },
  { id: 'block', name: 'FLX yoga block', price: 14, desc: 'High-density EVA foam.', art: 'block' },
  { id: 'inf',   name: 'FLX Infinity ball', price: 22, desc: 'Contoured trigger-point ball.', art: 'ball' },
  { id: 'deep',  name: 'Deep-tissue massage ball', price: 22, desc: 'High-density ball for large muscle groups.', art: 'ball' },
  { id: 'cryo',  name: 'Cryotherapy ball', price: 30, desc: 'Massage and ice therapy in one.', art: 'ball' },
  { id: 'stick', name: 'FLX massage stick', price: 26, desc: 'Handheld roller.', art: 'stick' },
  { id: 'band',  name: 'FLX resistance band', price: 12, desc: 'Medium resistance.', art: 'band' },
  { id: 'tape',  name: 'FLX kinesio tape', price: 12, desc: 'Support tape for muscles and joints.', art: 'tape' },
  { id: 'socks', name: 'Grip socks', price: null, desc: 'Non-slip socks. Ask at the desk for the price.', art: 'socks' },
];

const FAQ = [
  { c: 'First visit', q: 'I’ve never done reformer Pilates. Where do I start?', a: 'Take Intro to Pilates Reformer (Saturdays at 11:30), Pilates Reformer Flow or Form Focus first. All three are built for people new to the machine.' },
  { c: 'First visit', q: 'What do I wear and bring?', a: 'Workout clothes you can move in. No shoes in the studios: go barefoot or wear non-slip grip socks (sold at the desk). You don’t need to bring a mat.' },
  { c: 'First visit', q: 'How do I get in?', a: 'Entrances on Southport and on Clybourn. The studio is on the second floor, and your reservation email includes the door code.' },
  { c: 'First visit', q: 'Are the classes heated?', a: 'Studios are kept at 75 to 85 degrees. That is warm enough to work up a sweat and well short of hot yoga.' },
  { c: 'First visit', q: 'How often should I come?', a: 'Twice a week is where most people start to see and feel the difference.' },
  { c: 'Booking', q: 'What if a class is full?', a: 'Join the waitlist. Spots open up often, especially on weekends. You’ll get an email the moment you’re in, so keep an eye on your inbox.' },
  { c: 'Booking', q: 'What is the cancellation policy for classes?', a: 'Cancel at least 12 hours before class. Late cancels and no-shows are a $25 fee, because a reformer spot someone else could have taken has gone unused.' },
  { c: 'Booking', q: 'The instructor changed. Can I cancel without the fee?', a: 'Yes. If the instructor is switched within 12 hours of class, text 312-286-5845 and we’ll cancel it for you, no fee.' },
  { c: 'Booking', q: 'Do you ever cancel classes?', a: 'Rarely. A class with three or fewer people booked may be cancelled before it starts. You’d be told by email or text.' },
  { c: 'Memberships', q: 'Do unused membership classes roll over?', a: 'No, classes are for the billing month they come in. If you forget one, you can redeem a complimentary infrared sauna session once, as a first-time courtesy.' },
  { c: 'Memberships', q: 'How do I cancel a membership?', a: 'Email info@lincolnparkpilates.com with 30 days’ notice. Memberships with a minimum term can be cancelled with 30 days’ notice once the term is up.' },
  { c: 'Memberships', q: 'Can I bring a friend?', a: 'Members can bring a first-time Chicago friend for $15 and any other guest for $25.' },
  { c: 'Memberships', q: 'Is there a referral reward?', a: 'Yes. Refer a friend who becomes a member and you get $100 off, applied on their second month.' },
  { c: 'Studio', q: 'Is there parking?', a: 'Free street parking on Southport and on Dickens. The Clybourn Metra stop and the Armitage Brown Line stop are both walkable.' },
  { c: 'Studio', q: 'Do you have showers and lockers?', a: 'Four showers in the women’s locker room, two in the men’s, with towels, shampoo and conditioner provided. Lockers with locks are available.' },
  { c: 'Studio', q: 'What is a reformer, exactly?', a: 'A sliding carriage on a frame, attached by springs that set the resistance. Invented by Joseph Pilates. The springs make the work easier on joints than free weights, and the straps and bar let you train the whole body on one machine.' },
  { c: 'Studio', q: 'Will Pilates help me lose weight?', a: 'Indirectly: it builds muscle tone, flexibility and overall fitness. On its own it is not a weight-loss program, so pair it with cardio and a balanced diet.' },
  { c: 'Training', q: 'What happens in a first private session?', a: 'A total-body movement assessment, measurements, health history and goal setting. Your trainer then builds a program around what you want to achieve.' },
  { c: 'Training', q: 'What is the cancellation policy for training?', a: 'Changes or cancellations less than 24 hours before a training session forfeit the session.' },
  { c: 'Events', q: 'Can I rent the studio?', a: 'Yes. Birthdays, showers, company events, bachelorettes, filming and private Pilates parties. The reformer studio holds 12 and the mat studio holds 35. Text Susan at 312-286-5845 or use the form on the Events page.' },
  { c: 'Sauna', q: 'How does the infrared sauna work?', a: 'Infrared heat warms your body directly rather than the air around you, so the room stays comfortable while you sweat. Sessions are booked like an appointment. You can buy a single session, a 10-pack or an unlimited monthly plan.' },
];

/* three short excerpts, each from a different Google review of the studio, word for word */
const REVIEWS = [
  { q: 'There\u2019s zero intimidation factor here, which is honestly rare.', who: '', src: 'Google review' },
  { q: 'She is creative and challenges us just enough in each class.', who: '', src: 'Google review, about Lea\u2019s classes' },
  { q: 'Sue is a phenomenal instructor!', who: '', src: 'Google review, about the owner' },
];
