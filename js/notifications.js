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
let _roles = null;        // { isPM, isTradeMin, isJusticeMin }
let _refreshTimer = null;
let _styleInjected = false;
let _wired = false;
let _inflight = false;

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
    width: 360px; max-height: 480px;
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
.notif-row {
    display: block; padding: 10px 14px;
    border-bottom: 1px solid var(--border-mid, rgba(255,255,255,0.06));
    color: inherit; text-decoration: none;
    cursor: pointer;
    transition: background 0.1s;
}
.notif-row:hover { background: rgba(200,166,78,0.08); }
.notif-row:last-child { border-bottom: 0; }
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

function wireBellInteractions() {
    if (_wired) return;
    const bell = document.getElementById('notif-bell');
    const drop = document.getElementById('notif-dropdown');
    if (!bell || !drop) return;

    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !drop.hidden;
        if (isOpen) {
            drop.hidden = true;
            bell.setAttribute('aria-expanded', 'false');
        } else {
            drop.hidden = false;
            bell.setAttribute('aria-expanded', 'true');
            // Refresh on open so the user sees fresh data.
            refreshNotifications();
        }
    });
    document.addEventListener('click', (e) => {
        if (drop.hidden) return;
        if (drop.contains(e.target) || bell.contains(e.target)) return;
        drop.hidden = true;
        bell.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !drop.hidden) {
            drop.hidden = true;
            bell.setAttribute('aria-expanded', 'false');
        }
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
        .select('ministry_assignments, party_ids, status, formed_at')
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
        .select('id, status, bill_name, bill_support(faction_id)')
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
    const { data } = await _supabase
        .from('elections')
        .select('id, election_tick, status')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .order('election_tick', { ascending: false })
        .limit(1);
    const el = (data || [])[0];
    if (!el) return [];
    const completed = Number(el.election_tick) || 0;
    if (!completed || tick - completed > ELECTION_RECENCY_TICKS) return [];
    const ticksAgo = Math.max(0, tick - completed);
    return [{
        title: 'Election completed',
        sub: ticksAgo === 0 ? 'Just now' : `${ticksAgo} tick${ticksAgo === 1 ? '' : 's'} ago`,
        href: 'elections.html',
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

async function checkChatUnread(faction, nation) {
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
        .select('chat_id, last_read_at, group_chats!inner(id, chat_type, name, nation_id)')
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

    // For each group chat, check if there's any message newer than last_read_at.
    // Fan-out is small (a handful of group memberships) so individual
    // count queries are fine. Aggregate global vs nation chat unread.
    let globalUnread = 0, nationUnread = 0;
    await Promise.all((members || []).map(async (m) => {
        const ch = Array.isArray(m.group_chats) ? m.group_chats[0] : m.group_chats;
        if (!ch) return;
        const type = ch.chat_type;
        // We only surface global + nation chats in notifications. Custom
        // group chats / IPO chats stay scoped to the messaging panel.
        if (type !== 'global' && type !== 'nation') return;
        let q = _supabase.from('group_chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', ch.id)
            .neq('sender_id', faction.id);
        if (m.last_read_at) q = q.gt('created_at', m.last_read_at);
        const { count } = await q;
        if (!count) return;
        if (type === 'global') globalUnread += count;
        else if (type === 'nation') nationUnread += count;
    }));

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
        .select('id, nation_a_id, nation_b_id, status, opened_at_tick')
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
        .select('id, status, filed_at_tick')
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

function renderRows(rows) {
    const list = document.getElementById('notif-list');
    const count = document.getElementById('notif-count');
    const dot = document.getElementById('notif-dot');
    if (!list) return;

    if (count) count.textContent = String(rows.length);
    if (dot) dot.hidden = rows.length === 0;

    if (rows.length === 0) {
        list.innerHTML = '<div class="notif-empty">No notifications</div>';
        return;
    }
    list.innerHTML = rows.map(r => {
        const href = r.href || '#';
        const title = escapeHtml(r.title || '');
        const sub = escapeHtml(r.sub || '');
        return `<a class="notif-row" href="${escapeHtml(href)}" data-action="${escapeHtml(href)}">
            <span class="notif-row__title">${title}</span>
            <span class="notif-row__sub">${sub}</span>
        </a>`;
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
}

function handleInAppAction(href) {
    const drop = document.getElementById('notif-dropdown');
    const bell = document.getElementById('notif-bell');
    if (drop) drop.hidden = true;
    if (bell) bell.setAttribute('aria-expanded', 'false');

    // Pop the chat bubble. Specific deep-links (global vs nation) are
    // best-effort: if messaging.js exposes a hook we use it, otherwise
    // we click the floating bubble.
    const bubble = document.getElementById('msg-bubble');
    if (bubble) bubble.click();
}

// ──────────────────────────────────────────────────────────────────────
//  Refresh orchestrator
// ──────────────────────────────────────────────────────────────────────

async function refreshNotifications() {
    if (_inflight || !_ctx) return;
    _inflight = true;
    try {
        const { faction, nation, shard } = _ctx;
        if (!_roles) _roles = await detectRoles(faction, nation);
        const { isPM, isTradeMin, isJusticeMin } = _roles;

        const results = await Promise.all([
            checkBills(faction, nation),
            checkRecentElection(nation, shard),
            checkCoalitionInvites(faction, nation),
            checkChatUnread(faction, nation),
            checkTradeNegotiationMessages(faction, nation, isPM, isTradeMin),
            checkLawsuits(nation, isJusticeMin),
        ]);

        const rows = results.flat().filter(Boolean);
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
    if (!ctx?.faction || !ctx?.nation) return;
    _ctx = ctx;
    _roles = null;

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
