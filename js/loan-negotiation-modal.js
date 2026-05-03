// js/loan-negotiation-modal.js
//
// Loan-negotiation modal (Phase 4 — Agree wiring + fire-on-double-agree).
//
// Public surface:
//   mountLoanNegotiationModal({ supabase, negotiationId, onClose, onFired })
//     → returns { close } once the modal mounts (data loaded)
//     → mount target: document.body (overlay)
//     → onFired(neg) optional — fires when status flips open → fired,
//       BEFORE the celebratory 3s auto-close. Parent pages can
//       refresh dashboards / hero stats here.
//
// Phase 3 features still present: realtime subscriptions, editable
// terms, chat send + receive, walk-away, focus + chat-draft
// preservation across re-renders.
//
// Phase 4 additions:
//   • Viewer's role (borrower vs lender) computed from auth.uid() vs.
//     joined linked_user_id. Only the viewer's own Agree checkbox is
//     toggleable; counterparty's is read-only display.
//   • Agree toggle wired to set_negotiation_agreement(neg_id, bool).
//     Server handles escrow debit (lender) / refund / fire-on-both.
//     On error (e.g. lender insufficient cash), checkbox reverts and
//     #lnm-agree-error surfaces the message.
//   • Fire detection: realtime UPDATE handler watches for status
//     transition open → fired, calls onFired callback, schedules a
//     3s auto-close. Manually closing during the window cancels the
//     auto-close (closed flag short-circuits the setTimeout).

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
.lnm-agree-row input[type=checkbox]:disabled { cursor: not-allowed; }
.lnm-agree-row input[type=checkbox]:not(:disabled) { cursor: pointer; }
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

