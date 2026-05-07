// ══════════════════════════════════════════════════════════════════════
//  Navbar Notification Dropdown
//  Replaces the per-page guide button with a single bell + dropdown.
//  Each row deep-links to the relevant page; rows auto-clear when the
//  underlying state resolves (vote cast, message read, etc.) on the
//  next refresh.
// ══════════════════════════════════════════════════════════════════════

import { _supabase } from './supabase-client.js';
import { escapeHtml } from './utils.js';

// Refresh cadence. Window focus also triggers a refresh.
const REFRESH_MS = 60_000;
// Recent-election window: how many ticks "an election just happened"
// stays in the dropdown before falling off.
const ELECTION_RECENCY_TICKS = 30;

let _ctx = null;          // { faction, nation, shard }
let _refreshTimer = null;
let _styleInjected = false;
let _wired = false;
let _inflight = false;
// Dot suppression: when the user opens the dropdown we mark whatever
// rows are currently shown as "seen" by capturing their fingerprint.
// renderRows hides the dot whenever the live fingerprint matches the
// acknowledged one — so opening turns the dot off immediately, and a
// new notification arriving on the next refresh re-lights it.
let _lastRenderedFingerprint = '';
let _acknowledgedFingerprint = null;

// ──────────────────────────────────────────────────────────────────────
//  Styles
// ──────────────────────────────────────────────────────────────────────

function injectStyles() {
    if (_styleInjected || document.getElementById('notif-bell-styles')) {
        _styleInjected = true;
        return;
    }
    const style = document.createElement('style');
    style.id = 'notif-bell-styles';
    style.textContent = `
.notif-wrap { position: relative; display: inline-flex; }
.notif-bell {
    position: relative;
    background: transparent;
    border: 1px solid var(--border-mid, rgba(255,255,255,0.18));
    color: var(--text-bright, #f0efe6);
    width: 32px; height: 32px;
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0;
    transition: background 0.12s, border-color 0.12s;
}
.notif-bell:hover { background: rgba(255,255,255,0.06); border-color: var(--amber, #c8a64e); }
.notif-bell__icon { font-size: 16px; line-height: 1; }
.notif-bell__dot {
    position: absolute; top: 4px; right: 4px;
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--amber, #c8a64e);
    box-shadow: 0 0 6px var(--amber, #c8a64e);
    animation: notif-bell-pulse 1.6s ease-in-out infinite;
}
@keyframes notif-bell-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.55; transform: scale(1.25); }
}
.notif-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    width: 360px; max-width: calc(100vw - 24px); max-height: 480px;
    background: var(--bg-panel, #1a1a17);
    border: 1px solid var(--border-main, rgba(0,0,0,0.6));
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    border-radius: 6px;
    z-index: 9500;
    display: flex; flex-direction: column;
    overflow: hidden;
}
.notif-dropdown[hidden] { display: none; }
.notif-dropdown__header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px;
    background: var(--bg-card, #252525);
    border-bottom: 1px solid var(--border-main, rgba(0,0,0,0.4));
    flex-shrink: 0;
}
.notif-dropdown__title {
    font-family: var(--font-mono, monospace);
    font-size: 12px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-bright, #f0efe6);
}
.notif-dropdown__count {
    font-family: var(--font-mono, monospace);
    font-size: 11px; color: var(--amber, #c8a64e);
    letter-spacing: 1px;
}
.notif-dropdown__list {
    overflow-y: auto;
    flex: 1 1 auto;
}
.notif-row-wrap {
    position: relative;
    border-bottom: 1px solid var(--border-mid, rgba(255,255,255,0.06));
}
.notif-row-wrap:last-child { border-bottom: 0; }
.notif-row-wrap:hover { background: rgba(200,166,78,0.08); }
.notif-row {
    display: block; padding: 10px 36px 10px 14px;
    color: inherit; text-decoration: none;
    cursor: pointer;
    transition: background 0.1s;
}
.notif-row__close {
    position: absolute;
    top: 6px;
    right: 8px;
    width: 20px; height: 20px;
    border-radius: 3px;
    border: 1px solid rgba(217, 83, 79, 0.4);
    background: rgba(217, 83, 79, 0.12);
    color: #d9534f;
    font-size: 14px;
    line-height: 1;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.notif-row__close:hover {
    background: #d9534f;
    border-color: #d9534f;
    color: #fff;
}
.notif-row__title {
    font-size: 13px; color: var(--text-bright, #f0efe6);
    font-weight: 600; line-height: 1.3;
}
.notif-row__sub {
    display: block;
    margin-top: 2px;
    font-family: var(--font-mono, monospace);
    font-size: 10.5px; letter-spacing: 0.5px;
    color: var(--text-dim, #8a8676);
    text-transform: uppercase;
}
.notif-empty {
    padding: 24px 14px; text-align: center;
    font-family: var(--font-mono, monospace);
    font-size: 11px; letter-spacing: 1px;
    color: var(--text-dim, #4a4940);
    text-transform: uppercase;
}
`;
    document.head.appendChild(style);
    _styleInjected = true;
}

