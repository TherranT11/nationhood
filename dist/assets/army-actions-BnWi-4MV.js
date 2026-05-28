import{_supabase as y}from"./supabase-client-CiYoFhIh.js";import{g as R}from"./political-actions-BCfwIhEF.js";import{b as q}from"./army-page-L2dCufP_.js";import{o as F}from"./create-unit-QrUTsaJr.js";import{e as $}from"./utils-oN1e812_.js";import{i as P,g as D}from"./factions-qe2qC_cj.js";import"./config-BdOpHGNJ.js";import"./government-types-CNjNcIHN.js";import"./stats-Nd7eW9dF.js";import"./preload-helper-BXl3LOEh.js";import"./military-topbar-Dt58u9TP.js";const k=1200,B=[["manpower","Manpower"],["officer_corps","Officer Corps"],["training","Training"],["equipment","Equipment Quality"],["cohesion","Cohesion"],["professionalism","Professionalism"],["logistics","Logistics"],["supplies","Supplies"]];function H(t){return"$"+((Number(t)||0)/1e6).toFixed(1).replace(/\.0$/,"")}const U=`
.rd-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
.rd-modal { background:#0a0a0a; border:0.5px solid rgba(122,154,171,0.25); border-radius:6px; width:100%; max-width:820px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; font-family:var(--font-mono,monospace); }
.rd-head { display:flex; align-items:center; gap:14px; padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:linear-gradient(180deg,rgba(122,154,171,0.05),#0c0c0c); }
.rd-eyebrow { color:#7a9aab; font-size:10px; letter-spacing:0.15em; }
.rd-title { font-size:20px; color:#fff; margin-top:2px; }
.rd-title em { color:#7a9aab; font-style:italic; }
.rd-head-right { margin-left:auto; display:flex; align-items:center; gap:18px; }
.rd-stat { text-align:right; }
.rd-stat .l { color:#666; font-size:9px; letter-spacing:0.12em; }
.rd-stat .v { font-size:13px; margin-top:2px; color:#d4d4d4; }
.rd-stat .v.steel { color:#7a9aab; font-weight:600; }
.rd-x { border:0.5px solid rgba(255,255,255,0.15); color:#888; width:26px; height:26px; border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; }
.rd-recipient { display:flex; align-items:center; gap:10px; padding:11px 22px; background:#0c1115; border-bottom:0.5px solid rgba(122,154,171,0.12); font-size:11px; color:#aab8c0; flex-wrap:wrap; }
.rd-recipient .lbl { color:#555; font-size:9px; letter-spacing:0.13em; margin-right:5px; }
.rd-recipient .who { color:#d4d4d4; font-weight:600; }
.rd-recipient .role { color:#7a9aab; font-size:10px; letter-spacing:0.08em; }
.rd-recipient .arr { color:#4a4a4a; margin:0 6px; }
.rd-body { flex:1; overflow-y:auto; padding:18px 22px; }
.rd-sec { font-size:11px; letter-spacing:0.12em; color:#888; text-transform:uppercase; margin:16px 0 10px; }
.rd-sec:first-child { margin-top:0; }
.rd-snap { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.rd-snap .cell { background:#121518; border:0.5px solid rgba(122,154,171,0.15); border-radius:3px; padding:9px 11px; }
.rd-snap .cell .k { font-size:9px; color:#7a9aab; letter-spacing:0.1em; text-transform:uppercase; }
.rd-snap .cell .v { font-size:16px; font-weight:600; color:#fff; margin-top:3px; }
.rd-ta { width:100%; min-height:200px; background:#0d1115; border:0.5px solid rgba(122,154,171,0.2); border-radius:4px; color:#d8d8d8; font-size:13px; line-height:1.6; font-family:Georgia,'Times New Roman',serif; resize:vertical; padding:14px 16px; outline:none; }
.rd-ta::placeholder { color:#445; font-style:italic; }
.rd-count { font-size:9px; color:#555; text-align:right; margin-top:6px; letter-spacing:0.06em; }
.rd-count.over { color:#c47a7a; }
.rd-pub { display:flex; align-items:center; gap:8px; margin-top:14px; font-size:11px; color:#aab8c0; cursor:pointer; user-select:none; }
.rd-pub input { accent-color:#7a9aab; width:14px; height:14px; }
.rd-foot { display:flex; align-items:center; gap:16px; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
.rd-foot .fm { font-size:10px; letter-spacing:0.08em; color:#666; }
.rd-foot .fm .steel { color:#7a9aab; font-weight:600; }
.rd-acts { margin-left:auto; display:flex; gap:8px; }
.rd-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; font-family:inherit; }
.rd-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; background:transparent; }
.rd-btn.pri { background:#1a2a35; border:0.5px solid #7a9aab; color:#c8d4dc; font-weight:600; }
.rd-btn.pri.off { opacity:0.4; pointer-events:none; }
`;function Y(){if(document.getElementById("rd-styles"))return;const t=document.createElement("style");t.id="rd-styles",t.textContent=U,document.head.appendChild(t)}async function j(t){let e=0,l={},c="";try{const{data:n,error:f}=await y.from("factions").select("party_funds, army_manpower, army_officer_corps, army_training, army_equipment, army_cohesion, army_professionalism, army_logistics, army_supplies").eq("id",t.id).maybeSingle();f&&console.warn("[report-defense] faction load failed:",f.message),n&&(e=Number(n.party_funds)||0,l={manpower:n.army_manpower,officer_corps:n.army_officer_corps,training:n.army_training,equipment:n.army_equipment,cohesion:n.army_cohesion,professionalism:n.army_professionalism,logistics:n.army_logistics,supplies:n.army_supplies});const{data:i,error:a}=await y.from("ministries").select("minister_first_name, minister_last_name").eq("nation_id",t.nation_id).eq("ministry_key","defense").eq("is_active",!0).maybeSingle();a&&console.warn("[report-defense] minister load failed:",a.message),i&&(c=`${i.minister_first_name||""} ${i.minister_last_name||""}`.trim())}catch(n){console.warn("[report-defense] context load failed:",n?.message||n)}return{funds:e,stats:l,minister:c}}function G(t){if(!t?.id)return;Y();let e=document.getElementById("rd-overlay");e||(e=document.createElement("div"),e.id="rd-overlay",e.className="rd-overlay",document.body.appendChild(e));let l=!1;const c=`${t.leader_first_name||""} ${t.leader_last_name||""}`.trim()||"The Chief of Staff";function n(){e.style.display="none",e.innerHTML="",e.onclick=null,e.oninput=null}function f(a){const s=a.minister?`<span class="who">${$(a.minister)}</span> <span class="role">MINISTER OF DEFENSE</span>`:'<span class="who" style="color:#888;">Vacant</span> <span class="role">NO DEFENSE MINISTER</span>',r=B.map(([o,p])=>{const g=a.stats[o],v=g==null?"—":Number(g).toLocaleString();return`<div class="cell"><div class="k">${$(p)}</div><div class="v">${v}</div></div>`}).join("");e.innerHTML=`<div class="rd-modal">
      <div class="rd-head">
        <div>
          <div class="rd-eyebrow">— ARMY ACTION · RESTRICTED —</div>
          <div class="rd-title">Report to <em>Defense Minister</em></div>
        </div>
        <div class="rd-head-right">
          <div class="rd-stat"><div class="l">FILING COST</div><div class="v steel">$1</div></div>
          <div class="rd-stat"><div class="l">ARMY FUNDS</div><div class="v">${H(a.funds)}</div></div>
          <div class="rd-x" data-rd="close">×</div>
        </div>
      </div>
      <div class="rd-recipient">
        <span class="lbl">FROM</span><span class="who">${$(c)}</span> <span class="role">CHIEF OF STAFF</span>
        <span class="arr">▸</span>
        <span class="lbl">TO</span>${s}
      </div>
      <div class="rd-body">
        <div class="rd-sec">Service snapshot — auto-attached, read-only</div>
        <div class="rd-snap">${r}</div>
        <div class="rd-sec">Confidential briefing</div>
        <textarea class="rd-ta" id="rd-body" maxlength="${k}" placeholder="Write privately to the Defense Minister. Only the party that controls the Defense ministry can read this; every other party sees only the headline."></textarea>
        <div class="rd-count" id="rd-count">0 / ${k}</div>
        <label class="rd-pub"><input type="checkbox" id="rd-public"> Make report public — every party can read the full report (default: only the Defense Minister's party)</label>
      </div>
      <div class="rd-foot">
        <div class="fm">VISIBILITY: <span class="steel" id="rd-vis">DEFENSE MINISTER'S PARTY ONLY</span></div>
        <div class="rd-acts">
          <div class="rd-btn sec" data-rd="cancel">CANCEL</div>
          <div class="rd-btn pri off" id="rd-file" data-rd="file">FILE BRIEFING — $1 →</div>
        </div>
      </div>
    </div>`;const d=e.querySelector("#rd-body"),b=e.querySelector("#rd-count"),_=e.querySelector("#rd-file"),h=e.querySelector("#rd-public"),m=e.querySelector("#rd-vis");h&&m&&(h.onchange=()=>{m.textContent=h.checked?"ALL PARTIES (PUBLIC)":"DEFENSE MINISTER'S PARTY ONLY"}),e.oninput=()=>{const o=d.value.length;b.textContent=`${o} / ${k}`,b.classList.toggle("over",o>k),_.classList.toggle("off",d.value.trim().length===0||o>k)},d.focus()}async function i(){if(l)return;const s=(e.querySelector("#rd-body")?.value||"").trim();if(!s){alert("Write the briefing first.");return}if(s.length>k){alert(`The briefing exceeds the ${k} character limit.`);return}l=!0;try{const{data:r,error:d}=await y.rpc("file_chief_of_staff_report",{p_faction_id:t.id,p_body:s,p_public:!!e.querySelector("#rd-public")?.checked});if(d){alert("Failed to file: "+d.message);return}if(r&&r.success===!1){r.error==="cooldown"?alert("A report was filed recently. The Chief of Staff may file again in "+Math.max(0,Number(r.ready_at_tick)||0)+" ticks (12-tick cooldown)."):alert(r.error||"Could not file the report.");return}n(),alert("Briefing filed to the Defense Minister. It now appears in the nation’s Pressing Issues.")}finally{l=!1}}e.onclick=a=>{const s=a.target.closest("[data-rd]");if(!s){a.target===e&&n();return}const r=s.getAttribute("data-rd");if(r==="close"||r==="cancel")return n();if(r==="file")return i()},e.style.display="flex",e.innerHTML='<div class="rd-modal"><div class="rd-body"><div class="rd-sec">Loading…</div></div></div>',j(t).then(f)}const W=12e6,A=24;function V(t){return"$"+((Number(t)||0)/1e6).toFixed(1).replace(/\.0$/,"")}function E(t,e){return Math.max(0,Math.floor(((Number(e)||0)-(Number(t)||0))/20))}const Q=`
.foe-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
.foe-modal { background:#0a0a0a; border:0.5px solid rgba(182,83,63,0.3); border-radius:6px; width:100%; max-width:760px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; font-family:var(--font-mono,monospace); }
.foe-head { display:flex; align-items:center; gap:14px; padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:linear-gradient(180deg,rgba(182,83,63,0.06),#0c0c0c); }
.foe-eyebrow { color:#b6533f; font-size:10px; letter-spacing:0.15em; }
.foe-title { font-size:20px; color:#fff; margin-top:2px; }
.foe-title em { color:#b6533f; font-style:italic; }
.foe-head-right { margin-left:auto; display:flex; align-items:center; gap:18px; }
.foe-stat { text-align:right; }
.foe-stat .l { color:#666; font-size:9px; letter-spacing:0.12em; }
.foe-stat .v { font-size:13px; margin-top:2px; color:#d4d4d4; }
.foe-stat .v.army { color:#b6533f; font-weight:600; }
.foe-x { border:0.5px solid rgba(255,255,255,0.15); color:#888; width:26px; height:26px; border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; }
.foe-desc { padding:12px 22px; font-size:12px; line-height:1.6; color:#9a9a92; border-bottom:0.5px solid rgba(255,255,255,0.06); }
.foe-mine { display:flex; gap:22px; padding:11px 22px; background:#120e0d; border-bottom:0.5px solid rgba(182,83,63,0.12); font-size:11px; color:#c4c2b8; }
.foe-mine .lbl { color:#666; letter-spacing:0.1em; margin-right:6px; }
.foe-mine b { color:#fff; }
.foe-body { flex:1; overflow-y:auto; padding:8px 0; }
.foe-row { display:grid; grid-template-columns:1fr 92px 92px; gap:8px; align-items:center; padding:11px 22px; cursor:pointer; border-bottom:0.5px solid rgba(255,255,255,0.04); }
.foe-row:hover { background:rgba(182,83,63,0.05); }
.foe-row.is-sel { background:rgba(182,83,63,0.1); box-shadow:inset 3px 0 0 #b6533f; }
.foe-row .nm { font-size:13px; color:#f0efe6; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.foe-row .sub { font-size:9px; color:#666; margin-top:2px; }
.foe-row .col { text-align:right; font-size:13px; color:#d4d4d4; }
.foe-row .col .g { font-size:9px; margin-left:5px; }
.foe-row .col .g.up { color:#5cb85c; }
.foe-row .col .g.zero { color:#666; }
.foe-colhead { display:grid; grid-template-columns:1fr 92px 92px; gap:8px; padding:7px 22px; font-size:9px; letter-spacing:0.1em; color:#666; text-transform:uppercase; border-bottom:0.5px solid rgba(255,255,255,0.08); }
.foe-colhead span:not(:first-child) { text-align:right; }
.foe-empty { padding:34px 22px; text-align:center; font-size:12px; color:#666; }
.foe-foot { display:flex; align-items:center; gap:14px; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
.foe-foot .fm { font-size:10px; letter-spacing:0.06em; color:#888; line-height:1.5; }
.foe-foot .fm b { color:#b6533f; }
.foe-foot .fm.warn { color:#c47a7a; }
.foe-acts { margin-left:auto; display:flex; gap:8px; }
.foe-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; font-family:inherit; }
.foe-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; background:transparent; }
.foe-btn.pri { background:#2a1715; border:0.5px solid #b6533f; color:#e8c0b6; font-weight:600; }
.foe-btn.pri.off { opacity:0.4; pointer-events:none; }
`;function X(){if(document.getElementById("foe-styles"))return;const t=document.createElement("style");t.id="foe-styles",t.textContent=Q,document.head.appendChild(t)}async function J(t){let e=0,l=0,c=0,n=null,f=0,i=[];try{const{data:a,error:s}=await y.from("factions").select("party_funds, nation_id, army_officer_corps, army_professionalism, last_foreign_officer_exchange_tick").eq("id",t.id).maybeSingle();s&&console.warn("[foe] faction load failed:",s.message),a&&(e=Number(a.party_funds)||0,l=Number(a.army_officer_corps)||0,c=Number(a.army_professionalism)||0,n=a.last_foreign_officer_exchange_tick==null?null:Number(a.last_foreign_officer_exchange_tick));const r=a?.nation_id||t.nation_id,{data:d,error:b}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").maybeSingle();b&&console.warn("[foe] shard load failed:",b.message),f=Number(d?.current_tick)||0;let _=y.from("factions").select("id, nation_id, faction_name, army_officer_corps, army_professionalism, is_banned, nations(name)").eq("faction_type","military").eq("branch","army").is("abandoned_at",null);r&&(_=_.neq("nation_id",r));const{data:h,error:m}=await _;m&&console.warn("[foe] targets load failed:",m.message),i=(h||[]).filter(o=>!o.is_banned).map(o=>({id:o.id,nation:o.nations?.name||o.faction_name||"Unknown",oc:Number(o.army_officer_corps)||0,pr:Number(o.army_professionalism)||0})).sort((o,p)=>o.nation.localeCompare(p.nation))}catch(a){console.warn("[foe] context load failed:",a?.message||a)}return{funds:e,myOc:l,myPr:c,lastTick:n,currentTick:f,targets:i}}function K(t){if(!t?.id)return;X();let e=document.getElementById("foe-overlay");e||(e=document.createElement("div"),e.id="foe-overlay",e.className="foe-overlay",document.body.appendChild(e));let l=!1,c=null;function n(){e.style.display="none",e.innerHTML="",e.onclick=null}function f(a){const s=a.lastTick!=null?Math.max(0,a.lastTick+A-a.currentTick):0,r=s>0,d=a.funds<W,b=a.targets.length?a.targets.map(o=>{const p=E(a.myOc,o.oc),g=E(a.myPr,o.pr),v=w=>w>0?`<span class="g up">+${w}</span>`:'<span class="g zero">+0</span>';return`<div class="foe-row" data-foe="pick" data-id="${$(o.id)}">
        <div><div class="nm">${$(o.nation)}</div><div class="sub">Foreign army</div></div>
        <div class="col">${o.oc.toLocaleString()}${v(p)}</div>
        <div class="col">${o.pr.toLocaleString()}${v(g)}</div>
      </div>`}).join(""):'<div class="foe-empty">No foreign armies are available to exchange with yet.</div>';e.innerHTML=`<div class="foe-modal">
      <div class="foe-head">
        <div>
          <div class="foe-eyebrow">— ARMY ACTION · COMMANDING GENERAL —</div>
          <div class="foe-title">Foreign Officer <em>Exchange Program</em></div>
        </div>
        <div class="foe-head-right">
          <div class="foe-stat"><div class="l">COST</div><div class="v army">$12</div></div>
          <div class="foe-stat"><div class="l">ARMY FUNDS</div><div class="v">${V(a.funds)}</div></div>
          <div class="foe-x" data-foe="close">×</div>
        </div>
      </div>
      <div class="foe-desc">Send select officers abroad to study at foreign military academies and embed with allied units. Returning officers bring back modern doctrine, professional standards, and international networks. Each stat gains ⌊(their − yours) ÷ 20⌋ — never below 0. ${A}-tick cooldown.</div>
      <div class="foe-mine">
        <div><span class="lbl">YOUR OFFICER CORPS</span><b>${a.myOc.toLocaleString()}</b></div>
        <div><span class="lbl">YOUR PROFESSIONALISM</span><b>${a.myPr.toLocaleString()}</b></div>
      </div>
      <div class="foe-colhead"><span>Nation</span><span>Officer Corps</span><span>Professionalism</span></div>
      <div class="foe-body">${b}</div>
      <div class="foe-foot">
        <div class="fm${r||d?" warn":""}" id="foe-summary">${r?`On cooldown — ready in ${s} tick${s===1?"":"s"}.`:d?"Insufficient Army Funds ($12 required).":"Select a foreign army to preview the exchange."}</div>
        <div class="foe-acts">
          <div class="foe-btn sec" data-foe="cancel">CANCEL</div>
          <div class="foe-btn pri off" id="foe-go" data-foe="go">EXCHANGE — $12 →</div>
        </div>
      </div>
    </div>`;const _=e.querySelector("#foe-summary"),h=e.querySelector("#foe-go");function m(o){if(r||d)return;c=o,e.querySelectorAll(".foe-row").forEach(N=>N.classList.toggle("is-sel",N.getAttribute("data-id")===o));const p=a.targets.find(N=>N.id===o);if(!p)return;const g=E(a.myOc,p.oc),v=E(a.myPr,p.pr),w=Math.min(100,Math.max(0,a.myOc+g)),S=Math.min(100,Math.max(0,a.myPr+v));_.classList.remove("warn"),_.innerHTML=g===0&&v===0?`<b>${$(p.nation)}</b> is not ahead of you — no stat gain, but the action still costs $12 and triggers the cooldown.`:`<b>${$(p.nation)}</b> → Officer Corps ${a.myOc}→${w} (+${g}), Professionalism ${a.myPr}→${S} (+${v}).`,h.classList.remove("off")}e.onclick=o=>{const p=o.target.closest("[data-foe]");if(!p){o.target===e&&n();return}const g=p.getAttribute("data-foe");if(g==="close"||g==="cancel")return n();if(g==="pick")return m(p.getAttribute("data-id"));if(g==="go")return i()}}async function i(){if(!(l||!c)){l=!0;try{const{data:a,error:s}=await y.rpc("foreign_officer_exchange",{p_faction_id:t.id,p_target_faction_id:c});if(s){alert("Exchange failed: "+s.message);return}if(a&&a.success===!1){a.error==="cooldown"?alert("Recently used. Available again at tick "+(Number(a.ready_at_tick)||0)+` (${A}-tick cooldown).`):alert(a.error||"Could not run the exchange.");return}n();const r=Number(a?.officer_corps_gain)||0,d=Number(a?.professionalism_gain)||0;alert(`Officer exchange with ${a?.target_nation||"the foreign nation"} complete.
Officer Corps +${r} (now ${Number(a?.new_officer_corps)||0}), Professionalism +${d} (now ${Number(a?.new_professionalism)||0}).`)}finally{l=!1}}}e.style.display="flex",e.innerHTML='<div class="foe-modal"><div class="foe-body"><div class="foe-empty">Loading foreign armies…</div></div></div>',J(t).then(f)}const M=24;function C(t){return"$"+((Number(t)||0)/1e6).toFixed(1).replace(/\.0$/,"")}const Z=`
.cas-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
.cas-modal { background:#0a0a0a; border:0.5px solid rgba(182,83,63,0.3); border-radius:6px; width:100%; max-width:620px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; font-family:var(--font-mono,monospace); }
.cas-head { display:flex; align-items:center; gap:14px; padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:linear-gradient(180deg,rgba(182,83,63,0.06),#0c0c0c); }
.cas-eyebrow { color:#b6533f; font-size:10px; letter-spacing:0.15em; }
.cas-title { font-size:20px; color:#fff; margin-top:2px; }
.cas-title em { color:#b6533f; font-style:italic; }
.cas-head-right { margin-left:auto; display:flex; align-items:center; gap:18px; }
.cas-stat { text-align:right; }
.cas-stat .l { color:#666; font-size:9px; letter-spacing:0.12em; }
.cas-stat .v { font-size:13px; margin-top:2px; color:#d4d4d4; }
.cas-stat .v.army { color:#b6533f; font-weight:600; }
.cas-x { border:0.5px solid rgba(255,255,255,0.15); color:#888; width:26px; height:26px; border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; }
.cas-body { flex:1; overflow-y:auto; padding:18px 22px; }
.cas-desc { font-size:13px; line-height:1.65; color:#bdbdb4; }
.cas-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:16px; }
.cas-cell { background:#121012; border:0.5px solid rgba(182,83,63,0.18); border-radius:3px; padding:10px 12px; }
.cas-cell .k { font-size:9px; color:#9a7166; letter-spacing:0.1em; text-transform:uppercase; }
.cas-cell .v { font-size:15px; font-weight:600; color:#fff; margin-top:3px; }
.cas-cell .v.warn { color:#c47a7a; }
.cas-note { margin-top:14px; font-size:11px; color:#7a7a72; line-height:1.6; }
.cas-foot { display:flex; align-items:center; gap:14px; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
.cas-foot .fm { font-size:10px; letter-spacing:0.06em; color:#888; }
.cas-foot .fm.warn { color:#c47a7a; }
.cas-acts { margin-left:auto; display:flex; gap:8px; }
.cas-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; font-family:inherit; }
.cas-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; background:transparent; }
.cas-btn.pri { background:#2a1715; border:0.5px solid #b6533f; color:#e8c0b6; font-weight:600; }
.cas-btn.pri.off { opacity:0.4; pointer-events:none; }
`;function ee(){if(document.getElementById("cas-styles"))return;const t=document.createElement("style");t.id="cas-styles",t.textContent=Z,document.head.appendChild(t)}async function ae(t){let e=0,l=0,c=null,n=0,f=null;try{const{data:i,error:a}=await y.from("factions").select("party_funds, army_manpower, last_combined_arms_school_tick").eq("id",t.id).maybeSingle();a&&console.warn("[cas] faction load failed:",a.message),i&&(e=Number(i.party_funds)||0,l=Number(i.army_manpower)||0,c=i.last_combined_arms_school_tick==null?null:Number(i.last_combined_arms_school_tick));const{data:s,error:r}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").maybeSingle();r&&console.warn("[cas] shard load failed:",r.message),n=Number(s?.current_tick)||0;const{data:d,error:b}=await y.rpc("combined_arms_school_spec");b&&console.warn("[cas] spec load failed:",b.message),f=d||null}catch(i){console.warn("[cas] context load failed:",i?.message||i)}return{funds:e,manpower:l,lastTick:c,currentTick:n,spec:f}}function te(t){if(!t?.id)return;ee();let e=document.getElementById("cas-overlay");e||(e=document.createElement("div"),e.id="cas-overlay",e.className="cas-overlay",document.body.appendChild(e));let l=!1;function c(){e.style.display="none",e.innerHTML="",e.onclick=null}function n(i){const a=i.spec||{},s=Number(a.budget)||55e6,r=Number(a.timeline)||36,d=Number(a.manpower_cost)||2e3,b=Number(a.upkeep_per_tick)||2,h=(Array.isArray(a.stat_effects)?a.stat_effects:[]).map(v=>`${Number(v.delta)>=0?"+":""}${v.delta} ${String(v.stat).replace(/^army_/,"").replace(/_/g," ")}`).join(" · ")||"+6 professionalism · +4 officer corps",m=i.lastTick!=null?Math.max(0,i.lastTick+M-i.currentTick):0,o=m>0,p=i.funds<s,g=o||p;e.innerHTML=`<div class="cas-modal">
      <div class="cas-head">
        <div>
          <div class="cas-eyebrow">— ARMY ACTION · QUARTERMASTER —</div>
          <div class="cas-title">Establish <em>Combined Arms School</em></div>
        </div>
        <div class="cas-head-right">
          <div class="cas-stat"><div class="l">COST</div><div class="v army">${C(s)}</div></div>
          <div class="cas-stat"><div class="l">ARMY FUNDS</div><div class="v">${C(i.funds)}</div></div>
          <div class="cas-x" data-cas="close">×</div>
        </div>
      </div>
      <div class="cas-body">
        <div class="cas-desc">Stand up a national staff college teaching combined arms doctrine, joint operations, and modern warfare. Curriculum draws from foreign manuals and recent conflicts. Frees officers from line duties for 16-week intensive courses. A construction corporation must bid on and build it.</div>
        <div class="cas-grid">
          <div class="cas-cell"><div class="k">Construction Budget</div><div class="v">${C(s)}</div></div>
          <div class="cas-cell"><div class="k">Build Time</div><div class="v">~${r} months</div></div>
          <div class="cas-cell"><div class="k">Manpower Removed Now</div><div class="v warn">−${d.toLocaleString()}</div></div>
          <div class="cas-cell"><div class="k">On Completion</div><div class="v">${$(h)}</div></div>
        </div>
        <div class="cas-note">Current manpower: <b>${i.manpower.toLocaleString()}</b> → <b>${Math.max(0,i.manpower-d).toLocaleString()}</b> (removed immediately, even though the build takes ~${r} months). Once built, the school costs the nation <b>$${b}/tick</b> forever under National Infrastructure. ${M}-tick cooldown. The $${s/1e6} is paid up front and is what corporations bid on — it is not refunded if no corp ever builds it.</div>
      </div>
      <div class="cas-foot">
        <div class="fm${g?" warn":""}" id="cas-msg">${o?`On cooldown — ready in ${m} tick${m===1?"":"s"}.`:p?`Insufficient Army Funds (${C(s)} required).`:"This posts the contract and removes manpower immediately."}</div>
        <div class="cas-acts">
          <div class="cas-btn sec" data-cas="cancel">CANCEL</div>
          <div class="cas-btn pri${g?" off":""}" id="cas-go" data-cas="go">ESTABLISH — ${C(s)} →</div>
        </div>
      </div>
    </div>`,e.onclick=v=>{const w=v.target.closest("[data-cas]");if(!w){v.target===e&&c();return}const S=w.getAttribute("data-cas");if(S==="close"||S==="cancel")return c();if(S==="go"&&!g)return f()}}async function f(){if(!l){l=!0;try{const{data:i,error:a}=await y.rpc("post_combined_arms_school",{p_faction_id:t.id});if(a){alert("Could not establish the school: "+a.message);return}if(i&&i.success===!1){i.error==="cooldown"?alert("Recently used. Available again at tick "+(Number(i.ready_at_tick)||0)+` (${M}-tick cooldown).`):alert(i.error||"Could not establish the school.");return}c(),alert(`Combined Arms School commissioned for ${i?.nation||"the nation"}.
${Number(i?.manpower_removed)||0} manpower removed now. Construction corporations can now bid; on completion: +6 Professionalism, +4 Officer Corps.`)}finally{l=!1}}}e.style.display="flex",e.innerHTML='<div class="cas-modal"><div class="cas-body"><div class="cas-desc">Loading…</div></div></div>',ae(t).then(n)}function x(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}const T=[{key:"cos",role:"Chief of Staff",desc:"Principal military advisor; heads the army’s command structure."},{key:"qm",role:"Quartermaster General",col:"army_qm",desc:"Logistics, supply lines, and matériel."},{key:"intel",role:"Director of Intelligence",col:"army_intel",desc:"Reconnaissance, counter-intelligence, and threat assessment."},{key:"cmd",role:"Commanding General",col:"army_cmd",desc:"Field command of deployed forces."}];let u=null,O="cos";function L(t){return t.key==="cos"?{first:u.leader_first_name,last:u.leader_last_name,age:u.leader_age}:{first:u[`${t.col}_first_name`],last:u[`${t.col}_last_name`],age:u[`${t.col}_age`]}}function z(){const t=document.getElementById("aa-root");if(!t)return;const e=T.map(m=>{const o=L(m),p=o.first&&o.last,g=p?`${o.first} ${o.last}`:"Unassigned",v=p?(o.first[0]+o.last[0]).toUpperCase():"–";return`<button class="aa-officer${O===m.key?" is-sel":""}${p?"":" is-dim"}" data-officer="${m.key}">
      <div class="aa-tile">${x(v)}</div>
      <div style="flex:1;min-width:0;">
        <div class="aa-officer__role">${x(m.role)}</div>
        <div class="aa-officer__name">${x(g)}</div>
        <div class="aa-officer__meta">${o.age?"Age "+x(o.age):"Vacant"}</div>
      </div>
    </button>`}).join(""),l=T.find(m=>m.key===O)||T[0],c=L(l),n=c.first&&c.last,f=n?`${c.first} ${c.last}`:"Unassigned",i=n?(c.first[0]+c.last[0]).toUpperCase():"–",a=u.__nation_name||"";let s;l.key==="cos"?s=`
        <div class="aa-act" data-act="create-unit">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Create Unit</span></div>
            <span class="aa-act__cost">$2+</span>
          </div>
          <div class="aa-act__desc">Commission a new combat formation — $2 action fee plus construction cost from the defense budget.</div>
        </div>
        <div class="aa-act" data-act="report-defense">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Report to Defense Minister</span></div>
            <span class="aa-act__cost">$1</span>
          </div>
          <div class="aa-act__desc">File a confidential briefing to the Defense Minister — it appears in the nation's Pressing Issues. 12-tick cooldown.</div>
        </div>
        <div class="aa-act" data-act="resign">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Resign</span><span class="aa-badge aa-badge--irreversible">Irreversible</span></div>
            <span class="aa-act__cost aa-act__cost--warn">−1 APPROVAL</span>
          </div>
          <div class="aa-act__desc">Resign your commission as Chief of Staff and head into a peaceful retirement. Removes your command of this army.</div>
        </div>`:l.key==="qm"?s=`
        <div class="aa-act" data-act="combined-arms-school">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Establish Combined Arms School</span></div>
            <span class="aa-act__cost">$55</span>
          </div>
          <div class="aa-act__desc">Stand up a national staff college teaching combined arms doctrine, joint operations, and modern warfare. Posts a construction contract for corporations to bid on. Removes 2,000 manpower immediately; on completion (≈36 months): Professionalism +6, Officer Corps +4. Then $2/tick under National Infrastructure. 24-tick cooldown.</div>
        </div>`:l.key==="cmd"?s=`
        <div class="aa-act" data-act="foreign-officer-exchange">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Foreign Officer Exchange Program</span></div>
            <span class="aa-act__cost">$12</span>
          </div>
          <div class="aa-act__desc">Send select officers abroad to study at foreign military academies and embed with allied units. Returning officers bring back modern doctrine, professional standards, and international networks. 24-tick cooldown.</div>
        </div>`:s=`<div class="aa-empty">${x(l.desc)}<br><br>No actions available for this office yet.</div>`,t.innerHTML=`
    <div class="aa-head">
      <span class="aa-head__eyebrow">Army Command</span>
      <span class="aa-head__faction">${x(u.faction_name||"Army")}${a?" · "+x(a):""}</span>
    </div>
    <div class="aa-grid">
      <div class="aa-rail">${e}</div>
      <div class="aa-panel">
        <div class="aa-panel__top">
          <div class="aa-avatar">${x(i)}</div>
          <div>
            <div><span class="aa-panel__role">${x(l.role)}</span><span class="aa-panel__name">${x(f)}</span></div>
            <div class="aa-panel__sub">${c.age?"Age "+x(c.age):"Unassigned"}${a?" · "+x(a):""}</div>
          </div>
        </div>
        ${s}
      </div>
    </div>`,t.querySelectorAll("[data-officer]").forEach(m=>{m.addEventListener("click",()=>{O=m.getAttribute("data-officer"),z()})});const r=t.querySelector('[data-act="create-unit"]');r&&(r.onclick=()=>F(u));const d=t.querySelector('[data-act="resign"]');d&&(d.onclick=()=>ie(u));const b=t.querySelector('[data-act="report-defense"]');b&&(b.onclick=()=>G(u));const _=t.querySelector('[data-act="foreign-officer-exchange"]');_&&(_.onclick=()=>K(u));const h=t.querySelector('[data-act="combined-arms-school"]');h&&(h.onclick=()=>te(u))}let I=!1;async function ie(t){if(I)return;const e=t.__nation_name||"your nation";if(confirm(`Resign your commission as Chief of Staff of the ${t.faction_name||"Army"} of ${e}? You will head off into a peaceful retirement. −1 Public Approval. This cannot be undone.`)){I=!0;try{const{data:c,error:n}=await y.rpc("resign_military_faction",{p_faction_id:t.id});if(n){alert("Failed to resign: "+n.message);return}if(c&&c.success===!1){alert(c.error||"Could not resign.");return}const{data:{user:f}}=await y.auth.getUser(),{data:i,error:a}=await y.from("factions").select("id, faction_type, branch, abandoned_at, is_banned, linked_user_id").or(`id.eq.${f.id},linked_user_id.eq.${f.id}`);a&&console.warn("post-resign faction lookup failed:",a.message);const s=(i||[]).filter(d=>d.faction_type!=="military"&&!P(d)),r=s.find(d=>d.faction_type==="party")||s.find(d=>d.faction_type==="corporation")||null;r?(sessionStorage.setItem("active_faction_id",r.id),window.location.href=D(r)||"dashboard.html"):window.location.href="faction-select.html"}finally{I=!1}}}const oe="id, faction_type, faction_name, nation_id, abandoned_at, is_banned, branch, army_manpower, leader_first_name, leader_last_name, leader_age, army_qm_first_name, army_qm_last_name, army_qm_age, army_intel_first_name, army_intel_last_name, army_intel_age, army_cmd_first_name, army_cmd_last_name, army_cmd_age";async function se(){const t=await q({activeTab:"actions",factionSelect:oe});if(!t)return;u=t.faction;const e=t.nation,l=e?.name?R(e.name):null;if(l&&l.firstNames?.length&&l.lastNames?.length){const{firstNames:c,lastNames:n}=l,f={};for(const i of T)if(i.key!=="cos"&&!u[`${i.col}_first_name`]){const a=c[Math.floor(Math.random()*c.length)],s=n[Math.floor(Math.random()*n.length)],r=50+Math.floor(Math.random()*26);f[`${i.col}_first_name`]=a,f[`${i.col}_last_name`]=s,f[`${i.col}_age`]=r,u[`${i.col}_first_name`]=a,u[`${i.col}_last_name`]=s,u[`${i.col}_age`]=r}Object.keys(f).length>0&&await y.from("factions").update(f).eq("id",u.id).then(({error:i})=>{i&&console.warn("Army officer lock-in failed (will retry next load):",i.message)})}z()}se().catch(t=>{console.error("army-actions init failed:",t);const e=document.getElementById("aa-root");e&&(e.innerHTML='<div class="aa-loading">Failed to load army command.</div>')});
