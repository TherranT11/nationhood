// Shared logic for the in-game sidebar screens (tutorial/home, tutorial/government).
// One source of truth for the party colour map and the sidebar's live bits:
// the flag fallback, the login guard, and the player's chosen-party label.
import { supabase, isConfigured } from '/test/supabase.js';

// The party a player chose in the tutorial -> sidebar label + colour.
// (Liberal is presented as "Centrist".)
export const PARTY = {
  Nationalist: { label: 'Nationalist', color: '#243b6b' }, // blue
  Labour:      { label: 'Labour',      color: '#D1342B' }, // red
  Liberal:     { label: 'Centrist',    color: '#C2890B' }, // yellow
};

// ---------------------------------------------------------------------------
// Auth + profile helpers (the single source of truth for "who is signed in"
// and "what is their tutorial progress", shared by every gated screen)
// ---------------------------------------------------------------------------

// Resolve the signed-in player. Returns the auth user, or null when Supabase
// isn't configured yet (local dev) so callers can fall back to their defaults.
// Redirects to /test/login/ — and returns null — when there is no valid
// session, so a logged-out player never reaches a gated page.
export async function requireUser() {
  if (!isConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '/test/login/'; return null; }
    return session.user;
  } catch (err) {
    window.location.href = '/test/login/';
    return null;
  }
}

// Read a player's tutorial progress in one place: the party they chose and
// whether they've formed their government. Returns null on any failure, so
// callers keep their defaults rather than act on bad data.
export async function getTutorialProgress(userId) {
  try {
    // select('*') so a not-yet-migrated DB degrades gracefully: if tutorial_state
    // is absent, `s` falls back to {} and every field uses its default.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    const s = data.tutorial_state || {}; // all tutorial fields live in one jsonb blob
    return {
      party: s.party,
      governmentFormed: !!s.government_formed,
      theoTask: s.theo_task || null,
      actions: s.party_actions ?? 3, // 0 stays 0; missing/null defaults to 3
      coalition: s.coalition || null,
      billVotes: s.bill_votes || {},
      week: s.week ?? 22, // tutorial opens on week 22
      crisis: s.crisis || null,
      floorBill: s.floor_bill || null,
      legislation: s.legislation || null,
      partyPopularity: s.party_popularity ?? 38,
      confidenceAdj: s.confidence_adj ?? 0,
      nation: s.nation || {}, // accumulated stat deltas from passed bills
      recruits: s.recruits || (s.recruit ? [s.recruit] : []), // politicians recruited on the Party page
      tasks: s.tasks || {}, // per-member active task: { <memberId>: {task, total, elapsed} }
    };
  } catch (err) {
    return null;
  }
}

