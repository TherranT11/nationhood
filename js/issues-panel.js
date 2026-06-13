// issues-panel.js — shared "Issues" panel (SINGLE SOURCE OF TRUTH).
//
// One implementation, mounted identically on:
//   • army-operations.html  → Army ▸ Operations ▸ "Issues"   (military faction)
//   • nation.html           → Nation ▸ "Issues"              (the player's nation)
// Both call mountIssuesPanel() with a null heading, so the two surfaces can never
// diverge. Do NOT copy this markup/CSS into a page — extend it here.
//
// Renders the world's ongoing bilateral_issues as an expand-in-place list. The
// viewer's role per dispute is derived from the data:
//   Claimant = administering_nation_id (holds the ground)
//   Pressor  = initiative_nation_id    (pressed the claim)
//   Third party = anyone else
//
// LIVE: combatants + matchup + roles + region + the decision CLOCK, plus the
// pressor's levers/doors (soften, press harder, extend, go to war, back down)
// and the claimant's concede — all reading/writing live data via RPCs.
// STILL INERT (own later pass): third-party STANCES and the head-of-state CHAT,
// plus the claimant's Offer Compromise / Request Mediation — rendered as
// clearly-labelled PREVIEW placeholders (no handlers, no fake state).

import { escapeHtml } from './utils.js';
import { ISSUE_TYPES } from './game/issues.js';
import { broadcastWorldEvent } from './game/event-helpers.js';

// p_stance value → world-news event mapping. 'neutral' is intentionally absent
// (a stance reset is not an action and emits nothing). Used by the set_issue_stance
// click handler below; kept at module scope so the table isn't rebuilt per click.
const STANCE_EVENTS = {
  mediate: {
    eventName: 'Mediation Offered',
    triggerKey: 'dispute_mediate_offered',
    line: (my, p, c) => `${my} has offered to mediate the conflict between ${p} and ${c}.`,
  },
  condemn_pressor: {
    eventName: 'Dispute Condemnation',
    triggerKey: 'dispute_condemn_pressor',
    line: (my, p, c) => `${my} has condemned ${p} in the dispute between ${p} and ${c}.`,
  },
  condemn_claimant: {
    eventName: 'Dispute Condemnation',
    triggerKey: 'dispute_condemn_claimant',
    line: (my, p, c) => `${my} has condemned ${c} in the dispute between ${p} and ${c}.`,
  },
  support_pressor: {
    eventName: 'Dispute Support',
    triggerKey: 'dispute_support_pressor',
    line: (my, p, c) => `${my} is supporting ${p} in the dispute between ${p} and ${c}.`,
  },
  support_claimant: {
    eventName: 'Dispute Support',
    triggerKey: 'dispute_support_claimant',
    line: (my, p, c) => `${my} is supporting ${c} in the dispute between ${p} and ${c}.`,
  },
};

// ── helpers ─────────────────────────────────────────────────────────────────

// 2-letter flag glyph from a nation name ("Palvera" → "PA", "Karst Bay" → "KB").
function initials(name) {
  const w = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase();
  return String(name || '?').slice(0, 2).toUpperCase();
}

// Category badge from issue_type. Falls back to a prettified type name.
function typeBadge(type) {
  const s = String(type || '').toLowerCase();
  if (s.includes('fish'))                          return { cls: 'fishing', label: 'FISHING RIGHTS' };
  if (s.includes('trade') || s.includes('tariff')) return { cls: 'trade',   label: 'TRADE ACCESS' };
  if (s.includes('territor') || s.includes('border') || s.includes('basin'))
    return { cls: '', label: 'TERRITORIAL' };
  const nm = ISSUE_TYPES[type]?.name;
  return { cls: '', label: (nm || s.replace(/_/g, ' ') || 'dispute').toUpperCase() };
}

// claimant = administering nation (falls back to nation_a); pressor = initiative
// nation (falls back to whichever side isn't the claimant).
function rolesOf(issue) {
  const claimantId = issue.administering_nation_id || issue.nation_a_id;
  const pressorId  = issue.initiative_nation_id
    || (claimantId === issue.nation_a_id ? issue.nation_b_id : issue.nation_a_id);
  const nameOf = (nid) => nid === issue.nation_a_id ? issue.nation_a?.name
                        : nid === issue.nation_b_id ? issue.nation_b?.name
                        : null;
  return {
    claimantId, pressorId,
    claimantName: nameOf(claimantId) || 'Unknown',
    pressorName:  nameOf(pressorId)  || 'Unknown',
  };
}

function viewerRole(issue, nationId, roles) {
  if (nationId && nationId === roles.claimantId) return 'claimant';
  if (nationId && nationId === roles.pressorId)  return 'pressor';
  return 'third';
}

function regionText(issue) {
  return issue.contested_region_name || 'the contested area';
}

// "What's at stake" — staked resource + the population headcount at risk, e.g.
// "2 Farmland · 847,000 people". claimantPop = the claimant's current population.
function stakeText(issue, claimantPop) {
  const parts = [];
  const q = Number(issue.stake_quantity);
  const res = String(issue.stake_resource || '').trim();
  if (res && Number.isFinite(q) && q > 0) parts.push(`${q} ${res.charAt(0).toUpperCase()}${res.slice(1)}`);
  const pct = Number(issue.population_stake_pct);
  if (Number.isFinite(pct) && pct > 0 && Number.isFinite(claimantPop) && claimantPop > 0) {
    parts.push(`${Math.round(claimantPop * pct / 100).toLocaleString()} people`);
  }
  return parts.join(' · ');
}

// The pressor's demand ladder for territorial disputes — single source of truth
// for rung labels + copy (the DB stores only demand_rung 1-4). `desc` takes the
// already-escaped region / claimant / pressor names.
const RUNGS = [
  { n: 1, name: 'Full Cession',          tag: 'HARDEST YES',
    desc: (r) => `${r} is transferred outright — sovereignty, territory, and resources.` },
  { n: 2, name: 'Administrative Control', tag: '&mdash;',
    desc: (r, c, p) => `${c} keeps nominal sovereignty; ${p} administers ${r} — its laws, police, and institutions.` },
  { n: 3, name: 'Joint Condominium',      tag: 'COMPROMISE',
    desc: (r) => `${r} is governed jointly — shared administration and resource revenue, 50/50.` },
  { n: 4, name: 'Resource Rights',        tag: 'FLOOR &middot; EASIEST YES',
    desc: (r, c, p) => `${c} keeps full sovereignty and governance; ${p} gets a guaranteed share of ${r}'s output.` },
];
const rungOf = (issue) => RUNGS[Math.min(4, Math.max(1, issue.demand_rung || 1)) - 1];

function demandText(issue, region) {
  if (issue.issue_type === 'territorial_ownership') return rungOf(issue).name;
  if (issue.stake_resource) {
    const q = issue.stake_quantity != null ? `${issue.stake_quantity} ` : '';
    return `Claim over ${q}${issue.stake_resource} in ${region}`;
  }
  return `Resolution of ${ISSUE_TYPES[issue.issue_type]?.name || region}`;
}

// Decision clock — ticks until the pressor must resolve or the dispute
// auto-goes to war. null when there is no clock (non-territorial / not set yet).
function ticksLeft(issue, currentTick) {
  if (issue.decision_deadline_tick == null || currentTick == null) return null;
  return Math.max(0, Number(issue.decision_deadline_tick) - Number(currentTick));
}

// Compact "N ticks left" / "WAR IMMINENT" used in the summary row + center.
function clockText(issue, currentTick) {
  const left = ticksLeft(issue, currentTick);
  if (left == null) return '<span class="lab">CLOCK</span> &mdash;';
  if (left <= 0)    return '<span class="lab">CLOCK</span> <b class="imminent">WAR IMMINENT</b>';
  return `<span class="lab">CLOCK</span> ${left} tick${left === 1 ? '' : 's'} left`;
}

