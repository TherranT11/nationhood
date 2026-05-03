/**
 * lawsuit-respond.js — Defendant response modal + plaintiff settle review.
 *
 * Surfaced as Pressing Issues on corp-operations.html. The defendant
 * picks Refute / Settle / Concede; Counter-sue is grayed-out for
 * Phase 2. A side chat panel (per-lawsuit group_chats thread) lets
 * the parties discuss settlement live. The plaintiff sees a separate
 * accept/reject card when the defendant offers a settlement.
 */

import { _supabase } from './supabase-client.js';
import { escapeHtml, hfFmtBig } from './utils.js';
import { GRIEVANCE_LABEL, RELIEF_LABEL } from './game/lawsuit-types.js';

const REFUTE_LEGAL_FEE = 5000000;
const SETTLE_MIN       = 5000000;
const SETTLE_MAX       = 200000000;
const SETTLE_STEP      = 5000000;
const SETTLE_DEFAULT   = 25000000;
const REFUTATION_MIN   = 50;
const REFUTATION_MAX   = 600;

let _state = null;
let _chatChannel = null;

// ── Defendant response modal ─────────────────────────────────────
export async function openLawsuitResponseModal(lawsuit, defendantFaction) {
    if (!lawsuit?.id || !defendantFaction?.id) return;

    _state = {
        kind:        'defendant',
        lawsuit,
        faction:     defendantFaction,
        choice:      'refute',
        defenseText: '',
        offerAmount: SETTLE_DEFAULT,
        chatMessages: [],
        chatDraft:   '',
        submitting:  false,
        error:       null,
        // Optimistic initial value; loadCurrentTick overwrites with the
        // real shard tick a moment later. Using filed_at_tick keeps the
        // first render's "ticks remaining" stable instead of flashing.
        currentTick: Number(lawsuit.filed_at_tick || 0),
    };

    mountOverlay();
    render();
    await Promise.all([loadChat(), refreshLocalCash(), loadCurrentTick()]);
    subscribeChat();
    render();
}

async function loadCurrentTick() {
    const { data, error } = await _supabase.from('shard')
        .select('current_tick').eq('name', 'Alpha Shard').single();
    if (error) {
        console.warn('[lawsuit-respond] shard tick fetch failed:', error.message);
        return;
    }
    if (_state) _state.currentTick = data?.current_tick ?? 0;
}

// ── Plaintiff settle-offer review modal ──────────────────────────
export async function openSettleReviewModal(lawsuit, plaintiffFaction) {
    if (!lawsuit?.id || !plaintiffFaction?.id) return;

    _state = {
        kind:         'plaintiff_settle',
        lawsuit,
        faction:      plaintiffFaction,
        chatMessages: [],
        chatDraft:    '',
        submitting:   false,
        error:        null,
    };

    mountOverlay();
    render();
    await loadChat();
    subscribeChat();
    render();
}

function mountOverlay() {
    closeModal();
    const overlay = document.createElement('div');
    overlay.id = 'lawsuit-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:flex-start;justify-content:center;padding:30px 24px;overflow-y:auto;';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
    document.body.appendChild(overlay);
}

function closeModal() {
    if (_chatChannel) {
        try { _supabase.removeChannel(_chatChannel); } catch (_) { /* noop */ }
        _chatChannel = null;
    }
    const o = document.getElementById('lawsuit-overlay');
    if (o) o.remove();
    _state = null;
}

async function refreshLocalCash() {
    if (!_state?.faction?.id) return;
    const { data, error } = await _supabase.from('factions')
        .select('corp_cash_reserves')
        .eq('id', _state.faction.id)
        .single();
    if (error) {
        console.warn('[lawsuit-respond] cash refresh failed:', error.message);
        return;
    }
    if (data) _state.faction.corp_cash_reserves = data.corp_cash_reserves;
}

async function loadChat() {
    if (!_state?.lawsuit?.chat_id) return;
    const { data, error } = await _supabase.from('group_chat_messages')
        .select('id, sender_id, is_system, message_text, created_at')
        .eq('chat_id', _state.lawsuit.chat_id)
        .order('created_at', { ascending: true })
        .limit(200);
    if (error) {
        console.warn('[lawsuit-respond] chat load failed:', error.message);
        return;
    }
    _state.chatMessages = data || [];
}

