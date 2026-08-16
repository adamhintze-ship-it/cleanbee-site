# Clean Bee

Marketing site and booking flow for Clean Bee, a cleaning company serving Davis
County, Utah. Implemented from the `Clean Bee.dc.html` design canvas.

Static HTML, CSS and vanilla JavaScript — no build step, no dependencies, no
framework. Deploy it by copying the directory to any static host.

> **Editing the site without touching code?** See **[EDITING.md](EDITING.md)** —
> a plain-English guide to changing wording, swapping in photos, adjusting
> prices and turning on booking emails, all from the browser.

## Deploying to Vercel

Import the repository at [vercel.com/new](https://vercel.com/new). There is
nothing to configure — `vercel.json` already declares it as a static site with
no build step, so accept the defaults and deploy.

Every push to the production branch redeploys automatically, usually in under a
minute.

Two things worth knowing:

- **Routing needs no rewrites.** Navigation is hash-based (`#/pricing`), so the
  server only ever serves `index.html`. Deep links work on any static host with
  zero configuration.
- **Photos are cached for one hour, not a year.** `vercel.json` sets a short
  revalidating cache on `assets/img/` deliberately: filenames are stable, so a
  long cache would leave a swapped photo stale for weeks. The trade is a
  negligible amount of extra bandwidth.

## Running it locally

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

Any static file server works. Opening `index.html` straight off the filesystem
works too, though the photo placeholders behave more predictably over HTTP.

## Layout

```
index.html            all five views, in source order: home, services, pricing, about, book
assets/css/styles.css design tokens, then components in the order they appear
assets/js/app.js      hash routing, the booking wizard, and the price estimate
assets/img/           photography — see assets/img/README.md for the filenames
```

## Routing

Client-side, hash based, so it works on any static host with no server rewrites:

| Route | View |
| --- | --- |
| `#/` | Home |
| `#/services` | Services |
| `#/pricing` | Pricing |
| `#/about` | About |
| `#/book` | Booking wizard |

Every route is linkable and survives a reload. Back and forward work.

## The booking wizard

Three steps — your space, extras and timing, contact — with a running estimate
that updates as you go. The estimate is computed in the browser from the tables
at the top of `assets/js/app.js`:

```
estimate = round((base + rooms + sqft surcharge) × frequency multiplier) + add-ons
```

- `base` starts at $99 for a recurring clean and shifts with the type of clean.
- `rooms` is $22 per bedroom plus $18 per bathroom.
- Anything over 1,200 sq ft adds $0.045 per extra square foot.
- Frequency discounts the visit: weekly ×0.85, biweekly ×0.9, monthly ×0.95.
- Add-ons are flat, applied after the multiplier.
- Office and commercial work returns **Custom** — it is quoted after a walkthrough.

Serviced ZIP codes live in the `ZIPS` array in the same file; step 1 confirms
coverage as soon as a match is typed.

### Delivering the bookings

The POST is wired but unaddressed. Set `FORM_ENDPOINT` at the top of
`assets/js/app.js` to any endpoint that accepts a JSON body — Formspree,
Web3Forms, a Vercel serverless function, your own API:

```js
var FORM_ENDPOINT = 'https://formspree.io/f/abcdwxyz';
```

While it is empty the wizard confirms on screen and **sends nothing**, which is
the current state. `bookingPayload()` builds the flat object that gets posted;
a failed request surfaces the fallback phone number instead of falsely
confirming.

## Notes on the port

The design canvas was a prototype: one file, inline styles, a template runtime,
and drag-and-drop image slots. This implementation keeps the design pixel-faithful
while making it a real site.

- Inline styles became a token-driven stylesheet; `style-hover` attributes became
  real CSS `:hover` rules with transitions.
- The `sc-if` / `sc-for` template directives became hash routing and DOM rendering.
- `<image-slot>` placeholders became `<img>` tags that fall back to a styled
  honeycomb placeholder when the file is absent, so photos drop in without code
  changes.
- The prototype was a fixed desktop grid; the site is responsive down to 360px,
  with a collapsing header nav.
- Accessibility: skip link, landmarks, a real `<form>` with labelled fields,
  radio-group semantics with arrow-key support on the choice chips, visible focus
  rings, and `prefers-reduced-motion` handling.
- Step 3 checks that name, phone and a well-formed email are present before it
  confirms — the prototype advanced unconditionally.
