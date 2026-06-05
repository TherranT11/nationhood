import{_ as q}from"./supabase-client-BXEzLDpS.js";import{a as A,e as C,t as Q}from"./utils-CzgKGX6o.js";import{u as V}from"./military-units-B_oSYk7U.js";const M={light_infantry:{name:"Light Infantry",mp:2e3,cost:1e6},infantry:{name:"Infantry",mp:3e3,cost:2e6},mechanized:{name:"Mechanized",mp:1e3,cost:3e6},armor:{name:"Armor",mp:500,cost:5e6},artillery:{name:"Artillery",mp:1e3,cost:2e6},support:{name:"Support",mp:2e3,cost:2e6}},H=["light_infantry","infantry","mechanized","armor","artillery","support"],k=2e6,U={regular:{label:"Regular Army",short:"Regular",desc:"Standard formation. No upkeep change; standard equipment and training."},guard:{label:"Guard",short:"Guard",desc:"+$1 upkeep per unit. Always receives the latest equipment when available."},paramilitary:{label:"Paramilitary",short:"Paramilitary",desc:"−$1 upkeep per unit (floored at $1). Training capped at 70. Receives the lowest-quality equipment."}},J=["regular","guard","paramilitary"];function P(t){const d=Array.isArray(t)?t:[];return H.filter(e=>d.includes(e)).map(e=>`${d.filter(n=>n===e).length}× ${M[e].name}`).join(" · ")||"—"}function T(t){return"$"+((Number(t)||0)/1e6).toFixed(1).replace(/\.0$/,"")}const K=`
.cu-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
.cu-modal { background:#0a0a0a; border:0.5px solid rgba(255,255,255,0.12); border-radius:6px; width:100%; max-width:880px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; font-family:var(--font-mono,monospace); }
.cu-head { display:flex; align-items:center; gap:14px; padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:#0c0c0c; }
.cu-eyebrow { color:#d4b87a; font-size:10px; letter-spacing:0.15em; }
.cu-title { font-size:20px; color:#fff; margin-top:2px; }
.cu-title em { color:#d4b87a; font-style:italic; }
.cu-head-right { margin-left:auto; display:flex; align-items:center; gap:18px; }
.cu-stat { text-align:right; }
.cu-stat .l { color:#666; font-size:9px; letter-spacing:0.12em; }
.cu-stat .v { font-size:13px; margin-top:2px; color:#d4d4d4; }
.cu-stat .v.gold { color:#d4b87a; font-weight:600; }
.cu-x { border:0.5px solid rgba(255,255,255,0.15); color:#888; width:26px; height:26px; border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; }
.cu-body { flex:1; overflow-y:auto; padding:20px 22px; }
.cu-sec { font-size:12px; letter-spacing:0.12em; color:#888; text-transform:uppercase; margin:18px 0 10px; }
.cu-sec:first-child { margin-top:0; }
.cu-sec .c { color:#666; margin-left:auto; font-size:10px; }
.cu-sec-row { display:flex; align-items:baseline; }
.cu-name { width:100%; background:transparent; border:none; border-bottom:1px solid rgba(212,184,122,0.35); color:#fff; font-size:20px; font-weight:600; outline:none; padding:4px 0; font-family:inherit; }
.cu-name::placeholder { color:#444; font-style:italic; }
.cu-hint { font-size:10px; color:#666; margin-top:6px; font-style:italic; }
.cu-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.cu-slot { background:#121212; border:0.5px dashed rgba(255,255,255,0.14); border-radius:4px; min-height:96px; padding:12px; cursor:pointer; display:flex; flex-direction:column; }
.cu-slot.empty { align-items:center; justify-content:center; color:#555; font-size:11px; letter-spacing:0.08em; }
.cu-slot.filled { border-style:solid; cursor:default; }
.cu-slot .sn { font-size:9px; letter-spacing:0.12em; color:#555; display:flex; justify-content:space-between; }
.cu-slot .sx { color:#777; cursor:pointer; }
.cu-slot .st { font-size:13px; font-weight:600; color:#fff; margin-top:6px; }
.cu-slot .sm { font-size:11px; color:#888; margin-top:2px; }
.cu-slot .sc { color:#d4b87a; font-size:12px; font-weight:600; margin-top:auto; }
.cu-pick { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-top:10px; }
.cu-opt { background:#141414; border:0.5px solid rgba(255,255,255,0.12); border-radius:3px; padding:10px 12px; cursor:pointer; }
.cu-opt:hover { border-color:rgba(212,184,122,0.4); }
.cu-opt .on { font-size:13px; font-weight:600; color:#fff; display:flex; justify-content:space-between; }
.cu-opt .om { font-size:10px; color:#888; margin-top:4px; }
.cu-sum { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:20px; background:#0f0f0f; border:0.5px solid rgba(212,184,122,0.2); border-radius:4px; padding:16px 18px; }
.cu-sum .l { font-size:9px; color:#666; letter-spacing:0.12em; }
.cu-sum .v { font-size:20px; font-weight:600; color:#fff; margin-top:4px; }
.cu-sum .v.gold { color:#d4b87a; }
.cu-sum .v.warn { color:#c47a7a; }
.cu-sum .s { font-size:10px; color:#888; margin-top:3px; }
.cu-foot { display:flex; align-items:center; gap:16px; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
.cu-foot .fm { font-size:10px; letter-spacing:0.08em; color:#666; }
.cu-foot .fm .gold { color:#d4b87a; font-weight:600; }
.cu-foot .fm .warn { color:#c47a7a; font-weight:600; }
.cu-foot .fm .ok { color:#9eb87a; font-weight:600; }
.cu-acts { margin-left:auto; display:flex; gap:8px; }
.cu-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; font-family:inherit; }
.cu-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; background:transparent; }
.cu-btn.pri { background:#3a2f1a; border:0.5px solid #d4b87a; color:#d4b87a; font-weight:600; }
.cu-btn.pri.off { opacity:0.4; pointer-events:none; }
.oob-unit { background:#101010; border:0.5px solid rgba(255,255,255,0.08); border-left:2px solid #555; border-radius:4px; padding:12px 16px; margin-bottom:8px; font-family:var(--font-mono,monospace); }
.oob-unit.forming { border-left-color:#d4a23a; }
.oob-unit.active { border-left-color:#7a9aab; }
.oob-top { display:flex; align-items:center; gap:12px; cursor:pointer; }
.oob-name { font-size:14px; font-weight:600; color:#fff; }
.oob-sub { font-size:10px; color:#888; letter-spacing:0.06em; }
.oob-pill { font-size:9px; font-weight:700; letter-spacing:0.1em; padding:3px 8px; border-radius:2px; text-transform:uppercase; }
.oob-pill.forming { color:#d4a23a; background:rgba(212,162,58,0.12); }
.oob-pill.active { color:#9eb87a; background:rgba(158,184,122,0.12); }
.oob-brigs { margin-top:8px; padding-top:8px; border-top:0.5px solid rgba(255,255,255,0.06); display:none; }
.oob-brigs.open { display:block; }
.oob-brig { font-size:11px; color:#aaa; padding:3px 0; display:flex; gap:10px; }
.oob-empty { font-size:11px; color:#666; font-style:italic; padding:8px 2px; }
.oob-army-type { font-size:9px; font-weight:700; letter-spacing:0.1em; padding:2px 7px; border-radius:2px; text-transform:uppercase; margin-left:8px; }
.oob-army-type.guard { color:#d4b87a; background:rgba(212,184,122,0.14); }
.oob-army-type.paramilitary { color:#9a9a9a; background:rgba(160,160,160,0.12); }
.oob-army-type.regular { color:#7a9aab; background:rgba(122,154,171,0.12); }
.ca-row { display:flex; align-items:center; gap:12px; background:#121212; border:0.5px solid rgba(255,255,255,0.1); border-radius:4px; padding:10px 12px; margin-bottom:6px; cursor:pointer; }
.ca-row.sel { border-color:rgba(212,184,122,0.5); background:#161412; }
.ca-check { width:16px; height:16px; border-radius:3px; border:0.5px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; color:#d4b87a; font-size:11px; flex:0 0 auto; }
.ca-row.sel .ca-check { border-color:#d4b87a; }
.ca-row .un { font-size:13px; font-weight:600; color:#fff; }
.ca-row .us { font-size:10px; color:#888; margin-top:2px; }
.ford-intel { font-size:10px; color:#9a8a6a; margin-top:5px; letter-spacing:0.03em; }
.ford-intel b { color:#d4b87a; font-weight:600; }
.ca-type { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:10px; }
.ca-typeopt { background:#141414; border:0.5px solid rgba(255,255,255,0.12); border-radius:4px; padding:10px 12px; cursor:pointer; }
.ca-typeopt.sel { border-color:#d4b87a; background:#161412; }
.ca-typeopt .tn { font-size:13px; font-weight:600; color:#fff; }
.ca-typeopt .td { font-size:10px; color:#888; margin-top:4px; line-height:1.4; }
`;function F(){if(document.getElementById("cu-styles"))return;const t=document.createElement("style");t.id="cu-styles",t.textContent=K,document.head.appendChild(t)}async function B(t){let d=[],e=0,n=[];try{const{data:c,error:y}=await q.from("army_units").select("id,name,brigades,total_manpower,status,forming_until_tick,construction_cost,army_id").eq("faction_id",t.id).neq("status","Decommissioned").order("created_at",{ascending:!0});y?console.warn("[create-unit] units load failed:",y.message):d=c||[];const{data:w,error:v}=await q.from("armies").select("id,name,army_type,created_at_tick,assigned_front_id,supply_balance").eq("faction_id",t.id).order("created_at_tick",{ascending:!0});v?console.warn("[create-unit] armies load failed:",v.message):n=w||[];const{data:S,error:l}=await q.from("factions").select("party_funds").eq("id",t.id).maybeSingle();l&&console.warn("[create-unit] army funds load failed:",l.message),e=Number(S?.party_funds)||0}catch(c){console.warn("[create-unit] load failed:",c?.message||c)}return{units:d,funds:e,armies:n}}async function R(t){const d={byUnit:new Map,armed:0};if(!t||!t.length)return d;try{const{data:e,error:n}=await q.from("army_brigade_equipment").select("army_unit_id, brigade_index, quantity, rifle_model_id, rifle_models(name, soldiers_per_rifle)").in("army_unit_id",t);if(n)return console.warn("[create-unit] brigade equipment load failed:",n.message),d;for(const c of e||[])d.byUnit.has(c.army_unit_id)||d.byUnit.set(c.army_unit_id,[]),d.byUnit.get(c.army_unit_id).push(c),d.armed+=(Number(c.quantity)||0)*(Number(c.rifle_models?.soldiers_per_rifle)||0)}catch(e){console.warn("[create-unit] brigade equipment load failed:",e?.message||e)}return d}async function X(t){if(!t)return[];try{const{data:d,error:e}=await q.from("army_rifle_inventory").select("rifle_model_id, quantity, rifle_models(name)").eq("faction_id",t).gt("quantity",0);return e?(console.warn("[create-unit] on-hand rifles load failed:",e.message),[]):d||[]}catch(d){return console.warn("[create-unit] on-hand rifles load failed:",d?.message||d),[]}}function j(t){const d=M[t]?.mp||0;return Math.ceil(d/1e3)}function Y(t){return Math.max(0,Math.round(Number(t?.army_manpower)||0))}function G(t){return t.reduce((d,e)=>d+(Number(e.total_manpower)||0),0)}function Z(t){return t.reduce((d,e)=>d+(Array.isArray(e.brigades)?e.brigades.length:0),0)}function re(t,d){if(!t?.id)return;F();let e=document.getElementById("cu-overlay");e||(e=document.createElement("div"),e.id="cu-overlay",e.className="cu-overlay",document.body.appendChild(e));let n=[],c=!1,y=!1,w=[],v=0;const S=()=>Y(t)-G(w);function l(){e.style.display="none",e.innerHTML="",e.onclick=null}function h(){e.innerHTML=`<div class="cu-modal">
      <div class="cu-head">
        <div>
          <div class="cu-eyebrow">— ARMY ACTION —</div>
          <div class="cu-title">Create <em>Unit</em></div>
        </div>
        <div class="cu-head-right">
          <div class="cu-stat"><div class="l">ACTION COST</div><div class="v gold">${T(k)}</div></div>
          <div class="cu-stat"><div class="l">ARMY FUNDS</div><div class="v">${T(v)}</div></div>
          <div class="cu-x" data-cu="close">×</div>
        </div>
      </div>
      <div class="cu-body">
        <div class="cu-sec">I. Unit Designation</div>
        <input class="cu-name" id="cu-name" maxlength="80" placeholder="e.g. 4th Mechanized Division" />
        <div class="cu-hint">Names are public — they appear on the Order of Battle and in records.</div>
        <div id="cu-dyn"></div>
      </div>
    </div>`,m()}function m(){const i=e.querySelector("#cu-dyn");if(!i)return;const o=n.reduce((g,E)=>g+(M[E]?.mp||0),0),s=n.reduce((g,E)=>g+(M[E]?.cost||0),0),p=s+k,r=S(),x=o<=r,_=p<=v,f=n.length>=1,a=f&&x&&_;let u="";for(let g=0;g<6;g++){const E=n[g];if(E){const N=M[E];u+=`<div class="cu-slot filled" style="border-color:rgba(212,184,122,0.35);background:#161412;">
          <div class="sn"><span>SLOT ${g+1}</span><span class="sx" data-cu="rm:${g}">×</span></div>
          <div class="st">${A(N.name)}</div>
          <div class="sm">${N.mp.toLocaleString()} manpower</div>
          <div class="sc">${T(N.cost)}</div>
        </div>`}else n.length===g?u+=`<div class="cu-slot empty" data-cu="addslot"><div style="font-size:20px;color:#444;">+</div><div>SLOT ${g+1}${g===5?" — OPTIONAL":" — ADD BRIGADE"}</div></div>`:u+=`<div class="cu-slot empty" style="opacity:0.35;cursor:default;"><div>SLOT ${g+1}</div></div>`}let $="";c&&n.length<6&&($='<div class="cu-pick">'+H.map(g=>{const E=M[g];return`<div class="cu-opt" data-cu="pick:${g}">
          <div class="on"><span>${A(E.name)}</span><span style="color:#d4b87a;">${T(E.cost)}</span></div>
          <div class="om">${E.mp.toLocaleString()} manpower${g==="support"?" · HQ / logistics / medical":""}</div>
        </div>`}).join("")+"</div>"),i.innerHTML=`
      <div class="cu-sec-row"><span class="cu-sec">II. Brigade Composition</span><span class="cu-sec c">${n.length} OF 6 SLOTS FILLED</span></div>
      <div class="cu-grid">${u}</div>
      ${$}
      <div class="cu-sec">III. Unit Summary</div>
      <div class="cu-sum">
        <div><div class="l">TOTAL MANPOWER</div><div class="v ${x?"":"warn"}">${o.toLocaleString()}</div><div class="s">${r.toLocaleString()} available</div></div>
        <div><div class="l">CONSTRUCTION</div><div class="v gold">${T(s)}</div><div class="s">+ ${T(k)} action fee</div></div>
        <div><div class="l">TOTAL OUTLAY</div><div class="v ${_?"gold":"warn"}">${T(p)}</div><div class="s">of ${T(v)} available</div></div>
      </div>
      <div class="cu-foot" style="margin:18px -22px -20px;">
        <div class="fm">STATUS: <span class="${f?"gold":"warn"}">${f?"READY TO COMMISSION":"ADD AT LEAST ONE BRIGADE"}</span></div>
        <div class="fm">MANPOWER: <span class="${x?"ok":"warn"}">${x?"SUFFICIENT":"INSUFFICIENT"}</span></div>
        <div class="cu-acts">
          <div class="cu-btn sec" data-cu="cancel">CANCEL</div>
          <div class="cu-btn pri ${a?"":"off"}" data-cu="create">CREATE UNIT — ${T(p)} →</div>
        </div>
      </div>`}async function b(){if(y)return;const i=(e.querySelector("#cu-name")?.value||"").trim();if(!i){alert("Enter a unit name.");return}if(n.length<1){alert("Add at least one brigade.");return}y=!0;try{const{data:o,error:s}=await q.rpc("create_unit",{p_faction_id:t.id,p_name:i,p_brigades:n});if(s){alert("Failed to create unit: "+s.message);return}if(o&&o.success===!1){alert(o.error||"Could not create unit.");return}l(),alert(`${i} commissioned — Forming, ready in 2 ticks.`)}finally{y=!1}}e.onclick=i=>{const o=i.target.closest("[data-cu]");if(!o){i.target===e&&l();return}const s=o.getAttribute("data-cu");if(s==="close"||s==="cancel")return l();if(s==="addslot")return c=!0,m();if(s.startsWith("pick:"))return n.length<6&&n.push(s.slice(5)),c=!1,m();if(s.startsWith("rm:"))return n.splice(Number(s.slice(3)),1),m();if(s==="create")return b()},e.style.display="flex",e.innerHTML='<div class="cu-modal"><div class="cu-body"><div class="cu-sec">Loading…</div></div></div>',B(t).then(i=>{w=i.units,v=i.funds,h()})}function de(t,d){if(!t?.id)return;F();let e=document.getElementById("ca-overlay");e||(e=document.createElement("div"),e.id="ca-overlay",e.className="cu-overlay",document.body.appendChild(e));let n=[],c=0,y="regular",w=!1;const v=new Set,S=()=>n.filter(i=>!i.army_id);function l(){e.style.display="none",e.innerHTML="",e.onclick=null}function h(){e.innerHTML=`<div class="cu-modal">
      <div class="cu-head">
        <div>
          <div class="cu-eyebrow">— ARMY ACTION —</div>
          <div class="cu-title">Create <em>Army</em></div>
        </div>
        <div class="cu-head-right">
          <div class="cu-stat"><div class="l">ACTION COST</div><div class="v gold">${T(k)}</div></div>
          <div class="cu-stat"><div class="l">ARMY FUNDS</div><div class="v">${T(c)}</div></div>
          <div class="cu-x" data-ca="close">×</div>
        </div>
      </div>
      <div class="cu-body">
        <div class="cu-sec">I. Army Designation</div>
        <input class="cu-name" id="ca-name" maxlength="80" placeholder="e.g. 1st Army of Avelia" />
        <div class="cu-hint">Take units within your faction and form them into a cohesive fighting force. Names are public.</div>
        <div id="ca-dyn"></div>
      </div>
    </div>`,m()}function m(){const i=e.querySelector("#ca-dyn");if(!i)return;const o=S(),s=k<=c,p=v.size>=1,r=p&&s,x=J.map(f=>{const a=U[f];return`<div class="ca-typeopt ${y===f?"sel":""}" data-ca="type:${f}">
        <div class="tn">${A(a.label)}</div>
        <div class="td">${A(a.desc)}</div>
      </div>`}).join(""),_=o.length?o.map(f=>{const a=v.has(f.id),u=Array.isArray(f.brigades)?f.brigades:[],$=f.status==="Forming"?" · Forming":"";return`<div class="ca-row ${a?"sel":""}" data-ca="unit:${C(f.id)}">
            <div class="ca-check">${a?"✓":""}</div>
            <div style="flex:1;min-width:0;">
              <div class="un">${A(f.name)}</div>
              <div class="us">${u.length} BRIGADE${u.length===1?"":"S"} · ${(Number(f.total_manpower)||0).toLocaleString()} PERSONNEL · ${A(P(f.brigades))}${$}</div>
            </div>
          </div>`}).join(""):'<div class="oob-empty">No unassigned units. Commission units with Create Unit first, or they’re all already in an army.</div>';i.innerHTML=`
      <div class="cu-sec">II. Type</div>
      <div class="ca-type">${x}</div>
      <div class="cu-sec-row"><span class="cu-sec">III. Assigned Units</span><span class="cu-sec c">${v.size} SELECTED</span></div>
      ${_}
      <div class="cu-foot" style="margin:18px -22px -20px;">
        <div class="fm">STATUS: <span class="${p?"gold":"warn"}">${p?"READY TO FORM":"SELECT AT LEAST ONE UNIT"}</span></div>
        <div class="fm">FUNDS: <span class="${s?"ok":"warn"}">${s?"SUFFICIENT":"INSUFFICIENT"}</span></div>
        <div class="cu-acts">
          <div class="cu-btn sec" data-ca="cancel">CANCEL</div>
          <div class="cu-btn pri ${r?"":"off"}" data-ca="create">CREATE ARMY — ${T(k)} →</div>
        </div>
      </div>`}async function b(){if(w)return;const i=(e.querySelector("#ca-name")?.value||"").trim();if(!i){alert("Enter an army name.");return}if(v.size<1){alert("Select at least one unit.");return}w=!0;try{const{data:o,error:s}=await q.rpc("create_army",{p_faction_id:t.id,p_name:i,p_type:y,p_unit_ids:[...v]});if(s){alert("Failed to create army: "+s.message);return}if(o&&o.success===!1){alert(o.error||"Could not create army.");return}l(),alert(`${i} formed — ${v.size} unit${v.size===1?"":"s"} assigned.`)}finally{w=!1}}e.onclick=i=>{const o=i.target.closest("[data-ca]");if(!o){i.target===e&&l();return}const s=o.getAttribute("data-ca");if(s==="close"||s==="cancel")return l();if(s.startsWith("type:"))return y=s.slice(5),m();if(s.startsWith("unit:")){const p=s.slice(5);return v.has(p)?v.delete(p):v.add(p),m()}if(s==="create")return b()},e.style.display="flex",e.innerHTML='<div class="cu-modal"><div class="cu-body"><div class="cu-sec">Loading…</div></div></div>',B(t).then(i=>{n=i.units,c=i.funds,h()})}function z(t,d){return t.nation_a_id===d?t.nation_b_id:t.nation_a_id}function W(t,d,e){const n=e(z(t,d));return`${n&&n.name||"Border"} Front ${t.label}`}function ee(t){return t?(Array.isArray(t.nation_profiles)?t.nation_profiles[0]?.flag_url:t.nation_profiles?.flag_url)||t.flag_url||`assets/flags/${t.name}.png`:""}function D(t,d){const e=new Map((t||[]).map(c=>[c.id,c.assigned_front_id])),n=new Map;for(const c of d||[]){const y=e.get(c.army_id);y&&n.set(y,(n.get(y)||0)+1)}return n}function ce(t,d){if(!t?.id)return;F();let e=document.getElementById("asn-overlay");e||(e=document.createElement("div"),e.id="asn-overlay",e.className="cu-overlay",document.body.appendChild(e));const n=1e6;let c=[],y=[],w=new Map,v=new Map,S=new Map,l=new Set,h=0,m=null,b=null,i=!1;const o=()=>{e.style.display="none",e.innerHTML="",e.onclick=null},s=r=>W(r,t.nation_id,x=>w.get(x));function p(){const r=h>=n,x=c.length?c.map(a=>{const u=a.assigned_front_id?y.find(g=>g.id===a.assigned_front_id):null,$=m===a.id;return`<div class="ca-row ${$?"sel":""}" data-asn="army:${C(a.id)}">
            <div class="ca-check">${$?"✓":""}</div>
            <div style="flex:1;min-width:0;"><div class="un">${A(a.name)}</div>
            <div class="us">${A(U[a.army_type]&&U[a.army_type].short||a.army_type)} · Currently: ${A(u?s(u):"Unassigned")}</div></div>
          </div>`}).join(""):'<div class="oob-empty">No armies yet. Use Create Army to form one first.</div>',_=y.length?y.map(a=>{const u=b===a.id,$=z(a,t.nation_id),g=w.get($),E=ee(g),N=g&&g.name||"Border",I=v.get(a.id)||0,L=S.get(a.id)||0,O=l.has($)?'<span style="color:#e5534b;font-weight:700;margin-left:6px;">[AT WAR]</span>':'<span style="color:#46c46a;font-weight:700;margin-left:6px;">[PEACE]</span>';return`<div class="ca-row ${u?"sel":""}" data-asn="front:${C(a.id)}">
            <div class="ca-check">${u?"✓":""}</div>
            ${E?`<img src="${C(E)}" alt="" style="width:26px;height:18px;object-fit:cover;border-radius:2px;flex:none;" onerror="this.style.display='none'">`:""}
            <div style="flex:1;min-width:0;"><div class="un">${A(N)} Front ${A(a.label)}${O}</div>
            <div class="us">${I} unit${I===1?"":"s"} deployed · ${Number(a.sector_count)||0} sectors</div>
            <div class="us">Opposing Units in this Sector: ${L}</div></div>
          </div>`}).join(""):'<div class="oob-empty">No land fronts border your nation yet.</div>',f=!!m&&!!b&&r&&!i;e.innerHTML=`<div class="cu-modal">
      <div class="cu-head">
        <div><div class="cu-eyebrow">— ARMY ACTION —</div><div class="cu-title">Assign Army to <em>Theater</em></div></div>
        <div class="cu-head-right">
          <div class="cu-stat"><div class="l">ACTION COST</div><div class="v gold">${T(n)}</div></div>
          <div class="cu-stat"><div class="l">ARMY FUNDS</div><div class="v">${T(h)}</div></div>
          <div class="cu-x" data-asn="close">×</div>
        </div>
      </div>
      <div class="cu-body">
        <div class="cu-sec-row"><span class="cu-sec">I. Army</span><span class="cu-sec c">${m?"1":"0"} SELECTED</span></div>
        ${x}
        <div class="cu-sec-row" style="margin-top:14px;"><span class="cu-sec">II. Front</span><span class="cu-sec c">${b?"1":"0"} SELECTED</span></div>
        ${_}
        <div class="asn-err" id="asn-err" hidden style="margin-top:10px;font-family:var(--font-mono,monospace);font-size:11px;color:#c47a7a;"></div>
        <div class="cu-foot" style="margin:18px -22px -20px;">
          <div class="fm">FUNDS: <span class="${r?"ok":"warn"}">${r?"SUFFICIENT":"INSUFFICIENT"}</span></div>
          <div class="cu-acts">
            <div class="cu-btn sec" data-asn="cancel">CANCEL</div>
            <div class="cu-btn pri ${f?"":"off"}" data-asn="assign">ASSIGN — ${T(n)} →</div>
          </div>
        </div>
      </div>`}e.onclick=async r=>{if(r.target===e){i||o();return}const x=r.target.closest("[data-asn]");if(!x)return;const _=x.getAttribute("data-asn");if(_==="close"||_==="cancel"){i||o();return}if(_.startsWith("army:")){i||(m=_.slice(5),p());return}if(_.startsWith("front:")){i||(b=_.slice(6),p());return}if(_==="assign"){if(!m||!b||h<n||i)return;i=!0,p();try{const{data:f,error:a}=await q.rpc("assign_army_to_front",{p_army_id:m,p_front_id:b});if(a||f&&f.success===!1){i=!1,p();const u=document.getElementById("asn-err");u&&(u.textContent=f&&f.error||a?.message||"Assignment failed.",u.hidden=!1)}else o()}catch(f){i=!1,p();const a=document.getElementById("asn-err");a&&(a.textContent=f?.message||"Assignment failed.",a.hidden=!1)}}},e.style.display="flex",e.innerHTML='<div class="cu-modal"><div class="cu-body"><div class="cu-sec">Loading…</div></div></div>',(async()=>{try{const[r,x,_,f]=await Promise.all([q.from("armies").select("id, name, army_type, assigned_front_id").eq("faction_id",t.id).order("created_at_tick",{ascending:!0}),q.from("war_fronts").select("id, label, nation_a_id, nation_b_id, sector_count").eq("front_type","land").or(`nation_a_id.eq.${t.nation_id},nation_b_id.eq.${t.nation_id}`),q.from("army_units").select("army_id").eq("faction_id",t.id).neq("status","Decommissioned"),q.from("factions").select("party_funds").eq("id",t.id).maybeSingle()]);r.error&&console.warn("[assign-army] armies load:",r.error.message),x.error&&console.warn("[assign-army] fronts load:",x.error.message),c=r.data||[],y=x.data||[],h=Number(f.data?.party_funds)||0,v=D(c,_.data);const a=[...new Set(y.map(I=>z(I,t.nation_id)))],u=y.map(I=>I.id),[$,g,E]=await Promise.all([a.length?q.from("nations").select("id, name, flag_url, nation_profiles(flag_url)").in("id",a):Promise.resolve({data:[]}),u.length?q.from("armies").select("id, assigned_front_id").in("assigned_front_id",u).neq("nation_id",t.nation_id):Promise.resolve({data:[]}),a.length?q.from("diplomatic_relations").select("nation_a_id, nation_b_id").eq("relation_type","war").or(`nation_a_id.eq.${t.nation_id},nation_b_id.eq.${t.nation_id}`):Promise.resolve({data:[]})]);for(const I of $.data||[])w.set(I.id,I);for(const I of E.data||[])l.add(I.nation_a_id===t.nation_id?I.nation_b_id:I.nation_a_id);const N=g.data||[];if(N.length){const{data:I,error:L}=await q.from("army_units").select("army_id").in("army_id",N.map(O=>O.id)).neq("status","Decommissioned");L&&console.warn("[assign-army] opposing units load:",L.message),S=D(N,I)}y.sort((I,L)=>s(I).localeCompare(s(L)))}catch(r){console.warn("[assign-army] load failed:",r?.message||r)}p()})()}function le(t,d){if(!t?.id)return;F();let e=document.getElementById("ford-overlay");e||(e=document.createElement("div"),e.id="ford-overlay",e.className="cu-overlay",document.body.appendChild(e));let n=[],c=!1;const y=()=>{e.style.display="none",e.innerHTML="",e.onclick=null},w=l=>(l.nation_a_id===t.nation_id?l.action_a:l.action_b)==="assault"?"assault":"defend",v=l=>{const h=Number(l)||0;if(h<=0)return 0;const m=Math.random()<.5?-1:1;return Math.max(0,Math.round(h*(1+m*(1+Math.floor(Math.random()*10))/100)))};function S(){const l=n.length?n.map(h=>{const m=h.front,b=w(m),i=h.intel;return`<div class="ca-row">
            <div style="flex:1;min-width:0;">
              <div class="un">${A(h.army.name)}</div>
              <div class="us">${A(h.frontName)} Front ${A(m.label||"")} · ${Number(m.sector_count)||0} sectors</div>
              <div class="ford-intel">Estimated Enemy Intelligence in Front: <b>${i.soldiers.toLocaleString()}</b> Soldiers, <b>${i.vehicles.toLocaleString()}</b> Vehicles, <b>${i.tanks.toLocaleString()}</b> Tanks</div>
            </div>
            <div style="display:flex;gap:6px;flex:none;">
              <div class="cu-btn ${b==="assault"?"pri":"sec"} ${c?"off":""}" data-ford="assault:${C(m.id)}">ASSAULT</div>
              <div class="cu-btn ${b==="defend"?"pri":"sec"} ${c?"off":""}" data-ford="defend:${C(m.id)}">DEFEND</div>
            </div>
          </div>`}).join(""):'<div class="oob-empty">No armies deployed to a front. Use Assign Army to Theater first.</div>';e.innerHTML=`<div class="cu-modal">
      <div class="cu-head">
        <div><div class="cu-eyebrow">— ARMY ACTION —</div><div class="cu-title">Army <em>Orders</em></div></div>
        <div class="cu-head-right"><div class="cu-x" data-ford="close">×</div></div>
      </div>
      <div class="cu-body">
        <div class="cu-sec-row"><span class="cu-sec">Posture next tick</span><span class="cu-sec c">ASSAULT advances · DEFEND holds</span></div>
        ${l}
        <div class="asn-err" id="ford-err" hidden style="margin-top:10px;font-family:var(--font-mono,monospace);font-size:11px;color:#c47a7a;"></div>
      </div></div>`}e.onclick=async l=>{if(l.target===e){c||y();return}const h=l.target.closest("[data-ford]");if(!h)return;const m=h.getAttribute("data-ford");if(m==="close"){c||y();return}if(c)return;const[b,i]=m.split(":"),o=n.find(s=>s.front&&s.front.id===i)?.front;if(!(!o||w(o)===b)){c=!0,S();try{const{data:s,error:p}=await q.rpc("set_front_action",{p_front_id:i,p_action:b});if(p||s&&s.success===!1){const r=document.getElementById("ford-err");r&&(r.textContent=s&&s.error||p?.message||"Could not set order.",r.hidden=!1)}else o.nation_a_id===t.nation_id?o.action_a=b:o.action_b=b}catch(s){const p=document.getElementById("ford-err");p&&(p.textContent=s?.message||"Could not set order.",p.hidden=!1)}c=!1,S()}},e.style.display="flex",e.innerHTML='<div class="cu-modal"><div class="cu-body"><div class="cu-sec">Loading…</div></div></div>',(async()=>{try{const{data:l,error:h}=await q.from("armies").select("id, name, assigned_front_id").eq("nation_id",t.nation_id).not("assigned_front_id","is",null);if(h)throw h;const m=l||[],b=[...new Set(m.map(a=>a.assigned_front_id))];if(!b.length){n=[],S();return}const{data:i}=await q.from("war_fronts").select("id, label, nation_a_id, nation_b_id, sector_count, action_a, action_b").in("id",b),o=new Map((i||[]).map(a=>[a.id,a])),s=[...new Set((i||[]).map(a=>z(a,t.nation_id)))],p=new Map;if(s.length){const{data:a}=await q.from("nations").select("id, name").in("id",s);for(const u of a||[])p.set(u.id,u.name)}const r=new Map,{data:x}=await q.from("armies").select("id, assigned_front_id").in("assigned_front_id",b).neq("nation_id",t.nation_id),_=new Map((x||[]).map(a=>[a.id,a.assigned_front_id])),f=[..._.keys()];if(f.length){const{data:a}=await q.from("army_units").select("army_id, total_manpower").in("army_id",f).neq("status","Decommissioned");for(const u of a||[]){const $=_.get(u.army_id);$&&r.set($,(r.get($)||0)+(Number(u.total_manpower)||0))}}n=m.map(a=>{const u=o.get(a.assigned_front_id);return u?{army:a,front:u,frontName:p.get(z(u,t.nation_id))||"Border",intel:{soldiers:v(r.get(a.assigned_front_id)||0),vehicles:0,tanks:0}}:null}).filter(Boolean),n.sort((a,u)=>String(a.army.name).localeCompare(String(u.army.name)))}catch(l){console.warn("[army-orders] load failed:",l?.message||l)}S()})()}async function te(t,d){const e={},n=[...new Set((d||[]).map(c=>c.assigned_front_id).filter(Boolean))];if(!n.length)return e;try{const{data:c}=await q.from("war_fronts").select("id, label, nation_a_id, nation_b_id").in("id",n),y=c||[],w={};for(const l of y)w[l.id]=l;const v=[...new Set(y.map(l=>z(l,t.nation_id)))],S={};if(v.length){const{data:l}=await q.from("nations").select("id, name").in("id",v);for(const h of l||[])S[h.id]=h}for(const l of d||[]){const h=l.assigned_front_id&&w[l.assigned_front_id];h&&(e[l.id]=W(h,t.nation_id,m=>S[m]))}}catch(c){console.warn("[create-unit] army fronts load failed:",c?.message||c)}return e}async function pe(t,d){if(!d)return;F();const e=new Set;let n=[],c=0,y=[],w={byUnit:new Map,armed:0},v={};function S(i){const o=String(i||"?").trim().split(/\s+/).filter(Boolean);return((o[0]?.[0]||"?")+(o[1]?.[0]||"")).toUpperCase()}function l(){const i=Y(t),o=G(n),s=Z(n),p=Math.min(w.armed,o);let r=`<div class="cu-sum" style="margin-bottom:16px;">
      <div><div class="l">PERSONNEL</div><div class="v">${o.toLocaleString()}</div><div class="s">committed of ${i.toLocaleString()}</div></div>
      <div><div class="l">EQUIPPED</div><div class="v${o>0&&p<o?" warn":""}">${p.toLocaleString()}</div><div class="s">armed of ${o.toLocaleString()} · rifles</div></div>
      <div><div class="l">ORDER OF BATTLE</div><div class="v">${s}</div><div class="s">${n.length} unit${n.length===1?"":"s"} · brigades</div></div>
      <div><div class="l">DEFENSE BUDGET</div><div class="v gold">${T(c)}</div><div class="s">discretionary</div></div>
    </div>`;if(n.length===0){r+='<div class="oob-empty">No units yet. Use the Chief of Staff’s Create Unit action to commission your first formation.</div>',d.innerHTML=r;return}const x=new Set(y.map(a=>a.id)),_=n.filter(a=>!a.army_id||!x.has(a.army_id)),f=new Map;for(const a of n)!a.army_id||!x.has(a.army_id)||(f.has(a.army_id)||f.set(a.army_id,[]),f.get(a.army_id).push(a));for(const a of y){const u=f.get(a.id)||[];if(!u.length)continue;const $=U[a.army_type],g=a.supply_balance,E=g==null?"":Number(g)<0?`<span class="cu-sec c" style="color:#e5534b;">⚠ Under-supplied ${Number(g)}</span>`:`<span class="cu-sec c" style="color:#46c46a;">✓ Supplied +${Number(g)}</span>`;r+=`<div class="cu-sec-row"><span class="cu-sec">${A(a.name)}</span><span class="oob-army-type ${C(a.army_type)}">${A($?$.short:a.army_type)}</span>`+(v[a.id]?`<span class="cu-sec c" style="color:#c89e6e;">▸ ${A(v[a.id])}</span>`:"")+E+`<span class="cu-sec c">${u.length} unit${u.length===1?"":"s"}</span></div>`;for(const N of u)r+=h(N,a.army_type)}if(_.length){r+='<div class="cu-sec">Reserves</div>';for(const a of _)r+=h(a,null)}d.innerHTML=r}function h(i,o){const s=Array.isArray(i.brigades)?i.brigades:[],p=i.status==="Forming",r=e.has(i.id),x=new Map((w.byUnit.get(i.id)||[]).map(a=>[a.brigade_index,Number(a.quantity)||0])),_=P(s),f=p?`<span class="oob-pill forming">Forming · Ready in ${Q(Number(i.forming_until_tick))}</span>`:`<span class="oob-pill active" style="color:#46c46a;">[Active]</span><span class="oob-upkeep" style="color:#e5534b;font-weight:600;margin-left:6px;">(-$${V(i.construction_cost,o)})</span>`;return`<div class="oob-unit ${p?"forming":"active"}">
        <div class="oob-top" data-uid="${C(i.id)}">
          <span class="oob-pill" style="background:#222;color:#bbb;">${A(S(i.name))}</span>
          <div style="flex:1;">
            <div class="oob-name">${A(i.name)}</div>
            <div class="oob-sub">${s.length} BRIGADE${s.length===1?"":"S"} · ${(Number(i.total_manpower)||0).toLocaleString()} PERSONNEL</div>
          </div>
          ${f}
          <span style="color:#666;">${r?"▾":"▸"}</span>
        </div>
        <div class="oob-brigs ${r?"open":""}">
          <div class="oob-sub" style="margin-bottom:4px;">${A(_)}</div>
          ${s.map((a,u)=>{const $=M[a],g=j(a),E=x.get(u)||0,N=g>0?`<span style="color:${E>=g?"#46c46a":E>0?"#c8a832":"#888"};">${E}/${g} rifles</span>`:"";return`<div class="oob-brig"><span style="color:#666;">${u+1}/${s.length}</span><span style="color:#fff;">${$?A($.name):A(a)}</span><span>${$?$.mp.toLocaleString():"0"} manpower</span>${N}</div>`}).join("")}
          <button class="oob-equip" data-equip-uid="${C(i.id)}" style="margin-top:8px;font-family:var(--font-mono,monospace);font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:7px 14px;border-radius:3px;cursor:pointer;background:rgba(182,83,63,0.14);border:1px solid var(--army,#b6533f);color:#e0a090;">Equip</button>
        </div>
      </div>`}const m=async()=>{w=await R(n.map(i=>i.id)),l()};d.onclick=i=>{const o=i.target.closest("[data-equip-uid]");if(o){i.stopPropagation();const r=n.find(x=>x.id===o.getAttribute("data-equip-uid"));r&&ie(r,t,m);return}const s=i.target.closest("[data-uid]");if(!s)return;const p=s.getAttribute("data-uid");e.has(p)?e.delete(p):e.add(p),l()},d.innerHTML='<div class="oob-empty">Loading order of battle…</div>';const b=await B(t);n=b.units,c=b.funds,y=b.armies||[],w=await R(n.map(i=>i.id)),v=await te(t,y),l()}function ae(){if(document.getElementById("eq-modal-styles"))return;const t=document.createElement("style");t.id="eq-modal-styles",t.textContent=`
    .eq-list{display:flex;flex-direction:column;gap:8px;margin-top:12px;}
    .eq-row{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:12px;padding:10px 12px;background:#0f0f0f;border:0.5px solid rgba(255,255,255,0.08);border-radius:5px;}
    .eq-row .eq-name{font-size:13px;font-weight:600;color:#fff;}
    .eq-row .eq-mp{font-family:var(--font-mono,monospace);font-size:10px;color:#888;margin-top:2px;}
    .eq-count{font-family:var(--font-mono,monospace);font-size:13px;font-weight:700;color:#888;}
    .eq-count.part{color:#c8a832;} .eq-count.full{color:#46c46a;}
    .eq-ctl{display:flex;align-items:center;gap:6px;}
    .eq-model{background:#1a1a17;border:0.5px solid rgba(255,255,255,0.15);border-radius:3px;color:#f0efe6;font-family:var(--font-mono,monospace);font-size:11px;padding:5px 7px;max-width:200px;}
    .eq-btn{font-family:var(--font-mono,monospace);font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:6px 11px;border-radius:3px;cursor:pointer;border:1px solid;}
    .eq-btn.equip{background:rgba(182,83,63,0.16);border-color:var(--army,#b6533f);color:#e0a090;}
    .eq-btn.unequip{background:none;border-color:rgba(255,255,255,0.18);color:#aaa;}
    .eq-btn:disabled{opacity:0.5;cursor:default;}
    .eq-done{font-family:var(--font-mono,monospace);font-size:11px;color:#46c46a;}
    .eq-none{font-family:var(--font-mono,monospace);font-size:10px;color:#888;font-style:italic;}
    .eq-err{margin-top:10px;font-family:var(--font-mono,monospace);font-size:11px;color:#c47a7a;background:rgba(196,122,122,0.1);border:0.5px solid rgba(196,122,122,0.3);border-radius:3px;padding:8px 11px;}
  `,document.head.appendChild(t)}function ie(t,d,e){if(!t?.id||!d?.id)return;F(),ae();let n=document.getElementById("eq-overlay");n||(n=document.createElement("div"),n.id="eq-overlay",n.className="cu-overlay",document.body.appendChild(n));const c=Array.isArray(t.brigades)?t.brigades:[];let y=[],w=new Map,v=!1;const S=()=>{n.style.display="none",n.innerHTML="",n.onclick=null};async function l(){const[m,b]=await Promise.all([X(d.id),R([t.id])]);y=m,w=new Map((b.byUnit.get(t.id)||[]).map(i=>[i.brigade_index,i])),h(),typeof e=="function"&&e()}function h(){const m=c.map((b,i)=>{const o=M[b],s=o?o.name:b,p=o?o.mp:0,r=j(b),x=w.get(i),_=x&&Number(x.quantity)||0,f=x?x.rifle_model_id:null,a=r>0&&_>=r,u=Math.max(0,r-_),$=y.filter(N=>(Number(N.quantity)||0)>0&&(!f||N.rifle_model_id===f));let g;a?g=`<span class="eq-done">✓ ${A(x?.rifle_models?.name||"Equipped")}</span>`:$.length?g=`<select class="eq-model" data-idx="${i}">${$.map(N=>`<option value="${C(N.rifle_model_id)}">${A(N.rifle_models?.name||"Rifle")} · ${Number(N.quantity).toLocaleString()} on hand</option>`).join("")}</select><button class="eq-btn equip" data-equip-idx="${i}" data-remaining="${u}">Equip</button>`:g=`<span class="eq-none">${f?"No more on hand":"No rifles on hand"}</span>`;const E=_>0?`<button class="eq-btn unequip" data-unequip-idx="${i}">Unequip</button>`:"";return`<div class="eq-row">
          <div class="eq-brig"><div class="eq-name">${A(s)}</div><div class="eq-mp">${p.toLocaleString()} manpower</div></div>
          <div class="eq-count ${a?"full":_>0?"part":""}">${_} / ${r}</div>
          <div class="eq-ctl">${g}${E}</div>
        </div>`}).join("");n.innerHTML=`<div class="cu-modal" style="max-width:580px;">
      <div class="cu-head">
        <div><div class="cu-eyebrow">— ARMY ACTION —</div><div class="cu-title">Equip <em>${A(t.name)}</em></div></div>
        <div class="cu-head-right"><div class="cu-x" data-eq="close">×</div></div>
      </div>
      <div class="cu-body">
        <div class="cu-hint">One rifle arms up to 1,000 soldiers · one model per brigade. Rifles come from your on-hand inventory.</div>
        <div class="eq-list">${m||'<div class="oob-empty">This unit has no brigades.</div>'}</div>
        <div class="eq-err" id="eq-err" hidden></div>
      </div>
    </div>`}n.onclick=async m=>{if(m.target===n||m.target.closest('[data-eq="close"]')){v||S();return}const b=m.target.closest("[data-equip-idx]"),i=m.target.closest("[data-unequip-idx]");if(!b&&!i||v)return;const o=document.getElementById("eq-err");v=!0,n.querySelectorAll(".eq-btn").forEach(s=>{s.disabled=!0}),o&&(o.hidden=!0,o.textContent="");try{let s,p;if(b){const r=Number(b.dataset.equipIdx),x=Number(b.dataset.remaining)||1,_=n.querySelector(`.eq-model[data-idx="${r}"]`)?.value,f=Number(y.find(u=>u.rifle_model_id===_)?.quantity)||0,a=Math.max(1,Math.min(x,f));if(!_||f<1){v=!1,n.querySelectorAll(".eq-btn").forEach(u=>{u.disabled=!1});return}({data:s,error:p}=await q.rpc("equip_brigade",{p_unit_id:t.id,p_brigade_index:r,p_rifle_model_id:_,p_quantity:a}))}else({data:s,error:p}=await q.rpc("unequip_brigade",{p_unit_id:t.id,p_brigade_index:Number(i.dataset.unequipIdx)}));p||s&&s.ok===!1?(o&&(o.textContent=s&&s.error||p?.message||"Action failed.",o.hidden=!1),v=!1,n.querySelectorAll(".eq-btn").forEach(r=>{r.disabled=!1})):(v=!1,await l())}catch(s){o&&(o.textContent=s?.message||"Action failed.",o.hidden=!1),v=!1,n.querySelectorAll(".eq-btn").forEach(p=>{p.disabled=!1})}},n.style.display="flex",n.innerHTML='<div class="cu-modal"><div class="cu-body"><div class="cu-sec">Loading…</div></div></div>',l()}export{de as a,ce as b,le as c,G as d,Z as e,T as f,P as g,B as l,re as o,pe as r};
