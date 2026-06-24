// sidenav.js — the in-game left navigation. ONE source for every signed-in screen:
// a page drops <div id="sidenav"></div> as the first child of <div class="app">
// and calls mountSidenav() once. On desktop it renders the left rail; at <=820px it
// renders a fixed bottom bar (primary destinations + a "More" sheet for the rest).
// The active item is derived from the URL, so pages no longer hardcode it. The brand
// (flag / party name) is filled by each page via #flag / #pname / #psub as data loads.
// Logout lives in the shared topbar gear menu (topbar.js), not here.

// The nav items — the single source for both the rail and the bottom bar. href:null
// marks a section that isn't built yet (shown disabled).
const NAV = [
  { href: '/play/',             label: 'Home',         svg: '<path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/>' },
  { href: '/play/party/',       label: 'Party',        svg: '<path d="M5 3v18"/><path d="M5 4h12l-2 4 2 4H5"/>' },
  { href: '/play/elections/',   label: 'Elections',    svg: '<path d="M4 7h16v13H4z"/><path d="M8 7V4h8v3"/><path d="M8.5 13l2 2 4-4"/>' },
  { href: '/play/government/',  label: 'Government',   svg: '<path d="M3 9l9-5 9 5"/><path d="M3 9h18M4 20h16"/><path d="M6 20v-9M10 20v-9M14 20v-9M18 20v-9"/>' },
  { href: '/play/legislature/', label: 'Legislature',  svg: '<path d="M3 21h18"/><path d="M5 21V10M9 21V10M15 21V10M19 21V10"/><path d="M12 3l9 5H3z"/>' },
  { href: '/play/nation/',      label: 'Nation',       svg: '<path d="M12 3l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3z"/>' },
  { href: '/play/policies/',    label: 'Policies',     svg: '<path d="M7 3h10a1 1 0 011 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 011-1z"/><path d="M9 8h6M9 12h5"/>' },
  { href: '/play/world/',       label: 'World',        svg: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>' },
  { href: '/play/market/',      label: 'Market',       svg: '<path d="M4 20h16"/><path d="M6 20v-6M10 20v-10M14 20v-7M18 20v-12"/>' },
  { href: '/play/corporations/',label: 'Corporations', svg: '<path d="M3 21h18"/><path d="M6 21V5a1 1 0 011-1h6a1 1 0 011 1v16"/><path d="M14 21V10h4a1 1 0 011 1v10"/><path d="M9 8h2M9 12h2M9 16h2"/>' },
  { href: null,                 label: 'Conflict',     svg: '<path d="M17 4l3 3-9 9-3-3z"/><path d="M7 4L4 7l9 9 3-3"/><path d="M5 16l-1 4 4-1M19 16l1 4-4-1"/>' },
  { href: '/play/forum/',      label: 'Forum',        svg: '<path d="M4 5h12v8H8l-4 3z"/><path d="M18 9h2v9l-3-2h-5"/>' },
  { href: null,                 label: 'Wiki',         svg: '<path d="M12 5v15"/><path d="M4 4h6a2 2 0 012 2 2 2 0 012-2h6v13h-6a2 2 0 00-2 2 2 2 0 00-2-2H4z"/>' },
];
// Destinations pinned to the mobile bottom bar; everything else falls into the More sheet.
const PRIMARY = ['/play/', '/play/party/', '/play/government/', '/play/legislature/'];

const CSS = `
/* Desktop rail (>820px) — the original sidebar, now owned here. */
.side{width:236px;flex:none;background:var(--surface);border-right:1px solid var(--line);padding:16px 12px;display:flex;flex-direction:column;gap:6px;position:sticky;top:0;height:100vh;overflow-y:auto;overscroll-behavior:contain}
.brand{display:flex;align-items:center;gap:11px;padding:6px 8px 16px;border-bottom:1px solid var(--line);margin-bottom:8px}
.brand__flag{width:42px;height:26px;object-fit:cover;border:1px solid var(--line);border-radius:4px;flex:none}
.brand__txt{display:flex;flex-direction:column;line-height:1.25;overflow:hidden}
.brand__txt b{font-weight:800;font-size:14px;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brand__txt span{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nav{display:flex;flex-direction:column;gap:2px}
.nav__i{display:flex;align-items:center;gap:13px;padding:10px 12px;border-radius:9px;color:var(--muted);text-decoration:none;cursor:pointer;border:1px solid transparent;transition:background .15s,color .15s}
.nav__i svg{width:19px;height:19px;flex:none;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.nav__i .label{font-family:'Space Mono',monospace;font-size:12.5px;letter-spacing:.04em}
.nav__i:hover{color:var(--ink);background:var(--chip)}
.nav__i.active{color:var(--indigo);background:var(--indigo-soft);font-weight:700}
.nav__i.active svg{color:var(--indigo)}
.nav__i.disabled{opacity:.45;pointer-events:none}
.side__foot{margin-top:auto;border-top:1px solid var(--line);padding-top:12px}
.me{display:flex;align-items:center;gap:10px;padding:8px 10px;color:var(--muted);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.06em}
.me__dot{width:9px;height:9px;border-radius:50%;background:var(--green);flex:none}
.me b{color:var(--ink);font-weight:700}

/* Mobile bottom bar + More sheet (<=820px). */
.botnav{display:none}
.moresheet{display:none}
@media(max-width:820px){
  .side{display:none}
  .main{padding-bottom:78px}   /* clear the fixed bottom bar (overrides each page's .main) */
  .botnav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:70;background:var(--surface);border-top:1px solid var(--line);padding:6px 4px;padding-bottom:calc(6px + env(safe-area-inset-bottom));justify-content:space-around;align-items:stretch}
  .botnav__i{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px;min-width:0;color:var(--muted);text-decoration:none;background:none;border:none;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent}
  .botnav__i svg{width:22px;height:22px;flex:none;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
  .botnav__i .l{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.02em}
  .botnav__i.active{color:var(--indigo)}
  .moresheet{display:block;position:fixed;inset:0;z-index:71;background:rgba(21,21,27,.45)}
  .moresheet[hidden]{display:none}
  .moresheet__panel{position:absolute;left:0;right:0;bottom:0;background:var(--surface);border-radius:18px 18px 0 0;border-top:1px solid var(--line);padding:16px 14px calc(18px + env(safe-area-inset-bottom));max-height:80vh;overflow:auto;box-shadow:0 -20px 50px -24px rgba(0,0,0,.4)}
  .moresheet__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .msi{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 6px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--muted);text-decoration:none;text-align:center}
  .msi svg{width:22px;height:22px;flex:none;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
  .msi .l{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.03em}
  .msi.active{color:var(--indigo);border-color:var(--indigo);background:var(--indigo-soft)}
  .msi.disabled{opacity:.45;pointer-events:none}
}
`;

function svgEl(inner) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + inner + '</svg>'; }

