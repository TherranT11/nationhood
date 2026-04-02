import{_ as d}from"./supabase-client-BXEzLDpS.js";import{c as G,e as y}from"./utils-C2W-HleY.js";const u=["#5b9bd5","#d48a3c","#5aafa5","#8b7ec8","#5cb85c","#d9534f","#c8a64e"],z={Liberty:"#3b82f6",Equality:"#ef4444",Tradition:"#a855f7",Progress:"#22c55e",Security:"#f59e0b",Freedom:"#06b6d4",Globalism:"#14b8a6",Nationalism:"#f97316",Individualism:"#eab308",Collectivism:"#ec4899"};let A=null,C=[],v=null,T="Crucera",_={},f={},I={};const $=new Set;async function Y(){try{const{data:{user:e}}=await d.auth.getUser();if(!e){window.location.href="login.html";return}A=e;const{data:t}=await d.from("factions").select("id, nation_id, faction_type").eq("id",e.id).maybeSingle();if(t&&t.nation_id){window.location.href="dashboard.html";return}if(sessionStorage.getItem("pending_faction_type")==="corp"){window.location.href="corp-setup.html";return}const{data:o}=await d.from("alpha_tester_codes").select("nation_id").is("used_by",null);if(o)for(const l of o)$.add(l.nation_id);await K(),document.getElementById("loading").style.display="none";const i=document.getElementById("page-content");i.style.display="flex"}catch(e){document.getElementById("loading").textContent="FAILED TO LOAD — PLEASE REFRESH";const t=document.getElementById("error-message");t&&(t.textContent=e.message||"Unknown error",t.style.display="block")}}function J(e){T=e,document.querySelectorAll(".continent-tab").forEach(t=>{t.classList.toggle("active",t.dataset.continent===e)}),P(C,_,f,I)}async function K(){const[e,t,o,i]=await Promise.all([d.from("nations").select("*, nation_profiles(flag_url)"),d.from("factions").select("id, faction_type, faction_name, abbreviation, seats, nation_id, party_color, ideology_value_1, ideology_value_2").eq("faction_type","party"),d.from("active_crises").select("nation_id, crisis_id, crisis_templates(name)"),d.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism")]),l=e.data||[],r=t.data||[],a=o.data||[],c=i.data||[];_={},f={},I={};for(const n of r)_[n.nation_id]||(_[n.nation_id]=[]),_[n.nation_id].push(n);for(const n of a)f[n.nation_id]||(f[n.nation_id]=[]),f[n.nation_id].push(n);for(const n of c)I[n.faction_id]=n;C=l,P(l,_,f,I)}function k(e){return e==="Presidential"?"gov-presidential":"gov-democracy"}function O(e){const t=typeof e=="string"?e:e?.government_type,o=typeof e=="object"?e?.hos_election_method:null;return t==="Presidential"?"PRESIDENTIAL":o==="hereditary"?"CONSTITUTIONAL MONARCHY":"PARLIAMENTARY"}function V(e){if(!e)return"";const t=[{key:"liberty_equality",neg:"Liberty",pos:"Equality"},{key:"tradition_progress",neg:"Tradition",pos:"Progress"},{key:"security_freedom",neg:"Security",pos:"Freedom"},{key:"globalism_nationalism",neg:"Globalism",pos:"Nationalism"},{key:"individualism_collectivism",neg:"Individualism",pos:"Collectivism"}],o=[];for(const i of t){const l=e[i.key]||0;Math.abs(l)>=20&&o.push(l<0?i.neg:i.pos)}return o.slice(0,2).join(", ")}function Q(e){return e?e.split(", ").map(t=>{const o=z[t];return o?`<span style="color:${o}">${y(t)}</span>`:y(t)}).join('<span style="color:var(--text-dim)">, </span>'):""}function P(e,t,o,i){const l=document.getElementById("nations-grid"),r=e.filter(a=>(a.continent||"Crucera")===T);if(r.length===0){l.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}l.innerHTML=r.map(a=>{const c=t[a.id]||[],n=o[a.id]||[],g=a.total_seats||100,h=a.max_parties||8,E=G(c,a.id),b=E>=h,L=a.nation_profiles,S=(Array.isArray(L)?L[0]?.flag_url:L?.flag_url)||a.flag_url||`assets/flags/${a.name}.png`,R=k(a.government_type),U=O(a),F=$.has(a.id),N=[...c].sort((s,m)=>(m.seats||0)-(s.seats||0)),j=c.reduce((s,m)=>s+(m.seats||0),0),q=N.filter(s=>s.seats>0).map((s,m)=>{const w=(s.seats/g*100).toFixed(1),x=s.party_color||u[m%u.length];return`<div class="seat-bar__segment" style="width:${w}%;background:${x};" title="${y(s.faction_name)}: ${s.seats} seats"></div>`}).join(""),D=N.filter(s=>s.seats>0).map((s,m)=>`<span class="seat-legend-item"><span class="seat-legend-dot" style="background:${s.party_color||u[m%u.length]};"></span>${y(s.abbreviation||"?")} ${s.seats}</span>`).join(""),M=N.map((s,m)=>{const w=s.party_color||u[m%u.length],x=i[s.id],B=s.ideology_value_1&&s.ideology_value_2?`${s.ideology_value_1}, ${s.ideology_value_2}`:V(x);return`
        <div class="party-row">
          <span class="party-row__dot" style="background:${w};"></span>
          <span class="party-row__name">${y(s.faction_name)}</span>
          <span class="party-row__abbr">${y(s.abbreviation||"?")}</span>
          ${B?`<span class="party-row__ideo">${Q(B)}</span>`:""}
          <span class="party-row__seats">${s.seats||0}</span>
        </div>
      `}).join(""),H=n.length>0?n.map(s=>`
        <div class="crisis-row">
          <span class="crisis-pip"></span>
          <span class="crisis-name">${y(s.crisis_templates?.name||"Unknown Crisis")}</span>
        </div>
      `).join(""):'<div class="no-crisis">No active crises</div>';return`
      <div class="nation-card ${b?"disabled":""}" data-nation-id="${a.id}" onclick="${b?"":"selectNation('"+a.id+"')"}">
        <div class="nation-card__header">
          ${S?`<img class="nation-card__flag" src="${S}" alt="${y(a.name)}" onerror="this.style.display='none'">`:""}
          <span class="nation-card__name">${y(a.name)}${F?'<span class="alpha-badge">Alpha</span>':""}</span>
          <span class="nation-card__gov-type ${R}">${U}</span>
        </div>
        <div class="nation-card__body">
          <div class="stat-row">
            <span class="stat-row__label">Total Seats</span>
            <span class="stat-row__value" style="color:var(--text-secondary);">${g}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Factions</span>
            <span class="stat-row__value" style="color:${b?"var(--red)":"var(--text-secondary)"};">${E}${" / "+h}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Stability</span>
            <span class="stat-row__value" style="color:${(a.stability||50)>=60?"var(--green)":(a.stability||50)>=40?"var(--amber)":"var(--red)"};">${a.stability||50}</span>
          </div>

          ${c.some(s=>s.seats>0)?`
          <div class="seat-bar">
            <div class="seat-bar__label">Seat Distribution</div>
            <div class="seat-bar__track">
              ${q}
              ${j<g?'<div class="seat-bar__empty"></div>':""}
            </div>
            <div class="seat-bar__legend">${D}</div>
          </div>
          `:""}

          ${c.length>0?`
          <div class="party-list">
            <div class="party-list__header">Factions &mdash; ${E}</div>
            ${M}
          </div>
          `:'<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-ghost);padding:6px 0;">No factions yet — be the first</div>'}

          <div class="crisis-section">
            <div class="party-list__header">Active Crises</div>
            ${H}
          </div>
        </div>
        <div class="nation-card__footer">
          <span class="join-label">${b?"NATION FULL":"JOIN THIS NATION"}</span>
          ${b?"":'<span class="join-arrow">&#x25B6;</span>'}
        </div>
      </div>
    `}).join("")}function W(e){v=e;const t=C.find(h=>h.id===e);if(!t)return;document.getElementById("modal-nation-name").textContent=t.name;const o=document.getElementById("modal-gov-badge"),i=k(t.government_type),l=O(t);o.className="modal__gov-badge "+i,o.textContent=l;const r=document.getElementById("modal-flow-hint");r.textContent="You will choose your ideology, then name and customize your party.";const a=document.getElementById("alpha-code-section"),c=document.getElementById("alpha-code-input"),n=document.getElementById("alpha-code-error"),g=$.has(e);a.classList.toggle("visible",g),c.value="",n.style.display="none",document.getElementById("modal-overlay").classList.add("active"),g&&c.focus()}function X(){document.getElementById("modal-overlay").classList.remove("active"),v=null,p=!1}let p=!1;async function Z(){if(p||!v)return;const e=C.find(o=>o.id===v);if(!e)return;if(p=!0,$.has(v)){const o=document.getElementById("alpha-code-input"),i=document.getElementById("alpha-code-error"),l=o.value.trim().toUpperCase();if(!l){i.textContent="Please enter your alpha tester code.",i.style.display="block",o.focus(),p=!1;return}const r=document.getElementById("modal-confirm-btn");r.disabled=!0,r.textContent="VALIDATING...";const{data:a,error:c}=await d.from("alpha_tester_codes").select("id, used_by").eq("code",l).eq("nation_id",v).maybeSingle();if(c||!a||a.used_by){i.textContent=a?.used_by?"This code has already been used.":"Invalid or already used code.",i.style.display="block",r.disabled=!1,r.textContent="CONTINUE",p=!1,o.focus();return}const{data:n,error:g}=await d.from("alpha_tester_codes").update({used_by:A.id,used_at:new Date().toISOString()}).eq("id",a.id).is("used_by",null).select("id");if(g||!n||n.length===0){i.textContent="Code was already claimed. Please try a different code.",i.style.display="block",r.disabled=!1,r.textContent="CONTINUE",p=!1;return}r.disabled=!1,r.textContent="CONTINUE"}sessionStorage.setItem("nationhood_pending_nation",JSON.stringify({id:e.id,name:e.name,government_type:e.government_type})),window.location.href="faction-select.html"}Y();window.selectNation=W;window.closeModal=X;window.confirmNation=Z;async function ee(){await d.auth.signOut(),sessionStorage.clear(),window.location.href="login.html"}window.logoutUser=ee;window.switchContinent=J;function te(){const e=document.body.classList.toggle("light-mode");localStorage.setItem("nationhood_theme",e?"light":"dark");const t=document.getElementById("theme-toggle");t&&(t.textContent=e?"Dark":"Light")}window.toggleTheme=te;(function(){if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}})();
