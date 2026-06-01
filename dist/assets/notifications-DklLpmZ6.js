import{_ as f}from"./supabase-client-BXEzLDpS.js";import{a as p}from"./utils-CzgKGX6o.js";const M=6e4,E=30;let _=null,y=null,w=!1,x=!1,v=!1,g="",k=null;function N(){if(w||document.getElementById("notif-bell-styles")){w=!0;return}const e=document.createElement("style");e.id="notif-bell-styles",e.textContent=`
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
`,document.head.appendChild(e),w=!0}function h(){const e=document.getElementById("notif-bell"),t=document.getElementById("notif-dropdown");t&&(t.hidden=!0),e&&e.setAttribute("aria-expanded","false")}function P(){if(x)return;const e=document.getElementById("notif-bell"),t=document.getElementById("notif-dropdown");!e||!t||(e.addEventListener("click",i=>{if(i.stopPropagation(),!t.hidden)h();else{t.hidden=!1,e.setAttribute("aria-expanded","true"),k=g;const o=document.getElementById("notif-dot");o&&(o.hidden=!0),b()}}),document.addEventListener("click",i=>{t.hidden||t.contains(i.target)||e.contains(i.target)||h()}),document.addEventListener("keydown",i=>{i.key==="Escape"&&!t.hidden&&h()}),x=!0)}async function C(e,t){const i={isPM:!1,isTradeMin:!1,isJusticeMin:!1};if(!e?.id||!t?.id)return i;const o=f.from("ministries").select("ministry_key, party_id").eq("nation_id",t.id).in("ministry_key",["trade","justice","prime_minister"]).eq("is_active",!0),r=f.from("government_formations").select("ministry_assignments").eq("nation_id",t.id).in("status",["formed","caretaker"]).order("formed_at",{ascending:!1}).limit(1),[{data:n},{data:c}]=await Promise.all([o,r]);return(n||[]).forEach(s=>{s.party_id===e.id&&(s.ministry_key==="trade"&&(i.isTradeMin=!0),s.ministry_key==="justice"&&(i.isJusticeMin=!0),s.ministry_key==="prime_minister"&&(i.isPM=!0))}),(c||[])[0]?.ministry_assignments?.prime_minister===e.id&&(i.isPM=!0),i}async function B(e,t,i){if(!e?.id||!t?.id)return[];if(t.central_bank_governor_party_id!==e.id)return[];if(Number(t.central_bank_governor_term_end_tick??0)<=Number(i?.current_tick??0))return[];const{data:o,error:r}=await f.from("central_bank_loans").select("id, principal, corp:entrepreneur_corps!borrower_corp_id(name)").eq("nation_id",t.id).eq("status","pending").order("created_at",{ascending:!0});return r||!o?[]:o.map(n=>({title:"New Loan Request",sub:`${n.corp?.name||"A corporation"} · $${Math.round(Number(n.principal||0)/1e6).toLocaleString()}`,href:"government.html"}))}async function A(e,t){const{data:i,error:o}=await f.from("bills").select("id, status, bill_support(faction_id)").eq("nation_id",t.id).in("status",["committee","floor"]);if(o||!i)return[];let r=0,n=0;for(const d of i)(d.bill_support||[]).some(a=>a.faction_id===e.id)||(d.status==="committee"?r++:d.status==="floor"&&n++);const c=[];return r>0&&c.push({title:`${r} bill${r===1?"":"s"} in committee awaiting your vote`,sub:"Committee · unvoted",href:"laws.html?view=committee"}),n>0&&c.push({title:`${n} bill${n===1?"":"s"} on the floor awaiting your vote`,sub:"Floor · unvoted",href:"laws.html?view=floor"}),c}async function R(e,t){const i=Number(t?.current_tick)||0;if(i<=0)return[];const{data:o}=await f.from("elections").select("election_tick").eq("nation_id",e.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1),r=(o||[])[0];if(!r)return[];const n=Number(r.election_tick)||0;if(!n||n>i||i-n>E)return[];const c=i-n;return[{title:"Election completed",sub:c===0?"Just now":`${c} tick${c===1?"":"s"} ago`,href:"elections.html",dismissId:`election:${n}`}]}async function T(e,t){const i=Number(t?.current_tick)||0;if(i<=0)return[];const[{data:o},{data:r}]=await Promise.all([f.from("elections").select("election_tick").eq("nation_id",e.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1),f.from("government_formations").select("id, status").eq("nation_id",e.id).in("status",["formed","active","caretaker"]).limit(1)]),n=(o||[])[0];if(!n)return[];const c=Number(n.election_tick)||0;return!c||c>i||i-c>E?[]:(r||[]).length>0?[]:[{title:"Form Coalition",sub:"Use 'Form Coalition' to create a government.",href:"politics.html",dismissId:`form_coalition:${c}`}]}async function L(e,t){const{data:i}=await f.from("government_formations").select("id, party_ids, proposed_by").eq("nation_id",t.id).eq("status","active"),o=(i||[]).filter(s=>(s.party_ids||[]).includes(e.id)&&s.proposed_by!==e.id);if(o.length===0)return[];const r=o.map(s=>s.id),{data:n}=await f.from("government_formation_support").select("formation_id").in("formation_id",r).eq("faction_id",e.id),c=new Set((n||[]).map(s=>s.formation_id)),d=o.filter(s=>!c.has(s.id));return d.length===0?[]:[{title:d.length===1?"Coalition invitation awaiting your response":`${d.length} coalition invitations awaiting your response`,sub:"Government formation",href:"government.html"}]}async function F(e){if(!e?.id)return[];const t=f.from("direct_messages").select("id",{count:"exact",head:!0}).eq("receiver_id",e.id).is("read_at",null),i=f.from("group_chat_members").select("chat_id, last_read_at, group_chats!inner(id, chat_type)").eq("faction_id",e.id),[{count:o},{data:r}]=await Promise.all([t,i]),n=[];(o||0)>0&&n.push({title:`${o} new private message${o===1?"":"s"}`,sub:"Direct messages",href:"#open-messaging"});let c=0,d=0;const s=await Promise.allSettled((r||[]).map(async a=>{const l=Array.isArray(a.group_chats)?a.group_chats[0]:a.group_chats;if(!l)return null;const u=l.chat_type;if(u!=="global"&&u!=="nation")return null;let m=f.from("group_chat_messages").select("id",{count:"exact",head:!0}).eq("chat_id",l.id).neq("sender_id",e.id);a.last_read_at&&(m=m.gt("created_at",a.last_read_at));const{count:S}=await m;return{type:u,count:S||0}}));for(const a of s)a.status!=="fulfilled"||!a.value||!a.value.count||(a.value.type==="global"?c+=a.value.count:a.value.type==="nation"&&(d+=a.value.count));return c>0&&n.push({title:`${c} new message${c===1?"":"s"} in Global chat`,sub:"Global chat",href:"#open-messaging-global"}),d>0&&n.push({title:`${d} new message${d===1?"":"s"} in Nation chat`,sub:"Nation chat",href:"#open-messaging-nation"}),n}async function j(e,t,i,o){if(!i&&!o)return[];const{data:r}=await f.from("trade_negotiations").select("id").eq("status","open").or(`nation_a_id.eq.${t.id},nation_b_id.eq.${t.id}`);if(!r||r.length===0)return[];const n=r.map(a=>a.id),{data:c}=await f.from("negotiation_messages").select("negotiation_id, sender_nation_id, created_at").in("negotiation_id",n).order("created_at",{ascending:!1}).limit(200),d=new Map;for(const a of c||[])d.has(a.negotiation_id)||d.set(a.negotiation_id,a);let s=0;for(const a of r){const l=d.get(a.id);l&&l.sender_nation_id!==t.id&&s++}return s===0?[]:[{title:`${s} trade negotiation${s===1?"":"s"} with new messages`,sub:"Trade ministry",href:"diplomacy.html"}]}async function z(e,t,i){if(!e?.id||!t?.id)return[];const o=[],{data:r,error:n}=await f.from("petitions").select("id, faction_id, monarch_faction_id, auto_accept_at_tick, bucket").eq("nation_id",t.id).eq("status","pending").maybeSingle();n?console.warn("[notifications] petition pending check failed:",n.message):r&&t.monarch_faction_id&&t.monarch_faction_id===e.id&&o.push({title:"Petition for Reform awaiting your decision",sub:"Government → Administrative → Pressing Issues",href:"government.html"});const c=Number(i?.current_tick)||0,d=Math.max(0,c-6),{data:s,error:a}=await f.from("petitions").select("id, status, resolved_at_tick").eq("nation_id",t.id).eq("faction_id",e.id).in("status",["dismissed","partial","accepted","auto_accepted"]).gte("resolved_at_tick",d).order("resolved_at_tick",{ascending:!1}).limit(1);if(a)console.warn("[notifications] petition resolved check failed:",a.message);else if(s&&s.length>0){const l=s[0],u=l.status==="dismissed"?"dismissed":l.status==="partial"?"partially accepted":l.status==="auto_accepted"?"accepted by default":"accepted";o.push({id:"petition-resolved-"+l.id,title:`Your Petition for Reform was ${u}`,sub:"Politics → Timeline",href:"government.html"})}return o}async function D(e,t){if(!t)return[];const{data:i,error:o}=await f.from("commercial_lawsuits").select("id").eq("nation_id",e.id).in("status",["pending","reviewing"]);return o||!i||i.length===0?[]:[{title:`${i.length} open lawsuit${i.length===1?"":"s"} in your nation`,sub:"Ministry of Justice",href:"laws.html?view=lawsuits"}]}function J(e){return(e||[]).map(t=>`${t.title||""}|${t.sub||""}`).join("||")}function $(e){const t=e.dismissId==null?"":String(e.dismissId);return`${e.title||""}::${e.href||""}::${t}`}function q(){const e=_?.faction?.id;if(!e)return new Set;try{const t=localStorage.getItem("notif_dismissed_"+e);return new Set(t?JSON.parse(t):[])}catch{return new Set}}function U(e){const t=_?.faction?.id;if(t)try{localStorage.setItem("notif_dismissed_"+t,JSON.stringify([...e]))}catch{}}function I(e){const t=document.getElementById("notif-list"),i=document.getElementById("notif-count"),o=document.getElementById("notif-dot");if(!t)return;const r=q(),n=e.filter(s=>!r.has($(s)));i&&(i.textContent=String(n.length)),g=J(n);const c=document.getElementById("notif-dropdown");c&&!c.hidden&&(k=g);const d=n.length>0&&g!==k;if(o&&(o.hidden=!d),n.length===0){t.innerHTML='<div class="notif-empty">No notifications</div>';return}t.innerHTML=n.map(s=>{const a=s.href||"#",l=p(s.title||""),u=p(s.sub||""),m=p($(s));return`<div class="notif-row-wrap">
            <a class="notif-row" href="${p(a)}" data-action="${p(a)}">
                <span class="notif-row__title">${l}</span>
                <span class="notif-row__sub">${u}</span>
            </a>
            <button type="button" class="notif-row__close" data-dismiss-key="${m}" title="Dismiss" aria-label="Dismiss notification">&times;</button>
        </div>`}).join(""),t.querySelectorAll(".notif-row").forEach(s=>{(s.getAttribute("data-action")||"").startsWith("#")&&s.addEventListener("click",l=>{l.preventDefault(),G()})}),t.querySelectorAll(".notif-row__close").forEach(s=>{s.addEventListener("click",a=>{a.preventDefault(),a.stopPropagation();const l=s.getAttribute("data-dismiss-key");if(!l)return;const u=q();u.add(l),U(u),I(e)})})}function G(e){h();const t=document.getElementById("msg-bubble");t&&t.click()}async function H(e){if(!e?.id)return[];const{data:t,error:i}=await f.from("shipping_contracts").select("id, commodity, origin_port, destination_port, volume_required, last_tick_units_filled, last_filled_tick, consecutive_missed_payments").eq("nation_id",e.id).eq("status","open").not("trade_agreement_id","is",null);if(i||!t)return[];const o=[];for(const r of t){const n=Number(r.volume_required)||0;if(n<=0||r.last_filled_tick==null)continue;const c=Number(r.last_tick_units_filled)||0,d=Number(r.consecutive_missed_payments)||0;if(Math.max(0,n-c)<=0&&d<=0)continue;const a=`${r.origin_port||"?"} → ${r.destination_port||"?"}`,l=r.commodity||"cargo",u=d>0?`${l}: ${a} — payment missed (treasury too low); delivery has stalled.`:`${l}: ${a} — only ${c} of ${n} units/tick delivered last tick.`;o.push({title:"Import route under-covered",sub:u,href:"diplomacy.html",dismissId:`shipping_coverage:${r.id}`})}return o}async function O(e,t){if(!t||!e?.id)return[];let i;try{i=await f.rpc("get_route_bids_for_minister",{p_nation_id:e.id})}catch{return[]}if(i.error||!i.data||!i.data.success)return[];const o=(i.data.routes||[]).filter(n=>(n.bids||[]).length>0);if(!o.length)return[];const r=o.reduce((n,c)=>n+(c.bids||[]).length,0);return[{title:"Shipping bids to review",sub:`${r} carrier bid${r===1?"":"s"} across ${o.length} import route${o.length===1?"":"s"} — review or veto in the Trade tab.`,href:"diplomacy.html",dismissId:"shipping_bids:"+r}]}async function b(){if(!(v||!_)){v=!0;try{const{faction:e,nation:t,shard:i}=_,{isPM:o,isTradeMin:r,isJusticeMin:n}=await C(e,t),c=[A(e,t),B(e,t,i),R(t,i),T(t,i),L(e,t),F(e),j(e,t,o,r),D(t,n),z(e,t,i),H(t),O(t,r)],s=(await Promise.allSettled(c)).filter(a=>a.status==="fulfilled"&&Array.isArray(a.value)).flatMap(a=>a.value);I(s)}catch(e){console.warn("[notifications] refresh failed:",e?.message||e)}finally{v=!1}}}async function W(e){const t=document.querySelector(".notif-wrap");if(!e?.faction){t&&(t.style.display="none");return}if(!(e.faction.faction_type==="corporation")&&!e.nation){t&&(t.style.display="none");return}_=e,N(),P(),b(),window.__notif_focus_listener||(window.addEventListener("focus",()=>b()),window.__notif_focus_listener=!0),y&&clearInterval(y),y=setInterval(b,M)}export{W as initNotifications};
