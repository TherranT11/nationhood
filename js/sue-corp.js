/**
 * sue-corp.js — Commercial lawsuit filing modal (Phase 1).
 *
 * Wired to the CLO "Sue Corporation" action on actions.html. The
 * modal lets the player pick a defendant from their active business
 * relationships (loans / construction contracts / trade agreements),
 * choose a grievance gated by the defendant's sector, and a relief.
 * Submit calls file_commercial_lawsuit RPC; the case lands in the
 * Judicial subtab on government.html for MoJ review.
 */

import { _supabase } from './supabase-client.js';
import { escapeHtml, hfFmtBig } from './utils.js';

const FILING_FEE = 2000000;

const GRIEVANCES = [
    { key: 'breach_of_contract', name: 'Breach of Contract', desc: 'Defendant failed to honor agreed terms after the contract was signed.', sector: 'universal' },
    { key: 'fraud',              name: 'Fraud',              desc: 'Defendant misrepresented material facts before the contract was signed.', sector: 'universal' },
    { key: 'defamation',         name: 'Defamation',         desc: 'Defendant made false public statements that damaged your reputation.',    sector: 'universal' },
    { key: 'predatory_terms',    name: 'Predatory Terms',    desc: 'Bank imposed exploitative interest rates or covenants outside market norms.', sector: 'banking' },
    { key: 'non_payout',         name: 'Non-Payout',         desc: 'Bank refused to fund an approved loan or honor a credit commitment.',     sector: 'banking' },
    { key: 'defective_work',     name: 'Defective Work',     desc: 'Construction failed to meet specified quality standards.',                 sector: 'construction' },
    { key: 'cargo_loss',         name: 'Cargo Loss',         desc: 'Goods lost or damaged in transit due to negligence.',                      sector: 'shipping' },
];

const RELIEFS = [
    { key: 'payment',              name: 'Payment',              desc: 'Cash damages awarded to compensate for losses.' },
    { key: 'specific_performance', name: 'Specific Performance', desc: 'Force the defendant to honor the original contract.' },
    { key: 'contract_voidance',    name: 'Contract Voidance',    desc: 'Cancel the agreement entirely. Both parties walk away.' },
    { key: 'asset_seizure',        name: 'Asset Seizure',        desc: "Court orders defendant's collateral or property forfeited." },
];

// Defendant-sector → allowed grievance sectors (universal always allowed).
function allowedSectorsFor(corpSector) {
    const s = (corpSector || '').toLowerCase();
    if (s === 'finance')      return new Set(['universal', 'banking']);
    if (s === 'construction') return new Set(['universal', 'construction']);
    if (s === 'shipping')     return new Set(['universal', 'shipping']);
    return new Set(['universal']);
}

let _state = null;

export async function openSueCorpModal(plaintiff) {
    if (!plaintiff?.id) return;

    _state = {
        plaintiff,
        relationships: [],
        loading: true,
        submitting: false,
        selectedDefendantId: null,
        selectedGrievance: null,    // 'breach_of_contract' etc
        selectedRelief: null,
        error: null,
    };

    const overlay = document.createElement('div');
    overlay.id = 'sue-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:flex-start;justify-content:center;padding:40px 24px;overflow-y:auto;';
    overlay.onclick = (e) => { if (e.target === overlay) closeSueCorpModal(); };
    document.body.appendChild(overlay);

    render();

    try {
        _state.relationships = await loadActiveRelationships(plaintiff);
    } catch (err) {
        console.warn('[sue-corp] relationship load failed:', err);
        _state.relationships = [];
    }
    _state.loading = false;
    render();
}

function closeSueCorpModal() {
    const o = document.getElementById('sue-overlay');
    if (o) o.remove();
    _state = null;
}

