import{_ as m}from"./supabase-client-BXEzLDpS.js";import{c as L,e as f}from"./utils-C2W-HleY.js";const H={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png"},v=["#5b9bd5","#d48a3c","#5aafa5","#8b7ec8","#5cb85c","#d9534f","#c8a64e"],Y={Liberty:"#3b82f6",Equality:"#ef4444",Tradition:"#a855f7",Progress:"#22c55e",Security:"#f59e0b",Freedom:"#06b6d4",Globalism:"#14b8a6",Nationalism:"#f97316",Individualism:"#eab308",Collectivism:"#ec4899"};let N=null,E=[],y=null,k="Crucera",b={},h={},C={};const A=new Set;async function V(){try{const{data:{user:e}}=await m.auth.getUser();if(!e){window.location.href="login.html";return}if(N=e,sessionStorage.getItem("pending_faction_type")==="corp"){window.location.href="corp-setup.html";return}const a=sessionStorage.getItem("pending_faction_type")==="party",{data:o}=await m.from("factions").select("id, nation_id, faction_type").eq("id",e.id).maybeSingle();if(o&&o.nation_id&&!(a&&o.faction_type==="corporation")){window.location.href="dashboard.html";return}await K(),document.getElementById("loading").style.display="none";const n=document.getElementById("page-content");n.style.display="flex"}catch(e){document.getElementById("loading").textContent="FAILED TO LOAD — PLEASE REFRESH";const a=document.getElementById("error-message");a&&(a.textContent=e.message||"Unknown error",a.style.display="block")}}function J(e){k=e,document.querySelectorAll(".continent-tab").forEach(a=>{a.classList.toggle("active",a.dataset.continent===e)}),O(E,b,h,C)}async function K(){const[e,a,o,n]=await Promise.all([m.from("nations").select("*, nation_profiles(flag_url)"),m.from("factions").select("id, faction_type, faction_name, abbreviation, seats, nation_id, party_color, ideology_value_1, ideology_value_2").eq("faction_type","party"),m.from("active_crises").select("nation_id, crisis_id, crisis_templates(name)"),m.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism")]),r=e.data||[],d=a.data||[],t=o.data||[],l=n.data||[];b={},h={},C={};for(const i of d)b[i.nation_id]||(b[i.nation_id]=[]),b[i.nation_id].push(i);for(const i of t)h[i.nation_id]||(h[i.nation_id]=[]),h[i.nation_id].push(i);for(const i of l)C[i.faction_id]=i;E=r,O(r,b,h,C)}function T(e){return e==="Presidential"||e==="Semi-Presidential"?"gov-presidential":"gov-democracy"}function F(e){const a=typeof e=="string"?e:e?.government_type,o=typeof e=="object"?e?.hos_election_method:null;return a==="Presidential"?"PRESIDENTIAL":a==="Semi-Presidential"?"SEMI-PRESIDENTIAL":o==="hereditary"?"CONSTITUTIONAL MONARCHY":"PARLIAMENTARY"}function Q(e){if(!e)return"";const a=[{key:"liberty_equality",neg:"Liberty",pos:"Equality"},{key:"tradition_progress",neg:"Tradition",pos:"Progress"},{key:"security_freedom",neg:"Security",pos:"Freedom"},{key:"globalism_nationalism",neg:"Globalism",pos:"Nationalism"},{key:"individualism_collectivism",neg:"Individualism",pos:"Collectivism"}],o=[];for(const n of a){const r=e[n.key]||0;Math.abs(r)>=20&&o.push(r<0?n.neg:n.pos)}return o.slice(0,2).join(", ")}function W(e){return e?e.split(", ").map(a=>{const o=Y[a];return o?`<span style="color:${o}">${f(a)}</span>`:f(a)}).join('<span style="color:var(--text-dim)">, </span>'):""}function O(e,a,o,n){const r=document.getElementById("nations-grid"),d=e.filter(t=>(t.continent||"Crucera")===k);if(d.sort((t,l)=>{const i=L(a[t.id]||[],t.id),c=L(a[l.id]||[],l.id),g=i>=(t.max_parties||8)?1:0,_=c>=(l.max_parties||8)?1:0;return g!==_?g-_:(t.name||"").localeCompare(l.name||"")}),d.length===0){r.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}r.innerHTML=d.map(t=>{const l=a[t.id]||[],i=o[t.id]||[],c=t.total_seats||100,g=t.max_parties||8,_=L(l,t.id),w=_>=g,$=t.nation_profiles,P=(Array.isArray($)?$[0]?.flag_url:$?.flag_url)||t.flag_url||H[t.name]||`assets/flags/${t.name}.png`,R=T(t.government_type),q=F(t),U=A.has(t.id),S=[...l].sort((s,p)=>(p.seats||0)-(s.seats||0)),M=l.reduce((s,p)=>s+(p.seats||0),0),D=S.filter(s=>s.seats>0).map((s,p)=>{const I=(s.seats/c*100).toFixed(1),x=s.party_color||v[p%v.length];return`<div class="seat-bar__segment" style="width:${I}%;background:${x};" title="${f(s.faction_name)}: ${s.seats} seats"></div>`}).join(""),j=S.filter(s=>s.seats>0).map((s,p)=>`<span class="seat-legend-item"><span class="seat-legend-dot" style="background:${s.party_color||v[p%v.length]};"></span>${f(s.abbreviation||"?")} ${s.seats}</span>`).join(""),z=S.map((s,p)=>{const I=s.party_color||v[p%v.length],x=n[s.id],B=s.ideology_value_1&&s.ideology_value_2?`${s.ideology_value_1}, ${s.ideology_value_2}`:Q(x);return`
        <div class="party-row">
          <span class="party-row__dot" style="background:${I};"></span>
          <span class="party-row__name">${f(s.faction_name)}</span>
          <span class="party-row__abbr">${f(s.abbreviation||"?")}</span>
          ${B?`<span class="party-row__ideo">${W(B)}</span>`:""}
          <span class="party-row__seats">${s.seats||0}</span>
        </div>
      `}).join(""),G=i.length>0?i.map(s=>`
        <div class="crisis-row">
          <span class="crisis-pip"></span>
          <span class="crisis-name">${f(s.crisis_templates?.name||"Unknown Crisis")}</span>
        </div>
      `).join(""):'<div class="no-crisis">No active crises</div>';return`
      <div class="nation-card ${w?"disabled":""}" data-nation-id="${t.id}" onclick="${w?"":"selectNation('"+t.id+"')"}">
        <div class="nation-card__header">
          ${P?`<img class="nation-card__flag" src="${P}" alt="${f(t.name)}" onerror="this.style.display='none'">`:""}
          <span class="nation-card__name">${f(t.name)}${U?'<span class="alpha-badge">Alpha</span>':""}</span>
          <span class="nation-card__gov-type ${R}">${q}</span>
        </div>
        <div class="nation-card__body">
          <div class="stat-row">
            <span class="stat-row__label">Total Seats</span>
            <span class="stat-row__value" style="color:var(--text-secondary);">${c}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Factions</span>
            <span class="stat-row__value" style="color:${w?"var(--red)":"var(--text-secondary)"};">${_}${" / "+g}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Stability</span>
            <span class="stat-row__value" style="color:${(t.stability??50)>=60?"var(--green)":(t.stability??50)>=40?"var(--amber)":"var(--red)"};">${Number(t.stability??50).toFixed(1)}</span>
          </div>

          ${l.some(s=>s.seats>0)?`
          <div class="seat-bar">
            <div class="seat-bar__label">Seat Distribution</div>
            <div class="seat-bar__track">
              ${D}
              ${M<c?'<div class="seat-bar__empty"></div>':""}
            </div>
            <div class="seat-bar__legend">${j}</div>
          </div>
          `:""}

          ${l.length>0?`
          <div class="party-list">
            <div class="party-list__header">Factions &mdash; ${_}</div>
            ${z}
          </div>
          `:'<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-ghost);padding:6px 0;">No factions yet — be the first</div>'}

          <div class="crisis-section">
            <div class="party-list__header">Active Crises</div>
            ${G}
          </div>
        </div>
        <div class="nation-card__footer">
          <span class="join-label">${w?"NATION FULL":"JOIN THIS NATION"}</span>
          ${w?"":'<span class="join-arrow">&#x25B6;</span>'}
        </div>
      </div>
    `}).join("")}function X(e){y=e;const a=E.find(g=>g.id===e);if(!a)return;document.getElementById("modal-nation-name").textContent=a.name;const o=document.getElementById("modal-gov-badge"),n=T(a.government_type),r=F(a);o.className="modal__gov-badge "+n,o.textContent=r;const d=document.getElementById("modal-flow-hint");d.textContent="You will choose your ideology, then name and customize your party.";const t=document.getElementById("alpha-code-section"),l=document.getElementById("alpha-code-input"),i=document.getElementById("alpha-code-error"),c=A.has(e);t.classList.toggle("visible",c),l.value="",i.style.display="none",document.getElementById("modal-overlay").classList.add("active"),c&&l.focus()}function Z(){document.getElementById("modal-overlay").classList.remove("active"),y=null,u=!1}let u=!1;async function ee(){if(u||!y)return;const e=E.find(n=>n.id===y);if(!e)return;if(u=!0,A.has(y)){const n=document.getElementById("alpha-code-input"),r=document.getElementById("alpha-code-error"),d=n.value.trim().toUpperCase();if(!d){r.textContent="Please enter your alpha tester code.",r.style.display="block",n.focus(),u=!1;return}const t=document.getElementById("modal-confirm-btn");t.disabled=!0,t.textContent="VALIDATING...";const{data:l,error:i}=await m.from("alpha_tester_codes").select("id, used_by").eq("code",d).eq("nation_id",y).maybeSingle();if(i||!l||l.used_by){r.textContent=l?.used_by?"This code has already been used.":"Invalid or already used code.",r.style.display="block",t.disabled=!1,t.textContent="CONTINUE",u=!1,n.focus();return}const{data:c,error:g}=await m.from("alpha_tester_codes").update({used_by:N.id,used_at:new Date().toISOString()}).eq("id",l.id).is("used_by",null).select("id");if(g||!c||c.length===0){r.textContent="Code was already claimed. Please try a different code.",r.style.display="block",t.disabled=!1,t.textContent="CONTINUE",u=!1;return}t.disabled=!1,t.textContent="CONTINUE"}const{data:o}=await m.from("factions").select("id, faction_name").eq("linked_user_id",N.id).eq("faction_type","corporation").eq("nation_id",y).is("abandoned_at",null).maybeSingle();if(o){const n=document.getElementById("alpha-code-error")||document.createElement("div");n.id||(n.id="corp-nation-error",n.style.cssText="font-family:var(--font-mono);font-size:10px;color:#d9534f;margin-top:8px;",document.querySelector(".modal-body")?.appendChild(n)),n.textContent=`Your corporation "${o.faction_name}" is in ${e.name}. Political parties cannot operate in the same nation as your corporation.`,n.style.display="block",u=!1;return}sessionStorage.setItem("nationhood_pending_nation",JSON.stringify({id:e.id,name:e.name,government_type:e.government_type})),window.location.href="faction-select.html"}V();window.selectNation=X;window.closeModal=Z;window.confirmNation=ee;async function te(){await m.auth.signOut(),sessionStorage.clear(),window.location.href="login.html"}window.logoutUser=te;window.switchContinent=J;function ae(){const e=document.body.classList.toggle("light-mode");localStorage.setItem("nationhood_theme",e?"light":"dark");const a=document.getElementById("theme-toggle");a&&(a.textContent=e?"Dark":"Light")}window.toggleTheme=ae;(function(){if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}})();
