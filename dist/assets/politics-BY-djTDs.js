const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/elections-DdjUo3Fx.js","assets/config-fKhFNVuq.js","assets/government-types-BwzErBjP.js","assets/ideology-5B3UuuGK.js","assets/stats-DqgGwtpW.js","assets/government-structure-3HZRNYFO.js"])))=>i.map(i=>d[i]);
import{_ as L}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as zs,g as Me,_ as ht}from"./common-B3gRt7tv.js";import{c as Dt,P as Bs,b as Ds,g as Rt}from"./party-icons-CJ7uQoDE.js";import{t as he}from"./utils-C2W-HleY.js";import{l as Hs,f as ns}from"./government-structure-3HZRNYFO.js";import{a as ls,h as Fs,i as rs}from"./government-types-BwzErBjP.js";import{initGameConfigForNation as qs,switchPartyEndorsement as Gs}from"./config-fKhFNVuq.js";import{d as Us,D as js,G as Ws,H as cs,J as xe,K as Vs,S as ne,L as ce,R as Ht,M as ds,O as $t,w as _t,Q as Ks,T as Ys,U as Xs,V as Ie,W as Js,X as Zs,Y as Qs,Z as ea,_ as ta,$ as sa,a0 as Ft,a1 as aa,a2 as oa,a3 as ia,a4 as na,a5 as la,f as ra,a6 as ca,a7 as da}from"./elections-DdjUo3Fx.js";import{a as te}from"./ideology-5B3UuuGK.js";import{g as ps,c as pa,P as qe,e as va,d as vs,f as ma,i as ms,h as fa,j as ua,k as ga,l as fs,m as ya,n as ba,o as ha}from"./protest-Be8bxDpI.js";import{N as xa,s as _a}from"./stats-DqgGwtpW.js";const os=6;function $a({isPresidentialSystem:e=!1,scheduledElections:t=[],currentTick:s=0,playerSeats:p=0}={}){const i=(t||[]).filter(d=>d&&d.election_type==="presidential"&&Number.isFinite(Number(d.election_tick))).sort((d,g)=>Number(d.election_tick)-Number(g.election_tick))[0]||null;let n="",a=null,v=null,l=!1;return e?i?(a=Number(i.election_tick)-Number(s),a<=0?(n="This election has already fired; endorsement is locked for this cycle.",a=null):a>os?(v=a-os,n="No presidential election is in the eligible window."):Number(p)<=0&&(n="Your party is not eligible to endorse in this cycle.")):n="No presidential election is in the eligible window.":(l=!0,n="No presidential election is in the eligible window."),{disabled:!!n,disabledReason:n,ticksUntilElection:a,ticksUntilWindow:v,hidden:l}}function vt(e,t="id"){const s={};for(const p of e||[])s[p[t]]=p;return s}function us(e,t,s,p){if(!t)return{score:0,deltas:[],decayCycles:0,multiplier:1};let i=0,n=0;const a=[];for(const h of xa){const r=_a(h);if(r===0)continue;const m=Number(t[h]??0),_=Number(e[h]??0),f=_-m;if(f===0)continue;const o=f*r;a.push({key:h,start:m,now:_,raw:f,signed:o,dir:r}),i+=o,n++}let v=n>0?i/n:0;const l=p-(s||p),d=Math.floor(l/12),g=v>0?Math.pow(.95,d):1;return v*=g,{score:v,deltas:a,decayCycles:d,multiplier:g,ticksInPower:l}}function Z(e,t=!0){const s=document.getElementById("pol-toast");s&&s.remove();const p=document.createElement("div");p.id="pol-toast",p.style.cssText=`position:fixed;top:20px;right:20px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:13px;font-family:var(--dfont-mono);max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s;${t?"background:#2d1517;color:#f87171;border:1px solid #7f1d1d;":"background:#1a2e1a;color:#86efac;border:1px solid #14532d;"}`,p.textContent=e,document.body.appendChild(p),setTimeout(()=>{p.style.opacity="0",setTimeout(()=>p.remove(),300)},4e3)}zs("politics",async e=>{const{nation:t,faction:s,shard:p}=e;if(!t||!s){document.getElementById("content-area").innerHTML='<div class="pol-loading">No nation or party data available.</div>';return}await qs(L,t.id);const i=s,n=p?.current_tick||0,{data:a}=await L.from("factions").select("id, seats, national_vote_share, faction_name, abbreviation, party_color, standing, loyalty, last_seen_tick, leader_first_name, leader_last_name, leader_age, founded_tick, custom_logo_url, party_logo, party_description, momentum, momentum_log").eq("nation_id",t.id).eq("faction_type","party"),v=(a||[]).map(S=>S.id),{data:l}=v.length>0?await L.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism").in("faction_id",v):{data:[]},{data:d}=v.length>0?await L.from("faction_electoral_standing").select("faction_id, party_approval, visibility, ideological_alignment, raw_appeal").eq("nation_id",t.id).in("faction_id",v):{data:[]},g={};for(const S of d||[])g[S.faction_id]=S;for(const S of a||[]){const B=g[S.id];S._governance=Math.round(Number(B?.party_approval||0)),S._pillarMomentum=Math.round(Number(B?.visibility||0)),S._ideology=Math.round(Number(B?.ideological_alignment||0)),S._rawAppeal=Math.round(Number(B?.raw_appeal||0)*10)/10}const{currentSeats:h}=await Hs(L,t.id,a||[],i.id),r=(a||[]).reduce((S,B)=>S+(B.seats||0),0),m=h,{data:_}=await L.from("elections").select("election_tick, results").eq("nation_id",t.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle();let f=Number(i.national_vote_share||0).toFixed(1),o=null,y=null;if(_){o=he(_.election_tick);const S=_.results,W=(S?.votes||(Array.isArray(S)?S:[])).find(M=>M.party_id===i.id);if(W&&typeof W.vote_percentage=="number"&&(f=W.vote_percentage.toFixed(1)),Array.isArray(S)){const M=S.find(D=>D.party_id===i.id);if(M&&typeof M.seats_won=="number"){const D=typeof M.seats_before=="number"?M.seats_before:null;D!==null&&(y=m-D)}}}const b=await ns(L,t.id);let c="Opposition";b&&b.party_ids&&b.party_ids.includes(i.id)&&(c=b.lead_party_id===i.id?"Lead — Governing":"Governing Coalition");const{data:x}=await L.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",t.id),{data:$}=await L.from("issue_state").select("issue_id, salience").eq("nation_id",t.id),T={};for(const S of $||[])T[S.issue_id]=S;let{data:A}=await L.from("elections").select("election_tick, election_type").eq("nation_id",t.id).eq("status","scheduled").gt("election_tick",n).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(!A){const S=Number(t.parliamentary_term_ticks)||24;A={election_tick:n+S,election_type:"parliamentary"}}const C=ka(i.id,t.name),w={whipFirst:i.whip_first_name||C.whipFirst,whipLast:i.whip_last_name||C.whipLast},{data:u}=await L.from("nations_history").select("gov_approval").eq("nation_id",t.id).eq("tick",n-1).maybeSingle(),I=u?.gov_approval??null,{data:E}=await L.from("presidents").select("id, faction_id, first_name, last_name, age, ideology, trait, trait_upside, trait_downside, elected_tick, term_ends_tick, is_active, terms_served").eq("nation_id",t.id).eq("is_active",!0).order("elected_tick",{ascending:!1}).limit(1).maybeSingle(),{data:O}=await L.from("administrations").select("id, admin_name, government_type, started_at_tick, president_name, president_party_id, president_party_name, stats_at_start").eq("nation_id",t.id).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),{data:z}=await L.from("elections").select("election_tick, results, election_type").eq("nation_id",t.id).eq("status","completed").eq("election_type","parliamentary").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:P}=await L.from("elections").select("election_tick, results, election_type").eq("nation_id",t.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:N}=await L.from("elections").select("election_tick, election_type").eq("nation_id",t.id).eq("status","scheduled").gt("election_tick",n).order("election_tick",{ascending:!0}),{data:R}=await L.from("caucus_factions").select("id, name, dominant_axis, wing_end, seat_share, relationship_score").eq("party_id",i.id).eq("is_active",!0),{data:F}=await L.from("party_endorsement_preferences").select("endorsed_party_id").eq("endorsing_party_id",i.id).maybeSingle();Ca(i,t,{shard:p,totalSeats:r,mySeats:m,voteSharePct:f,lastElectionDate:o,seatDelta:y,role:c,coalition:b,currentTick:n,officerNames:w,allParties:a,allPartyIdeologies:l,activeCrises:x,nextElection:A,prevApproval:I,lastParliamentary:z,lastPresidential:P,scheduledElections:N,president:E,administration:O,caucusFactions:R,currentEndorsement:F,issueStateMapInit:T})});function wa(e){const t=e.replace(/-/g,""),p=20+parseInt(t.substring(16,24),16)%51;return Math.max(0,p-10)}function ka(e,t=""){const{firstNames:s,lastNames:p}=Us(t),i=e.replace(/-/g,""),n=parseInt(i.substring(8,12),16),a=parseInt(i.substring(12,16),16);return{whipFirst:s[n%s.length],whipLast:p[a%p.length]}}async function Ca(e,t,s){const{shard:p,totalSeats:i,mySeats:n,voteSharePct:a,lastElectionDate:v,seatDelta:l,role:d,officerNames:g,allParties:h,allPartyIdeologies:r,coalition:m,activeCrises:_,currentTick:f,nextElection:o,prevApproval:y,lastParliamentary:b,lastPresidential:c,scheduledElections:x,president:$,administration:T,caucusFactions:A,currentEndorsement:C,issueStateMapInit:w}=s,u=e,I=e.party_color||"#ffcc00",E=Dt({customLogoUrl:e.custom_logo_url,iconKey:e.party_logo,size:36,color:I}),O=he(e.founded_tick),z=d.includes("Governing")||d.includes("Lead"),P=d.includes("Lead")?"Governing":d,N=d==="Strongman"?"pol-role-strongman":z?"pol-role-gov":"pol-role-opp",R=(r||[]).find(q=>q.faction_id===e.id);let F=null,S=null;if(R){const q=te.map(oe=>({ax:oe,score:R[oe.key]??0})).sort((oe,ve)=>Math.abs(ve.score)-Math.abs(oe.score));q.length>0&&q[0].score!==0&&(F=q[0].score<0?q[0].ax.left:q[0].ax.right),q.length>1&&q[1].score!==0&&(S=q[1].score<0?q[1].ax.left:q[1].ax.right)}F||(F=e.ideology_value_1||null),S||(S=e.ideology_value_2||null);function B(q){if(!q)return"";const oe="pol-ideo-"+q.toLowerCase(),ve=q.charAt(0).toUpperCase()+q.slice(1).toLowerCase();return`<div class="pol-ideo-box">
            <span class="pol-ideo-label">Ideology</span>
            <span class="pol-ideo-value ${oe}">${ve}</span>
        </div>`}let W,M;W=e.leader_first_name&&e.leader_last_name?e.leader_first_name+" "+e.leader_last_name:"Vacant",M=e.leader_age?`(${e.leader_age})`:"";const D=e.leader_ideology||F,U=D?`<span class="pol-leader-ideo pol-ideo-${D.toLowerCase()}">${D.charAt(0).toUpperCase()+D.slice(1).toLowerCase()}</span>`:"",ae=e.electability??wa(e.id),le=js(ae);let _e="";if(l!==null&&l!==0){const q=l>0?"+":"";_e=`<span class="pol-stat-delta ${l>0?"up":"down"}">${q}${l}</span>`}const mt=`
    <div class="pol-page-tabs">
        <button class="pol-page-tab active" data-page-tab="politics">Politics</button>
        <button class="pol-page-tab" data-page-tab="actions">Actions</button>
        <button class="pol-page-tab" data-page-tab="elections">Your Party</button>
        <button class="pol-page-tab" data-page-tab="other-parties">Other Parties</button>
    </div>
    <div class="pol-page-content active" data-page-content="politics">
    ${`
    <div class="pol-page">
        <div class="pol-section-label">Politics</div>

        <div class="pol-columns">
        ${za(t,m,h,f,y,$,T)}
        <div class="pol-party-card">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--green"></div>
            <span class="pol-box-label">Your Party</span>
        </div>
        <div class="pol-box-body">
        <div class="pol-header">
            <div class="pol-logo">${E}</div>
            <div class="pol-header-info">
                <div class="pol-party-name">${k(e.faction_name)} <span style="color:var(--dtext-3);font-size:11px;font-weight:400;font-style:italic;margin-left:4px;">${ls(t)}</span></div>
                <div class="pol-meta-row">
                    <span class="pol-role-badge ${N}">${k(P.toUpperCase())}</span>
                    <span class="pol-established">Est. ${O}</span>
                    <span class="pol-leader-badge">Leader: ${k(W)} ${M}</span>
                </div>
            </div>
        </div>
        <div class="pol-ideo-row">
            ${B(F)}
            ${B(S)}
        </div>
        <hr class="pol-divider">
        <div class="pol-leader-section">
            <div class="pol-leader-header">
                <span class="pol-sub-label">Leader</span>
                <button class="pol-leadership-btn" onclick="window.location.href='party-leadership.html'">Party Leadership &rarr;</button>
            </div>
            <div class="pol-leader-name">${k(W)} <span class="pol-leader-age">${M}</span> <span class="pol-leader-electability"><span class="pol-leader-electability-label">Electability: </span><span style="color:${le.color}">${le.label}</span></span></div>
            ${U}
        </div>
        <div class="pol-officers-row">
            <div class="pol-officer">
                <div class="pol-officer-label">Party Whip</div>
                <div class="pol-officer-name">${k(g.whipFirst+" "+g.whipLast)}</div>
            </div>
        </div>
        <hr class="pol-divider">
        <div class="pol-stats-row">
            <div class="pol-stat-block">
                <div class="pol-stat-label">Seats</div>
                <div class="pol-stat-value">${n}<span class="pol-stat-total">/${i}</span>${_e}</div>
            </div>
        </div>
        ${Ta(A,n,R)}
        </div>
        </div>
        ${Na(h,m,t,e.id)}
        ${Oa(h,i,f,o,null,e.id)}
        </div>

        <div class="pol-row-2">
        ${Ra(t,_,f,w)}
        <div class="pol-ideology-box" id="stance-summary-container">
            <div class="pol-ideo-header"><div class="pol-box-dot pol-box-dot--orange"></div><span class="pol-mod-title">Stances</span></div>
            <div class="pol-box-body"><div id="stance-summary-strip"></div></div>
        </div>
        ${Ba(e,f)}
        </div>

        <div class="pol-row-3">
        ${Ha(b,c,h,{scheduledElections:x,currentTick:f,nation:t,mySeats:n,faction:u,currentEndorsement:C})}

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
    
    <div class="pol-page-content" data-page-content="elections">
        <div id="elections-container" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading election data...</div>
        </div>
    </div>
    
    <div class="pol-page-content" data-page-content="other-parties">
        <div id="other-parties-container" class="op-page" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading rival parties...</div>
        </div>
    </div>`;document.getElementById("content-area").innerHTML=mt;let ze=!1,ft=!1,Lt=!1;document.querySelectorAll(".pol-page-tab").forEach(q=>{q.addEventListener("click",()=>{document.querySelectorAll(".pol-page-tab").forEach(Be=>Be.classList.remove("active")),document.querySelectorAll(".pol-page-content").forEach(Be=>Be.classList.remove("active")),q.classList.add("active");const oe=q.getAttribute("data-page-tab"),ve=document.querySelector(`.pol-page-content[data-page-content="${oe}"]`);ve&&ve.classList.add("active"),oe==="actions"&&!ze&&(ze=!0,nt(t,e,p,h)),oe==="other-parties"&&!ft&&(ft=!0,vo(e,t,h,r,m,i,f,T)),oe==="elections"&&!Lt&&(Lt=!0,fo(t,T,m,e,h,r,f,d,o,A,n))})}),window.innerWidth>860&&document.querySelectorAll(".pol-admin-box, .pol-party-card, .pol-parliament-box, .pol-forecast-box, .pol-coalition-box, .pol-mood-box, .pol-ideology-box, .pol-identity-box, .pol-election-box, .pol-blocs-box").forEach(q=>{q.style.height="450px"}),Da(e),Fa(),qa(),At(e.id,t.id),La(t.id,e.id);const Se=document.getElementById("pol-disband-party-btn");Se&&Se.addEventListener("click",async()=>{if(confirm("Are you sure you want to disband your party? This is permanent — your party will be removed from the game after the next tick.")&&confirm("This cannot be undone. Disband your party?")){Se.disabled=!0,Se.textContent="Disbanding...";try{await Ws(L,t.id,e.id,f),sessionStorage.removeItem("nationhood_state"),await L.auth.signOut(),window.location.href="login.html"}catch(q){Z(q.message||"Failed to disband party."),Se.disabled=!1,Se.textContent="Disband Party"}}})}const Sa=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function Ea(e){return`${Sa[e%12]} ${2e3+Math.floor(e/12)}`}async function gs(e,t,s,{limit:p=80,detailed:i=!0}={}){const n=document.getElementById(e);if(!n)return;const{data:a,error:v}=await L.from("activity_log").select("id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at").eq("nation_id",t).order("tick",{ascending:!1}).order("created_at",{ascending:!1}).limit(p);if(v||!a||a.length===0){n.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px;padding:8px">No party events yet.</div>';return}const l=[...new Set(a.map(m=>m.faction_id))],{data:d}=await L.from("factions").select("id, faction_name, abbreviation, party_color").in("id",l),g=vt(d);let h="",r=null;for(const m of a){m.tick!==r&&(r=m.tick,h+=`<div class="pe-tick-sep">${Ea(m.tick)}</div>`);const _=g[m.faction_id],f=m.faction_id===s,o=f?"You":_?.abbreviation||"???",y=_?.party_color||"var(--dtext-2)",b=m.outcome==="success"?"var(--dgreen)":m.outcome==="backfire"?"var(--dred)":m.outcome==="failure"?"var(--damber)":"var(--dtext-3)";h+=`<div class="pe-item${f?" pe-item--you":""}">
            <div class="pe-item-row">
                <span class="pe-item-party" style="color:${y}">${k(o)}</span>
                <span class="pe-item-label">${k((m.action_label||m.action_type).replace(/_/g," "))}</span>
                ${i&&m.ap_spent?`<span class="pe-item-ap">${m.ap_spent} AP</span>`:""}
                ${m.outcome?`<span class="pe-item-outcome" style="color:${b}">${k(m.outcome)}</span>`:""}
            </div>
            ${i&&m.description?`<div class="pe-item-desc">${k(m.description)}</div>`:""}
        </div>`}n.innerHTML=h}function Aa(e,t){return gs("party-events-feed",e,t,{limit:80,detailed:!0})}function La(e,t){return gs("gov-card-party-events",e,t,{limit:40,detailed:!1})}function Ia(e,t,s){const p=e||"#888",i=t||(s?s.substring(0,2).toUpperCase():"??");return`<div class="pol-mini-logo" style="background:${p}">${k(i)}</div>`}function Pa(e,t){if(t?.head_of_state_title&&!rs(t))return t.head_of_state_title;if(!e)return"Head of Gov.";const s=e.toLowerCase();return s==="democracy"||s.includes("parliament")?"PM":s.includes("president")?"President":"Head of Gov."}function Ta(e,t,s){if(!e||e.length===0)return"";const p={};for(const v of te)p[v.key]=v;let i=0,n="";for(const v of e){const l=p[v.dominant_axis],d=l?(v.wing_end==="left"?l.leftLabel:l.rightLabel)+" Wing":v.dominant_axis,g=l?v.wing_end==="left"?l.leftColor:l.rightColor:"var(--text-dim)",h=Math.round(t*v.seat_share);let r=0;if(s&&l){const b=s[v.dominant_axis]??0,c=v.wing_end==="right"?b:-b;r=Math.max(-3,Math.min(3,Math.round(c/15)))}const m=Math.max(1,h+r);i+=m;const _=r>0?` <span style="color:var(--green);font-size:0.7rem;">(+${r})</span>`:r<0?` <span style="color:var(--red);font-size:0.7rem;">(${r})</span>`:"",f=v.relationship_score,o=f>=60?"var(--green)":f>=30?"var(--amber)":"var(--red)",y=f<30?' <span style="color:var(--red);font-size:0.7rem;">VOLATILE</span>':"";n+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-dim);">
            <div>
                <div style="font-size:0.85rem;font-weight:500;">${k(v.name)}</div>
                <div style="font-size:0.7rem;color:${g};opacity:0.8;">${d}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <div style="font-size:0.85rem;font-weight:600;white-space:nowrap;">${m} seats${_}</div>
                <div style="display:flex;align-items:center;gap:4px;">
                    <div style="width:50px;height:5px;background:var(--border-dim);border-radius:3px;overflow:hidden;">
                        <div style="width:${f}%;height:100%;background:${o};border-radius:3px;"></div>
                    </div>
                    <span style="font-size:0.65rem;color:var(--text-dim);">${f}</span>
                    ${y}
                </div>
            </div>
        </div>`}const a=e.length;return`<hr class="pol-divider">
        <div style="padding:0 0 4px;">
            <div class="pol-sub-label" style="margin-bottom:2px;">Internal Caucuses</div>
            <div style="font-size:0.7rem;color:var(--text-dim);margin-bottom:6px;">${a} active caucus${a!==1?"es":""} · ${i} / ${t} seats</div>
            ${n}
        </div>`}function Na(e,t,s,p){const i=e||[],n=i.reduce((w,u)=>w+(u.seats||0),0),a=Math.ceil(n/2);let v,l;v=new Set(t?.party_ids||[]),l=t?.lead_party_id||null;const d=i.filter(w=>v.has(w.id)),g=i.filter(w=>!v.has(w.id)),h=d.reduce((w,u)=>w+(u.seats||0),0),r=g.reduce((w,u)=>w+(u.seats||0),0),m=[...i].sort((w,u)=>(u.seats||0)-(w.seats||0)),_=n>0?m.map(w=>{const u=(w.seats||0)/n*100;if(u<=0)return"";const I=w.party_color||"#888";return`<div class="pol-seat-segment" style="width:${u.toFixed(2)}%;background:${I}"></div>`}).join(""):"",o=`<div class="pol-majority-line" style="left:${(n>0?a/n*100:50).toFixed(2)}%"></div>`,y=Pa(s?.government_type,s);function b(w){const u=Ia(w.party_color,w.abbreviation,w.faction_name),I=k(w.faction_name||"Unknown"),E=w.seats||0,O=w.id===p,P=[w.id===l?`<span class="pol-hog-pill">${k(y)}</span>`:"",O?'<span class="pol-you-pill">YOU</span>':""].filter(Boolean).join(" ");return`<div class="pol-parl-party-row">
            ${u}
            <span class="pol-parl-party-name">${I}</span>
            ${P}
            <span class="pol-parl-party-seats">${E}</span>
        </div>`}const c=d.length>0?d.sort((w,u)=>(u.seats||0)-(w.seats||0)).map(b).join(""):"",x=g.length>0?g.sort((w,u)=>(u.seats||0)-(w.seats||0)).map(b).join(""):"",$=h-a,T=$>=0,A=T?"pol-margin-positive":"pol-margin-negative",C=T?`+${$} above majority`:`${Math.abs($)} below majority`;return`
        <div class="pol-parliament-box">
            <div class="pol-parl-header">
                <div class="pol-box-dot pol-box-dot--amber"></div>
                <span class="pol-parl-title">Parliament</span>
                <div class="pol-box-header-right"><span class="pol-parl-seats-count">${n} seats</span></div>
            </div>
            <div class="pol-box-body">
            <div class="pol-seat-bar-wrap">
                <div class="pol-seat-bar">${_}</div>
                ${o}
            </div>

            <div class="pol-section-header">
                <span class="pol-section-title">Governing Coalition</span>
                <span class="pol-section-seats">${h} seats</span>
            </div>
            ${c}

            <div class="pol-section-header">
                <span class="pol-section-title">Opposition</span>
                <span class="pol-section-seats">${r} seats</span>
            </div>
            ${x}

            <div class="pol-margin-row ${A}">
                <span class="pol-margin-dot"></span>
                <span>${C}</span>
            </div>
            </div>
        </div>`}function Ma(e){return e>=60?"var(--dred)":e>=40?"var(--damber)":"var(--dgreen)"}function Oa(e,t,s,p,i,n){const d=p?.election_tick||0,g=d>s?d-s:0,h=d>0&&g<=12,r=Math.ceil(t/2),m=g<=5?"CAMPAIGN SEASON":g<=10?"MID CYCLE":"EARLY CYCLE",_=g<=5?"var(--dred)":g<=10?"var(--damber)":"var(--dgreen)";if(!h){const u=d>0?g-12:0,I=d>0?`Forecast available in <span style="color:var(--dtxt-secondary);font-weight:700">${u} ticks</span><br>Polling begins 12 ticks before election`:"No election currently scheduled",E=d>0?he(d):null;return`
            <div class="pol-forecast-box">
                <div class="pol-fc-header">
                    <div class="pol-box-dot pol-box-dot--blue"></div>
                    <span class="pol-mod-title">Election Forecast</span>
                </div>
                <div class="pol-box-body">
                ${E?`<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${E}</span></div>`:""}
                <div class="pol-fc-empty">
                    <div class="pol-fc-empty-title">Insufficient polling data</div>
                    <div class="pol-fc-empty-detail">${I}</div>
                </div>
                </div>
            </div>`}const f=Math.max(1,12-(12-g)),y=(e||[]).filter(u=>Number(u.national_vote_share||0)<=0?!1:u.last_seen_tick!=null?s-u.last_seen_tick<12:s-(u.founded_tick||0)<12).map(u=>{const I=Number(u.national_vote_share||0),E=Math.round(I/100*t);return{...u,estSeats:E,momentum:Number(u.momentum??0),governance:u._governance??0,pillarMomentum:u._pillarMomentum??0,ideology:u._ideology??0,rawAppeal:u._rawAppeal??0}}).sort((u,I)=>I.estSeats-u.estSeats),b=f>=10?"VERY LOW":f>=7?"LOW":f>=5?"MODERATE":f>=3?"HIGH":"VERY HIGH",c=f>=10?"var(--dred)":f>=7||f>=5?"var(--damber)":f>=3?"#22d3ee":"var(--dgreen)",x=(12-g)/12*100,$=y.map(u=>{const I=Math.max(u.estSeats-f,0),E=Math.min(u.estSeats+f,t),O=I/t*100,z=E/t*100,P=u.party_color||"#888",N=u.abbreviation||(u.faction_name||"??").substring(0,2).toUpperCase(),R=u.id===n,F=u.momentum>0?"var(--dgreen)":u.momentum<0?"var(--dred)":"var(--dtxt-muted)",S=u.momentum>0?"▲":u.momentum<0?"▼":"—",B=u.momentum!==0?`${S}${Math.abs(u.momentum)}`:S,W=t>0?r/t*100:50,M=Re=>Re>=60?"var(--dgreen)":Re>=35?"var(--damber)":"var(--dred)",D=M(u.governance),U=M(u.pillarMomentum),ae=M(u.ideology),le=((u.governance||0)*.35).toFixed(1),_e=((u.pillarMomentum||0)*.25).toFixed(1),Oe=((u.ideology||0)*.3).toFixed(1);return`<div class="pol-fc-party">
            <div class="pol-fc-party-header">
                <div class="pol-fc-party-left">
                    <div class="pol-fc-party-dot" style="background:${P}"></div>
                    <span class="pol-fc-party-abbr" style="color:${P}">${k(N)}</span>
                    ${R?'<span class="pol-ideo-legend-you">YOU</span>':""}
                </div>
                <div class="pol-fc-party-right">
                    <span class="pol-fc-momentum" style="color:${F}">${B}</span>
                    <span class="pol-fc-range">${I}–${E}</span>
                    <span class="pol-fc-seats-label">seats</span>
                </div>
            </div>
            <div class="pol-fc-3p">
                <div class="pol-fc-3p-row">
                    <span class="pol-fc-3p-label">GOV</span>
                    <span class="pol-fc-3p-pct">35%</span>
                    <div class="pol-fc-3p-bar"><div class="pol-fc-3p-fill" style="width:${u.governance}%;background:${D}"></div></div>
                    <span class="pol-fc-3p-val" style="color:${D}">${u.governance}</span>
                    <span class="pol-fc-3p-contrib">${le}</span>
                </div>
                <div class="pol-fc-3p-row">
                    <span class="pol-fc-3p-label">MOM</span>
                    <span class="pol-fc-3p-pct">25%</span>
                    <div class="pol-fc-3p-bar"><div class="pol-fc-3p-fill" style="width:${u.pillarMomentum}%;background:${U}"></div></div>
                    <span class="pol-fc-3p-val" style="color:${U}">${u.pillarMomentum}</span>
                    <span class="pol-fc-3p-contrib">${_e}</span>
                </div>
                <div class="pol-fc-3p-row">
                    <span class="pol-fc-3p-label">IDEO</span>
                    <span class="pol-fc-3p-pct">30%</span>
                    <div class="pol-fc-3p-bar"><div class="pol-fc-3p-fill" style="width:${u.ideology}%;background:${ae}"></div></div>
                    <span class="pol-fc-3p-val" style="color:${ae}">${u.ideology}</span>
                    <span class="pol-fc-3p-contrib">${Oe}</span>
                </div>
                <div class="pol-fc-3p-score">
                    <span class="pol-fc-3p-score-label">SCORE</span>
                    <span class="pol-fc-3p-score-val">${u.rawAppeal}</span>
                </div>
            </div>
            <div class="pol-fc-band">
                <div class="pol-fc-band-fill" style="left:${O.toFixed(1)}%;width:${(z-O).toFixed(1)}%;background:${P}22;border-color:${P}33"></div>
                <div class="pol-fc-maj-line" style="left:${W.toFixed(1)}%"></div>
            </div>
        </div>`}).join(""),T=y.find(u=>u.id===n),A=y.find(u=>u.id!==n);let C="";if(T&&A){const u=Math.max(T.estSeats-f,0),I=Math.min(T.estSeats+f,t),E=Math.max(A.estSeats-f,0),O=Math.min(A.estSeats+f,t),z=Math.max(0,Math.min(I,O)-Math.max(u,E)),P=I-u,N=P>0?Math.round(z/P*100):0,R=T.abbreviation||"YOU",F=A.abbreviation||"RIVAL",S=N>70?"TOO CLOSE TO CALL":N>30?"COMPETITIVE":N>0?T.estSeats>A.estSeats?`LEANING ${R}`:`LEANING ${F}`:T.estSeats>A.estSeats?`${R} LEADS`:`${F} LEADS`,B=N>70?"var(--dred)":N>30?"var(--damber)":"var(--dgreen)",W=N>70?`${R} and ${F} seat ranges fully overlap. Outcome is uncertain.`:N>30?"Bands are narrowing. Late campaigns could decide the race.":N>0?"Leading party is emerging, but the gap is not yet decisive.":"Ranges no longer overlap. Leader is identifiable.";C=`
            <div class="pol-fc-status" style="background:${B}08;border-color:${B}">
                <div class="pol-fc-status-header">
                    <span class="pol-fc-status-label" style="color:${B}">${k(S)}</span>
                    <span class="pol-fc-status-overlap">${N}% overlap</span>
                </div>
                <div class="pol-fc-status-desc">${W}</div>
            </div>`}const w=d>0?he(d):null;return`
        <div class="pol-forecast-box">
            <div class="pol-fc-header">
                <div class="pol-box-dot pol-box-dot--blue"></div>
                <span class="pol-mod-title">Election Forecast</span>
                <div class="pol-box-header-right"><span class="pol-fc-phase" style="color:${_};background:${_}15">${m}</span></div>
            </div>
            <div class="pol-box-body">
            ${w?`<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${w}</span></div>`:""}
            <div class="pol-fc-countdown">
                <div>
                    <span class="pol-fc-ticks-big" style="color:${_}">${g}</span>
                    <span class="pol-fc-ticks-label">ticks</span>
                </div>
                <div style="text-align:right">
                    <div style="display:flex;align-items:center;gap:4px;justify-content:flex-end">
                        <span class="pol-fc-margin-label">Margin:</span>
                        <span class="pol-fc-margin-val" style="color:${c}">±${f} seats</span>
                    </div>
                    <span class="pol-fc-conf-badge" style="color:${c};background:${c}15">${b} CONFIDENCE</span>
                </div>
            </div>
            <div class="pol-fc-conf-bar">
                <div class="pol-fc-conf-fill" style="width:${x.toFixed(0)}%;background:${c}"></div>
            </div>
            ${$}
            <div class="pol-fc-maj-legend">
                <div class="pol-fc-maj-dash"></div>
                <span class="pol-fc-maj-text">Majority: ${r} seats</span>
            </div>
            ${C}
            </div>
        </div>`}function Ra(e,t,s,p){const i=t||[];let n;i.length===0?n='<div class="pol-mood-no-crises">No active crises</div>':n=i.map(l=>{const d=l.crisis_templates?.name||"Unknown Crisis",g=s-(l.started_at_tick||0);return`<div class="pol-mood-crisis">
                <span class="pol-mood-crisis-name">${k(d)}</span>
                <span class="pol-mood-crisis-dur">${g}t</span>
            </div>`}).join("");const v=cs.map(l=>{const d=xe[l],g=Number(p?.[l]?.salience??30);return{id:l,name:d.label,salience:g,statKeys:d.stats}}).sort((l,d)=>d.salience-l.salience).map(l=>{const d=Ma(l.salience),g=l.statKeys.map(h=>{const r=Math.round(Number(e[h]??0)),m=h.replace(/_/g," ").replace(/\b\w/g,_=>_.toUpperCase());return`<div class="pol-mood-stat-row">
                <span class="pol-mood-stat-name">${k(m)}</span>
                <span class="pol-mood-stat-val">${r}</span>
            </div>`}).join("");return`<div class="pol-mood-issue-wrap">
            <div class="pol-mood-issue" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.pol-mood-chevron').textContent=this.nextElementSibling.classList.contains('open')?'▾':'▸'">
                <span class="pol-mood-issue-name">${k(l.name)}</span>
                <div class="pol-mood-issue-bar-wrap">
                    <div class="pol-mood-issue-bar" style="width:${l.salience}%;background:${d}"></div>
                </div>
                <span class="pol-mood-issue-pct">${l.salience}%</span>
                <span class="pol-mood-chevron">▸</span>
            </div>
            <div class="pol-mood-stats">${g}</div>
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
        </div>`}function za(e,t,s,p,i,n,a){const v=Fs(e),l=s||[],d=Math.round(Number(e.gov_approval??40)),g=d>=50?"var(--dgreen)":d>=35?"var(--damber)":"var(--dred)",h=a?.admin_name||"Government",r=ls(e),m=new Set(t?.party_ids||[]),_=l.filter(E=>m.has(E.id)),f=_.reduce((E,O)=>E+(O.seats||0),0),o=l.reduce((E,O)=>E+(O.seats||0),0),y=Math.ceil(o/2),b=f>=y,c=_.length>1?"Coalition":_.length===1?"Single Party":"";function x(E,O){return((E||"?")[0]+(O||"?")[0]).toUpperCase()}let $="";if(v&&n){const E=l.find(R=>R.id===n.faction_id),O=E?.party_color||"#888",z=E?.abbreviation||(E?.faction_name||"??").substring(0,3).toUpperCase(),P=n.terms_served>1?n.terms_served===2?"2nd":n.terms_served+"th":"1st",N=x(n.first_name,n.last_name);$=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${k(N)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${k(n.first_name+" "+n.last_name)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">President &middot; Age ${n.age||"?"} &middot; ${P} Term</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${O}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${O}">${k(z)}</span>
            </div>
          </div>
        </div>`}else if(!v&&t){const E=l.find(R=>R.id===t.lead_party_id),O=E?.party_color||"#888",z=E?.faction_name||"Unknown",P=E?.abbreviation||z.substring(0,3).toUpperCase(),N=z.split(/\s+/).map(R=>R[0]).join("").toUpperCase().slice(0,2);$=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${k(N)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${k(z)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of Government</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${O}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${O}">${k(P)}</span>
            </div>
          </div>
        </div>`}let T="";const A=e.head_of_state_first_name||"",C=e.head_of_state_last_name||"";if(v&&A&&C){const E=x(A,C);T=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${k(E)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${k(A+" "+C)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Vice President</div>
          </div>
        </div>`}else if(!v&&A&&C){const E=x(A,C);T=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${k(E)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${k(A+" "+C)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of State</div>
          </div>
        </div>`}const w=[..._].sort((E,O)=>(O.seats||0)-(E.seats||0));o>0&&w.map(E=>{const O=(E.seats||0)/o*100;return O<=0?"":`<div style="width:${O.toFixed(2)}%;height:100%;background:${E.party_color||"#888"}"></div>`}).join(""),w.map(E=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
            <div style="width:7px;height:7px;border-radius:2px;background:${E.party_color||"#888"};flex-shrink:0"></div>
            <span style="font-family:var(--dfont-ui);font-size:12px;color:var(--dtext-0);flex:1">${k(E.faction_name||"Unknown")}</span>
            <span style="font-family:var(--dfont-mono);font-size:12px;font-weight:600;color:${E.party_color||"var(--dtext-0)"}">${E.seats||0}</span>
        </div>`).join("");const u=b?"Majority Government":"Minority Government",I=`${f}/${o} seats (${y} needed)`;return`<div class="pol-admin-box">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Government</span>
        </div>
        <div class="pol-box-body">
        <div style="font-family:var(--dfont-ui);font-size:16px;font-weight:700;color:var(--dtext-0);margin-bottom:8px">${k(h)}</div>
        <div style="display:flex;gap:6px;margin-bottom:16px">
            <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${k(r)}</span>
            ${c?`<span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${k(c)}</span>`:""}
        </div>

        ${$}
        ${T}

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Approval</div>
        <div style="font-family:var(--dfont-mono);font-size:28px;font-weight:700;line-height:1;color:${g}">${d}%</div>
        <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:4px;display:flex;align-items:center;gap:8px">
            <span style="text-transform:uppercase;font-weight:600">${k(u)}</span>
            <span style="font-weight:400">${k(I)}</span>
        </div>

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Party Events</div>
        <div id="gov-card-party-events" class="pe-feed" style="max-height:200px;overflow-y:auto;font-size:11px">
            <div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">Loading events...</div>
        </div>
        </div>
    </div>`}const be=360,et=200,Ye=256;function Ba(e,t){const s=e.party_color||"#ffcc00",p=e.party_logo||"flag",i=e.party_description||"",n=e.action_points||0,a=e.last_rename_tick||0,v=a>0?Math.max(0,be-(t-a)):0,l=v>0,d=!!e.custom_logo_url,g=Dt({customLogoUrl:e.custom_logo_url,iconKey:p,size:20,color:s}),h=Bs.map(o=>`<div class="pol-id-swatch${o.hex.toLowerCase()===s.toLowerCase()?" selected":""}" data-color="${o.hex}" title="${o.label}" style="background:${o.hex}"></div>`).join(""),r={};for(const[o,y]of Object.entries(Ds)){const b=y.category||"Other";r[b]||(r[b]=[]),r[b].push({key:o,label:y.label})}let m="";for(const[o,y]of Object.entries(r)){m+=`<div class="pol-id-icon-cat">${k(o)}</div><div class="pol-id-icon-grid">`;for(const b of y){const c=b.key===p?" selected":"",x=Rt(b.key,16,b.key===p?s:"#888");m+=`<div class="pol-id-icon-tile${c}" data-icon="${b.key}" title="${k(b.label)}" style="color:${b.key===p?s:"#888"}">${x}</div>`}m+="</div>"}let _,f;if(l){const y=`
            <div class="pol-id-cooldown">
                <span class="pol-id-cooldown-label">Rename cooldown</span>
                <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:${(v/be*100).toFixed(1)}%"></div></div>
                <span class="pol-id-cooldown-ticks">${v}t</span>
            </div>`;_=y,f=y}else _=`
            <button class="pol-id-rename-btn" id="pol-id-rename-btn">
                <span>Rename Party</span>
                <span class="pol-id-rename-cost">${be}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-rename-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-rename-input" placeholder="Enter new party name…" maxlength="60">
                    <button class="pol-id-rename-confirm" id="pol-id-rename-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-rename-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${be} ticks</span></span>
                </div>
                <div class="pol-id-error" id="pol-id-rename-error" style="display:none"></div>
            </div>`,f=`
            <button class="pol-id-rename-btn" id="pol-id-abbr-btn">
                <span>Change Abbreviation</span>
                <span class="pol-id-rename-cost">${be}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-abbr-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-abbr-input" placeholder="2–4 letters" maxlength="4" style="text-transform:uppercase;font-family:var(--dfont-mono);font-weight:700;letter-spacing:0.1em;width:80px">
                    <button class="pol-id-rename-confirm" id="pol-id-abbr-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-abbr-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${be} ticks</span></span>
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
                    ${g}
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
                <span class="pol-id-char-count${i.length>et*.9?" warn":""}" id="pol-id-char-count">${i.length} / ${et}</span>
            </div>
            <textarea class="pol-id-desc" id="pol-id-desc" rows="3" maxlength="${et}">${k(i)}</textarea>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Party Color -->
        <div style="margin-bottom:14px">
            <span class="pol-id-section-label">Party Color</span>
            <div class="pol-id-colors" id="pol-id-colors">${h}</div>
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
                    <button class="pol-id-tab${d?"":" active"}" data-tab="icon">Icon</button>
                    <button class="pol-id-tab${d?" active":""}" data-tab="custom">Custom Image</button>
                </div>
            </div>
            <div id="pol-id-icon-section"${d?' style="display:none"':""}>${m}</div>
            <div id="pol-id-upload-section"${d?"":' style="display:none"'}>
                <div class="pol-id-upload-zone${d?" has-image":""}" id="pol-id-upload-zone">
                    ${d?`
                        <img class="pol-id-upload-preview" src="${e.custom_logo_url}" alt="preview" style="border:2px solid ${s}">
                        <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Ye}KB · Best at 128×128px</div>
                    `:`
                        <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                        <div class="pol-id-upload-text">Click to upload logo</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Ye}KB · Best at 128×128px</div>
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
        </div>
    </div>`}function Da(e){const t=document.getElementById("pol-identity-box");if(!t)return;const s=document.getElementById("pol-id-preview"),p=document.getElementById("pol-id-colors"),i=document.getElementById("pol-id-hex-input"),n=document.getElementById("pol-id-hex-preview"),a=document.getElementById("pol-id-desc"),v=document.getElementById("pol-id-char-count"),l=document.getElementById("pol-id-save-btn"),d=document.getElementById("pol-id-rename-btn"),g=document.getElementById("pol-id-rename-form"),h=document.getElementById("pol-id-rename-input"),r=document.getElementById("pol-id-rename-confirm"),m=document.getElementById("pol-id-rename-cancel"),_=document.getElementById("pol-id-rename-error"),f=document.getElementById("pol-id-abbr-btn"),o=document.getElementById("pol-id-abbr-form"),y=document.getElementById("pol-id-abbr-input"),b=document.getElementById("pol-id-abbr-confirm"),c=document.getElementById("pol-id-abbr-cancel"),x=document.getElementById("pol-id-abbr-error"),$=document.getElementById("pol-id-current-abbr"),T=document.getElementById("pol-id-current-name");document.getElementById("pol-id-ap-display");const A=document.getElementById("pol-id-icon-section"),C=document.getElementById("pol-id-upload-section"),w=document.getElementById("pol-id-upload-zone"),u=document.getElementById("pol-id-file-input"),I=document.getElementById("pol-id-upload-error"),E=document.getElementById("pol-id-remove-btn");let O=null,z=null,P=!!e.custom_logo_url,N=e.custom_logo_url||null;function R(){return t.dataset.selectedColor}function F(){return t.dataset.selectedIcon}function S(){const M=R();if(s.style.border="2px solid "+M,s.style.background=M+"18",P&&(O||N)){const D=O||N;s.innerHTML='<img src="'+D+'" alt="" style="width:100%;height:100%;object-fit:cover">'}else s.innerHTML=Rt(F(),20,M)}function B(){const M=R(),D=F();t.querySelectorAll(".pol-id-icon-tile").forEach(U=>{const ae=U.dataset.icon,le=ae===D;U.classList.toggle("selected",le),U.style.color=le?M:"#888",U.innerHTML=Rt(ae,16,le?M:"#888")})}function W(){const M=R().toLowerCase();t.querySelectorAll(".pol-id-swatch").forEach(D=>{D.classList.toggle("selected",D.dataset.color.toLowerCase()===M)})}p&&p.addEventListener("click",M=>{const D=M.target.closest(".pol-id-swatch");D&&(t.dataset.selectedColor=D.dataset.color,i.value=D.dataset.color,n.style.background=D.dataset.color,W(),B(),S())}),i&&i.addEventListener("input",()=>{const M=i.value;/^#[0-9a-fA-F]{6}$/.test(M)?(t.dataset.selectedColor=M,n.style.background=M,W(),B(),S()):n.style.background="var(--dtext-3)"}),A&&A.addEventListener("click",M=>{const D=M.target.closest(".pol-id-icon-tile");D&&(t.dataset.selectedIcon=D.dataset.icon,P=!1,B(),S())}),t.querySelectorAll(".pol-id-tab").forEach(M=>{M.addEventListener("click",()=>{t.querySelectorAll(".pol-id-tab").forEach(U=>U.classList.remove("active")),M.classList.add("active");const D=M.dataset.tab==="icon";A.style.display=D?"":"none",C.style.display=D?"none":""})}),w&&w.addEventListener("click",()=>u.click()),u&&u.addEventListener("change",M=>{const D=M.target.files[0];if(!D)return;if(I.style.display="none",D.size>Ye*1024){I.textContent="⚠ File too large — max "+Ye+"KB.",I.style.display="";return}if(!D.type.startsWith("image/")){I.textContent="⚠ Must be PNG, JPG, SVG, or WebP.",I.style.display="";return}const U=new FileReader;U.onload=ae=>{O=ae.target.result,z=D,P=!0,w.classList.add("has-image"),w.innerHTML=`
                    <img class="pol-id-upload-preview" src="${O}" alt="preview" style="border:2px solid ${R()}">
                    <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                    <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Ye}KB · Best at 128×128px</div>`,E.style.display="",S()},U.readAsDataURL(D)}),E&&E.addEventListener("click",()=>{O=null,z=null,P=!1,N=null,w.classList.remove("has-image"),w.innerHTML=`
                <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                <div class="pol-id-upload-text">Click to upload logo</div>
                <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Ye}KB · Best at 128×128px</div>`,E.style.display="none",S()}),a&&v&&a.addEventListener("input",()=>{const M=a.value.length;v.textContent=M+" / "+et,v.classList.toggle("warn",M>et*.9)}),f&&o&&f.addEventListener("click",()=>{f.style.display="none",o.style.display="",y.focus()}),c&&c.addEventListener("click",()=>{o.style.display="none",f.style.display="",y.value="",x.style.display="none",y.classList.remove("has-error")}),y&&y.addEventListener("input",()=>{y.value=y.value.toUpperCase()}),b&&b.addEventListener("click",async()=>{if(b.disabled)return;x.style.display="none",y.classList.remove("has-error");const M=y.value.trim().toUpperCase();if(M.length<2||M.length>4){x.textContent="⚠ Must be 2–4 letters.",x.style.display="",y.classList.add("has-error");return}b.disabled=!0;const D=parseInt(t.dataset.currentTick)||0,{error:U}=await L.from("factions").update({abbreviation:M,last_rename_tick:D}).eq("id",e.id);if(U){x.textContent="⚠ Failed to save — try again.",x.style.display="",b.disabled=!1;return}$.textContent=M,o.style.display="none",y.value="",f.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${be}t</span>
                </div>`,d&&(g.style.display="none",d.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${be}t</span>
                    </div>`)}),d&&g&&d.addEventListener("click",()=>{d.style.display="none",g.style.display="",h.focus()}),m&&m.addEventListener("click",()=>{g.style.display="none",d.style.display="",h.value="",_.style.display="none",h.classList.remove("has-error")}),r&&r.addEventListener("click",async()=>{_.style.display="none",h.classList.remove("has-error");const M=h.value.trim();if(!M){_.textContent="⚠ Name cannot be empty.",_.style.display="",h.classList.add("has-error");return}if(M.length<3){_.textContent="⚠ Minimum 3 characters.",_.style.display="",h.classList.add("has-error");return}const D=parseInt(t.dataset.currentTick)||0,{error:U}=await L.from("factions").update({faction_name:M,last_rename_tick:D}).eq("id",e.id);if(U){_.textContent="⚠ Failed to save — try again.",_.style.display="";return}T.textContent=M,g.style.display="none",h.value="",d.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${be}t</span>
                </div>`,f&&(o.style.display="none",f.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${be}t</span>
                    </div>`)}),l&&l.addEventListener("click",async()=>{l.disabled=!0,l.textContent="Saving...";let M=N;if(P&&z){const le=z.name.split(".").pop()||"png",_e=`party-logos/${e.id}/${Date.now()}.${le}`,{error:Oe}=await L.storage.from("public-assets").upload(_e,z,{contentType:z.type,upsert:!0});if(Oe){console.error("Logo upload failed:",Oe.message),l.textContent="⚠ Upload failed",l.disabled=!1,setTimeout(()=>{l.textContent="Save Changes"},2e3);return}const{data:Re}=L.storage.from("public-assets").getPublicUrl(_e);M=Re?.publicUrl||null,N=M,z=null}const D={party_color:R(),party_logo:P?null:F(),custom_logo_url:P?M:null,party_description:a?a.value.slice(0,et):""},{data:U,error:ae}=await L.from("factions").update(D).eq("id",e.id).select("id");if(ae){Z("Save failed: "+ae.message),l.disabled=!1,l.textContent="Save Changes";return}if(!U||U.length===0){Z("Save failed: no rows updated (permission denied?)"),l.disabled=!1,l.textContent="Save Changes";return}sessionStorage.removeItem("nationhood_state"),l.textContent="✓ Saved",l.classList.add("saved"),l.disabled=!1,setTimeout(()=>{l.textContent="Save Changes",l.classList.remove("saved")},2e3)})}function Ha(e,t,s,{scheduledElections:p,currentTick:i,nation:n,mySeats:a,faction:v,currentEndorsement:l}={}){const d={},g={};(s||[]).forEach(A=>{d[A.id]=A.party_color||"#888",g[A.id]=A.seats||0});function h(A){if(!A)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const C=A.results;if(!C||!C.votes)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const w=he(A.election_tick),u=new Set(C.votes.map(P=>P.party_id)),I=(s||[]).filter(P=>!u.has(P.id)&&(g[P.id]||0)>0).map(P=>({party_id:P.id,party_name:P.faction_name,votes:0,vote_percentage:0,seats:g[P.id]||0})),E=[...C.votes,...I].map(P=>({...P,seats:g[P.party_id]??P.seats??0})).sort((P,N)=>(N.seats||0)-(P.seats||0)),O=Math.max(...E.map(P=>P.vote_percentage||0),1);let z=E.map(P=>{const N=d[P.party_id]||"#888",R=(P.vote_percentage||0).toFixed(1),F=Math.round((P.vote_percentage||0)/O*100);return`<tr>
                <td><span class="pol-el-color-dot" style="background:${N}"></span>${k(P.party_name)}</td>
                <td>${(P.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${F}%;background:${N}"></div></div></td>
                <td>${R}%</td>
                <td>${P.seats||0}</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${w}</div>
            <div class="pol-el-summary">Turnout: ${(C.turnout_pct||0).toFixed(1)}% &middot; ${(C.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Party</th><th>Votes</th><th></th><th>%</th><th>Seats</th></tr></thead>
                <tbody>${z}</tbody>
            </table>`}function r(A,C,w,u){const I=[...A].sort((z,P)=>(P.votes||0)-(z.votes||0)),E=Math.max(...I.map(z=>z.vote_percentage||0),1);let O=I.map(z=>{const P=d[z.faction_id]||"#888",N=(z.vote_percentage||0).toFixed(1),R=Math.round((z.vote_percentage||0)/E*100),F=z.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";return`<tr>
                <td><span class="pol-el-color-dot" style="background:${P}"></span>${k(z.candidate_name)}${F}</td>
                <td>${k(z.party_name)}</td>
                <td>${(z.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${R}%;background:${P}"></div></div></td>
                <td>${N}%</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${C}</div>
            <div class="pol-el-summary">Turnout: ${(w||0).toFixed(1)}% &middot; ${(u||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${O}</tbody>
            </table>`}function m(A){if(!A)return'<div class="pol-el-empty">No presidential election results yet.</div>';const C=A.results;if(!C||!C.presidential_candidates)return'<div class="pol-el-empty">No presidential election results yet.</div>';const w=he(A.election_tick);return r(C.presidential_candidates,w,C.turnout_pct,C.total_votes_cast)}function _(A){if(!A)return'<div class="pol-el-empty">No first round results.</div>';const C=A.results,w=C?.round_1_candidates||C?.presidential_candidates;if(!w)return'<div class="pol-el-empty">No first round results.</div>';const u=he(A.election_tick),I=C.round_1_turnout_pct??C.turnout_pct,E=C.round_1_total_votes_cast??C.total_votes_cast;return r(w,u,I,E)}function f(A){if(!A)return'<div class="pol-el-empty">No runoff results.</div>';const C=A.results,w=C?.runoff_candidates;if(!w)return'<div class="pol-el-empty">No runoff results.</div>';const u=he(A.election_tick),I=[...w].sort((N,R)=>(R.votes||0)-(N.votes||0)),E=Math.max(...I.map(N=>N.vote_percentage||0),1);let O=I.map(N=>{const R=d[N.faction_id]||"#888",F=(N.vote_percentage||0).toFixed(1),S=Math.round((N.vote_percentage||0)/E*100),B=N.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";let W="";return N.base_votes!=null&&N.transfer_votes&&(W=`<div style="font-size:10px;color:var(--dtxt-muted);margin-top:2px">${(N.base_votes||0).toLocaleString()} direct + ${(N.transfer_votes||0).toLocaleString()} transferred</div>`),`<tr>
                <td><span class="pol-el-color-dot" style="background:${R}"></span>${k(N.candidate_name)}${B}</td>
                <td>${k(N.party_name)}</td>
                <td>${(N.votes||0).toLocaleString()}${W}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${S}%;background:${R}"></div></div></td>
                <td>${F}%</td>
            </tr>`}).join(""),z=`
            <div class="pol-el-date">${u}</div>
            <div class="pol-el-summary">Turnout: ${(C.turnout_pct||0).toFixed(1)}% &middot; ${(C.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${O}</tbody>
            </table>`;const P=I.flatMap(N=>(N.transfer_detail||[]).map(R=>({...R,to_candidate:N.candidate_name,to_faction_id:N.faction_id})));if(P.length>0){let N=P.map(R=>{const F=d[R.faction_id]||"#888",S=d[R.to_faction_id]||"#888",B=R.round1_votes>0?Math.round(R.transferred/R.round1_votes*100):0;return`<tr>
                    <td><span class="pol-el-color-dot" style="background:${F}"></span>${k(R.party_name||"")}</td>
                    <td><span class="pol-el-color-dot" style="background:${S}"></span>${k(R.to_candidate||"")}</td>
                    <td>${(R.transferred||0).toLocaleString()}</td>
                    <td>${B}%</td>
                </tr>`}).join("");z+=`
                <div style="margin-top:14px;font-family:var(--dfont-mono);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--dtxt-muted);margin-bottom:6px">Vote Transfers</div>
                <table class="pol-el-table">
                    <thead><tr><th>Eliminated Party</th><th>Votes Went To</th><th>Transferred</th><th>Rate</th></tr></thead>
                    <tbody>${N}</tbody>
                </table>`}return z}const o=t?.results?.was_runoff===!0;let y,b;o?(y=`
            <button class="pol-el-tab" data-tab="pres-r1">General Election [1st Round]</button>
            <button class="pol-el-tab" data-tab="pres-runoff">General Election [Runoff]</button>`,b=`
            <div class="pol-el-content" data-content="pres-r1">${_(t)}</div>
            <div class="pol-el-content" data-content="pres-runoff">${f(t)}</div>`):(y='<button class="pol-el-tab" data-tab="pres">General Election</button>',b=`<div class="pol-el-content" data-content="pres">${m(t)}</div>`);const c=$a({isPresidentialSystem:rs(n),scheduledElections:p,currentTick:i,playerSeats:a});let x="";c.ticksUntilWindow?x=`<div style="font-size:10px;color:var(--dtxt-muted);text-align:right;margin-top:2px">Available in ${c.ticksUntilWindow} tick${c.ticksUntilWindow!==1?"s":""}</div>`:!c.disabled&&c.ticksUntilElection&&(x=`<div style="font-size:10px;color:var(--dgreen);text-align:right;margin-top:2px">${c.ticksUntilElection} tick${c.ticksUntilElection!==1?"s":""} until election</div>`);let $="",T="";if(!c.hidden){const A=l?.endorsed_party_id||null,w=(s||[]).filter(u=>u.id!==v?.id&&(u.seats||0)>0).map(u=>{const I=u.party_color||"#888",E=[u.leader_first_name,u.leader_last_name].filter(Boolean).join(" ")||"Unknown",O=u.id===A;return`<div class="pol-endorse-candidate${O?" selected":""}" data-faction-id="${u.id}">
                <span class="pol-el-color-dot" style="background:${I}"></span>
                <span class="pol-endorse-candidate-name">${k(u.faction_name||u.abbreviation)}</span>
                <span class="pol-endorse-candidate-leader">${k(E)}</span>
                <span class="pol-endorse-candidate-seats">${u.seats||0} seats</span>
                ${O?'<span style="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)">ENDORSED</span>':""}
            </div>`}).join("");$=`<div>
            <button class="pol-endorse-btn" ${c.disabled?"disabled":""}>Endorse Candidate</button>
            ${x}
        </div>`,T=`<div class="pol-endorse-panel" style="display:none">
            <div class="pol-endorse-panel-header">
                <span class="pol-section-label" style="margin-bottom:0;font-size:9px">ENDORSE A CANDIDATE</span>
                <button class="pol-endorse-panel-close">&times;</button>
            </div>
            <div class="pol-endorse-panel-desc">Select a party's candidate to endorse for the presidential election. First endorsement is free; switching costs 1 AP.</div>
            <div class="pol-endorse-candidate-list">
                ${w||'<div class="pol-el-empty">No eligible parties to endorse.</div>'}
            </div>
        </div>`}return`<div class="pol-election-box"
        data-faction-id="${v?.id||""}"
        data-nation-id="${n?.id||""}"
        data-current-tick="${i||0}">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Election Results</span>
            <div class="pol-box-header-right">${$}</div>
        </div>
        <div class="pol-box-body" style="padding:0">
        ${T}
        <div class="pol-el-tabs">
            <button class="pol-el-tab active" data-tab="parl">Parliamentary</button>
            ${y}
        </div>
        <div class="pol-el-content active" data-content="parl">${h(e)}</div>
        ${b}
        </div>
    </div>`}function Fa(){const e=document.querySelector(".pol-election-box");if(!e)return;const t=e.querySelectorAll(".pol-el-tab"),s=e.querySelectorAll(".pol-el-content");t.forEach(a=>{a.addEventListener("click",()=>{t.forEach(d=>d.classList.remove("active")),s.forEach(d=>d.classList.remove("active")),a.classList.add("active");const v=a.getAttribute("data-tab"),l=e.querySelector(`.pol-el-content[data-content="${v}"]`);l&&l.classList.add("active")})});const p=e.querySelector(".pol-endorse-btn"),i=e.querySelector(".pol-endorse-panel"),n=e.querySelector(".pol-endorse-panel-close");p&&i&&(p.addEventListener("click",()=>{const a=i.style.display!=="none";i.style.display=a?"none":"block"}),n&&n.addEventListener("click",()=>{i.style.display="none"}),i.querySelectorAll(".pol-endorse-candidate").forEach(a=>{a.addEventListener("click",async()=>{const v=a.getAttribute("data-faction-id"),l=e.getAttribute("data-faction-id"),d=Number(e.getAttribute("data-current-tick")||0),g=a.querySelector(".pol-endorse-candidate-name")?.textContent||"this party";if(confirm(`Endorse ${g}'s candidate for president? First endorsement is free; switching costs 1 AP.`)){a.style.opacity="0.5",a.style.pointerEvents="none";try{const h=await Gs(L,l,v,d);if(!h.success){alert(h.error||"Endorsement failed.");return}i.querySelectorAll(".pol-endorse-candidate").forEach(_=>{_.classList.remove("selected"),_.querySelector('[style*="color:var(--dgreen)"]')?.remove()}),a.classList.add("selected");const r=document.createElement("span");r.style.cssText="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)",r.textContent="ENDORSED",a.appendChild(r);const m=h.newAp!=null?` (${h.newAp} AP remaining)`:"";alert(`Endorsed ${g}!${m}`),i.style.display="none",h.newAp!=null&&await Me(l)}catch(h){alert("Endorsement failed: "+(h.message||"Unknown error"))}finally{a.style.opacity="",a.style.pointerEvents=""}}})}))}function qa(){const e=document.getElementById("pol-ba-bloc-data"),t=document.getElementById("pol-ba-party-pos"),s=document.getElementById("pol-ba-party-color");if(!e||!t)return;const p=JSON.parse(e.textContent),i=JSON.parse(t.textContent),n=JSON.parse(s.textContent);if(p.length===0)return;const a={BASE:{color:"var(--dgreen)",raw:"#4ade80",dim:"rgba(74,222,128,0.08)"},LEAN:{color:"#22d3ee",raw:"#22d3ee",dim:"rgba(34,211,238,0.08)"},SWING:{color:"var(--damber)",raw:"#facc15",dim:"rgba(250,204,21,0.08)"},SKEPTICAL:{color:"#f97316",raw:"#f97316",dim:"rgba(249,115,22,0.08)"},HOSTILE:{color:"var(--dred)",raw:"#ef4444",dim:"rgba(239,68,68,0.08)"}},v=[{key:"liberty_equality",left:"Liberty",right:"Equality"},{key:"tradition_progress",left:"Tradition",right:"Progress"},{key:"security_freedom",left:"Security",right:"Freedom"},{key:"globalism_nationalism",left:"Globalism",right:"Nationalism"},{key:"individualism_collectivism",left:"Individualism",right:"Collectivism"}],l=o=>o<=10?"var(--dgreen)":o<=20?"#22d3ee":o<=35?"var(--damber)":o<=50?"#f97316":"var(--dred)",d=o=>o>=3?"●●●":o>=2?"●●":o>=1?"●":"",g=o=>o>=3?"var(--dred)":o>=2?"#f97316":o>=1?"var(--damber)":"var(--dtext-3)",h=document.getElementById("pol-ba-selected"),r=document.getElementById("pol-ba-dropdown"),m=document.getElementById("pol-ba-sel-arrow"),_=r.querySelectorAll(".pol-ba-drop-item");function f(o){const y=a[o.tier]||a.HOSTILE;document.getElementById("pol-ba-sel-dot").style.background=y.raw,document.getElementById("pol-ba-sel-name").textContent=o.name;const b=document.getElementById("pol-ba-sel-badge");b.textContent=o.tier,b.style.color=y.raw,b.style.background=y.dim,document.getElementById("pol-ba-sel-pct").textContent=o.pct+"%";const c=v.map(S=>{const B=i[S.key]||50,W=o.axes[S.key]||50,M=Math.abs(B-W),D=o.strengths[S.key]||.5;return{...S,pv:B,bv:W,dist:M,str:D,weighted:M*D}}),x=c.reduce((S,B)=>S+B.weighted,0),$=v.length*100*3,T=Math.round(Math.max(0,100-x/$*100)),A=o.pref,C=T-A,w=document.getElementById("pol-ba-alignment");w.textContent=T,w.style.color=y.raw;const u=document.getElementById("pol-ba-performance"),I=o.perf??50;u.textContent=Math.round(I),u.style.color=I>=55?"var(--dgreen)":I>=40?"var(--damber)":"var(--dred)";const E=document.getElementById("pol-ba-approval");E.textContent=A,E.style.color="var(--dtext-0)";const O=document.getElementById("pol-ba-headroom");O.textContent=(C>=0?"+":"")+C.toFixed(1),O.style.color=C>10?"var(--damber)":C>=0?"var(--dgreen)":"var(--dred)",document.getElementById("pol-ba-legend-bloc-dot").style.background=y.raw;const z=document.getElementById("pol-ba-legend-bloc-name");z.textContent=o.name,z.style.color=y.raw;const P=document.getElementById("pol-ba-axes");P.innerHTML=c.map(S=>{const B=l(S.dist),W=Math.min(S.pv,S.bv),M=S.dist;return`<div class="pol-ba-axis-row">
                <div class="pol-ba-axis-labels">
                    <span class="pol-ba-axis-label">${S.left}</span>
                    <span class="pol-ba-axis-str" style="color:${g(S.str)}">${d(S.str)}</span>
                    <span class="pol-ba-axis-label">${S.right}</span>
                </div>
                <div class="pol-ba-axis-track">
                    <div style="position:absolute;left:15%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:85%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:35%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:65%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(255,255,255,0.1)"></div>
                    ${S.dist>3?`<div class="pol-ba-axis-band" style="left:${W}%;width:${M}%;background:${B}12"></div>`:""}
                    <div class="pol-ba-axis-marker" style="left:${S.pv}%;background:${n};z-index:3">
                        <span style="color:var(--dbg-0)">${S.pv}</span>
                    </div>
                    <div class="pol-ba-axis-marker" style="left:${S.bv}%;background:${y.raw}">
                        <span style="color:var(--dbg-0)">${S.bv}</span>
                    </div>
                </div>
                <div class="pol-ba-axis-meta">
                    <span style="color:${B}">dist: ${S.dist}</span>
                    <span style="color:var(--dtext-3)">×${S.str} = <span style="color:${B};font-weight:700">${S.weighted.toFixed(0)}</span></span>
                </div>
            </div>`}).join("");const N=c.reduce((S,B)=>B.dist<S.dist?B:S,c[0]),R=c.reduce((S,B)=>B.weighted>S.weighted?B:S,c[0]);document.getElementById("pol-ba-summary").innerHTML=`<span style="color:var(--dgreen)">Closest: ${N.left}/${N.right}</span><span style="color:var(--dred)">Gap: ${R.left}/${R.right}</span>`;const F=document.getElementById("pol-ba-issues");F.innerHTML=(o.issues||[]).map(S=>`<span class="pol-ba-issue-tag">${S}</span>`).join(""),_.forEach(S=>{S.classList.toggle("active",S.getAttribute("data-bloc-id")===o.id),S.getAttribute("data-bloc-id")===o.id?S.style.borderLeftColor=y.raw:S.style.borderLeftColor="transparent"})}f(p[0]),h.addEventListener("click",()=>{const o=r.classList.toggle("open");m.classList.toggle("open",o)}),_.forEach(o=>{o.addEventListener("click",()=>{const y=o.getAttribute("data-bloc-id"),b=p.find(c=>c.id===y);b&&f(b),r.classList.remove("open"),m.classList.remove("open")})}),document.addEventListener("click",o=>{const y=document.getElementById("pol-ba-selector");y&&!y.contains(o.target)&&(r.classList.remove("open"),m.classList.remove("open"))})}function k(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}let j=null,Ne=null,Ce=null,Ge=null,Fe=null,Xe="minister",de=null,Pe=null,X=null,Ue=null,st=!1,je=null,at=null,We=null,dt=!1,Je=null,ot=null,G=null,re=null,Ve=null,Te=!1;const Ga=[{key:"momentum",label:"MOMENTUM",color:"#f97316"},{key:"alignment",label:"ALIGNMENT",color:"#a78bfa"},{key:"appeal",label:"APPEAL",color:"#38bdf8"},{key:"tools",label:"TOOLS",color:"#6b7280"}],wt=[{id:"rally",name:"Hold a Rally",ap:Ht.AP_COST,color:"#f97316",icon:"★",category:"momentum",affects:"Momentum",desc:"Rally your supporters in a public show of strength. Random outcome that directly affects your Momentum score. A rousing success builds momentum; a gaffe costs it."},{id:"press_conference",name:"Press Conference",ap:1,color:"#fbbf24",icon:"🎤",category:"momentum",affects:"Momentum",desc:"Hold a press conference to make a public statement. Base roll: -2 to +2 Momentum. Opposition parties get +1 bonus. High-approval governing parties get +2 bonus."},{id:"attack",name:"Campaign Attack",ap:ds.AP_COST,color:"#ef4444",icon:"✦",category:"momentum",affects:"Momentum",desc:"Target a rival party's record or leadership. Lowers their momentum and can hurt their election chances. More effective with evidence — but a weak attack backfires on you."},{id:"fund_think_tank",name:"Fund Think Tank",ap:ce.THINK_TANK.AP_COST,color:"#14b8a6",icon:"🏛",category:"alignment",affects:"Ideology",desc:"Fund a think tank to gradually shift the electorate's ideology on a chosen axis. Long-term investment: 8 AP upfront + 1 AP/tick for 50 ticks. Improves your Ideology pillar score."},{id:"grassroots_movement",name:"Grassroots Movement",ap:ce.GRASSROOTS.AP_COST,color:"#10b981",icon:"🌱",category:"alignment",affects:"Ideology + Momentum",desc:"Launch a grassroots campaign to shift public ideology and build momentum. Runs for 100 ticks. Drifts electorate opinion toward your position and grants +1 Momentum periodically."},{id:"pivot",name:"Ideological Pivot",ap:1,color:"#f59e0b",icon:"⟳",category:"alignment",affects:"Alignment",desc:"Shift your party's position on a chosen ideological axis. Costs escalate with each pivot (+1 AP per use, resets after 20 ticks). Reversing your current lean costs extra AP."},{id:"take_stance",name:"Take a Stance",ap:ne.AP_COST,color:"#38bdf8",icon:"⚑",category:"appeal",affects:"Appeal + Ideology",desc:"Declare your party's official position on a national issue. Builds platform appeal with aligned voters and shifts your ideology. Stances decay each tick — reinforce before they fade."},{id:"outreach",name:"Community Outreach",ap:3,color:"#60a5fa",icon:"🤝",category:"appeal",affects:"Appeal",desc:"Engage directly with communities through town halls and local events. +3 Platform Appeal. Cost starts at 3 AP and escalates by +1 each use. Decays by 1 each tick you don't use it."},{id:"poll_now",name:"Poll Now",ap:1,color:"#22d3ee",icon:"📊",category:"tools",affects:"Informational",desc:"Commission a poll to update the Current Electoral Standing. 1 AP = ±5% margin, 3 AP = ±3% margin."}];let Ze={},zt={},pt=[],K=null,Q=null,it=null,we=1,kt=0,qt=0,tt=0;window._selectPollTier=function(e){we=e;const t=document.getElementById("ca-config-panel");t&&(t.innerHTML=bs())};let fe=null,ue=null,pe=null,ke="moderate",Qe=null;function Ua(){Ne=null,Ce=null,Fe=null,Xe="minister",de=null,je=null,at=null,We=null,dt=!1,K=null,Q=null,fe=null,ue=null,pe=null,ke="moderate"}function ys(){return j==="rally"?!0:j==="attack"?!!Ne&&!!Ce:j==="protest"?!!de:j==="take_stance"?!!fe&&!!ue&&!!pe&&!!ke:j==="poll_now"||j==="press_conference"||j==="outreach"?!0:j==="fund_think_tank"||j==="media_campaign"||j==="grassroots_movement"?!!K&&!!Q:j==="pivot"?!!K&&!!Q&&!Ze.pivot:!1}function Bt(){if(j==="protest"){const t=G,s=re?.current_tick||0,p=ps(t?.protest_use_count||0,t?.protest_last_use_tick,s);return fs(p)}if(j==="pivot"){const t=G,s=re?.current_tick||0;let p=t?.pivot_count||0;const i=t?.pivot_last_tick||0;s-i>=Ie.ESCALATION_RESET&&(p=0);let n=Ie.BASE_AP+p;if(K&&Q&&it){const a=Number(it[K]??0),v=Q==="right"?1:-1;(a>0&&v<0||a<0&&v>0)&&(n+=Ie.REVERSE_AP_EXTRA)}return n}if(j==="poll_now")return we;if(j==="outreach"){const t=G,s=re?.current_tick||0;return Math.max(1,3+(kt||0)+(t?_t("outreach",t,s):0))}if(j==="rally"){const t=G,s=re?.current_tick||0;return Math.max(1,Ht.AP_COST+(qt||0)+(t?_t("rally",t,s):0))}if(j==="press_conference"){const t=G,s=re?.current_tick||0;return Math.max(1,1+(tt||0)+(t?_t("press_conference",t,s):0))}const e=wt.find(t=>t.id===j);return e?e.id==="attack"?$t(ot?.polarization):e.ap:0}async function nt(e,t,s,p){ot=e,G=t,re=s,Ve=p;const i=document.getElementById("actions-container");if(!i)return;let n=s?.current_tick||0;if(!n){const{data:c}=await L.from("shard").select("current_tick").eq("name","Alpha Shard").single();n=c?.current_tick||0,s&&(s.current_tick=n)}const a=t,v=e,{data:l}=await L.from("factions").select("action_points, party_funds, last_action_tick").eq("id",a.id).single();l&&(a.action_points=l.action_points,a.party_funds=l.party_funds,a.last_action_tick=l.last_action_tick);const d=a.action_points??0,g=await ns(L,v.id),h=new Set(g?.party_ids||[]);Te=a.id===v.ruling_faction_id||h.has(a.id);const{data:r}=await L.from("faction_ideology").select("*").eq("faction_id",a.id).single();it=r;const m=(p||[]).filter(c=>c.id!==a.id);let _={},f=2;if(!Te){const{data:c}=await L.from("protest_log").select("id, status, tier, tick_called, tick_resolved, crisis_started_tick, crisis_duration, demand_label, turnout_score, effects_applied, grievance_type, grievance_data").eq("faction_id",a.id).in("status",["resolving","crisis_active"]).limit(1).maybeSingle();X=c;const x=ps(a.protest_use_count||0,a.protest_last_use_tick,n);if(f=fs(x),_=pa(a,n,!0,c),c)Pe=c.status==="resolving"?"resolving":"active";else if(a.protest_locked_by)Pe="locked";else if(a.protest_cooldown_until_tick&&a.protest_cooldown_until_tick>n)Pe="cooldown";else{const{data:$}=await L.from("protest_log").select("id, tier, turnout_score, effects_applied, tick_resolved, roll_breakdown, condition_score").eq("faction_id",a.id).eq("status","resolved").gte("tick_resolved",n-1).order("tick_resolved",{ascending:!1}).limit(1).maybeSingle();$&&$.tick_resolved===n?(Pe="result",X=$):Pe=null}}if(Ue=null,st=!1,!Te&&!X){const{data:c}=await L.from("protest_log").select("id, faction_id, status, tier, demand_label, grievance_type").eq("nation_id",v.id).eq("status","resolving").neq("faction_id",a.id).limit(1).maybeSingle();if(c){Ue=c;const{data:x}=await L.from("protest_endorsements").select("id").eq("protest_id",c.id).eq("faction_id",a.id).maybeSingle();st=!!x}}if(Je=null,Te){const{data:c}=await L.from("protest_log").select("id, tier, status, public_address_last_tick, tier7_demand, crisis_started_tick, crisis_duration").eq("nation_id",v.id).eq("status","crisis_active").order("crisis_started_tick",{ascending:!1}).limit(1).maybeSingle();Je=c}const{data:o}=await L.from("campaign_actions").select("action_type, tick_performed").eq("party_id",a.id).gte("tick_performed",n-10).order("tick_performed",{ascending:!1}),{data:y}=await L.from("ideology_shift_actions").select("id, action_type, target_axis, target_direction, drift_rate, created_tick, status, band_shift_total").eq("faction_id",a.id).in("status",["active","paused","suspended"]);Ze={},zt={};const b={fund_think_tank:ce.THINK_TANK.COOLDOWN_WINDOW,media_campaign:ce.MEDIA_CAMPAIGN.COOLDOWN_WINDOW,grassroots_movement:ce.GRASSROOTS.COOLDOWN_WINDOW,take_stance:ne.COOLDOWN_WINDOW,poll_now:Vs.COOLDOWN_WINDOW};for(const c of o||[]){const x=c.action_type,$=b[c.action_type];if($){const T=c.tick_performed+$-n;T>0&&(!Ze[x]||T>Ze[x])&&(Ze[x]=T)}c.tick_performed===n&&(zt[x]=!0)}pt=y||[];for(const[c,x]of[["outreach",$=>kt=$],["rally",$=>qt=$],["press_conference",$=>tt=$]]){const $=(o||[]).filter(T=>T.action_type===c);if($.length>0){const T=Math.max(...$.map(A=>A.tick_performed));x(Math.max(0,$.length-(n-T)))}else x(0)}Gt(i,a,v,d,m,r,n,_,f)}function Gt(e,t,s,p,i,n,a,v,l){const d=[...wt];Te||d.push({id:"protest",name:"Organise a Protest",ap:l||2,color:"#d9534f",icon:"!",category:"momentum",affects:"Momentum",desc:"Mobilize citizens against the government. A strong turnout forces a crisis and builds your momentum, but a fizzle hands the ruling party a free headline."});const g=d.find(o=>o.id===j);let h="";if(t.pyrrhic_victory_until_tick&&t.pyrrhic_victory_until_tick>a){const o=t.pyrrhic_victory_until_tick-a;h+=`<div class="protest-pyrrhic-banner">
            <span style="font-weight:700">PYRRHIC VICTORY</span> — ${o} tick${o!==1?"s":""} remaining. AP income reduced by 2/tick.
        </div>`}if(Te&&Je){const o=Je,y=o.public_address_last_tick!=null?Math.max(0,qe.PUBLIC_ADDRESS_COOLDOWN-(a-o.public_address_last_tick)):0,b=p>=qe.PUBLIC_ADDRESS_AP&&y===0,c=y>0?" ca-item--cooldown":"",x=y>0?`${y} TICK CD`:`${qe.PUBLIC_ADDRESS_AP} AP`;h+=`<div class="ca-item ca-item--public-address${c}${b?"":" disabled"}" data-action-id="public_address" style="${b?"":"opacity:0.5;"}">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#5b9bd5">&#9788;</span>
                    <span class="ca-item-name">Public Address</span>
                </div>
                <span class="ca-item-ap">${x}</span>
            </div>
            <div class="ca-item-desc" style="font-size:9px;color:#4a4840;">Issue a public statement calling for calm. Reduces civil unrest buildup this tick.</div>
        </div>`}const r=[];let m=null;for(const o of d)o.category&&(!m||o.category!==m.key)&&(m={key:o.category,actions:[]},r.push(m)),m&&m.actions.push(o);for(let o=0;o<r.length;o++){const y=r[o],b=Ga.find(c=>c.key===y.key);b&&(h+=`<div style="font-family:var(--dfont-mono);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${b.color};padding:8px 6px 2px;${o>0?"border-top:1px solid var(--dborder-0);margin-top:4px;":""}">${b.label}</div>`),h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:0 2px;">';for(const c of y.actions){const x=j===c.id;if(c.id==="protest"){h+=`<div style="grid-column:1/-1">${eo(c,x,p,t,a)}</div>`;continue}let T=c.id==="attack"?$t(s?.polarization):c.id==="outreach"?3+(kt||0):c.id==="rally"?Ht.AP_COST+(qt||0):c.id==="press_conference"?1+(tt||0):c.ap;["outreach","press_conference","rally","attack"].includes(c.id)&&t.leader_positive_traits&&(T=Math.max(1,T+_t(c.id,t,a)));const A=c.id,C=Ze[A]||0,w=C>0,u=!!zt[A],I=pt.some(B=>B.action_type===c.id.replace("fund_","")),E=p>=T&&!w&&!u,O=x?c.color:E?c.color+"55":"var(--dtext-3)",z=x?`background:${c.color}08;`:"",P=x?`border-color:${c.color}33;`:"",N=x?c.color:"var(--dtext-0)",R=c.affects==="Momentum"?"#f97316":c.affects==="Appeal"?"#38bdf8":c.affects.includes("Ideology")?"#a78bfa":c.affects==="Alignment"?"#f59e0b":"#6b7280",F=u?`${c.name} already used this turn`:"",S=u?'<span class="ca-used-badge">USED</span>':w?`<span class="ca-cd-badge">${C} tick${C!==1?"s":""} CD</span>`:I?(()=>{const B=pt.find(W=>W.action_type===c.id.replace("fund_",""));return B?.status==="suspended"?'<span class="ca-active-badge" style="background:#d4a017">SUSPENDED</span>':B?.status==="paused"?'<span class="ca-active-badge" style="background:#f97316">PAUSED</span>':'<span class="ca-active-badge">ACTIVE</span>'})():"";h+=`<div class="ca-item${x?" selected":""}${E?"":" disabled"}${w?" ca-item--cooldown":""}${u?" ca-item--used":""}" data-action-id="${c.id}" style="border-left-color:${O};${z}${P}${E?"":"opacity:0.35;"}">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:${c.color}">${c.icon}</span>
                        <span class="ca-item-name" style="color:${N}">${k(c.name)}</span>
                        ${S}
                    </div>
                    <span class="ca-item-ap">${u?"USED":w?`${C} TICK CD`:`${T} AP`}</span>
                </div>
                <div class="ca-item-desc">${k(c.desc)}</div>
                ${u?`<div class="ca-item-used-msg">${k(F)}</div>`:`<div class="ca-item-affects" style="color:${R}">This action affects ${c.affects}</div>`}
            </div>`}h+="</div>"}let _="";if(!g)_='<div class="ca-panel"><div class="ca-panel-empty"><div class="ca-panel-empty-text">Choose an action</div></div></div>';else{if(_=`<div class="ca-panel" style="border-color:${g.color}22">`,Ge)_+=io(Ge);else if(g.id==="protest"&&Pe==="result"&&X)_+=no(X);else if(g.id==="protest"&&Pe==="resolving")_+=lo();else{_+=ja(g,i,n,s);const o=Bt(),y=ys(),b=p>=o&&y;_+=`<div class="ca-confirm-row"><div class="ca-confirm-btn${b?"":" disabled"}" style="background:${b?g.color:"var(--dtext-3)"}" id="ca-confirm-btn">Confirm — ${o} AP</div></div>`}_+="</div>"}let f="";if(pt.length>0){const o={think_tank:ce.THINK_TANK.DURATION,media_campaign:ce.MEDIA_CAMPAIGN.DURATION+ce.MEDIA_CAMPAIGN.VISIBILITY_TICKS,grassroots_movement:ce.GRASSROOTS.DURATION},y={think_tank:"Think Tank",media_campaign:"Media Campaign",grassroots_movement:"Grassroots Movement"},b={};for(const $ of te)b[$.key]=$;const c=$=>$==="think_tank"||$==="grassroots_movement";f=`<div class="ca-active-actions" style="margin-top:16px;">
            <div class="pe-header"><span class="pol-mod-title">Active Actions</span></div>
            <table class="pol-el-table" style="margin-top:4px"><thead><tr><th>Action</th><th>Activated</th><th>Effect</th><th style="text-align:right">Ticks Left</th><th></th></tr></thead><tbody>${pt.map($=>{const T=o[$.action_type]||50,A=a-$.created_tick,C=Math.max(0,T-A),w=b[$.target_axis],u=w?`${w.leftLabel}–${w.rightLabel}`:"",I=$.target_direction==="left"?w?.leftLabel:$.target_direction==="right"?w?.rightLabel:$.target_direction==="expand"?`Expand ${u}`:$.target_direction==="narrow"?`Narrow ${u}`:$.target_direction||"?",E=$.drift_rate?`+${$.drift_rate}/tick ${I}`:I,O=he($.created_tick),z=$.status==="paused",P=$.status==="suspended",N=P?'<span style="color:#d4a017;font-weight:600">SUSPENDED</span>':z?'<span style="color:#f97316;font-weight:600">PAUSED</span>':`${C}`;let R="";return c($.action_type)?z||P?R=`<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="continue" data-id="${$.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#5cb85c;color:#fff;border:none;border-radius:3px">Continue — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${$.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`:R=`<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="suspend" data-id="${$.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#c8a44e;color:#fff;border:none;border-radius:3px">Suspend — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${$.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`:R="<td></td>",`<tr>
                <td style="font-weight:600">${y[$.action_type]||$.action_type}</td>
                <td>${O}</td>
                <td>${E}</td>
                <td style="text-align:right">${N}</td>
                ${R}
            </tr>`}).join("")}</tbody></table>
        </div>`}e.innerHTML=`<div class="ca-wrap"><div class="ca-list">${h}</div>${_}</div>
    ${f}
    <div class="ca-portfolios" style="margin-top:16px;">
    </div>
    <div class="pe-container">
        <div class="pe-header"><span class="pol-mod-title">Party Events</span></div>
        <div id="party-events-feed" class="pe-feed"><div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px">Loading events...</div></div>
    </div>
    <div id="ca-stance-portfolio-container" style="margin-top:16px;"></div>`,Et(document.getElementById("ca-stance-portfolio-container"),t,s),Aa(s.id,t.id),e.querySelectorAll(".ca-manage-btn").forEach(o=>{o.addEventListener("click",async y=>{if(y.stopPropagation(),o.dataset.executing)return;o.dataset.executing="true",o.style.opacity="0.4";const b=o.dataset.id,c=o.dataset.action;try{let x;if(c==="suspend"?x=await Ks(L,t.id,b,a):c==="continue"?x=await Ys(L,t.id,b,a):c==="cancel"&&(x=await Xs(L,t.id,s.id,b,a)),x?.success){x.newAp!=null&&(t.action_points=x.newAp);const $=await Me(t.id);$!==void 0&&(t.action_points=$),Z(x.message||"Done.",!1),await nt(s,t,re,Ve)}else Z(x?.message||"Action failed.")}catch(x){Z("Error: "+x.message)}finally{o.dataset.executing="",o.style.opacity="1"}})}),e.querySelectorAll(".ca-item").forEach(o=>{o.addEventListener("click",async()=>{const y=o.dataset.actionId;if(y==="public_address"&&Je){if(o.classList.contains("disabled")||o.dataset.executing)return;o.dataset.executing="true",o.style.opacity="0.4";try{const x=await va(L,t.id,s.id,Je.id,a);if(x.success){t.action_points=x.newAp;const $=await Me(t.id);$!==void 0&&(t.action_points=$),await nt(s,t,re,Ve)}else Z(x.error||"Public Address failed."),o.style.opacity="",delete o.dataset.executing}catch(x){Z("Error: "+(x.message||"Unknown")),o.style.opacity="",delete o.dataset.executing}return}const b=wt.find(x=>x.id===y),c=b?.id==="attack"?$t(s?.polarization):b?.ap;b&&p<c||(j===y?j=null:j=y,Ua(),Ge=null,Gt(e,t,s,p,i,n,a,v,l))})}),ro(e,t,s,p,i,n,a,v,l)}function ja(e,t,s,p,i,n){return e.id==="rally"?Wa():e.id==="attack"?Za(t):e.id==="protest"?to(p):e.id==="take_stance"?Va():e.id==="poll_now"?bs():e.id==="fund_think_tank"?Ka():e.id==="media_campaign"?Ya():e.id==="grassroots_movement"?Xa():e.id==="pivot"?Ja():e.id==="press_conference"?'<div class="ca-info-box">Hold a press conference to make a public statement. Result depends on your position and approval.<br><br><strong>Base roll:</strong> -2 to +2 Momentum<br><strong>Opposition bonus:</strong> +1<br><strong>Government bonus:</strong> +2 (if gov approval ≥ 40)</div>':e.id==="outreach"?'<div class="ca-info-box">Engage directly with communities through town halls, door-knocking, and local events.<br><br><strong>Effect:</strong> +3 Platform Appeal</div>':""}function Wa(){return'<div class="ca-info-box">Hold a rally to energize your base. Random outcome that directly affects your Momentum — can boost or backfire.</div>'}function Va(e){let t=`<div class="ca-info-box">Declare your party's position on an issue. Stances build platform appeal but decay over time.</div>`;t+='<div class="ca-subtitle" style="margin-top:10px">Select Issue</div><div style="display:flex;flex-direction:column;gap:3px">';const s=Object.entries(xe),p=Qe?s.sort((i,n)=>{const a=Qe.find(l=>l.issue_id===i[0])?.salience??0;return(Qe.find(l=>l.issue_id===n[0])?.salience??0)-a}):s;for(const[i,n]of p){const a=fe===i,v=Qe?.find(d=>d.issue_id===i),l=v?Number(v.salience).toFixed(0):"—";t+=`<div class="ca-option-chip${a?" selected":""}" data-stance-issue-id="${i}" style="padding:6px 10px;display:flex;justify-content:space-between;align-items:center;${a?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
            <span style="font-weight:600">${k(n.label)}</span>
            <span style="font-size:10px;color:var(--dtext-3)">Salience: ${l}</span>
        </div>`}if(t+="</div>",fe){const i=xe[fe];if(i&&i.axes.length>0){t+='<div class="ca-subtitle" style="margin-top:12px">Choose Axis</div><div style="display:flex;flex-direction:column;gap:3px">';for(const n of i.axes){const a=te.find(l=>l.key===n);if(!a)continue;const v=ue===n;t+=`<div class="ca-option-chip${v?" selected":""}" data-stance-axis-key="${n}" style="padding:6px 10px;${v?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                    <span style="color:${a.leftColor}">${a.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="color:${a.rightColor}">${a.rightLabel}</span>
                </div>`}t+="</div>"}}if(ue){const i=te.find(n=>n.key===ue);if(i){t+='<div class="ca-subtitle" style="margin-top:12px">Choose Side</div><div style="display:flex;gap:8px">';const n=pe==="left",a=pe==="right";t+=`<div class="ca-option-chip${n?" selected":""}" data-stance-side-val="left" style="flex:1;text-align:center;padding:8px;${n?`border-color:${i.leftColor};color:${i.leftColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${i.leftLabel}</span></div>`,t+=`<div class="ca-option-chip${a?" selected":""}" data-stance-side-val="right" style="flex:1;text-align:center;padding:8px;${a?`border-color:${i.rightColor};color:${i.rightColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${i.rightLabel}</span></div>`,t+="</div>"}}if(pe){const i=te.find(v=>v.key===ue),n=pe==="left"?i?.leftLabel??"Left":i?.rightLabel??"Right",a=pe==="left"?i?.leftColor??"#ccc":i?.rightColor??"#ccc";t+='<div class="ca-subtitle" style="margin-top:12px">Intensity</div><div style="display:flex;gap:6px">';for(const[v,l]of Object.entries(ne.INTENSITY)){const d=ke===v;t+=`<div class="ca-option-chip${d?" selected":""}" data-stance-int-val="${v}" style="flex:1;text-align:center;padding:6px 4px;${d?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                <div style="font-weight:600;font-size:11px">${v}</div>
                <div style="font-size:9px;color:var(--dtext-3);margin-top:2px">Str ${l.strength} · -${l.decay_rate}/t</div>
                <div style="font-size:9px;color:${a};margin-top:1px;font-weight:600">+${l.ideology_shift} ${n}</div>
            </div>`}if(t+="</div>",ke){const v=ne.INTENSITY[ke],l=xe[fe];t+=`<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                <div style="color:var(--dtext-1);font-weight:600;margin-bottom:4px">${ke.toUpperCase()} ${n.toUpperCase()} on ${l?.label||""}</div>
                <div style="color:${a};font-weight:700">Ideology: +${v.ideology_shift} ${n}</div>
                <div style="color:var(--dtext-3);margin-top:2px">Strength: ${v.strength} · Decay: -${v.decay_rate}/tick</div>
            </div>`}}return t}function bs(){return`<div class="ca-info-box">Commission a poll to update the Current Electoral Standing table. Higher investment produces more accurate results.</div>
    <div style="margin-top:8px;">
        <label style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);text-transform:uppercase;display:block;margin-bottom:4px;">Investment Level</label>
        <div style="display:flex;gap:6px;">
            <button class="ca-poll-tier-btn${we===1?" selected":""}" onclick="window._selectPollTier(1)" style="flex:1;padding:6px;background:${we===1?"var(--dbg-hover)":"var(--dbg-3)"};border:1px solid ${we===1?"var(--dtext-1)":"var(--dborder-0)"};border-radius:2px;color:var(--dtext-0);font-family:var(--dfont-mono);font-size:10px;cursor:pointer;text-align:center;">
                <strong>1 AP</strong><br><span style="color:var(--damber)">±5%</span>
            </button>
            <button class="ca-poll-tier-btn${we===3?" selected":""}" onclick="window._selectPollTier(3)" style="flex:1;padding:6px;background:${we===3?"var(--dbg-hover)":"var(--dbg-3)"};border:1px solid ${we===3?"var(--dtext-1)":"var(--dborder-0)"};border-radius:2px;color:var(--dtext-0);font-family:var(--dfont-mono);font-size:10px;cursor:pointer;text-align:center;">
                <strong>3 AP</strong><br><span style="color:var(--dgreen)">±3%</span>
            </button>
        </div>
    </div>
    `}function Ka(){let e=`<div class="ca-info-box">Launch a think tank to gradually drift the electorate's ideological mean on a chosen axis. ${ce.THINK_TANK.AP_COST} AP upfront + ${ce.THINK_TANK.TICK_AP_COST} AP/tick for ${ce.THINK_TANK.DURATION} ticks. Drift: 1d3 (0.1–0.3) per tick.</div>`;if(e+=Ct(),K){const t=te.find(s=>s.key===K);t&&(e+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',e+=St(t.leftLabel,t.rightLabel,"left","right"))}return e}function Ya(){const e=ce.MEDIA_CAMPAIGN;let t=`<div class="ca-info-box">Launch a media campaign to expand or narrow electorate ideological variance on a chosen axis. Phase 1: 1d5 (0.1–0.5) variance shift/tick for ${e.DURATION} ticks. Phase 2: 1d3 (1–3) momentum/tick for ${e.VISIBILITY_TICKS} ticks.</div>`;return t+=Ct(),K&&(t+='<div class="ca-subtitle" style="margin-top:12px">Variance direction</div>',t+=St("Expand (polarize)","Narrow (centralize)","expand","narrow")),t}function Xa(){const e=ce.GRASSROOTS;let t=`<div class="ca-info-box">Launch a grassroots movement to slowly shift the electorate on a chosen axis. ${e.AP_COST} AP upfront + ${e.TICK_AP_COST} AP/tick for ${e.DURATION} ticks. Drift: 1d2 (${e.DRIFT_MIN}–${e.DRIFT_MAX})/tick. +1 momentum every ${e.VISIBILITY_INTERVAL} ticks.</div>`;if(t+=Ct(),K){const s=te.find(p=>p.key===K);s&&(t+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',t+=St(s.leftLabel,s.rightLabel,"left","right"))}return t}function Ja(e){const t=G,s=re?.current_tick||0;let p=t?.pivot_count||0;const i=t?.pivot_last_tick||0;s-i>=Ie.ESCALATION_RESET&&(p=0);const n=Math.max(0,Ie.COOLDOWN-(s-i)),a=i>0&&n>0;let v=`<div class="ca-info-box">Shift your party's ideological position. Each pivot costs +1 AP more than the last (resets after ${Ie.ESCALATION_RESET} ticks of no pivots). Reversing direction costs extra AP. Hold steady 20+ ticks for a conviction bonus.</div>`;if(a&&(v+=`<div style="font-family:var(--dfont-mono);font-size:11px;color:var(--damber);padding:6px 0">Cooldown: ${n} tick${n!==1?"s":""} remaining</div>`),v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);padding:4px 0">Pivots this cycle: ${p} · Next cost: ${Ie.BASE_AP+p} AP${p>0?" (escalated)":""}</div>`,v+=Ct(),K){const l=te.find(d=>d.key===K);if(l){const d=it?Number(it[K]??0):0,g=d>0?`+${d} (${l.rightLabel})`:d<0?`${d} (${l.leftLabel})`:"0 (Center)";if(v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);padding:4px 0;margin-top:4px">Current position: <span style="font-weight:700">${g}</span></div>`,v+='<div class="ca-subtitle" style="margin-top:8px">Pivot direction</div>',v+=St(l.leftLabel,l.rightLabel,"left","right"),Q){const h=Q==="right"?1:-1;(d>0&&h<0||d<0&&h>0)&&(v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);padding:6px 0;border-top:1px solid var(--dborder-1);margin-top:8px">⚠ Reversal: +${Ie.REVERSE_AP_EXTRA} AP extra</div>`)}}}return v}function Ct(){let e='<div class="ca-subtitle" style="margin-top:10px">Target axis</div><div style="display:flex;flex-direction:column;gap:4px">';for(const t of te){const s=K===t.key;e+=`<div class="ca-option-chip${s?" selected":""}" data-axis-key="${t.key}" style="padding:6px 10px;${s?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">
            <span style="font-weight:600">${t.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="font-weight:600">${t.rightLabel}</span>
            <span style="font-size:0.75em;color:var(--dtext-3);margin-left:6px">${t.description}</span>
        </div>`}return e+="</div>",e}function St(e,t,s,p){let i='<div style="display:flex;gap:8px">';const n=Q===s,a=Q===p;return i+=`<div class="ca-option-chip${n?" selected":""}" data-direction-value="${s}" style="flex:1;text-align:center;padding:8px;${n?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${e}</div>`,i+=`<div class="ca-option-chip${a?" selected":""}" data-direction-value="${p}" style="flex:1;text-align:center;padding:8px;${a?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${t}</div>`,i+="</div>",i}function Za(e){const t=ot?.polarization||0,s=$t(t);let i=`<div style="color:#ef4444;font-size:0.85em;margin-bottom:4px">Using this will increase Polarization by 0.25.${s>ds.AP_COST?` Cost scaled to ${s} AP (polarization ${Math.round(t)}).`:""}</div><div class="ca-subtitle">Select target party</div>`;for(const n of e){const a=Ne===n.id;i+=`<div class="ca-rival-card${a?" selected":""}" data-rival-id="${n.id}" style="border-left-color:${a?"#ef4444":n.party_color||"#888"};${a?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
            <span class="ca-rival-name" style="color:${a?"#ef4444":"var(--dtext-0)"}">${k(n.faction_name)}</span>
        </div>`}if(Ne&&Fe){i+='<div class="ca-subtitle" style="margin-top:12px">Choose attack vector</div>';for(const n of Fe){const a=Ce===n.id;n.strength==="strong"||n.strength;const v=n.evidence_required&&n.strength==="weak",l=n.strength==="strong"?"#4ade80":n.strength==="moderate"?"#facc15":"#ef4444";i+=`<div class="ca-vector-card${a?" selected":""}${v?" disabled":""}" data-vector-id="${n.id}" style="border-left-color:${a?"#ef4444":l};${a?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="ca-vector-name">${k(n.name)}</span>
                    <span class="ca-vector-strength" style="color:${l}">${n.strength.toUpperCase()}</span>
                </div>
                <div class="ca-vector-desc">${k(n.description)}</div>
            </div>`}if(Ce){const n=Fe.find(a=>a.id===Ce);if(n){const a=Js(n.strength),v=Math.max(...Object.values(a));i+='<div style="margin-top:10px">';const l={devastating:"#4ade80",effective:"#22d3ee",glancing:"#facc15",backfire:"#f97316",mutual:"#ef4444"};for(const d of Zs){const g=a[d.id]||0,h=v>0?g/v*100:0,r=l[d.id]||"#888";i+=`<div class="ca-outcome-bar">
                        <span class="ca-outcome-name">${k(d.name)}</span>
                        <div class="ca-outcome-track"><div class="ca-outcome-fill" style="width:${h}%;background:${r}"></div></div>
                        <span class="ca-outcome-pct" style="color:${r}">${g}%</span>
                    </div>`}i+="</div>"}}}else Ne&&!Fe&&(i+='<div class="ca-info-box" style="margin-top:12px">Loading evidence...</div>');return i}async function Qa(e,t,s){if(!je){const{data:p}=await L.from("ministries").select("ministry_key, minister_first_name, minister_last_name, minister_approval, party_id").eq("nation_id",e.id).not("party_id","is",null).order("minister_approval",{ascending:!0});je=p||[]}if(!at){const{data:p}=await L.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",e.id);at=(p||[]).map(i=>({...i,duration:s-(i.started_at_tick||0)}))}if(!We){const{data:p}=await L.from("stat_history").select("stat_name, value, tick").eq("nation_id",e.id).gte("tick",s-6).order("tick",{ascending:!0}),i={};for(const l of p||[])i[l.stat_name]||(i[l.stat_name]=[]),i[l.stat_name].push({tick:l.tick,value:l.value});const n=[];for(const[l,d]of Object.entries(i)){if(ya(l))continue;const g=d.sort((o,y)=>o.tick-y.tick),h=e[l]??g[g.length-1]?.value??0;if(!(ms(l)?h>=70:h<=30))continue;const m=g[0]?.value??h,_=h-m,f=ba(h,m,l);n.push({key:l,current:h,sixTicksAgo:m,delta:_,failureScore:f,displayName:l.replace(/_/g," ").replace(/\b\w/g,o=>o.toUpperCase())})}n.sort((l,d)=>d.failureScore-l.failureScore);const{data:a}=await L.from("protest_log").select("tick_called").eq("nation_id",e.id).gte("tick_called",s-6),v=ha((a||[]).map(l=>({tick:l.tick_called})),s);We={failingStats:n,_fatigueLevel:v}}}function eo(e,t,s,p,i){const n=Pe,a=e.ap,v=s>=a;if(n==="resolving")return`<div class="ca-item ca-item--protest ca-item--resolving" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#c8a64e">!</span>
                    <span class="ca-item-name" style="color:#c8a64e">${k(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#c8a64e">RESOLVING...</span>
            </div>
        </div>`;if(n==="result"&&X){const r=X.tier;if(r>=3&&r<=5){const m=vs(r).toUpperCase(),_=X.roll_breakdown||{},f=_.endorsements||0,o=_.joint_bonus||0;return`<div class="ca-item ca-item--protest ca-item--result-${r}" data-action-id="protest">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:#5cb85c">!</span>
                        <span class="ca-item-name" style="color:#5cb85c">${k(e.name)}</span>
                    </div>
                    <span class="ca-item-ap" style="color:#5cb85c">TIER ${r} — ${m}</span>
                </div>
                ${f>0?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#a78bfa;margin-top:2px;padding:0 12px 4px">${f} party endorsement${f>1?"s":""} (+${o} bonus)</div>`:""}
            </div>`}}if(n==="active"&&X){const r=(X.crisis_started_tick??i)+(X.crisis_duration||6)-i,m=X.tier===6&&(p.action_points||0)>=qe.CALL_OFF_AP,_=X.tier===7;return`<div class="ca-item ca-item--protest ca-item--active" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${k(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">ACTIVE — TIER ${X.tier}</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Your protest crisis is running. ${X.demand_label?`Demand: ${k(X.demand_label)}`:""}</div>
            <div class="protest-passive-status">Running — ${Math.max(0,r)} tick${r!==1?"s":""} remaining.</div>
            ${_?'<div class="protest-calloff-note">Tier 7 protests cannot be called off.</div>':`<div class="protest-calloff-btn${m?"":" disabled"}" onclick="window._protestCallOff()">Call Off Protest — ${qe.CALL_OFF_AP} AP</div>`}
        </div>`}if(n==="locked")return`<div class="ca-item ca-item--protest ca-item--locked" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${k(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">LOCKED</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">A protest crisis is already underway, led by another party.</div>
        </div>`;if(n==="cooldown"){const r=(p.protest_cooldown_until_tick||0)-i;return`<div class="ca-item ca-item--protest ca-item--cooldown" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.3)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.3)">${k(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#4a4840">COOLDOWN ${Math.max(0,r)}</span>
            </div>
        </div>`}if(Ue&&!n){const r=!st&&(p.action_points||0)>=1,m=st?"ENDORSED":"ENDORSE — 1 AP";return`<div class="ca-item ca-item--protest ca-item--endorse" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#a78bfa">!</span>
                    <span class="ca-item-name" style="color:#a78bfa">${k(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#a78bfa">ENDORSEMENT</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Another opposition party has called a protest. You can endorse it to boost turnout (+15 per endorsement).</div>
            ${Ue.demand_label?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#f97316;padding:0 12px 4px">Demand: ${k(Ue.demand_label)}</div>`:""}
            <div class="protest-endorse-btn${r?"":" disabled"}" onclick="window._protestEndorse()">${m}</div>
        </div>`}return`<div class="ca-item ca-item--protest${t?" selected":""}${v?"":" disabled"}" data-action-id="protest" style="border-left-color:${t?"#d9534f":v?"rgba(217,83,79,0.55)":"var(--dtext-3)"};${t?"background:rgba(217,83,79,0.07);":""}${t?"border-color:rgba(217,83,79,0.2);":""}${v?"":"opacity:0.35;"}">
        <div class="ca-item-head">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="ca-item-icon" style="color:#d9534f">!</span>
                <span class="ca-item-name" style="color:${t?"#e06460":"var(--dtext-0)"}">${k(e.name)}</span>
            </div>
            <span class="ca-item-ap" style="color:#d9534f">${a} AP</span>
        </div>
        ${t?`<div class="ca-item-desc">${k(e.desc)}</div>`:""}
    </div>`}function to(e,t){let s="";s+='<div class="protest-warning">Turnout is probabilistic — based on Civil Unrest, Happiness, Polarisation, and Political Violence. A fizzle hands the government a free headline. Choose your moment.</div>';const p=[{key:"civil_unrest",label:"CIVIL UNREST",value:e.civil_unrest||0},{key:"happiness",label:"HAPPINESS",value:e.happiness||50},{key:"polarization",label:"POLARISATION",value:e.polarization||0},{key:"political_violence",label:"POL VIOLENCE",value:e.political_violence||0}];s+='<div class="protest-stat-hints">';for(const l of p){const d=ma(l.key,l.value);s+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">${l.label}</span>
            <span class="protest-stat-pill__value" style="color:${d}">${Math.round(l.value)}</span>
        </div>`}const i=We?._fatigueLevel||{label:"...",color:"#4a4840"};s+=`<div class="protest-stat-pill">
        <span class="protest-stat-pill__label">PROTEST FATIGUE</span>
        <span class="protest-stat-pill__value" style="color:${i.color}">${i.label}</span>
    </div>`;const n=(Ve||[]).filter(l=>!(l.id===G?.id||Te)).length;if(n>0){const l=n>=2?"#a78bfa":"#4a4840";s+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">ENDORSERS</span>
            <span class="protest-stat-pill__value" style="color:${l}">${n}</span>
        </div>`}s+="</div>";const a=[{id:"minister",label:"Minister"},{id:"activeCrisis",label:"Active Crisis"},{id:"statFailure",label:"Stat Failure"}];s+='<div class="protest-tabs">';for(const l of a)s+=`<div class="protest-tab${Xe===l.id?" active":""}" data-protest-tab="${l.id}">${l.label}</div>`;s+="</div>",s+='<div class="protest-target-list" id="protest-target-list">',Xe==="minister"?s+=so():Xe==="activeCrisis"?s+=ao():Xe==="statFailure"&&(s+=oo()),s+="</div>";const v=de?.label||null;return s+='<div class="protest-confirm">',s+=`<div class="protest-confirm__note">${v?`Targeting: ${k(v)}`:"Select a target above"}</div>`,s+="</div>",s}function so(){const e=je;if(!e)return'<div class="protest-empty">Loading ministers...</div>';if(e.length===0)return'<div class="protest-empty">No government ministers found.</div>';let t="";for(const s of e){const p=Math.round(s.minister_approval||50),i=p>50?"high":p>=35?"mid":"low",n=de?.id===s.ministry_key,a=JSON.stringify({id:s.ministry_key,type:"minister",label:`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()||s.ministry_key,demandLabel:`${(s.minister_first_name||"")+" "+(s.minister_last_name||"")} must resign.`.trim(),grievanceData:{ministryKey:s.ministry_key,approval:p,name:`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()}}).replace(/"/g,"&quot;");t+=`<div class="protest-target${n?" selected":""}" data-protest-target="${a}">
            <div>
                <div class="protest-target__name">${k(`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()||s.ministry_key)}</div>
                <div class="protest-target__meta">${k(s.ministry_key)}</div>
            </div>
            <span class="protest-target__value protest-target__value--${i}">${p}%</span>
        </div>`}return t}function ao(){const e=at;if(!e)return'<div class="protest-empty">Loading active crises...</div>';if(e.length===0)return'<div class="protest-empty">No active crises in this nation.</div>';let t="";for(const s of e){const p=de?.id===s.id,i=s.crisis_templates?.name||"Unknown Crisis",n=s.crisis_templates?.description||"",a=s.duration||0,v=`The government must resolve the ${i} crisis.`,l=JSON.stringify({id:s.id,type:"activeCrisis",label:i,demandLabel:v,grievanceData:{crisisId:s.id,name:i,duration:a}}).replace(/"/g,"&quot;");t+=`<div class="protest-target${p?" selected":""}" data-protest-target="${l}">
            <div>
                <div class="protest-target__name">${k(i)}</div>
                <div class="protest-target__meta">${k(n?n.slice(0,80):"")}${a?" · "+a+"t active":""}</div>
            </div>
        </div>`}return t}function oo(e,t){const s=We?.failingStats;if(!s)return'<div class="protest-empty">Loading stats...</div>';if(s.length===0)return'<div class="protest-empty">No stats are bad enough to protest. Stats must be critically failing (≥70 for negative stats, ≤30 for positive stats).</div>';let p="";for(const i of s){const n=de?.id===i.key,a=ms(i.key)?"&#9650;":"&#9660;",v=JSON.stringify({id:i.key,type:"statFailure",label:i.displayName,demandLabel:`The government must address ${i.displayName}.`,grievanceData:{statKey:i.key,failureScore:i.failureScore,current:i.current}}).replace(/"/g,"&quot;");p+=`<div class="protest-target${n?" selected":""}" data-protest-target="${v}">
            <div>
                <div class="protest-target__name">${k(i.displayName)}</div>
                <div class="protest-target__meta">${Math.round(i.current)} <span class="protest-target__delta" style="color:#d9534f">${a} ${Math.abs(i.delta).toFixed(1)}</span></div>
            </div>
            <span class="protest-target__value protest-target__value--low">${i.failureScore.toFixed(1)}</span>
        </div>`}return p}function io(e){if(!e)return"";const t=!e.error&&e.success,s=t?"#4ade80":"#ef4444";let p=`<div class="ca-result-box" style="border-color:${s}33">`;if(p+=`<div class="ca-result-header" style="background:${s}08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:${s}">${k(e.headline||(t?"Action completed":"Action failed"))}</span>
        <span class="ca-result-dismiss" id="ca-dismiss-result">Dismiss</span>
    </div>`,p+='<div class="ca-result-body">',e.effects&&e.effects.length>0)for(const i of e.effects){const n=i.bloc||i.label||i.stat||"",a=i.value??i.delta??0,v=a>=0?"#4ade80":"#ef4444";p+=`<div class="ca-result-row">
                <span class="ca-result-label">${k(n)}</span>
                <span class="ca-result-val" style="color:${v}">${a>=0?"+":""}${a}</span>
            </div>`}if(e.blocEffects&&e.blocEffects.length>0)for(const i of e.blocEffects)p+=`<div class="ca-result-row">
                <span class="ca-result-label">${k(i.blocName)}</span>
                <span class="ca-result-val" style="color:#4ade80">+${i.delta}</span>
            </div>`;return e.outcomeName&&(p+=`<div class="ca-result-row">
            <span class="ca-result-label">Outcome</span>
            <span class="ca-result-val" style="color:${s}">${k(e.outcomeName)}</span>
        </div>`),p+="</div></div>",p}function no(e){const t=e.tier||0,s=vs(t).toUpperCase(),p=e.roll_breakdown||{},i=e.condition_score??e.turnout_score??0,n=p.endorsements||0,a=p.joint_bonus||0,v=e.effects_applied||[];let l='<div class="ca-result-box" style="border-color:#5cb85c33">';if(l+=`<div class="ca-result-header" style="background:#5cb85c08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#5cb85c">Protest Result — Tier ${t}</span>
    </div>`,l+='<div class="ca-result-body">',l+=`<div class="ca-result-row">
        <span class="ca-result-label">Outcome</span>
        <span class="ca-result-val" style="color:#5cb85c">${s}</span>
    </div>`,l+=`<div class="ca-result-row">
        <span class="ca-result-label">Condition Score</span>
        <span class="ca-result-val" style="color:var(--dtext-1)">${Math.round(i)}</span>
    </div>`,Object.keys(p).length>0){l+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Score Breakdown</div>`;const g=new Set(["endorsements","joint_bonus"]);for(const[h,r]of Object.entries(p)){if(g.has(h))continue;const m=h.replace(/_/g," ").replace(/\b\w/g,o=>o.toUpperCase()),_=Number(r),f=_>=0?"#4ade80":"#ef4444";l+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${k(m)}</span>
                <span class="ca-result-val" style="color:${f};font-size:10px">${_>=0?"+":""}${_.toFixed(1)}</span>
            </div>`}l+="</div>"}n>0&&(l+=`<div class="protest-endorse-breakdown">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#a78bfa;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:2px">Coalition Support</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-1)">${n} party endorsement${n>1?"s":""} — +${a} bonus</div>
        </div>`);const d=v.filter(g=>g.stat&&g.stat!=="electoral_wound");if(d.length>0){l+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Effects on Nation</div>`;for(const g of d){const h=(g.stat||"").replace(/_/g," ").replace(/\b\w/g,_=>_.toUpperCase()),r=Number(g.delta||g.value||0),m=r>=0?"#4ade80":"#ef4444";l+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${k(h)}</span>
                <span class="ca-result-val" style="color:${m};font-size:10px">${r>=0?"+":""}${r}</span>
            </div>`}l+="</div>"}return l+="</div></div>",l}function lo(){const e=X;let t='<div class="ca-result-box" style="border-color:rgba(217,83,79,0.3)">';if(t+=`<div class="ca-result-header" style="background:rgba(217,83,79,0.06)">
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
    </div>`,t+="</div></div>",t}function ro(e,t,s,p,i,n,a,v,l){const d=()=>Gt(e,t,s,p,i,n,a,v,l);e.querySelectorAll("[data-rival-id]").forEach(r=>{r.addEventListener("click",async()=>{const m=r.dataset.rivalId;if(Ne===m)return;Ne=m,Ce=null,Fe=null,d();const _=await Qs(L,m,s.id);Fe=ea(_),d()})}),e.querySelectorAll("[data-vector-id]").forEach(r=>{r.addEventListener("click",()=>{r.classList.contains("disabled")||(Ce=Ce===r.dataset.vectorId?null:r.dataset.vectorId,d())})}),e.querySelectorAll("[data-stance-issue-id]").forEach(r=>{r.addEventListener("click",()=>{const m=r.dataset.stanceIssueId;fe===m?fe=null:fe=m,ue=null,pe=null,ke="moderate";const _=xe[fe];_&&_.axes.length===1&&(ue=_.axes[0]),d()})}),e.querySelectorAll("[data-stance-axis-key]").forEach(r=>{r.addEventListener("click",()=>{const m=r.dataset.stanceAxisKey;ue=ue===m?null:m,pe=null,d()})}),e.querySelectorAll("[data-stance-side-val]").forEach(r=>{r.addEventListener("click",()=>{const m=r.dataset.stanceSideVal;pe=pe===m?null:m,d()})}),e.querySelectorAll("[data-stance-int-val]").forEach(r=>{r.addEventListener("click",()=>{ke=r.dataset.stanceIntVal,d()})}),j==="take_stance"&&!Qe&&!Ge&&L.from("issue_state").select("issue_id, salience").eq("nation_id",s.id).then(({data:r})=>{Qe=r||[],d()}),e.querySelectorAll("[data-axis-key]").forEach(r=>{r.addEventListener("click",()=>{const m=r.dataset.axisKey;K===m?K=null:K=m,Q=null,d()})}),e.querySelectorAll("[data-direction-value]").forEach(r=>{r.addEventListener("click",()=>{const m=r.dataset.directionValue;Q=Q===m?null:m,d()})}),e.querySelectorAll("[data-grassroots-demo]").forEach(r=>{r.addEventListener("click",()=>{r.dataset.grassrootsDemo,d()})}),e.querySelectorAll("[data-grassroots-band]").forEach(r=>{r.addEventListener("click",()=>{r.dataset.grassrootsBand,d()})});const g=e.querySelector("#ca-dismiss-result");g&&g.addEventListener("click",()=>{Ge=null,d()}),j==="protest"&&!Ge&&!je&&!dt&&(dt=!0,Qa(s,t,a).then(()=>{dt=!1,d()}).catch(r=>{console.error("[Protest] loadProtestData failed:",r),dt=!1,je=je||[],at=at||[],We=We||{failingStats:[],_fatigueLevel:{label:"—",color:"#4a4840"}},d()})),e.querySelectorAll("[data-protest-tab]").forEach(r=>{r.addEventListener("click",()=>{Xe=r.dataset.protestTab,de=null,d()})}),e.querySelectorAll("[data-protest-target]").forEach(r=>{r.addEventListener("click",()=>{const m=r.dataset.protestTarget;try{const _=JSON.parse(m);de=de?.id===_.id?null:_}catch{de=null}d()})});const h=e.querySelector("#ca-confirm-btn");h&&h.addEventListener("click",()=>{h.classList.contains("disabled")||(h.classList.add("disabled"),co(e,t,s,p,i,n,a))})}let Mt=!1;window._protestEndorse=async function(){if(!Mt&&!(!Ue||st)&&confirm("Endorse this protest? Costs 1 AP and boosts turnout (+15).")){Mt=!0;try{const e=await fa(L,G.id,ot.id,Ue.id,re.current_tick);if(!e.success){Z(e.error||"Endorsement failed.");return}st=!0,G.action_points=Math.max(0,(G.action_points||0)-1);const t=await Me(G.id);t!==void 0&&(G.action_points=t),await nt(ot,G,re,Ve)}catch(e){console.error("[Protest] Endorse failed:",e),Z("Endorsement failed: "+e.message)}finally{Mt=!1}}};let Ot=!1;window._protestCallOff=async function(){if(!Ot&&X){if(X.tier===7){Z("Tier 7 protests cannot be called off.");return}if(confirm("Call off this protest? Costs "+qe.CALL_OFF_AP+" AP. A small approval boost from moderate blocs will be applied.")){Ot=!0;try{const e=await ua(L,G.id,X.id,re.current_tick);if(!e.success){Z(e.error||"Call-off failed.");return}G.action_points=Math.max(0,(G.action_points||0)-qe.CALL_OFF_AP);const t=await Me(G.id);t!==void 0&&(G.action_points=t),await nt(ot,G,re,Ve)}catch(e){console.error("[Protest] Call-off failed:",e),Z("Call-off failed: "+e.message)}finally{Ot=!1}}}};async function co(e,t,s,p,i,n,a){const v=wt.find(r=>r.id===j)||(j==="protest"?{id:"protest",name:"Organise a Protest",ap:Bt(),color:"#d9534f"}:null);if(!v)return;const l=Bt();if(p<l||!ys())return;const d=document.getElementById("ca-confirm-btn");d&&(d.classList.add("disabled"),d.textContent="EXECUTING...");let g;try{if(v.id==="rally")g=await ta(L,t.id,s.id,null,a);else if(v.id==="attack")g=await sa(L,t.id,s.id,Ne,Ce,a);else if(v.id==="protest"){if(!de)return;const r=de.grievanceData||{},m=de.demandLabel||"";g=await ga(L,t.id,s.id,de.type,r,m,a)}else if(v.id==="take_stance")g=await Ft(L,t.id,s.id,fe,ue,pe,ke,a);else if(v.id==="poll_now")g=await aa(L,t.id,s.id,a,we);else if(v.id==="fund_think_tank")g=await oa(L,t.id,s.id,K,Q,a);else if(v.id==="media_campaign")g=await ia(L,t.id,s.id,K,Q,a);else if(v.id==="grassroots_movement")g=await na(L,t.id,s.id,K,Q,a);else if(v.id==="press_conference"){const{deductAP:r}=await ht(async()=>{const{deductAP:b}=await import("./config-fKhFNVuq.js");return{deductAP:b}},[]),{getTraitAPModifier:m}=await ht(async()=>{const{getTraitAPModifier:b}=await import("./elections-DdjUo3Fx.js").then(c=>c.a8);return{getTraitAPModifier:b}},__vite__mapDeps([0,1,2,3,4,5])),_=m("press_conference",t,a),f=Math.max(1,1+(tt||0)+_),o="Press Conference"+(_!==0?" (trait "+(_>0?"+":"")+_+")":""),y=await r(L,t.id,f,{reason:"press_conference",detail:o,tick:a});if(!y.success)g={success:!1,error:y.error||"Insufficient AP"};else{let b=Math.floor(Math.random()*5)-2;if(Te?(s.gov_approval||0)>=40&&(b+=2):b+=1,(tt||0)>0&&b!==0){const $=b>0?1:-1,T=Math.max(.25,1-tt*.25);b=Math.round(b*T),b===0&&(b=$)}const c=b>=0?"+":"",{error:x}=await L.rpc("adjust_momentum",{p_faction_id:t.id,p_delta:b,p_label:`Press Conference (${c}${b})`,p_tick:a});x&&console.warn("[PressConference] Momentum RPC failed:",x.message),await L.from("campaign_actions").insert({party_id:t.id,nation_id:s.id,action_type:"press_conference",ap_cost:f,tick_performed:a,result:{momentumDelta:b}}),g={success:!0,newAp:y.newAp,headline:"Press Conference",effects:[{label:"Press Coverage",value:`${c}${b}`}],outcomeName:`Press conference — ${c}${b} momentum`}}}else if(v.id==="outreach"){const{deductAP:r}=await ht(async()=>{const{deductAP:o}=await import("./config-fKhFNVuq.js");return{deductAP:o}},[]),{getTraitAPModifier:m}=await ht(async()=>{const{getTraitAPModifier:o}=await import("./elections-DdjUo3Fx.js").then(y=>y.a8);return{getTraitAPModifier:o}},__vite__mapDeps([0,1,2,3,4,5])),_=Math.max(1,3+(kt||0)+m("outreach",t,a)),f=await r(L,t.id,_,{reason:"outreach",detail:"Community Outreach",tick:a});if(!f.success)g={success:!1,error:f.error||"Insufficient AP"};else{const{data:o}=await L.from("faction_electoral_standing").select("id, platform_appeal").eq("faction_id",t.id).eq("nation_id",s.id).maybeSingle();if(o){const y=Math.min(100,(Number(o.platform_appeal)||0)+3);await L.from("faction_electoral_standing").update({platform_appeal:y}).eq("id",o.id)}await L.from("campaign_actions").insert({party_id:t.id,nation_id:s.id,action_type:"outreach",ap_cost:_,tick_performed:a,result:{appealBoost:3}}),g={success:!0,newAp:f.newAp,headline:"Community Outreach",effects:[{label:"Appeal",value:"+3"}],outcomeName:"Community outreach — +3 platform appeal"}}}else if(v.id==="pivot"&&(g=await la(L,t.id,s.id,K,Q,a),g.success)){const{data:r}=await L.from("factions").select("pivot_count, pivot_last_tick, pivot_cycle_start_tick").eq("id",t.id).single();r&&(t.pivot_count=r.pivot_count,t.pivot_last_tick=r.pivot_last_tick,t.pivot_cycle_start_tick=r.pivot_cycle_start_tick),it=null}}catch(r){console.error("Campaign action error:",r),Z("Action failed: "+r.message),d&&(d.classList.remove("disabled"),d.textContent=`Confirm — ${l} AP`);return}if(!g||!g.success){Z(g?.message||g?.error||"Action failed."),d&&(d.classList.remove("disabled"),d.textContent=`Confirm — ${l} AP`);return}t.action_points=g.newAp??(t.action_points??0)-l;const h=await Me(t.id);if(h!==void 0&&(t.action_points=h),Ge=g,await nt(s,t,re,Ve),v.id==="take_stance"){At(t.id,s.id);const r=document.getElementById("ca-stance-portfolio-container");r&&(r.querySelector(".sp-card")?.remove(),Et(r,t,s))}}const xt=[{key:"security_freedom",blocKey:"axis_security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",blocKey:"axis_tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"individualism_collectivism",blocKey:"axis_individualism_collectivism",leftLabel:"Individualism",rightLabel:"Collectivism"},{key:"globalism_nationalism",blocKey:"axis_globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"liberty_equality",blocKey:"axis_liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"}];async function Et(e,t,s){const[p,i,n]=await Promise.all([L.from("faction_issue_stance").select("*").eq("faction_id",t.id).eq("nation_id",s.id),L.from("issue_state").select("issue_id, salience, owned_by, pioneer_faction_id").eq("nation_id",s.id),L.from("shard").select("current_tick").eq("name","Alpha Shard").single()]);p.error&&console.error("[Politics] Failed to load stances:",p.error.message),i.error&&console.error("[Politics] Failed to load issue states:",i.error.message);const a=p.data||[],v=i.data||[],l=n.data?.current_tick||0,d=vt(v,"issue_id"),g=ne.MAX_STANCES,h=a.length>=g;let r="";if(a.length===0)r='<div class="sp-empty">No active stances. Take a stance on an issue to build platform appeal.</div>';else for(const f of a){const o=xe[f.issue_id];if(!o)continue;const y=te.find(P=>P.key===f.axis),b=f.side==="left"?y?.leftLabel:y?.rightLabel,c=f.side==="left"?y?.leftColor:y?.rightColor,x=Number(f.strength??0),$=Number(f.decay_rate??0),T=Number(f.ticks_held??0),A=x<=40,C=x<=20,w=C?"var(--dred)":A?"var(--damber)":"var(--dgreen)",u=d[f.issue_id],I=Number(u?.salience??30),E=f.ideologically_consistent?"":'<span class="sp-badge sp-badge--warn">INCONSISTENT</span>',O=f.is_pioneer?'<span class="sp-badge sp-badge--good">PIONEER</span>':"",z=A?`<span class="sp-badge sp-badge--fade">${C?"EXPIRING":"FADING"}</span>`:"";r+=`
            <div class="sp-row" data-stance-issue="${f.issue_id}">
                <div class="sp-row-top">
                    <div class="sp-row-left">
                        <span class="sp-issue-name">${k(o.label)}</span>
                        <span class="sp-side-pill" style="color:${c};border-color:${c}">${f.intensity} ${b}</span>
                        ${O}${E}${z}
                    </div>
                    <div class="sp-row-right">
                        <span class="sp-salience" title="Issue salience">Salience: ${I.toFixed(0)}</span>
                        <span class="sp-ticks">Held ${T} ticks</span>
                    </div>
                </div>
                <div class="sp-bar-row">
                    <div class="sp-bar-track">
                        <div class="sp-bar-fill" style="width:${x}%;background:${w}"></div>
                    </div>
                    <span class="sp-str-val" style="color:${w}">${x.toFixed(0)}</span>
                    <span class="sp-decay" style="color:var(--dred)">-${$}/tick</span>
                </div>
                <div class="sp-row-actions">
                    <button class="sp-btn sp-btn--reinforce" data-stance-action="reinforce" data-stance-issue="${f.issue_id}" data-stance-axis="${f.axis}" data-stance-side="${f.side}" data-stance-intensity="${f.intensity}">Reinforce</button>
                    <button class="sp-btn sp-btn--modify" data-stance-action="modify" data-stance-issue="${f.issue_id}">Modify</button>
                </div>
            </div>`}const m=`
    <div class="sp-card" style="margin-top:20px;max-width:780px;">
        <div class="sp-card-header">
            <div class="sp-card-title">Active Stance Portfolio</div>
            <div class="sp-card-count">${a.length} / ${g}</div>
        </div>
        <div class="sp-stances">${r}</div>
        <div class="sp-footer">
            <button class="sp-btn sp-btn--new${h?" sp-btn--disabled":""}" id="sp-new-stance-btn" ${h?'disabled title="Maximum stances reached (5/5)"':""}>
                + New Stance${h?" (5/5)":""}
            </button>
            <span class="sp-footer-hint">${ne.AP_COST} AP · ${ne.COOLDOWN_WINDOW}-tick cooldown</span>
        </div>
    </div>`;e.insertAdjacentHTML("beforeend",m),e.querySelectorAll('[data-stance-action="reinforce"]').forEach(f=>{f.addEventListener("click",async()=>{if((t.action_points||0)<ne.AP_COST){Z(`Need ${ne.AP_COST} AP to reinforce stance.`);return}const o=f.dataset.stanceIssue,y=f.dataset.stanceAxis,b=f.dataset.stanceSide,c=f.dataset.stanceIntensity;f.disabled=!0,f.textContent="Reinforcing...";try{const x=await Ft(L,t.id,s.id,o,y,b,c,l);if(x.success){x.newAp!=null&&(t.action_points=x.newAp,G&&(G.action_points=x.newAp));const $=await Me(t.id);$!==void 0&&(t.action_points=$,G&&(G.action_points=$)),e.querySelector(".sp-card")?.remove(),await Et(e,t,s),At(t.id,s.id)}else Z(x.message||"Failed to reinforce stance."),f.disabled=!1,f.textContent="Reinforce"}catch(x){Z("Reinforce failed: "+x.message),f.disabled=!1,f.textContent="Reinforce"}})}),e.querySelectorAll('[data-stance-action="modify"]').forEach(f=>{f.addEventListener("click",()=>{is(t,s,l,d,a,f.dataset.stanceIssue)})});const _=document.getElementById("sp-new-stance-btn");_&&!h&&_.addEventListener("click",()=>{is(t,s,l,d,a,null)})}function is(e,t,s,p,i,n){document.getElementById("stance-modal-overlay")?.remove();const a=new Set(i.map(o=>o.issue_id)),v=i.length>=ne.MAX_STANCES,l=cs.map(o=>({id:o,def:xe[o],salience:Number(p[o]?.salience??30),hasStance:a.has(o)})).sort((o,y)=>y.salience-o.salience);let d="";for(const o of l){const y=!o.hasStance&&v,b=o.id===n,c=o.salience>=60?"var(--dred)":o.salience>=40?"var(--damber)":"var(--dtext-3)",x=o.def.axes.map($=>{const T=te.find(A=>A.key===$);return T?`${T.leftLabel}/${T.rightLabel}`:$}).join(", ");d+=`
        <div class="sm-issue${b?" sm-issue--selected":""}${y?" sm-issue--disabled":""}"
             data-sm-issue="${o.id}" ${y?"":'role="button" tabindex="0"'}>
            <div class="sm-issue-top">
                <span class="sm-issue-name">${k(o.def.label)}</span>
                ${o.hasStance?'<span class="sm-issue-badge">HAS STANCE</span>':""}
            </div>
            <div class="sm-issue-meta">
                <span class="sm-issue-salience" style="color:${c}">Salience: ${o.salience.toFixed(0)}</span>
                <span class="sm-issue-axes">${x}</span>
            </div>
        </div>`}const g=`
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
                <button class="sp-btn sp-btn--new" id="sm-confirm-btn" disabled>Confirm Stance (${ne.AP_COST} AP)</button>
            </div>
        </div>
    </div>`;document.body.insertAdjacentHTML("beforeend",g);let h=n,r=null,m=null,_="moderate";function f(){const o=document.getElementById("sm-config-area"),y=document.getElementById("sm-footer");if(!o||!h){o&&(o.innerHTML=""),y&&(y.style.display="none");return}const b=xe[h];if(!b)return;b.axes.length===1&&!r&&(r=b.axes[0]);let c='<div class="sm-section-label" style="margin-top:14px;">Choose Axis</div><div class="sm-axis-list">';for(const C of b.axes){const w=te.find(I=>I.key===C);if(!w)continue;c+=`<div class="sm-axis-opt${C===r?" sm-axis-opt--selected":""}" data-sm-axis="${C}">
                <span style="color:${w.leftColor}">${w.leftLabel}</span> / <span style="color:${w.rightColor}">${w.rightLabel}</span>
            </div>`}c+="</div>";let x="";if(r){const C=te.find(w=>w.key===r);x=`<div class="sm-section-label" style="margin-top:14px;">Choose Side</div><div class="sm-side-list">
                <div class="sm-side-opt${m==="left"?" sm-side-opt--selected":""}" data-sm-side="left" style="border-color:${C.leftColor}">
                    <span style="color:${C.leftColor};font-weight:700">${C.leftLabel}</span>
                </div>
                <div class="sm-side-opt${m==="right"?" sm-side-opt--selected":""}" data-sm-side="right" style="border-color:${C.rightColor}">
                    <span style="color:${C.rightColor};font-weight:700">${C.rightLabel}</span>
                </div>
            </div>`}let $="";if(m){const C=te.find(I=>I.key===r),w=m==="left"?C?.leftLabel??"Left":C?.rightLabel??"Right",u=m==="left"?C?.leftColor??"#ccc":C?.rightColor??"#ccc";$='<div class="sm-section-label" style="margin-top:14px;">Intensity</div><div class="sm-intensity-list">';for(const[I,E]of Object.entries(ne.INTENSITY))$+=`<div class="sm-int-opt${I===_?" sm-int-opt--selected":""}" data-sm-intensity="${I}">
                    <span class="sm-int-name">${I}</span>
                    <span class="sm-int-meta">Strength ${E.strength} · Decay ${E.decay_rate}/tick</span>
                    <span class="sm-int-meta" style="color:${u};font-weight:600">+${E.ideology_shift} ${w}</span>
                </div>`;if($+="</div>",_){const I=ne.INTENSITY[_],E=xe[h];$+=`<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                    <div style="color:var(--dtext-1);font-weight:600;margin-bottom:3px">${_.toUpperCase()} ${w.toUpperCase()} on ${E?.label||""}</div>
                    <div style="color:${u};font-weight:700">Ideology: +${I.ideology_shift} ${w}</div>
                    <div style="color:var(--dtext-3);margin-top:2px">Strength: ${I.strength} · Decay: -${I.decay_rate}/tick</div>
                </div>`}}o.innerHTML=c+x+$;const T=h&&r&&m&&_;y.style.display=T?"flex":"none";const A=document.getElementById("sm-confirm-btn");A&&(A.disabled=!T),o.querySelectorAll("[data-sm-axis]").forEach(C=>{C.addEventListener("click",()=>{r=C.dataset.smAxis,m=null,f()})}),o.querySelectorAll("[data-sm-side]").forEach(C=>{C.addEventListener("click",()=>{m=C.dataset.smSide,f()})}),o.querySelectorAll("[data-sm-intensity]").forEach(C=>{C.addEventListener("click",()=>{_=C.dataset.smIntensity,f()})})}document.querySelectorAll("[data-sm-issue]").forEach(o=>{o.classList.contains("sm-issue--disabled")||o.addEventListener("click",()=>{document.querySelectorAll(".sm-issue").forEach(y=>y.classList.remove("sm-issue--selected")),o.classList.add("sm-issue--selected"),h=o.dataset.smIssue,r=null,m=null,f()})}),document.getElementById("sm-close-btn")?.addEventListener("click",()=>{document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("stance-modal-overlay")?.addEventListener("click",o=>{o.target.id==="stance-modal-overlay"&&document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("sm-confirm-btn")?.addEventListener("click",async()=>{const o=document.getElementById("sm-confirm-btn");if(!o||o.disabled)return;o.disabled=!0,o.textContent="Taking stance...";const y=await Ft(L,e.id,t.id,h,r,m,_,s);if(y.success){y.newAp!=null&&(e.action_points=y.newAp,G&&(G.action_points=y.newAp));const b=await Me(e.id);b!==void 0&&(e.action_points=b,G&&(G.action_points=b)),document.getElementById("stance-modal-overlay")?.remove();const c=document.getElementById("electorate-spread-container");c&&(c.querySelector(".sp-card")?.remove(),await Et(c,e,t)),At(e.id,t.id)}else Z(y.message||"Failed to take stance."),o.disabled=!1,o.textContent=`Confirm Stance (${ne.AP_COST} AP)`}),n&&f()}async function At(e,t){const s=document.getElementById("stance-summary-strip");if(!s)return;const{data:p}=await L.from("faction_issue_stance").select("issue_id, axis, side, intensity, strength, decay_rate, ticks_held, is_pioneer, ideologically_consistent").eq("faction_id",e).eq("nation_id",t),i=ne.MAX_STANCES;if(!p||p.length===0){s.innerHTML=`<div style="color:var(--dtext-3);font-size:12px;font-family:var(--dfont-ui);padding:4px 0;">
            No active stances. Take a stance in the <span style="color:var(--dtext-0);font-weight:600">Actions</span> tab.
        </div>`;return}let n="";for(const a of p){const v=xe[a.issue_id];if(!v)continue;const l=te.find(x=>x.key===a.axis),d=a.side==="left"?l?.leftLabel:l?.rightLabel,g=a.side==="left"?l?.leftColor:l?.rightColor,h=Number(a.strength??0),r=Number(a.decay_rate??0),m=Number(a.ticks_held??0),_=h<=20,f=h<=40,o=_?"var(--dred)":f?"var(--damber)":"var(--dgreen)",y=a.is_pioneer?'<span style="font-size:9px;color:#4ade80;font-weight:700;margin-left:4px">PIONEER</span>':"",b=a.ideologically_consistent===!1?'<span style="font-size:9px;color:#f97316;font-weight:700;margin-left:4px">INCONSISTENT</span>':"",c=f?`<span style="font-size:9px;color:${o};font-weight:700;margin-left:4px">${_?"EXPIRING":"FADING"}</span>`:"";n+=`
        <div style="padding:6px 0;${n?"border-top:1px solid var(--dborder-0);":""}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:2px">
                    <span style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${k(v.label)}</span>
                    <span style="font-size:10px;padding:1px 5px;border:1px solid ${g};border-radius:3px;color:${g};margin-left:4px">${a.intensity} ${d}</span>
                    ${y}${b}${c}
                </div>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3)">Held ${m}t</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;height:6px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">
                    <div style="width:${h}%;height:100%;background:${o};border-radius:2px"></div>
                </div>
                <span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${o};width:28px;text-align:right">${h.toFixed(0)}</span>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);width:40px;text-align:right">-${r}/t</span>
            </div>
        </div>`}s.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-family:var(--dfont-mono);font-size:11px;color:var(--dtext-2)">${p.length} / ${i}</span>
        </div>
        ${n}
        <div style="margin-top:8px;font-size:10px;color:var(--dtext-3);font-family:var(--dfont-ui)">Manage stances in the <span style="color:var(--dtext-0);font-weight:600">Actions</span> tab</div>`}const po=[{key:"security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"},{key:"globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"individualism_collectivism",leftLabel:"Individual",rightLabel:"Collectivism"}];async function vo(e,t,s,p,i,n,a,v){const l=document.getElementById("other-parties-container");if(!l)return;const d=(s||[]).filter(c=>c.id!==e.id);if(d.map(c=>c.id),d.length===0){l.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No rival parties found.</div>';return}const g=vt(p,"faction_id"),{score:h}=us(t,v?.stats_at_start,v?.started_at_tick,a),r=vt(d),m=i&&i.party_ids?i.party_ids:[],_=i?i.lead_party_id:null,f=d.map(c=>{const x=r[c.id]||{},$=g[c.id]||{},T=x.leader_first_name&&x.leader_last_name?x.leader_first_name+" "+x.leader_last_name:"Vacant",A=x.leader_age||null,C=Number(c.national_vote_share||0);let w="opposition";m.includes(c.id)&&(w=c.id===_?"governing_head":"governing_junior");const u=w.startsWith("governing"),I=Math.round((u?h:-h)*10);return{id:c.id,name:c.faction_name||"Unknown",abbreviation:c.abbreviation||"??",color:c.party_color||"#888",customLogoUrl:c.custom_logo_url||null,partyLogo:c.party_logo||null,description:c.party_description||"",status:w,foundedTick:x.founded_tick,leaderName:T,leaderAge:A,seats:c.seats||0,totalSeats:n,voteShare:C,govScore:I,ideology:{security_freedom:$.security_freedom??0,tradition_progress:$.tradition_progress??0,liberty_equality:$.liberty_equality??0,globalism_nationalism:$.globalism_nationalism??0,individualism_collectivism:$.individualism_collectivism??0},stances:[]}});let o="seats";const y={seats:(c,x)=>x.seats-c.seats,vote_share:(c,x)=>x.voteShare-c.voteShare,approval:(c,x)=>x.govScore-c.govScore,alignment:(c,x)=>{const $=Object.values(c.ideology).reduce((A,C)=>A+Math.abs(C),0);return Object.values(x.ideology).reduce((A,C)=>A+Math.abs(C),0)-$}};function b(){const x=[...f].sort(y[o]).map($=>mo($)).join("");l.innerHTML=`
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
        <div class="op-grid">${x}</div>`,l.querySelectorAll(".op-sort-btn").forEach($=>{$.addEventListener("click",()=>{o=$.getAttribute("data-op-sort"),b()})})}b()}function mo(e,t){const s=e.color,p=ct(s,.12),i=ct(s,.35),n=ct(s,.5),a=ct(s,.2),v=ct(s,.06),l=Dt({customLogoUrl:e.customLogoUrl,iconKey:e.partyLogo,size:32,color:s});let d,g;e.status==="governing_head"?(d="GOVERNING — HEAD",g="op-badge-green"):e.status==="governing_junior"?(d="GOVERNING — JUNIOR",g="op-badge-green"):(d="OPPOSITION",g="op-badge-red");const h=e.foundedTick!=null?he(e.foundedTick):null,r=h?`<span class="op-badge op-badge-party" style="color:${s};border-color:${i};font-size:12px">Est. ${k(h)}</span>`:"",m=`<span class="op-badge op-badge-party" style="color:${s};border-color:${i};font-size:12px">Leader: ${k(e.leaderName)}${e.leaderAge?" ("+e.leaderAge+")":""}</span>`,_=e.description?`<div class="op-desc" style="font-size:13px;line-height:1.6">${k(e.description)}</div>`:"",f=e.govScore>2?"var(--dgreen)":e.govScore>0||e.govScore>-2?"var(--damber)":"var(--dred)",o=e.govScore>0?"+":"",y=e.status.startsWith("governing")?"GOV":"OPP";let b="";for(const w of po){const u=e.ideology[w.key]??0,I=(u+100)/2;let E;u>0?E=`left:50%;width:${u/2}%;background:${n}`:u<0?E=`right:50%;width:${Math.abs(u)/2}%;background:${n}`:E=`left:50%;width:0%;background:${n}`,b+=`
        <div class="op-axis">
            <div class="op-axis-poles"><span>${w.leftLabel}</span><span>${w.rightLabel}</span></div>
            <div class="op-axis-track">
                <div class="op-axis-center"></div>
                <div class="op-axis-fill" style="${E}"></div>
                <div class="op-axis-dot" style="left:${I}%;background:${a};border-color:${s}"></div>
            </div>
        </div>`}const c=Object.values(e.ideology).filter(w=>Math.abs(w)>=50).length;let x,$,T;return c>=4?(x="var(--dgreen)",$="Strong Conviction",T=`${c} strong positions. Consistent ideological identity across axes.`):c<=1?(x="var(--dred)",$="Weak Conviction",T=`Only ${c} strong position${c===1?"":"s"}. Centrist on most axes — voters may not trust their platform.`):(x="var(--dteal)",$="Established Party",T=`${c} strong positions. Moderate ideological clarity.`),`
    <div class="op-card" style="background:linear-gradient(135deg, ${v} 0%, var(--dbg-2) 40%);border-color:${i}">
        <div class="op-card-hdr" style="border-bottom-color:${i}">
            <div class="op-logo-wrap" style="background:${p};border:1px solid ${i};border-radius:6px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${l}</div>
            <div class="op-hdr-info">
                <div class="op-name" style="color:${s}">${k(e.name)}</div>
                <div class="op-meta">
                    <span class="op-badge ${g}">${d}</span>
                    ${r}
                    ${m}
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
                    <span class="op-sr-label">Governance <span style="font-size:8px;color:var(--dtext-3)">${y}</span></span>
                    <span class="op-sr-val" style="color:${f}">${o}${e.govScore}</span>
                </div>
                <div class="op-rule"></div>
                <div class="op-sec-label">Ideology Axes</div>
                ${b}
                <div class="op-insight" style="border-left-color:${x}">
                    <div class="op-insight-label" style="color:${x}">${$}</div>
                    <div class="op-insight-body">${T}</div>
                </div>
            </div>
            <div class="op-col-right">
                <div class="op-sec-label">Active Issue Stances</div>
                <div style="color:var(--dtxt-dim);font-size:10px;font-style:italic;padding:8px 0;">Rival stance tracking coming soon.</div>
                
            </div>
        </div>
    </div>`}function ct(e,t){const s=e.replace("#",""),p=parseInt(s.substring(0,2),16)||0,i=parseInt(s.substring(2,4),16)||0,n=parseInt(s.substring(4,6),16)||0;return`rgba(${p},${i},${n},${t})`}async function fo(e,t,s,p,i,n,a,v,l,d,g){const h=document.getElementById("elections-container");if(h)try{const r=v.includes("Governing")||v.includes("Lead")||v==="Strongman",m=us(e,t?.stats_at_start,t?.started_at_tick,a),_=m.deltas,f=m.decayCycles,o=m.multiplier,y=m.ticksInPower,b=m.score*10;_.sort((H,Y)=>Y.signed-H.signed);const c=b>5?"var(--dgreen)":b>0||b>-5?"var(--damber)":"var(--dred)",x=b>0?"+":"",$=r?b:-b,T=$>5?"var(--dgreen)":$>0||$>-5?"var(--damber)":"var(--dred)",A=$>0?"+":"",C=_.map(H=>{const Y=H.signed>0?"var(--dgreen)":"var(--dred)",ee=H.signed>0?"▲":"▼",J=ra(H.key);return`<div class="elec-stat-row">
            <span class="elec-stat-name">${k(J)}</span>
            <span class="elec-stat-start">${H.start.toFixed(1)}</span>
            <span class="elec-stat-arrow" style="color:${Y}">${ee}</span>
            <span class="elec-stat-now">${H.now.toFixed(1)}</span>
            <span class="elec-stat-delta" style="color:${Y}">${H.raw>0?"+":""}${H.raw.toFixed(1)}</span>
        </div>`}).join(""),w=t?.stats_at_start?_.length===0?'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No stat changes recorded yet.</div>':"":'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No administration data available.</div>',u=f>0&&m.score>0?`<div class="elec-decay-note">Incumbency decay: ${((1-o)*100).toFixed(1)}% reduction (${f} cycle${f>1?"s":""})</div>`:"",I=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Governance</span>
        </div>
        <div class="elec-box-body">
            <div class="elec-score-row">
                <div class="elec-score-block">
                    <div class="elec-score-label">${r?"Gov. Score":"National Score"}</div>
                    <div class="elec-score-value" style="color:${c}">${x}${Math.round(b)}</div>
                </div>
                ${r?"":`<div class="elec-score-block">
                    <div class="elec-score-label">Your Impact (Opposition)</div>
                    <div class="elec-score-value" style="color:${T}">${A}${Math.round($)}</div>
                </div>`}
            </div>
            ${u}
            <div class="elec-admin-info">
                <span>${k(t?.admin_name||"Government")}</span>
                <span class="elec-ticks">${y} tick${y!==1?"s":""} in power</span>
            </div>
            ${r?(()=>{const H=Number(e?.gov_approval??50),Y=Math.max(-1,Math.min(1,(H-35)/30)),ee=Math.max(0,1-y/20),J=Math.round(.08*Y*ee*1e3)/10,se=J>0?"var(--dgreen)":J<0?"var(--dred)":"var(--dtext-3)",Ee=J>0?"+":"";return`<div class="elec-incumbency-row" style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:rgba(255,255,255,0.03);border-radius:4px;font-size:11px;">
                    <span style="color:var(--dtext-3)">Incumbency Turnout Modifier</span>
                    <span style="color:${se};font-weight:600">${Ee}${J.toFixed(1)}%</span>
                </div>`})():""}
            <div class="elec-stat-header">
                <span class="elec-stat-name">Stat</span>
                <span class="elec-stat-start">Start</span>
                <span class="elec-stat-arrow"></span>
                <span class="elec-stat-now">Now</span>
                <span class="elec-stat-delta">Delta</span>
            </div>
            <div class="elec-stat-list">
                ${w||C}
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
    </div>`,O=Number(p.momentum??0),P=(O*.08).toFixed(1),N=O>=60?"var(--dgreen)":O>=30?"var(--damber)":"var(--dred)",R=Math.min(100,Math.max(0,O)),F=l?.election_tick||0,S=F>a?F-a:null,B=Array.isArray(p.momentum_log)?p.momentum_log:[],W=B.length>0?B.slice(0,30).map(H=>{const Y=a-(H.tick||0),ee=H.delta>0?"var(--dgreen)":"var(--dred)",J=H.delta>0?"+":"";return`<div class="elec-mom-log-row">
                <span class="elec-mom-log-label">${k(H.label||"Event")}</span>
                <span class="elec-mom-log-delta" style="color:${ee}">${J}${H.delta}</span>
                <span class="elec-mom-log-ago">${Y}t ago</span>
            </div>`}).join(""):'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No momentum events yet.</div>',M=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Momentum</span>
        </div>
        <div class="elec-box-body elec-mom-body">
            <div class="elec-mom-score-row">
                <div class="elec-mom-score">
                    <span class="elec-mom-value" style="color:${N}">${Math.round(O)}</span>
                    <span class="elec-mom-max">/ 100</span>
                </div>
            </div>
            <div class="elec-mom-bar-wrap">
                <div class="elec-mom-bar" style="width:${R}%;background:${N}"></div>
            </div>
            <div class="elec-mom-decay">Decays 8%/tick — currently losing ${P}/tick</div>
            <div class="elec-mom-log-header">Recent Activity</div>
            <div class="elec-mom-log">
                ${W}
            </div>
            ${S?`<div class="elec-mom-election">Next election in ${S} tick${S!==1?"s":""}</div>`:""}
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
    </div>`,{data:U,error:ae}=await L.from("electorate_profile").select("*").eq("nation_id",e.id).maybeSingle();ae&&console.error("[Elections] electorate_profile fetch failed:",ae);const le=vt(n,"faction_id"),_e=le[p.id]||{},Oe=Number(e.polarization??50),Re=Number(e.stability??50),Ut=Number(e.ethnic_diversity??50),jt=5+Math.min(100,Math.max(0,Oe*.9+(100-Re)*.07+Ut*.03))/100*40;let mt="",ze=0;if(U)for(const H of xt){const ee=(Number(_e[H.key]??0)+100)/2,J=Number(U["ideo_mean_"+H.key]??50),se=jt,{zones:Ee,zoneForPos:It}=ca(J,se),De=It(ee),Pt=De.includes("left")?H.leftLabel:De.includes("right")?H.rightLabel:"",He=De==="centrist"?"Centrist":De.includes("moderate")?"Moderate":"Radical",gt=De==="centrist"?"Centrist":`${He} ${Pt}`,Ke=da(ee,J,se),yt=(Ke*100).toFixed(1);ze+=Ke;const rt=[...Ee].sort((V,ie)=>ie.width-V.width)[0],ws=rt.id.includes("left")?H.leftLabel:rt.id.includes("right")?H.rightLabel:"",ks=rt.id==="centrist"?"Centrist":rt.id.includes("moderate")?"Moderate":"Radical",Cs=rt.id==="centrist"?"Centrist":`${ks} ${ws}`,Ss=Ke>=.6?"var(--dgreen)":Ke>=.3?"var(--damber)":"var(--dred)",Es=(Number(U["salience_"+H.key]??.2)*100).toFixed(0),Ae=Math.max(0,J-se),Vt=Math.min(100,J+se),ge=Vt-Ae,As={"radical-left":"rgba(239,68,68,0.10)","moderate-left":"rgba(251,191,36,0.07)",centrist:"rgba(74,222,128,0.08)","moderate-right":"rgba(251,191,36,0.07)","radical-right":"rgba(239,68,68,0.10)"},Kt={"radical-left":"rgba(239,68,68,0.25)","moderate-left":"rgba(251,191,36,0.18)",centrist:"rgba(74,222,128,0.22)","moderate-right":"rgba(251,191,36,0.18)","radical-right":"rgba(239,68,68,0.25)"},Ls={"radical-left":"rgba(239,68,68,0.50)","moderate-left":"rgba(251,191,36,0.45)",centrist:"rgba(74,222,128,0.50)","moderate-right":"rgba(251,191,36,0.45)","radical-right":"rgba(239,68,68,0.50)"};let Yt="";for(const V of Ee){if(V.width<1)continue;const ie=Math.max(V.left,Ae),me=Math.min(V.left+V.width,Vt);if(me<=ie)continue;const Le=(ie-Ae)/ge*100,ye=(me-ie)/ge*100,$e=ye>8;Yt+=`<div class="elec-ideo-zone" style="left:${Le}%;width:${ye}%;background:${As[V.id]};border-left:1px solid ${Kt[V.id]};border-right:1px solid ${Kt[V.id]}">
                    ${$e?`<span class="elec-ideo-zone-label" style="color:${Ls[V.id]}">${V.label}</span>`:""}
                </div>`}const Is=ge>0?(ee-Ae)/ge*100:50,Ps=ge>0?(J-Ae)/ge*100:50,Xt=25,Tt=(V,ie,me)=>Math.exp(-((V-ie)*(V-ie))/(2*me*me)),Jt=Math.max(5,se),Nt=Math.min(1,Math.max(0,(se-10)/30)),Zt=se*.67,Ts=.45-.2*Nt,Qt=Math.max(5,Jt*Ts),Ns=Math.min(100,Math.max(0,J-Zt)),Ms=Math.min(100,Math.max(0,J+Zt));let es=[],bt=0;for(let V=0;V<=Xt;V++){const ie=V/Xt,me=Ae+ie*ge,Le=Tt(me,J,Jt),ye=Math.max(Tt(me,Ns,Qt),Tt(me,Ms,Qt)),$e=(1-Nt)*Le+Nt*ye;es.push({x:ie,y:$e}),$e>bt&&(bt=$e)}let ts="";if(bt>0){const Le=es.map(as=>{const Os=(as.x*100).toFixed(1),Rs=(34-as.y/bt*32).toFixed(1);return`${Os},${Rs}`}),ye=["0,36",...Le,"100,36"].join(" "),$e=Le.join(" ");ts=`<svg class="elec-ideo-density-svg" viewBox="0 0 100 36" preserveAspectRatio="none">
                    <polygon points="${ye}" fill="rgba(90,175,165,0.06)" />
                    <polyline points="${$e}" fill="none" stroke="rgba(90,175,165,0.35)" stroke-width="1" vector-effect="non-scaling-stroke" />
                </svg>`}let ss="";for(const V of i||[]){if(V.id===p.id)continue;const ie=le[V.id];if(!ie)continue;const Le=(Number(ie[H.key]??0)+100)/2,ye=ge>0?(Le-Ae)/ge*100:50;if(ye<-5||ye>105)continue;const $e=V.party_color||"#888";ss+=`<div class="elec-ideo-rival-dot" style="left:${ye}%;background:${$e};" title="${k(V.abbreviation||V.faction_name)}"></div>`}mt+=`
            <div class="elec-ideo-axis">
                <div class="elec-ideo-axis-header">
                    <span class="elec-ideo-axis-name">${k(H.leftLabel)} / ${k(H.rightLabel)}</span>
                    <span class="elec-ideo-salience">Salience: ${Es}%</span>
                </div>
                <div class="elec-ideo-bar-wrap">
                    <div class="elec-ideo-bar-labels">
                        <span>${k(H.leftLabel)}</span>
                        <span>${k(H.rightLabel)}</span>
                    </div>
                    <div class="elec-ideo-bar-track">
                        <div class="elec-ideo-var-band" style="left:${Ae}%;width:${ge}%">
                            ${Yt}
                            ${ts}
                            ${ss}
                            <div class="elec-ideo-mean-marker" style="left:${Ps}%"></div>
                            <div class="elec-ideo-player-marker" style="left:${Is}%"></div>
                        </div>
                    </div>
                    <div class="elec-ideo-bar-labels" style="margin-bottom:12px">
                        <span></span>
                    </div>
                </div>
                <div class="elec-ideo-details">
                    <span class="elec-ideo-position">Your Position: <strong>${k(gt)}</strong></span>
                    <span class="elec-ideo-capture" style="color:${Ss}">Voter Capture: <strong>${yt}%</strong></span>
                </div>
                <div class="elec-ideo-voters">Most voters are <strong>${k(Cs)}</strong></div>
            </div>`}const ft=U?(ze/xt.length*100).toFixed(1):"—",Se=`
    <div class="elec-box elec-box--wide">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--purple"></div>
            <span class="elec-box-title">Ideology</span>
            <span class="elec-ideo-avg">Avg. Capture: <strong style="color:${ze/xt.length>=.6?"var(--dgreen)":ze/xt.length>=.3?"var(--damber)":"var(--dred)"}">${ft}%</strong></span>
        </div>
        <div class="elec-box-body">
            ${U?mt:'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No electorate data available.</div>'}
        </div>
    </div>`,q=`
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
    </div>`,oe={};for(const H of te)oe[H.key]=H;const ve=g||0,Be=(i||[]).reduce((H,Y)=>H+(Y.seats||0),0),xs=Be>0?ve/Be:0,ut=(d||[]).filter(H=>H.is_active!==!1),_s=le[p.id]||{};let lt="";if(ut.length===0){const H=(xs*100).toFixed(0);lt=`<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:16px 4px;text-align:center">
            No active caucuses.<br>Caucuses form when your party holds <strong>50%+</strong> of parliamentary seats.<br>
            <span style="margin-top:6px;display:inline-block">You currently hold <strong>${ve}</strong> / ${Be} seats (${H}%).</span>
        </div>`}else{let H=0;for(const Y of ut){const ee=oe[Y.dominant_axis],J=Math.round(ve*Y.seat_share);let se=0;if(ee){const yt=_s[Y.dominant_axis]??0,Wt=Y.wing_end==="right"?yt:-yt;se=Math.max(-3,Math.min(3,Math.round(Wt/15)))}const Ee=Math.max(1,J+se);H+=Ee;const It=se>0?` <span style="color:var(--dgreen);font-size:9px">(+${se})</span>`:se<0?` <span style="color:var(--dred);font-size:9px">(${se})</span>`:"",De=ee?(Y.wing_end==="left"?ee.leftLabel:ee.rightLabel)+" Wing":Y.dominant_axis,Pt=ee?Y.wing_end==="left"?ee.leftColor:ee.rightColor:"var(--dtext-3)",He=Number(Y.relationship_score??50),gt=He>=60?"var(--dgreen)":He>=30?"var(--damber)":"var(--dred)",Ke=He<30?'<span style="font-family:var(--dfont-mono);font-size:9px;color:var(--dred);font-weight:700;letter-spacing:0.5px;margin-left:4px">VOLATILE</span>':"";lt+=`
            <div style="padding:8px 0;border-bottom:1px solid var(--dborder-1)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${k(Y.name)}</div>
                        <div style="font-family:var(--dfont-mono);font-size:10px;color:${Pt};margin-top:2px">${De}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:var(--dtext-0)">${Ee} seat${Ee!==1?"s":""}${It}</div>
                        <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
                            <div style="width:50px;height:5px;background:var(--dborder-1);border-radius:3px;overflow:hidden">
                                <div style="width:${He}%;height:100%;background:${gt};border-radius:3px;transition:width 0.3s"></div>
                            </div>
                            <span style="font-family:var(--dfont-mono);font-size:10px;color:${gt}">${He}</span>
                            ${Ke}
                        </div>
                    </div>
                </div>
            </div>`}lt=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);margin-bottom:6px;display:flex;justify-content:space-between">
            <span>${ut.length} active caucus${ut.length!==1?"es":""}</span>
            <span>${H} / ${ve} seats</span>
        </div>`+lt}const $s=`
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
                ${lt}
            </div>
        </div>
    </div>`;h.innerHTML=`
    <div class="elec-page">
        <div class="elec-row">
            ${I}
            ${E}
            ${M}
            ${D}
        </div>
        <div class="elec-row" style="margin-top:20px">
            ${Se}
            ${q}
            ${$s}
        </div>
    </div>`}catch(r){console.error("[Elections Tab] Render error:",r),h.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">Failed to load election data. Please refresh.</div>'}}