// A small pip row (capped) for the center panel, derived from created_tick→deadline.
function clockPips(issue, currentTick) {
  if (issue.decision_deadline_tick == null || issue.created_tick == null || currentTick == null) return '';
  const total = Math.min(12, Math.max(1, Number(issue.decision_deadline_tick) - Number(issue.created_tick)));
  const spent = Math.min(total, Math.max(0, Number(currentTick) - Number(issue.created_tick)));
  let pips = '';
  for (let i = 0; i < total; i++) {
    pips += `<span class="cd-pip ${i < spent ? 'spent' : i === spent ? 'current' : ''}"></span>`;
  }
  return `<div class="cd-ticks">${pips}</div>`;
}

// Inert preview banner reused by every not-yet-built module.
const PREVIEW = (txt) => `<div class="iss-preview">${escapeHtml(txt)}</div>`;

// ── data ──────────────────────────────────────────────────────────────────

// All ongoing bilateral issues (the world's disputes). Role tagging is done
// client-side from administering/initiative against the viewer's nation.
export async function fetchWorldIssues(supabase) {
  if (!supabase) return [];
  const NAME_JOIN = 'nation_a:nations!bilateral_issues_nation_a_id_fkey(id, name), '
                  + 'nation_b:nations!bilateral_issues_nation_b_id_fkey(id, name)';
  // CORE = columns live since Phase A; FULL adds the Phase-B mediation columns.
  // PostgREST rejects the whole query on ANY unknown column, so if a migration
  // hasn't been applied yet we fall back to CORE and the panel still renders
  // (the newer feature just stays dormant) — instead of blanking entirely.
  const CORE = 'id, issue_type, nation_a_id, nation_b_id, administering_nation_id, initiative_nation_id, '
             + 'contested_region_name, stake_resource, stake_quantity, demand_rung, created_tick, '
             + 'decision_deadline_tick, ' + NAME_JOIN;
  const FULL = CORE + ', mediator_nation_id, mediation_offer_nation_id, mediation_accept_a, mediation_accept_b, population_stake_pct';
  for (const cols of [FULL, CORE]) {
    const { data, error } = await supabase
      .from('bilateral_issues')
      .select(cols)
      .in('status', ['active', 'partial', 'escalated'])
      .order('tension', { ascending: false });
    if (!error) return data || [];
    console.warn('[issues-panel] fetch failed, trying narrower columns:', error.message);
  }
  return [];
}

// ── render: summary row ─────────────────────────────────────────────────────

function disputeRow(issue, role, roles, expanded, currentTick, canManage, messagesByIssue, stanceCtx) {
  const badge = typeBadge(issue.issue_type);
  const region = regionText(issue);

  const roleBadge = role === 'claimant' ? { cls: 'role-claimant', txt: 'YOU ARE THE CLAIMANT' }
                  : role === 'pressor'  ? { cls: 'role-pressor',  txt: 'YOU ARE THE PRESSOR' }
                  :                       { cls: 'role-third',     txt: 'THIRD PARTY' };

  const left = ticksLeft(issue, currentTick);
  const clockCls = left != null && left <= 0 ? 'd-clock war' : 'd-clock';
  const summary = `<div class="d-summary">
      <span class="d-chevron">&#9656;</span>
      <span class="d-type ${badge.cls}">${escapeHtml(badge.label)}</span>
      <span class="d-matchup">${escapeHtml(roles.pressorName)} <span class="vs">presses</span> ${escapeHtml(roles.claimantName)} <span class="over">&mdash; over ${escapeHtml(region)}</span></span>
      <span class="d-role ${roleBadge.cls}">${roleBadge.txt}</span>
      <span class="${clockCls}">${clockText(issue, currentTick)}</span>
    </div>`;

  return `<div class="dispute${expanded ? ' expanded' : ''}" data-id="${escapeHtml(issue.id)}">${summary}<div class="d-detail">${disputeDetail(issue, roles, role, region, currentTick, canManage, messagesByIssue, stanceCtx)}</div></div>`;
}

// HTML inside `.issues-content` — the count line + the dispute list. Shared by the
// initial render and the post-action reload so they can't drift.
function buildContent(issues, nationId, expandedId, currentTick, canManage, messagesByIssue, stanceCtx) {
  const tagged = (Array.isArray(issues) ? issues : []).map(it => {
    const roles = rolesOf(it);
    return { issue: it, roles, role: viewerRole(it, nationId, roles) };
  });
  if (!tagged.length) return '<div class="issues-empty">No ongoing issues</div>';
  const involved = tagged.filter(t => t.role !== 'third').length;
  return `<div class="issues-sub">${tagged.length} ONGOING &middot; YOU ARE INVOLVED IN ${involved}</div>`
    + `<div class="disputes">${tagged.map(t => disputeRow(t.issue, t.role, t.roles, t.issue.id === expandedId, currentTick, canManage, messagesByIssue, stanceCtx)).join('')}</div>`;
}

// ── render: shared detail (combatants + stances + role module + chat) ─────────