/* ── Lender inbox panel (Phase 5) ── */
.lnm-inbox-host {
    display: block;
}
.lnm-inbox-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px dashed var(--border-0);
    cursor: pointer;
    transition: background 0.12s;
}
.lnm-inbox-row:last-child { border-bottom: 0; }
.lnm-inbox-row:hover { background: var(--bg-hover, rgba(255,255,255,0.03)); }
.lnm-inbox-row__pair {
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-bright);
    margin-bottom: 2px;
}
.lnm-inbox-row__meta {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
}
.lnm-inbox-row__time {
    font-family: var(--font-mono);
    font-size: 9.5px;
    color: var(--text-dim);
    white-space: nowrap;
}
.lnm-inbox-pill {
    display: inline-block;
    padding: 1px 6px;
    margin-right: 6px;
    font-family: var(--font-mono); font-size: 8.5px;
    font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--amber, #c8a832);
    background: rgba(200,168,50,0.1);
    border: 1px solid rgba(200,168,50,0.4);
    vertical-align: middle;
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
            borrower:borrower_faction_id(id, faction_name, linked_user_id),
            lender:lender_faction_id(id, faction_name, linked_user_id)
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

function renderModal(modalEl, neg, messages, viewerRole) {
    const tally    = (neg.borrower_agreed ? 1 : 0) + (neg.lender_agreed ? 1 : 0);
    const statusCls = 'lnm-status--' + neg.status;
    const tallyCls  = 'lnm-agreement-tally--' + tally;
    const isOpen   = neg.status === 'open';
    const disAttr  = isOpen ? '' : 'disabled';
    const borrowerCanToggle = isOpen && viewerRole === 'borrower';
    const lenderCanToggle   = isOpen && viewerRole === 'lender';

    let terminalBanner = '';
    if (neg.status === 'fired') {
        terminalBanner = `<div class="lnm-terminal-banner lnm-terminal-banner--fired">
            ✓ Loan disbursed: $${Number(neg.principal).toLocaleString()} at ${escHtml(neg.apr)}% for ${escHtml(neg.term_ticks)} ticks. This window closes shortly.
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
                <input type="checkbox"
                       data-act="agree-borrower"
                       ${neg.borrower_agreed ? 'checked' : ''}
                       ${borrowerCanToggle ? '' : 'disabled'}>
                <span>Borrower agreed${viewerRole === 'borrower' && isOpen ? ' <small style="color:var(--text-muted);margin-left:4px;">(you)</small>' : ''}</span>
              </div>
              <div class="lnm-agree-row">
                <input type="checkbox"
                       data-act="agree-lender"
                       ${neg.lender_agreed ? 'checked' : ''}
                       ${lenderCanToggle ? '' : 'disabled'}>
                <span>Lender agreed${viewerRole === 'lender' && isOpen ? ' <small style="color:var(--text-muted);margin-left:4px;">(you)</small>' : ''}
                ${neg.escrowed_lender_cash > 0
                    ? '<small style="color:var(--text-muted);margin-left:6px;">(escrowed $' + Number(neg.escrowed_lender_cash).toLocaleString() + ')</small>'
                    : ''}
                </span>
              </div>
              <div class="lnm-agreement-tally ${tallyCls}">Agreement: ${tally}/2</div>
              <div class="lnm-inline-error" id="lnm-agree-error" style="display:none;margin-top:6px;"></div>
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
export async function mountLoanNegotiationModal({ supabase, negotiationId, onClose, onFired } = {}) {
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

    // Determine viewer's role from auth.uid() vs. joined linked_user_id.
    // Stable across the modal lifecycle — only depends on the user, not
    // negotiation state. Computed once here, reused across re-renders.
    let viewerRole = null;
    try {
        const { data: { user } = {} } = await supabase.auth.getUser();
        const uid = user?.id;
        if (uid) {
            if (uid === neg.borrower?.id || uid === neg.borrower?.linked_user_id) viewerRole = 'borrower';
            else if (uid === neg.lender?.id || uid === neg.lender?.linked_user_id) viewerRole = 'lender';
        }
    } catch (e) {
        console.warn('[loan-negotiation-modal] auth.getUser failed:', e?.message || e);
    }

    renderModal(modalEl, neg, messages, viewerRole);
    wireActionHandlers(modalEl, supabase, negotiationId, () => neg, viewerRole);

    // Mark seen on initial mount. Re-bumped on every realtime push so a
    // viewer with the modal open never appears unread to themselves.
    // Fire-and-forget; non-fatal if it fails.
    const markSeen = () => {
        if (!viewerRole) return;
        supabase.rpc('mark_negotiation_seen', { p_neg_id: negotiationId })
            .then(({ error }) => {
                if (error) console.warn('[loan-negotiation-modal] mark_seen failed:', error.message);
            });
    };
    markSeen();

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
            // Preserve any in-flight chat draft so a counterparty term-
            // change re-render doesn't wipe what you were typing.
            const chatDraft = modalEl.querySelector('[data-lnm-field="chat-input"]')?.value || '';
            const previousStatus = neg?.status;
            const { data, error } = await fetchNegotiation(supabase, negotiationId);
            if (closed) return;
            if (error) {
                console.warn('[loan-negotiation-modal] realtime re-fetch failed:', error.message);
                return;
            }
            if (!data) return;
            neg = data;
            renderModal(modalEl, neg, messages, viewerRole);
            wireActionHandlers(modalEl, supabase, negotiationId, () => neg, viewerRole);
            // Restore chat draft only if the re-rendered input is empty —
            // avoids clobbering a value the user managed to type during
            // the brief re-render window.
            const chatIn = modalEl.querySelector('[data-lnm-field="chat-input"]');
            if (chatIn && chatDraft && !chatIn.value) chatIn.value = chatDraft;
            restoreFocus(modalEl, focusSnap);

            // Fire transition: open → fired. Notify the parent (so
            // dashboards can refresh hero stats / cash cards), then
            // schedule a celebratory auto-close. Manual close during
            // the window short-circuits via the closed flag.
            if (previousStatus === 'open' && neg.status === 'fired') {
                if (typeof onFired === 'function') {
                    try { await onFired(neg); } catch (e) {
                        console.warn('[loan-negotiation-modal] onFired callback threw:', e?.message || e);
                    }
                }
                setTimeout(() => { if (!closed) close(); }, 3000);
            }

            // Modal is open and just absorbed an update — bump seen so
            // the inbox doesn't show this row as unread to the viewer.
            markSeen();
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
            markSeen();
        })
        .subscribe();

    return { close };
}

// ── Action wiring (re-bound on every full re-render since innerHTML
//    discards old listeners) ──────────────────────────────────────
function wireActionHandlers(modalEl, supabase, negotiationId, getNeg, viewerRole) {
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

    // ── Agree toggle (Phase 4) ──
    // Only the viewer's own checkbox is enabled. Click → set_negotiation_agreement.
    // On error (lender insufficient cash, etc.) revert and surface message.
    const myAgreeSelector = viewerRole === 'borrower' ? '[data-act="agree-borrower"]'
                          : viewerRole === 'lender'   ? '[data-act="agree-lender"]'
                          : null;
    const agreeErr = modalEl.querySelector('#lnm-agree-error');
    const myBox    = myAgreeSelector ? modalEl.querySelector(myAgreeSelector) : null;
    if (myBox && !myBox.disabled) {
        myBox.addEventListener('change', async (e) => {
            if (agreeErr) { agreeErr.style.display = 'none'; agreeErr.textContent = ''; }
            const newValue = !!e.target.checked;
            e.target.disabled = true;
            try {
                const { data, error } = await supabase.rpc('set_negotiation_agreement', {
                    p_neg_id: negotiationId,
                    p_agreed: newValue,
                });
                if (error) {
                    e.target.checked = !newValue;
                    showInline(agreeErr, error.message);
                    return;
                }
                if (!data?.success) {
                    e.target.checked = !newValue;
                    showInline(agreeErr, data?.error || 'Could not change agreement.');
                    return;
                }
                // Success: realtime UPDATE will reconcile the row + flip
                // status if both parties are now agreed (fire path).
            } catch (err) {
                e.target.checked = !newValue;
                showInline(agreeErr, err?.message || 'Network error.');
            } finally {
                // Re-enable only if the modal hasn't transitioned to a
                // terminal state (in which case re-render disables it).
                const stillOpen = getNeg()?.status === 'open';
                e.target.disabled = !stillOpen;
            }
        });
    }
}

function showInline(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = '';
}


// ════════════════════════════════════════════════════════════════════════
//  Borrower-side bank picker — Phase 5 entry point.
//
//  Opens a small modal listing every Finance corporation the borrower
//  could negotiate with. Pick one + fill initial terms → calls
//  create_loan_negotiation, then auto-mounts the negotiation modal on
//  the new id. Refuses gracefully if borrower already has an open
//  negotiation with the picked bank (server enforces UNIQUE; we surface
//  the error in the picker).
// ════════════════════════════════════════════════════════════════════════
export async function mountLoanRequestPicker({ supabase, borrowerFactionId, onOpened, onClose } = {}) {
    if (!supabase) throw new Error('mountLoanRequestPicker: supabase client required');

    injectStylesOnce();
    const overlay = document.createElement('div');
    overlay.className = 'lnm-overlay';
    overlay.innerHTML = '<div class="lnm-modal" style="width:min(540px, 94vw);"><div class="lnm-loading">Loading banks…</div></div>';
    const modalEl = overlay.querySelector('.lnm-modal');
    document.body.appendChild(overlay);

    let closed = false;
    const close = () => {
        if (closed) return;
        closed = true;
        overlay.remove();
        if (typeof onClose === 'function') onClose();
    };
    overlay.addEventListener('click', (e) => {
        if (e.target.closest('[data-act="close"]')) { close(); return; }
        if (e.target === overlay)                   { close(); return; }
    });

    // Resolve borrower faction. If caller passed an id, trust it; else
    // resolve from auth.
    let borrowerId = borrowerFactionId;
    if (!borrowerId) {
        try {
            const { data: { user } = {} } = await supabase.auth.getUser();
            const uid = user?.id;
            if (uid) {
                const { data: own } = await supabase
                    .from('factions')
                    .select('id')
                    .eq('faction_type', 'corporation')
                    .is('abandoned_at', null)
                    .or(`id.eq.${uid},linked_user_id.eq.${uid}`)
                    .limit(1)
                    .maybeSingle();
                borrowerId = own?.id || null;
            }
        } catch (e) {
            console.warn('[loan-request-picker] borrower auth resolve failed:', e?.message || e);
        }
    }
    if (!borrowerId) {
        modalEl.innerHTML = `
            <div class="lnm-head">
              <div><div class="lnm-head__title">Negotiate Loan</div></div>
              <button type="button" class="lnm-close" data-act="close">Close</button>
            </div>
            <div class="lnm-error">Could not resolve your corporation. Please reload and try again.</div>`;
        return { close };
    }

    // Load Finance corps (excluding self). RLS allows reading any faction
    // row's id + name (factions table is broadly readable in this codebase).
    const { data: banks, error: banksErr } = await supabase
        .from('factions')
        .select('id, faction_name, abbreviation, nation:nation_id(name)')
        .eq('faction_type', 'corporation')
        .eq('corp_sector', 'Finance')
        .is('abandoned_at', null)
        .neq('id', borrowerId)
        .order('faction_name', { ascending: true });

    if (banksErr) {
        modalEl.innerHTML = `
            <div class="lnm-head">
              <div><div class="lnm-head__title">Negotiate Loan</div></div>
              <button type="button" class="lnm-close" data-act="close">Close</button>
            </div>
            <div class="lnm-error">Failed to load banks: ${escHtml(banksErr.message)}</div>`;
        return { close };
    }
    const bankList = banks || [];

    // Render picker form
    modalEl.innerHTML = `
        <div class="lnm-head">
          <div>
            <div class="lnm-head__title">Negotiate Loan</div>
            <div class="lnm-head__pair">Open a bilateral negotiation with one bank</div>
            <div class="lnm-head__activity">Targeted alternative to the auction request flow</div>
          </div>
          <button type="button" class="lnm-close" data-act="close">Close</button>
        </div>

        <div class="lnm-col" style="border-left:0;">
          <div class="lnm-section-h">Lender</div>
          <div class="lnm-field">
            <label>Bank</label>
            ${bankList.length === 0
              ? '<div class="lnm-empty-chat" style="text-align:left;padding:10px 0;">No Finance corporations available to negotiate with.</div>'
              : `<select data-lnm-field="lender" style="width:100%;background:var(--bg-3);border:1px solid var(--border-1);color:var(--text-bright);padding:6px 9px;font-family:var(--font-mono);font-size:12px;">
                  <option value="">— Select a bank —</option>
                  ${bankList.map(b => `<option value="${escHtml(b.id)}">${escHtml(b.faction_name)}${b.nation?.name ? ' · ' + escHtml(b.nation.name) : ''}</option>`).join('')}
                </select>`}
          </div>

          <div class="lnm-section-h" style="margin-top:14px;">Initial Terms (you can change these in the negotiation)</div>
          <div class="lnm-field">
            <label>Principal ($)</label>
            <input type="number" min="1" step="1000" data-lnm-field="principal" value="50000">
          </div>
          <div class="lnm-field">
            <label>APR (%)</label>
            <input type="number" min="0" max="100" step="0.1" data-lnm-field="apr" value="7.5">
          </div>
          <div class="lnm-field">
            <label>Term (ticks)</label>
            <input type="number" min="1" step="1" data-lnm-field="term_ticks" value="24">
          </div>
          <div class="lnm-field">
            <label>Purpose (optional)</label>
            <input type="text" maxlength="120" data-lnm-field="purpose" placeholder="e.g. Fleet expansion">
          </div>

          <div class="lnm-action-row">
            <button type="button" class="lnm-btn lnm-btn--primary" data-act="open-negotiation"
              ${bankList.length === 0 ? 'disabled' : ''}>Open Negotiation</button>
            <span class="lnm-loading" id="lnm-picker-status" style="padding:0;font-size:10px;display:none;">Opening…</span>
          </div>
          <div class="lnm-inline-error" id="lnm-picker-error" style="display:none;"></div>
        </div>
    `;

    const submitBtn = modalEl.querySelector('[data-act="open-negotiation"]');
    const errEl     = modalEl.querySelector('#lnm-picker-error');
    const statusEl  = modalEl.querySelector('#lnm-picker-status');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
            const lenderId  = modalEl.querySelector('[data-lnm-field="lender"]')?.value || '';
            const principal = parseInt(modalEl.querySelector('[data-lnm-field="principal"]')?.value, 10);
            const apr       = parseFloat(modalEl.querySelector('[data-lnm-field="apr"]')?.value);
            const termTicks = parseInt(modalEl.querySelector('[data-lnm-field="term_ticks"]')?.value, 10);
            const purpose   = modalEl.querySelector('[data-lnm-field="purpose"]')?.value || '';

            if (!lenderId)                                      { showInline(errEl, 'Pick a bank first.'); return; }
            if (!Number.isFinite(principal) || principal <= 0)  { showInline(errEl, 'Principal must be a positive number.'); return; }
            if (!Number.isFinite(apr) || apr < 0 || apr > 100)  { showInline(errEl, 'APR must be between 0 and 100.'); return; }
            if (!Number.isInteger(termTicks) || termTicks <= 0) { showInline(errEl, 'Term must be a positive integer.'); return; }

            submitBtn.disabled = true;
            if (statusEl) statusEl.style.display = '';
            try {
                const { data, error } = await supabase.rpc('create_loan_negotiation', {
                    p_lender_id:  lenderId,
                    p_principal:  principal,
                    p_apr:        apr,
                    p_term_ticks: termTicks,
                    p_purpose:    purpose,
                });
                if (error)          { showInline(errEl, error.message); return; }
                if (!data?.success) { showInline(errEl, data?.error || 'Could not open negotiation.'); return; }

                const newId = data.negotiation_id;
                close();
                if (typeof onOpened === 'function') {
                    try { await onOpened(newId); } catch (e) {
                        console.warn('[loan-request-picker] onOpened callback threw:', e?.message || e);
                    }
                } else {
                    // Default: chain into the negotiation modal so the
                    // borrower lands directly in their new conversation.
                    await mountLoanNegotiationModal({ supabase, negotiationId: newId });
                }
            } catch (e) {
                showInline(errEl, e?.message || 'Network error.');
            } finally {
                submitBtn.disabled = false;
                if (statusEl) statusEl.style.display = 'none';
            }
        });
    }

    return { close };
}


// ════════════════════════════════════════════════════════════════════════
//  Lender-side inbox panel — Phase 5.
//
//  Renders into a host element. Lists every loan_negotiations row where
//  this corp is the lender AND status='open'. Click a row → opens the
//  negotiation modal. Auto-refreshes on modal close. Unread pill when
//  last_activity_at > last_seen_at_lender.
//
//  Caller pattern:
//    await renderLenderInbox({
//      supabase, container, lenderFactionId,
//      onOpenNegotiation: (negId) => mountLoanNegotiationModal({...}),
//    });
//
//  Inbox styles are part of the shared injected stylesheet so a host
//  page doesn't need to ship anything extra.
// ════════════════════════════════════════════════════════════════════════
export async function renderLenderInbox({ supabase, container, lenderFactionId, onOpenNegotiation } = {}) {
    if (!supabase || !container) return;
    injectStylesOnce();

    container.classList.add('lnm-inbox-host');
    container.innerHTML = '<div class="lnm-loading" style="padding:14px;">Loading inbox…</div>';

    let resolvedLenderId = lenderFactionId;
    if (!resolvedLenderId) {
        try {
            const { data: { user } = {} } = await supabase.auth.getUser();
            const uid = user?.id;
            if (uid) {
                const { data: own } = await supabase
                    .from('factions')
                    .select('id')
                    .eq('faction_type', 'corporation')
                    .is('abandoned_at', null)
                    .or(`id.eq.${uid},linked_user_id.eq.${uid}`)
                    .limit(1)
                    .maybeSingle();
                resolvedLenderId = own?.id || null;
            }
        } catch (e) {
            console.warn('[lender-inbox] auth resolve failed:', e?.message || e);
        }
    }
    if (!resolvedLenderId) {
        container.innerHTML = '<div class="lnm-empty-chat" style="padding:14px;">Sign in to see negotiations.</div>';
        return;
    }

    const refresh = async () => {
        const { data: rows, error } = await supabase
            .from('loan_negotiations')
            .select(`
                id, principal, apr, term_ticks, status,
                borrower_agreed, lender_agreed,
                last_activity_at, last_seen_at_lender,
                borrower:borrower_faction_id(id, faction_name)
            `)
            .eq('lender_faction_id', resolvedLenderId)
            .eq('status', 'open')
            .order('last_activity_at', { ascending: false });

        if (error) {
            container.innerHTML = '<div class="lnm-error" style="padding:14px;">Failed to load inbox: ' + escHtml(error.message) + '</div>';
            return;
        }
        if (!rows || rows.length === 0) {
            container.innerHTML = '<div class="lnm-empty-chat" style="padding:14px;">No open negotiations.</div>';
            return;
        }

        container.innerHTML = rows.map(r => {
            const tally  = (r.borrower_agreed ? 1 : 0) + (r.lender_agreed ? 1 : 0);
            const unread = !r.last_seen_at_lender ||
                           new Date(r.last_activity_at).getTime() > new Date(r.last_seen_at_lender).getTime();
            return `
              <div class="lnm-inbox-row" data-neg-id="${escHtml(r.id)}">
                <div class="lnm-inbox-row__main">
                  <div class="lnm-inbox-row__pair">
                    ${unread ? '<span class="lnm-inbox-pill">unread</span>' : ''}
                    ${escHtml(r.borrower?.faction_name || 'Borrower')}
                  </div>
                  <div class="lnm-inbox-row__meta">
                    $${Number(r.principal).toLocaleString()} @ ${escHtml(r.apr)}% · ${escHtml(r.term_ticks)} ticks · Agreement ${tally}/2
                  </div>
                </div>
                <div class="lnm-inbox-row__time">${formatRelative(r.last_activity_at)}</div>
              </div>
            `;
        }).join('');

        container.querySelectorAll('.lnm-inbox-row').forEach(row => {
            row.addEventListener('click', async () => {
                const negId = row.dataset.negId;
                if (!negId) return;
                if (typeof onOpenNegotiation === 'function') {
                    await onOpenNegotiation(negId, refresh);
                } else {
                    await mountLoanNegotiationModal({ supabase, negotiationId: negId, onClose: refresh });
                }
            });
        });
    };

    await refresh();
    return { refresh };
}
