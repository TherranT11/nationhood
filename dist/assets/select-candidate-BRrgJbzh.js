import{_ as n}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as B,h as D,j as L}from"./common-BedtaFOo.js";import{e as f}from"./utils-C2W-HleY.js";import{j as I,h as R,s as $}from"./autocracy-silent-coup-vxZQTTX4.js";import{a as q,m as z,l as x}from"./government-structure-DKbbGMPO.js";import"./stats-Cp9T3CP_.js";const T=new URLSearchParams(window.location.search),v=T.get("role")||"pm",P={pm:{icon:"👑",title:"Select Your Prime Minister",description:"Your coalition has formed and your party holds the Prime Minister post. Choose who will lead the nation.",badgePrefix:"Appointing for",confirmLabel:"Appoint Prime Minister",confirmWarning:"⚠ This choice is permanent for the duration of the term.",confirmVerb:"Appoint",progressLabel:"Appointing...",emptyTitle:"No Candidates",initTab:"government",redirectUrl:"government.html",eventKey:"pm_appointed",showTraits:!0,showIdeology:!0},president:{icon:"🏛",title:"Select Your Candidate",description:"Choose your party's presidential nominee for the upcoming election. Your candidate will compete against nominees from other parties in the popular vote.",badgePrefix:"Nominating for",confirmLabel:"Nominate Candidate",confirmWarning:"This choice is permanent. Your nominee will run in the presidential election.",confirmVerb:"Nominate",progressLabel:"Nominating...",emptyTitle:"Presidential Selection",initTab:"government",redirectUrl:"politics.html",eventKey:null,showTraits:!0,showIdeology:!0},ambassador:{icon:"🏛️",title:"Appoint Ambassador",description:null,badgePrefix:"Foreign Minister:",confirmLabel:"Nominate Ambassador",confirmWarning:null,confirmVerb:null,progressLabel:null,emptyTitle:"Ambassador Appointment",initTab:"diplomacy",redirectUrl:null,eventKey:null,showTraits:!1,showIdeology:!1}},u=P[v]||P.pm;let s=null,o=null,w=[],A=null,r=null,E=[],l=!1;const C=["Carlos","Diego","Fernando","Héctor","Marcos","Ramón","José","Luis","Miguel","Antonio","Roberto","Francisco","Eduardo","Pablo","Alejandro","Rafael","Gabriel","Santiago","Andrés","Javier","Ricardo","Tomás","Emilio","Sergio","Nicolás","Arturo","Enrique","Oscar","Felipe","Gonzalo","Ignacio","Mateo","Dante"],F=["Velasco","Salazar","Guerrero","Ríos","Morales","Torres","Mendoza","Castillo","Herrera","Vargas","Reyes","Cruz","Navarro","Delgado","Ortiz","Romero","Flores","Ramírez","Guzmán","Medina","Soto","Pacheco","Ibarra","Carrasco","Espinoza","Montenegro","Echeverría","Valdez","Córdoba","Aguilar","Paredes","Lara"];function p(){const a=[],t=D();t&&a.push("nation_id="+t);const e=L();return e&&a.push("faction_id="+e),"diplomacy.html"+(a.length?"?"+a.join("&"):"")}document.title=u.title+" | Nationhood Alpha";B(u.initTab,async a=>{const{nation:t,faction:e}=a;if(s=t,o=e,!t||!e){d("No nation or party found.");return}v==="pm"?await V():v==="president"?await G():v==="ambassador"&&await j()});async function V(){d('Prime Ministers are now automatically appointed from your Party Leader when a coalition forms. <a href="government.html">View Government →</a>')}async function G(){d('Your Party Leader is automatically your presidential nominee. <a href="government.html">View Government →</a>')}async function j(){l=q(s);const a=T.get("target");if(!a){d('No target nation specified. <a href="'+p()+'">Back to Diplomacy</a>');return}const{data:t}=await n.from("nations").select("*").eq("id",a).single();if(!t){d('Target nation not found. <a href="'+p()+'">Back to Diplomacy</a>');return}r=t;const{data:e}=await n.from("ambassadors").select("id, status").eq("nation_id",s.id).eq("target_nation_id",r.id).eq("is_active",!0).maybeSingle();if(e){const b=e.status==="active"?"an active":"a pending";d("You already have "+b+" ambassador to "+r.name+'. <a href="'+p()+'">Back to Diplomacy</a>');return}const i=await z(n,s.id);let c=(i?.ministry_allocations||{}).foreign===o.id;if(!c){const{data:b}=await n.from("ministries").select("party_id").eq("nation_id",s.id).eq("ministry_key","foreign").eq("is_active",!0).maybeSingle();b&&b.party_id===o.id&&(c=!0)}if(!c){d('Only the Foreign Minister can appoint ambassadors. <a href="'+p()+'">Back to Diplomacy</a>');return}if(!l&&!i){d('No government is currently seated. Ambassador appointments require an active government. <a href="'+p()+'">Back to Diplomacy</a>');return}if(i?.status==="caretaker"){d('Appointments are suspended during caretaker government. <a href="'+p()+'">Back to Diplomacy</a>');return}const{data:g}=await n.from("factions").select("id, faction_name, color").eq("nation_id",s.id);if(E=g||[],E.length===0){d('No political parties found. <a href="'+p()+'">Back to Diplomacy</a>');return}S(),k()}function S(){w=E.map(a=>({partyId:a.id,partyName:a.faction_name,partyColor:a.color||"#888",firstName:C[Math.floor(Math.random()*C.length)],lastName:F[Math.floor(Math.random()*F.length)],age:35+Math.floor(Math.random()*31)})),A=null}function k(){const a=document.getElementById("sc-page"),t=w.map((m,c)=>`
        <div class="sc-card" id="sc-card-${c}" onclick="selectCandidate(${c})">
            <div class="sc-card-header">
                <div class="sc-card-avatar">👤</div>
                <div class="sc-card-name">${m.firstName} ${m.lastName}</div>
                <div class="sc-card-age">Age ${m.age}</div>
            </div>
            <div class="sc-card-party">
                <div class="sc-party-label">Party Affiliation</div>
                <div class="sc-party-tag">
                    <span class="sc-party-tag-dot" style="background:${m.partyColor}"></span>
                    ${f(m.partyName)}
                </div>
            </div>
            <div class="sc-card-footer">
                <div class="sc-select-indicator">Select</div>
            </div>
        </div>
    `).join(""),e="Select a candidate to serve as your nation's Ambassador to <strong>"+f(r.name)+"</strong>.",i=l?"The ambassador will be appointed immediately.":"A confirmation vote will be held in Parliament (51% required).";a.innerHTML=`
        <div class="sc-header">
            <span class="sc-header-icon">${u.icon}</span>
            <h1>${u.title}</h1>
            <p>${e}</p>
            <div class="sc-party-badge">
                <div class="sc-party-dot"></div>
                <span>${u.badgePrefix} <strong>${f(o.faction_name)}</strong></span>
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
            <div class="sc-confirm-warning">${i}</div>
        </div>
    `}function H(a){document.querySelectorAll(".sc-card").forEach(e=>e.classList.remove("selected")),A=a,document.getElementById("sc-card-"+a).classList.add("selected");const t=w[a];document.getElementById("sc-confirm-summary").innerHTML="Nominate <strong>"+f(t.firstName)+" "+f(t.lastName)+"</strong> ("+f(t.partyName)+") as Ambassador to <strong>"+f(r.name)+"</strong>",document.getElementById("sc-confirm-btn").disabled=!1}async function Y(){await O()}async function O(){if(A===null)return;const a=w[A],t=l?"appoint":"nominate";if(!confirm("🏛️ "+t.charAt(0).toUpperCase()+t.slice(1)+" "+a.firstName+" "+a.lastName+" as Ambassador to "+r.name+`?

Party: `+a.partyName+`
Cost: 1 AP
`+a.partyName+` will gain +1 Approval.

`+(l?"The ambassador will be appointed immediately.":"A confirmation bill will go to a floor vote in Parliament.")))return;const e=document.getElementById("sc-confirm-btn");e.disabled=!0,e.textContent=l?"Appointing...":"Nominating...";try{const i=await I(n,o.id,1);if(!i.success){i.currentAp!==void 0&&(o.action_points=i.currentAp),alert("Not enough AP (need 1). Current AP: "+(i.currentAp??"?")),e.disabled=!1,e.textContent="Nominate Ambassador";return}o.action_points=i.newAp;const{data:m}=await n.from("shard").select("current_tick").eq("name","Alpha Shard").single(),c=m?.current_tick||0;let g=null;if(l){const{data:_,error:h}=await n.from("ambassadors").insert({nation_id:s.id,target_nation_id:r.id,faction_id:a.partyId,ambassador_first_name:a.firstName,ambassador_last_name:a.lastName,ambassador_age:a.age,status:"active",is_active:!0,appointed_at_tick:c}).select().single();if(h)throw h}else{const _="Confirmation of "+a.firstName+" "+a.lastName+" as Ambassador to "+r.name,h="This motion, filed by the "+o.faction_name+", confirms the appointment of "+a.firstName+" "+a.lastName+" ("+a.partyName+") as Ambassador to "+r.name+". A simple majority (51%) is required for confirmation.",{data:y,error:M}=await n.rpc("create_ambassador_nomination_with_bill",{p_nation_id:s.id,p_target_nation_id:r.id,p_faction_id:a.partyId,p_proposed_by:o.id,p_first_name:a.firstName,p_last_name:a.lastName,p_age:a.age,p_current_tick:c,p_bill_name:_,p_preamble:h,p_voting_ends_tick:c+6});if(M)throw M;const N=Array.isArray(y)?y[0]:y;if(!N?.ambassador_id||!N?.bill_id)throw new Error("Ambassador nomination failed: server did not return expected IDs.");g=N.bill_id}if(await R(n,s.id,a.partyId,1,"diplomacy:ambassador_selected"),!l){if(!g)throw new Error("Missing confirmation bill ID from nomination RPC.");const{data:_}=await n.from("factions").select("id, faction_name").eq("nation_id",s.id),y=(await x(n,s.id,!1,_||[],o.id)).allPartySeats[o.id]||0;y>0&&await n.from("bill_support").upsert({bill_id:g,faction_id:o.id,stance:"yes",seat_count:y}),await $(n,g)}const b=l?"🏛️ "+a.firstName+" "+a.lastName+" has been appointed Ambassador to "+r.name+"!":"🏛️ "+a.firstName+" "+a.lastName+" has been nominated as Ambassador to "+r.name+". A confirmation vote has been filed in Parliament.";alert(b),window.location.href=p()}catch(i){console.error("Error nominating ambassador:",i),alert("Error: "+i.message),e.disabled=!1,e.textContent="Nominate Ambassador"}}function U(){S(),k()}function d(a){document.getElementById("sc-page").innerHTML=`
        <div class="sc-empty">
            <span style="font-size:3rem;display:block;margin-bottom:16px;opacity:0.3;">${u.icon}</span>
            <h3>${u.emptyTitle}</h3>
            <p>${a}</p>
        </div>
    `}window.selectCandidate=H;window.confirmSelection=Y;window.regenerate=U;
