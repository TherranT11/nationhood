/**
 * committee-hearing-pressing-issues.js — Pressing-Issues mount for
 * open committee hearings where the entrepreneur is invited as a
 * witness (20270758).
 *
 * Surfaces every hearing returned by list_open_hearings_for_witness
 * (filtered server-side to the entrepreneur's nation, excluding
 * hearings they're already on as a committee member — they aren't —
 * or have already testified at). Each card carries:
 *
 *   • header — "Committee Hearing · Witness Call"
 *   • body   — "{Committee} is seeking expert testimony on {Section}"
 *   • meta   — bill category badge
 *   • action — [Submit Testimony] opens an inline modal with the
 *              persona dropdown + textarea, [Close] dismisses the
 *              card client-side via localStorage so re-opening the
 *              dashboard doesn't resurrect the same nag.
 *
 * The modal calls submit_hearing_testimony directly. On success the
 * hearing drops out of the next refresh (the RPC excludes hearings
 * the caller already testified at). Submit reward (+1 ent_reputation)
 * fires server-side on acceptance, not on submission.
 *
 * Mount contract matches the sibling pressing-issues modules:
 *   { supabase, faction, host, showEmpty?, onChange? } in
 *   { refresh, getCount } out
 */

import { COMMITTEES } from './committees.js';

const STYLE_ID = 'ch-pi-styles';

