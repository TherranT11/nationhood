import{_ as c}from"./supabase-client-BXEzLDpS.js";import{c as G,e as p}from"./utils-C2W-HleY.js";const H={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png"},_=["#5b9bd5","#d48a3c","#5aafa5","#8b7ec8","#5cb85c","#d9534f","#c8a64e"],Y={Liberty:"#3b82f6",Equality:"#ef4444",Tradition:"#a855f7",Progress:"#22c55e",Security:"#f59e0b",Freedom:"#06b6d4",Globalism:"#14b8a6",Nationalism:"#f97316",Individualism:"#eab308",Collectivism:"#ec4899"};let N=null,C=[],y=null,P="Crucera",v={},b={},I={};const x=new Set;async function V(){try{const{data:{user:e}}=await c.auth.getUser();if(!e){window.location.href="login.html";return}if(N=e,sessionStorage.getItem("pending_faction_type")==="corp"){window.location.href="corp-setup.html";return}const a=sessionStorage.getItem("pending_faction_type")==="party",{data:o}=await c.from("factions").select("id, nation_id, faction_type").eq("id",e.id).maybeSingle();if(o&&o.nation_id&&!(a&&o.faction_type==="corporation")){window.location.href="dashboard.html";return}await K(),document.getElementById("loading").style.display="none";const n=document.getElementById("page-content");n.style.display="flex"}catch(e){document.getElementById("loading").textContent="FAILED TO LOAD — PLEASE REFRESH";const a=document.getElementById("error-message");a&&(a.textContent=e.message||"Unknown error",a.style.display="block")}}function J(e){P=e,document.querySelectorAll(".continent-tab").forEach(a=>{a.classList.toggle("active",a.dataset.continent===e)}),O(C,v,b,I)}async function K(){const[e,a,o,n]=await Promise.all([c.from("nations").select("*, nation_profiles(flag_url)"),c.from("factions").select("id, faction_type, faction_name, abbreviation, seats, nation_id, party_color, ideology_value_1, ideology_value_2").eq("faction_type","party"),c.from("active_crises").select("nation_id, crisis_id, crisis_templates(name)"),c.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism")]),l=e.data||[],d=a.data||[],t=o.data||[],r=n.data||[];v={},b={},I={};for(const i of d)v[i.nation_id]||(v[i.nation_id]=[]),v[i.nation_id].push(i);for(const i of t)b[i.nation_id]||(b[i.nation_id]=[]),b[i.nation_id].push(i);for(const i of r)I[i.faction_id]=i;C=l,O(l,v,b,I)}function k(e){return e==="Presidential"||e==="Semi-Presidential"?"gov-presidential":"gov-democracy"}function T(e){const a=typeof e=="string"?e:e?.government_type,o=typeof e=="object"?e?.hos_election_method:null;return a==="Presidential"?"PRESIDENTIAL":a==="Semi-Presidential"?"SEMI-PRESIDENTIAL":o==="hereditary"?"CONSTITUTIONAL MONARCHY":"PARLIAMENTARY"}function Q(e){if(!e)return"";const a=[{key:"liberty_equality",neg:"Liberty",pos:"Equality"},{key:"tradition_progress",neg:"Tradition",pos:"Progress"},{key:"security_freedom",neg:"Security",pos:"Freedom"},{key:"globalism_nationalism",neg:"Globalism",pos:"Nationalism"},{key:"individualism_collectivism",neg:"Individualism",pos:"Collectivism"}],o=[];for(const n of a){const l=e[n.key]||0;Math.abs(l)>=20&&o.push(l<0?n.neg:n.pos)}return o.slice(0,2).join(", ")}function W(e){return e?e.split(", ").map(a=>{const o=Y[a];return o?`<span style="color:${o}">${p(a)}</span>`:p(a)}).join('<span style="color:var(--text-dim)">, </span>'):""}function O(e,a,o,n){const l=document.getElementById("nations-grid"),d=e.filter(t=>(t.continent||"Crucera")===P);if(d.length===0){l.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}l.innerHTML=d.map(t=>{const r=a[t.id]||[],i=o[t.id]||[],m=t.total_seats||100,u=t.max_parties||8,E=G(r,t.id),h=E>=u,$=t.nation_profiles,A=(Array.isArray($)?$[0]?.flag_url:$?.flag_url)||t.flag_url||H[t.name]||`assets/flags/${t.name}.png`,R=k(t.government_type),F=T(t),q=x.has(t.id),S=[...r].sort((s,g)=>(g.seats||0)-(s.seats||0)),U=r.reduce((s,g)=>s+(g.seats||0),0),M=S.filter(s=>s.seats>0).map((s,g)=>{const w=(s.seats/m*100).toFixed(1),L=s.party_color||_[g%_.length];return`<div class="seat-bar__segment" style="width:${w}%;background:${L};" title="${p(s.faction_name)}: ${s.seats} seats"></div>`}).join(""),D=S.filter(s=>s.seats>0).map((s,g)=>`<span class="seat-legend-item"><span class="seat-legend-dot" style="background:${s.party_color||_[g%_.length]};"></span>${p(s.abbreviation||"?")} ${s.seats}</span>`).join(""),j=S.map((s,g)=>{const w=s.party_color||_[g%_.length],L=n[s.id],B=s.ideology_value_1&&s.ideology_value_2?`${s.ideology_value_1}, ${s.ideology_value_2}`:Q(L);return`
        <div class="party-row">
          <span class="party-row__dot" style="background:${w};"></span>
          <span class="party-row__name">${p(s.faction_name)}</span>
          <span class="party-row__abbr">${p(s.abbreviation||"?")}</span>
          ${B?`<span class="party-row__ideo">${W(B)}</span>`:""}
          <span class="party-row__seats">${s.seats||0}</span>
        </div>
      `}).join(""),z=i.length>0?i.map(s=>`
        <div class="crisis-row">
          <span class="crisis-pip"></span>
          <span class="crisis-name">${p(s.crisis_templates?.name||"Unknown Crisis")}</span>
        </div>
      `).join(""):'<div class="no-crisis">No active crises</div>';return`
      <div class="nation-card ${h?"disabled":""}" data-nation-id="${t.id}" onclick="${h?"":"selectNation('"+t.id+"')"}">
        <div class="nation-card__header">
          ${A?`<img class="nation-card__flag" src="${A}" alt="${p(t.name)}" onerror="this.style.display='none'">`:""}
          <span class="nation-card__name">${p(t.name)}${q?'<span class="alpha-badge">Alpha</span>':""}</span>
          <span class="nation-card__gov-type ${R}">${F}</span>
        </div>
        <div class="nation-card__body">
          <div class="stat-row">
            <span class="stat-row__label">Total Seats</span>
            <span class="stat-row__value" style="color:var(--text-secondary);">${m}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Factions</span>
            <span class="stat-row__value" style="color:${h?"var(--red)":"var(--text-secondary)"};">${E}${" / "+u}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Stability</span>
            <span class="stat-row__value" style="color:${(t.stability||50)>=60?"var(--green)":(t.stability||50)>=40?"var(--amber)":"var(--red)"};">${t.stability||50}</span>
          </div>

          ${r.some(s=>s.seats>0)?`
          <div class="seat-bar">
            <div class="seat-bar__label">Seat Distribution</div>
            <div class="seat-bar__track">
              ${M}
              ${U<m?'<div class="seat-bar__empty"></div>':""}
            </div>
            <div class="seat-bar__legend">${D}</div>
          </div>
          `:""}

          ${r.length>0?`
          <div class="party-list">
            <div class="party-list__header">Factions &mdash; ${E}</div>
            ${j}
          </div>
          `:'<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-ghost);padding:6px 0;">No factions yet — be the first</div>'}

          <div class="crisis-section">
            <div class="party-list__header">Active Crises</div>
            ${z}
          </div>
        </div>
        <div class="nation-card__footer">
          <span class="join-label">${h?"NATION FULL":"JOIN THIS NATION"}</span>
          ${h?"":'<span class="join-arrow">&#x25B6;</span>'}
        </div>
      </div>
    `}).join("")}function X(e){y=e;const a=C.find(u=>u.id===e);if(!a)return;document.getElementById("modal-nation-name").textContent=a.name;const o=document.getElementById("modal-gov-badge"),n=k(a.government_type),l=T(a);o.className="modal__gov-badge "+n,o.textContent=l;const d=document.getElementById("modal-flow-hint");d.textContent="You will choose your ideology, then name and customize your party.";const t=document.getElementById("alpha-code-section"),r=document.getElementById("alpha-code-input"),i=document.getElementById("alpha-code-error"),m=x.has(e);t.classList.toggle("visible",m),r.value="",i.style.display="none",document.getElementById("modal-overlay").classList.add("active"),m&&r.focus()}function Z(){document.getElementById("modal-overlay").classList.remove("active"),y=null,f=!1}let f=!1;async function ee(){if(f||!y)return;const e=C.find(n=>n.id===y);if(!e)return;if(f=!0,x.has(y)){const n=document.getElementById("alpha-code-input"),l=document.getElementById("alpha-code-error"),d=n.value.trim().toUpperCase();if(!d){l.textContent="Please enter your alpha tester code.",l.style.display="block",n.focus(),f=!1;return}const t=document.getElementById("modal-confirm-btn");t.disabled=!0,t.textContent="VALIDATING...";const{data:r,error:i}=await c.from("alpha_tester_codes").select("id, used_by").eq("code",d).eq("nation_id",y).maybeSingle();if(i||!r||r.used_by){l.textContent=r?.used_by?"This code has already been used.":"Invalid or already used code.",l.style.display="block",t.disabled=!1,t.textContent="CONTINUE",f=!1,n.focus();return}const{data:m,error:u}=await c.from("alpha_tester_codes").update({used_by:N.id,used_at:new Date().toISOString()}).eq("id",r.id).is("used_by",null).select("id");if(u||!m||m.length===0){l.textContent="Code was already claimed. Please try a different code.",l.style.display="block",t.disabled=!1,t.textContent="CONTINUE",f=!1;return}t.disabled=!1,t.textContent="CONTINUE"}const{data:o}=await c.from("factions").select("id, faction_name").eq("linked_user_id",N.id).eq("faction_type","corporation").eq("nation_id",y).is("abandoned_at",null).maybeSingle();if(o){const n=document.getElementById("alpha-code-error")||document.createElement("div");n.id||(n.id="corp-nation-error",n.style.cssText="font-family:var(--font-mono);font-size:10px;color:#d9534f;margin-top:8px;",document.querySelector(".modal-body")?.appendChild(n)),n.textContent=`Your corporation "${o.faction_name}" is in ${e.name}. Political parties cannot operate in the same nation as your corporation.`,n.style.display="block",f=!1;return}sessionStorage.setItem("nationhood_pending_nation",JSON.stringify({id:e.id,name:e.name,government_type:e.government_type})),window.location.href="faction-select.html"}V();window.selectNation=X;window.closeModal=Z;window.confirmNation=ee;async function te(){await c.auth.signOut(),sessionStorage.clear(),window.location.href="login.html"}window.logoutUser=te;window.switchContinent=J;function ae(){const e=document.body.classList.toggle("light-mode");localStorage.setItem("nationhood_theme",e?"light":"dark");const a=document.getElementById("theme-toggle");a&&(a.textContent=e?"Dark":"Light")}window.toggleTheme=ae;(function(){if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}})();
