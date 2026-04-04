const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/elections-Whph76B_.js","assets/config-BIsh65GI.js","assets/government-types-BgK4qZvD.js","assets/ideology-DgnKVc_l.js","assets/stats-Cb8eW3Os.js","assets/government-structure-BXgURUp5.js"])))=>i.map(i=>d[i]);
import{_ as I}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as Ls,g as Be,_ as kt}from"./common-DC6iDOio.js";import{c as qt,P as As,b as Is,g as Bt}from"./party-icons-CJ7uQoDE.js";import{t as we}from"./utils-C2W-HleY.js";import{l as Ps,f as es}from"./government-structure-BXgURUp5.js";import{b as Ts,a as Ns,i as ts}from"./government-types-BgK4qZvD.js";import{initGameConfigForNation as Ms,switchPartyEndorsement as Os}from"./config-BIsh65GI.js";import{d as Rs,B as zs,E as Bs,F as ss,G as he,H as Ds,S as ie,J as le,R as Ft,K as as,L as Et,t as Ct,M as Hs,O as qs,Q as Fs,T as Ne,U as Gs,V as Us,W as js,X as Ws,Y as Vs,Z as Ks,_ as Ys,$ as Gt,a0 as Xs,a1 as Js,a2 as Zs,a3 as Qs,a4 as ea,f as ta,a5 as os,a6 as sa,a7 as St}from"./elections-Whph76B_.js";import{a as ae}from"./ideology-DgnKVc_l.js";import{g as is,c as aa,P as je,e as oa,d as ns,f as ia,i as ls,h as na,j as la,k as ra,l as rs,m as ca,n as da,o as pa}from"./protest-BT0q_r3V.js";import{N as cs,s as ds}from"./stats-Cb8eW3Os.js";const Zt=6;function va({isPresidentialSystem:e=!1,scheduledElections:t=[],currentTick:s=0,playerSeats:v=0}={}){const n=(t||[]).filter(c=>c&&c.election_type==="presidential"&&Number.isFinite(Number(c.election_tick))).sort((c,p)=>Number(c.election_tick)-Number(p.election_tick))[0]||null;let l="",o=null,m=null,i=!1;return e?n?(o=Number(n.election_tick)-Number(s),o<=0?(l="This election has already fired; endorsement is locked for this cycle.",o=null):o>Zt?(m=o-Zt,l="No presidential election is in the eligible window."):Number(v)<=0&&(l="Your party is not eligible to endorse in this cycle.")):l="No presidential election is in the eligible window.":(i=!0,l="No presidential election is in the eligible window."),{disabled:!!l,disabledReason:l,ticksUntilElection:o,ticksUntilWindow:m,hidden:i}}function ee(e,t=!0){const s=document.getElementById("pol-toast");s&&s.remove();const v=document.createElement("div");v.id="pol-toast",v.style.cssText=`position:fixed;top:20px;right:20px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:13px;font-family:var(--dfont-mono);max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s;${t?"background:#2d1517;color:#f87171;border:1px solid #7f1d1d;":"background:#1a2e1a;color:#86efac;border:1px solid #14532d;"}`,v.textContent=e,document.body.appendChild(v),setTimeout(()=>{v.style.opacity="0",setTimeout(()=>v.remove(),300)},4e3)}Ls("politics",async e=>{const{nation:t,faction:s,shard:v}=e;if(!t||!s){document.getElementById("content-area").innerHTML='<div class="pol-loading">No nation or party data available.</div>';return}await Ms(I,t.id);const n=s,l=v?.current_tick||0,{data:o}=await I.from("factions").select("id, seats, national_vote_share, faction_name, abbreviation, party_color, standing, loyalty, last_seen_tick, leader_first_name, leader_last_name, custom_logo_url, party_logo, party_description, momentum, momentum_log").eq("nation_id",t.id).eq("faction_type","party"),m=(o||[]).map(T=>T.id),{data:i}=m.length>0?await I.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism").in("faction_id",m):{data:[]},{currentSeats:c}=await Ps(I,t.id,o||[],n.id),p=(o||[]).reduce((T,q)=>T+(q.seats||0),0),_=c,{data:r}=await I.from("elections").select("election_tick, results").eq("nation_id",t.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle();let h=Number(n.national_vote_share||0).toFixed(1),x=null,u=null;if(r){x=we(r.election_tick);const T=r.results,M=(T?.votes||(Array.isArray(T)?T:[])).find(B=>B.party_id===n.id);if(M&&typeof M.vote_percentage=="number"&&(h=M.vote_percentage.toFixed(1)),Array.isArray(T)){const B=T.find(U=>U.party_id===n.id);if(B&&typeof B.seats_won=="number"){const U=typeof B.seats_before=="number"?B.seats_before:null;U!==null&&(u=_-U)}}}const a=await es(I,t.id);let g="Opposition";a&&a.party_ids&&a.party_ids.includes(n.id)&&(g=a.lead_party_id===n.id?"Lead — Governing":"Governing Coalition");const{data:C}=await I.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",t.id),{data:b}=await I.from("issue_state").select("issue_id, salience").eq("nation_id",t.id),A={};for(const T of b||[])A[T.issue_id]=T;let{data:d}=await I.from("elections").select("election_tick, election_type").eq("nation_id",t.id).eq("status","scheduled").gt("election_tick",l).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(!d){const T=Number(t.parliamentary_term_ticks)||24;d={election_tick:l+T,election_type:"parliamentary"}}const k=fa(n.id,t.name),S={whipFirst:n.whip_first_name||k.whipFirst,whipLast:n.whip_last_name||k.whipLast},{data:w}=await I.from("nations_history").select("gov_approval").eq("nation_id",t.id).eq("tick",l-1).maybeSingle(),y=w?.gov_approval??null,{data:f}=await I.from("presidents").select("id, faction_id, first_name, last_name, age, ideology, trait, trait_upside, trait_downside, elected_tick, term_ends_tick, is_active, terms_served").eq("nation_id",t.id).eq("is_active",!0).order("elected_tick",{ascending:!1}).limit(1).maybeSingle(),{data:E}=await I.from("administrations").select("id, admin_name, government_type, started_at_tick, president_name, president_party_id, president_party_name, stats_at_start").eq("nation_id",t.id).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),{data:L}=await I.from("elections").select("election_tick, results, election_type").eq("nation_id",t.id).eq("status","completed").eq("election_type","parliamentary").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:O}=await I.from("elections").select("election_tick, results, election_type").eq("nation_id",t.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:R}=await I.from("elections").select("election_tick, election_type").eq("nation_id",t.id).eq("status","scheduled").gt("election_tick",l).order("election_tick",{ascending:!0}),{data:N}=await I.from("caucus_factions").select("id, name, dominant_axis, wing_end, seat_share, relationship_score").eq("party_id",n.id).eq("is_active",!0),{data:P}=await I.from("party_endorsement_preferences").select("endorsed_party_id").eq("endorsing_party_id",n.id).maybeSingle();ua(n,t,{shard:v,totalSeats:p,mySeats:_,voteSharePct:h,lastElectionDate:x,seatDelta:u,role:g,coalition:a,currentTick:l,officerNames:S,allParties:o,allPartyIdeologies:i,activeCrises:C,nextElection:d,prevApproval:y,lastParliamentary:L,lastPresidential:O,scheduledElections:R,president:f,administration:E,caucusFactions:N,currentEndorsement:P,issueStateMapInit:A})});function ma(e){const t=e.replace(/-/g,""),v=20+parseInt(t.substring(16,24),16)%51;return Math.max(0,v-10)}function fa(e,t=""){const{firstNames:s,lastNames:v}=Rs(t),n=e.replace(/-/g,""),l=parseInt(n.substring(8,12),16),o=parseInt(n.substring(12,16),16);return{whipFirst:s[l%s.length],whipLast:v[o%v.length]}}async function ua(e,t,s){const{shard:v,totalSeats:n,mySeats:l,voteSharePct:o,lastElectionDate:m,seatDelta:i,role:c,officerNames:p,allParties:_,allPartyIdeologies:r,coalition:h,activeCrises:x,currentTick:u,nextElection:a,prevApproval:g,lastParliamentary:C,lastPresidential:b,scheduledElections:A,president:d,administration:k,caucusFactions:S,currentEndorsement:w,issueStateMapInit:y}=s,f=e,E=e.party_color||"#ffcc00",L=qt({customLogoUrl:e.custom_logo_url,iconKey:e.party_logo,size:36,color:E}),O=we(e.founded_tick),R=c.includes("Governing")||c.includes("Lead"),N=c.includes("Lead")?"Governing":c,P=c==="Strongman"?"pol-role-strongman":R?"pol-role-gov":"pol-role-opp",T=(r||[]).find(G=>G.faction_id===e.id);let q=null,M=null;if(T){const G=ae.map(oe=>({ax:oe,score:T[oe.key]??0})).sort((oe,fe)=>Math.abs(fe.score)-Math.abs(oe.score));G.length>0&&G[0].score!==0&&(q=G[0].score<0?G[0].ax.left:G[0].ax.right),G.length>1&&G[1].score!==0&&(M=G[1].score<0?G[1].ax.left:G[1].ax.right)}q||(q=e.ideology_value_1||null),M||(M=e.ideology_value_2||null);function B(G){if(!G)return"";const oe="pol-ideo-"+G.toLowerCase(),fe=G.charAt(0).toUpperCase()+G.slice(1).toLowerCase();return`<div class="pol-ideo-box">
            <span class="pol-ideo-label">Ideology</span>
            <span class="pol-ideo-value ${oe}">${fe}</span>
        </div>`}let U,z;U=e.leader_first_name&&e.leader_last_name?e.leader_first_name+" "+e.leader_last_name:"Vacant",z=e.leader_age?`(${e.leader_age})`:"";const H=e.leader_ideology||q,Y=H?`<span class="pol-leader-ideo pol-ideo-${H.toLowerCase()}">${H.charAt(0).toUpperCase()+H.slice(1).toLowerCase()}</span>`:"",ce=e.electability??ma(e.id),de=zs(ce);let pe="";if(i!==null&&i!==0){const G=i>0?"+":"";pe=`<span class="pol-stat-delta ${i>0?"up":"down"}">${G}${i}</span>`}const ut=`
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
        ${Ca(t,h,_,u,g,d,k)}
        <div class="pol-party-card">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--green"></div>
            <span class="pol-box-label">Your Party</span>
        </div>
        <div class="pol-box-body">
        <div class="pol-header">
            <div class="pol-logo">${L}</div>
            <div class="pol-header-info">
                <div class="pol-party-name">${$(e.faction_name)} <span style="color:var(--dtext-3);font-size:11px;font-weight:400;font-style:italic;margin-left:4px;">${Ts(t)}</span></div>
                <div class="pol-meta-row">
                    <span class="pol-role-badge ${P}">${$(N.toUpperCase())}</span>
                    <span class="pol-established">Est. ${O}</span>
                    <span class="pol-leader-badge">Leader: ${$(U)} ${z}</span>
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
            <div class="pol-leader-name">${$(U)} <span class="pol-leader-age">${z}</span> <span class="pol-leader-electability"><span class="pol-leader-electability-label">Electability: </span><span style="color:${de.color}">${de.label}</span></span></div>
            ${Y}
        </div>
        <div class="pol-officers-row">
            <div class="pol-officer">
                <div class="pol-officer-label">Party Whip</div>
                <div class="pol-officer-name">${$(p.whipFirst+" "+p.whipLast)}</div>
            </div>
        </div>
        <hr class="pol-divider">
        <div class="pol-stats-row">
            <div class="pol-stat-block">
                <div class="pol-stat-label">Seats</div>
                <div class="pol-stat-value">${l}<span class="pol-stat-total">/${n}</span>${pe}</div>
            </div>
        </div>
        ${_a(S,l,T)}
        </div>
        </div>
        ${$a(_,h,t,e.id)}
        ${ka(_,n,u,a,null,e.id)}
        </div>

        <div class="pol-row-2">
        ${Sa(t,x,u,y)}
        <div class="pol-ideology-box" id="stance-summary-container">
            <div class="pol-ideo-header"><div class="pol-box-dot pol-box-dot--orange"></div><span class="pol-mod-title">Stances</span></div>
            <div class="pol-box-body"><div id="stance-summary-strip"></div></div>
        </div>
        ${Ea(e,u)}
        </div>

        <div class="pol-row-3">
        ${Aa(C,b,_,{scheduledElections:A,currentTick:u,nation:t,mySeats:l,faction:f,currentEndorsement:w})}

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
    </div>`;document.getElementById("content-area").innerHTML=ut;let j=!1,F=!1,xe=!1,Te=!1;document.querySelectorAll(".pol-page-tab").forEach(G=>{G.addEventListener("click",()=>{document.querySelectorAll(".pol-page-tab").forEach(He=>He.classList.remove("active")),document.querySelectorAll(".pol-page-content").forEach(He=>He.classList.remove("active")),G.classList.add("active");const oe=G.getAttribute("data-page-tab"),fe=document.querySelector(`.pol-page-content[data-page-content="${oe}"]`);fe&&fe.classList.add("active"),oe==="actions"&&!j&&(j=!0,vt(t,e,v,_)),oe==="electorate-spread"&&!xe&&(xe=!0,to(e,t,_,r,u)),oe==="other-parties"&&!F&&(F=!0,ao(e,t,_,r,h,n,u)),oe==="elections"&&!Te&&(Te=!0,io(t,k,h,e,_,r,u,c,a,S,l))})}),window.innerWidth>860&&document.querySelectorAll(".pol-admin-box, .pol-party-card, .pol-parliament-box, .pol-forecast-box, .pol-coalition-box, .pol-mood-box, .pol-ideology-box, .pol-identity-box, .pol-election-box, .pol-blocs-box").forEach(G=>{G.style.height="450px"}),La(e),Ia(),Pa(),Nt(e.id,t.id),ba(t.id,e.id);const ve=document.getElementById("pol-disband-party-btn");ve&&ve.addEventListener("click",async()=>{if(confirm("Are you sure you want to disband your party? This is permanent — your party will be removed from the game after the next tick.")&&confirm("This cannot be undone. Disband your party?")){ve.disabled=!0,ve.textContent="Disbanding...";try{await Bs(I,t.id,e.id,u),sessionStorage.removeItem("nationhood_state"),await I.auth.signOut(),window.location.href="login.html"}catch(G){ee(G.message||"Failed to disband party."),ve.disabled=!1,ve.textContent="Disband Party"}}})}const ga=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function ps(e){return`${ga[e%12]} ${2e3+Math.floor(e/12)}`}async function ya(e,t){const s=document.getElementById("party-events-feed");if(!s)return;const{data:v,error:n}=await I.from("activity_log").select("id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at").eq("nation_id",e).order("tick",{ascending:!1}).order("created_at",{ascending:!1}).limit(80);if(n||!v||v.length===0){s.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:12px;padding:12px">No party events yet.</div>';return}const l=[...new Set(v.map(p=>p.faction_id))],{data:o}=await I.from("factions").select("id, faction_name, abbreviation, party_color").in("id",l),m={};for(const p of o||[])m[p.id]=p;let i="",c=null;for(const p of v){p.tick!==c&&(c=p.tick,i+=`<div class="pe-tick-sep">${ps(p.tick)}</div>`);const _=m[p.faction_id],r=p.faction_id===t,h=r?"You":_?.abbreviation||"???",x=_?.party_color||"var(--dtext-2)",u=p.outcome==="success"?"var(--dgreen)":p.outcome==="backfire"?"var(--dred)":p.outcome==="failure"?"var(--damber)":"var(--dtext-3)";i+=`<div class="pe-item${r?" pe-item--you":""}">
            <div class="pe-item-row">
                <span class="pe-item-party" style="color:${x}">${$(h)}</span>
                <span class="pe-item-label">${$((p.action_label||p.action_type).replace(/_/g," "))}</span>
                ${p.ap_spent?`<span class="pe-item-ap">${p.ap_spent} AP</span>`:""}
                ${p.outcome?`<span class="pe-item-outcome" style="color:${u}">${$(p.outcome)}</span>`:""}
            </div>
            ${p.description?`<div class="pe-item-desc">${$(p.description)}</div>`:""}
        </div>`}s.innerHTML=i}async function ba(e,t){const s=document.getElementById("gov-card-party-events");if(!s)return;const{data:v,error:n}=await I.from("activity_log").select("id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at").eq("nation_id",e).order("tick",{ascending:!1}).order("created_at",{ascending:!1}).limit(40);if(n||!v||v.length===0){s.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">No party events yet.</div>';return}const l=[...new Set(v.map(p=>p.faction_id))],{data:o}=await I.from("factions").select("id, faction_name, abbreviation, party_color").in("id",l),m={};for(const p of o||[])m[p.id]=p;let i="",c=null;for(const p of v){p.tick!==c&&(c=p.tick,i+=`<div class="pe-tick-sep">${ps(p.tick)}</div>`);const _=m[p.faction_id],r=p.faction_id===t,h=r?"You":_?.abbreviation||"???",x=_?.party_color||"var(--dtext-2)",u=p.outcome==="success"?"var(--dgreen)":p.outcome==="backfire"?"var(--dred)":p.outcome==="failure"?"var(--damber)":"var(--dtext-3)";i+=`<div class="pe-item${r?" pe-item--you":""}">
            <div class="pe-item-row">
                <span class="pe-item-party" style="color:${x}">${$(h)}</span>
                <span class="pe-item-label">${$((p.action_label||p.action_type).replace(/_/g," "))}</span>
                ${p.outcome?`<span class="pe-item-outcome" style="color:${u}">${$(p.outcome)}</span>`:""}
            </div>
        </div>`}s.innerHTML=i}function ha(e,t,s){const v=e||"#888",n=t||(s?s.substring(0,2).toUpperCase():"??");return`<div class="pol-mini-logo" style="background:${v}">${$(n)}</div>`}function xa(e,t){if(t?.head_of_state_title&&!ts(t))return t.head_of_state_title;if(!e)return"Head of Gov.";const s=e.toLowerCase();return s==="democracy"||s.includes("parliament")?"PM":s.includes("president")?"President":"Head of Gov."}function _a(e,t,s){if(!e||e.length===0)return"";const v={};for(const m of ae)v[m.key]=m;let n=0,l="";for(const m of e){const i=v[m.dominant_axis],c=i?(m.wing_end==="left"?i.leftLabel:i.rightLabel)+" Wing":m.dominant_axis,p=i?m.wing_end==="left"?i.leftColor:i.rightColor:"var(--text-dim)",_=Math.round(t*m.seat_share);let r=0;if(s&&i){const C=s[m.dominant_axis]??0,b=m.wing_end==="right"?C:-C;r=Math.max(-3,Math.min(3,Math.round(b/15)))}const h=Math.max(1,_+r);n+=h;const x=r>0?` <span style="color:var(--green);font-size:0.7rem;">(+${r})</span>`:r<0?` <span style="color:var(--red);font-size:0.7rem;">(${r})</span>`:"",u=m.relationship_score,a=u>=60?"var(--green)":u>=30?"var(--amber)":"var(--red)",g=u<30?' <span style="color:var(--red);font-size:0.7rem;">VOLATILE</span>':"";l+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-dim);">
            <div>
                <div style="font-size:0.85rem;font-weight:500;">${$(m.name)}</div>
                <div style="font-size:0.7rem;color:${p};opacity:0.8;">${c}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <div style="font-size:0.85rem;font-weight:600;white-space:nowrap;">${h} seats${x}</div>
                <div style="display:flex;align-items:center;gap:4px;">
                    <div style="width:50px;height:5px;background:var(--border-dim);border-radius:3px;overflow:hidden;">
                        <div style="width:${u}%;height:100%;background:${a};border-radius:3px;"></div>
                    </div>
                    <span style="font-size:0.65rem;color:var(--text-dim);">${u}</span>
                    ${g}
                </div>
            </div>
        </div>`}const o=e.length;return`<hr class="pol-divider">
        <div style="padding:0 0 4px;">
            <div class="pol-sub-label" style="margin-bottom:2px;">Internal Caucuses</div>
            <div style="font-size:0.7rem;color:var(--text-dim);margin-bottom:6px;">${o} active caucus${o!==1?"es":""} · ${n} / ${t} seats</div>
            ${l}
        </div>`}function $a(e,t,s,v){const n=e||[],l=n.reduce((y,f)=>y+(f.seats||0),0),o=Math.ceil(l/2);let m,i;m=new Set(t?.party_ids||[]),i=t?.lead_party_id||null;const c=n.filter(y=>m.has(y.id)),p=n.filter(y=>!m.has(y.id)),_=c.reduce((y,f)=>y+(f.seats||0),0),r=p.reduce((y,f)=>y+(f.seats||0),0),h=[...n].sort((y,f)=>(f.seats||0)-(y.seats||0)),x=l>0?h.map(y=>{const f=(y.seats||0)/l*100;if(f<=0)return"";const E=y.party_color||"#888";return`<div class="pol-seat-segment" style="width:${f.toFixed(2)}%;background:${E}"></div>`}).join(""):"",a=`<div class="pol-majority-line" style="left:${(l>0?o/l*100:50).toFixed(2)}%"></div>`,g=xa(s?.government_type,s);function C(y){const f=ha(y.party_color,y.abbreviation,y.faction_name),E=$(y.faction_name||"Unknown"),L=y.seats||0,O=y.id===v,N=[y.id===i?`<span class="pol-hog-pill">${$(g)}</span>`:"",O?'<span class="pol-you-pill">YOU</span>':""].filter(Boolean).join(" ");return`<div class="pol-parl-party-row">
            ${f}
            <span class="pol-parl-party-name">${E}</span>
            ${N}
            <span class="pol-parl-party-seats">${L}</span>
        </div>`}const b=c.length>0?c.sort((y,f)=>(f.seats||0)-(y.seats||0)).map(C).join(""):"",A=p.length>0?p.sort((y,f)=>(f.seats||0)-(y.seats||0)).map(C).join(""):"",d=_-o,k=d>=0,S=k?"pol-margin-positive":"pol-margin-negative",w=k?`+${d} above majority`:`${Math.abs(d)} below majority`;return`
        <div class="pol-parliament-box">
            <div class="pol-parl-header">
                <div class="pol-box-dot pol-box-dot--amber"></div>
                <span class="pol-parl-title">Parliament</span>
                <div class="pol-box-header-right"><span class="pol-parl-seats-count">${l} seats</span></div>
            </div>
            <div class="pol-box-body">
            <div class="pol-seat-bar-wrap">
                <div class="pol-seat-bar">${x}</div>
                ${a}
            </div>

            <div class="pol-section-header">
                <span class="pol-section-title">Governing Coalition</span>
                <span class="pol-section-seats">${_} seats</span>
            </div>
            ${b}

            <div class="pol-section-header">
                <span class="pol-section-title">Opposition</span>
                <span class="pol-section-seats">${r} seats</span>
            </div>
            ${A}

            <div class="pol-margin-row ${S}">
                <span class="pol-margin-dot"></span>
                <span>${w}</span>
            </div>
            </div>
        </div>`}function wa(e){return e>=60?"var(--dred)":e>=40?"var(--damber)":"var(--dgreen)"}function ka(e,t,s,v,n,l){const c=v?.election_tick||0,p=c>s?c-s:0,_=c>0&&p<=12,r=Math.ceil(t/2),h=p<=5?"CAMPAIGN SEASON":p<=10?"MID CYCLE":"EARLY CYCLE",x=p<=5?"var(--dred)":p<=10?"var(--damber)":"var(--dgreen)";if(!_){const f=c>0?p-12:0,E=c>0?`Forecast available in <span style="color:var(--dtxt-secondary);font-weight:700">${f} ticks</span><br>Polling begins 12 ticks before election`:"No election currently scheduled",L=c>0?we(c):null;return`
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
            </div>`}const u=Math.max(1,12-(12-p)),g=(e||[]).filter(f=>Number(f.national_vote_share||0)<=0?!1:f.last_seen_tick!=null?s-f.last_seen_tick<12:s-(f.founded_tick||0)<12).map(f=>{const E=Number(f.national_vote_share||0),L=Math.round(E/100*t);return{...f,estSeats:L,momentum:Number(f.momentum??0)}}).sort((f,E)=>E.estSeats-f.estSeats),C=u>=10?"VERY LOW":u>=7?"LOW":u>=5?"MODERATE":u>=3?"HIGH":"VERY HIGH",b=u>=10?"var(--dred)":u>=7||u>=5?"var(--damber)":u>=3?"#22d3ee":"var(--dgreen)",A=(12-p)/12*100,d=g.map(f=>{const E=Math.max(f.estSeats-u,0),L=Math.min(f.estSeats+u,t),O=E/t*100,R=L/t*100,N=f.party_color||"#888",P=f.abbreviation||(f.faction_name||"??").substring(0,2).toUpperCase(),T=f.id===l,q=f.momentum>0?"var(--dgreen)":f.momentum<0?"var(--dred)":"var(--dtxt-muted)",M=f.momentum>0?"▲":f.momentum<0?"▼":"—",B=f.momentum!==0?`${M}${Math.abs(f.momentum)}`:M,U=t>0?r/t*100:50;return`<div class="pol-fc-party">
            <div class="pol-fc-party-header">
                <div class="pol-fc-party-left">
                    <div class="pol-fc-party-dot" style="background:${N}"></div>
                    <span class="pol-fc-party-abbr" style="color:${N}">${$(P)}</span>
                    ${T?'<span class="pol-ideo-legend-you">YOU</span>':""}
                </div>
                <div class="pol-fc-party-right">
                    <span class="pol-fc-momentum" style="color:${q}">${B}</span>
                    <span class="pol-fc-range">${E}–${L}</span>
                    <span class="pol-fc-seats-label">seats</span>
                </div>
            </div>
            <div class="pol-fc-band">
                <div class="pol-fc-band-fill" style="left:${O.toFixed(1)}%;width:${(R-O).toFixed(1)}%;background:${N}22;border-color:${N}33"></div>
                <div class="pol-fc-maj-line" style="left:${U.toFixed(1)}%"></div>
            </div>
        </div>`}).join(""),k=g.find(f=>f.id===l),S=g.find(f=>f.id!==l);let w="";if(k&&S){const f=Math.max(k.estSeats-u,0),E=Math.min(k.estSeats+u,t),L=Math.max(S.estSeats-u,0),O=Math.min(S.estSeats+u,t),R=Math.max(0,Math.min(E,O)-Math.max(f,L)),N=E-f,P=N>0?Math.round(R/N*100):0,T=k.abbreviation||"YOU",q=S.abbreviation||"RIVAL",M=P>70?"TOO CLOSE TO CALL":P>30?"COMPETITIVE":P>0?k.estSeats>S.estSeats?`LEANING ${T}`:`LEANING ${q}`:k.estSeats>S.estSeats?`${T} LEADS`:`${q} LEADS`,B=P>70?"var(--dred)":P>30?"var(--damber)":"var(--dgreen)",U=P>70?`${T} and ${q} seat ranges fully overlap. Outcome is uncertain.`:P>30?"Bands are narrowing. Late campaigns could decide the race.":P>0?"Leading party is emerging, but the gap is not yet decisive.":"Ranges no longer overlap. Leader is identifiable.";w=`
            <div class="pol-fc-status" style="background:${B}08;border-color:${B}">
                <div class="pol-fc-status-header">
                    <span class="pol-fc-status-label" style="color:${B}">${$(M)}</span>
                    <span class="pol-fc-status-overlap">${P}% overlap</span>
                </div>
                <div class="pol-fc-status-desc">${U}</div>
            </div>`}const y=c>0?we(c):null;return`
        <div class="pol-forecast-box">
            <div class="pol-fc-header">
                <div class="pol-box-dot pol-box-dot--blue"></div>
                <span class="pol-mod-title">Election Forecast</span>
                <div class="pol-box-header-right"><span class="pol-fc-phase" style="color:${x};background:${x}15">${h}</span></div>
            </div>
            <div class="pol-box-body">
            ${y?`<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${y}</span></div>`:""}
            <div class="pol-fc-countdown">
                <div>
                    <span class="pol-fc-ticks-big" style="color:${x}">${p}</span>
                    <span class="pol-fc-ticks-label">ticks</span>
                </div>
                <div style="text-align:right">
                    <div style="display:flex;align-items:center;gap:4px;justify-content:flex-end">
                        <span class="pol-fc-margin-label">Margin:</span>
                        <span class="pol-fc-margin-val" style="color:${b}">±${u} seats</span>
                    </div>
                    <span class="pol-fc-conf-badge" style="color:${b};background:${b}15">${C} CONFIDENCE</span>
                </div>
            </div>
            <div class="pol-fc-conf-bar">
                <div class="pol-fc-conf-fill" style="width:${A.toFixed(0)}%;background:${b}"></div>
            </div>
            ${d}
            <div class="pol-fc-maj-legend">
                <div class="pol-fc-maj-dash"></div>
                <span class="pol-fc-maj-text">Majority: ${r} seats</span>
            </div>
            ${w}
            </div>
        </div>`}function Sa(e,t,s,v){const n=t||[];let l;n.length===0?l='<div class="pol-mood-no-crises">No active crises</div>':l=n.map(i=>{const c=i.crisis_templates?.name||"Unknown Crisis",p=s-(i.started_at_tick||0);return`<div class="pol-mood-crisis">
                <span class="pol-mood-crisis-name">${$(c)}</span>
                <span class="pol-mood-crisis-dur">${p}t</span>
            </div>`}).join("");const m=ss.map(i=>{const c=he[i],p=Number(v?.[i]?.salience??30);return{id:i,name:c.label,salience:p,statKeys:c.stats}}).sort((i,c)=>c.salience-i.salience).map(i=>{const c=wa(i.salience),p=i.statKeys.map(_=>{const r=Math.round(Number(e[_]??0)),h=_.replace(/_/g," ").replace(/\b\w/g,x=>x.toUpperCase());return`<div class="pol-mood-stat-row">
                <span class="pol-mood-stat-name">${$(h)}</span>
                <span class="pol-mood-stat-val">${r}</span>
            </div>`}).join("");return`<div class="pol-mood-issue-wrap">
            <div class="pol-mood-issue" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.pol-mood-chevron').textContent=this.nextElementSibling.classList.contains('open')?'▾':'▸'">
                <span class="pol-mood-issue-name">${$(i.name)}</span>
                <div class="pol-mood-issue-bar-wrap">
                    <div class="pol-mood-issue-bar" style="width:${i.salience}%;background:${c}"></div>
                </div>
                <span class="pol-mood-issue-pct">${i.salience}%</span>
                <span class="pol-mood-chevron">▸</span>
            </div>
            <div class="pol-mood-stats">${p}</div>
        </div>`}).join("");return`
        <div class="pol-mood-box">
            <div class="pol-mood-header">
                <div class="pol-box-dot pol-box-dot--red"></div>
                <span class="pol-mood-title">Electorate Issues</span>
            </div>
            <div class="pol-box-body">
            <div class="pol-mood-subtitle">Shows which issues matter most to the electorate.</div>
            ${l}
            ${m}
            </div>
        </div>`}function Ca(e,t,s,v,n,l,o){const m=Ns(e),i=s||[],c=Math.round(Number(e.gov_approval??40)),p=c>=50?"var(--dgreen)":c>=35?"var(--damber)":"var(--dred)",_=o?.admin_name||"Government",r=m?"Presidential":e?.hos_election_method==="hereditary"?"Constitutional Monarchy":"Parliamentary",h=new Set(t?.party_ids||[]),x=i.filter(L=>h.has(L.id)),u=x.reduce((L,O)=>L+(O.seats||0),0),a=i.reduce((L,O)=>L+(O.seats||0),0),g=Math.ceil(a/2),C=u>=g,b=x.length>1?"Coalition":x.length===1?"Single Party":"";function A(L,O){return((L||"?")[0]+(O||"?")[0]).toUpperCase()}let d="";if(m&&l){const L=i.find(T=>T.id===l.faction_id),O=L?.party_color||"#888",R=L?.abbreviation||(L?.faction_name||"??").substring(0,3).toUpperCase(),N=l.terms_served>1?l.terms_served===2?"2nd":l.terms_served+"th":"1st",P=A(l.first_name,l.last_name);d=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${$(P)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${$(l.first_name+" "+l.last_name)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">President &middot; Age ${l.age||"?"} &middot; ${N} Term</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${O}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${O}">${$(R)}</span>
            </div>
          </div>
        </div>`}else if(!m&&t){const L=i.find(T=>T.id===t.lead_party_id),O=L?.party_color||"#888",R=L?.faction_name||"Unknown",N=L?.abbreviation||R.substring(0,3).toUpperCase(),P=R.split(/\s+/).map(T=>T[0]).join("").toUpperCase().slice(0,2);d=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${$(P)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${$(R)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of Government</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${O}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${O}">${$(N)}</span>
            </div>
          </div>
        </div>`}let k="";const S=e.head_of_state_first_name||"",w=e.head_of_state_last_name||"";if(m&&S&&w){const L=A(S,w);k=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${$(L)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${$(S+" "+w)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Vice President</div>
          </div>
        </div>`}else if(!m&&S&&w){const L=A(S,w);k=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${$(L)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${$(S+" "+w)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of State</div>
          </div>
        </div>`}const y=[...x].sort((L,O)=>(O.seats||0)-(L.seats||0));a>0&&y.map(L=>{const O=(L.seats||0)/a*100;return O<=0?"":`<div style="width:${O.toFixed(2)}%;height:100%;background:${L.party_color||"#888"}"></div>`}).join(""),y.map(L=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
            <div style="width:7px;height:7px;border-radius:2px;background:${L.party_color||"#888"};flex-shrink:0"></div>
            <span style="font-family:var(--dfont-ui);font-size:12px;color:var(--dtext-0);flex:1">${$(L.faction_name||"Unknown")}</span>
            <span style="font-family:var(--dfont-mono);font-size:12px;font-weight:600;color:${L.party_color||"var(--dtext-0)"}">${L.seats||0}</span>
        </div>`).join("");const f=C?"Majority Government":"Minority Government",E=`${u}/${a} seats (${g} needed)`;return`<div class="pol-admin-box">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Government</span>
        </div>
        <div class="pol-box-body">
        <div style="font-family:var(--dfont-ui);font-size:16px;font-weight:700;color:var(--dtext-0);margin-bottom:8px">${$(_)}</div>
        <div style="display:flex;gap:6px;margin-bottom:16px">
            <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${$(r)}</span>
            ${b?`<span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${$(b)}</span>`:""}
        </div>

        ${d}
        ${k}

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Approval</div>
        <div style="font-family:var(--dfont-mono);font-size:28px;font-weight:700;line-height:1;color:${p}">${c}%</div>
        <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:4px;display:flex;align-items:center;gap:8px">
            <span style="text-transform:uppercase;font-weight:600">${$(f)}</span>
            <span style="font-weight:400">${$(E)}</span>
        </div>

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Party Events</div>
        <div id="gov-card-party-events" class="pe-feed" style="max-height:200px;overflow-y:auto;font-size:11px">
            <div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">Loading events...</div>
        </div>
        </div>
    </div>`}const _e=360,it=200,et=256;function Ea(e,t){const s=e.party_color||"#ffcc00",v=e.party_logo||"flag",n=e.party_description||"",l=e.action_points||0,o=e.last_rename_tick||0,m=o>0?Math.max(0,_e-(t-o)):0,i=m>0,c=!!e.custom_logo_url,p=qt({customLogoUrl:e.custom_logo_url,iconKey:v,size:20,color:s}),_=As.map(a=>`<div class="pol-id-swatch${a.hex.toLowerCase()===s.toLowerCase()?" selected":""}" data-color="${a.hex}" title="${a.label}" style="background:${a.hex}"></div>`).join(""),r={};for(const[a,g]of Object.entries(Is)){const C=g.category||"Other";r[C]||(r[C]=[]),r[C].push({key:a,label:g.label})}let h="";for(const[a,g]of Object.entries(r)){h+=`<div class="pol-id-icon-cat">${$(a)}</div><div class="pol-id-icon-grid">`;for(const C of g){const b=C.key===v?" selected":"",A=Bt(C.key,16,C.key===v?s:"#888");h+=`<div class="pol-id-icon-tile${b}" data-icon="${C.key}" title="${$(C.label)}" style="color:${C.key===v?s:"#888"}">${A}</div>`}h+="</div>"}let x,u;if(i){const g=`
            <div class="pol-id-cooldown">
                <span class="pol-id-cooldown-label">Rename cooldown</span>
                <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:${(m/_e*100).toFixed(1)}%"></div></div>
                <span class="pol-id-cooldown-ticks">${m}t</span>
            </div>`;x=g,u=g}else x=`
            <button class="pol-id-rename-btn" id="pol-id-rename-btn">
                <span>Rename Party</span>
                <span class="pol-id-rename-cost">${_e}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-rename-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-rename-input" placeholder="Enter new party name…" maxlength="60">
                    <button class="pol-id-rename-confirm" id="pol-id-rename-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-rename-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${_e} ticks</span></span>
                </div>
                <div class="pol-id-error" id="pol-id-rename-error" style="display:none"></div>
            </div>`,u=`
            <button class="pol-id-rename-btn" id="pol-id-abbr-btn">
                <span>Change Abbreviation</span>
                <span class="pol-id-rename-cost">${_e}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-abbr-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-abbr-input" placeholder="2–4 letters" maxlength="4" style="text-transform:uppercase;font-family:var(--dfont-mono);font-weight:700;letter-spacing:0.1em;width:80px">
                    <button class="pol-id-rename-confirm" id="pol-id-abbr-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-abbr-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${_e} ticks</span></span>
                </div>
                <div class="pol-id-error" id="pol-id-abbr-error" style="display:none"></div>
            </div>`;return`<div class="pol-identity-box" id="pol-identity-box"
        data-faction-id="${e.id}"
        data-selected-color="${s}"
        data-selected-icon="${v}"
        data-current-tick="${t}">

        <!-- Header -->
        <div class="pol-id-header">
            <div class="pol-box-dot pol-box-dot--amber"></div>
            <span class="pol-id-title">Party Identity</span>
            <div class="pol-box-header-right">
                <div class="pol-id-preview" id="pol-id-preview" style="border:2px solid ${s};background:${s}18">
                    ${p}
                </div>
            </div>
        </div>
        <div class="pol-box-body">

        <!-- Party Name -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="pol-id-section-label">Party Name</span>
                <span class="pol-id-ap-badge">AP: <span id="pol-id-ap-display">${l}</span></span>
            </div>
            <div class="pol-id-name-display">
                <span id="pol-id-current-name">${$(e.faction_name)}</span>
                <span>current</span>
            </div>
            ${x}
        </div>
        <div class="pol-id-divider"></div>

        <!-- Abbreviation -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="pol-id-section-label">Abbreviation</span>
            </div>
            <div class="pol-id-name-display">
                <span id="pol-id-current-abbr">${$(e.abbreviation||"???")}</span>
                <span>current</span>
            </div>
            ${u}
        </div>
        <div class="pol-id-divider"></div>

        <!-- Description -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span class="pol-id-section-label">Description</span>
                <span class="pol-id-char-count${n.length>it*.9?" warn":""}" id="pol-id-char-count">${n.length} / ${it}</span>
            </div>
            <textarea class="pol-id-desc" id="pol-id-desc" rows="3" maxlength="${it}">${$(n)}</textarea>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Party Color -->
        <div style="margin-bottom:14px">
            <span class="pol-id-section-label">Party Color</span>
            <div class="pol-id-colors" id="pol-id-colors">${_}</div>
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
            <div id="pol-id-icon-section"${c?' style="display:none"':""}>${h}</div>
            <div id="pol-id-upload-section"${c?"":' style="display:none"'}>
                <div class="pol-id-upload-zone${c?" has-image":""}" id="pol-id-upload-zone">
                    ${c?`
                        <img class="pol-id-upload-preview" src="${e.custom_logo_url}" alt="preview" style="border:2px solid ${s}">
                        <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${et}KB · Best at 128×128px</div>
                    `:`
                        <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                        <div class="pol-id-upload-text">Click to upload logo</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${et}KB · Best at 128×128px</div>
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
    </div>`}function La(e){const t=document.getElementById("pol-identity-box");if(!t)return;const s=document.getElementById("pol-id-preview"),v=document.getElementById("pol-id-colors"),n=document.getElementById("pol-id-hex-input"),l=document.getElementById("pol-id-hex-preview"),o=document.getElementById("pol-id-desc"),m=document.getElementById("pol-id-char-count"),i=document.getElementById("pol-id-save-btn"),c=document.getElementById("pol-id-rename-btn"),p=document.getElementById("pol-id-rename-form"),_=document.getElementById("pol-id-rename-input"),r=document.getElementById("pol-id-rename-confirm"),h=document.getElementById("pol-id-rename-cancel"),x=document.getElementById("pol-id-rename-error"),u=document.getElementById("pol-id-abbr-btn"),a=document.getElementById("pol-id-abbr-form"),g=document.getElementById("pol-id-abbr-input"),C=document.getElementById("pol-id-abbr-confirm"),b=document.getElementById("pol-id-abbr-cancel"),A=document.getElementById("pol-id-abbr-error"),d=document.getElementById("pol-id-current-abbr"),k=document.getElementById("pol-id-current-name");document.getElementById("pol-id-ap-display");const S=document.getElementById("pol-id-icon-section"),w=document.getElementById("pol-id-upload-section"),y=document.getElementById("pol-id-upload-zone"),f=document.getElementById("pol-id-file-input"),E=document.getElementById("pol-id-upload-error"),L=document.getElementById("pol-id-remove-btn");let O=null,R=null,N=!!e.custom_logo_url,P=e.custom_logo_url||null;function T(){return t.dataset.selectedColor}function q(){return t.dataset.selectedIcon}function M(){const z=T();if(s.style.border="2px solid "+z,s.style.background=z+"18",N&&(O||P)){const H=O||P;s.innerHTML='<img src="'+H+'" alt="" style="width:100%;height:100%;object-fit:cover">'}else s.innerHTML=Bt(q(),20,z)}function B(){const z=T(),H=q();t.querySelectorAll(".pol-id-icon-tile").forEach(Y=>{const ce=Y.dataset.icon,de=ce===H;Y.classList.toggle("selected",de),Y.style.color=de?z:"#888",Y.innerHTML=Bt(ce,16,de?z:"#888")})}function U(){const z=T().toLowerCase();t.querySelectorAll(".pol-id-swatch").forEach(H=>{H.classList.toggle("selected",H.dataset.color.toLowerCase()===z)})}v&&v.addEventListener("click",z=>{const H=z.target.closest(".pol-id-swatch");H&&(t.dataset.selectedColor=H.dataset.color,n.value=H.dataset.color,l.style.background=H.dataset.color,U(),B(),M())}),n&&n.addEventListener("input",()=>{const z=n.value;/^#[0-9a-fA-F]{6}$/.test(z)?(t.dataset.selectedColor=z,l.style.background=z,U(),B(),M()):l.style.background="var(--dtext-3)"}),S&&S.addEventListener("click",z=>{const H=z.target.closest(".pol-id-icon-tile");H&&(t.dataset.selectedIcon=H.dataset.icon,N=!1,B(),M())}),t.querySelectorAll(".pol-id-tab").forEach(z=>{z.addEventListener("click",()=>{t.querySelectorAll(".pol-id-tab").forEach(Y=>Y.classList.remove("active")),z.classList.add("active");const H=z.dataset.tab==="icon";S.style.display=H?"":"none",w.style.display=H?"none":""})}),y&&y.addEventListener("click",()=>f.click()),f&&f.addEventListener("change",z=>{const H=z.target.files[0];if(!H)return;if(E.style.display="none",H.size>et*1024){E.textContent="⚠ File too large — max "+et+"KB.",E.style.display="";return}if(!H.type.startsWith("image/")){E.textContent="⚠ Must be PNG, JPG, SVG, or WebP.",E.style.display="";return}const Y=new FileReader;Y.onload=ce=>{O=ce.target.result,R=H,N=!0,y.classList.add("has-image"),y.innerHTML=`
                    <img class="pol-id-upload-preview" src="${O}" alt="preview" style="border:2px solid ${T()}">
                    <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                    <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${et}KB · Best at 128×128px</div>`,L.style.display="",M()},Y.readAsDataURL(H)}),L&&L.addEventListener("click",()=>{O=null,R=null,N=!1,P=null,y.classList.remove("has-image"),y.innerHTML=`
                <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                <div class="pol-id-upload-text">Click to upload logo</div>
                <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${et}KB · Best at 128×128px</div>`,L.style.display="none",M()}),o&&m&&o.addEventListener("input",()=>{const z=o.value.length;m.textContent=z+" / "+it,m.classList.toggle("warn",z>it*.9)}),u&&a&&u.addEventListener("click",()=>{u.style.display="none",a.style.display="",g.focus()}),b&&b.addEventListener("click",()=>{a.style.display="none",u.style.display="",g.value="",A.style.display="none",g.classList.remove("has-error")}),g&&g.addEventListener("input",()=>{g.value=g.value.toUpperCase()}),C&&C.addEventListener("click",async()=>{if(C.disabled)return;A.style.display="none",g.classList.remove("has-error");const z=g.value.trim().toUpperCase();if(z.length<2||z.length>4){A.textContent="⚠ Must be 2–4 letters.",A.style.display="",g.classList.add("has-error");return}C.disabled=!0;const H=parseInt(t.dataset.currentTick)||0,{error:Y}=await I.from("factions").update({abbreviation:z,last_rename_tick:H}).eq("id",e.id);if(Y){A.textContent="⚠ Failed to save — try again.",A.style.display="",C.disabled=!1;return}d.textContent=z,a.style.display="none",g.value="",u.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${_e}t</span>
                </div>`,c&&(p.style.display="none",c.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${_e}t</span>
                    </div>`)}),c&&p&&c.addEventListener("click",()=>{c.style.display="none",p.style.display="",_.focus()}),h&&h.addEventListener("click",()=>{p.style.display="none",c.style.display="",_.value="",x.style.display="none",_.classList.remove("has-error")}),r&&r.addEventListener("click",async()=>{x.style.display="none",_.classList.remove("has-error");const z=_.value.trim();if(!z){x.textContent="⚠ Name cannot be empty.",x.style.display="",_.classList.add("has-error");return}if(z.length<3){x.textContent="⚠ Minimum 3 characters.",x.style.display="",_.classList.add("has-error");return}const H=parseInt(t.dataset.currentTick)||0,{error:Y}=await I.from("factions").update({faction_name:z,last_rename_tick:H}).eq("id",e.id);if(Y){x.textContent="⚠ Failed to save — try again.",x.style.display="";return}k.textContent=z,p.style.display="none",_.value="",c.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${_e}t</span>
                </div>`,u&&(a.style.display="none",u.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${_e}t</span>
                    </div>`)}),i&&i.addEventListener("click",async()=>{i.disabled=!0,i.textContent="Saving...";let z=P;if(N&&R){const de=R.name.split(".").pop()||"png",pe=`party-logos/${e.id}/${Date.now()}.${de}`,{error:Ae}=await I.storage.from("public-assets").upload(pe,R,{contentType:R.type,upsert:!0});if(Ae){console.error("Logo upload failed:",Ae.message),i.textContent="⚠ Upload failed",i.disabled=!1,setTimeout(()=>{i.textContent="Save Changes"},2e3);return}const{data:Ie}=I.storage.from("public-assets").getPublicUrl(pe);z=Ie?.publicUrl||null,P=z,R=null}const H={party_color:T(),party_logo:N?null:q(),custom_logo_url:N?z:null,party_description:o?o.value.slice(0,it):""},{data:Y,error:ce}=await I.from("factions").update(H).eq("id",e.id).select("id");if(ce){ee("Save failed: "+ce.message),i.disabled=!1,i.textContent="Save Changes";return}if(!Y||Y.length===0){ee("Save failed: no rows updated (permission denied?)"),i.disabled=!1,i.textContent="Save Changes";return}sessionStorage.removeItem("nationhood_state"),i.textContent="✓ Saved",i.classList.add("saved"),i.disabled=!1,setTimeout(()=>{i.textContent="Save Changes",i.classList.remove("saved")},2e3)})}function Aa(e,t,s,{scheduledElections:v,currentTick:n,nation:l,mySeats:o,faction:m,currentEndorsement:i}={}){const c={},p={};(s||[]).forEach(S=>{c[S.id]=S.party_color||"#888",p[S.id]=S.seats||0});function _(S){if(!S)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const w=S.results;if(!w||!w.votes)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const y=we(S.election_tick),f=new Set(w.votes.map(N=>N.party_id)),E=(s||[]).filter(N=>!f.has(N.id)&&(p[N.id]||0)>0).map(N=>({party_id:N.id,party_name:N.faction_name,votes:0,vote_percentage:0,seats:p[N.id]||0})),L=[...w.votes,...E].map(N=>({...N,seats:p[N.party_id]??N.seats??0})).sort((N,P)=>(P.seats||0)-(N.seats||0)),O=Math.max(...L.map(N=>N.vote_percentage||0),1);let R=L.map(N=>{const P=c[N.party_id]||"#888",T=(N.vote_percentage||0).toFixed(1),q=Math.round((N.vote_percentage||0)/O*100);return`<tr>
                <td><span class="pol-el-color-dot" style="background:${P}"></span>${$(N.party_name)}</td>
                <td>${(N.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${q}%;background:${P}"></div></div></td>
                <td>${T}%</td>
                <td>${N.seats||0}</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${y}</div>
            <div class="pol-el-summary">Turnout: ${(w.turnout_pct||0).toFixed(1)}% &middot; ${(w.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Party</th><th>Votes</th><th></th><th>%</th><th>Seats</th></tr></thead>
                <tbody>${R}</tbody>
            </table>`}function r(S,w,y,f){const E=[...S].sort((R,N)=>(N.votes||0)-(R.votes||0)),L=Math.max(...E.map(R=>R.vote_percentage||0),1);let O=E.map(R=>{const N=c[R.faction_id]||"#888",P=(R.vote_percentage||0).toFixed(1),T=Math.round((R.vote_percentage||0)/L*100),q=R.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";return`<tr>
                <td><span class="pol-el-color-dot" style="background:${N}"></span>${$(R.candidate_name)}${q}</td>
                <td>${$(R.party_name)}</td>
                <td>${(R.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${T}%;background:${N}"></div></div></td>
                <td>${P}%</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${w}</div>
            <div class="pol-el-summary">Turnout: ${(y||0).toFixed(1)}% &middot; ${(f||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${O}</tbody>
            </table>`}function h(S){if(!S)return'<div class="pol-el-empty">No presidential election results yet.</div>';const w=S.results;if(!w||!w.presidential_candidates)return'<div class="pol-el-empty">No presidential election results yet.</div>';const y=we(S.election_tick);return r(w.presidential_candidates,y,w.turnout_pct,w.total_votes_cast)}function x(S){if(!S)return'<div class="pol-el-empty">No first round results.</div>';const w=S.results,y=w?.round_1_candidates||w?.presidential_candidates;if(!y)return'<div class="pol-el-empty">No first round results.</div>';const f=we(S.election_tick),E=w.round_1_turnout_pct??w.turnout_pct,L=w.round_1_total_votes_cast??w.total_votes_cast;return r(y,f,E,L)}function u(S){if(!S)return'<div class="pol-el-empty">No runoff results.</div>';const w=S.results,y=w?.runoff_candidates;if(!y)return'<div class="pol-el-empty">No runoff results.</div>';const f=we(S.election_tick),E=[...y].sort((P,T)=>(T.votes||0)-(P.votes||0)),L=Math.max(...E.map(P=>P.vote_percentage||0),1);let O=E.map(P=>{const T=c[P.faction_id]||"#888",q=(P.vote_percentage||0).toFixed(1),M=Math.round((P.vote_percentage||0)/L*100),B=P.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";let U="";return P.base_votes!=null&&P.transfer_votes&&(U=`<div style="font-size:10px;color:var(--dtxt-muted);margin-top:2px">${(P.base_votes||0).toLocaleString()} direct + ${(P.transfer_votes||0).toLocaleString()} transferred</div>`),`<tr>
                <td><span class="pol-el-color-dot" style="background:${T}"></span>${$(P.candidate_name)}${B}</td>
                <td>${$(P.party_name)}</td>
                <td>${(P.votes||0).toLocaleString()}${U}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${M}%;background:${T}"></div></div></td>
                <td>${q}%</td>
            </tr>`}).join(""),R=`
            <div class="pol-el-date">${f}</div>
            <div class="pol-el-summary">Turnout: ${(w.turnout_pct||0).toFixed(1)}% &middot; ${(w.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${O}</tbody>
            </table>`;const N=E.flatMap(P=>(P.transfer_detail||[]).map(T=>({...T,to_candidate:P.candidate_name,to_faction_id:P.faction_id})));if(N.length>0){let P=N.map(T=>{const q=c[T.faction_id]||"#888",M=c[T.to_faction_id]||"#888",B=T.round1_votes>0?Math.round(T.transferred/T.round1_votes*100):0;return`<tr>
                    <td><span class="pol-el-color-dot" style="background:${q}"></span>${$(T.party_name||"")}</td>
                    <td><span class="pol-el-color-dot" style="background:${M}"></span>${$(T.to_candidate||"")}</td>
                    <td>${(T.transferred||0).toLocaleString()}</td>
                    <td>${B}%</td>
                </tr>`}).join("");R+=`
                <div style="margin-top:14px;font-family:var(--dfont-mono);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--dtxt-muted);margin-bottom:6px">Vote Transfers</div>
                <table class="pol-el-table">
                    <thead><tr><th>Eliminated Party</th><th>Votes Went To</th><th>Transferred</th><th>Rate</th></tr></thead>
                    <tbody>${P}</tbody>
                </table>`}return R}const a=t?.results?.was_runoff===!0;let g,C;a?(g=`
            <button class="pol-el-tab" data-tab="pres-r1">General Election [1st Round]</button>
            <button class="pol-el-tab" data-tab="pres-runoff">General Election [Runoff]</button>`,C=`
            <div class="pol-el-content" data-content="pres-r1">${x(t)}</div>
            <div class="pol-el-content" data-content="pres-runoff">${u(t)}</div>`):(g='<button class="pol-el-tab" data-tab="pres">General Election</button>',C=`<div class="pol-el-content" data-content="pres">${h(t)}</div>`);const b=va({isPresidentialSystem:ts(l),scheduledElections:v,currentTick:n,playerSeats:o});let A="";b.ticksUntilWindow?A=`<div style="font-size:10px;color:var(--dtxt-muted);text-align:right;margin-top:2px">Available in ${b.ticksUntilWindow} tick${b.ticksUntilWindow!==1?"s":""}</div>`:!b.disabled&&b.ticksUntilElection&&(A=`<div style="font-size:10px;color:var(--dgreen);text-align:right;margin-top:2px">${b.ticksUntilElection} tick${b.ticksUntilElection!==1?"s":""} until election</div>`);let d="",k="";if(!b.hidden){const S=i?.endorsed_party_id||null,y=(s||[]).filter(f=>f.id!==m?.id&&(f.seats||0)>0).map(f=>{const E=f.party_color||"#888",L=[f.leader_first_name,f.leader_last_name].filter(Boolean).join(" ")||"Unknown",O=f.id===S;return`<div class="pol-endorse-candidate${O?" selected":""}" data-faction-id="${f.id}">
                <span class="pol-el-color-dot" style="background:${E}"></span>
                <span class="pol-endorse-candidate-name">${$(f.faction_name||f.abbreviation)}</span>
                <span class="pol-endorse-candidate-leader">${$(L)}</span>
                <span class="pol-endorse-candidate-seats">${f.seats||0} seats</span>
                ${O?'<span style="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)">ENDORSED</span>':""}
            </div>`}).join("");d=`<div>
            <button class="pol-endorse-btn" ${b.disabled?"disabled":""}>Endorse Candidate</button>
            ${A}
        </div>`,k=`<div class="pol-endorse-panel" style="display:none">
            <div class="pol-endorse-panel-header">
                <span class="pol-section-label" style="margin-bottom:0;font-size:9px">ENDORSE A CANDIDATE</span>
                <button class="pol-endorse-panel-close">&times;</button>
            </div>
            <div class="pol-endorse-panel-desc">Select a party's candidate to endorse for the presidential election. First endorsement is free; switching costs 1 AP.</div>
            <div class="pol-endorse-candidate-list">
                ${y||'<div class="pol-el-empty">No eligible parties to endorse.</div>'}
            </div>
        </div>`}return`<div class="pol-election-box"
        data-faction-id="${m?.id||""}"
        data-nation-id="${l?.id||""}"
        data-current-tick="${n||0}">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Election Results</span>
            <div class="pol-box-header-right">${d}</div>
        </div>
        <div class="pol-box-body" style="padding:0">
        ${k}
        <div class="pol-el-tabs">
            <button class="pol-el-tab active" data-tab="parl">Parliamentary</button>
            ${g}
        </div>
        <div class="pol-el-content active" data-content="parl">${_(e)}</div>
        ${C}
        </div>
    </div>`}function Ia(){const e=document.querySelector(".pol-election-box");if(!e)return;const t=e.querySelectorAll(".pol-el-tab"),s=e.querySelectorAll(".pol-el-content");t.forEach(o=>{o.addEventListener("click",()=>{t.forEach(c=>c.classList.remove("active")),s.forEach(c=>c.classList.remove("active")),o.classList.add("active");const m=o.getAttribute("data-tab"),i=e.querySelector(`.pol-el-content[data-content="${m}"]`);i&&i.classList.add("active")})});const v=e.querySelector(".pol-endorse-btn"),n=e.querySelector(".pol-endorse-panel"),l=e.querySelector(".pol-endorse-panel-close");v&&n&&(v.addEventListener("click",()=>{const o=n.style.display!=="none";n.style.display=o?"none":"block"}),l&&l.addEventListener("click",()=>{n.style.display="none"}),n.querySelectorAll(".pol-endorse-candidate").forEach(o=>{o.addEventListener("click",async()=>{const m=o.getAttribute("data-faction-id"),i=e.getAttribute("data-faction-id"),c=Number(e.getAttribute("data-current-tick")||0),p=o.querySelector(".pol-endorse-candidate-name")?.textContent||"this party";if(confirm(`Endorse ${p}'s candidate for president? First endorsement is free; switching costs 1 AP.`)){o.style.opacity="0.5",o.style.pointerEvents="none";try{const _=await Os(I,i,m,c);if(!_.success){alert(_.error||"Endorsement failed.");return}n.querySelectorAll(".pol-endorse-candidate").forEach(x=>{x.classList.remove("selected"),x.querySelector('[style*="color:var(--dgreen)"]')?.remove()}),o.classList.add("selected");const r=document.createElement("span");r.style.cssText="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)",r.textContent="ENDORSED",o.appendChild(r);const h=_.newAp!=null?` (${_.newAp} AP remaining)`:"";alert(`Endorsed ${p}!${h}`),n.style.display="none",_.newAp!=null&&await Be(i)}catch(_){alert("Endorsement failed: "+(_.message||"Unknown error"))}finally{o.style.opacity="",o.style.pointerEvents=""}}})}))}function Pa(){const e=document.getElementById("pol-ba-bloc-data"),t=document.getElementById("pol-ba-party-pos"),s=document.getElementById("pol-ba-party-color");if(!e||!t)return;const v=JSON.parse(e.textContent),n=JSON.parse(t.textContent),l=JSON.parse(s.textContent);if(v.length===0)return;const o={BASE:{color:"var(--dgreen)",raw:"#4ade80",dim:"rgba(74,222,128,0.08)"},LEAN:{color:"#22d3ee",raw:"#22d3ee",dim:"rgba(34,211,238,0.08)"},SWING:{color:"var(--damber)",raw:"#facc15",dim:"rgba(250,204,21,0.08)"},SKEPTICAL:{color:"#f97316",raw:"#f97316",dim:"rgba(249,115,22,0.08)"},HOSTILE:{color:"var(--dred)",raw:"#ef4444",dim:"rgba(239,68,68,0.08)"}},m=[{key:"liberty_equality",left:"Liberty",right:"Equality"},{key:"tradition_progress",left:"Tradition",right:"Progress"},{key:"security_freedom",left:"Security",right:"Freedom"},{key:"globalism_nationalism",left:"Globalism",right:"Nationalism"},{key:"individualism_collectivism",left:"Individualism",right:"Collectivism"}],i=a=>a<=10?"var(--dgreen)":a<=20?"#22d3ee":a<=35?"var(--damber)":a<=50?"#f97316":"var(--dred)",c=a=>a>=3?"●●●":a>=2?"●●":a>=1?"●":"",p=a=>a>=3?"var(--dred)":a>=2?"#f97316":a>=1?"var(--damber)":"var(--dtext-3)",_=document.getElementById("pol-ba-selected"),r=document.getElementById("pol-ba-dropdown"),h=document.getElementById("pol-ba-sel-arrow"),x=r.querySelectorAll(".pol-ba-drop-item");function u(a){const g=o[a.tier]||o.HOSTILE;document.getElementById("pol-ba-sel-dot").style.background=g.raw,document.getElementById("pol-ba-sel-name").textContent=a.name;const C=document.getElementById("pol-ba-sel-badge");C.textContent=a.tier,C.style.color=g.raw,C.style.background=g.dim,document.getElementById("pol-ba-sel-pct").textContent=a.pct+"%";const b=m.map(M=>{const B=n[M.key]||50,U=a.axes[M.key]||50,z=Math.abs(B-U),H=a.strengths[M.key]||.5;return{...M,pv:B,bv:U,dist:z,str:H,weighted:z*H}}),A=b.reduce((M,B)=>M+B.weighted,0),d=m.length*100*3,k=Math.round(Math.max(0,100-A/d*100)),S=a.pref,w=k-S,y=document.getElementById("pol-ba-alignment");y.textContent=k,y.style.color=g.raw;const f=document.getElementById("pol-ba-performance"),E=a.perf??50;f.textContent=Math.round(E),f.style.color=E>=55?"var(--dgreen)":E>=40?"var(--damber)":"var(--dred)";const L=document.getElementById("pol-ba-approval");L.textContent=S,L.style.color="var(--dtext-0)";const O=document.getElementById("pol-ba-headroom");O.textContent=(w>=0?"+":"")+w.toFixed(1),O.style.color=w>10?"var(--damber)":w>=0?"var(--dgreen)":"var(--dred)",document.getElementById("pol-ba-legend-bloc-dot").style.background=g.raw;const R=document.getElementById("pol-ba-legend-bloc-name");R.textContent=a.name,R.style.color=g.raw;const N=document.getElementById("pol-ba-axes");N.innerHTML=b.map(M=>{const B=i(M.dist),U=Math.min(M.pv,M.bv),z=M.dist;return`<div class="pol-ba-axis-row">
                <div class="pol-ba-axis-labels">
                    <span class="pol-ba-axis-label">${M.left}</span>
                    <span class="pol-ba-axis-str" style="color:${p(M.str)}">${c(M.str)}</span>
                    <span class="pol-ba-axis-label">${M.right}</span>
                </div>
                <div class="pol-ba-axis-track">
                    <div style="position:absolute;left:15%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:85%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:35%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:65%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(255,255,255,0.1)"></div>
                    ${M.dist>3?`<div class="pol-ba-axis-band" style="left:${U}%;width:${z}%;background:${B}12"></div>`:""}
                    <div class="pol-ba-axis-marker" style="left:${M.pv}%;background:${l};z-index:3">
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
            </div>`}).join("");const P=b.reduce((M,B)=>B.dist<M.dist?B:M,b[0]),T=b.reduce((M,B)=>B.weighted>M.weighted?B:M,b[0]);document.getElementById("pol-ba-summary").innerHTML=`<span style="color:var(--dgreen)">Closest: ${P.left}/${P.right}</span><span style="color:var(--dred)">Gap: ${T.left}/${T.right}</span>`;const q=document.getElementById("pol-ba-issues");q.innerHTML=(a.issues||[]).map(M=>`<span class="pol-ba-issue-tag">${M}</span>`).join(""),x.forEach(M=>{M.classList.toggle("active",M.getAttribute("data-bloc-id")===a.id),M.getAttribute("data-bloc-id")===a.id?M.style.borderLeftColor=g.raw:M.style.borderLeftColor="transparent"})}u(v[0]),_.addEventListener("click",()=>{const a=r.classList.toggle("open");h.classList.toggle("open",a)}),x.forEach(a=>{a.addEventListener("click",()=>{const g=a.getAttribute("data-bloc-id"),C=v.find(b=>b.id===g);C&&u(C),r.classList.remove("open"),h.classList.remove("open")})}),document.addEventListener("click",a=>{const g=document.getElementById("pol-ba-selector");g&&!g.contains(a.target)&&(r.classList.remove("open"),h.classList.remove("open"))})}function $(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}let W=null,Re=null,Le=null,ze=null,nt=null,ke=null,We=null,Ue=null,tt="minister",re=null,Me=null,Z=null,Ve=null,rt=!1,Ke=null,ct=null,Ye=null,ht=!1,st=null,dt=null,V=null,ne=null,Xe=null,Oe=!1;const Ta=[{key:"momentum",label:"MOMENTUM",color:"#f97316"},{key:"alignment",label:"ALIGNMENT",color:"#a78bfa"},{key:"appeal",label:"APPEAL",color:"#38bdf8"},{key:"tools",label:"TOOLS",color:"#6b7280"}],Lt=[{id:"rally",name:"Hold a Rally",ap:Ft.AP_COST,color:"#f97316",icon:"★",category:"momentum",affects:"Momentum",desc:"Rally your supporters in a public show of strength. Random outcome that directly affects your Momentum score. A rousing success builds momentum; a gaffe costs it."},{id:"press_conference",name:"Press Conference",ap:1,color:"#fbbf24",icon:"🎤",category:"momentum",affects:"Momentum",desc:"Hold a press conference to make a public statement. Base roll: -2 to +2 Momentum. Opposition parties get +1 bonus. High-approval governing parties get +2 bonus."},{id:"attack",name:"Campaign Attack",ap:as.AP_COST,color:"#ef4444",icon:"✦",category:"momentum",affects:"Momentum",desc:"Target a rival party's record or leadership. Lowers their momentum and can hurt their election chances. More effective with evidence — but a weak attack backfires on you."},{id:"fund_think_tank",name:"Fund Think Tank",ap:le.THINK_TANK.AP_COST,color:"#14b8a6",icon:"🏛",category:"alignment",affects:"Ideology",desc:"Fund a think tank to gradually shift the electorate's ideology on a chosen axis. Long-term investment: 8 AP upfront + 1 AP/tick for 50 ticks. Improves your Ideology pillar score."},{id:"grassroots_movement",name:"Grassroots Movement",ap:le.GRASSROOTS.AP_COST,color:"#10b981",icon:"🌱",category:"alignment",affects:"Ideology + Momentum",desc:"Launch a grassroots campaign to shift public ideology and build momentum. Runs for 100 ticks. Drifts electorate opinion toward your position and grants +1 Momentum periodically."},{id:"pivot",name:"Ideological Pivot",ap:1,color:"#f59e0b",icon:"⟳",category:"alignment",affects:"Alignment",desc:"Shift your party's position on a chosen ideological axis. Costs escalate with each pivot (+1 AP per use, resets after 20 ticks). Reversing your current lean costs extra AP."},{id:"take_stance",name:"Take a Stance",ap:ie.AP_COST,color:"#38bdf8",icon:"⚑",category:"appeal",affects:"Appeal + Ideology",desc:"Declare your party's official position on a national issue. Builds platform appeal with aligned voters and shifts your ideology. Stances decay each tick — reinforce before they fade."},{id:"outreach",name:"Community Outreach",ap:3,color:"#60a5fa",icon:"🤝",category:"appeal",affects:"Appeal",desc:"Engage directly with communities through town halls and local events. +3 Platform Appeal. Cost starts at 3 AP and escalates by +1 each use. Decays by 1 each tick you don't use it."},{id:"poll_now",name:"Poll Now",ap:1,color:"#22d3ee",icon:"📊",category:"tools",affects:"Informational",desc:"Commission a poll to update the Current Electoral Standing. 1 AP = ±5% margin, 3 AP = ±3% margin."}];let at={},Dt={},xt=[],X=null,te=null,pt=null,Se=1,At=0,Ut=0,lt=0;window._selectPollTier=function(e){Se=e;const t=document.getElementById("ca-config-panel");t&&(t.innerHTML=ms())};let ye=null,be=null,me=null,Ee="moderate",ot=null;function Na(){Re=null,Le=null,ze=null,nt=null,ke=null,Ue=null,tt="minister",re=null,Ke=null,ct=null,Ye=null,ht=!1,X=null,te=null,ye=null,be=null,me=null,Ee="moderate"}function vs(){return W==="rally"?!0:W==="attack"?!!Re&&!!Le:W==="promise"?ze==="stat"?!!nt:ze==="crisis"?!!ke:!1:W==="protest"?!!re:W==="take_stance"?!!ye&&!!be&&!!me&&!!Ee:W==="poll_now"||W==="press_conference"||W==="outreach"?!0:W==="fund_think_tank"||W==="media_campaign"||W==="grassroots_movement"?!!X&&!!te:W==="pivot"?!!X&&!!te&&!at.pivot:!1}function Ht(){if(W==="protest"){const t=V,s=ne?.current_tick||0,v=is(t?.protest_use_count||0,t?.protest_last_use_tick,s);return rs(v)}if(W==="pivot"){const t=V,s=ne?.current_tick||0;let v=t?.pivot_count||0;const n=t?.pivot_last_tick||0;s-n>=Ne.ESCALATION_RESET&&(v=0);let l=Ne.BASE_AP+v;if(X&&te&&pt){const o=Number(pt[X]??0),m=te==="right"?1:-1;(o>0&&m<0||o<0&&m>0)&&(l+=Ne.REVERSE_AP_EXTRA)}return l}if(W==="poll_now")return Se;if(W==="outreach"){const t=V,s=ne?.current_tick||0;return Math.max(1,3+(At||0)+(t?Ct("outreach",t,s):0))}if(W==="rally"){const t=V,s=ne?.current_tick||0;return Math.max(1,Ft.AP_COST+(Ut||0)+(t?Ct("rally",t,s):0))}if(W==="press_conference"){const t=V,s=ne?.current_tick||0;return Math.max(1,1+(lt||0)+(t?Ct("press_conference",t,s):0))}const e=Lt.find(t=>t.id===W);return e?e.id==="attack"?Et(dt?.polarization):e.ap:0}async function vt(e,t,s,v){dt=e,V=t,ne=s,Xe=v;const n=document.getElementById("actions-container");if(!n)return;let l=s?.current_tick||0;if(!l){const{data:d}=await I.from("shard").select("current_tick").eq("name","Alpha Shard").single();l=d?.current_tick||0,s&&(s.current_tick=l)}const o=t,m=e,{data:i}=await I.from("factions").select("action_points, party_funds").eq("id",o.id).single();i&&(o.action_points=i.action_points,o.party_funds=i.party_funds);const c=o.action_points??0,p=await es(I,m.id),_=new Set(p?.party_ids||[]);Oe=o.id===m.ruling_faction_id||_.has(o.id);const{data:r}=await I.from("faction_ideology").select("*").eq("faction_id",o.id).single();pt=r;const h=(v||[]).filter(d=>d.id!==o.id),{data:x}=await I.from("issue_state").select("issue_id, salience").eq("nation_id",m.id).order("salience",{ascending:!1}).limit(7),u=new Set;for(const d of x||[]){const k=he[d.issue_id];if(k)for(const S of k.stats)u.add(S)}let a={},g=2;if(!Oe){const{data:d}=await I.from("protest_log").select("id, status, tier, tick_called, tick_resolved, crisis_started_tick, crisis_duration, demand_label, turnout_score, effects_applied, grievance_type, grievance_data").eq("faction_id",o.id).in("status",["resolving","crisis_active"]).limit(1).maybeSingle();Z=d;const k=is(o.protest_use_count||0,o.protest_last_use_tick,l);if(g=rs(k),a=aa(o,l,!0,d),d)Me=d.status==="resolving"?"resolving":"active";else if(o.protest_locked_by)Me="locked";else if(o.protest_cooldown_until_tick&&o.protest_cooldown_until_tick>l)Me="cooldown";else{const{data:S}=await I.from("protest_log").select("id, tier, turnout_score, effects_applied, tick_resolved, roll_breakdown, condition_score").eq("faction_id",o.id).eq("status","resolved").gte("tick_resolved",l-1).order("tick_resolved",{ascending:!1}).limit(1).maybeSingle();S&&S.tick_resolved===l?(Me="result",Z=S):Me=null}}if(Ve=null,rt=!1,!Oe&&!Z){const{data:d}=await I.from("protest_log").select("id, faction_id, status, tier, demand_label, grievance_type").eq("nation_id",m.id).eq("status","resolving").neq("faction_id",o.id).limit(1).maybeSingle();if(d){Ve=d;const{data:k}=await I.from("protest_endorsements").select("id").eq("protest_id",d.id).eq("faction_id",o.id).maybeSingle();rt=!!k}}if(st=null,Oe){const{data:d}=await I.from("protest_log").select("id, tier, status, public_address_last_tick, tier7_demand, crisis_started_tick, crisis_duration").eq("nation_id",m.id).eq("status","crisis_active").order("crisis_started_tick",{ascending:!1}).limit(1).maybeSingle();st=d}const{data:C}=await I.from("campaign_actions").select("action_type, tick_performed").eq("party_id",o.id).gte("tick_performed",l-10).order("tick_performed",{ascending:!1}),{data:b}=await I.from("ideology_shift_actions").select("id, action_type, target_axis, target_direction, drift_rate, created_tick, status, band_shift_total").eq("faction_id",o.id).in("status",["active","paused","suspended"]);at={},Dt={};const A={fund_think_tank:le.THINK_TANK.COOLDOWN_WINDOW,media_campaign:le.MEDIA_CAMPAIGN.COOLDOWN_WINDOW,grassroots_movement:le.GRASSROOTS.COOLDOWN_WINDOW,take_stance:ie.COOLDOWN_WINDOW,poll_now:Ds.COOLDOWN_WINDOW};for(const d of C||[]){const k=d.action_type,S=A[d.action_type];if(S){const w=d.tick_performed+S-l;w>0&&(!at[k]||w>at[k])&&(at[k]=w)}d.tick_performed===l&&(Dt[k]=!0)}xt=b||[];for(const[d,k]of[["outreach",S=>At=S],["rally",S=>Ut=S],["press_conference",S=>lt=S]]){const S=(C||[]).filter(w=>w.action_type===d);if(S.length>0){const w=Math.max(...S.map(y=>y.tick_performed));k(Math.max(0,S.length-(l-w)))}else k(0)}jt(n,o,m,c,h,r,l,a,g)}function jt(e,t,s,v,n,l,o,m,i){const c=[...Lt];Oe||c.push({id:"protest",name:"Organise a Protest",ap:i||2,color:"#d9534f",icon:"!",category:"momentum",affects:"Momentum",desc:"Mobilize citizens against the government. A strong turnout forces a crisis and builds your momentum, but a fizzle hands the ruling party a free headline."});const p=c.find(a=>a.id===W);let _="";if(t.pyrrhic_victory_until_tick&&t.pyrrhic_victory_until_tick>o){const a=t.pyrrhic_victory_until_tick-o;_+=`<div class="protest-pyrrhic-banner">
            <span style="font-weight:700">PYRRHIC VICTORY</span> — ${a} tick${a!==1?"s":""} remaining. AP income reduced by 2/tick.
        </div>`}if(Oe&&st){const a=st,g=a.public_address_last_tick!=null?Math.max(0,je.PUBLIC_ADDRESS_COOLDOWN-(o-a.public_address_last_tick)):0,C=v>=je.PUBLIC_ADDRESS_AP&&g===0,b=g>0?" ca-item--cooldown":"",A=g>0?`${g} TICK CD`:`${je.PUBLIC_ADDRESS_AP} AP`;_+=`<div class="ca-item ca-item--public-address${b}${C?"":" disabled"}" data-action-id="public_address" style="${C?"":"opacity:0.5;"}">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#5b9bd5">&#9788;</span>
                    <span class="ca-item-name">Public Address</span>
                </div>
                <span class="ca-item-ap">${A}</span>
            </div>
            <div class="ca-item-desc" style="font-size:9px;color:#4a4840;">Issue a public statement calling for calm. Reduces civil unrest buildup this tick.</div>
        </div>`}const r=[];let h=null;for(const a of c)a.category&&(!h||a.category!==h.key)&&(h={key:a.category,actions:[]},r.push(h)),h&&h.actions.push(a);for(let a=0;a<r.length;a++){const g=r[a],C=Ta.find(b=>b.key===g.key);C&&(_+=`<div style="font-family:var(--dfont-mono);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${C.color};padding:8px 6px 2px;${a>0?"border-top:1px solid var(--dborder-0);margin-top:4px;":""}">${C.label}</div>`),_+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:0 2px;">';for(const b of g.actions){const A=W===b.id;if(b.id==="protest"){_+=`<div style="grid-column:1/-1">${Ga(b,A,v,t,o)}</div>`;continue}let k=b.id==="attack"?Et(s?.polarization):b.id==="outreach"?3+(At||0):b.id==="rally"?Ft.AP_COST+(Ut||0):b.id==="press_conference"?1+(lt||0):b.ap;["outreach","press_conference","rally"].includes(b.id)&&t.leader_positive_traits&&(k=Math.max(1,k+Ct(b.id,t,o)));const S=b.id==="promise"?"make_promise":b.id,w=at[S]||0,y=w>0,f=!!Dt[S],E=xt.some(B=>B.action_type===b.id.replace("fund_","")),L=v>=k&&!y&&!f,O=A?b.color:L?b.color+"55":"var(--dtext-3)",R=A?`background:${b.color}08;`:"",N=A?`border-color:${b.color}33;`:"",P=A?b.color:"var(--dtext-0)",T=b.affects==="Momentum"?"#f97316":b.affects==="Appeal"?"#38bdf8":b.affects.includes("Ideology")?"#a78bfa":b.affects==="Alignment"?"#f59e0b":"#6b7280",q=f?`${b.name} already used this turn`:"",M=f?'<span class="ca-used-badge">USED</span>':y?`<span class="ca-cd-badge">${w} tick${w!==1?"s":""} CD</span>`:E?(()=>{const B=xt.find(U=>U.action_type===b.id.replace("fund_",""));return B?.status==="suspended"?'<span class="ca-active-badge" style="background:#d4a017">SUSPENDED</span>':B?.status==="paused"?'<span class="ca-active-badge" style="background:#f97316">PAUSED</span>':'<span class="ca-active-badge">ACTIVE</span>'})():"";_+=`<div class="ca-item${A?" selected":""}${L?"":" disabled"}${y?" ca-item--cooldown":""}${f?" ca-item--used":""}" data-action-id="${b.id}" style="border-left-color:${O};${R}${N}${L?"":"opacity:0.35;"}">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:${b.color}">${b.icon}</span>
                        <span class="ca-item-name" style="color:${P}">${$(b.name)}</span>
                        ${M}
                    </div>
                    <span class="ca-item-ap">${f?"USED":y?`${w} TICK CD`:`${k} AP`}</span>
                </div>
                <div class="ca-item-desc">${$(b.desc)}</div>
                ${f?`<div class="ca-item-used-msg">${$(q)}</div>`:`<div class="ca-item-affects" style="color:${T}">This action affects ${b.affects}</div>`}
            </div>`}_+="</div>"}let x="";if(!p)x='<div class="ca-panel"><div class="ca-panel-empty"><div class="ca-panel-empty-text">Choose an action</div></div></div>';else{if(x=`<div class="ca-panel" style="border-color:${p.color}22">`,We)x+=Ka(We);else if(p.id==="protest"&&Me==="result"&&Z)x+=Ya(Z);else if(p.id==="protest"&&Me==="resolving")x+=Xa();else{x+=Ma(p,n,l,s);const a=Ht(),g=vs(),C=v>=a&&g;x+=`<div class="ca-confirm-row"><div class="ca-confirm-btn${C?"":" disabled"}" style="background:${C?p.color:"var(--dtext-3)"}" id="ca-confirm-btn">Confirm — ${a} AP</div></div>`}x+="</div>"}let u="";if(xt.length>0){const a={think_tank:le.THINK_TANK.DURATION,media_campaign:le.MEDIA_CAMPAIGN.DURATION+le.MEDIA_CAMPAIGN.VISIBILITY_TICKS,grassroots_movement:le.GRASSROOTS.DURATION},g={think_tank:"Think Tank",media_campaign:"Media Campaign",grassroots_movement:"Grassroots Movement"},C={};for(const d of ae)C[d.key]=d;const b=d=>d==="think_tank"||d==="grassroots_movement";u=`<div class="ca-active-actions" style="margin-top:16px;">
            <div class="pe-header"><span class="pol-mod-title">Active Actions</span></div>
            <table class="pol-el-table" style="margin-top:4px"><thead><tr><th>Action</th><th>Activated</th><th>Effect</th><th style="text-align:right">Ticks Left</th><th></th></tr></thead><tbody>${xt.map(d=>{const k=a[d.action_type]||50,S=o-d.created_tick,w=Math.max(0,k-S),y=C[d.target_axis],f=y?`${y.leftLabel}–${y.rightLabel}`:"",E=d.target_direction==="left"?y?.leftLabel:d.target_direction==="right"?y?.rightLabel:d.target_direction==="expand"?`Expand ${f}`:d.target_direction==="narrow"?`Narrow ${f}`:d.target_direction||"?",L=d.drift_rate?`+${d.drift_rate}/tick ${E}`:E,O=we(d.created_tick),R=d.status==="paused",N=d.status==="suspended",P=N?'<span style="color:#d4a017;font-weight:600">SUSPENDED</span>':R?'<span style="color:#f97316;font-weight:600">PAUSED</span>':`${w}`;let T="";return b(d.action_type)?R||N?T=`<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="continue" data-id="${d.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#5cb85c;color:#fff;border:none;border-radius:3px">Continue — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${d.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`:T=`<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="suspend" data-id="${d.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#c8a44e;color:#fff;border:none;border-radius:3px">Suspend — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${d.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`:T="<td></td>",`<tr>
                <td style="font-weight:600">${g[d.action_type]||d.action_type}</td>
                <td>${O}</td>
                <td>${L}</td>
                <td style="text-align:right">${P}</td>
                ${T}
            </tr>`}).join("")}</tbody></table>
        </div>`}e.innerHTML=`<div class="ca-wrap"><div class="ca-list">${_}</div>${x}</div>
    ${u}
    <div class="ca-portfolios" style="margin-top:16px;">
    </div>
    <div class="pe-container">
        <div class="pe-header"><span class="pol-mod-title">Party Events</span></div>
        <div id="party-events-feed" class="pe-feed"><div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px">Loading events...</div></div>
    </div>
    <div id="ca-stance-portfolio-container" style="margin-top:16px;"></div>`,Tt(document.getElementById("ca-stance-portfolio-container"),t,s),ya(s.id,t.id),e.querySelectorAll(".ca-manage-btn").forEach(a=>{a.addEventListener("click",async g=>{if(g.stopPropagation(),a.dataset.executing)return;a.dataset.executing="true",a.style.opacity="0.4";const C=a.dataset.id,b=a.dataset.action;try{let A;if(b==="suspend"?A=await Hs(I,t.id,C,o):b==="continue"?A=await qs(I,t.id,C,o):b==="cancel"&&(A=await Fs(I,t.id,s.id,C,o)),A?.success){A.newAp!=null&&(t.action_points=A.newAp);const d=await Be(t.id);d!==void 0&&(t.action_points=d),ee(A.message||"Done.",!1),await vt(s,t,ne,Xe)}else ee(A?.message||"Action failed.")}catch(A){ee("Error: "+A.message)}finally{a.dataset.executing="",a.style.opacity="1"}})}),e.querySelectorAll(".ca-item").forEach(a=>{a.addEventListener("click",async()=>{const g=a.dataset.actionId;if(g==="public_address"&&st){if(a.classList.contains("disabled")||a.dataset.executing)return;a.dataset.executing="true",a.style.opacity="0.4";try{const A=await oa(I,t.id,s.id,st.id,o);if(A.success){t.action_points=A.newAp;const d=await Be(t.id);d!==void 0&&(t.action_points=d),await vt(s,t,ne,Xe)}else ee(A.error||"Public Address failed."),a.style.opacity="",delete a.dataset.executing}catch(A){ee("Error: "+(A.message||"Unknown")),a.style.opacity="",delete a.dataset.executing}return}const C=Lt.find(A=>A.id===g),b=C?.id==="attack"?Et(s?.polarization):C?.ap;C&&v<b||(W===g?W=null:W=g,Na(),We=null,jt(e,t,s,v,n,l,o,m,i))})}),Ja(e,t,s,v,n,l,o,m,i)}function Ma(e,t,s,v,n,l){return e.id==="rally"?Oa():e.id==="attack"?qa(t):e.id==="protest"?Ua(v):e.id==="take_stance"?Ra():e.id==="poll_now"?ms():e.id==="fund_think_tank"?za():e.id==="media_campaign"?Ba():e.id==="grassroots_movement"?Da():e.id==="pivot"?Ha():e.id==="press_conference"?'<div class="ca-info-box">Hold a press conference to make a public statement. Result depends on your position and approval.<br><br><strong>Base roll:</strong> -2 to +2 Momentum<br><strong>Opposition bonus:</strong> +1<br><strong>Government bonus:</strong> +2 (if gov approval ≥ 40)</div>':e.id==="outreach"?'<div class="ca-info-box">Engage directly with communities through town halls, door-knocking, and local events.<br><br><strong>Effect:</strong> +3 Platform Appeal</div>':""}function Oa(){return'<div class="ca-info-box">Hold a rally to energize your base. Random outcome that directly affects your Momentum — can boost or backfire.</div>'}function Ra(e){let t=`<div class="ca-info-box">Declare your party's position on an issue. Stances build platform appeal but decay over time.</div>`;t+='<div class="ca-subtitle" style="margin-top:10px">Select Issue</div><div style="display:flex;flex-direction:column;gap:3px">';const s=Object.entries(he),v=ot?s.sort((n,l)=>{const o=ot.find(i=>i.issue_id===n[0])?.salience??0;return(ot.find(i=>i.issue_id===l[0])?.salience??0)-o}):s;for(const[n,l]of v){const o=ye===n,m=ot?.find(c=>c.issue_id===n),i=m?Number(m.salience).toFixed(0):"—";t+=`<div class="ca-option-chip${o?" selected":""}" data-stance-issue-id="${n}" style="padding:6px 10px;display:flex;justify-content:space-between;align-items:center;${o?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
            <span style="font-weight:600">${$(l.label)}</span>
            <span style="font-size:10px;color:var(--dtext-3)">Salience: ${i}</span>
        </div>`}if(t+="</div>",ye){const n=he[ye];if(n&&n.axes.length>0){t+='<div class="ca-subtitle" style="margin-top:12px">Choose Axis</div><div style="display:flex;flex-direction:column;gap:3px">';for(const l of n.axes){const o=ae.find(i=>i.key===l);if(!o)continue;const m=be===l;t+=`<div class="ca-option-chip${m?" selected":""}" data-stance-axis-key="${l}" style="padding:6px 10px;${m?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                    <span style="color:${o.leftColor}">${o.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="color:${o.rightColor}">${o.rightLabel}</span>
                </div>`}t+="</div>"}}if(be){const n=ae.find(l=>l.key===be);if(n){t+='<div class="ca-subtitle" style="margin-top:12px">Choose Side</div><div style="display:flex;gap:8px">';const l=me==="left",o=me==="right";t+=`<div class="ca-option-chip${l?" selected":""}" data-stance-side-val="left" style="flex:1;text-align:center;padding:8px;${l?`border-color:${n.leftColor};color:${n.leftColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${n.leftLabel}</span></div>`,t+=`<div class="ca-option-chip${o?" selected":""}" data-stance-side-val="right" style="flex:1;text-align:center;padding:8px;${o?`border-color:${n.rightColor};color:${n.rightColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${n.rightLabel}</span></div>`,t+="</div>"}}if(me){const n=ae.find(m=>m.key===be),l=me==="left"?n?.leftLabel??"Left":n?.rightLabel??"Right",o=me==="left"?n?.leftColor??"#ccc":n?.rightColor??"#ccc";t+='<div class="ca-subtitle" style="margin-top:12px">Intensity</div><div style="display:flex;gap:6px">';for(const[m,i]of Object.entries(ie.INTENSITY)){const c=Ee===m;t+=`<div class="ca-option-chip${c?" selected":""}" data-stance-int-val="${m}" style="flex:1;text-align:center;padding:6px 4px;${c?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                <div style="font-weight:600;font-size:11px">${m}</div>
                <div style="font-size:9px;color:var(--dtext-3);margin-top:2px">Str ${i.strength} · -${i.decay_rate}/t</div>
                <div style="font-size:9px;color:${o};margin-top:1px;font-weight:600">+${i.ideology_shift} ${l}</div>
            </div>`}if(t+="</div>",Ee){const m=ie.INTENSITY[Ee],i=he[ye];t+=`<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                <div style="color:var(--dtext-1);font-weight:600;margin-bottom:4px">${Ee.toUpperCase()} ${l.toUpperCase()} on ${i?.label||""}</div>
                <div style="color:${o};font-weight:700">Ideology: +${m.ideology_shift} ${l}</div>
                <div style="color:var(--dtext-3);margin-top:2px">Strength: ${m.strength} · Decay: -${m.decay_rate}/tick</div>
            </div>`}}return t}function ms(){return`<div class="ca-info-box">Commission a poll to update the Current Electoral Standing table. Higher investment produces more accurate results.</div>
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
    `}function za(){let e=`<div class="ca-info-box">Launch a think tank to gradually drift the electorate's ideological mean on a chosen axis. ${le.THINK_TANK.AP_COST} AP upfront + ${le.THINK_TANK.TICK_AP_COST} AP/tick for ${le.THINK_TANK.DURATION} ticks. Drift: 1d3 (0.1–0.3) per tick.</div>`;if(e+=It(),X){const t=ae.find(s=>s.key===X);t&&(e+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',e+=Pt(t.leftLabel,t.rightLabel,"left","right"))}return e}function Ba(){const e=le.MEDIA_CAMPAIGN;let t=`<div class="ca-info-box">Launch a media campaign to expand or narrow electorate ideological variance on a chosen axis. Phase 1: 1d5 (0.1–0.5) variance shift/tick for ${e.DURATION} ticks. Phase 2: 1d3 (1–3) momentum/tick for ${e.VISIBILITY_TICKS} ticks.</div>`;return t+=It(),X&&(t+='<div class="ca-subtitle" style="margin-top:12px">Variance direction</div>',t+=Pt("Expand (polarize)","Narrow (centralize)","expand","narrow")),t}function Da(){const e=le.GRASSROOTS;let t=`<div class="ca-info-box">Launch a grassroots movement to slowly shift the electorate on a chosen axis. ${e.AP_COST} AP upfront + ${e.TICK_AP_COST} AP/tick for ${e.DURATION} ticks. Drift: 1d2 (${e.DRIFT_MIN}–${e.DRIFT_MAX})/tick. +1 momentum every ${e.VISIBILITY_INTERVAL} ticks.</div>`;if(t+=It(),X){const s=ae.find(v=>v.key===X);s&&(t+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',t+=Pt(s.leftLabel,s.rightLabel,"left","right"))}return t}function Ha(e){const t=V,s=ne?.current_tick||0;let v=t?.pivot_count||0;const n=t?.pivot_last_tick||0;s-n>=Ne.ESCALATION_RESET&&(v=0);const l=Math.max(0,Ne.COOLDOWN-(s-n)),o=n>0&&l>0;let m=`<div class="ca-info-box">Shift your party's ideological position. Each pivot costs +1 AP more than the last (resets after ${Ne.ESCALATION_RESET} ticks of no pivots). Reversing direction costs extra AP. Hold steady 20+ ticks for a conviction bonus.</div>`;if(o&&(m+=`<div style="font-family:var(--dfont-mono);font-size:11px;color:var(--damber);padding:6px 0">Cooldown: ${l} tick${l!==1?"s":""} remaining</div>`),m+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);padding:4px 0">Pivots this cycle: ${v} · Next cost: ${Ne.BASE_AP+v} AP${v>0?" (escalated)":""}</div>`,m+=It(),X){const i=ae.find(c=>c.key===X);if(i){const c=pt?Number(pt[X]??0):0,p=c>0?`+${c} (${i.rightLabel})`:c<0?`${c} (${i.leftLabel})`:"0 (Center)";if(m+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);padding:4px 0;margin-top:4px">Current position: <span style="font-weight:700">${p}</span></div>`,m+='<div class="ca-subtitle" style="margin-top:8px">Pivot direction</div>',m+=Pt(i.leftLabel,i.rightLabel,"left","right"),te){const _=te==="right"?1:-1;(c>0&&_<0||c<0&&_>0)&&(m+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);padding:6px 0;border-top:1px solid var(--dborder-1);margin-top:8px">⚠ Reversal: +${Ne.REVERSE_AP_EXTRA} AP extra</div>`)}}}return m}function It(){let e='<div class="ca-subtitle" style="margin-top:10px">Target axis</div><div style="display:flex;flex-direction:column;gap:4px">';for(const t of ae){const s=X===t.key;e+=`<div class="ca-option-chip${s?" selected":""}" data-axis-key="${t.key}" style="padding:6px 10px;${s?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">
            <span style="font-weight:600">${t.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="font-weight:600">${t.rightLabel}</span>
            <span style="font-size:0.75em;color:var(--dtext-3);margin-left:6px">${t.description}</span>
        </div>`}return e+="</div>",e}function Pt(e,t,s,v){let n='<div style="display:flex;gap:8px">';const l=te===s,o=te===v;return n+=`<div class="ca-option-chip${l?" selected":""}" data-direction-value="${s}" style="flex:1;text-align:center;padding:8px;${l?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${e}</div>`,n+=`<div class="ca-option-chip${o?" selected":""}" data-direction-value="${v}" style="flex:1;text-align:center;padding:8px;${o?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${t}</div>`,n+="</div>",n}function qa(e){const t=dt?.polarization||0,s=Et(t);let n=`<div style="color:#ef4444;font-size:0.85em;margin-bottom:4px">Using this will increase Polarization by 0.25.${s>as.AP_COST?` Cost scaled to ${s} AP (polarization ${Math.round(t)}).`:""}</div><div class="ca-subtitle">Select target party</div>`;for(const l of e){const o=Re===l.id;n+=`<div class="ca-rival-card${o?" selected":""}" data-rival-id="${l.id}" style="border-left-color:${o?"#ef4444":l.party_color||"#888"};${o?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
            <span class="ca-rival-name" style="color:${o?"#ef4444":"var(--dtext-0)"}">${$(l.faction_name)}</span>
        </div>`}if(Re&&Ue){n+='<div class="ca-subtitle" style="margin-top:12px">Choose attack vector</div>';for(const l of Ue){const o=Le===l.id;l.strength==="strong"||l.strength;const m=l.evidence_required&&l.strength==="weak",i=l.strength==="strong"?"#4ade80":l.strength==="moderate"?"#facc15":"#ef4444";n+=`<div class="ca-vector-card${o?" selected":""}${m?" disabled":""}" data-vector-id="${l.id}" style="border-left-color:${o?"#ef4444":i};${o?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="ca-vector-name">${$(l.name)}</span>
                    <span class="ca-vector-strength" style="color:${i}">${l.strength.toUpperCase()}</span>
                </div>
                <div class="ca-vector-desc">${$(l.description)}</div>
            </div>`}if(Le){const l=Ue.find(o=>o.id===Le);if(l){const o=Gs(l.strength),m=Math.max(...Object.values(o));n+='<div style="margin-top:10px">';const i={devastating:"#4ade80",effective:"#22d3ee",glancing:"#facc15",backfire:"#f97316",mutual:"#ef4444"};for(const c of Us){const p=o[c.id]||0,_=m>0?p/m*100:0,r=i[c.id]||"#888";n+=`<div class="ca-outcome-bar">
                        <span class="ca-outcome-name">${$(c.name)}</span>
                        <div class="ca-outcome-track"><div class="ca-outcome-fill" style="width:${_}%;background:${r}"></div></div>
                        <span class="ca-outcome-pct" style="color:${r}">${p}%</span>
                    </div>`}n+="</div>"}}}else Re&&!Ue&&(n+='<div class="ca-info-box" style="margin-top:12px">Loading evidence...</div>');return n}async function Fa(e,t,s){if(!Ke){const{data:v}=await I.from("ministries").select("ministry_key, minister_first_name, minister_last_name, minister_approval, party_id").eq("nation_id",e.id).not("party_id","is",null).order("minister_approval",{ascending:!0});Ke=v||[]}if(!ct){const{data:v}=await I.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",e.id);ct=(v||[]).map(n=>({...n,duration:s-(n.started_at_tick||0)}))}if(!Ye){const{data:v}=await I.from("stat_history").select("stat_name, value, tick").eq("nation_id",e.id).gte("tick",s-6).order("tick",{ascending:!0}),n={};for(const i of v||[])n[i.stat_name]||(n[i.stat_name]=[]),n[i.stat_name].push({tick:i.tick,value:i.value});const l=[];for(const[i,c]of Object.entries(n)){if(ca(i))continue;const p=c.sort((a,g)=>a.tick-g.tick),_=e[i]??p[p.length-1]?.value??0;if(!(ls(i)?_>=70:_<=30))continue;const h=p[0]?.value??_,x=_-h,u=da(_,h,i);l.push({key:i,current:_,sixTicksAgo:h,delta:x,failureScore:u,displayName:i.replace(/_/g," ").replace(/\b\w/g,a=>a.toUpperCase())})}l.sort((i,c)=>c.failureScore-i.failureScore);const{data:o}=await I.from("protest_log").select("tick_called").eq("nation_id",e.id).gte("tick_called",s-6),m=pa((o||[]).map(i=>({tick:i.tick_called})),s);Ye={failingStats:l,_fatigueLevel:m}}}function Ga(e,t,s,v,n){const l=Me,o=e.ap,m=s>=o;if(l==="resolving")return`<div class="ca-item ca-item--protest ca-item--resolving" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#c8a64e">!</span>
                    <span class="ca-item-name" style="color:#c8a64e">${$(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#c8a64e">RESOLVING...</span>
            </div>
        </div>`;if(l==="result"&&Z){const r=Z.tier;if(r>=3&&r<=5){const h=ns(r).toUpperCase(),x=Z.roll_breakdown||{},u=x.endorsements||0,a=x.joint_bonus||0;return`<div class="ca-item ca-item--protest ca-item--result-${r}" data-action-id="protest">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:#5cb85c">!</span>
                        <span class="ca-item-name" style="color:#5cb85c">${$(e.name)}</span>
                    </div>
                    <span class="ca-item-ap" style="color:#5cb85c">TIER ${r} — ${h}</span>
                </div>
                ${u>0?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#a78bfa;margin-top:2px;padding:0 12px 4px">${u} party endorsement${u>1?"s":""} (+${a} bonus)</div>`:""}
            </div>`}}if(l==="active"&&Z){const r=(Z.crisis_started_tick??n)+(Z.crisis_duration||6)-n,h=Z.tier===6&&(v.action_points||0)>=je.CALL_OFF_AP,x=Z.tier===7;return`<div class="ca-item ca-item--protest ca-item--active" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${$(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">ACTIVE — TIER ${Z.tier}</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Your protest crisis is running. ${Z.demand_label?`Demand: ${$(Z.demand_label)}`:""}</div>
            <div class="protest-passive-status">Running — ${Math.max(0,r)} tick${r!==1?"s":""} remaining.</div>
            ${x?'<div class="protest-calloff-note">Tier 7 protests cannot be called off.</div>':`<div class="protest-calloff-btn${h?"":" disabled"}" onclick="window._protestCallOff()">Call Off Protest — ${je.CALL_OFF_AP} AP</div>`}
        </div>`}if(l==="locked")return`<div class="ca-item ca-item--protest ca-item--locked" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${$(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">LOCKED</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">A protest crisis is already underway, led by another party.</div>
        </div>`;if(l==="cooldown"){const r=(v.protest_cooldown_until_tick||0)-n;return`<div class="ca-item ca-item--protest ca-item--cooldown" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.3)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.3)">${$(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#4a4840">COOLDOWN ${Math.max(0,r)}</span>
            </div>
        </div>`}if(Ve&&!l){const r=!rt&&(v.action_points||0)>=1,h=rt?"ENDORSED":"ENDORSE — 1 AP";return`<div class="ca-item ca-item--protest ca-item--endorse" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#a78bfa">!</span>
                    <span class="ca-item-name" style="color:#a78bfa">${$(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#a78bfa">ENDORSEMENT</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Another opposition party has called a protest. You can endorse it to boost turnout (+15 per endorsement).</div>
            ${Ve.demand_label?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#f97316;padding:0 12px 4px">Demand: ${$(Ve.demand_label)}</div>`:""}
            <div class="protest-endorse-btn${r?"":" disabled"}" onclick="window._protestEndorse()">${h}</div>
        </div>`}return`<div class="ca-item ca-item--protest${t?" selected":""}${m?"":" disabled"}" data-action-id="protest" style="border-left-color:${t?"#d9534f":m?"rgba(217,83,79,0.55)":"var(--dtext-3)"};${t?"background:rgba(217,83,79,0.07);":""}${t?"border-color:rgba(217,83,79,0.2);":""}${m?"":"opacity:0.35;"}">
        <div class="ca-item-head">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="ca-item-icon" style="color:#d9534f">!</span>
                <span class="ca-item-name" style="color:${t?"#e06460":"var(--dtext-0)"}">${$(e.name)}</span>
            </div>
            <span class="ca-item-ap" style="color:#d9534f">${o} AP</span>
        </div>
        ${t?`<div class="ca-item-desc">${$(e.desc)}</div>`:""}
    </div>`}function Ua(e,t){let s="";s+='<div class="protest-warning">Turnout is probabilistic — based on Civil Unrest, Happiness, Polarisation, and Political Violence. A fizzle hands the government a free headline. Choose your moment.</div>';const v=[{key:"civil_unrest",label:"CIVIL UNREST",value:e.civil_unrest||0},{key:"happiness",label:"HAPPINESS",value:e.happiness||50},{key:"polarization",label:"POLARISATION",value:e.polarization||0},{key:"political_violence",label:"POL VIOLENCE",value:e.political_violence||0}];s+='<div class="protest-stat-hints">';for(const i of v){const c=ia(i.key,i.value);s+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">${i.label}</span>
            <span class="protest-stat-pill__value" style="color:${c}">${Math.round(i.value)}</span>
        </div>`}const n=Ye?._fatigueLevel||{label:"...",color:"#4a4840"};s+=`<div class="protest-stat-pill">
        <span class="protest-stat-pill__label">PROTEST FATIGUE</span>
        <span class="protest-stat-pill__value" style="color:${n.color}">${n.label}</span>
    </div>`;const l=(Xe||[]).filter(i=>!(i.id===V?.id||Oe)).length;if(l>0){const i=l>=2?"#a78bfa":"#4a4840";s+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">ENDORSERS</span>
            <span class="protest-stat-pill__value" style="color:${i}">${l}</span>
        </div>`}s+="</div>";const o=[{id:"minister",label:"Minister"},{id:"activeCrisis",label:"Active Crisis"},{id:"statFailure",label:"Stat Failure"}];s+='<div class="protest-tabs">';for(const i of o)s+=`<div class="protest-tab${tt===i.id?" active":""}" data-protest-tab="${i.id}">${i.label}</div>`;s+="</div>",s+='<div class="protest-target-list" id="protest-target-list">',tt==="minister"?s+=ja():tt==="activeCrisis"?s+=Wa():tt==="statFailure"&&(s+=Va()),s+="</div>";const m=re?.label||null;return s+='<div class="protest-confirm">',s+=`<div class="protest-confirm__note">${m?`Targeting: ${$(m)}`:"Select a target above"}</div>`,s+="</div>",s}function ja(){const e=Ke;if(!e)return'<div class="protest-empty">Loading ministers...</div>';if(e.length===0)return'<div class="protest-empty">No government ministers found.</div>';let t="";for(const s of e){const v=Math.round(s.minister_approval||50),n=v>50?"high":v>=35?"mid":"low",l=re?.id===s.ministry_key,o=JSON.stringify({id:s.ministry_key,type:"minister",label:`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()||s.ministry_key,demandLabel:`${(s.minister_first_name||"")+" "+(s.minister_last_name||"")} must resign.`.trim(),grievanceData:{ministryKey:s.ministry_key,approval:v,name:`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()}}).replace(/"/g,"&quot;");t+=`<div class="protest-target${l?" selected":""}" data-protest-target="${o}">
            <div>
                <div class="protest-target__name">${$(`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()||s.ministry_key)}</div>
                <div class="protest-target__meta">${$(s.ministry_key)}</div>
            </div>
            <span class="protest-target__value protest-target__value--${n}">${v}%</span>
        </div>`}return t}function Wa(){const e=ct;if(!e)return'<div class="protest-empty">Loading active crises...</div>';if(e.length===0)return'<div class="protest-empty">No active crises in this nation.</div>';let t="";for(const s of e){const v=re?.id===s.id,n=s.crisis_templates?.name||"Unknown Crisis",l=s.crisis_templates?.description||"",o=s.duration||0,m=`The government must resolve the ${n} crisis.`,i=JSON.stringify({id:s.id,type:"activeCrisis",label:n,demandLabel:m,grievanceData:{crisisId:s.id,name:n,duration:o}}).replace(/"/g,"&quot;");t+=`<div class="protest-target${v?" selected":""}" data-protest-target="${i}">
            <div>
                <div class="protest-target__name">${$(n)}</div>
                <div class="protest-target__meta">${$(l?l.slice(0,80):"")}${o?" · "+o+"t active":""}</div>
            </div>
        </div>`}return t}function Va(e,t){const s=Ye?.failingStats;if(!s)return'<div class="protest-empty">Loading stats...</div>';if(s.length===0)return'<div class="protest-empty">No stats are bad enough to protest. Stats must be critically failing (≥70 for negative stats, ≤30 for positive stats).</div>';let v="";for(const n of s){const l=re?.id===n.key,o=ls(n.key)?"&#9650;":"&#9660;",m=JSON.stringify({id:n.key,type:"statFailure",label:n.displayName,demandLabel:`The government must address ${n.displayName}.`,grievanceData:{statKey:n.key,failureScore:n.failureScore,current:n.current}}).replace(/"/g,"&quot;");v+=`<div class="protest-target${l?" selected":""}" data-protest-target="${m}">
            <div>
                <div class="protest-target__name">${$(n.displayName)}</div>
                <div class="protest-target__meta">${Math.round(n.current)} <span class="protest-target__delta" style="color:#d9534f">${o} ${Math.abs(n.delta).toFixed(1)}</span></div>
            </div>
            <span class="protest-target__value protest-target__value--low">${n.failureScore.toFixed(1)}</span>
        </div>`}return v}function Ka(e){if(!e)return"";const t=!e.error&&e.success,s=t?"#4ade80":"#ef4444";let v=`<div class="ca-result-box" style="border-color:${s}33">`;if(v+=`<div class="ca-result-header" style="background:${s}08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:${s}">${$(e.headline||(t?"Action completed":"Action failed"))}</span>
        <span class="ca-result-dismiss" id="ca-dismiss-result">Dismiss</span>
    </div>`,v+='<div class="ca-result-body">',e.effects&&e.effects.length>0)for(const n of e.effects){const l=n.bloc||n.label||n.stat||"",o=n.value??n.delta??0,m=o>=0?"#4ade80":"#ef4444";v+=`<div class="ca-result-row">
                <span class="ca-result-label">${$(l)}</span>
                <span class="ca-result-val" style="color:${m}">${o>=0?"+":""}${o}</span>
            </div>`}if(e.blocEffects&&e.blocEffects.length>0)for(const n of e.blocEffects)v+=`<div class="ca-result-row">
                <span class="ca-result-label">${$(n.blocName)}</span>
                <span class="ca-result-val" style="color:#4ade80">+${n.delta}</span>
            </div>`;return e.outcomeName&&(v+=`<div class="ca-result-row">
            <span class="ca-result-label">Outcome</span>
            <span class="ca-result-val" style="color:${s}">${$(e.outcomeName)}</span>
        </div>`),e.demandText&&(v+=`<div class="ca-result-row">
            <span class="ca-result-label">Promise</span>
            <span class="ca-result-val" style="color:#a78bfa">${$(e.demandText)}</span>
        </div>`,e.conditions?.is_governing&&(v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-top:2px">Governing target: ±${e.conditions.delta} (higher bar)</div>`)),e.deadlineTicks&&(v+=`<div class="ca-result-row">
            <span class="ca-result-label">Deadline</span>
            <span class="ca-result-val" style="color:var(--dtext-2)">${e.deadlineTicks} ticks</span>
        </div>`),e.promiseType&&(v+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Consequences</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#4ade80">Kept: +${St.KEPT_APPROVAL} momentum</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#ef4444;margin-top:2px">Broken: ${St.BROKEN_APPROVAL} momentum</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-top:2px">While unfulfilled: −${St.PENALTY_PER_TICK_MIN} to −${St.PENALTY_PER_TICK_MAX} approval/tick</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#94a3b8;margin-top:2px">Countdown starts after next election · Opposition = extinguished</div>
        </div>`),v+="</div></div>",v}function Ya(e){const t=e.tier||0,s=ns(t).toUpperCase(),v=e.roll_breakdown||{},n=e.condition_score??e.turnout_score??0,l=v.endorsements||0,o=v.joint_bonus||0,m=e.effects_applied||[];let i='<div class="ca-result-box" style="border-color:#5cb85c33">';if(i+=`<div class="ca-result-header" style="background:#5cb85c08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#5cb85c">Protest Result — Tier ${t}</span>
    </div>`,i+='<div class="ca-result-body">',i+=`<div class="ca-result-row">
        <span class="ca-result-label">Outcome</span>
        <span class="ca-result-val" style="color:#5cb85c">${s}</span>
    </div>`,i+=`<div class="ca-result-row">
        <span class="ca-result-label">Condition Score</span>
        <span class="ca-result-val" style="color:var(--dtext-1)">${Math.round(n)}</span>
    </div>`,Object.keys(v).length>0){i+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Score Breakdown</div>`;const p=new Set(["endorsements","joint_bonus"]);for(const[_,r]of Object.entries(v)){if(p.has(_))continue;const h=_.replace(/_/g," ").replace(/\b\w/g,a=>a.toUpperCase()),x=Number(r),u=x>=0?"#4ade80":"#ef4444";i+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${$(h)}</span>
                <span class="ca-result-val" style="color:${u};font-size:10px">${x>=0?"+":""}${x.toFixed(1)}</span>
            </div>`}i+="</div>"}l>0&&(i+=`<div class="protest-endorse-breakdown">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#a78bfa;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:2px">Coalition Support</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-1)">${l} party endorsement${l>1?"s":""} — +${o} bonus</div>
        </div>`);const c=m.filter(p=>p.stat&&p.stat!=="electoral_wound");if(c.length>0){i+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Effects on Nation</div>`;for(const p of c){const _=(p.stat||"").replace(/_/g," ").replace(/\b\w/g,x=>x.toUpperCase()),r=Number(p.delta||p.value||0),h=r>=0?"#4ade80":"#ef4444";i+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${$(_)}</span>
                <span class="ca-result-val" style="color:${h};font-size:10px">${r>=0?"+":""}${r}</span>
            </div>`}i+="</div>"}return i+="</div></div>",i}function Xa(){const e=Z;let t='<div class="ca-result-box" style="border-color:rgba(217,83,79,0.3)">';if(t+=`<div class="ca-result-header" style="background:rgba(217,83,79,0.06)">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#d9534f">Protest Resolving...</span>
    </div>`,t+='<div class="ca-result-body">',t+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);line-height:1.8">
        Your protest has been called and is gathering momentum. The turnout will be determined at the next tick based on national conditions.
    </div>`,e){if(e.grievance_type){const s=e.grievance_type==="minister"?"Minister":e.grievance_type==="activeCrisis"?"Active Crisis":e.grievance_type==="activePolicy"?"Active Policy":"Stat Failure";t+=`<div class="ca-result-row" style="margin-top:8px">
                <span class="ca-result-label">Grievance</span>
                <span class="ca-result-val" style="color:#f97316">${s}</span>
            </div>`}e.demand_label&&(t+=`<div class="ca-result-row">
                <span class="ca-result-label">Demand</span>
                <span class="ca-result-val" style="color:#a78bfa">${$(e.demand_label)}</span>
            </div>`)}return t+=`<div style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);margin-top:12px;font-style:italic">
        Other opposition parties can endorse this protest during this tick to boost turnout (+15 per endorsement).
    </div>`,t+="</div></div>",t}function Ja(e,t,s,v,n,l,o,m,i){const c=()=>jt(e,t,s,v,n,l,o,m,i);e.querySelectorAll("[data-rival-id]").forEach(r=>{r.addEventListener("click",async()=>{const h=r.dataset.rivalId;if(Re===h)return;Re=h,Le=null,Ue=null,c();const x=await js(I,h,s.id,o);Ue=Ws(x),c()})}),e.querySelectorAll("[data-vector-id]").forEach(r=>{r.addEventListener("click",()=>{r.classList.contains("disabled")||(Le=Le===r.dataset.vectorId?null:r.dataset.vectorId,c())})}),e.querySelectorAll("[data-promise-type]").forEach(r=>{r.addEventListener("click",async()=>{const h=r.dataset.promiseType;if(ze=ze===h?null:h,nt=null,ke=null,c(),ze==="crisis"){const{data:x}=await I.from("active_crises").select("id, crisis_id, started_at_tick, crisis_templates(name, description)").eq("nation_id",s.id),u=document.getElementById("ca-crisis-list");if(u)if(!x||x.length===0)u.innerHTML='<div class="ca-info-box">No active crises to promise on.</div>';else{let a="";for(const g of x){const C=ke===g.id,b=g.crisis_templates?.name||"Unknown Crisis";a+=`<div class="ca-crisis-card${C?" selected":""}" data-crisis-id="${g.id}">
                                <span class="ca-crisis-name">${$(b)}</span>
                            </div>`}u.innerHTML=a,u.querySelectorAll("[data-crisis-id]").forEach(g=>{g.addEventListener("click",()=>{ke=ke===g.dataset.crisisId?null:g.dataset.crisisId,c()})})}}})}),e.querySelectorAll("[data-stat-key]").forEach(r=>{r.addEventListener("click",()=>{nt=nt===r.dataset.statKey?null:r.dataset.statKey,c()})}),e.querySelectorAll("[data-crisis-id]").forEach(r=>{r.addEventListener("click",()=>{ke=ke===r.dataset.crisisId?null:r.dataset.crisisId,c()})}),e.querySelectorAll("[data-stance-issue-id]").forEach(r=>{r.addEventListener("click",()=>{const h=r.dataset.stanceIssueId;ye===h?ye=null:ye=h,be=null,me=null,Ee="moderate";const x=he[ye];x&&x.axes.length===1&&(be=x.axes[0]),c()})}),e.querySelectorAll("[data-stance-axis-key]").forEach(r=>{r.addEventListener("click",()=>{const h=r.dataset.stanceAxisKey;be=be===h?null:h,me=null,c()})}),e.querySelectorAll("[data-stance-side-val]").forEach(r=>{r.addEventListener("click",()=>{const h=r.dataset.stanceSideVal;me=me===h?null:h,c()})}),e.querySelectorAll("[data-stance-int-val]").forEach(r=>{r.addEventListener("click",()=>{Ee=r.dataset.stanceIntVal,c()})}),W==="take_stance"&&!ot&&!We&&I.from("issue_state").select("issue_id, salience").eq("nation_id",s.id).then(({data:r})=>{ot=r||[],c()}),e.querySelectorAll("[data-axis-key]").forEach(r=>{r.addEventListener("click",()=>{const h=r.dataset.axisKey;X===h?X=null:X=h,te=null,c()})}),e.querySelectorAll("[data-direction-value]").forEach(r=>{r.addEventListener("click",()=>{const h=r.dataset.directionValue;te=te===h?null:h,c()})}),e.querySelectorAll("[data-grassroots-demo]").forEach(r=>{r.addEventListener("click",()=>{r.dataset.grassrootsDemo,c()})}),e.querySelectorAll("[data-grassroots-band]").forEach(r=>{r.addEventListener("click",()=>{r.dataset.grassrootsBand,c()})});const p=e.querySelector("#ca-dismiss-result");p&&p.addEventListener("click",()=>{We=null,c()}),W==="protest"&&!We&&!Ke&&!ht&&(ht=!0,Fa(s,t,o).then(()=>{ht=!1,c()}).catch(r=>{console.error("[Protest] loadProtestData failed:",r),ht=!1,Ke=Ke||[],ct=ct||[],Ye=Ye||{failingStats:[],_fatigueLevel:{label:"—",color:"#4a4840"}},c()})),e.querySelectorAll("[data-protest-tab]").forEach(r=>{r.addEventListener("click",()=>{tt=r.dataset.protestTab,re=null,c()})}),e.querySelectorAll("[data-protest-target]").forEach(r=>{r.addEventListener("click",()=>{const h=r.dataset.protestTarget;try{const x=JSON.parse(h);re=re?.id===x.id?null:x}catch{re=null}c()})});const _=e.querySelector("#ca-confirm-btn");_&&_.addEventListener("click",()=>{_.classList.contains("disabled")||(_.classList.add("disabled"),Za(e,t,s,v,n,l,o))})}let Rt=!1;window._protestEndorse=async function(){if(!Rt&&!(!Ve||rt)&&confirm("Endorse this protest? Costs 1 AP and boosts turnout (+15).")){Rt=!0;try{const e=await na(I,V.id,dt.id,Ve.id,ne.current_tick);if(!e.success){ee(e.error||"Endorsement failed.");return}rt=!0,V.action_points=Math.max(0,(V.action_points||0)-1);const t=await Be(V.id);t!==void 0&&(V.action_points=t),await vt(dt,V,ne,Xe)}catch(e){console.error("[Protest] Endorse failed:",e),ee("Endorsement failed: "+e.message)}finally{Rt=!1}}};let zt=!1;window._protestCallOff=async function(){if(!zt&&Z){if(Z.tier===7){ee("Tier 7 protests cannot be called off.");return}if(confirm("Call off this protest? Costs "+je.CALL_OFF_AP+" AP. A small approval boost from moderate blocs will be applied.")){zt=!0;try{const e=await la(I,V.id,Z.id,ne.current_tick);if(!e.success){ee(e.error||"Call-off failed.");return}V.action_points=Math.max(0,(V.action_points||0)-je.CALL_OFF_AP);const t=await Be(V.id);t!==void 0&&(V.action_points=t),await vt(dt,V,ne,Xe)}catch(e){console.error("[Protest] Call-off failed:",e),ee("Call-off failed: "+e.message)}finally{zt=!1}}}};async function Za(e,t,s,v,n,l,o){const m=Lt.find(r=>r.id===W)||(W==="protest"?{id:"protest",name:"Organise a Protest",ap:Ht(),color:"#d9534f"}:null);if(!m)return;const i=Ht();if(v<i||!vs())return;const c=document.getElementById("ca-confirm-btn");c&&(c.classList.add("disabled"),c.textContent="EXECUTING...");let p;try{if(m.id==="rally")p=await Vs(I,t.id,s.id,null,o);else if(m.id==="attack")p=await Ks(I,t.id,s.id,Re,Le,o);else if(m.id==="promise"){const r=ze==="stat"?{statKey:nt}:{crisisId:ke};p=await Ys(I,t.id,s.id,o,ze,r)}else if(m.id==="protest"){if(!re)return;const r=re.grievanceData||{},h=re.demandLabel||"";p=await ra(I,t.id,s.id,re.type,r,h,o)}else if(m.id==="take_stance")p=await Gt(I,t.id,s.id,ye,be,me,Ee,o);else if(m.id==="poll_now")p=await Xs(I,t.id,s.id,o,Se);else if(m.id==="fund_think_tank")p=await Js(I,t.id,s.id,X,te,o);else if(m.id==="media_campaign")p=await Zs(I,t.id,s.id,X,te,o);else if(m.id==="grassroots_movement")p=await Qs(I,t.id,s.id,X,te,o);else if(m.id==="press_conference"){const{deductAP:r}=await kt(async()=>{const{deductAP:a}=await import("./config-BIsh65GI.js");return{deductAP:a}},[]),{getTraitAPModifier:h}=await kt(async()=>{const{getTraitAPModifier:a}=await import("./elections-Whph76B_.js").then(g=>g.a8);return{getTraitAPModifier:a}},__vite__mapDeps([0,1,2,3,4,5])),x=Math.max(1,1+(lt||0)+h("press_conference",t,o)),u=await r(I,t.id,x,{reason:"press_conference",detail:"Press Conference",tick:o});if(!u.success)p={success:!1,error:u.error||"Insufficient AP"};else{let a=Math.floor(Math.random()*5)-2;if(Oe?(s.gov_approval||0)>=40&&(a+=2):a+=1,(lt||0)>0&&a!==0){const b=a>0?1:-1,A=Math.max(.25,1-lt*.25);a=Math.round(a*A),a===0&&(a=b)}const g=a>=0?"+":"",{error:C}=await I.rpc("adjust_momentum",{p_faction_id:t.id,p_delta:a,p_label:`Press Conference (${g}${a})`,p_tick:o});C&&console.warn("[PressConference] Momentum RPC failed:",C.message),await I.from("campaign_actions").insert({party_id:t.id,nation_id:s.id,action_type:"press_conference",ap_cost:x,tick_performed:o,result:{momentumDelta:a}}),p={success:!0,newAp:u.newAp,headline:"Press Conference",effects:[{label:"Press Coverage",value:`${g}${a}`}],outcomeName:`Press conference — ${g}${a} momentum`}}}else if(m.id==="outreach"){const{deductAP:r}=await kt(async()=>{const{deductAP:a}=await import("./config-BIsh65GI.js");return{deductAP:a}},[]),{getTraitAPModifier:h}=await kt(async()=>{const{getTraitAPModifier:a}=await import("./elections-Whph76B_.js").then(g=>g.a8);return{getTraitAPModifier:a}},__vite__mapDeps([0,1,2,3,4,5])),x=Math.max(1,3+(At||0)+h("outreach",t,o)),u=await r(I,t.id,x,{reason:"outreach",detail:"Community Outreach",tick:o});if(!u.success)p={success:!1,error:u.error||"Insufficient AP"};else{const{data:a}=await I.from("faction_electoral_standing").select("id, platform_appeal").eq("faction_id",t.id).eq("nation_id",s.id).maybeSingle();if(a){const g=Math.min(100,(Number(a.platform_appeal)||0)+3);await I.from("faction_electoral_standing").update({platform_appeal:g}).eq("id",a.id)}await I.from("campaign_actions").insert({party_id:t.id,nation_id:s.id,action_type:"outreach",ap_cost:x,tick_performed:o,result:{appealBoost:3}}),p={success:!0,newAp:u.newAp,headline:"Community Outreach",effects:[{label:"Appeal",value:"+3"}],outcomeName:"Community outreach — +3 platform appeal"}}}else if(m.id==="pivot"&&(p=await ea(I,t.id,s.id,X,te,o),p.success)){const{data:r}=await I.from("factions").select("pivot_count, pivot_last_tick, pivot_cycle_start_tick").eq("id",t.id).single();r&&(t.pivot_count=r.pivot_count,t.pivot_last_tick=r.pivot_last_tick,t.pivot_cycle_start_tick=r.pivot_cycle_start_tick),pt=null}}catch(r){console.error("Campaign action error:",r),ee("Action failed: "+r.message),c&&(c.classList.remove("disabled"),c.textContent=`Confirm — ${i} AP`);return}if(!p||!p.success){ee(p?.message||p?.error||"Action failed."),c&&(c.classList.remove("disabled"),c.textContent=`Confirm — ${i} AP`);return}t.action_points=p.newAp??(t.action_points??0)-i;const _=await Be(t.id);if(_!==void 0&&(t.action_points=_),We=p,await vt(s,t,ne,Xe),m.id==="take_stance"){Nt(t.id,s.id);const r=document.getElementById("ca-stance-portfolio-container");r&&(r.querySelector(".sp-card")?.remove(),Tt(r,t,s))}}const $e=[{key:"security_freedom",blocKey:"axis_security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",blocKey:"axis_tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"individualism_collectivism",blocKey:"axis_individualism_collectivism",leftLabel:"Individualism",rightLabel:"Collectivism"},{key:"globalism_nationalism",blocKey:"axis_globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"liberty_equality",blocKey:"axis_liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"}],Qa=15,eo=25;async function to(e,t,s,v,n){const l=document.getElementById("electorate-spread-container");if(!l)return;const{data:o}=await I.from("electorate_profile").select("*").eq("nation_id",t.id).maybeSingle();if(!o){l.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No electorate data available.</div>';return}const m={};for(const d of v||[])m[d.faction_id]=d;const i=Number(t.polarization??50),c=Number(t.stability??50),p=Number(t.ethnic_diversity??50),r=5+Math.min(100,Math.max(0,i*.9+(100-c)*.07+p*.03))/100*40,h={};for(const d of $e){const k=Number(o["ideo_mean_"+d.key]??50);h[d.key]={mean:k,zoneVariance:r}}const x=(s||[]).map(d=>{const k=m[d.id]||{},S=d.id===e.id;return{id:d.id,abbr:d.abbreviation||"??",color:d.party_color||"#888",isPlayer:S,ideology:{security_freedom:Number(k.security_freedom??0),tradition_progress:Number(k.tradition_progress??0),liberty_equality:Number(k.liberty_equality??0),globalism_nationalism:Number(k.globalism_nationalism??0),individualism_collectivism:Number(k.individualism_collectivism??0)}}}),u=m[e.id]||{},a={},g=x.filter(d=>!d.isPlayer);for(const d of g)a[d.id]=!0;let C=0;function b(d){const S=(Number(u[d]??0)+100)/2,w=h[d].mean,y=Math.abs(S-w);return y<=Qa?{cls:"es-match-yes",label:"✓ Aligned",gap:y}:y<=eo?{cls:"es-match-part",label:"~ Partial",gap:y}:{cls:"es-match-no",label:"✗ Misaligned",gap:y}}for(const d of $e){const k=b(d.key);k.cls==="es-match-yes"||k.cls,C+=Math.max(0,100-k.gap)}Math.round(C/$e.length);function A(){let d="";for(let f=0;f<$e.length;f++){const E=$e[f],L=h[E.key],O=b(E.key),R=L.mean,N=L.zoneVariance,P=Math.max(0,R-N),T=Math.min(100,R+N)-P,q=i>=76?"deeply divided":i>=51?"polarized":i>=26?"moderately divided":"near centrist";let M;R<45?M=`Electorate is <strong>${q}</strong>, leans ${$(E.leftLabel)} — mean ${Math.round(R)} / 100`:R>55?M=`Electorate is <strong>${q}</strong>, leans ${$(E.rightLabel)} — mean ${Math.round(R)} / 100`:M=`Electorate is <strong>${q}</strong> — mean ${Math.round(R)} / 100`;let B="";for(let j=0;j<x.length;j++){const F=x[j],Te=(F.ideology[E.key]+100)/2,ve=j%2===0?"":"es-below",G=!F.isPlayer&&!a[F.id]?"es-hidden":"";F.isPlayer?B+=`
                    <div class="es-pm ${G}" data-es-party="${F.id}" style="left:${Te}%">
                        <div class="es-pm-bar" style="background:${F.color}"></div>
                        <div class="es-pm-ring" style="border-color:${F.color}"></div>
                        <div class="es-pm-dot" style="background:${F.color}"></div>
                        <div class="es-pm-label" style="color:${F.color}">${$(F.abbr)}</div>
                    </div>`:B+=`
                    <div class="es-pm ${G}" data-es-party="${F.id}" style="left:${Te}%">
                        <div class="es-pm-bar" style="background:${F.color}"></div>
                        <div class="es-pm-dot" style="background:${F.color}"></div>
                        <div class="es-pm-label ${ve}" style="color:${F.color}">${$(F.abbr)}</div>
                    </div>`}let U="";if(O.cls==="es-match-no"){const j=(Number(u[E.key]??0)+100)/2,F=Math.min(j,R),xe=Math.abs(j-R);U=`<div class="es-gap" style="left:${F}%;width:${xe}%">
                    <div class="es-gap-label">${Math.round(O.gap)}pt gap</div>
                </div>`}const{zones:z,zoneForPos:H}=os(R,L.zoneVariance);let Y="";const ce={"radical-left":"rgba(239,68,68,0.10)","moderate-left":"rgba(251,191,36,0.07)",centrist:"rgba(74,222,128,0.08)","moderate-right":"rgba(251,191,36,0.07)","radical-right":"rgba(239,68,68,0.10)"},de={"radical-left":"rgba(239,68,68,0.25)","moderate-left":"rgba(251,191,36,0.18)",centrist:"rgba(74,222,128,0.22)","moderate-right":"rgba(251,191,36,0.18)","radical-right":"rgba(239,68,68,0.25)"},pe={"radical-left":"rgba(239,68,68,0.50)","moderate-left":"rgba(251,191,36,0.45)",centrist:"rgba(74,222,128,0.50)","moderate-right":"rgba(251,191,36,0.45)","radical-right":"rgba(239,68,68,0.50)"},Ae=P+T;for(const j of z){if(j.width<1)continue;const F=Math.max(j.left,P),xe=Math.min(j.left+j.width,Ae);if(xe<=F)continue;const Te=(F-P)/T*100,ve=(xe-F)/T*100,G=ve>8;Y+=`<div class="es-zone" style="left:${Te}%;width:${ve}%;background:${ce[j.id]};border-left:1px solid ${de[j.id]};border-right:1px solid ${de[j.id]}">
                    ${G?`<span class="es-zone-label" style="color:${pe[j.id]}">${j.label}</span>`:""}
                </div>`}const Ie=(Number(u[E.key]??0)+100)/2,Pe=H(Ie),mt=z.find(j=>j.id===Pe)?.label||"",Je=[];for(const j of x){if(j.isPlayer)continue;const F=(j.ideology[E.key]+100)/2;H(F)===Pe&&Je.push(j)}let De=mt;Pe.endsWith("-left")?De+=" "+E.leftLabel:Pe.endsWith("-right")&&(De+=" "+E.rightLabel);let ft="";if(Je.length>0){const j=Je.map(F=>`<strong style="color:${F.color}">${$(F.abbr)}</strong>`).join(" and ");ft=`<div class="es-split-note">You are <strong>${$(De)}</strong> and currently splitting votes with ${j}</div>`}else ft=`<div class="es-split-note es-split-clear">You are <strong>${$(De)}</strong> — no parties competing in your zone</div>`;const ut=f===$e.length-1;d+=`
            <div class="es-axis-block">
                <div class="es-axis-header">
                    <div class="es-axis-info">
                        <div class="es-axis-name">${$(E.leftLabel)} / ${$(E.rightLabel)}</div>
                        <div class="es-axis-read">${M}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span class="es-zone-badge" data-zone="${Pe}">${mt}</span>
                        <div class="es-match ${O.cls}">${O.label}</div>
                    </div>
                </div>
                <div class="es-spectrum">
                    <div class="es-pole-row">
                        <span class="es-pole">${$(E.leftLabel)}</span>
                        <span class="es-pole">${$(E.rightLabel)}</span>
                    </div>
                    <div class="es-track">
                        <div class="es-center"><div class="es-center-label">Center</div></div>
                        <div class="es-variance" style="left:${P}%;width:${T}%">${Y}</div>
                        <div class="es-emean" style="left:${R}%"><div class="es-emean-label">Electorate</div></div>
                        ${U}
                        ${B}
                    </div>
                </div>
                ${ft}
            </div>
            ${ut?"":'<div class="es-div"></div>'}`}const k=x.find(f=>f.isPlayer);let S="";if(k){const f=Ce(k.color,.1),E=Ce(k.color,.25);S+=`<div class="es-leg-pill" style="color:${k.color};background:${f};border-color:${E}">
                <div class="es-leg-dot" style="background:${k.color}"></div>${$(k.abbr)} <span style="opacity:.55;font-size:7px">YOU</span>
            </div>`}for(const f of g){const E=Ce(f.color,.1),L=Ce(f.color,.25),O=a[f.id]?"":"es-dimmed";S+=`<div class="es-leg-pill ${O}" data-es-toggle="${f.id}" style="color:${f.color};background:${E};border-color:${L}">
                <div class="es-leg-dot" style="background:${f.color}"></div>${$(f.abbr)}
            </div>`}const w=[];if(i>=65){const f=i>=85?"High":"Elevated";w.push({label:`${f} Polarization`,stat:Math.round(i),color:"var(--dred)",note:"pushing the electorate to the fringes"})}if(c<=35){const f=c<=15?"Very low":"Low";w.push({label:`${f} Stability`,stat:Math.round(c),color:"var(--damber)",note:"pushing the electorate to the fringes"})}p>=65&&w.push({label:"High Ethnic Diversity",stat:Math.round(p),color:"var(--dteal)",note:"widening ideological divisions"}),i<=25&&c>=65&&w.push({label:"Stable & United",stat:null,color:"var(--dgreen)",note:"electorate is ideologically consolidated"});let y="";if(w.length>0){y='<div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 16px;border-bottom:1px solid var(--dborder-hair)">';for(const f of w)y+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:${f.color};display:flex;align-items:center;gap:4px">`,y+=`<span style="font-weight:700">${f.label}</span>`,f.stat!==null&&(y+=`<span style="opacity:0.6">(${f.stat})</span>`),y+=`<span style="color:var(--dtext-3)">— ${f.note}</span>`,y+="</div>";y+="</div>"}l.innerHTML=`
        <div class="es-page-label">Electorate Ideology Spread — <span class="es-nation">${$(t.name)}</span> · Tick ${n}</div>
        <div class="es-outer">
            <div class="es-hdr">
                <div class="es-hdr-left">
                    <div class="es-hdr-dot"></div>
                    <span class="es-hdr-title">Electorate Ideology Spread</span>
                </div>
                <div class="es-legend" id="es-legend">${S}</div>
            </div>
            ${y}
            <div class="es-body">${d}</div>
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
                        <circle cx="8" cy="8" r="5" fill="${k?k.color:"#9b7ec8"}"/>
                        <circle cx="8" cy="8" r="8" fill="none" stroke="${k?k.color:"#9b7ec8"}" stroke-width="1.5" opacity="0.55"/>
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
        </div>`,l.querySelectorAll("[data-es-toggle]").forEach(f=>{f.addEventListener("click",()=>{const E=f.getAttribute("data-es-toggle");a[E]=!a[E],f.classList.toggle("es-dimmed",!a[E]),l.querySelectorAll(`[data-es-party="${E}"]`).forEach(L=>{L.classList.toggle("es-hidden",!a[E])})})})}A()}async function Tt(e,t,s){const[v,n,l]=await Promise.all([I.from("faction_issue_stance").select("*").eq("faction_id",t.id).eq("nation_id",s.id),I.from("issue_state").select("issue_id, salience, owned_by, pioneer_faction_id").eq("nation_id",s.id),I.from("shard").select("current_tick").eq("name","Alpha Shard").single()]);v.error&&console.error("[Politics] Failed to load stances:",v.error.message),n.error&&console.error("[Politics] Failed to load issue states:",n.error.message);const o=v.data||[],m=n.data||[],i=l.data?.current_tick||0,c={};for(const u of m)c[u.issue_id]=u;const p=ie.MAX_STANCES,_=o.length>=p;let r="";if(o.length===0)r='<div class="sp-empty">No active stances. Take a stance on an issue to build platform appeal.</div>';else for(const u of o){const a=he[u.issue_id];if(!a)continue;const g=ae.find(N=>N.key===u.axis),C=u.side==="left"?g?.leftLabel:g?.rightLabel,b=u.side==="left"?g?.leftColor:g?.rightColor,A=Number(u.strength??0),d=Number(u.decay_rate??0),k=Number(u.ticks_held??0),S=A<=40,w=A<=20,y=w?"var(--dred)":S?"var(--damber)":"var(--dgreen)",f=c[u.issue_id],E=Number(f?.salience??30),L=u.ideologically_consistent?"":'<span class="sp-badge sp-badge--warn">INCONSISTENT</span>',O=u.is_pioneer?'<span class="sp-badge sp-badge--good">PIONEER</span>':"",R=S?`<span class="sp-badge sp-badge--fade">${w?"EXPIRING":"FADING"}</span>`:"";r+=`
            <div class="sp-row" data-stance-issue="${u.issue_id}">
                <div class="sp-row-top">
                    <div class="sp-row-left">
                        <span class="sp-issue-name">${$(a.label)}</span>
                        <span class="sp-side-pill" style="color:${b};border-color:${b}">${u.intensity} ${C}</span>
                        ${O}${L}${R}
                    </div>
                    <div class="sp-row-right">
                        <span class="sp-salience" title="Issue salience">Salience: ${E.toFixed(0)}</span>
                        <span class="sp-ticks">Held ${k} ticks</span>
                    </div>
                </div>
                <div class="sp-bar-row">
                    <div class="sp-bar-track">
                        <div class="sp-bar-fill" style="width:${A}%;background:${y}"></div>
                    </div>
                    <span class="sp-str-val" style="color:${y}">${A.toFixed(0)}</span>
                    <span class="sp-decay" style="color:var(--dred)">-${d}/tick</span>
                </div>
                <div class="sp-row-actions">
                    <button class="sp-btn sp-btn--reinforce" data-stance-action="reinforce" data-stance-issue="${u.issue_id}" data-stance-axis="${u.axis}" data-stance-side="${u.side}" data-stance-intensity="${u.intensity}">Reinforce</button>
                    <button class="sp-btn sp-btn--modify" data-stance-action="modify" data-stance-issue="${u.issue_id}">Modify</button>
                </div>
            </div>`}const h=`
    <div class="sp-card" style="margin-top:20px;max-width:780px;">
        <div class="sp-card-header">
            <div class="sp-card-title">Active Stance Portfolio</div>
            <div class="sp-card-count">${o.length} / ${p}</div>
        </div>
        <div class="sp-stances">${r}</div>
        <div class="sp-footer">
            <button class="sp-btn sp-btn--new${_?" sp-btn--disabled":""}" id="sp-new-stance-btn" ${_?'disabled title="Maximum stances reached (5/5)"':""}>
                + New Stance${_?" (5/5)":""}
            </button>
            <span class="sp-footer-hint">${ie.AP_COST} AP · ${ie.COOLDOWN_WINDOW}-tick cooldown</span>
        </div>
    </div>`;e.insertAdjacentHTML("beforeend",h),e.querySelectorAll('[data-stance-action="reinforce"]').forEach(u=>{u.addEventListener("click",async()=>{if((t.action_points||0)<ie.AP_COST){ee(`Need ${ie.AP_COST} AP to reinforce stance.`);return}const a=u.dataset.stanceIssue,g=u.dataset.stanceAxis,C=u.dataset.stanceSide,b=u.dataset.stanceIntensity;u.disabled=!0,u.textContent="Reinforcing...";try{const A=await Gt(I,t.id,s.id,a,g,C,b,i);if(A.success){A.newAp!=null&&(t.action_points=A.newAp,V&&(V.action_points=A.newAp));const d=await Be(t.id);d!==void 0&&(t.action_points=d,V&&(V.action_points=d)),e.querySelector(".sp-card")?.remove(),await Tt(e,t,s),Nt(t.id,s.id)}else ee(A.message||"Failed to reinforce stance."),u.disabled=!1,u.textContent="Reinforce"}catch(A){ee("Reinforce failed: "+A.message),u.disabled=!1,u.textContent="Reinforce"}})}),e.querySelectorAll('[data-stance-action="modify"]').forEach(u=>{u.addEventListener("click",()=>{Qt(t,s,i,c,o,u.dataset.stanceIssue)})});const x=document.getElementById("sp-new-stance-btn");x&&!_&&x.addEventListener("click",()=>{Qt(t,s,i,c,o,null)})}function Qt(e,t,s,v,n,l){document.getElementById("stance-modal-overlay")?.remove();const o=new Set(n.map(a=>a.issue_id)),m=n.length>=ie.MAX_STANCES,i=ss.map(a=>({id:a,def:he[a],salience:Number(v[a]?.salience??30),hasStance:o.has(a)})).sort((a,g)=>g.salience-a.salience);let c="";for(const a of i){const g=!a.hasStance&&m,C=a.id===l,b=a.salience>=60?"var(--dred)":a.salience>=40?"var(--damber)":"var(--dtext-3)",A=a.def.axes.map(d=>{const k=ae.find(S=>S.key===d);return k?`${k.leftLabel}/${k.rightLabel}`:d}).join(", ");c+=`
        <div class="sm-issue${C?" sm-issue--selected":""}${g?" sm-issue--disabled":""}"
             data-sm-issue="${a.id}" ${g?"":'role="button" tabindex="0"'}>
            <div class="sm-issue-top">
                <span class="sm-issue-name">${$(a.def.label)}</span>
                ${a.hasStance?'<span class="sm-issue-badge">HAS STANCE</span>':""}
            </div>
            <div class="sm-issue-meta">
                <span class="sm-issue-salience" style="color:${b}">Salience: ${a.salience.toFixed(0)}</span>
                <span class="sm-issue-axes">${A}</span>
            </div>
        </div>`}const p=`
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
                <button class="sp-btn sp-btn--new" id="sm-confirm-btn" disabled>Confirm Stance (${ie.AP_COST} AP)</button>
            </div>
        </div>
    </div>`;document.body.insertAdjacentHTML("beforeend",p);let _=l,r=null,h=null,x="moderate";function u(){const a=document.getElementById("sm-config-area"),g=document.getElementById("sm-footer");if(!a||!_){a&&(a.innerHTML=""),g&&(g.style.display="none");return}const C=he[_];if(!C)return;C.axes.length===1&&!r&&(r=C.axes[0]);let b='<div class="sm-section-label" style="margin-top:14px;">Choose Axis</div><div class="sm-axis-list">';for(const w of C.axes){const y=ae.find(E=>E.key===w);if(!y)continue;b+=`<div class="sm-axis-opt${w===r?" sm-axis-opt--selected":""}" data-sm-axis="${w}">
                <span style="color:${y.leftColor}">${y.leftLabel}</span> / <span style="color:${y.rightColor}">${y.rightLabel}</span>
            </div>`}b+="</div>";let A="";if(r){const w=ae.find(y=>y.key===r);A=`<div class="sm-section-label" style="margin-top:14px;">Choose Side</div><div class="sm-side-list">
                <div class="sm-side-opt${h==="left"?" sm-side-opt--selected":""}" data-sm-side="left" style="border-color:${w.leftColor}">
                    <span style="color:${w.leftColor};font-weight:700">${w.leftLabel}</span>
                </div>
                <div class="sm-side-opt${h==="right"?" sm-side-opt--selected":""}" data-sm-side="right" style="border-color:${w.rightColor}">
                    <span style="color:${w.rightColor};font-weight:700">${w.rightLabel}</span>
                </div>
            </div>`}let d="";if(h){const w=ae.find(E=>E.key===r),y=h==="left"?w?.leftLabel??"Left":w?.rightLabel??"Right",f=h==="left"?w?.leftColor??"#ccc":w?.rightColor??"#ccc";d='<div class="sm-section-label" style="margin-top:14px;">Intensity</div><div class="sm-intensity-list">';for(const[E,L]of Object.entries(ie.INTENSITY))d+=`<div class="sm-int-opt${E===x?" sm-int-opt--selected":""}" data-sm-intensity="${E}">
                    <span class="sm-int-name">${E}</span>
                    <span class="sm-int-meta">Strength ${L.strength} · Decay ${L.decay_rate}/tick</span>
                    <span class="sm-int-meta" style="color:${f};font-weight:600">+${L.ideology_shift} ${y}</span>
                </div>`;if(d+="</div>",x){const E=ie.INTENSITY[x],L=he[_];d+=`<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                    <div style="color:var(--dtext-1);font-weight:600;margin-bottom:3px">${x.toUpperCase()} ${y.toUpperCase()} on ${L?.label||""}</div>
                    <div style="color:${f};font-weight:700">Ideology: +${E.ideology_shift} ${y}</div>
                    <div style="color:var(--dtext-3);margin-top:2px">Strength: ${E.strength} · Decay: -${E.decay_rate}/tick</div>
                </div>`}}a.innerHTML=b+A+d;const k=_&&r&&h&&x;g.style.display=k?"flex":"none";const S=document.getElementById("sm-confirm-btn");S&&(S.disabled=!k),a.querySelectorAll("[data-sm-axis]").forEach(w=>{w.addEventListener("click",()=>{r=w.dataset.smAxis,h=null,u()})}),a.querySelectorAll("[data-sm-side]").forEach(w=>{w.addEventListener("click",()=>{h=w.dataset.smSide,u()})}),a.querySelectorAll("[data-sm-intensity]").forEach(w=>{w.addEventListener("click",()=>{x=w.dataset.smIntensity,u()})})}document.querySelectorAll("[data-sm-issue]").forEach(a=>{a.classList.contains("sm-issue--disabled")||a.addEventListener("click",()=>{document.querySelectorAll(".sm-issue").forEach(g=>g.classList.remove("sm-issue--selected")),a.classList.add("sm-issue--selected"),_=a.dataset.smIssue,r=null,h=null,u()})}),document.getElementById("sm-close-btn")?.addEventListener("click",()=>{document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("stance-modal-overlay")?.addEventListener("click",a=>{a.target.id==="stance-modal-overlay"&&document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("sm-confirm-btn")?.addEventListener("click",async()=>{const a=document.getElementById("sm-confirm-btn");if(!a||a.disabled)return;a.disabled=!0,a.textContent="Taking stance...";const g=await Gt(I,e.id,t.id,_,r,h,x,s);if(g.success){g.newAp!=null&&(e.action_points=g.newAp,V&&(V.action_points=g.newAp));const C=await Be(e.id);C!==void 0&&(e.action_points=C,V&&(V.action_points=C)),document.getElementById("stance-modal-overlay")?.remove();const b=document.getElementById("electorate-spread-container");b&&(b.querySelector(".sp-card")?.remove(),await Tt(b,e,t)),Nt(e.id,t.id)}else ee(g.message||"Failed to take stance."),a.disabled=!1,a.textContent=`Confirm Stance (${ie.AP_COST} AP)`}),l&&u()}async function Nt(e,t){const s=document.getElementById("stance-summary-strip");if(!s)return;const{data:v}=await I.from("faction_issue_stance").select("issue_id, axis, side, intensity, strength, decay_rate, ticks_held, is_pioneer, ideologically_consistent").eq("faction_id",e).eq("nation_id",t),n=ie.MAX_STANCES;if(!v||v.length===0){s.innerHTML=`<div style="color:var(--dtext-3);font-size:12px;font-family:var(--dfont-ui);padding:4px 0;">
            No active stances. Take a stance in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab.
        </div>`;return}let l="";for(const o of v){const m=he[o.issue_id];if(!m)continue;const i=ae.find(A=>A.key===o.axis),c=o.side==="left"?i?.leftLabel:i?.rightLabel,p=o.side==="left"?i?.leftColor:i?.rightColor,_=Number(o.strength??0),r=Number(o.decay_rate??0),h=Number(o.ticks_held??0),x=_<=20,u=_<=40,a=x?"var(--dred)":u?"var(--damber)":"var(--dgreen)",g=o.is_pioneer?'<span style="font-size:9px;color:#4ade80;font-weight:700;margin-left:4px">PIONEER</span>':"",C=o.ideologically_consistent===!1?'<span style="font-size:9px;color:#f97316;font-weight:700;margin-left:4px">INCONSISTENT</span>':"",b=u?`<span style="font-size:9px;color:${a};font-weight:700;margin-left:4px">${x?"EXPIRING":"FADING"}</span>`:"";l+=`
        <div style="padding:6px 0;${l?"border-top:1px solid var(--dborder-0);":""}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:2px">
                    <span style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${$(m.label)}</span>
                    <span style="font-size:10px;padding:1px 5px;border:1px solid ${p};border-radius:3px;color:${p};margin-left:4px">${o.intensity} ${c}</span>
                    ${g}${C}${b}
                </div>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3)">Held ${h}t</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;height:6px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">
                    <div style="width:${_}%;height:100%;background:${a};border-radius:2px"></div>
                </div>
                <span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${a};width:28px;text-align:right">${_.toFixed(0)}</span>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);width:40px;text-align:right">-${r}/t</span>
            </div>
        </div>`}s.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-family:var(--dfont-mono);font-size:11px;color:var(--dtext-2)">${v.length} / ${n}</span>
        </div>
        ${l}
        <div style="margin-top:8px;font-size:10px;color:var(--dtext-3);font-family:var(--dfont-ui)">Manage stances in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab</div>`}const so=[{key:"security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"},{key:"globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"individualism_collectivism",leftLabel:"Individual",rightLabel:"Collectivism"}];async function ao(e,t,s,v,n,l,o){const m=document.getElementById("other-parties-container");if(!m)return;const i=(s||[]).filter(d=>d.id!==e.id),c=i.map(d=>d.id);if(i.length===0){m.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No rival parties found.</div>';return}const p={};for(const d of v||[])p[d.faction_id]=d;const{data:_}=await I.from("administrations").select("stats_at_start, started_at_tick").eq("nation_id",t.id).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle();let r=0;if(_?.stats_at_start){let d=0,k=0;for(const y of cs){const f=ds(y);if(f===0)continue;const E=Number(_.stats_at_start[y]??0),O=Number(t[y]??0)-E;O!==0&&(d+=O*f,k++)}k>0&&(r=d/k);const S=o-(_.started_at_tick||o),w=Math.floor(S/12);r>0&&(r*=Math.pow(.95,w))}const{data:h}=await I.from("factions").select("id, leader_first_name, leader_last_name, leader_age, founded_tick, ideology_value_1, ideology_value_2").in("id",c),x={};for(const d of h||[])x[d.id]=d;const u=n&&n.party_ids?n.party_ids:[],a=n?n.lead_party_id:null,g=i.map(d=>{const k=x[d.id]||{},S=p[d.id]||{},w=k.leader_first_name&&k.leader_last_name?k.leader_first_name+" "+k.leader_last_name:"Vacant",y=k.leader_age||null,f=Number(d.national_vote_share||0);let E="opposition";u.includes(d.id)&&(E=d.id===a?"governing_head":"governing_junior");const L=E.startsWith("governing"),O=Math.round((L?r:-r)*10);return{id:d.id,name:d.faction_name||"Unknown",abbreviation:d.abbreviation||"??",color:d.party_color||"#888",customLogoUrl:d.custom_logo_url||null,partyLogo:d.party_logo||null,description:d.party_description||"",status:E,foundedTick:k.founded_tick,leaderName:w,leaderAge:y,seats:d.seats||0,totalSeats:l,voteShare:f,govScore:O,ideology:{security_freedom:S.security_freedom??0,tradition_progress:S.tradition_progress??0,liberty_equality:S.liberty_equality??0,globalism_nationalism:S.globalism_nationalism??0,individualism_collectivism:S.individualism_collectivism??0},stances:[]}});let C="seats";const b={seats:(d,k)=>k.seats-d.seats,vote_share:(d,k)=>k.voteShare-d.voteShare,approval:(d,k)=>k.govScore-d.govScore,alignment:(d,k)=>{const S=Object.values(d.ideology).reduce((y,f)=>y+Math.abs(f),0);return Object.values(k.ideology).reduce((y,f)=>y+Math.abs(f),0)-S}};function A(){const k=[...g].sort(b[C]).map(S=>oo(S)).join("");m.innerHTML=`
        <div class="op-top">
            <div class="op-top-left">
                <div class="op-title">Rival Parties — ${$(t.name)}</div>
                <div class="op-note">Stance data based on observable actions. Ideology positions may be estimated.</div>
            </div>
            <div class="op-sort-row">
                <span class="op-sort-label">Sort by</span>
                <button class="op-sort-btn${C==="seats"?" active":""}" data-op-sort="seats">Seats</button>
                <button class="op-sort-btn${C==="vote_share"?" active":""}" data-op-sort="vote_share">Vote Share</button>
                <button class="op-sort-btn${C==="alignment"?" active":""}" data-op-sort="alignment">Alignment</button>
            </div>
        </div>
        <div class="op-grid">${k}</div>`,m.querySelectorAll(".op-sort-btn").forEach(S=>{S.addEventListener("click",()=>{C=S.getAttribute("data-op-sort"),A()})})}A()}function oo(e,t){const s=e.color,v=Ce(s,.12),n=Ce(s,.35),l=Ce(s,.5),o=Ce(s,.2),m=Ce(s,.06),i=qt({customLogoUrl:e.customLogoUrl,iconKey:e.partyLogo,size:32,color:s});let c,p;e.status==="governing_head"?(c="GOVERNING — HEAD",p="op-badge-green"):e.status==="governing_junior"?(c="GOVERNING — JUNIOR",p="op-badge-green"):(c="OPPOSITION",p="op-badge-red");const _=e.foundedTick!=null?we(e.foundedTick):null,r=_?`<span class="op-badge op-badge-party" style="color:${s};border-color:${n};font-size:12px">Est. ${$(_)}</span>`:"",h=`<span class="op-badge op-badge-party" style="color:${s};border-color:${n};font-size:12px">Leader: ${$(e.leaderName)}${e.leaderAge?" ("+e.leaderAge+")":""}</span>`,x=e.description?`<div class="op-desc" style="font-size:13px;line-height:1.6">${$(e.description)}</div>`:"",u=e.govScore>2?"var(--dgreen)":e.govScore>0||e.govScore>-2?"var(--damber)":"var(--dred)",a=e.govScore>0?"+":"",g=e.status.startsWith("governing")?"GOV":"OPP";let C="";for(const y of so){const f=e.ideology[y.key]??0,E=(f+100)/2;let L;f>0?L=`left:50%;width:${f/2}%;background:${l}`:f<0?L=`right:50%;width:${Math.abs(f)/2}%;background:${l}`:L=`left:50%;width:0%;background:${l}`,C+=`
        <div class="op-axis">
            <div class="op-axis-poles"><span>${y.leftLabel}</span><span>${y.rightLabel}</span></div>
            <div class="op-axis-track">
                <div class="op-axis-center"></div>
                <div class="op-axis-fill" style="${L}"></div>
                <div class="op-axis-dot" style="left:${E}%;background:${o};border-color:${s}"></div>
            </div>
        </div>`}const b=Object.values(e.ideology).filter(y=>Math.abs(y)>=50).length;let A,d,k;return b>=4?(A="var(--dgreen)",d="Strong Conviction",k=`${b} strong positions. Consistent ideological identity across axes.`):b<=1?(A="var(--dred)",d="Weak Conviction",k=`Only ${b} strong position${b===1?"":"s"}. Centrist on most axes — voters may not trust their platform.`):(A="var(--dteal)",d="Established Party",k=`${b} strong positions. Moderate ideological clarity.`),`
    <div class="op-card" style="background:linear-gradient(135deg, ${m} 0%, var(--dbg-2) 40%);border-color:${n}">
        <div class="op-card-hdr" style="border-bottom-color:${n}">
            <div class="op-logo-wrap" style="background:${v};border:1px solid ${n};border-radius:6px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${i}</div>
            <div class="op-hdr-info">
                <div class="op-name" style="color:${s}">${$(e.name)}</div>
                <div class="op-meta">
                    <span class="op-badge ${p}">${c}</span>
                    ${r}
                    ${h}
                </div>
            </div>
        </div>
        ${x}
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
                    <div class="op-insight-label" style="color:${A}">${d}</div>
                    <div class="op-insight-body">${k}</div>
                </div>
            </div>
            <div class="op-col-right">
                <div class="op-sec-label">Active Issue Stances</div>
                <div style="color:var(--dtxt-dim);font-size:10px;font-style:italic;padding:8px 0;">Rival stance tracking coming soon.</div>
                
            </div>
        </div>
    </div>`}function Ce(e,t){const s=e.replace("#",""),v=parseInt(s.substring(0,2),16)||0,n=parseInt(s.substring(2,4),16)||0,l=parseInt(s.substring(4,6),16)||0;return`rgba(${v},${n},${l},${t})`}async function io(e,t,s,v,n,l,o,m,i,c,p){const _=document.getElementById("elections-container");if(_)try{const r=t?.stats_at_start,h=o-(t?.started_at_tick||o),x=m.includes("Governing")||m.includes("Lead")||m==="Strongman";let u=[],a=0,g=0;if(r){for(const D of cs){const K=ds(D);if(K===0)continue;const J=Number(r[D]??0),Q=Number(e[D]??0),se=Q-J;if(se===0)continue;const ue=se*K;u.push({key:D,start:J,now:Q,raw:se,signed:ue,dir:K}),a+=ue,g++}g>0&&(a=a/g)}const C=Math.floor(h/12),b=a>0?Math.pow(.95,C):1,d=a*b*10;u.sort((D,K)=>K.signed-D.signed);const k=d>5?"var(--dgreen)":d>0||d>-5?"var(--damber)":"var(--dred)",S=d>0?"+":"",w=x?d:-d,y=w>5?"var(--dgreen)":w>0||w>-5?"var(--damber)":"var(--dred)",f=w>0?"+":"",E=u.map(D=>{const K=D.signed>0?"var(--dgreen)":"var(--dred)",J=D.signed>0?"▲":"▼",Q=ta(D.key);return`<div class="elec-stat-row">
            <span class="elec-stat-name">${$(Q)}</span>
            <span class="elec-stat-start">${D.start.toFixed(1)}</span>
            <span class="elec-stat-arrow" style="color:${K}">${J}</span>
            <span class="elec-stat-now">${D.now.toFixed(1)}</span>
            <span class="elec-stat-delta" style="color:${K}">${D.raw>0?"+":""}${D.raw.toFixed(1)}</span>
        </div>`}).join(""),L=r?u.length===0?'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No stat changes recorded yet.</div>':"":'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No administration data available.</div>',O=C>0&&a>0?`<div class="elec-decay-note">Incumbency decay: ${((1-b)*100).toFixed(1)}% reduction (${C} cycle${C>1?"s":""})</div>`:"",R=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Governance</span>
        </div>
        <div class="elec-box-body">
            <div class="elec-score-row">
                <div class="elec-score-block">
                    <div class="elec-score-label">${x?"Gov. Score":"National Score"}</div>
                    <div class="elec-score-value" style="color:${k}">${S}${Math.round(d)}</div>
                </div>
                ${x?"":`<div class="elec-score-block">
                    <div class="elec-score-label">Your Impact (Opposition)</div>
                    <div class="elec-score-value" style="color:${y}">${f}${Math.round(w)}</div>
                </div>`}
            </div>
            ${O}
            <div class="elec-admin-info">
                <span>${$(t?.admin_name||"Government")}</span>
                <span class="elec-ticks">${h} tick${h!==1?"s":""} in power</span>
            </div>
            ${x?(()=>{const D=Number(e?.gov_approval??50),K=Math.max(-1,Math.min(1,(D-35)/30)),J=Math.max(0,1-h/20),Q=Math.round(.08*K*J*1e3)/10,se=Q>0?"var(--dgreen)":Q<0?"var(--dred)":"var(--dtext-3)",ue=Q>0?"+":"";return`<div class="elec-incumbency-row" style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:rgba(255,255,255,0.03);border-radius:4px;font-size:11px;">
                    <span style="color:var(--dtext-3)">Incumbency Turnout Modifier</span>
                    <span style="color:${se};font-weight:600">${ue}${Q.toFixed(1)}%</span>
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
    </div>`,N=`
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
    </div>`,P=Number(v.momentum??0),q=(P*.08).toFixed(1),M=P>=60?"var(--dgreen)":P>=30?"var(--damber)":"var(--dred)",B=Math.min(100,Math.max(0,P)),U=i?.election_tick||0,z=U>o?U-o:null,H=Array.isArray(v.momentum_log)?v.momentum_log:[],Y=H.length>0?H.slice(0,30).map(D=>{const K=o-(D.tick||0),J=D.delta>0?"var(--dgreen)":"var(--dred)",Q=D.delta>0?"+":"";return`<div class="elec-mom-log-row">
                <span class="elec-mom-log-label">${$(D.label||"Event")}</span>
                <span class="elec-mom-log-delta" style="color:${J}">${Q}${D.delta}</span>
                <span class="elec-mom-log-ago">${K}t ago</span>
            </div>`}).join(""):'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No momentum events yet.</div>',ce=`
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
    </div>`,de=`
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
    </div>`,{data:pe,error:Ae}=await I.from("electorate_profile").select("*").eq("nation_id",e.id).maybeSingle();Ae&&console.error("[Elections] electorate_profile fetch failed:",Ae);const Ie={};for(const D of l||[])Ie[D.faction_id]=D;const Pe=Ie[v.id]||{},mt=Number(e.polarization??50),Je=Number(e.stability??50),De=Number(e.ethnic_diversity??50),ut=5+Math.min(100,Math.max(0,mt*.9+(100-Je)*.07+De*.03))/100*40;let j="",F=0;if(pe)for(const D of $e){const J=(Number(Pe[D.key]??0)+100)/2,Q=Number(pe["ideo_mean_"+D.key]??50),se=ut,{zones:ue,zoneForPos:Mt}=os(Q,se),qe=Mt(J),Ot=qe.includes("left")?D.leftLabel:qe.includes("right")?D.rightLabel:"",Fe=qe==="centrist"?"Centrist":qe.includes("moderate")?"Moderate":"Radical",$t=qe==="centrist"?"Centrist":`${Fe} ${Ot}`,Ze=sa(J,Q,se),wt=(Ze*100).toFixed(1);F+=Ze;const yt=[...ue].sort((ge,bt)=>bt.width-ge.width)[0],ys=yt.id.includes("left")?D.leftLabel:yt.id.includes("right")?D.rightLabel:"",bs=yt.id==="centrist"?"Centrist":yt.id.includes("moderate")?"Moderate":"Radical",hs=yt.id==="centrist"?"Centrist":`${bs} ${ys}`,xs=Ze>=.6?"var(--dgreen)":Ze>=.3?"var(--damber)":"var(--dred)",_s=(Number(pe["salience_"+D.key]??.2)*100).toFixed(0),Qe=Math.max(0,Q-se),Vt=Math.min(100,Q+se),Ge=Vt-Qe,$s={"radical-left":"rgba(239,68,68,0.10)","moderate-left":"rgba(251,191,36,0.07)",centrist:"rgba(74,222,128,0.08)","moderate-right":"rgba(251,191,36,0.07)","radical-right":"rgba(239,68,68,0.10)"},Kt={"radical-left":"rgba(239,68,68,0.25)","moderate-left":"rgba(251,191,36,0.18)",centrist:"rgba(74,222,128,0.22)","moderate-right":"rgba(251,191,36,0.18)","radical-right":"rgba(239,68,68,0.25)"},ws={"radical-left":"rgba(239,68,68,0.50)","moderate-left":"rgba(251,191,36,0.45)",centrist:"rgba(74,222,128,0.50)","moderate-right":"rgba(251,191,36,0.45)","radical-right":"rgba(239,68,68,0.50)"};let Yt="";for(const ge of ue){if(ge.width<1)continue;const bt=Math.max(ge.left,Qe),Xt=Math.min(ge.left+ge.width,Vt);if(Xt<=bt)continue;const Cs=(bt-Qe)/Ge*100,Jt=(Xt-bt)/Ge*100,Es=Jt>8;Yt+=`<div class="elec-ideo-zone" style="left:${Cs}%;width:${Jt}%;background:${$s[ge.id]};border-left:1px solid ${Kt[ge.id]};border-right:1px solid ${Kt[ge.id]}">
                    ${Es?`<span class="elec-ideo-zone-label" style="color:${ws[ge.id]}">${ge.label}</span>`:""}
                </div>`}const ks=Ge>0?(J-Qe)/Ge*100:50,Ss=Ge>0?(Q-Qe)/Ge*100:50;j+=`
            <div class="elec-ideo-axis">
                <div class="elec-ideo-axis-header">
                    <span class="elec-ideo-axis-name">${$(D.leftLabel)} / ${$(D.rightLabel)}</span>
                    <span class="elec-ideo-salience">Salience: ${_s}%</span>
                </div>
                <div class="elec-ideo-bar-wrap">
                    <div class="elec-ideo-bar-labels">
                        <span>${$(D.leftLabel)}</span>
                        <span>${$(D.rightLabel)}</span>
                    </div>
                    <div class="elec-ideo-bar-track">
                        <div class="elec-ideo-var-band" style="left:${Qe}%;width:${Ge}%">
                            ${Yt}
                            <div class="elec-ideo-mean-marker" style="left:${Ss}%"></div>
                            <div class="elec-ideo-player-marker" style="left:${ks}%"></div>
                        </div>
                    </div>
                    <div class="elec-ideo-bar-labels" style="margin-bottom:12px">
                        <span></span>
                    </div>
                </div>
                <div class="elec-ideo-details">
                    <span class="elec-ideo-position">Your Position: <strong>${$($t)}</strong></span>
                    <span class="elec-ideo-capture" style="color:${xs}">Voter Capture: <strong>${wt}%</strong></span>
                </div>
                <div class="elec-ideo-voters">Most voters are <strong>${$(hs)}</strong></div>
            </div>`}const xe=pe?(F/$e.length*100).toFixed(1):"—",ve=`
    <div class="elec-box elec-box--wide">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--purple"></div>
            <span class="elec-box-title">Ideology</span>
            <span class="elec-ideo-avg">Avg. Capture: <strong style="color:${F/$e.length>=.6?"var(--dgreen)":F/$e.length>=.3?"var(--damber)":"var(--dred)"}">${xe}%</strong></span>
        </div>
        <div class="elec-box-body">
            ${pe?j:'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No electorate data available.</div>'}
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
    </div>`,oe={};for(const D of ae)oe[D.key]=D;const fe=p||0,He=(n||[]).reduce((D,K)=>D+(K.seats||0),0),fs=He>0?fe/He:0,_t=(c||[]).filter(D=>D.is_active!==!1),us=Ie[v.id]||{};let gt="";if(_t.length===0){const D=(fs*100).toFixed(0);gt=`<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:16px 4px;text-align:center">
            No active caucuses.<br>Caucuses form when your party holds <strong>50%+</strong> of parliamentary seats.<br>
            <span style="margin-top:6px;display:inline-block">You currently hold <strong>${fe}</strong> / ${He} seats (${D}%).</span>
        </div>`}else{let D=0;for(const K of _t){const J=oe[K.dominant_axis],Q=Math.round(fe*K.seat_share);let se=0;if(J){const wt=us[K.dominant_axis]??0,Wt=K.wing_end==="right"?wt:-wt;se=Math.max(-3,Math.min(3,Math.round(Wt/15)))}const ue=Math.max(1,Q+se);D+=ue;const Mt=se>0?` <span style="color:var(--dgreen);font-size:9px">(+${se})</span>`:se<0?` <span style="color:var(--dred);font-size:9px">(${se})</span>`:"",qe=J?(K.wing_end==="left"?J.leftLabel:J.rightLabel)+" Wing":K.dominant_axis,Ot=J?K.wing_end==="left"?J.leftColor:J.rightColor:"var(--dtext-3)",Fe=Number(K.relationship_score??50),$t=Fe>=60?"var(--dgreen)":Fe>=30?"var(--damber)":"var(--dred)",Ze=Fe<30?'<span style="font-family:var(--dfont-mono);font-size:9px;color:var(--dred);font-weight:700;letter-spacing:0.5px;margin-left:4px">VOLATILE</span>':"";gt+=`
            <div style="padding:8px 0;border-bottom:1px solid var(--dborder-1)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${$(K.name)}</div>
                        <div style="font-family:var(--dfont-mono);font-size:10px;color:${Ot};margin-top:2px">${qe}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:var(--dtext-0)">${ue} seat${ue!==1?"s":""}${Mt}</div>
                        <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
                            <div style="width:50px;height:5px;background:var(--dborder-1);border-radius:3px;overflow:hidden">
                                <div style="width:${Fe}%;height:100%;background:${$t};border-radius:3px;transition:width 0.3s"></div>
                            </div>
                            <span style="font-family:var(--dfont-mono);font-size:10px;color:${$t}">${Fe}</span>
                            ${Ze}
                        </div>
                    </div>
                </div>
            </div>`}gt=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);margin-bottom:6px;display:flex;justify-content:space-between">
            <span>${_t.length} active caucus${_t.length!==1?"es":""}</span>
            <span>${D} / ${fe} seats</span>
        </div>`+gt}const gs=`
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
                ${gt}
            </div>
        </div>
    </div>`;_.innerHTML=`
    <div class="elec-page">
        <div class="elec-row">
            ${R}
            ${N}
            ${ce}
            ${de}
        </div>
        <div class="elec-row" style="margin-top:20px">
            ${ve}
            ${G}
            ${gs}
        </div>
    </div>`}catch(r){console.error("[Elections Tab] Render error:",r),_.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">Failed to load election data. Please refresh.</div>'}}
