import{_ as R}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as ta,g as ne}from"./common-BedtaFOo.js";import"./guide-RrxJIDYT.js";import{c as Ne,P as ea,b as aa,g as Ce}from"./party-icons-CJ7uQoDE.js";import{t as st}from"./utils-C2W-HleY.js";import{a as sa,D as ia,L as oa,S as na,U as qe,V as Pt,W as la,X as Re,Y as ut,Z as at,_ as ra,$ as Fe,a0 as j,a1 as ue,a2 as xt,a3 as da,a4 as ca,a5 as pa,a6 as va,a7 as fa,a8 as ma,a9 as ua,aa as ga,ab as Me,ac as ya,ad as ba,ae as xa,af as _a,ag as ha,ah as Ct,ai as Ge,aj as Ue,ak as Ae}from"./autocracy-silent-coup-vxZQTTX4.js";import{l as $a,o as ge,m as je,a4 as We,n as wa,i as Ve,f as ct}from"./government-structure-DKbbGMPO.js";import"./stats-Cp9T3CP_.js";import{g as Ke,c as ka,P as Gt,e as Ea,d as Ye,f as Sa,i as Xe,h as Ca,j as Aa,k as La,l as Je,m as Ia,n as Pa,o as Ta}from"./protest-B06Bz2EW.js";const ze=6;function Na({isPresidentialSystem:t=!1,scheduledElections:e=[],currentTick:a=0,playerSeats:r=0}={}){const i=(e||[]).filter(d=>d&&d.election_type==="presidential"&&Number.isFinite(Number(d.election_tick))).sort((d,c)=>Number(d.election_tick)-Number(c.election_tick))[0]||null;let o="",s=null,v=null,n=!1;return t?i?(s=Number(i.election_tick)-Number(a),s<=0?(o="This election has already fired; endorsement is locked for this cycle.",s=null):s>ze?(v=s-ze,o="No presidential election is in the eligible window."):Number(r)<=0&&(o="Your party is not eligible to endorse in this cycle.")):o="No presidential election is in the eligible window.":(n=!0,o="No presidential election is in the eligible window."),{disabled:!!o,disabledReason:o,ticksUntilElection:s,ticksUntilWindow:v,hidden:n}}function pt(t,e=!0){const a=document.getElementById("pol-toast");a&&a.remove();const r=document.createElement("div");r.id="pol-toast",r.style.cssText=`position:fixed;top:20px;right:20px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:13px;font-family:var(--dfont-mono);max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s;${e?"background:#2d1517;color:#f87171;border:1px solid #7f1d1d;":"background:#1a2e1a;color:#86efac;border:1px solid #14532d;"}`,r.textContent=t,document.body.appendChild(r),setTimeout(()=>{r.style.opacity="0",setTimeout(()=>r.remove(),300)},4e3)}ta("politics",async t=>{const{nation:e,faction:a,shard:r}=t;if(!e||!a){document.getElementById("content-area").innerHTML='<div class="pol-loading">No nation or party data available.</div>';return}await sa(R,e.id);const i=a,o=r?.current_tick||0,{data:s}=await R.from("factions").select("id, seats, national_vote_share, faction_name, abbreviation, party_color, standing, loyalty, last_seen_tick, leader_first_name, leader_last_name, custom_logo_url, party_logo, party_description").eq("nation_id",e.id).eq("faction_type","party"),v=(s||[]).map(H=>H.id),{data:n}=v.length>0?await R.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism").in("faction_id",v):{data:[]},{currentSeats:d}=await $a(R,e.id,ge(e),s||[],i.id),c=(s||[]).reduce((H,O)=>H+(O.seats||0),0),w=d,{data:l}=await R.from("elections").select("election_tick, results").eq("nation_id",e.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle();let x=Number(i.national_vote_share||0).toFixed(1),f=null,m=null;if(l){f=st(l.election_tick);const H=l.results,B=(H?.votes||(Array.isArray(H)?H:[])).find(F=>F.party_id===i.id);if(B&&typeof B.vote_percentage=="number"&&(x=B.vote_percentage.toFixed(1)),Array.isArray(H)){const F=H.find(K=>K.party_id===i.id);if(F&&typeof F.seats_won=="number"){const K=typeof F.seats_before=="number"?F.seats_before:null;K!==null&&(m=w-K)}}}const p=await je(R,e.id),g=ge(e);let k="Opposition";g&&e.ruling_faction_id===i.id?k="Strongman":p&&p.party_ids&&p.party_ids.includes(i.id)&&(k=p.lead_party_id===i.id?"Lead — Governing":"Governing Coalition");let E=[],N=null,A=[];if(g){const[H,O,B]=await Promise.all([R.from("faction_pillar_state").select("*").eq("nation_id",e.id),R.from("autocracy_tracker").select("*").eq("nation_id",e.id).maybeSingle(),R.from("autocracy_action_log").select("tick, action_type, faction_id, details").eq("nation_id",e.id).order("created_at",{ascending:!1}).limit(10)]);E=H.data||[],N=O.data,A=B.data||[]}const{data:u}=await R.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",e.id),{data:h}=await R.from("issue_state").select("issue_id, salience").eq("nation_id",e.id),y={};for(const H of h||[])y[H.issue_id]=H;const{data:S}=await R.from("elections").select("election_tick").eq("nation_id",e.id).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(1).maybeSingle(),_=Ma(i.id,e.name),C={whipFirst:i.whip_first_name||_.whipFirst,whipLast:i.whip_last_name||_.whipLast},{data:T}=await R.from("nations_history").select("gov_approval").eq("nation_id",e.id).eq("tick",o-1).single(),L=T?.gov_approval??null,{data:P}=await R.from("presidents").select("id, faction_id, first_name, last_name, age, ideology, trait, trait_upside, trait_downside, elected_tick, term_ends_tick, is_active, terms_served").eq("nation_id",e.id).eq("is_active",!0).order("elected_tick",{ascending:!1}).limit(1).maybeSingle(),{data:$}=await R.from("administrations").select("id, admin_name, government_type, started_at_tick, president_name, president_party_id, president_party_name").eq("nation_id",e.id).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),{data:I}=await R.from("elections").select("election_tick, results, election_type").eq("nation_id",e.id).eq("status","completed").eq("election_type","parliamentary").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:z}=await R.from("elections").select("election_tick, results, election_type").eq("nation_id",e.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:D}=await R.from("elections").select("election_tick, election_type").eq("nation_id",e.id).eq("status","scheduled").order("election_tick",{ascending:!0}),{data:M}=await R.from("caucus_factions").select("id, name, dominant_axis, wing_end, seat_share, relationship_score").eq("party_id",i.id).eq("is_active",!0);Oa(i,e,{shard:r,totalSeats:c,mySeats:w,voteSharePct:x,lastElectionDate:f,seatDelta:m,role:k,isAutoNation:g,coalition:p,currentTick:o,officerNames:C,allParties:s,allPartyIdeologies:n,activeCrises:u,nextElection:S,prevApproval:L,lastParliamentary:I,lastPresidential:z,scheduledElections:D,president:P,administration:$,caucusFactions:M,currentEndorsement:null,pillarStates:E,autocracyTracker:N,autocracyActionLog:A,issueStateMapInit:y})});function Ra(t){const e=t.replace(/-/g,""),r=20+parseInt(e.substring(16,24),16)%51;return Math.max(0,r-10)}function Ma(t,e=""){const{firstNames:a,lastNames:r}=ia(e),i=t.replace(/-/g,""),o=parseInt(i.substring(8,12),16),s=parseInt(i.substring(12,16),16);return{whipFirst:a[o%a.length],whipLast:r[s%r.length]}}async function Oa(t,e,a){const{shard:r,totalSeats:i,mySeats:o,voteSharePct:s,lastElectionDate:v,seatDelta:n,role:d,isAutoNation:c,officerNames:w,allParties:l,allPartyIdeologies:x,coalition:f,activeCrises:m,currentTick:p,nextElection:g,prevApproval:k,lastParliamentary:E,lastPresidential:N,scheduledElections:A,president:u,administration:h,caucusFactions:y,currentEndorsement:S,pillarStates:_,autocracyTracker:C,autocracyActionLog:T,issueStateMapInit:L}=a,P=t,$=t.party_color||"#ffcc00",I=Ne({customLogoUrl:t.custom_logo_url,iconKey:t.party_logo,size:36,color:$}),z=st(t.founded_tick),D=d.includes("Governing")||d.includes("Lead")||d==="Strongman",M=d.includes("Lead")?"Governing":d,q=d==="Strongman"?"pol-role-strongman":D?"pol-role-gov":"pol-role-opp",H=t.ideology_value_1||null,O=t.ideology_value_2||null;function B(Q){if(!Q)return"";const nt="pol-ideo-"+Q.toLowerCase(),St=Q.charAt(0).toUpperCase()+Q.slice(1).toLowerCase();return`<div class="pol-ideo-box">
            <span class="pol-ideo-label">Ideology</span>
            <span class="pol-ideo-value ${nt}">${St}</span>
        </div>`}let F,K;c&&e.ruling_faction_id===t.id&&e.head_of_state_first_name&&e.head_of_state_last_name?(F=e.head_of_state_first_name+" "+e.head_of_state_last_name,K=e.head_of_state_age?`(${e.head_of_state_age})`:""):(F=t.leader_first_name&&t.leader_last_name?t.leader_first_name+" "+t.leader_last_name:"Vacant",K=t.leader_age?`(${t.leader_age})`:"");const tt=t.leader_ideology||H,yt=tt?`<span class="pol-leader-ideo pol-ideo-${tt.toLowerCase()}">${tt.charAt(0).toUpperCase()+tt.slice(1).toLowerCase()}</span>`:"",W=t.electability??Ra(t.id),X=oa(W);let ot="";if(n!==null&&n!==0){const Q=n>0?"+":"";ot=`<span class="pol-stat-delta ${n>0?"up":"down"}">${Q}${n}</span>`}let vt;c?vt=Ua(t,e,{totalSeats:i,mySeats:o,voteSharePct:s,lastElectionDate:v,currentTick:p,allParties:l,coalition:f,activeCrises:m,logoSvg:I,roleCls:q,roleLabel:M,leaderName:F,leaderAge:K,leaderIdeo:yt,officerNames:w,ideo1:H,ideo2:O,deltaHtml:ot,ideoTag:B,pillarStates:_,autocracyTracker:C,autocracyActionLog:T}):vt=`
    <div class="pol-page">
        <div class="pol-section-label">Politics</div>

        <div class="pol-columns">
        ${Qa(e,f,l,p,k,u,h)}
        <div class="pol-party-card">
        <div class="pol-header">
            <div class="pol-logo">${I}</div>
            <div class="pol-header-info">
                <div class="pol-party-name">${b(t.faction_name)} <span style="color:var(--dtext-3);font-size:11px;font-weight:400;font-style:italic;margin-left:4px;">${We(e)}</span></div>
                <div class="pol-meta-row">
                    <span class="pol-role-badge ${q}">${b(M.toUpperCase())}</span>
                    <span class="pol-established">Est. ${z}</span>
                    <span class="pol-leader-badge">Leader: ${b(F)} ${K}</span>
                </div>
            </div>
        </div>
        <div class="pol-ideo-row">
            ${B(H)}
            ${B(O)}
        </div>
        <hr class="pol-divider">
        <div class="pol-leader-section">
            <div class="pol-leader-header">
                <span class="pol-sub-label">Leader</span>
                <button class="pol-leadership-btn" onclick="window.location.href='party-leadership.html'">Party Leadership &rarr;</button>
            </div>
            <div class="pol-leader-name">${b(F)} <span class="pol-leader-age">${K}</span> <span class="pol-leader-electability"><span class="pol-leader-electability-label">Electability: </span><span style="color:${X.color}">${X.label}</span></span></div>
            ${yt}
        </div>
        <div class="pol-officers-row">
            <div class="pol-officer">
                <div class="pol-officer-label">Party Whip</div>
                <div class="pol-officer-name">${b(w.whipFirst+" "+w.whipLast)}</div>
            </div>
        </div>
        <hr class="pol-divider">
        <div class="pol-stats-row">
            <div class="pol-stat-block">
                <div class="pol-stat-label">Seats</div>
                <div class="pol-stat-value">${o}<span class="pol-stat-total">/${i}</span>${ot}</div>
            </div>
            <div class="pol-stat-block">
                <div class="pol-stat-label">Vote Share</div>
                <div class="pol-stat-value">${s}%</div>
                ${v?`<div class="pol-stat-note">${v}</div>`:""}
            </div>
        </div>
        ${Ka(y,o)}
        </div>
        ${Ya(l,f,e,t.id)}
        ${Ja(l,i,p,g,null,t.id)}
        </div>

        <div class="pol-row-2">
        ${Za(e,m,p,L)}
        <div class="pol-ideology-box" id="stance-summary-container">
            <div class="pol-ideo-header"><span class="pol-mod-title">Stances</span></div>
            <div id="stance-summary-strip"></div>
        </div>
        ${ts(t,p)}
        </div>

        <div class="pol-row-3">
        ${as(E,N,l,{scheduledElections:A,currentTick:p,nation:e,mySeats:o,faction:P,currentEndorsement:S})}

        </div>
        <div class="pol-row-4" style="margin-top:24px;text-align:center">
            <button class="pol-disband-btn" id="pol-disband-party-btn" style="background:transparent;color:#d9534f;border:1px solid #d9534f;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:0.75rem;opacity:0.6;transition:opacity 0.2s" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">Disband Party</button>
            <div style="font-size:0.65rem;color:var(--dtext-3);margin-top:4px">Permanently disband your party and leave the game.</div>
        </div>
    </div>`;const ft=`
    <div class="pol-page-tabs">
        <button class="pol-page-tab active" data-page-tab="politics">Politics</button>
        <button class="pol-page-tab" data-page-tab="actions">Actions</button>
        ${c?"":'<button class="pol-page-tab" data-page-tab="electorate-spread">Electorate</button>'}
        ${c?"":'<button class="pol-page-tab" data-page-tab="other-parties">Other Parties</button>'}
        ${c?"":'<button class="pol-page-tab" data-page-tab="voters">Voters</button>'}
    </div>
    <div class="pol-page-content active" data-page-content="politics">
    ${vt}
    </div>
    <div class="pol-page-content" data-page-content="actions">
        <div class="pol-page">
            <div id="actions-container"></div>
        </div>
    </div>
    ${c?"":`
    <div class="pol-page-content" data-page-content="electorate-spread">
        <div id="electorate-spread-container" class="es-page" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading electorate data...</div>
        </div>
    </div>`}
    ${c?"":`
    <div class="pol-page-content" data-page-content="other-parties">
        <div id="other-parties-container" class="op-page" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading rival parties...</div>
        </div>
    </div>`}
    ${c?"":`
    <div class="pol-page-content" data-page-content="voters">
        <div id="voters-container" class="vc-page" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading vote composition...</div>
        </div>
    </div>`}`;document.getElementById("content-area").innerHTML=ft;let rt=!1,Ht=!1,U=!1,G=!1;document.querySelectorAll(".pol-page-tab").forEach(Q=>{Q.addEventListener("click",()=>{document.querySelectorAll(".pol-page-tab").forEach(we=>we.classList.remove("active")),document.querySelectorAll(".pol-page-content").forEach(we=>we.classList.remove("active")),Q.classList.add("active");const nt=Q.getAttribute("data-page-tab"),St=document.querySelector(`.pol-page-content[data-page-content="${nt}"]`);St&&St.classList.add("active"),nt==="actions"&&!rt&&(rt=!0,c?be(e,t,r,_,C,l):pe(e,t,r,l)),nt==="electorate-spread"&&!U&&(U=!0,Ps(t,e,l,x,p)),nt==="other-parties"&&!Ht&&(Ht=!0,Ms(t,e,l,x,f,i)),nt==="voters"&&!G&&(G=!0,Ts(t,e))})}),c||(window.innerWidth>860&&document.querySelectorAll(".pol-admin-box, .pol-party-card, .pol-parliament-box, .pol-forecast-box, .pol-coalition-box, .pol-mood-box, .pol-ideology-box, .pol-identity-box, .pol-election-box, .pol-blocs-box").forEach(Q=>{Q.style.height="450px"}),es(t),ss(),is()),c||($e(t.id,e.id),Da(e.id,t.id));const dt=document.getElementById("pol-disband-party-btn");dt&&dt.addEventListener("click",async()=>{if(confirm("Are you sure you want to disband your party? This is permanent — your party will be removed from the game after the next tick.")&&confirm("This cannot be undone. Disband your party?")){dt.disabled=!0,dt.textContent="Disbanding...";try{await na(R,e.id,t.id,p),sessionStorage.removeItem("nationhood_state"),await R.auth.signOut(),window.location.href="login.html"}catch(Q){pt(Q.message||"Failed to disband party."),dt.disabled=!1,dt.textContent="Disband Party"}}})}const za=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function Ze(t){return`${za[t%12]} ${2e3+Math.floor(t/12)}`}async function Ba(t,e){const a=document.getElementById("party-events-feed");if(!a)return;const{data:r,error:i}=await R.from("activity_log").select("id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at").eq("nation_id",t).order("tick",{ascending:!1}).order("created_at",{ascending:!1}).limit(80);if(i||!r||r.length===0){a.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:12px;padding:12px">No party events yet.</div>';return}const o=[...new Set(r.map(c=>c.faction_id))],{data:s}=await R.from("factions").select("id, faction_name, abbreviation, party_color").in("id",o),v={};for(const c of s||[])v[c.id]=c;let n="",d=null;for(const c of r){c.tick!==d&&(d=c.tick,n+=`<div class="pe-tick-sep">${Ze(c.tick)}</div>`);const w=v[c.faction_id],l=c.faction_id===e,x=l?"You":w?.abbreviation||"???",f=w?.party_color||"var(--dtext-2)",m=c.outcome==="success"?"var(--dgreen)":c.outcome==="backfire"?"var(--dred)":c.outcome==="failure"?"var(--damber)":"var(--dtext-3)";n+=`<div class="pe-item${l?" pe-item--you":""}">
            <div class="pe-item-row">
                <span class="pe-item-party" style="color:${f}">${b(x)}</span>
                <span class="pe-item-label">${b((c.action_label||c.action_type).replace(/_/g," "))}</span>
                ${c.ap_spent?`<span class="pe-item-ap">${c.ap_spent} AP</span>`:""}
                ${c.outcome?`<span class="pe-item-outcome" style="color:${m}">${b(c.outcome)}</span>`:""}
            </div>
            ${c.description?`<div class="pe-item-desc">${b(c.description)}</div>`:""}
        </div>`}a.innerHTML=n}async function Da(t,e){const a=document.getElementById("gov-card-party-events");if(!a)return;const{data:r,error:i}=await R.from("activity_log").select("id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at").eq("nation_id",t).order("tick",{ascending:!1}).order("created_at",{ascending:!1}).limit(40);if(i||!r||r.length===0){a.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">No party events yet.</div>';return}const o=[...new Set(r.map(c=>c.faction_id))],{data:s}=await R.from("factions").select("id, faction_name, abbreviation, party_color").in("id",o),v={};for(const c of s||[])v[c.id]=c;let n="",d=null;for(const c of r){c.tick!==d&&(d=c.tick,n+=`<div class="pe-tick-sep">${Ze(c.tick)}</div>`);const w=v[c.faction_id],l=c.faction_id===e,x=l?"You":w?.abbreviation||"???",f=w?.party_color||"var(--dtext-2)",m=c.outcome==="success"?"var(--dgreen)":c.outcome==="backfire"?"var(--dred)":c.outcome==="failure"?"var(--damber)":"var(--dtext-3)";n+=`<div class="pe-item${l?" pe-item--you":""}">
            <div class="pe-item-row">
                <span class="pe-item-party" style="color:${f}">${b(x)}</span>
                <span class="pe-item-label">${b((c.action_label||c.action_type).replace(/_/g," "))}</span>
                ${c.outcome?`<span class="pe-item-outcome" style="color:${m}">${b(c.outcome)}</span>`:""}
            </div>
        </div>`}a.innerHTML=n}function Ha(t){return t<=20?{label:"Regime",color:"#5cb85c"}:t<=40?{label:"Regime",color:"#5b9bd5"}:t<=60?{label:"Contested",color:"#c8a64e"}:t<=80?{label:"Opposition",color:"#d48a3c"}:{label:"Opposition",color:"#d9534f"}}function qa(t,e,a,r,i,o,s,v,n,d){const c=n?.public_tracker_value??30,w=n?.public_tracker_last_tick,{label:l,color:x}=Ha(c),f=w!=null?st(w):"—",m=100-c,p=c;return`
    <div class="pol-party-card" style="border-left:3px solid var(--damber);width:380px;height:450px;min-width:300px;display:flex;flex-direction:column">
        <!-- Regime Info -->
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--damber);margin-bottom:8px;font-weight:700">AUTOCRACY — ${b(t)}</div>
        <div style="font-size:14px;color:var(--dtext-1);font-weight:700">${b(e)} <span style="font-size:11px;color:var(--dtext-3)">(${a})</span></div>
        <div style="font-size:10px;color:var(--dtext-3);margin-top:4px">Ruling faction: ${b((i||[]).find(g=>g.id===r)?.faction_name||"None")}</div>
        ${o?`<div style="margin-top:10px;padding:6px 10px;background:${s}11;border:1px solid ${s}33;border-radius:2px;text-align:center">
            <div style="font-size:9px;color:var(--dtext-3);text-transform:uppercase;letter-spacing:1px">Regime Stability</div>
            <div style="font-size:16px;color:${s};font-weight:800;font-family:var(--dfont-mono);letter-spacing:2px;margin-top:2px">${v}</div>
        </div>`:""}

        <!-- Divider -->
        <hr style="border:none;border-top:1px solid var(--dborder-0);margin:14px 0">

        <!-- Regime Support Estimate -->
        <div style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <div style="font-size:11px;font-weight:700;color:var(--dtext-0);text-transform:uppercase;letter-spacing:1px">Regime Support</div>
                <div style="font-size:10px;color:var(--dtext-3)">Estimate</div>
            </div>
            <div style="font-size:10px;color:var(--dtext-3);margin-bottom:10px;font-style:italic">Public perception of regime strength.</div>

            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <div style="font-size:20px;font-weight:800;color:${x};font-family:var(--dfont-mono)">${c}+</div>
                <div style="font-size:13px;font-weight:700;color:${x};text-transform:uppercase">${l}</div>
            </div>

            <div style="display:flex;height:10px;border-radius:3px;overflow:hidden;background:var(--dbg-3);margin-bottom:8px">
                <div style="width:${m}%;background:#5cb85c;opacity:0.7;transition:width 0.5s"></div>
                <div style="width:${p}%;background:#d9534f;opacity:0.7;transition:width 0.5s"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--dtext-3);margin-bottom:10px">
                <span>Regime</span>
                <span>Opposition</span>
            </div>

            <div style="font-size:10px;color:var(--dtext-3)">Last Updated: <span style="color:var(--dtext-1)">${f}</span></div>
        </div>
    </div>`}const Be={deploy:"Deploy",stand_down:"Stand Down",military_exercises:"Military Exercises",rally:"Rally",agitate:"Agitate",party_congress:"Party Congress",patronage:"Patronage",capital_flight:"Capital Flight",bribe:"Bribe",surveillance:"Surveillance",blackmail:"Blackmail",disappear:"Disappear",broadcast:"Broadcast",smear:"Smear",blackout:"Blackout",arrest_leader:"Arrest Leader",execute_leader:"Execute Leader",release_leader:"Release Leader",favor:"Favor",coup_attempt:"Coup Attempt",declare_putsch:"Declare Putsch",emergency_decree:"Emergency Decree",appeal_security:"Appeal to Security",putsch_do_nothing:"Do Nothing",security_putsch_response:"Security Response",silent_coup:"Silent Coup",silent_coup_vote:"Silent Coup Vote",appoint_successor:"Appoint Successor",revoke_successor:"Revoke Successor",claim_wildcard:"Claim Wildcard",select_pillar:"Select Pillar"},Fa=new Set(["arrest_leader","execute_leader","release_leader"]);function Ga(t,e,a,r){let i="";if(t.length===0)i='<div style="padding:12px 0;text-align:center;color:var(--dtext-3);font-size:11px">No recent events.</div>';else for(const o of t){const s=(e||[]).find(x=>x.id===o.faction_id),v=s?.faction_name||"Unknown",n=s?.party_color||"#888",d=o.action_type.replace(/_(buff|debuff)$/,""),c=Be[o.action_type]||Be[d]||d,w=st(o.tick);let l="";if(Fa.has(o.action_type)&&o.details?.targetFactionId){const x=(e||[]).find(p=>p.id===o.details.targetFactionId),f=o.details.target_leader_name||(x?.leader_first_name&&x?.leader_last_name?`${x.leader_first_name} ${x.leader_last_name}`:null)||a.find(p=>p.faction_id===o.details.targetFactionId)?.leader_name||"Unknown",m=o.details.target_faction_name||x?.faction_name||"Unknown";l=`<div style="font-size:10px;color:var(--dtext-2);margin-top:1px">${b(f)} of ${b(m)}</div>`}i+=`
            <div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid var(--dborder-0)">
                <div style="width:6px;height:6px;border-radius:50%;background:${n};margin-top:4px;flex-shrink:0"></div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:11px;color:var(--dtext-1)"><span style="font-weight:600">${b(v)}</span> used <span style="color:var(--damber);font-weight:600">${b(c)}</span></div>
                    ${l}
                    <div style="font-size:9px;color:var(--dtext-3)">${w}</div>
                </div>
            </div>`}return`
    <div class="pol-party-card" style="width:380px;height:450px;min-width:300px;display:flex;flex-direction:column">
        <div style="font-size:11px;font-weight:700;color:var(--dtext-0);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Autocracy Events</div>
        <div style="flex:1;overflow-y:auto">
            ${i}
        </div>
    </div>`}function Ua(t,e,a){const r=e,{totalSeats:i,mySeats:o,currentTick:s,allParties:v,coalition:n,activeCrises:d,logoSvg:c,roleCls:w,roleLabel:l,leaderName:x,leaderAge:f,leaderIdeo:m,officerNames:p,ideoTag:g,ideo1:k,ideo2:E,deltaHtml:N,voteSharePct:A,lastElectionDate:u,pillarStates:h,autocracyTracker:y,autocracyActionLog:S}=a,_=r.ruling_faction_id,C=t.id===_,T=`${r.head_of_state_first_name||"?"} ${r.head_of_state_last_name||"?"}`,L=r.head_of_state_age||"?",P=r.head_of_state_title||"Strongman",$=y?.tracker_value??30,I=ja($),z=I==="IRON"?"#5cb85c":I==="FIRM"?"#5b9bd5":I==="RESTLESS"?"#c8a64e":I==="VOLATILE"?"#d48a3c":"#d9534f",D={military:"Military",party:"Party",oligarchs:"Oligarchs",media:"Media",security:"Security"},M={military:"#5b9bd5",party:"#c8a64e",oligarchs:"#5cb85c",media:"#d48a3c",security:"#d9534f"},q=y?.wildcard_pillar,H=y?.wildcard_backing??0,O=h.find(W=>W.faction_id===t.id),B=O?.pillar||"?";let F="";const K=["military","party","oligarchs","media","security"];for(const W of K){const X=W===q,ot=h.find(rt=>rt.pillar===W),vt=X?H:ot?Number(ot.backing):0,Tt=Math.round(vt/20*100),Nt=M[W],Rt=D[W],bt=ot?.faction_id===t.id,Mt=ot?(v||[]).find(rt=>rt.id===ot.faction_id)?.faction_name:null,Ot=X?"WILDCARD":Mt?b(Mt):"—",ft=bt?`border-left:2px solid ${Nt};`:"";F+=`
        <div style="display:flex;align-items:center;gap:8px;padding:4px 6px;${ft}">
            <div style="width:70px;font-size:10px;color:${Nt};font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${Rt}</div>
            <div style="flex:1;height:14px;background:var(--dbg-3);border-radius:2px;position:relative;overflow:hidden">
                <div style="width:${Tt}%;height:100%;background:${Nt};opacity:${X?.4:.7};border-radius:2px;transition:width 0.3s"></div>
            </div>
            <div style="width:30px;text-align:right;font-size:11px;color:var(--dtext-1);font-family:var(--dfont-mono)">${vt.toFixed(1)}</div>
            <div style="width:80px;font-size:9px;color:${X?"#d9534f":"var(--dtext-3)"};text-align:right;font-style:${X?"italic":"normal"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Ot}</div>
        </div>`}let tt="";for(const W of h){const X=(v||[]).find(G=>G.id===W.faction_id),ot=X?.faction_name||"Unknown",vt=X?.party_color||"#888",Tt=W.pillar,Nt=D[Tt]||Tt,Rt=M[Tt]||"#888",bt=Number(W.backing).toFixed(1),Mt=X?.leader_first_name&&X?.leader_last_name?`${X.leader_first_name} ${X.leader_last_name}`:W.leader_name||"—",Ot=W.leader_age||"?",ft=W.faction_id===t.id,rt=W.is_strongman,Ht=W.minister_count||0,U=W.is_prime_minister;tt+=`
        <div style="background:var(--dbg-2);border:1px solid ${ft?Rt+"44":"var(--dborder-0)"};border-radius:3px;padding:10px 12px;${ft?"border-left:3px solid "+Rt+";":""}">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="display:flex;align-items:center;gap:6px">
                    <div style="width:8px;height:8px;border-radius:50%;background:${vt}"></div>
                    <span style="font-size:12px;color:var(--dtext-0);font-weight:600">${b(ot)}</span>
                    ${rt?'<span style="font-size:9px;background:#d9534f22;color:#d9534f;padding:1px 5px;border-radius:2px;font-weight:700">STRONGMAN</span>':""}
                    ${U?'<span style="font-size:9px;background:#5b9bd522;color:#5b9bd5;padding:1px 5px;border-radius:2px;font-weight:700">PM</span>':""}
                </div>
                <span style="font-size:10px;color:${Rt};font-weight:600;text-transform:uppercase">${Nt}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:6px;font-size:11px">
                <div><span style="color:var(--dtext-3)">Backing</span> <span style="color:var(--dtext-1);font-weight:600;font-family:var(--dfont-mono)">${bt}</span></div>
                <div><span style="color:var(--dtext-3)">Leader</span> <span style="color:var(--dtext-1)">${b(Mt)}</span> <span style="color:var(--dtext-3)">(${Ot})</span>${W.arrested_leader?' <span style="color:#d9534f;font-weight:700">[ARRESTED]</span>':""}</div>
                ${Ht>0?`<div><span style="color:var(--dtext-3)">Ministers</span> <span style="color:var(--dtext-1)">${Ht}</span></div>`:""}
            </div>
            ${W.arrested_leader?'<div style="font-size:9px;color:#d9534f;margin-top:4px;font-weight:600">LEADER ARRESTED</div>':""}
        </div>`}h.length===0&&(tt='<div style="padding:16px;text-align:center;color:var(--dtext-3);font-size:12px">No factions have claimed pillars yet.</div>');let yt="";if(r.revolution_started_tick!=null){const W=s-r.revolution_started_tick,X=(r.revolution_duration||0)-W;yt=`
        <div style="background:#d9534f11;border:1px solid #d9534f33;border-radius:3px;padding:12px 16px;margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:#d9534f;text-transform:uppercase;letter-spacing:1px">DEMOCRATIC REVOLUTION IN PROGRESS</div>
            <div style="font-size:12px;color:var(--dtext-1);margin-top:4px">${X>0?X+" tick"+(X!==1?"s":"")+" until the regime falls":"Revolution imminent"}</div>
            <div style="font-size:10px;color:var(--dtext-3);margin-top:2px">Per tick: stability -1, civil unrest +1, international reputation -1</div>
        </div>`}return`
    <div class="pol-page">
        <div class="pol-section-label">Politics</div>
        ${yt}
        <div class="pol-columns">

        <!-- Left Column: Combined Regime Card + Regime Support -->
        ${qa(P,T,L,_,v,C,z,I,y)}

        <!-- Your Party Card -->
        <div class="pol-party-card" style="width:380px;height:450px;min-width:300px">
            <div class="pol-header">
                <div class="pol-logo">${c}</div>
                <div class="pol-header-info">
                    <div class="pol-party-name">${b(t.faction_name)} <span style="color:var(--dtext-3);font-size:11px;font-weight:400;font-style:italic;margin-left:4px;">${We(e)}</span></div>
                    <div class="pol-meta-row">
                        <span class="pol-role-badge ${w}">${b(l.toUpperCase())}</span>
                        <span style="font-size:10px;color:${M[B]||"var(--dtext-3)"};font-weight:600;text-transform:uppercase">${b(D[B]||B)} Pillar</span>
                    </div>
                </div>
            </div>
            <div class="pol-ideo-row">${g(k)}${g(E)}</div>
            <hr class="pol-divider">
            <div class="pol-leader-section">
                <span class="pol-sub-label">Leader</span>
                <div class="pol-leader-name">${b(x)} <span class="pol-leader-age">${f}</span></div>
                ${m}
            </div>
            <div class="pol-stats-row">
                <div class="pol-stat"><div class="pol-stat-val">${o}<span class="pol-stat-of">/${i}</span></div><div class="pol-stat-label">Seats ${N}</div></div>
                <div class="pol-stat"><div class="pol-stat-val">${A}%</div><div class="pol-stat-label">Vote Share</div></div>
                ${O?`<div class="pol-stat"><div class="pol-stat-val" style="color:${M[B]}">${Number(O.backing).toFixed(1)}</div><div class="pol-stat-label">Backing</div></div>`:""}
            </div>
        </div>

        <!-- Autocracy Events -->
        ${Ga(S,v,h)}

        <!-- Five Pillars -->
        <div class="pol-party-card" style="width:380px;height:450px;min-width:300px;display:flex;flex-direction:column">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div style="font-size:11px;font-weight:700;color:var(--dtext-0);text-transform:uppercase;letter-spacing:1px">Five Pillars of Power</div>
                <div style="font-size:10px;color:var(--dtext-3)">Scale: 0–20</div>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
                ${F}
            </div>
        </div>

        </div>

        <!-- Faction Cards -->
        <div style="margin-top:16px">
            <div style="font-size:11px;font-weight:700;color:var(--dtext-0);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Factions</div>
            <div style="display:flex;flex-direction:column;gap:6px">
                ${tt}
            </div>
        </div>

        <div class="pol-row-4" style="margin-top:24px;text-align:center">
            <button class="pol-disband-btn" id="pol-disband-party-btn" style="background:transparent;color:#d9534f;border:1px solid #d9534f;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:0.75rem;opacity:0.6;transition:opacity 0.2s" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">Disband Party</button>
            <div style="font-size:0.65rem;color:var(--dtext-3);margin-top:4px">Permanently disband your party and leave the game.</div>
        </div>

    </div>`}function ja(t){return t<=20?"IRON":t<=40?"FIRM":t<=60?"RESTLESS":t<=80?"VOLATILE":"CRITICAL"}function Wa(t,e,a){const r=t||"#888",i=e||(a?a.substring(0,2).toUpperCase():"??");return`<div class="pol-mini-logo" style="background:${r}">${b(i)}</div>`}function Va(t,e){if(e?.head_of_state_title&&!Ve(e))return e.head_of_state_title;if(!t)return"Head of Gov.";const a=t.toLowerCase();return a==="democracy"||a.includes("parliament")?"PM":a.includes("president")?"President":a==="autocracy"||a.includes("dictator")||a.includes("authorit")?"Strongman":"Head of Gov."}function Ka(t,e){if(!t||t.length===0)return"";const a={liberty_equality:"Liberty / Equality",tradition_progress:"Tradition / Progress",security_freedom:"Security / Freedom",globalism_nationalism:"Globalism / Nationalism",individualism_collectivism:"Individualism / Collectivism"};let r="";for(const i of t){const o=Math.round(e*i.seat_share),s=`~${Math.max(1,o-2)}–${o+2}`,v=i.relationship_score,n=v>=60?"var(--green)":v>=30?"var(--amber)":"var(--red)",d=v<30?' <span style="color:var(--red);font-size:0.7rem;">VOLATILE</span>':"";r+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-dim);">
            <div>
                <div style="font-size:0.85rem;font-weight:500;">${b(i.name)}</div>
                <div style="font-size:0.75rem;color:var(--text-dim);">${a[i.dominant_axis]||i.dominant_axis} · ${s} seats</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:60px;height:6px;background:var(--border-dim);border-radius:3px;overflow:hidden;">
                    <div style="width:${v}%;height:100%;background:${n};border-radius:3px;"></div>
                </div>
                ${d}
            </div>
        </div>`}return`<hr class="pol-divider">
        <div style="padding:0 0 4px;">
            <div class="pol-sub-label" style="margin-bottom:6px;">Internal Caucuses</div>
            ${r}
        </div>`}function Ya(t,e,a,r){const i=t||[],o=i.reduce((_,C)=>_+(C.seats||0),0),s=Math.ceil(o/2),v=ge(a);let n,d;v&&!e&&a.ruling_faction_id?(n=new Set([a.ruling_faction_id]),d=a.ruling_faction_id):(n=new Set(e?.party_ids||[]),d=e?.lead_party_id||null);const c=i.filter(_=>n.has(_.id)),w=i.filter(_=>!n.has(_.id)),l=c.reduce((_,C)=>_+(C.seats||0),0),x=w.reduce((_,C)=>_+(C.seats||0),0),f=[...i].sort((_,C)=>(C.seats||0)-(_.seats||0)),m=o>0?f.map(_=>{const C=(_.seats||0)/o*100;if(C<=0)return"";const T=_.party_color||"#888";return`<div class="pol-seat-segment" style="width:${C.toFixed(2)}%;background:${T}"></div>`}).join(""):"",g=`<div class="pol-majority-line" style="left:${(o>0?s/o*100:50).toFixed(2)}%"></div>`,k=Va(a?.government_type,a);function E(_){const C=Wa(_.party_color,_.abbreviation,_.faction_name),T=b(_.faction_name||"Unknown"),L=_.seats||0,P=_.id===r,I=[_.id===d?`<span class="pol-hog-pill">${b(k)}</span>`:"",P?'<span class="pol-you-pill">YOU</span>':""].filter(Boolean).join(" ");return`<div class="pol-parl-party-row">
            ${C}
            <span class="pol-parl-party-name">${T}</span>
            ${I}
            <span class="pol-parl-party-seats">${L}</span>
        </div>`}const N=c.length>0?c.sort((_,C)=>(C.seats||0)-(_.seats||0)).map(E).join(""):"",A=w.length>0?w.sort((_,C)=>(C.seats||0)-(_.seats||0)).map(E).join(""):"",u=l-s,h=u>=0,y=h?"pol-margin-positive":"pol-margin-negative",S=h?`+${u} above majority`:`${Math.abs(u)} below majority`;return`
        <div class="pol-parliament-box">
            <div class="pol-parl-header">
                <span class="pol-parl-title">Parliament</span>
                <span class="pol-parl-seats-count">${o} seats</span>
            </div>

            <div class="pol-seat-bar-wrap">
                <div class="pol-seat-bar">${m}</div>
                ${g}
            </div>

            <div class="pol-section-header">
                <span class="pol-section-title">${v?"Ruling Party":"Governing Coalition"}</span>
                <span class="pol-section-seats">${l} seats</span>
            </div>
            ${N}

            <div class="pol-section-header">
                <span class="pol-section-title">Opposition</span>
                <span class="pol-section-seats">${x} seats</span>
            </div>
            ${A}

            <div class="pol-margin-row ${y}">
                <span class="pol-margin-dot"></span>
                <span>${S}</span>
            </div>
        </div>`}function Xa(t){return t>=60?"var(--dred)":t>=40?"var(--damber)":"var(--dgreen)"}function Ja(t,e,a,r,i,o){const d=r?.election_tick||0,c=d>a?d-a:0,w=d>0&&c<=12,l=Math.ceil(e/2),x=c<=5?"CAMPAIGN SEASON":c<=10?"MID CYCLE":"EARLY CYCLE",f=c<=5?"var(--dred)":c<=10?"var(--damber)":"var(--dgreen)";if(!w){const T=d>0?c-12:0,L=d>0?`Forecast available in <span style="color:var(--dtxt-secondary);font-weight:700">${T} ticks</span><br>Polling begins 12 ticks before election`:"No election currently scheduled",P=d>0?st(d):null;return`
            <div class="pol-forecast-box">
                <div class="pol-fc-header">
                    <span class="pol-mod-title">Election Forecast</span>
                </div>
                ${P?`<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${P}</span></div>`:""}
                <div class="pol-fc-empty">
                    <div class="pol-fc-empty-title">Insufficient polling data</div>
                    <div class="pol-fc-empty-detail">${L}</div>
                </div>
            </div>`}const m={},p={};for(const T of[]){const L=T.faction_id;m[L]=(m[L]||0)+Number(T.momentum||0),p[L]=(p[L]||0)+1}const g=Math.max(1,12-(12-c)),E=(t||[]).filter(T=>Number(T.national_vote_share||0)<=0?!1:T.last_seen_tick==null?!0:a-T.last_seen_tick<12).map(T=>{const L=Number(T.national_vote_share||0),P=Math.round(L/100*e),$=p[T.id]?Math.round(m[T.id]/p[T.id]):0;return{...T,estSeats:P,momentum:$}}).sort((T,L)=>L.estSeats-T.estSeats),N=g>=10?"VERY LOW":g>=7?"LOW":g>=5?"MODERATE":g>=3?"HIGH":"VERY HIGH",A=g>=10?"var(--dred)":g>=7||g>=5?"var(--damber)":g>=3?"#22d3ee":"var(--dgreen)",u=(12-c)/12*100,h=E.map(T=>{const L=Math.max(T.estSeats-g,0),P=Math.min(T.estSeats+g,e),$=L/e*100,I=P/e*100,z=T.party_color||"#888",D=T.abbreviation||(T.faction_name||"??").substring(0,2).toUpperCase(),M=T.id===o,q=T.momentum>0?"var(--dgreen)":T.momentum<0?"var(--dred)":"var(--dtxt-muted)",H=T.momentum>0?"▲":T.momentum<0?"▼":"—",O=T.momentum!==0?`${H}${Math.abs(T.momentum)}`:H,B=l/e*100;return`<div class="pol-fc-party">
            <div class="pol-fc-party-header">
                <div class="pol-fc-party-left">
                    <div class="pol-fc-party-dot" style="background:${z}"></div>
                    <span class="pol-fc-party-abbr" style="color:${z}">${b(D)}</span>
                    ${M?'<span class="pol-ideo-legend-you">YOU</span>':""}
                </div>
                <div class="pol-fc-party-right">
                    <span class="pol-fc-momentum" style="color:${q}">${O}</span>
                    <span class="pol-fc-range">${L}–${P}</span>
                    <span class="pol-fc-seats-label">seats</span>
                </div>
            </div>
            <div class="pol-fc-band">
                <div class="pol-fc-band-fill" style="left:${$.toFixed(1)}%;width:${(I-$).toFixed(1)}%;background:${z}22;border-color:${z}33"></div>
                <div class="pol-fc-maj-line" style="left:${B.toFixed(1)}%"></div>
            </div>
        </div>`}).join(""),y=E.find(T=>T.id===o),S=E.find(T=>T.id!==o);let _="";if(y&&S){const T=Math.max(y.estSeats-g,0),L=Math.min(y.estSeats+g,e),P=Math.max(S.estSeats-g,0),$=Math.min(S.estSeats+g,e),I=Math.max(0,Math.min(L,$)-Math.max(T,P)),z=L-T,D=z>0?Math.round(I/z*100):0,M=y.abbreviation||"YOU",q=S.abbreviation||"RIVAL",H=D>70?"TOO CLOSE TO CALL":D>30?"COMPETITIVE":D>0?y.estSeats>S.estSeats?`LEANING ${M}`:`LEANING ${q}`:y.estSeats>S.estSeats?`${M} LEADS`:`${q} LEADS`,O=D>70?"var(--dred)":D>30?"var(--damber)":"var(--dgreen)",B=D>70?`${M} and ${q} seat ranges fully overlap. Outcome is uncertain.`:D>30?"Bands are narrowing. Late campaigns could decide the race.":D>0?"Leading party is emerging, but the gap is not yet decisive.":"Ranges no longer overlap. Leader is identifiable.";_=`
            <div class="pol-fc-status" style="background:${O}08;border-color:${O}">
                <div class="pol-fc-status-header">
                    <span class="pol-fc-status-label" style="color:${O}">${b(H)}</span>
                    <span class="pol-fc-status-overlap">${D}% overlap</span>
                </div>
                <div class="pol-fc-status-desc">${B}</div>
            </div>`}const C=d>0?st(d):null;return`
        <div class="pol-forecast-box">
            <div class="pol-fc-header">
                <span class="pol-mod-title">Election Forecast</span>
                <span class="pol-fc-phase" style="color:${f};background:${f}15">${x}</span>
            </div>
            ${C?`<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${C}</span></div>`:""}
            <div class="pol-fc-countdown">
                <div>
                    <span class="pol-fc-ticks-big" style="color:${f}">${c}</span>
                    <span class="pol-fc-ticks-label">ticks</span>
                </div>
                <div style="text-align:right">
                    <div style="display:flex;align-items:center;gap:4px;justify-content:flex-end">
                        <span class="pol-fc-margin-label">Margin:</span>
                        <span class="pol-fc-margin-val" style="color:${A}">±${g} seats</span>
                    </div>
                    <span class="pol-fc-conf-badge" style="color:${A};background:${A}15">${N} CONFIDENCE</span>
                </div>
            </div>
            <div class="pol-fc-conf-bar">
                <div class="pol-fc-conf-fill" style="width:${u.toFixed(0)}%;background:${A}"></div>
            </div>
            ${h}
            <div class="pol-fc-maj-legend">
                <div class="pol-fc-maj-dash"></div>
                <span class="pol-fc-maj-text">Majority: ${l} seats</span>
            </div>
            ${_}
        </div>`}function Za(t,e,a,r){const i=e||[];let o;i.length===0?o='<div class="pol-mood-no-crises">No active crises</div>':o=i.map(n=>{const d=n.crisis_templates?.name||"Unknown Crisis",c=a-(n.started_at_tick||0);return`<div class="pol-mood-crisis">
                <span class="pol-mood-crisis-name">${b(d)}</span>
                <span class="pol-mood-crisis-dur">${c}t</span>
            </div>`}).join("");const v=qe.map(n=>{const d=Pt[n],c=Number(r?.[n]?.salience??30);return{id:n,name:d.label,salience:c,statKeys:d.stats}}).sort((n,d)=>d.salience-n.salience).map(n=>{const d=Xa(n.salience),c=n.statKeys.map(w=>{const l=Math.round(Number(t[w]??0)),x=w.replace(/_/g," ").replace(/\b\w/g,f=>f.toUpperCase());return`<div class="pol-mood-stat-row">
                <span class="pol-mood-stat-name">${b(x)}</span>
                <span class="pol-mood-stat-val">${l}</span>
            </div>`}).join("");return`<div class="pol-mood-issue-wrap">
            <div class="pol-mood-issue" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.pol-mood-chevron').textContent=this.nextElementSibling.classList.contains('open')?'▾':'▸'">
                <span class="pol-mood-issue-name">${b(n.name)}</span>
                <div class="pol-mood-issue-bar-wrap">
                    <div class="pol-mood-issue-bar" style="width:${n.salience}%;background:${d}"></div>
                </div>
                <span class="pol-mood-issue-pct">${n.salience}%</span>
                <span class="pol-mood-chevron">▸</span>
            </div>
            <div class="pol-mood-stats">${c}</div>
        </div>`}).join("");return`
        <div class="pol-mood-box">
            <div class="pol-mood-header">
                <span class="pol-mood-title">Electorate Issues</span>
            </div>
            <div class="pol-mood-subtitle">Shows which issues matter most to the electorate.</div>
            ${o}
            ${v}
        </div>`}function Qa(t,e,a,r,i,o,s){const v=wa(t),n=ge(t),d=a||[],c=Math.round(Number(t.gov_approval??40)),w=c>=50?"var(--dgreen)":c>=35?"var(--damber)":"var(--dred)",l=s?.admin_name||"Government",x=n?"Autocracy":v?"Presidential":"Parliamentary",f=new Set(e?.party_ids||[]),m=d.filter(L=>f.has(L.id)),p=m.reduce((L,P)=>L+(P.seats||0),0),g=d.reduce((L,P)=>L+(P.seats||0),0),k=Math.ceil(g/2),E=p>=k,N=m.length>1?"Coalition":m.length===1?"Single Party":"";function A(L,P){return((L||"?")[0]+(P||"?")[0]).toUpperCase()}let u="";if(v&&o){const L=d.find(D=>D.id===o.faction_id),P=L?.party_color||"#888",$=L?.abbreviation||(L?.faction_name||"??").substring(0,3).toUpperCase(),I=o.terms_served>1?o.terms_served===2?"2nd":o.terms_served+"th":"1st",z=A(o.first_name,o.last_name);u=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${b(z)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${b(o.first_name+" "+o.last_name)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">President &middot; Age ${o.age||"?"} &middot; ${I} Term</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${P}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${P}">${b($)}</span>
            </div>
          </div>
        </div>`}else if(!v&&!n&&e){const L=d.find(D=>D.id===e.lead_party_id),P=L?.party_color||"#888",$=L?.faction_name||"Unknown",I=L?.abbreviation||$.substring(0,3).toUpperCase(),z=$.split(/\s+/).map(D=>D[0]).join("").toUpperCase().slice(0,2);u=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${b(z)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${b($)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of Government</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${P}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${P}">${b(I)}</span>
            </div>
          </div>
        </div>`}else if(n){const L=t.head_of_state_first_name&&t.head_of_state_last_name?t.head_of_state_first_name+" "+t.head_of_state_last_name:"Unknown",P=A(t.head_of_state_first_name,t.head_of_state_last_name),$=t.ruling_faction_id?d.find(D=>D.id===t.ruling_faction_id):null,I=$?.party_color||"#c8a64e",z=$?.abbreviation||($?.faction_name||"??").substring(0,3).toUpperCase();u=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${b(P)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${b(L)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Generalísimo${t.head_of_state_age?" &middot; Age "+t.head_of_state_age:""}</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${I}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${I}">${b(z)}</span>
            </div>
          </div>
        </div>`}let h="";const y=t.head_of_state_first_name||"",S=t.head_of_state_last_name||"";if(v&&y&&S){const L=A(y,S);h=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${b(L)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${b(y+" "+S)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Vice President</div>
          </div>
        </div>`}else if(!v&&!n&&y&&S){const L=A(y,S);h=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${b(L)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${b(y+" "+S)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of State</div>
          </div>
        </div>`}const _=[...m].sort((L,P)=>(P.seats||0)-(L.seats||0));g>0&&_.map(L=>{const P=(L.seats||0)/g*100;return P<=0?"":`<div style="width:${P.toFixed(2)}%;height:100%;background:${L.party_color||"#888"}"></div>`}).join(""),_.map(L=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
            <div style="width:7px;height:7px;border-radius:2px;background:${L.party_color||"#888"};flex-shrink:0"></div>
            <span style="font-family:var(--dfont-ui);font-size:12px;color:var(--dtext-0);flex:1">${b(L.faction_name||"Unknown")}</span>
            <span style="font-family:var(--dfont-mono);font-size:12px;font-weight:600;color:${L.party_color||"var(--dtext-0)"}">${L.seats||0}</span>
        </div>`).join("");const C=E?"Majority Government":"Minority Government",T=`${p}/${g} seats (${k} needed)`;return`<div class="pol-admin-box">
        <div style="font-family:var(--dfont-ui);font-size:16px;font-weight:700;color:var(--dtext-0);margin-bottom:8px">${b(l)}</div>
        <div style="display:flex;gap:6px;margin-bottom:16px">
            <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:3px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${b(x)}</span>
            ${N?`<span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:3px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${b(N)}</span>`:""}
        </div>

        ${u}
        ${h}

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Approval</div>
        <div style="font-family:var(--dfont-mono);font-size:28px;font-weight:700;line-height:1;color:${w}">${c}%</div>
        <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:4px;display:flex;align-items:center;gap:8px">
            <span style="text-transform:uppercase;font-weight:600">${b(C)}</span>
            <span style="font-weight:400">${b(T)}</span>
        </div>

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Party Events</div>
        <div id="gov-card-party-events" class="pe-feed" style="max-height:200px;overflow-y:auto;font-size:11px">
            <div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">Loading events...</div>
        </div>
    </div>`}const _t=360,te=200,Xt=256;function ts(t,e){const a=t.party_color||"#ffcc00",r=t.party_logo||"flag",i=t.party_description||"",o=t.action_points||0,s=t.last_rename_tick||0,v=s>0?Math.max(0,_t-(e-s)):0,n=v>0,d=!!t.custom_logo_url,c=Ne({customLogoUrl:t.custom_logo_url,iconKey:r,size:20,color:a}),w=ea.map(p=>`<div class="pol-id-swatch${p.hex.toLowerCase()===a.toLowerCase()?" selected":""}" data-color="${p.hex}" title="${p.label}" style="background:${p.hex}"></div>`).join(""),l={};for(const[p,g]of Object.entries(aa)){const k=g.category||"Other";l[k]||(l[k]=[]),l[k].push({key:p,label:g.label})}let x="";for(const[p,g]of Object.entries(l)){x+=`<div class="pol-id-icon-cat">${b(p)}</div><div class="pol-id-icon-grid">`;for(const k of g){const E=k.key===r?" selected":"",N=Ce(k.key,16,k.key===r?a:"#888");x+=`<div class="pol-id-icon-tile${E}" data-icon="${k.key}" title="${b(k.label)}" style="color:${k.key===r?a:"#888"}">${N}</div>`}x+="</div>"}let f,m;if(n){const g=`
            <div class="pol-id-cooldown">
                <span class="pol-id-cooldown-label">Rename cooldown</span>
                <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:${(v/_t*100).toFixed(1)}%"></div></div>
                <span class="pol-id-cooldown-ticks">${v}t</span>
            </div>`;f=g,m=g}else f=`
            <button class="pol-id-rename-btn" id="pol-id-rename-btn">
                <span>Rename Party</span>
                <span class="pol-id-rename-cost">${_t}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-rename-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-rename-input" placeholder="Enter new party name…" maxlength="60">
                    <button class="pol-id-rename-confirm" id="pol-id-rename-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-rename-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${_t} ticks</span></span>
                </div>
                <div class="pol-id-error" id="pol-id-rename-error" style="display:none"></div>
            </div>`,m=`
            <button class="pol-id-rename-btn" id="pol-id-abbr-btn">
                <span>Change Abbreviation</span>
                <span class="pol-id-rename-cost">${_t}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-abbr-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-abbr-input" placeholder="2–4 letters" maxlength="4" style="text-transform:uppercase;font-family:var(--dfont-mono);font-weight:700;letter-spacing:0.1em;width:80px">
                    <button class="pol-id-rename-confirm" id="pol-id-abbr-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-abbr-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${_t} ticks</span></span>
                </div>
                <div class="pol-id-error" id="pol-id-abbr-error" style="display:none"></div>
            </div>`;return`<div class="pol-identity-box" id="pol-identity-box"
        data-faction-id="${t.id}"
        data-selected-color="${a}"
        data-selected-icon="${r}"
        data-current-tick="${e}">

        <!-- Header -->
        <div class="pol-id-header">
            <div>
                <div class="pol-id-title">Edit Party Identity</div>
                <div class="pol-id-subtitle">Cosmetic changes are free and instant</div>
            </div>
            <div class="pol-id-preview" id="pol-id-preview" style="border:2px solid ${a};background:${a}18">
                ${c}
            </div>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Party Name -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="pol-id-section-label">Party Name</span>
                <span class="pol-id-ap-badge">AP: <span id="pol-id-ap-display">${o}</span></span>
            </div>
            <div class="pol-id-name-display">
                <span id="pol-id-current-name">${b(t.faction_name)}</span>
                <span>current</span>
            </div>
            ${f}
        </div>
        <div class="pol-id-divider"></div>

        <!-- Abbreviation -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="pol-id-section-label">Abbreviation</span>
            </div>
            <div class="pol-id-name-display">
                <span id="pol-id-current-abbr">${b(t.abbreviation||"???")}</span>
                <span>current</span>
            </div>
            ${m}
        </div>
        <div class="pol-id-divider"></div>

        <!-- Description -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span class="pol-id-section-label">Description</span>
                <span class="pol-id-char-count${i.length>te*.9?" warn":""}" id="pol-id-char-count">${i.length} / ${te}</span>
            </div>
            <textarea class="pol-id-desc" id="pol-id-desc" rows="3" maxlength="${te}">${b(i)}</textarea>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Party Color -->
        <div style="margin-bottom:14px">
            <span class="pol-id-section-label">Party Color</span>
            <div class="pol-id-colors" id="pol-id-colors">${w}</div>
            <div class="pol-id-hex-row">
                <span class="pol-id-hex-label">Custom hex</span>
                <input class="pol-id-hex-input" id="pol-id-hex-input" value="${a}" maxlength="7">
                <div class="pol-id-hex-preview" id="pol-id-hex-preview" style="background:${a}"></div>
            </div>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Party Logo -->
        <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span class="pol-id-section-label">Party Logo</span>
                <div class="pol-id-tab-bar">
                    <button class="pol-id-tab${d?"":" active"}" data-tab="icon">Icon</button>
                    <button class="pol-id-tab${d?" active":""}" data-tab="custom">Custom Image</button>
                </div>
            </div>
            <div id="pol-id-icon-section"${d?' style="display:none"':""}>${x}</div>
            <div id="pol-id-upload-section"${d?"":' style="display:none"'}>
                <div class="pol-id-upload-zone${d?" has-image":""}" id="pol-id-upload-zone">
                    ${d?`
                        <img class="pol-id-upload-preview" src="${t.custom_logo_url}" alt="preview" style="border:2px solid ${a}">
                        <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Xt}KB · Best at 128×128px</div>
                    `:`
                        <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                        <div class="pol-id-upload-text">Click to upload logo</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Xt}KB · Best at 128×128px</div>
                    `}
                </div>
                <input type="file" accept="image/*" id="pol-id-file-input" style="display:none">
                <div class="pol-id-error" id="pol-id-upload-error" style="display:none"></div>
                <button class="pol-id-remove-btn" id="pol-id-remove-btn"${d?"":' style="display:none"'}>Remove Image</button>
            </div>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Footer -->
        <div class="pol-id-footer">
            <div class="pol-id-footer-hint">Preview updates live ↗</div>
            <button class="pol-id-save-btn" id="pol-id-save-btn">Save Changes</button>
        </div>
    </div>`}function es(t){const e=document.getElementById("pol-identity-box");if(!e)return;const a=document.getElementById("pol-id-preview"),r=document.getElementById("pol-id-colors"),i=document.getElementById("pol-id-hex-input"),o=document.getElementById("pol-id-hex-preview"),s=document.getElementById("pol-id-desc"),v=document.getElementById("pol-id-char-count"),n=document.getElementById("pol-id-save-btn"),d=document.getElementById("pol-id-rename-btn"),c=document.getElementById("pol-id-rename-form"),w=document.getElementById("pol-id-rename-input"),l=document.getElementById("pol-id-rename-confirm"),x=document.getElementById("pol-id-rename-cancel"),f=document.getElementById("pol-id-rename-error"),m=document.getElementById("pol-id-abbr-btn"),p=document.getElementById("pol-id-abbr-form"),g=document.getElementById("pol-id-abbr-input"),k=document.getElementById("pol-id-abbr-confirm"),E=document.getElementById("pol-id-abbr-cancel"),N=document.getElementById("pol-id-abbr-error"),A=document.getElementById("pol-id-current-abbr");document.getElementById("pol-id-abbr-ap-available");const u=document.getElementById("pol-id-current-name");document.getElementById("pol-id-ap-display"),document.getElementById("pol-id-ap-available");const h=document.getElementById("pol-id-icon-section"),y=document.getElementById("pol-id-upload-section"),S=document.getElementById("pol-id-upload-zone"),_=document.getElementById("pol-id-file-input"),C=document.getElementById("pol-id-upload-error"),T=document.getElementById("pol-id-remove-btn");let L=null,P=null,$=!!t.custom_logo_url,I=t.custom_logo_url||null;function z(){return e.dataset.selectedColor}function D(){return e.dataset.selectedIcon}function M(){const O=z();if(a.style.border="2px solid "+O,a.style.background=O+"18",$&&(L||I)){const B=L||I;a.innerHTML='<img src="'+B+'" alt="" style="width:100%;height:100%;object-fit:cover">'}else a.innerHTML=Ce(D(),20,O)}function q(){const O=z(),B=D();e.querySelectorAll(".pol-id-icon-tile").forEach(F=>{const K=F.dataset.icon,tt=K===B;F.classList.toggle("selected",tt),F.style.color=tt?O:"#888",F.innerHTML=Ce(K,16,tt?O:"#888")})}function H(){const O=z().toLowerCase();e.querySelectorAll(".pol-id-swatch").forEach(B=>{B.classList.toggle("selected",B.dataset.color.toLowerCase()===O)})}r&&r.addEventListener("click",O=>{const B=O.target.closest(".pol-id-swatch");B&&(e.dataset.selectedColor=B.dataset.color,i.value=B.dataset.color,o.style.background=B.dataset.color,H(),q(),M())}),i&&i.addEventListener("input",()=>{const O=i.value;/^#[0-9a-fA-F]{6}$/.test(O)?(e.dataset.selectedColor=O,o.style.background=O,H(),q(),M()):o.style.background="var(--dtext-3)"}),h&&h.addEventListener("click",O=>{const B=O.target.closest(".pol-id-icon-tile");B&&(e.dataset.selectedIcon=B.dataset.icon,$=!1,q(),M())}),e.querySelectorAll(".pol-id-tab").forEach(O=>{O.addEventListener("click",()=>{e.querySelectorAll(".pol-id-tab").forEach(F=>F.classList.remove("active")),O.classList.add("active");const B=O.dataset.tab==="icon";h.style.display=B?"":"none",y.style.display=B?"none":""})}),S&&S.addEventListener("click",()=>_.click()),_&&_.addEventListener("change",O=>{const B=O.target.files[0];if(!B)return;if(C.style.display="none",B.size>Xt*1024){C.textContent="⚠ File too large — max "+Xt+"KB.",C.style.display="";return}if(!B.type.startsWith("image/")){C.textContent="⚠ Must be PNG, JPG, SVG, or WebP.",C.style.display="";return}const F=new FileReader;F.onload=K=>{L=K.target.result,P=B,$=!0,S.classList.add("has-image"),S.innerHTML=`
                    <img class="pol-id-upload-preview" src="${L}" alt="preview" style="border:2px solid ${z()}">
                    <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                    <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Xt}KB · Best at 128×128px</div>`,T.style.display="",M()},F.readAsDataURL(B)}),T&&T.addEventListener("click",()=>{L=null,P=null,$=!1,I=null,S.classList.remove("has-image"),S.innerHTML=`
                <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                <div class="pol-id-upload-text">Click to upload logo</div>
                <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Xt}KB · Best at 128×128px</div>`,T.style.display="none",M()}),s&&v&&s.addEventListener("input",()=>{const O=s.value.length;v.textContent=O+" / "+te,v.classList.toggle("warn",O>te*.9)}),m&&p&&m.addEventListener("click",()=>{m.style.display="none",p.style.display="",g.focus()}),E&&E.addEventListener("click",()=>{p.style.display="none",m.style.display="",g.value="",N.style.display="none",g.classList.remove("has-error")}),g&&g.addEventListener("input",()=>{g.value=g.value.toUpperCase()}),k&&k.addEventListener("click",async()=>{if(k.disabled)return;N.style.display="none",g.classList.remove("has-error");const O=g.value.trim().toUpperCase();if(O.length<2||O.length>4){N.textContent="⚠ Must be 2–4 letters.",N.style.display="",g.classList.add("has-error");return}k.disabled=!0;const B=parseInt(e.dataset.currentTick)||0,{error:F}=await R.from("factions").update({abbreviation:O,last_rename_tick:B}).eq("id",t.id);if(F){N.textContent="⚠ Failed to save — try again.",N.style.display="",k.disabled=!1;return}A.textContent=O,p.style.display="none",g.value="",m.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${_t}t</span>
                </div>`,d&&(c.style.display="none",d.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${_t}t</span>
                    </div>`)}),d&&c&&d.addEventListener("click",()=>{d.style.display="none",c.style.display="",w.focus()}),x&&x.addEventListener("click",()=>{c.style.display="none",d.style.display="",w.value="",f.style.display="none",w.classList.remove("has-error")}),l&&l.addEventListener("click",async()=>{f.style.display="none",w.classList.remove("has-error");const O=w.value.trim();if(!O){f.textContent="⚠ Name cannot be empty.",f.style.display="",w.classList.add("has-error");return}if(O.length<3){f.textContent="⚠ Minimum 3 characters.",f.style.display="",w.classList.add("has-error");return}const B=parseInt(e.dataset.currentTick)||0,{error:F}=await R.from("factions").update({faction_name:O,last_rename_tick:B}).eq("id",t.id);if(F){f.textContent="⚠ Failed to save — try again.",f.style.display="";return}u.textContent=O,c.style.display="none",w.value="",d.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${_t}t</span>
                </div>`,m&&(p.style.display="none",m.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${_t}t</span>
                    </div>`)}),n&&n.addEventListener("click",async()=>{n.disabled=!0,n.textContent="Saving...";let O=I;if($&&P){const F=P.name.split(".").pop()||"png",K=`party-logos/${t.id}/${Date.now()}.${F}`,{error:tt}=await R.storage.from("public-assets").upload(K,P,{contentType:P.type,upsert:!0});if(tt){console.error("Logo upload failed:",tt.message),n.textContent="⚠ Upload failed",n.disabled=!1,setTimeout(()=>{n.textContent="Save Changes"},2e3);return}const{data:yt}=R.storage.from("public-assets").getPublicUrl(K);O=yt?.publicUrl||null,I=O,P=null}const B={party_color:z(),party_logo:$?null:D(),custom_logo_url:$?O:null,party_description:s?s.value.slice(0,te):""};await R.from("factions").update(B).eq("id",t.id),n.textContent="✓ Saved",n.classList.add("saved"),n.disabled=!1,setTimeout(()=>{n.textContent="Save Changes",n.classList.remove("saved")},2e3)})}function as(t,e,a,{scheduledElections:r,currentTick:i,nation:o,mySeats:s,faction:v,currentEndorsement:n}={}){const d={},c={};(a||[]).forEach(h=>{d[h.id]=h.party_color||"#888",c[h.id]=h.seats||0});function w(h){if(!h)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const y=h.results;if(!y||!y.votes)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const S=st(h.election_tick),_=new Set(y.votes.map($=>$.party_id)),C=(a||[]).filter($=>!_.has($.id)&&(c[$.id]||0)>0).map($=>({party_id:$.id,party_name:$.faction_name,votes:0,vote_percentage:0,seats:c[$.id]||0})),T=[...y.votes,...C].map($=>({...$,seats:c[$.party_id]??$.seats??0})).sort(($,I)=>(I.seats||0)-($.seats||0)),L=Math.max(...T.map($=>$.vote_percentage||0),1);let P=T.map($=>{const I=d[$.party_id]||"#888",z=($.vote_percentage||0).toFixed(1),D=Math.round(($.vote_percentage||0)/L*100);return`<tr>
                <td><span class="pol-el-color-dot" style="background:${I}"></span>${b($.party_name)}</td>
                <td>${($.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${D}%;background:${I}"></div></div></td>
                <td>${z}%</td>
                <td>${$.seats||0}</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${S}</div>
            <div class="pol-el-summary">Turnout: ${(y.turnout_pct||0).toFixed(1)}% &middot; ${(y.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Party</th><th>Votes</th><th></th><th>%</th><th>Seats</th></tr></thead>
                <tbody>${P}</tbody>
            </table>`}function l(h,y,S,_){const C=[...h].sort((P,$)=>($.votes||0)-(P.votes||0)),T=Math.max(...C.map(P=>P.vote_percentage||0),1);let L=C.map(P=>{const $=d[P.faction_id]||"#888",I=(P.vote_percentage||0).toFixed(1),z=Math.round((P.vote_percentage||0)/T*100),D=P.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";return`<tr>
                <td><span class="pol-el-color-dot" style="background:${$}"></span>${b(P.candidate_name)}${D}</td>
                <td>${b(P.party_name)}</td>
                <td>${(P.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${z}%;background:${$}"></div></div></td>
                <td>${I}%</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${y}</div>
            <div class="pol-el-summary">Turnout: ${(S||0).toFixed(1)}% &middot; ${(_||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${L}</tbody>
            </table>`}function x(h){if(!h)return'<div class="pol-el-empty">No presidential election results yet.</div>';const y=h.results;if(!y||!y.presidential_candidates)return'<div class="pol-el-empty">No presidential election results yet.</div>';const S=st(h.election_tick);return l(y.presidential_candidates,S,y.turnout_pct,y.total_votes_cast)}function f(h){if(!h)return'<div class="pol-el-empty">No first round results.</div>';const y=h.results,S=y?.round_1_candidates||y?.presidential_candidates;if(!S)return'<div class="pol-el-empty">No first round results.</div>';const _=st(h.election_tick);return l(S,_,y.turnout_pct,y.total_votes_cast)}function m(h){if(!h)return'<div class="pol-el-empty">No runoff results.</div>';const y=h.results,S=y?.runoff_candidates;if(!S)return'<div class="pol-el-empty">No runoff results.</div>';const _=st(h.election_tick),C=[...S].sort((I,z)=>(z.votes||0)-(I.votes||0)),T=Math.max(...C.map(I=>I.vote_percentage||0),1);let L=C.map(I=>{const z=d[I.faction_id]||"#888",D=(I.vote_percentage||0).toFixed(1),M=Math.round((I.vote_percentage||0)/T*100),q=I.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";let H="";return I.base_votes!=null&&I.transfer_votes&&(H=`<div style="font-size:10px;color:var(--dtxt-muted);margin-top:2px">${(I.base_votes||0).toLocaleString()} direct + ${(I.transfer_votes||0).toLocaleString()} transferred</div>`),`<tr>
                <td><span class="pol-el-color-dot" style="background:${z}"></span>${b(I.candidate_name)}${q}</td>
                <td>${b(I.party_name)}</td>
                <td>${(I.votes||0).toLocaleString()}${H}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${M}%;background:${z}"></div></div></td>
                <td>${D}%</td>
            </tr>`}).join(""),P=`
            <div class="pol-el-date">${_}</div>
            <div class="pol-el-summary">Turnout: ${(y.turnout_pct||0).toFixed(1)}% &middot; ${(y.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${L}</tbody>
            </table>`;const $=C.flatMap(I=>(I.transfer_detail||[]).map(z=>({...z,to_candidate:I.candidate_name,to_faction_id:I.faction_id})));if($.length>0){let I=$.map(z=>{const D=d[z.faction_id]||"#888",M=d[z.to_faction_id]||"#888",q=z.round1_votes>0?Math.round(z.transferred/z.round1_votes*100):0;return`<tr>
                    <td><span class="pol-el-color-dot" style="background:${D}"></span>${b(z.party_name||"")}</td>
                    <td><span class="pol-el-color-dot" style="background:${M}"></span>${b(z.to_candidate||"")}</td>
                    <td>${(z.transferred||0).toLocaleString()}</td>
                    <td>${q}%</td>
                </tr>`}).join("");P+=`
                <div style="margin-top:14px;font-family:var(--dfont-mono);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--dtxt-muted);margin-bottom:6px">Vote Transfers</div>
                <table class="pol-el-table">
                    <thead><tr><th>Eliminated Party</th><th>Votes Went To</th><th>Transferred</th><th>Rate</th></tr></thead>
                    <tbody>${I}</tbody>
                </table>`}return P}const p=e?.results?.was_runoff===!0;let g,k;p?(g=`
            <button class="pol-el-tab" data-tab="pres-r1">General Election [1st Round]</button>
            <button class="pol-el-tab" data-tab="pres-runoff">General Election [Runoff]</button>`,k=`
            <div class="pol-el-content" data-content="pres-r1">${f(e)}</div>
            <div class="pol-el-content" data-content="pres-runoff">${m(e)}</div>`):(g='<button class="pol-el-tab" data-tab="pres">General Election</button>',k=`<div class="pol-el-content" data-content="pres">${x(e)}</div>`);const E=Na({isPresidentialSystem:Ve(o),scheduledElections:r,currentTick:i,playerSeats:s});let N="";E.ticksUntilWindow?N=`<div style="font-size:10px;color:var(--dtxt-muted);text-align:right;margin-top:2px">Available in ${E.ticksUntilWindow} tick${E.ticksUntilWindow!==1?"s":""}</div>`:!E.disabled&&E.ticksUntilElection&&(N=`<div style="font-size:10px;color:var(--dgreen);text-align:right;margin-top:2px">${E.ticksUntilElection} tick${E.ticksUntilElection!==1?"s":""} until election</div>`);let A="",u="";if(!E.hidden){const h=n?.endorsed_faction_id||null,S=(a||[]).filter(_=>_.id!==v?.id&&(_.seats||0)>0).map(_=>{const C=_.party_color||"#888",T=[_.leader_first_name,_.leader_last_name].filter(Boolean).join(" ")||"Unknown",L=_.id===h;return`<div class="pol-endorse-candidate${L?" selected":""}" data-faction-id="${_.id}">
                <span class="pol-el-color-dot" style="background:${C}"></span>
                <span class="pol-endorse-candidate-name">${b(_.faction_name||_.abbreviation)}</span>
                <span class="pol-endorse-candidate-leader">${b(T)}</span>
                <span class="pol-endorse-candidate-seats">${_.seats||0} seats</span>
                ${L?'<span style="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)">ENDORSED</span>':""}
            </div>`}).join("");A=`<div>
            <button class="pol-endorse-btn" ${E.disabled?"disabled":""}>Endorse Candidate</button>
            ${N}
        </div>`,u=`<div class="pol-endorse-panel" style="display:none">
            <div class="pol-endorse-panel-header">
                <span class="pol-section-label" style="margin-bottom:0;font-size:9px">ENDORSE A CANDIDATE</span>
                <button class="pol-endorse-panel-close">&times;</button>
            </div>
            <div class="pol-endorse-panel-desc">Select a party's candidate to endorse for the presidential election. First endorsement is free; switching costs 1 AP.</div>
            <div class="pol-endorse-candidate-list">
                ${S||'<div class="pol-el-empty">No eligible parties to endorse.</div>'}
            </div>
        </div>`}return`<div class="pol-election-box"
        data-faction-id="${v?.id||""}"
        data-nation-id="${o?.id||""}"
        data-current-tick="${i||0}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div class="pol-section-label" style="margin-bottom:0">ELECTION RESULTS</div>
            ${A}
        </div>
        ${u}
        <div class="pol-el-tabs">
            <button class="pol-el-tab active" data-tab="parl">Parliamentary</button>
            ${g}
        </div>
        <div class="pol-el-content active" data-content="parl">${w(t)}</div>
        ${k}
    </div>`}function ss(){const t=document.querySelector(".pol-election-box");if(!t)return;const e=t.querySelectorAll(".pol-el-tab"),a=t.querySelectorAll(".pol-el-content");e.forEach(s=>{s.addEventListener("click",()=>{e.forEach(d=>d.classList.remove("active")),a.forEach(d=>d.classList.remove("active")),s.classList.add("active");const v=s.getAttribute("data-tab"),n=t.querySelector(`.pol-el-content[data-content="${v}"]`);n&&n.classList.add("active")})});const r=t.querySelector(".pol-endorse-btn"),i=t.querySelector(".pol-endorse-panel"),o=t.querySelector(".pol-endorse-panel-close");r&&i&&(r.addEventListener("click",()=>{const s=i.style.display!=="none";i.style.display=s?"none":"block"}),o&&o.addEventListener("click",()=>{i.style.display="none"}),i.querySelectorAll(".pol-endorse-candidate").forEach(s=>{s.addEventListener("click",async()=>{const v=s.getAttribute("data-faction-id"),n=t.getAttribute("data-faction-id"),d=t.getAttribute("data-nation-id"),c=Number(t.getAttribute("data-current-tick")||0),w=s.querySelector(".pol-endorse-candidate-name")?.textContent||"this party";if(confirm(`Endorse ${w}'s candidate for president? First endorsement is free; switching costs 1 AP.`)){s.style.opacity="0.5",s.style.pointerEvents="none";try{const l=await la(R,n,d,v,c);if(!l.success){alert(l.error||"Endorsement failed.");return}i.querySelectorAll(".pol-endorse-candidate").forEach(f=>f.classList.remove("selected")),s.classList.add("selected");const x=l.alreadySelected?`Already endorsing ${w}.`:l.apCharged?`Endorsed ${w}! (1 AP spent)`:`Endorsed ${w}!`;alert(x),i.style.display="none"}catch(l){alert("Endorsement failed: "+(l.message||"Unknown error"))}finally{s.style.opacity="",s.style.pointerEvents=""}}})}))}function is(){const t=document.getElementById("pol-ba-bloc-data"),e=document.getElementById("pol-ba-party-pos"),a=document.getElementById("pol-ba-party-color");if(!t||!e)return;const r=JSON.parse(t.textContent),i=JSON.parse(e.textContent),o=JSON.parse(a.textContent);if(r.length===0)return;const s={BASE:{color:"var(--dgreen)",raw:"#4ade80",dim:"rgba(74,222,128,0.08)"},LEAN:{color:"#22d3ee",raw:"#22d3ee",dim:"rgba(34,211,238,0.08)"},SWING:{color:"var(--damber)",raw:"#facc15",dim:"rgba(250,204,21,0.08)"},SKEPTICAL:{color:"#f97316",raw:"#f97316",dim:"rgba(249,115,22,0.08)"},HOSTILE:{color:"var(--dred)",raw:"#ef4444",dim:"rgba(239,68,68,0.08)"}},v=[{key:"liberty_equality",left:"Liberty",right:"Equality"},{key:"tradition_progress",left:"Tradition",right:"Progress"},{key:"security_freedom",left:"Security",right:"Freedom"},{key:"globalism_nationalism",left:"Globalism",right:"Nationalism"},{key:"individualism_collectivism",left:"Individualism",right:"Collectivism"}],n=p=>p<=10?"var(--dgreen)":p<=20?"#22d3ee":p<=35?"var(--damber)":p<=50?"#f97316":"var(--dred)",d=p=>p>=3?"●●●":p>=2?"●●":p>=1?"●":"",c=p=>p>=3?"var(--dred)":p>=2?"#f97316":p>=1?"var(--damber)":"var(--dtext-3)",w=document.getElementById("pol-ba-selected"),l=document.getElementById("pol-ba-dropdown"),x=document.getElementById("pol-ba-sel-arrow"),f=l.querySelectorAll(".pol-ba-drop-item");function m(p){const g=s[p.tier]||s.HOSTILE;document.getElementById("pol-ba-sel-dot").style.background=g.raw,document.getElementById("pol-ba-sel-name").textContent=p.name;const k=document.getElementById("pol-ba-sel-badge");k.textContent=p.tier,k.style.color=g.raw,k.style.background=g.dim,document.getElementById("pol-ba-sel-pct").textContent=p.pct+"%";const E=v.map(M=>{const q=i[M.key]||50,H=p.axes[M.key]||50,O=Math.abs(q-H),B=p.strengths[M.key]||.5;return{...M,pv:q,bv:H,dist:O,str:B,weighted:O*B}}),N=E.reduce((M,q)=>M+q.weighted,0),A=v.length*100*3,u=Math.round(Math.max(0,100-N/A*100)),h=p.pref,y=u-h,S=document.getElementById("pol-ba-alignment");S.textContent=u,S.style.color=g.raw;const _=document.getElementById("pol-ba-performance"),C=p.perf??50;_.textContent=Math.round(C),_.style.color=C>=55?"var(--dgreen)":C>=40?"var(--damber)":"var(--dred)";const T=document.getElementById("pol-ba-approval");T.textContent=h,T.style.color="var(--dtext-0)";const L=document.getElementById("pol-ba-headroom");L.textContent=(y>=0?"+":"")+y.toFixed(1),L.style.color=y>10?"var(--damber)":y>=0?"var(--dgreen)":"var(--dred)",document.getElementById("pol-ba-legend-bloc-dot").style.background=g.raw;const P=document.getElementById("pol-ba-legend-bloc-name");P.textContent=p.name,P.style.color=g.raw;const $=document.getElementById("pol-ba-axes");$.innerHTML=E.map(M=>{const q=n(M.dist),H=Math.min(M.pv,M.bv),O=M.dist;return`<div class="pol-ba-axis-row">
                <div class="pol-ba-axis-labels">
                    <span class="pol-ba-axis-label">${M.left}</span>
                    <span class="pol-ba-axis-str" style="color:${c(M.str)}">${d(M.str)}</span>
                    <span class="pol-ba-axis-label">${M.right}</span>
                </div>
                <div class="pol-ba-axis-track">
                    <div style="position:absolute;left:15%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:85%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:35%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:65%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(255,255,255,0.1)"></div>
                    ${M.dist>3?`<div class="pol-ba-axis-band" style="left:${H}%;width:${O}%;background:${q}12"></div>`:""}
                    <div class="pol-ba-axis-marker" style="left:${M.pv}%;background:${o};z-index:3">
                        <span style="color:var(--dbg-0)">${M.pv}</span>
                    </div>
                    <div class="pol-ba-axis-marker" style="left:${M.bv}%;background:${g.raw}">
                        <span style="color:var(--dbg-0)">${M.bv}</span>
                    </div>
                </div>
                <div class="pol-ba-axis-meta">
                    <span style="color:${q}">dist: ${M.dist}</span>
                    <span style="color:var(--dtext-3)">×${M.str} = <span style="color:${q};font-weight:700">${M.weighted.toFixed(0)}</span></span>
                </div>
            </div>`}).join("");const I=E.reduce((M,q)=>q.dist<M.dist?q:M,E[0]),z=E.reduce((M,q)=>q.weighted>M.weighted?q:M,E[0]);document.getElementById("pol-ba-summary").innerHTML=`<span style="color:var(--dgreen)">Closest: ${I.left}/${I.right}</span><span style="color:var(--dred)">Gap: ${z.left}/${z.right}</span>`;const D=document.getElementById("pol-ba-issues");D.innerHTML=(p.issues||[]).map(M=>`<span class="pol-ba-issue-tag">${M}</span>`).join(""),f.forEach(M=>{M.classList.toggle("active",M.getAttribute("data-bloc-id")===p.id),M.getAttribute("data-bloc-id")===p.id?M.style.borderLeftColor=g.raw:M.style.borderLeftColor="transparent"})}m(r[0]),w.addEventListener("click",()=>{const p=l.classList.toggle("open");x.classList.toggle("open",p)}),f.forEach(p=>{p.addEventListener("click",()=>{const g=p.getAttribute("data-bloc-id"),k=r.find(E=>E.id===g);k&&m(k),l.classList.remove("open"),x.classList.remove("open")})}),document.addEventListener("click",p=>{const g=document.getElementById("pol-ba-selector");g&&!g.contains(p.target)&&(l.classList.remove("open"),x.classList.remove("open"))})}function b(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}let J=null,Dt=null,It=null,gt=null,Ut=null,At=null,jt=null,Ft=null,Jt="minister",it=null,zt=null,Z=null,Wt=null,ee=!1,Vt=null,ae=null,Kt=null,re=!1,Zt=null,se=null,V=null,Et=null,le=null,ht=!1,ve=null;const ye=[{id:"rally",name:"Hold a Rally",ap:ra.AP_COST,color:"#f97316",icon:"★",affects:"Visibility",desc:"Rally your supporters in a public show of strength. Outcomes range from rousing success to embarrassing gaffe — results are random and generate headlines your rivals can see."},{id:"attack",name:"Campaign Attack",ap:Fe.AP_COST,color:"#ef4444",icon:"✦",affects:"Approval",desc:"Target a rival party's record or leadership. More effective when backed by evidence. Risky — a poorly aimed attack can damage your own credibility."},{id:"promise",name:"Make a Promise",ap:j.AP_COST,color:"#a78bfa",icon:"◆",affects:"Approval",desc:"Publicly commit to improving a national stat or resolving a crisis. Gives an immediate approval boost with affected voter blocs, but you'll face mounting penalties each tick if you fail to deliver."},{id:"take_stance",name:"Take a Stance",ap:ut.AP_COST,color:"#38bdf8",icon:"⚑",affects:"Appeal",desc:"Declare your party's official position on a national issue. Builds platform appeal with aligned voters. Stances lose strength each tick — reinforce them before they fade, or let them expire."},{id:"poll_now",name:"Poll Now",ap:Re.AP_COST,color:"#22d3ee",icon:"📊",affects:"Informational",desc:"Commission a snapshot of your current electoral standing. See your vote share, pillar scores, and limiting factors frozen at this moment — useful for tracking the impact of your actions."},{id:"fund_think_tank",name:"Fund Think Tank",ap:at.THINK_TANK.AP_COST,color:"#14b8a6",icon:"🏛",affects:"Ideology",desc:"Fund an ideological think tank to gradually shift the electorate's beliefs on a chosen axis. Expensive long-term investment: 8 AP upfront + 1 AP/tick for 50 ticks, but reshapes the political landscape."},{id:"media_campaign",name:"Media Campaign",ap:at.MEDIA_CAMPAIGN.AP_COST,color:"#8b5cf6",icon:"📡",affects:"Ideology",desc:"Launch a media blitz to polarize or consolidate public opinion on a chosen axis. Shifts how spread out voters are ideologically, then boosts your party's visibility."},{id:"grassroots_movement",name:"Grassroots Movement",ap:at.GRASSROOTS.AP_COST,color:"#10b981",icon:"🌱",affects:"Ideology",desc:"Build a slow-burning grassroots campaign to shift public ideology over time. Cheap to start but runs for 100 ticks. Gradually drifts opinion and builds party visibility."},{id:"pivot",name:"Ideological Pivot",ap:1,color:"#f59e0b",icon:"⟳",affects:"Alignment",desc:"Shift your party's position on a chosen ideological axis. Costs escalate with each pivot (+1 AP per use, resets after 20 ticks). Reversing your current lean costs extra AP and credibility. Holding steady for 20+ ticks earns a conviction bonus."}];let de={},Le={},fe=[],Y=null,et=null,ie=null,$t=null,wt=null,kt=null,oe="moderate",Qt=null;function os(){Dt=null,It=null,gt=null,Ut=null,At=null,Ft=null,Jt="minister",it=null,Vt=null,ae=null,Kt=null,re=!1,Y=null,et=null,$t=null,wt=null,kt=null,oe="moderate"}function Qe(){return J==="rally"?!0:J==="attack"?!!Dt&&!!It:J==="promise"?gt==="stat"?!!Ut:gt==="crisis"?!!At:!1:J==="protest"?!!it:J==="take_stance"?!!$t&&!!wt&&!!kt&&!!oe:J==="poll_now"?!0:J==="fund_think_tank"||J==="media_campaign"||J==="grassroots_movement"||J==="pivot"?!!Y&&!!et:!1}function Ie(){if(J==="protest"){const e=V,a=Et?.current_tick||0,r=Ke(e?.protest_use_count||0,e?.protest_last_use_tick,a);return Je(r)}if(J==="pivot"){const e=V,a=Et?.current_tick||0;let r=e?.pivot_count||0;const i=e?.pivot_last_tick||0;a-i>=xt.ESCALATION_RESET&&(r=0);let o=xt.BASE_AP+r;if(Y&&et&&ie){const s=Number(ie[Y]??0),v=et==="right"?1:-1;(s>0&&v<0||s<0&&v>0)&&(o+=xt.REVERSE_AP_EXTRA)}return o}const t=ye.find(e=>e.id===J);return t?t.id==="attack"?ue(se?.polarization):t.ap:0}async function pe(t,e,a,r){se=t,V=e,Et=a,le=r;const i=document.getElementById("actions-container");if(!i)return;const o=a?.current_tick||0,s=e,v=t,{data:n}=await R.from("factions").select("action_points, party_funds").eq("id",s.id).single();n&&(s.action_points=n.action_points,s.party_funds=n.party_funds);const d=s.action_points??0,c=await je(R,v.id),w=new Set(c?.party_ids||[]);ht=s.id===v.ruling_faction_id||w.has(s.id);const{data:l}=await R.from("faction_ideology").select("*").eq("faction_id",s.id).single();ie=l;const x=(r||[]).filter(A=>A.id!==s.id),{data:f}=await R.from("issue_state").select("issue_id, salience").eq("nation_id",v.id).order("salience",{ascending:!1}).limit(7),m=new Set;for(const A of f||[]){const u=Pt[A.issue_id];if(u)for(const h of u.stats)m.add(h)}ve=m;let p={},g=2;if(!ht){const{data:A}=await R.from("protest_log").select("id, status, tier, tick_called, tick_resolved, crisis_started_tick, crisis_duration, demand_label, turnout_score, effects_applied, grievance_type, grievance_data").eq("faction_id",s.id).in("status",["resolving","crisis_active"]).limit(1).maybeSingle();Z=A;const u=Ke(s.protest_use_count||0,s.protest_last_use_tick,o);if(g=Je(u),p=ka(s,o,!0,A),A)zt=A.status==="resolving"?"resolving":"active";else if(s.protest_locked_by)zt="locked";else if(s.protest_cooldown_until_tick&&s.protest_cooldown_until_tick>o)zt="cooldown";else{const{data:h}=await R.from("protest_log").select("id, tier, turnout_score, effects_applied, tick_resolved, roll_breakdown, condition_score").eq("faction_id",s.id).eq("status","resolved").gte("tick_resolved",o-1).order("tick_resolved",{ascending:!1}).limit(1).maybeSingle();h&&h.tick_resolved===o?(zt="result",Z=h):zt=null}}if(Wt=null,ee=!1,!ht&&!Z){const{data:A}=await R.from("protest_log").select("id, faction_id, status, tier, demand_label, grievance_type").eq("nation_id",v.id).eq("status","resolving").neq("faction_id",s.id).limit(1).maybeSingle();if(A){Wt=A;const{data:u}=await R.from("protest_endorsements").select("id").eq("protest_id",A.id).eq("faction_id",s.id).maybeSingle();ee=!!u}}if(Zt=null,ht){const{data:A}=await R.from("protest_log").select("id, tier, status, public_address_last_tick, tier7_demand, crisis_started_tick, crisis_duration").eq("nation_id",v.id).eq("status","crisis_active").order("crisis_started_tick",{ascending:!1}).limit(1).maybeSingle();Zt=A}const{data:k}=await R.from("campaign_actions").select("action_type, tick_performed").eq("party_id",s.id).gte("tick_performed",o-10).order("tick_performed",{ascending:!1}),{data:E}=await R.from("ideology_shift_actions").select("id, action_type, target_axis, target_direction, drift_rate, created_tick, status").eq("faction_id",s.id).eq("status","active");de={},Le={};const N={fund_think_tank:at.THINK_TANK.COOLDOWN_WINDOW,media_campaign:at.MEDIA_CAMPAIGN.COOLDOWN_WINDOW,grassroots_movement:at.GRASSROOTS.COOLDOWN_WINDOW,take_stance:ut.COOLDOWN_WINDOW,poll_now:Re.COOLDOWN_WINDOW};for(const A of k||[]){const u=A.action_type,h=N[A.action_type];if(h){const y=A.tick_performed+h-o;y>0&&(!de[u]||y>de[u])&&(de[u]=y)}A.tick_performed===o&&(Le[u]=!0)}fe=E||[],Oe(i,s,v,d,x,l,o,p,g)}function Oe(t,e,a,r,i,o,s,v,n){const d=[...ye];ht||d.push({id:"protest",name:"Organise a Protest",ap:n||2,color:"#d9534f",icon:"!",affects:"Approval",desc:"Mobilize citizens against the government. Turnout is probabilistic — a strong showing forces a crisis, but a fizzle hands the ruling party a free headline. Choose your moment carefully."});const c=d.find(f=>f.id===J);let w="";if(e.pyrrhic_victory_until_tick&&e.pyrrhic_victory_until_tick>s){const f=e.pyrrhic_victory_until_tick-s;w+=`<div class="protest-pyrrhic-banner">
            <span style="font-weight:700">PYRRHIC VICTORY</span> — ${f} tick${f!==1?"s":""} remaining. AP income reduced by 2/tick.
        </div>`}if(ht&&Zt){const f=Zt,m=f.public_address_last_tick!=null?Math.max(0,Gt.PUBLIC_ADDRESS_COOLDOWN-(s-f.public_address_last_tick)):0,p=r>=Gt.PUBLIC_ADDRESS_AP&&m===0,g=m>0?" ca-item--cooldown":"",k=m>0?`${m} TICK CD`:`${Gt.PUBLIC_ADDRESS_AP} AP`;w+=`<div class="ca-item ca-item--public-address${g}${p?"":" disabled"}" data-action-id="public_address" style="${p?"":"opacity:0.5;"}">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#5b9bd5">&#9788;</span>
                    <span class="ca-item-name">Public Address</span>
                </div>
                <span class="ca-item-ap">${k}</span>
            </div>
            <div class="ca-item-desc" style="font-size:9px;color:#4a4840;">Issue a public statement calling for calm. Reduces civil unrest buildup this tick.</div>
        </div>`}for(const f of d){const m=J===f.id;if(f.id==="protest"){w+=bs(f,m,r,e,s);continue}const g=f.id==="attack"?ue(a?.polarization):f.ap,k=f.id==="promise"?"make_promise":f.id,E=de[k]||0,N=E>0,A=!!Le[k],u=fe.some($=>$.action_type===f.id.replace("fund_","")),h=r>=g&&!N&&!A,y=m?f.color:h?f.color+"55":"var(--dtext-3)",S=m?`background:${f.color}08;`:"",_=m?`border-color:${f.color}33;`:"",C=m?f.color:"var(--dtext-0)",T=f.affects==="Visibility"||f.affects==="Enthusiasm"?"#f97316":f.affects==="Approval"?"#4ade80":f.affects==="Appeal"?"#38bdf8":f.affects==="Ideology"?"#a78bfa":"#6b7280",L=A?`${f.name} already used this turn`:"",P=A?'<span class="ca-used-badge">USED</span>':N?`<span class="ca-cd-badge">${E} tick${E!==1?"s":""} CD</span>`:u?'<span class="ca-active-badge">ACTIVE</span>':"";w+=`<div class="ca-item${m?" selected":""}${h?"":" disabled"}${N?" ca-item--cooldown":""}${A?" ca-item--used":""}" data-action-id="${f.id}" style="border-left-color:${y};${S}${_}${h?"":"opacity:0.35;"}">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:${f.color}">${f.icon}</span>
                    <span class="ca-item-name" style="color:${C}">${b(f.name)}</span>
                    ${P}
                </div>
                <span class="ca-item-ap">${A?"USED":N?`${E} TICK CD`:`${g} AP`}</span>
            </div>
            <div class="ca-item-desc">${b(f.desc)}</div>
            ${A?`<div class="ca-item-used-msg">${b(L)}</div>`:`<div class="ca-item-affects" style="color:${T}">This action affects ${f.affects}</div>`}
        </div>`}let l="";if(!c)l='<div class="ca-panel"><div class="ca-panel-empty"><div class="ca-panel-empty-text">Choose an action</div></div></div>';else{if(l=`<div class="ca-panel" style="border-color:${c.color}22">`,jt)l+=ws(jt);else if(c.id==="protest"&&zt==="result"&&Z)l+=ks(Z);else if(c.id==="protest"&&zt==="resolving")l+=Es();else{l+=ls(c,i,o,a);const f=Ie(),m=Qe(),p=r>=f&&m;l+=`<div class="ca-confirm-row"><div class="ca-confirm-btn${p?"":" disabled"}" style="background:${p?c.color:"var(--dtext-3)"}" id="ca-confirm-btn">Confirm — ${f} AP</div></div>`}l+="</div>"}let x="";if(fe.length>0){const f={think_tank:at.THINK_TANK.DURATION,media_campaign:at.MEDIA_CAMPAIGN.DURATION+at.MEDIA_CAMPAIGN.VISIBILITY_TICKS,grassroots_movement:at.GRASSROOTS.DURATION},m={think_tank:"Think Tank",media_campaign:"Media Campaign",grassroots_movement:"Grassroots Movement"},p={};for(const k of ct)p[k.key]=k;x=`<div class="ca-active-actions" style="margin-top:16px;">
            <div class="pe-header"><span class="pol-mod-title">Active Actions</span></div>
            <table class="pol-el-table" style="margin-top:4px"><thead><tr><th>Action</th><th>Activated</th><th>Effect</th><th style="text-align:right">Ticks Left</th></tr></thead><tbody>${fe.map(k=>{const E=f[k.action_type]||50,N=s-k.created_tick,A=Math.max(0,E-N),u=p[k.target_axis],h=u?`${u.leftLabel}–${u.rightLabel}`:"",y=k.target_direction==="left"?u?.leftLabel:k.target_direction==="right"?u?.rightLabel:k.target_direction==="expand"?`Expand ${h}`:k.target_direction==="narrow"?`Narrow ${h}`:k.target_direction||"?",S=k.drift_rate?`+${k.drift_rate}/tick ${y}`:y,_=st(k.created_tick);return`<tr>
                <td style="font-weight:600">${m[k.action_type]||k.action_type}</td>
                <td>${_}</td>
                <td>${S}</td>
                <td style="text-align:right">${A}</td>
            </tr>`}).join("")}</tbody></table>
        </div>`}t.innerHTML=`<div class="ca-wrap"><div class="ca-list">${w}</div>${l}</div>
    ${x}
    <div class="ca-portfolios" style="margin-top:16px;">
        <div id="ca-promises-container"><div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px">Loading promises...</div></div>
    </div>
    <div class="pe-container">
        <div class="pe-header"><span class="pol-mod-title">Party Events</span></div>
        <div id="party-events-feed" class="pe-feed"><div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px">Loading events...</div></div>
    </div>
    <div id="ca-stance-portfolio-container" style="margin-top:16px;"></div>`,ns(e,a,s),he(document.getElementById("ca-stance-portfolio-container"),e,a),Ba(a.id,e.id),t.querySelectorAll(".ca-item").forEach(f=>{f.addEventListener("click",async()=>{const m=f.dataset.actionId;if(m==="public_address"&&Zt){if(f.classList.contains("disabled")||f.dataset.executing)return;f.dataset.executing="true",f.style.opacity="0.4";try{const k=await Ea(R,e.id,a.id,Zt.id,s);if(k.success){e.action_points=k.newAp;const E=await ne(e.id);E!==void 0&&(e.action_points=E),await pe(a,e,Et,le)}else pt(k.error||"Public Address failed."),f.style.opacity="",delete f.dataset.executing}catch(k){pt("Error: "+(k.message||"Unknown")),f.style.opacity="",delete f.dataset.executing}return}const p=ye.find(k=>k.id===m),g=p?.id==="attack"?ue(a?.polarization):p?.ap;p&&r<g||(J===m?J=null:J=m,os(),jt=null,Oe(t,e,a,r,i,o,s,v,n))})}),Ss(t,e,a,r,i,o,s,v,n)}async function ns(t,e,a){const r=document.getElementById("ca-promises-container");if(!r)return;const{data:i,error:o}=await R.from("fundraiser_promises").select("*").eq("party_id",t.id).eq("nation_id",e.id).eq("status","active");if(o){r.innerHTML='<div style="color:var(--dred);font-family:var(--dfont-mono);font-size:11px;padding:8px">Failed to load promises.</div>';return}const s=i||[];let v="";if(s.length===0)v='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px 0">No active promises.</div>';else for(const n of s){const d=Math.max(0,(n.tick_deadline||0)-a),c=d<=3,l=d<=1?"var(--dred)":c?"var(--damber)":"var(--dgreen)",x=n.demand_type==="crisis_resolution",f=n.demand_text||(x?"Resolve crisis":"Improve stat"),m=x?"✓":n.conditions?.direction==="above"?"↑":"↓";v+=`
            <div style="padding:6px 0;border-bottom:1px solid var(--dborder-1)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <span style="font-family:var(--dfont-mono);font-size:12px;color:var(--dtext-0)">${m}</span>
                        <span style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0);margin-left:4px">${b(f)}</span>
                    </div>
                    <span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${l}">${d} tick${d!==1?"s":""} left</span>
                </div>
            </div>`}r.innerHTML=`
    <div style="border:1px solid var(--dborder-1);border-radius:6px;padding:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-family:var(--dfont-ui);font-size:13px;font-weight:700;color:var(--dtext-0);text-transform:uppercase;letter-spacing:0.5px">Active Promises</span>
            <span style="font-family:var(--dfont-mono);font-size:11px;color:var(--dtext-2)">${s.length} / ${j.MAX_ACTIVE_PROMISES}</span>
        </div>
        ${v}
    </div>`}function ls(t,e,a,r,i,o){return t.id==="rally"?rs():t.id==="attack"?us(e):t.id==="promise"?gs(r):t.id==="protest"?xs(r):t.id==="take_stance"?ds():t.id==="poll_now"?cs():t.id==="fund_think_tank"?ps():t.id==="media_campaign"?vs():t.id==="grassroots_movement"?fs():t.id==="pivot"?ms():""}function rs(){return'<div class="ca-info-box">Hold a rally to energize your base. Random outcome — can boost or backfire.</div>'}function ds(t){let e=`<div class="ca-info-box">Declare your party's position on an issue. Stances build platform appeal but decay over time.</div>`;e+='<div class="ca-subtitle" style="margin-top:10px">Select Issue</div><div style="display:flex;flex-direction:column;gap:3px">';const a=Object.entries(Pt),r=Qt?a.sort((i,o)=>{const s=Qt.find(n=>n.issue_id===i[0])?.salience??0;return(Qt.find(n=>n.issue_id===o[0])?.salience??0)-s}):a;for(const[i,o]of r){const s=$t===i,v=Qt?.find(d=>d.issue_id===i),n=v?Number(v.salience).toFixed(0):"—";e+=`<div class="ca-option-chip${s?" selected":""}" data-stance-issue-id="${i}" style="padding:6px 10px;display:flex;justify-content:space-between;align-items:center;${s?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
            <span style="font-weight:600">${b(o.label)}</span>
            <span style="font-size:10px;color:var(--dtext-3)">Salience: ${n}</span>
        </div>`}if(e+="</div>",$t){const i=Pt[$t];if(i&&i.axes.length>0){e+='<div class="ca-subtitle" style="margin-top:12px">Choose Axis</div><div style="display:flex;flex-direction:column;gap:3px">';for(const o of i.axes){const s=ct.find(n=>n.key===o);if(!s)continue;const v=wt===o;e+=`<div class="ca-option-chip${v?" selected":""}" data-stance-axis-key="${o}" style="padding:6px 10px;${v?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                    <span style="color:${s.leftColor}">${s.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="color:${s.rightColor}">${s.rightLabel}</span>
                </div>`}e+="</div>"}}if(wt){const i=ct.find(o=>o.key===wt);if(i){e+='<div class="ca-subtitle" style="margin-top:12px">Choose Side</div><div style="display:flex;gap:8px">';const o=kt==="left",s=kt==="right";e+=`<div class="ca-option-chip${o?" selected":""}" data-stance-side-val="left" style="flex:1;text-align:center;padding:8px;${o?`border-color:${i.leftColor};color:${i.leftColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${i.leftLabel}</span></div>`,e+=`<div class="ca-option-chip${s?" selected":""}" data-stance-side-val="right" style="flex:1;text-align:center;padding:8px;${s?`border-color:${i.rightColor};color:${i.rightColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${i.rightLabel}</span></div>`,e+="</div>"}}if(kt){e+='<div class="ca-subtitle" style="margin-top:12px">Intensity</div><div style="display:flex;gap:6px">';for(const[i,o]of Object.entries(ut.INTENSITY)){const s=oe===i;e+=`<div class="ca-option-chip${s?" selected":""}" data-stance-int-val="${i}" style="flex:1;text-align:center;padding:6px 4px;${s?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                <div style="font-weight:600;font-size:11px">${i}</div>
                <div style="font-size:9px;color:var(--dtext-3);margin-top:2px">Str ${o.strength} · -${o.decay_rate}/t</div>
            </div>`}e+="</div>"}return e}function cs(){return`<div class="ca-info-box">Take a snapshot of your current electorate standing. Your polled pillars, vote share, and limiters will be frozen so you can compare before/after future actions.</div>
    <div class="ca-info-box" style="margin-top:8px;color:var(--dtext-3);font-size:0.8em">Cooldown: ${Re.COOLDOWN_WINDOW} ticks between polls.</div>`}function ps(){let t=`<div class="ca-info-box">Launch a think tank to gradually drift the electorate's ideological mean on a chosen axis. ${at.THINK_TANK.AP_COST} AP upfront + ${at.THINK_TANK.TICK_AP_COST} AP/tick for ${at.THINK_TANK.DURATION} ticks. Drift: 1d3 (0.1–0.3) per tick.</div>`;if(t+=xe(),Y){const e=ct.find(a=>a.key===Y);e&&(t+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',t+=_e(e.leftLabel,e.rightLabel,"left","right"))}return t}function vs(){const t=at.MEDIA_CAMPAIGN;let e=`<div class="ca-info-box">Launch a media campaign to expand or narrow electorate ideological variance on a chosen axis. Phase 1: 1d5 (0.1–0.5) variance shift/tick for ${t.DURATION} ticks. Phase 2: 1d3 (1–3) visibility/tick for ${t.VISIBILITY_TICKS} ticks.</div>`;return e+=xe(),Y&&(e+='<div class="ca-subtitle" style="margin-top:12px">Variance direction</div>',e+=_e("Expand (polarize)","Narrow (centralize)","expand","narrow")),e}function fs(){const t=at.GRASSROOTS;let e=`<div class="ca-info-box">Launch a grassroots movement to slowly shift the electorate on a chosen axis. ${t.AP_COST} AP upfront + ${t.TICK_AP_COST} AP/tick for ${t.DURATION} ticks. Drift: 1d2 (${t.DRIFT_MIN}–${t.DRIFT_MAX})/tick. +1 visibility every ${t.VISIBILITY_INTERVAL} ticks.</div>`;if(e+=xe(),Y){const a=ct.find(r=>r.key===Y);a&&(e+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',e+=_e(a.leftLabel,a.rightLabel,"left","right"))}return e}function ms(t){const e=V,a=Et?.current_tick||0;let r=e?.pivot_count||0;const i=e?.pivot_last_tick||0;a-i>=xt.ESCALATION_RESET&&(r=0);const o=Math.max(0,xt.COOLDOWN-(a-i)),s=i>0&&o>0;let v=`<div class="ca-info-box">Shift your party's ideological position. Each pivot costs +1 AP more than the last (resets after ${xt.ESCALATION_RESET} ticks of no pivots). Reversing direction costs extra AP and credibility. Hold steady 20+ ticks for a conviction bonus.</div>`;if(s&&(v+=`<div style="font-family:var(--dfont-mono);font-size:11px;color:var(--damber);padding:6px 0">Cooldown: ${o} tick${o!==1?"s":""} remaining</div>`),v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);padding:4px 0">Pivots this cycle: ${r} · Next cost: ${xt.BASE_AP+r} AP${r>0?" (escalated)":""}</div>`,v+=xe(),Y){const n=ct.find(d=>d.key===Y);if(n){const d=ie?Number(ie[Y]??0):0,c=d>0?`+${d} (${n.rightLabel})`:d<0?`${d} (${n.leftLabel})`:"0 (Center)";if(v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);padding:4px 0;margin-top:4px">Current position: <span style="font-weight:700">${c}</span></div>`,v+='<div class="ca-subtitle" style="margin-top:8px">Pivot direction</div>',v+=_e(n.leftLabel,n.rightLabel,"left","right"),et){const w=et==="right"?1:-1;if(d>0&&w<0||d<0&&w>0){const x=xt.REVERSE_CRED_BASE+Math.abs(d)*xt.REVERSE_CRED_SCALE;v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);padding:6px 0;border-top:1px solid var(--dborder-1);margin-top:8px">⚠ Reversal: +${xt.REVERSE_AP_EXTRA} AP extra, −${x.toFixed(1)} credibility</div>`}}}}return v}function xe(){let t='<div class="ca-subtitle" style="margin-top:10px">Target axis</div><div style="display:flex;flex-direction:column;gap:4px">';for(const e of ct){const a=Y===e.key;t+=`<div class="ca-option-chip${a?" selected":""}" data-axis-key="${e.key}" style="padding:6px 10px;${a?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">
            <span style="font-weight:600">${e.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="font-weight:600">${e.rightLabel}</span>
            <span style="font-size:0.75em;color:var(--dtext-3);margin-left:6px">${e.description}</span>
        </div>`}return t+="</div>",t}function _e(t,e,a,r){let i='<div style="display:flex;gap:8px">';const o=et===a,s=et===r;return i+=`<div class="ca-option-chip${o?" selected":""}" data-direction-value="${a}" style="flex:1;text-align:center;padding:8px;${o?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${t}</div>`,i+=`<div class="ca-option-chip${s?" selected":""}" data-direction-value="${r}" style="flex:1;text-align:center;padding:8px;${s?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${e}</div>`,i+="</div>",i}function us(t){const e=se?.polarization||0,a=ue(e);let i=`<div style="color:#ef4444;font-size:0.85em;margin-bottom:4px">Using this will increase Polarization by 0.25.${a>Fe.AP_COST?` Cost scaled to ${a} AP (polarization ${Math.round(e)}).`:""}</div><div class="ca-subtitle">Select target party</div>`;for(const o of t){const s=Dt===o.id;i+=`<div class="ca-rival-card${s?" selected":""}" data-rival-id="${o.id}" style="border-left-color:${s?"#ef4444":o.party_color||"#888"};${s?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
            <span class="ca-rival-name" style="color:${s?"#ef4444":"var(--dtext-0)"}">${b(o.faction_name)}</span>
        </div>`}if(Dt&&Ft){i+='<div class="ca-subtitle" style="margin-top:12px">Choose attack vector</div>';for(const o of Ft){const s=It===o.id;o.strength==="strong"||o.strength;const v=o.evidence_required&&o.strength==="weak",n=o.strength==="strong"?"#4ade80":o.strength==="moderate"?"#facc15":"#ef4444";i+=`<div class="ca-vector-card${s?" selected":""}${v?" disabled":""}" data-vector-id="${o.id}" style="border-left-color:${s?"#ef4444":n};${s?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="ca-vector-name">${b(o.name)}</span>
                    <span class="ca-vector-strength" style="color:${n}">${o.strength.toUpperCase()}</span>
                </div>
                <div class="ca-vector-desc">${b(o.description)}</div>
            </div>`}if(It){const o=Ft.find(s=>s.id===It);if(o){const s=da(o.strength),v=Math.max(...Object.values(s));i+='<div style="margin-top:10px">';const n={devastating:"#4ade80",effective:"#22d3ee",glancing:"#facc15",backfire:"#f97316",mutual:"#ef4444"};for(const d of ca){const c=s[d.id]||0,w=v>0?c/v*100:0,l=n[d.id]||"#888";i+=`<div class="ca-outcome-bar">
                        <span class="ca-outcome-name">${b(d.name)}</span>
                        <div class="ca-outcome-track"><div class="ca-outcome-fill" style="width:${w}%;background:${l}"></div></div>
                        <span class="ca-outcome-pct" style="color:${l}">${c}%</span>
                    </div>`}i+="</div>"}}}else Dt&&!Ft&&(i+='<div class="ca-info-box" style="margin-top:12px">Loading evidence...</div>');return i}function gs(t){let e='<div class="ca-subtitle">What do you promise?</div>';const a=[{id:"stat",name:"Improve a Stat",desc:"Promise to move a national stat in the right direction.",color:"#a78bfa"},{id:"crisis",name:"Resolve a Crisis",desc:"Promise to resolve an active national crisis.",color:"#ef4444"}];e+='<div style="display:flex;gap:8px;margin-bottom:12px">';for(const r of a){const i=gt===r.id;e+=`<div style="flex:1;padding:8px 12px;border:1px solid ${i?r.color+"44":"var(--dborder-1)"};border-left:3px solid ${i?r.color:"transparent"};border-radius:4px;cursor:pointer;transition:all 0.1s;${i?`background:${r.color}08`:""}" data-promise-type="${r.id}">
            <div style="font-family:var(--dfont-ui);font-size:12px;font-weight:700;color:${i?r.color:"var(--dtext-0)"}">${r.name}</div>
            <div style="font-family:var(--dfont-ui);font-size:10px;color:var(--dtext-3);margin-top:2px">${r.desc}</div>
        </div>`}if(e+="</div>",gt==="stat"){const r=ht?j.STAT_DELTA_GOVERNING:j.STAT_DELTA,i=pa(t,ht),o=ve&&ve.size>0?i.filter(s=>ve.has(s.statKey)):i;if(o.length===0)e+='<div class="ca-info-box">No stats available to promise on — they may all be at their limit.</div>';else{ht&&(e+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-bottom:8px;padding:4px 8px;border:1px solid rgba(249,115,22,0.2);border-radius:4px;background:rgba(249,115,22,0.04)">⚠ Governing factions must promise ±${r} (you have legislative power)</div>`),e+='<div class="ca-bloc-list">';for(const s of o){const v=Ut===s.statKey,n=s.direction==="higher_is_better"?Math.min(100,Math.round(s.value+r)):Math.max(0,Math.round(s.value-r)),d=s.promiseDirection==="increase"?"↑":"↓",c=s.promiseDirection==="increase"?"#4ade80":"#22d3ee";e+=`<div class="ca-stat-card${v?" selected":""}" data-stat-key="${s.statKey}" style="border-left-color:${v?"#a78bfa":c};${v?"border-color:rgba(167,139,250,0.2);background:rgba(167,139,250,0.03)":""}">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span class="ca-stat-name">${b(s.label)}</span>
                        <div style="display:flex;align-items:center;gap:8px">
                            <span class="ca-stat-val" style="color:var(--dtext-2)">${Math.round(s.value)}</span>
                            <span style="color:${c}">${d}</span>
                            <span class="ca-stat-val" style="color:${c}">${n}</span>
                        </div>
                    </div>
                    ${v?`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:4px">Deadline: ${j.DEADLINE_BASE+1}–${j.DEADLINE_BASE+j.DEADLINE_DICE} ticks · Immediate <span style="color:#4ade80">+${j.APPROVAL_ON_PROMISE} approval</span></div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:3px;display:flex;gap:12px;flex-wrap:wrap">
                        <span style="color:#4ade80">If kept: +${j.KEPT_APPROVAL} approval, +${j.KEPT_CREDIBILITY} credibility</span>
                    </div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;display:flex;gap:12px;flex-wrap:wrap">
                        <span style="color:#ef4444">If broken: ${j.BROKEN_APPROVAL} approval, ${j.BROKEN_CREDIBILITY} credibility</span>
                    </div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;color:var(--dtext-3)">While unfulfilled & governing: <span style="color:#f97316">−${j.PENALTY_PER_TICK_MIN} to −${j.PENALTY_PER_TICK_MAX} approval/tick</span></div>`:""}
                </div>`}e+="</div>"}}return gt==="crisis"&&(e+='<div id="ca-crisis-list"><div class="ca-info-box">Loading crises...</div></div>',e+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:8px;padding:0 2px">
            Deadline: ${j.DEADLINE_BASE+1}–${j.DEADLINE_BASE+j.DEADLINE_DICE} ticks · Immediate <span style="color:#4ade80">+${j.APPROVAL_ON_PROMISE} approval</span>
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:3px;padding:0 2px">
            <span style="color:#4ade80">If kept: +${j.KEPT_APPROVAL} approval, +${j.KEPT_CREDIBILITY} credibility</span>
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;padding:0 2px">
            <span style="color:#ef4444">If broken: ${j.BROKEN_APPROVAL} approval, ${j.BROKEN_CREDIBILITY} credibility</span>
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;padding:0 2px;color:var(--dtext-3)">While unfulfilled & governing: <span style="color:#f97316">−${j.PENALTY_PER_TICK_MIN} to −${j.PENALTY_PER_TICK_MAX} approval/tick</span></div>`),e}async function ys(t,e,a){if(!Vt){const{data:r}=await R.from("ministries").select("ministry_key, minister_first_name, minister_last_name, minister_approval, party_id").eq("nation_id",t.id).not("party_id","is",null).order("minister_approval",{ascending:!0});Vt=r||[]}if(!ae){const{data:r}=await R.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",t.id);ae=(r||[]).map(i=>({...i,duration:a-(i.started_at_tick||0)}))}if(!Kt){const{data:r}=await R.from("stat_history").select("stat_name, value, tick").eq("nation_id",t.id).gte("tick",a-6).order("tick",{ascending:!0}),i={};for(const n of r||[])i[n.stat_name]||(i[n.stat_name]=[]),i[n.stat_name].push({tick:n.tick,value:n.value});const o=[];for(const[n,d]of Object.entries(i)){if(Ia(n))continue;const c=d.sort((p,g)=>p.tick-g.tick),w=t[n]??c[c.length-1]?.value??0;if(!(Xe(n)?w>=70:w<=30))continue;const x=c[0]?.value??w,f=w-x,m=Pa(w,x,n);o.push({key:n,current:w,sixTicksAgo:x,delta:f,failureScore:m,displayName:n.replace(/_/g," ").replace(/\b\w/g,p=>p.toUpperCase())})}o.sort((n,d)=>d.failureScore-n.failureScore);const{data:s}=await R.from("protest_log").select("tick_called").eq("nation_id",t.id).gte("tick_called",a-6),v=Ta((s||[]).map(n=>({tick:n.tick_called})),a);Kt={failingStats:o,_fatigueLevel:v}}}function bs(t,e,a,r,i){const o=zt,s=t.ap,v=a>=s;if(o==="resolving")return`<div class="ca-item ca-item--protest ca-item--resolving" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#c8a64e">!</span>
                    <span class="ca-item-name" style="color:#c8a64e">${b(t.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#c8a64e">RESOLVING...</span>
            </div>
        </div>`;if(o==="result"&&Z){const l=Z.tier;if(l>=3&&l<=5){const x=Ye(l).toUpperCase(),f=Z.roll_breakdown||{},m=f.endorsements||0,p=f.joint_bonus||0;return`<div class="ca-item ca-item--protest ca-item--result-${l}" data-action-id="protest">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:#5cb85c">!</span>
                        <span class="ca-item-name" style="color:#5cb85c">${b(t.name)}</span>
                    </div>
                    <span class="ca-item-ap" style="color:#5cb85c">TIER ${l} — ${x}</span>
                </div>
                ${m>0?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#a78bfa;margin-top:2px;padding:0 12px 4px">${m} party endorsement${m>1?"s":""} (+${p} bonus)</div>`:""}
            </div>`}}if(o==="active"&&Z){const l=(Z.crisis_started_tick??i)+(Z.crisis_duration||6)-i,x=Z.tier===6&&(r.action_points||0)>=Gt.CALL_OFF_AP,f=Z.tier===7;return`<div class="ca-item ca-item--protest ca-item--active" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${b(t.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">ACTIVE — TIER ${Z.tier}</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Your protest crisis is running. ${Z.demand_label?`Demand: ${b(Z.demand_label)}`:""}</div>
            <div class="protest-passive-status">Running — ${Math.max(0,l)} tick${l!==1?"s":""} remaining.</div>
            ${f?'<div class="protest-calloff-note">Tier 7 protests cannot be called off.</div>':`<div class="protest-calloff-btn${x?"":" disabled"}" onclick="window._protestCallOff()">Call Off Protest — ${Gt.CALL_OFF_AP} AP</div>`}
        </div>`}if(o==="locked")return`<div class="ca-item ca-item--protest ca-item--locked" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${b(t.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">LOCKED</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">A protest crisis is already underway, led by another party.</div>
        </div>`;if(o==="cooldown"){const l=(r.protest_cooldown_until_tick||0)-i;return`<div class="ca-item ca-item--protest ca-item--cooldown" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.3)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.3)">${b(t.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#4a4840">COOLDOWN ${Math.max(0,l)}</span>
            </div>
        </div>`}if(Wt&&!o){const l=!ee&&(r.action_points||0)>=1,x=ee?"ENDORSED":"ENDORSE — 1 AP";return`<div class="ca-item ca-item--protest ca-item--endorse" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#a78bfa">!</span>
                    <span class="ca-item-name" style="color:#a78bfa">${b(t.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#a78bfa">ENDORSEMENT</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Another opposition party has called a protest. You can endorse it to boost turnout (+15 per endorsement).</div>
            ${Wt.demand_label?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#f97316;padding:0 12px 4px">Demand: ${b(Wt.demand_label)}</div>`:""}
            <div class="protest-endorse-btn${l?"":" disabled"}" onclick="window._protestEndorse()">${x}</div>
        </div>`}return`<div class="ca-item ca-item--protest${e?" selected":""}${v?"":" disabled"}" data-action-id="protest" style="border-left-color:${e?"#d9534f":v?"rgba(217,83,79,0.55)":"var(--dtext-3)"};${e?"background:rgba(217,83,79,0.07);":""}${e?"border-color:rgba(217,83,79,0.2);":""}${v?"":"opacity:0.35;"}">
        <div class="ca-item-head">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="ca-item-icon" style="color:#d9534f">!</span>
                <span class="ca-item-name" style="color:${e?"#e06460":"var(--dtext-0)"}">${b(t.name)}</span>
            </div>
            <span class="ca-item-ap" style="color:#d9534f">${s} AP</span>
        </div>
        ${e?`<div class="ca-item-desc">${b(t.desc)}</div>`:""}
    </div>`}function xs(t,e){let a="";a+='<div class="protest-warning">Turnout is probabilistic — based on Civil Unrest, Happiness, Polarisation, and Political Violence. A fizzle hands the government a free headline. Choose your moment.</div>';const r=[{key:"civil_unrest",label:"CIVIL UNREST",value:t.civil_unrest||0},{key:"happiness",label:"HAPPINESS",value:t.happiness||50},{key:"polarization",label:"POLARISATION",value:t.polarization||0},{key:"political_violence",label:"POL VIOLENCE",value:t.political_violence||0}];a+='<div class="protest-stat-hints">';for(const n of r){const d=Sa(n.key,n.value);a+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">${n.label}</span>
            <span class="protest-stat-pill__value" style="color:${d}">${Math.round(n.value)}</span>
        </div>`}const i=Kt?._fatigueLevel||{label:"...",color:"#4a4840"};a+=`<div class="protest-stat-pill">
        <span class="protest-stat-pill__label">PROTEST FATIGUE</span>
        <span class="protest-stat-pill__value" style="color:${i.color}">${i.label}</span>
    </div>`;const o=(le||[]).filter(n=>!(n.id===V?.id||ht)).length;if(o>0){const n=o>=2?"#a78bfa":"#4a4840";a+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">ENDORSERS</span>
            <span class="protest-stat-pill__value" style="color:${n}">${o}</span>
        </div>`}a+="</div>";const s=[{id:"minister",label:"Minister"},{id:"activeCrisis",label:"Active Crisis"},{id:"statFailure",label:"Stat Failure"}];a+='<div class="protest-tabs">';for(const n of s)a+=`<div class="protest-tab${Jt===n.id?" active":""}" data-protest-tab="${n.id}">${n.label}</div>`;a+="</div>",a+='<div class="protest-target-list" id="protest-target-list">',Jt==="minister"?a+=_s():Jt==="activeCrisis"?a+=hs():Jt==="statFailure"&&(a+=$s()),a+="</div>";const v=it?.label||null;return a+='<div class="protest-confirm">',a+=`<div class="protest-confirm__note">${v?`Targeting: ${b(v)}`:"Select a target above"}</div>`,a+="</div>",a}function _s(){const t=Vt;if(!t)return'<div class="protest-empty">Loading ministers...</div>';if(t.length===0)return'<div class="protest-empty">No government ministers found.</div>';let e="";for(const a of t){const r=Math.round(a.minister_approval||50),i=r>50?"high":r>=35?"mid":"low",o=it?.id===a.ministry_key,s=JSON.stringify({id:a.ministry_key,type:"minister",label:`${a.minister_first_name||""} ${a.minister_last_name||""}`.trim()||a.ministry_key,demandLabel:`${(a.minister_first_name||"")+" "+(a.minister_last_name||"")} must resign.`.trim(),grievanceData:{ministryKey:a.ministry_key,approval:r,name:`${a.minister_first_name||""} ${a.minister_last_name||""}`.trim()}}).replace(/"/g,"&quot;");e+=`<div class="protest-target${o?" selected":""}" data-protest-target="${s}">
            <div>
                <div class="protest-target__name">${b(`${a.minister_first_name||""} ${a.minister_last_name||""}`.trim()||a.ministry_key)}</div>
                <div class="protest-target__meta">${b(a.ministry_key)}</div>
            </div>
            <span class="protest-target__value protest-target__value--${i}">${r}%</span>
        </div>`}return e}function hs(){const t=ae;if(!t)return'<div class="protest-empty">Loading active crises...</div>';if(t.length===0)return'<div class="protest-empty">No active crises in this nation.</div>';let e="";for(const a of t){const r=it?.id===a.id,i=a.crisis_templates?.name||"Unknown Crisis",o=a.crisis_templates?.description||"",s=a.duration||0,v=`The government must resolve the ${i} crisis.`,n=JSON.stringify({id:a.id,type:"activeCrisis",label:i,demandLabel:v,grievanceData:{crisisId:a.id,name:i,duration:s}}).replace(/"/g,"&quot;");e+=`<div class="protest-target${r?" selected":""}" data-protest-target="${n}">
            <div>
                <div class="protest-target__name">${b(i)}</div>
                <div class="protest-target__meta">${b(o?o.slice(0,80):"")}${s?" · "+s+"t active":""}</div>
            </div>
        </div>`}return e}function $s(t,e){const a=Kt?.failingStats;if(!a)return'<div class="protest-empty">Loading stats...</div>';if(a.length===0)return'<div class="protest-empty">No stats are bad enough to protest. Stats must be critically failing (≥70 for negative stats, ≤30 for positive stats).</div>';let r="";for(const i of a){const o=it?.id===i.key,s=Xe(i.key)?"&#9650;":"&#9660;",v=JSON.stringify({id:i.key,type:"statFailure",label:i.displayName,demandLabel:`The government must address ${i.displayName}.`,grievanceData:{statKey:i.key,failureScore:i.failureScore,current:i.current}}).replace(/"/g,"&quot;");r+=`<div class="protest-target${o?" selected":""}" data-protest-target="${v}">
            <div>
                <div class="protest-target__name">${b(i.displayName)}</div>
                <div class="protest-target__meta">${Math.round(i.current)} <span class="protest-target__delta" style="color:#d9534f">${s} ${Math.abs(i.delta).toFixed(1)}</span></div>
            </div>
            <span class="protest-target__value protest-target__value--low">${i.failureScore.toFixed(1)}</span>
        </div>`}return r}function ws(t){if(!t)return"";const e=!t.error&&t.success,a=e?"#4ade80":"#ef4444";let r=`<div class="ca-result-box" style="border-color:${a}33">`;if(r+=`<div class="ca-result-header" style="background:${a}08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:${a}">${b(t.headline||(e?"Action completed":"Action failed"))}</span>
        <span class="ca-result-dismiss" id="ca-dismiss-result">Dismiss</span>
    </div>`,r+='<div class="ca-result-body">',t.effects&&t.effects.length>0)for(const i of t.effects){const o=i.bloc||i.label||i.stat||"",s=i.value??i.delta??0,v=s>=0?"#4ade80":"#ef4444";r+=`<div class="ca-result-row">
                <span class="ca-result-label">${b(o)}</span>
                <span class="ca-result-val" style="color:${v}">${s>=0?"+":""}${s}</span>
            </div>`}if(t.blocEffects&&t.blocEffects.length>0)for(const i of t.blocEffects)r+=`<div class="ca-result-row">
                <span class="ca-result-label">${b(i.blocName)}</span>
                <span class="ca-result-val" style="color:#4ade80">+${i.delta}</span>
            </div>`;return t.outcomeName&&(r+=`<div class="ca-result-row">
            <span class="ca-result-label">Outcome</span>
            <span class="ca-result-val" style="color:${a}">${b(t.outcomeName)}</span>
        </div>`),t.demandText&&(r+=`<div class="ca-result-row">
            <span class="ca-result-label">Promise</span>
            <span class="ca-result-val" style="color:#a78bfa">${b(t.demandText)}</span>
        </div>`,t.conditions?.is_governing&&(r+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-top:2px">Governing target: ±${t.conditions.delta} (higher bar)</div>`)),t.deadlineTicks&&(r+=`<div class="ca-result-row">
            <span class="ca-result-label">Deadline</span>
            <span class="ca-result-val" style="color:var(--dtext-2)">${t.deadlineTicks} ticks</span>
        </div>`),t.promiseType&&(r+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Consequences</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#4ade80">Kept: +${j.KEPT_APPROVAL} approval, +${j.KEPT_CREDIBILITY} credibility</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#ef4444;margin-top:2px">Broken: ${j.BROKEN_APPROVAL} approval, ${j.BROKEN_CREDIBILITY} credibility</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-top:2px">While unfulfilled: −${j.PENALTY_PER_TICK_MIN} to −${j.PENALTY_PER_TICK_MAX} approval/tick</div>
        </div>`),r+="</div></div>",r}function ks(t){const e=t.tier||0,a=Ye(e).toUpperCase(),r=t.roll_breakdown||{},i=t.condition_score??t.turnout_score??0,o=r.endorsements||0,s=r.joint_bonus||0,v=t.effects_applied||[];let n='<div class="ca-result-box" style="border-color:#5cb85c33">';if(n+=`<div class="ca-result-header" style="background:#5cb85c08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#5cb85c">Protest Result — Tier ${e}</span>
    </div>`,n+='<div class="ca-result-body">',n+=`<div class="ca-result-row">
        <span class="ca-result-label">Outcome</span>
        <span class="ca-result-val" style="color:#5cb85c">${a}</span>
    </div>`,n+=`<div class="ca-result-row">
        <span class="ca-result-label">Condition Score</span>
        <span class="ca-result-val" style="color:var(--dtext-1)">${Math.round(i)}</span>
    </div>`,Object.keys(r).length>0){n+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Score Breakdown</div>`;const c=new Set(["endorsements","joint_bonus"]);for(const[w,l]of Object.entries(r)){if(c.has(w))continue;const x=w.replace(/_/g," ").replace(/\b\w/g,p=>p.toUpperCase()),f=Number(l),m=f>=0?"#4ade80":"#ef4444";n+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${b(x)}</span>
                <span class="ca-result-val" style="color:${m};font-size:10px">${f>=0?"+":""}${f.toFixed(1)}</span>
            </div>`}n+="</div>"}o>0&&(n+=`<div class="protest-endorse-breakdown">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#a78bfa;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:2px">Coalition Support</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-1)">${o} party endorsement${o>1?"s":""} — +${s} bonus</div>
        </div>`);const d=v.filter(c=>c.stat&&c.stat!=="electoral_wound");if(d.length>0){n+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Effects on Nation</div>`;for(const c of d){const w=(c.stat||"").replace(/_/g," ").replace(/\b\w/g,f=>f.toUpperCase()),l=Number(c.delta||c.value||0),x=l>=0?"#4ade80":"#ef4444";n+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${b(w)}</span>
                <span class="ca-result-val" style="color:${x};font-size:10px">${l>=0?"+":""}${l}</span>
            </div>`}n+="</div>"}return n+="</div></div>",n}function Es(){const t=Z;let e='<div class="ca-result-box" style="border-color:rgba(217,83,79,0.3)">';if(e+=`<div class="ca-result-header" style="background:rgba(217,83,79,0.06)">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#d9534f">Protest Resolving...</span>
    </div>`,e+='<div class="ca-result-body">',e+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);line-height:1.8">
        Your protest has been called and is gathering momentum. The turnout will be determined at the next tick based on national conditions.
    </div>`,t){if(t.grievance_type){const a=t.grievance_type==="minister"?"Minister":t.grievance_type==="activeCrisis"?"Active Crisis":t.grievance_type==="activePolicy"?"Active Policy":"Stat Failure";e+=`<div class="ca-result-row" style="margin-top:8px">
                <span class="ca-result-label">Grievance</span>
                <span class="ca-result-val" style="color:#f97316">${a}</span>
            </div>`}t.demand_label&&(e+=`<div class="ca-result-row">
                <span class="ca-result-label">Demand</span>
                <span class="ca-result-val" style="color:#a78bfa">${b(t.demand_label)}</span>
            </div>`)}return e+=`<div style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);margin-top:12px;font-style:italic">
        Other opposition parties can endorse this protest during this tick to boost turnout (+15 per endorsement).
    </div>`,e+="</div></div>",e}function Ss(t,e,a,r,i,o,s,v,n){const d=()=>Oe(t,e,a,r,i,o,s,v,n);t.querySelectorAll("[data-rival-id]").forEach(l=>{l.addEventListener("click",async()=>{const x=l.dataset.rivalId;if(Dt===x)return;Dt=x,It=null,Ft=null,d();const f=await va(R,x,a.id,s);Ft=fa(f),d()})}),t.querySelectorAll("[data-vector-id]").forEach(l=>{l.addEventListener("click",()=>{l.classList.contains("disabled")||(It=It===l.dataset.vectorId?null:l.dataset.vectorId,d())})}),t.querySelectorAll("[data-promise-type]").forEach(l=>{l.addEventListener("click",async()=>{const x=l.dataset.promiseType;if(gt=gt===x?null:x,Ut=null,At=null,d(),gt==="crisis"){const{data:f}=await R.from("active_crises").select("id, crisis_id, started_at_tick, crisis_templates(name, description)").eq("nation_id",a.id),m=document.getElementById("ca-crisis-list");if(m)if(!f||f.length===0)m.innerHTML='<div class="ca-info-box">No active crises to promise on.</div>';else{let p="";for(const g of f){const k=At===g.id,E=g.crisis_templates?.name||"Unknown Crisis";p+=`<div class="ca-crisis-card${k?" selected":""}" data-crisis-id="${g.id}">
                                <span class="ca-crisis-name">${b(E)}</span>
                            </div>`}m.innerHTML=p,m.querySelectorAll("[data-crisis-id]").forEach(g=>{g.addEventListener("click",()=>{At=At===g.dataset.crisisId?null:g.dataset.crisisId,d()})})}}})}),t.querySelectorAll("[data-stat-key]").forEach(l=>{l.addEventListener("click",()=>{Ut=Ut===l.dataset.statKey?null:l.dataset.statKey,d()})}),t.querySelectorAll("[data-crisis-id]").forEach(l=>{l.addEventListener("click",()=>{At=At===l.dataset.crisisId?null:l.dataset.crisisId,d()})}),t.querySelectorAll("[data-stance-issue-id]").forEach(l=>{l.addEventListener("click",()=>{const x=l.dataset.stanceIssueId;$t===x?$t=null:$t=x,wt=null,kt=null,oe="moderate";const f=Pt[$t];f&&f.axes.length===1&&(wt=f.axes[0]),d()})}),t.querySelectorAll("[data-stance-axis-key]").forEach(l=>{l.addEventListener("click",()=>{const x=l.dataset.stanceAxisKey;wt=wt===x?null:x,kt=null,d()})}),t.querySelectorAll("[data-stance-side-val]").forEach(l=>{l.addEventListener("click",()=>{const x=l.dataset.stanceSideVal;kt=kt===x?null:x,d()})}),t.querySelectorAll("[data-stance-int-val]").forEach(l=>{l.addEventListener("click",()=>{oe=l.dataset.stanceIntVal,d()})}),J==="take_stance"&&!Qt&&!jt&&R.from("issue_state").select("issue_id, salience").eq("nation_id",a.id).then(({data:l})=>{Qt=l||[],d()}),t.querySelectorAll("[data-axis-key]").forEach(l=>{l.addEventListener("click",()=>{const x=l.dataset.axisKey;Y===x?Y=null:Y=x,et=null,d()})}),t.querySelectorAll("[data-direction-value]").forEach(l=>{l.addEventListener("click",()=>{const x=l.dataset.directionValue;et=et===x?null:x,d()})}),t.querySelectorAll("[data-grassroots-demo]").forEach(l=>{l.addEventListener("click",()=>{l.dataset.grassrootsDemo,d()})}),t.querySelectorAll("[data-grassroots-band]").forEach(l=>{l.addEventListener("click",()=>{l.dataset.grassrootsBand,d()})});const c=t.querySelector("#ca-dismiss-result");c&&c.addEventListener("click",()=>{jt=null,d()}),J==="protest"&&!jt&&!Vt&&!re&&(re=!0,ys(a,e,s).then(()=>{re=!1,d()}).catch(l=>{console.error("[Protest] loadProtestData failed:",l),re=!1,Vt=Vt||[],ae=ae||[],Kt=Kt||{failingStats:[],_fatigueLevel:{label:"—",color:"#4a4840"}},d()})),t.querySelectorAll("[data-protest-tab]").forEach(l=>{l.addEventListener("click",()=>{Jt=l.dataset.protestTab,it=null,d()})}),t.querySelectorAll("[data-protest-target]").forEach(l=>{l.addEventListener("click",()=>{const x=l.dataset.protestTarget;try{const f=JSON.parse(x);it=it?.id===f.id?null:f}catch{it=null}d()})});const w=t.querySelector("#ca-confirm-btn");w&&w.addEventListener("click",()=>{w.classList.contains("disabled")||(w.classList.add("disabled"),Cs(t,e,a,r,i,o,s))})}let ke=!1;window._protestEndorse=async function(){if(!ke&&!(!Wt||ee)&&confirm("Endorse this protest? Costs 1 AP and boosts turnout (+15).")){ke=!0;try{const t=await Ca(R,V.id,se.id,Wt.id,Et.current_tick);if(!t.success){pt(t.error||"Endorsement failed.");return}ee=!0,V.action_points=Math.max(0,(V.action_points||0)-1);const e=await ne(V.id);e!==void 0&&(V.action_points=e),await pe(se,V,Et,le)}catch(t){console.error("[Protest] Endorse failed:",t),pt("Endorsement failed: "+t.message)}finally{ke=!1}}};let Ee=!1;window._protestCallOff=async function(){if(!Ee&&Z){if(Z.tier===7){pt("Tier 7 protests cannot be called off.");return}if(confirm("Call off this protest? Costs "+Gt.CALL_OFF_AP+" AP. A small approval boost from moderate blocs will be applied.")){Ee=!0;try{const t=await Aa(R,V.id,Z.id,Et.current_tick);if(!t.success){pt(t.error||"Call-off failed.");return}V.action_points=Math.max(0,(V.action_points||0)-Gt.CALL_OFF_AP);const e=await ne(V.id);e!==void 0&&(V.action_points=e),await pe(se,V,Et,le)}catch(t){console.error("[Protest] Call-off failed:",t),pt("Call-off failed: "+t.message)}finally{Ee=!1}}}};async function Cs(t,e,a,r,i,o,s){const v=ye.find(l=>l.id===J)||(J==="protest"?{id:"protest",name:"Organise a Protest",ap:Ie(),color:"#d9534f"}:null);if(!v)return;const n=Ie();if(r<n||!Qe())return;const d=document.getElementById("ca-confirm-btn");d&&(d.classList.add("disabled"),d.textContent="EXECUTING...");let c;try{if(v.id==="rally")c=await ma(R,e.id,a.id,null,s);else if(v.id==="attack")c=await ua(R,e.id,a.id,Dt,It,s);else if(v.id==="promise"){const l=gt==="stat"?{statKey:Ut}:{crisisId:At};c=await ga(R,e.id,a.id,s,gt,l)}else if(v.id==="protest"){if(!it)return;const l=it.grievanceData||{},x=it.demandLabel||"";c=await La(R,e.id,a.id,it.type,l,x,s)}else if(v.id==="take_stance")c=await Me(R,e.id,a.id,$t,wt,kt,oe,s);else if(v.id==="poll_now")c=await ya(R,e.id,a.id,s);else if(v.id==="fund_think_tank")c=await ba(R,e.id,a.id,Y,et,s);else if(v.id==="media_campaign")c=await xa(R,e.id,a.id,Y,et,s);else if(v.id==="grassroots_movement")c=await _a(R,e.id,a.id,Y,et,s);else if(v.id==="pivot"&&(c=await ha(R,e.id,a.id,Y,et,s),c.success)){const{data:l}=await R.from("factions").select("pivot_count, pivot_last_tick, pivot_cycle_start_tick").eq("id",e.id).single();l&&(e.pivot_count=l.pivot_count,e.pivot_last_tick=l.pivot_last_tick,e.pivot_cycle_start_tick=l.pivot_cycle_start_tick),ie=null}}catch(l){console.error("Campaign action error:",l),pt("Action failed: "+l.message),d&&(d.classList.remove("disabled"),d.textContent=`Confirm — ${n} AP`);return}if(!c||!c.success){pt(c?.message||c?.error||"Action failed."),d&&(d.classList.remove("disabled"),d.textContent=`Confirm — ${n} AP`);return}e.action_points=c.newAp??(e.action_points??0)-n;const w=await ne(e.id);if(w!==void 0&&(e.action_points=w),jt=c,await pe(a,e,Et,le),v.id==="take_stance"){$e(e.id,a.id);const l=document.getElementById("ca-stance-portfolio-container");l&&(l.querySelector(".sp-card")?.remove(),he(l,e,a))}}const Pe={deploy:{label:"Deploy",desc:"Deploy forces. +Backing, moves tracker.",icon:"⚔",color:"#5b9bd5"},stand_down:{label:"Stand Down",desc:"Stand down military. Always FOR YOURSELF.",icon:"◇",color:"#5b9bd5"},military_exercises:{label:"Military Exercises",desc:"Display military strength. +Stability, +Backing.",icon:"★",color:"#5b9bd5"},rally:{label:"Rally",desc:"Rally the base. +Backing.",icon:"◎",color:"#c8a64e"},agitate:{label:"Agitate",desc:"Stir up unrest. Regime mode at half power.",icon:"!",color:"#c8a64e"},party_congress:{label:"Party Congress",desc:"Hold congress. Strongman may attend or refuse.",icon:"⊞",color:"#c8a64e"},patronage:{label:"Patronage",desc:"Patronage network. +Backing via wealth.",icon:"$",color:"#5cb85c"},capital_flight:{label:"Capital Flight",desc:"Move capital abroad. Regime mode at half power.",icon:"→",color:"#5cb85c"},bribe:{label:"Bribe",desc:"Bribe a faction. Visible only to recipient.",icon:"◆",color:"#5cb85c"},broadcast:{label:"Broadcast",desc:"Broadcast propaganda. +Backing.",icon:"◈",color:"#d48a3c"},smear:{label:"Smear",desc:"Smear a rival faction. -Target Backing.",icon:"✗",color:"#d48a3c"},blackout:{label:"Blackout",desc:"Media blackout. Suppresses target faction.",icon:"▬",color:"#d48a3c"},surveillance:{label:"Surveillance",desc:"Spy on a faction. Reveals Backing/AP/last action.",icon:"◉",color:"#d9534f"},blackmail:{label:"Blackmail",desc:"Blackmail a faction leader. -Target Backing.",icon:"✉",color:"#d9534f"},disappear:{label:"Disappear",desc:"Disappear a faction leader. Extreme action.",icon:"✕",color:"#d9534f"},arrest_leader:{label:"Arrest Leader",desc:"Arrest a faction leader. Leader is detained.",icon:"⛓",color:"#d9534f"},execute_leader:{label:"Execute Leader",desc:"Execute arrested leader. Permanent removal.",icon:"☠",color:"#d9534f"},release_leader:{label:"Release Leader",desc:"Release arrested leader. May restore stability.",icon:"↩",color:"#5b9bd5"},favor:{label:"Favor",desc:"Grant a favor. +Target Backing, +Loyalty.",icon:"♔",color:"#c8a64e"},emergency_decree:{label:"Emergency Decree",desc:"Issue decree. Immediate stat effects.",icon:"⚡",color:"#d48a3c"},appoint_successor:{label:"Appoint Successor",desc:"Designate succession heir.",icon:"→",color:"#c8a64e"},revoke_successor:{label:"Revoke Successor",desc:"Remove designated successor.",icon:"✗",color:"#d9534f"},coup_attempt:{label:"Coup Attempt",desc:"Attempt a coup. High risk, high reward.",icon:"⚡",color:"#d9534f"},declare_putsch:{label:"Declare Putsch",desc:"Declare martial law. Military-only.",icon:"⛊",color:"#5b9bd5"},appeal_security:{label:"Appeal to Security",desc:"Strongman appeals to Security Services during putsch.",icon:"◎",color:"#d9534f"},security_putsch_response:{label:"Respond to Putsch",desc:"Security Services responds to Strongman appeal.",icon:"◉",color:"#d9534f"},putsch_do_nothing:{label:"Ignore Putsch",desc:"Strongman chooses not to respond to putsch.",icon:"—",color:"#888"},silent_coup:{label:"Silent Coup",desc:"Security Services power play. Multi-phase.",icon:"◉",color:"#d9534f"},silent_coup_vote:{label:"Vote on Silent Coup",desc:"Cast your vote on the silent coup.",icon:"✓",color:"#d9534f"},claim_wildcard:{label:"Claim Wildcard",desc:"Claim wildcard pillar with new leader.",icon:"?",color:"#888"},select_pillar:{label:"Select Pillar",desc:"Choose your pillar (one-time).",icon:"◆",color:"#d48a3c"}},Se={military:["deploy","stand_down","military_exercises"],party:["rally","agitate","party_congress"],oligarchs:["patronage","capital_flight","bribe"],media:["broadcast","smear","blackout"],security:["surveillance","blackmail","disappear"],strongman:["arrest_leader","execute_leader","release_leader","favor","emergency_decree","appoint_successor","revoke_successor"],coups:["coup_attempt","declare_putsch","appeal_security","security_putsch_response","putsch_do_nothing","silent_coup"],special:["claim_wildcard","silent_coup_vote","select_pillar"]};let De=null,mt="regime",qt=null,lt=null,Bt=null,me=null,ce=[];async function be(t,e,a,r,i,o){const s=document.getElementById("actions-container");if(!s)return;lt=t,Bt=e,me=a,ce=o;const v=a?.current_tick||0,n=e,d=t,{data:c}=await R.from("factions").select("action_points").eq("id",n.id).maybeSingle();c&&(n.action_points=c.action_points);const w=n.action_points??0,l=r.find(u=>u.faction_id===n.id),x=l?.pillar,f=l?.is_strongman,m=[];if(x&&Se[x])for(const u of Se[x])Ct[u]&&m.push(u);if(f)for(const u of Se.strongman)Ct[u]&&m.push(u);f||Ct.coup_attempt&&m.push("coup_attempt"),x==="military"&&Ct.declare_putsch&&m.push("declare_putsch"),x==="security"&&Ct.silent_coup&&m.push("silent_coup");const{data:p}=await R.from("silent_coup_offers").select("id").eq("nation_id",d.id).eq("to_faction_id",n.id).eq("voided",!1).is("accepted",null).limit(1).maybeSingle();p&&Ct.silent_coup_vote&&m.push("silent_coup_vote");const g=l&&!l.leader_name;g&&Ct.claim_wildcard&&m.push("claim_wildcard");const k=l?.pillar_confirmed;let E=`<div style="font-size:10px;color:var(--dtext-3);margin-bottom:12px">
        AP: <span style="color:var(--dtext-0);font-weight:700;font-family:var(--dfont-mono)">${w}</span>
        &nbsp;|&nbsp; Pillar: <span style="color:var(--dtext-0);font-weight:600">${x?x.charAt(0).toUpperCase()+x.slice(1):"—"}</span>
        ${g?'&nbsp;<span style="color:#d9534f;font-size:9px;font-weight:600">(NO LEADER)</span>':""}
        ${!g&&!k&&l?'&nbsp;<span style="color:#d48a3c;font-size:9px">(auto-assigned)</span>':""}
        ${f?'&nbsp;|&nbsp; <span style="color:#d9534f;font-weight:700">STRONGMAN</span>':""}
    </div>`;if(g){const u=i?.wildcard_pillar,h=i?.wildcard_backing??0,S=u?{military:"Military",party:"The Party",oligarchs:"Oligarchs",media:"Media",security:"Security"}[u]||u:null;E+=`
        <div style="background:#d9534f11;border:1px solid #d9534f44;border-radius:4px;padding:12px;margin-bottom:12px">
            <div style="font-size:11px;font-weight:700;color:#d9534f;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">LEADER EXECUTED</div>
            <div style="font-size:11px;color:var(--dtext-2);margin-bottom:10px">Your faction leader has been eliminated. You must claim a new pillar to appoint a successor and resume operations.</div>
            ${u?`
                <div style="display:flex;align-items:center;gap:10px;background:var(--dbg-3);border:1px solid var(--dborder-1);border-radius:3px;padding:10px;margin-bottom:10px">
                    <div style="flex:1">
                        <div style="font-size:10px;color:var(--dtext-3);text-transform:uppercase;letter-spacing:0.5px">Available Wildcard Pillar</div>
                        <div style="font-size:14px;color:var(--dtext-0);font-weight:700;margin-top:2px">${b(S)}</div>
                        <div style="font-size:10px;color:var(--dtext-3);margin-top:2px">Backing: ${h}</div>
                    </div>
                    <button id="claim-wildcard-btn" style="padding:8px 16px;background:#d9534f22;border:1px solid #d9534f66;color:#d9534f;border-radius:3px;cursor:pointer;font-size:12px;font-weight:700;white-space:nowrap">Claim Pillar</button>
                </div>
            `:`
                <div style="font-size:11px;color:var(--dtext-3);font-style:italic">No wildcard pillar is currently available to claim.</div>
            `}
            <div id="claim-wildcard-result" style="font-size:11px"></div>
        </div>`}if(l&&!k&&!g){const u={military:{label:"Military",icon:"⚔",color:"#5b9bd5",desc:"Deploy forces, military exercises, stand down"},party:{label:"The Party",icon:"◎",color:"#c8a64e",desc:"Rallies, agitation, party congress"},oligarchs:{label:"Oligarchs",icon:"$",color:"#5cb85c",desc:"Patronage, capital flight, bribery"},media:{label:"Media",icon:"◈",color:"#d48a3c",desc:"Broadcasts, smear campaigns, blackouts"},security:{label:"Security",icon:"◉",color:"#d9534f",desc:"Surveillance, blackmail, disappearances"}},h=new Set((r||[]).filter(S=>S.pillar_confirmed&&S.faction_id!==n.id).map(S=>S.pillar));let y=`
        <div style="background:#d48a3c11;border:1px solid #d48a3c44;border-radius:4px;padding:12px;margin-bottom:12px">
            <div style="font-size:11px;font-weight:700;color:#d48a3c;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">SELECT YOUR PILLAR</div>
            <div style="font-size:11px;color:var(--dtext-2);margin-bottom:10px">Your pillar was auto-assigned. Choose the one you want. Confirmed pillars cannot be taken.</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">`;for(const[S,_]of Object.entries(u)){const C=S===x,T=h.has(S),L=C?_.color:T?"var(--dborder-0)":_.color+"66",P=C?_.color+"15":"transparent";y+=`
            <div class="pillar-pick-btn" data-pillar="${S}" data-locked="${T}" style="flex:1;min-width:120px;border:2px solid ${L};border-radius:4px;padding:10px;text-align:center;cursor:${T?"default":"pointer"};opacity:${T?"0.35":"1"};background:${P};transition:all 0.15s">
                <div style="font-size:16px;color:${_.color}">${_.icon}</div>
                <div style="font-size:11px;font-weight:700;color:var(--dtext-0);margin-top:2px">${_.label}</div>
                <div style="font-size:9px;color:var(--dtext-3);margin-top:2px">${_.desc}</div>
                ${C?'<div style="font-size:8px;color:#d48a3c;margin-top:4px;font-weight:600">CURRENT</div>':""}
                ${T?'<div style="font-size:8px;color:var(--dtext-3);margin-top:4px">CLAIMED</div>':""}
            </div>`}y+=`</div>
            <div id="pillar-pick-result" style="margin-top:8px;font-size:11px"></div>
        </div>`,E+=y}m.length===0&&(k||!l)&&(E+='<div style="padding:20px;text-align:center;color:var(--dtext-3);font-size:12px">No actions available.</div>');for(const u of m){const h=Ct[u],y=Pe[u]||{label:u,desc:"",icon:"?",color:"#888"},S=l?Ge(l,h):h.baseCost,_=l?Ue(l,h,v):{onCooldown:!1,remainingTicks:0},C=w>=S,T=De===u,L=_.onCooldown||!C,P=T?y.color:L?"var(--dborder-0)":y.color+"44",$=T?y.color+"0a":"transparent",I=L?"0.45":"1";let z=`${S} AP`;_.onCooldown&&(z=`${_.remainingTicks} CD`),E+=`
        <div class="auto-action-item" data-action="${u}" data-disabled="${L}" style="background:${$};border:1px solid ${P};border-radius:3px;padding:8px 10px;margin-bottom:4px;cursor:${L?"default":"pointer"};opacity:${I};transition:all 0.15s">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-size:13px;color:${y.color};width:18px;text-align:center">${y.icon}</span>
                    <span style="font-size:12px;color:var(--dtext-0);font-weight:${T?"700":"500"}">${y.label}</span>
                    ${h.hasDualMode?'<span style="font-size:8px;color:var(--dtext-3);background:var(--dbg-3);padding:1px 4px;border-radius:2px">DUAL</span>':""}
                </div>
                <span style="font-size:10px;color:${_.onCooldown?"#d9534f":C?"var(--dtext-2)":"#d9534f"};font-family:var(--dfont-mono)">${z}</span>
            </div>
            <div style="font-size:9px;color:var(--dtext-3);margin-top:2px;padding-left:24px">${y.desc}</div>
        </div>`}let N='<div id="auto-action-detail" style="padding:24px;text-align:center;color:var(--dtext-3);font-size:12px">Select an action to see details.</div>';s.innerHTML=`
    <div class="auto-actions-wrap" style="display:flex;gap:16px;min-height:400px">
        <div id="auto-action-list" style="width:320px;min-width:0;flex-shrink:1">
            ${E}
        </div>
        <div style="flex:1;min-width:0;background:var(--dbg-2);border:1px solid var(--dborder-0);border-radius:3px;padding:16px;overflow-y:auto">
            ${N}
        </div>
    </div>
    <style>.auto-actions-wrap{flex-wrap:wrap}@media(max-width:700px){.auto-actions-wrap{flex-direction:column}.auto-actions-wrap>#auto-action-list{width:100%}}</style>`,s.querySelectorAll(".auto-action-item").forEach(u=>{u.addEventListener("click",()=>{if(u.getAttribute("data-disabled")==="true")return;const h=u.getAttribute("data-action");De=h,mt="regime",qt=null,Te(h,w,v,l,f,r),s.querySelectorAll(".auto-action-item").forEach(S=>{S.style.background="transparent",S.style.borderColor="var(--dborder-0)"});const y=Pe[h]||{color:"#888"};u.style.background=y.color+"0a",u.style.borderColor=y.color})}),s.querySelectorAll(".pillar-pick-btn").forEach(u=>{u.addEventListener("click",async()=>{if(u.getAttribute("data-locked")==="true")return;const h=u.getAttribute("data-pillar"),y=document.getElementById("pillar-pick-result");u.style.opacity="0.5",u.style.pointerEvents="none";try{const S=await Ae(R,{factionId:Bt.id,nationId:lt.id,actionType:"select_pillar",mode:"self",currentTick:v,extra:{pillar:h}});if(S.success){y&&(y.innerHTML=`<div style="color:#5cb85c;font-weight:600">Pillar confirmed: ${b(h)}</div>`);try{const{data:_}=await R.from("faction_pillar_state").select("*").eq("nation_id",lt.id),{data:C}=await R.from("autocracy_tracker").select("*").eq("nation_id",lt.id).maybeSingle();await be(lt,Bt,me,_||[],C,ce)}catch(_){console.warn("[PillarPick] Refresh failed:",_)}}else y&&(y.innerHTML=`<div style="color:#d9534f">${b(S.error||"Selection failed")}</div>`),u.style.opacity="1",u.style.pointerEvents="auto"}catch(S){y&&(y.innerHTML=`<div style="color:#d9534f">${b(S.message)}</div>`),u.style.opacity="1",u.style.pointerEvents="auto"}})});const A=s.querySelector("#claim-wildcard-btn");A&&A.addEventListener("click",async()=>{A.disabled=!0,A.textContent="Claiming...";const u=document.getElementById("claim-wildcard-result");try{const h=await Ae(R,{factionId:Bt.id,nationId:lt.id,actionType:"claim_wildcard",mode:"self",currentTick:v,extra:{}});if(h.success){const y=h.result?.effects||{};u&&(u.innerHTML=`<div style="color:#5cb85c;font-weight:600">Claimed ${b(y.claimed_pillar||"pillar")}. New leader: ${b(y.new_leader||"Unknown")}</div>`);try{const{data:S}=await R.from("faction_pillar_state").select("*").eq("nation_id",lt.id),{data:_}=await R.from("autocracy_tracker").select("*").eq("nation_id",lt.id).maybeSingle();await be(lt,Bt,me,S||[],_,ce)}catch(S){console.warn("[ClaimWildcard] Refresh failed:",S)}}else u&&(u.innerHTML=`<div style="color:#d9534f">${b(h.error||"Claim failed")}</div>`),A.disabled=!1,A.textContent="Claim Pillar"}catch(h){u&&(u.innerHTML=`<div style="color:#d9534f">${b(h.message)}</div>`),A.disabled=!1,A.textContent="Claim Pillar"}})}function Te(t,e,a,r,i,o){const s=document.getElementById("auto-action-detail");if(!s)return;const v=Ct[t],n=Pe[t]||{label:t,desc:"",icon:"?",color:"#888"},d=r?Ge(r,v):v.baseCost,c=r?Ue(r,v,a):{onCooldown:!1,remainingTicks:0},w=e>=d&&!c.onCooldown;let l="";v.hasDualMode&&(l=`
        <div style="display:flex;gap:8px;margin:12px 0">
            <button class="auto-mode-btn" data-mode="regime" style="flex:1;padding:6px;border:1px solid ${mt==="regime"?"#5b9bd5":"var(--dborder-1)"};background:${mt==="regime"?"#5b9bd511":"transparent"};color:${mt==="regime"?"#5b9bd5":"var(--dtext-2)"};border-radius:3px;cursor:pointer;font-size:11px;font-weight:600">FOR REGIME</button>
            <button class="auto-mode-btn" data-mode="self" style="flex:1;padding:6px;border:1px solid ${mt==="self"?"#d9534f":"var(--dborder-1)"};background:${mt==="self"?"#d9534f11":"transparent"};color:${mt==="self"?"#d9534f":"var(--dtext-2)"};border-radius:3px;cursor:pointer;font-size:11px;font-weight:600">FOR YOURSELF</button>
        </div>
        <div style="font-size:9px;color:var(--dtext-3);margin-bottom:8px">
            ${mt==="regime"?"Regime mode: tracker decreases (more stable)":"Self mode: tracker increases (less stable)"}
            ${v.halfPowerForRegime&&mt==="regime"?" — Half power in regime mode":""}
        </div>`);const x=["smear","blackout","surveillance","blackmail","disappear","bribe","arrest_leader","execute_leader","release_leader","favor","appoint_successor"].includes(t);let f="";if(x){const E=o.filter(A=>A.faction_id!==Bt.id);let N="";for(const A of E){const h=(ce||[]).find(S=>S.id===A.faction_id)?.faction_name||"Unknown",y=qt===A.faction_id?"selected":"";N+=`<option value="${A.faction_id}" ${y}>${b(h)} (${b(A.pillar||"?")})</option>`}f=`
        <div style="margin:8px 0">
            <label style="font-size:10px;color:var(--dtext-3);display:block;margin-bottom:4px">Target Faction</label>
            <select id="auto-target-select" style="width:100%;padding:6px;background:var(--dbg-3);border:1px solid var(--dborder-1);color:var(--dtext-1);border-radius:3px;font-size:12px">
                <option value="">— Select target —</option>
                ${N}
            </select>
        </div>`}const m=!w||x&&!qt,p=c.onCooldown?`Cooldown (${c.remainingTicks} ticks)`:w?`Execute — ${d} AP`:`Need ${d} AP`;s.innerHTML=`
    <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:20px;color:${n.color}">${n.icon}</span>
            <span style="font-size:16px;color:var(--dtext-0);font-weight:700">${n.label}</span>
        </div>
        <div style="font-size:12px;color:var(--dtext-2);margin-bottom:12px">${n.desc}</div>
        <div style="display:flex;gap:16px;font-size:10px;color:var(--dtext-3);margin-bottom:12px">
            <div>Cost: <span style="color:var(--dtext-1);font-weight:600">${d} AP</span></div>
            <div>Pillar: <span style="color:var(--dtext-1)">${v.pillar||"any"}</span></div>
            ${v.cooldownTicks?`<div>Cooldown: <span style="color:var(--dtext-1)">${v.cooldownTicks} ticks</span></div>`:""}
            ${v.escalationSteps?`<div>Escalation: <span style="color:var(--dtext-1)">${v.escalationSteps.join(" → ")}</span></div>`:""}
        </div>
        ${l}
        ${f}
        <button id="auto-exec-btn" style="width:100%;padding:10px;background:${m?"var(--dbg-3)":n.color+"22"};border:1px solid ${m?"var(--dborder-1)":n.color+"66"};color:${m?"var(--dtext-3)":n.color};border-radius:3px;cursor:${m?"not-allowed":"pointer"};font-size:12px;font-weight:700;margin-top:12px" ${m?"disabled":""}>
            ${p}
        </button>
        <div id="auto-exec-result" style="margin-top:12px;font-size:11px"></div>
    </div>`,s.querySelectorAll(".auto-mode-btn").forEach(E=>{E.addEventListener("click",()=>{mt=E.getAttribute("data-mode"),Te(t,e,a,r,i,o)})});const g=document.getElementById("auto-target-select");g&&g.addEventListener("change",()=>{qt=g.value||null,Te(t,e,a,r,i,o)});const k=document.getElementById("auto-exec-btn");k&&!m&&k.addEventListener("click",async()=>{k.disabled=!0,k.textContent="Executing...";try{const E={};qt&&(t==="appoint_successor"?E.successorFactionId=qt:E.targetFactionId=qt);const N=await Ae(R,{factionId:Bt.id,nationId:lt.id,actionType:t,mode:v.hasDualMode?mt:"self",currentTick:a,extra:E}),A=document.getElementById("auto-exec-result");if(N.success){if(A){const u=N.result?b(JSON.stringify(N.result.effects||N.result,null,0)):"";A.innerHTML=`<div style="color:#5cb85c;font-weight:600">Action executed successfully.</div>
                            ${u?`<div style="color:var(--dtext-2);margin-top:4px">${u}</div>`:""}`}try{const{data:u}=await R.from("faction_pillar_state").select("*").eq("nation_id",lt.id),{data:h}=await R.from("autocracy_tracker").select("*").eq("nation_id",lt.id).single();await be(lt,Bt,me,u||[],h,ce)}catch(u){console.warn("[AutoActions] Refresh after action failed:",u)}}else A&&(A.innerHTML=`<div style="color:#d9534f;font-weight:600">${b(N.error||"Action failed")}</div>`),k.disabled=!1,k.textContent=p}catch(E){const N=document.getElementById("auto-exec-result");N&&(N.innerHTML=`<div style="color:#d9534f">${b(E.message)}</div>`),k.disabled=!1,k.textContent=p}})}const Yt=[{key:"security_freedom",blocKey:"axis_security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",blocKey:"axis_tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"individualism_collectivism",blocKey:"axis_individualism_collectivism",leftLabel:"Individualism",rightLabel:"Collectivism"},{key:"globalism_nationalism",blocKey:"axis_globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"liberty_equality",blocKey:"axis_liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"}],As=15,Ls=25;function Is(t,e){const a=Math.min(100,Math.max(0,(e-5)/35*100)),r=Math.max(5,15-a*.1),i=50-r,o=50+r,s=(t-50)/50,v=.15+a*.004,n=i,d=Math.max(0,-s),c=Math.min(.85,v+d*.3),w=n*c,l=n-w,x=100-o,f=Math.max(0,s),m=Math.min(.85,v+f*.3),p=x*m,g=x-p,k=[{id:"radical-left",left:0,width:w,label:"Radical"},{id:"moderate-left",left:w,width:l,label:"Moderate"},{id:"centrist",left:i,width:o-i,label:"Centrist"},{id:"moderate-right",left:o,width:g,label:"Moderate"},{id:"radical-right",left:o+g,width:p,label:"Radical"}];function E(N){return N<w?"radical-left":N<i?"moderate-left":N<o?"centrist":N<o+g?"moderate-right":"radical-right"}return{zones:k,zoneForPos:E}}async function Ps(t,e,a,r,i){const o=document.getElementById("electorate-spread-container");if(!o)return;const{data:s}=await R.from("electorate_profile").select("*").eq("nation_id",e.id).maybeSingle();if(!s){o.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No electorate data available.</div>';return}const v={};for(const _ of r||[])v[_.faction_id]=_;const n=Number(e.polarization??50),d=Number(e.stability??50),c=Number(e.ethnic_diversity??50),l=5+Math.min(100,Math.max(0,n*.9+(100-d)*.07+c*.03))/100*40,x={};for(const _ of Yt){const C=Number(s["ideo_mean_"+_.key]??50);x[_.key]={mean:C,zoneVariance:l}}const f=(a||[]).map(_=>{const C=v[_.id]||{},T=_.id===t.id;return{id:_.id,abbr:_.abbreviation||"??",color:_.party_color||"#888",isPlayer:T,ideology:{security_freedom:Number(C.security_freedom??0),tradition_progress:Number(C.tradition_progress??0),liberty_equality:Number(C.liberty_equality??0),globalism_nationalism:Number(C.globalism_nationalism??0),individualism_collectivism:Number(C.individualism_collectivism??0)}}}),m=v[t.id]||{},p={},g=f.filter(_=>!_.isPlayer);for(const _ of g)p[_.id]=!0;let k=0,E=0,N=0,A=0;function u(_){const T=(Number(m[_]??0)+100)/2,L=x[_].mean,P=Math.abs(T-L);return P<=As?{cls:"es-match-yes",label:"✓ Aligned",gap:P}:P<=Ls?{cls:"es-match-part",label:"~ Partial",gap:P}:{cls:"es-match-no",label:"✗ Misaligned",gap:P}}for(const _ of Yt){const C=u(_.key);C.cls==="es-match-yes"?k++:C.cls==="es-match-part"?E++:N++,A+=Math.max(0,100-C.gap)}const h=Math.round(A/Yt.length),y=h>=65?"var(--dgreen)":h>=45?"var(--damber)":"var(--dred)";function S(){let _="";for(let $=0;$<Yt.length;$++){const I=Yt[$],z=x[I.key],D=u(I.key),M=z.mean,q=z.zoneVariance,H=Math.max(0,M-q),O=Math.min(100,M+q)-H,B=n>=76?"deeply divided":n>=51?"polarized":n>=26?"moderately divided":"near centrist";let F;M<45?F=`Electorate is <strong>${B}</strong>, leans ${b(I.leftLabel)} — mean ${Math.round(M)} / 100`:M>55?F=`Electorate is <strong>${B}</strong>, leans ${b(I.rightLabel)} — mean ${Math.round(M)} / 100`:F=`Electorate is <strong>${B}</strong> — mean ${Math.round(M)} / 100`;let K="";for(let U=0;U<f.length;U++){const G=f[U],Q=(G.ideology[I.key]+100)/2,nt=U%2===0?"":"es-below",St=!G.isPlayer&&!p[G.id]?"es-hidden":"";G.isPlayer?K+=`
                    <div class="es-pm ${St}" data-es-party="${G.id}" style="left:${Q}%">
                        <div class="es-pm-bar" style="background:${G.color}"></div>
                        <div class="es-pm-ring" style="border-color:${G.color}"></div>
                        <div class="es-pm-dot" style="background:${G.color}"></div>
                        <div class="es-pm-label" style="color:${G.color}">${b(G.abbr)}</div>
                    </div>`:K+=`
                    <div class="es-pm ${St}" data-es-party="${G.id}" style="left:${Q}%">
                        <div class="es-pm-bar" style="background:${G.color}"></div>
                        <div class="es-pm-dot" style="background:${G.color}"></div>
                        <div class="es-pm-label ${nt}" style="color:${G.color}">${b(G.abbr)}</div>
                    </div>`}let tt="";if(D.cls==="es-match-no"){const U=(Number(m[I.key]??0)+100)/2,G=Math.min(U,M),dt=Math.abs(U-M);tt=`<div class="es-gap" style="left:${G}%;width:${dt}%">
                    <div class="es-gap-label">${Math.round(D.gap)}pt gap</div>
                </div>`}const{zones:yt,zoneForPos:W}=Is(M,z.zoneVariance);let X="";const ot={"radical-left":"rgba(239,68,68,0.10)","moderate-left":"rgba(251,191,36,0.07)",centrist:"rgba(74,222,128,0.08)","moderate-right":"rgba(251,191,36,0.07)","radical-right":"rgba(239,68,68,0.10)"},vt={"radical-left":"rgba(239,68,68,0.25)","moderate-left":"rgba(251,191,36,0.18)",centrist:"rgba(74,222,128,0.22)","moderate-right":"rgba(251,191,36,0.18)","radical-right":"rgba(239,68,68,0.25)"},Tt={"radical-left":"rgba(239,68,68,0.50)","moderate-left":"rgba(251,191,36,0.45)",centrist:"rgba(74,222,128,0.50)","moderate-right":"rgba(251,191,36,0.45)","radical-right":"rgba(239,68,68,0.50)"},Nt=H+O;for(const U of yt){if(U.width<1)continue;const G=Math.max(U.left,H),dt=Math.min(U.left+U.width,Nt);if(dt<=G)continue;const Q=(G-H)/O*100,nt=(dt-G)/O*100,St=nt>8;X+=`<div class="es-zone" style="left:${Q}%;width:${nt}%;background:${ot[U.id]};border-left:1px solid ${vt[U.id]};border-right:1px solid ${vt[U.id]}">
                    ${St?`<span class="es-zone-label" style="color:${Tt[U.id]}">${U.label}</span>`:""}
                </div>`}const Rt=(Number(m[I.key]??0)+100)/2,bt=W(Rt),Mt=yt.find(U=>U.id===bt)?.label||"",Ot=[];for(const U of f){if(U.isPlayer)continue;const G=(U.ideology[I.key]+100)/2;W(G)===bt&&Ot.push(U)}let ft=Mt;bt.endsWith("-left")?ft+=" "+I.leftLabel:bt.endsWith("-right")&&(ft+=" "+I.rightLabel);let rt="";if(Ot.length>0){const U=Ot.map(G=>`<strong style="color:${G.color}">${b(G.abbr)}</strong>`).join(" and ");rt=`<div class="es-split-note">You are <strong>${b(ft)}</strong> and currently splitting votes with ${U}</div>`}else rt=`<div class="es-split-note es-split-clear">You are <strong>${b(ft)}</strong> — no parties competing in your zone</div>`;const Ht=$===Yt.length-1;_+=`
            <div class="es-axis-block">
                <div class="es-axis-header">
                    <div class="es-axis-info">
                        <div class="es-axis-name">${b(I.leftLabel)} / ${b(I.rightLabel)}</div>
                        <div class="es-axis-read">${F}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span class="es-zone-badge" data-zone="${bt}">${Mt}</span>
                        <div class="es-match ${D.cls}">${D.label}</div>
                    </div>
                </div>
                <div class="es-spectrum">
                    <div class="es-pole-row">
                        <span class="es-pole">${b(I.leftLabel)}</span>
                        <span class="es-pole">${b(I.rightLabel)}</span>
                    </div>
                    <div class="es-track">
                        <div class="es-center"><div class="es-center-label">Center</div></div>
                        <div class="es-variance" style="left:${H}%;width:${O}%">${X}</div>
                        <div class="es-emean" style="left:${M}%"><div class="es-emean-label">Electorate</div></div>
                        ${tt}
                        ${K}
                    </div>
                </div>
                ${rt}
            </div>
            ${Ht?"":'<div class="es-div"></div>'}`}const C=f.find($=>$.isPlayer);let T="";if(C){const $=Lt(C.color,.1),I=Lt(C.color,.25);T+=`<div class="es-leg-pill" style="color:${C.color};background:${$};border-color:${I}">
                <div class="es-leg-dot" style="background:${C.color}"></div>${b(C.abbr)} <span style="opacity:.55;font-size:7px">YOU</span>
            </div>`}for(const $ of g){const I=Lt($.color,.1),z=Lt($.color,.25),D=p[$.id]?"":"es-dimmed";T+=`<div class="es-leg-pill ${D}" data-es-toggle="${$.id}" style="color:${$.color};background:${I};border-color:${z}">
                <div class="es-leg-dot" style="background:${$.color}"></div>${b($.abbr)}
            </div>`}const L=[];if(n>=65){const $=n>=85?"High":"Elevated";L.push({label:`${$} Polarization`,stat:Math.round(n),color:"var(--dred)",note:"pushing the electorate to the fringes"})}if(d<=35){const $=d<=15?"Very low":"Low";L.push({label:`${$} Stability`,stat:Math.round(d),color:"var(--damber)",note:"pushing the electorate to the fringes"})}c>=65&&L.push({label:"High Ethnic Diversity",stat:Math.round(c),color:"var(--dteal)",note:"widening ideological divisions"}),n<=25&&d>=65&&L.push({label:"Stable & United",stat:null,color:"var(--dgreen)",note:"electorate is ideologically consolidated"});let P="";if(L.length>0){P='<div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 16px;border-bottom:1px solid var(--dborder-hair)">';for(const $ of L)P+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:${$.color};display:flex;align-items:center;gap:4px">`,P+=`<span style="font-weight:700">${$.label}</span>`,$.stat!==null&&(P+=`<span style="opacity:0.6">(${$.stat})</span>`),P+=`<span style="color:var(--dtext-3)">— ${$.note}</span>`,P+="</div>";P+="</div>"}o.innerHTML=`
        <div class="es-page-label">Electorate Ideology Spread — <span class="es-nation">${b(e.name)}</span> · Tick ${i}</div>
        <div class="es-outer">
            <div class="es-hdr">
                <div class="es-hdr-left">
                    <div class="es-hdr-dot"></div>
                    <span class="es-hdr-title">Electorate Ideology Spread</span>
                </div>
                <div class="es-legend" id="es-legend">${T}</div>
            </div>
            ${P}
            <div class="es-body">${_}</div>
            <div class="es-summary">
                <div class="es-sb-item">
                    <div class="es-sb-label">Ideological Alignment</div>
                    <div class="es-sb-val" style="color:${y}">${h}</div>
                </div>
                <div class="es-sb-div"></div>
                <div class="es-sb-item">
                    <div class="es-sb-label">Axes Aligned</div>
                    <div class="es-sb-val" style="color:var(--dgreen)">${k}</div>
                </div>
                <div class="es-sb-div"></div>
                <div class="es-sb-item">
                    <div class="es-sb-label">Partial</div>
                    <div class="es-sb-val" style="color:var(--damber)">${E}</div>
                </div>
                <div class="es-sb-div"></div>
                <div class="es-sb-item">
                    <div class="es-sb-label">Misaligned</div>
                    <div class="es-sb-val" style="color:var(--dred)">${N}</div>
                </div>
            </div>
            <div class="es-legend-bar">
                <div class="es-lb-item">
                    <svg width="16" height="16"><circle cx="8" cy="8" r="6" fill="rgba(255,255,255,0.85)"/></svg>
                    <span class="es-lb-text">White dot = electorate mean</span>
                </div>
                <div class="es-lb-item">
                    <svg width="36" height="16"><rect x="0" y="3" width="36" height="10" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)" stroke-width="1"/></svg>
                    <span class="es-lb-text">Shaded band = voter spread (wider = more polarized)</span>
                </div>
                <div class="es-lb-item">
                    <svg width="16" height="16">
                        <circle cx="8" cy="8" r="5" fill="${C?C.color:"#9b7ec8"}"/>
                        <circle cx="8" cy="8" r="8" fill="none" stroke="${C?C.color:"#9b7ec8"}" stroke-width="1.5" opacity="0.55"/>
                    </svg>
                    <span class="es-lb-text">Ring = your party</span>
                </div>
                <div class="es-lb-item">
                    <svg width="36" height="16"><line x1="0" y1="8" x2="36" y2="8" stroke="rgba(217,83,79,0.7)" stroke-width="2" stroke-dasharray="4,3"/></svg>
                    <span class="es-lb-text">Dashed = alignment gap</span>
                </div>
                <div class="es-lb-item">
                    <span class="es-lb-text" style="font-style:italic">Click party pills to show/hide</span>
                </div>
            </div>
        </div>`,o.querySelectorAll("[data-es-toggle]").forEach($=>{$.addEventListener("click",()=>{const I=$.getAttribute("data-es-toggle");p[I]=!p[I],$.classList.toggle("es-dimmed",!p[I]),o.querySelectorAll(`[data-es-party="${I}"]`).forEach(z=>{z.classList.toggle("es-hidden",!p[I])})})})}S()}async function he(t,e,a){const[r,i,o]=await Promise.all([R.from("faction_issue_stance").select("*").eq("faction_id",e.id).eq("nation_id",a.id),R.from("issue_state").select("issue_id, salience, owned_by, pioneer_faction_id").eq("nation_id",a.id),R.from("shard").select("current_tick").eq("name","Alpha Shard").single()]);r.error&&console.error("[Politics] Failed to load stances:",r.error.message),i.error&&console.error("[Politics] Failed to load issue states:",i.error.message);const s=r.data||[],v=i.data||[],n=o.data?.current_tick||0,d={};for(const m of v)d[m.issue_id]=m;const c=ut.MAX_STANCES,w=s.length>=c;let l="";if(s.length===0)l='<div class="sp-empty">No active stances. Take a stance on an issue to build platform appeal.</div>';else for(const m of s){const p=Pt[m.issue_id];if(!p)continue;const g=ct.find($=>$.key===m.axis),k=m.side==="left"?g?.leftLabel:g?.rightLabel,E=m.side==="left"?g?.leftColor:g?.rightColor,N=Number(m.strength??0),A=Number(m.decay_rate??0),u=Number(m.ticks_held??0),h=N<=40,y=N<=20,S=y?"var(--dred)":h?"var(--damber)":"var(--dgreen)",_=d[m.issue_id],C=Number(_?.salience??30),T=m.ideologically_consistent?"":'<span class="sp-badge sp-badge--warn">INCONSISTENT</span>',L=m.is_pioneer?'<span class="sp-badge sp-badge--good">PIONEER</span>':"",P=h?`<span class="sp-badge sp-badge--fade">${y?"EXPIRING":"FADING"}</span>`:"";l+=`
            <div class="sp-row" data-stance-issue="${m.issue_id}">
                <div class="sp-row-top">
                    <div class="sp-row-left">
                        <span class="sp-issue-name">${b(p.label)}</span>
                        <span class="sp-side-pill" style="color:${E};border-color:${E}">${m.intensity} ${k}</span>
                        ${L}${T}${P}
                    </div>
                    <div class="sp-row-right">
                        <span class="sp-salience" title="Issue salience">Salience: ${C.toFixed(0)}</span>
                        <span class="sp-ticks">Held ${u} ticks</span>
                    </div>
                </div>
                <div class="sp-bar-row">
                    <div class="sp-bar-track">
                        <div class="sp-bar-fill" style="width:${N}%;background:${S}"></div>
                    </div>
                    <span class="sp-str-val" style="color:${S}">${N.toFixed(0)}</span>
                    <span class="sp-decay" style="color:var(--dred)">-${A}/tick</span>
                </div>
                <div class="sp-row-actions">
                    <button class="sp-btn sp-btn--reinforce" data-stance-action="reinforce" data-stance-issue="${m.issue_id}" data-stance-axis="${m.axis}" data-stance-side="${m.side}" data-stance-intensity="${m.intensity}">Reinforce</button>
                    <button class="sp-btn sp-btn--modify" data-stance-action="modify" data-stance-issue="${m.issue_id}">Modify</button>
                </div>
            </div>`}const x=`
    <div class="sp-card" style="margin-top:20px;max-width:780px;">
        <div class="sp-card-header">
            <div class="sp-card-title">Active Stance Portfolio</div>
            <div class="sp-card-count">${s.length} / ${c}</div>
        </div>
        <div class="sp-stances">${l}</div>
        <div class="sp-footer">
            <button class="sp-btn sp-btn--new${w?" sp-btn--disabled":""}" id="sp-new-stance-btn" ${w?'disabled title="Maximum stances reached (5/5)"':""}>
                + New Stance${w?" (5/5)":""}
            </button>
            <span class="sp-footer-hint">${ut.AP_COST} AP · ${ut.COOLDOWN_WINDOW}-tick cooldown</span>
        </div>
    </div>`;t.insertAdjacentHTML("beforeend",x),t.querySelectorAll('[data-stance-action="reinforce"]').forEach(m=>{m.addEventListener("click",async()=>{const p=m.dataset.stanceIssue,g=m.dataset.stanceAxis,k=m.dataset.stanceSide,E=m.dataset.stanceIntensity;m.disabled=!0,m.textContent="Reinforcing...";const N=await Me(R,e.id,a.id,p,g,k,E,n);if(N.success){N.newAp!=null&&(e.action_points=N.newAp,V&&(V.action_points=N.newAp));const A=await ne(e.id);A!==void 0&&(e.action_points=A,V&&(V.action_points=A)),t.querySelector(".sp-card")?.remove(),await he(t,e,a),$e(e.id,a.id)}else pt(N.message||"Failed to reinforce stance."),m.disabled=!1,m.textContent="Reinforce"})}),t.querySelectorAll('[data-stance-action="modify"]').forEach(m=>{m.addEventListener("click",()=>{He(e,a,n,d,s,m.dataset.stanceIssue)})});const f=document.getElementById("sp-new-stance-btn");f&&!w&&f.addEventListener("click",()=>{He(e,a,n,d,s,null)})}function He(t,e,a,r,i,o){document.getElementById("stance-modal-overlay")?.remove();const s=new Set(i.map(p=>p.issue_id)),v=i.length>=ut.MAX_STANCES,n=qe.map(p=>({id:p,def:Pt[p],salience:Number(r[p]?.salience??30),hasStance:s.has(p)})).sort((p,g)=>g.salience-p.salience);let d="";for(const p of n){const g=!p.hasStance&&v,k=p.id===o,E=p.salience>=60?"var(--dred)":p.salience>=40?"var(--damber)":"var(--dtext-3)",N=p.def.axes.map(A=>{const u=ct.find(h=>h.key===A);return u?`${u.leftLabel}/${u.rightLabel}`:A}).join(", ");d+=`
        <div class="sm-issue${k?" sm-issue--selected":""}${g?" sm-issue--disabled":""}"
             data-sm-issue="${p.id}" ${g?"":'role="button" tabindex="0"'}>
            <div class="sm-issue-top">
                <span class="sm-issue-name">${b(p.def.label)}</span>
                ${p.hasStance?'<span class="sm-issue-badge">HAS STANCE</span>':""}
            </div>
            <div class="sm-issue-meta">
                <span class="sm-issue-salience" style="color:${E}">Salience: ${p.salience.toFixed(0)}</span>
                <span class="sm-issue-axes">${N}</span>
            </div>
        </div>`}const c=`
    <div class="modal-overlay active" id="stance-modal-overlay">
        <div class="sm-modal">
            <div class="sm-header">
                <span class="sm-title">Take a Stance</span>
                <button class="sm-close" id="sm-close-btn">&times;</button>
            </div>
            <div class="sm-body">
                <div class="sm-section-label">Select Issue</div>
                <div class="sm-issue-list">${d}</div>
                <div id="sm-config-area"></div>
            </div>
            <div class="sm-footer" id="sm-footer" style="display:none">
                <button class="sp-btn sp-btn--new" id="sm-confirm-btn" disabled>Confirm Stance (${ut.AP_COST} AP)</button>
            </div>
        </div>
    </div>`;document.body.insertAdjacentHTML("beforeend",c);let w=o,l=null,x=null,f="moderate";function m(){const p=document.getElementById("sm-config-area"),g=document.getElementById("sm-footer");if(!p||!w){p&&(p.innerHTML=""),g&&(g.style.display="none");return}const k=Pt[w];if(!k)return;k.axes.length===1&&!l&&(l=k.axes[0]);let E='<div class="sm-section-label" style="margin-top:14px;">Choose Axis</div><div class="sm-axis-list">';for(const y of k.axes){const S=ct.find(C=>C.key===y);if(!S)continue;E+=`<div class="sm-axis-opt${y===l?" sm-axis-opt--selected":""}" data-sm-axis="${y}">
                <span style="color:${S.leftColor}">${S.leftLabel}</span> / <span style="color:${S.rightColor}">${S.rightLabel}</span>
            </div>`}E+="</div>";let N="";if(l){const y=ct.find(S=>S.key===l);N=`<div class="sm-section-label" style="margin-top:14px;">Choose Side</div><div class="sm-side-list">
                <div class="sm-side-opt${x==="left"?" sm-side-opt--selected":""}" data-sm-side="left" style="border-color:${y.leftColor}">
                    <span style="color:${y.leftColor};font-weight:700">${y.leftLabel}</span>
                </div>
                <div class="sm-side-opt${x==="right"?" sm-side-opt--selected":""}" data-sm-side="right" style="border-color:${y.rightColor}">
                    <span style="color:${y.rightColor};font-weight:700">${y.rightLabel}</span>
                </div>
            </div>`}let A="";if(x){A='<div class="sm-section-label" style="margin-top:14px;">Intensity</div><div class="sm-intensity-list">';for(const[y,S]of Object.entries(ut.INTENSITY))A+=`<div class="sm-int-opt${y===f?" sm-int-opt--selected":""}" data-sm-intensity="${y}">
                    <span class="sm-int-name">${y}</span>
                    <span class="sm-int-meta">Strength ${S.strength} · Decay ${S.decay_rate}/tick</span>
                </div>`;A+="</div>"}p.innerHTML=E+N+A;const u=w&&l&&x&&f;g.style.display=u?"flex":"none";const h=document.getElementById("sm-confirm-btn");h&&(h.disabled=!u),p.querySelectorAll("[data-sm-axis]").forEach(y=>{y.addEventListener("click",()=>{l=y.dataset.smAxis,x=null,m()})}),p.querySelectorAll("[data-sm-side]").forEach(y=>{y.addEventListener("click",()=>{x=y.dataset.smSide,m()})}),p.querySelectorAll("[data-sm-intensity]").forEach(y=>{y.addEventListener("click",()=>{f=y.dataset.smIntensity,m()})})}document.querySelectorAll("[data-sm-issue]").forEach(p=>{p.classList.contains("sm-issue--disabled")||p.addEventListener("click",()=>{document.querySelectorAll(".sm-issue").forEach(g=>g.classList.remove("sm-issue--selected")),p.classList.add("sm-issue--selected"),w=p.dataset.smIssue,l=null,x=null,m()})}),document.getElementById("sm-close-btn")?.addEventListener("click",()=>{document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("stance-modal-overlay")?.addEventListener("click",p=>{p.target.id==="stance-modal-overlay"&&document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("sm-confirm-btn")?.addEventListener("click",async()=>{const p=document.getElementById("sm-confirm-btn");if(!p||p.disabled)return;p.disabled=!0,p.textContent="Taking stance...";const g=await Me(R,t.id,e.id,w,l,x,f,a);if(g.success){g.newAp!=null&&(t.action_points=g.newAp,V&&(V.action_points=g.newAp));const k=await ne(t.id);k!==void 0&&(t.action_points=k,V&&(V.action_points=k)),document.getElementById("stance-modal-overlay")?.remove();const E=document.getElementById("electorate-spread-container");E&&(E.querySelector(".sp-card")?.remove(),await he(E,t,e)),$e(t.id,e.id)}else pt(g.message||"Failed to take stance."),p.disabled=!1,p.textContent=`Confirm Stance (${ut.AP_COST} AP)`}),o&&m()}async function $e(t,e){const a=document.getElementById("stance-summary-strip");if(!a)return;const{data:r}=await R.from("faction_issue_stance").select("issue_id, axis, side, intensity, strength, decay_rate, ticks_held, is_pioneer, ideologically_consistent").eq("faction_id",t).eq("nation_id",e),i=ut.MAX_STANCES;if(!r||r.length===0){a.innerHTML=`<div style="color:var(--dtext-3);font-size:12px;font-family:var(--dfont-ui);padding:4px 0;">
            No active stances. Take a stance in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab.
        </div>`;return}let o="";for(const s of r){const v=Pt[s.issue_id];if(!v)continue;const n=ct.find(N=>N.key===s.axis),d=s.side==="left"?n?.leftLabel:n?.rightLabel,c=s.side==="left"?n?.leftColor:n?.rightColor,w=Number(s.strength??0),l=Number(s.decay_rate??0),x=Number(s.ticks_held??0),f=w<=20,m=w<=40,p=f?"var(--dred)":m?"var(--damber)":"var(--dgreen)",g=s.is_pioneer?'<span style="font-size:9px;color:#4ade80;font-weight:700;margin-left:4px">PIONEER</span>':"",k=s.ideologically_consistent===!1?'<span style="font-size:9px;color:#f97316;font-weight:700;margin-left:4px">INCONSISTENT</span>':"",E=m?`<span style="font-size:9px;color:${p};font-weight:700;margin-left:4px">${f?"EXPIRING":"FADING"}</span>`:"";o+=`
        <div style="padding:6px 0;${o?"border-top:1px solid var(--dborder-0);":""}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:2px">
                    <span style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${b(v.label)}</span>
                    <span style="font-size:10px;padding:1px 5px;border:1px solid ${c};border-radius:3px;color:${c};margin-left:4px">${s.intensity} ${d}</span>
                    ${g}${k}${E}
                </div>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3)">Held ${x}t</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;height:6px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">
                    <div style="width:${w}%;height:100%;background:${p};border-radius:2px"></div>
                </div>
                <span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${p};width:28px;text-align:right">${w.toFixed(0)}</span>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);width:40px;text-align:right">-${l}/t</span>
            </div>
        </div>`}a.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-family:var(--dfont-mono);font-size:11px;color:var(--dtext-2)">${r.length} / ${i}</span>
        </div>
        ${o}
        <div style="margin-top:8px;font-size:10px;color:var(--dtext-3);font-family:var(--dfont-ui)">Manage stances in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab</div>`}async function Ts(t,e,a,r,i,o,s,v){const n=document.getElementById("voters-container");if(!n)return;const d=t.party_color||"#9b7ec8";t.abbreviation;const c=t.faction_name||"Unknown Party",[w,l,x]=await Promise.all([R.from("faction_electoral_standing").select("faction_id, party_approval, polled_party_approval, last_polled_tick").eq("nation_id",e.id).eq("faction_id",t.id).maybeSingle(),R.from("party_approval_log").select("amount, source, tick").eq("nation_id",e.id).eq("faction_id",t.id).order("tick",{ascending:!1}).limit(20),R.from("government_formations").select("lead_party_id, party_ids").eq("nation_id",e.id).in("status",["formed","active","caretaker"]).order("formed_at",{ascending:!1}).limit(1).maybeSingle()]),f=w.data;if(!f){n.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">Electorate standing not yet computed. Advance a tick to generate data.</div>';return}const m=Number(f.party_approval??25),p=f.polled_party_approval!=null?Number(f.polled_party_approval):null,g=f.last_polled_tick||null,k=x.data?.party_ids||[],E=x.data?.lead_party_id||null,N=k.includes(t.id)||E===t.id,A=l.data||[],u={"bill:passed":"Bill Passed","bill:failed":"Bill Failed","bill:promise_fulfilled":"Promise Fulfilled","bill:promise_broken":"Promise Broken","bill:veto":"Bill Vetoed",rally:"Rally","rally:approval_hit":"Rally",outreach:"Outreach","outreach:approval":"Outreach",attack:"Attack Ad","attack:received":"Attacked","promise:kept":"Promise Kept","promise:broken":"Promise Broken","promise:expired":"Promise Expired","protest:organiser":"Protest Organised","executive_order:price_controls":"Price Controls","executive_order:national_emergency":"National Emergency","executive_order:censure":"Censured","executive_order:censure_martyr":"Censure Backlash","election:no_confidence_called":"Called No Confidence","election:no_confidence_failed":"No Confidence Failed","election:presidential_won":"Won Presidential Election","election:presidential_lost":"Lost Presidential Election","election:formation_timeout":"Formation Timeout","impeachment:failed":"Impeachment Failed","impeachment:survived":"Survived Impeachment","crisis:sovereign_default":"Sovereign Default"};function h($){return u[$]?u[$]:$.startsWith("crisis:cascade:")?"Crisis Fallout":$.startsWith("crisis:resolved:")?"Crisis Resolved: "+$.slice(16).replace(/_/g," "):$.startsWith("crisis:")?"Crisis: "+$.slice(7).replace(/_/g," "):$.startsWith("protest:")?"Protests":$.startsWith("bill:")?"Legislation":$.startsWith("election:")?"Election":$.startsWith("executive_order:")?"Executive Order":$.replace(/_/g," ").replace(/:/g," — ")}function y($){return $>=60?"#5cb85c":$>=40?"#c8a44e":$>=25?"#d98030":"#d9534f"}let S="";if(A.length===0)S='<div style="font-size:10px;color:var(--dtext-3);font-style:italic;padding:6px 0">No recorded modifiers yet.</div>';else for(const $ of A){const I=Number($.amount),z=I>=0?"+":"",D=I>=0?"#5cb85c":"#d9534f",M=h($.source),q=st($.tick);S+=`
                <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--dborder-0)">
                    <div style="flex:1;min-width:0">
                        <div style="font-size:10px;color:var(--dtext-1);font-family:var(--dfont-ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b(M)}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;margin-left:8px">
                        <span style="font-size:10px;color:var(--dtext-3);font-family:var(--dfont-ui)">${b(q)}</span>
                        <span style="font-size:11px;font-weight:700;font-family:var(--dfont-mono);color:${D};min-width:32px;text-align:right">${z}${I}</span>
                    </div>
                </div>`}const _=g&&g>0?st(g):"Never",C=p!=null&&g>0?m-p:null,T=C!=null?` <span style="font-size:10px;font-weight:600;color:${C>=0?"#5cb85c":"#d9534f"}">(${C>=0?"+":""}${C.toFixed(1)} since poll)</span>`:"",L=N?t.id===E?"GOVERNING — LEAD":"GOVERNING — COALITION":"OPPOSITION",P=N?"#5cb85c":"#d98030";n.innerHTML=`
    <div style="display:flex;flex-wrap:wrap;gap:16px;padding:10px 0">
        <div class="pol-party-card" style="width:380px;height:450px;min-width:300px;display:flex;flex-direction:column">
            <!-- Header -->
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:${d};margin-bottom:4px;font-weight:700">PARTY APPROVAL</div>

            <!-- Party name + status -->
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span style="font-size:14px;font-weight:700;color:var(--dtext-0)">${b(c)}</span>
                <span style="font-size:9px;font-weight:600;color:${P};text-transform:uppercase;letter-spacing:0.5px">${L}</span>
            </div>

            <!-- Approval value -->
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">
                <span style="font-size:28px;font-weight:800;font-family:var(--dfont-mono);color:${y(m)}">${m.toFixed(1)}</span>
                <span style="font-size:11px;color:var(--dtext-3)">/ 100</span>
            </div>

            <!-- Approval bar -->
            <div style="height:6px;border-radius:3px;background:var(--dbg-3);margin-bottom:8px;overflow:hidden">
                <div style="width:${Math.min(100,m)}%;height:100%;background:${y(m)};border-radius:3px;transition:width 0.5s"></div>
            </div>

            <!-- Last poll -->
            <div style="font-size:10px;color:var(--dtext-3);margin-bottom:14px;font-family:var(--dfont-ui)">
                Last Poll Taken — <span style="color:var(--dtext-1)">${b(_)}</span>${T}
            </div>

            <hr style="border:none;border-top:1px solid var(--dborder-0);margin:0 0 10px 0">

            <!-- Modifiers header -->
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--dtext-0);margin-bottom:6px">Modifiers</div>
            <div style="font-size:9px;color:var(--dtext-3);margin-bottom:8px;font-style:italic">Recent events that changed your party's approval</div>

            <!-- Modifier list (scrollable) -->
            <div style="flex:1;overflow-y:auto;min-height:0">
                ${S}
            </div>
        </div>
    </div>`}const Ns=["Corruption","Unemployment","Cost of Living","Infrastructure","Healthcare","Immigration","Education","Climate / Energy"],Rs=[{key:"security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"},{key:"globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"individualism_collectivism",leftLabel:"Individual",rightLabel:"Collectivism"}];async function Ms(t,e,a,r,i,o,s){const v=document.getElementById("other-parties-container");if(!v)return;const n=(a||[]).filter(u=>u.id!==t.id);if(n.length===0){v.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No rival parties found.</div>';return}const d={};for(const u of r||[])d[u.faction_id]=u;const c=n.map(u=>u.id),{data:w}=c.length>0?await R.from("faction_electoral_standing").select("faction_id, party_approval, credibility_modifier").in("faction_id",c):{data:[]},l={},x={};for(const u of w||[]){l[u.faction_id]=Math.round(u.party_approval??40);const h=Number(u.credibility_modifier??1);x[u.faction_id]=Math.round(Math.max(0,Math.min(100,(h-.5)*100)))}const{data:f}=await R.from("factions").select("id, leader_first_name, leader_last_name, leader_age, founded_tick, ideology_value_1, ideology_value_2").in("id",c),m={};for(const u of f||[])m[u.id]=u;const p=i&&i.party_ids?i.party_ids:[],g=i?i.lead_party_id:null,k=n.map(u=>{const h=m[u.id]||{},y=d[u.id]||{},S=h.leader_first_name&&h.leader_last_name?h.leader_first_name+" "+h.leader_last_name:"Vacant",_=h.leader_age||null,C=l[u.id]??40,T=x[u.id]??0,L=Number(u.national_vote_share||0);let P="opposition";return p.includes(u.id)&&(P=u.id===g?"governing_head":"governing_junior"),{id:u.id,name:u.faction_name||"Unknown",abbreviation:u.abbreviation||"??",color:u.party_color||"#888",customLogoUrl:u.custom_logo_url||null,partyLogo:u.party_logo||null,description:u.party_description||"",status:P,foundedTick:h.founded_tick,leaderName:S,leaderAge:_,seats:u.seats||0,totalSeats:o,voteShare:L,approval:C,credibility:T,ideology:{security_freedom:y.security_freedom??0,tradition_progress:y.tradition_progress??0,liberty_equality:y.liberty_equality??0,globalism_nationalism:y.globalism_nationalism??0,individualism_collectivism:y.individualism_collectivism??0},stances:[]}});let E="seats";const N={seats:(u,h)=>h.seats-u.seats,vote_share:(u,h)=>h.voteShare-u.voteShare,approval:(u,h)=>h.approval-u.approval,alignment:(u,h)=>{const y=Object.values(u.ideology).reduce((_,C)=>_+Math.abs(C),0);return Object.values(h.ideology).reduce((_,C)=>_+Math.abs(C),0)-y}};function A(){const h=[...k].sort(N[E]).map(y=>Os(y)).join("");v.innerHTML=`
        <div class="op-top">
            <div class="op-top-left">
                <div class="op-title">Rival Parties — ${b(e.name)}</div>
                <div class="op-note">Stance data based on observable actions. Ideology positions may be estimated.</div>
            </div>
            <div class="op-sort-row">
                <span class="op-sort-label">Sort by</span>
                <button class="op-sort-btn${E==="seats"?" active":""}" data-op-sort="seats">Seats</button>
                <button class="op-sort-btn${E==="vote_share"?" active":""}" data-op-sort="vote_share">Vote Share</button>
                <button class="op-sort-btn${E==="approval"?" active":""}" data-op-sort="approval">Approval</button>
                <button class="op-sort-btn${E==="alignment"?" active":""}" data-op-sort="alignment">Alignment</button>
            </div>
        </div>
        <div class="op-grid">${h}</div>`,v.querySelectorAll(".op-sort-btn").forEach(y=>{y.addEventListener("click",()=>{E=y.getAttribute("data-op-sort"),A()})})}A()}function Os(t,e){const a=t.color,r=Lt(a,.12),i=Lt(a,.35),o=Lt(a,.5),s=Lt(a,.2),v=Lt(a,.06),n=Ne({customLogoUrl:t.customLogoUrl,iconKey:t.partyLogo,size:32,color:a});let d,c;t.status==="governing_head"?(d="GOVERNING — HEAD",c="op-badge-green"):t.status==="governing_junior"?(d="GOVERNING — JUNIOR",c="op-badge-green"):(d="OPPOSITION",c="op-badge-red");const w=t.foundedTick!=null?st(t.foundedTick):null,l=w?`<span class="op-badge op-badge-party" style="color:${a};border-color:${i};font-size:12px">Est. ${b(w)}</span>`:"",x=`<span class="op-badge op-badge-party" style="color:${a};border-color:${i};font-size:12px">Leader: ${b(t.leaderName)}${t.leaderAge?" ("+t.leaderAge+")":""}</span>`,f=t.description?`<div class="op-desc" style="font-size:13px;line-height:1.6">${b(t.description)}</div>`:"",m=t.approval>50?"var(--dgreen)":t.approval>=35?"var(--damber)":"var(--dred)";let p="";for(const y of Rs){const S=t.ideology[y.key]??0,_=(S+100)/2;let C;S>0?C=`left:50%;width:${S/2}%;background:${o}`:S<0?C=`right:50%;width:${Math.abs(S)/2}%;background:${o}`:C=`left:50%;width:0%;background:${o}`,p+=`
        <div class="op-axis">
            <div class="op-axis-poles"><span>${y.leftLabel}</span><span>${y.rightLabel}</span></div>
            <div class="op-axis-track">
                <div class="op-axis-center"></div>
                <div class="op-axis-fill" style="${C}"></div>
                <div class="op-axis-dot" style="left:${_}%;background:${s};border-color:${a}"></div>
            </div>
        </div>`}const g=Object.values(t.ideology).filter(y=>Math.abs(y)>=50).length;let k,E,N;g>=4?(k="var(--dgreen)",E="Strong Conviction",N=`${g} strong positions. Consistent ideological identity across axes.`):g<=1?(k="var(--dred)",E="Weak Conviction",N=`Only ${g} strong position${g===1?"":"s"}. Centrist on most axes — voters may not trust their platform.`):(k="var(--dteal)",E="Established Party",N=`${g} strong positions. Moderate ideological clarity.`);let A="";for(const y of Ns)A+=`
        <div class="op-stance-row">
            <div class="op-stance-issue">${b(y)}</div>
            <span class="op-no-stance">No stance</span>
            <div class="op-bar-wrap"></div>
            <div class="op-stance-score" style="color:var(--dtxt-dim)">—</div>
        </div>`;const u=t.status.startsWith("governing")?`<div class="op-insight" style="border-left-color:var(--dteal)">
            <div class="op-insight-label" style="color:var(--dteal)">No Active Stances</div>
            <div class="op-insight-body">${b(t.abbreviation)} has not taken any public issue stances yet. Watch for campaign actions.</div>
           </div>`:`<div class="op-insight" style="border-left-color:var(--dteal)">
            <div class="op-insight-label" style="color:var(--dteal)">No Active Stances</div>
            <div class="op-insight-body">${b(t.abbreviation)} has not declared any positions. Issue stance system not yet active.</div>
           </div>`,h=t.credibility>50?"var(--dgreen)":t.credibility>=25?"var(--damber)":"var(--dred)";return`
    <div class="op-card" style="background:linear-gradient(135deg, ${v} 0%, var(--dbg-2) 40%);border-color:${i}">
        <div class="op-card-hdr" style="border-bottom-color:${i}">
            <div class="op-logo-wrap" style="background:${r};border:1px solid ${i};border-radius:6px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${n}</div>
            <div class="op-hdr-info">
                <div class="op-name" style="color:${a}">${b(t.name)}</div>
                <div class="op-meta">
                    <span class="op-badge ${c}">${d}</span>
                    ${l}
                    ${x}
                </div>
            </div>
        </div>
        ${f}
        <div class="op-body">
            <div class="op-col-left">
                <div class="op-sec-label">Party Stats</div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Seats</span>
                    <span class="op-sr-val" style="color:${a}">${t.seats} <span style="color:var(--dtext-3);font-size:9px;font-weight:400">/ ${t.totalSeats}</span></span>
                </div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Approval</span>
                    <span class="op-sr-val" style="color:${m}">${t.approval}%</span>
                </div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Credibility</span>
                    <span class="op-sr-val" style="color:${h}">${t.credibility}%</span>
                </div>
                <div class="op-rule"></div>
                <div class="op-sec-label">Ideology Axes</div>
                ${p}
                <div class="op-insight" style="border-left-color:${k}">
                    <div class="op-insight-label" style="color:${k}">${E}</div>
                    <div class="op-insight-body">${N}</div>
                </div>
            </div>
            <div class="op-col-right">
                <div class="op-sec-label">Active Issue Stances</div>
                ${A}
                ${u}
            </div>
        </div>
    </div>`}function Lt(t,e){const a=t.replace("#",""),r=parseInt(a.substring(0,2),16)||0,i=parseInt(a.substring(2,4),16)||0,o=parseInt(a.substring(4,6),16)||0;return`rgba(${r},${i},${o},${e})`}
