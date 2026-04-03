import{_ as i}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as B,h as D,j as L}from"./common-DnQvEMW5.js";import{e as p}from"./utils-C2W-HleY.js";import{deductAP as I}from"./config-BIsh65GI.js";import{j as R,l as $}from"./government-structure-Df0JI6nQ.js";import"./trade-constants-B5-aWcIg.js";import"./stats-Cb8eW3Os.js";import{s as q}from"./bills-8AGTwIRv.js";import"./messaging-5qyQ6ziq.js";const C=new URLSearchParams(window.location.search),g=C.get("role")||"pm",E={pm:{icon:"👑",title:"Select Your Prime Minister",description:"Your coalition has formed and your party holds the Prime Minister post. Choose who will lead the nation.",badgePrefix:"Appointing for",confirmLabel:"Appoint Prime Minister",confirmWarning:"⚠ This choice is permanent for the duration of the term.",confirmVerb:"Appoint",progressLabel:"Appointing...",emptyTitle:"No Candidates",initTab:"government",redirectUrl:"government.html",eventKey:"pm_appointed",showTraits:!0,showIdeology:!0},president:{icon:"🏛",title:"Select Your Candidate",description:"Choose your party's presidential nominee for the upcoming election. Your candidate will compete against nominees from other parties in the popular vote.",badgePrefix:"Nominating for",confirmLabel:"Nominate Candidate",confirmWarning:"This choice is permanent. Your nominee will run in the presidential election.",confirmVerb:"Nominate",progressLabel:"Nominating...",emptyTitle:"Presidential Selection",initTab:"government",redirectUrl:"politics.html",eventKey:null,showTraits:!0,showIdeology:!0},ambassador:{icon:"🏛️",title:"Appoint Ambassador",description:null,badgePrefix:"Foreign Minister:",confirmLabel:"Nominate Ambassador",confirmWarning:null,confirmVerb:null,progressLabel:null,emptyTitle:"Ambassador Appointment",initTab:"diplomacy",redirectUrl:null,eventKey:null,showTraits:!1,showIdeology:!1}},f=E[g]||E.pm;let l=null,n=null,b=[],y=null,c=null,A=[];const P=["Carlos","Diego","Fernando","Héctor","Marcos","Ramón","José","Luis","Miguel","Antonio","Roberto","Francisco","Eduardo","Pablo","Alejandro","Rafael","Gabriel","Santiago","Andrés","Javier","Ricardo","Tomás","Emilio","Sergio","Nicolás","Arturo","Enrique","Oscar","Felipe","Gonzalo","Ignacio","Mateo","Dante"],M=["Velasco","Salazar","Guerrero","Ríos","Morales","Torres","Mendoza","Castillo","Herrera","Vargas","Reyes","Cruz","Navarro","Delgado","Ortiz","Romero","Flores","Ramírez","Guzmán","Medina","Soto","Pacheco","Ibarra","Carrasco","Espinoza","Montenegro","Echeverría","Valdez","Córdoba","Aguilar","Paredes","Lara"];function d(){const a=[],e=D();e&&a.push("nation_id="+e);const t=L();return t&&a.push("faction_id="+t),"diplomacy.html"+(a.length?"?"+a.join("&"):"")}document.title=f.title+" | Nationhood Alpha";B(f.initTab,async a=>{const{nation:e,faction:t}=a;if(l=e,n=t,!e||!t){s("No nation or party found.");return}g==="pm"?await z():g==="president"?await x():g==="ambassador"&&await V()});async function z(){s('Prime Ministers are now automatically appointed from your Party Leader when a coalition forms. <a href="government.html">View Government →</a>')}async function x(){s('Your Party Leader is automatically your presidential nominee. <a href="government.html">View Government →</a>')}async function V(){const a=C.get("target");if(!a){s('No target nation specified. <a href="'+d()+'">Back to Diplomacy</a>');return}const{data:e}=await i.from("nations").select("*").eq("id",a).single();if(!e){s('Target nation not found. <a href="'+d()+'">Back to Diplomacy</a>');return}c=e;const{data:t}=await i.from("ambassadors").select("id, status").eq("nation_id",l.id).eq("target_nation_id",c.id).eq("is_active",!0).maybeSingle();if(t){const u=t.status==="active"?"an active":"a pending";s("You already have "+u+" ambassador to "+c.name+'. <a href="'+d()+'">Back to Diplomacy</a>');return}const m=await R(i,l.id);let o=(m?.ministry_allocations||{}).foreign===n.id;if(!o){const{data:u}=await i.from("ministries").select("party_id").eq("nation_id",l.id).eq("ministry_key","foreign").eq("is_active",!0).maybeSingle();u&&u.party_id===n.id&&(o=!0)}if(!o){s('Only the Foreign Minister can appoint ambassadors. <a href="'+d()+'">Back to Diplomacy</a>');return}if(!m){s('No government is currently seated. Ambassador appointments require an active government. <a href="'+d()+'">Back to Diplomacy</a>');return}if(m?.status==="caretaker"){s('Appointments are suspended during caretaker government. <a href="'+d()+'">Back to Diplomacy</a>');return}const{data:h}=await i.from("factions").select("id, faction_name, color").eq("nation_id",l.id);if(A=h||[],A.length===0){s('No political parties found. <a href="'+d()+'">Back to Diplomacy</a>');return}F(),S()}function F(){b=A.map(a=>({partyId:a.id,partyName:a.faction_name,partyColor:a.color||"#888",firstName:P[Math.floor(Math.random()*P.length)],lastName:M[Math.floor(Math.random()*M.length)],age:35+Math.floor(Math.random()*31)})),y=null}function S(){const a=document.getElementById("sc-page"),e=b.map((r,o)=>`
        <div class="sc-card" id="sc-card-${o}" onclick="selectCandidate(${o})">
            <div class="sc-card-header">
                <div class="sc-card-avatar">👤</div>
                <div class="sc-card-name">${r.firstName} ${r.lastName}</div>
                <div class="sc-card-age">Age ${r.age}</div>
            </div>
            <div class="sc-card-party">
                <div class="sc-party-label">Party Affiliation</div>
                <div class="sc-party-tag">
                    <span class="sc-party-tag-dot" style="background:${r.partyColor}"></span>
                    ${p(r.partyName)}
                </div>
            </div>
            <div class="sc-card-footer">
                <div class="sc-select-indicator">Select</div>
            </div>
        </div>
    `).join(""),t="Select a candidate to serve as your nation's Ambassador to <strong>"+p(c.name)+"</strong>.",m="A confirmation vote will be held in Parliament (51% required).";a.innerHTML=`
        <div class="sc-header">
            <span class="sc-header-icon">${f.icon}</span>
            <h1>${f.title}</h1>
            <p>${t}</p>
            <div class="sc-party-badge">
                <div class="sc-party-dot"></div>
                <span>${f.badgePrefix} <strong>${p(n.faction_name)}</strong></span>
            </div>
        </div>

        <div class="sc-regen"><a onclick="regenerate()">Re-generate candidates</a></div>

        <div class="sc-candidates auto-grid" id="sc-candidates">
            ${e}
        </div>

        <div class="sc-confirm-section" id="sc-confirm-section">
            <div class="sc-confirm-summary" id="sc-confirm-summary">Select a candidate above</div>
            <button class="sc-confirm-btn" id="sc-confirm-btn" disabled onclick="confirmSelection()">
                Nominate Ambassador <span class="ap-cost">1 AP</span>
            </button>
            <div class="sc-confirm-warning">${m}</div>
        </div>
    `}function j(a){document.querySelectorAll(".sc-card").forEach(t=>t.classList.remove("selected")),y=a,document.getElementById("sc-card-"+a).classList.add("selected");const e=b[a];document.getElementById("sc-confirm-summary").innerHTML="Nominate <strong>"+p(e.firstName)+" "+p(e.lastName)+"</strong> ("+p(e.partyName)+") as Ambassador to <strong>"+p(c.name)+"</strong>",document.getElementById("sc-confirm-btn").disabled=!1}async function G(){await H()}async function H(){if(y===null)return;const a=b[y];if(!confirm("🏛️ Nominate "+a.firstName+" "+a.lastName+" as Ambassador to "+c.name+`?

Party: `+a.partyName+`
Cost: 1 AP
`+a.partyName+` will gain +1 Approval.

A confirmation bill will go to a floor vote in Parliament.`))return;const e=document.getElementById("sc-confirm-btn");e.disabled=!0,e.textContent="Nominating...";try{const t=await I(i,n.id,1);if(!t.success){t.currentAp!==void 0&&(n.action_points=t.currentAp),alert("Not enough AP (need 1). Current AP: "+(t.currentAp??"?")),e.disabled=!1,e.textContent="Nominate Ambassador";return}n.action_points=t.newAp;const{data:m}=await i.from("shard").select("current_tick").eq("name","Alpha Shard").single(),r=m?.current_tick||0;let o=null;const h="Confirmation of "+a.firstName+" "+a.lastName+" as Ambassador to "+c.name,u="This motion, filed by the "+n.faction_name+", confirms the appointment of "+a.firstName+" "+a.lastName+" ("+a.partyName+") as Ambassador to "+c.name+". A simple majority (51%) is required for confirmation.",{data:v,error:w}=await i.rpc("create_ambassador_nomination_with_bill",{p_nation_id:l.id,p_target_nation_id:c.id,p_faction_id:a.partyId,p_proposed_by:n.id,p_first_name:a.firstName,p_last_name:a.lastName,p_age:a.age,p_current_tick:r,p_bill_name:h,p_preamble:u,p_voting_ends_tick:r+6});if(w)throw w;const _=Array.isArray(v)?v[0]:v;if(!_?.ambassador_id||!_?.bill_id)throw new Error("Ambassador nomination failed: server did not return expected IDs.");if(o=_.bill_id,await i.rpc("adjust_momentum",{p_faction_id:a.partyId,p_delta:1,p_label:"Ambassador selected (+1)",p_tick:r||0}),!o)throw new Error("Missing confirmation bill ID from nomination RPC.");const{data:T}=await i.from("factions").select("id, faction_name").eq("nation_id",l.id),N=(await $(i,l.id,T||[],n.id)).allPartySeats[n.id]||0;N>0&&await i.from("bill_support").upsert({bill_id:o,faction_id:n.id,stance:"yes",seat_count:N}),await q(i,o);const k="🏛️ "+a.firstName+" "+a.lastName+" has been nominated as Ambassador to "+c.name+". A confirmation vote has been filed in Parliament.";alert(k),window.location.href=d()}catch(t){console.error("Error nominating ambassador:",t),alert("Error: "+t.message),e.disabled=!1,e.textContent="Nominate Ambassador"}}function Y(){F(),S()}function s(a){document.getElementById("sc-page").innerHTML=`
        <div class="sc-empty">
            <span style="font-size:3rem;display:block;margin-bottom:16px;opacity:0.3;">${f.icon}</span>
            <h3>${f.emptyTitle}</h3>
            <p>${a}</p>
        </div>
    `}window.selectCandidate=j;window.confirmSelection=G;window.regenerate=Y;