function disputeDetail(issue, roles, role, region, currentTick, canManage, messagesByIssue, stanceCtx) {
  const youTag = '<span class="you">YOU</span>';
  const aYou = role === 'claimant' ? youTag : '';
  const bYou = role === 'pressor'  ? youTag : '';
  const demandLab = role === 'claimant' ? 'THEY DEMAND' : role === 'pressor' ? 'YOU DEMAND' : 'THE DEMAND';

  const left = ticksLeft(issue, currentTick);
  const claimantPop = stanceCtx && stanceCtx.names && stanceCtx.names.get(roles.claimantId)?.population;
  const stake = issue.issue_type === 'territorial_ownership' ? stakeText(issue, claimantPop) : '';
  // Either belligerent's head of government may rename the region.
  const canEditRegion = canManage && (role === 'claimant' || role === 'pressor')
    && issue.issue_type === 'territorial_ownership';
  const regionLine = issue.issue_type === 'territorial_ownership'
    ? `<div class="dem-region">Cession of <span class="rn">${escapeHtml(region)}</span>`
      + (canEditRegion ? ` <button type="button" class="region-edit" data-region-edit="${escapeHtml(issue.id)}" data-region="${escapeHtml(issue.contested_region_name || '')}" title="Rename the contested region">&#9998;</button>` : '')
      + `</div>`
    : '';
  const combatants = `<div class="combatants">
      <div class="comb a">
        <div class="role">&#9670; CLAIMANT &middot; HOLDS THE GROUND</div>
        <div class="nation"><div class="flag">${escapeHtml(initials(roles.claimantName))}</div><div><div class="nm">${escapeHtml(roles.claimantName)} ${aYou}</div><div class="nsub">Defending ${escapeHtml(region)}</div></div></div>
      </div>
      <div class="comb-center">
        <div class="dem-lab">${demandLab}</div>
        <div class="dem">${escapeHtml(demandText(issue, region))}</div>
        ${stake ? `<div class="dem-stake">What's at Stake: <b>${escapeHtml(stake)}</b></div>` : ''}
        ${regionLine}
        ${clockPips(issue, currentTick)}
        <div class="clk${left != null && left <= 0 ? ' war' : ''}">${clockText(issue, currentTick)}</div>
      </div>
      <div class="comb b">
        <div class="role">PRESSOR &middot; PRESSES THE CLAIM &#9670;</div>
        <div class="nation"><div class="flag">${escapeHtml(initials(roles.pressorName))}</div><div><div class="nm">${escapeHtml(roles.pressorName)} ${bYou}</div><div class="nsub">Demanding ${escapeHtml(region)}</div></div></div>
      </div>
    </div>`;

  const others = otherNationsBlock(issue, roles, stanceCtx);
  const medBox = mediationBox(issue, roles, role, canManage, stanceCtx);

  const roleModule = role === 'claimant' ? claimantZone(issue, canManage)
                   : role === 'pressor'  ? pressorZone(issue, region, roles, canManage)
                   :                       thirdPartyZone(roles, issue, stanceCtx);

  // The channel is for the two belligerent nations + the seated mediator nation.
  // Belligerent nations read (HoG writes); the mediator nation reads, its FM/HoG write.
  const myNation = stanceCtx && stanceCtx.nationId;
  const mediator = issue.mediator_nation_id || null;
  const isMediatorNation = !!(mediator && myNation === mediator);
  const showChat = role === 'claimant' || role === 'pressor' || isMediatorNation;
  const canChatWrite = (canManage && (role === 'claimant' || role === 'pressor'))
    || (mediator && stanceCtx && (stanceCtx.governed === mediator || stanceCtx.fmNation === mediator));
  const msgs = messagesByIssue && typeof messagesByIssue.get === 'function' ? messagesByIssue.get(issue.id) : null;
  const chat = showChat ? chatChannel(issue, myNation, canChatWrite, msgs, stanceCtx && stanceCtx.names) : '';
  return combatants + medBox + others + roleModule + chat;
}

// ── role modules (inert previews) ────────────────────────────────────────────

// Claimant role module. For territorial disputes, Concede (concede_claim) and
// Stand Strong are LIVE — but only for the head of government (canManage);
// everyone else sees a read-only view. Offer Compromise + Request Mediation stay
// inert previews. Non-territorial claimant views stay inert.
function claimantZone(issue, canManage) {
  if (issue.issue_type !== 'territorial_ownership') {
    return `<div class="claimant-zone"><div class="cz-actions">
      <div class="lab">CLAIMANT &mdash; YOUR NATION'S OPTIONS</div>
      ${PREVIEW('Claimant actions for this issue type are not yet active.')}
    </div></div>`;
  }
  const id = escapeHtml(issue.id);
  if (!canManage) {
    return `<div class="claimant-zone"><div class="cz-actions">
      <div class="lab">CLAIMANT &mdash; YOUR NATION'S OPTIONS</div>
      <div class="cz-grid iss-inert">
        <div class="cza concede"><div class="cn">Concede</div><div class="cd">Accept the demand. The dispute ends in the pressor's favour.</div></div>
        <div class="cza stand"><div class="cn">Stand Strong</div><div class="cd">Hold the ground and let the clock run.</div></div>
        <div class="cza compromise"><div class="cn">Offer Compromise</div><div class="cd">Table a counter-offer. Not yet active.</div></div>
        <div class="cza mediate"><div class="cn">Request Mediation</div><div class="cd">Bring in a broker. Not yet active.</div></div>
      </div>
      <div class="iss-note">Only the head of government can decide this dispute.</div>
    </div></div>`;
  }
  return `<div class="claimant-zone">
    <div class="cz-actions">
      <div class="lab">YOUR OPTIONS AS THE CLAIMANT</div>
      <div class="cz-grid">
        <button type="button" class="cza concede" data-action="concede" data-id="${id}"><div class="cn">Concede</div><div class="cd">Accept the demand. The dispute ends in the pressor's favour.</div></button>
        <button type="button" class="cza stand"><div class="cn">Stand Strong</div><div class="cd">Hold the ground and let the clock run. (No action needed.)</div></button>
        <div class="cza compromise iss-inert"><div class="cn">Offer Compromise</div><div class="cd">Table a counter-offer. Not yet active.</div></div>
        <div class="cza mediate iss-inert"><div class="cn">Request Mediation</div><div class="cd">Bring in a broker. Not yet active.</div></div>
      </div>
      <div class="iss-error" hidden></div>
    </div>
  </div>`;
}

// Pressor role module — LIVE for territorial disputes: the demand ladder reads
// demand_rung; soften / press_harder / extend_deadline / drop (back
// down) call their RPCs (wired in mountIssuesPanel, with a busy-lock). For any
// other issue type there is no ladder yet, so it stays an inert preview.
function pressorZone(issue, region, roles, canManage) {
  if (issue.issue_type !== 'territorial_ownership') {
    return `<div class="pressor-zone"><div class="pz-ladder">
      <div class="lab">YOUR MOVES</div>
      ${PREVIEW('Pressor actions for this issue type are not yet active.')}
    </div></div>`;
  }
  const cur = rungOf(issue).n;
  const r = escapeHtml(region), c = escapeHtml(roles.claimantName), p = escapeHtml(roles.pressorName);
  const rungs = RUNGS.map(rung => {
    const cls = rung.n < cur ? 'rung past' : rung.n === cur ? 'rung current' : 'rung';
    const floor = rung.n === 4 ? ' floor' : '';
    const tag = rung.n < cur ? 'WITHDRAWN' : rung.n === cur ? 'CURRENT' : rung.tag;
    return `<div class="${cls}${floor}"><span class="dot"></span><span class="rname">${escapeHtml(rung.name)}</span>`
         + `<span class="rdesc">${rung.desc(r, c, p)}</span><span class="rtag">${tag}</span></div>`;
  }).join('');
  const id = escapeHtml(issue.id);
  // Non-HoG viewers see the standing demand read-only — no levers or doors.
  if (!canManage) {
    return `<div class="pressor-zone"><div class="pz-ladder">
      <div class="lab">CURRENT DEMAND</div>
      <div class="ladder-rungs">${rungs}</div>
      <div class="iss-note">Only the head of government can act on this dispute.</div>
    </div></div>`;
  }
  const soften = cur < 4
    ? `<button type="button" class="iss-btn soften" data-action="soften" data-id="${id}">&#9662; Soften one rung &mdash; smaller prize, easier yes (cannot be undone)</button>`
    : `<div class="iss-note">At the floor. The only move left is to back down.</div>`;
  return `<div class="pressor-zone">
    <div class="pz-ladder">
      <div class="lab">YOUR DEMAND &mdash; SOFTEN TO MAKE A "YES" EASIER</div>
      <div class="ladder-rungs">${rungs}</div>
      ${soften}
    </div>
    <div class="pz-levers">
      <div class="lab">YOUR MOVE &mdash; WORK THE CLOCK</div>
      <div class="lever-grid">
        <button type="button" class="iss-lever" data-action="press_harder" data-id="${id}"><div class="ln">Press Harder</div><div class="ld">Burn one tick off the clock &mdash; tighten the screw.</div></button>
        <button type="button" class="iss-lever" data-action="extend" data-id="${id}"><div class="ln">Extend Deadline <span class="cost">&minus;8 Appr</span></div><div class="ld">Add 2 ticks. Your public tires of the delay.</div></button>
      </div>
    </div>
    <div class="pz-doors">
      <div class="lab">AT THE DEADLINE</div>
      <div class="doors">
        <button type="button" class="door back" data-action="drop" data-id="${id}"><div class="dn">Back Down</div><div class="dc">Drop the claim &mdash; &minus;25 approval, +10 unrest, 360-tick re-press cooldown.</div></button>
      </div>
    </div>
    <div class="iss-error" hidden></div>
  </div>`;
}

// Third-party role module: the five intervention options. Inert preview — the
// stance system isn't built. NOTE: mediation is a future sub-role — when a third
// party offers to mediate and BOTH principals accept, they become the issue's
// single mediator (role 'med'), which is what unlocks the chat panel below for
// them. Until that system lands, no viewer resolves to 'med'.
// One nation's stance toward the dispute, as a display string.
function stanceLabel(stance, roles, isMediator) {
  if (isMediator) return 'Mediating';
  switch (stance) {
    case 'support_claimant': return `Supporting ${escapeHtml(roles.claimantName)}`;
    case 'support_pressor':  return `Supporting ${escapeHtml(roles.pressorName)}`;
    case 'condemn_claimant': return `Condemning ${escapeHtml(roles.claimantName)}`;
    case 'condemn_pressor':  return `Condemning ${escapeHtml(roles.pressorName)}`;
    case 'mediate':          return 'Offered to mediate';
    default:                 return 'Neutral &middot; no position';
  }
}

