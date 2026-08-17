# Editing the Clean Bee website

This guide is for making changes without installing anything. You edit files on
GitHub in your browser, and the live site updates itself about 30 seconds later.

No software to install. No commands to type. If you can use a text box, you can
do everything on this page.

---

## The one thing to know first

The website is built from a few files stored on GitHub. When you save a change
there, Vercel notices and rebuilds the live site automatically. That's the whole
loop:

> **Edit on GitHub → wait ~30 seconds → refresh the site**

If you break something, nothing is lost. Every change is saved as a separate
version, and any of them can be restored. See [Undoing a change](#undoing-a-change)
at the bottom.

---

## Adding your photos

This is the easiest change and needs no code at all.

The site has ten photo slots. Until you add a real photo, each one shows a
honeycomb pattern with a caption describing the picture that belongs there.

### The filenames

Your photo has to be named **exactly** like the file below, or the site won't
find it. Lowercase, with the hyphens, ending in `.jpg`.

| Name the file | Where it shows up | What it should be |
| --- | --- | --- |
| `hero.jpg` | Top of the home page | A bright, freshly cleaned kitchen or living room |
| `ba-1-before.jpg` | Before & after, first pair | Messy kitchen, before |
| `ba-1-after.jpg` | Before & after, first pair | The same kitchen, cleaned |
| `ba-2-before.jpg` | Before & after, second pair | Bathroom, before |
| `ba-2-after.jpg` | Before & after, second pair | The same bathroom, cleaned |
| `about.jpg` | About page, top | The crew, or the van |
| `crew-rosa.jpg` | About page, crew row | Portrait |
| `crew-dan.jpg` | About page, crew row | Portrait |
| `crew-amara.jpg` | About page, crew row | Portrait |
| `crew-tomas.jpg` | About page, crew row | Portrait |

### How to upload them

1. Go to the repository on GitHub and open the `assets` folder, then `img`.
2. Click **Add file → Upload files**.
3. Drag your photos in. Make sure each filename matches the table exactly.
4. Scroll down and click **Commit changes**.

Wait half a minute, refresh the site, and they're live.

### A few tips

- **Rename before uploading.** It's much easier than renaming afterwards.
- **Keep the subject centred.** Photos are cropped to fit their slot, so the
  edges may be trimmed. The middle is always safe.
- **Big photos are fine, huge ones are slow.** Around 1500 pixels wide is
  plenty. If a photo is straight off a phone and over 5MB, shrink it first —
  otherwise the page loads slowly on mobile data.
- **Replacing a photo** works the same way: upload a new file with the same
  name and confirm the overwrite. Give it a couple of minutes and hard-refresh
  (Ctrl+Shift+R, or Cmd+Shift+R on a Mac) if you still see the old one.

---

## Changing wording on the page

All the visible text lives in one file: **`index.html`**.

1. Open `index.html` on GitHub.
2. Click the **pencil icon** at the top right.
3. Use Ctrl+F (Cmd+F on a Mac) to find the words you want to change.
4. Type your new wording **in place of the old**, leaving everything around it
   untouched.
5. Scroll to the bottom and click **Commit changes**.

### The golden rule

The file is full of tags in angle brackets, like this:

```html
<h3 class="service-card__title">Deep clean</h3>
```

**Only change the words between the `>` and the `<`.** Here, `Deep clean` is
safe to edit. Everything else on that line makes the page work.

So this is fine:

```html
<h3 class="service-card__title">Deep clean &amp; sanitise</h3>
```

And this will break the page:

```html
<h3 class="service-card">Deep clean</h3>
```

### Two characters that need care

- **`&`** — write it as `&amp;`. You'll see this already in "Office &amp; commercial".
- **`<` and `>`** — avoid typing these in your text. They start and end tags.

Apostrophes, accents and quotes are all fine to type normally.

---

## Common changes, and where to find them

Open `index.html` and search for the text in the middle column.

| To change | Search for | Notes |
| --- | --- | --- |
| Phone number | `614-2233` | Appears **4 times** — change all of them. Two are the visible number, two are inside `tel:+18016142233` (no spaces or brackets in those). |
| Email address | `hello@cleanbee.co` | Also `jobs@cleanbee.co` on the "Work with us" link. |
| Opening hours | `Mon–Fri` | In the footer. |
| Licence number | `CB-40218` | In the footer. |
| Copyright year | `© 2026` | In the footer. |
| Star rating / review count | `4.8 on Google` | Also `4.8 ★ · 214 Google reviews` above the reviews. |
| The "cleans completed" figures | `2,340` | On the About page, alongside `9`, `$24` and `88%`. |
| Sticky bar on phones | `Next slot: tomorrow` | The bar pinned to the bottom of the screen on mobile. |
| The "from" prices on cards | `From $119` | These are display text only — see the next section for the calculator. |
| Service area towns | `Layton` | The honeycomb tiles on the home page. |
| Customer reviews | `three months into` | Three reviews, each with a name and a caption below it. |
| Crew names and roles | `Rosa Ibarra` | Four of them on the About page. |
| The About story | `Clean Bee began in Kaysville` | Two paragraphs. |

### Changing the page title in Google results

Near the very top of `index.html`:

```html
<title>Clean Bee — Professional home &amp; office cleaning in Davis County, UT</title>
<meta name="description" content="Clean Bee is a small crew of professional cleaners...">
```

These two lines are what people see in Google search results. Worth getting right.

---

## Changing prices in the booking calculator

The booking form works out a price as the customer fills it in. Those numbers
live in a **different** file: `assets/js/app.js`. Open it and you'll see the
prices at the very top.

```js
var TYPES = [
  { label: 'Recurring clean',     note: 'Standard upkeep visit',      base: 99 },
  { label: 'Deep clean',          note: 'Top to bottom reset',        base: 189 },
  ...
];
```

Change the number after `base:` to change the starting price for that service.

```js
var ADDONS = [
  { label: 'Inside the fridge',    cost: 35 },
  ...
];
```

Change the number after `cost:` to reprice an add-on.

```js
var FREQS = [
  { label: 'Weekly',        mult: 0.85 },   // 15% off
  { label: 'Every 2 weeks', mult: 0.9 },    // 10% off
  ...
];
```

`mult` is the discount for booking regularly. `0.85` means the customer pays 85%
of the standard price. Set it to `1` for no discount.

```js
var ZIPS = ['84010', '84011', '84014', ...];
```

The ZIP codes you serve. Add one in quotes with a comma after it, and the
booking form will start telling those customers you cover them.

```js
var TIMES = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'];
```

The arrival windows customers can pick from.

**Careful here:** keep every comma, quote mark and curly brace exactly where it
is. This file is fussier than `index.html` — a missing comma stops the booking
form from working at all. Change one number, save, and check the site before
changing the next.

> The prices written on the Services and Pricing pages are **separate** from
> these. If you change a price here, change the matching "From $..." text in
> `index.html` too, or the two will disagree.

---

## Turning on booking emails

**Right now the booking form does not send anything.** A customer fills it in,
sees "You're on the schedule", and nobody is told. This must be set up before
you advertise the site.

Fixing it takes about five minutes and costs nothing at low volume:

1. Go to **https://formspree.io** and create a free account.
2. Create a new form. It will give you a URL like
   `https://formspree.io/f/abcdwxyz`.
3. Open `assets/js/app.js` on GitHub and find this line near the top:

   ```js
   var FORM_ENDPOINT = '';
   ```

4. Paste your URL between the quote marks:

   ```js
   var FORM_ENDPOINT = 'https://formspree.io/f/abcdwxyz';
   ```

5. Commit the change, wait 30 seconds, then **send yourself a test booking**
   through the live site to confirm the email arrives.

Every booking then arrives by email with the customer's name, phone, email,
address, the service, the date and arrival window, the add-ons, the estimate and
their notes.

If a booking ever fails to send, the customer is shown your phone number and
asked to call instead, rather than being told it worked.

---

## Undoing a change

Nothing you do here is permanent. Every save is stored as its own version.

**To see what changed:** on the repository page, click **Commits**. Each entry
is one save, newest first. Click one to see exactly what changed, in green and red.

**To undo the last save:** open that commit and click **Revert** at the top
right. GitHub creates a new save that puts things back, and the live site
follows within a minute.

**If the site looks broken and you're not sure why:** revert the most recent
change first, then work backwards. It's very hard to lose anything permanently.

---

## What's safe, and what isn't

Rough guide to how much care each file needs.

| File | What it is | Care needed |
| --- | --- | --- |
| `assets/img/` | Your photos | **None.** Upload freely. |
| `index.html` | All page wording | **Some.** Only edit between `>` and `<`. |
| `assets/js/app.js` | Prices, ZIPs, booking form | **Care.** Numbers and quoted text only. |
| `assets/css/styles.css` | Colours, spacing, fonts | Ask a developer. |
| Icons (the little line drawings) | Drawn in code, not images | Ask a developer. |
| `vercel.json` | Hosting settings | Leave alone. |

Changing colours or layout is a developer job — it's easy to make the site look
broken on phones without realising, since you'd be testing on a desktop.

The small icons on the service cards and the trust strip are drawn in code
(SVG), not photos, so they stay crisp at any size and match the honeycomb
theme. Swapping one for a different symbol is a developer job too.

---

## If something goes wrong

**The site won't update.** Check the Vercel dashboard. If the newest deployment
is red, a change had a typo. Revert it (see above) and the site recovers.

**A photo isn't showing.** The filename is almost certainly slightly off — a
capital letter, a `.jpeg` instead of `.jpg`, or a space. Compare it against the
table above, character by character.

**The booking form stopped working.** You most likely edited `app.js` and lost a
comma or a quote mark. Revert that change.

**Everything looks unstyled**, like plain text on a white page. Something
happened to `styles.css`. Revert.
