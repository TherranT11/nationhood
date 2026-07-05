// Shared logic for the in-game sidebar screens (tutorial/home, tutorial/government).
// One source of truth for the party colour map and the sidebar's live bits:
// the flag fallback, the login guard, and the player's chosen-party label.
import { supabase, isConfigured, requireUser } from '/supabase.js';
export { requireUser }; // shared auth helper, re-exported for the tutorial pages

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

// requireUser lives in the shared client module now (imported + re-exported above).

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
      welcomed: !!s.welcomed, // dismissed the home welcome modal at least once
      step: s.step ?? 0,      // guided-tour progress (index into GUIDE_STEPS)
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

// --- Turn state ------------------------------------------------------------
// The tutorial runs as a session-scoped scenario. Two facts drive every
// derived display: the turn (0 = the opening week, Dec 1979; 1 = after the
// first Next Week, Jan 1980) and the player's floor vote on the pension bill.
// sessionStorage is the SOLE source of truth for these, read synchronously so
// the topbar, Home and News render in lockstep without async plumbing.
// KNOWN LIMITATION: turn/vote are session-scoped and not re-hydrated from the
// DB, whereas the guide step is (getTutorialProgress). A player who returns in
// a fresh session mid-scenario resumes the tour at the right step but with the
// chrome reset to turn 0. Acceptable for a single-sitting tutorial; wire turn/
// vote into getTutorialProgress if cross-session resume is ever needed.
// All numbers the scenario keys off live here as the one source. Turn 0 = the
// opening week (Dec 1979); turn 1 = the pension vote's fallout (Jan 1980);
// turn 2 = the alcohol-tax choice resolving (Feb 1980).
export const TUT_BALANCE_BASE = -10.0;   // $bn/yr — the deficit at turn 0
export const TUT_PENSION_SAVING = 23.1;  // $bn/yr the abolition returns (bill figure)
export const TUT_ALCOHOL_COST = 2.2;     // $bn/yr revenue lost if the alcohol tax is repealed
export const TUT_APPROVAL_BASE = 32;     // % approval at turn 0
export const TUT_APPROVAL_DROP = 9;      // points lost to abolishing the pension
export const TUT_ALCOHOL_GAIN = 6;       // points won back by repealing the (popular) alcohol tax
const TUT_DATES = ['December, 1979', 'January, 1980', 'February, 1980'];

export function getTutTurn() {
  try { return Number(sessionStorage.getItem('nh-turn') || 0); } catch (e) { return 0; }
}
export function getFloorVote() {
  try { return sessionStorage.getItem('nh-floor-vote'); } catch (e) { return null; }
}
// True once the week has advanced AND the player carried the abolition (forced yes).
export function pensionAbolished() { return getTutTurn() >= 1 && getFloorVote() === 'yes'; }
// True once the alcohol repeal resolves — the player endorsed it and a further week passed.
export function alcoholResolved() {
  try { return getTutTurn() >= 2 && sessionStorage.getItem('nh-alcohol') === 'endorse'; } catch (e) { return false; }
}

export const TUT_INFLUENCE_BASE = 20;    // Influence at turn 0 (a campaign war-chest)
export const TUT_INFLUENCE_GAIN = 3;     // Influence accrued each turn

// Campaign spending + the popularity it wins or loses accumulate here (turn 3+).
export function campSpent() { try { return Number(sessionStorage.getItem('nh-camp-spent') || 0); } catch (e) { return 0; } }
export function campPop() { try { return Number(sessionStorage.getItem('nh-camp-pop') || 0); } catch (e) { return 0; } }
// Record a used campaign action: Influence spent + the popularity delta it rolled.
export function applyCampaign(spend, popDelta) {
  try {
    sessionStorage.setItem('nh-camp-spent', String(campSpent() + spend));
    sessionStorage.setItem('nh-camp-pop', String(campPop() + popDelta));
  } catch (e) {}
}

// One source for every derived headline number, read by the topbar, Home and Election.
export function tutDate() { return TUT_DATES[Math.min(getTutTurn(), TUT_DATES.length - 1)]; }
export function tutInfluence() { return TUT_INFLUENCE_BASE + TUT_INFLUENCE_GAIN * getTutTurn() - campSpent(); }
export function tutBalance() {
  return TUT_BALANCE_BASE + (pensionAbolished() ? TUT_PENSION_SAVING : 0) - (alcoholResolved() ? TUT_ALCOHOL_COST : 0);
}
export function tutApproval() {
  const a = TUT_APPROVAL_BASE - (getTutTurn() >= 1 ? TUT_APPROVAL_DROP : 0) + (alcoholResolved() ? TUT_ALCOHOL_GAIN : 0) + campPop();
  return Math.max(0, Math.min(100, a));
}
// The "Last Factors Affecting Popularity" list, most recent first.
export function tutApprovalFactors() {
  const f = [];
  if (campPop() !== 0) f.push({ amt: campPop(), label: 'Campaign trail' });
  if (alcoholResolved()) f.push({ amt: TUT_ALCOHOL_GAIN, label: 'Repealed the Alcohol Tax' });
  if (getTutTurn() >= 1) f.push({ amt: -TUT_APPROVAL_DROP, label: 'Voted to Abolish Civil Service Pension' });
  return f;
}

