const J={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},E=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em_systems",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass_facades",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy_parts",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function X(e,t,s){const i=E.find(r=>r.key===e);if(!i)return{available:!1,failedStat:"unknown_material"};const a=i.tiers[t];if(!a)return{available:!1,failedStat:"unknown_tier"};for(const r of a.requirements){const n=Number(s?.[r.stat]??0);if(n<r.min)return{available:!1,failedStat:r.stat,failedMin:r.min,nationValue:n}}return{available:!0}}function Z(e,t,s){const a={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em_systems:{LOW:400,STD:700,HIGH:1200},glass_facades:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy_parts:{LOW:800,STD:1400,HIGH:2400}}[e]?.[t];if(!a)return 0;const r=E.find(o=>o.key===e);if(!r)return a;let n=1;for(const o of r.priceDrivers){const c=Number(s?.[o]??50);o==="inflation"||o==="fuel_prices"?n*=1+(c-50)/200:n*=1-(c-50)/250}return n=Math.max(.4,Math.min(2.5,n)),Math.round(a*n)}function K(e,t,s){const a={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em_systems:{LOW:1e3,STD:700,HIGH:300},glass_facades:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy_parts:{LOW:400,STD:200,HIGH:80}}[e]?.[t]||0,n=E.find(l=>l.key===e)?.priceDrivers?.[0],c=.3+(n?Number(s?.[n]??50):50)/50*.7;return Math.round(a*c)}const ee=["LOW","STD","HIGH"],te={LOW:"Low",STD:"Standard",HIGH:"High"};function O(e){var t=Number(e??50)/10;return Math.max(1,Math.min(15,Math.round(t*100)/100))}function G(e){var t=Number(e.stability??50),s=Number(e.civil_unrest??20),i=0;return t<40&&(i+=(40-t)/10*.5),s>30&&(i+=(s-30)/10*.3),Math.round(Math.min(3,i)*100)/100}function W(e){var t=Number(e.inflation??38),s=Number(e.credit??50),i=0;return t>50&&(i+=(t-50)/10*.3),s<40&&(i+=(40-s)/10*.4),Math.round(Math.min(2,i)*100)/100}function F(e,t,s){var i=O(e.interest_rates),a=0;t==="insurance"?a=G(e):t==="loan"&&(a=W(e));var r=Math.max(0,Math.min(5,Number(s)||0)),n=Math.round((i+a+r)*100)/100;return{baseRate:i,riskAdjustment:a,markup:r,effectiveRate:n}}async function U(e,t,s){var i=e.from("subsidiary_auto_rates").select("*, corp_properties!inner(name, subsector, faction_id)").eq("nation_id",t).eq("is_active",!0),{data:a,error:r}=await i.order("effective_rate",{ascending:!0});return r?(console.error("[SubServices] Failed to fetch rates:",r.message),[]):a||[]}async function j(e,t){var{data:s,error:i}=await e.from("subsidiary_auto_policies").select("*").eq("borrower_faction_id",t).in("status",["active","lapsed"]).order("started_tick",{ascending:!1});return i?(console.error("[SubServices] Failed to fetch policies:",i.message),[]):s||[]}let M=null,S=null,w=[],$=[];function T(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function k(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}async function ae(e,t,s,i){M=e,S=t;const a=document.getElementById(s);if(!a)return;const r=t.nation?.id,n=t.faction?.id;if(!r||!n){a.innerHTML='<div style="padding:20px;text-align:center;color:#666;font-size:10px;">No nation data.</div>';return}a.innerHTML='<div style="padding:20px;text-align:center;color:#666;font-family:var(--font-mono,monospace);font-size:10px;">Loading available services...</div>';const[o,c]=await Promise.all([U(e,r),j(e,n)]);w=o,$=c,C(a,i)}function C(e,t){const s=w.filter(o=>o.service_type==="insurance"),i=w.filter(o=>o.service_type==="loan"),a=$.filter(o=>o.service_type==="insurance"),r=$.filter(o=>o.service_type==="loan");let n="";(a.length>0||r.length>0)&&(n+='<div class="cas-section"><div class="cas-section-title">Your Active Policies</div>',n+=a.concat(r).map(o=>Y(o)).join(""),n+="</div>"),n+='<div class="cas-section"><div class="cas-section-title">Available Insurance</div><div class="cas-section-body">',s.length===0?n+='<div class="cas-empty">No insurance subsidiaries operate in this nation.</div>':n+=s.map(o=>D(o,"insurance")).join(""),n+="</div></div>",n+='<div class="cas-section"><div class="cas-section-title">Available Credit</div><div class="cas-section-body">',i.length===0?n+='<div class="cas-empty">No banking subsidiaries operate in this nation.</div>':n+=i.map(o=>D(o,"loan")).join(""),n+="</div></div>",n||(n='<div class="cas-empty">No financial services available in this nation.</div>'),e.innerHTML=`<div class="cas-panel">${n}</div>`,e.addEventListener("click",o=>{const c=o.target.closest("[data-accept-rate]");if(!c)return;const l=c.dataset.acceptRate,y=c.dataset.serviceType;V(e,l,y,t)})}function D(e,t){const s=e.corp_properties?.name||"Unknown Subsidiary",i=t==="insurance",a=i?"#c84":"#5a8aaa",r=i?"INSURANCE":"CREDIT",n=i?"Annual Premium":"Annual Interest",o=$.some(c=>c.rate_id===e.id&&c.status==="active");return`
        <div class="cas-rate-card">
            <div class="cas-rate-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:6px;height:6px;border-radius:50%;background:${a};display:inline-block;"></span>
                    <span style="font-size:11px;font-weight:700;color:#f0efe6;">${T(s)}</span>
                    <span class="cas-badge" style="color:${a};border-color:${a}44;background:${a}0a;">${r}</span>
                </div>
                <span style="font-family:monospace;font-size:8px;color:#666;">${e.policies_issued||0} policies issued</span>
            </div>
            <div class="cas-rate-body">
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${n}</span>
                    <span class="cas-rate-value" style="color:${a};font-size:16px;">${e.effective_rate}%</span>
                </div>
                <div class="cas-rate-breakdown">
                    <span>Base: ${e.base_rate}%</span>
                    ${e.markup>0?`<span>+ Markup: ${e.markup}%</span>`:""}
                </div>
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${i?"Max Coverage":"Max Loan"}</span>
                    <span class="cas-rate-value">${k(e.coverage_limit||0)}</span>
                </div>
                ${i?`<div class="cas-rate-row">
                    <span class="cas-rate-label">Deductible</span>
                    <span class="cas-rate-value">${e.deductible_pct||10}%</span>
                </div>`:""}
                <div class="cas-rate-row">
                    <span class="cas-rate-label">Term</span>
                    <span class="cas-rate-value">${e.min_term_months}-${e.max_term_months} months</span>
                </div>
            </div>
            <div class="cas-rate-footer">
                ${o?'<span style="font-family:monospace;font-size:8px;font-weight:700;color:#5cb85c;">✓ ACTIVE POLICY</span>':`<button class="cas-accept-btn" data-accept-rate="${e.id}" data-service-type="${t}" style="border-color:${a};color:${a};">Accept ${i?"Coverage":"Terms"}</button>`}
            </div>
        </div>
    `}function Y(e){const t=e.service_type==="insurance",s=t?"#c84":"#5a8aaa",i=e.status==="active"?"#5cb85c":e.status==="lapsed"?"#d9534f":"#666";return`
        <div class="cas-policy-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="cas-badge" style="color:${s};border-color:${s}44;background:${s}0a;">${t?"INSURANCE":"LOAN"}</span>
                    <span style="font-size:10px;font-weight:600;color:#c4c2b8;">${e.rate_at_issue}% rate</span>
                </div>
                <span class="cas-badge" style="color:${i};border-color:${i}44;background:${i}0a;">${e.status.toUpperCase()}</span>
            </div>
            <div style="display:flex;gap:12px;margin-top:6px;font-family:monospace;font-size:8px;color:#888;">
                <span>${t?"Premium":"Payment"}: ${k(e.monthly_payment)}/mo</span>
                <span>Paid: ${k(e.total_paid)}</span>
                <span>${e.payments_made} payments</span>
            </div>
        </div>
    `}let L=!1;function V(e,t,s,i){const a=w.find(u=>u.id===t);if(!a)return;const r=s==="insurance",n=r?"#c84":"#5a8aaa",o=a.corp_properties?.name||"Unknown",c=a.coverage_limit||0;let l=document.getElementById("cas-accept-overlay");l||(l=document.createElement("div"),l.id="cas-accept-overlay",l.className="cas-overlay",document.body.appendChild(l)),l.innerHTML=`
        <div class="cas-modal">
            <div class="cas-modal-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:7px;height:7px;border-radius:50%;background:${n};display:inline-block;"></span>
                    <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;">Accept ${r?"Insurance":"Loan"}</span>
                </div>
                <span class="cas-modal-close" id="cas-close">&times;</span>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:${n}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${n};display:inline-block;"></span>
                <span style="font-family:monospace;font-size:9px;color:#888;">Provider:</span>
                <span style="font-family:monospace;font-size:9px;font-weight:700;color:${n};">${T(o)}</span>
            </div>
            <div style="padding:16px;display:flex;flex-direction:column;gap:14px;">
                <div>
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${r?"Coverage Amount":"Loan Amount"}</div>
                    <input type="number" id="cas-amount" placeholder="Enter amount" max="${c}" style="width:100%;padding:7px 10px;font-family:monospace;font-size:13px;color:#f0efe6;background:#1c1c18;border:1px solid rgba(255,255,255,0.08);outline:none;box-sizing:border-box;">
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;margin-top:3px;">Max: ${k(c)}</div>
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
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:${n};">${a.effective_rate}%</span>
                    </div>
                    ${r?`<div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Deductible</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:#c4c2b8;">${a.deductible_pct}%</span>
                    </div>`:""}
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Monthly ${r?"Premium":"Payment"}</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:#c4c2b8;" id="cas-monthly">—</span>
                    </div>
                </div>
            </div>
            <div style="padding:10px 16px;border-top:1px solid rgba(255,255,255,0.06);background:#1c1c18;display:flex;justify-content:flex-end;gap:6px;">
                <button class="cas-btn cas-btn--cancel" id="cas-cancel">Cancel</button>
                <button class="cas-btn cas-btn--submit" id="cas-submit" disabled style="background:${n};">Accept</button>
            </div>
        </div>
    `,l.classList.add("active");const y=()=>{l.classList.remove("active")};document.getElementById("cas-close")?.addEventListener("click",y),document.getElementById("cas-cancel")?.addEventListener("click",y),l.addEventListener("click",u=>{u.target===l&&y()});const I=()=>{const u=Number(document.getElementById("cas-amount")?.value)||0,m=Number(document.getElementById("cas-term")?.value)||a.min_term_months,d=document.getElementById("cas-monthly"),p=document.getElementById("cas-submit");if(u>0&&m>0){let f;if(r)f=Math.round(u*a.effective_rate/100/12);else{const v=a.effective_rate/100/12;v>0?f=Math.round(u*(v*Math.pow(1+v,m))/(Math.pow(1+v,m)-1)):f=Math.round(u/m)}d&&(d.textContent=k(f)),p&&(p.disabled=u<=0||u>c)}else d&&(d.textContent="—"),p&&(p.disabled=!0)};document.getElementById("cas-amount")?.addEventListener("input",I),document.getElementById("cas-term")?.addEventListener("input",I),document.getElementById("cas-submit")?.addEventListener("click",async()=>{if(L)return;L=!0;const u=document.getElementById("cas-submit");u&&(u.disabled=!0,u.textContent="Processing...");try{const m=Number(document.getElementById("cas-amount")?.value)||0,d=Number(document.getElementById("cas-term")?.value)||a.min_term_months;if(m<=0||m>c)return;const p=S.shard?.current_tick||0;let f;if(r)f=Math.round(m*a.effective_rate/100/12);else{const g=a.effective_rate/100/12;f=g>0?Math.round(m*(g*Math.pow(1+g,d))/(Math.pow(1+g,d)-1)):Math.round(m/d)}const{data:v,error:b}=await M.from("subsidiary_auto_policies").insert({rate_id:a.id,subsidiary_id:a.subsidiary_id,lender_faction_id:a.faction_id,borrower_faction_id:S.faction?.id,nation_id:a.nation_id,service_type:s,rate_at_issue:a.effective_rate,principal:m,deductible_pct:r?a.deductible_pct:0,monthly_payment:f,term_months:d,remaining_principal:r?0:m,started_tick:p,expires_tick:p+d,status:"active"}).select("*").single();if(b){console.error("[AutoServices] Accept failed:",b.message),alert("Failed: "+b.message);return}await M.from("subsidiary_auto_rates").update({policies_issued:(a.policies_issued||0)+1}).eq("id",a.id),$.push(v);try{const g=S.faction?.faction_name||"A corporation",A=a.corp_properties?.name||"a financial institution",R=a.nation_id||S.faction?.nation_id;R&&await M.from("event_log").insert({nation_id:R,event_name:r?"Insurance Policy Issued":"Loan Agreement Signed",category:"corporate",description_chosen:r?`${g} has secured an insurance policy with ${A}.`:`${g} has just agreed to terms on a substantial loan with ${A}.`,fired_at_tick:p})}catch{}y(),C(e,i)}catch(m){console.error("[AutoServices] Accept error:",m),alert("An error occurred.")}finally{L=!1,u&&(u.disabled=!1,u.textContent="Accept")}})}let q=null,N=null,z=null,P=[];function _(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}async function se(e,t,s,i){q=e,N=t;const a=document.getElementById(s);if(!a)return;a.innerHTML='<div style="padding:16px;text-align:center;color:#4a4940;font-family:monospace;font-size:10px;">Loading dashboard...</div>';const[r,n]=await Promise.all([e.from("subsidiary_auto_rates").select("*").eq("subsidiary_id",i).maybeSingle(),e.from("subsidiary_auto_policies").select("*").eq("subsidiary_id",i).order("started_tick",{ascending:!1}).limit(50)]);r.error&&console.error("[SubDash] Rate fetch error:",r.error.message),n.error&&console.error("[SubDash] Policies fetch error:",n.error.message),z=r.data,P=n.data||[],B(a)}function B(e){const t=z,s=P,i=t?.service_type==="insurance",a=i?"#c84":"#5a8aaa",r=i?"Insurance":"Banking";if(!t){e.innerHTML=`
            <div class="csd-panel">
                <div class="csd-empty">
                    <div style="font-size:1.5rem;margin-bottom:8px;opacity:0.4;">${i?"🛡️":"🏦"}</div>
                    <div style="font-family:monospace;font-size:10px;color:#888;">Auto-rate not yet generated.</div>
                    <div style="font-family:monospace;font-size:8px;color:#4a4940;margin-top:4px;">Rates are generated automatically each tick based on national interest rates.</div>
                </div>
            </div>
        `;return}const n=s.filter(d=>d.status==="active"),o=Number(t.total_revenue??0),c=Number(t.total_claims??0),l=o-c,y=l>=0?"#5cb85c":"#d9534f",I=s.slice(0,20).map(d=>{const p=d.status==="active"?"#5cb85c":d.status==="defaulted"?"#d9534f":d.status==="repaid"?"#5a8aaa":"#666";return`
            <div class="csd-policy-row">
                <span class="csd-policy-status" style="color:${p};">●</span>
                <span class="csd-policy-type">${d.service_type==="insurance"?"INS":"LOAN"}</span>
                <span class="csd-policy-rate">${d.rate_at_issue}%</span>
                <span class="csd-policy-principal">${_(d.principal)}</span>
                <span class="csd-policy-payment">${_(d.monthly_payment)}/mo</span>
                <span class="csd-policy-paid">${_(d.total_paid)} paid</span>
                <span class="csd-policy-badge" style="color:${p};border-color:${p}44;background:${p}0a;">${d.status.toUpperCase()}</span>
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
                    <div class="csd-rate-card-value">${n.length}</div>
                    <div class="csd-rate-breakdown">${t.policies_issued||0} total issued</div>
                </div>
                <div class="csd-rate-card">
                    <div class="csd-rate-card-label">Net Revenue</div>
                    <div class="csd-rate-card-value" style="color:${y};">${_(l)}</div>
                    <div class="csd-rate-breakdown">
                        <span style="color:#5cb85c;">${_(o)} collected</span>
                        ${c>0?` &mdash; <span style="color:#d9534f;">${_(c)} claims</span>`:""}
                    </div>
                </div>
                ${i?`<div class="csd-rate-card">
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
                    <span class="csd-limits-label">${i?"Max Coverage":"Max Loan"}</span>
                    <span class="csd-limits-value">${_(t.coverage_limit||0)}</span>
                </div>
                <div class="csd-limits-row">
                    <span class="csd-limits-label">Term Range</span>
                    <span class="csd-limits-value">${t.min_term_months}-${t.max_term_months} months</span>
                </div>
            </div>

            <!-- Policies table -->
            <div class="csd-policies-section">
                <div class="csd-policies-title">Issued Policies (${s.length})</div>
                ${s.length===0?'<div style="font-family:monospace;font-size:9px;color:#4a4940;font-style:italic;padding:8px 0;">No policies issued yet. Corporations in this nation will see your rates and can accept coverage.</div>':`<div class="csd-policies-list">${I}</div>`}
            </div>
        </div>
    `;const u=document.getElementById("csd-markup-slider"),m=document.getElementById("csd-markup-display");u&&m&&u.addEventListener("input",()=>{m.textContent=(u.value/10).toFixed(1)+"%"}),document.getElementById("csd-save-markup")?.addEventListener("click",async()=>{const d=Number(u?.value||0)/10,p=document.getElementById("csd-save-markup");p&&(p.disabled=!0,p.textContent="Saving...");try{const f=N.nation,v=F(f,t.service_type,d),{error:b}=await q.from("subsidiary_auto_rates").update({markup:v.markup,effective_rate:v.effectiveRate,updated_at:new Date().toISOString()}).eq("id",t.id);if(b){console.error("[SubDash] Save markup failed:",b.message),alert("Failed to save markup.");return}t.markup=v.markup,t.effective_rate=v.effectiveRate,B(e)}catch(f){console.error("[SubDash] Save markup error:",f)}finally{p&&(p.disabled=!1,p.textContent="Save Markup")}})}const Q=new Set(["PGRST200","PGRST201","PGRST202","PGRST204","42P01"]);function H(e){if(!e)return!1;const t=String(e.code||"").trim(),s=String(e.message||"").toLowerCase();return Q.has(t)||s.includes("could not find a relationship")||s.includes("schema cache")||s.includes("does not exist")}function x(e,t){return e?H(e)?{code:e.code||"SCHEMA_MISSING",message:t||"Shipping data schema is not fully available yet.",rawMessage:e.message||null,isSchemaMissing:!0}:{code:e.code||"QUERY_FAILED",message:e.message||"Failed to load shipping data.",rawMessage:e.message||null,isSchemaMissing:!1}:null}function h(e,t,s){return{ok:!s,state:s?"error":t.length===0?"empty":"ready",[e]:t,error:s}}async function ie(e,t,s){const a={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"}[s]||"",[r,n]=await Promise.all([e.from("shipping_routes").select("*").eq("status","active").eq("shipping_subsector",a).order("estimated_revenue",{ascending:!1}),e.from("shipping_applications").select("*").eq("faction_id",t).in("status",["pending","approved"])]),o=x(r.error,"Shipping routes are temporarily unavailable."),c=x(n.error,"Shipping applications are temporarily unavailable."),l=o||c;return{ok:!l,state:l?"error":(r.data||[]).length===0?"empty":"ready",routes:l?[]:r.data||[],applications:l?[]:n.data||[],error:l}}async function ne(e,t){const s=await e.from("shipping_claims").select("*, shipping_routes(*)").eq("faction_id",t).eq("status","active").order("claimed_at_tick",{ascending:!1});if(!s.error)return h("claims",s.data||[],null);if(!H(s.error))return h("claims",[],x(s.error,"Active voyage data is temporarily unavailable."));const i=await e.from("shipping_claims").select("*").eq("faction_id",t).eq("status","active").order("claimed_at_tick",{ascending:!1});if(i.error)return h("claims",[],x(i.error,"Active voyage data is temporarily unavailable."));const a=i.data||[],r=[...new Set(a.map(c=>c.route_id).filter(Boolean))];let n={};if(r.length>0){const c=await e.from("shipping_routes").select("*").in("id",r);c.error||(n=Object.fromEntries((c.data||[]).map(l=>[l.id,l])))}const o=a.map(c=>({...c,shipping_routes:n[c.route_id]||null}));return{ok:!0,state:o.length===0?"empty":"ready",claims:o,error:null}}async function re(e){const t=await e.from("subsidiary_sales").select("*, subsidiary_bids(*)").eq("status","listed").order("listed_at_tick",{ascending:!1});if(!t.error)return h("listings",t.data||[],null);if(!H(t.error))return h("listings",[],x(t.error,"Subsidiary marketplace is temporarily unavailable."));const s=await e.from("subsidiary_sales").select("*").eq("status","listed").order("listed_at_tick",{ascending:!1});if(s.error)return h("listings",[],x(s.error,"Subsidiary marketplace is temporarily unavailable."));const i=s.data||[],a=i.map(o=>o.id).filter(Boolean);let r={};if(a.length>0){const o=await e.from("subsidiary_bids").select("*").in("sale_id",a);o.error||(r=(o.data||[]).reduce((c,l)=>(c[l.sale_id]||(c[l.sale_id]=[]),c[l.sale_id].push(l),c),{}))}const n=i.map(o=>({...o,subsidiary_bids:r[o.id]||[]}));return{ok:!0,state:n.length===0?"empty":"ready",listings:n,error:null}}export{E as M,ee as Q,ae as a,Z as b,X as c,te as d,K as e,J as f,re as g,ie as h,se as i,ne as l};