// Wire up the shared sidebar: hide the flag if it is missing, require a
// signed-in player, and show their party in its colour. Call once per page.
// Expects a #flag image and a #party label in the markup.
export async function initSidebar() {
  const flag = document.getElementById('flag');
  if (flag) {
    const hide = () => { flag.style.display = 'none'; };
    flag.addEventListener('error', hide);
    if (flag.complete && flag.naturalWidth === 0) hide();
  }

  // The subtitle starts hidden so the player never sees a placeholder before
  // their archetype loads; reveal it once we know (or cannot know) the party.
  const partyEl = document.getElementById('party');
  const reveal = () => { if (partyEl && partyEl.parentElement) partyEl.parentElement.style.visibility = 'visible'; };

  setWeekLabel(DEFAULT_WEEK); // show a week immediately; corrected once progress loads

  if (!isConfigured) { reveal(); return; } // keep defaults until keys are set

  const user = await requireUser();
  if (!user) return; // not signed in: requireUser has redirected to login

  const progress = await getTutorialProgress(user.id);
  if (!progress) { reveal(); return; } // lookup failed: keep defaults

  const p = PARTY[progress.party];
  if (p && partyEl) { partyEl.textContent = p.label; partyEl.style.color = p.color; }
  setWeekLabel(progress.week);
  // Fill the shared topbar's Confidence (other pages only — home renders its own
  // inline). Same source as home: formedConfidence from the coalition snapshot.
  const confV = document.querySelector('.gw-conf__v');
  if (confV && progress.coalition) {
    confV.textContent = (formedConfidence(progress.coalition.total, progress.coalition.contra).value + (progress.confidenceAdj || 0)) + '%';
    const confS = document.querySelector('.gw-conf__s'); if (confS) confS.textContent = 'governing';
  }
  reveal();

  // Let the page react to the player's state (archetype contradictions,
  // whether the government is already formed).
  renderPartyActions(progress.actions);

  window.nationhoodParty = progress.party;
  window.nationhoodGovernmentFormed = progress.governmentFormed;
  window.nationhoodConfidenceAdj = progress.confidenceAdj || 0; // bill-driven confidence, read by the confidence renderers
  window.nationhoodWeek = progress.week || DEFAULT_WEEK;        // current week, read by the Legislature to load scheduled bills
  window.nationhoodNation = progress.nation || {};             // accumulated stat deltas, read by liveStat consumers
  setBudget(progress.nation);                                  // topbar/home Budget = live Treasury figure
  mountWeekNudge(progress.week);                               // Week 24+ "back to the Party Page" nudge (skipped where no #weekNudge)
  window.dispatchEvent(new CustomEvent('nationhood:party', { detail: progress.party }));
  window.dispatchEvent(new CustomEvent('nationhood:gov', { detail: progress.governmentFormed }));
  window.dispatchEvent(new CustomEvent('nationhood:task', { detail: progress.theoTask }));
  window.dispatchEvent(new CustomEvent('nationhood:actions', { detail: progress.actions }));
  window.dispatchEvent(new CustomEvent('nationhood:bills', { detail: progress.billVotes }));
  window.dispatchEvent(new CustomEvent('nationhood:crisis', { detail: progress.crisis }));
  window.dispatchEvent(new CustomEvent('nationhood:floorbill', { detail: progress.floorBill }));
  window.dispatchEvent(new CustomEvent('nationhood:legislation', { detail: progress.legislation }));
  window.dispatchEvent(new CustomEvent('nationhood:popularity', { detail: progress.partyPopularity }));
  window.dispatchEvent(new CustomEvent('nationhood:nation', { detail: progress.nation }));
  window.dispatchEvent(new CustomEvent('nationhood:recruits', { detail: progress.recruits }));
  window.dispatchEvent(new CustomEvent('nationhood:tasks', { detail: progress.tasks }));
  // Coalition last: redirect/render handlers read window.nationhoodGovernmentFormed (set above).
  window.dispatchEvent(new CustomEvent('nationhood:coalition', { detail: progress.coalition }));
}

// One place that formats the "party actions remaining" label and writes it to
// every display on the page: the dashboard's #pa and the shared topbar chip.
// Call on load (initSidebar) and after spending, so all pages agree.
export function renderPartyActions(n) {
  const label = 'Party Actions: ' + n + ' Available';
  const pa = document.getElementById('pa');
  if (pa) pa.textContent = label;
  const chip = document.querySelector('.gw-actions');
  if (chip) chip.textContent = label;
}

// The single write path for the tutorial's per-player state. Callers pass a
// partial patch keyed by the legacy tutorial_* names (e.g. tutorial_party_actions);
// this strips the prefix and merges the fields into the player's tutorial_state
// jsonb atomically (the tutorial_merge RPC). Returns true on success (or with no
// keys / local dev). Returns false — rather than redirecting — when there's no
// session, so a caller mid-action can offer a retry instead of bouncing to login.
// One column → a write can never fail on a missing column.
export async function updateProfile(patch) {
  if (!isConfigured) return true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const merged = {};
    Object.keys(patch).forEach((k) => { merged[k.replace(/^tutorial_/, '')] = patch[k]; });
    const { error } = await supabase.rpc('tutorial_merge', { patch: merged });
    return !error;
  } catch (err) {
    return false;
  }
}

// Wipe the player's whole tutorial run so the next visit starts fresh from the
// party-choice screen (no party, no government, nothing in progress). A full
// overwrite of tutorial_state — not a merge — via the own-row update policy.
export async function resetTutorial() {
  if (!isConfigured) return true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const { error } = await supabase.from('profiles').update({ tutorial_state: {} }).eq('id', session.user.id);
    return !error;
  } catch (err) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Shared game-clock + weekly-action widget (top-right on every in-game screen)
// ---------------------------------------------------------------------------
// One source of truth for the current week and the actions a player has left,
// so every page agrees. The home screen renders these inline in its own header;
// every other in-game screen gets them from mountTopbar() below.
export const DEFAULT_WEEK = 22; // the tutorial opens on week 22
export const PARTY_ACTIONS = 3;

