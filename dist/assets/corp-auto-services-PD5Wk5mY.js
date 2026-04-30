import{f as C,b as N}from"./corp-shipping-data-DA_tOdLs.js";import{p as R,m as O}from"./loan-math-9I6GImoB.js";const j={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},H=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em_systems",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass_facades",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy_parts",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function Y(t,n,r){const o=H.find(s=>s.key===t);if(!o)return{available:!1,failedStat:"unknown_material"};const e=o.tiers[n];if(!e)return{available:!1,failedStat:"unknown_tier"};for(const s of e.requirements){const a=Number(r?.[s.stat]??0);if(a<s.min)return{available:!1,failedStat:s.stat,failedMin:s.min,nationValue:a}}return{available:!0}}function Q(t,n,r){const e={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em_systems:{LOW:400,STD:700,HIGH:1200},glass_facades:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy_parts:{LOW:800,STD:1400,HIGH:2400}}[t]?.[n];if(!e)return 0;const s=H.find(i=>i.key===t);if(!s)return e;let a=1;for(const i of s.priceDrivers){const c=Number(r?.[i]??50);i==="inflation"||i==="fuel_prices"?a*=1+(c-50)/200:a*=1-(c-50)/250}return a=Math.max(.4,Math.min(2.5,a)),Math.round(e*a)}function V(t,n,r){const e={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em_systems:{LOW:1e3,STD:700,HIGH:300},glass_facades:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy_parts:{LOW:400,STD:200,HIGH:80}}[t]?.[n]||0,a=H.find(d=>d.key===t)?.priceDrivers?.[0],c=.3+(a?Number(r?.[a]??50):50)/50*.7;return Math.round(e*c)}const Z=["LOW","STD","HIGH"],J={LOW:"Low",STD:"Standard",HIGH:"High"};let A=null,I=null,M=[],$=[];function w(t){if(!t)return"";const n=document.createElement("div");return n.textContent=t,n.innerHTML}function b(t){return Math.abs(t)>=1e9?"$"+(t/1e9).toFixed(1)+"B":Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function W(t,n,r){const o=Math.max(0,Number(t)||0),e=Math.max(0,Number(n)||0),s=Math.max(1,Number(r)||1),a=e/100/12;if(a<=0)return Math.round(o/s);const i=o*(a/(1-Math.pow(1+a,-s)));return Math.round(i)}function B(t){const n=String(t||"").trim().toLowerCase();return n==="amortized"||n==="amortising"||n==="amortizing"?"amortized":"flat"}function E(t){return B(t?.loan_interest_model||t?.interest_model||t?.loan_interest_type)}function z(t){const n=String(t?.loan_funding_model||"").trim().toLowerCase();return n==="parent_corp"?"parent_corp":n==="subsidiary_cash"?"subsidiary_cash":null}function D(t,n,r,o){const e=Math.max(0,Number(t)||0),s=Math.max(0,Number(n)||0),a=Math.max(1,Number(r)||1),i=O(e,s);if(o==="amortized"){const u=W(e,s,a),L=R(u,i),l=Math.max(0,Math.round(u*a-e));return{monthlyPayment:u,month1Interest:i,month1Principal:L,totalInterest:l}}const c=Math.round(e/a),d=Math.round(i+c),m=Math.round(i*a);return{monthlyPayment:d,month1Interest:i,month1Principal:c,totalInterest:m}}async function X(t,n,r,o){A=t,I=n;const e=document.getElementById(r);if(!e)return;const s=n.nation?.id,a=n.faction?.id;if(!s||!a){e.innerHTML='<div style="padding:20px;text-align:center;color:#666;font-size:10px;">No nation data.</div>';return}e.innerHTML='<div style="padding:20px;text-align:center;color:#666;font-family:var(--font-mono,monospace);font-size:10px;">Loading available services...</div>';const[i,c]=await Promise.all([C(t,s),N(t,a)]);M=i,$=c,P(e,o)}function P(t,n){const r=M.filter(i=>i.service_type==="insurance"),o=M.filter(i=>i.service_type==="loan"),e=$.filter(i=>i.service_type==="insurance"),s=$.filter(i=>i.service_type==="loan");let a="";(e.length>0||s.length>0)&&(a+='<div class="cas-section"><div class="cas-section-title">Your Active Policies</div>',a+=e.concat(s).map(i=>G(i)).join(""),a+="</div>"),a+='<div class="cas-section"><div class="cas-section-title">Available Insurance</div><div class="cas-section-body">',r.length===0?a+='<div class="cas-empty">No insurance subsidiaries operate in this nation.</div>':a+=r.map(i=>k(i,"insurance")).join(""),a+="</div></div>",a+='<div class="cas-section"><div class="cas-section-title">Available Credit</div><div class="cas-section-body">',o.length===0?a+='<div class="cas-empty">No banking subsidiaries operate in this nation.</div>':a+=o.map(i=>k(i,"loan")).join(""),a+="</div></div>",a||(a='<div class="cas-empty">No financial services available in this nation.</div>'),t.innerHTML=`<div class="cas-panel">${a}</div>`,t.addEventListener("click",i=>{const c=i.target.closest("[data-accept-rate]");if(!c)return;const d=c.dataset.acceptRate,m=c.dataset.serviceType;q(t,d,m,n)})}function k(t,n){const r=t.corp_properties?.name||"Unknown Subsidiary",o=n==="insurance",e=o?"#c84":"#5a8aaa",s=o?"INSURANCE":"CREDIT",a=o?"Annual Premium":"Annual Interest",i=E(t),c=z(t),d=$.some(m=>m.rate_id===t.id&&m.status==="active");return`
        <div class="cas-rate-card">
            <div class="cas-rate-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:6px;height:6px;border-radius:50%;background:${e};display:inline-block;"></span>
                    <span style="font-size:11px;font-weight:700;color:#f0efe6;">${w(r)}</span>
                    <span class="cas-badge" style="color:${e};border-color:${e}44;background:${e}0a;">${s}</span>
                    ${o?"":`<span class="cas-badge" style="color:#8ab0c7;border-color:#8ab0c744;background:#8ab0c70f;">${i==="amortized"?"AMORTIZED":"FLAT"}</span>`}
                    ${!o&&c?`<span class="cas-badge" style="color:#b9a46a;border-color:#b9a46a44;background:#b9a46a0f;">${c==="parent_corp"?"PARENT FUNDED":"SUB FUNDED"}</span>`:""}
                </div>
                <span style="font-family:monospace;font-size:8px;color:#666;">${t.policies_issued||0} policies issued</span>
            </div>
            <div class="cas-rate-body">
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${a}</span>
                    <span class="cas-rate-value" style="color:${e};font-size:16px;">${t.effective_rate}%</span>
                </div>
                <div class="cas-rate-breakdown">
                    <span>Base: ${t.base_rate}%</span>
                    ${t.markup>0?`<span>+ Markup: ${t.markup}%</span>`:""}
                </div>
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${o?"Max Coverage":"Max Loan"}</span>
                    <span class="cas-rate-value">${b(t.coverage_limit||0)}</span>
                </div>
                ${o?`<div class="cas-rate-row">
                    <span class="cas-rate-label">Deductible</span>
                    <span class="cas-rate-value">${t.deductible_pct||10}%</span>
                </div>`:""}
                <div class="cas-rate-row">
                    <span class="cas-rate-label">Term</span>
                    <span class="cas-rate-value">${t.min_term_months}-${t.max_term_months} months</span>
                </div>
            </div>
            <div class="cas-rate-footer">
                ${d?'<span style="font-family:monospace;font-size:8px;font-weight:700;color:#5cb85c;">✓ ACTIVE POLICY</span>':`<button class="cas-accept-btn" data-accept-rate="${t.id}" data-service-type="${n}" style="border-color:${e};color:${e};">Accept ${o?"Coverage":"Terms"}</button>`}
            </div>
        </div>
    `}function G(t){const n=t.service_type==="insurance",r=n?"#c84":"#5a8aaa",o=t.status==="active"?"#5cb85c":t.status==="lapsed"?"#d9534f":"#666",e=E(t),s=z(t);return`
        <div class="cas-policy-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="cas-badge" style="color:${r};border-color:${r}44;background:${r}0a;">${n?"INSURANCE":"LOAN"}</span>
                    <span style="font-size:10px;font-weight:600;color:#c4c2b8;">${t.rate_at_issue}% rate</span>
                    ${n?"":`<span class="cas-badge" style="color:#8ab0c7;border-color:#8ab0c744;background:#8ab0c70f;">${e==="amortized"?"AMORTIZED":"FLAT"}</span>`}
                    ${!n&&s?`<span class="cas-badge" style="color:#b9a46a;border-color:#b9a46a44;background:#b9a46a0f;">${s==="parent_corp"?"PARENT FUNDED":"SUB FUNDED"}</span>`:""}
                </div>
                <span class="cas-badge" style="color:${o};border-color:${o}44;background:${o}0a;">${t.status.toUpperCase()}</span>
            </div>
            <div style="display:flex;gap:12px;margin-top:6px;font-family:monospace;font-size:8px;color:#888;">
                <span>${n?"Premium":"Payment"}: ${b(t.monthly_payment)}/mo</span>
                <span>Paid: ${b(t.total_paid)}</span>
                <span>${t.payments_made} payments</span>
            </div>
        </div>
    `}let S=!1;function q(t,n,r,o){const e=M.find(l=>l.id===n);if(!e)return;const s=r==="insurance",a=s?"#c84":"#5a8aaa",i=e.corp_properties?.name||"Unknown",c=e.coverage_limit||0,d=E(e);let m=document.getElementById("cas-accept-overlay");m||(m=document.createElement("div"),m.id="cas-accept-overlay",m.className="cas-overlay",document.body.appendChild(m)),m.innerHTML=`
        <div class="cas-modal">
            <div class="cas-modal-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:7px;height:7px;border-radius:50%;background:${a};display:inline-block;"></span>
                    <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;">Accept ${s?"Insurance":"Loan"}</span>
                </div>
                <span class="cas-modal-close" id="cas-close">&times;</span>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:${a}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${a};display:inline-block;"></span>
                <span style="font-family:monospace;font-size:9px;color:#888;">Provider:</span>
                <span style="font-family:monospace;font-size:9px;font-weight:700;color:${a};">${w(i)}</span>
            </div>
            <div style="padding:16px;display:flex;flex-direction:column;gap:14px;">
                <div>
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${s?"Coverage Amount":"Loan Amount"}</div>
                    <input type="number" id="cas-amount" placeholder="Enter amount" max="${c}" style="width:100%;padding:7px 10px;font-family:monospace;font-size:13px;color:#f0efe6;background:#1c1c18;border:1px solid rgba(255,255,255,0.08);outline:none;box-sizing:border-box;">
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;margin-top:3px;">Max: ${b(c)}</div>
                </div>
                <div>
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Term (months)</div>
                    <input type="number" id="cas-term" value="${e.min_term_months}" min="${e.min_term_months}" max="${e.max_term_months}" style="width:120px;padding:7px 10px;font-family:monospace;font-size:13px;color:#f0efe6;background:#1c1c18;border:1px solid rgba(255,255,255,0.08);outline:none;text-align:center;">
                    <span style="font-family:monospace;font-size:8px;color:#4a4940;margin-left:8px;">${e.min_term_months}-${e.max_term_months} months</span>
                </div>
                <div style="padding:8px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">TERMS SUMMARY</div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Rate</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:${a};">${e.effective_rate}%</span>
                    </div>
                    ${s?`<div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Deductible</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:#c4c2b8;">${e.deductible_pct}%</span>
                    </div>`:""}
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Monthly ${s?"Premium":"Payment"}</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:#c4c2b8;" id="cas-monthly">—</span>
                    </div>
                    ${s?"":`<div style="margin-top:8px;padding-top:8px;border-top:1px dashed rgba(255,255,255,0.08);font-family:monospace;font-size:8px;color:#9d9b91;">
                        ${d==="amortized"?"Amortized loan: interest is charged on remaining principal each month.":"Flat loan: interest is charged on original principal each month."}
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Month 1 Interest</span>
                        <span style="font-family:monospace;font-size:9px;color:#c4c2b8;" id="cas-month1-interest">—</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Month 1 Principal</span>
                        <span style="font-family:monospace;font-size:9px;color:#c4c2b8;" id="cas-month1-principal">—</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Total Interest (term)</span>
                        <span style="font-family:monospace;font-size:9px;color:#c4c2b8;" id="cas-total-interest">—</span>
                    </div>`}
                </div>
            </div>
            <div style="padding:10px 16px;border-top:1px solid rgba(255,255,255,0.06);background:#1c1c18;display:flex;justify-content:flex-end;gap:6px;">
                <button class="cas-btn cas-btn--cancel" id="cas-cancel">Cancel</button>
                <button class="cas-btn cas-btn--submit" id="cas-submit" disabled style="background:${a};">Accept</button>
            </div>
        </div>
    `,m.classList.add("active");const u=()=>{m.classList.remove("active")};document.getElementById("cas-close")?.addEventListener("click",u),document.getElementById("cas-cancel")?.addEventListener("click",u),m.addEventListener("click",l=>{l.target===m&&u()});const L=()=>{const l=Number(document.getElementById("cas-amount")?.value)||0,p=Number(document.getElementById("cas-term")?.value)||e.min_term_months,f=document.getElementById("cas-monthly"),y=document.getElementById("cas-month1-interest"),g=document.getElementById("cas-month1-principal"),x=document.getElementById("cas-total-interest"),_=document.getElementById("cas-submit");if(l>0&&p>0){let v;if(s)v=Math.round(l*e.effective_rate/100/12);else{const h=D(l,e.effective_rate,p,d);v=h.monthlyPayment,y&&(y.textContent=b(h.month1Interest)),g&&(g.textContent=b(h.month1Principal)),x&&(x.textContent=b(h.totalInterest))}f&&(f.textContent=b(v)),_&&(_.disabled=l<=0||l>c)}else f&&(f.textContent="—"),y&&(y.textContent="—"),g&&(g.textContent="—"),x&&(x.textContent="—"),_&&(_.disabled=!0)};document.getElementById("cas-amount")?.addEventListener("input",L),document.getElementById("cas-term")?.addEventListener("input",L),document.getElementById("cas-submit")?.addEventListener("click",async()=>{if(S)return;S=!0;const l=document.getElementById("cas-submit");l&&(l.disabled=!0,l.textContent="Processing...");try{const p=Number(document.getElementById("cas-amount")?.value)||0,f=Number(document.getElementById("cas-term")?.value)||e.min_term_months;if(p<=0||p>c)return;const y=I.shard?.current_tick||0;let g;s?g=Math.round(p*e.effective_rate/100/12):g=D(p,e.effective_rate,f,d).monthlyPayment;const{data:x,error:_}=await A.rpc("accept_subsidiary_auto_policy_txn",{p_rate_id:e.id,p_borrower_faction_id:I.faction?.id,p_principal:p,p_term_months:f,p_monthly_payment:g,p_started_tick:y,p_expires_tick:y+f});if(_){console.error("[AutoServices] Accept failed:",_.message),alert("Failed: "+_.message);return}$.push(x),e.policies_issued=(e.policies_issued||0)+1;try{const v=I.faction?.faction_name||"A corporation",h=e.corp_properties?.name||"a financial institution",T=e.nation_id||I.faction?.nation_id;T&&await A.from("event_log").insert({nation_id:T,event_name:s?"Insurance Policy Issued":"Loan Agreement Signed",category:"corporate",description_chosen:s?`${v} has secured an insurance policy with ${h}.`:`${v} has just agreed to terms on a substantial loan with ${h}.`,fired_at_tick:y})}catch{}u(),P(t,o)}catch(p){console.error("[AutoServices] Accept error:",p),alert("An error occurred.")}finally{S=!1,l&&(l.disabled=!1,l.textContent="Accept")}})}export{H as M,Z as Q,Q as a,J as b,Y as c,V as d,j as e,X as i};
