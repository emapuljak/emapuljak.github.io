# Tensorization Notes

A literature series of self-contained, interactive HTML explainers, published as
static files on GitHub Pages. No build step, no framework — just files.

## How it is structured

- `index.html` — the homepage. Reads `posts.json` and renders a card per chapter.
- `posts.json` — the manifest and single source of truth for the series.
- `posts/<slug>/index.html` — each chapter, a complete self-contained HTML page.
- `assets/series-nav.js` — auto-injects the top "back to series" bar and bottom
  prev/next links into every chapter that includes it.
- `.nojekyll` — tells GitHub Pages to serve files as-is (no Jekyll processing).

## How to publish a new chapter

1. Create a folder `posts/<your-slug>/` and put your finished HTML in it as
   `index.html` (lowercase).
2. Add `<script src="../../assets/series-nav.js"></script>` just before `</body>`
   in that file.
3. Add one entry to `posts.json` (slug, title, date `YYYY-MM-DD`, blurb, tags).
4. Commit and push. The homepage and navigation update themselves.

## Conventions that keep it working

- Use only RELATIVE links between pages — never `/posts/...` (root-absolute links
  break on project sites served from a `/repo/` subpath).
- Keep all filenames lowercase and hyphenated (GitHub Pages is case-sensitive).
- After pushing, wait ~1 minute and hard-refresh (Cmd/Ctrl-Shift-R); Pages caches.
