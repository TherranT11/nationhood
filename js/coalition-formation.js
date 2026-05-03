// js/coalition-formation.js — Coalition Formation UI for the Election tab
// Detects post-election state, shows formation banner, proposal list, proposal creation,
// ministry assignment, and Form Government action.

import { buildMinistryBaselines } from './game/stats.js';
import { autoAppointPartyLeaderAsPM, getNationNames } from './game/political-actions.js';
import { rolloverAdministration } from './game/elections.js';
import { fetchActiveCoalition } from './game/government-structure.js';
import { MINISTRY_OFFICE_NAMES, CABINET_MINISTRY_KEYS, hasElectedPresident, isSemiPresidential, isAbsoluteMonarchy } from './game/government-types.js';
import { PLATFORMS } from './game/platforms.js';
import { FORMATION_DEADLINE_TICKS } from './game/config.js';
import { tickToDate } from './utils.js';

let _supabase = null;
let _state = null;
let _formationNeeded = false;
let _electionId = null;
let _allParties = [];
let _formations = [];
let _totalSeats = 0;
// Active platforms per party in this nation, keyed by faction_id.
// Loaded once at init; read during coalition-propose render so players
// can see each party's commitments before inviting them.
let _platformsByFaction = {};
// Scheduled elections for the current nation, ascending by tick. One source
// of truth for the election header AND the pre-election render branch — both
// derive what they need (earliest-by-type / earliest-overall) from this array.
let _scheduledElections = [];
// Active coalition (virtualized for presidential) from fetchActiveCoalition,
// used by the header's Government Status line. Single fetch at init time.
let _activeCoalition = null;
let _majoritySeats = 0;
let _lastElectionTick = null;
let _currentTick = 0;
let _proposalSelectedParties = [];
let _submitting = false;
let _expandedFormationId = null;  // which proposal card is expanded for ministry assignment
let _editingFormationId = null;   // proposer is editing the party_ids on their proposal
let _ministryAssignments = {};    // { ministryKey: partyId }
let _formingGovernment = false;

// Threshold for the [Inactive – N ticks] label on party names.
const INACTIVITY_TICKS = 4;
function inactivityLabel(party) {
    const last = Number(party?.last_seen_tick) || 0;
    if (!last) return '';
    const lapse = _currentTick - last;
    if (lapse < INACTIVITY_TICKS) return '';
    return `<span class="cf-inactive">[Inactive – ${lapse} tick${lapse !== 1 ? 's' : ''}]</span>`;
}

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// ════════════════════════ PUBLIC API ════════════════════════

