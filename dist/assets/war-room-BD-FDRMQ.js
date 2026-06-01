import{_ as y}from"./supabase-client-BXEzLDpS.js";import{a as o,e as F,t as se}from"./utils-CzgKGX6o.js";import{g as ie}from"./create-unit-DaU66o6M.js";let D=!1,z=!1;function ce(){if(D)return;D=!0;const e=`
    .wr-empty{padding:40px 20px;text-align:center;color:#666;font-family:var(--font-mono,monospace);font-size:12px;}
    .wr-war{background:#0a0a0a;border:0.5px solid rgba(255,255,255,0.08);border-radius:8px;padding:20px;margin-bottom:18px;}
    .wr-head{text-align:center;margin-bottom:20px;}
    .wr-eyebrow{font-size:10px;letter-spacing:0.2em;color:#7a4a4a;margin-bottom:6px;}
    .wr-title{font-size:24px;font-weight:500;color:#fff;}
    .wr-dates{margin-top:8px;font-size:11px;color:#888;letter-spacing:0.04em;}
    .wr-score{margin-top:8px;font-size:12px;font-weight:700;letter-spacing:0.04em;color:#888;}
    .wr-score .mine{color:#c87a7a;} .wr-score .theirs{color:#7a9aab;}
    .wr-cf{margin:0 0 18px;padding:13px 16px;border-radius:6px;background:#1a160d;border:0.5px solid rgba(200,158,110,0.4);text-align:left;}
    .wr-cf.pending{background:#12120c;border-color:rgba(200,158,110,0.25);color:#c4a86a;font-size:12px;}
    .wr-cf .wr-cf-t{font-size:12px;color:#d4b87a;line-height:1.5;}
    .wr-cf .wr-cf-acts{display:flex;gap:8px;margin-top:11px;}
    .wr-cf-btn{font-family:inherit;cursor:pointer;font-size:11px;letter-spacing:0.05em;padding:8px 15px;border-radius:4px;border:0.5px solid;}
    .wr-cf-btn.accept{background:#0e1610;border-color:rgba(138,170,106,0.5);color:#8aaa6a;}
    .wr-cf-btn.reject{background:#160e0e;border-color:rgba(200,122,122,0.45);color:#c87a7a;}
    .wr-sec{font-size:10px;letter-spacing:0.16em;color:#666;margin:18px 0 10px;padding-bottom:6px;border-bottom:0.5px solid rgba(255,255,255,0.08);}
    .wr-front{background:#0d0d0d;border:0.5px solid rgba(255,255,255,0.08);border-radius:6px;padding:22px 24px;margin-bottom:14px;}
    .wr-front-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;flex-wrap:wrap;gap:6px;}
    .wr-front-name{font-size:17px;font-weight:600;color:#fff;letter-spacing:0.02em;}
    .wr-front-sub{font-size:11px;letter-spacing:0.06em;color:#888;}
    .wr-clash{display:flex;gap:14px;align-items:stretch;justify-content:center;margin-bottom:14px;}
    .wr-cell-big{flex:1;max-width:300px;min-width:0;background:#111;border:0.5px solid rgba(255,255,255,0.08);border-radius:5px;padding:14px 16px;border-top-width:3px;}
    .wr-cell-big.mine{border-top-color:#c87a7a;}
    .wr-cell-big.theirs{border-top-color:#7a9aab;}
    .wr-cell-big .cn{font-size:16px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .wr-cell-big .ct{font-size:10px;letter-spacing:0.1em;color:#888;margin-top:4px;}
    .wr-cell-big .cm{font-size:10px;letter-spacing:0.14em;margin-top:8px;color:#c87a7a;font-weight:700;}
    .wr-clash-vs{align-self:center;font-size:20px;color:#c89e6e;flex:none;padding:0 2px;}
    .wr-engagement{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:10px;margin-top:6px;}
    .wr-force-col,.wr-events-col{background:#0a0a0a;border:0.5px solid rgba(255,255,255,0.08);border-radius:5px;padding:14px;min-height:130px;min-width:0;display:flex;flex-direction:column;}
    .wr-force-col.mine{border-top:2px solid #c87a7a;}
    .wr-force-col.theirs{border-top:2px solid #7a9aab;}
    .wr-events-col{border-top:2px solid #c89e6e;max-height:560px;overflow-y:auto;}
    .wr-force-head,.wr-events-head{font-size:11px;letter-spacing:0.14em;color:#888;margin-bottom:11px;text-transform:uppercase;font-weight:700;}
    .wr-force-armies{flex:1;}
    .wr-force-foot{margin-top:12px;padding-top:11px;border-top:0.5px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:baseline;}
    .wr-force-foot .lab{font-size:9px;letter-spacing:0.14em;color:#666;text-transform:uppercase;font-weight:700;}
    .wr-force-foot .val{font-size:15px;font-weight:700;color:#cfcabf;font-variant-numeric:tabular-nums;letter-spacing:0.02em;}
    .wr-army-card{padding:11px 13px;background:#111;border:0.5px solid rgba(255,255,255,0.06);border-radius:3px;margin-bottom:8px;}
    .wr-army-card:last-child{margin-bottom:0;}
    .wr-army-card .nm{font-size:13px;font-weight:600;color:#fff;overflow-wrap:anywhere;}
    .wr-army-card .meta{font-size:10px;letter-spacing:0.06em;color:#888;margin-top:4px;text-transform:uppercase;}
    .wr-army-card .meta .sup{margin-left:6px;font-weight:700;}
    .wr-army-card .meta .sup.ok{color:#46c46a;} .wr-army-card .meta .sup.short{color:#e5534b;}
    .wr-army-card .unit-row{font-size:11px;color:#aaa;margin-top:6px;padding:3px 0 3px 8px;border-left:1px solid rgba(255,255,255,0.08);overflow-wrap:anywhere;}
    .wr-army-card .unit-row .u-nm{color:#ccc;}
    .wr-army-card .unit-row .u-comp{color:#888;}
    .wr-events-empty{font-size:10px;color:#666;text-align:center;padding:24px 10px;font-style:italic;line-height:1.6;}
    .wr-event{padding:9px 11px;background:#111;border:0.5px solid rgba(255,255,255,0.06);border-radius:3px;margin-bottom:7px;}
    .wr-event:last-child{margin-bottom:0;}
    .wr-event-meta{font-size:8px;letter-spacing:0.12em;color:#888;margin-bottom:6px;text-transform:uppercase;font-weight:700;}
    .wr-event-body{font-size:10px;line-height:1.55;color:#cfcfcf;white-space:pre-line;overflow-wrap:anywhere;}
    .wr-casualties{margin-top:11px;padding-top:11px;border-top:0.5px solid rgba(255,255,255,0.06);}
    .wr-casualties .wr-events-head{margin-bottom:8px;}
    .wr-cas-row{display:flex;justify-content:space-between;align-items:baseline;padding:5px 0;font-size:10px;}
    .wr-cas-row:not(:last-child){border-bottom:0.5px solid rgba(255,255,255,0.04);}
    .wr-cas-nation{color:#cfcabf;font-weight:600;}
    .wr-cas-val{color:#c87a7a;font-variant-numeric:tabular-nums;letter-spacing:0.01em;}
    .wr-cas-empty{font-size:9px;color:#666;font-style:italic;text-align:center;padding:6px 0 0;}
    @media (max-width:720px){
        .wr-front{padding:14px;}
        .wr-clash{flex-direction:column;align-items:stretch;gap:8px;}
        .wr-cell-big{max-width:100%;}
        .wr-clash-vs{align-self:center;padding:2px 0;}
        .wr-engagement{grid-template-columns:1fr;gap:8px;}
    }
    .wr-spectrum{display:flex;border-radius:4px;overflow:hidden;border:0.5px solid rgba(255,255,255,0.08);}
    .wr-seg{flex:1;padding:8px 6px;text-align:center;font-size:9px;letter-spacing:0.03em;color:#666;border-right:0.5px solid rgba(255,255,255,0.05);}
    .wr-seg:last-child{border-right:none;}
    .wr-seg.you{background:#1f1313;color:#c87a7a;} .wr-seg.them{background:#11181f;color:#7a9aab;}
    .wr-seg.active{font-weight:700;box-shadow:inset 0 0 0 1px currentColor;}
    .wr-naval{background:#0d0d0d;border:0.5px solid rgba(255,255,255,0.08);border-radius:5px;padding:12px 14px;opacity:0.45;font-size:11px;color:#888;}
    .wr-orders{display:flex;align-items:center;gap:6px;margin-top:10px;}
    .wr-ord-lab{font-size:8px;letter-spacing:0.12em;color:#666;margin-right:4px;}
    .wr-ord{font-size:9px;font-weight:700;letter-spacing:0.06em;padding:5px 12px;border-radius:3px;cursor:pointer;background:transparent;border:0.5px solid rgba(255,255,255,0.15);color:#888;font-family:inherit;}
    .wr-ord:hover{border-color:rgba(255,255,255,0.3);}
    .wr-ord.on{border-color:#b6533f;background:rgba(182,83,63,0.14);color:#e0a090;}`,a=document.createElement("style");a.id="war-room-styles",a.textContent=e,document.head.appendChild(a)}const de={a_domination:0,a_superiority:1,contested:2,b_superiority:3,b_domination:4};async function O(e,a){if(!e)return;if(ce(),!a?.id){e.innerHTML='<div class="wr-empty">No nation context.</div>';return}e.innerHTML='<div class="wr-empty">Loading wars…</div>';let u=[];const h="nation_a_id, nation_b_id, war_declared_at_tick, war_justification, war_score_a, war_score_b";for(const l of[h+", ceasefire_offer_nation_id",h]){const{data:b,error:m}=await y.from("diplomatic_relations").select(l).eq("relation_type","war").or(`nation_a_id.eq.${a.id},nation_b_id.eq.${a.id}`);if(!m){u=b||[];break}if(console.warn("[war-room] load failed, trying narrower columns:",m.message),l===h){e.innerHTML='<div class="wr-empty">Could not load wars.</div>';return}}if(!u.length){e.innerHTML='<div class="wr-empty">No active wars. When a state of war exists, it appears here.</div>';return}try{const l=[...new Set(u.map(t=>t.nation_a_id===a.id?t.nation_b_id:t.nation_a_id))],{data:b}=await y.from("nations").select("id, name").in("id",l),m=new Map((b||[]).map(t=>[t.id,t.name]));let f=!1;try{const{data:t}=await y.auth.getUser(),p=t?.user?.id;if(p){const{data:d}=await y.from("factions").select("id").eq("faction_type","military").eq("branch","army").eq("nation_id",a.id).or(`id.eq.${p},linked_user_id.eq.${p}`).limit(1);f=!!(d&&d.length)}}catch(t){console.warn("[war-room] command check failed:",t?.message||t)}let g=!1;try{const{data:t}=await y.rpc("dispute_actor_nation");g=!!t&&t===a.id}catch(t){console.warn("[war-room] HoG check failed:",t?.message||t)}let w=0;try{const{data:t}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single();w=Number(t?.current_tick)||0}catch(t){console.warn("[war-room] shard fetch failed:",t?.message||t)}const i=[];for(const t of u)i.push(await le(t,a,m,f,g,w));e.innerHTML=i.join(""),e.onclick=async t=>{const p=t.target.closest("[data-ceasefire]");if(p&&!z){const[c,$]=p.getAttribute("data-ceasefire").split("|");z=!0;try{const{data:_,error:S}=await y.rpc("respond_ceasefire",{p_other_nation_id:$,p_accept:c==="accept"});(S||_&&_.ok===!1)&&console.warn("[war-room] ceasefire failed:",_&&_.message||S?.message)}catch(_){console.warn("[war-room] ceasefire failed:",_?.message||_)}finally{z=!1}O(e,a);return}const d=t.target.closest("[data-wr-order]");if(!d||z)return;const[A,s]=d.getAttribute("data-wr-order").split("|");z=!0;try{const{data:c,error:$}=await y.rpc("set_front_action",{p_front_id:A,p_action:s});($||c&&c.success===!1)&&console.warn("[war-room] set order failed:",c&&c.error||$?.message)}catch(c){console.warn("[war-room] set order failed:",c?.message||c)}finally{z=!1}O(e,a)}}catch(l){const b=l?.message||String(l);console.warn("[war-room] render failed:",b,l?.stack||""),e.innerHTML=`<div class="wr-empty">Could not render the war room.<br><span style="color:#a44;font-size:10px;">${o(b)}</span></div>`}}async function le(e,a,u,h,l,b){const m=e.nation_a_id,f=e.nation_b_id,g=m===a.id?f:m,w=u.get(g)||"the enemy",i=a.id===m,{data:t}=await y.from("war_fronts").select("id, front_type, label, sector_count, air_status, line_position, action_a, action_b").eq("nation_a_id",m).eq("nation_b_id",f),p=(t||[]).filter(r=>r.front_type==="land").sort((r,v)=>String(r.label).localeCompare(String(v.label))),d=(t||[]).find(r=>r.front_type==="air"),A=(t||[]).some(r=>r.front_type==="sea"),s=p.map(r=>r.id),c=new Map,$=new Map,_=new Map,S=new Map;if(s.length){const{data:r}=await y.from("war_sectors").select("id, front_id, position, name, type, nation_id, is_border").in("front_id",s);for(const n of r||[])c.has(n.front_id)||c.set(n.front_id,[]),c.get(n.front_id).push(n);for(const n of c.values())n.sort((x,T)=>(x.position||0)-(T.position||0));const{data:v}=await y.from("armies").select("id, name, nation_id, army_type, assigned_front_id, supply_balance").in("assigned_front_id",s);for(const n of p)$.set(n.id,{a:[],b:[]});for(const n of v||[]){const x=$.get(n.assigned_front_id);x&&(n.nation_id===m?x.a:x.b).push(n)}const L=(v||[]).map(n=>n.id);if(L.length){const{data:n}=await y.from("army_units").select("id, name, brigades, total_manpower, status, army_id").in("army_id",L).eq("status","Active");for(const x of n||[])_.has(x.army_id)||_.set(x.army_id,[]),_.get(x.army_id).push(x)}const N=await Promise.all(s.map(n=>y.from("combat_events").select("id, tick, kind, terrain, pressor_nation_id, claimant_nation_id, pressor_nation_name, claimant_nation_name, sector_name, retreat_sector_name, army_name, unit_name, commander_name, cas_pressor, cas_claimant").eq("front_id",n).order("tick",{ascending:!1}).limit(8)));for(let n=0;n<s.length;n++)S.set(s[n],N[n].data||[])}const j=i?a.name:w,q=i?w:a.name,M=r=>r==="assault"?"ASSAULT":"DEFEND",P=p.length?p.map(r=>{const v=c.get(r.id)||[],L=Number(r.sector_count)||v.length,N=r.line_position===null||r.line_position===void 0?null:Number(r.line_position),n=k=>N===null?k.nation_id:k.position<=N?m:f,x=$.get(r.id)||{a:[],b:[]};let T=null,C=null;if(N!==null)T=v.find(k=>k.position===N)||null,C=v.find(k=>k.position===N+1)||null;else{const k=v.filter(H=>H.is_border&&H.nation_id===m),ne=v.filter(H=>H.is_border&&H.nation_id===f);T=k[k.length-1]||null,C=ne[0]||null}const ee=T&&C?`<div class="wr-clash">
                ${U(T,a,n(T))}
                <div class="wr-clash-vs">⚔</div>
                ${U(C,a,n(C))}
            </div>`:'<div class="wr-events-empty" style="padding:14px;">Front line not yet established for this front.</div>',te=S.get(r.id)||[],ae=pe(te,b,m,f,j,q),re=`<div class="wr-engagement">
            ${W(j,x.a,_,i)}
            ${ae}
            ${W(q,x.b,_,!i)}
        </div>`,B=(i?r.action_a:r.action_b)==="assault"?"assault":"defend",oe=h?`<div class="wr-orders">
                <span class="wr-ord-lab">YOUR ORDERS</span>
                <button class="wr-ord ${B==="assault"?"on":""}" data-wr-order="${F(r.id)}|assault">ASSAULT</button>
                <button class="wr-ord ${B==="defend"?"on":""}" data-wr-order="${F(r.id)}|defend">DEFEND</button>
            </div>`:"";return`<div class="wr-front">
            <div class="wr-front-head"><span class="wr-front-name">Front ${o(r.label||"")}</span><span class="wr-front-sub">${L} sectors · ${o(j)} ${M(r.action_a)} ← → ${M(r.action_b)} ${o(q)}</span></div>
            ${ee}
            ${re}
            ${oe}
        </div>`}).join(""):'<div class="wr-empty">No land fronts generated for this war yet.</div>',I=d?de[d.air_status]??2:2,K=i?I:4-I,V=[`${a.name} Domination`,`${a.name} Superiority`,"Contested",`${w} Superiority`,`${w} Domination`],Y=["you","you","","them","them"],X=`<div class="wr-spectrum">${V.map((r,v)=>`<div class="wr-seg ${Y[v]} ${v===K?"active":""}">${o(r)}</div>`).join("")}</div>`,J=A?"":'<div class="wr-naval">⚓ Naval War — no contested coastline; not applicable to this war.</div>',Q=i?Number(e.war_score_a)||0:Number(e.war_score_b)||0,Z=i?Number(e.war_score_b)||0:Number(e.war_score_a)||0;let E="";const R=e.ceasefire_offer_nation_id||null;return R===a.id?E=`<div class="wr-cf pending">You have requested a ceasefire — awaiting ${o(w)}'s head of government.</div>`:R===g&&(E=l?`<div class="wr-cf"><div class="wr-cf-t">${o(w)} has requested a <b>ceasefire</b> — white peace: the fighting stops and the front line holds where it stands. Accept to end the war.</div><div class="wr-cf-acts"><button type="button" class="wr-cf-btn accept" data-ceasefire="accept|${o(g)}">Accept ceasefire</button><button type="button" class="wr-cf-btn reject" data-ceasefire="reject|${o(g)}">Reject</button></div></div>`:`<div class="wr-cf pending">${o(w)} has requested a ceasefire — awaiting your head of government.</div>`),`<div class="wr-war">
        <div class="wr-head">
            <div class="wr-eyebrow">— ACTIVE CONFLICT —</div>
            <div class="wr-title">The ${o(a.name)}–${o(w)} War</div>
            <div class="wr-dates">Began ${o(se(Number(e.war_declared_at_tick))||"—")}${e.war_justification?` · ${o(e.war_justification)}`:""}</div>
            <div class="wr-score">Conquest Points — <span class="mine">${o(a.name)} ${Q}</span> · <span class="theirs">${o(w)} ${Z}</span></div>
        </div>
        ${E}
        <div class="wr-sec">LAND FRONTS</div>
        ${P}
        <div class="wr-sec">AIR WAR</div>
        ${X}
        <div class="wr-sec">NAVAL</div>
        ${J||'<div class="wr-naval">⚓ Naval War — active sea front.</div>'}
    </div>`}function U(e,a,u){return`<div class="wr-cell-big ${u===a.id?"mine":"theirs"}">
        <div class="cn">${o(e.name||"—")}</div>
        <div class="ct">${o((e.type||"").toUpperCase())}</div>
        <div class="cm">⚔ FRONT LINE</div>
    </div>`}function W(e,a,u,h){let l=0;const m=(a||[]).map(f=>{const g=f.supply_balance,w=g==null?"":Number(g)<0?`<span class="sup short">⚠ ${Number(g)}</span>`:`<span class="sup ok">+${Number(g)}</span>`,i=String(f.army_type||"regular").replace(/^./,d=>d.toUpperCase()),t=u.get(f.id)||[];for(const d of t)l+=Number(d.total_manpower)||0;const p=t.length?t.map(d=>`<div class="unit-row">
                    <span class="u-nm">${o(d.name||"Unit")}</span>
                    <span class="u-comp"> — ${o(ie(d.brigades))}</span>
                </div>`).join(""):'<div class="unit-row" style="opacity:0.55;">No active units</div>';return`<div class="wr-army-card">
            <div class="nm">${o(f.name||"Army")}</div>
            <div class="meta">${o(i)}${w}</div>
            ${p}
        </div>`}).join("")||'<div class="wr-events-empty" style="padding:14px 6px;">No forces assigned to this front.</div>';return`<div class="wr-force-col ${h?"mine":"theirs"}">
        <div class="wr-force-head">Forces of ${o(e)}</div>
        <div class="wr-force-armies">${m}</div>
        <div class="wr-force-foot">
            <span class="lab">Soldiers</span>
            <span class="val">${l.toLocaleString()}</span>
        </div>
    </div>`}function pe(e,a,u,h,l,b,m){const f=Array.isArray(e)?e:[],g=f.filter(s=>s.kind==="meeting"||s.kind==="breakthrough"),w=g.length===0?'<div class="wr-events-empty">No engagements logged on this front.</div>':g.map(s=>{const c=s.kind==="breakthrough"?"BREAKTHROUGH":"MEETING",$=String(s.terrain||"").toUpperCase();return`<div class="wr-event">
                <div class="wr-event-meta">Tick ${o(String(s.tick))} · ${o(c)} · ${o($)}</div>
                <div class="wr-event-body">${o(me(s))}</div>
            </div>`}).join(""),i=f.find(s=>Number(s.tick)===Number(a));let t=0,p=0;if(i){const s=Number(i.cas_pressor)||0,c=Number(i.cas_claimant)||0;i.pressor_nation_id===u&&(t+=s),i.pressor_nation_id===h&&(p+=s),i.claimant_nation_id===u&&(t+=c),i.claimant_nation_id===h&&(p+=c)}const d=s=>Number(s||0).toLocaleString(),A=`<div class="wr-casualties">
        <div class="wr-events-head">Monthly Casualties & Losses</div>
        <div class="wr-cas-row"><span class="wr-cas-nation">${o(l)}</span><span class="wr-cas-val">${d(t)} soldiers lost</span></div>
        <div class="wr-cas-row"><span class="wr-cas-nation">${o(b)}</span><span class="wr-cas-val">${d(p)} soldiers lost</span></div>
        ${i?"":'<div class="wr-cas-empty">No engagement this month.</div>'}
    </div>`;return`<div class="wr-events-col">
        <div class="wr-events-head">Combat Events</div>
        ${w}
        ${A}
    </div>`}const G={meeting:{plains:`{pressor_nation} carries the field at {sector}.
The {army}'s {unit}, under {commander}, met advancing {claimant_nation} columns in open country and broke them in a sweeping engagement. With no terrain to hide in and no time to dig, the {claimant_nation} formation lost cohesion under fire and gave ground; {pressor_nation} forces now hold the sector. The defeated brigades have fallen back toward {retreat_sector}.`,mountains:`{pressor_nation} seizes the high ground at {sector}.
Two advancing forces collided along the contested ridgeline, where the {army}'s {unit} proved faster to seize the commanding heights. From there, {commander}'s troops poured fire down on the {claimant_nation} columns still climbing below, forcing them off the slope. The fight cost both sides dearly, but the pass is now in {pressor_nation} hands. {claimant_nation} forces have withdrawn to {retreat_sector}.`,urban:`{pressor_nation} takes {sector} after street-by-street fighting.
Both armies pushed into the town at once, and what followed was a prolonged firefight through narrow streets, market squares, and the cellars beneath them. The {army}'s {unit} cleared the centre block by block under {commander}'s direction; the {claimant_nation} defenders, themselves on the offensive when the action began, never managed to consolidate. Survivors have pulled out to {retreat_sector}, leaving the smoking ruin behind them.`},breakthrough:{plains:`{pressor_nation} breaks through the {sector} line.
The {army}'s {unit} drove through the {claimant_nation} defensive positions in a coordinated armoured push, rolling forward across open ground despite prepared fire from dug-in infantry and anti-tank batteries. {commander}'s decision to commit reserves at the seam between two defending brigades broke the line, and the {claimant_nation} formation could not seal the gap before it widened. The defenders' surviving units have fallen back toward {retreat_sector}.`,mountains:`{pressor_nation} dislodges the defenders at {sector}.
The {army}'s {unit} took the contested ridge after days of grinding ascent, clearing fortified positions one outcrop at a time. {claimant_nation} defenders fought from prepared sangars and pre-registered firing points, exacting a heavy toll — but {commander}'s flanking column found a goat-path the defenders had not fully covered, and the position became untenable once enfilade fire began. The defending {unit} has withdrawn down the reverse slope toward {retreat_sector}.`,urban:`{pressor_nation} takes {sector} after a brutal house-to-house assault.
The {army}'s {unit} fought through prepared defensive positions in the town, where the {claimant_nation} garrison had had weeks to mine the approaches, barricade the streets, and turn upper floors into firing posts. Progress was measured in blocks and paid for in casualties on both sides, but {commander}'s troops cleared the town hall and the railway station by the third day, and the defenders' line collapsed thereafter. The surviving {claimant_nation} elements have retreated to {retreat_sector}, leaving wounded behind.`}};function me(e){const a=G[e.kind]||G.meeting,u=a[e.terrain]?e.terrain:"plains",h={pressor_nation:e.pressor_nation_name||"—",claimant_nation:e.claimant_nation_name||"—",sector:e.sector_name||"—",retreat_sector:e.retreat_sector_name||"the rear",army:e.army_name||"—",unit:e.unit_name||"—",commander:e.commander_name||"their commander"};return a[u].replace(/\{(\w+)\}/g,(l,b)=>h[b]!=null?h[b]:l)}export{O as m};