// ──────────────────────────────────────────────────────────────────────
//  Open/close + outside-click dismissal
// ──────────────────────────────────────────────────────────────────────

function closeDropdown() {
    const bell = document.getElementById('notif-bell');
    const drop = document.getElementById('notif-dropdown');
    if (drop) drop.hidden = true;
    if (bell) bell.setAttribute('aria-expanded', 'false');
}

function wireBellInteractions() {
    if (_wired) return;
    const bell = document.getElementById('notif-bell');
    const drop = document.getElementById('notif-dropdown');
    if (!bell || !drop) return;

    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!drop.hidden) {
            closeDropdown();
        } else {
            drop.hidden = false;
            bell.setAttribute('aria-expanded', 'true');
            // Mark the currently-displayed notification set as seen so
            // the amber dot turns off immediately. The next refresh
            // will re-light it only if a new row arrives.
            _acknowledgedFingerprint = _lastRenderedFingerprint;
            const dot = document.getElementById('notif-dot');
            if (dot) dot.hidden = true;
            refreshNotifications();
        }
    });
    document.addEventListener('click', (e) => {
        if (drop.hidden) return;
        if (drop.contains(e.target) || bell.contains(e.target)) return;
        closeDropdown();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !drop.hidden) closeDropdown();
    });
    _wired = true;
}

// ──────────────────────────────────────────────────────────────────────
//  Role detection — PM / Trade Minister / Justice Minister
// ──────────────────────────────────────────────────────────────────────

async function detectRoles(faction, nation) {
    const roles = { isPM: false, isTradeMin: false, isJusticeMin: false };
    if (!faction?.id || !nation?.id) return roles;

    // Ministries — Trade + Justice. Same pattern as getDiploBadgeRoles.
    const minP = _supabase.from('ministries')
        .select('ministry_key, party_id')
        .eq('nation_id', nation.id)
        .in('ministry_key', ['trade', 'justice', 'prime_minister'])
        .eq('is_active', true);

    // Government formation — extract PM via ministry_assignments.prime_minister
    const govP = _supabase.from('government_formations')
        .select('ministry_assignments')
        .eq('nation_id', nation.id)
        .in('status', ['formed', 'caretaker'])
        .order('formed_at', { ascending: false })
        .limit(1);

    const [{ data: mins }, { data: govs }] = await Promise.all([minP, govP]);

    (mins || []).forEach(m => {
        if (m.party_id !== faction.id) return;
        if (m.ministry_key === 'trade')          roles.isTradeMin = true;
        if (m.ministry_key === 'justice')        roles.isJusticeMin = true;
        if (m.ministry_key === 'prime_minister') roles.isPM = true;
    });
    const gov = (govs || [])[0];
    if (gov?.ministry_assignments?.prime_minister === faction.id) {
        roles.isPM = true;
    }

    return roles;
}

// ──────────────────────────────────────────────────────────────────────
//  Notification builders — each returns an array of rows (or []).
//  Row shape: { title, sub, href }.
// ──────────────────────────────────────────────────────────────────────

async function checkBills(faction, nation) {
    const { data, error } = await _supabase
        .from('bills')
        .select('id, status, bill_support(faction_id)')
        .eq('nation_id', nation.id)
        .in('status', ['committee', 'floor']);
    if (error || !data) return [];

    let committee = 0, floor = 0;
    for (const b of data) {
        const voted = (b.bill_support || []).some(s => s.faction_id === faction.id);
        if (voted) continue;
        if (b.status === 'committee') committee++;
        else if (b.status === 'floor') floor++;
    }
    const out = [];
    if (committee > 0) {
        out.push({
            title: `${committee} bill${committee === 1 ? '' : 's'} in committee awaiting your vote`,
            sub: 'Committee · unvoted',
            href: 'laws.html?view=committee',
        });
    }
    if (floor > 0) {
        out.push({
            title: `${floor} bill${floor === 1 ? '' : 's'} on the floor awaiting your vote`,
            sub: 'Floor · unvoted',
            href: 'laws.html?view=floor',
        });
    }
    return out;
}

