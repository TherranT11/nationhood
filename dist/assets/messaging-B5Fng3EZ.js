import{_ as d}from"./supabase-client-BXEzLDpS.js";import{e as m}from"./utils-C2W-HleY.js";let l=null,v=null,D=null,M=!1,y="list",b=null,$=null,T=null,E=0;function O(){if(document.getElementById("msg-styles"))return;const e=document.createElement("style");e.id="msg-styles",e.textContent=`
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
    width: 340px; height: 500px; max-height: calc(100vh - 40px);
    background: var(--bg-panel, #1a1a17); border: 1px solid var(--border-main, rgba(0,0,0,0.08));
    box-shadow: 0 12px 48px rgba(0,0,0,0.6);
    display: none; flex-direction: column; overflow: hidden;
    border-radius: 8px;
}
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

/* ── Mobile ── */
@media (max-width: 480px) {
    .msg-panel { width: calc(100vw - 20px); right: 10px; bottom: 10px; height: 60vh; }
    .msg-bubble { bottom: 12px; right: 12px; width: 42px; height: 42px; font-size: 18px; }
}
    `,document.head.appendChild(e)}function U(){if(document.getElementById("msg-bubble"))return;const e=document.createElement("div");e.id="msg-bubble",e.className="msg-bubble",e.innerHTML='💬<div class="msg-bubble__badge" id="msg-badge">0</div>',e.addEventListener("click",F),document.body.appendChild(e);const i=document.createElement("div");i.id="msg-panel",i.className="msg-panel",i.innerHTML=`
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
    `,document.body.appendChild(i),document.getElementById("msg-close").addEventListener("click",F),document.getElementById("msg-new-dm").addEventListener("click",()=>W()),document.getElementById("msg-new-group").addEventListener("click",()=>ee())}function F(){M=!M;const e=document.getElementById("msg-panel"),i=document.getElementById("msg-bubble");!e||!i||(M?(e.classList.add("open"),i.style.display="none",y="list",q()):(e.classList.remove("open"),i.style.display=""))}let k=[],h=[];async function q(){const e=document.getElementById("msg-body"),i=document.getElementById("msg-actions");if(i&&(i.style.display=""),y="list",!l){e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No faction selected.</div></div>';return}e.innerHTML='<div class="msg-empty"><div class="msg-empty__text" style="color:var(--text-dim);">Loading...</div></div>';try{await Promise.all([Q(),G()])}catch(a){console.warn("[Messaging] Failed to load chats:",a)}let n="";const t=h.filter(a=>a.chat.chat_type==="ipo"),s=h.filter(a=>a.chat.chat_type==="nation"),o=h.filter(a=>a.chat.chat_type==="custom");if(s.length>0&&(n+='<div class="msg-section-hdr">Nation Chat</div>',n+=s.map(a=>H(a)).join("")),t.length>0&&(n+='<div class="msg-section-hdr">Organisation Chats</div>',n+=t.map(a=>H(a)).join("")),o.length>0&&(n+='<div class="msg-section-hdr">Group Chats</div>',n+=o.map(a=>H(a)).join("")),k.length>0&&(n+='<div class="msg-section-hdr">Direct Messages</div>',n+=k.map(a=>K(a)).join("")),v)try{const{data:a}=await d.from("factions").select("id, faction_name, abbreviation, party_color").eq("nation_id",v.id).eq("faction_type","party").neq("id",l.id).order("faction_name");if(a&&a.length>0){const r=new Set(k.map(g=>g.otherFaction.id)),c=a.filter(g=>!r.has(g.id));c.length>0&&(n+='<div class="msg-section-hdr">Parties in Your Nation</div>',n+=c.map(g=>{const u=(g.abbreviation||g.faction_name||"?").slice(0,3).toUpperCase(),p=g.party_color||"#666";return`<div class="msg-chat-item" data-msg-action="start-dm" data-faction-id="${g.id}">
                            <div class="msg-chat-item__avatar" style="color:${m(p)};border-color:${m(p)};">${m(u)}</div>
                            <div class="msg-chat-item__info">
                                <div class="msg-chat-item__name">${m(g.faction_name)}</div>
                                <div class="msg-chat-item__preview">Start a conversation</div>
                            </div>
                        </div>`}).join(""))}}catch(a){console.warn("[Messaging] Failed to load nation parties:",a)}n||(n='<div class="msg-empty"><div class="msg-empty__text">No messages yet.<br>Start a conversation using<br>the buttons above.</div></div>'),e.innerHTML=n,e.querySelectorAll('[data-msg-action="open-dm"]').forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.factionId,c=k.find(g=>g.otherFaction.id===r);c&&C({type:"dm",id:r,name:c.otherFaction.faction_name,faction:c.otherFaction})})}),e.querySelectorAll('[data-msg-action="open-group"]').forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.chatId,c=h.find(g=>g.chat.id===r);c&&C({type:"group",id:r,name:c.chat.name})})}),e.querySelectorAll('[data-msg-action="start-dm"]').forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.factionId,c=a.querySelector(".msg-chat-item__name");C({type:"dm",id:r,name:c?.textContent||"Unknown"})})})}async function Q(){const e=l.id,{data:i,error:n}=await d.from("direct_messages").select("id, sender_id, receiver_id, message_text, read_at, created_at, sent_at_tick").or(`sender_id.eq.${e},receiver_id.eq.${e}`).order("created_at",{ascending:!1}).limit(200);if(n||!i){k=[];return}const t={};for(const r of i){const c=r.sender_id===e?r.receiver_id:r.sender_id;t[c]||(t[c]={lastMessage:r,unreadCount:0}),r.receiver_id===e&&!r.read_at&&t[c].unreadCount++}const s=Object.keys(t);if(s.length===0){k=[];return}const{data:o}=await d.from("factions").select("id, faction_name, abbreviation, party_color, faction_type").in("id",s),a={};for(const r of o||[])a[r.id]=r;k=s.filter(r=>a[r]).map(r=>({otherFaction:a[r],lastMessage:t[r].lastMessage,unreadCount:t[r].unreadCount})).sort((r,c)=>new Date(c.lastMessage.created_at)-new Date(r.lastMessage.created_at))}async function G(){const e=l.id,{data:i,error:n}=await d.from("group_chat_members").select("chat_id, last_read_at").eq("faction_id",e);if(n||!i||i.length===0){h=[];return}const t=i.map(c=>c.chat_id),s={};for(const c of i)s[c.chat_id]=c.last_read_at;const{data:o}=await d.from("group_chats").select("id, name, chat_type, ipo_org_id, nation_id").in("id",t);if(!o){h=[];return}const{data:a}=await d.from("group_chat_messages").select("chat_id, message_text, sender_id, created_at").in("chat_id",t).order("created_at",{ascending:!1}).limit(t.length*1),r={};for(const c of a||[])r[c.chat_id]||(r[c.chat_id]=c);h=o.map(c=>{const g=s[c.id],u=r[c.id],p=u&&(!g||new Date(u.created_at)>new Date(g));return{chat:c,lastMessage:u||null,unreadCount:p?1:0}}).sort((c,g)=>{const u=c.lastMessage?new Date(c.lastMessage.created_at):new Date(0);return(g.lastMessage?new Date(g.lastMessage.created_at):new Date(0))-u})}function H(e,i){const n=e.chat,t=e.lastMessage?e.lastMessage.message_text.slice(0,50):"No messages yet",s=n.name.slice(0,2).toUpperCase();n.chat_type==="ipo"||n.chat_type;const o=e.unreadCount>0?`<div class="msg-chat-item__badge">${e.unreadCount}</div>`:"";return`<div class="msg-chat-item" data-msg-action="open-group" data-chat-id="${n.id}">
        <div class="msg-chat-item__avatar">${m(s)}</div>
        <div class="msg-chat-item__info">
            <div class="msg-chat-item__name">${m(n.name)}</div>
            <div class="msg-chat-item__preview">${m(t)}</div>
        </div>
        ${o}
    </div>`}function K(e){const i=e.otherFaction,n=(i.abbreviation||i.faction_name||"?").slice(0,3).toUpperCase(),t=i.party_color||"#666",s=e.lastMessage?e.lastMessage.message_text.slice(0,50):"",o=e.unreadCount>0?`<div class="msg-chat-item__badge">${e.unreadCount}</div>`:"";return`<div class="msg-chat-item" data-msg-action="open-dm" data-faction-id="${i.id}">
        <div class="msg-chat-item__avatar" style="color:${m(t)};border-color:${m(t)};">${m(n)}</div>
        <div class="msg-chat-item__info">
            <div class="msg-chat-item__name">${m(i.faction_name)}</div>
            <div class="msg-chat-item__preview">${m(s)}</div>
        </div>
        ${o}
    </div>`}let L=!1,S={};async function C(e){b=e,y="thread";const i=document.getElementById("msg-body"),n=document.getElementById("msg-actions");n&&(n.style.display="none");const t=document.querySelector(".msg-panel__title");if(t&&(t.textContent=e.name||"Chat"),i.innerHTML=`
        <div class="msg-thread-header">
            <button class="msg-thread-back" id="msg-back">&#8592;</button>
            <span class="msg-thread-name">${m(e.name||"Chat")}</span>
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
    `,document.getElementById("msg-back").addEventListener("click",()=>{t&&(t.textContent="Messages"),b=null,q()}),e.type==="group"){const a=document.getElementById("msg-members-toggle"),r=document.getElementById("msg-members-bar");a&&r&&a.addEventListener("click",async()=>{if(r.style.display!=="none"){r.style.display="none";return}r.innerHTML='<span style="color:var(--text-dim);font-size:10px;padding:4px 8px;">Loading...</span>',r.style.display="flex";try{const{data:c}=await d.from("group_chat_members").select("faction_id").eq("chat_id",e.id),g=(c||[]).map(u=>u.faction_id);await j(g),r.innerHTML=g.map(u=>{const p=S[u];if(!p)return"";const f=(p.abbreviation||p.faction_name||"?").slice(0,4),x=p.party_color||"#666",I=u===l.id;return'<span class="msg-member-chip" style="border-color:'+m(x)+";color:"+m(x)+(I?";opacity:1":"")+'" title="'+m(p.faction_name||"")+'">'+m(f)+"</span>"}).filter(Boolean).join("")||'<span style="color:var(--text-dim);font-size:10px;">No members</span>'}catch{r.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Failed to load</span>'}})}const s=document.getElementById("msg-input"),o=document.getElementById("msg-send");s.addEventListener("input",()=>{o.disabled=!s.value.trim()||L}),s.addEventListener("keydown",a=>{a.key==="Enter"&&!a.shiftKey&&s.value.trim()&&!L&&(a.preventDefault(),R())}),o.addEventListener("click",()=>{s.value.trim()&&!L&&R()}),await V(),s.focus()}async function V(){const e=document.getElementById("msg-messages");if(!e||!b)return;const i=b;let n=[];try{if(i.type==="dm"){const{data:t,error:s}=await d.from("direct_messages").select("id, sender_id, receiver_id, message_text, created_at, sent_at_tick, read_at").or(`and(sender_id.eq.${l.id},receiver_id.eq.${i.id}),and(sender_id.eq.${i.id},receiver_id.eq.${l.id})`).order("created_at",{ascending:!0}).limit(100);if(s)throw s;n=(t||[]).map(a=>({id:a.id,senderId:a.sender_id,text:a.message_text,createdAt:a.created_at,tick:a.sent_at_tick,isMine:a.sender_id===l.id,isSystem:!1}));const o=(t||[]).filter(a=>a.receiver_id===l.id&&!a.read_at).map(a=>a.id);o.length>0&&d.from("direct_messages").update({read_at:new Date().toISOString()}).in("id",o).then(()=>{})}else if(i.type==="group"){const{data:t,error:s}=await d.from("group_chat_messages").select("id, sender_id, is_system, message_text, created_at, sent_at_tick").eq("chat_id",i.id).order("created_at",{ascending:!0}).limit(100);if(s)throw s;const o=[...new Set((t||[]).map(a=>a.sender_id).filter(Boolean))];await j(o),n=(t||[]).map(a=>({id:a.id,senderId:a.sender_id,text:a.message_text,createdAt:a.created_at,tick:a.sent_at_tick,isMine:a.sender_id===l.id,isSystem:a.is_system})),d.from("group_chat_members").update({last_read_at:new Date().toISOString()}).eq("chat_id",i.id).eq("faction_id",l.id).then(()=>{})}}catch(t){console.warn("[Messaging] Failed to load messages:",t),e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">Failed to load messages.</div></div>';return}if(n.length===0){e.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No messages yet.<br>Send the first message!</div></div>';return}e.innerHTML=n.map(t=>z(t)).join(""),e.scrollTop=e.scrollHeight}function z(e){if(e.isSystem)return`<div class="msg-msg msg-msg--system">${m(e.text)}</div>`;const i=e.isMine?"msg-msg msg-msg--sent":"msg-msg msg-msg--received",n=e.isMine?"":Y(e.senderId),t=J(e.createdAt);let s="";if(!e.isMine&&b?.type==="group"&&n){const o=S[e.senderId]?.party_color||"#888";s=`<div class="msg-msg__sender" style="color:${m(o)}">${m(n)}</div>`}return`<div class="${i}">
        ${s}
        <div>${m(e.text)}</div>
        <div class="msg-msg__time">${t}</div>
    </div>`}function Y(e){if(!e)return"System";const i=S[e];return i?i.abbreviation||i.faction_name||"?":"..."}async function j(e){const i=e.filter(n=>!S[n]);if(i.length!==0)try{const{data:n,error:t}=await d.from("factions").select("id, faction_name, abbreviation, party_color").in("id",i);if(t)throw t;for(const s of n||[])S[s.id]=s}catch{}}function J(e){if(!e)return"";try{const i=new Date(e),t=new Date-i,s=Math.floor(t/6e4);if(s<1)return"now";if(s<60)return s+"m ago";const o=Math.floor(s/60);if(o<24)return o+"h ago";const a=Math.floor(o/24);return a<7?a+"d ago":i.toLocaleDateString()}catch{return""}}async function R(){const e=document.getElementById("msg-input"),i=document.getElementById("msg-send"),n=b;if(!e||!n||!l)return;const t=e.value.trim();if(t){L=!0,i&&(i.disabled=!0),e.value="";try{const s=D?.current_tick||null;if(n.type==="dm"){const{error:a}=await d.from("direct_messages").insert({sender_id:l.id,receiver_id:n.id,message_text:t,sent_at_tick:s});if(a)throw a}else if(n.type==="group"){const{error:a}=await d.from("group_chat_messages").insert({chat_id:n.id,sender_id:l.id,is_system:!1,message_text:t,sent_at_tick:s});if(a)throw a}const o=document.getElementById("msg-messages");if(o){const a=o.querySelector(".msg-empty");a&&a.remove();const r=z({id:"temp-"+Date.now(),senderId:l.id,text:t,createdAt:new Date().toISOString(),tick:s,isMine:!0,isSystem:!1});o.insertAdjacentHTML("beforeend",r),o.scrollTop=o.scrollHeight}}catch(s){console.error("[Messaging] Send failed:",s),e.value=t,alert("Failed to send message: "+(s.message||"Unknown error"))}finally{L=!1,i&&(i.disabled=!e.value.trim()),e.focus()}}}let w=[],B=null;function W(){y="new-dm";const e=document.getElementById("msg-body"),i=document.getElementById("msg-actions");i&&(i.style.display="none");const n=document.querySelector(".msg-panel__title");n&&(n.textContent="New Message"),e.innerHTML=`
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
    `,document.getElementById("msg-back").addEventListener("click",()=>{n&&(n.textContent="Messages"),q()});const t=document.getElementById("msg-search");t.addEventListener("input",()=>{clearTimeout(B),B=setTimeout(()=>Z(t.value.trim()),250)}),t.focus(),(async()=>{try{const{data:s}=await d.from("nations").select("id, name").order("name"),o=document.getElementById("msg-role-nation");o&&s&&(o.innerHTML='<option value="">Select a nation...</option>'+s.map(a=>'<option value="'+a.id+'">'+m(a.name)+"</option>").join(""),o.addEventListener("change",()=>X(o.value)))}catch{}})()}async function X(e){const i=document.getElementById("msg-role-results");if(i){if(!e){i.innerHTML="";return}i.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Loading roles...</span>';try{const[n,t,s,o]=await Promise.all([d.from("ministries").select("ministry_key, party_id, factions(id, faction_name, abbreviation, party_color)").eq("nation_id",e).in("ministry_key",["foreign","trade","prime_minister"]).eq("is_active",!0),d.from("government_formations").select("lead_party_id, ministry_assignments").eq("nation_id",e).eq("status","formed").order("created_at",{ascending:!1}).limit(1).maybeSingle(),d.from("nations").select("ruling_faction_id").eq("id",e).single(),d.from("ambassadors").select("faction_id, target_nation_id, factions(id, faction_name, abbreviation, party_color), nations!ambassadors_target_nation_id_fkey(name)").eq("nation_id",e).eq("is_active",!0).eq("status","active")]),a=[],r=(n.data||[]).find(p=>p.ministry_key==="prime_minister"),c=t.data?.lead_party_id||s.data?.ruling_faction_id||r?.party_id;if(c){const p=r?.factions||(n.data||[]).find(f=>f.party_id===c)?.factions;if(p)a.push({role:"Head of Government",faction:p});else{const{data:f}=await d.from("factions").select("id, faction_name, abbreviation, party_color").eq("id",c).single();f&&a.push({role:"Head of Government",faction:f})}}const g=(n.data||[]).find(p=>p.ministry_key==="foreign");g?.factions&&a.push({role:"Foreign Minister",faction:g.factions});const u=(n.data||[]).find(p=>p.ministry_key==="trade");u?.factions&&a.push({role:"Minister of Trade",faction:u.factions});for(const p of o.data||[])if(p.factions){const f=p.nations?.name||"Unknown";a.push({role:"Ambassador to "+f,faction:p.factions})}if(a.length===0){i.innerHTML='<span style="color:var(--text-dim);font-size:10px;">No diplomatic roles found for this nation.</span>';return}i.innerHTML=a.map(p=>{const f=p.faction,x=f.party_color||"#666",I=(f.abbreviation||f.faction_name||"?").slice(0,4),P=f.id===l.id;return'<div class="msg-role-row" data-role-faction-id="'+f.id+'"'+(P?' style="opacity:0.4;cursor:default;" title="This is you"':"")+'><span class="msg-role-badge">'+m(p.role)+'</span><span class="msg-role-party" style="color:'+m(x)+';">'+m(I)+" — "+m(f.faction_name)+"</span></div>"}).join(""),i.querySelectorAll(".msg-role-row").forEach(p=>{const f=p.dataset.roleFactionId;f!==l.id&&p.addEventListener("click",()=>{const x=a.find(I=>I.faction.id===f);x&&C({type:"dm",id:f,name:x.faction.faction_name,faction:x.faction})})})}catch(n){console.warn("[Messaging] Role lookup failed:",n),i.innerHTML='<span style="color:var(--text-dim);font-size:10px;">Failed to load roles.</span>'}}}async function Z(e){const i=document.getElementById("msg-search-results");if(!i)return;const n=(e||"").replace(/[%_\\]/g,"");if(n)try{const{data:t}=await d.from("factions").select("id, faction_name, abbreviation, party_color, nation, faction_type").neq("id",l.id).or(`faction_name.ilike.%${n}%,abbreviation.ilike.%${n}%,nation.ilike.%${n}%`).eq("faction_type","party").not("nation_id","is",null).order("faction_name").limit(20);w=t||[]}catch{w=[]}else try{const{data:t}=await d.from("factions").select("id, faction_name, abbreviation, party_color, nation, faction_type").eq("nation_id",v?.id).eq("faction_type","party").neq("id",l.id).order("faction_name").limit(20);w=t||[]}catch{w=[]}if(w.length===0){i.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No parties found.</div></div>';return}i.innerHTML=w.map(t=>{const s=(t.abbreviation||t.faction_name||"?").slice(0,3).toUpperCase(),o=t.party_color||"#666",a=t.nation||"";return`<div class="msg-chat-item" data-msg-action="pick-dm" data-faction-id="${t.id}">
            <div class="msg-chat-item__avatar" style="color:${m(o)};border-color:${m(o)};">${m(s)}</div>
            <div class="msg-chat-item__info">
                <div class="msg-chat-item__name">${m(t.faction_name)}</div>
                <div class="msg-chat-item__preview">${m(a)}</div>
            </div>
        </div>`}).join(""),i.querySelectorAll('[data-msg-action="pick-dm"]').forEach(t=>{t.addEventListener("click",()=>{const s=t.dataset.factionId,o=w.find(a=>a.id===s);o&&C({type:"dm",id:s,name:o.faction_name,faction:o})})})}let _=new Set;function ee(){y="new-group",_=new Set;const e=document.getElementById("msg-body"),i=document.getElementById("msg-actions");i&&(i.style.display="none");const n=document.querySelector(".msg-panel__title");n&&(n.textContent="New Group Chat"),e.innerHTML=`
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
    `,document.getElementById("msg-back").addEventListener("click",()=>{n&&(n.textContent="Messages"),q()});const t=document.getElementById("msg-group-search");t.addEventListener("input",()=>{clearTimeout(B),B=setTimeout(()=>N(t.value.trim()),250)}),document.getElementById("msg-create-group").addEventListener("click",ie),N("")}async function N(e){const i=document.getElementById("msg-group-results");if(!i)return;const n=(e||"").replace(/[%_\\]/g,"");let t=[];try{if(n){const{data:s}=await d.from("factions").select("id, faction_name, abbreviation, party_color, nation").neq("id",l.id).or(`faction_name.ilike.%${n}%,abbreviation.ilike.%${n}%,nation.ilike.%${n}%`).eq("faction_type","party").not("nation_id","is",null).order("faction_name").limit(20);t=s||[]}else{const{data:s}=await d.from("factions").select("id, faction_name, abbreviation, party_color, nation").eq("nation_id",v?.id).eq("faction_type","party").neq("id",l.id).order("faction_name").limit(20);t=s||[]}}catch{t=[]}if(t.length===0){i.innerHTML='<div class="msg-empty"><div class="msg-empty__text">No parties found.</div></div>';return}i.innerHTML=t.map(s=>{const o=(s.abbreviation||s.faction_name||"?").slice(0,3).toUpperCase(),a=s.party_color||"#666",r=_.has(s.id);return`<div class="msg-chat-item" data-msg-action="toggle-group-member" data-faction-id="${s.id}" style="${r?"background:rgba(90,175,165,0.08);":""}">
            <div class="msg-chat-item__avatar" style="color:${m(a)};border-color:${m(a)};">${m(o)}</div>
            <div class="msg-chat-item__info">
                <div class="msg-chat-item__name">${m(s.faction_name)}</div>
                <div class="msg-chat-item__preview">${m(s.nation||"")}</div>
            </div>
            <div style="font-family:var(--font-mono,monospace);font-size:14px;color:${r?"var(--teal,#5aafa5)":"var(--text-dim,#4a4940)"};">${r?"✓":"+"}</div>
        </div>`}).join(""),i.querySelectorAll('[data-msg-action="toggle-group-member"]').forEach(s=>{s.addEventListener("click",()=>{const o=s.dataset.factionId;_.has(o)?_.delete(o):_.add(o),N(document.getElementById("msg-group-search")?.value?.trim()||""),te(),ae()})})}function te(){const e=document.getElementById("msg-group-selected");if(e){if(_.size===0){e.style.display="none",e.innerHTML="";return}e.style.display="flex",e.innerHTML=`<span style="font-family:var(--font-mono,monospace);font-size:8px;color:var(--text-dim);">${_.size} member${_.size>1?"s":""} selected</span>`}}function ae(){const e=document.getElementById("msg-create-group");e&&(e.disabled=_.size===0)}async function ie(){const e=document.getElementById("msg-group-name"),i=document.getElementById("msg-create-group"),n=e?.value?.trim()||"Group Chat";if(_.size!==0){i&&(i.disabled=!0);try{const{data:t,error:s}=await d.from("group_chats").insert({name:n,chat_type:"custom",created_by:l.id}).select().single();if(s)throw s;const a=[l.id,..._].map(g=>({chat_id:t.id,faction_id:g})),{error:r}=await d.from("group_chat_members").insert(a);if(r)throw r;await d.from("group_chat_messages").insert({chat_id:t.id,sender_id:null,is_system:!0,message_text:`${l.faction_name||"Someone"} created this group chat.`,sent_at_tick:D?.current_tick||null});const c=document.querySelector(".msg-panel__title");c&&(c.textContent="Messages"),C({type:"group",id:t.id,name:n})}catch(t){console.error("[Messaging] Create group failed:",t),alert("Failed to create group chat: "+(t.message||"Unknown error")),i&&(i.disabled=!1)}}}async function ne(){if(!(!l||!l.id))try{v?.id&&await se(v.id,v.name||"Nation");const{data:e}=await d.from("ipo_members").select("org_id, international_orgs!inner(id, name, is_active)").eq("faction_id",l.id).eq("is_active",!0);for(const i of e||[]){const n=i.international_orgs;!n||!n.is_active||await oe(n.id,n.name)}}catch(e){console.warn("[Messaging] Auto-chat sync failed (non-blocking):",e)}}async function se(e,i){const{data:n}=await d.from("group_chats").select("id").eq("nation_id",e).eq("chat_type","nation").maybeSingle();let t;if(n)t=n.id;else{const{data:o,error:a}=await d.from("group_chats").insert({name:i+" Chat",chat_type:"nation",nation_id:e}).select("id").single();if(a)if(a.code==="23505"){const{data:r}=await d.from("group_chats").select("id").eq("nation_id",e).eq("chat_type","nation").maybeSingle();t=r?.id}else{console.warn("[Messaging] Nation chat create failed:",a.message);return}else t=o.id}if(!t)return;const{error:s}=await d.from("group_chat_members").upsert({chat_id:t,faction_id:l.id},{onConflict:"chat_id,faction_id"});if(!s)try{const{data:o}=await d.from("factions").select("id").eq("nation_id",v.id).eq("faction_type","party").not("nation_id","is",null),{data:a}=await d.from("group_chats").select("created_by").eq("id",t).single();if(a?.created_by===l.id&&o&&o.length>0){const c=o.map(g=>({chat_id:t,faction_id:g.id}));await d.from("group_chat_members").upsert(c,{onConflict:"chat_id,faction_id"})}}catch{}}async function oe(e,i){const{data:n}=await d.from("group_chats").select("id").eq("ipo_org_id",e).eq("chat_type","ipo").maybeSingle();let t;if(n)t=n.id;else{const{data:o,error:a}=await d.from("group_chats").insert({name:i,chat_type:"ipo",ipo_org_id:e}).select("id").single();if(a)if(a.code==="23505"){const{data:r}=await d.from("group_chats").select("id").eq("ipo_org_id",e).eq("chat_type","ipo").maybeSingle();t=r?.id}else{console.warn("[Messaging] IPO chat create failed:",a.message);return}else t=o.id}if(!t)return;const{error:s}=await d.from("group_chat_members").upsert({chat_id:t,faction_id:l.id},{onConflict:"chat_id,faction_id"});if(!s)try{const{data:o}=await d.from("group_chats").select("created_by").eq("id",t).single();if(o?.created_by===l.id){const{data:r}=await d.from("ipo_members").select("faction_id").eq("org_id",e).eq("is_active",!0);if(r&&r.length>0){const c=r.map(g=>({chat_id:t,faction_id:g.faction_id}));await d.from("group_chat_members").upsert(c,{onConflict:"chat_id,faction_id"})}}}catch{}}function re(){l?.id&&(de(),$=d.channel("msg-dm-"+l.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages",filter:`receiver_id=eq.${l.id}`},e=>{ce(e.new)}).subscribe(),T=d.channel("msg-gc-"+l.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"group_chat_messages"},e=>{le(e.new)}).subscribe())}function de(){$&&(d.removeChannel($),$=null),T&&(d.removeChannel(T),T=null)}function ce(e){if(!(!e||e.sender_id===l.id)){if(M&&y==="thread"&&b?.type==="dm"&&b.id===e.sender_id){const i=document.getElementById("msg-messages");if(i){const n=i.querySelector(".msg-empty");n&&n.remove(),i.insertAdjacentHTML("beforeend",z({id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:!1,isSystem:!1})),i.scrollTop=i.scrollHeight}d.from("direct_messages").update({read_at:new Date().toISOString()}).eq("id",e.id).then(()=>{});return}E++,A(),M&&y==="list"&&q()}}function le(e){if(!(!e||e.sender_id===l.id||!h.some(n=>n.chat.id===e.chat_id))){if(M&&y==="thread"&&b?.type==="group"&&b.id===e.chat_id){(async()=>{e.sender_id&&!S[e.sender_id]&&await j([e.sender_id]);const t=document.getElementById("msg-messages");if(t){const s=t.querySelector(".msg-empty");s&&s.remove(),t.insertAdjacentHTML("beforeend",z({id:e.id,senderId:e.sender_id,text:e.message_text,createdAt:e.created_at,tick:e.sent_at_tick,isMine:!1,isSystem:e.is_system||!1})),t.scrollTop=t.scrollHeight}d.from("group_chat_members").update({last_read_at:new Date().toISOString()}).eq("chat_id",e.chat_id).eq("faction_id",l.id).then(()=>{})})();return}E++,A(),M&&y==="list"&&q()}}async function me(){if(l?.id){try{const{data:e}=await d.from("direct_messages").select("sender_id").eq("receiver_id",l.id).is("read_at",null).limit(200),i=new Set;for(const t of e||[])i.add(t.sender_id);const n=h.filter(t=>t.unreadCount>0).length;E=i.size+n}catch{}A()}}function A(){const e=document.getElementById("msg-badge");e&&(E>0?(e.textContent=E>99?"99+":String(E),e.classList.add("visible")):e.classList.remove("visible"))}function fe(e,i,n){l=e,v=i,D=n,!(!e||!e.id)&&(O(),U(),ne().then(()=>{G().then(()=>{me()})}),re())}export{fe as initMessaging};
