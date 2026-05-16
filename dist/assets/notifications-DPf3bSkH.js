import{_supabase as f}from"./supabase-client-CiYoFhIh.js";import{e as p}from"./utils-oN1e812_.js";const M=6e4,I=30;let _=null,y=null,w=!1,k=!1,v=!1,g="",x=null;function P(){if(w||document.getElementById("notif-bell-styles")){w=!0;return}const t=document.createElement("style");t.id="notif-bell-styles",t.textContent=`
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
`,document.head.appendChild(t),w=!0}function h(){const t=document.getElementById("notif-bell"),e=document.getElementById("notif-dropdown");e&&(e.hidden=!0),t&&t.setAttribute("aria-expanded","false")}function C(){if(k)return;const t=document.getElementById("notif-bell"),e=document.getElementById("notif-dropdown");!t||!e||(t.addEventListener("click",i=>{if(i.stopPropagation(),!e.hidden)h();else{e.hidden=!1,t.setAttribute("aria-expanded","true"),x=g;const a=document.getElementById("notif-dot");a&&(a.hidden=!0),b()}}),document.addEventListener("click",i=>{e.hidden||e.contains(i.target)||t.contains(i.target)||h()}),document.addEventListener("keydown",i=>{i.key==="Escape"&&!e.hidden&&h()}),k=!0)}async function N(t,e){const i={isPM:!1,isTradeMin:!1,isJusticeMin:!1};if(!t?.id||!e?.id)return i;const a=f.from("ministries").select("ministry_key, party_id").eq("nation_id",e.id).in("ministry_key",["trade","justice","prime_minister"]).eq("is_active",!0),d=f.from("government_formations").select("ministry_assignments").eq("nation_id",e.id).in("status",["formed","caretaker"]).order("formed_at",{ascending:!1}).limit(1),[{data:o},{data:s}]=await Promise.all([a,d]);return(o||[]).forEach(n=>{n.party_id===t.id&&(n.ministry_key==="trade"&&(i.isTradeMin=!0),n.ministry_key==="justice"&&(i.isJusticeMin=!0),n.ministry_key==="prime_minister"&&(i.isPM=!0))}),(s||[])[0]?.ministry_assignments?.prime_minister===t.id&&(i.isPM=!0),i}async function A(t,e){const{data:i,error:a}=await f.from("bills").select("id, status, bill_support(faction_id)").eq("nation_id",e.id).in("status",["committee","floor"]);if(a||!i)return[];let d=0,o=0;for(const c of i)(c.bill_support||[]).some(r=>r.faction_id===t.id)||(c.status==="committee"?d++:c.status==="floor"&&o++);const s=[];return d>0&&s.push({title:`${d} bill${d===1?"":"s"} in committee awaiting your vote`,sub:"Committee · unvoted",href:"laws.html?view=committee"}),o>0&&s.push({title:`${o} bill${o===1?"":"s"} on the floor awaiting your vote`,sub:"Floor · unvoted",href:"laws.html?view=floor"}),s}async function R(t,e){const i=Number(e?.current_tick)||0;if(i<=0)return[];const{data:a}=await f.from("elections").select("election_tick").eq("nation_id",t.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1),d=(a||[])[0];if(!d)return[];const o=Number(d.election_tick)||0;if(!o||o>i||i-o>I)return[];const s=i-o;return[{title:"Election completed",sub:s===0?"Just now":`${s} tick${s===1?"":"s"} ago`,href:"elections.html",dismissId:`election:${o}`}]}async function B(t,e){const i=Number(e?.current_tick)||0;if(i<=0)return[];const[{data:a},{data:d}]=await Promise.all([f.from("elections").select("election_tick").eq("nation_id",t.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1),f.from("government_formations").select("id, status").eq("nation_id",t.id).in("status",["formed","active","caretaker"]).limit(1)]),o=(a||[])[0];if(!o)return[];const s=Number(o.election_tick)||0;return!s||s>i||i-s>I?[]:(d||[]).length>0?[]:[{title:"Form Coalition",sub:"Use 'Form Coalition' to create a government.",href:"politics.html",dismissId:`form_coalition:${s}`}]}async function T(t,e){const{data:i}=await f.from("government_formations").select("id, party_ids, proposed_by").eq("nation_id",e.id).eq("status","active"),a=(i||[]).filter(n=>(n.party_ids||[]).includes(t.id)&&n.proposed_by!==t.id);if(a.length===0)return[];const d=a.map(n=>n.id),{data:o}=await f.from("government_formation_support").select("formation_id").in("formation_id",d).eq("faction_id",t.id),s=new Set((o||[]).map(n=>n.formation_id)),c=a.filter(n=>!s.has(n.id));return c.length===0?[]:[{title:c.length===1?"Coalition invitation awaiting your response":`${c.length} coalition invitations awaiting your response`,sub:"Government formation",href:"government.html"}]}async function L(t){if(!t?.id)return[];const e=f.from("direct_messages").select("id",{count:"exact",head:!0}).eq("receiver_id",t.id).is("read_at",null),i=f.from("group_chat_members").select("chat_id, last_read_at, group_chats!inner(id, chat_type)").eq("faction_id",t.id),[{count:a},{data:d}]=await Promise.all([e,i]),o=[];(a||0)>0&&o.push({title:`${a} new private message${a===1?"":"s"}`,sub:"Direct messages",href:"#open-messaging"});let s=0,c=0;const n=await Promise.allSettled((d||[]).map(async r=>{const l=Array.isArray(r.group_chats)?r.group_chats[0]:r.group_chats;if(!l)return null;const u=l.chat_type;if(u!=="global"&&u!=="nation")return null;let m=f.from("group_chat_messages").select("id",{count:"exact",head:!0}).eq("chat_id",l.id).neq("sender_id",t.id);r.last_read_at&&(m=m.gt("created_at",r.last_read_at));const{count:S}=await m;return{type:u,count:S||0}}));for(const r of n)r.status!=="fulfilled"||!r.value||!r.value.count||(r.value.type==="global"?s+=r.value.count:r.value.type==="nation"&&(c+=r.value.count));return s>0&&o.push({title:`${s} new message${s===1?"":"s"} in Global chat`,sub:"Global chat",href:"#open-messaging-global"}),c>0&&o.push({title:`${c} new message${c===1?"":"s"} in Nation chat`,sub:"Nation chat",href:"#open-messaging-nation"}),o}async function F(t,e,i,a){if(!i&&!a)return[];const{data:d}=await f.from("trade_negotiations").select("id").eq("status","open").or(`nation_a_id.eq.${e.id},nation_b_id.eq.${e.id}`);if(!d||d.length===0)return[];const o=d.map(r=>r.id),{data:s}=await f.from("negotiation_messages").select("negotiation_id, sender_nation_id, created_at").in("negotiation_id",o).order("created_at",{ascending:!1}).limit(200),c=new Map;for(const r of s||[])c.has(r.negotiation_id)||c.set(r.negotiation_id,r);let n=0;for(const r of d){const l=c.get(r.id);l&&l.sender_nation_id!==e.id&&n++}return n===0?[]:[{title:`${n} trade negotiation${n===1?"":"s"} with new messages`,sub:"Trade ministry",href:"diplomacy.html"}]}async function j(t,e,i){if(!t?.id||!e?.id)return[];const a=[],{data:d,error:o}=await f.from("petitions").select("id, faction_id, monarch_faction_id, auto_accept_at_tick, bucket").eq("nation_id",e.id).eq("status","pending").maybeSingle();o?console.warn("[notifications] petition pending check failed:",o.message):d&&e.monarch_faction_id&&e.monarch_faction_id===t.id&&a.push({title:"Petition for Reform awaiting your decision",sub:"Government → Administrative → Pressing Issues",href:"government.html"});const s=Number(i?.current_tick)||0,c=Math.max(0,s-6),{data:n,error:r}=await f.from("petitions").select("id, status, resolved_at_tick").eq("nation_id",e.id).eq("faction_id",t.id).in("status",["dismissed","partial","accepted","auto_accepted"]).gte("resolved_at_tick",c).order("resolved_at_tick",{ascending:!1}).limit(1);if(r)console.warn("[notifications] petition resolved check failed:",r.message);else if(n&&n.length>0){const l=n[0],u=l.status==="dismissed"?"dismissed":l.status==="partial"?"partially accepted":l.status==="auto_accepted"?"accepted by default":"accepted";a.push({id:"petition-resolved-"+l.id,title:`Your Petition for Reform was ${u}`,sub:"Politics → Timeline",href:"government.html"})}return a}async function z(t,e){if(!e)return[];const{data:i,error:a}=await f.from("commercial_lawsuits").select("id").eq("nation_id",t.id).in("status",["pending","reviewing"]);return a||!i||i.length===0?[]:[{title:`${i.length} open lawsuit${i.length===1?"":"s"} in your nation`,sub:"Ministry of Justice",href:"laws.html?view=lawsuits"}]}function D(t){return(t||[]).map(e=>`${e.title||""}|${e.sub||""}`).join("||")}function $(t){const e=t.dismissId==null?"":String(t.dismissId);return`${t.title||""}::${t.href||""}::${e}`}function E(){const t=_?.faction?.id;if(!t)return new Set;try{const e=localStorage.getItem("notif_dismissed_"+t);return new Set(e?JSON.parse(e):[])}catch{return new Set}}function J(t){const e=_?.faction?.id;if(e)try{localStorage.setItem("notif_dismissed_"+e,JSON.stringify([...t]))}catch{}}function q(t){const e=document.getElementById("notif-list"),i=document.getElementById("notif-count"),a=document.getElementById("notif-dot");if(!e)return;const d=E(),o=t.filter(n=>!d.has($(n)));i&&(i.textContent=String(o.length)),g=D(o);const s=document.getElementById("notif-dropdown");s&&!s.hidden&&(x=g);const c=o.length>0&&g!==x;if(a&&(a.hidden=!c),o.length===0){e.innerHTML='<div class="notif-empty">No notifications</div>';return}e.innerHTML=o.map(n=>{const r=n.href||"#",l=p(n.title||""),u=p(n.sub||""),m=p($(n));return`<div class="notif-row-wrap">
            <a class="notif-row" href="${p(r)}" data-action="${p(r)}">
                <span class="notif-row__title">${l}</span>
                <span class="notif-row__sub">${u}</span>
            </a>
            <button type="button" class="notif-row__close" data-dismiss-key="${m}" title="Dismiss" aria-label="Dismiss notification">&times;</button>
        </div>`}).join(""),e.querySelectorAll(".notif-row").forEach(n=>{(n.getAttribute("data-action")||"").startsWith("#")&&n.addEventListener("click",l=>{l.preventDefault(),G()})}),e.querySelectorAll(".notif-row__close").forEach(n=>{n.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation();const l=n.getAttribute("data-dismiss-key");if(!l)return;const u=E();u.add(l),J(u),q(t)})})}function G(t){h();const e=document.getElementById("msg-bubble");e&&e.click()}const U=3;async function H(t,e){if(!t?.id||t.faction_type!=="corporation")return[];const i=Number(e?.current_tick)||0;if(i<=0)return[];const{data:a,error:d}=await f.from("corp_executives").select("id, role, first_name, last_name, contract_end_tick").eq("faction_id",t.id).eq("status","active");if(d||!a)return[];const o=[];for(const s of a){const c=Number(s.contract_end_tick)||0;if(!c)continue;const n=c-i;if(n>U||n<=0)continue;const r=n===1?"1 tick":`${n} ticks`;o.push({title:`${s.role} contract expiring`,sub:`${s.first_name||""} ${s.last_name||""} — ${r} left. Renew or lose the role.`,href:"actions.html",dismissId:`exec_expiring:${s.id}:${c}`})}return o}async function b(){if(!(v||!_)){v=!0;try{const{faction:t,nation:e,shard:i}=_,a=t.faction_type==="corporation";let d;if(a)d=[H(t,i)];else{const{isPM:c,isTradeMin:n,isJusticeMin:r}=await N(t,e);d=[A(t,e),R(e,i),B(e,i),T(t,e),L(t),F(t,e,c,n),z(e,r),j(t,e,i)]}const s=(await Promise.allSettled(d)).filter(c=>c.status==="fulfilled"&&Array.isArray(c.value)).flatMap(c=>c.value);q(s)}catch(t){console.warn("[notifications] refresh failed:",t?.message||t)}finally{v=!1}}}async function Y(t){const e=document.querySelector(".notif-wrap");if(!t?.faction){e&&(e.style.display="none");return}if(!(t.faction.faction_type==="corporation")&&!t.nation){e&&(e.style.display="none");return}_=t,P(),C(),b(),window.__notif_focus_listener||(window.addEventListener("focus",()=>b()),window.__notif_focus_listener=!0),y&&clearInterval(y),y=setInterval(b,M)}export{Y as initNotifications};
