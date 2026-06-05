import{_ as h}from"./supabase-client-BXEzLDpS.js";import{g as Y}from"./political-actions-gAjzq9PT.js";import{b as W}from"./army-page-Cib0CuJO.js";import{o as V,a as Q,b as X,c as J}from"./create-unit-DaU66o6M.js";import{a as k,e as K}from"./utils-CzgKGX6o.js";import{i as Z,g as aa}from"./factions-C2s734Ze.js";import"./config-BER7HlcX.js";import"./government-types-BeJIFjWQ.js";import"./diplomacy-constants-DDYAx-fT.js";import"./stats-C5reUrev.js";import"./preload-helper-BXl3LOEh.js";import"./military-topbar-my5rYLvp.js";import"./military-units-B_oSYk7U.js";const U={forward_stockpiling:{name:"Forward Stockpiling",cost:4,blurb:"Cram the forward depots to bursting — the overloaded transport net slows even as stocks rise.",eff:[{t:"+5 Supply",k:"up"},{t:"−5 Logistics",k:"down"}]},logistics_overhaul:{name:"Logistics Overhaul",cost:6,blurb:"Re-rationalise convoys and motor pools for throughput — existing stockpiles are consumed in the reshuffle.",eff:[{t:"+5 Logistics",k:"up"},{t:"−5 Supply",k:"down"}]},intensive_drills:{name:"Intensive Drills",cost:5,blurb:"Grueling drill cycles sharpen combat skill — exhausted, resentful troops fray and some wash out.",eff:[{t:"+5 Training",k:"up"},{t:"−5 Cohesion",k:"down"},{t:"−1,000 Manpower",k:"down"}]},internal_security_sweep:{name:"Internal Security Sweep",cost:6,blurb:"Root out defeatists and informants — ranks close up, but surveillance corrodes professional trust and the purge thins the ranks.",eff:[{t:"+5 Cohesion",k:"up"},{t:"−5 Professionalism",k:"down"},{t:"−1,000 Manpower",k:"down"}]},doctrine_reform:{name:"Doctrine Reform",cost:7.5,blurb:"Rewrite the field manual and enforce standards — conduct focus pulls troops off the live-fire range but sharpens the officer corps.",eff:[{t:"+5 Professionalism",k:"up"},{t:"−5 Training",k:"down"},{t:"+3 Officer Corps",k:"up"}]},requisition_drive:{name:"Requisition Drive",cost:5,blurb:"Seize supplies hard to fill the depots — heavy-handed requisition grinds morale and spurs desertion.",eff:[{t:"+5 Supply",k:"up"},{t:"−5 Cohesion",k:"down"},{t:"−1,000 Manpower",k:"down"}]},comforts_and_rations:{name:"Comforts & Rations",cost:5,blurb:"Spend stockpiles on hot food, rest, and comforts — morale lifts and stragglers rejoin as the depots draw down.",eff:[{t:"+5 Cohesion",k:"up"},{t:"−5 Supply",k:"down"},{t:"+1,000 Manpower",k:"up"}]},field_improvisation:{name:"Field Improvisation",cost:6,blurb:"Push throughput by improvising routes and pressing every hand into hauling — standards slip and the command staff is sidelined.",eff:[{t:"+5 Logistics",k:"up"},{t:"−5 Professionalism",k:"down"},{t:"−3 Officer Corps",k:"down"}]},standardize_procedures:{name:"Standardize Procedures",cost:7,blurb:"Impose strict doctrine and paperwork — professional standards rise and the staff sharpens, but the transport net bogs down in process.",eff:[{t:"+5 Professionalism",k:"up"},{t:"−5 Logistics",k:"down"},{t:"+3 Officer Corps",k:"up"}]}};function C(a){const t=U[a];return t?t.eff.map(n=>n.t).join(" / "):""}const R=a=>"$"+((Number(a)||0)/1e6).toFixed(1).replace(/\.0$/,"");let j=!1;function ea(){if(j)return;j=!0;const a=document.createElement("style");a.id="oa-styles",a.textContent=`
    .oa-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
    .oa-modal { background:#0a0a0a; border:0.5px solid rgba(182,83,63,0.3); border-radius:6px; width:100%; max-width:440px; font-family:var(--font-mono,monospace); overflow:hidden; }
    .oa-head { padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:linear-gradient(180deg,rgba(182,83,63,0.06),#0c0c0c); }
    .oa-eyebrow { color:#b6533f; font-size:10px; letter-spacing:0.15em; }
    .oa-title { font-size:20px; color:#fff; margin-top:3px; }
    .oa-body { padding:16px 22px; }
    .oa-blurb { font-size:12px; line-height:1.6; color:#9a9a92; }
    .oa-eff { display:flex; gap:10px; margin:14px 0; }
    .oa-eff span { flex:1; text-align:center; padding:9px; border-radius:4px; font-size:13px; font-weight:700; letter-spacing:0.03em; }
    .oa-eff .up { background:rgba(70,196,106,0.1); border:0.5px solid rgba(70,196,106,0.4); color:#5cc46a; }
    .oa-eff .down { background:rgba(229,83,75,0.1); border:0.5px solid rgba(229,83,75,0.4); color:#e5705a; }
    .oa-cost { font-size:11px; color:#888; letter-spacing:0.04em; }
    .oa-cost b { color:#d4d4d4; } .oa-cost b.ok { color:#5cc46a; } .oa-cost b.no { color:#e5534b; }
    .oa-cd { margin-top:10px; font-size:11px; color:#c8a832; }
    .oa-err { margin-top:10px; font-size:11px; color:#c47a7a; }
    .oa-done { margin-top:10px; font-size:12px; color:#5cc46a; }
    .oa-foot { display:flex; gap:8px; justify-content:flex-end; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
    .oa-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; }
    .oa-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; }
    .oa-btn.pri { background:#2a1715; border:0.5px solid #b6533f; color:#e8c0b6; font-weight:600; }
    .oa-btn.pri.off { opacity:0.4; pointer-events:none; }`,document.head.appendChild(a)}function ta(a,t,n){const c=U[t];if(!c||!a?.id)return;ea();let r=document.getElementById("oa-overlay");r||(r=document.createElement("div"),r.id="oa-overlay",r.className="oa-overlay",document.body.appendChild(r));const p=c.cost*1e6;let s=Number(a.party_funds)||0,e=!1,o=!1,d="",f=0;const x=()=>{r.style.display="none",r.innerHTML="",r.onclick=null};function y(){const m=s>=p,v=f>0;r.innerHTML=`<div class="oa-modal">
            <div class="oa-head"><div class="oa-eyebrow">— OFFICER ACTION —</div><div class="oa-title">${k(c.name)}</div></div>
            <div class="oa-body">
                <div class="oa-blurb">${k(c.blurb)}</div>
                <div class="oa-eff">${c.eff.map(i=>`<span class="${i.k}">${k(i.t)}</span>`).join("")}</div>
                <div class="oa-cost">Cost <b>${R(p)}</b> &middot; Army Funds <b class="${m?"ok":"no"}">${R(s)}</b> &middot; 12-tick cooldown</div>
                ${v?`<div class="oa-cd">On cooldown — ready in ${f} tick${f===1?"":"s"}.</div>`:""}
                ${d?`<div class="oa-err">${k(d)}</div>`:""}
                ${o?`<div class="oa-done">Order carried out — ${k(c.eff.map(i=>i.t).join(", "))}.</div>`:""}
            </div>
            <div class="oa-foot">
                <div class="oa-btn sec" data-oa="close">${o?"Close":"Cancel"}</div>
                ${o?"":`<div class="oa-btn pri ${!m||e||v?"off":""}" data-oa="go">${e?"Working…":"Execute — "+R(p)}</div>`}
            </div>
        </div>`}r.onclick=async m=>{if(m.target===r){e||(x(),o&&typeof n=="function"&&n());return}const v=m.target.closest("[data-oa]");if(!v)return;const i=v.getAttribute("data-oa");if(i==="close"){e||(x(),o&&typeof n=="function"&&n());return}if(i==="go"){if(e||o||s<p||f>0)return;e=!0,d="",y();try{const{data:l,error:g}=await h.rpc("army_officer_action",{p_faction_id:a.id,p_action:t});g||l&&l.success===!1?(d=l&&l.error||g?.message||"Action failed.",e=!1,y()):(o=!0,e=!1,s-=p,y())}catch(l){d=l?.message||"Action failed.",e=!1,y()}}},r.style.display="flex",y(),(async()=>{try{const[m,v]=await Promise.all([h.from("factions").select("party_funds, officer_action_cooldowns").eq("id",a.id).maybeSingle(),h.from("shard").select("current_tick").eq("name","Alpha Shard").maybeSingle()]);if(m.data){s=Number(m.data.party_funds)||0;const i=Number(m.data.officer_action_cooldowns?.[t]);v.data&&Number.isFinite(i)&&(f=Math.max(0,i+12-(Number(v.data.current_tick)||0)))}}catch{}!o&&!e&&y()})()}const sa={regular:"Regular",guard:"Guard",paramilitary:"Paramilitary"},I=a=>1+Math.floor(Math.random()*Math.max(1,Math.round(a))),oa=(a,t,n)=>Math.max(t,Math.min(n,a));let H=!1;function ia(){if(H)return;H=!0;const a=document.createElement("style");a.id="ac-styles",a.textContent=`
    .ac-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
    .ac-modal { background:#0a0a0a; border:0.5px solid rgba(182,83,63,0.3); border-radius:6px; width:100%; max-width:720px; max-height:92vh; display:flex; flex-direction:column; font-family:var(--font-mono,monospace); overflow:hidden; }
    .ac-head { padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:linear-gradient(180deg,rgba(182,83,63,0.06),#0c0c0c); display:flex; align-items:center; }
    .ac-eyebrow { color:#b6533f; font-size:10px; letter-spacing:0.15em; }
    .ac-title { font-size:20px; color:#fff; margin-top:3px; }
    .ac-x { margin-left:auto; border:0.5px solid rgba(255,255,255,0.15); color:#888; width:26px; height:26px; border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; }
    .ac-body { padding:14px 22px; overflow-y:auto; }
    .ac-sec { font-size:10px; letter-spacing:0.14em; color:#666; margin:6px 0 8px; }
    .ac-row { display:flex; align-items:center; gap:10px; padding:9px 11px; border:0.5px solid rgba(255,255,255,0.08); border-radius:4px; margin-bottom:6px; cursor:pointer; }
    .ac-row.sel { border-color:#b6533f; background:rgba(182,83,63,0.08); }
    .ac-row .nm { font-size:13px; font-weight:600; color:#fff; }
    .ac-row .sub { font-size:9px; color:#777; margin-top:2px; }
    .ac-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .ac-gen { border:0.5px solid rgba(255,255,255,0.08); border-radius:5px; padding:11px 13px; cursor:pointer; }
    .ac-gen.sel { border-color:#b6533f; background:rgba(182,83,63,0.08); }
    .ac-gen .gn { font-size:13px; font-weight:600; color:#fff; }
    .ac-gen .ga { font-size:9px; color:#777; margin:2px 0 9px; }
    .ac-stat { display:flex; align-items:center; gap:8px; font-size:9px; margin-bottom:5px; }
    .ac-stat .lab { width:74px; color:#9a9a92; letter-spacing:0.04em; flex:none; }
    .ac-stat .bar { flex:1; height:6px; background:#222; border-radius:3px; overflow:hidden; }
    .ac-stat .fill { height:100%; }
    .ac-stat .fill.lead { background:#5cc46a; } .ac-stat .fill.disc { background:#c8a832; } .ac-stat .fill.loy { background:#6a8fb0; }
    .ac-stat .v { width:24px; text-align:right; color:#d4d4d4; font-weight:600; flex:none; }
    .ac-stat.inert .lab, .ac-stat.inert .v { color:#666; }
    .ac-foot { display:flex; align-items:center; gap:14px; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
    .ac-foot .fm { font-size:10px; color:#888; line-height:1.5; }
    .ac-err { color:#c47a7a; } .ac-ok { color:#5cc46a; }
    .ac-acts { margin-left:auto; display:flex; gap:8px; }
    .ac-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; }
    .ac-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; }
    .ac-btn.pri { background:#2a1715; border:0.5px solid #b6533f; color:#e8c0b6; font-weight:600; }
    .ac-btn.pri.off { opacity:0.4; pointer-events:none; }
    .ac-empty { padding:24px; text-align:center; color:#666; font-size:12px; }`,document.head.appendChild(a)}function na(a,t){if(!a?.id)return;ia();let n=document.getElementById("ac-overlay");n||(n=document.createElement("div"),n.id="ac-overlay",n.className="ac-overlay",document.body.appendChild(n));let c=[],r=[],p=null,s=null,e=!1,o="",d="";const f=()=>{n.style.display="none",n.innerHTML="",n.onclick=null},x=(m,v,i,l)=>`<div class="ac-stat${l?" inert":""}"><span class="lab">${m}</span><span class="bar"><span class="fill ${i}" style="width:${v}%;"></span></span><span class="v">${v}</span></div>`;function y(){const m=c.length?c.map(u=>`<div class="ac-row ${p===u.id?"sel":""}" data-ac="army:${K(u.id)}">
                <div style="flex:1;min-width:0;"><div class="nm">${k(u.name)}</div>
                <div class="sub">${k(sa[u.army_type]||u.army_type||"")}${u.commander_name?" · led by "+k(u.commander_name):" · no commander"}</div></div></div>`).join(""):'<div class="ac-empty">No armies yet — use Create Army first.</div>',v=r.map((u,b)=>`<div class="ac-gen ${s===b?"sel":""}" data-ac="gen:${b}">
            <div class="gn">${k(u.name)}</div><div class="ga">Age ${u.age}</div>
            ${x("LEADERSHIP",u.leadership,"lead",!1)}
            ${x("DISCIPLINE",u.discipline,"disc",!1)}
            ${x("STATE LOY.",u.loyalty,"loy",!0)}
        </div>`).join(""),i=p&&s!==null&&!e&&!o,l=o||d,g=l.startsWith("Error")||!o&&!!d;n.innerHTML=`<div class="ac-modal">
            <div class="ac-head"><div><div class="ac-eyebrow">— ARMY ACTION —</div><div class="ac-title">Appoint Army <em>Commander</em></div></div><div class="ac-x" data-ac="close">×</div></div>
            <div class="ac-body">
                <div class="ac-sec">I. ARMY</div>${m}
                <div class="ac-sec" style="margin-top:14px;">II. GENERAL <span style="color:#555;">· Leadership ≤ Professionalism, Discipline ≤ Cohesion · State Loyalty has no effect yet</span></div>
                <div class="ac-grid">${v}</div>
            </div>
            <div class="ac-foot">
                <div class="fm ${g?"ac-err":"ac-ok"}">${k(l)}</div>
                <div class="ac-acts">
                    <div class="ac-btn sec" data-ac="close">${o?"Close":"Cancel"}</div>
                    ${o?"":`<div class="ac-btn pri ${i?"":"off"}" data-ac="appoint">Appoint →</div>`}
                </div>
            </div>
        </div>`}n.onclick=async m=>{if(m.target===n){e||(f(),o&&typeof t=="function"&&t());return}const v=m.target.closest("[data-ac]");if(!v)return;const i=v.getAttribute("data-ac");if(i==="close"){e||(f(),o&&typeof t=="function"&&t());return}if(i.startsWith("army:")){!e&&!o&&(p=i.slice(5),y());return}if(i.startsWith("gen:")){!e&&!o&&(s=Number(i.slice(4)),y());return}if(i==="appoint"){const l=r[s];if(!p||!l||e||o)return;e=!0,y();try{const{data:g,error:u}=await h.rpc("appoint_army_commander",{p_army_id:p,p_name:l.name,p_age:l.age,p_leadership:l.leadership,p_loyalty:l.loyalty,p_discipline:l.discipline});u||g&&g.success===!1?o="Error: "+(g&&g.error||u?.message||"appointment failed."):o=`${l.name} now commands the army.`}catch(g){o="Error: "+(g?.message||"appointment failed.")}e=!1,y()}},n.style.display="flex",n.innerHTML='<div class="ac-modal"><div class="ac-body"><div class="ac-empty">Loading…</div></div></div>',(async()=>{try{const[m,v,i]=await Promise.all([h.from("armies").select("id, name, army_type, commander_name").eq("faction_id",a.id).order("created_at_tick",{ascending:!0}),h.from("factions").select("army_professionalism, army_cohesion").eq("id",a.id).maybeSingle(),a.nation_id?h.from("nations").select("name, unrest, public_approval").eq("id",a.nation_id).maybeSingle():Promise.resolve({data:null})]);if(m.error)throw m.error;c=m.data||[];const l=Number(v.data?.army_professionalism)||0,g=Number(v.data?.army_cohesion)||0,u=Number(i.data?.unrest)||0,b=Number(i.data?.public_approval)||0,w=oa(Math.round((b+(100-u))/2),1,100),$=Y(i.data?.name||a.__nation_name||""),z=$.firstNames||[],O=$.lastNames||[],D=T=>T.length?T[Math.floor(Math.random()*T.length)]:"";r=Array.from({length:7},()=>({name:`${D(z)} ${D(O)}`.trim()||"Unnamed Officer",age:45+Math.floor(Math.random()*28),leadership:I(l),discipline:I(g),loyalty:I(w)})),c.length&&(p=c[0].id)}catch(m){d="Could not load — try again.",console.warn("[appoint-commander] load failed:",m?.message||m)}y()})()}const N=1200,ra=[["manpower","Manpower"],["officer_corps","Officer Corps"],["training","Training"],["equipment","Equipment Quality"],["cohesion","Cohesion"],["professionalism","Professionalism"],["logistics","Logistics"],["supplies","Supplies"]];function ca(a){return"$"+((Number(a)||0)/1e6).toFixed(1).replace(/\.0$/,"")}const da=`
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
`;function la(){if(document.getElementById("rd-styles"))return;const a=document.createElement("style");a.id="rd-styles",a.textContent=da,document.head.appendChild(a)}async function pa(a){let t=0,n={},c="";try{const{data:r,error:p}=await h.from("factions").select("party_funds, army_manpower, army_officer_corps, army_training, army_equipment, army_cohesion, army_professionalism, army_logistics, army_supplies").eq("id",a.id).maybeSingle();p&&console.warn("[report-defense] faction load failed:",p.message),r&&(t=Number(r.party_funds)||0,n={manpower:r.army_manpower,officer_corps:r.army_officer_corps,training:r.army_training,equipment:r.army_equipment,cohesion:r.army_cohesion,professionalism:r.army_professionalism,logistics:r.army_logistics,supplies:r.army_supplies});const{data:s,error:e}=await h.from("ministries").select("minister_first_name, minister_last_name").eq("nation_id",a.nation_id).eq("ministry_key","defense").eq("is_active",!0).maybeSingle();e&&console.warn("[report-defense] minister load failed:",e.message),s&&(c=`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim())}catch(r){console.warn("[report-defense] context load failed:",r?.message||r)}return{funds:t,stats:n,minister:c}}function fa(a){if(!a?.id)return;la();let t=document.getElementById("rd-overlay");t||(t=document.createElement("div"),t.id="rd-overlay",t.className="rd-overlay",document.body.appendChild(t));let n=!1;const c=`${a.leader_first_name||""} ${a.leader_last_name||""}`.trim()||"The Chief of Staff";function r(){t.style.display="none",t.innerHTML="",t.onclick=null,t.oninput=null}function p(e){const o=e.minister?`<span class="who">${k(e.minister)}</span> <span class="role">MINISTER OF DEFENSE</span>`:'<span class="who" style="color:#888;">Vacant</span> <span class="role">NO DEFENSE MINISTER</span>',d=ra.map(([i,l])=>{const g=e.stats[i],u=g==null?"—":Number(g).toLocaleString();return`<div class="cell"><div class="k">${k(l)}</div><div class="v">${u}</div></div>`}).join("");t.innerHTML=`<div class="rd-modal">
      <div class="rd-head">
        <div>
          <div class="rd-eyebrow">— ARMY ACTION · RESTRICTED —</div>
          <div class="rd-title">Report to <em>Defense Minister</em></div>
        </div>
        <div class="rd-head-right">
          <div class="rd-stat"><div class="l">FILING COST</div><div class="v steel">$1</div></div>
          <div class="rd-stat"><div class="l">ARMY FUNDS</div><div class="v">${ca(e.funds)}</div></div>
          <div class="rd-x" data-rd="close">×</div>
        </div>
      </div>
      <div class="rd-recipient">
        <span class="lbl">FROM</span><span class="who">${k(c)}</span> <span class="role">CHIEF OF STAFF</span>
        <span class="arr">▸</span>
        <span class="lbl">TO</span>${o}
      </div>
      <div class="rd-body">
        <div class="rd-sec">Service snapshot — auto-attached, read-only</div>
        <div class="rd-snap">${d}</div>
        <div class="rd-sec">Confidential briefing</div>
        <textarea class="rd-ta" id="rd-body" maxlength="${N}" placeholder="Write privately to the Defense Minister. Only the party that controls the Defense ministry can read this; every other party sees only the headline."></textarea>
        <div class="rd-count" id="rd-count">0 / ${N}</div>
        <label class="rd-pub"><input type="checkbox" id="rd-public"> Make report public — every party can read the full report (default: only the Defense Minister's party)</label>
      </div>
      <div class="rd-foot">
        <div class="fm">VISIBILITY: <span class="steel" id="rd-vis">DEFENSE MINISTER'S PARTY ONLY</span></div>
        <div class="rd-acts">
          <div class="rd-btn sec" data-rd="cancel">CANCEL</div>
          <div class="rd-btn pri off" id="rd-file" data-rd="file">FILE BRIEFING — $1 →</div>
        </div>
      </div>
    </div>`;const f=t.querySelector("#rd-body"),x=t.querySelector("#rd-count"),y=t.querySelector("#rd-file"),m=t.querySelector("#rd-public"),v=t.querySelector("#rd-vis");m&&v&&(m.onchange=()=>{v.textContent=m.checked?"ALL PARTIES (PUBLIC)":"DEFENSE MINISTER'S PARTY ONLY"}),t.oninput=()=>{const i=f.value.length;x.textContent=`${i} / ${N}`,x.classList.toggle("over",i>N),y.classList.toggle("off",f.value.trim().length===0||i>N)},f.focus()}async function s(){if(n)return;const o=(t.querySelector("#rd-body")?.value||"").trim();if(!o){alert("Write the briefing first.");return}if(o.length>N){alert(`The briefing exceeds the ${N} character limit.`);return}n=!0;try{const{data:d,error:f}=await h.rpc("file_chief_of_staff_report",{p_faction_id:a.id,p_body:o,p_public:!!t.querySelector("#rd-public")?.checked});if(f){alert("Failed to file: "+f.message);return}if(d&&d.success===!1){d.error==="cooldown"?alert("A report was filed recently. The Chief of Staff may file again in "+Math.max(0,Number(d.ready_at_tick)||0)+" ticks (12-tick cooldown)."):alert(d.error||"Could not file the report.");return}r(),alert("Briefing filed to the Defense Minister. It now appears in the nation’s Pressing Issues.")}finally{n=!1}}t.onclick=e=>{const o=e.target.closest("[data-rd]");if(!o){e.target===t&&r();return}const d=o.getAttribute("data-rd");if(d==="close"||d==="cancel")return r();if(d==="file")return s()},t.style.display="flex",t.innerHTML='<div class="rd-modal"><div class="rd-body"><div class="rd-sec">Loading…</div></div></div>',pa(a).then(p)}const ma=12e6,L=24;function ua(a){return"$"+((Number(a)||0)/1e6).toFixed(1).replace(/\.0$/,"")}function E(a,t){return Math.max(0,Math.floor(((Number(t)||0)-(Number(a)||0))/20))}const ga=`
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
`;function va(){if(document.getElementById("foe-styles"))return;const a=document.createElement("style");a.id="foe-styles",a.textContent=ga,document.head.appendChild(a)}async function ba(a){let t=0,n=0,c=0,r=null,p=0,s=[];try{const{data:e,error:o}=await h.from("factions").select("party_funds, nation_id, army_officer_corps, army_professionalism, last_foreign_officer_exchange_tick").eq("id",a.id).maybeSingle();o&&console.warn("[foe] faction load failed:",o.message),e&&(t=Number(e.party_funds)||0,n=Number(e.army_officer_corps)||0,c=Number(e.army_professionalism)||0,r=e.last_foreign_officer_exchange_tick==null?null:Number(e.last_foreign_officer_exchange_tick));const d=e?.nation_id||a.nation_id,{data:f,error:x}=await h.from("shard").select("current_tick").eq("name","Alpha Shard").maybeSingle();x&&console.warn("[foe] shard load failed:",x.message),p=Number(f?.current_tick)||0;let y=h.from("factions").select("id, nation_id, faction_name, army_officer_corps, army_professionalism, is_banned, nations(name)").eq("faction_type","military").eq("branch","army").is("abandoned_at",null);d&&(y=y.neq("nation_id",d));const{data:m,error:v}=await y;v&&console.warn("[foe] targets load failed:",v.message),s=(m||[]).filter(i=>!i.is_banned).map(i=>({id:i.id,nation:i.nations?.name||i.faction_name||"Unknown",oc:Number(i.army_officer_corps)||0,pr:Number(i.army_professionalism)||0})).sort((i,l)=>i.nation.localeCompare(l.nation))}catch(e){console.warn("[foe] context load failed:",e?.message||e)}return{funds:t,myOc:n,myPr:c,lastTick:r,currentTick:p,targets:s}}function _a(a){if(!a?.id)return;va();let t=document.getElementById("foe-overlay");t||(t=document.createElement("div"),t.id="foe-overlay",t.className="foe-overlay",document.body.appendChild(t));let n=!1,c=null;function r(){t.style.display="none",t.innerHTML="",t.onclick=null}function p(e){const o=e.lastTick!=null?Math.max(0,e.lastTick+L-e.currentTick):0,d=o>0,f=e.funds<ma,x=e.targets.length?e.targets.map(i=>{const l=E(e.myOc,i.oc),g=E(e.myPr,i.pr),u=b=>b>0?`<span class="g up">+${b}</span>`:'<span class="g zero">+0</span>';return`<div class="foe-row" data-foe="pick" data-id="${k(i.id)}">
        <div><div class="nm">${k(i.nation)}</div><div class="sub">Foreign army</div></div>
        <div class="col">${i.oc.toLocaleString()}${u(l)}</div>
        <div class="col">${i.pr.toLocaleString()}${u(g)}</div>
      </div>`}).join(""):'<div class="foe-empty">No foreign armies are available to exchange with yet.</div>';t.innerHTML=`<div class="foe-modal">
      <div class="foe-head">
        <div>
          <div class="foe-eyebrow">— ARMY ACTION · COMMANDING GENERAL —</div>
          <div class="foe-title">Foreign Officer <em>Exchange Program</em></div>
        </div>
        <div class="foe-head-right">
          <div class="foe-stat"><div class="l">COST</div><div class="v army">$12</div></div>
          <div class="foe-stat"><div class="l">ARMY FUNDS</div><div class="v">${ua(e.funds)}</div></div>
          <div class="foe-x" data-foe="close">×</div>
        </div>
      </div>
      <div class="foe-desc">Send select officers abroad to study at foreign military academies and embed with allied units. Returning officers bring back modern doctrine, professional standards, and international networks. Each stat gains ⌊(their − yours) ÷ 20⌋ — never below 0. ${L}-tick cooldown.</div>
      <div class="foe-mine">
        <div><span class="lbl">YOUR OFFICER CORPS</span><b>${e.myOc.toLocaleString()}</b></div>
        <div><span class="lbl">YOUR PROFESSIONALISM</span><b>${e.myPr.toLocaleString()}</b></div>
      </div>
      <div class="foe-colhead"><span>Nation</span><span>Officer Corps</span><span>Professionalism</span></div>
      <div class="foe-body">${x}</div>
      <div class="foe-foot">
        <div class="fm${d||f?" warn":""}" id="foe-summary">${d?`On cooldown — ready in ${o} tick${o===1?"":"s"}.`:f?"Insufficient Army Funds ($12 required).":"Select a foreign army to preview the exchange."}</div>
        <div class="foe-acts">
          <div class="foe-btn sec" data-foe="cancel">CANCEL</div>
          <div class="foe-btn pri off" id="foe-go" data-foe="go">EXCHANGE — $12 →</div>
        </div>
      </div>
    </div>`;const y=t.querySelector("#foe-summary"),m=t.querySelector("#foe-go");function v(i){if(d||f)return;c=i,t.querySelectorAll(".foe-row").forEach($=>$.classList.toggle("is-sel",$.getAttribute("data-id")===i));const l=e.targets.find($=>$.id===i);if(!l)return;const g=E(e.myOc,l.oc),u=E(e.myPr,l.pr),b=Math.min(100,Math.max(0,e.myOc+g)),w=Math.min(100,Math.max(0,e.myPr+u));y.classList.remove("warn"),y.innerHTML=g===0&&u===0?`<b>${k(l.nation)}</b> is not ahead of you — no stat gain, but the action still costs $12 and triggers the cooldown.`:`<b>${k(l.nation)}</b> → Officer Corps ${e.myOc}→${b} (+${g}), Professionalism ${e.myPr}→${w} (+${u}).`,m.classList.remove("off")}t.onclick=i=>{const l=i.target.closest("[data-foe]");if(!l){i.target===t&&r();return}const g=l.getAttribute("data-foe");if(g==="close"||g==="cancel")return r();if(g==="pick")return v(l.getAttribute("data-id"));if(g==="go")return s()}}async function s(){if(!(n||!c)){n=!0;try{const{data:e,error:o}=await h.rpc("foreign_officer_exchange",{p_faction_id:a.id,p_target_faction_id:c});if(o){alert("Exchange failed: "+o.message);return}if(e&&e.success===!1){e.error==="cooldown"?alert("Recently used. Available again at tick "+(Number(e.ready_at_tick)||0)+` (${L}-tick cooldown).`):alert(e.error||"Could not run the exchange.");return}r();const d=Number(e?.officer_corps_gain)||0,f=Number(e?.professionalism_gain)||0;alert(`Officer exchange with ${e?.target_nation||"the foreign nation"} complete.
Officer Corps +${d} (now ${Number(e?.new_officer_corps)||0}), Professionalism +${f} (now ${Number(e?.new_professionalism)||0}).`)}finally{n=!1}}}t.style.display="flex",t.innerHTML='<div class="foe-modal"><div class="foe-body"><div class="foe-empty">Loading foreign armies…</div></div></div>',ba(a).then(p)}const q=24;function A(a){return"$"+((Number(a)||0)/1e6).toFixed(1).replace(/\.0$/,"")}const ya=`
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
`;function ha(){if(document.getElementById("cas-styles"))return;const a=document.createElement("style");a.id="cas-styles",a.textContent=ya,document.head.appendChild(a)}async function xa(a){let t=0,n=0,c=null,r=0,p=null;try{const{data:s,error:e}=await h.from("factions").select("party_funds, army_manpower, last_combined_arms_school_tick").eq("id",a.id).maybeSingle();e&&console.warn("[cas] faction load failed:",e.message),s&&(t=Number(s.party_funds)||0,n=Number(s.army_manpower)||0,c=s.last_combined_arms_school_tick==null?null:Number(s.last_combined_arms_school_tick));const{data:o,error:d}=await h.from("shard").select("current_tick").eq("name","Alpha Shard").maybeSingle();d&&console.warn("[cas] shard load failed:",d.message),r=Number(o?.current_tick)||0;const{data:f,error:x}=await h.rpc("combined_arms_school_spec");x&&console.warn("[cas] spec load failed:",x.message),p=f||null}catch(s){console.warn("[cas] context load failed:",s?.message||s)}return{funds:t,manpower:n,lastTick:c,currentTick:r,spec:p}}function wa(a){if(!a?.id)return;ha();let t=document.getElementById("cas-overlay");t||(t=document.createElement("div"),t.id="cas-overlay",t.className="cas-overlay",document.body.appendChild(t));let n=!1;function c(){t.style.display="none",t.innerHTML="",t.onclick=null}function r(s){const e=s.spec||{},o=Number(e.budget)||55e6,d=Number(e.timeline)||36,f=Number(e.manpower_cost)||2e3,x=Number(e.upkeep_per_tick)||2,m=(Array.isArray(e.stat_effects)?e.stat_effects:[]).map(u=>`${Number(u.delta)>=0?"+":""}${u.delta} ${String(u.stat).replace(/^army_/,"").replace(/_/g," ")}`).join(" · ")||"+6 professionalism · +4 officer corps",v=s.lastTick!=null?Math.max(0,s.lastTick+q-s.currentTick):0,i=v>0,l=s.funds<o,g=i||l;t.innerHTML=`<div class="cas-modal">
      <div class="cas-head">
        <div>
          <div class="cas-eyebrow">— ARMY ACTION · QUARTERMASTER —</div>
          <div class="cas-title">Establish <em>Combined Arms School</em></div>
        </div>
        <div class="cas-head-right">
          <div class="cas-stat"><div class="l">COST</div><div class="v army">${A(o)}</div></div>
          <div class="cas-stat"><div class="l">ARMY FUNDS</div><div class="v">${A(s.funds)}</div></div>
          <div class="cas-x" data-cas="close">×</div>
        </div>
      </div>
      <div class="cas-body">
        <div class="cas-desc">Stand up a national staff college teaching combined arms doctrine, joint operations, and modern warfare. Curriculum draws from foreign manuals and recent conflicts. Frees officers from line duties for 16-week intensive courses. A construction corporation must bid on and build it.</div>
        <div class="cas-grid">
          <div class="cas-cell"><div class="k">Construction Budget</div><div class="v">${A(o)}</div></div>
          <div class="cas-cell"><div class="k">Build Time</div><div class="v">~${d} months</div></div>
          <div class="cas-cell"><div class="k">Manpower Removed Now</div><div class="v warn">−${f.toLocaleString()}</div></div>
          <div class="cas-cell"><div class="k">On Completion</div><div class="v">${k(m)}</div></div>
        </div>
        <div class="cas-note">Current manpower: <b>${s.manpower.toLocaleString()}</b> → <b>${Math.max(0,s.manpower-f).toLocaleString()}</b> (removed immediately, even though the build takes ~${d} months). Once built, the school costs the nation <b>$${x}/tick</b> forever under National Infrastructure. ${q}-tick cooldown. The $${o/1e6} is paid up front and is what corporations bid on — it is not refunded if no corp ever builds it.</div>
      </div>
      <div class="cas-foot">
        <div class="fm${g?" warn":""}" id="cas-msg">${i?`On cooldown — ready in ${v} tick${v===1?"":"s"}.`:l?`Insufficient Army Funds (${A(o)} required).`:"This posts the contract and removes manpower immediately."}</div>
        <div class="cas-acts">
          <div class="cas-btn sec" data-cas="cancel">CANCEL</div>
          <div class="cas-btn pri${g?" off":""}" id="cas-go" data-cas="go">ESTABLISH — ${A(o)} →</div>
        </div>
      </div>
    </div>`,t.onclick=u=>{const b=u.target.closest("[data-cas]");if(!b){u.target===t&&c();return}const w=b.getAttribute("data-cas");if(w==="close"||w==="cancel")return c();if(w==="go"&&!g)return p()}}async function p(){if(!n){n=!0;try{const{data:s,error:e}=await h.rpc("post_combined_arms_school",{p_faction_id:a.id});if(e){alert("Could not establish the school: "+e.message);return}if(s&&s.success===!1){s.error==="cooldown"?alert("Recently used. Available again at tick "+(Number(s.ready_at_tick)||0)+` (${q}-tick cooldown).`):alert(s.error||"Could not establish the school.");return}c(),alert(`Combined Arms School commissioned for ${s?.nation||"the nation"}.
${Number(s?.manpower_removed)||0} manpower removed now. Construction corporations can now bid; on completion: +6 Professionalism, +4 Officer Corps.`)}finally{n=!1}}}t.style.display="flex",t.innerHTML='<div class="cas-modal"><div class="cas-body"><div class="cas-desc">Loading…</div></div></div>',xa(a).then(r)}function S(a){return String(a??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}const M=[{key:"cos",role:"Chief of Staff",desc:"Principal military advisor; heads the army’s command structure."},{key:"qm",role:"Quartermaster General",col:"army_qm",desc:"Logistics, supply lines, and matériel."},{key:"intel",role:"Director of Intelligence",col:"army_intel",desc:"Reconnaissance, counter-intelligence, and threat assessment."},{key:"cmd",role:"Commanding General",col:"army_cmd",desc:"Field command of deployed forces."}];let _=null,F="cos";function B(a){return a.key==="cos"?{first:_.leader_first_name,last:_.leader_last_name,age:_.leader_age}:{first:_[`${a.col}_first_name`],last:_[`${a.col}_last_name`],age:_[`${a.col}_age`]}}function G(){const a=document.getElementById("aa-root");if(!a)return;const t=M.map(b=>{const w=B(b),$=w.first&&w.last,z=$?`${w.first} ${w.last}`:"Unassigned",O=$?(w.first[0]+w.last[0]).toUpperCase():"–";return`<button class="aa-officer${F===b.key?" is-sel":""}${$?"":" is-dim"}" data-officer="${b.key}">
      <div class="aa-tile">${S(O)}</div>
      <div style="flex:1;min-width:0;">
        <div class="aa-officer__role">${S(b.role)}</div>
        <div class="aa-officer__name">${S(z)}</div>
        <div class="aa-officer__meta">${w.age?"Age "+S(w.age):"Vacant"}</div>
      </div>
    </button>`}).join(""),n=M.find(b=>b.key===F)||M[0],c=B(n),r=c.first&&c.last,p=r?`${c.first} ${c.last}`:"Unassigned",s=r?(c.first[0]+c.last[0]).toUpperCase():"–",e=_.__nation_name||"";let o;n.key==="cos"?o=`
        <div class="aa-act" data-act="create-unit">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Create Unit</span></div>
            <span class="aa-act__cost">$2+</span>
          </div>
          <div class="aa-act__desc">Commission a new combat formation — $2 action fee plus construction cost from the defense budget.</div>
        </div>
        <div class="aa-act" data-act="create-army">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Create Army</span></div>
            <span class="aa-act__cost">$2</span>
          </div>
          <div class="aa-act__desc">Form your units into a cohesive fighting force — a named army (Regular, Guard, or Paramilitary) that can be deployed and given orders. $2 action fee from the army treasury.</div>
        </div>
        <div class="aa-act" data-act="appoint-commander">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Appoint Army Commander</span></div>
            <span class="aa-act__cost">$0</span>
          </div>
          <div class="aa-act__desc">Review seven generals and place one in command of an army. Leadership (combat power) and Discipline (staying power under fire) are capped by your army's Professionalism and Cohesion. Free.</div>
        </div>
        <div class="aa-act" data-act="assign-army">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Assign Army to Theater</span></div>
            <span class="aa-act__cost">$1</span>
          </div>
          <div class="aa-act__desc">Deploy a named army to a specific land front bordering your nation. $1 action fee from the army treasury.</div>
        </div>
        <div class="aa-act" data-act="front-orders">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Army Orders</span></div>
            <span class="aa-act__cost">$0</span>
          </div>
          <div class="aa-act__desc">Order each deployed army's posture for the next tick — ASSAULT to push the line toward the enemy capital (costly), or DEFEND to hold (cheap, can't advance). Shows estimated enemy intelligence on each army's front. Free to issue.</div>
        </div>
        <div class="aa-act" data-act="doctrine-reform">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Doctrine Reform</span></div>
            <span class="aa-act__cost">$7.5</span>
          </div>
          <div class="aa-act__desc">Rewrite the field manual and enforce professional standards. <b>${C("doctrine_reform")}</b> — conduct and doctrine focus pulls troops off the live-fire range but sharpens the officer corps. 12-tick cooldown.</div>
        </div>
        <div class="aa-act" data-act="standardize-procedures">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Standardize Procedures</span></div>
            <span class="aa-act__cost">$7</span>
          </div>
          <div class="aa-act__desc">Impose strict doctrine and paperwork across the force. <b>${C("standardize_procedures")}</b> — standards and staff sharpen, but the transport net bogs down in process. 12-tick cooldown.</div>
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
        </div>`:n.key==="qm"?o=`
        <div class="aa-act" data-act="forward-stockpiling">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Forward Stockpiling</span></div>
            <span class="aa-act__cost">$4</span>
          </div>
          <div class="aa-act__desc">Cram the forward depots to bursting. <b>${C("forward_stockpiling")}</b> — the overloaded transport net slows even as stocks rise. 12-tick cooldown.</div>
        </div>
        <div class="aa-act" data-act="logistics-overhaul">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Logistics Overhaul</span></div>
            <span class="aa-act__cost">$6</span>
          </div>
          <div class="aa-act__desc">Re-rationalise convoys and motor pools for throughput. <b>${C("logistics_overhaul")}</b> — existing stockpiles are consumed in the reshuffle. 12-tick cooldown.</div>
        </div>
        <div class="aa-act" data-act="requisition-drive">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Requisition Drive</span></div>
            <span class="aa-act__cost">$5</span>
          </div>
          <div class="aa-act__desc">Seize supplies hard to fill the depots. <b>${C("requisition_drive")}</b> — heavy-handed requisition grinds morale and spurs desertion. 12-tick cooldown.</div>
        </div>
        <div class="aa-act" data-act="field-improvisation">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Field Improvisation</span></div>
            <span class="aa-act__cost">$6</span>
          </div>
          <div class="aa-act__desc">Push throughput by improvising routes and pressing every hand into hauling. <b>${C("field_improvisation")}</b> — cargo moves, standards slip, and the command staff is sidelined. 12-tick cooldown.</div>
        </div>
        <div class="aa-act" data-act="combined-arms-school">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Establish Combined Arms School</span></div>
            <span class="aa-act__cost">$55</span>
          </div>
          <div class="aa-act__desc">Stand up a national staff college teaching combined arms doctrine, joint operations, and modern warfare. Posts a construction contract for corporations to bid on. Removes 2,000 manpower immediately; on completion (≈36 months): Professionalism +6, Officer Corps +4. Then $2/tick under National Infrastructure. 24-tick cooldown.</div>
        </div>`:n.key==="intel"?o=`
        <div class="aa-act" data-act="internal-security-sweep">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Internal Security Sweep</span></div>
            <span class="aa-act__cost">$6</span>
          </div>
          <div class="aa-act__desc">Root out defeatists and enemy informants. <b>${C("internal_security_sweep")}</b> — ranks close up, but surveillance corrodes professional trust and the purge thins the ranks. 12-tick cooldown.</div>
        </div>`:n.key==="cmd"?o=`
        <div class="aa-act" data-act="intensive-drills">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Intensive Drills</span></div>
            <span class="aa-act__cost">$5</span>
          </div>
          <div class="aa-act__desc">Order grueling drill cycles across the force. <b>${C("intensive_drills")}</b> — combat skill sharpens, but exhausted, resentful troops fray and some wash out. 12-tick cooldown.</div>
        </div>
        <div class="aa-act" data-act="comforts-and-rations">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Comforts &amp; Rations</span></div>
            <span class="aa-act__cost">$5</span>
          </div>
          <div class="aa-act__desc">Spend stockpiles on hot food, rest, and comforts. <b>${C("comforts_and_rations")}</b> — morale lifts and stragglers rejoin as the depots draw down. 12-tick cooldown.</div>
        </div>
        <div class="aa-act" data-act="foreign-officer-exchange">
          <div class="aa-act__head">
            <div class="aa-act__title"><span class="aa-act__name">Foreign Officer Exchange Program</span></div>
            <span class="aa-act__cost">$12</span>
          </div>
          <div class="aa-act__desc">Send select officers abroad to study at foreign military academies and embed with allied units. Returning officers bring back modern doctrine, professional standards, and international networks. 24-tick cooldown.</div>
        </div>`:o=`<div class="aa-empty">${S(n.desc)}<br><br>No actions available for this office yet.</div>`,a.innerHTML=`
    <div class="aa-head">
      <span class="aa-head__eyebrow">Army Command</span>
      <span class="aa-head__faction">${S(_.faction_name||"Army")}${e?" · "+S(e):""}</span>
    </div>
    <div class="aa-grid">
      <div class="aa-rail">${t}</div>
      <div class="aa-panel">
        <div class="aa-panel__top">
          <div class="aa-avatar">${S(s)}</div>
          <div>
            <div><span class="aa-panel__role">${S(n.role)}</span><span class="aa-panel__name">${S(p)}</span></div>
            <div class="aa-panel__sub">${c.age?"Age "+S(c.age):"Unassigned"}${e?" · "+S(e):""}</div>
          </div>
        </div>
        ${o}
      </div>
    </div>`,a.querySelectorAll("[data-officer]").forEach(b=>{b.addEventListener("click",()=>{F=b.getAttribute("data-officer"),G()})});const d=a.querySelector('[data-act="create-unit"]');d&&(d.onclick=()=>V(_));const f=a.querySelector('[data-act="create-army"]');f&&(f.onclick=()=>Q(_));const x=a.querySelector('[data-act="assign-army"]');x&&(x.onclick=()=>X(_));const y=a.querySelector('[data-act="appoint-commander"]');y&&(y.onclick=()=>na(_));const m=a.querySelector('[data-act="front-orders"]');m&&(m.onclick=()=>J(_));const v=a.querySelector('[data-act="resign"]');v&&(v.onclick=()=>ka(_));const i=a.querySelector('[data-act="report-defense"]');i&&(i.onclick=()=>fa(_));const l=a.querySelector('[data-act="foreign-officer-exchange"]');l&&(l.onclick=()=>_a(_));const g=a.querySelector('[data-act="combined-arms-school"]');g&&(g.onclick=()=>wa(_));const u=async()=>{const{data:b}=await h.from("factions").select("party_funds").eq("id",_.id).maybeSingle();b&&(_.party_funds=b.party_funds)};[["forward-stockpiling","forward_stockpiling"],["logistics-overhaul","logistics_overhaul"],["intensive-drills","intensive_drills"],["internal-security-sweep","internal_security_sweep"],["doctrine-reform","doctrine_reform"],["requisition-drive","requisition_drive"],["comforts-and-rations","comforts_and_rations"],["field-improvisation","field_improvisation"],["standardize-procedures","standardize_procedures"]].forEach(([b,w])=>{const $=a.querySelector(`[data-act="${b}"]`);$&&($.onclick=()=>ta(_,w,u))})}let P=!1;async function ka(a){if(P)return;const t=a.__nation_name||"your nation";if(confirm(`Resign your commission as Chief of Staff of the ${a.faction_name||"Army"} of ${t}? You will head off into a peaceful retirement. −1 Public Approval. This cannot be undone.`)){P=!0;try{const{data:c,error:r}=await h.rpc("resign_military_faction",{p_faction_id:a.id});if(r){alert("Failed to resign: "+r.message);return}if(c&&c.success===!1){alert(c.error||"Could not resign.");return}const{data:{user:p}}=await h.auth.getUser(),{data:s,error:e}=await h.from("factions").select("id, faction_type, branch, abandoned_at, is_banned, linked_user_id").or(`id.eq.${p.id},linked_user_id.eq.${p.id}`);e&&console.warn("post-resign faction lookup failed:",e.message);const o=(s||[]).filter(f=>f.faction_type!=="military"&&!Z(f)),d=o.find(f=>f.faction_type==="party")||o.find(f=>f.faction_type==="corporation")||null;d?(sessionStorage.setItem("active_faction_id",d.id),window.location.href=aa(d)||"dashboard.html"):window.location.href="faction-select.html"}finally{P=!1}}}const $a="id, faction_type, faction_name, nation_id, abandoned_at, is_banned, branch, party_funds, army_manpower, leader_first_name, leader_last_name, leader_age, army_qm_first_name, army_qm_last_name, army_qm_age, army_intel_first_name, army_intel_last_name, army_intel_age, army_cmd_first_name, army_cmd_last_name, army_cmd_age";async function Sa(){const a=await W({activeTab:"actions",factionSelect:$a});if(!a)return;_=a.faction;const t=a.nation,n=t?.name?Y(t.name):null;if(n&&n.firstNames?.length&&n.lastNames?.length){const{firstNames:c,lastNames:r}=n,p={};for(const s of M)if(s.key!=="cos"&&!_[`${s.col}_first_name`]){const e=c[Math.floor(Math.random()*c.length)],o=r[Math.floor(Math.random()*r.length)],d=50+Math.floor(Math.random()*26);p[`${s.col}_first_name`]=e,p[`${s.col}_last_name`]=o,p[`${s.col}_age`]=d,_[`${s.col}_first_name`]=e,_[`${s.col}_last_name`]=o,_[`${s.col}_age`]=d}Object.keys(p).length>0&&await h.from("factions").update(p).eq("id",_.id).then(({error:s})=>{s&&console.warn("Army officer lock-in failed (will retry next load):",s.message)})}G()}Sa().catch(a=>{console.error("army-actions init failed:",a);const t=document.getElementById("aa-root");t&&(t.innerHTML='<div class="aa-loading">Failed to load army command.</div>')});
