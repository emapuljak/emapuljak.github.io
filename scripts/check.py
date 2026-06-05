#!/usr/bin/env python3
"""
check.py — structural checks for the Research Notes static site.

Run locally before pushing:   python3 scripts/check.py
The CI workflow runs this same script, so green locally == green in CI.

It verifies the conventions that keep a no-build GitHub Pages site working:
  1. posts.json is valid JSON: a list of entries with the right fields/types.
  2. Slugs are unique, lowercase-hyphenated, and one date per YYYY-MM-DD.
  3. Every slug has a real chapter at posts/<slug>/index.html.
  4. Every chapter includes the series-nav.js script.
  5. No root-absolute links (href="/..." / src="/...") — they break project sites.
  6. All filenames under posts/ and assets/ are lowercase (Pages is case-sensitive).
  7. .nojekyll exists (so Pages serves files as-is).

Exit code is non-zero if any check fails.
"""

import datetime
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def rel(path):
    return os.path.relpath(path, ROOT)


SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
# Matches href="/..." or src="/..." but not "//host" (protocol-relative) and not
# href="//" — i.e. exactly one leading slash, which is a root-absolute path.
ABS_LINK_RE = re.compile(r"""(?:href|src)\s*=\s*["']/(?!/)""", re.IGNORECASE)


def check_manifest():
    path = os.path.join(ROOT, "posts.json")
    if not os.path.isfile(path):
        err("posts.json is missing")
        return []
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        err(f"posts.json is not valid JSON: {e}")
        return []

    if not isinstance(data, list):
        err("posts.json must be a JSON array of post objects")
        return []

    seen_slugs = set()
    required = {"slug": str, "title": str, "date": str, "blurb": str, "tags": list}
    for i, entry in enumerate(data):
        where = f"posts.json[{i}]"
        if not isinstance(entry, dict):
            err(f"{where} is not an object")
            continue
        for field, ftype in required.items():
            if field not in entry:
                err(f"{where} is missing required field '{field}'")
            elif not isinstance(entry[field], ftype):
                err(f"{where} field '{field}' must be {ftype.__name__}")

        slug = entry.get("slug")
        if isinstance(slug, str):
            if not SLUG_RE.match(slug):
                err(f"{where} slug '{slug}' must be lowercase letters/digits/hyphens")
            if slug in seen_slugs:
                err(f"{where} duplicate slug '{slug}'")
            seen_slugs.add(slug)

        date = entry.get("date")
        if isinstance(date, str):
            if not DATE_RE.match(date):
                err(f"{where} date '{date}' must be YYYY-MM-DD")
            else:
                try:
                    datetime.date.fromisoformat(date)
                except ValueError:
                    err(f"{where} date '{date}' is not a real calendar date")

        for j, tag in enumerate(entry.get("tags", []) if isinstance(entry.get("tags"), list) else []):
            if not isinstance(tag, str):
                err(f"{where} tags[{j}] must be a string")

        # 'pdf' is optional: a relative path to a PDF committed in the repo.
        pdf = entry.get("pdf")
        if pdf is not None:
            if not isinstance(pdf, str):
                err(f"{where} field 'pdf' must be a string")
            elif pdf.startswith("/") or "://" in pdf:
                err(f"{where} pdf '{pdf}' must be a relative path (no leading '/' or host)")
            elif not pdf.lower().endswith(".pdf"):
                err(f"{where} pdf '{pdf}' should point to a .pdf file")
            elif not os.path.isfile(os.path.join(ROOT, pdf)):
                err(f"{where} pdf '{pdf}' file not found in the repo")

    return data


def check_chapters(manifest):
    for entry in manifest:
        slug = entry.get("slug")
        if not isinstance(slug, str):
            continue
        chapter = os.path.join(ROOT, "posts", slug, "index.html")
        if not os.path.isfile(chapter):
            err(f"slug '{slug}' has no chapter at posts/{slug}/index.html")
            continue
        with open(chapter, encoding="utf-8") as f:
            html = f.read()
        if "assets/series-nav.js" not in html:
            err(f"posts/{slug}/index.html does not include the series-nav.js script")


def check_html_links():
    posts_dir = os.path.join(ROOT, "posts")
    if not os.path.isdir(posts_dir):
        return
    for dirpath, _, filenames in os.walk(posts_dir):
        for name in filenames:
            if not name.endswith(".html"):
                continue
            path = os.path.join(dirpath, name)
            with open(path, encoding="utf-8") as f:
                html = f.read()
            for m in ABS_LINK_RE.finditer(html):
                line = html.count("\n", 0, m.start()) + 1
                err(f"{rel(path)}:{line} root-absolute link "
                    f"({m.group(0).strip()}…) breaks on project sites; use a relative path")


def check_lowercase():
    for sub in ("posts", "assets"):
        base = os.path.join(ROOT, sub)
        if not os.path.isdir(base):
            continue
        for dirpath, dirnames, filenames in os.walk(base):
            # Skip dotfiles/dot-dirs (e.g. .DS_Store) — git ignores them and they
            # are not part of the published site.
            dirnames[:] = [d for d in dirnames if not d.startswith(".")]
            names = dirnames + [f for f in filenames if not f.startswith(".")]
            for name in names:
                if name != name.lower():
                    err(f"{rel(os.path.join(dirpath, name))} is not lowercase "
                        f"(GitHub Pages is case-sensitive)")


def check_nojekyll():
    if not os.path.isfile(os.path.join(ROOT, ".nojekyll")):
        warn(".nojekyll is missing — Pages may run Jekyll and hide underscore files")


def main():
    manifest = check_manifest()
    check_chapters(manifest)
    check_html_links()
    check_lowercase()
    check_nojekyll()

    for w in warnings:
        print(f"warning: {w}")
    for e in errors:
        print(f"error: {e}")

    if errors:
        print(f"\nFAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"OK: all checks passed ({len(warnings)} warning(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