// Pulls the three relationship kinds in parallel, normalizing each to
// a uniform shape: { id, kind, defendantId, defendantName, defendantTicker,
// defendantNation, defendantSector, defendantOwnership, label }.
async function loadActiveRelationships(plaintiff) {
    const [loanRes, contractRes, tradeRes] = await Promise.all([
        _supabase.from('bank_loans')
            .select('id, lender_faction_id, borrower_faction_id, principal, outstanding, status')
            .or(`borrower_faction_id.eq.${plaintiff.id},lender_faction_id.eq.${plaintiff.id}`)
            .in('status', ['active', 'called', 'late', 'delinquent']),
        _supabase.from('corp_contracts')
            .select('id, issuer_faction_id, status, budget, name')
            .eq('issuer_faction_id', plaintiff.id)
            .in('status', ['active', 'open', 'bidding', 'awarded']),
        _supabase.from('trade_agreements')
            .select('id, partner_a_faction_id, partner_b_faction_id, status, term_ticks')
            .or(`partner_a_faction_id.eq.${plaintiff.id},partner_b_faction_id.eq.${plaintiff.id}`)
            .eq('status', 'active'),
    ]);

    const loans = loanRes.error ? [] : (loanRes.data || []);
    const contracts = contractRes.error ? [] : (contractRes.data || []);
    const trades = tradeRes.error ? [] : (tradeRes.data || []);

    const counterpartyIds = new Set();
    for (const l of loans) {
        const id = l.borrower_faction_id === plaintiff.id ? l.lender_faction_id : l.borrower_faction_id;
        if (id) counterpartyIds.add(id);
    }
    for (const t of trades) {
        const id = t.partner_a_faction_id === plaintiff.id ? t.partner_b_faction_id : t.partner_a_faction_id;
        if (id) counterpartyIds.add(id);
    }
    // Construction contracts surface bidder corps too — the plaintiff
    // (issuer) can sue any corp that bid; for Phase 1 we only enable
    // suing the AWARDED bidder. Awarded bidder lookup deferred to keep
    // Phase 1 lean — for now construction relationships are surfaced
    // only when issuer == plaintiff and the row carries an
    // awarded_bidder_faction_id we can read.
    // (Skipped here because corp_contracts schema varies; Phase 2 will
    // tighten this once the awarded-bidder column is canonical.)

    if (counterpartyIds.size === 0) return [];

    const { data: corps, error: corpErr } = await _supabase.from('factions')
        .select('id, faction_name, abbreviation, corp_ticker, corp_sector, nation_id, nations:nation_id(name)')
        .in('id', Array.from(counterpartyIds));
    if (corpErr) {
        console.warn('[sue-corp] counterparty fetch failed:', corpErr.message);
        return [];
    }
    const corpById = new Map((corps || []).map(c => [c.id, c]));

    const out = [];
    for (const l of loans) {
        const cpId = l.borrower_faction_id === plaintiff.id ? l.lender_faction_id : l.borrower_faction_id;
        const cp = corpById.get(cpId);
        if (!cp) continue;
        out.push({
            id:                l.id,
            kind:              'loan',
            defendantId:       cp.id,
            defendantName:     cp.faction_name,
            defendantTicker:   cp.corp_ticker || cp.abbreviation || '',
            defendantNation:   cp.nations?.name || '',
            defendantSector:   cp.corp_sector || '',
            label:             `Active Loan ${hfFmtBig(l.outstanding ?? l.principal)}`,
            relationshipKind:  'loan',
            snapshot: {
                principal:   l.principal,
                outstanding: l.outstanding,
                status:      l.status,
            },
        });
    }
    for (const t of trades) {
        const cpId = t.partner_a_faction_id === plaintiff.id ? t.partner_b_faction_id : t.partner_a_faction_id;
        const cp = corpById.get(cpId);
        if (!cp) continue;
        const yrs = Math.max(1, Math.round((Number(t.term_ticks) || 12) / 12));
        out.push({
            id:                t.id,
            kind:              'trade',
            defendantId:       cp.id,
            defendantName:     cp.faction_name,
            defendantTicker:   cp.corp_ticker || cp.abbreviation || '',
            defendantNation:   cp.nations?.name || '',
            defendantSector:   cp.corp_sector || '',
            label:             `Trade Agreement · ${yrs}y`,
            relationshipKind:  'trade',
            snapshot: {
                term_ticks: t.term_ticks,
                status:     t.status,
            },
        });
    }
    return out;
}