// Active = the item whose href matches the current path. Home only matches the index
// itself; every other section also matches its sub-pages (e.g. /play/party/politician/).
function isActive(path, href) {
  if (!href) return false;
  if (href === '/play/') return path === '/play/' || path === '/play';
  return path === href || path.indexOf(href) === 0;
}

function railItem(it, path) {
  const cls = 'nav__i' + (isActive(path, it.href) ? ' active' : '') + (it.href ? '' : ' disabled');
  const tag = it.href ? 'a' : 'span';
  const href = it.href ? ' href="' + it.href + '"' : '';
  return '<' + tag + ' class="' + cls + '"' + href + '>' + svgEl(it.svg) + '<span class="label">' + it.label + '</span></' + tag + '>';
}
function botItem(it, path) {
  return '<a class="botnav__i' + (isActive(path, it.href) ? ' active' : '') + '" href="' + it.href + '">' + svgEl(it.svg) + '<span class="l">' + it.label + '</span></a>';
}
function moreRow(it, path) {
  const cls = 'msi' + (isActive(path, it.href) ? ' active' : '') + (it.href ? '' : ' disabled');
  const tag = it.href ? 'a' : 'span';
  const href = it.href ? ' href="' + it.href + '"' : '';
  return '<' + tag + ' class="' + cls + '"' + href + '>' + svgEl(it.svg) + '<span class="l">' + it.label + '</span></' + tag + '>';
}

// Inject the styles once, render the rail + bottom bar into #sidenav, wire the More sheet.
export function mountSidenav() {
  if (!document.getElementById('sn-style')) {
    const s = document.createElement('style');
    s.id = 'sn-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  const host = document.getElementById('sidenav');
  if (!host) return;
  const path = location.pathname;

  const rail = '<aside class="side">'
    + '<div class="brand"><img class="brand__flag" id="flag" alt="Nation flag" hidden><div class="brand__txt"><b id="pname">…</b><span id="psub"></span></div></div>'
    + '<nav class="nav">' + NAV.map(function (it) { return railItem(it, path); }).join('') + '</nav>'
    + '<div class="side__foot"><div class="me"><span class="me__dot"></span><span class="label">Leader &middot; <b>You</b></span></div></div>'
    + '</aside>';

  const primaries = PRIMARY.map(function (h) { return NAV.find(function (n) { return n.href === h; }); }).filter(Boolean);
  const moreItems = NAV.filter(function (n) { return PRIMARY.indexOf(n.href) < 0; });
  const moreActive = moreItems.some(function (it) { return isActive(path, it.href); }) ? ' active' : '';
  const bottom = '<nav class="botnav">'
    + primaries.map(function (it) { return botItem(it, path); }).join('')
    + '<button class="botnav__i' + moreActive + '" type="button" id="snMore" aria-haspopup="true" aria-expanded="false">'
    +   svgEl('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>')
    +   '<span class="l">More</span></button>'
    + '</nav>';
  const sheet = '<div class="moresheet" id="snSheet" hidden><div class="moresheet__panel"><div class="moresheet__grid">'
    + moreItems.map(function (it) { return moreRow(it, path); }).join('')
    + '</div></div></div>';

  host.innerHTML = rail + bottom + sheet;

  const moreBtn = document.getElementById('snMore'), sheetEl = document.getElementById('snSheet');
  if (moreBtn && sheetEl) {
    const close = function () { sheetEl.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); };
    moreBtn.addEventListener('click', function () {
      const opening = sheetEl.hidden;
      sheetEl.hidden = !opening;
      moreBtn.setAttribute('aria-expanded', String(opening));
    });
    sheetEl.addEventListener('click', function (e) { if (e.target === sheetEl) close(); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheetEl.hidden) close(); });
  }
}
