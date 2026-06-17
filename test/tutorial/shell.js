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
    // select('*') so a not-yet-migrated tutorial column degrades gracefully
    // (the field is simply absent) instead of erroring the whole read.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return {
      party: data.tutorial_party,
      governmentFormed: !!data.tutorial_government_formed,
      theoTask: data.tutorial_theo_task || null,
      actions: data.tutorial_party_actions ?? 3, // 0 stays 0; missing/null defaults to 3
      coalition: data.tutorial_coalition || null,
      billVotes: data.tutorial_bill_votes || {},
      week: data.tutorial_week ?? 22, // tutorial opens on week 22
      crisis: data.tutorial_crisis || null,
      floorBill: data.tutorial_floor_bill || null,
      legislation: data.tutorial_legislation || null,
      partyPopularity: data.tutorial_party_popularity ?? 38,
      confidenceAdj: data.tutorial_confidence_adj ?? 0,
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
  window.dispatchEvent(new CustomEvent('nationhood:party', { detail: progress.party }));
  window.dispatchEvent(new CustomEvent('nationhood:gov', { detail: progress.governmentFormed }));
  window.dispatchEvent(new CustomEvent('nationhood:task', { detail: progress.theoTask }));
  window.dispatchEvent(new CustomEvent('nationhood:actions', { detail: progress.actions }));
  window.dispatchEvent(new CustomEvent('nationhood:bills', { detail: progress.billVotes }));
  window.dispatchEvent(new CustomEvent('nationhood:crisis', { detail: progress.crisis }));
  window.dispatchEvent(new CustomEvent('nationhood:floorbill', { detail: progress.floorBill }));
  window.dispatchEvent(new CustomEvent('nationhood:legislation', { detail: progress.legislation }));
  window.dispatchEvent(new CustomEvent('nationhood:popularity', { detail: progress.partyPopularity }));
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

// The single write path for the tutorial's per-player profile flags. Applies a
// partial patch to the signed-in player's row and returns true on success (or
// with no keys, so local dev still flows). Returns false — rather than
// redirecting — when there's no session, so a caller mid-action can offer a
// retry instead of throwing the player to login.
export async function updateProfile(patch) {
  if (!isConfigured) return true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
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

// One formatter for the week chip. The tutorial spans only a handful of weeks,
// all within May 1980, so the month is fixed here rather than computed.
export function weekLabel(n) { return 'Week ' + (n || DEFAULT_WEEK) + ' · May 1980'; }

// Write the current week into both displays that exist: the shared topbar chip
// (.gw-week) and the home screen's own header date (#weekDate). One source.
export function setWeekLabel(n) {
  const label = weekLabel(n);
  const chip = document.querySelector('.gw-week');
  if (chip) chip.textContent = label;
  const home = document.getElementById('weekDate');
  if (home) home.textContent = label;
}

// Théo Lefèvre's Charisma, used for the Labour Unrest negotiation roll.
// KNOWN DUPLICATION: the party roster (party/index.html) is the canonical place
// this stat is defined; it is mirrored here because there is no shared
// politician-stats module yet. Keep the two in sync until one is introduced.
const THEO_CHARISMA = 2;

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
// base, a concise effect string, and the net Welfare/Prosperity it applies if it
// passes (feeds the confidence rules). KNOWN DUPLICATION: name/Aye/effect/seats
// mirror the rendered bills on the Legislature page; keep in sync until there's a
// shared bills module.
const SCRIPTED_BILLS = [
  { id: 'b1', week: DEFAULT_WEEK, name: 'Energy Independence Act', aye: 40, effect: 'Energy ▲, Debt ▲', welfare: 0, prosperity: 0 },
  { id: 'b2', week: DEFAULT_WEEK, name: 'Thirty-Five Hour Week Act', aye: 40, effect: 'Welfare ▲, Prosperity ▼, Growth ▼', welfare: 2, prosperity: -1 },
  { id: 'img', week: 24, name: 'Industrial Modernisation Bill', aye: 122, effect: 'Growth ▲, Unemployment ▼, Welfare ▲, Budget −₣23B', welfare: 1, prosperity: 0 },
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
export function resolveLegislation(billVotes, floorBill, week, doneIds) {
  const v = billVotes || {};
  const done = doneIds || new Set();
  const raw = [];
  SCRIPTED_BILLS.forEach((b) => {
    if (b.week > week || done.has(b.id)) return; // not on the floor yet, or already resolved
    const vote = v[b.id] || 'abs';
    const passed = (b.aye + (vote === 'aye' ? FRONT_SEATS : 0)) >= MAJORITY;
    raw.push({ id: b.id, name: b.name, passed, vote, effect: b.effect, welfare: b.welfare, prosperity: b.prosperity });
  });
  let bpResolved = false;
  if (floorBill && floorBill.title) {
    const pv = floorBill.partyVotes || {};
    let aye = 0;
    Object.keys(ASSEMBLY_SEATS).forEach((k) => { if (pv[k] === 'aye') aye += ASSEMBLY_SEATS[k]; });
    const vote = v.bp || 'abs';
    const passed = (aye + (vote === 'aye' ? FRONT_SEATS : 0)) >= MAJORITY;
    raw.push({ id: 'bp', name: floorBill.title, passed, vote, effect: floorBill.effect || '', welfare: floorBill.welfare || 0, prosperity: 0 });
    bpResolved = true;
  }
  if (!raw.length) return null;
  let welfare = 0, prosperity = 0;
  raw.forEach((r) => { if (r.passed) { welfare += r.welfare; prosperity += r.prosperity; } });
  // Store only what the UI reads (id/name/passed/vote/pop/effect); welfare/
  // prosperity are only needed here to compute the confidence shift.
  const history = raw.map((r) => ({
    id: r.id, name: r.name, passed: r.passed, vote: r.vote, effect: r.effect,
    pop: r.vote === 'abs' ? 0 : ((r.passed === (r.vote === 'aye')) ? 1 : -1),
  }));
  return { history, popDelta: history.reduce((s, it) => s + it.pop, 0), confAdj: confidenceFromStats(welfare, prosperity), bpResolved };
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
    if (!user) return false; // requireUser has redirected to login
    const progress = await getTutorialProgress(user.id);
    if (!progress) { advancing = false; return false; } // lookup failed: leave state, allow retry
    const patch = { tutorial_week: (progress.week || DEFAULT_WEEK) + 1 };
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
      const done = new Set((progress.legislation || []).map((it) => it.id));
      const leg = resolveLegislation(progress.billVotes, progress.floorBill, progress.week || DEFAULT_WEEK, done);
      if (leg) {
        patch.tutorial_legislation = (progress.legislation || []).concat(leg.history);
        patch.tutorial_party_popularity = (progress.partyPopularity ?? 38) + leg.popDelta;
        patch.tutorial_confidence_adj = (progress.confidenceAdj || 0) + leg.confAdj;
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
  .gw-topbar .gw-week{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);white-space:nowrap}
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
    '<span class="gw-week">' + weekLabel(DEFAULT_WEEK) + '</span>' +
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