// Advance the scenario one turn (the tutorial runs 0 → 1 → 2).
export function advanceTutorialWeek() {
  try { sessionStorage.setItem('nh-turn', String(getTutTurn() + 1)); } catch (e) {}
}

// Wipe the player's whole tutorial run so the next visit starts fresh from the
// party-choice screen (no party, no government, nothing in progress). A full
// overwrite of tutorial_state — not a merge — via the own-row update policy.
export async function resetTutorial() {
  // sessionStorage is the in-session source of truth (turn, floor vote, guide
  // step, inbox replies), so a reset must clear it too or a restart in the same
  // tab resumes mid-scenario. All tutorial keys are 'nh-' prefixed in session
  // storage (theme lives in localStorage, so it's untouched).
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.indexOf('nh-') === 0) sessionStorage.removeItem(k);
    }
  } catch (e) { /* storage unavailable — nothing to clear */ }
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

// Wire the shared tutorial chrome present on every section page: the mobile
// bottom-nav active state + "More" sheet, the top-right gear dropdown, and the
// Exit Tutorial control (confirm → reset → back to the real app). One source,
// so all ten scaffolds stay identical without copy-pasted handlers. A no-op for
// any element a page happens not to carry.
export function mountTutorialChrome() {
  const path = location.pathname;

  // Mobile bottom nav: highlight the current tab, wire the More sheet.
  document.querySelectorAll('.botnav__i[href]').forEach((a) => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
  const moreBtn = document.getElementById('moreBtn');
  const moreSheet = document.getElementById('moreSheet');
  // Derive the "More" links from the sheet itself — one source, so reordering the
  // sheet never needs a matching edit here.
  const moreLinks = Array.from(document.querySelectorAll('.moresheet__grid a')).map((a) => a.getAttribute('href'));
  if (moreLinks.indexOf(path) >= 0 && moreBtn) moreBtn.classList.add('active');
  if (moreBtn && moreSheet) {
    moreBtn.addEventListener('click', () => { moreSheet.hidden = !moreSheet.hidden; });
    moreSheet.addEventListener('click', (e) => { if (e.target === moreSheet) moreSheet.hidden = true; });
  }

  // Top-right gear dropdown.
  const gearBtn = document.getElementById('gearBtn');
  const gearMenu = document.getElementById('gearMenu');
  if (gearBtn && gearMenu) {
    gearBtn.addEventListener('click', (e) => { e.stopPropagation(); gearMenu.hidden = !gearMenu.hidden; });
    document.addEventListener('click', (e) => {
      if (!gearMenu.hidden && !gearBtn.contains(e.target) && !gearMenu.contains(e.target)) gearMenu.hidden = true;
    });
  }

  // Exit Tutorial: confirm, wipe progress, return to the real app.
  const exit = document.getElementById('exitTutorial');
  if (exit) exit.addEventListener('click', async () => {
    if (!confirm('Exit the tutorial and reset your progress? Next time you start the tutorial it begins from scratch.')) return;
    exit.disabled = true; exit.textContent = 'Exiting…';
    try { await resetTutorial(); } catch (e) { /* reset is best-effort; leave anyway */ }
    window.location.href = '/home/';
  });

  // From turn 3 the election is six months out — flag the Election nav so the
  // player knows to look. A glowing amber dot on both the sidebar and bottom nav.
  if (getTutTurn() >= 3) markElectionDot();

  mountTutorialTopbar();
  mountGuide();
}

function markElectionDot() {
  if (!document.getElementById('nh-eldot-css')) {
    const st = document.createElement('style');
    st.id = 'nh-eldot-css';
    st.textContent =
      '.nh-eldot{width:8px;height:8px;border-radius:50%;background:var(--amber);flex:none;animation:nh-eldot 1.4s ease-in-out infinite}' +
      '.nav__i .nh-eldot{margin-left:auto}' +
      '.botnav__i{position:relative}.botnav__i .nh-eldot{position:absolute;top:5px;left:calc(50% + 8px)}' +
      '@keyframes nh-eldot{0%,100%{box-shadow:0 0 0 0 rgba(224,130,14,.55)}50%{box-shadow:0 0 0 5px rgba(224,130,14,0)}}';
    document.head.appendChild(st);
  }
  document.querySelectorAll('.nav__i[href="/tutorial/election/"], .botnav__i[href="/tutorial/election/"]').forEach((a) => {
    if (!a.querySelector('.nh-eldot')) { const d = document.createElement('span'); d.className = 'nh-eldot'; a.appendChild(d); }
  });
}

// The persistent top bar on every screen (right → left): a light/dark toggle, a
// greyed-out Next Week button, the date, and the player's Influence. Injected here
// so the bar lives in ONE place instead of being copy-pasted into every page. The
// theme toggle drives theme.js (window.NHTheme), which flips the shared CSS vars.
// (Distinct from the dormant mountTopbar() below, which belongs to the old engine.)
// KNOWN ISSUE: dark mode re-themes the shared tokens (--bg/--surface/--ink/…), but
// the tutorial pages' hardcoded accent tints (#FAEAEA, #E6F4EC, #FBF1DC, …) don't
// adapt yet — a later pass should move them onto theme.js's --*-soft vars.
function mountTutorialTopbar() {
  const host = document.querySelector('.main .page') || document.querySelector('.main');
  if (!host || host.querySelector('.nhbar')) return;
  ensureTopbarStyles2();
  // Date and balance are derived centrally (tutDate/tutBalance) so the topbar,
  // Home and News never drift: the pension saving and the alcohol cost land as
  // their turns resolve.
  const bal = tutBalance();
  const balTxt = (bal < 0 ? '−$' : '+$') + Math.abs(bal).toFixed(1) + ' bn/yr';
  const balCls = bal < 0 ? 'nhbar__bal--neg' : 'nhbar__bal--pos';
  const dateTxt = tutDate();
  const bar = document.createElement('div');
  bar.className = 'nhbar';
  bar.innerHTML =
    '<span class="nhbar__chip nhbar__inf" title="Influence">' +
      '<svg class="nhbar__star" viewBox="0 0 24 24"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>' + tutInfluence() + '</span>' +
    '<span class="nhbar__chip nhbar__bal ' + balCls + '" title="Budget balance (per year)">' + balTxt + '</span>' +
    '<span class="nhbar__chip nhbar__date">' + dateTxt + '</span>' +
    '<button class="nhbar__week" type="button" disabled>Next Week</button>' +
    '<button class="nhbar__theme" type="button" aria-label="Toggle dark mode">' +
      '<svg class="ic-moon" viewBox="0 0 24 24"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></svg>' +
      '<svg class="ic-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
    '</button>';
  host.insertBefore(bar, host.firstChild);
  bar.querySelector('.nhbar__theme').addEventListener('click', () => { if (window.NHTheme) window.NHTheme.toggle(); });
  // Move the settings gear out of its fixed corner and into the bar, so it lines up
  // with the theme toggle (its dropdown still opens beneath it — .gear is relative).
  const gear = document.querySelector('.gear');
  if (gear) bar.appendChild(gear);
}

let topbarStyled2 = false;
function ensureTopbarStyles2() {
  if (topbarStyled2) return;
  topbarStyled2 = true;
  const css =
    '.nhbar{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-bottom:20px}' +
    '.nhbar__chip{display:inline-flex;align-items:center;gap:6px;background:var(--chip);border:1px solid var(--line);border-radius:10px;padding:7px 12px;font-family:"Space Mono",monospace;font-size:12.5px;font-weight:700}' +
    '.nhbar__inf{color:var(--ink)}' +
    '.nhbar__star{width:16px;height:16px;fill:var(--amber)}' +
    '.nhbar__bal--neg{color:var(--red)}' +
    '.nhbar__bal--pos{color:var(--green)}' +
    '.nhbar__date{color:var(--muted)}' +
    '.nhbar__week{font-family:"Space Mono",monospace;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:8px 14px;border-radius:10px;border:1px solid var(--line);background:var(--chip);color:var(--soft);cursor:not-allowed}' +
    '.nhbar__week--live{background:var(--indigo);border-color:var(--indigo);color:#fff;cursor:pointer}' +
    '.nhbar__week--live:hover{filter:brightness(1.08)}' +
    '.nhbar__week--pulse{animation:gd-pulse 1.5s ease-in-out infinite}' +
    '.nhbar__theme{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:var(--surface);color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:color .15s,border-color .15s}' +
    '.nhbar__theme:hover{color:var(--ink);border-color:var(--soft)}' +
    '.nhbar__theme svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '.nhbar__theme .ic-sun{display:none}' +
    'html[data-theme="dark"] .nhbar__theme .ic-moon{display:none}' +
    'html[data-theme="dark"] .nhbar__theme .ic-sun{display:inline}' +
    // Gear relocated into the bar: static flow (relative so its dropdown anchors), aligned with the toggle.
    '.nhbar .gear{position:relative;top:auto;right:auto;z-index:50;display:flex}';
  const style = document.createElement('style');
  style.id = 'nhbar-css';
  style.textContent = css;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Guided tutorial — a locked, linear, hybrid walkthrough. The whole script is
// data (GUIDE_STEPS); the engine spotlights the current step's target (a
// 4-rectangle mask dims + blocks everything else), shows a coach-mark, and
// advances on Next or the required action. Progress persists in
// tutorial_state.step so a refresh/return resumes. One source, all pages.
// ---------------------------------------------------------------------------
const GUIDE_STEPS = [
  { page: '/tutorial/home/', target: '.stats', ey: 'Your Party', title: 'Front Sessau',
    body: 'This is your party. You hold 114 seats and 32% approval — that number is your lifeblood.' },
  { page: '/tutorial/home/', target: '.appr', ey: 'Popularity', title: 'Party Approval',
    body: 'It’s climbed to 32%, but a weak coalition and an angry opposition can sink it fast.' },
  { page: '/tutorial/home/', target: '.elec', ey: 'The Clock', title: 'Elections',
    body: 'The election is nine months out. Survive and govern until then.' },
  { page: '/tutorial/home/', target: '.assembly', ey: 'The Numbers', title: 'National Assembly',
    body: 'You + Union Conservatrice = 137 seats, a razor-thin majority. Lose UC and you lose power.' },
  { page: '/tutorial/home/', target: '.nav__i[href="/tutorial/nation/"], .botnav__i[href="/tutorial/nation/"]',
    ey: 'Next', title: 'Your Government', body: 'Now let’s see how your government is actually doing.',
    nav: '/tutorial/nation/', cta: 'Government →', pulse: true },

  // Chapter 2 — The Government
  { page: '/tutorial/nation/', target: '.gd-coalition', ey: 'Coalition', title: 'Coalition Health',
    body: 'Your coalition is still strong, but one of UC’s demands — not eclipsing $180 bn in debt — was broken. That’s the empty third heart. Let’s try not to break any more promises.' },
  { page: '/tutorial/nation/', target: '.gd-agreement', ey: 'The Bargain', title: 'Coalition Agreement',
    body: 'Every coalition has a price. UC already paid you 10 Influence to seal the deal — now they want their half: cut the tax burden 10%. It’s overdue, and if they walk, the opposition gets its vote of no confidence.' },
  { page: '/tutorial/nation/', target: '.gd-laws', ey: 'In Progress', title: 'Laws Being Implemented',
    body: 'Laws take time to bite. Your Federal Police Budget is still phasing in — three months out. It costs ₣16.2bn a year, but it buys you Order.' },
  { page: '/tutorial/nation/', target: '.gd-hog', ey: 'The Nation', title: 'The State of the Nation',
    body: 'This is your nation, ministry by ministry. Head of Government already tells the story — a deficit and shrinking growth. Expand the rest to see where you’re bleeding.' },
  { page: '/tutorial/nation/', target: '.nav__i[href="/tutorial/legislature/"], .botnav__i[href="/tutorial/legislature/"]',
    ey: 'Next', title: 'The Floor', body: 'The coalition’s next fight is already on the Assembly floor. Time to cast your first vote.',
    nav: '/tutorial/legislature/', cta: 'Legislature →', pulse: true },

  // Chapter 3 — The Floor Vote
  { page: '/tutorial/legislature/', target: '.gd-floor', ey: 'On the Floor', title: 'Abolish the Civil Service Pension',
    body: 'Proposed by Union Conservatrice — your own coalition partner. Vote no and you hurt the coalition further; vote yes and you anger the people of Sessau. 240 seats sit in the Assembly, and <b>121</b> carry a bill.' },
  { page: '/tutorial/legislature/', target: '.gd-floor .votes', ey: 'Count the Seats', title: 'Reading the Room',
    body: 'UC proposed it, so they vote Yes: 23. Parti Socialiste won’t gut a workers’ pension: 103 No. That leaves your <b>114 seats</b> to decide it — and right now you’ve Abstained, which loses.' },
  { page: '/tutorial/legislature/', target: '#voteYes', ey: 'Your Call', title: 'Cast Your Vote',
    body: 'There’s no clean answer here. Vote Yes to hold the coalition together — and take the hit with the public. Watch the tally move.', requires: 'vote', pulse: true },
  { page: '/tutorial/legislature/', target: '.gd-floor .tally', ey: 'Carried', title: 'It Passes',
    body: '137 to 103 — the bill clears the floor. The pension is abolished: the treasury saves ₣23.1bn and bureaucracy falls, but poverty climbs and the public is furious. You kept UC — at a price.' },
  { page: '/tutorial/legislature/', target: '.gd-committee', ey: 'Up Next', title: 'In Committee',
    body: 'Les Verts want to abolish the alcohol tax — popular, but it blows a ₣2.2bn hole in revenue. Bills like this need your endorsement to reach the floor. A decision for another day.' },
  { page: '/tutorial/legislature/', target: '.nav__i[href="/tutorial/inbox/"], .botnav__i[href="/tutorial/inbox/"]',
    ey: 'Next', title: 'The Chamber Talks Back', body: 'Passing that bill makes friends and enemies. Let’s see who’s writing to you.',
    nav: '/tutorial/inbox/', cta: 'Inbox →', pulse: true },

  // Chapter 4 — The Inbox
  { page: '/tutorial/inbox/', target: '#threadList', ey: 'Your Inbox', title: 'The Chamber Talks Back',
    body: 'Every party, minister, and lobby reaches you here. A bold subject line is unread — and carrying that pension bill already earned you three replies.' },
  { page: '/tutorial/inbox/', target: '.mail__view', ey: 'An Ally', title: 'Union Conservatrice',
    body: 'Your coalition partner. They congratulate you on the vote — then remind you the tax cut is overdue and the debt has broken $180 bn. Allies keep score too.' },
  { page: '/tutorial/inbox/', target: '.reply__opts', ey: 'Your Call', title: 'You Don’t Type — You Decide',
    body: 'Pick a reply. Reassure them the cut is coming, push back that the deficit can’t bear it, or stall. Each answer costs you something different.', requires: 'reply', pulse: true },
  { page: '/tutorial/inbox/', target: '.reply__done', ey: 'On the Record', title: 'Words Have Weight',
    body: 'Your reply is sent, and the effect is logged right there. This is how every relationship in Sessau is managed — one message at a time.' },
  { page: '/tutorial/inbox/', target: '.thr[data-id="pss"]', ey: 'The Opposition', title: 'Not Everyone’s Happy',
    body: 'Parti Socialiste is furious about the pension cut and rattling that motion of no confidence. You can’t please everyone — and you shouldn’t try. Some fights are worth having.' },
  { page: '/tutorial/inbox/', target: '.nav__i[href="/tutorial/news/"], .botnav__i[href="/tutorial/news/"]',
    ey: 'Next', title: 'The Country Is Watching', body: 'Your inbox is private. The papers aren’t. Let’s see how Sessau is covering the fight.',
    nav: '/tutorial/news/', cta: 'News →', pulse: true },

  // Chapter 5 — The Press (read-only)
  { page: '/tutorial/news/', target: '.ticker', ey: 'The Press', title: 'The Heartbeat of the Nation',
    body: 'The news is the pulse of Sessau — the ticker, the papers, the polls. It’s where the country reacts to what you do. And right now the signs are flashing: debt past ₣192bn, growth at −2.3%, approval stuck at 32%. The press won’t let you forget a single one.' },
  { page: '/tutorial/news/', target: '.outlets', ey: 'Spin', title: 'No Neutral Truth',
    body: 'The same story, three ways — the left calls the pension cut cruelty, the centre counts the cost, and your nationalist base calls it strength. There’s no view from nowhere in Sessau. Learn to read the spin, because the voters do.' },

  // Turn 1 close — hand the loop to the player
  { page: '/tutorial/news/', target: '.nhbar', ey: 'The Week Ahead', title: 'Advance the Week',
    body: 'This bar rides with you everywhere: your Influence to spend, the nation’s budget balance, the date, and the button that moves time. You’ve read your nation, governed, legislated, answered the chamber, and faced the press — that’s a week in Sessau. Let’s advance the week.',
    enableWeek: true, pulse: true },

  // Turn 2 — the week has advanced; the guided tour continues
  { page: '/tutorial/home/', target: '.nhbar__date', ey: 'Week Two', title: 'A New Week',
    body: 'January, 1980. You advanced the week and Sessau moved with you. The date has rolled forward, and every choice you made last week has now taken effect.' },
  { page: '/tutorial/home/', target: '.appr__factors', ey: 'The Mark', title: 'The Fallout Lands',
    body: 'Abolishing the pension cost you nine points — approval fell to 23%, logged right here under Party Approval as a Last Factor. Nothing you do in Sessau is free.' },
  { page: '/tutorial/home/', target: '.nhbar__bal', ey: 'The Ledger', title: 'The Other Side',
    body: 'But the ₣23bn you saved swung the budget into surplus — up top, in green. This is the whole game: every choice trades one number for another.' },

  // Turn 2 — the alcohol tax: the first choice that is truly the player's
  { page: '/tutorial/home/', target: '.nav__i[href="/tutorial/legislature/"], .botnav__i[href="/tutorial/legislature/"]',
    ey: 'Next', title: 'A Way Back', body: 'Your approval is bleeding at 23%. There’s a bill in committee the public loves — and this time, the call is yours. Head to the floor.',
    nav: '/tutorial/legislature/', cta: 'Legislature →', pulse: true },
  { page: '/tutorial/legislature/', target: '.gd-committee', ey: 'The Bill', title: 'Abolish the Alcohol Tax',
    body: 'Les Verts want the alcohol tax gone, and most of Sessau agrees. You didn’t get to choose on the pension — the coalition forced your hand. This one you own.' },
  { page: '/tutorial/legislature/', target: '#acEndorse', ey: 'Your Choice', title: 'Endorse — or Don’t',
    body: 'Endorse it and Les Verts may choose to advance it to the floor — where, if it passes, the public rewards you but ₣2.2bn leaves your budget. Your backing doesn’t carry it alone; it’s theirs to move. Leave it and keep your books, with approval where it is. No wrong answer — decide, then continue.', pulse: true },
  { page: '/tutorial/legislature/', target: '.nhbar', ey: 'The Week Ahead', title: 'See It Through',
    body: 'Your call on the alcohol tax is made — approval or the budget, you can rarely serve both, and that’s the whole job. If you endorsed it and Les Verts carry it through, the public rewards you (+approval) and the treasury pays the bill (−₣2.2bn). Hit Next Week and advance.',
    enableWeek: true, pulse: true },

  // Turn 3 — the alcohol result is in; the election tightens
  { page: '/tutorial/home/', target: '.appr__factors', ey: 'On the Record', title: 'It Landed',
    body: 'There’s your alcohol call, logged above. Endorse it and approval clawed back while the treasury took the hit; leave it and your books held. Either way the wheel turns — advance once more.',
    enableWeek: true, pulse: true },
  { page: '/tutorial/home/', target: '.nav__i[href="/tutorial/election/"], .botnav__i[href="/tutorial/election/"]',
    ey: 'Six Months Out', title: 'The Clock Tightens', body: 'The election is now six months away — and the Election tab is lit. Before you fight the next one, see how you won the last. Head there.',
    nav: '/tutorial/election/', cta: 'Election →', pulse: true },
  { page: '/tutorial/election/', target: '.gd-lastelec', ey: 'How You Got Here', title: 'The 1977 Election',
    body: 'This is the vote that built today’s Assembly. Front Sessau took 114 of 240 seats — a plurality, not the 121 needed to govern alone, which is exactly why you needed Union Conservatrice. In six months, you defend it.' },
];

let guideStep = 0, guideEls = null, guideReposition = null, guideGate = null, guideGateEvent = null;

async function mountGuide() {
  const path = location.pathname;
  if (!GUIDE_STEPS.some((s) => s.page === path)) return; // no steps on this page
  try {
    if (isConfigured) {
      const user = await requireUser();
      if (!user) return;
      const p = await getTutorialProgress(user.id);
      guideStep = (p && p.step) || 0;
    } else {
      guideStep = Number(sessionStorage.getItem('nh-guide-step') || 0); // local dev fallback
    }
  } catch (e) { return; } // couldn't read progress — don't lock the screen behind a mask
  const begin = () => { const s = GUIDE_STEPS[guideStep]; if (s && s.page === path) renderGuideStep(); };
  // On Home the welcome modal blocks first; it sets nhWelcomeDone + fires
  // nhtutorial:begin in both branches (dismiss or already-seen). Cover the race either way.
  const w = document.getElementById('welcome');
  if (path === '/tutorial/home/' && w) {
    if (window.nhWelcomeDone) begin();
    else window.addEventListener('nhtutorial:begin', begin, { once: true });
  } else {
    begin();
  }
}

function persistStep(n) {
  if (isConfigured) return updateProfile({ tutorial_step: n });    // → tutorial_state.step (Promise)
  try { sessionStorage.setItem('nh-guide-step', String(n)); } catch (e) {}
  return Promise.resolve(true);
}

function clearGuide() {
  if (guideReposition) { window.removeEventListener('resize', guideReposition); guideReposition = null; }
  if (guideGate) { window.removeEventListener(guideGateEvent, guideGate); guideGate = null; guideGateEvent = null; }
  if (guideEls) { guideEls.forEach((el) => el.remove()); guideEls = null; }
  const wk = document.querySelector('.nhbar__week--pulse');
  if (wk) wk.classList.remove('nhbar__week--pulse'); // stop the nudge; the button stays live
  document.body.style.overflow = '';
}

function advanceGuide() {
  clearGuide();
  guideStep += 1;
  persistStep(guideStep);
  const s = GUIDE_STEPS[guideStep];
  if (s && s.page === location.pathname) renderGuideStep(); // next mark on this page; else the tour continues elsewhere
}

function firstVisible(sel) {
  const els = document.querySelectorAll(sel);
  for (let i = 0; i < els.length; i++) if (els[i].offsetParent !== null || els[i].getClientRects().length) return els[i];
  return els[0] || null;
}

function renderGuideStep() {
  ensureGuideStyles();
  const s = GUIDE_STEPS[guideStep];
  // Let the page reveal a target that may be hidden on this viewport before we
  // locate it (e.g. the inbox reading pane is display:none on mobile until a
  // thread is opened). Dispatched synchronously so any DOM change lands first.
  window.dispatchEvent(new CustomEvent('nhtutorial:beforestep', { detail: { step: guideStep, target: s.target } }));
  const target = firstVisible(s.target);
  if (!target) return; // target missing (page still building?) — don't lock the screen
  // Turn-close beat: un-grey Next Week; a real push advances the turn and tour.
  if (s.enableWeek) {
    const wk = document.querySelector('.nhbar__week');
    if (wk) {
      wk.removeAttribute('disabled');
      wk.classList.add('nhbar__week--live', 'nhbar__week--pulse');
      wk.onclick = async () => {
        wk.onclick = null;                    // guard against a double push
        await persistStep(guideStep + 1);     // advance the tour into Turn 2's first beat (guide step IS re-hydrated cross-session)
        advanceTutorialWeek();                // Dec 1979 → Jan 1980, apply the vote's fallout (sessionStorage)
        window.location.href = '/tutorial/home/'; // land on Home so the tour continues on the fallout
      };
    }
  }
  target.scrollIntoView({ block: 'center', inline: 'nearest' });
  document.body.style.overflow = 'hidden';

  const parts = [0, 1, 2, 3].map(() => { const d = document.createElement('div'); d.className = 'gd-mask'; document.body.appendChild(d); return d; });
  const ring = document.createElement('div'); ring.className = 'gd-ring' + (s.pulse ? ' gd-pulse' : ''); document.body.appendChild(ring);
  const call = document.createElement('div'); call.className = 'gd-call';
  // A `requires` step is action-gated (advance on nhtutorial:<requires>); an
  // `enableWeek` step is button-driven (the topbar Next Week does the advance).
  // Both replace the coach-mark's Next button with a passive "waiting" prompt.
  const cta = (s.requires || s.enableWeek)
    ? '<span class="gd-call__wait">Waiting for you…</span>'
    : '<button class="gd-call__btn" type="button">' + (s.cta || 'Next') + '</button>';
  call.innerHTML =
    '<div class="gd-call__ey">' + (s.ey || 'Tutorial') + '</div>' +
    '<div class="gd-call__t">' + s.title + '</div>' +
    '<div class="gd-call__b">' + s.body + '</div>' +
    '<div class="gd-call__row"><span class="gd-call__prog">' + (guideStep + 1) + ' / ' + GUIDE_STEPS.length + '</span>' + cta + '</div>';
  document.body.appendChild(call);
  guideEls = parts.concat([ring, call]);

  guideReposition = () => positionGuide(target, parts, ring, call);
  guideReposition();
  window.addEventListener('resize', guideReposition);

  let advancing = false; // lock: the nav item and the CTA both call go()
  const go = async () => {
    if (advancing) return;
    advancing = true;
    if (guideGate) { window.removeEventListener(guideGateEvent, guideGate); guideGate = null; guideGateEvent = null; }
    if (s.nav) { await persistStep(guideStep + 1); window.location.href = s.nav; } // hand-off: persist BEFORE leaving, or the next page reads a stale step and the chapter never starts
    else advanceGuide();
  };
  if (s.requires) {
    // Advance only when the page reports the real action was carried out.
    guideGate = () => go();
    guideGateEvent = 'nhtutorial:' + s.requires;
    window.addEventListener(guideGateEvent, guideGate, { once: true });
  } else if (!s.enableWeek) {
    // enableWeek has no Next button — the topbar Next Week (wired above) advances.
    call.querySelector('.gd-call__btn').addEventListener('click', go);
  }
  if (s.nav) target.addEventListener('click', (e) => { e.preventDefault(); go(); }, { once: true });
}

function positionGuide(target, parts, ring, call) {
  const r = target.getBoundingClientRect();
  const pad = 6, vw = window.innerWidth, vh = window.innerHeight;
  const x = Math.max(0, r.left - pad), y = Math.max(0, r.top - pad);
  const w = Math.min(vw, r.right + pad) - x, h = Math.min(vh, r.bottom + pad) - y;
  const set = (el, l, t, ww, hh) => { el.style.left = l + 'px'; el.style.top = t + 'px'; el.style.width = Math.max(0, ww) + 'px'; el.style.height = Math.max(0, hh) + 'px'; };
  set(parts[0], 0, 0, vw, y);                       // top
  set(parts[1], 0, y + h, vw, vh - y - h);          // bottom
  set(parts[2], 0, y, x, h);                        // left
  set(parts[3], x + w, y, vw - x - w, h);           // right
  set(ring, x, y, w, h);
  const cw = Math.min(320, vw - 24);
  call.style.width = cw + 'px';
  call.style.left = Math.min(Math.max(12, r.left), vw - cw - 12) + 'px';
  call.style.top = '0px';                            // measure height first
  const ch = call.offsetHeight;
  call.style.top = ((y + h + 12 + ch < vh) ? (y + h + 12) : Math.max(12, y - 12 - ch)) + 'px';
}

let guideStyled = false;
function ensureGuideStyles() {
  if (guideStyled) return;
  guideStyled = true;
  const css =
    '.gd-mask{position:fixed;background:rgba(21,21,27,.55);z-index:300}' +
    '.gd-ring{position:fixed;z-index:301;border-radius:12px;pointer-events:none;outline:2px solid var(--indigo);box-shadow:0 0 0 3px color-mix(in srgb,var(--indigo) 35%,transparent)}' +
    '.gd-pulse{animation:gd-pulse 1.5s ease-in-out infinite}' +
    '@keyframes gd-pulse{0%,100%{box-shadow:0 0 0 3px color-mix(in srgb,var(--indigo) 35%,transparent)}50%{box-shadow:0 0 0 9px color-mix(in srgb,var(--indigo) 12%,transparent)}}' +
    '.gd-call{position:fixed;z-index:303;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px 18px;box-shadow:0 24px 60px -20px rgba(0,0,0,.5)}' +
    '.gd-call__ey{font-family:"Space Mono",monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--indigo);margin-bottom:6px}' +
    '.gd-call__t{font-size:16px;font-weight:800;letter-spacing:-.01em;color:var(--ink);margin-bottom:6px}' +
    '.gd-call__b{font-size:13.5px;line-height:1.55;color:var(--muted);margin-bottom:14px}' +
    '.gd-call__row{display:flex;align-items:center;justify-content:space-between;gap:10px}' +
    '.gd-call__prog{font-family:"Space Mono",monospace;font-size:10px;letter-spacing:.06em;color:var(--soft)}' +
    '.gd-call__btn{font-family:"Space Mono",monospace;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:var(--indigo);color:#fff;border:none;border-radius:9px;padding:9px 14px;cursor:pointer}' +
    '.gd-call__btn:hover{filter:brightness(1.08)}' +
    '.gd-call__wait{font-family:"Space Mono",monospace;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--indigo)}';
  const style = document.createElement('style');
  style.id = 'gd-css';
  style.textContent = css;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Shared game-clock + weekly-action widget (top-right on every in-game screen)
// ---------------------------------------------------------------------------
// One source of truth for the current week and the actions a player has left,
// so every page agrees. The home screen renders these inline in its own header;
// every other in-game screen gets them from mountTopbar() below.
export const DEFAULT_WEEK = 22; // the tutorial opens on week 22
export const PARTY_ACTIONS = 3;

// Qualitative stat ladders live in one shared module now (the online nation pages
// read them too). Re-exported here so existing tutorial imports keep working.
export { STAT_LADDERS, statLabel } from '/ladders.js';

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
    '<a class="gw-nudge__btn" href="/tutorial/party/">Go to Party Page &#9656;</a></div>';
}

// The party's prominent politicians — the single source of roster data, read by
// the Party page table and by each politician's page. Stats are [CHA, ACU, GUI,
// RES, COM]. Théo keeps a bespoke page (the Labour Talks tutorial lives there);
// everyone else renders on the generic /party/politician/ page.
export const POLITICIANS = [
  { id: 'droulez', name: 'Allen Droulez', age: 49, role: 'Prime Minister',   exp: 9, stats: [4, 3, 2, 4, 3], busy: 'the premiership',      free: false },
  { id: 'seve',    name: 'Margot Sève',   age: 56, role: 'Deputy Leader',    exp: 6, stats: [3, 5, 2, 3, 4], busy: 'Economic Development', free: false },
  { id: 'theo',    name: 'Théo Lefèvre',  age: 61, role: 'Interior Minister', exp: 1, stats: [2, 3, 4, 4, 4], busy: 'Labour Unrest', free: false, scandal: true, page: '/tutorial/party/theolefevre/' },
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
// <main> or a bar is already present. Next Week is wired via wireNextWeek →
// advanceWeek (confirm, then advance + reload), same as the home screen.
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

// logout now lives in the shared client module (used by the online game too).
// Re-exported so existing tutorial imports keep working.
export { logout } from '/supabase.js';

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