export async function initCoalitionFormation(supabase, state) {
    _supabase = supabase;
    _state = state;

    // Check if coalition formation is needed
    const nation = state.nation;
    const faction = state.faction;
    if (!nation || !faction) return { needed: false };

    // Fetch latest election, current tick, active coalition, all parties,
    // scheduled elections, and active platforms used by coalition matching.
    const [electionResult, shardResult, activeCoalition, partiesResult, scheduledResult, platformsResult] = await Promise.all([
        supabase.from('elections')
            .select('id, election_type, election_tick, status')
            .eq('nation_id', nation.id)
            .eq('status', 'completed')
            .order('election_tick', { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single(),
        // fetchActiveCoalition is the SSoT — it reads the canonical source
        // per government_type (presidents for presidential, government_formations
        // for parliamentary/CM, ministries for absolute monarchy). No stub rows
        // required; no per-caller government_type branching needed here.
        fetchActiveCoalition(supabase, nation.id),
        supabase.from('factions')
            // bloc_id is read by the proposal-checkbox handler so toggling
            // any bloc member auto-toggles the others (Phase 2c: blocs are
            // invited to coalitions in their entirety or not at all).
            .select('id, faction_name, abbreviation, party_color, seats, bloc_id, last_seen_tick')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .is('abandoned_at', null)
            .order('seats', { ascending: false }),
        supabase.from('elections')
            .select('election_tick, election_type')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .order('election_tick', { ascending: true }),
        supabase.from('faction_platforms')
            .select('faction_id, platform_key, slot')
            .eq('nation_id', nation.id)
            .eq('status', 'active')
            .order('slot', { ascending: true }),
    ]);

    _currentTick = shardResult.data?.current_tick ?? 0;
    _allParties = partiesResult.data || [];
    _totalSeats = _allParties.reduce((s, p) => s + (p.seats || 0), 0);
    _majoritySeats = Math.ceil(_totalSeats / 2) + 1;
    _scheduledElections = scheduledResult?.data || [];
    _activeCoalition = activeCoalition || null;
    _platformsByFaction = {};
    if (platformsResult?.error) {
        console.warn('[CoalitionFormation] faction_platforms query failed:', platformsResult.error.message);
    }
    for (const row of (platformsResult?.data || [])) {
        (_platformsByFaction[row.faction_id] ||= []).push(row.platform_key);
    }

    const election = electionResult.data;
    const formedGov = activeCoalition || null;

    // Parliamentary coalition state must come only from the election-cycle
    // formation source of truth. Do NOT treat an active HoG row as equivalent
    // to a formed government, otherwise a stale PM row can mask a post-election
    // vacancy and make a new snap-election parliament look auto-formed.
    const hasFormedGov = !!formedGov;

    // Presidential / semi-presidential systems don't use coalition formation —
    // the president governs (or nominates the PM). The Election tab renders a
    // system-specific blurb via the early return below. Use the canonical
    // helper rather than substring-matching government_type (which would
    // miscategorize parliamentary nations that happen to have a directly-
    // elected ceremonial head of state, e.g. Vostia).
    if (hasElectedPresident(nation)) {
        _formationNeeded = false;
        return { needed: false };
    }

    if (election && !hasFormedGov) {
        _formationNeeded = true;
        _electionId = election.id;
        _lastElectionTick = election.election_tick;
    } else {
        // Even without detection, still allow rendering the Election tab
        _formationNeeded = !hasFormedGov;
        if (election) {
            _electionId = election.id;
            _lastElectionTick = election.election_tick;
        }
    }

    return { needed: _formationNeeded };
}

export function isFormationNeeded() {
    return _formationNeeded;
}

// ═══════════════════════════════════════════════════════════════════════════
// Election header — visible for every system except absolute monarchy.
// Shows nation flag + name, next scheduled election date, months remaining,
// and chamber seat count. Returns an HTML string to prepend to each render
// path; returns '' when the nation is an absolute monarchy (caller skips).
// ═══════════════════════════════════════════════════════════════════════════
function buildElectionHeader() {
    const nation = _state?.nation;
    if (!nation) return '';

    if (isAbsoluteMonarchy(nation)) return '';

    // Label always reads "NEXT ELECTION"; the subtitle names the election type
    // relative to the nation's constitutional setup:
    //   - Pure parliamentary systems → "Parliamentary"
    //   - Presidential / semi-presidential, next is a presidential election → "General"
    //   - Presidential / semi-presidential, next is a parliamentary election → "Midterm"
    const isPresidentialSystem = hasElectedPresident(nation);
    const next = _scheduledElections[0] || null;
    const nextTick = next?.election_tick ?? null;
    const nextType = next?.election_type || 'parliamentary';
    const typeLabel = !isPresidentialSystem
        ? 'Parliamentary'
        : (nextType === 'presidential' ? 'General' : 'Midterm');

    const currentTick = Number(_currentTick) || 0;
    const months = nextTick != null ? Math.max(0, nextTick - currentTick) : null;
    const monthLabel = months == null ? null : `${months} Month${months === 1 ? '' : 's'}`;
    const dateLabel = nextTick != null ? tickToDate(nextTick) : 'TBD';

    const totalSeats = Number(nation.total_seats) || 0;
    // Electoral frequency: ticks between parliamentary elections per the
    // nation's foundation law. parliamentary_term_ticks is the modern column;
    // election_frequency is the legacy fallback. 1 tick = 1 month.
    const freqMonths = Number(nation.parliamentary_term_ticks) || Number(nation.election_frequency) || 24;
    const freqValue = `${freqMonths} Month${freqMonths === 1 ? '' : 's'}`;
    const nationName = nation.name || 'Unknown';
    const flagSrc = nation.flag_url || `assets/flags/${nationName}.png`;

    const subLines = [monthLabel, `Type: ${typeLabel}`].filter(Boolean)
        .map(line => `<div class="cf-eh-stat-sub">${esc(line)}</div>`).join('');

    // Government status line appears to the left of the flag when a coalition
    // or virtualized presidential government is active. Capitalized for the
    // four canonical states (formed / caretaker / dissolved / forming).
    const rawStatus = _activeCoalition?.status || null;
    const statusLabel = rawStatus ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1) : null;
    const statusLine = statusLabel
        ? `<div class="cf-eh-gov-status">GOVERNMENT STATUS: <span class="cf-eh-gov-status-value">${esc(statusLabel)}</span></div>`
        : '';

    return `<div class="cf-election-header">
        <div class="cf-eh-left">
            <div class="cf-eh-label">&bull; ELECTIONS</div>
            ${statusLine}
            <div class="cf-eh-title-row">
                <img class="cf-eh-flag" src="${esc(flagSrc)}" alt="${esc(nationName)} flag" onerror="this.style.display='none'">
                <h2 class="cf-eh-title">Elections of ${esc(nationName)}</h2>
            </div>
        </div>
        <div class="cf-eh-stats">
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">NEXT ELECTION</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--accent">${esc(dateLabel)}</div>
                ${subLines}
            </div>
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">TOTAL SEATS</div>
                <div class="cf-eh-stat-value">${totalSeats}</div>
                <div class="cf-eh-stat-label" style="margin-top:10px;">ELECTORAL FREQUENCY</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--sm">${esc(freqValue)}</div>
            </div>
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Electoral Makeup — chamber composition bar with majority marker.
// Renders one segment per party (sorted by seats desc) colored by party_color,
// plus an "At Stake" segment filling any unallocated seats (total_seats minus
// the sum of faction.seats). Pulled entirely from _allParties and
// nation.total_seats — no new queries.
// Returns '' for absolute monarchies (no parties, no seats to display).
// ═══════════════════════════════════════════════════════════════════════════
function buildElectoralMakeup() {
    const nation = _state?.nation;
    if (!nation) return '';
    if (isAbsoluteMonarchy(nation)) return '';

    const totalSeats = Number(nation.total_seats) || 0;
    if (totalSeats <= 0) return '';

    const seated = _allParties.filter(p => (p.seats || 0) > 0)
        .slice().sort((a, b) => (b.seats || 0) - (a.seats || 0));
    const partySeats = seated.reduce((sum, p) => sum + (p.seats || 0), 0);
    const atStake = Math.max(0, totalSeats - partySeats);
    const majority = Math.ceil(totalSeats / 2) + 1;
    const majorityPct = (majority / totalSeats) * 100;

    const segments = seated.map(p => {
        const pct = ((p.seats || 0) / totalSeats) * 100;
        const color = p.party_color || 'var(--text-dim)';
        return `<div class="cf-em-seg" style="width:${pct}%;background:${esc(color)};" title="${esc(p.faction_name)}: ${p.seats} seats"></div>`;
    }).join('');
    const stakeSeg = atStake > 0
        ? `<div class="cf-em-seg cf-em-seg--stake" style="width:${(atStake / totalSeats) * 100}%;">
               <span class="cf-em-stake-label">${atStake} SEATS AT STAKE</span>
           </div>`
        : '';

    const legendParties = seated.map(p => {
        const color = p.party_color || 'var(--text-dim)';
        return `<div class="cf-em-chip">
            <span class="cf-em-swatch" style="background:${esc(color)};"></span>
            <span class="cf-em-chip-name">${esc(p.faction_name)}</span>
            <span class="cf-em-chip-count">${p.seats}</span>
            <span class="cf-em-chip-unit">seats</span>
        </div>`;
    }).join('');
    const legendStake = atStake > 0
        ? `<div class="cf-em-chip">
               <span class="cf-em-swatch cf-em-swatch--stake"></span>
               <span class="cf-em-chip-name">At Stake</span>
               <span class="cf-em-chip-count">${atStake}</span>
               <span class="cf-em-chip-unit">seats</span>
           </div>`
        : '';

    return `<div class="cf-electoral-makeup">
        <div class="cf-em-header">
            <div class="cf-em-title">&#9642; ELECTORAL MAKEUP</div>
            <div class="cf-em-meta">MAJORITY AT <span class="cf-em-majority">${majority} SEATS</span> &middot; ${totalSeats} TOTAL</div>
        </div>
        <div class="cf-em-bar">
            ${segments}
            ${stakeSeg}
            <div class="cf-em-majority-tick" style="left:${majorityPct.toFixed(2)}%;"></div>
        </div>
        <div class="cf-em-legend">
            ${legendParties}
            ${legendStake}
        </div>
    </div>`;
}

export async function renderFormationTab(root) {
    if (!root) return;

    // Absolute monarchies don't hold elections — render blurb WITHOUT the
    // election header (monarchies have no elections to display).
    if (isAbsoluteMonarchy(_state.nation)) {
        root.innerHTML = `<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;
        return;
    }

    // All other systems (parliamentary, presidential, semi-presidential) get
    // the election header at the top of every render path.
    const header = buildElectionHeader();
    // Electoral Makeup sits inside a 2-col grid: left slot reserved for
    // Campaign Events (not yet built), right slot shows the makeup bar.
    const makeup = buildElectoralMakeup();
    const makeupRow = makeup
        ? `<div class="cf-makeup-row">
               <div class="cf-makeup-left"></div>
               <div class="cf-makeup-right">${makeup}</div>
           </div>`
        : '';

    // Presidential systems — no coalition formation
    if (hasElectedPresident(_state.nation)) {
        const isSemiPresRender = isSemiPresidential(_state.nation);
        root.innerHTML = `${header}${makeupRow}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">${isSemiPresRender ? 'Semi-Presidential System' : 'Presidential System'}</div>
                <div class="cf-no-desc">${isSemiPresRender
                    ? 'The President nominates a Prime Minister for parliamentary confirmation. The PM then appoints cabinet ministers. No coalition formation is required.'
                    : 'The President governs directly and nominates cabinet ministers. No coalition formation is required.'
                }</div>
            </div>
        </div>`;
        return;
    }

    if (!_formationNeeded) {
        root.innerHTML = `${header}${makeupRow}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active. No formation needed.</div>
            </div>
        </div>`;
        return;
    }

    // Pre-election state: no completed election yet, but one is scheduled.
    // Reads the earliest scheduled election from _scheduledElections — same
    // source the header derives its dates from, one fetch at init.
    if (!_electionId) {
        const nextTick = _scheduledElections[0]?.election_tick;
        const ticksUntil = nextTick != null ? Math.max(0, nextTick - _currentTick) : '?';
        root.innerHTML = `${header}${makeupRow}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${ticksUntil}</strong> tick${ticksUntil !== 1 ? 's' : ''}.</div>
            </div>
        </div>`;
        return;
    }

    // Fetch active proposals
    await loadFormations();

    const faction = _state.faction;
    const ticksElapsed = _lastElectionTick !== null ? Math.max(0, _currentTick - _lastElectionTick) : 0;
    const ticksRemaining = Math.max(0, FORMATION_DEADLINE_TICKS - ticksElapsed);
    const progressPct = Math.min(100, (ticksElapsed / FORMATION_DEADLINE_TICKS) * 100);
    const accruedApproval = ticksElapsed * 2;

    let urgency = 'safe';
    if (ticksRemaining <= 1) urgency = 'critical';
    else if (ticksRemaining <= 2) urgency = 'warning';

    const icon = urgency === 'critical' ? '⚠️' : urgency === 'warning' ? '⏳' : '🤝';
    const title = urgency === 'critical' ? 'No Government — Snap Election Imminent'
        : urgency === 'warning' ? 'Coalition Formation — Time Running Out'
        : 'Coalition Formation In Progress';
    const subtitle = urgency === 'critical' ? 'Form a government immediately or face snap elections'
        : urgency === 'warning' ? 'Parties are negotiating — the deadline is approaching'
        : 'Parties are negotiating a coalition — propose or join one below';

    const mySeats = _allParties.find(p => p.id === faction.id)?.seats || 0;
    const canPropose = mySeats > 0;
    const myFormation = _formations.find(f => f.proposed_by === faction.id) || null;
    const alreadyProposed = !!myFormation;
    const isEditing = !!myFormation && _editingFormationId === myFormation.id;

    // Proposal creation UI
    let proposeHtml = '';
    if (!canPropose) {
        proposeHtml = `<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>`;
    } else if (alreadyProposed && !isEditing) {
        proposeHtml = `<div class="cf-note">You have already submitted a proposal for this election. Use <strong>Edit Proposal</strong> on your card below to change the membership.</div>`;
    } else {
        // Edit mode pre-seeds _proposalSelectedParties from f.party_ids.
        const selectedSet = new Set(_proposalSelectedParties);
        const formatStats = (keys) => (keys || []).map(k => k.replace(/_/g, ' ')).join(', ');
        const partyGrid = _allParties.map(p => {
            const isYou = p.id === faction.id;
            const isChecked = isYou || selectedSet.has(p.id);
            const seats = p.seats || 0;
            const color = p.party_color || '#888';
            const platforms = (_platformsByFaction[p.id] || [])
                .map(key => PLATFORMS.find(pl => pl.id === key))
                .filter(Boolean);
            const platformRows = platforms.map(plat => `<div class="cf-platform">
                <span class="cf-platform-label"><span class="cf-platform-icon">${plat.icon}</span> ${esc(plat.name)}</span>
                <span class="cf-platform-stats">
                    <span class="cf-stat-up">&uarr; ${formatStats(plat.improve)}</span>
                    <span class="cf-stat-down">&darr; ${formatStats(plat.worsen)}</span>
                </span>
            </div>`).join('');
            const platformsBlock = platformRows
                ? `<div class="cf-check-platforms">${platformRows}</div>`
                : `<div class="cf-check-platforms cf-check-platforms--empty">No adopted platforms.</div>`;
            const inactive = inactivityLabel(p);
            return `<div class="cf-party-check ${isChecked ? 'checked' : ''} ${isYou ? 'disabled' : ''}" data-party-id="${p.id}" style="border-left:3px solid ${color};">
                <div class="cf-party-info">
                    <div class="cf-check-box">${isChecked ? '✓' : ''}</div>
                    <span class="cf-check-name">${esc(p.faction_name)}</span>
                    ${inactive}
                    <span class="cf-check-seats">${seats} seats</span>
                </div>
                ${platformsBlock}
            </div>`;
        }).join('');

        const previewSeats = _proposalSelectedParties.reduce((s, pid) => s + (_allParties.find(p => p.id === pid)?.seats || 0), 0) || mySeats;
        const previewPct = _totalSeats ? Math.round((previewSeats / _totalSeats) * 100) : 0;
        const editTitle = isEditing ? 'Edit Your Proposal' : 'Propose a Government';
        const editDesc = isEditing
            ? `Add or remove parties. Saving resets all support — every coalition member must re-vote, including you. You need ${_majoritySeats}+ seats for a majority.`
            : `Select which parties will form the coalition. You need ${_majoritySeats}+ seats for a majority.`;
        const submitBtn = isEditing
            ? `<button class="cf-submit-btn" id="cf-save-edit-btn" data-formation-id="${myFormation.id}">Save Changes</button>
               <button class="cf-submit-btn" id="cf-cancel-edit-btn" style="background:var(--bg-body);color:var(--text-dim);margin-left:8px;">Cancel</button>`
            : `<button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>`;
        proposeHtml = `
            <div class="cf-propose-section">
                <div class="cf-section-title">${editTitle}</div>
                <div class="cf-section-desc">${editDesc}</div>
                <div class="cf-party-grid" id="cf-party-grid">${partyGrid}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${previewSeats}</span> / ${_totalSeats}
                    (<span id="cf-preview-pct">${previewPct}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${_majoritySeats} seats</span>
                </div>
                ${submitBtn}
            </div>`;
    }

    // Active proposals
    const proposalsHtml = _formations.length > 0 ? `
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${_formations.map(f => {
            const proposer = _allParties.find(p => p.id === f.proposed_by);
            const partyIds = f.party_ids || [];
            const coalitionSeats = partyIds.reduce((s, pid) => s + (_allParties.find(p => p.id === pid)?.seats || 0), 0);
            const coalitionPct = _totalSeats ? Math.round((coalitionSeats / _totalSeats) * 100) : 0;
            const meetsThreshold = coalitionSeats >= _majoritySeats;

            const chips = partyIds.map(pid => {
                const p = _allParties.find(x => x.id === pid);
                const inactive = inactivityLabel(p);
                return `<span class="cf-party-chip" style="border-left:2px solid ${p?.party_color || '#888'};">${esc(p?.faction_name || '?')} · ${p?.seats || 0}${inactive ? ' ' + inactive : ''}</span>`;
            }).join('');

            let statusHtml = '';
            if (f.iAmSupporting) statusHtml = `<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>`;
            else if (f.iAmInvited) statusHtml = `<span class="cf-status cf-status--invited">INVITED</span>`;
            else statusHtml = `<span class="cf-status cf-status--locked">NOT INVITED</span>`;

            const supportBtns = f.iAmInvited && !f.iAmSupporting
                ? `<button class="cf-support-btn" data-formation-id="${f.id}" data-action="support">Support This Coalition</button>`
                : f.iAmSupporting
                ? `<button class="cf-withdraw-btn" data-formation-id="${f.id}" data-action="withdraw">Withdraw Support</button>`
                : '';

            // Proposer-only Edit; locked once unanimous (configure step is in motion).
            const allSupported = f.supportCount >= f.coalitionSize;
            const iAmProposer = f.proposed_by === faction.id;
            const editBtn = iAmProposer && !allSupported && _editingFormationId !== f.id
                ? `<button class="cf-edit-btn" data-formation-id="${f.id}" data-action="edit" style="margin-left:8px;background:var(--bg-body);color:var(--accent);border:1px solid var(--accent);padding:4px 10px;font-family:var(--font-mono);font-size:9px;cursor:pointer;">Edit</button>`
                : '';

            // Show ministry assignment when all coalition members have supported
            const isExpanded = _expandedFormationId === f.id;
            const showConfigBtn = allSupported && f.iAmInvited && !isExpanded;
            const showConfig = allSupported && isExpanded;

            return `<div class="cf-proposal-card ${f.iAmSupporting ? 'supporting' : ''} ${!f.iAmInvited ? 'not-invited' : ''}">
                <div class="cf-proposal-title">${esc(proposer?.faction_name || 'Unknown')} Coalition ${statusHtml}${editBtn}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${meetsThreshold ? 'var(--green)' : 'var(--red)'};">${coalitionSeats}</span> (${coalitionPct}%) ${meetsThreshold ? '✓' : '— below threshold'}</div>
                <div class="cf-proposal-chips">${chips}</div>
                <div class="cf-proposal-support">Support: ${f.supportCount} / ${f.coalitionSize} coalition members ${allSupported ? '<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>' : ''}</div>
                ${supportBtns}
                ${showConfigBtn ? `<button class="cf-support-btn" data-formation-id="${f.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>` : ''}
                ${showConfig ? renderMinistryAssignment(f) : ''}
            </div>`;
        }).join('')}</div>
    ` : '';

    root.innerHTML = `${header}${makeupRow}
    <div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${urgency}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${icon}</span>
                <div>
                    <div class="cf-banner-title">${title}</div>
                    <div class="cf-banner-subtitle">${subtitle}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${urgency}" style="width:${progressPct}%;"></div></div>
                <div class="cf-countdown-text">${ticksRemaining > 0 ? ticksRemaining + ' tick' + (ticksRemaining !== 1 ? 's' : '') + ' remaining' : '⚡ SNAP ELECTION IMMINENT'}</div>
            </div>
            <div class="cf-penalties">
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-2%</div>
                    <div class="cf-penalty-label">Approval / Tick</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--orange);">${ticksElapsed}</div>
                    <div class="cf-penalty-label">Ticks Elapsed</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-${accruedApproval}%</div>
                    <div class="cf-penalty-label">Total Lost</div>
                </div>
            </div>
        </div>

        ${proposeHtml}
        ${proposalsHtml}
    </div>`;

    // Edit mode preserves _proposalSelectedParties across re-renders.
    if (!isEditing) _proposalSelectedParties = [faction.id];
    bindFormationEvents(root);
}

