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

// ── Open thread view ──
let _msgSending = false;
let _threadFactionCache = {}; // { factionId: { faction_name, abbreviation, party_color } }

async function openThread(chatInfo) {
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
            <div class="msg-empty"><div class="msg-empty__text" style="color:var(--text-dim);">Loading...</div></div>
        </div>
        <div class="msg-input-bar">
            <input type="text" class="msg-input" id="msg-input" placeholder="Type a message..." maxlength="2000" />
            <button class="msg-send-btn" id="msg-send" disabled>Send</button>
        </div>
    `;

    // Back button
    document.getElementById('msg-back').addEventListener('click', () => {
        if (headerTitle) headerTitle.textContent = 'Messages';
        _msgActiveChat = null;
        renderChatList();
    });

    // Input handlers
    const input = document.getElementById('msg-input');
    const sendBtn = document.getElementById('msg-send');
    input.addEventListener('input', () => {
        sendBtn.disabled = !input.value.trim() || _msgSending;
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && input.value.trim() && !_msgSending) {
            e.preventDefault();
            sendMessage();
        }
    });
    sendBtn.addEventListener('click', () => {
        if (input.value.trim() && !_msgSending) sendMessage();
    });

    // Load messages
    await loadAndRenderMessages();
    input.focus();
}

async function loadAndRenderMessages() {
    const container = document.getElementById('msg-messages');
    if (!container || !_msgActiveChat) return;

    const chat = _msgActiveChat;
    let messages = [];

    try {
        if (chat.type === 'dm') {
            const { data, error } = await _supabase
                .from('direct_messages')
                .select('id, sender_id, receiver_id, message_text, created_at, sent_at_tick, read_at')
                .or(`and(sender_id.eq.${_msgFaction.id},receiver_id.eq.${chat.id}),and(sender_id.eq.${chat.id},receiver_id.eq.${_msgFaction.id})`)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) throw error;
            messages = (data || []).map(m => ({
                id: m.id,
                senderId: m.sender_id,
                text: m.message_text,
                createdAt: m.created_at,
                tick: m.sent_at_tick,
                isMine: m.sender_id === _msgFaction.id,
                isSystem: false,
            }));

            // Mark unread DMs as read
            const unreadIds = (data || [])
                .filter(m => m.receiver_id === _msgFaction.id && !m.read_at)
                .map(m => m.id);
            if (unreadIds.length > 0) {
                _supabase.from('direct_messages')
                    .update({ read_at: new Date().toISOString() })
                    .in('id', unreadIds)
                    .then(() => {}); // fire and forget
            }

        } else if (chat.type === 'group') {
            const { data, error } = await _supabase
                .from('group_chat_messages')
                .select('id, sender_id, is_system, message_text, created_at, sent_at_tick')
                .eq('chat_id', chat.id)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) throw error;

            // Collect unique sender IDs for name lookup
            const senderIds = [...new Set((data || []).map(m => m.sender_id).filter(Boolean))];
            await loadFactionNames(senderIds);

            messages = (data || []).map(m => ({
                id: m.id,
                senderId: m.sender_id,
                text: m.message_text,
                createdAt: m.created_at,
                tick: m.sent_at_tick,
                isMine: m.sender_id === _msgFaction.id,
                isSystem: m.is_system,
            }));

            // Update last_read_at for this member
            _supabase.from('group_chat_members')
                .update({ last_read_at: new Date().toISOString() })
                .eq('chat_id', chat.id)
                .eq('faction_id', _msgFaction.id)
                .then(() => {}); // fire and forget
        }
    } catch (e) {
        console.warn('[Messaging] Failed to load messages:', e);
        container.innerHTML = `<div class="msg-empty"><div class="msg-empty__text">Failed to load messages.</div></div>`;
        return;
    }

    if (messages.length === 0) {
        container.innerHTML = `<div class="msg-empty"><div class="msg-empty__text">No messages yet.<br>Send the first message!</div></div>`;
        return;
    }

    container.innerHTML = messages.map(m => renderMessage(m)).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function renderMessage(msg) {
    if (msg.isSystem) {
        return `<div class="msg-msg msg-msg--system">${escapeHtml(msg.text)}</div>`;
    }

    const cls = msg.isMine ? 'msg-msg msg-msg--sent' : 'msg-msg msg-msg--received';
    const senderName = msg.isMine ? '' : getSenderName(msg.senderId);
    const timeStr = formatMsgTime(msg.createdAt);

    let senderHtml = '';
    if (!msg.isMine && _msgActiveChat?.type === 'group' && senderName) {
        const color = _threadFactionCache[msg.senderId]?.party_color || '#888';
        senderHtml = `<div class="msg-msg__sender" style="color:${escapeHtml(color)}">${escapeHtml(senderName)}</div>`;
    }

    return `<div class="${cls}">
        ${senderHtml}
        <div>${escapeHtml(msg.text)}</div>
        <div class="msg-msg__time">${timeStr}</div>
    </div>`;
}

function getSenderName(factionId) {
    if (!factionId) return 'System';
    const cached = _threadFactionCache[factionId];
    if (cached) return cached.abbreviation || cached.faction_name || '?';
    return '...';
}

async function loadFactionNames(factionIds) {
    const toLoad = factionIds.filter(id => !_threadFactionCache[id]);
    if (toLoad.length === 0) return;

    const { data } = await _supabase
        .from('factions')
        .select('id, faction_name, abbreviation, party_color')
        .in('id', toLoad);

    for (const f of (data || [])) {
        _threadFactionCache[f.id] = f;
    }
}

function formatMsgTime(isoStr) {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'now';
        if (diffMin < 60) return diffMin + 'm ago';
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return diffHr + 'h ago';
        const diffDays = Math.floor(diffHr / 24);
        if (diffDays < 7) return diffDays + 'd ago';
        return d.toLocaleDateString();
    } catch (_) { return ''; }
}

// ── Send message ──
async function sendMessage() {
    const input = document.getElementById('msg-input');
    const sendBtn = document.getElementById('msg-send');
    const chat = _msgActiveChat;
    if (!input || !chat || !_msgFaction) return;

    const text = input.value.trim();
    if (!text) return;

    _msgSending = true;
    if (sendBtn) sendBtn.disabled = true;
    input.value = '';

    try {
        const tick = _msgShard?.current_tick || null;

        if (chat.type === 'dm') {
            const { error } = await _supabase.from('direct_messages').insert({
                sender_id: _msgFaction.id,
                receiver_id: chat.id,
                message_text: text,
                sent_at_tick: tick,
            });
            if (error) throw error;

        } else if (chat.type === 'group') {
            const { error } = await _supabase.from('group_chat_messages').insert({
                chat_id: chat.id,
                sender_id: _msgFaction.id,
                is_system: false,
                message_text: text,
                sent_at_tick: tick,
            });
            if (error) throw error;
        }

        // Optimistic render: append the message immediately
        const container = document.getElementById('msg-messages');
        if (container) {
            // Clear "no messages" empty state if present
            const empty = container.querySelector('.msg-empty');
            if (empty) empty.remove();

            const msgHtml = renderMessage({
                id: 'temp-' + Date.now(),
                senderId: _msgFaction.id,
                text,
                createdAt: new Date().toISOString(),
                tick,
                isMine: true,
                isSystem: false,
            });
            container.insertAdjacentHTML('beforeend', msgHtml);
            container.scrollTop = container.scrollHeight;
        }

    } catch (err) {
        console.error('[Messaging] Send failed:', err);
        // Put the text back so the user doesn't lose it
        input.value = text;
        alert('Failed to send message: ' + (err.message || 'Unknown error'));
    } finally {
        _msgSending = false;
        if (sendBtn) sendBtn.disabled = !input.value.trim();
        input.focus();
    }
}

// ── New DM: search any party in the game ──
let _searchResults = [];
let _searchTimeout = null;

function openNewDM() {
    _msgView = 'new-dm';
    const body = document.getElementById('msg-body');
    const actions = document.getElementById('msg-actions');
    if (actions) actions.style.display = 'none';

    const headerTitle = document.querySelector('.msg-panel__title');
    if (headerTitle) headerTitle.textContent = 'New Message';

    body.innerHTML = `
        <div class="msg-thread-header">
            <button class="msg-thread-back" id="msg-back">&#8592;</button>
            <span class="msg-thread-name">Select a party to message</span>
        </div>
        <div style="padding:8px 14px;border-bottom:1px solid var(--border-0, rgba(255,255,255,0.06));">
            <input type="text" class="msg-input" id="msg-search" placeholder="Search by name or nation..." style="width:100%;" />
        </div>
        <div class="msg-panel__body" id="msg-search-results" style="flex:1;overflow-y:auto;">
            <div class="msg-empty"><div class="msg-empty__text">Type to search all parties...</div></div>
        </div>
    `;

    document.getElementById('msg-back').addEventListener('click', () => {
        if (headerTitle) headerTitle.textContent = 'Messages';
        renderChatList();
    });

    const searchInput = document.getElementById('msg-search');
    searchInput.addEventListener('input', () => {
        clearTimeout(_searchTimeout);
        _searchTimeout = setTimeout(() => searchParties(searchInput.value.trim()), 250);
    });
    searchInput.focus();
}

async function searchParties(query) {
    const container = document.getElementById('msg-search-results');
    if (!container) return;

    if (!query || query.length < 1) {
        // Show all parties in our nation as default
        try {
            const { data } = await _supabase
                .from('factions')
                .select('id, faction_name, abbreviation, party_color, nation, faction_type')
                .eq('nation_id', _msgNation?.id)
                .eq('faction_type', 'party')
                .neq('id', _msgFaction.id)
                .order('faction_name')
                .limit(20);
            _searchResults = data || [];
        } catch (_) { _searchResults = []; }
    } else {
        // Search across all nations
        try {
            const { data } = await _supabase
                .from('factions')
                .select('id, faction_name, abbreviation, party_color, nation, faction_type')
                .neq('id', _msgFaction.id)
                .or(`faction_name.ilike.%${query}%,abbreviation.ilike.%${query}%,nation.ilike.%${query}%`)
                .eq('faction_type', 'party')
                .not('nation_id', 'is', null)
                .order('faction_name')
                .limit(20);
            _searchResults = data || [];
        } catch (_) { _searchResults = []; }
    }

    if (_searchResults.length === 0) {
        container.innerHTML = `<div class="msg-empty"><div class="msg-empty__text">No parties found.</div></div>`;
        return;
    }

    container.innerHTML = _searchResults.map(p => {
        const abbr = (p.abbreviation || p.faction_name || '?').slice(0, 3).toUpperCase();
        const color = p.party_color || '#666';
        const nationLabel = p.nation || '';
        return `<div class="msg-chat-item" data-msg-action="pick-dm" data-faction-id="${p.id}">
            <div class="msg-chat-item__avatar" style="color:${escapeHtml(color)};border-color:${escapeHtml(color)};">${escapeHtml(abbr)}</div>
            <div class="msg-chat-item__info">
                <div class="msg-chat-item__name">${escapeHtml(p.faction_name)}</div>
                <div class="msg-chat-item__preview">${escapeHtml(nationLabel)}</div>
            </div>
        </div>`;
    }).join('');

    container.querySelectorAll('[data-msg-action="pick-dm"]').forEach(el => {
        el.addEventListener('click', () => {
            const fid = el.dataset.factionId;
            const party = _searchResults.find(p => p.id === fid);
            if (party) openThread({ type: 'dm', id: fid, name: party.faction_name, faction: party });
        });
    });
}

// ── New Group Chat: multi-select parties ──
let _groupSelectIds = new Set();

function openNewGroup() {
    _msgView = 'new-group';
    _groupSelectIds = new Set();
    const body = document.getElementById('msg-body');
    const actions = document.getElementById('msg-actions');
    if (actions) actions.style.display = 'none';

    const headerTitle = document.querySelector('.msg-panel__title');
    if (headerTitle) headerTitle.textContent = 'New Group Chat';

    body.innerHTML = `
        <div class="msg-thread-header">
            <button class="msg-thread-back" id="msg-back">&#8592;</button>
            <span class="msg-thread-name">Select members</span>
        </div>
        <div style="padding:8px 14px;border-bottom:1px solid var(--border-0, rgba(255,255,255,0.06));">
            <input type="text" class="msg-input" id="msg-group-name" placeholder="Group chat name..." maxlength="100" style="width:100%;margin-bottom:6px;" />
            <input type="text" class="msg-input" id="msg-group-search" placeholder="Search parties to add..." style="width:100%;" />
        </div>
        <div id="msg-group-selected" style="padding:4px 14px;display:none;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--border-0, rgba(255,255,255,0.06));"></div>
        <div class="msg-panel__body" id="msg-group-results" style="flex:1;overflow-y:auto;">
            <div class="msg-empty"><div class="msg-empty__text">Search for parties to add...</div></div>
        </div>
        <div class="msg-input-bar">
            <button class="msg-send-btn" id="msg-create-group" style="width:100%;" disabled>Create Group Chat</button>
        </div>
    `;

    document.getElementById('msg-back').addEventListener('click', () => {
        if (headerTitle) headerTitle.textContent = 'Messages';
        renderChatList();
    });

    const searchInput = document.getElementById('msg-group-search');
    searchInput.addEventListener('input', () => {
        clearTimeout(_searchTimeout);
        _searchTimeout = setTimeout(() => searchPartiesForGroup(searchInput.value.trim()), 250);
    });

    document.getElementById('msg-create-group').addEventListener('click', createGroupChat);

    // Show nation parties by default
    searchPartiesForGroup('');
}

async function searchPartiesForGroup(query) {
    const container = document.getElementById('msg-group-results');
    if (!container) return;

    let results = [];
    try {
        if (!query) {
            const { data } = await _supabase
                .from('factions')
                .select('id, faction_name, abbreviation, party_color, nation')
                .eq('nation_id', _msgNation?.id)
                .eq('faction_type', 'party')
                .neq('id', _msgFaction.id)
                .order('faction_name')
                .limit(20);
            results = data || [];
        } else {
            const { data } = await _supabase
                .from('factions')
                .select('id, faction_name, abbreviation, party_color, nation')
                .neq('id', _msgFaction.id)
                .or(`faction_name.ilike.%${query}%,abbreviation.ilike.%${query}%,nation.ilike.%${query}%`)
                .eq('faction_type', 'party')
                .not('nation_id', 'is', null)
                .order('faction_name')
                .limit(20);
            results = data || [];
        }
    } catch (_) { results = []; }

    if (results.length === 0) {
        container.innerHTML = `<div class="msg-empty"><div class="msg-empty__text">No parties found.</div></div>`;
        return;
    }

    container.innerHTML = results.map(p => {
        const abbr = (p.abbreviation || p.faction_name || '?').slice(0, 3).toUpperCase();
        const color = p.party_color || '#666';
        const selected = _groupSelectIds.has(p.id);
        return `<div class="msg-chat-item" data-msg-action="toggle-group-member" data-faction-id="${p.id}" style="${selected ? 'background:rgba(90,175,165,0.08);' : ''}">
            <div class="msg-chat-item__avatar" style="color:${escapeHtml(color)};border-color:${escapeHtml(color)};">${escapeHtml(abbr)}</div>
            <div class="msg-chat-item__info">
                <div class="msg-chat-item__name">${escapeHtml(p.faction_name)}</div>
                <div class="msg-chat-item__preview">${escapeHtml(p.nation || '')}</div>
            </div>
            <div style="font-family:var(--font-mono,monospace);font-size:14px;color:${selected ? 'var(--teal,#5aafa5)' : 'var(--text-dim,#4a4940)'};">${selected ? '✓' : '+'}</div>
        </div>`;
    }).join('');

    container.querySelectorAll('[data-msg-action="toggle-group-member"]').forEach(el => {
        el.addEventListener('click', () => {
            const fid = el.dataset.factionId;
            if (_groupSelectIds.has(fid)) {
                _groupSelectIds.delete(fid);
            } else {
                _groupSelectIds.add(fid);
            }
            // Re-render
            searchPartiesForGroup(document.getElementById('msg-group-search')?.value?.trim() || '');
            renderGroupSelected();
            updateCreateGroupBtn();
        });
    });
}

function renderGroupSelected() {
    const container = document.getElementById('msg-group-selected');
    if (!container) return;
    if (_groupSelectIds.size === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }
    container.style.display = 'flex';
    // Show selected as small tags — we only have IDs, so show abbreviated
    container.innerHTML = `<span style="font-family:var(--font-mono,monospace);font-size:8px;color:var(--text-dim);">${_groupSelectIds.size} member${_groupSelectIds.size > 1 ? 's' : ''} selected</span>`;
}

function updateCreateGroupBtn() {
    const btn = document.getElementById('msg-create-group');
    if (btn) btn.disabled = _groupSelectIds.size === 0;
}

async function createGroupChat() {
    const nameInput = document.getElementById('msg-group-name');
    const btn = document.getElementById('msg-create-group');
    const chatName = nameInput?.value?.trim() || 'Group Chat';

    if (_groupSelectIds.size === 0) return;
    if (btn) btn.disabled = true;

    try {
        // Create the group chat
        const { data: chat, error: chatErr } = await _supabase
            .from('group_chats')
            .insert({
                name: chatName,
                chat_type: 'custom',
                created_by: _msgFaction.id,
            })
            .select()
            .single();
        if (chatErr) throw chatErr;

        // Add self + all selected members
        const members = [_msgFaction.id, ..._groupSelectIds];
        const memberRows = members.map(fid => ({
            chat_id: chat.id,
            faction_id: fid,
        }));

        const { error: memErr } = await _supabase
            .from('group_chat_members')
            .insert(memberRows);
        if (memErr) throw memErr;

        // Post a system message
        await _supabase.from('group_chat_messages').insert({
            chat_id: chat.id,
            sender_id: null,
            is_system: true,
            message_text: `${_msgFaction.faction_name || 'Someone'} created this group chat.`,
            sent_at_tick: _msgShard?.current_tick || null,
        });

        // Open the new chat thread
        const headerTitle = document.querySelector('.msg-panel__title');
        if (headerTitle) headerTitle.textContent = 'Messages';
        openThread({ type: 'group', id: chat.id, name: chatName });

    } catch (err) {
        console.error('[Messaging] Create group failed:', err);
        alert('Failed to create group chat: ' + (err.message || 'Unknown error'));
        if (btn) btn.disabled = false;
    }
}

// ── Auto-create / sync IPO group chats ──
async function syncAutoChats() {
    if (!_msgFaction || !_msgFaction.id) return;

    try {
        // 1. Sync nation chat — one per nation
        if (_msgNation?.id) {
            await ensureNationChat(_msgNation.id, _msgNation.name || 'Nation');
        }

        // 2. Sync IPO chats — one per org the player is a member of
        const { data: memberships } = await _supabase
            .from('ipo_members')
            .select('org_id, international_orgs!inner(id, name, is_active)')
            .eq('faction_id', _msgFaction.id)
            .eq('is_active', true);

        for (const m of (memberships || [])) {
            const org = m.international_orgs;
            if (!org || !org.is_active) continue;
            await ensureIPOChat(org.id, org.name);
        }
    } catch (e) {
        console.warn('[Messaging] Auto-chat sync failed (non-blocking):', e);
    }
}

async function ensureNationChat(nationId, nationName) {
    // Check if nation chat already exists
    const { data: existing } = await _supabase
        .from('group_chats')
        .select('id')
        .eq('nation_id', nationId)
        .eq('chat_type', 'nation')
        .maybeSingle();

    let chatId;
    if (existing) {
        chatId = existing.id;
    } else {
        // Create nation chat
        const { data: chat, error } = await _supabase
            .from('group_chats')
            .insert({ name: nationName + ' Chat', chat_type: 'nation', nation_id: nationId })
            .select('id')
            .single();
        if (error) {
            // Might be a race — another player created it simultaneously
            if (error.code === '23505') {
                const { data: retry } = await _supabase
                    .from('group_chats')
                    .select('id')
                    .eq('nation_id', nationId)
                    .eq('chat_type', 'nation')
                    .maybeSingle();
                chatId = retry?.id;
            } else {
                console.warn('[Messaging] Nation chat create failed:', error.message);
                return;
            }
        } else {
            chatId = chat.id;
        }
    }

    if (!chatId) return;

    // Ensure we're a member
    await _supabase
        .from('group_chat_members')
        .upsert({ chat_id: chatId, faction_id: _msgFaction.id }, { onConflict: 'chat_id,faction_id' });

    // Sync all parties in this nation as members (best-effort)
    try {
        const { data: parties } = await _supabase
            .from('factions')
            .select('id')
            .eq('nation_id', _msgNation.id)
            .eq('faction_type', 'party')
            .not('nation_id', 'is', null);

        if (parties && parties.length > 0) {
            const rows = parties.map(p => ({ chat_id: chatId, faction_id: p.id }));
            await _supabase
                .from('group_chat_members')
                .upsert(rows, { onConflict: 'chat_id,faction_id' });
        }
    } catch (_) { /* best-effort sync */ }
}

async function ensureIPOChat(orgId, orgName) {
    // Check if IPO chat already exists
    const { data: existing } = await _supabase
        .from('group_chats')
        .select('id')
        .eq('ipo_org_id', orgId)
        .eq('chat_type', 'ipo')
        .maybeSingle();

    let chatId;
    if (existing) {
        chatId = existing.id;
    } else {
        // Create IPO chat
        const { data: chat, error } = await _supabase
            .from('group_chats')
            .insert({ name: orgName, chat_type: 'ipo', ipo_org_id: orgId })
            .select('id')
            .single();
        if (error) {
            if (error.code === '23505') {
                const { data: retry } = await _supabase
                    .from('group_chats')
                    .select('id')
                    .eq('ipo_org_id', orgId)
                    .eq('chat_type', 'ipo')
                    .maybeSingle();
                chatId = retry?.id;
            } else {
                console.warn('[Messaging] IPO chat create failed:', error.message);
                return;
            }
        } else {
            chatId = chat.id;
        }
    }

    if (!chatId) return;

    // Ensure we're a member
    await _supabase
        .from('group_chat_members')
        .upsert({ chat_id: chatId, faction_id: _msgFaction.id }, { onConflict: 'chat_id,faction_id' });

    // Sync all active IPO members into the group chat (best-effort)
    try {
        const { data: members } = await _supabase
            .from('ipo_members')
            .select('faction_id')
            .eq('org_id', orgId)
            .eq('is_active', true);

        if (members && members.length > 0) {
            const rows = members.map(m => ({ chat_id: chatId, faction_id: m.faction_id }));
            await _supabase
                .from('group_chat_members')
                .upsert(rows, { onConflict: 'chat_id,faction_id' });
        }
    } catch (_) { /* best-effort sync */ }
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

    // Sync auto-chats in background (non-blocking)
    syncAutoChats();
}
