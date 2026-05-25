// issues-panel.js — shared "Issues" panel (SINGLE SOURCE OF TRUTH).
//
// One implementation, mounted identically on:
//   • army-operations.html  → Army ▸ Operations ▸ "Issues"   (military faction)
//   • diplomacy.html         → World ▸ Diplomacy ▸ "Issues"   (political / party)
// Both call mountIssuesPanel(), so the two surfaces can never diverge. Do NOT
// copy this markup/CSS into a page — extend it here.
//
// Renders the world's ongoing bilateral_issues as an expand-in-place list. The
// viewer's role per dispute is derived from the data:
//   Claimant = administering_nation_id (holds the ground)
//   Pressor  = initiative_nation_id    (pressed the claim)
//   Third party = anyone else
//
// SHELL SCOPE: combatants + matchup + roles + region render from live data.
// The four planned-but-unbuilt systems — the decision CLOCK, third-party
// STANCES, the head-of-state CHAT, and the claimant/pressor ACTIONS — render as
// clearly-labelled, inert PREVIEW placeholders (no handlers, no fake state).
// Wire each up in its own later pass.

import { escapeHtml } from './utils.js';
import { ISSUE_TYPES } from './game/issues.js';

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
  return issue.contested_region_name || issue.metadata?.territory_name || 'the contested area';
}

function demandText(issue, region) {
  if (issue.stake_resource) {
    const q = issue.stake_quantity != null ? `${issue.stake_quantity} ` : '';
    return `Claim over ${q}${issue.stake_resource} in ${region}`;
  }
  const t = String(issue.issue_type || '').toLowerCase();
  if (t.includes('territor') || issue.contested_region_name) return `Full cession of ${region}`;
  return `Resolution of ${ISSUE_TYPES[issue.issue_type]?.name || region}`;
}

// Inert preview banner reused by every not-yet-built module.
const PREVIEW = (txt) => `<div class="iss-preview">${escapeHtml(txt)}</div>`;

// ── data ──────────────────────────────────────────────────────────────────

// All ongoing bilateral issues (the world's disputes). Role tagging is done
// client-side from administering/initiative against the viewer's nation.
export async function fetchWorldIssues(supabase) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('bilateral_issues')
    .select('id, issue_type, '
          + 'nation_a_id, nation_b_id, administering_nation_id, initiative_nation_id, '
          + 'contested_region_name, stake_resource, stake_quantity, metadata, '
          + 'nation_a:nations!bilateral_issues_nation_a_id_fkey(id, name), '
          + 'nation_b:nations!bilateral_issues_nation_b_id_fkey(id, name)')
    .in('status', ['active', 'partial', 'escalated'])
    .order('tension', { ascending: false });
  if (error) { console.warn('[issues-panel] fetch failed:', error.message); return []; }
  return data || [];
}

// ── render: summary row ─────────────────────────────────────────────────────

function disputeRow(issue, role, roles) {
  const badge = typeBadge(issue.issue_type);
  const region = regionText(issue);

  const roleBadge = role === 'claimant' ? { cls: 'role-claimant', txt: 'YOU ARE THE CLAIMANT' }
                  : role === 'pressor'  ? { cls: 'role-pressor',  txt: 'YOU ARE THE PRESSOR' }
                  :                       { cls: 'role-third',     txt: 'THIRD PARTY' };

  const summary = `<div class="d-summary">
      <span class="d-chevron">&#9656;</span>
      <span class="d-type ${badge.cls}">${escapeHtml(badge.label)}</span>
      <span class="d-matchup">${escapeHtml(roles.pressorName)} <span class="vs">presses</span> ${escapeHtml(roles.claimantName)} <span class="over">&mdash; over ${escapeHtml(region)}</span></span>
      <span class="d-role ${roleBadge.cls}">${roleBadge.txt}</span>
      <span class="d-clock" title="Decision clock not yet implemented"><span class="lab">CLOCK</span> &mdash;</span>
    </div>`;

  return `<div class="dispute" data-id="${escapeHtml(issue.id)}">${summary}<div class="d-detail">${disputeDetail(issue, roles, role, region)}</div></div>`;
}

// ── render: shared detail (combatants + stances + role module + chat) ─────────

