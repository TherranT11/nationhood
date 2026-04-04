import{_ as i}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as F,h as L,j as I}from"./common-DKfT-nlB.js";import{e as p}from"./utils-C2W-HleY.js";import{deductAP as $}from"./config-BIsh65GI.js";import"./government-types-BgK4qZvD.js";import{d as D,s as q}from"./elections-RxJttMgh.js";import{f as x,l as R}from"./government-structure-BXgURUp5.js";import"./ideology-DgnKVc_l.js";import"./stats-Cb8eW3Os.js";const k=new URLSearchParams(window.location.search),g=k.get("role")||"pm",T={pm:{icon:"👑",title:"Select Your Prime Minister",description:"Your coalition has formed and your party holds the Prime Minister post. Choose who will lead the nation.",badgePrefix:"Appointing for",confirmLabel:"Appoint Prime Minister",confirmWarning:"⚠ This choice is permanent for the duration of the term.",confirmVerb:"Appoint",progressLabel:"Appointing...",emptyTitle:"No Candidates",initTab:"government",redirectUrl:"government.html",eventKey:"pm_appointed",showTraits:!0,showIdeology:!0},president:{icon:"🏛",title:"Select Your Candidate",description:"Choose your party's presidential nominee for the upcoming election. Your candidate will compete against nominees from other parties in the popular vote.",badgePrefix:"Nominating for",confirmLabel:"Nominate Candidate",confirmWarning:"This choice is permanent. Your nominee will run in the presidential election.",confirmVerb:"Nominate",progressLabel:"Nominating...",emptyTitle:"Presidential Selection",initTab:"government",redirectUrl:"politics.html",eventKey:null,showTraits:!0,showIdeology:!0},ambassador:{icon:"🏛️",title:"Appoint Ambassador",description:null,badgePrefix:"Foreign Minister:",confirmLabel:"Nominate Ambassador",confirmWarning:null,confirmVerb:null,progressLabel:null,emptyTitle:"Ambassador Appointment",initTab:"diplomacy",redirectUrl:null,eventKey:null,showTraits:!1,showIdeology:!1}},f=T[g]||T.pm;let m=null,o=null,h=[],y=null,c=null,A=[],w=[],N=[];function l(){const a=[],t=L();t&&a.push("nation_id="+t);const e=I();return e&&a.push("faction_id="+e),"diplomacy.html"+(a.length?"?"+a.join("&"):"")}document.title=f.title+" | Nationhood Alpha";F(f.initTab,async a=>{const{nation:t,faction:e}=a;if(m=t,o=e,!t||!e){s("No nation or party found.");return}if(t?.name){const{firstNames:d,lastNames:n}=D(t.name);w=d,N=n}g==="pm"?await Y():g==="president"?await V():g==="ambassador"&&await j()});async function Y(){s('Prime Ministers are now automatically appointed from your Party Leader when a coalition forms. <a href="government.html">View Government →</a>')}async function V(){s('Your Party Leader is automatically your presidential nominee. <a href="government.html">View Government →</a>')}async function j(){const a=k.get("target");if(!a){s('No target nation specified. <a href="'+l()+'">Back to Diplomacy</a>');return}const{data:t}=await i.from("nations").select("*").eq("id",a).single();if(!t){s('Target nation not found. <a href="'+l()+'">Back to Diplomacy</a>');return}c=t;const{data:e}=await i.from("ambassadors").select("id, status").eq("nation_id",m.id).eq("target_nation_id",c.id).eq("is_active",!0).maybeSingle();if(e){const u=e.status==="active"?"an active":"a pending";s("You already have "+u+" ambassador to "+c.name+'. <a href="'+l()+'">Back to Diplomacy</a>');return}const d=await x(i,m.id);let r=(d?.ministry_allocations||{}).foreign===o.id;if(!r){const{data:u}=await i.from("ministries").select("party_id").eq("nation_id",m.id).eq("ministry_key","foreign").eq("is_active",!0).maybeSingle();u&&u.party_id===o.id&&(r=!0)}if(!r){s('Only the Foreign Minister can appoint ambassadors. <a href="'+l()+'">Back to Diplomacy</a>');return}if(!d){s('No government is currently seated. Ambassador appointments require an active government. <a href="'+l()+'">Back to Diplomacy</a>');return}if(d?.status==="caretaker"){s('Appointments are suspended during caretaker government. <a href="'+l()+'">Back to Diplomacy</a>');return}const{data:b}=await i.from("factions").select("id, faction_name, color").eq("nation_id",m.id);if(A=b||[],A.length===0){s('No political parties found. <a href="'+l()+'">Back to Diplomacy</a>');return}C(),B()}function C(){h=A.map(a=>({partyId:a.id,partyName:a.faction_name,partyColor:a.color||"#888",firstName:w[Math.floor(Math.random()*w.length)],lastName:N[Math.floor(Math.random()*N.length)],age:35+Math.floor(Math.random()*31)})),y=null}function B(){const a=document.getElementById("sc-page"),t=h.map((n,r)=>`
        <div class="sc-card" id="sc-card-${r}" onclick="selectCandidate(${r})">
            <div class="sc-card-header">
                <div class="sc-card-avatar">👤</div>
                <div class="sc-card-name">${n.firstName} ${n.lastName}</div>
                <div class="sc-card-age">Age ${n.age}</div>
            </div>
            <div class="sc-card-party">
                <div class="sc-party-label">Party Affiliation</div>
                <div class="sc-party-tag">
                    <span class="sc-party-tag-dot" style="background:${n.partyColor}"></span>
                    ${p(n.partyName)}
                </div>
            </div>
            <div class="sc-card-footer">
                <div class="sc-select-indicator">Select</div>
            </div>
        </div>
    `).join(""),e="Select a candidate to serve as your nation's Ambassador to <strong>"+p(c.name)+"</strong>.",d="A confirmation vote will be held in Parliament (51% required).";a.innerHTML=`
        <div class="sc-header">
            <span class="sc-header-icon">${f.icon}</span>
            <h1>${f.title}</h1>
            <p>${e}</p>
            <div class="sc-party-badge">
                <div class="sc-party-dot"></div>
                <span>${f.badgePrefix} <strong>${p(o.faction_name)}</strong></span>
            </div>
        </div>

        <div class="sc-regen"><a onclick="regenerate()">Re-generate candidates</a></div>

        <div class="sc-candidates auto-grid" id="sc-candidates">
            ${t}
        </div>

        <div class="sc-confirm-section" id="sc-confirm-section">
            <div class="sc-confirm-summary" id="sc-confirm-summary">Select a candidate above</div>
            <button class="sc-confirm-btn" id="sc-confirm-btn" disabled onclick="confirmSelection()">
                Nominate Ambassador <span class="ap-cost">1 AP</span>
            </button>
            <div class="sc-confirm-warning">${d}</div>
        </div>
    `}function H(a){document.querySelectorAll(".sc-card").forEach(e=>e.classList.remove("selected")),y=a,document.getElementById("sc-card-"+a).classList.add("selected");const t=h[a];document.getElementById("sc-confirm-summary").innerHTML="Nominate <strong>"+p(t.firstName)+" "+p(t.lastName)+"</strong> ("+p(t.partyName)+") as Ambassador to <strong>"+p(c.name)+"</strong>",document.getElementById("sc-confirm-btn").disabled=!1}async function U(){await O()}async function O(){if(y===null)return;const a=h[y];if(!confirm("🏛️ Nominate "+a.firstName+" "+a.lastName+" as Ambassador to "+c.name+`?

Party: `+a.partyName+`
Cost: 1 AP
`+a.partyName+` will gain +1 Approval.

A confirmation bill will go to a floor vote in Parliament.`))return;const t=document.getElementById("sc-confirm-btn");t.disabled=!0,t.textContent="Nominating...";try{const e=await $(i,o.id,1);if(!e.success){e.currentAp!==void 0&&(o.action_points=e.currentAp),alert("Not enough AP (need 1). Current AP: "+(e.currentAp??"?")),t.disabled=!1,t.textContent="Nominate Ambassador";return}o.action_points=e.newAp;const{data:d}=await i.from("shard").select("current_tick").eq("name","Alpha Shard").single(),n=d?.current_tick||0;let r=null;const b="Confirmation of "+a.firstName+" "+a.lastName+" as Ambassador to "+c.name,u="This motion, filed by the "+o.faction_name+", confirms the appointment of "+a.firstName+" "+a.lastName+" ("+a.partyName+") as Ambassador to "+c.name+". A simple majority (51%) is required for confirmation.",{data:v,error:P}=await i.rpc("create_ambassador_nomination_with_bill",{p_nation_id:m.id,p_target_nation_id:c.id,p_faction_id:a.partyId,p_proposed_by:o.id,p_first_name:a.firstName,p_last_name:a.lastName,p_age:a.age,p_current_tick:n,p_bill_name:b,p_preamble:u,p_voting_ends_tick:n+6});if(P)throw P;const _=Array.isArray(v)?v[0]:v;if(!_?.ambassador_id||!_?.bill_id)throw new Error("Ambassador nomination failed: server did not return expected IDs.");if(r=_.bill_id,await i.rpc("adjust_momentum",{p_faction_id:a.partyId,p_delta:1,p_label:"Ambassador selected (+1)",p_tick:n||0}),!r)throw new Error("Missing confirmation bill ID from nomination RPC.");const{data:E}=await i.from("factions").select("id, faction_name").eq("nation_id",m.id),M=(await R(i,m.id,E||[],o.id)).allPartySeats[o.id]||0;M>0&&await i.from("bill_support").upsert({bill_id:r,faction_id:o.id,stance:"yes",seat_count:M}),await q(i,r);const S="🏛️ "+a.firstName+" "+a.lastName+" has been nominated as Ambassador to "+c.name+". A confirmation vote has been filed in Parliament.";alert(S),window.location.href=l()}catch(e){console.error("Error nominating ambassador:",e),alert("Error: "+e.message),t.disabled=!1,t.textContent="Nominate Ambassador"}}function W(){C(),B()}function s(a){document.getElementById("sc-page").innerHTML=`
        <div class="sc-empty">
            <span style="font-size:3rem;display:block;margin-bottom:16px;opacity:0.3;">${f.icon}</span>
            <h3>${f.emptyTitle}</h3>
            <p>${a}</p>
        </div>
    `}window.selectCandidate=H;window.confirmSelection=U;window.regenerate=W;
