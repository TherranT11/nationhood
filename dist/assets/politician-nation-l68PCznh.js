import{_ as $}from"./supabase-client-BXEzLDpS.js";import{b as L}from"./politician-topbar-5igJjSS-.js";import{C as O,g as T,s as M,b as S}from"./utils-CzgKGX6o.js";import{a as H,C as F}from"./committees-GSA3PyLy.js";import"./factions-C2s734Ze.js";const E={green:"#4ec98a",teal:"#5aafa5",amber:"#c8a64e",red:"#d97070",deepRed:"#a85050"},j=[{min:81,label:"Firm",color:E.green},{min:61,label:"Strained",color:E.teal},{min:41,label:"Unrest",color:E.amber},{min:21,label:"Crisis",color:E.red},{min:0,label:"Collapse",color:E.deepRed}],q=[{min:81,label:"Free",color:E.green},{min:61,label:"Permissive",color:E.teal},{min:41,label:"Restricted",color:E.red},{min:21,label:"Repressed",color:E.deepRed},{min:0,label:"Closed",color:E.deepRed}];function V(t,e){for(const i of t)if(e>=i.min)return i;return t[t.length-1]}function v(t){const e=document.createElement("div");return e.textContent=t??"",e.innerHTML}function B(t){const e=t&&(Array.isArray(t.factions)?t.factions[0]:t.factions),i=t?.minister_first_name||e?.leader_first_name||"",n=t?.minister_last_name||e?.leader_last_name||"";return{name:`${i} ${n}`.trim(),partyName:e?.faction_name||""}}function P(t,e){const i=B(t),n=e?`${e.leader_first_name||""} ${e.leader_last_name||""}`.trim():"";return{name:i.name||n,partyName:i.partyName||e?.faction_name||""}}function Y(t,e,i){if(t.government_type==="Presidential")return;const{name:n,partyName:o}=P(e,i);if(!n)return;const s=document.getElementById("nc-hog"),a=document.getElementById("nc-hog-sub");s&&(s.textContent=`PM ${n}`),a&&(a.textContent=o?`${o}-led government`:"Prime Minister")}function G(t){const e=Number(t)||0;return e>=1e6?(e/1e6).toFixed(1).replace(/\.0$/,"")+" million":e>=1e3?(e/1e3).toFixed(1).replace(/\.0$/,"")+" thousand":String(e)}function D(t){return t?String(t).toUpperCase():""}function U(t,e,i){if(t&&t.includes(" ")){const n=t.lastIndexOf(" ");return{prefix:t.slice(0,n+1),name:t.slice(n+1)}}return i==="Absolute Monarchy"?{prefix:"Kingdom of ",name:e||""}:i==="Presidential"||i==="Semi-Presidential"?{prefix:"Republic of ",name:e||""}:{prefix:"",name:e||t||""}}function K(t,e){const i=[];return t.government_type&&i.push(D(t.government_type)),e?.founded_year&&i.push(`Founded ${e.founded_year}`),i}async function z(){let t=null;try{t=await L("nation")}catch(a){console.error("politician-nation: bootstrap failed",a),document.getElementById("loading").textContent="Failed to load. Please reload the page.";return}if(!t)return;const e=t.nation;let i=null;if(t.faction?.nation_id)try{const{data:a,error:r}=await $.from("ministries").select("minister_first_name, minister_last_name, party_id, factions(faction_name, leader_first_name, leader_last_name)").eq("nation_id",t.faction.nation_id).eq("ministry_key","prime_minister").eq("is_active",!0).maybeSingle();r||(i=a)}catch(a){console.warn("politician-nation: PM ministry fetch failed",a)}if(!e){document.getElementById("loading").textContent="No nation associated with this politician.";return}st(e,i),Z();try{const{error:a}=await $.rpc("resolve_due_admission_votes",{p_nation_id:e.id});a&&console.warn("politician-nation: resolve_due_admission_votes failed",a)}catch(a){console.warn("politician-nation: resolve_due_admission_votes threw",a)}const n=t.faction?.id||null;let o=[];if(n){const{data:a,error:r}=await $.from("committee_members").select("committee_id, committee:committees!committee_id(committee_key)").eq("politician_faction_id",n);r&&console.warn("politician-nation: committee_members fetch failed",r),o=a||[]}let s=new Set;if(n){const{data:a,error:r}=await $.from("committee_admission_votes").select("committee_id, committee:committees!committee_id(committee_key)").eq("applicant_faction_id",n).eq("status","active");r&&console.warn("politician-nation: admission_votes fetch failed",r),s=new Set((a||[]).map(c=>c.committee?.committee_key).filter(Boolean))}tt(t.faction?.politician_office||null,o,s);try{await at(e.id,Number(t.shard?.current_tick)||0)}catch(a){console.warn("politician-nation: loadVoting threw",a)}document.getElementById("loading").style.display="none",document.getElementById("content").style.display="block",it(),A=t.faction?.politician_party_id||null,x=e,R=i,W(e,Number(t.shard?.current_tick)||0),ct(e,i),Q()}function W(t,e){const i=document.getElementById("sec-elections-body");if(!i)return;const n='<div class="sec-foot"><button class="back-to-top" data-target="jump-nav">↑ Back to Top</button></div>',o=Number(t.next_election_tick);if(!Number.isFinite(o)||o<=0){i.innerHTML=`<div class="govt-empty">
      <div class="head">No <span class="serif">elections</span> in ${v(t.name)}.</div>
    </div>`+n;return}const s=o-Number(e),a=T(o),r=Math.max(0,Number(t.total_seats)||0),c=s<=0?"overdue &mdash; pending":s===1?"in 1 tick":`in ${s} ticks`,d=r>0?`all ${r} seats of the Assembly at stake`:"every seat at stake";i.innerHTML=`
    <div class="gov-strip" style="grid-template-columns:1fr;">
      <a class="gov-card gov" href="election.html?nation=${encodeURIComponent(t.id)}"
         style="text-decoration:none; cursor:pointer;">
        <div class="gck">NEXT GENERAL ELECTION &mdash; click for full breakdown</div>
        <div class="gcv">${a}</div>
        <div class="gcd">${c} &middot; ${d}</div>
      </a>
    </div>
    <div class="parties-lab">Upcoming Special Elections</div>
    <div id="special-elections-host" class="sec-empty">Loading special elections…</div>
  `+n,J(t,e)}async function J(t,e){const i=document.getElementById("special-elections-host");if(i)try{const{data:n,error:o}=await $.from("factions").select("id, leader_first_name, leader_last_name, politician_party_id").eq("faction_type","politician").eq("nation_id",t.id).is("abandoned_at",null);if(o)throw o;const s=(n||[]).map(m=>m.id);if(!s.length){i.outerHTML='<div class="sec-empty">No special elections in progress.</div>';return}const{data:a,error:r}=await $.from("politician_active_election").select("politician_id, race_tier, district, opp_first, opp_last, opp_party_name, resolve_tick").in("politician_id",s).order("resolve_tick",{ascending:!0});if(r)throw r;if(!a||!a.length){i.outerHTML='<div class="sec-empty">No special elections in progress.</div>';return}const c=new Map((n||[]).map(m=>[m.id,m])),d=[...new Set((n||[]).map(m=>m.politician_party_id).filter(Boolean))];let l=new Map;if(d.length){const{data:m}=await $.from("factions").select("id, faction_name, abbreviation, party_color").in("id",d);l=new Map((m||[]).map(f=>[f.id,f]))}i.outerHTML=a.map(m=>X(m,c.get(m.politician_id),l,Number(e)||0)).join("")}catch(n){console.warn("politician-nation: special elections fetch failed",n),i.outerHTML='<div class="sec-empty">Could not load special elections.</div>'}}function X(t,e,i,n){const o=t.race_tier==="parliament"?"MP RACE":"COMMUNITY RACE",s=t.race_tier==="parliament"?"parl":"community",a=e&&[e.leader_first_name,e.leader_last_name].filter(Boolean).join(" ").trim()||"A politician",r=e?.politician_party_id?i.get(e.politician_party_id):null,c=r?.faction_name||"Independent",d=M(r?.party_color),l=[t.opp_first,t.opp_last].filter(Boolean).join(" ").trim()||"an opponent",m=t.opp_party_name||"Independent",f=Math.max(0,Number(t.resolve_tick)-n),_=f===0?"resolves this tick":`resolves in ${f} tick${f===1?"":"s"}`;return`<div class="sp-elec-row sp-elec-${s}" style="border-left-color:${d||"rgba(255,255,255,0.10)"};">
    <div class="sp-elec-tier">${o}</div>
    <div class="sp-elec-main">
      <div class="sp-elec-name"><strong>${v(a)}</strong> <span class="sp-elec-party" style="color:${d};">${v(c)}</span></div>
      <div class="sp-elec-desc">${v(t.district)} &middot; vs <strong>${v(l)}</strong> <span class="sp-elec-opp-party">(${v(m)})</span></div>
    </div>
    <div class="sp-elec-when">${v(_)}</div>
  </div>`}let A=null,x=null,R=null;function Q(){const t=document.getElementById("sec-govt");t&&(t.addEventListener("toggle",()=>{t.open&&N()}),t.open&&N())}function Z(){document.querySelectorAll("#jump-nav button").forEach(t=>{t.addEventListener("click",()=>{const e=document.getElementById(t.dataset.target);e&&(e.open=!0,e.scrollIntoView({behavior:"smooth",block:"start"}))})}),document.addEventListener("click",t=>{const e=t.target.closest(".back-to-top");if(!e)return;const i=document.getElementById(e.dataset.target);i&&i.scrollIntoView({behavior:"smooth",block:"start"})})}function tt(t,e,i){const n=t==="member_of_parliament",o=e.length,s=new Set(e.map(a=>a.committee?.committee_key).filter(Boolean));document.querySelectorAll("#sec-committees-body .comm-card").forEach(a=>{const r=a.querySelector("[data-req-chip]");r&&(r.classList.toggle("met",n),r.classList.toggle("not-met",!n),r.textContent=n?"Member of Parliament":"Member of Parliament required");const c=a.querySelector("[data-apply]");if(!c)return;const d=c.dataset.committeeKey;let l=null;n?s.has(d)?l="Already a member":o>=2?l="2-committee cap reached":i.has(d)&&(l="Admission vote pending"):l="Member of Parliament required",c.disabled=!!l,c.title=l||"Apply for committee membership",c.onclick=l?null:()=>et(a,c,d)})}async function et(t,e,i){const n=e.textContent;e.disabled=!0,e.textContent="Submitting…";let o=null;try{const a=await $.rpc("ensure_committee",{p_nation_id:x?.id||null,p_committee_key:i});if(a.error||!a.data?.success)throw new Error(a.data?.reason||a.error?.message||"committee_lookup_failed");o=a.data.committee_id}catch(a){console.warn("politician-nation: ensure_committee failed",a),alert("Could not look up the committee. Try again."),e.disabled=!1,e.textContent=n;return}const s=await H(o);if(!s.success){alert(s.humanError),e.disabled=!1,e.textContent=n;return}location.reload()}function it(){const t=(location.hash||"").replace(/^#/,"");if(!t)return;const e=document.getElementById(t);e&&e.tagName==="DETAILS"&&(e.open=!0,e.scrollIntoView({behavior:"auto",block:"start"}))}async function at(t,e){const i=document.getElementById("sec-voting-body");if(!i)return;const n='<div class="sec-foot"><button class="back-to-top" data-target="jump-nav">↑ Back to Top</button></div>',{data:o,error:s}=await $.from("committee_admission_votes").select("id, committee_id, applicant_party_id, started_at_tick, resolve_at_tick, yes_seats, no_seats, chamber_size, threshold_pct, applicant:factions!applicant_faction_id(leader_first_name, leader_last_name, politician_office, politician_party_id), party:factions!applicant_party_id(faction_name, abbreviation, party_color), committee:committees!committee_id(committee_key)").eq("nation_id",t).eq("status","active").order("resolve_at_tick",{ascending:!0});if(s){console.warn("politician-nation: voting fetch failed",s),i.innerHTML=`<div class="sec-empty">Could not load active votes.</div>${n}`;return}const a=o||[];if(!a.length){i.innerHTML=`<div class="sec-empty">No active votes.</div>${n}`;return}const{data:r,error:c}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",t).eq("faction_type","movement_party").is("abandoned_at",null).order("seats",{ascending:!1,nullsFirst:!1});c&&console.warn("politician-nation: parties for voting fetch failed",c);const d=r||[];i.innerHTML=a.map(l=>nt(l,d,e)).join("")+n}function nt(t,e,i){const n=F[t.committee?.committee_key]?.fullName||"Committee",o=[t.applicant?.leader_first_name,t.applicant?.leader_last_name].filter(Boolean).join(" ")||"Unknown",s=t.party?.faction_name||"Independent",a=M(t.party?.party_color),r=S(o,null),c=Math.max(0,Number(t.resolve_at_tick)-i),d=Number(t.yes_seats)||0,l=Number(t.no_seats)||0,m=d+l,f=Number(t.chamber_size)||0,_=0,y=Math.max(0,f-m-_),b=Number(t.threshold_pct)||51,u=m>0?Math.round(d*100/m):0,p=m>0?Math.round(l*100/m):0,h=u-b;return`
    <div class="vote-card">
      <div class="vote-head">
        <div class="vote-head-info">
          <div class="vote-eyebrow">CHAMBER VOTE &middot; COMMITTEE ADMISSION</div>
          <div class="vote-title">Vote: ${v(o)} for <span class="serif">${v(n)}</span></div>
        </div>
        <div class="vote-clock">
          <div class="vote-clock-lab">RESOLVES</div>
          <div class="vote-clock-val">${c} TICK${c===1?"":"S"}</div>
          <div class="vote-clock-sub">${c===0?"next refresh":`at tick ${t.resolve_at_tick}`}</div>
        </div>
      </div>
      <div class="vote-applicant">
        <div class="vote-app-badge" style="background:${a};">${v(r)}</div>
        <div>
          <div class="vote-app-name">${v(o)}</div>
          <div class="vote-app-meta"><strong>${v(s)}</strong> &middot; applying for ${v(n)}</div>
        </div>
      </div>
      <div class="vote-tally">
        <div class="vote-tl-nums">
          <div class="vote-tl-box yes">
            <div class="vote-tl-key">YES</div>
            <div class="vote-tl-big">${d}</div>
            <div class="vote-tl-of">of ${f}</div>
            <div class="vote-tl-pct">${u}% of cast</div>
          </div>
          <div class="vote-tl-box no">
            <div class="vote-tl-key">NO</div>
            <div class="vote-tl-big">${l}</div>
            <div class="vote-tl-of">of ${f}</div>
            <div class="vote-tl-pct">${p}% of cast</div>
          </div>
          <div class="vote-tl-box abs">
            <div class="vote-tl-key">ABSTAIN</div>
            <div class="vote-tl-big">${_}</div>
            <div class="vote-tl-of">of ${f}</div>
            <div class="vote-tl-pct">not counted</div>
          </div>
          <div class="vote-tl-box">
            <div class="vote-tl-key">UNVOTED</div>
            <div class="vote-tl-big">${y}</div>
            <div class="vote-tl-of">of ${f}</div>
            <div class="vote-tl-pct">${f>0?Math.round(y*100/f):0}% of chamber</div>
          </div>
        </div>
        <div class="vote-threshold">
          <span class="vote-th-lab">YES OF CAST</span>
          <div class="vote-th-bar">
            <div class="vote-th-fill" style="width:${Math.min(100,u)}%;"></div>
            <div class="vote-th-mark"></div>
          </div>
          <span class="vote-th-val">${u}% &middot; ${h>=0?"+":""}${h} vs ${b}%</span>
        </div>
      </div>
      <div class="vote-factions">
        <div class="vote-fc-lab">HOW THE PARTIES ARE VOTING</div>
        <div class="vote-fc-grid">${ot(e,t.applicant_party_id)}</div>
      </div>
    </div>`}function ot(t,e){return t.length?t.map(i=>{const n=i.id===e,o=Number(i.seats)||0,s=M(i.party_color),a=i.abbreviation||i.faction_name?.slice(0,2)||"—";return`
      <div class="vote-fc-row">
        <div class="vote-fc-flag" style="background:${s};">${v(a.toUpperCase().slice(0,3))}</div>
        <div class="vote-fc-name">${v(i.faction_name||"—")}</div>
        <span class="vote-fc-seats">${o}</span>
        <span class="vote-fc-vote ${n?"yes":"no"}">${n?"YES":"NO"}</span>
      </div>`}).join(""):'<div class="sec-empty">No parties.</div>'}function st(t,e){const i=t.nation_profiles&&(Array.isArray(t.nation_profiles)?t.nation_profiles[0]:t.nation_profiles)||{},n=i.flag_url||`assets/flags/${t.name}.png`,{prefix:o,name:s}=U(i.official_name,t.name,t.government_type);document.getElementById("nc-flag").src=n,document.getElementById("nc-flag").alt=`${t.name} flag`,document.getElementById("nc-title-prefix").textContent=o,document.getElementById("nc-title-name").textContent=s;const a=i.motto||(i.overview||"").split(/[.—]\s/)[0]||"";document.getElementById("nc-subtitle").textContent=a;const r=K(t,i);document.getElementById("nc-tags").innerHTML=r.map(g=>`<span class="tag">${v(g)}</span>`).join(""),document.getElementById("nc-capital").textContent=t.capital||"—",document.getElementById("nc-population").textContent=G(t.population);const c=t.head_of_state_title||(t.government_type==="Absolute Monarchy"?"King":"President"),d=t.head_of_state_first_name||"",l=t.head_of_state_last_name||"",m=`${d} ${l}`.trim();document.getElementById("nc-hos").textContent=m?`${c} ${m}`:"—";const f=t.government_type==="Absolute Monarchy"?t.dynasty_name?`Of the ${t.dynasty_name}`:"Reigning monarch":t.government_type==="Presidential"||t.government_type==="Semi-Presidential"?"Elected head of state":"Ceremonial head of state";document.getElementById("nc-hos-sub").textContent=f;const _=document.getElementById("nc-hog"),y=document.getElementById("nc-hog-sub");if(t.government_type==="Absolute Monarchy")_.textContent="The Crown",y.textContent="no separate premier";else if(t.government_type==="Presidential")_.textContent=m?`${c} ${m}`:"—",y.textContent="president leads the government";else{const{name:g,partyName:I}=B(e);_.textContent=g?`PM ${g}`:"Vacant",y.textContent=I?`${I}-led government`:"Prime Minister"}const b=Number(t.politician_gdp)||0,u=Number(t.politician_budget)||0,p=Number(t.politician_debt)||0,h=Math.max(0,Math.min(100,Number(t.politician_stability)||0)),w=Math.max(0,Math.min(100,Number(t.politician_civil_freedoms)||0)),k=[{kind:"money",label:"GDP",value:b},{kind:"money",label:"Budget",value:u},{kind:"money",label:"Debt",value:p},{kind:"score",label:"Stability",value:h,tiers:j},{kind:"score",label:"Civil Freedoms",value:w,tiers:q}];document.getElementById("nc-stats").innerHTML=k.map(g=>{if(g.kind==="money")return`<div class="stat-cell money">
        <span class="label">${v(g.label)}</span>
        <span class="value">${v(O(g.value))}</span>
      </div>`;const I=V(g.tiers,g.value);return`<div class="stat-cell">
      <div class="row"><span class="label">${v(g.label)}</span><span class="value">${Math.round(g.value)}</span></div>
      <div class="bar"><div class="fill" style="width:${g.value}%; background:${I.color};"></div></div>
      <div class="sub">${v(I.label)}</div>
    </div>`}).join("")}let C={phase:"loading"};async function ct(t,e){try{const[o,s]=await Promise.all([$.from("factions").select("id, faction_name, abbreviation, seats, party_color, party_description, leader_first_name, leader_last_name").eq("nation_id",t.id).eq("faction_type","movement_party").is("abandoned_at",null).order("seats",{ascending:!1}).order("faction_name"),$.from("administrations").select("pm_party_id, coalition_parties, started_at_tick").eq("nation_id",t.id).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1)]);if(o.error)throw o.error;const a=o.data||[];s.error&&console.warn("politician-nation: administration fetch failed",s.error);const r=s.data?.[0]||null,c=Math.max(0,Number(t.total_seats)||0),d=c>0?Math.floor(c/2)+1:0,l=new Set((r?.coalition_parties||[]).map(u=>u?.party_id).filter(Boolean)),m=r?.pm_party_id||null,f=r?.started_at_tick!=null?T(r.started_at_tick):null;let _=a.filter(u=>l.has(u.id));if(!_.length&&c>0){const u=a.find(p=>(Number(p.seats)||0)>=d);u&&(_=[u])}const y=a.find(u=>u.id===m)||_[0]||null,b=a.find(u=>!l.has(u.id)&&u.id!==y?.id)||null;Y(t,e,y),C={phase:"ready",parties:a,totalSeats:c,majority:d,coalition:_,pmParty:y,opposition:b,coalitionIds:l,pmYear:f}}catch(o){console.error("politician-nation: government fetch failed",o),C={phase:"error"}}const i=document.getElementById("sec-govt"),n=document.getElementById("sec-govt-body");i?.open&&n&&(n.dataset.rendered="",N())}function N(){const t=document.getElementById("sec-govt-body");if(!t||t.dataset.rendered==="1")return;const e='<div class="sec-foot"><button class="back-to-top" data-target="jump-nav">↑ Back to Top</button></div>';if(C.phase==="loading"){t.innerHTML='<div class="sec-empty">Loading the parliament…</div>';return}if(t.dataset.rendered="1",C.phase==="error"){t.innerHTML='<div class="sec-empty">Could not load the parliament.</div>'+e;return}const{parties:i,totalSeats:n,majority:o,coalition:s,pmParty:a,opposition:r,coalitionIds:c,pmYear:d}=C;if(i.length===0){t.innerHTML=`<div class="govt-empty">
      <div class="head">No <span class="serif">parties</span> in ${v(x?.name||"this nation")}.</div>
      <div class="note">When parties register they'll appear here.</div>
    </div>`+e;return}t.innerHTML=`
    <div class="parl-head">
      <div class="parl-title">National <span class="serif">Assembly</span></div>
      <div class="parl-meta"><strong>${n}</strong> seats &middot; <strong>${o}</strong> needed for a majority</div>
    </div>
    <div class="chamber-wrap">${rt(i,n)}</div>
    ${dt(s,a,r,R,n,o,d)}
    <div class="parties-lab">Parties in the Assembly &middot; ordered by seat share</div>
    ${i.map(l=>mt(l,n,a,c,A)).join("")}
  `+e}function rt(t,e){if(!e)return"";const i=760,n=400,o=i/2,s=340,a=90,r=320,c=7,d=(r-a)/(c-1),l=Array.from({length:c},(p,h)=>a+h*d),m=l.reduce((p,h)=>p+h,0),f=l.map(p=>Math.round(e*p/m));let _=e-f.reduce((p,h)=>p+h,0);for(let p=0;_!==0;p++)f[p%c]+=_>0?1:-1,_+=_>0?-1:1;const y=[];for(let p=0;p<c;p++){const h=f[p],w=l[p];for(let k=0;k<h;k++){const g=(k+.5)/h,I=Math.PI-g*Math.PI;y.push({x:o+w*Math.cos(I),y:s-w*Math.sin(I),angle:I})}}y.sort((p,h)=>h.angle-p.angle);let b=0,u="";for(const p of t){const h=M(p.party_color),w=Math.max(0,Number(p.seats)||0);for(let k=0;k<w&&b<y.length;k++){const g=y[b++];u+=`<circle cx="${g.x.toFixed(1)}" cy="${g.y.toFixed(1)}" r="6" fill="${h}" opacity="0.92"/>`}}for(;b<y.length;){const p=y[b++];u+=`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6" fill="#333" opacity="0.55"/>`}return`<svg class="chamber" viewBox="0 0 ${i} ${n}" xmlns="http://www.w3.org/2000/svg">${u}</svg>`}function lt(t){const e=t.map(i=>i.faction_name).filter(Boolean);return e.length?e.length===1?e[0]:e.length===2?`${e[0]} & ${e[1]}`:`${e.slice(0,-1).join(", ")} & ${e[e.length-1]}`:""}function dt(t,e,i,n,o,s,a){const r=t.reduce((b,u)=>b+(Number(u.seats)||0),0),c=t.length?`<div class="gov-card gov">
         <div class="gck">GOVERNING ${t.length>1?"COALITION":"PARTY"}</div>
         <div class="gcv">${v(lt(t))}</div>
         <div class="gcd">${r} of ${o} seats &middot; ${r>=s&&s>0?"majority":"minority"} government</div>
       </div>`:`<div class="gov-card">
         <div class="gck">GOVERNING PARTY</div>
         <div class="gcv">No majority</div>
         <div class="gcd">no party holds &gt; 50% of seats</div>
       </div>`,{name:d,partyName:l}=P(n,e),m=[l?`leader of ${v(l)}`:"awaiting appointment",l&&a?`in office since ${a}`:""].filter(Boolean).join(" &middot; "),f=`<div class="gov-card">
    <div class="gck">PRIME MINISTER</div>
    <div class="gcv">${d?v(d):"Vacant"}</div>
    <div class="gcd">${m}</div>
  </div>`,_=i&&`${i.leader_first_name||""} ${i.leader_last_name||""}`.trim()||"—",y=i?`<div class="gov-card opp">
         <div class="gck">LEADER OF OPPOSITION</div>
         <div class="gcv">${v(_)}</div>
         <div class="gcd">leader of ${v(i.faction_name)}</div>
       </div>`:`<div class="gov-card">
         <div class="gck">LEADER OF OPPOSITION</div>
         <div class="gcv">—</div>
         <div class="gcd">no opposition party</div>
       </div>`;return`<div class="gov-strip">${c}${f}${y}</div>`}function mt(t,e,i,n,o){const s=M(t.party_color),a=i&&i.id===t.id,r=!a&&n.has(t.id),c=o&&o===t.id,d=[t.leader_first_name,t.leader_last_name].filter(Boolean).join(" "),l=`background:${s}1f;color:${s};border:0.5px solid ${s}66;`,f=[a?'<span class="status-pill gov">&#9679; Governing</span>':r?'<span class="status-pill coal">&#9679; Coalition</span>':'<span class="status-pill opp">&#9679; Opposition</span>',c?'<span class="status-pill you">&#9679; You</span>':""].filter(Boolean).join(" ");return`<a class="party-row" href="${`party.html?id=${encodeURIComponent(t.id)}`}" style="border-left-color:${s};">
    <div class="party-badge" style="${l}">${v(S(t.faction_name,t.abbreviation))}</div>
    <div class="party-info">
      <div class="party-name">${v(t.faction_name)} ${f}</div>
      ${t.party_description?`<div class="party-desc">${v(t.party_description)}</div>`:""}
    </div>
    <div class="party-meta">
      <div><div class="ml">PARTY LEADER</div><div class="mv${d?"":" none"}">${d?v(d):"Vacant"}</div></div>
      <div><div class="ml">YOUR AFFILIATION</div><div class="mv${c?"":" none"}">${c?"Member":"—"}</div></div>
    </div>
    <div class="party-seats">
      <div class="ps-n">${Number(t.seats)||0}</div>
      <div class="ps-of">of ${e}</div>
      <div class="ps-l">SEATS</div>
    </div>
  </a>`}z();
