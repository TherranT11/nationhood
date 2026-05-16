import{_supabase as l}from"./supabase-client-CiYoFhIh.js";import{e as c}from"./utils-oN1e812_.js";import{d as we}from"./government-structure-DBjJ7E-l.js";import"./government-types-BeJIFjWQ.js";let m=null,w=null,he=null,D=!1,q="list",Y="all",h=null,Z=null,J=null,$=new Set,z=null,Q=!1,T=[],V=!1;const A=50,ie="id, sender_id, receiver_id, message_text, created_at, sent_at_tick, read_at, edited_at, deleted_at",oe="id, sender_id, is_system, message_text, created_at, sent_at_tick, edited_at, deleted_at, pinned_at",be={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png",Sierramar:"assets/flags/Sierramar.png",Dravka:"assets/flags/Dravka.png",Hajjara:"assets/flags/Hajjara.png"};function ke(e){return e?String(e).toLowerCase().replace(/\s+/g,""):""}function Me(){if(document.getElementById("msg-styles"))return;const e=document.createElement("style");e.id="msg-styles",e.textContent=`
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
    `,document.head.appendChild(e)}function Ee(){if(document.getElementById("msg-bubble"))return;const e=document.createElement("div");e.id="msg-bubble",e.className="msg-bubble",e.innerHTML="💬",e.addEventListener("click",ge),document.body.appendChild(e);const t=document.createElement("div");t.id="msg-panel",t.className="msg-panel",t.innerHTML=`
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
    `,document.body.appendChild(t),document.getElementById("msg-close").addEventListener("click",ge),document.getElementById("msg-new-dm").addEventListener("click",()=>Oe()),document.getElementById("msg-new-group").addEventListener("click",()=>Ye());const n=document.getElementById("msg-tabs");n&&n.addEventListener("click",a=>{const i=a.target.closest(".msg-tab");if(!i)return;const s=i.dataset.filter;!s||s===Y||(Y=s,_e(s),s==="global"?$e():s==="nation"?qe():B())}),Ce(t),t.addEventListener("click",a=>{const i=a.target.closest("[data-msg-action]"),s=i?.dataset?.msgAction;if(s==="open-profile"){a.stopPropagation();const r=i.dataset.factionId;k&&k.dataset.factionId===r?L():fe(i,r);return}if(s==="block"||s==="unblock"){a.stopPropagation();const r=i.dataset.factionId;s==="block"?Pe(r):De(r);return}if(s==="msg-menu"){a.stopPropagation();const r=i.dataset.msgId;I&&I.parentNode?.dataset?.msgId===r?R():Ie(i,r);return}if(s==="edit"){a.stopPropagation(),ze(i.dataset.msgId);return}if(s==="edit-save"){a.stopPropagation(),Be(i.dataset.msgId);return}if(s==="edit-cancel"){a.stopPropagation();const r=i.closest(".msg-msg");r&&le(r);return}if(s==="delete"){a.stopPropagation(),He(i.dataset.msgId);return}if(s==="report"){a.stopPropagation(),Ne(i.dataset.msgId);return}if(a.target.id==="msg-load-earlier"){a.stopPropagation(),ye();return}I&&!a.target.closest(".msg-msg__menu")&&!a.target.closest(".msg-msg__menu-btn")&&R(),k&&!a.target.closest(".msg-identity-popover")&&L()}),t.addEventListener("keydown",a=>{if(a.key==="Escape"&&k){L();return}(a.key==="Enter"||a.key===" ")&&a.target.matches('[data-msg-action="open-profile"]')&&(a.preventDefault(),fe(a.target,a.target.dataset.factionId))}),document.addEventListener("click",a=>{k&&(t.contains(a.target)||L())}),t.addEventListener("scroll",()=>{k&&L()},!0)}function _e(e){document.querySelectorAll(".msg-tab").forEach(t=>t.classList.toggle("msg-tab--active",t.dataset.filter===e))}function Se(e){_e(Y),document.querySelectorAll(".msg-tab").forEach(t=>{const n=e[t.dataset.filter]||0,a=t.querySelector(".msg-tab__badge");if(a&&a.remove(),n>0){const i=document.createElement("span");i.className="msg-tab__badge",i.textContent=n>99?"99+":String(n),i.title=n+" unread",t.appendChild(i)}})}const me="msg-panel-size";function Ce(e){if(!e)return;try{const o=localStorage.getItem(me);if(o){const d=JSON.parse(o);d&&typeof d.width=="number"&&typeof d.height=="number"&&(e.style.width=Math.max(320,Math.min(d.width,900))+"px",e.style.height=Math.max(400,Math.min(d.height,900))+"px")}}catch{}if(e.querySelector(".msg-resize-handle"))return;const t=document.createElement("div");t.className="msg-resize-handle",t.title="Drag to resize",e.appendChild(t);let n=!1,a,i,s,r;t.addEventListener("mousedown",o=>{window.innerWidth<=640||(n=!0,a=o.clientX,i=o.clientY,s=e.offsetWidth,r=e.offsetHeight,document.body.style.userSelect="none",o.preventDefault())}),window.addEventListener("mousemove",o=>{if(!n)return;const d=a-o.clientX,g=i-o.clientY,f=Math.max(320,Math.min(s+d,900)),u=Math.max(400,Math.min(r+g,900));e.style.width=f+"px",e.style.height=u+"px"}),window.addEventListener("mouseup",()=>{if(n){n=!1,document.body.style.userSelect="";try{localStorage.setItem(me,JSON.stringify({width:e.offsetWidth,height:e.offsetHeight}))}catch{}}})}function ge(){D=!D;const e=document.getElementById("msg-panel"),t=document.getElementById("msg-bubble");!e||!t||(D?(e.classList.add("open"),t.style.display="none",q="list",B()):(e.classList.remove("open"),t.style.display=""))}let N=[],S=[];async function ve(e,t,n){if(!S.length)try{await re()}catch(i){console.warn("[Messaging] Failed to load group chats:",i)}if(Y!==e)return;const a=S.find(t);if(!a){B();return}F({type:"group",id:a.chat.id,name:n||a.chat.name,chatType:a.chat.chat_type})}function $e(){return ve("global",e=>e.chat.chat_type==="global")}function qe(){if(!w?.id){B();return}return ve("nation",e=>e.chat.chat_type==="nation"&&e.chat.nation_id===w.id,"Nation")}async function B(){const e=document.getElementById("msg-body"),t=document.getElementById("msg-actions");t&&(t.style.display=""),q="list";const n=document.querySelector(".msg-panel__title");if(n&&(n.textContent="Messages"),!m){e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No faction selected.</div></div>';return}e.innerHTML='<div class="msg-empty"><div class="msg-empty__text" style="color:var(--text-dim);">Loading...</div></div>';try{await Promise.all([Te(),re()])}catch(p){console.warn("[Messaging] Failed to load chats:",p)}let a="";const i=S.filter(p=>p.chat.chat_type==="global"),s=S.filter(p=>p.chat.chat_type==="ipo"),r=S.filter(p=>p.chat.chat_type==="nation"&&p.chat.nation_id===w?.id),o=S.filter(p=>p.chat.chat_type==="custom"),d=p=>p.reduce((v,y)=>v+(y.unreadCount||0),0),g={global:d(i),nation:d(r),dm:N.reduce((p,v)=>p+(v.unreadCount||0),0)};g.all=g.global+g.nation+g.dm+d(s)+d(o),Se(g);const f=Y||"all",u=f==="all"||f==="global",b=f==="all"||f==="nation",x=f==="all",E=f==="all"||f==="dm";if(u&&i.length>0&&(a+='<div class="msg-section-hdr">Global Chat</div>',a+=i.map(p=>X(p)).join("")),b&&r.length>0&&(a+='<div class="msg-section-hdr">Nation Chat</div>',a+=r.map(p=>X(p)).join("")),x&&s.length>0&&(a+='<div class="msg-section-hdr">Organisation Chats</div>',a+=s.map(p=>X(p)).join("")),x&&o.length>0&&(a+='<div class="msg-section-hdr">Group Chats</div>',a+=o.map(p=>X(p)).join("")),E&&N.length>0&&(a+='<div class="msg-section-hdr">Direct Messages</div>',a+=N.map(p=>Le(p)).join("")),(f==="all"||f==="dm")&&w)try{const{data:p}=await l.from("factions").select("id, faction_name, abbreviation, party_color").eq("nation_id",w.id).eq("faction_type","party").neq("id",m.id).order("faction_name");if(p&&p.length>0){const v=new Set(N.map(_=>_.otherFaction.id)),y=p.filter(_=>!v.has(_.id));y.length>0&&(a+='<div class="msg-section-hdr">Parties in Your Nation</div>',a+=y.map(_=>{const K=(_.abbreviation||_.faction_name||"?").slice(0,3).toUpperCase(),H=_.party_color||"#666";return`<div class="msg-chat-item" data-msg-action="start-dm" data-faction-id="${_.id}">
                            <div class="msg-chat-item__avatar" style="color:${c(H)};border-color:${c(H)};">${c(K)}</div>
                            <div class="msg-chat-item__info">
                                <div class="msg-chat-item__name">${c(_.faction_name)}</div>
                                <div class="msg-chat-item__preview">Start a conversation</div>
                            </div>
                        </div>`}).join(""))}}catch(p){console.warn("[Messaging] Failed to load nation parties:",p)}a||(a='<div class="msg-empty"><div class="msg-empty__text">No messages yet.<br>Start a conversation using<br>the buttons above.</div></div>'),e.innerHTML=a,e.querySelectorAll('[data-msg-action="open-dm"]').forEach(p=>{p.addEventListener("click",()=>{const v=p.dataset.factionId,y=N.find(_=>_.otherFaction.id===v);y&&F({type:"dm",id:v,name:y.otherFaction.faction_name,faction:y.otherFaction})})}),e.querySelectorAll('[data-msg-action="open-group"]').forEach(p=>{p.addEventListener("click",()=>{const v=p.dataset.chatId,y=S.find(_=>_.chat.id===v);y&&F({type:"group",id:v,name:y.chat.name,chatType:y.chat.chat_type})})}),e.querySelectorAll('[data-msg-action="start-dm"]').forEach(p=>{p.addEventListener("click",()=>{const v=p.dataset.factionId,y=p.querySelector(".msg-chat-item__name");F({type:"dm",id:v,name:y?.textContent||"Unknown"})})})}async function Te(){const e=m.id,{data:t,error:n}=await l.from("direct_messages").select("id, sender_id, receiver_id, message_text, read_at, created_at, sent_at_tick").or(`sender_id.eq.${e},receiver_id.eq.${e}`).order("created_at",{ascending:!1}).limit(200);if(n||!t){N=[];return}const a={};for(const o of t){const d=o.sender_id===e?o.receiver_id:o.sender_id;a[d]||(a[d]={lastMessage:o,unreadCount:0}),o.receiver_id===e&&!o.read_at&&a[d].unreadCount++}const i=Object.keys(a);if(i.length===0){N=[];return}const{data:s}=await l.from("factions").select("id, faction_name, abbreviation, party_color, faction_type").in("id",i),r={};for(const o of s||[])r[o.id]=o;N=i.filter(o=>r[o]).map(o=>({otherFaction:r[o],lastMessage:a[o].lastMessage,unreadCount:a[o].unreadCount})).sort((o,d)=>new Date(d.lastMessage.created_at)-new Date(o.lastMessage.created_at))}async function re(){const e=m.id,{data:t,error:n}=await l.from("group_chat_members").select("chat_id, last_read_at").eq("faction_id",e);if(n||!t||t.length===0){S=[];return}const a=t.map(d=>d.chat_id),i={};for(const d of t)i[d.chat_id]=d.last_read_at;const{data:s}=await l.from("group_chats").select("id, name, chat_type, ipo_org_id, nation_id").in("id",a);if(!s){S=[];return}const{data:r}=await l.from("group_chat_messages").select("chat_id, message_text, sender_id, created_at").in("chat_id",a).order("created_at",{ascending:!1}).limit(a.length*1),o={};for(const d of r||[])o[d.chat_id]||(o[d.chat_id]=d);S=s.map(d=>{const g=i[d.id],f=o[d.id],u=f&&(!g||new Date(f.created_at)>new Date(g));return{chat:d,lastMessage:f||null,unreadCount:u?1:0}}).sort((d,g)=>{const f=d.lastMessage?new Date(d.lastMessage.created_at):new Date(0);return(g.lastMessage?new Date(g.lastMessage.created_at):new Date(0))-f})}function X(e,t){const n=e.chat,a=e.lastMessage?e.lastMessage.message_text.slice(0,50):"No messages yet",i=n.name.slice(0,2).toUpperCase();n.chat_type==="global"||n.chat_type==="ipo"||n.chat_type;const s=e.unreadCount>0?`<div class="msg-chat-item__badge">${e.unreadCount}</div>`:"";return`<div class="msg-chat-item" data-msg-action="open-group" data-chat-id="${n.id}">
        <div class="msg-chat-item__avatar">${c(i)}</div>
        <div class="msg-chat-item__info">
            <div class="msg-chat-item__name">${c(n.name)}</div>
            <div class="msg-chat-item__preview">${c(a)}</div>
        </div>
        ${s}
    </div>`}function Le(e){const t=e.otherFaction,n=(t.abbreviation||t.faction_name||"?").slice(0,3).toUpperCase(),a=t.party_color||"#666",i=e.lastMessage?e.lastMessage.message_text.slice(0,50):"",s=e.unreadCount>0?`<div class="msg-chat-item__badge">${e.unreadCount}</div>`:"";return`<div class="msg-chat-item" data-msg-action="open-dm" data-faction-id="${t.id}">
        <div class="msg-chat-item__avatar" style="color:${c(a)};border-color:${c(a)};">${c(n)}</div>
        <div class="msg-chat-item__info">
            <div class="msg-chat-item__name">${c(t.faction_name)}</div>
            <div class="msg-chat-item__preview">${c(i)}</div>
        </div>
        ${s}
    </div>`}let W=!1,j={};async function F(e){h=e,q="thread";const t=document.getElementById("msg-body"),n=document.getElementById("msg-actions");n&&(n.style.display="none");const a=document.querySelector(".msg-panel__title");a&&(a.textContent=e.name||"Chat");const i=e.type==="group"&&e.chatType==="nation"&&w?`<img src="${c(w.flag_url||`assets/flags/${w.name}.png`)}" alt="" style="height:14px;vertical-align:middle;margin-left:6px;" onerror="this.style.display='none'">`:"";t.innerHTML=`
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
    `,document.getElementById("msg-back").addEventListener("click",()=>{a&&(a.textContent="Messages"),h=null,z=null,T=[],V=!1,R(),L(),B()});const s=document.getElementById("msg-search-btn");if(s&&s.addEventListener("click",()=>{V?xe():Re()}),setTimeout(()=>{const d=document.getElementById("msg-messages");d&&d.addEventListener("scroll",()=>{d.scrollTop<40&&z&&!Q&&ye()})},0),e.type==="group"){const d=document.getElementById("msg-members-toggle"),g=document.getElementById("msg-members-bar");d&&g&&d.addEventListener("click",async()=>{if(g.style.display!=="none"){g.style.display="none";return}g.innerHTML='<span style="color:var(--text-dim);font-size:10px;padding:4px 8px;">Loading...</span>',g.style.display="flex";try{const{data:f}=await l.from("group_chat_members").select("faction_id").eq("chat_id",e.id),u=(f||[]).map(b=>b.faction_id);await U(u),g.innerHTML=u.map(b=>{const x=j[b];if(!x)return"";const E=(x.abbreviation||x.faction_name||"?").slice(0,4),p=x.party_color||"#666",v=b===m.id;return'<span class="msg-member-chip" style="border-color:'+c(p)+";color:"+c(p)+(v?";opacity:1":"")+'" title="'+c(x.faction_name||"")+'">'+c(E)+"</span>"}).filter(Boolean).join("")||'<span style="color:var(--text-dim);font-size:10px;">No members</span>'}catch{g.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Failed to load</span>'}})}const r=document.getElementById("msg-input"),o=document.getElementById("msg-send");r.addEventListener("input",()=>{o.disabled=!r.value.trim()||W}),r.addEventListener("keydown",d=>{d.key==="Enter"&&!d.shiftKey&&r.value.trim()&&!W&&(d.preventDefault(),ue())}),o.addEventListener("click",()=>{r.value.trim()&&!W&&ue()}),await ae(),r.focus()}async function ae(){const e=document.getElementById("msg-messages");if(!e||!h)return;const t=h;let n=[],a=0;z=null,T=[];try{if(t.type==="dm"){const{data:s,error:r}=await l.from("direct_messages").select(ie).or(`and(sender_id.eq.${m.id},receiver_id.eq.${t.id}),and(sender_id.eq.${t.id},receiver_id.eq.${m.id})`).order("created_at",{ascending:!1}).limit(A);if(r)throw r;const o=(s||[]).slice().reverse();a=o.length,n=o.map(g=>de(g)),o.length>0&&(z=o[0].created_at);const d=o.filter(g=>g.receiver_id===m.id&&!g.read_at&&!g.deleted_at).map(g=>g.id);d.length>0&&l.from("direct_messages").update({read_at:new Date().toISOString()}).in("id",d).then(()=>{})}else if(t.type==="group"){const{data:s,error:r}=await l.from("group_chat_messages").select(oe).eq("chat_id",t.id).order("created_at",{ascending:!1}).limit(A);if(r)throw r;const o=(s||[]).slice().reverse();a=o.length;const d=[...new Set(o.map(g=>g.sender_id).filter(Boolean))];await U(d),n=o.map(g=>ce(g)),o.length>0&&(z=o[0].created_at),await Fe(t.id),l.from("group_chat_members").update({last_read_at:new Date().toISOString()}).eq("chat_id",t.id).eq("faction_id",m.id).then(()=>{})}}catch(s){console.warn("[Messaging] Failed to load messages:",s),e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">Failed to load messages.</div></div>';return}n=ee(n);const i=a>=A?'<button class="msg-load-earlier" id="msg-load-earlier">Load earlier messages</button>':"";n.length===0&&T.length===0&&!i?e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No messages yet.<br>Send the first message!</div></div>':e.innerHTML=i+n.map(s=>G(s)).join(""),je(),e.scrollTop=e.scrollHeight}function de(e){return{id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:e.sender_id===m.id,isSystem:!1,editedAt:e.edited_at,deletedAt:e.deleted_at}}function ce(e){return{id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:e.sender_id===m.id,isSystem:e.is_system,editedAt:e.edited_at,deletedAt:e.deleted_at,pinnedAt:e.pinned_at}}async function ye(){if(Q||!z||!h)return;Q=!0;const e=document.getElementById("msg-load-earlier");e&&(e.disabled=!0,e.textContent="Loading...");const t=h,n=document.getElementById("msg-messages"),a=n?n.scrollHeight:0;try{let i=[];if(t.type==="dm"){const{data:s,error:r}=await l.from("direct_messages").select(ie).or(`and(sender_id.eq.${m.id},receiver_id.eq.${t.id}),and(sender_id.eq.${t.id},receiver_id.eq.${m.id})`).lt("created_at",z).order("created_at",{ascending:!1}).limit(A);if(r)throw r;i=(s||[]).slice().reverse();const o=ee(i.map(de));pe(o,i,n,a)}else if(t.type==="group"){const{data:s,error:r}=await l.from("group_chat_messages").select(oe).eq("chat_id",t.id).lt("created_at",z).order("created_at",{ascending:!1}).limit(A);if(r)throw r;i=(s||[]).slice().reverse();const o=[...new Set(i.map(g=>g.sender_id).filter(Boolean))];await U(o);const d=ee(i.map(ce));pe(d,i,n,a)}}catch(i){console.warn("[Messaging] Failed to load older messages:",i),e&&(e.disabled=!1,e.textContent="Load earlier messages")}finally{Q=!1}}function pe(e,t,n,a){const i=document.getElementById("msg-load-earlier");if(!n)return;if(t.length===0){i&&i.remove();return}z=t[0].created_at;const s=e.map(r=>G(r)).join("");i?(i.insertAdjacentHTML("afterend",s),t.length<A?i.remove():(i.disabled=!1,i.textContent="Load earlier messages")):n.insertAdjacentHTML("afterbegin",s),n.scrollTop=n.scrollHeight-a}function ee(e){return!$||$.size===0?e:e.filter(t=>t.isMine||!t.senderId||!$.has(t.senderId))}function G(e){if(e.isSystem)return`<div class="msg-msg msg-msg--system">${c(e.text)}</div>`;if(e.deletedAt)return`<div class="msg-msg msg-msg--${e.isMine?"sent":"received"} msg-msg--deleted" data-msg-id="${c(e.id)}">
            <div>[message deleted]</div>
            <div class="msg-msg__time">${ne(e.createdAt)}</div>
        </div>`;const t=e.isMine?"msg-msg msg-msg--sent":"msg-msg msg-msg--received",n=ne(e.createdAt),a=e.editedAt?`<span class="msg-msg__edited" title="Edited ${ne(e.editedAt)}">(edited)</span>`:"",i=e.pinnedAt?'<span class="msg-msg__pinned" title="Pinned">📌</span>':"";let s="";if(!e.isMine&&h?.type==="group"&&e.senderId){const o=j[e.senderId],d=o?.party_color||"#888",g=o?.faction_name||o?.abbreviation||"...",f=(o?.abbreviation||o?.faction_name||"?").slice(0,3).toUpperCase(),u=h?.chatType;let b="";if(u==="global"&&o?.nation_name){const p=be[o.nation_name];p?b=`<img class="msg-msg__flag" src="${c(p)}" alt="${c(o.nation_name)}" title="${c(o.nation_name)}" />`:b=`<span class="msg-msg__nation">[${c(o.nation_name)}]</span>`}else u==="nation"&&o?.faction_type==="corporation"&&o?.corp_sector&&(b=`<span class="msg-msg__sector" title="Sector">${c(o.corp_sector)}</span>`);const E=!!o?`data-msg-action="open-profile" data-faction-id="${c(e.senderId)}" role="button" tabindex="0" title="View profile"`:'style="cursor:default;"';s=`<div class="msg-msg__header">
            <div class="msg-msg__avatar" style="color:${c(d)};border-color:${c(d)};">${c(f)}</div>
            <div class="msg-msg__nameplate" ${E}>
                <span class="msg-msg__name" style="color:${c(d)};">${c(g)}</span>
                ${b}
            </div>
        </div>`}const r=`<button class="msg-msg__menu-btn" data-msg-action="msg-menu" data-msg-id="${c(e.id)}" aria-label="Message actions" title="Actions">⋯</button>`;return`<div class="${t}" data-msg-id="${c(e.id)}">
        ${s}
        ${r}
        <div class="msg-msg__body">${i}<span class="msg-msg__text">${c(e.text)}</span>${a}</div>
        <div class="msg-msg__time">${n}</div>
    </div>`}let k=null;function L(){k&&k.parentNode&&k.parentNode.removeChild(k),k=null}function fe(e,t){L();const n=j[t];if(!n||!t)return;const a=document.getElementById("msg-panel");if(!a)return;const i=n.party_color||"#888",s=n.faction_type,r=s==="corporation"?"Corporation":s==="party"?"Political Party":s?s.charAt(0).toUpperCase()+s.slice(1).replace(/_/g," "):"Faction",o=n.nation_name||"",d=o?be[o]:"",g=ke(o),f=document.createElement("div");f.className="msg-identity-popover",f.setAttribute("role","dialog");const u=m&&t===m.id,b=$.has(t),x=u?"":`<button class="msg-identity-popover__btn" data-msg-action="${b?"unblock":"block"}" data-faction-id="${c(t)}">${b?"Unblock":"Block"} user</button>`;f.innerHTML=`
        <div class="msg-identity-popover__name" style="color:${c(i)};">${c(n.faction_name||n.abbreviation||"?")}</div>
        <div class="msg-identity-popover__row">
            ${d?`<img src="${c(d)}" alt="${c(o)}" />`:""}
            <span>${o?c(o):"No nation"}</span>
        </div>
        <div class="msg-identity-popover__row">
            <span>${c(r)}${s==="corporation"&&n.corp_sector?" — "+c(n.corp_sector):""}</span>
        </div>
        ${g?`<a class="msg-identity-popover__link" href="nation-info.html?name=${encodeURIComponent(g)}" target="_blank" rel="noopener">View Nation &rarr;</a>`:""}
        ${x}
    `,a.appendChild(f);const E=a.getBoundingClientRect(),p=e.getBoundingClientRect(),v=f.offsetWidth,y=f.offsetHeight;let _=p.left-E.left;const K=a.clientWidth-v-8;_>K&&(_=K),_<8&&(_=8);let H=p.bottom-E.top+4;H+y>a.clientHeight-8&&(H=p.top-E.top-y-4),H<8&&(H=8),f.style.top=H+"px",f.style.left=_+"px",f.dataset.factionId=t,k=f}function M(e,t){const n=document.getElementById("msg-panel");if(!n)return;const a=n.querySelector(".msg-toast");a&&a.remove();const i=document.createElement("div");i.className="msg-toast"+(t==="success"?" msg-toast--success":""),i.textContent=e,n.appendChild(i),setTimeout(()=>{i.parentNode&&i.parentNode.removeChild(i)},4500)}function O(e){return(e?.message||"").replace(/^[A-Z0-9]+:\s*/,"")}let I=null;function R(){I&&I.parentNode&&I.parentNode.removeChild(I),I=null}function Ie(e,t){R();const n=e.closest(".msg-msg");if(!n)return;const a=n.classList.contains("msg-msg--sent"),i=document.createElement("div");i.className="msg-msg__menu";const s=[];a?(s.push(`<button class="msg-msg__menu-item" data-msg-action="edit" data-msg-id="${c(t)}">Edit</button>`),s.push(`<button class="msg-msg__menu-item msg-msg__menu-item--danger" data-msg-action="delete" data-msg-id="${c(t)}">Delete</button>`)):s.push(`<button class="msg-msg__menu-item" data-msg-action="report" data-msg-id="${c(t)}">Report</button>`),i.innerHTML=s.join(""),n.appendChild(i),I=i}async function ze(e){if(R(),!h)return;const t=document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(e)}"]`);if(!t)return;const n=t.querySelector(".msg-msg__body"),a=t.querySelector(".msg-msg__text");if(!n||!a)return;const i=a.textContent,s=document.createElement("div");s.className="msg-msg__edit",s.innerHTML=`
        <textarea maxlength="2000"></textarea>
        <div class="msg-msg__edit-row">
            <button data-msg-action="edit-cancel">Cancel</button>
            <button class="primary" data-msg-action="edit-save" data-msg-id="${c(e)}">Save</button>
        </div>
    `,n.style.display="none",t.appendChild(s);const r=s.querySelector("textarea");r.value=i,r.focus(),r.setSelectionRange(r.value.length,r.value.length),r.addEventListener("keydown",o=>{o.key==="Escape"&&(o.preventDefault(),le(t))})}function le(e){const t=e.querySelector(".msg-msg__edit");t&&t.remove();const n=e.querySelector(".msg-msg__body");n&&(n.style.display="")}async function Be(e){const t=document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(e)}"]`);if(!t)return;const n=t.querySelector(".msg-msg__edit textarea");if(!n)return;const a=n.value.trim();if(!a){M("Message cannot be empty");return}if(!h)return;const i=t.querySelector('[data-msg-action="edit-save"]');i&&(i.disabled=!0);const s=h.type==="dm"?"direct_messages":"group_chat_messages";try{const{error:r}=await l.from(s).update({message_text:a}).eq("id",e);if(r)throw r;le(t);const o=t.querySelector(".msg-msg__text");o&&(o.textContent=a);const d=t.querySelector(".msg-msg__body");if(d&&!d.querySelector(".msg-msg__edited")){const g=document.createElement("span");g.className="msg-msg__edited",g.textContent="(edited)",d.appendChild(g)}M("Message updated","success")}catch(r){console.warn("[Messaging] Edit failed:",r),M("Edit failed: "+O(r)),i&&(i.disabled=!1)}}async function He(e){if(R(),!h||!confirm("Delete this message? This cannot be undone."))return;const t=h.type==="dm"?"direct_messages":"group_chat_messages";try{const n=h.type==="dm"?{deleted_at:new Date().toISOString()}:{deleted_at:new Date().toISOString(),deleted_by:m.id},{error:a}=await l.from(t).update(n).eq("id",e);if(a)throw a;const i=document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(e)}"]`);if(i){i.classList.add("msg-msg--deleted");const s=i.querySelector(".msg-msg__body");s&&(s.innerHTML="[message deleted]");const r=i.querySelector(".msg-msg__menu-btn");r&&r.remove();const o=i.querySelector(".msg-msg__header");o&&o.remove()}}catch(n){console.warn("[Messaging] Delete failed:",n),M("Delete failed: "+O(n))}}async function Ne(e){if(R(),!h||!m)return;const t=prompt("Why are you reporting this message? (max 500 chars)");if(t==null)return;const n=String(t).trim().slice(0,500);if(!n){M("Report reason required");return}try{const a={message_kind:h.type==="dm"?"dm":"group",message_id:e,chat_id:h.type==="group"?h.id:null,reporter_faction_id:m.id,reason:n},{error:i}=await l.from("message_reports").insert(a);if(i)throw i;M("Report submitted. Admins will review.","success")}catch(a){console.warn("[Messaging] Report failed:",a),M("Report failed: "+O(a))}}async function Ae(){if(!m){$=new Set;return}try{const{data:e,error:t}=await l.from("user_blocks").select("blocked_faction_id").eq("blocker_faction_id",m.id);if(t)throw t;$=new Set((e||[]).map(n=>n.blocked_faction_id))}catch(e){console.warn("[Messaging] Failed to load block list:",e),$=new Set}}async function Pe(e){if(L(),!(!m||e===m.id))try{const{error:t}=await l.from("user_blocks").insert({blocker_faction_id:m.id,blocked_faction_id:e});if(t&&t.code!=="23505")throw t;$.add(e),M("User blocked. Their messages are now hidden.","success"),q==="thread"&&ae()}catch(t){console.warn("[Messaging] Block failed:",t),M("Block failed: "+O(t))}}async function De(e){if(L(),!!m)try{const{error:t}=await l.from("user_blocks").delete().eq("blocker_faction_id",m.id).eq("blocked_faction_id",e);if(t)throw t;$.delete(e),M("User unblocked.","success"),q==="thread"&&ae()}catch(t){console.warn("[Messaging] Unblock failed:",t),M("Unblock failed: "+O(t))}}async function Fe(e){try{const{data:t,error:n}=await l.from("group_chat_messages").select("id, sender_id, message_text, created_at, pinned_at, deleted_at").eq("chat_id",e).not("pinned_at","is",null).is("deleted_at",null).order("pinned_at",{ascending:!1}).limit(3);if(n)throw n;T=t||[];const a=[...new Set(T.map(i=>i.sender_id).filter(Boolean))];a.length>0&&await U(a)}catch(t){console.warn("[Messaging] Failed to load pinned messages:",t),T=[]}}function je(){const e=document.getElementById("msg-pinned-strip");if(e&&e.remove(),!T||T.length===0)return;const t=document.getElementById("msg-messages");if(!t||!t.parentNode)return;const n=document.createElement("div");n.id="msg-pinned-strip",n.className="msg-pinned-strip";const a=T.map(i=>{const s=j[i.sender_id],r=s?.abbreviation||s?.faction_name||"?",o=(i.message_text||"").slice(0,120);return`<div class="msg-pinned-strip__item">📌 <strong>${c(r)}</strong>: ${c(o)}</div>`}).join("");n.innerHTML=`<div class="msg-pinned-strip__hdr">Pinned · ${T.length}/3</div>${a}`,t.parentNode.insertBefore(n,t)}async function Re(){if(!document.getElementById("msg-body")||!h||V)return;V=!0;const t=document.createElement("div");t.className="msg-search-bar",t.id="msg-search-bar",t.innerHTML=`
        <input type="text" id="msg-search-input" placeholder="Search messages..." maxlength="120" />
        <button id="msg-search-close">Close</button>
    `;const n=document.getElementById("msg-messages");n&&n.parentNode&&n.parentNode.insertBefore(t,n);const a=document.getElementById("msg-search-input"),i=document.getElementById("msg-search-close");let s=null;a.addEventListener("input",()=>{clearTimeout(s);const r=a.value.trim();s=setTimeout(()=>Ge(r),200)}),i.addEventListener("click",xe),a.focus()}function xe(){V=!1;const e=document.getElementById("msg-search-bar");e&&e.remove(),ae()}async function Ge(e){const t=document.getElementById("msg-messages");if(!(!t||!h)){if(!e){t.innerHTML='<div class="msg-empty"><div class="msg-empty__text">Type to search this channel.<br>Close to return to the thread.</div></div>';return}try{let n=[];if(h.type==="group"){const{data:i,error:s}=await l.from("group_chat_messages").select(oe).eq("chat_id",h.id).is("deleted_at",null).ilike("message_text",`%${e}%`).order("created_at",{ascending:!1}).limit(A);if(s)throw s;n=(i||[]).reverse();const r=[...new Set(n.map(o=>o.sender_id).filter(Boolean))];r.length>0&&await U(r)}else{const{data:i,error:s}=await l.from("direct_messages").select(ie).or(`and(sender_id.eq.${m.id},receiver_id.eq.${h.id}),and(sender_id.eq.${h.id},receiver_id.eq.${m.id})`).is("deleted_at",null).ilike("message_text",`%${e}%`).order("created_at",{ascending:!1}).limit(A);if(s)throw s;n=(i||[]).reverse()}const a=ee(n.map(h.type==="dm"?de:ce));a.length===0?t.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No matches.</div></div>':t.innerHTML=a.map(i=>G(i)).join("")}catch(n){console.warn("[Messaging] Search failed:",n),t.innerHTML='<div class="msg-empty"><div class="msg-empty__text">Search failed.</div></div>'}}}async function U(e){const t=e.filter(s=>!j[s]);if(t.length===0)return;let n=null;try{const{data:s,error:r}=await l.from("factions").select("id, faction_name, abbreviation, party_color, faction_type, corp_sector, nation_id").in("id",t);if(r)throw r;n=s}catch(s){console.warn("[Messaging] loadFactionNames: factions query failed:",s);return}const a=[...new Set((n||[]).map(s=>s.nation_id).filter(Boolean))],i={};if(a.length>0)try{const{data:s,error:r}=await l.from("nations").select("id, name").in("id",a);if(r)throw r;for(const o of s||[])i[o.id]=o.name}catch(s){console.warn("[Messaging] loadFactionNames: nations query failed (nameplates will render without flag/tag):",s)}for(const s of n||[])j[s.id]={id:s.id,faction_name:s.faction_name,abbreviation:s.abbreviation,party_color:s.party_color,faction_type:s.faction_type,corp_sector:s.corp_sector,nation_id:s.nation_id,nation_name:s.nation_id&&i[s.nation_id]||null}}function ne(e){if(!e)return"";try{const t=new Date(e),a=new Date-t,i=Math.floor(a/6e4);if(i<1)return"now";if(i<60)return i+"m ago";const s=Math.floor(i/60);if(s<24)return s+"h ago";const r=Math.floor(s/24);return r<7?r+"d ago":t.toLocaleDateString()}catch{return""}}async function ue(){const e=document.getElementById("msg-input"),t=document.getElementById("msg-send"),n=h;if(!e||!n||!m)return;const a=e.value.trim();if(a){W=!0,t&&(t.disabled=!0),e.value="";try{const i=he?.current_tick||null;let s=null;if(n.type==="dm"){const{data:o,error:d}=await l.from("direct_messages").insert({sender_id:m.id,receiver_id:n.id,message_text:a,sent_at_tick:i}).select("id, created_at").single();if(d)throw d;s=o}else if(n.type==="group"){const{data:o,error:d}=await l.from("group_chat_messages").insert({chat_id:n.id,sender_id:m.id,is_system:!1,message_text:a,sent_at_tick:i}).select("id, created_at").single();if(d)throw d;s=o}const r=document.getElementById("msg-messages");if(r&&s){const o=r.querySelector(".msg-empty");o&&o.remove(),r.insertAdjacentHTML("beforeend",G({id:s.id,senderId:m.id,text:a,createdAt:s.created_at,tick:i,isMine:!0,isSystem:!1})),r.scrollTop=r.scrollHeight}}catch(i){console.warn("[Messaging] Send failed:",i),e.value=a,M(O(i)||"Failed to send message.")}finally{W=!1,t&&(t.disabled=!e.value.trim()),e.focus()}}}let P=[],te=null;function Oe(){q="new-dm";const e=document.getElementById("msg-body"),t=document.getElementById("msg-actions");t&&(t.style.display="none");const n=document.querySelector(".msg-panel__title");n&&(n.textContent="New Message"),e.innerHTML=`
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
    `,document.getElementById("msg-back").addEventListener("click",()=>{n&&(n.textContent="Messages"),B()});const a=document.getElementById("msg-search");a.addEventListener("input",()=>{clearTimeout(te),te=setTimeout(()=>We(a.value.trim()),250)}),a.focus(),(async()=>{try{const{data:i}=await l.from("nations").select("id, name").order("name"),s=document.getElementById("msg-role-nation");s&&i&&(s.innerHTML='<option value="">Select a nation...</option>'+i.map(r=>'<option value="'+r.id+'">'+c(r.name)+"</option>").join(""),s.addEventListener("change",()=>Ue(s.value)))}catch{}})()}async function Ue(e){const t=document.getElementById("msg-role-results");if(t){if(!e){t.innerHTML="";return}t.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Loading roles...</span>';try{const[n,a,i]=await Promise.all([l.from("ministries").select("ministry_key, party_id, factions(id, faction_name, abbreviation, party_color)").eq("nation_id",e).in("ministry_key",["foreign","trade","prime_minister"]).eq("is_active",!0),l.from("government_formations").select("ministry_assignments, proposed_by").eq("nation_id",e).eq("status","formed").order("created_at",{ascending:!1}).limit(1).maybeSingle(),l.from("nations").select("ruling_faction_id").eq("id",e).single()]),s=[],r=(n.data||[]).find(f=>f.ministry_key==="prime_minister"),o=we(a.data)||i.data?.ruling_faction_id||r?.party_id;if(o){const f=r?.factions||(n.data||[]).find(u=>u.party_id===o)?.factions;if(f)s.push({role:"Head of Government",faction:f});else{const{data:u}=await l.from("factions").select("id, faction_name, abbreviation, party_color").eq("id",o).single();u&&s.push({role:"Head of Government",faction:u})}}const d=(n.data||[]).find(f=>f.ministry_key==="foreign");d?.factions&&s.push({role:"Foreign Minister",faction:d.factions});const g=(n.data||[]).find(f=>f.ministry_key==="trade");if(g?.factions&&s.push({role:"Minister of Trade",faction:g.factions}),s.length===0){t.innerHTML='<span style="color:var(--text-dim);font-size:10px;">No diplomatic roles found for this nation.</span>';return}t.innerHTML=s.map(f=>{const u=f.faction,b=u.party_color||"#666",x=(u.abbreviation||u.faction_name||"?").slice(0,4),E=u.id===m.id;return'<div class="msg-role-row" data-role-faction-id="'+u.id+'"'+(E?' style="opacity:0.4;cursor:default;" title="This is you"':"")+'><span class="msg-role-badge">'+c(f.role)+'</span><span class="msg-role-party" style="color:'+c(b)+';">'+c(x)+" — "+c(u.faction_name)+"</span></div>"}).join(""),t.querySelectorAll(".msg-role-row").forEach(f=>{const u=f.dataset.roleFactionId;u!==m.id&&f.addEventListener("click",()=>{const b=s.find(x=>x.faction.id===u);b&&F({type:"dm",id:u,name:b.faction.faction_name,faction:b.faction})})})}catch(n){console.warn("[Messaging] Role lookup failed:",n),t.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Failed to load roles.</span>'}}}async function We(e){const t=document.getElementById("msg-search-results");if(!t)return;const n=(e||"").replace(/[%_\\]/g,"");if(n)try{const{data:a}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation, faction_type").neq("id",m.id).or(`faction_name.ilike.%${n}%,abbreviation.ilike.%${n}%,nation.ilike.%${n}%`).eq("faction_type","party").not("nation_id","is",null).order("faction_name").limit(20);P=a||[]}catch{P=[]}else try{const{data:a}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation, faction_type").eq("nation_id",w?.id).eq("faction_type","party").neq("id",m.id).order("faction_name").limit(20);P=a||[]}catch{P=[]}if(P.length===0){t.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No parties found.</div></div>';return}t.innerHTML=P.map(a=>{const i=(a.abbreviation||a.faction_name||"?").slice(0,3).toUpperCase(),s=a.party_color||"#666",r=a.nation||"";return`<div class="msg-chat-item" data-msg-action="pick-dm" data-faction-id="${a.id}">
            <div class="msg-chat-item__avatar" style="color:${c(s)};border-color:${c(s)};">${c(i)}</div>
            <div class="msg-chat-item__info">
                <div class="msg-chat-item__name">${c(a.faction_name)}</div>
                <div class="msg-chat-item__preview">${c(r)}</div>
            </div>
        </div>`}).join(""),t.querySelectorAll('[data-msg-action="pick-dm"]').forEach(a=>{a.addEventListener("click",()=>{const i=a.dataset.factionId,s=P.find(r=>r.id===i);s&&F({type:"dm",id:i,name:s.faction_name,faction:s})})})}let C=new Set;function Ye(){q="new-group",C=new Set;const e=document.getElementById("msg-body"),t=document.getElementById("msg-actions");t&&(t.style.display="none");const n=document.querySelector(".msg-panel__title");n&&(n.textContent="New Group Chat"),e.innerHTML=`
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
    `,document.getElementById("msg-back").addEventListener("click",()=>{n&&(n.textContent="Messages"),B()});const a=document.getElementById("msg-group-search");a.addEventListener("input",()=>{clearTimeout(te),te=setTimeout(()=>se(a.value.trim()),250)}),document.getElementById("msg-create-group").addEventListener("click",Ze),se("")}async function se(e){const t=document.getElementById("msg-group-results");if(!t)return;const n=(e||"").replace(/[%_\\]/g,"");let a=[];try{if(n){const{data:i}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation").neq("id",m.id).or(`faction_name.ilike.%${n}%,abbreviation.ilike.%${n}%,nation.ilike.%${n}%`).eq("faction_type","party").not("nation_id","is",null).order("faction_name").limit(20);a=i||[]}else{const{data:i}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation").eq("nation_id",w?.id).eq("faction_type","party").neq("id",m.id).order("faction_name").limit(20);a=i||[]}}catch{a=[]}if(a.length===0){t.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No parties found.</div></div>';return}t.innerHTML=a.map(i=>{const s=(i.abbreviation||i.faction_name||"?").slice(0,3).toUpperCase(),r=i.party_color||"#666",o=C.has(i.id);return`<div class="msg-chat-item" data-msg-action="toggle-group-member" data-faction-id="${i.id}" style="${o?"background:rgba(90,175,165,0.08);":""}">
            <div class="msg-chat-item__avatar" style="color:${c(r)};border-color:${c(r)};">${c(s)}</div>
            <div class="msg-chat-item__info">
                <div class="msg-chat-item__name">${c(i.faction_name)}</div>
                <div class="msg-chat-item__preview">${c(i.nation||"")}</div>
            </div>
            <div style="font-family:var(--font-mono,monospace);font-size:14px;color:${o?"var(--teal,#5aafa5)":"var(--text-dim,#4a4940)"};">${o?"✓":"+"}</div>
        </div>`}).join(""),t.querySelectorAll('[data-msg-action="toggle-group-member"]').forEach(i=>{i.addEventListener("click",()=>{const s=i.dataset.factionId;C.has(s)?C.delete(s):C.add(s),se(document.getElementById("msg-group-search")?.value?.trim()||""),Ve(),Ke()})})}function Ve(){const e=document.getElementById("msg-group-selected");if(e){if(C.size===0){e.style.display="none",e.innerHTML="";return}e.style.display="flex",e.innerHTML=`<span style="font-family:var(--font-mono,monospace);font-size:8px;color:var(--text-dim);">${C.size} member${C.size>1?"s":""} selected</span>`}}function Ke(){const e=document.getElementById("msg-create-group");e&&(e.disabled=C.size===0)}function Xe(e){const t=(e?.message||"").toLowerCase(),n=e?.code||"";return n==="42501"||t.includes("not authenticated")||t.includes("authentication required")?"You must be signed in to create a group chat.":t.includes("no faction linked")?"No faction is linked to your account yet. Reload and try again.":t.includes("select at least one other member")?"Select at least one other faction before creating a group chat.":t.includes("100 characters or fewer")?"Group chat name must be 100 characters or fewer.":t.includes("selected members were not found")?"One or more selected factions could not be found. Refresh the member list and try again.":n==="23505"?"This group already exists with the selected members.":t.includes("row-level security")||n==="PGRST301"?"You do not have permission to create this group chat.":e?.message||"Unknown error"}async function Ze(){const e=document.getElementById("msg-group-name"),t=document.getElementById("msg-create-group"),n=e?.value?.trim()||"Group Chat";if(C.size!==0){t&&(t.disabled=!0);try{const{data:a,error:i}=await l.rpc("create_custom_group_chat",{chat_name:n,member_ids:Array.from(C)});if(i)throw i;const s=Array.isArray(a)?a[0]:a,r=s?.chat_id,o=s?.name||n;if(!r)throw new Error("Group chat creation returned no chat id");const d=document.querySelector(".msg-panel__title");d&&(d.textContent="Messages"),F({type:"group",id:r,name:o,chatType:"custom"})}catch(a){console.error("[Messaging] Create group failed:",a),alert("Failed to create group chat: "+Xe(a)),t&&(t.disabled=!1)}}}async function Je(){if(!(!m||!m.id))try{w?.id&&await Qe(w.id,w.name||"Nation");const{data:e}=await l.from("ipo_members").select("org_id, international_orgs!inner(id, name, is_active)").eq("faction_id",m.id).eq("is_active",!0);for(const t of e||[]){const n=t.international_orgs;!n||!n.is_active||await et(n.id,n.name)}}catch(e){console.warn("[Messaging] Auto-chat sync failed (non-blocking):",e)}}async function Qe(e,t){const{data:n}=await l.from("group_chats").select("id").eq("nation_id",e).eq("chat_type","nation").maybeSingle();let a;if(n)a=n.id;else{const{data:s,error:r}=await l.from("group_chats").insert({name:t+" Chat",chat_type:"nation",nation_id:e}).select("id").single();if(r)if(r.code==="23505"){const{data:o}=await l.from("group_chats").select("id").eq("nation_id",e).eq("chat_type","nation").maybeSingle();a=o?.id}else{console.warn("[Messaging] Nation chat create failed:",r.message);return}else a=s.id}if(!a)return;const{error:i}=await l.from("group_chat_members").upsert({chat_id:a,faction_id:m.id},{onConflict:"chat_id,faction_id"});if(!i)try{const{data:s}=await l.from("factions").select("id").eq("nation_id",w.id).eq("faction_type","party").not("nation_id","is",null),{data:r}=await l.from("group_chats").select("created_by").eq("id",a).single();if(r?.created_by===m.id&&s&&s.length>0){const d=s.map(g=>({chat_id:a,faction_id:g.id}));await l.from("group_chat_members").upsert(d,{onConflict:"chat_id,faction_id"})}}catch{}}async function et(e,t){const{data:n}=await l.from("group_chats").select("id").eq("ipo_org_id",e).eq("chat_type","ipo").maybeSingle();let a;if(n)a=n.id;else{const{data:s,error:r}=await l.from("group_chats").insert({name:t,chat_type:"ipo",ipo_org_id:e}).select("id").single();if(r)if(r.code==="23505"){const{data:o}=await l.from("group_chats").select("id").eq("ipo_org_id",e).eq("chat_type","ipo").maybeSingle();a=o?.id}else{console.warn("[Messaging] IPO chat create failed:",r.message);return}else a=s.id}if(!a)return;const{error:i}=await l.from("group_chat_members").upsert({chat_id:a,faction_id:m.id},{onConflict:"chat_id,faction_id"});if(!i)try{const{data:s}=await l.from("group_chats").select("created_by").eq("id",a).single();if(s?.created_by===m.id){const{data:o}=await l.from("ipo_members").select("faction_id").eq("org_id",e).eq("is_active",!0);if(o&&o.length>0){const d=o.map(g=>({chat_id:a,faction_id:g.faction_id}));await l.from("group_chat_members").upsert(d,{onConflict:"chat_id,faction_id"})}}}catch{}}function tt(){m?.id&&(at(),Z=l.channel("msg-dm-"+m.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages",filter:`receiver_id=eq.${m.id}`},e=>{nt(e.new)}).subscribe(),J=l.channel("msg-gc-"+m.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"group_chat_messages"},e=>{st(e.new)}).subscribe())}function at(){Z&&(l.removeChannel(Z),Z=null),J&&(l.removeChannel(J),J=null)}function nt(e){if(!(!e||e.sender_id===m.id)&&!$.has(e.sender_id)){if(D&&q==="thread"&&h?.type==="dm"&&h.id===e.sender_id){const t=document.getElementById("msg-messages");if(t){const n=t.querySelector(".msg-empty");n&&n.remove(),t.insertAdjacentHTML("beforeend",G({id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:!1,isSystem:!1})),t.scrollTop=t.scrollHeight}l.from("direct_messages").update({read_at:new Date().toISOString()}).eq("id",e.id).then(()=>{});return}D&&q==="list"&&B()}}function st(e){if(!(!e||e.sender_id===m.id||$.has(e.sender_id)||!S.some(n=>n.chat.id===e.chat_id))){if(D&&q==="thread"&&h?.type==="group"&&h.id===e.chat_id){(async()=>{e.sender_id&&!j[e.sender_id]&&await U([e.sender_id]);const a=document.getElementById("msg-messages");if(a){const i=a.querySelector(".msg-empty");i&&i.remove(),a.insertAdjacentHTML("beforeend",G({id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:!1,isSystem:e.is_system||!1})),a.scrollTop=a.scrollHeight}l.from("group_chat_members").update({last_read_at:new Date().toISOString()}).eq("chat_id",e.chat_id).eq("faction_id",m.id).then(()=>{})})();return}D&&q==="list"&&B()}}function ct(e,t,n){m=e,w=t,he=n,!(!e||!e.id)&&(Me(),Ee(),Ae(),Je().then(()=>re()),tt())}export{ct as initMessaging};
