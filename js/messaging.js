// ══════════════════════════════════════════════════════════════════════
//  Messaging System — Floating bubble + panel
//  Injected on all pages via initMessaging()
// ══════════════════════════════════════════════════════════════════════

import { _supabase } from './supabase-client.js';
import { escapeHtml } from './utils.js';

let _msgFaction = null;
let _msgNation = null;
let _msgShard = null;
let _msgPanelOpen = false;
let _msgView = 'list';       // 'list' | 'thread'
let _msgActiveChat = null;   // { type: 'dm'|'group', id, name, ... }

// ── Inject CSS ──
function injectStyles() {
    if (document.getElementById('msg-styles')) return;
    const style = document.createElement('style');
    style.id = 'msg-styles';
    style.textContent = `
/* ── Floating bubble ── */
.msg-bubble {
    position: fixed; bottom: 20px; right: 20px; z-index: 9000;
    width: 48px; height: 48px; border-radius: 50%;
    background: var(--teal, #5aafa5); border: 2px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    transition: transform 0.15s, box-shadow 0.15s;
    font-size: 20px; color: #000; user-select: none;
}
.msg-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(0,0,0,0.5); }
.msg-bubble__badge {
    position: absolute; top: -4px; right: -4px;
    min-width: 18px; height: 18px; border-radius: 9px;
    background: #d9534f; color: #fff;
    font-family: var(--font-mono, monospace); font-size: 10px; font-weight: 700;
    display: none; align-items: center; justify-content: center;
    padding: 0 4px; line-height: 1;
}
.msg-bubble__badge.visible { display: flex; }

/* ── Panel ── */
.msg-panel {
    position: fixed; bottom: 20px; right: 20px; z-index: 9001;
    width: 340px; height: 500px; max-height: calc(100vh - 40px);
    background: var(--bg-2, #1a1a17); border: 1px solid var(--border-0, rgba(255,255,255,0.06));
    box-shadow: 0 12px 48px rgba(0,0,0,0.6);
    display: none; flex-direction: column; overflow: hidden;
    border-radius: 8px;
}
.msg-panel.open { display: flex; }

/* Panel header */
.msg-panel__header {
    padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;
    background: var(--bg-3, #252525); border-bottom: 1px solid var(--border-0, rgba(255,255,255,0.06));
    flex-shrink: 0;
}
.msg-panel__title {
    font-family: var(--font-mono, monospace); font-size: 13px; font-weight: 700;
    letter-spacing: 1px; color: var(--text-bright, #f0efe6); text-transform: uppercase;
}
.msg-panel__close {
    background: none; border: none; color: var(--text-dim, #4a4940);
    font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1;
}
.msg-panel__close:hover { color: var(--text-muted, #666); }

/* Panel actions bar */
.msg-panel__actions {
    padding: 8px 14px; display: flex; gap: 6px;
    border-bottom: 1px solid var(--border-0, rgba(255,255,255,0.06));
    flex-shrink: 0;
}
.msg-action-btn {
    flex: 1; padding: 6px 0; text-align: center;
    font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 700;
    letter-spacing: 0.5px; text-transform: uppercase;
    color: var(--text-dim, #4a4940); background: var(--bg-3, #252525);
    border: 1px solid var(--border-0, rgba(255,255,255,0.06));
    cursor: pointer; transition: all 0.1s;
}
.msg-action-btn:hover { color: var(--text-muted, #666); border-color: var(--border-1, rgba(255,255,255,0.08)); }

/* Scrollable content */
.msg-panel__body {
    flex: 1; overflow-y: auto;
}
.msg-panel__body::-webkit-scrollbar { width: 4px; }
.msg-panel__body::-webkit-scrollbar-track { background: transparent; }
.msg-panel__body::-webkit-scrollbar-thumb { background: var(--border-1, rgba(255,255,255,0.08)); }

/* Chat list section headers */
.msg-section-hdr {
    padding: 6px 14px;
    font-family: var(--font-mono, monospace); font-size: 8px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text-dim, #4a4940); background: var(--bg-3, #252525);
    border-bottom: 1px solid var(--border-0, rgba(255,255,255,0.06));
}

/* Chat list item */
.msg-chat-item {
    padding: 10px 14px; display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid var(--border-0, rgba(255,255,255,0.06));
    cursor: pointer; transition: background 0.1s;
}
.msg-chat-item:hover { background: var(--bg-hover, #282822); }
.msg-chat-item__avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--bg-3, #252525); border: 1px solid var(--border-0, rgba(255,255,255,0.06));
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono, monospace); font-size: 10px; font-weight: 700;
    color: var(--text-dim, #4a4940); flex-shrink: 0;
}
.msg-chat-item__info { flex: 1; min-width: 0; }
.msg-chat-item__name {
    font-size: 12px; font-weight: 600; color: var(--text-bright, #f0efe6);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.msg-chat-item__preview {
    font-size: 10px; color: var(--text-dim, #4a4940);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-top: 1px;
}
.msg-chat-item__badge {
    min-width: 18px; height: 18px; border-radius: 9px;
    background: var(--teal, #5aafa5); color: #000;
    font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px; flex-shrink: 0;
}

/* Thread view */
.msg-thread-header {
    padding: 8px 14px; display: flex; align-items: center; gap: 8px;
    border-bottom: 1px solid var(--border-0, rgba(255,255,255,0.06));
    flex-shrink: 0;
}
.msg-thread-back {
    background: none; border: none; color: var(--text-dim, #4a4940);
    font-size: 14px; cursor: pointer; padding: 2px 6px;
}
.msg-thread-back:hover { color: var(--text-muted, #666); }
.msg-thread-name {
    font-size: 12px; font-weight: 600; color: var(--text-bright, #f0efe6);
    flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Messages */
.msg-messages {
    flex: 1; overflow-y: auto; padding: 8px 14px;
    display: flex; flex-direction: column; gap: 6px;
}
.msg-messages::-webkit-scrollbar { width: 4px; }
.msg-messages::-webkit-scrollbar-track { background: transparent; }
.msg-messages::-webkit-scrollbar-thumb { background: var(--border-1, rgba(255,255,255,0.08)); }

.msg-msg {
    max-width: 85%; padding: 6px 10px; border-radius: 6px;
    font-size: 12px; line-height: 1.4; word-wrap: break-word;
}
.msg-msg--sent {
    align-self: flex-end;
    background: var(--teal-faint, rgba(90,175,165,0.08));
    border: 1px solid var(--teal-border, rgba(90,175,165,0.18));
    color: var(--text-bright, #f0efe6);
}
.msg-msg--received {
    align-self: flex-start;
    background: var(--bg-3, #252525);
    border: 1px solid var(--border-0, rgba(255,255,255,0.06));
    color: var(--text-primary, #c4c2b8);
}
.msg-msg--system {
    align-self: center; text-align: center;
    font-family: var(--font-mono, monospace); font-size: 9px;
    color: var(--text-dim, #4a4940); padding: 4px 8px;
}
.msg-msg__sender {
    font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 700;
    margin-bottom: 2px;
}
.msg-msg__time {
    font-family: var(--font-mono, monospace); font-size: 8px;
    color: var(--text-dim, #4a4940); margin-top: 2px; text-align: right;
}

/* Input bar */
.msg-input-bar {
    padding: 8px 14px; display: flex; gap: 6px;
    border-top: 1px solid var(--border-0, rgba(255,255,255,0.06));
    background: var(--bg-3, #252525); flex-shrink: 0;
}
.msg-input {
    flex: 1; padding: 6px 10px; border-radius: 4px;
    background: var(--bg-4, #24241f); border: 1px solid var(--border-0, rgba(255,255,255,0.06));
    color: var(--text-bright, #f0efe6); font-family: var(--font-ui, sans-serif);
    font-size: 12px; outline: none; resize: none;
}
.msg-input::placeholder { color: var(--text-dim, #4a4940); }
.msg-input:focus { border-color: var(--teal-border, rgba(90,175,165,0.18)); }
.msg-send-btn {
    padding: 6px 14px; font-family: var(--font-mono, monospace);
    font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
    color: #000; background: var(--teal, #5aafa5);
    border: none; cursor: pointer; border-radius: 4px;
}
.msg-send-btn:hover { background: #6bc0b6; }
.msg-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Empty state */
.msg-empty {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 20px;
}
.msg-empty__text {
    font-family: var(--font-mono, monospace); font-size: 10px;
    color: var(--text-dim, #4a4940); text-align: center; line-height: 1.8;
}

/* ── Mobile ── */
@media (max-width: 480px) {
    .msg-panel { width: calc(100vw - 20px); right: 10px; bottom: 10px; height: 60vh; }
    .msg-bubble { bottom: 12px; right: 12px; width: 42px; height: 42px; font-size: 18px; }
}
    `;
    document.head.appendChild(style);
}

