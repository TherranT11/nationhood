import{_ as b}from"./supabase-client-BXEzLDpS.js";import{b as O}from"./politician-topbar-5igJjSS-.js";import{a as n,g as A}from"./utils-CzgKGX6o.js";import{M as R}from"./diplomacy-constants-DDYAx-fT.js";import"./factions-C2s734Ze.js";const M=R.map(o=>o.key),q=new Map(R.map(o=>[o.key,o.label]));async function Y(){let o=null;try{o=await O("nation")}catch(l){console.error("politician-laws: bootstrap failed",l),document.getElementById("loading").textContent="Failed to load. Please reload the page.";return}if(!o)return;const t=o.nation;if(!t){document.getElementById("loading").textContent="No nation associated with this politician.";return}document.title=`${t.name} — Laws`,document.getElementById("ph-sub").textContent=`${t.name}${t.capital?` · capital ${t.capital}`:""}`,await F(t.id),await D(t.id,o),document.getElementById("loading").style.display="none",document.getElementById("content").style.display="block"}async function F(o){const t=document.getElementById("law-host"),{data:l,error:d}=await b.from("active_laws").select(`
      id,
      passed_tick,
      policies (
        id, policy_name, description, major_sector
      ),
      selected_option:policy_options!selected_option_id (
        option_name, option_description
      )
    `).eq("nation_id",o).eq("is_reversal",!1);if(d){console.error("politician-laws: load failed",d),t.innerHTML=`<div class="fail">Failed to load laws.<br>${n(d.message||"")}</div>`;return}const s=(l||[]).map(i=>i.policies?{...i.policies,passed_tick:i.passed_tick,option_name:i.selected_option?.option_name||null,option_description:i.selected_option?.option_description||null}:null).filter(Boolean);if(s.length===0){t.innerHTML=`<div class="law-empty"><strong>No active laws on the books.</strong><br>Laws surface here when the legislature passes legislation that's been signed into effect. None on file for this nation right now.</div>`;return}const p=new Map(M.map(i=>[i,[]])),r=[];for(const i of s){const a=String(i.major_sector||"").toUpperCase();(p.has(a)?p.get(a):r).push(i)}for(const i of p.values())i.sort((a,h)=>a.policy_name.localeCompare(h.policy_name));r.sort((i,a)=>i.policy_name.localeCompare(a.policy_name));let _="";for(const i of M){const a=p.get(i);a.length&&(_+=T(q.get(i)||i,a))}r.length&&(_+=T("Other",r)),t.innerHTML=_}function T(o,t){return`<div class="law-section"><div class="law-section__head">${n(o)}</div><div class="law-section__grid">`+t.map(U).join("")+"</div></div>"}function U(o){const t=o.policy_name||"Unnamed law",l=(o.description||"").trim(),d=(o.option_name||"").trim(),s=(o.option_description||"").trim(),p=o.passed_tick!=null?A(o.passed_tick):null;return`<div class="law-card"><div class="law-card__top"><div class="law-card__name">${n(t)}</div>`+(d?`<div class="law-card__pos">${n(d)}</div>`:"")+"</div>"+(l?`<div class="law-card__desc">${n(l)}</div>`:"")+(s?`<div class="law-card__pos-desc">${n(s)}</div>`:"")+(p?`<div class="law-card__meta">Passed ${n(String(p))}</div>`:"")+"</div>"}function V(o){if(!o||typeof o!="object")return'<span class="bill-card__stance">(no archetype tilt)</span>';const t=Object.entries(o).filter(([,s])=>Number(s)!==0);if(!t.length)return'<span class="bill-card__stance">(no archetype tilt)</span>';const l=t.filter(([,s])=>Number(s)>0).map(([s])=>`<span class="pos">+${n(s)}</span>`),d=t.filter(([,s])=>Number(s)<0).map(([s])=>`<span class="neg">−${n(s)}</span>`);return`<div class="bill-card__stance">${[...l,...d].join(" · ")}</div>`}async function D(o,t){const l=document.getElementById("bills-host"),d=document.getElementById("propose-host"),s=t?.faction?.id||null,p=Number(t?.shard?.current_tick)||0,[r,_,i,a]=await Promise.all([b.from("assembly_bills").select(`id, policy_id, current_option_id, proposed_option_id, archetype_alignment,
               status, proposed_at_tick, close_at_tick, yes_seats, no_seats, created_at,
               policy:policies!policy_id(policy_name, major_sector),
               current:policy_options!current_option_id(option_name),
               proposed:policy_options!proposed_option_id(option_name),
               proposer:factions!proposer_politician_id(leader_first_name, leader_last_name),
               proposer_party:factions!proposer_party_id(faction_name)`).eq("nation_id",o).order("created_at",{ascending:!1}).limit(10),s?b.from("assembly_bill_votes").select("bill_id, position").eq("politician_id",s):Promise.resolve({data:[],error:null}),b.from("policies").select("id, policy_name, major_sector").order("policy_name"),b.from("policy_options").select("id, policy_id, option_name").order("option_name")]);r.error&&console.warn("[politician-laws] bills fetch failed",r.error),_.error&&console.warn("[politician-laws] votes fetch failed",_.error),i.error&&console.warn("[politician-laws] policies fetch failed",i.error),a.error&&console.warn("[politician-laws] options fetch failed",a.error);const h=r.data||[],g=new Map((_.data||[]).map(e=>[e.bill_id,e.position])),u=h.filter(e=>e.status==="voting"),y=h.filter(e=>e.status!=="voting").slice(0,5),k=u.length?u.map(e=>L(e,g.get(e.id)||null,p)).join(""):'<div class="bills-empty">No bills currently up for vote.</div>',S=y.length?'<div class="bills-section__head" style="margin-top:18px;">Recent</div>'+y.map(e=>L(e,g.get(e.id)||null,p)).join(""):"";l.innerHTML=`
    <div class="bills-section">
      <div class="bills-section__head">Bills in Vote</div>
      ${k}
      ${S}
    </div>`,l.onclick=async e=>{const c=e.target.closest(".bill-vote-btn");if(!c||c.disabled)return;const v=c.dataset.billId,B=c.dataset.pos;if(!(!v||!B)){l.querySelectorAll(`[data-bill-id="${v}"].bill-vote-btn`).forEach(f=>f.disabled=!0);try{const{data:f,error:P}=await b.rpc("cast_vote_on_bill",{p_bill_id:v,p_position:B});if(P)throw P;if(!f?.success){alert("Could not vote: "+(f?.reason||"unknown"));return}location.reload()}catch(f){alert("Failed: "+(f?.message||f)),l.querySelectorAll(`[data-bill-id="${v}"].bill-vote-btn`).forEach(P=>P.disabled=!1)}}};const w=i.data||[],$=a.data||[],N=new Map;for(const e of $)N.has(e.policy_id)||N.set(e.policy_id,[]),N.get(e.policy_id).push(e);const I=(Number(t?.faction?.next_bill_propose_tick)||0)<=p,j=!!t?.faction?.politician_party_id,H=w.map(e=>`<option value="${n(e.id)}">${n(e.policy_name||"—")}</option>`).join(""),x=j?I?"":` · ready at tick ${t.faction.next_bill_propose_tick}`:" · join a party to propose";d.innerHTML=`
    <div class="propose-section">
      <div class="propose-section__head">Propose a Bill${n(x)}</div>
      <div class="propose-form">
        <select id="propose-policy"><option value="">— pick a policy —</option>${H}</select>
        <select id="propose-option" disabled><option value="">— pick a new option —</option></select>
        <button id="propose-submit" type="button" ${!j||!I?"disabled":""}>Propose</button>
      </div>
      <div class="propose-hint">Proposing a bill costs nothing today, but the 5-tick cooldown gates spam. Each bill enters a 3-tick voting window; on close, every party in the assembly gains or loses popularity per the diminishing-returns curve.</div>
    </div>`;const E=document.getElementById("propose-policy"),C=document.getElementById("propose-option"),m=document.getElementById("propose-submit");E.onchange=()=>{const e=N.get(E.value)||[];C.innerHTML='<option value="">— pick a new option —</option>'+e.map(c=>`<option value="${n(c.id)}">${n(c.option_name||"—")}</option>`).join(""),C.disabled=e.length===0},m.onclick=async()=>{if(!E.value||!C.value){alert("Pick a policy and a new option.");return}m.disabled=!0;const e=m.textContent;m.textContent="PROPOSING…";try{const{data:c,error:v}=await b.rpc("propose_bill",{p_policy_id:E.value,p_option_id:C.value});if(v)throw v;if(!c?.success){const B={not_authenticated:"Sign in to propose.",no_politician:"No politician on this account.",no_nation:"Your politician has no nation.",not_in_party:"You must be a party member to propose.",cooldown:`Cooldown — ready at tick ${c.ready_at_tick}.`,invalid_option:"That option is not part of the selected policy.",already_active:"That option is already the active law.",bill_in_flight:"A bill on this policy is already in vote."};alert(B[c?.reason]||"Could not propose: "+(c?.reason||"unknown")),m.disabled=!1,m.textContent=e;return}location.reload()}catch(c){alert("Failed: "+(c?.message||c)),m.disabled=!1,m.textContent=e}}}function L(o,t,l){const d=o.policy?.policy_name||"Unknown policy",s=o.current?.option_name||"(no current option)",p=o.proposed?.option_name||"(unknown option)",r=o.status||"voting",_=r==="voting"?"In Vote":r==="passed"?"Passed":r==="failed"?"Failed":"Expired",i=r==="voting",a=i?Math.max(0,Number(o.close_at_tick)-l):null,h=i?a===0?"closes this tick":`closes in ${a} tick${a===1?"":"s"}`:"";let g;if(i){const w=t==="yes"?"bill-vote-btn yes cast":"bill-vote-btn yes",$=t==="no"?"bill-vote-btn no cast":"bill-vote-btn no";g=`<div class="bill-card__row">
        <div class="bill-card__tally">${n(h)}</div>
        <div class="bill-card__actions">
          <button class="${w}" data-bill-id="${n(o.id)}" data-pos="yes">Yes</button>
          <button class="${$}"  data-bill-id="${n(o.id)}" data-pos="no">No</button>
        </div>
      </div>`}else{const w=Number(o.yes_seats)||0,$=Number(o.no_seats)||0;g=`<div class="bill-card__row">
        <div class="bill-card__tally">
          <span class="y">${w} yes</span> · <span class="n">${$} no</span>
        </div>
      </div>`}const u=[o.proposer?.leader_first_name,o.proposer?.leader_last_name].filter(Boolean).join(" ").trim(),y=o.proposer_party?.faction_name||"",k=u&&y?`${u} · ${y}`:u||y||"",S=k?`<div class="bill-card__meta">Proposed by ${n(k)}</div>`:"";return`<div class="bill-card ${i?"voting":""}">
    <div class="bill-card__head">
      <div class="bill-card__policy">${n(d)}</div>
      <div class="bill-card__status ${r}">${n(_)}</div>
    </div>
    <div class="bill-card__change">
      <span class="from">${n(s)}</span> → <span class="to">${n(p)}</span>
    </div>
    ${S}
    ${V(o.archetype_alignment)}
    ${g}
  </div>`}Y();
