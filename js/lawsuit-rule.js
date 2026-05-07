/**
 * lawsuit-rule.js — Minister of Justice ruling modal (Phase 3).
 *
 * Opens from government.html → Judicial subtab → Rule on Case button.
 * Available only when status='awaiting_trial' and the viewer's party
 * holds the Justice ministry in the lawsuit's nation.
 *
 * Four ruling kinds:
 *   plaintiff_wins   — full relief, defendant pays plaintiff (principal − outstanding), loan voided
 *   defendant_wins   — case dismissed, plaintiff pays defendant $5M legal fees
 *   dismiss          — case dismissed, no money moves
 *   settlement       — custom builder: Relief + Contract Disposition (Halt-Operations is Phase 4)
 *
 * Reuses the per-lawsuit chat thread from Phase 2; MoJ posts as their
 * party faction and the existing RLS allows it (insert policy keys on
 * linked_user_id, not membership).
 */

import { _supabase } from './supabase-client.js';
import { escapeHtml, hfFmtBig } from './utils.js';
import { GRIEVANCE_LABEL, RELIEF_LABEL } from './game/lawsuit-types.js';

const SETTLE_MIN  = 0;
const SETTLE_MAX  = 500000000;
const SETTLE_STEP = 5000000;
const APR_MIN     = 0;
const APR_MAX     = 100;

let _state = null;
let _chatChannel = null;

export async function openLawsuitRuleModal(lawsuit, judgeFaction) {
    if (!lawsuit?.id || !judgeFaction?.id) return;

    _state = {
        lawsuit,
        judge: judgeFaction,
        loan: null,
        chatMessages: [],
        chatDraft: '',
        currentTick: Number(lawsuit.filed_at_tick || 0),
        rulingKind: 'settlement',
        // Settlement clause state — defaults match the mockup.
        clauseRelief: { enabled: true, recipient: 'plaintiff', amount: 25000000 },
        clauseContract: { enabled: true, disposition: 'modify', new_apr: 9.5 },
        submitting: false,
        error: null,
    };

    mountOverlay();
    render();
    await Promise.all([loadChat(), loadLoan(), loadCurrentTick()]);
    subscribeChat();
    render();
}

function mountOverlay() {
    closeModal();
    const overlay = document.createElement('div');
    overlay.id = 'lawsuit-rule-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto;';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
    document.body.appendChild(overlay);
}

function closeModal() {
    if (_chatChannel) {
        try { _supabase.removeChannel(_chatChannel); } catch (_) {}
        _chatChannel = null;
    }
    const o = document.getElementById('lawsuit-rule-overlay');
    if (o) o.remove();
    _state = null;
}

async function loadChat() {
    if (!_state?.lawsuit?.chat_id) return;
    const { data, error } = await _supabase.from('group_chat_messages')
        .select('id, sender_id, is_system, message_text, created_at')
        .eq('chat_id', _state.lawsuit.chat_id)
        .order('created_at', { ascending: true })
        .limit(200);
    if (error) {
        console.warn('[lawsuit-rule] chat load failed:', error.message);
        return;
    }
    _state.chatMessages = data || [];
}

function subscribeChat() {
    if (!_state?.lawsuit?.chat_id) return;
    _chatChannel = _supabase.channel('lawsuit-rule-chat-' + _state.lawsuit.chat_id)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'group_chat_messages',
            filter: `chat_id=eq.${_state.lawsuit.chat_id}`,
        }, (payload) => {
            if (!_state) return;
            _state.chatMessages.push(payload.new);
            render();
        })
        .subscribe();
}

async function loadLoan() {
    const refId = _state?.lawsuit?.relationship_ref?.id;
    if (!refId) return;
    const { data, error } = await _supabase.from('bank_loans')
        .select('id, principal, outstanding, apr, term_ticks, status, lender_faction_id, borrower_faction_id, issued_at_tick, matures_at_tick')
        .eq('id', refId)
        .single();
    if (error) {
        console.warn('[lawsuit-rule] loan load failed:', error.message);
        return;
    }
    _state.loan = data;
}

async function loadCurrentTick() {
    const { data, error } = await _supabase.from('shard')
        .select('current_tick').eq('name', 'Alpha Shard').single();
    if (error) {
        console.warn('[lawsuit-rule] shard tick fetch failed:', error.message);
        return;
    }
    if (_state) _state.currentTick = data?.current_tick ?? 0;
}

