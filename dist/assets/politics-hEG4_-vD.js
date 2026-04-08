const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/elections-BTkguY9j.js","assets/config-fKhFNVuq.js","assets/government-types-BwzErBjP.js","assets/ideology-DpNSiogU.js","assets/stats-DqgGwtpW.js","assets/government-structure-DYTqr3LI.js"])))=>i.map(i=>d[i]);
import{_ as P}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as $s,g as Be,_ as _t}from"./common-C9Un1y3Z.js";import{c as zt,P as ws,b as ks,g as Mt}from"./party-icons-CJ7uQoDE.js";import{t as $e}from"./utils-C2W-HleY.js";import{l as Ss,f as Xt}from"./government-structure-DYTqr3LI.js";import{a as Jt,h as Cs,i as Zt}from"./government-types-BwzErBjP.js";import{initGameConfigForNation as Es,switchPartyEndorsement as Ls}from"./config-fKhFNVuq.js";import{d as As,D as Is,G as Ps,H as Qt,J as we,K as Ts,S as le,L as ce,R as Bt,M as es,O as wt,w as $t,Q as Ns,T as Ms,U as Os,V as Me,W as Rs,X as zs,Y as Bs,Z as Ds,_ as Hs,$ as qs,a0 as Dt,a1 as Fs,a2 as Gs,a3 as Us,a4 as js,a5 as Ws,f as Vs,a6 as ts,a7 as Ys}from"./elections-BTkguY9j.js";import{a as se}from"./ideology-DpNSiogU.js";import{g as ss,c as Ks,P as Ge,e as Xs,d as as,f as Js,i as os,h as Zs,j as Qs,k as ea,l as is,m as ta,n as sa,o as aa}from"./protest-CLP39t6D.js";import{N as oa,s as ia}from"./stats-DqgGwtpW.js";const Yt=6;function na({isPresidentialSystem:e=!1,scheduledElections:t=[],currentTick:s=0,playerSeats:v=0}={}){const l=(t||[]).filter(c=>c&&c.election_type==="presidential"&&Number.isFinite(Number(c.election_tick))).sort((c,y)=>Number(c.election_tick)-Number(y.election_tick))[0]||null;let i="",a=null,m=null,n=!1;return e?l?(a=Number(l.election_tick)-Number(s),a<=0?(i="This election has already fired; endorsement is locked for this cycle.",a=null):a>Yt?(m=a-Yt,i="No presidential election is in the eligible window."):Number(v)<=0&&(i="Your party is not eligible to endorse in this cycle.")):i="No presidential election is in the eligible window.":(n=!0,i="No presidential election is in the eligible window."),{disabled:!!i,disabledReason:i,ticksUntilElection:a,ticksUntilWindow:m,hidden:n}}function it(e,t="id"){const s={};for(const v of e||[])s[v[t]]=v;return s}function ns(e,t,s,v){if(!t)return{score:0,deltas:[],decayCycles:0,multiplier:1};let l=0,i=0;const a=[];for(const x of oa){const r=ia(x);if(r===0)continue;const u=Number(t[x]??0),_=Number(e[x]??0),f=_-u;if(f===0)continue;const o=f*r;a.push({key:x,start:u,now:_,raw:f,signed:o,dir:r}),l+=o,i++}let m=i>0?l/i:0;const n=v-(s||v),c=Math.floor(n/12),y=m>0?Math.pow(.95,c):1;return m*=y,{score:m,deltas:a,decayCycles:c,multiplier:y,ticksInPower:n}}function Z(e,t=!0){const s=document.getElementById("pol-toast");s&&s.remove();const v=document.createElement("div");v.id="pol-toast",v.style.cssText=`position:fixed;top:20px;right:20px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:13px;font-family:var(--dfont-mono);max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s;${t?"background:#2d1517;color:#f87171;border:1px solid #7f1d1d;":"background:#1a2e1a;color:#86efac;border:1px solid #14532d;"}`,v.textContent=e,document.body.appendChild(v),setTimeout(()=>{v.style.opacity="0",setTimeout(()=>v.remove(),300)},4e3)}$s("politics",async e=>{const{nation:t,faction:s,shard:v}=e;if(!t||!s){document.getElementById("content-area").innerHTML='<div class="pol-loading">No nation or party data available.</div>';return}await Es(P,t.id);const l=s,i=v?.current_tick||0,{data:a}=await P.from("factions").select("id, seats, national_vote_share, faction_name, abbreviation, party_color, standing, loyalty, last_seen_tick, leader_first_name, leader_last_name, leader_age, founded_tick, custom_logo_url, party_logo, party_description, momentum, momentum_log").eq("nation_id",t.id).eq("faction_type","party"),m=(a||[]).map(L=>L.id),{data:n}=m.length>0?await P.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism").in("faction_id",m):{data:[]},{data:c}=m.length>0?await P.from("faction_electoral_standing").select("faction_id, party_approval, visibility, ideological_alignment, raw_appeal").eq("nation_id",t.id).in("faction_id",m):{data:[]},y={};for(const L of c||[])y[L.faction_id]=L;for(const L of a||[]){const B=y[L.id];L._governance=Math.round(Number(B?.party_approval||0)),L._pillarMomentum=Math.round(Number(B?.visibility||0)),L._ideology=Math.round(Number(B?.ideological_alignment||0)),L._rawAppeal=Math.round(Number(B?.raw_appeal||0)*10)/10}const{currentSeats:x}=await Ss(P,t.id,a||[],l.id),r=(a||[]).reduce((L,B)=>L+(B.seats||0),0),u=x,{data:_}=await P.from("elections").select("election_tick, results").eq("nation_id",t.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle();let f=Number(l.national_vote_share||0).toFixed(1),o=null,b=null;if(_){o=$e(_.election_tick);const L=_.results,j=(L?.votes||(Array.isArray(L)?L:[])).find(O=>O.party_id===l.id);if(j&&typeof j.vote_percentage=="number"&&(f=j.vote_percentage.toFixed(1)),Array.isArray(L)){const O=L.find(D=>D.party_id===l.id);if(O&&typeof O.seats_won=="number"){const D=typeof O.seats_before=="number"?O.seats_before:null;D!==null&&(b=u-D)}}}const h=await Xt(P,t.id);let d="Opposition";h&&h.party_ids&&h.party_ids.includes(l.id)&&(d=h.lead_party_id===l.id?"Lead — Governing":"Governing Coalition");const{data:$}=await P.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",t.id),{data:g}=await P.from("issue_state").select("issue_id, salience").eq("nation_id",t.id),A={};for(const L of g||[])A[L.issue_id]=L;let{data:I}=await P.from("elections").select("election_tick, election_type").eq("nation_id",t.id).eq("status","scheduled").gt("election_tick",i).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(!I){const L=Number(t.parliamentary_term_ticks)||24;I={election_tick:i+L,election_type:"parliamentary"}}const S=ra(l.id,t.name),w={whipFirst:l.whip_first_name||S.whipFirst,whipLast:l.whip_last_name||S.whipLast},{data:p}=await P.from("nations_history").select("gov_approval").eq("nation_id",t.id).eq("tick",i-1).maybeSingle(),C=p?.gov_approval??null,{data:E}=await P.from("presidents").select("id, faction_id, first_name, last_name, age, ideology, trait, trait_upside, trait_downside, elected_tick, term_ends_tick, is_active, terms_served").eq("nation_id",t.id).eq("is_active",!0).order("elected_tick",{ascending:!1}).limit(1).maybeSingle(),{data:M}=await P.from("administrations").select("id, admin_name, government_type, started_at_tick, president_name, president_party_id, president_party_name, stats_at_start").eq("nation_id",t.id).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),{data:R}=await P.from("elections").select("election_tick, results, election_type").eq("nation_id",t.id).eq("status","completed").eq("election_type","parliamentary").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:T}=await P.from("elections").select("election_tick, results, election_type").eq("nation_id",t.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:N}=await P.from("elections").select("election_tick, election_type").eq("nation_id",t.id).eq("status","scheduled").gt("election_tick",i).order("election_tick",{ascending:!0}),{data:z}=await P.from("caucus_factions").select("id, name, dominant_axis, wing_end, seat_share, relationship_score").eq("party_id",l.id).eq("is_active",!0),{data:q}=await P.from("party_endorsement_preferences").select("endorsed_party_id").eq("endorsing_party_id",l.id).maybeSingle();ca(l,t,{shard:v,totalSeats:r,mySeats:u,voteSharePct:f,lastElectionDate:o,seatDelta:b,role:d,coalition:h,currentTick:i,officerNames:w,allParties:a,allPartyIdeologies:n,activeCrises:$,nextElection:I,prevApproval:C,lastParliamentary:R,lastPresidential:T,scheduledElections:N,president:E,administration:M,caucusFactions:z,currentEndorsement:q,issueStateMapInit:A})});function la(e){const t=e.replace(/-/g,""),v=20+parseInt(t.substring(16,24),16)%51;return Math.max(0,v-10)}function ra(e,t=""){const{firstNames:s,lastNames:v}=As(t),l=e.replace(/-/g,""),i=parseInt(l.substring(8,12),16),a=parseInt(l.substring(12,16),16);return{whipFirst:s[i%s.length],whipLast:v[a%v.length]}}async function ca(e,t,s){const{shard:v,totalSeats:l,mySeats:i,voteSharePct:a,lastElectionDate:m,seatDelta:n,role:c,officerNames:y,allParties:x,allPartyIdeologies:r,coalition:u,activeCrises:_,currentTick:f,nextElection:o,prevApproval:b,lastParliamentary:h,lastPresidential:d,scheduledElections:$,president:g,administration:A,caucusFactions:I,currentEndorsement:S,issueStateMapInit:w}=s,p=e,C=e.party_color||"#ffcc00",E=zt({customLogoUrl:e.custom_logo_url,iconKey:e.party_logo,size:36,color:C}),M=$e(e.founded_tick),R=c.includes("Governing")||c.includes("Lead"),T=c.includes("Lead")?"Governing":c,N=c==="Strongman"?"pol-role-strongman":R?"pol-role-gov":"pol-role-opp",z=(r||[]).find(F=>F.faction_id===e.id);let q=null,L=null;if(z){const F=se.map(ne=>({ax:ne,score:z[ne.key]??0})).sort((ne,fe)=>Math.abs(fe.score)-Math.abs(ne.score));F.length>0&&F[0].score!==0&&(q=F[0].score<0?F[0].ax.left:F[0].ax.right),F.length>1&&F[1].score!==0&&(L=F[1].score<0?F[1].ax.left:F[1].ax.right)}q||(q=e.ideology_value_1||null),L||(L=e.ideology_value_2||null);function B(F){if(!F)return"";const ne="pol-ideo-"+F.toLowerCase(),fe=F.charAt(0).toUpperCase()+F.slice(1).toLowerCase();return`<div class="pol-ideo-box">
            <span class="pol-ideo-label">Ideology</span>
            <span class="pol-ideo-value ${ne}">${fe}</span>
        </div>`}let j,O;j=e.leader_first_name&&e.leader_last_name?e.leader_first_name+" "+e.leader_last_name:"Vacant",O=e.leader_age?`(${e.leader_age})`:"";const D=e.leader_ideology||q,U=D?`<span class="pol-leader-ideo pol-ideo-${D.toLowerCase()}">${D.charAt(0).toUpperCase()+D.slice(1).toLowerCase()}</span>`:"",ee=e.electability??la(e.id),ae=Is(ee);let me="";if(n!==null&&n!==0){const F=n>0?"+":"";me=`<span class="pol-stat-delta ${n>0?"up":"down"}">${F}${n}</span>`}const pt=`
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
        ${_a(t,u,x,f,b,g,A)}
        <div class="pol-party-card">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--green"></div>
            <span class="pol-box-label">Your Party</span>
        </div>
        <div class="pol-box-body">
        <div class="pol-header">
            <div class="pol-logo">${E}</div>
            <div class="pol-header-info">
                <div class="pol-party-name">${k(e.faction_name)} <span style="color:var(--dtext-3);font-size:11px;font-weight:400;font-style:italic;margin-left:4px;">${Jt(t)}</span></div>
                <div class="pol-meta-row">
                    <span class="pol-role-badge ${N}">${k(T.toUpperCase())}</span>
                    <span class="pol-established">Est. ${M}</span>
                    <span class="pol-leader-badge">Leader: ${k(j)} ${O}</span>
                </div>
            </div>
        </div>
        <div class="pol-ideo-row">
            ${B(q)}
            ${B(L)}
        </div>
        <hr class="pol-divider">
        <div class="pol-leader-section">
            <div class="pol-leader-header">
                <span class="pol-sub-label">Leader</span>
                <button class="pol-leadership-btn" onclick="window.location.href='party-leadership.html'">Party Leadership &rarr;</button>
            </div>
            <div class="pol-leader-name">${k(j)} <span class="pol-leader-age">${O}</span> <span class="pol-leader-electability"><span class="pol-leader-electability-label">Electability: </span><span style="color:${ae.color}">${ae.label}</span></span></div>
            ${U}
        </div>
        <div class="pol-officers-row">
            <div class="pol-officer">
                <div class="pol-officer-label">Party Whip</div>
                <div class="pol-officer-name">${k(y.whipFirst+" "+y.whipLast)}</div>
            </div>
        </div>
        <hr class="pol-divider">
        <div class="pol-stats-row">
            <div class="pol-stat-block">
                <div class="pol-stat-label">Seats</div>
                <div class="pol-stat-value">${i}<span class="pol-stat-total">/${l}</span>${me}</div>
            </div>
        </div>
        ${ga(I,i,z)}
        </div>
        </div>
        ${ya(x,u,t,e.id)}
        ${ha(x,l,f,o,null,e.id)}
        </div>

        <div class="pol-row-2">
        ${xa(t,_,f,w)}
        <div class="pol-ideology-box" id="stance-summary-container">
            <div class="pol-ideo-header"><div class="pol-box-dot pol-box-dot--orange"></div><span class="pol-mod-title">Stances</span></div>
            <div class="pol-box-body"><div id="stance-summary-strip"></div></div>
        </div>
        ${$a(e,f)}
        </div>

        <div class="pol-row-3">
        ${ka(h,d,x,{scheduledElections:$,currentTick:f,nation:t,mySeats:i,faction:p,currentEndorsement:S})}

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
    </div>`;document.getElementById("content-area").innerHTML=pt;let W=!1,G=!1,be=!1,he=!1;document.querySelectorAll(".pol-page-tab").forEach(F=>{F.addEventListener("click",()=>{document.querySelectorAll(".pol-page-tab").forEach(vt=>vt.classList.remove("active")),document.querySelectorAll(".pol-page-content").forEach(vt=>vt.classList.remove("active")),F.classList.add("active");const ne=F.getAttribute("data-page-tab"),fe=document.querySelector(`.pol-page-content[data-page-content="${ne}"]`);fe&&fe.classList.add("active"),ne==="actions"&&!W&&(W=!0,dt(t,e,v,x)),ne==="electorate-spread"&&!be&&(be=!0,Xa(e,t,x,r,f)),ne==="other-parties"&&!G&&(G=!0,Za(e,t,x,r,u,l,f,A)),ne==="elections"&&!he&&(he=!0,eo(t,A,u,e,x,r,f,c,o,I,i))})}),window.innerWidth>860&&document.querySelectorAll(".pol-admin-box, .pol-party-card, .pol-parliament-box, .pol-forecast-box, .pol-coalition-box, .pol-mood-box, .pol-ideology-box, .pol-identity-box, .pol-election-box, .pol-blocs-box").forEach(F=>{F.style.height="450px"}),wa(e),Sa(),Ca(),At(e.id,t.id),ma(t.id,e.id);const oe=document.getElementById("pol-disband-party-btn");oe&&oe.addEventListener("click",async()=>{if(confirm("Are you sure you want to disband your party? This is permanent — your party will be removed from the game after the next tick.")&&confirm("This cannot be undone. Disband your party?")){oe.disabled=!0,oe.textContent="Disbanding...";try{await Ps(P,t.id,e.id,f),sessionStorage.removeItem("nationhood_state"),await P.auth.signOut(),window.location.href="login.html"}catch(F){Z(F.message||"Failed to disband party."),oe.disabled=!1,oe.textContent="Disband Party"}}})}const da=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function pa(e){return`${da[e%12]} ${2e3+Math.floor(e/12)}`}async function ls(e,t,s,{limit:v=80,detailed:l=!0}={}){const i=document.getElementById(e);if(!i)return;const{data:a,error:m}=await P.from("activity_log").select("id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at").eq("nation_id",t).order("tick",{ascending:!1}).order("created_at",{ascending:!1}).limit(v);if(m||!a||a.length===0){i.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px;padding:8px">No party events yet.</div>';return}const n=[...new Set(a.map(u=>u.faction_id))],{data:c}=await P.from("factions").select("id, faction_name, abbreviation, party_color").in("id",n),y=it(c);let x="",r=null;for(const u of a){u.tick!==r&&(r=u.tick,x+=`<div class="pe-tick-sep">${pa(u.tick)}</div>`);const _=y[u.faction_id],f=u.faction_id===s,o=f?"You":_?.abbreviation||"???",b=_?.party_color||"var(--dtext-2)",h=u.outcome==="success"?"var(--dgreen)":u.outcome==="backfire"?"var(--dred)":u.outcome==="failure"?"var(--damber)":"var(--dtext-3)";x+=`<div class="pe-item${f?" pe-item--you":""}">
            <div class="pe-item-row">
                <span class="pe-item-party" style="color:${b}">${k(o)}</span>
                <span class="pe-item-label">${k((u.action_label||u.action_type).replace(/_/g," "))}</span>
                ${l&&u.ap_spent?`<span class="pe-item-ap">${u.ap_spent} AP</span>`:""}
                ${u.outcome?`<span class="pe-item-outcome" style="color:${h}">${k(u.outcome)}</span>`:""}
            </div>
            ${l&&u.description?`<div class="pe-item-desc">${k(u.description)}</div>`:""}
        </div>`}i.innerHTML=x}function va(e,t){return ls("party-events-feed",e,t,{limit:80,detailed:!0})}function ma(e,t){return ls("gov-card-party-events",e,t,{limit:40,detailed:!1})}function fa(e,t,s){const v=e||"#888",l=t||(s?s.substring(0,2).toUpperCase():"??");return`<div class="pol-mini-logo" style="background:${v}">${k(l)}</div>`}function ua(e,t){if(t?.head_of_state_title&&!Zt(t))return t.head_of_state_title;if(!e)return"Head of Gov.";const s=e.toLowerCase();return s==="democracy"||s.includes("parliament")?"PM":s.includes("president")?"President":"Head of Gov."}function ga(e,t,s){if(!e||e.length===0)return"";const v={};for(const m of se)v[m.key]=m;let l=0,i="";for(const m of e){const n=v[m.dominant_axis],c=n?(m.wing_end==="left"?n.leftLabel:n.rightLabel)+" Wing":m.dominant_axis,y=n?m.wing_end==="left"?n.leftColor:n.rightColor:"var(--text-dim)",x=Math.round(t*m.seat_share);let r=0;if(s&&n){const h=s[m.dominant_axis]??0,d=m.wing_end==="right"?h:-h;r=Math.max(-3,Math.min(3,Math.round(d/15)))}const u=Math.max(1,x+r);l+=u;const _=r>0?` <span style="color:var(--green);font-size:0.7rem;">(+${r})</span>`:r<0?` <span style="color:var(--red);font-size:0.7rem;">(${r})</span>`:"",f=m.relationship_score,o=f>=60?"var(--green)":f>=30?"var(--amber)":"var(--red)",b=f<30?' <span style="color:var(--red);font-size:0.7rem;">VOLATILE</span>':"";i+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-dim);">
            <div>
                <div style="font-size:0.85rem;font-weight:500;">${k(m.name)}</div>
                <div style="font-size:0.7rem;color:${y};opacity:0.8;">${c}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <div style="font-size:0.85rem;font-weight:600;white-space:nowrap;">${u} seats${_}</div>
                <div style="display:flex;align-items:center;gap:4px;">
                    <div style="width:50px;height:5px;background:var(--border-dim);border-radius:3px;overflow:hidden;">
                        <div style="width:${f}%;height:100%;background:${o};border-radius:3px;"></div>
                    </div>
                    <span style="font-size:0.65rem;color:var(--text-dim);">${f}</span>
                    ${b}
                </div>
            </div>
        </div>`}const a=e.length;return`<hr class="pol-divider">
        <div style="padding:0 0 4px;">
            <div class="pol-sub-label" style="margin-bottom:2px;">Internal Caucuses</div>
            <div style="font-size:0.7rem;color:var(--text-dim);margin-bottom:6px;">${a} active caucus${a!==1?"es":""} · ${l} / ${t} seats</div>
            ${i}
        </div>`}function ya(e,t,s,v){const l=e||[],i=l.reduce((w,p)=>w+(p.seats||0),0),a=Math.ceil(i/2);let m,n;m=new Set(t?.party_ids||[]),n=t?.lead_party_id||null;const c=l.filter(w=>m.has(w.id)),y=l.filter(w=>!m.has(w.id)),x=c.reduce((w,p)=>w+(p.seats||0),0),r=y.reduce((w,p)=>w+(p.seats||0),0),u=[...l].sort((w,p)=>(p.seats||0)-(w.seats||0)),_=i>0?u.map(w=>{const p=(w.seats||0)/i*100;if(p<=0)return"";const C=w.party_color||"#888";return`<div class="pol-seat-segment" style="width:${p.toFixed(2)}%;background:${C}"></div>`}).join(""):"",o=`<div class="pol-majority-line" style="left:${(i>0?a/i*100:50).toFixed(2)}%"></div>`,b=ua(s?.government_type,s);function h(w){const p=fa(w.party_color,w.abbreviation,w.faction_name),C=k(w.faction_name||"Unknown"),E=w.seats||0,M=w.id===v,T=[w.id===n?`<span class="pol-hog-pill">${k(b)}</span>`:"",M?'<span class="pol-you-pill">YOU</span>':""].filter(Boolean).join(" ");return`<div class="pol-parl-party-row">
            ${p}
            <span class="pol-parl-party-name">${C}</span>
            ${T}
            <span class="pol-parl-party-seats">${E}</span>
        </div>`}const d=c.length>0?c.sort((w,p)=>(p.seats||0)-(w.seats||0)).map(h).join(""):"",$=y.length>0?y.sort((w,p)=>(p.seats||0)-(w.seats||0)).map(h).join(""):"",g=x-a,A=g>=0,I=A?"pol-margin-positive":"pol-margin-negative",S=A?`+${g} above majority`:`${Math.abs(g)} below majority`;return`
        <div class="pol-parliament-box">
            <div class="pol-parl-header">
                <div class="pol-box-dot pol-box-dot--amber"></div>
                <span class="pol-parl-title">Parliament</span>
                <div class="pol-box-header-right"><span class="pol-parl-seats-count">${i} seats</span></div>
            </div>
            <div class="pol-box-body">
            <div class="pol-seat-bar-wrap">
                <div class="pol-seat-bar">${_}</div>
                ${o}
            </div>

            <div class="pol-section-header">
                <span class="pol-section-title">Governing Coalition</span>
                <span class="pol-section-seats">${x} seats</span>
            </div>
            ${d}

            <div class="pol-section-header">
                <span class="pol-section-title">Opposition</span>
                <span class="pol-section-seats">${r} seats</span>
            </div>
            ${$}

            <div class="pol-margin-row ${I}">
                <span class="pol-margin-dot"></span>
                <span>${S}</span>
            </div>
            </div>
        </div>`}function ba(e){return e>=60?"var(--dred)":e>=40?"var(--damber)":"var(--dgreen)"}function ha(e,t,s,v,l,i){const c=v?.election_tick||0,y=c>s?c-s:0,x=c>0&&y<=12,r=Math.ceil(t/2),u=y<=5?"CAMPAIGN SEASON":y<=10?"MID CYCLE":"EARLY CYCLE",_=y<=5?"var(--dred)":y<=10?"var(--damber)":"var(--dgreen)";if(!x){const p=c>0?y-12:0,C=c>0?`Forecast available in <span style="color:var(--dtxt-secondary);font-weight:700">${p} ticks</span><br>Polling begins 12 ticks before election`:"No election currently scheduled",E=c>0?$e(c):null;return`
            <div class="pol-forecast-box">
                <div class="pol-fc-header">
                    <div class="pol-box-dot pol-box-dot--blue"></div>
                    <span class="pol-mod-title">Election Forecast</span>
                </div>
                <div class="pol-box-body">
                ${E?`<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${E}</span></div>`:""}
                <div class="pol-fc-empty">
                    <div class="pol-fc-empty-title">Insufficient polling data</div>
                    <div class="pol-fc-empty-detail">${C}</div>
                </div>
                </div>
            </div>`}const f=Math.max(1,12-(12-y)),b=(e||[]).filter(p=>Number(p.national_vote_share||0)<=0?!1:p.last_seen_tick!=null?s-p.last_seen_tick<12:s-(p.founded_tick||0)<12).map(p=>{const C=Number(p.national_vote_share||0),E=Math.round(C/100*t);return{...p,estSeats:E,momentum:Number(p.momentum??0),governance:p._governance??0,pillarMomentum:p._pillarMomentum??0,ideology:p._ideology??0,rawAppeal:p._rawAppeal??0}}).sort((p,C)=>C.estSeats-p.estSeats),h=f>=10?"VERY LOW":f>=7?"LOW":f>=5?"MODERATE":f>=3?"HIGH":"VERY HIGH",d=f>=10?"var(--dred)":f>=7||f>=5?"var(--damber)":f>=3?"#22d3ee":"var(--dgreen)",$=(12-y)/12*100,g=b.map(p=>{const C=Math.max(p.estSeats-f,0),E=Math.min(p.estSeats+f,t),M=C/t*100,R=E/t*100,T=p.party_color||"#888",N=p.abbreviation||(p.faction_name||"??").substring(0,2).toUpperCase(),z=p.id===i,q=p.momentum>0?"var(--dgreen)":p.momentum<0?"var(--dred)":"var(--dtxt-muted)",L=p.momentum>0?"▲":p.momentum<0?"▼":"—",B=p.momentum!==0?`${L}${Math.abs(p.momentum)}`:L,j=t>0?r/t*100:50,O=Se=>Se>=60?"var(--dgreen)":Se>=35?"var(--damber)":"var(--dred)",D=O(p.governance),U=O(p.pillarMomentum),ee=O(p.ideology),ae=((p.governance||0)*.35).toFixed(1),me=((p.pillarMomentum||0)*.25).toFixed(1),ke=((p.ideology||0)*.3).toFixed(1);return`<div class="pol-fc-party">
            <div class="pol-fc-party-header">
                <div class="pol-fc-party-left">
                    <div class="pol-fc-party-dot" style="background:${T}"></div>
                    <span class="pol-fc-party-abbr" style="color:${T}">${k(N)}</span>
                    ${z?'<span class="pol-ideo-legend-you">YOU</span>':""}
                </div>
                <div class="pol-fc-party-right">
                    <span class="pol-fc-momentum" style="color:${q}">${B}</span>
                    <span class="pol-fc-range">${C}–${E}</span>
                    <span class="pol-fc-seats-label">seats</span>
                </div>
            </div>
            <div class="pol-fc-3p">
                <div class="pol-fc-3p-row">
                    <span class="pol-fc-3p-label">GOV</span>
                    <span class="pol-fc-3p-pct">35%</span>
                    <div class="pol-fc-3p-bar"><div class="pol-fc-3p-fill" style="width:${p.governance}%;background:${D}"></div></div>
                    <span class="pol-fc-3p-val" style="color:${D}">${p.governance}</span>
                    <span class="pol-fc-3p-contrib">${ae}</span>
                </div>
                <div class="pol-fc-3p-row">
                    <span class="pol-fc-3p-label">MOM</span>
                    <span class="pol-fc-3p-pct">25%</span>
                    <div class="pol-fc-3p-bar"><div class="pol-fc-3p-fill" style="width:${p.pillarMomentum}%;background:${U}"></div></div>
                    <span class="pol-fc-3p-val" style="color:${U}">${p.pillarMomentum}</span>
                    <span class="pol-fc-3p-contrib">${me}</span>
                </div>
                <div class="pol-fc-3p-row">
                    <span class="pol-fc-3p-label">IDEO</span>
                    <span class="pol-fc-3p-pct">30%</span>
                    <div class="pol-fc-3p-bar"><div class="pol-fc-3p-fill" style="width:${p.ideology}%;background:${ee}"></div></div>
                    <span class="pol-fc-3p-val" style="color:${ee}">${p.ideology}</span>
                    <span class="pol-fc-3p-contrib">${ke}</span>
                </div>
                <div class="pol-fc-3p-score">
                    <span class="pol-fc-3p-score-label">SCORE</span>
                    <span class="pol-fc-3p-score-val">${p.rawAppeal}</span>
                </div>
            </div>
            <div class="pol-fc-band">
                <div class="pol-fc-band-fill" style="left:${M.toFixed(1)}%;width:${(R-M).toFixed(1)}%;background:${T}22;border-color:${T}33"></div>
                <div class="pol-fc-maj-line" style="left:${j.toFixed(1)}%"></div>
            </div>
        </div>`}).join(""),A=b.find(p=>p.id===i),I=b.find(p=>p.id!==i);let S="";if(A&&I){const p=Math.max(A.estSeats-f,0),C=Math.min(A.estSeats+f,t),E=Math.max(I.estSeats-f,0),M=Math.min(I.estSeats+f,t),R=Math.max(0,Math.min(C,M)-Math.max(p,E)),T=C-p,N=T>0?Math.round(R/T*100):0,z=A.abbreviation||"YOU",q=I.abbreviation||"RIVAL",L=N>70?"TOO CLOSE TO CALL":N>30?"COMPETITIVE":N>0?A.estSeats>I.estSeats?`LEANING ${z}`:`LEANING ${q}`:A.estSeats>I.estSeats?`${z} LEADS`:`${q} LEADS`,B=N>70?"var(--dred)":N>30?"var(--damber)":"var(--dgreen)",j=N>70?`${z} and ${q} seat ranges fully overlap. Outcome is uncertain.`:N>30?"Bands are narrowing. Late campaigns could decide the race.":N>0?"Leading party is emerging, but the gap is not yet decisive.":"Ranges no longer overlap. Leader is identifiable.";S=`
            <div class="pol-fc-status" style="background:${B}08;border-color:${B}">
                <div class="pol-fc-status-header">
                    <span class="pol-fc-status-label" style="color:${B}">${k(L)}</span>
                    <span class="pol-fc-status-overlap">${N}% overlap</span>
                </div>
                <div class="pol-fc-status-desc">${j}</div>
            </div>`}const w=c>0?$e(c):null;return`
        <div class="pol-forecast-box">
            <div class="pol-fc-header">
                <div class="pol-box-dot pol-box-dot--blue"></div>
                <span class="pol-mod-title">Election Forecast</span>
                <div class="pol-box-header-right"><span class="pol-fc-phase" style="color:${_};background:${_}15">${u}</span></div>
            </div>
            <div class="pol-box-body">
            ${w?`<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${w}</span></div>`:""}
            <div class="pol-fc-countdown">
                <div>
                    <span class="pol-fc-ticks-big" style="color:${_}">${y}</span>
                    <span class="pol-fc-ticks-label">ticks</span>
                </div>
                <div style="text-align:right">
                    <div style="display:flex;align-items:center;gap:4px;justify-content:flex-end">
                        <span class="pol-fc-margin-label">Margin:</span>
                        <span class="pol-fc-margin-val" style="color:${d}">±${f} seats</span>
                    </div>
                    <span class="pol-fc-conf-badge" style="color:${d};background:${d}15">${h} CONFIDENCE</span>
                </div>
            </div>
            <div class="pol-fc-conf-bar">
                <div class="pol-fc-conf-fill" style="width:${$.toFixed(0)}%;background:${d}"></div>
            </div>
            ${g}
            <div class="pol-fc-maj-legend">
                <div class="pol-fc-maj-dash"></div>
                <span class="pol-fc-maj-text">Majority: ${r} seats</span>
            </div>
            ${S}
            </div>
        </div>`}function xa(e,t,s,v){const l=t||[];let i;l.length===0?i='<div class="pol-mood-no-crises">No active crises</div>':i=l.map(n=>{const c=n.crisis_templates?.name||"Unknown Crisis",y=s-(n.started_at_tick||0);return`<div class="pol-mood-crisis">
                <span class="pol-mood-crisis-name">${k(c)}</span>
                <span class="pol-mood-crisis-dur">${y}t</span>
            </div>`}).join("");const m=Qt.map(n=>{const c=we[n],y=Number(v?.[n]?.salience??30);return{id:n,name:c.label,salience:y,statKeys:c.stats}}).sort((n,c)=>c.salience-n.salience).map(n=>{const c=ba(n.salience),y=n.statKeys.map(x=>{const r=Math.round(Number(e[x]??0)),u=x.replace(/_/g," ").replace(/\b\w/g,_=>_.toUpperCase());return`<div class="pol-mood-stat-row">
                <span class="pol-mood-stat-name">${k(u)}</span>
                <span class="pol-mood-stat-val">${r}</span>
            </div>`}).join("");return`<div class="pol-mood-issue-wrap">
            <div class="pol-mood-issue" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.pol-mood-chevron').textContent=this.nextElementSibling.classList.contains('open')?'▾':'▸'">
                <span class="pol-mood-issue-name">${k(n.name)}</span>
                <div class="pol-mood-issue-bar-wrap">
                    <div class="pol-mood-issue-bar" style="width:${n.salience}%;background:${c}"></div>
                </div>
                <span class="pol-mood-issue-pct">${n.salience}%</span>
                <span class="pol-mood-chevron">▸</span>
            </div>
            <div class="pol-mood-stats">${y}</div>
        </div>`}).join("");return`
        <div class="pol-mood-box">
            <div class="pol-mood-header">
                <div class="pol-box-dot pol-box-dot--red"></div>
                <span class="pol-mood-title">Electorate Issues</span>
            </div>
            <div class="pol-box-body">
            <div class="pol-mood-subtitle">Shows which issues matter most to the electorate.</div>
            ${i}
            ${m}
            </div>
        </div>`}function _a(e,t,s,v,l,i,a){const m=Cs(e),n=s||[],c=Math.round(Number(e.gov_approval??40)),y=c>=50?"var(--dgreen)":c>=35?"var(--damber)":"var(--dred)",x=a?.admin_name||"Government",r=Jt(e),u=new Set(t?.party_ids||[]),_=n.filter(E=>u.has(E.id)),f=_.reduce((E,M)=>E+(M.seats||0),0),o=n.reduce((E,M)=>E+(M.seats||0),0),b=Math.ceil(o/2),h=f>=b,d=_.length>1?"Coalition":_.length===1?"Single Party":"";function $(E,M){return((E||"?")[0]+(M||"?")[0]).toUpperCase()}let g="";if(m&&i){const E=n.find(z=>z.id===i.faction_id),M=E?.party_color||"#888",R=E?.abbreviation||(E?.faction_name||"??").substring(0,3).toUpperCase(),T=i.terms_served>1?i.terms_served===2?"2nd":i.terms_served+"th":"1st",N=$(i.first_name,i.last_name);g=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${k(N)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${k(i.first_name+" "+i.last_name)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">President &middot; Age ${i.age||"?"} &middot; ${T} Term</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${M}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${M}">${k(R)}</span>
            </div>
          </div>
        </div>`}else if(!m&&t){const E=n.find(z=>z.id===t.lead_party_id),M=E?.party_color||"#888",R=E?.faction_name||"Unknown",T=E?.abbreviation||R.substring(0,3).toUpperCase(),N=R.split(/\s+/).map(z=>z[0]).join("").toUpperCase().slice(0,2);g=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${k(N)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${k(R)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of Government</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${M}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${M}">${k(T)}</span>
            </div>
          </div>
        </div>`}let A="";const I=e.head_of_state_first_name||"",S=e.head_of_state_last_name||"";if(m&&I&&S){const E=$(I,S);A=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${k(E)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${k(I+" "+S)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Vice President</div>
          </div>
        </div>`}else if(!m&&I&&S){const E=$(I,S);A=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${k(E)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${k(I+" "+S)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of State</div>
          </div>
        </div>`}const w=[..._].sort((E,M)=>(M.seats||0)-(E.seats||0));o>0&&w.map(E=>{const M=(E.seats||0)/o*100;return M<=0?"":`<div style="width:${M.toFixed(2)}%;height:100%;background:${E.party_color||"#888"}"></div>`}).join(""),w.map(E=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
            <div style="width:7px;height:7px;border-radius:2px;background:${E.party_color||"#888"};flex-shrink:0"></div>
            <span style="font-family:var(--dfont-ui);font-size:12px;color:var(--dtext-0);flex:1">${k(E.faction_name||"Unknown")}</span>
            <span style="font-family:var(--dfont-mono);font-size:12px;font-weight:600;color:${E.party_color||"var(--dtext-0)"}">${E.seats||0}</span>
        </div>`).join("");const p=h?"Majority Government":"Minority Government",C=`${f}/${o} seats (${b} needed)`;return`<div class="pol-admin-box">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Government</span>
        </div>
        <div class="pol-box-body">
        <div style="font-family:var(--dfont-ui);font-size:16px;font-weight:700;color:var(--dtext-0);margin-bottom:8px">${k(x)}</div>
        <div style="display:flex;gap:6px;margin-bottom:16px">
            <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${k(r)}</span>
            ${d?`<span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${k(d)}</span>`:""}
        </div>

        ${g}
        ${A}

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Approval</div>
        <div style="font-family:var(--dfont-mono);font-size:28px;font-weight:700;line-height:1;color:${y}">${c}%</div>
        <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:4px;display:flex;align-items:center;gap:8px">
            <span style="text-transform:uppercase;font-weight:600">${k(p)}</span>
            <span style="font-weight:400">${k(C)}</span>
        </div>

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Party Events</div>
        <div id="gov-card-party-events" class="pe-feed" style="max-height:200px;overflow-y:auto;font-size:11px">
            <div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">Loading events...</div>
        </div>
        </div>
    </div>`}const xe=360,at=200,Ze=256;function $a(e,t){const s=e.party_color||"#ffcc00",v=e.party_logo||"flag",l=e.party_description||"",i=e.action_points||0,a=e.last_rename_tick||0,m=a>0?Math.max(0,xe-(t-a)):0,n=m>0,c=!!e.custom_logo_url,y=zt({customLogoUrl:e.custom_logo_url,iconKey:v,size:20,color:s}),x=ws.map(o=>`<div class="pol-id-swatch${o.hex.toLowerCase()===s.toLowerCase()?" selected":""}" data-color="${o.hex}" title="${o.label}" style="background:${o.hex}"></div>`).join(""),r={};for(const[o,b]of Object.entries(ks)){const h=b.category||"Other";r[h]||(r[h]=[]),r[h].push({key:o,label:b.label})}let u="";for(const[o,b]of Object.entries(r)){u+=`<div class="pol-id-icon-cat">${k(o)}</div><div class="pol-id-icon-grid">`;for(const h of b){const d=h.key===v?" selected":"",$=Mt(h.key,16,h.key===v?s:"#888");u+=`<div class="pol-id-icon-tile${d}" data-icon="${h.key}" title="${k(h.label)}" style="color:${h.key===v?s:"#888"}">${$}</div>`}u+="</div>"}let _,f;if(n){const b=`
            <div class="pol-id-cooldown">
                <span class="pol-id-cooldown-label">Rename cooldown</span>
                <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:${(m/xe*100).toFixed(1)}%"></div></div>
                <span class="pol-id-cooldown-ticks">${m}t</span>
            </div>`;_=b,f=b}else _=`
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
            </div>`,f=`
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
        data-selected-icon="${v}"
        data-current-tick="${t}">

        <!-- Header -->
        <div class="pol-id-header">
            <div class="pol-box-dot pol-box-dot--amber"></div>
            <span class="pol-id-title">Party Identity</span>
            <div class="pol-box-header-right">
                <div class="pol-id-preview" id="pol-id-preview" style="border:2px solid ${s};background:${s}18">
                    ${y}
                </div>
            </div>
        </div>
        <div class="pol-box-body">

        <!-- Party Name -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="pol-id-section-label">Party Name</span>
                <span class="pol-id-ap-badge">AP: <span id="pol-id-ap-display">${i}</span></span>
            </div>
            <div class="pol-id-name-display">
                <span id="pol-id-current-name">${k(e.faction_name)}</span>
                <span>current</span>
            </div>
            ${_}
        </div>
        <div class="pol-id-divider"></div>

        <!-- Abbreviation -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="pol-id-section-label">Abbreviation</span>
            </div>
            <div class="pol-id-name-display">
                <span id="pol-id-current-abbr">${k(e.abbreviation||"???")}</span>
                <span>current</span>
            </div>
            ${f}
        </div>
        <div class="pol-id-divider"></div>

        <!-- Description -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span class="pol-id-section-label">Description</span>
                <span class="pol-id-char-count${l.length>at*.9?" warn":""}" id="pol-id-char-count">${l.length} / ${at}</span>
            </div>
            <textarea class="pol-id-desc" id="pol-id-desc" rows="3" maxlength="${at}">${k(l)}</textarea>
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
            <div id="pol-id-icon-section"${c?' style="display:none"':""}>${u}</div>
            <div id="pol-id-upload-section"${c?"":' style="display:none"'}>
                <div class="pol-id-upload-zone${c?" has-image":""}" id="pol-id-upload-zone">
                    ${c?`
                        <img class="pol-id-upload-preview" src="${e.custom_logo_url}" alt="preview" style="border:2px solid ${s}">
                        <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Ze}KB · Best at 128×128px</div>
                    `:`
                        <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                        <div class="pol-id-upload-text">Click to upload logo</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Ze}KB · Best at 128×128px</div>
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
    </div>`}function wa(e){const t=document.getElementById("pol-identity-box");if(!t)return;const s=document.getElementById("pol-id-preview"),v=document.getElementById("pol-id-colors"),l=document.getElementById("pol-id-hex-input"),i=document.getElementById("pol-id-hex-preview"),a=document.getElementById("pol-id-desc"),m=document.getElementById("pol-id-char-count"),n=document.getElementById("pol-id-save-btn"),c=document.getElementById("pol-id-rename-btn"),y=document.getElementById("pol-id-rename-form"),x=document.getElementById("pol-id-rename-input"),r=document.getElementById("pol-id-rename-confirm"),u=document.getElementById("pol-id-rename-cancel"),_=document.getElementById("pol-id-rename-error"),f=document.getElementById("pol-id-abbr-btn"),o=document.getElementById("pol-id-abbr-form"),b=document.getElementById("pol-id-abbr-input"),h=document.getElementById("pol-id-abbr-confirm"),d=document.getElementById("pol-id-abbr-cancel"),$=document.getElementById("pol-id-abbr-error"),g=document.getElementById("pol-id-current-abbr"),A=document.getElementById("pol-id-current-name");document.getElementById("pol-id-ap-display");const I=document.getElementById("pol-id-icon-section"),S=document.getElementById("pol-id-upload-section"),w=document.getElementById("pol-id-upload-zone"),p=document.getElementById("pol-id-file-input"),C=document.getElementById("pol-id-upload-error"),E=document.getElementById("pol-id-remove-btn");let M=null,R=null,T=!!e.custom_logo_url,N=e.custom_logo_url||null;function z(){return t.dataset.selectedColor}function q(){return t.dataset.selectedIcon}function L(){const O=z();if(s.style.border="2px solid "+O,s.style.background=O+"18",T&&(M||N)){const D=M||N;s.innerHTML='<img src="'+D+'" alt="" style="width:100%;height:100%;object-fit:cover">'}else s.innerHTML=Mt(q(),20,O)}function B(){const O=z(),D=q();t.querySelectorAll(".pol-id-icon-tile").forEach(U=>{const ee=U.dataset.icon,ae=ee===D;U.classList.toggle("selected",ae),U.style.color=ae?O:"#888",U.innerHTML=Mt(ee,16,ae?O:"#888")})}function j(){const O=z().toLowerCase();t.querySelectorAll(".pol-id-swatch").forEach(D=>{D.classList.toggle("selected",D.dataset.color.toLowerCase()===O)})}v&&v.addEventListener("click",O=>{const D=O.target.closest(".pol-id-swatch");D&&(t.dataset.selectedColor=D.dataset.color,l.value=D.dataset.color,i.style.background=D.dataset.color,j(),B(),L())}),l&&l.addEventListener("input",()=>{const O=l.value;/^#[0-9a-fA-F]{6}$/.test(O)?(t.dataset.selectedColor=O,i.style.background=O,j(),B(),L()):i.style.background="var(--dtext-3)"}),I&&I.addEventListener("click",O=>{const D=O.target.closest(".pol-id-icon-tile");D&&(t.dataset.selectedIcon=D.dataset.icon,T=!1,B(),L())}),t.querySelectorAll(".pol-id-tab").forEach(O=>{O.addEventListener("click",()=>{t.querySelectorAll(".pol-id-tab").forEach(U=>U.classList.remove("active")),O.classList.add("active");const D=O.dataset.tab==="icon";I.style.display=D?"":"none",S.style.display=D?"none":""})}),w&&w.addEventListener("click",()=>p.click()),p&&p.addEventListener("change",O=>{const D=O.target.files[0];if(!D)return;if(C.style.display="none",D.size>Ze*1024){C.textContent="⚠ File too large — max "+Ze+"KB.",C.style.display="";return}if(!D.type.startsWith("image/")){C.textContent="⚠ Must be PNG, JPG, SVG, or WebP.",C.style.display="";return}const U=new FileReader;U.onload=ee=>{M=ee.target.result,R=D,T=!0,w.classList.add("has-image"),w.innerHTML=`
                    <img class="pol-id-upload-preview" src="${M}" alt="preview" style="border:2px solid ${z()}">
                    <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                    <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Ze}KB · Best at 128×128px</div>`,E.style.display="",L()},U.readAsDataURL(D)}),E&&E.addEventListener("click",()=>{M=null,R=null,T=!1,N=null,w.classList.remove("has-image"),w.innerHTML=`
                <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                <div class="pol-id-upload-text">Click to upload logo</div>
                <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Ze}KB · Best at 128×128px</div>`,E.style.display="none",L()}),a&&m&&a.addEventListener("input",()=>{const O=a.value.length;m.textContent=O+" / "+at,m.classList.toggle("warn",O>at*.9)}),f&&o&&f.addEventListener("click",()=>{f.style.display="none",o.style.display="",b.focus()}),d&&d.addEventListener("click",()=>{o.style.display="none",f.style.display="",b.value="",$.style.display="none",b.classList.remove("has-error")}),b&&b.addEventListener("input",()=>{b.value=b.value.toUpperCase()}),h&&h.addEventListener("click",async()=>{if(h.disabled)return;$.style.display="none",b.classList.remove("has-error");const O=b.value.trim().toUpperCase();if(O.length<2||O.length>4){$.textContent="⚠ Must be 2–4 letters.",$.style.display="",b.classList.add("has-error");return}h.disabled=!0;const D=parseInt(t.dataset.currentTick)||0,{error:U}=await P.from("factions").update({abbreviation:O,last_rename_tick:D}).eq("id",e.id);if(U){$.textContent="⚠ Failed to save — try again.",$.style.display="",h.disabled=!1;return}g.textContent=O,o.style.display="none",b.value="",f.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${xe}t</span>
                </div>`,c&&(y.style.display="none",c.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${xe}t</span>
                    </div>`)}),c&&y&&c.addEventListener("click",()=>{c.style.display="none",y.style.display="",x.focus()}),u&&u.addEventListener("click",()=>{y.style.display="none",c.style.display="",x.value="",_.style.display="none",x.classList.remove("has-error")}),r&&r.addEventListener("click",async()=>{_.style.display="none",x.classList.remove("has-error");const O=x.value.trim();if(!O){_.textContent="⚠ Name cannot be empty.",_.style.display="",x.classList.add("has-error");return}if(O.length<3){_.textContent="⚠ Minimum 3 characters.",_.style.display="",x.classList.add("has-error");return}const D=parseInt(t.dataset.currentTick)||0,{error:U}=await P.from("factions").update({faction_name:O,last_rename_tick:D}).eq("id",e.id);if(U){_.textContent="⚠ Failed to save — try again.",_.style.display="";return}A.textContent=O,y.style.display="none",x.value="",c.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${xe}t</span>
                </div>`,f&&(o.style.display="none",f.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${xe}t</span>
                    </div>`)}),n&&n.addEventListener("click",async()=>{n.disabled=!0,n.textContent="Saving...";let O=N;if(T&&R){const ae=R.name.split(".").pop()||"png",me=`party-logos/${e.id}/${Date.now()}.${ae}`,{error:ke}=await P.storage.from("public-assets").upload(me,R,{contentType:R.type,upsert:!0});if(ke){console.error("Logo upload failed:",ke.message),n.textContent="⚠ Upload failed",n.disabled=!1,setTimeout(()=>{n.textContent="Save Changes"},2e3);return}const{data:Se}=P.storage.from("public-assets").getPublicUrl(me);O=Se?.publicUrl||null,N=O,R=null}const D={party_color:z(),party_logo:T?null:q(),custom_logo_url:T?O:null,party_description:a?a.value.slice(0,at):""},{data:U,error:ee}=await P.from("factions").update(D).eq("id",e.id).select("id");if(ee){Z("Save failed: "+ee.message),n.disabled=!1,n.textContent="Save Changes";return}if(!U||U.length===0){Z("Save failed: no rows updated (permission denied?)"),n.disabled=!1,n.textContent="Save Changes";return}sessionStorage.removeItem("nationhood_state"),n.textContent="✓ Saved",n.classList.add("saved"),n.disabled=!1,setTimeout(()=>{n.textContent="Save Changes",n.classList.remove("saved")},2e3)})}function ka(e,t,s,{scheduledElections:v,currentTick:l,nation:i,mySeats:a,faction:m,currentEndorsement:n}={}){const c={},y={};(s||[]).forEach(I=>{c[I.id]=I.party_color||"#888",y[I.id]=I.seats||0});function x(I){if(!I)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const S=I.results;if(!S||!S.votes)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const w=$e(I.election_tick),p=new Set(S.votes.map(T=>T.party_id)),C=(s||[]).filter(T=>!p.has(T.id)&&(y[T.id]||0)>0).map(T=>({party_id:T.id,party_name:T.faction_name,votes:0,vote_percentage:0,seats:y[T.id]||0})),E=[...S.votes,...C].map(T=>({...T,seats:y[T.party_id]??T.seats??0})).sort((T,N)=>(N.seats||0)-(T.seats||0)),M=Math.max(...E.map(T=>T.vote_percentage||0),1);let R=E.map(T=>{const N=c[T.party_id]||"#888",z=(T.vote_percentage||0).toFixed(1),q=Math.round((T.vote_percentage||0)/M*100);return`<tr>
                <td><span class="pol-el-color-dot" style="background:${N}"></span>${k(T.party_name)}</td>
                <td>${(T.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${q}%;background:${N}"></div></div></td>
                <td>${z}%</td>
                <td>${T.seats||0}</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${w}</div>
            <div class="pol-el-summary">Turnout: ${(S.turnout_pct||0).toFixed(1)}% &middot; ${(S.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Party</th><th>Votes</th><th></th><th>%</th><th>Seats</th></tr></thead>
                <tbody>${R}</tbody>
            </table>`}function r(I,S,w,p){const C=[...I].sort((R,T)=>(T.votes||0)-(R.votes||0)),E=Math.max(...C.map(R=>R.vote_percentage||0),1);let M=C.map(R=>{const T=c[R.faction_id]||"#888",N=(R.vote_percentage||0).toFixed(1),z=Math.round((R.vote_percentage||0)/E*100),q=R.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";return`<tr>
                <td><span class="pol-el-color-dot" style="background:${T}"></span>${k(R.candidate_name)}${q}</td>
                <td>${k(R.party_name)}</td>
                <td>${(R.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${z}%;background:${T}"></div></div></td>
                <td>${N}%</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${S}</div>
            <div class="pol-el-summary">Turnout: ${(w||0).toFixed(1)}% &middot; ${(p||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${M}</tbody>
            </table>`}function u(I){if(!I)return'<div class="pol-el-empty">No presidential election results yet.</div>';const S=I.results;if(!S||!S.presidential_candidates)return'<div class="pol-el-empty">No presidential election results yet.</div>';const w=$e(I.election_tick);return r(S.presidential_candidates,w,S.turnout_pct,S.total_votes_cast)}function _(I){if(!I)return'<div class="pol-el-empty">No first round results.</div>';const S=I.results,w=S?.round_1_candidates||S?.presidential_candidates;if(!w)return'<div class="pol-el-empty">No first round results.</div>';const p=$e(I.election_tick),C=S.round_1_turnout_pct??S.turnout_pct,E=S.round_1_total_votes_cast??S.total_votes_cast;return r(w,p,C,E)}function f(I){if(!I)return'<div class="pol-el-empty">No runoff results.</div>';const S=I.results,w=S?.runoff_candidates;if(!w)return'<div class="pol-el-empty">No runoff results.</div>';const p=$e(I.election_tick),C=[...w].sort((N,z)=>(z.votes||0)-(N.votes||0)),E=Math.max(...C.map(N=>N.vote_percentage||0),1);let M=C.map(N=>{const z=c[N.faction_id]||"#888",q=(N.vote_percentage||0).toFixed(1),L=Math.round((N.vote_percentage||0)/E*100),B=N.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";let j="";return N.base_votes!=null&&N.transfer_votes&&(j=`<div style="font-size:10px;color:var(--dtxt-muted);margin-top:2px">${(N.base_votes||0).toLocaleString()} direct + ${(N.transfer_votes||0).toLocaleString()} transferred</div>`),`<tr>
                <td><span class="pol-el-color-dot" style="background:${z}"></span>${k(N.candidate_name)}${B}</td>
                <td>${k(N.party_name)}</td>
                <td>${(N.votes||0).toLocaleString()}${j}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${L}%;background:${z}"></div></div></td>
                <td>${q}%</td>
            </tr>`}).join(""),R=`
            <div class="pol-el-date">${p}</div>
            <div class="pol-el-summary">Turnout: ${(S.turnout_pct||0).toFixed(1)}% &middot; ${(S.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${M}</tbody>
            </table>`;const T=C.flatMap(N=>(N.transfer_detail||[]).map(z=>({...z,to_candidate:N.candidate_name,to_faction_id:N.faction_id})));if(T.length>0){let N=T.map(z=>{const q=c[z.faction_id]||"#888",L=c[z.to_faction_id]||"#888",B=z.round1_votes>0?Math.round(z.transferred/z.round1_votes*100):0;return`<tr>
                    <td><span class="pol-el-color-dot" style="background:${q}"></span>${k(z.party_name||"")}</td>
                    <td><span class="pol-el-color-dot" style="background:${L}"></span>${k(z.to_candidate||"")}</td>
                    <td>${(z.transferred||0).toLocaleString()}</td>
                    <td>${B}%</td>
                </tr>`}).join("");R+=`
                <div style="margin-top:14px;font-family:var(--dfont-mono);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--dtxt-muted);margin-bottom:6px">Vote Transfers</div>
                <table class="pol-el-table">
                    <thead><tr><th>Eliminated Party</th><th>Votes Went To</th><th>Transferred</th><th>Rate</th></tr></thead>
                    <tbody>${N}</tbody>
                </table>`}return R}const o=t?.results?.was_runoff===!0;let b,h;o?(b=`
            <button class="pol-el-tab" data-tab="pres-r1">General Election [1st Round]</button>
            <button class="pol-el-tab" data-tab="pres-runoff">General Election [Runoff]</button>`,h=`
            <div class="pol-el-content" data-content="pres-r1">${_(t)}</div>
            <div class="pol-el-content" data-content="pres-runoff">${f(t)}</div>`):(b='<button class="pol-el-tab" data-tab="pres">General Election</button>',h=`<div class="pol-el-content" data-content="pres">${u(t)}</div>`);const d=na({isPresidentialSystem:Zt(i),scheduledElections:v,currentTick:l,playerSeats:a});let $="";d.ticksUntilWindow?$=`<div style="font-size:10px;color:var(--dtxt-muted);text-align:right;margin-top:2px">Available in ${d.ticksUntilWindow} tick${d.ticksUntilWindow!==1?"s":""}</div>`:!d.disabled&&d.ticksUntilElection&&($=`<div style="font-size:10px;color:var(--dgreen);text-align:right;margin-top:2px">${d.ticksUntilElection} tick${d.ticksUntilElection!==1?"s":""} until election</div>`);let g="",A="";if(!d.hidden){const I=n?.endorsed_party_id||null,w=(s||[]).filter(p=>p.id!==m?.id&&(p.seats||0)>0).map(p=>{const C=p.party_color||"#888",E=[p.leader_first_name,p.leader_last_name].filter(Boolean).join(" ")||"Unknown",M=p.id===I;return`<div class="pol-endorse-candidate${M?" selected":""}" data-faction-id="${p.id}">
                <span class="pol-el-color-dot" style="background:${C}"></span>
                <span class="pol-endorse-candidate-name">${k(p.faction_name||p.abbreviation)}</span>
                <span class="pol-endorse-candidate-leader">${k(E)}</span>
                <span class="pol-endorse-candidate-seats">${p.seats||0} seats</span>
                ${M?'<span style="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)">ENDORSED</span>':""}
            </div>`}).join("");g=`<div>
            <button class="pol-endorse-btn" ${d.disabled?"disabled":""}>Endorse Candidate</button>
            ${$}
        </div>`,A=`<div class="pol-endorse-panel" style="display:none">
            <div class="pol-endorse-panel-header">
                <span class="pol-section-label" style="margin-bottom:0;font-size:9px">ENDORSE A CANDIDATE</span>
                <button class="pol-endorse-panel-close">&times;</button>
            </div>
            <div class="pol-endorse-panel-desc">Select a party's candidate to endorse for the presidential election. First endorsement is free; switching costs 1 AP.</div>
            <div class="pol-endorse-candidate-list">
                ${w||'<div class="pol-el-empty">No eligible parties to endorse.</div>'}
            </div>
        </div>`}return`<div class="pol-election-box"
        data-faction-id="${m?.id||""}"
        data-nation-id="${i?.id||""}"
        data-current-tick="${l||0}">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Election Results</span>
            <div class="pol-box-header-right">${g}</div>
        </div>
        <div class="pol-box-body" style="padding:0">
        ${A}
        <div class="pol-el-tabs">
            <button class="pol-el-tab active" data-tab="parl">Parliamentary</button>
            ${b}
        </div>
        <div class="pol-el-content active" data-content="parl">${x(e)}</div>
        ${h}
        </div>
    </div>`}function Sa(){const e=document.querySelector(".pol-election-box");if(!e)return;const t=e.querySelectorAll(".pol-el-tab"),s=e.querySelectorAll(".pol-el-content");t.forEach(a=>{a.addEventListener("click",()=>{t.forEach(c=>c.classList.remove("active")),s.forEach(c=>c.classList.remove("active")),a.classList.add("active");const m=a.getAttribute("data-tab"),n=e.querySelector(`.pol-el-content[data-content="${m}"]`);n&&n.classList.add("active")})});const v=e.querySelector(".pol-endorse-btn"),l=e.querySelector(".pol-endorse-panel"),i=e.querySelector(".pol-endorse-panel-close");v&&l&&(v.addEventListener("click",()=>{const a=l.style.display!=="none";l.style.display=a?"none":"block"}),i&&i.addEventListener("click",()=>{l.style.display="none"}),l.querySelectorAll(".pol-endorse-candidate").forEach(a=>{a.addEventListener("click",async()=>{const m=a.getAttribute("data-faction-id"),n=e.getAttribute("data-faction-id"),c=Number(e.getAttribute("data-current-tick")||0),y=a.querySelector(".pol-endorse-candidate-name")?.textContent||"this party";if(confirm(`Endorse ${y}'s candidate for president? First endorsement is free; switching costs 1 AP.`)){a.style.opacity="0.5",a.style.pointerEvents="none";try{const x=await Ls(P,n,m,c);if(!x.success){alert(x.error||"Endorsement failed.");return}l.querySelectorAll(".pol-endorse-candidate").forEach(_=>{_.classList.remove("selected"),_.querySelector('[style*="color:var(--dgreen)"]')?.remove()}),a.classList.add("selected");const r=document.createElement("span");r.style.cssText="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)",r.textContent="ENDORSED",a.appendChild(r);const u=x.newAp!=null?` (${x.newAp} AP remaining)`:"";alert(`Endorsed ${y}!${u}`),l.style.display="none",x.newAp!=null&&await Be(n)}catch(x){alert("Endorsement failed: "+(x.message||"Unknown error"))}finally{a.style.opacity="",a.style.pointerEvents=""}}})}))}function Ca(){const e=document.getElementById("pol-ba-bloc-data"),t=document.getElementById("pol-ba-party-pos"),s=document.getElementById("pol-ba-party-color");if(!e||!t)return;const v=JSON.parse(e.textContent),l=JSON.parse(t.textContent),i=JSON.parse(s.textContent);if(v.length===0)return;const a={BASE:{color:"var(--dgreen)",raw:"#4ade80",dim:"rgba(74,222,128,0.08)"},LEAN:{color:"#22d3ee",raw:"#22d3ee",dim:"rgba(34,211,238,0.08)"},SWING:{color:"var(--damber)",raw:"#facc15",dim:"rgba(250,204,21,0.08)"},SKEPTICAL:{color:"#f97316",raw:"#f97316",dim:"rgba(249,115,22,0.08)"},HOSTILE:{color:"var(--dred)",raw:"#ef4444",dim:"rgba(239,68,68,0.08)"}},m=[{key:"liberty_equality",left:"Liberty",right:"Equality"},{key:"tradition_progress",left:"Tradition",right:"Progress"},{key:"security_freedom",left:"Security",right:"Freedom"},{key:"globalism_nationalism",left:"Globalism",right:"Nationalism"},{key:"individualism_collectivism",left:"Individualism",right:"Collectivism"}],n=o=>o<=10?"var(--dgreen)":o<=20?"#22d3ee":o<=35?"var(--damber)":o<=50?"#f97316":"var(--dred)",c=o=>o>=3?"●●●":o>=2?"●●":o>=1?"●":"",y=o=>o>=3?"var(--dred)":o>=2?"#f97316":o>=1?"var(--damber)":"var(--dtext-3)",x=document.getElementById("pol-ba-selected"),r=document.getElementById("pol-ba-dropdown"),u=document.getElementById("pol-ba-sel-arrow"),_=r.querySelectorAll(".pol-ba-drop-item");function f(o){const b=a[o.tier]||a.HOSTILE;document.getElementById("pol-ba-sel-dot").style.background=b.raw,document.getElementById("pol-ba-sel-name").textContent=o.name;const h=document.getElementById("pol-ba-sel-badge");h.textContent=o.tier,h.style.color=b.raw,h.style.background=b.dim,document.getElementById("pol-ba-sel-pct").textContent=o.pct+"%";const d=m.map(L=>{const B=l[L.key]||50,j=o.axes[L.key]||50,O=Math.abs(B-j),D=o.strengths[L.key]||.5;return{...L,pv:B,bv:j,dist:O,str:D,weighted:O*D}}),$=d.reduce((L,B)=>L+B.weighted,0),g=m.length*100*3,A=Math.round(Math.max(0,100-$/g*100)),I=o.pref,S=A-I,w=document.getElementById("pol-ba-alignment");w.textContent=A,w.style.color=b.raw;const p=document.getElementById("pol-ba-performance"),C=o.perf??50;p.textContent=Math.round(C),p.style.color=C>=55?"var(--dgreen)":C>=40?"var(--damber)":"var(--dred)";const E=document.getElementById("pol-ba-approval");E.textContent=I,E.style.color="var(--dtext-0)";const M=document.getElementById("pol-ba-headroom");M.textContent=(S>=0?"+":"")+S.toFixed(1),M.style.color=S>10?"var(--damber)":S>=0?"var(--dgreen)":"var(--dred)",document.getElementById("pol-ba-legend-bloc-dot").style.background=b.raw;const R=document.getElementById("pol-ba-legend-bloc-name");R.textContent=o.name,R.style.color=b.raw;const T=document.getElementById("pol-ba-axes");T.innerHTML=d.map(L=>{const B=n(L.dist),j=Math.min(L.pv,L.bv),O=L.dist;return`<div class="pol-ba-axis-row">
                <div class="pol-ba-axis-labels">
                    <span class="pol-ba-axis-label">${L.left}</span>
                    <span class="pol-ba-axis-str" style="color:${y(L.str)}">${c(L.str)}</span>
                    <span class="pol-ba-axis-label">${L.right}</span>
                </div>
                <div class="pol-ba-axis-track">
                    <div style="position:absolute;left:15%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:85%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:35%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:65%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(255,255,255,0.1)"></div>
                    ${L.dist>3?`<div class="pol-ba-axis-band" style="left:${j}%;width:${O}%;background:${B}12"></div>`:""}
                    <div class="pol-ba-axis-marker" style="left:${L.pv}%;background:${i};z-index:3">
                        <span style="color:var(--dbg-0)">${L.pv}</span>
                    </div>
                    <div class="pol-ba-axis-marker" style="left:${L.bv}%;background:${b.raw}">
                        <span style="color:var(--dbg-0)">${L.bv}</span>
                    </div>
                </div>
                <div class="pol-ba-axis-meta">
                    <span style="color:${B}">dist: ${L.dist}</span>
                    <span style="color:var(--dtext-3)">×${L.str} = <span style="color:${B};font-weight:700">${L.weighted.toFixed(0)}</span></span>
                </div>
            </div>`}).join("");const N=d.reduce((L,B)=>B.dist<L.dist?B:L,d[0]),z=d.reduce((L,B)=>B.weighted>L.weighted?B:L,d[0]);document.getElementById("pol-ba-summary").innerHTML=`<span style="color:var(--dgreen)">Closest: ${N.left}/${N.right}</span><span style="color:var(--dred)">Gap: ${z.left}/${z.right}</span>`;const q=document.getElementById("pol-ba-issues");q.innerHTML=(o.issues||[]).map(L=>`<span class="pol-ba-issue-tag">${L}</span>`).join(""),_.forEach(L=>{L.classList.toggle("active",L.getAttribute("data-bloc-id")===o.id),L.getAttribute("data-bloc-id")===o.id?L.style.borderLeftColor=b.raw:L.style.borderLeftColor="transparent"})}f(v[0]),x.addEventListener("click",()=>{const o=r.classList.toggle("open");u.classList.toggle("open",o)}),_.forEach(o=>{o.addEventListener("click",()=>{const b=o.getAttribute("data-bloc-id"),h=v.find(d=>d.id===b);h&&f(h),r.classList.remove("open"),u.classList.remove("open")})}),document.addEventListener("click",o=>{const b=document.getElementById("pol-ba-selector");b&&!b.contains(o.target)&&(r.classList.remove("open"),u.classList.remove("open"))})}function k(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}let Y=null,ze=null,Ie=null,Ue=null,Fe=null,Qe="minister",de=null,Oe=null,J=null,je=null,nt=!1,We=null,lt=null,Ve=null,gt=!1,et=null,rt=null,V=null,re=null,Ye=null,Re=!1;const Ea=[{key:"momentum",label:"MOMENTUM",color:"#f97316"},{key:"alignment",label:"ALIGNMENT",color:"#a78bfa"},{key:"appeal",label:"APPEAL",color:"#38bdf8"},{key:"tools",label:"TOOLS",color:"#6b7280"}],kt=[{id:"rally",name:"Hold a Rally",ap:Bt.AP_COST,color:"#f97316",icon:"★",category:"momentum",affects:"Momentum",desc:"Rally your supporters in a public show of strength. Random outcome that directly affects your Momentum score. A rousing success builds momentum; a gaffe costs it."},{id:"press_conference",name:"Press Conference",ap:1,color:"#fbbf24",icon:"🎤",category:"momentum",affects:"Momentum",desc:"Hold a press conference to make a public statement. Base roll: -2 to +2 Momentum. Opposition parties get +1 bonus. High-approval governing parties get +2 bonus."},{id:"attack",name:"Campaign Attack",ap:es.AP_COST,color:"#ef4444",icon:"✦",category:"momentum",affects:"Momentum",desc:"Target a rival party's record or leadership. Lowers their momentum and can hurt their election chances. More effective with evidence — but a weak attack backfires on you."},{id:"fund_think_tank",name:"Fund Think Tank",ap:ce.THINK_TANK.AP_COST,color:"#14b8a6",icon:"🏛",category:"alignment",affects:"Ideology",desc:"Fund a think tank to gradually shift the electorate's ideology on a chosen axis. Long-term investment: 8 AP upfront + 1 AP/tick for 50 ticks. Improves your Ideology pillar score."},{id:"grassroots_movement",name:"Grassroots Movement",ap:ce.GRASSROOTS.AP_COST,color:"#10b981",icon:"🌱",category:"alignment",affects:"Ideology + Momentum",desc:"Launch a grassroots campaign to shift public ideology and build momentum. Runs for 100 ticks. Drifts electorate opinion toward your position and grants +1 Momentum periodically."},{id:"pivot",name:"Ideological Pivot",ap:1,color:"#f59e0b",icon:"⟳",category:"alignment",affects:"Alignment",desc:"Shift your party's position on a chosen ideological axis. Costs escalate with each pivot (+1 AP per use, resets after 20 ticks). Reversing your current lean costs extra AP."},{id:"take_stance",name:"Take a Stance",ap:le.AP_COST,color:"#38bdf8",icon:"⚑",category:"appeal",affects:"Appeal + Ideology",desc:"Declare your party's official position on a national issue. Builds platform appeal with aligned voters and shifts your ideology. Stances decay each tick — reinforce before they fade."},{id:"outreach",name:"Community Outreach",ap:3,color:"#60a5fa",icon:"🤝",category:"appeal",affects:"Appeal",desc:"Engage directly with communities through town halls and local events. +3 Platform Appeal. Cost starts at 3 AP and escalates by +1 each use. Decays by 1 each tick you don't use it."},{id:"poll_now",name:"Poll Now",ap:1,color:"#22d3ee",icon:"📊",category:"tools",affects:"Informational",desc:"Commission a poll to update the Current Electoral Standing. 1 AP = ±5% margin, 3 AP = ±3% margin."}];let tt={},Ot={},yt=[],K=null,Q=null,ct=null,Ee=1,St=0,Ht=0,ot=0;window._selectPollTier=function(e){Ee=e;const t=document.getElementById("ca-config-panel");t&&(t.innerHTML=cs())};let ge=null,ye=null,ve=null,Ae="moderate",st=null;function La(){ze=null,Ie=null,Fe=null,Qe="minister",de=null,We=null,lt=null,Ve=null,gt=!1,K=null,Q=null,ge=null,ye=null,ve=null,Ae="moderate"}function rs(){return Y==="rally"?!0:Y==="attack"?!!ze&&!!Ie:Y==="protest"?!!de:Y==="take_stance"?!!ge&&!!ye&&!!ve&&!!Ae:Y==="poll_now"||Y==="press_conference"||Y==="outreach"?!0:Y==="fund_think_tank"||Y==="media_campaign"||Y==="grassroots_movement"?!!K&&!!Q:Y==="pivot"?!!K&&!!Q&&!tt.pivot:!1}function Rt(){if(Y==="protest"){const t=V,s=re?.current_tick||0,v=ss(t?.protest_use_count||0,t?.protest_last_use_tick,s);return is(v)}if(Y==="pivot"){const t=V,s=re?.current_tick||0;let v=t?.pivot_count||0;const l=t?.pivot_last_tick||0;s-l>=Me.ESCALATION_RESET&&(v=0);let i=Me.BASE_AP+v;if(K&&Q&&ct){const a=Number(ct[K]??0),m=Q==="right"?1:-1;(a>0&&m<0||a<0&&m>0)&&(i+=Me.REVERSE_AP_EXTRA)}return i}if(Y==="poll_now")return Ee;if(Y==="outreach"){const t=V,s=re?.current_tick||0;return Math.max(1,3+(St||0)+(t?$t("outreach",t,s):0))}if(Y==="rally"){const t=V,s=re?.current_tick||0;return Math.max(1,Bt.AP_COST+(Ht||0)+(t?$t("rally",t,s):0))}if(Y==="press_conference"){const t=V,s=re?.current_tick||0;return Math.max(1,1+(ot||0)+(t?$t("press_conference",t,s):0))}const e=kt.find(t=>t.id===Y);return e?e.id==="attack"?wt(rt?.polarization):e.ap:0}async function dt(e,t,s,v){rt=e,V=t,re=s,Ye=v;const l=document.getElementById("actions-container");if(!l)return;let i=s?.current_tick||0;if(!i){const{data:d}=await P.from("shard").select("current_tick").eq("name","Alpha Shard").single();i=d?.current_tick||0,s&&(s.current_tick=i)}const a=t,m=e,{data:n}=await P.from("factions").select("action_points, party_funds, last_action_tick").eq("id",a.id).single();n&&(a.action_points=n.action_points,a.party_funds=n.party_funds,a.last_action_tick=n.last_action_tick);const c=a.action_points??0,y=await Xt(P,m.id),x=new Set(y?.party_ids||[]);Re=a.id===m.ruling_faction_id||x.has(a.id);const{data:r}=await P.from("faction_ideology").select("*").eq("faction_id",a.id).single();ct=r;const u=(v||[]).filter(d=>d.id!==a.id);let _={},f=2;if(!Re){const{data:d}=await P.from("protest_log").select("id, status, tier, tick_called, tick_resolved, crisis_started_tick, crisis_duration, demand_label, turnout_score, effects_applied, grievance_type, grievance_data").eq("faction_id",a.id).in("status",["resolving","crisis_active"]).limit(1).maybeSingle();J=d;const $=ss(a.protest_use_count||0,a.protest_last_use_tick,i);if(f=is($),_=Ks(a,i,!0,d),d)Oe=d.status==="resolving"?"resolving":"active";else if(a.protest_locked_by)Oe="locked";else if(a.protest_cooldown_until_tick&&a.protest_cooldown_until_tick>i)Oe="cooldown";else{const{data:g}=await P.from("protest_log").select("id, tier, turnout_score, effects_applied, tick_resolved, roll_breakdown, condition_score").eq("faction_id",a.id).eq("status","resolved").gte("tick_resolved",i-1).order("tick_resolved",{ascending:!1}).limit(1).maybeSingle();g&&g.tick_resolved===i?(Oe="result",J=g):Oe=null}}if(je=null,nt=!1,!Re&&!J){const{data:d}=await P.from("protest_log").select("id, faction_id, status, tier, demand_label, grievance_type").eq("nation_id",m.id).eq("status","resolving").neq("faction_id",a.id).limit(1).maybeSingle();if(d){je=d;const{data:$}=await P.from("protest_endorsements").select("id").eq("protest_id",d.id).eq("faction_id",a.id).maybeSingle();nt=!!$}}if(et=null,Re){const{data:d}=await P.from("protest_log").select("id, tier, status, public_address_last_tick, tier7_demand, crisis_started_tick, crisis_duration").eq("nation_id",m.id).eq("status","crisis_active").order("crisis_started_tick",{ascending:!1}).limit(1).maybeSingle();et=d}const{data:o}=await P.from("campaign_actions").select("action_type, tick_performed").eq("party_id",a.id).gte("tick_performed",i-10).order("tick_performed",{ascending:!1}),{data:b}=await P.from("ideology_shift_actions").select("id, action_type, target_axis, target_direction, drift_rate, created_tick, status, band_shift_total").eq("faction_id",a.id).in("status",["active","paused","suspended"]);tt={},Ot={};const h={fund_think_tank:ce.THINK_TANK.COOLDOWN_WINDOW,media_campaign:ce.MEDIA_CAMPAIGN.COOLDOWN_WINDOW,grassroots_movement:ce.GRASSROOTS.COOLDOWN_WINDOW,take_stance:le.COOLDOWN_WINDOW,poll_now:Ts.COOLDOWN_WINDOW};for(const d of o||[]){const $=d.action_type,g=h[d.action_type];if(g){const A=d.tick_performed+g-i;A>0&&(!tt[$]||A>tt[$])&&(tt[$]=A)}d.tick_performed===i&&(Ot[$]=!0)}yt=b||[];for(const[d,$]of[["outreach",g=>St=g],["rally",g=>Ht=g],["press_conference",g=>ot=g]]){const g=(o||[]).filter(A=>A.action_type===d);if(g.length>0){const A=Math.max(...g.map(I=>I.tick_performed));$(Math.max(0,g.length-(i-A)))}else $(0)}qt(l,a,m,c,u,r,i,_,f)}function qt(e,t,s,v,l,i,a,m,n){const c=[...kt];Re||c.push({id:"protest",name:"Organise a Protest",ap:n||2,color:"#d9534f",icon:"!",category:"momentum",affects:"Momentum",desc:"Mobilize citizens against the government. A strong turnout forces a crisis and builds your momentum, but a fizzle hands the ruling party a free headline."});const y=c.find(o=>o.id===Y);let x="";if(t.pyrrhic_victory_until_tick&&t.pyrrhic_victory_until_tick>a){const o=t.pyrrhic_victory_until_tick-a;x+=`<div class="protest-pyrrhic-banner">
            <span style="font-weight:700">PYRRHIC VICTORY</span> — ${o} tick${o!==1?"s":""} remaining. AP income reduced by 2/tick.
        </div>`}if(Re&&et){const o=et,b=o.public_address_last_tick!=null?Math.max(0,Ge.PUBLIC_ADDRESS_COOLDOWN-(a-o.public_address_last_tick)):0,h=v>=Ge.PUBLIC_ADDRESS_AP&&b===0,d=b>0?" ca-item--cooldown":"",$=b>0?`${b} TICK CD`:`${Ge.PUBLIC_ADDRESS_AP} AP`;x+=`<div class="ca-item ca-item--public-address${d}${h?"":" disabled"}" data-action-id="public_address" style="${h?"":"opacity:0.5;"}">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#5b9bd5">&#9788;</span>
                    <span class="ca-item-name">Public Address</span>
                </div>
                <span class="ca-item-ap">${$}</span>
            </div>
            <div class="ca-item-desc" style="font-size:9px;color:#4a4840;">Issue a public statement calling for calm. Reduces civil unrest buildup this tick.</div>
        </div>`}const r=[];let u=null;for(const o of c)o.category&&(!u||o.category!==u.key)&&(u={key:o.category,actions:[]},r.push(u)),u&&u.actions.push(o);for(let o=0;o<r.length;o++){const b=r[o],h=Ea.find(d=>d.key===b.key);h&&(x+=`<div style="font-family:var(--dfont-mono);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${h.color};padding:8px 6px 2px;${o>0?"border-top:1px solid var(--dborder-0);margin-top:4px;":""}">${h.label}</div>`),x+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:0 2px;">';for(const d of b.actions){const $=Y===d.id;if(d.id==="protest"){x+=`<div style="grid-column:1/-1">${Ba(d,$,v,t,a)}</div>`;continue}let A=d.id==="attack"?wt(s?.polarization):d.id==="outreach"?3+(St||0):d.id==="rally"?Bt.AP_COST+(Ht||0):d.id==="press_conference"?1+(ot||0):d.ap;["outreach","press_conference","rally","attack"].includes(d.id)&&t.leader_positive_traits&&(A=Math.max(1,A+$t(d.id,t,a)));const I=d.id,S=tt[I]||0,w=S>0,p=!!Ot[I],C=yt.some(B=>B.action_type===d.id.replace("fund_","")),E=v>=A&&!w&&!p,M=$?d.color:E?d.color+"55":"var(--dtext-3)",R=$?`background:${d.color}08;`:"",T=$?`border-color:${d.color}33;`:"",N=$?d.color:"var(--dtext-0)",z=d.affects==="Momentum"?"#f97316":d.affects==="Appeal"?"#38bdf8":d.affects.includes("Ideology")?"#a78bfa":d.affects==="Alignment"?"#f59e0b":"#6b7280",q=p?`${d.name} already used this turn`:"",L=p?'<span class="ca-used-badge">USED</span>':w?`<span class="ca-cd-badge">${S} tick${S!==1?"s":""} CD</span>`:C?(()=>{const B=yt.find(j=>j.action_type===d.id.replace("fund_",""));return B?.status==="suspended"?'<span class="ca-active-badge" style="background:#d4a017">SUSPENDED</span>':B?.status==="paused"?'<span class="ca-active-badge" style="background:#f97316">PAUSED</span>':'<span class="ca-active-badge">ACTIVE</span>'})():"";x+=`<div class="ca-item${$?" selected":""}${E?"":" disabled"}${w?" ca-item--cooldown":""}${p?" ca-item--used":""}" data-action-id="${d.id}" style="border-left-color:${M};${R}${T}${E?"":"opacity:0.35;"}">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:${d.color}">${d.icon}</span>
                        <span class="ca-item-name" style="color:${N}">${k(d.name)}</span>
                        ${L}
                    </div>
                    <span class="ca-item-ap">${p?"USED":w?`${S} TICK CD`:`${A} AP`}</span>
                </div>
                <div class="ca-item-desc">${k(d.desc)}</div>
                ${p?`<div class="ca-item-used-msg">${k(q)}</div>`:`<div class="ca-item-affects" style="color:${z}">This action affects ${d.affects}</div>`}
            </div>`}x+="</div>"}let _="";if(!y)_='<div class="ca-panel"><div class="ca-panel-empty"><div class="ca-panel-empty-text">Choose an action</div></div></div>';else{if(_=`<div class="ca-panel" style="border-color:${y.color}22">`,Ue)_+=Ga(Ue);else if(y.id==="protest"&&Oe==="result"&&J)_+=Ua(J);else if(y.id==="protest"&&Oe==="resolving")_+=ja();else{_+=Aa(y,l,i,s);const o=Rt(),b=rs(),h=v>=o&&b;_+=`<div class="ca-confirm-row"><div class="ca-confirm-btn${h?"":" disabled"}" style="background:${h?y.color:"var(--dtext-3)"}" id="ca-confirm-btn">Confirm — ${o} AP</div></div>`}_+="</div>"}let f="";if(yt.length>0){const o={think_tank:ce.THINK_TANK.DURATION,media_campaign:ce.MEDIA_CAMPAIGN.DURATION+ce.MEDIA_CAMPAIGN.VISIBILITY_TICKS,grassroots_movement:ce.GRASSROOTS.DURATION},b={think_tank:"Think Tank",media_campaign:"Media Campaign",grassroots_movement:"Grassroots Movement"},h={};for(const g of se)h[g.key]=g;const d=g=>g==="think_tank"||g==="grassroots_movement";f=`<div class="ca-active-actions" style="margin-top:16px;">
            <div class="pe-header"><span class="pol-mod-title">Active Actions</span></div>
            <table class="pol-el-table" style="margin-top:4px"><thead><tr><th>Action</th><th>Activated</th><th>Effect</th><th style="text-align:right">Ticks Left</th><th></th></tr></thead><tbody>${yt.map(g=>{const A=o[g.action_type]||50,I=a-g.created_tick,S=Math.max(0,A-I),w=h[g.target_axis],p=w?`${w.leftLabel}–${w.rightLabel}`:"",C=g.target_direction==="left"?w?.leftLabel:g.target_direction==="right"?w?.rightLabel:g.target_direction==="expand"?`Expand ${p}`:g.target_direction==="narrow"?`Narrow ${p}`:g.target_direction||"?",E=g.drift_rate?`+${g.drift_rate}/tick ${C}`:C,M=$e(g.created_tick),R=g.status==="paused",T=g.status==="suspended",N=T?'<span style="color:#d4a017;font-weight:600">SUSPENDED</span>':R?'<span style="color:#f97316;font-weight:600">PAUSED</span>':`${S}`;let z="";return d(g.action_type)?R||T?z=`<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="continue" data-id="${g.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#5cb85c;color:#fff;border:none;border-radius:3px">Continue — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${g.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`:z=`<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="suspend" data-id="${g.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#c8a44e;color:#fff;border:none;border-radius:3px">Suspend — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${g.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`:z="<td></td>",`<tr>
                <td style="font-weight:600">${b[g.action_type]||g.action_type}</td>
                <td>${M}</td>
                <td>${E}</td>
                <td style="text-align:right">${N}</td>
                ${z}
            </tr>`}).join("")}</tbody></table>
        </div>`}e.innerHTML=`<div class="ca-wrap"><div class="ca-list">${x}</div>${_}</div>
    ${f}
    <div class="ca-portfolios" style="margin-top:16px;">
    </div>
    <div class="pe-container">
        <div class="pe-header"><span class="pol-mod-title">Party Events</span></div>
        <div id="party-events-feed" class="pe-feed"><div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px">Loading events...</div></div>
    </div>
    <div id="ca-stance-portfolio-container" style="margin-top:16px;"></div>`,Lt(document.getElementById("ca-stance-portfolio-container"),t,s),va(s.id,t.id),e.querySelectorAll(".ca-manage-btn").forEach(o=>{o.addEventListener("click",async b=>{if(b.stopPropagation(),o.dataset.executing)return;o.dataset.executing="true",o.style.opacity="0.4";const h=o.dataset.id,d=o.dataset.action;try{let $;if(d==="suspend"?$=await Ns(P,t.id,h,a):d==="continue"?$=await Ms(P,t.id,h,a):d==="cancel"&&($=await Os(P,t.id,s.id,h,a)),$?.success){$.newAp!=null&&(t.action_points=$.newAp);const g=await Be(t.id);g!==void 0&&(t.action_points=g),Z($.message||"Done.",!1),await dt(s,t,re,Ye)}else Z($?.message||"Action failed.")}catch($){Z("Error: "+$.message)}finally{o.dataset.executing="",o.style.opacity="1"}})}),e.querySelectorAll(".ca-item").forEach(o=>{o.addEventListener("click",async()=>{const b=o.dataset.actionId;if(b==="public_address"&&et){if(o.classList.contains("disabled")||o.dataset.executing)return;o.dataset.executing="true",o.style.opacity="0.4";try{const $=await Xs(P,t.id,s.id,et.id,a);if($.success){t.action_points=$.newAp;const g=await Be(t.id);g!==void 0&&(t.action_points=g),await dt(s,t,re,Ye)}else Z($.error||"Public Address failed."),o.style.opacity="",delete o.dataset.executing}catch($){Z("Error: "+($.message||"Unknown")),o.style.opacity="",delete o.dataset.executing}return}const h=kt.find($=>$.id===b),d=h?.id==="attack"?wt(s?.polarization):h?.ap;h&&v<d||(Y===b?Y=null:Y=b,La(),Ue=null,qt(e,t,s,v,l,i,a,m,n))})}),Wa(e,t,s,v,l,i,a,m,n)}function Aa(e,t,s,v,l,i){return e.id==="rally"?Ia():e.id==="attack"?Ra(t):e.id==="protest"?Da(v):e.id==="take_stance"?Pa():e.id==="poll_now"?cs():e.id==="fund_think_tank"?Ta():e.id==="media_campaign"?Na():e.id==="grassroots_movement"?Ma():e.id==="pivot"?Oa():e.id==="press_conference"?'<div class="ca-info-box">Hold a press conference to make a public statement. Result depends on your position and approval.<br><br><strong>Base roll:</strong> -2 to +2 Momentum<br><strong>Opposition bonus:</strong> +1<br><strong>Government bonus:</strong> +2 (if gov approval ≥ 40)</div>':e.id==="outreach"?'<div class="ca-info-box">Engage directly with communities through town halls, door-knocking, and local events.<br><br><strong>Effect:</strong> +3 Platform Appeal</div>':""}function Ia(){return'<div class="ca-info-box">Hold a rally to energize your base. Random outcome that directly affects your Momentum — can boost or backfire.</div>'}function Pa(e){let t=`<div class="ca-info-box">Declare your party's position on an issue. Stances build platform appeal but decay over time.</div>`;t+='<div class="ca-subtitle" style="margin-top:10px">Select Issue</div><div style="display:flex;flex-direction:column;gap:3px">';const s=Object.entries(we),v=st?s.sort((l,i)=>{const a=st.find(n=>n.issue_id===l[0])?.salience??0;return(st.find(n=>n.issue_id===i[0])?.salience??0)-a}):s;for(const[l,i]of v){const a=ge===l,m=st?.find(c=>c.issue_id===l),n=m?Number(m.salience).toFixed(0):"—";t+=`<div class="ca-option-chip${a?" selected":""}" data-stance-issue-id="${l}" style="padding:6px 10px;display:flex;justify-content:space-between;align-items:center;${a?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
            <span style="font-weight:600">${k(i.label)}</span>
            <span style="font-size:10px;color:var(--dtext-3)">Salience: ${n}</span>
        </div>`}if(t+="</div>",ge){const l=we[ge];if(l&&l.axes.length>0){t+='<div class="ca-subtitle" style="margin-top:12px">Choose Axis</div><div style="display:flex;flex-direction:column;gap:3px">';for(const i of l.axes){const a=se.find(n=>n.key===i);if(!a)continue;const m=ye===i;t+=`<div class="ca-option-chip${m?" selected":""}" data-stance-axis-key="${i}" style="padding:6px 10px;${m?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                    <span style="color:${a.leftColor}">${a.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="color:${a.rightColor}">${a.rightLabel}</span>
                </div>`}t+="</div>"}}if(ye){const l=se.find(i=>i.key===ye);if(l){t+='<div class="ca-subtitle" style="margin-top:12px">Choose Side</div><div style="display:flex;gap:8px">';const i=ve==="left",a=ve==="right";t+=`<div class="ca-option-chip${i?" selected":""}" data-stance-side-val="left" style="flex:1;text-align:center;padding:8px;${i?`border-color:${l.leftColor};color:${l.leftColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${l.leftLabel}</span></div>`,t+=`<div class="ca-option-chip${a?" selected":""}" data-stance-side-val="right" style="flex:1;text-align:center;padding:8px;${a?`border-color:${l.rightColor};color:${l.rightColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${l.rightLabel}</span></div>`,t+="</div>"}}if(ve){const l=se.find(m=>m.key===ye),i=ve==="left"?l?.leftLabel??"Left":l?.rightLabel??"Right",a=ve==="left"?l?.leftColor??"#ccc":l?.rightColor??"#ccc";t+='<div class="ca-subtitle" style="margin-top:12px">Intensity</div><div style="display:flex;gap:6px">';for(const[m,n]of Object.entries(le.INTENSITY)){const c=Ae===m;t+=`<div class="ca-option-chip${c?" selected":""}" data-stance-int-val="${m}" style="flex:1;text-align:center;padding:6px 4px;${c?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                <div style="font-weight:600;font-size:11px">${m}</div>
                <div style="font-size:9px;color:var(--dtext-3);margin-top:2px">Str ${n.strength} · -${n.decay_rate}/t</div>
                <div style="font-size:9px;color:${a};margin-top:1px;font-weight:600">+${n.ideology_shift} ${i}</div>
            </div>`}if(t+="</div>",Ae){const m=le.INTENSITY[Ae],n=we[ge];t+=`<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                <div style="color:var(--dtext-1);font-weight:600;margin-bottom:4px">${Ae.toUpperCase()} ${i.toUpperCase()} on ${n?.label||""}</div>
                <div style="color:${a};font-weight:700">Ideology: +${m.ideology_shift} ${i}</div>
                <div style="color:var(--dtext-3);margin-top:2px">Strength: ${m.strength} · Decay: -${m.decay_rate}/tick</div>
            </div>`}}return t}function cs(){return`<div class="ca-info-box">Commission a poll to update the Current Electoral Standing table. Higher investment produces more accurate results.</div>
    <div style="margin-top:8px;">
        <label style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);text-transform:uppercase;display:block;margin-bottom:4px;">Investment Level</label>
        <div style="display:flex;gap:6px;">
            <button class="ca-poll-tier-btn${Ee===1?" selected":""}" onclick="window._selectPollTier(1)" style="flex:1;padding:6px;background:${Ee===1?"var(--dbg-hover)":"var(--dbg-3)"};border:1px solid ${Ee===1?"var(--dtext-1)":"var(--dborder-0)"};border-radius:2px;color:var(--dtext-0);font-family:var(--dfont-mono);font-size:10px;cursor:pointer;text-align:center;">
                <strong>1 AP</strong><br><span style="color:var(--damber)">±5%</span>
            </button>
            <button class="ca-poll-tier-btn${Ee===3?" selected":""}" onclick="window._selectPollTier(3)" style="flex:1;padding:6px;background:${Ee===3?"var(--dbg-hover)":"var(--dbg-3)"};border:1px solid ${Ee===3?"var(--dtext-1)":"var(--dborder-0)"};border-radius:2px;color:var(--dtext-0);font-family:var(--dfont-mono);font-size:10px;cursor:pointer;text-align:center;">
                <strong>3 AP</strong><br><span style="color:var(--dgreen)">±3%</span>
            </button>
        </div>
    </div>
    `}function Ta(){let e=`<div class="ca-info-box">Launch a think tank to gradually drift the electorate's ideological mean on a chosen axis. ${ce.THINK_TANK.AP_COST} AP upfront + ${ce.THINK_TANK.TICK_AP_COST} AP/tick for ${ce.THINK_TANK.DURATION} ticks. Drift: 1d3 (0.1–0.3) per tick.</div>`;if(e+=Ct(),K){const t=se.find(s=>s.key===K);t&&(e+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',e+=Et(t.leftLabel,t.rightLabel,"left","right"))}return e}function Na(){const e=ce.MEDIA_CAMPAIGN;let t=`<div class="ca-info-box">Launch a media campaign to expand or narrow electorate ideological variance on a chosen axis. Phase 1: 1d5 (0.1–0.5) variance shift/tick for ${e.DURATION} ticks. Phase 2: 1d3 (1–3) momentum/tick for ${e.VISIBILITY_TICKS} ticks.</div>`;return t+=Ct(),K&&(t+='<div class="ca-subtitle" style="margin-top:12px">Variance direction</div>',t+=Et("Expand (polarize)","Narrow (centralize)","expand","narrow")),t}function Ma(){const e=ce.GRASSROOTS;let t=`<div class="ca-info-box">Launch a grassroots movement to slowly shift the electorate on a chosen axis. ${e.AP_COST} AP upfront + ${e.TICK_AP_COST} AP/tick for ${e.DURATION} ticks. Drift: 1d2 (${e.DRIFT_MIN}–${e.DRIFT_MAX})/tick. +1 momentum every ${e.VISIBILITY_INTERVAL} ticks.</div>`;if(t+=Ct(),K){const s=se.find(v=>v.key===K);s&&(t+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',t+=Et(s.leftLabel,s.rightLabel,"left","right"))}return t}function Oa(e){const t=V,s=re?.current_tick||0;let v=t?.pivot_count||0;const l=t?.pivot_last_tick||0;s-l>=Me.ESCALATION_RESET&&(v=0);const i=Math.max(0,Me.COOLDOWN-(s-l)),a=l>0&&i>0;let m=`<div class="ca-info-box">Shift your party's ideological position. Each pivot costs +1 AP more than the last (resets after ${Me.ESCALATION_RESET} ticks of no pivots). Reversing direction costs extra AP. Hold steady 20+ ticks for a conviction bonus.</div>`;if(a&&(m+=`<div style="font-family:var(--dfont-mono);font-size:11px;color:var(--damber);padding:6px 0">Cooldown: ${i} tick${i!==1?"s":""} remaining</div>`),m+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);padding:4px 0">Pivots this cycle: ${v} · Next cost: ${Me.BASE_AP+v} AP${v>0?" (escalated)":""}</div>`,m+=Ct(),K){const n=se.find(c=>c.key===K);if(n){const c=ct?Number(ct[K]??0):0,y=c>0?`+${c} (${n.rightLabel})`:c<0?`${c} (${n.leftLabel})`:"0 (Center)";if(m+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);padding:4px 0;margin-top:4px">Current position: <span style="font-weight:700">${y}</span></div>`,m+='<div class="ca-subtitle" style="margin-top:8px">Pivot direction</div>',m+=Et(n.leftLabel,n.rightLabel,"left","right"),Q){const x=Q==="right"?1:-1;(c>0&&x<0||c<0&&x>0)&&(m+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);padding:6px 0;border-top:1px solid var(--dborder-1);margin-top:8px">⚠ Reversal: +${Me.REVERSE_AP_EXTRA} AP extra</div>`)}}}return m}function Ct(){let e='<div class="ca-subtitle" style="margin-top:10px">Target axis</div><div style="display:flex;flex-direction:column;gap:4px">';for(const t of se){const s=K===t.key;e+=`<div class="ca-option-chip${s?" selected":""}" data-axis-key="${t.key}" style="padding:6px 10px;${s?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">
            <span style="font-weight:600">${t.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="font-weight:600">${t.rightLabel}</span>
            <span style="font-size:0.75em;color:var(--dtext-3);margin-left:6px">${t.description}</span>
        </div>`}return e+="</div>",e}function Et(e,t,s,v){let l='<div style="display:flex;gap:8px">';const i=Q===s,a=Q===v;return l+=`<div class="ca-option-chip${i?" selected":""}" data-direction-value="${s}" style="flex:1;text-align:center;padding:8px;${i?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${e}</div>`,l+=`<div class="ca-option-chip${a?" selected":""}" data-direction-value="${v}" style="flex:1;text-align:center;padding:8px;${a?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${t}</div>`,l+="</div>",l}function Ra(e){const t=rt?.polarization||0,s=wt(t);let l=`<div style="color:#ef4444;font-size:0.85em;margin-bottom:4px">Using this will increase Polarization by 0.25.${s>es.AP_COST?` Cost scaled to ${s} AP (polarization ${Math.round(t)}).`:""}</div><div class="ca-subtitle">Select target party</div>`;for(const i of e){const a=ze===i.id;l+=`<div class="ca-rival-card${a?" selected":""}" data-rival-id="${i.id}" style="border-left-color:${a?"#ef4444":i.party_color||"#888"};${a?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
            <span class="ca-rival-name" style="color:${a?"#ef4444":"var(--dtext-0)"}">${k(i.faction_name)}</span>
        </div>`}if(ze&&Fe){l+='<div class="ca-subtitle" style="margin-top:12px">Choose attack vector</div>';for(const i of Fe){const a=Ie===i.id;i.strength==="strong"||i.strength;const m=i.evidence_required&&i.strength==="weak",n=i.strength==="strong"?"#4ade80":i.strength==="moderate"?"#facc15":"#ef4444";l+=`<div class="ca-vector-card${a?" selected":""}${m?" disabled":""}" data-vector-id="${i.id}" style="border-left-color:${a?"#ef4444":n};${a?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="ca-vector-name">${k(i.name)}</span>
                    <span class="ca-vector-strength" style="color:${n}">${i.strength.toUpperCase()}</span>
                </div>
                <div class="ca-vector-desc">${k(i.description)}</div>
            </div>`}if(Ie){const i=Fe.find(a=>a.id===Ie);if(i){const a=Rs(i.strength),m=Math.max(...Object.values(a));l+='<div style="margin-top:10px">';const n={devastating:"#4ade80",effective:"#22d3ee",glancing:"#facc15",backfire:"#f97316",mutual:"#ef4444"};for(const c of zs){const y=a[c.id]||0,x=m>0?y/m*100:0,r=n[c.id]||"#888";l+=`<div class="ca-outcome-bar">
                        <span class="ca-outcome-name">${k(c.name)}</span>
                        <div class="ca-outcome-track"><div class="ca-outcome-fill" style="width:${x}%;background:${r}"></div></div>
                        <span class="ca-outcome-pct" style="color:${r}">${y}%</span>
                    </div>`}l+="</div>"}}}else ze&&!Fe&&(l+='<div class="ca-info-box" style="margin-top:12px">Loading evidence...</div>');return l}async function za(e,t,s){if(!We){const{data:v}=await P.from("ministries").select("ministry_key, minister_first_name, minister_last_name, minister_approval, party_id").eq("nation_id",e.id).not("party_id","is",null).order("minister_approval",{ascending:!0});We=v||[]}if(!lt){const{data:v}=await P.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",e.id);lt=(v||[]).map(l=>({...l,duration:s-(l.started_at_tick||0)}))}if(!Ve){const{data:v}=await P.from("stat_history").select("stat_name, value, tick").eq("nation_id",e.id).gte("tick",s-6).order("tick",{ascending:!0}),l={};for(const n of v||[])l[n.stat_name]||(l[n.stat_name]=[]),l[n.stat_name].push({tick:n.tick,value:n.value});const i=[];for(const[n,c]of Object.entries(l)){if(ta(n))continue;const y=c.sort((o,b)=>o.tick-b.tick),x=e[n]??y[y.length-1]?.value??0;if(!(os(n)?x>=70:x<=30))continue;const u=y[0]?.value??x,_=x-u,f=sa(x,u,n);i.push({key:n,current:x,sixTicksAgo:u,delta:_,failureScore:f,displayName:n.replace(/_/g," ").replace(/\b\w/g,o=>o.toUpperCase())})}i.sort((n,c)=>c.failureScore-n.failureScore);const{data:a}=await P.from("protest_log").select("tick_called").eq("nation_id",e.id).gte("tick_called",s-6),m=aa((a||[]).map(n=>({tick:n.tick_called})),s);Ve={failingStats:i,_fatigueLevel:m}}}function Ba(e,t,s,v,l){const i=Oe,a=e.ap,m=s>=a;if(i==="resolving")return`<div class="ca-item ca-item--protest ca-item--resolving" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#c8a64e">!</span>
                    <span class="ca-item-name" style="color:#c8a64e">${k(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#c8a64e">RESOLVING...</span>
            </div>
        </div>`;if(i==="result"&&J){const r=J.tier;if(r>=3&&r<=5){const u=as(r).toUpperCase(),_=J.roll_breakdown||{},f=_.endorsements||0,o=_.joint_bonus||0;return`<div class="ca-item ca-item--protest ca-item--result-${r}" data-action-id="protest">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:#5cb85c">!</span>
                        <span class="ca-item-name" style="color:#5cb85c">${k(e.name)}</span>
                    </div>
                    <span class="ca-item-ap" style="color:#5cb85c">TIER ${r} — ${u}</span>
                </div>
                ${f>0?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#a78bfa;margin-top:2px;padding:0 12px 4px">${f} party endorsement${f>1?"s":""} (+${o} bonus)</div>`:""}
            </div>`}}if(i==="active"&&J){const r=(J.crisis_started_tick??l)+(J.crisis_duration||6)-l,u=J.tier===6&&(v.action_points||0)>=Ge.CALL_OFF_AP,_=J.tier===7;return`<div class="ca-item ca-item--protest ca-item--active" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${k(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">ACTIVE — TIER ${J.tier}</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Your protest crisis is running. ${J.demand_label?`Demand: ${k(J.demand_label)}`:""}</div>
            <div class="protest-passive-status">Running — ${Math.max(0,r)} tick${r!==1?"s":""} remaining.</div>
            ${_?'<div class="protest-calloff-note">Tier 7 protests cannot be called off.</div>':`<div class="protest-calloff-btn${u?"":" disabled"}" onclick="window._protestCallOff()">Call Off Protest — ${Ge.CALL_OFF_AP} AP</div>`}
        </div>`}if(i==="locked")return`<div class="ca-item ca-item--protest ca-item--locked" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${k(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">LOCKED</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">A protest crisis is already underway, led by another party.</div>
        </div>`;if(i==="cooldown"){const r=(v.protest_cooldown_until_tick||0)-l;return`<div class="ca-item ca-item--protest ca-item--cooldown" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.3)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.3)">${k(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#4a4840">COOLDOWN ${Math.max(0,r)}</span>
            </div>
        </div>`}if(je&&!i){const r=!nt&&(v.action_points||0)>=1,u=nt?"ENDORSED":"ENDORSE — 1 AP";return`<div class="ca-item ca-item--protest ca-item--endorse" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#a78bfa">!</span>
                    <span class="ca-item-name" style="color:#a78bfa">${k(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#a78bfa">ENDORSEMENT</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Another opposition party has called a protest. You can endorse it to boost turnout (+15 per endorsement).</div>
            ${je.demand_label?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#f97316;padding:0 12px 4px">Demand: ${k(je.demand_label)}</div>`:""}
            <div class="protest-endorse-btn${r?"":" disabled"}" onclick="window._protestEndorse()">${u}</div>
        </div>`}return`<div class="ca-item ca-item--protest${t?" selected":""}${m?"":" disabled"}" data-action-id="protest" style="border-left-color:${t?"#d9534f":m?"rgba(217,83,79,0.55)":"var(--dtext-3)"};${t?"background:rgba(217,83,79,0.07);":""}${t?"border-color:rgba(217,83,79,0.2);":""}${m?"":"opacity:0.35;"}">
        <div class="ca-item-head">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="ca-item-icon" style="color:#d9534f">!</span>
                <span class="ca-item-name" style="color:${t?"#e06460":"var(--dtext-0)"}">${k(e.name)}</span>
            </div>
            <span class="ca-item-ap" style="color:#d9534f">${a} AP</span>
        </div>
        ${t?`<div class="ca-item-desc">${k(e.desc)}</div>`:""}
    </div>`}function Da(e,t){let s="";s+='<div class="protest-warning">Turnout is probabilistic — based on Civil Unrest, Happiness, Polarisation, and Political Violence. A fizzle hands the government a free headline. Choose your moment.</div>';const v=[{key:"civil_unrest",label:"CIVIL UNREST",value:e.civil_unrest||0},{key:"happiness",label:"HAPPINESS",value:e.happiness||50},{key:"polarization",label:"POLARISATION",value:e.polarization||0},{key:"political_violence",label:"POL VIOLENCE",value:e.political_violence||0}];s+='<div class="protest-stat-hints">';for(const n of v){const c=Js(n.key,n.value);s+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">${n.label}</span>
            <span class="protest-stat-pill__value" style="color:${c}">${Math.round(n.value)}</span>
        </div>`}const l=Ve?._fatigueLevel||{label:"...",color:"#4a4840"};s+=`<div class="protest-stat-pill">
        <span class="protest-stat-pill__label">PROTEST FATIGUE</span>
        <span class="protest-stat-pill__value" style="color:${l.color}">${l.label}</span>
    </div>`;const i=(Ye||[]).filter(n=>!(n.id===V?.id||Re)).length;if(i>0){const n=i>=2?"#a78bfa":"#4a4840";s+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">ENDORSERS</span>
            <span class="protest-stat-pill__value" style="color:${n}">${i}</span>
        </div>`}s+="</div>";const a=[{id:"minister",label:"Minister"},{id:"activeCrisis",label:"Active Crisis"},{id:"statFailure",label:"Stat Failure"}];s+='<div class="protest-tabs">';for(const n of a)s+=`<div class="protest-tab${Qe===n.id?" active":""}" data-protest-tab="${n.id}">${n.label}</div>`;s+="</div>",s+='<div class="protest-target-list" id="protest-target-list">',Qe==="minister"?s+=Ha():Qe==="activeCrisis"?s+=qa():Qe==="statFailure"&&(s+=Fa()),s+="</div>";const m=de?.label||null;return s+='<div class="protest-confirm">',s+=`<div class="protest-confirm__note">${m?`Targeting: ${k(m)}`:"Select a target above"}</div>`,s+="</div>",s}function Ha(){const e=We;if(!e)return'<div class="protest-empty">Loading ministers...</div>';if(e.length===0)return'<div class="protest-empty">No government ministers found.</div>';let t="";for(const s of e){const v=Math.round(s.minister_approval||50),l=v>50?"high":v>=35?"mid":"low",i=de?.id===s.ministry_key,a=JSON.stringify({id:s.ministry_key,type:"minister",label:`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()||s.ministry_key,demandLabel:`${(s.minister_first_name||"")+" "+(s.minister_last_name||"")} must resign.`.trim(),grievanceData:{ministryKey:s.ministry_key,approval:v,name:`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()}}).replace(/"/g,"&quot;");t+=`<div class="protest-target${i?" selected":""}" data-protest-target="${a}">
            <div>
                <div class="protest-target__name">${k(`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()||s.ministry_key)}</div>
                <div class="protest-target__meta">${k(s.ministry_key)}</div>
            </div>
            <span class="protest-target__value protest-target__value--${l}">${v}%</span>
        </div>`}return t}function qa(){const e=lt;if(!e)return'<div class="protest-empty">Loading active crises...</div>';if(e.length===0)return'<div class="protest-empty">No active crises in this nation.</div>';let t="";for(const s of e){const v=de?.id===s.id,l=s.crisis_templates?.name||"Unknown Crisis",i=s.crisis_templates?.description||"",a=s.duration||0,m=`The government must resolve the ${l} crisis.`,n=JSON.stringify({id:s.id,type:"activeCrisis",label:l,demandLabel:m,grievanceData:{crisisId:s.id,name:l,duration:a}}).replace(/"/g,"&quot;");t+=`<div class="protest-target${v?" selected":""}" data-protest-target="${n}">
            <div>
                <div class="protest-target__name">${k(l)}</div>
                <div class="protest-target__meta">${k(i?i.slice(0,80):"")}${a?" · "+a+"t active":""}</div>
            </div>
        </div>`}return t}function Fa(e,t){const s=Ve?.failingStats;if(!s)return'<div class="protest-empty">Loading stats...</div>';if(s.length===0)return'<div class="protest-empty">No stats are bad enough to protest. Stats must be critically failing (≥70 for negative stats, ≤30 for positive stats).</div>';let v="";for(const l of s){const i=de?.id===l.key,a=os(l.key)?"&#9650;":"&#9660;",m=JSON.stringify({id:l.key,type:"statFailure",label:l.displayName,demandLabel:`The government must address ${l.displayName}.`,grievanceData:{statKey:l.key,failureScore:l.failureScore,current:l.current}}).replace(/"/g,"&quot;");v+=`<div class="protest-target${i?" selected":""}" data-protest-target="${m}">
            <div>
                <div class="protest-target__name">${k(l.displayName)}</div>
                <div class="protest-target__meta">${Math.round(l.current)} <span class="protest-target__delta" style="color:#d9534f">${a} ${Math.abs(l.delta).toFixed(1)}</span></div>
            </div>
            <span class="protest-target__value protest-target__value--low">${l.failureScore.toFixed(1)}</span>
        </div>`}return v}function Ga(e){if(!e)return"";const t=!e.error&&e.success,s=t?"#4ade80":"#ef4444";let v=`<div class="ca-result-box" style="border-color:${s}33">`;if(v+=`<div class="ca-result-header" style="background:${s}08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:${s}">${k(e.headline||(t?"Action completed":"Action failed"))}</span>
        <span class="ca-result-dismiss" id="ca-dismiss-result">Dismiss</span>
    </div>`,v+='<div class="ca-result-body">',e.effects&&e.effects.length>0)for(const l of e.effects){const i=l.bloc||l.label||l.stat||"",a=l.value??l.delta??0,m=a>=0?"#4ade80":"#ef4444";v+=`<div class="ca-result-row">
                <span class="ca-result-label">${k(i)}</span>
                <span class="ca-result-val" style="color:${m}">${a>=0?"+":""}${a}</span>
            </div>`}if(e.blocEffects&&e.blocEffects.length>0)for(const l of e.blocEffects)v+=`<div class="ca-result-row">
                <span class="ca-result-label">${k(l.blocName)}</span>
                <span class="ca-result-val" style="color:#4ade80">+${l.delta}</span>
            </div>`;return e.outcomeName&&(v+=`<div class="ca-result-row">
            <span class="ca-result-label">Outcome</span>
            <span class="ca-result-val" style="color:${s}">${k(e.outcomeName)}</span>
        </div>`),v+="</div></div>",v}function Ua(e){const t=e.tier||0,s=as(t).toUpperCase(),v=e.roll_breakdown||{},l=e.condition_score??e.turnout_score??0,i=v.endorsements||0,a=v.joint_bonus||0,m=e.effects_applied||[];let n='<div class="ca-result-box" style="border-color:#5cb85c33">';if(n+=`<div class="ca-result-header" style="background:#5cb85c08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#5cb85c">Protest Result — Tier ${t}</span>
    </div>`,n+='<div class="ca-result-body">',n+=`<div class="ca-result-row">
        <span class="ca-result-label">Outcome</span>
        <span class="ca-result-val" style="color:#5cb85c">${s}</span>
    </div>`,n+=`<div class="ca-result-row">
        <span class="ca-result-label">Condition Score</span>
        <span class="ca-result-val" style="color:var(--dtext-1)">${Math.round(l)}</span>
    </div>`,Object.keys(v).length>0){n+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Score Breakdown</div>`;const y=new Set(["endorsements","joint_bonus"]);for(const[x,r]of Object.entries(v)){if(y.has(x))continue;const u=x.replace(/_/g," ").replace(/\b\w/g,o=>o.toUpperCase()),_=Number(r),f=_>=0?"#4ade80":"#ef4444";n+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${k(u)}</span>
                <span class="ca-result-val" style="color:${f};font-size:10px">${_>=0?"+":""}${_.toFixed(1)}</span>
            </div>`}n+="</div>"}i>0&&(n+=`<div class="protest-endorse-breakdown">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#a78bfa;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:2px">Coalition Support</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-1)">${i} party endorsement${i>1?"s":""} — +${a} bonus</div>
        </div>`);const c=m.filter(y=>y.stat&&y.stat!=="electoral_wound");if(c.length>0){n+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Effects on Nation</div>`;for(const y of c){const x=(y.stat||"").replace(/_/g," ").replace(/\b\w/g,_=>_.toUpperCase()),r=Number(y.delta||y.value||0),u=r>=0?"#4ade80":"#ef4444";n+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${k(x)}</span>
                <span class="ca-result-val" style="color:${u};font-size:10px">${r>=0?"+":""}${r}</span>
            </div>`}n+="</div>"}return n+="</div></div>",n}function ja(){const e=J;let t='<div class="ca-result-box" style="border-color:rgba(217,83,79,0.3)">';if(t+=`<div class="ca-result-header" style="background:rgba(217,83,79,0.06)">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#d9534f">Protest Resolving...</span>
    </div>`,t+='<div class="ca-result-body">',t+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);line-height:1.8">
        Your protest has been called and is gathering momentum. The turnout will be determined at the next tick based on national conditions.
    </div>`,e){if(e.grievance_type){const s=e.grievance_type==="minister"?"Minister":e.grievance_type==="activeCrisis"?"Active Crisis":e.grievance_type==="activePolicy"?"Active Policy":"Stat Failure";t+=`<div class="ca-result-row" style="margin-top:8px">
                <span class="ca-result-label">Grievance</span>
                <span class="ca-result-val" style="color:#f97316">${s}</span>
            </div>`}e.demand_label&&(t+=`<div class="ca-result-row">
                <span class="ca-result-label">Demand</span>
                <span class="ca-result-val" style="color:#a78bfa">${k(e.demand_label)}</span>
            </div>`)}return t+=`<div style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);margin-top:12px;font-style:italic">
        Other opposition parties can endorse this protest during this tick to boost turnout (+15 per endorsement).
    </div>`,t+="</div></div>",t}function Wa(e,t,s,v,l,i,a,m,n){const c=()=>qt(e,t,s,v,l,i,a,m,n);e.querySelectorAll("[data-rival-id]").forEach(r=>{r.addEventListener("click",async()=>{const u=r.dataset.rivalId;if(ze===u)return;ze=u,Ie=null,Fe=null,c();const _=await Bs(P,u,s.id);Fe=Ds(_),c()})}),e.querySelectorAll("[data-vector-id]").forEach(r=>{r.addEventListener("click",()=>{r.classList.contains("disabled")||(Ie=Ie===r.dataset.vectorId?null:r.dataset.vectorId,c())})}),e.querySelectorAll("[data-stance-issue-id]").forEach(r=>{r.addEventListener("click",()=>{const u=r.dataset.stanceIssueId;ge===u?ge=null:ge=u,ye=null,ve=null,Ae="moderate";const _=we[ge];_&&_.axes.length===1&&(ye=_.axes[0]),c()})}),e.querySelectorAll("[data-stance-axis-key]").forEach(r=>{r.addEventListener("click",()=>{const u=r.dataset.stanceAxisKey;ye=ye===u?null:u,ve=null,c()})}),e.querySelectorAll("[data-stance-side-val]").forEach(r=>{r.addEventListener("click",()=>{const u=r.dataset.stanceSideVal;ve=ve===u?null:u,c()})}),e.querySelectorAll("[data-stance-int-val]").forEach(r=>{r.addEventListener("click",()=>{Ae=r.dataset.stanceIntVal,c()})}),Y==="take_stance"&&!st&&!Ue&&P.from("issue_state").select("issue_id, salience").eq("nation_id",s.id).then(({data:r})=>{st=r||[],c()}),e.querySelectorAll("[data-axis-key]").forEach(r=>{r.addEventListener("click",()=>{const u=r.dataset.axisKey;K===u?K=null:K=u,Q=null,c()})}),e.querySelectorAll("[data-direction-value]").forEach(r=>{r.addEventListener("click",()=>{const u=r.dataset.directionValue;Q=Q===u?null:u,c()})}),e.querySelectorAll("[data-grassroots-demo]").forEach(r=>{r.addEventListener("click",()=>{r.dataset.grassrootsDemo,c()})}),e.querySelectorAll("[data-grassroots-band]").forEach(r=>{r.addEventListener("click",()=>{r.dataset.grassrootsBand,c()})});const y=e.querySelector("#ca-dismiss-result");y&&y.addEventListener("click",()=>{Ue=null,c()}),Y==="protest"&&!Ue&&!We&&!gt&&(gt=!0,za(s,t,a).then(()=>{gt=!1,c()}).catch(r=>{console.error("[Protest] loadProtestData failed:",r),gt=!1,We=We||[],lt=lt||[],Ve=Ve||{failingStats:[],_fatigueLevel:{label:"—",color:"#4a4840"}},c()})),e.querySelectorAll("[data-protest-tab]").forEach(r=>{r.addEventListener("click",()=>{Qe=r.dataset.protestTab,de=null,c()})}),e.querySelectorAll("[data-protest-target]").forEach(r=>{r.addEventListener("click",()=>{const u=r.dataset.protestTarget;try{const _=JSON.parse(u);de=de?.id===_.id?null:_}catch{de=null}c()})});const x=e.querySelector("#ca-confirm-btn");x&&x.addEventListener("click",()=>{x.classList.contains("disabled")||(x.classList.add("disabled"),Va(e,t,s,v,l,i,a))})}let Tt=!1;window._protestEndorse=async function(){if(!Tt&&!(!je||nt)&&confirm("Endorse this protest? Costs 1 AP and boosts turnout (+15).")){Tt=!0;try{const e=await Zs(P,V.id,rt.id,je.id,re.current_tick);if(!e.success){Z(e.error||"Endorsement failed.");return}nt=!0,V.action_points=Math.max(0,(V.action_points||0)-1);const t=await Be(V.id);t!==void 0&&(V.action_points=t),await dt(rt,V,re,Ye)}catch(e){console.error("[Protest] Endorse failed:",e),Z("Endorsement failed: "+e.message)}finally{Tt=!1}}};let Nt=!1;window._protestCallOff=async function(){if(!Nt&&J){if(J.tier===7){Z("Tier 7 protests cannot be called off.");return}if(confirm("Call off this protest? Costs "+Ge.CALL_OFF_AP+" AP. A small approval boost from moderate blocs will be applied.")){Nt=!0;try{const e=await Qs(P,V.id,J.id,re.current_tick);if(!e.success){Z(e.error||"Call-off failed.");return}V.action_points=Math.max(0,(V.action_points||0)-Ge.CALL_OFF_AP);const t=await Be(V.id);t!==void 0&&(V.action_points=t),await dt(rt,V,re,Ye)}catch(e){console.error("[Protest] Call-off failed:",e),Z("Call-off failed: "+e.message)}finally{Nt=!1}}}};async function Va(e,t,s,v,l,i,a){const m=kt.find(r=>r.id===Y)||(Y==="protest"?{id:"protest",name:"Organise a Protest",ap:Rt(),color:"#d9534f"}:null);if(!m)return;const n=Rt();if(v<n||!rs())return;const c=document.getElementById("ca-confirm-btn");c&&(c.classList.add("disabled"),c.textContent="EXECUTING...");let y;try{if(m.id==="rally")y=await Hs(P,t.id,s.id,null,a);else if(m.id==="attack")y=await qs(P,t.id,s.id,ze,Ie,a);else if(m.id==="protest"){if(!de)return;const r=de.grievanceData||{},u=de.demandLabel||"";y=await ea(P,t.id,s.id,de.type,r,u,a)}else if(m.id==="take_stance")y=await Dt(P,t.id,s.id,ge,ye,ve,Ae,a);else if(m.id==="poll_now")y=await Fs(P,t.id,s.id,a,Ee);else if(m.id==="fund_think_tank")y=await Gs(P,t.id,s.id,K,Q,a);else if(m.id==="media_campaign")y=await Us(P,t.id,s.id,K,Q,a);else if(m.id==="grassroots_movement")y=await js(P,t.id,s.id,K,Q,a);else if(m.id==="press_conference"){const{deductAP:r}=await _t(async()=>{const{deductAP:h}=await import("./config-fKhFNVuq.js");return{deductAP:h}},[]),{getTraitAPModifier:u}=await _t(async()=>{const{getTraitAPModifier:h}=await import("./elections-BTkguY9j.js").then(d=>d.a8);return{getTraitAPModifier:h}},__vite__mapDeps([0,1,2,3,4,5])),_=u("press_conference",t,a),f=Math.max(1,1+(ot||0)+_),o="Press Conference"+(_!==0?" (trait "+(_>0?"+":"")+_+")":""),b=await r(P,t.id,f,{reason:"press_conference",detail:o,tick:a});if(!b.success)y={success:!1,error:b.error||"Insufficient AP"};else{let h=Math.floor(Math.random()*5)-2;if(Re?(s.gov_approval||0)>=40&&(h+=2):h+=1,(ot||0)>0&&h!==0){const g=h>0?1:-1,A=Math.max(.25,1-ot*.25);h=Math.round(h*A),h===0&&(h=g)}const d=h>=0?"+":"",{error:$}=await P.rpc("adjust_momentum",{p_faction_id:t.id,p_delta:h,p_label:`Press Conference (${d}${h})`,p_tick:a});$&&console.warn("[PressConference] Momentum RPC failed:",$.message),await P.from("campaign_actions").insert({party_id:t.id,nation_id:s.id,action_type:"press_conference",ap_cost:f,tick_performed:a,result:{momentumDelta:h}}),y={success:!0,newAp:b.newAp,headline:"Press Conference",effects:[{label:"Press Coverage",value:`${d}${h}`}],outcomeName:`Press conference — ${d}${h} momentum`}}}else if(m.id==="outreach"){const{deductAP:r}=await _t(async()=>{const{deductAP:o}=await import("./config-fKhFNVuq.js");return{deductAP:o}},[]),{getTraitAPModifier:u}=await _t(async()=>{const{getTraitAPModifier:o}=await import("./elections-BTkguY9j.js").then(b=>b.a8);return{getTraitAPModifier:o}},__vite__mapDeps([0,1,2,3,4,5])),_=Math.max(1,3+(St||0)+u("outreach",t,a)),f=await r(P,t.id,_,{reason:"outreach",detail:"Community Outreach",tick:a});if(!f.success)y={success:!1,error:f.error||"Insufficient AP"};else{const{data:o}=await P.from("faction_electoral_standing").select("id, platform_appeal").eq("faction_id",t.id).eq("nation_id",s.id).maybeSingle();if(o){const b=Math.min(100,(Number(o.platform_appeal)||0)+3);await P.from("faction_electoral_standing").update({platform_appeal:b}).eq("id",o.id)}await P.from("campaign_actions").insert({party_id:t.id,nation_id:s.id,action_type:"outreach",ap_cost:_,tick_performed:a,result:{appealBoost:3}}),y={success:!0,newAp:f.newAp,headline:"Community Outreach",effects:[{label:"Appeal",value:"+3"}],outcomeName:"Community outreach — +3 platform appeal"}}}else if(m.id==="pivot"&&(y=await Ws(P,t.id,s.id,K,Q,a),y.success)){const{data:r}=await P.from("factions").select("pivot_count, pivot_last_tick, pivot_cycle_start_tick").eq("id",t.id).single();r&&(t.pivot_count=r.pivot_count,t.pivot_last_tick=r.pivot_last_tick,t.pivot_cycle_start_tick=r.pivot_cycle_start_tick),ct=null}}catch(r){console.error("Campaign action error:",r),Z("Action failed: "+r.message),c&&(c.classList.remove("disabled"),c.textContent=`Confirm — ${n} AP`);return}if(!y||!y.success){Z(y?.message||y?.error||"Action failed."),c&&(c.classList.remove("disabled"),c.textContent=`Confirm — ${n} AP`);return}t.action_points=y.newAp??(t.action_points??0)-n;const x=await Be(t.id);if(x!==void 0&&(t.action_points=x),Ue=y,await dt(s,t,re,Ye),m.id==="take_stance"){At(t.id,s.id);const r=document.getElementById("ca-stance-portfolio-container");r&&(r.querySelector(".sp-card")?.remove(),Lt(r,t,s))}}const _e=[{key:"security_freedom",blocKey:"axis_security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",blocKey:"axis_tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"individualism_collectivism",blocKey:"axis_individualism_collectivism",leftLabel:"Individualism",rightLabel:"Collectivism"},{key:"globalism_nationalism",blocKey:"axis_globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"liberty_equality",blocKey:"axis_liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"}],Ya=15,Ka=25;async function Xa(e,t,s,v,l){const i=document.getElementById("electorate-spread-container");if(!i)return;const{data:a}=await P.from("electorate_profile").select("*").eq("nation_id",t.id).maybeSingle();if(!a){i.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No electorate data available.</div>';return}const m=it(v,"faction_id"),n=Number(t.polarization??50),c=Number(t.stability??50),y=Number(t.ethnic_diversity??50),r=5+Math.min(100,Math.max(0,n*.9+(100-c)*.07+y*.03))/100*40,u={};for(const g of _e){const A=Number(a["ideo_mean_"+g.key]??50);u[g.key]={mean:A,zoneVariance:r}}const _=(s||[]).map(g=>{const A=m[g.id]||{},I=g.id===e.id;return{id:g.id,abbr:g.abbreviation||"??",color:g.party_color||"#888",isPlayer:I,ideology:{security_freedom:Number(A.security_freedom??0),tradition_progress:Number(A.tradition_progress??0),liberty_equality:Number(A.liberty_equality??0),globalism_nationalism:Number(A.globalism_nationalism??0),individualism_collectivism:Number(A.individualism_collectivism??0)}}}),f=m[e.id]||{},o={},b=_.filter(g=>!g.isPlayer);for(const g of b)o[g.id]=!0;let h=0;function d(g){const I=(Number(f[g]??0)+100)/2,S=u[g].mean,w=Math.abs(I-S);return w<=Ya?{cls:"es-match-yes",label:"✓ Aligned",gap:w}:w<=Ka?{cls:"es-match-part",label:"~ Partial",gap:w}:{cls:"es-match-no",label:"✗ Misaligned",gap:w}}for(const g of _e){const A=d(g.key);A.cls==="es-match-yes"||A.cls,h+=Math.max(0,100-A.gap)}Math.round(h/_e.length);function $(){let g="";for(let p=0;p<_e.length;p++){const C=_e[p],E=u[C.key],M=d(C.key),R=E.mean,T=E.zoneVariance,N=Math.max(0,R-T),z=Math.min(100,R+T)-N,q=n>=76?"deeply divided":n>=51?"polarized":n>=26?"moderately divided":"near centrist";let L;R<45?L=`Electorate is <strong>${q}</strong>, leans ${k(C.leftLabel)} — mean ${Math.round(R)} / 100`:R>55?L=`Electorate is <strong>${q}</strong>, leans ${k(C.rightLabel)} — mean ${Math.round(R)} / 100`:L=`Electorate is <strong>${q}</strong> — mean ${Math.round(R)} / 100`;let B="";for(let W=0;W<_.length;W++){const G=_[W],he=(G.ideology[C.key]+100)/2,oe=W%2===0?"":"es-below",F=!G.isPlayer&&!o[G.id]?"es-hidden":"";G.isPlayer?B+=`
                    <div class="es-pm ${F}" data-es-party="${G.id}" style="left:${he}%">
                        <div class="es-pm-bar" style="background:${G.color}"></div>
                        <div class="es-pm-ring" style="border-color:${G.color}"></div>
                        <div class="es-pm-dot" style="background:${G.color}"></div>
                        <div class="es-pm-label" style="color:${G.color}">${k(G.abbr)}</div>
                    </div>`:B+=`
                    <div class="es-pm ${F}" data-es-party="${G.id}" style="left:${he}%">
                        <div class="es-pm-bar" style="background:${G.color}"></div>
                        <div class="es-pm-dot" style="background:${G.color}"></div>
                        <div class="es-pm-label ${oe}" style="color:${G.color}">${k(G.abbr)}</div>
                    </div>`}let j="";if(M.cls==="es-match-no"){const W=(Number(f[C.key]??0)+100)/2,G=Math.min(W,R),be=Math.abs(W-R);j=`<div class="es-gap" style="left:${G}%;width:${be}%">
                    <div class="es-gap-label">${Math.round(M.gap)}pt gap</div>
                </div>`}const{zones:O,zoneForPos:D}=ts(R,E.zoneVariance);let U="";const ee={"radical-left":"rgba(239,68,68,0.10)","moderate-left":"rgba(251,191,36,0.07)",centrist:"rgba(74,222,128,0.08)","moderate-right":"rgba(251,191,36,0.07)","radical-right":"rgba(239,68,68,0.10)"},ae={"radical-left":"rgba(239,68,68,0.25)","moderate-left":"rgba(251,191,36,0.18)",centrist:"rgba(74,222,128,0.22)","moderate-right":"rgba(251,191,36,0.18)","radical-right":"rgba(239,68,68,0.25)"},me={"radical-left":"rgba(239,68,68,0.50)","moderate-left":"rgba(251,191,36,0.45)",centrist:"rgba(74,222,128,0.50)","moderate-right":"rgba(251,191,36,0.45)","radical-right":"rgba(239,68,68,0.50)"},ke=N+z;for(const W of O){if(W.width<1)continue;const G=Math.max(W.left,N),be=Math.min(W.left+W.width,ke);if(be<=G)continue;const he=(G-N)/z*100,oe=(be-G)/z*100,F=oe>8;U+=`<div class="es-zone" style="left:${he}%;width:${oe}%;background:${ee[W.id]};border-left:1px solid ${ae[W.id]};border-right:1px solid ${ae[W.id]}">
                    ${F?`<span class="es-zone-label" style="color:${me[W.id]}">${W.label}</span>`:""}
                </div>`}const Se=(Number(f[C.key]??0)+100)/2,Pe=D(Se),bt=O.find(W=>W.id===Pe)?.label||"",Ke=[];for(const W of _){if(W.isPlayer)continue;const G=(W.ideology[C.key]+100)/2;D(G)===Pe&&Ke.push(W)}let Te=bt;Pe.endsWith("-left")?Te+=" "+C.leftLabel:Pe.endsWith("-right")&&(Te+=" "+C.rightLabel);let Ce="";if(Ke.length>0){const W=Ke.map(G=>`<strong style="color:${G.color}">${k(G.abbr)}</strong>`).join(" and ");Ce=`<div class="es-split-note">You are <strong>${k(Te)}</strong> and currently splitting votes with ${W}</div>`}else Ce=`<div class="es-split-note es-split-clear">You are <strong>${k(Te)}</strong> — no parties competing in your zone</div>`;const pt=p===_e.length-1;g+=`
            <div class="es-axis-block">
                <div class="es-axis-header">
                    <div class="es-axis-info">
                        <div class="es-axis-name">${k(C.leftLabel)} / ${k(C.rightLabel)}</div>
                        <div class="es-axis-read">${L}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span class="es-zone-badge" data-zone="${Pe}">${bt}</span>
                        <div class="es-match ${M.cls}">${M.label}</div>
                    </div>
                </div>
                <div class="es-spectrum">
                    <div class="es-pole-row">
                        <span class="es-pole">${k(C.leftLabel)}</span>
                        <span class="es-pole">${k(C.rightLabel)}</span>
                    </div>
                    <div class="es-track">
                        <div class="es-center"><div class="es-center-label">Center</div></div>
                        <div class="es-variance" style="left:${N}%;width:${z}%">${U}</div>
                        <div class="es-emean" style="left:${R}%"><div class="es-emean-label">Electorate</div></div>
                        ${j}
                        ${B}
                    </div>
                </div>
                ${Ce}
            </div>
            ${pt?"":'<div class="es-div"></div>'}`}const A=_.find(p=>p.isPlayer);let I="";if(A){const p=Le(A.color,.1),C=Le(A.color,.25);I+=`<div class="es-leg-pill" style="color:${A.color};background:${p};border-color:${C}">
                <div class="es-leg-dot" style="background:${A.color}"></div>${k(A.abbr)} <span style="opacity:.55;font-size:7px">YOU</span>
            </div>`}for(const p of b){const C=Le(p.color,.1),E=Le(p.color,.25),M=o[p.id]?"":"es-dimmed";I+=`<div class="es-leg-pill ${M}" data-es-toggle="${p.id}" style="color:${p.color};background:${C};border-color:${E}">
                <div class="es-leg-dot" style="background:${p.color}"></div>${k(p.abbr)}
            </div>`}const S=[];if(n>=65){const p=n>=85?"High":"Elevated";S.push({label:`${p} Polarization`,stat:Math.round(n),color:"var(--dred)",note:"pushing the electorate to the fringes"})}if(c<=35){const p=c<=15?"Very low":"Low";S.push({label:`${p} Stability`,stat:Math.round(c),color:"var(--damber)",note:"pushing the electorate to the fringes"})}y>=65&&S.push({label:"High Ethnic Diversity",stat:Math.round(y),color:"var(--dteal)",note:"widening ideological divisions"}),n<=25&&c>=65&&S.push({label:"Stable & United",stat:null,color:"var(--dgreen)",note:"electorate is ideologically consolidated"});let w="";if(S.length>0){w='<div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 16px;border-bottom:1px solid var(--dborder-hair)">';for(const p of S)w+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:${p.color};display:flex;align-items:center;gap:4px">`,w+=`<span style="font-weight:700">${p.label}</span>`,p.stat!==null&&(w+=`<span style="opacity:0.6">(${p.stat})</span>`),w+=`<span style="color:var(--dtext-3)">— ${p.note}</span>`,w+="</div>";w+="</div>"}i.innerHTML=`
        <div class="es-page-label">Electorate Ideology Spread — <span class="es-nation">${k(t.name)}</span> · Tick ${l}</div>
        <div class="es-outer">
            <div class="es-hdr">
                <div class="es-hdr-left">
                    <div class="es-hdr-dot"></div>
                    <span class="es-hdr-title">Electorate Ideology Spread</span>
                </div>
                <div class="es-legend" id="es-legend">${I}</div>
            </div>
            ${w}
            <div class="es-body">${g}</div>
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
                        <circle cx="8" cy="8" r="5" fill="${A?A.color:"#9b7ec8"}"/>
                        <circle cx="8" cy="8" r="8" fill="none" stroke="${A?A.color:"#9b7ec8"}" stroke-width="1.5" opacity="0.55"/>
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
        </div>`,i.querySelectorAll("[data-es-toggle]").forEach(p=>{p.addEventListener("click",()=>{const C=p.getAttribute("data-es-toggle");o[C]=!o[C],p.classList.toggle("es-dimmed",!o[C]),i.querySelectorAll(`[data-es-party="${C}"]`).forEach(E=>{E.classList.toggle("es-hidden",!o[C])})})})}$()}async function Lt(e,t,s){const[v,l,i]=await Promise.all([P.from("faction_issue_stance").select("*").eq("faction_id",t.id).eq("nation_id",s.id),P.from("issue_state").select("issue_id, salience, owned_by, pioneer_faction_id").eq("nation_id",s.id),P.from("shard").select("current_tick").eq("name","Alpha Shard").single()]);v.error&&console.error("[Politics] Failed to load stances:",v.error.message),l.error&&console.error("[Politics] Failed to load issue states:",l.error.message);const a=v.data||[],m=l.data||[],n=i.data?.current_tick||0,c=it(m,"issue_id"),y=le.MAX_STANCES,x=a.length>=y;let r="";if(a.length===0)r='<div class="sp-empty">No active stances. Take a stance on an issue to build platform appeal.</div>';else for(const f of a){const o=we[f.issue_id];if(!o)continue;const b=se.find(T=>T.key===f.axis),h=f.side==="left"?b?.leftLabel:b?.rightLabel,d=f.side==="left"?b?.leftColor:b?.rightColor,$=Number(f.strength??0),g=Number(f.decay_rate??0),A=Number(f.ticks_held??0),I=$<=40,S=$<=20,w=S?"var(--dred)":I?"var(--damber)":"var(--dgreen)",p=c[f.issue_id],C=Number(p?.salience??30),E=f.ideologically_consistent?"":'<span class="sp-badge sp-badge--warn">INCONSISTENT</span>',M=f.is_pioneer?'<span class="sp-badge sp-badge--good">PIONEER</span>':"",R=I?`<span class="sp-badge sp-badge--fade">${S?"EXPIRING":"FADING"}</span>`:"";r+=`
            <div class="sp-row" data-stance-issue="${f.issue_id}">
                <div class="sp-row-top">
                    <div class="sp-row-left">
                        <span class="sp-issue-name">${k(o.label)}</span>
                        <span class="sp-side-pill" style="color:${d};border-color:${d}">${f.intensity} ${h}</span>
                        ${M}${E}${R}
                    </div>
                    <div class="sp-row-right">
                        <span class="sp-salience" title="Issue salience">Salience: ${C.toFixed(0)}</span>
                        <span class="sp-ticks">Held ${A} ticks</span>
                    </div>
                </div>
                <div class="sp-bar-row">
                    <div class="sp-bar-track">
                        <div class="sp-bar-fill" style="width:${$}%;background:${w}"></div>
                    </div>
                    <span class="sp-str-val" style="color:${w}">${$.toFixed(0)}</span>
                    <span class="sp-decay" style="color:var(--dred)">-${g}/tick</span>
                </div>
                <div class="sp-row-actions">
                    <button class="sp-btn sp-btn--reinforce" data-stance-action="reinforce" data-stance-issue="${f.issue_id}" data-stance-axis="${f.axis}" data-stance-side="${f.side}" data-stance-intensity="${f.intensity}">Reinforce</button>
                    <button class="sp-btn sp-btn--modify" data-stance-action="modify" data-stance-issue="${f.issue_id}">Modify</button>
                </div>
            </div>`}const u=`
    <div class="sp-card" style="margin-top:20px;max-width:780px;">
        <div class="sp-card-header">
            <div class="sp-card-title">Active Stance Portfolio</div>
            <div class="sp-card-count">${a.length} / ${y}</div>
        </div>
        <div class="sp-stances">${r}</div>
        <div class="sp-footer">
            <button class="sp-btn sp-btn--new${x?" sp-btn--disabled":""}" id="sp-new-stance-btn" ${x?'disabled title="Maximum stances reached (5/5)"':""}>
                + New Stance${x?" (5/5)":""}
            </button>
            <span class="sp-footer-hint">${le.AP_COST} AP · ${le.COOLDOWN_WINDOW}-tick cooldown</span>
        </div>
    </div>`;e.insertAdjacentHTML("beforeend",u),e.querySelectorAll('[data-stance-action="reinforce"]').forEach(f=>{f.addEventListener("click",async()=>{if((t.action_points||0)<le.AP_COST){Z(`Need ${le.AP_COST} AP to reinforce stance.`);return}const o=f.dataset.stanceIssue,b=f.dataset.stanceAxis,h=f.dataset.stanceSide,d=f.dataset.stanceIntensity;f.disabled=!0,f.textContent="Reinforcing...";try{const $=await Dt(P,t.id,s.id,o,b,h,d,n);if($.success){$.newAp!=null&&(t.action_points=$.newAp,V&&(V.action_points=$.newAp));const g=await Be(t.id);g!==void 0&&(t.action_points=g,V&&(V.action_points=g)),e.querySelector(".sp-card")?.remove(),await Lt(e,t,s),At(t.id,s.id)}else Z($.message||"Failed to reinforce stance."),f.disabled=!1,f.textContent="Reinforce"}catch($){Z("Reinforce failed: "+$.message),f.disabled=!1,f.textContent="Reinforce"}})}),e.querySelectorAll('[data-stance-action="modify"]').forEach(f=>{f.addEventListener("click",()=>{Kt(t,s,n,c,a,f.dataset.stanceIssue)})});const _=document.getElementById("sp-new-stance-btn");_&&!x&&_.addEventListener("click",()=>{Kt(t,s,n,c,a,null)})}function Kt(e,t,s,v,l,i){document.getElementById("stance-modal-overlay")?.remove();const a=new Set(l.map(o=>o.issue_id)),m=l.length>=le.MAX_STANCES,n=Qt.map(o=>({id:o,def:we[o],salience:Number(v[o]?.salience??30),hasStance:a.has(o)})).sort((o,b)=>b.salience-o.salience);let c="";for(const o of n){const b=!o.hasStance&&m,h=o.id===i,d=o.salience>=60?"var(--dred)":o.salience>=40?"var(--damber)":"var(--dtext-3)",$=o.def.axes.map(g=>{const A=se.find(I=>I.key===g);return A?`${A.leftLabel}/${A.rightLabel}`:g}).join(", ");c+=`
        <div class="sm-issue${h?" sm-issue--selected":""}${b?" sm-issue--disabled":""}"
             data-sm-issue="${o.id}" ${b?"":'role="button" tabindex="0"'}>
            <div class="sm-issue-top">
                <span class="sm-issue-name">${k(o.def.label)}</span>
                ${o.hasStance?'<span class="sm-issue-badge">HAS STANCE</span>':""}
            </div>
            <div class="sm-issue-meta">
                <span class="sm-issue-salience" style="color:${d}">Salience: ${o.salience.toFixed(0)}</span>
                <span class="sm-issue-axes">${$}</span>
            </div>
        </div>`}const y=`
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
                <button class="sp-btn sp-btn--new" id="sm-confirm-btn" disabled>Confirm Stance (${le.AP_COST} AP)</button>
            </div>
        </div>
    </div>`;document.body.insertAdjacentHTML("beforeend",y);let x=i,r=null,u=null,_="moderate";function f(){const o=document.getElementById("sm-config-area"),b=document.getElementById("sm-footer");if(!o||!x){o&&(o.innerHTML=""),b&&(b.style.display="none");return}const h=we[x];if(!h)return;h.axes.length===1&&!r&&(r=h.axes[0]);let d='<div class="sm-section-label" style="margin-top:14px;">Choose Axis</div><div class="sm-axis-list">';for(const S of h.axes){const w=se.find(C=>C.key===S);if(!w)continue;d+=`<div class="sm-axis-opt${S===r?" sm-axis-opt--selected":""}" data-sm-axis="${S}">
                <span style="color:${w.leftColor}">${w.leftLabel}</span> / <span style="color:${w.rightColor}">${w.rightLabel}</span>
            </div>`}d+="</div>";let $="";if(r){const S=se.find(w=>w.key===r);$=`<div class="sm-section-label" style="margin-top:14px;">Choose Side</div><div class="sm-side-list">
                <div class="sm-side-opt${u==="left"?" sm-side-opt--selected":""}" data-sm-side="left" style="border-color:${S.leftColor}">
                    <span style="color:${S.leftColor};font-weight:700">${S.leftLabel}</span>
                </div>
                <div class="sm-side-opt${u==="right"?" sm-side-opt--selected":""}" data-sm-side="right" style="border-color:${S.rightColor}">
                    <span style="color:${S.rightColor};font-weight:700">${S.rightLabel}</span>
                </div>
            </div>`}let g="";if(u){const S=se.find(C=>C.key===r),w=u==="left"?S?.leftLabel??"Left":S?.rightLabel??"Right",p=u==="left"?S?.leftColor??"#ccc":S?.rightColor??"#ccc";g='<div class="sm-section-label" style="margin-top:14px;">Intensity</div><div class="sm-intensity-list">';for(const[C,E]of Object.entries(le.INTENSITY))g+=`<div class="sm-int-opt${C===_?" sm-int-opt--selected":""}" data-sm-intensity="${C}">
                    <span class="sm-int-name">${C}</span>
                    <span class="sm-int-meta">Strength ${E.strength} · Decay ${E.decay_rate}/tick</span>
                    <span class="sm-int-meta" style="color:${p};font-weight:600">+${E.ideology_shift} ${w}</span>
                </div>`;if(g+="</div>",_){const C=le.INTENSITY[_],E=we[x];g+=`<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                    <div style="color:var(--dtext-1);font-weight:600;margin-bottom:3px">${_.toUpperCase()} ${w.toUpperCase()} on ${E?.label||""}</div>
                    <div style="color:${p};font-weight:700">Ideology: +${C.ideology_shift} ${w}</div>
                    <div style="color:var(--dtext-3);margin-top:2px">Strength: ${C.strength} · Decay: -${C.decay_rate}/tick</div>
                </div>`}}o.innerHTML=d+$+g;const A=x&&r&&u&&_;b.style.display=A?"flex":"none";const I=document.getElementById("sm-confirm-btn");I&&(I.disabled=!A),o.querySelectorAll("[data-sm-axis]").forEach(S=>{S.addEventListener("click",()=>{r=S.dataset.smAxis,u=null,f()})}),o.querySelectorAll("[data-sm-side]").forEach(S=>{S.addEventListener("click",()=>{u=S.dataset.smSide,f()})}),o.querySelectorAll("[data-sm-intensity]").forEach(S=>{S.addEventListener("click",()=>{_=S.dataset.smIntensity,f()})})}document.querySelectorAll("[data-sm-issue]").forEach(o=>{o.classList.contains("sm-issue--disabled")||o.addEventListener("click",()=>{document.querySelectorAll(".sm-issue").forEach(b=>b.classList.remove("sm-issue--selected")),o.classList.add("sm-issue--selected"),x=o.dataset.smIssue,r=null,u=null,f()})}),document.getElementById("sm-close-btn")?.addEventListener("click",()=>{document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("stance-modal-overlay")?.addEventListener("click",o=>{o.target.id==="stance-modal-overlay"&&document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("sm-confirm-btn")?.addEventListener("click",async()=>{const o=document.getElementById("sm-confirm-btn");if(!o||o.disabled)return;o.disabled=!0,o.textContent="Taking stance...";const b=await Dt(P,e.id,t.id,x,r,u,_,s);if(b.success){b.newAp!=null&&(e.action_points=b.newAp,V&&(V.action_points=b.newAp));const h=await Be(e.id);h!==void 0&&(e.action_points=h,V&&(V.action_points=h)),document.getElementById("stance-modal-overlay")?.remove();const d=document.getElementById("electorate-spread-container");d&&(d.querySelector(".sp-card")?.remove(),await Lt(d,e,t)),At(e.id,t.id)}else Z(b.message||"Failed to take stance."),o.disabled=!1,o.textContent=`Confirm Stance (${le.AP_COST} AP)`}),i&&f()}async function At(e,t){const s=document.getElementById("stance-summary-strip");if(!s)return;const{data:v}=await P.from("faction_issue_stance").select("issue_id, axis, side, intensity, strength, decay_rate, ticks_held, is_pioneer, ideologically_consistent").eq("faction_id",e).eq("nation_id",t),l=le.MAX_STANCES;if(!v||v.length===0){s.innerHTML=`<div style="color:var(--dtext-3);font-size:12px;font-family:var(--dfont-ui);padding:4px 0;">
            No active stances. Take a stance in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab.
        </div>`;return}let i="";for(const a of v){const m=we[a.issue_id];if(!m)continue;const n=se.find($=>$.key===a.axis),c=a.side==="left"?n?.leftLabel:n?.rightLabel,y=a.side==="left"?n?.leftColor:n?.rightColor,x=Number(a.strength??0),r=Number(a.decay_rate??0),u=Number(a.ticks_held??0),_=x<=20,f=x<=40,o=_?"var(--dred)":f?"var(--damber)":"var(--dgreen)",b=a.is_pioneer?'<span style="font-size:9px;color:#4ade80;font-weight:700;margin-left:4px">PIONEER</span>':"",h=a.ideologically_consistent===!1?'<span style="font-size:9px;color:#f97316;font-weight:700;margin-left:4px">INCONSISTENT</span>':"",d=f?`<span style="font-size:9px;color:${o};font-weight:700;margin-left:4px">${_?"EXPIRING":"FADING"}</span>`:"";i+=`
        <div style="padding:6px 0;${i?"border-top:1px solid var(--dborder-0);":""}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:2px">
                    <span style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${k(m.label)}</span>
                    <span style="font-size:10px;padding:1px 5px;border:1px solid ${y};border-radius:3px;color:${y};margin-left:4px">${a.intensity} ${c}</span>
                    ${b}${h}${d}
                </div>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3)">Held ${u}t</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;height:6px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">
                    <div style="width:${x}%;height:100%;background:${o};border-radius:2px"></div>
                </div>
                <span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${o};width:28px;text-align:right">${x.toFixed(0)}</span>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);width:40px;text-align:right">-${r}/t</span>
            </div>
        </div>`}s.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-family:var(--dfont-mono);font-size:11px;color:var(--dtext-2)">${v.length} / ${l}</span>
        </div>
        ${i}
        <div style="margin-top:8px;font-size:10px;color:var(--dtext-3);font-family:var(--dfont-ui)">Manage stances in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab</div>`}const Ja=[{key:"security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"},{key:"globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"individualism_collectivism",leftLabel:"Individual",rightLabel:"Collectivism"}];async function Za(e,t,s,v,l,i,a,m){const n=document.getElementById("other-parties-container");if(!n)return;const c=(s||[]).filter(d=>d.id!==e.id);if(c.map(d=>d.id),c.length===0){n.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No rival parties found.</div>';return}const y=it(v,"faction_id"),{score:x}=ns(t,m?.stats_at_start,m?.started_at_tick,a),r=it(c),u=l&&l.party_ids?l.party_ids:[],_=l?l.lead_party_id:null,f=c.map(d=>{const $=r[d.id]||{},g=y[d.id]||{},A=$.leader_first_name&&$.leader_last_name?$.leader_first_name+" "+$.leader_last_name:"Vacant",I=$.leader_age||null,S=Number(d.national_vote_share||0);let w="opposition";u.includes(d.id)&&(w=d.id===_?"governing_head":"governing_junior");const p=w.startsWith("governing"),C=Math.round((p?x:-x)*10);return{id:d.id,name:d.faction_name||"Unknown",abbreviation:d.abbreviation||"??",color:d.party_color||"#888",customLogoUrl:d.custom_logo_url||null,partyLogo:d.party_logo||null,description:d.party_description||"",status:w,foundedTick:$.founded_tick,leaderName:A,leaderAge:I,seats:d.seats||0,totalSeats:i,voteShare:S,govScore:C,ideology:{security_freedom:g.security_freedom??0,tradition_progress:g.tradition_progress??0,liberty_equality:g.liberty_equality??0,globalism_nationalism:g.globalism_nationalism??0,individualism_collectivism:g.individualism_collectivism??0},stances:[]}});let o="seats";const b={seats:(d,$)=>$.seats-d.seats,vote_share:(d,$)=>$.voteShare-d.voteShare,approval:(d,$)=>$.govScore-d.govScore,alignment:(d,$)=>{const g=Object.values(d.ideology).reduce((I,S)=>I+Math.abs(S),0);return Object.values($.ideology).reduce((I,S)=>I+Math.abs(S),0)-g}};function h(){const $=[...f].sort(b[o]).map(g=>Qa(g)).join("");n.innerHTML=`
        <div class="op-top">
            <div class="op-top-left">
                <div class="op-title">Rival Parties — ${k(t.name)}</div>
                <div class="op-note">Stance data based on observable actions. Ideology positions may be estimated.</div>
            </div>
            <div class="op-sort-row">
                <span class="op-sort-label">Sort by</span>
                <button class="op-sort-btn${o==="seats"?" active":""}" data-op-sort="seats">Seats</button>
                <button class="op-sort-btn${o==="vote_share"?" active":""}" data-op-sort="vote_share">Vote Share</button>
                <button class="op-sort-btn${o==="alignment"?" active":""}" data-op-sort="alignment">Alignment</button>
            </div>
        </div>
        <div class="op-grid">${$}</div>`,n.querySelectorAll(".op-sort-btn").forEach(g=>{g.addEventListener("click",()=>{o=g.getAttribute("data-op-sort"),h()})})}h()}function Qa(e,t){const s=e.color,v=Le(s,.12),l=Le(s,.35),i=Le(s,.5),a=Le(s,.2),m=Le(s,.06),n=zt({customLogoUrl:e.customLogoUrl,iconKey:e.partyLogo,size:32,color:s});let c,y;e.status==="governing_head"?(c="GOVERNING — HEAD",y="op-badge-green"):e.status==="governing_junior"?(c="GOVERNING — JUNIOR",y="op-badge-green"):(c="OPPOSITION",y="op-badge-red");const x=e.foundedTick!=null?$e(e.foundedTick):null,r=x?`<span class="op-badge op-badge-party" style="color:${s};border-color:${l};font-size:12px">Est. ${k(x)}</span>`:"",u=`<span class="op-badge op-badge-party" style="color:${s};border-color:${l};font-size:12px">Leader: ${k(e.leaderName)}${e.leaderAge?" ("+e.leaderAge+")":""}</span>`,_=e.description?`<div class="op-desc" style="font-size:13px;line-height:1.6">${k(e.description)}</div>`:"",f=e.govScore>2?"var(--dgreen)":e.govScore>0||e.govScore>-2?"var(--damber)":"var(--dred)",o=e.govScore>0?"+":"",b=e.status.startsWith("governing")?"GOV":"OPP";let h="";for(const w of Ja){const p=e.ideology[w.key]??0,C=(p+100)/2;let E;p>0?E=`left:50%;width:${p/2}%;background:${i}`:p<0?E=`right:50%;width:${Math.abs(p)/2}%;background:${i}`:E=`left:50%;width:0%;background:${i}`,h+=`
        <div class="op-axis">
            <div class="op-axis-poles"><span>${w.leftLabel}</span><span>${w.rightLabel}</span></div>
            <div class="op-axis-track">
                <div class="op-axis-center"></div>
                <div class="op-axis-fill" style="${E}"></div>
                <div class="op-axis-dot" style="left:${C}%;background:${a};border-color:${s}"></div>
            </div>
        </div>`}const d=Object.values(e.ideology).filter(w=>Math.abs(w)>=50).length;let $,g,A;return d>=4?($="var(--dgreen)",g="Strong Conviction",A=`${d} strong positions. Consistent ideological identity across axes.`):d<=1?($="var(--dred)",g="Weak Conviction",A=`Only ${d} strong position${d===1?"":"s"}. Centrist on most axes — voters may not trust their platform.`):($="var(--dteal)",g="Established Party",A=`${d} strong positions. Moderate ideological clarity.`),`
    <div class="op-card" style="background:linear-gradient(135deg, ${m} 0%, var(--dbg-2) 40%);border-color:${l}">
        <div class="op-card-hdr" style="border-bottom-color:${l}">
            <div class="op-logo-wrap" style="background:${v};border:1px solid ${l};border-radius:6px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${n}</div>
            <div class="op-hdr-info">
                <div class="op-name" style="color:${s}">${k(e.name)}</div>
                <div class="op-meta">
                    <span class="op-badge ${y}">${c}</span>
                    ${r}
                    ${u}
                </div>
            </div>
        </div>
        ${_}
        <div class="op-body">
            <div class="op-col-left">
                <div class="op-sec-label">Party Stats</div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Seats</span>
                    <span class="op-sr-val" style="color:${s}">${e.seats} <span style="color:var(--dtext-3);font-size:9px;font-weight:400">/ ${e.totalSeats}</span></span>
                </div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Governance <span style="font-size:8px;color:var(--dtext-3)">${b}</span></span>
                    <span class="op-sr-val" style="color:${f}">${o}${e.govScore}</span>
                </div>
                <div class="op-rule"></div>
                <div class="op-sec-label">Ideology Axes</div>
                ${h}
                <div class="op-insight" style="border-left-color:${$}">
                    <div class="op-insight-label" style="color:${$}">${g}</div>
                    <div class="op-insight-body">${A}</div>
                </div>
            </div>
            <div class="op-col-right">
                <div class="op-sec-label">Active Issue Stances</div>
                <div style="color:var(--dtxt-dim);font-size:10px;font-style:italic;padding:8px 0;">Rival stance tracking coming soon.</div>
                
            </div>
        </div>
    </div>`}function Le(e,t){const s=e.replace("#",""),v=parseInt(s.substring(0,2),16)||0,l=parseInt(s.substring(2,4),16)||0,i=parseInt(s.substring(4,6),16)||0;return`rgba(${v},${l},${i},${t})`}async function eo(e,t,s,v,l,i,a,m,n,c,y){const x=document.getElementById("elections-container");if(x)try{const r=m.includes("Governing")||m.includes("Lead")||m==="Strongman",u=ns(e,t?.stats_at_start,t?.started_at_tick,a),_=u.deltas,f=u.decayCycles,o=u.multiplier,b=u.ticksInPower,h=u.score*10;_.sort((H,X)=>X.signed-H.signed);const d=h>5?"var(--dgreen)":h>0||h>-5?"var(--damber)":"var(--dred)",$=h>0?"+":"",g=r?h:-h,A=g>5?"var(--dgreen)":g>0||g>-5?"var(--damber)":"var(--dred)",I=g>0?"+":"",S=_.map(H=>{const X=H.signed>0?"var(--dgreen)":"var(--dred)",te=H.signed>0?"▲":"▼",ie=Vs(H.key);return`<div class="elec-stat-row">
            <span class="elec-stat-name">${k(ie)}</span>
            <span class="elec-stat-start">${H.start.toFixed(1)}</span>
            <span class="elec-stat-arrow" style="color:${X}">${te}</span>
            <span class="elec-stat-now">${H.now.toFixed(1)}</span>
            <span class="elec-stat-delta" style="color:${X}">${H.raw>0?"+":""}${H.raw.toFixed(1)}</span>
        </div>`}).join(""),w=t?.stats_at_start?_.length===0?'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No stat changes recorded yet.</div>':"":'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No administration data available.</div>',p=f>0&&u.score>0?`<div class="elec-decay-note">Incumbency decay: ${((1-o)*100).toFixed(1)}% reduction (${f} cycle${f>1?"s":""})</div>`:"",C=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Governance</span>
        </div>
        <div class="elec-box-body">
            <div class="elec-score-row">
                <div class="elec-score-block">
                    <div class="elec-score-label">${r?"Gov. Score":"National Score"}</div>
                    <div class="elec-score-value" style="color:${d}">${$}${Math.round(h)}</div>
                </div>
                ${r?"":`<div class="elec-score-block">
                    <div class="elec-score-label">Your Impact (Opposition)</div>
                    <div class="elec-score-value" style="color:${A}">${I}${Math.round(g)}</div>
                </div>`}
            </div>
            ${p}
            <div class="elec-admin-info">
                <span>${k(t?.admin_name||"Government")}</span>
                <span class="elec-ticks">${b} tick${b!==1?"s":""} in power</span>
            </div>
            ${r?(()=>{const H=Number(e?.gov_approval??50),X=Math.max(-1,Math.min(1,(H-35)/30)),te=Math.max(0,1-b/20),ie=Math.round(.08*X*te*1e3)/10,pe=ie>0?"var(--dgreen)":ie<0?"var(--dred)":"var(--dtext-3)",Ne=ie>0?"+":"";return`<div class="elec-incumbency-row" style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:rgba(255,255,255,0.03);border-radius:4px;font-size:11px;">
                    <span style="color:var(--dtext-3)">Incumbency Turnout Modifier</span>
                    <span style="color:${pe};font-weight:600">${Ne}${ie.toFixed(1)}%</span>
                </div>`})():""}
            <div class="elec-stat-header">
                <span class="elec-stat-name">Stat</span>
                <span class="elec-stat-start">Start</span>
                <span class="elec-stat-arrow"></span>
                <span class="elec-stat-now">Now</span>
                <span class="elec-stat-delta">Delta</span>
            </div>
            <div class="elec-stat-list">
                ${w||S}
            </div>
        </div>
    </div>`,E=`
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
    </div>`,M=Number(v.momentum??0),T=(M*.08).toFixed(1),N=M>=60?"var(--dgreen)":M>=30?"var(--damber)":"var(--dred)",z=Math.min(100,Math.max(0,M)),q=n?.election_tick||0,L=q>a?q-a:null,B=Array.isArray(v.momentum_log)?v.momentum_log:[],j=B.length>0?B.slice(0,30).map(H=>{const X=a-(H.tick||0),te=H.delta>0?"var(--dgreen)":"var(--dred)",ie=H.delta>0?"+":"";return`<div class="elec-mom-log-row">
                <span class="elec-mom-log-label">${k(H.label||"Event")}</span>
                <span class="elec-mom-log-delta" style="color:${te}">${ie}${H.delta}</span>
                <span class="elec-mom-log-ago">${X}t ago</span>
            </div>`}).join(""):'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No momentum events yet.</div>',O=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Momentum</span>
        </div>
        <div class="elec-box-body elec-mom-body">
            <div class="elec-mom-score-row">
                <div class="elec-mom-score">
                    <span class="elec-mom-value" style="color:${N}">${Math.round(M)}</span>
                    <span class="elec-mom-max">/ 100</span>
                </div>
            </div>
            <div class="elec-mom-bar-wrap">
                <div class="elec-mom-bar" style="width:${z}%;background:${N}"></div>
            </div>
            <div class="elec-mom-decay">Decays 8%/tick — currently losing ${T}/tick</div>
            <div class="elec-mom-log-header">Recent Activity</div>
            <div class="elec-mom-log">
                ${j}
            </div>
            ${L?`<div class="elec-mom-election">Next election in ${L} tick${L!==1?"s":""}</div>`:""}
        </div>
    </div>`,D=`
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
                    <li><strong>Sponsoring a bill:</strong> +2 momentum for the sponsoring party.</li>
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
    </div>`,{data:U,error:ee}=await P.from("electorate_profile").select("*").eq("nation_id",e.id).maybeSingle();ee&&console.error("[Elections] electorate_profile fetch failed:",ee);const ae=it(i,"faction_id"),me=ae[v.id]||{},ke=Number(e.polarization??50),Se=Number(e.stability??50),Pe=Number(e.ethnic_diversity??50),Ke=5+Math.min(100,Math.max(0,ke*.9+(100-Se)*.07+Pe*.03))/100*40;let Te="",Ce=0;if(U)for(const H of _e){const te=(Number(me[H.key]??0)+100)/2,ie=Number(U["ideo_mean_"+H.key]??50),pe=Ke,{zones:Ne,zoneForPos:It}=ts(ie,pe),De=It(te),Pt=De.includes("left")?H.leftLabel:De.includes("right")?H.rightLabel:"",He=De==="centrist"?"Centrist":De.includes("moderate")?"Moderate":"Radical",ht=De==="centrist"?"Centrist":`${He} ${Pt}`,Xe=Ys(te,ie,pe),xt=(Xe*100).toFixed(1);Ce+=Xe;const ft=[...Ne].sort((ue,ut)=>ut.width-ue.width)[0],ps=ft.id.includes("left")?H.leftLabel:ft.id.includes("right")?H.rightLabel:"",vs=ft.id==="centrist"?"Centrist":ft.id.includes("moderate")?"Moderate":"Radical",ms=ft.id==="centrist"?"Centrist":`${vs} ${ps}`,fs=Xe>=.6?"var(--dgreen)":Xe>=.3?"var(--damber)":"var(--dred)",us=(Number(U["salience_"+H.key]??.2)*100).toFixed(0),Je=Math.max(0,ie-pe),Gt=Math.min(100,ie+pe),qe=Gt-Je,gs={"radical-left":"rgba(239,68,68,0.10)","moderate-left":"rgba(251,191,36,0.07)",centrist:"rgba(74,222,128,0.08)","moderate-right":"rgba(251,191,36,0.07)","radical-right":"rgba(239,68,68,0.10)"},Ut={"radical-left":"rgba(239,68,68,0.25)","moderate-left":"rgba(251,191,36,0.18)",centrist:"rgba(74,222,128,0.22)","moderate-right":"rgba(251,191,36,0.18)","radical-right":"rgba(239,68,68,0.25)"},ys={"radical-left":"rgba(239,68,68,0.50)","moderate-left":"rgba(251,191,36,0.45)",centrist:"rgba(74,222,128,0.50)","moderate-right":"rgba(251,191,36,0.45)","radical-right":"rgba(239,68,68,0.50)"};let jt="";for(const ue of Ne){if(ue.width<1)continue;const ut=Math.max(ue.left,Je),Wt=Math.min(ue.left+ue.width,Gt);if(Wt<=ut)continue;const xs=(ut-Je)/qe*100,Vt=(Wt-ut)/qe*100,_s=Vt>8;jt+=`<div class="elec-ideo-zone" style="left:${xs}%;width:${Vt}%;background:${gs[ue.id]};border-left:1px solid ${Ut[ue.id]};border-right:1px solid ${Ut[ue.id]}">
                    ${_s?`<span class="elec-ideo-zone-label" style="color:${ys[ue.id]}">${ue.label}</span>`:""}
                </div>`}const bs=qe>0?(te-Je)/qe*100:50,hs=qe>0?(ie-Je)/qe*100:50;Te+=`
            <div class="elec-ideo-axis">
                <div class="elec-ideo-axis-header">
                    <span class="elec-ideo-axis-name">${k(H.leftLabel)} / ${k(H.rightLabel)}</span>
                    <span class="elec-ideo-salience">Salience: ${us}%</span>
                </div>
                <div class="elec-ideo-bar-wrap">
                    <div class="elec-ideo-bar-labels">
                        <span>${k(H.leftLabel)}</span>
                        <span>${k(H.rightLabel)}</span>
                    </div>
                    <div class="elec-ideo-bar-track">
                        <div class="elec-ideo-var-band" style="left:${Je}%;width:${qe}%">
                            ${jt}
                            <div class="elec-ideo-mean-marker" style="left:${hs}%"></div>
                            <div class="elec-ideo-player-marker" style="left:${bs}%"></div>
                        </div>
                    </div>
                    <div class="elec-ideo-bar-labels" style="margin-bottom:12px">
                        <span></span>
                    </div>
                </div>
                <div class="elec-ideo-details">
                    <span class="elec-ideo-position">Your Position: <strong>${k(ht)}</strong></span>
                    <span class="elec-ideo-capture" style="color:${fs}">Voter Capture: <strong>${xt}%</strong></span>
                </div>
                <div class="elec-ideo-voters">Most voters are <strong>${k(ms)}</strong></div>
            </div>`}const pt=U?(Ce/_e.length*100).toFixed(1):"—",G=`
    <div class="elec-box elec-box--wide">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--purple"></div>
            <span class="elec-box-title">Ideology</span>
            <span class="elec-ideo-avg">Avg. Capture: <strong style="color:${Ce/_e.length>=.6?"var(--dgreen)":Ce/_e.length>=.3?"var(--damber)":"var(--dred)"}">${pt}%</strong></span>
        </div>
        <div class="elec-box-body">
            ${U?Te:'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No electorate data available.</div>'}
        </div>
    </div>`,be=`
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
    </div>`,he={};for(const H of se)he[H.key]=H;const oe=y||0,F=(l||[]).reduce((H,X)=>H+(X.seats||0),0),ne=F>0?oe/F:0,fe=(c||[]).filter(H=>H.is_active!==!1),vt=ae[v.id]||{};let mt="";if(fe.length===0){const H=(ne*100).toFixed(0);mt=`<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:16px 4px;text-align:center">
            No active caucuses.<br>Caucuses form when your party holds <strong>50%+</strong> of parliamentary seats.<br>
            <span style="margin-top:6px;display:inline-block">You currently hold <strong>${oe}</strong> / ${F} seats (${H}%).</span>
        </div>`}else{let H=0;for(const X of fe){const te=he[X.dominant_axis],ie=Math.round(oe*X.seat_share);let pe=0;if(te){const xt=vt[X.dominant_axis]??0,Ft=X.wing_end==="right"?xt:-xt;pe=Math.max(-3,Math.min(3,Math.round(Ft/15)))}const Ne=Math.max(1,ie+pe);H+=Ne;const It=pe>0?` <span style="color:var(--dgreen);font-size:9px">(+${pe})</span>`:pe<0?` <span style="color:var(--dred);font-size:9px">(${pe})</span>`:"",De=te?(X.wing_end==="left"?te.leftLabel:te.rightLabel)+" Wing":X.dominant_axis,Pt=te?X.wing_end==="left"?te.leftColor:te.rightColor:"var(--dtext-3)",He=Number(X.relationship_score??50),ht=He>=60?"var(--dgreen)":He>=30?"var(--damber)":"var(--dred)",Xe=He<30?'<span style="font-family:var(--dfont-mono);font-size:9px;color:var(--dred);font-weight:700;letter-spacing:0.5px;margin-left:4px">VOLATILE</span>':"";mt+=`
            <div style="padding:8px 0;border-bottom:1px solid var(--dborder-1)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${k(X.name)}</div>
                        <div style="font-family:var(--dfont-mono);font-size:10px;color:${Pt};margin-top:2px">${De}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:var(--dtext-0)">${Ne} seat${Ne!==1?"s":""}${It}</div>
                        <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
                            <div style="width:50px;height:5px;background:var(--dborder-1);border-radius:3px;overflow:hidden">
                                <div style="width:${He}%;height:100%;background:${ht};border-radius:3px;transition:width 0.3s"></div>
                            </div>
                            <span style="font-family:var(--dfont-mono);font-size:10px;color:${ht}">${He}</span>
                            ${Xe}
                        </div>
                    </div>
                </div>
            </div>`}mt=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);margin-bottom:6px;display:flex;justify-content:space-between">
            <span>${fe.length} active caucus${fe.length!==1?"es":""}</span>
            <span>${H} / ${oe} seats</span>
        </div>`+mt}const ds=`
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
            ${C}
            ${E}
            ${O}
            ${D}
        </div>
        <div class="elec-row" style="margin-top:20px">
            ${G}
            ${be}
            ${ds}
        </div>
    </div>`}catch(r){console.error("[Elections Tab] Render error:",r),x.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">Failed to load election data. Please refresh.</div>'}}
