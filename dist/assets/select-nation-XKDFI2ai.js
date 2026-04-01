import{_ as v}from"./supabase-client-BXEzLDpS.js";import{c as P,e as d}from"./utils-C2W-HleY.js";const p=["#5b9bd5","#d48a3c","#5aafa5","#8b7ec8","#5cb85c","#d9534f","#c8a64e"],R={Liberty:"#3b82f6",Equality:"#ef4444",Tradition:"#a855f7",Progress:"#22c55e",Security:"#f59e0b",Freedom:"#06b6d4",Globalism:"#14b8a6",Nationalism:"#f97316",Individualism:"#eab308",Collectivism:"#ec4899"};let w=[],f=null;async function O(){const{data:{user:s}}=await v.auth.getUser();if(!s){window.location.href="login.html";return}const{data:a}=await v.from("factions").select("id, nation_id").eq("id",s.id).eq("faction_type","party").maybeSingle();if(a&&a.nation_id){window.location.href="dashboard.html";return}await T(),document.getElementById("loading").style.display="none";const i=document.getElementById("page-content");i.style.display="flex"}async function T(){const[s,a,i,n]=await Promise.all([v.from("nations").select("*"),v.from("factions").select("id, faction_type, faction_name, abbreviation, seats, nation_id, party_color, ideology_value_1, ideology_value_2").eq("faction_type","party"),v.from("active_crises").select("nation_id, crisis_id, crisis_templates(name)"),v.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism")]),l=s.data||[],e=a.data||[],r=i.data||[],u=n.data||[],_={},m={},y={};for(const o of e)_[o.nation_id]||(_[o.nation_id]=[]),_[o.nation_id].push(o);for(const o of r)m[o.nation_id]||(m[o.nation_id]=[]),m[o.nation_id].push(o);for(const o of u)y[o.faction_id]=o;w=l,q(l,_,m,y)}function I(s){return s==="Autocracy"?"gov-autocracy":s==="Presidential"?"gov-presidential":"gov-democracy"}function L(s){return s==="Autocracy"?"AUTOCRACY":s==="Presidential"?"PRESIDENTIAL":"PARLIAMENTARY"}function j(s){if(!s)return"";const a=[{key:"liberty_equality",neg:"Liberty",pos:"Equality"},{key:"tradition_progress",neg:"Tradition",pos:"Progress"},{key:"security_freedom",neg:"Security",pos:"Freedom"},{key:"globalism_nationalism",neg:"Globalism",pos:"Nationalism"},{key:"individualism_collectivism",neg:"Individualism",pos:"Collectivism"}],i=[];for(const n of a){const l=s[n.key]||0;Math.abs(l)>=20&&i.push(l<0?n.neg:n.pos)}return i.slice(0,2).join(", ")}function F(s){return s?s.split(", ").map(a=>{const i=R[a];return i?`<span style="color:${i}">${d(a)}</span>`:d(a)}).join('<span style="color:var(--text-dim)">, </span>'):""}function q(s,a,i,n){const l=document.getElementById("nations-grid");l.innerHTML=s.map(e=>{const r=a[e.id]||[],u=i[e.id]||[],_=e.total_seats||100,m=e.max_parties||8,y=P(r,e.id),o=y>=m,h=e.flag_url||"",C=I(e.government_type),x=L(e.government_type),b=[...r].sort((t,c)=>(c.seats||0)-(t.seats||0)),A=r.reduce((t,c)=>t+(c.seats||0),0),E=b.filter(t=>t.seats>0).map((t,c)=>{const g=(t.seats/_*100).toFixed(1),$=t.party_color||p[c%p.length];return`<div class="seat-bar__segment" style="width:${g}%;background:${$};" title="${d(t.faction_name)}: ${t.seats} seats"></div>`}).join(""),S=b.filter(t=>t.seats>0).map((t,c)=>`<span class="seat-legend-item"><span class="seat-legend-dot" style="background:${t.party_color||p[c%p.length]};"></span>${d(t.abbreviation||"?")} ${t.seats}</span>`).join(""),B=b.map((t,c)=>{const g=t.party_color||p[c%p.length],$=n[t.id],N=t.ideology_value_1&&t.ideology_value_2?`${t.ideology_value_1}, ${t.ideology_value_2}`:j($);return`
        <div class="party-row">
          <span class="party-row__dot" style="background:${g};"></span>
          <span class="party-row__name">${d(t.faction_name)}</span>
          <span class="party-row__abbr">${d(t.abbreviation||"?")}</span>
          ${N?`<span class="party-row__ideo">${F(N)}</span>`:""}
          <span class="party-row__seats">${t.seats||0}</span>
        </div>
      `}).join(""),k=u.length>0?u.map(t=>`
        <div class="crisis-row">
          <span class="crisis-pip"></span>
          <span class="crisis-name">${d(t.crisis_templates?.name||"Unknown Crisis")}</span>
        </div>
      `).join(""):'<div class="no-crisis">No active crises</div>';return`
      <div class="nation-card ${o?"disabled":""}" data-nation-id="${e.id}" onclick="${o?"":"selectNation('"+e.id+"')"}">
        <div class="nation-card__header">
          ${h?`<img class="nation-card__flag" src="${h}" alt="${d(e.name)}">`:""}
          <span class="nation-card__name">${d(e.name)}</span>
          <span class="nation-card__gov-type ${C}">${x}</span>
        </div>
        <div class="nation-card__body">
          <div class="stat-row">
            <span class="stat-row__label">Total Seats</span>
            <span class="stat-row__value" style="color:var(--text-secondary);">${_}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Factions</span>
            <span class="stat-row__value" style="color:${o?"var(--red)":"var(--text-secondary)"};">${y}${" / "+m}</span>
          </div>
          <div class="stat-row">
            <span class="stat-row__label">Stability</span>
            <span class="stat-row__value" style="color:${(e.stability||50)>=60?"var(--green)":(e.stability||50)>=40?"var(--amber)":"var(--red)"};">${e.stability||50}</span>
          </div>

          ${r.some(t=>t.seats>0)?`
          <div class="seat-bar">
            <div class="seat-bar__label">Seat Distribution</div>
            <div class="seat-bar__track">
              ${E}
              ${A<_?'<div class="seat-bar__empty"></div>':""}
            </div>
            <div class="seat-bar__legend">${S}</div>
          </div>
          `:""}

          ${r.length>0?`
          <div class="party-list">
            <div class="party-list__header">Factions &mdash; ${y}</div>
            ${B}
          </div>
          `:'<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-ghost);padding:6px 0;">No factions yet — be the first</div>'}

          <div class="crisis-section">
            <div class="party-list__header">Active Crises</div>
            ${k}
          </div>
        </div>
        <div class="nation-card__footer">
          <span class="join-label">${o?"NATION FULL":"JOIN THIS NATION"}</span>
          ${o?"":'<span class="join-arrow">&#x25B6;</span>'}
        </div>
      </div>
    `}).join("")}function G(s){f=s;const a=w.find(r=>r.id===s);if(!a)return;document.getElementById("modal-nation-name").textContent=a.name;const i=document.getElementById("modal-gov-badge"),n=I(a.government_type),l=L(a.government_type);i.className="modal__gov-badge "+n,i.textContent=l;const e=document.getElementById("modal-flow-hint");a.government_type==="Autocracy"?e.textContent="You will choose your ideology and faction name next.":e.textContent="You will choose your ideology, then name and customize your party.",document.getElementById("modal-overlay").classList.add("active")}function M(){document.getElementById("modal-overlay").classList.remove("active"),f=null}function U(){if(!f)return;const s=w.find(a=>a.id===f);s&&(sessionStorage.setItem("nationhood_pending_nation",JSON.stringify({id:s.id,name:s.name,government_type:s.government_type})),s.government_type==="Autocracy"?window.location.href="autocracy-setup.html":window.location.href="faction-select.html")}O();window.selectNation=G;window.closeModal=M;window.confirmNation=U;
