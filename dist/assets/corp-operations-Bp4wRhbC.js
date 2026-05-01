const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BVNorCyj.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as v}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{_ as ne}from"./preload-helper-BXl3LOEh.js";import{tickToDate as U,escapeHtml as i}from"./utils-A98FEun4.js";const ae={Finance:"corp-operations-finance.html",Shipping:"corp-operations-shipping.html"};function ie(e){const t=Number(e)||0;return t>=7?"good":t>=4?"mid":"warn"}const re=[{key:"crews",column:"corp_work_crews",eyebrow:"CAPACITY",name:"Work",emName:"Crews",blurb:{good:"<strong>Strong skilled labor pool.</strong> Crews fully staffed; apprenticeship pipeline producing qualified hires.",mid:"<strong>Adequate crew strength.</strong> Operating at workable capacity, room to scale before next bid window.",warn:"<strong>Crew shortages.</strong> Active bids limited; recruitment overdue and turnover rising."},impacts:{good:[{label:"Max Active Projects",value:"5+"},{label:"Avg. Bid Speed",value:"+18%",tone:"good"}],mid:[{label:"Max Active Projects",value:"3"},{label:"Avg. Bid Speed",value:"Average"}],warn:[{label:"Max Active Projects",value:"1–2"},{label:"Avg. Bid Speed",value:"−12%",tone:"warn"}]}},{key:"regulatory",column:"corp_regulatory_standing",eyebrow:"RISK",name:"Regulatory",emName:"Standing",blurb:{good:"<strong>Strong ministry rapport.</strong> Permits clear quickly; audit risk minimal; the regime takes your calls.",mid:"<strong>Average standing.</strong> No major scandals on the books; permits move at the standard pace.",warn:"<strong>Recent incidents have soured ministry relations.</strong> Permits stall; audit risk elevated; favors are no longer free."},impacts:{good:[{label:"Permit Speed",value:"+22%",tone:"good"},{label:"Audit Risk",value:"Low",tone:"good"}],mid:[{label:"Permit Speed",value:"Average"},{label:"Audit Risk",value:"Standard"}],warn:[{label:"Permit Speed",value:"−15%",tone:"warn"},{label:"Audit Risk",value:"Elevated",tone:"warn"}]}},{key:"supply",column:"corp_supply_chain",eyebrow:"REACH",name:"Material",emName:"Supply Chain",blurb:{good:"<strong>Diversified sourcing across domestic and overseas suppliers.</strong> Reserves healthy; sanctions exposure manageable.",mid:"<strong>Mixed sourcing.</strong> Reserves stable but vulnerable to single-source disruption; suppliers cordial, not loyal.",warn:"<strong>Single-source dependence.</strong> Stock running low; one disruption away from project delays."},impacts:{good:[{label:"Material Reserves",value:"60+ days",tone:"good"},{label:"Sanctions Exposure",value:"Low",tone:"good"}],mid:[{label:"Material Reserves",value:"30–45 days"},{label:"Sanctions Exposure",value:"Moderate",tone:"rust"}],warn:[{label:"Material Reserves",value:"<14 days",tone:"warn"},{label:"Sanctions Exposure",value:"High",tone:"warn"}]}}];function D(){const e=document.getElementById("co-hero-stats");e&&(e.innerHTML=re.map(ce).join(""))}function ce(e){const t=Number(c[e.column])||0,n=ie(t),s=Number.isInteger(t)?String(t):t.toFixed(1),o='<div class="co-hero-stat-trend">— Latest</div>',a=le(t,n),r=e.blurb[n]||"",l=(e.impacts[n]||[]).map(m=>`<div>
            <span class="label">${i(m.label)}</span>
            <span class="value ${m.tone||""}">${i(m.value)}</span>
        </div>`).join("");return`<div class="co-hero-stat" data-stat="${e.key}">
        <div class="co-hero-stat-eyebrow">${i(e.eyebrow)}</div>
        <div class="co-hero-stat-name">${i(e.name)} <em>${i(e.emName)}</em></div>
        <div class="co-hero-stat-value-row">
            <div class="co-hero-stat-value">${i(s)}<span class="co-max">/10</span></div>
            ${o}
        </div>
        ${a}
        <div class="co-hero-stat-desc">${r}</div>
        <div class="co-hero-stat-impact">${l}</div>
    </div>`}function le(e,t){const n=Math.max(0,Math.min(10,Math.round(Number(e)||0))),s=t==="good"?"filled good":t==="warn"?"filled warn":"filled",o=[];for(let a=0;a<10;a++)o.push(`<div class="co-hero-meter-cell${a<n?" "+s:""}"></div>`);return`<div class="co-hero-meter">${o.join("")}</div>`}let B=[],y=[],N=!1,I=!1;function _(e){const t=Number(e)||0,n=t<0?"-":"",s=Math.abs(t);return s>=1e9?n+"$"+(s/1e9).toFixed(2)+"B":s>=1e6?n+"$"+(s/1e6).toFixed(1)+"M":s>=1e3?n+"$"+(s/1e3).toFixed(1)+"k":n+"$"+Math.round(s).toLocaleString()}const H=["id","contract_number","name","description","contract_type","issuer_name","issuer_nation_id","budget","timeline_months","status","requirements","expires_at_tick","deadline_tick","expected_finish_tick","started_at_tick","progress_pct","amount_spent","crews_assigned","winner_faction_id"].join(", ")+", nations:issuer_nation_id(name)";async function T(){const{data:e}=await v.from("corp_properties").select("nation_id").eq("faction_id",c.id).eq("role","regional_hq").eq("is_active",!0),t=Array.from(new Set([c.nation_id,...(e||[]).map(o=>o.nation_id).filter(Boolean)])),[n,s]=await Promise.all([v.from("corp_contracts").select(H).eq("required_sector","Construction").eq("status","open").in("issuer_nation_id",t).order("budget",{ascending:!1}).limit(40),v.from("corp_contracts").select(H).eq("winner_faction_id",c.id).in("status",["awarded","active"]).order("expected_finish_tick",{ascending:!0})]);n.error?(console.error("[corp-operations] available contracts error:",n.error.message),B=[]):B=n.data||[],s.error?(console.error("[corp-operations] active contracts error:",s.error.message),y=[]):y=s.data||[],W(),de()}function W(){const e=document.getElementById("co-available-list"),t=document.getElementById("co-available-meta");if(!e||!t)return;const n=K(),s=B.filter(o=>!n.has(o.id));if(s.length===0){t.textContent="None open",e.innerHTML='<div class="co-contract-empty">No open contracts at the moment. Check back next tick.</div>';return}t.textContent=`${s.length} Open Bid${s.length===1?"":"s"}`,e.innerHTML=s.map(pe).join("")}function de(){const e=document.getElementById("co-active-list"),t=document.getElementById("co-active-meta");if(!e||!t)return;if(y.length===0){t.textContent="None active",e.innerHTML='<div class="co-contract-empty">No active contracts. Win a bid to get going.</div>';return}const n=y.reduce((s,o)=>s+(Number(o.budget)||0),0);t.textContent=`${y.length} In Progress ◊ Total Value ${_(n)}`,e.innerHTML=y.map(me).join("")}function V(e){const t=String(e||"").toLowerCase();return t==="private"?"private":t==="foreign"?"foreign":"gov"}function G(e){switch(e){case"work_crews":return"Work Crews";case"regulatory_standing":return"Reg. Standing";case"supply_chain":return"Supply Chain";default:return e}}function ue(e){if(!c)return null;switch(e){case"work_crews":return Number(c.corp_work_crews??0);case"regulatory_standing":return Number(c.corp_regulatory_standing??0);case"supply_chain":return Number(c.corp_supply_chain??0);default:return null}}function pe(e){const t=V(e.contract_type),n=String(e.contract_type||"GOVERNMENT"),s=Number(h?.current_tick)||0,o=e.expires_at_tick!=null?Math.max(0,e.expires_at_tick-s):null,a=o==null?"No deadline":o<=0?"Closing now":`Closes in ${o} tick${o===1?"":"s"}`,r=e.requirements&&typeof e.requirements=="object"?e.requirements:{},d=Number(r.work_crews)||0;let l=!0;const m=Object.entries(r).map(([A,w])=>{const k=ue(A),E=Number(w),$=k!=null&&Number.isFinite(E)&&k>=E;return $||(l=!1),`<span class="co-req-chip ${$?"met":"unmet"}">${$?"✓":"✗"} ${i(G(A))} ${i(String(w))}+</span>`}).join(""),b=e.issuer_name?`— ${i(e.issuer_name)}${e.nations?.name?`, ${i(e.nations.name)}`:""}`:"— Unknown issuer",u=l?"Place Bid ▸":"Requirements Unmet",f=l?`data-action="bid" data-id="${i(e.id)}"`:"disabled";return`<div class="co-contract-card">
        <div class="co-contract-meta-row">
            <span class="co-contract-tag ${t}">${i(n)}</span>
            <span class="co-contract-deadline">${i(a)}</span>
        </div>
        <div class="co-contract-name">${i(e.name||"Untitled Contract")}</div>
        <div class="co-contract-client">${b}</div>
        <div class="co-contract-stats">
            <div>
                <div class="label">Value</div>
                <div class="value green">${_(e.budget)}</div>
            </div>
            <div>
                <div class="label">Duration</div>
                <div class="value">${e.timeline_months||"—"}<span style="font-size:11px;color:var(--co-text-tertiary);"> ticks</span></div>
            </div>
            <div>
                <div class="label">Crews Required</div>
                <div class="value">${d||"—"}</div>
            </div>
        </div>
        ${m?`<div class="co-contract-requires">${m}</div>`:""}
        <div class="co-contract-actions">
            <button class="co-contract-btn" data-action="decline" data-id="${i(e.id)}">Decline</button>
            <button class="co-contract-btn primary" ${f}>${u}</button>
        </div>
    </div>`}function me(e){const t=V(e.contract_type),n=String(e.contract_type||"GOVERNMENT"),s=Number(h?.current_tick)||0,o=Math.max(0,Math.min(100,Number(e.progress_pct)||0)),a=e.deadline_tick!=null?s-e.deadline_tick:0,r=a>0&&o<100,d=r?`Behind schedule — ${a} tick${a===1?"":"s"}`:e.expected_finish_tick!=null?`Due ${i(U(e.expected_finish_tick))}`:"No deadline",l=Number(e.budget)||0,m=Number(e.amount_spent)||0,b=l>0?(l-m)/l*100:0,u=l>0?`${b.toFixed(1)}%`:"—",f=b<5?" warn":"";return`<div class="co-contract-card">
        <div class="co-contract-meta-row">
            <span class="co-contract-tag ${t}">${i(n)}</span>
            <span class="co-contract-deadline${r?" warn":""}">${i(d)}</span>
        </div>
        <div class="co-contract-name">${i(e.name||"Untitled Contract")}</div>
        <div class="co-contract-client">— ${i(e.issuer_name||"Unknown issuer")}</div>
        <div class="co-contract-stats">
            <div>
                <div class="label">Value</div>
                <div class="value green">${_(l)}</div>
            </div>
            <div>
                <div class="label">Crews Assigned</div>
                <div class="value">${Number(e.crews_assigned||0).toFixed(0)}</div>
            </div>
            <div>
                <div class="label">Margin</div>
                <div class="value${f}">${u}</div>
            </div>
        </div>
        <div class="co-contract-progress">
            <div class="co-contract-progress-label">
                <span>Construction Progress${r?" — Behind":""}</span>
                <span class="pct${r?" warn":""}">${o.toFixed(0)}%</span>
            </div>
            <div class="co-contract-progress-bar">
                <div class="co-contract-progress-fill${r?" warn":""}" style="width: ${o}%;"></div>
            </div>
        </div>
        <div class="co-contract-actions">
            <button class="co-contract-btn" data-action="manage-crews" data-id="${i(e.id)}">Manage Crews</button>
            <button class="co-contract-btn" data-action="renegotiate"  data-id="${i(e.id)}">Renegotiate</button>
            <button class="co-contract-btn" data-action="view-details" data-id="${i(e.id)}">Details</button>
        </div>
    </div>`}function z(){return`co-declined-${c?.id||"anon"}`}function K(){try{const e=localStorage.getItem(z());return new Set(e?JSON.parse(e):[])}catch{return new Set}}function ge(e){const t=K();t.add(e);try{localStorage.setItem(z(),JSON.stringify(Array.from(t)))}catch{}}function ve(){document.getElementById("co-available-list")?.addEventListener("click",O),document.getElementById("co-active-list")?.addEventListener("click",O),document.getElementById("co-modal-overlay")?.addEventListener("click",e=>{(e.target===e.currentTarget||e.target.matches("[data-modal-close]"))&&x()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&x()})}async function O(e){const t=e.target.closest(".co-contract-btn");if(!t||t.disabled)return;const n=t.getAttribute("data-action"),s=t.getAttribute("data-id");if(!(!n||!s)){if(n==="decline"){ge(s),W();return}if(n==="bid"){const o=B.find(a=>a.id===s);o&&_e(o);return}if(n==="view-details"){const o=y.find(a=>a.id===s)||B.find(a=>a.id===s);o&&he(o);return}if(n==="manage-crews"){const o=y.find(a=>a.id===s);o&&ke(o);return}if(n==="renegotiate"){g("Renegotiation isn't available yet.","error");return}}}const fe={1:1,2:1.05,3:1.1},be={1:1,2:.8,3:.7};function ye(e,t,n){const s=1.3-(Number(c.corp_supply_chain)||0)*.06,o=fe[t]||1,a=be[t]||1,r=(Number(e.budget)||0)*.7,d=Math.round(r*s*o*(1+n/100)),l=Math.round((Number(e.timeline_months)||0)*a);return{bidAmount:d,months:l,supplyMult:s,crewCost:o,crewTime:a}}function _e(e){const t=document.getElementById("co-modal");if(!t)return;t.classList.add("co-bid-modal");const n=Math.floor(Number(c.corp_work_crews)||0),s=Number(c.corp_regulatory_standing)||0,o=Number(c.corp_supply_chain)||0,a=e.requirements&&typeof e.requirements=="object"?e.requirements:{},r=Number(a.regulatory_standing)||0,d={1:n>=1,2:n>=2,3:n>=3};let l=d[3]?3:d[2]?2:(d[1],1),m=30;const b=()=>{const{bidAmount:u,months:f,supplyMult:A}=ye(e,l,m),w=Number(e.budget)||0,k=w>0?u/w*100:0,E=u>w,$=[1,2,3].map(p=>{const j=d[p];return`<button type="button" class="co-bid-pill${p===l&&j?" active":""}"
                    data-bid-crews="${p}" ${j?"":"disabled"}>
                <strong>${p} crew${p===1?"":"s"}</strong>
                <span class="sub">${p===1?"baseline":p===2?"−20% time · ×1.05 cost":"−30% time · ×1.10 cost"}</span>
            </button>`}).join(""),R=[10,20,30,40,50].map(p=>`<button type="button" class="co-bid-pill${p===m?" active":""}"
                    data-bid-markup="${p}">${p}%</button>`).join(""),X=s>=r?"good":"warn",Z=`${s.toFixed(s%1===0?0:1)}<span class="muted"> / 10${r?` · req ${r}+`:""}</span>`,ee=E?"warn":k<85?"good":"",te=`${_(u)}<span class="muted"> · ${k.toFixed(0)}% of budget</span>`,P=!d[l],S=(Number(c.action_points)||0)<2,F=s<r,se=P||S||F,oe=S?"Need 2 AP":F?`Need Reg. ${r}+`:P?"No crews available":"Submit Bid ▸";t.innerHTML=`
            <div class="co-modal-title">Place Bid — ${i(e.name||"Contract")}</div>
            <div class="co-modal-body" style="margin-bottom:12px;">
                <strong>${i(e.issuer_name||"Unknown issuer")}</strong>
                ${e.nations?.name?`, ${i(e.nations.name)}`:""}
                · Budget <strong>${_(w)}</strong>
                · Timeline <strong>${e.timeline_months||"—"} ticks</strong>
            </div>

            <div class="co-bid-section">
                <div class="co-bid-section-title">Work Crews</div>
                <div class="co-bid-button-row" id="co-bid-crews">${$}</div>
                <div class="co-bid-section-help">More crews shorten the timeline at a slightly higher cost. Your Work Crews stat caps the maximum (you have <strong>${n}</strong>).</div>
            </div>

            <div class="co-bid-section">
                <div class="co-bid-section-title">Markup</div>
                <div class="co-bid-button-row" id="co-bid-markup">${R}</div>
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
                    <span class="value ${ee}">${te}</span>
                </div>
                <div class="co-bid-summary-row">
                    <span class="label">Regulatory Standing</span>
                    <span class="value ${X}">${Z}</span>
                </div>
            </div>

            <div class="co-bid-section co-bid-summary" style="margin-top:14px;">
                <div class="co-bid-summary-title">Your side</div>
                <div class="co-bid-summary-row">
                    <span class="label">Supply Chain mult</span>
                    <span class="value">${A.toFixed(2)}×<span class="muted"> · supply ${o.toFixed(o%1===0?0:1)}/10</span></span>
                </div>
                <div class="co-bid-summary-row">
                    <span class="label">AP Cost</span>
                    <span class="value ${S?"warn":""}">2 AP<span class="muted"> · you have ${Number(c.action_points)||0}</span></span>
                </div>
            </div>

            <div class="co-modal-actions" style="margin-top:18px;">
                <button class="co-contract-btn" data-modal-close>Cancel</button>
                <button class="co-contract-btn primary" id="co-bid-submit" ${se?"disabled":""}>${i(oe)}</button>
            </div>
        `,t.querySelectorAll("[data-bid-crews]").forEach(p=>{p.addEventListener("click",()=>{p.disabled||(l=Number(p.getAttribute("data-bid-crews")),b())})}),t.querySelectorAll("[data-bid-markup]").forEach(p=>{p.addEventListener("click",()=>{m=Number(p.getAttribute("data-bid-markup")),b()})}),t.querySelector("#co-bid-submit")?.addEventListener("click",()=>{we(e.id,l,m)})};b(),document.getElementById("co-modal-overlay").classList.add("open")}async function we(e,t,n){if(N)return;N=!0;const s=document.getElementById("co-bid-submit");s&&(s.disabled=!0);try{const{data:o,error:a}=await v.rpc("place_construction_bid",{p_contract_id:e,p_bidder_faction_id:c.id,p_crews_committed:t,p_markup_pct:n,p_bid_message:null});if(a){g(a.message,"error");return}if(!o?.success){g(o?.error||"Failed to place bid","error");return}g(`Bid placed: ${_(o.bid_amount)} · ${o.quoted_timeline_months} ticks`,"success"),x(),await Q(),await T()}catch(o){console.error("[corp-operations] place bid failed:",o),g("Failed to place bid: "+(o?.message||"unknown"),"error")}finally{N=!1,s&&(s.disabled=!1)}}function he(e){const t=document.getElementById("co-modal");if(!t)return;const n=e.requirements&&typeof e.requirements=="object"?e.requirements:{},s=Object.entries(n).map(([o,a])=>`<div class="co-modal-detail-row">
            <span class="label">${i(G(o))}</span>
            <span class="value">≥ ${i(String(a))}</span>
        </div>`).join("");t.innerHTML=`
        <div class="co-modal-title">${i(e.name||"Contract")}</div>
        <div class="co-modal-body">
            ${e.description?`<p>${i(e.description)}</p>`:'<p style="color:var(--co-text-tertiary);font-style:italic;">No description.</p>'}
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Contract Number</span>
            <span class="value">${i(e.contract_number||"—")}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Type</span>
            <span class="value">${i(e.contract_type||"—")}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Issuer</span>
            <span class="value">${i(e.issuer_name||"—")}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Budget</span>
            <span class="value">${_(e.budget)}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Timeline</span>
            <span class="value">${e.timeline_months||"—"} ticks</span>
        </div>
        ${s||'<div class="co-modal-detail-row"><span class="label">Requirements</span><span class="value">None</span></div>'}
        <div class="co-modal-actions" style="margin-top:18px;">
            <button class="co-contract-btn" data-modal-close>Close</button>
        </div>
    `,document.getElementById("co-modal-overlay").classList.add("open")}function ke(e){const t=document.getElementById("co-modal");if(!t)return;const n=Number(c.corp_work_crews)||0,s=Number(e.crews_assigned)||0;t.innerHTML=`
        <div class="co-modal-title">Manage Crews — ${i(e.name||"")}</div>
        <div class="co-modal-body">
            Allocate work crews to this contract. Maximum is your corporation's
            <strong>Work Crews</strong> stat (<strong>${n}</strong>). More crews accelerate progress but
            reduce capacity for parallel contracts.
        </div>
        <input type="number" min="0" max="${n}" step="0.5" value="${s}"
               class="co-modal-input" id="co-crews-input"
               aria-label="Crews assigned" />
        <div class="co-modal-actions">
            <button class="co-contract-btn" data-modal-close>Cancel</button>
            <button class="co-contract-btn primary" id="co-crews-confirm" data-id="${i(e.id)}">Confirm</button>
        </div>
    `,document.getElementById("co-modal-overlay").classList.add("open"),document.getElementById("co-crews-confirm")?.addEventListener("click",async()=>{if(I)return;const o=document.getElementById("co-crews-input"),a=Number(o?.value);if(!Number.isFinite(a)){g("Crews must be a number","error");return}const r=document.getElementById("co-crews-confirm");I=!0,r.disabled=!0;try{const{data:d,error:l}=await v.rpc("assign_construction_crews",{p_contract_id:e.id,p_crews:a});if(l){g(l.message,"error");return}if(!d?.success){g(d?.error||"Failed to update crews","error");return}g("Crews updated.","success"),x(),await T()}catch(d){console.error("[corp-operations] assign crews failed:",d),g("Failed: "+(d?.message||"unknown"),"error")}finally{I=!1,r.disabled=!1}},{once:!0})}function x(){document.getElementById("co-modal-overlay")?.classList.remove("open"),document.getElementById("co-modal")?.classList.remove("co-bid-modal")}const L=[{key:"hiring",name:"Hiring Initiative",options:[{letter:"A",title:"Quick Hire Recruitment Drive",desc:"Rush new workers onto the books with minimal vetting — fast capacity, but materials budget gets squeezed.",cost:4e7,effects:{crews:2,supply:-2}},{letter:"B",title:"Comprehensive Talent Program",desc:"Build a full pipeline with apprenticeships and benefits — slower, but earns the labor ministry’s respect.",cost:7e7,effects:{crews:3,regulatory:1}}]},{key:"lobbying",name:"Government Lobbying",options:[{letter:"A",title:"Backroom Lobbying Campaign",desc:"Pull executives off worksites to schmooze ministers in private clubs — quiet influence, but crews suffer without leadership.",cost:5e7,effects:{regulatory:2,crews:-2}},{letter:"B",title:"Public Affairs & Industry Coalition",desc:"Lead a formal coalition that wins over both the press and your suppliers — slow, expensive, transformative.",cost:8e7,effects:{regulatory:3,supply:1}}]},{key:"megaproject",name:"Megaproject Bid Strategy",options:[{letter:"A",title:"Lowball Bid Strategy",desc:"Underbid the competition aggressively — wins the contract and ministry favor, but thin margins force cheap material sourcing.",cost:3e7,effects:{regulatory:2,supply:-2}},{letter:"B",title:"Premium Bid with Guarantees",desc:"Bid at full price with delivery and quality bonds — the regime sees you as a serious partner, and crews see job security.",cost:9e7,effects:{regulatory:3,crews:1}}]},{key:"material",name:"Material Sourcing",options:[{letter:"A",title:"Cheap Foreign Imports",desc:"Buy steel and machinery overseas at deep discount — supply problem solved, but nationalists in the regime won’t forget.",cost:4e7,effects:{supply:2,regulatory:-2}},{letter:"B",title:"Strategic Domestic Partnership",desc:"Lock in long-term contracts with domestic mills and quarries — costlier, but builds loyalty across the supply chain and your workforce.",cost:7e7,effects:{supply:3,crews:1}}]},{key:"vertical",name:"Vertical Integration",options:[{letter:"A",title:"Acquire Small Quarry",desc:"Buy out a regional gravel and limestone operation — secures basic materials, but workers reassigned to mining ops.",cost:6e7,effects:{supply:2,crews:-2}},{letter:"B",title:"Build Modern Cement Plant",desc:"Construct a flagship facility with the regime’s blessing — full supply independence and a ribbon-cutting with the President.",cost:1e8,effects:{supply:3,regulatory:1}}]},{key:"safety",name:"Worker Safety Program",options:[{letter:"A",title:"Mandatory Training Rollout",desc:"Pull crews off active sites for safety training — wins ministry approval but slows progress.",cost:4e7,effects:{regulatory:2,crews:-2}},{letter:"B",title:"Industry-Leading Safety Standards",desc:"Build a flagship safety program crews are proud of — costly but lifts morale and the regulator’s opinion together.",cost:8e7,effects:{regulatory:3,crews:1}}]},{key:"equipment",name:"Equipment Upgrade",options:[{letter:"A",title:"Used Machinery Purchase",desc:"Pick up second-hand fleet at auction — fast capacity, but parts and supply chain take a hit.",cost:5e7,effects:{crews:2,supply:-2}},{letter:"B",title:"New Fleet Investment",desc:"Order modern equipment direct from the manufacturer — lifts capacity and supply both, but the cheque is large.",cost:9e7,effects:{crews:3,supply:1}}]},{key:"patriotic",name:"Patriotic Project Acceptance",options:[{letter:"A",title:"Discounted Government Build",desc:"Accept a state project below market rate — wins favor, but pulls crews off paying work.",cost:3e7,effects:{regulatory:2,crews:-2}},{letter:"B",title:"Below-Cost Prestige Project",desc:"Take a flagship national build at a loss — the regime is grateful and supply partners follow.",cost:6e7,effects:{regulatory:3,supply:1}}]},{key:"apprenticeship",name:"Apprenticeship Program",options:[{letter:"A",title:"Basic Trades School Sponsorship",desc:"Bankroll a regional trades program — feeds the workforce, but ministers grumble about private capture of public training.",cost:4e7,effects:{crews:2,regulatory:-2}},{letter:"B",title:"National Engineering Initiative",desc:"Partner with the state on a national engineering program — lifts both crews and standing.",cost:8e7,effects:{crews:3,regulatory:1}}]},{key:"stockpile",name:"Stockpile Strategy",options:[{letter:"A",title:"Emergency Material Reserves",desc:"Bulk-buy materials for a rainy day — supply secured, but storage and handling pull crews off worksites.",cost:5e7,effects:{supply:2,crews:-2}},{letter:"B",title:"Strategic National Stockpile",desc:"Co-fund a national reserves program — supply security plus regulatory goodwill.",cost:9e7,effects:{supply:3,regulatory:1}}]}],$e={crews:"Crews",regulatory:"Reg.",supply:"Supply"};let M=!1;function Ce(){const e=Number(c?.corp_construction_action_locked_until_tick)||0,t=Number(h?.current_tick)||0;return Math.max(0,e-t)}function Y(){const e=document.getElementById("co-actions-grid"),t=document.getElementById("co-actions-meta"),n=document.getElementById("co-actions-cooldown-pill");if(!e)return;const s=Ce(),o=s>0;e.classList.toggle("locked",o),n&&(n.innerHTML=o?`<span class="co-actions-cooldown-pill">🔒 Locked ${s} more tick${s===1?"":"s"}</span>`:""),t&&(t.textContent=o?`Locked until tick ${c.corp_construction_action_locked_until_tick}`:`${L.length} Initiatives ◊ Choose A or B (12-tick global cooldown)`),e.innerHTML=L.map((a,r)=>Be(a,r,o)).join("")}function Be(e,t,n){const s=e.options.map((o,a)=>xe(e,o,t,a,n)).join("");return`<div class="co-action-card">
        <div class="co-action-name">${i(e.name)}</div>
        <div class="co-action-options">${s}</div>
    </div>`}function xe(e,t,n,s,o){const a=J(t);return`<div class="co-action-option" ${o?'data-locked="1"':""}
                 data-action-key="${i(e.key)}"
                 data-choice="${i(t.letter)}"
                 data-card-idx="${n}" data-opt-idx="${s}">
        <span class="co-action-option-letter">${i(t.letter)}</span>
        <div class="co-action-option-content">
            <div class="co-action-option-title">${i(t.title)}</div>
            <div class="co-action-option-desc">${i(t.desc)}</div>
            <div class="co-action-option-effects">${a}</div>
        </div>
        <span class="co-action-option-cta">${o?"Locked":"Take ▸"}</span>
    </div>`}function J(e){const t=[`<span class="co-effect cost">−${_(e.cost).replace("-","")}</span>`];for(const[n,s]of Object.entries(e.effects||{})){const o=s>0?"+":"",a=s>0?"positive":"negative";t.push(`<span class="co-effect ${a}">${o}${s} ${i($e[n]||n)}</span>`)}return t.join("")}function Ae(){document.getElementById("co-actions-grid")?.addEventListener("click",e=>{const t=e.target.closest(".co-action-option");if(!t||t.hasAttribute("data-locked"))return;const n=Number(t.getAttribute("data-card-idx")),s=Number(t.getAttribute("data-opt-idx")),o=L[n],a=o?.options[s];!o||!a||Ee(o,a)})}function Ee(e,t){const n=document.getElementById("co-modal");if(!n)return;const s=J(t);n.innerHTML=`
        <div class="co-modal-title">Confirm: ${i(t.title)}</div>
        <div class="co-modal-body">
            <p style="margin-bottom:12px;"><strong>${i(e.name)} — Option ${i(t.letter)}</strong></p>
            <p style="margin-bottom:12px;">${i(t.desc)}</p>
            <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-bottom:14px;">${s}</div>
            <p style="font-family:var(--co-mono);font-size:11px;color:var(--co-accent-rust);letter-spacing:0.06em;text-transform:uppercase;">
                ⚠ This locks all 10 Strategic Actions for 12 ticks.
            </p>
        </div>
        <div class="co-modal-actions">
            <button class="co-contract-btn" data-modal-close>Cancel</button>
            <button class="co-contract-btn primary" id="co-action-confirm"
                    data-action-key="${i(e.key)}"
                    data-choice="${i(t.letter)}">Confirm ▸</button>
        </div>
    `,document.getElementById("co-modal-overlay").classList.add("open"),document.getElementById("co-action-confirm")?.addEventListener("click",async()=>{if(M)return;M=!0;const o=document.getElementById("co-action-confirm");o&&(o.disabled=!0);try{const{data:a,error:r}=await v.rpc("fire_construction_action",{p_corp_id:c.id,p_action_key:e.key,p_choice:t.letter});if(r){g(r.message,"error");return}if(!a?.success){g(a?.error||"Action failed","error");return}g("Action taken — locked for 12 ticks.","success"),x(),await Q(),Y(),D()}catch(a){console.error("[corp-operations] fire_construction_action failed:",a),g("Failed: "+(a?.message||"unknown"),"error")}finally{M=!1,o&&(o.disabled=!1)}},{once:!0})}async function Q(){const{data:e,error:t}=await v.from("factions").select("corp_cash_reserves, corp_work_crews, corp_regulatory_standing, corp_supply_chain, corp_construction_action_locked_until_tick, action_points").eq("id",c.id).single();if(t||!e){console.error("[corp-operations] refetch faction state failed:",t?.message);return}Object.assign(c,e)}function g(e,t){document.querySelectorAll(".co-toast").forEach(s=>s.remove());const n=document.createElement("div");n.className="co-toast"+(t?" "+t:""),n.textContent=e,document.body.appendChild(n),setTimeout(()=>{n.classList.add("fade"),setTimeout(()=>n.remove(),280)},3e3)}let c=null,h=null,q=[];async function Se(){const{data:{user:e}}=await v.auth.getUser();if(!e){window.location.href="login.html";return}const n=new URL(location.href).searchParams.get("faction_id"),{data:s,error:o}=await v.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);if(o){C("Failed to load factions: "+o.message);return}if(q=(s||[]).filter(u=>u.nation_id),n){const{data:u,error:f}=await v.from("factions").select("*").eq("id",n).single();if(f||!u){C("Inspector faction not found.");return}c=u}else c=q.find(u=>u.faction_type==="corporation");if(!c||c.faction_type!=="corporation"){C("No corporation linked to this account.");return}const a=c.corp_sector||"";if(a!=="Construction"){const u=ae[a]||"corp-dashboard.html",f=n?`?faction_id=${encodeURIComponent(n)}`:"";window.location.replace(u+f);return}const[r,d,l]=await Promise.all([v.from("shard").select("current_tick, current_date, name, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single(),c.nation_id?v.from("nations").select("id, name, capital").eq("id",c.nation_id).single():Promise.resolve({data:null,error:null}),v.from("corp_contracts").select("id",{count:"exact",head:!0}).eq("winner_faction_id",c.id).in("status",["awarded","active"])]);if(r.error){C("Failed to load shard: "+r.error.message);return}h=r.data,d?.data,d?.error&&console.error("[corp-operations] nation fetch error:",d.error.message),l?.error&&console.error("[corp-operations] active contracts count error:",l.error.message);const m=l?.count??0,b=document.getElementById("corp-topbar-container");if(b)try{const{renderCorpTopBar:u}=await ne(async()=>{const{renderCorpTopBar:f}=await import("./corp-topbar-BVNorCyj.js");return{renderCorpTopBar:f}},__vite__mapDeps([0,1]));u(b,{faction:c,shard:h,activeTab:"operations",allUserFactions:q})}catch(u){console.error("[corp-operations] topbar render failed:",u)}document.getElementById("co-active-count").textContent=String(m),document.getElementById("co-footer-date").textContent=h?.current_date||U(h?.current_tick)||"—",D(),Y(),ve(),Ae(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="",T()}function C(e){const t=document.getElementById("loading");t.textContent=e,t.style.color="var(--co-accent-red)"}Se().catch(e=>{console.error("[corp-operations] init failed:",e),C("Failed to load: "+(e?.message||"unknown error"))});