// Qualitative ladders: a nation stat's word label derived from its value (index 0
// = value 1). Prosperity/Welfare/Order/Image run 1–20; Growth runs 1–19 (10 is the
// flat, zero-growth midpoint). The number is the one source — the word follows it.
// Single source: the Nation tiles (home) and the Draft-a-Bill projection both read
// statLabel() from here, so the wording never drifts between screens.
export const STAT_LADDERS = {
  prosperity: ['Famine and ruin','Crushing poverty','Widespread destitution','Struggling and poor','Barely scraping by','Hard times','Making ends meet','Modest comfort','Steady livelihoods','Comfortable enough','Rising standards','Growing prosperity','Broad affluence','Thriving economy','Widespread wealth','Booming nation','Roaring prosperity','Lavish abundance','Gilded opulence','Boundless riches'],
  welfare: ['Total neglect','The sick abandoned','No safety net','Bare survival','Patchy support','Minimal services','Basic provision','Modest care','Decent services','Reliable support','Solid safety net','Well looked after','Strong public services','Comprehensive care','Generous welfare','Cradle-to-grave care','Flourishing wellbeing','Universal abundance','Every need met','A model to the world'],
  order: ['Total anarchy','Open rebellion','Lawless chaos','Rampant unrest','Crime and disorder','Fragile peace','Shaky stability','Mostly calm','Settled and stable','Law and order','Firm control','A tight grip','Strong authority','Rigid discipline','Heavy enforcement','Iron rule','Watchful state','Surveillance state','Absolute obedience','Total police state'],
  image: ['Global pariah','Despised abroad','Disgraced reputation','Widely distrusted','Poor standing','A forgotten nobody','Quietly overlooked','Mildly regarded','Fair reputation','Respected enough','Well regarded','Rising influence','Admired abroad','Real prestige','Soft-power player','Globally admired','Cultural beacon','World-renowned','A revered power','Icon of the age'],
  growth: ['Massive recession','Deep recession','Severe recession','Sharp recession','Recession','Mild recession','Downturn','Slowdown','Stalling','Stagnant','Stirring','Slow growth','Modest growth','Steady growth','Strong growth','Rapid growth','Booming','Surging','Explosive growth'],
};
export function statLabel(stat, value) {
  const rung = STAT_LADDERS[stat]; if (!rung) return null;
  const i = Math.min(rung.length, Math.max(1, Math.round(value))) - 1; // clamp into range
  return rung[i];
}

// Starting values of the Nation stats — the single source. The live value of any
// stat is this base plus the accumulated delta from passed bills (tutorial_state
// .nation). The home tiles, the topbar Budget, and the Draft-a-Bill projection all
// read liveStat() so the number is computed in exactly one place.
export const NATION_BASE = {
  prosperity: 14, welfare: 14, growth: 9, order: 8, image: 17,
  inflation: 13, unemployment: 9, budget: 12.4, debt: 31,
};
export function liveStat(stat, nation) {
  const base = NATION_BASE[stat] ?? 0;
  return Math.round((base + ((nation || {})[stat] || 0)) * 10) / 10; // 1 dp; ints stay ints
}

// The week chip stacks the week number over the (fixed) month; the tutorial spans
// only a handful of weeks, all within May 1980. The month lives statically in the
// markup; this only writes the week-number line.
export function weekLabel(n) { return 'Week ' + (n || DEFAULT_WEEK); }

// Write the current week number into every display marked [data-weeknum] — the
// shared topbar and the home header both carry one. One source.
export function setWeekLabel(n) {
  const num = weekLabel(n);
  document.querySelectorAll('[data-weeknum]').forEach((el) => { el.textContent = num; });
}

// Write the live Budget (base + accumulated bill deltas) into every [data-budget]
// display. ₣ is the domestic currency, matching the home Budget tile.
export function setBudget(nation) {
  const txt = '₣' + liveStat('budget', nation) + 'B';
  document.querySelectorAll('[data-budget]').forEach((el) => { el.textContent = txt; });
}