// ── Inject HTML ──
function injectHTML() {
    if (document.getElementById('msg-bubble')) return;

    // Bubble
    const bubble = document.createElement('div');
    bubble.id = 'msg-bubble';
    bubble.className = 'msg-bubble';
    bubble.innerHTML = `💬<div class="msg-bubble__badge" id="msg-badge">0</div>`;
    bubble.addEventListener('click', togglePanel);
    document.body.appendChild(bubble);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'msg-panel';
    panel.className = 'msg-panel';
    panel.innerHTML = `
        <div class="msg-panel__header">
            <span class="msg-panel__title">Messages</span>
            <button class="msg-panel__close" id="msg-close">&times;</button>
        </div>
        <div class="msg-panel__actions" id="msg-actions">
            <button class="msg-action-btn" id="msg-new-dm">+ New Message</button>
            <button class="msg-action-btn" id="msg-new-group">+ Group Chat</button>
        </div>
        <div class="msg-panel__body" id="msg-body">
            <div class="msg-empty">
                <div class="msg-empty__text">Loading messages...</div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    // Event listeners
    document.getElementById('msg-close').addEventListener('click', togglePanel);
    document.getElementById('msg-new-dm').addEventListener('click', () => openNewDM());
    document.getElementById('msg-new-group').addEventListener('click', () => openNewGroup());
}

// ── Toggle panel ──
function togglePanel() {
    _msgPanelOpen = !_msgPanelOpen;
    const panel = document.getElementById('msg-panel');
    const bubble = document.getElementById('msg-bubble');
    if (!panel || !bubble) return;

    if (_msgPanelOpen) {
        panel.classList.add('open');
        bubble.style.display = 'none';
        _msgView = 'list';
        renderChatList();
    } else {
        panel.classList.remove('open');
        bubble.style.display = '';
    }
}

// ── Load and render chat list ──
let _dmConversations = [];  // [{ otherFaction, lastMessage, unreadCount }]
let _groupChats = [];       // [{ chat, lastMessage, unreadCount }]

async function renderChatList() {
    const body = document.getElementById('msg-body');
    const actions = document.getElementById('msg-actions');
    if (actions) actions.style.display = '';
    _msgView = 'list';

    if (!_msgFaction) {
        body.innerHTML = `<div class="msg-empty"><div class="msg-empty__text">No faction selected.</div></div>`;
        return;
    }

    body.innerHTML = `<div class="msg-empty"><div class="msg-empty__text" style="color:var(--text-dim);">Loading...</div></div>`;

    try {
        await Promise.all([loadDMConversations(), loadGroupChats()]);
    } catch (e) {
        console.warn('[Messaging] Failed to load chats:', e);
    }

    let html = '';

    // ── Group Chats (IPO + Nation + Custom) ──
    const ipoChats = _groupChats.filter(g => g.chat.chat_type === 'ipo');
    const nationChats = _groupChats.filter(g => g.chat.chat_type === 'nation');
    const customChats = _groupChats.filter(g => g.chat.chat_type === 'custom');

    if (nationChats.length > 0) {
        html += `<div class="msg-section-hdr">Nation Chat</div>`;
        html += nationChats.map(g => renderChatItem(g, 'group')).join('');
    }

    if (ipoChats.length > 0) {
        html += `<div class="msg-section-hdr">Organisation Chats</div>`;
        html += ipoChats.map(g => renderChatItem(g, 'group')).join('');
    }

    if (customChats.length > 0) {
        html += `<div class="msg-section-hdr">Group Chats</div>`;
        html += customChats.map(g => renderChatItem(g, 'group')).join('');
    }

    // ── Direct Messages ──
    if (_dmConversations.length > 0) {
        html += `<div class="msg-section-hdr">Direct Messages</div>`;
        html += _dmConversations.map(dm => renderDMItem(dm)).join('');
    }

    // ── Nation Parties (quick-start DM list) ──
    if (_msgNation) {
        try {
            const { data: parties } = await _supabase
                .from('factions')
                .select('id, faction_name, abbreviation, party_color')
                .eq('nation_id', _msgNation.id)
                .eq('faction_type', 'party')
                .neq('id', _msgFaction.id)
                .order('faction_name');

            if (parties && parties.length > 0) {
                // Filter out parties we already have a DM with
                const existingDmIds = new Set(_dmConversations.map(d => d.otherFaction.id));
                const newParties = parties.filter(p => !existingDmIds.has(p.id));
                if (newParties.length > 0) {
                    html += `<div class="msg-section-hdr">Parties in Your Nation</div>`;
                    html += newParties.map(p => {
                        const abbr = (p.abbreviation || p.faction_name || '?').slice(0, 3).toUpperCase();
                        const color = p.party_color || '#666';
                        return `<div class="msg-chat-item" data-msg-action="start-dm" data-faction-id="${p.id}">
                            <div class="msg-chat-item__avatar" style="color:${escapeHtml(color)};border-color:${escapeHtml(color)};">${escapeHtml(abbr)}</div>
                            <div class="msg-chat-item__info">
                                <div class="msg-chat-item__name">${escapeHtml(p.faction_name)}</div>
                                <div class="msg-chat-item__preview">Start a conversation</div>
                            </div>
                        </div>`;
                    }).join('');
                }
            }
        } catch (e) {
            console.warn('[Messaging] Failed to load nation parties:', e);
        }
    }

    if (!html) {
        html = `<div class="msg-empty"><div class="msg-empty__text">No messages yet.<br>Start a conversation using<br>the buttons above.</div></div>`;
    }

    body.innerHTML = html;

    // Attach click handlers
    body.querySelectorAll('[data-msg-action="open-dm"]').forEach(el => {
        el.addEventListener('click', () => {
            const fid = el.dataset.factionId;
            const dm = _dmConversations.find(d => d.otherFaction.id === fid);
            if (dm) openThread({ type: 'dm', id: fid, name: dm.otherFaction.faction_name, faction: dm.otherFaction });
        });
    });
    body.querySelectorAll('[data-msg-action="open-group"]').forEach(el => {
        el.addEventListener('click', () => {
            const cid = el.dataset.chatId;
            const g = _groupChats.find(gc => gc.chat.id === cid);
            if (g) openThread({ type: 'group', id: cid, name: g.chat.name });
        });
    });
    body.querySelectorAll('[data-msg-action="start-dm"]').forEach(el => {
        el.addEventListener('click', () => {
            const fid = el.dataset.factionId;
            // Open thread directly — Phase 4 will handle sending the first message
            const nameEl = el.querySelector('.msg-chat-item__name');
            openThread({ type: 'dm', id: fid, name: nameEl?.textContent || 'Unknown' });
        });
    });
}

async function loadDMConversations() {
    const fid = _msgFaction.id;

    // Load all DMs involving this faction
    const { data: dms, error } = await _supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, message_text, read_at, created_at, sent_at_tick')
        .or(`sender_id.eq.${fid},receiver_id.eq.${fid}`)
        .order('created_at', { ascending: false })
        .limit(200);

    if (error || !dms) { _dmConversations = []; return; }

    // Group by conversation partner
    const convMap = {};
    for (const dm of dms) {
        const otherId = dm.sender_id === fid ? dm.receiver_id : dm.sender_id;
        if (!convMap[otherId]) {
            convMap[otherId] = { lastMessage: dm, unreadCount: 0 };
        }
        if (dm.receiver_id === fid && !dm.read_at) {
            convMap[otherId].unreadCount++;
        }
    }

    // Load faction info for each conversation partner
    const otherIds = Object.keys(convMap);
    if (otherIds.length === 0) { _dmConversations = []; return; }

    const { data: factions } = await _supabase
        .from('factions')
        .select('id, faction_name, abbreviation, party_color, faction_type')
        .in('id', otherIds);

    const factionMap = {};
    for (const f of (factions || [])) factionMap[f.id] = f;

    _dmConversations = otherIds
        .filter(id => factionMap[id])
        .map(id => ({
            otherFaction: factionMap[id],
            lastMessage: convMap[id].lastMessage,
            unreadCount: convMap[id].unreadCount,
        }))
        .sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));
}

async function loadGroupChats() {
    const fid = _msgFaction.id;

    // Load group chats this faction is a member of
    const { data: memberships, error: memErr } = await _supabase
        .from('group_chat_members')
        .select('chat_id, last_read_at')
        .eq('faction_id', fid);

    if (memErr || !memberships || memberships.length === 0) { _groupChats = []; return; }

    const chatIds = memberships.map(m => m.chat_id);
    const lastReadMap = {};
    for (const m of memberships) lastReadMap[m.chat_id] = m.last_read_at;

    // Load chat details
    const { data: chats } = await _supabase
        .from('group_chats')
        .select('id, name, chat_type, ipo_org_id, nation_id')
        .in('id', chatIds);

    if (!chats) { _groupChats = []; return; }

    // Load latest message per chat
    const { data: latestMsgs } = await _supabase
        .from('group_chat_messages')
        .select('chat_id, message_text, sender_id, created_at')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false })
        .limit(chatIds.length * 1); // approximate — gets latest across all, we'll pick per chat

    const latestByChat = {};
    for (const msg of (latestMsgs || [])) {
        if (!latestByChat[msg.chat_id]) latestByChat[msg.chat_id] = msg;
    }

    // Count unread per chat
    _groupChats = chats.map(chat => {
        const lastRead = lastReadMap[chat.id];
        const lastMsg = latestByChat[chat.id];
        // Unread = messages after last_read_at (approximate — real count in Phase 8)
        const hasUnread = lastMsg && lastRead && new Date(lastMsg.created_at) > new Date(lastRead);
        return {
            chat,
            lastMessage: lastMsg || null,
            unreadCount: hasUnread ? 1 : 0, // placeholder count, Phase 8 will make accurate
        };
    }).sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.created_at) : new Date(0);
        const bTime = b.lastMessage ? new Date(b.lastMessage.created_at) : new Date(0);
        return bTime - aTime;
    });
}

function renderChatItem(g, type) {
    const chat = g.chat;
    const preview = g.lastMessage ? g.lastMessage.message_text.slice(0, 50) : 'No messages yet';
    const abbr = chat.name.slice(0, 2).toUpperCase();
    const typeLabel = chat.chat_type === 'ipo' ? 'Org' : chat.chat_type === 'nation' ? 'Nation' : 'Group';
    const badgeHtml = g.unreadCount > 0
        ? `<div class="msg-chat-item__badge">${g.unreadCount}</div>` : '';

    return `<div class="msg-chat-item" data-msg-action="open-group" data-chat-id="${chat.id}">
        <div class="msg-chat-item__avatar">${escapeHtml(abbr)}</div>
        <div class="msg-chat-item__info">
            <div class="msg-chat-item__name">${escapeHtml(chat.name)}</div>
            <div class="msg-chat-item__preview">${escapeHtml(preview)}</div>
        </div>
        ${badgeHtml}
    </div>`;
}

function renderDMItem(dm) {
    const f = dm.otherFaction;
    const abbr = (f.abbreviation || f.faction_name || '?').slice(0, 3).toUpperCase();
    const color = f.party_color || '#666';
    const preview = dm.lastMessage ? dm.lastMessage.message_text.slice(0, 50) : '';
    const badgeHtml = dm.unreadCount > 0
        ? `<div class="msg-chat-item__badge">${dm.unreadCount}</div>` : '';

    return `<div class="msg-chat-item" data-msg-action="open-dm" data-faction-id="${f.id}">
        <div class="msg-chat-item__avatar" style="color:${escapeHtml(color)};border-color:${escapeHtml(color)};">${escapeHtml(abbr)}</div>
        <div class="msg-chat-item__info">
            <div class="msg-chat-item__name">${escapeHtml(f.faction_name)}</div>
            <div class="msg-chat-item__preview">${escapeHtml(preview)}</div>
        </div>
        ${badgeHtml}
    </div>`;
}

// ── Open thread (placeholder — Phase 4 will implement full thread view) ──
function openThread(chatInfo) {
    _msgActiveChat = chatInfo;
    _msgView = 'thread';
    const body = document.getElementById('msg-body');
    const actions = document.getElementById('msg-actions');
    if (actions) actions.style.display = 'none';

    const headerTitle = document.querySelector('.msg-panel__title');
    if (headerTitle) headerTitle.textContent = chatInfo.name || 'Chat';

    body.innerHTML = `
        <div class="msg-thread-header">
            <button class="msg-thread-back" id="msg-back">&#8592;</button>
            <span class="msg-thread-name">${escapeHtml(chatInfo.name || 'Chat')}</span>
        </div>
        <div class="msg-messages" id="msg-messages">
            <div class="msg-empty"><div class="msg-empty__text">No messages yet.</div></div>
        </div>
        <div class="msg-input-bar">
            <input type="text" class="msg-input" id="msg-input" placeholder="Type a message..." maxlength="2000" />
            <button class="msg-send-btn" id="msg-send" disabled>Send</button>
        </div>
    `;

    document.getElementById('msg-back').addEventListener('click', () => {
        const headerTitle2 = document.querySelector('.msg-panel__title');
        if (headerTitle2) headerTitle2.textContent = 'Messages';
        _msgActiveChat = null;
        renderChatList();
    });

    // Enable send button when input has text
    const input = document.getElementById('msg-input');
    const sendBtn = document.getElementById('msg-send');
    input.addEventListener('input', () => {
        sendBtn.disabled = !input.value.trim();
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && input.value.trim()) {
            e.preventDefault();
            // Phase 4 will handle actual sending
        }
    });
    input.focus();
}

// ── Placeholder functions for Phase 5/6 ──
function openNewDM() {
    // Phase 5 will implement
}

function openNewGroup() {
    // Phase 6 will implement
}

// ── Public init ──
export function initMessaging(faction, nation, shard) {
    _msgFaction = faction;
    _msgNation = nation;
    _msgShard = shard;

    // Don't inject on login/setup pages
    if (!faction || !faction.id) return;

    injectStyles();
    injectHTML();
}
