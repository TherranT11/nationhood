// js/loan-negotiation-modal.js
//
// Read-only modal for the loan-negotiation feature (Phase 2).
//
// Public surface:
//   mountLoanNegotiationModal({ supabase, negotiationId, onClose })
//     → returns a Promise that resolves when the modal mounts (data loaded)
//     → mount target: document.body (overlay)
//
// Phase 2 scope: fetch + render. Every input is disabled, Agree
// checkboxes are inert, no realtime, no chat input, no Walk Away.
// Phase 3 wires edits + chat + realtime; Phase 4 wires Agree + fire.
//
// Self-contained: injects its own CSS on first mount, owns its own
// DOM, removes everything cleanly when closed.

const STYLE_ID = 'lnm-style';

// One-time CSS injection. Variables (--bg-2, --text-bright, etc.)
// inherit from whatever page mounts the modal — corp pages share the
// same palette via corp-topbar.css and inline :root blocks.
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
.lnm-field input:disabled, .lnm-field textarea:disabled {
    color: var(--text-primary);
    cursor: default;
    opacity: 0.95;
}
.lnm-field textarea { resize: vertical; min-height: 56px; }

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
.lnm-chat-input input:disabled { opacity: 0.5; cursor: not-allowed; }
.lnm-chat-input button {
    padding: 6px 14px;
    font-family: var(--font-mono); font-size: 10px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    background: var(--bg-3); border: 1px solid var(--border-1);
    color: var(--text-secondary); cursor: not-allowed;
}

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

// Format a timestamp as "Xm ago" / "Xh ago" / "Xd ago" relative to now.
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
          <!-- TERMS (read-only) -->
          <div class="lnm-col">
            <div class="lnm-section-h">Terms</div>

            <div class="lnm-field">
              <label>Principal ($)</label>
              <input type="text" value="${escHtml(Number(neg.principal).toLocaleString())}" disabled>
            </div>
            <div class="lnm-field">
              <label>APR (%)</label>
              <input type="text" value="${escHtml(neg.apr)}" disabled>
            </div>
            <div class="lnm-field">
              <label>Term (ticks)</label>
              <input type="text" value="${escHtml(neg.term_ticks)}" disabled>
            </div>
            <div class="lnm-field">
              <label>Purpose</label>
              <input type="text" value="${escHtml(neg.purpose || '')}" placeholder="—" disabled>
            </div>
            <div class="lnm-field">
              <label>Notes</label>
              <textarea rows="3" placeholder="—" disabled>${escHtml(neg.notes || '')}</textarea>
            </div>

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
              Phase 2 — read-only. Edits, chat, Agree toggling, and Walk Away land in Phase 3 / Phase 4.
            </div>
          </div>

          <!-- CHAT -->
          <div class="lnm-col" style="display:flex;flex-direction:column;">
            <div class="lnm-section-h">Chat</div>
            <div class="lnm-chat" id="lnm-chat-scroll">
              ${(messages || []).length === 0
                ? '<div class="lnm-loading" style="padding:20px;">No messages yet.</div>'
                : messages.map(m => `
                  <div class="lnm-msg ${m.system_msg ? 'lnm-msg--system' : ''}">
                    <div class="lnm-msg__head">
                      ${m.system_msg
                        ? 'System'
                        : escHtml(m.author?.faction_name || 'Unknown')}
                      · ${formatRelative(m.posted_at)}
                    </div>
                    <div class="lnm-msg__body">${escHtml(m.body)}</div>
                  </div>
                `).join('')}
            </div>
            <div class="lnm-chat-input">
              <input type="text" placeholder="Phase 3 — chat input not yet wired" disabled>
              <button type="button" disabled>Send</button>
            </div>
          </div>
        </div>
    `;

    // Auto-scroll chat to bottom
    const chatScroll = modalEl.querySelector('#lnm-chat-scroll');
    if (chatScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
}

export async function mountLoanNegotiationModal({ supabase, negotiationId, onClose } = {}) {
    if (!supabase) throw new Error('mountLoanNegotiationModal: supabase client required');
    if (!negotiationId) throw new Error('mountLoanNegotiationModal: negotiationId required');

    injectStylesOnce();

    const overlay = renderShell();
    const modalEl = overlay.querySelector('.lnm-modal');
    document.body.appendChild(overlay);

    const close = () => {
        overlay.remove();
        if (typeof onClose === 'function') onClose();
    };

    // Click X / outside-click closes. Inside-modal clicks don't propagate.
    overlay.addEventListener('click', (e) => {
        if (e.target.closest('[data-act="close"]')) { close(); return; }
        if (e.target === overlay)                   { close(); return; }
    });

    // Fetch the negotiation row + parties + the most recent 50 messages.
    // RLS handles the access check — non-parties get an empty result and
    // we surface "not found" rather than leaking existence.
    const negPromise = supabase
        .from('loan_negotiations')
        .select(`
            id, status, principal, apr, term_ticks, purpose, notes,
            borrower_agreed, lender_agreed, escrowed_lender_cash,
            last_activity_at,
            borrower:borrower_faction_id(id, faction_name),
            lender:lender_faction_id(id, faction_name),
            fired_to_loan_id
        `)
        .eq('id', negotiationId)
        .maybeSingle();

    const msgsPromise = supabase
        .from('loan_negotiation_messages')
        .select(`
            id, body, system_msg, posted_at, posted_at_tick,
            author:author_faction_id(id, faction_name)
        `)
        .eq('negotiation_id', negotiationId)
        .order('posted_at', { ascending: true })
        .limit(50);

    const [negRes, msgsRes] = await Promise.all([negPromise, msgsPromise]);

    if (negRes.error) {
        renderError(modalEl, 'Failed to load negotiation: ' + negRes.error.message);
        return { close };
    }
    if (!negRes.data) {
        renderError(modalEl, 'Negotiation not found, or you are not a party to it.');
        return { close };
    }
    if (msgsRes.error) {
        // Non-fatal: render terms with an empty chat plus a soft warning.
        console.warn('[loan-negotiation-modal] messages fetch failed:', msgsRes.error.message);
    }

    renderModal(modalEl, negRes.data, msgsRes.data || []);

    return { close };
}
