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

/* ── Collateral picker (Phase 5b) ── */
.lnm-collat-summary {
    display: flex; gap: 16px; align-items: center;
    font-family: var(--font-mono); font-size: 10.5px;
    color: var(--text-muted);
    margin-bottom: 6px;
}
.lnm-collat-empty {
    padding: 12px;
    font-family: var(--font-mono); font-size: 10px;
    color: var(--text-dim); font-style: italic;
    border: 1px dashed var(--border-0);
    text-align: center;
}
.lnm-collat-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 4px;
}
@media (max-width: 720px) {
    .lnm-collat-grid { grid-template-columns: 1fr; }
}
.lnm-collat-item {
    display: grid; grid-template-columns: 14px 1fr auto;
    gap: 8px; align-items: center;
    padding: 6px 8px;
    background: var(--bg-3, #252525);
    border: 1px solid var(--border-1);
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
}
.lnm-collat-item:hover:not(.lnm-collat-item--readonly) {
    border-color: var(--amber, #c8a832);
}
.lnm-collat-item.selected {
    background: rgba(200,168,50,0.06);
    border-color: var(--amber, #c8a832);
}
.lnm-collat-item--readonly { cursor: default; }
.lnm-collat-check {
    width: 12px; height: 12px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-size: 10px; font-weight: 700;
    color: var(--amber, #c8a832);
    border: 1px solid var(--border-2, rgba(255,255,255,0.12));
}
.lnm-collat-item.selected .lnm-collat-check {
    background: var(--amber, #c8a832);
    color: var(--bg-0, #0e0e0c);
    border-color: var(--amber, #c8a832);
}
.lnm-collat-name {
    font-family: var(--font-ui); font-size: 11.5px; font-weight: 600;
    color: var(--text-bright);
    line-height: 1.2;
}
.lnm-collat-kind {
    font-family: var(--font-mono); font-size: 8.5px;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text-dim);
    margin-top: 1px;
}
.lnm-collat-value {
    font-family: var(--font-mono); font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: var(--green, #5cb85c);
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

// Resolve the caller's owned corporation id from auth.uid(). Used by
// the picker + inbox when the host page didn't pass an explicit id.
// Returns null on any failure (unauth, no corp, etc.). Pages that
// already know their active faction should pass it explicitly to
// avoid the auth round-trip + the "limit 1" non-determinism for
// users who own multiple corps.
async function _resolveOwnCorpId(supabase, ctxLabel) {
    try {
        const { data: { user } = {} } = await supabase.auth.getUser();
        const uid = user?.id;
        if (!uid) return null;
        const { data: own, error } = await supabase
            .from('factions')
            .select('id')
            .eq('faction_type', 'corporation')
            .is('abandoned_at', null)
            .or(`id.eq.${uid},linked_user_id.eq.${uid}`)
            .limit(1)
            .maybeSingle();
        if (error) {
            console.warn('[' + ctxLabel + '] own-corp lookup failed:', error.message);
            return null;
        }
        return own?.id || null;
    } catch (e) {
        console.warn('[' + ctxLabel + '] auth resolve failed:', e?.message || e);
        return null;
    }
}

// ── Fetch helpers (DRY for initial + realtime re-fetch) ──────────
// Per-class aircraft purchase-equivalent value for collateral pledging.
// Mirror of airline_aircraft_value() in 20260724. KNOWN-DUPLICATION
// pattern same as the ops/seats/maint constants in airline-operations.html.
const AIRCRAFT_VALUE = { regional: 5000000, narrowbody: 25000000, widebody: 100000000 };
const AIRCRAFT_LABEL = { regional: 'Regional', narrowbody: 'Narrowbody', widebody: 'Widebody' };

function fetchNegotiation(supabase, negotiationId) {
    return supabase
        .from('loan_negotiations')
        .select(`
            id, status, principal, apr, term_ticks, purpose, notes,
            borrower_agreed, lender_agreed, escrowed_lender_cash,
            last_activity_at, collateral,
            borrower:borrower_faction_id(id, faction_name, linked_user_id, corp_sector),
            lender:lender_faction_id(id, faction_name, linked_user_id)
        `)
        .eq('id', negotiationId)
        .maybeSingle();
}

// Fetch every borrower-owned asset that can be pledged: properties +
// (if Airline) aircraft + (if Shipping) vessels. Returns flat array
// of {kind, id, name, value} ready to drop into the collateral JSONB.
async function fetchAvailableCollateral(supabase, borrower) {
    if (!borrower?.id) return [];
    const out = [];

    const propsP = supabase.from('corp_properties')
        .select('id, name, role, purchase_price, condition')
        .eq('faction_id', borrower.id)
        .eq('is_active', true);

    const acP = (borrower.corp_sector === 'Airline')
        ? supabase.from('corp_aircraft')
            .select('id, aircraft_class, condition, tail_number')
            .eq('corp_id', borrower.id)
        : Promise.resolve({ data: [], error: null });

    const vesP = (borrower.corp_sector === 'Shipping')
        ? supabase.from('corp_vessels')
            .select('id, name, purchase_price')
            .eq('faction_id', borrower.id)
        : Promise.resolve({ data: [], error: null });

    const [propsRes, acRes, vesRes] = await Promise.all([propsP, acP, vesP]);

    if (propsRes.error) {
        console.warn('[lnm collateral] properties fetch failed:', propsRes.error.message);
    } else {
        for (const p of (propsRes.data || [])) {
            const rawVal  = Math.round(Number(p.purchase_price || 0) * (Number(p.condition || 0) / 100));
            const display = p.name || (p.role || 'Property').replace(/_/g, ' ');
            out.push({ kind: 'property', id: p.id, name: display, value: rawVal });
        }
    }
    if (acRes.error) {
        console.warn('[lnm collateral] aircraft fetch failed:', acRes.error.message);
    } else {
        for (const a of (acRes.data || [])) {
            const cls   = a.aircraft_class || 'regional';
            const base  = AIRCRAFT_VALUE[cls] || 0;
            const val   = Math.round(base * (Number(a.condition || 0) / 100));
            const tail  = a.tail_number ? ' · ' + a.tail_number : '';
            out.push({ kind: 'aircraft', id: a.id, name: (AIRCRAFT_LABEL[cls] || cls) + tail, value: val });
        }
    }
    if (vesRes.error) {
        console.warn('[lnm collateral] vessels fetch failed:', vesRes.error.message);
    } else {
        for (const v of (vesRes.data || [])) {
            out.push({ kind: 'vessel', id: v.id, name: v.name || 'Vessel', value: Math.round(Number(v.purchase_price || 0)) });
        }
    }
    return out;
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

// Collateral section. Borrower viewer + status='open' → editable
// picker with all owned assets. Lender or terminal status → read-only
// summary of currently-pledged items from neg.collateral.
//
// ⚠ SoT mirror: the bank's loan-offer review modal in
// corp-operations-finance.html (openLoanReviewModal → "Pledged
// Collateral" section) replays the same totalPledged + coverage% math
// against bank_loan_requests.collateral. Keep both in sync if the
// formula ever changes.
function renderCollateralSection(neg, viewerRole, pendingCollateral, collateralOptions) {
    const isOpen   = neg.status === 'open';
    const isBorrower = viewerRole === 'borrower';
    const editable = isOpen && isBorrower;
    const pledged  = Array.isArray(pendingCollateral) ? pendingCollateral : (Array.isArray(neg.collateral) ? neg.collateral : []);
    const totalPledged = pledged.reduce((s, x) => s + (Number(x.value) || 0), 0);
    const principal    = Number(neg.principal) || 0;
    const coverage     = principal > 0 ? Math.round((totalPledged / principal) * 100) : 0;

    let pickerHtml = '';
    if (editable) {
        const opts    = Array.isArray(collateralOptions) ? collateralOptions : [];
        const pickedIds = new Set(pledged.map(p => p.id));
        if (opts.length === 0) {
            pickerHtml = '<div class="lnm-collat-empty">No assets available to pledge.</div>';
        } else {
            pickerHtml = '<div class="lnm-collat-grid">' + opts.map(o => {
                const sel = pickedIds.has(o.id);
                const valM = Math.round((Number(o.value) || 0) / 1000) / 1000;
                return `
                  <div class="lnm-collat-item${sel ? ' selected' : ''}"
                       data-act="collat-toggle"
                       data-collat-kind="${escHtml(o.kind)}"
                       data-collat-id="${escHtml(o.id)}"
                       data-collat-name="${escHtml(o.name)}"
                       data-collat-value="${escHtml(o.value)}">
                    <div class="lnm-collat-check">${sel ? '✓' : ''}</div>
                    <div class="lnm-collat-meta">
                      <div class="lnm-collat-name">${escHtml(o.name)}</div>
                      <div class="lnm-collat-kind">${escHtml(o.kind)}</div>
                    </div>
                    <div class="lnm-collat-value">$${valM.toFixed(valM >= 10 ? 1 : 2)}M</div>
                  </div>
                `;
            }).join('') + '</div>';
        }
    } else if (pledged.length === 0) {
        pickerHtml = '<div class="lnm-collat-empty">No collateral pledged.</div>';
    } else {
        pickerHtml = '<div class="lnm-collat-grid">' + pledged.map(p => {
            const valM = Math.round((Number(p.value) || 0) / 1000) / 1000;
            return `
              <div class="lnm-collat-item selected lnm-collat-item--readonly">
                <div class="lnm-collat-check">●</div>
                <div class="lnm-collat-meta">
                  <div class="lnm-collat-name">${escHtml(p.name || '?')}</div>
                  <div class="lnm-collat-kind">${escHtml(p.kind || '?')}</div>
                </div>
                <div class="lnm-collat-value">$${valM.toFixed(valM >= 10 ? 1 : 2)}M</div>
              </div>
            `;
        }).join('') + '</div>';
    }

    const totalM = Math.round(totalPledged / 1000) / 1000;
    return `
      <div class="lnm-field">
        <label>Collateral${editable ? '' : ' (read-only)'}</label>
        <div class="lnm-collat-summary">
          <span>Total pledged: <strong>$${totalM.toFixed(totalM >= 10 ? 1 : 2)}M</strong></span>
          <span>Coverage: <strong style="color:${coverage >= 100 ? 'var(--green, #5cb85c)' : coverage >= 50 ? 'var(--amber, #c8a832)' : 'var(--accent-rust, #d48a3c)'};">${principal > 0 ? coverage + '%' : '—'}</strong></span>
        </div>
        ${pickerHtml}
      </div>`;
}

function renderModal(modalEl, neg, messages, viewerRole, pendingCollateral, collateralOptions) {
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

            ${renderCollateralSection(neg, viewerRole, pendingCollateral, collateralOptions)}

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

// Module-level double-mount guard. Repeated clicks on the same inbox
// row (during the data-load window) used to stack two overlays on
// the same negotiation; second close left the first floating. Set
// tracks live mounts by id; second call short-circuits with a no-op
// close handle.
const _activeNegotiationModals = new Set();

// ── Mount ────────────────────────────────────────────────────────
export async function mountLoanNegotiationModal({ supabase, negotiationId, onClose, onFired } = {}) {
    if (!supabase)      throw new Error('mountLoanNegotiationModal: supabase client required');
    if (!negotiationId) throw new Error('mountLoanNegotiationModal: negotiationId required');

    if (_activeNegotiationModals.has(negotiationId)) {
        return { close: () => {} };
    }
    _activeNegotiationModals.add(negotiationId);

    injectStylesOnce();
    const overlay = renderShell();
    const modalEl = overlay.querySelector('.lnm-modal');
    document.body.appendChild(overlay);

    // Mutable closure state — re-fetched on realtime updates.
    let neg = null;
    let messages = [];
    let channel = null;
    let pollTimer = null;
    let closed = false;

    const cleanupChannel = () => {
        if (!channel) return;
        try { supabase.removeChannel(channel); } catch (_) { /* ignore */ }
        channel = null;
    };
    const cleanupPoll = () => {
        if (!pollTimer) return;
        clearInterval(pollTimer);
        pollTimer = null;
    };
    const onPageUnload = () => { cleanupChannel(); cleanupPoll(); };
    window.addEventListener('beforeunload', onPageUnload);

    const close = () => {
        if (closed) return;
        closed = true;
        _activeNegotiationModals.delete(negotiationId);
        cleanupChannel();
        cleanupPoll();
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

    // Working-draft collateral state: initialized from server, mutated
    // by borrower checkbox toggles, sent on Apply Changes. Realtime
    // updates re-sync from neg.collateral (server wins).
    let pendingCollateral = Array.isArray(neg.collateral) ? neg.collateral.slice() : [];

    // Borrower-side collateral options: their owned properties +
    // (sector-conditional) aircraft / vessels. Lenders don't load this
    // (they only see pledged items via neg.collateral).
    let collateralOptions = [];
    if (viewerRole === 'borrower') {
        collateralOptions = await fetchAvailableCollateral(supabase, neg.borrower);
    }

    renderModal(modalEl, neg, messages, viewerRole, pendingCollateral, collateralOptions);
    wireActionHandlers(modalEl, supabase, negotiationId, () => neg, viewerRole, pendingCollateral, () => collateralOptions);

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

    // Latch — the open→fired transition runs onFired + schedules
    // auto-close exactly once per modal lifecycle. Without this, a
    // realtime UPDATE arriving at t=14.99s and the poll tick at
    // t=15.0s can both pass the change-detection guard before either
    // has written `neg`, run onFired twice, and schedule two closes.
    let firedHandled = false;

    // Single source of truth for absorbing a fresh negotiation row.
    // Called from BOTH the realtime UPDATE listener and the polling
    // fallback below — whichever one delivers the change first wins,
    // the other becomes a no-op via the change-detection guard.
    const reconcileNegRow = async () => {
        if (closed) return;
        const focusSnap = captureFocus(modalEl);
        const chatDraft = modalEl.querySelector('[data-lnm-field="chat-input"]')?.value || '';
        const previousStatus = neg?.status;
        const previousActivity = neg?.last_activity_at;
        const { data, error } = await fetchNegotiation(supabase, negotiationId);
        if (closed) return;
        if (error) {
            console.warn('[loan-negotiation-modal] re-fetch failed:', error.message);
            return;
        }
        if (!data) return;
        // Skip the re-render entirely if nothing meaningful changed —
        // last_activity_at advances on every server-side row touch,
        // status flips capture the terminal transitions. Avoids
        // thrashing the user's focus + chat draft on every poll tick.
        if (data.status === previousStatus && data.last_activity_at === previousActivity) {
            return;
        }
        neg = data;
        pendingCollateral = Array.isArray(neg.collateral) ? neg.collateral.slice() : [];
        renderModal(modalEl, neg, messages, viewerRole, pendingCollateral, collateralOptions);
        wireActionHandlers(modalEl, supabase, negotiationId, () => neg, viewerRole, pendingCollateral, () => collateralOptions);
        const chatIn = modalEl.querySelector('[data-lnm-field="chat-input"]');
        if (chatIn && chatDraft && !chatIn.value) chatIn.value = chatDraft;
        restoreFocus(modalEl, focusSnap);

        if (!firedHandled && previousStatus === 'open' && neg.status === 'fired') {
            firedHandled = true;
            if (typeof onFired === 'function') {
                try { await onFired(neg); } catch (e) {
                    console.warn('[loan-negotiation-modal] onFired callback threw:', e?.message || e);
                }
            }
            setTimeout(() => { if (!closed) close(); }, 3000);
        }

        markSeen();
    };

    // ── Realtime subscriptions ───────────────────────────────────
    // One channel, two listeners. UPDATE on the negotiation row
    // triggers a re-fetch (because realtime payloads don't carry the
    // joined faction_name); INSERT on messages appends in-place.
    // De-dupe by id so the optimistic-or-not paths stay consistent.
    //
    // A 15s polling fallback covers cases where the WebSocket UPDATE
    // never reaches this client — backgrounded tab, momentary network
    // blip, expired auth token, channel error. Without it, a missed
    // 'open' → 'fired' event leaves the modal interactive forever and
    // lets the counterparty keep typing changes that the server will
    // silently reject.
    channel = supabase.channel('lnm:' + negotiationId);
    channel
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'loan_negotiations',
            filter: 'id=eq.' + negotiationId,
        }, async () => {
            await reconcileNegRow();
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

    // Polling fallback. Runs reconcileNegRow every 15s while the
    // modal is open. The change-detection guard inside makes a no-op
    // poll free, so this only re-renders when the server row has
    // actually advanced beyond what the local state knows about.
    pollTimer = setInterval(() => { reconcileNegRow(); }, 15000);

    return { close };
}

// ── Action wiring (re-bound on every full re-render since innerHTML
//    discards old listeners) ──────────────────────────────────────
function wireActionHandlers(modalEl, supabase, negotiationId, getNeg, viewerRole, pendingCollateral, getCollateralOptions) {
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
                    p_collateral: pendingCollateral,
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

    // ── Collateral picker toggle (Phase 5b) ──
    // Borrower-only: clicking a collateral item flips it in/out of the
    // pendingCollateral working draft. Apply Changes commits the diff
    // server-side. Lender's UI is read-only (no items have data-act).
    if (viewerRole === 'borrower' && getNeg()?.status === 'open') {
        modalEl.querySelectorAll('[data-act="collat-toggle"]').forEach(el => {
            el.addEventListener('click', () => {
                const id    = el.dataset.collatId;
                const kind  = el.dataset.collatKind;
                const name  = el.dataset.collatName;
                const value = Number(el.dataset.collatValue) || 0;
                if (!id) return;
                const idx = pendingCollateral.findIndex(c => c.id === id);
                if (idx >= 0) {
                    pendingCollateral.splice(idx, 1);
                    el.classList.remove('selected');
                    el.querySelector('.lnm-collat-check').textContent = '';
                } else {
                    pendingCollateral.push({ kind, id, name, value });
                    el.classList.add('selected');
                    el.querySelector('.lnm-collat-check').textContent = '✓';
                }
                // Update the summary line in place — total + coverage.
                const summary = modalEl.querySelector('.lnm-collat-summary');
                if (summary) {
                    const total = pendingCollateral.reduce((s, x) => s + (Number(x.value) || 0), 0);
                    const totalM = Math.round(total / 1000) / 1000;
                    const principal = Number(getNeg()?.principal) || 0;
                    const coverage = principal > 0 ? Math.round((total / principal) * 100) : 0;
                    const color = coverage >= 100 ? 'var(--green, #5cb85c)'
                                : coverage >= 50  ? 'var(--amber, #c8a832)'
                                :                   'var(--accent-rust, #d48a3c)';
                    summary.innerHTML = `
                        <span>Total pledged: <strong>$${totalM.toFixed(totalM >= 10 ? 1 : 2)}M</strong></span>
                        <span>Coverage: <strong style="color:${color};">${principal > 0 ? coverage + '%' : '—'}</strong></span>`;
                }
            });
        });
    }

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

    const resolvedLenderId = lenderFactionId
        || (await _resolveOwnCorpId(supabase, 'lender-inbox'));
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
