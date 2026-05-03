const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-B9cSZncf.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as h}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as oe}from"./preload-helper-BXl3LOEh.js";import{t as ne,e as r}from"./utils-DGqmZD5X.js";const re={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html"};function se(e){const t=Number(e)||0;return t>=7?"good":t>=4?"mid":"warn"}function ie(e){const t=Number(e)||0;return t>=8?"danger":t>=7?"warn":t>=4?"mid":"good"}const ce=[{key:"capital",column:"corp_lending_capital",eyebrow:"CAPACITY",name:"Lending",emName:"Capital",tooltip:"How much principal you can have outstanding across all active loans. Falls as you fund loans and recovers as borrowers repay. Caps the size of any single loan you can approve and the share of sovereign-grade borrowers willing to bring you their book.",blurb:{good:"<strong>Strong deposit base, broad borrower roster.</strong> Capital reserves cover even sovereign-grade lending. Bigger banks compete with you, not above you.",mid:"<strong>Adequate capital reserves.</strong> Mid-tier loans are well within reach; the largest sovereign issues still require partner banks.",warn:"<strong>Modest deposit base, limited borrower roster.</strong> Capital reserves cover only mid-tier loans. Major borrowers go to bigger banks. Growth requires bond issuance or aggressive deposit drives."},impacts:{good:[{label:"Max Loan Size",value:"$500M+"},{label:"Sovereign-Grade",value:"Yes",tone:"good"}],mid:[{label:"Max Loan Size",value:"$250M"},{label:"Sovereign-Grade",value:"Limited"}],warn:[{label:"Max Loan Size",value:"$120M"},{label:"Sovereign-Grade",value:"No",tone:"rust"}]}},{key:"rates",column:"corp_interest_rates",eyebrow:"PRICING POWER",name:"Interest",emName:"Rates",tooltip:"Where your APR sits versus the market. Higher rates earn fatter margins per loan but cost you against price-sensitive borrowers; lower rates win bidding rounds but compress profit. Tunes the trade-off between bid-win frequency and per-loan return.",blurb:{good:"<strong>Premium rates accepted by the market.</strong> Reputation justifies a meaningful spread over competitors. Net margins are healthy and growing.",mid:"<strong>Market-rate pricing.</strong> Loan APR sits in line with peer banks. Margins are reasonable but not differentiated.",warn:"<strong>Competitive low rates — razor-thin margins.</strong> Attractive to borrowers, but profit per loan is slim. Reputation has not yet earned premium pricing."},impacts:{good:[{label:"Loan APR",value:"7.8%"},{label:"Net Margin",value:"4.6%",tone:"good"}],mid:[{label:"Loan APR",value:"5.5%"},{label:"Net Margin",value:"2.7%"}],warn:[{label:"Loan APR",value:"4.2%"},{label:"Net Margin",value:"1.8%",tone:"rust"}]}},{key:"leverage",column:"corp_overleverage",eyebrow:"RISK EXPOSURE",name:"Over",emName:"leverage",inverted:!0,tooltip:"Inverted stat — lower is better. Tracks the size of your loan book against your reserves. Climbs as you fund loans, falls as they amortize. At 8+ you can't approve new loans; at 9 cash bleeds to interbank rates; at 10 a Bank Run is triggered.",blurb:{good:"<strong>Healthy reserve buffer — every dollar lent backed by 3+ in reserves.</strong> Conservative balance sheet. The Central Bank's quarterly review is favorable. Room to grow before risk becomes systemic.",mid:"<strong>Moderate exposure.</strong> Books are leaning into the loan portfolio. Still survivable in a downturn, but a stress event would hurt.",warn:"<strong>Elevated risk profile.</strong> The portfolio is stretched. Default-buffer is thin; another loan or two could tip you into the 8+ stressed zone.",danger:"<strong>Stressed balance sheet — Central Bank is watching.</strong> At 8+ you cannot approve new loans. At 9 cash starts bleeding to interbank borrowing rates and depositor flight becomes possible. At 10 a Bank Run is triggered."},impacts:{good:[{label:"Reserve Ratio",value:"31%",tone:"good"},{label:"Default Buffer",value:"Strong",tone:"good"}],mid:[{label:"Reserve Ratio",value:"20%"},{label:"Default Buffer",value:"Moderate"}],warn:[{label:"Reserve Ratio",value:"12%",tone:"rust"},{label:"Default Buffer",value:"Thin",tone:"rust"}],danger:[{label:"Reserve Ratio",value:"<8%",tone:"warn"},{label:"Default Buffer",value:"Critical",tone:"warn"}]}}];function le(e){const t=Number(d?.[e.column]??0),a=t.toFixed(1).replace(/\.0$/,""),o=e.inverted?ie(t):se(t),n=Math.max(0,Math.min(10,Math.round(t))),s=Array.from({length:10},(p,I)=>{const y=I<n,b=e.inverted&&y&&I>=7,m=["fo-hero-meter-cell"];return y&&m.push("filled"),b&&m.push("danger"),`<div class="${m.join(" ")}"></div>`}).join(""),i=e.blurb?.[o]||e.blurb?.warn||"",c=(e.impacts?.[o]||e.impacts?.warn||[]).map(p=>`<div>
            <span class="label">${r(p.label)}</span>
            <span class="value${p.tone?" "+p.tone:""}">${r(p.value)}</span>
        </div>`).join(""),u="neutral",l="— FOUNDING POSITION",f=e.inverted?'<span class="fo-inverted-note">⚠ HIGH = DANGER</span>':"",g=e.tooltip?`<span class="fo-hero-tip" data-tip="${r(e.tooltip).replace(/"/g,"&quot;")}" aria-label="What is ${r(e.name)}?">?</span>`:"";return`<div class="fo-hero-stat" data-stat="${r(e.key)}">
        ${f}
        <div class="fo-hero-stat-eyebrow">${r(e.eyebrow)}</div>
        <div class="fo-hero-stat-name">${r(e.name)} <em>${r(e.emName)}</em>${g}</div>
        <div class="fo-hero-stat-value-row">
            <div class="fo-hero-stat-value">${r(a)}<span class="fo-max">/10</span></div>
            <div class="fo-hero-stat-trend ${u}">${r(l)}</div>
        </div>
        <div class="fo-hero-meter">${s}</div>
        <div class="fo-hero-stat-desc">${i}</div>
        <div class="fo-hero-stat-impact">${c}</div>
    </div>`}function G(){const e=document.getElementById("fo-hero-stats");e&&(e.innerHTML=ce.map(le).join(""))}async function U(){if(!d?.id){A=[];return}const e=Number(k?.current_tick||0),{data:t,error:a}=await h.from("bank_loan_requests").select(`
            id, principal, term_ticks, risk_grade, purpose, expires_at_tick,
            requesting_faction:factions!requesting_faction_id (
                faction_name, corp_ticker, corp_sector,
                corp_cash_reserves, corp_debt, corp_reputation
            ),
            requesting_nation:nations!requesting_nation_id ( name )
        `).eq("status","pending").gt("expires_at_tick",e).contains("target_bank_ids",[d.id]).order("expires_at_tick",{ascending:!0});if(a){console.error("[fo] available requests fetch error:",a.message),A=[];return}if(!t||t.length===0){A=[];return}const o=t.map(c=>c.id),{data:n,error:s}=await h.from("bank_loan_offers").select("request_id").eq("bank_faction_id",d.id).in("request_id",o);s&&console.warn("[fo] my-offers fetch error:",s.message);const i=new Set((n||[]).map(c=>c.request_id));A=t.filter(c=>!i.has(c.id))}function W(){const e=document.getElementById("fo-available-list"),t=document.getElementById("fo-available-meta");if(!e)return;if(A.length===0){t&&(t.textContent="No incoming requests"),e.innerHTML='<div class="fo-contract-empty">No open loan requests targeting this bank right now.</div>';return}if(t){const o=A.length;t.textContent=`${o} Open ◊ Click to Review`}const a=Number(k?.current_tick||0);e.innerHTML=A.map(o=>{const n=o.requesting_faction||{},s=o.requesting_nation||{},i=n.corp_ticker||"—",c=n.faction_name||"—",u=n.corp_sector||"",l=Math.max(0,Number(o.expires_at_tick||0)-a),f=l<=3?"urgent":"",g=Number(o.term_ticks||0),p=o.purpose?String(o.purpose).trim():"";return`<div class="fo-offer-card" data-request-id="${r(o.id)}" tabindex="0" role="button" aria-label="Review loan request from ${r(c)}">
            <div class="fo-offer-card-head">
                <div class="fo-offer-card-ticker">${r(i)}</div>
                <div class="fo-offer-card-grade" data-grade="${r(o.risk_grade||"")}">${r(o.risk_grade||"—")}</div>
            </div>
            <div class="fo-offer-card-borrower">
                <span class="name">${r(c)}</span>
                ${u?`<span class="meta">${r(u)}</span>`:""}
                ${s.name?`<span class="meta">◊ ${r(s.name)}</span>`:""}
            </div>
            <div class="fo-offer-card-principal">${r(_(o.principal))}</div>
            <div class="fo-offer-card-meta">
                <span>${r(String(g))} TICK${g===1?"":"S"}</span>
                ${p?`<span class="purpose">— ${r(p)}</span>`:""}
            </div>
            <div class="fo-offer-card-foot">
                <span class="${f}">EXPIRES IN ${l} TICK${l===1?"":"S"}</span>
                <span class="fo-offer-card-cta">REVIEW →</span>
            </div>
        </div>`}).join("")}const D=[12,24,36,48,60,84],T=12;function de(e){const t=Number(e)||0;if(!t)return 36;let a=D[0],o=Math.abs(a-t);for(const n of D){const s=Math.abs(n-t);(s<o||s===o&&n>a)&&(a=n,o=s)}return a}function fe(e){const t=Math.max(0,Number(e)||0);return t>=12?12:Math.round((t+12)/2*10)/10}function z(e,t,a){const o=Number(e)||0,n=Number(t)||0,s=Number(a)||0,i=s/T,c=Math.round(o*(n/100)*i),u=s>0?Math.round((o+c)/s):0;return{totalInterest:c,perTickPayment:u,termYears:i}}let F=!1;function ue(e){const t=A.find(E=>E.id===e);if(!t)return;const a=document.getElementById("fo-modal-overlay"),o=document.getElementById("fo-modal");if(!a||!o)return;const n=t.requesting_faction||{},s=t.requesting_nation||{},i=Number(t.principal)||0,c=Number(t.term_ticks)||0,u=Number(k?.current_tick||0),l=Math.max(0,Number(t.expires_at_tick||0)-u),f=Math.max(0,Number(d?.corp_interest_rates)||0),g=Number(d?.corp_overleverage)||0,p=g>=8,I=f>12,y=p?`You are Stressed (overleverage ${g.toFixed(1)} ≥ 8). The Central Bank has frozen new loan offers until you reduce risk.`:I?`Your interest-rates floor (${f.toFixed(1)}%) exceeds the 12% market cap. You cannot make a competitive offer at current pricing power.`:null;let b=fe(f),m=de(c);const S=()=>{const{totalInterest:E,perTickPayment:M,termYears:C}=z(i,b,m),x=D.map(w=>{const ee=w===m,N=w/T,te=Number.isInteger(N)?`${N} yr${N===1?"":"s"}`:`${N.toFixed(1)} yrs`,ae=w===c?" (REQ.)":"";return`<button type="button" class="fo-term-btn${ee?" active":""}" data-term="${w}">
                <strong>${w} TICKS</strong>
                <span class="sub">${r(te)}${ae}</span>
            </button>`}).join(""),L=y?"disabled":"",Z=y?"disabled":"";o.innerHTML=`
            <div class="fo-modal-head">
                <div>
                    <span class="fo-modal-title-eyebrow">Review Loan Request</span>
                    <h2 id="fo-modal-title" class="fo-modal-title">${r(n.faction_name||"Unknown Borrower")}</h2>
                </div>
                <button type="button" class="fo-modal-close" data-modal-close aria-label="Close">×</button>
            </div>

            ${y?`<div class="fo-modal-blocked">${r(y)}</div>`:""}

            <div class="fo-review-section">
                <div class="fo-review-section-title">I. Applicant Profile</div>
                <div class="fo-review-applicant-name">${r(n.faction_name||"—")}</div>
                <div class="fo-review-applicant-meta">
                    ${n.corp_ticker?`<strong>${r(n.corp_ticker)}</strong> ◊ `:""}
                    ${n.corp_sector?`${r(n.corp_sector)} ◊ `:""}
                    ${s.name?`${r(s.name)}`:""}
                </div>
                <div class="fo-review-row">
                    <span class="label">Cash Reserves</span>
                    <span class="value">${r(_(n.corp_cash_reserves))}</span>
                </div>
                <div class="fo-review-row">
                    <span class="label">Outstanding Debt</span>
                    <span class="value">${r(_(n.corp_debt))}</span>
                </div>
                <div class="fo-review-row">
                    <span class="label">Reputation</span>
                    <span class="value">${r((Number(n.corp_reputation)||0).toFixed(1))}<span class="muted"> / 10</span></span>
                </div>
            </div>

            <div class="fo-review-section">
                <div class="fo-review-section-title">II. Loan Request</div>
                <div class="fo-review-principal">${r(_(i))}</div>
                ${t.purpose?`<div class="fo-review-purpose">"${r(t.purpose)}"</div>`:""}
                <div class="fo-review-row">
                    <span class="label">Requested Term</span>
                    <span class="value">${c} TICK${c===1?"":"S"}<span class="muted"> · ${(c/T).toFixed(c%T===0?0:1)} YR</span></span>
                </div>
                <div class="fo-review-row">
                    <span class="label">Risk Grade</span>
                    <span class="value">${r(t.risk_grade||"—")}</span>
                </div>
                <div class="fo-review-row">
                    <span class="label">Window Closes</span>
                    <span class="value ${l<=3?"warn":""}">${l} TICK${l===1?"":"S"}</span>
                </div>
            </div>

            <div class="fo-review-section">
                <div class="fo-review-section-title">III. Pledged Collateral</div>
                <div class="fo-review-collateral-empty">Unsecured ◊ No collateral pledged</div>
            </div>

            <div class="fo-review-section">
                <div class="fo-review-section-title">IV. Your Offer Terms</div>

                <div class="fo-offer-rate-block">
                    <div class="fo-offer-rate-display">
                        <span class="rate" id="fo-rate-display">${b.toFixed(1)}</span><span class="pct">%</span>
                        <span class="label">APR</span>
                    </div>
                    <input type="range" class="fo-offer-slider" id="fo-offer-slider"
                        min="${f.toFixed(2)}" max="12" step="0.1"
                        value="${b.toFixed(1)}" ${L}
                        aria-label="Offered APR">
                    <div class="fo-offer-rate-bounds">
                        <span>FLOOR ${f.toFixed(1)}%</span>
                        <span>CAP 12.0%</span>
                    </div>
                </div>

                <div class="fo-offer-term-block">
                    <div class="fo-offer-term-label">TERM</div>
                    <div class="fo-offer-term-buttons" id="fo-term-buttons">${x}</div>
                </div>
            </div>

            <div class="fo-review-section fo-impact-box">
                <div class="fo-review-section-title">V. Impact Preview</div>
                <div class="fo-review-row">
                    <span class="label">Total Interest Earned</span>
                    <span class="value good" id="fo-impact-interest">${r(_(E))}</span>
                </div>
                <div class="fo-review-row">
                    <span class="label">Borrower Per-Tick Payment</span>
                    <span class="value" id="fo-impact-per-tick">${r(_(M))}</span>
                </div>
                <div class="fo-review-row">
                    <span class="label">Term in Years</span>
                    <span class="value" id="fo-impact-years">${C.toFixed(C%1===0?0:1)} YR${C===1?"":"S"}</span>
                </div>
            </div>

            <div class="fo-modal-actions">
                <button type="button" class="fo-modal-btn" data-modal-close>Cancel</button>
                <button type="button" class="fo-modal-btn primary" id="fo-offer-submit" ${Z}>Submit Offer ▸</button>
            </div>
        `;const K=o.querySelector("#fo-offer-slider");K?.addEventListener("input",()=>{b=Number(K.value),B()}),o.querySelectorAll("[data-term]").forEach(w=>{w.addEventListener("click",()=>{m=Number(w.getAttribute("data-term"))||m,S()})}),o.querySelector("#fo-offer-submit")?.addEventListener("click",()=>{pe(t.id)})},B=()=>{const{totalInterest:E,perTickPayment:M}=z(i,b,m),C=o.querySelector("#fo-rate-display"),x=o.querySelector("#fo-impact-interest"),L=o.querySelector("#fo-impact-per-tick");C&&(C.textContent=b.toFixed(1)),x&&(x.textContent=_(E)),L&&(L.textContent=_(M))};S(),a.classList.add("open"),a.setAttribute("aria-hidden","false")}function q(){const e=document.getElementById("fo-modal-overlay"),t=document.getElementById("fo-modal");e&&(e.classList.remove("open"),e.setAttribute("aria-hidden","true"),t&&(t.innerHTML=""))}async function pe(e){if(F)return;const t=document.getElementById("fo-offer-slider"),a=document.querySelector("#fo-term-buttons .fo-term-btn.active"),o=document.getElementById("fo-offer-submit");if(!t||!a)return;const n=Number(t.value),s=Number(a.getAttribute("data-term"));if(!Number.isFinite(n)||!Number.isFinite(s)||s<=0){v("Pick a valid rate and term.","error");return}F=!0,o&&(o.disabled=!0);try{const{data:i,error:c}=await h.rpc("submit_loan_offer",{p_request_id:e,p_bank_faction_id:d.id,p_offered_apr:n,p_offered_term_ticks:s});if(c){v(c.message||"Submission failed.","error");return}if(!i?.success){v(i?.error||"Submission failed.","error");return}v(`Offer submitted at ${n.toFixed(1)}% for ${s} ticks.`,"success"),q(),await U(),W()}catch(i){console.error("[fo] submit_loan_offer failed:",i),v("Submission failed: "+(i?.message||"unknown"),"error")}finally{F=!1,o&&(o.disabled=!1)}}function me(){const e=document.getElementById("fo-modal-overlay");e&&e.dataset.boundFo!=="1"&&(e.dataset.boundFo="1",e.addEventListener("click",t=>{(t.target===e||t.target.matches("[data-modal-close]"))&&q()})),document.body.dataset.foEscBound!=="1"&&(document.body.dataset.foEscBound="1",document.addEventListener("keydown",t=>{t.key==="Escape"&&q()}))}function v(e,t){document.querySelectorAll(".fo-toast").forEach(o=>o.remove());const a=document.createElement("div");a.className="fo-toast"+(t?" "+t:""),a.textContent=e,document.body.appendChild(a),setTimeout(()=>{a.classList.add("fade"),setTimeout(()=>a.remove(),280)},3e3)}async function Q(){if(!d?.id){$=[];return}const{data:e,error:t}=await h.from("bank_loans").select(`
            id, principal, apr, term_ticks, outstanding, payments_missed,
            status, matures_at_tick,
            borrower:factions!borrower_faction_id (
                faction_name, corp_ticker
            ),
            nation:nations!nation_id ( name )
        `).eq("lender_faction_id",d.id).in("status",["pending_payout","active"]).order("status",{ascending:!0}).order("matures_at_tick",{ascending:!0});if(t){console.error("[fo] active agreements fetch error:",t.message),$=[];return}$=e||[]}function j(){const e=document.getElementById("fo-active-list"),t=document.getElementById("fo-active-meta"),a=document.getElementById("fo-active-count");if(!e)return;if(a&&(a.textContent=String($.length)),$.length===0){t&&(t.textContent="No active loans"),e.innerHTML='<div class="fo-contract-empty">You have no live loans on the books. Submit offers from Available Offers to start lending.</div>';return}if(t){const n=$.filter(c=>c.status==="pending_payout").length,s=$.length-n,i=[];n&&i.push(`${n} Pending Payout`),s&&i.push(`${s} Active`),t.textContent=i.join(" ◊ ")}const o=Number(k?.current_tick||0);e.innerHTML=$.map(n=>{const s=n.borrower||{},i=n.nation||{},c=s.corp_ticker||"—",u=s.faction_name||"—",l=Number(n.apr)||0,f=Number(n.term_ticks)||0,g=n.status==="pending_payout",p=P.has(n.id),I=`<div class="fo-active-card-head">
            <div class="fo-active-card-ticker">${r(c)}</div>
            <div class="fo-active-card-status ${g?"pending":"active"}">
                ${g?"Pending Payout":"Active"}
            </div>
        </div>
        <div class="fo-active-card-borrower">
            <span class="name">${r(u)}</span>
            ${i.name?`<span class="meta">◊ ${r(i.name)}</span>`:""}
        </div>
        <div class="fo-active-card-principal">${r(_(n.principal))}</div>`;let y,b;if(g){y=`<div class="fo-active-card-meta">
                <span><span class="label">APR</span>${l.toFixed(1)}%</span>
                <span><span class="label">TERM</span>${f} TICKS</span>
            </div>`;const m=p?"Disbursing…":"Pay Out Loan ▸";b=`<div class="fo-active-card-foot">
                <span class="fo-active-card-note warn">⚠ Awaiting your disbursement</span>
                <button type="button" class="fo-payout-btn" data-payout-id="${r(n.id)}" ${p?"disabled":""}>
                    ${r(m)}
                </button>
            </div>`}else{const m=Number(n.matures_at_tick)||0,S=Math.max(0,m-o),B=Number(n.payments_missed)||0;y=`<div class="fo-active-card-meta">
                <span><span class="label">OUTSTANDING</span>${r(_(n.outstanding))}</span>
                <span><span class="label">APR</span>${l.toFixed(1)}%</span>
                <span><span class="label">MATURES IN</span>${S} TICKS</span>
                ${B>0?`<span class="warn"><span class="label">MISSED</span>${B}</span>`:""}
            </div>`,b=""}return`<div class="fo-active-card${g?" pending":""}">
            ${I}
            ${y}
            ${b}
        </div>`}).join("")}const P=new Set;async function ve(e){if(!(!e||P.has(e))){P.add(e),j();try{const{data:t,error:a}=await h.rpc("pay_out_loan",{p_loan_id:e});if(a){v(a.message||"Payout failed.","error");return}if(!t?.success){v(t?.error||"Payout failed.","error");return}v(`Disbursed ${_(t.principal_disbursed)}.`,"success"),await Promise.all([Q(),V()])}catch(t){console.error("[fo] pay_out_loan failed:",t),v("Payout failed: "+(t?.message||"unknown"),"error")}finally{P.delete(e),j(),G()}}}async function V(){if(!d?.id)return;const{data:e,error:t}=await h.from("factions").select("corp_cash_reserves, corp_lending_capital, corp_interest_rates, corp_overleverage, corp_finance_action_locked_until_tick").eq("id",d.id).single();if(t||!e){console.error("[fo] refetch faction state failed:",t?.message);return}Object.assign(d,e)}function ge(){const e=document.getElementById("fo-active-list");!e||e.dataset.boundFo==="1"||(e.dataset.boundFo="1",e.addEventListener("click",t=>{const a=t.target.closest("[data-payout-id]");!a||a.disabled||ve(a.getAttribute("data-payout-id"))}))}function be(){const e=document.getElementById("fo-available-list");if(!e||e.dataset.boundFo==="1")return;e.dataset.boundFo="1";const t=a=>{const o=a.closest(".fo-offer-card[data-request-id]");o&&ue(o.getAttribute("data-request-id"))};e.addEventListener("click",a=>t(a.target)),e.addEventListener("keydown",a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),t(a.target))})}const Y=[{key:"capital_raise",name:"Capital Raising",options:[{letter:"A",title:"Quick Bond Issuance",desc:"Issue short-term bonds to raise immediate capital — fast, but the new debt drives leverage up.",cost:6e7,effects:{lending:2,over:2}},{letter:"B",title:"Equity Capital Raise",desc:"Sell shares to long-term investors — bigger raise, dilutes ownership but cleans the balance sheet.",cost:15e7,effects:{lending:3,over:-1}}]},{key:"aggressive_lending",name:"Aggressive Lending Push",options:[{letter:"A",title:"Subprime Loan Expansion",desc:"Underwrite weaker borrowers en masse — capital deploys fast but bad-debt risk climbs.",cost:4e7,effects:{lending:-1,over:2}},{letter:"B",title:"Prime Borrower Campaign",desc:"Court top-tier borrowers with attractive rates — capital deploys, but you sacrifice margin to win them.",cost:7e7,effects:{lending:-2,rates:-1}}]},{key:"rate_hike",name:"Rate Hike Strategy",options:[{letter:"A",title:"Quiet Rate Increase",desc:"Quietly raise loan rates — pricing power up, but borrowers flee to competitors.",cost:3e7,effects:{rates:2,lending:-2}},{letter:"B",title:"Premium Rate Justification Campaign",desc:"Brand the bank around premium service to justify higher rates — borrowers stay AND rates climb.",cost:7e7,effects:{rates:3,lending:1}}]},{key:"rate_cut",name:"Rate Cut Strategy",options:[{letter:"A",title:"Promotional Loan Rate Drop",desc:"Run a promotional drop on loan rates — capital deploys fast, leverage ticks up, margins compress.",cost:4e7,effects:{rates:-2,lending:-2,over:1}},{letter:"B",title:"Strategic Loss-Leader Pricing",desc:"Cut rates aggressively to flood the borrower base — massive deployment at razor-thin spreads.",cost:8e7,effects:{rates:-3,lending:-3}}]},{key:"reserve_building",name:"Reserve Building",options:[{letter:"A",title:"Emergency Capital Buffer",desc:"Lock cash into emergency reserves — leverage drops sharply but lending capacity tightens.",cost:5e7,effects:{over:-2,lending:-2}},{letter:"B",title:"Conservative Balance Sheet Reform",desc:"Restructure the books for prudence — leverage falls hard and the cleaner sheet supports premium pricing.",cost:9e7,effects:{over:-3,rates:1}}]},{key:"high_yield",name:"Risky High-Yield Investment",options:[{letter:"A",title:"Speculative Asset Purchase",desc:"Buy speculative assets in the hopes of outsized returns — capital grows, but risk piles on.",cost:5e7,effects:{lending:2,over:3}},{letter:"B",title:"Hedged Investment Portfolio",desc:"Build a hedged portfolio — bigger capital gains, with risk kept in check by the hedges.",cost:1e8,effects:{lending:3,over:1}}]},{key:"deposit_drive",name:"Deposit Drive",options:[{letter:"A",title:"High-Rate Savings Promotion",desc:"Court depositors with above-market savings rates — deposits flood in, but interest spreads compress.",cost:4e7,effects:{lending:2,rates:-2}},{letter:"B",title:"Premium Wealth Management Program",desc:"Launch a wealth-management arm — wealthy clients accept worse savings rates for the prestige.",cost:8e7,effects:{lending:3,rates:1}}]},{key:"loan_restructuring",name:"Loan Restructuring",options:[{letter:"A",title:"Write Down Bad Loans",desc:"Write off underperforming loans — leverage drops but lending capacity takes a hit too.",cost:6e7,effects:{over:-1,lending:-1}},{letter:"B",title:"Comprehensive Portfolio Cleanup",desc:"Full portfolio cleanup — deep leverage drop and the cleaner book justifies premium rates.",cost:9e7,effects:{over:-3,rates:1}}]},{key:"foreign_capital",name:"Foreign Capital Partnership",options:[{letter:"A",title:"Accept High-Interest Foreign Loans",desc:"Borrow expensive capital from abroad — fast capacity boost, but foreign debt service drives both rates and leverage up.",cost:3e7,effects:{lending:2,over:2,rates:1}},{letter:"B",title:"Negotiate Sovereign Investment Deal",desc:"Strike a sovereign-backed investment partnership — bigger boost with leverage relief baked in.",cost:8e7,effects:{lending:3,over:-1}}]},{key:"central_bank",name:"Central Bank Compliance",options:[{letter:"A",title:"Meet Minimum Reserve Requirement",desc:"Comply with the regulator’s minimum reserve floor — leverage drops, lending capacity reduces.",cost:65e6,effects:{over:-2,lending:-2}},{letter:"B",title:"Exceed Regulatory Standards",desc:"Go beyond minimums for regulatory trust — deep leverage drop and trust unlocks expanded operations.",cost:8e7,effects:{over:-3,lending:1}}]}],_e={lending:"Lending",rates:"Rates",over:"Overleverage"};let O=!1;function he(){const e=Number(d?.corp_finance_action_locked_until_tick)||0,t=Number(k?.current_tick)||0;return Math.max(0,e-t)}function X(){const e=document.getElementById("fo-actions-grid"),t=document.getElementById("fo-actions-meta"),a=document.getElementById("fo-actions-cooldown-pill");if(!e)return;const o=he(),n=o>0;e.classList.toggle("locked",n),a&&(n?(a.className="fo-actions-cooldown-pill",a.textContent=`LOCKED — ${o} TICK${o===1?"":"S"}`):(a.textContent="",a.className="")),t&&(t.textContent=n?`Locked until tick ${d.corp_finance_action_locked_until_tick}`:`${Y.length} Initiatives ◊ Choose A or B (12-tick global cooldown)`),e.innerHTML=Y.map((s,i)=>ye(s,i,n)).join("")}function ye(e,t,a){const o=e.options.map((n,s)=>ke(e,n,t,s,a)).join("");return`<div class="fo-action-card">
        <div class="fo-action-name">${r(e.name)}</div>
        <div class="fo-action-options">${o}</div>
    </div>`}function ke(e,t,a,o,n){const s=J(t);return`<div class="fo-action-option" ${n?'data-locked="1"':""}
                 data-action-key="${r(e.key)}"
                 data-choice="${r(t.letter)}"
                 data-card-idx="${a}" data-opt-idx="${o}">
        <span class="fo-action-option-letter">${r(t.letter)}</span>
        <div class="fo-action-option-content">
            <div class="fo-action-option-title">${r(t.title)}</div>
            <div class="fo-action-option-desc">${r(t.desc)}</div>
            <div class="fo-action-option-effects">${s}</div>
        </div>
        <span class="fo-action-option-cta">${n?"Locked":"Take ▸"}</span>
    </div>`}function J(e){const t=[`<span class="fo-effect cost">−${_(e.cost).replace("-","")}</span>`];for(const[a,o]of Object.entries(e.effects||{})){const n=o>0?"+":"",s=o>0?"positive":"negative";t.push(`<span class="fo-effect ${s}">${n}${o} ${r(_e[a]||a)}</span>`)}return t.join("")}function we(){const e=document.getElementById("fo-actions-grid");!e||e.dataset.boundFo==="1"||(e.dataset.boundFo="1",e.addEventListener("click",t=>{const a=t.target.closest(".fo-action-option");if(!a||a.hasAttribute("data-locked"))return;const o=Number(a.getAttribute("data-card-idx")),n=Number(a.getAttribute("data-opt-idx")),s=Y[o],i=s?.options[n];!s||!i||$e(s,i)}))}function $e(e,t){const a=document.getElementById("fo-modal-overlay"),o=document.getElementById("fo-modal");if(!a||!o)return;const n=J(t);o.innerHTML=`
        <div class="fo-modal-head">
            <div>
                <span class="fo-modal-title-eyebrow">Confirm Strategic Action</span>
                <h2 id="fo-modal-title" class="fo-modal-title">${r(t.title)}</h2>
            </div>
            <button type="button" class="fo-modal-close" data-modal-close aria-label="Close">×</button>
        </div>
        <div class="fo-review-section">
            <div class="fo-review-section-title">${r(e.name)} — Option ${r(t.letter)}</div>
            <p style="font-size:13px;color:var(--fo-text-secondary);line-height:1.55;margin:0 0 14px;">${r(t.desc)}</p>
            <div class="fo-action-option-effects" style="margin-bottom:12px;">${n}</div>
            <div class="fo-modal-blocked" style="border-color:var(--fo-accent-rust);background:rgba(232,114,74,0.08);color:var(--fo-accent-rust);">
                ⚠ This locks all 10 Finance Strategic Actions for 12 ticks.
            </div>
        </div>
        <div class="fo-modal-actions">
            <button type="button" class="fo-modal-btn" data-modal-close>Cancel</button>
            <button type="button" class="fo-modal-btn primary" id="fo-action-confirm">Confirm ▸</button>
        </div>
    `,a.classList.add("open"),a.setAttribute("aria-hidden","false"),document.getElementById("fo-action-confirm")?.addEventListener("click",()=>{Ae(e,t)})}async function Ae(e,t){if(O)return;const a=document.getElementById("fo-action-confirm");O=!0,a&&(a.disabled=!0);try{const{data:o,error:n}=await h.rpc("fire_finance_action",{p_corp_id:d.id,p_action_key:e.key,p_choice:t.letter});if(n){v(n.message||"Action failed.","error");return}if(!o?.success){v(o?.error||"Action failed.","error");return}v("Action taken — locked for 12 ticks.","success"),q(),await V(),G(),X()}catch(o){console.error("[fo] fire_finance_action failed:",o),v("Action failed: "+(o?.message||"unknown"),"error")}finally{O=!1,a&&(a.disabled=!1)}}function R(e){document.getElementById("loading").textContent=e}function _(e){const t=Number(e)||0,a=Math.abs(t),o=t<0?"-":"";return a>=1e9?o+"$"+(a/1e9).toFixed(1).replace(/\.0$/,"")+"B":a>=1e6?o+"$"+(a/1e6).toFixed(1).replace(/\.0$/,"")+"M":a>=1e3?o+"$"+Math.round(a/1e3)+"K":o+"$"+a.toLocaleString()}let d=null,k=null,H=[],A=[],$=[];async function Ie(){const{data:{user:e}}=await h.auth.getUser();if(!e){window.location.href="login.html";return}const a=new URL(location.href).searchParams.get("faction_id"),{data:o,error:n}=await h.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);if(n){R("Failed to load factions: "+n.message);return}if(H=(o||[]).filter(l=>l.nation_id),a){const{data:l,error:f}=await h.from("factions").select("*").eq("id",a).single();if(f||!l){R("Inspector faction not found.");return}d=l}else d=H.find(l=>l.faction_type==="corporation");if(!d||d.faction_type!=="corporation"){R("No corporation linked to this account.");return}const s=d.corp_sector||"";if(s!=="Finance"){const l=re[s]||"corp-dashboard.html",f=a?`?faction_id=${encodeURIComponent(a)}`:"";window.location.replace(l+f);return}const[i,c]=await Promise.all([h.from("shard").select("current_tick, current_date, name, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single(),d.nation_id?h.from("nations").select("id, name, capital").eq("id",d.nation_id).single():Promise.resolve({data:null,error:null})]);if(i.error){R("Failed to load shard: "+i.error.message);return}k=i.data,c?.data,c?.error&&console.error("[corp-operations-finance] nation fetch error:",c.error.message);const u=document.getElementById("corp-topbar-container");if(u)try{const{renderCorpTopBar:l}=await oe(async()=>{const{renderCorpTopBar:f}=await import("./corp-topbar-B9cSZncf.js");return{renderCorpTopBar:f}},__vite__mapDeps([0,1]));l(u,{faction:d,shard:k,activeTab:"operations",allUserFactions:H})}catch(l){console.error("[corp-operations-finance] topbar render failed:",l)}document.getElementById("fo-footer-date").textContent=k?.current_date||ne(k?.current_tick)||"—",G(),X(),be(),ge(),we(),me(),await Promise.all([U(),Q()]),W(),j(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display=""}Ie().catch(e=>{console.error("[corp-operations-finance] init failed:",e),R("Failed to load: "+(e?.message||"Unknown error"))});
