// Persistent light/dark theme. Loaded as a blocking <head> script on every game
// page so the saved choice applies before first paint (no flash). The dark palette
// overrides the shared CSS vars (every page defines the same :root set); the topbar
// provides the toggle. One source for the theme — pages just include this script.
(function () {
  var KEY = 'nh-theme';
  var saved; try { saved = localStorage.getItem(KEY); } catch (e) {}
  document.documentElement.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');

  // html[data-theme="dark"] beats each page's :root by specificity, so this alone
  // re-themes everything that reads the vars — no per-page :root edits needed.
  var css =
    'html[data-theme="dark"]{' +
      '--bg:#13131a;--surface:#1d1d25;--ink:#f1f0ed;--muted:#a9aab4;--soft:#7e8090;' +
      '--line:#2b2c36;--line2:#3a3b47;--chip:#262732;--field:#191a22;' +
      '--indigo:#8f82ff;--indigo-soft:#272250;' +
      '--red:#ef6a6a;--red-soft:#391f1f;--amber:#eaa23a;--amber-soft:#352b16;' +
      '--green:#3ec489;--green-soft:#15301f;--blue:#52a6ea;--blue-soft:#16293a;--navy:#9fb0ff;' +
      'color-scheme:dark;' +
    '}';
  var s = document.createElement('style'); s.id = 'nh-theme-css'; s.textContent = css;
  (document.head || document.documentElement).appendChild(s);

  // Public API: read the current theme and flip it (persisted). The 'nh-theme' event
  // lets the topbar re-tint the party accent for the new light/dark mix.
  window.NHTheme = {
    get current() { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; },
    toggle: function () {
      var t = this.current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem(KEY, t); } catch (e) {}
      window.dispatchEvent(new CustomEvent('nh-theme', { detail: t }));
      return t;
    }
  };
})();