// OTHER NATIONS — every nation that isn't a belligerent, with its stance.
function otherNationsBlock(issue, roles, ctx) {
  const names = ctx && ctx.names;
  const stanceList = (ctx && ctx.stances && typeof ctx.stances.get === 'function' && ctx.stances.get(issue.id)) || [];
  const stanceByNation = new Map(stanceList.map(s => [s.nation_id, s.stance]));
  const belligerents = new Set([issue.nation_a_id, issue.nation_b_id]);
  let rows = '';
  if (names && names.size) {
    for (const [nid, nm] of names) {
      if (belligerents.has(nid)) continue;
      const nationName = nm && nm.name || '';
      const stance = stanceByNation.get(nid) || 'neutral';
      const isMediator = issue.mediator_nation_id === nid;
      const you = nid === (ctx && ctx.nationId) ? ' <span class="on-you">&middot; that\'s you</span>' : '';
      rows += `<div class="on-row"><div class="on-flag">${escapeHtml(initials(nationName))}</div>`
            + `<div class="on-name">${escapeHtml(nationName)}</div>`
            + `<div class="on-stance ${isMediator ? 'mediate' : stance}">${stanceLabel(stance, roles, isMediator)}${you}</div></div>`;
    }
  }
  return `<div class="others"><div class="lab">OTHER NATIONS</div>`
       + (rows ? `<div class="on-list">${rows}</div>` : PREVIEW('No other nations on the continent.'))
       + `</div>`;
}

// The accept/reject prompt a belligerent HoG sees while a mediation offer is
// pending. Both must accept (respond_mediation) to seat the mediator (+6 ticks).
function mediationBox(issue, roles, role, canManage, ctx) {
  const offer = issue.mediation_offer_nation_id;
  if (!offer || !canManage || (role !== 'claimant' && role !== 'pressor')) return '';
  const myNation = role === 'claimant' ? roles.claimantId : roles.pressorId;
  const accepted = myNation === issue.nation_a_id ? issue.mediation_accept_a : issue.mediation_accept_b;
  const offerName = escapeHtml((ctx && ctx.names && ctx.names.get(offer)?.name) || 'A nation');
  const id = escapeHtml(issue.id);
  if (accepted) {
    return `<div class="med-box pending"><div class="med-t">You accepted <b>${offerName}</b> as mediator &mdash; awaiting the other side.</div></div>`;
  }
  return `<div class="med-box">
      <div class="med-t"><b>${offerName}</b> has offered to mediate this dispute. If both sides accept, the clock gains 6 ticks and ${offerName} joins the channel.</div>
      <div class="med-acts">
        <button type="button" class="med-btn accept" data-mediate="accept" data-id="${id}">Accept mediator</button>
        <button type="button" class="med-btn reject" data-mediate="reject" data-id="${id}">Reject</button>
      </div>
    </div>`;
}

// Third-party options — LIVE only for the nation's Foreign Minister (set_issue_stance
// enforces the same). Everyone else sees them inert.
function thirdPartyZone(roles, issue, ctx) {
  const a = escapeHtml(roles.claimantName);
  const b = escapeHtml(roles.pressorName);
  const id = escapeHtml(issue.id);
  const canStance = !!(ctx && ctx.fmNation && ctx.fmNation === ctx.nationId);
  const mine = ((ctx && ctx.stances && typeof ctx.stances.get === 'function' && ctx.stances.get(issue.id)) || [])
    .find(s => s.nation_id === (ctx && ctx.nationId))?.stance || 'neutral';
  // Plumb names onto the button so the click handler can build a world-news
  // event description without having to refetch the issue (the handler doesn't
  // close over `roles` / `ctx`). Already-escaped via escapeHtml above.
  const myName = escapeHtml((ctx && ctx.names && ctx.names.get(ctx.nationId)?.name) || '');
  const cell = (key, cls, title, desc) => canStance
    ? `<button type="button" class="tpa ${cls}${mine === key ? ' sel' : ''}" data-stance="${key}" data-id="${id}" data-pressor-name="${b}" data-claimant-name="${a}" data-my-name="${myName}"><div class="tn">${title}</div><div class="td">${desc}</div></button>`
    : `<div class="tpa ${cls}"><div class="tn">${title}</div><div class="td">${desc}</div></div>`;
  const grid = `<div class="tpa-grid${canStance ? '' : ' iss-inert'}">`
    + cell('support_claimant', 'support-a', `Support ${a}`, 'Lend strength &amp; legitimacy to the Claimant.')
    + cell('support_pressor',  'support-b', `Support ${b}`, "Back the Pressor's claim.")
    + cell('condemn_claimant', 'condemn-a', `Condemn ${a}`, "Censure the Claimant's intransigence.")
    + cell('condemn_pressor',  'condemn-b', `Condemn ${b}`, 'Censure the Pressor as an aggressor.')
    + cell('mediate',          'mediate',   'Offer to Mediate', 'Volunteer as broker.')
    + `</div>`;
  const note = canStance
    ? `<div class="tp-note">Changing your stance costs diplomatic standing with the affected nation. Mediation takes effect once both sides accept.</div>`
    : `<div class="tp-note">Your nation's Foreign Minister sets its stance here. Only one mediator per issue.</div>`;
  return `<div class="tp-actions"><div class="lab">YOUR OPTIONS AS A THIRD PARTY</div>${grid}${note}</div>`;
}

// The head-of-government channel. Both belligerent nations' factions READ it
// (gated by RLS on the message table); only the head of government (canManage)
// gets the input — everyone else sees a read-only note. `messages` is this
// issue's rows (oldest first); a viewer's own side's messages sit right.
function chatChannel(issue, myNation, canWrite, messages, names) {
  const msgs = Array.isArray(messages) ? messages : [];
  const nameOf = (nid) => (names && names.get(nid)?.name) || 'Unknown';
  const body = msgs.length
    ? msgs.map(m => {
        return `<div class="msg ${m.sender_nation_id === myNation ? 'me' : 'them'}">`
             + `<div class="who">${escapeHtml(nameOf(m.sender_nation_id))}</div>`
             + `<div class="bubble">${escapeHtml(m.body)}</div>`
             + `<div class="ts">TICK ${Number(m.sent_at_tick) || 0}</div></div>`;
      }).join('')
    : `<div class="ch-empty">No messages yet.</div>`;
  const id = escapeHtml(issue.id);
  const foot = canWrite
    ? `<div class="ch-input"><input type="text" data-chat-input="${id}" maxlength="1000" placeholder="Message the channel…"><button type="button" class="ch-send" data-chat-send="${id}">Send</button></div>`
    : `<div class="ch-note">Only the belligerent heads of government and the accepted mediator can post here.</div>`;
  return `<div class="channel">
    <div class="ch-head"><span class="t">HEAD-OF-STATE CHANNEL</span><span class="secure">&#128274; PRIVATE</span></div>
    <div class="ch-body">${body}</div>
    ${foot}
  </div>`;
}

// ── styles (scoped under .issues-panel so they can't leak into host pages) ────

