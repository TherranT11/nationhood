import{_supabase as k}from"./supabase-client-CiYoFhIh.js";import{e as y,a as R}from"./utils-oN1e812_.js";const A={light_infantry:{name:"Light Infantry",mp:2e3,cost:1e6},infantry:{name:"Infantry",mp:3e3,cost:2e6},mechanized:{name:"Mechanized",mp:1e3,cost:3e6},armor:{name:"Armor",mp:500,cost:5e6},artillery:{name:"Artillery",mp:1e3,cost:2e6},support:{name:"Support",mp:2e3,cost:2e6}},I=["light_infantry","infantry","mechanized","armor","artillery","support"],O=2e6;function u(a){return"$"+((Number(a)||0)/1e6).toFixed(1).replace(/\.0$/,"")}const D=`
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
.cu-sum { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; background:#0f0f0f; border:0.5px solid rgba(212,184,122,0.2); border-radius:4px; padding:16px 18px; }
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
`;function _(){if(document.getElementById("cu-styles"))return;const a=document.createElement("style");a.id="cu-styles",a.textContent=D,document.head.appendChild(a)}async function C(a){let f=[],t=0;try{const{data:i,error:m}=await k.from("army_units").select("id,name,brigades,total_manpower,status,forming_until_tick").eq("faction_id",a.id).neq("status","Decommissioned").order("created_at",{ascending:!0});m?console.warn("[create-unit] units load failed:",m.message):f=i||[];const{data:n,error:g}=await k.from("factions").select("party_funds").eq("id",a.id).maybeSingle();g&&console.warn("[create-unit] army funds load failed:",g.message),t=Number(n?.party_funds)||0}catch(i){console.warn("[create-unit] load failed:",i?.message||i)}return{units:f,funds:t}}function M(a){return Math.max(0,Math.round(Number(a?.army_manpower)||0))}function U(a){return a.reduce((f,t)=>f+(Number(t.total_manpower)||0),0)}function H(a,f){if(!a?.id)return;_();let t=document.getElementById("cu-overlay");t||(t=document.createElement("div"),t.id="cu-overlay",t.className="cu-overlay",document.body.appendChild(t));let i=[],m=!1,n=!1,g=[],h=0;const z=()=>M(a)-U(g);function $(){t.style.display="none",t.innerHTML="",t.onclick=null}function v(){t.innerHTML=`<div class="cu-modal">
      <div class="cu-head">
        <div>
          <div class="cu-eyebrow">— ARMY ACTION —</div>
          <div class="cu-title">Create <em>Unit</em></div>
        </div>
        <div class="cu-head-right">
          <div class="cu-stat"><div class="l">ACTION COST</div><div class="v gold">${u(O)}</div></div>
          <div class="cu-stat"><div class="l">ARMY FUNDS</div><div class="v">${u(h)}</div></div>
          <div class="cu-x" data-cu="close">×</div>
        </div>
      </div>
      <div class="cu-body">
        <div class="cu-sec">I. Unit Designation</div>
        <input class="cu-name" id="cu-name" maxlength="80" placeholder="e.g. 4th Mechanized Division" />
        <div class="cu-hint">Names are public — they appear on the Order of Battle and in records.</div>
        <div id="cu-dyn"></div>
      </div>
    </div>`,c()}function c(){const s=t.querySelector("#cu-dyn");if(!s)return;const l=i.reduce((o,p)=>o+(A[p]?.mp||0),0),e=i.reduce((o,p)=>o+(A[p]?.cost||0),0),r=e+O,S=z(),x=l<=S,T=r<=h,L=i.length>=1,E=L&&x&&T;let d="";for(let o=0;o<6;o++){const p=i[o];if(p){const N=A[p];d+=`<div class="cu-slot filled" style="border-color:rgba(212,184,122,0.35);background:#161412;">
          <div class="sn"><span>SLOT ${o+1}</span><span class="sx" data-cu="rm:${o}">×</span></div>
          <div class="st">${y(N.name)}</div>
          <div class="sm">${N.mp.toLocaleString()} manpower</div>
          <div class="sc">${u(N.cost)}</div>
        </div>`}else i.length===o?d+=`<div class="cu-slot empty" data-cu="addslot"><div style="font-size:20px;color:#444;">+</div><div>SLOT ${o+1}${o===5?" — OPTIONAL":" — ADD BRIGADE"}</div></div>`:d+=`<div class="cu-slot empty" style="opacity:0.35;cursor:default;"><div>SLOT ${o+1}</div></div>`}let w="";m&&i.length<6&&(w='<div class="cu-pick">'+I.map(o=>{const p=A[o];return`<div class="cu-opt" data-cu="pick:${o}">
          <div class="on"><span>${y(p.name)}</span><span style="color:#d4b87a;">${u(p.cost)}</span></div>
          <div class="om">${p.mp.toLocaleString()} manpower${o==="support"?" · HQ / logistics / medical":""}</div>
        </div>`}).join("")+"</div>"),s.innerHTML=`
      <div class="cu-sec-row"><span class="cu-sec">II. Brigade Composition</span><span class="cu-sec c">${i.length} OF 6 SLOTS FILLED</span></div>
      <div class="cu-grid">${d}</div>
      ${w}
      <div class="cu-sec">III. Unit Summary</div>
      <div class="cu-sum">
        <div><div class="l">TOTAL MANPOWER</div><div class="v ${x?"":"warn"}">${l.toLocaleString()}</div><div class="s">${S.toLocaleString()} available</div></div>
        <div><div class="l">CONSTRUCTION</div><div class="v gold">${u(e)}</div><div class="s">+ ${u(O)} action fee</div></div>
        <div><div class="l">TOTAL OUTLAY</div><div class="v ${T?"gold":"warn"}">${u(r)}</div><div class="s">of ${u(h)} available</div></div>
      </div>
      <div class="cu-foot" style="margin:18px -22px -20px;">
        <div class="fm">STATUS: <span class="${L?"gold":"warn"}">${L?"READY TO COMMISSION":"ADD AT LEAST ONE BRIGADE"}</span></div>
        <div class="fm">MANPOWER: <span class="${x?"ok":"warn"}">${x?"SUFFICIENT":"INSUFFICIENT"}</span></div>
        <div class="cu-acts">
          <div class="cu-btn sec" data-cu="cancel">CANCEL</div>
          <div class="cu-btn pri ${E?"":"off"}" data-cu="create">CREATE UNIT — ${u(r)} →</div>
        </div>
      </div>`}async function b(){if(n)return;const s=(t.querySelector("#cu-name")?.value||"").trim();if(!s){alert("Enter a unit name.");return}if(i.length<1){alert("Add at least one brigade.");return}n=!0;try{const{data:l,error:e}=await k.rpc("create_unit",{p_faction_id:a.id,p_name:s,p_brigades:i});if(e){alert("Failed to create unit: "+e.message);return}if(l&&l.success===!1){alert(l.error||"Could not create unit.");return}$(),alert(`${s} commissioned — Forming, ready in 2 ticks.`)}finally{n=!1}}t.onclick=s=>{const l=s.target.closest("[data-cu]");if(!l){s.target===t&&$();return}const e=l.getAttribute("data-cu");if(e==="close"||e==="cancel")return $();if(e==="addslot")return m=!0,c();if(e.startsWith("pick:"))return i.length<6&&i.push(e.slice(5)),m=!1,c();if(e.startsWith("rm:"))return i.splice(Number(e.slice(3)),1),c();if(e==="create")return b()},t.style.display="flex",t.innerHTML='<div class="cu-modal"><div class="cu-body"><div class="cu-sec">Loading…</div></div></div>',C(a).then(s=>{g=s.units,h=s.funds,v()})}async function j(a,f,t){if(!t)return;_();const i=new Set,m=()=>Number(f?.current_tick)||0;let n=[],g=0;function h(v){const c=String(v||"?").trim().split(/\s+/).filter(Boolean);return((c[0]?.[0]||"?")+(c[1]?.[0]||"")).toUpperCase()}function z(){const v=M(a),c=U(n),b=n.reduce((e,r)=>e+(Array.isArray(r.brigades)?r.brigades.length:0),0);let s=`<div class="cu-sum" style="margin-bottom:16px;">
      <div><div class="l">PERSONNEL</div><div class="v">${c.toLocaleString()}</div><div class="s">committed of ${v.toLocaleString()}</div></div>
      <div><div class="l">ORDER OF BATTLE</div><div class="v">${b}</div><div class="s">${n.length} unit${n.length===1?"":"s"} · brigades</div></div>
      <div><div class="l">DEFENSE BUDGET</div><div class="v gold">${u(g)}</div><div class="s">discretionary</div></div>
    </div>`;if(n.length===0){s+='<div class="oob-empty">No units yet. Use the Chief of Staff’s Create Unit action to commission your first formation.</div>',t.innerHTML=s;return}const l=m();s+='<div class="cu-sec">Regular Army</div>';for(const e of n){const r=Array.isArray(e.brigades)?e.brigades:[],S=e.status==="Forming",x=Math.max(0,(Number(e.forming_until_tick)||0)-l),T=i.has(e.id),L=I.filter(d=>r.includes(d)).map(d=>`${r.filter(w=>w===d).length}× ${A[d].name}`).join(" · ")||"—",E=S?`<span class="oob-pill forming">Forming · Ready in ${x} tick${x===1?"":"s"}</span>`:'<span class="oob-pill active">Active</span>';s+=`<div class="oob-unit ${S?"forming":"active"}">
        <div class="oob-top" data-uid="${R(e.id)}">
          <span class="oob-pill" style="background:#222;color:#bbb;">${y(h(e.name))}</span>
          <div style="flex:1;">
            <div class="oob-name">${y(e.name)}</div>
            <div class="oob-sub">${r.length} BRIGADE${r.length===1?"":"S"} · ${(Number(e.total_manpower)||0).toLocaleString()} PERSONNEL</div>
          </div>
          ${E}
          <span style="color:#666;">${T?"▾":"▸"}</span>
        </div>
        <div class="oob-brigs ${T?"open":""}">
          <div class="oob-sub" style="margin-bottom:4px;">${y(L)}</div>
          ${r.map((d,w)=>{const o=A[d];return`<div class="oob-brig"><span style="color:#666;">${w+1}/${r.length}</span><span style="color:#fff;">${o?y(o.name):y(d)}</span><span>${o?o.mp.toLocaleString():"0"} manpower</span></div>`}).join("")}
        </div>
      </div>`}t.innerHTML=s}t.onclick=v=>{const c=v.target.closest("[data-uid]");if(!c)return;const b=c.getAttribute("data-uid");i.has(b)?i.delete(b):i.add(b),z()},t.innerHTML='<div class="oob-empty">Loading order of battle…</div>';const $=await C(a);n=$.units,g=$.funds,z()}export{H as o,j as r};
