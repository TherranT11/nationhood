// js/coalition-formation.js — Coalition Formation UI for the Election tab
// Detects post-election state, shows formation banner, proposal list, proposal creation,
// ministry assignment, and Form Government action.

import { buildMinistryBaselines } from './game/stats.js';
import { getNationNames } from './game/political-actions.js';
import { fetchActiveCoalition } from './game/government-structure.js';
import { CABINET_MINISTRY_KEYS, hasElectedPresident, isAbsoluteMonarchy } from './game/government-types.js';
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
// Active Prime Minister / Head of Government row. Kept separate from
// _activeCoalition because a malformed/stale formation can exist without a
// seated PM; that vacancy needs a recovery workflow, not a misleading
// "Government Formed" dead end.
let _activeHog = null;
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
    const [electionResult, shardResult, activeCoalition, partiesResult, scheduledResult, platformsResult, hogResult] = await Promise.all([
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
        supabase.from('head_of_government')
            .select('id, faction_id, first_name, last_name, active')
            .eq('nation_id', nation.id)
            .eq('active', true)
            .maybeSingle(),
    ]);

    _currentTick = shardResult.data?.current_tick ?? 0;
    _allParties = partiesResult.data || [];
    _totalSeats = _allParties.reduce((s, p) => s + (p.seats || 0), 0);
    _majoritySeats = Math.ceil(_totalSeats / 2) + 1;
    _scheduledElections = scheduledResult?.data || [];
    _activeCoalition = activeCoalition || null;
    _activeHog = hogResult?.data || null;
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

    // Presidential systems don't use coalition formation — the
    // president governs. The Election tab renders a system-specific
    // blurb via the early return below. Use the canonical helper
    // rather than substring-matching government_type (which would
    // miscategorize parliamentary nations that happen to have a directly-
    // elected ceremonial head of state, e.g. Vostia).
    if (hasElectedPresident(nation)) {
        _formationNeeded = false;
        return { needed: false };
    }

    // Set _electionId / _lastElectionTick first so loadFormations()
    // (called below for the invited-proposal check) can run.
    if (election) {
        _electionId = election.id;
        _lastElectionTick = election.election_tick;
    }

    if (election && !hasFormedGov) {
        _formationNeeded = true;
    } else {
        // Default: formation needed only when no formed government exists.
        // Exception 1: an emergency_minority government's PM party can re-enter
        // the formation flow to propose a real majority coalition.
        // finalize_government_formation (20260910:127) dissolves the prior
        // minority formation atomically when the new coalition is sealed.
        const minorityPromotePath = activeCoalition?.formation_type === 'emergency_minority'
            && Array.isArray(activeCoalition.party_ids)
            && activeCoalition.party_ids.includes(faction.id);

        // Exception 2: an active formation proposal exists for this election
        // that lists my party. Without this branch the invited parties
        // (especially ones outside the current minority government) see
        // "Government Formed" and have no surface to act on the proposal
        // that's blocking the snap-election timer.
        //
        // Source of truth: loadFormations() already fetches active proposals
        // for _electionId and tags each with iAmInvited. Reusing it here
        // means the "am I invited?" check lives in exactly one place
        // — instead of running a parallel query that could drift.
        let invitedToProposal = false;
        if (election) {
            await loadFormations();
            invitedToProposal = (_formations || []).some(f => f.iAmInvited);
        }

        _formationNeeded = !hasFormedGov || minorityPromotePath || invitedToProposal;
    }

    return { needed: _formationNeeded };
}

