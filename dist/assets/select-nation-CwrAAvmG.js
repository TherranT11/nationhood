import{_ as m}from"./supabase-client-BXEzLDpS.js";import{c as G,e as g}from"./utils-C2W-HleY.js";const H={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia1.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png"},f=["#5b9bd5","#d48a3c","#5aafa5","#8b7ec8","#5cb85c","#d9534f","#c8a64e"],Y={Liberty:"#3b82f6",Equality:"#ef4444",Tradition:"#a855f7",Progress:"#22c55e",Security:"#f59e0b",Freedom:"#06b6d4",Globalism:"#14b8a6",Nationalism:"#f97316",Individualism:"#eab308",Collectivism:"#ec4899"};let B=null,C=[],v=null,T="Crucera",y={},u={},I={};const S=new Set;async function J(){try{const{data:{user:e}}=await m.auth.getUser();if(!e){window.location.href="login.html";return}B=e;const{data:t}=await m.from("factions").select("id, nation_id, faction_type").eq("id",e.id).maybeSingle();if(t&&t.nation_id){window.location.href="dashboard.html";return}if(sessionStorage.getItem("pending_faction_type")==="corp"){window.location.href="corp-setup.html";return}await V(),document.getElementById("loading").style.display="none";const n=document.getElementById("page-content");n.style.display="flex"}catch(e){document.getElementById("loading").textContent="FAILED TO LOAD — PLEASE REFRESH";const t=document.getElementById("error-message");t&&(t.textContent=e.message||"Unknown error",t.style.display="block")}}function K(e){T=e,document.querySelectorAll(".continent-tab").forEach(t=>{t.classList.toggle("active",t.dataset.continent===e)}),O(C,y,u,I)}async function V(){const[e,t,n,i]=await Promise.all([m.from("nations").select("*, nation_profiles(flag_url)"),m.from("factions").select("id, faction_type, faction_name, abbreviation, seats, nation_id, party_color, ideology_value_1, ideology_value_2").eq("faction_type","party"),m.from("active_crises").select("nation_id, crisis_id, crisis_templates(name)"),m.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism")]),r=e.data||[],l=t.data||[],s=n.data||[],c=i.data||[];y={},u={},I={};for(const o of l)y[o.nation_id]||(y[o.nation_id]=[]),y[o.nation_id].push(o);for(const o of s)u[o.nation_id]||(u[o.nation_id]=[]),u[o.nation_id].push(o);for(const o of c)I[o.faction_id]=o;C=r,O(r,y,u,I)}function k(e){return e==="Presidential"?"gov-presidential":"gov-democracy"}function P(e){const t=typeof e=="string"?e:e?.government_type,n=typeof e=="object"?e?.hos_election_method:null;return t==="Presidential"?"PRESIDENTIAL":n==="hereditary"?"CONSTITUTIONAL MONARCHY":"PARLIAMENTARY"}function Q(e){if(!e)return"";const t=[{key:"liberty_equality",neg:"Liberty",pos:"Equality"},{key:"tradition_progress",neg:"Tradition",pos:"Progress"},{key:"security_freedom",neg:"Security",pos:"Freedom"},{key:"globalism_nationalism",neg:"Globalism",pos:"Nationalism"},{key:"individualism_collectivism",neg:"Individualism",pos:"Collectivism"}],n=[];for(const i of t){const r=e[i.key]||0;Math.abs(r)>=20&&n.push(r<0?i.neg:i.pos)}return n.slice(0,2).join(", ")}function W(e){return e?e.split(", ").map(t=>{const n=Y[t];return n?`<span style="color:${n}">${g(t)}</span>`:g(t)}).join('<span style="color:var(--text-dim)">, </span>'):""}function O(e,t,n,i){const r=document.getElementById("nations-grid"),l=e.filter(s=>(s.continent||"Crucera")===T);if(l.length===0){r.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}r.innerHTML=l.map(s=>{const c=t[s.id]||[],o=n[s.id]||[],p=s.total_seats||100,b=s.max_parties||8,$=G(c,s.id),h=$>=b,E=s.nation_profiles,x=(Array.isArray(E)?E[0]?.flag_url:E?.flag_url)||s.flag_url||H[s.name]||`assets/flags/${s.name}.png`,F=k(s.government_type),R=P(s),U=S.has(s.id),L=[...c].sort((a,d)=>(d.seats||0)-(a.seats||0)),q=c.reduce((a,d)=>a+(d.seats||0),0),M=L.filter(a=>a.seats>0).map((a,d)=>{const w=(a.seats/p*100).toFixed(1),N=a.party_color||f[d%f.length];return`<div class="seat-bar__segment" style="width:${w}%;background:${N};" title="${g(a.faction_name)}: ${a.seats} seats"></div>`}).join(""),j=L.filter(a=>a.seats>0).map((a,d)=>`<span class="seat-legend-item"><span class="seat-legend-dot" style="background:${a.party_color||f[d%f.length]};"></span>${g(a.abbreviation||"?")} ${a.seats}</span>`).join(""),D=L.map((a,d)=>{const w=a.party_color||f[d%f.length],N=i[a.id],A=a.ideology_value_1&&a.ideology_value_2?`${a.ideology_value_1}, ${a.ideology_value_2}`:Q(N);return`
        <div class="party-row">
          <span class="party-row__dot" style="background:${w};"></span>
          <span class="party-row__name">${g(a.faction_name)}</span>
          <span class="party-row__abbr">${g(a.abbreviation||"?")}</span>
          ${A?`<span class="party-row__ideo">${W(A)}</span>`:""}
          <span class="party-row__seats">${a.seats||0}</span>
        </div>
      `}).join(""),z=o.length>0?o.map(a=>`
        <div class="crisis-row">
          <span class="crisis-pip"></span>
          <span class="crisis-name">${g(a.crisis_templates?.name||"Unknown Crisis")}</span>
        </div>
      `).join(""):'<div class="no-crisis">No active crises</div>';return`
      <div class="nation-card ${h?"disabled":""}" data-nation-id="${s.id}" onclick="${h?"":"selectNation('"+s.id+"')"}">
        <div class="nation-card__header">
          ${x?`<img class="nation-card__flag" src="${x}" alt="${g(s.name)}" onerror="this.style.display='none'">`:""}
          <span class="nation-card__name">${g(s.name)}${U?'<span class="alpha-badge">Alpha</span>':""}</span>
          <span class="nation-card__gov-type ${F}">${R}</span>
        </div>
        <div class="nation-card__body">
          <div class="stat-row">
            <span class="stat-row__label">Total Seats</span>
            <span class="stat-row__value" style="color:var(--text-secondary);">${p}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Factions</span>
            <span class="stat-row__value" style="color:${h?"var(--red)":"var(--text-secondary)"};">${$}${" / "+b}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Stability</span>
            <span class="stat-row__value" style="color:${(s.stability||50)>=60?"var(--green)":(s.stability||50)>=40?"var(--amber)":"var(--red)"};">${s.stability||50}</span>
          </div>

          ${c.some(a=>a.seats>0)?`
          <div class="seat-bar">
            <div class="seat-bar__label">Seat Distribution</div>
            <div class="seat-bar__track">
              ${M}
              ${q<p?'<div class="seat-bar__empty"></div>':""}
            </div>
            <div class="seat-bar__legend">${j}</div>
          </div>
          `:""}

          ${c.length>0?`
          <div class="party-list">
            <div class="party-list__header">Factions &mdash; ${$}</div>
            ${D}
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
    `}).join("")}function X(e){v=e;const t=C.find(b=>b.id===e);if(!t)return;document.getElementById("modal-nation-name").textContent=t.name;const n=document.getElementById("modal-gov-badge"),i=k(t.government_type),r=P(t);n.className="modal__gov-badge "+i,n.textContent=r;const l=document.getElementById("modal-flow-hint");l.textContent="You will choose your ideology, then name and customize your party.";const s=document.getElementById("alpha-code-section"),c=document.getElementById("alpha-code-input"),o=document.getElementById("alpha-code-error"),p=S.has(e);s.classList.toggle("visible",p),c.value="",o.style.display="none",document.getElementById("modal-overlay").classList.add("active"),p&&c.focus()}function Z(){document.getElementById("modal-overlay").classList.remove("active"),v=null,_=!1}let _=!1;async function ee(){if(_||!v)return;const e=C.find(n=>n.id===v);if(!e)return;if(_=!0,S.has(v)){const n=document.getElementById("alpha-code-input"),i=document.getElementById("alpha-code-error"),r=n.value.trim().toUpperCase();if(!r){i.textContent="Please enter your alpha tester code.",i.style.display="block",n.focus(),_=!1;return}const l=document.getElementById("modal-confirm-btn");l.disabled=!0,l.textContent="VALIDATING...";const{data:s,error:c}=await m.from("alpha_tester_codes").select("id, used_by").eq("code",r).eq("nation_id",v).maybeSingle();if(c||!s||s.used_by){i.textContent=s?.used_by?"This code has already been used.":"Invalid or already used code.",i.style.display="block",l.disabled=!1,l.textContent="CONTINUE",_=!1,n.focus();return}const{data:o,error:p}=await m.from("alpha_tester_codes").update({used_by:B.id,used_at:new Date().toISOString()}).eq("id",s.id).is("used_by",null).select("id");if(p||!o||o.length===0){i.textContent="Code was already claimed. Please try a different code.",i.style.display="block",l.disabled=!1,l.textContent="CONTINUE",_=!1;return}l.disabled=!1,l.textContent="CONTINUE"}sessionStorage.setItem("nationhood_pending_nation",JSON.stringify({id:e.id,name:e.name,government_type:e.government_type})),window.location.href="faction-select.html"}J();window.selectNation=X;window.closeModal=Z;window.confirmNation=ee;async function te(){await m.auth.signOut(),sessionStorage.clear(),window.location.href="login.html"}window.logoutUser=te;window.switchContinent=K;function se(){const e=document.body.classList.toggle("light-mode");localStorage.setItem("nationhood_theme",e?"light":"dark");const t=document.getElementById("theme-toggle");t&&(t.textContent=e?"Dark":"Light")}window.toggleTheme=se;(function(){if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}})();
