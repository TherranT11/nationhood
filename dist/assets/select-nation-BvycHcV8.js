import{_supabase as g}from"./supabase-client-CiYoFhIh.js";import{c as S,e as u}from"./utils-DGqmZD5X.js";const z={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png",Sierramar:"assets/flags/Sierramar.png",Hajjara:"assets/flags/Hajjara.png",Dravka:"assets/flags/Dravka.png",Danwei:"assets/flags/Danwei.png"},N={Melizea:"A parliamentary republic with a diverse economy. Analogous to Colombia.",Sangreza:"A parliamentary democracy with strong traditions. Analogous to Spain.","San Estrella":"A presidential republic with a growing economy. Analogous to Mexico.",Palvera:"A presidential nation rich in natural resources. Analogous to Venezuela.",Montequilla:"A parliamentary republic with a service-driven economy. Analogous to Argentina.",Avelia:"A semi-presidential republic blending Spanish and Italian culture. Analogous to Italy.",Calveth:"A parliamentary democracy with strong social systems. Analogous to Denmark.",Flandis:"A parliamentary democracy with a trade-focused economy. Analogous to the Netherlands.",Vostia:"A parliamentary nation with a complex political landscape. Analogous to Serbia.",Sierramar:"A small Caribbean island democracy with a young, religious population. Analogous to Puerto Rico.",Hajjara:"A vast desert monarchy ruled by an absolute king, rich in oil and gas with deep Islamic traditions. Analogous to Iran.",Dravka:"Dravka is analogous culturally to Albania.",Danwei:"This island nation in Faresia is analogous to real world Taiwan."},_=["#5b9bd5","#d48a3c","#5aafa5","#8b7ec8","#5cb85c","#d9534f","#c8a64e"];let w=null,I=[],y=null,L="Crucera",v={},h={};const $=new Set;async function H(){try{const{data:{user:e}}=await g.auth.getUser();if(!e){window.location.href="login.html";return}if(w=e,sessionStorage.getItem("pending_faction_type")==="corp"){window.location.href="corp-setup.html";return}const s=sessionStorage.getItem("pending_faction_type")==="party",{data:i}=await g.from("factions").select("id, nation_id, faction_type").eq("id",e.id).maybeSingle();if(i&&i.nation_id&&!(s&&i.faction_type==="corporation")){window.location.href="dashboard.html";return}await G(),document.getElementById("loading").style.display="none";const o=document.getElementById("page-content");o.style.display="flex"}catch(e){document.getElementById("loading").textContent="FAILED TO LOAD — PLEASE REFRESH";const s=document.getElementById("error-message");s&&(s.textContent=e.message||"Unknown error",s.style.display="block")}}function V(e){L=e,document.querySelectorAll(".continent-tab").forEach(s=>{s.classList.toggle("active",s.dataset.continent===e)}),B(I,v,h)}async function G(){const[e,s,i]=await Promise.all([g.from("nations").select("*, nation_profiles(flag_url)"),g.from("factions").select("id, faction_type, faction_name, abbreviation, seats, nation_id, party_color").eq("faction_type","party"),g.from("active_crises").select("nation_id, crisis_id, crisis_templates(name)")]),o=e.data||[],l=s.data||[],t=i.data||[];v={},h={};for(const a of l)v[a.nation_id]||(v[a.nation_id]=[]),v[a.nation_id].push(a);for(const a of t)h[a.nation_id]||(h[a.nation_id]=[]),h[a.nation_id].push(a);I=o,B(o,v,h)}function P(e){return e==="Presidential"||e==="Semi-Presidential"?"gov-presidential":"gov-democracy"}function T(e){const s=typeof e=="string"?e:e?.government_type,i=typeof e=="object"?e?.hos_election_method:null;return s==="Presidential"?"PRESIDENTIAL":s==="Semi-Presidential"?"SEMI-PRESIDENTIAL":i==="hereditary"?"CONSTITUTIONAL MONARCHY":"PARLIAMENTARY"}function B(e,s,i){const o=document.getElementById("nations-grid"),l=e.filter(t=>(t.continent||"Crucera")===L);if(l.sort((t,a)=>{const r=S(s[t.id]||[],t.id),m=S(s[a.id]||[],a.id),c=r>=(t.max_parties||8)?1:0,d=m>=(a.max_parties||8)?1:0;return c!==d?c-d:(t.name||"").localeCompare(a.name||"")}),l.length===0){o.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}o.innerHTML=l.map(t=>{const a=s[t.id]||[],r=i[t.id]||[],m=t.total_seats||100,c=t.max_parties||8,d=S(a,t.id),b=d>=c,A=t.nation_profiles,x=(Array.isArray(A)?A[0]?.flag_url:A?.flag_url)||t.flag_url||z[t.name]||`assets/flags/${t.name}.png`,k=P(t.government_type),D=T(t),F=$.has(t.id),C=[...a].sort((n,p)=>(p.seats||0)-(n.seats||0)),R=a.reduce((n,p)=>n+(p.seats||0),0),O=C.filter(n=>n.seats>0).map((n,p)=>{const E=(n.seats/m*100).toFixed(1),q=n.party_color||_[p%_.length];return`<div class="seat-bar__segment" style="width:${E}%;background:${q};" title="${u(n.faction_name)}: ${n.seats} seats"></div>`}).join(""),U=C.filter(n=>n.seats>0).map((n,p)=>`<span class="seat-legend-item"><span class="seat-legend-dot" style="background:${n.party_color||_[p%_.length]};"></span>${u(n.abbreviation||"?")} ${n.seats}</span>`).join(""),M=C.map((n,p)=>`
        <div class="party-row">
          <span class="party-row__dot" style="background:${n.party_color||_[p%_.length]};"></span>
          <span class="party-row__name">${u(n.faction_name)}</span>
          <span class="party-row__abbr">${u(n.abbreviation||"?")}</span>
          <span class="party-row__seats">${n.seats||0}</span>
        </div>
      `).join(""),j=r.length>0?r.map(n=>`
        <div class="crisis-row">
          <span class="crisis-pip"></span>
          <span class="crisis-name">${u(n.crisis_templates?.name||"Unknown Crisis")}</span>
        </div>
      `).join(""):'<div class="no-crisis">No active crises</div>';return`
      <div class="nation-card ${b?"disabled":""}" data-nation-id="${t.id}" onclick="${b?"":"selectNation('"+t.id+"')"}">
        <div class="nation-card__header">
          ${x?`<img class="nation-card__flag" src="${x}" alt="${u(t.name)}" onerror="this.style.display='none'">`:""}
          <span class="nation-card__name">${u(t.name)}${F?'<span class="alpha-badge">Alpha</span>':""}</span>
          <span class="nation-card__gov-type ${k}">${D}</span>
        </div>
        <div class="nation-card__body">
          ${N[t.name]?`<div style="font-size:10px;color:var(--text-dim);line-height:1.5;margin-bottom:8px;font-style:italic;">${u(N[t.name])}</div>`:""}
          <div class="stat-row">
            <span class="stat-row__label">Total Seats</span>
            <span class="stat-row__value" style="color:var(--text-secondary);">${m}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Factions</span>
            <span class="stat-row__value" style="color:${b?"var(--red)":"var(--text-secondary)"};">${d}${" / "+c}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Control</span>
            <span class="stat-row__value" style="color:${(t.control??50)>=60?"var(--green)":(t.control??50)>=40?"var(--amber)":"var(--red)"};">${Number(t.control??50).toFixed(1)}</span>
          </div>

          ${a.some(n=>n.seats>0)?`
          <div class="seat-bar">
            <div class="seat-bar__label">Seat Distribution</div>
            <div class="seat-bar__track">
              ${O}
              ${R<m?'<div class="seat-bar__empty"></div>':""}
            </div>
            <div class="seat-bar__legend">${U}</div>
          </div>
          `:""}

          ${a.length>0?`
          <div class="party-list">
            <div class="party-list__header">Factions &mdash; ${d}</div>
            ${M}
          </div>
          `:'<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-ghost);padding:6px 0;">No factions yet — be the first</div>'}

          <div class="crisis-section">
            <div class="party-list__header">Active Crises</div>
            ${j}
          </div>
        </div>
        <div class="nation-card__footer">
          <span class="join-label">${b?"NATION FULL":"JOIN THIS NATION"}</span>
          ${b?"":'<span class="join-arrow">&#x25B6;</span>'}
        </div>
      </div>
    `}).join("")}function Y(e){y=e;const s=I.find(d=>d.id===e);if(!s)return;document.getElementById("modal-nation-name").textContent=s.name;const i=document.getElementById("modal-gov-badge"),o=P(s.government_type),l=T(s);i.className="modal__gov-badge "+o,i.textContent=l;const t=document.getElementById("modal-flow-hint");t.textContent="You will choose your ideology, then name and customize your party.";const a=document.getElementById("alpha-code-section"),r=document.getElementById("alpha-code-input"),m=document.getElementById("alpha-code-error"),c=$.has(e);a.classList.toggle("visible",c),r.value="",m.style.display="none",document.getElementById("modal-overlay").classList.add("active"),c&&r.focus()}function J(){document.getElementById("modal-overlay").classList.remove("active"),y=null,f=!1}let f=!1;async function K(){if(f||!y)return;const e=I.find(o=>o.id===y);if(!e)return;if(f=!0,$.has(y)){const o=document.getElementById("alpha-code-input"),l=document.getElementById("alpha-code-error"),t=o.value.trim().toUpperCase();if(!t){l.textContent="Please enter your alpha tester code.",l.style.display="block",o.focus(),f=!1;return}const a=document.getElementById("modal-confirm-btn");a.disabled=!0,a.textContent="VALIDATING...";const{data:r,error:m}=await g.from("alpha_tester_codes").select("id, used_by").eq("code",t).eq("nation_id",y).maybeSingle();if(m||!r||r.used_by){l.textContent=r?.used_by?"This code has already been used.":"Invalid or already used code.",l.style.display="block",a.disabled=!1,a.textContent="CONTINUE",f=!1,o.focus();return}const{data:c,error:d}=await g.from("alpha_tester_codes").update({used_by:w.id,used_at:new Date().toISOString()}).eq("id",r.id).is("used_by",null).select("id");if(d||!c||c.length===0){l.textContent="Code was already claimed. Please try a different code.",l.style.display="block",a.disabled=!1,a.textContent="CONTINUE",f=!1;return}a.disabled=!1,a.textContent="CONTINUE"}const{data:i}=await g.from("factions").select("id, faction_name").or(`id.eq.${w.id},linked_user_id.eq.${w.id}`).eq("faction_type","corporation").eq("nation_id",y).is("abandoned_at",null).maybeSingle();if(i){const o=document.getElementById("alpha-code-error")||document.createElement("div");o.id||(o.id="corp-nation-error",o.style.cssText="font-family:var(--font-mono);font-size:10px;color:#d9534f;margin-top:8px;",document.querySelector(".modal-body")?.appendChild(o)),o.textContent=`Your corporation "${i.faction_name}" is in ${e.name}. Political parties cannot operate in the same nation as your corporation.`,o.style.display="block",f=!1;return}sessionStorage.setItem("nationhood_pending_nation",JSON.stringify({id:e.id,name:e.name,government_type:e.government_type})),window.location.href="faction-select.html"}H();window.selectNation=Y;window.closeModal=J;window.confirmNation=K;async function Q(){await g.auth.signOut(),sessionStorage.clear(),window.location.href="login.html"}window.logoutUser=Q;window.switchContinent=V;function W(){const e=document.body.classList.toggle("light-mode");localStorage.setItem("nationhood_theme",e?"light":"dark");const s=document.getElementById("theme-toggle");s&&(s.textContent=e?"Dark":"Light")}window.toggleTheme=W;(function(){if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}})();