// ════════════════════════ MINISTRY ASSIGNMENT ════════════════════════

const MINISTRY_NAMES = {
    prime_minister: 'Prime Minister',
    interior: 'Interior', foreign: 'Foreign Affairs', defense: 'Defense',
    finance: 'Finance', education: 'Education', healthcare: 'Healthcare',
    labor: 'Labor', justice: 'Justice', trade: 'Trade',
    energy: 'Energy', transportation: 'Transportation', security: 'Security',
};
// MINISTRY_NAMES (short labels) is the only locally-defined ministry map
// — the office-name and key-list maps are the shared exports from
// government-types.js (MINISTRY_OFFICE_NAMES, CABINET_MINISTRY_KEYS).

function getExpectedCabinetMinistryKeys(nation) {
    const parliamentaryKeys = ['prime_minister', 'interior', 'foreign', 'defense', 'finance',
        'education', 'healthcare', 'labor', 'justice', 'trade', 'energy', 'transportation'];
    const presidentialKeys = ['interior', 'foreign', 'defense', 'finance',
        'education', 'healthcare', 'labor', 'justice', 'trade', 'energy', 'transportation'];

    // Semi-presidential has a PM seat (parliamentary shape); pure presidential omits it.
    if (isSemiPresidential(nation)) return parliamentaryKeys;
    return hasElectedPresident(nation) ? presidentialKeys : parliamentaryKeys;
}

