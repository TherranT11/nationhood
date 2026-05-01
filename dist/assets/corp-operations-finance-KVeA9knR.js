const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BVNorCyj.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as b}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{_ as oe}from"./preload-helper-BXl3LOEh.js";import{tickToDate as ne,escapeHtml as s}from"./utils-A98FEun4.js";const se={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html"};function re(e){const t=Number(e)||0;return t>=7?"good":t>=4?"mid":"warn"}function ie(e){const t=Number(e)||0;return t>=8?"danger":t>=7?"warn":t>=4?"mid":"good"}const ce=[{key:"capital",column:"corp_lending_capital",eyebrow:"CAPACITY",name:"Lending",emName:"Capital",blurb:{good:"<strong>Strong deposit base, broad borrower roster.</strong> Capital reserves cover even sovereign-grade lending. Bigger banks compete with you, not above you.",mid:"<strong>Adequate capital reserves.</strong> Mid-tier loans are well within reach; the largest sovereign issues still require partner banks.",warn:"<strong>Modest deposit base, limited borrower roster.</strong> Capital reserves cover only mid-tier loans. Major borrowers go to bigger banks. Growth requires bond issuance or aggressive deposit drives."},impacts:{good:[{label:"Max Loan Size",value:"$500M+"},{label:"Sovereign-Grade",value:"Yes",tone:"good"}],mid:[{label:"Max Loan Size",value:"$250M"},{label:"Sovereign-Grade",value:"Limited"}],warn:[{label:"Max Loan Size",value:"$120M"},{label:"Sovereign-Grade",value:"No",tone:"rust"}]}},{key:"rates",column:"corp_interest_rates",eyebrow:"PRICING POWER",name:"Interest",emName:"Rates",blurb:{good:"<strong>Premium rates accepted by the market.</strong> Reputation justifies a meaningful spread over competitors. Net margins are healthy and growing.",mid:"<strong>Market-rate pricing.</strong> Loan APR sits in line with peer banks. Margins are reasonable but not differentiated.",warn:"<strong>Competitive low rates — razor-thin margins.</strong> Attractive to borrowers, but profit per loan is slim. Reputation has not yet earned premium pricing."},impacts:{good:[{label:"Loan APR",value:"7.8%"},{label:"Net Margin",value:"4.6%",tone:"good"}],mid:[{label:"Loan APR",value:"5.5%"},{label:"Net Margin",value:"2.7%"}],warn:[{label:"Loan APR",value:"4.2%"},{label:"Net Margin",value:"1.8%",tone:"rust"}]}},{key:"leverage",column:"corp_overleverage",eyebrow:"RISK EXPOSURE",name:"Over",emName:"leverage",inverted:!0,blurb:{good:"<strong>Healthy reserve buffer — every dollar lent backed by 3+ in reserves.</strong> Conservative balance sheet. The Central Bank's quarterly review is favorable. Room to grow before risk becomes systemic.",mid:"<strong>Moderate exposure.</strong> Books are leaning into the loan portfolio. Still survivable in a downturn, but a stress event would hurt.",warn:"<strong>Elevated risk profile.</strong> The portfolio is stretched. Default-buffer is thin; another loan or two could tip you into the 8+ stressed zone.",danger:"<strong>Stressed balance sheet — Central Bank is watching.</strong> At 8+ you cannot approve new loans. At 9 cash starts bleeding to interbank borrowing rates and depositor flight becomes possible. At 10 a Bank Run is triggered."},impacts:{good:[{label:"Reserve Ratio",value:"31%",tone:"good"},{label:"Default Buffer",value:"Strong",tone:"good"}],mid:[{label:"Reserve Ratio",value:"20%"},{label:"Default Buffer",value:"Moderate"}],warn:[{label:"Reserve Ratio",value:"12%",tone:"rust"},{label:"Default Buffer",value:"Thin",tone:"rust"}],danger:[{label:"Reserve Ratio",value:"<8%",tone:"warn"},{label:"Default Buffer",value:"Critical",tone:"warn"}]}}];function le(e){const t=Number(d?.[e.column]??0),a=t.toFixed(1).replace(/\.0$/,""),o=e.inverted?ie(t):re(t),n=Math.max(0,Math.min(10,Math.round(t))),r=Array.from({length:10},(u,_)=>{const I=_<n,h=e.inverted&&I&&_>=7,p=["fo-hero-meter-cell"];return I&&p.push("filled"),h&&p.push("danger"),`<div class="${p.join(" ")}"></div>`}).join(""),i=e.blurb?.[o]||e.blurb?.warn||"",c=(e.impacts?.[o]||e.impacts?.warn||[]).map(u=>`<div>
            <span class="label">${s(u.label)}</span>
            <span class="value${u.tone?" "+u.tone:""}">${s(u.value)}</span>
        </div>`).join(""),m="neutral",l="— FOUNDING POSITION",f=e.inverted?'<span class="fo-inverted-note">⚠ HIGH = DANGER</span>':"";return`<div class="fo-hero-stat" data-stat="${s(e.key)}">
        ${f}
        <div class="fo-hero-stat-eyebrow">${s(e.eyebrow)}</div>
        <div class="fo-hero-stat-name">${s(e.name)} <em>${s(e.emName)}</em></div>
        <div class="fo-hero-stat-value-row">
            <div class="fo-hero-stat-value">${s(a)}<span class="fo-max">/10</span></div>
            <div class="fo-hero-stat-trend ${m}">${s(l)}</div>
        </div>
        <div class="fo-hero-meter">${r}</div>
        <div class="fo-hero-stat-desc">${i}</div>
        <div class="fo-hero-stat-impact">${c}</div>
    </div>`}function G(){const e=document.getElementById("fo-hero-stats");e&&(e.innerHTML=ce.map(le).join(""))}async function z(){if(!d?.id){A=[];return}const e=Number(k?.current_tick||0),{data:t,error:a}=await b.from("bank_loan_requests").select(`
            id, principal, term_ticks, risk_grade, purpose, expires_at_tick,
            requesting_faction:factions!requesting_faction_id (
                faction_name, corp_ticker, corp_sector,
                corp_cash_reserves, corp_debt, corp_reputation
            ),
            requesting_nation:nations!requesting_nation_id ( name )
        `).eq("status","pending").gt("expires_at_tick",e).contains("target_bank_ids",[d.id]).order("expires_at_tick",{ascending:!0});if(a){console.error("[fo] available requests fetch error:",a.message),A=[];return}if(!t||t.length===0){A=[];return}const o=t.map(c=>c.id),{data:n,error:r}=await b.from("bank_loan_offers").select("request_id").eq("bank_faction_id",d.id).in("request_id",o);r&&console.warn("[fo] my-offers fetch error:",r.message);const i=new Set((n||[]).map(c=>c.request_id));A=t.filter(c=>!i.has(c.id))}function W(){const e=document.getElementById("fo-available-list"),t=document.getElementById("fo-available-meta");if(!e)return;if(A.length===0){t&&(t.textContent="No incoming requests"),e.innerHTML='<div class="fo-contract-empty">No open loan requests targeting this bank right now.</div>';return}if(t){const o=A.length;t.textContent=`${o} Open ◊ Click to Review`}const a=Number(k?.current_tick||0);e.innerHTML=A.map(o=>{const n=o.requesting_faction||{},r=o.requesting_nation||{},i=n.corp_ticker||"—",c=n.faction_name||"—",m=n.corp_sector||"",l=Math.max(0,Number(o.expires_at_tick||0)-a),f=l<=3?"urgent":"",u=Number(o.term_ticks||0),_=o.purpose?String(o.purpose).trim():"";return`<div class="fo-offer-card" data-request-id="${s(o.id)}" tabindex="0" role="button" aria-label="Review loan request from ${s(c)}">
            <div class="fo-offer-card-head">
                <div class="fo-offer-card-ticker">${s(i)}</div>
                <div class="fo-offer-card-grade" data-grade="${s(o.risk_grade||"")}">${s(o.risk_grade||"—")}</div>
            </div>
            <div class="fo-offer-card-borrower">
                <span class="name">${s(c)}</span>
                ${m?`<span class="meta">${s(m)}</span>`:""}
                ${r.name?`<span class="meta">◊ ${s(r.name)}</span>`:""}
            </div>
            <div class="fo-offer-card-principal">${s(g(o.principal))}</div>
            <div class="fo-offer-card-meta">
                <span>${s(String(u))} TICK${u===1?"":"S"}</span>
                ${_?`<span class="purpose">— ${s(_)}</span>`:""}
            </div>
            <div class="fo-offer-card-foot">
                <span class="${f}">EXPIRES IN ${l} TICK${l===1?"":"S"}</span>
                <span class="fo-offer-card-cta">REVIEW →</span>
            </div>
        </div>`}).join("")}const H=[12,24,36,48,60,84],T=12;function de(e){const t=Number(e)||0;if(!t)return 36;let a=H[0],o=Math.abs(a-t);for(const n of H){const r=Math.abs(n-t);(r<o||r===o&&n>a)&&(a=n,o=r)}return a}function fe(e){const t=Math.max(0,Number(e)||0);return t>=12?12:Math.round((t+12)/2*10)/10}function U(e,t,a){const o=Number(e)||0,n=Number(t)||0,r=Number(a)||0,i=r/T,c=Math.round(o*(n/100)*i),m=r>0?Math.round((o+c)/r):0;return{totalInterest:c,perTickPayment:m,termYears:i}}let F=!1;function ue(e){const t=A.find(C=>C.id===e);if(!t)return;const a=document.getElementById("fo-modal-overlay"),o=document.getElementById("fo-modal");if(!a||!o)return;const n=t.requesting_faction||{},r=t.requesting_nation||{},i=Number(t.principal)||0,c=Number(t.term_ticks)||0,m=Number(k?.current_tick||0),l=Math.max(0,Number(t.expires_at_tick||0)-m),f=Math.max(0,Number(d?.corp_interest_rates)||0),u=Number(d?.corp_overleverage)||0,_=u>=8,I=f>12,h=_?`You are Stressed (overleverage ${u.toFixed(1)} ≥ 8). The Central Bank has frozen new loan offers until you reduce risk.`:I?`Your interest-rates floor (${f.toFixed(1)}%) exceeds the 12% market cap. You cannot make a competitive offer at current pricing power.`:null;let p=fe(f),y=de(c);const S=()=>{const{totalInterest:C,perTickPayment:q,termYears:E}=U(i,p,y),x=H.map(w=>{const ee=w===y,N=w/T,te=Number.isInteger(N)?`${N} yr${N===1?"":"s"}`:`${N.toFixed(1)} yrs`,ae=w===c?" (REQ.)":"";return`<button type="button" class="fo-term-btn${ee?" active":""}" data-term="${w}">
                <strong>${w} TICKS</strong>
                <span class="sub">${s(te)}${ae}</span>
            </button>`}).join(""),L=h?"disabled":"",Z=h?"disabled":"";o.innerHTML=`
            <div class="fo-modal-head">
                <div>
                    <span class="fo-modal-title-eyebrow">Review Loan Request</span>
                    <h2 id="fo-modal-title" class="fo-modal-title">${s(n.faction_name||"Unknown Borrower")}</h2>
                </div>
                <button type="button" class="fo-modal-close" data-modal-close aria-label="Close">×</button>
            </div>

            ${h?`<div class="fo-modal-blocked">${s(h)}</div>`:""}

            <div class="fo-review-section">
                <div class="fo-review-section-title">I. Applicant Profile</div>
                <div class="fo-review-applicant-name">${s(n.faction_name||"—")}</div>
                <div class="fo-review-applicant-meta">
                    ${n.corp_ticker?`<strong>${s(n.corp_ticker)}</strong> ◊ `:""}
                    ${n.corp_sector?`${s(n.corp_sector)} ◊ `:""}
                    ${r.name?`${s(r.name)}`:""}
                </div>
                <div class="fo-review-row">
                    <span class="label">Cash Reserves</span>
                    <span class="value">${s(g(n.corp_cash_reserves))}</span>
                </div>
                <div class="fo-review-row">
                    <span class="label">Outstanding Debt</span>
                    <span class="value">${s(g(n.corp_debt))}</span>
                </div>
                <div class="fo-review-row">
                    <span class="label">Reputation</span>
                    <span class="value">${s((Number(n.corp_reputation)||0).toFixed(1))}<span class="muted"> / 10</span></span>
                </div>
            </div>

            <div class="fo-review-section">
                <div class="fo-review-section-title">II. Loan Request</div>
                <div class="fo-review-principal">${s(g(i))}</div>
                ${t.purpose?`<div class="fo-review-purpose">"${s(t.purpose)}"</div>`:""}
                <div class="fo-review-row">
                    <span class="label">Requested Term</span>
                    <span class="value">${c} TICK${c===1?"":"S"}<span class="muted"> · ${(c/T).toFixed(c%T===0?0:1)} YR</span></span>
                </div>
                <div class="fo-review-row">
                    <span class="label">Risk Grade</span>
                    <span class="value">${s(t.risk_grade||"—")}</span>
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
                        <span class="rate" id="fo-rate-display">${p.toFixed(1)}</span><span class="pct">%</span>
                        <span class="label">APR</span>
                    </div>
                    <input type="range" class="fo-offer-slider" id="fo-offer-slider"
                        min="${f.toFixed(2)}" max="12" step="0.1"
                        value="${p.toFixed(1)}" ${L}
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
                    <span class="value good" id="fo-impact-interest">${s(g(C))}</span>
                </div>
                <div class="fo-review-row">
                    <span class="label">Borrower Per-Tick Payment</span>
                    <span class="value" id="fo-impact-per-tick">${s(g(q))}</span>
                </div>
                <div class="fo-review-row">
                    <span class="label">Term in Years</span>
                    <span class="value" id="fo-impact-years">${E.toFixed(E%1===0?0:1)} YR${E===1?"":"S"}</span>
                </div>
            </div>

            <div class="fo-modal-actions">
                <button type="button" class="fo-modal-btn" data-modal-close>Cancel</button>
                <button type="button" class="fo-modal-btn primary" id="fo-offer-submit" ${Z}>Submit Offer ▸</button>
            </div>
        `;const K=o.querySelector("#fo-offer-slider");K?.addEventListener("input",()=>{p=Number(K.value),B()}),o.querySelectorAll("[data-term]").forEach(w=>{w.addEventListener("click",()=>{y=Number(w.getAttribute("data-term"))||y,S()})}),o.querySelector("#fo-offer-submit")?.addEventListener("click",()=>{pe(t.id)})},B=()=>{const{totalInterest:C,perTickPayment:q}=U(i,p,y),E=o.querySelector("#fo-rate-display"),x=o.querySelector("#fo-impact-interest"),L=o.querySelector("#fo-impact-per-tick");E&&(E.textContent=p.toFixed(1)),x&&(x.textContent=g(C)),L&&(L.textContent=g(q))};S(),a.classList.add("open"),a.setAttribute("aria-hidden","false")}function M(){const e=document.getElementById("fo-modal-overlay"),t=document.getElementById("fo-modal");e&&(e.classList.remove("open"),e.setAttribute("aria-hidden","true"),t&&(t.innerHTML=""))}async function pe(e){if(F)return;const t=document.getElementById("fo-offer-slider"),a=document.querySelector("#fo-term-buttons .fo-term-btn.active"),o=document.getElementById("fo-offer-submit");if(!t||!a)return;const n=Number(t.value),r=Number(a.getAttribute("data-term"));if(!Number.isFinite(n)||!Number.isFinite(r)||r<=0){v("Pick a valid rate and term.","error");return}F=!0,o&&(o.disabled=!0);try{const{data:i,error:c}=await b.rpc("submit_loan_offer",{p_request_id:e,p_bank_faction_id:d.id,p_offered_apr:n,p_offered_term_ticks:r});if(c){v(c.message||"Submission failed.","error");return}if(!i?.success){v(i?.error||"Submission failed.","error");return}v(`Offer submitted at ${n.toFixed(1)}% for ${r} ticks.`,"success"),M(),await z(),W()}catch(i){console.error("[fo] submit_loan_offer failed:",i),v("Submission failed: "+(i?.message||"unknown"),"error")}finally{F=!1,o&&(o.disabled=!1)}}function me(){const e=document.getElementById("fo-modal-overlay");e&&e.dataset.boundFo!=="1"&&(e.dataset.boundFo="1",e.addEventListener("click",t=>{(t.target===e||t.target.matches("[data-modal-close]"))&&M()})),document.body.dataset.foEscBound!=="1"&&(document.body.dataset.foEscBound="1",document.addEventListener("keydown",t=>{t.key==="Escape"&&M()}))}function v(e,t){document.querySelectorAll(".fo-toast").forEach(o=>o.remove());const a=document.createElement("div");a.className="fo-toast"+(t?" "+t:""),a.textContent=e,document.body.appendChild(a),setTimeout(()=>{a.classList.add("fade"),setTimeout(()=>a.remove(),280)},3e3)}async function Q(){if(!d?.id){$=[];return}const{data:e,error:t}=await b.from("bank_loans").select(`
            id, principal, apr, term_ticks, outstanding, payments_missed,
            status, matures_at_tick,
            borrower:factions!borrower_faction_id (
                faction_name, corp_ticker
            ),
            nation:nations!nation_id ( name )
        `).eq("lender_faction_id",d.id).in("status",["pending_payout","active"]).order("status",{ascending:!0}).order("matures_at_tick",{ascending:!0});if(t){console.error("[fo] active agreements fetch error:",t.message),$=[];return}$=e||[]}function j(){const e=document.getElementById("fo-active-list"),t=document.getElementById("fo-active-meta"),a=document.getElementById("fo-active-count");if(!e)return;if(a&&(a.textContent=String($.length)),$.length===0){t&&(t.textContent="No active loans"),e.innerHTML='<div class="fo-contract-empty">You have no live loans on the books. Submit offers from Available Offers to start lending.</div>';return}if(t){const n=$.filter(c=>c.status==="pending_payout").length,r=$.length-n,i=[];n&&i.push(`${n} Pending Payout`),r&&i.push(`${r} Active`),t.textContent=i.join(" ◊ ")}const o=Number(k?.current_tick||0);e.innerHTML=$.map(n=>{const r=n.borrower||{},i=n.nation||{},c=r.corp_ticker||"—",m=r.faction_name||"—",l=Number(n.apr)||0,f=Number(n.term_ticks)||0,u=n.status==="pending_payout",_=P.has(n.id),I=`<div class="fo-active-card-head">
            <div class="fo-active-card-ticker">${s(c)}</div>
            <div class="fo-active-card-status ${u?"pending":"active"}">
                ${u?"Pending Payout":"Active"}
            </div>
        </div>
        <div class="fo-active-card-borrower">
            <span class="name">${s(m)}</span>
            ${i.name?`<span class="meta">◊ ${s(i.name)}</span>`:""}
        </div>
        <div class="fo-active-card-principal">${s(g(n.principal))}</div>`;let h,p;if(u){h=`<div class="fo-active-card-meta">
                <span><span class="label">APR</span>${l.toFixed(1)}%</span>
                <span><span class="label">TERM</span>${f} TICKS</span>
            </div>`;const y=_?"Disbursing…":"Pay Out Loan ▸";p=`<div class="fo-active-card-foot">
                <span class="fo-active-card-note warn">⚠ Awaiting your disbursement</span>
                <button type="button" class="fo-payout-btn" data-payout-id="${s(n.id)}" ${_?"disabled":""}>
                    ${s(y)}
                </button>
            </div>`}else{const y=Number(n.matures_at_tick)||0,S=Math.max(0,y-o),B=Number(n.payments_missed)||0;h=`<div class="fo-active-card-meta">
                <span><span class="label">OUTSTANDING</span>${s(g(n.outstanding))}</span>
                <span><span class="label">APR</span>${l.toFixed(1)}%</span>
                <span><span class="label">MATURES IN</span>${S} TICKS</span>
                ${B>0?`<span class="warn"><span class="label">MISSED</span>${B}</span>`:""}
            </div>`,p=""}return`<div class="fo-active-card${u?" pending":""}">
            ${I}
            ${h}
            ${p}
        </div>`}).join("")}const P=new Set;async function ve(e){if(!(!e||P.has(e))){P.add(e),j();try{const{data:t,error:a}=await b.rpc("pay_out_loan",{p_loan_id:e});if(a){v(a.message||"Payout failed.","error");return}if(!t?.success){v(t?.error||"Payout failed.","error");return}v(`Disbursed ${g(t.principal_disbursed)}.`,"success"),await Promise.all([Q(),V()])}catch(t){console.error("[fo] pay_out_loan failed:",t),v("Payout failed: "+(t?.message||"unknown"),"error")}finally{P.delete(e),j(),G()}}}async function V(){if(!d?.id)return;const{data:e,error:t}=await b.from("factions").select("corp_cash_reserves, corp_lending_capital, corp_interest_rates, corp_overleverage, corp_finance_action_locked_until_tick").eq("id",d.id).single();if(t||!e){console.error("[fo] refetch faction state failed:",t?.message);return}Object.assign(d,e)}function ge(){const e=document.getElementById("fo-active-list");!e||e.dataset.boundFo==="1"||(e.dataset.boundFo="1",e.addEventListener("click",t=>{const a=t.target.closest("[data-payout-id]");!a||a.disabled||ve(a.getAttribute("data-payout-id"))}))}function be(){const e=document.getElementById("fo-available-list");if(!e||e.dataset.boundFo==="1")return;e.dataset.boundFo="1";const t=a=>{const o=a.closest(".fo-offer-card[data-request-id]");o&&ue(o.getAttribute("data-request-id"))};e.addEventListener("click",a=>t(a.target)),e.addEventListener("keydown",a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),t(a.target))})}const Y=[{key:"capital_raise",name:"Capital Raising",options:[{letter:"A",title:"Quick Bond Issuance",desc:"Issue short-term bonds to raise immediate capital — fast, but the new debt drives leverage up.",cost:6e7,effects:{lending:2,over:2}},{letter:"B",title:"Equity Capital Raise",desc:"Sell shares to long-term investors — bigger raise, dilutes ownership but cleans the balance sheet.",cost:15e7,effects:{lending:3,over:-1}}]},{key:"aggressive_lending",name:"Aggressive Lending Push",options:[{letter:"A",title:"Subprime Loan Expansion",desc:"Underwrite weaker borrowers en masse — capital deploys fast but bad-debt risk climbs.",cost:4e7,effects:{lending:-1,over:2}},{letter:"B",title:"Prime Borrower Campaign",desc:"Court top-tier borrowers with attractive rates — capital deploys, but you sacrifice margin to win them.",cost:7e7,effects:{lending:-2,rates:-1}}]},{key:"rate_hike",name:"Rate Hike Strategy",options:[{letter:"A",title:"Quiet Rate Increase",desc:"Quietly raise loan rates — pricing power up, but borrowers flee to competitors.",cost:3e7,effects:{rates:2,lending:-2}},{letter:"B",title:"Premium Rate Justification Campaign",desc:"Brand the bank around premium service to justify higher rates — borrowers stay AND rates climb.",cost:7e7,effects:{rates:3,lending:1}}]},{key:"rate_cut",name:"Rate Cut Strategy",options:[{letter:"A",title:"Promotional Loan Rate Drop",desc:"Run a promotional drop on loan rates — capital deploys fast, leverage ticks up, margins compress.",cost:4e7,effects:{rates:-2,lending:-2,over:1}},{letter:"B",title:"Strategic Loss-Leader Pricing",desc:"Cut rates aggressively to flood the borrower base — massive deployment at razor-thin spreads.",cost:8e7,effects:{rates:-3,lending:-3}}]},{key:"reserve_building",name:"Reserve Building",options:[{letter:"A",title:"Emergency Capital Buffer",desc:"Lock cash into emergency reserves — leverage drops sharply but lending capacity tightens.",cost:5e7,effects:{over:-2,lending:-2}},{letter:"B",title:"Conservative Balance Sheet Reform",desc:"Restructure the books for prudence — leverage falls hard and the cleaner sheet supports premium pricing.",cost:9e7,effects:{over:-3,rates:1}}]},{key:"high_yield",name:"Risky High-Yield Investment",options:[{letter:"A",title:"Speculative Asset Purchase",desc:"Buy speculative assets in the hopes of outsized returns — capital grows, but risk piles on.",cost:5e7,effects:{lending:2,over:3}},{letter:"B",title:"Hedged Investment Portfolio",desc:"Build a hedged portfolio — bigger capital gains, with risk kept in check by the hedges.",cost:1e8,effects:{lending:3,over:1}}]},{key:"deposit_drive",name:"Deposit Drive",options:[{letter:"A",title:"High-Rate Savings Promotion",desc:"Court depositors with above-market savings rates — deposits flood in, but interest spreads compress.",cost:4e7,effects:{lending:2,rates:-2}},{letter:"B",title:"Premium Wealth Management Program",desc:"Launch a wealth-management arm — wealthy clients accept worse savings rates for the prestige.",cost:8e7,effects:{lending:3,rates:1}}]},{key:"loan_restructuring",name:"Loan Restructuring",options:[{letter:"A",title:"Write Down Bad Loans",desc:"Write off underperforming loans — leverage drops but lending capacity takes a hit too.",cost:6e7,effects:{over:-1,lending:-1}},{letter:"B",title:"Comprehensive Portfolio Cleanup",desc:"Full portfolio cleanup — deep leverage drop and the cleaner book justifies premium rates.",cost:9e7,effects:{over:-3,rates:1}}]},{key:"foreign_capital",name:"Foreign Capital Partnership",options:[{letter:"A",title:"Accept High-Interest Foreign Loans",desc:"Borrow expensive capital from abroad — fast capacity boost, but foreign debt service drives both rates and leverage up.",cost:3e7,effects:{lending:2,over:2,rates:1}},{letter:"B",title:"Negotiate Sovereign Investment Deal",desc:"Strike a sovereign-backed investment partnership — bigger boost with leverage relief baked in.",cost:8e7,effects:{lending:3,over:-1}}]},{key:"central_bank",name:"Central Bank Compliance",options:[{letter:"A",title:"Meet Minimum Reserve Requirement",desc:"Comply with the regulator’s minimum reserve floor — leverage drops, lending capacity reduces.",cost:65e6,effects:{over:-2,lending:-2}},{letter:"B",title:"Exceed Regulatory Standards",desc:"Go beyond minimums for regulatory trust — deep leverage drop and trust unlocks expanded operations.",cost:8e7,effects:{over:-3,lending:1}}]}],_e={lending:"Lending",rates:"Rates",over:"Overleverage"};let O=!1;function he(){const e=Number(d?.corp_finance_action_locked_until_tick)||0,t=Number(k?.current_tick)||0;return Math.max(0,e-t)}function X(){const e=document.getElementById("fo-actions-grid"),t=document.getElementById("fo-actions-meta"),a=document.getElementById("fo-actions-cooldown-pill");if(!e)return;const o=he(),n=o>0;e.classList.toggle("locked",n),a&&(n?(a.className="fo-actions-cooldown-pill",a.textContent=`LOCKED — ${o} TICK${o===1?"":"S"}`):(a.textContent="",a.className="")),t&&(t.textContent=n?`Locked until tick ${d.corp_finance_action_locked_until_tick}`:`${Y.length} Initiatives ◊ Choose A or B (12-tick global cooldown)`),e.innerHTML=Y.map((r,i)=>ye(r,i,n)).join("")}function ye(e,t,a){const o=e.options.map((n,r)=>ke(e,n,t,r,a)).join("");return`<div class="fo-action-card">
        <div class="fo-action-name">${s(e.name)}</div>
        <div class="fo-action-options">${o}</div>
    </div>`}function ke(e,t,a,o,n){const r=J(t);return`<div class="fo-action-option" ${n?'data-locked="1"':""}
                 data-action-key="${s(e.key)}"
                 data-choice="${s(t.letter)}"
                 data-card-idx="${a}" data-opt-idx="${o}">
        <span class="fo-action-option-letter">${s(t.letter)}</span>
        <div class="fo-action-option-content">
            <div class="fo-action-option-title">${s(t.title)}</div>
            <div class="fo-action-option-desc">${s(t.desc)}</div>
            <div class="fo-action-option-effects">${r}</div>
        </div>
        <span class="fo-action-option-cta">${n?"Locked":"Take ▸"}</span>
    </div>`}function J(e){const t=[`<span class="fo-effect cost">−${g(e.cost).replace("-","")}</span>`];for(const[a,o]of Object.entries(e.effects||{})){const n=o>0?"+":"",r=o>0?"positive":"negative";t.push(`<span class="fo-effect ${r}">${n}${o} ${s(_e[a]||a)}</span>`)}return t.join("")}function we(){const e=document.getElementById("fo-actions-grid");!e||e.dataset.boundFo==="1"||(e.dataset.boundFo="1",e.addEventListener("click",t=>{const a=t.target.closest(".fo-action-option");if(!a||a.hasAttribute("data-locked"))return;const o=Number(a.getAttribute("data-card-idx")),n=Number(a.getAttribute("data-opt-idx")),r=Y[o],i=r?.options[n];!r||!i||$e(r,i)}))}function $e(e,t){const a=document.getElementById("fo-modal-overlay"),o=document.getElementById("fo-modal");if(!a||!o)return;const n=J(t);o.innerHTML=`
        <div class="fo-modal-head">
            <div>
                <span class="fo-modal-title-eyebrow">Confirm Strategic Action</span>
                <h2 id="fo-modal-title" class="fo-modal-title">${s(t.title)}</h2>
            </div>
            <button type="button" class="fo-modal-close" data-modal-close aria-label="Close">×</button>
        </div>
        <div class="fo-review-section">
            <div class="fo-review-section-title">${s(e.name)} — Option ${s(t.letter)}</div>
            <p style="font-size:13px;color:var(--fo-text-secondary);line-height:1.55;margin:0 0 14px;">${s(t.desc)}</p>
            <div class="fo-action-option-effects" style="margin-bottom:12px;">${n}</div>
            <div class="fo-modal-blocked" style="border-color:var(--fo-accent-rust);background:rgba(232,114,74,0.08);color:var(--fo-accent-rust);">
                ⚠ This locks all 10 Finance Strategic Actions for 12 ticks.
            </div>
        </div>
        <div class="fo-modal-actions">
            <button type="button" class="fo-modal-btn" data-modal-close>Cancel</button>
            <button type="button" class="fo-modal-btn primary" id="fo-action-confirm">Confirm ▸</button>
        </div>
    `,a.classList.add("open"),a.setAttribute("aria-hidden","false"),document.getElementById("fo-action-confirm")?.addEventListener("click",()=>{Ae(e,t)})}async function Ae(e,t){if(O)return;const a=document.getElementById("fo-action-confirm");O=!0,a&&(a.disabled=!0);try{const{data:o,error:n}=await b.rpc("fire_finance_action",{p_corp_id:d.id,p_action_key:e.key,p_choice:t.letter});if(n){v(n.message||"Action failed.","error");return}if(!o?.success){v(o?.error||"Action failed.","error");return}v("Action taken — locked for 12 ticks.","success"),M(),await V(),G(),X()}catch(o){console.error("[fo] fire_finance_action failed:",o),v("Action failed: "+(o?.message||"unknown"),"error")}finally{O=!1,a&&(a.disabled=!1)}}function R(e){document.getElementById("loading").textContent=e}function g(e){const t=Number(e)||0,a=Math.abs(t),o=t<0?"-":"";return a>=1e9?o+"$"+(a/1e9).toFixed(1).replace(/\.0$/,"")+"B":a>=1e6?o+"$"+(a/1e6).toFixed(1).replace(/\.0$/,"")+"M":a>=1e3?o+"$"+Math.round(a/1e3)+"K":o+"$"+a.toLocaleString()}let d=null,k=null,D=[],A=[],$=[];async function Ie(){const{data:{user:e}}=await b.auth.getUser();if(!e){window.location.href="login.html";return}const a=new URL(location.href).searchParams.get("faction_id"),{data:o,error:n}=await b.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);if(n){R("Failed to load factions: "+n.message);return}if(D=(o||[]).filter(l=>l.nation_id),a){const{data:l,error:f}=await b.from("factions").select("*").eq("id",a).single();if(f||!l){R("Inspector faction not found.");return}d=l}else d=D.find(l=>l.faction_type==="corporation");if(!d||d.faction_type!=="corporation"){R("No corporation linked to this account.");return}const r=d.corp_sector||"";if(r!=="Finance"){const l=se[r]||"corp-dashboard.html",f=a?`?faction_id=${encodeURIComponent(a)}`:"";window.location.replace(l+f);return}const[i,c]=await Promise.all([b.from("shard").select("current_tick, current_date, name, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single(),d.nation_id?b.from("nations").select("id, name, capital").eq("id",d.nation_id).single():Promise.resolve({data:null,error:null})]);if(i.error){R("Failed to load shard: "+i.error.message);return}k=i.data,c?.data,c?.error&&console.error("[corp-operations-finance] nation fetch error:",c.error.message);const m=document.getElementById("corp-topbar-container");if(m)try{const{renderCorpTopBar:l}=await oe(async()=>{const{renderCorpTopBar:f}=await import("./corp-topbar-BVNorCyj.js");return{renderCorpTopBar:f}},__vite__mapDeps([0,1]));l(m,{faction:d,shard:k,activeTab:"operations",allUserFactions:D})}catch(l){console.error("[corp-operations-finance] topbar render failed:",l)}document.getElementById("fo-footer-date").textContent=k?.current_date||ne(k?.current_tick)||"—",G(),X(),be(),ge(),we(),me(),await Promise.all([z(),Q()]),W(),j(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display=""}Ie().catch(e=>{console.error("[corp-operations-finance] init failed:",e),R("Failed to load: "+(e?.message||"Unknown error"))});
