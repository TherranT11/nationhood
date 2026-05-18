// ══════════════════════════════════════════════════════════════════════
//  Messaging System — Floating bubble + panel
//  Injected on all pages via initMessaging()
// ══════════════════════════════════════════════════════════════════════

import { _supabase } from './supabase-client.js';
import { escapeHtml } from './utils.js';
import { deriveLeadPartyId } from './game/government-structure.js';

let _msgFaction = null;
let _msgNation = null;
let _msgShard = null;
let _msgPanelOpen = false;
let _msgView = 'list';       // 'list' | 'thread' | 'new-dm' | 'new-group'
let _msgListFilter = 'all';  // 'all' | 'global' | 'nation' | 'dm' — Phase 3 tab bar
let _msgActiveChat = null;   // { type: 'dm'|'group', id, name, ... }
let _realtimeChannel = null;
let _groupRealtimeChannel = null;
// Phase 5: pagination state.
let _oldestLoadedTs = null;            // ISO timestamp of oldest message rendered in current thread
let _loadingOlder = false;             // prevents duplicate "load earlier" requests during scroll spam
let _pinnedMessages = [];              // pinned messages for the active chat (Phase 5 pin strip)
let _searchMode = false;               // true when the thread body is showing search results

// Page size for history pagination. 50 is enough to fill the viewport
// without making the initial load feel sluggish on cold cache.
const MSG_PAGE_SIZE = 50;

// Column lists for message reads. Single source of truth so the main
// load, pagination, and search paths stay in sync — Phase 5 added
// edited_at / deleted_at / pinned_at and each had to be added at three
// sites before this refactor.
const DM_MSG_COLS = 'id, sender_id, receiver_id, message_text, created_at, sent_at_tick, read_at, edited_at, deleted_at';
const GROUP_MSG_COLS = 'id, sender_id, is_system, message_text, created_at, sent_at_tick, edited_at, deleted_at, pinned_at';

// Nation name → flag asset. Duplicated inline in diplomacy.html,
// corp-nation-select.html, select-nation.html; consolidating is out of
// scope for Phase 4 but should land as a shared module later.
const NATION_FLAG_URLS = {
    'Melizea':     'assets/flags/Melizea.png',
    'Avelia':      'assets/flags/Avelia.png',
    'Sangreza':    'assets/flags/sangreza.png',
    'Montequilla': 'assets/flags/Montequilla.png',
    'San Estrella':'assets/flags/sanestrella.png',
    'Palvera':     'assets/flags/Palvera.png',
    'Calveth':     'assets/flags/Calveth.png',
    'Flandis':     'assets/flags/Flandis.png',
    'Vostia':      'assets/flags/Vostia.png',
    'Sierramar':   'assets/flags/Sierramar.png',
    'Dravka':      'assets/flags/Dravka.png',
    'Hajjara':     'assets/flags/Hajjara.png',
};

// nation-info.html accepts ?name=<slug>. Slugs are lowercase with spaces
// stripped (see SLUG_TO_NAME in nation-info.html). Keep in sync.
function nationNameToSlug(name) {
    if (!name) return '';
    return String(name).toLowerCase().replace(/\s+/g, '');
}

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
    background: var(--teal, #5aafa5); border: 2px solid var(--border-mid, rgba(0,0,0,0.12));
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    transition: transform 0.15s, box-shadow 0.15s;
    font-size: 20px; color: #000; user-select: none;
}
.msg-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(0,0,0,0.5); }

