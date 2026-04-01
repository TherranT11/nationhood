import{_ as p}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as Y}from"./common-BedtaFOo.js";import{e as v}from"./utils-C2W-HleY.js";import{I as S,J as A,K as M,L as B,M as G,N as J,O as Q,Q as L,j as z,D as F,R as U}from"./autocracy-silent-coup-vxZQTTX4.js";import{n as K,o as j}from"./government-structure-DKbbGMPO.js";import"./stats-Cp9T3CP_.js";let o=null,n=null,P=null,y={leader:[]},E={leader:null},C={leader:null},w=!1,$=null;Y("politics",async a=>{const{nation:e,faction:t,shard:i}=a;if(o=e,n=t,P=i,!e||!t){document.getElementById("pl-container").innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No nation or party found.</div>';return}X(),await Z(),x()});function X(){n.leader_first_name&&n.leader_last_name&&(E.leader={firstName:n.leader_first_name,lastName:n.leader_last_name,age:n.leader_age||null,electability:n.electability??50,ideology:n.leader_ideology||null,positiveTraits:n.leader_positive_traits||[],negativeTraits:n.leader_negative_traits||[]})}function I(){const a=E.leader;return a?{firstName:a.firstName,lastName:a.lastName,age:a.age||45,ideology:a.ideology||n.ideology_value_1||"PROGRESS",positiveTraits:a.positiveTraits||[],negativeTraits:a.negativeTraits||[],apCost:0,costBreakdown:{positiveTotal:0,negativeTotal:0,rawCost:0,apCost:0},isCurrent:!0,electability:a.electability??50}:null}async function V(a,e,t){const{error:i}=await p.from("leadership_candidates").upsert({faction_id:a,role:e,candidates:t,generated_at:new Date().toISOString()},{onConflict:"faction_id,role"});i&&console.warn(`Failed to persist ${e} candidates (non-blocking):`,i.message)}async function Z(){const a=o.name||"",e=n.id;let t=null;const{data:i,error:c}=await p.from("leadership_candidates").select("candidates, last_refresh_tick").eq("faction_id",e).eq("role","leader").maybeSingle();!c&&i&&Array.isArray(i.candidates)&&i.candidates.length>0?(t=i.candidates,$=i.last_refresh_tick):(t=S(a,F,3,"leader"),await V(e,"leader",t)),y.leader=t;const s=I();s&&y.leader.unshift(s),C.leader=null}function x(){const a=document.getElementById("pl-container"),e=y.leader,t=C.leader,i=t!==null?e[t]:null;let c="",s="";if(i&&!i.isCurrent){const d=A(i.apCost),f=M(i.apCost);c=`<span class="pl-header-cost" style="color:${d}">${f}</span>`,s='<button class="pl-appoint-btn" onclick="window._appointLeader()">Appoint Party Leader</button>'}a.innerHTML=`
        <div class="pl-header">
            <button class="pl-back-btn" onclick="window.location.href='politics.html'">&larr; Back</button>
            <div class="pl-header-left">
                <div class="pl-header-title">Party Leadership</div>
                <div class="pl-header-sub">${v(n.faction_name)}</div>
            </div>
            <div class="pl-header-right">
                ${c}
                ${s}
            </div>
        </div>

        <div class="pl-body">
            <div class="pl-list" id="pl-list">
                ${ee(e,t)}
                ${te()}
            </div>
            <div class="pl-detail" id="pl-detail">
                ${i?ae(i):'<div class="pl-detail-empty">Select a candidate</div>'}
            </div>
        </div>
    `}function ee(a,e){return!a||a.length===0?'<div style="padding:20px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:9px;">No candidates available.</div>':a.map((t,i)=>{const c=i===e,s=A(t.apCost),d=M(t.apCost),f=t.ideology||"",_=G[f]||"#888",g=f?f.charAt(0)+f.slice(1).toLowerCase():"Unknown",m=t.electability!=null?B(t.electability):null,u=t.isCurrent?'<span class="pl-current-pill">CURRENT</span>':"";return`
            <div class="pl-list-row ${c?"active":""}" onclick="window._selectCandidate(${i})">
                <div class="pl-list-row-top">
                    <span class="pl-list-name">${v(t.firstName)} ${v(t.lastName)}${u}</span>
                    <span class="pl-list-cost" style="color:${s}">${d}</span>
                </div>
                <div class="pl-list-age">Age ${t.age||"—"}</div>
                <div class="pl-list-meta">
                    <span class="pl-list-ideology">
                        <span class="pl-ideology-dot" style="background:${_}"></span>
                        <span style="color:${_}">${g}</span>
                    </span>
                    ${m?`<span class="pl-list-electability">
                        <span class="pl-list-electability-label">Electability: </span>
                        <span style="color:${m.color}">${m.label}</span>
                    </span>`:""}
                </div>
            </div>
        `}).join("")}function ae(a){const e=((a.firstName||"")[0]||"")+((a.lastName||"")[0]||""),t=a.ideology||"",i=G[t]||"#888",c=t?t.charAt(0)+t.slice(1).toLowerCase():"Unknown",s=a.electability!=null?B(a.electability):null,d=A(a.apCost),f=d+"14",_=d+"33",g=(a.positiveTraits||[]).map(l=>J[l]).filter(Boolean),m=g.reduce((l,r)=>l+r.cost,0),u=(a.negativeTraits||[]).map(l=>Q[l]).filter(Boolean),b=u.reduce((l,r)=>l+r.relief,0),k=a.costBreakdown?a.costBreakdown.rawCost:m-b,N=a.costBreakdown?a.costBreakdown.apCost:Math.max(0,Math.min(8,Math.round(m-b))),T=A(a.isCurrent?0:N);return`
        <!-- Identity Block -->
        <div class="pl-identity">
            <div class="pl-avatar">${v(e)}</div>
            <div class="pl-identity-info">
                <div class="pl-detail-name">${v(a.firstName)} ${v(a.lastName)}</div>
                <div class="pl-detail-age">Age ${a.age||"—"}</div>
                <div class="pl-detail-ideology">
                    <span class="pl-ideology-dot" style="background:${i}"></span>
                    <span style="color:${i}">${c}</span>
                </div>
            </div>
            <div class="pl-cost-box" style="background:${f};border:1px solid ${_}">
                <div class="pl-cost-number" style="color:${d}">${a.isCurrent||a.apCost===0?"FREE":a.apCost}</div>
                <div class="pl-cost-label">Appointment cost</div>
            </div>
        </div>

        ${s?`<!-- Electability Bar -->
        <div class="pl-electability" style="border-left:3px solid ${s.color}">
            <div class="pl-electability-header">
                <span class="pl-electability-title">ELECTABILITY</span>
                <span class="pl-electability-badge" style="color:${s.color};background:${s.color+"14"};border:1px solid ${s.color+"33"}">${s.label.toUpperCase()}</span>
            </div>
            <div class="pl-electability-track">
                <div class="pl-electability-fill" style="width:${a.electability}%;background:${s.color}"></div>
            </div>
            <div class="pl-electability-scale">
                <span>V.Low</span><span>Low</span><span>Moderate</span><span>High</span><span>V.High</span>
            </div>
        </div>`:""}

        <!-- Strengths -->
        <div class="pl-section-header">STRENGTHS ${g.length>0?`<span style="color:var(--green)">+${m.toFixed(1)}</span>`:""}</div>
        ${g.length>0?g.map(l=>{const r=L[l.category]||L.AP;return`
                <div class="pl-trait-card strength">
                    <div class="pl-trait-top">
                        <div class="pl-trait-name-wrap">
                            <span class="pl-trait-name">${v(l.name)}</span>
                            <span class="pl-trait-category" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${l.category.toUpperCase()}</span>
                        </div>
                        <span class="pl-trait-cost positive">+${l.cost.toFixed(1)}</span>
                    </div>
                    <div class="pl-trait-effect">${v(l.effect)}</div>
                </div>
            `}).join(""):'<div style="padding:8px 0;color:var(--text-dim);font-family:var(--font-mono);font-size:9px;">None</div>'}

        <!-- Weaknesses -->
        <div class="pl-section-header">WEAKNESSES ${u.length>0?`<span style="color:var(--red)">&minus;${b.toFixed(1)}</span>`:""}</div>
        ${u.length>0?u.map(l=>{const r=L[l.category]||L.AP;return`
                <div class="pl-trait-card weakness">
                    <div class="pl-trait-top">
                        <div class="pl-trait-name-wrap">
                            <span class="pl-trait-name">${v(l.name)}</span>
                            <span class="pl-trait-category" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${l.category.toUpperCase()}</span>
                        </div>
                        <span class="pl-trait-cost negative">&minus;${l.relief.toFixed(1)}</span>
                    </div>
                    <div class="pl-trait-effect">${v(l.effect)}</div>
                </div>
            `}).join(""):'<div style="padding:8px 0;color:var(--text-dim);font-family:var(--font-mono);font-size:9px;">None</div>'}

        <!-- Cost Breakdown -->
        ${a.isCurrent?`
        <div class="pl-breakdown">
            <div class="pl-breakdown-title">COST BREAKDOWN</div>
            <div class="pl-breakdown-math">
                <span style="color:var(--green);font-weight:700">Current leader &mdash; reappointment is free</span>
            </div>
        </div>
        `:`
        <div class="pl-breakdown">
            <div class="pl-breakdown-title">COST BREAKDOWN</div>
            <div class="pl-breakdown-math">
                <span class="pos">+${m.toFixed(1)}</span>
                <span class="op"> strengths </span>
                <span class="neg">&minus; ${b.toFixed(1)}</span>
                <span class="op"> weaknesses </span>
                <span class="op">= </span>
                <span class="raw">${k.toFixed(1)} raw</span>
                <span class="op"> &rarr; </span>
                <span class="final" style="color:${T}">${N} AP</span>
            </div>
        </div>
        `}
    `}function te(){const a=P?.current_tick||0;return $!=null&&$>=a?`<div class="pl-refresh-wrap">
            <button class="pl-refresh-btn pl-refresh-used" disabled>Refresh Leaders</button>
            <div class="pl-refresh-note">Can only be used once per tick.</div>
        </div>`:`<div class="pl-refresh-wrap">
        <button class="pl-refresh-btn" onclick="window._refreshLeaders()">Refresh Leaders</button>
        <div class="pl-refresh-note">5 AP — wipe all candidates and generate new ones</div>
    </div>`}window._refreshLeaders=async function(){if(w)return;const a=P?.current_tick||0;if($!=null&&$>=a){alert("Can only be used once per tick.");return}if(!confirm(`Refresh all leadership candidates?

This will wipe the current candidates and generate new ones.
Cost: 5 AP`))return;w=!0;const e=document.querySelector(".pl-refresh-btn");e&&(e.disabled=!0,e.textContent="Refreshing...");try{const t=await z(p,n.id,5);if(!t.success){alert("Not enough AP. Need 5 AP, have "+(t.currentAp??"?")+".");return}n.action_points=t.newAp;const i=o.name||"",c=S(i,F,3,"leader"),{error:s}=await p.from("leadership_candidates").upsert({faction_id:n.id,role:"leader",candidates:c,generated_at:new Date().toISOString(),last_refresh_tick:a},{onConflict:"faction_id,role"});if(s){console.error("Failed to persist refreshed candidates:",s.message),alert("Error saving new candidates: "+s.message);return}$=a,y.leader=c;const d=I();d&&y.leader.unshift(d),C.leader=null,x()}catch(t){alert("Error: "+t.message)}finally{w=!1,e&&e.isConnected&&(e.disabled=!1,e.textContent="Refresh Leaders")}};window._selectCandidate=function(a){C.leader=a,x()};window._appointLeader=async function(){if(w)return;const a=C.leader;if(a===null)return;const e=y.leader[a];if(!e||e.isCurrent)return;const t=[`Appoint ${e.firstName} ${e.lastName} as Party Leader?
`,`Cost: ${M(e.apCost)}`,`Ideology: ${e.ideology}`];e.electability!=null&&t.push(`Electability: ${B(e.electability).label}`),t.push("","This will replace the current party leader.");const i=o?.ruling_faction_id===n?.id,c=!K(o)&&!j(o);if(i&&c&&t.push("As the ruling party leader, they will also become Prime Minister."),!confirm(t.join(`
`)))return;w=!0;const s=document.querySelector(".pl-appoint-btn");s&&(s.disabled=!0,s.textContent="Appointing...");try{const d=P?.current_tick||0;e.apCost>0&&await z(p,n.id,e.apCost);const f={leader_first_name:e.firstName,leader_last_name:e.lastName,leader_age:e.age,electability:e.electability,leader_ideology:e.ideology||null,leader_positive_traits:e.positiveTraits||[],leader_negative_traits:e.negativeTraits||[]},{error:_}=await p.from("factions").update(f).eq("id",n.id);if(_)throw new Error("Failed to update faction: "+_.message);const g=o.ruling_faction_id===n.id,m=!K(o)&&!j(o);if(g&&m){const r=U[Math.floor(Math.random()*U.length)],O=e.age||35+Math.floor(Math.random()*16),R=`${e.firstName} ${e.lastName}`,{error:q}=await p.from("head_of_government").update({first_name:e.firstName,last_name:e.lastName,age:O,trait_key:r,appointed_tick:d}).eq("nation_id",o.id).eq("active",!0);q&&console.warn("Failed to update head_of_government (non-blocking):",q.message);const{error:D}=await p.from("ministries").update({minister_first_name:e.firstName,minister_last_name:e.lastName,minister_age:O}).eq("nation_id",o.id).eq("ministry_key","prime_minister").eq("is_active",!0);D&&console.warn("Failed to update PM ministry (non-blocking):",D.message);const{error:H}=await p.from("administrations").update({prime_minister:R,admin_name:`${e.lastName} Administration`,updated_at:new Date().toISOString()}).eq("nation_id",o.id).is("ended_at_tick",null);H&&console.warn("Failed to update administration (non-blocking):",H.message);try{const{data:h}=await p.from("leader_traits").select("effects").eq("trait_key",r).single();if(h?.effects?.on_appoint_stability){const W=Math.max(0,Math.min(100,(o.stability||50)+h.effects.on_appoint_stability));await p.from("nations").update({stability:W}).eq("id",o.id)}}catch(h){console.warn("PM trait stability effect failed (non-blocking):",h)}try{await p.rpc("fire_system_event",{p_trigger_key:"pm_appointed",p_nation_id:o.id,p_tick:d,p_placeholders:{nation:o.name||"",pm_name:R,party:n.faction_name,trait:r}})}catch(h){console.warn("PM appointed event fire failed (non-blocking):",h)}console.log(`Ruling party leader change → PM updated: ${R} (trait: ${r})`)}const u=E.leader,b=u?`${e.firstName} ${e.lastName} replaces ${u.firstName} ${u.lastName} as Party Leader of ${n.faction_name}.`:`${e.firstName} ${e.lastName} appointed as Party Leader of ${n.faction_name}.`;await p.from("event_log").insert({nation_id:o.id,event_name:"New Party Leader",description_chosen:b,category:"POLITICAL",fired_at_tick:d}).then(({error:r})=>{r&&console.warn("Event log insert failed (non-blocking):",r.message)});const k={firstName:e.firstName,lastName:e.lastName,age:e.age,ideology:e.ideology,positiveTraits:e.positiveTraits,negativeTraits:e.negativeTraits};e.electability!=null&&(k.electability=e.electability),E.leader=k;const N=o.name||"",T=S(N,F,3,"leader");await V(n.id,"leader",T),y.leader=T;const l=I();l&&y.leader.unshift(l),C.leader=0,x(),alert(`${e.firstName} ${e.lastName} has been appointed as Party Leader!`)}catch(d){alert("Error: "+d.message),s&&(s.disabled=!1,s.textContent="Appoint Party Leader")}finally{w=!1}};