function disputeDetail(issue, roles, role, region) {
  const youTag = '<span class="you">YOU</span>';
  const aYou = role === 'claimant' ? youTag : '';
  const bYou = role === 'pressor'  ? youTag : '';
  const demandLab = role === 'claimant' ? 'THEY DEMAND' : role === 'pressor' ? 'YOU DEMAND' : 'THE DEMAND';

  const combatants = `<div class="combatants">
      <div class="comb a">
        <div class="role">&#9670; CLAIMANT &middot; HOLDS THE GROUND</div>
        <div class="nation"><div class="flag">${escapeHtml(initials(roles.claimantName))}</div><div><div class="nm">${escapeHtml(roles.claimantName)} ${aYou}</div><div class="nsub">Defending ${escapeHtml(region)}</div></div></div>
      </div>
      <div class="comb-center">
        <div class="dem-lab">${demandLab}</div>
        <div class="dem">${escapeHtml(demandText(issue, region))}</div>
        <div class="clk" title="Decision clock not yet implemented"><span class="lab">CLOCK</span> &mdash;</div>
      </div>
      <div class="comb b">
        <div class="role">PRESSOR &middot; PRESSES THE CLAIM &#9670;</div>
        <div class="nation"><div class="flag">${escapeHtml(initials(roles.pressorName))}</div><div><div class="nm">${escapeHtml(roles.pressorName)} ${bYou}</div><div class="nsub">Demanding ${escapeHtml(region)}</div></div></div>
      </div>
    </div>`;

  // Other-nation stances: not yet a system → inert placeholder.
  const others = `<div class="others">
      <div class="lab">OTHER NATIONS</div>
      ${PREVIEW('Third-party stances (support / condemn / mediate) are not yet tracked.')}
    </div>`;

  const roleModule = role === 'claimant' ? claimantZone()
                   : role === 'pressor'  ? pressorZone()
                   :                       thirdPartyZone(roles);

  // The head-of-state channel is private to the two principals (and, in future,
  // the accepted mediator). Third parties don't see it.
  const chat = (role === 'claimant' || role === 'pressor') ? chatPlaceholder() : '';
  return combatants + others + roleModule + chat;
}

// ── role modules (inert previews) ────────────────────────────────────────────

function claimantZone() {
  return `<div class="claimant-zone">
    <div class="cz-actions">
      <div class="lab">YOUR OPTIONS AS THE CLAIMANT</div>
      ${PREVIEW('Actions are not yet active.')}
      <div class="cz-grid iss-inert">
        <div class="cza concede"><div class="cn">Concede</div><div class="cd">Give up the ground. The dispute ends; the pressor wins.</div></div>
        <div class="cza compromise"><div class="cn">Offer Compromise</div><div class="cd">Table an offer (1d6). They choose to accept or reject.</div></div>
        <div class="cza mediate"><div class="cn">Request Mediation</div><div class="cd">Bring in a broker. Pauses their clock if accepted.</div></div>
        <div class="cza stand"><div class="cn">Stand Strong</div><div class="cd">Defy the demand. Run their clock down.</div></div>
      </div>
    </div>
  </div>`;
}

function pressorZone() {
  return `<div class="pressor-zone">
    <div class="pz-ladder">
      <div class="lab">YOUR DEMAND &mdash; SOFTEN TO MAKE A "YES" EASIER</div>
      ${PREVIEW('The demand ladder and softening are not yet active.')}
      <div class="ladder-rungs iss-inert">
        <div class="rung current"><span class="dot"></span><span class="rname">Full Cession</span><span class="rdesc">The ground becomes yours, sovereignty and all.</span><span class="rtag">HARDEST YES</span></div>
        <div class="rung"><span class="dot"></span><span class="rname">Administrative Control</span><span class="rdesc">They keep the flag; you run the territory.</span><span class="rtag">&mdash;</span></div>
        <div class="rung"><span class="dot"></span><span class="rname">Joint Condominium</span><span class="rdesc">Shared governance and revenue, 50/50.</span><span class="rtag">COMPROMISE</span></div>
        <div class="rung floor"><span class="dot"></span><span class="rname">Resource Rights</span><span class="rdesc">They keep the land; you get a share of the output.</span><span class="rtag">FLOOR</span></div>
      </div>
    </div>
    <div class="pz-moves">
      <div class="lab">YOUR MOVES</div>
      ${PREVIEW('Pressor moves (press harder / extend / war / back down) are not yet active.')}
      <div class="pm-grid iss-inert">
        <div class="pm"><div class="pmn">Press Harder</div><div class="pmd">Burn a tick faster, but make your threat more credible.</div></div>
        <div class="pm"><div class="pmn">Extend Deadline</div><div class="pmd">Add ticks to your clock at an approval cost.</div></div>
      </div>
    </div>
  </div>`;
}

// Third-party role module: the five intervention options. Inert preview — the
// stance system isn't built. NOTE: mediation is a future sub-role — when a third
// party offers to mediate and BOTH principals accept, they become the issue's
// single mediator (role 'med'), which is what unlocks the chat panel below for
// them. Until that system lands, no viewer resolves to 'med'.
function thirdPartyZone(roles) {
  const a = escapeHtml(roles.claimantName);
  const b = escapeHtml(roles.pressorName);
  return `<div class="tp-actions">
    <div class="lab">YOUR OPTIONS AS A THIRD PARTY</div>
    ${PREVIEW('Stances and mediation are not yet active.')}
    <div class="tpa-grid iss-inert">
      <div class="tpa support-a"><div class="tn">Support ${a}</div><div class="td">Lend strength &amp; legitimacy to the Claimant.</div></div>
      <div class="tpa support-b"><div class="tn">Support ${b}</div><div class="td">Back the Pressor's claim.</div></div>
      <div class="tpa condemn-a"><div class="tn">Condemn ${a}</div><div class="td">Censure the Claimant's intransigence.</div></div>
      <div class="tpa condemn-b"><div class="tn">Condemn ${b}</div><div class="td">Censure the Pressor as an aggressor.</div></div>
      <div class="tpa mediate"><div class="tn">Offer to Mediate</div><div class="td">Volunteer as broker. Pauses the clock if both accept.</div></div>
    </div>
    <div class="tp-note">Third parties are not on the head-of-state channel unless they become the accepted mediator. Only one mediator per issue.</div>
  </div>`;
}