function renderMinistryAssignment(formation) {
    const coalitionParties = (formation.party_ids || [])
        .map(pid => _allParties.find(p => p.id === pid))
        .filter(Boolean);
    // In an absolute monarchy the King appoints freely — the "coalition"
    // is a single-party formality. Without this branch the dropdown only
    // listed his own party (formation.party_ids), so the King could not
    // appoint anyone else. Mirrors the openAppointModal behavior in
    // government.html.
    const candidateParties = isAbsoluteMonarchy(_state.nation)
        ? _allParties
        : coalitionParties;
    const isMember = (formation.party_ids || []).includes(_state.faction?.id);
    const assignments = formation.ministry_assignments || {};

    // Load existing assignments into local state
    _ministryAssignments = { ...assignments };

    // Check if current player's party is selected as PM
    const myFactionId = _state.faction?.id;
    const pmPartyId = _ministryAssignments.prime_minister;
    const iAmPM = pmPartyId === myFactionId;

    let html = `<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;

    for (const key of CABINET_MINISTRY_KEYS) {
        const label = MINISTRY_NAMES[key] || key;
        const isPM = key === 'prime_minister';
        const assignedId = _ministryAssignments[key];

        // All coalition members get dropdowns
        if (isMember) {
            html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${isPM ? '700' : '400'};color:${isPM ? 'var(--accent)' : 'var(--text-secondary)'};letter-spacing:0.5px;">${label}</span>
                <select data-ministry="${key}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${candidateParties.map(p => `<option value="${p.id}" ${assignedId === p.id ? 'selected' : ''}>${esc(p.faction_name)} (${p.seats || 0} seats)</option>`).join('')}
                </select>
            </div>`;
        }
    }

    // Form Government button — only the party selected as PM can click it
    const pmAssigned = !!_ministryAssignments.prime_minister;
    if (pmAssigned && iAmPM) {
        html += `<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;
    } else if (pmAssigned && !iAmPM) {
        const pmParty = candidateParties.find(p => p.id === pmPartyId);
        html += `<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${esc(pmParty?.faction_name || 'PM party')}</span> to click Form Government.
        </div>`;
    } else {
        html += `<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;
    }

    html += '</div>';
    return html;
}

