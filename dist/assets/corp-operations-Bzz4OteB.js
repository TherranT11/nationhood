const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BOR6jYkY.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as g}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{_ as fe}from"./preload-helper-BXl3LOEh.js";import{tickToDate as te,escapeHtml as a,escapeAttr as Q}from"./utils-A98FEun4.js";const ge={Finance:"corp-operations-finance.html",Shipping:"corp-operations-shipping.html"};function ve(e){const t=Number(e)||0;return t>=7?"good":t>=4?"mid":"warn"}const be=[{key:"crews",column:"corp_work_crews",eyebrow:"CAPACITY",name:"Work",emName:"Crews",tooltip:"Your pool of skilled labor — engineers, foremen, equipment operators. Caps how many construction projects you can bid on at once and drives bid-prep speed. Strong crews mean faster turnarounds and more bids in flight; weak crews stall the pipeline.",blurb:{good:"<strong>Strong skilled labor pool.</strong> Crews fully staffed; apprenticeship pipeline producing qualified hires.",mid:"<strong>Adequate crew strength.</strong> Operating at workable capacity, room to scale before next bid window.",warn:"<strong>Crew shortages.</strong> Active bids limited; recruitment overdue and turnover rising."},impacts:{good:[{label:"Max Active Projects",value:"5+"},{label:"Avg. Bid Speed",value:"+18%",tone:"good"}],mid:[{label:"Max Active Projects",value:"3"},{label:"Avg. Bid Speed",value:"Average"}],warn:[{label:"Max Active Projects",value:"1–2"},{label:"Avg. Bid Speed",value:"−12%",tone:"warn"}]}},{key:"regulatory",column:"corp_regulatory_standing",eyebrow:"RISK",name:"Regulatory",emName:"Standing",tooltip:"Your relationship with the host nation's ministries and inspectors. High standing = permits clear quickly, audits stay light, government contracts flow your way. Low standing = approvals stall, audit risk climbs, sanctioned projects slip away to rivals.",blurb:{good:"<strong>Strong ministry rapport.</strong> Permits clear quickly; audit risk minimal; the regime takes your calls.",mid:"<strong>Average standing.</strong> No major scandals on the books; permits move at the standard pace.",warn:"<strong>Recent incidents have soured ministry relations.</strong> Permits stall; audit risk elevated; favors are no longer free."},impacts:{good:[{label:"Permit Speed",value:"+22%",tone:"good"},{label:"Audit Risk",value:"Low",tone:"good"}],mid:[{label:"Permit Speed",value:"Average"},{label:"Audit Risk",value:"Standard"}],warn:[{label:"Permit Speed",value:"−15%",tone:"warn"},{label:"Audit Risk",value:"Elevated",tone:"warn"}]}},{key:"supply",column:"corp_supply_chain",eyebrow:"REACH",name:"Material",emName:"Supply Chain",tooltip:"How diversified your sourcing is — concrete, steel, fixtures, fuel. Strong chains keep reserves deep and shrug off single-supplier disruptions or sanctions. Weak chains run hand-to-mouth: one shock and active projects slip into delay penalties.",blurb:{good:"<strong>Diversified sourcing across domestic and overseas suppliers.</strong> Reserves healthy; sanctions exposure manageable.",mid:"<strong>Mixed sourcing.</strong> Reserves stable but vulnerable to single-source disruption; suppliers cordial, not loyal.",warn:"<strong>Single-source dependence.</strong> Stock running low; one disruption away from project delays."},impacts:{good:[{label:"Material Reserves",value:"60+ days",tone:"good"},{label:"Sanctions Exposure",value:"Low",tone:"good"}],mid:[{label:"Material Reserves",value:"30–45 days"},{label:"Sanctions Exposure",value:"Moderate",tone:"rust"}],warn:[{label:"Material Reserves",value:"<14 days",tone:"warn"},{label:"Sanctions Exposure",value:"High",tone:"warn"}]}}];function se(){const e=document.getElementById("co-hero-stats");e&&(e.innerHTML=be.map(ye).join(""))}function ye(e){const t=Number(c[e.column])||0,s=ve(t),n=Number.isInteger(t)?String(t):t.toFixed(1),o='<div class="co-hero-stat-trend">— Latest</div>',i=_e(t,s),r=e.blurb[s]||"",l=(e.impacts[s]||[]).map(m=>`<div>
            <span class="label">${a(m.label)}</span>
            <span class="value ${m.tone||""}">${a(m.value)}</span>
        </div>`).join(""),f=e.tooltip?`<span class="co-hero-tip" data-tip="${Q(e.tooltip)}" aria-label="What is ${Q(e.name+" "+(e.emName||""))}?">?</span>`:"";return`<div class="co-hero-stat" data-stat="${e.key}">
        <div class="co-hero-stat-eyebrow">${a(e.eyebrow)}</div>
        <div class="co-hero-stat-name">${a(e.name)} <em>${a(e.emName)}</em>${f}</div>
        <div class="co-hero-stat-value-row">
            <div class="co-hero-stat-value">${a(n)}<span class="co-max">/10</span></div>
            ${o}
        </div>
        ${i}
        <div class="co-hero-stat-desc">${r}</div>
        <div class="co-hero-stat-impact">${l}</div>
    </div>`}function _e(e,t){const s=Math.max(0,Math.min(10,Math.round(Number(e)||0))),n=t==="good"?"filled good":t==="warn"?"filled warn":"filled",o=[];for(let i=0;i<10;i++)o.push(`<div class="co-hero-meter-cell${i<s?" "+n:""}"></div>`);return`<div class="co-hero-meter">${o.join("")}</div>`}let I=[],L=[];async function M(){if(!c?.id)return;const[e,t]=await Promise.all([g.from("corp_contract_events").select("id, contract_id, type, severity, title, description, impact, responses, expires_at_tick, corp_contracts:contract_id(name)").eq("faction_id",c.id).eq("status","ACTIVE").order("expires_at_tick",{ascending:!0}),g.from("bank_loan_offers").select(`
                id, offered_apr, offered_term_ticks, expires_at_tick,
                bank:factions!bank_faction_id ( faction_name, corp_ticker ),
                request:bank_loan_requests!inner ( principal, purpose )
            `).eq("status","pending").eq("request.requesting_faction_id",c.id).eq("request.status","pending").order("expires_at_tick",{ascending:!0})]);e.error?(console.warn("[corp-operations] Pressing Issues fetch failed:",e.error.message),I=[]):I=e.data||[],t.error?(console.warn("[corp-operations] Loan offers fetch failed:",t.error.message),L=[]):L=t.data||[],N()}function we(e){const t=String(e||"").toUpperCase();return t==="CRITICAL"?"critical":t==="HIGH"?"high":t==="MODERATE"?"moderate":"low"}function X(e,t){const s=Math.max(0,Number(e||0)-(Number(t)||0));return s<=0?"Resolving now":`Expires in ${s} tick${s===1?"":"s"}`}function N(){const e=document.getElementById("co-issues-list"),t=document.getElementById("co-issues-meta");if(!e||!t)return;const s=I.length+L.length;if(t.textContent=s===0?"Time-Sensitive ◊ Decide Before Tick Resolves":`${s} OPEN ◊ DECIDE BEFORE TICK RESOLVES`,s===0){e.innerHTML='<div class="co-contract-empty">No pressing issues right now. Time-sensitive decisions will appear here when triggered.</div>';return}const n=Number(C?.current_tick)||0,o=L.map(r=>{const u=X(r.expires_at_tick,n),l=r.bank||{},f=r.request||{},m=l.corp_ticker||"—",d=l.faction_name||"Lender",b=Number(r.offered_apr)||0,_=Number(r.offered_term_ticks)||0,w=Number(f.principal)||0,h=f.purpose?String(f.purpose).trim():"",k=E.has(r.id);return`<div class="co-issue-card kind-loan-offer">
            <div class="co-contract-meta-row">
                <span class="co-issue-tag kind-loan-offer">LOAN OFFER ◊ FINANCE</span>
                <span class="co-contract-deadline">${a(u)}</span>
            </div>
            <div class="co-contract-name">${a(m)} — ${a(d)}</div>
            ${h?`<div class="co-contract-client">— ${a(h)}</div>`:""}
            <div class="co-issue-terms">
                <span><span class="label">PRINCIPAL</span><span class="value">${a(y(w))}</span></span>
                <span><span class="label">APR</span><span class="value">${b.toFixed(1)}%</span></span>
                <span><span class="label">TERM</span><span class="value">${_} TICKS</span></span>
            </div>
            <div class="co-contract-actions">
                <button class="co-contract-btn primary" data-action="accept-offer" data-id="${a(r.id)}" ${k?"disabled":""}>
                    ${k?"Working…":"Accept ▸"}
                </button>
                <button class="co-contract-btn" data-action="reject-offer" data-id="${a(r.id)}" ${k?"disabled":""}>
                    Reject
                </button>
            </div>
        </div>`}),i=I.map(r=>{const u=X(r.expires_at_tick,n),l=we(r.severity),f=r.corp_contracts?.name||"Project",m=Array.isArray(r.responses)&&r.responses[0]||{},d=Number(m.cost)||0,b=Number(m.delay)||0,_=[];d>0&&_.push(`<span class="co-req-chip unmet">−${y(d)}</span>`),b>0&&_.push(`<span class="co-req-chip unmet">+${b}t delay</span>`),_.length===0&&_.push('<span class="co-req-chip met">No fixed cost</span>');const w=String(r.severity||"LOW").toUpperCase(),h=String(r.type||"").trim(),k=h?`${w} ◊ ${h}`:w;return`<div class="co-issue-card sev-${l}">
            <div class="co-contract-meta-row">
                <span class="co-issue-tag sev-${l}">${a(k)}</span>
                <span class="co-contract-deadline">${a(u)}</span>
            </div>
            <div class="co-contract-name">${a(r.title||"Untitled")}</div>
            <div class="co-contract-client">— ${a(f)}</div>
            <div class="co-issue-desc">${a(r.description||r.impact||"")}</div>
            <div class="co-contract-requires">${_.join("")}</div>
            <div class="co-contract-actions">
                <button class="co-contract-btn primary" data-action="ack-issue" data-id="${a(r.id)}">Acknowledge ▸</button>
            </div>
        </div>`});e.innerHTML=o.concat(i).join("")}let P=new Set,E=new Set;async function he(e){if(!(!e||E.has(e))){E.add(e),N();try{const{data:t,error:s}=await g.rpc("accept_loan_offer",{p_offer_id:e});s?p("Failed: "+s.message,"error"):t?.success?p("Offer accepted. Awaiting bank disbursement.","success"):p(t?.error||"Failed to accept","error"),await M()}catch(t){console.error("[corp-operations] accept_loan_offer failed:",t),p("Accept failed: "+(t?.message||"unknown"),"error")}finally{E.delete(e),N()}}}async function ke(e){if(!(!e||E.has(e))){E.add(e),N();try{const{data:t,error:s}=await g.rpc("reject_loan_offer",{p_offer_id:e});s?p("Failed: "+s.message,"error"):t?.success?p("Offer rejected.","success"):p(t?.error||"Failed to reject","error"),await M()}catch(t){console.error("[corp-operations] reject_loan_offer failed:",t),p("Reject failed: "+(t?.message||"unknown"),"error")}finally{E.delete(e),N()}}}async function $e(e){if(!P.has(e)){P.add(e);try{const{data:t,error:s}=await g.rpc("acknowledge_corp_contract_event",{p_event_id:e,p_response_key:null});if(s)return p("Failed: "+s.message,"error");if(t&&t.success===!1)return p(t.error||"Failed to acknowledge","error");const n=t?.cost_applied?` − ${y(t.cost_applied)}`:"",o=t?.delay_applied?` ◊ +${t.delay_applied}t delay`:"";p(`Acknowledged${n}${o}`,"success"),await V(),await M()}catch(t){console.error("[corp-operations] acknowledge failed:",t),p("Acknowledge failed: "+(t?.message||"unknown"),"error")}finally{P.delete(e)}}}let x=[],$=[],D=new Map,j=!1,F=!1;function y(e){const t=Number(e)||0,s=t<0?"-":"",n=Math.abs(t);return n>=1e9?s+"$"+(n/1e9).toFixed(2)+"B":n>=1e6?s+"$"+(n/1e6).toFixed(1)+"M":n>=1e3?s+"$"+(n/1e3).toFixed(1)+"k":s+"$"+Math.round(n).toLocaleString()}const Z=["id","contract_number","name","description","contract_type","issuer_name","issuer_nation_id","budget","timeline_months","status","requirements","expires_at_tick","deadline_tick","expected_finish_tick","started_at_tick","progress_pct","amount_spent","crews_assigned","winner_faction_id"].join(", ")+", nations:issuer_nation_id(name)";async function W(){const{data:e}=await g.from("corp_properties").select("nation_id").eq("faction_id",c.id).eq("role","regional_hq").eq("is_active",!0),t=Array.from(new Set([c.nation_id,...(e||[]).map(i=>i.nation_id).filter(Boolean)])),[s,n]=await Promise.all([g.from("corp_contracts").select(Z).eq("required_sector","Construction").eq("status","open").in("issuer_nation_id",t).order("budget",{ascending:!1}).limit(40),g.from("corp_contracts").select(Z).eq("winner_faction_id",c.id).in("status",["awarded","active"]).order("expected_finish_tick",{ascending:!0})]);s.error?(console.error("[corp-operations] available contracts error:",s.error.message),x=[]):x=s.data||[],n.error?(console.error("[corp-operations] active contracts error:",n.error.message),$=[]):$=n.data||[],D=new Map;const o=x.map(i=>i.id);if(o.length>0){const{data:i,error:r}=await g.from("corp_contract_bids").select("contract_id, bid_amount, crews_committed, markup_pct, quoted_timeline_months").eq("faction_id",c.id).in("contract_id",o);if(r)console.warn("[corp-operations] my bids fetch failed:",r.message);else for(const u of i||[])D.set(u.contract_id,u)}ne(),Ce()}function ne(){const e=document.getElementById("co-available-list"),t=document.getElementById("co-available-meta");if(!e||!t)return;const s=re(),n=x.filter(o=>!s.has(o.id));if(n.length===0){t.textContent="None open",e.innerHTML='<div class="co-contract-empty">No open contracts at the moment. Check back next tick.</div>';return}t.textContent=`${n.length} Open Bid${n.length===1?"":"s"}`,e.innerHTML=n.map(xe).join("")}function Ce(){const e=document.getElementById("co-active-list"),t=document.getElementById("co-active-meta");if(!e||!t)return;if($.length===0){t.textContent="None active",e.innerHTML='<div class="co-contract-empty">No active contracts. Win a bid to get going.</div>';return}const s=$.reduce((n,o)=>n+(Number(o.budget)||0),0);t.textContent=`${$.length} In Progress ◊ Total Value ${y(s)}`,e.innerHTML=$.map(Be).join("")}function oe(e){const t=String(e||"").toLowerCase();return t==="private"?"private":t==="foreign"?"foreign":"gov"}function ae(e){switch(e){case"work_crews":return"Work Crews";case"regulatory_standing":return"Reg. Standing";case"supply_chain":return"Supply Chain";default:return e}}function Ee(e){if(!c)return null;switch(e){case"work_crews":return Number(c.corp_work_crews??0);case"regulatory_standing":return Number(c.corp_regulatory_standing??0);case"supply_chain":return Number(c.corp_supply_chain??0);default:return null}}function xe(e){const t=oe(e.contract_type),s=String(e.contract_type||"GOVERNMENT"),n=Number(C?.current_tick)||0,o=e.expires_at_tick!=null?Math.max(0,e.expires_at_tick-n):null,i=o==null?"No deadline":o<=0?"Closing now":`Closes in ${o} tick${o===1?"":"s"}`,r=e.requirements&&typeof e.requirements=="object"?e.requirements:{},u=Number(r.work_crews)||0;let l=!0;const f=Object.entries(r).map(([h,k])=>{const q=Ee(h),T=Number(k),B=q!=null&&Number.isFinite(T)&&q>=T;return B||(l=!1),`<span class="co-req-chip ${B?"met":"unmet"}">${B?"✓":"✗"} ${a(ae(h))} ${a(String(k))}+</span>`}).join(""),m=e.issuer_name?`— ${a(e.issuer_name)}${e.nations?.name?`, ${a(e.nations.name)}`:""}`:"— Unknown issuer",d=D.get(e.id),b=l?"Place Bid ▸":"Requirements Unmet",_=l?`data-action="bid" data-id="${a(e.id)}"`:"disabled",w=d?`<div class="co-contract-bid-placed">
                ✓ Bid Placed — ${y(d.bid_amount)}
                ${d.quoted_timeline_months?` · ${d.quoted_timeline_months} ticks`:""}
                ${d.crews_committed?` · ${d.crews_committed} crew${d.crews_committed===1?"":"s"}`:""}
           </div>`:`<div class="co-contract-actions">
                <button class="co-contract-btn" data-action="decline" data-id="${a(e.id)}">Decline</button>
                <button class="co-contract-btn primary" ${_}>${b}</button>
           </div>`;return`<div class="co-contract-card">
        <div class="co-contract-meta-row">
            <span class="co-contract-tag ${t}">${a(s)}</span>
            <span class="co-contract-deadline">${a(i)}</span>
        </div>
        <div class="co-contract-name">${a(e.name||"Untitled Contract")}</div>
        <div class="co-contract-client">${m}</div>
        <div class="co-contract-stats">
            <div>
                <div class="label">Value</div>
                <div class="value green">${y(e.budget)}</div>
            </div>
            <div>
                <div class="label">Duration</div>
                <div class="value">${e.timeline_months||"—"}<span style="font-size:11px;color:var(--co-text-tertiary);"> ticks</span></div>
            </div>
            <div>
                <div class="label">Crews Required</div>
                <div class="value">${u||"—"}</div>
            </div>
        </div>
        ${f?`<div class="co-contract-requires">${f}</div>`:""}
        ${w}
    </div>`}function Be(e){const t=oe(e.contract_type),s=String(e.contract_type||"GOVERNMENT"),n=Number(C?.current_tick)||0,o=Math.max(0,Math.min(100,Number(e.progress_pct)||0)),i=e.deadline_tick!=null?n-e.deadline_tick:0,r=i>0&&o<100,u=r?`Behind schedule — ${i} tick${i===1?"":"s"}`:e.expected_finish_tick!=null?`Due ${a(te(e.expected_finish_tick))}`:"No deadline",l=Number(e.budget)||0,f=Number(e.amount_spent)||0,m=l>0?(l-f)/l*100:0,d=l>0?`${m.toFixed(1)}%`:"—",b=m<5?" warn":"";return`<div class="co-contract-card">
        <div class="co-contract-meta-row">
            <span class="co-contract-tag ${t}">${a(s)}</span>
            <span class="co-contract-deadline${r?" warn":""}">${a(u)}</span>
        </div>
        <div class="co-contract-name">${a(e.name||"Untitled Contract")}</div>
        <div class="co-contract-client">— ${a(e.issuer_name||"Unknown issuer")}</div>
        <div class="co-contract-stats">
            <div>
                <div class="label">Value</div>
                <div class="value green">${y(l)}</div>
            </div>
            <div>
                <div class="label">Crews Assigned</div>
                <div class="value">${Number(e.crews_assigned||0).toFixed(0)}</div>
            </div>
            <div>
                <div class="label">Margin</div>
                <div class="value${b}">${d}</div>
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
            <button class="co-contract-btn" data-action="manage-crews" data-id="${a(e.id)}">Manage Crews</button>
            <button class="co-contract-btn" data-action="renegotiate"  data-id="${a(e.id)}">Renegotiate</button>
            <button class="co-contract-btn" data-action="view-details" data-id="${a(e.id)}">Details</button>
        </div>
    </div>`}function ie(){return`co-declined-${c?.id||"anon"}`}function re(){try{const e=localStorage.getItem(ie());return new Set(e?JSON.parse(e):[])}catch{return new Set}}function Ae(e){const t=re();t.add(e);try{localStorage.setItem(ie(),JSON.stringify(Array.from(t)))}catch{}}function Ne(){document.getElementById("co-available-list")?.addEventListener("click",ee),document.getElementById("co-active-list")?.addEventListener("click",ee),document.getElementById("co-issues-list")?.addEventListener("click",e=>{const t=e.target.closest("[data-action]");if(!t||t.disabled)return;const s=t.getAttribute("data-action"),n=t.getAttribute("data-id");if(n){if(s==="ack-issue")return $e(n);if(s==="accept-offer")return he(n);if(s==="reject-offer")return ke(n)}}),document.getElementById("co-modal-overlay")?.addEventListener("click",e=>{(e.target===e.currentTarget||e.target.matches("[data-modal-close]"))&&S()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&S()})}async function ee(e){const t=e.target.closest(".co-contract-btn");if(!t||t.disabled)return;const s=t.getAttribute("data-action"),n=t.getAttribute("data-id");if(!(!s||!n)){if(s==="decline"){Ae(n),ne();return}if(s==="bid"){const o=x.find(i=>i.id===n);o&&Ie(o);return}if(s==="view-details"){const o=$.find(i=>i.id===n)||x.find(i=>i.id===n);o&&Me(o);return}if(s==="manage-crews"){const o=$.find(i=>i.id===n);o&&Re(o);return}if(s==="renegotiate"){p("Renegotiation isn't available yet.","error");return}}}const Se={1:1,2:1.05,3:1.1},qe={1:1,2:.8,3:.7};function Te(e,t,s){const n=1.3-(Number(c.corp_supply_chain)||0)*.06,o=Se[t]||1,i=qe[t]||1,r=(Number(e.budget)||0)*.7,u=Math.round(r*n*o*(1+s/100)),l=Math.round((Number(e.timeline_months)||0)*i);return{bidAmount:u,months:l,supplyMult:n,crewCost:o,crewTime:i}}function Ie(e){const t=document.getElementById("co-modal");if(!t)return;t.classList.add("co-bid-modal");const s=Math.floor(Number(c.corp_work_crews)||0),n=Number(c.corp_regulatory_standing)||0,o=Number(c.corp_supply_chain)||0,i=e.requirements&&typeof e.requirements=="object"?e.requirements:{},r=Number(i.regulatory_standing)||0,u={1:s>=1,2:s>=2,3:s>=3};let l=u[3]?3:u[2]?2:(u[1],1),f=30;const m=()=>{const{bidAmount:d,months:b,supplyMult:_}=Te(e,l,f),w=Number(e.budget)||0,h=w>0?d/w*100:0,k=d>w,q=[1,2,3].map(v=>{const J=u[v];return`<button type="button" class="co-bid-pill${v===l&&J?" active":""}"
                    data-bid-crews="${v}" ${J?"":"disabled"}>
                <strong>${v} crew${v===1?"":"s"}</strong>
                <span class="sub">${v===1?"baseline":v===2?"−20% time · ×1.05 cost":"−30% time · ×1.10 cost"}</span>
            </button>`}).join(""),T=[10,20,30,40,50].map(v=>`<button type="button" class="co-bid-pill${v===f?" active":""}"
                    data-bid-markup="${v}">${v}%</button>`).join(""),B=n>=r?"good":"warn",G=`${n.toFixed(n%1===0?0:1)}<span class="muted"> / 10${r?` · req ${r}+`:""}</span>`,de=k?"warn":h<85?"good":"",ue=`${y(d)}<span class="muted"> · ${h.toFixed(0)}% of budget</span>`,K=5e4,Y=!u[l],R=(Number(c.corp_cash_reserves)||0)<K,z=n<r,pe=Y||R||z,me=R?"Need $50k":z?`Need Reg. ${r}+`:Y?"No crews available":"Submit Bid ▸";t.innerHTML=`
            <div class="co-modal-title">Place Bid — ${a(e.name||"Contract")}</div>
            <div class="co-modal-body" style="margin-bottom:12px;">
                <strong>${a(e.issuer_name||"Unknown issuer")}</strong>
                ${e.nations?.name?`, ${a(e.nations.name)}`:""}
                · Budget <strong>${y(w)}</strong>
                · Timeline <strong>${e.timeline_months||"—"} ticks</strong>
            </div>

            <div class="co-bid-section">
                <div class="co-bid-section-title">Work Crews</div>
                <div class="co-bid-button-row" id="co-bid-crews">${q}</div>
                <div class="co-bid-section-help">More crews shorten the timeline at a slightly higher cost. Your Work Crews stat caps the maximum (you have <strong>${s}</strong>).</div>
            </div>

            <div class="co-bid-section">
                <div class="co-bid-section-title">Markup</div>
                <div class="co-bid-button-row" id="co-bid-markup">${T}</div>
                <div class="co-bid-section-help">Profit you add over your computed cost. Lower markup wins more bids; higher markup grows your margin if you win.</div>
            </div>

            <div class="co-bid-section co-bid-summary">
                <div class="co-bid-summary-title">What the issuer sees</div>
                <div class="co-bid-summary-row">
                    <span class="label">Timeline</span>
                    <span class="value">${b}<span class="muted"> tick${b===1?"":"s"}</span></span>
                </div>
                <div class="co-bid-summary-row">
                    <span class="label">Cost</span>
                    <span class="value ${de}">${ue}</span>
                </div>
                <div class="co-bid-summary-row">
                    <span class="label">Regulatory Standing</span>
                    <span class="value ${B}">${G}</span>
                </div>
            </div>

            <div class="co-bid-section co-bid-summary" style="margin-top:14px;">
                <div class="co-bid-summary-title">Your side</div>
                <div class="co-bid-summary-row">
                    <span class="label">Supply Chain mult</span>
                    <span class="value">${_.toFixed(2)}×<span class="muted"> · supply ${o.toFixed(o%1===0?0:1)}/10</span></span>
                </div>
                <div class="co-bid-summary-row">
                    <span class="label">Bid Fee</span>
                    <span class="value ${R?"warn":""}">${y(K)}<span class="muted"> · cash ${y(Number(c.corp_cash_reserves)||0)}</span></span>
                </div>
            </div>

            <div class="co-modal-actions" style="margin-top:18px;">
                <button class="co-contract-btn" data-modal-close>Cancel</button>
                <button class="co-contract-btn primary" id="co-bid-submit" ${pe?"disabled":""}>${a(me)}</button>
            </div>
        `,t.querySelectorAll("[data-bid-crews]").forEach(v=>{v.addEventListener("click",()=>{v.disabled||(l=Number(v.getAttribute("data-bid-crews")),m())})}),t.querySelectorAll("[data-bid-markup]").forEach(v=>{v.addEventListener("click",()=>{f=Number(v.getAttribute("data-bid-markup")),m()})}),t.querySelector("#co-bid-submit")?.addEventListener("click",()=>{Le(e.id,l,f)})};m(),document.getElementById("co-modal-overlay").classList.add("open")}async function Le(e,t,s){if(j)return;j=!0;const n=document.getElementById("co-bid-submit");n&&(n.disabled=!0);try{const{data:o,error:i}=await g.rpc("place_construction_bid",{p_contract_id:e,p_bidder_faction_id:c.id,p_crews_committed:t,p_markup_pct:s,p_bid_message:null});if(i){p(i.message,"error");return}if(!o?.success){p(o?.error||"Failed to place bid","error");return}p(`Bid placed: ${y(o.bid_amount)} · ${o.quoted_timeline_months} ticks`,"success"),S(),await V(),await W()}catch(o){console.error("[corp-operations] place bid failed:",o),p("Failed to place bid: "+(o?.message||"unknown"),"error")}finally{j=!1,n&&(n.disabled=!1)}}function Me(e){const t=document.getElementById("co-modal");if(!t)return;const s=e.requirements&&typeof e.requirements=="object"?e.requirements:{},n=Object.entries(s).map(([o,i])=>`<div class="co-modal-detail-row">
            <span class="label">${a(ae(o))}</span>
            <span class="value">≥ ${a(String(i))}</span>
        </div>`).join("");t.innerHTML=`
        <div class="co-modal-title">${a(e.name||"Contract")}</div>
        <div class="co-modal-body">
            ${e.description?`<p>${a(e.description)}</p>`:'<p style="color:var(--co-text-tertiary);font-style:italic;">No description.</p>'}
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Contract Number</span>
            <span class="value">${a(e.contract_number||"—")}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Type</span>
            <span class="value">${a(e.contract_type||"—")}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Issuer</span>
            <span class="value">${a(e.issuer_name||"—")}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Budget</span>
            <span class="value">${y(e.budget)}</span>
        </div>
        <div class="co-modal-detail-row">
            <span class="label">Timeline</span>
            <span class="value">${e.timeline_months||"—"} ticks</span>
        </div>
        ${n||'<div class="co-modal-detail-row"><span class="label">Requirements</span><span class="value">None</span></div>'}
        <div class="co-modal-actions" style="margin-top:18px;">
            <button class="co-contract-btn" data-modal-close>Close</button>
        </div>
    `,document.getElementById("co-modal-overlay").classList.add("open")}function Re(e){const t=document.getElementById("co-modal");if(!t)return;const s=Number(c.corp_work_crews)||0,n=Number(e.crews_assigned)||0;t.innerHTML=`
        <div class="co-modal-title">Manage Crews — ${a(e.name||"")}</div>
        <div class="co-modal-body">
            Allocate work crews to this contract. Maximum is your corporation's
            <strong>Work Crews</strong> stat (<strong>${s}</strong>). More crews accelerate progress but
            reduce capacity for parallel contracts.
        </div>
        <input type="number" min="0" max="${s}" step="0.5" value="${n}"
               class="co-modal-input" id="co-crews-input"
               aria-label="Crews assigned" />
        <div class="co-modal-actions">
            <button class="co-contract-btn" data-modal-close>Cancel</button>
            <button class="co-contract-btn primary" id="co-crews-confirm" data-id="${a(e.id)}">Confirm</button>
        </div>
    `,document.getElementById("co-modal-overlay").classList.add("open"),document.getElementById("co-crews-confirm")?.addEventListener("click",async()=>{if(F)return;const o=document.getElementById("co-crews-input"),i=Number(o?.value);if(!Number.isFinite(i)){p("Crews must be a number","error");return}const r=document.getElementById("co-crews-confirm");F=!0,r.disabled=!0;try{const{data:u,error:l}=await g.rpc("assign_construction_crews",{p_contract_id:e.id,p_crews:i});if(l){p(l.message,"error");return}if(!u?.success){p(u?.error||"Failed to update crews","error");return}p("Crews updated.","success"),S(),await W()}catch(u){console.error("[corp-operations] assign crews failed:",u),p("Failed: "+(u?.message||"unknown"),"error")}finally{F=!1,r.disabled=!1}},{once:!0})}function S(){document.getElementById("co-modal-overlay")?.classList.remove("open"),document.getElementById("co-modal")?.classList.remove("co-bid-modal")}const U=[{key:"hiring",name:"Hiring Initiative",options:[{letter:"A",title:"Quick Hire Recruitment Drive",desc:"Rush new workers onto the books with minimal vetting — fast capacity, but materials budget gets squeezed.",cost:4e7,effects:{crews:2,supply:-2}},{letter:"B",title:"Comprehensive Talent Program",desc:"Build a full pipeline with apprenticeships and benefits — slower, but earns the labor ministry’s respect.",cost:7e7,effects:{crews:3,regulatory:1}}]},{key:"lobbying",name:"Government Lobbying",options:[{letter:"A",title:"Backroom Lobbying Campaign",desc:"Pull executives off worksites to schmooze ministers in private clubs — quiet influence, but crews suffer without leadership.",cost:5e7,effects:{regulatory:2,crews:-2}},{letter:"B",title:"Public Affairs & Industry Coalition",desc:"Lead a formal coalition that wins over both the press and your suppliers — slow, expensive, transformative.",cost:8e7,effects:{regulatory:3,supply:1}}]},{key:"megaproject",name:"Megaproject Bid Strategy",options:[{letter:"A",title:"Lowball Bid Strategy",desc:"Underbid the competition aggressively — wins the contract and ministry favor, but thin margins force cheap material sourcing.",cost:3e7,effects:{regulatory:2,supply:-2}},{letter:"B",title:"Premium Bid with Guarantees",desc:"Bid at full price with delivery and quality bonds — the regime sees you as a serious partner, and crews see job security.",cost:9e7,effects:{regulatory:3,crews:1}}]},{key:"material",name:"Material Sourcing",options:[{letter:"A",title:"Cheap Foreign Imports",desc:"Buy steel and machinery overseas at deep discount — supply problem solved, but nationalists in the regime won’t forget.",cost:4e7,effects:{supply:2,regulatory:-2}},{letter:"B",title:"Strategic Domestic Partnership",desc:"Lock in long-term contracts with domestic mills and quarries — costlier, but builds loyalty across the supply chain and your workforce.",cost:7e7,effects:{supply:3,crews:1}}]},{key:"vertical",name:"Vertical Integration",options:[{letter:"A",title:"Acquire Small Quarry",desc:"Buy out a regional gravel and limestone operation — secures basic materials, but workers reassigned to mining ops.",cost:6e7,effects:{supply:2,crews:-2}},{letter:"B",title:"Build Modern Cement Plant",desc:"Construct a flagship facility with the regime’s blessing — full supply independence and a ribbon-cutting with the President.",cost:1e8,effects:{supply:3,regulatory:1}}]},{key:"safety",name:"Worker Safety Program",options:[{letter:"A",title:"Mandatory Training Rollout",desc:"Pull crews off active sites for safety training — wins ministry approval but slows progress.",cost:4e7,effects:{regulatory:2,crews:-2}},{letter:"B",title:"Industry-Leading Safety Standards",desc:"Build a flagship safety program crews are proud of — costly but lifts morale and the regulator’s opinion together.",cost:8e7,effects:{regulatory:3,crews:1}}]},{key:"equipment",name:"Equipment Upgrade",options:[{letter:"A",title:"Used Machinery Purchase",desc:"Pick up second-hand fleet at auction — fast capacity, but parts and supply chain take a hit.",cost:5e7,effects:{crews:2,supply:-2}},{letter:"B",title:"New Fleet Investment",desc:"Order modern equipment direct from the manufacturer — lifts capacity and supply both, but the cheque is large.",cost:9e7,effects:{crews:3,supply:1}}]},{key:"patriotic",name:"Patriotic Project Acceptance",options:[{letter:"A",title:"Discounted Government Build",desc:"Accept a state project below market rate — wins favor, but pulls crews off paying work.",cost:3e7,effects:{regulatory:2,crews:-2}},{letter:"B",title:"Below-Cost Prestige Project",desc:"Take a flagship national build at a loss — the regime is grateful and supply partners follow.",cost:6e7,effects:{regulatory:3,supply:1}}]},{key:"apprenticeship",name:"Apprenticeship Program",options:[{letter:"A",title:"Basic Trades School Sponsorship",desc:"Bankroll a regional trades program — feeds the workforce, but ministers grumble about private capture of public training.",cost:4e7,effects:{crews:2,regulatory:-2}},{letter:"B",title:"National Engineering Initiative",desc:"Partner with the state on a national engineering program — lifts both crews and standing.",cost:8e7,effects:{crews:3,regulatory:1}}]},{key:"stockpile",name:"Stockpile Strategy",options:[{letter:"A",title:"Emergency Material Reserves",desc:"Bulk-buy materials for a rainy day — supply secured, but storage and handling pull crews off worksites.",cost:5e7,effects:{supply:2,crews:-2}},{letter:"B",title:"Strategic National Stockpile",desc:"Co-fund a national reserves program — supply security plus regulatory goodwill.",cost:9e7,effects:{supply:3,regulatory:1}}]}],Pe={crews:"Crews",regulatory:"Reg.",supply:"Supply"};let H=!1;function je(){const e=Number(c?.corp_construction_action_locked_until_tick)||0,t=Number(C?.current_tick)||0;return Math.max(0,e-t)}function ce(){const e=document.getElementById("co-actions-grid"),t=document.getElementById("co-actions-meta"),s=document.getElementById("co-actions-cooldown-pill");if(!e)return;const n=je(),o=n>0;e.classList.toggle("locked",o),s&&(s.innerHTML=o?`<span class="co-actions-cooldown-pill">🔒 Locked ${n} more tick${n===1?"":"s"}</span>`:""),t&&(t.textContent=o?`Locked until tick ${c.corp_construction_action_locked_until_tick}`:`${U.length} Initiatives ◊ Choose A or B (12-tick global cooldown)`),e.innerHTML=U.map((i,r)=>Fe(i,r,o)).join("")}function Fe(e,t,s){const n=e.options.map((o,i)=>He(e,o,t,i,s)).join("");return`<div class="co-action-card">
        <div class="co-action-name">${a(e.name)}</div>
        <div class="co-action-options">${n}</div>
    </div>`}function He(e,t,s,n,o){const i=le(t);return`<div class="co-action-option" ${o?'data-locked="1"':""}
                 data-action-key="${a(e.key)}"
                 data-choice="${a(t.letter)}"
                 data-card-idx="${s}" data-opt-idx="${n}">
        <span class="co-action-option-letter">${a(t.letter)}</span>
        <div class="co-action-option-content">
            <div class="co-action-option-title">${a(t.title)}</div>
            <div class="co-action-option-desc">${a(t.desc)}</div>
            <div class="co-action-option-effects">${i}</div>
        </div>
        <span class="co-action-option-cta">${o?"Locked":"Take ▸"}</span>
    </div>`}function le(e){const t=[`<span class="co-effect cost">−${y(e.cost).replace("-","")}</span>`];for(const[s,n]of Object.entries(e.effects||{})){const o=n>0?"+":"",i=n>0?"positive":"negative";t.push(`<span class="co-effect ${i}">${o}${n} ${a(Pe[s]||s)}</span>`)}return t.join("")}function Oe(){document.getElementById("co-actions-grid")?.addEventListener("click",e=>{const t=e.target.closest(".co-action-option");if(!t||t.hasAttribute("data-locked"))return;const s=Number(t.getAttribute("data-card-idx")),n=Number(t.getAttribute("data-opt-idx")),o=U[s],i=o?.options[n];!o||!i||De(o,i)})}function De(e,t){const s=document.getElementById("co-modal");if(!s)return;const n=le(t);s.innerHTML=`
        <div class="co-modal-title">Confirm: ${a(t.title)}</div>
        <div class="co-modal-body">
            <p style="margin-bottom:12px;"><strong>${a(e.name)} — Option ${a(t.letter)}</strong></p>
            <p style="margin-bottom:12px;">${a(t.desc)}</p>
            <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-bottom:14px;">${n}</div>
            <p style="font-family:var(--co-mono);font-size:11px;color:var(--co-accent-rust);letter-spacing:0.06em;text-transform:uppercase;">
                ⚠ This locks all 10 Strategic Actions for 12 ticks.
            </p>
        </div>
        <div class="co-modal-actions">
            <button class="co-contract-btn" data-modal-close>Cancel</button>
            <button class="co-contract-btn primary" id="co-action-confirm"
                    data-action-key="${a(e.key)}"
                    data-choice="${a(t.letter)}">Confirm ▸</button>
        </div>
    `,document.getElementById("co-modal-overlay").classList.add("open"),document.getElementById("co-action-confirm")?.addEventListener("click",async()=>{if(H)return;H=!0;const o=document.getElementById("co-action-confirm");o&&(o.disabled=!0);try{const{data:i,error:r}=await g.rpc("fire_construction_action",{p_corp_id:c.id,p_action_key:e.key,p_choice:t.letter});if(r){p(r.message,"error");return}if(!i?.success){p(i?.error||"Action failed","error");return}p("Action taken — locked for 12 ticks.","success"),S(),await V(),ce(),se()}catch(i){console.error("[corp-operations] fire_construction_action failed:",i),p("Failed: "+(i?.message||"unknown"),"error")}finally{H=!1,o&&(o.disabled=!1)}},{once:!0})}async function V(){const{data:e,error:t}=await g.from("factions").select("corp_cash_reserves, corp_work_crews, corp_regulatory_standing, corp_supply_chain, corp_construction_action_locked_until_tick, action_points").eq("id",c.id).single();if(t||!e){console.error("[corp-operations] refetch faction state failed:",t?.message);return}Object.assign(c,e)}function p(e,t){document.querySelectorAll(".co-toast").forEach(n=>n.remove());const s=document.createElement("div");s.className="co-toast"+(t?" "+t:""),s.textContent=e,document.body.appendChild(s),setTimeout(()=>{s.classList.add("fade"),setTimeout(()=>s.remove(),280)},3e3)}let c=null,C=null,O=[];async function Ue(){const{data:{user:e}}=await g.auth.getUser();if(!e){window.location.href="login.html";return}const s=new URL(location.href).searchParams.get("faction_id"),{data:n,error:o}=await g.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);if(o){A("Failed to load factions: "+o.message);return}if(O=(n||[]).filter(d=>d.nation_id),s){const{data:d,error:b}=await g.from("factions").select("*").eq("id",s).single();if(b||!d){A("Inspector faction not found.");return}c=d}else c=O.find(d=>d.faction_type==="corporation");if(!c||c.faction_type!=="corporation"){A("No corporation linked to this account.");return}const i=c.corp_sector||"";if(i!=="Construction"){const d=ge[i]||"corp-dashboard.html",b=s?`?faction_id=${encodeURIComponent(s)}`:"";window.location.replace(d+b);return}const[r,u,l]=await Promise.all([g.from("shard").select("current_tick, current_date, name, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single(),c.nation_id?g.from("nations").select("id, name, capital").eq("id",c.nation_id).single():Promise.resolve({data:null,error:null}),g.from("corp_contracts").select("id",{count:"exact",head:!0}).eq("winner_faction_id",c.id).in("status",["awarded","active"])]);if(r.error){A("Failed to load shard: "+r.error.message);return}C=r.data,u?.data,u?.error&&console.error("[corp-operations] nation fetch error:",u.error.message),l?.error&&console.error("[corp-operations] active contracts count error:",l.error.message);const f=l?.count??0,m=document.getElementById("corp-topbar-container");if(m)try{const{renderCorpTopBar:d}=await fe(async()=>{const{renderCorpTopBar:b}=await import("./corp-topbar-BOR6jYkY.js");return{renderCorpTopBar:b}},__vite__mapDeps([0,1]));d(m,{faction:c,shard:C,activeTab:"operations",allUserFactions:O})}catch(d){console.error("[corp-operations] topbar render failed:",d)}document.getElementById("co-active-count").textContent=String(f),document.getElementById("co-footer-date").textContent=C?.current_date||te(C?.current_tick)||"—",se(),ce(),Ne(),Oe(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="",W(),M()}function A(e){const t=document.getElementById("loading");t.textContent=e,t.style.color="var(--co-accent-red)"}Ue().catch(e=>{console.error("[corp-operations] init failed:",e),A("Failed to load: "+(e?.message||"unknown error"))});