// isFormationNeeded export removed — the politics.html badge that
// consumed it is gone; coalition formation is now entry-pointed via
// the [Form Coalition] action card on the Actions subtab. The internal
// _formationNeeded flag still gates rendering inside renderFormationTab
// itself, so it stays where it is.

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

    // Pure parliamentary nations get one election block ("NEXT ELECTION").
    // Presidential nations get two stacked blocks — NEXT GENERAL
    // ELECTION (parliamentary) and NEXT PRESIDENTIAL ELECTION —
    // with subtitles indicating whether they're paired (same tick = a
    // combined General Election cycle) or staggered (parliamentary
    // midterm without a presidential vote, or vice versa).
    const isPresidentialSystem = hasElectedPresident(nation);
    const currentTick = Number(_currentTick) || 0;
    const nextParl = _scheduledElections.find(e => e.election_type === 'parliamentary') || null;
    const nextPres = _scheduledElections.find(e => e.election_type === 'presidential') || null;

    function fmtBlock(label, election, pairedWith, pairedSubtitle, soloSubtitle) {
        if (!election) {
            return `<div class="cf-eh-stat-label">${label}</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--accent">TBD</div>`;
        }
        const tick = election.election_tick;
        const months = Math.max(0, tick - currentTick);
        const monthLabel = `${months} Month${months === 1 ? '' : 's'}`;
        const dateLabel = tickToDate(tick);
        const isPaired = pairedWith && pairedWith.election_tick === tick;
        const subtitle = isPaired ? pairedSubtitle : soloSubtitle;
        return `<div class="cf-eh-stat-label">${label}</div>
            <div class="cf-eh-stat-value cf-eh-stat-value--accent">${esc(dateLabel)}</div>
            <div class="cf-eh-stat-sub">${esc(monthLabel)}</div>
            <div class="cf-eh-stat-sub">${esc(subtitle)}</div>`;
    }

    let electionBlocks;
    if (isPresidentialSystem) {
        electionBlocks = `<div class="cf-eh-stat">
            ${fmtBlock(
                'NEXT GENERAL ELECTION',
                nextParl,
                nextPres,
                'Parliament + Presidential',
                'Parliament only (Midterm)'
            )}
            <div style="margin-top:14px;border-top:1px solid var(--border-main);padding-top:12px;"></div>
            ${fmtBlock(
                'NEXT PRESIDENTIAL ELECTION',
                nextPres,
                nextParl,
                'Paired with general',
                'Standalone'
            )}
        </div>`;
    } else {
        electionBlocks = `<div class="cf-eh-stat">
            ${fmtBlock(
                'NEXT ELECTION',
                nextParl,
                null,
                'Parliamentary',
                'Parliamentary'
            )}
        </div>`;
    }

    const totalSeats = Number(nation.total_seats) || 0;
    // Electoral frequency: ticks between parliamentary elections per the
    // nation's foundation law. parliamentary_term_ticks is the modern column;
    // election_frequency is the legacy fallback. 1 tick = 1 month.
    const freqMonths = Number(nation.parliamentary_term_ticks) || Number(nation.election_frequency) || 24;
    const freqValue = `${freqMonths} Month${freqMonths === 1 ? '' : 's'}`;
    const nationName = nation.name || 'Unknown';
    const flagSrc = nation.flag_url || `assets/flags/${nationName}.png`;

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
            ${electionBlocks}
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

// ═══════════════════════════════════════════════════════════════════════════
// Nation map — a labelled [Nation] box (→ "{Nation} Whole.png") plus one box
// per province (→ "{Nation} {Province}.png"), toggling one image beneath
// them. Provinces are admin-managed in the DB `provinces` table (read here,
// edited in admin.html's Provinces tab); a nation with no provinces shows
// just the Whole box. Pure CSS (hidden radios + :checked sibling combinator)
// so it survives innerHTML rebuilds and needs no JS/delegation; a rebuild
// resets to Whole — exactly "clicking [Nation] pulls it back to Whole".
// Missing art hides itself via onerror.
// ═══════════════════════════════════════════════════════════════════════════

