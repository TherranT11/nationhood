import{_ as l}from"./supabase-client-BXEzLDpS.js";import{a as c}from"./utils-CzgKGX6o.js";import{d as ye}from"./government-structure-DBjJ7E-l.js";import"./government-types-BeJIFjWQ.js";let f=null,x=null,ge=null,N=!1,L="list",O="all",h=null,W=null,V=null,T=null,K=!1,C=[],U=!1;const z=50,Q="id, sender_id, receiver_id, message_text, created_at, sent_at_tick, read_at, edited_at, deleted_at",ee="id, sender_id, is_system, message_text, created_at, sent_at_tick, edited_at, deleted_at, pinned_at",pe={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png",Sierramar:"assets/flags/Sierramar.png",Dravka:"assets/flags/Dravka.png",Hajjara:"assets/flags/Hajjara.png"};function xe(e){return e?String(e).toLowerCase().replace(/\s+/g,""):""}function we(){if(document.getElementById("msg-styles"))return;const e=document.createElement("style");e.id="msg-styles",e.textContent=`
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
    `,document.head.appendChild(e)}function ke(){if(document.getElementById("msg-bubble"))return;const e=document.createElement("div");e.id="msg-bubble",e.className="msg-bubble",e.innerHTML="💬",e.addEventListener("click",de),document.body.appendChild(e);const a=document.createElement("div");a.id="msg-panel",a.className="msg-panel",a.innerHTML=`
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
    `,document.body.appendChild(a),document.getElementById("msg-close").addEventListener("click",de),document.getElementById("msg-new-dm").addEventListener("click",()=>De()),document.getElementById("msg-new-group").addEventListener("click",()=>Fe());const n=document.getElementById("msg-tabs");n&&n.addEventListener("click",t=>{const i=t.target.closest(".msg-tab");if(!i)return;const s=i.dataset.filter;!s||s===O||(O=s,fe(s),s==="global"?Se():s==="nation"?Ce():q())}),Ee(a),a.addEventListener("click",t=>{const i=t.target.closest("[data-msg-action]"),s=i?.dataset?.msgAction;if(s==="open-profile"){t.stopPropagation();const r=i.dataset.factionId;k&&k.dataset.factionId===r?H():le(i,r);return}if(s==="msg-menu"){t.stopPropagation();const r=i.dataset.msgId;$&&$.parentNode?.dataset?.msgId===r?P():Le(i,r);return}if(s==="edit"){t.stopPropagation(),qe(i.dataset.msgId);return}if(s==="edit-save"){t.stopPropagation(),Ie(i.dataset.msgId);return}if(s==="edit-cancel"){t.stopPropagation();const r=i.closest(".msg-msg");r&&ie(r);return}if(s==="delete"){t.stopPropagation(),ze(i.dataset.msgId);return}if(t.target.id==="msg-load-earlier"){t.stopPropagation(),be();return}$&&!t.target.closest(".msg-msg__menu")&&!t.target.closest(".msg-msg__menu-btn")&&P(),k&&!t.target.closest(".msg-identity-popover")&&H()}),a.addEventListener("keydown",t=>{if(t.key==="Escape"&&k){H();return}(t.key==="Enter"||t.key===" ")&&t.target.matches('[data-msg-action="open-profile"]')&&(t.preventDefault(),le(t.target,t.target.dataset.factionId))}),document.addEventListener("click",t=>{k&&(a.contains(t.target)||H())}),a.addEventListener("scroll",()=>{k&&H()},!0)}function fe(e){document.querySelectorAll(".msg-tab").forEach(a=>a.classList.toggle("msg-tab--active",a.dataset.filter===e))}function Me(e){fe(O),document.querySelectorAll(".msg-tab").forEach(a=>{const n=e[a.dataset.filter]||0,t=a.querySelector(".msg-tab__badge");if(t&&t.remove(),n>0){const i=document.createElement("span");i.className="msg-tab__badge",i.textContent=n>99?"99+":String(n),i.title=n+" unread",a.appendChild(i)}})}const re="msg-panel-size";function Ee(e){if(!e)return;try{const o=localStorage.getItem(re);if(o){const d=JSON.parse(o);d&&typeof d.width=="number"&&typeof d.height=="number"&&(e.style.width=Math.max(320,Math.min(d.width,900))+"px",e.style.height=Math.max(400,Math.min(d.height,900))+"px")}}catch{}if(e.querySelector(".msg-resize-handle"))return;const a=document.createElement("div");a.className="msg-resize-handle",a.title="Drag to resize",e.appendChild(a);let n=!1,t,i,s,r;a.addEventListener("mousedown",o=>{window.innerWidth<=640||(n=!0,t=o.clientX,i=o.clientY,s=e.offsetWidth,r=e.offsetHeight,document.body.style.userSelect="none",o.preventDefault())}),window.addEventListener("mousemove",o=>{if(!n)return;const d=t-o.clientX,g=i-o.clientY,p=Math.max(320,Math.min(s+d,900)),u=Math.max(400,Math.min(r+g,900));e.style.width=p+"px",e.style.height=u+"px"}),window.addEventListener("mouseup",()=>{if(n){n=!1,document.body.style.userSelect="";try{localStorage.setItem(re,JSON.stringify({width:e.offsetWidth,height:e.offsetHeight}))}catch{}}})}function de(){N=!N;const e=document.getElementById("msg-panel"),a=document.getElementById("msg-bubble");!e||!a||(N?(e.classList.add("open"),a.style.display="none",L="list",q()):(e.classList.remove("open"),a.style.display=""))}let I=[],M=[];async function ue(e,a,n){if(!M.length)try{await te()}catch(i){console.warn("[Messaging] Failed to load group chats:",i)}if(O!==e)return;const t=M.find(a);if(!t){q();return}A({type:"group",id:t.chat.id,name:n||t.chat.name,chatType:t.chat.chat_type})}function Se(){return ue("global",e=>e.chat.chat_type==="global")}function Ce(){if(!x?.id){q();return}return ue("nation",e=>e.chat.chat_type==="nation"&&e.chat.nation_id===x.id,"Nation")}async function q(){const e=document.getElementById("msg-body"),a=document.getElementById("msg-actions");a&&(a.style.display=""),L="list";const n=document.querySelector(".msg-panel__title");if(n&&(n.textContent="Messages"),!f){e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No faction selected.</div></div>';return}e.innerHTML='<div class="msg-empty"><div class="msg-empty__text" style="color:var(--text-dim);">Loading...</div></div>';try{await Promise.all([$e(),te()])}catch(m){console.warn("[Messaging] Failed to load chats:",m)}let t="";const i=M.filter(m=>m.chat.chat_type==="global"),s=M.filter(m=>m.chat.chat_type==="ipo"),r=M.filter(m=>m.chat.chat_type==="nation"&&m.chat.nation_id===x?.id),o=M.filter(m=>m.chat.chat_type==="custom"),d=m=>m.reduce((v,_)=>v+(_.unreadCount||0),0),g={global:d(i),nation:d(r),dm:I.reduce((m,v)=>m+(v.unreadCount||0),0)};g.all=g.global+g.nation+g.dm+d(s)+d(o),Me(g);const p=O||"all",u=p==="all"||p==="global",b=p==="all"||p==="nation",y=p==="all",S=p==="all"||p==="dm";if(u&&i.length>0&&(t+='<div class="msg-section-hdr">Global Chat</div>',t+=i.map(m=>Y(m)).join("")),b&&r.length>0&&(t+='<div class="msg-section-hdr">Nation Chat</div>',t+=r.map(m=>Y(m)).join("")),y&&s.length>0&&(t+='<div class="msg-section-hdr">Organisation Chats</div>',t+=s.map(m=>Y(m)).join("")),y&&o.length>0&&(t+='<div class="msg-section-hdr">Group Chats</div>',t+=o.map(m=>Y(m)).join("")),S&&I.length>0&&(t+='<div class="msg-section-hdr">Direct Messages</div>',t+=I.map(m=>Te(m)).join("")),(p==="all"||p==="dm")&&x)try{const{data:m}=await l.from("factions").select("id, faction_name, abbreviation, party_color").eq("nation_id",x.id).eq("faction_type","party").neq("id",f.id).order("faction_name");if(m&&m.length>0){const v=new Set(I.map(w=>w.otherFaction.id)),_=m.filter(w=>!v.has(w.id));_.length>0&&(t+='<div class="msg-section-hdr">Parties in Your Nation</div>',t+=_.map(w=>{const ve=(w.abbreviation||w.faction_name||"?").slice(0,3).toUpperCase(),oe=w.party_color||"#666";return`<div class="msg-chat-item" data-msg-action="start-dm" data-faction-id="${w.id}">
                            <div class="msg-chat-item__avatar" style="color:${c(oe)};border-color:${c(oe)};">${c(ve)}</div>
                            <div class="msg-chat-item__info">
                                <div class="msg-chat-item__name">${c(w.faction_name)}</div>
                                <div class="msg-chat-item__preview">Start a conversation</div>
                            </div>
                        </div>`}).join(""))}}catch(m){console.warn("[Messaging] Failed to load nation parties:",m)}t||(t='<div class="msg-empty"><div class="msg-empty__text">No messages yet.<br>Start a conversation using<br>the buttons above.</div></div>'),e.innerHTML=t,e.querySelectorAll('[data-msg-action="open-dm"]').forEach(m=>{m.addEventListener("click",()=>{const v=m.dataset.factionId,_=I.find(w=>w.otherFaction.id===v);_&&A({type:"dm",id:v,name:_.otherFaction.faction_name,faction:_.otherFaction})})}),e.querySelectorAll('[data-msg-action="open-group"]').forEach(m=>{m.addEventListener("click",()=>{const v=m.dataset.chatId,_=M.find(w=>w.chat.id===v);_&&A({type:"group",id:v,name:_.chat.name,chatType:_.chat.chat_type})})}),e.querySelectorAll('[data-msg-action="start-dm"]').forEach(m=>{m.addEventListener("click",()=>{const v=m.dataset.factionId,_=m.querySelector(".msg-chat-item__name");A({type:"dm",id:v,name:_?.textContent||"Unknown"})})})}async function $e(){const e=f.id,{data:a,error:n}=await l.from("direct_messages").select("id, sender_id, receiver_id, message_text, read_at, created_at, sent_at_tick").or(`sender_id.eq.${e},receiver_id.eq.${e}`).order("created_at",{ascending:!1}).limit(200);if(n||!a){I=[];return}const t={};for(const o of a){const d=o.sender_id===e?o.receiver_id:o.sender_id;t[d]||(t[d]={lastMessage:o,unreadCount:0}),o.receiver_id===e&&!o.read_at&&t[d].unreadCount++}const i=Object.keys(t);if(i.length===0){I=[];return}const{data:s}=await l.from("factions").select("id, faction_name, abbreviation, party_color, faction_type").in("id",i),r={};for(const o of s||[])r[o.id]=o;I=i.filter(o=>r[o]).map(o=>({otherFaction:r[o],lastMessage:t[o].lastMessage,unreadCount:t[o].unreadCount})).sort((o,d)=>new Date(d.lastMessage.created_at)-new Date(o.lastMessage.created_at))}async function te(){const e=f.id,{data:a,error:n}=await l.from("group_chat_members").select("chat_id, last_read_at").eq("faction_id",e);if(n||!a||a.length===0){M=[];return}const t=a.map(d=>d.chat_id),i={};for(const d of a)i[d.chat_id]=d.last_read_at;const{data:s}=await l.from("group_chats").select("id, name, chat_type, ipo_org_id, nation_id").in("id",t);if(!s){M=[];return}const{data:r}=await l.from("group_chat_messages").select("chat_id, message_text, sender_id, created_at").in("chat_id",t).order("created_at",{ascending:!1}).limit(t.length*1),o={};for(const d of r||[])o[d.chat_id]||(o[d.chat_id]=d);M=s.map(d=>{const g=i[d.id],p=o[d.id],u=p&&(!g||new Date(p.created_at)>new Date(g));return{chat:d,lastMessage:p||null,unreadCount:u?1:0}}).sort((d,g)=>{const p=d.lastMessage?new Date(d.lastMessage.created_at):new Date(0);return(g.lastMessage?new Date(g.lastMessage.created_at):new Date(0))-p})}function Y(e,a){const n=e.chat,t=e.lastMessage?e.lastMessage.message_text.slice(0,50):"No messages yet",i=n.name.slice(0,2).toUpperCase();n.chat_type==="global"||n.chat_type==="ipo"||n.chat_type;const s=e.unreadCount>0?`<div class="msg-chat-item__badge">${e.unreadCount}</div>`:"";return`<div class="msg-chat-item" data-msg-action="open-group" data-chat-id="${n.id}">
        <div class="msg-chat-item__avatar">${c(i)}</div>
        <div class="msg-chat-item__info">
            <div class="msg-chat-item__name">${c(n.name)}</div>
            <div class="msg-chat-item__preview">${c(t)}</div>
        </div>
        ${s}
    </div>`}function Te(e){const a=e.otherFaction,n=(a.abbreviation||a.faction_name||"?").slice(0,3).toUpperCase(),t=a.party_color||"#666",i=e.lastMessage?e.lastMessage.message_text.slice(0,50):"",s=e.unreadCount>0?`<div class="msg-chat-item__badge">${e.unreadCount}</div>`:"";return`<div class="msg-chat-item" data-msg-action="open-dm" data-faction-id="${a.id}">
        <div class="msg-chat-item__avatar" style="color:${c(t)};border-color:${c(t)};">${c(n)}</div>
        <div class="msg-chat-item__info">
            <div class="msg-chat-item__name">${c(a.faction_name)}</div>
            <div class="msg-chat-item__preview">${c(i)}</div>
        </div>
        ${s}
    </div>`}let G=!1,D={};async function A(e){h=e,L="thread";const a=document.getElementById("msg-body"),n=document.getElementById("msg-actions");n&&(n.style.display="none");const t=document.querySelector(".msg-panel__title");t&&(t.textContent=e.name||"Chat");const i=e.type==="group"&&e.chatType==="nation"&&x?`<img src="${c(x.flag_url||`assets/flags/${x.name}.png`)}" alt="" style="height:14px;vertical-align:middle;margin-left:6px;" onerror="this.style.display='none'">`:"";a.innerHTML=`
        <div class="msg-thread-header">
            <button class="msg-thread-back" id="msg-back">&#8592;</button>
            <span class="msg-thread-name">${c(e.name||"Chat")}${i}</span>
            <button class="msg-thread-members-btn" id="msg-search-btn" title="Search in channel">&#128269;</button>
            ${e.type==="group"?'<button class="msg-thread-members-btn" id="msg-members-toggle" title="Show members">&#128101;</button>':""}
        </div>
        ${e.type==="group"?'<div class="msg-members-bar" id="msg-members-bar" style="display:none;"></div>':""}
        <div class="msg-messages" id="msg-messages">
            <div class="msg-empty"><div class="msg-empty__text" style="color:var(--text-dim);">Loading...</div></div>
        </div>
        <div class="msg-input-bar">
            <input type="text" class="msg-input" id="msg-input" placeholder="Type a message..." maxlength="2000" />
            <button class="msg-send-btn" id="msg-send" disabled>Send</button>
        </div>
    `,document.getElementById("msg-back").addEventListener("click",()=>{t&&(t.textContent="Messages"),h=null,T=null,C=[],U=!1,P(),H(),q()});const s=document.getElementById("msg-search-btn");if(s&&s.addEventListener("click",()=>{U?_e():Ne()}),setTimeout(()=>{const d=document.getElementById("msg-messages");d&&d.addEventListener("scroll",()=>{d.scrollTop<40&&T&&!K&&be()})},0),e.type==="group"){const d=document.getElementById("msg-members-toggle"),g=document.getElementById("msg-members-bar");d&&g&&d.addEventListener("click",async()=>{if(g.style.display!=="none"){g.style.display="none";return}g.innerHTML='<span style="color:var(--text-dim);font-size:10px;padding:4px 8px;">Loading...</span>',g.style.display="flex";try{const{data:p}=await l.from("group_chat_members").select("faction_id").eq("chat_id",e.id),u=(p||[]).map(b=>b.faction_id);await F(u),g.innerHTML=u.map(b=>{const y=D[b];if(!y)return"";const S=(y.abbreviation||y.faction_name||"?").slice(0,4),m=y.party_color||"#666",v=b===f.id;return'<span class="msg-member-chip" style="border-color:'+c(m)+";color:"+c(m)+(v?";opacity:1":"")+'" title="'+c(y.faction_name||"")+'">'+c(S)+"</span>"}).filter(Boolean).join("")||'<span style="color:var(--text-dim);font-size:10px;">No members</span>'}catch{g.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Failed to load</span>'}})}const r=document.getElementById("msg-input"),o=document.getElementById("msg-send");r.addEventListener("input",()=>{o.disabled=!r.value.trim()||G}),r.addEventListener("keydown",d=>{d.key==="Enter"&&!d.shiftKey&&r.value.trim()&&!G&&(d.preventDefault(),me())}),o.addEventListener("click",()=>{r.value.trim()&&!G&&me()}),await he(),r.focus()}async function he(){const e=document.getElementById("msg-messages");if(!e||!h)return;const a=h;let n=[],t=0;T=null,C=[];try{if(a.type==="dm"){const{data:s,error:r}=await l.from("direct_messages").select(Q).or(`and(sender_id.eq.${f.id},receiver_id.eq.${a.id}),and(sender_id.eq.${a.id},receiver_id.eq.${f.id})`).order("created_at",{ascending:!1}).limit(z);if(r)throw r;const o=(s||[]).slice().reverse();t=o.length,n=o.map(g=>ae(g)),o.length>0&&(T=o[0].created_at);const d=o.filter(g=>g.receiver_id===f.id&&!g.read_at&&!g.deleted_at).map(g=>g.id);d.length>0&&l.from("direct_messages").update({read_at:new Date().toISOString()}).in("id",d).then(()=>{})}else if(a.type==="group"){const{data:s,error:r}=await l.from("group_chat_messages").select(ee).eq("chat_id",a.id).order("created_at",{ascending:!1}).limit(z);if(r)throw r;const o=(s||[]).slice().reverse();t=o.length;const d=[...new Set(o.map(g=>g.sender_id).filter(Boolean))];await F(d),n=o.map(g=>ne(g)),o.length>0&&(T=o[0].created_at),await Be(a.id),l.from("group_chat_members").update({last_read_at:new Date().toISOString()}).eq("chat_id",a.id).eq("faction_id",f.id).then(()=>{})}}catch(s){console.warn("[Messaging] Failed to load messages:",s),e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">Failed to load messages.</div></div>';return}const i=t>=z?'<button class="msg-load-earlier" id="msg-load-earlier">Load earlier messages</button>':"";n.length===0&&C.length===0&&!i?e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No messages yet.<br>Send the first message!</div></div>':e.innerHTML=i+n.map(s=>j(s)).join(""),He(),e.scrollTop=e.scrollHeight}function ae(e){return{id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:e.sender_id===f.id,isSystem:!1,editedAt:e.edited_at,deletedAt:e.deleted_at}}function ne(e){return{id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:e.sender_id===f.id,isSystem:e.is_system,editedAt:e.edited_at,deletedAt:e.deleted_at,pinnedAt:e.pinned_at}}async function be(){if(K||!T||!h)return;K=!0;const e=document.getElementById("msg-load-earlier");e&&(e.disabled=!0,e.textContent="Loading...");const a=h,n=document.getElementById("msg-messages"),t=n?n.scrollHeight:0;try{let i=[];if(a.type==="dm"){const{data:s,error:r}=await l.from("direct_messages").select(Q).or(`and(sender_id.eq.${f.id},receiver_id.eq.${a.id}),and(sender_id.eq.${a.id},receiver_id.eq.${f.id})`).lt("created_at",T).order("created_at",{ascending:!1}).limit(z);if(r)throw r;i=(s||[]).slice().reverse();const o=i.map(ae);ce(o,i,n,t)}else if(a.type==="group"){const{data:s,error:r}=await l.from("group_chat_messages").select(ee).eq("chat_id",a.id).lt("created_at",T).order("created_at",{ascending:!1}).limit(z);if(r)throw r;i=(s||[]).slice().reverse();const o=[...new Set(i.map(g=>g.sender_id).filter(Boolean))];await F(o);const d=i.map(ne);ce(d,i,n,t)}}catch(i){console.warn("[Messaging] Failed to load older messages:",i),e&&(e.disabled=!1,e.textContent="Load earlier messages")}finally{K=!1}}function ce(e,a,n,t){const i=document.getElementById("msg-load-earlier");if(!n)return;if(a.length===0){i&&i.remove();return}T=a[0].created_at;const s=e.map(r=>j(r)).join("");i?(i.insertAdjacentHTML("afterend",s),a.length<z?i.remove():(i.disabled=!1,i.textContent="Load earlier messages")):n.insertAdjacentHTML("afterbegin",s),n.scrollTop=n.scrollHeight-t}function j(e){if(e.isSystem)return`<div class="msg-msg msg-msg--system">${c(e.text)}</div>`;if(e.deletedAt)return`<div class="msg-msg msg-msg--${e.isMine?"sent":"received"} msg-msg--deleted" data-msg-id="${c(e.id)}">
            <div>[message deleted]</div>
            <div class="msg-msg__time">${Z(e.createdAt)}</div>
        </div>`;const a=e.isMine?"msg-msg msg-msg--sent":"msg-msg msg-msg--received",n=Z(e.createdAt),t=e.editedAt?`<span class="msg-msg__edited" title="Edited ${Z(e.editedAt)}">(edited)</span>`:"",i=e.pinnedAt?'<span class="msg-msg__pinned" title="Pinned">📌</span>':"";let s="";if(!e.isMine&&h?.type==="group"&&e.senderId){const o=D[e.senderId],d=o?.party_color||"#888",g=o?.faction_name||o?.abbreviation||"...",p=(o?.abbreviation||o?.faction_name||"?").slice(0,3).toUpperCase(),u=h?.chatType;let b="";if(u==="global"&&o?.nation_name){const m=pe[o.nation_name];m?b=`<img class="msg-msg__flag" src="${c(m)}" alt="${c(o.nation_name)}" title="${c(o.nation_name)}" />`:b=`<span class="msg-msg__nation">[${c(o.nation_name)}]</span>`}else u==="nation"&&o?.faction_type==="corporation"&&o?.corp_sector&&(b=`<span class="msg-msg__sector" title="Sector">${c(o.corp_sector)}</span>`);const S=!!o?`data-msg-action="open-profile" data-faction-id="${c(e.senderId)}" role="button" tabindex="0" title="View profile"`:'style="cursor:default;"';s=`<div class="msg-msg__header">
            <div class="msg-msg__avatar" style="color:${c(d)};border-color:${c(d)};">${c(p)}</div>
            <div class="msg-msg__nameplate" ${S}>
                <span class="msg-msg__name" style="color:${c(d)};">${c(g)}</span>
                ${b}
            </div>
        </div>`}const r=e.isMine?`<button class="msg-msg__menu-btn" data-msg-action="msg-menu" data-msg-id="${c(e.id)}" aria-label="Message actions" title="Actions">⋯</button>`:"";return`<div class="${a}" data-msg-id="${c(e.id)}">
        ${s}
        ${r}
        <div class="msg-msg__body">${i}<span class="msg-msg__text">${c(e.text)}</span>${t}</div>
        <div class="msg-msg__time">${n}</div>
    </div>`}let k=null;function H(){k&&k.parentNode&&k.parentNode.removeChild(k),k=null}function le(e,a){H();const n=D[a];if(!n||!a)return;const t=document.getElementById("msg-panel");if(!t)return;const i=n.party_color||"#888",s=n.faction_type,r=s==="corporation"?"Corporation":s==="party"?"Political Party":s?s.charAt(0).toUpperCase()+s.slice(1).replace(/_/g," "):"Faction",o=n.nation_name||"",d=o?pe[o]:"",g=xe(o),p=document.createElement("div");p.className="msg-identity-popover",p.setAttribute("role","dialog"),p.innerHTML=`
        <div class="msg-identity-popover__name" style="color:${c(i)};">${c(n.faction_name||n.abbreviation||"?")}</div>
        <div class="msg-identity-popover__row">
            ${d?`<img src="${c(d)}" alt="${c(o)}" />`:""}
            <span>${o?c(o):"No nation"}</span>
        </div>
        <div class="msg-identity-popover__row">
            <span>${c(r)}${s==="corporation"&&n.corp_sector?" — "+c(n.corp_sector):""}</span>
        </div>
        ${g?`<a class="msg-identity-popover__link" href="nation-info.html?name=${encodeURIComponent(g)}" target="_blank" rel="noopener">View Nation &rarr;</a>`:""}
    `,t.appendChild(p);const u=t.getBoundingClientRect(),b=e.getBoundingClientRect(),y=p.offsetWidth,S=p.offsetHeight;let m=b.left-u.left;const v=t.clientWidth-y-8;m>v&&(m=v),m<8&&(m=8);let _=b.bottom-u.top+4;_+S>t.clientHeight-8&&(_=b.top-u.top-S-4),_<8&&(_=8),p.style.top=_+"px",p.style.left=m+"px",p.dataset.factionId=a,k=p}function R(e,a){const n=document.getElementById("msg-panel");if(!n)return;const t=n.querySelector(".msg-toast");t&&t.remove();const i=document.createElement("div");i.className="msg-toast"+(a==="success"?" msg-toast--success":""),i.textContent=e,n.appendChild(i),setTimeout(()=>{i.parentNode&&i.parentNode.removeChild(i)},4500)}function se(e){return(e?.message||"").replace(/^[A-Z0-9]+:\s*/,"")}let $=null;function P(){$&&$.parentNode&&$.parentNode.removeChild($),$=null}function Le(e,a){P();const n=e.closest(".msg-msg");if(!n)return;const t=n.classList.contains("msg-msg--sent"),i=document.createElement("div");i.className="msg-msg__menu";const s=[];t&&(s.push(`<button class="msg-msg__menu-item" data-msg-action="edit" data-msg-id="${c(a)}">Edit</button>`),s.push(`<button class="msg-msg__menu-item msg-msg__menu-item--danger" data-msg-action="delete" data-msg-id="${c(a)}">Delete</button>`)),s.length!==0&&(i.innerHTML=s.join(""),n.appendChild(i),$=i)}async function qe(e){if(P(),!h)return;const a=document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(e)}"]`);if(!a)return;const n=a.querySelector(".msg-msg__body"),t=a.querySelector(".msg-msg__text");if(!n||!t)return;const i=t.textContent,s=document.createElement("div");s.className="msg-msg__edit",s.innerHTML=`
        <textarea maxlength="2000"></textarea>
        <div class="msg-msg__edit-row">
            <button data-msg-action="edit-cancel">Cancel</button>
            <button class="primary" data-msg-action="edit-save" data-msg-id="${c(e)}">Save</button>
        </div>
    `,n.style.display="none",a.appendChild(s);const r=s.querySelector("textarea");r.value=i,r.focus(),r.setSelectionRange(r.value.length,r.value.length),r.addEventListener("keydown",o=>{o.key==="Escape"&&(o.preventDefault(),ie(a))})}function ie(e){const a=e.querySelector(".msg-msg__edit");a&&a.remove();const n=e.querySelector(".msg-msg__body");n&&(n.style.display="")}async function Ie(e){const a=document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(e)}"]`);if(!a)return;const n=a.querySelector(".msg-msg__edit textarea");if(!n)return;const t=n.value.trim();if(!t){R("Message cannot be empty");return}if(!h)return;const i=a.querySelector('[data-msg-action="edit-save"]');i&&(i.disabled=!0);const s=h.type==="dm"?"direct_messages":"group_chat_messages";try{const{error:r}=await l.from(s).update({message_text:t}).eq("id",e);if(r)throw r;ie(a);const o=a.querySelector(".msg-msg__text");o&&(o.textContent=t);const d=a.querySelector(".msg-msg__body");if(d&&!d.querySelector(".msg-msg__edited")){const g=document.createElement("span");g.className="msg-msg__edited",g.textContent="(edited)",d.appendChild(g)}R("Message updated","success")}catch(r){console.warn("[Messaging] Edit failed:",r),R("Edit failed: "+se(r)),i&&(i.disabled=!1)}}async function ze(e){if(P(),!h||!confirm("Delete this message? This cannot be undone."))return;const a=h.type==="dm"?"direct_messages":"group_chat_messages";try{const n=h.type==="dm"?{deleted_at:new Date().toISOString()}:{deleted_at:new Date().toISOString(),deleted_by:f.id},{error:t}=await l.from(a).update(n).eq("id",e);if(t)throw t;const i=document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(e)}"]`);if(i){i.classList.add("msg-msg--deleted");const s=i.querySelector(".msg-msg__body");s&&(s.innerHTML="[message deleted]");const r=i.querySelector(".msg-msg__menu-btn");r&&r.remove();const o=i.querySelector(".msg-msg__header");o&&o.remove()}}catch(n){console.warn("[Messaging] Delete failed:",n),R("Delete failed: "+se(n))}}async function Be(e){try{const{data:a,error:n}=await l.from("group_chat_messages").select("id, sender_id, message_text, created_at, pinned_at, deleted_at").eq("chat_id",e).not("pinned_at","is",null).is("deleted_at",null).order("pinned_at",{ascending:!1}).limit(3);if(n)throw n;C=a||[];const t=[...new Set(C.map(i=>i.sender_id).filter(Boolean))];t.length>0&&await F(t)}catch(a){console.warn("[Messaging] Failed to load pinned messages:",a),C=[]}}function He(){const e=document.getElementById("msg-pinned-strip");if(e&&e.remove(),!C||C.length===0)return;const a=document.getElementById("msg-messages");if(!a||!a.parentNode)return;const n=document.createElement("div");n.id="msg-pinned-strip",n.className="msg-pinned-strip";const t=C.map(i=>{const s=D[i.sender_id],r=s?.abbreviation||s?.faction_name||"?",o=(i.message_text||"").slice(0,120);return`<div class="msg-pinned-strip__item">📌 <strong>${c(r)}</strong>: ${c(o)}</div>`}).join("");n.innerHTML=`<div class="msg-pinned-strip__hdr">Pinned · ${C.length}/3</div>${t}`,a.parentNode.insertBefore(n,a)}async function Ne(){if(!document.getElementById("msg-body")||!h||U)return;U=!0;const a=document.createElement("div");a.className="msg-search-bar",a.id="msg-search-bar",a.innerHTML=`
        <input type="text" id="msg-search-input" placeholder="Search messages..." maxlength="120" />
        <button id="msg-search-close">Close</button>
    `;const n=document.getElementById("msg-messages");n&&n.parentNode&&n.parentNode.insertBefore(a,n);const t=document.getElementById("msg-search-input"),i=document.getElementById("msg-search-close");let s=null;t.addEventListener("input",()=>{clearTimeout(s);const r=t.value.trim();s=setTimeout(()=>Ae(r),200)}),i.addEventListener("click",_e),t.focus()}function _e(){U=!1;const e=document.getElementById("msg-search-bar");e&&e.remove(),he()}async function Ae(e){const a=document.getElementById("msg-messages");if(!(!a||!h)){if(!e){a.innerHTML='<div class="msg-empty"><div class="msg-empty__text">Type to search this channel.<br>Close to return to the thread.</div></div>';return}try{let n=[];if(h.type==="group"){const{data:i,error:s}=await l.from("group_chat_messages").select(ee).eq("chat_id",h.id).is("deleted_at",null).ilike("message_text",`%${e}%`).order("created_at",{ascending:!1}).limit(z);if(s)throw s;n=(i||[]).reverse();const r=[...new Set(n.map(o=>o.sender_id).filter(Boolean))];r.length>0&&await F(r)}else{const{data:i,error:s}=await l.from("direct_messages").select(Q).or(`and(sender_id.eq.${f.id},receiver_id.eq.${h.id}),and(sender_id.eq.${h.id},receiver_id.eq.${f.id})`).is("deleted_at",null).ilike("message_text",`%${e}%`).order("created_at",{ascending:!1}).limit(z);if(s)throw s;n=(i||[]).reverse()}const t=n.map(h.type==="dm"?ae:ne);t.length===0?a.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No matches.</div></div>':a.innerHTML=t.map(i=>j(i)).join("")}catch(n){console.warn("[Messaging] Search failed:",n),a.innerHTML='<div class="msg-empty"><div class="msg-empty__text">Search failed.</div></div>'}}}async function F(e){const a=e.filter(s=>!D[s]);if(a.length===0)return;let n=null;try{const{data:s,error:r}=await l.from("factions").select("id, faction_name, abbreviation, party_color, faction_type, corp_sector, nation_id").in("id",a);if(r)throw r;n=s}catch(s){console.warn("[Messaging] loadFactionNames: factions query failed:",s);return}const t=[...new Set((n||[]).map(s=>s.nation_id).filter(Boolean))],i={};if(t.length>0)try{const{data:s,error:r}=await l.from("nations").select("id, name").in("id",t);if(r)throw r;for(const o of s||[])i[o.id]=o.name}catch(s){console.warn("[Messaging] loadFactionNames: nations query failed (nameplates will render without flag/tag):",s)}for(const s of n||[])D[s.id]={id:s.id,faction_name:s.faction_name,abbreviation:s.abbreviation,party_color:s.party_color,faction_type:s.faction_type,corp_sector:s.corp_sector,nation_id:s.nation_id,nation_name:s.nation_id&&i[s.nation_id]||null}}function Z(e){if(!e)return"";try{const a=new Date(e),t=new Date-a,i=Math.floor(t/6e4);if(i<1)return"now";if(i<60)return i+"m ago";const s=Math.floor(i/60);if(s<24)return s+"h ago";const r=Math.floor(s/24);return r<7?r+"d ago":a.toLocaleDateString()}catch{return""}}async function me(){const e=document.getElementById("msg-input"),a=document.getElementById("msg-send"),n=h;if(!e||!n||!f)return;const t=e.value.trim();if(t){G=!0,a&&(a.disabled=!0),e.value="";try{const i=ge?.current_tick||null;let s=null;if(n.type==="dm"){const{data:o,error:d}=await l.from("direct_messages").insert({sender_id:f.id,receiver_id:n.id,message_text:t,sent_at_tick:i}).select("id, created_at").single();if(d)throw d;s=o}else if(n.type==="group"){const{data:o,error:d}=await l.from("group_chat_messages").insert({chat_id:n.id,sender_id:f.id,is_system:!1,message_text:t,sent_at_tick:i}).select("id, created_at").single();if(d)throw d;s=o}const r=document.getElementById("msg-messages");if(r&&s){const o=r.querySelector(".msg-empty");o&&o.remove(),r.insertAdjacentHTML("beforeend",j({id:s.id,senderId:f.id,text:t,createdAt:s.created_at,tick:i,isMine:!0,isSystem:!1})),r.scrollTop=r.scrollHeight}}catch(i){console.warn("[Messaging] Send failed:",i),e.value=t,R(se(i)||"Failed to send message.")}finally{G=!1,a&&(a.disabled=!e.value.trim()),e.focus()}}}let B=[],X=null;function De(){L="new-dm";const e=document.getElementById("msg-body"),a=document.getElementById("msg-actions");a&&(a.style.display="none");const n=document.querySelector(".msg-panel__title");n&&(n.textContent="New Message"),e.innerHTML=`
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
    `,document.getElementById("msg-back").addEventListener("click",()=>{n&&(n.textContent="Messages"),q()});const t=document.getElementById("msg-search");t.addEventListener("input",()=>{clearTimeout(X),X=setTimeout(()=>je(t.value.trim()),250)}),t.focus(),(async()=>{try{const{data:i}=await l.from("nations").select("id, name").order("name"),s=document.getElementById("msg-role-nation");s&&i&&(s.innerHTML='<option value="">Select a nation...</option>'+i.map(r=>'<option value="'+r.id+'">'+c(r.name)+"</option>").join(""),s.addEventListener("change",()=>Pe(s.value)))}catch{}})()}async function Pe(e){const a=document.getElementById("msg-role-results");if(a){if(!e){a.innerHTML="";return}a.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Loading roles...</span>';try{const[n,t,i]=await Promise.all([l.from("ministries").select("ministry_key, party_id, factions(id, faction_name, abbreviation, party_color)").eq("nation_id",e).in("ministry_key",["foreign","trade","prime_minister"]).eq("is_active",!0),l.from("government_formations").select("ministry_assignments, proposed_by").eq("nation_id",e).eq("status","formed").order("created_at",{ascending:!1}).limit(1).maybeSingle(),l.from("nations").select("ruling_faction_id").eq("id",e).single()]),s=[],r=(n.data||[]).find(p=>p.ministry_key==="prime_minister"),o=ye(t.data)||i.data?.ruling_faction_id||r?.party_id;if(o){const p=r?.factions||(n.data||[]).find(u=>u.party_id===o)?.factions;if(p)s.push({role:"Head of Government",faction:p});else{const{data:u}=await l.from("factions").select("id, faction_name, abbreviation, party_color").eq("id",o).single();u&&s.push({role:"Head of Government",faction:u})}}const d=(n.data||[]).find(p=>p.ministry_key==="foreign");d?.factions&&s.push({role:"Foreign Minister",faction:d.factions});const g=(n.data||[]).find(p=>p.ministry_key==="trade");if(g?.factions&&s.push({role:"Minister of Trade",faction:g.factions}),s.length===0){a.innerHTML='<span style="color:var(--text-dim);font-size:10px;">No diplomatic roles found for this nation.</span>';return}a.innerHTML=s.map(p=>{const u=p.faction,b=u.party_color||"#666",y=(u.abbreviation||u.faction_name||"?").slice(0,4),S=u.id===f.id;return'<div class="msg-role-row" data-role-faction-id="'+u.id+'"'+(S?' style="opacity:0.4;cursor:default;" title="This is you"':"")+'><span class="msg-role-badge">'+c(p.role)+'</span><span class="msg-role-party" style="color:'+c(b)+';">'+c(y)+" — "+c(u.faction_name)+"</span></div>"}).join(""),a.querySelectorAll(".msg-role-row").forEach(p=>{const u=p.dataset.roleFactionId;u!==f.id&&p.addEventListener("click",()=>{const b=s.find(y=>y.faction.id===u);b&&A({type:"dm",id:u,name:b.faction.faction_name,faction:b.faction})})})}catch(n){console.warn("[Messaging] Role lookup failed:",n),a.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Failed to load roles.</span>'}}}async function je(e){const a=document.getElementById("msg-search-results");if(!a)return;const n=(e||"").replace(/[%_\\]/g,"");if(n)try{const{data:t}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation, faction_type").neq("id",f.id).or(`faction_name.ilike.%${n}%,abbreviation.ilike.%${n}%,nation.ilike.%${n}%`).eq("faction_type","party").not("nation_id","is",null).order("faction_name").limit(20);B=t||[]}catch{B=[]}else try{const{data:t}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation, faction_type").eq("nation_id",x?.id).eq("faction_type","party").neq("id",f.id).order("faction_name").limit(20);B=t||[]}catch{B=[]}if(B.length===0){a.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No parties found.</div></div>';return}a.innerHTML=B.map(t=>{const i=(t.abbreviation||t.faction_name||"?").slice(0,3).toUpperCase(),s=t.party_color||"#666",r=t.nation||"";return`<div class="msg-chat-item" data-msg-action="pick-dm" data-faction-id="${t.id}">
            <div class="msg-chat-item__avatar" style="color:${c(s)};border-color:${c(s)};">${c(i)}</div>
            <div class="msg-chat-item__info">
                <div class="msg-chat-item__name">${c(t.faction_name)}</div>
                <div class="msg-chat-item__preview">${c(r)}</div>
            </div>
        </div>`}).join(""),a.querySelectorAll('[data-msg-action="pick-dm"]').forEach(t=>{t.addEventListener("click",()=>{const i=t.dataset.factionId,s=B.find(r=>r.id===i);s&&A({type:"dm",id:i,name:s.faction_name,faction:s})})})}let E=new Set;function Fe(){L="new-group",E=new Set;const e=document.getElementById("msg-body"),a=document.getElementById("msg-actions");a&&(a.style.display="none");const n=document.querySelector(".msg-panel__title");n&&(n.textContent="New Group Chat"),e.innerHTML=`
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
    `,document.getElementById("msg-back").addEventListener("click",()=>{n&&(n.textContent="Messages"),q()});const t=document.getElementById("msg-group-search");t.addEventListener("input",()=>{clearTimeout(X),X=setTimeout(()=>J(t.value.trim()),250)}),document.getElementById("msg-create-group").addEventListener("click",Ue),J("")}async function J(e){const a=document.getElementById("msg-group-results");if(!a)return;const n=(e||"").replace(/[%_\\]/g,"");let t=[];try{if(n){const{data:i}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation").neq("id",f.id).or(`faction_name.ilike.%${n}%,abbreviation.ilike.%${n}%,nation.ilike.%${n}%`).eq("faction_type","party").not("nation_id","is",null).order("faction_name").limit(20);t=i||[]}else{const{data:i}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation").eq("nation_id",x?.id).eq("faction_type","party").neq("id",f.id).order("faction_name").limit(20);t=i||[]}}catch{t=[]}if(t.length===0){a.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No parties found.</div></div>';return}a.innerHTML=t.map(i=>{const s=(i.abbreviation||i.faction_name||"?").slice(0,3).toUpperCase(),r=i.party_color||"#666",o=E.has(i.id);return`<div class="msg-chat-item" data-msg-action="toggle-group-member" data-faction-id="${i.id}" style="${o?"background:rgba(90,175,165,0.08);":""}">
            <div class="msg-chat-item__avatar" style="color:${c(r)};border-color:${c(r)};">${c(s)}</div>
            <div class="msg-chat-item__info">
                <div class="msg-chat-item__name">${c(i.faction_name)}</div>
                <div class="msg-chat-item__preview">${c(i.nation||"")}</div>
            </div>
            <div style="font-family:var(--font-mono,monospace);font-size:14px;color:${o?"var(--teal,#5aafa5)":"var(--text-dim,#4a4940)"};">${o?"✓":"+"}</div>
        </div>`}).join(""),a.querySelectorAll('[data-msg-action="toggle-group-member"]').forEach(i=>{i.addEventListener("click",()=>{const s=i.dataset.factionId;E.has(s)?E.delete(s):E.add(s),J(document.getElementById("msg-group-search")?.value?.trim()||""),Ge(),Re()})})}function Ge(){const e=document.getElementById("msg-group-selected");if(e){if(E.size===0){e.style.display="none",e.innerHTML="";return}e.style.display="flex",e.innerHTML=`<span style="font-family:var(--font-mono,monospace);font-size:8px;color:var(--text-dim);">${E.size} member${E.size>1?"s":""} selected</span>`}}function Re(){const e=document.getElementById("msg-create-group");e&&(e.disabled=E.size===0)}function Oe(e){const a=(e?.message||"").toLowerCase(),n=e?.code||"";return n==="42501"||a.includes("not authenticated")||a.includes("authentication required")?"You must be signed in to create a group chat.":a.includes("no faction linked")?"No faction is linked to your account yet. Reload and try again.":a.includes("select at least one other member")?"Select at least one other faction before creating a group chat.":a.includes("100 characters or fewer")?"Group chat name must be 100 characters or fewer.":a.includes("selected members were not found")?"One or more selected factions could not be found. Refresh the member list and try again.":n==="23505"?"This group already exists with the selected members.":a.includes("row-level security")||n==="PGRST301"?"You do not have permission to create this group chat.":e?.message||"Unknown error"}async function Ue(){const e=document.getElementById("msg-group-name"),a=document.getElementById("msg-create-group"),n=e?.value?.trim()||"Group Chat";if(E.size!==0){a&&(a.disabled=!0);try{const{data:t,error:i}=await l.rpc("create_custom_group_chat",{chat_name:n,member_ids:Array.from(E)});if(i)throw i;const s=Array.isArray(t)?t[0]:t,r=s?.chat_id,o=s?.name||n;if(!r)throw new Error("Group chat creation returned no chat id");const d=document.querySelector(".msg-panel__title");d&&(d.textContent="Messages"),A({type:"group",id:r,name:o,chatType:"custom"})}catch(t){console.error("[Messaging] Create group failed:",t),alert("Failed to create group chat: "+Oe(t)),a&&(a.disabled=!1)}}}async function Ye(){if(!(!f||!f.id))try{x?.id&&await We(x.id,x.name||"Nation");const{data:e}=await l.from("ipo_members").select("org_id, international_orgs!inner(id, name, is_active)").eq("faction_id",f.id).eq("is_active",!0);for(const a of e||[]){const n=a.international_orgs;!n||!n.is_active||await Ve(n.id,n.name)}}catch(e){console.warn("[Messaging] Auto-chat sync failed (non-blocking):",e)}}async function We(e,a){const{data:n}=await l.from("group_chats").select("id").eq("nation_id",e).eq("chat_type","nation").maybeSingle();let t;if(n)t=n.id;else{const{data:s,error:r}=await l.from("group_chats").insert({name:a+" Chat",chat_type:"nation",nation_id:e}).select("id").single();if(r)if(r.code==="23505"){const{data:o}=await l.from("group_chats").select("id").eq("nation_id",e).eq("chat_type","nation").maybeSingle();t=o?.id}else{console.warn("[Messaging] Nation chat create failed:",r.message);return}else t=s.id}if(!t)return;const{error:i}=await l.from("group_chat_members").upsert({chat_id:t,faction_id:f.id},{onConflict:"chat_id,faction_id"});if(!i)try{const{data:s}=await l.from("factions").select("id").eq("nation_id",x.id).eq("faction_type","party").not("nation_id","is",null),{data:r}=await l.from("group_chats").select("created_by").eq("id",t).single();if(r?.created_by===f.id&&s&&s.length>0){const d=s.map(g=>({chat_id:t,faction_id:g.id}));await l.from("group_chat_members").upsert(d,{onConflict:"chat_id,faction_id"})}}catch{}}async function Ve(e,a){const{data:n}=await l.from("group_chats").select("id").eq("ipo_org_id",e).eq("chat_type","ipo").maybeSingle();let t;if(n)t=n.id;else{const{data:s,error:r}=await l.from("group_chats").insert({name:a,chat_type:"ipo",ipo_org_id:e}).select("id").single();if(r)if(r.code==="23505"){const{data:o}=await l.from("group_chats").select("id").eq("ipo_org_id",e).eq("chat_type","ipo").maybeSingle();t=o?.id}else{console.warn("[Messaging] IPO chat create failed:",r.message);return}else t=s.id}if(!t)return;const{error:i}=await l.from("group_chat_members").upsert({chat_id:t,faction_id:f.id},{onConflict:"chat_id,faction_id"});if(!i)try{const{data:s}=await l.from("group_chats").select("created_by").eq("id",t).single();if(s?.created_by===f.id){const{data:o}=await l.from("ipo_members").select("faction_id").eq("org_id",e).eq("is_active",!0);if(o&&o.length>0){const d=o.map(g=>({chat_id:t,faction_id:g.faction_id}));await l.from("group_chat_members").upsert(d,{onConflict:"chat_id,faction_id"})}}}catch{}}function Ke(){f?.id&&(Xe(),W=l.channel("msg-dm-"+f.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages",filter:`receiver_id=eq.${f.id}`},e=>{Ze(e.new)}).subscribe(),V=l.channel("msg-gc-"+f.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"group_chat_messages"},e=>{Je(e.new)}).subscribe())}function Xe(){W&&(l.removeChannel(W),W=null),V&&(l.removeChannel(V),V=null)}function Ze(e){if(!(!e||e.sender_id===f.id)){if(N&&L==="thread"&&h?.type==="dm"&&h.id===e.sender_id){const a=document.getElementById("msg-messages");if(a){const n=a.querySelector(".msg-empty");n&&n.remove(),a.insertAdjacentHTML("beforeend",j({id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:!1,isSystem:!1})),a.scrollTop=a.scrollHeight}l.from("direct_messages").update({read_at:new Date().toISOString()}).eq("id",e.id).then(()=>{});return}N&&L==="list"&&q()}}function Je(e){if(!(!e||e.sender_id===f.id||!M.some(n=>n.chat.id===e.chat_id))){if(N&&L==="thread"&&h?.type==="group"&&h.id===e.chat_id){(async()=>{e.sender_id&&!D[e.sender_id]&&await F([e.sender_id]);const t=document.getElementById("msg-messages");if(t){const i=t.querySelector(".msg-empty");i&&i.remove(),t.insertAdjacentHTML("beforeend",j({id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:!1,isSystem:e.is_system||!1})),t.scrollTop=t.scrollHeight}l.from("group_chat_members").update({last_read_at:new Date().toISOString()}).eq("chat_id",e.chat_id).eq("faction_id",f.id).then(()=>{})})();return}N&&L==="list"&&q()}}function nt(e,a,n){f=e,x=a,ge=n,!(!e||!e.id)&&(we(),ke(),Ye().then(()=>te()),Ke())}export{nt as initMessaging};
