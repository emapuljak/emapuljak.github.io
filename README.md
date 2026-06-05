# Research Notes

A literature series of self-contained, interactive HTML explainers, published as
static files on GitHub Pages. No build step, no framework — just files.

## How it is structured

- `index.html` — the **landing page**. Reads `posts.json` and renders one clickable
  box (title, date, blurb, tags) per chapter. Clicking a box opens that chapter.
- `posts.json` — the manifest and single source of truth for the series. This is the
  only file you edit to make a new box appear on the landing page.
- `posts/<slug>/index.html` — each chapter, a complete self-contained HTML page.
- `assets/series-nav.js` — auto-injects the top "back to series" bar and bottom
  prev/next links into every chapter that includes it.
- `.nojekyll` — tells GitHub Pages to serve files as-is (no Jekyll processing).

## How to add a new post to the landing page

1. Create a folder `posts/<your-slug>/` and put your finished HTML in it as
   `index.html` (lowercase).
2. Add `<script src="../../assets/series-nav.js"></script>` just before `</body>`
   in that file.
3. Add one entry to `posts.json` — this is what puts a new box on the landing page:

   ```json
   {
     "slug": "your-slug",
     "title": "Your Post Title",
     "date": "2026-06-04",
     "blurb": "One-sentence summary shown inside the box.",
     "tags": ["tag one", "tag two"]
   }
   ```

   The `slug` must match the folder name in step 1.
4. Commit and push. The landing page shows the new box (newest first) and the
   prev/next navigation updates itself — no other file needs editing.

## Checks (CI)

Before pushing, you can run the same checks CI runs:

```bash
python3 scripts/check.py
```

It verifies `posts.json` is valid, every slug has a matching
`posts/<slug>/index.html` that includes the nav script, there are no
root-absolute links, and all filenames are lowercase. On every push and pull
request, `.github/workflows/ci.yml` runs this script and then validates the
HTML of every page. CI only checks — GitHub Pages still deploys on its own.

## Conventions that keep it working

- Use only RELATIVE links between pages — never `/posts/...` (root-absolute links
  break on project sites served from a `/repo/` subpath).
- Keep all filenames lowercase and hyphenated (GitHub Pages is case-sensitive).
- After pushing, wait ~1 minute and hard-refresh (Cmd/Ctrl-Shift-R); Pages caches.
