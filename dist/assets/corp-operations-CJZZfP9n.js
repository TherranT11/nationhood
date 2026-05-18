const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-Dar6x8XP.js","assets/preload-helper-BXl3LOEh.js","assets/factions-qe2qC_cj.js"])))=>i.map(i=>d[i]);
import{_supabase as b}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as ke}from"./preload-helper-BXl3LOEh.js";import{t as Y,e as r,a as ee}from"./utils-oN1e812_.js";import{m as $e}from"./lawsuit-pressing-issues-Dz6DGIDC.js";import{m as xe}from"./loan-pressing-issues-CcJntQcw.js";import{SECTOR_OPS_PAGE as Ce}from"./corp-topbar-Dar6x8XP.js";import"./lawsuit-types-mDq47olK.js";import"./factions-qe2qC_cj.js";const te="cti-corp-tax-pressing-styles",Ee=`
.cti-card {
    background: #1a1a17;
    border: 1px solid rgba(255,255,255,0.06);
    border-left-width: 3px;
    padding: 18px 22px;
    margin-bottom: 12px;
}
.cti-card.kind-due        { border-left-color: #c8a832; }
.cti-card.kind-partial    { border-left-color: #d9a035; }
.cti-card.kind-delinquent { border-left-color: #d9534f; box-shadow: inset 3px 0 12px rgba(217,83,79,0.15); }

.cti-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
}

.cti-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 2px 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: #1a1a17;
}
.cti-tag.kind-due        { color: #c8a832; border-color: rgba(200,168,50,0.40); background: rgba(200,168,50,0.06); }
.cti-tag.kind-partial    { color: #d9a035; border-color: rgba(217,160,53,0.40); background: rgba(217,160,53,0.06); }
.cti-tag.kind-delinquent { color: #fff; background: #d9534f; border-color: #d9534f; }

.cti-deadline {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.cti-deadline.warn { color: #d9534f; }

.cti-name {
    font-family: 'IBM Plex Serif', Georgia, serif;
    font-weight: 500;
    font-size: 19px;
    color: #f0efe6;
    line-height: 1.2;
    margin-bottom: 8px;
    letter-spacing: -0.01em;
}

.cti-stats {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #c4c2b8;
    margin-bottom: 14px;
    line-height: 1.6;
}
.cti-stats strong { color: #f0efe6; }

.cti-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.cti-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 8px 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: transparent;
    color: #c4c2b8;
    cursor: pointer;
}
.cti-btn:hover    { border-color: rgba(255,255,255,0.30); color: #f0efe6; }
.cti-btn[disabled] { opacity: 0.5; cursor: wait; }
.cti-btn-primary  { background: #c8a832; color: #1a1a17; border-color: #c8a832; }
.cti-btn-primary:hover { background: #d6b647; border-color: #d6b647; color: #1a1a17; }
.cti-btn-secondary { color: #888; }

.cti-empty {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #888;
    padding: 20px;
    text-align: center;
}
`;function Be(){if(document.getElementById(te))return;const e=document.createElement("style");e.id=te,e.textContent=Ee,document.head.appendChild(e)}function B(e){const t=Number(e)||0;return t>=1e9?"$"+(t/1e9).toFixed(2)+"B":t>=1e6?"$"+(t/1e6).toFixed(1)+"M":t>=1e3?"$"+(t/1e3).toFixed(1)+"k":"$"+Math.round(t).toLocaleString()}function A(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function ae(e){return Math.max(0,Math.min(100,Number(e)||0))}function Se(e){const t=ae(e);return Math.max(0,Math.min(100,25+t))}async function Ne(e,t){const{data:n,error:o}=await e.from("corp_tax_bills").select("id, nation_id, year, revenue_taxed, rate_pct, amount_due, status, due_at_tick, nations:nation_id(name, corruption)").eq("corp_id",t).in("status",["due","partial","delinquent"]).is("ignored_at_tick",null).order("due_at_tick",{ascending:!0});return o?(console.warn("[corp-tax-pressing] fetch failed:",o.message),[]):n||[]}function Te(e,t){const n=e.nations?.name||"Unknown nation",o=e.status,a=o==="delinquent"?"kind-delinquent":o==="partial"?"kind-partial":"kind-due",s=o==="delinquent"?"Delinquent":o==="partial"?"Partial":"Tax Due",i=t>Number(e.due_at_tick)&&o==="due",g=`Due by ${Y(e.due_at_tick)}`,m=o==="due"?`<button class="cti-btn" data-action="cook" data-id="${A(e.id)}">Cook the Books</button>`:"";return`<div class="cti-card ${a}">
        <div class="cti-meta-row">
            <span class="cti-tag ${a}">${s}</span>
            <span class="cti-deadline${i?" warn":""}">${A(g)}</span>
        </div>
        <div class="cti-name">${A(n)} Corporate Tax — ${e.year}</div>
        <div class="cti-stats">
            Revenue ${B(e.revenue_taxed)} · Rate ${e.rate_pct}% · Amount Due <strong>${B(e.amount_due)}</strong>
        </div>
        <div class="cti-actions">
            <button class="cti-btn cti-btn-primary" data-action="pay" data-id="${A(e.id)}">Pay in Full</button>
            ${m}
            <button class="cti-btn cti-btn-secondary" data-action="ignore" data-id="${A(e.id)}">Ignore</button>
        </div>
    </div>`}function Ie({supabase:e,faction:t,host:n,currentTick:o=()=>0,showEmpty:a=!1,onChange:s=null}){if(!n)return{refresh:async()=>{},getCount:()=>0};Be();let i=[];function g(){const u=Number(o())||0;if(i.length===0){if(!a){n.innerHTML="";return}n.innerHTML='<div class="cti-empty">No outstanding tax bills.</div>';return}n.innerHTML=i.map(l=>Te(l,u)).join("")}async function m(){if(i=await Ne(e,t.id),g(),typeof s=="function")try{s(i)}catch(u){console.warn("[corp-tax-pressing] onChange threw:",u?.message||u)}}async function v(u,l){const p=i.find(c=>c.id===u);if(p){if(l==="pay"){const{data:c,error:f}=await e.rpc("pay_corporate_tax_full",{p_bill_id:u});if(f){alert(`Payment failed: ${f.message}`);return}if(!c?.success){alert(`Payment failed: ${c?.reason||"unknown"}`);return}c.status==="delinquent"&&alert(`Insufficient cash. Paid ${B(c.amount_paid)}; ${B(c.residual)} now delinquent (10% late fee applied).`),window.dispatchEvent(new CustomEvent("corp-tax:changed",{detail:{action:l,billId:u,result:c}})),await m();return}if(l==="cook"){const c=ae(p.nations?.corruption),f=Math.floor(Number(p.amount_due)*.5),k=Se(c),w=`Cook the Books — ${p.nations?.name||"this nation"} ${p.year} tax bill

Pay ${B(f)} now (50% of ${B(p.amount_due)}).
Roll 1d100 + ${c} corruption.
  > 75 → bill closes, ${B(p.amount_due-f)} added to Corporate Fraud.
  ≤ 75 → caught: residual + 10% late fee → delinquent, -1 reputation.

Estimated success: ${k}%.

Continue?`;if(!confirm(w))return;const{data:y,error:$}=await e.rpc("cook_corporate_tax_books",{p_bill_id:u});if($){alert(`Cook failed: ${$.message}`);return}if(!y?.success){alert(`Cook failed: ${y?.reason||"unknown"}`);return}const E=y.fraud_succeeded?`Rolled ${y.roll} + ${y.corruption} = ${y.total}. Cook SUCCEEDED.
Saved ${B(y.amount_saved)}.`:`Rolled ${y.roll} + ${y.corruption} = ${y.total}. Cook CAUGHT.
${B(y.amount_delinquent)} now delinquent. -1 reputation.`;alert(E),window.dispatchEvent(new CustomEvent("corp-tax:changed",{detail:{action:l,billId:u,result:y}})),await m();return}if(l==="ignore"){if(!confirm(`Ignore this tax bill?

-1 corporate reputation. Bill stays in your records and is hidden from this list until next year's assessment.`))return;const{data:c,error:f}=await e.rpc("ignore_corporate_tax_bill",{p_bill_id:u});if(f){alert(`Ignore failed: ${f.message}`);return}if(!c?.success){alert(`Ignore failed: ${c?.reason||"unknown"}`);return}window.dispatchEvent(new CustomEvent("corp-tax:changed",{detail:{action:l,billId:u,result:c}})),await m();return}}}return n.addEventListener("click",async u=>{const l=u.target.closest("button[data-action][data-id]");if(l&&!l.disabled){l.disabled=!0;try{await v(l.dataset.id,l.dataset.action)}catch(p){console.error("[corp-tax-pressing] action threw:",p?.message||p),alert("Action failed — check console.")}finally{l.disabled=!1}}}),m(),{refresh:m,getCount:()=>i.length}}function Ae(e){const t=Number(e)||0;return t>=7?"good":t>=4?"mid":"warn"}const Me=[{key:"crews",column:"corp_work_crews",eyebrow:"CAPACITY",name:"Work",emName:"Crews",tooltip:"Your pool of skilled labor — engineers, foremen, equipment operators. Caps how many construction projects you can bid on at once and drives bid-prep speed. Strong crews mean faster turnarounds and more bids in flight; weak crews stall the pipeline.",blurb:{good:"<strong>Strong skilled labor pool.</strong> Crews fully staffed; apprenticeship pipeline producing qualified hires.",mid:"<strong>Adequate crew strength.</strong> Operating at workable capacity, room to scale before next bid window.",warn:"<strong>Crew shortages.</strong> Active bids limited; recruitment overdue and turnover rising."},impacts:{good:[{label:"Max Active Projects",value:"5+"},{label:"Avg. Bid Speed",value:"+18%",tone:"good"}],mid:[{label:"Max Active Projects",value:"3"},{label:"Avg. Bid Speed",value:"Average"}],warn:[{label:"Max Active Projects",value:"1–2"},{label:"Avg. Bid Speed",value:"−12%",tone:"warn"}]}},{key:"regulatory",column:"corp_regulatory_standing",eyebrow:"RISK",name:"Regulatory",emName:"Standing",tooltip:"Your relationship with the host nation's ministries and inspectors. High standing = permits clear quickly, audits stay light, government contracts flow your way. Low standing = approvals stall, audit risk climbs, sanctioned projects slip away to rivals.",blurb:{good:"<strong>Strong ministry rapport.</strong> Permits clear quickly; audit risk minimal; the regime takes your calls.",mid:"<strong>Average standing.</strong> No major scandals on the books; permits move at the standard pace.",warn:"<strong>Recent incidents have soured ministry relations.</strong> Permits stall; audit risk elevated; favors are no longer free."},impacts:{good:[{label:"Permit Speed",value:"+22%",tone:"good"},{label:"Audit Risk",value:"Low",tone:"good"}],mid:[{label:"Permit Speed",value:"Average"},{label:"Audit Risk",value:"Standard"}],warn:[{label:"Permit Speed",value:"−15%",tone:"warn"},{label:"Audit Risk",value:"Elevated",tone:"warn"}]}},{key:"supply",column:"corp_supply_chain",eyebrow:"REACH",name:"Material",emName:"Supply Chain",tooltip:"How diversified your sourcing is — concrete, steel, fixtures, fuel. Strong chains keep reserves deep and shrug off single-supplier disruptions or sanctions. Weak chains run hand-to-mouth: one shock and active projects slip into delay penalties.",blurb:{good:"<strong>Diversified sourcing across domestic and overseas suppliers.</strong> Reserves healthy; sanctions exposure manageable.",mid:"<strong>Mixed sourcing.</strong> Reserves stable but vulnerable to single-source disruption; suppliers cordial, not loyal.",warn:"<strong>Single-source dependence.</strong> Stock running low; one disruption away from project delays."},impacts:{good:[{label:"Material Reserves",value:"60+ days",tone:"good"},{label:"Sanctions Exposure",value:"Low",tone:"good"}],mid:[{label:"Material Reserves",value:"30–45 days"},{label:"Sanctions Exposure",value:"Moderate",tone:"rust"}],warn:[{label:"Material Reserves",value:"<14 days",tone:"warn"},{label:"Sanctions Exposure",value:"High",tone:"warn"}]}}];function se(){const e=document.getElementById("co-hero-stats");e&&(e.innerHTML=Me.map(qe).join(""))}function qe(e){const t=Number(d[e.column])||0,n=Ae(t),o=Number.isInteger(t)?String(t):t.toFixed(1),a='<div class="co-hero-stat-trend">— Latest</div>',s=Le(t,n),i=e.blurb[n]||"",m=(e.impacts[n]||[]).map(u=>`<div>
            <span class="label">${r(u.label)}</span>
            <span class="value ${u.tone||""}">${r(u.value)}</span>
        </div>`).join(""),v=e.tooltip?`<span class="co-hero-tip" data-tip="${ee(e.tooltip)}" aria-label="What is ${ee(e.name+" "+(e.emName||""))}?">?</span>`:"";return`<div class="co-hero-stat" data-stat="${e.key}">
        <div class="co-hero-stat-eyebrow">${r(e.eyebrow)}</div>
        <div class="co-hero-stat-name">${r(e.name)} <em>${r(e.emName)}</em>${v}</div>
        <div class="co-hero-stat-value-row">
            <div class="co-hero-stat-value">${r(o)}<span class="co-max">/10</span></div>
            ${a}
        </div>
        ${s}
        <div class="co-hero-stat-desc">${i}</div>
        <div class="co-hero-stat-impact">${m}</div>
    </div>`}function Le(e,t){const n=Math.max(0,Math.min(10,Math.round(Number(e)||0))),o=t==="good"?"filled good":t==="warn"?"filled warn":"filled",a=[];for(let s=0;s<10;s++)a.push(`<div class="co-hero-meter-cell${s<n?" "+o:""}"></div>`);return`<div class="co-hero-meter">${a.join("")}</div>`}let q=[],ie=null,re=null,ce=null;async function le(){if(!d?.id)return;const[e,t]=await Promise.all([b.from("corp_contract_events").select("id, contract_id, type, severity, title, description, impact, responses, expires_at_tick, corp_contracts:contract_id(name)").eq("faction_id",d.id).eq("status","ACTIVE"),b.from("shipping_contract_events").select("id, contract_id, type, severity, title, description, impact, responses, expires_at_tick").eq("faction_id",d.id).eq("status","ACTIVE")]);e.error&&console.warn("[corp-operations] Pressing Issues (corp) fetch failed:",e.error.message),t.error&&console.warn("[corp-operations] Pressing Issues (shipping) fetch failed:",t.error.message);const n=(e.data||[]).map(a=>({...a,_src:"corp"})),o=(t.data||[]).map(a=>({...a,_src:"shipping",corp_contracts:{name:"Trade Route"}}));q=[...n,...o].sort((a,s)=>(a.expires_at_tick||0)-(s.expires_at_tick||0)),R()}function Re(e){const t=String(e||"").toUpperCase();return t==="CRITICAL"?"critical":t==="HIGH"?"high":t==="MODERATE"?"moderate":"low"}function Pe(e,t){const n=Math.max(0,Number(e||0)-(Number(t)||0));return n<=0?"Resolving now":`Expires in ${n} tick${n===1?"":"s"}`}function R(){const e=document.getElementById("co-issues-list"),t=document.getElementById("co-issues-meta");if(!e||!t)return;const n=ie?.getCount?.()??0,o=re?.getCount?.()??0,a=ce?.getCount?.()??0,s=d?.displaced_from_nation_id?1:0,i=q.length+a+n+o+s;t.textContent=i===0?"Time-Sensitive ◊ Decide Before Tick Resolves":`${i} OPEN ◊ DECIDE BEFORE TICK RESOLVES`;const g=!!d?.displaced_from_nation_id;if(q.length===0&&!g){e.innerHTML=n===0&&o===0&&a===0?'<div class="co-contract-empty">No pressing issues right now. Time-sensitive decisions will appear here when triggered.</div>':"";return}const m=Number(x?.current_tick)||0,v=d?.displaced_from_nation_id?`
        <div class="co-issue-card sev-critical kind-relocate">
            <div class="co-contract-meta-row">
                <span class="co-issue-tag" style="background:rgba(217,83,79,0.15);color:var(--co-accent-red);">FORCED RELOCATION</span>
                <span class="co-contract-deadline">Required</span>
            </div>
            <div class="co-contract-name">Your headquarters nation has nationalized industry</div>
            <div class="co-contract-client">— State Run Economy enacted. Select a new home nation to resume operations.</div>
            <div class="co-issue-terms">
                <span><span class="label">RELOCATION FEE</span><span class="value">$5M</span></span>
                <span><span class="label">SHORTFALL</span><span class="value">Deferred as debt</span></span>
                <span><span class="label">PROPERTIES</span><span class="value">Dissolved</span></span>
                <span><span class="label">OPEN BIDS</span><span class="value">Withdrawn</span></span>
            </div>
            <div class="co-contract-actions">
                <button class="co-contract-btn primary" data-action="open-relocate">
                    Choose New HQ Nation ▸
                </button>
            </div>
        </div>`:"",u=q.map(l=>{const p=Pe(l.expires_at_tick,m),c=Re(l.severity),f=l.corp_contracts?.name||"Project",k=Array.isArray(l.responses)&&l.responses[0]||{},w=Number(k.cost)||0,y=Number(k.delay)||0,$=[];w>0&&$.push(`<span class="co-req-chip unmet">−${C(w)}</span>`),y>0&&$.push(`<span class="co-req-chip unmet">+${y}t delay</span>`),$.length===0&&$.push('<span class="co-req-chip met">No fixed cost</span>');const E=String(l.severity||"LOW").toUpperCase(),N=String(l.type||"").trim(),H=N?`${E} ◊ ${N}`:E;return`<div class="co-issue-card sev-${c}">
            <div class="co-contract-meta-row">
                <span class="co-issue-tag sev-${c}">${r(H)}</span>
                <span class="co-contract-deadline">${r(p)}</span>
            </div>
            <div class="co-contract-name">${r(l.title||"Untitled")}</div>
            <div class="co-contract-client">— ${r(f)}</div>
            <div class="co-issue-desc">${r(l.description||l.impact||"")}</div>
            <div class="co-contract-requires">${$.join("")}</div>
            <div class="co-contract-actions">
                <button class="co-contract-btn primary" data-action="ack-issue" data-id="${r(l.id)}">Acknowledge ▸</button>
            </div>
        </div>`});e.innerHTML=(v?[v]:[]).concat(u).join("")}let O=new Set,P=!1;async function Fe(){if(P||!d?.displaced_from_nation_id||document.getElementById("co-relocate-overlay"))return;const[e,t]=await Promise.all([b.from("nations").select("id, name, capital, gdp, standard_of_living").order("name"),b.rpc("list_state_run_economy_nations")]);if(e.error){alert("Failed to load nations: "+e.error.message);return}if(t.error){alert("Failed to load State Run Economy filter: "+t.error.message);return}const n=new Set((t.data||[]).map(i=>i.nation_id)),o=(e.data||[]).filter(i=>i.id!==d.displaced_from_nation_id&&!n.has(i.id)),a=document.createElement("div");a.id="co-relocate-overlay",a.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;",a.addEventListener("click",i=>{i.target===a&&V()});const s=o.length===0?'<div style="padding:24px;text-align:center;color:var(--co-text-tertiary);font-family:var(--font-mono);font-size:11px;">No eligible nations available. Every other nation is also under State Run Economy.</div>':o.map(i=>`
            <div class="co-relocate-card" data-nation-id="${r(i.id)}"
                style="border:1px solid rgba(255,255,255,0.1);background:#1a1a17;padding:14px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:border-color 0.15s,background 0.15s;">
                <div>
                    <div style="font-family:var(--font-serif,Georgia,serif);font-size:16px;font-weight:600;color:#f0efe6;">${r(i.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:#9e9a92;letter-spacing:0.04em;margin-top:2px;">Capital: ${r(i.capital||"—")}</div>
                </div>
                <div style="text-align:right;font-family:var(--font-mono);font-size:10px;color:#9e9a92;">
                    <div>SoL ${i.standard_of_living!=null?Math.round(i.standard_of_living):"—"}</div>
                </div>
            </div>`).join("");a.innerHTML=`
        <div style="background:#0f0f0d;border:1px solid rgba(255,255,255,0.1);max-width:640px;width:100%;max-height:80vh;display:flex;flex-direction:column;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <div>
                    <div style="font-family:var(--font-serif,Georgia,serif);font-size:20px;font-weight:600;color:#f0efe6;">Relocate Headquarters</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:#9e9a92;letter-spacing:0.06em;margin-top:4px;">$5M FEE · DEFERRED AS DEBT IF CASH SHORT · OPEN BIDS WITHDRAWN · NON-HQ PROPERTIES DISSOLVED</div>
                </div>
                <button id="co-relocate-x" style="background:transparent;border:1px solid rgba(255,255,255,0.15);color:#9e9a92;font-family:var(--font-mono);font-size:14px;width:30px;height:30px;cursor:pointer;">×</button>
            </div>
            <div id="co-relocate-list" style="overflow-y:auto;padding:16px 22px;display:flex;flex-direction:column;gap:8px;">${s}</div>
            <div id="co-relocate-error" style="display:none;font-family:var(--font-mono);font-size:11px;color:#d9534f;padding:10px 22px;border-top:1px solid rgba(217,83,79,0.4);background:rgba(217,83,79,0.06);"></div>
        </div>`,document.body.appendChild(a),a.querySelector("#co-relocate-x")?.addEventListener("click",V),a.querySelectorAll(".co-relocate-card").forEach(i=>{i.addEventListener("mouseenter",()=>{i.style.borderColor="var(--co-accent-gold,#c8a832)",i.style.background="#1f1f1a"}),i.addEventListener("mouseleave",()=>{i.style.borderColor="rgba(255,255,255,0.1)",i.style.background="#1a1a17"}),i.addEventListener("click",()=>He(i.dataset.nationId))})}function V(){document.getElementById("co-relocate-overlay")?.remove()}async function He(e){if(P||!e||!confirm("Relocate HQ to this nation? The $5M fee is deducted now (or deferred as debt if cash is short). All properties in the old nation are dissolved and open bids withdrawn. This cannot be undone."))return;P=!0;const t=document.getElementById("co-relocate-error");t&&(t.style.display="none",t.textContent="");try{const{data:n,error:o}=await b.rpc("relocate_corp_hq",{p_new_nation_id:e});if(o){t&&(t.textContent=o.message,t.style.display="block");return}if(!n?.success){t&&(t.textContent=`Relocate failed: ${n?.reason||"unknown"}`,t.style.display="block");return}V(),location.reload()}catch(n){t&&(t.textContent=n?.message||String(n),t.style.display="block")}finally{P=!1}}async function je(e){if(!O.has(e)){O.add(e);try{const n=(q||[]).find(g=>g.id===e)?._src==="shipping"?"acknowledge_shipping_contract_event":"acknowledge_corp_contract_event",{data:o,error:a}=await b.rpc(n,{p_event_id:e,p_response_key:null});if(a)return _("Failed: "+a.message,"error");if(o&&o.success===!1)return _(o.error||"Failed to acknowledge","error");const s=o?.cost_applied?` − ${C(o.cost_applied)}`:"",i=o?.delay_applied?` ◊ +${o.delay_applied}t delay`:"";_(`Acknowledged${s}${i}`,"success"),await J(),await le()}catch(t){console.error("[corp-operations] acknowledge failed:",t),_("Acknowledge failed: "+(t?.message||"unknown"),"error")}finally{O.delete(e)}}}let T=[],S=[],I=new Map,D=!1,W=!1;function C(e){const t=Number(e)||0,n=t<0?"-":"",o=Math.abs(t);return o>=1e9?n+"$"+(o/1e9).toFixed(2)+"B":o>=1e6?n+"$"+(o/1e6).toFixed(1)+"M":o>=1e3?n+"$"+(o/1e3).toFixed(1)+"k":n+"$"+Math.round(o).toLocaleString()}const oe=["id","contract_number","name","description","contract_type","issuer_name","issuer_nation_id","budget","timeline_months","status","requirements","expires_at_tick","deadline_tick","expected_finish_tick","started_at_tick","progress_pct","amount_spent","crews_working","winner_faction_id"].join(", ")+", nations:issuer_nation_id(name)";async function F(){const{data:e}=await b.from("corp_properties").select("nation_id").eq("faction_id",d.id).eq("role","regional_hq").eq("is_active",!0),t=Array.from(new Set([d.nation_id,...(e||[]).map(s=>s.nation_id).filter(Boolean)])),[n,o]=await Promise.all([b.from("corp_contracts").select(oe).eq("required_sector","Construction").eq("status","open").in("issuer_nation_id",t).order("budget",{ascending:!1}).limit(40),b.from("corp_contracts").select(oe).eq("winner_faction_id",d.id).in("status",["awarded","active"]).order("expected_finish_tick",{ascending:!0})]);n.error?(console.error("[corp-operations] available contracts error:",n.error.message),T=[]):T=n.data||[],o.error?(console.error("[corp-operations] active contracts error:",o.error.message),S=[]):S=o.data||[],I=new Map;const a=[...T.map(s=>s.id),...S.map(s=>s.id)];if(a.length>0){const{data:s,error:i}=await b.from("corp_contract_bids").select("contract_id, bid_amount, crews_committed, markup_pct, quoted_timeline_months, status").eq("faction_id",d.id).in("contract_id",a);if(i)console.warn("[corp-operations] my bids fetch failed:",i.message);else for(const g of s||[])(!I.get(g.contract_id)||g.status==="accepted")&&I.set(g.contract_id,g)}de(),Oe()}function de(){const e=document.getElementById("co-available-list"),t=document.getElementById("co-available-meta");if(!e||!t)return;const n=fe(),o=T.filter(a=>!n.has(a.id));if(o.length===0){t.textContent="None open",e.innerHTML='<div class="co-contract-empty">No open contracts at the moment. Check back next tick.</div>';return}t.textContent=`${o.length} Open Bid${o.length===1?"":"s"}`,e.innerHTML=o.map(We).join("")}function Oe(){const e=document.getElementById("co-active-list"),t=document.getElementById("co-active-meta");if(!e||!t)return;if(S.length===0){t.textContent="None active",e.innerHTML='<div class="co-contract-empty">No active contracts. Win a bid to get going.</div>';return}const n=S.reduce((o,a)=>o+(Number(a.budget)||0),0);t.textContent=`${S.length} In Progress ◊ Total Value ${C(n)}`,e.innerHTML=S.map(Ue).join("")}function ue(e){const t=String(e||"").toLowerCase();return t==="private"?"private":t==="foreign"?"foreign":"gov"}function pe(e){switch(e){case"work_crews":return"Work Crews";case"regulatory_standing":return"Reg. Standing";case"supply_chain":return"Supply Chain";default:return e}}function De(e){if(!d)return null;switch(e){case"work_crews":return Number(d.corp_work_crews??0);case"regulatory_standing":return Number(d.corp_regulatory_standing??0);case"supply_chain":return Number(d.corp_supply_chain??0);default:return null}}function We(e){const t=ue(e.contract_type),n=String(e.contract_type||"GOVERNMENT"),o=Number(x?.current_tick)||0,a=e.expires_at_tick!=null?Math.max(0,e.expires_at_tick-o):null,s=a==null?"No deadline":a<=0?"Closing now":`Closes in ${a} tick${a===1?"":"s"}`,i=e.requirements&&typeof e.requirements=="object"?e.requirements:{},g=Number(i.work_crews)||0;let m=!0;const v=Object.entries(i).map(([k,w])=>{const y=De(k),$=Number(w),E=y!=null&&Number.isFinite($)&&y>=$;return E||(m=!1),`<span class="co-req-chip ${E?"met":"unmet"}">${E?"✓":"✗"} ${r(pe(k))} ${r(String(w))}+</span>`}).join(""),u=e.issuer_name?`— ${r(e.issuer_name)}${e.nations?.name?`, ${r(e.nations.name)}`:""}`:"— Unknown issuer",l=I.get(e.id),p=m?"Place Bid ▸":"Requirements Unmet",c=m?`data-action="bid" data-id="${r(e.id)}"`:"disabled",f=l?`<div class="co-contract-bid-placed">
                ✓ Bid Placed — ${C(l.bid_amount)}
                ${l.quoted_timeline_months?` · ${l.quoted_timeline_months} ticks`:""}
                ${l.crews_committed?` · ${l.crews_committed} crew${l.crews_committed===1?"":"s"}`:""}
           </div>`:`<div class="co-contract-actions">
                <button class="co-contract-btn" data-action="decline" data-id="${r(e.id)}">Decline</button>
                <button class="co-contract-btn primary" ${c}>${p}</button>
           </div>`;return`<div class="co-contract-card">
        <div class="co-contract-meta-row">
            <span class="co-contract-tag ${t}">${r(n)}</span>
            <span class="co-contract-deadline">${r(s)}</span>
        </div>
        <div class="co-contract-name">${r(e.name||"Untitled Contract")}</div>
        <div class="co-contract-client">${u}</div>
        <div class="co-contract-stats">
            <div>
                <div class="label">Value</div>
                <div class="value green">${C(e.budget)}</div>
            </div>
            <div>
                <div class="label">Duration</div>
                <div class="value">${e.timeline_months||"—"}<span style="font-size:11px;color:var(--co-text-tertiary);"> ticks</span></div>
            </div>
            <div>
                <div class="label">Crews Required</div>
                <div class="value">${g||"—"}</div>
            </div>
        </div>
        ${v?`<div class="co-contract-requires">${v}</div>`:""}
        ${f}
    </div>`}function Ue(e){const t=ue(e.contract_type),n=String(e.contract_type||"GOVERNMENT"),o=Number(x?.current_tick)||0,a=Math.max(0,Math.min(100,Number(e.progress_pct)||0)),s=e.started_at_tick!=null?Number(e.started_at_tick):null,i=Number(e.timeline_months)||0,g=s!=null&&i>0?Math.max(0,Math.min(100,(o-s)/i*100)):0;let m="On Track",v=!1;a>=100?m="Complete":g-a>5&&(m="Late",v=!0);const u=e.expected_finish_tick!=null?`Slated to Complete on: ${r(Y(e.expected_finish_tick))}`:"No deadline set",l=I.get(e.id),p=Number(l?.crews_committed||0),c=Number(e.crews_working||0),f=p?`${c.toFixed(0)} / ${p.toFixed(0)}`:"—",k=p>0&&c<p?" warn":"",w=Number(e.budget)||0,y=Number(e.amount_spent)||0,$=w>0?(w-y)/w*100:0,E=w>0?`${$.toFixed(1)}%`:"—",N=$<5?" warn":"";return`<div class="co-contract-card">
        <div class="co-contract-meta-row">
            <span class="co-contract-tag ${t}">${r(n)}</span>
            <span class="co-contract-deadline${v?" warn":""}" style="text-align:right; line-height:1.3;">
                ${r(u)}<br>
                <small style="opacity:0.85;">${r(m)}</small>
            </span>
        </div>
        <div class="co-contract-name">${r(e.name||"Untitled Contract")}</div>
        <div class="co-contract-client">— ${r(e.issuer_name||"Unknown issuer")}</div>
        <div class="co-contract-stats">
            <div>
                <div class="label">Value</div>
                <div class="value green">${C(w)}</div>
            </div>
            <div>
                <div class="label">Crews Working</div>
                <div class="value${k}">${f}</div>
            </div>
            <div>
                <div class="label">Margin</div>
                <div class="value${N}">${E}</div>
            </div>
        </div>
        <div class="co-contract-progress">
            <div class="co-contract-progress-label">
                <span>Construction Progress${v?" — Late":""}</span>
                <span class="pct${v?" warn":""}">${a.toFixed(0)}%</span>
            </div>
            <div class="co-contract-progress-bar">
                <div class="co-contract-progress-fill${v?" warn":""}" style="width: ${a}%;"></div>
            </div>
        </div>
        <div class="co-contract-actions">
            <button class="co-contract-btn" data-action="manage-crews" data-id="${r(e.id)}">Manage Crews</button>
            <button class="co-contract-btn" data-action="renegotiate"  data-id="${r(e.id)}">Renegotiate</button>
            <button class="co-contract-btn" data-action="view-details" data-id="${r(e.id)}">Details</button>
        </div>
    </div>`}function me(){return`co-declined-${d?.id||"anon"}`}function fe(){try{const e=localStorage.getItem(me());return new Set(e?JSON.parse(e):[])}catch{return new Set}}function ze(e){const t=fe();t.add(e);try{localStorage.setItem(me(),JSON.stringify(Array.from(t)))}catch{}}function Ve(){document.getElementById("co-available-list")?.addEventListener("click",ne),document.getElementById("co-active-list")?.addEventListener("click",ne),document.getElementById("co-issues-list")?.addEventListener("click",async e=>{const t=e.target.closest("[data-action]");if(!t||t.disabled)return;const n=t.getAttribute("data-action");if(n==="open-relocate")return Fe();const o=t.getAttribute("data-id");if(o&&n==="ack-issue")return je(o)}),document.getElementById("co-modal-overlay")?.addEventListener("click",e=>{(e.target===e.currentTarget||e.target.matches("[data-modal-close]"))&&L()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&L()})}async function ne(e){const t=e.target.closest(".co-contract-btn");if(!t||t.disabled)return;const n=t.getAttribute("data-action"),o=t.getAttribute("data-id");if(!(!n||!o)){if(n==="decline"){ze(o),de();return}if(n==="bid"){const a=T.find(s=>s.id===o);a&&Qe(a);return}if(n==="view-details"){const a=S.find(s=>s.id===o)||T.find(s=>s.id===o);a&&Xe(a);return}if(n==="manage-crews"){const a=S.find(s=>s.id===o);a&&Ze(a);return}if(n==="renegotiate"){_("Renegotiation isn't available yet.","error");return}}}const Ge={1:1,2:1.05,3:1.1},Ye={1:1,2:.8,3:.7};function Je(e,t,n){const o=1.3-(Number(d.corp_supply_chain)||0)*.06,a=Ge[t]||1,s=Ye[t]||1,i=(Number(e.budget)||0)*.7,g=Math.round(i*o*a*(1+n/100)),m=Math.round((Number(e.timeline_months)||0)*s);return{bidAmount:g,months:m,supplyMult:o,crewCost:a,crewTime:s}}function Qe(e){const t=document.getElementById("co-modal");if(!t)return;t.classList.add("co-bid-modal");const n=Math.floor(Number(d.corp_work_crews)||0),o=Number(d.corp_regulatory_standing)||0,a=Number(d.corp_supply_chain)||0,s=e.requirements&&typeof e.requirements=="object"?e.requirements:{},i=Number(s.regulatory_standing)||0,g=!e.issuer_nation_id||e.issuer_nation_id!==d.nation_id,m=g?1.5:1,v={1:n>=1,2:n>=2,3:n>=3};let u=v[3]?3:v[2]?2:(v[1],1),l=30;const p=()=>{const{bidAmount:c,months:f,supplyMult:k}=Je(e,u,l),w=Number(e.budget)||0,y=w>0?c/w*100:0,$=c>w,E=[1,2,3].map(h=>{const Z=v[h];return`<button type="button" class="co-bid-pill${h===u&&Z?" active":""}"
                    data-bid-crews="${h}" ${Z?"":"disabled"}>
                <strong>${h} crew${h===1?"":"s"}</strong>
                <span class="sub">${h===1?"baseline":h===2?"−20% time · ×1.05 cost":"−30% time · ×1.10 cost"}</span>
            </button>`}).join(""),N=[10,20,30,40,50].map(h=>`<button type="button" class="co-bid-pill${h===l?" active":""}"
                    data-bid-markup="${h}">${h}%</button>`).join(""),H=o>=i?"good":"warn",be=`${o.toFixed(o%1===0?0:1)}<span class="muted"> / 10${i?` · req ${i}+`:""}</span>`,ye=$?"warn":y<85?"good":"",_e=`${C(c)}<span class="muted"> · ${y.toFixed(0)}% of budget</span>`,Q=5e4,K=!v[u],j=(Number(d.corp_cash_reserves)||0)<Q,X=o<i,we=K||j||X,he=j?"Need $50k":X?`Need Reg. ${i}+`:K?"No crews available":"Submit Bid ▸";t.innerHTML=`
            <div class="co-modal-title">Place Bid — ${r(e.name||"Contract")}</div>
            <div class="co-modal-body" style="margin-bottom:12px;">
                <strong>${r(e.issuer_name||"Unknown issuer")}</strong>
                ${e.nations?.name?`, ${r(e.nations.name)}`:""}
                · Budget <strong>${C(w)}</strong>
                · Timeline <strong>${e.timeline_months||"—"} ticks</strong>
            </div>

            <div class="co-bid-section">
                <div class="co-bid-section-title">Work Crews</div>
                <div class="co-bid-button-row" id="co-bid-crews">${E}</div>
                <div class="co-bid-section-help">More crews shorten the timeline at a slightly higher cost. Your Work Crews stat caps the maximum (you have <strong>${n}</strong>).</div>
            </div>

            <div class="co-bid-section">
                <div class="co-bid-section-title">Markup</div>
                <div class="co-bid-button-row" id="co-bid-markup">${N}</div>
                <div class="co-bid-section-help">Profit you add over your computed cost. Lower markup wins more bids; higher markup grows your margin if you win.</div>
            </div>

            <div class="co-bid-section co-bid-summary">
                <div class="co-bid-summary-title">What the issuer sees</div>
                <div class="co-bid-summary-row">
                    <span class="label">Timeline</span>
                    <span class="value">${f}<span class="muted"> tick${f===1?"":"s"}</span></span>
                </div>
                <div class="co-bid-summary-row">
                    <span class="label">Cost</span>
                    <span class="value ${ye}">${_e}</span>
                </div>
                <div class="co-bid-summary-row">
                    <span class="label">Regulatory Standing</span>
                    <span class="value ${H}">${be}</span>
                </div>
            </div>

            <div class="co-bid-section co-bid-summary" style="margin-top:14px;">
                <div class="co-bid-summary-title">Your side</div>
                <div class="co-bid-summary-row">
                    <span class="label">Supply Chain mult</span>
                    <span class="value">${k.toFixed(2)}×<span class="muted"> · supply ${a.toFixed(a%1===0?0:1)}/10</span></span>
                </div>
                <div class="co-bid-summary-row">
                    <span class="label">Bid Fee</span>
                    <span class="value ${j?"warn":""}">${C(Q)}<span class="muted"> · cash ${C(Number(d.corp_cash_reserves)||0)}</span></span>
                </div>
                <div class="co-bid-summary-row">
                    <span class="label">Supply Chain Cost</span>
                    <span class="value ${a<m?"warn":""}">−${m.toFixed(1)}<span class="muted"> · ${g?"cross-nation contract":"home-nation contract"}</span></span>
                </div>
            </div>

            <div class="co-modal-actions" style="margin-top:18px;">
                <button class="co-contract-btn" data-modal-close>Cancel</button>
                <button class="co-contract-btn primary" id="co-bid-submit" ${we?"disabled":""}>${r(he)}</button>
            </div>
        `,t.querySelectorAll("[data-bid-crews]").forEach(h=>{h.addEventListener("click",()=>{h.disabled||(u=Number(h.getAttribute("data-bid-crews")),p())})}),t.querySelectorAll("[data-bid-markup]").forEach(h=>{h.addEventListener("click",()=>{l=Number(h.getAttribute("data-bid-markup")),p()})}),t.querySelector("#co-bid-submit")?.addEventListener("click",()=>{Ke(e.id,u,l)})};p(),document.getElementById("co-modal-overlay").classList.add("open")}async function Ke(e,t,n){if(D)return;D=!0;const o=document.getElementById("co-bid-submit");o&&(o.disabled=!0);try{const{data:a,error:s}=await b.rpc("place_construction_bid",{p_contract_id:e,p_bidder_faction_id:d.id,p_crews_committed:t,p_markup_pct:n,p_bid_message:null});if(s){_(s.message,"error");return}if(!a?.success){_(a?.error||"Failed to place bid","error");return}_(`Bid placed: ${C(a.bid_amount)} · ${a.quoted_timeline_months} ticks`,"success"),L(),await J(),await F()}catch(a){console.error("[corp-operations] place bid failed:",a),_("Failed to place bid: "+(a?.message||"unknown"),"error")}finally{D=!1,o&&(o.disabled=!1)}}function Xe(e){const t=document.getElementById("co-modal");if(!t)return;const n=e.requirements&&typeof e.requirements=="object"?e.requirements:{},o=Object.entries(n).map(([a,s])=>`<div class="co-modal-detail-row">
            <span class="label">${r(pe(a))}</span>
            <span class="value">≥ ${r(String(s))}</span>
        </div>`).join("");t.innerHTML=`
        <div class="co-modal-title">${r(e.name||"Contract")}</div>
        <div class="co-modal-body">
            ${e.description?`<p>${r(e.description)}</p>`:'<p style="color:var(--co-text-tertiary);font-style:italic;">No description.</p>'}
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Contract Number</span>
            <span class="value">${r(e.contract_number||"—")}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Type</span>
            <span class="value">${r(e.contract_type||"—")}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Issuer</span>
            <span class="value">${r(e.issuer_name||"—")}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Budget</span>
            <span class="value">${C(e.budget)}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Timeline</span>
            <span class="value">${e.timeline_months||"—"} ticks</span>
        </div>
        ${o||'<div class="co-modal-detail-row"><span class="label">Requirements</span><span class="value">None</span></div>'}
        <div class="co-modal-actions" style="margin-top:18px;">
            <button class="co-contract-btn" data-modal-close>Close</button>
        </div>
    `,document.getElementById("co-modal-overlay").classList.add("open")}async function Ze(e){const t=document.getElementById("co-modal");if(!t)return;const n=I.get(e.id),o=Number(n?.crews_committed||0),a=Number(e.crews_working)||0,{data:s,error:i}=await b.rpc("crew_capacity_summary",{p_corp_id:d.id,p_exclude_contract_id:e.id});if(i){_("Failed to load crew capacity: "+i.message,"error");return}const g=Number(s?.owned)||0,m=Number(s?.deployed_other)||0,v=Number(s?.free_for_this)||0,u=Math.min(o,v);t.innerHTML=`
        <div class="co-modal-title">Manage Crews — ${r(e.name||"")}</div>
        <div class="co-modal-body">
            You own <strong>${Math.floor(g)}</strong> Work Crews;
            <strong>${m}</strong> are deployed on other active contracts.
            This contract committed <strong>${o}</strong> crews at bid time.<br><br>
            You can deploy up to <strong>${u}</strong> on this contract
            (capped by the lower of your committed bid and your free capacity).
            Setting this to 0 stalls the contract — no progress, no cost — until you redeploy.
        </div>
        <input type="number" min="0" max="${u}" step="1"
               value="${Math.min(a,u)}"
               class="co-modal-input" id="co-crews-input"
               aria-label="Crews working" />
        <div class="co-modal-actions">
            <button class="co-contract-btn" data-modal-close>Cancel</button>
            <button class="co-contract-btn primary" id="co-crews-confirm" data-id="${r(e.id)}">Confirm</button>
        </div>
    `,document.getElementById("co-modal-overlay").classList.add("open"),document.getElementById("co-crews-confirm")?.addEventListener("click",async()=>{if(W)return;const l=document.getElementById("co-crews-input"),p=Number(l?.value);if(!Number.isFinite(p)||p<0||!Number.isInteger(p)){_("Crews must be a non-negative whole number","error");return}if(p>u){_(`Cannot deploy more than ${u} (committed ${o}, free capacity ${v}).`,"error");return}const c=document.getElementById("co-crews-confirm");W=!0,c.disabled=!0;try{const{data:f,error:k}=await b.rpc("set_crews_working",{p_contract_id:e.id,p_crews:p});if(k){_(k.message,"error");return}if(!f?.success){_(f?.error||"Failed to update crews","error");return}_(p===0?"Crews withdrawn — contract stalled.":`${p} crew${p===1?"":"s"} deployed.`,"success"),L(),await F()}catch(f){console.error("[corp-operations] set_crews_working failed:",f),_("Failed: "+(f?.message||"unknown"),"error")}finally{W=!1,c.disabled=!1}},{once:!0})}function L(){document.getElementById("co-modal-overlay")?.classList.remove("open"),document.getElementById("co-modal")?.classList.remove("co-bid-modal")}const G=[{key:"hiring",name:"Hiring Initiative",options:[{letter:"A",title:"Quick Hire Recruitment Drive",desc:"Rush new workers onto the books with minimal vetting — fast capacity, but materials budget gets squeezed.",cost:4e7,effects:{crews:2,supply:-2}},{letter:"B",title:"Comprehensive Talent Program",desc:"Build a full pipeline with apprenticeships and benefits — slower, but earns the labor ministry’s respect.",cost:7e7,effects:{crews:3,regulatory:1}}]},{key:"lobbying",name:"Government Lobbying",options:[{letter:"A",title:"Backroom Lobbying Campaign",desc:"Pull executives off worksites to schmooze ministers in private clubs — quiet influence, but crews suffer without leadership.",cost:5e7,effects:{regulatory:2,crews:-2}},{letter:"B",title:"Public Affairs & Industry Coalition",desc:"Lead a formal coalition that wins over both the press and your suppliers — slow, expensive, transformative.",cost:8e7,effects:{regulatory:3,supply:1}}]},{key:"megaproject",name:"Megaproject Bid Strategy",options:[{letter:"A",title:"Lowball Bid Strategy",desc:"Underbid the competition aggressively — wins the contract and ministry favor, but thin margins force cheap material sourcing.",cost:3e7,effects:{regulatory:2,supply:-2}},{letter:"B",title:"Premium Bid with Guarantees",desc:"Bid at full price with delivery and quality bonds — the regime sees you as a serious partner, and crews see job security.",cost:9e7,effects:{regulatory:3,crews:1}}]},{key:"material",name:"Material Sourcing",options:[{letter:"A",title:"Cheap Foreign Imports",desc:"Buy steel and machinery overseas at deep discount — supply problem solved, but nationalists in the regime won’t forget.",cost:4e7,effects:{supply:2,regulatory:-2}},{letter:"B",title:"Strategic Domestic Partnership",desc:"Lock in long-term contracts with domestic mills and quarries — costlier, but builds loyalty across the supply chain and your workforce.",cost:7e7,effects:{supply:3,crews:1}}]},{key:"vertical",name:"Vertical Integration",options:[{letter:"A",title:"Acquire Small Quarry",desc:"Buy out a regional gravel and limestone operation — secures basic materials, but workers reassigned to mining ops.",cost:6e7,effects:{supply:2,crews:-2}},{letter:"B",title:"Build Modern Cement Plant",desc:"Construct a flagship facility with the regime’s blessing — full supply independence and a ribbon-cutting with the President.",cost:1e8,effects:{supply:3,regulatory:1}}]},{key:"safety",name:"Worker Safety Program",options:[{letter:"A",title:"Mandatory Training Rollout",desc:"Pull crews off active sites for safety training — wins ministry approval but slows progress.",cost:4e7,effects:{regulatory:2,crews:-2}},{letter:"B",title:"Industry-Leading Safety Standards",desc:"Build a flagship safety program crews are proud of — costly but lifts morale and the regulator’s opinion together.",cost:8e7,effects:{regulatory:3,crews:1}}]},{key:"equipment",name:"Equipment Upgrade",options:[{letter:"A",title:"Used Machinery Purchase",desc:"Pick up second-hand fleet at auction — fast capacity, but parts and supply chain take a hit.",cost:5e7,effects:{crews:2,supply:-2}},{letter:"B",title:"New Fleet Investment",desc:"Order modern equipment direct from the manufacturer — lifts capacity and supply both, but the cheque is large.",cost:9e7,effects:{crews:3,supply:1}}]},{key:"patriotic",name:"Patriotic Project Acceptance",options:[{letter:"A",title:"Discounted Government Build",desc:"Accept a state project below market rate — wins favor, but pulls crews off paying work.",cost:3e7,effects:{regulatory:2,crews:-2}},{letter:"B",title:"Below-Cost Prestige Project",desc:"Take a flagship national build at a loss — the regime is grateful and supply partners follow.",cost:6e7,effects:{regulatory:3,supply:1}}]},{key:"apprenticeship",name:"Apprenticeship Program",options:[{letter:"A",title:"Basic Trades School Sponsorship",desc:"Bankroll a regional trades program — feeds the workforce, but ministers grumble about private capture of public training.",cost:4e7,effects:{crews:2,regulatory:-2}},{letter:"B",title:"National Engineering Initiative",desc:"Partner with the state on a national engineering program — lifts both crews and standing.",cost:8e7,effects:{crews:3,regulatory:1}}]},{key:"stockpile",name:"Stockpile Strategy",options:[{letter:"A",title:"Emergency Material Reserves",desc:"Bulk-buy materials for a rainy day — supply secured, but storage and handling pull crews off worksites.",cost:5e7,effects:{supply:2,crews:-2}},{letter:"B",title:"Strategic National Stockpile",desc:"Co-fund a national reserves program — supply security plus regulatory goodwill.",cost:9e7,effects:{supply:3,regulatory:1}}]}],et={crews:"Crews",regulatory:"Reg.",supply:"Supply"};let U=!1;function tt(){const e=Number(d?.corp_construction_action_locked_until_tick)||0,t=Number(x?.current_tick)||0;return Math.max(0,e-t)}function ge(){const e=document.getElementById("co-actions-grid"),t=document.getElementById("co-actions-meta"),n=document.getElementById("co-actions-cooldown-pill");if(!e)return;const o=tt(),a=o>0;e.classList.toggle("locked",a),n&&(n.innerHTML=a?`<span class="co-actions-cooldown-pill">🔒 Locked ${o} more tick${o===1?"":"s"}</span>`:""),t&&(t.textContent=a?`Locked until tick ${d.corp_construction_action_locked_until_tick}`:`${G.length} Initiatives ◊ Choose A or B (12-tick global cooldown)`),e.innerHTML=G.map((s,i)=>ot(s,i,a)).join("")}function ot(e,t,n){const o=e.options.map((a,s)=>nt(e,a,t,s,n)).join("");return`<div class="co-action-card">
        <div class="co-action-name">${r(e.name)}</div>
        <div class="co-action-options">${o}</div>
    </div>`}function nt(e,t,n,o,a){const s=ve(t);return`<div class="co-action-option" ${a?'data-locked="1"':""}
                 data-action-key="${r(e.key)}"
                 data-choice="${r(t.letter)}"
                 data-card-idx="${n}" data-opt-idx="${o}">
        <span class="co-action-option-letter">${r(t.letter)}</span>
        <div class="co-action-option-content">
            <div class="co-action-option-title">${r(t.title)}</div>
            <div class="co-action-option-desc">${r(t.desc)}</div>
            <div class="co-action-option-effects">${s}</div>
        </div>
        <span class="co-action-option-cta">${a?"Locked":"Take ▸"}</span>
    </div>`}function ve(e){const t=[`<span class="co-effect cost">−${C(e.cost).replace("-","")}</span>`];for(const[n,o]of Object.entries(e.effects||{})){const a=o>0?"+":"",s=o>0?"positive":"negative";t.push(`<span class="co-effect ${s}">${a}${o} ${r(et[n]||n)}</span>`)}return t.join("")}function at(){document.getElementById("co-actions-grid")?.addEventListener("click",e=>{const t=e.target.closest(".co-action-option");if(!t||t.hasAttribute("data-locked"))return;const n=Number(t.getAttribute("data-card-idx")),o=Number(t.getAttribute("data-opt-idx")),a=G[n],s=a?.options[o];!a||!s||st(a,s)})}function st(e,t){const n=document.getElementById("co-modal");if(!n)return;const o=ve(t);n.innerHTML=`
        <div class="co-modal-title">Confirm: ${r(t.title)}</div>
        <div class="co-modal-body">
            <p style="margin-bottom:12px;"><strong>${r(e.name)} — Option ${r(t.letter)}</strong></p>
            <p style="margin-bottom:12px;">${r(t.desc)}</p>
            <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-bottom:14px;">${o}</div>
            <p style="font-family:var(--co-mono);font-size:11px;color:var(--co-accent-rust);letter-spacing:0.06em;text-transform:uppercase;">
                ⚠ This locks all 10 Strategic Actions for 12 ticks.
            </p>
        </div>
        <div class="co-modal-actions">
            <button class="co-contract-btn" data-modal-close>Cancel</button>
            <button class="co-contract-btn primary" id="co-action-confirm"
                    data-action-key="${r(e.key)}"
                    data-choice="${r(t.letter)}">Confirm ▸</button>
        </div>
    `,document.getElementById("co-modal-overlay").classList.add("open"),document.getElementById("co-action-confirm")?.addEventListener("click",async()=>{if(U)return;U=!0;const a=document.getElementById("co-action-confirm");a&&(a.disabled=!0);try{const{data:s,error:i}=await b.rpc("fire_construction_action",{p_corp_id:d.id,p_action_key:e.key,p_choice:t.letter});if(i){_(i.message,"error");return}if(!s?.success){_(s?.error||"Action failed","error");return}_("Action taken — locked for 12 ticks.","success"),L(),await J(),ge(),se()}catch(s){console.error("[corp-operations] fire_construction_action failed:",s),_("Failed: "+(s?.message||"unknown"),"error")}finally{U=!1,a&&(a.disabled=!1)}},{once:!0})}async function J(){const{data:e,error:t}=await b.from("factions").select("corp_cash_reserves, corp_work_crews, corp_regulatory_standing, corp_supply_chain, corp_construction_action_locked_until_tick, action_points").eq("id",d.id).single();if(t||!e){console.error("[corp-operations] refetch faction state failed:",t?.message);return}Object.assign(d,e)}function _(e,t){document.querySelectorAll(".co-toast").forEach(o=>o.remove());const n=document.createElement("div");n.className="co-toast"+(t?" "+t:""),n.textContent=e,document.body.appendChild(n),setTimeout(()=>{n.classList.add("fade"),setTimeout(()=>n.remove(),280)},3e3)}let d=null,x=null,z=[];async function it(){const{data:{user:e}}=await b.auth.getUser();if(!e){window.location.href="login.html";return}const n=new URL(location.href).searchParams.get("faction_id"),{data:o,error:a}=await b.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);if(a){M("Failed to load factions: "+a.message);return}if(z=(o||[]).filter(c=>c.nation_id),n){const{data:c,error:f}=await b.from("factions").select("*").eq("id",n).single();if(f||!c){M("Inspector faction not found.");return}d=c}else d=z.find(c=>c.faction_type==="corporation");if(!d||d.faction_type!=="corporation"){M("No corporation linked to this account.");return}const s=d.corp_sector||"";if(s!=="Construction"){const c=Ce[s]||"corp-dashboard.html",f=n?`?faction_id=${encodeURIComponent(n)}`:"";window.location.replace(c+f);return}const[i,g,m]=await Promise.all([b.from("shard").select("current_tick, current_date, name, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single(),d.nation_id?b.from("nations").select("id, name, capital").eq("id",d.nation_id).single():Promise.resolve({data:null,error:null}),b.from("corp_contracts").select("id",{count:"exact",head:!0}).eq("winner_faction_id",d.id).in("status",["awarded","active"])]);if(i.error){M("Failed to load shard: "+i.error.message);return}x=i.data,g?.data,g?.error&&console.error("[corp-operations] nation fetch error:",g.error.message),m?.error&&console.error("[corp-operations] active contracts count error:",m.error.message);const v=m?.count??0,u=document.getElementById("corp-topbar-container");if(u)try{const{renderCorpTopBar:c}=await ke(async()=>{const{renderCorpTopBar:f}=await import("./corp-topbar-Dar6x8XP.js");return{renderCorpTopBar:f}},__vite__mapDeps([0,1,2]));c(u,{faction:d,shard:x,activeTab:"operations",allUserFactions:z})}catch(c){console.error("[corp-operations] topbar render failed:",c)}document.getElementById("co-active-count").textContent=String(v),document.getElementById("co-footer-date").textContent=x?.current_date||Y(x?.current_tick)||"—",se(),ge(),Ve(),at(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="",F();let l=Number(x?.current_tick)||0;const p=setInterval(async()=>{if(!document.hidden)try{const{data:c,error:f}=await b.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single();if(f||!c)return;const k=Number(c.current_tick)||0;if(k===l)return;l=k,x={...x,...c},await F()}catch(c){console.error("[corp-operations] tick poll failed:",c)}},3e4);window.addEventListener("beforeunload",()=>clearInterval(p)),ce=xe({supabase:b,faction:d,host:document.getElementById("co-loan-pressing"),showEmpty:!1,onChange:()=>R()}),ie=$e({supabase:b,faction:d,host:document.getElementById("co-lawsuit-pressing"),currentTick:()=>Number(x?.current_tick)||0,showEmpty:!1,onChange:()=>R()}),re=Ie({supabase:b,faction:d,host:document.getElementById("co-tax-pressing"),currentTick:()=>Number(x?.current_tick)||0,showEmpty:!1,onChange:()=>R()}),le()}function M(e){const t=document.getElementById("loading");t.textContent=e,t.style.color="var(--co-accent-red)"}it().catch(e=>{console.error("[corp-operations] init failed:",e),M("Failed to load: "+(e?.message||"unknown error"))});