function chatPlaceholder() {
  return `<div class="channel">
    <div class="ch-head"><span class="t">HEAD-OF-STATE CHANNEL</span><span class="secure">&#128274; PRIVATE</span></div>
    <div class="ch-body">${PREVIEW('The private leader-to-leader channel is not yet built.')}</div>
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
    .issues-panel .comb-center .clk .lab{color:#666;display:block;font-size:8px;letter-spacing:0.1em;margin-bottom:2px;}

    .issues-panel .others{padding:14px 18px;background:#0c0c0c;border-bottom:0.5px solid rgba(255,255,255,0.05);}
    .issues-panel .others .lab{font-size:9px;letter-spacing:0.13em;color:#888;margin-bottom:11px;}

    .issues-panel .cz-actions,.issues-panel .pz-ladder,.issues-panel .pz-moves{padding:14px 18px;border-bottom:0.5px solid rgba(255,255,255,0.05);}
    .issues-panel .cz-actions .lab,.issues-panel .pz-ladder .lab,.issues-panel .pz-moves .lab{font-size:9px;letter-spacing:0.13em;margin-bottom:10px;}
    .issues-panel .cz-actions .lab{color:#7a9aab;} .issues-panel .pz-ladder .lab,.issues-panel .pz-moves .lab{color:#c87a7a;}
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
    .issues-panel .pm-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .issues-panel .pm{padding:11px 13px;border-radius:4px;border:0.5px solid rgba(200,122,122,0.25);background:#120d0d;}
    .issues-panel .pm .pmn{font-size:12px;color:#fff;font-weight:500;margin-bottom:3px;}
    .issues-panel .pm .pmd{font-size:9px;color:#888;line-height:1.4;}

    .issues-panel .channel .ch-head{padding:11px 18px;background:#0a0a0a;border-bottom:0.5px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;}
    .issues-panel .channel .ch-head .t{font-size:10px;letter-spacing:0.13em;color:#888;}
    .issues-panel .channel .ch-head .secure{font-size:8px;color:#6a8a5a;letter-spacing:0.1em;}
    .issues-panel .channel .ch-body{padding:14px 18px;}
  `;
  document.head.appendChild(s);
}

// ── public API ────────────────────────────────────────────────────────────

// Render the panel. nationId = the viewer's nation (drives role tagging + YOU).
export function renderIssuesPanel(host, issues, nationId, opts = {}) {
  if (!host) return;
  ensureStyles();
  const list = Array.isArray(issues) ? issues : [];
  const heading = opts.heading === undefined ? 'I. Issues' : opts.heading;
  // Resolve each dispute's roles once; the count and the rows both read from it.
  const tagged = list.map(it => {
    const roles = rolesOf(it);
    return { issue: it, roles, role: viewerRole(it, nationId, roles) };
  });
  const involved = tagged.filter(t => t.role !== 'third').length;
  const body = tagged.length
    ? `<div class="issues-sub">${tagged.length} ONGOING &middot; YOU ARE INVOLVED IN ${involved}</div>`
      + `<div class="disputes">${tagged.map(t => disputeRow(t.issue, t.role, t.roles)).join('')}</div>`
    : '<div class="issues-empty">No ongoing issues</div>';
  host.innerHTML = `<section class="issues-panel">
      ${heading ? `<div class="issues-panel__head">${escapeHtml(heading)}</div>` : ''}
      ${body}
    </section>`;

  // Expand/collapse via delegation (survives the single render).
  const root = host.querySelector('.issues-panel');
  if (root && !root.dataset.wired) {
    root.dataset.wired = '1';
    root.addEventListener('click', (e) => {
      const summary = e.target.closest('.d-summary');
      if (summary && root.contains(summary)) summary.parentElement.classList.toggle('expanded');
    });
  }
}

// Fetch + render. Both pages call this so they stay in lockstep.
export async function mountIssuesPanel(supabase, nationId, host, opts = {}) {
  if (!host) return;
  ensureStyles();
  const heading = opts.heading === undefined ? 'I. Issues' : opts.heading;
  host.innerHTML = `<section class="issues-panel">
      ${heading ? `<div class="issues-panel__head">${escapeHtml(heading)}</div>` : ''}
      <div class="issues-empty">Loading…</div>
    </section>`;
  try {
    const issues = await fetchWorldIssues(supabase);
    renderIssuesPanel(host, issues, nationId, opts);
  } catch (err) {
    console.warn('[issues-panel] mount failed:', err?.message || err);
    renderIssuesPanel(host, [], nationId, opts);
  }
}