function selectRelationship(idx) {
    const rel = _state.relationships[idx];
    if (!rel) return;
    _state.selectedDefendantId = rel.defendantId;
    _state.selectedRelationshipIdx = idx;
    // If the previously chosen grievance is no longer compatible with
    // the new defendant's sector, drop it.
    const allowed = allowedSectorsFor(rel.defendantSector);
    if (_state.selectedGrievance) {
        const g = GRIEVANCES.find(x => x.key === _state.selectedGrievance);
        if (!g || !allowed.has(g.sector)) _state.selectedGrievance = null;
    }
    render();
}

function selectGrievance(key) {
    _state.selectedGrievance = key;
    render();
}

function selectRelief(key) {
    _state.selectedRelief = key;
    render();
}

function canSubmit() {
    return !!_state
        && !_state.submitting
        && _state.selectedDefendantId
        && _state.selectedGrievance
        && _state.selectedRelief
        && (Number(_state.plaintiff?.corp_cash_reserves ?? 0) >= FILING_FEE);
}

function render() {
    const overlay = document.getElementById('sue-overlay');
    if (!overlay || !_state) return;

    const cash = Number(_state.plaintiff?.corp_cash_reserves ?? 0);
    const cashOk = cash >= FILING_FEE;

    const selectedRel = _state.selectedRelationshipIdx != null
        ? _state.relationships[_state.selectedRelationshipIdx] : null;
    const allowedSectors = selectedRel ? allowedSectorsFor(selectedRel.defendantSector) : new Set(['universal']);

    let html = `<div onclick="event.stopPropagation()" style="width:760px;max-width:94vw;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">`;

    // Header
    html += `<div style="padding:18px 24px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.22em;color:#c55;text-transform:uppercase;margin-bottom:4px;">Legal Action · Step 1 of 2</div>
            <div style="font-size:22px;font-weight:600;color:var(--panel-text);letter-spacing:-0.01em;">Sue Corporation</div>
            <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:6px;">Filing on behalf of: <span style="color:#c8a832;">${escapeHtml(_state.plaintiff.abbreviation || _state.plaintiff.corp_ticker || '')}</span> ${escapeHtml(_state.plaintiff.faction_name || '')}</div>
        </div>
        <span onclick="window.sueCorpClose()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;padding:0 6px;">&times;</span>
    </div>`;

    html += `<div style="padding:20px 24px;max-height:70vh;overflow-y:auto;">`;

    // Section I — Defendant
    html += sectionHeader('I.', 'Select Defendant', 'Active Relationships Only');
    if (_state.loading) {
        html += '<div style="padding:24px;text-align:center;font-family:var(--font-mono);font-size:11px;color:#6a6660;">Loading relationships…</div>';
    } else if (_state.relationships.length === 0) {
        html += '<div style="padding:24px;text-align:center;font-family:var(--font-mono);font-size:11px;color:#6a6660;">No active business relationships. You can only sue corporations you have an open loan, trade agreement, or contract with.</div>';
    } else {
        html += '<div style="display:flex;flex-direction:column;gap:6px;">';
        for (let i = 0; i < _state.relationships.length; i++) {
            const r = _state.relationships[i];
            const sel = i === _state.selectedRelationshipIdx;
            const relColor = r.kind === 'loan' ? '#5a8aaa' : r.kind === 'trade' ? '#c8a832' : '#a0633a';
            html += `<div onclick="window.sueCorpSelectRel(${i})" style="
                padding:12px 14px;
                background:${sel ? 'rgba(200,90,58,0.06)' : 'var(--bg-2,#1a1a17)'};
                border:1px solid ${sel ? '#c55' : 'var(--panel-border)'};
                cursor:pointer;
                display:grid;grid-template-columns:18px 1fr auto;gap:14px;align-items:center;
            ">
                <div style="width:14px;height:14px;border:1px solid ${sel ? '#c55' : 'var(--panel-border)'};border-radius:50%;position:relative;background:var(--bg-panel);">
                    ${sel ? '<div style="position:absolute;inset:3px;background:#c55;border-radius:50%;"></div>' : ''}
                </div>
                <div style="min-width:0;">
                    <div style="font-size:14px;font-weight:600;color:var(--panel-text);"><span style="font-family:var(--font-mono);font-size:10px;color:#c8a832;letter-spacing:0.12em;margin-right:8px;">${escapeHtml(r.defendantTicker)}</span>${escapeHtml(r.defendantName)}</div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.1em;text-transform:uppercase;margin-top:2px;">${escapeHtml(r.defendantNation)} · ${escapeHtml(r.defendantSector)}</div>
                </div>
                <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;padding:4px 9px;border:1px solid ${relColor}66;color:${relColor};background:${relColor}14;">${escapeHtml(r.label)}</span>
            </div>`;
        }
        html += '</div>';
    }

    // Section II — Grievance
    const sectorMeta = selectedRel ? `Defendant: ${selectedRel.defendantSector || 'Unknown'} Sector` : 'Pick a defendant first';
    html += sectionHeader('II.', 'Grievance Type', sectorMeta);
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">';
    for (const g of GRIEVANCES) {
        const sel = _state.selectedGrievance === g.key;
        const gated = !selectedRel || !allowedSectors.has(g.sector);
        const tagColor = g.sector === 'universal' ? '#8a722f'
                       : g.sector === 'banking'   ? '#5a8aaa'
                       : g.sector === 'construction' ? '#a0633a'
                       : '#4a8a87';
        html += `<button ${gated ? 'disabled' : `onclick="window.sueCorpSelectGrievance('${g.key}')"`} style="
            padding:12px 14px;
            background:${sel ? 'rgba(200,90,58,0.06)' : 'var(--bg-2,#1a1a17)'};
            border:1px solid ${sel ? '#c55' : 'var(--panel-border)'};
            cursor:${gated ? 'not-allowed' : 'pointer'};
            opacity:${gated ? 0.35 : 1};
            text-align:left;
            display:grid;grid-template-columns:18px 1fr;gap:12px;align-items:flex-start;
            font-family:inherit;
        ">
            <div style="width:14px;height:14px;border:1px solid ${sel ? '#c55' : 'var(--panel-border)'};border-radius:50%;position:relative;background:var(--bg-panel);margin-top:2px;">
                ${sel ? '<div style="position:absolute;inset:3px;background:#c55;border-radius:50%;"></div>' : ''}
            </div>
            <div>
                <div style="font-size:13px;font-weight:600;color:var(--panel-text);">${escapeHtml(g.name)}</div>
                <div style="font-size:11px;color:#9e9a92;margin-top:3px;line-height:1.4;">${escapeHtml(g.desc)}</div>
                <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.16em;text-transform:uppercase;color:${tagColor};margin-top:4px;">${escapeHtml(g.sector === 'universal' ? 'UNIVERSAL' : g.sector + ' ONLY')}</div>
            </div>
        </button>`;
    }
    html += '</div>';

    // Section III — Relief
    html += sectionHeader('III.', 'Relief Sought', 'What You Want the Court to Order');
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">';
    for (const r of RELIEFS) {
        const sel = _state.selectedRelief === r.key;
        html += `<button onclick="window.sueCorpSelectRelief('${r.key}')" style="
            padding:12px 14px;
            background:${sel ? 'rgba(200,90,58,0.06)' : 'var(--bg-2,#1a1a17)'};
            border:1px solid ${sel ? '#c55' : 'var(--panel-border)'};
            cursor:pointer;
            text-align:left;
            display:grid;grid-template-columns:18px 1fr;gap:12px;align-items:flex-start;
            font-family:inherit;
        ">
            <div style="width:14px;height:14px;border:1px solid ${sel ? '#c55' : 'var(--panel-border)'};border-radius:50%;position:relative;background:var(--bg-panel);margin-top:2px;">
                ${sel ? '<div style="position:absolute;inset:3px;background:#c55;border-radius:50%;"></div>' : ''}
            </div>
            <div>
                <div style="font-size:13px;font-weight:600;color:var(--panel-text);">${escapeHtml(r.name)}</div>
                <div style="font-size:11px;color:#9e9a92;margin-top:3px;line-height:1.4;">${escapeHtml(r.desc)}</div>
            </div>
        </button>`;
    }
    html += '</div>';

    html += '</div>'; // body close

    // Footer
    const submitOk = canSubmit();
    html += `<div style="padding:14px 24px;border-top:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:space-between;align-items:center;gap:18px;">
        <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6660;">
            Filing fee: <span style="color:${cashOk ? '#c8a832' : '#c55'};">${hfFmtBig(FILING_FEE)}</span> · Public record · Cash on hand: <span style="color:${cashOk ? 'var(--panel-text)' : '#c55'};">${hfFmtBig(cash)}</span>
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="window.sueCorpClose()" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#9e9a92;border:1px solid var(--panel-border);cursor:pointer;">Cancel</div>
            <div id="sue-submit" onclick="${submitOk ? 'window.sueCorpSubmit()' : ''}" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${submitOk ? '#fff' : '#6a6660'};background:${submitOk ? '#c55' : 'var(--panel-border)'};border:1px solid ${submitOk ? '#c55' : 'var(--panel-border)'};cursor:${submitOk ? 'pointer' : 'not-allowed'};${submitOk ? '' : 'opacity:0.45;pointer-events:none;'}">File Lawsuit ▸</div>
        </div>
    </div>`;

    if (_state.error) {
        html += `<div style="padding:8px 24px;font-family:var(--font-mono);font-size:10px;color:#c55;background:var(--bg-panel);border-top:1px solid var(--panel-border);">${escapeHtml(_state.error)}</div>`;
    }

    html += '</div>';
    overlay.innerHTML = html;
}