/* ── Panel ── */
.msg-panel {
    position: fixed; bottom: 20px; right: 20px; z-index: 9001;
    /* Desktop default: 420x640. installResize() restores the user's saved
       size on mount (localStorage key 'msg-panel-size') and writes back on
       drag-end. Mobile media query below 640px takes the panel fullscreen
       so this width/height is ignored there. */
    width: 420px; height: 640px; max-height: calc(100vh - 40px);
    background: var(--bg-panel, #1a1a17); border: 1px solid var(--border-main, rgba(0,0,0,0.08));
    box-shadow: 0 12px 48px rgba(0,0,0,0.6);
    display: none; flex-direction: column; overflow: hidden;
    border-radius: 8px;
}
/* Resize grab handle — top-left corner since the panel anchors to
   bottom-right. Hidden on mobile via the 640px media query below. */
.msg-resize-handle {
    position: absolute; top: 0; left: 0;
    width: 14px; height: 14px;
    cursor: nwse-resize; z-index: 2;
    background:
        linear-gradient(135deg, transparent 55%, var(--border-mid, rgba(255,255,255,0.18)) 55% 65%, transparent 65% 75%, var(--border-mid, rgba(255,255,255,0.18)) 75% 85%, transparent 85%);
    opacity: 0.5; transition: opacity 0.1s;
}
.msg-resize-handle:hover { opacity: 1; }
.msg-panel.open { display: flex; }

/* Panel header */
.msg-panel__header {
    padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;
    background: var(--bg-card, #252525); border-bottom: 1px solid var(--border-main, rgba(0,0,0,0.08));
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

/* Filter tab bar — sits above the actions, filters the list view.
   An amber unread-count badge appears on a tab when that section has
   messages the current faction hasn't read yet. */
.msg-panel__tabs {
    display: flex; flex-shrink: 0;
    border-bottom: 1px solid var(--border-main, rgba(0,0,0,0.08));
    background: var(--bg-card, #252525);
}
.msg-tab {
    flex: 1; padding: 10px 0; text-align: center; cursor: pointer;
    font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase;
    color: var(--text-dim, #4a4940); position: relative;
    border-bottom: 2px solid transparent;
    transition: color 0.1s, border-color 0.1s;
    user-select: none;
}
.msg-tab:hover { color: var(--text-muted, #666); }
.msg-tab--active {
    color: var(--text-bright, #f0efe6);
    border-bottom-color: var(--teal, #5aafa5);
}
/* Per-tab unread count — amber pill floated at the top-right of the
   tab. Rendered by updateTabBadges() only when count > 0. */
.msg-tab__badge {
    position: absolute; top: 4px;
    margin-left: 4px;
    min-width: 14px; height: 14px; padding: 0 4px;
    border-radius: 7px;
    background: var(--amber, #c8a64e); color: #000;
    font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 700;
    line-height: 14px; text-align: center;
}

/* Panel actions bar */
.msg-panel__actions {
    padding: 8px 14px; display: flex; gap: 6px;
    border-bottom: 1px solid var(--border-main, rgba(0,0,0,0.08));
    flex-shrink: 0;
}
.msg-action-btn {
    flex: 1; padding: 6px 0; text-align: center;
    font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 700;
    letter-spacing: 0.5px; text-transform: uppercase;
    color: var(--text-dim, #4a4940); background: var(--bg-card, #252525);
    border: 1px solid var(--border-main, rgba(0,0,0,0.08));
    cursor: pointer; transition: all 0.1s;
}
.msg-action-btn:hover { color: var(--text-muted, #666); border-color: var(--border-mid, rgba(0,0,0,0.12)); }

/* Scrollable content */
.msg-panel__body {
    flex: 1; overflow-y: auto;
}
.msg-panel__body::-webkit-scrollbar { width: 4px; }
.msg-panel__body::-webkit-scrollbar-track { background: transparent; }
.msg-panel__body::-webkit-scrollbar-thumb { background: var(--border-mid, rgba(0,0,0,0.12)); }

/* Chat list section headers */
.msg-section-hdr {
    padding: 6px 14px;
    font-family: var(--font-mono, monospace); font-size: 8px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text-dim, #4a4940); background: var(--bg-card, #252525);
    border-bottom: 1px solid var(--border-main, rgba(0,0,0,0.08));
}

/* Chat list item */
.msg-chat-item {
    padding: 10px 14px; display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid var(--border-main, rgba(0,0,0,0.08));
    cursor: pointer; transition: background 0.1s;
}
.msg-chat-item:hover { background: var(--bg-hover, #282822); }
.msg-chat-item__avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--bg-card, #252525); border: 1px solid var(--border-main, rgba(0,0,0,0.08));
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
    border-bottom: 1px solid var(--border-main, rgba(0,0,0,0.08));
    flex-shrink: 0;
}
.msg-thread-back {
    background: none; border: none; color: var(--text-dim, #4a4940);
    font-size: 14px; cursor: pointer; padding: 2px 6px;
}
.msg-thread-back:hover { color: var(--text-muted, #666); }
.msg-thread-members-btn {
    background: none; border: none; color: var(--text-dim, #4a4940);
    font-size: 13px; cursor: pointer; padding: 2px 6px; margin-left: auto;
}
.msg-thread-members-btn:hover { color: var(--text-muted, #666); }
.msg-members-bar {
    display: flex; flex-wrap: wrap; gap: 4px; padding: 6px 14px;
    border-bottom: 1px solid var(--border-main, rgba(0,0,0,0.08));
    max-height: 60px; overflow-y: auto;
}
.msg-member-chip {
    font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 700;
    padding: 2px 6px; border: 1px solid; border-radius: 3px; opacity: 0.7;
    white-space: nowrap;
}
.msg-role-section {
    padding: 8px 14px; border-bottom: 1px solid var(--border-main, rgba(0,0,0,0.08));
}
.msg-role-section-title {
    font-family: var(--font-mono, monospace); font-size: 8px; font-weight: 700;
    color: var(--text-dim, #4a4940); text-transform: uppercase; letter-spacing: 0.08em;
    margin-bottom: 6px;
}
.msg-role-row {
    display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer;
}
.msg-role-row:hover { opacity: 0.8; }
.msg-role-badge {
    font-family: var(--font-mono, monospace); font-size: 8px; font-weight: 700;
    padding: 2px 6px; border-radius: 3px; text-transform: uppercase;
    letter-spacing: 0.04em; background: var(--bg-card, #252525);
    border: 1px solid var(--border-main, rgba(0,0,0,0.08));
    color: var(--text-muted, #4a4940);
}
.msg-role-party {
    font-size: 11px; color: var(--text-bright, #f0efe6); font-weight: 500;
}
.msg-nation-select {
    width: 100%; padding: 6px 10px; border-radius: 4px;
    background: var(--bg-input, var(--bg-panel, #24241f));
    border: 1px solid var(--border-main, rgba(0,0,0,0.08));
    color: var(--text-bright, #f0efe6); font-family: var(--font-ui, sans-serif);
    font-size: 12px; margin-bottom: 8px;
}
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
.msg-messages::-webkit-scrollbar-thumb { background: var(--border-mid, rgba(0,0,0,0.12)); }

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
    background: var(--bg-card, #252525);
    border: 1px solid var(--border-main, rgba(0,0,0,0.08));
    color: var(--text-primary, #c4c2b8);
}
.msg-msg--system {
    align-self: center; text-align: center;
    font-family: var(--font-mono, monospace); font-size: 9px;
    color: var(--text-dim, #4a4940); padding: 4px 8px;
}
/* Phase 4 identity row: avatar + nameplate sit above the message body. */
.msg-msg__header {
    display: flex; align-items: center; gap: 6px; margin-bottom: 3px;
}
.msg-msg__avatar {
    width: 20px; height: 20px; border-radius: 50%;
    border: 1px solid; background: var(--bg-panel, #1a1a17);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono, monospace); font-size: 8px; font-weight: 700;
    flex-shrink: 0; letter-spacing: 0.5px;
}
.msg-msg__nameplate {
    display: inline-flex; align-items: center; gap: 5px;
    cursor: pointer; padding: 2px 4px; border-radius: 3px;
    transition: background 0.1s;
    min-width: 0;
}
.msg-msg__nameplate:hover,
.msg-msg__nameplate:focus-visible {
    background: var(--bg-hover, rgba(255,255,255,0.04)); outline: none;
}
.msg-msg__name {
    font-family: var(--font-mono, monospace); font-size: 10px; font-weight: 700;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 200px;
}
.msg-msg__flag {
    width: 16px; height: 11px; object-fit: cover;
    border: 1px solid var(--border-mid, rgba(255,255,255,0.12));
    border-radius: 1px; flex-shrink: 0;
}
/* Sector pill for corp senders in Nation Chat. flex-shrink avoids
   squashing in narrow panels; max-width + ellipsis caps sector names
   like "Heavy Manufacturing" so they don't push the nameplate off. */
.msg-msg__sector {
    font-family: var(--font-mono, monospace); font-size: 8px; font-weight: 700;
    padding: 1px 5px; border-radius: 2px; text-transform: uppercase;
    background: var(--amber-faint, rgba(200,166,78,0.12));
    color: var(--amber, #c8a64e);
    letter-spacing: 0.4px; flex-shrink: 0;
    max-width: 110px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
}
/* Fallback nation tag when no flag asset is available. */
.msg-msg__nation {
    font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 500;
    color: var(--text-dim, #8a8778); opacity: 0.85;
}
.msg-msg__time {
    font-family: var(--font-mono, monospace); font-size: 8px;
    color: var(--text-dim, #4a4940); margin-top: 2px; text-align: right;
}

/* Phase 4 identity popover — opens when a nameplate is clicked.
   Positioned absolutely relative to the panel via inline top/left set by
   openIdentityPopover(). Dismissed on outside click or Escape. */
.msg-identity-popover {
    position: absolute; z-index: 9100;
    min-width: 180px; max-width: 240px;
    background: var(--bg-card, #252525);
    border: 1px solid var(--border-mid, rgba(255,255,255,0.12));
    border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    padding: 10px 12px;
    font-family: var(--font-ui, sans-serif); font-size: 11px;
    color: var(--text-primary, #c4c2b8);
}
.msg-identity-popover__name {
    font-family: var(--font-mono, monospace); font-size: 11px; font-weight: 700;
    margin-bottom: 6px; word-break: break-word;
}
.msg-identity-popover__row {
    display: flex; align-items: center; gap: 6px;
    margin-bottom: 4px; font-size: 10px;
    color: var(--text-dim, #8a8778);
}
.msg-identity-popover__row img {
    width: 18px; height: 12px; object-fit: cover;
    border: 1px solid var(--border-mid, rgba(255,255,255,0.12));
    border-radius: 1px;
}
.msg-identity-popover__link {
    display: inline-block; margin-top: 6px;
    font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 700;
    letter-spacing: 0.5px; text-transform: uppercase;
    color: var(--teal, #5aafa5); text-decoration: none;
}
.msg-identity-popover__link:hover { color: #6bc0b6; }
.msg-identity-popover__btn {
    display: block; width: 100%; margin-top: 6px; padding: 5px 8px;
    font-family: var(--font-mono, monospace); font-size: 9px; font-weight: 700;
    letter-spacing: 0.5px; text-transform: uppercase; text-align: left;
    background: transparent; color: var(--text-muted, #8a8778);
    border: 1px solid var(--border-main, rgba(255,255,255,0.08));
    border-radius: 3px; cursor: pointer; transition: color 0.1s, border-color 0.1s;
}
.msg-identity-popover__btn:hover {
    color: var(--amber, #c8a64e); border-color: var(--amber, #c8a64e);
}

/* Phase 5: own-message hover menu (edit / delete / report). Anchored to
   the message bubble; opens a dropdown with the available actions. */
.msg-msg { position: relative; }
/* Always-visible at reduced opacity so touch devices (no :hover) can
   still reach the menu; desktops get a full-opacity reveal on hover. */
.msg-msg__menu-btn {
    position: absolute; top: 4px; right: 4px;
    width: 18px; height: 18px; padding: 0; line-height: 1;
    background: transparent; border: none;
    color: var(--text-dim, #4a4940); cursor: pointer;
    font-size: 12px; opacity: 0.35; transition: opacity 0.1s, color 0.1s;
}
.msg-msg:hover .msg-msg__menu-btn,
.msg-msg__menu-btn:hover,
.msg-msg__menu-btn:focus-visible { opacity: 1; outline: none; color: var(--text-bright, #f0efe6); }

.msg-msg__menu {
    position: absolute; top: 20px; right: 4px; z-index: 9050;
    min-width: 120px;
    background: var(--bg-card, #252525);
    border: 1px solid var(--border-mid, rgba(255,255,255,0.12));
    border-radius: 4px; box-shadow: 0 6px 18px rgba(0,0,0,0.5);
    padding: 4px 0;
}
.msg-msg__menu-item {
    display: block; width: 100%; padding: 6px 10px; text-align: left;
    font-family: var(--font-mono, monospace); font-size: 10px;
    background: transparent; border: none; color: var(--text-primary, #c4c2b8);
    cursor: pointer;
}
.msg-msg__menu-item:hover { background: var(--bg-hover, rgba(255,255,255,0.04)); color: var(--text-bright, #f0efe6); }
.msg-msg__menu-item--danger { color: #e36060; }
.msg-msg__menu-item--danger:hover { color: #ff7878; }

/* Edit mode: textarea + save/cancel row inside the bubble. */
.msg-msg__edit {
    display: flex; flex-direction: column; gap: 4px; margin-top: 2px;
}
.msg-msg__edit textarea {
    width: 100%; min-height: 48px; max-height: 160px; resize: vertical;
    padding: 4px 6px; border-radius: 3px;
    background: var(--bg-input, var(--bg-panel, #24241f));
    border: 1px solid var(--border-main, rgba(255,255,255,0.08));
    color: var(--text-bright, #f0efe6); font-family: var(--font-ui, sans-serif);
    font-size: 12px; outline: none;
}
.msg-msg__edit-row { display: flex; gap: 4px; justify-content: flex-end; }
.msg-msg__edit-row button {
    padding: 3px 8px; font-family: var(--font-mono, monospace);
    font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
    border: 1px solid var(--border-mid, rgba(255,255,255,0.12));
    border-radius: 3px; background: transparent;
    color: var(--text-muted, #8a8778); cursor: pointer;
}
.msg-msg__edit-row button.primary {
    background: var(--teal, #5aafa5); color: #000;
    border-color: var(--teal, #5aafa5);
}

/* Deleted / edited markers. */
.msg-msg--deleted { opacity: 0.6; font-style: italic; }
.msg-msg__edited {
    font-family: var(--font-mono, monospace); font-size: 8px;
    color: var(--text-dim, #4a4940); margin-left: 6px;
}
.msg-msg__pinned {
    display: inline-block; margin-right: 4px;
    color: var(--amber, #c8a64e); font-size: 10px;
}

/* Pinned-strip at the top of the thread (Phase 5, admin-set, max 3). */
.msg-pinned-strip {
    border-bottom: 1px solid var(--border-main, rgba(0,0,0,0.08));
    background: rgba(200,166,78,0.06);
    padding: 6px 14px; flex-shrink: 0;
}
.msg-pinned-strip__hdr {
    font-family: var(--font-mono, monospace); font-size: 8px; font-weight: 700;
    color: var(--amber, #c8a64e); letter-spacing: 1px; text-transform: uppercase;
    margin-bottom: 4px;
}
.msg-pinned-strip__item {
    font-size: 11px; color: var(--text-primary, #c4c2b8);
    padding: 3px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 100%;
}

/* Load-earlier sentinel at the top of the messages list. */
.msg-load-earlier {
    display: block; width: 100%; padding: 8px 0; text-align: center;
    font-family: var(--font-mono, monospace); font-size: 9px;
    color: var(--text-dim, #8a8778); background: transparent;
    border: none; cursor: pointer; letter-spacing: 0.5px;
}
.msg-load-earlier:hover { color: var(--text-bright, #f0efe6); }
.msg-load-earlier[disabled] { cursor: default; opacity: 0.5; }

/* Search bar + search-results list live inside #msg-body when active. */
.msg-search-bar {
    padding: 8px 14px; display: flex; gap: 6px;
    border-bottom: 1px solid var(--border-main, rgba(0,0,0,0.08));
    flex-shrink: 0;
}
.msg-search-bar input {
    flex: 1; padding: 5px 8px; border-radius: 3px;
    background: var(--bg-input, var(--bg-panel, #24241f));
    border: 1px solid var(--border-main, rgba(0,0,0,0.08));
    color: var(--text-bright, #f0efe6); font-family: var(--font-ui, sans-serif);
    font-size: 11px; outline: none;
}
.msg-search-bar button {
    padding: 5px 10px; font-family: var(--font-mono, monospace);
    font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
    background: var(--bg-card, #252525); border: 1px solid var(--border-mid, rgba(255,255,255,0.12));
    color: var(--text-muted, #8a8778); cursor: pointer; border-radius: 3px;
}
.msg-search-bar button:hover { color: var(--text-bright, #f0efe6); }

/* Toast — ephemeral error/success banner anchored to the panel bottom.
   Used for rate-limit, mute, and other send-time trigger errors. */
.msg-toast {
    position: absolute; left: 12px; right: 12px; bottom: 56px;
    z-index: 9200;
    padding: 8px 12px; border-radius: 4px;
    font-family: var(--font-ui, sans-serif); font-size: 11px;
    background: rgba(227,96,96,0.14); color: #ffd4d4;
    border: 1px solid rgba(227,96,96,0.4);
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    animation: msgToastIn 0.12s ease-out;
}
.msg-toast--success { background: rgba(90,175,165,0.14); color: #d4f0eb; border-color: rgba(90,175,165,0.4); }
@keyframes msgToastIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

/* Input bar */
.msg-input-bar {
    padding: 8px 14px; display: flex; gap: 6px;
    border-top: 1px solid var(--border-main, rgba(0,0,0,0.08));
    background: var(--bg-card, #252525); flex-shrink: 0;
}
.msg-input {
    flex: 1; padding: 6px 10px; border-radius: 4px;
    background: var(--bg-input, var(--bg-panel, #24241f)); border: 1px solid var(--border-main, rgba(0,0,0,0.08));
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

/* ── Mobile: below 640px, the panel takes the full viewport. The tab bar
     sits directly under the header and gives players a single thumb-reach
     target per section. Bubble still floats bottom-right for one-tap open.
     !important on the size props so any desktop width/height restored from
     localStorage by installResize() doesn't leak into the fullscreen layout. */
@media (max-width: 640px) {
    /* 100dvh (not 100vh) so the panel shrinks when the on-screen keyboard
       appears — otherwise the input bar gets pushed behind the keyboard and
       the browser jumps/scrolls trying to reveal it on focus. The 100vh
       pair above is a fallback for browsers that predate dvh support (pre-
       2022); the cascade picks 100dvh when available. */
    .msg-panel {
        top: 0 !important; right: 0 !important; left: 0 !important; bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important; height: 100dvh !important;
        max-height: 100vh !important; max-height: 100dvh !important;
        border-radius: 0; border-width: 0;
    }
    .msg-bubble {
        /* Keep bubble bottom-right so it doesn't collide with top status bars
           or the nation header. Smaller so it's unobtrusive on small screens. */
        top: auto; bottom: 20px; right: 16px;
        width: 48px; height: 48px; font-size: 20px;
    }
    /* Tabs get a touch more vertical room on mobile. */
    .msg-tab { padding: 12px 0; font-size: 10px; }
    /* Resize handle makes no sense at fullscreen. */
    .msg-resize-handle { display: none; }
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
    bubble.innerHTML = `💬`;
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
        <div class="msg-panel__tabs" id="msg-tabs">
            <div class="msg-tab msg-tab--active" data-filter="all">All</div>
            <div class="msg-tab" data-filter="global">Global</div>
            <div class="msg-tab" data-filter="nation">Nation</div>
            <div class="msg-tab" data-filter="dm">DMs</div>
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

    // Tab bar: clicking a tab switches the list filter and re-renders.
    // Delegated listener on the tab container so late-added tabs still work.
    // The GLOBAL tab opens the Global Chat thread directly — that section
    // only ever has one entry, so the intermediate list is pure friction.
    const tabsEl = document.getElementById('msg-tabs');
    if (tabsEl) {
        tabsEl.addEventListener('click', (ev) => {
            const tab = ev.target.closest('.msg-tab');
            if (!tab) return;
            const filter = tab.dataset.filter;
            if (!filter || filter === _msgListFilter) return;
            _msgListFilter = filter;
            setActiveTab(filter);
            if (filter === 'global') openGlobalChatDirect();
            else if (filter === 'nation') openNationChatDirect();
            else renderChatList();
        });
    }

    // Restore saved panel size (Phase 3 resize handle) — see installResize().
    installResize(panel);

    // Panel click delegation (Phases 4 + 5). One listener handles the
    // identity popover, per-message menus, and all in-panel action
    // buttons (block/unblock, edit, delete, report, load-earlier,
    // search close). Delegated so renders and realtime appends pick
    // them up for free.
    panel.addEventListener('click', (ev) => {
        const actionEl = ev.target.closest('[data-msg-action]');
        const action = actionEl?.dataset?.msgAction;

        if (action === 'open-profile') {
            ev.stopPropagation();
            const fid = actionEl.dataset.factionId;
            if (_identityPopoverEl && _identityPopoverEl.dataset.factionId === fid) {
                closeIdentityPopover();
            } else {
                openIdentityPopover(actionEl, fid);
            }
            return;
        }
        if (action === 'msg-menu') {
            ev.stopPropagation();
            const mid = actionEl.dataset.msgId;
            // Toggle: second click on same button closes.
            if (_messageMenuEl && _messageMenuEl.parentNode?.dataset?.msgId === mid) {
                closeMessageMenu();
            } else {
                openMessageMenu(actionEl, mid);
            }
            return;
        }
        if (action === 'edit')        { ev.stopPropagation(); beginEditMessage(actionEl.dataset.msgId); return; }
        if (action === 'edit-save')   { ev.stopPropagation(); saveEditMessage(actionEl.dataset.msgId); return; }
        if (action === 'edit-cancel') {
            ev.stopPropagation();
            const msgEl = actionEl.closest('.msg-msg');
            if (msgEl) cancelEditMessage(msgEl);
            return;
        }
        if (action === 'delete')      { ev.stopPropagation(); deleteOwnMessage(actionEl.dataset.msgId); return; }

        if (ev.target.id === 'msg-load-earlier') {
            ev.stopPropagation(); loadOlderMessages(); return;
        }

        // Clicks outside menus/popovers close them.
        if (_messageMenuEl && !ev.target.closest('.msg-msg__menu') && !ev.target.closest('.msg-msg__menu-btn')) {
            closeMessageMenu();
        }
        if (_identityPopoverEl && !ev.target.closest('.msg-identity-popover')) {
            closeIdentityPopover();
        }
    });
    // Keyboard: Enter/Space on focused nameplate, Escape closes popover.
    panel.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && _identityPopoverEl) {
            closeIdentityPopover();
            return;
        }
        if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[data-msg-action="open-profile"]')) {
            ev.preventDefault();
            openIdentityPopover(ev.target, ev.target.dataset.factionId);
        }
    });
    // Close popover when the panel closes or the view switches.
    document.addEventListener('click', (ev) => {
        if (!_identityPopoverEl) return;
        if (!panel.contains(ev.target)) closeIdentityPopover();
    });
    // Scrolling the message list moves the anchor but not the popover, so
    // detach on scroll rather than chase the anchor every frame.
    panel.addEventListener('scroll', () => { if (_identityPopoverEl) closeIdentityPopover(); }, true);
}

// Single writer for the active-tab class so the handler that bypasses
// renderChatList (GLOBAL tab auto-open) and renderChatList's own badge
// update stay in lockstep.
function setActiveTab(filter) {
    document.querySelectorAll('.msg-tab').forEach(t =>
        t.classList.toggle('msg-tab--active', t.dataset.filter === filter));
}

// ── Tab bar: update unread badges ─────────────────────────────────────
// Called from renderChatList after the per-type unread counts are tallied.
// Each tab shows an amber count badge for its section; a count of 0 hides
// the badge entirely. Counts over 99 show "99+" to keep the pill compact.
function updateTabBadges(counts) {
    setActiveTab(_msgListFilter);
    document.querySelectorAll('.msg-tab').forEach((tab) => {
        const count = counts[tab.dataset.filter] || 0;
        const existing = tab.querySelector('.msg-tab__badge');
        if (existing) existing.remove();
        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'msg-tab__badge';
            badge.textContent = count > 99 ? '99+' : String(count);
            badge.title = count + ' unread';
            tab.appendChild(badge);
        }
    });
}

// ── Resize handle (Phase 3) ───────────────────────────────────────────
// Desktop-only drag handle in the top-left corner (opposite the close
// button). Panel is anchored bottom-right, so dragging the top-left
// corner up/left grows it. Size persisted in localStorage under
// 'msg-panel-size'. Skipped on mobile (fullscreen breakpoint).
const MSG_PANEL_SIZE_KEY = 'msg-panel-size';
function installResize(panel) {
    if (!panel) return;
    // Restore saved size (desktop only — media query overrides below 640px).
    try {
        const raw = localStorage.getItem(MSG_PANEL_SIZE_KEY);
        if (raw) {
            const s = JSON.parse(raw);
            if (s && typeof s.width === 'number' && typeof s.height === 'number') {
                panel.style.width = Math.max(320, Math.min(s.width, 900)) + 'px';
                panel.style.height = Math.max(400, Math.min(s.height, 900)) + 'px';
            }
        }
    } catch (_) { /* ignore corrupt JSON */ }

    // Insert the grab handle into the panel header.
    if (panel.querySelector('.msg-resize-handle')) return;
    const handle = document.createElement('div');
    handle.className = 'msg-resize-handle';
    handle.title = 'Drag to resize';
    panel.appendChild(handle);

    let dragging = false;
    let startX, startY, startW, startH;
    handle.addEventListener('mousedown', (e) => {
        // Skip resize on mobile fullscreen — media query prevents the handle
        // from showing, but guard just in case.
        if (window.innerWidth <= 640) return;
        dragging = true;
        startX = e.clientX; startY = e.clientY;
        startW = panel.offsetWidth; startH = panel.offsetHeight;
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        // Panel is anchored bottom-right, so pulling top-left away increases
        // both dimensions. Clamp to sane min/max so the panel can't vanish
        // or overflow.
        const dx = startX - e.clientX;
        const dy = startY - e.clientY;
        const newW = Math.max(320, Math.min(startW + dx, 900));
        const newH = Math.max(400, Math.min(startH + dy, 900));
        panel.style.width = newW + 'px';
        panel.style.height = newH + 'px';
    });
    window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        document.body.style.userSelect = '';
        try {
            localStorage.setItem(MSG_PANEL_SIZE_KEY, JSON.stringify({
                width: panel.offsetWidth,
                height: panel.offsetHeight,
            }));
        } catch (_) { /* ignore quota errors */ }
    });
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

// Single-item sections (GLOBAL, NATION) bypass the list and drop the player
// straight into the thread. Loads group-chat membership if this is the first
// panel open, then re-checks the filter post-await so a mid-load tab switch
// doesn't yank the user into the wrong thread. Falls through to the list if
// no matching chat exists for this faction.
async function openGroupChatDirect(filter, predicate, threadName) {
    if (!_groupChats.length) {
        try { await loadGroupChats(); }
        catch (e) { console.warn('[Messaging] Failed to load group chats:', e); }
    }
    if (_msgListFilter !== filter) return;
    const match = _groupChats.find(predicate);
    if (!match) { renderChatList(); return; }
    openThread({
        type: 'group',
        id: match.chat.id,
        name: threadName || match.chat.name,
        chatType: match.chat.chat_type,
    });
}

function openGlobalChatDirect() {
    return openGroupChatDirect('global', g => g.chat.chat_type === 'global');
}

// Scoped to _msgNation.id so a stale cross-nation membership row (observed
// in the wild) can't surface another nation's chat here.
function openNationChatDirect() {
    if (!_msgNation?.id) { renderChatList(); return; }
    return openGroupChatDirect(
        'nation',
        g => g.chat.chat_type === 'nation' && g.chat.nation_id === _msgNation.id,
        'Nation',
    );
}

async function renderChatList() {
    const body = document.getElementById('msg-body');
    const actions = document.getElementById('msg-actions');
    if (actions) actions.style.display = '';
    _msgView = 'list';

    // Reset the panel header — switching tabs from an open thread would
    // otherwise leave a stale "Global Chat" / chat name in the title bar.
    const headerTitle = document.querySelector('.msg-panel__title');
    if (headerTitle) headerTitle.textContent = 'Messages';

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

    // ── Group Chats (Global + IPO + Nation + Custom) ──
    const globalChats = _groupChats.filter(g => g.chat.chat_type === 'global');
    const ipoChats = _groupChats.filter(g => g.chat.chat_type === 'ipo');
    // Scope to the player's own nation — a stale membership row for a
    // different nation's chat shouldn't surface in this list.
    const nationChats = _groupChats.filter(g =>
        g.chat.chat_type === 'nation' && g.chat.nation_id === _msgNation?.id);
    const customChats = _groupChats.filter(g => g.chat.chat_type === 'custom');

    // Per-tab unread totals — fed into the Phase 3 tab bar badges.
    const sumUnread = (arr) => arr.reduce((s, g) => s + (g.unreadCount || 0), 0);
    const unreadByTab = {
        global: sumUnread(globalChats),
        nation: sumUnread(nationChats),
        dm: _dmConversations.reduce((s, d) => s + (d.unreadCount || 0), 0),
    };
    unreadByTab.all = unreadByTab.global + unreadByTab.nation + unreadByTab.dm
        + sumUnread(ipoChats) + sumUnread(customChats);
    updateTabBadges(unreadByTab);

    const filter = _msgListFilter || 'all';
    const showGlobal = filter === 'all' || filter === 'global';
    const showNation = filter === 'all' || filter === 'nation';
    const showGroups = filter === 'all';   // ipo + custom only on All
    const showDMs    = filter === 'all' || filter === 'dm';

    // Global Chat sits at the top — every party/corp is a member and it's
    // the shard-wide conversation, so it should be the most discoverable.
    if (showGlobal && globalChats.length > 0) {
        html += `<div class="msg-section-hdr">Global Chat</div>`;
        html += globalChats.map(g => renderChatItem(g, 'group')).join('');
    }

    if (showNation && nationChats.length > 0) {
        html += `<div class="msg-section-hdr">Nation Chat</div>`;
        html += nationChats.map(g => renderChatItem(g, 'group')).join('');
    }

    if (showGroups && ipoChats.length > 0) {
        html += `<div class="msg-section-hdr">Organisation Chats</div>`;
        html += ipoChats.map(g => renderChatItem(g, 'group')).join('');
    }

    if (showGroups && customChats.length > 0) {
        html += `<div class="msg-section-hdr">Group Chats</div>`;
        html += customChats.map(g => renderChatItem(g, 'group')).join('');
    }

    // ── Direct Messages ──
    if (showDMs && _dmConversations.length > 0) {
        html += `<div class="msg-section-hdr">Direct Messages</div>`;
        html += _dmConversations.map(dm => renderDMItem(dm)).join('');
    }

    // ── Nation Parties (quick-start DM list) ── only on All / DMs filter.
    if ((filter === 'all' || filter === 'dm') && _msgNation) {
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
            if (g) openThread({ type: 'group', id: cid, name: g.chat.name, chatType: g.chat.chat_type });
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
        // Unread if: there are messages AND (never read OR last message is newer than last read)
        const hasUnread = lastMsg && (!lastRead || new Date(lastMsg.created_at) > new Date(lastRead));
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
    const typeLabel = chat.chat_type === 'global' ? 'Global'
        : chat.chat_type === 'ipo' ? 'Org'
        : chat.chat_type === 'nation' ? 'Nation'
        : 'Group';
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
let _threadFactionCache = {}; // { factionId: { id, faction_name, abbreviation, party_color, faction_type, corp_sector, nation_id, nation_name } }

async function openThread(chatInfo) {
    _msgActiveChat = chatInfo;
    _msgView = 'thread';
    const body = document.getElementById('msg-body');
    const actions = document.getElementById('msg-actions');
    if (actions) actions.style.display = 'none';

    const headerTitle = document.querySelector('.msg-panel__title');
    if (headerTitle) headerTitle.textContent = chatInfo.name || 'Chat';

    // Nation chat gets a small flag of the player's own nation beside the
    // name — reinforces "this is YOUR nation's channel" at a glance. Uses
    // the same flag_url + assets/flags/{name}.png fallback pattern as the
    // rest of the codebase (coalition-formation.js, ledger.js).
    const nationFlag = (chatInfo.type === 'group' && chatInfo.chatType === 'nation' && _msgNation)
        ? `<img src="${escapeHtml(_msgNation.flag_url || `assets/flags/${_msgNation.name}.png`)}" alt="" style="height:14px;vertical-align:middle;margin-left:6px;" onerror="this.style.display='none'">`
        : '';

    body.innerHTML = `
        <div class="msg-thread-header">
            <button class="msg-thread-back" id="msg-back">&#8592;</button>
            <span class="msg-thread-name">${escapeHtml(chatInfo.name || 'Chat')}${nationFlag}</span>
            <button class="msg-thread-members-btn" id="msg-search-btn" title="Search in channel">&#128269;</button>
            ${chatInfo.type === 'group' ? '<button class="msg-thread-members-btn" id="msg-members-toggle" title="Show members">&#128101;</button>' : ''}
        </div>
        ${chatInfo.type === 'group' ? '<div class="msg-members-bar" id="msg-members-bar" style="display:none;"></div>' : ''}
        <div class="msg-messages" id="msg-messages">
            <div class="msg-empty"><div class="msg-empty__text" style="color:var(--text-dim);">Loading...</div></div>
        </div>
        <div class="msg-input-bar">
            <input type="text" class="msg-input" id="msg-input" placeholder="Type a message..." maxlength="2000" />
            <button class="msg-send-btn" id="msg-send" disabled>Send</button>
        </div>
    `;

    // Back button: also closes any open popover/menu via the panel
    // delegation once it re-renders the list.
    document.getElementById('msg-back').addEventListener('click', () => {
        if (headerTitle) headerTitle.textContent = 'Messages';
        _msgActiveChat = null;
        _oldestLoadedTs = null;
        _pinnedMessages = [];
        _searchMode = false;
        closeMessageMenu();
        closeIdentityPopover();
        renderChatList();
    });

    // Search button toggles the search bar in-place.
    const searchBtn = document.getElementById('msg-search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (_searchMode) closeSearchBar(); else openSearchBar();
        });
    }

    // Infinite-scroll: when the list scrolls into the top ~40px, pull the
    // next older page. Guard against duplicate fires with _loadingOlder.
    // Event fires on the scroll container (#msg-messages), not the panel.
    setTimeout(() => {
        const scroller = document.getElementById('msg-messages');
        if (scroller) {
            scroller.addEventListener('scroll', () => {
                if (scroller.scrollTop < 40 && _oldestLoadedTs && !_loadingOlder) {
                    loadOlderMessages();
                }
            });
        }
    }, 0);

    // Members toggle for group chats
    if (chatInfo.type === 'group') {
        const membersToggle = document.getElementById('msg-members-toggle');
        const membersBar = document.getElementById('msg-members-bar');
        if (membersToggle && membersBar) {
            membersToggle.addEventListener('click', async () => {
                if (membersBar.style.display !== 'none') {
                    membersBar.style.display = 'none';
                    return;
                }
                membersBar.innerHTML = '<span style="color:var(--text-dim);font-size:10px;padding:4px 8px;">Loading...</span>';
                membersBar.style.display = 'flex';
                try {
                    const { data: members } = await _supabase
                        .from('group_chat_members')
                        .select('faction_id')
                        .eq('chat_id', chatInfo.id);
                    const memberIds = (members || []).map(m => m.faction_id);
                    await loadFactionNames(memberIds);
                    membersBar.innerHTML = memberIds.map(id => {
                        const f = _threadFactionCache[id];
                        if (!f) return '';
                        const abbr = (f.abbreviation || f.faction_name || '?').slice(0, 4);
                        const color = f.party_color || '#666';
                        const isSelf = id === _msgFaction.id;
                        return '<span class="msg-member-chip" style="border-color:' + escapeHtml(color) + ';color:' + escapeHtml(color) + (isSelf ? ';opacity:1' : '') + '" title="' + escapeHtml(f.faction_name || '') + '">' + escapeHtml(abbr) + '</span>';
                    }).filter(Boolean).join('') || '<span style="color:var(--text-dim);font-size:10px;">No members</span>';
                } catch (e) {
                    membersBar.innerHTML = '<span style="color:var(--text-dim);font-size:10px;">Failed to load</span>';
                }
            });
        }
    }

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
    // Raw row count before block filter. The sentinel decision uses
    // rawCount so a filtered-to-zero page (all senders blocked) still
    // paginates back into older history.
    let rawCount = 0;

    // Reset pagination cursor for a fresh load; loadOlderMessages() walks
    // backwards from this timestamp for infinite-scroll history.
    _oldestLoadedTs = null;
    _pinnedMessages = [];

    try {
        if (chat.type === 'dm') {
            // Pull the newest MSG_PAGE_SIZE, then reverse so oldest-at-top.
            const { data, error } = await _supabase
                .from('direct_messages')
                .select(DM_MSG_COLS)
                .or(`and(sender_id.eq.${_msgFaction.id},receiver_id.eq.${chat.id}),and(sender_id.eq.${chat.id},receiver_id.eq.${_msgFaction.id})`)
                .order('created_at', { ascending: false })
                .limit(MSG_PAGE_SIZE);

            if (error) throw error;
            const rows = (data || []).slice().reverse();
            rawCount = rows.length;
            messages = rows.map(m => dmMsgRowToMessage(m));
            if (rows.length > 0) _oldestLoadedTs = rows[0].created_at;

            // Mark unread DMs as read — exclude tombstoned rows.
            const unreadIds = rows
                .filter(m => m.receiver_id === _msgFaction.id && !m.read_at && !m.deleted_at)
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
                .select(GROUP_MSG_COLS)
                .eq('chat_id', chat.id)
                .order('created_at', { ascending: false })
                .limit(MSG_PAGE_SIZE);

            if (error) throw error;
            const rows = (data || []).slice().reverse();
            rawCount = rows.length;

            const senderIds = [...new Set(rows.map(m => m.sender_id).filter(Boolean))];
            await loadFactionNames(senderIds);

            messages = rows.map(m => groupMsgRowToMessage(m));
            if (rows.length > 0) _oldestLoadedTs = rows[0].created_at;

            // Load pinned messages for the strip. Separate query because they
            // may be outside the current page window.
            await loadPinnedMessages(chat.id);

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

    // Sentinel is gated on rawCount (server page size), not
    // messages.length, so pagination still works on a sparse page.
    const sentinel = rawCount >= MSG_PAGE_SIZE
        ? `<button class="msg-load-earlier" id="msg-load-earlier">Load earlier messages</button>`
        : '';
    if (messages.length === 0 && _pinnedMessages.length === 0 && !sentinel) {
        container.innerHTML = `<div class="msg-empty"><div class="msg-empty__text">No messages yet.<br>Send the first message!</div></div>`;
    } else {
        container.innerHTML = sentinel + messages.map(m => renderMessage(m)).join('');
    }

    renderPinnedStrip();

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function dmMsgRowToMessage(m) {
    return {
        id: m.id,
        senderId: m.sender_id,
        text: m.message_text,
        createdAt: m.created_at,
        tick: m.sent_at_tick,
        isMine: m.sender_id === _msgFaction.id,
        isSystem: false,
        editedAt: m.edited_at,
        deletedAt: m.deleted_at,
    };
}

function groupMsgRowToMessage(m) {
    return {
        id: m.id,
        senderId: m.sender_id,
        text: m.message_text,
        createdAt: m.created_at,
        tick: m.sent_at_tick,
        isMine: m.sender_id === _msgFaction.id,
        isSystem: m.is_system,
        editedAt: m.edited_at,
        deletedAt: m.deleted_at,
        pinnedAt: m.pinned_at,
    };
}

// ── Pagination: fetch and prepend the batch before _oldestLoadedTs ────
async function loadOlderMessages() {
    if (_loadingOlder || !_oldestLoadedTs || !_msgActiveChat) return;
    _loadingOlder = true;
    const sentinel = document.getElementById('msg-load-earlier');
    if (sentinel) { sentinel.disabled = true; sentinel.textContent = 'Loading...'; }

    const chat = _msgActiveChat;
    const container = document.getElementById('msg-messages');
    // Remember the scroll delta from the top so we can restore position
    // after the prepend — otherwise the view jumps.
    const prevScrollHeight = container ? container.scrollHeight : 0;

    try {
        let rows = [];
        if (chat.type === 'dm') {
            const { data, error } = await _supabase
                .from('direct_messages')
                .select(DM_MSG_COLS)
                .or(`and(sender_id.eq.${_msgFaction.id},receiver_id.eq.${chat.id}),and(sender_id.eq.${chat.id},receiver_id.eq.${_msgFaction.id})`)
                .lt('created_at', _oldestLoadedTs)
                .order('created_at', { ascending: false })
                .limit(MSG_PAGE_SIZE);
            if (error) throw error;
            rows = (data || []).slice().reverse();
            const older = rows.map(dmMsgRowToMessage);
            prependMessages(older, rows, container, prevScrollHeight);
        } else if (chat.type === 'group') {
            const { data, error } = await _supabase
                .from('group_chat_messages')
                .select(GROUP_MSG_COLS)
                .eq('chat_id', chat.id)
                .lt('created_at', _oldestLoadedTs)
                .order('created_at', { ascending: false })
                .limit(MSG_PAGE_SIZE);
            if (error) throw error;
            rows = (data || []).slice().reverse();
            const senderIds = [...new Set(rows.map(m => m.sender_id).filter(Boolean))];
            await loadFactionNames(senderIds);
            const older = rows.map(groupMsgRowToMessage);
            prependMessages(older, rows, container, prevScrollHeight);
        }
    } catch (e) {
        console.warn('[Messaging] Failed to load older messages:', e);
        if (sentinel) { sentinel.disabled = false; sentinel.textContent = 'Load earlier messages'; }
    } finally {
        _loadingOlder = false;
    }
}

function prependMessages(msgs, rawRows, container, prevScrollHeight) {
    const sentinel = document.getElementById('msg-load-earlier');
    if (!container) return;

    if (rawRows.length === 0) {
        if (sentinel) sentinel.remove();
        return;
    }

    _oldestLoadedTs = rawRows[0].created_at;
    const html = msgs.map(m => renderMessage(m)).join('');
    if (sentinel) {
        sentinel.insertAdjacentHTML('afterend', html);
        // Remove sentinel if this batch came back short — nothing older.
        if (rawRows.length < MSG_PAGE_SIZE) sentinel.remove();
        else { sentinel.disabled = false; sentinel.textContent = 'Load earlier messages'; }
    } else {
        container.insertAdjacentHTML('afterbegin', html);
    }
    // Preserve scroll position so the view doesn't jump when we prepend.
    container.scrollTop = container.scrollHeight - prevScrollHeight;
}

function renderMessage(msg) {
    if (msg.isSystem) {
        return `<div class="msg-msg msg-msg--system">${escapeHtml(msg.text)}</div>`;
    }

    // Phase 5: tombstoned messages render as a placeholder with no body
    // or actions — we keep the row for context but hide the content.
    if (msg.deletedAt) {
        return `<div class="msg-msg msg-msg--${msg.isMine ? 'sent' : 'received'} msg-msg--deleted" data-msg-id="${escapeHtml(msg.id)}">
            <div>[message deleted]</div>
            <div class="msg-msg__time">${formatMsgTime(msg.createdAt)}</div>
        </div>`;
    }

    const cls = msg.isMine ? 'msg-msg msg-msg--sent' : 'msg-msg msg-msg--received';
    const timeStr = formatMsgTime(msg.createdAt);
    const editedTag = msg.editedAt ? `<span class="msg-msg__edited" title="Edited ${formatMsgTime(msg.editedAt)}">(edited)</span>` : '';
    const pinnedTag = msg.pinnedAt ? `<span class="msg-msg__pinned" title="Pinned">📌</span>` : '';

    // Phase 4 identity row (received-only, group-only).
    let headerHtml = '';
    if (!msg.isMine && _msgActiveChat?.type === 'group' && msg.senderId) {
        const cached = _threadFactionCache[msg.senderId];
        const color = cached?.party_color || '#888';
        const name = cached?.faction_name || cached?.abbreviation || '...';
        const abbr = (cached?.abbreviation || cached?.faction_name || '?').slice(0, 3).toUpperCase();
        const chatType = _msgActiveChat?.chatType;

        let extraHtml = '';
        if (chatType === 'global' && cached?.nation_name) {
            const flagUrl = NATION_FLAG_URLS[cached.nation_name];
            if (flagUrl) {
                extraHtml = `<img class="msg-msg__flag" src="${escapeHtml(flagUrl)}" alt="${escapeHtml(cached.nation_name)}" title="${escapeHtml(cached.nation_name)}" />`;
            } else {
                extraHtml = `<span class="msg-msg__nation">[${escapeHtml(cached.nation_name)}]</span>`;
            }
        } else if (chatType === 'nation' && cached?.faction_type === 'corporation' && cached?.corp_sector) {
            extraHtml = `<span class="msg-msg__sector" title="Sector">${escapeHtml(cached.corp_sector)}</span>`;
        }

        const clickable = !!cached;
        const nameplateAttrs = clickable
            ? `data-msg-action="open-profile" data-faction-id="${escapeHtml(msg.senderId)}" role="button" tabindex="0" title="View profile"`
            : `style="cursor:default;"`;
        headerHtml = `<div class="msg-msg__header">
            <div class="msg-msg__avatar" style="color:${escapeHtml(color)};border-color:${escapeHtml(color)};">${escapeHtml(abbr)}</div>
            <div class="msg-msg__nameplate" ${nameplateAttrs}>
                <span class="msg-msg__name" style="color:${escapeHtml(color)};">${escapeHtml(name)}</span>
                ${extraHtml}
            </div>
        </div>`;
    }

    // Own messages get an Edit/Delete menu; others have no actions, so
    // no ⋯ button. Menu is built on demand in openMessageMenu().
    const menuBtn = msg.isMine
        ? `<button class="msg-msg__menu-btn" data-msg-action="msg-menu" data-msg-id="${escapeHtml(msg.id)}" aria-label="Message actions" title="Actions">⋯</button>`
        : '';

    // msg-msg__text is its own span so beginEditMessage() can pull the
    // original text cleanly without dragging in the pin icon or edited
    // tag that may be siblings inside __body.
    return `<div class="${cls}" data-msg-id="${escapeHtml(msg.id)}">
        ${headerHtml}
        ${menuBtn}
        <div class="msg-msg__body">${pinnedTag}<span class="msg-msg__text">${escapeHtml(msg.text)}</span>${editedTag}</div>
        <div class="msg-msg__time">${timeStr}</div>
    </div>`;
}

// ── Identity popover (Phase 4) ────────────────────────────────────────
// Opens on nameplate click. Shows nation + faction type + a link to the
// nation profile page. Single popover at a time; dismissed on outside
// click or Escape. Listener is installed once in injectHTML().
let _identityPopoverEl = null;
function closeIdentityPopover() {
    if (_identityPopoverEl && _identityPopoverEl.parentNode) {
        _identityPopoverEl.parentNode.removeChild(_identityPopoverEl);
    }
    _identityPopoverEl = null;
}
function openIdentityPopover(anchorEl, factionId) {
    closeIdentityPopover();
    const cached = _threadFactionCache[factionId];
    if (!cached || !factionId) return;
    const panel = document.getElementById('msg-panel');
    if (!panel) return;

    const color = cached.party_color || '#888';
    // Known enum values get friendly labels; anything else is title-cased
    // so a future faction_type enum addition doesn't render as raw snake.
    const rawType = cached.faction_type;
    const typeLabel = rawType === 'corporation' ? 'Corporation'
        : rawType === 'party' ? 'Political Party'
        : rawType
            ? rawType.charAt(0).toUpperCase() + rawType.slice(1).replace(/_/g, ' ')
            : 'Faction';
    const nationName = cached.nation_name || '';
    const flagUrl = nationName ? NATION_FLAG_URLS[nationName] : '';
    const slug = nationNameToSlug(nationName);

    const pop = document.createElement('div');
    pop.className = 'msg-identity-popover';
    pop.setAttribute('role', 'dialog');
    pop.innerHTML = `
        <div class="msg-identity-popover__name" style="color:${escapeHtml(color)};">${escapeHtml(cached.faction_name || cached.abbreviation || '?')}</div>
        <div class="msg-identity-popover__row">
            ${flagUrl ? `<img src="${escapeHtml(flagUrl)}" alt="${escapeHtml(nationName)}" />` : ''}
            <span>${nationName ? escapeHtml(nationName) : 'No nation'}</span>
        </div>
        <div class="msg-identity-popover__row">
            <span>${escapeHtml(typeLabel)}${rawType === 'corporation' && cached.corp_sector ? ' — ' + escapeHtml(cached.corp_sector) : ''}</span>
        </div>
        ${slug ? `<a class="msg-identity-popover__link" href="nation-info.html?name=${encodeURIComponent(slug)}" target="_blank" rel="noopener">View Nation &rarr;</a>` : ''}
    `;
    panel.appendChild(pop);

    // Position the popover near the anchor. Panel is position:fixed, the
    // popover is position:absolute so coords are relative to the panel.
    // Clamp inside the panel on both axes; if there isn't room below the
    // anchor, flip above so the popover stays fully visible.
    const panelRect = panel.getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();
    const popWidth = pop.offsetWidth;
    const popHeight = pop.offsetHeight;

    let left = anchorRect.left - panelRect.left;
    const maxLeft = panel.clientWidth - popWidth - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;

    let top = anchorRect.bottom - panelRect.top + 4;
    if (top + popHeight > panel.clientHeight - 8) {
        // Not enough room below — flip above the anchor.
        top = anchorRect.top - panelRect.top - popHeight - 4;
    }
    if (top < 8) top = 8;

    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
    // Stamp the factionId so the nameplate click handler can detect a
    // click on the same anchor and toggle the popover closed.
    pop.dataset.factionId = factionId;

    _identityPopoverEl = pop;
}

// ── Toast (Phase 5) ───────────────────────────────────────────────────
// Ephemeral banner anchored to the active panel. Used for rate-limit,
// mute, edit-window, and other trigger-thrown errors so users see a
// clear reason rather than a generic "failed to send".
function showToast(message, kind) {
    const panel = document.getElementById('msg-panel');
    if (!panel) return;
    const existing = panel.querySelector('.msg-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.className = 'msg-toast' + (kind === 'success' ? ' msg-toast--success' : '');
    t.textContent = message;
    panel.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 4500);
}

// Trigger-raised exceptions (SQLSTATE P0001) come back on the supabase
// error object with a human-readable message. Extract it; fall back
// to the raw error message. Used by sendMessage, editMessage etc.
function extractTriggerMessage(err) {
    const m = err?.message || '';
    // Supabase wraps as: 'Rate limit: max 3 messages per 10 seconds ...'
    return m.replace(/^[A-Z0-9]+:\s*/, '');
}

// ── Per-message actions menu (Phase 5) ────────────────────────────────
// Opens below the ⋯ button on a message. Choices depend on who owns
// the message and whether we're still inside the edit window.
let _messageMenuEl = null;
function closeMessageMenu() {
    if (_messageMenuEl && _messageMenuEl.parentNode) {
        _messageMenuEl.parentNode.removeChild(_messageMenuEl);
    }
    _messageMenuEl = null;
}
function openMessageMenu(btnEl, msgId) {
    closeMessageMenu();
    const msgEl = btnEl.closest('.msg-msg');
    if (!msgEl) return;
    const isMine = msgEl.classList.contains('msg-msg--sent');

    const menu = document.createElement('div');
    menu.className = 'msg-msg__menu';
    const items = [];
    if (isMine) {
        items.push(`<button class="msg-msg__menu-item" data-msg-action="edit" data-msg-id="${escapeHtml(msgId)}">Edit</button>`);
        items.push(`<button class="msg-msg__menu-item msg-msg__menu-item--danger" data-msg-action="delete" data-msg-id="${escapeHtml(msgId)}">Delete</button>`);
    }
    if (items.length === 0) return;   // nothing actionable (not our message)
    menu.innerHTML = items.join('');
    msgEl.appendChild(menu);
    _messageMenuEl = menu;
}

// ── Edit message (Phase 5, own + within edit window) ──────────────────
async function beginEditMessage(msgId) {
    closeMessageMenu();
    if (!_msgActiveChat) return;
    const msgEl = document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(msgId)}"]`);
    if (!msgEl) return;
    const bodyEl = msgEl.querySelector('.msg-msg__body');
    const textEl = msgEl.querySelector('.msg-msg__text');
    if (!bodyEl || !textEl) return;
    const originalText = textEl.textContent;

    const editUi = document.createElement('div');
    editUi.className = 'msg-msg__edit';
    editUi.innerHTML = `
        <textarea maxlength="2000"></textarea>
        <div class="msg-msg__edit-row">
            <button data-msg-action="edit-cancel">Cancel</button>
            <button class="primary" data-msg-action="edit-save" data-msg-id="${escapeHtml(msgId)}">Save</button>
        </div>
    `;
    bodyEl.style.display = 'none';
    msgEl.appendChild(editUi);
    const ta = editUi.querySelector('textarea');
    ta.value = originalText;
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    // Escape cancels the edit without saving.
    ta.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') { ev.preventDefault(); cancelEditMessage(msgEl); }
    });
}

function cancelEditMessage(msgEl) {
    const editUi = msgEl.querySelector('.msg-msg__edit');
    if (editUi) editUi.remove();
    const bodyEl = msgEl.querySelector('.msg-msg__body');
    if (bodyEl) bodyEl.style.display = '';
}

async function saveEditMessage(msgId) {
    const msgEl = document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(msgId)}"]`);
    if (!msgEl) return;
    const ta = msgEl.querySelector('.msg-msg__edit textarea');
    if (!ta) return;
    const newText = ta.value.trim();
    if (!newText) { showToast('Message cannot be empty'); return; }
    if (!_msgActiveChat) return;

    const saveBtn = msgEl.querySelector('[data-msg-action="edit-save"]');
    if (saveBtn) saveBtn.disabled = true;

    const table = _msgActiveChat.type === 'dm' ? 'direct_messages' : 'group_chat_messages';
    try {
        const { error } = await _supabase
            .from(table)
            .update({ message_text: newText })
            .eq('id', msgId);
        if (error) throw error;

        // Refresh the rendered body in place: swap the text span, ensure
        // an (edited) tag is present. Pin icon (if any) stays untouched.
        cancelEditMessage(msgEl);
        const textEl = msgEl.querySelector('.msg-msg__text');
        if (textEl) textEl.textContent = newText;
        const bodyEl = msgEl.querySelector('.msg-msg__body');
        if (bodyEl && !bodyEl.querySelector('.msg-msg__edited')) {
            const tag = document.createElement('span');
            tag.className = 'msg-msg__edited';
            tag.textContent = '(edited)';
            bodyEl.appendChild(tag);
        }
        showToast('Message updated', 'success');
    } catch (err) {
        console.warn('[Messaging] Edit failed:', err);
        showToast('Edit failed: ' + extractTriggerMessage(err));
        if (saveBtn) saveBtn.disabled = false;
    }
}

// ── Delete message (Phase 5, soft-delete via deleted_at) ──────────────
async function deleteOwnMessage(msgId) {
    closeMessageMenu();
    if (!_msgActiveChat) return;
    if (!confirm('Delete this message? This cannot be undone.')) return;

    const table = _msgActiveChat.type === 'dm' ? 'direct_messages' : 'group_chat_messages';
    try {
        const patch = _msgActiveChat.type === 'dm'
            ? { deleted_at: new Date().toISOString() }
            : { deleted_at: new Date().toISOString(), deleted_by: _msgFaction.id };
        const { error } = await _supabase.from(table).update(patch).eq('id', msgId);
        if (error) throw error;

        // Mutate the existing bubble into a tombstone so we keep the
        // original time display and avoid a re-render that would break
        // if the row was in the process of being edited.
        const msgEl = document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(msgId)}"]`);
        if (msgEl) {
            msgEl.classList.add('msg-msg--deleted');
            const bodyEl = msgEl.querySelector('.msg-msg__body');
            if (bodyEl) bodyEl.innerHTML = '[message deleted]';
            const menuBtn = msgEl.querySelector('.msg-msg__menu-btn');
            if (menuBtn) menuBtn.remove();
            const header = msgEl.querySelector('.msg-msg__header');
            if (header) header.remove();
        }
    } catch (err) {
        console.warn('[Messaging] Delete failed:', err);
        showToast('Delete failed: ' + extractTriggerMessage(err));
    }
}

// ── Pinned messages (Phase 5) ─────────────────────────────────────────
// Populated by loadAndRenderMessages on open; rendered into a strip
// above the messages scroll area. Max 3 (enforced server-side).
async function loadPinnedMessages(chatId) {
    try {
        const { data, error } = await _supabase
            .from('group_chat_messages')
            .select('id, sender_id, message_text, created_at, pinned_at, deleted_at')
            .eq('chat_id', chatId)
            .not('pinned_at', 'is', null)
            .is('deleted_at', null)
            .order('pinned_at', { ascending: false })
            .limit(3);
        if (error) throw error;
        _pinnedMessages = data || [];
        const senderIds = [...new Set(_pinnedMessages.map(m => m.sender_id).filter(Boolean))];
        if (senderIds.length > 0) await loadFactionNames(senderIds);
    } catch (e) {
        console.warn('[Messaging] Failed to load pinned messages:', e);
        _pinnedMessages = [];
    }
}

function renderPinnedStrip() {
    const existing = document.getElementById('msg-pinned-strip');
    if (existing) existing.remove();
    if (!_pinnedMessages || _pinnedMessages.length === 0) return;
    const container = document.getElementById('msg-messages');
    if (!container || !container.parentNode) return;

    const strip = document.createElement('div');
    strip.id = 'msg-pinned-strip';
    strip.className = 'msg-pinned-strip';
    const items = _pinnedMessages.map(m => {
        const cached = _threadFactionCache[m.sender_id];
        const who = cached?.abbreviation || cached?.faction_name || '?';
        const text = (m.message_text || '').slice(0, 120);
        return `<div class="msg-pinned-strip__item">📌 <strong>${escapeHtml(who)}</strong>: ${escapeHtml(text)}</div>`;
    }).join('');
    strip.innerHTML = `<div class="msg-pinned-strip__hdr">Pinned · ${_pinnedMessages.length}/3</div>${items}`;
    container.parentNode.insertBefore(strip, container);
}

// ── In-channel search (Phase 5, simple LIKE) ──────────────────────────
// Triggered by the header magnifier. Replaces the messages list with a
// filtered view; clearing the query restores the thread.
async function openSearchBar() {
    const body = document.getElementById('msg-body');
    if (!body || !_msgActiveChat) return;
    if (_searchMode) return;
    _searchMode = true;

    const bar = document.createElement('div');
    bar.className = 'msg-search-bar';
    bar.id = 'msg-search-bar';
    bar.innerHTML = `
        <input type="text" id="msg-search-input" placeholder="Search messages..." maxlength="120" />
        <button id="msg-search-close">Close</button>
    `;
    // Insert above the messages container so the results render below it.
    const messages = document.getElementById('msg-messages');
    if (messages && messages.parentNode) messages.parentNode.insertBefore(bar, messages);

    const input = document.getElementById('msg-search-input');
    const close = document.getElementById('msg-search-close');
    let searchTimer = null;
    input.addEventListener('input', () => {
        clearTimeout(searchTimer);
        const q = input.value.trim();
        searchTimer = setTimeout(() => performSearch(q), 200);
    });
    close.addEventListener('click', closeSearchBar);
    input.focus();
}

function closeSearchBar() {
    _searchMode = false;
    const bar = document.getElementById('msg-search-bar');
    if (bar) bar.remove();
    // Reload the thread to restore the full view.
    loadAndRenderMessages();
}

async function performSearch(query) {
    const container = document.getElementById('msg-messages');
    if (!container || !_msgActiveChat) return;
    if (!query) {
        container.innerHTML = `<div class="msg-empty"><div class="msg-empty__text">Type to search this channel.<br>Close to return to the thread.</div></div>`;
        return;
    }

    try {
        let rows = [];
        if (_msgActiveChat.type === 'group') {
            const { data, error } = await _supabase
                .from('group_chat_messages')
                .select(GROUP_MSG_COLS)
                .eq('chat_id', _msgActiveChat.id)
                .is('deleted_at', null)
                .ilike('message_text', `%${query}%`)
                .order('created_at', { ascending: false })
                .limit(MSG_PAGE_SIZE);
            if (error) throw error;
            rows = (data || []).reverse();
            const senderIds = [...new Set(rows.map(m => m.sender_id).filter(Boolean))];
            if (senderIds.length > 0) await loadFactionNames(senderIds);
        } else {
            const { data, error } = await _supabase
                .from('direct_messages')
                .select(DM_MSG_COLS)
                .or(`and(sender_id.eq.${_msgFaction.id},receiver_id.eq.${_msgActiveChat.id}),and(sender_id.eq.${_msgActiveChat.id},receiver_id.eq.${_msgFaction.id})`)
                .is('deleted_at', null)
                .ilike('message_text', `%${query}%`)
                .order('created_at', { ascending: false })
                .limit(MSG_PAGE_SIZE);
            if (error) throw error;
            rows = (data || []).reverse();
        }

        const messages = rows.map(_msgActiveChat.type === 'dm' ? dmMsgRowToMessage : groupMsgRowToMessage);
        if (messages.length === 0) {
            container.innerHTML = `<div class="msg-empty"><div class="msg-empty__text">No matches.</div></div>`;
        } else {
            container.innerHTML = messages.map(m => renderMessage(m)).join('');
        }
    } catch (e) {
        console.warn('[Messaging] Search failed:', e);
        container.innerHTML = `<div class="msg-empty"><div class="msg-empty__text">Search failed.</div></div>`;
    }
}

async function loadFactionNames(factionIds) {
    const toLoad = factionIds.filter(id => !_threadFactionCache[id]);
    if (toLoad.length === 0) return;

    // Two-step lookup: factions first, then their nations. An earlier
    // single-query implementation used the PostgREST embed
    // `nations(id, name)` but that failed silently whenever RLS or FK
    // metadata rejected the join — which meant Global Chat fell back
    // to a "?" avatar + "..." nameplate for every sender. Two queries
    // are strictly more robust.
    //
    // Degrade gracefully: if the factions query fails we can't render
    // anything; if only the nations query fails we still populate the
    // cache with faction_name / abbreviation / party_color and leave
    // nation_name null (no flag, no [Nation] tag, but the identity is
    // still readable).
    let factions = null;
    try {
        const { data, error } = await _supabase
            .from('factions')
            .select('id, faction_name, abbreviation, party_color, faction_type, corp_sector, nation_id')
            .in('id', toLoad);
        if (error) throw error;
        factions = data;
    } catch (e) {
        console.warn('[Messaging] loadFactionNames: factions query failed:', e);
        return;
    }

    const nationIds = [...new Set((factions || []).map(f => f.nation_id).filter(Boolean))];
    const nationMap = {};
    if (nationIds.length > 0) {
        try {
            const { data, error } = await _supabase
                .from('nations')
                .select('id, name')
                .in('id', nationIds);
            if (error) throw error;
            for (const n of (data || [])) nationMap[n.id] = n.name;
        } catch (e) {
            console.warn('[Messaging] loadFactionNames: nations query failed (nameplates will render without flag/tag):', e);
        }
    }

    for (const f of (factions || [])) {
        _threadFactionCache[f.id] = {
            id: f.id,
            faction_name: f.faction_name,
            abbreviation: f.abbreviation,
            party_color: f.party_color,
            faction_type: f.faction_type,
            corp_sector: f.corp_sector,
            nation_id: f.nation_id,
            nation_name: f.nation_id ? (nationMap[f.nation_id] || null) : null,
        };
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

        // .select().single() round-trips so the optimistic render uses
        // the real row id. Without this, Phase 5 Edit/Delete on a just-
        // sent message targets a 'temp-...' id that no row has.
        let row = null;
        if (chat.type === 'dm') {
            const { data, error } = await _supabase.from('direct_messages')
                .insert({
                    sender_id: _msgFaction.id,
                    receiver_id: chat.id,
                    message_text: text,
                    sent_at_tick: tick,
                })
                .select('id, created_at')
                .single();
            if (error) throw error;
            row = data;
        } else if (chat.type === 'group') {
            const { data, error } = await _supabase.from('group_chat_messages')
                .insert({
                    chat_id: chat.id,
                    sender_id: _msgFaction.id,
                    is_system: false,
                    message_text: text,
                    sent_at_tick: tick,
                })
                .select('id, created_at')
                .single();
            if (error) throw error;
            row = data;
        }

        // Append the real row.
        const container = document.getElementById('msg-messages');
        if (container && row) {
            const empty = container.querySelector('.msg-empty');
            if (empty) empty.remove();

            container.insertAdjacentHTML('beforeend', renderMessage({
                id: row.id,
                senderId: _msgFaction.id,
                text,
                createdAt: row.created_at,
                tick,
                isMine: true,
                isSystem: false,
            }));
            container.scrollTop = container.scrollHeight;
        }

    } catch (err) {
        console.warn('[Messaging] Send failed:', err);
        // Restore the text so the user doesn't lose it. P0001 exceptions
        // from the rate-limit / mute / ban triggers carry a readable
        // reason — surface it via the toast instead of an alert().
        input.value = text;
        showToast(extractTriggerMessage(err) || 'Failed to send message.');
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
        <div class="msg-role-section">
            <div class="msg-role-section-title">Message by Role</div>
            <select class="msg-nation-select" id="msg-role-nation">
                <option value="">Select a nation...</option>
            </select>
            <div id="msg-role-results"></div>
        </div>
        <div style="padding:8px 14px;border-bottom:1px solid var(--border-main, rgba(0,0,0,0.08));">
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

    // Populate nation dropdown for role-based messaging (async, non-blocking)
    (async () => { try {
        const { data: nations } = await _supabase.from('nations').select('id, name').order('name');
        const nationSelect = document.getElementById('msg-role-nation');
        if (nationSelect && nations) {
            nationSelect.innerHTML = '<option value="">Select a nation...</option>' +
                nations.map(n => '<option value="' + n.id + '">' + escapeHtml(n.name) + '</option>').join('');
            nationSelect.addEventListener('change', () => loadRolesForNation(nationSelect.value));
        }
    } catch (_) {} })();
}

async function loadRolesForNation(nationId) {
    const container = document.getElementById('msg-role-results');
    if (!container) return;
    if (!nationId) { container.innerHTML = ''; return; }
    container.innerHTML = '<span style="color:var(--text-dim);font-size:10px;">Loading roles...</span>';

    try {
        // Load ministries (FM, MoT, PM), coalition, and ruling faction
        const [minRes, coalRes, natRes] = await Promise.all([
            _supabase.from('ministries')
                .select('ministry_key, party_id, factions(id, faction_name, abbreviation, party_color)')
                .eq('nation_id', nationId)
                .in('ministry_key', ['foreign', 'trade', 'prime_minister'])
                .eq('is_active', true),
            _supabase.from('government_formations')
                .select('ministry_assignments, proposed_by')
                .eq('nation_id', nationId)
                .eq('status', 'formed')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
            _supabase.from('nations').select('ruling_faction_id').eq('id', nationId).single()
        ]);

        const roles = [];

        // Head of Government
        const pmMinistry = (minRes.data || []).find(m => m.ministry_key === 'prime_minister');
        const hogFactionId = deriveLeadPartyId(coalRes.data) || natRes.data?.ruling_faction_id || pmMinistry?.party_id;
        if (hogFactionId) {
            const f = pmMinistry?.factions || (minRes.data || []).find(m => m.party_id === hogFactionId)?.factions;
            if (f) roles.push({ role: 'Head of Government', faction: f });
            else {
                const { data: hogF } = await _supabase.from('factions').select('id, faction_name, abbreviation, party_color').eq('id', hogFactionId).single();
                if (hogF) roles.push({ role: 'Head of Government', faction: hogF });
            }
        }

        // Foreign Minister
        const fmEntry = (minRes.data || []).find(m => m.ministry_key === 'foreign');
        if (fmEntry?.factions) roles.push({ role: 'Foreign Minister', faction: fmEntry.factions });

        // Minister of Trade
        const motEntry = (minRes.data || []).find(m => m.ministry_key === 'trade');
        if (motEntry?.factions) roles.push({ role: 'Minister of Trade', faction: motEntry.factions });

        if (roles.length === 0) {
            container.innerHTML = '<span style="color:var(--text-dim);font-size:10px;">No diplomatic roles found for this nation.</span>';
            return;
        }

        container.innerHTML = roles.map(r => {
            const f = r.faction;
            const color = f.party_color || '#666';
            const abbr = (f.abbreviation || f.faction_name || '?').slice(0, 4);
            const isSelf = f.id === _msgFaction.id;
            return '<div class="msg-role-row" data-role-faction-id="' + f.id + '"' + (isSelf ? ' style="opacity:0.4;cursor:default;" title="This is you"' : '') + '>' +
                '<span class="msg-role-badge">' + escapeHtml(r.role) + '</span>' +
                '<span class="msg-role-party" style="color:' + escapeHtml(color) + ';">' + escapeHtml(abbr) + ' — ' + escapeHtml(f.faction_name) + '</span>' +
            '</div>';
        }).join('');

        container.querySelectorAll('.msg-role-row').forEach(el => {
            const fid = el.dataset.roleFactionId;
            if (fid === _msgFaction.id) return; // can't message yourself
            el.addEventListener('click', () => {
                const role = roles.find(r => r.faction.id === fid);
                if (role) openThread({ type: 'dm', id: fid, name: role.faction.faction_name, faction: role.faction });
            });
        });
    } catch (e) {
        console.warn('[Messaging] Role lookup failed:', e);
        container.innerHTML = '<span style="color:var(--text-dim);font-size:10px;">Failed to load roles.</span>';
    }
}

async function searchParties(query) {
    const container = document.getElementById('msg-search-results');
    if (!container) return;

    // Sanitize query for Supabase ilike filter (escape special chars)
    const safeQuery = (query || '').replace(/[%_\\]/g, '');

    if (!safeQuery) {
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
                .or(`faction_name.ilike.%${safeQuery}%,abbreviation.ilike.%${safeQuery}%,nation.ilike.%${safeQuery}%`)
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
        <div style="padding:8px 14px;border-bottom:1px solid var(--border-main, rgba(0,0,0,0.08));">
            <input type="text" class="msg-input" id="msg-group-name" placeholder="Group chat name..." maxlength="100" style="width:100%;margin-bottom:6px;" />
            <input type="text" class="msg-input" id="msg-group-search" placeholder="Search parties to add..." style="width:100%;" />
        </div>
        <div id="msg-group-selected" style="padding:4px 14px;display:none;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--border-main, rgba(0,0,0,0.08));"></div>
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

    const safeQuery = (query || '').replace(/[%_\\]/g, '');
    let results = [];
    try {
        if (!safeQuery) {
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
                .or(`faction_name.ilike.%${safeQuery}%,abbreviation.ilike.%${safeQuery}%,nation.ilike.%${safeQuery}%`)
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

function mapCreateGroupChatError(err) {
    const message = (err?.message || '').toLowerCase();
    const code = err?.code || '';

    if (code === '42501' || message.includes('not authenticated') || message.includes('authentication required')) {
        return 'You must be signed in to create a group chat.';
    }

    if (message.includes('no faction linked')) {
        return 'No faction is linked to your account yet. Reload and try again.';
    }

    if (message.includes('select at least one other member')) {
        return 'Select at least one other faction before creating a group chat.';
    }

    if (message.includes('100 characters or fewer')) {
        return 'Group chat name must be 100 characters or fewer.';
    }

    if (message.includes('selected members were not found')) {
        return 'One or more selected factions could not be found. Refresh the member list and try again.';
    }

    if (code === '23505') {
        return 'This group already exists with the selected members.';
    }

    if (message.includes('row-level security') || code === 'PGRST301') {
        return 'You do not have permission to create this group chat.';
    }

    return err?.message || 'Unknown error';
}

async function createGroupChat() {
    const nameInput = document.getElementById('msg-group-name');
    const btn = document.getElementById('msg-create-group');
    const chatName = nameInput?.value?.trim() || 'Group Chat';

    if (_groupSelectIds.size === 0) return;
    if (btn) btn.disabled = true;

    try {
        const { data: rpcData, error: rpcErr } = await _supabase.rpc('create_custom_group_chat', {
            chat_name: chatName,
            member_ids: Array.from(_groupSelectIds),
        });
        if (rpcErr) throw rpcErr;

        const created = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        const newChatId = created?.chat_id;
        const newChatName = created?.name || chatName;
        if (!newChatId) throw new Error('Group chat creation returned no chat id');

        // Open the new chat thread
        const headerTitle = document.querySelector('.msg-panel__title');
        if (headerTitle) headerTitle.textContent = 'Messages';
        openThread({ type: 'group', id: newChatId, name: newChatName, chatType: 'custom' });

    } catch (err) {
        console.error('[Messaging] Create group failed:', err);
        alert('Failed to create group chat: ' + mapCreateGroupChatError(err));
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

    // Ensure we're a member (best-effort — silently skip RLS failures for admin/spectator views)
    const { error: joinErr } = await _supabase
        .from('group_chat_members')
        .upsert({ chat_id: chatId, faction_id: _msgFaction.id }, { onConflict: 'chat_id,faction_id' });
    if (joinErr) return; // RLS rejected — likely admin without faction ownership

    // Sync all parties in this nation as members (best-effort, silently skip RLS failures)
    try {
        const { data: parties } = await _supabase
            .from('factions')
            .select('id')
            .eq('nation_id', _msgNation.id)
            .eq('faction_type', 'party')
            .not('nation_id', 'is', null);

        // Only add others if WE created the chat (RLS allows creator to add members)
        const { data: chatRow } = await _supabase.from('group_chats').select('created_by').eq('id', chatId).single();
        const isCreator = chatRow?.created_by === _msgFaction.id;

        if (isCreator && parties && parties.length > 0) {
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

    // Ensure we're a member (best-effort — silently skip RLS failures for admin/spectator views)
    const { error: joinErr } = await _supabase
        .from('group_chat_members')
        .upsert({ chat_id: chatId, faction_id: _msgFaction.id }, { onConflict: 'chat_id,faction_id' });
    if (joinErr) return; // RLS rejected — likely admin without faction ownership

    // Sync all active IPO members into the group chat (best-effort, only if we created the chat)
    try {
        const { data: chatRow } = await _supabase.from('group_chats').select('created_by').eq('id', chatId).single();
        const isCreator = chatRow?.created_by === _msgFaction.id;

        if (isCreator) {
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
        }
    } catch (_) { /* best-effort sync */ }
}

// ── Realtime subscriptions ──
function setupRealtime() {
    if (!_msgFaction?.id) return;
    cleanupRealtime();

    // Subscribe to new DMs where we are the receiver
    _realtimeChannel = _supabase
        .channel('msg-dm-' + _msgFaction.id)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `receiver_id=eq.${_msgFaction.id}`,
        }, (payload) => {
            onNewDM(payload.new);
        })
        .subscribe();

    // Subscribe to group chat messages — we subscribe to ALL inserts
    // and filter client-side by checking if the chat is one we're in.
    // This is simpler than managing per-chat subscriptions.
    _groupRealtimeChannel = _supabase
        .channel('msg-gc-' + _msgFaction.id)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'group_chat_messages',
        }, (payload) => {
            onNewGroupMessage(payload.new);
        })
        .subscribe();
}

function cleanupRealtime() {
    if (_realtimeChannel) {
        _supabase.removeChannel(_realtimeChannel);
        _realtimeChannel = null;
    }
    if (_groupRealtimeChannel) {
        _supabase.removeChannel(_groupRealtimeChannel);
        _groupRealtimeChannel = null;
    }
}

function onNewDM(msg) {
    if (!msg || msg.sender_id === _msgFaction.id) return;

    // If we're in the thread with this sender, append and mark read
    if (_msgPanelOpen && _msgView === 'thread' && _msgActiveChat?.type === 'dm' && _msgActiveChat.id === msg.sender_id) {
        const container = document.getElementById('msg-messages');
        if (container) {
            const empty = container.querySelector('.msg-empty');
            if (empty) empty.remove();
            container.insertAdjacentHTML('beforeend', renderMessage({
                id: msg.id,
                senderId: msg.sender_id,
                text: msg.message_text,
                createdAt: msg.created_at,
                tick: msg.sent_at_tick,
                isMine: false,
                isSystem: false,
            }));
            container.scrollTop = container.scrollHeight;
        }
        // Mark as read
        _supabase.from('direct_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', msg.id)
            .then(() => {});
        return;
    }

    // Refresh the chat list if it's visible so the new message bubbles
    // up to the top.
    if (_msgPanelOpen && _msgView === 'list') {
        renderChatList();
    }
}

function onNewGroupMessage(msg) {
    if (!msg || msg.sender_id === _msgFaction.id) return;

    // Check if this message is in a chat we're a member of
    const inOurChat = _groupChats.some(g => g.chat.id === msg.chat_id);
    if (!inOurChat) return; // not our chat

    // If we're viewing this thread, append live
    if (_msgPanelOpen && _msgView === 'thread' && _msgActiveChat?.type === 'group' && _msgActiveChat.id === msg.chat_id) {
        // Load sender name if needed
        const renderAndAppend = async () => {
            if (msg.sender_id && !_threadFactionCache[msg.sender_id]) {
                await loadFactionNames([msg.sender_id]);
            }
            const container = document.getElementById('msg-messages');
            if (container) {
                const empty = container.querySelector('.msg-empty');
                if (empty) empty.remove();
                container.insertAdjacentHTML('beforeend', renderMessage({
                    id: msg.id,
                    senderId: msg.sender_id,
                    text: msg.message_text,
                    createdAt: msg.created_at,
                    tick: msg.sent_at_tick,
                    isMine: false,
                    isSystem: msg.is_system || false,
                }));
                container.scrollTop = container.scrollHeight;
            }
            // Update last_read_at
            _supabase.from('group_chat_members')
                .update({ last_read_at: new Date().toISOString() })
                .eq('chat_id', msg.chat_id)
                .eq('faction_id', _msgFaction.id)
                .then(() => {});
        };
        renderAndAppend();
        return;
    }

    if (_msgPanelOpen && _msgView === 'list') {
        renderChatList();
    }
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

    // Sync auto-chats and prime the group chat list (per-chat unread
    // counts populate from realtime + the membership last_read_at, so
    // we only need to load the membership; navbar notifications track
    // total unread separately).
    syncAutoChats().then(() => loadGroupChats());

    // Start realtime subscriptions
    setupRealtime();
}
