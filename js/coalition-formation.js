// js/coalition-formation.js — Coalition Formation UI for the Election tab
// Detects post-election state, shows formation banner, proposal list, and proposal creation.

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
            .select('id, type, tick')
            .eq('nation_id', nation.id)
            .order('tick', { ascending: false })
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

    // Check if active coalition exists (different from 'formed' — check for active status)
    const { data: activeCoalition } = await supabase.from('government_formations')
        .select('id').eq('nation_id', nation.id).eq('status', 'active').limit(1).maybeSingle();

    // Formation is needed if: election exists, no government formed for this election
    if (election && !hasFormedGov) {
        _formationNeeded = true;
        _electionId = election.id;
        _lastElectionTick = election.tick;
    } else {
        _formationNeeded = false;
    }

    return { needed: _formationNeeded };
}

export function isFormationNeeded() {
    return _formationNeeded;
}

export async function renderFormationTab(root) {
    if (!root) return;

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

            return `<div class="cf-proposal-card ${f.iAmSupporting ? 'supporting' : ''} ${!f.iAmInvited ? 'not-invited' : ''}">
                <div class="cf-proposal-title">${esc(proposer?.faction_name || 'Unknown')} Coalition ${statusHtml}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${meetsThreshold ? 'var(--green)' : 'var(--red)'};">${coalitionSeats}</span> (${coalitionPct}%) ${meetsThreshold ? '✓' : '— below threshold'}</div>
                <div class="cf-proposal-chips">${chips}</div>
                <div class="cf-proposal-support">Support: ${f.supportCount} / ${f.coalitionSize} coalition members</div>
                ${supportBtns}
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

        // Support/withdraw
        const supportBtn = e.target.closest('.cf-support-btn, .cf-withdraw-btn');
        if (supportBtn) {
            const formationId = supportBtn.dataset.formationId;
            const action = supportBtn.dataset.action;
            await toggleSupport(formationId, action === 'support', root);
            return;
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

        // Auto-support own proposal
        await _supabase.rpc('toggle_formation_support', {
            p_formation_id: data.id,
            p_faction_id: faction.id,
            p_supports: true,
        }).catch(() => {});

        await renderFormationTab(root);
    } catch (err) {
        console.error('[Coalition] Create proposal error:', err);
        alert('Failed to create proposal.');
    } finally {
        _submitting = false;
    }
}

async function toggleSupport(formationId, supports, root) {
    try {
        await _supabase.rpc('toggle_formation_support', {
            p_formation_id: formationId,
            p_faction_id: _state.faction?.id,
            p_supports: supports,
        });
        await renderFormationTab(root);
    } catch (err) {
        console.error('[Coalition] Toggle support error:', err);
    }
}
