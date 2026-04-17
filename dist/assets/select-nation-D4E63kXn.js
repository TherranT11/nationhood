import{_supabase as g}from"./supabase-client-CiYoFhIh.js";import{c as x,e as m}from"./utils-CY90Gazr.js";const V={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png",Sierramar:"assets/flags/Sierramar.png",Hajjara:"assets/flags/Hajjara.png"},B={Melizea:"A parliamentary republic with a diverse economy. Analogous to Colombia.",Sangreza:"A parliamentary democracy with strong traditions. Analogous to Spain.","San Estrella":"A presidential republic with a growing economy. Analogous to Mexico.",Palvera:"A presidential nation rich in natural resources. Analogous to Venezuela.",Montequilla:"A parliamentary republic with a service-driven economy. Analogous to Argentina.",Avelia:"A semi-presidential republic blending Spanish and Italian culture. Analogous to Italy.",Calveth:"A parliamentary democracy with strong social systems. Analogous to Denmark.",Flandis:"A parliamentary democracy with a trade-focused economy. Analogous to the Netherlands.",Vostia:"A parliamentary nation with a complex political landscape. Analogous to Serbia.",Sierramar:"A small Caribbean island democracy with a young, religious population. Analogous to Puerto Rico.",Hajjara:"A vast desert monarchy ruled by an absolute king, rich in oil and gas with deep Islamic traditions. Analogous to Iran."},v=["#5b9bd5","#d48a3c","#5aafa5","#8b7ec8","#5cb85c","#d9534f","#c8a64e"],Y={Liberty:"#3b82f6",Equality:"#ef4444",Tradition:"#a855f7",Progress:"#22c55e",Security:"#f59e0b",Freedom:"#06b6d4",Globalism:"#14b8a6",Nationalism:"#f97316",Individualism:"#eab308",Collectivism:"#ec4899"};let N=null,C=[],f=null,T="Crucera",h={},b={},A={};const L=new Set;async function J(){try{const{data:{user:e}}=await g.auth.getUser();if(!e){window.location.href="login.html";return}if(N=e,sessionStorage.getItem("pending_faction_type")==="corp"){window.location.href="corp-setup.html";return}const a=sessionStorage.getItem("pending_faction_type")==="party",{data:n}=await g.from("factions").select("id, nation_id, faction_type").eq("id",e.id).maybeSingle();if(n&&n.nation_id&&!(a&&n.faction_type==="corporation")){window.location.href="dashboard.html";return}await Q(),document.getElementById("loading").style.display="none";const o=document.getElementById("page-content");o.style.display="flex"}catch(e){document.getElementById("loading").textContent="FAILED TO LOAD — PLEASE REFRESH";const a=document.getElementById("error-message");a&&(a.textContent=e.message||"Unknown error",a.style.display="block")}}function K(e){T=e,document.querySelectorAll(".continent-tab").forEach(a=>{a.classList.toggle("active",a.dataset.continent===e)}),R(C,h,b,A)}async function Q(){const[e,a,n,o]=await Promise.all([g.from("nations").select("*, nation_profiles(flag_url)"),g.from("factions").select("id, faction_type, faction_name, abbreviation, seats, nation_id, party_color, ideology_value_1, ideology_value_2").eq("faction_type","party"),g.from("active_crises").select("nation_id, crisis_id, crisis_templates(name)"),g.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism")]),r=e.data||[],d=a.data||[],t=n.data||[],l=o.data||[];h={},b={},A={};for(const i of d)h[i.nation_id]||(h[i.nation_id]=[]),h[i.nation_id].push(i);for(const i of t)b[i.nation_id]||(b[i.nation_id]=[]),b[i.nation_id].push(i);for(const i of l)A[i.faction_id]=i;C=r,R(r,h,b,A)}function F(e){return e==="Presidential"||e==="Semi-Presidential"?"gov-presidential":"gov-democracy"}function O(e){const a=typeof e=="string"?e:e?.government_type,n=typeof e=="object"?e?.hos_election_method:null;return a==="Presidential"?"PRESIDENTIAL":a==="Semi-Presidential"?"SEMI-PRESIDENTIAL":n==="hereditary"?"CONSTITUTIONAL MONARCHY":"PARLIAMENTARY"}function W(e){if(!e)return"";const a=[{key:"liberty_equality",neg:"Liberty",pos:"Equality"},{key:"tradition_progress",neg:"Tradition",pos:"Progress"},{key:"security_freedom",neg:"Security",pos:"Freedom"},{key:"globalism_nationalism",neg:"Globalism",pos:"Nationalism"},{key:"individualism_collectivism",neg:"Individualism",pos:"Collectivism"}],n=[];for(const o of a){const r=e[o.key]||0;Math.abs(r)>=20&&n.push(r<0?o.neg:o.pos)}return n.slice(0,2).join(", ")}function X(e){return e?e.split(", ").map(a=>{const n=Y[a];return n?`<span style="color:${n}">${m(a)}</span>`:m(a)}).join('<span style="color:var(--text-dim)">, </span>'):""}function R(e,a,n,o){const r=document.getElementById("nations-grid"),d=e.filter(t=>(t.continent||"Crucera")===T);if(d.sort((t,l)=>{const i=x(a[t.id]||[],t.id),c=x(a[l.id]||[],l.id),p=i>=(t.max_parties||8)?1:0,_=c>=(l.max_parties||8)?1:0;return p!==_?p-_:(t.name||"").localeCompare(l.name||"")}),d.length===0){r.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}r.innerHTML=d.map(t=>{const l=a[t.id]||[],i=n[t.id]||[],c=t.total_seats||100,p=t.max_parties||8,_=x(l,t.id),w=_>=p,S=t.nation_profiles,P=(Array.isArray(S)?S[0]?.flag_url:S?.flag_url)||t.flag_url||V[t.name]||`assets/flags/${t.name}.png`,q=F(t.government_type),j=O(t),M=L.has(t.id),E=[...l].sort((s,u)=>(u.seats||0)-(s.seats||0)),U=l.reduce((s,u)=>s+(u.seats||0),0),z=E.filter(s=>s.seats>0).map((s,u)=>{const I=(s.seats/c*100).toFixed(1),$=s.party_color||v[u%v.length];return`<div class="seat-bar__segment" style="width:${I}%;background:${$};" title="${m(s.faction_name)}: ${s.seats} seats"></div>`}).join(""),D=E.filter(s=>s.seats>0).map((s,u)=>`<span class="seat-legend-item"><span class="seat-legend-dot" style="background:${s.party_color||v[u%v.length]};"></span>${m(s.abbreviation||"?")} ${s.seats}</span>`).join(""),H=E.map((s,u)=>{const I=s.party_color||v[u%v.length],$=o[s.id],k=s.ideology_value_1&&s.ideology_value_2?`${s.ideology_value_1}, ${s.ideology_value_2}`:W($);return`
        <div class="party-row">
          <span class="party-row__dot" style="background:${I};"></span>
          <span class="party-row__name">${m(s.faction_name)}</span>
          <span class="party-row__abbr">${m(s.abbreviation||"?")}</span>
          ${k?`<span class="party-row__ideo">${X(k)}</span>`:""}
          <span class="party-row__seats">${s.seats||0}</span>
        </div>
      `}).join(""),G=i.length>0?i.map(s=>`
        <div class="crisis-row">
          <span class="crisis-pip"></span>
          <span class="crisis-name">${m(s.crisis_templates?.name||"Unknown Crisis")}</span>
        </div>
      `).join(""):'<div class="no-crisis">No active crises</div>';return`
      <div class="nation-card ${w?"disabled":""}" data-nation-id="${t.id}" onclick="${w?"":"selectNation('"+t.id+"')"}">
        <div class="nation-card__header">
          ${P?`<img class="nation-card__flag" src="${P}" alt="${m(t.name)}" onerror="this.style.display='none'">`:""}
          <span class="nation-card__name">${m(t.name)}${M?'<span class="alpha-badge">Alpha</span>':""}</span>
          <span class="nation-card__gov-type ${q}">${j}</span>
        </div>
        <div class="nation-card__body">
          ${B[t.name]?`<div style="font-size:10px;color:var(--text-dim);line-height:1.5;margin-bottom:8px;font-style:italic;">${m(B[t.name])}</div>`:""}
          <div class="stat-row">
            <span class="stat-row__label">Total Seats</span>
            <span class="stat-row__value" style="color:var(--text-secondary);">${c}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Factions</span>
            <span class="stat-row__value" style="color:${w?"var(--red)":"var(--text-secondary)"};">${_}${" / "+p}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Stability</span>
            <span class="stat-row__value" style="color:${(t.stability??50)>=60?"var(--green)":(t.stability??50)>=40?"var(--amber)":"var(--red)"};">${Number(t.stability??50).toFixed(1)}</span>
          </div>

          ${l.some(s=>s.seats>0)?`
          <div class="seat-bar">
            <div class="seat-bar__label">Seat Distribution</div>
            <div class="seat-bar__track">
              ${z}
              ${U<c?'<div class="seat-bar__empty"></div>':""}
            </div>
            <div class="seat-bar__legend">${D}</div>
          </div>
          `:""}

          ${l.length>0?`
          <div class="party-list">
            <div class="party-list__header">Factions &mdash; ${_}</div>
            ${H}
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
    `}).join("")}function Z(e){f=e;const a=C.find(p=>p.id===e);if(!a)return;document.getElementById("modal-nation-name").textContent=a.name;const n=document.getElementById("modal-gov-badge"),o=F(a.government_type),r=O(a);n.className="modal__gov-badge "+o,n.textContent=r;const d=document.getElementById("modal-flow-hint");d.textContent="You will choose your ideology, then name and customize your party.";const t=document.getElementById("alpha-code-section"),l=document.getElementById("alpha-code-input"),i=document.getElementById("alpha-code-error"),c=L.has(e);t.classList.toggle("visible",c),l.value="",i.style.display="none",document.getElementById("modal-overlay").classList.add("active"),c&&l.focus()}function ee(){document.getElementById("modal-overlay").classList.remove("active"),f=null,y=!1}let y=!1;async function te(){if(y||!f)return;const e=C.find(o=>o.id===f);if(!e)return;if(y=!0,L.has(f)){const o=document.getElementById("alpha-code-input"),r=document.getElementById("alpha-code-error"),d=o.value.trim().toUpperCase();if(!d){r.textContent="Please enter your alpha tester code.",r.style.display="block",o.focus(),y=!1;return}const t=document.getElementById("modal-confirm-btn");t.disabled=!0,t.textContent="VALIDATING...";const{data:l,error:i}=await g.from("alpha_tester_codes").select("id, used_by").eq("code",d).eq("nation_id",f).maybeSingle();if(i||!l||l.used_by){r.textContent=l?.used_by?"This code has already been used.":"Invalid or already used code.",r.style.display="block",t.disabled=!1,t.textContent="CONTINUE",y=!1,o.focus();return}const{data:c,error:p}=await g.from("alpha_tester_codes").update({used_by:N.id,used_at:new Date().toISOString()}).eq("id",l.id).is("used_by",null).select("id");if(p||!c||c.length===0){r.textContent="Code was already claimed. Please try a different code.",r.style.display="block",t.disabled=!1,t.textContent="CONTINUE",y=!1;return}t.disabled=!1,t.textContent="CONTINUE"}const{data:n}=await g.from("factions").select("id, faction_name").eq("linked_user_id",N.id).eq("faction_type","corporation").eq("nation_id",f).is("abandoned_at",null).maybeSingle();if(n){const o=document.getElementById("alpha-code-error")||document.createElement("div");o.id||(o.id="corp-nation-error",o.style.cssText="font-family:var(--font-mono);font-size:10px;color:#d9534f;margin-top:8px;",document.querySelector(".modal-body")?.appendChild(o)),o.textContent=`Your corporation "${n.faction_name}" is in ${e.name}. Political parties cannot operate in the same nation as your corporation.`,o.style.display="block",y=!1;return}sessionStorage.setItem("nationhood_pending_nation",JSON.stringify({id:e.id,name:e.name,government_type:e.government_type})),window.location.href="faction-select.html"}J();window.selectNation=Z;window.closeModal=ee;window.confirmNation=te;async function ae(){await g.auth.signOut(),sessionStorage.clear(),window.location.href="login.html"}window.logoutUser=ae;window.switchContinent=K;function se(){const e=document.body.classList.toggle("light-mode");localStorage.setItem("nationhood_theme",e?"light":"dark");const a=document.getElementById("theme-toggle");a&&(a.textContent=e?"Dark":"Light")}window.toggleTheme=se;(function(){if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}})();
