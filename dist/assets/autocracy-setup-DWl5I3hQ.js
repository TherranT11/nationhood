import{_ as r}from"./supabase-client-BXEzLDpS.js";import{e as m}from"./utils-C2W-HleY.js";const v=[{key:"liberty_equality",label:"Liberty vs Equality",left:{name:"Liberty",desc:"Individual rights and minimal state interference."},right:{name:"Equality",desc:"Collective fairness through redistribution."}},{key:"security_freedom",label:"Security vs Freedom",left:{name:"Security",desc:"State protection through law enforcement and strong institutions."},right:{name:"Freedom",desc:"Personal autonomy and privacy. Minimal government intrusion."}},{key:"individualism_collectivism",label:"Individualism vs Collectivism",left:{name:"Individualism",desc:"Self-reliance and private enterprise."},right:{name:"Collectivism",desc:"Communal structures and shared institutions."}},{key:"tradition_progress",label:"Tradition vs Progress",left:{name:"Tradition",desc:"Cultural continuity and inherited social structures."},right:{name:"Progress",desc:"Social reform, scientific advancement, and challenging norms."}},{key:"globalism_nationalism",label:"Globalism vs Nationalism",left:{name:"Globalism",desc:"International cooperation and multilateral governance."},right:{name:"Nationalism",desc:"National sovereignty and cultural identity."}}],b=["Security Directorate","National Defense Council","Military Affairs Commission","Strategic Command Bureau","Order & Stability Front","Patriotic Union","National Front","People's Vanguard","Revolutionary Guard Council","Permanent Committee for National Unity","Political Guidance Bureau","National Renewal Movement","Cultural Sovereignty Directorate","Ideological Affairs Committee","People's Mobilization Front","Central Planning Authority","State Development Council","Administrative Reform Directorate","National Resources Commission","Sovereign Affairs Bureau"],u={Liberty:"#3b82f6",Equality:"#ef4444",Tradition:"#a855f7",Progress:"#22c55e",Security:"#f59e0b",Freedom:"#06b6d4",Globalism:"#14b8a6",Nationalism:"#f97316",Individualism:"#eab308",Collectivism:"#ec4899"};let s=null,f=new Set,o=[],l=null,g=null,p=new Set;const h=[{key:"military",label:"Military",icon:"⚔",color:"#5b9bd5",desc:"Deploy forces, exercises, stand down. Putsch coup type."},{key:"party",label:"The Party",icon:"◎",color:"#c8a64e",desc:"Rallies, agitation, party congress."},{key:"oligarchs",label:"Oligarchs",icon:"$",color:"#5cb85c",desc:"Patronage, capital flight, bribery."},{key:"media",label:"Media",icon:"◈",color:"#d48a3c",desc:"Broadcasts, smear campaigns, blackouts."},{key:"security",label:"Security",icon:"◉",color:"#d9534f",desc:"Surveillance, blackmail, disappearances. Silent coup type."}];async function $(){const{data:{user:t}}=await r.auth.getUser();if(!t){window.location.href="login.html";return}const{data:e}=await r.from("factions").select("id, nation_id").eq("id",t.id).eq("faction_type","party").maybeSingle();if(e&&e.nation_id){window.location.href="dashboard.html";return}const a=sessionStorage.getItem("nationhood_pending_nation");if(!a){window.location.href="select-nation.html";return}if(s=JSON.parse(a),!s.id||s.government_type!=="Autocracy"){window.location.href="select-nation.html";return}document.getElementById("nation-badge").innerHTML=`
    <span class="nation-badge__label">Nation</span>
    <span class="nation-badge__sep"></span>
    <span class="nation-badge__name">${m(s.name)}</span>
    <span class="nation-badge__gov">AUTOCRACY</span>
  `;const{data:i}=await r.from("factions").select("faction_name").eq("nation_id",s.id).eq("faction_type","party");if(i)for(const d of i)f.add(d.faction_name);const{data:n}=await r.from("faction_pillar_state").select("pillar, pillar_confirmed").eq("nation_id",s.id).eq("pillar_confirmed",!0);if(n)for(const d of n)p.add(d.pillar);_(),w(),k(),document.getElementById("loading").style.display="none";const c=document.getElementById("page-content");c.style.display="flex"}function _(){const t=document.getElementById("axes-container");t.innerHTML=v.map(e=>{const a=u[e.left.name]||"var(--text-bright)",i=u[e.right.name]||"var(--text-bright)";return`
    <div class="axis-block">
      <div class="axis-header">
        <div class="axis-dot"></div>
        <span class="axis-label">${e.label}</span>
      </div>
      <div class="axis-body">
        <div class="ideo-card" data-ideology="${e.left.name}" data-opposite="${e.right.name}" data-axis="${e.key}" onclick="toggleIdeo(this)">
          <div class="ideo-name" style="color:${a}">${e.left.name}</div>
          <div class="ideo-desc">${e.left.desc}</div>
        </div>
        <div class="ideo-card" data-ideology="${e.right.name}" data-opposite="${e.left.name}" data-axis="${e.key}" onclick="toggleIdeo(this)">
          <div class="ideo-name" style="color:${i}">${e.right.name}</div>
          <div class="ideo-desc">${e.right.desc}</div>
        </div>
      </div>
    </div>
  `}).join("")}function k(){const t=document.getElementById("pillar-container");t.innerHTML=h.map(e=>{const a=p.has(e.key),i=g===e.key;return`
      <div class="pillar-card ${a?"taken":""} ${i?"selected":""}"
           data-pillar="${e.key}" onclick="selectPillar(this)"
           style="flex:1;min-width:140px;border:2px solid ${i?e.color:a?"var(--border-dim)":e.color+"55"};
                  border-radius:4px;padding:12px;text-align:center;cursor:${a?"default":"pointer"};
                  opacity:${a?"0.35":"1"};background:${i?e.color+"15":"transparent"};transition:all 0.15s">
        <div style="font-size:20px;color:${e.color}">${e.icon}</div>
        <div style="font-size:12px;font-weight:700;color:var(--text-bright);margin-top:4px">${e.label}</div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px">${e.desc}</div>
        ${a?'<div style="font-size:9px;color:var(--text-dim);margin-top:6px;font-weight:600">CLAIMED</div>':""}
        ${i?'<div style="font-size:9px;color:'+e.color+';margin-top:6px;font-weight:600">SELECTED</div>':""}
      </div>`}).join("")}function w(){const t=document.getElementById("names-container");t.innerHTML=b.map(e=>{const a=f.has(e);return`
      <div class="name-option ${a?"taken":""}" data-name="${m(e)}" onclick="selectName(this)">
        <span class="name-option__text">${m(e)}</span>
        ${a?'<span class="name-option__taken-badge">Taken</span>':""}
      </div>
    `}).join("")}function S(t){if(t.classList.contains("disabled"))return;const e=t.dataset.ideology,a=t.dataset.opposite,i=t.dataset.axis;if(t.classList.contains("selected")){t.classList.remove("selected"),o=o.filter(c=>c.name!==e);const n=document.querySelector(`.ideo-card[data-ideology="${a}"]`);n&&n.classList.remove("disabled")}else{if(o.length>=2)return;t.classList.add("selected"),o.push({name:e,axisKey:i});const n=document.querySelector(`.ideo-card[data-ideology="${a}"]`);n&&n.classList.add("disabled")}y()}function C(t){if(t.classList.contains("taken"))return;const e=t.dataset.name;document.querySelectorAll(".name-option.selected").forEach(a=>a.classList.remove("selected")),l===e?l=null:(l=e,t.classList.add("selected")),y()}function y(){const t=document.getElementById("sel-tags");o.length===0?t.innerHTML='<span class="sel-placeholder">Pick 2 ideologies</span>':t.innerHTML=o.map(e=>{const a=u[e.name]||"var(--blue)";return`<span class="sel-tag" style="color:${a};border-color:${a};background:${a}18">${e.name}</span>`}).join(""),I()}function I(){const t=document.getElementById("btn-create");o.length,t.disabled=!0,t.classList.toggle("ready",!1)}async function L(){o.length}function x(){window.location.href="select-nation.html"}$();window.toggleIdeo=S;window.selectName=C;window.createFaction=L;window.goBack=x;