// Renders the nation-map row: a Sectors panel (left, 280px) + the map
// (right), both CSS-synced to ONE set of hidden radios so the panel and
// the map always reflect the same selected button with no JS. `sectors`
// is the live per-nation sectors table; `provinces` the per-nation
// provinces; `weightMap` keys `${provinceId}|${sectorId}` -> weight (0-3).
// The Whole panel lists every sector + its nation weight + a TOTAL, and
// flags drift when the provinces don't sum to a sector's nation weight.
// Each province panel shows that province's per-sector split. Read-only.
function buildNationMap(sectors = [], provinces = [], weightMap = {}) {
    const nm = _state?.nation?.name;
    if (!nm) return '';
    // Whole first (checked default) + one option per province. Province
    // keys are sanitised names, de-duped so they stay valid/unique CSS
    // idents even if two names collapse to the same slug.
    const usedKeys = new Set(['whole']);
    const opts = [{ key: 'whole', label: nm, file: `${nm} Whole.png`, whole: true }].concat(
        (provinces || []).map(p => {
            let base = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'prov';
            let key = base, n = 2;
            while (usedKeys.has(key)) key = `${base}-${n++}`;
            usedKeys.add(key);
            return { key, label: p.name, file: `${nm} ${p.name}.png`, whole: false, id: p.id };
        })
    );
    // Radios now sit at row level (siblings of both columns) so a single
    // :checked drives the map image, the active button AND the sectors
    // panel via the general-sibling combinator.
    const activeRules = opts.map(o =>
        `#cf-nm-${o.key}:checked ~ .cf-makeup-right .cf-nm-box[for="cf-nm-${o.key}"]`).join(',\n      ');
    const showImg = opts.map(o =>
        `#cf-nm-${o.key}:checked ~ .cf-makeup-right .cf-nm-img-${o.key} { display: block; }`).join('\n      ');
    const showSec = opts.map(o =>
        `#cf-nm-${o.key}:checked ~ .cf-makeup-left .cf-sec-${o.key} { display: block; }`).join('\n      ');
    const radios = opts.map((o, i) =>
        `<input type="radio" name="cf-nm" id="cf-nm-${o.key}" class="cf-nm-r"${i === 0 ? ' checked' : ''}>`).join('\n      ');
    const boxes = opts.map(o =>
        `<label class="cf-nm-box" for="cf-nm-${o.key}">${esc(o.label)}</label>`).join('\n        ');
    const imgs = opts.map(o =>
        `<img class="cf-nm-img-${o.key}" src="${encodeURI(`assets/${o.file}`)}" alt="${esc(o.label)} map" onerror="this.style.display='none'">`).join('\n        ');

    const secList = sectors || [];
    const provList = provinces || [];
    const pw = (provId, secId) => {
        const v = weightMap?.[`${provId}|${secId}`];
        return Number.isFinite(v) ? v : 0;
    };
    const totalWeight = secList.reduce((s, x) => s + (Number(x.weight) || 0), 0);
    // Drift: under the partition model each sector's province weights
    // should sum to its nation weight. Only meaningful once provinces
    // exist; surfaced (not auto-fixed) per the agreed Phase 1 behaviour.
    const hasDrift = provList.length > 0 && secList.some(s =>
        provList.reduce((a, p) => a + pw(p.id, s.id), 0) !== (Number(s.weight) || 0));
    const wholeRows = secList.length
        ? secList.map(s =>
            `<div class="cf-sec-row"><span class="cf-sec-nm">${esc(s.name)}</span><span class="cf-sec-wt">${Number(s.weight) || 0}</span></div>`).join('')
          + `<div class="cf-sec-row cf-sec-total"><span class="cf-sec-nm">Total Weight</span><span class="cf-sec-wt">${totalWeight}</span></div>`
          + (hasDrift
              ? `<div class="cf-sec-row cf-sec-warn"><span class="cf-sec-nm">&#9888; Provinces don't sum to nation weight</span><span class="cf-sec-wt">rebalance</span></div>`
              : '')
        : `<div class="cf-sec-empty">No sectors configured for this nation.</div>`;
    const provincePanel = (o) => {
        if (!secList.length) return `<div class="cf-sec-empty">No sectors configured for this nation.</div>`;
        const provTotal = secList.reduce((a, s) => a + pw(o.id, s.id), 0);
        return secList.map(s =>
            `<div class="cf-sec-row"><span class="cf-sec-nm">${esc(s.name)}</span><span class="cf-sec-wt">${pw(o.id, s.id)}</span></div>`).join('')
          + `<div class="cf-sec-row cf-sec-total"><span class="cf-sec-nm">Province Total</span><span class="cf-sec-wt">${provTotal}</span></div>`;
    };
    const panels = opts.map(o =>
        `<div class="cf-sec cf-sec-${o.key}">
           <div class="cf-sec-head">Sectors — ${esc(o.label)}</div>
           ${o.whole ? wholeRows : provincePanel(o)}
         </div>`).join('');

    return `
    <style>
      .cf-nm-r { position: absolute; opacity: 0; pointer-events: none; }
      .cf-nm-wrap { margin: 14px 0 0; }
      .cf-nm-boxes { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; margin-bottom: 10px; }
      .cf-nm-box { font-family: var(--font-mono, monospace); font-size: 12px;
        font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--text-secondary, #888); border: 1px solid var(--border-1, rgba(255,255,255,0.08));
        background: var(--bg-2, #1a1a17); padding: 9px 18px; cursor: pointer; user-select: none; }
      .cf-nm-box:hover { color: var(--text-bright, #f0efe6); }
      ${activeRules} {
        color: var(--accent, #d4b87a); border-color: var(--accent, #d4b87a); }
      .cf-nm-stage { border: 1px solid var(--border-1, rgba(255,255,255,0.12));
        background: var(--bg-2, #1a1a17); padding: 10px; }
      .cf-nm-stage img { display: none; max-width: 100%; height: auto; margin: 0 auto; }
      ${showImg}
      .cf-sec { display: none; margin: 14px 0 0;
        border: 1px solid var(--border-1, rgba(255,255,255,0.12));
        background: var(--bg-2, #1a1a17); }
      .cf-sec-head { font-family: var(--font-mono, monospace); font-size: 11px;
        font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
        color: var(--accent, #d4b87a); padding: 10px 12px;
        border-bottom: 1px solid var(--border-1, rgba(255,255,255,0.1)); }
      .cf-sec-row { display: flex; justify-content: space-between; gap: 10px;
        padding: 7px 12px; font-family: var(--font-mono, monospace); font-size: 12px;
        color: var(--text-secondary, #888); border-bottom: 1px solid var(--border-0, rgba(255,255,255,0.05)); }
      .cf-sec-nm { color: var(--text-bright, #f0efe6); }
      .cf-sec-wt { color: var(--text-secondary, #888); font-weight: 700; }
      .cf-sec-total { border-top: 1px solid var(--border-1, rgba(255,255,255,0.12)); border-bottom: none; }
      .cf-sec-total .cf-sec-nm, .cf-sec-total .cf-sec-wt {
        color: var(--accent, #d4b87a); font-weight: 700; text-transform: uppercase;
        font-size: 11px; letter-spacing: 0.06em; }
      .cf-sec-empty { padding: 14px 12px; font-family: var(--font-mono, monospace);
        font-size: 11px; color: var(--text-dim, #4a4940); line-height: 1.5; }
      .cf-sec-warn { border-top: none; }
      .cf-sec-warn .cf-sec-nm, .cf-sec-warn .cf-sec-wt {
        color: var(--amber, #d4a83c); font-weight: 700; font-size: 10px;
        text-transform: uppercase; letter-spacing: 0.05em; }
      ${showSec}
    </style>
    <div class="cf-makeup-row cf-nm-row">
      ${radios}
      <div class="cf-makeup-left">${panels}</div>
      <div class="cf-makeup-right">
        <div class="cf-nm-wrap">
          <div class="cf-nm-boxes">
            ${boxes}
          </div>
          <div class="cf-nm-stage">
            ${imgs}
          </div>
        </div>
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

    // All other systems (parliamentary, presidential) get the
    // election header at the top of every render path.
    const header = buildElectionHeader();
    // Electoral Makeup sits inside a 2-col grid: left slot reserved for
    // Campaign Events (not yet built), right slot shows the makeup bar.
    // One source for the 2-col grid row: the nation map reuses the exact
    // same wrapper as the Electoral Makeup box so it lines up with — and
    // is exactly as wide as — the makeup box.
    const gridRow = (inner) => inner
        ? `<div class="cf-makeup-row">
               <div class="cf-makeup-left"></div>
               <div class="cf-makeup-right">${inner}</div>
           </div>`
        : '';
    // Per-nation sectors + provinces + per-province weights (read-only)
    // for the map's Sectors panels. Safe-default to empty so any failure
    // just shows "no sectors" / Whole-only rather than breaking the tab.
    let _sectors = [];
    let _provinces = [];
    const _weightMap = {};
    try {
        const _nid = _state?.nation?.id;
        if (_nid) {
            const [secRes, provRes] = await Promise.all([
                _supabase.from('sectors')
                    .select('id, name, weight, is_active, display_order')
                    .eq('nation_id', _nid)
                    .order('display_order', { ascending: true }),
                _supabase.from('provinces')
                    .select('id, name, display_order')
                    .eq('nation_id', _nid)
                    .order('display_order', { ascending: true }),
            ]);
            if (secRes.error) console.warn('[coalition-formation] sectors load failed:', secRes.error.message);
            else _sectors = secRes.data || [];
            if (provRes.error) console.warn('[coalition-formation] provinces load failed:', provRes.error.message);
            else _provinces = provRes.data || [];
            if (_provinces.length) {
                const { data: w, error: wErr } = await _supabase
                    .from('province_sector_weights')
                    .select('province_id, sector_id, weight')
                    .in('province_id', _provinces.map(p => p.id));
                if (wErr) console.warn('[coalition-formation] province weights load failed:', wErr.message);
                else (w || []).forEach(r => { _weightMap[`${r.province_id}|${r.sector_id}`] = r.weight; });
            }
        }
    } catch (e) {
        console.warn('[coalition-formation] sectors/provinces load threw:', e?.message || e);
    }
    // buildNationMap returns its OWN full grid row (radios + Sectors
    // panel left + map right), so it is not wrapped by gridRow.
    const makeupRow = gridRow(buildElectoralMakeup()) + buildNationMap(_sectors, _provinces, _weightMap);

    // Presidential systems — no coalition formation
    if (hasElectedPresident(_state.nation)) {
        root.innerHTML = `${header}${makeupRow}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">Presidential System</div>
                <div class="cf-no-desc">The President governs directly and nominates cabinet ministers. No coalition formation is required.</div>
            </div>
        </div>`;
        return;
    }

    if (!_formationNeeded) {
        const hasPmVacancy = _activeCoalition && !_activeHog && !hasElectedPresident(_state.nation);
        if (hasPmVacancy) {
            const myFactionId = _state.faction?.id;
            const coalitionIds = Array.isArray(_activeCoalition.party_ids) ? _activeCoalition.party_ids : [];
            const isCoalitionMember = coalitionIds.includes(myFactionId);
            root.innerHTML = `${header}${makeupRow}
            <div class="cf-page">
                <div class="cf-no-formation">
                    <div class="cf-no-icon" style="color:var(--accent);">!</div>
                    <div class="cf-no-title">Prime Minister Vacant</div>
                    <div class="cf-no-desc">A coalition exists, but no Prime Minister is seated. ${isCoalitionMember
                        ? 'Use <strong>Actions → Leadership Challenge</strong> to claim the Premiership for your party leader; it resolves on the next tick.'
                        : 'Only coalition members can use <strong>Leadership Challenge</strong> to fill the vacancy.'}</div>
                </div>
            </div>`;
            return;
        }
        root.innerHTML = `${header}${makeupRow}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active with a seated Prime Minister. No formation needed.</div>
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
    energy: 'Energy', transportation: 'Transportation', sports: 'Sports', security: 'Security',
};
// MINISTRY_NAMES (short labels) is the only locally-defined ministry map
// — the office-name and key-list maps are the shared exports from
// government-types.js (MINISTRY_OFFICE_NAMES, CABINET_MINISTRY_KEYS).

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

    _formingGovernment = true;
    const btn = document.getElementById('cf-form-gov-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'FORMING...'; }

    try {
        await formGovernment({
            supabase: _supabase,
            formationId: formation.id,
            callerFactionId: _state.faction.id,
            nation: _state.nation,
            ministryAssignments: _ministryAssignments,
        });

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

// ════════════════════════════════════════════════════════════════
// Phase C: single Form Government entry point. Both the in-page
// formation flow (handleFormGovernment above) and government.html's
// PM purge / formation flow call this one wrapper.
//
// Everything inside is intentionally thin — the RPC owns the
// transaction. We just:
//   1. Generate per-ministry minister names + ages from the nation's
//      name pools (if not pre-supplied via the formation row).
//   2. Persist ministry_assignments + minister_names to the formation
//      row so the RPC has the full picture.
//   3. Build per-ministry stat baselines from the current nation
//      state. The RPC writes these to ministries.stat_baselines.
//   4. Call finalize_government_formation. The RPC atomically:
//        - dissolves rival formations
//        - marks this formation 'formed'
//        - closes the old admin (parliamentary) + writes
//          stats_at_end / approval_at_end / end_reason
//        - vacates the old cabinet (orphanCabinet equivalent)
//        - inserts the new admin row with stats_at_start
//        - installs HOG (PM)
//        - inserts/upserts every non-PM ministry row from the
//          formation's ministry_assignments + minister_names
//        - emits PM_APPOINTED event_log
//        - resets gov_approval + failed_formation_attempts
//
// If the RPC throws, no DB writes from the JS side hang around to
// confuse a retry. ONE SOURCE OF TRUTH for formation state.
// ════════════════════════════════════════════════════════════════
export async function formGovernment({
    supabase,
    formationId,
    callerFactionId,
    nation,
    ministryAssignments,
    ministerNames = null,
}) {
    if (!supabase || !formationId || !callerFactionId || !nation || !ministryAssignments) {
        throw new Error('formGovernment: missing required arg');
    }

    // 1. Generate minister names from the nation's name pools if the
    //    caller didn't pre-supply them (in-page coalition flow path).
    if (!ministerNames) {
        const namePools = getNationNames(nation?.name) || {};
        const firstPool = namePools.firstNames || ['Alex', 'Maria', 'Carlos'];
        const lastPool  = namePools.lastNames  || ['Garcia', 'Torres', 'Silva'];
        ministerNames = {};
        for (const [key, partyId] of Object.entries(ministryAssignments)) {
            if (!partyId) continue;
            ministerNames[key] = {
                first_name: firstPool[Math.floor(Math.random() * firstPool.length)],
                last_name:  lastPool[Math.floor(Math.random() * lastPool.length)],
                age:        35 + Math.floor(Math.random() * 25),
            };
        }
    }

    // 2. Persist assignments + names so the RPC reads the same picture.
    const { error: assignErr } = await supabase.from('government_formations').update({
        ministry_assignments: ministryAssignments,
        minister_names:       ministerNames,
    }).eq('id', formationId);
    if (assignErr) throw new Error('Failed to save assignments: ' + assignErr.message);

    // 3. Per-ministry baselines, keyed by ministry_key. RPC writes
    //    these to ministries.stat_baselines so the per-minister
    //    approval-delta math has the right zero point.
    const ministryBaselines = {};
    for (const [key, partyId] of Object.entries(ministryAssignments)) {
        if (!partyId) continue;
        ministryBaselines[key] = buildMinistryBaselines(key, nation);
    }

    // 4. Atomic transition.
    const { data: rpcData, error: rpcErr } = await supabase.rpc('finalize_government_formation', {
        p_formation_id:       formationId,
        p_caller_faction_id:  callerFactionId,
        p_ministry_baselines: ministryBaselines,
    });
    if (rpcErr) throw rpcErr;
    // PostgREST doesn't surface validation errors as rpcErr — they come
    // back as { error: '...' } in the data payload.
    if (rpcData?.error) throw new Error(rpcData.error);

    return rpcData;
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
                // Seed from the coalition's CURRENT members, dropping any that
                // have since been deleted/abandoned (not in _allParties). Those
                // ghosts can never cast a support vote, so leaving them in
                // party_ids makes unanimity unreachable; filtering here lets the
                // proposer save a clean coalition (down to just themselves).
                _proposalSelectedParties = (f.party_ids || []).filter(pid => _allParties.some(p => p.id === pid));
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
        // Restore the button on the failure paths (the success path re-renders
        // the tab, detaching this node). Without this the button hangs on
        // "Saving…" after an error.
        if (btn) { btn.disabled = false; btn.textContent = 'Save Changes'; }
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