async function checkRecentElection(nation, shard) {
    const tick = Number(shard?.current_tick) || 0;
    // Without a current tick we can't reason about recency. Bail rather
    // than risk showing a stale completed election as "Just now".
    if (tick <= 0) return [];
    const { data } = await _supabase
        .from('elections')
        .select('election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .order('election_tick', { ascending: false })
        .limit(1);
    const el = (data || [])[0];
    if (!el) return [];
    const completed = Number(el.election_tick) || 0;
    if (!completed || completed > tick || tick - completed > ELECTION_RECENCY_TICKS) return [];
    const ticksAgo = tick - completed;
    return [{
        title: 'Election completed',
        sub: ticksAgo === 0 ? 'Just now' : `${ticksAgo} tick${ticksAgo === 1 ? '' : 's'} ago`,
        href: 'elections.html',
        // Per-occurrence dismissal: dismissing one election's notice
        // does not silence the next election's. Tick is unique per
        // election in a given nation.
        dismissId: `election:${completed}`,
    }];
}

// Prompt every party to use the Form Coalition action when the most
// recent election is recent AND there's no government in place. Fires
// for every nation party (not just the largest) since anyone can now
// propose. Runs alongside checkRecentElection — election notice tells
// the player something happened, this tells them what to do next.
async function checkPostElectionFormation(nation, shard) {
    const tick = Number(shard?.current_tick) || 0;
    if (tick <= 0) return [];
    const [{ data: elRows }, { data: gfRows }] = await Promise.all([
        _supabase.from('elections')
            .select('election_tick')
            .eq('nation_id', nation.id)
            .eq('status', 'completed')
            .order('election_tick', { ascending: false })
            .limit(1),
        _supabase.from('government_formations')
            .select('id, status')
            .eq('nation_id', nation.id)
            .in('status', ['formed', 'active', 'caretaker'])
            .limit(1),
    ]);
    const el = (elRows || [])[0];
    if (!el) return [];
    const completed = Number(el.election_tick) || 0;
    if (!completed || completed > tick || tick - completed > ELECTION_RECENCY_TICKS) return [];
    if ((gfRows || []).length > 0) return []; // Government already in place.
    return [{
        title: 'Form Coalition',
        sub: "Use 'Form Coalition' to create a government.",
        href: 'politics.html',
        // Per-occurrence dismissal so a player who dismisses this
        // for the current vacancy still gets the prompt after the
        // next election creates a fresh vacancy.
        dismissId: `form_coalition:${completed}`,
    }];
}

async function checkCoalitionInvites(faction, nation) {
    // Active formations where this faction is in party_ids (invited)
    // and hasn't yet recorded a row in government_formation_support
    // (= no support/decline response). Proposer is treated as having
    // already responded.
    const { data: forms } = await _supabase
        .from('government_formations')
        .select('id, party_ids, proposed_by')
        .eq('nation_id', nation.id)
        .eq('status', 'active');
    const invited = (forms || []).filter(f =>
        (f.party_ids || []).includes(faction.id) && f.proposed_by !== faction.id
    );
    if (invited.length === 0) return [];

    const ids = invited.map(f => f.id);
    const { data: mySupports } = await _supabase
        .from('government_formation_support')
        .select('formation_id')
        .in('formation_id', ids)
        .eq('faction_id', faction.id);
    const responded = new Set((mySupports || []).map(r => r.formation_id));
    const pending = invited.filter(f => !responded.has(f.id));
    if (pending.length === 0) return [];
    return [{
        title: pending.length === 1
            ? 'Coalition invitation awaiting your response'
            : `${pending.length} coalition invitations awaiting your response`,
        sub: 'Government formation',
        href: 'government.html',
    }];
}

async function checkChatUnread(faction) {
    if (!faction?.id) return [];

    // Direct messages: any unread row where I'm the receiver.
    const dmP = _supabase
        .from('direct_messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', faction.id)
        .is('read_at', null);

    // Group chats I'm a member of: compare last_read_at vs latest message.
    const memP = _supabase
        .from('group_chat_members')
        .select('chat_id, last_read_at, group_chats!inner(id, chat_type)')
        .eq('faction_id', faction.id);

    const [{ count: dmCount }, { data: members }] = await Promise.all([dmP, memP]);

    const out = [];
    if ((dmCount || 0) > 0) {
        out.push({
            title: `${dmCount} new private message${dmCount === 1 ? '' : 's'}`,
            sub: 'Direct messages',
            href: '#open-messaging',
        });
    }

    // Fan out a count query per global/nation chat membership. Use
    // allSettled so one failed count doesn't drop the rest.
    let globalUnread = 0, nationUnread = 0;
    const perChat = await Promise.allSettled((members || []).map(async (m) => {
        const ch = Array.isArray(m.group_chats) ? m.group_chats[0] : m.group_chats;
        if (!ch) return null;
        const type = ch.chat_type;
        // Only surface global + nation chats in notifications; custom /
        // IPO chats stay scoped to the messaging panel.
        if (type !== 'global' && type !== 'nation') return null;
        let q = _supabase.from('group_chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', ch.id)
            .neq('sender_id', faction.id);
        if (m.last_read_at) q = q.gt('created_at', m.last_read_at);
        const { count } = await q;
        return { type, count: count || 0 };
    }));
    for (const r of perChat) {
        if (r.status !== 'fulfilled' || !r.value || !r.value.count) continue;
        if (r.value.type === 'global') globalUnread += r.value.count;
        else if (r.value.type === 'nation') nationUnread += r.value.count;
    }

    if (globalUnread > 0) {
        out.push({
            title: `${globalUnread} new message${globalUnread === 1 ? '' : 's'} in Global chat`,
            sub: 'Global chat',
            href: '#open-messaging-global',
        });
    }
    if (nationUnread > 0) {
        out.push({
            title: `${nationUnread} new message${nationUnread === 1 ? '' : 's'} in Nation chat`,
            sub: 'Nation chat',
            href: '#open-messaging-nation',
        });
    }
    return out;
}

async function checkTradeNegotiationMessages(faction, nation, isPM, isTradeMin) {
    if (!isPM && !isTradeMin) return [];

    // Active trade negotiations involving this nation, with at least
    // one message from the *other* nation since I (probably) last
    // looked. Phase-1 heuristic: surface the count of open negotiations
    // whose latest message came from the partner nation. Not perfect
    // (no per-faction read state on negotiation_messages), but it
    // matches the pattern the diplomacy badge already uses.
    const { data: negs } = await _supabase
        .from('trade_negotiations')
        .select('id')
        .eq('status', 'open')
        .or(`nation_a_id.eq.${nation.id},nation_b_id.eq.${nation.id}`);
    if (!negs || negs.length === 0) return [];

    const negIds = negs.map(n => n.id);
    const { data: latestMsgs } = await _supabase
        .from('negotiation_messages')
        .select('negotiation_id, sender_nation_id, created_at')
        .in('negotiation_id', negIds)
        .order('created_at', { ascending: false })
        .limit(200);

    // Bucket: latest message per negotiation.
    const latestByNeg = new Map();
    for (const m of (latestMsgs || [])) {
        if (!latestByNeg.has(m.negotiation_id)) latestByNeg.set(m.negotiation_id, m);
    }
    let count = 0;
    for (const n of negs) {
        const m = latestByNeg.get(n.id);
        if (!m) continue;
        if (m.sender_nation_id !== nation.id) count++;
    }
    if (count === 0) return [];
    return [{
        title: `${count} trade negotiation${count === 1 ? '' : 's'} with new messages`,
        sub: 'Trade ministry',
        href: 'diplomacy.html',
    }];
}

async function checkLawsuits(nation, isJusticeMin) {
    if (!isJusticeMin) return [];
    // Pending + reviewing lawsuits filed in this nation. Scoped to the
    // Justice Minister so it doesn't spam every player.
    const { data, error } = await _supabase
        .from('commercial_lawsuits')
        .select('id')
        .eq('nation_id', nation.id)
        .in('status', ['pending', 'reviewing']);
    if (error || !data || data.length === 0) return [];
    return [{
        title: `${data.length} open lawsuit${data.length === 1 ? '' : 's'} in your nation`,
        sub: 'Ministry of Justice',
        href: 'laws.html?view=lawsuits',
    }];
}

// ──────────────────────────────────────────────────────────────────────
//  Render
// ──────────────────────────────────────────────────────────────────────

function rowsFingerprint(rows) {
    return (rows || []).map(r => `${r.title || ''}|${r.sub || ''}`).join('||');
}

// Stable per-row dismissal key. Excludes the sub-line so a row whose
// sub changes each tick (e.g. "2 ticks ago" → "3 ticks ago") still
// matches its own dismissal record. Rows that recur across game
// occurrences (e.g. a new election fires the same-titled notification)
// MUST set `dismissId` to something unique-per-occurrence (typically
// the underlying record id or the trigger tick) so dismissing one
// occurrence doesn't permanently silence the type.
function dismissKeyFor(row) {
    const id = row.dismissId == null ? '' : String(row.dismissId);
    return `${row.title || ''}::${row.href || ''}::${id}`;
}

function getDismissedSet() {
    const factionId = _ctx?.faction?.id;
    if (!factionId) return new Set();
    try {
        const raw = localStorage.getItem('notif_dismissed_' + factionId);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
}

function saveDismissedSet(set) {
    const factionId = _ctx?.faction?.id;
    if (!factionId) return;
    try {
        localStorage.setItem('notif_dismissed_' + factionId, JSON.stringify([...set]));
    } catch { /* quota exceeded; ignore */ }
}

function renderRows(rows) {
    const list = document.getElementById('notif-list');
    const count = document.getElementById('notif-count');
    const dot = document.getElementById('notif-dot');
    if (!list) return;

    // Strip dismissed rows before counting — count + dot should reflect
    // what the user can actually see.
    const dismissed = getDismissedSet();
    const visible = rows.filter(r => !dismissed.has(dismissKeyFor(r)));

    if (count) count.textContent = String(visible.length);
    // Dot lights only when there are rows AND the set has changed
    // since the user last opened the dropdown.
    _lastRenderedFingerprint = rowsFingerprint(visible);
    // If the dropdown is currently open, the user is actively looking
    // at these rows — fold them into the acknowledged set so the dot
    // stays off (a) when the very first render lands after an early
    // bell-click and (b) when fresh rows arrive while the panel is
    // already open. Either way, the user has seen them.
    const drop = document.getElementById('notif-dropdown');
    if (drop && !drop.hidden) _acknowledgedFingerprint = _lastRenderedFingerprint;
    const hasUnseen = visible.length > 0 && _lastRenderedFingerprint !== _acknowledgedFingerprint;
    if (dot) dot.hidden = !hasUnseen;

    if (visible.length === 0) {
        list.innerHTML = '<div class="notif-empty">No notifications</div>';
        return;
    }
    list.innerHTML = visible.map(r => {
        const href = r.href || '#';
        const title = escapeHtml(r.title || '');
        const sub = escapeHtml(r.sub || '');
        const key = escapeHtml(dismissKeyFor(r));
        return `<div class="notif-row-wrap">
            <a class="notif-row" href="${escapeHtml(href)}" data-action="${escapeHtml(href)}">
                <span class="notif-row__title">${title}</span>
                <span class="notif-row__sub">${sub}</span>
            </a>
            <button type="button" class="notif-row__close" data-dismiss-key="${key}" title="Dismiss" aria-label="Dismiss notification">&times;</button>
        </div>`;
    }).join('');

    // Intercept the in-app actions (#open-messaging…) so they pop the
    // chat panel rather than navigating.
    list.querySelectorAll('.notif-row').forEach(a => {
        const href = a.getAttribute('data-action') || '';
        if (!href.startsWith('#')) return;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            handleInAppAction(href);
        });
    });

    // Wire the dismiss X on every row.
    list.querySelectorAll('.notif-row__close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const key = btn.getAttribute('data-dismiss-key');
            if (!key) return;
            const set = getDismissedSet();
            set.add(key);
            saveDismissedSet(set);
            // Re-render with the same source rows so the dismissed row
            // disappears immediately without a server roundtrip.
            renderRows(rows);
        });
    });
}

