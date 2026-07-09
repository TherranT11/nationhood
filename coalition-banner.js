// coalition-banner.js — a persistent top-of-page prompt shown on every signed-in
// screen while the player's nation needs a coalition: no single party holds a
// majority AND no multi-party coalition is seated (an interim minority — or
// nothing — is sitting). It links to /play/coalition/ to cast votes, and clears
// itself once a coalition forms. Mounted once by mountTopbar() (topbar.js), so it
// appears on all pages without any per-page wiring. Hidden on the coalition page
// itself, and in one-party states / before an assembly is elected.
import { supabase } from '/supabase.js';

const CSS = `
#coalition-banner{display:flex;align-items:center;gap:14px;padding:12px 18px;margin-bottom:16px;
  border:1px solid var(--line2);border-radius:14px;position:relative;overflow:hidden;
  background:linear-gradient(90deg, color-mix(in srgb, var(--indigo) 18%, var(--surface)), var(--surface) 68%)}
#coalition-banner::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--indigo)}
#coalition-banner .cb-ic{width:34px;height:34px;border-radius:9px;flex:none;display:grid;place-items:center;
  color:var(--indigo);background:var(--indigo-soft);border:1px solid color-mix(in srgb, var(--indigo) 40%, transparent)}
#coalition-banner .cb-txt{flex:1;min-width:0}
#coalition-banner .cb-title{font-size:14px;font-weight:800;letter-spacing:-.01em;color:var(--ink);display:flex;align-items:center;gap:9px}
#coalition-banner .cb-title .live{width:7px;height:7px;border-radius:50%;background:var(--indigo);flex:none;animation:cb-pulse 1.5s infinite}
@keyframes cb-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
#coalition-banner .cb-sub{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.02em;color:var(--muted);margin-top:2px}
#coalition-banner .cb-cta{flex:none;border:none;border-radius:9px;padding:10px 16px;background:var(--indigo);color:#fff;
  font-family:'Space Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.03em;cursor:pointer;white-space:nowrap;text-decoration:none;transition:filter .15s}
#coalition-banner .cb-cta:hover{filter:brightness(1.1)}
@media(max-width:560px){#coalition-banner .cb-ic,#coalition-banner .cb-sub{display:none}#coalition-banner{padding:10px 14px}}
@media(prefers-reduced-motion:reduce){#coalition-banner .cb-title .live{animation:none}}
`;

// A small hemicycle glyph (two arcs of dots), tinted by currentColor (the accent).
const ICON = '<svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true" fill="currentColor">' +
  '<circle cx="5" cy="13" r="1.3"/><circle cx="6.5" cy="9.5" r="1.3"/><circle cx="10" cy="8" r="1.3"/><circle cx="13.5" cy="9.5" r="1.3"/><circle cx="15" cy="13" r="1.3"/>' +
  '<circle cx="2" cy="13" r="1.3"/><circle cx="3.1" cy="9" r="1.3"/><circle cx="6" cy="6.1" r="1.3"/><circle cx="10" cy="5" r="1.3"/><circle cx="14" cy="6.1" r="1.3"/><circle cx="16.9" cy="9" r="1.3"/><circle cx="18" cy="13" r="1.3"/></svg>';

function majority(seats) { return Math.floor((seats || 0) / 2) + 1; }
function bannerEl() { return document.getElementById('coalition-banner'); }
function removeBanner() { var el = bannerEl(); if (el) el.remove(); }

function show(main) {
  if (bannerEl()) return;   // already up
  if (!document.getElementById('cb-style')) {
    var s = document.createElement('style'); s.id = 'cb-style'; s.textContent = CSS; document.head.appendChild(s);
  }
  var el = document.createElement('div');
  el.id = 'coalition-banner';
  el.innerHTML = '<div class="cb-ic">' + ICON + '</div>' +
    '<div class="cb-txt"><div class="cb-title"><span class="live"></span>Election Held: Form a Coalition</div>' +
    '<div class="cb-sub">No party won a majority — your party must join a coalition to govern.</div></div>' +
    '<a class="cb-cta" href="/play/coalition/">Form Coalition &rarr;</a>';
  main.insertBefore(el, main.firstChild);
}

// Decide + (un)mount. Non-fatal: on any read error the current state is left as-is,
// so a transient failure never flashes the banner on or off.
export async function mountCoalitionBanner() {
  var main = document.querySelector('main.main') ||
    (document.getElementById('topbar') && document.getElementById('topbar').parentElement);
  if (!main) return;
  // Never on the coalition page itself — you're already there.
  if (location.pathname.indexOf('/play/coalition') === 0) { removeBanner(); return; }

  var showIt = false;
  try {
    var sess = await supabase.auth.getSession();
    var session = sess && sess.data && sess.data.session;
    if (!session) { removeBanner(); return; }
    var meRes = await supabase.from('parties').select('nation_id').eq('user_id', session.user.id).maybeSingle();
    var me = meRes.data;
    if (!me) { removeBanner(); return; }
    var nRes = await supabase.from('nations').select('legislature_seats, ruling_party').eq('id', me.nation_id).maybeSingle();
    var nation = nRes.data;
    if (!nation || nation.ruling_party) { removeBanner(); return; }   // one-party state forms no coalition
    var total = nation.legislature_seats || 0;
    if (!total) { removeBanner(); return; }                            // no assembly elected yet
    var pRes = await supabase.from('parties').select('seats, in_government').eq('nation_id', me.nation_id);
    if (pRes.error) return;                                            // transient — keep current state
    var list = pRes.data || [];
    var maj = majority(total);
    var maxSeats = list.reduce(function (m, p) { return Math.max(m, p.seats || 0); }, 0);
    var govCount = list.filter(function (p) { return p.in_government; }).length;
    // Show while no party governs alone (a majority) and no multi-party coalition is seated.
    showIt = maxSeats < maj && govCount < 2;
  } catch (e) { return; }

  if (showIt) show(main); else removeBanner();
}