const CSS = `
.ch-pi-card { background:#1a1a17; border:1px solid rgba(255,255,255,0.06);
  border-left:3px solid #5aafa5; padding:14px 16px; margin-bottom:12px;
  display:flex; align-items:flex-start; gap:14px; }
.ch-pi-icon { width:36px; height:36px; flex-shrink:0; background:rgba(90,175,165,0.08);
  border:0.5px solid rgba(90,175,165,0.4); border-radius:4px;
  display:flex; align-items:center; justify-content:center;
  font-size:18px; color:#5aafa5; }
.ch-pi-info { flex:1; min-width:0; }
.ch-pi-eyebrow { font-size:9px; letter-spacing:0.14em; color:#5aafa5; font-weight:700; margin-bottom:4px; }
.ch-pi-headline { font-size:12.5px; color:#fff; line-height:1.4; margin-bottom:6px; }
.ch-pi-headline strong { color:#fff; font-weight:600; }
.ch-pi-headline em { color:#5aafa5; font-style:italic; }
.ch-pi-meta { display:flex; gap:7px; }
.ch-pi-cat { padding:2px 7px; border-radius:2px; background:#080808;
  font-size:8.5px; letter-spacing:0.12em; font-weight:700; color:#5aafa5; }
.ch-pi-actions { display:flex; flex-direction:column; gap:6px; flex-shrink:0; }
.ch-pi-accept-btn, .ch-pi-close-btn { padding:7px 12px; font-size:9px; letter-spacing:0.12em;
  font-weight:700; border-radius:3px; cursor:pointer; font-family:inherit; white-space:nowrap; }
.ch-pi-accept-btn { background:rgba(90,175,165,0.08); border:0.5px solid #5aafa5; color:#5aafa5; }
.ch-pi-accept-btn:hover { background:rgba(90,175,165,0.18); color:#fff; }
.ch-pi-close-btn { background:transparent; border:0.5px solid #3a3a3a; color:#888; }
.ch-pi-close-btn:hover { color:#d4d4d4; border-color:#5a5a5a; }
@media (max-width:520px) {
  .ch-pi-card { flex-wrap:wrap; }
  .ch-pi-actions { flex-direction:row; width:100%; }
  .ch-pi-accept-btn, .ch-pi-close-btn { flex:1; }
}

/* ─── Testify modal ─────────────────────────────────────────────── */
.ch-pi-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:1000;
  display:flex; align-items:flex-start; justify-content:center; padding:60px 16px 16px;
  overflow-y:auto; }
.ch-pi-modal { width:100%; max-width:560px; background:#0a0a0a;
  border:0.5px solid rgba(90,175,165,0.4); border-radius:6px; overflow:hidden;
  font-family:-apple-system,system-ui,sans-serif; color:#d4d4d4; }
.ch-pi-head { padding:18px 22px 14px; border-bottom:0.5px solid rgba(90,175,165,0.3);
  position:relative; background:#0e0e0e; }
.ch-pi-h-eyebrow { font-size:9px; letter-spacing:0.18em; color:#5aafa5; font-weight:700; margin-bottom:6px; }
.ch-pi-h-title { font-size:15px; color:#fff; font-weight:500; line-height:1.35; padding-right:30px; }
.ch-pi-close { position:absolute; top:14px; right:14px; width:24px; height:24px;
  background:transparent; border:0.5px solid #3a3a3a; border-radius:3px; color:#888;
  font-size:12px; cursor:pointer; font-family:inherit;
  display:flex; align-items:center; justify-content:center; }
.ch-pi-close:hover { color:#fff; border-color:#5a5a5a; }
.ch-pi-body { padding:18px 22px; display:flex; flex-direction:column; gap:14px; }
.ch-pi-fg { display:flex; flex-direction:column; gap:6px; }
.ch-pi-lab { font-size:9.5px; letter-spacing:0.14em; color:#5aafa5; font-weight:700; }
.ch-pi-hint { font-size:10.5px; color:#888; line-height:1.5; font-style:italic; }
.ch-pi-select { padding:9px 11px; background:#080808; border:0.5px solid rgba(255,255,255,0.1);
  border-radius:3px; color:#d4d4d4; font-size:11px; font-family:inherit; cursor:pointer; }
.ch-pi-select:focus { outline:none; border-color:#5aafa5; }
.ch-pi-text { width:100%; min-height:120px; padding:10px 12px; background:#080808;
  border:0.5px solid rgba(255,255,255,0.1); border-radius:3px; color:#d4d4d4;
  font-family:Georgia,serif; font-size:12px; line-height:1.6; resize:vertical;
  box-sizing:border-box; }
.ch-pi-text:focus { outline:none; border-color:#5aafa5; }
.ch-pi-text::placeholder { color:#555; font-style:italic; }
.ch-pi-counter { font-size:9px; color:#666; font-family:monospace; letter-spacing:0.04em; text-align:right; }
.ch-pi-counter.warn { color:#d4b87a; }
.ch-pi-err { color:#d49a9a; font-size:10.5px; min-height:14px; }
.ch-pi-foot { padding:14px 22px; background:#0e0e0e; border-top:0.5px solid rgba(90,175,165,0.3);
  display:flex; gap:10px; justify-content:flex-end; }
.ch-pi-cancel { padding:9px 16px; background:transparent; border:0.5px solid #3a3a3a;
  color:#888; font-size:9.5px; letter-spacing:0.14em; font-weight:700;
  border-radius:3px; cursor:pointer; font-family:inherit; }
.ch-pi-cancel:hover { color:#d4d4d4; border-color:#5a5a5a; }
.ch-pi-submit { padding:9px 18px; background:rgba(90,175,165,0.08); border:0.5px solid #5aafa5;
  color:#5aafa5; font-size:9.5px; letter-spacing:0.14em; font-weight:700;
  border-radius:3px; cursor:pointer; font-family:inherit; }
.ch-pi-submit:hover:not(:disabled) { background:rgba(90,175,165,0.18); color:#fff; }
.ch-pi-submit:disabled { opacity:0.4; cursor:not-allowed; }
`;

const DISMISSED_KEY = 'dismissed_witness_hearings_ent';
const TEXT_MAX = 400;

const REASON_HUMAN = {
    not_authenticated:     'Sign in to submit testimony.',
    invalid_arguments:     'Submission was malformed — refresh and try again.',
    no_faction:            'No active faction found.',
    hearing_not_found:     'That hearing no longer exists.',
    hearing_closed:        'The hearing has closed.',
    hearing_window_passed: 'The testimony window has passed.',
    invalid_text:          'Testimony must be 1–400 characters.',
    persona_claimed:       'Another witness just took that persona — pick a different one.',
    already_testified:     'You have already testified at this hearing.',
};

function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
}

function escHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
        ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function readDismissed() {
    try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')); }
    catch { return new Set(); }
}
function writeDismissed(set) {
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set])); }
    catch { /* storage full or disabled — dismissal is best-effort */ }
}