async function handleFormGovernment(formation, root) {
    if (_formingGovernment) return;
    const pmPartyId = _ministryAssignments.prime_minister;
    if (!pmPartyId) { alert('You must assign a Prime Minister first.'); return; }

    console.log('[Coalition] handleFormGovernment called. Assignments:', JSON.stringify(_ministryAssignments));
    console.log('[Coalition] Formation:', formation.id, 'PM party:', pmPartyId);

    _formingGovernment = true;
    const btn = document.getElementById('cf-form-gov-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'FORMING...'; }

    try {
        const nation = _state.nation;
        const nationId = nation.id;

        // Generate minister names for each assigned slot. The RPC
        // finalize_government_formation wipes all ministries and then
        // repopulates from government_formations.minister_names — without
        // this block, minister_names is null and the RPC leaves the cabinet
        // blank after wiping it.
        const namePools = getNationNames(nation?.name) || {};
        const firstPool = namePools.firstNames || ['Alex', 'Maria', 'Carlos'];
        const lastPool = namePools.lastNames || ['Garcia', 'Torres', 'Silva'];
        const minister_names = {};
        for (const [key, partyId] of Object.entries(_ministryAssignments || {})) {
            if (!partyId) continue;
            minister_names[key] = {
                first_name: firstPool[Math.floor(Math.random() * firstPool.length)],
                last_name: lastPool[Math.floor(Math.random() * lastPool.length)],
                age: 35 + Math.floor(Math.random() * 25),
            };
        }

        // Save ministry assignments + names to the formation
        const { error: assignErr } = await _supabase.from('government_formations').update({
            ministry_assignments: _ministryAssignments,
            minister_names,
        }).eq('id', formation.id);
        if (assignErr) throw new Error('Failed to save assignments: ' + assignErr.message);

        // Try the atomic RPC first (sets formation status, cancels rivals, etc.)
        let rpcSucceeded = false;
        try {
            const baselines = buildMinistryBaselines ? buildMinistryBaselines(null, nation) : {};
            const { error: rpcErr } = await _supabase.rpc('finalize_government_formation', {
                p_formation_id: formation.id,
                p_caller_faction_id: _state.faction.id,
                p_ministry_baselines: baselines || {},
            });
            if (rpcErr) throw rpcErr;
            rpcSucceeded = true;
        } catch (rpcErr) {
            console.warn('[Coalition] RPC failed, using fallback:', rpcErr.message);
        }

        // Always run the fallback to ensure formation is marked 'formed' + ministries created
        if (!rpcSucceeded) {
            await formGovernmentFallback(formation);
        }

        // Even if RPC "succeeded", ensure status is 'formed' (RPC may have partially failed)
        await _supabase.from('government_formations').update({
            status: 'formed',
            formed_at: new Date().toISOString(),
        }).eq('id', formation.id);

        // Enforce single-source government row: dissolve every other
        // active/caretaker/formed formation for this nation.
        await _supabase.from('government_formations').update({ status: 'dissolved' })
            .eq('nation_id', nationId)
            .neq('id', formation.id)
            .in('status', ['active', 'caretaker', 'formed']);

        // Ensure ministries are populated regardless of RPC path
        // Validate both active row count and vacant row count.
        const expectedCabinetKeys = getExpectedCabinetMinistryKeys(nation);
        const expectedCabinetSize = expectedCabinetKeys.length;
        const { count: totalActiveCount } = await _supabase.from('ministries')
            .select('id', { count: 'exact', head: true })
            .eq('nation_id', nationId).eq('is_active', true);
        const { count: vacantCount } = await _supabase.from('ministries')
            .select('id', { count: 'exact', head: true })
            .eq('nation_id', nationId).eq('is_active', true).is('party_id', null);

        if (!totalActiveCount || totalActiveCount < expectedCabinetSize || (vacantCount && vacantCount > 0)) {
            console.warn(
                `[Coalition] Ministry invariant check failed (expected=${expectedCabinetSize}, active=${totalActiveCount || 0}, vacant=${vacantCount || 0}) — populating from assignments`
            );
            await createMinistriesFromAssignments(nationId);
        }

        // Always call rolloverAdministration — its internal continuity rule
        // decides whether to update the open admin row in place (same PM) or
        // close it and insert a new one (different PM). Skipping when an open
        // admin exists left that row with stale coalition/pm_party data after
        // a reshuffle.
        const coalition = {
            id: formation.id,
            party_ids: formation.party_ids || [],
            lead_party_id: _ministryAssignments.prime_minister,
        };
        await rolloverAdministration(
            _supabase, nationId, _state.nation,
            'election', coalition, _allParties,
            _currentTick, _state.shard?.current_date || '',
            Number(_state.nation?.gov_approval ?? 50)
        );

        // Auto-appoint PM's party leader (skip coalition check — we just formed it)
        await autoAppointPartyLeaderAsPM(_supabase, nationId, pmPartyId, _currentTick, { skipCoalitionCheck: true });

        _formationNeeded = false;
        alert('Government formed successfully!');
        await renderFormationTab(root);
    } catch (err) {
        console.error('[Coalition] Form government failed:', err);
        alert('Failed to form government: ' + (err.message || err));
    } finally {
        _formingGovernment = false;
        if (btn) { btn.disabled = false; btn.textContent = 'FORM GOVERNMENT'; }
    }
}

async function formGovernmentFallback(formation) {
    const nationId = _state.nation.id;

    // Cancel rival formations
    const { error: cancelErr } = await _supabase.from('government_formations').update({ status: 'cancelled' })
        .eq('nation_id', nationId).eq('status', 'active').neq('id', formation.id);
    if (cancelErr) console.warn('[Coalition] Failed to cancel rival formations:', cancelErr.message);

    // Mark this formation as formed
    const { error: formErr } = await _supabase.from('government_formations').update({
        status: 'formed',
        formed_at: new Date().toISOString(),
    }).eq('id', formation.id);
    if (formErr) throw formErr;

    // Reset failed formation attempts
    const { error: resetErr } = await _supabase.from('nations').update({ failed_formation_attempts: 0 }).eq('id', nationId);
    if (resetErr) console.warn('[Coalition] Failed to reset formation attempts:', resetErr.message);

    await createMinistriesFromAssignments(nationId);

    // Create new administration record
    const coalition = {
        id: formation.id,
        party_ids: formation.party_ids || [],
        lead_party_id: _ministryAssignments.prime_minister,
    };
    await rolloverAdministration(
        _supabase, nationId, _state.nation,
        'election', coalition, _allParties,
        _currentTick, _state.shard?.current_date || '',
        Number(_state.nation?.gov_approval ?? 50)
    );

    // Log to event_log so it appears in the Executive Timeline
    try {
        const pmPartyId = _ministryAssignments.prime_minister;
        const pmParty = _allParties.find(p => p.id === pmPartyId);
        const partyDetails = (formation.party_ids || []).map(pid => {
            const p = _allParties.find(x => x.id === pid);
            return p ? `${p.faction_name} (${p.seats || 0})` : null;
        }).filter(Boolean).join(', ');
        await _supabase.from('event_log').insert({
            nation_id: nationId,
            event_name: 'Coalition Government Formed',
            category: 'government',
            fired_at_tick: _currentTick,
            description_used: `${pmParty?.faction_name || 'PM party'} formed a coalition government with: ${partyDetails}`,
            description_chosen: `${pmParty?.faction_name || 'PM party'} formed a coalition government with: ${partyDetails}`,
        });
    } catch (logErr) {
        console.warn('[Coalition] event_log insert failed (non-fatal):', logErr.message);
    }
}

async function createMinistriesFromAssignments(nationId) {
    // Upsert ministry rows — update if they exist, insert if they don't.
    // ministry_name uses the shared MINISTRY_OFFICE_NAMES map so this stays
    // aligned with bills.js, executive-orders.js, presidential.js, etc.
    let updated = 0;
    for (const [key, partyId] of Object.entries(_ministryAssignments)) {
        if (!partyId) continue;
        const names = getNationNames(_state.nation?.name) || {};
        const firstPool = names.firstNames || ['Alex', 'Maria', 'Carlos'];
        const lastPool = names.lastNames || ['Garcia', 'Torres', 'Silva'];
        const firstName = firstPool[Math.floor(Math.random() * firstPool.length)];
        const lastName = lastPool[Math.floor(Math.random() * lastPool.length)];
        const age = 35 + Math.floor(Math.random() * 25);
        const baselines = buildMinistryBaselines ? buildMinistryBaselines(key, _state.nation) : {};

        // Try update first
        const { data: updatedRows, error: minErr } = await _supabase.from('ministries').update({
            party_id: partyId,
            minister_first_name: firstName,
            minister_last_name: lastName,
            minister_age: age,
            minister_approval: 50,
            stat_baselines: baselines,
            is_active: true,
        }).eq('nation_id', nationId).eq('ministry_key', key).select('id');

        if (minErr) {
            console.error(`[Coalition] FAILED to update ministry ${key}:`, minErr.message);
        } else if (!updatedRows || updatedRows.length === 0) {
            // No existing row — insert
            const { error: insErr } = await _supabase.from('ministries').insert({
                nation_id: nationId,
                ministry_key: key,
                ministry_name: MINISTRY_OFFICE_NAMES[key] || key,
                party_id: partyId,
                minister_first_name: firstName,
                minister_last_name: lastName,
                minister_age: age,
                minister_approval: 50,
                stat_baselines: baselines,
                is_active: true,
            });
            if (insErr) {
                console.error(`[Coalition] FAILED to insert ministry ${key}:`, insErr.message);
            } else {
                updated++;
            }
        } else {
            updated++;
        }
    }
    console.log(`[Coalition] Updated ${updated} ministries for nation ${nationId}`);
}

// ════════════════════════ DATA ════════════════════════

async function loadFormations() {
    if (!_electionId) { _formations = []; return; }

    const { data: formations } = await _supabase
        .from('government_formations')
        .select('*')
        .eq('election_id', _electionId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

    const enriched = [];
    for (const f of (formations || [])) {
        const { data: supports } = await _supabase
            .from('government_formation_support')
            .select('faction_id, supports')
            .eq('formation_id', f.id);

        const coalitionPartyIds = f.party_ids || [];
        const coalitionSupports = (supports || []).filter(s => coalitionPartyIds.includes(s.faction_id));
        const supportCount = coalitionSupports.filter(s => s.supports).length;
        const coalitionSize = coalitionPartyIds.length;
        const mySupport = (supports || []).find(s => s.faction_id === _state.faction?.id);
        const iAmSupporting = mySupport?.supports === true;
        const iAmInvited = coalitionPartyIds.includes(_state.faction?.id);

        enriched.push({ ...f, supportCount, coalitionSize, iAmSupporting, iAmInvited });
    }
    _formations = enriched;
}

// ════════════════════════ EVENTS ════════════════════════

let _formationEventsBound = false;
function bindFormationEvents(root) {
    // Only bind once — delegation from root survives innerHTML rebuilds
    if (_formationEventsBound) return;
    _formationEventsBound = true;
    root.addEventListener('click', async (e) => {
        // Party checkbox toggle. Phase 2c: blocs are invited as a unit —
        // toggling any member also toggles every other party in the same
        // bloc, so the proposal can't end up with a partial bloc.
        const checkItem = e.target.closest('.cf-party-check:not(.disabled)');
        if (checkItem) {
            const pid = checkItem.dataset.partyId;
            const party = _allParties.find(p => p.id === pid);
            const blocId = party?.bloc_id || null;
            const turnOn = !_proposalSelectedParties.includes(pid);
            const targetIds = blocId
                ? _allParties.filter(p => p.bloc_id === blocId).map(p => p.id)
                : [pid];

            for (const tid of targetIds) {
                const idx = _proposalSelectedParties.indexOf(tid);
                if (turnOn && idx === -1) _proposalSelectedParties.push(tid);
                if (!turnOn && idx > -1) _proposalSelectedParties.splice(idx, 1);
                const row = root.querySelector(`.cf-party-check[data-party-id="${tid}"]`);
                if (!row) continue;
                row.classList.toggle('checked', turnOn);
                const box = row.querySelector('.cf-check-box');
                if (box) box.textContent = turnOn ? '✓' : '';
            }
            updateSeatPreview();
            return;
        }

        // Submit proposal
        if (e.target.closest('#cf-propose-btn')) {
            await createProposal(root);
            return;
        }

        // Edit-proposal entry / save / cancel.
        const editBtn = e.target.closest('.cf-edit-btn');
        if (editBtn && editBtn.dataset.action === 'edit') {
            const formationId = editBtn.dataset.formationId;
            const f = _formations.find(x => x.id === formationId);
            if (f && f.proposed_by === _state.faction?.id) {
                _editingFormationId = formationId;
                _proposalSelectedParties = [...(f.party_ids || [])];
                await renderFormationTab(root);
            }
            return;
        }
        if (e.target.closest('#cf-save-edit-btn')) {
            const formationId = e.target.closest('#cf-save-edit-btn').dataset.formationId;
            await updateProposal(formationId, root);
            return;
        }
        if (e.target.closest('#cf-cancel-edit-btn')) {
            _editingFormationId = null;
            _proposalSelectedParties = [_state.faction?.id].filter(Boolean);
            await renderFormationTab(root);
            return;
        }

        // Support/withdraw/configure
        const supportBtn = e.target.closest('.cf-support-btn, .cf-withdraw-btn');
        if (supportBtn) {
            const formationId = supportBtn.dataset.formationId;
            const action = supportBtn.dataset.action;
            if (action === 'configure') {
                _expandedFormationId = formationId;
                const f = _formations.find(x => x.id === formationId);
                if (f) _ministryAssignments = { ...(f.ministry_assignments || {}) };
                await renderFormationTab(root);
            } else {
                await toggleSupport(formationId, action === 'support', root);
            }
            return;
        }

        // Form Government button
        if (e.target.closest('#cf-form-gov-btn')) {
            const f = _formations.find(x => x.id === _expandedFormationId);
            if (f) await handleFormGovernment(f, root);
            return;
        }
    });

    // Ministry select change handler (delegated)
    root.addEventListener('change', (e) => {
        const sel = e.target.closest('.cf-ministry-select');
        if (!sel) return;
        const key = sel.dataset.ministry;
        const val = sel.value || null;
        _ministryAssignments[key] = val;

        // Save assignments to DB in background
        if (_expandedFormationId) {
            _supabase.from('government_formations').update({
                ministry_assignments: _ministryAssignments,
            }).eq('id', _expandedFormationId).then(({ error }) => {
                if (error) console.warn('[Coalition] Failed to save assignment:', error.message);
            });
        }

        // Toggle form button state
        const btn = document.getElementById('cf-form-gov-btn');
        if (btn) {
            const pmAssigned = !!_ministryAssignments.prime_minister;
            btn.disabled = !pmAssigned;
            btn.style.color = pmAssigned ? '#000' : 'var(--text-dim)';
            btn.style.background = pmAssigned ? 'var(--green)' : 'var(--bg-body)';
            btn.style.borderColor = pmAssigned ? 'var(--green)' : 'var(--border-main)';
            btn.style.cursor = pmAssigned ? 'pointer' : 'not-allowed';
        }
    });
}

function updateSeatPreview() {
    const seatsEl = document.getElementById('cf-preview-seats');
    const pctEl = document.getElementById('cf-preview-pct');
    const threshEl = document.getElementById('cf-preview-threshold');
    if (!seatsEl) return;

    const seats = _proposalSelectedParties.reduce((s, pid) => s + (_allParties.find(p => p.id === pid)?.seats || 0), 0);
    const pct = _totalSeats ? Math.round((seats / _totalSeats) * 100) : 0;
    const meets = seats >= _majoritySeats;

    seatsEl.textContent = seats;
    seatsEl.style.color = meets ? 'var(--green)' : 'var(--text-bright)';
    pctEl.textContent = pct;
    threshEl.textContent = meets ? `✓ Meets ${_majoritySeats}-seat threshold` : `— needs ${_majoritySeats} seats`;
    threshEl.style.color = meets ? 'var(--green)' : 'var(--text-dim)';
}

async function createProposal(root) {
    if (_submitting) return;
    const faction = _state.faction;
    const mySeats = _allParties.find(p => p.id === faction.id)?.seats || 0;
    if (mySeats === 0) return;

    const partyIds = [...new Set(_proposalSelectedParties)];
    const coalitionSeats = partyIds.reduce((s, pid) => s + (_allParties.find(p => p.id === pid)?.seats || 0), 0);
    if (coalitionSeats < _majoritySeats) {
        alert(`Coalition needs ${_majoritySeats} seats. Currently: ${coalitionSeats}.`);
        return;
    }

    _submitting = true;
    const btn = document.getElementById('cf-propose-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

    try {
        const { data: shard } = await _supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        const { data, error } = await _supabase.from('government_formations').insert({
            nation_id: _state.nation.id,
            election_id: _electionId,
            proposed_by: faction.id,
            party_ids: partyIds,
            status: 'active',
            game_year: shard?.current_date || '',
        }).select().single();

        if (error) { alert('Error: ' + error.message); return; }

        // Auto-support own proposal via direct insert (avoids RPC compatibility issues)
        const { error: supportErr } = await _supabase.from('government_formation_support').upsert({
            formation_id: data.id,
            faction_id: faction.id,
            supports: true,
        }, { onConflict: 'formation_id,faction_id' });
        if (supportErr) console.warn('[Coalition] Auto-support insert failed:', supportErr.message);

        await renderFormationTab(root);
    } catch (err) {
        console.error('[Coalition] Create proposal error:', err);
        alert('Failed to create proposal: ' + (err.message || err));
    } finally {
        _submitting = false;
    }
}

// RPC resets every support row — all members must re-vote on the new membership.
async function updateProposal(formationId, root) {
    if (_submitting) return;
    const faction = _state.faction;
    if (!faction) return;

    const partyIds = [...new Set(_proposalSelectedParties)];
    const coalitionSeats = partyIds.reduce((s, pid) => s + (_allParties.find(p => p.id === pid)?.seats || 0), 0);
    if (coalitionSeats < _majoritySeats) {
        alert(`Coalition needs ${_majoritySeats} seats. Currently: ${coalitionSeats}.`);
        return;
    }

    _submitting = true;
    const btn = document.getElementById('cf-save-edit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

    try {
        const { data, error } = await _supabase.rpc('update_coalition_proposal', {
            p_formation_id: formationId,
            p_party_ids:    partyIds,
        });
        if (error) { alert('Failed to save changes: ' + error.message); return; }
        if (data && data.success === false) { alert('Failed to save changes: ' + (data.error || 'unknown')); return; }
        _editingFormationId = null;
        await renderFormationTab(root);
    } catch (err) {
        console.error('[Coalition] Update proposal error:', err);
        alert('Failed to save changes: ' + (err.message || err));
    } finally {
        _submitting = false;
    }
}

async function toggleSupport(formationId, supports, root) {
    try {
        // Use direct upsert instead of RPC for compatibility
        const { error } = await _supabase.from('government_formation_support').upsert({
            formation_id: formationId,
            faction_id: _state.faction?.id,
            supports: supports,
        }, { onConflict: 'formation_id,faction_id' });
        if (error) console.error('[Coalition] Toggle support error:', error.message);
        await renderFormationTab(root);
    } catch (err) {
        console.error('[Coalition] Toggle support error:', err);
    }
}
