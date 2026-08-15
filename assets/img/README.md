# Photos

Drop real photography in here using the filenames below and it appears on the
site automatically. Until a file exists, the page renders a styled honeycomb
placeholder with a caption describing the shot that belongs there — no broken
image icons, and nothing to change in the HTML.

| File | Where it appears | What it should show |
| --- | --- | --- |
| `hero.jpg` | Home hero | A bright, freshly cleaned kitchen or living room |
| `ba-1-before.jpg` | Home, before/after | Messy kitchen, before |
| `ba-1-after.jpg` | Home, before/after | The same kitchen, clean |
| `ba-2-before.jpg` | Home, before/after | Bathroom, before |
| `ba-2-after.jpg` | Home, before/after | The same bathroom, clean |
| `about.jpg` | About | The crew, or the van |
| `crew-rosa.jpg` | About, crew | Rosa Ibarra |
| `crew-dan.jpg` | About, crew | Dan Whitfield |
| `crew-amara.jpg` | About, crew | Amara Osei |
| `crew-tomas.jpg` | About, crew | Tomas Nagy |

Suggested sizes: hero ~1200×1080, before/after ~800×640, about ~900×1000,
crew portraits ~600×760. Everything is `object-fit: cover`, so the exact
aspect ratio is forgiving — just keep the subject near the centre.

If you prefer `.webp` or `.png`, update the `src` in `index.html` to match.
