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

  // Theme is shared with the homepage via the localStorage 'theme' key. Apply it
  // and inject the light palette synchronously so the page does not flash.
  var THEME_KEY = "theme";
  applyStoredTheme();
  injectThemeStyles();

  fetch(root + "posts.json")
    .then(function (r) { return r.json(); })
    .then(function (posts) {
      posts.sort(function (a, b) { return a.date < b.date ? 1 : -1; }); // newest first
      var i = posts.findIndex(function (p) { return p.slug === slug; });
      var cur = i >= 0 ? posts[i] : null;
      var prev = i >= 0 ? posts[i + 1] : null; // older chapter
      var next = i > 0 ? posts[i - 1] : null;  // newer chapter
      injectStyles();
      injectTopBar(root, cur && cur.pdf ? cur.pdf : null);
      injectFooterNav(root, prev, next);
    })
    .catch(function (e) { console.warn("series-nav: could not load posts.json", e); });

  function injectStyles() {
    var css =
      ".series-bar{position:sticky;top:0;z-index:9999;display:flex;align-items:center;gap:10px;" +
      "padding:10px 18px;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:0.08em;" +
      "background:rgba(10,14,20,0.85);backdrop-filter:blur(8px);border-bottom:1px solid #1f2a3a;color:#8a96a8}" +
      ".series-bar a{color:#f4c95d;text-decoration:none}.series-bar a:hover{text-decoration:underline}" +
      ".series-bar .series-pdf{margin-left:auto;border:1px solid #1f2a3a;border-radius:30px;padding:4px 12px}" +
      ".series-bar .series-pdf:hover{text-decoration:none;border-color:#f4c95d}" +
      ".series-footnav{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;max-width:900px;" +
      "margin:40px auto 70px;padding:0 24px;font-family:'Space Mono',monospace;font-size:12px}" +
      ".series-footnav a{display:block;max-width:46%;color:#e8ecf2;text-decoration:none;border:1px solid #1f2a3a;" +
      "border-radius:12px;padding:12px 16px;background:#111824}.series-footnav a:hover{border-color:#f4c95d}" +
      ".series-footnav .lbl{color:#566175;display:block;margin-bottom:4px}";
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }

  function injectTopBar(root, pdf) {
    var bar = document.createElement("div");
    bar.className = "series-bar";
    var html = '<a href="' + root + '">← Back to the series</a>';
    if (pdf) {
      html += '<a class="series-pdf" href="' + root + pdf + '" target="_blank" rel="noopener">📄 PDF</a>';
    }
    bar.innerHTML = html;
    var toggle = makeThemeToggle();
    if (!pdf) toggle.style.marginLeft = "auto"; // push to the right when no PDF link
    bar.appendChild(toggle);
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

  function getTheme() {
    try { return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"; }
    catch (e) { return "dark"; }
  }

  function applyStoredTheme() {
    if (getTheme() === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
  }

  function syncToggle(btn) {
    btn.textContent = document.documentElement.getAttribute("data-theme") === "light" ? "☾" : "☀";
  }

  function makeThemeToggle() {
    var btn = document.createElement("button");
    btn.className = "series-theme";
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle light/dark theme");
    syncToggle(btn);
    btn.addEventListener("click", function () {
      var light = document.documentElement.getAttribute("data-theme") === "light";
      if (light) document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", "light");
      try { localStorage.setItem(THEME_KEY, light ? "dark" : "light"); } catch (e) {}
      syncToggle(btn);
    });
    return btn;
  }

  function injectThemeStyles() {
    var css =
      ':root[data-theme="light"]{' +
        "--bg:#f7f8fa;--bg2:#eef1f5;--ink:#1a1f28;--muted:#4a5666;--faint:#7a8696;" +
        "--card:#ffffff;--card-edge:#e2e6ec;--line:#e2e6ec;" +
        "--spine:#b8860b;--spine-glow:rgba(184,134,11,0.30);" +
        "--cnn:#0f9b8a;--mlp:#7c3aed;--tf:#db2777;--llm:#ea580c;--rnn:#0284c7;--vit:#4d7c0f;--tool:#475569}" +
      ".series-theme{cursor:pointer;background:transparent;color:#f4c95d;border:1px solid #1f2a3a;" +
        "border-radius:30px;padding:4px 11px;font:inherit;font-size:13px;line-height:1}" +
      ".series-theme:hover{border-color:#f4c95d}" +
      ':root[data-theme="light"] .series-bar{background:rgba(247,248,250,0.85);border-bottom-color:#e2e6ec;color:#4a5666}' +
      ':root[data-theme="light"] .series-bar a{color:#b8860b}' +
      ':root[data-theme="light"] .series-bar .series-pdf{border-color:#e2e6ec}' +
      ':root[data-theme="light"] .series-theme{color:#b8860b;border-color:#e2e6ec}' +
      ':root[data-theme="light"] .series-footnav a{color:#1a1f28;background:#ffffff;border-color:#e2e6ec}';
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }
})();
