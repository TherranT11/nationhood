// js/loan-negotiation-modal.js
//
// Loan-negotiation modal (Phase 3 — realtime + edits + chat).
//
// Public surface:
//   mountLoanNegotiationModal({ supabase, negotiationId, onClose })
//     → returns { close } once the modal mounts (data loaded)
//     → mount target: document.body (overlay)
//
// Phase 3 scope:
//   • Two Realtime subscriptions on a single channel — picks up
//     loan_negotiations row updates + new loan_negotiation_messages
//     rows within ~1s. Channel + beforeunload listener cleaned up
//     on close.
//   • Term inputs editable (when status='open'). Apply Changes calls
//     update_negotiation_terms — server resets both Agree flags +
//     refunds escrow, realtime push re-renders.
//   • Chat input + Send wired to post_negotiation_message. Realtime
//     echo appends the message; we de-dupe by id.
//   • Walk Away button calls abandon_negotiation. Status flips to
//     'abandoned'; realtime push re-renders the modal to terminal
//     state with all inputs disabled.
//   • Focus + cursor preserved across row-update re-renders so a
//     player typing into Principal doesn't get clobbered when
//     counterparty makes an unrelated edit.
//
// Out of scope (Phase 4): Agree checkboxes still disabled with
// "Phase 4" note. set_negotiation_agreement wiring + the fire-on-
// double-agree path lands next.

const STYLE_ID = 'lnm-style';

function injectStylesOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.lnm-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-ui, 'IBM Plex Sans', sans-serif);
}
.lnm-modal {
    background: var(--bg-2, #1a1a17);
    border: 1px solid var(--border-1, rgba(255,255,255,0.08));
    width: min(960px, 94vw);
    max-height: 90vh;
    display: flex; flex-direction: column;
    color: var(--text-primary, #c4c2b8);
}
.lnm-head {
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-0, rgba(255,255,255,0.06));
    display: grid; grid-template-columns: 1fr auto;
    gap: 10px; align-items: center;
}
.lnm-head__title {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--text-dim, #4a4940);
    margin-bottom: 4px;
}
.lnm-head__pair {
    font-family: var(--font-ui); font-size: 14px; color: var(--text-bright, #f0efe6);
    font-weight: 600;
}
.lnm-head__pair small {
    font-family: var(--font-mono); font-size: 10px; color: var(--text-muted, #888);
    font-weight: 400; margin-left: 8px;
}
.lnm-head__activity {
    font-family: var(--font-mono); font-size: 9.5px; color: var(--text-dim);
    margin-top: 2px;
}
.lnm-close {
    background: transparent; border: 1px solid var(--border-1);
    color: var(--text-secondary, #888); cursor: pointer;
    padding: 4px 10px; font-family: var(--font-mono); font-size: 11px;
}
.lnm-close:hover { color: var(--text-bright); border-color: var(--border-2, rgba(255,255,255,0.12)); }

.lnm-body {
    display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    flex: 1; min-height: 0;
}
@media (max-width: 720px) {
    .lnm-body { grid-template-columns: 1fr; }
}

.lnm-col {
    padding: 14px 18px;
    overflow-y: auto;
    min-height: 0;
}
.lnm-col + .lnm-col {
    border-left: 1px solid var(--border-0);
}
.lnm-section-h {
    font-family: var(--font-mono); font-size: 9.5px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text-dim); margin-bottom: 8px;
}
.lnm-field {
    margin-bottom: 10px;
}
.lnm-field label {
    display: block;
    font-family: var(--font-mono); font-size: 9.5px; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;
}
.lnm-field input, .lnm-field textarea {
    width: 100%;
    background: var(--bg-3, #252525);
    border: 1px solid var(--border-1);
    color: var(--text-bright);
    padding: 6px 9px;
    font-family: var(--font-mono); font-size: 12px;
    box-sizing: border-box;
}
.lnm-field input:focus, .lnm-field textarea:focus {
    outline: 1px solid var(--amber, #c8a832);
    border-color: var(--amber, #c8a832);
}
.lnm-field input:disabled, .lnm-field textarea:disabled {
    color: var(--text-primary);
    cursor: default;
    opacity: 0.85;
}
.lnm-field textarea { resize: vertical; min-height: 56px; }

.lnm-action-row {
    display: flex; gap: 8px; align-items: center;
    margin-top: 10px;
}
.lnm-btn {
    padding: 6px 14px;
    font-family: var(--font-mono); font-size: 10px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    background: var(--bg-3); border: 1px solid var(--border-1);
    color: var(--text-bright); cursor: pointer;
}
.lnm-btn:hover { border-color: var(--amber, #c8a832); color: var(--amber, #c8a832); }
.lnm-btn:disabled { opacity: 0.5; cursor: not-allowed; border-color: var(--border-1); color: var(--text-muted); }
.lnm-btn--primary {
    border-color: var(--amber, #c8a832);
    color: var(--amber, #c8a832);
    background: rgba(200,168,50,0.08);
}
.lnm-btn--primary:hover { background: rgba(200,168,50,0.18); }
.lnm-btn--danger {
    border-color: var(--accent-rust, #d48a3c);
    color: var(--accent-rust, #d48a3c);
    background: rgba(212,138,60,0.08);
}
.lnm-btn--danger:hover { background: rgba(212,138,60,0.22); }

.lnm-inline-error {
    margin-top: 6px;
    padding: 4px 8px;
    font-family: var(--font-mono); font-size: 10px;
    color: var(--accent-rust, #d48a3c);
    background: rgba(212,138,60,0.05);
    border: 1px solid rgba(212,138,60,0.2);
}

.lnm-agreement {
    margin-top: 14px; padding-top: 12px;
    border-top: 1px dashed var(--border-0);
}
.lnm-agree-row {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 0;
    font-family: var(--font-mono); font-size: 11px;
}
.lnm-agree-row input[type=checkbox] { cursor: not-allowed; }
.lnm-agreement-tally {
    margin-top: 8px;
    font-family: var(--font-mono); font-size: 10.5px; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase;
}
.lnm-agreement-tally--0 { color: var(--accent-rust, #d48a3c); }
.lnm-agreement-tally--1 { color: var(--amber, #c8a832); }
.lnm-agreement-tally--2 { color: var(--green, #5cb85c); }

.lnm-status-pill {
    display: inline-block;
    padding: 2px 8px;
    font-family: var(--font-mono); font-size: 9px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    border: 1px solid;
    margin-left: 8px;
}
.lnm-status--open      { color: var(--green); border-color: rgba(92,184,92,0.4); background: rgba(92,184,92,0.08); }
.lnm-status--fired     { color: var(--blue, #5b9bd5); border-color: rgba(91,155,213,0.4); background: rgba(91,155,213,0.08); }
.lnm-status--abandoned { color: var(--text-muted); border-color: var(--border-1); background: transparent; }

.lnm-terminal-banner {
    margin-bottom: 10px;
    padding: 8px 12px;
    font-family: var(--font-mono); font-size: 11px;
    border: 1px solid;
}
.lnm-terminal-banner--fired     { color: var(--blue, #5b9bd5); border-color: rgba(91,155,213,0.4); background: rgba(91,155,213,0.05); }
.lnm-terminal-banner--abandoned { color: var(--text-muted); border-color: var(--border-1); background: rgba(255,255,255,0.02); }

.lnm-chat {
    flex: 1;
    overflow-y: auto;
    margin: 8px 0;
    padding-right: 4px;
    min-height: 240px;
    max-height: 60vh;
}
.lnm-msg {
    padding: 6px 0;
    border-bottom: 1px dashed var(--border-0);
    font-size: 12px;
    line-height: 1.4;
}
.lnm-msg:last-child { border-bottom: 0; }
.lnm-msg__head {
    font-family: var(--font-mono); font-size: 9.5px;
    color: var(--text-dim); margin-bottom: 2px;
    text-transform: uppercase; letter-spacing: 0.04em;
}
.lnm-msg--system .lnm-msg__head { color: var(--amber, #c8a832); }
.lnm-msg--system .lnm-msg__body { color: var(--text-muted); font-style: italic; }
.lnm-msg__body { color: var(--text-primary); white-space: pre-wrap; word-wrap: break-word; }

.lnm-empty-chat {
    padding: 20px; text-align: center;
    font-family: var(--font-mono); font-size: 10px;
    color: var(--text-dim);
}

.lnm-chat-input {
    display: grid; grid-template-columns: 1fr auto;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--border-0);
}
.lnm-chat-input input {
    background: var(--bg-3); border: 1px solid var(--border-1);
    color: var(--text-bright); padding: 6px 9px;
    font-family: var(--font-ui); font-size: 12px;
}
.lnm-chat-input input:focus { outline: 1px solid var(--amber); border-color: var(--amber); }
.lnm-chat-input input:disabled { opacity: 0.5; cursor: not-allowed; }

.lnm-loading, .lnm-error {
    padding: 60px 20px; text-align: center;
    font-family: var(--font-mono); font-size: 11px;
}
.lnm-loading { color: var(--text-dim); }
.lnm-error   { color: var(--accent-rust); }

.lnm-phase-note {
    margin-top: 10px;
    padding: 6px 10px;
    font-family: var(--font-mono); font-size: 9px;
    color: var(--text-dim); font-style: italic;
    border-left: 2px solid var(--border-0);
    background: rgba(255,255,255,0.015);
}
`;
    document.head.appendChild(style);
}

function escHtml(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

function formatRelative(ts) {
    if (!ts) return '—';
    const then = new Date(ts).getTime();
    const now  = Date.now();
    const dSec = Math.max(0, Math.floor((now - then) / 1000));
    if (dSec < 60)        return dSec + 's ago';
    if (dSec < 3600)      return Math.floor(dSec / 60) + 'm ago';
    if (dSec < 86400)     return Math.floor(dSec / 3600) + 'h ago';
    return Math.floor(dSec / 86400) + 'd ago';
}

// ── Fetch helpers (DRY for initial + realtime re-fetch) ──────────
function fetchNegotiation(supabase, negotiationId) {
    return supabase
        .from('loan_negotiations')
        .select(`
            id, status, principal, apr, term_ticks, purpose, notes,
            borrower_agreed, lender_agreed, escrowed_lender_cash,
            last_activity_at,
            borrower:borrower_faction_id(id, faction_name),
            lender:lender_faction_id(id, faction_name)
        `)
        .eq('id', negotiationId)
        .maybeSingle();
}

function fetchMessages(supabase, negotiationId) {
    return supabase
        .from('loan_negotiation_messages')
        .select(`
            id, body, system_msg, posted_at, posted_at_tick, author_faction_id,
            author:author_faction_id(id, faction_name)
        `)
        .eq('negotiation_id', negotiationId)
        .order('posted_at', { ascending: true })
        .limit(50);
}

// ── Focus preservation across re-renders ─────────────────────────
function captureFocus(modalEl) {
    const focused = modalEl.contains(document.activeElement) ? document.activeElement : null;
    if (!focused) return null;
    const fieldKey = focused.dataset?.lnmField;
    if (!fieldKey) return null;
    const sel = (typeof focused.selectionStart === 'number') ? focused.selectionStart : null;
    return { fieldKey, sel };
}
function restoreFocus(modalEl, snap) {
    if (!snap || !snap.fieldKey) return;
    const el = modalEl.querySelector('[data-lnm-field="' + snap.fieldKey + '"]');
    if (!el) return;
    el.focus();
    if (snap.sel != null && el.setSelectionRange) {
        try { el.setSelectionRange(snap.sel, snap.sel); } catch (_) { /* ignore */ }
    }
}

// ── Renderers ────────────────────────────────────────────────────
function renderShell() {
    const overlay = document.createElement('div');
    overlay.className = 'lnm-overlay';
    overlay.innerHTML = '<div class="lnm-modal"><div class="lnm-loading">Loading negotiation…</div></div>';
    return overlay;
}

function renderError(modalEl, message) {
    modalEl.innerHTML = `
        <div class="lnm-head">
          <div>
            <div class="lnm-head__title">Loan Negotiation</div>
            <div class="lnm-head__pair">Could not open</div>
          </div>
          <button type="button" class="lnm-close" data-act="close">Close</button>
        </div>
        <div class="lnm-error">${escHtml(message)}</div>`;
}

function renderModal(modalEl, neg, messages) {
    const tally    = (neg.borrower_agreed ? 1 : 0) + (neg.lender_agreed ? 1 : 0);
    const statusCls = 'lnm-status--' + neg.status;
    const tallyCls  = 'lnm-agreement-tally--' + tally;
    const isOpen   = neg.status === 'open';
    const disAttr  = isOpen ? '' : 'disabled';

    let terminalBanner = '';
    if (neg.status === 'fired') {
        terminalBanner = `<div class="lnm-terminal-banner lnm-terminal-banner--fired">
            ✓ Loan disbursed. This negotiation is closed.
        </div>`;
    } else if (neg.status === 'abandoned') {
        terminalBanner = `<div class="lnm-terminal-banner lnm-terminal-banner--abandoned">
            ✕ Negotiation was abandoned.
        </div>`;
    }

    modalEl.innerHTML = `
        <div class="lnm-head">
          <div>
            <div class="lnm-head__title">
                Loan Negotiation
                <span class="lnm-status-pill ${statusCls}">${escHtml(neg.status)}</span>
            </div>
            <div class="lnm-head__pair">
                ${escHtml(neg.borrower?.faction_name || 'Borrower')}
                <small>↔</small>
                ${escHtml(neg.lender?.faction_name || 'Lender')}
            </div>
            <div class="lnm-head__activity">Last activity: ${formatRelative(neg.last_activity_at)}</div>
          </div>
          <button type="button" class="lnm-close" data-act="close">Close</button>
        </div>

        <div class="lnm-body">
          <!-- TERMS -->
          <div class="lnm-col">
            ${terminalBanner}
            <div class="lnm-section-h">Terms</div>

            <div class="lnm-field">
              <label>Principal ($)</label>
              <input type="number" min="1" step="1000"
                     data-lnm-field="principal"
                     value="${escHtml(neg.principal)}" ${disAttr}>
            </div>
            <div class="lnm-field">
              <label>APR (%)</label>
              <input type="number" min="0" max="100" step="0.1"
                     data-lnm-field="apr"
                     value="${escHtml(neg.apr)}" ${disAttr}>
            </div>
            <div class="lnm-field">
              <label>Term (ticks)</label>
              <input type="number" min="1" step="1"
                     data-lnm-field="term_ticks"
                     value="${escHtml(neg.term_ticks)}" ${disAttr}>
            </div>
            <div class="lnm-field">
              <label>Purpose</label>
              <input type="text" maxlength="120"
                     data-lnm-field="purpose"
                     value="${escHtml(neg.purpose || '')}" placeholder="—" ${disAttr}>
            </div>
            <div class="lnm-field">
              <label>Notes</label>
              <textarea rows="3" maxlength="2000"
                        data-lnm-field="notes" placeholder="—" ${disAttr}>${escHtml(neg.notes || '')}</textarea>
            </div>

            ${isOpen ? `
            <div class="lnm-action-row">
              <button type="button" class="lnm-btn lnm-btn--primary" data-act="apply-terms">Apply Changes</button>
              <button type="button" class="lnm-btn lnm-btn--danger"  data-act="walk-away">Walk Away</button>
              <span class="lnm-loading" id="lnm-terms-status" style="padding:0;font-size:10px;display:none;">Saving…</span>
            </div>
            <div class="lnm-inline-error" id="lnm-terms-error" style="display:none;"></div>
            ` : ''}

            <div class="lnm-agreement">
              <div class="lnm-agree-row">
                <input type="checkbox" ${neg.borrower_agreed ? 'checked' : ''} disabled>
                <span>Borrower agreed</span>
              </div>
              <div class="lnm-agree-row">
                <input type="checkbox" ${neg.lender_agreed ? 'checked' : ''} disabled>
                <span>Lender agreed
                ${neg.escrowed_lender_cash > 0
                    ? '<small style="color:var(--text-muted);margin-left:6px;">(escrowed $' + Number(neg.escrowed_lender_cash).toLocaleString() + ')</small>'
                    : ''}
                </span>
              </div>
              <div class="lnm-agreement-tally ${tallyCls}">Agreement: ${tally}/2</div>
            </div>

            <div class="lnm-phase-note">
              Phase 3 — terms editing, chat, walk-away wired. Agree
              checkboxes activate in Phase 4 (fire-on-double-agree).
            </div>
          </div>

          <!-- CHAT -->
          <div class="lnm-col" style="display:flex;flex-direction:column;">
            <div class="lnm-section-h">Chat</div>
            <div class="lnm-chat" id="lnm-chat-scroll">
              ${messages.length === 0
                ? '<div class="lnm-empty-chat">No messages yet.</div>'
                : messages.map(m => renderMessageHtml(m, neg)).join('')}
            </div>
            <div class="lnm-chat-input">
              <input type="text" maxlength="500"
                     data-lnm-field="chat-input"
                     placeholder="${isOpen ? 'Type a message…' : 'Negotiation closed — chat disabled'}"
                     ${disAttr}>
              <button type="button" class="lnm-btn" data-act="send-chat" ${disAttr}>Send</button>
            </div>
            <div class="lnm-inline-error" id="lnm-chat-error" style="display:none;"></div>
          </div>
        </div>
    `;

    const chatScroll = modalEl.querySelector('#lnm-chat-scroll');
    if (chatScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
}

// Resolve author from cached parties; falls back to the embedded
// author object (initial fetch path) or 'Unknown' (realtime payload
// where only author_faction_id is present).
function resolveAuthor(msg, neg) {
    if (msg.system_msg) return null;
    if (msg.author?.faction_name) return msg.author;
    const id = msg.author_faction_id;
    if (id == null) return null;
    if (neg?.borrower?.id === id) return neg.borrower;
    if (neg?.lender?.id   === id) return neg.lender;
    return null;
}

function renderMessageHtml(msg, neg) {
    const author = resolveAuthor(msg, neg);
    return `
      <div class="lnm-msg ${msg.system_msg ? 'lnm-msg--system' : ''}">
        <div class="lnm-msg__head">
          ${msg.system_msg ? 'System' : escHtml(author?.faction_name || 'Unknown')}
          · ${formatRelative(msg.posted_at)}
        </div>
        <div class="lnm-msg__body">${escHtml(msg.body)}</div>
      </div>`;
}

function appendChatMessageDom(modalEl, msg, neg) {
    const chatScroll = modalEl.querySelector('#lnm-chat-scroll');
    if (!chatScroll) return;
    const empty = chatScroll.querySelector('.lnm-empty-chat');
    if (empty) empty.remove();

    const wrap = document.createElement('div');
    wrap.innerHTML = renderMessageHtml(msg, neg);
    const node = wrap.firstElementChild;
    if (node) {
        chatScroll.appendChild(node);
        chatScroll.scrollTop = chatScroll.scrollHeight;
    }
}

// ── Mount ────────────────────────────────────────────────────────
export async function mountLoanNegotiationModal({ supabase, negotiationId, onClose } = {}) {
    if (!supabase)      throw new Error('mountLoanNegotiationModal: supabase client required');
    if (!negotiationId) throw new Error('mountLoanNegotiationModal: negotiationId required');

    injectStylesOnce();
    const overlay = renderShell();
    const modalEl = overlay.querySelector('.lnm-modal');
    document.body.appendChild(overlay);

    // Mutable closure state — re-fetched on realtime updates.
    let neg = null;
    let messages = [];
    let channel = null;
    let closed = false;

    const cleanupChannel = () => {
        if (!channel) return;
        try { supabase.removeChannel(channel); } catch (_) { /* ignore */ }
        channel = null;
    };
    const onPageUnload = () => cleanupChannel();
    window.addEventListener('beforeunload', onPageUnload);

    const close = () => {
        if (closed) return;
        closed = true;
        cleanupChannel();
        window.removeEventListener('beforeunload', onPageUnload);
        overlay.remove();
        if (typeof onClose === 'function') onClose();
    };

    // Outside-click + close-button. Action buttons handled by a
    // delegated handler bound after first render.
    overlay.addEventListener('click', (e) => {
        if (e.target.closest('[data-act="close"]')) { close(); return; }
        if (e.target === overlay)                   { close(); return; }
    });

    // Initial fetch
    const [negRes, msgsRes] = await Promise.all([
        fetchNegotiation(supabase, negotiationId),
        fetchMessages(supabase, negotiationId),
    ]);

    if (negRes.error) { renderError(modalEl, 'Failed to load negotiation: ' + negRes.error.message); return { close }; }
    if (!negRes.data) { renderError(modalEl, 'Negotiation not found, or you are not a party to it.'); return { close }; }
    if (msgsRes.error) {
        console.warn('[loan-negotiation-modal] messages fetch failed:', msgsRes.error.message);
    }

    neg      = negRes.data;
    messages = msgsRes.data || [];

    renderModal(modalEl, neg, messages);
    wireActionHandlers(modalEl, supabase, negotiationId, () => neg);

    // ── Realtime subscriptions ───────────────────────────────────
    // One channel, two listeners. UPDATE on the negotiation row
    // triggers a re-fetch (because realtime payloads don't carry the
    // joined faction_name); INSERT on messages appends in-place.
    // De-dupe by id so the optimistic-or-not paths stay consistent.
    channel = supabase.channel('lnm:' + negotiationId);
    channel
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'loan_negotiations',
            filter: 'id=eq.' + negotiationId,
        }, async () => {
            if (closed) return;
            const focusSnap = captureFocus(modalEl);
            const { data, error } = await fetchNegotiation(supabase, negotiationId);
            if (error || !data || closed) return;
            neg = data;
            renderModal(modalEl, neg, messages);
            wireActionHandlers(modalEl, supabase, negotiationId, () => neg);
            restoreFocus(modalEl, focusSnap);
        })
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'loan_negotiation_messages',
            filter: 'negotiation_id=eq.' + negotiationId,
        }, (payload) => {
            if (closed) return;
            const m = payload.new;
            if (messages.some(x => x.id === m.id)) return;
            messages.push(m);
            appendChatMessageDom(modalEl, m, neg);
        })
        .subscribe();

    return { close };
}

// ── Action wiring (re-bound on every full re-render since innerHTML
//    discards old listeners) ──────────────────────────────────────
function wireActionHandlers(modalEl, supabase, negotiationId, getNeg) {
    // Apply Changes
    const applyBtn = modalEl.querySelector('[data-act="apply-terms"]');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const errEl    = modalEl.querySelector('#lnm-terms-error');
            const statusEl = modalEl.querySelector('#lnm-terms-status');
            const walkBtn  = modalEl.querySelector('[data-act="walk-away"]');
            if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

            const principal  = parseInt(modalEl.querySelector('[data-lnm-field="principal"]')?.value, 10);
            const apr        = parseFloat(modalEl.querySelector('[data-lnm-field="apr"]')?.value);
            const termTicks  = parseInt(modalEl.querySelector('[data-lnm-field="term_ticks"]')?.value, 10);
            const purpose    = modalEl.querySelector('[data-lnm-field="purpose"]')?.value || '';
            const notes      = modalEl.querySelector('[data-lnm-field="notes"]')?.value || '';

            if (!Number.isFinite(principal) || principal <= 0) {
                showInline(errEl, 'Principal must be a positive number.');
                return;
            }
            if (!Number.isFinite(apr) || apr < 0 || apr > 100) {
                showInline(errEl, 'APR must be between 0 and 100.');
                return;
            }
            if (!Number.isInteger(termTicks) || termTicks <= 0) {
                showInline(errEl, 'Term must be a positive whole number of ticks.');
                return;
            }

            applyBtn.disabled = true;
            if (walkBtn) walkBtn.disabled = true;
            if (statusEl) statusEl.style.display = '';
            try {
                const { data, error } = await supabase.rpc('update_negotiation_terms', {
                    p_neg_id:     negotiationId,
                    p_principal:  principal,
                    p_apr:        apr,
                    p_term_ticks: termTicks,
                    p_purpose:    purpose,
                    p_notes:      notes,
                });
                if (error)            { showInline(errEl, error.message); return; }
                if (!data?.success)   { showInline(errEl, data?.error || 'Update failed.'); return; }
                // Realtime push will re-render. Nothing else to do.
            } catch (e) {
                showInline(errEl, e?.message || 'Network error.');
            } finally {
                applyBtn.disabled = false;
                if (walkBtn) walkBtn.disabled = false;
                if (statusEl) statusEl.style.display = 'none';
            }
        });
    }

    // Walk Away
    const walkBtn = modalEl.querySelector('[data-act="walk-away"]');
    if (walkBtn) {
        walkBtn.addEventListener('click', async () => {
            const errEl = modalEl.querySelector('#lnm-terms-error');
            if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
            if (!confirm('Walk away from this negotiation? Any escrowed funds are refunded.')) return;
            walkBtn.disabled = true;
            if (applyBtn) applyBtn.disabled = true;
            try {
                const { data, error } = await supabase.rpc('abandon_negotiation', {
                    p_neg_id: negotiationId,
                    p_reason: null,
                });
                if (error)          { showInline(errEl, error.message); }
                else if (!data?.success) { showInline(errEl, data?.error || 'Could not abandon.'); }
                // Realtime UPDATE → status='abandoned' → re-render to
                // terminal state. No need to manually close.
            } catch (e) {
                showInline(errEl, e?.message || 'Network error.');
            } finally {
                walkBtn.disabled = false;
                if (applyBtn) applyBtn.disabled = false;
            }
        });
    }

    // Send chat
    const sendBtn  = modalEl.querySelector('[data-act="send-chat"]');
    const chatIn   = modalEl.querySelector('[data-lnm-field="chat-input"]');
    const chatErr  = modalEl.querySelector('#lnm-chat-error');
    const sendChat = async () => {
        if (chatErr) { chatErr.style.display = 'none'; chatErr.textContent = ''; }
        const body = (chatIn?.value || '').trim();
        if (!body) return;
        sendBtn.disabled = true;
        if (chatIn) chatIn.disabled = true;
        try {
            const { data, error } = await supabase.rpc('post_negotiation_message', {
                p_neg_id: negotiationId,
                p_body:   body,
            });
            if (error)          { showInline(chatErr, error.message); return; }
            if (!data?.success) { showInline(chatErr, data?.error || 'Could not send.'); return; }
            chatIn.value = '';
            // Realtime echo will append the message.
        } catch (e) {
            showInline(chatErr, e?.message || 'Network error.');
        } finally {
            sendBtn.disabled = false;
            if (chatIn) {
                chatIn.disabled = false;
                chatIn.focus();
            }
        }
    };
    if (sendBtn) sendBtn.addEventListener('click', sendChat);
    if (chatIn)  chatIn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChat();
        }
    });
}

function showInline(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = '';
}
