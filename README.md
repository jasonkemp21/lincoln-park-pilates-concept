# Lincoln Park Pilates website concept

A redesign concept for Lincoln Park Pilates (2105 N Southport Ave, Chicago), built by Jason Kemp to show the studio what its site could be.

**This is not the studio's live site.** Nothing here books a class or takes a payment. Every page carries a "Concept site, not live" label, and the page asks search engines not to index it.

## What's in it

- A home page with today's classes, the intro offer, the five class formats, the studio and how to get there
- The weekly schedule with filters, spots left and a waitlist
- Pricing with every membership and pack, plus a "which is cheapest for me" calculator
- Two ways to book or buy: a quick sign-up on the site, or a link to the studio's real WellnessLiving schedule or store
- A front desk portal (the Staff link in the footer) that lists everyone who signed up, with a status, notes and their history
- Pitch notes (the button on the concept label) covering what changed, what the design is modeled on, the current site's problems, a build plan and open questions

## What is real and what is simulated

- **Real:** class names, times and instructors for the week of November 2 to 8, 2026; prices and terms from the studio's WellnessLiving store; the address, hours and contact details; the photos, which are the studio's own.
- **Simulated:** quick sign-ups, purchases, requests and shop orders. They are kept in the browser that made them and go nowhere else. The front desk portal starts with six people tagged Sample.
- **Live links:** the WellnessLiving buttons open the studio's real schedule and store in a new tab. Anything booked or bought there is real.

## Run it

It is one static page. Open `index.html`, or serve the folder:

```
npx serve .
```

## Change it

The page is assembled from `src/`:

```
src/css/    styles, in load order
src/html/   page sections, in load order
src/js/     data, routing, rendering, booking, front desk portal
build.mjs   joins them into index.html
```

After editing anything in `src/`:

```
node build.mjs
```

## Test it

The tests drive a real browser and need Playwright (`npm i -D playwright && npx playwright install chromium`).

```
node test/flows.mjs test/flows desktop   # books, buys, sends every form, works the portal
node test/flows.mjs test/flows phone
node test/crawl.mjs desktop              # clicks every link and button and reports any that do nothing
node test/shots.mjs                      # screenshots of every page at laptop and phone width
```

## Credits

Photos, the name and the logo colours belong to Lincoln Park Pilates and are used here only to show the studio its own content in a new layout. Type is Big Shoulders and Hanken Grotesk, loaded from Google Fonts.
