/**
 * petition-pressing-issues.js — Pressing-Issues mount for the active
 * Petition for Reform in an absolute monarchy.
 *
 * One pending petition per nation (DB-enforced). The card is rendered
 * for every player in the nation; only the monarch's faction sees the
 * three response buttons (Dismiss / Agree to Some / Accept). For
 * non-monarch viewers (including the petitioner) the card shows the
 * countdown to auto-accept and the public mood line.
 *
 * Wires into the .adm2-pressing-body container on government.html's
 * Administrative subtab via a single mount call.
 *
 * Usage:
 *   import { mountPetitionPressingIssues } from './js/petition-pressing-issues.js';
 *   const ctl = mountPetitionPressingIssues({
 *       supabase, faction, nation, host,
 *       currentTick: () => Number(shard?.current_tick) || 0,
 *   });
 *   // ctl.refresh()  — re-fetch on demand
 *   // ctl.getCount() — 0 or 1
 */

const STYLE_ID = 'pp-petition-pressing-styles';

const CSS = `
.pp-card {
    background: #1a1a17;
    border: 1px solid rgba(255,255,255,0.06);
    border-left: 3px solid #c8a832;
    padding: 18px 22px;
    margin-bottom: 12px;
}
.pp-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
}
.pp-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 2px 8px;
    color: #c8a832;
    border: 1px solid rgba(200,168,50,0.40);
    background: rgba(200,168,50,0.06);
}
.pp-deadline {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.pp-name {
    font-family: 'IBM Plex Serif', Georgia, serif;
    font-weight: 500;
    font-size: 19px;
    color: #f0efe6;
    line-height: 1.2;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
}
.pp-body {
    font-size: 13px;
    color: #c8c5b8;
    line-height: 1.5;
    margin-bottom: 10px;
}
.pp-mood {
    font-style: italic;
    color: #b8a85a;
}
.pp-actions {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    flex-wrap: wrap;
}
.pp-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 8px 14px;
    background: #1a1a17;
    color: #f0efe6;
    border: 1px solid rgba(255,255,255,0.18);
    cursor: pointer;
    transition: background 0.1s, border-color 0.1s;
}
.pp-btn:hover { background: #232220; border-color: rgba(255,255,255,0.32); }
.pp-btn[disabled] { opacity: 0.45; cursor: not-allowed; }
.pp-btn.kind-dismiss { border-left: 3px solid #d9534f; }
.pp-btn.kind-partial { border-left: 3px solid #c8a832; }
.pp-btn.kind-accept  { border-left: 3px solid #5cc55c; }
.pp-note {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #888;
    margin-top: 10px;
    letter-spacing: 0.04em;
}
`;

const MOOD_TEXT = {
    apathetic: 'The people are apathetic to this motion.',
    hopeful:   'The people are hopeful that the monarchy will hear their plea.',
    expectant: 'The people expect this petition to be heard, and may lash out if they are ignored.',
};

const ACTION_LABELS = {
    dismiss: 'Dismiss the Petition',
    partial: 'Agree to Some of the Reforms',
    accept:  'Accept the Reforms',
};

function injectStylesOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => (
        { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
    ));
}

async function fetchPendingPetition(supabase, nationId) {
    if (!nationId) return null;
    const { data, error } = await supabase
        .from('petitions')
        .select('id, nation_id, faction_id, monarch_faction_id, filed_at_tick, auto_accept_at_tick, d100, strength, total, bucket, status')
        .eq('nation_id', nationId)
        .eq('status', 'pending')
        .maybeSingle();
    if (error) {
        console.warn('[petition-pressing] fetch failed:', error.message);
        return null;
    }
    return data || null;
}

async function fetchFactionName(supabase, factionId) {
    if (!factionId) return 'An opposition party';
    const { data } = await supabase
        .from('factions')
        .select('faction_name')
        .eq('id', factionId)
        .maybeSingle();
    return data?.faction_name || 'An opposition party';
}

function formatHosName(nation) {
    const parts = [
        nation?.head_of_state_title,
        nation?.head_of_state_first_name,
        nation?.head_of_state_last_name,
    ].map(s => (s || '').trim()).filter(Boolean);
    return parts.length ? parts.join(' ') : 'the monarch';
}

