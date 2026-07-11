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
import { esc } from '/util.js';   // shared HTML-escape (one source)
const cap = function (s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); };   // Title-case a word (one source)

// ---- effect vocabulary (Phase 3 interprets these; the creator only authors them) ----
const STATS = ['Budget Balance', 'Growth', 'Bureaucracy', 'Tax Burden', 'Public Debt', 'Interest Rates', 'Crime', 'Immigration', 'Extremism', 'Birth Rates', 'Unemployment', 'Poverty', 'Wages', 'Innovation', 'Infrastructure', 'Prosperity', 'Press Freedom', 'Social Integration', 'Health', 'Education', 'Pension Quality', 'Rule of Law', 'Standard of Living', 'Housing Affordability', 'Equity Between Generations', 'Armed Forces Funding', 'Military Research', 'Cybersecurity', 'CO2 Emissions', 'Energy Prices', 'Environment', 'National Pride', 'Civil Liberties', 'Minority Rights', 'Corruption', 'Religious Influence'];
// The real cabinet portfolios (server source: _ministries(), schema/138) — so a card's Decision
// Handler routes to an actual minister.
const MINISTRIES = ['Defence', 'Treasury', 'Interior', 'Foreign Affairs', 'Trade', 'Labour', 'Justice', 'Health', 'Education', 'Energy', 'Economic Development'];
// The nation's on-hand stockpile keys (server source: nations.on_hand, schema/113). Stored lowercase.
const RESOURCES = ['food', 'goods', 'services', 'military'];
const KINDS = {
  cond:       { label: 'IF [stat] is above/below X, then…', nested: true },
  party_gain: { label: 'Targeted party gains X approval' },
  party_lose: { label: 'Targeted party loses X approval' },
  coal_up:    { label: 'Coalition health +1' },
  coal_down:  { label: 'Coalition health −1' },
  stat_up:    { label: 'Stat goes up by X' },
  stat_down:  { label: 'Stat goes down by X' },
  hex_pop:    { label: 'Swing X approval at a chosen hex (you +X, or a rival −X)' },
  res_add:    { label: 'Add X [resource] to on-hand' },
  res_remove: { label: 'Remove X [resource] from on-hand' },
  appoint:    { label: 'HoG must appoint you [Ministry], or…', nested: true },
  hex_el:     { label: 'Carry out an election in a chosen hex' },
  nat_el:     { label: 'Carry out national election' },
  no_conf:    { label: 'Put forth motion of no confidence' },
  mob_add:    { label: 'Add Armed Mob to Hex X' },
  mob_rem:    { label: 'Remove Armed Mob from Hex X' },
  mil_add:    { label: 'Add Militia to Hex X' },
  mil_rem:    { label: 'Remove Militia from Hex X' },
  event:      { label: 'Event Decision (write text, pick effect)', nested: true }
};
const SIMPLE = ['party_gain', 'party_lose', 'coal_up', 'coal_down', 'stat_up', 'stat_down', 'no_conf', 'nat_el'];

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
.cc .cardc{background:var(--surface);border:1px solid var(--line2);border-radius:13px;overflow:hidden}
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
.cc .poolrow .pdel{margin-left:auto;border:1px solid var(--line2);background:var(--field);color:var(--soft);border-radius:7px;padding:5px 9px;font-family:'Space Mono',monospace;font-size:9px;font-weight:700;cursor:pointer}
.cc .poolrow .pdel:hover{color:var(--red);border-color:color-mix(in srgb,var(--red) 45%,transparent)}
.cc .poolempty{color:var(--soft);font-size:12px;padding:8px 0}
`;

const TEMPLATE = `
<div class="form">
  <div class="sect">Identity</div>
  <div class="frow single">
    <div><label>Card Name</label><input type="text" id="fName" maxlength="40"></div>
  </div>
  <div class="frow">
    <div><label>Influence Cost (base auction value)</label><input type="number" id="fCost" min="0" max="20" style="width:100%"></div>
    <div><label>Number of Actions (1–6 — granted when played)</label><input type="number" id="fActs" min="1" max="6" style="width:100%"></div>
  </div>
  <div class="frow single">
    <div><label>Description (flavor — shown on card)</label><textarea id="fDesc"></textarea></div>
  </div>

  <div class="sect">Type &amp; Limiter</div>
  <div class="frow">
    <div>
      <label>Card Type — sets the stance axis</label>
      <div class="seg" id="segType">
        <button data-v="generic" class="c-gen">Generic</button>
        <button data-v="dr" class="c-dr">Democratic / Revolutionary</button>
        <button data-v="ar" class="c-ar">Autocratic / Reform</button>
      </div>
    </div>
    <div>
      <label>Limiter — which decks it enters</label>
      <div class="seg" id="segLim">
        <button data-v="all">All Nations</button>
        <button data-v="nation" class="c-nat">Specific Nation</button>
      </div>
      <select id="fNation" style="margin-top:8px;display:none"></select>
    </div>
  </div>

  <div class="sect">Mechanic</div>
  <div class="seg" id="segMech">
    <button data-v="oneoff">One-Off Effect</button>
    <button data-v="double">Double Sided</button>
    <button data-v="choice">Government Choice</button>
  </div>

  <div class="sect">Decision &amp; Lifecycle</div>
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

  <div class="sect">Persistence &amp; Card Chains</div>
  <div class="frow single">
    <div>
      <label>Persistent — stays in play as a national modifier</label>
      <div class="seg" id="segPersist">
        <button data-v="no">No — resolves &amp; discards</button>
        <button data-v="yes" class="c-nat">∞ Persistent</button>
      </div>
    </div>
  </div>
  <div class="frow">
    <div><label>Requires play of</label><select id="fReqCard"></select></div>
    <div><label>Allows play of</label><select id="fAllowCard"></select></div>
  </div>

  <div class="sect" style="margin-top:24px">Effects <span class="cnt" id="fxCount"></span></div>
  <div id="fxList"></div>
  <button class="addfx" id="addFx">+ Add Effect</button>

  <div class="sect">Purchase Requirement <span class="cnt">a stance gate is optional — off by default</span></div>
  <div class="seg" id="segStance" style="margin-bottom:12px">
    <button data-v="none">No stance required</button>
    <button data-v="gated">Stance-gated</button>
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

  <div class="sect">Card Pool</div>
  <button class="seedbtn" id="ccSeed" title="Fill every nation's auction block up to its target by drawing from the deck">↻ Seed all markets</button>
  <div class="savemsg" id="ccSeedMsg"></div>
  <div class="pool" id="poolList"><div class="poolempty">Loading…</div></div>
