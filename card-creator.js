// card-creator.js — the admin Card Creator (adminsetup → Cards tab). Self-contained like
// topbar.js/sidenav.js: injects its own scoped CSS (everything under `.cc` so it can't touch the
// rest of adminsetup) and its own DOM into a mount point, then wires the whole builder.
//
// An admin builds a card here; "Save to Card Pool" calls card_create(definition) (schema/170), which
// inserts the card AND shuffles it into decks — a copy in every live nation's deck (Limiter All
// Nations) or one nation's deck (Specific Nation). The whole `state` object IS the card's definition,
// so the Phase-3 runtime reads it straight back. Colours use the app's design tokens (+ color-mix)
// so the panel works in both light and dark themes.
import { supabase } from '/supabase.js';
import { POLICY_STATS } from '/policies.js';   // the ONE ministry-stat vocabulary, shared with the policy editor
import { esc } from '/util.js';   // shared HTML-escape (one source)
import { cardEffectText, resLabel } from '/card-effect-text.js';   // one source for effect → text (shared with the legislature pages)
import { CATEGORIES } from '/corporations.js';   // the real sector list — for the "create a state firm in [sector]" effect
const cap = function (s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); };   // Title-case a word (one source)

// ---- effect vocabulary (Phase 3 interprets these; the creator only authors them) ----
// Card-effect stat targets ARE the ministry-stat vocabulary (POLICY_STATS, policies.js) — ONE source,
// so any stat added to the Government set (Oppression, Control, Revolt Risk, …) is instantly targetable
// here with no second list to drift. statOptions prepends a legacy value an older card stored under a
// name since renamed/removed, so editing that card never silently swaps its stat.
function statOptions(sel) {
  var list = (sel && POLICY_STATS.indexOf(sel) < 0) ? [sel].concat(POLICY_STATS) : POLICY_STATS;
  return list.map(function (s) { return '<option' + (s === sel ? ' selected' : '') + '>' + s + '</option>'; }).join('');
}
// The real cabinet portfolios (server source: _ministries(), schema/138) — so a card's Decision
// Handler routes to an actual minister.
const MINISTRIES = ['Defence', 'Treasury', 'Interior', 'Foreign Affairs', 'Trade', 'Labour', 'Justice', 'Health', 'Education', 'Energy', 'Economic Development'];
// The nation's on-hand stockpile keys (server source: nations.on_hand, schema/113). Stored lowercase.
// food/goods/services/military/energy are consumed by the economy; the rest are held stockpiles a card can move.
const RESOURCES = ['food', 'goods', 'services', 'military', 'energy', 'minerals', 'diplomacy', 'army', 'navy', 'air_wings'];
// The resources a Produce cycle outputs (server source: economy_produce, schema/113) — the ones a
// timed production modifier can boost/cut. A subset of RESOURCES (no army/navy/air_wings, which aren't produced).
const PROD_RESOURCES = ['energy', 'food', 'minerals', 'goods', 'services', 'military', 'diplomacy'];
const PROD_TICKS = [12, 24, 36, 48, 60];                 // the offered durations for a timed production modifier
const SANCTION_TICKS = [36, 60, 120];                    // the offered minimum locks for a card-placed sanction
const KINDS = {
  cond:       { label: 'IF [stat] is above/below X, then…', nested: true },
  party_gain: { label: 'Targeted party gains X approval' },
  party_lose: { label: 'Targeted party loses X approval' },
  decider_gain: { label: 'Deciding party gains X approval' },   // choice cards: the party that resolves it
  decider_lose: { label: 'Deciding party loses X approval' },
  coal_up:    { label: 'Coalition health +1' },
  coal_down:  { label: 'Coalition health −1' },
  coal_pop_up:   { label: 'All coalition parties gain X approval' },
  coal_pop_down: { label: 'All coalition parties lose X approval' },
  sanction:   { label: 'Sanction a nation for a minimum of N ticks' },
  bill:       { label: 'Introduce a committee bill (name + pass/fail effects)', billOnly: true },   // only in options/sides
  stat_up:    { label: 'Stat goes up by X' },
  stat_down:  { label: 'Stat goes down by X' },
  hex_pop:    { label: 'Swing X approval at a chosen hex (you +X, or a rival −X)' },
  res_add:    { label: 'Add X [resource] to on-hand' },
  res_remove: { label: 'Remove X [resource] from on-hand' },
  budget_up:   { label: 'Budget Balance one time increase by X' },
  budget_down: { label: 'Budget Balance one time decrease by X' },
  rel_up:     { label: 'Relations with a nation increase by X' },
  rel_down:   { label: 'Relations with a nation decrease by X' },
  rel_pick:   { label: 'Relations with a nation of the decider’s choice increase by X (decision cards)' },
  prod_up:    { label: 'Increase production of [resource] by X for N ticks' },
  prod_down:  { label: 'Decrease production of [resource] by X for N ticks' },
  deck_add:   { label: 'Seed a specific card into a nation’s deck (a dormant card, now or in N ticks)' },
  shuffle:    { label: 'Shuffle this card back into the deck (instead of discarding)' },
  corp_grow:    { label: 'Add growth to one of your corporations (chosen on play)' },
  corp_shrink:  { label: 'Cut growth from one of your corporations (chosen on play)' },
  corp_acquire: { label: 'One corporation acquires another (both chosen on play)' },
  corp_create:  { label: 'Found a state-owned corp in [sector] named [name]' },
  appoint:    { label: 'HoG must appoint you [Ministry], or…', nested: true },
  hex_el:     { label: 'Carry out an election in a chosen hex' },
  nat_el:     { label: 'Carry out national election' },
  hog_change: { label: 'Change the Head of Government (new leader takes office)' },
  no_conf:    { label: 'Put forth motion of no confidence' },
  mob_add:    { label: 'Add Armed Mob to Hex X' },
  mob_rem:    { label: 'Remove Armed Mob from Hex X' },
  mil_add:    { label: 'Add Militia to Hex X' },
  mil_rem:    { label: 'Remove Militia from Hex X' },
  event:      { label: 'Event Decision (write text, pick effect)', nested: true }
};
const SIMPLE = ['party_gain', 'party_lose', 'coal_up', 'coal_down', 'stat_up', 'stat_down', 'budget_up', 'budget_down', 'no_conf', 'nat_el'];

// ---- Archetype presets (the one radio row that replaces the old Mechanic / Decision / After-played /
// Persistent sections). Each preset just STAMPS a set of lifecycle fields — the card's raw fields stay
// the source of truth, so on load we DERIVE which preset (if any) a stored card matches. `handler` is
// stamped only where listed; `forceReading` pins the Effects reading switch; `openChains` auto-expands
// the Chains & Gates section. ONE source, so the label, the stamped fields and the load-derivation agree.
const ARCHETYPES = {
  choice:    { label: 'Choice card',       fields: { afterPlay: 'discard', persistV: 'no',  dormant: 'no'  }, handler: 'player' },
  recurring: { label: '↻ Recurring issue', fields: { afterPlay: 'shuffle', persistV: 'no',  dormant: 'no'  } },
  standing:  { label: '∞ Standing modifier', fields: { afterPlay: 'discard', persistV: 'yes', dormant: 'no'  } },
  chain:     { label: '💤 Chain link',     fields: { afterPlay: 'discard', persistV: 'no',  dormant: 'yes' }, openChains: true },
  event:     { label: '⚡ One-shot event', fields: { afterPlay: 'discard', persistV: 'no',  dormant: 'no'  }, forceReading: 'one' }
};
// Suggested-cost weights — the ONE tunable knob for the auto-costing formula (see suggestedCost()).
// suggested = clamp(1,20, round( acts*acts + effect*sumEffectMagnitude + bonusAp*bonusApEffects )).
// No effect KIND grants extra AP today, so bonusApEffects is always 0 (documented, kept in the formula
// so a future AP-granting kind only needs counting, not a formula change).
const COST_WEIGHTS = { acts: 1, effect: 0.5, bonusAp: 0.5 };

