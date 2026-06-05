import{_ as p}from"./supabase-client-BXEzLDpS.js";import{b as u}from"./politician-topbar-5igJjSS-.js";import{d as f,b as _,s as h}from"./utils-CzgKGX6o.js";import{C as y,a as b}from"./committees-GSA3PyLy.js";import"./factions-C2s734Ze.js";const g={chair:"CHAIR",vice_chair:"VICE CHAIR",ranking_minority:"RANKING MINORITY",member:"MEMBER"};function o(t){const a=document.createElement("div");return a.textContent=t??"",a.innerHTML}async function E(){const a=new URLSearchParams(location.search).get("key")||"defense_foreign_affairs",e=y[a];if(!e){m("Unknown committee.");return}let i=null;try{i=await u("nation")}catch(n){console.error("committee: bootstrap failed",n),m("Failed to load. Please reload the page.");return}if(!i)return;const c=i.faction?.nation_id;if(!c){m("No nation associated with this politician.");return}document.title=`${e.name} — ${i.nation?.name||"Nation"}`;let r=null;try{const{data:n,error:l}=await p.rpc("ensure_committee",{p_nation_id:c,p_committee_key:a});if(l)throw l;if(!n?.success){m(`Could not load committee: ${n?.reason||"unknown"}.`);return}r=n.committee_id}catch(n){console.error("committee: ensure_committee failed",n),m("Could not load committee.");return}const{data:d,error:s}=await p.from("committee_members").select("id, slot_idx, role, party_id, npc_first_name, npc_last_name, politician_faction_id, party:factions!party_id(faction_name, abbreviation, party_color), politician:factions!politician_faction_id(leader_first_name, leader_last_name, nickname)").eq("committee_id",r).order("slot_idx",{ascending:!0});s&&console.warn("committee: members fetch failed",s),I(i,e),C(i,e,d||[],r),document.getElementById("loading").style.display="none",document.getElementById("content").style.display="block"}function m(t){const a=document.getElementById("loading");a&&(a.textContent=t,a.style.color="#c87a7a")}function I(t,a){const e=[t.faction?.leader_first_name,t.faction?.leader_last_name].filter(Boolean).join(" ");document.getElementById("crumb-host").innerHTML=`
    <a href="politician-home.html">${o(e.toUpperCase()||"POLITICIAN")}</a>
    <span class="sep">&rsaquo;</span>
    <a href="politician-nation.html">${o((t.nation?.name||"NATION").toUpperCase())}</a>
    <span class="sep">&rsaquo;</span>
    <span>COMMITTEES</span>
    <span class="sep">&rsaquo;</span>
    <span class="here">${o(a.name.toUpperCase())}</span>`}function C(t,a,e,i){const c=t.faction?.id||null,r=t.faction?.politician_office==="member_of_parliament",d=e.some(s=>s.politician_faction_id&&s.politician_faction_id===c);document.getElementById("comm-host").innerHTML=`
    <div class="ch-row">
      <div class="ch-badge">${a.icon}</div>
      <div class="ch-info">
        <div class="ch-name">${o(a.name)}</div>
        <div class="ch-desc">${o(a.desc)}</div>
      </div>
      <div class="ch-stat">
        <span class="ch-stat-val">${e.length}</span>
        <span class="ch-stat-lab">MEMBERS</span>
      </div>
    </div>

    <div class="members">
      <div class="mem-lab">COMMITTEE MEMBERS</div>
      <div class="mem-grid">${N(e,c)}</div>
    </div>

    <div class="agenda">
      <div class="ag-head">
        <span class="ag-lab">MONTHLY AGENDA</span>
        <span class="ag-status">NO ACTIVE WORK</span>
      </div>
      <div class="ag-empty">No current work item.</div>
    </div>

    <div class="testimony">
      <div class="tm-head">
        <span class="tm-lab">HEARING RECORD</span>
      </div>
      <div class="chat">
        <div class="chat-feed">
          <div class="chat-empty">No testimony recorded.</div>
        </div>
        <div class="chat-input">${T(r,d)}</div>
      </div>
    </div>

    <div class="actions">
      <div class="ac-lab">COMMITTEE ACTIONS${d?"":" &middot; MEMBERS ONLY"}</div>
      <div class="ac-grid">${A(d)}</div>
    </div>

    <div class="activities">
      <div class="av-lab">LIST OF ACTIVITIES &middot; PAST THIRTY TICKS</div>
      <div class="av-empty">No activities recorded.</div>
    </div>

    <div class="upcoming">
      <div class="up-lab">UPCOMING AGENDA</div>
      <div class="up-empty">No upcoming items.</div>
    </div>`,document.getElementById("comm-host").addEventListener("click",s=>{const n=s.target.closest("#comm-apply-cta");if(n){s.preventDefault(),M(n,i);return}s.target.closest(".act-btn.enabled")&&alert("Committee action is not yet wired up.")})}async function M(t,a){if(t.dataset.busy==="1")return;t.dataset.busy="1";const e=t.textContent;t.textContent="Submitting…";const i=await b(a);if(!i.success){alert(i.humanError),t.dataset.busy="",t.textContent=e;return}alert(`Admission vote opened. Resolves at tick ${i.data.resolve_at_tick}.`),window.location.href="politician-nation.html#sec-voting"}function N(t,a){return t.length?t.map(e=>{const i=e.politician_faction_id?e.politician:{leader_first_name:e.npc_first_name,leader_last_name:e.npc_last_name},c=[i?.leader_first_name,i?.leader_last_name].filter(Boolean).join(" ").trim()||"—",r=f(i)||"—",d=_(c,null),s=h(e.party?.party_color),n=e.party?.faction_name||"Independent",l=e.role==="chair",v=e.politician_faction_id&&e.politician_faction_id===a;return`
      <div class="mem${l?" chair":""}">
        <div class="mem-badge" style="background:${s};">${o(d)}</div>
        <div class="mem-role">${o(g[e.role]||"MEMBER")}</div>
        <div class="mem-name">${o(r)}</div>
        <div class="mem-party">${o(n)}</div>
        ${v?'<div class="mem-you">YOU</div>':""}
      </div>`}).join(""):'<div class="mem-empty">No members seated yet.</div>'}function T(t,a){return a?'<div class="input-disabled"><strong>You are a member.</strong> &middot; The testimony interface will open here once a hearing is in session.</div>':t?'<div class="input-disabled"><strong>You are not on this committee.</strong> &middot; Read-only. <a href="#" id="comm-apply-cta">Apply for committee membership</a> to participate.</div>':'<div class="input-disabled"><strong>Observer access.</strong> &middot; Members of Parliament may apply for committee membership.</div>'}function A(t){return[{ic:"☞",name:"HOLD A HEARING",desc:"Call witnesses, take public testimony. The chamber and the press both watch."},{ic:"☇",name:"VOTE ON APPROPRIATIONS",desc:"Approve, modify, or deny funding for ministries and programs in the committee’s remit."},{ic:"✎",name:"AMEND A PROPOSAL",desc:"Modify a bill clause-by-clause before it goes to the chamber floor."}].map(e=>`
    <button class="act-btn${t?" enabled":""}" type="button"${t?"":" disabled"}>
      <div class="act-head">
        <span class="act-ic">${e.ic}</span>
        <span class="act-name">${o(e.name)}</span>
      </div>
      <div class="act-desc">${o(e.desc)}</div>
    </button>`).join("")}E();
