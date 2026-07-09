// Administration History — a collapsible section for the government page. An administration is one
// row of the `governments` table (schema/60): it starts when a Head of Government is seated
// (formed_tick) and closes when the next government forms. Rows are retained (status 'replaced'),
// so the table IS the history. This reads that history plus the nation's event feed, buckets each
// event into the administration whose window it falls in, and renders a per-administration timeline.
// Read-only, world-readable data, resilient — hides itself on any failure. Mirrors initiatives.js.
import { supabase } from '/supabase.js';
import { esc, tickToDate } from '/util.js';

// Event kind → timeline category + colour (theme vars). Mirrors the home feed's buckets so the two
// stay consistent; this is the one place the government timeline maps kinds.
var CAT = {
  government:  { label: 'Government',  color: 'var(--indigo)' },
  legislative: { label: 'Legislative', color: 'var(--green)' },
  crisis:      { label: 'Crisis',      color: 'var(--amber)' },
  economy:     { label: 'Economy',     color: 'var(--green)' },
  party:       { label: 'Party',       color: 'var(--soft)' },
  world:       { label: 'World',       color: 'var(--indigo)' },
  other:       { label: 'Update',      color: 'var(--soft)' }
};
var KIND_CAT = {
  government: 'government', agenda: 'government', coalition: 'government', election: 'government',
  declaration: 'legislative', law: 'legislative', no_confidence: 'legislative',
  crisis: 'crisis', economy: 'economy', income: 'economy',
  rally: 'party', fundraise: 'party', attack: 'party', adblitz: 'party', recruit: 'party', party: 'party', conviction: 'party',
  world_event: 'world', world_broadcast: 'world'
};
function catOf(kind){ return KIND_CAT[kind] || 'other'; }
function typeLabel(t){ return t === 'coalition' ? 'Coalition' : t === 'minority' ? 'Minority' : 'Majority'; }
function dur(m){ m = Math.max(0, m); var y = Math.floor(m/12), mo = m%12, p = []; if(y) p.push(y+' yr'+(y>1?'s':'')); if(mo) p.push(mo+' mo'); return p.join(' ') || '0 mo'; }
function yr(tick){ return (tickToDate(tick).split(', ')[1] || ''); }

const CSS = `
.ah{background:var(--surface);border:1px solid var(--line);border-radius:16px;margin-top:18px;overflow:hidden}
.ah__sum{list-style:none;cursor:pointer;padding:18px 22px;display:flex;align-items:center;gap:10px}
.ah__sum::-webkit-details-marker{display:none}
.ah__t{flex:1;font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);font-weight:700}
.ah__n{font-family:'Space Mono',monospace;font-size:11px;color:var(--muted)}
.ah__sum::after{content:'▾';color:var(--soft);font-size:11px}
.ah[open] .ah__sum::after{content:'▴'}
.ah__body{padding:2px 22px 20px}
.ah__pick{width:100%;appearance:none;background:var(--field);border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:9px 12px;font-family:'Space Mono',monospace;font-size:12px;font-weight:700;cursor:pointer;outline:none}
.ah__pick:focus{border-color:var(--indigo)}
.ah__hd{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:16px 0 12px}
.ah__who b{font-weight:900;font-size:16px;letter-spacing:-.01em;display:block}
.ah__who span{font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.03em;color:var(--soft);margin-top:3px;display:block}
.ah__term{text-align:right;font-family:'Space Mono',monospace;flex:none}
.ah__term .rg{font-size:12px;font-weight:700}.ah__term .rg .cur{color:var(--green)}
.ah__term small{font-size:10px;color:var(--soft);display:block;margin-top:3px}
.ah__chips{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px}
.ah__chip{font-family:'Space Mono',monospace;font-size:10.5px;font-weight:700;background:var(--chip);border:1px solid var(--line);border-radius:8px;padding:6px 10px;color:var(--muted)}
.ah__chip b{color:var(--ink)}
.ah__filters{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px}
.ah__f{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.05em;text-transform:uppercase;font-weight:700;color:var(--muted);background:transparent;border:1px solid var(--line2);border-radius:20px;padding:6px 12px;cursor:pointer}
.ah__f.on{color:var(--indigo);border-color:var(--indigo);background:var(--indigo-soft)}
.ah__tl{position:relative;margin-left:5px;padding-left:22px;border-left:2px solid var(--line)}
.ah__ev{position:relative;padding-bottom:18px}
.ah__ev:last-child{padding-bottom:2px}
.ah__dot{position:absolute;left:-28px;top:3px;width:11px;height:11px;border-radius:50%;border:3px solid var(--surface)}
.ah__evtop{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ah__date{font-family:'Space Mono',monospace;font-size:11px;font-weight:700}
.ah__tag{font-family:'Space Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border:1px solid;border-radius:5px;padding:2px 6px}
.ah__txt{font-size:13px;color:var(--muted);margin-top:5px;line-height:1.5}
.ah__empty{font-family:'Space Mono',monospace;font-size:12px;color:var(--soft);padding:12px 0}
`;
function injectCss(){ if(document.getElementById('ah-css')) return; var s=document.createElement('style'); s.id='ah-css'; s.textContent=CSS; document.head.appendChild(s); }