const CSS = `
.cc{--gen:var(--blue);--dem:var(--blue);--rev:var(--red);--auto:#9159c9;--ref:var(--green);--nat:var(--amber);--inf:var(--amber);
  display:grid;grid-template-columns:1fr 330px;gap:22px;align-items:start}
@media(max-width:960px){.cc{grid-template-columns:1fr}}
.cc *{box-sizing:border-box}
.cc .form{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:22px 24px}
.cc .sect{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--soft);margin:22px 0 10px;display:flex;align-items:center;gap:10px}
.cc .sect:first-child{margin-top:0}
.cc .sect::after{content:'';flex:1;height:1px;background:var(--line)}
.cc .sect .cnt{font-size:9px;letter-spacing:.03em;color:var(--muted);text-transform:none}
.cc label{display:block;font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);margin:0 0 6px}
.cc input[type=text],.cc textarea,.cc select,.cc input[type=number]{width:100%;background:var(--field);border:1px solid var(--line);border-radius:9px;color:var(--ink);font-family:'Archivo',system-ui,sans-serif;font-size:13px;padding:9px 11px;outline:none}
.cc input:focus,.cc textarea:focus,.cc select:focus{border-color:var(--indigo)}
.cc textarea{resize:vertical;min-height:56px;line-height:1.5}
.cc select{cursor:pointer}
.cc input[type=number]{width:70px;font-family:'Space Mono',monospace;font-weight:700;text-align:center}
.cc .frow{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.cc .frow.single{grid-template-columns:1fr}
@media(max-width:640px){.cc .frow{grid-template-columns:1fr}}
.cc .seg{display:flex;gap:6px;flex-wrap:wrap}
.cc .seg button{font-family:'Space Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);background:var(--chip);border:1px solid var(--line);border-radius:8px;padding:8px 13px;cursor:pointer}
.cc .seg button:hover{color:var(--ink);border-color:var(--soft)}
.cc .seg button.on{color:var(--ink);border-color:var(--ink);background:var(--surface)}
.cc .seg button.on.c-gen{color:var(--gen);border-color:var(--gen);background:color-mix(in srgb,var(--gen) 12%,var(--surface))}
.cc .seg button.on.c-dr{color:var(--rev);border-color:var(--rev);background:color-mix(in srgb,var(--rev) 12%,var(--surface))}
.cc .seg button.on.c-ar{color:var(--auto);border-color:var(--auto);background:color-mix(in srgb,var(--auto) 12%,var(--surface))}
.cc .seg button.on.c-nat{color:var(--nat);border-color:var(--nat);background:color-mix(in srgb,var(--nat) 12%,var(--surface))}
.cc .fx-row{background:var(--chip);border:1px solid var(--line2);border-radius:11px;padding:12px 13px;margin-bottom:10px}
.cc .fx-top{display:flex;gap:8px;align-items:center;margin-bottom:9px}
.cc .fx-top .n{font-family:'Space Mono',monospace;font-size:9px;font-weight:700;color:var(--soft);width:22px}
.cc .fx-top select{flex:1;width:auto}
.cc .side-seg{display:flex;gap:4px}
.cc .side-seg button{font-family:'Space Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:6px 8px;border-radius:6px;border:1px solid var(--line);background:var(--chip);color:var(--soft);cursor:pointer}
.cc .side-seg button.on-both{color:var(--ink);border-color:var(--ink);background:var(--surface)}
.cc .side-seg button.on-d{color:var(--dem);border-color:var(--dem);background:color-mix(in srgb,var(--dem) 12%,var(--surface))}
.cc .side-seg button.on-r{color:var(--rev);border-color:var(--rev);background:color-mix(in srgb,var(--rev) 12%,var(--surface))}
.cc .del{margin-left:2px;width:26px;height:26px;border-radius:7px;border:1px solid var(--line2);background:var(--field);color:var(--soft);cursor:pointer;font-size:12px}
.cc .del:hover{color:var(--rev);border-color:color-mix(in srgb,var(--rev) 45%,transparent)}
.cc .fx-params{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.cc .fx-params select{width:auto;min-width:120px;font-size:12px;padding:7px 9px}
.cc .fx-params .lbl{font-family:'Space Mono',monospace;font-size:9px;color:var(--soft);text-transform:uppercase;letter-spacing:.05em}
.cc .fx-params input[type=text]{width:auto;flex:1;min-width:140px;font-size:12px;padding:7px 9px}
.cc .nest{width:100%;margin-top:8px;padding:9px 10px;background:var(--field);border:1px dashed var(--line2);border-radius:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.cc .nest .lbl{color:var(--nat)}
.cc .addfx{width:100%;font-family:'Space Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);background:var(--field);border:1px dashed var(--line2);border-radius:10px;padding:11px 0;cursor:pointer}
.cc .addfx:hover{color:var(--ink);border-color:var(--soft)}
.cc .addfx:disabled{opacity:.4;cursor:default}
.cc .opt{background:var(--chip);border:1px solid var(--line2);border-radius:11px;padding:12px 13px;margin-bottom:10px}
.cc .opt.a{border-left:3px solid var(--nat)} .cc .opt.b{border-left:3px solid var(--blue)}
.cc .opt.c{border-left:3px solid var(--auto)} .cc .opt.d{border-left:3px solid var(--ref)}
.cc .opt-h{font-family:'Space Mono',monospace;font-size:8.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px;color:var(--muted)}
.cc .opt.a .opt-h{color:var(--nat)} .cc .opt.b .opt-h{color:var(--blue)}
.cc .opt.c .opt-h{color:var(--auto)} .cc .opt.d .opt-h{color:var(--ref)}
.cc .opt.dside-d{border-left:3px solid var(--dem)} .cc .opt.dside-r{border-left:3px solid var(--rev)}
.cc .opt.dside-d .opt-h{color:var(--dem)} .cc .opt.dside-r .opt-h{color:var(--rev)}
/* a 'bill' effect's editor — a name + two sub-effect lists, nested inside an option/side */
.cc .billeff{margin-top:9px;padding:10px;border:1px dashed var(--line2);border-radius:9px;background:var(--field)}
.cc .billname{width:100%;font-size:12.5px;font-weight:700;padding:8px 10px;margin-bottom:8px}
.cc .billsub{border-left:2px solid var(--line2);padding-left:9px;margin-top:8px}
.cc .billsub.pass{border-left-color:var(--green)} .cc .billsub.fail{border-left-color:var(--red)}
.cc .billsub-h{font-family:'Space Mono',monospace;font-size:8.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--soft)}
.cc .rw{background:var(--chip);border:1px dashed color-mix(in srgb,var(--inf) 45%,transparent);border-radius:11px;padding:12px 13px;margin-top:14px}
.cc .rw .opt-h{color:var(--inf)}
.cc .req{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:640px){.cc .req{grid-template-columns:1fr}}
.cc .reqbox{background:var(--chip);border:1px solid var(--line2);border-radius:11px;padding:12px 14px}
.cc .reqbox .t{font-family:'Space Mono',monospace;font-size:8.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:9px}
.cc .reqbox.d .t{color:var(--dem)} .cc .reqbox.r .t{color:var(--rev)}
.cc .lvlseg{display:flex;gap:5px}
.cc .lvlseg button{flex:1;font-family:'Space Mono',monospace;font-size:10px;font-weight:700;padding:7px 0;border-radius:7px;border:1px solid var(--line);background:var(--chip);color:var(--soft);cursor:pointer}
.cc .lvlseg button:hover{color:var(--ink)}
.cc .reqbox.d .lvlseg button.on{color:var(--dem);border-color:var(--dem);background:color-mix(in srgb,var(--dem) 12%,var(--surface))}
.cc .reqbox.r .lvlseg button.on{color:var(--rev);border-color:var(--rev);background:color-mix(in srgb,var(--rev) 12%,var(--surface))}
.cc .c-reqline{font-family:'Space Mono',monospace;font-size:9px;color:var(--soft);margin:0 0 10px;line-height:1.6}
.cc .c-reqline b{color:var(--nat);font-weight:700}
/* preview column */
.cc .prevcol{position:sticky;top:16px}
.cc .prevlabel{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--soft);margin-bottom:12px}
.cc .cardc{background:var(--surface);border:1px solid var(--line2);border-radius:13px;overflow:hidden;position:relative}
.cc .c-flag{position:absolute;top:10px;right:10px;width:26px;height:17px;object-fit:cover;border-radius:3px;border:1px solid var(--line);box-shadow:0 1px 3px rgba(0,0,0,.4)}
.cc .stripe{height:4px}
.cc .c-body{padding:14px 15px 13px}
.cc .c-kind{font-family:'Space Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px}
.cc .c-name{font-size:16px;font-weight:800;line-height:1.2;margin-bottom:7px;min-height:19px;color:var(--ink)}
.cc .c-desc{font-size:11px;color:var(--soft);font-style:italic;line-height:1.5;margin-bottom:10px}
.cc .c-req-line{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}
.cc .rq{font-family:'Space Mono',monospace;font-size:8.5px;font-weight:700;border-radius:5px;padding:3px 7px}
.cc .rq.d{color:var(--dem);background:color-mix(in srgb,var(--dem) 10%,transparent);border:1px solid color-mix(in srgb,var(--dem) 40%,transparent)}
.cc .rq.r{color:var(--rev);background:color-mix(in srgb,var(--rev) 10%,transparent);border:1px solid color-mix(in srgb,var(--rev) 40%,transparent)}
.cc .rq.cost{color:var(--inf);background:color-mix(in srgb,var(--inf) 10%,transparent);border:1px solid color-mix(in srgb,var(--inf) 40%,transparent)}
.cc .rq.acts{color:var(--indigo);background:color-mix(in srgb,var(--indigo) 10%,transparent);border:1px solid color-mix(in srgb,var(--indigo) 40%,transparent)}
.cc .rq.recyc{color:var(--blue);background:color-mix(in srgb,var(--blue) 10%,transparent);border:1px solid color-mix(in srgb,var(--blue) 40%,transparent)}
.cc .rq.pers{color:var(--nat);background:color-mix(in srgb,var(--nat) 10%,transparent);border:1px solid color-mix(in srgb,var(--nat) 40%,transparent)}
.cc .choice-banner{font-family:'Space Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);background:var(--field);border:1px solid var(--line2);border-radius:6px;padding:5px 8px;text-align:center;margin-bottom:9px}
.cc .fxgroup{margin-bottom:9px}
.cc .fxgroup .gt{font-family:'Space Mono',monospace;font-size:7.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}
.cc .fxgroup.gd .gt{color:var(--dem)} .cc .fxgroup.gr .gt{color:var(--rev)} .cc .fxgroup.gb .gt{color:var(--muted)}
.cc .fxgroup.ga .gt{color:var(--nat)} .cc .fxgroup.gb2 .gt{color:var(--blue)} .cc .fxgroup.gc .gt{color:var(--auto)} .cc .fxgroup.gd2 .gt{color:var(--ref)}
.cc .fxgroup.grw{margin-top:10px;padding-top:9px;border-top:1px dashed var(--line2)} .cc .fxgroup.grw .gt{color:var(--inf)}
.cc .fxline{font-size:11.5px;color:var(--muted);line-height:1.5;padding-left:10px;position:relative}
.cc .fxline::before{content:'▸';position:absolute;left:0;color:var(--soft);font-size:9px;top:2px}
.cc .fxline b{color:var(--ink)}
.cc .c-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid var(--line)}
.cc .tag{font-family:'Space Mono',monospace;font-size:7.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;border-radius:4px;padding:3px 6px;border:1px solid var(--line2);color:var(--muted);background:var(--field)}
.cc .valid{margin-top:14px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:13px 15px}
.cc .vline{font-family:'Space Mono',monospace;font-size:9.5px;padding:4px 0;color:var(--muted)}
.cc .vline.ok::before{content:'✓ ';color:var(--green)}
.cc .vline.warn::before{content:'⚠ ';color:var(--amber)}
.cc .savebtn{width:100%;margin-top:14px;font-family:'Space Mono',monospace;font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fff;background:var(--indigo);border:1px solid var(--indigo);border-radius:10px;padding:13px 0;cursor:pointer}
.cc .savebtn:hover{filter:brightness(1.08)}
.cc .savebtn:disabled{opacity:.55;cursor:not-allowed}
.cc .newbtn{width:100%;margin-top:8px;font-family:'Space Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);background:var(--field);border:1px dashed var(--line2);border-radius:10px;padding:10px 0;cursor:pointer}
.cc .newbtn:hover{color:var(--ink);border-color:var(--soft)}
.cc .savemsg{font-family:'Space Mono',monospace;font-size:9.5px;text-align:center;margin-top:9px;min-height:12px;line-height:1.5}
.cc .savemsg.ok{color:var(--green)} .cc .savemsg.err{color:var(--red)}
.cc .seedbtn{font-family:'Space Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);background:var(--field);border:1px dashed var(--line2);border-radius:9px;padding:9px 12px;cursor:pointer;margin-bottom:8px}
.cc .seedbtn:hover:not(:disabled){color:var(--ink);border-color:var(--soft)}
.cc .seedbtn:disabled{opacity:.55;cursor:not-allowed}
/* card pool list */
.cc .pool{margin-top:14px}
.cc .poolrow{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--line);font-size:12.5px}
.cc .poolrow:first-child{border-top:none}
.cc .poolrow .pn{font-weight:700;color:var(--ink)}
.cc .poolrow .pm{font-family:'Space Mono',monospace;font-size:9px;color:var(--soft);text-transform:uppercase;letter-spacing:.04em}
.cc .poolrow .pdel{border:1px solid var(--line2);background:var(--field);color:var(--soft);border-radius:7px;padding:5px 9px;font-family:'Space Mono',monospace;font-size:9px;font-weight:700;cursor:pointer}
.cc .poolrow .pdel:hover{color:var(--red);border-color:color-mix(in srgb,var(--red) 45%,transparent)}
.cc .poolrow .pedit{margin-left:auto;border:1px solid var(--line2);background:var(--field);color:var(--soft);border-radius:7px;padding:5px 9px;font-family:'Space Mono',monospace;font-size:9px;font-weight:700;cursor:pointer}
.cc .poolrow .pedit:hover{color:var(--indigo);border-color:color-mix(in srgb,var(--indigo) 45%,transparent)}
.cc .poolempty{color:var(--soft);font-size:12px;padding:8px 0}
/* archetype radio + progressive-disclosure links (customize lifecycle / chains & gates) */
.cc .seg button.on.c-arch{color:var(--indigo);border-color:var(--indigo);background:color-mix(in srgb,var(--indigo) 12%,var(--surface))}
.cc .disclose{font-family:'Space Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);background:none;border:none;cursor:pointer;padding:9px 0;display:inline-block}
.cc .disclose:hover{color:var(--ink)}
.cc .cgbar{display:block;width:100%;text-align:left;font-family:'Space Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);background:var(--chip);border:1px solid var(--line2);border-radius:10px;padding:12px 14px;cursor:pointer}
.cc .cgbar:hover{color:var(--ink);border-color:var(--soft)}
.cc .lifebox,.cc .cgbox{margin-top:4px}
/* stance-axis picker (two-readings header) */
.cc .axisrow{margin:2px 0 12px}
/* suggested cost */
.cc .costrow{display:flex;align-items:center;gap:12px}
.cc .costsug{font-family:'Space Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--inf);background:color-mix(in srgb,var(--inf) 10%,transparent);border:1px solid color-mix(in srgb,var(--inf) 40%,transparent);border-radius:8px;padding:9px 12px;white-space:nowrap}
.cc .costrow input[type=number]{margin:0}
.cc .costhint{font-family:'Space Mono',monospace;font-size:8.5px;color:var(--soft);letter-spacing:.04em}
/* lint strip (above Save) */
.cc .lint{margin-top:12px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 14px}
.cc .lintline{font-family:'Space Mono',monospace;font-size:9px;padding:3px 0;color:var(--amber);line-height:1.5}
.cc .lintline::before{content:'⚠ '}
.cc .lint.clean .lintline{color:var(--soft)}
.cc .lint.clean .lintline::before{content:'✓ ';color:var(--green)}
.cc .savebtn.seed{background:var(--surface);color:var(--indigo);margin-top:8px}
.cc .savebtn.seed:hover{filter:none;background:color-mix(in srgb,var(--indigo) 8%,var(--surface))}
`;

