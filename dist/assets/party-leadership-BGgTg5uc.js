import{_supabase as f}from"./supabase-client-qEAQbBjE.js";/* empty css                  */import{i as J}from"./common-C-5ANF5B.js";import{escapeHtml as y}from"./utils-A98FEun4.js";import{deductAP as U}from"./config-CKNXR-qR.js";import{h as P,i as L,j as I,k as O,I as K,l as z,N as V,C as A,g as E}from"./political-actions-DsQwKOfA.js";import{ae as H}from"./government-structure-BV9odx-I.js";import"./preload-helper-BXl3LOEh.js";import"./corp-topbar-CPI0igZM.js";import"./stats-tIiBSaQA.js";let p=null,i=null,S=null,h={leader:[]},v={leader:null},C={leader:null},w=!1,$=null;J("politics",async t=>{const{nation:e,faction:a,shard:s}=t;if(p=e,i=a,S=s,!e||!a){document.getElementById("pl-container").innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No nation or party found.</div>';return}await W(),await Y(),x()});async function W(){if(i.leader_first_name&&i.leader_last_name&&(v.leader={firstName:i.leader_first_name,lastName:i.leader_last_name,age:i.leader_age||null,electability:i.electability??50,ideology:i.leader_ideology||null,positiveTraits:i.leader_positive_traits||[],negativeTraits:i.leader_negative_traits||[]},(!i.leader_positive_traits||i.leader_positive_traits.length===0)&&(!i.leader_negative_traits||i.leader_negative_traits.length===0))){const t=P(p?.name||"",E,1,"leader");if(t.length>0){const e=t[0];v.leader.positiveTraits=e.positiveTraits||[],v.leader.negativeTraits=e.negativeTraits||[],await f.from("factions").update({leader_positive_traits:v.leader.positiveTraits,leader_negative_traits:v.leader.negativeTraits}).eq("id",i.id),i.leader_positive_traits=v.leader.positiveTraits,i.leader_negative_traits=v.leader.negativeTraits,console.log("[PartyLeadership] Auto-backfilled traits for current leader:",v.leader.positiveTraits,v.leader.negativeTraits)}}}function B(){const t=v.leader;return t?{firstName:t.firstName,lastName:t.lastName,age:t.age||45,ideology:t.ideology||i.ideology_value_1||"PROGRESS",positiveTraits:t.positiveTraits||[],negativeTraits:t.negativeTraits||[],apCost:0,costBreakdown:{positiveTotal:0,negativeTotal:0,rawCost:0,apCost:0},isCurrent:!0,electability:t.electability??50}:null}async function j(t,e,a){const{error:s}=await f.from("leadership_candidates").upsert({faction_id:t,role:e,candidates:a,generated_at:new Date().toISOString()},{onConflict:"faction_id,role"});s&&console.warn(`Failed to persist ${e} candidates (non-blocking):`,s.message)}async function Y(){const t=p.name||"",e=i.id;let a=null;const s=`leadership_candidates_${e}_leader`,{data:d,error:n}=await f.from("leadership_candidates").select("candidates, last_refresh_tick").eq("faction_id",e).eq("role","leader").maybeSingle();if(!n&&d&&Array.isArray(d.candidates)&&d.candidates.length>0){a=d.candidates,$=d.last_refresh_tick;try{sessionStorage.setItem(s,JSON.stringify(a))}catch{}}else{try{const c=sessionStorage.getItem(s);if(c){const g=JSON.parse(c);Array.isArray(g)&&g.length>0&&(a=g)}}catch{}if(!a){a=P(t,E,3,"leader"),await j(e,"leader",a);try{sessionStorage.setItem(s,JSON.stringify(a))}catch{}}}h.leader=a;const o=B();o&&h.leader.unshift(o),C.leader=null}function x(){const t=document.getElementById("pl-container"),e=h.leader,a=C.leader,s=a!==null?e[a]:null;let d="",n="";if(s&&!s.isCurrent){const o=L(s.apCost),c=I(s.apCost);d=`<span class="pl-header-cost" style="color:${o}">${c}</span>`,n='<button class="pl-appoint-btn" onclick="window._appointLeader()">Appoint Party Leader</button>'}t.innerHTML=`
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
                ${Q(e,a)}
                ${Z()}
            </div>
            <div class="pl-detail" id="pl-detail">
                ${s?X(s):'<div class="pl-detail-empty">Select a candidate</div>'}
            </div>
        </div>
    `}function Q(t,e){return!t||t.length===0?'<div style="padding:20px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:9px;">No candidates available.</div>':t.map((a,s)=>{const d=s===e,n=L(a.apCost),o=I(a.apCost),c=a.ideology||"",g=K[c]||"#888",_=c?c.charAt(0)+c.slice(1).toLowerCase():"Unknown",m=a.electability!=null?O(a.electability):null,u=a.isCurrent?'<span class="pl-current-pill">CURRENT</span>':"";return`
            <div class="pl-list-row ${d?"active":""}" onclick="window._selectCandidate(${s})">
                <div class="pl-list-row-top">
                    <span class="pl-list-name">${y(a.firstName)} ${y(a.lastName)}${u}</span>
                    <span class="pl-list-cost" style="color:${n}">${o}</span>
                </div>
                <div class="pl-list-age">Age ${a.age||"—"}</div>
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
        `}).join("")}function X(t){const e=((t.firstName||"")[0]||"")+((t.lastName||"")[0]||""),a=t.ideology||"",s=K[a]||"#888",d=a?a.charAt(0)+a.slice(1).toLowerCase():"Unknown",n=t.electability!=null?O(t.electability):null,o=L(t.apCost),c=o+"14",g=o+"33",_=(t.positiveTraits||[]).map(r=>z[r]).filter(Boolean),m=_.reduce((r,l)=>r+l.cost,0),u=(t.negativeTraits||[]).map(r=>V[r]).filter(Boolean),b=u.reduce((r,l)=>r+l.relief,0),N=t.costBreakdown?t.costBreakdown.rawCost:m-b,k=t.costBreakdown?t.costBreakdown.apCost:Math.max(0,Math.min(8,Math.round(m-b))),T=L(t.isCurrent?0:k);return`
        <!-- Identity Block -->
        <div class="pl-identity">
            <div class="pl-avatar">${y(e)}</div>
            <div class="pl-identity-info">
                <div class="pl-detail-name">${y(t.firstName)} ${y(t.lastName)}</div>
                <div class="pl-detail-age">Age ${t.age||"—"}</div>
                <div class="pl-detail-ideology">
                    <span class="pl-ideology-dot" style="background:${s}"></span>
                    <span style="color:${s}">${d}</span>
                </div>
            </div>
            <div class="pl-cost-box" style="background:${c};border:1px solid ${g}">
                <div class="pl-cost-number" style="color:${o}">${t.isCurrent||t.apCost===0?"FREE":t.apCost}</div>
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
                <div class="pl-electability-fill" style="width:${t.electability}%;background:${n.color}"></div>
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
        ${t.isCurrent?`
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
    `}function Z(){const t=S?.current_tick||0;return $!=null&&$>=t?`<div class="pl-refresh-wrap">
            <button class="pl-refresh-btn pl-refresh-used" disabled>Refresh Leaders</button>
            <div class="pl-refresh-note">Can only be used once per tick.</div>
        </div>`:`<div class="pl-refresh-wrap">
        <button class="pl-refresh-btn" onclick="window._refreshLeaders()">Refresh Leaders</button>
        <div class="pl-refresh-note">5 AP — wipe all candidates and generate new ones</div>
    </div>`}window._refreshLeaders=async function(){if(w)return;const t=S?.current_tick||0;if($!=null&&$>=t){alert("Can only be used once per tick.");return}if(!confirm(`Refresh all leadership candidates?

This will wipe the current candidates and generate new ones.
Cost: 5 AP`))return;w=!0;const e=document.querySelector(".pl-refresh-btn");e&&(e.disabled=!0,e.textContent="Refreshing...");try{const a=await U(f,i.id,5);if(!a.success){alert("Not enough AP. Need 5 AP, have "+(a.currentAp??"?")+".");return}i.action_points=a.newAp;const s=p.name||"",d=P(s,E,3,"leader"),{error:n}=await f.from("leadership_candidates").upsert({faction_id:i.id,role:"leader",candidates:d,generated_at:new Date().toISOString(),last_refresh_tick:t},{onConflict:"faction_id,role"});if(n){console.error("Failed to persist refreshed candidates:",n.message),alert("Error saving new candidates: "+n.message);return}$=t,h.leader=d;try{sessionStorage.setItem(`leadership_candidates_${i.id}_leader`,JSON.stringify(d))}catch{}const o=B();o&&h.leader.unshift(o),C.leader=null,x()}catch(a){alert("Error: "+a.message)}finally{w=!1,e&&e.isConnected&&(e.disabled=!1,e.textContent="Refresh Leaders")}};window._selectCandidate=function(t){C.leader=t,x()};window._appointLeader=async function(){if(w)return;if(p?.government_type==="Absolute Monarchy"&&p?.monarch_faction_id===i?.id){alert("The monarch cannot be replaced through party leadership. The King rules until death or abdication.");return}const t=C.leader;if(t===null)return;const e=h.leader[t];if(!e)return;if(e.isCurrent){!(i.leader_positive_traits&&i.leader_positive_traits.length>0)&&e.positiveTraits&&e.positiveTraits.length>0&&(await f.from("factions").update({leader_positive_traits:e.positiveTraits||[],leader_negative_traits:e.negativeTraits||[]}).eq("id",i.id),i.leader_positive_traits=e.positiveTraits,i.leader_negative_traits=e.negativeTraits,alert("Leader traits synced. They will now apply to campaign actions."));return}const a=[`Appoint ${e.firstName} ${e.lastName} as Party Leader?
`,`Cost: ${I(e.apCost)}`,`Ideology: ${e.ideology}`];e.electability!=null&&a.push(`Electability: ${O(e.electability).label}`),a.push("","This will replace the current party leader.");const s=p?.ruling_faction_id===i?.id,d=H(p);if(s&&d&&a.push("As the ruling party leader, they will also become Prime Minister."),!confirm(a.join(`
`)))return;w=!0;const n=document.querySelector(".pl-appoint-btn");n&&(n.disabled=!0,n.textContent="Appointing...");try{const o=S?.current_tick||0;if(e.apCost>0){const l=await U(f,i.id,e.apCost);if(!l.success){alert("Not enough AP. Need "+e.apCost+" AP.");return}i.action_points=l.newAp}const c={leader_first_name:e.firstName,leader_last_name:e.lastName,leader_age:e.age,electability:e.electability,leader_ideology:e.ideology||null,leader_positive_traits:e.positiveTraits||[],leader_negative_traits:e.negativeTraits||[]},{error:g}=await f.from("factions").update(c).eq("id",i.id);if(g)throw new Error("Failed to update faction: "+g.message);const _=p.ruling_faction_id===i.id,m=H(p);if(_&&m){const l=e.positiveTraits&&e.positiveTraits.length>0?e.positiveTraits[0]:null,F=e.age||35+Math.floor(Math.random()*16),R=`${e.firstName} ${e.lastName}`,{error:M}=await f.from("head_of_government").update({first_name:e.firstName,last_name:e.lastName,age:F,trait_key:l,appointed_tick:o}).eq("nation_id",p.id).eq("active",!0);M&&console.warn("Failed to update head_of_government (non-blocking):",M.message);const{error:q}=await f.from("ministries").update({minister_first_name:e.firstName,minister_last_name:e.lastName,minister_age:F}).eq("nation_id",p.id).eq("ministry_key","prime_minister").eq("is_active",!0);q&&console.warn("Failed to update PM ministry (non-blocking):",q.message);const{error:D}=await f.from("administrations").update({prime_minister:R,admin_name:`${e.lastName} Administration`,updated_at:new Date().toISOString()}).eq("nation_id",p.id).is("ended_at_tick",null);D&&console.warn("Failed to update administration (non-blocking):",D.message);try{await f.rpc("fire_system_event",{p_trigger_key:"pm_appointed",p_nation_id:p.id,p_tick:o,p_placeholders:{nation:p.name||"",pm_name:R,party:i.faction_name,trait:l}})}catch(G){console.warn("PM appointed event fire failed (non-blocking):",G)}console.log(`Ruling party leader change → PM updated: ${R} (trait: ${l})`)}const u=v.leader,b=u?`${e.firstName} ${e.lastName} replaces ${u.firstName} ${u.lastName} as Party Leader of ${i.faction_name}.`:`${e.firstName} ${e.lastName} appointed as Party Leader of ${i.faction_name}.`;await f.from("event_log").insert({nation_id:p.id,event_name:"New Party Leader",description_chosen:b,category:"POLITICAL",fired_at_tick:o}).then(({error:l})=>{l&&console.warn("Event log insert failed (non-blocking):",l.message)});const N={firstName:e.firstName,lastName:e.lastName,age:e.age,ideology:e.ideology,positiveTraits:e.positiveTraits,negativeTraits:e.negativeTraits};e.electability!=null&&(N.electability=e.electability),v.leader=N;const k=p.name||"",T=P(k,E,3,"leader");await j(i.id,"leader",T);try{sessionStorage.setItem(`leadership_candidates_${i.id}_leader`,JSON.stringify(T))}catch{}h.leader=T;const r=B();r&&h.leader.unshift(r),C.leader=0,x(),alert(`${e.firstName} ${e.lastName} has been appointed as Party Leader!`)}catch(o){alert("Error: "+o.message),n&&(n.disabled=!1,n.textContent="Appoint Party Leader")}finally{w=!1}};