function sectionHeader(num, title, meta) {
    return `<div style="display:flex;justify-content:space-between;align-items:baseline;margin:18px 0 10px;padding-bottom:8px;border-bottom:1px dashed var(--panel-border);">
        <div style="font-size:15px;font-weight:600;color:var(--panel-text);"><span style="font-family:var(--font-mono);font-size:11px;color:#8a722f;letter-spacing:0.1em;margin-right:10px;">${escapeHtml(num)}</span>${escapeHtml(title)}</div>
        <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;">${escapeHtml(meta)}</div>
    </div>`;
}

async function submit() {
    if (!_state || _state.submitting || !canSubmit()) return;
    _state.submitting = true;
    _state.error = null;
    render();

    const rel = _state.relationships[_state.selectedRelationshipIdx];
    const grievance = GRIEVANCES.find(g => g.key === _state.selectedGrievance);

    const { data, error } = await _supabase.rpc('file_commercial_lawsuit', {
        p_plaintiff_id:     _state.plaintiff.id,
        p_defendant_id:     rel.defendantId,
        p_grievance_type:   _state.selectedGrievance,
        p_grievance_sector: grievance?.sector || 'universal',
        p_relief_sought:    _state.selectedRelief,
        p_relationship_ref: { kind: rel.relationshipKind, id: rel.id, snapshot: rel.snapshot },
    });

    if (error) {
        _state.submitting = false;
        _state.error = 'RPC failed: ' + error.message;
        render();
        return;
    }
    if (!data?.success) {
        _state.submitting = false;
        _state.error = data?.error || 'Filing failed.';
        render();
        return;
    }

    // Local cash sync — the topbar reads faction.corp_cash_reserves.
    _state.plaintiff.corp_cash_reserves = Math.max(0, Number(_state.plaintiff.corp_cash_reserves ?? 0) - FILING_FEE);
    closeSueCorpModal();
}

// Window-scoped handlers for inline onclicks (module scope is opaque
// to attribute-based handlers).
window.sueCorpClose            = closeSueCorpModal;
window.sueCorpSelectRel        = selectRelationship;
window.sueCorpSelectGrievance  = selectGrievance;
window.sueCorpSelectRelief     = selectRelief;
window.sueCorpSubmit           = submit;
