const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-Dar6x8XP.js","assets/preload-helper-BXl3LOEh.js","assets/factions-qe2qC_cj.js"])))=>i.map(i=>d[i]);
import{_supabase as k}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as ce}from"./preload-helper-BXl3LOEh.js";import{e as o,h as $}from"./utils-oN1e812_.js";import{m as le}from"./lawsuit-pressing-issues-Dz6DGIDC.js";import{m as de}from"./loan-pressing-issues-CcJntQcw.js";import{SECTOR_OPS_PAGE as ue}from"./corp-topbar-Dar6x8XP.js";import"./lawsuit-types-mDq47olK.js";import"./factions-qe2qC_cj.js";function fe(e){const t=Number(e)||0;return t>=7?"good":t>=4?"mid":"warn"}function pe(e){const t=Number(e)||0;return t>=8?"danger":t>=7?"warn":t>=4?"mid":"good"}const me=[{key:"freighters",column:"corp_freighters",eyebrow:"CAPACITY",name:"Freighters",emName:"",tooltip:"Cargo vessels in your active fleet. Each freighter carries 3 units/tick on a trade route, regardless of commodity. More freighters means you can offer larger volumes on shipping contracts and run more lanes simultaneously.",blurb:{good:"<strong>Plentiful capacity.</strong> Spare freighters across multiple lanes; room to bid on new routes without straining the fleet.",mid:"<strong>Working fleet.</strong> Capacity is matched to active routes — taking on more lanes will require expansion.",warn:"<strong>Stretched thin.</strong> Few spare freighters. Bidding for new routes risks under-staffing existing lanes."},impacts:{good:[{label:"Fleet Tier",value:"Strong"},{label:"New-Route Cap",value:"3+",tone:"good"}],mid:[{label:"Fleet Tier",value:"Adequate"},{label:"New-Route Cap",value:"1–2"}],warn:[{label:"Fleet Tier",value:"Tight"},{label:"New-Route Cap",value:"0",tone:"rust"}]}},{key:"health",column:"corp_fleet_health",eyebrow:"VITALITY",name:"Fleet",emName:"Health",tooltip:"The average maintenance state of your vessels. High health means low breakdown risk, favorable insurance premiums, and smooth deliveries. Low health stacks the drydock queue, lifts insurer premiums, and risks contract penalties from missed deadlines.",blurb:{good:"<strong>Vessels in top condition.</strong> Maintenance is current; insurance underwriters favor your premiums; breakdowns are rare.",mid:"<strong>Mid-tier maintenance.</strong> The fleet is functional but maintenance backlog is creeping in. A drydock pass would help.",warn:"<strong>Maintenance backlog.</strong> Vessels overdue for service; underwriters flagging risk; breakdown probability climbing."},impacts:{good:[{label:"Drydock Queue",value:"Empty",tone:"good"},{label:"Breakdown Risk",value:"Low"}],mid:[{label:"Drydock Queue",value:"1–2"},{label:"Breakdown Risk",value:"Moderate"}],warn:[{label:"Drydock Queue",value:"3+",tone:"rust"},{label:"Breakdown Risk",value:"Elevated",tone:"warn"}]}},{key:"risk",column:"corp_route_risk",eyebrow:"EXPOSURE",name:"Route",emName:"Risk",inverted:!0,tooltip:"Inverted stat — lower is better. Tracks how exposed your fleet is to piracy, contested waters, and chokepoints. High risk means premiums climb, sanctions exposure rises, and one incident can trigger a cascading rate hike. Diversification and naval-escort modifiers bring it down.",blurb:{good:"<strong>Exposure is well-spread.</strong> Routes are diversified across stable corridors; insurance premiums are baseline; sanctions risk negligible.",mid:"<strong>Moderate concentration.</strong> A meaningful slice of revenue runs through one or two contested lanes. A diversification action would help.",warn:"<strong>Concentrated exposure.</strong> Most revenue runs through contested chokepoints. Premiums are climbing; sanctions risk is real.",danger:"<strong>Stressed corridor exposure.</strong> The fleet is one incident away from a Crisis-tier rate hike. Diversification or insurance overhaul is overdue."},impacts:{good:[{label:"Premium Mult",value:"×1.0",tone:"good"},{label:"Sanctions",value:"Low"}],mid:[{label:"Premium Mult",value:"×1.2"},{label:"Sanctions",value:"Moderate"}],warn:[{label:"Premium Mult",value:"×1.4",tone:"rust"},{label:"Sanctions",value:"High",tone:"rust"}],danger:[{label:"Premium Mult",value:"×1.7",tone:"warn"},{label:"Sanctions",value:"Critical",tone:"warn"}]}}];function ve(e){const t=Number(u?.[e.column]??0),s=t.toFixed(1).replace(/\.0$/,""),i=e.inverted?pe(t):fe(t),n=Math.max(0,Math.min(10,Math.round(t))),a=Array.from({length:10},(m,v)=>{const _=v<n,y=e.inverted&&_&&v>=7,h=["so-hero-meter-cell"];return _&&h.push("filled"),y&&h.push("danger"),`<div class="${h.join(" ")}"></div>`}).join(""),r=e.blurb?.[i]||e.blurb?.warn||"",f=(e.impacts?.[i]||e.impacts?.warn||[]).map(m=>`<div>
            <span class="label">${o(m.label)}</span>
            <span class="value${m.tone?" "+m.tone:""}">${o(m.value)}</span>
        </div>`).join(""),l=e.inverted?'<span class="so-inverted-note">⚠ HIGH = DANGER</span>':"",p=e.emName?`${o(e.name)} <em>${o(e.emName)}</em>`:o(e.name),d=e.tooltip?`<span class="so-hero-tip" data-tip="${o(e.tooltip).replace(/"/g,"&quot;")}" aria-label="What is ${o(e.name)}?">?</span>`:"";return`<div class="so-hero-stat" data-stat="${o(e.key)}">
        ${l}
        <div class="so-hero-stat-eyebrow">${o(e.eyebrow)}</div>
        <div class="so-hero-stat-name">${p}${d}</div>
        <div class="so-hero-stat-value-row">
            <div class="so-hero-stat-value">${o(s)}<span class="so-max">/10</span></div>
            <div class="so-hero-stat-trend neutral">— FOUNDING POSITION</div>
        </div>
        <div class="so-hero-meter">${a}</div>
        <div class="so-hero-stat-desc">${r}</div>
        <div class="so-hero-stat-impact">${f}</div>
    </div>`}function ee(){const e=document.getElementById("so-hero-stats");e&&(e.innerHTML=me.map(ve).join(""))}let u=null,R=null,S=[],L=[],P=[],Y=new Set,T=new Set,te=null,se=null,x=[],B=[],A=new Map,V=!1;function ge(e){const t=document.getElementById("loading");t.textContent=e,t.style.color="var(--so-accent-red)"}function g(e,t){document.querySelectorAll(".so-toast").forEach(i=>i.remove());const s=document.createElement("div");s.className="so-toast"+(t?" "+t:""),s.textContent=e,document.body.appendChild(s),setTimeout(()=>{s.classList.add("fade"),setTimeout(()=>s.remove(),280)},3e3)}async function ie(){if(!u?.id)return;const{data:e,error:t}=await k.from("factions").select("*").eq("id",u.id).single();if(t||!e){console.warn("[corp-shipping] faction refresh failed:",t?.message);return}u=e;const s=document.getElementById("topbar-cash");s&&(s.textContent="CASH: "+$(Number(u.corp_cash_reserves||0)))}function _e(e){const t=String(e||"").toUpperCase();return t==="CRITICAL"?"critical":t==="HIGH"?"high":t==="MODERATE"?"moderate":"low"}function Z(e,t){const s=Math.max(0,Number(e||0)-(Number(t)||0));return s<=0?"Resolving now":`Expires in ${s} tick${s===1?"":"s"}`}async function j(){if(!u?.id)return;const[e,t]=await Promise.all([k.from("corp_contract_events").select("id, contract_id, type, severity, title, description, impact, responses, expires_at_tick, corp_contracts:contract_id(name)").eq("faction_id",u.id).eq("status","ACTIVE").order("expires_at_tick",{ascending:!0}),k.from("bank_loan_offers").select(`
                id, offered_apr, offered_term_ticks, expires_at_tick,
                bank:factions!bank_faction_id ( faction_name, corp_ticker ),
                request:bank_loan_requests!inner ( principal, purpose )
            `).eq("status","pending").eq("request.requesting_faction_id",u.id).eq("request.status","pending").order("expires_at_tick",{ascending:!0})]);e.error?(console.warn("[corp-shipping] Pressing Issues fetch failed:",e.error.message),L=[]):L=e.data||[],t.error?(console.warn("[corp-shipping] Loan offers fetch failed:",t.error.message),P=[]):P=t.data||[],N()}function N(){const e=document.getElementById("pi-list"),t=document.getElementById("pi-count");if(!e)return;const s=te?.getCount?.()??0,i=se?.getCount?.()??0,n=L.length+P.length+s+i;if(t&&(t.textContent=`${n} OPEN`),L.length===0&&P.length===0){e.innerHTML=s===0?'<div class="pi-empty"><div class="pi-empty__text">No pressing issues right now.<br>Time-sensitive decisions<br>will appear here.</div></div>':"";return}const a=Number(R?.current_tick)||0,r=P.map(l=>{const p=Z(l.expires_at_tick,a),d=l.bank||{},m=l.request||{},v=d.corp_ticker||"—",_=d.faction_name||"Lender",y=Number(l.offered_apr)||0,h=Number(l.offered_term_ticks)||0,w=Number(m.principal)||0,c=m.purpose?String(m.purpose).trim():"",b=T.has(l.id);return`<div class="pi-issue-card kind-loan-offer">
            <div class="pi-issue-row">
                <span class="pi-issue-tag kind-loan-offer">LOAN OFFER ◊ FINANCE</span>
                <span class="pi-issue-deadline">${o(p)}</span>
            </div>
            <div class="pi-issue-title">${o(v)} — ${o(_)}</div>
            ${c?`<div class="pi-issue-sub">— ${o(c)}</div>`:""}
            <div class="pi-issue-terms">
                <span><span class="label">PRINCIPAL</span><span class="value">${o($(w))}</span></span>
                <span><span class="label">APR</span><span class="value">${y.toFixed(1)}%</span></span>
                <span><span class="label">TERM</span><span class="value">${h} TICKS</span></span>
            </div>
            <div class="pi-issue-actions">
                <button class="pi-btn primary" data-action="accept-offer" data-id="${o(l.id)}" ${b?"disabled":""}>
                    ${b?"Working…":"Accept ▸"}
                </button>
                <button class="pi-btn" data-action="reject-offer" data-id="${o(l.id)}" ${b?"disabled":""}>
                    Reject
                </button>
            </div>
        </div>`}),f=L.map(l=>{const p=Z(l.expires_at_tick,a),d=_e(l.severity),m=l.corp_contracts?.name||"Project",v=String(l.severity||"LOW").toUpperCase(),_=String(l.type||"").trim(),y=_?`${v} ◊ ${_}`:v,h=Array.isArray(l.responses)&&l.responses[0]||{},w=Number(h.cost)||0,c=Number(h.delay)||0,b=[];return w>0&&b.push(`<span><span class="label">COST</span><span class="value">−${o($(w))}</span></span>`),c>0&&b.push(`<span><span class="label">DELAY</span><span class="value">+${c}t</span></span>`),`<div class="pi-issue-card sev-${d}">
            <div class="pi-issue-row">
                <span class="pi-issue-tag sev-${d}">${o(y)}</span>
                <span class="pi-issue-deadline">${o(p)}</span>
            </div>
            <div class="pi-issue-title">${o(l.title||"Untitled")}</div>
            <div class="pi-issue-sub">— ${o(m)}</div>
            <div class="pi-issue-desc">${o(l.description||l.impact||"")}</div>
            ${b.length?`<div class="pi-issue-terms">${b.join("")}</div>`:""}
            <div class="pi-issue-actions">
                <button class="pi-btn primary" data-action="ack-issue" data-id="${o(l.id)}">Acknowledge ▸</button>
            </div>
        </div>`});e.innerHTML=r.concat(f).join("")}async function he(e){if(!(!e||T.has(e))){T.add(e),N();try{const{data:t,error:s}=await k.rpc("accept_loan_offer",{p_offer_id:e});s?g("Failed: "+s.message,"error"):t?.success?g("Offer accepted. Awaiting bank disbursement.","success"):g(t?.error||"Failed to accept","error"),await j()}catch(t){console.error("[corp-shipping] accept_loan_offer failed:",t),g("Accept failed: "+(t?.message||"unknown"),"error")}finally{T.delete(e),N()}}}async function be(e){if(!(!e||T.has(e))){T.add(e),N();try{const{data:t,error:s}=await k.rpc("reject_loan_offer",{p_offer_id:e});s?g("Failed: "+s.message,"error"):t?.success?g("Offer rejected.","success"):g(t?.error||"Failed to reject","error"),await j()}catch(t){console.error("[corp-shipping] reject_loan_offer failed:",t),g("Reject failed: "+(t?.message||"unknown"),"error")}finally{T.delete(e),N()}}}async function ke(e){if(!(!e||Y.has(e))){Y.add(e);try{const{data:t,error:s}=await k.rpc("acknowledge_corp_contract_event",{p_event_id:e,p_response_key:null});if(s)g("Failed: "+s.message,"error");else if(!t?.success)g(t?.error||"Failed to acknowledge","error");else{const i=t?.cost_applied?` − ${$(t.cost_applied)}`:"",n=t?.delay_applied?` ◊ +${t.delay_applied}t delay`:"";g(`Acknowledged${i}${n}`,"success"),await ie()}await j()}catch(t){console.error("[corp-shipping] acknowledge failed:",t),g("Acknowledge failed: "+(t?.message||"unknown"),"error")}finally{Y.delete(e)}}}function ye(){const e=document.getElementById("pi-list");!e||e.dataset.boundPi==="1"||(e.dataset.boundPi="1",e.addEventListener("click",t=>{const s=t.target.closest("[data-action]");if(!s||s.disabled)return;const i=s.getAttribute("data-action"),n=s.getAttribute("data-id");if(n){if(i==="ack-issue")return ke(n);if(i==="accept-offer")return he(n);if(i==="reject-offer")return be(n)}}))}const we=1e5,$e=6e5;function Ee(e){if(!e?.trade_agreement_id)return $(e?.revenue_per_tick);const t=Math.max(1,Number(e.freighters_required)||1),s=Math.max(1,Number(e.transit_ticks)||1),i=t*we/s,n=t*$e/s;return`Est. ${$(i)} – ${$(n)}`}async function Q(){if(!u?.id){x=[],A=new Map;return}const e=Number(R?.current_tick)||0,{data:t,error:s}=await k.from("shipping_contracts").select(`
            id, nation_id, issuer_name, contract_type, name, description,
            origin_port, destination_port, destination_nation_id,
            revenue_per_tick, term_ticks, transit_ticks, freighters_required,
            min_fleet_health, max_route_risk, expires_at_tick, award_criterion,
            trade_agreement_id, commodity, volume_required, delivery_priority,
            origin_nation:nations!nation_id ( name ),
            destination_nation:nations!destination_nation_id ( name )
        `).eq("status","open").gt("expires_at_tick",e).order("expires_at_tick",{ascending:!0});if(s){console.warn("[corp-shipping] available contracts fetch failed:",s.message),x=[],A=new Map;return}if(x=t||[],x.length>0){const i=x.map(a=>a.id),{data:n}=await k.from("shipping_contract_bids").select("id, contract_id, offered_revenue_per_tick, offered_term_ticks, status, freighters_allocated, modifiers, markup_pct, energy_per_tick, route_risk_delta").eq("bidder_faction_id",u.id).in("contract_id",i);A=new Map((n||[]).map(a=>[a.contract_id,a]))}else A=new Map}async function Ce(){if(!u?.id){B=[];return}const{data:e,error:t}=await k.from("shipping_contracts").select(`
            id, nation_id, issuer_name, contract_type, name,
            origin_port, destination_port, destination_nation_id,
            revenue_per_tick, term_ticks, freighters_required,
            awarded_at_tick, ends_at_tick, last_payment_tick, total_paid,
            trade_agreement_id, commodity, volume_required, delivery_priority,
            consecutive_missed_payments,
            origin_nation:nations!nation_id ( name ),
            destination_nation:nations!destination_nation_id ( name ),
            shipping_contract_bids!contract_id (
                status, freighters_allocated, modifiers, markup_pct,
                energy_per_tick, route_risk_delta
            )
        `).eq("status","awarded").eq("winner_faction_id",u.id).order("ends_at_tick",{ascending:!0});if(t){console.warn("[corp-shipping] active contracts fetch failed:",t.message),B=[];return}B=(e||[]).map(s=>{const i=(s.shipping_contract_bids||[]).find(n=>n.status==="accepted");return{...s,accepted_bid:i?{freighters_allocated:Number(i.freighters_allocated)||0,modifiers:Array.isArray(i.modifiers)?i.modifiers:[],markup_pct:Number(i.markup_pct)||0,energy_per_tick:Number(i.energy_per_tick)||0,route_risk_delta:Number(i.route_risk_delta)||0}:null}})}function X(){const e=document.getElementById("so-available-list"),t=document.getElementById("so-available-meta");if(!e)return;if(t&&(t.textContent=x.length===0?"No open routes":`${x.length} Open ◊ Click to Bid`),x.length===0){e.innerHTML='<div class="so-contract-empty">No open routes right now. New tenders post each tick.</div>';return}const s=Number(R?.current_tick)||0,i=Number(u?.corp_freighters||0),n=Number(u?.corp_fleet_health||0),a=Number(u?.corp_route_risk||0);e.innerHTML=x.map(r=>{const f=String(r.contract_type||"private").toLowerCase(),l=Math.max(0,Number(r.expires_at_tick||0)-s),p=l<=1?"urgent":"",d=l<=0?"Closing now":`Bid closes in ${l} tick${l===1?"":"s"}`,m=(r.origin_nation?.name||"—").toUpperCase(),v=(r.destination_nation?.name||r.origin_nation?.name||"—").toUpperCase(),_=i>=r.freighters_required,y=r.min_fleet_health==null||n>=r.min_fleet_health,h=r.max_route_risk==null||a<=r.max_route_risk,w=_&&y&&h,c=`<span class="so-req-chip ${_?"met":"unmet"}">${_?"✓":"✗"} Freighters ${r.freighters_required}+</span>`,b=r.min_fleet_health!=null?`<span class="so-req-chip ${y?"met":"unmet"}">${y?"✓":"✗"} Fleet Health ${Number(r.min_fleet_health).toFixed(1)}+</span>`:"",I=r.max_route_risk!=null?`<span class="so-req-chip ${h?"met":"unmet"}">${h?"✓":"✗"} Route Risk ≤ ${Number(r.max_route_risk).toFixed(1)}</span>`:"",C=A.get(r.id),q=C?.status,U=!!r.trade_agreement_id;let M;if(q==="pending")if(U){const re=Number(C.energy_per_tick)||0,ne=Number(C.offered_revenue_per_tick)||0;M=`<span class="so-contract-cta">OFFER PLACED ◊ ${re} ENERGY / ${o($(ne))} ▸ EDIT</span>`}else M=`<span class="so-contract-cta muted">BID PLACED ◊ ${o($(C.offered_revenue_per_tick))} / ${C.offered_term_ticks}T</span>`;else w?M=U?'<span class="so-contract-cta">OFFER ▸</span>':'<span class="so-contract-cta">BID ▸</span>':M='<span class="so-contract-cta muted">REQUIREMENTS UNMET</span>';const J=(U||q!=="pending")&&w;return`<div class="${`so-contract-card${J?"":" disabled"}`}" data-clickable="${J?"1":"0"}" data-contract-id="${o(r.id)}">
            <div class="so-contract-meta-row">
                <span class="so-contract-tag ${f}">${o(f.toUpperCase())}</span>
                <span class="so-contract-deadline ${p}">${o(d)}</span>
            </div>
            <div>
                <div class="so-contract-name">${o(r.name||"Route")}</div>
                <div class="so-contract-client">— ${o(r.issuer_name||"—")}</div>
            </div>
            <div class="so-route-corridor">
                <div class="so-route-port">
                    <span class="so-route-port-label">ORIGIN</span>
                    ◊ ${o((r.origin_port||"—").toUpperCase())}
                </div>
                <span class="so-route-arrow">━━━▸</span>
                <div class="so-route-port right">
                    <span class="so-route-port-label">DESTINATION</span>
                    ${o((r.destination_port||"—").toUpperCase())} ◊
                </div>
            </div>
            <div class="so-contract-stats">
                <div>
                    <div class="label">Revenue/Tick</div>
                    <div class="value green">${o(Ee(r))}</div>
                </div>
                <div>
                    <div class="label">Term</div>
                    <div class="value">${r.term_ticks} ticks</div>
                </div>
                <div>
                    <div class="label">Freighters Req.</div>
                    <div class="value">${r.freighters_required}</div>
                </div>
            </div>
            <div class="so-contract-requires">
                ${c}${b}${I}
            </div>
            <div class="so-contract-foot">
                <span>${o(m)}${v!==m?` → ${o(v)}`:""}</span>
                ${M}
            </div>
        </div>`}).join("")}function Ie(){const e=document.getElementById("so-active-list"),t=document.getElementById("so-active-meta"),s=document.getElementById("so-active-count");if(!e)return;if(s&&(s.textContent=String(B.length)),B.length===0){t&&(t.textContent="No active routes"),e.innerHTML='<div class="so-contract-empty">No active routes. Bid on Available Routes to start carrying.</div>';return}const i=B.reduce((a,r)=>a+(Number(r.revenue_per_tick)||0),0);t&&(t.textContent=`${B.length} Active ◊ ${$(i)}/Tick`);const n=Number(R?.current_tick)||0;e.innerHTML=B.map(a=>{const r=String(a.contract_type||"private").toLowerCase(),f=Math.max(0,Number(a.ends_at_tick||0)-n),l=`Ends in ${f} tick${f===1?"":"s"}`,p=Number(a.total_paid)||0,d=a.accepted_bid;let m="";if(d&&a.trade_agreement_id){const v=(d.modifiers||[]).filter(c=>c&&c!=="known"),_={dangerous_waters:"Dangerous Waters",naval_escort:"Naval Escort",premium_insurance:"Premium Insurance",bribe_port:"Bribe Port Authorities",rush_schedule:"Rush Schedule"},y=v.length===0?'<span class="so-active-mod-chip baseline">Known Route only</span>':v.map(c=>`<span class="so-active-mod-chip">${o(_[c]||c)}</span>`).join(""),h=d.route_risk_delta>0?"var(--so-accent-red)":d.route_risk_delta<0?"var(--so-accent-green)":"var(--so-text-secondary)",w=d.route_risk_delta>0?"+":"";m=`<div class="so-active-offer-block">
                <div class="so-active-offer-header">
                    <span>Your Offer</span>
                    <span class="so-active-offer-priority">${o((a.delivery_priority||"").toUpperCase())}</span>
                </div>
                <div class="so-active-offer-row">
                    <span class="label">Energy/Tick</span>
                    <span class="value gold">${d.energy_per_tick}</span>
                </div>
                <div class="so-active-offer-row">
                    <span class="label">Freighters Allocated</span>
                    <span class="value">${d.freighters_allocated}</span>
                </div>
                <div class="so-active-offer-row">
                    <span class="label">Markup</span>
                    <span class="value">${d.markup_pct}%</span>
                </div>
                <div class="so-active-offer-row">
                    <span class="label">Route Risk Δ</span>
                    <span class="value" style="color:${h};">${w}${d.route_risk_delta}</span>
                </div>
                <div class="so-active-offer-mods">${y}</div>
            </div>`}return`<div class="so-contract-card" data-clickable="0">
            <div class="so-contract-meta-row">
                <span class="so-contract-tag ${r}">${o(r.toUpperCase())}</span>
                <span class="so-contract-deadline">${o(l)}</span>
            </div>
            <div>
                <div class="so-contract-name">${o(a.name||"Route")}</div>
                <div class="so-contract-client">— ${o(a.issuer_name||"—")}</div>
            </div>
            <div class="so-route-corridor">
                <div class="so-route-port">
                    <span class="so-route-port-label">ORIGIN</span>
                    ◊ ${o((a.origin_port||"—").toUpperCase())}
                </div>
                <span class="so-route-arrow">━━━▸</span>
                <div class="so-route-port right">
                    <span class="so-route-port-label">DESTINATION</span>
                    ${o((a.destination_port||"—").toUpperCase())} ◊
                </div>
            </div>
            <div class="so-route-status${(Number(a.consecutive_missed_payments)||0)>0?" warn":""}">
                <span class="dot"></span>
                <span class="text">${(Number(a.consecutive_missed_payments)||0)>0?`STATUS: <strong>PAYMENT DELAYED</strong> · ${Number(a.consecutive_missed_payments)} missed tick${Number(a.consecutive_missed_payments)===1?"":"s"}`:"STATUS: <strong>RUNNING</strong>"}</span>
            </div>
            <div class="so-contract-stats">
                <div>
                    <div class="label">Revenue/Tick</div>
                    <div class="value green">${o($(a.revenue_per_tick))}</div>
                </div>
                <div>
                    <div class="label">Vessels</div>
                    <div class="value">${a.freighters_required}</div>
                </div>
                <div>
                    <div class="label">Total Paid</div>
                    <div class="value">${o($(p))}</div>
                </div>
            </div>
            ${m}
        </div>`}).join("")}function xe(e){const t=x.find(y=>y.id===e);if(!t)return;if(t.trade_agreement_id)return Be(t);if(A.has(t.id))return;const s=document.getElementById("so-modal-overlay"),i=document.getElementById("so-modal");if(!s||!i)return;const n=Number(u?.corp_freighters||0),a=Number(u?.corp_fleet_health||0),r=Number(u?.corp_route_risk||0),f=n>=t.freighters_required,l=t.min_fleet_health==null||a>=t.min_fleet_health,p=t.max_route_risk==null||r<=t.max_route_risk;let d=null;f?l?p||(d=`Route Risk too high: ≤ ${Number(t.max_route_risk).toFixed(1)} required, you are at ${r}.`):d=`Fleet Health below minimum: ${Number(t.min_fleet_health).toFixed(1)}+ required, you are at ${a}.`:d=`Insufficient freighters: contract requires ${t.freighters_required}, you have ${n}.`;const m=Number(t.revenue_per_tick)||0,v=Number(t.term_ticks)||1,_={lowest_price:"LOWEST PRICE — bidder with the lowest revenue/tick wins.",fastest_delivery:"FASTEST DELIVERY — bidder with the shortest term wins.",lowest_risk:"LOWEST RISK — bidder with the lowest current Route Risk wins."}[t.award_criterion]||"LOWEST PRICE — bidder with the lowest revenue/tick wins.";i.innerHTML=`
        <div class="so-modal-head">
            <div>
                <span class="so-modal-title-eyebrow">Bid on Route</span>
                <h2 id="so-modal-title" class="so-modal-title">${o(t.name||"Route")}</h2>
            </div>
            <button type="button" class="so-modal-close" data-modal-close aria-label="Close">×</button>
        </div>

        ${d?`<div class="so-modal-blocked">${o(d)}</div>`:""}

        <div class="so-modal-section">
            <div class="so-modal-section-title">Issuer</div>
            <div class="so-modal-row"><span>Name</span><span class="value">${o(t.issuer_name||"—")}</span></div>
            <div class="so-modal-row"><span>Type</span><span class="value">${o(String(t.contract_type||"").toUpperCase())}</span></div>
            <div class="so-modal-row"><span>Award Rule</span><span class="value">${o(_)}</span></div>
        </div>

        <div class="so-modal-section">
            <div class="so-modal-section-title">Posted Terms (Ceilings)</div>
            <div class="so-modal-row"><span>Revenue / Tick</span><span class="value">${o($(m))}</span></div>
            <div class="so-modal-row"><span>Term</span><span class="value">${v} ticks</span></div>
            <div class="so-modal-row"><span>Freighters Required</span><span class="value">${t.freighters_required}</span></div>
        </div>

        <div class="so-modal-section">
            <div class="so-modal-section-title">Your Offer</div>
            <div class="so-modal-input-row">
                <div class="so-modal-field">
                    <label for="so-bid-revenue">Offered Revenue / Tick (≤ ${$(m)})</label>
                    <input type="number" id="so-bid-revenue" min="1" max="${m}" step="1" value="${m}" ${d?"disabled":""}>
                    <div class="so-modal-field-help">Undercut to win on lowest_price.</div>
                </div>
                <div class="so-modal-field">
                    <label for="so-bid-term">Offered Term (≤ ${v} ticks)</label>
                    <input type="number" id="so-bid-term" min="1" max="${v}" step="1" value="${v}" ${d?"disabled":""}>
                    <div class="so-modal-field-help">Shorten to win on fastest_delivery.</div>
                </div>
            </div>
        </div>

        <div class="so-modal-actions">
            <button type="button" class="so-modal-btn" data-modal-close>Cancel</button>
            <button type="button" class="so-modal-btn primary" id="so-bid-submit" ${d?"disabled":""}>Submit Bid ▸</button>
        </div>
    `,s.classList.add("open"),s.setAttribute("aria-hidden","false"),document.getElementById("so-bid-submit")?.addEventListener("click",()=>Ne(t.id))}const W=[{key:"known",name:"Known Shipping Route",desc:"Standard commercial corridor with charted waters and predictable conditions.",energy:0,risk:0,costM:0,baseline:!0},{key:"dangerous_waters",name:"Dangerous Waters",desc:"Cut through contested or pirate-active waters. Faster delivery, more cargo per tick — but exposure rises.",energy:2,risk:1,costM:0},{key:"naval_escort",name:"Naval Escort",desc:"Coordinate naval armed convoy protection across the route.",energy:0,risk:-2,costM:.3},{key:"premium_insurance",name:"Premium Insurance Bond",desc:"Lloyd's-tier coverage. Insurers reduce risk dramatically but skim a portion of cargo value.",energy:-1,risk:-3,costM:.1},{key:"bribe_port",name:"Bribe Port Authorities",desc:"Slip envelopes to harbormasters. Faster customs clearance, fewer delays — bribes come out of skim, not your line.",energy:1,risk:-1,costM:-.2},{key:"rush_schedule",name:"Rush Schedule",desc:"Push crews and engines hard. Maximum throughput, less idle time — fuel burn drops, but breakdowns climb.",energy:3,risk:2,costM:-.5}],G=[10,20,30,40],Re={10:1e5,20:2e5,30:4e5,40:6e5},F=3;let D=!1,E=null;function Be(e){if(!e||!e.trade_agreement_id)return;const t=document.getElementById("so-modal-overlay"),s=document.getElementById("so-modal");if(!t||!s)return;const i=Math.max(0,Math.floor(Number(u?.corp_freighters)||0)),n=Number(e.volume_required)||0,a=Math.max(1,Math.ceil(n/F)),r=Math.min(i,a||1),f=A.get(e.id),l=new Set(["known"]);let p=10,d=r;if(f){if(Array.isArray(f.modifiers))for(const c of f.modifiers)l.add(c);G.includes(f.markup_pct)&&(p=f.markup_pct),Number.isInteger(f.freighters_allocated)&&f.freighters_allocated>0&&(d=Math.min(i,f.freighters_allocated))}E={contract:e,freighters:d,modifiers:l,markup:p};const m={fastest:"FASTEST DELIVERY — highest energy/tick wins",safest:"SAFEST DELIVERY — lowest route risk wins",cheapest:"CHEAPEST DELIVERY — lowest $/tick wins"}[e.delivery_priority]||"CHEAPEST DELIVERY — lowest $/tick wins",v=e.origin_nation?.name||"",_=e.destination_nation?.name||"",y=v?`${o(v)} ◊ ${o(e.origin_port||"")}`:o(e.origin_port||""),h=_?`${o(_)} ◊ ${o(e.destination_port||"")}`:o(e.destination_port||"");s.innerHTML=`
        <div class="so-modal-head">
            <div>
                <span class="so-modal-title-eyebrow">Offer Shipping</span>
                <h2 id="so-modal-title" class="so-modal-title">${o(e.name||"Trade Agreement Route")}</h2>
                <div class="so-offer-subtitle">Filing as: <strong>${o(u?.abbreviation||"")}</strong> ${o(u?.faction_name||"")}</div>
            </div>
            <button type="button" class="so-modal-close" data-modal-close aria-label="Close">×</button>
        </div>

        <div class="so-offer-route-banner">
            <div class="so-offer-route-port">
                <span class="so-offer-route-label">Origin</span>
                <span class="so-offer-route-name">${y}</span>
            </div>
            <span class="so-offer-route-arrow">━━━▸</span>
            <div class="so-offer-route-port right">
                <span class="so-offer-route-label">Destination</span>
                <span class="so-offer-route-name">${h}</span>
                <span class="so-offer-route-meta">${o(m)}</span>
            </div>
        </div>

        <div class="so-modal-section">
            <div class="so-modal-section-title">I. Freighter Allocation
                <span class="so-offer-section-meta">1 freighter = ${F} units/tick · agreement asks ${n}/tick (need ${a} freighters)</span>
            </div>
            <div class="so-offer-freight-block">
                <div class="so-offer-freight-display">
                    <div class="so-offer-freight-count">
                        <span id="so-offer-freight-count">${d}</span><span class="so-offer-freight-max">/ ${i}</span>
                    </div>
                    <div class="so-offer-freight-output">
                        <div class="so-offer-output-label">Base Cargo/Tick</div>
                        <div class="so-offer-output-value" id="so-offer-base-energy">${d*F}</div>
                        <div class="so-offer-output-rate">Before route modifiers</div>
                    </div>
                </div>
                <label class="so-offer-freight-label" for="so-offer-freight-select">Assign Freighters</label>
                <select id="so-offer-freight-select" class="so-offer-freight-select">
                    ${Array.from({length:i+1},(c,b)=>b).map(c=>`<option value="${c}"${c===d?" selected":""}>${c} Freighter${c===1?"":"s"}</option>`).join("")}
                </select>
                <div class="so-offer-available-note">◊ Available freighters in your fleet: <span class="so-offer-available">${i}</span></div>
            </div>
        </div>

        <div class="so-modal-section">
            <div class="so-modal-section-title">II. Route Strategy
                <span class="so-offer-section-meta">Select Modifiers · Stack Effects</span>
            </div>
            <div class="so-offer-modifiers-grid" id="so-offer-modifiers-grid">
                ${W.map(c=>Ae(c,l.has(c.key))).join("")}
            </div>
        </div>

        <div class="so-modal-section">
            <div class="so-modal-section-title">III. Pricing &amp; Markup
                <span class="so-offer-section-meta">Your Profit Margin</span>
            </div>
            <div class="so-offer-markup-block">
                <div class="so-offer-markup-display">
                    <div class="so-offer-markup-pct">
                        <span id="so-offer-markup-display">${p}</span><span class="so-offer-markup-pct-sign">%</span>
                    </div>
                    <div class="so-offer-margin-display">
                        <div class="so-offer-output-label">Profit Margin</div>
                        <div class="so-offer-margin-value" id="so-offer-margin-value">$0</div>
                        <div class="so-offer-output-rate">Per tick</div>
                    </div>
                </div>
                <div class="so-offer-markup-options" id="so-offer-markup-options">
                    ${G.map(c=>`<button type="button" class="so-offer-markup-option${c===p?" active":""}" data-markup="${c}">${c}%</button>`).join("")}
                </div>
            </div>
            <div class="so-offer-cost-summary">
                <div class="so-offer-cost-summary-header">Final Offer Breakdown</div>
                <div class="so-offer-cost-line"><span class="label" id="so-offer-op-label">Trip Price</span><span class="value" id="so-offer-op-cost">$0</span></div>
                <div class="so-offer-cost-line"><span class="label">Transit</span><span class="value" id="so-offer-mod-cost">—</span></div>
                <div class="so-offer-cost-line"><span class="label" id="so-offer-markup-label">Tier</span><span class="value" id="so-offer-markup-cost">$0</span></div>
                <div class="so-offer-cost-line total"><span class="label">Revenue / Tick</span><span class="value" id="so-offer-total-cost">$0 / tick</span></div>
            </div>
        </div>

        <div class="so-modal-actions">
            <div class="so-offer-footer-summary">
                <div class="so-offer-footer-item">
                    <span class="so-offer-footer-label">Cargo Delivered</span>
                    <span class="so-offer-footer-value gold" id="so-offer-footer-energy">0/tick</span>
                </div>
                <div class="so-offer-footer-item">
                    <span class="so-offer-footer-label">Route Risk Δ</span>
                    <span class="so-offer-footer-value" id="so-offer-footer-risk">+0</span>
                </div>
                <div class="so-offer-footer-item">
                    <span class="so-offer-footer-label">Your Profit</span>
                    <span class="so-offer-footer-value green" id="so-offer-footer-profit">$0/tick</span>
                </div>
            </div>
            <div style="flex:1;"></div>
            <button type="button" class="so-modal-btn" data-modal-close>Cancel</button>
            <button type="button" class="so-modal-btn primary" id="so-offer-submit"${i===0?" disabled":""}>${f?"Update Offer ▸":"Submit Offer ▸"}</button>
        </div>
    `,t.classList.add("open"),t.setAttribute("aria-hidden","false"),document.getElementById("so-offer-freight-select")?.addEventListener("change",c=>{E.freighters=Math.max(0,Math.min(i,parseInt(c.target.value,10)||0)),document.getElementById("so-offer-freight-count").textContent=E.freighters,document.getElementById("so-offer-base-energy").textContent=E.freighters*F,H()}),document.getElementById("so-offer-modifiers-grid")?.addEventListener("click",c=>{const b=c.target.closest(".so-offer-modifier-card");if(!b)return;const I=b.dataset.key,C=W.find(q=>q.key===I);C&&(C.baseline||(E.modifiers.has(I)?(E.modifiers.delete(I),b.classList.remove("selected")):(E.modifiers.add(I),b.classList.add("selected")),H()))}),document.getElementById("so-offer-markup-options")?.addEventListener("click",c=>{const b=c.target.closest("button[data-markup]");if(!b)return;const I=parseInt(b.dataset.markup,10);if(G.includes(I)){E.markup=I;for(const C of c.currentTarget.querySelectorAll("button"))C.classList.toggle("active",C===b);document.getElementById("so-offer-markup-display").textContent=I,H()}}),document.getElementById("so-offer-submit")?.addEventListener("click",Te),H()}function Ae(e,t){const s=[];return e.energy!==0&&s.push(`<span class="so-offer-effect ${e.energy>0?"positive":"negative"}">${e.energy>0?"+":""}${e.energy} Cargo/tick</span>`),e.risk!==0&&s.push(`<span class="so-offer-effect ${e.risk>0?"negative":"positive"}">${e.risk>0?"+":""}${e.risk} Route Risk</span>`),s.length===0&&s.push('<span class="so-offer-effect cost">BASELINE</span>'),`<div class="so-offer-modifier-card${t?" selected":""}${e.baseline?" baseline":""}" data-key="${e.key}">
        <div class="so-offer-modifier-checkbox"></div>
        <div class="so-offer-modifier-content">
            <div class="so-offer-modifier-name">${o(e.name)}</div>
            <div class="so-offer-modifier-desc">${o(e.desc)}</div>
            <div class="so-offer-modifier-effects">${s.join("")}</div>
        </div>
    </div>`}function H(){if(!E)return;const{contract:e,freighters:t,modifiers:s,markup:i}=E;let n=0,a=0;for(const h of s){const w=W.find(c=>c.key===h);w&&(n+=w.energy,a+=w.risk)}const r=t*F,f=Number(e.volume_required)||1/0,l=Math.max(0,Math.min(f,r+n)),p=Re[i]||0,d=Math.max(1,Number(e.transit_ticks)||1),m=Math.floor(t*p/d),v=h=>{const w=h<0?"−":"",c=Math.abs(h);return c>=1e6?w+"$"+(c/1e6).toFixed(1)+"M":w+"$"+Math.round(c/1e3)+"k"};document.getElementById("so-offer-op-label").textContent=`Trip Price (${t} freighter${t!==1?"s":""} × ${v(p)}/trip)`,document.getElementById("so-offer-op-cost").textContent=v(t*p)+" / trip",document.getElementById("so-offer-mod-cost").textContent=`${d} tick${d!==1?"s":""} per trip`,document.getElementById("so-offer-markup-label").textContent=`Tier ${i} → ${v(p)}/trip/freighter`,document.getElementById("so-offer-markup-cost").textContent=v(m)+" / tick",document.getElementById("so-offer-total-cost").textContent=v(m)+" / tick",document.getElementById("so-offer-margin-value").textContent=v(m)+"/tick",document.getElementById("so-offer-footer-energy").textContent=`${l}/tick`;const _=document.getElementById("so-offer-footer-risk");_.textContent=(a>=0?"+":"")+a,_.style.color=a>0?"var(--so-accent-red)":a<0?"var(--so-accent-green)":"var(--so-text-primary)",document.getElementById("so-offer-footer-profit").textContent=v(m)+"/tick";const y=document.getElementById("so-offer-submit");y&&(y.disabled=D||t<=0)}async function Te(){if(D||!E)return;const{contract:e,freighters:t,modifiers:s,markup:i}=E;if(!e?.id)return;if(t<=0){g("Allocate at least 1 freighter.","error");return}D=!0;const n=document.getElementById("so-offer-submit");n&&(n.disabled=!0);try{const{data:a,error:r}=await k.rpc("place_shipping_offer",{p_contract_id:e.id,p_bidder_faction_id:u.id,p_freighters_allocated:t,p_modifiers:Array.from(s),p_markup_pct:i});if(r){g(r.message||"Offer failed.","error");return}if(!a?.success){g(a?.error||"Offer failed.","error");return}g(a.replaced?"Offer updated.":"Offer submitted. Auto-award on the next tick window.","success"),O(),await Q(),X()}catch(a){console.error("[corp-shipping] place_shipping_offer failed:",a),g("Offer failed: "+(a?.message||"unknown"),"error")}finally{D=!1,n&&(n.disabled=!1)}}function O(){const e=document.getElementById("so-modal-overlay"),t=document.getElementById("so-modal");e&&(e.classList.remove("open"),e.setAttribute("aria-hidden","true"),t&&(t.innerHTML=""))}async function Ne(e){if(V)return;const t=document.getElementById("so-bid-revenue"),s=document.getElementById("so-bid-term"),i=document.getElementById("so-bid-submit");if(!t||!s)return;const n=Number(t.value),a=Number(s.value);if(!Number.isFinite(n)||n<=0||!Number.isFinite(a)||a<=0){g("Pick a valid revenue and term.","error");return}V=!0,i&&(i.disabled=!0);try{const{data:r,error:f}=await k.rpc("place_shipping_bid",{p_contract_id:e,p_bidder_faction_id:u.id,p_offered_revenue_per_tick:n,p_offered_term_ticks:a});if(f){g(f.message||"Bid failed.","error");return}if(!r?.success){g(r?.error||"Bid failed.","error");return}g("Bid placed. Auto-award after the bid window closes.","success"),O(),await Q(),X()}catch(r){console.error("[corp-shipping] place_shipping_bid failed:",r),g("Bid failed: "+(r?.message||"unknown"),"error")}finally{V=!1,i&&(i.disabled=!1)}}function Me(){const e=document.getElementById("so-available-list");e&&e.dataset.boundSo!=="1"&&(e.dataset.boundSo="1",e.addEventListener("click",t=>{const s=t.target.closest('.so-contract-card[data-clickable="1"]');if(!s)return;const i=s.getAttribute("data-contract-id");i&&xe(i)}))}function Se(){const e=document.getElementById("so-modal-overlay");e&&e.dataset.boundSo!=="1"&&(e.dataset.boundSo="1",e.addEventListener("click",t=>{(t.target===e||t.target.matches("[data-modal-close]"))&&O()})),document.body.dataset.soEscBound!=="1"&&(document.body.dataset.soEscBound="1",document.addEventListener("keydown",t=>{t.key==="Escape"&&O()}))}const K=[{key:"fleet_expansion",name:"Fleet Expansion",options:[{letter:"A",title:"Used Vessel Acquisition",desc:"Buy second-hand cargo ships from a struggling rival fleet — fast capacity, but the hulls bring maintenance headaches.",cost:5e7,effects:{freighters:2,fleet_health:-2}},{letter:"B",title:"New Build Order",desc:"Commission new vessels from the shipyards — slow and expensive, but the modern hulls bring reliability.",cost:9e7,effects:{freighters:3}}]},{key:"maintenance_program",name:"Maintenance Program",options:[{letter:"A",title:"Emergency Drydock Repairs",desc:"Pull vessels from active routes for urgent fixes — Fleet Health stabilizes, but ships out of service mean lost capacity.",cost:4e7,effects:{fleet_health:2,freighters:-2}},{letter:"B",title:"Comprehensive Refit & Modernization",desc:"Major overhaul of older vessels with new tech — restores Fleet Health and equips ships for safer routes.",cost:8e7,effects:{fleet_health:3,route_risk:-1}}]},{key:"route_diversification",name:"Route Diversification",options:[{letter:"A",title:"Open Secondary Trade Lane",desc:"Spread freighters thin across a new corridor — diversifies your exposure, but pulls vessels from existing lanes.",cost:5e7,effects:{route_risk:-2,freighters:-2}},{letter:"B",title:"Multi-Region Network Expansion",desc:"Build a fully diversified global network — major risk reduction and the new infrastructure improves fleet reliability.",cost:9e7,effects:{route_risk:-3,fleet_health:1}}]},{key:"insurance_hedging",name:"Insurance & Hedging",options:[{letter:"A",title:"Basic Marine Insurance Package",desc:"Buy bargain coverage from a discount underwriter — risk shifts to insurers, but cheap policies skimp on maintenance support.",cost:3e7,effects:{route_risk:-2,fleet_health:-2}},{letter:"B",title:"Premium Risk Management Contract",desc:"Engage Lloyd’s-tier underwriters with full advisory services — superior coverage, plus they help fund a new vessel.",cost:7e7,effects:{route_risk:-3,freighters:1}}]},{key:"high_risk_route",name:"High-Risk Lucrative Route",options:[{letter:"A",title:"Run the Contested Strait",desc:"Sail through dangerous waters that rivals avoid — premium freight rates demand high vessel utilization, and every voyage gambles with disaster.",cost:2e7,effects:{freighters:-2,route_risk:2}},{letter:"B",title:"Convoy with Naval Escort",desc:"Pay for naval protection on dangerous routes — slower and costlier, but your fleet returns intact with full holds.",cost:8e7,effects:{freighters:-3,route_risk:-1}}]},{key:"crew_training",name:"Crew Training",options:[{letter:"A",title:"Basic Mariner Certification",desc:"Run minimum-standard certification courses — better-trained crews keep ships running, but pulled vessels create capacity gaps.",cost:4e7,effects:{fleet_health:2,freighters:-2}},{letter:"B",title:"Elite Maritime Academy Partnership",desc:"Sponsor a top-tier officer program — your fleet earns elite certification and gains access to safer chartered lanes.",cost:8e7,effects:{fleet_health:3,route_risk:-1}}]},{key:"vessel_decommissioning",name:"Vessel Decommissioning",options:[{letter:"A",title:"Scrap Aging Vessels",desc:"Send the oldest hulls to the breakers’ yards — overall fleet quality rises, but headcount drops with the scrapped ships.",cost:3e7,effects:{fleet_health:2,freighters:-2}},{letter:"B",title:"Modernize & Repurpose Old Fleet",desc:"Refit aging vessels for niche routes instead of scrapping — keeps capacity and quality intact through clever redesign.",cost:7e7,effects:{fleet_health:3,freighters:1}}]},{key:"cargo_specialization",name:"Cargo Specialization",options:[{letter:"A",title:"Convert to Bulk Carrier Focus",desc:"Specialize the fleet for bulk commodities — ships become more efficient, but concentrating cargo type concentrates exposure.",cost:5e7,effects:{freighters:2,route_risk:2}},{letter:"B",title:"Diversified Cargo Capability",desc:"Outfit vessels for everything from containers to break-bulk — maximum flexibility, slightly safer routes.",cost:9e7,effects:{freighters:3,route_risk:-1}}]},{key:"geopolitical_lobbying",name:"Geopolitical Lobbying",options:[{letter:"A",title:"Bribe Port Authorities",desc:"Slip envelopes to harbormasters along your routes — paperwork moves faster, but the dirty deals breed neglect on the docks.",cost:4e7,effects:{route_risk:-2,fleet_health:-2}},{letter:"B",title:"Diplomatic Trade Relations Initiative",desc:"Build formal trade ties with foreign governments — slow, expensive, but unlocks safer corridors and a new vessel from a partnership deal.",cost:8e7,effects:{route_risk:-3,freighters:1}}]},{key:"fleet_modernization",name:"Fleet Modernization",options:[{letter:"A",title:"Engine Retrofit Program",desc:"Upgrade engines on existing vessels — better reliability, but ships out of service during the retrofit hurts capacity.",cost:5e7,effects:{fleet_health:2,freighters:-2}},{letter:"B",title:"Next-Generation Vessel Conversion",desc:"Full conversion to next-gen propulsion across the fleet — major investment, but emerges as a younger, larger fleet.",cost:1e8,effects:{fleet_health:3,freighters:1}}]}],Fe={freighters:"Freighters",fleet_health:"Fleet Health",route_risk:"Route Risk"};let z=!1;function Le(){const e=Number(u?.corp_shipping_action_locked_until_tick)||0,t=Number(R?.current_tick)||0;return Math.max(0,e-t)}function oe(){const e=document.getElementById("so-actions-grid"),t=document.getElementById("so-actions-meta"),s=document.getElementById("so-actions-cooldown-pill");if(!e)return;const i=Le(),n=i>0;e.classList.toggle("locked",n),s&&(n?(s.className="so-actions-cooldown-pill",s.textContent=`LOCKED — ${i} TICK${i===1?"":"S"}`):(s.textContent="",s.className="")),t&&(t.textContent=n?`Locked until tick ${u.corp_shipping_action_locked_until_tick}`:`${K.length} Initiatives ◊ Choose A or B (12-tick global cooldown)`),e.innerHTML=K.map((a,r)=>Pe(a,r,n)).join("")}function Pe(e,t,s){const i=e.options.map((n,a)=>Oe(e,n,t,a,s)).join("");return`<div class="so-action-card">
        <div class="so-action-name">${o(e.name)}</div>
        <div class="so-action-options">${i}</div>
    </div>`}function Oe(e,t,s,i,n){const a=ae(t);return`<div class="so-action-option" ${n?'data-locked="1"':""}
                 data-action-key="${o(e.key)}"
                 data-choice="${o(t.letter)}"
                 data-card-idx="${s}" data-opt-idx="${i}">
        <span class="so-action-option-letter">${o(t.letter)}</span>
        <div class="so-action-option-content">
            <div class="so-action-option-title">${o(t.title)}</div>
            <div class="so-action-option-desc">${o(t.desc)}</div>
            <div class="so-action-option-effects">${a}</div>
        </div>
        <span class="so-action-option-cta">${n?"Locked":"Take ▸"}</span>
    </div>`}function ae(e){const t=[`<span class="so-effect cost">−${$(e.cost)}</span>`];for(const[s,i]of Object.entries(e.effects||{})){const n=i>0?"+":"",a=i>0?"positive":"negative";t.push(`<span class="so-effect ${a}">${n}${i} ${o(Fe[s]||s)}</span>`)}return t.join("")}function qe(){const e=document.getElementById("so-actions-grid");!e||e.dataset.boundSo==="1"||(e.dataset.boundSo="1",e.addEventListener("click",t=>{const s=t.target.closest(".so-action-option");if(!s||s.hasAttribute("data-locked"))return;const i=Number(s.getAttribute("data-card-idx")),n=Number(s.getAttribute("data-opt-idx")),a=K[i],r=a?.options[n];!a||!r||He(a,r)}))}function He(e,t){const s=document.getElementById("so-modal-overlay"),i=document.getElementById("so-modal");if(!s||!i)return;const n=ae(t);i.innerHTML=`
        <div class="so-modal-head">
            <div>
                <span class="so-modal-title-eyebrow">Confirm Strategic Action</span>
                <h2 id="so-modal-title" class="so-modal-title">${o(t.title)}</h2>
            </div>
            <button type="button" class="so-modal-close" data-modal-close aria-label="Close">×</button>
        </div>
        <div class="so-modal-section">
            <div class="so-modal-section-title">${o(e.name)} — Option ${o(t.letter)}</div>
            <p style="font-size:13px;color:var(--so-text-secondary);line-height:1.55;margin:0 0 14px;">${o(t.desc)}</p>
            <div class="so-action-option-effects" style="margin-bottom:12px;">${n}</div>
            <div class="so-modal-blocked" style="border-color:var(--so-accent-rust);background:rgba(160,99,58,0.08);color:var(--so-accent-rust);">
                ⚠ This locks all 10 Shipping Strategic Actions for 12 ticks.
            </div>
        </div>
        <div class="so-modal-actions">
            <button type="button" class="so-modal-btn" data-modal-close>Cancel</button>
            <button type="button" class="so-modal-btn primary" id="so-action-confirm">Confirm ▸</button>
        </div>
    `,s.classList.add("open"),s.setAttribute("aria-hidden","false"),document.getElementById("so-action-confirm")?.addEventListener("click",()=>{De(e,t)})}async function De(e,t){if(z)return;const s=document.getElementById("so-action-confirm");z=!0,s&&(s.disabled=!0);try{const{data:i,error:n}=await k.rpc("fire_shipping_action",{p_corp_id:u.id,p_action_key:e.key,p_choice:t.letter});if(n){g(n.message||"Action failed.","error");return}if(!i?.success){g(i?.error||"Action failed.","error");return}g("Action taken — locked for 12 ticks.","success"),O(),await ie(),ee(),oe()}catch(i){console.error("[corp-shipping] fire_shipping_action failed:",i),g("Action failed: "+(i?.message||"unknown"),"error")}finally{z=!1,s&&(s.disabled=!1)}}async function je(){const{data:{user:e}}=await k.auth.getUser();if(!e){window.location.href="login.html";return}const s=new URL(location.href).searchParams.get("faction_id");if(s){const{data:r,error:f}=await k.from("factions").select("*").eq("id",s).single();f?console.warn("[corp-shipping] inspector fetch failed:",f.message):r?.faction_type==="corporation"&&(u=r)}if(!u){const{data:r}=await k.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);S=(r||[]).filter(p=>p.nation_id);const f=sessionStorage.getItem("active_faction_id");if(u=S.find(p=>p.id===f)||S.find(p=>p.faction_type==="corporation")||S[0],!u){await k.auth.signOut(),window.location.href="login.html";return}if(u.faction_type!=="corporation"){window.location.href="dashboard.html";return}const l=u.corp_sector||"";if(l!=="Shipping"){const p=ue[l]||"corp-dashboard.html",d=s?`?faction_id=${encodeURIComponent(s)}`:"";window.location.replace(p+d);return}}const[i,n]=await Promise.all([u.nation_id?k.from("nations").select("id, name, capital").eq("id",u.nation_id).single():Promise.resolve({data:null}),k.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);i?.data&&i.data,n?.data&&(R=n.data);const a=document.getElementById("corp-topbar-container");if(a)try{const{renderCorpTopBar:r}=await ce(async()=>{const{renderCorpTopBar:f}=await import("./corp-topbar-Dar6x8XP.js");return{renderCorpTopBar:f}},__vite__mapDeps([0,1,2]));r(a,{faction:u,shard:R,activeTab:"operations",allUserFactions:S})}catch(r){console.error("[corp-shipping] topbar render failed:",r)}document.getElementById("so-footer-date").textContent=R?.current_date||"—",document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="",ee(),oe(),ye(),Me(),qe(),Se(),se=de({supabase:k,faction:u,host:document.getElementById("so-loan-pressing"),showEmpty:!1,onChange:()=>N()}),te=le({supabase:k,faction:u,host:document.getElementById("so-lawsuit-pressing"),currentTick:()=>Number(R?.current_tick)||0,showEmpty:!1,onChange:()=>N()}),await Promise.all([j(),Q(),Ce()]),X(),Ie()}je().catch(e=>{console.error("[corp-shipping] init failed:",e),ge("Failed to load: "+(e?.message||"unknown error"))});
