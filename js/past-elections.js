// js/past-elections.js — Past Elections tab
// Phase 1: Collapsed election list with date, type, top 3 parties, PM

let _supabase = null;
let _state = null;
let _elections = [];
let _administrations = [];
let _expandedId = null;

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function fmtVotes(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'k';
    return String(n);
}

function tickToDate(tick) {
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return MONTHS[tick % 12] + ', ' + (2000 + Math.floor(tick / 12));
}

// Derive election type label from context
function getElectionTypeLabel(election, administration) {
    const type = election.election_type || 'parliamentary';
    if (type === 'presidential') return { label: 'Presidential Election', color: '#5a8aaa' };

    // Check if this was triggered by special circumstances
    const endReason = administration?.end_reason || '';
    if (endReason.includes('no_confidence') || endReason.includes('vnc')) {
        return { label: 'Vote of No Confidence', color: '#d44a4a' };
    }
    if (endReason.includes('snap') || endReason.includes('dissolved') || endReason.includes('early')) {
        return { label: 'Early Elections Called', color: '#c84' };
    }
    return { label: 'General Election', color: '#8b9a6b' };
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════

export async function initPastElections(supabase, state) {
    _supabase = supabase;
    _state = state;

    const root = document.getElementById('pa-past-elections-root');
    if (!root) return;

    root.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';

    const nationId = state.nation?.id;
    if (!nationId) {
        root.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';
        return;
    }

    // Fetch completed elections and administrations in parallel
    const [electionsResult, adminResult, partiesResult] = await Promise.all([
        supabase.from('elections')
            .select('id, election_tick, election_type, status, results, created_at')
            .eq('nation_id', nationId)
            .eq('status', 'completed')
            .order('election_tick', { ascending: false }),
        supabase.from('administrations')
            .select('*')
            .eq('nation_id', nationId)
            .order('started_at_tick', { ascending: false }),
        supabase.from('factions')
            .select('id, faction_name, abbreviation, party_color, seats')
            .eq('nation_id', nationId)
            .eq('faction_type', 'party')
            .is('abandoned_at', null),
    ]);

    _elections = electionsResult.data || [];
    _administrations = adminResult.data || [];
    const parties = partiesResult.data || [];
    const partyMap = {};
    for (const p of parties) partyMap[p.id] = p;

    // Attach party colors/names to election results
    for (const elec of _elections) {
        const votes = elec.results?.votes || [];
        for (const v of votes) {
            const party = partyMap[v.party_id];
            if (party) {
                v.color = party.party_color || '#666';
                v.abbreviation = party.abbreviation || v.party_name?.slice(0, 3)?.toUpperCase() || '?';
            } else {
                v.color = '#666';
                v.abbreviation = v.party_name?.slice(0, 3)?.toUpperCase() || '?';
            }
        }
    }

    attachListeners(root);
    render(root, partyMap);
}

// ═══════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════

function attachListeners(root) {
    root.addEventListener('click', (e) => {
        const row = e.target.closest('[data-election-id]');
        if (row) {
            const id = row.dataset.electionId;
            _expandedId = _expandedId === id ? null : id;
            render(root);
        }
    });
}

function render(root, partyMap) {
    if (_elections.length === 0) {
        root.innerHTML = `<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;
        return;
    }

    const myFactionId = _state.faction?.id;
    const totalSeats = _state.nation?.total_seats || 100;
    const majority = Math.ceil(totalSeats / 2) + 1;

    const electionRows = _elections.map((elec, idx) => {
        const isExp = _expandedId === elec.id;
        const votes = (elec.results?.votes || []).sort((a, b) => (b.seats || 0) - (a.seats || 0));
        const topParties = votes.slice(0, 3);
        const turnout = elec.results?.turnout_pct ?? 0;
        const totalVotesCast = elec.results?.total_votes_cast ?? 0;
        const date = tickToDate(elec.election_tick);

        // Find the administration that started after this election
        const admin = _administrations.find(a => a.started_at_tick >= elec.election_tick && a.started_at_tick <= elec.election_tick + 5);
        // Find the preceding administration (ended because of this election)
        const prevAdmin = _administrations.find(a => a.ended_at_tick != null && a.ended_at_tick >= elec.election_tick - 2 && a.ended_at_tick <= elec.election_tick + 2);

        const typeInfo = getElectionTypeLabel(elec, prevAdmin);
        const isPresidentialNation = (_state.nation?.government_type || '').toLowerCase().includes('presidential')
            || _state.nation?.hos_election_method === 'direct_vote';
        const leaderTitle = isPresidentialNation ? 'President' : 'PM';
        const pmName = admin?.prime_minister || 'Unknown';
        const pmColor = admin?.pm_party_id ? (votes.find(v => v.party_id === admin.pm_party_id)?.color || '#888') : '#888';

        // Previous election for seat change
        const prevElection = idx < _elections.length - 1 ? _elections[idx + 1] : null;
        const prevVotes = prevElection?.results?.votes || [];

        // Collapsed header
        let html = `<div data-election-id="${elec.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${isExp ? 'border-bottom:none;' : ''}
        ">
            <div style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${date}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${typeInfo.color};background:${typeInfo.color}0a;border:1px solid ${typeInfo.color}25;">${typeInfo.label.toUpperCase()}</span>
                    <div style="display:flex;gap:8px;margin-left:10px;">
                        ${topParties.map(p => `<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${p.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${esc(p.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${p.seats}</span>
                        </div>`).join('')}
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        ${leaderTitle}: <span style="color:${pmColor};font-weight:700;">${esc(pmName)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${isExp ? '\u25B2' : '\u25BC'}</span>
                </div>
            </div>
        </div>`;

        // Expanded detail (Phase 2+ will fill this in more)
        if (isExp) {
            // Seat bar
            const seatBarHtml = votes.map(p =>
                `<div style="width:${(p.seats / totalSeats) * 100}%;background:${p.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${p.seats >= 8 ? 9 : 6}px;font-weight:700;color:#000;">${p.seats >= 5 ? p.seats : ''}</div>`
            ).join('');

            // Results table
            const resultsHtml = votes.map(p => {
                const isPlayer = p.party_id === myFactionId;
                const prevResult = prevVotes.find(pv => pv.party_id === p.party_id);
                const seatChange = prevResult ? p.seats - (prevResult.seats || 0) : null;
                const seatPct = (p.seats / totalSeats) * 100;
                const seatVoteDiff = seatPct - (p.vote_percentage || 0);

                return `<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${isPlayer ? `background:${p.color}08;` : ''}">
                    <div style="width:30px;height:30px;background:${p.color}15;border:1px solid ${p.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${p.abbreviation?.slice(0, 2) || '?'}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.party_name)}</span>
                            ${isPlayer ? '<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>' : ''}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${p.color};">${esc(p.abbreviation)}</div>
                    </div>
                    <span style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${p.seats}</span>
                    <span style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${seatChange != null ? (seatChange > 0 ? '#5c5' : seatChange < 0 ? '#c55' : 'var(--text-dim)') : 'var(--text-dim)'};">${seatChange != null ? (seatChange > 0 ? '\u25B2 ' + seatChange : seatChange < 0 ? '\u25BC ' + Math.abs(seatChange) : '\u2014') : 'NEW'}</span>
                    <span style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${fmtVotes(p.votes || 0)}</span>
                    <span style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(p.vote_percentage || 0).toFixed(1)}%</span>
                    <span style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(seatVoteDiff) < 2 ? 'var(--text-dim)' : seatVoteDiff > 0 ? '#5c5' : '#c84'};">${seatVoteDiff > 0 ? '+' : ''}${seatVoteDiff.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(seatVoteDiff) < 2 ? 'proportional' : seatVoteDiff > 0 ? 'overrep.' : 'underrep.'}</span></span>
                </div>`;
            }).join('');

            // Government formation card
            let govHtml = '';
            if (admin) {
                const coalitionParties = admin.coalition_parties || [];
                const govSeats = admin.total_seats || coalitionParties.reduce((s, cp) => s + (cp.seats || 0), 0);
                const isMajority = govSeats >= majority;
                const govType = isMajority ? 'Majority Coalition' : 'Minority Coalition';
                const endReason = admin.ended_at_tick ? (admin.end_reason || 'Ended') : 'Current Government';
                const endColor = admin.ended_at_tick ? 'var(--text-dim)' : '#5c5';
                const lasted = admin.ended_at_tick
                    ? Math.abs(admin.ended_at_tick - admin.started_at_tick) + ' ticks'
                    : 'Ongoing';

                const coalBarHtml = coalitionParties.map(cp => {
                    const cpColor = votes.find(v => v.party_id === cp.party_id)?.color || '#666';
                    return `<div style="width:${govSeats > 0 ? ((cp.seats || 0) / govSeats * 100) : 0}%;background:${cpColor};height:100%;"></div>`;
                }).join('');

                const coalChipsHtml = coalitionParties.map(cp => {
                    const cpColor = votes.find(v => v.party_id === cp.party_id)?.color || '#666';
                    return `<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${cpColor};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${esc(cp.party_name?.slice(0, 3)?.toUpperCase() || '?')}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${cp.seats || 0}</span>
                    </div>`;
                }).join('');

                govHtml = `<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${pmColor};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${endColor};background:${endColor}0a;border:1px solid ${endColor}25;">${esc(endReason.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${lasted}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${pmColor}15;border:1.5px solid ${pmColor};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${pmColor};">${esc(pmName.split(' ').map(n => n[0]).join(''))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${esc(pmName)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${isPresidentialNation ? 'President' : 'Prime Minister'} &middot; ${esc(admin.pm_party_name || '')} &middot; ${govType}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${coalBarHtml}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${coalChipsHtml}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${isMajority ? '#5c5' : '#c84'};">${govSeats} seats ${isMajority ? '(majority +' + (govSeats - majority) + ')' : '(minority, ' + (majority - govSeats) + ' short)'}</span>
                        </div>
                    </div>
                </div>`;
            }

            html += `<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
                <!-- Context + Turnout -->
                <div style="display:flex;border-bottom:1px solid var(--border-main);">
                    <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">CONTEXT</div>
                        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${esc(typeInfo.label)}</div>
                    </div>
                    <div style="width:260px;padding:12px 20px;display:flex;gap:16px;flex-shrink:0;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TURNOUT</div>
                            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${turnout > 70 ? '#5c5' : turnout > 60 ? '#ca5' : '#c84'};">${turnout.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TOTAL VOTES</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${fmtVotes(totalVotesCast)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${seatBarHtml}</div>
                    <div style="position:relative;height:0;">
                        <div style="position:absolute;bottom:0;left:${(majority / totalSeats) * 100}%;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);transform:translateX(-50%);">\u25B2 ${majority} majority</div>
                    </div>
                </div>

                <!-- Results table header -->
                <div style="padding:0 20px;">
                    <div style="display:flex;padding:8px 0;border-bottom:1px solid var(--border-main);font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">
                        <span style="width:30px;"></span>
                        <span style="flex:1;">PARTY</span>
                        <span style="width:60px;text-align:right;">SEATS</span>
                        <span style="width:60px;text-align:right;">CHANGE</span>
                        <span style="width:70px;text-align:right;">VOTES</span>
                        <span style="width:55px;text-align:right;">VOTE %</span>
                        <span style="width:80px;text-align:right;">SEAT vs VOTE</span>
                    </div>
                    ${resultsHtml}
                </div>

                ${govHtml}
            </div>`;
        }

        return html;
    }).join('');

    root.innerHTML = `<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${_elections.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${electionRows}</div>
    </div>`;
}
