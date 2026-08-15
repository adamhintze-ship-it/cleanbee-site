# Clean Bee

Marketing site and booking flow for Clean Bee, a cleaning company serving Davis
County, Utah. Implemented from the `Clean Bee.dc.html` design canvas.

Static HTML, CSS and vanilla JavaScript — no build step, no dependencies, no
framework. Deploy it by copying the directory to any static host.

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

### Wiring up a real backend

The wizard currently confirms client-side and does not transmit anything. The
submit handler in `assets/js/app.js` marks the spot:

```js
/* Where a real backend goes: POST the booking, then show confirmation. */
state.submitted = true;
```

Replace that with a `fetch` to your booking endpoint, and show the confirmation
view on success. `state` already holds every field the form collects.

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