function renderCard({ petition, petitionerName, nation, isMonarch, currentTick }) {
    const ticksLeft = Math.max(0, petition.auto_accept_at_tick - currentTick);
    const deadline = ticksLeft === 0
        ? 'Auto-accepting next tick'
        : `Auto-accept in ${ticksLeft} tick${ticksLeft === 1 ? '' : 's'}`;
    const hosName = formatHosName(nation);
    const mood = MOOD_TEXT[petition.bucket] || '';

    const actionsHtml = isMonarch
        ? `<div class="pp-actions">
              <button class="pp-btn kind-dismiss" data-action="petition-respond" data-choice="dismiss" data-id="${escapeHtml(petition.id)}">${escapeHtml(ACTION_LABELS.dismiss)}</button>
              <button class="pp-btn kind-partial" data-action="petition-respond" data-choice="partial" data-id="${escapeHtml(petition.id)}">${escapeHtml(ACTION_LABELS.partial)}</button>
              <button class="pp-btn kind-accept"  data-action="petition-respond" data-choice="accept"  data-id="${escapeHtml(petition.id)}">${escapeHtml(ACTION_LABELS.accept)}</button>
           </div>
           <div class="pp-note">If no decision is made within the deadline, Accept fires automatically.</div>`
        : `<div class="pp-note">Awaiting the monarch's response.</div>`;

    return `<div class="pp-card">
        <div class="pp-meta-row">
            <span class="pp-tag">Petition for Reform</span>
            <span class="pp-deadline">${escapeHtml(deadline)}</span>
        </div>
        <div class="pp-name">PETITION FOR REFORM</div>
        <div class="pp-body">
            ${escapeHtml(petitionerName)} has petitioned the monarch ${escapeHtml(hosName)} on a list of reforms,
            hoping to stabilize and potentially liberalize the nation.
            The nation waits for the throne's response.
            <div class="pp-mood" style="margin-top:6px;">${escapeHtml(mood)}</div>
        </div>
        ${actionsHtml}
    </div>`;
}

export function mountPetitionPressingIssues({
    supabase,
    faction,
    nation,
    host,
    currentTick = () => 0,
    emptyMessage = '',
    emptyClass = '',
    onChange = null,
}) {
    if (!host) return { refresh: async () => {}, getCount: () => 0 };
    injectStylesOnce();

    let petition = null;
    let petitionerName = '';
    let inflight = false;

    function render() {
        if (!petition) {
            // Empty state: either render the caller-provided placeholder
            // (e.g. government.html's "No pressing issues right now." copy)
            // or clear the host so a sibling renderer can own the empty UI.
            if (emptyMessage) {
                const cls = emptyClass ? ` class="${escapeHtml(emptyClass)}"` : '';
                host.innerHTML = `<div${cls}>${escapeHtml(emptyMessage)}</div>`;
            } else {
                host.innerHTML = '';
            }
            return;
        }
        const tick = Number(currentTick()) || 0;
        const isMonarch = !!(nation?.monarch_faction_id && faction?.id
            && nation.monarch_faction_id === faction.id);
        host.innerHTML = renderCard({ petition, petitionerName, nation, isMonarch, currentTick: tick });
    }

    async function refresh() {
        petition = await fetchPendingPetition(supabase, nation?.id);
        petitionerName = petition
            ? await fetchFactionName(supabase, petition.faction_id)
            : '';
        render();
        if (typeof onChange === 'function') {
            try { onChange(petition); } catch (e) { console.warn('[petition-pressing] onChange threw:', e?.message || e); }
        }
    }

    host.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action="petition-respond"]');
        if (!btn || inflight) return;
        const choice = btn.dataset.choice;
        const id = btn.dataset.id;
        if (!choice || !id) return;

        const label = ACTION_LABELS[choice] || choice;
        if (!confirm(`${label}?\n\nThis applies stat changes immediately and resolves the petition.`)) return;

        inflight = true;
        // Disable all buttons to prevent double-fire while the RPC is in flight.
        host.querySelectorAll('[data-action="petition-respond"]').forEach(b => { b.disabled = true; });
        try {
            const { data, error } = await supabase.rpc('respond_to_petition', {
                p_petition_id: id,
                p_action:      choice,
            });
            if (error) {
                alert('Response failed: ' + error.message);
                return;
            }
            if (!data?.success) {
                alert('Could not respond: ' + (data?.reason || 'unknown error'));
                return;
            }
            // Hand control back: refresh clears the card; outer pages can listen
            // for the window event to refresh their own derived state (notifs).
            window.dispatchEvent(new CustomEvent('petition:resolved', { detail: { id, action: choice, result: data } }));
            await refresh();
        } catch (err) {
            alert('Response failed: ' + (err?.message || err));
        } finally {
            inflight = false;
        }
    });

    window.addEventListener('petition:filed',    refresh);
    window.addEventListener('petition:resolved', refresh);

    refresh();

    return {
        refresh,
        getCount: () => (petition ? 1 : 0),
    };
}