function subscribeChat() {
    if (!_state?.lawsuit?.chat_id) return;
    _chatChannel = _supabase.channel('lawsuit-chat-' + _state.lawsuit.chat_id)
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

async function sendChatMessage() {
    const text = (_state?.chatDraft || '').trim();
    if (!text || !_state?.lawsuit?.chat_id || !_state?.faction?.id) return;
    const draftCopy = text;
    _state.chatDraft = '';
    render();

    const { error } = await _supabase.from('group_chat_messages').insert({
        chat_id:      _state.lawsuit.chat_id,
        sender_id:    _state.faction.id,
        message_text: draftCopy,
    });
    if (error) {
        console.warn('[lawsuit-respond] send failed:', error.message);
        _state.chatDraft = draftCopy;     // restore so the user can retry
        _state.error = 'Failed to send: ' + error.message;
        render();
    }
}

// ── Render ───────────────────────────────────────────────────────
function render() {
    const overlay = document.getElementById('lawsuit-overlay');
    if (!overlay || !_state) return;
    overlay.innerHTML = _state.kind === 'defendant'
        ? renderDefendantHTML()
        : renderPlaintiffHTML();
    // Auto-scroll chat.
    const chatBody = document.getElementById('lawsuit-chat-body');
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

function renderDefendantHTML() {
    const l        = _state.lawsuit;
    const cash     = Number(_state.faction?.corp_cash_reserves ?? 0);
    const grievance = GRIEVANCE_LABEL[l.grievance_type] || l.grievance_type;
    const relief    = RELIEF_LABEL[l.relief_sought] || l.relief_sought;
    const ticksLeft = Math.max(0, Number(l.response_deadline_tick || 0) - Number(_state.currentTick ?? 0));

    const refuteCanAfford = cash >= REFUTE_LEGAL_FEE;
    const settleCanAfford = cash >= _state.offerAmount;

    let canSubmit = !_state.submitting;
    if (_state.choice === 'refute')  canSubmit = canSubmit && refuteCanAfford && (_state.defenseText || '').trim().length >= REFUTATION_MIN;
    else if (_state.choice === 'settle')  canSubmit = canSubmit && settleCanAfford && _state.offerAmount > 0;

    const choiceCard = (key, name, cost, desc, bullets, opts = {}) => {
        const sel = _state.choice === key;
        const disabled = !!opts.disabled;
        return `<div onclick="${disabled ? '' : `window.lawsuitChoose('${key}')`}" style="
            padding:14px 16px;
            background:${sel ? 'rgba(200,90,58,0.06)' : 'var(--bg-2,#1a1a17)'};
            border:1px solid ${sel ? '#c55' : 'var(--panel-border)'};
            ${sel ? 'border-left:3px solid #c55;' : ''}
            cursor:${disabled ? 'not-allowed' : 'pointer'};
            opacity:${disabled ? 0.4 : 1};
            display:grid;grid-template-columns:18px 1fr;gap:14px;align-items:flex-start;
        ">
            <div style="width:14px;height:14px;border:1px solid ${sel ? '#c55' : 'var(--panel-border)'};border-radius:50%;background:var(--bg-panel);position:relative;margin-top:3px;">
                ${sel ? '<div style="position:absolute;inset:3px;background:#c55;border-radius:50%;"></div>' : ''}
            </div>
            <div style="min-width:0;">
                <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;">
                    <span style="font-size:15px;font-weight:600;color:var(--panel-text);">${escapeHtml(name)}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:#c8a832;letter-spacing:0.1em;">${escapeHtml(cost)}</span>
                </div>
                <div style="font-size:12px;color:#9e9a92;margin-top:4px;line-height:1.4;">${escapeHtml(desc)}</div>
                ${bullets ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:7px;">${bullets}</div>` : ''}
            </div>
        </div>`;
    };

    const chip = (txt, tone) => {
        const colors = {
            positive: ['#8aa653', 'rgba(138,166,83,0.06)', 'rgba(138,166,83,0.4)'],
            negative: ['#c85a3a', 'rgba(200,90,58,0.06)', 'rgba(200,90,58,0.4)'],
            warn:     ['#a0633a', 'rgba(160,99,58,0.06)', 'rgba(160,99,58,0.4)'],
            neutral:  ['#9e9a92', 'var(--bg-panel)',      'var(--panel-border)'],
        }[tone] || ['#9e9a92', 'var(--bg-panel)', 'var(--panel-border)'];
        return `<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 7px;border:1px solid ${colors[2]};color:${colors[0]};background:${colors[1]};">${escapeHtml(txt)}</span>`;
    };

    return `<div onclick="event.stopPropagation()" style="width:920px;max-width:96vw;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;max-height:92vh;">

        <!-- Urgent banner -->
        <div style="background:rgba(200,90,58,0.12);border-bottom:1px solid rgba(200,90,58,0.4);padding:10px 24px;display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:14px;color:#c55;">⚠</span>
            <span style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c55;">Pressing Issue · Civil Lawsuit Filed</span>
            <span style="margin-left:auto;font-family:var(--font-mono);font-size:10px;color:#9e9a92;letter-spacing:0.14em;text-transform:uppercase;">Response required within <span style="color:#c55;">${ticksLeft} ticks</span></span>
        </div>

        <!-- Header -->
        <div style="padding:18px 24px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.22em;color:#c55;text-transform:uppercase;margin-bottom:4px;">Lawsuit ${escapeHtml((l.id || '').slice(0, 8))}</div>
                <div style="font-size:22px;font-weight:600;color:var(--panel-text);letter-spacing:-0.01em;">Lawsuit Filed Against You</div>
                <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:6px;">Defendant: <span style="color:#c8a832;">${escapeHtml(_state.faction?.abbreviation || _state.faction?.corp_ticker || '')}</span> ${escapeHtml(_state.faction?.faction_name || '')} · Cash: ${hfFmtBig(cash)}</div>
            </div>
            <span onclick="window.lawsuitClose()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;padding:0 6px;">&times;</span>
        </div>

        <!-- Body: 2-column (response options + chat) -->
        <div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);overflow:hidden;">

            <!-- LEFT: allegation + response options -->
            <div style="overflow-y:auto;padding:18px 22px;border-right:1px solid var(--panel-border);">

                <!-- Allegation card -->
                <div style="background:var(--bg-2,#1a1a17);border:1px solid #a0633a66;padding:14px 16px;margin-bottom:18px;">
                    <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#c55;margin-bottom:8px;">Plaintiff · Allegation</div>
                    <div style="font-size:16px;font-weight:600;color:var(--panel-text);margin-bottom:4px;">${escapeHtml(l.plaintiff?.faction_name || 'Plaintiff')}</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
                        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:8px 10px;">
                            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:4px;">Grievance</div>
                            <div style="font-size:13px;color:#c55;font-weight:600;">${escapeHtml(grievance)}</div>
                        </div>
                        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:8px 10px;">
                            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:4px;">Relief Sought</div>
                            <div style="font-size:13px;color:#c55;font-weight:600;">${escapeHtml(relief)}</div>
                        </div>
                    </div>
                </div>

                <!-- Response options -->
                <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c8a832;margin-bottom:10px;">Your Response</div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${choiceCard('refute', 'File a Refutation', '−' + hfFmtBig(REFUTE_LEGAL_FEE) + ' legal fees',
                        'Deny the allegations. Case proceeds to trial; the Ministry of Justice rules.',
                        chip('Goes to trial', 'neutral') + chip('MoJ rules', 'neutral') + chip('Public record', 'warn'))}
                    ${_state.choice === 'refute' ? `
                        <div style="background:var(--bg-2,#1a1a17);border:1px solid #c55;border-left-width:3px;padding:14px 16px;">
                            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c55;margin-bottom:6px;">Articulate Your Defense</div>
                            <div style="font-size:11px;color:#9e9a92;margin-bottom:10px;line-height:1.5;">State your case for the court. Stored as the defense filing for MoJ review.</div>
                            <textarea id="lawsuit-defense" oninput="window.lawsuitDefense(this.value)" maxlength="${REFUTATION_MAX}" placeholder="Describe why the allegations are unfounded…" style="width:100%;background:var(--bg-panel);border:1px solid var(--panel-border);color:var(--panel-text);font-size:13px;line-height:1.5;padding:10px 12px;min-height:100px;resize:vertical;outline:none;font-family:inherit;">${escapeHtml(_state.defenseText)}</textarea>
                            <div style="display:flex;justify-content:space-between;margin-top:6px;">
                                <span style="font-family:var(--font-mono);font-size:10px;color:${(_state.defenseText.length < REFUTATION_MIN) ? '#c55' : '#9e9a92'};">${_state.defenseText.length} / ${REFUTATION_MAX} characters · min ${REFUTATION_MIN}</span>
                            </div>
                        </div>` : ''}

                    ${choiceCard('settle', 'Offer Settlement', 'Variable',
                        'Propose a cash payment to make the lawsuit go away. Plaintiff accepts or rejects.',
                        chip('No trial if accepted', 'positive') + chip('Plaintiff may reject', 'warn'))}
                    ${_state.choice === 'settle' ? `
                        <div style="background:var(--bg-2,#1a1a17);border:1px solid #8a722f;padding:14px 16px;">
                            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c8a832;margin-bottom:10px;">Settlement Offer</div>
                            <div style="display:flex;align-items:center;gap:14px;">
                                <div style="font-size:26px;font-weight:600;color:var(--panel-text);min-width:120px;">${hfFmtBig(_state.offerAmount)}</div>
                                <input type="range" min="${SETTLE_MIN}" max="${SETTLE_MAX}" step="${SETTLE_STEP}" value="${_state.offerAmount}" oninput="window.lawsuitOffer(this.value)" style="flex:1;cursor:pointer;" />
                            </div>
                            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:6px;letter-spacing:0.12em;text-transform:uppercase;">
                                <span>${hfFmtBig(SETTLE_MIN)}</span>
                                <span>${hfFmtBig(SETTLE_MAX)}</span>
                            </div>
                            ${!settleCanAfford ? '<div style="font-family:var(--font-mono);font-size:10px;color:#c55;margin-top:8px;">Offer exceeds your cash on hand.</div>' : ''}
                        </div>` : ''}

                    ${choiceCard('concede', 'Concede the Claim', 'No legal fees',
                        'Acknowledge the allegations. Case closes as upheld; sentencing is handled by the Ministry of Justice.',
                        chip('Matter closed', 'neutral') + chip('Admission of liability', 'negative'))}

                    ${choiceCard('counter', 'Refute & Counter-Sue', 'Coming soon',
                        'File your own claim against the plaintiff. Combined trial.',
                        chip('Phase 3', 'neutral'),
                        { disabled: true })}
                </div>
            </div>

            <!-- RIGHT: chat panel -->
            ${renderChatPanel()}
        </div>

        <!-- Footer -->
        <div style="padding:12px 24px;border-top:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:space-between;align-items:center;gap:18px;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6660;">
                Cash: <span style="color:var(--panel-text);">${hfFmtBig(cash)}</span> · Reply deadline: <span style="color:#c55;">${ticksLeft} ticks</span>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="window.lawsuitClose()" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#9e9a92;border:1px solid var(--panel-border);cursor:pointer;">Defer</div>
                <div onclick="${canSubmit ? 'window.lawsuitSubmit()' : ''}" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${canSubmit ? '#fff' : '#6a6660'};background:${canSubmit ? '#c55' : 'var(--panel-border)'};border:1px solid ${canSubmit ? '#c55' : 'var(--panel-border)'};cursor:${canSubmit ? 'pointer' : 'not-allowed'};${canSubmit ? '' : 'opacity:0.45;pointer-events:none;'}">Submit Response ▸</div>
            </div>
        </div>
        ${_state.error ? `<div style="padding:8px 24px;font-family:var(--font-mono);font-size:10px;color:#c55;background:var(--bg-panel);border-top:1px solid var(--panel-border);">${escapeHtml(_state.error)}</div>` : ''}
    </div>`;
}

function renderPlaintiffHTML() {
    const l = _state.lawsuit;
    const offer = Number(l.settle_offer_amount || 0);
    const grievance = GRIEVANCE_LABEL[l.grievance_type] || l.grievance_type;
    const relief    = RELIEF_LABEL[l.relief_sought] || l.relief_sought;

    return `<div onclick="event.stopPropagation()" style="width:920px;max-width:96vw;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;max-height:92vh;">
        <div style="background:rgba(201,164,73,0.12);border-bottom:1px solid rgba(201,164,73,0.4);padding:10px 24px;display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:14px;color:#c8a832;">◆</span>
            <span style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c8a832;">Pressing Issue · Settlement Offered</span>
        </div>
        <div style="padding:18px 24px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.22em;color:#c8a832;text-transform:uppercase;margin-bottom:4px;">Lawsuit ${escapeHtml((l.id || '').slice(0, 8))}</div>
                <div style="font-size:22px;font-weight:600;color:var(--panel-text);letter-spacing:-0.01em;">Settlement Offer</div>
                <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:6px;">${escapeHtml(l.defendant?.faction_name || 'Defendant')} has offered <span style="color:#c8a832;">${hfFmtBig(offer)}</span> to settle.</div>
            </div>
            <span onclick="window.lawsuitClose()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;padding:0 6px;">&times;</span>
        </div>
        <div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);overflow:hidden;">
            <div style="overflow-y:auto;padding:18px 22px;border-right:1px solid var(--panel-border);">
                <div style="background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border);padding:14px 16px;margin-bottom:14px;">
                    <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;margin-bottom:6px;">Original Claim</div>
                    <div style="font-size:14px;color:var(--panel-text);"><span style="color:#c55;font-weight:600;">${escapeHtml(grievance)}</span> · Relief sought: <span style="color:#c8a832;">${escapeHtml(relief)}</span></div>
                </div>
                <div style="background:var(--bg-2,#1a1a17);border:1px solid #8a722f;padding:18px 20px;text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c8a832;margin-bottom:8px;">Settlement Offered</div>
                    <div style="font-size:36px;font-weight:600;color:var(--panel-text);letter-spacing:-0.02em;">${hfFmtBig(offer)}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:#9e9a92;margin-top:8px;">Accept to close the case immediately. Reject to proceed to trial.</div>
                </div>
            </div>
            ${renderChatPanel()}
        </div>
        <div style="padding:12px 24px;border-top:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:flex-end;gap:8px;">
            <div onclick="${_state.submitting ? '' : 'window.lawsuitSettleReject()'}" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#c55;border:1px solid #c55;background:transparent;cursor:${_state.submitting ? 'not-allowed' : 'pointer'};${_state.submitting ? 'opacity:0.45;pointer-events:none;' : ''}">Reject · To Trial</div>
            <div onclick="${_state.submitting ? '' : 'window.lawsuitSettleAccept()'}" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#fff;background:#8aa653;border:1px solid #8aa653;cursor:${_state.submitting ? 'not-allowed' : 'pointer'};${_state.submitting ? 'opacity:0.45;pointer-events:none;' : ''}">Accept ${hfFmtBig(offer)}</div>
        </div>
        ${_state.error ? `<div style="padding:8px 24px;font-family:var(--font-mono);font-size:10px;color:#c55;background:var(--bg-panel);border-top:1px solid var(--panel-border);">${escapeHtml(_state.error)}</div>` : ''}
    </div>`;
}

function renderChatPanel() {
    const me = _state.faction?.id;
    let body = '';
    for (const m of _state.chatMessages) {
        const mine = m.sender_id === me;
        const isSys = m.is_system;
        if (isSys) {
            body += `<div style="text-align:center;font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.1em;margin:6px 0;">${escapeHtml(m.message_text)}</div>`;
            continue;
        }
        body += `<div style="display:flex;justify-content:${mine ? 'flex-end' : 'flex-start'};margin:5px 0;">
            <div style="max-width:80%;padding:7px 11px;background:${mine ? 'rgba(200,90,58,0.16)' : 'var(--bg-2,#1a1a17)'};border:1px solid ${mine ? 'rgba(200,90,58,0.4)' : 'var(--panel-border)'};font-size:12px;color:var(--panel-text);line-height:1.45;word-wrap:break-word;">${escapeHtml(m.message_text)}</div>
        </div>`;
    }
    if (_state.chatMessages.length === 0) {
        body = '<div style="text-align:center;font-family:var(--font-mono);font-size:10px;color:#6a6660;padding:20px;">No messages yet. Open the dialogue.</div>';
    }
    return `<div style="display:flex;flex-direction:column;background:var(--bg-panel);min-height:0;">
        <div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);font-family:var(--font-mono);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#9e9a92;">Discussion</div>
        <div id="lawsuit-chat-body" style="flex:1;overflow-y:auto;padding:10px 14px;">${body}</div>
        <div style="border-top:1px solid var(--panel-border);padding:8px 10px;display:flex;gap:6px;">
            <input type="text" value="${escapeHtml(_state.chatDraft || '')}" oninput="window.lawsuitChatDraft(this.value)" onkeydown="if(event.key==='Enter'){window.lawsuitChatSend();event.preventDefault();}" placeholder="Type a message…" style="flex:1;background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border);color:var(--panel-text);font-size:12px;padding:6px 10px;outline:none;font-family:inherit;" />
            <div onclick="window.lawsuitChatSend()" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;padding:6px 12px;color:#fff;background:#5a8aaa;border:1px solid #5a8aaa;cursor:pointer;">Send</div>
        </div>
    </div>`;
}

// ── Defendant submit ─────────────────────────────────────────────
async function submitDefendantResponse() {
    if (!_state || _state.submitting) return;
    _state.submitting = true;
    _state.error = null;
    render();

    const payload = {
        p_lawsuit_id:          _state.lawsuit.id,
        p_response_kind:       _state.choice === 'counter' ? 'refute' : _state.choice,  // counter is gated
        p_defense_text:        _state.choice === 'refute' ? _state.defenseText : null,
        p_settle_offer_amount: _state.choice === 'settle' ? _state.offerAmount : null,
    };

    let data, error;
    try {
        ({ data, error } = await _supabase.rpc('respond_to_lawsuit', payload));
    } catch (err) {
        _state.submitting = false;
        _state.error = 'Network error: ' + (err?.message || String(err));
        render();
        return;
    }
    if (error || !data?.success) {
        _state.submitting = false;
        _state.error = error?.message || data?.error || 'Response failed';
        render();
        return;
    }

    closeModal();
    // Caller can refresh after we're gone.
    window.dispatchEvent(new CustomEvent('lawsuit:responded', { detail: { lawsuit_id: payload.p_lawsuit_id, status: data.new_status } }));
}

// ── Plaintiff settle accept/reject ───────────────────────────────
async function plaintiffSettleDecision(decision) {
    if (!_state || _state.submitting) return;
    _state.submitting = true;
    _state.error = null;
    render();

    let data, error;
    try {
        ({ data, error } = await _supabase.rpc('respond_to_settle_offer', {
            p_lawsuit_id: _state.lawsuit.id,
            p_decision:   decision,
        }));
    } catch (err) {
        _state.submitting = false;
        _state.error = 'Network error: ' + (err?.message || String(err));
        render();
        return;
    }
    if (error || !data?.success) {
        _state.submitting = false;
        _state.error = error?.message || data?.error || 'Decision failed';
        render();
        return;
    }

    const settledLawsuitId = _state?.lawsuit?.id || data.lawsuit_id;
    closeModal();
    window.dispatchEvent(new CustomEvent('lawsuit:settled', { detail: { lawsuit_id: settledLawsuitId, decision } }));
}

// ── Window-scoped handlers ───────────────────────────────────────
window.lawsuitClose         = closeModal;
window.lawsuitChoose        = (k) => { if (!_state) return; _state.choice = k; render(); };
window.lawsuitDefense       = (txt) => { if (!_state) return; _state.defenseText = String(txt || '').slice(0, REFUTATION_MAX); render(); };
window.lawsuitOffer         = (n) => { if (!_state) return; _state.offerAmount = Math.max(SETTLE_MIN, Math.min(SETTLE_MAX, Number(n) || 0)); render(); };
window.lawsuitChatDraft     = (txt) => { if (!_state) return; _state.chatDraft = String(txt || ''); };
window.lawsuitChatSend      = sendChatMessage;
window.lawsuitSubmit        = submitDefendantResponse;
window.lawsuitSettleAccept  = () => plaintiffSettleDecision('accept');
window.lawsuitSettleReject  = () => plaintiffSettleDecision('reject');