const TEMPLATE = `
<div class="form">
  <div class="frow single">
    <div><label>Start from an existing card (optional) — loads a copy to edit as a new card</label><select id="fDup"><option value="">— blank card —</option></select></div>
  </div>

  <div class="sect">Identity</div>
  <div class="frow single">
    <div><label>Card Name</label><input type="text" id="fName" maxlength="40"></div>
  </div>
  <div class="frow">
    <div><label>Number of Actions (1–10 — granted when played)</label><input type="number" id="fActs" min="1" max="10" style="width:100%"></div>
    <div>
      <label>Limiter — which decks it enters</label>
      <div class="seg" id="segLim">
        <button data-v="all">All Nations</button>
        <button data-v="nation" class="c-nat">Specific Nation</button>
      </div>
      <select id="fNation" style="margin-top:8px;display:none"></select>
    </div>
  </div>
  <div class="frow single">
    <div><label>Description (flavor — shown on card)</label><textarea id="fDesc"></textarea></div>
  </div>

  <div class="sect">Archetype <span class="cnt">picks the lifecycle for you</span></div>
  <div class="seg" id="segArch"></div>
  <button class="disclose" id="lifeToggle" type="button">customize lifecycle ▸</button>
  <div class="lifebox" id="lifeBox" style="display:none">
    <div class="frow">
      <div>
        <label>Decision Handler — who resolves the card's decision</label>
        <select id="fHandler"></select>
      </div>
      <div>
        <label>After it's played</label>
        <div class="seg" id="segAfter">
          <button data-v="discard">Discard permanently</button>
          <button data-v="shuffle" class="c-nat">&#8635; Shuffle back to deck</button>
        </div>
      </div>
    </div>
    <div class="frow single">
      <div>
        <label>Persistent — stays in play as a national modifier</label>
        <div class="seg" id="segPersist">
          <button data-v="no">No — resolves &amp; discards</button>
          <button data-v="yes" class="c-nat">∞ Persistent</button>
        </div>
      </div>
    </div>
  </div>

  <div class="sect">Effects <span class="cnt" id="fxCount"></span></div>
  <div class="seg" id="segReading" style="margin-bottom:12px">
    <button data-v="one">One reading</button>
    <button data-v="two">Two readings</button>
    <button data-v="menu">Menu choice</button>
  </div>
  <div class="axisrow" id="axisRow" style="display:none">
    <label>Stance axis — the two readings</label>
    <div class="seg" id="segAxis">
      <button data-v="dr" class="c-dr">🏛 Democratic / ✊ Revolutionary</button>
      <button data-v="ar" class="c-ar">👁 Autocratic / 📈 Reform</button>
    </div>
  </div>
  <div id="fxList"></div>
  <button class="addfx" id="addFx">+ Add Effect</button>

  <div class="sect">Chains &amp; Gates <span class="cnt">rare — usually collapsed</span></div>
  <button class="cgbar" id="cgToggle" type="button">▸ Card chains, dormancy &amp; stance gate</button>
  <div class="cgbox" id="cgBox" style="display:none">
    <div class="frow single">
      <div>
        <label>Dormant? — held out of decks until another card activates it</label>
        <div class="seg" id="segDormant">
          <button data-v="no">No — dealt normally</button>
          <button data-v="yes" class="c-nat">💤 Dormant</button>
        </div>
      </div>
    </div>
    <div class="frow">
      <div><label>Requires play of</label><select id="fReqCard"></select></div>
      <div><label>Allows play of</label><select id="fAllowCard"></select></div>
    </div>
    <div class="frow single" style="margin-bottom:12px">
      <div>
        <label>Purchase stance gate — off by default</label>
        <div class="seg" id="segStance">
          <button data-v="none">No stance required</button>
          <button data-v="gated">Stance-gated</button>
        </div>
      </div>
    </div>
    <div class="req" id="reqGrid">
      <div class="reqbox d">
        <div class="t" id="reqDT">Democratic side</div>
        <div class="lvlseg" id="reqD"><button data-v="1">D1</button><button data-v="2">D2</button><button data-v="3">D3</button></div>
      </div>
      <div class="reqbox r">
        <div class="t" id="reqRT">Revolutionary side</div>
        <div class="lvlseg" id="reqR"><button data-v="1">R1</button><button data-v="2">R2</button><button data-v="3">R3</button></div>
      </div>
    </div>
  </div>

  <div class="sect">Suggested Cost</div>
  <div class="costrow">
    <span class="costsug" id="costSug">SUGGESTED: 4 ⚡</span>
    <input type="number" id="fCost" min="0" max="20">
    <span class="costhint">override if you like</span>
  </div>

  <div class="sect">Card Pool</div>
  <div class="pool" id="poolList"><div class="poolempty">Loading…</div></div>
</div>

<div class="prevcol">
  <div class="prevlabel">Live Preview</div>
  <div class="cardc">
    <div class="stripe" id="pStripe"></div>
    <img class="c-flag" id="pFlag" alt="" hidden>
    <div class="c-body">
      <div class="c-kind" id="pKind"></div>
      <div class="c-name" id="pName"></div>
      <div class="c-desc" id="pDesc"></div>
      <div class="c-req-line" id="pReqs"></div>
      <div id="pFx"></div>
      <div class="c-tags" id="pTags"></div>
    </div>
  </div>
  <div class="valid" id="pValid"></div>
  <div class="lint" id="ccLint"></div>
  <button class="savebtn" id="ccSave">Save to Card Pool</button>
  <button class="savebtn seed" id="ccSaveSeed">Save &amp; Seed All</button>
  <button class="newbtn" id="ccNew" style="display:none">+ New card</button>
  <div class="savemsg" id="ccMsg"></div>
</div>
`;

let mounted = false;

