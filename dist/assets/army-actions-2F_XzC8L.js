import{_supabase as p}from"./supabase-client-CiYoFhIh.js";import{g as v}from"./political-actions-CWimzYIQ.js";import{b as u}from"./army-page-YIBkV7Iz.js";import"./config-BdOpHGNJ.js";import"./government-types-CNjNcIHN.js";import"./stats-CBT3qQox.js";import"./factions-1eoRseVF.js";import"./military-topbar-D-x6nJfr.js";import"./utils-oN1e812_.js";function i(a){return String(a??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}const _=[{key:"cos",role:"Chief of Staff",desc:"Principal military advisor; heads the army’s command structure."},{key:"qm",role:"Quartermaster General",col:"army_qm",desc:"Logistics, supply lines, and matériel."},{key:"intel",role:"Director of Intelligence",col:"army_intel",desc:"Reconnaissance, counter-intelligence, and threat assessment."},{key:"cmd",role:"Commanding General",col:"army_cmd",desc:"Field command of deployed forces."}];let t=null,f="cos";function g(a){return a.key==="cos"?{first:t.leader_first_name,last:t.leader_last_name,age:t.leader_age}:{first:t[`${a.col}_first_name`],last:t[`${a.col}_last_name`],age:t[`${a.col}_age`]}}function y(){const a=document.getElementById("aa-root");if(!a)return;const o=_.map(s=>{const r=g(s),d=r.first&&r.last?`${r.first} ${r.last}`:"—";return`<button class="aa-officer${f===s.key?" is-sel":""}" data-officer="${s.key}">
      <div class="aa-officer__role">${i(s.role)}</div>
      <div class="aa-officer__name">${i(d)}</div>
      <div class="aa-officer__meta">${r.age?"Age "+i(r.age):"Unassigned"}</div>
    </button>`}).join(""),l=_.find(s=>s.key===f)||_[0],n=g(l),m=n.first&&n.last?`${n.first} ${n.last}`:"—",c=n.first&&n.last?(n.first[0]+n.last[0]).toUpperCase():"—",e=t.__nation_name||"";a.innerHTML=`
    <div class="aa-head">
      <span class="aa-head__eyebrow">Army Command</span>
      <span class="aa-head__faction">${i(t.faction_name||"Army")}${e?" · "+i(e):""}</span>
    </div>
    <div class="aa-grid">
      <div class="aa-rail">${o}</div>
      <div class="aa-panel">
        <div class="aa-panel__top">
          <div class="aa-avatar">${i(c)}</div>
          <div>
            <div class="aa-panel__role">${i(l.role)}</div>
            <div class="aa-panel__name">${i(m)}</div>
            <div class="aa-panel__sub">${n.age?"Age "+i(n.age):"Unassigned"}${e?" · "+i(e):""}</div>
          </div>
        </div>
        <p class="aa-panel__desc">${i(l.desc)}</p>
      </div>
    </div>`,a.querySelectorAll("[data-officer]").forEach(s=>{s.addEventListener("click",()=>{f=s.getAttribute("data-officer"),y()})})}const $="id, faction_type, faction_name, nation_id, abandoned_at, is_banned, branch, leader_first_name, leader_last_name, leader_age, army_qm_first_name, army_qm_last_name, army_qm_age, army_intel_first_name, army_intel_last_name, army_intel_age, army_cmd_first_name, army_cmd_last_name, army_cmd_age";async function h(){const a=await u({activeTab:"actions",factionSelect:$});if(!a)return;t=a.faction;const o=a.nation,l=o?.name?v(o.name):null;if(l&&l.firstNames?.length&&l.lastNames?.length){const{firstNames:n,lastNames:m}=l,c={};for(const e of _)if(e.key!=="cos"&&!t[`${e.col}_first_name`]){const s=n[Math.floor(Math.random()*n.length)],r=m[Math.floor(Math.random()*m.length)],d=50+Math.floor(Math.random()*26);c[`${e.col}_first_name`]=s,c[`${e.col}_last_name`]=r,c[`${e.col}_age`]=d,t[`${e.col}_first_name`]=s,t[`${e.col}_last_name`]=r,t[`${e.col}_age`]=d}Object.keys(c).length>0&&await p.from("factions").update(c).eq("id",t.id).then(({error:e})=>{e&&console.warn("Army officer lock-in failed (will retry next load):",e.message)})}y()}h().catch(a=>{console.error("army-actions init failed:",a);const o=document.getElementById("aa-root");o&&(o.innerHTML='<div class="aa-loading">Failed to load army command.</div>')});
