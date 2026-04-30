import{_supabase as l}from"./supabase-client-qEAQbBjE.js";import{escapeHtml as c}from"./utils-A98FEun4.js";import{r as Me}from"./government-structure-C17uG6rl.js";let m=null,w=null,_e=null,P=!1,q="list",V="all",b=null,J=null,Q=null,G=0,$=new Set,z=null,ee=!1,L=[],K=!1;const A=50,oe="id, sender_id, receiver_id, message_text, created_at, sent_at_tick, read_at, edited_at, deleted_at",re="id, sender_id, is_system, message_text, created_at, sent_at_tick, edited_at, deleted_at, pinned_at",ve={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png",Sierramar:"assets/flags/Sierramar.png",Dravka:"assets/flags/Dravka.png",Hajjara:"assets/flags/Hajjara.png"};function Ee(e){return e?String(e).toLowerCase().replace(/\s+/g,""):""}function Se(){if(document.getElementById("msg-styles"))return;const e=document.createElement("style");e.id="msg-styles",e.textContent=`
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
.msg-bubble__badge {
    position: absolute; top: -4px; right: -4px;
    min-width: 18px; height: 18px; border-radius: 9px;
    background: var(--amber, #c8a64e); color: #000;
    font-family: var(--font-mono, monospace); font-size: 10px; font-weight: 700;
    display: none; align-items: center; justify-content: center;
    padding: 0 4px; line-height: 1;
}
.msg-bubble__badge.visible { display: flex; }

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
    `,document.head.appendChild(e)}function Ce(){if(document.getElementById("msg-bubble"))return;const e=document.createElement("div");e.id="msg-bubble",e.className="msg-bubble",e.innerHTML='💬<div class="msg-bubble__badge" id="msg-badge">0</div>',e.addEventListener("click",fe),document.body.appendChild(e);const t=document.createElement("div");t.id="msg-panel",t.className="msg-panel",t.innerHTML=`
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
    `,document.body.appendChild(t),document.getElementById("msg-close").addEventListener("click",fe),document.getElementById("msg-new-dm").addEventListener("click",()=>We()),document.getElementById("msg-new-group").addEventListener("click",()=>Ke());const n=document.getElementById("msg-tabs");n&&n.addEventListener("click",a=>{const s=a.target.closest(".msg-tab");if(!s)return;const i=s.dataset.filter;!i||i===V||(V=i,ye(i),i==="global"?Le():i==="nation"?Te():B())}),qe(t),t.addEventListener("click",a=>{const s=a.target.closest("[data-msg-action]"),i=s?.dataset?.msgAction;if(i==="open-profile"){a.stopPropagation();const o=s.dataset.factionId;M&&M.dataset.factionId===o?T():he(s,o);return}if(i==="block"||i==="unblock"){a.stopPropagation();const o=s.dataset.factionId;i==="block"?je(o):Fe(o);return}if(i==="msg-menu"){a.stopPropagation();const o=s.dataset.msgId;I&&I.parentNode?.dataset?.msgId===o?R():Be(s,o);return}if(i==="edit"){a.stopPropagation(),Ne(s.dataset.msgId);return}if(i==="edit-save"){a.stopPropagation(),He(s.dataset.msgId);return}if(i==="edit-cancel"){a.stopPropagation();const o=s.closest(".msg-msg");o&&me(o);return}if(i==="delete"){a.stopPropagation(),Ae(s.dataset.msgId);return}if(i==="report"){a.stopPropagation(),De(s.dataset.msgId);return}if(a.target.id==="msg-load-earlier"){a.stopPropagation(),we();return}I&&!a.target.closest(".msg-msg__menu")&&!a.target.closest(".msg-msg__menu-btn")&&R(),M&&!a.target.closest(".msg-identity-popover")&&T()}),t.addEventListener("keydown",a=>{if(a.key==="Escape"&&M){T();return}(a.key==="Enter"||a.key===" ")&&a.target.matches('[data-msg-action="open-profile"]')&&(a.preventDefault(),he(a.target,a.target.dataset.factionId))}),document.addEventListener("click",a=>{M&&(t.contains(a.target)||T())}),t.addEventListener("scroll",()=>{M&&T()},!0)}function ye(e){document.querySelectorAll(".msg-tab").forEach(t=>t.classList.toggle("msg-tab--active",t.dataset.filter===e))}function $e(e){ye(V),document.querySelectorAll(".msg-tab").forEach(t=>{const n=e[t.dataset.filter]||0,a=t.querySelector(".msg-tab__badge");if(a&&a.remove(),n>0){const s=document.createElement("span");s.className="msg-tab__badge",s.textContent=n>99?"99+":String(n),s.title=n+" unread",t.appendChild(s)}})}const pe="msg-panel-size";function qe(e){if(!e)return;try{const r=localStorage.getItem(pe);if(r){const d=JSON.parse(r);d&&typeof d.width=="number"&&typeof d.height=="number"&&(e.style.width=Math.max(320,Math.min(d.width,900))+"px",e.style.height=Math.max(400,Math.min(d.height,900))+"px")}}catch{}if(e.querySelector(".msg-resize-handle"))return;const t=document.createElement("div");t.className="msg-resize-handle",t.title="Drag to resize",e.appendChild(t);let n=!1,a,s,i,o;t.addEventListener("mousedown",r=>{window.innerWidth<=640||(n=!0,a=r.clientX,s=r.clientY,i=e.offsetWidth,o=e.offsetHeight,document.body.style.userSelect="none",r.preventDefault())}),window.addEventListener("mousemove",r=>{if(!n)return;const d=a-r.clientX,p=s-r.clientY,f=Math.max(320,Math.min(i+d,900)),u=Math.max(400,Math.min(o+p,900));e.style.width=f+"px",e.style.height=u+"px"}),window.addEventListener("mouseup",()=>{if(n){n=!1,document.body.style.userSelect="";try{localStorage.setItem(pe,JSON.stringify({width:e.offsetWidth,height:e.offsetHeight}))}catch{}}})}function fe(){P=!P;const e=document.getElementById("msg-panel"),t=document.getElementById("msg-bubble");!e||!t||(P?(e.classList.add("open"),t.style.display="none",q="list",B()):(e.classList.remove("open"),t.style.display=""))}let H=[],E=[];async function xe(e,t,n){if(!E.length)try{await de()}catch(s){console.warn("[Messaging] Failed to load group chats:",s)}if(V!==e)return;const a=E.find(t);if(!a){B();return}j({type:"group",id:a.chat.id,name:n||a.chat.name,chatType:a.chat.chat_type})}function Le(){return xe("global",e=>e.chat.chat_type==="global")}function Te(){if(!w?.id){B();return}return xe("nation",e=>e.chat.chat_type==="nation"&&e.chat.nation_id===w.id,"Nation")}async function B(){const e=document.getElementById("msg-body"),t=document.getElementById("msg-actions");t&&(t.style.display=""),q="list";const n=document.querySelector(".msg-panel__title");if(n&&(n.textContent="Messages"),!m){e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No faction selected.</div></div>';return}e.innerHTML='<div class="msg-empty"><div class="msg-empty__text" style="color:var(--text-dim);">Loading...</div></div>';try{await Promise.all([Ie(),de()])}catch(g){console.warn("[Messaging] Failed to load chats:",g)}let a="";const s=E.filter(g=>g.chat.chat_type==="global"),i=E.filter(g=>g.chat.chat_type==="ipo"),o=E.filter(g=>g.chat.chat_type==="nation"&&g.chat.nation_id===w?.id),r=E.filter(g=>g.chat.chat_type==="custom"),d=g=>g.reduce((y,x)=>y+(x.unreadCount||0),0),p={global:d(s),nation:d(o),dm:H.reduce((g,y)=>g+(y.unreadCount||0),0)};p.all=p.global+p.nation+p.dm+d(i)+d(r),$e(p);const f=V||"all",u=f==="all"||f==="global",h=f==="all"||f==="nation",v=f==="all",k=f==="all"||f==="dm";if(u&&s.length>0&&(a+='<div class="msg-section-hdr">Global Chat</div>',a+=s.map(g=>Z(g)).join("")),h&&o.length>0&&(a+='<div class="msg-section-hdr">Nation Chat</div>',a+=o.map(g=>Z(g)).join("")),v&&i.length>0&&(a+='<div class="msg-section-hdr">Organisation Chats</div>',a+=i.map(g=>Z(g)).join("")),v&&r.length>0&&(a+='<div class="msg-section-hdr">Group Chats</div>',a+=r.map(g=>Z(g)).join("")),k&&H.length>0&&(a+='<div class="msg-section-hdr">Direct Messages</div>',a+=H.map(g=>ze(g)).join("")),(f==="all"||f==="dm")&&w)try{const{data:g}=await l.from("factions").select("id, faction_name, abbreviation, party_color").eq("nation_id",w.id).eq("faction_type","party").neq("id",m.id).order("faction_name");if(g&&g.length>0){const y=new Set(H.map(_=>_.otherFaction.id)),x=g.filter(_=>!y.has(_.id));x.length>0&&(a+='<div class="msg-section-hdr">Parties in Your Nation</div>',a+=x.map(_=>{const X=(_.abbreviation||_.faction_name||"?").slice(0,3).toUpperCase(),N=_.party_color||"#666";return`<div class="msg-chat-item" data-msg-action="start-dm" data-faction-id="${_.id}">
                            <div class="msg-chat-item__avatar" style="color:${c(N)};border-color:${c(N)};">${c(X)}</div>
                            <div class="msg-chat-item__info">
                                <div class="msg-chat-item__name">${c(_.faction_name)}</div>
                                <div class="msg-chat-item__preview">Start a conversation</div>
                            </div>
                        </div>`}).join(""))}}catch(g){console.warn("[Messaging] Failed to load nation parties:",g)}a||(a='<div class="msg-empty"><div class="msg-empty__text">No messages yet.<br>Start a conversation using<br>the buttons above.</div></div>'),e.innerHTML=a,e.querySelectorAll('[data-msg-action="open-dm"]').forEach(g=>{g.addEventListener("click",()=>{const y=g.dataset.factionId,x=H.find(_=>_.otherFaction.id===y);x&&j({type:"dm",id:y,name:x.otherFaction.faction_name,faction:x.otherFaction})})}),e.querySelectorAll('[data-msg-action="open-group"]').forEach(g=>{g.addEventListener("click",()=>{const y=g.dataset.chatId,x=E.find(_=>_.chat.id===y);x&&j({type:"group",id:y,name:x.chat.name,chatType:x.chat.chat_type})})}),e.querySelectorAll('[data-msg-action="start-dm"]').forEach(g=>{g.addEventListener("click",()=>{const y=g.dataset.factionId,x=g.querySelector(".msg-chat-item__name");j({type:"dm",id:y,name:x?.textContent||"Unknown"})})})}async function Ie(){const e=m.id,{data:t,error:n}=await l.from("direct_messages").select("id, sender_id, receiver_id, message_text, read_at, created_at, sent_at_tick").or(`sender_id.eq.${e},receiver_id.eq.${e}`).order("created_at",{ascending:!1}).limit(200);if(n||!t){H=[];return}const a={};for(const r of t){const d=r.sender_id===e?r.receiver_id:r.sender_id;a[d]||(a[d]={lastMessage:r,unreadCount:0}),r.receiver_id===e&&!r.read_at&&a[d].unreadCount++}const s=Object.keys(a);if(s.length===0){H=[];return}const{data:i}=await l.from("factions").select("id, faction_name, abbreviation, party_color, faction_type").in("id",s),o={};for(const r of i||[])o[r.id]=r;H=s.filter(r=>o[r]).map(r=>({otherFaction:o[r],lastMessage:a[r].lastMessage,unreadCount:a[r].unreadCount})).sort((r,d)=>new Date(d.lastMessage.created_at)-new Date(r.lastMessage.created_at))}async function de(){const e=m.id,{data:t,error:n}=await l.from("group_chat_members").select("chat_id, last_read_at").eq("faction_id",e);if(n||!t||t.length===0){E=[];return}const a=t.map(d=>d.chat_id),s={};for(const d of t)s[d.chat_id]=d.last_read_at;const{data:i}=await l.from("group_chats").select("id, name, chat_type, ipo_org_id, nation_id").in("id",a);if(!i){E=[];return}const{data:o}=await l.from("group_chat_messages").select("chat_id, message_text, sender_id, created_at").in("chat_id",a).order("created_at",{ascending:!1}).limit(a.length*1),r={};for(const d of o||[])r[d.chat_id]||(r[d.chat_id]=d);E=i.map(d=>{const p=s[d.id],f=r[d.id],u=f&&(!p||new Date(f.created_at)>new Date(p));return{chat:d,lastMessage:f||null,unreadCount:u?1:0}}).sort((d,p)=>{const f=d.lastMessage?new Date(d.lastMessage.created_at):new Date(0);return(p.lastMessage?new Date(p.lastMessage.created_at):new Date(0))-f})}function Z(e,t){const n=e.chat,a=e.lastMessage?e.lastMessage.message_text.slice(0,50):"No messages yet",s=n.name.slice(0,2).toUpperCase();n.chat_type==="global"||n.chat_type==="ipo"||n.chat_type;const i=e.unreadCount>0?`<div class="msg-chat-item__badge">${e.unreadCount}</div>`:"";return`<div class="msg-chat-item" data-msg-action="open-group" data-chat-id="${n.id}">
        <div class="msg-chat-item__avatar">${c(s)}</div>
        <div class="msg-chat-item__info">
            <div class="msg-chat-item__name">${c(n.name)}</div>
            <div class="msg-chat-item__preview">${c(a)}</div>
        </div>
        ${i}
    </div>`}function ze(e){const t=e.otherFaction,n=(t.abbreviation||t.faction_name||"?").slice(0,3).toUpperCase(),a=t.party_color||"#666",s=e.lastMessage?e.lastMessage.message_text.slice(0,50):"",i=e.unreadCount>0?`<div class="msg-chat-item__badge">${e.unreadCount}</div>`:"";return`<div class="msg-chat-item" data-msg-action="open-dm" data-faction-id="${t.id}">
        <div class="msg-chat-item__avatar" style="color:${c(a)};border-color:${c(a)};">${c(n)}</div>
        <div class="msg-chat-item__info">
            <div class="msg-chat-item__name">${c(t.faction_name)}</div>
            <div class="msg-chat-item__preview">${c(s)}</div>
        </div>
        ${i}
    </div>`}let Y=!1,F={};async function j(e){b=e,q="thread";const t=document.getElementById("msg-body"),n=document.getElementById("msg-actions");n&&(n.style.display="none");const a=document.querySelector(".msg-panel__title");a&&(a.textContent=e.name||"Chat");const s=e.type==="group"&&e.chatType==="nation"&&w?`<img src="${c(w.flag_url||`assets/flags/${w.name}.png`)}" alt="" style="height:14px;vertical-align:middle;margin-left:6px;" onerror="this.style.display='none'">`:"";t.innerHTML=`
        <div class="msg-thread-header">
            <button class="msg-thread-back" id="msg-back">&#8592;</button>
            <span class="msg-thread-name">${c(e.name||"Chat")}${s}</span>
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
    `,document.getElementById("msg-back").addEventListener("click",()=>{a&&(a.textContent="Messages"),b=null,z=null,L=[],K=!1,R(),T(),B()});const i=document.getElementById("msg-search-btn");if(i&&i.addEventListener("click",()=>{K?ke():Ue()}),setTimeout(()=>{const d=document.getElementById("msg-messages");d&&d.addEventListener("scroll",()=>{d.scrollTop<40&&z&&!ee&&we()})},0),e.type==="group"){const d=document.getElementById("msg-members-toggle"),p=document.getElementById("msg-members-bar");d&&p&&d.addEventListener("click",async()=>{if(p.style.display!=="none"){p.style.display="none";return}p.innerHTML='<span style="color:var(--text-dim);font-size:10px;padding:4px 8px;">Loading...</span>',p.style.display="flex";try{const{data:f}=await l.from("group_chat_members").select("faction_id").eq("chat_id",e.id),u=(f||[]).map(h=>h.faction_id);await W(u),p.innerHTML=u.map(h=>{const v=F[h];if(!v)return"";const k=(v.abbreviation||v.faction_name||"?").slice(0,4),g=v.party_color||"#666",y=h===m.id;return'<span class="msg-member-chip" style="border-color:'+c(g)+";color:"+c(g)+(y?";opacity:1":"")+'" title="'+c(v.faction_name||"")+'">'+c(k)+"</span>"}).filter(Boolean).join("")||'<span style="color:var(--text-dim);font-size:10px;">No members</span>'}catch{p.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Failed to load</span>'}})}const o=document.getElementById("msg-input"),r=document.getElementById("msg-send");o.addEventListener("input",()=>{r.disabled=!o.value.trim()||Y}),o.addEventListener("keydown",d=>{d.key==="Enter"&&!d.shiftKey&&o.value.trim()&&!Y&&(d.preventDefault(),be())}),r.addEventListener("click",()=>{o.value.trim()&&!Y&&be()}),await ne(),o.focus()}async function ne(){const e=document.getElementById("msg-messages");if(!e||!b)return;const t=b;let n=[],a=0;z=null,L=[];try{if(t.type==="dm"){const{data:i,error:o}=await l.from("direct_messages").select(oe).or(`and(sender_id.eq.${m.id},receiver_id.eq.${t.id}),and(sender_id.eq.${t.id},receiver_id.eq.${m.id})`).order("created_at",{ascending:!1}).limit(A);if(o)throw o;const r=(i||[]).slice().reverse();a=r.length,n=r.map(p=>ce(p)),r.length>0&&(z=r[0].created_at);const d=r.filter(p=>p.receiver_id===m.id&&!p.read_at&&!p.deleted_at).map(p=>p.id);d.length>0&&l.from("direct_messages").update({read_at:new Date().toISOString()}).in("id",d).then(()=>{})}else if(t.type==="group"){const{data:i,error:o}=await l.from("group_chat_messages").select(re).eq("chat_id",t.id).order("created_at",{ascending:!1}).limit(A);if(o)throw o;const r=(i||[]).slice().reverse();a=r.length;const d=[...new Set(r.map(p=>p.sender_id).filter(Boolean))];await W(d),n=r.map(p=>le(p)),r.length>0&&(z=r[0].created_at),await Re(t.id),l.from("group_chat_members").update({last_read_at:new Date().toISOString()}).eq("chat_id",t.id).eq("faction_id",m.id).then(()=>{})}}catch(i){console.warn("[Messaging] Failed to load messages:",i),e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">Failed to load messages.</div></div>';return}n=te(n);const s=a>=A?'<button class="msg-load-earlier" id="msg-load-earlier">Load earlier messages</button>':"";n.length===0&&L.length===0&&!s?e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No messages yet.<br>Send the first message!</div></div>':e.innerHTML=s+n.map(i=>U(i)).join(""),Ge(),e.scrollTop=e.scrollHeight}function ce(e){return{id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:e.sender_id===m.id,isSystem:!1,editedAt:e.edited_at,deletedAt:e.deleted_at}}function le(e){return{id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:e.sender_id===m.id,isSystem:e.is_system,editedAt:e.edited_at,deletedAt:e.deleted_at,pinnedAt:e.pinned_at}}async function we(){if(ee||!z||!b)return;ee=!0;const e=document.getElementById("msg-load-earlier");e&&(e.disabled=!0,e.textContent="Loading...");const t=b,n=document.getElementById("msg-messages"),a=n?n.scrollHeight:0;try{let s=[];if(t.type==="dm"){const{data:i,error:o}=await l.from("direct_messages").select(oe).or(`and(sender_id.eq.${m.id},receiver_id.eq.${t.id}),and(sender_id.eq.${t.id},receiver_id.eq.${m.id})`).lt("created_at",z).order("created_at",{ascending:!1}).limit(A);if(o)throw o;s=(i||[]).slice().reverse();const r=te(s.map(ce));ue(r,s,n,a)}else if(t.type==="group"){const{data:i,error:o}=await l.from("group_chat_messages").select(re).eq("chat_id",t.id).lt("created_at",z).order("created_at",{ascending:!1}).limit(A);if(o)throw o;s=(i||[]).slice().reverse();const r=[...new Set(s.map(p=>p.sender_id).filter(Boolean))];await W(r);const d=te(s.map(le));ue(d,s,n,a)}}catch(s){console.warn("[Messaging] Failed to load older messages:",s),e&&(e.disabled=!1,e.textContent="Load earlier messages")}finally{ee=!1}}function ue(e,t,n,a){const s=document.getElementById("msg-load-earlier");if(!n)return;if(t.length===0){s&&s.remove();return}z=t[0].created_at;const i=e.map(o=>U(o)).join("");s?(s.insertAdjacentHTML("afterend",i),t.length<A?s.remove():(s.disabled=!1,s.textContent="Load earlier messages")):n.insertAdjacentHTML("afterbegin",i),n.scrollTop=n.scrollHeight-a}function te(e){return!$||$.size===0?e:e.filter(t=>t.isMine||!t.senderId||!$.has(t.senderId))}function U(e){if(e.isSystem)return`<div class="msg-msg msg-msg--system">${c(e.text)}</div>`;if(e.deletedAt)return`<div class="msg-msg msg-msg--${e.isMine?"sent":"received"} msg-msg--deleted" data-msg-id="${c(e.id)}">
            <div>[message deleted]</div>
            <div class="msg-msg__time">${se(e.createdAt)}</div>
        </div>`;const t=e.isMine?"msg-msg msg-msg--sent":"msg-msg msg-msg--received",n=se(e.createdAt),a=e.editedAt?`<span class="msg-msg__edited" title="Edited ${se(e.editedAt)}">(edited)</span>`:"",s=e.pinnedAt?'<span class="msg-msg__pinned" title="Pinned">📌</span>':"";let i="";if(!e.isMine&&b?.type==="group"&&e.senderId){const r=F[e.senderId],d=r?.party_color||"#888",p=r?.faction_name||r?.abbreviation||"...",f=(r?.abbreviation||r?.faction_name||"?").slice(0,3).toUpperCase(),u=b?.chatType;let h="";if(u==="global"&&r?.nation_name){const g=ve[r.nation_name];g?h=`<img class="msg-msg__flag" src="${c(g)}" alt="${c(r.nation_name)}" title="${c(r.nation_name)}" />`:h=`<span class="msg-msg__nation">[${c(r.nation_name)}]</span>`}else u==="nation"&&r?.faction_type==="corporation"&&r?.corp_sector&&(h=`<span class="msg-msg__sector" title="Sector">${c(r.corp_sector)}</span>`);const k=!!r?`data-msg-action="open-profile" data-faction-id="${c(e.senderId)}" role="button" tabindex="0" title="View profile"`:'style="cursor:default;"';i=`<div class="msg-msg__header">
            <div class="msg-msg__avatar" style="color:${c(d)};border-color:${c(d)};">${c(f)}</div>
            <div class="msg-msg__nameplate" ${k}>
                <span class="msg-msg__name" style="color:${c(d)};">${c(p)}</span>
                ${h}
            </div>
        </div>`}const o=`<button class="msg-msg__menu-btn" data-msg-action="msg-menu" data-msg-id="${c(e.id)}" aria-label="Message actions" title="Actions">⋯</button>`;return`<div class="${t}" data-msg-id="${c(e.id)}">
        ${i}
        ${o}
        <div class="msg-msg__body">${s}<span class="msg-msg__text">${c(e.text)}</span>${a}</div>
        <div class="msg-msg__time">${n}</div>
    </div>`}let M=null;function T(){M&&M.parentNode&&M.parentNode.removeChild(M),M=null}function he(e,t){T();const n=F[t];if(!n||!t)return;const a=document.getElementById("msg-panel");if(!a)return;const s=n.party_color||"#888",i=n.faction_type,o=i==="corporation"?"Corporation":i==="party"?"Political Party":i?i.charAt(0).toUpperCase()+i.slice(1).replace(/_/g," "):"Faction",r=n.nation_name||"",d=r?ve[r]:"",p=Ee(r),f=document.createElement("div");f.className="msg-identity-popover",f.setAttribute("role","dialog");const u=m&&t===m.id,h=$.has(t),v=u?"":`<button class="msg-identity-popover__btn" data-msg-action="${h?"unblock":"block"}" data-faction-id="${c(t)}">${h?"Unblock":"Block"} user</button>`;f.innerHTML=`
        <div class="msg-identity-popover__name" style="color:${c(s)};">${c(n.faction_name||n.abbreviation||"?")}</div>
        <div class="msg-identity-popover__row">
            ${d?`<img src="${c(d)}" alt="${c(r)}" />`:""}
            <span>${r?c(r):"No nation"}</span>
        </div>
        <div class="msg-identity-popover__row">
            <span>${c(o)}${i==="corporation"&&n.corp_sector?" — "+c(n.corp_sector):""}</span>
        </div>
        ${p?`<a class="msg-identity-popover__link" href="nation-info.html?name=${encodeURIComponent(p)}" target="_blank" rel="noopener">View Nation &rarr;</a>`:""}
        ${v}
    `,a.appendChild(f);const k=a.getBoundingClientRect(),g=e.getBoundingClientRect(),y=f.offsetWidth,x=f.offsetHeight;let _=g.left-k.left;const X=a.clientWidth-y-8;_>X&&(_=X),_<8&&(_=8);let N=g.bottom-k.top+4;N+x>a.clientHeight-8&&(N=g.top-k.top-x-4),N<8&&(N=8),f.style.top=N+"px",f.style.left=_+"px",f.dataset.factionId=t,M=f}function S(e,t){const n=document.getElementById("msg-panel");if(!n)return;const a=n.querySelector(".msg-toast");a&&a.remove();const s=document.createElement("div");s.className="msg-toast"+(t==="success"?" msg-toast--success":""),s.textContent=e,n.appendChild(s),setTimeout(()=>{s.parentNode&&s.parentNode.removeChild(s)},4500)}function O(e){return(e?.message||"").replace(/^[A-Z0-9]+:\s*/,"")}let I=null;function R(){I&&I.parentNode&&I.parentNode.removeChild(I),I=null}function Be(e,t){R();const n=e.closest(".msg-msg");if(!n)return;const a=n.classList.contains("msg-msg--sent"),s=document.createElement("div");s.className="msg-msg__menu";const i=[];a?(i.push(`<button class="msg-msg__menu-item" data-msg-action="edit" data-msg-id="${c(t)}">Edit</button>`),i.push(`<button class="msg-msg__menu-item msg-msg__menu-item--danger" data-msg-action="delete" data-msg-id="${c(t)}">Delete</button>`)):i.push(`<button class="msg-msg__menu-item" data-msg-action="report" data-msg-id="${c(t)}">Report</button>`),s.innerHTML=i.join(""),n.appendChild(s),I=s}async function Ne(e){if(R(),!b)return;const t=document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(e)}"]`);if(!t)return;const n=t.querySelector(".msg-msg__body"),a=t.querySelector(".msg-msg__text");if(!n||!a)return;const s=a.textContent,i=document.createElement("div");i.className="msg-msg__edit",i.innerHTML=`
        <textarea maxlength="2000"></textarea>
        <div class="msg-msg__edit-row">
            <button data-msg-action="edit-cancel">Cancel</button>
            <button class="primary" data-msg-action="edit-save" data-msg-id="${c(e)}">Save</button>
        </div>
    `,n.style.display="none",t.appendChild(i);const o=i.querySelector("textarea");o.value=s,o.focus(),o.setSelectionRange(o.value.length,o.value.length),o.addEventListener("keydown",r=>{r.key==="Escape"&&(r.preventDefault(),me(t))})}function me(e){const t=e.querySelector(".msg-msg__edit");t&&t.remove();const n=e.querySelector(".msg-msg__body");n&&(n.style.display="")}async function He(e){const t=document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(e)}"]`);if(!t)return;const n=t.querySelector(".msg-msg__edit textarea");if(!n)return;const a=n.value.trim();if(!a){S("Message cannot be empty");return}if(!b)return;const s=t.querySelector('[data-msg-action="edit-save"]');s&&(s.disabled=!0);const i=b.type==="dm"?"direct_messages":"group_chat_messages";try{const{error:o}=await l.from(i).update({message_text:a}).eq("id",e);if(o)throw o;me(t);const r=t.querySelector(".msg-msg__text");r&&(r.textContent=a);const d=t.querySelector(".msg-msg__body");if(d&&!d.querySelector(".msg-msg__edited")){const p=document.createElement("span");p.className="msg-msg__edited",p.textContent="(edited)",d.appendChild(p)}S("Message updated","success")}catch(o){console.warn("[Messaging] Edit failed:",o),S("Edit failed: "+O(o)),s&&(s.disabled=!1)}}async function Ae(e){if(R(),!b||!confirm("Delete this message? This cannot be undone."))return;const t=b.type==="dm"?"direct_messages":"group_chat_messages";try{const n=b.type==="dm"?{deleted_at:new Date().toISOString()}:{deleted_at:new Date().toISOString(),deleted_by:m.id},{error:a}=await l.from(t).update(n).eq("id",e);if(a)throw a;const s=document.querySelector(`.msg-msg[data-msg-id="${CSS.escape(e)}"]`);if(s){s.classList.add("msg-msg--deleted");const i=s.querySelector(".msg-msg__body");i&&(i.innerHTML="[message deleted]");const o=s.querySelector(".msg-msg__menu-btn");o&&o.remove();const r=s.querySelector(".msg-msg__header");r&&r.remove()}}catch(n){console.warn("[Messaging] Delete failed:",n),S("Delete failed: "+O(n))}}async function De(e){if(R(),!b||!m)return;const t=prompt("Why are you reporting this message? (max 500 chars)");if(t==null)return;const n=String(t).trim().slice(0,500);if(!n){S("Report reason required");return}try{const a={message_kind:b.type==="dm"?"dm":"group",message_id:e,chat_id:b.type==="group"?b.id:null,reporter_faction_id:m.id,reason:n},{error:s}=await l.from("message_reports").insert(a);if(s)throw s;S("Report submitted. Admins will review.","success")}catch(a){console.warn("[Messaging] Report failed:",a),S("Report failed: "+O(a))}}async function Pe(){if(!m){$=new Set;return}try{const{data:e,error:t}=await l.from("user_blocks").select("blocked_faction_id").eq("blocker_faction_id",m.id);if(t)throw t;$=new Set((e||[]).map(n=>n.blocked_faction_id))}catch(e){console.warn("[Messaging] Failed to load block list:",e),$=new Set}}async function je(e){if(T(),!(!m||e===m.id))try{const{error:t}=await l.from("user_blocks").insert({blocker_faction_id:m.id,blocked_faction_id:e});if(t&&t.code!=="23505")throw t;$.add(e),S("User blocked. Their messages are now hidden.","success"),q==="thread"&&ne()}catch(t){console.warn("[Messaging] Block failed:",t),S("Block failed: "+O(t))}}async function Fe(e){if(T(),!!m)try{const{error:t}=await l.from("user_blocks").delete().eq("blocker_faction_id",m.id).eq("blocked_faction_id",e);if(t)throw t;$.delete(e),S("User unblocked.","success"),q==="thread"&&ne()}catch(t){console.warn("[Messaging] Unblock failed:",t),S("Unblock failed: "+O(t))}}async function Re(e){try{const{data:t,error:n}=await l.from("group_chat_messages").select("id, sender_id, message_text, created_at, pinned_at, deleted_at").eq("chat_id",e).not("pinned_at","is",null).is("deleted_at",null).order("pinned_at",{ascending:!1}).limit(3);if(n)throw n;L=t||[];const a=[...new Set(L.map(s=>s.sender_id).filter(Boolean))];a.length>0&&await W(a)}catch(t){console.warn("[Messaging] Failed to load pinned messages:",t),L=[]}}function Ge(){const e=document.getElementById("msg-pinned-strip");if(e&&e.remove(),!L||L.length===0)return;const t=document.getElementById("msg-messages");if(!t||!t.parentNode)return;const n=document.createElement("div");n.id="msg-pinned-strip",n.className="msg-pinned-strip";const a=L.map(s=>{const i=F[s.sender_id],o=i?.abbreviation||i?.faction_name||"?",r=(s.message_text||"").slice(0,120);return`<div class="msg-pinned-strip__item">📌 <strong>${c(o)}</strong>: ${c(r)}</div>`}).join("");n.innerHTML=`<div class="msg-pinned-strip__hdr">Pinned · ${L.length}/3</div>${a}`,t.parentNode.insertBefore(n,t)}async function Ue(){if(!document.getElementById("msg-body")||!b||K)return;K=!0;const t=document.createElement("div");t.className="msg-search-bar",t.id="msg-search-bar",t.innerHTML=`
        <input type="text" id="msg-search-input" placeholder="Search messages..." maxlength="120" />
        <button id="msg-search-close">Close</button>
    `;const n=document.getElementById("msg-messages");n&&n.parentNode&&n.parentNode.insertBefore(t,n);const a=document.getElementById("msg-search-input"),s=document.getElementById("msg-search-close");let i=null;a.addEventListener("input",()=>{clearTimeout(i);const o=a.value.trim();i=setTimeout(()=>Oe(o),200)}),s.addEventListener("click",ke),a.focus()}function ke(){K=!1;const e=document.getElementById("msg-search-bar");e&&e.remove(),ne()}async function Oe(e){const t=document.getElementById("msg-messages");if(!(!t||!b)){if(!e){t.innerHTML='<div class="msg-empty"><div class="msg-empty__text">Type to search this channel.<br>Close to return to the thread.</div></div>';return}try{let n=[];if(b.type==="group"){const{data:s,error:i}=await l.from("group_chat_messages").select(re).eq("chat_id",b.id).is("deleted_at",null).ilike("message_text",`%${e}%`).order("created_at",{ascending:!1}).limit(A);if(i)throw i;n=(s||[]).reverse();const o=[...new Set(n.map(r=>r.sender_id).filter(Boolean))];o.length>0&&await W(o)}else{const{data:s,error:i}=await l.from("direct_messages").select(oe).or(`and(sender_id.eq.${m.id},receiver_id.eq.${b.id}),and(sender_id.eq.${b.id},receiver_id.eq.${m.id})`).is("deleted_at",null).ilike("message_text",`%${e}%`).order("created_at",{ascending:!1}).limit(A);if(i)throw i;n=(s||[]).reverse()}const a=te(n.map(b.type==="dm"?ce:le));a.length===0?t.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No matches.</div></div>':t.innerHTML=a.map(s=>U(s)).join("")}catch(n){console.warn("[Messaging] Search failed:",n),t.innerHTML='<div class="msg-empty"><div class="msg-empty__text">Search failed.</div></div>'}}}async function W(e){const t=e.filter(i=>!F[i]);if(t.length===0)return;let n=null;try{const{data:i,error:o}=await l.from("factions").select("id, faction_name, abbreviation, party_color, faction_type, corp_sector, nation_id").in("id",t);if(o)throw o;n=i}catch(i){console.warn("[Messaging] loadFactionNames: factions query failed:",i);return}const a=[...new Set((n||[]).map(i=>i.nation_id).filter(Boolean))],s={};if(a.length>0)try{const{data:i,error:o}=await l.from("nations").select("id, name").in("id",a);if(o)throw o;for(const r of i||[])s[r.id]=r.name}catch(i){console.warn("[Messaging] loadFactionNames: nations query failed (nameplates will render without flag/tag):",i)}for(const i of n||[])F[i.id]={id:i.id,faction_name:i.faction_name,abbreviation:i.abbreviation,party_color:i.party_color,faction_type:i.faction_type,corp_sector:i.corp_sector,nation_id:i.nation_id,nation_name:i.nation_id&&s[i.nation_id]||null}}function se(e){if(!e)return"";try{const t=new Date(e),a=new Date-t,s=Math.floor(a/6e4);if(s<1)return"now";if(s<60)return s+"m ago";const i=Math.floor(s/60);if(i<24)return i+"h ago";const o=Math.floor(i/24);return o<7?o+"d ago":t.toLocaleDateString()}catch{return""}}async function be(){const e=document.getElementById("msg-input"),t=document.getElementById("msg-send"),n=b;if(!e||!n||!m)return;const a=e.value.trim();if(a){Y=!0,t&&(t.disabled=!0),e.value="";try{const s=_e?.current_tick||null;let i=null;if(n.type==="dm"){const{data:r,error:d}=await l.from("direct_messages").insert({sender_id:m.id,receiver_id:n.id,message_text:a,sent_at_tick:s}).select("id, created_at").single();if(d)throw d;i=r}else if(n.type==="group"){const{data:r,error:d}=await l.from("group_chat_messages").insert({chat_id:n.id,sender_id:m.id,is_system:!1,message_text:a,sent_at_tick:s}).select("id, created_at").single();if(d)throw d;i=r}const o=document.getElementById("msg-messages");if(o&&i){const r=o.querySelector(".msg-empty");r&&r.remove(),o.insertAdjacentHTML("beforeend",U({id:i.id,senderId:m.id,text:a,createdAt:i.created_at,tick:s,isMine:!0,isSystem:!1})),o.scrollTop=o.scrollHeight}}catch(s){console.warn("[Messaging] Send failed:",s),e.value=a,S(O(s)||"Failed to send message.")}finally{Y=!1,t&&(t.disabled=!e.value.trim()),e.focus()}}}let D=[],ae=null;function We(){q="new-dm";const e=document.getElementById("msg-body"),t=document.getElementById("msg-actions");t&&(t.style.display="none");const n=document.querySelector(".msg-panel__title");n&&(n.textContent="New Message"),e.innerHTML=`
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
    `,document.getElementById("msg-back").addEventListener("click",()=>{n&&(n.textContent="Messages"),B()});const a=document.getElementById("msg-search");a.addEventListener("input",()=>{clearTimeout(ae),ae=setTimeout(()=>Ve(a.value.trim()),250)}),a.focus(),(async()=>{try{const{data:s}=await l.from("nations").select("id, name").order("name"),i=document.getElementById("msg-role-nation");i&&s&&(i.innerHTML='<option value="">Select a nation...</option>'+s.map(o=>'<option value="'+o.id+'">'+c(o.name)+"</option>").join(""),i.addEventListener("change",()=>Ye(i.value)))}catch{}})()}async function Ye(e){const t=document.getElementById("msg-role-results");if(t){if(!e){t.innerHTML="";return}t.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Loading roles...</span>';try{const[n,a,s,i]=await Promise.all([l.from("ministries").select("ministry_key, party_id, factions(id, faction_name, abbreviation, party_color)").eq("nation_id",e).in("ministry_key",["foreign","trade","prime_minister"]).eq("is_active",!0),l.from("government_formations").select("ministry_assignments, proposed_by").eq("nation_id",e).eq("status","formed").order("created_at",{ascending:!1}).limit(1).maybeSingle(),l.from("nations").select("ruling_faction_id").eq("id",e).single(),l.from("ambassadors").select("faction_id, target_nation_id, factions(id, faction_name, abbreviation, party_color), nations!ambassadors_target_nation_id_fkey(name)").eq("nation_id",e).eq("is_active",!0).eq("status","active")]),o=[],r=(n.data||[]).find(u=>u.ministry_key==="prime_minister"),d=Me(a.data)||s.data?.ruling_faction_id||r?.party_id;if(d){const u=r?.factions||(n.data||[]).find(h=>h.party_id===d)?.factions;if(u)o.push({role:"Head of Government",faction:u});else{const{data:h}=await l.from("factions").select("id, faction_name, abbreviation, party_color").eq("id",d).single();h&&o.push({role:"Head of Government",faction:h})}}const p=(n.data||[]).find(u=>u.ministry_key==="foreign");p?.factions&&o.push({role:"Foreign Minister",faction:p.factions});const f=(n.data||[]).find(u=>u.ministry_key==="trade");f?.factions&&o.push({role:"Minister of Trade",faction:f.factions});for(const u of i.data||[])if(u.factions){const h=u.nations?.name||"Unknown";o.push({role:"Ambassador to "+h,faction:u.factions})}if(o.length===0){t.innerHTML='<span style="color:var(--text-dim);font-size:10px;">No diplomatic roles found for this nation.</span>';return}t.innerHTML=o.map(u=>{const h=u.faction,v=h.party_color||"#666",k=(h.abbreviation||h.faction_name||"?").slice(0,4),g=h.id===m.id;return'<div class="msg-role-row" data-role-faction-id="'+h.id+'"'+(g?' style="opacity:0.4;cursor:default;" title="This is you"':"")+'><span class="msg-role-badge">'+c(u.role)+'</span><span class="msg-role-party" style="color:'+c(v)+';">'+c(k)+" — "+c(h.faction_name)+"</span></div>"}).join(""),t.querySelectorAll(".msg-role-row").forEach(u=>{const h=u.dataset.roleFactionId;h!==m.id&&u.addEventListener("click",()=>{const v=o.find(k=>k.faction.id===h);v&&j({type:"dm",id:h,name:v.faction.faction_name,faction:v.faction})})})}catch(n){console.warn("[Messaging] Role lookup failed:",n),t.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Failed to load roles.</span>'}}}async function Ve(e){const t=document.getElementById("msg-search-results");if(!t)return;const n=(e||"").replace(/[%_\\]/g,"");if(n)try{const{data:a}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation, faction_type").neq("id",m.id).or(`faction_name.ilike.%${n}%,abbreviation.ilike.%${n}%,nation.ilike.%${n}%`).eq("faction_type","party").not("nation_id","is",null).order("faction_name").limit(20);D=a||[]}catch{D=[]}else try{const{data:a}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation, faction_type").eq("nation_id",w?.id).eq("faction_type","party").neq("id",m.id).order("faction_name").limit(20);D=a||[]}catch{D=[]}if(D.length===0){t.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No parties found.</div></div>';return}t.innerHTML=D.map(a=>{const s=(a.abbreviation||a.faction_name||"?").slice(0,3).toUpperCase(),i=a.party_color||"#666",o=a.nation||"";return`<div class="msg-chat-item" data-msg-action="pick-dm" data-faction-id="${a.id}">
            <div class="msg-chat-item__avatar" style="color:${c(i)};border-color:${c(i)};">${c(s)}</div>
            <div class="msg-chat-item__info">
                <div class="msg-chat-item__name">${c(a.faction_name)}</div>
                <div class="msg-chat-item__preview">${c(o)}</div>
            </div>
        </div>`}).join(""),t.querySelectorAll('[data-msg-action="pick-dm"]').forEach(a=>{a.addEventListener("click",()=>{const s=a.dataset.factionId,i=D.find(o=>o.id===s);i&&j({type:"dm",id:s,name:i.faction_name,faction:i})})})}let C=new Set;function Ke(){q="new-group",C=new Set;const e=document.getElementById("msg-body"),t=document.getElementById("msg-actions");t&&(t.style.display="none");const n=document.querySelector(".msg-panel__title");n&&(n.textContent="New Group Chat"),e.innerHTML=`
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
    `,document.getElementById("msg-back").addEventListener("click",()=>{n&&(n.textContent="Messages"),B()});const a=document.getElementById("msg-group-search");a.addEventListener("input",()=>{clearTimeout(ae),ae=setTimeout(()=>ie(a.value.trim()),250)}),document.getElementById("msg-create-group").addEventListener("click",Qe),ie("")}async function ie(e){const t=document.getElementById("msg-group-results");if(!t)return;const n=(e||"").replace(/[%_\\]/g,"");let a=[];try{if(n){const{data:s}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation").neq("id",m.id).or(`faction_name.ilike.%${n}%,abbreviation.ilike.%${n}%,nation.ilike.%${n}%`).eq("faction_type","party").not("nation_id","is",null).order("faction_name").limit(20);a=s||[]}else{const{data:s}=await l.from("factions").select("id, faction_name, abbreviation, party_color, nation").eq("nation_id",w?.id).eq("faction_type","party").neq("id",m.id).order("faction_name").limit(20);a=s||[]}}catch{a=[]}if(a.length===0){t.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No parties found.</div></div>';return}t.innerHTML=a.map(s=>{const i=(s.abbreviation||s.faction_name||"?").slice(0,3).toUpperCase(),o=s.party_color||"#666",r=C.has(s.id);return`<div class="msg-chat-item" data-msg-action="toggle-group-member" data-faction-id="${s.id}" style="${r?"background:rgba(90,175,165,0.08);":""}">
            <div class="msg-chat-item__avatar" style="color:${c(o)};border-color:${c(o)};">${c(i)}</div>
            <div class="msg-chat-item__info">
                <div class="msg-chat-item__name">${c(s.faction_name)}</div>
                <div class="msg-chat-item__preview">${c(s.nation||"")}</div>
            </div>
            <div style="font-family:var(--font-mono,monospace);font-size:14px;color:${r?"var(--teal,#5aafa5)":"var(--text-dim,#4a4940)"};">${r?"✓":"+"}</div>
        </div>`}).join(""),t.querySelectorAll('[data-msg-action="toggle-group-member"]').forEach(s=>{s.addEventListener("click",()=>{const i=s.dataset.factionId;C.has(i)?C.delete(i):C.add(i),ie(document.getElementById("msg-group-search")?.value?.trim()||""),Xe(),Ze()})})}function Xe(){const e=document.getElementById("msg-group-selected");if(e){if(C.size===0){e.style.display="none",e.innerHTML="";return}e.style.display="flex",e.innerHTML=`<span style="font-family:var(--font-mono,monospace);font-size:8px;color:var(--text-dim);">${C.size} member${C.size>1?"s":""} selected</span>`}}function Ze(){const e=document.getElementById("msg-create-group");e&&(e.disabled=C.size===0)}function Je(e){const t=(e?.message||"").toLowerCase(),n=e?.code||"";return n==="42501"||t.includes("not authenticated")||t.includes("authentication required")?"You must be signed in to create a group chat.":t.includes("no faction linked")?"No faction is linked to your account yet. Reload and try again.":t.includes("select at least one other member")?"Select at least one other faction before creating a group chat.":t.includes("100 characters or fewer")?"Group chat name must be 100 characters or fewer.":t.includes("selected members were not found")?"One or more selected factions could not be found. Refresh the member list and try again.":n==="23505"?"This group already exists with the selected members.":t.includes("row-level security")||n==="PGRST301"?"You do not have permission to create this group chat.":e?.message||"Unknown error"}async function Qe(){const e=document.getElementById("msg-group-name"),t=document.getElementById("msg-create-group"),n=e?.value?.trim()||"Group Chat";if(C.size!==0){t&&(t.disabled=!0);try{const{data:a,error:s}=await l.rpc("create_custom_group_chat",{chat_name:n,member_ids:Array.from(C)});if(s)throw s;const i=Array.isArray(a)?a[0]:a,o=i?.chat_id,r=i?.name||n;if(!o)throw new Error("Group chat creation returned no chat id");const d=document.querySelector(".msg-panel__title");d&&(d.textContent="Messages"),j({type:"group",id:o,name:r,chatType:"custom"})}catch(a){console.error("[Messaging] Create group failed:",a),alert("Failed to create group chat: "+Je(a)),t&&(t.disabled=!1)}}}async function et(){if(!(!m||!m.id))try{w?.id&&await tt(w.id,w.name||"Nation");const{data:e}=await l.from("ipo_members").select("org_id, international_orgs!inner(id, name, is_active)").eq("faction_id",m.id).eq("is_active",!0);for(const t of e||[]){const n=t.international_orgs;!n||!n.is_active||await at(n.id,n.name)}}catch(e){console.warn("[Messaging] Auto-chat sync failed (non-blocking):",e)}}async function tt(e,t){const{data:n}=await l.from("group_chats").select("id").eq("nation_id",e).eq("chat_type","nation").maybeSingle();let a;if(n)a=n.id;else{const{data:i,error:o}=await l.from("group_chats").insert({name:t+" Chat",chat_type:"nation",nation_id:e}).select("id").single();if(o)if(o.code==="23505"){const{data:r}=await l.from("group_chats").select("id").eq("nation_id",e).eq("chat_type","nation").maybeSingle();a=r?.id}else{console.warn("[Messaging] Nation chat create failed:",o.message);return}else a=i.id}if(!a)return;const{error:s}=await l.from("group_chat_members").upsert({chat_id:a,faction_id:m.id},{onConflict:"chat_id,faction_id"});if(!s)try{const{data:i}=await l.from("factions").select("id").eq("nation_id",w.id).eq("faction_type","party").not("nation_id","is",null),{data:o}=await l.from("group_chats").select("created_by").eq("id",a).single();if(o?.created_by===m.id&&i&&i.length>0){const d=i.map(p=>({chat_id:a,faction_id:p.id}));await l.from("group_chat_members").upsert(d,{onConflict:"chat_id,faction_id"})}}catch{}}async function at(e,t){const{data:n}=await l.from("group_chats").select("id").eq("ipo_org_id",e).eq("chat_type","ipo").maybeSingle();let a;if(n)a=n.id;else{const{data:i,error:o}=await l.from("group_chats").insert({name:t,chat_type:"ipo",ipo_org_id:e}).select("id").single();if(o)if(o.code==="23505"){const{data:r}=await l.from("group_chats").select("id").eq("ipo_org_id",e).eq("chat_type","ipo").maybeSingle();a=r?.id}else{console.warn("[Messaging] IPO chat create failed:",o.message);return}else a=i.id}if(!a)return;const{error:s}=await l.from("group_chat_members").upsert({chat_id:a,faction_id:m.id},{onConflict:"chat_id,faction_id"});if(!s)try{const{data:i}=await l.from("group_chats").select("created_by").eq("id",a).single();if(i?.created_by===m.id){const{data:r}=await l.from("ipo_members").select("faction_id").eq("org_id",e).eq("is_active",!0);if(r&&r.length>0){const d=r.map(p=>({chat_id:a,faction_id:p.faction_id}));await l.from("group_chat_members").upsert(d,{onConflict:"chat_id,faction_id"})}}}catch{}}function nt(){m?.id&&(st(),J=l.channel("msg-dm-"+m.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages",filter:`receiver_id=eq.${m.id}`},e=>{it(e.new)}).subscribe(),Q=l.channel("msg-gc-"+m.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"group_chat_messages"},e=>{ot(e.new)}).subscribe())}function st(){J&&(l.removeChannel(J),J=null),Q&&(l.removeChannel(Q),Q=null)}function it(e){if(!(!e||e.sender_id===m.id)&&!$.has(e.sender_id)){if(P&&q==="thread"&&b?.type==="dm"&&b.id===e.sender_id){const t=document.getElementById("msg-messages");if(t){const n=t.querySelector(".msg-empty");n&&n.remove(),t.insertAdjacentHTML("beforeend",U({id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:!1,isSystem:!1})),t.scrollTop=t.scrollHeight}l.from("direct_messages").update({read_at:new Date().toISOString()}).eq("id",e.id).then(()=>{});return}G++,ge(),P&&q==="list"&&B()}}function ot(e){if(!(!e||e.sender_id===m.id||$.has(e.sender_id)||!E.some(n=>n.chat.id===e.chat_id))){if(P&&q==="thread"&&b?.type==="group"&&b.id===e.chat_id){(async()=>{e.sender_id&&!F[e.sender_id]&&await W([e.sender_id]);const a=document.getElementById("msg-messages");if(a){const s=a.querySelector(".msg-empty");s&&s.remove(),a.insertAdjacentHTML("beforeend",U({id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:!1,isSystem:e.is_system||!1})),a.scrollTop=a.scrollHeight}l.from("group_chat_members").update({last_read_at:new Date().toISOString()}).eq("chat_id",e.chat_id).eq("faction_id",m.id).then(()=>{})})();return}G++,ge(),P&&q==="list"&&B()}}async function rt(){if(m?.id){try{const{data:e}=await l.from("direct_messages").select("sender_id").eq("receiver_id",m.id).is("read_at",null).limit(200),t=new Set;for(const a of e||[])t.add(a.sender_id);const n=E.filter(a=>a.unreadCount>0).length;G=t.size+n}catch{}ge()}}function ge(){const e=document.getElementById("msg-badge");e&&(G>0?(e.textContent=G>99?"99+":String(G),e.classList.add("visible")):e.classList.remove("visible"))}function mt(e,t,n){m=e,w=t,_e=n,!(!e||!e.id)&&(Se(),Ce(),Pe(),et().then(()=>{de().then(()=>{rt()})}),nt())}export{mt as initMessaging};