async function sendChatMessage() {
    const text = (_state?.chatDraft || '').trim();
    if (!text || !_state?.lawsuit?.chat_id || !_state?.judge?.id) return;
    const draftCopy = text;
    _state.chatDraft = '';
    render();
    const { error } = await _supabase.from('group_chat_messages').insert({
        chat_id:      _state.lawsuit.chat_id,
        sender_id:    _state.judge.id,
        message_text: draftCopy,
    });
    if (error) {
        console.warn('[lawsuit-rule] send failed:', error.message);
        _state.chatDraft = draftCopy;
        _state.error = 'Failed to send: ' + error.message;
        render();
    }
}

// ── Render ────────────────────────────────────────────────────────
function render() {
    const overlay = document.getElementById('lawsuit-rule-overlay');
    if (!overlay || !_state) return;
    overlay.innerHTML = renderHTML();
    const chatBody = document.getElementById('lawsuit-rule-chat-body');
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

function renderHTML() {
    const l = _state.lawsuit;
    const ticksLeft = Math.max(0, Number(l.ruling_deadline_tick || 0) - Number(_state.currentTick || 0));
    const grievance = GRIEVANCE_LABEL[l.grievance_type] || l.grievance_type;
    const relief    = RELIEF_LABEL[l.relief_sought]    || l.relief_sought;

    return `<div onclick="event.stopPropagation()" style="width:1180px;max-width:96vw;background:var(--panel-main, #1f1f1a);border:1px solid var(--panel-border, rgba(255,255,255,0.08));display:flex;flex-direction:column;overflow:hidden;max-height:94vh;">

        <!-- Header -->
        <div style="padding:18px 26px;border-bottom:1px solid var(--panel-border, rgba(255,255,255,0.08));background:var(--bg-panel);display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.22em;color:#8a722f;text-transform:uppercase;margin-bottom:4px;">Judicial Review · Active Case</div>
                <div style="font-size:22px;font-weight:600;color:var(--panel-text, #c4c2b8);letter-spacing:-0.01em;">${escapeHtml(l.plaintiff?.faction_name || 'Plaintiff')} <span style="color:#9e9a92;font-style:italic;">v.</span> ${escapeHtml(l.defendant?.faction_name || 'Defendant')}</div>
                <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:6px;">Reviewing as <span style="color:#c8a832;">${escapeHtml(_state.judge?.faction_name || 'Justice Minister')}</span> · Filing #${escapeHtml((l.id || '').slice(0,8))}</div>
                <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
                    ${chip('Filed tick ' + l.filed_at_tick, 'rust')}
                    ${chip('Defense Submitted', 'blue')}
                    ${chip('Public Record', 'neutral')}
                    ${chip('Ruling Required · ' + ticksLeft + ' tick' + (ticksLeft === 1 ? '' : 's'), 'red')}
                </div>
            </div>
            <span onclick="window.lawsuitRuleClose()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;padding:0 6px;">&times;</span>
        </div>

        <!-- 2-column body -->
        <div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);overflow:hidden;">

            <!-- LEFT: case materials + ruling -->
            <div style="overflow-y:auto;padding:22px 26px;border-right:1px solid var(--panel-border, rgba(255,255,255,0.08));">

                ${sectionHeader('I.', "Plaintiff's Accusation", 'Filed tick ' + l.filed_at_tick)}
                ${filingBlock({
                    accent: '#a0633a',
                    party: { tag: 'PLAINTIFF', name: l.plaintiff?.faction_name, ticker: l.plaintiff?.corp_ticker || l.plaintiff?.abbreviation },
                    grievanceLabel: 'Grievance', grievanceValue: grievance,
                    reliefLabel: 'Relief Sought', reliefValue: relief,
                    statement: 'Plaintiff alleges <strong>' + escapeHtml(grievance) + '</strong> and seeks <strong>' + escapeHtml(relief) + '</strong>.'
                })}

                ${sectionHeader('II.', "Defendant's Response", 'Refutation submitted tick ' + (l.responded_at_tick ?? '?'))}
                ${filingBlock({
                    accent: '#5a8aaa',
                    party: { tag: 'DEFENDANT', name: l.defendant?.faction_name, ticker: l.defendant?.corp_ticker || l.defendant?.abbreviation },
                    grievanceLabel: 'Response Type', grievanceValue: 'Refutation',
                    reliefLabel: 'Counter-Action', reliefValue: 'None Filed',
                    statement: l.defense_text ? escapeHtml(l.defense_text) : '<em style="color:#6a6660;">No defense statement on file.</em>'
                })}

                ${renderContractContext(_state.loan)}

                ${sectionHeader('IV.', 'Issue Your Ruling', 'Public · Immediate Execution')}
                <div style="display:flex;flex-direction:column;gap:6px;">
                    ${rulingCard('plaintiff_wins', 'Find in Favor of the Plaintiff',
                        'Grant relief in full. The loan is voided, the plaintiff is refunded all payments to date, and outstanding debt is cleared.',
                        ['Loan voided', 'Defendant pays full refund', 'Public verdict'])}
                    ${rulingCard('defendant_wins', 'Find in Favor of the Defendant',
                        'Dismiss the lawsuit. Loan terms upheld. Plaintiff pays the defendant $5M in legal fees.',
                        ['Loan unchanged', 'Plaintiff pays $5M legal fees'])}
                    ${rulingCard('dismiss', 'Dismiss the Case',
                        'Find that the case lacks sufficient merit. No relief granted. Both parties bear their own costs.',
                        ['No money moves', 'Loan unchanged'])}
                    ${rulingCard('settlement', 'Agreed Settlement',
                        'Issue a custom ruling. Configure relief and contract disposition below.',
                        ['Custom relief', 'Modify or void contract'])}
                </div>

                ${_state.rulingKind === 'settlement' ? renderSettlementBuilder() : ''}
            </div>

            <!-- RIGHT: chamber chat -->
            ${renderChamberPanel()}
        </div>

        <!-- Footer -->
        <div style="padding:14px 26px;border-top:1px solid var(--panel-border, rgba(255,255,255,0.08));background:var(--bg-panel);display:flex;justify-content:space-between;align-items:center;gap:18px;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6660;">
                Ruling deadline: <span style="color:#c55;">${ticksLeft} tick${ticksLeft === 1 ? '' : 's'}</span> · Public verdict on submission · Affects approval &amp; sector relations
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="window.lawsuitRuleClose()" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#9e9a92;border:1px solid var(--panel-border, rgba(255,255,255,0.08));cursor:pointer;">Defer</div>
                <div onclick="${canSubmit() ? 'window.lawsuitRuleSubmit()' : ''}" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${canSubmit() ? '#000' : '#6a6660'};background:${canSubmit() ? '#c8a832' : 'var(--panel-border, rgba(255,255,255,0.08))'};border:1px solid ${canSubmit() ? '#c8a832' : 'var(--panel-border, rgba(255,255,255,0.08))'};cursor:${canSubmit() ? 'pointer' : 'not-allowed'};${canSubmit() ? '' : 'opacity:0.45;pointer-events:none;'}">Issue Ruling ▸</div>
            </div>
        </div>
        ${_state.error ? `<div style="padding:8px 26px;font-family:var(--font-mono);font-size:10px;color:#c55;background:var(--bg-panel);border-top:1px solid var(--panel-border, rgba(255,255,255,0.08));">${escapeHtml(_state.error)}</div>` : ''}
    </div>`;
}

function chip(text, tone) {
    const colors = {
        rust:    ['#a0633a', 'rgba(160,99,58,0.08)',  'rgba(160,99,58,0.4)'],
        blue:    ['#5a8aaa', 'rgba(90,138,170,0.08)', 'rgba(90,138,170,0.4)'],
        red:     ['#c55',    'rgba(200,90,58,0.08)',  '#c55'],
        neutral: ['#9e9a92', 'var(--bg-2,#1a1a17)',   'var(--panel-border, rgba(255,255,255,0.08))'],
    }[tone] || ['#9e9a92', 'var(--bg-2,#1a1a17)', 'var(--panel-border, rgba(255,255,255,0.08))'];
    return `<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;padding:3px 9px;color:${colors[0]};background:${colors[1]};border:1px solid ${colors[2]};">${escapeHtml(text)}</span>`;
}

function sectionHeader(num, title, meta) {
    return `<div style="display:flex;justify-content:space-between;align-items:baseline;margin:18px 0 12px;padding-bottom:8px;border-bottom:1px dashed var(--panel-border, rgba(255,255,255,0.08));">
        <div style="font-size:15px;font-weight:600;color:var(--panel-text, #c4c2b8);"><span style="font-family:var(--font-mono);font-size:11px;color:#8a722f;letter-spacing:0.1em;margin-right:10px;">${escapeHtml(num)}</span>${escapeHtml(title)}</div>
        <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;">${escapeHtml(meta)}</div>
    </div>`;
}

function filingBlock({ accent, party, grievanceLabel, grievanceValue, reliefLabel, reliefValue, statement }) {
    return `<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border, rgba(255,255,255,0.08));border-left:3px solid ${accent};padding:16px 18px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:14px;padding-bottom:12px;margin-bottom:12px;border-bottom:1px dashed var(--panel-border, rgba(255,255,255,0.08));">
            <div style="width:38px;height:38px;border:1px solid ${accent}66;background:${accent}14;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${accent};">${escapeHtml(party.ticker || '—')}</div>
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.16em;">${escapeHtml(party.tag)}</div>
                <div style="font-size:16px;font-weight:600;color:var(--panel-text, #c4c2b8);">${escapeHtml(party.name || 'Unknown')}</div>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border, rgba(255,255,255,0.08));padding:8px 10px;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.16em;margin-bottom:4px;">${escapeHtml(grievanceLabel)}</div>
                <div style="font-size:13px;font-weight:600;color:${accent};">${escapeHtml(grievanceValue)}</div>
            </div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border, rgba(255,255,255,0.08));padding:8px 10px;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.16em;margin-bottom:4px;">${escapeHtml(reliefLabel)}</div>
                <div style="font-size:13px;font-weight:600;color:${accent};">${escapeHtml(reliefValue)}</div>
            </div>
        </div>
        <div style="font-size:13px;color:#9e9a92;line-height:1.55;border-left:2px solid ${accent};padding:2px 0 2px 12px;font-style:italic;">${statement}</div>
    </div>`;
}

function renderContractContext(loan) {
    if (!loan) {
        return sectionHeader('III.', 'Contract Context', 'Loading…')
            + '<div style="padding:14px;text-align:center;color:#6a6660;font-family:var(--font-mono);font-size:10px;">Loan details unavailable.</div>';
    }
    const ticksLeft = Math.max(0, Number(loan.matures_at_tick || 0) - Number(_state.currentTick || 0));
    return sectionHeader('III.', 'Contract Context', 'Active Loan · Live Terms')
        + `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:6px;">
            ${ctxCell('Principal', hfFmtBig(loan.principal))}
            ${ctxCell('Outstanding', hfFmtBig(loan.outstanding))}
            ${ctxCell('APR', Number(loan.apr || 0).toFixed(2) + '%')}
            ${ctxCell('Matures in', ticksLeft + 't')}
        </div>`;
}
function ctxCell(label, value) {
    return `<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border, rgba(255,255,255,0.08));padding:10px 12px;">
        <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;color:#6a6660;margin-bottom:5px;">${escapeHtml(label)}</div>
        <div style="font-size:14px;font-weight:600;color:var(--panel-text, #c4c2b8);">${escapeHtml(value)}</div>
    </div>`;
}

function rulingCard(kind, name, desc, bullets) {
    const sel = _state.rulingKind === kind;
    return `<div onclick="window.lawsuitRuleChoose('${kind}')" style="
        padding:14px 16px;
        background:${sel ? 'rgba(201,164,73,0.06)' : 'var(--bg-2,#1a1a17)'};
        border:1px solid ${sel ? '#c8a832' : 'var(--panel-border, rgba(255,255,255,0.08))'};
        ${sel ? 'border-left:3px solid #c8a832;' : ''}
        cursor:pointer;
        display:grid;grid-template-columns:18px 1fr;gap:14px;align-items:flex-start;
    ">
        <div style="width:14px;height:14px;border:1px solid ${sel ? '#c8a832' : 'var(--panel-border, rgba(255,255,255,0.08))'};border-radius:50%;background:var(--bg-panel);position:relative;margin-top:3px;">
            ${sel ? '<div style="position:absolute;inset:3px;background:#c8a832;border-radius:50%;"></div>' : ''}
        </div>
        <div style="min-width:0;">
            <div style="font-size:15px;font-weight:600;color:var(--panel-text, #c4c2b8);">${escapeHtml(name)}</div>
            <div style="font-size:12px;color:#9e9a92;margin-top:4px;line-height:1.45;">${escapeHtml(desc)}</div>
            ${bullets && bullets.length ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;">${bullets.map(b => `<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:2px 7px;border:1px solid var(--panel-border, rgba(255,255,255,0.08));color:#9e9a92;background:var(--bg-panel);">${escapeHtml(b)}</span>`).join('')}</div>` : ''}
        </div>
    </div>`;
}

function renderSettlementBuilder() {
    const r = _state.clauseRelief;
    const c = _state.clauseContract;
    const summary = buildSummary();

    return `<div style="margin-top:14px;padding:18px 22px;background:var(--bg-2,#1a1a17);border:1px solid #8a722f;border-left:3px solid #c8a832;">
        <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;color:#c8a832;text-transform:uppercase;margin-bottom:14px;">Construct Settlement Terms</div>

        <!-- Clause 1: Relief -->
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border, rgba(255,255,255,0.08));padding:12px 14px;margin-bottom:8px;${r.enabled ? 'border-color:#8a722f;' : ''}">
            <label onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:${r.enabled ? '10px' : '0'};">
                <input type="checkbox" ${r.enabled ? 'checked' : ''} onchange="window.lawsuitRuleClause('relief', 'enabled', this.checked)" style="cursor:pointer;" />
                <span style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${r.enabled ? '#c8a832' : '#9e9a92'};">Clause 1: Provide Relief</span>
            </label>
            ${r.enabled ? `<div style="padding-left:24px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:13px;color:#9e9a92;font-style:italic;">
                <span>Provide relief to</span>
                <select onchange="window.lawsuitRuleClause('relief','recipient',this.value)" style="background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border, rgba(255,255,255,0.08));color:var(--panel-text, #c4c2b8);font-size:13px;padding:3px 8px;cursor:pointer;outline:none;font-style:italic;font-family:inherit;">
                    <option value="plaintiff" ${r.recipient === 'plaintiff' ? 'selected' : ''}>the Plaintiff</option>
                    <option value="defendant" ${r.recipient === 'defendant' ? 'selected' : ''}>the Defendant</option>
                </select>
                <span>in the amount of</span>
                <span style="display:inline-flex;align-items:baseline;background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border, rgba(255,255,255,0.08));padding:2px 8px;">
                    <span style="font-family:var(--font-mono);font-size:12px;color:#6a6660;">$</span>
                    <input type="number" min="${SETTLE_MIN}" max="${SETTLE_MAX/1000000}" step="${SETTLE_STEP/1000000}" value="${Math.round(r.amount/1000000)}" oninput="window.lawsuitRuleClause('relief','amount',Number(this.value)*1000000)" style="background:transparent;border:none;color:#c8a832;font-weight:600;font-size:14px;width:80px;padding:2px 4px;outline:none;" />
                    <span style="font-family:var(--font-mono);font-size:12px;color:#6a6660;">M</span>
                </span>
            </div>` : ''}
        </div>

        <!-- Clause 2: Contract Disposition (was Clause 3 in mockup; Halt-Operations is Phase 4) -->
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border, rgba(255,255,255,0.08));padding:12px 14px;margin-bottom:8px;${c.enabled ? 'border-color:#8a722f;' : ''}">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:${c.enabled ? '10px' : '0'};">
                <input type="checkbox" ${c.enabled ? 'checked' : ''} onchange="window.lawsuitRuleClause('contract', 'enabled', this.checked)" style="cursor:pointer;" />
                <span style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${c.enabled ? '#c8a832' : '#9e9a92'};">Clause 2: Contract Disposition</span>
            </label>
            ${c.enabled ? `<div style="padding-left:24px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:13px;color:#9e9a92;font-style:italic;">
                <span>The Loan Agreement shall</span>
                <select onchange="window.lawsuitRuleClause('contract','disposition',this.value)" style="background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border, rgba(255,255,255,0.08));color:var(--panel-text, #c4c2b8);font-size:13px;padding:3px 8px;cursor:pointer;outline:none;font-style:italic;font-family:inherit;">
                    <option value="continue" ${c.disposition === 'continue' ? 'selected' : ''}>continue with original terms</option>
                    <option value="modify"   ${c.disposition === 'modify'   ? 'selected' : ''}>continue at modified APR</option>
                    <option value="void"     ${c.disposition === 'void'     ? 'selected' : ''}>be voided in full</option>
                </select>
                ${c.disposition === 'modify' ? `<span>at</span>
                    <span style="display:inline-flex;align-items:baseline;background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border, rgba(255,255,255,0.08));padding:2px 8px;">
                        <input type="number" min="${APR_MIN}" max="${APR_MAX}" step="0.1" value="${c.new_apr}" oninput="window.lawsuitRuleClause('contract','new_apr',Number(this.value))" style="background:transparent;border:none;color:#c8a832;font-weight:600;font-size:14px;width:60px;padding:2px 4px;outline:none;" />
                        <span style="font-family:var(--font-mono);font-size:12px;color:#6a6660;">%</span>
                    </span>` : ''}
            </div>` : ''}
        </div>

        <!-- Live summary -->
        <div style="margin-top:16px;padding:14px 16px;background:var(--bg-panel);border:1px solid var(--panel-border, rgba(255,255,255,0.08));border-top:2px solid #c8a832;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#8a722f;margin-bottom:8px;">Final Ruling Reads</div>
            <div style="font-size:13px;line-height:1.6;color:var(--panel-text, #c4c2b8);font-style:italic;">${summary}</div>
        </div>
    </div>`;
}

function buildSummary() {
    const l = _state.lawsuit;
    const r = _state.clauseRelief;
    const c = _state.clauseContract;
    const plName = l.plaintiff?.faction_name || 'plaintiff';
    const defName = l.defendant?.faction_name || 'defendant';
    const parts = [`The Minister of Justice rules in the matter of <strong>${escapeHtml(plName)} v. ${escapeHtml(defName)}</strong>.`];
    if (r.enabled && r.amount > 0) {
        const recipientName = r.recipient === 'plaintiff' ? plName : defName;
        const payerName     = r.recipient === 'plaintiff' ? defName : plName;
        parts.push(`The <strong>${escapeHtml(payerName)}</strong> shall provide relief to the <strong>${escapeHtml(recipientName)}</strong> in the amount of <strong>${hfFmtBig(r.amount)}</strong>.`);
    }
    if (c.enabled) {
        const dispText = c.disposition === 'continue' ? 'continue with original terms'
                       : c.disposition === 'modify'   ? `continue at <strong>${c.new_apr}%</strong> APR`
                       : 'be voided in full';
        parts.push(`The <strong>Loan Agreement</strong> shall ${dispText}.`);
    }
    if (parts.length === 1) {
        parts.push('<em style="color:#6a6660;">No clauses selected. Enable at least one clause to construct a ruling.</em>');
    }
    return parts.join(' ');
}

function renderChamberPanel() {
    const me = _state.judge?.id;
    let body = '';
    for (const m of _state.chatMessages) {
        const mine = m.sender_id === me;
        if (m.is_system) {
            body += `<div style="text-align:center;font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.1em;margin:6px 0;">${escapeHtml(m.message_text)}</div>`;
            continue;
        }
        body += `<div style="display:flex;justify-content:${mine ? 'flex-end' : 'flex-start'};margin:5px 0;">
            <div style="max-width:85%;padding:8px 12px;background:${mine ? 'rgba(201,164,73,0.10)' : 'var(--bg-2,#1a1a17)'};border:1px solid ${mine ? 'rgba(201,164,73,0.4)' : 'var(--panel-border, rgba(255,255,255,0.08))'};font-size:12px;color:var(--panel-text, #c4c2b8);line-height:1.5;word-wrap:break-word;">${escapeHtml(m.message_text)}</div>
        </div>`;
    }
    if (_state.chatMessages.length === 0) {
        body = '<div style="text-align:center;font-family:var(--font-mono);font-size:10px;color:#6a6660;padding:20px;">No discussion yet.</div>';
    }
    return `<div style="display:flex;flex-direction:column;background:var(--bg-panel);min-height:0;">
        <div style="padding:12px 18px;border-bottom:1px solid var(--panel-border, rgba(255,255,255,0.08));">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.22em;color:#8a722f;text-transform:uppercase;margin-bottom:3px;">Chamber Discussion</div>
            <div style="font-size:14px;font-weight:600;color:var(--panel-text, #c4c2b8);font-style:italic;">Pretrial Conference</div>
        </div>
        <div id="lawsuit-rule-chat-body" style="flex:1;overflow-y:auto;padding:10px 14px;">${body}</div>
        <div style="border-top:1px solid var(--panel-border, rgba(255,255,255,0.08));padding:8px 12px;display:flex;gap:6px;">
            <input type="text" value="${escapeHtml(_state.chatDraft || '')}" oninput="window.lawsuitRuleChatDraft(this.value)" onkeydown="if(event.key==='Enter'){window.lawsuitRuleChatSend();event.preventDefault();}" placeholder="Address counsel directly…" style="flex:1;background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border, rgba(255,255,255,0.08));color:var(--panel-text, #c4c2b8);font-size:12px;padding:6px 10px;outline:none;font-family:inherit;" />
            <div onclick="window.lawsuitRuleChatSend()" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;padding:6px 12px;color:#000;background:#c8a832;border:1px solid #c8a832;cursor:pointer;">Send</div>
        </div>
    </div>`;
}

function canSubmit() {
    if (!_state || _state.submitting) return false;
    if (_state.rulingKind === 'settlement') {
        const r = _state.clauseRelief;
        const c = _state.clauseContract;
        if (!r.enabled && !c.enabled) return false;
        if (r.enabled && (!Number.isFinite(r.amount) || r.amount < 0)) return false;
        if (c.enabled && c.disposition === 'modify') {
            if (!Number.isFinite(c.new_apr) || c.new_apr < APR_MIN || c.new_apr > APR_MAX) return false;
        }
    }
    return true;
}

async function submit() {
    if (!_state || !canSubmit()) return;
    _state.submitting = true;
    _state.error = null;
    render();

    let settlementRelief = null;
    let settlementContract = null;
    if (_state.rulingKind === 'settlement') {
        if (_state.clauseRelief.enabled) {
            settlementRelief = { recipient: _state.clauseRelief.recipient, amount: _state.clauseRelief.amount };
        }
        if (_state.clauseContract.enabled) {
            settlementContract = { disposition: _state.clauseContract.disposition };
            if (_state.clauseContract.disposition === 'modify') {
                settlementContract.new_apr = _state.clauseContract.new_apr;
            }
        }
    }

    let data, error;
    try {
        ({ data, error } = await _supabase.rpc('issue_ruling', {
            p_lawsuit_id:          _state.lawsuit.id,
            p_ruling_kind:         _state.rulingKind,
            p_settlement_relief:   settlementRelief,
            p_settlement_contract: settlementContract,
        }));
    } catch (err) {
        _state.submitting = false;
        _state.error = 'Network error: ' + (err?.message || String(err));
        render();
        return;
    }
    if (error || !data?.success) {
        _state.submitting = false;
        _state.error = error?.message || data?.error || 'Ruling failed';
        render();
        return;
    }

    const ruledLawsuitId = _state.lawsuit.id;
    closeModal();
    window.dispatchEvent(new CustomEvent('lawsuit:ruled', { detail: { lawsuit_id: ruledLawsuitId, kind: data.ruling?.kind } }));
}

// ── Window-scoped handlers ───────────────────────────────────────
window.lawsuitRuleClose      = closeModal;
window.lawsuitRuleChoose     = (kind) => { if (!_state) return; _state.rulingKind = kind; render(); };
window.lawsuitRuleClause     = (clause, field, value) => {
    if (!_state) return;
    const target = clause === 'relief' ? _state.clauseRelief : _state.clauseContract;
    target[field] = value;
    render();
};
window.lawsuitRuleChatDraft  = (txt) => { if (!_state) return; _state.chatDraft = String(txt || ''); };
window.lawsuitRuleChatSend   = sendChatMessage;
window.lawsuitRuleSubmit     = submit;