// Governments (all statuses, newest first), the event feed, and current parties (for formateur
// names). Historical formateur parties may be deleted — the render guards for that.
// KNOWN CAP: the feed is capped at the 600 most recent events. Every party action stamps an event,
// so a long-lived nation accrues thousands; 600 covers recent administrations in full and older ones
// partially (newest-first). If deep history matters later, page per-administration by created_at.
const EVENT_CAP = 600;
export async function fetchAdministrations(nationId){
  try {
    const [govR, evR, partyR] = await Promise.all([
      supabase.from('governments').select('id, formateur_party_id, type, coalition_health, coalition_health_max, formed_tick, status, created_at').eq('nation_id', nationId).order('formed_tick', { ascending: false }),
      supabase.from('events').select('kind, body, game_date, created_at').eq('nation_id', nationId).order('created_at', { ascending: false }).limit(EVENT_CAP),
      supabase.from('parties').select('id, name').eq('nation_id', nationId)
    ]);
    return { govs: govR.data || [], events: evR.data || [], parties: partyR.data || [] };
  } catch(e){ return { govs: [], events: [], parties: [] }; }
}

// Render the collapsible section into `el`. ctx = { currentTick, hogTitle }. Builds one administration
// per governments row, its window = [this.created_at, nextNewer.created_at) (the active row runs to
// now), and buckets the feed into it. The selector + filter re-render only the inner block, so the
// <details> stays open across changes.
export function renderAdministrations(el, data, ctx){
  if(!el) return; ctx = ctx || {};
  var govs = data.govs || [];
  if(!govs.length){ el.innerHTML = ''; return; }   // no government has ever formed — nothing to show
  injectCss();

  var partyName = {}; (data.parties || []).forEach(function(p){ partyName[p.id] = p.name; });
  var nowTick = Number(ctx.currentTick) || 0;
  // Each row → an administration. govs is newest-first, so govs[i-1] is the one that replaced it.
  var admins = govs.map(function(g, i){
    var newer = govs[i-1] || null;
    var endTick = g.status === 'active' ? Math.max(g.formed_tick, nowTick) : (newer ? newer.formed_tick : Math.max(g.formed_tick, nowTick));
    var startAt = g.created_at, endAt = newer ? newer.created_at : null;   // event window by wall-clock (events carry no tick)
    var evs = (data.events || []).filter(function(e){ return e.created_at >= startAt && (!endAt || e.created_at < endAt); });
    return {
      name: partyName[g.formateur_party_id] || 'A former government',
      type: g.type, ongoing: g.status === 'active',
      startTick: g.formed_tick, endTick: endTick,
      hearts: (g.coalition_health_max != null) ? g.coalition_health_max : (g.coalition_health != null ? g.coalition_health : null),
      events: evs
    };
  });

  var sel = 0, filter = 'all';

  el.innerHTML =
    '<details class="ah"><summary class="ah__sum"><span class="ah__t">Administration History</span>' +
      '<span class="ah__n">' + admins.length + ' administration' + (admins.length === 1 ? '' : 's') + '</span></summary>' +
    '<div class="ah__body"><select class="ah__pick">' +
      admins.map(function(a, i){ return '<option value="' + i + '">' + esc((ctx.hogTitle || 'Head of Government') + ' · ' + a.name) + ' · ' + yr(a.startTick) + (a.ongoing ? '–now' : '–' + yr(a.endTick)) + '</option>'; }).join('') +
    '</select><div class="ah__inner"></div></div>';

  var pick = el.querySelector('.ah__pick'), inner = el.querySelector('.ah__inner');

  function renderInner(){
    var a = admins[sel];
    // Filter chips: All + the categories actually present in this administration.
    var present = {}; a.events.forEach(function(e){ present[catOf(e.kind)] = 1; });
    var order = ['government','legislative','crisis','economy','party','world','other'];
    var chips = ['all'].concat(order.filter(function(c){ return present[c]; }));
    // Summary counts by category (only non-zero, capped to the meaningful few).
    var count = {}; a.events.forEach(function(e){ var c = catOf(e.kind); count[c] = (count[c]||0) + 1; });
    var summary = '<span class="ah__chip"><b>' + dur(a.endTick - a.startTick) + '</b> in office</span>' +
      ['government','legislative','crisis'].filter(function(c){ return count[c]; })
        .map(function(c){ return '<span class="ah__chip"><b>' + count[c] + '</b> ' + CAT[c].label.toLowerCase() + '</span>'; }).join('');

    var list = a.events.filter(function(e){ return filter === 'all' || catOf(e.kind) === filter; });
    var tl = list.length
      ? list.map(function(e){ var c = CAT[catOf(e.kind)];
          return '<div class="ah__ev"><span class="ah__dot" style="background:' + c.color + '"></span>' +
            '<div class="ah__evtop"><span class="ah__date">' + esc(e.game_date || '') + '</span>' +
            '<span class="ah__tag" style="color:' + c.color + ';border-color:' + c.color + '">' + c.label + '</span></div>' +
            '<div class="ah__txt">' + esc(e.body || '') + '</div></div>'; }).join('')
      : '<div class="ah__empty">No events in this category.</div>';

    inner.innerHTML =
      '<div class="ah__hd"><div class="ah__who"><b>' + esc((ctx.hogTitle || 'Head of Government') + ' · ' + a.name) + '</b>' +
        '<span>' + typeLabel(a.type) + ' Government' + (a.hearts != null ? ' · ' + a.hearts + ' heart' + (a.hearts === 1 ? '' : 's') + ' Coalition Health at formation' : '') + '</span></div>' +
        '<div class="ah__term"><div class="rg">' + esc(tickToDate(a.startTick)) + ' — ' + (a.ongoing ? '<span class="cur">Present</span>' : esc(tickToDate(a.endTick))) + '</div>' +
        '<small>In office ' + dur(a.endTick - a.startTick) + '</small></div></div>' +
      '<div class="ah__chips">' + summary + '</div>' +
      '<div class="ah__filters">' + chips.map(function(c){ return '<button class="ah__f' + (filter === c ? ' on' : '') + '" data-f="' + c + '" type="button">' + (c === 'all' ? 'All' : CAT[c].label) + '</button>'; }).join('') + '</div>' +
      '<div class="ah__tl">' + tl + '</div>';

    inner.querySelectorAll('[data-f]').forEach(function(b){ b.onclick = function(){ filter = b.dataset.f; renderInner(); }; });
  }

  pick.onchange = function(){ sel = parseInt(this.value, 10) || 0; filter = 'all'; renderInner(); };
  renderInner();
}