// From Week 24, every in-game page (except the Party page) shows a nudge steering
// the player back to the Party page to recruit. Self-styled (gw- prefix) so it
// looks the same everywhere; mounts only where a #weekNudge container exists, so
// the Party page — which has none — is excluded with no per-page branching.
let nudgeStyled = false;
function ensureNudgeStyles() {
  if (nudgeStyled) return;
  nudgeStyled = true;
  const css = `
  .gw-nudge{position:relative;background:linear-gradient(135deg,#5546E8,#7d6ff1);color:#fff;border-radius:16px;padding:20px 22px;margin-bottom:18px;box-shadow:0 20px 44px -22px rgba(85,70,232,.65);max-width:760px}
  .gw-nudge__ey{font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.82);margin-bottom:10px}
  .gw-nudge p{font-size:15px;line-height:1.55;margin:0 0 13px;max-width:64ch;color:#fff}
  .gw-nudge b{font-weight:800}
  .gw-nudge__btn{display:inline-block;font-family:'Archivo',sans-serif;font-weight:800;font-size:14px;background:#fff;color:#5546E8;border-radius:11px;padding:11px 18px;text-decoration:none}
  .gw-nudge__btn:hover{filter:brightness(.96)}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}
export function mountWeekNudge(week) {
  const host = document.getElementById('weekNudge');
  if (!host || (week || DEFAULT_WEEK) < 24) return;
  ensureNudgeStyles();
  host.innerHTML =
    '<div class="gw-nudge"><div class="gw-nudge__ey">Tutorial</div>' +
    "<p>Okay, there's a new bill. Feel free to vote on it. However, we have to look toward the future of the party. Let's navigate back to the <b>Party Page</b>.</p>" +
    '<a class="gw-nudge__btn" href="/test/tutorial/party/">Go to Party Page &#9656;</a></div>';
}

// The party's prominent politicians — the single source of roster data, read by
// the Party page table and by each politician's page. Stats are [CHA, ACU, GUI,
// RES, COM]. Théo keeps a bespoke page (the Labour Talks tutorial lives there);
// everyone else renders on the generic /party/politician/ page.
export const POLITICIANS = [
  { id: 'droulez', name: 'Allen Droulez', age: 49, role: 'Prime Minister',   exp: 9, stats: [4, 3, 2, 4, 3], busy: 'the premiership',      free: false },
  { id: 'seve',    name: 'Margot Sève',   age: 56, role: 'Deputy Leader',    exp: 6, stats: [3, 5, 2, 3, 4], busy: 'Economic Development', free: false },
  { id: 'theo',    name: 'Théo Lefèvre',  age: 61, role: 'Interior Minister', exp: 1, stats: [2, 3, 4, 4, 4], busy: 'Labour Unrest', free: false, scandal: true, page: '/test/tutorial/party/theolefevre/' },
  { id: 'bonnet',  name: 'Claire Bonnet', age: 43, role: 'Trade Minister',   exp: 3, stats: [4, 4, 2, 2, 3], busy: 'Industrial Decline',   free: false },
  { id: 'brun',    name: 'Aurélie Brun',  age: 40, role: 'Foreign Minister', exp: 0, stats: [5, 3, 3, 2, 2], free: true },
  { id: 'roux',    name: 'Armand Roux',   age: 54, role: 'Defense Minister', exp: 4, stats: [2, 3, 2, 5, 4], free: true },
];

// Théo Lefèvre's Charisma, used for the Labour Unrest negotiation roll — read
// from the shared roster so it can never drift from the table.
const THEO_CHARISMA = (POLITICIANS.find((p) => p.id === 'theo') || { stats: [2] }).stats[0];

// Compute the one-time Labour Unrest outcome from the player's Energy
// Independence Act vote. Only a decisive Yes/Nay drives the crisis; an abstain
// or no vote returns null (the week still advances, the crisis is untouched).
// Pure except for the single d6 roll, which is captured in the result so it is
// rolled exactly once and then persisted.
export function computeCrisis(vote) {
  if (vote !== 'aye' && vote !== 'nay') return null;
  const pass = vote === 'aye';
  const base = pass ? 18 : -16;            // ticks: + toward General Strike, − toward resolution
  const die = 1 + Math.floor(Math.random() * 6);
  const total = die + THEO_CHARISMA;       // 1d6 + Théo's Charisma
  const good = total >= 7;                  // 7+ : talks progress; 6 or less : they sour
  const tick = base + (good ? -2 : 1);      // the roll only nudges the tally, not the step
  return {
    vote,                                   // the decisive vote, kept for record/traceability
    step: pass ? 4 : 2,                     // Select Industries Refuse to Work / Labour Vocal in the Media
    tick,
    growth: pass ? 2 : 1,                   // Growth per tick
    outcome: pass ? 'nationalized' : 'refused',
    roll: { die, cha: THEO_CHARISMA, total, good },
  };
}

// The two standing floor bills, for end-of-week resolution. KNOWN DUPLICATION:
// their non-player Aye base + names mirror the `bills` object on the Legislature
// page; keep in sync until there's a shared bills module. (bp, the player's bill,
// is resolved from its saved snapshot.)
// Scripted bills, each with the week it reaches the floor, its non-player Aye
// base, a concise effect string, and the numeric stat deltas it applies if it
// passes (which both feed the confidence rules and move the live Nation stats).
// KNOWN DUPLICATION: name/Aye/effect/seats mirror the rendered bills on the
// Legislature page; keep in sync until there's a shared bills module.
const SCRIPTED_BILLS = [
  { id: 'b1', week: DEFAULT_WEEK, name: 'Energy Independence Act', aye: 40, effect: 'Energy ▲, Debt ▲', delta: { debt: 5 } },
  { id: 'b2', week: DEFAULT_WEEK, name: 'Thirty-Five Hour Week Act', aye: 40, effect: 'Welfare ▲, Prosperity ▼, Growth ▼', delta: { welfare: 2, prosperity: -1, growth: -1 } },
  { id: 'img', week: 24, name: 'Industrial Modernisation Bill', aye: 122, effect: 'Growth ▲, Unemployment ▼, Welfare ▲, Budget −₣23B', delta: { growth: 1, unemployment: -1, welfare: 1, budget: -23 } },
];
const ASSEMBLY_SEATS = { wp: 40, cu: 50, la: 44, nr: 32 }; // other-party seats (also mirrored on the Legislature page)
const FRONT_SEATS = 114, MAJORITY = 141;

// Confidence shift from the net Welfare/Prosperity of passed bills (the rules):
// Welfare ≤ −1 → −2, ≥ +2 → +1; Prosperity ≤ −1 → −1, ≥ +3 → +1.
function confidenceFromStats(welfare, prosperity) {
  let c = 0;
  if (welfare <= -1) c -= 2; else if (welfare >= 2) c += 1;
  if (prosperity <= -1) c -= 1; else if (prosperity >= 3) c += 1;
  return c;
}

// Resolve the floor bills that are due (week reached) and not already resolved,
// plus the player's proposed bill. A bill passes if its Aye seats (others + the
// player's 114 when they vote Aye) reach the 141 majority. Returns
// { history, popDelta, confAdj, bpResolved } of the NEW results, or null.
// Party popularity per bill: +1 when the outcome matches your vote (Aye+passed or
// Nay+failed), -1 when it contradicts it, 0 if you abstained.
// Bills currently awaiting a vote on the floor: scripted bills that are due this
// week and not yet resolved, plus the player's proposed bill if it is still live.
// Same dedup (id OR name) as resolveLegislation. Returns [{name, effect}].
export function onFloorBills(week, floorBill, legislation) {
  const done = new Set();
  (legislation || []).forEach((it) => { if (it.id) done.add(it.id); if (it.name) done.add(it.name); });
  const out = [];
  SCRIPTED_BILLS.forEach((b) => {
    if (b.week <= (week || DEFAULT_WEEK) && !(done.has(b.id) || done.has(b.name))) out.push({ name: b.name, effect: b.effect });
  });
  if (floorBill && floorBill.title && !(done.has('bp') || done.has(floorBill.title))) {
    out.push({ name: floorBill.title, effect: floorBill.effect || '' });
  }
  return out;
}

export function resolveLegislation(billVotes, floorBill, week, doneIds) {
  const v = billVotes || {};
  const done = doneIds || new Set();
  const raw = [];
  SCRIPTED_BILLS.forEach((b) => {
    // Skip if not on the floor yet, or already resolved. Match by id OR name so
    // legislation saved before bills carried ids (older sessions) still dedupes.
    if (b.week > week || done.has(b.id) || done.has(b.name)) return;
    const vote = v[b.id] || 'abs';
    const passed = (b.aye + (vote === 'aye' ? FRONT_SEATS : 0)) >= MAJORITY;
    raw.push({ id: b.id, name: b.name, passed, vote, effect: b.effect, delta: b.delta || {} });
  });
  let bpResolved = false;
  if (floorBill && floorBill.title) {
    const pv = floorBill.partyVotes || {};
    let aye = 0;
    Object.keys(ASSEMBLY_SEATS).forEach((k) => { if (pv[k] === 'aye') aye += ASSEMBLY_SEATS[k]; });
    const vote = v.bp || 'abs';
    const passed = (aye + (vote === 'aye' ? FRONT_SEATS : 0)) >= MAJORITY;
    raw.push({ id: 'bp', name: floorBill.title, passed, vote, effect: floorBill.effect || '', delta: floorBill.delta || {} });
    bpResolved = true;
  }
  if (!raw.length) return null;
  // Accumulate the passed bills' stat deltas; confidence reads welfare/prosperity
  // from the same source (one place).
  const nationDelta = {};
  raw.forEach((r) => { if (r.passed) Object.keys(r.delta).forEach((k) => { nationDelta[k] = (nationDelta[k] || 0) + r.delta[k]; }); });
  // Store only what the UI reads (id/name/passed/vote/pop/effect).
  const history = raw.map((r) => ({
    id: r.id, name: r.name, passed: r.passed, vote: r.vote, effect: r.effect,
    budget: r.delta.budget || 0, // ₣B: <0 cost, >0 gained — shown on passed bills
    pop: r.vote === 'abs' ? 0 : ((r.passed === (r.vote === 'aye')) ? 1 : -1),
  }));
  return {
    history,
    popDelta: history.reduce((s, it) => s + it.pop, 0),
    confAdj: confidenceFromStats(nationDelta.welfare || 0, nationDelta.prosperity || 0),
    nationDelta,
    bpResolved,
  };
}

// Advance the tutorial one week. Persists the new week and — on the first
// advance after a decisive Energy Act vote — the scripted Labour Unrest
// outcome, then reloads so every page re-renders from the saved state.
// Guarded against double-fire; a no-op in local dev (no keys). Returns false
// when nothing was advanced (so the caller can re-enable its button); on
// success the page reloads, so the resolved value never matters.
let advancing = false;
export async function advanceWeek() {
  if (advancing) return false;
  advancing = true;
  if (!isConfigured) { advancing = false; return false; } // nothing to persist locally
  try {
    const user = await requireUser();
    if (!user) { advancing = false; return false; } // requireUser has redirected to login
    const progress = await getTutorialProgress(user.id);
    if (!progress) { advancing = false; return false; } // lookup failed: leave state, allow retry
    // A new week restores the full weekly action budget.
    const patch = { tutorial_week: (progress.week || DEFAULT_WEEK) + 1, tutorial_party_actions: PARTY_ACTIONS };
    if (!progress.crisis) { // apply the scripted crisis exactly once
      const crisis = computeCrisis((progress.billVotes && progress.billVotes.b1) || null);
      if (crisis) patch.tutorial_crisis = crisis;
    }
    // Resolve due floor bills, appending to the running history (multi-round).
    // Gated on engagement: round 1 needs a proposed bill; later rounds run once
    // legislation exists, so a player who never visits the Legislature doesn't
    // trigger resolution by advancing the week from elsewhere.
    const engaged = progress.floorBill || (progress.legislation && progress.legislation.length);
    if (engaged) {
      const done = new Set();
      (progress.legislation || []).forEach((it) => { if (it.id) done.add(it.id); if (it.name) done.add(it.name); });
      const leg = resolveLegislation(progress.billVotes, progress.floorBill, progress.week || DEFAULT_WEEK, done);
      if (leg) {
        patch.tutorial_legislation = (progress.legislation || []).concat(leg.history);
        patch.tutorial_party_popularity = (progress.partyPopularity ?? 38) + leg.popDelta;
        patch.tutorial_confidence_adj = (progress.confidenceAdj || 0) + leg.confAdj;
        // Apply passed bills' stat changes to the live Nation stats (accumulated deltas).
        const nation = { ...(progress.nation || {}) };
        Object.keys(leg.nationDelta).forEach((k) => { nation[k] = (nation[k] || 0) + leg.nationDelta[k]; });
        patch.tutorial_nation = nation;
        if (leg.bpResolved) patch.tutorial_floor_bill = null; // consumed into history
      }
    }
    const ok = await updateProfile(patch);
    if (!ok) { advancing = false; return false; } // write failed: leave UI, allow retry
    window.location.reload();               // success: re-render every display from saved state
    return true;
  } catch (err) {
    advancing = false;
    return false;
  }
}

// Confirmation modal for advancing the week, injected once per page. Resolves
// true on Confirm, false on Cancel / backdrop / Escape. Themed from the page's
// own CSS variables (with fallbacks) so it matches every screen.
let weekModalReady = false;
function ensureWeekModal() {
  if (weekModalReady) return;
  weekModalReady = true;
  const css = `
  .gw-modal{position:fixed;inset:0;z-index:90;display:none;align-items:center;justify-content:center;background:rgba(21,21,27,.45);padding:20px}
  .gw-modal.show{display:flex}
  .gw-modal__box{background:var(--surface,#fff);border:1px solid var(--line,#E7E5E0);border-radius:16px;padding:24px;max-width:380px;width:100%;box-shadow:0 30px 60px -20px rgba(0,0,0,.4)}
  .gw-modal__t{font-family:'Archivo',sans-serif;font-weight:800;font-size:18px;letter-spacing:-.01em;color:var(--ink,#15151B)}
  .gw-modal__btns{display:flex;gap:10px;margin-top:20px}
  .gw-modal__btns button{flex:1;font-family:'Space Mono',monospace;font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:12px;border-radius:11px;cursor:pointer;transition:filter .15s,background .15s}
  .gw-modal__cancel{background:var(--surface,#fff);border:1.5px solid var(--line,#E7E5E0);color:var(--muted,#5b5b63)}
  .gw-modal__cancel:hover{background:var(--chip,#F4F3EF)}
  .gw-modal__confirm{background:var(--indigo,#5546E8);border:1.5px solid var(--indigo,#5546E8);color:#fff}
  .gw-modal__confirm:hover{filter:brightness(1.07)}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const modal = document.createElement('div');
  modal.className = 'gw-modal';
  modal.id = 'gw-modal';
  modal.innerHTML =
    '<div class="gw-modal__box" role="dialog" aria-modal="true">' +
    '<div class="gw-modal__t">Confirm advance to next week?</div>' +
    '<div class="gw-modal__btns"><button class="gw-modal__cancel" type="button">Cancel</button>' +
    '<button class="gw-modal__confirm" type="button">Confirm</button></div></div>';
  document.body.appendChild(modal);
}
function confirmAdvance() {
  ensureWeekModal();
  const modal = document.getElementById('gw-modal');
  return new Promise((resolve) => {
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    function close(val) {
      modal.classList.remove('show');
      modal.querySelector('.gw-modal__confirm').onclick = null;
      modal.querySelector('.gw-modal__cancel').onclick = null;
      modal.onclick = null;
      document.removeEventListener('keydown', onKey);
      resolve(val);
    }
    modal.querySelector('.gw-modal__confirm').onclick = () => close(true);
    modal.querySelector('.gw-modal__cancel').onclick = () => close(false);
    modal.onclick = (e) => { if (e.target === modal) close(false); }; // backdrop cancels
    document.addEventListener('keydown', onKey);
    modal.classList.add('show');
  });
}

// Wire a Next Week button: confirm first, then advance (disabling the button
// during the write, re-enabling if it fails). One place, used by the home
// header and the shared topbar.
export function wireNextWeek(btn) {
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (!(await confirmAdvance())) return;       // cancelled
    btn.disabled = true;
    if (!(await advanceWeek())) btn.disabled = false; // failed: allow retry
  });
}

// Inject the topbar's styles once per page. Uses the same CSS variables the
// pages already define (--indigo, --soft, --ink, ...), so it inherits each
// screen's palette. Class names are prefixed `gw-` to never collide with a
// page's own markup (e.g. the home screen's .pa / .nextweek).
let topbarStyled = false;
function ensureTopbarStyles() {
  if (topbarStyled) return;
  topbarStyled = true;
  const css = `
  .gw-topbar{display:flex;align-items:center;justify-content:flex-end;gap:13px;flex-wrap:wrap;margin-bottom:20px}
  .gw-topbar .gw-actions{font-family:'Space Mono',monospace;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--indigo);background:var(--indigo-soft);border:1px solid color-mix(in srgb,var(--indigo) 30%,transparent);border-radius:20px;padding:9px 15px;white-space:nowrap}
  .gw-topbar .gw-conf{font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);text-align:right;line-height:1.3;display:flex;flex-direction:column;align-items:flex-end}
  .gw-topbar .gw-conf__v{color:var(--ink);font-size:18px;font-weight:800;font-family:'Archivo',sans-serif;display:flex;align-items:center;gap:2px}
  .gw-topbar .gw-conf__dash{display:inline-block;width:11px;height:2px;background:currentColor;border-radius:1px}
  .gw-topbar .gw-conf__s{color:var(--soft);font-size:9px}
  .gw-topbar .gw-budget{font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);text-align:right;line-height:1.3;display:flex;flex-direction:column;align-items:flex-end}
  .gw-topbar .gw-budget__v{color:var(--ink);font-size:18px;font-weight:800;font-family:'Archivo',sans-serif}
  .gw-topbar .gw-week{font-family:'Space Mono',monospace;text-align:center;line-height:1.12;display:flex;flex-direction:column;align-items:center;white-space:nowrap}
  .gw-topbar .gw-week__n{color:var(--ink);font-size:16px;font-weight:800;letter-spacing:.02em;font-family:'Archivo',sans-serif}
  .gw-topbar .gw-week__m{color:var(--soft);font-size:10px;letter-spacing:.14em;text-transform:uppercase}
  .gw-topbar .gw-next{font-family:'Space Mono',monospace;font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;background:var(--indigo);color:#fff;border:none;border-radius:11px;padding:12px 20px;cursor:pointer;white-space:nowrap;transition:transform .15s,filter .15s}
  .gw-topbar .gw-next:hover{transform:translateY(-1px);filter:brightness(1.07)}
  .gw-topbar .gw-next:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
  .gw-topbar .gw-next[disabled]{background:#cfcdc7;cursor:default;pointer-events:none}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// Render the actions-remaining chip, current week, and Next Week button into
// the top-right of <main>. Safe to call once per page; a no-op if there is no
// <main> or a bar is already present. Next Week is disabled during the tutorial,
// matching the home screen — the week only advances once that flow is built.
export function mountTopbar() {
  const main = document.querySelector('.main');
  if (!main || main.querySelector('.gw-topbar')) return;
  ensureTopbarStyles();

  const bar = document.createElement('div');
  bar.className = 'gw-topbar';
  bar.innerHTML =
    '<span class="gw-actions"></span>' +
    '<span class="gw-conf"><span>Confidence</span><span class="gw-conf__v"><span class="gw-conf__dash"></span></span><span class="gw-conf__s">no government</span></span>' +
    '<span class="gw-budget"><span>Budget</span><span class="gw-budget__v" data-budget>₣' + NATION_BASE.budget + 'B</span></span>' +
    '<span class="gw-week"><span class="gw-week__n" data-weeknum>' + weekLabel(DEFAULT_WEEK) + '</span><span class="gw-week__m">May 1980</span></span>' +
    '<button class="gw-next" type="button">Next Week &#9656;</button>';
  main.insertBefore(bar, main.firstChild);
  wireNextWeek(bar.querySelector('.gw-next'));
  renderPartyActions(PARTY_ACTIONS); // default until initSidebar fills the live count
}

// Sign the player out and return to the test landing page. Redirects even if
// the sign-out call fails so a stuck session never traps the player. Guards
// against a double-click firing two sign-outs before the redirect lands.
let loggingOut = false;
export async function logout() {
  if (loggingOut) return;
  loggingOut = true;
  try { if (isConfigured) await supabase.auth.signOut(); } catch (err) { /* fall through to redirect */ }
  window.location.href = '/test/';
}

// Confidence of the formed government from the actual coalition: base, the
// three standing crises, a penalty per contradictory partner, and the seat
// majority bonus. Read by the formed Government screen and the home dashboard
// (both pass the snapshot's seat total + contra count).
// KNOWN DUPLICATION: the formation screen's live "Expected Confidence" preview
// (renderConfidence in government/index.html) reimplements this same formula in
// its classic script. Keep the two in sync until that page is modularised to
// import this function.
export function formedConfidence(totalSeats, contraCount) {
  const base = 50;
  const crises = -6;                          // three crises at -2
  const contra = -4 * (contraCount || 0);     // each contradictory partner
  const pct = (totalSeats || 0) / 280 * 100;
  const bonus = pct > 50 ? Math.round((pct - 50) / 2 * 10) / 10 : 0; // seats over 50%, halved
  const value = Math.round(base + crises + contra + bonus);
  return { value, base, crises, contra, bonus };
}
