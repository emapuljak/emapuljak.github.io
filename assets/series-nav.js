/*
 * series-nav.js
 * Each chapter includes ONE line:  <script src="../../assets/series-nav.js"></script>
 * This file then injects a top "back to series" bar and bottom prev/next links.
 * It reads the same posts.json the homepage uses, and derives the site root from
 * its own <script> URL so it works whether the site is at the domain root
 * (user site) or under a /repo/ subpath (project site) — no configuration needed.
 */
(function () {
  // `document.currentScript` is THIS <script> element while it executes.
  // Strip "assets/series-nav.js" off its URL to recover the site root.
  var self = document.currentScript;
  var root = self.src.replace(/assets\/series-nav\.js.*$/, "");

  // The current chapter's slug is the path segment right after "posts/".
  var match = location.pathname.match(/posts\/([^\/]+)\//);
  var slug = match ? match[1] : null;

  fetch(root + "posts.json")
    .then(function (r) { return r.json(); })
    .then(function (posts) {
      posts.sort(function (a, b) { return a.date < b.date ? 1 : -1; }); // newest first
      var i = posts.findIndex(function (p) { return p.slug === slug; });
      var prev = i >= 0 ? posts[i + 1] : null; // older chapter
      var next = i > 0 ? posts[i - 1] : null;  // newer chapter
      injectStyles();
      injectTopBar(root);
      injectFooterNav(root, prev, next);
    })
    .catch(function (e) { console.warn("series-nav: could not load posts.json", e); });

  function injectStyles() {
    var css =
      ".series-bar{position:sticky;top:0;z-index:9999;display:flex;align-items:center;gap:10px;" +
      "padding:10px 18px;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:0.08em;" +
      "background:rgba(10,14,20,0.85);backdrop-filter:blur(8px);border-bottom:1px solid #1f2a3a;color:#8a96a8}" +
      ".series-bar a{color:#f4c95d;text-decoration:none}.series-bar a:hover{text-decoration:underline}" +
      ".series-footnav{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;max-width:900px;" +
      "margin:40px auto 70px;padding:0 24px;font-family:'Space Mono',monospace;font-size:12px}" +
      ".series-footnav a{display:block;max-width:46%;color:#e8ecf2;text-decoration:none;border:1px solid #1f2a3a;" +
      "border-radius:12px;padding:12px 16px;background:#111824}.series-footnav a:hover{border-color:#f4c95d}" +
      ".series-footnav .lbl{color:#566175;display:block;margin-bottom:4px}";
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }

  function injectTopBar(root) {
    var bar = document.createElement("div");
    bar.className = "series-bar";
    bar.innerHTML = '<a href="' + root + '">← Back to the series</a>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function injectFooterNav(root, prev, next) {
    if (!prev && !next) return;
    var nav = document.createElement("nav");
    nav.className = "series-footnav";
    var left = prev
      ? '<a href="' + root + 'posts/' + prev.slug + '/"><span class="lbl">← Previous</span>' + prev.title + "</a>"
      : "<span></span>";
    var right = next
      ? '<a href="' + root + 'posts/' + next.slug + '/"><span class="lbl">Next →</span>' + next.title + "</a>"
      : "<span></span>";
    nav.innerHTML = left + right;
    document.body.appendChild(nav);
  }
})();
