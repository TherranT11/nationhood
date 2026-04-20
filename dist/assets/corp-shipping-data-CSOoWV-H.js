const de={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},D=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em_systems",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass_facades",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy_parts",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function ue(e,t,n){const s=D.find(r=>r.key===e);if(!s)return{available:!1,failedStat:"unknown_material"};const a=s.tiers[t];if(!a)return{available:!1,failedStat:"unknown_tier"};for(const r of a.requirements){const i=Number(n?.[r.stat]??0);if(i<r.min)return{available:!1,failedStat:r.stat,failedMin:r.min,nationValue:i}}return{available:!0}}function pe(e,t,n){const a={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em_systems:{LOW:400,STD:700,HIGH:1200},glass_facades:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy_parts:{LOW:800,STD:1400,HIGH:2400}}[e]?.[t];if(!a)return 0;const r=D.find(o=>o.key===e);if(!r)return a;let i=1;for(const o of r.priceDrivers){const c=Number(n?.[o]??50);o==="inflation"||o==="fuel_prices"?i*=1+(c-50)/200:i*=1-(c-50)/250}return i=Math.max(.4,Math.min(2.5,i)),Math.round(a*i)}function me(e,t,n){const a={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em_systems:{LOW:1e3,STD:700,HIGH:300},glass_facades:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy_parts:{LOW:400,STD:200,HIGH:80}}[e]?.[t]||0,i=D.find(d=>d.key===e)?.priceDrivers?.[0],c=.3+(i?Number(n?.[i]??50):50)/50*.7;return Math.round(a*c)}const fe=["LOW","STD","HIGH"],ve={LOW:"Low",STD:"Standard",HIGH:"High"};function U(e){var t=Number(e??50)/10;return Math.max(1,Math.min(15,Math.round(t*100)/100))}function j(e){var t=Number(e.stability??50),n=Number(e.civil_unrest??20),s=0;return t<40&&(s+=(40-t)/10*.5),n>30&&(s+=(n-30)/10*.3),Math.round(Math.min(3,s)*100)/100}function V(e){var t=Number(e.inflation??38),n=Number(e.credit??50),s=0;return t>50&&(s+=(t-50)/10*.3),n<40&&(s+=(40-n)/10*.4),Math.round(Math.min(2,s)*100)/100}function Y(e,t,n){var s=U(e.interest_rates),a=0;t==="insurance"?a=j(e):t==="loan"&&(a=V(e));var r=Math.max(0,Math.min(5,Number(n)||0)),i=Math.round((s+a+r)*100)/100;return{baseRate:s,riskAdjustment:a,markup:r,effectiveRate:i}}async function Q(e,t,n){var s=e.from("subsidiary_auto_rates").select("*, corp_properties!inner(name, subsector, faction_id)").eq("nation_id",t).eq("is_active",!0),{data:a,error:r}=await s.order("effective_rate",{ascending:!0});return r?(console.error("[SubServices] Failed to fetch rates:",r.message),[]):a||[]}async function Z(e,t){var{data:n,error:s}=await e.from("subsidiary_auto_policies").select("*").eq("borrower_faction_id",t).in("status",["active","lapsed"]).order("started_tick",{ascending:!1});return s?(console.error("[SubServices] Failed to fetch policies:",s.message),[]):n||[]}let A=null,k=null,E=[],L=[];function z(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function h(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function X(e,t,n){const s=Math.max(0,Number(e)||0),a=Math.max(0,Number(t)||0),r=Math.max(1,Number(n)||1),i=a/100/12;if(i<=0)return Math.round(s/r);const o=s*(i/(1-Math.pow(1+i,-r)));return Math.round(o)}function J(e){const t=String(e||"").trim().toLowerCase();return t==="amortized"||t==="amortising"||t==="amortizing"?"amortized":"flat"}function R(e){return J(e?.loan_interest_model||e?.interest_model||e?.loan_interest_type)}function P(e){const t=String(e?.loan_funding_model||"").trim().toLowerCase();return t==="parent_corp"?"parent_corp":t==="subsidiary_cash"?"subsidiary_cash":null}function C(e,t,n,s){const a=Math.max(0,Number(e)||0),r=Math.max(0,Number(t)||0),i=Math.max(1,Number(n)||1),o=r/100/12;if(s==="amortized"){const y=X(a,r,i),u=Math.round(a*o),l=Math.max(0,y-u),m=Math.max(0,Math.round(y*i-a));return{monthlyPayment:y,month1Interest:u,month1Principal:l,totalInterest:m}}const c=Math.round(a*r/100/12),d=Math.round(a/i),p=Math.round(c+d),g=Math.round(c*i);return{monthlyPayment:p,month1Interest:c,month1Principal:d,totalInterest:g}}async function ye(e,t,n,s){A=e,k=t;const a=document.getElementById(n);if(!a)return;const r=t.nation?.id,i=t.faction?.id;if(!r||!i){a.innerHTML='<div style="padding:20px;text-align:center;color:#666;font-size:10px;">No nation data.</div>';return}a.innerHTML='<div style="padding:20px;text-align:center;color:#666;font-family:var(--font-mono,monospace);font-size:10px;">Loading available services...</div>';const[o,c]=await Promise.all([Q(e,r),Z(e,i)]);E=o,L=c,O(a,s)}function O(e,t){const n=E.filter(o=>o.service_type==="insurance"),s=E.filter(o=>o.service_type==="loan"),a=L.filter(o=>o.service_type==="insurance"),r=L.filter(o=>o.service_type==="loan");let i="";(a.length>0||r.length>0)&&(i+='<div class="cas-section"><div class="cas-section-title">Your Active Policies</div>',i+=a.concat(r).map(o=>K(o)).join(""),i+="</div>"),i+='<div class="cas-section"><div class="cas-section-title">Available Insurance</div><div class="cas-section-body">',n.length===0?i+='<div class="cas-empty">No insurance subsidiaries operate in this nation.</div>':i+=n.map(o=>N(o,"insurance")).join(""),i+="</div></div>",i+='<div class="cas-section"><div class="cas-section-title">Available Credit</div><div class="cas-section-body">',s.length===0?i+='<div class="cas-empty">No banking subsidiaries operate in this nation.</div>':i+=s.map(o=>N(o,"loan")).join(""),i+="</div></div>",i||(i='<div class="cas-empty">No financial services available in this nation.</div>'),e.innerHTML=`<div class="cas-panel">${i}</div>`,e.addEventListener("click",o=>{const c=o.target.closest("[data-accept-rate]");if(!c)return;const d=c.dataset.acceptRate,p=c.dataset.serviceType;ee(e,d,p,t)})}function N(e,t){const n=e.corp_properties?.name||"Unknown Subsidiary",s=t==="insurance",a=s?"#c84":"#5a8aaa",r=s?"INSURANCE":"CREDIT",i=s?"Annual Premium":"Annual Interest",o=R(e),c=P(e),d=L.some(p=>p.rate_id===e.id&&p.status==="active");return`
        <div class="cas-rate-card">
            <div class="cas-rate-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:6px;height:6px;border-radius:50%;background:${a};display:inline-block;"></span>
                    <span style="font-size:11px;font-weight:700;color:#f0efe6;">${z(n)}</span>
                    <span class="cas-badge" style="color:${a};border-color:${a}44;background:${a}0a;">${r}</span>
                    ${s?"":`<span class="cas-badge" style="color:#8ab0c7;border-color:#8ab0c744;background:#8ab0c70f;">${o==="amortized"?"AMORTIZED":"FLAT"}</span>`}
                    ${!s&&c?`<span class="cas-badge" style="color:#b9a46a;border-color:#b9a46a44;background:#b9a46a0f;">${c==="parent_corp"?"PARENT FUNDED":"SUB FUNDED"}</span>`:""}
                </div>
                <span style="font-family:monospace;font-size:8px;color:#666;">${e.policies_issued||0} policies issued</span>
            </div>
            <div class="cas-rate-body">
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${i}</span>
                    <span class="cas-rate-value" style="color:${a};font-size:16px;">${e.effective_rate}%</span>
                </div>
                <div class="cas-rate-breakdown">
                    <span>Base: ${e.base_rate}%</span>
                    ${e.markup>0?`<span>+ Markup: ${e.markup}%</span>`:""}
                </div>
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${s?"Max Coverage":"Max Loan"}</span>
                    <span class="cas-rate-value">${h(e.coverage_limit||0)}</span>
                </div>
                ${s?`<div class="cas-rate-row">
                    <span class="cas-rate-label">Deductible</span>
                    <span class="cas-rate-value">${e.deductible_pct||10}%</span>
                </div>`:""}
                <div class="cas-rate-row">
                    <span class="cas-rate-label">Term</span>
                    <span class="cas-rate-value">${e.min_term_months}-${e.max_term_months} months</span>
                </div>
            </div>
            <div class="cas-rate-footer">
                ${d?'<span style="font-family:monospace;font-size:8px;font-weight:700;color:#5cb85c;">✓ ACTIVE POLICY</span>':`<button class="cas-accept-btn" data-accept-rate="${e.id}" data-service-type="${t}" style="border-color:${a};color:${a};">Accept ${s?"Coverage":"Terms"}</button>`}
            </div>
        </div>
    `}function K(e){const t=e.service_type==="insurance",n=t?"#c84":"#5a8aaa",s=e.status==="active"?"#5cb85c":e.status==="lapsed"?"#d9534f":"#666",a=R(e),r=P(e);return`
        <div class="cas-policy-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="cas-badge" style="color:${n};border-color:${n}44;background:${n}0a;">${t?"INSURANCE":"LOAN"}</span>
                    <span style="font-size:10px;font-weight:600;color:#c4c2b8;">${e.rate_at_issue}% rate</span>
                    ${t?"":`<span class="cas-badge" style="color:#8ab0c7;border-color:#8ab0c744;background:#8ab0c70f;">${a==="amortized"?"AMORTIZED":"FLAT"}</span>`}
                    ${!t&&r?`<span class="cas-badge" style="color:#b9a46a;border-color:#b9a46a44;background:#b9a46a0f;">${r==="parent_corp"?"PARENT FUNDED":"SUB FUNDED"}</span>`:""}
                </div>
                <span class="cas-badge" style="color:${s};border-color:${s}44;background:${s}0a;">${e.status.toUpperCase()}</span>
            </div>
            <div style="display:flex;gap:12px;margin-top:6px;font-family:monospace;font-size:8px;color:#888;">
                <span>${t?"Premium":"Payment"}: ${h(e.monthly_payment)}/mo</span>
                <span>Paid: ${h(e.total_paid)}</span>
                <span>${e.payments_made} payments</span>
            </div>
        </div>
    `}let w=!1;function ee(e,t,n,s){const a=E.find(u=>u.id===t);if(!a)return;const r=n==="insurance",i=r?"#c84":"#5a8aaa",o=a.corp_properties?.name||"Unknown",c=a.coverage_limit||0,d=R(a);let p=document.getElementById("cas-accept-overlay");p||(p=document.createElement("div"),p.id="cas-accept-overlay",p.className="cas-overlay",document.body.appendChild(p)),p.innerHTML=`
        <div class="cas-modal">
            <div class="cas-modal-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:7px;height:7px;border-radius:50%;background:${i};display:inline-block;"></span>
                    <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;">Accept ${r?"Insurance":"Loan"}</span>
                </div>
                <span class="cas-modal-close" id="cas-close">&times;</span>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:${i}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${i};display:inline-block;"></span>
                <span style="font-family:monospace;font-size:9px;color:#888;">Provider:</span>
                <span style="font-family:monospace;font-size:9px;font-weight:700;color:${i};">${z(o)}</span>
            </div>
            <div style="padding:16px;display:flex;flex-direction:column;gap:14px;">
                <div>
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${r?"Coverage Amount":"Loan Amount"}</div>
                    <input type="number" id="cas-amount" placeholder="Enter amount" max="${c}" style="width:100%;padding:7px 10px;font-family:monospace;font-size:13px;color:#f0efe6;background:#1c1c18;border:1px solid rgba(255,255,255,0.08);outline:none;box-sizing:border-box;">
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;margin-top:3px;">Max: ${h(c)}</div>
                </div>
                <div>
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Term (months)</div>
                    <input type="number" id="cas-term" value="${a.min_term_months}" min="${a.min_term_months}" max="${a.max_term_months}" style="width:120px;padding:7px 10px;font-family:monospace;font-size:13px;color:#f0efe6;background:#1c1c18;border:1px solid rgba(255,255,255,0.08);outline:none;text-align:center;">
                    <span style="font-family:monospace;font-size:8px;color:#4a4940;margin-left:8px;">${a.min_term_months}-${a.max_term_months} months</span>
                </div>
                <div style="padding:8px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">TERMS SUMMARY</div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Rate</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:${i};">${a.effective_rate}%</span>
                    </div>
                    ${r?`<div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Deductible</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:#c4c2b8;">${a.deductible_pct}%</span>
                    </div>`:""}
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Monthly ${r?"Premium":"Payment"}</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:#c4c2b8;" id="cas-monthly">—</span>
                    </div>
                    ${r?"":`<div style="margin-top:8px;padding-top:8px;border-top:1px dashed rgba(255,255,255,0.08);font-family:monospace;font-size:8px;color:#9d9b91;">
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
                <button class="cas-btn cas-btn--submit" id="cas-submit" disabled style="background:${i};">Accept</button>
            </div>
        </div>
    `,p.classList.add("active");const g=()=>{p.classList.remove("active")};document.getElementById("cas-close")?.addEventListener("click",g),document.getElementById("cas-cancel")?.addEventListener("click",g),p.addEventListener("click",u=>{u.target===p&&g()});const y=()=>{const u=Number(document.getElementById("cas-amount")?.value)||0,l=Number(document.getElementById("cas-term")?.value)||a.min_term_months,m=document.getElementById("cas-monthly"),v=document.getElementById("cas-month1-interest"),f=document.getElementById("cas-month1-principal"),_=document.getElementById("cas-total-interest"),b=document.getElementById("cas-submit");if(u>0&&l>0){let x;if(r)x=Math.round(u*a.effective_rate/100/12);else{const $=C(u,a.effective_rate,l,d);x=$.monthlyPayment,v&&(v.textContent=h($.month1Interest)),f&&(f.textContent=h($.month1Principal)),_&&(_.textContent=h($.totalInterest))}m&&(m.textContent=h(x)),b&&(b.disabled=u<=0||u>c)}else m&&(m.textContent="—"),v&&(v.textContent="—"),f&&(f.textContent="—"),_&&(_.textContent="—"),b&&(b.disabled=!0)};document.getElementById("cas-amount")?.addEventListener("input",y),document.getElementById("cas-term")?.addEventListener("input",y),document.getElementById("cas-submit")?.addEventListener("click",async()=>{if(w)return;w=!0;const u=document.getElementById("cas-submit");u&&(u.disabled=!0,u.textContent="Processing...");try{const l=Number(document.getElementById("cas-amount")?.value)||0,m=Number(document.getElementById("cas-term")?.value)||a.min_term_months;if(l<=0||l>c)return;const v=k.shard?.current_tick||0;let f;r?f=Math.round(l*a.effective_rate/100/12):f=C(l,a.effective_rate,m,d).monthlyPayment;const{data:_,error:b}=await A.rpc("accept_subsidiary_auto_policy_txn",{p_rate_id:a.id,p_borrower_faction_id:k.faction?.id,p_principal:l,p_term_months:m,p_monthly_payment:f,p_started_tick:v,p_expires_tick:v+m});if(b){console.error("[AutoServices] Accept failed:",b.message),alert("Failed: "+b.message);return}L.push(_),a.policies_issued=(a.policies_issued||0)+1;try{const x=k.faction?.faction_name||"A corporation",$=a.corp_properties?.name||"a financial institution",H=a.nation_id||k.faction?.nation_id;H&&await A.from("event_log").insert({nation_id:H,event_name:r?"Insurance Policy Issued":"Loan Agreement Signed",category:"corporate",description_chosen:r?`${x} has secured an insurance policy with ${$}.`:`${x} has just agreed to terms on a substantial loan with ${$}.`,fired_at_tick:v})}catch{}g(),O(e,s)}catch(l){console.error("[AutoServices] Accept error:",l),alert("An error occurred.")}finally{w=!1,u&&(u.disabled=!1,u.textContent="Accept")}})}let q=null,B=null,G=null,F=[];function S(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function te(e){const t=String(e||"").trim().toLowerCase();return t==="amortized"||t==="amortising"||t==="amortizing"?"amortized":"flat"}function ae(e){const t=String(e?.loan_funding_model||"").trim().toLowerCase();return t==="parent_corp"?"parent_corp":t==="subsidiary_cash"?"subsidiary_cash":null}async function ge(e,t,n,s){q=e,B=t;const a=document.getElementById(n);if(!a)return;a.innerHTML='<div style="padding:16px;text-align:center;color:#4a4940;font-family:monospace;font-size:10px;">Loading dashboard...</div>';const[r,i]=await Promise.all([e.from("subsidiary_auto_rates").select("*").eq("subsidiary_id",s).maybeSingle(),e.from("subsidiary_auto_policies").select("*").eq("subsidiary_id",s).order("started_tick",{ascending:!1}).limit(50)]);r.error&&console.error("[SubDash] Rate fetch error:",r.error.message),i.error&&console.error("[SubDash] Policies fetch error:",i.error.message),G=r.data,F=i.data||[],W(a)}function W(e){const t=G,n=F,s=t?.service_type==="insurance",a=s?"#c84":"#5a8aaa",r=s?"Insurance":"Banking";if(!t){e.innerHTML=`
            <div class="csd-panel">
                <div class="csd-empty">
                    <div style="font-size:1.5rem;margin-bottom:8px;opacity:0.4;">${s?"🛡️":"🏦"}</div>
                    <div style="font-family:monospace;font-size:10px;color:#888;">Auto-rate not yet generated.</div>
                    <div style="font-family:monospace;font-size:8px;color:#4a4940;margin-top:4px;">Rates are generated automatically each tick based on national interest rates.</div>
                </div>
            </div>
        `;return}const i=n.filter(l=>l.status==="active"),o=Number(t.total_revenue??0),c=Number(t.total_claims??0),d=o-c,p=d>=0?"#5cb85c":"#d9534f",g=n.slice(0,20).map(l=>{const m=l.status==="active"?"#5cb85c":l.status==="defaulted"?"#d9534f":l.status==="repaid"?"#5a8aaa":"#666",v=te(l.loan_interest_model||l.interest_model||l.loan_interest_type),f=ae(l);return`
            <div class="csd-policy-row">
                <span class="csd-policy-status" style="color:${m};">●</span>
                <span class="csd-policy-type">${l.service_type==="insurance"?"INS":"LOAN"}</span>
                <span class="csd-policy-rate">${l.rate_at_issue}%</span>
                <span class="csd-policy-principal">${S(l.principal)}</span>
                <span class="csd-policy-payment">${S(l.monthly_payment)}/mo</span>
                <span class="csd-policy-paid">${S(l.total_paid)} paid</span>
                ${l.service_type==="loan"?`<span class="csd-policy-type" style="color:#8ab0c7;">${v==="amortized"?"AMORTIZED":"FLAT"}</span>`:""}
                ${l.service_type==="loan"&&f?`<span class="csd-policy-type" style="color:#b9a46a;">${f==="parent_corp"?"PARENT":"SUB CASH"}</span>`:""}
                <span class="csd-policy-badge" style="color:${m};border-color:${m}44;background:${m}0a;">${l.status.toUpperCase()}</span>
            </div>
        `}).join("");e.innerHTML=`
        <div class="csd-panel">
            <!-- Header -->
            <div class="csd-header">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:8px;height:8px;border-radius:50%;background:${a};display:inline-block;"></span>
                    <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:${a};text-transform:uppercase;">${r} Services Dashboard</span>
                </div>
                <span style="font-family:monospace;font-size:8px;color:#666;">${t.is_active?"ACTIVE":"INACTIVE"}</span>
            </div>

            <!-- Rate overview -->
            <div class="csd-rate-section">
                <div class="csd-rate-card">
                    <div class="csd-rate-card-label">Effective Rate</div>
                    <div class="csd-rate-card-value" style="color:${a};font-size:24px;">${t.effective_rate}%</div>
                    <div class="csd-rate-breakdown">
                        Base: ${t.base_rate}% ${Number(t.markup)>0?"+ Markup: "+t.markup+"%":""}
                    </div>
                </div>
                <div class="csd-rate-card">
                    <div class="csd-rate-card-label">Active Policies</div>
                    <div class="csd-rate-card-value">${i.length}</div>
                    <div class="csd-rate-breakdown">${t.policies_issued||0} total issued</div>
                </div>
                <div class="csd-rate-card">
                    <div class="csd-rate-card-label">Net Revenue</div>
                    <div class="csd-rate-card-value" style="color:${p};">${S(d)}</div>
                    <div class="csd-rate-breakdown">
                        <span style="color:#5cb85c;">${S(o)} collected</span>
                        ${c>0?` &mdash; <span style="color:#d9534f;">${S(c)} claims</span>`:""}
                    </div>
                </div>
                ${s?`<div class="csd-rate-card">
                    <div class="csd-rate-card-label">Deductible</div>
                    <div class="csd-rate-card-value">${t.deductible_pct}%</div>
                    <div class="csd-rate-breakdown">Applied to claim payouts</div>
                </div>`:""}
            </div>

            <!-- Markup control -->
            <div class="csd-markup-section">
                <div class="csd-markup-header">
                    <span class="csd-markup-label">Owner Markup</span>
                    <span class="csd-markup-value" id="csd-markup-display">${t.markup}%</span>
                </div>
                <div class="csd-markup-slider-row">
                    <span style="font-family:monospace;font-size:7px;color:#4a4940;">0%</span>
                    <input type="range" min="0" max="50" step="1" value="${Math.round(Number(t.markup)*10)}" id="csd-markup-slider" class="csd-slider">
                    <span style="font-family:monospace;font-size:7px;color:#4a4940;">5%</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
                    <span style="font-family:monospace;font-size:7px;color:#4a4940;">Higher markup = more revenue per policy, fewer customers</span>
                    <button class="csd-save-btn" id="csd-save-markup">Save Markup</button>
                </div>
            </div>

            <!-- Service limits -->
            <div class="csd-limits-section">
                <div class="csd-limits-row">
                    <span class="csd-limits-label">${s?"Max Coverage":"Max Loan"}</span>
                    <span class="csd-limits-value">${S(t.coverage_limit||0)}</span>
                </div>
                <div class="csd-limits-row">
                    <span class="csd-limits-label">Term Range</span>
                    <span class="csd-limits-value">${t.min_term_months}-${t.max_term_months} months</span>
                </div>
            </div>

            <!-- Policies table -->
            <div class="csd-policies-section">
                <div class="csd-policies-title">Issued Policies (${n.length})</div>
                ${n.length===0?'<div style="font-family:monospace;font-size:9px;color:#4a4940;font-style:italic;padding:8px 0;">No policies issued yet. Corporations in this nation will see your rates and can accept coverage.</div>':`<div class="csd-policies-list">${g}</div>`}
            </div>
        </div>
    `;const y=document.getElementById("csd-markup-slider"),u=document.getElementById("csd-markup-display");y&&u&&y.addEventListener("input",()=>{u.textContent=(y.value/10).toFixed(1)+"%"}),document.getElementById("csd-save-markup")?.addEventListener("click",async()=>{const l=Number(y?.value||0)/10,m=document.getElementById("csd-save-markup");m&&(m.disabled=!0,m.textContent="Saving...");try{const v=B.nation,f=Y(v,t.service_type,l),{error:_}=await q.from("subsidiary_auto_rates").update({markup:f.markup,effective_rate:f.effectiveRate,updated_at:new Date().toISOString()}).eq("id",t.id);if(_){console.error("[SubDash] Save markup failed:",_.message),alert("Failed to save markup.");return}t.markup=f.markup,t.effective_rate=f.effectiveRate,W(e)}catch(v){console.error("[SubDash] Save markup error:",v)}finally{m&&(m.disabled=!1,m.textContent="Save Markup")}})}const se=new Set(["PGRST200","PGRST201","PGRST202","PGRST204","42P01"]);function T(e){if(!e)return!1;const t=String(e.code||"").trim(),n=String(e.message||"").toLowerCase();return se.has(t)||n.includes("could not find a relationship")||n.includes("schema cache")||n.includes("does not exist")}function I(e,t){return e?T(e)?{code:e.code||"SCHEMA_MISSING",message:t||"Shipping data schema is not fully available yet.",rawMessage:e.message||null,isSchemaMissing:!0}:{code:e.code||"QUERY_FAILED",message:e.message||"Failed to load shipping data.",rawMessage:e.message||null,isSchemaMissing:!1}:null}function M(e,t,n){return{ok:!n,state:n?"error":t.length===0?"empty":"ready",[e]:t,error:n}}const ne=1e6,ie=18e6,re=2;function oe(e,t,n){const s=Number(e)||0;return s<t?t:s>n?n:s}function ce(e){const t=Math.max(25e4,Number(e?.estimated_revenue)||0),n=Math.max(re,Number(e?.gov_contract_duration||e?.transit_ticks||1)||1),s=Math.round(t*n*1.35),a=Number(e?.gov_contract_value)||s;return Math.round(oe(a,ne,ie))}function le(e){if(!e||e.scope!=="GOVERNMENT")return e;const t=ce(e);return{...e,display_contract_value:t}}async function _e(e,t,n,s={}){const r={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"}[n]||"",i=(s.routeOrigin||"all").toLowerCase(),o=Math.max(0,Number(s.offset||0)),c=Math.max(1,Math.min(Number(s.limit||200),500));let d=e.from("shipping_routes").select("*").eq("status","active").eq("shipping_subsector",r);i==="organic"?d=d.is("trade_agreement_id",null):i==="agreement"&&(d=d.not("trade_agreement_id","is",null)),d=d.order("estimated_revenue",{ascending:!1}).range(o,o+c-1);const[p,g]=await Promise.all([d,e.from("shipping_applications").select("*").eq("faction_id",t).in("status",["pending","approved"])]),y=I(p.error,"Shipping routes are temporarily unavailable."),u=I(g.error,"Shipping applications are temporarily unavailable."),l=y||u;return{ok:!l,state:l?"error":(p.data||[]).length===0?"empty":"ready",routes:l?[]:(p.data||[]).map(le),applications:l?[]:g.data||[],error:l}}async function be(e,t){const n=await e.from("shipping_claims").select("*, shipping_routes(*)").eq("faction_id",t).eq("status","active").order("claimed_at_tick",{ascending:!1});if(!n.error)return M("claims",n.data||[],null);if(!T(n.error))return M("claims",[],I(n.error,"Active voyage data is temporarily unavailable."));const s=await e.from("shipping_claims").select("*").eq("faction_id",t).eq("status","active").order("claimed_at_tick",{ascending:!1});if(s.error)return M("claims",[],I(s.error,"Active voyage data is temporarily unavailable."));const a=s.data||[],r=[...new Set(a.map(c=>c.route_id).filter(Boolean))];let i={};if(r.length>0){const c=await e.from("shipping_routes").select("*").in("id",r);c.error||(i=Object.fromEntries((c.data||[]).map(d=>[d.id,d])))}const o=a.map(c=>({...c,shipping_routes:i[c.route_id]||null}));return{ok:!0,state:o.length===0?"empty":"ready",claims:o,error:null}}async function he(e){const t=await e.from("subsidiary_sales").select("*, subsidiary_bids(*)").eq("status","listed").order("listed_at_tick",{ascending:!1});if(!t.error)return M("listings",t.data||[],null);if(!T(t.error))return M("listings",[],I(t.error,"Subsidiary marketplace is temporarily unavailable."));const n=await e.from("subsidiary_sales").select("*").eq("status","listed").order("listed_at_tick",{ascending:!1});if(n.error)return M("listings",[],I(n.error,"Subsidiary marketplace is temporarily unavailable."));const s=n.data||[],a=s.map(o=>o.id).filter(Boolean);let r={};if(a.length>0){const o=await e.from("subsidiary_bids").select("*").in("sale_id",a);o.error||(r=(o.data||[]).reduce((c,d)=>(c[d.sale_id]||(c[d.sale_id]=[]),c[d.sale_id].push(d),c),{}))}const i=s.map(o=>({...o,subsidiary_bids:r[o.id]||[]}));return{ok:!0,state:i.length===0?"empty":"ready",listings:i,error:null}}export{D as M,fe as Q,ye as a,pe as b,ue as c,ve as d,me as e,de as f,he as g,_e as h,ge as i,be as l};