function ensureStyles() {
  if (document.getElementById('issues-panel-styles')) return;
  const s = document.createElement('style');
  s.id = 'issues-panel-styles';
  s.textContent = `
    .issues-panel__head{font-family:var(--font-mono,monospace);font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-bright,#f0efe6);margin-bottom:12px;}
    .issues-panel .issues-sub{font-size:10px;letter-spacing:0.08em;color:#666;margin-bottom:12px;}
    .issues-panel .issues-empty{padding:30px 22px;text-align:center;font-size:12px;color:rgba(255,255,255,0.34);}
    .issues-panel .iss-preview{font-size:9px;letter-spacing:0.06em;color:#7a6a4a;background:#161208;border:0.5px solid rgba(200,158,110,0.25);padding:6px 10px;border-radius:3px;font-style:italic;}
    .issues-panel .iss-inert{pointer-events:none;opacity:0.55;margin-top:9px;}

    .issues-panel .disputes{display:flex;flex-direction:column;gap:10px;}
    .issues-panel .dispute{background:#0d0d0d;border:0.5px solid rgba(255,255,255,0.08);border-radius:6px;overflow:hidden;}
    .issues-panel .dispute.expanded{border-color:rgba(122,154,171,0.3);}
    .issues-panel .d-summary{display:flex;align-items:center;gap:16px;padding:15px 18px;cursor:pointer;transition:background 0.15s;}
    .issues-panel .d-summary:hover{background:#111;}
    .issues-panel .d-chevron{color:#666;font-size:11px;transition:transform 0.15s;flex-shrink:0;width:12px;}
    .issues-panel .dispute.expanded .d-chevron{transform:rotate(90deg);color:#7a9aab;}
    .issues-panel .d-type{font-size:8px;letter-spacing:0.13em;padding:3px 8px;border-radius:3px;background:#1a1414;color:#c87a7a;flex-shrink:0;}
    .issues-panel .d-type.fishing{background:#11181f;color:#7a9aab;}
    .issues-panel .d-type.trade{background:#1a160d;color:#c89e6e;}
    .issues-panel .d-matchup{flex:1;font-size:13px;color:#fff;font-weight:500;}
    .issues-panel .d-matchup .vs{color:#666;font-weight:400;margin:0 6px;font-style:italic;}
    .issues-panel .d-matchup .over{color:#888;font-weight:400;font-size:12px;}
    .issues-panel .d-role{font-size:9px;letter-spacing:0.1em;padding:3px 9px;border-radius:3px;flex-shrink:0;}
    .issues-panel .role-claimant{background:#11181f;color:#7a9aab;}
    .issues-panel .role-pressor{background:#1a1414;color:#c87a7a;}
    .issues-panel .role-third{background:#161616;color:#888;}
    .issues-panel .d-clock{font-size:10px;color:#888;letter-spacing:0.05em;flex-shrink:0;font-variant-numeric:tabular-nums;}
    .issues-panel .d-clock .lab{color:#666;}

    .issues-panel .d-detail{border-top:0.5px solid rgba(255,255,255,0.06);display:none;}
    .issues-panel .dispute.expanded .d-detail{display:block;}

    .issues-panel .combatants{display:grid;grid-template-columns:1fr auto 1fr;border-bottom:0.5px solid rgba(255,255,255,0.05);}
    .issues-panel .comb{padding:18px;}
    .issues-panel .comb.a{background:#0d0f12;} .issues-panel .comb.b{background:#120d0d;text-align:right;}
    .issues-panel .comb .role{font-size:8px;letter-spacing:0.13em;margin-bottom:11px;}
    .issues-panel .comb.a .role{color:#7a9aab;} .issues-panel .comb.b .role{color:#c87a7a;}
    .issues-panel .comb .nation{display:flex;align-items:center;gap:11px;}
    .issues-panel .comb.b .nation{flex-direction:row-reverse;}
    .issues-panel .comb .flag{width:36px;height:36px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;}
    .issues-panel .comb.a .flag{background:#15202a;border:0.5px solid #3a5a6a;color:#7a9aab;}
    .issues-panel .comb.b .flag{background:#2a1515;border:0.5px solid #6a3a3a;color:#c87a7a;}
    .issues-panel .comb .nm{font-size:16px;color:#fff;font-weight:500;}
    .issues-panel .comb .nm .you{font-size:8px;letter-spacing:0.13em;color:#7a9aab;border:0.5px solid rgba(122,154,171,0.4);padding:2px 6px;border-radius:2px;margin-left:6px;}
    .issues-panel .comb.b .nm .you{color:#c87a7a;border-color:rgba(200,122,122,0.4);}
    .issues-panel .comb .nsub{font-size:9px;color:#777;letter-spacing:0.04em;margin-top:2px;}
    .issues-panel .comb-center{background:#0a0a0a;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-left:0.5px solid rgba(255,255,255,0.05);border-right:0.5px solid rgba(255,255,255,0.05);min-width:170px;}
    .issues-panel .comb-center .dem-lab{font-size:8px;letter-spacing:0.13em;color:#666;margin-bottom:5px;}
    .issues-panel .comb-center .dem{font-size:11px;color:#fff;font-weight:500;text-align:center;line-height:1.4;margin-bottom:11px;}
    .issues-panel .comb-center .clk{font-size:10px;color:#888;text-align:center;}
    .issues-panel .comb-center .dem-stake{font-size:10px;color:#c89e6e;margin-bottom:5px;text-align:center;}
    .issues-panel .comb-center .dem-stake b{color:#e0b888;font-weight:600;}
    .issues-panel .comb-center .dem-region{font-size:10px;color:#888;margin-bottom:9px;text-align:center;line-height:1.5;}
    .issues-panel .comb-center .dem-region .rn{color:#cdd6dc;}
    .issues-panel .region-edit{background:none;border:none;color:#7a9aab;cursor:pointer;font-size:11px;padding:0 2px;font-family:inherit;vertical-align:baseline;}
    .issues-panel .region-edit:hover{color:#9ab4c4;}
    .issues-panel .comb-center .clk .lab{color:#666;display:block;font-size:8px;letter-spacing:0.1em;margin-bottom:2px;}

    .issues-panel .others{padding:14px 18px;background:#0c0c0c;border-bottom:0.5px solid rgba(255,255,255,0.05);}
    .issues-panel .others .lab{font-size:9px;letter-spacing:0.13em;color:#888;margin-bottom:11px;}
    .issues-panel .on-list{display:flex;flex-direction:column;gap:7px;}
    .issues-panel .on-row{display:flex;align-items:center;gap:11px;}
    .issues-panel .on-flag{width:26px;height:26px;border-radius:3px;background:#15171a;border:0.5px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:#9a9a92;flex-shrink:0;}
    .issues-panel .on-name{font-size:12px;color:#cdd6dc;min-width:90px;}
    .issues-panel .on-stance{font-size:11px;color:#888;}
    .issues-panel .on-stance.support_claimant{color:#7a9aab;} .issues-panel .on-stance.support_pressor{color:#c87a7a;}
    .issues-panel .on-stance.condemn_claimant,.issues-panel .on-stance.condemn_pressor{color:#d49a9a;}
    .issues-panel .on-stance.mediate{color:#c89e6e;}
    .issues-panel .on-stance.neutral{color:#666;}
    .issues-panel .on-you{color:#7a9aab;font-style:italic;}
    .issues-panel .med-box{margin:0 18px 14px;padding:12px 14px;border-radius:5px;background:#1a160d;border:0.5px solid rgba(200,158,110,0.4);}
    .issues-panel .med-box.pending{background:#12120c;border-color:rgba(200,158,110,0.25);}
    .issues-panel .med-box .med-t{font-size:11px;color:#d4b87a;line-height:1.5;}
    .issues-panel .med-box .med-acts{display:flex;gap:8px;margin-top:10px;}
    .issues-panel .med-btn{font-family:inherit;cursor:pointer;font-size:11px;letter-spacing:0.05em;padding:8px 14px;border-radius:4px;border:0.5px solid;}
    .issues-panel .med-btn.accept{background:#0e1610;border-color:rgba(138,170,106,0.5);color:#8aaa6a;}
    .issues-panel .med-btn.reject{background:#160e0e;border-color:rgba(200,122,122,0.45);color:#c87a7a;}
    .issues-panel .med-btn.is-busy{opacity:0.5;}
    .issues-panel button.tpa{font-family:inherit;cursor:pointer;}
    .issues-panel .tpa.sel{box-shadow:0 0 0 1px rgba(212,184,122,0.5) inset;}
    .issues-panel .tpa.is-busy{opacity:0.5;}

    .issues-panel .cz-actions,.issues-panel .pz-ladder{padding:14px 18px;border-bottom:0.5px solid rgba(255,255,255,0.05);}
    .issues-panel .cz-actions .lab,.issues-panel .pz-ladder .lab{font-size:9px;letter-spacing:0.13em;margin-bottom:10px;}
    .issues-panel .cz-actions .lab{color:#7a9aab;} .issues-panel .pz-ladder .lab{color:#c87a7a;}
    .issues-panel .cz-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
    .issues-panel .cza{padding:12px 11px;border-radius:4px;text-align:center;border:0.5px solid;}
    .issues-panel .cza .cn{font-size:12px;font-weight:500;margin-bottom:3px;line-height:1.2;}
    .issues-panel .cza .cd{font-size:8px;color:#777;line-height:1.35;}
    .issues-panel .cza.concede{background:#160e0e;border-color:rgba(200,122,122,0.3);} .issues-panel .cza.concede .cn{color:#c87a7a;}
    .issues-panel .cza.compromise{background:#1a160d;border-color:rgba(200,158,110,0.3);} .issues-panel .cza.compromise .cn{color:#c89e6e;}
    .issues-panel .cza.mediate{background:#11181f;border-color:rgba(122,154,171,0.3);} .issues-panel .cza.mediate .cn{color:#7a9aab;}
    .issues-panel .cza.stand{background:#0e1610;border-color:rgba(138,170,106,0.35);} .issues-panel .cza.stand .cn{color:#8aaa6a;}

    .issues-panel .tp-actions{padding:14px 18px;}
    .issues-panel .tp-actions .lab{font-size:9px;letter-spacing:0.13em;color:#888;margin-bottom:10px;}
    .issues-panel .tpa-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}
    .issues-panel .tpa{padding:11px 10px;border-radius:4px;text-align:center;border:0.5px solid;}
    .issues-panel .tpa .tn{font-size:11px;font-weight:500;margin-bottom:3px;line-height:1.2;}
    .issues-panel .tpa .td{font-size:8px;color:#777;line-height:1.35;}
    .issues-panel .tpa.support-a{background:#0e131a;border-color:rgba(122,154,171,0.3);} .issues-panel .tpa.support-a .tn{color:#7a9aab;}
    .issues-panel .tpa.support-b{background:#160e0e;border-color:rgba(200,122,122,0.3);} .issues-panel .tpa.support-b .tn{color:#c87a7a;}
    .issues-panel .tpa.condemn-a{background:#0e131a;border-color:rgba(122,154,171,0.2);} .issues-panel .tpa.condemn-a .tn{color:#9ab4c4;}
    .issues-panel .tpa.condemn-b{background:#160e0e;border-color:rgba(200,122,122,0.2);} .issues-panel .tpa.condemn-b .tn{color:#d49a9a;}
    .issues-panel .tpa.mediate{background:#1a160d;border-color:rgba(200,158,110,0.35);} .issues-panel .tpa.mediate .tn{color:#c89e6e;}
    .issues-panel .tp-note{margin-top:10px;font-size:9px;color:#666;letter-spacing:0.04em;line-height:1.5;font-style:italic;}

    .issues-panel .ladder-rungs{display:flex;flex-direction:column;gap:5px;}
    .issues-panel .rung{display:flex;align-items:center;gap:11px;padding:8px 11px;border-radius:4px;border:0.5px solid rgba(255,255,255,0.06);background:#0e0e0e;}
    .issues-panel .rung.current{background:#160e0e;border-color:rgba(200,122,122,0.4);}
    .issues-panel .rung.floor{opacity:0.7;}
    .issues-panel .rung .dot{width:10px;height:10px;border-radius:50%;border:1.5px solid #4a3a3a;flex-shrink:0;}
    .issues-panel .rung.current .dot{background:#c87a7a;border-color:#c87a7a;}
    .issues-panel .rung .rname{font-size:12px;font-weight:500;color:#ccc;flex:1;}
    .issues-panel .rung.current .rname{color:#fff;}
    .issues-panel .rung .rdesc{font-size:9px;color:#777;letter-spacing:0.02em;}
    .issues-panel .rung .rtag{font-size:8px;letter-spacing:0.1em;color:#888;}
    .issues-panel .rung.current .rtag{color:#c87a7a;}
    .issues-panel .rung.past{opacity:0.4;}
    .issues-panel .rung.past .rname{text-decoration:line-through;}
    .issues-panel .rung.past .dot{background:#333;border-color:#333;}
    .issues-panel .iss-btn{display:block;width:100%;margin-top:9px;padding:9px 11px;border-radius:4px;text-align:center;font-size:10px;letter-spacing:0.05em;font-family:inherit;cursor:pointer;border:0.5px solid;}
    .issues-panel .iss-btn.soften{background:#160e0e;border-color:rgba(200,122,122,0.35);color:#c87a7a;}
    .issues-panel .iss-btn.soften:hover{background:#1a1111;}
    .issues-panel .iss-btn:disabled,.issues-panel .iss-btn.is-busy{opacity:0.5;cursor:default;}
    .issues-panel .iss-note{margin-top:9px;font-size:9px;color:#888;letter-spacing:0.04em;font-style:italic;text-align:center;}
    .issues-panel .iss-error{margin:9px 18px 0;font-size:10px;color:#cf6b66;background:rgba(207,107,102,0.1);border:0.5px solid rgba(207,107,102,0.3);padding:7px 10px;border-radius:3px;}

    .issues-panel .d-clock.war b.imminent,.issues-panel .clk.war b.imminent{color:#e08080;font-weight:600;}
    .issues-panel .comb-center .cd-ticks{display:flex;gap:4px;margin:2px 0 8px;}
    .issues-panel .cd-pip{width:12px;height:12px;border-radius:2px;background:#1a1010;border:0.5px solid rgba(200,122,122,0.25);}
    .issues-panel .cd-pip.spent{background:#2a1212;border-color:#6a3030;}
    .issues-panel .cd-pip.current{background:#3a1818;border-color:#c87a7a;}
    .issues-panel .clk.war{color:#e08080;}

    .issues-panel .cz-grid button.cza{font-family:inherit;cursor:pointer;}
    .issues-panel .cza.stand{background:#0e1610;border-color:rgba(138,170,106,0.35);} .issues-panel .cza.stand .cn{color:#8aaa6a;}

    .issues-panel .pz-levers,.issues-panel .pz-doors{padding:12px 18px;border-bottom:0.5px solid rgba(255,255,255,0.05);}
    .issues-panel .pz-levers .lab{font-size:9px;letter-spacing:0.13em;color:#c87a7a;margin-bottom:9px;}
    .issues-panel .pz-doors .lab{font-size:9px;letter-spacing:0.13em;color:#888;margin-bottom:9px;}
    .issues-panel .lever-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .issues-panel .iss-lever{font-family:inherit;cursor:pointer;text-align:left;background:#120d0d;border:0.5px solid rgba(200,122,122,0.25);border-radius:5px;padding:11px 13px;}
    .issues-panel .iss-lever:hover{background:#1a1012;border-color:rgba(200,122,122,0.45);}
    .issues-panel .iss-lever .ln{font-size:12px;color:#fff;font-weight:500;margin-bottom:3px;display:flex;justify-content:space-between;align-items:center;}
    .issues-panel .iss-lever .ln .cost{font-size:9px;color:#c89e6e;letter-spacing:0.04em;}
    .issues-panel .iss-lever .ld{font-size:9px;color:#999;line-height:1.4;}
    .issues-panel .doors{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .issues-panel .door{font-family:inherit;cursor:pointer;text-align:center;border-radius:4px;padding:12px 11px;border:0.5px solid;}
    .issues-panel .door.back{background:#161616;border-color:rgba(255,255,255,0.15);} .issues-panel .door.back:hover{background:#1c1c1c;}
    .issues-panel .door .dn{font-size:12px;font-weight:600;margin-bottom:3px;} .issues-panel .door.back .dn{color:#aaa;}
    .issues-panel .door .dc{font-size:8px;line-height:1.4;} .issues-panel .door.back .dc{color:#777;}
    .issues-panel .iss-lever:disabled,.issues-panel .door:disabled,.issues-panel button.cza:disabled,.issues-panel .is-busy{opacity:0.5;cursor:default;}

    .issues-panel .channel .ch-head{padding:11px 18px;background:#0a0a0a;border-bottom:0.5px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;}
    .issues-panel .channel .ch-head .t{font-size:10px;letter-spacing:0.13em;color:#888;}
    .issues-panel .channel .ch-head .secure{font-size:8px;color:#6a8a5a;letter-spacing:0.1em;}
    .issues-panel .channel .ch-body{padding:14px 18px;display:flex;flex-direction:column;gap:10px;max-height:300px;overflow-y:auto;}
    .issues-panel .ch-empty{font-size:10px;color:#666;font-style:italic;text-align:center;padding:8px;}
    .issues-panel .msg{display:flex;flex-direction:column;max-width:78%;}
    .issues-panel .msg.them{align-self:flex-start;} .issues-panel .msg.me{align-self:flex-end;align-items:flex-end;}
    .issues-panel .msg .who{font-size:9px;letter-spacing:0.07em;margin-bottom:3px;color:#888;}
    .issues-panel .msg .bubble{padding:8px 11px;border-radius:8px;font-size:12px;line-height:1.5;overflow-wrap:anywhere;white-space:pre-wrap;}
    .issues-panel .msg.them .bubble{background:#13191f;color:#cdd6dc;border-bottom-left-radius:2px;}
    .issues-panel .msg.me .bubble{background:#1f1414;color:#e4cccc;border-bottom-right-radius:2px;}
    .issues-panel .msg .ts{font-size:8px;color:#555;margin-top:3px;letter-spacing:0.06em;}
    .issues-panel .ch-input{display:flex;gap:8px;padding:12px 18px;border-top:0.5px solid rgba(255,255,255,0.06);}
    .issues-panel .ch-input input{flex:1;background:#161616;border:0.5px solid rgba(255,255,255,0.12);color:#d4d4d4;padding:9px 12px;border-radius:4px;font-size:12px;font-family:inherit;}
    .issues-panel .ch-input input::placeholder{color:#555;font-style:italic;}
    .issues-panel .ch-input input:disabled{opacity:0.5;}
    .issues-panel .ch-send{background:#1f1414;border:0.5px solid rgba(200,122,122,0.4);color:#c87a7a;padding:9px 16px;border-radius:4px;font-size:11px;letter-spacing:0.08em;cursor:pointer;font-family:inherit;}
    .issues-panel .ch-send:hover{background:#2a1818;}
    .issues-panel .ch-note{padding:11px 18px;border-top:0.5px solid rgba(255,255,255,0.06);font-size:9px;color:#777;font-style:italic;letter-spacing:0.04em;}
  `;
  document.head.appendChild(s);
}

