import{_supabase as f}from"./supabase-client-CiYoFhIh.js";/* empty css                  */import{i as J}from"./common-D1rIR0Tm.js";import{e as y}from"./utils-DGqmZD5X.js";import{deductAP as U}from"./config-CHsHqv7d.js";import{a0 as P,a1 as L,a2 as B,a3 as I,a4 as D,a5 as z,a6 as V,a7 as A,g as E,a8 as W}from"./political-actions-CoM-LDWz.js";import{o as H}from"./government-structure-C17uG6rl.js";import"./preload-helper-BXl3LOEh.js";import"./corp-topbar-B9cSZncf.js";import"./stats-4gK98flh.js";let p=null,i=null,x=null,h={leader:[]},v={leader:null},C={leader:null},w=!1,$=null;J("politics",async a=>{const{nation:e,faction:t,shard:s}=a;if(p=e,i=t,x=s,!e||!t){document.getElementById("pl-container").innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No nation or party found.</div>';return}await Y(),await Q(),S()});async function Y(){if(i.leader_first_name&&i.leader_last_name&&(v.leader={firstName:i.leader_first_name,lastName:i.leader_last_name,age:i.leader_age||null,electability:i.electability??50,ideology:i.leader_ideology||null,positiveTraits:i.leader_positive_traits||[],negativeTraits:i.leader_negative_traits||[]},(!i.leader_positive_traits||i.leader_positive_traits.length===0)&&(!i.leader_negative_traits||i.leader_negative_traits.length===0))){const a=P(p?.name||"",E,1,"leader");if(a.length>0){const e=a[0];v.leader.positiveTraits=e.positiveTraits||[],v.leader.negativeTraits=e.negativeTraits||[],await f.from("factions").update({leader_positive_traits:v.leader.positiveTraits,leader_negative_traits:v.leader.negativeTraits}).eq("id",i.id),i.leader_positive_traits=v.leader.positiveTraits,i.leader_negative_traits=v.leader.negativeTraits,console.log("[PartyLeadership] Auto-backfilled traits for current leader:",v.leader.positiveTraits,v.leader.negativeTraits)}}}function O(){const a=v.leader;return a?{firstName:a.firstName,lastName:a.lastName,age:a.age||45,ideology:a.ideology||"PROGRESS",positiveTraits:a.positiveTraits||[],negativeTraits:a.negativeTraits||[],apCost:0,costBreakdown:{positiveTotal:0,negativeTotal:0,rawCost:0,apCost:0},isCurrent:!0,electability:a.electability??50}:null}async function K(a,e,t){const{error:s}=await f.from("leadership_candidates").upsert({faction_id:a,role:e,candidates:t,generated_at:new Date().toISOString()},{onConflict:"faction_id,role"});s&&console.warn(`Failed to persist ${e} candidates (non-blocking):`,s.message)}async function Q(){const a=p.name||"",e=i.id;let t=null;const s=`leadership_candidates_${e}_leader`,{data:d,error:n}=await f.from("leadership_candidates").select("candidates, last_refresh_tick").eq("faction_id",e).eq("role","leader").maybeSingle();if(!n&&d&&Array.isArray(d.candidates)&&d.candidates.length>0){t=d.candidates,$=d.last_refresh_tick;try{sessionStorage.setItem(s,JSON.stringify(t))}catch{}}else{try{const c=sessionStorage.getItem(s);if(c){const g=JSON.parse(c);Array.isArray(g)&&g.length>0&&(t=g)}}catch{}if(!t){t=P(a,E,3,"leader"),await K(e,"leader",t);try{sessionStorage.setItem(s,JSON.stringify(t))}catch{}}}h.leader=t;const o=O();o&&h.leader.unshift(o),C.leader=null}function S(){const a=document.getElementById("pl-container"),e=h.leader,t=C.leader,s=t!==null?e[t]:null;let d="",n="";if(s&&!s.isCurrent){const o=L(s.apCost),c=B(s.apCost);d=`<span class="pl-header-cost" style="color:${o}">${c}</span>`,n='<button class="pl-appoint-btn" onclick="window._appointLeader()">Appoint Party Leader</button>'}a.innerHTML=`
        <div class="pl-header">
            <button class="pl-back-btn" onclick="window.location.href='politics.html'">&larr; Back</button>
            <div class="pl-header-left">
                <div class="pl-header-title">Party Leadership</div>
                <div class="pl-header-sub">${y(i.faction_name)}</div>
            </div>
            <div class="pl-header-right">
                ${d}
                ${n}
            </div>
        </div>

        <div class="pl-body">
            <div class="pl-list" id="pl-list">
                ${X(e,t)}
                ${ee()}
            </div>
            <div class="pl-detail" id="pl-detail">
                ${s?Z(s):'<div class="pl-detail-empty">Select a candidate</div>'}
            </div>
        </div>
    `}function X(a,e){return!a||a.length===0?'<div style="padding:20px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:9px;">No candidates available.</div>':a.map((t,s)=>{const d=s===e,n=L(t.apCost),o=B(t.apCost),c=t.ideology||"",g=D[c]||"#888",_=c?c.charAt(0)+c.slice(1).toLowerCase():"Unknown",m=t.electability!=null?I(t.electability):null,u=t.isCurrent?'<span class="pl-current-pill">CURRENT</span>':"";return`
            <div class="pl-list-row ${d?"active":""}" onclick="window._selectCandidate(${s})">
                <div class="pl-list-row-top">
                    <span class="pl-list-name">${y(t.firstName)} ${y(t.lastName)}${u}</span>
                    <span class="pl-list-cost" style="color:${n}">${o}</span>
                </div>
                <div class="pl-list-age">Age ${t.age||"—"}</div>
                <div class="pl-list-meta">
                    <span class="pl-list-ideology">
                        <span class="pl-ideology-dot" style="background:${g}"></span>
                        <span style="color:${g}">${_}</span>
                    </span>
                    ${m?`<span class="pl-list-electability">
                        <span class="pl-list-electability-label">Electability: </span>
                        <span style="color:${m.color}">${m.label}</span>
                    </span>`:""}
                </div>
            </div>
        `}).join("")}function Z(a){const e=((a.firstName||"")[0]||"")+((a.lastName||"")[0]||""),t=a.ideology||"",s=D[t]||"#888",d=t?t.charAt(0)+t.slice(1).toLowerCase():"Unknown",n=a.electability!=null?I(a.electability):null,o=L(a.apCost),c=o+"14",g=o+"33",_=(a.positiveTraits||[]).map(r=>z[r]).filter(Boolean),m=_.reduce((r,l)=>r+l.cost,0),u=(a.negativeTraits||[]).map(r=>V[r]).filter(Boolean),b=u.reduce((r,l)=>r+l.relief,0),N=a.costBreakdown?a.costBreakdown.rawCost:m-b,k=a.costBreakdown?a.costBreakdown.apCost:Math.max(0,Math.min(8,Math.round(m-b))),T=L(a.isCurrent?0:k);return`
        <!-- Identity Block -->
        <div class="pl-identity">
            <div class="pl-avatar">${y(e)}</div>
            <div class="pl-identity-info">
                <div class="pl-detail-name">${y(a.firstName)} ${y(a.lastName)}</div>
                <div class="pl-detail-age">Age ${a.age||"—"}</div>
                <div class="pl-detail-ideology">
                    <span class="pl-ideology-dot" style="background:${s}"></span>
                    <span style="color:${s}">${d}</span>
                </div>
            </div>
            <div class="pl-cost-box" style="background:${c};border:1px solid ${g}">
                <div class="pl-cost-number" style="color:${o}">${a.isCurrent||a.apCost===0?"FREE":a.apCost}</div>
                <div class="pl-cost-label">Appointment cost</div>
            </div>
        </div>

        ${n?`<!-- Electability Bar -->
        <div class="pl-electability" style="border-left:3px solid ${n.color}">
            <div class="pl-electability-header">
                <span class="pl-electability-title">ELECTABILITY</span>
                <span class="pl-electability-badge" style="color:${n.color};background:${n.color+"14"};border:1px solid ${n.color+"33"}">${n.label.toUpperCase()}</span>
            </div>
            <div class="pl-electability-track">
                <div class="pl-electability-fill" style="width:${a.electability}%;background:${n.color}"></div>
            </div>
            <div class="pl-electability-scale">
                <span>V.Low</span><span>Low</span><span>Moderate</span><span>High</span><span>V.High</span>
            </div>
        </div>`:""}

        <!-- Strengths -->
        <div class="pl-section-header">STRENGTHS ${_.length>0?`<span style="color:var(--green)">+${m.toFixed(1)}</span>`:""}</div>
        ${_.length>0?_.map(r=>{const l=A[r.category]||A.AP;return`
                <div class="pl-trait-card strength">
                    <div class="pl-trait-top">
                        <div class="pl-trait-name-wrap">
                            <span class="pl-trait-name">${y(r.name)}</span>
                            <span class="pl-trait-category" style="color:${l.color};background:${l.bg};border:1px solid ${l.border}">${r.category.toUpperCase()}</span>
                        </div>
                        <span class="pl-trait-cost positive">+${r.cost.toFixed(1)}</span>
                    </div>
                    <div class="pl-trait-effect">${y(r.effect)}</div>
                </div>
            `}).join(""):'<div style="padding:8px 0;color:var(--text-dim);font-family:var(--font-mono);font-size:9px;">None</div>'}

        <!-- Weaknesses -->
        <div class="pl-section-header">WEAKNESSES ${u.length>0?`<span style="color:var(--red)">&minus;${b.toFixed(1)}</span>`:""}</div>
        ${u.length>0?u.map(r=>{const l=A[r.category]||A.AP;return`
                <div class="pl-trait-card weakness">
                    <div class="pl-trait-top">
                        <div class="pl-trait-name-wrap">
                            <span class="pl-trait-name">${y(r.name)}</span>
                            <span class="pl-trait-category" style="color:${l.color};background:${l.bg};border:1px solid ${l.border}">${r.category.toUpperCase()}</span>
                        </div>
                        <span class="pl-trait-cost negative">&minus;${r.relief.toFixed(1)}</span>
                    </div>
                    <div class="pl-trait-effect">${y(r.effect)}</div>
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
                <span class="raw">${N.toFixed(1)} raw</span>
                <span class="op"> &rarr; </span>
                <span class="final" style="color:${T}">${k} AP</span>
            </div>
        </div>
        `}
    `}function ee(){const a=x?.current_tick||0;return $!=null&&$>=a?`<div class="pl-refresh-wrap">
            <button class="pl-refresh-btn pl-refresh-used" disabled>Refresh Leaders</button>
            <div class="pl-refresh-note">Can only be used once per tick.</div>
        </div>`:`<div class="pl-refresh-wrap">
        <button class="pl-refresh-btn" onclick="window._refreshLeaders()">Refresh Leaders</button>
        <div class="pl-refresh-note">5 AP — wipe all candidates and generate new ones</div>
    </div>`}window._refreshLeaders=async function(){if(w)return;const a=x?.current_tick||0;if($!=null&&$>=a){alert("Can only be used once per tick.");return}if(!confirm(`Refresh all leadership candidates?

This will wipe the current candidates and generate new ones.
Cost: 5 AP`))return;w=!0;const e=document.querySelector(".pl-refresh-btn");e&&(e.disabled=!0,e.textContent="Refreshing...");try{const t=await U(f,i.id,5);if(!t.success){alert("Not enough AP. Need 5 AP, have "+(t.currentAp??"?")+".");return}i.action_points=t.newAp;const s=p.name||"",d=P(s,E,3,"leader"),{error:n}=await f.from("leadership_candidates").upsert({faction_id:i.id,role:"leader",candidates:d,generated_at:new Date().toISOString(),last_refresh_tick:a},{onConflict:"faction_id,role"});if(n){console.error("Failed to persist refreshed candidates:",n.message),alert("Error saving new candidates: "+n.message);return}$=a,h.leader=d;try{sessionStorage.setItem(`leadership_candidates_${i.id}_leader`,JSON.stringify(d))}catch{}const o=O();o&&h.leader.unshift(o),C.leader=null,S()}catch(t){alert("Error: "+t.message)}finally{w=!1,e&&e.isConnected&&(e.disabled=!1,e.textContent="Refresh Leaders")}};window._selectCandidate=function(a){C.leader=a,S()};window._appointLeader=async function(){if(w)return;if(p?.government_type==="Absolute Monarchy"&&p?.monarch_faction_id===i?.id){alert("The monarch cannot be replaced through party leadership. The King rules until death or abdication.");return}const a=C.leader;if(a===null)return;const e=h.leader[a];if(!e)return;if(e.isCurrent){!(i.leader_positive_traits&&i.leader_positive_traits.length>0)&&e.positiveTraits&&e.positiveTraits.length>0&&(await f.from("factions").update({leader_positive_traits:e.positiveTraits||[],leader_negative_traits:e.negativeTraits||[]}).eq("id",i.id),i.leader_positive_traits=e.positiveTraits,i.leader_negative_traits=e.negativeTraits,alert("Leader traits synced. They will now apply to campaign actions."));return}const t=[`Appoint ${e.firstName} ${e.lastName} as Party Leader?
`,`Cost: ${B(e.apCost)}`,`Ideology: ${e.ideology}`];e.electability!=null&&t.push(`Electability: ${I(e.electability).label}`),t.push("","This will replace the current party leader.");const s=p?.ruling_faction_id===i?.id,d=H(p);if(s&&d&&t.push("As the ruling party leader, they will also become Prime Minister."),!confirm(t.join(`
`)))return;w=!0;const n=document.querySelector(".pl-appoint-btn");n&&(n.disabled=!0,n.textContent="Appointing...");try{const o=x?.current_tick||0;if(e.apCost>0){const l=await U(f,i.id,e.apCost);if(!l.success){alert("Not enough AP. Need "+e.apCost+" AP.");return}i.action_points=l.newAp}const c={leader_first_name:e.firstName,leader_last_name:e.lastName,leader_age:e.age,electability:e.electability,leader_ideology:e.ideology||null,leader_positive_traits:e.positiveTraits||[],leader_negative_traits:e.negativeTraits||[]},{error:g}=await f.from("factions").update(c).eq("id",i.id);if(g)throw new Error("Failed to update faction: "+g.message);const _=p.ruling_faction_id===i.id,m=H(p);if(_&&m){const l=e.positiveTraits&&e.positiveTraits.length>0?e.positiveTraits[0]:null,F=e.age||35+Math.floor(Math.random()*16),R=`${e.firstName} ${e.lastName}`,{error:M}=await f.from("head_of_government").update({first_name:e.firstName,last_name:e.lastName,age:F,trait_key:l,appointed_tick:o}).eq("nation_id",p.id).eq("active",!0);M&&console.warn("Failed to update head_of_government (non-blocking):",M.message);const{error:q}=await f.from("ministries").update({minister_first_name:e.firstName,minister_last_name:e.lastName,minister_age:F}).eq("nation_id",p.id).eq("ministry_key","prime_minister").eq("is_active",!0);q&&console.warn("Failed to update PM ministry (non-blocking):",q.message);const j=[i.leader_first_name,i.leader_last_name].filter(Boolean).join(" ").trim()||null;await W(f,p.id,{tick:o??null,role:"prime_minister",reason:"party_leadership_change",old_name:j,new_name:R,old_party_id:i.id,new_party_id:i.id});try{await f.rpc("fire_system_event",{p_trigger_key:"pm_appointed",p_nation_id:p.id,p_tick:o,p_placeholders:{nation:p.name||"",pm_name:R,party:i.faction_name,trait:l}})}catch(G){console.warn("PM appointed event fire failed (non-blocking):",G)}console.log(`Ruling party leader change → PM updated: ${R} (trait: ${l})`)}const u=v.leader,b=u?`${e.firstName} ${e.lastName} replaces ${u.firstName} ${u.lastName} as Party Leader of ${i.faction_name}.`:`${e.firstName} ${e.lastName} appointed as Party Leader of ${i.faction_name}.`;await f.from("event_log").insert({nation_id:p.id,event_name:"New Party Leader",description_chosen:b,category:"POLITICAL",fired_at_tick:o}).then(({error:l})=>{l&&console.warn("Event log insert failed (non-blocking):",l.message)});const N={firstName:e.firstName,lastName:e.lastName,age:e.age,ideology:e.ideology,positiveTraits:e.positiveTraits,negativeTraits:e.negativeTraits};e.electability!=null&&(N.electability=e.electability),v.leader=N;const k=p.name||"",T=P(k,E,3,"leader");await K(i.id,"leader",T);try{sessionStorage.setItem(`leadership_candidates_${i.id}_leader`,JSON.stringify(T))}catch{}h.leader=T;const r=O();r&&h.leader.unshift(r),C.leader=0,S(),alert(`${e.firstName} ${e.lastName} has been appointed as Party Leader!`)}catch(o){alert("Error: "+o.message),n&&(n.disabled=!1,n.textContent="Appoint Party Leader")}finally{w=!1}};
