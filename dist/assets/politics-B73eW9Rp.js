const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/bills-B3AzSrkp.js","assets/config-BIsh65GI.js","assets/government-structure-I-7nGhki.js","assets/stats-Cb8eW3Os.js"])))=>i.map(i=>d[i]);
import{_ as I}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as ws,g as ze,_ as _t}from"./common-DnQvEMW5.js";import"./guide-C4vj_XhJ.js";import{c as Rt,P as ks,b as Ss,g as Tt}from"./party-icons-CJ7uQoDE.js";import{t as $e}from"./utils-C2W-HleY.js";import{initGameConfigForNation as Cs,switchPartyEndorsement as Es}from"./config-BIsh65GI.js";import{l as Ls,j as Vt,d as oe,a1 as As,k as Is,i as Wt}from"./government-structure-I-7nGhki.js";import"./trade-constants-jmQWZaN8.js";import{N as Kt,s as Yt}from"./stats-Cb8eW3Os.js";import{d as Ps,B as Ts,E as Ns,F as Xt,G as be,H as Ms,S as ae,J as ie,R as Os,K as Jt,L as wt,t as Nt,M as Rs,O as zs,Q as Bs,T as Te,U as Ds,V as Hs,W as qs,X as Fs,Y as Gs,Z as Us,_ as js,$ as zt,a0 as Vs,a1 as Ws,a2 as Ks,a3 as Ys,a4 as Xs,f as Js,a5 as Zt,a6 as Zs,a7 as $t}from"./bills-B3AzSrkp.js";import{g as Qt,c as Qs,P as Ge,e as ea,d as es,f as ta,i as ts,h as sa,j as aa,k as oa,l as ss,m as ia,n as na,o as la}from"./protest-DXVJjfe8.js";import"./messaging-5qyQ6ziq.js";const Ut=6;function ra({isPresidentialSystem:e=!1,scheduledElections:t=[],currentTick:s=0,playerSeats:p=0}={}){const i=(t||[]).filter(c=>c&&c.election_type==="presidential"&&Number.isFinite(Number(c.election_tick))).sort((c,d)=>Number(c.election_tick)-Number(d.election_tick))[0]||null;let n="",o=null,v=null,l=!1;return e?i?(o=Number(i.election_tick)-Number(s),o<=0?(n="This election has already fired; endorsement is locked for this cycle.",o=null):o>Ut?(v=o-Ut,n="No presidential election is in the eligible window."):Number(p)<=0&&(n="Your party is not eligible to endorse in this cycle.")):n="No presidential election is in the eligible window.":(l=!0,n="No presidential election is in the eligible window."),{disabled:!!n,disabledReason:n,ticksUntilElection:o,ticksUntilWindow:v,hidden:l}}function Q(e,t=!0){const s=document.getElementById("pol-toast");s&&s.remove();const p=document.createElement("div");p.id="pol-toast",p.style.cssText=`position:fixed;top:20px;right:20px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:13px;font-family:var(--dfont-mono);max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s;${t?"background:#2d1517;color:#f87171;border:1px solid #7f1d1d;":"background:#1a2e1a;color:#86efac;border:1px solid #14532d;"}`,p.textContent=e,document.body.appendChild(p),setTimeout(()=>{p.style.opacity="0",setTimeout(()=>p.remove(),300)},4e3)}ws("politics",async e=>{const{nation:t,faction:s,shard:p}=e;if(!t||!s){document.getElementById("content-area").innerHTML='<div class="pol-loading">No nation or party data available.</div>';return}await Cs(I,t.id);const i=s,n=p?.current_tick||0,{data:o}=await I.from("factions").select("id, seats, national_vote_share, faction_name, abbreviation, party_color, standing, loyalty, last_seen_tick, leader_first_name, leader_last_name, custom_logo_url, party_logo, party_description, momentum, momentum_log").eq("nation_id",t.id).eq("faction_type","party"),v=(o||[]).map(N=>N.id),{data:l}=v.length>0?await I.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism").in("faction_id",v):{data:[]},{currentSeats:c}=await Ls(I,t.id,o||[],i.id),d=(o||[]).reduce((N,q)=>N+(q.seats||0),0),x=c,{data:r}=await I.from("elections").select("election_tick, results").eq("nation_id",t.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle();let _=Number(i.national_vote_share||0).toFixed(1),h=null,u=null;if(r){h=$e(r.election_tick);const N=r.results,M=(N?.votes||(Array.isArray(N)?N:[])).find(B=>B.party_id===i.id);if(M&&typeof M.vote_percentage=="number"&&(_=M.vote_percentage.toFixed(1)),Array.isArray(N)){const B=N.find(U=>U.party_id===i.id);if(B&&typeof B.seats_won=="number"){const U=typeof B.seats_before=="number"?B.seats_before:null;U!==null&&(u=x-U)}}}const a=await Vt(I,t.id);let g="Opposition";a&&a.party_ids&&a.party_ids.includes(i.id)&&(g=a.lead_party_id===i.id?"Lead — Governing":"Governing Coalition");const{data:C}=await I.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",t.id),{data:k}=await I.from("issue_state").select("issue_id, salience").eq("nation_id",t.id),A={};for(const N of k||[])A[N.issue_id]=N;let{data:m}=await I.from("elections").select("election_tick, election_type").eq("nation_id",t.id).eq("status","scheduled").gt("election_tick",n).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(!m){const N=Number(t.parliamentary_term_ticks)||24;m={election_tick:n+N,election_type:"parliamentary"}}const b=da(i.id,t.name),S={whipFirst:i.whip_first_name||b.whipFirst,whipLast:i.whip_last_name||b.whipLast},{data:$}=await I.from("nations_history").select("gov_approval").eq("nation_id",t.id).eq("tick",n-1).maybeSingle(),y=$?.gov_approval??null,{data:f}=await I.from("presidents").select("id, faction_id, first_name, last_name, age, ideology, trait, trait_upside, trait_downside, elected_tick, term_ends_tick, is_active, terms_served").eq("nation_id",t.id).eq("is_active",!0).order("elected_tick",{ascending:!1}).limit(1).maybeSingle(),{data:E}=await I.from("administrations").select("id, admin_name, government_type, started_at_tick, president_name, president_party_id, president_party_name, stats_at_start").eq("nation_id",t.id).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),{data:L}=await I.from("elections").select("election_tick, results, election_type").eq("nation_id",t.id).eq("status","completed").eq("election_type","parliamentary").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:O}=await I.from("elections").select("election_tick, results, election_type").eq("nation_id",t.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:R}=await I.from("elections").select("election_tick, election_type").eq("nation_id",t.id).eq("status","scheduled").gt("election_tick",n).order("election_tick",{ascending:!0}),{data:T}=await I.from("caucus_factions").select("id, name, dominant_axis, wing_end, seat_share, relationship_score").eq("party_id",i.id).eq("is_active",!0),{data:P}=await I.from("party_endorsement_preferences").select("endorsed_party_id").eq("endorsing_party_id",i.id).maybeSingle();pa(i,t,{shard:p,totalSeats:d,mySeats:x,voteSharePct:_,lastElectionDate:h,seatDelta:u,role:g,coalition:a,currentTick:n,officerNames:S,allParties:o,allPartyIdeologies:l,activeCrises:C,nextElection:m,prevApproval:y,lastParliamentary:L,lastPresidential:O,scheduledElections:R,president:f,administration:E,caucusFactions:T,currentEndorsement:P,issueStateMapInit:A})});function ca(e){const t=e.replace(/-/g,""),p=20+parseInt(t.substring(16,24),16)%51;return Math.max(0,p-10)}function da(e,t=""){const{firstNames:s,lastNames:p}=Ps(t),i=e.replace(/-/g,""),n=parseInt(i.substring(8,12),16),o=parseInt(i.substring(12,16),16);return{whipFirst:s[n%s.length],whipLast:p[o%p.length]}}async function pa(e,t,s){const{shard:p,totalSeats:i,mySeats:n,voteSharePct:o,lastElectionDate:v,seatDelta:l,role:c,officerNames:d,allParties:x,allPartyIdeologies:r,coalition:_,activeCrises:h,currentTick:u,nextElection:a,prevApproval:g,lastParliamentary:C,lastPresidential:k,scheduledElections:A,president:m,administration:b,caucusFactions:S,currentEndorsement:$,issueStateMapInit:y}=s,f=e,E=e.party_color||"#ffcc00",L=Rt({customLogoUrl:e.custom_logo_url,iconKey:e.party_logo,size:36,color:E}),O=$e(e.founded_tick),R=c.includes("Governing")||c.includes("Lead"),T=c.includes("Lead")?"Governing":c,P=c==="Strongman"?"pol-role-strongman":R?"pol-role-gov":"pol-role-opp",N=(r||[]).find(G=>G.faction_id===e.id);let q=null,M=null;if(N){const G=oe.map(se=>({ax:se,score:N[se.key]??0})).sort((se,me)=>Math.abs(me.score)-Math.abs(se.score));G.length>0&&G[0].score!==0&&(q=G[0].score<0?G[0].ax.left:G[0].ax.right),G.length>1&&G[1].score!==0&&(M=G[1].score<0?G[1].ax.left:G[1].ax.right)}q||(q=e.ideology_value_1||null),M||(M=e.ideology_value_2||null);function B(G){if(!G)return"";const se="pol-ideo-"+G.toLowerCase(),me=G.charAt(0).toUpperCase()+G.slice(1).toLowerCase();return`<div class="pol-ideo-box">
            <span class="pol-ideo-label">Ideology</span>
            <span class="pol-ideo-value ${se}">${me}</span>
        </div>`}let U,z;U=e.leader_first_name&&e.leader_last_name?e.leader_first_name+" "+e.leader_last_name:"Vacant",z=e.leader_age?`(${e.leader_age})`:"";const H=e.leader_ideology||q,Y=H?`<span class="pol-leader-ideo pol-ideo-${H.toLowerCase()}">${H.charAt(0).toUpperCase()+H.slice(1).toLowerCase()}</span>`:"",le=e.electability??ca(e.id),re=Ts(le);let ce="";if(l!==null&&l!==0){const G=l>0?"+":"";ce=`<span class="pol-stat-delta ${l>0?"up":"down"}">${G}${l}</span>`}const pt=`
    <div class="pol-page-tabs">
        <button class="pol-page-tab active" data-page-tab="politics">Politics</button>
        <button class="pol-page-tab" data-page-tab="actions">Actions</button>
        <button class="pol-page-tab" data-page-tab="electorate-spread">Electorate</button>
        <button class="pol-page-tab" data-page-tab="elections">Your Party</button>
        <button class="pol-page-tab" data-page-tab="other-parties">Other Parties</button>
    </div>
    <div class="pol-page-content active" data-page-content="politics">
    ${`
    <div class="pol-page">
        <div class="pol-section-label">Politics</div>

        <div class="pol-columns">
        ${$a(t,_,x,u,g,m,b)}
        <div class="pol-party-card">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--green"></div>
            <span class="pol-box-label">Your Party</span>
        </div>
        <div class="pol-box-body">
        <div class="pol-header">
            <div class="pol-logo">${L}</div>
            <div class="pol-header-info">
                <div class="pol-party-name">${w(e.faction_name)} <span style="color:var(--dtext-3);font-size:11px;font-weight:400;font-style:italic;margin-left:4px;">${As(t)}</span></div>
                <div class="pol-meta-row">
                    <span class="pol-role-badge ${P}">${w(T.toUpperCase())}</span>
                    <span class="pol-established">Est. ${O}</span>
                    <span class="pol-leader-badge">Leader: ${w(U)} ${z}</span>
                </div>
            </div>
        </div>
        <div class="pol-ideo-row">
            ${B(q)}
            ${B(M)}
        </div>
        <hr class="pol-divider">
        <div class="pol-leader-section">
            <div class="pol-leader-header">
                <span class="pol-sub-label">Leader</span>
                <button class="pol-leadership-btn" onclick="window.location.href='party-leadership.html'">Party Leadership &rarr;</button>
            </div>
            <div class="pol-leader-name">${w(U)} <span class="pol-leader-age">${z}</span> <span class="pol-leader-electability"><span class="pol-leader-electability-label">Electability: </span><span style="color:${re.color}">${re.label}</span></span></div>
            ${Y}
        </div>
        <div class="pol-officers-row">
            <div class="pol-officer">
                <div class="pol-officer-label">Party Whip</div>
                <div class="pol-officer-name">${w(d.whipFirst+" "+d.whipLast)}</div>
            </div>
        </div>
        <hr class="pol-divider">
        <div class="pol-stats-row">
            <div class="pol-stat-block">
                <div class="pol-stat-label">Seats</div>
                <div class="pol-stat-value">${n}<span class="pol-stat-total">/${i}</span>${ce}</div>
            </div>
        </div>
        ${ya(S,n)}
        </div>
        </div>
        ${ba(x,_,t,e.id)}
        ${xa(x,i,u,a,null,e.id)}
        </div>

        <div class="pol-row-2">
        ${_a(t,h,u,y)}
        <div class="pol-ideology-box" id="stance-summary-container">
            <div class="pol-ideo-header"><div class="pol-box-dot pol-box-dot--orange"></div><span class="pol-mod-title">Stances</span></div>
            <div class="pol-box-body"><div id="stance-summary-strip"></div></div>
        </div>
        ${wa(e,u)}
        </div>

        <div class="pol-row-3">
        ${Sa(C,k,x,{scheduledElections:A,currentTick:u,nation:t,mySeats:n,faction:f,currentEndorsement:$})}

        </div>
        <div class="pol-row-4" style="margin-top:24px;text-align:center">
            <button class="pol-disband-btn" id="pol-disband-party-btn" style="background:transparent;color:#d9534f;border:1px solid #d9534f;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:0.75rem;opacity:0.6;transition:opacity 0.2s" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">Disband Party</button>
            <div style="font-size:0.65rem;color:var(--dtext-3);margin-top:4px">Permanently disband your party and leave the game.</div>
        </div>
    </div>`}
    </div>
    <div class="pol-page-content" data-page-content="actions">
        <div class="pol-page">
            <div id="actions-container"></div>
        </div>
    </div>
    
    <div class="pol-page-content" data-page-content="electorate-spread">
        <div id="electorate-spread-container" class="es-page" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading electorate data...</div>
        </div>
    </div>
    
    <div class="pol-page-content" data-page-content="elections">
        <div id="elections-container" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading election data...</div>
        </div>
    </div>
    
    <div class="pol-page-content" data-page-content="other-parties">
        <div id="other-parties-container" class="op-page" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading rival parties...</div>
        </div>
    </div>`;document.getElementById("content-area").innerHTML=pt;let j=!1,F=!1,he=!1,Pe=!1;document.querySelectorAll(".pol-page-tab").forEach(G=>{G.addEventListener("click",()=>{document.querySelectorAll(".pol-page-tab").forEach(He=>He.classList.remove("active")),document.querySelectorAll(".pol-page-content").forEach(He=>He.classList.remove("active")),G.classList.add("active");const se=G.getAttribute("data-page-tab"),me=document.querySelector(`.pol-page-content[data-page-content="${se}"]`);me&&me.classList.add("active"),se==="actions"&&!j&&(j=!0,rt(t,e,p,x)),se==="electorate-spread"&&!he&&(he=!0,Ja(e,t,x,r,u)),se==="other-parties"&&!F&&(F=!0,Qa(e,t,x,r,_,i,u)),se==="elections"&&!Pe&&(Pe=!0,to(t,b,_,e,x,r,u,c,a,S,n))})}),window.innerWidth>860&&document.querySelectorAll(".pol-admin-box, .pol-party-card, .pol-parliament-box, .pol-forecast-box, .pol-coalition-box, .pol-mood-box, .pol-ideology-box, .pol-identity-box, .pol-election-box, .pol-blocs-box").forEach(G=>{G.style.height="450px"}),ka(e),Ca(),Ea(),Lt(e.id,t.id),fa(t.id,e.id);const de=document.getElementById("pol-disband-party-btn");de&&de.addEventListener("click",async()=>{if(confirm("Are you sure you want to disband your party? This is permanent — your party will be removed from the game after the next tick.")&&confirm("This cannot be undone. Disband your party?")){de.disabled=!0,de.textContent="Disbanding...";try{await Ns(I,t.id,e.id,u),sessionStorage.removeItem("nationhood_state"),await I.auth.signOut(),window.location.href="login.html"}catch(G){Q(G.message||"Failed to disband party."),de.disabled=!1,de.textContent="Disband Party"}}})}const va=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function as(e){return`${va[e%12]} ${2e3+Math.floor(e/12)}`}async function ma(e,t){const s=document.getElementById("party-events-feed");if(!s)return;const{data:p,error:i}=await I.from("activity_log").select("id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at").eq("nation_id",e).order("tick",{ascending:!1}).order("created_at",{ascending:!1}).limit(80);if(i||!p||p.length===0){s.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:12px;padding:12px">No party events yet.</div>';return}const n=[...new Set(p.map(d=>d.faction_id))],{data:o}=await I.from("factions").select("id, faction_name, abbreviation, party_color").in("id",n),v={};for(const d of o||[])v[d.id]=d;let l="",c=null;for(const d of p){d.tick!==c&&(c=d.tick,l+=`<div class="pe-tick-sep">${as(d.tick)}</div>`);const x=v[d.faction_id],r=d.faction_id===t,_=r?"You":x?.abbreviation||"???",h=x?.party_color||"var(--dtext-2)",u=d.outcome==="success"?"var(--dgreen)":d.outcome==="backfire"?"var(--dred)":d.outcome==="failure"?"var(--damber)":"var(--dtext-3)";l+=`<div class="pe-item${r?" pe-item--you":""}">
            <div class="pe-item-row">
                <span class="pe-item-party" style="color:${h}">${w(_)}</span>
                <span class="pe-item-label">${w((d.action_label||d.action_type).replace(/_/g," "))}</span>
                ${d.ap_spent?`<span class="pe-item-ap">${d.ap_spent} AP</span>`:""}
                ${d.outcome?`<span class="pe-item-outcome" style="color:${u}">${w(d.outcome)}</span>`:""}
            </div>
            ${d.description?`<div class="pe-item-desc">${w(d.description)}</div>`:""}
        </div>`}s.innerHTML=l}async function fa(e,t){const s=document.getElementById("gov-card-party-events");if(!s)return;const{data:p,error:i}=await I.from("activity_log").select("id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at").eq("nation_id",e).order("tick",{ascending:!1}).order("created_at",{ascending:!1}).limit(40);if(i||!p||p.length===0){s.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">No party events yet.</div>';return}const n=[...new Set(p.map(d=>d.faction_id))],{data:o}=await I.from("factions").select("id, faction_name, abbreviation, party_color").in("id",n),v={};for(const d of o||[])v[d.id]=d;let l="",c=null;for(const d of p){d.tick!==c&&(c=d.tick,l+=`<div class="pe-tick-sep">${as(d.tick)}</div>`);const x=v[d.faction_id],r=d.faction_id===t,_=r?"You":x?.abbreviation||"???",h=x?.party_color||"var(--dtext-2)",u=d.outcome==="success"?"var(--dgreen)":d.outcome==="backfire"?"var(--dred)":d.outcome==="failure"?"var(--damber)":"var(--dtext-3)";l+=`<div class="pe-item${r?" pe-item--you":""}">
            <div class="pe-item-row">
                <span class="pe-item-party" style="color:${h}">${w(_)}</span>
                <span class="pe-item-label">${w((d.action_label||d.action_type).replace(/_/g," "))}</span>
                ${d.outcome?`<span class="pe-item-outcome" style="color:${u}">${w(d.outcome)}</span>`:""}
            </div>
        </div>`}s.innerHTML=l}function ua(e,t,s){const p=e||"#888",i=t||(s?s.substring(0,2).toUpperCase():"??");return`<div class="pol-mini-logo" style="background:${p}">${w(i)}</div>`}function ga(e,t){if(t?.head_of_state_title&&!Wt(t))return t.head_of_state_title;if(!e)return"Head of Gov.";const s=e.toLowerCase();return s==="democracy"||s.includes("parliament")?"PM":s.includes("president")?"President":"Head of Gov."}function ya(e,t){if(!e||e.length===0)return"";const s={liberty_equality:"Liberty / Equality",tradition_progress:"Tradition / Progress",security_freedom:"Security / Freedom",globalism_nationalism:"Globalism / Nationalism",individualism_collectivism:"Individualism / Collectivism"};let p="";for(const i of e){const n=Math.round(t*i.seat_share),o=`~${Math.max(1,n-2)}–${n+2}`,v=i.relationship_score,l=v>=60?"var(--green)":v>=30?"var(--amber)":"var(--red)",c=v<30?' <span style="color:var(--red);font-size:0.7rem;">VOLATILE</span>':"";p+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-dim);">
            <div>
                <div style="font-size:0.85rem;font-weight:500;">${w(i.name)}</div>
                <div style="font-size:0.75rem;color:var(--text-dim);">${s[i.dominant_axis]||i.dominant_axis} · ${o} seats</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:60px;height:6px;background:var(--border-dim);border-radius:3px;overflow:hidden;">
                    <div style="width:${v}%;height:100%;background:${l};border-radius:3px;"></div>
                </div>
                ${c}
            </div>
        </div>`}return`<hr class="pol-divider">
        <div style="padding:0 0 4px;">
            <div class="pol-sub-label" style="margin-bottom:6px;">Internal Caucuses</div>
            ${p}
        </div>`}function ba(e,t,s,p){const i=e||[],n=i.reduce((y,f)=>y+(f.seats||0),0),o=Math.ceil(n/2);let v,l;v=new Set(t?.party_ids||[]),l=t?.lead_party_id||null;const c=i.filter(y=>v.has(y.id)),d=i.filter(y=>!v.has(y.id)),x=c.reduce((y,f)=>y+(f.seats||0),0),r=d.reduce((y,f)=>y+(f.seats||0),0),_=[...i].sort((y,f)=>(f.seats||0)-(y.seats||0)),h=n>0?_.map(y=>{const f=(y.seats||0)/n*100;if(f<=0)return"";const E=y.party_color||"#888";return`<div class="pol-seat-segment" style="width:${f.toFixed(2)}%;background:${E}"></div>`}).join(""):"",a=`<div class="pol-majority-line" style="left:${(n>0?o/n*100:50).toFixed(2)}%"></div>`,g=ga(s?.government_type,s);function C(y){const f=ua(y.party_color,y.abbreviation,y.faction_name),E=w(y.faction_name||"Unknown"),L=y.seats||0,O=y.id===p,T=[y.id===l?`<span class="pol-hog-pill">${w(g)}</span>`:"",O?'<span class="pol-you-pill">YOU</span>':""].filter(Boolean).join(" ");return`<div class="pol-parl-party-row">
            ${f}
            <span class="pol-parl-party-name">${E}</span>
            ${T}
            <span class="pol-parl-party-seats">${L}</span>
        </div>`}const k=c.length>0?c.sort((y,f)=>(f.seats||0)-(y.seats||0)).map(C).join(""):"",A=d.length>0?d.sort((y,f)=>(f.seats||0)-(y.seats||0)).map(C).join(""):"",m=x-o,b=m>=0,S=b?"pol-margin-positive":"pol-margin-negative",$=b?`+${m} above majority`:`${Math.abs(m)} below majority`;return`
        <div class="pol-parliament-box">
            <div class="pol-parl-header">
                <div class="pol-box-dot pol-box-dot--amber"></div>
                <span class="pol-parl-title">Parliament</span>
                <div class="pol-box-header-right"><span class="pol-parl-seats-count">${n} seats</span></div>
            </div>
            <div class="pol-box-body">
            <div class="pol-seat-bar-wrap">
                <div class="pol-seat-bar">${h}</div>
                ${a}
            </div>

            <div class="pol-section-header">
                <span class="pol-section-title">Governing Coalition</span>
                <span class="pol-section-seats">${x} seats</span>
            </div>
            ${k}

            <div class="pol-section-header">
                <span class="pol-section-title">Opposition</span>
                <span class="pol-section-seats">${r} seats</span>
            </div>
            ${A}

            <div class="pol-margin-row ${S}">
                <span class="pol-margin-dot"></span>
                <span>${$}</span>
            </div>
            </div>
        </div>`}function ha(e){return e>=60?"var(--dred)":e>=40?"var(--damber)":"var(--dgreen)"}function xa(e,t,s,p,i,n){const c=p?.election_tick||0,d=c>s?c-s:0,x=c>0&&d<=12,r=Math.ceil(t/2),_=d<=5?"CAMPAIGN SEASON":d<=10?"MID CYCLE":"EARLY CYCLE",h=d<=5?"var(--dred)":d<=10?"var(--damber)":"var(--dgreen)";if(!x){const f=c>0?d-12:0,E=c>0?`Forecast available in <span style="color:var(--dtxt-secondary);font-weight:700">${f} ticks</span><br>Polling begins 12 ticks before election`:"No election currently scheduled",L=c>0?$e(c):null;return`
            <div class="pol-forecast-box">
                <div class="pol-fc-header">
                    <div class="pol-box-dot pol-box-dot--blue"></div>
                    <span class="pol-mod-title">Election Forecast</span>
                </div>
                <div class="pol-box-body">
                ${L?`<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${L}</span></div>`:""}
                <div class="pol-fc-empty">
                    <div class="pol-fc-empty-title">Insufficient polling data</div>
                    <div class="pol-fc-empty-detail">${E}</div>
                </div>
                </div>
            </div>`}const u=Math.max(1,12-(12-d)),g=(e||[]).filter(f=>Number(f.national_vote_share||0)<=0?!1:f.last_seen_tick!=null?s-f.last_seen_tick<12:s-(f.founded_tick||0)<12).map(f=>{const E=Number(f.national_vote_share||0),L=Math.round(E/100*t);return{...f,estSeats:L,momentum:Number(f.momentum??0)}}).sort((f,E)=>E.estSeats-f.estSeats),C=u>=10?"VERY LOW":u>=7?"LOW":u>=5?"MODERATE":u>=3?"HIGH":"VERY HIGH",k=u>=10?"var(--dred)":u>=7||u>=5?"var(--damber)":u>=3?"#22d3ee":"var(--dgreen)",A=(12-d)/12*100,m=g.map(f=>{const E=Math.max(f.estSeats-u,0),L=Math.min(f.estSeats+u,t),O=E/t*100,R=L/t*100,T=f.party_color||"#888",P=f.abbreviation||(f.faction_name||"??").substring(0,2).toUpperCase(),N=f.id===n,q=f.momentum>0?"var(--dgreen)":f.momentum<0?"var(--dred)":"var(--dtxt-muted)",M=f.momentum>0?"▲":f.momentum<0?"▼":"—",B=f.momentum!==0?`${M}${Math.abs(f.momentum)}`:M,U=t>0?r/t*100:50;return`<div class="pol-fc-party">
            <div class="pol-fc-party-header">
                <div class="pol-fc-party-left">
                    <div class="pol-fc-party-dot" style="background:${T}"></div>
                    <span class="pol-fc-party-abbr" style="color:${T}">${w(P)}</span>
                    ${N?'<span class="pol-ideo-legend-you">YOU</span>':""}
                </div>
                <div class="pol-fc-party-right">
                    <span class="pol-fc-momentum" style="color:${q}">${B}</span>
                    <span class="pol-fc-range">${E}–${L}</span>
                    <span class="pol-fc-seats-label">seats</span>
                </div>
            </div>
            <div class="pol-fc-band">
                <div class="pol-fc-band-fill" style="left:${O.toFixed(1)}%;width:${(R-O).toFixed(1)}%;background:${T}22;border-color:${T}33"></div>
                <div class="pol-fc-maj-line" style="left:${U.toFixed(1)}%"></div>
            </div>
        </div>`}).join(""),b=g.find(f=>f.id===n),S=g.find(f=>f.id!==n);let $="";if(b&&S){const f=Math.max(b.estSeats-u,0),E=Math.min(b.estSeats+u,t),L=Math.max(S.estSeats-u,0),O=Math.min(S.estSeats+u,t),R=Math.max(0,Math.min(E,O)-Math.max(f,L)),T=E-f,P=T>0?Math.round(R/T*100):0,N=b.abbreviation||"YOU",q=S.abbreviation||"RIVAL",M=P>70?"TOO CLOSE TO CALL":P>30?"COMPETITIVE":P>0?b.estSeats>S.estSeats?`LEANING ${N}`:`LEANING ${q}`:b.estSeats>S.estSeats?`${N} LEADS`:`${q} LEADS`,B=P>70?"var(--dred)":P>30?"var(--damber)":"var(--dgreen)",U=P>70?`${N} and ${q} seat ranges fully overlap. Outcome is uncertain.`:P>30?"Bands are narrowing. Late campaigns could decide the race.":P>0?"Leading party is emerging, but the gap is not yet decisive.":"Ranges no longer overlap. Leader is identifiable.";$=`
            <div class="pol-fc-status" style="background:${B}08;border-color:${B}">
                <div class="pol-fc-status-header">
                    <span class="pol-fc-status-label" style="color:${B}">${w(M)}</span>
                    <span class="pol-fc-status-overlap">${P}% overlap</span>
                </div>
                <div class="pol-fc-status-desc">${U}</div>
            </div>`}const y=c>0?$e(c):null;return`
        <div class="pol-forecast-box">
            <div class="pol-fc-header">
                <div class="pol-box-dot pol-box-dot--blue"></div>
                <span class="pol-mod-title">Election Forecast</span>
                <div class="pol-box-header-right"><span class="pol-fc-phase" style="color:${h};background:${h}15">${_}</span></div>
            </div>
            <div class="pol-box-body">
            ${y?`<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${y}</span></div>`:""}
            <div class="pol-fc-countdown">
                <div>
                    <span class="pol-fc-ticks-big" style="color:${h}">${d}</span>
                    <span class="pol-fc-ticks-label">ticks</span>
                </div>
                <div style="text-align:right">
                    <div style="display:flex;align-items:center;gap:4px;justify-content:flex-end">
                        <span class="pol-fc-margin-label">Margin:</span>
                        <span class="pol-fc-margin-val" style="color:${k}">±${u} seats</span>
                    </div>
                    <span class="pol-fc-conf-badge" style="color:${k};background:${k}15">${C} CONFIDENCE</span>
                </div>
            </div>
            <div class="pol-fc-conf-bar">
                <div class="pol-fc-conf-fill" style="width:${A.toFixed(0)}%;background:${k}"></div>
            </div>
            ${m}
            <div class="pol-fc-maj-legend">
                <div class="pol-fc-maj-dash"></div>
                <span class="pol-fc-maj-text">Majority: ${r} seats</span>
            </div>
            ${$}
            </div>
        </div>`}function _a(e,t,s,p){const i=t||[];let n;i.length===0?n='<div class="pol-mood-no-crises">No active crises</div>':n=i.map(l=>{const c=l.crisis_templates?.name||"Unknown Crisis",d=s-(l.started_at_tick||0);return`<div class="pol-mood-crisis">
                <span class="pol-mood-crisis-name">${w(c)}</span>
                <span class="pol-mood-crisis-dur">${d}t</span>
            </div>`}).join("");const v=Xt.map(l=>{const c=be[l],d=Number(p?.[l]?.salience??30);return{id:l,name:c.label,salience:d,statKeys:c.stats}}).sort((l,c)=>c.salience-l.salience).map(l=>{const c=ha(l.salience),d=l.statKeys.map(x=>{const r=Math.round(Number(e[x]??0)),_=x.replace(/_/g," ").replace(/\b\w/g,h=>h.toUpperCase());return`<div class="pol-mood-stat-row">
                <span class="pol-mood-stat-name">${w(_)}</span>
                <span class="pol-mood-stat-val">${r}</span>
            </div>`}).join("");return`<div class="pol-mood-issue-wrap">
            <div class="pol-mood-issue" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.pol-mood-chevron').textContent=this.nextElementSibling.classList.contains('open')?'▾':'▸'">
                <span class="pol-mood-issue-name">${w(l.name)}</span>
                <div class="pol-mood-issue-bar-wrap">
                    <div class="pol-mood-issue-bar" style="width:${l.salience}%;background:${c}"></div>
                </div>
                <span class="pol-mood-issue-pct">${l.salience}%</span>
                <span class="pol-mood-chevron">▸</span>
            </div>
            <div class="pol-mood-stats">${d}</div>
        </div>`}).join("");return`
        <div class="pol-mood-box">
            <div class="pol-mood-header">
                <div class="pol-box-dot pol-box-dot--red"></div>
                <span class="pol-mood-title">Electorate Issues</span>
            </div>
            <div class="pol-box-body">
            <div class="pol-mood-subtitle">Shows which issues matter most to the electorate.</div>
            ${n}
            ${v}
            </div>
        </div>`}function $a(e,t,s,p,i,n,o){const v=Is(e),l=s||[],c=Math.round(Number(e.gov_approval??40)),d=c>=50?"var(--dgreen)":c>=35?"var(--damber)":"var(--dred)",x=o?.admin_name||"Government",r=v?"Presidential":e?.hos_election_method==="hereditary"?"Constitutional Monarchy":"Parliamentary",_=new Set(t?.party_ids||[]),h=l.filter(L=>_.has(L.id)),u=h.reduce((L,O)=>L+(O.seats||0),0),a=l.reduce((L,O)=>L+(O.seats||0),0),g=Math.ceil(a/2),C=u>=g,k=h.length>1?"Coalition":h.length===1?"Single Party":"";function A(L,O){return((L||"?")[0]+(O||"?")[0]).toUpperCase()}let m="";if(v&&n){const L=l.find(N=>N.id===n.faction_id),O=L?.party_color||"#888",R=L?.abbreviation||(L?.faction_name||"??").substring(0,3).toUpperCase(),T=n.terms_served>1?n.terms_served===2?"2nd":n.terms_served+"th":"1st",P=A(n.first_name,n.last_name);m=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${w(P)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${w(n.first_name+" "+n.last_name)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">President &middot; Age ${n.age||"?"} &middot; ${T} Term</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${O}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${O}">${w(R)}</span>
            </div>
          </div>
        </div>`}else if(!v&&t){const L=l.find(N=>N.id===t.lead_party_id),O=L?.party_color||"#888",R=L?.faction_name||"Unknown",T=L?.abbreviation||R.substring(0,3).toUpperCase(),P=R.split(/\s+/).map(N=>N[0]).join("").toUpperCase().slice(0,2);m=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${w(P)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${w(R)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of Government</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${O}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${O}">${w(T)}</span>
            </div>
          </div>
        </div>`}let b="";const S=e.head_of_state_first_name||"",$=e.head_of_state_last_name||"";if(v&&S&&$){const L=A(S,$);b=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${w(L)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${w(S+" "+$)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Vice President</div>
          </div>
        </div>`}else if(!v&&S&&$){const L=A(S,$);b=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${w(L)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${w(S+" "+$)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of State</div>
          </div>
        </div>`}const y=[...h].sort((L,O)=>(O.seats||0)-(L.seats||0));a>0&&y.map(L=>{const O=(L.seats||0)/a*100;return O<=0?"":`<div style="width:${O.toFixed(2)}%;height:100%;background:${L.party_color||"#888"}"></div>`}).join(""),y.map(L=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
            <div style="width:7px;height:7px;border-radius:2px;background:${L.party_color||"#888"};flex-shrink:0"></div>
            <span style="font-family:var(--dfont-ui);font-size:12px;color:var(--dtext-0);flex:1">${w(L.faction_name||"Unknown")}</span>
            <span style="font-family:var(--dfont-mono);font-size:12px;font-weight:600;color:${L.party_color||"var(--dtext-0)"}">${L.seats||0}</span>
        </div>`).join("");const f=C?"Majority Government":"Minority Government",E=`${u}/${a} seats (${g} needed)`;return`<div class="pol-admin-box">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Government</span>
        </div>
        <div class="pol-box-body">
        <div style="font-family:var(--dfont-ui);font-size:16px;font-weight:700;color:var(--dtext-0);margin-bottom:8px">${w(x)}</div>
        <div style="display:flex;gap:6px;margin-bottom:16px">
            <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${w(r)}</span>
            ${k?`<span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${w(k)}</span>`:""}
        </div>

        ${m}
        ${b}

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Approval</div>
        <div style="font-family:var(--dfont-mono);font-size:28px;font-weight:700;line-height:1;color:${d}">${c}%</div>
        <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:4px;display:flex;align-items:center;gap:8px">
            <span style="text-transform:uppercase;font-weight:600">${w(f)}</span>
            <span style="font-weight:400">${w(E)}</span>
        </div>

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Party Events</div>
        <div id="gov-card-party-events" class="pe-feed" style="max-height:200px;overflow-y:auto;font-size:11px">
            <div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">Loading events...</div>
        </div>
        </div>
    </div>`}const xe=360,st=200,Je=256;function wa(e,t){const s=e.party_color||"#ffcc00",p=e.party_logo||"flag",i=e.party_description||"",n=e.action_points||0,o=e.last_rename_tick||0,v=o>0?Math.max(0,xe-(t-o)):0,l=v>0,c=!!e.custom_logo_url,d=Rt({customLogoUrl:e.custom_logo_url,iconKey:p,size:20,color:s}),x=ks.map(a=>`<div class="pol-id-swatch${a.hex.toLowerCase()===s.toLowerCase()?" selected":""}" data-color="${a.hex}" title="${a.label}" style="background:${a.hex}"></div>`).join(""),r={};for(const[a,g]of Object.entries(Ss)){const C=g.category||"Other";r[C]||(r[C]=[]),r[C].push({key:a,label:g.label})}let _="";for(const[a,g]of Object.entries(r)){_+=`<div class="pol-id-icon-cat">${w(a)}</div><div class="pol-id-icon-grid">`;for(const C of g){const k=C.key===p?" selected":"",A=Tt(C.key,16,C.key===p?s:"#888");_+=`<div class="pol-id-icon-tile${k}" data-icon="${C.key}" title="${w(C.label)}" style="color:${C.key===p?s:"#888"}">${A}</div>`}_+="</div>"}let h,u;if(l){const g=`
            <div class="pol-id-cooldown">
                <span class="pol-id-cooldown-label">Rename cooldown</span>
                <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:${(v/xe*100).toFixed(1)}%"></div></div>
                <span class="pol-id-cooldown-ticks">${v}t</span>
            </div>`;h=g,u=g}else h=`
            <button class="pol-id-rename-btn" id="pol-id-rename-btn">
                <span>Rename Party</span>
                <span class="pol-id-rename-cost">${xe}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-rename-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-rename-input" placeholder="Enter new party name…" maxlength="60">
                    <button class="pol-id-rename-confirm" id="pol-id-rename-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-rename-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${xe} ticks</span></span>
                </div>
                <div class="pol-id-error" id="pol-id-rename-error" style="display:none"></div>
            </div>`,u=`
            <button class="pol-id-rename-btn" id="pol-id-abbr-btn">
                <span>Change Abbreviation</span>
                <span class="pol-id-rename-cost">${xe}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-abbr-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-abbr-input" placeholder="2–4 letters" maxlength="4" style="text-transform:uppercase;font-family:var(--dfont-mono);font-weight:700;letter-spacing:0.1em;width:80px">
                    <button class="pol-id-rename-confirm" id="pol-id-abbr-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-abbr-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${xe} ticks</span></span>
                </div>
                <div class="pol-id-error" id="pol-id-abbr-error" style="display:none"></div>
            </div>`;return`<div class="pol-identity-box" id="pol-identity-box"
        data-faction-id="${e.id}"
        data-selected-color="${s}"
        data-selected-icon="${p}"
        data-current-tick="${t}">

        <!-- Header -->
        <div class="pol-id-header">
            <div class="pol-box-dot pol-box-dot--amber"></div>
            <span class="pol-id-title">Party Identity</span>
            <div class="pol-box-header-right">
                <div class="pol-id-preview" id="pol-id-preview" style="border:2px solid ${s};background:${s}18">
                    ${d}
                </div>
            </div>
        </div>
        <div class="pol-box-body">

        <!-- Party Name -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="pol-id-section-label">Party Name</span>
                <span class="pol-id-ap-badge">AP: <span id="pol-id-ap-display">${n}</span></span>
            </div>
            <div class="pol-id-name-display">
                <span id="pol-id-current-name">${w(e.faction_name)}</span>
                <span>current</span>
            </div>
            ${h}
        </div>
        <div class="pol-id-divider"></div>

        <!-- Abbreviation -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="pol-id-section-label">Abbreviation</span>
            </div>
            <div class="pol-id-name-display">
                <span id="pol-id-current-abbr">${w(e.abbreviation||"???")}</span>
                <span>current</span>
            </div>
            ${u}
        </div>
        <div class="pol-id-divider"></div>

        <!-- Description -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span class="pol-id-section-label">Description</span>
                <span class="pol-id-char-count${i.length>st*.9?" warn":""}" id="pol-id-char-count">${i.length} / ${st}</span>
            </div>
            <textarea class="pol-id-desc" id="pol-id-desc" rows="3" maxlength="${st}">${w(i)}</textarea>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Party Color -->
        <div style="margin-bottom:14px">
            <span class="pol-id-section-label">Party Color</span>
            <div class="pol-id-colors" id="pol-id-colors">${x}</div>
            <div class="pol-id-hex-row">
                <span class="pol-id-hex-label">Custom hex</span>
                <input class="pol-id-hex-input" id="pol-id-hex-input" value="${s}" maxlength="7">
                <div class="pol-id-hex-preview" id="pol-id-hex-preview" style="background:${s}"></div>
            </div>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Party Logo -->
        <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span class="pol-id-section-label">Party Logo</span>
                <div class="pol-id-tab-bar">
                    <button class="pol-id-tab${c?"":" active"}" data-tab="icon">Icon</button>
                    <button class="pol-id-tab${c?" active":""}" data-tab="custom">Custom Image</button>
                </div>
            </div>
            <div id="pol-id-icon-section"${c?' style="display:none"':""}>${_}</div>
            <div id="pol-id-upload-section"${c?"":' style="display:none"'}>
                <div class="pol-id-upload-zone${c?" has-image":""}" id="pol-id-upload-zone">
                    ${c?`
                        <img class="pol-id-upload-preview" src="${e.custom_logo_url}" alt="preview" style="border:2px solid ${s}">
                        <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Je}KB · Best at 128×128px</div>
                    `:`
                        <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                        <div class="pol-id-upload-text">Click to upload logo</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Je}KB · Best at 128×128px</div>
                    `}
                </div>
                <input type="file" accept="image/*" id="pol-id-file-input" style="display:none">
                <div class="pol-id-error" id="pol-id-upload-error" style="display:none"></div>
                <button class="pol-id-remove-btn" id="pol-id-remove-btn"${c?"":' style="display:none"'}>Remove Image</button>
            </div>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Footer -->
        <div class="pol-id-footer">
            <div class="pol-id-footer-hint">Preview updates live ↗</div>
            <button class="pol-id-save-btn" id="pol-id-save-btn">Save Changes</button>
        </div>
        </div>
    </div>`}function ka(e){const t=document.getElementById("pol-identity-box");if(!t)return;const s=document.getElementById("pol-id-preview"),p=document.getElementById("pol-id-colors"),i=document.getElementById("pol-id-hex-input"),n=document.getElementById("pol-id-hex-preview"),o=document.getElementById("pol-id-desc"),v=document.getElementById("pol-id-char-count"),l=document.getElementById("pol-id-save-btn"),c=document.getElementById("pol-id-rename-btn"),d=document.getElementById("pol-id-rename-form"),x=document.getElementById("pol-id-rename-input"),r=document.getElementById("pol-id-rename-confirm"),_=document.getElementById("pol-id-rename-cancel"),h=document.getElementById("pol-id-rename-error"),u=document.getElementById("pol-id-abbr-btn"),a=document.getElementById("pol-id-abbr-form"),g=document.getElementById("pol-id-abbr-input"),C=document.getElementById("pol-id-abbr-confirm"),k=document.getElementById("pol-id-abbr-cancel"),A=document.getElementById("pol-id-abbr-error"),m=document.getElementById("pol-id-current-abbr"),b=document.getElementById("pol-id-current-name");document.getElementById("pol-id-ap-display");const S=document.getElementById("pol-id-icon-section"),$=document.getElementById("pol-id-upload-section"),y=document.getElementById("pol-id-upload-zone"),f=document.getElementById("pol-id-file-input"),E=document.getElementById("pol-id-upload-error"),L=document.getElementById("pol-id-remove-btn");let O=null,R=null,T=!!e.custom_logo_url,P=e.custom_logo_url||null;function N(){return t.dataset.selectedColor}function q(){return t.dataset.selectedIcon}function M(){const z=N();if(s.style.border="2px solid "+z,s.style.background=z+"18",T&&(O||P)){const H=O||P;s.innerHTML='<img src="'+H+'" alt="" style="width:100%;height:100%;object-fit:cover">'}else s.innerHTML=Tt(q(),20,z)}function B(){const z=N(),H=q();t.querySelectorAll(".pol-id-icon-tile").forEach(Y=>{const le=Y.dataset.icon,re=le===H;Y.classList.toggle("selected",re),Y.style.color=re?z:"#888",Y.innerHTML=Tt(le,16,re?z:"#888")})}function U(){const z=N().toLowerCase();t.querySelectorAll(".pol-id-swatch").forEach(H=>{H.classList.toggle("selected",H.dataset.color.toLowerCase()===z)})}p&&p.addEventListener("click",z=>{const H=z.target.closest(".pol-id-swatch");H&&(t.dataset.selectedColor=H.dataset.color,i.value=H.dataset.color,n.style.background=H.dataset.color,U(),B(),M())}),i&&i.addEventListener("input",()=>{const z=i.value;/^#[0-9a-fA-F]{6}$/.test(z)?(t.dataset.selectedColor=z,n.style.background=z,U(),B(),M()):n.style.background="var(--dtext-3)"}),S&&S.addEventListener("click",z=>{const H=z.target.closest(".pol-id-icon-tile");H&&(t.dataset.selectedIcon=H.dataset.icon,T=!1,B(),M())}),t.querySelectorAll(".pol-id-tab").forEach(z=>{z.addEventListener("click",()=>{t.querySelectorAll(".pol-id-tab").forEach(Y=>Y.classList.remove("active")),z.classList.add("active");const H=z.dataset.tab==="icon";S.style.display=H?"":"none",$.style.display=H?"none":""})}),y&&y.addEventListener("click",()=>f.click()),f&&f.addEventListener("change",z=>{const H=z.target.files[0];if(!H)return;if(E.style.display="none",H.size>Je*1024){E.textContent="⚠ File too large — max "+Je+"KB.",E.style.display="";return}if(!H.type.startsWith("image/")){E.textContent="⚠ Must be PNG, JPG, SVG, or WebP.",E.style.display="";return}const Y=new FileReader;Y.onload=le=>{O=le.target.result,R=H,T=!0,y.classList.add("has-image"),y.innerHTML=`
                    <img class="pol-id-upload-preview" src="${O}" alt="preview" style="border:2px solid ${N()}">
                    <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                    <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Je}KB · Best at 128×128px</div>`,L.style.display="",M()},Y.readAsDataURL(H)}),L&&L.addEventListener("click",()=>{O=null,R=null,T=!1,P=null,y.classList.remove("has-image"),y.innerHTML=`
                <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                <div class="pol-id-upload-text">Click to upload logo</div>
                <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Je}KB · Best at 128×128px</div>`,L.style.display="none",M()}),o&&v&&o.addEventListener("input",()=>{const z=o.value.length;v.textContent=z+" / "+st,v.classList.toggle("warn",z>st*.9)}),u&&a&&u.addEventListener("click",()=>{u.style.display="none",a.style.display="",g.focus()}),k&&k.addEventListener("click",()=>{a.style.display="none",u.style.display="",g.value="",A.style.display="none",g.classList.remove("has-error")}),g&&g.addEventListener("input",()=>{g.value=g.value.toUpperCase()}),C&&C.addEventListener("click",async()=>{if(C.disabled)return;A.style.display="none",g.classList.remove("has-error");const z=g.value.trim().toUpperCase();if(z.length<2||z.length>4){A.textContent="⚠ Must be 2–4 letters.",A.style.display="",g.classList.add("has-error");return}C.disabled=!0;const H=parseInt(t.dataset.currentTick)||0,{error:Y}=await I.from("factions").update({abbreviation:z,last_rename_tick:H}).eq("id",e.id);if(Y){A.textContent="⚠ Failed to save — try again.",A.style.display="",C.disabled=!1;return}m.textContent=z,a.style.display="none",g.value="",u.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${xe}t</span>
                </div>`,c&&(d.style.display="none",c.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${xe}t</span>
                    </div>`)}),c&&d&&c.addEventListener("click",()=>{c.style.display="none",d.style.display="",x.focus()}),_&&_.addEventListener("click",()=>{d.style.display="none",c.style.display="",x.value="",h.style.display="none",x.classList.remove("has-error")}),r&&r.addEventListener("click",async()=>{h.style.display="none",x.classList.remove("has-error");const z=x.value.trim();if(!z){h.textContent="⚠ Name cannot be empty.",h.style.display="",x.classList.add("has-error");return}if(z.length<3){h.textContent="⚠ Minimum 3 characters.",h.style.display="",x.classList.add("has-error");return}const H=parseInt(t.dataset.currentTick)||0,{error:Y}=await I.from("factions").update({faction_name:z,last_rename_tick:H}).eq("id",e.id);if(Y){h.textContent="⚠ Failed to save — try again.",h.style.display="";return}b.textContent=z,d.style.display="none",x.value="",c.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${xe}t</span>
                </div>`,u&&(a.style.display="none",u.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${xe}t</span>
                    </div>`)}),l&&l.addEventListener("click",async()=>{l.disabled=!0,l.textContent="Saving...";let z=P;if(T&&R){const re=R.name.split(".").pop()||"png",ce=`party-logos/${e.id}/${Date.now()}.${re}`,{error:Ae}=await I.storage.from("public-assets").upload(ce,R,{contentType:R.type,upsert:!0});if(Ae){console.error("Logo upload failed:",Ae.message),l.textContent="⚠ Upload failed",l.disabled=!1,setTimeout(()=>{l.textContent="Save Changes"},2e3);return}const{data:Be}=I.storage.from("public-assets").getPublicUrl(ce);z=Be?.publicUrl||null,P=z,R=null}const H={party_color:N(),party_logo:T?null:q(),custom_logo_url:T?z:null,party_description:o?o.value.slice(0,st):""},{data:Y,error:le}=await I.from("factions").update(H).eq("id",e.id).select("id");if(le){Q("Save failed: "+le.message),l.disabled=!1,l.textContent="Save Changes";return}if(!Y||Y.length===0){Q("Save failed: no rows updated (permission denied?)"),l.disabled=!1,l.textContent="Save Changes";return}sessionStorage.removeItem("nationhood_state"),l.textContent="✓ Saved",l.classList.add("saved"),l.disabled=!1,setTimeout(()=>{l.textContent="Save Changes",l.classList.remove("saved")},2e3)})}function Sa(e,t,s,{scheduledElections:p,currentTick:i,nation:n,mySeats:o,faction:v,currentEndorsement:l}={}){const c={},d={};(s||[]).forEach(S=>{c[S.id]=S.party_color||"#888",d[S.id]=S.seats||0});function x(S){if(!S)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const $=S.results;if(!$||!$.votes)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const y=$e(S.election_tick),f=new Set($.votes.map(T=>T.party_id)),E=(s||[]).filter(T=>!f.has(T.id)&&(d[T.id]||0)>0).map(T=>({party_id:T.id,party_name:T.faction_name,votes:0,vote_percentage:0,seats:d[T.id]||0})),L=[...$.votes,...E].map(T=>({...T,seats:d[T.party_id]??T.seats??0})).sort((T,P)=>(P.seats||0)-(T.seats||0)),O=Math.max(...L.map(T=>T.vote_percentage||0),1);let R=L.map(T=>{const P=c[T.party_id]||"#888",N=(T.vote_percentage||0).toFixed(1),q=Math.round((T.vote_percentage||0)/O*100);return`<tr>
                <td><span class="pol-el-color-dot" style="background:${P}"></span>${w(T.party_name)}</td>
                <td>${(T.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${q}%;background:${P}"></div></div></td>
                <td>${N}%</td>
                <td>${T.seats||0}</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${y}</div>
            <div class="pol-el-summary">Turnout: ${($.turnout_pct||0).toFixed(1)}% &middot; ${($.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Party</th><th>Votes</th><th></th><th>%</th><th>Seats</th></tr></thead>
                <tbody>${R}</tbody>
            </table>`}function r(S,$,y,f){const E=[...S].sort((R,T)=>(T.votes||0)-(R.votes||0)),L=Math.max(...E.map(R=>R.vote_percentage||0),1);let O=E.map(R=>{const T=c[R.faction_id]||"#888",P=(R.vote_percentage||0).toFixed(1),N=Math.round((R.vote_percentage||0)/L*100),q=R.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";return`<tr>
                <td><span class="pol-el-color-dot" style="background:${T}"></span>${w(R.candidate_name)}${q}</td>
                <td>${w(R.party_name)}</td>
                <td>${(R.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${N}%;background:${T}"></div></div></td>
                <td>${P}%</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${$}</div>
            <div class="pol-el-summary">Turnout: ${(y||0).toFixed(1)}% &middot; ${(f||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${O}</tbody>
            </table>`}function _(S){if(!S)return'<div class="pol-el-empty">No presidential election results yet.</div>';const $=S.results;if(!$||!$.presidential_candidates)return'<div class="pol-el-empty">No presidential election results yet.</div>';const y=$e(S.election_tick);return r($.presidential_candidates,y,$.turnout_pct,$.total_votes_cast)}function h(S){if(!S)return'<div class="pol-el-empty">No first round results.</div>';const $=S.results,y=$?.round_1_candidates||$?.presidential_candidates;if(!y)return'<div class="pol-el-empty">No first round results.</div>';const f=$e(S.election_tick),E=$.round_1_turnout_pct??$.turnout_pct,L=$.round_1_total_votes_cast??$.total_votes_cast;return r(y,f,E,L)}function u(S){if(!S)return'<div class="pol-el-empty">No runoff results.</div>';const $=S.results,y=$?.runoff_candidates;if(!y)return'<div class="pol-el-empty">No runoff results.</div>';const f=$e(S.election_tick),E=[...y].sort((P,N)=>(N.votes||0)-(P.votes||0)),L=Math.max(...E.map(P=>P.vote_percentage||0),1);let O=E.map(P=>{const N=c[P.faction_id]||"#888",q=(P.vote_percentage||0).toFixed(1),M=Math.round((P.vote_percentage||0)/L*100),B=P.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";let U="";return P.base_votes!=null&&P.transfer_votes&&(U=`<div style="font-size:10px;color:var(--dtxt-muted);margin-top:2px">${(P.base_votes||0).toLocaleString()} direct + ${(P.transfer_votes||0).toLocaleString()} transferred</div>`),`<tr>
                <td><span class="pol-el-color-dot" style="background:${N}"></span>${w(P.candidate_name)}${B}</td>
                <td>${w(P.party_name)}</td>
                <td>${(P.votes||0).toLocaleString()}${U}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${M}%;background:${N}"></div></div></td>
                <td>${q}%</td>
            </tr>`}).join(""),R=`
            <div class="pol-el-date">${f}</div>
            <div class="pol-el-summary">Turnout: ${($.turnout_pct||0).toFixed(1)}% &middot; ${($.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${O}</tbody>
            </table>`;const T=E.flatMap(P=>(P.transfer_detail||[]).map(N=>({...N,to_candidate:P.candidate_name,to_faction_id:P.faction_id})));if(T.length>0){let P=T.map(N=>{const q=c[N.faction_id]||"#888",M=c[N.to_faction_id]||"#888",B=N.round1_votes>0?Math.round(N.transferred/N.round1_votes*100):0;return`<tr>
                    <td><span class="pol-el-color-dot" style="background:${q}"></span>${w(N.party_name||"")}</td>
                    <td><span class="pol-el-color-dot" style="background:${M}"></span>${w(N.to_candidate||"")}</td>
                    <td>${(N.transferred||0).toLocaleString()}</td>
                    <td>${B}%</td>
                </tr>`}).join("");R+=`
                <div style="margin-top:14px;font-family:var(--dfont-mono);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--dtxt-muted);margin-bottom:6px">Vote Transfers</div>
                <table class="pol-el-table">
                    <thead><tr><th>Eliminated Party</th><th>Votes Went To</th><th>Transferred</th><th>Rate</th></tr></thead>
                    <tbody>${P}</tbody>
                </table>`}return R}const a=t?.results?.was_runoff===!0;let g,C;a?(g=`
            <button class="pol-el-tab" data-tab="pres-r1">General Election [1st Round]</button>
            <button class="pol-el-tab" data-tab="pres-runoff">General Election [Runoff]</button>`,C=`
            <div class="pol-el-content" data-content="pres-r1">${h(t)}</div>
            <div class="pol-el-content" data-content="pres-runoff">${u(t)}</div>`):(g='<button class="pol-el-tab" data-tab="pres">General Election</button>',C=`<div class="pol-el-content" data-content="pres">${_(t)}</div>`);const k=ra({isPresidentialSystem:Wt(n),scheduledElections:p,currentTick:i,playerSeats:o});let A="";k.ticksUntilWindow?A=`<div style="font-size:10px;color:var(--dtxt-muted);text-align:right;margin-top:2px">Available in ${k.ticksUntilWindow} tick${k.ticksUntilWindow!==1?"s":""}</div>`:!k.disabled&&k.ticksUntilElection&&(A=`<div style="font-size:10px;color:var(--dgreen);text-align:right;margin-top:2px">${k.ticksUntilElection} tick${k.ticksUntilElection!==1?"s":""} until election</div>`);let m="",b="";if(!k.hidden){const S=l?.endorsed_party_id||null,y=(s||[]).filter(f=>f.id!==v?.id&&(f.seats||0)>0).map(f=>{const E=f.party_color||"#888",L=[f.leader_first_name,f.leader_last_name].filter(Boolean).join(" ")||"Unknown",O=f.id===S;return`<div class="pol-endorse-candidate${O?" selected":""}" data-faction-id="${f.id}">
                <span class="pol-el-color-dot" style="background:${E}"></span>
                <span class="pol-endorse-candidate-name">${w(f.faction_name||f.abbreviation)}</span>
                <span class="pol-endorse-candidate-leader">${w(L)}</span>
                <span class="pol-endorse-candidate-seats">${f.seats||0} seats</span>
                ${O?'<span style="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)">ENDORSED</span>':""}
            </div>`}).join("");m=`<div>
            <button class="pol-endorse-btn" ${k.disabled?"disabled":""}>Endorse Candidate</button>
            ${A}
        </div>`,b=`<div class="pol-endorse-panel" style="display:none">
            <div class="pol-endorse-panel-header">
                <span class="pol-section-label" style="margin-bottom:0;font-size:9px">ENDORSE A CANDIDATE</span>
                <button class="pol-endorse-panel-close">&times;</button>
            </div>
            <div class="pol-endorse-panel-desc">Select a party's candidate to endorse for the presidential election. First endorsement is free; switching costs 1 AP.</div>
            <div class="pol-endorse-candidate-list">
                ${y||'<div class="pol-el-empty">No eligible parties to endorse.</div>'}
            </div>
        </div>`}return`<div class="pol-election-box"
        data-faction-id="${v?.id||""}"
        data-nation-id="${n?.id||""}"
        data-current-tick="${i||0}">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Election Results</span>
            <div class="pol-box-header-right">${m}</div>
        </div>
        <div class="pol-box-body" style="padding:0">
        ${b}
        <div class="pol-el-tabs">
            <button class="pol-el-tab active" data-tab="parl">Parliamentary</button>
            ${g}
        </div>
        <div class="pol-el-content active" data-content="parl">${x(e)}</div>
        ${C}
        </div>
    </div>`}function Ca(){const e=document.querySelector(".pol-election-box");if(!e)return;const t=e.querySelectorAll(".pol-el-tab"),s=e.querySelectorAll(".pol-el-content");t.forEach(o=>{o.addEventListener("click",()=>{t.forEach(c=>c.classList.remove("active")),s.forEach(c=>c.classList.remove("active")),o.classList.add("active");const v=o.getAttribute("data-tab"),l=e.querySelector(`.pol-el-content[data-content="${v}"]`);l&&l.classList.add("active")})});const p=e.querySelector(".pol-endorse-btn"),i=e.querySelector(".pol-endorse-panel"),n=e.querySelector(".pol-endorse-panel-close");p&&i&&(p.addEventListener("click",()=>{const o=i.style.display!=="none";i.style.display=o?"none":"block"}),n&&n.addEventListener("click",()=>{i.style.display="none"}),i.querySelectorAll(".pol-endorse-candidate").forEach(o=>{o.addEventListener("click",async()=>{const v=o.getAttribute("data-faction-id"),l=e.getAttribute("data-faction-id"),c=Number(e.getAttribute("data-current-tick")||0),d=o.querySelector(".pol-endorse-candidate-name")?.textContent||"this party";if(confirm(`Endorse ${d}'s candidate for president? First endorsement is free; switching costs 1 AP.`)){o.style.opacity="0.5",o.style.pointerEvents="none";try{const x=await Es(I,l,v,c);if(!x.success){alert(x.error||"Endorsement failed.");return}i.querySelectorAll(".pol-endorse-candidate").forEach(h=>{h.classList.remove("selected"),h.querySelector('[style*="color:var(--dgreen)"]')?.remove()}),o.classList.add("selected");const r=document.createElement("span");r.style.cssText="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)",r.textContent="ENDORSED",o.appendChild(r);const _=x.newAp!=null?` (${x.newAp} AP remaining)`:"";alert(`Endorsed ${d}!${_}`),i.style.display="none",x.newAp!=null&&await ze(l)}catch(x){alert("Endorsement failed: "+(x.message||"Unknown error"))}finally{o.style.opacity="",o.style.pointerEvents=""}}})}))}function Ea(){const e=document.getElementById("pol-ba-bloc-data"),t=document.getElementById("pol-ba-party-pos"),s=document.getElementById("pol-ba-party-color");if(!e||!t)return;const p=JSON.parse(e.textContent),i=JSON.parse(t.textContent),n=JSON.parse(s.textContent);if(p.length===0)return;const o={BASE:{color:"var(--dgreen)",raw:"#4ade80",dim:"rgba(74,222,128,0.08)"},LEAN:{color:"#22d3ee",raw:"#22d3ee",dim:"rgba(34,211,238,0.08)"},SWING:{color:"var(--damber)",raw:"#facc15",dim:"rgba(250,204,21,0.08)"},SKEPTICAL:{color:"#f97316",raw:"#f97316",dim:"rgba(249,115,22,0.08)"},HOSTILE:{color:"var(--dred)",raw:"#ef4444",dim:"rgba(239,68,68,0.08)"}},v=[{key:"liberty_equality",left:"Liberty",right:"Equality"},{key:"tradition_progress",left:"Tradition",right:"Progress"},{key:"security_freedom",left:"Security",right:"Freedom"},{key:"globalism_nationalism",left:"Globalism",right:"Nationalism"},{key:"individualism_collectivism",left:"Individualism",right:"Collectivism"}],l=a=>a<=10?"var(--dgreen)":a<=20?"#22d3ee":a<=35?"var(--damber)":a<=50?"#f97316":"var(--dred)",c=a=>a>=3?"●●●":a>=2?"●●":a>=1?"●":"",d=a=>a>=3?"var(--dred)":a>=2?"#f97316":a>=1?"var(--damber)":"var(--dtext-3)",x=document.getElementById("pol-ba-selected"),r=document.getElementById("pol-ba-dropdown"),_=document.getElementById("pol-ba-sel-arrow"),h=r.querySelectorAll(".pol-ba-drop-item");function u(a){const g=o[a.tier]||o.HOSTILE;document.getElementById("pol-ba-sel-dot").style.background=g.raw,document.getElementById("pol-ba-sel-name").textContent=a.name;const C=document.getElementById("pol-ba-sel-badge");C.textContent=a.tier,C.style.color=g.raw,C.style.background=g.dim,document.getElementById("pol-ba-sel-pct").textContent=a.pct+"%";const k=v.map(M=>{const B=i[M.key]||50,U=a.axes[M.key]||50,z=Math.abs(B-U),H=a.strengths[M.key]||.5;return{...M,pv:B,bv:U,dist:z,str:H,weighted:z*H}}),A=k.reduce((M,B)=>M+B.weighted,0),m=v.length*100*3,b=Math.round(Math.max(0,100-A/m*100)),S=a.pref,$=b-S,y=document.getElementById("pol-ba-alignment");y.textContent=b,y.style.color=g.raw;const f=document.getElementById("pol-ba-performance"),E=a.perf??50;f.textContent=Math.round(E),f.style.color=E>=55?"var(--dgreen)":E>=40?"var(--damber)":"var(--dred)";const L=document.getElementById("pol-ba-approval");L.textContent=S,L.style.color="var(--dtext-0)";const O=document.getElementById("pol-ba-headroom");O.textContent=($>=0?"+":"")+$.toFixed(1),O.style.color=$>10?"var(--damber)":$>=0?"var(--dgreen)":"var(--dred)",document.getElementById("pol-ba-legend-bloc-dot").style.background=g.raw;const R=document.getElementById("pol-ba-legend-bloc-name");R.textContent=a.name,R.style.color=g.raw;const T=document.getElementById("pol-ba-axes");T.innerHTML=k.map(M=>{const B=l(M.dist),U=Math.min(M.pv,M.bv),z=M.dist;return`<div class="pol-ba-axis-row">
                <div class="pol-ba-axis-labels">
                    <span class="pol-ba-axis-label">${M.left}</span>
                    <span class="pol-ba-axis-str" style="color:${d(M.str)}">${c(M.str)}</span>
                    <span class="pol-ba-axis-label">${M.right}</span>
                </div>
                <div class="pol-ba-axis-track">
                    <div style="position:absolute;left:15%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:85%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:35%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:65%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(255,255,255,0.1)"></div>
                    ${M.dist>3?`<div class="pol-ba-axis-band" style="left:${U}%;width:${z}%;background:${B}12"></div>`:""}
                    <div class="pol-ba-axis-marker" style="left:${M.pv}%;background:${n};z-index:3">
                        <span style="color:var(--dbg-0)">${M.pv}</span>
                    </div>
                    <div class="pol-ba-axis-marker" style="left:${M.bv}%;background:${g.raw}">
                        <span style="color:var(--dbg-0)">${M.bv}</span>
                    </div>
                </div>
                <div class="pol-ba-axis-meta">
                    <span style="color:${B}">dist: ${M.dist}</span>
                    <span style="color:var(--dtext-3)">×${M.str} = <span style="color:${B};font-weight:700">${M.weighted.toFixed(0)}</span></span>
                </div>
            </div>`}).join("");const P=k.reduce((M,B)=>B.dist<M.dist?B:M,k[0]),N=k.reduce((M,B)=>B.weighted>M.weighted?B:M,k[0]);document.getElementById("pol-ba-summary").innerHTML=`<span style="color:var(--dgreen)">Closest: ${P.left}/${P.right}</span><span style="color:var(--dred)">Gap: ${N.left}/${N.right}</span>`;const q=document.getElementById("pol-ba-issues");q.innerHTML=(a.issues||[]).map(M=>`<span class="pol-ba-issue-tag">${M}</span>`).join(""),h.forEach(M=>{M.classList.toggle("active",M.getAttribute("data-bloc-id")===a.id),M.getAttribute("data-bloc-id")===a.id?M.style.borderLeftColor=g.raw:M.style.borderLeftColor="transparent"})}u(p[0]),x.addEventListener("click",()=>{const a=r.classList.toggle("open");_.classList.toggle("open",a)}),h.forEach(a=>{a.addEventListener("click",()=>{const g=a.getAttribute("data-bloc-id"),C=p.find(k=>k.id===g);C&&u(C),r.classList.remove("open"),_.classList.remove("open")})}),document.addEventListener("click",a=>{const g=document.getElementById("pol-ba-selector");g&&!g.contains(a.target)&&(r.classList.remove("open"),_.classList.remove("open"))})}function w(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}let V=null,Oe=null,Le=null,Re=null,at=null,ke=null,Ue=null,Fe=null,Ze="minister",ne=null,Ne=null,Z=null,je=null,ot=!1,Ve=null,it=null,We=null,yt=!1,Qe=null,nt=null,W=null,ve=null,Ke=null,Me=!1;const La=[{key:"momentum",label:"MOMENTUM",color:"#f97316"},{key:"alignment",label:"ALIGNMENT",color:"#a78bfa"},{key:"appeal",label:"APPEAL",color:"#38bdf8"},{key:"tools",label:"TOOLS",color:"#6b7280"}],kt=[{id:"rally",name:"Hold a Rally",ap:Os.AP_COST,color:"#f97316",icon:"★",category:"momentum",affects:"Momentum",desc:"Rally your supporters in a public show of strength. Random outcome that directly affects your Momentum score. A rousing success builds momentum; a gaffe costs it."},{id:"press_conference",name:"Press Conference",ap:2,color:"#fbbf24",icon:"🎤",category:"momentum",affects:"Momentum",desc:"Hold a press conference to make a public statement. Base roll: -2 to +2 Momentum. Opposition parties get +1 bonus. High-approval governing parties get +2 bonus."},{id:"attack",name:"Campaign Attack",ap:Jt.AP_COST,color:"#ef4444",icon:"✦",category:"momentum",affects:"Momentum",desc:"Target a rival party's record or leadership. Lowers their momentum and can hurt their election chances. More effective with evidence — but a weak attack backfires on you."},{id:"fund_think_tank",name:"Fund Think Tank",ap:ie.THINK_TANK.AP_COST,color:"#14b8a6",icon:"🏛",category:"alignment",affects:"Ideology",desc:"Fund a think tank to gradually shift the electorate's ideology on a chosen axis. Long-term investment: 8 AP upfront + 1 AP/tick for 50 ticks. Improves your Ideology pillar score."},{id:"grassroots_movement",name:"Grassroots Movement",ap:ie.GRASSROOTS.AP_COST,color:"#10b981",icon:"🌱",category:"alignment",affects:"Ideology + Momentum",desc:"Launch a grassroots campaign to shift public ideology and build momentum. Runs for 100 ticks. Drifts electorate opinion toward your position and grants +1 Momentum periodically."},{id:"pivot",name:"Ideological Pivot",ap:1,color:"#f59e0b",icon:"⟳",category:"alignment",affects:"Alignment",desc:"Shift your party's position on a chosen ideological axis. Costs escalate with each pivot (+1 AP per use, resets after 20 ticks). Reversing your current lean costs extra AP."},{id:"take_stance",name:"Take a Stance",ap:ae.AP_COST,color:"#38bdf8",icon:"⚑",category:"appeal",affects:"Appeal + Ideology",desc:"Declare your party's official position on a national issue. Builds platform appeal with aligned voters and shifts your ideology. Stances decay each tick — reinforce before they fade."},{id:"outreach",name:"Community Outreach",ap:3,color:"#60a5fa",icon:"🤝",category:"appeal",affects:"Appeal",desc:"Engage directly with communities through town halls and local events. +3 Platform Appeal. Cost starts at 3 AP and escalates by +1 each use. Decays by 1 each tick you don't use it."},{id:"poll_now",name:"Poll Now",ap:1,color:"#22d3ee",icon:"📊",category:"tools",affects:"Informational",desc:"Commission a poll to update the Current Electoral Standing. 1 AP = ±5% margin, 3 AP = ±3% margin."}];let et={},Mt={},bt=[],J=null,ee=null,lt=null,Se=1,ht=0;window._selectPollTier=function(e){Se=e;const t=document.getElementById("ca-config-panel");t&&(t.innerHTML=is())};let ge=null,ye=null,fe=null,Ee="moderate",tt=null;function Aa(){Oe=null,Le=null,Re=null,at=null,ke=null,Fe=null,Ze="minister",ne=null,Ve=null,it=null,We=null,yt=!1,J=null,ee=null,ge=null,ye=null,fe=null,Ee="moderate"}function os(){return V==="rally"?!0:V==="attack"?!!Oe&&!!Le:V==="promise"?Re==="stat"?!!at:Re==="crisis"?!!ke:!1:V==="protest"?!!ne:V==="take_stance"?!!ge&&!!ye&&!!fe&&!!Ee:V==="poll_now"||V==="press_conference"||V==="outreach"?!0:V==="fund_think_tank"||V==="media_campaign"||V==="grassroots_movement"?!!J&&!!ee:V==="pivot"?!!J&&!!ee&&!et.pivot:!1}function Ot(){if(V==="protest"){const t=W,s=ve?.current_tick||0,p=Qt(t?.protest_use_count||0,t?.protest_last_use_tick,s);return ss(p)}if(V==="pivot"){const t=W,s=ve?.current_tick||0;let p=t?.pivot_count||0;const i=t?.pivot_last_tick||0;s-i>=Te.ESCALATION_RESET&&(p=0);let n=Te.BASE_AP+p;if(J&&ee&&lt){const o=Number(lt[J]??0),v=ee==="right"?1:-1;(o>0&&v<0||o<0&&v>0)&&(n+=Te.REVERSE_AP_EXTRA)}return n}if(V==="poll_now")return Se;if(V==="outreach"){const t=W,s=ve?.current_tick||0;return Math.max(1,3+(ht||0)+(t?Nt("outreach",t,s):0))}if(V==="press_conference"){const t=W,s=ve?.current_tick||0;return Math.max(1,2+(t?Nt("press_conference",t,s):0))}const e=kt.find(t=>t.id===V);return e?e.id==="attack"?wt(nt?.polarization):e.ap:0}async function rt(e,t,s,p){nt=e,W=t,ve=s,Ke=p;const i=document.getElementById("actions-container");if(!i)return;let n=s?.current_tick||0;if(!n){const{data:b}=await I.from("shard").select("current_tick").eq("name","Alpha Shard").single();n=b?.current_tick||0,s&&(s.current_tick=n)}const o=t,v=e,{data:l}=await I.from("factions").select("action_points, party_funds").eq("id",o.id).single();l&&(o.action_points=l.action_points,o.party_funds=l.party_funds);const c=o.action_points??0,d=await Vt(I,v.id),x=new Set(d?.party_ids||[]);Me=o.id===v.ruling_faction_id||x.has(o.id);const{data:r}=await I.from("faction_ideology").select("*").eq("faction_id",o.id).single();lt=r;const _=(p||[]).filter(b=>b.id!==o.id),{data:h}=await I.from("issue_state").select("issue_id, salience").eq("nation_id",v.id).order("salience",{ascending:!1}).limit(7),u=new Set;for(const b of h||[]){const S=be[b.issue_id];if(S)for(const $ of S.stats)u.add($)}let a={},g=2;if(!Me){const{data:b}=await I.from("protest_log").select("id, status, tier, tick_called, tick_resolved, crisis_started_tick, crisis_duration, demand_label, turnout_score, effects_applied, grievance_type, grievance_data").eq("faction_id",o.id).in("status",["resolving","crisis_active"]).limit(1).maybeSingle();Z=b;const S=Qt(o.protest_use_count||0,o.protest_last_use_tick,n);if(g=ss(S),a=Qs(o,n,!0,b),b)Ne=b.status==="resolving"?"resolving":"active";else if(o.protest_locked_by)Ne="locked";else if(o.protest_cooldown_until_tick&&o.protest_cooldown_until_tick>n)Ne="cooldown";else{const{data:$}=await I.from("protest_log").select("id, tier, turnout_score, effects_applied, tick_resolved, roll_breakdown, condition_score").eq("faction_id",o.id).eq("status","resolved").gte("tick_resolved",n-1).order("tick_resolved",{ascending:!1}).limit(1).maybeSingle();$&&$.tick_resolved===n?(Ne="result",Z=$):Ne=null}}if(je=null,ot=!1,!Me&&!Z){const{data:b}=await I.from("protest_log").select("id, faction_id, status, tier, demand_label, grievance_type").eq("nation_id",v.id).eq("status","resolving").neq("faction_id",o.id).limit(1).maybeSingle();if(b){je=b;const{data:S}=await I.from("protest_endorsements").select("id").eq("protest_id",b.id).eq("faction_id",o.id).maybeSingle();ot=!!S}}if(Qe=null,Me){const{data:b}=await I.from("protest_log").select("id, tier, status, public_address_last_tick, tier7_demand, crisis_started_tick, crisis_duration").eq("nation_id",v.id).eq("status","crisis_active").order("crisis_started_tick",{ascending:!1}).limit(1).maybeSingle();Qe=b}const{data:C}=await I.from("campaign_actions").select("action_type, tick_performed").eq("party_id",o.id).gte("tick_performed",n-10).order("tick_performed",{ascending:!1}),{data:k}=await I.from("ideology_shift_actions").select("id, action_type, target_axis, target_direction, drift_rate, created_tick, status, band_shift_total").eq("faction_id",o.id).in("status",["active","paused","suspended"]);et={},Mt={};const A={fund_think_tank:ie.THINK_TANK.COOLDOWN_WINDOW,media_campaign:ie.MEDIA_CAMPAIGN.COOLDOWN_WINDOW,grassroots_movement:ie.GRASSROOTS.COOLDOWN_WINDOW,take_stance:ae.COOLDOWN_WINDOW,poll_now:Ms.COOLDOWN_WINDOW};for(const b of C||[]){const S=b.action_type,$=A[b.action_type];if($){const y=b.tick_performed+$-n;y>0&&(!et[S]||y>et[S])&&(et[S]=y)}b.tick_performed===n&&(Mt[S]=!0)}bt=k||[];const m=(C||[]).filter(b=>b.action_type==="outreach");if(m.length>0){const b=Math.max(...m.map($=>$.tick_performed)),S=n-b;ht=Math.max(0,m.length-S)}else ht=0;Bt(i,o,v,c,_,r,n,a,g)}function Bt(e,t,s,p,i,n,o,v,l){const c=[...kt];Me||c.push({id:"protest",name:"Organise a Protest",ap:l||2,color:"#d9534f",icon:"!",category:"momentum",affects:"Momentum",desc:"Mobilize citizens against the government. A strong turnout forces a crisis and builds your momentum, but a fizzle hands the ruling party a free headline."});const d=c.find(a=>a.id===V);let x="";if(t.pyrrhic_victory_until_tick&&t.pyrrhic_victory_until_tick>o){const a=t.pyrrhic_victory_until_tick-o;x+=`<div class="protest-pyrrhic-banner">
            <span style="font-weight:700">PYRRHIC VICTORY</span> — ${a} tick${a!==1?"s":""} remaining. AP income reduced by 2/tick.
        </div>`}if(Me&&Qe){const a=Qe,g=a.public_address_last_tick!=null?Math.max(0,Ge.PUBLIC_ADDRESS_COOLDOWN-(o-a.public_address_last_tick)):0,C=p>=Ge.PUBLIC_ADDRESS_AP&&g===0,k=g>0?" ca-item--cooldown":"",A=g>0?`${g} TICK CD`:`${Ge.PUBLIC_ADDRESS_AP} AP`;x+=`<div class="ca-item ca-item--public-address${k}${C?"":" disabled"}" data-action-id="public_address" style="${C?"":"opacity:0.5;"}">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#5b9bd5">&#9788;</span>
                    <span class="ca-item-name">Public Address</span>
                </div>
                <span class="ca-item-ap">${A}</span>
            </div>
            <div class="ca-item-desc" style="font-size:9px;color:#4a4840;">Issue a public statement calling for calm. Reduces civil unrest buildup this tick.</div>
        </div>`}const r=[];let _=null;for(const a of c)a.category&&(!_||a.category!==_.key)&&(_={key:a.category,actions:[]},r.push(_)),_&&_.actions.push(a);for(let a=0;a<r.length;a++){const g=r[a],C=La.find(k=>k.key===g.key);C&&(x+=`<div style="font-family:var(--dfont-mono);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${C.color};padding:8px 6px 2px;${a>0?"border-top:1px solid var(--dborder-0);margin-top:4px;":""}">${C.label}</div>`),x+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:0 2px;">';for(const k of g.actions){const A=V===k.id;if(k.id==="protest"){x+=`<div style="grid-column:1/-1">${Da(k,A,p,t,o)}</div>`;continue}let b=k.id==="attack"?wt(s?.polarization):k.id==="outreach"?3+(ht||0):k.id==="press_conference"?2:k.ap;["outreach","press_conference"].includes(k.id)&&t.leader_positive_traits&&(b=Math.max(1,b+Nt(k.id,t,o)));const S=k.id==="promise"?"make_promise":k.id,$=et[S]||0,y=$>0,f=!!Mt[S],E=bt.some(B=>B.action_type===k.id.replace("fund_","")),L=p>=b&&!y&&!f,O=A?k.color:L?k.color+"55":"var(--dtext-3)",R=A?`background:${k.color}08;`:"",T=A?`border-color:${k.color}33;`:"",P=A?k.color:"var(--dtext-0)",N=k.affects==="Momentum"?"#f97316":k.affects==="Appeal"?"#38bdf8":k.affects.includes("Ideology")?"#a78bfa":k.affects==="Alignment"?"#f59e0b":"#6b7280",q=f?`${k.name} already used this turn`:"",M=f?'<span class="ca-used-badge">USED</span>':y?`<span class="ca-cd-badge">${$} tick${$!==1?"s":""} CD</span>`:E?(()=>{const B=bt.find(U=>U.action_type===k.id.replace("fund_",""));return B?.status==="suspended"?'<span class="ca-active-badge" style="background:#d4a017">SUSPENDED</span>':B?.status==="paused"?'<span class="ca-active-badge" style="background:#f97316">PAUSED</span>':'<span class="ca-active-badge">ACTIVE</span>'})():"";x+=`<div class="ca-item${A?" selected":""}${L?"":" disabled"}${y?" ca-item--cooldown":""}${f?" ca-item--used":""}" data-action-id="${k.id}" style="border-left-color:${O};${R}${T}${L?"":"opacity:0.35;"}">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:${k.color}">${k.icon}</span>
                        <span class="ca-item-name" style="color:${P}">${w(k.name)}</span>
                        ${M}
                    </div>
                    <span class="ca-item-ap">${f?"USED":y?`${$} TICK CD`:`${b} AP`}</span>
                </div>
                <div class="ca-item-desc">${w(k.desc)}</div>
                ${f?`<div class="ca-item-used-msg">${w(q)}</div>`:`<div class="ca-item-affects" style="color:${N}">This action affects ${k.affects}</div>`}
            </div>`}x+="</div>"}let h="";if(!d)h='<div class="ca-panel"><div class="ca-panel-empty"><div class="ca-panel-empty-text">Choose an action</div></div></div>';else{if(h=`<div class="ca-panel" style="border-color:${d.color}22">`,Ue)h+=Ua(Ue);else if(d.id==="protest"&&Ne==="result"&&Z)h+=ja(Z);else if(d.id==="protest"&&Ne==="resolving")h+=Va();else{h+=Ia(d,i,n,s);const a=Ot(),g=os(),C=p>=a&&g;h+=`<div class="ca-confirm-row"><div class="ca-confirm-btn${C?"":" disabled"}" style="background:${C?d.color:"var(--dtext-3)"}" id="ca-confirm-btn">Confirm — ${a} AP</div></div>`}h+="</div>"}let u="";if(bt.length>0){const a={think_tank:ie.THINK_TANK.DURATION,media_campaign:ie.MEDIA_CAMPAIGN.DURATION+ie.MEDIA_CAMPAIGN.VISIBILITY_TICKS,grassroots_movement:ie.GRASSROOTS.DURATION},g={think_tank:"Think Tank",media_campaign:"Media Campaign",grassroots_movement:"Grassroots Movement"},C={};for(const m of oe)C[m.key]=m;const k=m=>m==="think_tank"||m==="grassroots_movement";u=`<div class="ca-active-actions" style="margin-top:16px;">
            <div class="pe-header"><span class="pol-mod-title">Active Actions</span></div>
            <table class="pol-el-table" style="margin-top:4px"><thead><tr><th>Action</th><th>Activated</th><th>Effect</th><th style="text-align:right">Ticks Left</th><th></th></tr></thead><tbody>${bt.map(m=>{const b=a[m.action_type]||50,S=o-m.created_tick,$=Math.max(0,b-S),y=C[m.target_axis],f=y?`${y.leftLabel}–${y.rightLabel}`:"",E=m.target_direction==="left"?y?.leftLabel:m.target_direction==="right"?y?.rightLabel:m.target_direction==="expand"?`Expand ${f}`:m.target_direction==="narrow"?`Narrow ${f}`:m.target_direction||"?",L=m.drift_rate?`+${m.drift_rate}/tick ${E}`:E,O=$e(m.created_tick),R=m.status==="paused",T=m.status==="suspended",P=T?'<span style="color:#d4a017;font-weight:600">SUSPENDED</span>':R?'<span style="color:#f97316;font-weight:600">PAUSED</span>':`${$}`;let N="";return k(m.action_type)?R||T?N=`<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="continue" data-id="${m.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#5cb85c;color:#fff;border:none;border-radius:3px">Continue — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${m.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`:N=`<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="suspend" data-id="${m.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#c8a44e;color:#fff;border:none;border-radius:3px">Suspend — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${m.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`:N="<td></td>",`<tr>
                <td style="font-weight:600">${g[m.action_type]||m.action_type}</td>
                <td>${O}</td>
                <td>${L}</td>
                <td style="text-align:right">${P}</td>
                ${N}
            </tr>`}).join("")}</tbody></table>
        </div>`}e.innerHTML=`<div class="ca-wrap"><div class="ca-list">${x}</div>${h}</div>
    ${u}
    <div class="ca-portfolios" style="margin-top:16px;">
    </div>
    <div class="pe-container">
        <div class="pe-header"><span class="pol-mod-title">Party Events</span></div>
        <div id="party-events-feed" class="pe-feed"><div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px">Loading events...</div></div>
    </div>
    <div id="ca-stance-portfolio-container" style="margin-top:16px;"></div>`,Et(document.getElementById("ca-stance-portfolio-container"),t,s),ma(s.id,t.id),e.querySelectorAll(".ca-manage-btn").forEach(a=>{a.addEventListener("click",async g=>{if(g.stopPropagation(),a.dataset.executing)return;a.dataset.executing="true",a.style.opacity="0.4";const C=a.dataset.id,k=a.dataset.action;try{let A;if(k==="suspend"?A=await Rs(I,t.id,C,o):k==="continue"?A=await zs(I,t.id,C,o):k==="cancel"&&(A=await Bs(I,t.id,s.id,C,o)),A?.success){A.newAp!=null&&(t.action_points=A.newAp);const m=await ze(t.id);m!==void 0&&(t.action_points=m),Q(A.message||"Done.",!1),await rt(s,t,ve,Ke)}else Q(A?.message||"Action failed.")}catch(A){Q("Error: "+A.message)}finally{a.dataset.executing="",a.style.opacity="1"}})}),e.querySelectorAll(".ca-item").forEach(a=>{a.addEventListener("click",async()=>{const g=a.dataset.actionId;if(g==="public_address"&&Qe){if(a.classList.contains("disabled")||a.dataset.executing)return;a.dataset.executing="true",a.style.opacity="0.4";try{const A=await ea(I,t.id,s.id,Qe.id,o);if(A.success){t.action_points=A.newAp;const m=await ze(t.id);m!==void 0&&(t.action_points=m),await rt(s,t,ve,Ke)}else Q(A.error||"Public Address failed."),a.style.opacity="",delete a.dataset.executing}catch(A){Q("Error: "+(A.message||"Unknown")),a.style.opacity="",delete a.dataset.executing}return}const C=kt.find(A=>A.id===g),k=C?.id==="attack"?wt(s?.polarization):C?.ap;C&&p<k||(V===g?V=null:V=g,Aa(),Ue=null,Bt(e,t,s,p,i,n,o,v,l))})}),Wa(e,t,s,p,i,n,o,v,l)}function Ia(e,t,s,p,i,n){return e.id==="rally"?Pa():e.id==="attack"?za(t):e.id==="protest"?Ha(p):e.id==="take_stance"?Ta():e.id==="poll_now"?is():e.id==="fund_think_tank"?Na():e.id==="media_campaign"?Ma():e.id==="grassroots_movement"?Oa():e.id==="pivot"?Ra():e.id==="press_conference"?'<div class="ca-info-box">Hold a press conference to make a public statement. Result depends on your position and approval.<br><br><strong>Base roll:</strong> -2 to +2 Momentum<br><strong>Opposition bonus:</strong> +1<br><strong>Government bonus:</strong> +2 (if gov approval ≥ 40)</div>':e.id==="outreach"?'<div class="ca-info-box">Engage directly with communities through town halls, door-knocking, and local events.<br><br><strong>Effect:</strong> +3 Platform Appeal</div>':""}function Pa(){return'<div class="ca-info-box">Hold a rally to energize your base. Random outcome that directly affects your Momentum — can boost or backfire.</div>'}function Ta(e){let t=`<div class="ca-info-box">Declare your party's position on an issue. Stances build platform appeal but decay over time.</div>`;t+='<div class="ca-subtitle" style="margin-top:10px">Select Issue</div><div style="display:flex;flex-direction:column;gap:3px">';const s=Object.entries(be),p=tt?s.sort((i,n)=>{const o=tt.find(l=>l.issue_id===i[0])?.salience??0;return(tt.find(l=>l.issue_id===n[0])?.salience??0)-o}):s;for(const[i,n]of p){const o=ge===i,v=tt?.find(c=>c.issue_id===i),l=v?Number(v.salience).toFixed(0):"—";t+=`<div class="ca-option-chip${o?" selected":""}" data-stance-issue-id="${i}" style="padding:6px 10px;display:flex;justify-content:space-between;align-items:center;${o?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
            <span style="font-weight:600">${w(n.label)}</span>
            <span style="font-size:10px;color:var(--dtext-3)">Salience: ${l}</span>
        </div>`}if(t+="</div>",ge){const i=be[ge];if(i&&i.axes.length>0){t+='<div class="ca-subtitle" style="margin-top:12px">Choose Axis</div><div style="display:flex;flex-direction:column;gap:3px">';for(const n of i.axes){const o=oe.find(l=>l.key===n);if(!o)continue;const v=ye===n;t+=`<div class="ca-option-chip${v?" selected":""}" data-stance-axis-key="${n}" style="padding:6px 10px;${v?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                    <span style="color:${o.leftColor}">${o.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="color:${o.rightColor}">${o.rightLabel}</span>
                </div>`}t+="</div>"}}if(ye){const i=oe.find(n=>n.key===ye);if(i){t+='<div class="ca-subtitle" style="margin-top:12px">Choose Side</div><div style="display:flex;gap:8px">';const n=fe==="left",o=fe==="right";t+=`<div class="ca-option-chip${n?" selected":""}" data-stance-side-val="left" style="flex:1;text-align:center;padding:8px;${n?`border-color:${i.leftColor};color:${i.leftColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${i.leftLabel}</span></div>`,t+=`<div class="ca-option-chip${o?" selected":""}" data-stance-side-val="right" style="flex:1;text-align:center;padding:8px;${o?`border-color:${i.rightColor};color:${i.rightColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${i.rightLabel}</span></div>`,t+="</div>"}}if(fe){const i=oe.find(v=>v.key===ye),n=fe==="left"?i?.leftLabel??"Left":i?.rightLabel??"Right",o=fe==="left"?i?.leftColor??"#ccc":i?.rightColor??"#ccc";t+='<div class="ca-subtitle" style="margin-top:12px">Intensity</div><div style="display:flex;gap:6px">';for(const[v,l]of Object.entries(ae.INTENSITY)){const c=Ee===v;t+=`<div class="ca-option-chip${c?" selected":""}" data-stance-int-val="${v}" style="flex:1;text-align:center;padding:6px 4px;${c?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                <div style="font-weight:600;font-size:11px">${v}</div>
                <div style="font-size:9px;color:var(--dtext-3);margin-top:2px">Str ${l.strength} · -${l.decay_rate}/t</div>
                <div style="font-size:9px;color:${o};margin-top:1px;font-weight:600">+${l.ideology_shift} ${n}</div>
            </div>`}if(t+="</div>",Ee){const v=ae.INTENSITY[Ee],l=be[ge];t+=`<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                <div style="color:var(--dtext-1);font-weight:600;margin-bottom:4px">${Ee.toUpperCase()} ${n.toUpperCase()} on ${l?.label||""}</div>
                <div style="color:${o};font-weight:700">Ideology: +${v.ideology_shift} ${n}</div>
                <div style="color:var(--dtext-3);margin-top:2px">Strength: ${v.strength} · Decay: -${v.decay_rate}/tick</div>
            </div>`}}return t}function is(){return`<div class="ca-info-box">Commission a poll to update the Current Electoral Standing table. Higher investment produces more accurate results.</div>
    <div style="margin-top:8px;">
        <label style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);text-transform:uppercase;display:block;margin-bottom:4px;">Investment Level</label>
        <div style="display:flex;gap:6px;">
            <button class="ca-poll-tier-btn${Se===1?" selected":""}" onclick="window._selectPollTier(1)" style="flex:1;padding:6px;background:${Se===1?"var(--dbg-hover)":"var(--dbg-3)"};border:1px solid ${Se===1?"var(--dtext-1)":"var(--dborder-0)"};border-radius:2px;color:var(--dtext-0);font-family:var(--dfont-mono);font-size:10px;cursor:pointer;text-align:center;">
                <strong>1 AP</strong><br><span style="color:var(--damber)">±5%</span>
            </button>
            <button class="ca-poll-tier-btn${Se===3?" selected":""}" onclick="window._selectPollTier(3)" style="flex:1;padding:6px;background:${Se===3?"var(--dbg-hover)":"var(--dbg-3)"};border:1px solid ${Se===3?"var(--dtext-1)":"var(--dborder-0)"};border-radius:2px;color:var(--dtext-0);font-family:var(--dfont-mono);font-size:10px;cursor:pointer;text-align:center;">
                <strong>3 AP</strong><br><span style="color:var(--dgreen)">±3%</span>
            </button>
        </div>
    </div>
    `}function Na(){let e=`<div class="ca-info-box">Launch a think tank to gradually drift the electorate's ideological mean on a chosen axis. ${ie.THINK_TANK.AP_COST} AP upfront + ${ie.THINK_TANK.TICK_AP_COST} AP/tick for ${ie.THINK_TANK.DURATION} ticks. Drift: 1d3 (0.1–0.3) per tick.</div>`;if(e+=St(),J){const t=oe.find(s=>s.key===J);t&&(e+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',e+=Ct(t.leftLabel,t.rightLabel,"left","right"))}return e}function Ma(){const e=ie.MEDIA_CAMPAIGN;let t=`<div class="ca-info-box">Launch a media campaign to expand or narrow electorate ideological variance on a chosen axis. Phase 1: 1d5 (0.1–0.5) variance shift/tick for ${e.DURATION} ticks. Phase 2: 1d3 (1–3) momentum/tick for ${e.VISIBILITY_TICKS} ticks.</div>`;return t+=St(),J&&(t+='<div class="ca-subtitle" style="margin-top:12px">Variance direction</div>',t+=Ct("Expand (polarize)","Narrow (centralize)","expand","narrow")),t}function Oa(){const e=ie.GRASSROOTS;let t=`<div class="ca-info-box">Launch a grassroots movement to slowly shift the electorate on a chosen axis. ${e.AP_COST} AP upfront + ${e.TICK_AP_COST} AP/tick for ${e.DURATION} ticks. Drift: 1d2 (${e.DRIFT_MIN}–${e.DRIFT_MAX})/tick. +1 momentum every ${e.VISIBILITY_INTERVAL} ticks.</div>`;if(t+=St(),J){const s=oe.find(p=>p.key===J);s&&(t+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',t+=Ct(s.leftLabel,s.rightLabel,"left","right"))}return t}function Ra(e){const t=W,s=ve?.current_tick||0;let p=t?.pivot_count||0;const i=t?.pivot_last_tick||0;s-i>=Te.ESCALATION_RESET&&(p=0);const n=Math.max(0,Te.COOLDOWN-(s-i)),o=i>0&&n>0;let v=`<div class="ca-info-box">Shift your party's ideological position. Each pivot costs +1 AP more than the last (resets after ${Te.ESCALATION_RESET} ticks of no pivots). Reversing direction costs extra AP. Hold steady 20+ ticks for a conviction bonus.</div>`;if(o&&(v+=`<div style="font-family:var(--dfont-mono);font-size:11px;color:var(--damber);padding:6px 0">Cooldown: ${n} tick${n!==1?"s":""} remaining</div>`),v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);padding:4px 0">Pivots this cycle: ${p} · Next cost: ${Te.BASE_AP+p} AP${p>0?" (escalated)":""}</div>`,v+=St(),J){const l=oe.find(c=>c.key===J);if(l){const c=lt?Number(lt[J]??0):0,d=c>0?`+${c} (${l.rightLabel})`:c<0?`${c} (${l.leftLabel})`:"0 (Center)";if(v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);padding:4px 0;margin-top:4px">Current position: <span style="font-weight:700">${d}</span></div>`,v+='<div class="ca-subtitle" style="margin-top:8px">Pivot direction</div>',v+=Ct(l.leftLabel,l.rightLabel,"left","right"),ee){const x=ee==="right"?1:-1;(c>0&&x<0||c<0&&x>0)&&(v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);padding:6px 0;border-top:1px solid var(--dborder-1);margin-top:8px">⚠ Reversal: +${Te.REVERSE_AP_EXTRA} AP extra</div>`)}}}return v}function St(){let e='<div class="ca-subtitle" style="margin-top:10px">Target axis</div><div style="display:flex;flex-direction:column;gap:4px">';for(const t of oe){const s=J===t.key;e+=`<div class="ca-option-chip${s?" selected":""}" data-axis-key="${t.key}" style="padding:6px 10px;${s?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">
            <span style="font-weight:600">${t.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="font-weight:600">${t.rightLabel}</span>
            <span style="font-size:0.75em;color:var(--dtext-3);margin-left:6px">${t.description}</span>
        </div>`}return e+="</div>",e}function Ct(e,t,s,p){let i='<div style="display:flex;gap:8px">';const n=ee===s,o=ee===p;return i+=`<div class="ca-option-chip${n?" selected":""}" data-direction-value="${s}" style="flex:1;text-align:center;padding:8px;${n?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${e}</div>`,i+=`<div class="ca-option-chip${o?" selected":""}" data-direction-value="${p}" style="flex:1;text-align:center;padding:8px;${o?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${t}</div>`,i+="</div>",i}function za(e){const t=nt?.polarization||0,s=wt(t);let i=`<div style="color:#ef4444;font-size:0.85em;margin-bottom:4px">Using this will increase Polarization by 0.25.${s>Jt.AP_COST?` Cost scaled to ${s} AP (polarization ${Math.round(t)}).`:""}</div><div class="ca-subtitle">Select target party</div>`;for(const n of e){const o=Oe===n.id;i+=`<div class="ca-rival-card${o?" selected":""}" data-rival-id="${n.id}" style="border-left-color:${o?"#ef4444":n.party_color||"#888"};${o?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
            <span class="ca-rival-name" style="color:${o?"#ef4444":"var(--dtext-0)"}">${w(n.faction_name)}</span>
        </div>`}if(Oe&&Fe){i+='<div class="ca-subtitle" style="margin-top:12px">Choose attack vector</div>';for(const n of Fe){const o=Le===n.id;n.strength==="strong"||n.strength;const v=n.evidence_required&&n.strength==="weak",l=n.strength==="strong"?"#4ade80":n.strength==="moderate"?"#facc15":"#ef4444";i+=`<div class="ca-vector-card${o?" selected":""}${v?" disabled":""}" data-vector-id="${n.id}" style="border-left-color:${o?"#ef4444":l};${o?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="ca-vector-name">${w(n.name)}</span>
                    <span class="ca-vector-strength" style="color:${l}">${n.strength.toUpperCase()}</span>
                </div>
                <div class="ca-vector-desc">${w(n.description)}</div>
            </div>`}if(Le){const n=Fe.find(o=>o.id===Le);if(n){const o=Ds(n.strength),v=Math.max(...Object.values(o));i+='<div style="margin-top:10px">';const l={devastating:"#4ade80",effective:"#22d3ee",glancing:"#facc15",backfire:"#f97316",mutual:"#ef4444"};for(const c of Hs){const d=o[c.id]||0,x=v>0?d/v*100:0,r=l[c.id]||"#888";i+=`<div class="ca-outcome-bar">
                        <span class="ca-outcome-name">${w(c.name)}</span>
                        <div class="ca-outcome-track"><div class="ca-outcome-fill" style="width:${x}%;background:${r}"></div></div>
                        <span class="ca-outcome-pct" style="color:${r}">${d}%</span>
                    </div>`}i+="</div>"}}}else Oe&&!Fe&&(i+='<div class="ca-info-box" style="margin-top:12px">Loading evidence...</div>');return i}async function Ba(e,t,s){if(!Ve){const{data:p}=await I.from("ministries").select("ministry_key, minister_first_name, minister_last_name, minister_approval, party_id").eq("nation_id",e.id).not("party_id","is",null).order("minister_approval",{ascending:!0});Ve=p||[]}if(!it){const{data:p}=await I.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",e.id);it=(p||[]).map(i=>({...i,duration:s-(i.started_at_tick||0)}))}if(!We){const{data:p}=await I.from("stat_history").select("stat_name, value, tick").eq("nation_id",e.id).gte("tick",s-6).order("tick",{ascending:!0}),i={};for(const l of p||[])i[l.stat_name]||(i[l.stat_name]=[]),i[l.stat_name].push({tick:l.tick,value:l.value});const n=[];for(const[l,c]of Object.entries(i)){if(ia(l))continue;const d=c.sort((a,g)=>a.tick-g.tick),x=e[l]??d[d.length-1]?.value??0;if(!(ts(l)?x>=70:x<=30))continue;const _=d[0]?.value??x,h=x-_,u=na(x,_,l);n.push({key:l,current:x,sixTicksAgo:_,delta:h,failureScore:u,displayName:l.replace(/_/g," ").replace(/\b\w/g,a=>a.toUpperCase())})}n.sort((l,c)=>c.failureScore-l.failureScore);const{data:o}=await I.from("protest_log").select("tick_called").eq("nation_id",e.id).gte("tick_called",s-6),v=la((o||[]).map(l=>({tick:l.tick_called})),s);We={failingStats:n,_fatigueLevel:v}}}function Da(e,t,s,p,i){const n=Ne,o=e.ap,v=s>=o;if(n==="resolving")return`<div class="ca-item ca-item--protest ca-item--resolving" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#c8a64e">!</span>
                    <span class="ca-item-name" style="color:#c8a64e">${w(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#c8a64e">RESOLVING...</span>
            </div>
        </div>`;if(n==="result"&&Z){const r=Z.tier;if(r>=3&&r<=5){const _=es(r).toUpperCase(),h=Z.roll_breakdown||{},u=h.endorsements||0,a=h.joint_bonus||0;return`<div class="ca-item ca-item--protest ca-item--result-${r}" data-action-id="protest">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:#5cb85c">!</span>
                        <span class="ca-item-name" style="color:#5cb85c">${w(e.name)}</span>
                    </div>
                    <span class="ca-item-ap" style="color:#5cb85c">TIER ${r} — ${_}</span>
                </div>
                ${u>0?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#a78bfa;margin-top:2px;padding:0 12px 4px">${u} party endorsement${u>1?"s":""} (+${a} bonus)</div>`:""}
            </div>`}}if(n==="active"&&Z){const r=(Z.crisis_started_tick??i)+(Z.crisis_duration||6)-i,_=Z.tier===6&&(p.action_points||0)>=Ge.CALL_OFF_AP,h=Z.tier===7;return`<div class="ca-item ca-item--protest ca-item--active" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${w(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">ACTIVE — TIER ${Z.tier}</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Your protest crisis is running. ${Z.demand_label?`Demand: ${w(Z.demand_label)}`:""}</div>
            <div class="protest-passive-status">Running — ${Math.max(0,r)} tick${r!==1?"s":""} remaining.</div>
            ${h?'<div class="protest-calloff-note">Tier 7 protests cannot be called off.</div>':`<div class="protest-calloff-btn${_?"":" disabled"}" onclick="window._protestCallOff()">Call Off Protest — ${Ge.CALL_OFF_AP} AP</div>`}
        </div>`}if(n==="locked")return`<div class="ca-item ca-item--protest ca-item--locked" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${w(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">LOCKED</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">A protest crisis is already underway, led by another party.</div>
        </div>`;if(n==="cooldown"){const r=(p.protest_cooldown_until_tick||0)-i;return`<div class="ca-item ca-item--protest ca-item--cooldown" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.3)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.3)">${w(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#4a4840">COOLDOWN ${Math.max(0,r)}</span>
            </div>
        </div>`}if(je&&!n){const r=!ot&&(p.action_points||0)>=1,_=ot?"ENDORSED":"ENDORSE — 1 AP";return`<div class="ca-item ca-item--protest ca-item--endorse" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#a78bfa">!</span>
                    <span class="ca-item-name" style="color:#a78bfa">${w(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#a78bfa">ENDORSEMENT</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Another opposition party has called a protest. You can endorse it to boost turnout (+15 per endorsement).</div>
            ${je.demand_label?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#f97316;padding:0 12px 4px">Demand: ${w(je.demand_label)}</div>`:""}
            <div class="protest-endorse-btn${r?"":" disabled"}" onclick="window._protestEndorse()">${_}</div>
        </div>`}return`<div class="ca-item ca-item--protest${t?" selected":""}${v?"":" disabled"}" data-action-id="protest" style="border-left-color:${t?"#d9534f":v?"rgba(217,83,79,0.55)":"var(--dtext-3)"};${t?"background:rgba(217,83,79,0.07);":""}${t?"border-color:rgba(217,83,79,0.2);":""}${v?"":"opacity:0.35;"}">
        <div class="ca-item-head">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="ca-item-icon" style="color:#d9534f">!</span>
                <span class="ca-item-name" style="color:${t?"#e06460":"var(--dtext-0)"}">${w(e.name)}</span>
            </div>
            <span class="ca-item-ap" style="color:#d9534f">${o} AP</span>
        </div>
        ${t?`<div class="ca-item-desc">${w(e.desc)}</div>`:""}
    </div>`}function Ha(e,t){let s="";s+='<div class="protest-warning">Turnout is probabilistic — based on Civil Unrest, Happiness, Polarisation, and Political Violence. A fizzle hands the government a free headline. Choose your moment.</div>';const p=[{key:"civil_unrest",label:"CIVIL UNREST",value:e.civil_unrest||0},{key:"happiness",label:"HAPPINESS",value:e.happiness||50},{key:"polarization",label:"POLARISATION",value:e.polarization||0},{key:"political_violence",label:"POL VIOLENCE",value:e.political_violence||0}];s+='<div class="protest-stat-hints">';for(const l of p){const c=ta(l.key,l.value);s+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">${l.label}</span>
            <span class="protest-stat-pill__value" style="color:${c}">${Math.round(l.value)}</span>
        </div>`}const i=We?._fatigueLevel||{label:"...",color:"#4a4840"};s+=`<div class="protest-stat-pill">
        <span class="protest-stat-pill__label">PROTEST FATIGUE</span>
        <span class="protest-stat-pill__value" style="color:${i.color}">${i.label}</span>
    </div>`;const n=(Ke||[]).filter(l=>!(l.id===W?.id||Me)).length;if(n>0){const l=n>=2?"#a78bfa":"#4a4840";s+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">ENDORSERS</span>
            <span class="protest-stat-pill__value" style="color:${l}">${n}</span>
        </div>`}s+="</div>";const o=[{id:"minister",label:"Minister"},{id:"activeCrisis",label:"Active Crisis"},{id:"statFailure",label:"Stat Failure"}];s+='<div class="protest-tabs">';for(const l of o)s+=`<div class="protest-tab${Ze===l.id?" active":""}" data-protest-tab="${l.id}">${l.label}</div>`;s+="</div>",s+='<div class="protest-target-list" id="protest-target-list">',Ze==="minister"?s+=qa():Ze==="activeCrisis"?s+=Fa():Ze==="statFailure"&&(s+=Ga()),s+="</div>";const v=ne?.label||null;return s+='<div class="protest-confirm">',s+=`<div class="protest-confirm__note">${v?`Targeting: ${w(v)}`:"Select a target above"}</div>`,s+="</div>",s}function qa(){const e=Ve;if(!e)return'<div class="protest-empty">Loading ministers...</div>';if(e.length===0)return'<div class="protest-empty">No government ministers found.</div>';let t="";for(const s of e){const p=Math.round(s.minister_approval||50),i=p>50?"high":p>=35?"mid":"low",n=ne?.id===s.ministry_key,o=JSON.stringify({id:s.ministry_key,type:"minister",label:`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()||s.ministry_key,demandLabel:`${(s.minister_first_name||"")+" "+(s.minister_last_name||"")} must resign.`.trim(),grievanceData:{ministryKey:s.ministry_key,approval:p,name:`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()}}).replace(/"/g,"&quot;");t+=`<div class="protest-target${n?" selected":""}" data-protest-target="${o}">
            <div>
                <div class="protest-target__name">${w(`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()||s.ministry_key)}</div>
                <div class="protest-target__meta">${w(s.ministry_key)}</div>
            </div>
            <span class="protest-target__value protest-target__value--${i}">${p}%</span>
        </div>`}return t}function Fa(){const e=it;if(!e)return'<div class="protest-empty">Loading active crises...</div>';if(e.length===0)return'<div class="protest-empty">No active crises in this nation.</div>';let t="";for(const s of e){const p=ne?.id===s.id,i=s.crisis_templates?.name||"Unknown Crisis",n=s.crisis_templates?.description||"",o=s.duration||0,v=`The government must resolve the ${i} crisis.`,l=JSON.stringify({id:s.id,type:"activeCrisis",label:i,demandLabel:v,grievanceData:{crisisId:s.id,name:i,duration:o}}).replace(/"/g,"&quot;");t+=`<div class="protest-target${p?" selected":""}" data-protest-target="${l}">
            <div>
                <div class="protest-target__name">${w(i)}</div>
                <div class="protest-target__meta">${w(n?n.slice(0,80):"")}${o?" · "+o+"t active":""}</div>
            </div>
        </div>`}return t}function Ga(e,t){const s=We?.failingStats;if(!s)return'<div class="protest-empty">Loading stats...</div>';if(s.length===0)return'<div class="protest-empty">No stats are bad enough to protest. Stats must be critically failing (≥70 for negative stats, ≤30 for positive stats).</div>';let p="";for(const i of s){const n=ne?.id===i.key,o=ts(i.key)?"&#9650;":"&#9660;",v=JSON.stringify({id:i.key,type:"statFailure",label:i.displayName,demandLabel:`The government must address ${i.displayName}.`,grievanceData:{statKey:i.key,failureScore:i.failureScore,current:i.current}}).replace(/"/g,"&quot;");p+=`<div class="protest-target${n?" selected":""}" data-protest-target="${v}">
            <div>
                <div class="protest-target__name">${w(i.displayName)}</div>
                <div class="protest-target__meta">${Math.round(i.current)} <span class="protest-target__delta" style="color:#d9534f">${o} ${Math.abs(i.delta).toFixed(1)}</span></div>
            </div>
            <span class="protest-target__value protest-target__value--low">${i.failureScore.toFixed(1)}</span>
        </div>`}return p}function Ua(e){if(!e)return"";const t=!e.error&&e.success,s=t?"#4ade80":"#ef4444";let p=`<div class="ca-result-box" style="border-color:${s}33">`;if(p+=`<div class="ca-result-header" style="background:${s}08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:${s}">${w(e.headline||(t?"Action completed":"Action failed"))}</span>
        <span class="ca-result-dismiss" id="ca-dismiss-result">Dismiss</span>
    </div>`,p+='<div class="ca-result-body">',e.effects&&e.effects.length>0)for(const i of e.effects){const n=i.bloc||i.label||i.stat||"",o=i.value??i.delta??0,v=o>=0?"#4ade80":"#ef4444";p+=`<div class="ca-result-row">
                <span class="ca-result-label">${w(n)}</span>
                <span class="ca-result-val" style="color:${v}">${o>=0?"+":""}${o}</span>
            </div>`}if(e.blocEffects&&e.blocEffects.length>0)for(const i of e.blocEffects)p+=`<div class="ca-result-row">
                <span class="ca-result-label">${w(i.blocName)}</span>
                <span class="ca-result-val" style="color:#4ade80">+${i.delta}</span>
            </div>`;return e.outcomeName&&(p+=`<div class="ca-result-row">
            <span class="ca-result-label">Outcome</span>
            <span class="ca-result-val" style="color:${s}">${w(e.outcomeName)}</span>
        </div>`),e.demandText&&(p+=`<div class="ca-result-row">
            <span class="ca-result-label">Promise</span>
            <span class="ca-result-val" style="color:#a78bfa">${w(e.demandText)}</span>
        </div>`,e.conditions?.is_governing&&(p+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-top:2px">Governing target: ±${e.conditions.delta} (higher bar)</div>`)),e.deadlineTicks&&(p+=`<div class="ca-result-row">
            <span class="ca-result-label">Deadline</span>
            <span class="ca-result-val" style="color:var(--dtext-2)">${e.deadlineTicks} ticks</span>
        </div>`),e.promiseType&&(p+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Consequences</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#4ade80">Kept: +${$t.KEPT_APPROVAL} momentum</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#ef4444;margin-top:2px">Broken: ${$t.BROKEN_APPROVAL} momentum</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-top:2px">While unfulfilled: −${$t.PENALTY_PER_TICK_MIN} to −${$t.PENALTY_PER_TICK_MAX} approval/tick</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#94a3b8;margin-top:2px">Countdown starts after next election · Opposition = extinguished</div>
        </div>`),p+="</div></div>",p}function ja(e){const t=e.tier||0,s=es(t).toUpperCase(),p=e.roll_breakdown||{},i=e.condition_score??e.turnout_score??0,n=p.endorsements||0,o=p.joint_bonus||0,v=e.effects_applied||[];let l='<div class="ca-result-box" style="border-color:#5cb85c33">';if(l+=`<div class="ca-result-header" style="background:#5cb85c08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#5cb85c">Protest Result — Tier ${t}</span>
    </div>`,l+='<div class="ca-result-body">',l+=`<div class="ca-result-row">
        <span class="ca-result-label">Outcome</span>
        <span class="ca-result-val" style="color:#5cb85c">${s}</span>
    </div>`,l+=`<div class="ca-result-row">
        <span class="ca-result-label">Condition Score</span>
        <span class="ca-result-val" style="color:var(--dtext-1)">${Math.round(i)}</span>
    </div>`,Object.keys(p).length>0){l+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Score Breakdown</div>`;const d=new Set(["endorsements","joint_bonus"]);for(const[x,r]of Object.entries(p)){if(d.has(x))continue;const _=x.replace(/_/g," ").replace(/\b\w/g,a=>a.toUpperCase()),h=Number(r),u=h>=0?"#4ade80":"#ef4444";l+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${w(_)}</span>
                <span class="ca-result-val" style="color:${u};font-size:10px">${h>=0?"+":""}${h.toFixed(1)}</span>
            </div>`}l+="</div>"}n>0&&(l+=`<div class="protest-endorse-breakdown">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#a78bfa;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:2px">Coalition Support</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-1)">${n} party endorsement${n>1?"s":""} — +${o} bonus</div>
        </div>`);const c=v.filter(d=>d.stat&&d.stat!=="electoral_wound");if(c.length>0){l+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Effects on Nation</div>`;for(const d of c){const x=(d.stat||"").replace(/_/g," ").replace(/\b\w/g,h=>h.toUpperCase()),r=Number(d.delta||d.value||0),_=r>=0?"#4ade80":"#ef4444";l+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${w(x)}</span>
                <span class="ca-result-val" style="color:${_};font-size:10px">${r>=0?"+":""}${r}</span>
            </div>`}l+="</div>"}return l+="</div></div>",l}function Va(){const e=Z;let t='<div class="ca-result-box" style="border-color:rgba(217,83,79,0.3)">';if(t+=`<div class="ca-result-header" style="background:rgba(217,83,79,0.06)">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#d9534f">Protest Resolving...</span>
    </div>`,t+='<div class="ca-result-body">',t+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);line-height:1.8">
        Your protest has been called and is gathering momentum. The turnout will be determined at the next tick based on national conditions.
    </div>`,e){if(e.grievance_type){const s=e.grievance_type==="minister"?"Minister":e.grievance_type==="activeCrisis"?"Active Crisis":e.grievance_type==="activePolicy"?"Active Policy":"Stat Failure";t+=`<div class="ca-result-row" style="margin-top:8px">
                <span class="ca-result-label">Grievance</span>
                <span class="ca-result-val" style="color:#f97316">${s}</span>
            </div>`}e.demand_label&&(t+=`<div class="ca-result-row">
                <span class="ca-result-label">Demand</span>
                <span class="ca-result-val" style="color:#a78bfa">${w(e.demand_label)}</span>
            </div>`)}return t+=`<div style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);margin-top:12px;font-style:italic">
        Other opposition parties can endorse this protest during this tick to boost turnout (+15 per endorsement).
    </div>`,t+="</div></div>",t}function Wa(e,t,s,p,i,n,o,v,l){const c=()=>Bt(e,t,s,p,i,n,o,v,l);e.querySelectorAll("[data-rival-id]").forEach(r=>{r.addEventListener("click",async()=>{const _=r.dataset.rivalId;if(Oe===_)return;Oe=_,Le=null,Fe=null,c();const h=await qs(I,_,s.id,o);Fe=Fs(h),c()})}),e.querySelectorAll("[data-vector-id]").forEach(r=>{r.addEventListener("click",()=>{r.classList.contains("disabled")||(Le=Le===r.dataset.vectorId?null:r.dataset.vectorId,c())})}),e.querySelectorAll("[data-promise-type]").forEach(r=>{r.addEventListener("click",async()=>{const _=r.dataset.promiseType;if(Re=Re===_?null:_,at=null,ke=null,c(),Re==="crisis"){const{data:h}=await I.from("active_crises").select("id, crisis_id, started_at_tick, crisis_templates(name, description)").eq("nation_id",s.id),u=document.getElementById("ca-crisis-list");if(u)if(!h||h.length===0)u.innerHTML='<div class="ca-info-box">No active crises to promise on.</div>';else{let a="";for(const g of h){const C=ke===g.id,k=g.crisis_templates?.name||"Unknown Crisis";a+=`<div class="ca-crisis-card${C?" selected":""}" data-crisis-id="${g.id}">
                                <span class="ca-crisis-name">${w(k)}</span>
                            </div>`}u.innerHTML=a,u.querySelectorAll("[data-crisis-id]").forEach(g=>{g.addEventListener("click",()=>{ke=ke===g.dataset.crisisId?null:g.dataset.crisisId,c()})})}}})}),e.querySelectorAll("[data-stat-key]").forEach(r=>{r.addEventListener("click",()=>{at=at===r.dataset.statKey?null:r.dataset.statKey,c()})}),e.querySelectorAll("[data-crisis-id]").forEach(r=>{r.addEventListener("click",()=>{ke=ke===r.dataset.crisisId?null:r.dataset.crisisId,c()})}),e.querySelectorAll("[data-stance-issue-id]").forEach(r=>{r.addEventListener("click",()=>{const _=r.dataset.stanceIssueId;ge===_?ge=null:ge=_,ye=null,fe=null,Ee="moderate";const h=be[ge];h&&h.axes.length===1&&(ye=h.axes[0]),c()})}),e.querySelectorAll("[data-stance-axis-key]").forEach(r=>{r.addEventListener("click",()=>{const _=r.dataset.stanceAxisKey;ye=ye===_?null:_,fe=null,c()})}),e.querySelectorAll("[data-stance-side-val]").forEach(r=>{r.addEventListener("click",()=>{const _=r.dataset.stanceSideVal;fe=fe===_?null:_,c()})}),e.querySelectorAll("[data-stance-int-val]").forEach(r=>{r.addEventListener("click",()=>{Ee=r.dataset.stanceIntVal,c()})}),V==="take_stance"&&!tt&&!Ue&&I.from("issue_state").select("issue_id, salience").eq("nation_id",s.id).then(({data:r})=>{tt=r||[],c()}),e.querySelectorAll("[data-axis-key]").forEach(r=>{r.addEventListener("click",()=>{const _=r.dataset.axisKey;J===_?J=null:J=_,ee=null,c()})}),e.querySelectorAll("[data-direction-value]").forEach(r=>{r.addEventListener("click",()=>{const _=r.dataset.directionValue;ee=ee===_?null:_,c()})}),e.querySelectorAll("[data-grassroots-demo]").forEach(r=>{r.addEventListener("click",()=>{r.dataset.grassrootsDemo,c()})}),e.querySelectorAll("[data-grassroots-band]").forEach(r=>{r.addEventListener("click",()=>{r.dataset.grassrootsBand,c()})});const d=e.querySelector("#ca-dismiss-result");d&&d.addEventListener("click",()=>{Ue=null,c()}),V==="protest"&&!Ue&&!Ve&&!yt&&(yt=!0,Ba(s,t,o).then(()=>{yt=!1,c()}).catch(r=>{console.error("[Protest] loadProtestData failed:",r),yt=!1,Ve=Ve||[],it=it||[],We=We||{failingStats:[],_fatigueLevel:{label:"—",color:"#4a4840"}},c()})),e.querySelectorAll("[data-protest-tab]").forEach(r=>{r.addEventListener("click",()=>{Ze=r.dataset.protestTab,ne=null,c()})}),e.querySelectorAll("[data-protest-target]").forEach(r=>{r.addEventListener("click",()=>{const _=r.dataset.protestTarget;try{const h=JSON.parse(_);ne=ne?.id===h.id?null:h}catch{ne=null}c()})});const x=e.querySelector("#ca-confirm-btn");x&&x.addEventListener("click",()=>{x.classList.contains("disabled")||(x.classList.add("disabled"),Ka(e,t,s,p,i,n,o))})}let It=!1;window._protestEndorse=async function(){if(!It&&!(!je||ot)&&confirm("Endorse this protest? Costs 1 AP and boosts turnout (+15).")){It=!0;try{const e=await sa(I,W.id,nt.id,je.id,ve.current_tick);if(!e.success){Q(e.error||"Endorsement failed.");return}ot=!0,W.action_points=Math.max(0,(W.action_points||0)-1);const t=await ze(W.id);t!==void 0&&(W.action_points=t),await rt(nt,W,ve,Ke)}catch(e){console.error("[Protest] Endorse failed:",e),Q("Endorsement failed: "+e.message)}finally{It=!1}}};let Pt=!1;window._protestCallOff=async function(){if(!Pt&&Z){if(Z.tier===7){Q("Tier 7 protests cannot be called off.");return}if(confirm("Call off this protest? Costs "+Ge.CALL_OFF_AP+" AP. A small approval boost from moderate blocs will be applied.")){Pt=!0;try{const e=await aa(I,W.id,Z.id,ve.current_tick);if(!e.success){Q(e.error||"Call-off failed.");return}W.action_points=Math.max(0,(W.action_points||0)-Ge.CALL_OFF_AP);const t=await ze(W.id);t!==void 0&&(W.action_points=t),await rt(nt,W,ve,Ke)}catch(e){console.error("[Protest] Call-off failed:",e),Q("Call-off failed: "+e.message)}finally{Pt=!1}}}};async function Ka(e,t,s,p,i,n,o){const v=kt.find(r=>r.id===V)||(V==="protest"?{id:"protest",name:"Organise a Protest",ap:Ot(),color:"#d9534f"}:null);if(!v)return;const l=Ot();if(p<l||!os())return;const c=document.getElementById("ca-confirm-btn");c&&(c.classList.add("disabled"),c.textContent="EXECUTING...");let d;try{if(v.id==="rally")d=await Gs(I,t.id,s.id,null,o);else if(v.id==="attack")d=await Us(I,t.id,s.id,Oe,Le,o);else if(v.id==="promise"){const r=Re==="stat"?{statKey:at}:{crisisId:ke};d=await js(I,t.id,s.id,o,Re,r)}else if(v.id==="protest"){if(!ne)return;const r=ne.grievanceData||{},_=ne.demandLabel||"";d=await oa(I,t.id,s.id,ne.type,r,_,o)}else if(v.id==="take_stance")d=await zt(I,t.id,s.id,ge,ye,fe,Ee,o);else if(v.id==="poll_now")d=await Vs(I,t.id,s.id,o,Se);else if(v.id==="fund_think_tank")d=await Ws(I,t.id,s.id,J,ee,o);else if(v.id==="media_campaign")d=await Ks(I,t.id,s.id,J,ee,o);else if(v.id==="grassroots_movement")d=await Ys(I,t.id,s.id,J,ee,o);else if(v.id==="press_conference"){const{deductAP:r}=await _t(async()=>{const{deductAP:a}=await import("./config-BIsh65GI.js");return{deductAP:a}},[]),{getTraitAPModifier:_}=await _t(async()=>{const{getTraitAPModifier:a}=await import("./bills-B3AzSrkp.js").then(g=>g.a8);return{getTraitAPModifier:a}},__vite__mapDeps([0,1,2,3])),h=Math.max(1,2+_("press_conference",t,o)),u=await r(I,t.id,h,{reason:"press_conference",detail:"Press Conference",tick:o});if(!u.success)d={success:!1,error:u.error||"Insufficient AP"};else{let a=Math.floor(Math.random()*5)-2;Me?(s.gov_approval||0)>=40&&(a+=2):a+=1;const g=a>=0?"+":"",{error:C}=await I.rpc("adjust_momentum",{p_faction_id:t.id,p_delta:a,p_label:`Press Conference (${g}${a})`,p_tick:o});C&&console.warn("[PressConference] Momentum RPC failed:",C.message),await I.from("campaign_actions").insert({party_id:t.id,nation_id:s.id,action_type:"press_conference",ap_cost:h,tick_performed:o,result:{momentumDelta:a}}),d={success:!0,newAp:u.newAp,headline:"Press Conference",effects:[{label:"Press Coverage",value:`${g}${a}`}],outcomeName:`Press conference — ${g}${a} momentum`}}}else if(v.id==="outreach"){const{deductAP:r}=await _t(async()=>{const{deductAP:a}=await import("./config-BIsh65GI.js");return{deductAP:a}},[]),{getTraitAPModifier:_}=await _t(async()=>{const{getTraitAPModifier:a}=await import("./bills-B3AzSrkp.js").then(g=>g.a8);return{getTraitAPModifier:a}},__vite__mapDeps([0,1,2,3])),h=Math.max(1,3+(ht||0)+_("outreach",t,o)),u=await r(I,t.id,h,{reason:"outreach",detail:"Community Outreach",tick:o});if(!u.success)d={success:!1,error:u.error||"Insufficient AP"};else{const{data:a}=await I.from("faction_electoral_standing").select("id, platform_appeal").eq("faction_id",t.id).eq("nation_id",s.id).maybeSingle();if(a){const g=Math.min(100,(Number(a.platform_appeal)||0)+3);await I.from("faction_electoral_standing").update({platform_appeal:g}).eq("id",a.id)}await I.from("campaign_actions").insert({party_id:t.id,nation_id:s.id,action_type:"outreach",ap_cost:h,tick_performed:o,result:{appealBoost:3}}),d={success:!0,newAp:u.newAp,headline:"Community Outreach",effects:[{label:"Appeal",value:"+3"}],outcomeName:"Community outreach — +3 platform appeal"}}}else if(v.id==="pivot"&&(d=await Xs(I,t.id,s.id,J,ee,o),d.success)){const{data:r}=await I.from("factions").select("pivot_count, pivot_last_tick, pivot_cycle_start_tick").eq("id",t.id).single();r&&(t.pivot_count=r.pivot_count,t.pivot_last_tick=r.pivot_last_tick,t.pivot_cycle_start_tick=r.pivot_cycle_start_tick),lt=null}}catch(r){console.error("Campaign action error:",r),Q("Action failed: "+r.message),c&&(c.classList.remove("disabled"),c.textContent=`Confirm — ${l} AP`);return}if(!d||!d.success){Q(d?.message||d?.error||"Action failed."),c&&(c.classList.remove("disabled"),c.textContent=`Confirm — ${l} AP`);return}t.action_points=d.newAp??(t.action_points??0)-l;const x=await ze(t.id);if(x!==void 0&&(t.action_points=x),Ue=d,await rt(s,t,ve,Ke),v.id==="take_stance"){Lt(t.id,s.id);const r=document.getElementById("ca-stance-portfolio-container");r&&(r.querySelector(".sp-card")?.remove(),Et(r,t,s))}}const _e=[{key:"security_freedom",blocKey:"axis_security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",blocKey:"axis_tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"individualism_collectivism",blocKey:"axis_individualism_collectivism",leftLabel:"Individualism",rightLabel:"Collectivism"},{key:"globalism_nationalism",blocKey:"axis_globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"liberty_equality",blocKey:"axis_liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"}],Ya=15,Xa=25;async function Ja(e,t,s,p,i){const n=document.getElementById("electorate-spread-container");if(!n)return;const{data:o}=await I.from("electorate_profile").select("*").eq("nation_id",t.id).maybeSingle();if(!o){n.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No electorate data available.</div>';return}const v={};for(const m of p||[])v[m.faction_id]=m;const l=Number(t.polarization??50),c=Number(t.stability??50),d=Number(t.ethnic_diversity??50),r=5+Math.min(100,Math.max(0,l*.9+(100-c)*.07+d*.03))/100*40,_={};for(const m of _e){const b=Number(o["ideo_mean_"+m.key]??50);_[m.key]={mean:b,zoneVariance:r}}const h=(s||[]).map(m=>{const b=v[m.id]||{},S=m.id===e.id;return{id:m.id,abbr:m.abbreviation||"??",color:m.party_color||"#888",isPlayer:S,ideology:{security_freedom:Number(b.security_freedom??0),tradition_progress:Number(b.tradition_progress??0),liberty_equality:Number(b.liberty_equality??0),globalism_nationalism:Number(b.globalism_nationalism??0),individualism_collectivism:Number(b.individualism_collectivism??0)}}}),u=v[e.id]||{},a={},g=h.filter(m=>!m.isPlayer);for(const m of g)a[m.id]=!0;let C=0;function k(m){const S=(Number(u[m]??0)+100)/2,$=_[m].mean,y=Math.abs(S-$);return y<=Ya?{cls:"es-match-yes",label:"✓ Aligned",gap:y}:y<=Xa?{cls:"es-match-part",label:"~ Partial",gap:y}:{cls:"es-match-no",label:"✗ Misaligned",gap:y}}for(const m of _e){const b=k(m.key);b.cls==="es-match-yes"||b.cls,C+=Math.max(0,100-b.gap)}Math.round(C/_e.length);function A(){let m="";for(let f=0;f<_e.length;f++){const E=_e[f],L=_[E.key],O=k(E.key),R=L.mean,T=L.zoneVariance,P=Math.max(0,R-T),N=Math.min(100,R+T)-P,q=l>=76?"deeply divided":l>=51?"polarized":l>=26?"moderately divided":"near centrist";let M;R<45?M=`Electorate is <strong>${q}</strong>, leans ${w(E.leftLabel)} — mean ${Math.round(R)} / 100`:R>55?M=`Electorate is <strong>${q}</strong>, leans ${w(E.rightLabel)} — mean ${Math.round(R)} / 100`:M=`Electorate is <strong>${q}</strong> — mean ${Math.round(R)} / 100`;let B="";for(let j=0;j<h.length;j++){const F=h[j],Pe=(F.ideology[E.key]+100)/2,de=j%2===0?"":"es-below",G=!F.isPlayer&&!a[F.id]?"es-hidden":"";F.isPlayer?B+=`
                    <div class="es-pm ${G}" data-es-party="${F.id}" style="left:${Pe}%">
                        <div class="es-pm-bar" style="background:${F.color}"></div>
                        <div class="es-pm-ring" style="border-color:${F.color}"></div>
                        <div class="es-pm-dot" style="background:${F.color}"></div>
                        <div class="es-pm-label" style="color:${F.color}">${w(F.abbr)}</div>
                    </div>`:B+=`
                    <div class="es-pm ${G}" data-es-party="${F.id}" style="left:${Pe}%">
                        <div class="es-pm-bar" style="background:${F.color}"></div>
                        <div class="es-pm-dot" style="background:${F.color}"></div>
                        <div class="es-pm-label ${de}" style="color:${F.color}">${w(F.abbr)}</div>
                    </div>`}let U="";if(O.cls==="es-match-no"){const j=(Number(u[E.key]??0)+100)/2,F=Math.min(j,R),he=Math.abs(j-R);U=`<div class="es-gap" style="left:${F}%;width:${he}%">
                    <div class="es-gap-label">${Math.round(O.gap)}pt gap</div>
                </div>`}const{zones:z,zoneForPos:H}=Zt(R,L.zoneVariance);let Y="";const le={"radical-left":"rgba(239,68,68,0.10)","moderate-left":"rgba(251,191,36,0.07)",centrist:"rgba(74,222,128,0.08)","moderate-right":"rgba(251,191,36,0.07)","radical-right":"rgba(239,68,68,0.10)"},re={"radical-left":"rgba(239,68,68,0.25)","moderate-left":"rgba(251,191,36,0.18)",centrist:"rgba(74,222,128,0.22)","moderate-right":"rgba(251,191,36,0.18)","radical-right":"rgba(239,68,68,0.25)"},ce={"radical-left":"rgba(239,68,68,0.50)","moderate-left":"rgba(251,191,36,0.45)",centrist:"rgba(74,222,128,0.50)","moderate-right":"rgba(251,191,36,0.45)","radical-right":"rgba(239,68,68,0.50)"},Ae=P+N;for(const j of z){if(j.width<1)continue;const F=Math.max(j.left,P),he=Math.min(j.left+j.width,Ae);if(he<=F)continue;const Pe=(F-P)/N*100,de=(he-F)/N*100,G=de>8;Y+=`<div class="es-zone" style="left:${Pe}%;width:${de}%;background:${le[j.id]};border-left:1px solid ${re[j.id]};border-right:1px solid ${re[j.id]}">
                    ${G?`<span class="es-zone-label" style="color:${ce[j.id]}">${j.label}</span>`:""}
                </div>`}const Be=(Number(u[E.key]??0)+100)/2,Ie=H(Be),ct=z.find(j=>j.id===Ie)?.label||"",Ye=[];for(const j of h){if(j.isPlayer)continue;const F=(j.ideology[E.key]+100)/2;H(F)===Ie&&Ye.push(j)}let De=ct;Ie.endsWith("-left")?De+=" "+E.leftLabel:Ie.endsWith("-right")&&(De+=" "+E.rightLabel);let dt="";if(Ye.length>0){const j=Ye.map(F=>`<strong style="color:${F.color}">${w(F.abbr)}</strong>`).join(" and ");dt=`<div class="es-split-note">You are <strong>${w(De)}</strong> and currently splitting votes with ${j}</div>`}else dt=`<div class="es-split-note es-split-clear">You are <strong>${w(De)}</strong> — no parties competing in your zone</div>`;const pt=f===_e.length-1;m+=`
            <div class="es-axis-block">
                <div class="es-axis-header">
                    <div class="es-axis-info">
                        <div class="es-axis-name">${w(E.leftLabel)} / ${w(E.rightLabel)}</div>
                        <div class="es-axis-read">${M}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span class="es-zone-badge" data-zone="${Ie}">${ct}</span>
                        <div class="es-match ${O.cls}">${O.label}</div>
                    </div>
                </div>
                <div class="es-spectrum">
                    <div class="es-pole-row">
                        <span class="es-pole">${w(E.leftLabel)}</span>
                        <span class="es-pole">${w(E.rightLabel)}</span>
                    </div>
                    <div class="es-track">
                        <div class="es-center"><div class="es-center-label">Center</div></div>
                        <div class="es-variance" style="left:${P}%;width:${N}%">${Y}</div>
                        <div class="es-emean" style="left:${R}%"><div class="es-emean-label">Electorate</div></div>
                        ${U}
                        ${B}
                    </div>
                </div>
                ${dt}
            </div>
            ${pt?"":'<div class="es-div"></div>'}`}const b=h.find(f=>f.isPlayer);let S="";if(b){const f=Ce(b.color,.1),E=Ce(b.color,.25);S+=`<div class="es-leg-pill" style="color:${b.color};background:${f};border-color:${E}">
                <div class="es-leg-dot" style="background:${b.color}"></div>${w(b.abbr)} <span style="opacity:.55;font-size:7px">YOU</span>
            </div>`}for(const f of g){const E=Ce(f.color,.1),L=Ce(f.color,.25),O=a[f.id]?"":"es-dimmed";S+=`<div class="es-leg-pill ${O}" data-es-toggle="${f.id}" style="color:${f.color};background:${E};border-color:${L}">
                <div class="es-leg-dot" style="background:${f.color}"></div>${w(f.abbr)}
            </div>`}const $=[];if(l>=65){const f=l>=85?"High":"Elevated";$.push({label:`${f} Polarization`,stat:Math.round(l),color:"var(--dred)",note:"pushing the electorate to the fringes"})}if(c<=35){const f=c<=15?"Very low":"Low";$.push({label:`${f} Stability`,stat:Math.round(c),color:"var(--damber)",note:"pushing the electorate to the fringes"})}d>=65&&$.push({label:"High Ethnic Diversity",stat:Math.round(d),color:"var(--dteal)",note:"widening ideological divisions"}),l<=25&&c>=65&&$.push({label:"Stable & United",stat:null,color:"var(--dgreen)",note:"electorate is ideologically consolidated"});let y="";if($.length>0){y='<div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 16px;border-bottom:1px solid var(--dborder-hair)">';for(const f of $)y+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:${f.color};display:flex;align-items:center;gap:4px">`,y+=`<span style="font-weight:700">${f.label}</span>`,f.stat!==null&&(y+=`<span style="opacity:0.6">(${f.stat})</span>`),y+=`<span style="color:var(--dtext-3)">— ${f.note}</span>`,y+="</div>";y+="</div>"}n.innerHTML=`
        <div class="es-page-label">Electorate Ideology Spread — <span class="es-nation">${w(t.name)}</span> · Tick ${i}</div>
        <div class="es-outer">
            <div class="es-hdr">
                <div class="es-hdr-left">
                    <div class="es-hdr-dot"></div>
                    <span class="es-hdr-title">Electorate Ideology Spread</span>
                </div>
                <div class="es-legend" id="es-legend">${S}</div>
            </div>
            ${y}
            <div class="es-body">${m}</div>
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
                        <circle cx="8" cy="8" r="5" fill="${b?b.color:"#9b7ec8"}"/>
                        <circle cx="8" cy="8" r="8" fill="none" stroke="${b?b.color:"#9b7ec8"}" stroke-width="1.5" opacity="0.55"/>
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
        </div>`,n.querySelectorAll("[data-es-toggle]").forEach(f=>{f.addEventListener("click",()=>{const E=f.getAttribute("data-es-toggle");a[E]=!a[E],f.classList.toggle("es-dimmed",!a[E]),n.querySelectorAll(`[data-es-party="${E}"]`).forEach(L=>{L.classList.toggle("es-hidden",!a[E])})})})}A()}async function Et(e,t,s){const[p,i,n]=await Promise.all([I.from("faction_issue_stance").select("*").eq("faction_id",t.id).eq("nation_id",s.id),I.from("issue_state").select("issue_id, salience, owned_by, pioneer_faction_id").eq("nation_id",s.id),I.from("shard").select("current_tick").eq("name","Alpha Shard").single()]);p.error&&console.error("[Politics] Failed to load stances:",p.error.message),i.error&&console.error("[Politics] Failed to load issue states:",i.error.message);const o=p.data||[],v=i.data||[],l=n.data?.current_tick||0,c={};for(const u of v)c[u.issue_id]=u;const d=ae.MAX_STANCES,x=o.length>=d;let r="";if(o.length===0)r='<div class="sp-empty">No active stances. Take a stance on an issue to build platform appeal.</div>';else for(const u of o){const a=be[u.issue_id];if(!a)continue;const g=oe.find(T=>T.key===u.axis),C=u.side==="left"?g?.leftLabel:g?.rightLabel,k=u.side==="left"?g?.leftColor:g?.rightColor,A=Number(u.strength??0),m=Number(u.decay_rate??0),b=Number(u.ticks_held??0),S=A<=40,$=A<=20,y=$?"var(--dred)":S?"var(--damber)":"var(--dgreen)",f=c[u.issue_id],E=Number(f?.salience??30),L=u.ideologically_consistent?"":'<span class="sp-badge sp-badge--warn">INCONSISTENT</span>',O=u.is_pioneer?'<span class="sp-badge sp-badge--good">PIONEER</span>':"",R=S?`<span class="sp-badge sp-badge--fade">${$?"EXPIRING":"FADING"}</span>`:"";r+=`
            <div class="sp-row" data-stance-issue="${u.issue_id}">
                <div class="sp-row-top">
                    <div class="sp-row-left">
                        <span class="sp-issue-name">${w(a.label)}</span>
                        <span class="sp-side-pill" style="color:${k};border-color:${k}">${u.intensity} ${C}</span>
                        ${O}${L}${R}
                    </div>
                    <div class="sp-row-right">
                        <span class="sp-salience" title="Issue salience">Salience: ${E.toFixed(0)}</span>
                        <span class="sp-ticks">Held ${b} ticks</span>
                    </div>
                </div>
                <div class="sp-bar-row">
                    <div class="sp-bar-track">
                        <div class="sp-bar-fill" style="width:${A}%;background:${y}"></div>
                    </div>
                    <span class="sp-str-val" style="color:${y}">${A.toFixed(0)}</span>
                    <span class="sp-decay" style="color:var(--dred)">-${m}/tick</span>
                </div>
                <div class="sp-row-actions">
                    <button class="sp-btn sp-btn--reinforce" data-stance-action="reinforce" data-stance-issue="${u.issue_id}" data-stance-axis="${u.axis}" data-stance-side="${u.side}" data-stance-intensity="${u.intensity}">Reinforce</button>
                    <button class="sp-btn sp-btn--modify" data-stance-action="modify" data-stance-issue="${u.issue_id}">Modify</button>
                </div>
            </div>`}const _=`
    <div class="sp-card" style="margin-top:20px;max-width:780px;">
        <div class="sp-card-header">
            <div class="sp-card-title">Active Stance Portfolio</div>
            <div class="sp-card-count">${o.length} / ${d}</div>
        </div>
        <div class="sp-stances">${r}</div>
        <div class="sp-footer">
            <button class="sp-btn sp-btn--new${x?" sp-btn--disabled":""}" id="sp-new-stance-btn" ${x?'disabled title="Maximum stances reached (5/5)"':""}>
                + New Stance${x?" (5/5)":""}
            </button>
            <span class="sp-footer-hint">${ae.AP_COST} AP · ${ae.COOLDOWN_WINDOW}-tick cooldown</span>
        </div>
    </div>`;e.insertAdjacentHTML("beforeend",_),e.querySelectorAll('[data-stance-action="reinforce"]').forEach(u=>{u.addEventListener("click",async()=>{if((t.action_points||0)<ae.AP_COST){Q(`Need ${ae.AP_COST} AP to reinforce stance.`);return}const a=u.dataset.stanceIssue,g=u.dataset.stanceAxis,C=u.dataset.stanceSide,k=u.dataset.stanceIntensity;u.disabled=!0,u.textContent="Reinforcing...";try{const A=await zt(I,t.id,s.id,a,g,C,k,l);if(A.success){A.newAp!=null&&(t.action_points=A.newAp,W&&(W.action_points=A.newAp));const m=await ze(t.id);m!==void 0&&(t.action_points=m,W&&(W.action_points=m)),e.querySelector(".sp-card")?.remove(),await Et(e,t,s),Lt(t.id,s.id)}else Q(A.message||"Failed to reinforce stance."),u.disabled=!1,u.textContent="Reinforce"}catch(A){Q("Reinforce failed: "+A.message),u.disabled=!1,u.textContent="Reinforce"}})}),e.querySelectorAll('[data-stance-action="modify"]').forEach(u=>{u.addEventListener("click",()=>{jt(t,s,l,c,o,u.dataset.stanceIssue)})});const h=document.getElementById("sp-new-stance-btn");h&&!x&&h.addEventListener("click",()=>{jt(t,s,l,c,o,null)})}function jt(e,t,s,p,i,n){document.getElementById("stance-modal-overlay")?.remove();const o=new Set(i.map(a=>a.issue_id)),v=i.length>=ae.MAX_STANCES,l=Xt.map(a=>({id:a,def:be[a],salience:Number(p[a]?.salience??30),hasStance:o.has(a)})).sort((a,g)=>g.salience-a.salience);let c="";for(const a of l){const g=!a.hasStance&&v,C=a.id===n,k=a.salience>=60?"var(--dred)":a.salience>=40?"var(--damber)":"var(--dtext-3)",A=a.def.axes.map(m=>{const b=oe.find(S=>S.key===m);return b?`${b.leftLabel}/${b.rightLabel}`:m}).join(", ");c+=`
        <div class="sm-issue${C?" sm-issue--selected":""}${g?" sm-issue--disabled":""}"
             data-sm-issue="${a.id}" ${g?"":'role="button" tabindex="0"'}>
            <div class="sm-issue-top">
                <span class="sm-issue-name">${w(a.def.label)}</span>
                ${a.hasStance?'<span class="sm-issue-badge">HAS STANCE</span>':""}
            </div>
            <div class="sm-issue-meta">
                <span class="sm-issue-salience" style="color:${k}">Salience: ${a.salience.toFixed(0)}</span>
                <span class="sm-issue-axes">${A}</span>
            </div>
        </div>`}const d=`
    <div class="modal-overlay active" id="stance-modal-overlay">
        <div class="sm-modal">
            <div class="sm-header">
                <span class="sm-title">Take a Stance</span>
                <button class="sm-close" id="sm-close-btn">&times;</button>
            </div>
            <div class="sm-body">
                <div class="sm-section-label">Select Issue</div>
                <div class="sm-issue-list">${c}</div>
                <div id="sm-config-area"></div>
            </div>
            <div class="sm-footer" id="sm-footer" style="display:none">
                <button class="sp-btn sp-btn--new" id="sm-confirm-btn" disabled>Confirm Stance (${ae.AP_COST} AP)</button>
            </div>
        </div>
    </div>`;document.body.insertAdjacentHTML("beforeend",d);let x=n,r=null,_=null,h="moderate";function u(){const a=document.getElementById("sm-config-area"),g=document.getElementById("sm-footer");if(!a||!x){a&&(a.innerHTML=""),g&&(g.style.display="none");return}const C=be[x];if(!C)return;C.axes.length===1&&!r&&(r=C.axes[0]);let k='<div class="sm-section-label" style="margin-top:14px;">Choose Axis</div><div class="sm-axis-list">';for(const $ of C.axes){const y=oe.find(E=>E.key===$);if(!y)continue;k+=`<div class="sm-axis-opt${$===r?" sm-axis-opt--selected":""}" data-sm-axis="${$}">
                <span style="color:${y.leftColor}">${y.leftLabel}</span> / <span style="color:${y.rightColor}">${y.rightLabel}</span>
            </div>`}k+="</div>";let A="";if(r){const $=oe.find(y=>y.key===r);A=`<div class="sm-section-label" style="margin-top:14px;">Choose Side</div><div class="sm-side-list">
                <div class="sm-side-opt${_==="left"?" sm-side-opt--selected":""}" data-sm-side="left" style="border-color:${$.leftColor}">
                    <span style="color:${$.leftColor};font-weight:700">${$.leftLabel}</span>
                </div>
                <div class="sm-side-opt${_==="right"?" sm-side-opt--selected":""}" data-sm-side="right" style="border-color:${$.rightColor}">
                    <span style="color:${$.rightColor};font-weight:700">${$.rightLabel}</span>
                </div>
            </div>`}let m="";if(_){const $=oe.find(E=>E.key===r),y=_==="left"?$?.leftLabel??"Left":$?.rightLabel??"Right",f=_==="left"?$?.leftColor??"#ccc":$?.rightColor??"#ccc";m='<div class="sm-section-label" style="margin-top:14px;">Intensity</div><div class="sm-intensity-list">';for(const[E,L]of Object.entries(ae.INTENSITY))m+=`<div class="sm-int-opt${E===h?" sm-int-opt--selected":""}" data-sm-intensity="${E}">
                    <span class="sm-int-name">${E}</span>
                    <span class="sm-int-meta">Strength ${L.strength} · Decay ${L.decay_rate}/tick</span>
                    <span class="sm-int-meta" style="color:${f};font-weight:600">+${L.ideology_shift} ${y}</span>
                </div>`;if(m+="</div>",h){const E=ae.INTENSITY[h],L=be[x];m+=`<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                    <div style="color:var(--dtext-1);font-weight:600;margin-bottom:3px">${h.toUpperCase()} ${y.toUpperCase()} on ${L?.label||""}</div>
                    <div style="color:${f};font-weight:700">Ideology: +${E.ideology_shift} ${y}</div>
                    <div style="color:var(--dtext-3);margin-top:2px">Strength: ${E.strength} · Decay: -${E.decay_rate}/tick</div>
                </div>`}}a.innerHTML=k+A+m;const b=x&&r&&_&&h;g.style.display=b?"flex":"none";const S=document.getElementById("sm-confirm-btn");S&&(S.disabled=!b),a.querySelectorAll("[data-sm-axis]").forEach($=>{$.addEventListener("click",()=>{r=$.dataset.smAxis,_=null,u()})}),a.querySelectorAll("[data-sm-side]").forEach($=>{$.addEventListener("click",()=>{_=$.dataset.smSide,u()})}),a.querySelectorAll("[data-sm-intensity]").forEach($=>{$.addEventListener("click",()=>{h=$.dataset.smIntensity,u()})})}document.querySelectorAll("[data-sm-issue]").forEach(a=>{a.classList.contains("sm-issue--disabled")||a.addEventListener("click",()=>{document.querySelectorAll(".sm-issue").forEach(g=>g.classList.remove("sm-issue--selected")),a.classList.add("sm-issue--selected"),x=a.dataset.smIssue,r=null,_=null,u()})}),document.getElementById("sm-close-btn")?.addEventListener("click",()=>{document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("stance-modal-overlay")?.addEventListener("click",a=>{a.target.id==="stance-modal-overlay"&&document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("sm-confirm-btn")?.addEventListener("click",async()=>{const a=document.getElementById("sm-confirm-btn");if(!a||a.disabled)return;a.disabled=!0,a.textContent="Taking stance...";const g=await zt(I,e.id,t.id,x,r,_,h,s);if(g.success){g.newAp!=null&&(e.action_points=g.newAp,W&&(W.action_points=g.newAp));const C=await ze(e.id);C!==void 0&&(e.action_points=C,W&&(W.action_points=C)),document.getElementById("stance-modal-overlay")?.remove();const k=document.getElementById("electorate-spread-container");k&&(k.querySelector(".sp-card")?.remove(),await Et(k,e,t)),Lt(e.id,t.id)}else Q(g.message||"Failed to take stance."),a.disabled=!1,a.textContent=`Confirm Stance (${ae.AP_COST} AP)`}),n&&u()}async function Lt(e,t){const s=document.getElementById("stance-summary-strip");if(!s)return;const{data:p}=await I.from("faction_issue_stance").select("issue_id, axis, side, intensity, strength, decay_rate, ticks_held, is_pioneer, ideologically_consistent").eq("faction_id",e).eq("nation_id",t),i=ae.MAX_STANCES;if(!p||p.length===0){s.innerHTML=`<div style="color:var(--dtext-3);font-size:12px;font-family:var(--dfont-ui);padding:4px 0;">
            No active stances. Take a stance in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab.
        </div>`;return}let n="";for(const o of p){const v=be[o.issue_id];if(!v)continue;const l=oe.find(A=>A.key===o.axis),c=o.side==="left"?l?.leftLabel:l?.rightLabel,d=o.side==="left"?l?.leftColor:l?.rightColor,x=Number(o.strength??0),r=Number(o.decay_rate??0),_=Number(o.ticks_held??0),h=x<=20,u=x<=40,a=h?"var(--dred)":u?"var(--damber)":"var(--dgreen)",g=o.is_pioneer?'<span style="font-size:9px;color:#4ade80;font-weight:700;margin-left:4px">PIONEER</span>':"",C=o.ideologically_consistent===!1?'<span style="font-size:9px;color:#f97316;font-weight:700;margin-left:4px">INCONSISTENT</span>':"",k=u?`<span style="font-size:9px;color:${a};font-weight:700;margin-left:4px">${h?"EXPIRING":"FADING"}</span>`:"";n+=`
        <div style="padding:6px 0;${n?"border-top:1px solid var(--dborder-0);":""}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:2px">
                    <span style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${w(v.label)}</span>
                    <span style="font-size:10px;padding:1px 5px;border:1px solid ${d};border-radius:3px;color:${d};margin-left:4px">${o.intensity} ${c}</span>
                    ${g}${C}${k}
                </div>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3)">Held ${_}t</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;height:6px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">
                    <div style="width:${x}%;height:100%;background:${a};border-radius:2px"></div>
                </div>
                <span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${a};width:28px;text-align:right">${x.toFixed(0)}</span>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);width:40px;text-align:right">-${r}/t</span>
            </div>
        </div>`}s.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-family:var(--dfont-mono);font-size:11px;color:var(--dtext-2)">${p.length} / ${i}</span>
        </div>
        ${n}
        <div style="margin-top:8px;font-size:10px;color:var(--dtext-3);font-family:var(--dfont-ui)">Manage stances in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab</div>`}const Za=[{key:"security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"},{key:"globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"individualism_collectivism",leftLabel:"Individual",rightLabel:"Collectivism"}];async function Qa(e,t,s,p,i,n,o){const v=document.getElementById("other-parties-container");if(!v)return;const l=(s||[]).filter(m=>m.id!==e.id),c=l.map(m=>m.id);if(l.length===0){v.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No rival parties found.</div>';return}const d={};for(const m of p||[])d[m.faction_id]=m;const{data:x}=await I.from("administrations").select("stats_at_start, started_at_tick").eq("nation_id",t.id).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle();let r=0;if(x?.stats_at_start){let m=0,b=0;for(const y of Kt){const f=Yt(y);if(f===0)continue;const E=Number(x.stats_at_start[y]??0),O=Number(t[y]??0)-E;O!==0&&(m+=O*f,b++)}b>0&&(r=m/b);const S=o-(x.started_at_tick||o),$=Math.floor(S/12);r>0&&(r*=Math.pow(.95,$))}const{data:_}=await I.from("factions").select("id, leader_first_name, leader_last_name, leader_age, founded_tick, ideology_value_1, ideology_value_2").in("id",c),h={};for(const m of _||[])h[m.id]=m;const u=i&&i.party_ids?i.party_ids:[],a=i?i.lead_party_id:null,g=l.map(m=>{const b=h[m.id]||{},S=d[m.id]||{},$=b.leader_first_name&&b.leader_last_name?b.leader_first_name+" "+b.leader_last_name:"Vacant",y=b.leader_age||null,f=Number(m.national_vote_share||0);let E="opposition";u.includes(m.id)&&(E=m.id===a?"governing_head":"governing_junior");const L=E.startsWith("governing"),O=Math.round((L?r:-r)*10);return{id:m.id,name:m.faction_name||"Unknown",abbreviation:m.abbreviation||"??",color:m.party_color||"#888",customLogoUrl:m.custom_logo_url||null,partyLogo:m.party_logo||null,description:m.party_description||"",status:E,foundedTick:b.founded_tick,leaderName:$,leaderAge:y,seats:m.seats||0,totalSeats:n,voteShare:f,govScore:O,ideology:{security_freedom:S.security_freedom??0,tradition_progress:S.tradition_progress??0,liberty_equality:S.liberty_equality??0,globalism_nationalism:S.globalism_nationalism??0,individualism_collectivism:S.individualism_collectivism??0},stances:[]}});let C="seats";const k={seats:(m,b)=>b.seats-m.seats,vote_share:(m,b)=>b.voteShare-m.voteShare,approval:(m,b)=>b.govScore-m.govScore,alignment:(m,b)=>{const S=Object.values(m.ideology).reduce((y,f)=>y+Math.abs(f),0);return Object.values(b.ideology).reduce((y,f)=>y+Math.abs(f),0)-S}};function A(){const b=[...g].sort(k[C]).map(S=>eo(S)).join("");v.innerHTML=`
        <div class="op-top">
            <div class="op-top-left">
                <div class="op-title">Rival Parties — ${w(t.name)}</div>
                <div class="op-note">Stance data based on observable actions. Ideology positions may be estimated.</div>
            </div>
            <div class="op-sort-row">
                <span class="op-sort-label">Sort by</span>
                <button class="op-sort-btn${C==="seats"?" active":""}" data-op-sort="seats">Seats</button>
                <button class="op-sort-btn${C==="vote_share"?" active":""}" data-op-sort="vote_share">Vote Share</button>
                <button class="op-sort-btn${C==="alignment"?" active":""}" data-op-sort="alignment">Alignment</button>
            </div>
        </div>
        <div class="op-grid">${b}</div>`,v.querySelectorAll(".op-sort-btn").forEach(S=>{S.addEventListener("click",()=>{C=S.getAttribute("data-op-sort"),A()})})}A()}function eo(e,t){const s=e.color,p=Ce(s,.12),i=Ce(s,.35),n=Ce(s,.5),o=Ce(s,.2),v=Ce(s,.06),l=Rt({customLogoUrl:e.customLogoUrl,iconKey:e.partyLogo,size:32,color:s});let c,d;e.status==="governing_head"?(c="GOVERNING — HEAD",d="op-badge-green"):e.status==="governing_junior"?(c="GOVERNING — JUNIOR",d="op-badge-green"):(c="OPPOSITION",d="op-badge-red");const x=e.foundedTick!=null?$e(e.foundedTick):null,r=x?`<span class="op-badge op-badge-party" style="color:${s};border-color:${i};font-size:12px">Est. ${w(x)}</span>`:"",_=`<span class="op-badge op-badge-party" style="color:${s};border-color:${i};font-size:12px">Leader: ${w(e.leaderName)}${e.leaderAge?" ("+e.leaderAge+")":""}</span>`,h=e.description?`<div class="op-desc" style="font-size:13px;line-height:1.6">${w(e.description)}</div>`:"",u=e.govScore>2?"var(--dgreen)":e.govScore>0||e.govScore>-2?"var(--damber)":"var(--dred)",a=e.govScore>0?"+":"",g=e.status.startsWith("governing")?"GOV":"OPP";let C="";for(const y of Za){const f=e.ideology[y.key]??0,E=(f+100)/2;let L;f>0?L=`left:50%;width:${f/2}%;background:${n}`:f<0?L=`right:50%;width:${Math.abs(f)/2}%;background:${n}`:L=`left:50%;width:0%;background:${n}`,C+=`
        <div class="op-axis">
            <div class="op-axis-poles"><span>${y.leftLabel}</span><span>${y.rightLabel}</span></div>
            <div class="op-axis-track">
                <div class="op-axis-center"></div>
                <div class="op-axis-fill" style="${L}"></div>
                <div class="op-axis-dot" style="left:${E}%;background:${o};border-color:${s}"></div>
            </div>
        </div>`}const k=Object.values(e.ideology).filter(y=>Math.abs(y)>=50).length;let A,m,b;return k>=4?(A="var(--dgreen)",m="Strong Conviction",b=`${k} strong positions. Consistent ideological identity across axes.`):k<=1?(A="var(--dred)",m="Weak Conviction",b=`Only ${k} strong position${k===1?"":"s"}. Centrist on most axes — voters may not trust their platform.`):(A="var(--dteal)",m="Established Party",b=`${k} strong positions. Moderate ideological clarity.`),`
    <div class="op-card" style="background:linear-gradient(135deg, ${v} 0%, var(--dbg-2) 40%);border-color:${i}">
        <div class="op-card-hdr" style="border-bottom-color:${i}">
            <div class="op-logo-wrap" style="background:${p};border:1px solid ${i};border-radius:6px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${l}</div>
            <div class="op-hdr-info">
                <div class="op-name" style="color:${s}">${w(e.name)}</div>
                <div class="op-meta">
                    <span class="op-badge ${d}">${c}</span>
                    ${r}
                    ${_}
                </div>
            </div>
        </div>
        ${h}
        <div class="op-body">
            <div class="op-col-left">
                <div class="op-sec-label">Party Stats</div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Seats</span>
                    <span class="op-sr-val" style="color:${s}">${e.seats} <span style="color:var(--dtext-3);font-size:9px;font-weight:400">/ ${e.totalSeats}</span></span>
                </div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Governance <span style="font-size:8px;color:var(--dtext-3)">${g}</span></span>
                    <span class="op-sr-val" style="color:${u}">${a}${e.govScore}</span>
                </div>
                <div class="op-rule"></div>
                <div class="op-sec-label">Ideology Axes</div>
                ${C}
                <div class="op-insight" style="border-left-color:${A}">
                    <div class="op-insight-label" style="color:${A}">${m}</div>
                    <div class="op-insight-body">${b}</div>
                </div>
            </div>
            <div class="op-col-right">
                <div class="op-sec-label">Active Issue Stances</div>
                <div style="color:var(--dtxt-dim);font-size:10px;font-style:italic;padding:8px 0;">Rival stance tracking coming soon.</div>
                
            </div>
        </div>
    </div>`}function Ce(e,t){const s=e.replace("#",""),p=parseInt(s.substring(0,2),16)||0,i=parseInt(s.substring(2,4),16)||0,n=parseInt(s.substring(4,6),16)||0;return`rgba(${p},${i},${n},${t})`}async function to(e,t,s,p,i,n,o,v,l,c,d){const x=document.getElementById("elections-container");if(x)try{const r=t?.stats_at_start,_=o-(t?.started_at_tick||o),h=v.includes("Governing")||v.includes("Lead")||v==="Strongman";let u=[],a=0,g=0;if(r){for(const D of Kt){const K=Yt(D);if(K===0)continue;const te=Number(r[D]??0),X=Number(e[D]??0),pe=X-te;if(pe===0)continue;const we=pe*K;u.push({key:D,start:te,now:X,raw:pe,signed:we,dir:K}),a+=we,g++}g>0&&(a=a/g)}const C=Math.floor(_/12),k=a>0?Math.pow(.95,C):1,m=a*k*10;u.sort((D,K)=>K.signed-D.signed);const b=m>5?"var(--dgreen)":m>0||m>-5?"var(--damber)":"var(--dred)",S=m>0?"+":"",$=h?m:-m,y=$>5?"var(--dgreen)":$>0||$>-5?"var(--damber)":"var(--dred)",f=$>0?"+":"",E=u.map(D=>{const K=D.signed>0?"var(--dgreen)":"var(--dred)",te=D.signed>0?"▲":"▼",X=Js(D.key);return`<div class="elec-stat-row">
            <span class="elec-stat-name">${w(X)}</span>
            <span class="elec-stat-start">${D.start.toFixed(1)}</span>
            <span class="elec-stat-arrow" style="color:${K}">${te}</span>
            <span class="elec-stat-now">${D.now.toFixed(1)}</span>
            <span class="elec-stat-delta" style="color:${K}">${D.raw>0?"+":""}${D.raw.toFixed(1)}</span>
        </div>`}).join(""),L=r?u.length===0?'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No stat changes recorded yet.</div>':"":'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No administration data available.</div>',O=C>0&&a>0?`<div class="elec-decay-note">Incumbency decay: ${((1-k)*100).toFixed(1)}% reduction (${C} cycle${C>1?"s":""})</div>`:"",R=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Governance</span>
        </div>
        <div class="elec-box-body">
            <div class="elec-score-row">
                <div class="elec-score-block">
                    <div class="elec-score-label">${h?"Gov. Score":"National Score"}</div>
                    <div class="elec-score-value" style="color:${b}">${S}${Math.round(m)}</div>
                </div>
                ${h?"":`<div class="elec-score-block">
                    <div class="elec-score-label">Your Impact (Opposition)</div>
                    <div class="elec-score-value" style="color:${y}">${f}${Math.round($)}</div>
                </div>`}
            </div>
            ${O}
            <div class="elec-admin-info">
                <span>${w(t?.admin_name||"Government")}</span>
                <span class="elec-ticks">${_} tick${_!==1?"s":""} in power</span>
            </div>
            ${h?(()=>{const D=Number(e?.gov_approval??50),K=Math.max(-1,Math.min(1,(D-35)/30)),te=Math.max(0,1-_/20),X=Math.round(.08*K*te*1e3)/10,pe=X>0?"var(--dgreen)":X<0?"var(--dred)":"var(--dtext-3)",we=X>0?"+":"";return`<div class="elec-incumbency-row" style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:rgba(255,255,255,0.03);border-radius:4px;font-size:11px;">
                    <span style="color:var(--dtext-3)">Incumbency Turnout Modifier</span>
                    <span style="color:${pe};font-weight:600">${we}${X.toFixed(1)}%</span>
                </div>`})():""}
            <div class="elec-stat-header">
                <span class="elec-stat-name">Stat</span>
                <span class="elec-stat-start">Start</span>
                <span class="elec-stat-arrow"></span>
                <span class="elec-stat-now">Now</span>
                <span class="elec-stat-delta">Delta</span>
            </div>
            <div class="elec-stat-list">
                ${L||E}
            </div>
        </div>
    </div>`,T=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--amber"></div>
            <span class="elec-box-title">What Is Governance?</span>
        </div>
        <div class="elec-box-body elec-explainer">
            <p><strong>Governance</strong> measures how the nation's stats have changed since the current administration took power. It is the single largest factor in elections.</p>
            <p>Every nation stat is snapshotted at inauguration. Each tick, the average improvement (or decline) across all directional stats produces a <strong>governance score</strong>.</p>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">If you are Governing:</div>
                <ul>
                    <li>Your governance score directly reflects national performance under your watch.</li>
                    <li>Pass bills that move stats in the right direction — raise the stats voters want higher, lower the ones they want lower.</li>
                    <li>Appoint strong ministers — vacant ministries and poor performance drag stats down.</li>
                    <li>Beware incumbency decay: positive scores erode 5% every 12 ticks. Fresh wins matter more than old ones.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">If you are Opposition:</div>
                <ul>
                    <li>You receive the <em>inverse</em> of the governance score. Bad governance helps your election chances.</li>
                    <li>Vote against harmful legislation to protect the nation — and your reputation.</li>
                    <li>Build your case through ideology and momentum to maximize seat gains when elections come.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Incumbency Turnout Modifier:</div>
                <ul>
                    <li>Governing parties get a <strong>turnout bonus</strong> — their supporters are more likely to vote.</li>
                    <li>At high approval (60%+), this can add up to <strong>+8% turnout</strong>.</li>
                    <li>Below 35% approval, it <strong>flips negative</strong> — your own supporters stay home (anti-incumbency).</li>
                    <li>The bonus <strong>decays over time</strong> — fresh governments benefit most, long-serving ones face voter fatigue.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Stat Direction:</div>
                <p>Stats like GDP Growth, Happiness, and Stability are "higher is better." Stats like Unemployment, Crime Rate, and Pollution are "lower is better." Neutral stats (taxes, population) are excluded.</p>
            </div>
        </div>
    </div>`,P=Number(p.momentum??0),q=(P*.08).toFixed(1),M=P>=60?"var(--dgreen)":P>=30?"var(--damber)":"var(--dred)",B=Math.min(100,Math.max(0,P)),U=l?.election_tick||0,z=U>o?U-o:null,H=Array.isArray(p.momentum_log)?p.momentum_log:[],Y=H.length>0?H.slice(0,30).map(D=>{const K=o-(D.tick||0),te=D.delta>0?"var(--dgreen)":"var(--dred)",X=D.delta>0?"+":"";return`<div class="elec-mom-log-row">
                <span class="elec-mom-log-label">${w(D.label||"Event")}</span>
                <span class="elec-mom-log-delta" style="color:${te}">${X}${D.delta}</span>
                <span class="elec-mom-log-ago">${K}t ago</span>
            </div>`}).join(""):'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No momentum events yet.</div>',le=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Momentum</span>
        </div>
        <div class="elec-box-body elec-mom-body">
            <div class="elec-mom-score-row">
                <div class="elec-mom-score">
                    <span class="elec-mom-value" style="color:${M}">${Math.round(P)}</span>
                    <span class="elec-mom-max">/ 100</span>
                </div>
            </div>
            <div class="elec-mom-bar-wrap">
                <div class="elec-mom-bar" style="width:${B}%;background:${M}"></div>
            </div>
            <div class="elec-mom-decay">Decays 8%/tick — currently losing ${q}/tick</div>
            <div class="elec-mom-log-header">Recent Activity</div>
            <div class="elec-mom-log">
                ${Y}
            </div>
            ${z?`<div class="elec-mom-election">Next election in ${z} tick${z!==1?"s":""}</div>`:""}
        </div>
    </div>`,re=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--amber"></div>
            <span class="elec-box-title">What Is Momentum?</span>
        </div>
        <div class="elec-box-body elec-explainer">
            <p><strong>Momentum</strong> measures your party's political energy — how active, visible, and engaged you are with the electorate. It accounts for 30% of election outcomes.</p>
            <p>Momentum is a score from 0 to 100 that <strong>decays 8% per tick</strong>. If you stop acting, it fades. Sustained activity keeps it high. It resets to 0 after every election.</p>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Legislation:</div>
                <ul>
                    <li><strong>Sponsoring a bill:</strong> +3 momentum for the sponsoring party.</li>
                    <li><strong>Bill passes:</strong> YES voters get +2 momentum per policy article.</li>
                    <li><strong>Bill fails:</strong> YES voters lose -2 per article. NO voters gain +2 per article.</li>
                    <li>Text-only articles do not count. Abstaining gives nothing.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Campaign Actions:</div>
                <ul>
                    <li><strong>Rally</strong> (1 AP) — Moderate, reliable momentum gain.</li>
                    <li>Other campaign actions like stances, public addresses, and media campaigns also contribute.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Crisis Resolution:</div>
                <ul>
                    <li>When a national crisis is resolved, <strong>all governing coalition parties receive +8 momentum</strong>.</li>
                    <li>This rewards the government for managing the crisis — even if the resolution was automatic.</li>
                    <li>The government also receives a 1-6 approval boost alongside the momentum.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">The Tradeoff:</div>
                <p>You only get 5 AP per tick. Every AP spent campaigning is an AP not spent on bills. Governing parties must balance legislation (which builds Governance) with campaigning (which builds Momentum). Opposition can focus on campaigning but depends on government failure for Governance.</p>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Vote Locking:</div>
                <p>Once you vote YES or NO on a bill, you cannot flip to the opposite — only change to Abstain. Choose carefully.</p>
            </div>
        </div>
    </div>`,{data:ce,error:Ae}=await I.from("electorate_profile").select("*").eq("nation_id",e.id).maybeSingle();Ae&&console.error("[Elections] electorate_profile fetch failed:",Ae);const Be={};for(const D of n||[])Be[D.faction_id]=D;const Ie=Be[p.id]||{},ct=Number(e.polarization??50),Ye=Number(e.stability??50),De=Number(e.ethnic_diversity??50),pt=5+Math.min(100,Math.max(0,ct*.9+(100-Ye)*.07+De*.03))/100*40;let j="",F=0;if(ce)for(const D of _e){const te=(Number(Ie[D.key]??0)+100)/2,X=Number(ce["ideo_mean_"+D.key]??50),pe=pt,{zones:we,zoneForPos:At}=Zt(X,pe),ft=At(te),rs=ft.includes("left")?D.leftLabel:ft.includes("right")?D.rightLabel:"",cs=ft==="centrist"?"Centrist":ft.includes("moderate")?"Moderate":"Radical",ds=ft==="centrist"?"Centrist":`${cs} ${rs}`,xt=Zs(te,X,pe),ps=(xt*100).toFixed(1);F+=xt;const ut=[...we].sort((ue,gt)=>gt.width-ue.width)[0],vs=ut.id.includes("left")?D.leftLabel:ut.id.includes("right")?D.rightLabel:"",ms=ut.id==="centrist"?"Centrist":ut.id.includes("moderate")?"Moderate":"Radical",fs=ut.id==="centrist"?"Centrist":`${ms} ${vs}`,us=xt>=.6?"var(--dgreen)":xt>=.3?"var(--damber)":"var(--dred)",gs=(Number(ce["salience_"+D.key]??.2)*100).toFixed(0),Xe=Math.max(0,X-pe),Dt=Math.min(100,X+pe),qe=Dt-Xe,ys={"radical-left":"rgba(239,68,68,0.10)","moderate-left":"rgba(251,191,36,0.07)",centrist:"rgba(74,222,128,0.08)","moderate-right":"rgba(251,191,36,0.07)","radical-right":"rgba(239,68,68,0.10)"},Ht={"radical-left":"rgba(239,68,68,0.25)","moderate-left":"rgba(251,191,36,0.18)",centrist:"rgba(74,222,128,0.22)","moderate-right":"rgba(251,191,36,0.18)","radical-right":"rgba(239,68,68,0.25)"},bs={"radical-left":"rgba(239,68,68,0.50)","moderate-left":"rgba(251,191,36,0.45)",centrist:"rgba(74,222,128,0.50)","moderate-right":"rgba(251,191,36,0.45)","radical-right":"rgba(239,68,68,0.50)"};let qt="";for(const ue of we){if(ue.width<1)continue;const gt=Math.max(ue.left,Xe),Ft=Math.min(ue.left+ue.width,Dt);if(Ft<=gt)continue;const _s=(gt-Xe)/qe*100,Gt=(Ft-gt)/qe*100,$s=Gt>8;qt+=`<div class="elec-ideo-zone" style="left:${_s}%;width:${Gt}%;background:${ys[ue.id]};border-left:1px solid ${Ht[ue.id]};border-right:1px solid ${Ht[ue.id]}">
                    ${$s?`<span class="elec-ideo-zone-label" style="color:${bs[ue.id]}">${ue.label}</span>`:""}
                </div>`}const hs=qe>0?(te-Xe)/qe*100:50,xs=qe>0?(X-Xe)/qe*100:50;j+=`
            <div class="elec-ideo-axis">
                <div class="elec-ideo-axis-header">
                    <span class="elec-ideo-axis-name">${w(D.leftLabel)} / ${w(D.rightLabel)}</span>
                    <span class="elec-ideo-salience">Salience: ${gs}%</span>
                </div>
                <div class="elec-ideo-bar-wrap">
                    <div class="elec-ideo-bar-labels">
                        <span>${w(D.leftLabel)}</span>
                        <span>${w(D.rightLabel)}</span>
                    </div>
                    <div class="elec-ideo-bar-track">
                        <div class="elec-ideo-var-band" style="left:${Xe}%;width:${qe}%">
                            ${qt}
                            <div class="elec-ideo-mean-marker" style="left:${xs}%"></div>
                            <div class="elec-ideo-player-marker" style="left:${hs}%"></div>
                        </div>
                    </div>
                    <div class="elec-ideo-bar-labels" style="margin-bottom:12px">
                        <span></span>
                    </div>
                </div>
                <div class="elec-ideo-details">
                    <span class="elec-ideo-position">Your Position: <strong>${w(ds)}</strong></span>
                    <span class="elec-ideo-capture" style="color:${us}">Voter Capture: <strong>${ps}%</strong></span>
                </div>
                <div class="elec-ideo-voters">Most voters are <strong>${w(fs)}</strong></div>
            </div>`}const he=ce?(F/_e.length*100).toFixed(1):"—",de=`
    <div class="elec-box elec-box--wide">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--purple"></div>
            <span class="elec-box-title">Ideology</span>
            <span class="elec-ideo-avg">Avg. Capture: <strong style="color:${F/_e.length>=.6?"var(--dgreen)":F/_e.length>=.3?"var(--damber)":"var(--dred)"}">${he}%</strong></span>
        </div>
        <div class="elec-box-body">
            ${ce?j:'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No electorate data available.</div>'}
        </div>
    </div>`,G=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--amber"></div>
            <span class="elec-box-title">What Is Ideology?</span>
        </div>
        <div class="elec-box-body elec-explainer">
            <p><strong>Ideology</strong> measures how well your party's positions align with what voters actually want. It accounts for 30% of election outcomes.</p>
            <p>The electorate sits on 5 ideological axes. Voters are distributed across each axis — clustered at the center in stable nations, or split into polarized camps in divided ones.</p>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Voter Capture:</div>
                <p>Your <strong>voter capture</strong> on each axis is the percentage of voters near your position. Higher capture means more votes. If you're in a zone where few voters sit, your capture is low — even if your position is "correct."</p>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Spatial Competition:</div>
                <p>Other parties compete for the same voters. Two parties in the same zone split that zone's voters between them. Finding an uncontested ideological space can be more valuable than crowding the center.</p>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">How to shift your position:</div>
                <ul>
                    <li><strong>Voting on bills</strong> — YES votes shift you toward the bill's ideological direction. NO votes shift you the opposite way.</li>
                    <li><strong>Take Stance</strong> — Declare a position on a salient issue to shift directly on the relevant axis.</li>
                    <li><strong>Fund Think Tank / Ideological Pivot</strong> — Targeted ideology actions for larger shifts.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Salience:</div>
                <p>Not all axes matter equally. <strong>Salience</strong> reflects how much voters care about each axis right now, driven by national issues. High-salience axes count more toward your ideology score.</p>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">The Electorate Moves:</div>
                <p>The electorate's position shifts over time based on national conditions. A stable, prosperous nation clusters near the center. A polarized, unstable nation splits into radical camps. Standing still doesn't guarantee alignment — the voters may move away from you.</p>
            </div>
        </div>
    </div>`,se={liberty_equality:"Liberty / Equality",tradition_progress:"Tradition / Progress",security_freedom:"Security / Freedom",globalism_nationalism:"Globalism / Nationalism",individualism_collectivism:"Individualism / Collectivism"},me=d||0,He=(i||[]).reduce((D,K)=>D+(K.seats||0),0),ns=He>0?me/He:0,vt=(c||[]).filter(D=>D.is_active!==!1);let mt="";if(vt.length===0){const D=(ns*100).toFixed(0);mt=`<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:16px 4px;text-align:center">
            No active caucuses.<br>Caucuses form when your party holds <strong>50%+</strong> of parliamentary seats.<br>
            <span style="margin-top:6px;display:inline-block">You currently hold <strong>${me}</strong> / ${He} seats (${D}%).</span>
        </div>`}else{const D=vt.reduce((K,te)=>K+Math.round(me*te.seat_share),0);for(const K of vt){const te=Math.round(me*K.seat_share),X=Number(K.relationship_score??50),pe=X>=60?"var(--dgreen)":X>=30?"var(--damber)":"var(--dred)",we=K.wing_end==="left"?"◂":"▸",At=X<30?'<span style="font-family:var(--dfont-mono);font-size:9px;color:var(--dred);font-weight:700;letter-spacing:0.5px;margin-left:4px">VOLATILE</span>':"";mt+=`
            <div style="padding:8px 0;border-bottom:1px solid var(--dborder-1)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${w(K.name)}</div>
                        <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:2px">${we} ${se[K.dominant_axis]||K.dominant_axis}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:var(--dtext-0)">${te} seat${te!==1?"s":""}</div>
                        <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
                            <div style="width:50px;height:5px;background:var(--dborder-1);border-radius:3px;overflow:hidden">
                                <div style="width:${X}%;height:100%;background:${pe};border-radius:3px;transition:width 0.3s"></div>
                            </div>
                            <span style="font-family:var(--dfont-mono);font-size:10px;color:${pe}">${X}</span>
                            ${At}
                        </div>
                    </div>
                </div>
            </div>`}mt=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);margin-bottom:6px;display:flex;justify-content:space-between">
            <span>${vt.length} active caucus${vt.length!==1?"es":""}</span>
            <span>${D} / ${me} seats</span>
        </div>`+mt}const ls=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Internal Caucuses</span>
        </div>
        <div class="elec-box-body">
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-bottom:8px">
                Internal factions within your party. Low relationship scores mean caucus members may defect on ideologically opposed bills.
            </div>
            <div style="overflow-y:auto;max-height:340px">
                ${mt}
            </div>
        </div>
    </div>`;x.innerHTML=`
    <div class="elec-page">
        <div class="elec-row">
            ${R}
            ${T}
            ${le}
            ${re}
        </div>
        <div class="elec-row" style="margin-top:20px">
            ${de}
            ${G}
            ${ls}
        </div>
    </div>`}catch(r){console.error("[Elections Tab] Render error:",r),x.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">Failed to load election data. Please refresh.</div>'}}