// ── public API ────────────────────────────────────────────────────────────

// Render the panel. nationId = the viewer's nation (drives role tagging + YOU).
// opts.currentTick drives the decision clock; opts.canManage shows the action
// buttons (head of government only). Actions are wired in mountIssuesPanel.
export function renderIssuesPanel(host, issues, nationId, opts = {}) {
  if (!host) return;
  ensureStyles();
  const heading = opts.heading === undefined ? 'I. Issues' : opts.heading;
  host.innerHTML = `<section class="issues-panel">
      ${heading ? `<div class="issues-panel__head">${escapeHtml(heading)}</div>` : ''}
      <div class="issues-content">${buildContent(issues, nationId, opts.expandedId || null, opts.currentTick ?? null, !!opts.canManage, opts.messages || null, opts.stanceCtx || null)}</div>
    </section>`;

  // Accordion expand/collapse via delegation on the root, which survives content
  // reloads. Clicks on action buttons are handled by the action listener instead.
  const root = host.querySelector('.issues-panel');
  if (root && !root.dataset.expandWired) {
    root.dataset.expandWired = '1';
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) return;
      const summary = e.target.closest('.d-summary');
      if (!summary || !root.contains(summary)) return;
      const d = summary.parentElement;
      const open = d.classList.contains('expanded');
      root.querySelectorAll('.dispute.expanded').forEach(x => x.classList.remove('expanded'));
      if (!open) d.classList.add('expanded');
    });
  }
}

