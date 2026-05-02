const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BVNorCyj.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as y}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{_ as ne}from"./preload-helper-BXl3LOEh.js";import{escapeHtml as a,hfFmtBig as w}from"./utils-A98FEun4.js";function ce(e){const t=Number(e)||0;return t>=7?"good":t>=4?"mid":"warn"}function le(e){const t=Number(e)||0;return t>=8?"danger":t>=7?"warn":t>=4?"mid":"good"}const de=[{key:"freighters",column:"corp_freighters",eyebrow:"CAPACITY",name:"Freighters",emName:"",tooltip:"Cargo vessels in your active fleet. Each freighter carries 3 Energy/tick on a trade route. More freighters means you can offer larger volumes on shipping contracts and run more lanes simultaneously.",blurb:{good:"<strong>Plentiful capacity.</strong> Spare freighters across multiple lanes; room to bid on new routes without straining the fleet.",mid:"<strong>Working fleet.</strong> Capacity is matched to active routes — taking on more lanes will require expansion.",warn:"<strong>Stretched thin.</strong> Few spare freighters. Bidding for new routes risks under-staffing existing lanes."},impacts:{good:[{label:"Fleet Tier",value:"Strong"},{label:"New-Route Cap",value:"3+",tone:"good"}],mid:[{label:"Fleet Tier",value:"Adequate"},{label:"New-Route Cap",value:"1–2"}],warn:[{label:"Fleet Tier",value:"Tight"},{label:"New-Route Cap",value:"0",tone:"rust"}]}},{key:"health",column:"corp_fleet_health",eyebrow:"VITALITY",name:"Fleet",emName:"Health",tooltip:"The average maintenance state of your vessels. High health means low breakdown risk, favorable insurance premiums, and smooth deliveries. Low health stacks the drydock queue, lifts insurer premiums, and risks contract penalties from missed deadlines.",blurb:{good:"<strong>Vessels in top condition.</strong> Maintenance is current; insurance underwriters favor your premiums; breakdowns are rare.",mid:"<strong>Mid-tier maintenance.</strong> The fleet is functional but maintenance backlog is creeping in. A drydock pass would help.",warn:"<strong>Maintenance backlog.</strong> Vessels overdue for service; underwriters flagging risk; breakdown probability climbing."},impacts:{good:[{label:"Drydock Queue",value:"Empty",tone:"good"},{label:"Breakdown Risk",value:"Low"}],mid:[{label:"Drydock Queue",value:"1–2"},{label:"Breakdown Risk",value:"Moderate"}],warn:[{label:"Drydock Queue",value:"3+",tone:"rust"},{label:"Breakdown Risk",value:"Elevated",tone:"warn"}]}},{key:"risk",column:"corp_route_risk",eyebrow:"EXPOSURE",name:"Route",emName:"Risk",inverted:!0,tooltip:"Inverted stat — lower is better. Tracks how exposed your fleet is to piracy, contested waters, and chokepoints. High risk means premiums climb, sanctions exposure rises, and one incident can trigger a cascading rate hike. Diversification and naval-escort modifiers bring it down.",blurb:{good:"<strong>Exposure is well-spread.</strong> Routes are diversified across stable corridors; insurance premiums are baseline; sanctions risk negligible.",mid:"<strong>Moderate concentration.</strong> A meaningful slice of revenue runs through one or two contested lanes. A diversification action would help.",warn:"<strong>Concentrated exposure.</strong> Most revenue runs through contested chokepoints. Premiums are climbing; sanctions risk is real.",danger:"<strong>Stressed corridor exposure.</strong> The fleet is one incident away from a Crisis-tier rate hike. Diversification or insurance overhaul is overdue."},impacts:{good:[{label:"Premium Mult",value:"×1.0",tone:"good"},{label:"Sanctions",value:"Low"}],mid:[{label:"Premium Mult",value:"×1.2"},{label:"Sanctions",value:"Moderate"}],warn:[{label:"Premium Mult",value:"×1.4",tone:"rust"},{label:"Sanctions",value:"High",tone:"rust"}],danger:[{label:"Premium Mult",value:"×1.7",tone:"warn"},{label:"Sanctions",value:"Critical",tone:"warn"}]}}];function ue(e){const t=Number(u?.[e.column]??0),s=t.toFixed(1).replace(/\.0$/,""),o=e.inverted?le(t):ce(t),n=Math.max(0,Math.min(10,Math.round(t))),r=Array.from({length:10},(p,_)=>{const g=_<n,k=e.inverted&&g&&_>=7,h=["so-hero-meter-cell"];return g&&h.push("filled"),k&&h.push("danger"),`<div class="${h.join(" ")}"></div>`}).join(""),i=e.blurb?.[o]||e.blurb?.warn||"",l=(e.impacts?.[o]||e.impacts?.warn||[]).map(p=>`<div>
            <span class="label">${a(p.label)}</span>
            <span class="value${p.tone?" "+p.tone:""}">${a(p.value)}</span>
        </div>`).join(""),v=e.inverted?'<span class="so-inverted-note">⚠ HIGH = DANGER</span>':"",f=e.emName?`${a(e.name)} <em>${a(e.emName)}</em>`:a(e.name),c=e.tooltip?`<span class="so-hero-tip" data-tip="${a(e.tooltip).replace(/"/g,"&quot;")}" aria-label="What is ${a(e.name)}?">?</span>`:"";return`<div class="so-hero-stat" data-stat="${a(e.key)}">
        ${v}
        <div class="so-hero-stat-eyebrow">${a(e.eyebrow)}</div>
        <div class="so-hero-stat-name">${f}${c}</div>
        <div class="so-hero-stat-value-row">
            <div class="so-hero-stat-value">${a(s)}<span class="so-max">/10</span></div>
            <div class="so-hero-stat-trend neutral">— FOUNDING POSITION</div>
        </div>
        <div class="so-hero-meter">${r}</div>
        <div class="so-hero-stat-desc">${i}</div>
        <div class="so-hero-stat-impact">${l}</div>
    </div>`}function te(){const e=document.getElementById("so-hero-stats");e&&(e.innerHTML=de.map(ue).join(""))}let u=null,B=null,T=[],H=[],D=[],Y=new Set,M=new Set,x=[],A=[],R=new Map,V=!1;function fe(e){const t=document.getElementById("loading");t.textContent=e,t.style.color="var(--so-accent-red)"}function m(e,t){document.querySelectorAll(".so-toast").forEach(o=>o.remove());const s=document.createElement("div");s.className="so-toast"+(t?" "+t:""),s.textContent=e,document.body.appendChild(s),setTimeout(()=>{s.classList.add("fade"),setTimeout(()=>s.remove(),280)},3e3)}async function se(){if(!u?.id)return;const{data:e,error:t}=await y.from("factions").select("*").eq("id",u.id).single();if(t||!e){console.warn("[corp-shipping] faction refresh failed:",t?.message);return}u=e;const s=document.getElementById("topbar-cash");s&&(s.textContent="CASH: "+w(Number(u.corp_cash_reserves||0)))}function pe(e){const t=String(e||"").toUpperCase();return t==="CRITICAL"?"critical":t==="HIGH"?"high":t==="MODERATE"?"moderate":"low"}function ee(e,t){const s=Math.max(0,Number(e||0)-(Number(t)||0));return s<=0?"Resolving now":`Expires in ${s} tick${s===1?"":"s"}`}async function j(){if(!u?.id)return;const[e,t]=await Promise.all([y.from("corp_contract_events").select("id, contract_id, type, severity, title, description, impact, responses, expires_at_tick, corp_contracts:contract_id(name)").eq("faction_id",u.id).eq("status","ACTIVE").order("expires_at_tick",{ascending:!0}),y.from("bank_loan_offers").select(`
                id, offered_apr, offered_term_ticks, expires_at_tick,
                bank:factions!bank_faction_id ( faction_name, corp_ticker ),
                request:bank_loan_requests!inner ( principal, purpose )
            `).eq("status","pending").eq("request.requesting_faction_id",u.id).eq("request.status","pending").order("expires_at_tick",{ascending:!0})]);e.error?(console.warn("[corp-shipping] Pressing Issues fetch failed:",e.error.message),H=[]):H=e.data||[],t.error?(console.warn("[corp-shipping] Loan offers fetch failed:",t.error.message),D=[]):D=t.data||[],F()}function F(){const e=document.getElementById("pi-list"),t=document.getElementById("pi-count");if(!e)return;const s=H.length+D.length;if(t&&(t.textContent=`${s} OPEN`),s===0){e.innerHTML='<div class="pi-empty"><div class="pi-empty__text">No pressing issues right now.<br>Time-sensitive decisions<br>will appear here.</div></div>';return}const o=Number(B?.current_tick)||0,n=D.map(i=>{const l=ee(i.expires_at_tick,o),v=i.bank||{},f=i.request||{},c=v.corp_ticker||"—",p=v.faction_name||"Lender",_=Number(i.offered_apr)||0,g=Number(i.offered_term_ticks)||0,k=Number(f.principal)||0,h=f.purpose?String(f.purpose).trim():"",b=M.has(i.id);return`<div class="pi-issue-card kind-loan-offer">
            <div class="pi-issue-row">
                <span class="pi-issue-tag kind-loan-offer">LOAN OFFER ◊ FINANCE</span>
                <span class="pi-issue-deadline">${a(l)}</span>
            </div>
            <div class="pi-issue-title">${a(c)} — ${a(p)}</div>
            ${h?`<div class="pi-issue-sub">— ${a(h)}</div>`:""}
            <div class="pi-issue-terms">
                <span><span class="label">PRINCIPAL</span><span class="value">${a(w(k))}</span></span>
                <span><span class="label">APR</span><span class="value">${_.toFixed(1)}%</span></span>
                <span><span class="label">TERM</span><span class="value">${g} TICKS</span></span>
            </div>
            <div class="pi-issue-actions">
                <button class="pi-btn primary" data-action="accept-offer" data-id="${a(i.id)}" ${b?"disabled":""}>
                    ${b?"Working…":"Accept ▸"}
                </button>
                <button class="pi-btn" data-action="reject-offer" data-id="${a(i.id)}" ${b?"disabled":""}>
                    Reject
                </button>
            </div>
        </div>`}),r=H.map(i=>{const l=ee(i.expires_at_tick,o),v=pe(i.severity),f=i.corp_contracts?.name||"Project",c=String(i.severity||"LOW").toUpperCase(),p=String(i.type||"").trim(),_=p?`${c} ◊ ${p}`:c,g=Array.isArray(i.responses)&&i.responses[0]||{},k=Number(g.cost)||0,h=Number(g.delay)||0,b=[];return k>0&&b.push(`<span><span class="label">COST</span><span class="value">−${a(w(k))}</span></span>`),h>0&&b.push(`<span><span class="label">DELAY</span><span class="value">+${h}t</span></span>`),`<div class="pi-issue-card sev-${v}">
            <div class="pi-issue-row">
                <span class="pi-issue-tag sev-${v}">${a(_)}</span>
                <span class="pi-issue-deadline">${a(l)}</span>
            </div>
            <div class="pi-issue-title">${a(i.title||"Untitled")}</div>
            <div class="pi-issue-sub">— ${a(f)}</div>
            <div class="pi-issue-desc">${a(i.description||i.impact||"")}</div>
            ${b.length?`<div class="pi-issue-terms">${b.join("")}</div>`:""}
            <div class="pi-issue-actions">
                <button class="pi-btn primary" data-action="ack-issue" data-id="${a(i.id)}">Acknowledge ▸</button>
            </div>
        </div>`});e.innerHTML=n.concat(r).join("")}async function me(e){if(!(!e||M.has(e))){M.add(e),F();try{const{data:t,error:s}=await y.rpc("accept_loan_offer",{p_offer_id:e});s?m("Failed: "+s.message,"error"):t?.success?m("Offer accepted. Awaiting bank disbursement.","success"):m(t?.error||"Failed to accept","error"),await j()}catch(t){console.error("[corp-shipping] accept_loan_offer failed:",t),m("Accept failed: "+(t?.message||"unknown"),"error")}finally{M.delete(e),F()}}}async function ve(e){if(!(!e||M.has(e))){M.add(e),F();try{const{data:t,error:s}=await y.rpc("reject_loan_offer",{p_offer_id:e});s?m("Failed: "+s.message,"error"):t?.success?m("Offer rejected.","success"):m(t?.error||"Failed to reject","error"),await j()}catch(t){console.error("[corp-shipping] reject_loan_offer failed:",t),m("Reject failed: "+(t?.message||"unknown"),"error")}finally{M.delete(e),F()}}}async function ge(e){if(!(!e||Y.has(e))){Y.add(e);try{const{data:t,error:s}=await y.rpc("acknowledge_corp_contract_event",{p_event_id:e,p_response_key:null});if(s)m("Failed: "+s.message,"error");else if(!t?.success)m(t?.error||"Failed to acknowledge","error");else{const o=t?.cost_applied?` − ${w(t.cost_applied)}`:"",n=t?.delay_applied?` ◊ +${t.delay_applied}t delay`:"";m(`Acknowledged${o}${n}`,"success"),await se()}await j()}catch(t){console.error("[corp-shipping] acknowledge failed:",t),m("Acknowledge failed: "+(t?.message||"unknown"),"error")}finally{Y.delete(e)}}}function _e(){const e=document.getElementById("pi-list");!e||e.dataset.boundPi==="1"||(e.dataset.boundPi="1",e.addEventListener("click",t=>{const s=t.target.closest("[data-action]");if(!s||s.disabled)return;const o=s.getAttribute("data-action"),n=s.getAttribute("data-id");if(n){if(o==="ack-issue")return ge(n);if(o==="accept-offer")return me(n);if(o==="reject-offer")return ve(n)}}))}async function X(){if(!u?.id){x=[],R=new Map;return}const e=Number(B?.current_tick)||0,{data:t,error:s}=await y.from("shipping_contracts").select(`
            id, nation_id, issuer_name, contract_type, name, description,
            origin_port, destination_port, destination_nation_id,
            revenue_per_tick, term_ticks, freighters_required,
            min_fleet_health, max_route_risk, expires_at_tick, award_criterion,
            trade_agreement_id, commodity, volume_required, delivery_priority,
            origin_nation:nations!nation_id ( name ),
            destination_nation:nations!destination_nation_id ( name )
        `).eq("status","open").gt("expires_at_tick",e).order("expires_at_tick",{ascending:!0});if(s){console.warn("[corp-shipping] available contracts fetch failed:",s.message),x=[],R=new Map;return}if(x=t||[],x.length>0){const o=x.map(r=>r.id),{data:n}=await y.from("shipping_contract_bids").select("id, contract_id, offered_revenue_per_tick, offered_term_ticks, status, freighters_allocated, modifiers, markup_pct, energy_per_tick, route_risk_delta").eq("bidder_faction_id",u.id).in("contract_id",o);R=new Map((n||[]).map(r=>[r.contract_id,r]))}else R=new Map}async function he(){if(!u?.id){A=[];return}const{data:e,error:t}=await y.from("shipping_contracts").select(`
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
        `).eq("status","awarded").eq("winner_faction_id",u.id).order("ends_at_tick",{ascending:!0});if(t){console.warn("[corp-shipping] active contracts fetch failed:",t.message),A=[];return}A=(e||[]).map(s=>{const o=(s.shipping_contract_bids||[]).find(n=>n.status==="accepted");return{...s,accepted_bid:o?{freighters_allocated:Number(o.freighters_allocated)||0,modifiers:Array.isArray(o.modifiers)?o.modifiers:[],markup_pct:Number(o.markup_pct)||0,energy_per_tick:Number(o.energy_per_tick)||0,route_risk_delta:Number(o.route_risk_delta)||0}:null}})}function J(){const e=document.getElementById("so-available-list"),t=document.getElementById("so-available-meta");if(!e)return;if(t&&(t.textContent=x.length===0?"No open routes":`${x.length} Open ◊ Click to Bid`),x.length===0){e.innerHTML='<div class="so-contract-empty">No open routes right now. New tenders post each tick.</div>';return}const s=Number(B?.current_tick)||0,o=Number(u?.corp_freighters||0),n=Number(u?.corp_fleet_health||0),r=Number(u?.corp_route_risk||0);e.innerHTML=x.map(i=>{const l=String(i.contract_type||"private").toLowerCase(),v=Math.max(0,Number(i.expires_at_tick||0)-s),f=v<=1?"urgent":"",c=v<=0?"Closing now":`Bid closes in ${v} tick${v===1?"":"s"}`,p=(i.origin_nation?.name||"—").toUpperCase(),_=(i.destination_nation?.name||i.origin_nation?.name||"—").toUpperCase(),g=o>=i.freighters_required,k=i.min_fleet_health==null||n>=i.min_fleet_health,h=i.max_route_risk==null||r<=i.max_route_risk,b=g&&k&&h,d=`<span class="so-req-chip ${g?"met":"unmet"}">${g?"✓":"✗"} Freighters ${i.freighters_required}+</span>`,$=i.min_fleet_health!=null?`<span class="so-req-chip ${k?"met":"unmet"}">${k?"✓":"✗"} Fleet Health ${Number(i.min_fleet_health).toFixed(1)}+</span>`:"",I=i.max_route_risk!=null?`<span class="so-req-chip ${h?"met":"unmet"}">${h?"✓":"✗"} Route Risk ≤ ${Number(i.max_route_risk).toFixed(1)}</span>`:"",C=R.get(i.id),O=C?.status,U=!!i.trade_agreement_id;let N;if(O==="pending")if(U){const ae=Number(C.energy_per_tick)||0,re=Number(C.offered_revenue_per_tick)||0;N=`<span class="so-contract-cta">OFFER PLACED ◊ ${ae} ENERGY / ${a(w(re))} ▸ EDIT</span>`}else N=`<span class="so-contract-cta muted">BID PLACED ◊ ${a(w(C.offered_revenue_per_tick))} / ${C.offered_term_ticks}T</span>`;else b?N=U?'<span class="so-contract-cta">OFFER ▸</span>':'<span class="so-contract-cta">BID ▸</span>':N='<span class="so-contract-cta muted">REQUIREMENTS UNMET</span>';const Z=(U||O!=="pending")&&b;return`<div class="${`so-contract-card${Z?"":" disabled"}`}" data-clickable="${Z?"1":"0"}" data-contract-id="${a(i.id)}">
            <div class="so-contract-meta-row">
                <span class="so-contract-tag ${l}">${a(l.toUpperCase())}</span>
                <span class="so-contract-deadline ${f}">${a(c)}</span>
            </div>
            <div>
                <div class="so-contract-name">${a(i.name||"Route")}</div>
                <div class="so-contract-client">— ${a(i.issuer_name||"—")}</div>
            </div>
            <div class="so-route-corridor">
                <div class="so-route-port">
                    <span class="so-route-port-label">ORIGIN</span>
                    ◊ ${a((i.origin_port||"—").toUpperCase())}
                </div>
                <span class="so-route-arrow">━━━▸</span>
                <div class="so-route-port right">
                    <span class="so-route-port-label">DESTINATION</span>
                    ${a((i.destination_port||"—").toUpperCase())} ◊
                </div>
            </div>
            <div class="so-contract-stats">
                <div>
                    <div class="label">Revenue/Tick</div>
                    <div class="value green">${a(w(i.revenue_per_tick))}</div>
                </div>
                <div>
                    <div class="label">Term</div>
                    <div class="value">${i.term_ticks} ticks</div>
                </div>
                <div>
                    <div class="label">Freighters Req.</div>
                    <div class="value">${i.freighters_required}</div>
                </div>
            </div>
            <div class="so-contract-requires">
                ${d}${$}${I}
            </div>
            <div class="so-contract-foot">
                <span>${a(p)}${_!==p?` → ${a(_)}`:""}</span>
                ${N}
            </div>
        </div>`}).join("")}function be(){const e=document.getElementById("so-active-list"),t=document.getElementById("so-active-meta"),s=document.getElementById("so-active-count");if(!e)return;if(s&&(s.textContent=String(A.length)),A.length===0){t&&(t.textContent="No active routes"),e.innerHTML='<div class="so-contract-empty">No active routes. Bid on Available Routes to start carrying.</div>';return}const o=A.reduce((r,i)=>r+(Number(i.revenue_per_tick)||0),0);t&&(t.textContent=`${A.length} Active ◊ ${w(o)}/Tick`);const n=Number(B?.current_tick)||0;e.innerHTML=A.map(r=>{const i=String(r.contract_type||"private").toLowerCase(),l=Math.max(0,Number(r.ends_at_tick||0)-n),v=`Ends in ${l} tick${l===1?"":"s"}`,f=Number(r.total_paid)||0,c=r.accepted_bid;let p="";if(c&&r.trade_agreement_id){const _=(c.modifiers||[]).filter(d=>d&&d!=="known"),g={dangerous_waters:"Dangerous Waters",naval_escort:"Naval Escort",premium_insurance:"Premium Insurance",bribe_port:"Bribe Port Authorities",rush_schedule:"Rush Schedule"},k=_.length===0?'<span class="so-active-mod-chip baseline">Known Route only</span>':_.map(d=>`<span class="so-active-mod-chip">${a(g[d]||d)}</span>`).join(""),h=c.route_risk_delta>0?"var(--so-accent-red)":c.route_risk_delta<0?"var(--so-accent-green)":"var(--so-text-secondary)",b=c.route_risk_delta>0?"+":"";p=`<div class="so-active-offer-block">
                <div class="so-active-offer-header">
                    <span>Your Offer</span>
                    <span class="so-active-offer-priority">${a((r.delivery_priority||"").toUpperCase())}</span>
                </div>
                <div class="so-active-offer-row">
                    <span class="label">Energy/Tick</span>
                    <span class="value gold">${c.energy_per_tick}</span>
                </div>
                <div class="so-active-offer-row">
                    <span class="label">Freighters Allocated</span>
                    <span class="value">${c.freighters_allocated}</span>
                </div>
                <div class="so-active-offer-row">
                    <span class="label">Markup</span>
                    <span class="value">${c.markup_pct}%</span>
                </div>
                <div class="so-active-offer-row">
                    <span class="label">Route Risk Δ</span>
                    <span class="value" style="color:${h};">${b}${c.route_risk_delta}</span>
                </div>
                <div class="so-active-offer-mods">${k}</div>
            </div>`}return`<div class="so-contract-card" data-clickable="0">
            <div class="so-contract-meta-row">
                <span class="so-contract-tag ${i}">${a(i.toUpperCase())}</span>
                <span class="so-contract-deadline">${a(v)}</span>
            </div>
            <div>
                <div class="so-contract-name">${a(r.name||"Route")}</div>
                <div class="so-contract-client">— ${a(r.issuer_name||"—")}</div>
            </div>
            <div class="so-route-corridor">
                <div class="so-route-port">
                    <span class="so-route-port-label">ORIGIN</span>
                    ◊ ${a((r.origin_port||"—").toUpperCase())}
                </div>
                <span class="so-route-arrow">━━━▸</span>
                <div class="so-route-port right">
                    <span class="so-route-port-label">DESTINATION</span>
                    ${a((r.destination_port||"—").toUpperCase())} ◊
                </div>
            </div>
            <div class="so-route-status${(Number(r.consecutive_missed_payments)||0)>0?" warn":""}">
                <span class="dot"></span>
                <span class="text">${(Number(r.consecutive_missed_payments)||0)>0?`STATUS: <strong>PAYMENT DELAYED</strong> · ${Number(r.consecutive_missed_payments)} missed tick${Number(r.consecutive_missed_payments)===1?"":"s"}`:"STATUS: <strong>RUNNING</strong>"}</span>
            </div>
            <div class="so-contract-stats">
                <div>
                    <div class="label">Revenue/Tick</div>
                    <div class="value green">${a(w(r.revenue_per_tick))}</div>
                </div>
                <div>
                    <div class="label">Vessels</div>
                    <div class="value">${r.freighters_required}</div>
                </div>
                <div>
                    <div class="label">Total Paid</div>
                    <div class="value">${a(w(f))}</div>
                </div>
            </div>
            ${p}
        </div>`}).join("")}function ke(e){const t=x.find(k=>k.id===e);if(!t)return;if(t.trade_agreement_id)return ye(t);if(R.has(t.id))return;const s=document.getElementById("so-modal-overlay"),o=document.getElementById("so-modal");if(!s||!o)return;const n=Number(u?.corp_freighters||0),r=Number(u?.corp_fleet_health||0),i=Number(u?.corp_route_risk||0),l=n>=t.freighters_required,v=t.min_fleet_health==null||r>=t.min_fleet_health,f=t.max_route_risk==null||i<=t.max_route_risk;let c=null;l?v?f||(c=`Route Risk too high: ≤ ${Number(t.max_route_risk).toFixed(1)} required, you are at ${i}.`):c=`Fleet Health below minimum: ${Number(t.min_fleet_health).toFixed(1)}+ required, you are at ${r}.`:c=`Insufficient freighters: contract requires ${t.freighters_required}, you have ${n}.`;const p=Number(t.revenue_per_tick)||0,_=Number(t.term_ticks)||1,g={lowest_price:"LOWEST PRICE — bidder with the lowest revenue/tick wins.",fastest_delivery:"FASTEST DELIVERY — bidder with the shortest term wins.",lowest_risk:"LOWEST RISK — bidder with the lowest current Route Risk wins."}[t.award_criterion]||"LOWEST PRICE — bidder with the lowest revenue/tick wins.";o.innerHTML=`
        <div class="so-modal-head">
            <div>
                <span class="so-modal-title-eyebrow">Bid on Route</span>
                <h2 id="so-modal-title" class="so-modal-title">${a(t.name||"Route")}</h2>
            </div>
            <button type="button" class="so-modal-close" data-modal-close aria-label="Close">×</button>
        </div>

        ${c?`<div class="so-modal-blocked">${a(c)}</div>`:""}

        <div class="so-modal-section">
            <div class="so-modal-section-title">Issuer</div>
            <div class="so-modal-row"><span>Name</span><span class="value">${a(t.issuer_name||"—")}</span></div>
            <div class="so-modal-row"><span>Type</span><span class="value">${a(String(t.contract_type||"").toUpperCase())}</span></div>
            <div class="so-modal-row"><span>Award Rule</span><span class="value">${a(g)}</span></div>
        </div>

        <div class="so-modal-section">
            <div class="so-modal-section-title">Posted Terms (Ceilings)</div>
            <div class="so-modal-row"><span>Revenue / Tick</span><span class="value">${a(w(p))}</span></div>
            <div class="so-modal-row"><span>Term</span><span class="value">${_} ticks</span></div>
            <div class="so-modal-row"><span>Freighters Required</span><span class="value">${t.freighters_required}</span></div>
        </div>

        <div class="so-modal-section">
            <div class="so-modal-section-title">Your Offer</div>
            <div class="so-modal-input-row">
                <div class="so-modal-field">
                    <label for="so-bid-revenue">Offered Revenue / Tick (≤ ${w(p)})</label>
                    <input type="number" id="so-bid-revenue" min="1" max="${p}" step="1" value="${p}" ${c?"disabled":""}>
                    <div class="so-modal-field-help">Undercut to win on lowest_price.</div>
                </div>
                <div class="so-modal-field">
                    <label for="so-bid-term">Offered Term (≤ ${_} ticks)</label>
                    <input type="number" id="so-bid-term" min="1" max="${_}" step="1" value="${_}" ${c?"disabled":""}>
                    <div class="so-modal-field-help">Shorten to win on fastest_delivery.</div>
                </div>
            </div>
        </div>

        <div class="so-modal-actions">
            <button type="button" class="so-modal-btn" data-modal-close>Cancel</button>
            <button type="button" class="so-modal-btn primary" id="so-bid-submit" ${c?"disabled":""}>Submit Bid ▸</button>
        </div>
    `,s.classList.add("open"),s.setAttribute("aria-hidden","false"),document.getElementById("so-bid-submit")?.addEventListener("click",()=>Ee(t.id))}const K=[{key:"known",name:"Known Shipping Route",desc:"Standard commercial corridor with charted waters and predictable conditions.",energy:0,risk:0,costM:0,baseline:!0},{key:"dangerous_waters",name:"Dangerous Waters",desc:"Cut through contested or pirate-active waters. Faster delivery, more cargo per tick — but exposure rises.",energy:2,risk:1,costM:0},{key:"naval_escort",name:"Naval Escort",desc:"Coordinate naval armed convoy protection across the route.",energy:0,risk:-2,costM:.3},{key:"premium_insurance",name:"Premium Insurance Bond",desc:"Lloyd's-tier coverage. Insurers reduce risk dramatically but skim a portion of cargo value.",energy:-1,risk:-3,costM:.1},{key:"bribe_port",name:"Bribe Port Authorities",desc:"Slip envelopes to harbormasters. Faster customs clearance, fewer delays — bribes come out of skim, not your line.",energy:1,risk:-1,costM:-.2},{key:"rush_schedule",name:"Rush Schedule",desc:"Push crews and engines hard. Maximum throughput, less idle time — fuel burn drops, but breakdowns climb.",energy:3,risk:2,costM:-.5}],G=[10,15,20,25,30],z=3,S=3;let q=!1,E=null;function ye(e){if(!e||!e.trade_agreement_id)return;const t=document.getElementById("so-modal-overlay"),s=document.getElementById("so-modal");if(!t||!s)return;const o=Math.max(0,Math.floor(Number(u?.corp_freighters)||0)),n=Number(e.volume_required)||0,r=Math.max(1,Math.ceil(n/S)),i=Math.min(o,r||1),l=R.get(e.id),v=new Set(["known"]);let f=15,c=i;if(l){if(Array.isArray(l.modifiers))for(const d of l.modifiers)v.add(d);G.includes(l.markup_pct)&&(f=l.markup_pct),Number.isInteger(l.freighters_allocated)&&l.freighters_allocated>0&&(c=Math.min(o,l.freighters_allocated))}E={contract:e,freighters:c,modifiers:v,markup:f};const p={fastest:"FASTEST DELIVERY — highest energy/tick wins",safest:"SAFEST DELIVERY — lowest route risk wins",cheapest:"CHEAPEST DELIVERY — lowest $/tick wins"}[e.delivery_priority]||"CHEAPEST DELIVERY — lowest $/tick wins",_=e.origin_nation?.name||"",g=e.destination_nation?.name||"",k=_?`${a(_)} ◊ ${a(e.origin_port||"")}`:a(e.origin_port||""),h=g?`${a(g)} ◊ ${a(e.destination_port||"")}`:a(e.destination_port||"");s.innerHTML=`
        <div class="so-modal-head">
            <div>
                <span class="so-modal-title-eyebrow">Offer Shipping</span>
                <h2 id="so-modal-title" class="so-modal-title">${a(e.name||"Trade Agreement Route")}</h2>
                <div class="so-offer-subtitle">Filing as: <strong>${a(u?.abbreviation||"")}</strong> ${a(u?.faction_name||"")}</div>
            </div>
            <button type="button" class="so-modal-close" data-modal-close aria-label="Close">×</button>
        </div>

        <div class="so-offer-route-banner">
            <div class="so-offer-route-port">
                <span class="so-offer-route-label">Origin</span>
                <span class="so-offer-route-name">${k}</span>
            </div>
            <span class="so-offer-route-arrow">━━━▸</span>
            <div class="so-offer-route-port right">
                <span class="so-offer-route-label">Destination</span>
                <span class="so-offer-route-name">${h}</span>
                <span class="so-offer-route-meta">${a(p)}</span>
            </div>
        </div>

        <div class="so-modal-section">
            <div class="so-modal-section-title">I. Freighter Allocation
                <span class="so-offer-section-meta">1 freighter = ${S} Energy/tick · agreement asks ${n}/tick (need ${r} freighters)</span>
            </div>
            <div class="so-offer-freight-block">
                <div class="so-offer-freight-display">
                    <div class="so-offer-freight-count">
                        <span id="so-offer-freight-count">${c}</span><span class="so-offer-freight-max">/ ${o}</span>
                    </div>
                    <div class="so-offer-freight-output">
                        <div class="so-offer-output-label">Base Energy/Tick</div>
                        <div class="so-offer-output-value" id="so-offer-base-energy">${c*S}</div>
                        <div class="so-offer-output-rate">Before route modifiers</div>
                    </div>
                </div>
                <label class="so-offer-freight-label" for="so-offer-freight-select">Assign Freighters</label>
                <select id="so-offer-freight-select" class="so-offer-freight-select">
                    ${Array.from({length:o+1},(d,$)=>$).map(d=>`<option value="${d}"${d===c?" selected":""}>${d} Freighter${d===1?"":"s"}</option>`).join("")}
                </select>
                <div class="so-offer-available-note">◊ Available freighters in your fleet: <span class="so-offer-available">${o}</span></div>
            </div>
        </div>

        <div class="so-modal-section">
            <div class="so-modal-section-title">II. Route Strategy
                <span class="so-offer-section-meta">Select Modifiers · Stack Effects</span>
            </div>
            <div class="so-offer-modifiers-grid" id="so-offer-modifiers-grid">
                ${K.map(d=>$e(d,v.has(d.key))).join("")}
            </div>
        </div>

        <div class="so-modal-section">
            <div class="so-modal-section-title">III. Pricing &amp; Markup
                <span class="so-offer-section-meta">Your Profit Margin</span>
            </div>
            <div class="so-offer-markup-block">
                <div class="so-offer-markup-display">
                    <div class="so-offer-markup-pct">
                        <span id="so-offer-markup-display">${f}</span><span class="so-offer-markup-pct-sign">%</span>
                    </div>
                    <div class="so-offer-margin-display">
                        <div class="so-offer-output-label">Profit Margin</div>
                        <div class="so-offer-margin-value" id="so-offer-margin-value">$0</div>
                        <div class="so-offer-output-rate">Per tick</div>
                    </div>
                </div>
                <div class="so-offer-markup-options" id="so-offer-markup-options">
                    ${G.map(d=>`<button type="button" class="so-offer-markup-option${d===f?" active":""}" data-markup="${d}">${d}%</button>`).join("")}
                </div>
            </div>
            <div class="so-offer-cost-summary">
                <div class="so-offer-cost-summary-header">Final Offer Breakdown</div>
                <div class="so-offer-cost-line"><span class="label" id="so-offer-op-label">Operating Cost</span><span class="value" id="so-offer-op-cost">$0</span></div>
                <div class="so-offer-cost-line"><span class="label">Route Modifier Costs</span><span class="value" id="so-offer-mod-cost">$0</span></div>
                <div class="so-offer-cost-line"><span class="label" id="so-offer-markup-label">Markup</span><span class="value" id="so-offer-markup-cost">$0</span></div>
                <div class="so-offer-cost-line total"><span class="label">Total Offer Price</span><span class="value" id="so-offer-total-cost">$0 / tick</span></div>
            </div>
        </div>

        <div class="so-modal-actions">
            <div class="so-offer-footer-summary">
                <div class="so-offer-footer-item">
                    <span class="so-offer-footer-label">Energy Delivered</span>
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
            <button type="button" class="so-modal-btn primary" id="so-offer-submit"${o===0?" disabled":""}>${l?"Update Offer ▸":"Submit Offer ▸"}</button>
        </div>
    `,t.classList.add("open"),t.setAttribute("aria-hidden","false"),document.getElementById("so-offer-freight-select")?.addEventListener("change",d=>{E.freighters=Math.max(0,Math.min(o,parseInt(d.target.value,10)||0)),document.getElementById("so-offer-freight-count").textContent=E.freighters,document.getElementById("so-offer-base-energy").textContent=E.freighters*S,P()}),document.getElementById("so-offer-modifiers-grid")?.addEventListener("click",d=>{const $=d.target.closest(".so-offer-modifier-card");if(!$)return;const I=$.dataset.key,C=K.find(O=>O.key===I);C&&(C.baseline||(E.modifiers.has(I)?(E.modifiers.delete(I),$.classList.remove("selected")):(E.modifiers.add(I),$.classList.add("selected")),P()))}),document.getElementById("so-offer-markup-options")?.addEventListener("click",d=>{const $=d.target.closest("button[data-markup]");if(!$)return;const I=parseInt($.dataset.markup,10);if(G.includes(I)){E.markup=I;for(const C of d.currentTarget.querySelectorAll("button"))C.classList.toggle("active",C===$);document.getElementById("so-offer-markup-display").textContent=I,P()}}),document.getElementById("so-offer-submit")?.addEventListener("click",we),P()}function $e(e,t){const s=[];if(e.energy!==0&&s.push(`<span class="so-offer-effect ${e.energy>0?"positive":"negative"}">${e.energy>0?"+":""}${e.energy} Energy/tick</span>`),e.risk!==0&&s.push(`<span class="so-offer-effect ${e.risk>0?"negative":"positive"}">${e.risk>0?"+":""}${e.risk} Route Risk</span>`),e.costM!==0){const o=e.costM>0?"+":"−",n=e.costM>0?"cost":"positive";s.push(`<span class="so-offer-effect ${n}">${o}$${Math.abs(e.costM)}M/tick</span>`)}return s.length===0&&s.push('<span class="so-offer-effect cost">BASELINE</span>'),`<div class="so-offer-modifier-card${t?" selected":""}${e.baseline?" baseline":""}" data-key="${e.key}">
        <div class="so-offer-modifier-checkbox"></div>
        <div class="so-offer-modifier-content">
            <div class="so-offer-modifier-name">${a(e.name)}</div>
            <div class="so-offer-modifier-desc">${a(e.desc)}</div>
            <div class="so-offer-modifier-effects">${s.join("")}</div>
        </div>
    </div>`}function P(){if(!E)return;const{contract:e,freighters:t,modifiers:s,markup:o}=E;let n=0,r=0,i=0;for(const b of s){const d=K.find($=>$.key===b);d&&(n+=d.energy,r+=d.risk,i+=d.costM)}const l=t*S,v=Number(e.volume_required)||1/0,f=Math.max(0,Math.min(v,l+n)),c=Math.max(0,(t*z+i)*1e6),p=Math.round(c*o/100),_=c+p,g=b=>(b<0?"−":"")+"$"+(Math.abs(b)/1e6).toFixed(1)+"M";document.getElementById("so-offer-op-label").textContent=`Operating Cost (${t} freighters × $${z}M)`,document.getElementById("so-offer-op-cost").textContent=g(t*z*1e6),document.getElementById("so-offer-mod-cost").textContent=g(i*1e6),document.getElementById("so-offer-markup-label").textContent=`Markup (${o}% applied)`,document.getElementById("so-offer-markup-cost").textContent="+"+g(p),document.getElementById("so-offer-total-cost").textContent=g(_)+" / tick",document.getElementById("so-offer-margin-value").textContent="+"+g(p),document.getElementById("so-offer-footer-energy").textContent=`${f}/tick`;const k=document.getElementById("so-offer-footer-risk");k.textContent=(r>=0?"+":"")+r,k.style.color=r>0?"var(--so-accent-red)":r<0?"var(--so-accent-green)":"var(--so-text-primary)",document.getElementById("so-offer-footer-profit").textContent=g(p)+"/tick";const h=document.getElementById("so-offer-submit");h&&(h.disabled=q||t<=0)}async function we(){if(q||!E)return;const{contract:e,freighters:t,modifiers:s,markup:o}=E;if(!e?.id)return;if(t<=0){m("Allocate at least 1 freighter.","error");return}q=!0;const n=document.getElementById("so-offer-submit");n&&(n.disabled=!0);try{const{data:r,error:i}=await y.rpc("place_shipping_offer",{p_contract_id:e.id,p_bidder_faction_id:u.id,p_freighters_allocated:t,p_modifiers:Array.from(s),p_markup_pct:o});if(i){m(i.message||"Offer failed.","error");return}if(!r?.success){m(r?.error||"Offer failed.","error");return}m(r.replaced?"Offer updated.":"Offer submitted. Auto-award on the next tick window.","success"),L(),await X(),J()}catch(r){console.error("[corp-shipping] place_shipping_offer failed:",r),m("Offer failed: "+(r?.message||"unknown"),"error")}finally{q=!1,n&&(n.disabled=!1)}}function L(){const e=document.getElementById("so-modal-overlay"),t=document.getElementById("so-modal");e&&(e.classList.remove("open"),e.setAttribute("aria-hidden","true"),t&&(t.innerHTML=""))}async function Ee(e){if(V)return;const t=document.getElementById("so-bid-revenue"),s=document.getElementById("so-bid-term"),o=document.getElementById("so-bid-submit");if(!t||!s)return;const n=Number(t.value),r=Number(s.value);if(!Number.isFinite(n)||n<=0||!Number.isFinite(r)||r<=0){m("Pick a valid revenue and term.","error");return}V=!0,o&&(o.disabled=!0);try{const{data:i,error:l}=await y.rpc("place_shipping_bid",{p_contract_id:e,p_bidder_faction_id:u.id,p_offered_revenue_per_tick:n,p_offered_term_ticks:r});if(l){m(l.message||"Bid failed.","error");return}if(!i?.success){m(i?.error||"Bid failed.","error");return}m("Bid placed. Auto-award after the bid window closes.","success"),L(),await X(),J()}catch(i){console.error("[corp-shipping] place_shipping_bid failed:",i),m("Bid failed: "+(i?.message||"unknown"),"error")}finally{V=!1,o&&(o.disabled=!1)}}function Ce(){const e=document.getElementById("so-available-list");e&&e.dataset.boundSo!=="1"&&(e.dataset.boundSo="1",e.addEventListener("click",t=>{const s=t.target.closest('.so-contract-card[data-clickable="1"]');if(!s)return;const o=s.getAttribute("data-contract-id");o&&ke(o)}))}function Ie(){const e=document.getElementById("so-modal-overlay");e&&e.dataset.boundSo!=="1"&&(e.dataset.boundSo="1",e.addEventListener("click",t=>{(t.target===e||t.target.matches("[data-modal-close]"))&&L()})),document.body.dataset.soEscBound!=="1"&&(document.body.dataset.soEscBound="1",document.addEventListener("keydown",t=>{t.key==="Escape"&&L()}))}const Q=[{key:"fleet_expansion",name:"Fleet Expansion",options:[{letter:"A",title:"Used Vessel Acquisition",desc:"Buy second-hand cargo ships from a struggling rival fleet — fast capacity, but the hulls bring maintenance headaches.",cost:5e7,effects:{freighters:2,fleet_health:-2}},{letter:"B",title:"New Build Order",desc:"Commission new vessels from the shipyards — slow and expensive, but the modern hulls bring reliability.",cost:9e7,effects:{freighters:3}}]},{key:"maintenance_program",name:"Maintenance Program",options:[{letter:"A",title:"Emergency Drydock Repairs",desc:"Pull vessels from active routes for urgent fixes — Fleet Health stabilizes, but ships out of service mean lost capacity.",cost:4e7,effects:{fleet_health:2,freighters:-2}},{letter:"B",title:"Comprehensive Refit & Modernization",desc:"Major overhaul of older vessels with new tech — restores Fleet Health and equips ships for safer routes.",cost:8e7,effects:{fleet_health:3,route_risk:-1}}]},{key:"route_diversification",name:"Route Diversification",options:[{letter:"A",title:"Open Secondary Trade Lane",desc:"Spread freighters thin across a new corridor — diversifies your exposure, but pulls vessels from existing lanes.",cost:5e7,effects:{route_risk:-2,freighters:-2}},{letter:"B",title:"Multi-Region Network Expansion",desc:"Build a fully diversified global network — major risk reduction and the new infrastructure improves fleet reliability.",cost:9e7,effects:{route_risk:-3,fleet_health:1}}]},{key:"insurance_hedging",name:"Insurance & Hedging",options:[{letter:"A",title:"Basic Marine Insurance Package",desc:"Buy bargain coverage from a discount underwriter — risk shifts to insurers, but cheap policies skimp on maintenance support.",cost:3e7,effects:{route_risk:-2,fleet_health:-2}},{letter:"B",title:"Premium Risk Management Contract",desc:"Engage Lloyd’s-tier underwriters with full advisory services — superior coverage, plus they help fund a new vessel.",cost:7e7,effects:{route_risk:-3,freighters:1}}]},{key:"high_risk_route",name:"High-Risk Lucrative Route",options:[{letter:"A",title:"Run the Contested Strait",desc:"Sail through dangerous waters that rivals avoid — premium freight rates demand high vessel utilization, and every voyage gambles with disaster.",cost:2e7,effects:{freighters:-2,route_risk:2}},{letter:"B",title:"Convoy with Naval Escort",desc:"Pay for naval protection on dangerous routes — slower and costlier, but your fleet returns intact with full holds.",cost:8e7,effects:{freighters:-3,route_risk:-1}}]},{key:"crew_training",name:"Crew Training",options:[{letter:"A",title:"Basic Mariner Certification",desc:"Run minimum-standard certification courses — better-trained crews keep ships running, but pulled vessels create capacity gaps.",cost:4e7,effects:{fleet_health:2,freighters:-2}},{letter:"B",title:"Elite Maritime Academy Partnership",desc:"Sponsor a top-tier officer program — your fleet earns elite certification and gains access to safer chartered lanes.",cost:8e7,effects:{fleet_health:3,route_risk:-1}}]},{key:"vessel_decommissioning",name:"Vessel Decommissioning",options:[{letter:"A",title:"Scrap Aging Vessels",desc:"Send the oldest hulls to the breakers’ yards — overall fleet quality rises, but headcount drops with the scrapped ships.",cost:3e7,effects:{fleet_health:2,freighters:-2}},{letter:"B",title:"Modernize & Repurpose Old Fleet",desc:"Refit aging vessels for niche routes instead of scrapping — keeps capacity and quality intact through clever redesign.",cost:7e7,effects:{fleet_health:3,freighters:1}}]},{key:"cargo_specialization",name:"Cargo Specialization",options:[{letter:"A",title:"Convert to Bulk Carrier Focus",desc:"Specialize the fleet for bulk commodities — ships become more efficient, but concentrating cargo type concentrates exposure.",cost:5e7,effects:{freighters:2,route_risk:2}},{letter:"B",title:"Diversified Cargo Capability",desc:"Outfit vessels for everything from containers to break-bulk — maximum flexibility, slightly safer routes.",cost:9e7,effects:{freighters:3,route_risk:-1}}]},{key:"geopolitical_lobbying",name:"Geopolitical Lobbying",options:[{letter:"A",title:"Bribe Port Authorities",desc:"Slip envelopes to harbormasters along your routes — paperwork moves faster, but the dirty deals breed neglect on the docks.",cost:4e7,effects:{route_risk:-2,fleet_health:-2}},{letter:"B",title:"Diplomatic Trade Relations Initiative",desc:"Build formal trade ties with foreign governments — slow, expensive, but unlocks safer corridors and a new vessel from a partnership deal.",cost:8e7,effects:{route_risk:-3,freighters:1}}]},{key:"fleet_modernization",name:"Fleet Modernization",options:[{letter:"A",title:"Engine Retrofit Program",desc:"Upgrade engines on existing vessels — better reliability, but ships out of service during the retrofit hurts capacity.",cost:5e7,effects:{fleet_health:2,freighters:-2}},{letter:"B",title:"Next-Generation Vessel Conversion",desc:"Full conversion to next-gen propulsion across the fleet — major investment, but emerges as a younger, larger fleet.",cost:1e8,effects:{fleet_health:3,freighters:1}}]}],xe={freighters:"Freighters",fleet_health:"Fleet Health",route_risk:"Route Risk"};let W=!1;function Ae(){const e=Number(u?.corp_shipping_action_locked_until_tick)||0,t=Number(B?.current_tick)||0;return Math.max(0,e-t)}function ie(){const e=document.getElementById("so-actions-grid"),t=document.getElementById("so-actions-meta"),s=document.getElementById("so-actions-cooldown-pill");if(!e)return;const o=Ae(),n=o>0;e.classList.toggle("locked",n),s&&(n?(s.className="so-actions-cooldown-pill",s.textContent=`LOCKED — ${o} TICK${o===1?"":"S"}`):(s.textContent="",s.className="")),t&&(t.textContent=n?`Locked until tick ${u.corp_shipping_action_locked_until_tick}`:`${Q.length} Initiatives ◊ Choose A or B (12-tick global cooldown)`),e.innerHTML=Q.map((r,i)=>Be(r,i,n)).join("")}function Be(e,t,s){const o=e.options.map((n,r)=>Re(e,n,t,r,s)).join("");return`<div class="so-action-card">
        <div class="so-action-name">${a(e.name)}</div>
        <div class="so-action-options">${o}</div>
    </div>`}function Re(e,t,s,o,n){const r=oe(t);return`<div class="so-action-option" ${n?'data-locked="1"':""}
                 data-action-key="${a(e.key)}"
                 data-choice="${a(t.letter)}"
                 data-card-idx="${s}" data-opt-idx="${o}">
        <span class="so-action-option-letter">${a(t.letter)}</span>
        <div class="so-action-option-content">
            <div class="so-action-option-title">${a(t.title)}</div>
            <div class="so-action-option-desc">${a(t.desc)}</div>
            <div class="so-action-option-effects">${r}</div>
        </div>
        <span class="so-action-option-cta">${n?"Locked":"Take ▸"}</span>
    </div>`}function oe(e){const t=[`<span class="so-effect cost">−${w(e.cost)}</span>`];for(const[s,o]of Object.entries(e.effects||{})){const n=o>0?"+":"",r=o>0?"positive":"negative";t.push(`<span class="so-effect ${r}">${n}${o} ${a(xe[s]||s)}</span>`)}return t.join("")}function Me(){const e=document.getElementById("so-actions-grid");!e||e.dataset.boundSo==="1"||(e.dataset.boundSo="1",e.addEventListener("click",t=>{const s=t.target.closest(".so-action-option");if(!s||s.hasAttribute("data-locked"))return;const o=Number(s.getAttribute("data-card-idx")),n=Number(s.getAttribute("data-opt-idx")),r=Q[o],i=r?.options[n];!r||!i||Ne(r,i)}))}function Ne(e,t){const s=document.getElementById("so-modal-overlay"),o=document.getElementById("so-modal");if(!s||!o)return;const n=oe(t);o.innerHTML=`
        <div class="so-modal-head">
            <div>
                <span class="so-modal-title-eyebrow">Confirm Strategic Action</span>
                <h2 id="so-modal-title" class="so-modal-title">${a(t.title)}</h2>
            </div>
            <button type="button" class="so-modal-close" data-modal-close aria-label="Close">×</button>
        </div>
        <div class="so-modal-section">
            <div class="so-modal-section-title">${a(e.name)} — Option ${a(t.letter)}</div>
            <p style="font-size:13px;color:var(--so-text-secondary);line-height:1.55;margin:0 0 14px;">${a(t.desc)}</p>
            <div class="so-action-option-effects" style="margin-bottom:12px;">${n}</div>
            <div class="so-modal-blocked" style="border-color:var(--so-accent-rust);background:rgba(160,99,58,0.08);color:var(--so-accent-rust);">
                ⚠ This locks all 10 Shipping Strategic Actions for 12 ticks.
            </div>
        </div>
        <div class="so-modal-actions">
            <button type="button" class="so-modal-btn" data-modal-close>Cancel</button>
            <button type="button" class="so-modal-btn primary" id="so-action-confirm">Confirm ▸</button>
        </div>
    `,s.classList.add("open"),s.setAttribute("aria-hidden","false"),document.getElementById("so-action-confirm")?.addEventListener("click",()=>{Te(e,t)})}async function Te(e,t){if(W)return;const s=document.getElementById("so-action-confirm");W=!0,s&&(s.disabled=!0);try{const{data:o,error:n}=await y.rpc("fire_shipping_action",{p_corp_id:u.id,p_action_key:e.key,p_choice:t.letter});if(n){m(n.message||"Action failed.","error");return}if(!o?.success){m(o?.error||"Action failed.","error");return}m("Action taken — locked for 12 ticks.","success"),L(),await se(),te(),ie()}catch(o){console.error("[corp-shipping] fire_shipping_action failed:",o),m("Action failed: "+(o?.message||"unknown"),"error")}finally{W=!1,s&&(s.disabled=!1)}}const Se={Construction:"corp-operations.html",Finance:"corp-operations-finance.html"};async function Fe(){const{data:{user:e}}=await y.auth.getUser();if(!e){window.location.href="login.html";return}const s=new URL(location.href).searchParams.get("faction_id");if(s){const{data:i,error:l}=await y.from("factions").select("*").eq("id",s).single();l?console.warn("[corp-shipping] inspector fetch failed:",l.message):i?.faction_type==="corporation"&&(u=i)}if(!u){const{data:i}=await y.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);T=(i||[]).filter(f=>f.nation_id);const l=sessionStorage.getItem("active_faction_id");if(u=T.find(f=>f.id===l)||T.find(f=>f.faction_type==="corporation")||T[0],!u){await y.auth.signOut(),window.location.href="login.html";return}if(u.faction_type!=="corporation"){window.location.href="dashboard.html";return}const v=u.corp_sector||"";if(v!=="Shipping"){const f=Se[v]||"corp-dashboard.html",c=s?`?faction_id=${encodeURIComponent(s)}`:"";window.location.replace(f+c);return}}const[o,n]=await Promise.all([u.nation_id?y.from("nations").select("id, name, capital").eq("id",u.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);o?.data&&o.data,n?.data&&(B=n.data);const r=document.getElementById("corp-topbar-container");if(r)try{const{renderCorpTopBar:i}=await ne(async()=>{const{renderCorpTopBar:l}=await import("./corp-topbar-BVNorCyj.js");return{renderCorpTopBar:l}},__vite__mapDeps([0,1]));i(r,{faction:u,shard:B,activeTab:"operations",allUserFactions:T})}catch(i){console.error("[corp-shipping] topbar render failed:",i)}document.getElementById("so-footer-date").textContent=B?.current_date||"—",document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="",te(),ie(),_e(),Ce(),Me(),Ie(),await Promise.all([j(),X(),he()]),J(),be()}Fe().catch(e=>{console.error("[corp-shipping] init failed:",e),fe("Failed to load: "+(e?.message||"unknown error"))});