function handleInAppAction(_href) {
    closeDropdown();
    // Pop the chat panel. Per-tab deep-linking (global vs nation) is
    // best-effort — without a public messaging.js hook we just open the
    // panel and let the user pick the tab.
    const bubble = document.getElementById('msg-bubble');
    if (bubble) bubble.click();
}

// ──────────────────────────────────────────────────────────────────────
//  Refresh orchestrator
// ──────────────────────────────────────────────────────────────────────

// Corp-flavored: warn the player when any active executive's
// contract is within EXEC_EXPIRY_WARNING_TICKS of running out, so
// they can hit Renew before the corp tick processor flips the row
// to status='expired' and vacates the role.
const EXEC_EXPIRY_WARNING_TICKS = 3;
async function checkExecContractsExpiring(faction, shard) {
    if (!faction?.id || faction.faction_type !== 'corporation') return [];
    const tick = Number(shard?.current_tick) || 0;
    if (tick <= 0) return [];
    const { data, error } = await _supabase.from('corp_executives')
        .select('id, role, first_name, last_name, contract_end_tick')
        .eq('faction_id', faction.id)
        .eq('status', 'active');
    if (error || !data) return [];
    const rows = [];
    for (const exec of data) {
        const end = Number(exec.contract_end_tick) || 0;
        if (!end) continue;
        const remaining = end - tick;
        if (remaining > EXEC_EXPIRY_WARNING_TICKS || remaining <= 0) continue;
        const ticksLabel = remaining === 1 ? '1 tick' : `${remaining} ticks`;
        rows.push({
            title: `${exec.role} contract expiring`,
            sub: `${exec.first_name || ''} ${exec.last_name || ''} — ${ticksLabel} left. Renew or lose the role.`,
            href: 'actions.html',
            // Per-occurrence dismissal so dismissing one expiring
            // contract doesn't silence the warning for the next exec
            // (or the next time this exec's renewal cycle runs out).
            dismissId: `exec_expiring:${exec.id}:${end}`,
        });
    }
    return rows;
}