const ACTION_RPC = {
  soften: 'soften_demand', drop: 'drop_claim',
  press_harder: 'press_harder', extend: 'extend_deadline',
  concede: 'concede_claim',
};
const ACTION_CONFIRM = {
  soften: 'Soften your demand one rung? This cannot be undone.',
  drop: 'Back down — drop the claim entirely? You take −25 approval, +10 unrest, and cannot re-press this nation for 360 ticks.',
  press_harder: 'Press harder? This burns one tick off the decision clock.',
  extend: 'Extend the deadline by 2 ticks? This costs you 8 approval.',
  concede: 'Concede the claim? You accept the demand and the dispute resolves in the pressor’s favour.',
};

// The shard's current tick, fetched once per mount/reload so the clock reads true.
async function fetchCurrentTick(supabase) {
  try {
    const { data } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').maybeSingle();
    return data ? (Number(data.current_tick) || 0) : null;
  } catch { return null; }
}

// The nation the viewer governs as head of government (PM/President), or null —
// the SAME authority the action RPCs enforce, so the UI gate can't drift from
// the server. Action buttons show only when this matches the viewer's nation.
async function fetchGovernedNation(supabase) {
  try {
    const { data, error } = await supabase.rpc('dispute_actor_nation');
    return error ? null : (data || null);
  } catch { return null; }
}

// Third-party stances per issue, grouped by issue id. World-visible.
async function fetchIssueStances(supabase, issueIds) {
  const map = new Map();
  if (!issueIds || !issueIds.length) return map;
  try {
    const { data, error } = await supabase
      .from('bilateral_issue_stances')
      .select('issue_id, nation_id, stance')
      .in('issue_id', issueIds);
    if (error) { console.warn('[issues-panel] stances fetch failed:', error.message); return map; }
    for (const s of (data || [])) {
      if (!map.has(s.issue_id)) map.set(s.issue_id, []);
      map.get(s.issue_id).push(s);
    }
  } catch (e) { console.warn('[issues-panel] stances fetch failed:', e?.message || e); }
  return map;
}

// Every nation's id → { name, population } — names list third parties, population
// turns the stake's percentage into an actual headcount.
async function fetchNations(supabase) {
  const map = new Map();
  try {
    const { data, error } = await supabase.from('nations').select('id, name, population');
    if (error) { console.warn('[issues-panel] nations fetch failed:', error.message); return map; }
    for (const n of (data || [])) map.set(n.id, { name: n.name, population: Number(n.population) || 0 });
  } catch (e) { console.warn('[issues-panel] nations fetch failed:', e?.message || e); }
  return map;
}

// The nation where the viewer holds the Foreign Ministry, or null — the same
// authority set_issue_stance enforces, so the stance buttons only show to the FM.
async function fetchForeignMinistryNation(supabase) {
  try {
    const { data, error } = await supabase.rpc('foreign_ministry_nation');
    return error ? null : (data || null);
  } catch { return null; }
}

// Head-of-government channel messages for the given issues, grouped by issue id
// (oldest first). RLS returns only the messages the viewer's nation may read.
async function fetchIssueMessages(supabase, issueIds) {
  const map = new Map();
  if (!issueIds || !issueIds.length) return map;
  try {
    const { data, error } = await supabase
      .from('bilateral_issue_messages')
      .select('issue_id, sender_nation_id, body, sent_at_tick')
      .in('issue_id', issueIds)
      .order('created_at', { ascending: true });
    if (error) { console.warn('[issues-panel] messages fetch failed:', error.message); return map; }
    for (const m of (data || [])) {
      if (!map.has(m.issue_id)) map.set(m.issue_id, []);
      map.get(m.issue_id).push(m);
    }
  } catch (e) { console.warn('[issues-panel] messages fetch failed:', e?.message || e); }
  return map;
}

