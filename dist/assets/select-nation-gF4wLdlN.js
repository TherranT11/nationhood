import{_ as d}from"./supabase-client-BXEzLDpS.js";import{c as G,e as y}from"./utils-C2W-HleY.js";const _=["#5b9bd5","#d48a3c","#5aafa5","#8b7ec8","#5cb85c","#d9534f","#c8a64e"],z={Liberty:"#3b82f6",Equality:"#ef4444",Tradition:"#a855f7",Progress:"#22c55e",Security:"#f59e0b",Freedom:"#06b6d4",Globalism:"#14b8a6",Nationalism:"#f97316",Individualism:"#eab308",Collectivism:"#ec4899"};let B=null,I=[],v=null,T="Crucera",u={},f={},$={};const C=new Set;async function Y(){try{const{data:{user:e}}=await d.auth.getUser();if(!e){window.location.href="login.html";return}B=e;const{data:a}=await d.from("factions").select("id, nation_id, faction_type").eq("id",e.id).maybeSingle();if(a&&a.nation_id){window.location.href="dashboard.html";return}if(sessionStorage.getItem("pending_faction_type")==="corp"){window.location.href="corp-setup.html";return}const{data:n}=await d.from("alpha_tester_codes").select("nation_id").is("used_by",null);if(n)for(const l of n)C.add(l.nation_id);await K(),document.getElementById("loading").style.display="none";const i=document.getElementById("page-content");i.style.display="flex"}catch(e){document.getElementById("loading").textContent="FAILED TO LOAD — PLEASE REFRESH";const a=document.getElementById("error-message");a&&(a.textContent=e.message||"Unknown error",a.style.display="block")}}function J(e){T=e,document.querySelectorAll(".continent-tab").forEach(a=>{a.classList.toggle("active",a.dataset.continent===e)}),P(I,u,f,$)}async function K(){const[e,a,n,i]=await Promise.all([d.from("nations").select("*, nation_profiles(flag_url)"),d.from("factions").select("id, faction_type, faction_name, abbreviation, seats, nation_id, party_color, ideology_value_1, ideology_value_2").eq("faction_type","party"),d.from("active_crises").select("nation_id, crisis_id, crisis_templates(name)"),d.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism")]),l=e.data||[],r=a.data||[],s=n.data||[],c=i.data||[];u={},f={},$={};for(const o of r)u[o.nation_id]||(u[o.nation_id]=[]),u[o.nation_id].push(o);for(const o of s)f[o.nation_id]||(f[o.nation_id]=[]),f[o.nation_id].push(o);for(const o of c)$[o.faction_id]=o;I=l,P(l,u,f,$)}function O(e){return e==="Presidential"?"gov-presidential":"gov-democracy"}function k(e){const a=typeof e=="string"?e:e?.government_type,n=typeof e=="object"?e?.hos_election_method:null;return a==="Presidential"?"PRESIDENTIAL":n==="hereditary"?"CONSTITUTIONAL MONARCHY":"PARLIAMENTARY"}function V(e){if(!e)return"";const a=[{key:"liberty_equality",neg:"Liberty",pos:"Equality"},{key:"tradition_progress",neg:"Tradition",pos:"Progress"},{key:"security_freedom",neg:"Security",pos:"Freedom"},{key:"globalism_nationalism",neg:"Globalism",pos:"Nationalism"},{key:"individualism_collectivism",neg:"Individualism",pos:"Collectivism"}],n=[];for(const i of a){const l=e[i.key]||0;Math.abs(l)>=20&&n.push(l<0?i.neg:i.pos)}return n.slice(0,2).join(", ")}function Q(e){return e?e.split(", ").map(a=>{const n=z[a];return n?`<span style="color:${n}">${y(a)}</span>`:y(a)}).join('<span style="color:var(--text-dim)">, </span>'):""}function P(e,a,n,i){const l=document.getElementById("nations-grid"),r=e.filter(s=>(s.continent||"Crucera")===T);if(r.length===0){l.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}l.innerHTML=r.map(s=>{const c=a[s.id]||[],o=n[s.id]||[],p=s.total_seats||100,h=s.max_parties||8,E=G(c,s.id),b=E>=h,N=s.nation_profiles,S=(Array.isArray(N)?N[0]?.flag_url:N?.flag_url)||s.flag_url||`assets/flags/${s.name}.png`,R=O(s.government_type),U=k(s),F=C.has(s.id),L=[...c].sort((t,m)=>(m.seats||0)-(t.seats||0)),j=c.reduce((t,m)=>t+(m.seats||0),0),q=L.filter(t=>t.seats>0).map((t,m)=>{const w=(t.seats/p*100).toFixed(1),x=t.party_color||_[m%_.length];return`<div class="seat-bar__segment" style="width:${w}%;background:${x};" title="${y(t.faction_name)}: ${t.seats} seats"></div>`}).join(""),D=L.filter(t=>t.seats>0).map((t,m)=>`<span class="seat-legend-item"><span class="seat-legend-dot" style="background:${t.party_color||_[m%_.length]};"></span>${y(t.abbreviation||"?")} ${t.seats}</span>`).join(""),M=L.map((t,m)=>{const w=t.party_color||_[m%_.length],x=i[t.id],A=t.ideology_value_1&&t.ideology_value_2?`${t.ideology_value_1}, ${t.ideology_value_2}`:V(x);return`
        <div class="party-row">
          <span class="party-row__dot" style="background:${w};"></span>
          <span class="party-row__name">${y(t.faction_name)}</span>
          <span class="party-row__abbr">${y(t.abbreviation||"?")}</span>
          ${A?`<span class="party-row__ideo">${Q(A)}</span>`:""}
          <span class="party-row__seats">${t.seats||0}</span>
        </div>
      `}).join(""),H=o.length>0?o.map(t=>`
        <div class="crisis-row">
          <span class="crisis-pip"></span>
          <span class="crisis-name">${y(t.crisis_templates?.name||"Unknown Crisis")}</span>
        </div>
      `).join(""):'<div class="no-crisis">No active crises</div>';return`
      <div class="nation-card ${b?"disabled":""}" data-nation-id="${s.id}" onclick="${b?"":"selectNation('"+s.id+"')"}">
        <div class="nation-card__header">
          ${S?`<img class="nation-card__flag" src="${S}" alt="${y(s.name)}" onerror="this.style.display='none'">`:""}
          <span class="nation-card__name">${y(s.name)}${F?'<span class="alpha-badge">Alpha</span>':""}</span>
          <span class="nation-card__gov-type ${R}">${U}</span>
        </div>
        <div class="nation-card__body">
          <div class="stat-row">
            <span class="stat-row__label">Total Seats</span>
            <span class="stat-row__value" style="color:var(--text-secondary);">${p}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Factions</span>
            <span class="stat-row__value" style="color:${b?"var(--red)":"var(--text-secondary)"};">${E}${" / "+h}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Stability</span>
            <span class="stat-row__value" style="color:${(s.stability||50)>=60?"var(--green)":(s.stability||50)>=40?"var(--amber)":"var(--red)"};">${s.stability||50}</span>
          </div>

          ${c.some(t=>t.seats>0)?`
          <div class="seat-bar">
            <div class="seat-bar__label">Seat Distribution</div>
            <div class="seat-bar__track">
              ${q}
              ${j<p?'<div class="seat-bar__empty"></div>':""}
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
    `}).join("")}function W(e){v=e;const a=I.find(h=>h.id===e);if(!a)return;document.getElementById("modal-nation-name").textContent=a.name;const n=document.getElementById("modal-gov-badge"),i=O(a.government_type),l=k(a);n.className="modal__gov-badge "+i,n.textContent=l;const r=document.getElementById("modal-flow-hint");r.textContent="You will choose your ideology, then name and customize your party.";const s=document.getElementById("alpha-code-section"),c=document.getElementById("alpha-code-input"),o=document.getElementById("alpha-code-error"),p=C.has(e);s.classList.toggle("visible",p),c.value="",o.style.display="none",document.getElementById("modal-overlay").classList.add("active"),p&&c.focus()}function X(){document.getElementById("modal-overlay").classList.remove("active"),v=null,g=!1}let g=!1;async function Z(){if(g||!v)return;const e=I.find(n=>n.id===v);if(!e)return;if(g=!0,C.has(v)){const n=document.getElementById("alpha-code-input"),i=document.getElementById("alpha-code-error"),l=n.value.trim().toUpperCase();if(!l){i.textContent="Please enter your alpha tester code.",i.style.display="block",n.focus(),g=!1;return}const r=document.getElementById("modal-confirm-btn");r.disabled=!0,r.textContent="VALIDATING...";const{data:s,error:c}=await d.from("alpha_tester_codes").select("id, used_by").eq("code",l).eq("nation_id",v).maybeSingle();if(c||!s||s.used_by){i.textContent=s?.used_by?"This code has already been used.":"Invalid or already used code.",i.style.display="block",r.disabled=!1,r.textContent="CONTINUE",g=!1,n.focus();return}const{data:o,error:p}=await d.from("alpha_tester_codes").update({used_by:B.id,used_at:new Date().toISOString()}).eq("id",s.id).is("used_by",null).select("id");if(p||!o||o.length===0){i.textContent="Code was already claimed. Please try a different code.",i.style.display="block",r.disabled=!1,r.textContent="CONTINUE",g=!1;return}r.disabled=!1,r.textContent="CONTINUE"}sessionStorage.setItem("nationhood_pending_nation",JSON.stringify({id:e.id,name:e.name,government_type:e.government_type})),window.location.href="faction-select.html"}Y();window.selectNation=W;window.closeModal=X;window.confirmNation=Z;async function ee(){await d.auth.signOut(),sessionStorage.clear(),window.location.href="login.html"}window.logoutUser=ee;window.switchContinent=J;