export async function mountCardCreator(mount) {
  if (mounted || !mount) return;   // idempotent — build once, keep state across tab switches
  mounted = true;

  if (!document.getElementById('cc-style')) {
    const s = document.createElement('style'); s.id = 'cc-style'; s.textContent = CSS; document.head.appendChild(s);
  }
  const root = document.createElement('div'); root.className = 'cc'; root.innerHTML = TEMPLATE;
  mount.appendChild(root);
  const $ = function (id) { return root.querySelector('#' + id); };

  // The default state for a brand-new card. A function (not a literal) so "New card" and the initial
  // paint both start from a clean, independent copy — the Edit flow mutates state in place.
  function freshState() {
    return {
      name: '', cost: 4, acts: 2, desc: '', costTouched: false,   // costTouched: user overrode the suggested cost — stop auto-tracking it
      // reading ('one'|'two'|'menu') is the Effects switch that serializes mech+type+sides; type is the
      // stance axis when reading==='two' ('dr'|'ar'), serialized as 'generic' for one reading.
      reading: 'one', type: 'dr', lim: 'all', nation: '',
      archetype: 'choice',   // which lifecycle preset the radio shows (derived on load; may be null for exotic combos)
      lifeOpen: false, cgOpen: false,   // progressive-disclosure: customize-lifecycle + Chains & Gates panels
      stanceReq: 'none', reqD: 2, reqR: 2,   // stanceReq 'none' = anyone can buy/play; 'gated' = reqD/reqR levels apply
      fx: [
        { side: 'both', kind: 'stat_up', p: { stat: 'Growth', x: 4 } }
      ],
      copt: [
        { txt: '', fx: [{ kind: 'stat_up', p: { stat: 'Immigration', x: 8 } }] },
        { txt: '', fx: [{ kind: 'stat_down', p: { stat: 'Minority Rights', x: 4 } }] }
      ],
      persistV: 'no', dormant: 'no', reqCard: '', allowCard: '',   // dormant: held out of decks until a deck_add effect activates it
      handler: 'player',      // who resolves the card's decision: 'player' (holder decides) or a ministry name
      afterPlay: 'discard'    // 'discard' (permanent) or 'shuffle' (back into the deck)
    };
  }
  var state = freshState();
  var editingId = null;   // set to a card id while editing an existing card (Save → card_update); null = new card

  function markSeg(id, v) { root.querySelectorAll('#' + id + ' button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === String(v)); }); }
  function wireSeg(id, key, cb) {
    var seg = $(id);
    seg.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        seg.querySelectorAll('button').forEach(function (o) { o.classList.remove('on'); });
        b.classList.add('on');
        state[key] = (key === 'reqD' || key === 'reqR') ? +b.dataset.v : b.dataset.v;
        if (cb) cb(); renderPreview();
      };
    });
  }
  wireSeg('segLim', 'lim', function () { $('fNation').style.display = state.lim === 'nation' ? 'block' : 'none'; });
  wireSeg('segStance', 'stanceReq', syncStance);
  wireSeg('reqD', 'reqD'); wireSeg('reqR', 'reqR');
  // Lifecycle segs (inside "customize lifecycle") — a manual edit re-derives which archetype preset now
  // matches, so the radio stays honest (and deselects into an exotic combo rather than lying).
  wireSeg('segPersist', 'persistV', reflectArchetype);
  wireSeg('segDormant', 'dormant', reflectArchetype);
  wireSeg('segAfter', 'afterPlay', reflectArchetype);

  // The Archetype radio (built from ARCHETYPES). Picking one STAMPS its lifecycle fields, pins the
  // reading where required, and pops open Chains & Gates for a Chain link — then a full syncForm().
  $('segArch').innerHTML = Object.keys(ARCHETYPES).map(function (k) {
    return '<button data-v="' + k + '" class="c-arch">' + ARCHETYPES[k].label + '</button>';
  }).join('');
  $('segArch').querySelectorAll('button').forEach(function (b) {
    b.onclick = function () { applyArchetype(b.dataset.v); };
  });
  function applyArchetype(key) {
    var a = ARCHETYPES[key]; if (!a) return;
    state.archetype = key;
    Object.keys(a.fields).forEach(function (f) { state[f] = a.fields[f]; });
    if (a.handler) state.handler = a.handler;
    if (a.openChains) state.cgOpen = true;
    if (a.forceReading) setReading(a.forceReading, true);
    syncForm();
  }
  // Which preset (if any) the stored/edited lifecycle fields match — the one derivation both load and any
  // manual lifecycle edit run through. Returns a key, or null when the combo is exotic (no clean preset).
  function deriveArchetype() {
    var af = state.afterPlay, pv = state.persistV, dm = state.dormant;
    var key = dm === 'yes' ? 'chain'
      : pv === 'yes' ? 'standing'
      : af === 'shuffle' ? 'recurring'
      : state.reading === 'one' ? 'event'
      : 'choice';
    var f = ARCHETYPES[key].fields;
    return (f.afterPlay === af && f.persistV === pv && f.dormant === dm) ? key : null;
  }
  // After a manual lifecycle change: re-derive the radio, auto-open customize when it lands on an exotic
  // combo (so nothing the user did is hidden), and repaint the radio + panels.
  function reflectArchetype() {
    state.archetype = deriveArchetype();
    if (!state.archetype) state.lifeOpen = true;
    markSeg('segArch', state.archetype);
    $('lifeBox').style.display = state.lifeOpen ? '' : 'none';
    $('cgBox').style.display = state.cgOpen ? '' : 'none';
    renderCost();
  }

  // The Effects reading switch (One / Two / Menu). It's the ONE control that decides mech+type+sides:
  // one → generic oneoff (all effects 'both'); two → stance oneoff (effects grouped by side); menu → choice.
  $('segReading').querySelectorAll('button').forEach(function (b) {
    b.onclick = function () { setReading(b.dataset.v); syncForm(); };
  });
  function setReading(r, quiet) {
    state.reading = r;
    if (r === 'one') state.type = 'generic';
    else if (r === 'two' && state.type === 'generic') state.type = 'dr';   // a stance axis is required for two readings
    if (!quiet) state.archetype = deriveArchetype();   // one↔two flips the choice/event derivation
  }
  // Stance-axis picker (two-readings header): Dem/Rev vs Auto/Reform. Relabels the grouped effect
  // subheadings + the gate, and repaints.
  $('segAxis').querySelectorAll('button').forEach(function (b) {
    b.onclick = function () { state.type = b.dataset.v; markSeg('segAxis', state.type); syncAxis(); renderFx(); renderPreview(); };
  });

  // Progressive-disclosure toggles.
  $('lifeToggle').onclick = function () { state.lifeOpen = !state.lifeOpen; $('lifeBox').style.display = state.lifeOpen ? '' : 'none'; $('lifeToggle').textContent = state.lifeOpen ? 'customize lifecycle ▾' : 'customize lifecycle ▸'; };
  $('cgToggle').onclick = function () { state.cgOpen = !state.cgOpen; $('cgBox').style.display = state.cgOpen ? '' : 'none'; };

  // Decision Handler dropdown: "Player decides", "Head of Government decides" (no ministry) + each ministry.
  $('fHandler').innerHTML = '<option value="player">Player who plays it decides</option>' +
    '<option value="hog">Head of Government decides it</option>' +
    MINISTRIES.map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + ' Minister handles it</option>'; }).join('');
  $('fHandler').onchange = function () { state.handler = this.value; renderPreview(); };
  // Stance gate is optional: the D/R level pickers only matter when 'Stance-gated' is chosen. syncForm()
  // (called at first paint and on load/reset) is the single place that reflects state into the form —
  // the initial "on" states, input values and reqGrid visibility all flow from there.
  function syncStance() { $('reqGrid').style.display = state.stanceReq === 'gated' ? '' : 'none'; }

  // Reflect the whole `state` object back into every form control — the inverse of the input handlers.
  // Called after loadCard() (edit an existing card) or "New card" (reset) so the UI mirrors the data.
  function syncForm() {
    $('fName').value = state.name; $('fActs').value = state.acts; $('fDesc').value = state.desc;
    markSeg('segArch', state.archetype); markSeg('segReading', state.reading); markSeg('segAxis', state.type);
    markSeg('segLim', state.lim); markSeg('segPersist', state.persistV); markSeg('reqD', state.reqD); markSeg('reqR', state.reqR);
    markSeg('segStance', state.stanceReq); markSeg('segAfter', state.afterPlay); markSeg('segDormant', state.dormant);
    $('fHandler').value = state.handler;
    $('lifeBox').style.display = state.lifeOpen ? '' : 'none';
    $('lifeToggle').textContent = state.lifeOpen ? 'customize lifecycle ▾' : 'customize lifecycle ▸';
    $('cgBox').style.display = state.cgOpen ? '' : 'none';
    $('axisRow').style.display = state.reading === 'two' ? '' : 'none';
    $('fNation').style.display = state.lim === 'nation' ? 'block' : 'none';
    $('fNation').value = state.nation;
    syncAxis(); syncStance();
    fillCardSelect('fReqCard', 'reqCard'); fillCardSelect('fAllowCard', 'allowCard');
    renderFx(); renderCost(); renderPreview();
  }

  // Normalize a stored card `def` into a fresh editor `state`. Handles every legacy shape so the redesigned
  // form can host all ~50 cards: choice options may carry a single {kind,p} instead of an fx[]; a stored
  // reqD/reqR means Stance-gated; and a legacy `double` card is CONVERTED to the two-readings model —
  // dside.d.fx → effects with side 'd', dside.r.fx → side 'r', mech becomes oneoff (safe: d/r don't fire
  // yet). Reading is derived (generic oneoff → one; stance oneoff/double → two; choice → menu), then the
  // archetype is derived from the lifecycle fields (null when the combo matches no preset cleanly).
  function normalizeDef(d) {
    d = d || {};
    var s = freshState();
    s.name = d.name || ''; s.cost = Number(d.cost) || 0; s.acts = Math.max(1, Math.min(10, Number(d.acts) || 1)); s.desc = d.desc || '';
    s.costTouched = true;   // a stored card carries an explicit cost — respect it, don't overwrite with the suggestion
    s.lim = (d.lim === 'nation') ? 'nation' : 'all'; s.nation = d.nation || '';
    // Dormant is its own flag; a legacy lim='dormant' card maps to dormant + an 'all' limiter.
    s.dormant = (d.dormant === 'yes' || d.lim === 'dormant') ? 'yes' : 'no';
    s.persistV = d.persistV === 'yes' ? 'yes' : 'no';
    s.reqCard = d.reqCard || ''; s.allowCard = d.allowCard || '';
    s.handler = d.handler || 'player';
    s.afterPlay = d.afterPlay === 'shuffle' ? 'shuffle' : 'discard';
    var mech = (d.mech === 'choice' || d.mech === 'double') ? d.mech : 'oneoff';   // legacy 'bill' mechanic → oneoff
    var type = d.type || 'dr';
    // A stance card with stored reqD/reqR was gated; otherwise no stance was required.
    if (type !== 'generic' && (d.reqD != null || d.reqR != null)) {
      s.stanceReq = 'gated'; s.reqD = Number(d.reqD) || 2; s.reqR = Number(d.reqR) || 2;
    } else { s.stanceReq = 'none'; }
    var normFx = function (arr) { return (Array.isArray(arr) ? arr : []).map(function (f) { return { side: f.side || 'both', kind: f.kind || 'stat_up', p: f.p || {} }; }); };
    var normSlot = function (o) {   // a choice option / double side → { txt, fx:[…] }, tolerating a legacy single {kind,p}
      if (o && Array.isArray(o.fx)) return { txt: o.txt || '', fx: normFx(o.fx) };
      if (o && o.kind) return { txt: o.txt || '', fx: [{ side: 'both', kind: o.kind, p: o.p || {} }] };
      return { txt: (o && o.txt) || '', fx: [{ side: 'both', kind: 'stat_up', p: { stat: 'Growth', x: 3 } }] };
    };
    if (mech === 'choice') {
      s.reading = 'menu'; s.type = type;
      if (Array.isArray(d.copt) && d.copt.length) s.copt = d.copt.map(normSlot);
    } else if (mech === 'double') {
      // Convert Double Sided → Two readings (side-tagged flat effects). Keep the axis; a generic double → 'dr'.
      s.reading = 'two'; s.type = (type === 'ar') ? 'ar' : 'dr';
      var dfx = (d.dside && d.dside.d) ? normSlot(d.dside.d).fx : [];
      var rfx = (d.dside && d.dside.r) ? normSlot(d.dside.r).fx : [];
      s.fx = dfx.map(function (f) { return { side: 'd', kind: f.kind, p: f.p }; })
        .concat(rfx.map(function (f) { return { side: 'r', kind: f.kind, p: f.p }; }));
      if (!s.fx.length) s.fx = [{ side: 'both', kind: 'stat_up', p: { stat: 'Growth', x: 3 } }];
    } else {
      // oneoff: generic → one reading; a stance axis → two readings (effects keep their side tags).
      if (type === 'generic') { s.reading = 'one'; s.type = 'generic'; }
      else { s.reading = 'two'; s.type = type; }
      if (Array.isArray(d.fx)) s.fx = normFx(d.fx);
    }
    s.archetype = null;
    // Derive the archetype preset from the lifecycle fields; open customize when the combo is exotic.
    var af = s.afterPlay, pv = s.persistV, dm = s.dormant;
    var key = dm === 'yes' ? 'chain' : pv === 'yes' ? 'standing' : af === 'shuffle' ? 'recurring' : s.reading === 'one' ? 'event' : 'choice';
    var kf = ARCHETYPES[key].fields;
    if (kf.afterPlay === af && kf.persistV === pv && kf.dormant === dm) s.archetype = key; else s.lifeOpen = true;
    if (s.dormant === 'yes' || s.reqCard || s.allowCard || s.stanceReq === 'gated') s.cgOpen = true;   // expand Chains when any of its fields is non-default
    return s;
  }

  // Load an existing card into the editor for editing (Save → card_update).
  function loadCard(id) {
    if (saving) return;   // don't swap the editor's card out from under an in-flight save
    var c = POOL.find(function (x) { return x.id === id; });
    if (!c) return;
    state = normalizeDef(c.def); editingId = id;
    syncForm();
    updateSaveMode();
    root.scrollIntoView && root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // "Start from…" duplicate: load a COPY of an existing card as a brand-new card (editingId stays null,
  // name prefixed "Copy of "), so Save creates a new card and the original is untouched.
  function duplicateCard(id) {
    if (saving) return;
    var c = POOL.find(function (x) { return x.id === id; });
    if (!c) return;
    var s = normalizeDef(c.def);
    s.name = ('Copy of ' + (s.name || 'card')).slice(0, 40);
    state = s; editingId = null;
    syncForm();
    updateSaveMode();
    root.scrollIntoView && root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Reset the editor to a blank new card (leaves the pool untouched).
  function newCard() { if (saving) return; state = freshState(); editingId = null; syncForm(); updateSaveMode(); }

  // Reflect edit-vs-create in the Save button + a "New card" affordance. Kept in one place so the
  // label never drifts from what Save actually does.
  function updateSaveMode() {
    var btn = $('ccSave'); if (btn && !saving) btn.textContent = editingId ? 'Update card' : 'Save to Card Pool';
    var nb = $('ccNew'); if (nb) nb.style.display = editingId ? 'inline-block' : 'none';
  }

  ['fName', 'fActs', 'fDesc'].forEach(function (id) {
    $(id).oninput = function (e) {
      if (id === 'fName') state.name = e.target.value;
      if (id === 'fActs') { state.acts = Math.max(1, Math.min(10, +e.target.value || 1)); renderCost(); }
      if (id === 'fDesc') state.desc = e.target.value;
      renderPreview();
    };
  });
  // The cost field is an editable DEFAULT: typing in it marks the value as overridden (state.costTouched),
  // which stops the live suggestion from overwriting it.
  $('fCost').oninput = function (e) { state.cost = +e.target.value; state.costTouched = true; renderPreview(); };
  $('fNation').onchange = function () { state.nation = this.value; renderPreview(); };

  // Flat list of every effect object in the ACTIVE reading (menu → each option's fx; else → fx), plus each
  // committee-bill's pass/fail sub-effects. Used by the suggested-cost magnitude sum and the stat lint.
  function activeEffects() {
    var out = [];
    function walk(f) { out.push(f); if (f.kind === 'bill' && f.p) { (f.p.pass || []).forEach(walk); (f.p.fail || []).forEach(walk); } }
    if (state.reading === 'menu') state.copt.forEach(function (o) { (o.fx || []).forEach(walk); });
    else state.fx.forEach(walk);
    return out;
  }
  // Suggested influence cost — a tunable derivation from actions + total effect magnitude (see COST_WEIGHTS).
  // bonusApEffects counts effects whose kind grants extra AP; none do today, so it's 0 (documented).
  function suggestedCost() {
    var mag = 0;
    activeEffects().forEach(function (f) { mag += Math.abs(Number(f.p && f.p.x) || 0); });
    var bonusAp = 0;
    var n = Math.round(COST_WEIGHTS.acts * (state.acts || 1) + COST_WEIGHTS.effect * mag + COST_WEIGHTS.bonusAp * bonusAp);
    return Math.max(1, Math.min(20, n));
  }
  // Repaint the SUGGESTED chip, and — while the user hasn't overridden — keep the cost field tracking it.
  function renderCost() {
    var sug = suggestedCost();
    $('costSug').textContent = 'SUGGESTED: ' + sug + ' ⚡';
    if (!state.costTouched) state.cost = sug;
    $('fCost').value = state.cost;
  }

  function axisLabels() {
    return state.type === 'ar'
      ? { d: { ic: '👁', name: 'Autocratic', pre: 'A' }, r: { ic: '📈', name: 'Reform', pre: 'Ref' } }
      : { d: { ic: '🏛', name: 'Democratic', pre: 'D' }, r: { ic: '✊', name: 'Revolutionary', pre: 'R' } };
  }
  function syncAxis() {
    var ax = axisLabels();
    $('reqDT').textContent = ax.d.ic + ' ' + ax.d.name + ' side';
    $('reqRT').textContent = ax.r.ic + ' ' + ax.r.name + ' side';
    root.querySelectorAll('#reqD button').forEach(function (b) { b.textContent = ax.d.pre + b.dataset.v; });
    root.querySelectorAll('#reqR button').forEach(function (b) { b.textContent = ax.r.pre + b.dataset.v; });
  }

  /* ── effect builder ── */
  function fxParamsHTML(f, i) {
    var h = '';
    function statSel(v, field) { return '<select data-i="' + i + '" data-f="' + field + '">' + statOptions(v) + '</select>'; }
    function num(v, field) { return '<input type="number" value="' + (v || 0) + '" data-i="' + i + '" data-f="' + field + '" min="0" max="99">'; }
    if (f.kind === 'stat_up' || f.kind === 'stat_down') h = '<span class="lbl">stat</span>' + statSel(f.p.stat, 'stat') + '<span class="lbl">by</span>' + num(f.p.x, 'x');
    if (f.kind === 'budget_up' || f.kind === 'budget_down') h = '<span class="lbl">Budget Balance</span>' + (f.kind === 'budget_up' ? '<span class="lbl">+</span>' : '<span class="lbl">−</span>') + num(f.p.x, 'x') + '<span class="lbl">$B, one time</span>';
    if (f.kind === 'party_gain' || f.kind === 'party_lose') h = '<span class="lbl">approval</span>' + num(f.p.x, 'x') + '<span class="lbl">target chosen on play</span>';
    if (f.kind === 'decider_gain' || f.kind === 'decider_lose') h = '<span class="lbl">approval</span>' + num(f.p.x, 'x') + '<span class="lbl">for the party that decides</span>';
    if (f.kind === 'hex_pop') h = '<span class="lbl">approval</span>' + num(f.p.x, 'x') + '<span class="lbl">hex &amp; side chosen on play</span>';
    if (f.kind === 'res_add' || f.kind === 'res_remove') h = '<span class="lbl">' + (f.kind === 'res_add' ? 'add' : 'remove') + '</span>' + num(f.p.x, 'x') +
      '<select data-i="' + i + '" data-f="res">' + RESOURCES.map(function (rz) { return '<option value="' + rz + '"' + (rz === f.p.res ? ' selected' : '') + '>' + resLabel(rz) + '</option>'; }).join('') + '</select><span class="lbl">on hand</span>';
    if (f.kind === 'prod_up' || f.kind === 'prod_down') h = '<span class="lbl">' + (f.kind === 'prod_up' ? 'boost' : 'cut') + '</span>' +
      '<select data-i="' + i + '" data-f="res">' + PROD_RESOURCES.map(function (rz) { return '<option value="' + rz + '"' + (rz === f.p.res ? ' selected' : '') + '>' + resLabel(rz) + '</option>'; }).join('') + '</select>' +
      '<span class="lbl">by</span>' + num(f.p.x, 'x') +
      '<span class="lbl">for</span><select data-i="' + i + '" data-f="ticks">' + PROD_TICKS.map(function (t) { return '<option value="' + t + '"' + (t === (f.p.ticks || 12) ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select><span class="lbl">ticks</span>';
    if (f.kind === 'rel_up' || f.kind === 'rel_down') h = '<span class="lbl">with</span>' +
      '<select data-i="' + i + '" data-f="nation"><option value=""' + (f.p.nation ? '' : ' selected') + '>— select nation —</option>' +
      NATIONS.map(function (n) { return '<option value="' + esc(n.id) + '"' + (n.id === f.p.nation ? ' selected' : '') + '>' + esc(n.name) + '</option>'; }).join('') + '</select>' +
      '<span class="lbl">by</span>' + num(f.p.x, 'x');
    if (f.kind === 'rel_pick') h = '<span class="lbl">with a nation of the decider’s choice · by</span>' + num(f.p.x, 'x');
    if (f.kind === 'coal_pop_up' || f.kind === 'coal_pop_down') h = '<span class="lbl">approval</span>' + num(f.p.x, 'x') + '<span class="lbl">to every party in government</span>';
    if (f.kind === 'sanction') h = '<span class="lbl">sanction</span>' +
      '<select data-i="' + i + '" data-f="nation"><option value=""' + (f.p.nation ? '' : ' selected') + '>— target nation —</option>' +
      NATIONS.map(function (n) { return '<option value="' + esc(n.id) + '"' + (n.id === f.p.nation ? ' selected' : '') + '>' + esc(n.name) + '</option>'; }).join('') + '</select>' +
      '<span class="lbl">for min</span><select data-i="' + i + '" data-f="ticks">' + SANCTION_TICKS.map(function (t) { return '<option value="' + t + '"' + (t === (f.p.ticks || 36) ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select><span class="lbl">ticks</span>';
    if (f.kind === 'deck_add') {
      var dorm = POOL.filter(function (c) { return c.def && (c.def.dormant === 'yes' || c.def.lim === 'dormant'); });
      h = '<span class="lbl">activate</span><select data-i="' + i + '" data-f="card"><option value="">' + (dorm.length ? '— dormant card —' : '— none authored yet —') + '</option>' +
        dorm.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === f.p.card ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>' +
        '<span class="lbl">into</span><select data-i="' + i + '" data-f="nation"><option value=""' + (f.p.nation ? '' : ' selected') + '>— nation —</option>' +
        NATIONS.map(function (n) { return '<option value="' + esc(n.id) + '"' + (n.id === f.p.nation ? ' selected' : '') + '>' + esc(n.name) + '</option>'; }).join('') + '</select>' +
        '<span class="lbl">deck in</span><input type="number" value="' + (f.p.ticks || 0) + '" data-i="' + i + '" data-f="ticks" min="0" max="120" style="max-width:70px"><span class="lbl">ticks (0 = now)</span>';
    }
    if (f.kind === 'corp_grow' || f.kind === 'corp_shrink') h = '<span class="lbl">' + (f.kind === 'corp_grow' ? 'add' : 'cut') + '</span>' + num(f.p.x, 'x') + '<span class="lbl">growth · firm chosen on play (your nation)</span>';
    if (f.kind === 'corp_acquire') h = '<span class="lbl">acquirer &amp; target chosen on play · buyer needs ≥2× the target’s cash</span>';
    if (f.kind === 'corp_create') h = '<span class="lbl">sector</span>' +
      '<select data-i="' + i + '" data-f="sector">' + CATEGORIES.map(function (s) { return '<option' + (s === f.p.sector ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
      '<span class="lbl">named</span><input type="text" value="' + esc(f.p.name || '') + '" data-i="' + i + '" data-f="name" placeholder="Firm name…" style="flex:1;min-width:130px">';
    if (f.kind === 'shuffle') h = '<span class="lbl">↻ this card returns to the deck to be won again</span>';
    if (f.kind === 'hog_change') h = '<span class="lbl">the sitting Head of Government is replaced by a new leader</span>';
    if (f.kind === 'hex_el') h = '<span class="lbl">hex chosen on play · 12-tick cooldown</span>';
    if (f.kind === 'mob_add' || f.kind === 'mob_rem' || f.kind === 'mil_add' || f.kind === 'mil_rem') {
      var isMob = (f.kind === 'mob_add' || f.kind === 'mob_rem');
      var side = f.p.side || 'own';
      var ownLbl = isMob ? 'Nobody’s soldiers' : 'Belongs to a party';
      var enemyLbl = isMob ? 'Enemy armed mob' : 'Enemy militia';
      h = '<span class="lbl">hex</span><input type="text" value="' + esc(f.p.hex || '16,-5') + '" data-i="' + i + '" data-f="hex" style="max-width:90px">' +
        '<span class="lbl">' + (isMob ? '⚠' : '⚑') + '</span>' +
        '<select data-i="' + i + '" data-f="side">' +
          '<option value="own"' + (side === 'enemy' ? '' : ' selected') + '>' + ownLbl + '</option>' +
          '<option value="enemy"' + (side === 'enemy' ? ' selected' : '') + '>' + enemyLbl + '</option>' +
        '</select>';
    }
    if (f.kind === 'cond') h = '<span class="lbl">if</span>' + statSel(f.p.stat, 'stat') +
      '<select data-i="' + i + '" data-f="dir"><option' + (f.p.dir === 'above' ? ' selected' : '') + '>above</option><option' + (f.p.dir === 'below' ? ' selected' : '') + '>below</option></select>' + num(f.p.x, 'x');
    if (f.kind === 'appoint') h = '<span class="lbl">ministry</span><select data-i="' + i + '" data-f="min">' + MINISTRIES.map(function (m) { return '<option' + (m === f.p.min ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select>';
    if (f.kind === 'event') h = '<input type="text" placeholder="Event decision text…" value="' + esc(f.p.txt || '') + '" data-i="' + i + '" data-f="txt">';
    if (KINDS[f.kind].nested) {
      h += '<div class="nest"><span class="lbl">' + (f.kind === 'appoint' ? 'or else →' : 'then →') + '</span>' +
        '<select data-i="' + i + '" data-f="nk">' + SIMPLE.map(function (k) { return '<option value="' + k + '"' + (k === f.p.nk ? ' selected' : '') + '>' + KINDS[k].label + '</option>'; }).join('') + '</select>';
      var nk = f.p.nk || 'party_lose';
      if (nk === 'stat_up' || nk === 'stat_down') h += '<select data-i="' + i + '" data-f="nstat">' + statOptions(f.p.np && f.p.np.stat) + '</select>';
      if (nk !== 'no_conf' && nk !== 'nat_el' && nk !== 'coal_up' && nk !== 'coal_down') h += '<input type="number" value="' + ((f.p.np && f.p.np.x) || 2) + '" data-i="' + i + '" data-f="nx" min="0" max="99">';
      h += '</div>';
    }
    return h;
  }
  // Render a 'bill' effect's editor (a name + two sub-effect lists), keyed off the effect's base ref
  // ('o0_1' or 'dd0'/'dr0'). Sub-effects use '<ref>~p<i>' / '<ref>~f<i>'; the name uses '<ref>~name'.
  function renderBillEffect(f, ref) {
    f.p = f.p || {}; f.p.pass = f.p.pass || []; f.p.fail = f.p.fail || [];
    function sub(list, tag, title, cls) {
      var rows = list.map(function (sf, k) {
        var di = ref + '~' + tag + k;
        var del = list.length > 1 ? '<button class="del" data-i="' + di + '">✕</button>' : '';
        return '<div class="fx-top" style="margin-top:7px"><span class="n">' + (k + 1) + '</span>' +
          '<select data-i="' + di + '" data-f="kind">' + kindOpts(sf, false) + '</select>' + del + '</div>' +
          '<div class="fx-params">' + fxParamsHTML(sf, di) + '</div>';
      }).join('');
      var add = list.length < 5 ? '<button class="addfx billsubadd" data-add="' + ref + '~' + tag + '" style="margin-top:7px">+ Add effect (' + list.length + '/5)</button>' : '';
      return '<div class="billsub ' + cls + '"><div class="billsub-h">' + title + '</div>' + rows + add + '</div>';
    }
    return '<div class="billeff">' +
      '<input type="text" class="billname" data-i="' + ref + '~name" placeholder="Name this committee bill…" value="' + esc(f.p.name || '') + '">' +
      sub(f.p.pass, 'p', '✔ If it passes', 'pass') + sub(f.p.fail, 'f', '✘ If it fails', 'fail') + '</div>';
  }
  function activeArr() { return state.reading === 'menu' ? state.copt : state.fx; }
  // Decode a Government-Choice option effect's data-i ('o<opt>_<eff>') → { o: the option, j: effect index }.
  function optRef(di) { var m = /^o(\d+)_(\d+)$/.exec(di); return m ? { o: state.copt[+m[1]], j: +m[2] } : null; }
  // The effect object at a base ref — a plain integer indexes the flat fx[] (one/two readings, where a
  // committee bill can live in a converted double side); 'o0_1' indexes a Menu-choice option effect. The
  // shared lookup a bill effect's sub-refs resolve their parent through.
  function effectAt(ref) { if (/^\d+$/.test(ref)) return state.fx[+ref]; var or = optRef(ref); return or ? or.o.fx[or.j] : null; }
  // A bill EFFECT's name field: data-i '<baseRef>~name' → the bill effect object (or null).
  function billNameRef(di) { var m = /^(.+)~name$/.exec(di); var be = m && effectAt(m[1]); return (be && be.kind === 'bill') ? be : null; }
  // A bill EFFECT's sub-effect: data-i '<baseRef>~p<i>' (pass) / '<baseRef>~f<i>' (fail) → { list, i }.
  function billSubRef(di) {
    var m = /^(.+)~([pf])(\d+)$/.exec(di); if (!m) return null;
    var be = effectAt(m[1]); if (!be || be.kind !== 'bill') return null;
    be.p = be.p || {}; be.p[m[2] === 'p' ? 'pass' : 'fail'] = be.p[m[2] === 'p' ? 'pass' : 'fail'] || [];
    return { list: be.p[m[2] === 'p' ? 'pass' : 'fail'], i: +m[3] };
  }
  // The kind <select> options. The 'bill' effect is offered ONLY where allowBill is set (Government
  // Choice options + Double-Sided sides) — never in a plain One-Off or nested inside another bill.
  function kindOpts(f, allowBill) {
    return Object.keys(KINDS).filter(function (k) { return allowBill || !KINDS[k].billOnly; }).map(function (k) {
      return '<option value="' + k + '"' + (k === f.kind ? ' selected' : '') + '>' + KINDS[k].label + '</option>';
    }).join('');
  }
  // Fresh params for a newly-chosen effect kind — ONE source, shared by every effect-row change handler
  // (top-level, double-side, choice-option, committee-bill), so a new kind is wired up in exactly one place.
  function defaultFxParams(v) {
    return v === 'cond' ? { stat: 'Crime', dir: 'above', x: 50, nk: 'party_lose', np: { x: 2 } }
      : v === 'appoint' ? { min: 'Interior', nk: 'stat_down', np: { stat: 'Growth', x: 3 } }
      : (v === 'res_add' || v === 'res_remove') ? { res: 'food', x: 2 }
      : (v === 'prod_up' || v === 'prod_down') ? { res: 'energy', x: 2, ticks: 12 }
      : (v === 'rel_up' || v === 'rel_down') ? { nation: '', x: 2 }
      : v === 'rel_pick' ? { x: 1 }
      : v === 'deck_add' ? { card: '', nation: '', ticks: 0 }
      : v === 'sanction' ? { nation: '', ticks: 36 }
      : (v === 'corp_grow' || v === 'corp_shrink') ? { x: 2 }
      : (v === 'corp_acquire' || v === 'shuffle' || v === 'hog_change') ? {}
      : v === 'corp_create' ? { sector: CATEGORIES[0], name: '' }
      : v === 'bill' ? { name: '', pass: [{ kind: 'stat_up', p: { stat: 'Growth', x: 5 } }], fail: [{ kind: 'stat_down', p: { stat: 'Growth', x: 3 } }] }
      : (v === 'decider_gain' || v === 'decider_lose' || v === 'coal_pop_up' || v === 'coal_pop_down') ? { x: 2 }
      : (v === 'mob_add' || v === 'mob_rem' || v === 'mil_add' || v === 'mil_rem') ? { hex: '16,-5', side: 'own' }
      : { stat: POLICY_STATS[1], x: 3 };
  }
  // Apply one field change to an effect object; returns true when the row needs a re-render (renderFx).
  // ONE source for every effect-row change handler (top-level, side, option, and bill sub-effects).
  function applyEffectChange(r, fd, v) {
    if (fd === 'kind') { r.kind = v; r.p = defaultFxParams(v); return true; }
    if (fd === 'nk') { r.p.nk = v; r.p.np = r.p.np || {}; return true; }
    if (fd === 'nstat') { r.p.np = r.p.np || {}; r.p.np.stat = v; return false; }
    if (fd === 'nx') { r.p.np = r.p.np || {}; r.p.np.x = +v; return false; }
    r.p[fd] = (fd === 'x' || fd === 'ticks') ? +v : v; return false;
  }

  // Repaint after any effect edit — the effect list, the live suggestion (cost tracks magnitude) and preview.
  function fxChanged(reRender) { if (reRender) renderFx(); renderCost(); renderPreview(); }
  function renderFx() {
    var wrap = $('fxList'); var ax = axisLabels();
    if (state.reading === 'menu') {
      // Menu choice — the Government-Choice options editor (A/B/C/D, each with its own effect list).
      var LET = ['A', 'B', 'C', 'D'], CLS = ['a', 'b', 'c', 'd'];
      wrap.innerHTML = state.copt.map(function (o, i) {
        var del = state.copt.length > 2 ? '<button class="del" data-i="' + i + '" style="float:right;margin-top:-2px">✕</button>' : '';
        var effRows = o.fx.map(function (f, j) {
          var ref = 'o' + i + '_' + j;
          var ed = o.fx.length > 1 ? '<button class="del" data-i="' + ref + '">✕</button>' : '';
          return '<div class="fx-top" style="margin-top:9px"><span class="n">' + (j + 1) + '</span>' +
            '<select data-i="' + ref + '" data-f="kind">' + kindOpts(f, true) + '</select>' + ed + '</div>' +
            (f.kind === 'bill' ? renderBillEffect(f, ref) : '<div class="fx-params">' + fxParamsHTML(f, ref) + '</div>');
        }).join('');
        var add = o.fx.length < 3 ? '<button class="addfx optadd" data-add="' + i + '" style="margin-top:9px">+ Add effect (' + o.fx.length + '/3)</button>' : '';
        return '<div class="opt ' + CLS[i] + '">' + del +
          '<div class="opt-h">Option ' + LET[i] + ' — the government may:</div>' +
          '<input type="text" value="' + esc(o.txt || '') + '" data-i="' + i + '" data-f="txt" placeholder="What this choice looks like in the news…">' +
          effRows + add + '</div>';
      }).join('');
      $('fxCount').textContent = state.copt.length + ' / 4 options · up to 3 effects each · decider picks one';
      var ab = $('addFx'); ab.style.display = 'block'; ab.textContent = '+ Add Option'; ab.disabled = state.copt.length >= 4;
    } else if (state.reading === 'two') {
      // Two readings — effects GROUPED by side under three subheadings (Shared / Side A / Side B), each with
      // its own "+ Add effect". No per-row side toggle: the group a row sits in IS its side.
      var GROUPS = [
        { side: 'both', cls: '', h: '◈ Shared (both readings)' },
        { side: 'd', cls: 'dside-d', h: ax.d.ic + ' ' + ax.d.name + (state.stanceReq === 'gated' ? ' (' + ax.d.pre + state.reqD + '+)' : '') },
        { side: 'r', cls: 'dside-r', h: ax.r.ic + ' ' + ax.r.name + (state.stanceReq === 'gated' ? ' (' + ax.r.pre + state.reqR + '+)' : '') }
      ];
      wrap.innerHTML = GROUPS.map(function (g) {
        var members = state.fx.map(function (f, i) { return { f: f, i: i }; }).filter(function (x) { return (x.f.side || 'both') === g.side; });
        var effRows = members.map(function (x, k) {
          var f = x.f, ref = String(x.i);
          var del = '<button class="del" data-i="' + ref + '">✕</button>';
          return '<div class="fx-top" style="margin-top:9px"><span class="n">' + (k + 1) + '</span>' +
            '<select data-i="' + ref + '" data-f="kind">' + kindOpts(f, true) + '</select>' + del + '</div>' +
            (f.kind === 'bill' ? renderBillEffect(f, ref) : '<div class="fx-params">' + fxParamsHTML(f, ref) + '</div>');
        }).join('') || '<div class="fxline" style="color:var(--soft);padding:4px 0">no effects on this reading</div>';
        var add = members.length < 3 ? '<button class="addfx groupadd" data-side="' + g.side + '" style="margin-top:9px">+ Add effect</button>' : '';
        return '<div class="opt ' + g.cls + '"><div class="opt-h">' + g.h + '</div>' + effRows + add + '</div>';
      }).join('');
      $('fxCount').textContent = state.fx.length + ' effects · grouped by reading';
      $('addFx').style.display = 'none';
    } else {
      // One reading — a single flat list, every effect fires as 'both'. No side toggles, no stance.
      wrap.innerHTML = state.fx.map(function (f, i) {
        return '<div class="fx-row"><div class="fx-top"><span class="n">' + (i + 1) + '</span>' +
          '<select data-i="' + i + '" data-f="kind">' + kindOpts(f) + '</select>' +
          '<button class="del" data-i="' + i + '">✕</button></div>' +
          '<div class="fx-params">' + fxParamsHTML(f, i) + '</div></div>';
      }).join('');
      $('fxCount').textContent = state.fx.length + ' / 5';
      var ab2 = $('addFx'); ab2.style.display = 'block'; ab2.textContent = '+ Add Effect'; ab2.disabled = state.fx.length >= 5;
    }

    wrap.querySelectorAll('select,input').forEach(function (el) {
      el.onchange = el.oninput = function () {
        var fd = el.dataset.f, v = el.value, di = el.dataset.i;
        // A bill effect's name, then its pass/fail sub-effects ('<ref>~name' / '<ref>~p0' / '<ref>~f0').
        var bn = billNameRef(di);
        if (bn) { bn.p.name = v; renderPreview(); return; }
        var bs = billSubRef(di);
        if (bs) { fxChanged(applyEffectChange(bs.list[bs.i], fd, v)); return; }
        // A Menu-choice option effect ('o0_0'…).
        var or = optRef(di);
        if (or) { fxChanged(applyEffectChange(or.o.fx[or.j], fd, v)); return; }
        // Top-level: a Menu-choice option TITLE ('i', data-f=txt) or a flat one/two-reading effect ('i').
        var f = activeArr()[+di];
        if (fd === 'txt' && state.reading === 'menu') { f.txt = v; renderPreview(); return; }
        fxChanged(applyEffectChange(f, fd, v));
      };
    });
    wrap.querySelectorAll('.del').forEach(function (b) {
      b.onclick = function () {
        var di = b.dataset.i, bs = billSubRef(di), or = optRef(di);
        if (bs) bs.list.splice(bs.i, 1);
        else if (or) or.o.fx.splice(or.j, 1);
        else activeArr().splice(+di, 1);
        fxChanged(true);
      };
    });
    // Two-readings: add an effect into a specific side group (Shared / A / B).
    wrap.querySelectorAll('.groupadd').forEach(function (b) {
      b.onclick = function () {
        var side = b.dataset.side;
        if (state.fx.filter(function (f) { return (f.side || 'both') === side; }).length < 3) {
          state.fx.push({ side: side, kind: 'stat_up', p: { stat: 'Growth', x: 3 } }); fxChanged(true);
        }
      };
    });
    wrap.querySelectorAll('.optadd').forEach(function (b) {
      b.onclick = function () { var o = state.copt[+b.dataset.add]; if (o.fx.length < 3) { o.fx.push({ kind: 'stat_up', p: { stat: 'Growth', x: 3 } }); fxChanged(true); } };
    });
    // Add an effect to a bill effect's pass/fail list (data-add '<ref>~p' / '<ref>~f').
    wrap.querySelectorAll('.billsubadd').forEach(function (b) {
      b.onclick = function () {
        var m = /^(.+)~([pf])$/.exec(b.dataset.add); if (!m) return;
        var be = effectAt(m[1]); if (!be || be.kind !== 'bill') return;
        var key = m[2] === 'p' ? 'pass' : 'fail'; be.p[key] = be.p[key] || [];
        if (be.p[key].length < 5) { be.p[key].push({ kind: 'stat_up', p: { stat: 'Growth', x: 3 } }); fxChanged(true); }
      };
    });
  }
  $('addFx').onclick = function () {
    if (state.reading === 'menu') { if (state.copt.length < 4) { state.copt.push({ txt: '', fx: [{ kind: 'stat_up', p: { stat: 'Growth', x: 3 } }] }); fxChanged(true); } }
    else if (state.reading === 'one' && state.fx.length < 5) { state.fx.push({ side: 'both', kind: 'stat_up', p: { stat: 'Growth', x: 3 } }); fxChanged(true); }
  };

  /* ── preview ── */
  // One source for effect text (card-effect-text.js), threaded with this creator's nation-name lookup
  // so a relations effect reads the picked nation's name in the preview.
  function fxText(kind, p) { return cardEffectText(kind, p, nationName, cardName); }
  function renderPreview() {
    var ax = axisLabels();
    $('pName').textContent = state.name || 'Untitled Card';
    $('pDesc').textContent = state.desc || '';
    // The stance axis is only meaningful for two readings — one reading serializes as generic.
    var etype = state.reading === 'one' ? 'generic' : state.type;
    var stripe = etype === 'generic' ? 'var(--gen)' : etype === 'ar' ? 'var(--auto)' : 'var(--rev)';
    $('pStripe').style.background = state.lim === 'nation' ? 'var(--nat)' : stripe;
    var pFlag = $('pFlag'), pfSrc = state.lim === 'nation' ? nationFlag(state.nation) : '';
    if (pfSrc) { pFlag.src = pfSrc; pFlag.hidden = false; } else { pFlag.hidden = true; pFlag.removeAttribute('src'); }
    var natName = nationName(state.nation);
    var kindTxt = state.dormant === 'yes' ? '💤 Dormant · ' + (state.lim === 'nation' ? (natName || '—') : 'activated by a card')
      : state.lim === 'nation' ? 'Nation · ' + (natName || '—')
      : state.reading === 'menu' ? 'Menu · government chooses'
      : etype === 'generic' ? 'Generic' : 'Stance · ' + ax.d.name + ' / ' + ax.r.name;
    var kindCol = state.lim === 'nation' ? 'var(--nat)' : etype === 'generic' ? 'var(--gen)' : etype === 'ar' ? 'var(--auto)' : 'var(--rev)';
    var pk = $('pKind'); pk.textContent = kindTxt; pk.style.color = kindCol;

    var reqs = '<span class="rq cost">⚡ ' + (state.cost || 0) + '</span>';
    reqs += '<span class="rq acts">▶ ' + (state.acts || 1) + ' action' + ((state.acts || 1) === 1 ? '' : 's') + '</span>';
    if (state.persistV === 'yes') reqs += '<span class="rq pers">∞ Persistent</span>';
    if (state.afterPlay === 'shuffle') reqs += '<span class="rq recyc">↻ Reshuffles</span>';
    var gated = etype !== 'generic' && state.stanceReq === 'gated';
    if (gated) reqs += '<span class="rq d">' + ax.d.ic + ' ' + ax.d.pre + state.reqD + '+</span><span class="rq r">' + ax.r.ic + ' ' + ax.r.pre + state.reqR + '+</span>';
    else if (state.reading === 'two') reqs += '<span class="rq">no stance req</span>';
    $('pReqs').innerHTML = reqs;

    var html = '';
    if (state.reqCard) html += '<div class="c-reqline">⛓ Requires play of <b>' + esc(cardName(state.reqCard)) + '</b></div>';
    if (state.allowCard) html += '<div class="c-reqline">🔓 Allows play of <b>' + esc(cardName(state.allowCard)) + '</b></div>';
    if (state.reading === 'menu') {
      var LET = ['A', 'B', 'C', 'D'], GCL = ['ga', 'gb2', 'gc', 'gd2'];
      html += '<div class="choice-banner">⚖ Holder plays → government must choose</div>';
      state.copt.forEach(function (o, i) {
        html += '<div class="fxgroup ' + GCL[i] + '"><div class="gt">' + LET[i] + ' · ' + esc(o.txt || 'untitled option') + '</div>' +
          o.fx.map(function (f) { return '<div class="fxline">' + fxText(f.kind, f.p) + '</div>'; }).join('') + '</div>';
      });
    } else {
      // One / Two readings share one grouped renderer — one reading files every effect under 'both'.
      var groups = { d: [], r: [], both: [] };
      state.fx.forEach(function (f) { groups[state.reading === 'one' ? 'both' : (f.side || 'both')].push(fxText(f.kind, f.p)); });
      if (groups.d.length) html += '<div class="fxgroup gd"><div class="gt">' + ax.d.ic + ' ' + ax.d.name + ' play' + (gated ? ' (' + ax.d.pre + state.reqD + '+)' : '') + '</div>' + groups.d.map(function (t) { return '<div class="fxline">' + t + '</div>'; }).join('') + '</div>';
      if (groups.r.length) html += '<div class="fxgroup gr"><div class="gt">' + ax.r.ic + ' ' + ax.r.name + ' play' + (gated ? ' (' + ax.r.pre + state.reqR + '+)' : '') + '</div>' + groups.r.map(function (t) { return '<div class="fxline">' + t + '</div>'; }).join('') + '</div>';
      if (groups.both.length) html += '<div class="fxgroup gb"><div class="gt">' + (state.reading === 'two' ? '◈ Both readings' : '◈ When played') + '</div>' + groups.both.map(function (t) { return '<div class="fxline">' + t + '</div>'; }).join('') + '</div>';
    }
    $('pFx').innerHTML = html || '<div class="fxline" style="color:var(--soft)">no effects yet</div>';

    var arr = state.reading === 'menu' ? state.copt.reduce(function (a, o) { return a.concat(o.fx); }, []) : state.fx;
    var mechLabel = state.reading === 'menu' ? 'Menu Choice' : state.reading === 'two' ? 'Two Readings' : 'One Reading';
    var tags = ['<span class="tag">' + mechLabel + '</span>'];
    if (arr.some(function (f) { return f.kind === 'party_gain' || f.kind === 'party_lose'; })) tags.push('<span class="tag" style="color:var(--auto);border-color:color-mix(in srgb,var(--auto) 45%,transparent)">Target Party</span>');
    if (state.reading === 'menu' || arr.some(function (f) { return ['no_conf', 'nat_el', 'hex_el'].indexOf(f.kind) >= 0; })) tags.push('<span class="tag" style="color:var(--nat);border-color:color-mix(in srgb,var(--nat) 45%,transparent)">Force Gov</span>');
    if (arr.some(function (f) { return ['mob_add', 'mob_rem', 'mil_add', 'mil_rem'].indexOf(f.kind) >= 0; })) tags.push('<span class="tag" style="color:var(--rev);border-color:color-mix(in srgb,var(--rev) 45%,transparent)">Units on Map</span>');
    $('pTags').innerHTML = tags.join('');

    var v = [];
    if (state.reading === 'menu') {
      v.push(state.copt.length >= 2 && state.copt.length <= 4 ? ['ok', 'Options: ' + state.copt.length + ' / 4'] : ['warn', 'Menu cards need 2–4 options']);
      v.push(state.copt.every(function (f) { return (f.txt || '').trim().length > 0; }) ? ['ok', 'All options titled'] : ['warn', 'Every option needs text — the government reads these aloud']);
      var sigs = state.copt.map(function (o) { return JSON.stringify(o.fx); });
      v.push(new Set(sigs).size === sigs.length ? ['ok', 'Options differ — a real dilemma'] : ['warn', 'Two options do the same thing — no dilemma, no card']);
    } else if (state.reading === 'two') {
      var hasD = state.fx.some(function (f) { return f.side === 'd' || f.side === 'both'; });
      var hasR = state.fx.some(function (f) { return f.side === 'r' || f.side === 'both'; });
      v.push(hasD && hasR ? ['ok', 'Both readings have a playable effect'] : ['warn', 'One reading has no effect — half the buyers won’t want this card']);
      v.push(state.stanceReq === 'gated' ? ['ok', 'Readings gate at ' + ax.d.pre + state.reqD + '+ / ' + ax.r.pre + state.reqR + '+'] : ['ok', 'No stance required — either reading is playable by anyone']);
    } else {
      v.push(state.fx.length <= 5 ? ['ok', 'Effects: ' + state.fx.length + ' / 5'] : ['warn', 'Too many effects']);
      v.push(state.fx.length ? ['ok', 'One reading — every effect fires when played'] : ['warn', 'Add at least one effect']);
    }
    if (arr.some(function (f) { return (f.kind === 'rel_up' || f.kind === 'rel_down') && !(f.p && f.p.nation); }))
      v.push(['warn', 'A relations effect has no nation picked — it will do nothing']);
    if (arr.some(function (f) { return f.kind === 'deck_add' && !(f.p && f.p.card && f.p.nation); }))
      v.push(['warn', 'A “card enters deck” effect needs both a dormant card and a nation picked']);
    if (arr.some(function (f) { return f.kind === 'sanction' && !(f.p && f.p.nation); }))
      v.push(['warn', 'A sanction effect has no target nation picked — it will do nothing']);
    if (arr.some(function (f) { return f.kind === 'bill' && !((f.p && f.p.pass || []).length) && !((f.p && f.p.fail || []).length); }))
      v.push(['warn', 'A committee-bill effect has no pass/fail effects — nothing to introduce']);
    if (state.persistV === 'yes') v.push(['ok', '∞ Persistent — joins the national modifier board when played']);
    v.push(state.handler === 'player'
      ? ['ok', 'The player who plays it decides — no ministry gate']
      : state.handler === 'hog'
      ? ['ok', 'The Head of Government must resolve the decision']
      : ['ok', esc(state.handler) + ' Minister must resolve the decision']);
    v.push(state.afterPlay === 'shuffle'
      ? ['ok', '↻ Shuffles back into the deck after it resolves']
      : ['ok', 'Discarded for good after it resolves']);
    if (state.reqCard) v.push(['ok', 'Locked until “' + esc(cardName(state.reqCard)) + '” has been played']);
    if (state.allowCard) v.push(['ok', 'Playing this unlocks “' + esc(cardName(state.allowCard)) + '”']);
    if (state.reqCard && state.reqCard === state.allowCard) v.push(['warn', 'Requires and allows the same card — circular chain']);
    v.push(state.name ? ['ok', 'Named'] : ['warn', 'Card needs a name']);
    if (state.lim === 'nation') v.push(state.nation ? ['ok', 'Enters ' + esc(nationName(state.nation) || state.nation) + '’s deck only'] : ['warn', 'Pick a nation for a Specific-Nation card']);
    if (state.dormant === 'yes') v.push(['ok', '💤 Dormant — dealt to no deck until a “dormant card enters deck” effect activates it']);
    $('pValid').innerHTML = v.map(function (x) { return '<div class="vline ' + x[0] + '">' + x[1] + '</div>'; }).join('');
    renderLint();

    // Save is blocked while any hard requirement is unmet (a name, and a nation when nation-limited).
    var blocked = !state.name.trim() || (state.lim === 'nation' && !state.nation);
    $('ccSave').disabled = blocked || saving;
    $('ccSaveSeed').disabled = blocked || saving;
  }

  // Flatten every effect object out of any stored card `def` (fx / each copt option / each dside side, plus
  // committee-bill pass/fail sub-effects) — the cross-card scan the lint checks read.
  function defEffects(def) {
    var out = [];
    function walk(f) { if (!f) return; out.push(f); if (f.kind === 'bill' && f.p) { (f.p.pass || []).forEach(walk); (f.p.fail || []).forEach(walk); } }
    if (def) {
      (def.fx || []).forEach(walk);
      (def.copt || []).forEach(function (o) { (o && o.fx || []).forEach(walk); });
      if (def.dside) { ((def.dside.d && def.dside.d.fx) || []).forEach(walk); ((def.dside.r && def.dside.r.fx) || []).forEach(walk); }
    }
    return out;
  }
  // The compact lint strip above Save — cheap, NON-blocking validation. Four checks: referenced-card
  // existence (reqCard + deck_add targets), unknown stats (retired POLICY_STATS), a dormant card nothing
  // seeds, and a cost far from the suggestion.
  function renderLint() {
    var el = $('ccLint'); if (!el) return;
    var warns = [];
    var ids = {}; POOL.forEach(function (c) { ids[c.id] = true; });
    var eff = activeEffects();
    // 1) reqCard / deck_add target references a card id that doesn't exist.
    var missing = false;
    if (state.reqCard && !ids[state.reqCard]) missing = true;
    if (state.allowCard && !ids[state.allowCard]) missing = true;
    eff.forEach(function (f) { if (f.kind === 'deck_add' && f.p && f.p.card && !ids[f.p.card]) missing = true; });
    if (missing) warns.push('Requires a card that doesn’t exist');
    // 2) an effect references a stat no longer in POLICY_STATS (old cards reference retired stats).
    var badStats = {};
    eff.forEach(function (f) {
      if (f.p && f.p.stat && POLICY_STATS.indexOf(f.p.stat) < 0) badStats[f.p.stat] = true;
      if (f.p && f.p.np && f.p.np.stat && POLICY_STATS.indexOf(f.p.np.stat) < 0) badStats[f.p.np.stat] = true;
    });
    Object.keys(badStats).forEach(function (s) { warns.push('Effect references unknown stat: ' + s); });
    // 3) dormant, but no OTHER card seeds it via a deck_add effect targeting this card's id.
    if (state.dormant === 'yes') {
      var seeded = POOL.some(function (c) { return c.id !== editingId && defEffects(c.def).some(function (f) { return f.kind === 'deck_add' && f.p && f.p.card === editingId; }); });
      if (!seeded) warns.push('Dormant but nothing activates it');
    }
    // 4) the cost is far (>3) from the suggestion.
    var sug = suggestedCost();
    if (Math.abs((Number(state.cost) || 0) - sug) > 3) warns.push('Cost ' + (state.cost || 0) + ' is far from suggested ' + sug);
    if (warns.length) { el.className = 'lint'; el.innerHTML = warns.map(function (w) { return '<div class="lintline">' + esc(w) + '</div>'; }).join(''); }
    else { el.className = 'lint clean'; el.innerHTML = '<div class="lintline">no issues</div>'; }
  }

  /* ── live data: nations for the Limiter, existing cards for the chains + pool list ── */
  var NATIONS = [];   // {id, name, flag}
  var POOL = [];      // {id, name, def}
  function nationName(id) { var n = NATIONS.find(function (x) { return x.id === id; }); return n ? n.name : ''; }
  function nationFlag(id) { var n = NATIONS.find(function (x) { return x.id === id; }); return (n && n.flag) || ''; }
  function cardName(id) { var c = POOL.find(function (x) { return x.id === id; }); return c ? c.name : id; }

  async function loadNations() {
    try {
      var res = await supabase.from('nations').select('id, name, flag').eq('dormant', false).order('name');
      NATIONS = (res.data || []).map(function (n) { return { id: n.id, name: n.name || n.id, flag: n.flag || '' }; });
    } catch (e) { NATIONS = []; }
    var sel = $('fNation');
    sel.innerHTML = NATIONS.length
      ? NATIONS.map(function (n) { return '<option value="' + esc(n.id) + '">' + esc(n.name) + '</option>'; }).join('')
      : '<option value="">— no nations —</option>';
    if (!state.nation && NATIONS.length) state.nation = NATIONS[0].id;   // sensible default so a nation card is never nation-less
    sel.value = state.nation;
  }

  function fillCardSelect(id, key) {
    var sel = $(id);
    sel.innerHTML = '<option value="">— none —</option>' + POOL.map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (state[key] === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('');
    sel.onchange = function () { state[key] = sel.value; renderPreview(); };
  }

  function renderPool() {
    var el = $('poolList');
    if (!POOL.length) { el.innerHTML = '<div class="poolempty">No cards yet — build one and shuffle it in.</div>'; return; }
    el.innerHTML = POOL.map(function (c) {
      var d = c.def || {};
      var meta = (d.dormant === 'yes' || d.lim === 'dormant' ? '💤 Dormant' : d.lim === 'nation' ? (nationName(d.nation) || 'One nation') : 'All nations') + ' · ' + (d.mech || 'oneoff');
      return '<div class="poolrow"><span class="pn">' + esc(c.name) + '</span><span class="pm">' + esc(meta) + '</span>' +
        '<button class="pedit" data-id="' + esc(c.id) + '">Edit</button>' +
        '<button class="pdel" data-id="' + esc(c.id) + '">Delete</button></div>';
    }).join('');
    el.querySelectorAll('.pedit').forEach(function (b) {
      b.onclick = function () { loadCard(b.dataset.id); };
    });
    el.querySelectorAll('.pdel').forEach(function (b) {
      b.onclick = async function () {
        if (!confirm('Delete this card? It is removed from every deck it was shuffled into.')) return;
        b.disabled = true;
        try {
          var res = await supabase.from('cards').delete().eq('id', b.dataset.id);
          if (res.error) throw res.error;
          await loadPool();
        } catch (e) { b.disabled = false; alert('Could not delete: ' + (e.message || e)); }
      };
    });
  }

  // "Start from…" dropdown — every pool card by name, so an author can clone one into a new card.
  function fillDupSelect() {
    var sel = $('fDup'); if (!sel) return;
    sel.innerHTML = '<option value="">— blank card —</option>' + POOL.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
    }).join('');
  }
  $('fDup').onchange = function () { var id = this.value; this.value = ''; if (id) duplicateCard(id); };

  async function loadPool() {
    try {
      var res = await supabase.from('cards').select('id, definition').order('created_at', { ascending: false });
      POOL = (res.data || []).map(function (r) { return { id: r.id, name: (r.definition && r.definition.name) || 'Untitled card', def: r.definition || {} }; });
    } catch (e) { POOL = []; }
    fillCardSelect('fReqCard', 'reqCard'); fillCardSelect('fAllowCard', 'allowCard'); fillDupSelect(); renderPool();
  }

  // The card definition to persist. The Effects reading switch (+ archetype) is UI over this SAME schema:
  // reading serializes to mech+type+sides — one → generic oneoff (every effect 'both'); two → stance oneoff
  // (effects carry their side); menu → choice (copt[]). We never emit `dside` anymore — a loaded Double
  // Sided card was converted to two-readings and re-saves as oneoff+sides. Only the fields that matter for
  // this card are written, so inactive-mechanic data never rides along as phantom state.
  function buildDefinition() {
    var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
    var mech = state.reading === 'menu' ? 'choice' : 'oneoff';
    var type = state.reading === 'one' ? 'generic' : state.type;
    var d = { name: state.name, cost: state.cost, acts: state.acts, desc: state.desc, type: type, lim: state.lim,
              mech: mech, persistV: state.persistV, dormant: state.dormant, reqCard: state.reqCard, allowCard: state.allowCard,
              handler: state.handler, afterPlay: state.afterPlay };
    if (state.lim === 'nation') d.nation = state.nation;              // only meaningful when nation-limited
    // Stance gates only when a two-readings card is explicitly Stance-gated; otherwise the card needs no stance.
    if (type !== 'generic' && state.stanceReq === 'gated') { d.reqD = state.reqD; d.reqR = state.reqR; }
    if (state.reading === 'menu') d.copt = clone(state.copt);
    else d.fx = clone(state.fx).map(function (f) { return { side: state.reading === 'one' ? 'both' : (f.side || 'both'), kind: f.kind, p: f.p }; });
    return d;
  }

  /* ── save → card_create (new) or card_update (editing). Locked during the call (no double-shuffle).
     "Save & Seed All" saves, then runs the same seed-all-markets action (fills every nation's block). ── */
  var saving = false;
  async function saveCard(seedAfter) {
    if (saving) return;
    var msg = $('ccMsg');
    if (!state.name.trim()) { msg.className = 'savemsg err'; msg.textContent = 'The card needs a name.'; return; }
    if (state.lim === 'nation' && !state.nation) { msg.className = 'savemsg err'; msg.textContent = 'Pick a nation for a Specific-Nation card.'; return; }
    saving = true; renderPreview();
    var btn = seedAfter ? $('ccSaveSeed') : $('ccSave');
    var label = btn.textContent; btn.textContent = editingId ? 'Saving…' : 'Shuffling…'; msg.className = 'savemsg'; msg.textContent = '';
    try {
      var res = editingId
        ? await supabase.rpc('card_update', { p_card: editingId, p_definition: buildDefinition() })
        : await supabase.rpc('card_create', { p_definition: buildDefinition() });
      if (res.error) throw res.error;
      var note = editingId
        ? 'Card updated.'
        : state.lim === 'nation'
          ? 'Shuffled into ' + (nationName(state.nation) || state.nation) + '’s deck.'
          : 'Shuffled into every nation’s deck.';
      if (seedAfter) {
        btn.textContent = 'Seeding…';
        var sres = await supabase.rpc('seed_card_markets');
        if (sres.error) throw sres.error;
        var n = Number(sres.data) || 0;
        note += n > 0 ? ' Drew ' + n + ' card' + (n === 1 ? '' : 's') + ' onto markets.' : ' Markets already full.';
      }
      msg.className = 'savemsg ok'; msg.textContent = note;
      // Refresh the pool list (name/meta may have changed). loadPool leaves `state`/`editingId` alone, so
      // after an edit the editor stays on this card; after a create it's still a fresh unsaved card.
      await loadPool();
    } catch (e) {
      msg.className = 'savemsg err'; msg.textContent = 'Save failed: ' + (e.message || e);
    } finally {
      saving = false; btn.textContent = label; updateSaveMode(); renderPreview();
    }
  }
  $('ccSave').onclick = function () { saveCard(false); };
  $('ccSaveSeed').onclick = function () { saveCard(true); };

  // Reset to a blank card.
  $('ccNew').onclick = function () { newCard(); var msg = $('ccMsg'); msg.className = 'savemsg'; msg.textContent = ''; };

  // first paint — syncForm() reflects the fresh state into every control (the same path load/reset use).
  // NATIONS/POOL aren't loaded yet, so the preview reads them as empty (safe); loadNations/loadPool then
  // fill the dropdowns and the final renderPreview repaints with real data.
  syncForm();
  await loadNations();
  await loadPool();
  renderPreview();
}