// Fetch + render. Both pages call this so they stay in lockstep.
export async function mountIssuesPanel(supabase, nationId, host, opts = {}) {
  if (!host) return;
  ensureStyles();
  const heading = opts.heading === undefined ? 'I. Issues' : opts.heading;
  host.innerHTML = `<section class="issues-panel">
      ${heading ? `<div class="issues-panel__head">${escapeHtml(heading)}</div>` : ''}
      <div class="issues-content"><div class="issues-empty">Loading…</div></div>
    </section>`;

  let issues = [], currentTick = null, governed = null, messages = new Map();
  let stances = new Map(), names = new Map(), fmNation = null;
  try {
    [issues, currentTick, governed, names, fmNation] = await Promise.all([
      fetchWorldIssues(supabase), fetchCurrentTick(supabase), fetchGovernedNation(supabase),
      fetchNations(supabase), fetchForeignMinistryNation(supabase),
    ]);
    const ids = (issues || []).map(i => i.id);
    [messages, stances] = await Promise.all([fetchIssueMessages(supabase, ids), fetchIssueStances(supabase, ids)]);
  } catch (err) {
    console.warn('[issues-panel] mount failed:', err?.message || err);
  }
  // Only the nation's head of government may act on its disputes.
  const canManage = !!governed && governed === nationId;
  // names + fmNation + governed are stable for the session; stances refresh on reload.
  const stanceCtx = { stances, names, fmNation, nationId, governed };
  renderIssuesPanel(host, issues, nationId, { ...opts, currentTick, canManage, messages, stanceCtx });

  const root = host.querySelector('.issues-panel');
  const content = host.querySelector('.issues-content');
  if (!root || !content || root.dataset.actionWired) return;
  root.dataset.actionWired = '1';

  let busy = false;

  // Re-fetch everything and rebuild, keeping the open dispute expanded. Shared by
  // the action buttons and the chat so they can't drift.
  async function reload() {
    const openId = root.querySelector('.dispute.expanded')?.dataset.id || null;
    let fresh = [], freshTick = currentTick, freshMsgs = new Map(), freshStances = new Map();
    try {
      [fresh, freshTick] = await Promise.all([fetchWorldIssues(supabase), fetchCurrentTick(supabase)]);
      const ids = fresh.map(i => i.id);
      [freshMsgs, freshStances] = await Promise.all([fetchIssueMessages(supabase, ids), fetchIssueStances(supabase, ids)]);
    } catch { /* keep what we have */ }
    content.innerHTML = buildContent(fresh, nationId, openId, freshTick, canManage, freshMsgs,
      { stances: freshStances, names, fmNation, nationId, governed });
  }

  // Claimant/pressor decision buttons.
  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || !root.contains(btn)) return;
    e.stopPropagation();
    if (busy) return;
    const rpc = ACTION_RPC[btn.dataset.action];
    if (!rpc) return;
    if (typeof window !== 'undefined' && typeof window.confirm === 'function'
        && !window.confirm(ACTION_CONFIRM[btn.dataset.action])) return;

    const zone = btn.closest('.pressor-zone, .claimant-zone');
    const errEl = zone?.querySelector('.iss-error');
    const fail = (msg) => {
      if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
      zone?.querySelectorAll('[data-action]').forEach(b => { b.disabled = false; });
      btn.classList.remove('is-busy');
    };
    busy = true;
    zone?.querySelectorAll('[data-action]').forEach(b => { b.disabled = true; });
    btn.classList.add('is-busy');
    if (errEl) { errEl.hidden = true; errEl.textContent = ''; }
    try {
      const { data, error } = await supabase.rpc(rpc, { p_issue_id: btn.dataset.id });
      if (error || (data && data.ok === false)) fail((data && data.message) || error?.message || 'Action failed.');
      else await reload();
    } catch (err) {
      fail(err?.message || 'Action failed.');
    } finally {
      busy = false;
    }
  });

  // Head-of-government channel: post a message, then reload to show it.
  async function sendChat(issueId, inputEl) {
    if (busy) return;
    const body = inputEl ? inputEl.value.trim() : '';
    if (!body) return;
    busy = true;
    if (inputEl) inputEl.disabled = true;
    try {
      const { data, error } = await supabase.rpc('send_issue_message', { p_issue_id: issueId, p_body: body });
      if (!error && !(data && data.ok === false)) { await reload(); }
      else { if (inputEl) inputEl.disabled = false; console.warn('[issues-panel] send failed:', (data && data.message) || error?.message); }
    } catch (ex) {
      if (inputEl) inputEl.disabled = false;
      console.warn('[issues-panel] send failed:', ex?.message || ex);
    } finally {
      busy = false;
    }
  }
  root.addEventListener('click', (e) => {
    const sb = e.target.closest('[data-chat-send]');
    if (!sb || !root.contains(sb)) return;
    e.stopPropagation();
    sendChat(sb.dataset.chatSend, root.querySelector(`[data-chat-input="${sb.dataset.chatSend}"]`));
  });
  root.addEventListener('keydown', (e) => {
    const inp = e.target.closest('[data-chat-input]');
    if (!inp || e.key !== 'Enter') return;
    e.preventDefault();
    sendChat(inp.dataset.chatInput, inp);
  });

  // Belligerent HoG responds to a mediation offer (accept / reject).
  root.addEventListener('click', async (e) => {
    const mb = e.target.closest('[data-mediate]');
    if (!mb || !root.contains(mb)) return;
    e.stopPropagation();
    if (busy) return;
    busy = true; mb.classList.add('is-busy');
    try {
      const { data, error } = await supabase.rpc('respond_mediation', { p_issue_id: mb.dataset.id, p_accept: mb.dataset.mediate === 'accept' });
      if (!error && !(data && data.ok === false)) await reload();
      else { mb.classList.remove('is-busy'); console.warn('[issues-panel] mediation failed:', (data && data.message) || error?.message); }
    } catch (ex) {
      mb.classList.remove('is-busy');
      console.warn('[issues-panel] mediation failed:', ex?.message || ex);
    } finally {
      busy = false;
    }
  });

  // Third-party stance (the nation's Foreign Minister).
  root.addEventListener('click', async (e) => {
    const sb = e.target.closest('[data-stance]');
    if (!sb || !root.contains(sb)) return;
    e.stopPropagation();
    if (busy) return;
    busy = true; sb.classList.add('is-busy');
    try {
      const { data, error } = await supabase.rpc('set_issue_stance', { p_issue_id: sb.dataset.id, p_stance: sb.dataset.stance });
      if (!error && !(data && data.ok === false)) {
        const ev = STANCE_EVENTS[sb.dataset.stance];
        if (ev) {
          const myName = sb.dataset.myName        || 'A nation';
          const pName  = sb.dataset.pressorName   || 'the Pressor';
          const cName  = sb.dataset.claimantName  || 'the Claimant';
          await broadcastWorldEvent(supabase, {
            eventName: ev.eventName,
            triggerKey: ev.triggerKey,
            description: ev.line(myName, pName, cName),
            category: 'diplomacy',
          });
        }
        await reload();
      }
      else { sb.classList.remove('is-busy'); console.warn('[issues-panel] stance failed:', (data && data.message) || error?.message); }
    } catch (ex) {
      sb.classList.remove('is-busy');
      console.warn('[issues-panel] stance failed:', ex?.message || ex);
    } finally {
      busy = false;
    }
  });

  // Rename the contested region (either belligerent's head of government).
  root.addEventListener('click', async (e) => {
    const rb = e.target.closest('[data-region-edit]');
    if (!rb || !root.contains(rb)) return;
    e.stopPropagation();
    if (busy || typeof window === 'undefined' || typeof window.prompt !== 'function') return;
    const name = window.prompt('Name the contested region:', rb.dataset.region || '');
    if (name === null) return; // cancelled
    busy = true;
    try {
      const { data, error } = await supabase.rpc('set_dispute_region', { p_issue_id: rb.dataset.regionEdit, p_region: name.trim() });
      if (!error && !(data && data.ok === false)) await reload();
      else console.warn('[issues-panel] region edit failed:', (data && data.message) || error?.message);
    } catch (ex) {
      console.warn('[issues-panel] region edit failed:', ex?.message || ex);
    } finally {
      busy = false;
    }
  });
}
