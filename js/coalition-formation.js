// js/coalition-formation.js — Coalition Formation UI for the Election tab
// Detects post-election state, shows formation banner, proposal list, proposal creation,
// ministry assignment, and Form Government action.

import { buildMinistryBaselines } from './game/stats.js';
import { autoAppointPartyLeaderAsPM, getNationNames } from './game/political-actions.js';
import { rolloverAdministration } from './game/elections.js';

let _supabase = null;
let _state = null;
let _formationNeeded = false;
let _electionId = null;
let _allParties = [];
let _formations = [];
let _totalSeats = 0;
let _majoritySeats = 0;
let _lastElectionTick = null;
let _currentTick = 0;
let _proposalSelectedParties = [];
let _submitting = false;
let _expandedFormationId = null;  // which proposal card is expanded for ministry assignment
let _ministryAssignments = {};    // { ministryKey: partyId }
let _formingGovernment = false;

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

const FORMATION_DEADLINE_TICKS = 6;
const POST_SNAP_DEADLINE_TICKS = 4;

// ════════════════════════ PUBLIC API ════════════════════════

export async function initCoalitionFormation(supabase, state) {
    _supabase = supabase;
    _state = state;

    // Check if coalition formation is needed
    const nation = state.nation;
    const faction = state.faction;
    if (!nation || !faction) return { needed: false };

    // Fetch latest election, current tick, active coalition, and all parties in parallel
    const [electionResult, shardResult, coalitionResult, partiesResult] = await Promise.all([
        supabase.from('elections')
            .select('id, election_type, election_tick, status')
            .eq('nation_id', nation.id)
            .eq('status', 'completed')
            .order('election_tick', { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single(),
        supabase.from('government_formations')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('status', 'formed')
            .order('formed_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase.from('factions')
            .select('id, faction_name, abbreviation, party_color, seats')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .is('abandoned_at', null)
            .order('seats', { ascending: false }),
    ]);

    _currentTick = shardResult.data?.current_tick ?? 0;
    _allParties = partiesResult.data || [];
    _totalSeats = _allParties.reduce((s, p) => s + (p.seats || 0), 0);
    _majoritySeats = Math.ceil(_totalSeats / 2) + 1;

    const election = electionResult.data;
    const hasFormedGov = !!coalitionResult.data;

    // Formation is needed if: a completed election exists and no government has been formed
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

export async function renderFormationTab(root) {
    if (!root) return;

    // Auto-repair: check if any formation has ministry_assignments but cabinet is empty
    // This handles the case where Form Government "succeeded" (status may be 'active' or 'formed')
    // but ministry rows were never populated
    const nationId = _state.nation?.id;
    if (nationId) {
        const { count: vacantCount } = await _supabase.from('ministries')
            .select('id', { count: 'exact', head: true })
            .eq('nation_id', nationId).eq('is_active', true).is('party_id', null);

        if (vacantCount && vacantCount >= 5) {
            // Find any formation with saved assignments (regardless of status)
            const { data: govWithAssignments } = await _supabase.from('government_formations')
                .select('*').eq('nation_id', nationId)
                .not('ministry_assignments', 'eq', '{}')
                .order('created_at', { ascending: false }).limit(1).maybeSingle();

            if (govWithAssignments && govWithAssignments.ministry_assignments
                && Object.keys(govWithAssignments.ministry_assignments).length >= 5) {

                // Set formation to 'formed' if it isn't already
                if (govWithAssignments.status !== 'formed') {
                    await _supabase.from('government_formations').update({
                        status: 'formed', formed_at: new Date().toISOString(),
                    }).eq('id', govWithAssignments.id);

                    // Cancel rival formations
                    await _supabase.from('government_formations').update({ status: 'cancelled' })
                        .eq('nation_id', nationId).eq('status', 'active').neq('id', govWithAssignments.id);
                }

                // Populate ministries
                _ministryAssignments = govWithAssignments.ministry_assignments;
                await createMinistriesFromAssignments(nationId);

                // Auto-appoint PM
                const pmPartyId = govWithAssignments.ministry_assignments.prime_minister;
                if (pmPartyId) {
                    try {
                        await autoAppointPartyLeaderAsPM(_supabase, nationId, pmPartyId, _currentTick, { skipCoalitionCheck: true });
                    } catch (pmErr) {
                        console.warn('[Coalition] PM appointment during repair failed:', pmErr.message);
                    }
                }

                _formationNeeded = false;
                root.innerHTML = `<div class="cf-page">
                    <div class="cf-no-formation">
                        <div class="cf-no-icon">✓</div>
                        <div class="cf-no-title">Government Formed — Cabinet Populated</div>
                        <div class="cf-no-desc">Ministry assignments have been applied. Refresh the Government page to see your cabinet.</div>
                    </div>
                </div>`;
                return;
            }
        }
    }

    // Absolute monarchies don't hold elections
    const govType = (_state.nation?.government_type || '').toLowerCase();
    if (govType.includes('absolute') && govType.includes('monarchy')) {
        root.innerHTML = `<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;
        return;
    }

    if (!_formationNeeded) {
        root.innerHTML = `<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active. No formation needed.</div>
            </div>
        </div>`;
        return;
    }

    // Pre-election state: no completed election yet, but one is scheduled
    if (!_electionId) {
        const nationId = _state.nation?.id;
        let ticksUntil = '?';
        if (nationId) {
            const { data: scheduled } = await _supabase.from('elections')
                .select('election_tick')
                .eq('nation_id', nationId)
                .eq('status', 'scheduled')
                .order('election_tick', { ascending: true })
                .limit(1)
                .maybeSingle();
            if (scheduled) {
                ticksUntil = Math.max(0, scheduled.election_tick - _currentTick);
            }
        }
        root.innerHTML = `<div class="cf-page">
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
    const failedAttempts = _state.nation?.failed_formation_attempts || 0;
    const effectiveDeadline = failedAttempts >= 1 ? POST_SNAP_DEADLINE_TICKS : FORMATION_DEADLINE_TICKS;
    const ticksElapsed = _lastElectionTick !== null ? Math.max(0, _currentTick - _lastElectionTick) : 0;
    const ticksRemaining = Math.max(0, effectiveDeadline - ticksElapsed);
    const progressPct = Math.min(100, (ticksElapsed / effectiveDeadline) * 100);
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
    const alreadyProposed = _formations.some(f => f.proposed_by === faction.id);

    // Proposal creation UI
    let proposeHtml = '';
    if (!canPropose) {
        proposeHtml = `<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>`;
    } else if (alreadyProposed) {
        proposeHtml = `<div class="cf-note">You have already submitted a proposal for this election.</div>`;
    } else {
        const partyGrid = _allParties.map(p => {
            const isYou = p.id === faction.id;
            const seats = p.seats || 0;
            const color = p.party_color || '#888';
            return `<div class="cf-party-check ${isYou ? 'checked disabled' : ''}" data-party-id="${p.id}" style="border-left:3px solid ${color};">
                <div class="cf-check-box">${isYou ? '✓' : ''}</div>
                <span class="cf-check-name">${esc(p.faction_name)}</span>
                <span class="cf-check-seats">${seats} seats</span>
            </div>`;
        }).join('');

        proposeHtml = `
            <div class="cf-propose-section">
                <div class="cf-section-title">Propose a Government</div>
                <div class="cf-section-desc">Select which parties will form the coalition. You need ${_majoritySeats}+ seats for a majority.</div>
                <div class="cf-party-grid" id="cf-party-grid">${partyGrid}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${mySeats}</span> / ${_totalSeats}
                    (<span id="cf-preview-pct">${_totalSeats ? Math.round((mySeats / _totalSeats) * 100) : 0}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${_majoritySeats} seats</span>
                </div>
                <button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>
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
                return `<span class="cf-party-chip" style="border-left:2px solid ${p?.party_color || '#888'};">${esc(p?.faction_name || '?')} · ${p?.seats || 0}</span>`;
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

            // Show ministry assignment when all coalition members have supported
            const allSupported = f.supportCount >= f.coalitionSize;
            const isExpanded = _expandedFormationId === f.id;
            const showConfigBtn = allSupported && f.iAmInvited && !isExpanded;
            const showConfig = allSupported && isExpanded;

            return `<div class="cf-proposal-card ${f.iAmSupporting ? 'supporting' : ''} ${!f.iAmInvited ? 'not-invited' : ''}">
                <div class="cf-proposal-title">${esc(proposer?.faction_name || 'Unknown')} Coalition ${statusHtml}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${meetsThreshold ? 'var(--green)' : 'var(--red)'};">${coalitionSeats}</span> (${coalitionPct}%) ${meetsThreshold ? '✓' : '— below threshold'}</div>
                <div class="cf-proposal-chips">${chips}</div>
                <div class="cf-proposal-support">Support: ${f.supportCount} / ${f.coalitionSize} coalition members ${allSupported ? '<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>' : ''}</div>
                ${supportBtns}
                ${showConfigBtn ? `<button class="cf-support-btn" data-formation-id="${f.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>` : ''}
                ${showConfig ? renderMinistryAssignment(f) : ''}
            </div>`;
        }).join('')}</div>
    ` : '';

    root.innerHTML = `<div class="cf-page">
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

    // Bind events
    _proposalSelectedParties = [faction.id];
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
const MINISTRY_FULL_NAMES = {
    prime_minister: 'Prime Minister',
    interior: 'Ministry of the Interior', foreign: 'Foreign Ministry',
    defense: 'Ministry of Defense', finance: 'Ministry of Finance',
    education: 'Ministry of Education', healthcare: 'Ministry of Healthcare',
    labor: 'Ministry of Labor', justice: 'Ministry of Justice',
    trade: 'Ministry of Trade', energy: 'Ministry of Energy',
    transportation: 'Ministry of Transportation', security: 'Ministry of Security',
};
const MINISTRY_KEYS = ['prime_minister', 'interior', 'foreign', 'defense', 'finance',
    'education', 'healthcare', 'labor', 'justice', 'trade', 'energy', 'transportation'];

function renderMinistryAssignment(formation) {
    const coalitionParties = (formation.party_ids || [])
        .map(pid => _allParties.find(p => p.id === pid))
        .filter(Boolean);
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

    for (const key of MINISTRY_KEYS) {
        const label = MINISTRY_NAMES[key] || key;
        const isPM = key === 'prime_minister';
        const assignedId = _ministryAssignments[key];

        // All coalition members get dropdowns
        if (isMember) {
            html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${isPM ? '700' : '400'};color:${isPM ? 'var(--accent)' : 'var(--text-secondary)'};letter-spacing:0.5px;">${label}</span>
                <select data-ministry="${key}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${coalitionParties.map(p => `<option value="${p.id}" ${assignedId === p.id ? 'selected' : ''}>${esc(p.faction_name)} (${p.seats || 0} seats)</option>`).join('')}
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
        const pmParty = coalitionParties.find(p => p.id === pmPartyId);
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

        // Save ministry assignments to the formation
        const { error: assignErr } = await _supabase.from('government_formations').update({
            ministry_assignments: _ministryAssignments,
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

        // Ensure ministries are populated regardless of RPC path
        // Check for VACANT ministries (party_id is null) — rows exist but are empty
        const { count: vacantCount } = await _supabase.from('ministries')
            .select('id', { count: 'exact', head: true })
            .eq('nation_id', nationId).eq('is_active', true).is('party_id', null);

        if (vacantCount && vacantCount >= 5) {
            console.warn(`[Coalition] ${vacantCount} vacant ministries — populating from assignments`);
            await createMinistriesFromAssignments(nationId);
        }

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
    try {
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
    } catch (adminErr) {
        console.warn('[Coalition] Administration rollover failed (non-fatal):', adminErr.message);
    }

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
    // Also update the cabinet_members table for the government display.
    const MINISTRY_DISPLAY_NAMES = {
        prime_minister: 'Prime Minister',
        interior: 'Minister of the Interior',
        foreign: 'Minister of Foreign Affairs',
        defense: 'Minister of Defense',
        finance: 'Minister of Finance',
        education: 'Minister of Education',
        healthcare: 'Minister of Health',
        labor: 'Minister of Labor',
        justice: 'Minister of Justice',
        trade: 'Minister of Trade',
        energy: 'Minister of Energy',
        transportation: 'Minister of Transportation',
        security: 'Minister of Security',
    };

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
        const displayName = MINISTRY_DISPLAY_NAMES[key] || key;

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
                ministry_name: displayName,
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

        // Also update cabinet_members if the table has rows for this nation
        const position = displayName;
        await _supabase.from('cabinet_members').update({
            party_id: partyId,
            person_name: firstName + ' ' + lastName,
        }).eq('nation_id', nationId).eq('position', position).eq('is_active', true);
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

function bindFormationEvents(root) {
    root.addEventListener('click', async (e) => {
        // Party checkbox toggle
        const checkItem = e.target.closest('.cf-party-check:not(.disabled)');
        if (checkItem) {
            const pid = checkItem.dataset.partyId;
            const idx = _proposalSelectedParties.indexOf(pid);
            if (idx > -1) {
                _proposalSelectedParties.splice(idx, 1);
                checkItem.classList.remove('checked');
                checkItem.querySelector('.cf-check-box').textContent = '';
            } else {
                _proposalSelectedParties.push(pid);
                checkItem.classList.add('checked');
                checkItem.querySelector('.cf-check-box').textContent = '✓';
            }
            updateSeatPreview();
            return;
        }

        // Submit proposal
        if (e.target.closest('#cf-propose-btn')) {
            await createProposal(root);
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