async function refreshNotifications() {
    if (_inflight || !_ctx) return;
    _inflight = true;
    try {
        const { faction, nation, shard } = _ctx;
        const isCorp = faction.faction_type === 'corporation';

        let probes;
        if (isCorp) {
            // Corp-flavored checks only. Party checks (bills, elections,
            // coalitions) are nonsensical for corps and would either
            // 4xx or always return [] — skip them.
            probes = [
                checkExecContractsExpiring(faction, shard),
            ];
        } else {
            // Recompute roles every refresh. Mid-session ministry shuffles
            // (cabinet reshuffle, snap election) need to flip gating in real
            // time; caching roles indefinitely would silently miss that.
            const { isPM, isTradeMin, isJusticeMin } = await detectRoles(faction, nation);
            probes = [
                checkBills(faction, nation),
                checkRecentElection(nation, shard),
                checkPostElectionFormation(nation, shard),
                checkCoalitionInvites(faction, nation),
                checkChatUnread(faction),
                checkTradeNegotiationMessages(faction, nation, isPM, isTradeMin),
                checkLawsuits(nation, isJusticeMin),
            ];
        }

        // allSettled so a single failing query doesn't drop every other
        // notification on the floor.
        const settled = await Promise.allSettled(probes);
        const rows = settled
            .filter(r => r.status === 'fulfilled' && Array.isArray(r.value))
            .flatMap(r => r.value);
        renderRows(rows);
    } catch (e) {
        console.warn('[notifications] refresh failed:', e?.message || e);
    } finally {
        _inflight = false;
    }
}

// ──────────────────────────────────────────────────────────────────────
//  Public init
// ──────────────────────────────────────────────────────────────────────

export async function initNotifications(ctx) {
    const wrap = document.querySelector('.notif-wrap');
    if (!ctx?.faction) {
        if (wrap) wrap.style.display = 'none';
        return;
    }
    // Party flow needs both faction + nation (every party-flavored
    // check runs against the nation row). Corp flow only needs the
    // faction — corp-flavored checks (exec contracts, future:
    // lawsuit responses, property events) key off faction.id alone.
    const isCorp = ctx.faction.faction_type === 'corporation';
    if (!isCorp && !ctx.nation) {
        if (wrap) wrap.style.display = 'none';
        return;
    }
    _ctx = ctx;

    injectStyles();
    wireBellInteractions();

    // First load — kick off immediately so the dot can light up.
    refreshNotifications();

    // Refresh on focus + interval.
    if (!window.__notif_focus_listener) {
        window.addEventListener('focus', () => refreshNotifications());
        window.__notif_focus_listener = true;
    }
    if (_refreshTimer) clearInterval(_refreshTimer);
    _refreshTimer = setInterval(refreshNotifications, REFRESH_MS);
}