export function mountCommitteeHearingPressingIssues({ supabase, faction, host, showEmpty = true, onChange = null }) {
    installStyles();
    const factionId = faction?.id || null;
    if (!host || !factionId) return { refresh: async () => {}, getCount: () => 0 };

    let count = 0;
    let hearings = [];
    // Guard against double-tap on a card's SUBMIT TESTIMONY button:
    // openTestifyModal awaits a persona fetch before appending the
    // overlay, so a fast second click would otherwise spawn a second
    // modal stacked over the first.
    let modalOpening = false;

    async function fetchHearings() {
        try {
            const { data, error } = await supabase.rpc('list_open_hearings_for_witness',
                { p_faction_id: factionId });
            if (error) {
                console.warn('[ch-pi] fetch failed:', error.message);
                return [];
            }
            if (!data?.success) return [];
            const dismissed = readDismissed();
            return (data.hearings || []).filter(h => !dismissed.has(h.hearing_id));
        } catch (err) {
            console.warn('[ch-pi] fetch threw:', err?.message || err);
            return [];
        }
    }

    function renderCard(h) {
        const meta        = COMMITTEES[h.committee_key] || {};
        const committeeNm = meta.name || 'a committee';
        const icon        = meta.icon || '⚖';
        const lawTitle    = h.section ? escHtml(h.section) : 'a proposal';
        const categoryUp  = (h.category || '').toUpperCase();
        return `
            <div class="ch-pi-card" data-hearing-id="${escHtml(h.hearing_id)}">
                <div class="ch-pi-icon">${escHtml(icon)}</div>
                <div class="ch-pi-info">
                    <div class="ch-pi-eyebrow">COMMITTEE HEARING &middot; WITNESS CALL</div>
                    <div class="ch-pi-headline"><strong>${escHtml(committeeNm)}</strong> is seeking expert testimony on <em>${lawTitle}</em>.</div>
                    <div class="ch-pi-meta"><span class="ch-pi-cat">${escHtml(categoryUp || 'PROPOSAL')}</span></div>
                </div>
                <div class="ch-pi-actions">
                    <button type="button" class="ch-pi-accept-btn" data-act="testify">&#10003; SUBMIT TESTIMONY</button>
                    <button type="button" class="ch-pi-close-btn" data-act="close">&#10005; CLOSE</button>
                </div>
            </div>`;
    }

    function bindCardActions() {
        host.querySelectorAll('.ch-pi-card').forEach(card => {
            const hearingId = card.dataset.hearingId;
            const hearing = hearings.find(h => h.hearing_id === hearingId);
            if (!hearing) return;
            card.querySelector('[data-act="testify"]')?.addEventListener('click', () => openTestifyModal(hearing));
            card.querySelector('[data-act="close"]')?.addEventListener('click', () => {
                const set = readDismissed();
                set.add(hearingId);
                writeDismissed(set);
                refresh();
            });
        });
    }

    async function refresh() {
        hearings = await fetchHearings();
        count = hearings.length;
        if (!count) {
            host.innerHTML = showEmpty
                ? '<div class="ch-pi-empty"><div class="empty">No open committee hearings inviting testimony.</div></div>'
                : '';
            if (onChange) onChange();
            return;
        }
        host.innerHTML = hearings.map(renderCard).join('');
        bindCardActions();
        if (onChange) onChange();
    }

    async function openTestifyModal(hearing) {
        if (modalOpening) return;
        modalOpening = true;
        try {
            // Pull the persona slate for this hearing. Filter to unclaimed
            // client-side; the server's atomic claim in submit_hearing_testimony
            // is still authoritative if two players race the same slot.
            const { data: personasRaw, error } = await supabase
                .from('committee_hearing_personas')
                .select('id, slug, name, title, affiliation, claimed_by_faction_id')
                .eq('hearing_id', hearing.hearing_id)
                .order('slug', { ascending: true });
            if (error) {
                alert('Could not load witness personas: ' + (error.message || 'try again'));
                return;
            }
            const unclaimed = (personasRaw || []).filter(p => !p.claimed_by_faction_id);
            if (!unclaimed.length) {
                alert('Every witness slot for this hearing has been taken.');
                return;
            }
            renderModal(hearing, unclaimed);
        } finally {
            modalOpening = false;
        }
    }

    function renderModal(hearing, personas) {
        const overlay = document.createElement('div');
        overlay.className = 'ch-pi-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        const meta = COMMITTEES[hearing.committee_key] || {};
        const committeeNm = meta.name || 'the committee';
        overlay.innerHTML = `
            <div class="ch-pi-modal">
                <div class="ch-pi-head">
                    <div class="ch-pi-h-eyebrow">${escHtml(committeeNm.toUpperCase())} &middot; WITNESS TESTIMONY</div>
                    <div class="ch-pi-h-title">${escHtml(hearing.section || 'Proposal')}</div>
                    <button type="button" class="ch-pi-close" data-act="cancel" title="Cancel">&#10005;</button>
                </div>
                <div class="ch-pi-body">
                    <div class="ch-pi-fg">
                        <div class="ch-pi-lab">WITNESS PERSONA</div>
                        <div class="ch-pi-hint">Choose a persona to speak as &mdash; not your own character. The committee sees who submitted; the public record shows only the persona.</div>
                        <select class="ch-pi-select" id="ch-pi-persona-sel">
                            <option value="">Pick a witness persona&hellip;</option>
                            ${personas.map(p => `<option value="${escHtml(p.id)}">${escHtml(p.title)} &mdash; ${escHtml(p.name)}, ${escHtml(p.affiliation)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="ch-pi-fg">
                        <div class="ch-pi-lab">TESTIMONY</div>
                        <textarea class="ch-pi-text" maxlength="${TEXT_MAX}" placeholder="Speak in the voice of your chosen persona&hellip;"></textarea>
                        <div class="ch-pi-counter">0 / ${TEXT_MAX} characters</div>
                    </div>
                    <div class="ch-pi-err"></div>
                </div>
                <div class="ch-pi-foot">
                    <button type="button" class="ch-pi-cancel" data-act="cancel">CANCEL</button>
                    <button type="button" class="ch-pi-submit" data-act="submit" disabled>&#9999; SUBMIT</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const sel       = overlay.querySelector('#ch-pi-persona-sel');
        const textEl    = overlay.querySelector('.ch-pi-text');
        const counter   = overlay.querySelector('.ch-pi-counter');
        const errEl     = overlay.querySelector('.ch-pi-err');
        const submitBtn = overlay.querySelector('.ch-pi-submit');
        let inFlight = false;

        const refreshGate = () => {
            const len = textEl.value.length;
            counter.textContent = `${len} / ${TEXT_MAX} characters`;
            counter.classList.toggle('warn', len > Math.floor(TEXT_MAX * 0.8) && len <= TEXT_MAX);
            const ok = !!sel.value && len >= 1 && len <= TEXT_MAX && !inFlight;
            submitBtn.disabled = !ok;
        };
        sel.addEventListener('change', refreshGate);
        textEl.addEventListener('input', refreshGate);

        const close = () => { if (inFlight) return; overlay.remove(); };
        overlay.querySelectorAll('[data-act="cancel"]').forEach(b => b.addEventListener('click', close));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        submitBtn.addEventListener('click', async () => {
            if (inFlight) return;
            inFlight = true;
            errEl.textContent = '';
            refreshGate();
            try {
                const { data, error } = await supabase.rpc('submit_hearing_testimony', {
                    p_hearing_id: hearing.hearing_id,
                    p_persona_id: sel.value,
                    p_text:       textEl.value.trim(),
                    p_faction_id: factionId,   // required since 20270665
                });
                if (error) throw error;
                if (!data?.success) {
                    const reason = data?.reason || 'unknown';
                    errEl.textContent = REASON_HUMAN[reason] || `Could not submit (${reason}).`;
                    inFlight = false;
                    refreshGate();
                    return;
                }
                overlay.remove();
                await refresh();   // hearing drops out of the next listing
            } catch (e) {
                errEl.textContent = 'Could not submit: ' + (e?.message || 'unknown error');
                inFlight = false;
                refreshGate();
            }
        });

        refreshGate();
    }

    refresh();
    return { refresh, getCount: () => count };
}
