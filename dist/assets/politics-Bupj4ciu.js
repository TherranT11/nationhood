const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/bills-D49mgE-b.js","assets/config-BIsh65GI.js","assets/government-structure-Df0JI6nQ.js","assets/stats-D_P-mPhL.js"])))=>i.map(i=>d[i]);
import{_ as I}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as ks,g as De,_ as $t}from"./common-CxfFcfZv.js";import"./guide-C4vj_XhJ.js";import{c as zt,P as Ss,b as Es,g as Nt}from"./party-icons-CJ7uQoDE.js";import{t as Se}from"./utils-C2W-HleY.js";import{initGameConfigForNation as Cs,switchPartyEndorsement as As}from"./config-BIsh65GI.js";import{l as Ls,j as Wt,d as ie,a1 as Is,k as Ps,i as Kt}from"./government-structure-Df0JI6nQ.js";import"./trade-constants-CK6AErXp.js";import{N as Yt,s as Xt}from"./stats-D_P-mPhL.js";import{d as Ts,B as Ns,E as Ms,F as Jt,G as xe,H as Os,S as oe,J as ne,R as Rs,K as Zt,M as Y,L as kt,t as Mt,O as zs,Q as Ds,T as Bs,U as Oe,V as Hs,W as qs,X as Fs,Y as Gs,Z as Us,_ as js,$ as Vs,a0 as Ws,a1 as Dt,a2 as Ks,a3 as Ys,a4 as Xs,a5 as Js,a6 as Zs,f as Qs,a7 as Qt,a8 as ea}from"./bills-D49mgE-b.js";import{g as es,c as ta,P as Ue,e as sa,d as ts,f as aa,i as ss,h as oa,j as ia,k as na,l as as,m as la,n as ra,o as da}from"./protest-CKOqpFZB.js";import"./messaging-5qyQ6ziq.js";const jt=6;function ca({isPresidentialSystem:e=!1,scheduledElections:t=[],currentTick:s=0,playerSeats:d=0}={}){const i=(t||[]).filter(c=>c&&c.election_type==="presidential"&&Number.isFinite(Number(c.election_tick))).sort((c,p)=>Number(c.election_tick)-Number(p.election_tick))[0]||null;let l="",a=null,v=null,n=!1;return e?i?(a=Number(i.election_tick)-Number(s),a<=0?(l="This election has already fired; endorsement is locked for this cycle.",a=null):a>jt?(v=a-jt,l="No presidential election is in the eligible window."):Number(d)<=0&&(l="Your party is not eligible to endorse in this cycle.")):l="No presidential election is in the eligible window.":(n=!0,l="No presidential election is in the eligible window."),{disabled:!!l,disabledReason:l,ticksUntilElection:a,ticksUntilWindow:v,hidden:n}}function ee(e,t=!0){const s=document.getElementById("pol-toast");s&&s.remove();const d=document.createElement("div");d.id="pol-toast",d.style.cssText=`position:fixed;top:20px;right:20px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:13px;font-family:var(--dfont-mono);max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s;${t?"background:#2d1517;color:#f87171;border:1px solid #7f1d1d;":"background:#1a2e1a;color:#86efac;border:1px solid #14532d;"}`,d.textContent=e,document.body.appendChild(d),setTimeout(()=>{d.style.opacity="0",setTimeout(()=>d.remove(),300)},4e3)}ks("politics",async e=>{const{nation:t,faction:s,shard:d}=e;if(!t||!s){document.getElementById("content-area").innerHTML='<div class="pol-loading">No nation or party data available.</div>';return}await Cs(I,t.id);const i=s,l=d?.current_tick||0,{data:a}=await I.from("factions").select("id, seats, national_vote_share, faction_name, abbreviation, party_color, standing, loyalty, last_seen_tick, leader_first_name, leader_last_name, custom_logo_url, party_logo, party_description, momentum, momentum_log").eq("nation_id",t.id).eq("faction_type","party"),v=(a||[]).map(N=>N.id),{data:n}=v.length>0?await I.from("faction_ideology").select("faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism").in("faction_id",v):{data:[]},{currentSeats:c}=await Ls(I,t.id,a||[],i.id),p=(a||[]).reduce((N,q)=>N+(q.seats||0),0),_=c,{data:r}=await I.from("elections").select("election_tick, results").eq("nation_id",t.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle();let x=Number(i.national_vote_share||0).toFixed(1),b=null,u=null;if(r){b=Se(r.election_tick);const N=r.results,M=(N?.votes||(Array.isArray(N)?N:[])).find(D=>D.party_id===i.id);if(M&&typeof M.vote_percentage=="number"&&(x=M.vote_percentage.toFixed(1)),Array.isArray(N)){const D=N.find(U=>U.party_id===i.id);if(D&&typeof D.seats_won=="number"){const U=typeof D.seats_before=="number"?D.seats_before:null;U!==null&&(u=_-U)}}}const o=await Wt(I,t.id);let g="Opposition";o&&o.party_ids&&o.party_ids.includes(i.id)&&(g=o.lead_party_id===i.id?"Lead — Governing":"Governing Coalition");const{data:E}=await I.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",t.id),{data:w}=await I.from("issue_state").select("issue_id, salience").eq("nation_id",t.id),L={};for(const N of w||[])L[N.issue_id]=N;let{data:m}=await I.from("elections").select("election_tick, election_type").eq("nation_id",t.id).eq("status","scheduled").gt("election_tick",l).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(!m){const N=Number(t.parliamentary_term_ticks)||24;m={election_tick:l+N,election_type:"parliamentary"}}const h=va(i.id,t.name),S={whipFirst:i.whip_first_name||h.whipFirst,whipLast:i.whip_last_name||h.whipLast},{data:k}=await I.from("nations_history").select("gov_approval").eq("nation_id",t.id).eq("tick",l-1).maybeSingle(),y=k?.gov_approval??null,{data:f}=await I.from("presidents").select("id, faction_id, first_name, last_name, age, ideology, trait, trait_upside, trait_downside, elected_tick, term_ends_tick, is_active, terms_served").eq("nation_id",t.id).eq("is_active",!0).order("elected_tick",{ascending:!1}).limit(1).maybeSingle(),{data:C}=await I.from("administrations").select("id, admin_name, government_type, started_at_tick, president_name, president_party_id, president_party_name, stats_at_start").eq("nation_id",t.id).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),{data:A}=await I.from("elections").select("election_tick, results, election_type").eq("nation_id",t.id).eq("status","completed").eq("election_type","parliamentary").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:O}=await I.from("elections").select("election_tick, results, election_type").eq("nation_id",t.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),{data:R}=await I.from("elections").select("election_tick, election_type").eq("nation_id",t.id).eq("status","scheduled").gt("election_tick",l).order("election_tick",{ascending:!0}),{data:T}=await I.from("caucus_factions").select("id, name, dominant_axis, wing_end, seat_share, relationship_score").eq("party_id",i.id).eq("is_active",!0),{data:P}=await I.from("party_endorsement_preferences").select("endorsed_party_id").eq("endorsing_party_id",i.id).maybeSingle();ma(i,t,{shard:d,totalSeats:p,mySeats:_,voteSharePct:x,lastElectionDate:b,seatDelta:u,role:g,coalition:o,currentTick:l,officerNames:S,allParties:a,allPartyIdeologies:n,activeCrises:E,nextElection:m,prevApproval:y,lastParliamentary:A,lastPresidential:O,scheduledElections:R,president:f,administration:C,caucusFactions:T,currentEndorsement:P,issueStateMapInit:L})});function pa(e){const t=e.replace(/-/g,""),d=20+parseInt(t.substring(16,24),16)%51;return Math.max(0,d-10)}function va(e,t=""){const{firstNames:s,lastNames:d}=Ts(t),i=e.replace(/-/g,""),l=parseInt(i.substring(8,12),16),a=parseInt(i.substring(12,16),16);return{whipFirst:s[l%s.length],whipLast:d[a%d.length]}}async function ma(e,t,s){const{shard:d,totalSeats:i,mySeats:l,voteSharePct:a,lastElectionDate:v,seatDelta:n,role:c,officerNames:p,allParties:_,allPartyIdeologies:r,coalition:x,activeCrises:b,currentTick:u,nextElection:o,prevApproval:g,lastParliamentary:E,lastPresidential:w,scheduledElections:L,president:m,administration:h,caucusFactions:S,currentEndorsement:k,issueStateMapInit:y}=s,f=e,C=e.party_color||"#ffcc00",A=zt({customLogoUrl:e.custom_logo_url,iconKey:e.party_logo,size:36,color:C}),O=Se(e.founded_tick),R=c.includes("Governing")||c.includes("Lead"),T=c.includes("Lead")?"Governing":c,P=c==="Strongman"?"pol-role-strongman":R?"pol-role-gov":"pol-role-opp",N=(r||[]).find(G=>G.faction_id===e.id);let q=null,M=null;if(N){const G=ie.map(ae=>({ax:ae,score:N[ae.key]??0})).sort((ae,fe)=>Math.abs(fe.score)-Math.abs(ae.score));G.length>0&&G[0].score!==0&&(q=G[0].score<0?G[0].ax.left:G[0].ax.right),G.length>1&&G[1].score!==0&&(M=G[1].score<0?G[1].ax.left:G[1].ax.right)}q||(q=e.ideology_value_1||null),M||(M=e.ideology_value_2||null);function D(G){if(!G)return"";const ae="pol-ideo-"+G.toLowerCase(),fe=G.charAt(0).toUpperCase()+G.slice(1).toLowerCase();return`<div class="pol-ideo-box">
            <span class="pol-ideo-label">Ideology</span>
            <span class="pol-ideo-value ${ae}">${fe}</span>
        </div>`}let U,z;U=e.leader_first_name&&e.leader_last_name?e.leader_first_name+" "+e.leader_last_name:"Vacant",z=e.leader_age?`(${e.leader_age})`:"";const H=e.leader_ideology||q,X=H?`<span class="pol-leader-ideo pol-ideo-${H.toLowerCase()}">${H.charAt(0).toUpperCase()+H.slice(1).toLowerCase()}</span>`:"",re=e.electability??pa(e.id),de=Ns(re);let ce="";if(n!==null&&n!==0){const G=n>0?"+":"";ce=`<span class="pol-stat-delta ${n>0?"up":"down"}">${G}${n}</span>`}const vt=`
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
        ${ka(t,x,_,u,g,m,h)}
        <div class="pol-party-card">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--green"></div>
            <span class="pol-box-label">Your Party</span>
        </div>
        <div class="pol-box-body">
        <div class="pol-header">
            <div class="pol-logo">${A}</div>
            <div class="pol-header-info">
                <div class="pol-party-name">${$(e.faction_name)} <span style="color:var(--dtext-3);font-size:11px;font-weight:400;font-style:italic;margin-left:4px;">${Is(t)}</span></div>
                <div class="pol-meta-row">
                    <span class="pol-role-badge ${P}">${$(T.toUpperCase())}</span>
                    <span class="pol-established">Est. ${O}</span>
                    <span class="pol-leader-badge">Leader: ${$(U)} ${z}</span>
                </div>
            </div>
        </div>
        <div class="pol-ideo-row">
            ${D(q)}
            ${D(M)}
        </div>
        <hr class="pol-divider">
        <div class="pol-leader-section">
            <div class="pol-leader-header">
                <span class="pol-sub-label">Leader</span>
                <button class="pol-leadership-btn" onclick="window.location.href='party-leadership.html'">Party Leadership &rarr;</button>
            </div>
            <div class="pol-leader-name">${$(U)} <span class="pol-leader-age">${z}</span> <span class="pol-leader-electability"><span class="pol-leader-electability-label">Electability: </span><span style="color:${de.color}">${de.label}</span></span></div>
            ${X}
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
                <div class="pol-stat-value">${l}<span class="pol-stat-total">/${i}</span>${ce}</div>
            </div>
        </div>
        ${ha(S,l)}
        </div>
        </div>
        ${xa(_,x,t,e.id)}
        ${$a(_,i,u,o,null,e.id)}
        </div>

        <div class="pol-row-2">
        ${wa(t,b,u,y)}
        <div class="pol-ideology-box" id="stance-summary-container">
            <div class="pol-ideo-header"><div class="pol-box-dot pol-box-dot--orange"></div><span class="pol-mod-title">Stances</span></div>
            <div class="pol-box-body"><div id="stance-summary-strip"></div></div>
        </div>
        ${Sa(e,u)}
        </div>

        <div class="pol-row-3">
        ${Ca(E,w,_,{scheduledElections:L,currentTick:u,nation:t,mySeats:l,faction:f,currentEndorsement:k})}

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
    </div>`;document.getElementById("content-area").innerHTML=vt;let j=!1,F=!1,$e=!1,Me=!1;document.querySelectorAll(".pol-page-tab").forEach(G=>{G.addEventListener("click",()=>{document.querySelectorAll(".pol-page-tab").forEach(qe=>qe.classList.remove("active")),document.querySelectorAll(".pol-page-content").forEach(qe=>qe.classList.remove("active")),G.classList.add("active");const ae=G.getAttribute("data-page-tab"),fe=document.querySelector(`.pol-page-content[data-page-content="${ae}"]`);fe&&fe.classList.add("active"),ae==="actions"&&!j&&(j=!0,dt(t,e,d,_)),ae==="electorate-spread"&&!$e&&($e=!0,to(e,t,_,r,u)),ae==="other-parties"&&!F&&(F=!0,ao(e,t,_,r,x,i,u)),ae==="elections"&&!Me&&(Me=!0,io(t,h,x,e,_,r,u,c,o,S,l))})}),window.innerWidth>860&&document.querySelectorAll(".pol-admin-box, .pol-party-card, .pol-parliament-box, .pol-forecast-box, .pol-coalition-box, .pol-mood-box, .pol-ideology-box, .pol-identity-box, .pol-election-box, .pol-blocs-box").forEach(G=>{G.style.height="450px"}),Ea(e),Aa(),La(),Lt(e.id,t.id),ga(t.id,e.id);const pe=document.getElementById("pol-disband-party-btn");pe&&pe.addEventListener("click",async()=>{if(confirm("Are you sure you want to disband your party? This is permanent — your party will be removed from the game after the next tick.")&&confirm("This cannot be undone. Disband your party?")){pe.disabled=!0,pe.textContent="Disbanding...";try{await Ms(I,t.id,e.id,u),sessionStorage.removeItem("nationhood_state"),await I.auth.signOut(),window.location.href="login.html"}catch(G){ee(G.message||"Failed to disband party."),pe.disabled=!1,pe.textContent="Disband Party"}}})}const fa=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function os(e){return`${fa[e%12]} ${2e3+Math.floor(e/12)}`}async function ua(e,t){const s=document.getElementById("party-events-feed");if(!s)return;const{data:d,error:i}=await I.from("activity_log").select("id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at").eq("nation_id",e).order("tick",{ascending:!1}).order("created_at",{ascending:!1}).limit(80);if(i||!d||d.length===0){s.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:12px;padding:12px">No party events yet.</div>';return}const l=[...new Set(d.map(p=>p.faction_id))],{data:a}=await I.from("factions").select("id, faction_name, abbreviation, party_color").in("id",l),v={};for(const p of a||[])v[p.id]=p;let n="",c=null;for(const p of d){p.tick!==c&&(c=p.tick,n+=`<div class="pe-tick-sep">${os(p.tick)}</div>`);const _=v[p.faction_id],r=p.faction_id===t,x=r?"You":_?.abbreviation||"???",b=_?.party_color||"var(--dtext-2)",u=p.outcome==="success"?"var(--dgreen)":p.outcome==="backfire"?"var(--dred)":p.outcome==="failure"?"var(--damber)":"var(--dtext-3)";n+=`<div class="pe-item${r?" pe-item--you":""}">
            <div class="pe-item-row">
                <span class="pe-item-party" style="color:${b}">${$(x)}</span>
                <span class="pe-item-label">${$((p.action_label||p.action_type).replace(/_/g," "))}</span>
                ${p.ap_spent?`<span class="pe-item-ap">${p.ap_spent} AP</span>`:""}
                ${p.outcome?`<span class="pe-item-outcome" style="color:${u}">${$(p.outcome)}</span>`:""}
            </div>
            ${p.description?`<div class="pe-item-desc">${$(p.description)}</div>`:""}
        </div>`}s.innerHTML=n}async function ga(e,t){const s=document.getElementById("gov-card-party-events");if(!s)return;const{data:d,error:i}=await I.from("activity_log").select("id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at").eq("nation_id",e).order("tick",{ascending:!1}).order("created_at",{ascending:!1}).limit(40);if(i||!d||d.length===0){s.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">No party events yet.</div>';return}const l=[...new Set(d.map(p=>p.faction_id))],{data:a}=await I.from("factions").select("id, faction_name, abbreviation, party_color").in("id",l),v={};for(const p of a||[])v[p.id]=p;let n="",c=null;for(const p of d){p.tick!==c&&(c=p.tick,n+=`<div class="pe-tick-sep">${os(p.tick)}</div>`);const _=v[p.faction_id],r=p.faction_id===t,x=r?"You":_?.abbreviation||"???",b=_?.party_color||"var(--dtext-2)",u=p.outcome==="success"?"var(--dgreen)":p.outcome==="backfire"?"var(--dred)":p.outcome==="failure"?"var(--damber)":"var(--dtext-3)";n+=`<div class="pe-item${r?" pe-item--you":""}">
            <div class="pe-item-row">
                <span class="pe-item-party" style="color:${b}">${$(x)}</span>
                <span class="pe-item-label">${$((p.action_label||p.action_type).replace(/_/g," "))}</span>
                ${p.outcome?`<span class="pe-item-outcome" style="color:${u}">${$(p.outcome)}</span>`:""}
            </div>
        </div>`}s.innerHTML=n}function ya(e,t,s){const d=e||"#888",i=t||(s?s.substring(0,2).toUpperCase():"??");return`<div class="pol-mini-logo" style="background:${d}">${$(i)}</div>`}function ba(e,t){if(t?.head_of_state_title&&!Kt(t))return t.head_of_state_title;if(!e)return"Head of Gov.";const s=e.toLowerCase();return s==="democracy"||s.includes("parliament")?"PM":s.includes("president")?"President":"Head of Gov."}function ha(e,t){if(!e||e.length===0)return"";const s={liberty_equality:"Liberty / Equality",tradition_progress:"Tradition / Progress",security_freedom:"Security / Freedom",globalism_nationalism:"Globalism / Nationalism",individualism_collectivism:"Individualism / Collectivism"};let d="";for(const i of e){const l=Math.round(t*i.seat_share),a=`~${Math.max(1,l-2)}–${l+2}`,v=i.relationship_score,n=v>=60?"var(--green)":v>=30?"var(--amber)":"var(--red)",c=v<30?' <span style="color:var(--red);font-size:0.7rem;">VOLATILE</span>':"";d+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-dim);">
            <div>
                <div style="font-size:0.85rem;font-weight:500;">${$(i.name)}</div>
                <div style="font-size:0.75rem;color:var(--text-dim);">${s[i.dominant_axis]||i.dominant_axis} · ${a} seats</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:60px;height:6px;background:var(--border-dim);border-radius:3px;overflow:hidden;">
                    <div style="width:${v}%;height:100%;background:${n};border-radius:3px;"></div>
                </div>
                ${c}
            </div>
        </div>`}return`<hr class="pol-divider">
        <div style="padding:0 0 4px;">
            <div class="pol-sub-label" style="margin-bottom:6px;">Internal Caucuses</div>
            ${d}
        </div>`}function xa(e,t,s,d){const i=e||[],l=i.reduce((y,f)=>y+(f.seats||0),0),a=Math.ceil(l/2);let v,n;v=new Set(t?.party_ids||[]),n=t?.lead_party_id||null;const c=i.filter(y=>v.has(y.id)),p=i.filter(y=>!v.has(y.id)),_=c.reduce((y,f)=>y+(f.seats||0),0),r=p.reduce((y,f)=>y+(f.seats||0),0),x=[...i].sort((y,f)=>(f.seats||0)-(y.seats||0)),b=l>0?x.map(y=>{const f=(y.seats||0)/l*100;if(f<=0)return"";const C=y.party_color||"#888";return`<div class="pol-seat-segment" style="width:${f.toFixed(2)}%;background:${C}"></div>`}).join(""):"",o=`<div class="pol-majority-line" style="left:${(l>0?a/l*100:50).toFixed(2)}%"></div>`,g=ba(s?.government_type,s);function E(y){const f=ya(y.party_color,y.abbreviation,y.faction_name),C=$(y.faction_name||"Unknown"),A=y.seats||0,O=y.id===d,T=[y.id===n?`<span class="pol-hog-pill">${$(g)}</span>`:"",O?'<span class="pol-you-pill">YOU</span>':""].filter(Boolean).join(" ");return`<div class="pol-parl-party-row">
            ${f}
            <span class="pol-parl-party-name">${C}</span>
            ${T}
            <span class="pol-parl-party-seats">${A}</span>
        </div>`}const w=c.length>0?c.sort((y,f)=>(f.seats||0)-(y.seats||0)).map(E).join(""):"",L=p.length>0?p.sort((y,f)=>(f.seats||0)-(y.seats||0)).map(E).join(""):"",m=_-a,h=m>=0,S=h?"pol-margin-positive":"pol-margin-negative",k=h?`+${m} above majority`:`${Math.abs(m)} below majority`;return`
        <div class="pol-parliament-box">
            <div class="pol-parl-header">
                <div class="pol-box-dot pol-box-dot--amber"></div>
                <span class="pol-parl-title">Parliament</span>
                <div class="pol-box-header-right"><span class="pol-parl-seats-count">${l} seats</span></div>
            </div>
            <div class="pol-box-body">
            <div class="pol-seat-bar-wrap">
                <div class="pol-seat-bar">${b}</div>
                ${o}
            </div>

            <div class="pol-section-header">
                <span class="pol-section-title">Governing Coalition</span>
                <span class="pol-section-seats">${_} seats</span>
            </div>
            ${w}

            <div class="pol-section-header">
                <span class="pol-section-title">Opposition</span>
                <span class="pol-section-seats">${r} seats</span>
            </div>
            ${L}

            <div class="pol-margin-row ${S}">
                <span class="pol-margin-dot"></span>
                <span>${k}</span>
            </div>
            </div>
        </div>`}function _a(e){return e>=60?"var(--dred)":e>=40?"var(--damber)":"var(--dgreen)"}function $a(e,t,s,d,i,l){const c=d?.election_tick||0,p=c>s?c-s:0,_=c>0&&p<=12,r=Math.ceil(t/2),x=p<=5?"CAMPAIGN SEASON":p<=10?"MID CYCLE":"EARLY CYCLE",b=p<=5?"var(--dred)":p<=10?"var(--damber)":"var(--dgreen)";if(!_){const f=c>0?p-12:0,C=c>0?`Forecast available in <span style="color:var(--dtxt-secondary);font-weight:700">${f} ticks</span><br>Polling begins 12 ticks before election`:"No election currently scheduled",A=c>0?Se(c):null;return`
            <div class="pol-forecast-box">
                <div class="pol-fc-header">
                    <div class="pol-box-dot pol-box-dot--blue"></div>
                    <span class="pol-mod-title">Election Forecast</span>
                </div>
                <div class="pol-box-body">
                ${A?`<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${A}</span></div>`:""}
                <div class="pol-fc-empty">
                    <div class="pol-fc-empty-title">Insufficient polling data</div>
                    <div class="pol-fc-empty-detail">${C}</div>
                </div>
                </div>
            </div>`}const u=Math.max(1,12-(12-p)),g=(e||[]).filter(f=>Number(f.national_vote_share||0)<=0?!1:f.last_seen_tick!=null?s-f.last_seen_tick<12:s-(f.founded_tick||0)<12).map(f=>{const C=Number(f.national_vote_share||0),A=Math.round(C/100*t);return{...f,estSeats:A,momentum:Number(f.momentum??0)}}).sort((f,C)=>C.estSeats-f.estSeats),E=u>=10?"VERY LOW":u>=7?"LOW":u>=5?"MODERATE":u>=3?"HIGH":"VERY HIGH",w=u>=10?"var(--dred)":u>=7||u>=5?"var(--damber)":u>=3?"#22d3ee":"var(--dgreen)",L=(12-p)/12*100,m=g.map(f=>{const C=Math.max(f.estSeats-u,0),A=Math.min(f.estSeats+u,t),O=C/t*100,R=A/t*100,T=f.party_color||"#888",P=f.abbreviation||(f.faction_name||"??").substring(0,2).toUpperCase(),N=f.id===l,q=f.momentum>0?"var(--dgreen)":f.momentum<0?"var(--dred)":"var(--dtxt-muted)",M=f.momentum>0?"▲":f.momentum<0?"▼":"—",D=f.momentum!==0?`${M}${Math.abs(f.momentum)}`:M,U=t>0?r/t*100:50;return`<div class="pol-fc-party">
            <div class="pol-fc-party-header">
                <div class="pol-fc-party-left">
                    <div class="pol-fc-party-dot" style="background:${T}"></div>
                    <span class="pol-fc-party-abbr" style="color:${T}">${$(P)}</span>
                    ${N?'<span class="pol-ideo-legend-you">YOU</span>':""}
                </div>
                <div class="pol-fc-party-right">
                    <span class="pol-fc-momentum" style="color:${q}">${D}</span>
                    <span class="pol-fc-range">${C}–${A}</span>
                    <span class="pol-fc-seats-label">seats</span>
                </div>
            </div>
            <div class="pol-fc-band">
                <div class="pol-fc-band-fill" style="left:${O.toFixed(1)}%;width:${(R-O).toFixed(1)}%;background:${T}22;border-color:${T}33"></div>
                <div class="pol-fc-maj-line" style="left:${U.toFixed(1)}%"></div>
            </div>
        </div>`}).join(""),h=g.find(f=>f.id===l),S=g.find(f=>f.id!==l);let k="";if(h&&S){const f=Math.max(h.estSeats-u,0),C=Math.min(h.estSeats+u,t),A=Math.max(S.estSeats-u,0),O=Math.min(S.estSeats+u,t),R=Math.max(0,Math.min(C,O)-Math.max(f,A)),T=C-f,P=T>0?Math.round(R/T*100):0,N=h.abbreviation||"YOU",q=S.abbreviation||"RIVAL",M=P>70?"TOO CLOSE TO CALL":P>30?"COMPETITIVE":P>0?h.estSeats>S.estSeats?`LEANING ${N}`:`LEANING ${q}`:h.estSeats>S.estSeats?`${N} LEADS`:`${q} LEADS`,D=P>70?"var(--dred)":P>30?"var(--damber)":"var(--dgreen)",U=P>70?`${N} and ${q} seat ranges fully overlap. Outcome is uncertain.`:P>30?"Bands are narrowing. Late campaigns could decide the race.":P>0?"Leading party is emerging, but the gap is not yet decisive.":"Ranges no longer overlap. Leader is identifiable.";k=`
            <div class="pol-fc-status" style="background:${D}08;border-color:${D}">
                <div class="pol-fc-status-header">
                    <span class="pol-fc-status-label" style="color:${D}">${$(M)}</span>
                    <span class="pol-fc-status-overlap">${P}% overlap</span>
                </div>
                <div class="pol-fc-status-desc">${U}</div>
            </div>`}const y=c>0?Se(c):null;return`
        <div class="pol-forecast-box">
            <div class="pol-fc-header">
                <div class="pol-box-dot pol-box-dot--blue"></div>
                <span class="pol-mod-title">Election Forecast</span>
                <div class="pol-box-header-right"><span class="pol-fc-phase" style="color:${b};background:${b}15">${x}</span></div>
            </div>
            <div class="pol-box-body">
            ${y?`<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${y}</span></div>`:""}
            <div class="pol-fc-countdown">
                <div>
                    <span class="pol-fc-ticks-big" style="color:${b}">${p}</span>
                    <span class="pol-fc-ticks-label">ticks</span>
                </div>
                <div style="text-align:right">
                    <div style="display:flex;align-items:center;gap:4px;justify-content:flex-end">
                        <span class="pol-fc-margin-label">Margin:</span>
                        <span class="pol-fc-margin-val" style="color:${w}">±${u} seats</span>
                    </div>
                    <span class="pol-fc-conf-badge" style="color:${w};background:${w}15">${E} CONFIDENCE</span>
                </div>
            </div>
            <div class="pol-fc-conf-bar">
                <div class="pol-fc-conf-fill" style="width:${L.toFixed(0)}%;background:${w}"></div>
            </div>
            ${m}
            <div class="pol-fc-maj-legend">
                <div class="pol-fc-maj-dash"></div>
                <span class="pol-fc-maj-text">Majority: ${r} seats</span>
            </div>
            ${k}
            </div>
        </div>`}function wa(e,t,s,d){const i=t||[];let l;i.length===0?l='<div class="pol-mood-no-crises">No active crises</div>':l=i.map(n=>{const c=n.crisis_templates?.name||"Unknown Crisis",p=s-(n.started_at_tick||0);return`<div class="pol-mood-crisis">
                <span class="pol-mood-crisis-name">${$(c)}</span>
                <span class="pol-mood-crisis-dur">${p}t</span>
            </div>`}).join("");const v=Jt.map(n=>{const c=xe[n],p=Number(d?.[n]?.salience??30);return{id:n,name:c.label,salience:p,statKeys:c.stats}}).sort((n,c)=>c.salience-n.salience).map(n=>{const c=_a(n.salience),p=n.statKeys.map(_=>{const r=Math.round(Number(e[_]??0)),x=_.replace(/_/g," ").replace(/\b\w/g,b=>b.toUpperCase());return`<div class="pol-mood-stat-row">
                <span class="pol-mood-stat-name">${$(x)}</span>
                <span class="pol-mood-stat-val">${r}</span>
            </div>`}).join("");return`<div class="pol-mood-issue-wrap">
            <div class="pol-mood-issue" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.pol-mood-chevron').textContent=this.nextElementSibling.classList.contains('open')?'▾':'▸'">
                <span class="pol-mood-issue-name">${$(n.name)}</span>
                <div class="pol-mood-issue-bar-wrap">
                    <div class="pol-mood-issue-bar" style="width:${n.salience}%;background:${c}"></div>
                </div>
                <span class="pol-mood-issue-pct">${n.salience}%</span>
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
            ${v}
            </div>
        </div>`}function ka(e,t,s,d,i,l,a){const v=Ps(e),n=s||[],c=Math.round(Number(e.gov_approval??40)),p=c>=50?"var(--dgreen)":c>=35?"var(--damber)":"var(--dred)",_=a?.admin_name||"Government",r=v?"Presidential":e?.hos_election_method==="hereditary"?"Constitutional Monarchy":"Parliamentary",x=new Set(t?.party_ids||[]),b=n.filter(A=>x.has(A.id)),u=b.reduce((A,O)=>A+(O.seats||0),0),o=n.reduce((A,O)=>A+(O.seats||0),0),g=Math.ceil(o/2),E=u>=g,w=b.length>1?"Coalition":b.length===1?"Single Party":"";function L(A,O){return((A||"?")[0]+(O||"?")[0]).toUpperCase()}let m="";if(v&&l){const A=n.find(N=>N.id===l.faction_id),O=A?.party_color||"#888",R=A?.abbreviation||(A?.faction_name||"??").substring(0,3).toUpperCase(),T=l.terms_served>1?l.terms_served===2?"2nd":l.terms_served+"th":"1st",P=L(l.first_name,l.last_name);m=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${$(P)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${$(l.first_name+" "+l.last_name)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">President &middot; Age ${l.age||"?"} &middot; ${T} Term</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${O}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${O}">${$(R)}</span>
            </div>
          </div>
        </div>`}else if(!v&&t){const A=n.find(N=>N.id===t.lead_party_id),O=A?.party_color||"#888",R=A?.faction_name||"Unknown",T=A?.abbreviation||R.substring(0,3).toUpperCase(),P=R.split(/\s+/).map(N=>N[0]).join("").toUpperCase().slice(0,2);m=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${$(P)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${$(R)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of Government</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${O}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${O}">${$(T)}</span>
            </div>
          </div>
        </div>`}let h="";const S=e.head_of_state_first_name||"",k=e.head_of_state_last_name||"";if(v&&S&&k){const A=L(S,k);h=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${$(A)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${$(S+" "+k)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Vice President</div>
          </div>
        </div>`}else if(!v&&S&&k){const A=L(S,k);h=`
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${$(A)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${$(S+" "+k)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of State</div>
          </div>
        </div>`}const y=[...b].sort((A,O)=>(O.seats||0)-(A.seats||0));o>0&&y.map(A=>{const O=(A.seats||0)/o*100;return O<=0?"":`<div style="width:${O.toFixed(2)}%;height:100%;background:${A.party_color||"#888"}"></div>`}).join(""),y.map(A=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
            <div style="width:7px;height:7px;border-radius:2px;background:${A.party_color||"#888"};flex-shrink:0"></div>
            <span style="font-family:var(--dfont-ui);font-size:12px;color:var(--dtext-0);flex:1">${$(A.faction_name||"Unknown")}</span>
            <span style="font-family:var(--dfont-mono);font-size:12px;font-weight:600;color:${A.party_color||"var(--dtext-0)"}">${A.seats||0}</span>
        </div>`).join("");const f=E?"Majority Government":"Minority Government",C=`${u}/${o} seats (${g} needed)`;return`<div class="pol-admin-box">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Government</span>
        </div>
        <div class="pol-box-body">
        <div style="font-family:var(--dfont-ui);font-size:16px;font-weight:700;color:var(--dtext-0);margin-bottom:8px">${$(_)}</div>
        <div style="display:flex;gap:6px;margin-bottom:16px">
            <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${$(r)}</span>
            ${w?`<span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${$(w)}</span>`:""}
        </div>

        ${m}
        ${h}

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Approval</div>
        <div style="font-family:var(--dfont-mono);font-size:28px;font-weight:700;line-height:1;color:${p}">${c}%</div>
        <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:4px;display:flex;align-items:center;gap:8px">
            <span style="text-transform:uppercase;font-weight:600">${$(f)}</span>
            <span style="font-weight:400">${$(C)}</span>
        </div>

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Party Events</div>
        <div id="gov-card-party-events" class="pe-feed" style="max-height:200px;overflow-y:auto;font-size:11px">
            <div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">Loading events...</div>
        </div>
        </div>
    </div>`}const we=360,ot=200,Qe=256;function Sa(e,t){const s=e.party_color||"#ffcc00",d=e.party_logo||"flag",i=e.party_description||"",l=e.action_points||0,a=e.last_rename_tick||0,v=a>0?Math.max(0,we-(t-a)):0,n=v>0,c=!!e.custom_logo_url,p=zt({customLogoUrl:e.custom_logo_url,iconKey:d,size:20,color:s}),_=Ss.map(o=>`<div class="pol-id-swatch${o.hex.toLowerCase()===s.toLowerCase()?" selected":""}" data-color="${o.hex}" title="${o.label}" style="background:${o.hex}"></div>`).join(""),r={};for(const[o,g]of Object.entries(Es)){const E=g.category||"Other";r[E]||(r[E]=[]),r[E].push({key:o,label:g.label})}let x="";for(const[o,g]of Object.entries(r)){x+=`<div class="pol-id-icon-cat">${$(o)}</div><div class="pol-id-icon-grid">`;for(const E of g){const w=E.key===d?" selected":"",L=Nt(E.key,16,E.key===d?s:"#888");x+=`<div class="pol-id-icon-tile${w}" data-icon="${E.key}" title="${$(E.label)}" style="color:${E.key===d?s:"#888"}">${L}</div>`}x+="</div>"}let b,u;if(n){const g=`
            <div class="pol-id-cooldown">
                <span class="pol-id-cooldown-label">Rename cooldown</span>
                <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:${(v/we*100).toFixed(1)}%"></div></div>
                <span class="pol-id-cooldown-ticks">${v}t</span>
            </div>`;b=g,u=g}else b=`
            <button class="pol-id-rename-btn" id="pol-id-rename-btn">
                <span>Rename Party</span>
                <span class="pol-id-rename-cost">${we}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-rename-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-rename-input" placeholder="Enter new party name…" maxlength="60">
                    <button class="pol-id-rename-confirm" id="pol-id-rename-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-rename-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${we} ticks</span></span>
                </div>
                <div class="pol-id-error" id="pol-id-rename-error" style="display:none"></div>
            </div>`,u=`
            <button class="pol-id-rename-btn" id="pol-id-abbr-btn">
                <span>Change Abbreviation</span>
                <span class="pol-id-rename-cost">${we}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-abbr-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-abbr-input" placeholder="2–4 letters" maxlength="4" style="text-transform:uppercase;font-family:var(--dfont-mono);font-weight:700;letter-spacing:0.1em;width:80px">
                    <button class="pol-id-rename-confirm" id="pol-id-abbr-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-abbr-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${we} ticks</span></span>
                </div>
                <div class="pol-id-error" id="pol-id-abbr-error" style="display:none"></div>
            </div>`;return`<div class="pol-identity-box" id="pol-identity-box"
        data-faction-id="${e.id}"
        data-selected-color="${s}"
        data-selected-icon="${d}"
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
            ${b}
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
                <span class="pol-id-char-count${i.length>ot*.9?" warn":""}" id="pol-id-char-count">${i.length} / ${ot}</span>
            </div>
            <textarea class="pol-id-desc" id="pol-id-desc" rows="3" maxlength="${ot}">${$(i)}</textarea>
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
            <div id="pol-id-icon-section"${c?' style="display:none"':""}>${x}</div>
            <div id="pol-id-upload-section"${c?"":' style="display:none"'}>
                <div class="pol-id-upload-zone${c?" has-image":""}" id="pol-id-upload-zone">
                    ${c?`
                        <img class="pol-id-upload-preview" src="${e.custom_logo_url}" alt="preview" style="border:2px solid ${s}">
                        <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Qe}KB · Best at 128×128px</div>
                    `:`
                        <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                        <div class="pol-id-upload-text">Click to upload logo</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Qe}KB · Best at 128×128px</div>
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
    </div>`}function Ea(e){const t=document.getElementById("pol-identity-box");if(!t)return;const s=document.getElementById("pol-id-preview"),d=document.getElementById("pol-id-colors"),i=document.getElementById("pol-id-hex-input"),l=document.getElementById("pol-id-hex-preview"),a=document.getElementById("pol-id-desc"),v=document.getElementById("pol-id-char-count"),n=document.getElementById("pol-id-save-btn"),c=document.getElementById("pol-id-rename-btn"),p=document.getElementById("pol-id-rename-form"),_=document.getElementById("pol-id-rename-input"),r=document.getElementById("pol-id-rename-confirm"),x=document.getElementById("pol-id-rename-cancel"),b=document.getElementById("pol-id-rename-error"),u=document.getElementById("pol-id-abbr-btn"),o=document.getElementById("pol-id-abbr-form"),g=document.getElementById("pol-id-abbr-input"),E=document.getElementById("pol-id-abbr-confirm"),w=document.getElementById("pol-id-abbr-cancel"),L=document.getElementById("pol-id-abbr-error"),m=document.getElementById("pol-id-current-abbr"),h=document.getElementById("pol-id-current-name");document.getElementById("pol-id-ap-display");const S=document.getElementById("pol-id-icon-section"),k=document.getElementById("pol-id-upload-section"),y=document.getElementById("pol-id-upload-zone"),f=document.getElementById("pol-id-file-input"),C=document.getElementById("pol-id-upload-error"),A=document.getElementById("pol-id-remove-btn");let O=null,R=null,T=!!e.custom_logo_url,P=e.custom_logo_url||null;function N(){return t.dataset.selectedColor}function q(){return t.dataset.selectedIcon}function M(){const z=N();if(s.style.border="2px solid "+z,s.style.background=z+"18",T&&(O||P)){const H=O||P;s.innerHTML='<img src="'+H+'" alt="" style="width:100%;height:100%;object-fit:cover">'}else s.innerHTML=Nt(q(),20,z)}function D(){const z=N(),H=q();t.querySelectorAll(".pol-id-icon-tile").forEach(X=>{const re=X.dataset.icon,de=re===H;X.classList.toggle("selected",de),X.style.color=de?z:"#888",X.innerHTML=Nt(re,16,de?z:"#888")})}function U(){const z=N().toLowerCase();t.querySelectorAll(".pol-id-swatch").forEach(H=>{H.classList.toggle("selected",H.dataset.color.toLowerCase()===z)})}d&&d.addEventListener("click",z=>{const H=z.target.closest(".pol-id-swatch");H&&(t.dataset.selectedColor=H.dataset.color,i.value=H.dataset.color,l.style.background=H.dataset.color,U(),D(),M())}),i&&i.addEventListener("input",()=>{const z=i.value;/^#[0-9a-fA-F]{6}$/.test(z)?(t.dataset.selectedColor=z,l.style.background=z,U(),D(),M()):l.style.background="var(--dtext-3)"}),S&&S.addEventListener("click",z=>{const H=z.target.closest(".pol-id-icon-tile");H&&(t.dataset.selectedIcon=H.dataset.icon,T=!1,D(),M())}),t.querySelectorAll(".pol-id-tab").forEach(z=>{z.addEventListener("click",()=>{t.querySelectorAll(".pol-id-tab").forEach(X=>X.classList.remove("active")),z.classList.add("active");const H=z.dataset.tab==="icon";S.style.display=H?"":"none",k.style.display=H?"none":""})}),y&&y.addEventListener("click",()=>f.click()),f&&f.addEventListener("change",z=>{const H=z.target.files[0];if(!H)return;if(C.style.display="none",H.size>Qe*1024){C.textContent="⚠ File too large — max "+Qe+"KB.",C.style.display="";return}if(!H.type.startsWith("image/")){C.textContent="⚠ Must be PNG, JPG, SVG, or WebP.",C.style.display="";return}const X=new FileReader;X.onload=re=>{O=re.target.result,R=H,T=!0,y.classList.add("has-image"),y.innerHTML=`
                    <img class="pol-id-upload-preview" src="${O}" alt="preview" style="border:2px solid ${N()}">
                    <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                    <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Qe}KB · Best at 128×128px</div>`,A.style.display="",M()},X.readAsDataURL(H)}),A&&A.addEventListener("click",()=>{O=null,R=null,T=!1,P=null,y.classList.remove("has-image"),y.innerHTML=`
                <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                <div class="pol-id-upload-text">Click to upload logo</div>
                <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${Qe}KB · Best at 128×128px</div>`,A.style.display="none",M()}),a&&v&&a.addEventListener("input",()=>{const z=a.value.length;v.textContent=z+" / "+ot,v.classList.toggle("warn",z>ot*.9)}),u&&o&&u.addEventListener("click",()=>{u.style.display="none",o.style.display="",g.focus()}),w&&w.addEventListener("click",()=>{o.style.display="none",u.style.display="",g.value="",L.style.display="none",g.classList.remove("has-error")}),g&&g.addEventListener("input",()=>{g.value=g.value.toUpperCase()}),E&&E.addEventListener("click",async()=>{if(E.disabled)return;L.style.display="none",g.classList.remove("has-error");const z=g.value.trim().toUpperCase();if(z.length<2||z.length>4){L.textContent="⚠ Must be 2–4 letters.",L.style.display="",g.classList.add("has-error");return}E.disabled=!0;const H=parseInt(t.dataset.currentTick)||0,{error:X}=await I.from("factions").update({abbreviation:z,last_rename_tick:H}).eq("id",e.id);if(X){L.textContent="⚠ Failed to save — try again.",L.style.display="",E.disabled=!1;return}m.textContent=z,o.style.display="none",g.value="",u.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${we}t</span>
                </div>`,c&&(p.style.display="none",c.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${we}t</span>
                    </div>`)}),c&&p&&c.addEventListener("click",()=>{c.style.display="none",p.style.display="",_.focus()}),x&&x.addEventListener("click",()=>{p.style.display="none",c.style.display="",_.value="",b.style.display="none",_.classList.remove("has-error")}),r&&r.addEventListener("click",async()=>{b.style.display="none",_.classList.remove("has-error");const z=_.value.trim();if(!z){b.textContent="⚠ Name cannot be empty.",b.style.display="",_.classList.add("has-error");return}if(z.length<3){b.textContent="⚠ Minimum 3 characters.",b.style.display="",_.classList.add("has-error");return}const H=parseInt(t.dataset.currentTick)||0,{error:X}=await I.from("factions").update({faction_name:z,last_rename_tick:H}).eq("id",e.id);if(X){b.textContent="⚠ Failed to save — try again.",b.style.display="";return}h.textContent=z,p.style.display="none",_.value="",c.outerHTML=`
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${we}t</span>
                </div>`,u&&(o.style.display="none",u.outerHTML=`
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${we}t</span>
                    </div>`)}),n&&n.addEventListener("click",async()=>{n.disabled=!0,n.textContent="Saving...";let z=P;if(T&&R){const de=R.name.split(".").pop()||"png",ce=`party-logos/${e.id}/${Date.now()}.${de}`,{error:Te}=await I.storage.from("public-assets").upload(ce,R,{contentType:R.type,upsert:!0});if(Te){console.error("Logo upload failed:",Te.message),n.textContent="⚠ Upload failed",n.disabled=!1,setTimeout(()=>{n.textContent="Save Changes"},2e3);return}const{data:Be}=I.storage.from("public-assets").getPublicUrl(ce);z=Be?.publicUrl||null,P=z,R=null}const H={party_color:N(),party_logo:T?null:q(),custom_logo_url:T?z:null,party_description:a?a.value.slice(0,ot):""},{data:X,error:re}=await I.from("factions").update(H).eq("id",e.id).select("id");if(re){ee("Save failed: "+re.message),n.disabled=!1,n.textContent="Save Changes";return}if(!X||X.length===0){ee("Save failed: no rows updated (permission denied?)"),n.disabled=!1,n.textContent="Save Changes";return}sessionStorage.removeItem("nationhood_state"),n.textContent="✓ Saved",n.classList.add("saved"),n.disabled=!1,setTimeout(()=>{n.textContent="Save Changes",n.classList.remove("saved")},2e3)})}function Ca(e,t,s,{scheduledElections:d,currentTick:i,nation:l,mySeats:a,faction:v,currentEndorsement:n}={}){const c={},p={};(s||[]).forEach(S=>{c[S.id]=S.party_color||"#888",p[S.id]=S.seats||0});function _(S){if(!S)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const k=S.results;if(!k||!k.votes)return'<div class="pol-el-empty">No parliamentary election results yet.</div>';const y=Se(S.election_tick),f=new Set(k.votes.map(T=>T.party_id)),C=(s||[]).filter(T=>!f.has(T.id)&&(p[T.id]||0)>0).map(T=>({party_id:T.id,party_name:T.faction_name,votes:0,vote_percentage:0,seats:p[T.id]||0})),A=[...k.votes,...C].map(T=>({...T,seats:p[T.party_id]??T.seats??0})).sort((T,P)=>(P.seats||0)-(T.seats||0)),O=Math.max(...A.map(T=>T.vote_percentage||0),1);let R=A.map(T=>{const P=c[T.party_id]||"#888",N=(T.vote_percentage||0).toFixed(1),q=Math.round((T.vote_percentage||0)/O*100);return`<tr>
                <td><span class="pol-el-color-dot" style="background:${P}"></span>${$(T.party_name)}</td>
                <td>${(T.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${q}%;background:${P}"></div></div></td>
                <td>${N}%</td>
                <td>${T.seats||0}</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${y}</div>
            <div class="pol-el-summary">Turnout: ${(k.turnout_pct||0).toFixed(1)}% &middot; ${(k.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Party</th><th>Votes</th><th></th><th>%</th><th>Seats</th></tr></thead>
                <tbody>${R}</tbody>
            </table>`}function r(S,k,y,f){const C=[...S].sort((R,T)=>(T.votes||0)-(R.votes||0)),A=Math.max(...C.map(R=>R.vote_percentage||0),1);let O=C.map(R=>{const T=c[R.faction_id]||"#888",P=(R.vote_percentage||0).toFixed(1),N=Math.round((R.vote_percentage||0)/A*100),q=R.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";return`<tr>
                <td><span class="pol-el-color-dot" style="background:${T}"></span>${$(R.candidate_name)}${q}</td>
                <td>${$(R.party_name)}</td>
                <td>${(R.votes||0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${N}%;background:${T}"></div></div></td>
                <td>${P}%</td>
            </tr>`}).join("");return`
            <div class="pol-el-date">${k}</div>
            <div class="pol-el-summary">Turnout: ${(y||0).toFixed(1)}% &middot; ${(f||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${O}</tbody>
            </table>`}function x(S){if(!S)return'<div class="pol-el-empty">No presidential election results yet.</div>';const k=S.results;if(!k||!k.presidential_candidates)return'<div class="pol-el-empty">No presidential election results yet.</div>';const y=Se(S.election_tick);return r(k.presidential_candidates,y,k.turnout_pct,k.total_votes_cast)}function b(S){if(!S)return'<div class="pol-el-empty">No first round results.</div>';const k=S.results,y=k?.round_1_candidates||k?.presidential_candidates;if(!y)return'<div class="pol-el-empty">No first round results.</div>';const f=Se(S.election_tick),C=k.round_1_turnout_pct??k.turnout_pct,A=k.round_1_total_votes_cast??k.total_votes_cast;return r(y,f,C,A)}function u(S){if(!S)return'<div class="pol-el-empty">No runoff results.</div>';const k=S.results,y=k?.runoff_candidates;if(!y)return'<div class="pol-el-empty">No runoff results.</div>';const f=Se(S.election_tick),C=[...y].sort((P,N)=>(N.votes||0)-(P.votes||0)),A=Math.max(...C.map(P=>P.vote_percentage||0),1);let O=C.map(P=>{const N=c[P.faction_id]||"#888",q=(P.vote_percentage||0).toFixed(1),M=Math.round((P.vote_percentage||0)/A*100),D=P.winner?' <span class="pol-el-winner-badge">WINNER</span>':"";let U="";return P.base_votes!=null&&P.transfer_votes&&(U=`<div style="font-size:10px;color:var(--dtxt-muted);margin-top:2px">${(P.base_votes||0).toLocaleString()} direct + ${(P.transfer_votes||0).toLocaleString()} transferred</div>`),`<tr>
                <td><span class="pol-el-color-dot" style="background:${N}"></span>${$(P.candidate_name)}${D}</td>
                <td>${$(P.party_name)}</td>
                <td>${(P.votes||0).toLocaleString()}${U}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${M}%;background:${N}"></div></div></td>
                <td>${q}%</td>
            </tr>`}).join(""),R=`
            <div class="pol-el-date">${f}</div>
            <div class="pol-el-summary">Turnout: ${(k.turnout_pct||0).toFixed(1)}% &middot; ${(k.total_votes_cast||0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${O}</tbody>
            </table>`;const T=C.flatMap(P=>(P.transfer_detail||[]).map(N=>({...N,to_candidate:P.candidate_name,to_faction_id:P.faction_id})));if(T.length>0){let P=T.map(N=>{const q=c[N.faction_id]||"#888",M=c[N.to_faction_id]||"#888",D=N.round1_votes>0?Math.round(N.transferred/N.round1_votes*100):0;return`<tr>
                    <td><span class="pol-el-color-dot" style="background:${q}"></span>${$(N.party_name||"")}</td>
                    <td><span class="pol-el-color-dot" style="background:${M}"></span>${$(N.to_candidate||"")}</td>
                    <td>${(N.transferred||0).toLocaleString()}</td>
                    <td>${D}%</td>
                </tr>`}).join("");R+=`
                <div style="margin-top:14px;font-family:var(--dfont-mono);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--dtxt-muted);margin-bottom:6px">Vote Transfers</div>
                <table class="pol-el-table">
                    <thead><tr><th>Eliminated Party</th><th>Votes Went To</th><th>Transferred</th><th>Rate</th></tr></thead>
                    <tbody>${P}</tbody>
                </table>`}return R}const o=t?.results?.was_runoff===!0;let g,E;o?(g=`
            <button class="pol-el-tab" data-tab="pres-r1">General Election [1st Round]</button>
            <button class="pol-el-tab" data-tab="pres-runoff">General Election [Runoff]</button>`,E=`
            <div class="pol-el-content" data-content="pres-r1">${b(t)}</div>
            <div class="pol-el-content" data-content="pres-runoff">${u(t)}</div>`):(g='<button class="pol-el-tab" data-tab="pres">General Election</button>',E=`<div class="pol-el-content" data-content="pres">${x(t)}</div>`);const w=ca({isPresidentialSystem:Kt(l),scheduledElections:d,currentTick:i,playerSeats:a});let L="";w.ticksUntilWindow?L=`<div style="font-size:10px;color:var(--dtxt-muted);text-align:right;margin-top:2px">Available in ${w.ticksUntilWindow} tick${w.ticksUntilWindow!==1?"s":""}</div>`:!w.disabled&&w.ticksUntilElection&&(L=`<div style="font-size:10px;color:var(--dgreen);text-align:right;margin-top:2px">${w.ticksUntilElection} tick${w.ticksUntilElection!==1?"s":""} until election</div>`);let m="",h="";if(!w.hidden){const S=n?.endorsed_party_id||null,y=(s||[]).filter(f=>f.id!==v?.id&&(f.seats||0)>0).map(f=>{const C=f.party_color||"#888",A=[f.leader_first_name,f.leader_last_name].filter(Boolean).join(" ")||"Unknown",O=f.id===S;return`<div class="pol-endorse-candidate${O?" selected":""}" data-faction-id="${f.id}">
                <span class="pol-el-color-dot" style="background:${C}"></span>
                <span class="pol-endorse-candidate-name">${$(f.faction_name||f.abbreviation)}</span>
                <span class="pol-endorse-candidate-leader">${$(A)}</span>
                <span class="pol-endorse-candidate-seats">${f.seats||0} seats</span>
                ${O?'<span style="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)">ENDORSED</span>':""}
            </div>`}).join("");m=`<div>
            <button class="pol-endorse-btn" ${w.disabled?"disabled":""}>Endorse Candidate</button>
            ${L}
        </div>`,h=`<div class="pol-endorse-panel" style="display:none">
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
        data-nation-id="${l?.id||""}"
        data-current-tick="${i||0}">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Election Results</span>
            <div class="pol-box-header-right">${m}</div>
        </div>
        <div class="pol-box-body" style="padding:0">
        ${h}
        <div class="pol-el-tabs">
            <button class="pol-el-tab active" data-tab="parl">Parliamentary</button>
            ${g}
        </div>
        <div class="pol-el-content active" data-content="parl">${_(e)}</div>
        ${E}
        </div>
    </div>`}function Aa(){const e=document.querySelector(".pol-election-box");if(!e)return;const t=e.querySelectorAll(".pol-el-tab"),s=e.querySelectorAll(".pol-el-content");t.forEach(a=>{a.addEventListener("click",()=>{t.forEach(c=>c.classList.remove("active")),s.forEach(c=>c.classList.remove("active")),a.classList.add("active");const v=a.getAttribute("data-tab"),n=e.querySelector(`.pol-el-content[data-content="${v}"]`);n&&n.classList.add("active")})});const d=e.querySelector(".pol-endorse-btn"),i=e.querySelector(".pol-endorse-panel"),l=e.querySelector(".pol-endorse-panel-close");d&&i&&(d.addEventListener("click",()=>{const a=i.style.display!=="none";i.style.display=a?"none":"block"}),l&&l.addEventListener("click",()=>{i.style.display="none"}),i.querySelectorAll(".pol-endorse-candidate").forEach(a=>{a.addEventListener("click",async()=>{const v=a.getAttribute("data-faction-id"),n=e.getAttribute("data-faction-id"),c=Number(e.getAttribute("data-current-tick")||0),p=a.querySelector(".pol-endorse-candidate-name")?.textContent||"this party";if(confirm(`Endorse ${p}'s candidate for president? First endorsement is free; switching costs 1 AP.`)){a.style.opacity="0.5",a.style.pointerEvents="none";try{const _=await As(I,n,v,c);if(!_.success){alert(_.error||"Endorsement failed.");return}i.querySelectorAll(".pol-endorse-candidate").forEach(b=>{b.classList.remove("selected"),b.querySelector('[style*="color:var(--dgreen)"]')?.remove()}),a.classList.add("selected");const r=document.createElement("span");r.style.cssText="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)",r.textContent="ENDORSED",a.appendChild(r);const x=_.newAp!=null?` (${_.newAp} AP remaining)`:"";alert(`Endorsed ${p}!${x}`),i.style.display="none",_.newAp!=null&&await De(n)}catch(_){alert("Endorsement failed: "+(_.message||"Unknown error"))}finally{a.style.opacity="",a.style.pointerEvents=""}}})}))}function La(){const e=document.getElementById("pol-ba-bloc-data"),t=document.getElementById("pol-ba-party-pos"),s=document.getElementById("pol-ba-party-color");if(!e||!t)return;const d=JSON.parse(e.textContent),i=JSON.parse(t.textContent),l=JSON.parse(s.textContent);if(d.length===0)return;const a={BASE:{color:"var(--dgreen)",raw:"#4ade80",dim:"rgba(74,222,128,0.08)"},LEAN:{color:"#22d3ee",raw:"#22d3ee",dim:"rgba(34,211,238,0.08)"},SWING:{color:"var(--damber)",raw:"#facc15",dim:"rgba(250,204,21,0.08)"},SKEPTICAL:{color:"#f97316",raw:"#f97316",dim:"rgba(249,115,22,0.08)"},HOSTILE:{color:"var(--dred)",raw:"#ef4444",dim:"rgba(239,68,68,0.08)"}},v=[{key:"liberty_equality",left:"Liberty",right:"Equality"},{key:"tradition_progress",left:"Tradition",right:"Progress"},{key:"security_freedom",left:"Security",right:"Freedom"},{key:"globalism_nationalism",left:"Globalism",right:"Nationalism"},{key:"individualism_collectivism",left:"Individualism",right:"Collectivism"}],n=o=>o<=10?"var(--dgreen)":o<=20?"#22d3ee":o<=35?"var(--damber)":o<=50?"#f97316":"var(--dred)",c=o=>o>=3?"●●●":o>=2?"●●":o>=1?"●":"",p=o=>o>=3?"var(--dred)":o>=2?"#f97316":o>=1?"var(--damber)":"var(--dtext-3)",_=document.getElementById("pol-ba-selected"),r=document.getElementById("pol-ba-dropdown"),x=document.getElementById("pol-ba-sel-arrow"),b=r.querySelectorAll(".pol-ba-drop-item");function u(o){const g=a[o.tier]||a.HOSTILE;document.getElementById("pol-ba-sel-dot").style.background=g.raw,document.getElementById("pol-ba-sel-name").textContent=o.name;const E=document.getElementById("pol-ba-sel-badge");E.textContent=o.tier,E.style.color=g.raw,E.style.background=g.dim,document.getElementById("pol-ba-sel-pct").textContent=o.pct+"%";const w=v.map(M=>{const D=i[M.key]||50,U=o.axes[M.key]||50,z=Math.abs(D-U),H=o.strengths[M.key]||.5;return{...M,pv:D,bv:U,dist:z,str:H,weighted:z*H}}),L=w.reduce((M,D)=>M+D.weighted,0),m=v.length*100*3,h=Math.round(Math.max(0,100-L/m*100)),S=o.pref,k=h-S,y=document.getElementById("pol-ba-alignment");y.textContent=h,y.style.color=g.raw;const f=document.getElementById("pol-ba-performance"),C=o.perf??50;f.textContent=Math.round(C),f.style.color=C>=55?"var(--dgreen)":C>=40?"var(--damber)":"var(--dred)";const A=document.getElementById("pol-ba-approval");A.textContent=S,A.style.color="var(--dtext-0)";const O=document.getElementById("pol-ba-headroom");O.textContent=(k>=0?"+":"")+k.toFixed(1),O.style.color=k>10?"var(--damber)":k>=0?"var(--dgreen)":"var(--dred)",document.getElementById("pol-ba-legend-bloc-dot").style.background=g.raw;const R=document.getElementById("pol-ba-legend-bloc-name");R.textContent=o.name,R.style.color=g.raw;const T=document.getElementById("pol-ba-axes");T.innerHTML=w.map(M=>{const D=n(M.dist),U=Math.min(M.pv,M.bv),z=M.dist;return`<div class="pol-ba-axis-row">
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
                    ${M.dist>3?`<div class="pol-ba-axis-band" style="left:${U}%;width:${z}%;background:${D}12"></div>`:""}
                    <div class="pol-ba-axis-marker" style="left:${M.pv}%;background:${l};z-index:3">
                        <span style="color:var(--dbg-0)">${M.pv}</span>
                    </div>
                    <div class="pol-ba-axis-marker" style="left:${M.bv}%;background:${g.raw}">
                        <span style="color:var(--dbg-0)">${M.bv}</span>
                    </div>
                </div>
                <div class="pol-ba-axis-meta">
                    <span style="color:${D}">dist: ${M.dist}</span>
                    <span style="color:var(--dtext-3)">×${M.str} = <span style="color:${D};font-weight:700">${M.weighted.toFixed(0)}</span></span>
                </div>
            </div>`}).join("");const P=w.reduce((M,D)=>D.dist<M.dist?D:M,w[0]),N=w.reduce((M,D)=>D.weighted>M.weighted?D:M,w[0]);document.getElementById("pol-ba-summary").innerHTML=`<span style="color:var(--dgreen)">Closest: ${P.left}/${P.right}</span><span style="color:var(--dred)">Gap: ${N.left}/${N.right}</span>`;const q=document.getElementById("pol-ba-issues");q.innerHTML=(o.issues||[]).map(M=>`<span class="pol-ba-issue-tag">${M}</span>`).join(""),b.forEach(M=>{M.classList.toggle("active",M.getAttribute("data-bloc-id")===o.id),M.getAttribute("data-bloc-id")===o.id?M.style.borderLeftColor=g.raw:M.style.borderLeftColor="transparent"})}u(d[0]),_.addEventListener("click",()=>{const o=r.classList.toggle("open");x.classList.toggle("open",o)}),b.forEach(o=>{o.addEventListener("click",()=>{const g=o.getAttribute("data-bloc-id"),E=d.find(w=>w.id===g);E&&u(E),r.classList.remove("open"),x.classList.remove("open")})}),document.addEventListener("click",o=>{const g=document.getElementById("pol-ba-selector");g&&!g.contains(o.target)&&(r.classList.remove("open"),x.classList.remove("open"))})}function $(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}let V=null,ze=null,Pe=null,_e=null,je=null,Ce=null,Ve=null,Ge=null,et="minister",le=null,Re=null,Q=null,We=null,it=!1,Ke=null,nt=null,Ye=null,bt=!1,tt=null,lt=null,W=null,me=null,Xe=null,ye=!1,wt=null;const Ia=[{key:"momentum",label:"MOMENTUM",color:"#f97316"},{key:"approval",label:"APPROVAL",color:"#4ade80"},{key:"alignment",label:"ALIGNMENT",color:"#a78bfa"},{key:"appeal",label:"APPEAL",color:"#38bdf8"},{key:"tools",label:"TOOLS",color:"#6b7280"}],St=[{id:"rally",name:"Hold a Rally",ap:Rs.AP_COST,color:"#f97316",icon:"★",category:"momentum",affects:"Momentum",desc:"Rally your supporters in a public show of strength. Random outcome that directly affects your Momentum score. A rousing success builds momentum; a gaffe costs it."},{id:"press_conference",name:"Press Conference",ap:2,color:"#fbbf24",icon:"🎤",category:"momentum",affects:"Momentum",desc:"Hold a press conference to make a public statement. Base roll: -2 to +2 Momentum. Opposition parties get +1 bonus. High-approval governing parties get +2 bonus."},{id:"attack",name:"Campaign Attack",ap:Zt.AP_COST,color:"#ef4444",icon:"✦",category:"approval",affects:"Approval",desc:"Target a rival party's record or leadership. Lowers their approval and can hurt their momentum. More effective with evidence — but a weak attack backfires on you."},{id:"promise",name:"Make a Promise",ap:Y.AP_COST,color:"#a78bfa",icon:"◆",category:"approval",affects:"Approval",desc:"Publicly commit to improving a national stat or resolving a crisis. Gives an immediate approval boost, but you'll face governance penalties if you fail to deliver."},{id:"fund_think_tank",name:"Fund Think Tank",ap:ne.THINK_TANK.AP_COST,color:"#14b8a6",icon:"🏛",category:"alignment",affects:"Ideology",desc:"Fund a think tank to gradually shift the electorate's ideology on a chosen axis. Long-term investment: 8 AP upfront + 1 AP/tick for 50 ticks. Improves your Ideology pillar score."},{id:"grassroots_movement",name:"Grassroots Movement",ap:ne.GRASSROOTS.AP_COST,color:"#10b981",icon:"🌱",category:"alignment",affects:"Ideology + Momentum",desc:"Launch a grassroots campaign to shift public ideology and build momentum. Runs for 100 ticks. Drifts electorate opinion toward your position and grants +1 Momentum periodically."},{id:"pivot",name:"Ideological Pivot",ap:1,color:"#f59e0b",icon:"⟳",category:"alignment",affects:"Alignment",desc:"Shift your party's position on a chosen ideological axis. Costs escalate with each pivot (+1 AP per use, resets after 20 ticks). Reversing your current lean costs extra AP."},{id:"take_stance",name:"Take a Stance",ap:oe.AP_COST,color:"#38bdf8",icon:"⚑",category:"appeal",affects:"Appeal + Ideology",desc:"Declare your party's official position on a national issue. Builds platform appeal with aligned voters and shifts your ideology. Stances decay each tick — reinforce before they fade."},{id:"outreach",name:"Community Outreach",ap:3,color:"#60a5fa",icon:"🤝",category:"appeal",affects:"Appeal",desc:"Engage directly with communities through town halls and local events. +3 Platform Appeal. Cost starts at 3 AP and escalates by +1 each use. Decays by 1 each tick you don't use it."},{id:"poll_now",name:"Poll Now",ap:1,color:"#22d3ee",icon:"📊",category:"tools",affects:"Informational",desc:"Commission a poll to update the Current Electoral Standing. 1 AP = ±5% margin, 3 AP = ±3% margin."}];let st={},Ot={},ht=[],Z=null,te=null,rt=null,Ae=1,xt=0;window._selectPollTier=function(e){Ae=e;const t=document.getElementById("ca-config-panel");t&&(t.innerHTML=ns())};let be=null,he=null,ue=null,Ie="moderate",at=null;function Pa(){ze=null,Pe=null,_e=null,je=null,Ce=null,Ge=null,et="minister",le=null,Ke=null,nt=null,Ye=null,bt=!1,Z=null,te=null,be=null,he=null,ue=null,Ie="moderate"}function is(){return V==="rally"?!0:V==="attack"?!!ze&&!!Pe:V==="promise"?_e==="stat"?!!je:_e==="crisis"?!!Ce:!1:V==="protest"?!!le:V==="take_stance"?!!be&&!!he&&!!ue&&!!Ie:V==="poll_now"||V==="press_conference"||V==="outreach"?!0:V==="fund_think_tank"||V==="media_campaign"||V==="grassroots_movement"?!!Z&&!!te:V==="pivot"?!!Z&&!!te&&!st.pivot:!1}function Rt(){if(V==="protest"){const t=W,s=me?.current_tick||0,d=es(t?.protest_use_count||0,t?.protest_last_use_tick,s);return as(d)}if(V==="pivot"){const t=W,s=me?.current_tick||0;let d=t?.pivot_count||0;const i=t?.pivot_last_tick||0;s-i>=Oe.ESCALATION_RESET&&(d=0);let l=Oe.BASE_AP+d;if(Z&&te&&rt){const a=Number(rt[Z]??0),v=te==="right"?1:-1;(a>0&&v<0||a<0&&v>0)&&(l+=Oe.REVERSE_AP_EXTRA)}return l}if(V==="poll_now")return Ae;if(V==="outreach"){const t=W,s=me?.current_tick||0;return Math.max(1,3+(xt||0)+(t?Mt("outreach",t,s):0))}if(V==="press_conference"){const t=W,s=me?.current_tick||0;return Math.max(1,2+(t?Mt("press_conference",t,s):0))}const e=St.find(t=>t.id===V);return e?e.id==="attack"?kt(lt?.polarization):e.ap:0}async function dt(e,t,s,d){lt=e,W=t,me=s,Xe=d;const i=document.getElementById("actions-container");if(!i)return;let l=s?.current_tick||0;if(!l){const{data:h}=await I.from("shard").select("current_tick").eq("name","Alpha Shard").single();l=h?.current_tick||0,s&&(s.current_tick=l)}const a=t,v=e,{data:n}=await I.from("factions").select("action_points, party_funds").eq("id",a.id).single();n&&(a.action_points=n.action_points,a.party_funds=n.party_funds);const c=a.action_points??0,p=await Wt(I,v.id),_=new Set(p?.party_ids||[]);ye=a.id===v.ruling_faction_id||_.has(a.id);const{data:r}=await I.from("faction_ideology").select("*").eq("faction_id",a.id).single();rt=r;const x=(d||[]).filter(h=>h.id!==a.id),{data:b}=await I.from("issue_state").select("issue_id, salience").eq("nation_id",v.id).order("salience",{ascending:!1}).limit(7),u=new Set;for(const h of b||[]){const S=xe[h.issue_id];if(S)for(const k of S.stats)u.add(k)}wt=u;let o={},g=2;if(!ye){const{data:h}=await I.from("protest_log").select("id, status, tier, tick_called, tick_resolved, crisis_started_tick, crisis_duration, demand_label, turnout_score, effects_applied, grievance_type, grievance_data").eq("faction_id",a.id).in("status",["resolving","crisis_active"]).limit(1).maybeSingle();Q=h;const S=es(a.protest_use_count||0,a.protest_last_use_tick,l);if(g=as(S),o=ta(a,l,!0,h),h)Re=h.status==="resolving"?"resolving":"active";else if(a.protest_locked_by)Re="locked";else if(a.protest_cooldown_until_tick&&a.protest_cooldown_until_tick>l)Re="cooldown";else{const{data:k}=await I.from("protest_log").select("id, tier, turnout_score, effects_applied, tick_resolved, roll_breakdown, condition_score").eq("faction_id",a.id).eq("status","resolved").gte("tick_resolved",l-1).order("tick_resolved",{ascending:!1}).limit(1).maybeSingle();k&&k.tick_resolved===l?(Re="result",Q=k):Re=null}}if(We=null,it=!1,!ye&&!Q){const{data:h}=await I.from("protest_log").select("id, faction_id, status, tier, demand_label, grievance_type").eq("nation_id",v.id).eq("status","resolving").neq("faction_id",a.id).limit(1).maybeSingle();if(h){We=h;const{data:S}=await I.from("protest_endorsements").select("id").eq("protest_id",h.id).eq("faction_id",a.id).maybeSingle();it=!!S}}if(tt=null,ye){const{data:h}=await I.from("protest_log").select("id, tier, status, public_address_last_tick, tier7_demand, crisis_started_tick, crisis_duration").eq("nation_id",v.id).eq("status","crisis_active").order("crisis_started_tick",{ascending:!1}).limit(1).maybeSingle();tt=h}const{data:E}=await I.from("campaign_actions").select("action_type, tick_performed").eq("party_id",a.id).gte("tick_performed",l-10).order("tick_performed",{ascending:!1}),{data:w}=await I.from("ideology_shift_actions").select("id, action_type, target_axis, target_direction, drift_rate, created_tick, status, band_shift_total").eq("faction_id",a.id).in("status",["active","paused","suspended"]);st={},Ot={};const L={fund_think_tank:ne.THINK_TANK.COOLDOWN_WINDOW,media_campaign:ne.MEDIA_CAMPAIGN.COOLDOWN_WINDOW,grassroots_movement:ne.GRASSROOTS.COOLDOWN_WINDOW,take_stance:oe.COOLDOWN_WINDOW,poll_now:Os.COOLDOWN_WINDOW};for(const h of E||[]){const S=h.action_type,k=L[h.action_type];if(k){const y=h.tick_performed+k-l;y>0&&(!st[S]||y>st[S])&&(st[S]=y)}h.tick_performed===l&&(Ot[S]=!0)}ht=w||[];const m=(E||[]).filter(h=>h.action_type==="outreach");if(m.length>0){const h=Math.max(...m.map(k=>k.tick_performed)),S=l-h;xt=Math.max(0,m.length-S)}else xt=0;Bt(i,a,v,c,x,r,l,o,g)}function Bt(e,t,s,d,i,l,a,v,n){const c=[...St];ye||c.push({id:"protest",name:"Organise a Protest",ap:n||2,color:"#d9534f",icon:"!",category:"momentum",affects:"Momentum",desc:"Mobilize citizens against the government. A strong turnout forces a crisis and builds your momentum, but a fizzle hands the ruling party a free headline."});const p=c.find(o=>o.id===V);let _="";if(t.pyrrhic_victory_until_tick&&t.pyrrhic_victory_until_tick>a){const o=t.pyrrhic_victory_until_tick-a;_+=`<div class="protest-pyrrhic-banner">
            <span style="font-weight:700">PYRRHIC VICTORY</span> — ${o} tick${o!==1?"s":""} remaining. AP income reduced by 2/tick.
        </div>`}if(ye&&tt){const o=tt,g=o.public_address_last_tick!=null?Math.max(0,Ue.PUBLIC_ADDRESS_COOLDOWN-(a-o.public_address_last_tick)):0,E=d>=Ue.PUBLIC_ADDRESS_AP&&g===0,w=g>0?" ca-item--cooldown":"",L=g>0?`${g} TICK CD`:`${Ue.PUBLIC_ADDRESS_AP} AP`;_+=`<div class="ca-item ca-item--public-address${w}${E?"":" disabled"}" data-action-id="public_address" style="${E?"":"opacity:0.5;"}">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#5b9bd5">&#9788;</span>
                    <span class="ca-item-name">Public Address</span>
                </div>
                <span class="ca-item-ap">${L}</span>
            </div>
            <div class="ca-item-desc" style="font-size:9px;color:#4a4840;">Issue a public statement calling for calm. Reduces civil unrest buildup this tick.</div>
        </div>`}const r=[];let x=null;for(const o of c)o.category&&(!x||o.category!==x.key)&&(x={key:o.category,actions:[]},r.push(x)),x&&x.actions.push(o);for(let o=0;o<r.length;o++){const g=r[o],E=Ia.find(w=>w.key===g.key);E&&(_+=`<div style="font-family:var(--dfont-mono);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${E.color};padding:8px 6px 2px;${o>0?"border-top:1px solid var(--dborder-0);margin-top:4px;":""}">${E.label}</div>`),_+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:0 2px;">';for(const w of g.actions){const L=V===w.id;if(w.id==="protest"){_+=`<div style="grid-column:1/-1">${Ga(w,L,d,t,a)}</div>`;continue}let h=w.id==="attack"?kt(s?.polarization):w.id==="outreach"?3+(xt||0):w.id==="press_conference"?2:w.ap;["outreach","press_conference"].includes(w.id)&&t.leader_positive_traits&&(h=Math.max(1,h+Mt(w.id,t,a)));const S=w.id==="promise"?"make_promise":w.id,k=st[S]||0,y=k>0,f=!!Ot[S],C=ht.some(D=>D.action_type===w.id.replace("fund_","")),A=d>=h&&!y&&!f,O=L?w.color:A?w.color+"55":"var(--dtext-3)",R=L?`background:${w.color}08;`:"",T=L?`border-color:${w.color}33;`:"",P=L?w.color:"var(--dtext-0)",N=w.affects==="Momentum"?"#f97316":w.affects==="Approval"?"#4ade80":w.affects==="Appeal"?"#38bdf8":w.affects.includes("Ideology")?"#a78bfa":w.affects==="Alignment"?"#f59e0b":"#6b7280",q=f?`${w.name} already used this turn`:"",M=f?'<span class="ca-used-badge">USED</span>':y?`<span class="ca-cd-badge">${k} tick${k!==1?"s":""} CD</span>`:C?(()=>{const D=ht.find(U=>U.action_type===w.id.replace("fund_",""));return D?.status==="suspended"?'<span class="ca-active-badge" style="background:#d4a017">SUSPENDED</span>':D?.status==="paused"?'<span class="ca-active-badge" style="background:#f97316">PAUSED</span>':'<span class="ca-active-badge">ACTIVE</span>'})():"";_+=`<div class="ca-item${L?" selected":""}${A?"":" disabled"}${y?" ca-item--cooldown":""}${f?" ca-item--used":""}" data-action-id="${w.id}" style="border-left-color:${O};${R}${T}${A?"":"opacity:0.35;"}">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:${w.color}">${w.icon}</span>
                        <span class="ca-item-name" style="color:${P}">${$(w.name)}</span>
                        ${M}
                    </div>
                    <span class="ca-item-ap">${f?"USED":y?`${k} TICK CD`:`${h} AP`}</span>
                </div>
                <div class="ca-item-desc">${$(w.desc)}</div>
                ${f?`<div class="ca-item-used-msg">${$(q)}</div>`:`<div class="ca-item-affects" style="color:${N}">This action affects ${w.affects}</div>`}
            </div>`}_+="</div>"}let b="";if(!p)b='<div class="ca-panel"><div class="ca-panel-empty"><div class="ca-panel-empty-text">Choose an action</div></div></div>';else{if(b=`<div class="ca-panel" style="border-color:${p.color}22">`,Ve)b+=Ka(Ve);else if(p.id==="protest"&&Re==="result"&&Q)b+=Ya(Q);else if(p.id==="protest"&&Re==="resolving")b+=Xa();else{b+=Na(p,i,l,s);const o=Rt(),g=is(),E=d>=o&&g;b+=`<div class="ca-confirm-row"><div class="ca-confirm-btn${E?"":" disabled"}" style="background:${E?p.color:"var(--dtext-3)"}" id="ca-confirm-btn">Confirm — ${o} AP</div></div>`}b+="</div>"}let u="";if(ht.length>0){const o={think_tank:ne.THINK_TANK.DURATION,media_campaign:ne.MEDIA_CAMPAIGN.DURATION+ne.MEDIA_CAMPAIGN.VISIBILITY_TICKS,grassroots_movement:ne.GRASSROOTS.DURATION},g={think_tank:"Think Tank",media_campaign:"Media Campaign",grassroots_movement:"Grassroots Movement"},E={};for(const m of ie)E[m.key]=m;const w=m=>m==="think_tank"||m==="grassroots_movement";u=`<div class="ca-active-actions" style="margin-top:16px;">
            <div class="pe-header"><span class="pol-mod-title">Active Actions</span></div>
            <table class="pol-el-table" style="margin-top:4px"><thead><tr><th>Action</th><th>Activated</th><th>Effect</th><th style="text-align:right">Ticks Left</th><th></th></tr></thead><tbody>${ht.map(m=>{const h=o[m.action_type]||50,S=a-m.created_tick,k=Math.max(0,h-S),y=E[m.target_axis],f=y?`${y.leftLabel}–${y.rightLabel}`:"",C=m.target_direction==="left"?y?.leftLabel:m.target_direction==="right"?y?.rightLabel:m.target_direction==="expand"?`Expand ${f}`:m.target_direction==="narrow"?`Narrow ${f}`:m.target_direction||"?",A=m.drift_rate?`+${m.drift_rate}/tick ${C}`:C,O=Se(m.created_tick),R=m.status==="paused",T=m.status==="suspended",P=T?'<span style="color:#d4a017;font-weight:600">SUSPENDED</span>':R?'<span style="color:#f97316;font-weight:600">PAUSED</span>':`${k}`;let N="";return w(m.action_type)?R||T?N=`<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="continue" data-id="${m.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#5cb85c;color:#fff;border:none;border-radius:3px">Continue — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${m.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`:N=`<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="suspend" data-id="${m.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#c8a44e;color:#fff;border:none;border-radius:3px">Suspend — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${m.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`:N="<td></td>",`<tr>
                <td style="font-weight:600">${g[m.action_type]||m.action_type}</td>
                <td>${O}</td>
                <td>${A}</td>
                <td style="text-align:right">${P}</td>
                ${N}
            </tr>`}).join("")}</tbody></table>
        </div>`}e.innerHTML=`<div class="ca-wrap"><div class="ca-list">${_}</div>${b}</div>
    ${u}
    <div class="ca-portfolios" style="margin-top:16px;">
        <div id="ca-promises-container"><div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px">Loading promises...</div></div>
    </div>
    <div class="pe-container">
        <div class="pe-header"><span class="pol-mod-title">Party Events</span></div>
        <div id="party-events-feed" class="pe-feed"><div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px">Loading events...</div></div>
    </div>
    <div id="ca-stance-portfolio-container" style="margin-top:16px;"></div>`,Ta(t,s,a),At(document.getElementById("ca-stance-portfolio-container"),t,s),ua(s.id,t.id),e.querySelectorAll(".ca-manage-btn").forEach(o=>{o.addEventListener("click",async g=>{if(g.stopPropagation(),o.dataset.executing)return;o.dataset.executing="true",o.style.opacity="0.4";const E=o.dataset.id,w=o.dataset.action;try{let L;if(w==="suspend"?L=await zs(I,t.id,E,a):w==="continue"?L=await Ds(I,t.id,E,a):w==="cancel"&&(L=await Bs(I,t.id,s.id,E,a)),L?.success){L.newAp!=null&&(t.action_points=L.newAp);const m=await De(t.id);m!==void 0&&(t.action_points=m),ee(L.message||"Done.",!1),await dt(s,t,me,Xe)}else ee(L?.message||"Action failed.")}catch(L){ee("Error: "+L.message)}finally{o.dataset.executing="",o.style.opacity="1"}})}),e.querySelectorAll(".ca-item").forEach(o=>{o.addEventListener("click",async()=>{const g=o.dataset.actionId;if(g==="public_address"&&tt){if(o.classList.contains("disabled")||o.dataset.executing)return;o.dataset.executing="true",o.style.opacity="0.4";try{const L=await sa(I,t.id,s.id,tt.id,a);if(L.success){t.action_points=L.newAp;const m=await De(t.id);m!==void 0&&(t.action_points=m),await dt(s,t,me,Xe)}else ee(L.error||"Public Address failed."),o.style.opacity="",delete o.dataset.executing}catch(L){ee("Error: "+(L.message||"Unknown")),o.style.opacity="",delete o.dataset.executing}return}const E=St.find(L=>L.id===g),w=E?.id==="attack"?kt(s?.polarization):E?.ap;E&&d<w||(V===g?V=null:V=g,Pa(),Ve=null,Bt(e,t,s,d,i,l,a,v,n))})}),Ja(e,t,s,d,i,l,a,v,n)}async function Ta(e,t,s){const d=document.getElementById("ca-promises-container");if(!d)return;const{data:i,error:l}=await I.from("fundraiser_promises").select("*").eq("party_id",e.id).eq("nation_id",t.id).in("status",["active","pending_election"]);if(l){d.innerHTML='<div style="color:var(--dred);font-family:var(--dfont-mono);font-size:11px;padding:8px">Failed to load promises.</div>';return}const a=i||[];let v="";if(a.length===0)v='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px 0">No active promises.</div>';else for(const n of a){const c=n.status==="pending_election",p=n.demand_type==="crisis_resolution",_=n.demand_text||(p?"Resolve crisis":"Improve stat"),r=p?"✓":n.conditions?.direction==="above"?"↑":"↓";let x;if(c)x='<span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:#94a3b8">⏳ Awaiting election</span>';else{const b=Math.max(0,(n.tick_deadline||0)-s),u=b<=3;x=`<span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${b<=1?"var(--dred)":u?"var(--damber)":"var(--dgreen)"}">${b} tick${b!==1?"s":""} left</span>`}v+=`
            <div style="padding:6px 0;border-bottom:1px solid var(--dborder-1)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <span style="font-family:var(--dfont-mono);font-size:12px;color:var(--dtext-0)">${r}</span>
                        <span style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0);margin-left:4px">${$(_)}</span>
                    </div>
                    ${x}
                </div>
            </div>`}d.innerHTML=`
    <div style="border:1px solid var(--dborder-1);border-radius:6px;padding:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-family:var(--dfont-ui);font-size:13px;font-weight:700;color:var(--dtext-0);text-transform:uppercase;letter-spacing:0.5px">Promises</span>
            <span style="font-family:var(--dfont-mono);font-size:11px;color:var(--dtext-2)">${a.length} / ${Y.MAX_ACTIVE_PROMISES}</span>
        </div>
        ${v}
    </div>`}function Na(e,t,s,d,i,l){return e.id==="rally"?Ma():e.id==="attack"?Ha(t):e.id==="promise"?qa(d):e.id==="protest"?Ua(d):e.id==="take_stance"?Oa():e.id==="poll_now"?ns():e.id==="fund_think_tank"?Ra():e.id==="media_campaign"?za():e.id==="grassroots_movement"?Da():e.id==="pivot"?Ba():e.id==="press_conference"?'<div class="ca-info-box">Hold a press conference to make a public statement. Result depends on your position and approval.<br><br><strong>Base roll:</strong> -2 to +2 Momentum<br><strong>Opposition bonus:</strong> +1<br><strong>Government bonus:</strong> +2 (if gov approval ≥ 40)</div>':e.id==="outreach"?'<div class="ca-info-box">Engage directly with communities through town halls, door-knocking, and local events.<br><br><strong>Effect:</strong> +3 Platform Appeal</div>':""}function Ma(){return'<div class="ca-info-box">Hold a rally to energize your base. Random outcome that directly affects your Momentum — can boost or backfire.</div>'}function Oa(e){let t=`<div class="ca-info-box">Declare your party's position on an issue. Stances build platform appeal but decay over time.</div>`;t+='<div class="ca-subtitle" style="margin-top:10px">Select Issue</div><div style="display:flex;flex-direction:column;gap:3px">';const s=Object.entries(xe),d=at?s.sort((i,l)=>{const a=at.find(n=>n.issue_id===i[0])?.salience??0;return(at.find(n=>n.issue_id===l[0])?.salience??0)-a}):s;for(const[i,l]of d){const a=be===i,v=at?.find(c=>c.issue_id===i),n=v?Number(v.salience).toFixed(0):"—";t+=`<div class="ca-option-chip${a?" selected":""}" data-stance-issue-id="${i}" style="padding:6px 10px;display:flex;justify-content:space-between;align-items:center;${a?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
            <span style="font-weight:600">${$(l.label)}</span>
            <span style="font-size:10px;color:var(--dtext-3)">Salience: ${n}</span>
        </div>`}if(t+="</div>",be){const i=xe[be];if(i&&i.axes.length>0){t+='<div class="ca-subtitle" style="margin-top:12px">Choose Axis</div><div style="display:flex;flex-direction:column;gap:3px">';for(const l of i.axes){const a=ie.find(n=>n.key===l);if(!a)continue;const v=he===l;t+=`<div class="ca-option-chip${v?" selected":""}" data-stance-axis-key="${l}" style="padding:6px 10px;${v?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                    <span style="color:${a.leftColor}">${a.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="color:${a.rightColor}">${a.rightLabel}</span>
                </div>`}t+="</div>"}}if(he){const i=ie.find(l=>l.key===he);if(i){t+='<div class="ca-subtitle" style="margin-top:12px">Choose Side</div><div style="display:flex;gap:8px">';const l=ue==="left",a=ue==="right";t+=`<div class="ca-option-chip${l?" selected":""}" data-stance-side-val="left" style="flex:1;text-align:center;padding:8px;${l?`border-color:${i.leftColor};color:${i.leftColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${i.leftLabel}</span></div>`,t+=`<div class="ca-option-chip${a?" selected":""}" data-stance-side-val="right" style="flex:1;text-align:center;padding:8px;${a?`border-color:${i.rightColor};color:${i.rightColor};background:rgba(56,189,248,0.06)`:""}"><span style="font-weight:700">${i.rightLabel}</span></div>`,t+="</div>"}}if(ue){const i=ie.find(v=>v.key===he),l=ue==="left"?i?.leftLabel??"Left":i?.rightLabel??"Right",a=ue==="left"?i?.leftColor??"#ccc":i?.rightColor??"#ccc";t+='<div class="ca-subtitle" style="margin-top:12px">Intensity</div><div style="display:flex;gap:6px">';for(const[v,n]of Object.entries(oe.INTENSITY)){const c=Ie===v;t+=`<div class="ca-option-chip${c?" selected":""}" data-stance-int-val="${v}" style="flex:1;text-align:center;padding:6px 4px;${c?"border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)":""}">
                <div style="font-weight:600;font-size:11px">${v}</div>
                <div style="font-size:9px;color:var(--dtext-3);margin-top:2px">Str ${n.strength} · -${n.decay_rate}/t</div>
                <div style="font-size:9px;color:${a};margin-top:1px;font-weight:600">+${n.ideology_shift} ${l}</div>
            </div>`}if(t+="</div>",Ie){const v=oe.INTENSITY[Ie],n=xe[be];t+=`<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                <div style="color:var(--dtext-1);font-weight:600;margin-bottom:4px">${Ie.toUpperCase()} ${l.toUpperCase()} on ${n?.label||""}</div>
                <div style="color:${a};font-weight:700">Ideology: +${v.ideology_shift} ${l}</div>
                <div style="color:var(--dtext-3);margin-top:2px">Strength: ${v.strength} · Decay: -${v.decay_rate}/tick</div>
            </div>`}}return t}function ns(){return`<div class="ca-info-box">Commission a poll to update the Current Electoral Standing table. Higher investment produces more accurate results.</div>
    <div style="margin-top:8px;">
        <label style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);text-transform:uppercase;display:block;margin-bottom:4px;">Investment Level</label>
        <div style="display:flex;gap:6px;">
            <button class="ca-poll-tier-btn${Ae===1?" selected":""}" onclick="window._selectPollTier(1)" style="flex:1;padding:6px;background:${Ae===1?"var(--dbg-hover)":"var(--dbg-3)"};border:1px solid ${Ae===1?"var(--dtext-1)":"var(--dborder-0)"};border-radius:2px;color:var(--dtext-0);font-family:var(--dfont-mono);font-size:10px;cursor:pointer;text-align:center;">
                <strong>1 AP</strong><br><span style="color:var(--damber)">±5%</span>
            </button>
            <button class="ca-poll-tier-btn${Ae===3?" selected":""}" onclick="window._selectPollTier(3)" style="flex:1;padding:6px;background:${Ae===3?"var(--dbg-hover)":"var(--dbg-3)"};border:1px solid ${Ae===3?"var(--dtext-1)":"var(--dborder-0)"};border-radius:2px;color:var(--dtext-0);font-family:var(--dfont-mono);font-size:10px;cursor:pointer;text-align:center;">
                <strong>3 AP</strong><br><span style="color:var(--dgreen)">±3%</span>
            </button>
        </div>
    </div>
    `}function Ra(){let e=`<div class="ca-info-box">Launch a think tank to gradually drift the electorate's ideological mean on a chosen axis. ${ne.THINK_TANK.AP_COST} AP upfront + ${ne.THINK_TANK.TICK_AP_COST} AP/tick for ${ne.THINK_TANK.DURATION} ticks. Drift: 1d3 (0.1–0.3) per tick.</div>`;if(e+=Et(),Z){const t=ie.find(s=>s.key===Z);t&&(e+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',e+=Ct(t.leftLabel,t.rightLabel,"left","right"))}return e}function za(){const e=ne.MEDIA_CAMPAIGN;let t=`<div class="ca-info-box">Launch a media campaign to expand or narrow electorate ideological variance on a chosen axis. Phase 1: 1d5 (0.1–0.5) variance shift/tick for ${e.DURATION} ticks. Phase 2: 1d3 (1–3) momentum/tick for ${e.VISIBILITY_TICKS} ticks.</div>`;return t+=Et(),Z&&(t+='<div class="ca-subtitle" style="margin-top:12px">Variance direction</div>',t+=Ct("Expand (polarize)","Narrow (centralize)","expand","narrow")),t}function Da(){const e=ne.GRASSROOTS;let t=`<div class="ca-info-box">Launch a grassroots movement to slowly shift the electorate on a chosen axis. ${e.AP_COST} AP upfront + ${e.TICK_AP_COST} AP/tick for ${e.DURATION} ticks. Drift: 1d2 (${e.DRIFT_MIN}–${e.DRIFT_MAX})/tick. +1 momentum every ${e.VISIBILITY_INTERVAL} ticks.</div>`;if(t+=Et(),Z){const s=ie.find(d=>d.key===Z);s&&(t+='<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>',t+=Ct(s.leftLabel,s.rightLabel,"left","right"))}return t}function Ba(e){const t=W,s=me?.current_tick||0;let d=t?.pivot_count||0;const i=t?.pivot_last_tick||0;s-i>=Oe.ESCALATION_RESET&&(d=0);const l=Math.max(0,Oe.COOLDOWN-(s-i)),a=i>0&&l>0;let v=`<div class="ca-info-box">Shift your party's ideological position. Each pivot costs +1 AP more than the last (resets after ${Oe.ESCALATION_RESET} ticks of no pivots). Reversing direction costs extra AP. Hold steady 20+ ticks for a conviction bonus.</div>`;if(a&&(v+=`<div style="font-family:var(--dfont-mono);font-size:11px;color:var(--damber);padding:6px 0">Cooldown: ${l} tick${l!==1?"s":""} remaining</div>`),v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);padding:4px 0">Pivots this cycle: ${d} · Next cost: ${Oe.BASE_AP+d} AP${d>0?" (escalated)":""}</div>`,v+=Et(),Z){const n=ie.find(c=>c.key===Z);if(n){const c=rt?Number(rt[Z]??0):0,p=c>0?`+${c} (${n.rightLabel})`:c<0?`${c} (${n.leftLabel})`:"0 (Center)";if(v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);padding:4px 0;margin-top:4px">Current position: <span style="font-weight:700">${p}</span></div>`,v+='<div class="ca-subtitle" style="margin-top:8px">Pivot direction</div>',v+=Ct(n.leftLabel,n.rightLabel,"left","right"),te){const _=te==="right"?1:-1;(c>0&&_<0||c<0&&_>0)&&(v+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);padding:6px 0;border-top:1px solid var(--dborder-1);margin-top:8px">⚠ Reversal: +${Oe.REVERSE_AP_EXTRA} AP extra</div>`)}}}return v}function Et(){let e='<div class="ca-subtitle" style="margin-top:10px">Target axis</div><div style="display:flex;flex-direction:column;gap:4px">';for(const t of ie){const s=Z===t.key;e+=`<div class="ca-option-chip${s?" selected":""}" data-axis-key="${t.key}" style="padding:6px 10px;${s?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">
            <span style="font-weight:600">${t.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="font-weight:600">${t.rightLabel}</span>
            <span style="font-size:0.75em;color:var(--dtext-3);margin-left:6px">${t.description}</span>
        </div>`}return e+="</div>",e}function Ct(e,t,s,d){let i='<div style="display:flex;gap:8px">';const l=te===s,a=te===d;return i+=`<div class="ca-option-chip${l?" selected":""}" data-direction-value="${s}" style="flex:1;text-align:center;padding:8px;${l?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${e}</div>`,i+=`<div class="ca-option-chip${a?" selected":""}" data-direction-value="${d}" style="flex:1;text-align:center;padding:8px;${a?"border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)":""}">${t}</div>`,i+="</div>",i}function Ha(e){const t=lt?.polarization||0,s=kt(t);let i=`<div style="color:#ef4444;font-size:0.85em;margin-bottom:4px">Using this will increase Polarization by 0.25.${s>Zt.AP_COST?` Cost scaled to ${s} AP (polarization ${Math.round(t)}).`:""}</div><div class="ca-subtitle">Select target party</div>`;for(const l of e){const a=ze===l.id;i+=`<div class="ca-rival-card${a?" selected":""}" data-rival-id="${l.id}" style="border-left-color:${a?"#ef4444":l.party_color||"#888"};${a?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
            <span class="ca-rival-name" style="color:${a?"#ef4444":"var(--dtext-0)"}">${$(l.faction_name)}</span>
        </div>`}if(ze&&Ge){i+='<div class="ca-subtitle" style="margin-top:12px">Choose attack vector</div>';for(const l of Ge){const a=Pe===l.id;l.strength==="strong"||l.strength;const v=l.evidence_required&&l.strength==="weak",n=l.strength==="strong"?"#4ade80":l.strength==="moderate"?"#facc15":"#ef4444";i+=`<div class="ca-vector-card${a?" selected":""}${v?" disabled":""}" data-vector-id="${l.id}" style="border-left-color:${a?"#ef4444":n};${a?"border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)":""}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="ca-vector-name">${$(l.name)}</span>
                    <span class="ca-vector-strength" style="color:${n}">${l.strength.toUpperCase()}</span>
                </div>
                <div class="ca-vector-desc">${$(l.description)}</div>
            </div>`}if(Pe){const l=Ge.find(a=>a.id===Pe);if(l){const a=Hs(l.strength),v=Math.max(...Object.values(a));i+='<div style="margin-top:10px">';const n={devastating:"#4ade80",effective:"#22d3ee",glancing:"#facc15",backfire:"#f97316",mutual:"#ef4444"};for(const c of qs){const p=a[c.id]||0,_=v>0?p/v*100:0,r=n[c.id]||"#888";i+=`<div class="ca-outcome-bar">
                        <span class="ca-outcome-name">${$(c.name)}</span>
                        <div class="ca-outcome-track"><div class="ca-outcome-fill" style="width:${_}%;background:${r}"></div></div>
                        <span class="ca-outcome-pct" style="color:${r}">${p}%</span>
                    </div>`}i+="</div>"}}}else ze&&!Ge&&(i+='<div class="ca-info-box" style="margin-top:12px">Loading evidence...</div>');return i}function qa(e){let t='<div class="ca-subtitle">What do you promise?</div>';const s=[{id:"stat",name:"Improve a Stat",desc:"Promise to move a national stat in the right direction.",color:"#a78bfa"},{id:"crisis",name:"Resolve a Crisis",desc:"Promise to resolve an active national crisis.",color:"#ef4444"}];t+='<div style="display:flex;gap:8px;margin-bottom:12px">';for(const d of s){const i=_e===d.id;t+=`<div style="flex:1;padding:8px 12px;border:1px solid ${i?d.color+"44":"var(--dborder-1)"};border-left:3px solid ${i?d.color:"transparent"};border-radius:4px;cursor:pointer;transition:all 0.1s;${i?`background:${d.color}08`:""}" data-promise-type="${d.id}">
            <div style="font-family:var(--dfont-ui);font-size:12px;font-weight:700;color:${i?d.color:"var(--dtext-0)"}">${d.name}</div>
            <div style="font-family:var(--dfont-ui);font-size:10px;color:var(--dtext-3);margin-top:2px">${d.desc}</div>
        </div>`}if(t+="</div>",_e==="stat"){const d=ye?Y.STAT_DELTA_GOVERNING:Y.STAT_DELTA,i=Fs(e,ye),l=wt&&wt.size>0?i.filter(a=>wt.has(a.statKey)):i;if(l.length===0)t+='<div class="ca-info-box">No stats available to promise on — they may all be at their limit.</div>';else{ye&&(t+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-bottom:8px;padding:4px 8px;border:1px solid rgba(249,115,22,0.2);border-radius:4px;background:rgba(249,115,22,0.04)">⚠ Governing factions must promise ±${d} (you have legislative power)</div>`),t+='<div class="ca-bloc-list">';for(const a of l){const v=je===a.statKey,n=a.direction==="higher_is_better"?Math.min(100,Math.round(a.value+d)):Math.max(0,Math.round(a.value-d)),c=a.promiseDirection==="increase"?"↑":"↓",p=a.promiseDirection==="increase"?"#4ade80":"#22d3ee";t+=`<div class="ca-stat-card${v?" selected":""}" data-stat-key="${a.statKey}" style="border-left-color:${v?"#a78bfa":p};${v?"border-color:rgba(167,139,250,0.2);background:rgba(167,139,250,0.03)":""}">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span class="ca-stat-name">${$(a.label)}</span>
                        <div style="display:flex;align-items:center;gap:8px">
                            <span class="ca-stat-val" style="color:var(--dtext-2)">${Math.round(a.value)}</span>
                            <span style="color:${p}">${c}</span>
                            <span class="ca-stat-val" style="color:${p}">${n}</span>
                        </div>
                    </div>
                    ${v?`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:4px">Deadline: ${Y.DEADLINE_BASE+1}–${Y.DEADLINE_BASE+Y.DEADLINE_DICE} ticks (starts after next election) · Immediate <span style="color:#4ade80">+${Y.APPROVAL_ON_PROMISE} approval</span></div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:3px;display:flex;gap:12px;flex-wrap:wrap">
                        <span style="color:#4ade80">If kept: +${Y.KEPT_APPROVAL} momentum</span>
                    </div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;display:flex;gap:12px;flex-wrap:wrap">
                        <span style="color:#ef4444">If broken: ${Y.BROKEN_APPROVAL} momentum</span>
                    </div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;color:var(--dtext-3)">Countdown deferred until in government · <span style="color:#f97316">−${Y.PENALTY_PER_TICK_MIN} to −${Y.PENALTY_PER_TICK_MAX} approval/tick while unfulfilled</span></div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;color:var(--dtext-3)">If in opposition after election: <span style="color:#94a3b8">promise extinguishes — no penalty</span></div>`:""}
                </div>`}t+="</div>"}}return _e==="crisis"&&(t+='<div id="ca-crisis-list"><div class="ca-info-box">Loading crises...</div></div>',t+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:8px;padding:0 2px">
            Deadline: ${Y.DEADLINE_BASE+1}–${Y.DEADLINE_BASE+Y.DEADLINE_DICE} ticks (starts after next election) · Immediate <span style="color:#4ade80">+${Y.APPROVAL_ON_PROMISE} approval</span>
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:3px;padding:0 2px">
            <span style="color:#4ade80">If kept: +${Y.KEPT_APPROVAL} momentum</span>
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;padding:0 2px">
            <span style="color:#ef4444">If broken: ${Y.BROKEN_APPROVAL} momentum</span>
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;padding:0 2px;color:var(--dtext-3)">Countdown deferred until in government · <span style="color:#f97316">−${Y.PENALTY_PER_TICK_MIN} to −${Y.PENALTY_PER_TICK_MAX} approval/tick while unfulfilled</span></div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;padding:0 2px;color:var(--dtext-3)">If in opposition after election: <span style="color:#94a3b8">promise extinguishes — no penalty</span></div>`),t}async function Fa(e,t,s){if(!Ke){const{data:d}=await I.from("ministries").select("ministry_key, minister_first_name, minister_last_name, minister_approval, party_id").eq("nation_id",e.id).not("party_id","is",null).order("minister_approval",{ascending:!0});Ke=d||[]}if(!nt){const{data:d}=await I.from("active_crises").select("id, started_at_tick, crisis_templates(name, description)").eq("nation_id",e.id);nt=(d||[]).map(i=>({...i,duration:s-(i.started_at_tick||0)}))}if(!Ye){const{data:d}=await I.from("stat_history").select("stat_name, value, tick").eq("nation_id",e.id).gte("tick",s-6).order("tick",{ascending:!0}),i={};for(const n of d||[])i[n.stat_name]||(i[n.stat_name]=[]),i[n.stat_name].push({tick:n.tick,value:n.value});const l=[];for(const[n,c]of Object.entries(i)){if(la(n))continue;const p=c.sort((o,g)=>o.tick-g.tick),_=e[n]??p[p.length-1]?.value??0;if(!(ss(n)?_>=70:_<=30))continue;const x=p[0]?.value??_,b=_-x,u=ra(_,x,n);l.push({key:n,current:_,sixTicksAgo:x,delta:b,failureScore:u,displayName:n.replace(/_/g," ").replace(/\b\w/g,o=>o.toUpperCase())})}l.sort((n,c)=>c.failureScore-n.failureScore);const{data:a}=await I.from("protest_log").select("tick_called").eq("nation_id",e.id).gte("tick_called",s-6),v=da((a||[]).map(n=>({tick:n.tick_called})),s);Ye={failingStats:l,_fatigueLevel:v}}}function Ga(e,t,s,d,i){const l=Re,a=e.ap,v=s>=a;if(l==="resolving")return`<div class="ca-item ca-item--protest ca-item--resolving" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#c8a64e">!</span>
                    <span class="ca-item-name" style="color:#c8a64e">${$(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#c8a64e">RESOLVING...</span>
            </div>
        </div>`;if(l==="result"&&Q){const r=Q.tier;if(r>=3&&r<=5){const x=ts(r).toUpperCase(),b=Q.roll_breakdown||{},u=b.endorsements||0,o=b.joint_bonus||0;return`<div class="ca-item ca-item--protest ca-item--result-${r}" data-action-id="protest">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:#5cb85c">!</span>
                        <span class="ca-item-name" style="color:#5cb85c">${$(e.name)}</span>
                    </div>
                    <span class="ca-item-ap" style="color:#5cb85c">TIER ${r} — ${x}</span>
                </div>
                ${u>0?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#a78bfa;margin-top:2px;padding:0 12px 4px">${u} party endorsement${u>1?"s":""} (+${o} bonus)</div>`:""}
            </div>`}}if(l==="active"&&Q){const r=(Q.crisis_started_tick??i)+(Q.crisis_duration||6)-i,x=Q.tier===6&&(d.action_points||0)>=Ue.CALL_OFF_AP,b=Q.tier===7;return`<div class="ca-item ca-item--protest ca-item--active" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${$(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">ACTIVE — TIER ${Q.tier}</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Your protest crisis is running. ${Q.demand_label?`Demand: ${$(Q.demand_label)}`:""}</div>
            <div class="protest-passive-status">Running — ${Math.max(0,r)} tick${r!==1?"s":""} remaining.</div>
            ${b?'<div class="protest-calloff-note">Tier 7 protests cannot be called off.</div>':`<div class="protest-calloff-btn${x?"":" disabled"}" onclick="window._protestCallOff()">Call Off Protest — ${Ue.CALL_OFF_AP} AP</div>`}
        </div>`}if(l==="locked")return`<div class="ca-item ca-item--protest ca-item--locked" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${$(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">LOCKED</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">A protest crisis is already underway, led by another party.</div>
        </div>`;if(l==="cooldown"){const r=(d.protest_cooldown_until_tick||0)-i;return`<div class="ca-item ca-item--protest ca-item--cooldown" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.3)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.3)">${$(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#4a4840">COOLDOWN ${Math.max(0,r)}</span>
            </div>
        </div>`}if(We&&!l){const r=!it&&(d.action_points||0)>=1,x=it?"ENDORSED":"ENDORSE — 1 AP";return`<div class="ca-item ca-item--protest ca-item--endorse" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#a78bfa">!</span>
                    <span class="ca-item-name" style="color:#a78bfa">${$(e.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#a78bfa">ENDORSEMENT</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Another opposition party has called a protest. You can endorse it to boost turnout (+15 per endorsement).</div>
            ${We.demand_label?`<div style="font-family:var(--dfont-mono);font-size:9px;color:#f97316;padding:0 12px 4px">Demand: ${$(We.demand_label)}</div>`:""}
            <div class="protest-endorse-btn${r?"":" disabled"}" onclick="window._protestEndorse()">${x}</div>
        </div>`}return`<div class="ca-item ca-item--protest${t?" selected":""}${v?"":" disabled"}" data-action-id="protest" style="border-left-color:${t?"#d9534f":v?"rgba(217,83,79,0.55)":"var(--dtext-3)"};${t?"background:rgba(217,83,79,0.07);":""}${t?"border-color:rgba(217,83,79,0.2);":""}${v?"":"opacity:0.35;"}">
        <div class="ca-item-head">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="ca-item-icon" style="color:#d9534f">!</span>
                <span class="ca-item-name" style="color:${t?"#e06460":"var(--dtext-0)"}">${$(e.name)}</span>
            </div>
            <span class="ca-item-ap" style="color:#d9534f">${a} AP</span>
        </div>
        ${t?`<div class="ca-item-desc">${$(e.desc)}</div>`:""}
    </div>`}function Ua(e,t){let s="";s+='<div class="protest-warning">Turnout is probabilistic — based on Civil Unrest, Happiness, Polarisation, and Political Violence. A fizzle hands the government a free headline. Choose your moment.</div>';const d=[{key:"civil_unrest",label:"CIVIL UNREST",value:e.civil_unrest||0},{key:"happiness",label:"HAPPINESS",value:e.happiness||50},{key:"polarization",label:"POLARISATION",value:e.polarization||0},{key:"political_violence",label:"POL VIOLENCE",value:e.political_violence||0}];s+='<div class="protest-stat-hints">';for(const n of d){const c=aa(n.key,n.value);s+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">${n.label}</span>
            <span class="protest-stat-pill__value" style="color:${c}">${Math.round(n.value)}</span>
        </div>`}const i=Ye?._fatigueLevel||{label:"...",color:"#4a4840"};s+=`<div class="protest-stat-pill">
        <span class="protest-stat-pill__label">PROTEST FATIGUE</span>
        <span class="protest-stat-pill__value" style="color:${i.color}">${i.label}</span>
    </div>`;const l=(Xe||[]).filter(n=>!(n.id===W?.id||ye)).length;if(l>0){const n=l>=2?"#a78bfa":"#4a4840";s+=`<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">ENDORSERS</span>
            <span class="protest-stat-pill__value" style="color:${n}">${l}</span>
        </div>`}s+="</div>";const a=[{id:"minister",label:"Minister"},{id:"activeCrisis",label:"Active Crisis"},{id:"statFailure",label:"Stat Failure"}];s+='<div class="protest-tabs">';for(const n of a)s+=`<div class="protest-tab${et===n.id?" active":""}" data-protest-tab="${n.id}">${n.label}</div>`;s+="</div>",s+='<div class="protest-target-list" id="protest-target-list">',et==="minister"?s+=ja():et==="activeCrisis"?s+=Va():et==="statFailure"&&(s+=Wa()),s+="</div>";const v=le?.label||null;return s+='<div class="protest-confirm">',s+=`<div class="protest-confirm__note">${v?`Targeting: ${$(v)}`:"Select a target above"}</div>`,s+="</div>",s}function ja(){const e=Ke;if(!e)return'<div class="protest-empty">Loading ministers...</div>';if(e.length===0)return'<div class="protest-empty">No government ministers found.</div>';let t="";for(const s of e){const d=Math.round(s.minister_approval||50),i=d>50?"high":d>=35?"mid":"low",l=le?.id===s.ministry_key,a=JSON.stringify({id:s.ministry_key,type:"minister",label:`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()||s.ministry_key,demandLabel:`${(s.minister_first_name||"")+" "+(s.minister_last_name||"")} must resign.`.trim(),grievanceData:{ministryKey:s.ministry_key,approval:d,name:`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()}}).replace(/"/g,"&quot;");t+=`<div class="protest-target${l?" selected":""}" data-protest-target="${a}">
            <div>
                <div class="protest-target__name">${$(`${s.minister_first_name||""} ${s.minister_last_name||""}`.trim()||s.ministry_key)}</div>
                <div class="protest-target__meta">${$(s.ministry_key)}</div>
            </div>
            <span class="protest-target__value protest-target__value--${i}">${d}%</span>
        </div>`}return t}function Va(){const e=nt;if(!e)return'<div class="protest-empty">Loading active crises...</div>';if(e.length===0)return'<div class="protest-empty">No active crises in this nation.</div>';let t="";for(const s of e){const d=le?.id===s.id,i=s.crisis_templates?.name||"Unknown Crisis",l=s.crisis_templates?.description||"",a=s.duration||0,v=`The government must resolve the ${i} crisis.`,n=JSON.stringify({id:s.id,type:"activeCrisis",label:i,demandLabel:v,grievanceData:{crisisId:s.id,name:i,duration:a}}).replace(/"/g,"&quot;");t+=`<div class="protest-target${d?" selected":""}" data-protest-target="${n}">
            <div>
                <div class="protest-target__name">${$(i)}</div>
                <div class="protest-target__meta">${$(l?l.slice(0,80):"")}${a?" · "+a+"t active":""}</div>
            </div>
        </div>`}return t}function Wa(e,t){const s=Ye?.failingStats;if(!s)return'<div class="protest-empty">Loading stats...</div>';if(s.length===0)return'<div class="protest-empty">No stats are bad enough to protest. Stats must be critically failing (≥70 for negative stats, ≤30 for positive stats).</div>';let d="";for(const i of s){const l=le?.id===i.key,a=ss(i.key)?"&#9650;":"&#9660;",v=JSON.stringify({id:i.key,type:"statFailure",label:i.displayName,demandLabel:`The government must address ${i.displayName}.`,grievanceData:{statKey:i.key,failureScore:i.failureScore,current:i.current}}).replace(/"/g,"&quot;");d+=`<div class="protest-target${l?" selected":""}" data-protest-target="${v}">
            <div>
                <div class="protest-target__name">${$(i.displayName)}</div>
                <div class="protest-target__meta">${Math.round(i.current)} <span class="protest-target__delta" style="color:#d9534f">${a} ${Math.abs(i.delta).toFixed(1)}</span></div>
            </div>
            <span class="protest-target__value protest-target__value--low">${i.failureScore.toFixed(1)}</span>
        </div>`}return d}function Ka(e){if(!e)return"";const t=!e.error&&e.success,s=t?"#4ade80":"#ef4444";let d=`<div class="ca-result-box" style="border-color:${s}33">`;if(d+=`<div class="ca-result-header" style="background:${s}08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:${s}">${$(e.headline||(t?"Action completed":"Action failed"))}</span>
        <span class="ca-result-dismiss" id="ca-dismiss-result">Dismiss</span>
    </div>`,d+='<div class="ca-result-body">',e.effects&&e.effects.length>0)for(const i of e.effects){const l=i.bloc||i.label||i.stat||"",a=i.value??i.delta??0,v=a>=0?"#4ade80":"#ef4444";d+=`<div class="ca-result-row">
                <span class="ca-result-label">${$(l)}</span>
                <span class="ca-result-val" style="color:${v}">${a>=0?"+":""}${a}</span>
            </div>`}if(e.blocEffects&&e.blocEffects.length>0)for(const i of e.blocEffects)d+=`<div class="ca-result-row">
                <span class="ca-result-label">${$(i.blocName)}</span>
                <span class="ca-result-val" style="color:#4ade80">+${i.delta}</span>
            </div>`;return e.outcomeName&&(d+=`<div class="ca-result-row">
            <span class="ca-result-label">Outcome</span>
            <span class="ca-result-val" style="color:${s}">${$(e.outcomeName)}</span>
        </div>`),e.demandText&&(d+=`<div class="ca-result-row">
            <span class="ca-result-label">Promise</span>
            <span class="ca-result-val" style="color:#a78bfa">${$(e.demandText)}</span>
        </div>`,e.conditions?.is_governing&&(d+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-top:2px">Governing target: ±${e.conditions.delta} (higher bar)</div>`)),e.deadlineTicks&&(d+=`<div class="ca-result-row">
            <span class="ca-result-label">Deadline</span>
            <span class="ca-result-val" style="color:var(--dtext-2)">${e.deadlineTicks} ticks</span>
        </div>`),e.promiseType&&(d+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Consequences</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#4ade80">Kept: +${Y.KEPT_APPROVAL} momentum</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#ef4444;margin-top:2px">Broken: ${Y.BROKEN_APPROVAL} momentum</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-top:2px">While unfulfilled: −${Y.PENALTY_PER_TICK_MIN} to −${Y.PENALTY_PER_TICK_MAX} approval/tick</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#94a3b8;margin-top:2px">Countdown starts after next election · Opposition = extinguished</div>
        </div>`),d+="</div></div>",d}function Ya(e){const t=e.tier||0,s=ts(t).toUpperCase(),d=e.roll_breakdown||{},i=e.condition_score??e.turnout_score??0,l=d.endorsements||0,a=d.joint_bonus||0,v=e.effects_applied||[];let n='<div class="ca-result-box" style="border-color:#5cb85c33">';if(n+=`<div class="ca-result-header" style="background:#5cb85c08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#5cb85c">Protest Result — Tier ${t}</span>
    </div>`,n+='<div class="ca-result-body">',n+=`<div class="ca-result-row">
        <span class="ca-result-label">Outcome</span>
        <span class="ca-result-val" style="color:#5cb85c">${s}</span>
    </div>`,n+=`<div class="ca-result-row">
        <span class="ca-result-label">Condition Score</span>
        <span class="ca-result-val" style="color:var(--dtext-1)">${Math.round(i)}</span>
    </div>`,Object.keys(d).length>0){n+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Score Breakdown</div>`;const p=new Set(["endorsements","joint_bonus"]);for(const[_,r]of Object.entries(d)){if(p.has(_))continue;const x=_.replace(/_/g," ").replace(/\b\w/g,o=>o.toUpperCase()),b=Number(r),u=b>=0?"#4ade80":"#ef4444";n+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${$(x)}</span>
                <span class="ca-result-val" style="color:${u};font-size:10px">${b>=0?"+":""}${b.toFixed(1)}</span>
            </div>`}n+="</div>"}l>0&&(n+=`<div class="protest-endorse-breakdown">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#a78bfa;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:2px">Coalition Support</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-1)">${l} party endorsement${l>1?"s":""} — +${a} bonus</div>
        </div>`);const c=v.filter(p=>p.stat&&p.stat!=="electoral_wound");if(c.length>0){n+=`<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Effects on Nation</div>`;for(const p of c){const _=(p.stat||"").replace(/_/g," ").replace(/\b\w/g,b=>b.toUpperCase()),r=Number(p.delta||p.value||0),x=r>=0?"#4ade80":"#ef4444";n+=`<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${$(_)}</span>
                <span class="ca-result-val" style="color:${x};font-size:10px">${r>=0?"+":""}${r}</span>
            </div>`}n+="</div>"}return n+="</div></div>",n}function Xa(){const e=Q;let t='<div class="ca-result-box" style="border-color:rgba(217,83,79,0.3)">';if(t+=`<div class="ca-result-header" style="background:rgba(217,83,79,0.06)">
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
    </div>`,t+="</div></div>",t}function Ja(e,t,s,d,i,l,a,v,n){const c=()=>Bt(e,t,s,d,i,l,a,v,n);e.querySelectorAll("[data-rival-id]").forEach(r=>{r.addEventListener("click",async()=>{const x=r.dataset.rivalId;if(ze===x)return;ze=x,Pe=null,Ge=null,c();const b=await Gs(I,x,s.id,a);Ge=Us(b),c()})}),e.querySelectorAll("[data-vector-id]").forEach(r=>{r.addEventListener("click",()=>{r.classList.contains("disabled")||(Pe=Pe===r.dataset.vectorId?null:r.dataset.vectorId,c())})}),e.querySelectorAll("[data-promise-type]").forEach(r=>{r.addEventListener("click",async()=>{const x=r.dataset.promiseType;if(_e=_e===x?null:x,je=null,Ce=null,c(),_e==="crisis"){const{data:b}=await I.from("active_crises").select("id, crisis_id, started_at_tick, crisis_templates(name, description)").eq("nation_id",s.id),u=document.getElementById("ca-crisis-list");if(u)if(!b||b.length===0)u.innerHTML='<div class="ca-info-box">No active crises to promise on.</div>';else{let o="";for(const g of b){const E=Ce===g.id,w=g.crisis_templates?.name||"Unknown Crisis";o+=`<div class="ca-crisis-card${E?" selected":""}" data-crisis-id="${g.id}">
                                <span class="ca-crisis-name">${$(w)}</span>
                            </div>`}u.innerHTML=o,u.querySelectorAll("[data-crisis-id]").forEach(g=>{g.addEventListener("click",()=>{Ce=Ce===g.dataset.crisisId?null:g.dataset.crisisId,c()})})}}})}),e.querySelectorAll("[data-stat-key]").forEach(r=>{r.addEventListener("click",()=>{je=je===r.dataset.statKey?null:r.dataset.statKey,c()})}),e.querySelectorAll("[data-crisis-id]").forEach(r=>{r.addEventListener("click",()=>{Ce=Ce===r.dataset.crisisId?null:r.dataset.crisisId,c()})}),e.querySelectorAll("[data-stance-issue-id]").forEach(r=>{r.addEventListener("click",()=>{const x=r.dataset.stanceIssueId;be===x?be=null:be=x,he=null,ue=null,Ie="moderate";const b=xe[be];b&&b.axes.length===1&&(he=b.axes[0]),c()})}),e.querySelectorAll("[data-stance-axis-key]").forEach(r=>{r.addEventListener("click",()=>{const x=r.dataset.stanceAxisKey;he=he===x?null:x,ue=null,c()})}),e.querySelectorAll("[data-stance-side-val]").forEach(r=>{r.addEventListener("click",()=>{const x=r.dataset.stanceSideVal;ue=ue===x?null:x,c()})}),e.querySelectorAll("[data-stance-int-val]").forEach(r=>{r.addEventListener("click",()=>{Ie=r.dataset.stanceIntVal,c()})}),V==="take_stance"&&!at&&!Ve&&I.from("issue_state").select("issue_id, salience").eq("nation_id",s.id).then(({data:r})=>{at=r||[],c()}),e.querySelectorAll("[data-axis-key]").forEach(r=>{r.addEventListener("click",()=>{const x=r.dataset.axisKey;Z===x?Z=null:Z=x,te=null,c()})}),e.querySelectorAll("[data-direction-value]").forEach(r=>{r.addEventListener("click",()=>{const x=r.dataset.directionValue;te=te===x?null:x,c()})}),e.querySelectorAll("[data-grassroots-demo]").forEach(r=>{r.addEventListener("click",()=>{r.dataset.grassrootsDemo,c()})}),e.querySelectorAll("[data-grassroots-band]").forEach(r=>{r.addEventListener("click",()=>{r.dataset.grassrootsBand,c()})});const p=e.querySelector("#ca-dismiss-result");p&&p.addEventListener("click",()=>{Ve=null,c()}),V==="protest"&&!Ve&&!Ke&&!bt&&(bt=!0,Fa(s,t,a).then(()=>{bt=!1,c()}).catch(r=>{console.error("[Protest] loadProtestData failed:",r),bt=!1,Ke=Ke||[],nt=nt||[],Ye=Ye||{failingStats:[],_fatigueLevel:{label:"—",color:"#4a4840"}},c()})),e.querySelectorAll("[data-protest-tab]").forEach(r=>{r.addEventListener("click",()=>{et=r.dataset.protestTab,le=null,c()})}),e.querySelectorAll("[data-protest-target]").forEach(r=>{r.addEventListener("click",()=>{const x=r.dataset.protestTarget;try{const b=JSON.parse(x);le=le?.id===b.id?null:b}catch{le=null}c()})});const _=e.querySelector("#ca-confirm-btn");_&&_.addEventListener("click",()=>{_.classList.contains("disabled")||(_.classList.add("disabled"),Za(e,t,s,d,i,l,a))})}let Pt=!1;window._protestEndorse=async function(){if(!Pt&&!(!We||it)&&confirm("Endorse this protest? Costs 1 AP and boosts turnout (+15).")){Pt=!0;try{const e=await oa(I,W.id,lt.id,We.id,me.current_tick);if(!e.success){ee(e.error||"Endorsement failed.");return}it=!0,W.action_points=Math.max(0,(W.action_points||0)-1);const t=await De(W.id);t!==void 0&&(W.action_points=t),await dt(lt,W,me,Xe)}catch(e){console.error("[Protest] Endorse failed:",e),ee("Endorsement failed: "+e.message)}finally{Pt=!1}}};let Tt=!1;window._protestCallOff=async function(){if(!Tt&&Q){if(Q.tier===7){ee("Tier 7 protests cannot be called off.");return}if(confirm("Call off this protest? Costs "+Ue.CALL_OFF_AP+" AP. A small approval boost from moderate blocs will be applied.")){Tt=!0;try{const e=await ia(I,W.id,Q.id,me.current_tick);if(!e.success){ee(e.error||"Call-off failed.");return}W.action_points=Math.max(0,(W.action_points||0)-Ue.CALL_OFF_AP);const t=await De(W.id);t!==void 0&&(W.action_points=t),await dt(lt,W,me,Xe)}catch(e){console.error("[Protest] Call-off failed:",e),ee("Call-off failed: "+e.message)}finally{Tt=!1}}}};async function Za(e,t,s,d,i,l,a){const v=St.find(r=>r.id===V)||(V==="protest"?{id:"protest",name:"Organise a Protest",ap:Rt(),color:"#d9534f"}:null);if(!v)return;const n=Rt();if(d<n||!is())return;const c=document.getElementById("ca-confirm-btn");c&&(c.classList.add("disabled"),c.textContent="EXECUTING...");let p;try{if(v.id==="rally")p=await js(I,t.id,s.id,null,a);else if(v.id==="attack")p=await Vs(I,t.id,s.id,ze,Pe,a);else if(v.id==="promise"){const r=_e==="stat"?{statKey:je}:{crisisId:Ce};p=await Ws(I,t.id,s.id,a,_e,r)}else if(v.id==="protest"){if(!le)return;const r=le.grievanceData||{},x=le.demandLabel||"";p=await na(I,t.id,s.id,le.type,r,x,a)}else if(v.id==="take_stance")p=await Dt(I,t.id,s.id,be,he,ue,Ie,a);else if(v.id==="poll_now")p=await Ks(I,t.id,s.id,a,Ae);else if(v.id==="fund_think_tank")p=await Ys(I,t.id,s.id,Z,te,a);else if(v.id==="media_campaign")p=await Xs(I,t.id,s.id,Z,te,a);else if(v.id==="grassroots_movement")p=await Js(I,t.id,s.id,Z,te,a);else if(v.id==="press_conference"){const{deductAP:r}=await $t(async()=>{const{deductAP:o}=await import("./config-BIsh65GI.js");return{deductAP:o}},[]),{getTraitAPModifier:x}=await $t(async()=>{const{getTraitAPModifier:o}=await import("./bills-D49mgE-b.js").then(g=>g.a9);return{getTraitAPModifier:o}},__vite__mapDeps([0,1,2,3])),b=Math.max(1,2+x("press_conference",t,a)),u=await r(I,t.id,b,{reason:"press_conference",detail:"Press Conference",tick:a});if(!u.success)p={success:!1,error:u.error||"Insufficient AP"};else{let o=Math.floor(Math.random()*5)-2;ye?(s.gov_approval||0)>=40&&(o+=2):o+=1;const g=o>=0?"+":"",{error:E}=await I.rpc("adjust_momentum",{p_faction_id:t.id,p_delta:o,p_label:`Press Conference (${g}${o})`,p_tick:a});E&&console.warn("[PressConference] Momentum RPC failed:",E.message),await I.from("campaign_actions").insert({party_id:t.id,nation_id:s.id,action_type:"press_conference",ap_cost:b,tick_performed:a,result:{momentumDelta:o}}),p={success:!0,newAp:u.newAp,headline:"Press Conference",effects:[{label:"Press Coverage",value:`${g}${o}`}],outcomeName:`Press conference — ${g}${o} momentum`}}}else if(v.id==="outreach"){const{deductAP:r}=await $t(async()=>{const{deductAP:o}=await import("./config-BIsh65GI.js");return{deductAP:o}},[]),{getTraitAPModifier:x}=await $t(async()=>{const{getTraitAPModifier:o}=await import("./bills-D49mgE-b.js").then(g=>g.a9);return{getTraitAPModifier:o}},__vite__mapDeps([0,1,2,3])),b=Math.max(1,3+(xt||0)+x("outreach",t,a)),u=await r(I,t.id,b,{reason:"outreach",detail:"Community Outreach",tick:a});if(!u.success)p={success:!1,error:u.error||"Insufficient AP"};else{const{data:o}=await I.from("faction_electoral_standing").select("id, platform_appeal").eq("faction_id",t.id).eq("nation_id",s.id).maybeSingle();if(o){const g=Math.min(100,(Number(o.platform_appeal)||0)+3);await I.from("faction_electoral_standing").update({platform_appeal:g}).eq("id",o.id)}await I.from("campaign_actions").insert({party_id:t.id,nation_id:s.id,action_type:"outreach",ap_cost:b,tick_performed:a,result:{appealBoost:3}}),p={success:!0,newAp:u.newAp,headline:"Community Outreach",effects:[{label:"Appeal",value:"+3"}],outcomeName:"Community outreach — +3 platform appeal"}}}else if(v.id==="pivot"&&(p=await Zs(I,t.id,s.id,Z,te,a),p.success)){const{data:r}=await I.from("factions").select("pivot_count, pivot_last_tick, pivot_cycle_start_tick").eq("id",t.id).single();r&&(t.pivot_count=r.pivot_count,t.pivot_last_tick=r.pivot_last_tick,t.pivot_cycle_start_tick=r.pivot_cycle_start_tick),rt=null}}catch(r){console.error("Campaign action error:",r),ee("Action failed: "+r.message),c&&(c.classList.remove("disabled"),c.textContent=`Confirm — ${n} AP`);return}if(!p||!p.success){ee(p?.message||p?.error||"Action failed."),c&&(c.classList.remove("disabled"),c.textContent=`Confirm — ${n} AP`);return}t.action_points=p.newAp??(t.action_points??0)-n;const _=await De(t.id);if(_!==void 0&&(t.action_points=_),Ve=p,await dt(s,t,me,Xe),v.id==="take_stance"){Lt(t.id,s.id);const r=document.getElementById("ca-stance-portfolio-container");r&&(r.querySelector(".sp-card")?.remove(),At(r,t,s))}}const ke=[{key:"security_freedom",blocKey:"axis_security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",blocKey:"axis_tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"individualism_collectivism",blocKey:"axis_individualism_collectivism",leftLabel:"Individualism",rightLabel:"Collectivism"},{key:"globalism_nationalism",blocKey:"axis_globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"liberty_equality",blocKey:"axis_liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"}],Qa=15,eo=25;async function to(e,t,s,d,i){const l=document.getElementById("electorate-spread-container");if(!l)return;const{data:a}=await I.from("electorate_profile").select("*").eq("nation_id",t.id).maybeSingle();if(!a){l.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No electorate data available.</div>';return}const v={};for(const m of d||[])v[m.faction_id]=m;const n=Number(t.polarization??50),c=Number(t.stability??50),p=Number(t.ethnic_diversity??50),r=5+Math.min(100,Math.max(0,n*.9+(100-c)*.07+p*.03))/100*40,x={};for(const m of ke){const h=Number(a["ideo_mean_"+m.key]??50);x[m.key]={mean:h,zoneVariance:r}}const b=(s||[]).map(m=>{const h=v[m.id]||{},S=m.id===e.id;return{id:m.id,abbr:m.abbreviation||"??",color:m.party_color||"#888",isPlayer:S,ideology:{security_freedom:Number(h.security_freedom??0),tradition_progress:Number(h.tradition_progress??0),liberty_equality:Number(h.liberty_equality??0),globalism_nationalism:Number(h.globalism_nationalism??0),individualism_collectivism:Number(h.individualism_collectivism??0)}}}),u=v[e.id]||{},o={},g=b.filter(m=>!m.isPlayer);for(const m of g)o[m.id]=!0;let E=0;function w(m){const S=(Number(u[m]??0)+100)/2,k=x[m].mean,y=Math.abs(S-k);return y<=Qa?{cls:"es-match-yes",label:"✓ Aligned",gap:y}:y<=eo?{cls:"es-match-part",label:"~ Partial",gap:y}:{cls:"es-match-no",label:"✗ Misaligned",gap:y}}for(const m of ke){const h=w(m.key);h.cls==="es-match-yes"||h.cls,E+=Math.max(0,100-h.gap)}Math.round(E/ke.length);function L(){let m="";for(let f=0;f<ke.length;f++){const C=ke[f],A=x[C.key],O=w(C.key),R=A.mean,T=A.zoneVariance,P=Math.max(0,R-T),N=Math.min(100,R+T)-P,q=n>=76?"deeply divided":n>=51?"polarized":n>=26?"moderately divided":"near centrist";let M;R<45?M=`Electorate is <strong>${q}</strong>, leans ${$(C.leftLabel)} — mean ${Math.round(R)} / 100`:R>55?M=`Electorate is <strong>${q}</strong>, leans ${$(C.rightLabel)} — mean ${Math.round(R)} / 100`:M=`Electorate is <strong>${q}</strong> — mean ${Math.round(R)} / 100`;let D="";for(let j=0;j<b.length;j++){const F=b[j],Me=(F.ideology[C.key]+100)/2,pe=j%2===0?"":"es-below",G=!F.isPlayer&&!o[F.id]?"es-hidden":"";F.isPlayer?D+=`
                    <div class="es-pm ${G}" data-es-party="${F.id}" style="left:${Me}%">
                        <div class="es-pm-bar" style="background:${F.color}"></div>
                        <div class="es-pm-ring" style="border-color:${F.color}"></div>
                        <div class="es-pm-dot" style="background:${F.color}"></div>
                        <div class="es-pm-label" style="color:${F.color}">${$(F.abbr)}</div>
                    </div>`:D+=`
                    <div class="es-pm ${G}" data-es-party="${F.id}" style="left:${Me}%">
                        <div class="es-pm-bar" style="background:${F.color}"></div>
                        <div class="es-pm-dot" style="background:${F.color}"></div>
                        <div class="es-pm-label ${pe}" style="color:${F.color}">${$(F.abbr)}</div>
                    </div>`}let U="";if(O.cls==="es-match-no"){const j=(Number(u[C.key]??0)+100)/2,F=Math.min(j,R),$e=Math.abs(j-R);U=`<div class="es-gap" style="left:${F}%;width:${$e}%">
                    <div class="es-gap-label">${Math.round(O.gap)}pt gap</div>
                </div>`}const{zones:z,zoneForPos:H}=Qt(R,A.zoneVariance);let X="";const re={"radical-left":"rgba(239,68,68,0.10)","moderate-left":"rgba(251,191,36,0.07)",centrist:"rgba(74,222,128,0.08)","moderate-right":"rgba(251,191,36,0.07)","radical-right":"rgba(239,68,68,0.10)"},de={"radical-left":"rgba(239,68,68,0.25)","moderate-left":"rgba(251,191,36,0.18)",centrist:"rgba(74,222,128,0.22)","moderate-right":"rgba(251,191,36,0.18)","radical-right":"rgba(239,68,68,0.25)"},ce={"radical-left":"rgba(239,68,68,0.50)","moderate-left":"rgba(251,191,36,0.45)",centrist:"rgba(74,222,128,0.50)","moderate-right":"rgba(251,191,36,0.45)","radical-right":"rgba(239,68,68,0.50)"},Te=P+N;for(const j of z){if(j.width<1)continue;const F=Math.max(j.left,P),$e=Math.min(j.left+j.width,Te);if($e<=F)continue;const Me=(F-P)/N*100,pe=($e-F)/N*100,G=pe>8;X+=`<div class="es-zone" style="left:${Me}%;width:${pe}%;background:${re[j.id]};border-left:1px solid ${de[j.id]};border-right:1px solid ${de[j.id]}">
                    ${G?`<span class="es-zone-label" style="color:${ce[j.id]}">${j.label}</span>`:""}
                </div>`}const Be=(Number(u[C.key]??0)+100)/2,Ne=H(Be),ct=z.find(j=>j.id===Ne)?.label||"",Je=[];for(const j of b){if(j.isPlayer)continue;const F=(j.ideology[C.key]+100)/2;H(F)===Ne&&Je.push(j)}let He=ct;Ne.endsWith("-left")?He+=" "+C.leftLabel:Ne.endsWith("-right")&&(He+=" "+C.rightLabel);let pt="";if(Je.length>0){const j=Je.map(F=>`<strong style="color:${F.color}">${$(F.abbr)}</strong>`).join(" and ");pt=`<div class="es-split-note">You are <strong>${$(He)}</strong> and currently splitting votes with ${j}</div>`}else pt=`<div class="es-split-note es-split-clear">You are <strong>${$(He)}</strong> — no parties competing in your zone</div>`;const vt=f===ke.length-1;m+=`
            <div class="es-axis-block">
                <div class="es-axis-header">
                    <div class="es-axis-info">
                        <div class="es-axis-name">${$(C.leftLabel)} / ${$(C.rightLabel)}</div>
                        <div class="es-axis-read">${M}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span class="es-zone-badge" data-zone="${Ne}">${ct}</span>
                        <div class="es-match ${O.cls}">${O.label}</div>
                    </div>
                </div>
                <div class="es-spectrum">
                    <div class="es-pole-row">
                        <span class="es-pole">${$(C.leftLabel)}</span>
                        <span class="es-pole">${$(C.rightLabel)}</span>
                    </div>
                    <div class="es-track">
                        <div class="es-center"><div class="es-center-label">Center</div></div>
                        <div class="es-variance" style="left:${P}%;width:${N}%">${X}</div>
                        <div class="es-emean" style="left:${R}%"><div class="es-emean-label">Electorate</div></div>
                        ${U}
                        ${D}
                    </div>
                </div>
                ${pt}
            </div>
            ${vt?"":'<div class="es-div"></div>'}`}const h=b.find(f=>f.isPlayer);let S="";if(h){const f=Le(h.color,.1),C=Le(h.color,.25);S+=`<div class="es-leg-pill" style="color:${h.color};background:${f};border-color:${C}">
                <div class="es-leg-dot" style="background:${h.color}"></div>${$(h.abbr)} <span style="opacity:.55;font-size:7px">YOU</span>
            </div>`}for(const f of g){const C=Le(f.color,.1),A=Le(f.color,.25),O=o[f.id]?"":"es-dimmed";S+=`<div class="es-leg-pill ${O}" data-es-toggle="${f.id}" style="color:${f.color};background:${C};border-color:${A}">
                <div class="es-leg-dot" style="background:${f.color}"></div>${$(f.abbr)}
            </div>`}const k=[];if(n>=65){const f=n>=85?"High":"Elevated";k.push({label:`${f} Polarization`,stat:Math.round(n),color:"var(--dred)",note:"pushing the electorate to the fringes"})}if(c<=35){const f=c<=15?"Very low":"Low";k.push({label:`${f} Stability`,stat:Math.round(c),color:"var(--damber)",note:"pushing the electorate to the fringes"})}p>=65&&k.push({label:"High Ethnic Diversity",stat:Math.round(p),color:"var(--dteal)",note:"widening ideological divisions"}),n<=25&&c>=65&&k.push({label:"Stable & United",stat:null,color:"var(--dgreen)",note:"electorate is ideologically consolidated"});let y="";if(k.length>0){y='<div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 16px;border-bottom:1px solid var(--dborder-hair)">';for(const f of k)y+=`<div style="font-family:var(--dfont-mono);font-size:10px;color:${f.color};display:flex;align-items:center;gap:4px">`,y+=`<span style="font-weight:700">${f.label}</span>`,f.stat!==null&&(y+=`<span style="opacity:0.6">(${f.stat})</span>`),y+=`<span style="color:var(--dtext-3)">— ${f.note}</span>`,y+="</div>";y+="</div>"}l.innerHTML=`
        <div class="es-page-label">Electorate Ideology Spread — <span class="es-nation">${$(t.name)}</span> · Tick ${i}</div>
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
                        <circle cx="8" cy="8" r="5" fill="${h?h.color:"#9b7ec8"}"/>
                        <circle cx="8" cy="8" r="8" fill="none" stroke="${h?h.color:"#9b7ec8"}" stroke-width="1.5" opacity="0.55"/>
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
        </div>`,l.querySelectorAll("[data-es-toggle]").forEach(f=>{f.addEventListener("click",()=>{const C=f.getAttribute("data-es-toggle");o[C]=!o[C],f.classList.toggle("es-dimmed",!o[C]),l.querySelectorAll(`[data-es-party="${C}"]`).forEach(A=>{A.classList.toggle("es-hidden",!o[C])})})})}L()}async function At(e,t,s){const[d,i,l]=await Promise.all([I.from("faction_issue_stance").select("*").eq("faction_id",t.id).eq("nation_id",s.id),I.from("issue_state").select("issue_id, salience, owned_by, pioneer_faction_id").eq("nation_id",s.id),I.from("shard").select("current_tick").eq("name","Alpha Shard").single()]);d.error&&console.error("[Politics] Failed to load stances:",d.error.message),i.error&&console.error("[Politics] Failed to load issue states:",i.error.message);const a=d.data||[],v=i.data||[],n=l.data?.current_tick||0,c={};for(const u of v)c[u.issue_id]=u;const p=oe.MAX_STANCES,_=a.length>=p;let r="";if(a.length===0)r='<div class="sp-empty">No active stances. Take a stance on an issue to build platform appeal.</div>';else for(const u of a){const o=xe[u.issue_id];if(!o)continue;const g=ie.find(T=>T.key===u.axis),E=u.side==="left"?g?.leftLabel:g?.rightLabel,w=u.side==="left"?g?.leftColor:g?.rightColor,L=Number(u.strength??0),m=Number(u.decay_rate??0),h=Number(u.ticks_held??0),S=L<=40,k=L<=20,y=k?"var(--dred)":S?"var(--damber)":"var(--dgreen)",f=c[u.issue_id],C=Number(f?.salience??30),A=u.ideologically_consistent?"":'<span class="sp-badge sp-badge--warn">INCONSISTENT</span>',O=u.is_pioneer?'<span class="sp-badge sp-badge--good">PIONEER</span>':"",R=S?`<span class="sp-badge sp-badge--fade">${k?"EXPIRING":"FADING"}</span>`:"";r+=`
            <div class="sp-row" data-stance-issue="${u.issue_id}">
                <div class="sp-row-top">
                    <div class="sp-row-left">
                        <span class="sp-issue-name">${$(o.label)}</span>
                        <span class="sp-side-pill" style="color:${w};border-color:${w}">${u.intensity} ${E}</span>
                        ${O}${A}${R}
                    </div>
                    <div class="sp-row-right">
                        <span class="sp-salience" title="Issue salience">Salience: ${C.toFixed(0)}</span>
                        <span class="sp-ticks">Held ${h} ticks</span>
                    </div>
                </div>
                <div class="sp-bar-row">
                    <div class="sp-bar-track">
                        <div class="sp-bar-fill" style="width:${L}%;background:${y}"></div>
                    </div>
                    <span class="sp-str-val" style="color:${y}">${L.toFixed(0)}</span>
                    <span class="sp-decay" style="color:var(--dred)">-${m}/tick</span>
                </div>
                <div class="sp-row-actions">
                    <button class="sp-btn sp-btn--reinforce" data-stance-action="reinforce" data-stance-issue="${u.issue_id}" data-stance-axis="${u.axis}" data-stance-side="${u.side}" data-stance-intensity="${u.intensity}">Reinforce</button>
                    <button class="sp-btn sp-btn--modify" data-stance-action="modify" data-stance-issue="${u.issue_id}">Modify</button>
                </div>
            </div>`}const x=`
    <div class="sp-card" style="margin-top:20px;max-width:780px;">
        <div class="sp-card-header">
            <div class="sp-card-title">Active Stance Portfolio</div>
            <div class="sp-card-count">${a.length} / ${p}</div>
        </div>
        <div class="sp-stances">${r}</div>
        <div class="sp-footer">
            <button class="sp-btn sp-btn--new${_?" sp-btn--disabled":""}" id="sp-new-stance-btn" ${_?'disabled title="Maximum stances reached (5/5)"':""}>
                + New Stance${_?" (5/5)":""}
            </button>
            <span class="sp-footer-hint">${oe.AP_COST} AP · ${oe.COOLDOWN_WINDOW}-tick cooldown</span>
        </div>
    </div>`;e.insertAdjacentHTML("beforeend",x),e.querySelectorAll('[data-stance-action="reinforce"]').forEach(u=>{u.addEventListener("click",async()=>{if((t.action_points||0)<oe.AP_COST){ee(`Need ${oe.AP_COST} AP to reinforce stance.`);return}const o=u.dataset.stanceIssue,g=u.dataset.stanceAxis,E=u.dataset.stanceSide,w=u.dataset.stanceIntensity;u.disabled=!0,u.textContent="Reinforcing...";try{const L=await Dt(I,t.id,s.id,o,g,E,w,n);if(L.success){L.newAp!=null&&(t.action_points=L.newAp,W&&(W.action_points=L.newAp));const m=await De(t.id);m!==void 0&&(t.action_points=m,W&&(W.action_points=m)),e.querySelector(".sp-card")?.remove(),await At(e,t,s),Lt(t.id,s.id)}else ee(L.message||"Failed to reinforce stance."),u.disabled=!1,u.textContent="Reinforce"}catch(L){ee("Reinforce failed: "+L.message),u.disabled=!1,u.textContent="Reinforce"}})}),e.querySelectorAll('[data-stance-action="modify"]').forEach(u=>{u.addEventListener("click",()=>{Vt(t,s,n,c,a,u.dataset.stanceIssue)})});const b=document.getElementById("sp-new-stance-btn");b&&!_&&b.addEventListener("click",()=>{Vt(t,s,n,c,a,null)})}function Vt(e,t,s,d,i,l){document.getElementById("stance-modal-overlay")?.remove();const a=new Set(i.map(o=>o.issue_id)),v=i.length>=oe.MAX_STANCES,n=Jt.map(o=>({id:o,def:xe[o],salience:Number(d[o]?.salience??30),hasStance:a.has(o)})).sort((o,g)=>g.salience-o.salience);let c="";for(const o of n){const g=!o.hasStance&&v,E=o.id===l,w=o.salience>=60?"var(--dred)":o.salience>=40?"var(--damber)":"var(--dtext-3)",L=o.def.axes.map(m=>{const h=ie.find(S=>S.key===m);return h?`${h.leftLabel}/${h.rightLabel}`:m}).join(", ");c+=`
        <div class="sm-issue${E?" sm-issue--selected":""}${g?" sm-issue--disabled":""}"
             data-sm-issue="${o.id}" ${g?"":'role="button" tabindex="0"'}>
            <div class="sm-issue-top">
                <span class="sm-issue-name">${$(o.def.label)}</span>
                ${o.hasStance?'<span class="sm-issue-badge">HAS STANCE</span>':""}
            </div>
            <div class="sm-issue-meta">
                <span class="sm-issue-salience" style="color:${w}">Salience: ${o.salience.toFixed(0)}</span>
                <span class="sm-issue-axes">${L}</span>
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
                <button class="sp-btn sp-btn--new" id="sm-confirm-btn" disabled>Confirm Stance (${oe.AP_COST} AP)</button>
            </div>
        </div>
    </div>`;document.body.insertAdjacentHTML("beforeend",p);let _=l,r=null,x=null,b="moderate";function u(){const o=document.getElementById("sm-config-area"),g=document.getElementById("sm-footer");if(!o||!_){o&&(o.innerHTML=""),g&&(g.style.display="none");return}const E=xe[_];if(!E)return;E.axes.length===1&&!r&&(r=E.axes[0]);let w='<div class="sm-section-label" style="margin-top:14px;">Choose Axis</div><div class="sm-axis-list">';for(const k of E.axes){const y=ie.find(C=>C.key===k);if(!y)continue;w+=`<div class="sm-axis-opt${k===r?" sm-axis-opt--selected":""}" data-sm-axis="${k}">
                <span style="color:${y.leftColor}">${y.leftLabel}</span> / <span style="color:${y.rightColor}">${y.rightLabel}</span>
            </div>`}w+="</div>";let L="";if(r){const k=ie.find(y=>y.key===r);L=`<div class="sm-section-label" style="margin-top:14px;">Choose Side</div><div class="sm-side-list">
                <div class="sm-side-opt${x==="left"?" sm-side-opt--selected":""}" data-sm-side="left" style="border-color:${k.leftColor}">
                    <span style="color:${k.leftColor};font-weight:700">${k.leftLabel}</span>
                </div>
                <div class="sm-side-opt${x==="right"?" sm-side-opt--selected":""}" data-sm-side="right" style="border-color:${k.rightColor}">
                    <span style="color:${k.rightColor};font-weight:700">${k.rightLabel}</span>
                </div>
            </div>`}let m="";if(x){const k=ie.find(C=>C.key===r),y=x==="left"?k?.leftLabel??"Left":k?.rightLabel??"Right",f=x==="left"?k?.leftColor??"#ccc":k?.rightColor??"#ccc";m='<div class="sm-section-label" style="margin-top:14px;">Intensity</div><div class="sm-intensity-list">';for(const[C,A]of Object.entries(oe.INTENSITY))m+=`<div class="sm-int-opt${C===b?" sm-int-opt--selected":""}" data-sm-intensity="${C}">
                    <span class="sm-int-name">${C}</span>
                    <span class="sm-int-meta">Strength ${A.strength} · Decay ${A.decay_rate}/tick</span>
                    <span class="sm-int-meta" style="color:${f};font-weight:600">+${A.ideology_shift} ${y}</span>
                </div>`;if(m+="</div>",b){const C=oe.INTENSITY[b],A=xe[_];m+=`<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                    <div style="color:var(--dtext-1);font-weight:600;margin-bottom:3px">${b.toUpperCase()} ${y.toUpperCase()} on ${A?.label||""}</div>
                    <div style="color:${f};font-weight:700">Ideology: +${C.ideology_shift} ${y}</div>
                    <div style="color:var(--dtext-3);margin-top:2px">Strength: ${C.strength} · Decay: -${C.decay_rate}/tick</div>
                </div>`}}o.innerHTML=w+L+m;const h=_&&r&&x&&b;g.style.display=h?"flex":"none";const S=document.getElementById("sm-confirm-btn");S&&(S.disabled=!h),o.querySelectorAll("[data-sm-axis]").forEach(k=>{k.addEventListener("click",()=>{r=k.dataset.smAxis,x=null,u()})}),o.querySelectorAll("[data-sm-side]").forEach(k=>{k.addEventListener("click",()=>{x=k.dataset.smSide,u()})}),o.querySelectorAll("[data-sm-intensity]").forEach(k=>{k.addEventListener("click",()=>{b=k.dataset.smIntensity,u()})})}document.querySelectorAll("[data-sm-issue]").forEach(o=>{o.classList.contains("sm-issue--disabled")||o.addEventListener("click",()=>{document.querySelectorAll(".sm-issue").forEach(g=>g.classList.remove("sm-issue--selected")),o.classList.add("sm-issue--selected"),_=o.dataset.smIssue,r=null,x=null,u()})}),document.getElementById("sm-close-btn")?.addEventListener("click",()=>{document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("stance-modal-overlay")?.addEventListener("click",o=>{o.target.id==="stance-modal-overlay"&&document.getElementById("stance-modal-overlay")?.remove()}),document.getElementById("sm-confirm-btn")?.addEventListener("click",async()=>{const o=document.getElementById("sm-confirm-btn");if(!o||o.disabled)return;o.disabled=!0,o.textContent="Taking stance...";const g=await Dt(I,e.id,t.id,_,r,x,b,s);if(g.success){g.newAp!=null&&(e.action_points=g.newAp,W&&(W.action_points=g.newAp));const E=await De(e.id);E!==void 0&&(e.action_points=E,W&&(W.action_points=E)),document.getElementById("stance-modal-overlay")?.remove();const w=document.getElementById("electorate-spread-container");w&&(w.querySelector(".sp-card")?.remove(),await At(w,e,t)),Lt(e.id,t.id)}else ee(g.message||"Failed to take stance."),o.disabled=!1,o.textContent=`Confirm Stance (${oe.AP_COST} AP)`}),l&&u()}async function Lt(e,t){const s=document.getElementById("stance-summary-strip");if(!s)return;const{data:d}=await I.from("faction_issue_stance").select("issue_id, axis, side, intensity, strength, decay_rate, ticks_held, is_pioneer, ideologically_consistent").eq("faction_id",e).eq("nation_id",t),i=oe.MAX_STANCES;if(!d||d.length===0){s.innerHTML=`<div style="color:var(--dtext-3);font-size:12px;font-family:var(--dfont-ui);padding:4px 0;">
            No active stances. Take a stance in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab.
        </div>`;return}let l="";for(const a of d){const v=xe[a.issue_id];if(!v)continue;const n=ie.find(L=>L.key===a.axis),c=a.side==="left"?n?.leftLabel:n?.rightLabel,p=a.side==="left"?n?.leftColor:n?.rightColor,_=Number(a.strength??0),r=Number(a.decay_rate??0),x=Number(a.ticks_held??0),b=_<=20,u=_<=40,o=b?"var(--dred)":u?"var(--damber)":"var(--dgreen)",g=a.is_pioneer?'<span style="font-size:9px;color:#4ade80;font-weight:700;margin-left:4px">PIONEER</span>':"",E=a.ideologically_consistent===!1?'<span style="font-size:9px;color:#f97316;font-weight:700;margin-left:4px">INCONSISTENT</span>':"",w=u?`<span style="font-size:9px;color:${o};font-weight:700;margin-left:4px">${b?"EXPIRING":"FADING"}</span>`:"";l+=`
        <div style="padding:6px 0;${l?"border-top:1px solid var(--dborder-0);":""}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:2px">
                    <span style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${$(v.label)}</span>
                    <span style="font-size:10px;padding:1px 5px;border:1px solid ${p};border-radius:3px;color:${p};margin-left:4px">${a.intensity} ${c}</span>
                    ${g}${E}${w}
                </div>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3)">Held ${x}t</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;height:6px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">
                    <div style="width:${_}%;height:100%;background:${o};border-radius:2px"></div>
                </div>
                <span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${o};width:28px;text-align:right">${_.toFixed(0)}</span>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);width:40px;text-align:right">-${r}/t</span>
            </div>
        </div>`}s.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-family:var(--dfont-mono);font-size:11px;color:var(--dtext-2)">${d.length} / ${i}</span>
        </div>
        ${l}
        <div style="margin-top:8px;font-size:10px;color:var(--dtext-3);font-family:var(--dfont-ui)">Manage stances in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab</div>`}const so=[{key:"security_freedom",leftLabel:"Security",rightLabel:"Freedom"},{key:"tradition_progress",leftLabel:"Tradition",rightLabel:"Progress"},{key:"liberty_equality",leftLabel:"Liberty",rightLabel:"Equality"},{key:"globalism_nationalism",leftLabel:"Globalism",rightLabel:"Nationalism"},{key:"individualism_collectivism",leftLabel:"Individual",rightLabel:"Collectivism"}];async function ao(e,t,s,d,i,l,a){const v=document.getElementById("other-parties-container");if(!v)return;const n=(s||[]).filter(m=>m.id!==e.id),c=n.map(m=>m.id);if(n.length===0){v.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No rival parties found.</div>';return}const p={};for(const m of d||[])p[m.faction_id]=m;const{data:_}=await I.from("administrations").select("stats_at_start, started_at_tick").eq("nation_id",t.id).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle();let r=0;if(_?.stats_at_start){let m=0,h=0;for(const y of Yt){const f=Xt(y);if(f===0)continue;const C=Number(_.stats_at_start[y]??0),O=Number(t[y]??0)-C;O!==0&&(m+=O*f,h++)}h>0&&(r=m/h);const S=a-(_.started_at_tick||a),k=Math.floor(S/12);r>0&&(r*=Math.pow(.95,k))}const{data:x}=await I.from("factions").select("id, leader_first_name, leader_last_name, leader_age, founded_tick, ideology_value_1, ideology_value_2").in("id",c),b={};for(const m of x||[])b[m.id]=m;const u=i&&i.party_ids?i.party_ids:[],o=i?i.lead_party_id:null,g=n.map(m=>{const h=b[m.id]||{},S=p[m.id]||{},k=h.leader_first_name&&h.leader_last_name?h.leader_first_name+" "+h.leader_last_name:"Vacant",y=h.leader_age||null,f=Number(m.national_vote_share||0);let C="opposition";u.includes(m.id)&&(C=m.id===o?"governing_head":"governing_junior");const A=C.startsWith("governing"),O=Math.round((A?r:-r)*10);return{id:m.id,name:m.faction_name||"Unknown",abbreviation:m.abbreviation||"??",color:m.party_color||"#888",customLogoUrl:m.custom_logo_url||null,partyLogo:m.party_logo||null,description:m.party_description||"",status:C,foundedTick:h.founded_tick,leaderName:k,leaderAge:y,seats:m.seats||0,totalSeats:l,voteShare:f,govScore:O,ideology:{security_freedom:S.security_freedom??0,tradition_progress:S.tradition_progress??0,liberty_equality:S.liberty_equality??0,globalism_nationalism:S.globalism_nationalism??0,individualism_collectivism:S.individualism_collectivism??0},stances:[]}});let E="seats";const w={seats:(m,h)=>h.seats-m.seats,vote_share:(m,h)=>h.voteShare-m.voteShare,approval:(m,h)=>h.govScore-m.govScore,alignment:(m,h)=>{const S=Object.values(m.ideology).reduce((y,f)=>y+Math.abs(f),0);return Object.values(h.ideology).reduce((y,f)=>y+Math.abs(f),0)-S}};function L(){const h=[...g].sort(w[E]).map(S=>oo(S)).join("");v.innerHTML=`
        <div class="op-top">
            <div class="op-top-left">
                <div class="op-title">Rival Parties — ${$(t.name)}</div>
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
        <div class="op-grid">${h}</div>`,v.querySelectorAll(".op-sort-btn").forEach(S=>{S.addEventListener("click",()=>{E=S.getAttribute("data-op-sort"),L()})})}L()}function oo(e,t){const s=e.color,d=Le(s,.12),i=Le(s,.35),l=Le(s,.5),a=Le(s,.2),v=Le(s,.06),n=zt({customLogoUrl:e.customLogoUrl,iconKey:e.partyLogo,size:32,color:s});let c,p;e.status==="governing_head"?(c="GOVERNING — HEAD",p="op-badge-green"):e.status==="governing_junior"?(c="GOVERNING — JUNIOR",p="op-badge-green"):(c="OPPOSITION",p="op-badge-red");const _=e.foundedTick!=null?Se(e.foundedTick):null,r=_?`<span class="op-badge op-badge-party" style="color:${s};border-color:${i};font-size:12px">Est. ${$(_)}</span>`:"",x=`<span class="op-badge op-badge-party" style="color:${s};border-color:${i};font-size:12px">Leader: ${$(e.leaderName)}${e.leaderAge?" ("+e.leaderAge+")":""}</span>`,b=e.description?`<div class="op-desc" style="font-size:13px;line-height:1.6">${$(e.description)}</div>`:"",u=e.govScore>2?"var(--dgreen)":e.govScore>0||e.govScore>-2?"var(--damber)":"var(--dred)",o=e.govScore>0?"+":"",g=e.status.startsWith("governing")?"GOV":"OPP";let E="";for(const y of so){const f=e.ideology[y.key]??0,C=(f+100)/2;let A;f>0?A=`left:50%;width:${f/2}%;background:${l}`:f<0?A=`right:50%;width:${Math.abs(f)/2}%;background:${l}`:A=`left:50%;width:0%;background:${l}`,E+=`
        <div class="op-axis">
            <div class="op-axis-poles"><span>${y.leftLabel}</span><span>${y.rightLabel}</span></div>
            <div class="op-axis-track">
                <div class="op-axis-center"></div>
                <div class="op-axis-fill" style="${A}"></div>
                <div class="op-axis-dot" style="left:${C}%;background:${a};border-color:${s}"></div>
            </div>
        </div>`}const w=Object.values(e.ideology).filter(y=>Math.abs(y)>=50).length;let L,m,h;return w>=4?(L="var(--dgreen)",m="Strong Conviction",h=`${w} strong positions. Consistent ideological identity across axes.`):w<=1?(L="var(--dred)",m="Weak Conviction",h=`Only ${w} strong position${w===1?"":"s"}. Centrist on most axes — voters may not trust their platform.`):(L="var(--dteal)",m="Established Party",h=`${w} strong positions. Moderate ideological clarity.`),`
    <div class="op-card" style="background:linear-gradient(135deg, ${v} 0%, var(--dbg-2) 40%);border-color:${i}">
        <div class="op-card-hdr" style="border-bottom-color:${i}">
            <div class="op-logo-wrap" style="background:${d};border:1px solid ${i};border-radius:6px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${n}</div>
            <div class="op-hdr-info">
                <div class="op-name" style="color:${s}">${$(e.name)}</div>
                <div class="op-meta">
                    <span class="op-badge ${p}">${c}</span>
                    ${r}
                    ${x}
                </div>
            </div>
        </div>
        ${b}
        <div class="op-body">
            <div class="op-col-left">
                <div class="op-sec-label">Party Stats</div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Seats</span>
                    <span class="op-sr-val" style="color:${s}">${e.seats} <span style="color:var(--dtext-3);font-size:9px;font-weight:400">/ ${e.totalSeats}</span></span>
                </div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Governance <span style="font-size:8px;color:var(--dtext-3)">${g}</span></span>
                    <span class="op-sr-val" style="color:${u}">${o}${e.govScore}</span>
                </div>
                <div class="op-rule"></div>
                <div class="op-sec-label">Ideology Axes</div>
                ${E}
                <div class="op-insight" style="border-left-color:${L}">
                    <div class="op-insight-label" style="color:${L}">${m}</div>
                    <div class="op-insight-body">${h}</div>
                </div>
            </div>
            <div class="op-col-right">
                <div class="op-sec-label">Active Issue Stances</div>
                <div style="color:var(--dtxt-dim);font-size:10px;font-style:italic;padding:8px 0;">Rival stance tracking coming soon.</div>
                
            </div>
        </div>
    </div>`}function Le(e,t){const s=e.replace("#",""),d=parseInt(s.substring(0,2),16)||0,i=parseInt(s.substring(2,4),16)||0,l=parseInt(s.substring(4,6),16)||0;return`rgba(${d},${i},${l},${t})`}async function io(e,t,s,d,i,l,a,v,n,c,p){const _=document.getElementById("elections-container");if(_)try{const r=t?.stats_at_start,x=a-(t?.started_at_tick||a),b=v.includes("Governing")||v.includes("Lead")||v==="Strongman";let u=[],o=0,g=0;if(r){for(const B of Yt){const K=Xt(B);if(K===0)continue;const se=Number(r[B]??0),J=Number(e[B]??0),ve=J-se;if(ve===0)continue;const Ee=ve*K;u.push({key:B,start:se,now:J,raw:ve,signed:Ee,dir:K}),o+=Ee,g++}g>0&&(o=o/g)}const E=Math.floor(x/12),w=o>0?Math.pow(.95,E):1,m=o*w*10;u.sort((B,K)=>K.signed-B.signed);const h=m>5?"var(--dgreen)":m>0||m>-5?"var(--damber)":"var(--dred)",S=m>0?"+":"",k=b?m:-m,y=k>5?"var(--dgreen)":k>0||k>-5?"var(--damber)":"var(--dred)",f=k>0?"+":"",C=u.map(B=>{const K=B.signed>0?"var(--dgreen)":"var(--dred)",se=B.signed>0?"▲":"▼",J=Qs(B.key);return`<div class="elec-stat-row">
            <span class="elec-stat-name">${$(J)}</span>
            <span class="elec-stat-start">${B.start.toFixed(1)}</span>
            <span class="elec-stat-arrow" style="color:${K}">${se}</span>
            <span class="elec-stat-now">${B.now.toFixed(1)}</span>
            <span class="elec-stat-delta" style="color:${K}">${B.raw>0?"+":""}${B.raw.toFixed(1)}</span>
        </div>`}).join(""),A=r?u.length===0?'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No stat changes recorded yet.</div>':"":'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No administration data available.</div>',O=E>0&&o>0?`<div class="elec-decay-note">Incumbency decay: ${((1-w)*100).toFixed(1)}% reduction (${E} cycle${E>1?"s":""})</div>`:"",R=`
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Governance</span>
        </div>
        <div class="elec-box-body">
            <div class="elec-score-row">
                <div class="elec-score-block">
                    <div class="elec-score-label">${b?"Gov. Score":"National Score"}</div>
                    <div class="elec-score-value" style="color:${h}">${S}${Math.round(m)}</div>
                </div>
                ${b?"":`<div class="elec-score-block">
                    <div class="elec-score-label">Your Impact (Opposition)</div>
                    <div class="elec-score-value" style="color:${y}">${f}${Math.round(k)}</div>
                </div>`}
            </div>
            ${O}
            <div class="elec-admin-info">
                <span>${$(t?.admin_name||"Government")}</span>
                <span class="elec-ticks">${x} tick${x!==1?"s":""} in power</span>
            </div>
            ${b?(()=>{const B=Number(e?.gov_approval??50),K=Math.max(-1,Math.min(1,(B-35)/30)),se=Math.max(0,1-x/20),J=Math.round(.08*K*se*1e3)/10,ve=J>0?"var(--dgreen)":J<0?"var(--dred)":"var(--dtext-3)",Ee=J>0?"+":"";return`<div class="elec-incumbency-row" style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:rgba(255,255,255,0.03);border-radius:4px;font-size:11px;">
                    <span style="color:var(--dtext-3)">Incumbency Turnout Modifier</span>
                    <span style="color:${ve};font-weight:600">${Ee}${J.toFixed(1)}%</span>
                </div>`})():""}
            <div class="elec-stat-header">
                <span class="elec-stat-name">Stat</span>
                <span class="elec-stat-start">Start</span>
                <span class="elec-stat-arrow"></span>
                <span class="elec-stat-now">Now</span>
                <span class="elec-stat-delta">Delta</span>
            </div>
            <div class="elec-stat-list">
                ${A||C}
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
    </div>`,P=Number(d.momentum??0),q=(P*.08).toFixed(1),M=P>=60?"var(--dgreen)":P>=30?"var(--damber)":"var(--dred)",D=Math.min(100,Math.max(0,P)),U=n?.election_tick||0,z=U>a?U-a:null,H=Array.isArray(d.momentum_log)?d.momentum_log:[],X=H.length>0?H.slice(0,30).map(B=>{const K=a-(B.tick||0),se=B.delta>0?"var(--dgreen)":"var(--dred)",J=B.delta>0?"+":"";return`<div class="elec-mom-log-row">
                <span class="elec-mom-log-label">${$(B.label||"Event")}</span>
                <span class="elec-mom-log-delta" style="color:${se}">${J}${B.delta}</span>
                <span class="elec-mom-log-ago">${K}t ago</span>
            </div>`}).join(""):'<div style="color:var(--dtext-3);font-size:11px;padding:10px">No momentum events yet.</div>',re=`
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
                <div class="elec-mom-bar" style="width:${D}%;background:${M}"></div>
            </div>
            <div class="elec-mom-decay">Decays 8%/tick — currently losing ${q}/tick</div>
            <div class="elec-mom-log-header">Recent Activity</div>
            <div class="elec-mom-log">
                ${X}
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
    </div>`,{data:ce,error:Te}=await I.from("electorate_profile").select("*").eq("nation_id",e.id).maybeSingle();Te&&console.error("[Elections] electorate_profile fetch failed:",Te);const Be={};for(const B of l||[])Be[B.faction_id]=B;const Ne=Be[d.id]||{},ct=Number(e.polarization??50),Je=Number(e.stability??50),He=Number(e.ethnic_diversity??50),vt=5+Math.min(100,Math.max(0,ct*.9+(100-Je)*.07+He*.03))/100*40;let j="",F=0;if(ce)for(const B of ke){const se=(Number(Ne[B.key]??0)+100)/2,J=Number(ce["ideo_mean_"+B.key]??50),ve=vt,{zones:Ee,zoneForPos:It}=Qt(J,ve),ut=It(se),ds=ut.includes("left")?B.leftLabel:ut.includes("right")?B.rightLabel:"",cs=ut==="centrist"?"Centrist":ut.includes("moderate")?"Moderate":"Radical",ps=ut==="centrist"?"Centrist":`${cs} ${ds}`,_t=ea(se,J,ve),vs=(_t*100).toFixed(1);F+=_t;const gt=[...Ee].sort((ge,yt)=>yt.width-ge.width)[0],ms=gt.id.includes("left")?B.leftLabel:gt.id.includes("right")?B.rightLabel:"",fs=gt.id==="centrist"?"Centrist":gt.id.includes("moderate")?"Moderate":"Radical",us=gt.id==="centrist"?"Centrist":`${fs} ${ms}`,gs=_t>=.6?"var(--dgreen)":_t>=.3?"var(--damber)":"var(--dred)",ys=(Number(ce["salience_"+B.key]??.2)*100).toFixed(0),Ze=Math.max(0,J-ve),Ht=Math.min(100,J+ve),Fe=Ht-Ze,bs={"radical-left":"rgba(239,68,68,0.10)","moderate-left":"rgba(251,191,36,0.07)",centrist:"rgba(74,222,128,0.08)","moderate-right":"rgba(251,191,36,0.07)","radical-right":"rgba(239,68,68,0.10)"},qt={"radical-left":"rgba(239,68,68,0.25)","moderate-left":"rgba(251,191,36,0.18)",centrist:"rgba(74,222,128,0.22)","moderate-right":"rgba(251,191,36,0.18)","radical-right":"rgba(239,68,68,0.25)"},hs={"radical-left":"rgba(239,68,68,0.50)","moderate-left":"rgba(251,191,36,0.45)",centrist:"rgba(74,222,128,0.50)","moderate-right":"rgba(251,191,36,0.45)","radical-right":"rgba(239,68,68,0.50)"};let Ft="";for(const ge of Ee){if(ge.width<1)continue;const yt=Math.max(ge.left,Ze),Gt=Math.min(ge.left+ge.width,Ht);if(Gt<=yt)continue;const $s=(yt-Ze)/Fe*100,Ut=(Gt-yt)/Fe*100,ws=Ut>8;Ft+=`<div class="elec-ideo-zone" style="left:${$s}%;width:${Ut}%;background:${bs[ge.id]};border-left:1px solid ${qt[ge.id]};border-right:1px solid ${qt[ge.id]}">
                    ${ws?`<span class="elec-ideo-zone-label" style="color:${hs[ge.id]}">${ge.label}</span>`:""}
                </div>`}const xs=Fe>0?(se-Ze)/Fe*100:50,_s=Fe>0?(J-Ze)/Fe*100:50;j+=`
            <div class="elec-ideo-axis">
                <div class="elec-ideo-axis-header">
                    <span class="elec-ideo-axis-name">${$(B.leftLabel)} / ${$(B.rightLabel)}</span>
                    <span class="elec-ideo-salience">Salience: ${ys}%</span>
                </div>
                <div class="elec-ideo-bar-wrap">
                    <div class="elec-ideo-bar-labels">
                        <span>${$(B.leftLabel)}</span>
                        <span>${$(B.rightLabel)}</span>
                    </div>
                    <div class="elec-ideo-bar-track">
                        <div class="elec-ideo-var-band" style="left:${Ze}%;width:${Fe}%">
                            ${Ft}
                            <div class="elec-ideo-mean-marker" style="left:${_s}%"></div>
                            <div class="elec-ideo-player-marker" style="left:${xs}%"></div>
                        </div>
                    </div>
                    <div class="elec-ideo-bar-labels" style="margin-bottom:12px">
                        <span></span>
                    </div>
                </div>
                <div class="elec-ideo-details">
                    <span class="elec-ideo-position">Your Position: <strong>${$(ps)}</strong></span>
                    <span class="elec-ideo-capture" style="color:${gs}">Voter Capture: <strong>${vs}%</strong></span>
                </div>
                <div class="elec-ideo-voters">Most voters are <strong>${$(us)}</strong></div>
            </div>`}const $e=ce?(F/ke.length*100).toFixed(1):"—",pe=`
    <div class="elec-box elec-box--wide">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--purple"></div>
            <span class="elec-box-title">Ideology</span>
            <span class="elec-ideo-avg">Avg. Capture: <strong style="color:${F/ke.length>=.6?"var(--dgreen)":F/ke.length>=.3?"var(--damber)":"var(--dred)"}">${$e}%</strong></span>
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
    </div>`,ae={liberty_equality:"Liberty / Equality",tradition_progress:"Tradition / Progress",security_freedom:"Security / Freedom",globalism_nationalism:"Globalism / Nationalism",individualism_collectivism:"Individualism / Collectivism"},fe=p||0,qe=(i||[]).reduce((B,K)=>B+(K.seats||0),0),ls=qe>0?fe/qe:0,mt=(c||[]).filter(B=>B.is_active!==!1);let ft="";if(mt.length===0){const B=(ls*100).toFixed(0);ft=`<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:16px 4px;text-align:center">
            No active caucuses.<br>Caucuses form when your party holds <strong>50%+</strong> of parliamentary seats.<br>
            <span style="margin-top:6px;display:inline-block">You currently hold <strong>${fe}</strong> / ${qe} seats (${B}%).</span>
        </div>`}else{const B=mt.reduce((K,se)=>K+Math.round(fe*se.seat_share),0);for(const K of mt){const se=Math.round(fe*K.seat_share),J=Number(K.relationship_score??50),ve=J>=60?"var(--dgreen)":J>=30?"var(--damber)":"var(--dred)",Ee=K.wing_end==="left"?"◂":"▸",It=J<30?'<span style="font-family:var(--dfont-mono);font-size:9px;color:var(--dred);font-weight:700;letter-spacing:0.5px;margin-left:4px">VOLATILE</span>':"";ft+=`
            <div style="padding:8px 0;border-bottom:1px solid var(--dborder-1)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${$(K.name)}</div>
                        <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:2px">${Ee} ${ae[K.dominant_axis]||K.dominant_axis}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:var(--dtext-0)">${se} seat${se!==1?"s":""}</div>
                        <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
                            <div style="width:50px;height:5px;background:var(--dborder-1);border-radius:3px;overflow:hidden">
                                <div style="width:${J}%;height:100%;background:${ve};border-radius:3px;transition:width 0.3s"></div>
                            </div>
                            <span style="font-family:var(--dfont-mono);font-size:10px;color:${ve}">${J}</span>
                            ${It}
                        </div>
                    </div>
                </div>
            </div>`}ft=`<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);margin-bottom:6px;display:flex;justify-content:space-between">
            <span>${mt.length} active caucus${mt.length!==1?"es":""}</span>
            <span>${B} / ${fe} seats</span>
        </div>`+ft}const rs=`
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
                ${ft}
            </div>
        </div>
    </div>`;_.innerHTML=`
    <div class="elec-page">
        <div class="elec-row">
            ${R}
            ${T}
            ${re}
            ${de}
        </div>
        <div class="elec-row" style="margin-top:20px">
            ${pe}
            ${G}
            ${rs}
        </div>
    </div>`}catch(r){console.error("[Elections Tab] Render error:",r),_.innerHTML='<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">Failed to load election data. Please refresh.</div>'}}