</div>

<div class="prevcol">
  <div class="prevlabel">Live Preview</div>
  <div class="cardc">
    <div class="stripe" id="pStripe"></div>
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
  <button class="savebtn" id="ccSave">Save to Card Pool</button>
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

  var state = {
    name: '', cost: 4, acts: 2, desc: '',
    type: 'dr', lim: 'all', nation: '', mech: 'oneoff',
    stanceReq: 'none', reqD: 2, reqR: 2,   // stanceReq 'none' = anyone can buy/play; 'gated' = reqD/reqR levels apply
    fx: [
      { side: 'd', kind: 'no_conf', p: {} },
      { side: 'r', kind: 'stat_down', p: { stat: 'Growth', x: 4 } },
      { side: 'both', kind: 'cond', p: { stat: 'Crime', dir: 'above', x: 50, nk: 'party_lose', np: { x: 2 } } }
    ],
    copt: [
      { txt: '', fx: [{ kind: 'stat_up', p: { stat: 'Immigration', x: 8 } }] },
      { txt: '', fx: [{ kind: 'stat_down', p: { stat: 'Minority Rights', x: 4 } }] }
    ],
    dside: {
      d: { txt: '', fx: [{ kind: 'no_conf', p: {} }] },
      r: { txt: '', fx: [{ kind: 'stat_down', p: { stat: 'Growth', x: 4 } }] }
    },
    persistV: 'no', reqCard: '', allowCard: '',
    handler: 'player',      // who resolves the card's decision: 'player' (holder decides) or a ministry name
    afterPlay: 'discard'    // 'discard' (permanent) or 'shuffle' (back into the deck)
  };
  // reflect the seeded defaults into the form fields
  $('fName').value = state.name; $('fCost').value = state.cost; $('fActs').value = state.acts; $('fDesc').value = state.desc;

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
  wireSeg('segType', 'type', function () { syncAxis(); renderFx(); });
  wireSeg('segLim', 'lim', function () { $('fNation').style.display = state.lim === 'nation' ? 'block' : 'none'; });
  wireSeg('segMech', 'mech', function () { renderFx(); });
  wireSeg('segStance', 'stanceReq', syncStance);
  wireSeg('reqD', 'reqD'); wireSeg('reqR', 'reqR');
  wireSeg('segPersist', 'persistV');
  wireSeg('segAfter', 'afterPlay');
  // Decision Handler dropdown: "Player decides" (no ministry) + each ministry.
  $('fHandler').innerHTML = '<option value="player">Player who plays it decides</option>' +
    MINISTRIES.map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + ' Minister handles it</option>'; }).join('');
  $('fHandler').value = state.handler;
  $('fHandler').onchange = function () { state.handler = this.value; renderPreview(); };
  // initial "on" states
  markSeg('segType', state.type); markSeg('segLim', state.lim); markSeg('segMech', state.mech);
  markSeg('segPersist', state.persistV); markSeg('reqD', state.reqD); markSeg('reqR', state.reqR);
  markSeg('segStance', state.stanceReq); markSeg('segAfter', state.afterPlay);
  // Stance gate is optional: the D/R level pickers only matter when 'Stance-gated' is chosen. (No
  // renderPreview here — wireSeg calls it after this callback, and the initial call below predates the
  // nations load, so rendering here would read NATIONS before it exists.)
  function syncStance() { $('reqGrid').style.display = state.stanceReq === 'gated' ? '' : 'none'; }
  syncStance();

  ['fName', 'fCost', 'fActs', 'fDesc'].forEach(function (id) {
    $(id).oninput = function (e) {
      if (id === 'fName') state.name = e.target.value;
      if (id === 'fCost') state.cost = +e.target.value;
      if (id === 'fActs') state.acts = Math.max(1, Math.min(6, +e.target.value || 1));
      if (id === 'fDesc') state.desc = e.target.value;
      renderPreview();
    };
  });
  $('fNation').onchange = function () { state.nation = this.value; renderPreview(); };

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
    function statSel(v, field) { return '<select data-i="' + i + '" data-f="' + field + '">' + STATS.map(function (s) { return '<option' + (s === v ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>'; }
    function num(v, field) { return '<input type="number" value="' + (v || 0) + '" data-i="' + i + '" data-f="' + field + '" min="0" max="99">'; }
    if (f.kind === 'stat_up' || f.kind === 'stat_down') h = '<span class="lbl">stat</span>' + statSel(f.p.stat, 'stat') + '<span class="lbl">by</span>' + num(f.p.x, 'x');
    if (f.kind === 'party_gain' || f.kind === 'party_lose') h = '<span class="lbl">approval</span>' + num(f.p.x, 'x') + '<span class="lbl">target chosen on play</span>';
    if (f.kind === 'hex_pop') h = '<span class="lbl">approval</span>' + num(f.p.x, 'x') + '<span class="lbl">hex &amp; side chosen on play</span>';
    if (f.kind === 'res_add' || f.kind === 'res_remove') h = '<span class="lbl">' + (f.kind === 'res_add' ? 'add' : 'remove') + '</span>' + num(f.p.x, 'x') +
      '<select data-i="' + i + '" data-f="res">' + RESOURCES.map(function (rz) { return '<option value="' + rz + '"' + (rz === f.p.res ? ' selected' : '') + '>' + cap(rz) + '</option>'; }).join('') + '</select><span class="lbl">on hand</span>';
    if (f.kind === 'hex_el') h = '<span class="lbl">hex chosen on play · 12-tick cooldown</span>';
    if (f.kind === 'mob_add' || f.kind === 'mob_rem' || f.kind === 'mil_add' || f.kind === 'mil_rem')
      h = '<span class="lbl">hex</span><input type="text" value="' + esc(f.p.hex || '16,-5') + '" data-i="' + i + '" data-f="hex" style="max-width:90px"><span class="lbl">' + ((f.kind === 'mob_add' || f.kind === 'mob_rem') ? '⚠ armed mob — nobody’s soldiers' : '⚑ militia — belongs to a party') + '</span>';
    if (f.kind === 'cond') h = '<span class="lbl">if</span>' + statSel(f.p.stat, 'stat') +
      '<select data-i="' + i + '" data-f="dir"><option' + (f.p.dir === 'above' ? ' selected' : '') + '>above</option><option' + (f.p.dir === 'below' ? ' selected' : '') + '>below</option></select>' + num(f.p.x, 'x');
    if (f.kind === 'appoint') h = '<span class="lbl">ministry</span><select data-i="' + i + '" data-f="min">' + MINISTRIES.map(function (m) { return '<option' + (m === f.p.min ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select>';
    if (f.kind === 'event') h = '<input type="text" placeholder="Event decision text…" value="' + esc(f.p.txt || '') + '" data-i="' + i + '" data-f="txt">';
    if (KINDS[f.kind].nested) {
      h += '<div class="nest"><span class="lbl">' + (f.kind === 'appoint' ? 'or else →' : 'then →') + '</span>' +
        '<select data-i="' + i + '" data-f="nk">' + SIMPLE.map(function (k) { return '<option value="' + k + '"' + (k === f.p.nk ? ' selected' : '') + '>' + KINDS[k].label + '</option>'; }).join('') + '</select>';
      var nk = f.p.nk || 'party_lose';
      if (nk === 'stat_up' || nk === 'stat_down') h += '<select data-i="' + i + '" data-f="nstat">' + STATS.map(function (s) { return '<option' + (s === (f.p.np && f.p.np.stat) ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>';
      if (nk !== 'no_conf' && nk !== 'nat_el' && nk !== 'coal_up' && nk !== 'coal_down') h += '<input type="number" value="' + ((f.p.np && f.p.np.x) || 2) + '" data-i="' + i + '" data-f="nx" min="0" max="99">';
      h += '</div>';
    }
    return h;
  }
  function activeArr() { return state.mech === 'choice' ? state.copt : state.fx; }
  // Decode a double-sided effect's data-i ('dd0'…/'dr0'…) → { s: the side, i: effect index }, else null.
  // One source for the encoding the side rows render and the change/delete handlers read.
  function sideRef(di) { return /^d[dr]\d+$/.test(di) ? { s: state.dside[di.charAt(1) === 'd' ? 'd' : 'r'], i: +di.slice(2) } : null; }
  // Decode a Government-Choice option effect's data-i ('o<opt>_<eff>') → { o: the option, j: effect index }.
  function optRef(di) { var m = /^o(\d+)_(\d+)$/.exec(di); return m ? { o: state.copt[+m[1]], j: +m[2] } : null; }
  function kindOpts(f) { return Object.keys(KINDS).map(function (k) { return '<option value="' + k + '"' + (k === f.kind ? ' selected' : '') + '>' + KINDS[k].label + '</option>'; }).join(''); }

  function renderFx() {
    var wrap = $('fxList'); var ax = axisLabels();
    if (state.mech === 'choice') {
      var LET = ['A', 'B', 'C', 'D'], CLS = ['a', 'b', 'c', 'd'];
      wrap.innerHTML = state.copt.map(function (o, i) {
        var del = state.copt.length > 2 ? '<button class="del" data-i="' + i + '" style="float:right;margin-top:-2px">✕</button>' : '';
        var effRows = o.fx.map(function (f, j) {
          var ed = o.fx.length > 1 ? '<button class="del" data-i="o' + i + '_' + j + '">✕</button>' : '';
          return '<div class="fx-top" style="margin-top:9px"><span class="n">' + (j + 1) + '</span>' +
            '<select data-i="o' + i + '_' + j + '" data-f="kind">' + kindOpts(f) + '</select>' + ed + '</div>' +
            '<div class="fx-params">' + fxParamsHTML(f, 'o' + i + '_' + j) + '</div>';
        }).join('');
        var add = o.fx.length < 3 ? '<button class="addfx optadd" data-add="' + i + '" style="margin-top:9px">+ Add effect (' + o.fx.length + '/3)</button>' : '';
        return '<div class="opt ' + CLS[i] + '">' + del +
          '<div class="opt-h">Option ' + LET[i] + ' — the government may:</div>' +
          '<input type="text" value="' + esc(o.txt || '') + '" data-i="' + i + '" data-f="txt" placeholder="What this choice looks like in the news…">' +
          effRows + add + '</div>';
      }).join('');
      $('fxCount').textContent = state.copt.length + ' / 4 options · up to 3 effects each';
      var ab = $('addFx'); ab.style.display = 'block'; ab.textContent = '+ Add Option'; ab.disabled = state.copt.length >= 4;
    } else if (state.mech === 'double') {
      function sideBlock(key, ref, cls, side, lvl) {
        var s = state.dside[key];
        var gate = state.stanceReq === 'gated' ? ' (' + side.pre + lvl + '+)' : '';
        var effRows = s.fx.map(function (f, i) {
          var del = s.fx.length > 1 ? '<button class="del" data-i="' + ref + i + '">✕</button>' : '';
          return '<div class="fx-top" style="margin-top:9px"><span class="n">' + (i + 1) + '</span>' +
            '<select data-i="' + ref + i + '" data-f="kind">' + kindOpts(f) + '</select>' + del + '</div>' +
            '<div class="fx-params">' + fxParamsHTML(f, ref + i) + '</div>';
        }).join('');
        var add = s.fx.length < 3 ? '<button class="addfx sideadd" data-add="' + key + '" style="margin-top:9px">+ Add effect (' + s.fx.length + '/3)</button>' : '';
        return '<div class="opt ' + cls + '">' +
          '<div class="opt-h">' + side.ic + ' ' + side.name + ' side' + gate + ' — its own name + up to 3 effects:</div>' +
          '<input type="text" value="' + esc(s.txt || '') + '" data-i="' + ref + '" data-f="txt" placeholder="Name this side of the card…">' +
          effRows + add + '</div>';
      }
      wrap.innerHTML = sideBlock('d', 'dd', 'dside-d', ax.d, state.reqD) + sideBlock('r', 'dr', 'dside-r', ax.r, state.reqR);
      $('fxCount').textContent = 'two sides · up to 3 effects each';
      $('addFx').style.display = 'none';
    } else {
      wrap.innerHTML = state.fx.map(function (f, i) {
        var sideBtns = state.type === 'generic' ? '' :
          '<div class="side-seg">' +
          '<button data-i="' + i + '" data-s="both" class="' + (f.side === 'both' ? 'on-both' : '') + '">Both</button>' +
          '<button data-i="' + i + '" data-s="d" class="' + (f.side === 'd' ? 'on-d' : '') + '">' + ax.d.pre + '</button>' +
          '<button data-i="' + i + '" data-s="r" class="' + (f.side === 'r' ? 'on-r' : '') + '">' + ax.r.pre + '</button></div>';
        return '<div class="fx-row"><div class="fx-top"><span class="n">' + (i + 1) + '</span>' +
          '<select data-i="' + i + '" data-f="kind">' + kindOpts(f) + '</select>' + sideBtns +
          '<button class="del" data-i="' + i + '">✕</button></div>' +
          '<div class="fx-params">' + fxParamsHTML(f, i) + '</div></div>';
      }).join('');
      $('fxCount').textContent = state.fx.length + ' / 5';
      var ab2 = $('addFx'); ab2.style.display = 'block'; ab2.textContent = '+ Add Effect'; ab2.disabled = state.fx.length >= 5;
    }

    wrap.querySelectorAll('select,input').forEach(function (el) {
      el.onchange = el.oninput = function () {
        var fd = el.dataset.f, v = el.value, di = el.dataset.i;
        // Double-sided side NAME (side-level, not an effect).
        if (di === 'dd' || di === 'dr') { state.dside[di === 'dd' ? 'd' : 'r'].txt = v; renderPreview(); return; }
        // Single-effect owners: a double-side effect ('dd0'…/'dr0'…) or a choice-option effect ('o0_0'…).
        var sr = sideRef(di), or = optRef(di);
        var special = sr ? sr.s.fx[sr.i] : (or ? or.o.fx[or.j] : null);
        if (special) {
          var r = special;
          if (fd === 'kind') { r.kind = v; if (v !== 'none') r.p = v === 'cond' ? { stat: 'Crime', dir: 'above', x: 50, nk: 'party_gain', np: { x: 2 } } : v === 'appoint' ? { min: 'Interior', nk: 'stat_down', np: { stat: 'Growth', x: 3 } } : (v === 'res_add' || v === 'res_remove') ? { res: 'food', x: 2 } : { stat: STATS[1], x: 2 }; renderFx(); }
          else if (fd === 'nk') { r.p.nk = v; r.p.np = r.p.np || {}; renderFx(); }
          else if (fd === 'nstat') { r.p.np = r.p.np || {}; r.p.np.stat = v; }
          else if (fd === 'nx') { r.p.np = r.p.np || {}; r.p.np.x = +v; }
          else r.p[fd] = (fd === 'x') ? +v : v;
          renderPreview(); return;
        }
        var f = activeArr()[+el.dataset.i];
        if (fd === 'txt' && state.mech === 'choice') { f.txt = v; renderPreview(); return; }
        if (fd === 'kind') { f.kind = v; f.p = v === 'cond' ? { stat: 'Crime', dir: 'above', x: 50, nk: 'party_lose', np: { x: 2 } } : v === 'appoint' ? { min: 'Interior', nk: 'stat_down', np: { stat: 'Growth', x: 3 } } : (v === 'res_add' || v === 'res_remove') ? { res: 'food', x: 2 } : { stat: STATS[1], x: 3 }; renderFx(); }
        else if (fd === 'nk') { f.p.nk = v; f.p.np = f.p.np || {}; renderFx(); }
        else if (fd === 'nstat') { f.p.np = f.p.np || {}; f.p.np.stat = v; }
        else if (fd === 'nx') { f.p.np = f.p.np || {}; f.p.np.x = +v; }
        else f.p[fd] = (fd === 'x') ? +v : v;
        renderPreview();
      };
    });
    wrap.querySelectorAll('.side-seg button').forEach(function (b) {
      b.onclick = function () { state.fx[+b.dataset.i].side = b.dataset.s; renderFx(); renderPreview(); };
    });
    wrap.querySelectorAll('.del').forEach(function (b) {
      b.onclick = function () {
        var di = b.dataset.i, sr = sideRef(di), or = optRef(di);
        if (sr) sr.s.fx.splice(sr.i, 1);
        else if (or) or.o.fx.splice(or.j, 1);
        else activeArr().splice(+di, 1);
        renderFx(); renderPreview();
      };
    });
    wrap.querySelectorAll('.sideadd').forEach(function (b) {
      b.onclick = function () { var s = state.dside[b.dataset.add]; if (s.fx.length < 3) { s.fx.push({ kind: 'stat_up', p: { stat: 'Growth', x: 3 } }); renderFx(); renderPreview(); } };
    });
    wrap.querySelectorAll('.optadd').forEach(function (b) {
      b.onclick = function () { var o = state.copt[+b.dataset.add]; if (o.fx.length < 3) { o.fx.push({ kind: 'stat_up', p: { stat: 'Growth', x: 3 } }); renderFx(); renderPreview(); } };
    });
  }
  $('addFx').onclick = function () {
    if (state.mech === 'choice') { if (state.copt.length < 4) { state.copt.push({ txt: '', fx: [{ kind: 'stat_up', p: { stat: 'Growth', x: 3 } }] }); renderFx(); renderPreview(); } }
    else if (state.mech === 'oneoff' && state.fx.length < 5) { state.fx.push({ side: 'both', kind: 'stat_up', p: { stat: 'Growth', x: 3 } }); renderFx(); renderPreview(); }
  };

  /* ── preview ── */
  function fxText(kind, p) {
    switch (kind) {
      case 'party_gain': return 'Targeted party <b>gains ' + (p.x || 0) + ' approval</b>';
      case 'party_lose': return 'Targeted party <b>loses ' + (p.x || 0) + ' approval</b>';
      case 'coal_up': return 'Coalition health <b>+1</b>';
      case 'coal_down': return 'Coalition health <b>−1</b>';
      case 'stat_up': return '<b>' + esc(p.stat || '?') + ' +' + (p.x || 0) + '</b>';
      case 'stat_down': return '<b>' + esc(p.stat || '?') + ' −' + (p.x || 0) + '</b>';
      case 'hex_pop': return 'At a chosen hex: <b>you +' + (p.x || 0) + '</b>, or <b>a rival −' + (p.x || 0) + '</b> approval';
      case 'res_add': return 'Add <b>' + (p.x || 0) + ' ' + esc(cap(p.res || 'food')) + '</b> to on-hand';
      case 'res_remove': return 'Remove <b>' + (p.x || 0) + ' ' + esc(cap(p.res || 'food')) + '</b> from on-hand';
      case 'no_conf': return 'Put forth a <b>motion of no confidence</b>';
      case 'nat_el': return 'Carry out a <b>national election</b>';
      case 'hex_el': return 'Carry out an <b>election in a chosen hex</b> (reapportions its seats)';
      case 'mob_add': return 'An <b>Armed Mob</b> rises in <b>hex ' + esc(p.hex || '?') + '</b>';
      case 'mob_rem': return 'The <b>Armed Mob</b> in <b>hex ' + esc(p.hex || '?') + '</b> disperses';
      case 'mil_add': return 'Deploy a <b>Militia</b> to <b>hex ' + esc(p.hex || '?') + '</b>';
      case 'mil_rem': return 'The <b>Militia</b> in <b>hex ' + esc(p.hex || '?') + '</b> stands down';
      case 'appoint': return 'Head of Government must <b>appoint you to ' + esc(p.min || '?') + '</b>, or: ' + fxText(p.nk || 'party_lose', p.np || {});
      case 'cond': return 'IF <b>' + esc(p.stat || '?') + '</b> is ' + (p.dir || 'above') + ' <b>' + (p.x || 0) + '</b>, then: ' + fxText(p.nk || 'party_lose', p.np || {});
      case 'event': return '<b>Decision:</b> “' + esc(p.txt || '…') + '” → ' + fxText(p.nk || 'party_lose', p.np || {});
    }
    return '';
  }
  function renderPreview() {
    var ax = axisLabels();
    $('pName').textContent = state.name || 'Untitled Card';
    $('pDesc').textContent = state.desc || '';
    var stripe = state.type === 'generic' ? 'var(--gen)' : state.type === 'ar' ? 'var(--auto)' : 'var(--rev)';
    $('pStripe').style.background = state.lim === 'nation' ? 'var(--nat)' : stripe;
    var natName = nationName(state.nation);
    var kindTxt = state.lim === 'nation' ? 'Nation · ' + (natName || '—') : state.type === 'generic' ? 'Generic' : 'Stance · ' + ax.d.name + ' / ' + ax.r.name;
    var kindCol = state.lim === 'nation' ? 'var(--nat)' : state.type === 'generic' ? 'var(--gen)' : state.type === 'ar' ? 'var(--auto)' : 'var(--rev)';
    var pk = $('pKind'); pk.textContent = kindTxt; pk.style.color = kindCol;

    var reqs = '<span class="rq cost">⚡ ' + (state.cost || 0) + '</span>';
    reqs += '<span class="rq acts">▶ ' + (state.acts || 1) + ' action' + ((state.acts || 1) === 1 ? '' : 's') + '</span>';
    if (state.persistV === 'yes') reqs += '<span class="rq pers">∞ Persistent</span>';
    if (state.afterPlay === 'shuffle') reqs += '<span class="rq recyc">↻ Reshuffles</span>';
    var gated = state.type !== 'generic' && state.stanceReq === 'gated';
    if (gated) reqs += '<span class="rq d">' + ax.d.ic + ' ' + ax.d.pre + state.reqD + '+</span><span class="rq r">' + ax.r.ic + ' ' + ax.r.pre + state.reqR + '+</span>';
    else if (state.type !== 'generic') reqs += '<span class="rq">no stance req</span>';
    $('pReqs').innerHTML = reqs;

    var html = '';
    if (state.reqCard) html += '<div class="c-reqline">⛓ Requires play of <b>' + esc(cardName(state.reqCard)) + '</b></div>';
    if (state.allowCard) html += '<div class="c-reqline">🔓 Allows play of <b>' + esc(cardName(state.allowCard)) + '</b></div>';
    if (state.mech === 'choice') {
      var LET = ['A', 'B', 'C', 'D'], GCL = ['ga', 'gb2', 'gc', 'gd2'];
      html += '<div class="choice-banner">⚖ Holder plays → government must choose</div>';
      state.copt.forEach(function (o, i) {
        html += '<div class="fxgroup ' + GCL[i] + '"><div class="gt">' + LET[i] + ' · ' + esc(o.txt || 'untitled option') + '</div>' +
          o.fx.map(function (f) { return '<div class="fxline">' + fxText(f.kind, f.p) + '</div>'; }).join('') + '</div>';
      });
    } else if (state.mech === 'double') {
      html += '<div class="fxgroup gd"><div class="gt">' + ax.d.ic + ' ' + (gated ? ax.d.pre + state.reqD + '+ · ' : '') + '“' + esc(state.dside.d.txt || 'unnamed side') + '”</div>' + state.dside.d.fx.map(function (f) { return '<div class="fxline">' + fxText(f.kind, f.p) + '</div>'; }).join('') + '</div>';
      html += '<div class="fxgroup gr"><div class="gt">' + ax.r.ic + ' ' + (gated ? ax.r.pre + state.reqR + '+ · ' : '') + '“' + esc(state.dside.r.txt || 'unnamed side') + '”</div>' + state.dside.r.fx.map(function (f) { return '<div class="fxline">' + fxText(f.kind, f.p) + '</div>'; }).join('') + '</div>';
    } else {
      var groups = { d: [], r: [], both: [] };
      state.fx.forEach(function (f) { groups[state.type === 'generic' ? 'both' : f.side].push(fxText(f.kind, f.p)); });
      if (groups.d.length) html += '<div class="fxgroup gd"><div class="gt">' + ax.d.ic + ' ' + ax.d.name + ' play' + (gated ? ' (' + ax.d.pre + state.reqD + '+)' : '') + '</div>' + groups.d.map(function (t) { return '<div class="fxline">' + t + '</div>'; }).join('') + '</div>';
      if (groups.r.length) html += '<div class="fxgroup gr"><div class="gt">' + ax.r.ic + ' ' + ax.r.name + ' play' + (gated ? ' (' + ax.r.pre + state.reqR + '+)' : '') + '</div>' + groups.r.map(function (t) { return '<div class="fxline">' + t + '</div>'; }).join('') + '</div>';
      if (groups.both.length) html += '<div class="fxgroup gb"><div class="gt">◈ Either play</div>' + groups.both.map(function (t) { return '<div class="fxline">' + t + '</div>'; }).join('') + '</div>';
    }
    $('pFx').innerHTML = html || '<div class="fxline" style="color:var(--soft)">no effects yet</div>';

    var arr = state.mech === 'choice' ? state.copt.reduce(function (a, o) { return a.concat(o.fx); }, [])
      : state.mech === 'double' ? state.dside.d.fx.concat(state.dside.r.fx) : state.fx;
    var mechLabel = state.mech === 'choice' ? 'Gov Choice' : state.mech === 'double' ? 'Double Sided' : 'One-Off';
    var tags = ['<span class="tag">' + mechLabel + '</span>'];
    if (arr.some(function (f) { return f.kind === 'party_gain' || f.kind === 'party_lose'; })) tags.push('<span class="tag" style="color:var(--auto);border-color:color-mix(in srgb,var(--auto) 45%,transparent)">Target Party</span>');
    if (state.mech === 'choice' || arr.some(function (f) { return ['no_conf', 'nat_el', 'hex_el'].indexOf(f.kind) >= 0; })) tags.push('<span class="tag" style="color:var(--nat);border-color:color-mix(in srgb,var(--nat) 45%,transparent)">Force Gov</span>');
    if (arr.some(function (f) { return ['mob_add', 'mob_rem', 'mil_add', 'mil_rem'].indexOf(f.kind) >= 0; })) tags.push('<span class="tag" style="color:var(--rev);border-color:color-mix(in srgb,var(--rev) 45%,transparent)">Units on Map</span>');
    $('pTags').innerHTML = tags.join('');

    var v = [];
    if (state.mech === 'choice') {
      v.push(state.copt.length >= 2 && state.copt.length <= 4 ? ['ok', 'Options: ' + state.copt.length + ' / 4'] : ['warn', 'Choice cards need 2–4 options']);
      v.push(state.copt.every(function (f) { return (f.txt || '').trim().length > 0; }) ? ['ok', 'All options titled'] : ['warn', 'Every option needs text — the government reads these aloud']);
      var sigs = state.copt.map(function (o) { return JSON.stringify(o.fx); });
      v.push(new Set(sigs).size === sigs.length ? ['ok', 'Options differ — a real dilemma'] : ['warn', 'Two options do the same thing — no dilemma, no card']);
    } else if (state.mech === 'double') {
      var dn = (state.dside.d.txt || '').trim(), rn = (state.dside.r.txt || '').trim();
      v.push(dn && rn ? ['ok', 'Both sides named'] : ['warn', 'Each side needs its own name — it’s what the news prints']);
      v.push(state.type === 'generic' ? ['warn', 'Double Sided needs a stance axis — switch Type off Generic']
        : state.stanceReq === 'gated' ? ['ok', 'Sides gate at ' + ax.d.pre + state.reqD + '+ / ' + ax.r.pre + state.reqR + '+']
        : ['ok', 'No stance required — either side is playable by anyone']);
    } else {
      v.push(state.fx.length <= 5 ? ['ok', 'Effects: ' + state.fx.length + ' / 5'] : ['warn', 'Too many effects']);
      if (state.type !== 'generic') {
        var hasD = state.fx.some(function (f) { return f.side === 'd' || f.side === 'both'; });
        var hasR = state.fx.some(function (f) { return f.side === 'r' || f.side === 'both'; });
        v.push(hasD && hasR ? ['ok', 'Both stances have a playable side'] : ['warn', 'One side has no effect — half the buyers won’t want this card']);
      }
    }
    if (state.persistV === 'yes') v.push(['ok', '∞ Persistent — joins the national modifier board when played']);
    v.push(state.handler === 'player'
      ? ['ok', 'The player who plays it decides — no ministry gate']
      : ['ok', esc(state.handler) + ' Minister must resolve the decision']);
    v.push(state.afterPlay === 'shuffle'
      ? ['ok', '↻ Shuffles back into the deck after it resolves']
      : ['ok', 'Discarded for good after it resolves']);
    if (state.reqCard) v.push(['ok', 'Locked until “' + esc(cardName(state.reqCard)) + '” has been played']);
    if (state.allowCard) v.push(['ok', 'Playing this unlocks “' + esc(cardName(state.allowCard)) + '”']);
    if (state.reqCard && state.reqCard === state.allowCard) v.push(['warn', 'Requires and allows the same card — circular chain']);
    v.push(state.name ? ['ok', 'Named'] : ['warn', 'Card needs a name']);
    if (state.lim === 'nation') v.push(state.nation ? ['ok', 'Enters ' + esc(nationName(state.nation) || state.nation) + '’s deck only'] : ['warn', 'Pick a nation for a Specific-Nation card']);
    $('pValid').innerHTML = v.map(function (x) { return '<div class="vline ' + x[0] + '">' + x[1] + '</div>'; }).join('');

    // Save is blocked while any hard requirement is unmet (a name, and a nation when nation-limited).
    var blocked = !state.name.trim() || (state.lim === 'nation' && !state.nation);
    $('ccSave').disabled = blocked || saving;
  }

  /* ── live data: nations for the Limiter, existing cards for the chains + pool list ── */
  var NATIONS = [];   // {id, name}
  var POOL = [];      // {id, name, def}
  function nationName(id) { var n = NATIONS.find(function (x) { return x.id === id; }); return n ? n.name : ''; }
  function cardName(id) { var c = POOL.find(function (x) { return x.id === id; }); return c ? c.name : id; }

  async function loadNations() {
    try {
      var res = await supabase.from('nations').select('id, name').eq('dormant', false).order('name');
      NATIONS = (res.data || []).map(function (n) { return { id: n.id, name: n.name || n.id }; });
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
      var meta = (d.lim === 'nation' ? (nationName(d.nation) || 'One nation') : 'All nations') + ' · ' + (d.mech || 'oneoff');
      return '<div class="poolrow"><span class="pn">' + esc(c.name) + '</span><span class="pm">' + esc(meta) + '</span>' +
        '<button class="pdel" data-id="' + esc(c.id) + '">Delete</button></div>';
    }).join('');
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

  async function loadPool() {
    try {
      var res = await supabase.from('cards').select('id, definition').order('created_at', { ascending: false });
      POOL = (res.data || []).map(function (r) { return { id: r.id, name: (r.definition && r.definition.name) || 'Untitled card', def: r.definition || {} }; });
    } catch (e) { POOL = []; }
    fillCardSelect('fReqCard', 'reqCard'); fillCardSelect('fAllowCard', 'allowCard'); renderPool();
  }

  // The card definition to persist — ONLY the fields that matter for this card, so an inactive
  // mechanic's data (or a nation on an All-Nations card) never rides along as phantom state.
  // card_create reads `lim`/`nation`; Phase 3 reads `mech` + the matching effect field.
  function buildDefinition() {
    var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
    var d = { name: state.name, cost: state.cost, acts: state.acts, desc: state.desc, type: state.type, lim: state.lim,
              mech: state.mech, persistV: state.persistV, reqCard: state.reqCard, allowCard: state.allowCard,
              handler: state.handler, afterPlay: state.afterPlay };
    if (state.lim === 'nation') d.nation = state.nation;              // only meaningful when nation-limited
    // Stance gates only when a stance card is explicitly Stance-gated; otherwise the card needs no stance.
    if (state.type !== 'generic' && state.stanceReq === 'gated') { d.reqD = state.reqD; d.reqR = state.reqR; }
    if (state.mech === 'choice') { d.copt = clone(state.copt); }
    else if (state.mech === 'double') d.dside = clone(state.dside);
    else d.fx = clone(state.fx);
    return d;
  }

  /* ── save → card_create (inserts + shuffles). Locked during the call (no double-shuffle). ── */
  var saving = false;
  $('ccSave').onclick = async function () {
    if (saving) return;
    var msg = $('ccMsg');
    if (!state.name.trim()) { msg.className = 'savemsg err'; msg.textContent = 'The card needs a name.'; return; }
    if (state.lim === 'nation' && !state.nation) { msg.className = 'savemsg err'; msg.textContent = 'Pick a nation for a Specific-Nation card.'; return; }
    saving = true; renderPreview();
    var btn = $('ccSave'); btn.textContent = 'Shuffling…'; msg.className = 'savemsg'; msg.textContent = '';
    try {
      var res = await supabase.rpc('card_create', { p_definition: buildDefinition() });
      if (res.error) throw res.error;
      msg.className = 'savemsg ok';
      msg.textContent = state.lim === 'nation'
        ? 'Shuffled into ' + (nationName(state.nation) || state.nation) + '’s deck.'
        : 'Shuffled into every nation’s deck.';
      await loadPool();
    } catch (e) {
      msg.className = 'savemsg err'; msg.textContent = 'Save failed: ' + (e.message || e);
    } finally {
      saving = false; btn.textContent = 'Save to Card Pool'; renderPreview();
    }
  };

  /* ── seed all markets → seed_card_markets (fills every nation's block up to target). ── */
  var seeding = false;
  $('ccSeed').onclick = async function () {
    if (seeding) return;
    seeding = true;
    var btn = $('ccSeed'), msg = $('ccSeedMsg'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Seeding…'; msg.className = 'savemsg'; msg.textContent = '';
    try {
      var res = await supabase.rpc('seed_card_markets');
      if (res.error) throw res.error;
      var n = Number(res.data) || 0;
      msg.className = 'savemsg ok';
      msg.textContent = n > 0 ? 'Drew ' + n + ' card' + (n === 1 ? '' : 's') + ' onto markets.' : 'All markets already full.';
    } catch (e) {
      msg.className = 'savemsg err'; msg.textContent = 'Seed failed: ' + (e.message || e);
    } finally {
      seeding = false; btn.disabled = false; btn.textContent = label;
    }
  };

  // first paint
  syncAxis(); renderFx(); renderPreview();
  await loadNations();
  await loadPool();
  renderPreview();
}
