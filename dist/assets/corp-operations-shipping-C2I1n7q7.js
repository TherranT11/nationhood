const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BVNorCyj.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as _}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{_ as Ln}from"./preload-helper-BXl3LOEh.js";import{escapeHtml as y,hfFmtBig as T}from"./utils-A98FEun4.js";import{initMessaging as zn}from"./messaging-Btjj7Mcp.js";import{c as Rn,g as Yt,E as et,a as bt,b as Ui,d as Pn,e as Dn,f as Ri}from"./equipment-3NlbOnwy.js";import{f as On,a as Bn,l as jn,b as Hn}from"./corp-shipping-data-VcbUDQfr.js";import{p as Fn,m as Un}from"./loan-math-9I6GImoB.js";import{SECTOR_OPS_PAGE as Gi}from"./corp-topbar-BVNorCyj.js";import{r as Qt,c as Vi,M as Wi,a as Gn}from"./shipping-CQiz46tZ.js";import"./government-structure-C17uG6rl.js";const Yi={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},be=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"industry",min:20}]},HIGH:{requirements:[{stat:"industry",min:50},{stat:"education",min:40}]}},priceDrivers:["industry","cost_of_living","workforce"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"industry",min:10}]},STD:{requirements:[{stat:"industry",min:35},{stat:"energy",min:20}]},HIGH:{requirements:[{stat:"industry",min:60},{stat:"energy",min:40},{stat:"education",min:45}]}},priceDrivers:["industry","energy","cost_of_living"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"farmland",min:10}]},STD:{requirements:[{stat:"farmland",min:30},{stat:"infrastructure",min:20}]},HIGH:{requirements:[{stat:"farmland",min:50},{stat:"industry",min:30}]}},priceDrivers:["farmland","infrastructure","cost_of_living"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"energy",min:15},{stat:"infrastructure",min:20}]},HIGH:{requirements:[{stat:"energy",min:35},{stat:"industry",min:25}]}},priceDrivers:["energy","infrastructure","cost_of_living"]},{key:"em_systems",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"industry",min:15}]},STD:{requirements:[{stat:"industry",min:40},{stat:"infrastructure",min:25}]},HIGH:{requirements:[{stat:"industry",min:55},{stat:"infrastructure",min:50},{stat:"energy",min:40}]}},priceDrivers:["industry","infrastructure","cost_of_living","energy"]},{key:"glass_facades",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"industry",min:20}]},STD:{requirements:[{stat:"industry",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"industry",min:60},{stat:"infrastructure",min:40},{stat:"education",min:50}]}},priceDrivers:["industry","standard_of_living","cost_of_living"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"energy",min:10}]},STD:{requirements:[{stat:"energy",min:30},{stat:"industry",min:25}]},HIGH:{requirements:[{stat:"energy",min:45},{stat:"industry",min:40},{stat:"infrastructure",min:40}]}},priceDrivers:["energy","industry","cost_of_living"]},{key:"heavy_parts",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"industry",min:40},{stat:"energy",min:30}]},STD:{requirements:[{stat:"industry",min:60},{stat:"energy",min:45},{stat:"education",min:40}]},HIGH:{requirements:[{stat:"industry",min:75},{stat:"energy",min:60},{stat:"education",min:55},{stat:"infrastructure",min:45}]}},priceDrivers:["industry","energy","education","infrastructure"]}];function Se(t,e,i){const a=be.find(s=>s.key===t);if(!a)return{available:!1,failedStat:"unknown_material"};const n=a.tiers[e];if(!n)return{available:!1,failedStat:"unknown_tier"};for(const s of n.requirements){const r=Number(i?.[s.stat]??0);if(r<s.min)return{available:!1,failedStat:s.stat,failedMin:s.min,nationValue:r}}return{available:!0}}function li(t,e,i){const n={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em_systems:{LOW:400,STD:700,HIGH:1200},glass_facades:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy_parts:{LOW:800,STD:1400,HIGH:2400}}[t]?.[e];if(!n)return 0;const s=be.find(o=>o.key===t);if(!s)return n;let r=1;for(const o of s.priceDrivers){const l=Number(i?.[o]??50);o==="cost_of_living"?r*=1+(l-50)/200:r*=1-(l-50)/250}return r=Math.max(.4,Math.min(2.5,r)),Math.round(n*r)}function Qi(t,e,i){const n={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em_systems:{LOW:1e3,STD:700,HIGH:300},glass_facades:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy_parts:{LOW:400,STD:200,HIGH:80}}[t]?.[e]||0,r=be.find(d=>d.key===t)?.priceDrivers?.[0],l=.3+(r?Number(i?.[r]??50):50)/50*.7;return Math.round(n*l)}const ci=["LOW","STD","HIGH"],Kt={LOW:"Low",STD:"Standard",HIGH:"High"};let Jt=null,Ye=null,dt=[],tt=[];function Ki(t){if(!t)return"";const e=document.createElement("div");return e.textContent=t,e.innerHTML}function ue(t){return Math.abs(t)>=1e9?"$"+(t/1e9).toFixed(1)+"B":Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function Vn(t,e,i){const a=Math.max(0,Number(t)||0),n=Math.max(0,Number(e)||0),s=Math.max(1,Number(i)||1),r=n/100/12;if(r<=0)return Math.round(a/s);const o=a*(r/(1-Math.pow(1+r,-s)));return Math.round(o)}function Wn(t){const e=String(t||"").trim().toLowerCase();return e==="amortized"||e==="amortising"||e==="amortizing"?"amortized":"flat"}function di(t){return Wn(t?.loan_interest_model||t?.interest_model||t?.loan_interest_type)}function Ji(t){const e=String(t?.loan_funding_model||"").trim().toLowerCase();return e==="parent_corp"?"parent_corp":e==="subsidiary_cash"?"subsidiary_cash":null}function Pi(t,e,i,a){const n=Math.max(0,Number(t)||0),s=Math.max(0,Number(e)||0),r=Math.max(1,Number(i)||1),o=Un(n,s);if(a==="amortized"){const c=Vn(n,s,r),m=Fn(c,o),u=Math.max(0,Math.round(c*r-n));return{monthlyPayment:c,month1Interest:o,month1Principal:m,totalInterest:u}}const l=Math.round(n/r),d=Math.round(o+l),v=Math.round(o*r);return{monthlyPayment:d,month1Interest:o,month1Principal:l,totalInterest:v}}async function Yn(t,e,i,a){Jt=t,Ye=e;const n=document.getElementById(i);if(!n)return;const s=e.nation?.id,r=e.faction?.id;if(!s||!r){n.innerHTML='<div style="padding:20px;text-align:center;color:#666;font-size:10px;">No nation data.</div>';return}n.innerHTML='<div style="padding:20px;text-align:center;color:#666;font-family:var(--font-mono,monospace);font-size:10px;">Loading available services...</div>';const[o,l]=await Promise.all([On(t,s),Bn(t,r)]);dt=o,tt=l,Xi(n,a)}function Xi(t,e){const i=dt.filter(o=>o.service_type==="insurance"),a=dt.filter(o=>o.service_type==="loan"),n=tt.filter(o=>o.service_type==="insurance"),s=tt.filter(o=>o.service_type==="loan");let r="";(n.length>0||s.length>0)&&(r+='<div class="cas-section"><div class="cas-section-title">Your Active Policies</div>',r+=n.concat(s).map(o=>Qn(o)).join(""),r+="</div>"),r+='<div class="cas-section"><div class="cas-section-title">Available Insurance</div><div class="cas-section-body">',i.length===0?r+='<div class="cas-empty">No insurance subsidiaries operate in this nation.</div>':r+=i.map(o=>Di(o,"insurance")).join(""),r+="</div></div>",r+='<div class="cas-section"><div class="cas-section-title">Available Credit</div><div class="cas-section-body">',a.length===0?r+='<div class="cas-empty">No banking subsidiaries operate in this nation.</div>':r+=a.map(o=>Di(o,"loan")).join(""),r+="</div></div>",r||(r='<div class="cas-empty">No financial services available in this nation.</div>'),t.innerHTML=`<div class="cas-panel">${r}</div>`,t.addEventListener("click",o=>{const l=o.target.closest("[data-accept-rate]");if(!l)return;const d=l.dataset.acceptRate,v=l.dataset.serviceType;Kn(t,d,v,e)})}function Di(t,e){const i=t.corp_properties?.name||"Unknown Subsidiary",a=e==="insurance",n=a?"#c84":"#5a8aaa",s=a?"INSURANCE":"CREDIT",r=a?"Annual Premium":"Annual Interest",o=di(t),l=Ji(t),d=tt.some(v=>v.rate_id===t.id&&v.status==="active");return`
        <div class="cas-rate-card">
            <div class="cas-rate-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:6px;height:6px;border-radius:50%;background:${n};display:inline-block;"></span>
                    <span style="font-size:11px;font-weight:700;color:#f0efe6;">${Ki(i)}</span>
                    <span class="cas-badge" style="color:${n};border-color:${n}44;background:${n}0a;">${s}</span>
                    ${a?"":`<span class="cas-badge" style="color:#8ab0c7;border-color:#8ab0c744;background:#8ab0c70f;">${o==="amortized"?"AMORTIZED":"FLAT"}</span>`}
                    ${!a&&l?`<span class="cas-badge" style="color:#b9a46a;border-color:#b9a46a44;background:#b9a46a0f;">${l==="parent_corp"?"PARENT FUNDED":"SUB FUNDED"}</span>`:""}
                </div>
                <span style="font-family:monospace;font-size:8px;color:#666;">${t.policies_issued||0} policies issued</span>
            </div>
            <div class="cas-rate-body">
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${r}</span>
                    <span class="cas-rate-value" style="color:${n};font-size:16px;">${t.effective_rate}%</span>
                </div>
                <div class="cas-rate-breakdown">
                    <span>Base: ${t.base_rate}%</span>
                    ${t.markup>0?`<span>+ Markup: ${t.markup}%</span>`:""}
                </div>
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${a?"Max Coverage":"Max Loan"}</span>
                    <span class="cas-rate-value">${ue(t.coverage_limit||0)}</span>
                </div>
                ${a?`<div class="cas-rate-row">
                    <span class="cas-rate-label">Deductible</span>
                    <span class="cas-rate-value">${t.deductible_pct||10}%</span>
                </div>`:""}
                <div class="cas-rate-row">
                    <span class="cas-rate-label">Term</span>
                    <span class="cas-rate-value">${t.min_term_months}-${t.max_term_months} months</span>
                </div>
            </div>
            <div class="cas-rate-footer">
                ${d?'<span style="font-family:monospace;font-size:8px;font-weight:700;color:#5cb85c;">✓ ACTIVE POLICY</span>':`<button class="cas-accept-btn" data-accept-rate="${t.id}" data-service-type="${e}" style="border-color:${n};color:${n};">Accept ${a?"Coverage":"Terms"}</button>`}
            </div>
        </div>
    `}function Qn(t){const e=t.service_type==="insurance",i=e?"#c84":"#5a8aaa",a=t.status==="active"?"#5cb85c":t.status==="lapsed"?"#d9534f":"#666",n=di(t),s=Ji(t);return`
        <div class="cas-policy-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="cas-badge" style="color:${i};border-color:${i}44;background:${i}0a;">${e?"INSURANCE":"LOAN"}</span>
                    <span style="font-size:10px;font-weight:600;color:#c4c2b8;">${t.rate_at_issue}% rate</span>
                    ${e?"":`<span class="cas-badge" style="color:#8ab0c7;border-color:#8ab0c744;background:#8ab0c70f;">${n==="amortized"?"AMORTIZED":"FLAT"}</span>`}
                    ${!e&&s?`<span class="cas-badge" style="color:#b9a46a;border-color:#b9a46a44;background:#b9a46a0f;">${s==="parent_corp"?"PARENT FUNDED":"SUB FUNDED"}</span>`:""}
                </div>
                <span class="cas-badge" style="color:${a};border-color:${a}44;background:${a}0a;">${t.status.toUpperCase()}</span>
            </div>
            <div style="display:flex;gap:12px;margin-top:6px;font-family:monospace;font-size:8px;color:#888;">
                <span>${e?"Premium":"Payment"}: ${ue(t.monthly_payment)}/mo</span>
                <span>Paid: ${ue(t.total_paid)}</span>
                <span>${t.payments_made} payments</span>
            </div>
        </div>
    `}let qt=!1;function Kn(t,e,i,a){const n=dt.find(u=>u.id===e);if(!n)return;const s=i==="insurance",r=s?"#c84":"#5a8aaa",o=n.corp_properties?.name||"Unknown",l=n.coverage_limit||0,d=di(n);let v=document.getElementById("cas-accept-overlay");v||(v=document.createElement("div"),v.id="cas-accept-overlay",v.className="cas-overlay",document.body.appendChild(v)),v.innerHTML=`
        <div class="cas-modal">
            <div class="cas-modal-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:7px;height:7px;border-radius:50%;background:${r};display:inline-block;"></span>
                    <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;">Accept ${s?"Insurance":"Loan"}</span>
                </div>
                <span class="cas-modal-close" id="cas-close">&times;</span>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:${r}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${r};display:inline-block;"></span>
                <span style="font-family:monospace;font-size:9px;color:#888;">Provider:</span>
                <span style="font-family:monospace;font-size:9px;font-weight:700;color:${r};">${Ki(o)}</span>
            </div>
            <div style="padding:16px;display:flex;flex-direction:column;gap:14px;">
                <div>
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${s?"Coverage Amount":"Loan Amount"}</div>
                    <input type="number" id="cas-amount" placeholder="Enter amount" max="${l}" style="width:100%;padding:7px 10px;font-family:monospace;font-size:13px;color:#f0efe6;background:#1c1c18;border:1px solid rgba(255,255,255,0.08);outline:none;box-sizing:border-box;">
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;margin-top:3px;">Max: ${ue(l)}</div>
                </div>
                <div>
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Term (months)</div>
                    <input type="number" id="cas-term" value="${n.min_term_months}" min="${n.min_term_months}" max="${n.max_term_months}" style="width:120px;padding:7px 10px;font-family:monospace;font-size:13px;color:#f0efe6;background:#1c1c18;border:1px solid rgba(255,255,255,0.08);outline:none;text-align:center;">
                    <span style="font-family:monospace;font-size:8px;color:#4a4940;margin-left:8px;">${n.min_term_months}-${n.max_term_months} months</span>
                </div>
                <div style="padding:8px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">TERMS SUMMARY</div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Rate</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:${r};">${n.effective_rate}%</span>
                    </div>
                    ${s?`<div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Deductible</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:#c4c2b8;">${n.deductible_pct}%</span>
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
                <button class="cas-btn cas-btn--submit" id="cas-submit" disabled style="background:${r};">Accept</button>
            </div>
        </div>
    `,v.classList.add("active");const c=()=>{v.classList.remove("active")};document.getElementById("cas-close")?.addEventListener("click",c),document.getElementById("cas-cancel")?.addEventListener("click",c),v.addEventListener("click",u=>{u.target===v&&c()});const m=()=>{const u=Number(document.getElementById("cas-amount")?.value)||0,g=Number(document.getElementById("cas-term")?.value)||n.min_term_months,b=document.getElementById("cas-monthly"),p=document.getElementById("cas-month1-interest"),h=document.getElementById("cas-month1-principal"),x=document.getElementById("cas-total-interest"),$=document.getElementById("cas-submit");if(u>0&&g>0){let C;if(s)C=Math.round(u*n.effective_rate/100/12);else{const E=Pi(u,n.effective_rate,g,d);C=E.monthlyPayment,p&&(p.textContent=ue(E.month1Interest)),h&&(h.textContent=ue(E.month1Principal)),x&&(x.textContent=ue(E.totalInterest))}b&&(b.textContent=ue(C)),$&&($.disabled=u<=0||u>l)}else b&&(b.textContent="—"),p&&(p.textContent="—"),h&&(h.textContent="—"),x&&(x.textContent="—"),$&&($.disabled=!0)};document.getElementById("cas-amount")?.addEventListener("input",m),document.getElementById("cas-term")?.addEventListener("input",m),document.getElementById("cas-submit")?.addEventListener("click",async()=>{if(qt)return;qt=!0;const u=document.getElementById("cas-submit");u&&(u.disabled=!0,u.textContent="Processing...");try{const g=Number(document.getElementById("cas-amount")?.value)||0,b=Number(document.getElementById("cas-term")?.value)||n.min_term_months;if(g<=0||g>l)return;const p=Ye.shard?.current_tick||0;let h;s?h=Math.round(g*n.effective_rate/100/12):h=Pi(g,n.effective_rate,b,d).monthlyPayment;const{data:x,error:$}=await Jt.rpc("accept_subsidiary_auto_policy_txn",{p_rate_id:n.id,p_borrower_faction_id:Ye.faction?.id,p_principal:g,p_term_months:b,p_monthly_payment:h,p_started_tick:p,p_expires_tick:p+b});if($){console.error("[AutoServices] Accept failed:",$.message),alert("Failed: "+$.message);return}tt.push(x),n.policies_issued=(n.policies_issued||0)+1;try{const C=Ye.faction?.faction_name||"A corporation",E=n.corp_properties?.name||"a financial institution",w=n.nation_id||Ye.faction?.nation_id;w&&await Jt.from("event_log").insert({nation_id:w,event_name:s?"Insurance Policy Issued":"Loan Agreement Signed",category:"corporate",description_chosen:s?`${C} has secured an insurance policy with ${E}.`:`${C} has just agreed to terms on a substantial loan with ${E}.`,fired_at_tick:p})}catch{}c(),Xi(t,a)}catch(g){console.error("[AutoServices] Accept error:",g),alert("An error occurred.")}finally{qt=!1,u&&(u.disabled=!1,u.textContent="Accept")}})}const pt={Coastal:{capacity_dwt:14e3,capacity_unit:"DWT",base_maintenance:9e4,fuel_capacity:800,purchase_price:3e6},Container:{capacity_dwt:4800,capacity_unit:"TEU",base_maintenance:145e3,fuel_capacity:2100,purchase_price:65e6},Bulk:{capacity_dwt:28e3,capacity_unit:"DWT",base_maintenance:175e3,fuel_capacity:1800,purchase_price:3e6},Tanker:{capacity_dwt:42e3,capacity_unit:"DWT",base_maintenance:19e4,fuel_capacity:2400,purchase_price:53e6},Reefer:{capacity_dwt:12e3,capacity_unit:"DWT",base_maintenance:14e4,fuel_capacity:1600,purchase_price:6e6},LNG:{capacity_dwt:18e3,capacity_unit:"DWT",base_maintenance:29e4,fuel_capacity:1400,purchase_price:78e6}};let ke=[],f=null,R=null,N=null,je=[],Ve={},Q=[],J={},Xt=-1;const Jn={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},ft=t=>Jn[t]||t;let oe="concrete",K="STD",me=500,ie=[],Zi={},Zt=0,en=[];async function Xn(){if(!f?.id)return;const{data:t}=await _.from("corp_properties").select("*").eq("faction_id",f.id).eq("is_active",!0);en=t||[]}let ne=[],tn=[],it=null,Qe={},mt={},pi=[],vt=null,se="trucks",ye=0,ge=1,Ee=[],Ae=null,nn=[],ei=null,lt=null,ti="ALL",ii="TIMELINE";function A(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function Zn(t){if(t>=12){const e=Math.floor(t/12),i=t%12;return i>0?e+"y "+i+"mo":e+"y"}return t+" ticks"}function an(t){return!t||t.length===0?"":t.map(e=>{const i=Zi[e];if(!i)return"";const a=i.reputation_bonus>0?"var(--green)":i.reputation_bonus<0?"var(--red)":"var(--text-dim)",n=i.reputation_bonus>0?"+"+i.reputation_bonus:i.reputation_bonus<0?String(i.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background: var(--border-hair);border:1px solid var(--border-0);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${i.icon||"📍"} ${y(i.name)}${n?` <span style="color:${a};font-weight:700;">${n} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function re(t){return Math.abs(t)>=1e9?"$"+(t/1e9).toFixed(1)+"B":Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(0)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function fi(t){return t==="civil_engineering"?"CIVIL":t==="industrial"?"INDUSTRIAL":t==="mega_project"?"MEGA":t?.toUpperCase()||"—"}function on(t){return t==="civil_engineering"?"light":t==="industrial"?"heavy":t==="mega_project"?"mega":"light"}function ea(){lt&&clearInterval(lt),lt=setInterval(()=>{if(!ei)return;const t=ei-Date.now();if(t<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(lt);return}const e=Math.floor(t/36e5),i=Math.floor(t%36e5/6e4),a=Math.floor(t%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+i+"m "+a+"s"},1e3)}function ta(t,e){t==="type"&&(ti=e),t==="sort"&&(ii=e),document.querySelectorAll(`.filter-pill[data-filter="${t}"]`).forEach(i=>{i.classList.toggle("active",i.dataset.value===e)}),rn()}const Oi={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function sn(t){if(!f)return!1;if(Oi[f.corp_subsector]===t.sector)return!0;const i=(en||[]).filter(a=>a.type==="regional_hq"&&a.is_active&&a.nation_id===t.nation_id);for(const a of i)if(Oi[a.subsector]===t.sector)return!0;return!1}function rn(){const t=document.getElementById("oc-list");let e=[...je];if(ti==="GOVERNMENT"?e=e.filter(n=>n.issuer_type==="GOVERNMENT"):ti==="PRIVATE"&&(e=e.filter(n=>n.issuer_type==="PRIVATE")),ii==="TIMELINE"&&e.sort((n,s)=>(n.timeline_ticks||0)-(s.timeline_ticks||0)),ii==="BUDGET"&&e.sort((n,s)=>(s.budget_ceiling||0)-(n.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){t.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const i=N?.current_tick||0;let a="";for(const n of e){const s=n.issuer_type==="GOVERNMENT",r=s?"gov":"private",o=sn(n),l=o?"":" locked",d=on(n.sector),v=fi(n.sector),c=(n.timeline_ticks||0)>18?" warn":"",m=n.bidding_ends_tick?Math.max(0,n.bidding_ends_tick-i):"?";a+=`
            <div class="oc-item${l}" data-contract-id="${n.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${y(n.name)}</span>
                    <span class="oc-item__type-badge ${r}">${s?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${r}">${y(n.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${m} tick${m!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${re(n.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${c}">${Zn(n.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${d}">${v}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${Ve[n.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${re(Ve[n.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${o?"yes":"no"}">${o?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${o?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${n.id}'))">VIEW</button>`:""}
                </div>
                ${n.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${y(n.description)}</div>`:""}
                ${n.modifiers&&n.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${an(n.modifiers)}</div>`:""}
            </div>`}t.innerHTML=a,t.querySelectorAll(".oc-item:not(.locked)").forEach(n=>{n.addEventListener("click",()=>{const s=n.dataset.contractId,r=je.find(o=>o.id===s);r&&ln(r)})})}let Me=null;function ln(t){Me=t;const e=document.getElementById("cd-overlay"),i=t.issuer_type==="GOVERNMENT",a=i?"gov":"private",n=(R?.name||f.nation||"—").toUpperCase(),s=sn(t);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${y(n)}</span>
        <span class="cd-header__name">${y(t.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${a}">${y(t.issuer_name)}</span>
        <span class="cd-header__type-badge ${a}">${i?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");t.blueprint_svg?(r.innerHTML=t.blueprint_svg,r.style.display=""):(r.innerHTML=_a(t),r.style.display="");const o=t.permits_required||[],l=t.required_equipment||t.equipment_required||{},d=Array.isArray(l)?l.map(k=>({key:k,qty:1})):Object.entries(l).map(([k,q])=>({key:k,qty:q})),v=t.required_materials||t.materials_estimated||{},m={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[t.sector]||t.spec_category||t.sector||"—";let u="var(--teal)";t.sector==="industrial"&&(u="var(--orange)"),t.sector==="mega_project"&&(u="var(--red)");let g=A(t.budget_ceiling||t.budget||0),b=(t.timeline_ticks||t.timeline_months||0)+" Months",p="";p+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${y(t.project_code||t.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${t.project_type?`<span class="cd-tag teal">${y(t.project_type.toUpperCase())}</span>`:""}
                ${t.project_subtype?`<span class="cd-tag gold">${y(t.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,t.description&&(p+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${y(t.description)}</div>
            </div>`);const h=t.modifiers||[];if(h.length>0){p+=`<div class="cd-items">
            <div class="cd-section-label">Building Modifiers</div>
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const k of h){const q=Zi[k];if(!q)continue;const B=q.reputation_bonus>0?"var(--green)":q.reputation_bonus<0?"var(--red)":"var(--text-dim)",U=q.cost_multiplier>1?"+"+Math.round((q.cost_multiplier-1)*100)+"% cost":q.cost_multiplier<1?Math.round((1-q.cost_multiplier)*100)+"% cheaper":"",X=q.reputation_bonus!==0?(q.reputation_bonus>0?"+":"")+q.reputation_bonus+" rep":"",pe=q.required_permits||[];p+=`<div style="padding:6px 10px;background: var(--border-hair);border:1px solid var(--border-hair);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${q.icon||"📍"} ${y(q.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${U?`<span style="color:var(--amber);">${U}</span>`:""}
                        ${U&&X?" · ":""}
                        ${X?`<span style="color:${B};font-weight:700;">${X}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${y(q.description||"")}</div>
                ${pe.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${pe.map(G=>y(G.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}p+="</div></div>"}p+='<div class="cd-details">',t.project_type&&(p+=we("Type",t.project_type)),t.project_subtype&&(p+=we("Sub-Type",t.project_subtype)),p+=we("Specialization",m,u),p+=we("Total Budget",g,"var(--green)"),p+=we("Timeline",b),p+=we("Nation",R?.name||f.nation||"—"),t.region&&(p+=we("Region",t.region)),p+="</div>",o.length>0&&(p+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${o.map(k=>{const q=k.status==="approved"?"approved":"required",B=k.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${q}">
                            <span class="cd-chip__icon">${B}</span>
                            <span class="cd-chip__label">${y(k.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),v.length>0&&(p+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${v.map(k=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${y(k.name)}</span>
                        <span class="cd-mat-row__qty">${y(String(k.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=p;const x=o.filter(k=>k.status==="approved").length,$=o.length-x,C=d.length,E=[];for(const k of d){const q=ie.find(B=>B.equipment_key===k.key);q&&q.owned>=k.qty||E.push(k)}const w=E.length,I=t.required_materials||{},L=typeof I=="object"&&!Array.isArray(I)?Object.entries(I):[],M=[];for(const[k,q]of L){const B=J[k]||{},U=(B.LOW?.qty||0)+(B.STD?.qty||0)+(B.HIGH?.qty||0);U<q&&M.push({key:k,need:q,have:U})}const j=k=>k.replace(/_/g," ").replace(/\b\w/g,q=>q.toUpperCase());let D="";if(C>0)if(w===0)D+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const k=E.map(q=>j(q.key)).join(", ");D+=`<span class="cd-footer__badge bad" title="${y(k)}">${w} SHORT: ${y(k)}</span>`}if(L.length>0)if(M.length===0)D+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const k=M.map(q=>j(q.key)+" ("+q.have+"/"+q.need+")").join(", ");D+=`<span class="cd-footer__badge bad" title="${y(k)}">${M.length} MAT SHORT: ${y(k)}</span>`}o.length>0&&($===0?D+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':D+=`<span class="cd-footer__badge warn">${$} PERMITS PENDING</span>`);const S=s,z=t.issuer_faction_id===f?.id,H=t.status==="bidding",F=Ve[t.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${D}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${z?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${H?"":"disabled"} title="${H?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:F?`<button class="cd-btn primary" onclick="retractBid('${t.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${S?"":"disabled"}
                        title="${S?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function st(t){t&&t.target&&t.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Me=null)}const le=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],Bi={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},ji={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let P=null;async function De(t){const e=Q.find(k=>k.id===t);if(!e)return;const i=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,a=N?.current_tick||0,n=e.awarded_at_tick||a,s=e.timeline_ticks||8,r=Math.max(0,a-n),o=Math.min(100,r/s*100);let l=Math.min(le.length-1,Math.floor(o/(100/le.length)));const d=Math.round(o%(100/le.length)/(100/le.length)*100),v=e.required_materials||{},c=i?.material_grades||{};let m=[];try{const{data:k}=await _.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);m=k||[]}catch{}const u={};for(const k of m)u[k.material_key]||(u[k.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),u[k.material_key].totalAllocated+=k.quantity,u[k.material_key].totalConsumed+=k.consumed,u[k.material_key].tiers[k.quality_tier]={qty:k.quantity,consumed:k.consumed};const g=Object.entries(v).map(([k,q])=>{const B=c[k]||"STD",U=u[k]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:k,name:k.replace(/_/g," ").replace(/\b\w/g,X=>X.toUpperCase()),grade:B,required:Number(q),allocated:U.totalAllocated,consumed:U.totalConsumed,tiers:U.tiers,warehouseStock:J[k]||{}}}),b=e.required_equipment||{},p=e.equipment_condition||{},x=(Array.isArray(b)?b.map(k=>[k,1]):Object.entries(b)).map(([k,q])=>{const B=ie.find(G=>G.equipment_key===k),X=(B?.assigned_projects||[]).find(G=>G.contract_id===e.id),pe=X?X.units:0;return{key:k,name:k.replace(/_/g," ").replace(/\b\w/g,G=>G.toUpperCase()),required:Number(q)||1,ownedTotal:B?.owned||0,deployed:B?.deployed||0,available:Math.max(0,(B?.owned||0)-(B?.deployed||0)),assignedToProject:pe,condition:p[k]??(B?.condition||100)}}),$=e.budget_ceiling||0,C=i?.estimated_cost||0,E=Math.round(C*Math.min(1,r/s)),w=i?.estimated_quality||65,I=w>=75?"EXCELLENT":w>=50?"FAIR":w>=25?"POOR":"BAD",L=e.required_workforce||{},M=e.workers_assigned||{},j=(L.general||0)+(L.skilled||0)+(L.innovative||0),D=(M.general||0)+(M.skilled||0)+(M.innovative||0),S=i?.labor_count||j,z=Number(f?.corp_general_workforce??0),H=Number(f?.corp_skilled_workforce??0),F=Number(f?.corp_innovative_workforce??0);P={project:e,bid:i,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:a,awardedTick:n,totalTicks:s,ticksElapsed:r,phaseIdx:l,phaseProgress:d,materials:g,equipment:x,budget:$,estCost:C,spent:E,quality:w,qualityLabel:I,laborCount:S,wfNeeded:j,wfAssigned:D,reqWf:L,assignedWf:M,corpGeneral:z,corpSkilled:H,corpInnovative:F,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",cn(e.id).then(()=>ze()),ze()}let V=!1;async function ia(t,e,i){if(!(V||!P||!f)){V=!0;try{const{data:a,error:n}=await _.rpc("allocate_material_to_project",{p_contract_id:P.project.id,p_faction_id:f.id,p_material_key:t,p_quality_tier:e,p_quantity:i});if(n){alert("Allocation failed: "+n.message);return}if(a&&!a.success){alert(a.error||"Allocation failed");return}await pn(),await De(P.project.id)}catch(a){alert("Allocation error: "+a.message)}finally{V=!1}}}async function na(t,e,i){if(!(V||!P||!f)){V=!0;try{const{data:a,error:n}=await _.rpc("deallocate_material_from_project",{p_contract_id:P.project.id,p_faction_id:f.id,p_material_key:t,p_quality_tier:e,p_quantity:i});if(n){alert("Return failed: "+n.message);return}if(a&&!a.success){alert(a.error||"Return failed");return}await pn(),await De(P.project.id)}catch(a){alert("Return error: "+a.message)}finally{V=!1}}}async function aa(t,e){if(!(V||!P||!f)){V=!0;try{const i=P.project,a=i.workers_assigned||{},n=Number(a[t]||0),s=Number((i.required_workforce||{})[t]||0),r=Number(f?.["corp_"+t+"_workforce"]??0);let o=0;for(const u of Q||[])u.id!==i.id&&(o+=Number((u.workers_assigned||{})[t]||0));const l=Math.max(0,r-o-n),d=Math.min(e,s-n,l);if(d<=0){alert(l<=0?"No "+t+" workers available in pool":"Already fully staffed for "+t);return}const v={...a,[t]:n+d},{error:c}=await _.from("construction_contracts").update({workers_assigned:v}).eq("id",i.id);if(c){alert("Assign failed: "+c.message);return}const m=Q.find(u=>u.id===i.id);m&&(m.workers_assigned=v),await De(i.id)}catch(i){alert("Assign error: "+i.message)}finally{V=!1}}}async function oa(t,e){if(!(V||!P||!f)){V=!0;try{const i=P.project,a=i.workers_assigned||{},n=Number(a[t]||0),s=Math.min(e,n);if(s<=0){alert("No "+t+" assigned");return}const r={...a,[t]:n-s},{error:o}=await _.from("construction_contracts").update({workers_assigned:r}).eq("id",i.id);if(o){alert("Unassign failed: "+o.message);return}const l=Q.find(d=>d.id===i.id);l&&(l.workers_assigned=r),await De(i.id)}catch(i){alert("Unassign error: "+i.message)}finally{V=!1}}}async function sa(t,e){if(!(V||!P||!f)){V=!0;try{const i=ie.find(l=>l.equipment_key===t);if(!i){alert("Equipment not found in inventory.");return}const a=Math.max(0,(i.owned||0)-(i.deployed||0));if(a<e){alert("Not enough available "+t+" ("+a+" available).");return}const n=(i.deployed||0)+e,s=[...i.assigned_projects||[]],r=s.find(l=>l.contract_id===P.project.id);r?r.units+=e:s.push({contract_id:P.project.id,contract_name:P.project.name,units:e});const{error:o}=await _.from("corp_equipment").update({deployed:n,assigned_projects:s}).eq("faction_id",f.id).eq("equipment_key",i.equipment_key);if(o){alert("Deploy failed: "+o.message);return}await xn(),await De(P.project.id)}catch(i){alert("Deploy error: "+i.message)}finally{V=!1}}}async function ra(t){if(!(V||!P||!f)){V=!0;try{const e=ie.find(o=>o.equipment_key===t);if(!e){alert("Equipment not found.");return}const i=[...e.assigned_projects||[]],a=i.findIndex(o=>o.contract_id===P.project.id);if(a===-1){alert("Equipment not deployed to this project.");return}const n=i[a].units;i.splice(a,1);const s=Math.max(0,(e.deployed||0)-n),{error:r}=await _.from("corp_equipment").update({deployed:s,assigned_projects:i}).eq("faction_id",f.id).eq("equipment_key",e.equipment_key);if(r){alert("Undeploy failed: "+r.message);return}await xn(),await De(P.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{V=!1}}}function la(t){t&&t.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",P=null)}function ca(t){P&&(P.tab=t,P.expandedEvent=-1,P.selectedResponse=null,ze())}function da(t){P&&(P.expandedEvent=P.expandedEvent===t?-1:t,P.selectedResponse=null,ze())}function pa(t){P&&(P.selectedResponse=P.selectedResponse===t?null:t,ze())}function ze(){if(!P)return;const t=P,e=t.project,i=e.issuer_type==="GOVERNMENT",a=fi(e.sector),n=f?.nation||"Nation",s=t.awardedTick+t.totalTicks,r=Math.max(0,s-t.currentTick),o=t.currentTick>s,l=t.budget>0?Math.round(t.spent/t.budget*100):0,d=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",v=t.budget-t.spent,c=t.events.filter(p=>p.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${y(n.toUpperCase())}</span>
                <span class="pm-hdr__name">${y(e.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${y(e.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${i?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${y(e.template_key||e.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${y(a.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${y((e.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let m='<div class="pm-phase__bar">';for(let p=0;p<le.length;p++){const h=p<t.phaseIdx,x=p===t.phaseIdx;m+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${h?"done":x?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${h?"done":x?"active":""}">${le[p]}</span>
        </div>`}m+="</div>",m+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${le[t.phaseIdx]} — ${t.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${o?"var(--red)":"var(--text-secondary)"}">Tick ${t.ticksElapsed} / ${t.totalTicks}${o?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=m;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:c},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map(p=>`<button class="pm-tab${t.tab===p.id?" active":""}" onclick="pmSetTab('${p.id}')">
            ${p.label}${p.badge>0?`<span class="pm-tab__badge">${p.badge}</span>`:""}
        </button>`).join("");let g="";t.tab==="overview"?g=fa(t,e,d,l,v,r,o):t.tab==="events"?g=ma(t):t.tab==="materials"?g=va(t):t.tab==="equipment"&&(g=ua(t)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${g}</div>`;let b="";c>0&&(b+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${c} EVENT${c>1?"S":""} REQUIRES RESPONSE</span>`),b+=`<span class="pm-ftr__badge" style="color:${t.quality>=75?"var(--green)":t.quality>=50?"var(--amber)":t.quality>=25?"var(--orange)":"var(--red)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${t.quality}/100 — ${t.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${b}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function fa(t,e,i,a,n,s,r){const o=Ce(t.awardedTick+t.totalTicks);Ce(t.awardedTick+t.totalTicks);const l=Ce(t.awardedTick),d=[{label:"Budget",value:re(t.budget),sub:`${a}% spent`,color:i},{label:"Spent",value:re(t.spent),color:"var(--red)"},{label:"Remaining",value:re(n),color:"var(--green)"},{label:"Quality",value:`${t.quality}/100`,sub:t.qualityLabel,color:t.quality>=75?"var(--green)":t.quality>=50?"var(--amber)":t.quality>=25?"var(--orange)":"var(--red)"},{label:"Workforce",value:`${t.laborCount}/${t.wfNeeded}`,sub:`Bid: ${t.laborCount}`,color:t.laborCount<t.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${s} ticks`,sub:r?"OVERDUE":`Deadline: ${o}`,color:r?"var(--red)":"var(--text-bright)"}];let v="";v+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${y(e.description||e.name)}</div>
    </div></div>`,v+='<div class="pm-metrics">';for(const p of d)v+=`<div class="pm-metric">
            <div class="pm-metric__label">${p.label}</div>
            <div class="pm-metric__value" style="color:${p.color}">${p.value}</div>
            ${p.sub?`<div class="pm-metric__sub">${y(p.sub)}</div>`:""}
        </div>`;v+="</div>",v+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${o}</span></span>
        </div>
    </div></div>`;const c=e.modifiers||[];c.length>0&&(v+='<div style="padding:0 16px"><div class="pm-section">',v+='<div class="pm-section__title">Building Modifiers</div>',v+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',v+=an(c),v+="</div></div></div>");const m=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(m.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),m.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&m.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),m.length>0){v+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const p of m)v+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${y(p.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;v+="</div></div>"}v+='<div style="padding:0 16px"><div class="pm-section">',v+='<div class="pm-section__title">Workforce Assignment</div>';const u=[{key:"general",label:"General Workers",corpAvail:t.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:t.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:t.corpInnovative,color:"var(--purple)"}];for(const p of u){const h=Number(t.reqWf[p.key]||0);if(h===0)continue;const x=Number(t.assignedWf[p.key]||0),C=x>=h?"var(--green)":x>0?"var(--amber)":"var(--red)",E=p.corpAvail>0&&x<h,w=Math.min(p.corpAvail,h-x),I=x>0;v+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-hair);font-size:0.72rem;">',v+="<div>",v+=`<span style="color:${p.color};font-weight:600;">${p.label}</span>`,v+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${h}</strong></span>`,v+=`<span style="color:${C};margin-left:8px;font-weight:700;">${x} assigned</span>`,v+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${p.corpAvail}</span>`,v+="</div>",v+='<div style="display:flex;gap:4px;">',E&&(v+=`<button onclick="pmAssignWorkers('${p.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${w}</button>`),I&&(v+=`<button onclick="pmUnassignWorkers('${p.key}',${x})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${x}</button>`),v+="</div></div>"}const g=Number(t.reqWf.general||0)+Number(t.reqWf.skilled||0)+Number(t.reqWf.innovative||0),b=Number(t.assignedWf.general||0)+Number(t.assignedWf.skilled||0)+Number(t.assignedWf.innovative||0);return g>0&&b<g&&(v+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),v+="</div></div>",v}function ma(t){if(t.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let i=0;i<t.events.length;i++){const a=t.events[i],n=t.expandedEvent===i,s=a.status==="ACTIVE",r=Bi[a.type]||Bi.WEATHER,o=ji[a.severity]||ji.LOW;if(e+=`<div class="pm-evt ${s?"pm-evt--active":"pm-evt--resolved"}" style="${s?`border-left-color:${r.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${i})" style="${n?`background:${r.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${a.type}</span>
            <span class="pm-evt__sev-badge" style="color:${o}">${a.severity}</span>
            <span class="pm-evt__status" style="color:${s?"var(--red)":"var(--text-dim)"};font-weight:${s?"700":"400"}">${s?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${y(a.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${a.tick} · ${y(a.id||"")}</div>`,n){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${y(a.desc)}</div>`,a.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${y(a.impact)}</span>
                </div>`),s&&a.responses&&a.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<a.responses.length;l++){const d=a.responses[l],v=t.selectedResponse===l,m={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[d.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${v?" selected":""}" style="${v?`border-color:${m}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${y(d.label)}</span>
                            <span class="pm-resp__tag" style="color:${m};background:${m}12;border:1px solid ${m}25">${d.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${d.delay>0?"var(--orange)":"var(--green)"}">
                            ${d.delay>0?`+${d.delay} tick${d.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${y(d.detail)}</div>`,e+='<div class="pm-resp__costs">',d.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${re(d.cost)}</span>`),d.qualityImpact&&d.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${d.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${d.qualityImpact>0?"+":""}${d.qualityImpact}</span>`),!d.cost&&(!d.qualityImpact||d.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",v&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${m}" onclick="event.stopPropagation();confirmEventResponse('${a.id}','${d.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!s&&a.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${y(a.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function va(t){if(t.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const i of t.materials){const a=i.required>0?Math.round(i.allocated/i.required*100):0;i.allocated>0&&Math.round(i.consumed/i.allocated*100);const n=i.allocated>=i.required,s=n?"var(--green)":i.allocated>0?"var(--amber)":"var(--red)",r=n?"FULLY ALLOCATED":i.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${y(i.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${s};">${i.allocated} / ${i.required} allocated · ${r}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${a}%;background:${s};"></div></div>
            <span class="pm-mat__pct">${i.consumed} consumed</span>
        </div>`;const o=["STD","LOW","HIGH"],l=i.required-i.allocated;for(const d of o){const v=i.warehouseStock[d]||{qty:0},c=i.tiers[d]||{qty:0,consumed:0},m=c.qty-c.consumed;if(v.qty===0&&c.qty===0)continue;const u=d==="HIGH"?"var(--green)":d==="LOW"?"var(--orange)":"var(--text-muted)",g=d==="HIGH"?"HIGH":d==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-hair);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${u};width:32px;">${g}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${v.qty}</strong></span>`,c.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${c.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',v.qty>0&&l>0){const b=Math.min(v.qty,l);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${i.key}','${d}',${b})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${b}</button>`}m>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${i.key}','${d}',${m})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${m}</button>`),e+="</div></div>"}e+="</div>"}return e}function ua(t){if(t.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const i of t.equipment){const a=i.condition>=75?"var(--green)":i.condition>=50?"var(--amber)":i.condition>=25?"var(--orange)":"var(--red)",n=i.assignedToProject>=i.required,s=i.assignedToProject>0&&i.assignedToProject<i.required,r=n?"var(--green)":s||i.ownedTotal>0?"var(--amber)":"var(--red)",o=n?`${i.assignedToProject}/${i.required} DEPLOYED`:s?`${i.assignedToProject}/${i.required} PARTIAL`:i.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${y(i.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${r};margin-left:8px;">${o}</span>
                </div>
            </div>`,i.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${i.condition}%;background:${a}"></div></div>
                <span class="pm-eq__cond-val" style="color:${a}">${i.condition}%</span>
            </div>`);const l=Math.min(i.available,i.required-i.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${n?"var(--green)":"var(--red)"}">${i.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${i.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${i.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',l>0&&(e+=`<button onclick="pmDeployEquipment('${i.key}',${l})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${l}</button>`),i.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${i.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function Ce(t){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][t%12]}, ${2e3+Math.floor(t/12)}`}async function ya(t,e){if(!f||!N)return;const i=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(i===null)return;const a=i.trim()||"Construction Insurance",n=N.current_tick||0,{error:s}=await _.from("finance_loan_requests").insert({requesting_faction_id:f.id,nation_id:f.nation_id,request_type:"insurance",insured_contract_id:t,amount:e,term_months:0,purpose:a,status:"open",created_tick:n,expires_tick:n+12});if(s){s.message.includes("duplicate")||s.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+s.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await dn()}window.requestInsurance=ya;window.openProjectModal=De;window.closeProjectModal=la;window.pmSetTab=ca;window.pmToggleEvent=da;window.pmSelectResponse=pa;window.pmAllocateMaterial=ia;window.pmDeallocateMaterial=na;window.pmDeployEquipment=sa;window.pmUndeployEquipment=ra;window.pmAssignWorkers=aa;window.pmUnassignWorkers=oa;async function cn(t){if(!P)return;const{data:e,error:i}=await _.from("construction_events").select("*").eq("contract_id",t).order("fired_at_tick",{ascending:!1});i?(console.warn("Failed to load project events:",i.message),P.events=[]):P.events=(e||[]).map(a=>({id:a.id,type:a.type,severity:a.severity,tick:a.fired_at_tick,title:a.title,desc:a.description,impact:a.impact,status:a.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:a.resolution,responses:a.responses||[]})),ze()}let Nt=!1;async function ga(t,e){if(!(Nt||!P)){Nt=!0;try{const{data:i,error:a}=await _.rpc("resolve_construction_event",{p_event_id:t,p_response_key:e});if(a){console.error("Failed to resolve event:",a.message),alert("Failed to submit response: "+a.message);return}const n=typeof i=="string"?JSON.parse(i):i;if(n?.error){alert("Error: "+n.error);return}await cn(P.project.id),await dn(),n?.quality_applied&&n.quality_applied!==0&&(P.quality=Math.max(0,Math.min(100,P.quality+n.quality_applied)),P.qualityLabel=P.quality>=75?"EXCELLENT":P.quality>=50?"FAIR":P.quality>=25?"POOR":"BAD"),ze()}finally{Nt=!1}}}window.confirmEventResponse=ga;function we(t,e,i){const a=i?` style="color:${i}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${y(t)}</span>
        <span class="cd-detail-row__value"${a}>${y(e)}</span>
    </div>`}function _a(t){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},i=t.drawing_number||t.contract_number+"-A1",a=N?.current_date||"",n=a?a.replace(/,\s*/," "):"",s=t.spec_category==="Heavy Infrastructure",r=t.spec_category==="Megaproject";let o=y(t.project_subtype||t.project_type||"STRUCTURE"),l=s?"80.0m":r?"200.0m":"60.0m",d=s?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(v,c)=>`<line x1="${c*20}" y1="0" x2="${c*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(v,c)=>`<line x1="0" y1="${c*20}" x2="680" y2="${c*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${o.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${e.text}" font-family="var(--font-mono)">${y(t.name)}</text>

        <!-- Internal divisions -->
        <line x1="200" y1="30" x2="200" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="340" y1="30" x2="340" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="480" y1="30" x2="480" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="60" y1="90" x2="620" y2="90" stroke="${e.line}" stroke-width="0.4" stroke-dasharray="4,2"/>

        <!-- Dimension: top -->
        <line x1="60" y1="20" x2="620" y2="20" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="60" y1="17" x2="60" y2="23" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="620" y1="17" x2="620" y2="23" stroke="${e.dim}" stroke-width="0.5"/>
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)">${l}</text>

        <!-- Dimension: right -->
        <line x1="630" y1="30" x2="630" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="30" x2="633" y2="30" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="150" x2="633" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${d}</text>

        <!-- Scale bar -->
        <line x1="60" y1="175" x2="160" y2="175" stroke="${e.accent}" stroke-width="0.8"/>
        <line x1="60" y1="172" x2="60" y2="178" stroke="${e.accent}" stroke-width="0.8"/>
        <line x1="110" y1="173" x2="110" y2="177" stroke="${e.accent}" stroke-width="0.5"/>
        <line x1="160" y1="172" x2="160" y2="178" stroke="${e.accent}" stroke-width="0.8"/>
        <text x="60" y="186" font-size="5" fill="${e.text}" font-family="var(--font-mono)">0m</text>
        <text x="107" y="186" font-size="5" fill="${e.text}" font-family="var(--font-mono)">5m</text>
        <text x="154" y="186" font-size="5" fill="${e.text}" font-family="var(--font-mono)">10m</text>

        <!-- Title block -->
        <rect x="490" y="165" width="180" height="24" fill="${e.bg}" stroke="${e.line}" stroke-width="0.5"/>
        <text x="500" y="175" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">DWG NO.</text>
        <text x="540" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${y(i)}</text>
        <text x="500" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${y(n)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}async function Re(){if(!f||!f.nation_id)return;const{data:t,error:e}=await _.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),je=[];else{const i=Number(f.corp_reputation??0);je=(t||[]).filter(a=>i>=(a.min_reputation||0))}if(Ve={},f&&je.length>0){const i=je.map(n=>n.id),{data:a}=await _.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",f.id).in("contract_id",i);for(const n of a||[])Ve[n.contract_id]=n}rn()}function xa(){const t=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=Q.length+" ACTIVE",Q.length===0){t.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const i=N?.current_tick||0;let a=0,n=0,s="";for(const r of Q){const o=r.issuer_type==="GOVERNMENT",l=o?"gov":"private",d=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,v=d?.bid_price||0,c=d?.estimated_cost||0,m=d?.estimated_quality||0,u=r.budget_ceiling||0,g=r.awarded_at_tick||i,b=r.stalled_ticks||0,p=Math.max(0,i-g),h=Math.max(0,p-b),x=r.timeline_ticks||8,$=Math.max(0,x-h),C=Math.min(100,Math.round(h/x*100)),E=h>x,w=b>0;let I="";if(w){const M=r.required_workforce||{},j=r.workers_assigned||{},D=[];if((Number(j.general)||0)<(Number(M.general)||0)&&D.push("General: "+(Number(j.general)||0)+"/"+(Number(M.general)||0)),(Number(j.skilled)||0)<(Number(M.skilled)||0)&&D.push("Skilled: "+(Number(j.skilled)||0)+"/"+(Number(M.skilled)||0)),(Number(j.innovative)||0)<(Number(M.innovative)||0)&&D.push("Innovative: "+(Number(j.innovative)||0)+"/"+(Number(M.innovative)||0)),D.length>0)I="Workers needed — "+D.join(", ");else{const S=r.current_phase||le[Math.min(le.length-1,Math.floor(h/Math.max(1,x)*le.length))];S==="Permits"?I="Awaiting permit approval":S==="Planning"?I="Planning phase — no materials yet":I="Materials needed — allocate from warehouse"}}on(r.sector);const L=fi(r.sector);a+=u,n+=v,s+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${y(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${y(r.issuer_name||"—")} · ${L}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${o?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${w?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+b+" ticks) — "+y(I)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${E?"var(--red)":w?"var(--orange)":"var(--teal)"}">
                        ${h}/${x} ticks ${E?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${C}%;background:${E?"var(--red)":w?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${re(v)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${re(c)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${m>=70?"var(--green)":m>=40?"var(--teal)":"var(--orange)"}">${m}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${E?"var(--red)":"var(--text-bright)"}">${$} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${r._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':r._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${r.id}',${u})">INSURE</div>`}
                </div>
            </div>
        </div>`}t.innerHTML=s,e.style.display=Q.length>0?"":"none",Q.length>0&&(document.getElementById("ap-total-crew").textContent=Q.length,document.getElementById("ap-total-budget").textContent=re(a),document.getElementById("ap-total-spent").textContent=re(n))}async function dn(){if(!f)return;const{data:t,error:e}=await _.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",f.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",f.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),Q=[]):Q=t||[],Q.length>0){const i=Q.map(o=>o.id),{data:a}=await _.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",i),{data:n}=await _.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),s=new Set((n||[]).map(o=>o.finance_loan_requests?.insured_contract_id).filter(Boolean)),r=new Set((a||[]).filter(o=>o.status==="open").map(o=>o.insured_contract_id));for(const o of Q)o._hasInsurance=s.has(o.id),o._insurancePending=r.has(o.id)}xa()}const ht=3e4;function $t(){let t=0,e=0;for(const i of be)for(const a of ci){const n=J[i.key]?.[a];n&&(t+=n.qty,e+=n.value)}return{totalUnits:t,totalValue:e}}function mi(){const t=document.getElementById("wh-list"),{totalUnits:e,totalValue:i}=$t();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=A(i);const a=Math.round(e/ht*100),n=document.getElementById("wh-capacity");n.textContent=a+"%",n.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)";let s="";for(let r=0;r<be.length;r++){const o=be[r],l=Xt===r,d=J[o.key]?.LOW||{qty:0,value:0},v=J[o.key]?.STD||{qty:0,value:0},c=J[o.key]?.HIGH||{qty:0,value:0},m=d.qty+v.qty+c.qty,u=d.value+v.value+c.value,g=m===0,b=Se(o.key,"LOW",R),p=Se(o.key,"STD",R),h=Se(o.key,"HIGH",R),x=d.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",$=v.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",C=h.available?c.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(s+='<div class="wh-row">',s+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${g?" empty":""}">${y(o.name)}</span>
            <div class="wh-row__dots">
                <div class="${x}"></div>
                <div class="${$}"></div>
                <div class="${C}"></div>
            </div>
            <span class="wh-row__qty${g?" empty":""}">${m>0?m.toLocaleString():"—"}</span>
            <span class="wh-row__val${g?" empty":""}">${u>0?A(u):"—"}</span>
        </div>`,l){s+='<div class="wh-expand">',s+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const E=[{key:"LOW",label:"Low",data:d,avail:b,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:v,avail:p,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:c,avail:h,color:"var(--green)",dotClass:"wh-dot--high"}];for(const w of E){const I=!w.avail.available,L=w.data.qty>0,M=L?"$"+Math.round(w.data.value/w.data.qty):"—";s+=`<div class="wh-grade${I?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${w.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${I?"var(--red)":w.color}">${w.label}</span>
                        ${I?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${L?"var(--text-bright)":"var(--text-dim)"}">${L?w.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${w.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${w.data.value>0?A(w.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${M}</span>
                </div>`}for(const w of E)!w.avail.available&&w.avail.failedStat&&(s+=`<div class="wh-lock">
                        <span class="wh-lock__text">${w.label.toUpperCase()} GRADE LOCKED — ${y(w.avail.failedStat)} &lt; ${w.avail.failedMin}</span>
                    </div>`);s+="</div>"}s+="</div>"}t.innerHTML=s}function ba(t){Xt=Xt===t?-1:t,mi()}async function pn(){if(!f)return;const{data:t,error:e}=await _.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",f.id);J={};const i=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(t){for(const a of t){const n=ft(a.material_key);J[n]||(J[n]={}),J[n][a.quality_tier]={qty:a.quantity||0,value:Number(a.total_value)||0},n!==a.material_key&&i.push(a)}if(i.length>0){const a=i.map(n=>({faction_id:f.id,nation_id:f.nation_id,material_key:ft(n.material_key),quality_tier:n.quality_tier,quantity:n.quantity||0,total_value:Number(n.total_value)||0,updated_at:new Date().toISOString()}));await _.from("corp_warehouse").upsert(a,{onConflict:"faction_id,material_key,quality_tier"});for(const n of i)await _.from("corp_warehouse").delete().eq("faction_id",f.id).eq("material_key",n.material_key).eq("quality_tier",n.quality_tier)}}mi()}const ha={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function $a(){const t=(R?.name||f?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+t;const e=Number(f?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=A(e);const{totalUnits:i}=$t(),a=Math.round(i/ht*100),n=document.getElementById("pr-wh-capacity");n.textContent=a+"%",n.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)",fn(),vi(),wt()}function fn(){const t=document.getElementById("pr-mat-grid");let e="";for(const i of be){const a=oe===i.key,n=ci.every(r=>!Se(i.key,r,R).available),s="pr-mat-btn"+(a?" active":"")+(n?" all-locked":"");e+=`<span class="${s}" onclick="setPrMat('${i.key}')">${y(i.name)}</span>`}t.innerHTML=e}function vi(){const t=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const i of ci){const a=Se(oe,i,R),n=K===i,s=a.available?li(oe,i,R):null,r=Yi[i],o=!a.available,l="pr-tier-btn"+(n?" active":"")+(o?" locked":"");e+=`<div class="${l}" onclick="${o?"":`setPrTier('${i}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${n?"var(--text-bright)":"var(--text-dim)"}">${Kt[i]}</span>
            </div>
            ${s!==null?`<div class="pr-tier-btn__price" style="color:${n?"var(--text-bright)":"var(--text-muted)"}">$${s}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}t.innerHTML=e}function wt(){const t=document.getElementById("pr-content"),e=Se(oe,K,R),i=be.find(E=>E.key===oe);if(!i)return;if(!e.available){t.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${y(i.name)} — ${Kt[K]} grade
                    is not produced domestically in ${y(R?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${y(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const a=li(oe,K,R),n=Qi(oe,K,R),s=a*me,r=n>3e3?"LOW":n>1e3?"MODERATE":"HIGH",o=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",l=Number(R?.inflation??50),d=l>55?"up":l<45?"down":"flat",v=d==="up"?"&#9650;":d==="down"?"&#9660;":"&#8212;",c=d==="up"?"var(--red)":d==="down"?"var(--green)":"var(--text-dim)";let m="";m+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${a}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${c}">${v}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${n.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${o};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,m+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${y(R?.name||"—")})</div>`;for(const E of i.priceDrivers){const w=Number(R?.[E]??50),I=w>=50?"var(--green)":w>=30?"var(--amber)":w>=15?"var(--orange)":"var(--red)",L=ha[E]||E;m+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${y(E)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${w}%;background:${I}"></div>
            </div>
            <span class="pr-driver-row__val">${w}</span>
            <span class="pr-driver-row__effect">${y(L)}</span>
        </div>`}m+="</div>";const g=(Number(f?.corp_cash_reserves)||0)>=s,b=me>n,{totalUnits:p}=$t(),h=ht-p,x=me>h,$=h<=0,C=Yi[K];m+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${y(i.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${C};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${C}">${Kt[K]}</span>
                </div>
                <span class="pr-order__mat-price">$${a}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(E=>`<span class="pr-qty-btn${me===E?" active":""}" onclick="setPrQty(${E})">${E>=1e3?E/1e3+"k":E}</span>`).join("")}
                </div>
            </div>
            ${b?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${n.toLocaleString()} this tick</span>
            </div>`:""}
            ${$?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:x?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${h.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${A(s)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${g&&!b&&!x&&!$?"":"disabled"}
                    title="${g?b?"Exceeds supply":$?"Warehouse full":x?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,t.innerHTML=m}function wa(t){oe=t,K="STD";for(const e of["STD","HIGH","LOW"])if(Se(t,e,R).available){K=e;break}fn(),vi(),wt()}function ka(t){K=t,vi(),wt()}function Ea(t){me=t,wt()}let Lt=!1;async function Ta(){if(Lt||!f||!R)return;const t=li(oe,K,R),e=Qi(oe,K,R),i=t*me,a=Number(f.corp_cash_reserves)||0;if(i>a){alert("Insufficient cash reserves.");return}if(me>e){alert("Exceeds available supply this tick.");return}const{totalUnits:n}=$t(),s=ht-n;if(s<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(me>s){alert(`Warehouse can only hold ${s.toLocaleString()} more units. Reduce quantity.`);return}Lt=!0;const r=document.querySelector(".pr-purchase-btn");r&&(r.disabled=!0,r.textContent="...");try{const o=a-i,{error:l}=await _.from("factions").update({corp_cash_reserves:o}).eq("id",f.id);if(l)throw l;const d=ft(oe),v=J[d]?.[K],c=(v?.qty||0)+me,m=(v?.value||0)+i,{error:u}=await _.from("corp_warehouse").upsert({faction_id:f.id,nation_id:f.nation_id,material_key:d,quality_tier:K,quantity:c,total_value:m,last_purchased_tick:N?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(u){const{error:g}=await _.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);throw g&&console.error("Cash refund failed after warehouse error:",g.message),u}f.corp_cash_reserves=o,J[d]||(J[d]={}),J[d][K]={qty:c,value:m},mi(),$a(),r&&(r.textContent="PURCHASED",setTimeout(()=>{r.isConnected&&(r.disabled=!1,r.textContent="PURCHASE")},1500))}catch(o){r&&(r.disabled=!1,r.textContent="PURCHASE"),alert("Purchase failed: "+(o.message||"Unknown error"))}finally{Lt=!1}}function mn(t){const e=Ae||R;if(!e)return[];const i=bt(t);if(!i)return[];const a=Pn(t,e),n=[],s=50,r=50;Number(e?.industry??50);const o=Ae&&R&&Ae.id!==R.id;let l=null;if(o&&(l=Dn(e,R)),a.newAvailable>0){const d=Ri(t,e),v=i.basePrice,c=Math.round(v*((s-50)/200)),m=Math.round(v*((r-50)/300));let u=d;const g=[{label:"Base price",value:A(v)},c!==0?{label:`Inflation (${s})`,mod:(c>=0?"+":"")+A(Math.abs(c))}:null,m!==0?{label:`Fuel transport (${r})`,mod:(m>=0?"+":"")+A(Math.abs(m))}:null].filter(Boolean),b=d-v-c-m;if(b!==0&&!o&&g.push({label:"Demand/scarcity",mod:(b>=0?"+":"")+A(Math.abs(b))}),o&&l){const p=Math.round(d*l.tariff),h=Math.round(d*l.transport);u=d+p+h,g.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+A(p)}),g.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+A(h)})}n.push({seller:o?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:o?l?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:a.newAvailable,delivery:o?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:o?l.deliveryTicks:0,used:!1,priceFactors:g,sourceNationId:e.id})}if(a.usedAvailable>0){const d=a.usedCondition,v=Ri(t,e,{used:!0,condition:d});let c=v;const m=[{label:"Base price",value:A(i.basePrice)},{label:`Condition (${d}%)`,mod:"-"+A(Math.max(0,i.basePrice-v))}];if(o&&l){const u=Math.round(v*l.tariff),g=Math.round(v*l.transport);c=v+u+g,m.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+A(u)}),m.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+A(g)})}n.push({seller:o?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:o?l?.deliveryTicks||1:0,condition:d,price:Math.round(c),available:a.usedAvailable,delivery:o?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:o?l.deliveryTicks:0,used:!0,priceFactors:m,sourceNationId:e.id})}return n}function ui(){const t=Number(f?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=A(t);const e=bt(se),i=et[e?.tier||1],a=document.getElementById("em-tier-badge");a&&(a.textContent=i.tag,a.style.color=i.color),a.style.background=i.color+"0a",a.style.border="1px solid "+i.color+"33";const n=document.getElementById("em-nation-select");if(n&&n.options.length===0){const o=R?.name||f?.nation||"—";let l=`<option value="">${y(o)} (HQ)</option>`;for(const d of nn)d.id!==R?.id&&(l+=`<option value="${d.id}">${y(d.name)}</option>`);n.innerHTML=l}const s=document.getElementById("em-import-tag"),r=Ae&&R&&Ae.id!==R.id;s&&(s.style.display=r?"":"none"),Ca(),yi()}function Ca(){let t="";for(let e=1;e<=3;e++){const i=et[e],a=Yt(e),n=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";t+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${i.color}">${i.tag}</div>
            <div class="${n}">`;for(const s of a){const r=se===s.key,o=mn(s.key).length>0;t+=`<span class="em-selector__btn${r?" active":""}${o?"":" no-listings"}"
                style="${r?"background:"+i.color+";border-color:"+i.color:""}"
                onclick="setEmType('${s.key}')">${y(s.name)}</span>`}t+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${t}</div>`}function yi(){const t=document.getElementById("em-content");if(Ee=mn(se),Ee.length===0){t.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}ye>=Ee.length&&(ye=0);let e="";for(let a=0;a<Ee.length;a++){const n=Ee[a],s=ye===a,r=n.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",o=Ui(n.condition);e+=`<div class="em-listing${s?" selected":""}" style="${s?"border-left-color:"+r:""}" onclick="setEmListing(${a})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${y(n.seller)}</span>
                <span class="em-badge em-badge--${n.sellerType.toLowerCase()}">${n.sellerType}</span>
                ${n.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${y((n.nation||"").toUpperCase())}</span>
            ${n.distance>0?`<span class="em-listing__distance">${n.distance} nation${n.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${y(n.delivery)}</span>
        </div>`,e+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${n.condition}%;background:${o}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${o}">${n.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${n.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${A(n.price)}</div>
            </div>
        </div>`,s&&n.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${n.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${y(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const i=Ee[ye];if(i){const a=bt(se),n=et[a?.tier||1],s=Math.min(i.available,4),r=i.price*ge,o=(Number(f?.corp_cash_reserves)||0)>=r;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${y(a?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${y(i.seller)}</span>
                </div>
                <span class="em-purchase__price">${A(i.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:s},(l,d)=>d+1).map(l=>`<span class="em-qty-btn${ge===l?" active":""}" style="${ge===l?"background:"+n.color+";border-color:"+n.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${i.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${A(r)}</div>
                    ${i.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${y(i.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${n.color}" onclick="purchaseEquipment()"
                    ${o?"":"disabled"}
                    title="${o?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}t.innerHTML=e}async function Ia(t){if(!t)Ae=null;else{let i=nn.find(a=>a.id===t);if(!i)try{const{data:a}=await _.from("nations").select("*").eq("id",t).single();i=a}catch{}Ae=i||null}ye=0,ge=1;const e=document.getElementById("em-nation-select");e&&(e.value=t||""),ui()}function Sa(t){se=t,ye=0,ge=1,ui()}function Aa(t){ye=t,ge=1,yi()}function Ma(t){ge=t,yi()}let zt=!1;async function qa(){if(zt)return;const t=Ee[ye];if(!t||!f)return;const e=bt(se);if(!e)return;const i=ge,a=t.price*i,n=Number(f.corp_cash_reserves)||0;if(a>n){alert("Insufficient cash reserves.");return}if(i>t.available){alert("Not enough units available.");return}const s=document.querySelector(".em-purchase-btn");s&&(s.disabled=!0,s.textContent="..."),zt=!0;try{const r=n-a,{error:o}=await _.from("factions").update({corp_cash_reserves:r}).eq("id",f.id);if(o)throw o;const l=!t.deliveryTicks||t.deliveryTicks===0;if(l){const v=ie.find($=>$.equipment_key===se),c=(v?.owned||0)+i,m=v?.purchase_price_avg||0,u=v?.owned||0,g=u>0?Math.round((m*u+t.price*i)/c):t.price,b=e.maintenancePerUnit*c,p=v?.condition||100,h=Math.round((p*u+t.condition*i)/c),{error:x}=await _.from("corp_equipment").upsert({faction_id:f.id,nation_id:f.nation_id,equipment_key:se,tier:e.tier,owned:c,deployed:v?.deployed||0,condition:h,maintenance_per_tick:b,purchase_price_avg:g,last_purchased_tick:N?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(x){const{error:$}=await _.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);throw $&&console.error("Cash refund failed:",$.message),x}v?(v.owned=c,v.condition=h,v.maintenance_per_tick=b):ie.push({equipment_key:se,tier:e.tier,owned:c,deployed:0,condition:h,maintenance_per_tick:b,assigned_projects:[]})}else{const v=(N?.current_tick||0)+t.deliveryTicks,{error:c}=await _.from("corp_equipment_deliveries").insert({faction_id:f.id,equipment_key:se,quantity:i,condition:t.condition,delivery_tick:v,source_nation_id:t.sourceNationId||null,seller_name:t.seller,price_paid:a});if(c){const{error:m}=await _.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);throw m&&console.error("Cash refund failed:",m.message),c}}f.corp_cash_reserves=r,Ei(),ui();const d=document.getElementById("pr-cash");d&&(d.textContent=A(r)),s&&(s.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(r){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{zt=!1}}let Na=-1,He=[],ut=[],ni=[];function Rt(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t.toLocaleString()}function La(t,e,i){if(i)return"var(--orange)";const a=t/(e||1)*100;return a>50?"var(--green)":a>25?"var(--amber)":"var(--red)"}function Hi(){const t=document.getElementById("pm-list"),e=He.length,i=ut.length,a=ni.length,n=He.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${i})`,document.getElementById("pm-apply-count").textContent=`(${a})`;const s=document.getElementById("pm-badges");let r="";n>0&&(r+=`<span class="pm-badge pm-badge--expiring">${n} EXPIRING</span>`),i>0&&(r+=`<span class="pm-badge pm-badge--pending">${i} PENDING</span>`),s.innerHTML=r;const o=He.reduce((l,d)=>l+(d.cost||0),0)+ut.reduce((l,d)=>l+(d.cost||0),0);document.getElementById("pm-total-cost").textContent=Rt(o),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=i;{if(e===0){t.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";He.forEach((d,v)=>{const c=Na===v,m=La(d.ticks_left,d.total_ticks,d.expiring_soon),u=Math.min(d.ticks_left/(d.total_ticks||1)*100,100);l+=`<div class="pm-item ${d.expiring_soon?"pm-item--expiring":""} ${c?"expanded":""}" onclick="togglePmExpand(${v})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${y(d.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${y((d.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${m}">Expires: ${y(d.expires||"")}</span>
                        <span class="pm-item__ticks">(${d.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${u}%;background:${m}"></div></div>`,c&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${y(d.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${y(d.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Rt(d.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${d.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${d.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(d.projects||[]).map(g=>`<span class="pm-project-chip">${y(g)}</span>`).join("")}</div>
                    </div>`,d.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${y(d.note)}</span></div>`),d.expiring_soon&&d.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${d.permit_key}');">RENEW — ${Rt(d.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),t.innerHTML=l;return}}let Pt=!1;async function za(t){if(!(Pt||!f||!R)){Pt=!0;try{const{data:e}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=e?.current_tick||0,{data:a,error:n}=await _.rpc("apply_for_permit",{p_faction_id:f.id,p_nation_id:R.id,p_permit_key:t,p_current_tick:i});if(n){alert("Application failed: "+n.message);return}if(a&&!a.success){alert(a.error||"Application failed");return}alert("Permit application submitted! Processing: "+(a.processing_ticks||0)+" ticks."),await Ra()}catch(e){alert("Error: "+e.message)}finally{Pt=!1}}}window.pmApplyForPermit=za;async function Ra(){if(!f||!R){He=[],ut=[],ni=[],Hi();return}const{data:t}=await _.from("construction_permits").select("*"),e=t||[],i={};for(const c of e)i[c.permit_key]=c;const{data:a}=await _.from("corp_permits").select("*").eq("faction_id",f.id).eq("nation_id",R.id),n=a||[],{data:s}=await _.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",R.id).not("policies.permit_key","is",null),r=new Set,o={};for(const c of s||[])c.policies?.permit_key&&(r.add(c.policies.permit_key),o[c.policies.permit_key]=c.policies.policy_name);const{data:l}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),d=l?.current_tick||0;He=n.filter(c=>c.status==="active").map(c=>{const m=i[c.permit_key]||{},u=c.expires_at_tick?Math.max(0,c.expires_at_tick-d):999,g=m.duration_ticks||24;return{name:m.name||c.permit_key,permit_key:c.permit_key,nation:R.name,policy:o[c.permit_key]||"—",issued:c.granted_at_tick!=null?Ce(c.granted_at_tick):"—",expires:c.expires_at_tick?Ce(c.expires_at_tick):"Single-use",cost:c.cost_paid||0,ticks_left:u,total_ticks:g,expiring_soon:u<=3&&u>0,renewable:m.duration_ticks!=null,projects:[]}}),ut=n.filter(c=>c.status==="pending").map(c=>{const m=i[c.permit_key]||{},u=m.processing_ticks||2,g=d-c.applied_at_tick,b=Math.max(0,u-g);return{name:m.name||c.permit_key,permit_key:c.permit_key,nation:R.name,applied:Ce(c.applied_at_tick),status:"PROCESSING",processing_total:u,ticks_remaining:b,est_approval:Ce(c.applied_at_tick+u),cost:c.cost_paid||0,required_by:o[c.permit_key]||"—"}});const v=new Set(n.filter(c=>c.status==="active"||c.status==="pending").map(c=>c.permit_key));ni=[...r].filter(c=>!v.has(c)).map(c=>{const m=i[c]||{};return{name:m.name||c,permit_key:c,nation:R.name,description:m.description||"",policy:o[c]||"—",cost:m.cost_is_percentage?15e4:m.cost||0,processing_time:m.processing_ticks||2,duration:m.duration_ticks?m.duration_ticks+" ticks":"Single-use",category:m.category||"",difficulty:m.difficulty||"EASY"}}),Hi()}let Dt=!1,Ot=!1,Bt=!1;function vn(t){return Math.abs(t)>=1e9?"$"+(t/1e9).toFixed(1)+"B":Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+Math.round(t/1e3)+"k":"$"+Math.round(t)}async function gi(){var{data:t,error:e}=await _.from("factions").select("*").eq("id",f.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}t&&(f=t);var i=document.getElementById("topbar-cash");i&&(i.textContent="CASH: "+vn(Number(f.corp_cash_reserves??0)))}const ai={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let Ue=[],_i=[],un="ready",Ke=null,yt="ALL",Z=-1;const gt={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function Pa(t){yt=t,Z=-1,document.querySelectorAll(".ar-pill").forEach(e=>{const i=e.getAttribute("data-ar-filter");e.className="ar-pill"+(i===t?" active-"+(t==="ALL"?"all":t==="COASTAL"?"coastal":t==="INTERNATIONAL"?"intl":"gov"):"")}),bi()}function yn(t){return Math.round(Number(t?.estimated_revenue||0)*Qt(t))}function xi(){return(yt==="ALL"?Ue:Ue.filter(e=>e.scope===yt)).slice().sort((e,i)=>{const a=e.trade_agreement_id?0:1,n=i.trade_agreement_id?0:1;return a-n})}async function kt(){if(!f||f.corp_sector!=="Shipping")return;const t=await Hn(_,f.id,f.corp_subsector);Ue=t.routes,_i=t.applications,un=t.state,Ke=t.error,Ke&&console.warn("Failed to load available routes:",Ke.message),Z=-1,bi()}var Da={fuel_energy:[{stat:"industry",label:"Industry"},{stat:"workforce",label:"Workforce"}],minerals:[{stat:"industry",label:"Industry"},{stat:"industry",label:"Industry"}],grains_staples:[{stat:"farmland",label:"Farmland"},{stat:"workforce",label:"Workforce"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"farmland",label:"Farmland"}],cash_crops:[{stat:"farmland",label:"Farmland"},{stat:"service_sector",label:"Service Sector"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"workforce",label:"Workforce"}],technology:[{stat:"education",label:"Education"},{stat:"education",label:"Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"workforce",label:"Workforce"}],arms:[{stat:"industry",label:"Industry"},{stat:"control",label:"Control"}]};function Oa(t){return Da[t]||[]}function Ba(t){var e=Number(t.competition_count||0),i=t.demand_level||"",a=t.scope==="GOVERNMENT";return a?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&i==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&i==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":i==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":i==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(t.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function bi(){const t=xi();document.getElementById("ar-count").textContent=Ue.length+" ROUTES";var e={COASTAL:0,INTERNATIONAL:0,GOVERNMENT:0};Ue.forEach(function(h){e[h.scope]!==void 0&&e[h.scope]++});var i=e.COASTAL,a=e.INTERNATIONAL,n=e.GOVERNMENT;document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">COASTAL</span><span class="ar-footer__count-num">'+i+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">INTL</span><span class="ar-footer__count-num">'+a+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+n+"</span></div>";const s=document.getElementById("ar-claim-btn");s.className="ar-claim-btn"+(Z>=0?" active":"");const r=document.getElementById("ar-list");if(un==="error"){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+y(Ke&&Ke.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}if(t.length===0){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(Ue.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+yt.toLowerCase()+" routes available.")+"</div></div>";return}let o="";for(let h=0;h<t.length;h++){const x=t[h],$=Z===h,C=gt[x.scope]||gt.INTERNATIONAL,E=x.scope==="GOVERNMENT",w=x.demand_level&&ai[x.demand_level]?{color:ai[x.demand_level],label:x.demand_level}:null,I=Number(x.competition_count||0),L=I===0?"#5c5":I<=2?"#ca5":"#c84";if(o+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+($?C.color:"transparent")+";background:"+($?C.color+"08":"transparent")+';" onclick="arSelectRoute('+h+')"><div style="padding:8px 14px;">',o+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+y(x.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+C.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+C.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+C.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+y(x.destination_port||"?")+"</span></div>",o+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+C.color+";background:"+C.color+"12;border:1px solid "+C.color+'25">'+C.label+"</span>",w&&(o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+w.color+";background:"+w.color+"12;border:1px solid "+w.color+'25">'+w.label+" DEMAND</span>"),E&&x.gov_issuer&&(o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+y(x.gov_issuer)+"</span>"),I===0&&!E&&(o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>'),x.trade_agreement_id&&!E){const M=x.trade_agreement_name?" · "+y(String(x.trade_agreement_name).slice(0,28)):"";o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.1);border:1px solid rgba(92,204,92,0.3)">ACTIVE AGREEMENT ×1.2'+M+"</span>"}else!x.trade_agreement_id&&!E&&(o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#9e9a92;background:rgba(158,154,146,0.06);border:1px solid rgba(158,154,146,0.15)">OPEN MARKET ×1.0</span>');var l=_i.find(function(M){return M.route_id===x.id});if(l){var d=l.status==="approved"?"#5c5":"#c8a832",v=l.status==="approved"?"APPROVED":"APPLIED";o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+d+";background:"+d+"12;border:1px solid "+d+'25">'+v+"</span>"}if(o+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(x.transit_ticks||"?")+" tick"+((x.transit_ticks||0)!==1?"s":"")+" · "+y(x.vessel_class||"?")+"</span>",o+="</div>",o+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',E)o+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(x.gov_contract_duration||x.transit_ticks||"?")+" ticks</div></div>",o+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+y(x.vessel_class||"?")+"</div></div>",o+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+A(Number(x.gov_contract_value||x.estimated_revenue||0))+"</div></div>",o+="</div>";else{const M=Va(x),j=M.net>0?"#5c5":M.net<0?"#c84":"#9e9a92";o+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+A(Number(x.trade_volume||0))+"</div></div>",o+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+L+';margin-top:1px">'+I+"</div></div>",o+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(x.transit_ticks||"?")+" tick"+((x.transit_ticks||0)!==1?"s":"")+"</div></div>",o+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+(x.trade_agreement_id?"#5c5":"#b0aa9a")+';margin-top:1px">'+A(yn(x))+"</div></div>",o+="</div>",o+='<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 8px;background:var(--bg-0);border:1px solid var(--border-0);border-top:none;"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.5px;">EST. MONTHLY MARGIN (state fuel + maint + incident reserve)</span><span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+j+';">'+(M.net>=0?"+":"")+A(M.net)+"</span></div>"}if($){if(o+='<div style="margin-top:6px;">',E&&x.goods_description&&(o+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+y(x.goods_description)+"</div>"),x.trade_agreement_name&&(o+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+y(x.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(x.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(x.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),o+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',o+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+y(x.vessel_class||"?")+"</span></div>",x.vessel_note&&(o+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+y(x.vessel_note)+"</span></div>"),o+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(x.proximity!=null?x.proximity:"?")+" / 100</span></div>",o+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+y(x.goods_name||"Unknown")+"</span></div>",x.goods_description&&!E&&(o+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+y(x.goods_description)+"</span></div>"),o+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(x.volume_physical||0).toLocaleString()+" "+y(x.volume_unit||"tons")+"</span></div>",o+="</div>",R&&!E){var c=Oa(x.trade_sector);if(c.length>0){o+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var m=0;m<c.length;m++){var u=c[m],g=Number(R[u.stat]??50),b=g>=50?"#5c5":g>=30?"#ca5":"#c84";o+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+y(u.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+g+"%;height:100%;background:"+b+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(g)+"</span></div>"}o+="</div>"}}var p=Ba(x);p&&(o+='<div style="padding:4px 8px;background:'+C.color+"08;border:1px solid "+C.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+y(p)+"</div></div>"),o+="</div>"}o+="</div></div>"}r.innerHTML=o}function ja(t){Z=Z===t?-1:t,bi()}let Pe=null,qe=null,ee=0,ct=!1;async function Ha(t){const i=Math.round(57499.99999999999),a=5e4;if(!t)return{tier:"state",cost:15e4,ownerFactionId:null,ownerName:null};try{const{data:n}=await _.from("corp_properties").select("id, faction_id").eq("nation_id",t).eq("faction_id",f.id).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(n)return{tier:"own",cost:a,ownerFactionId:f.id,ownerName:f.faction_name};const{data:s}=await _.from("corp_properties").select("id, faction_id, factions!faction_id(faction_name)").eq("nation_id",t).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(s)return{tier:"other",cost:i,ownerFactionId:s.faction_id,ownerName:s.factions?.faction_name||"another corporation"}}catch(n){console.warn("[Depot lookup] failed:",n?.message||n)}return{tier:"state",cost:15e4,ownerFactionId:null,ownerName:null}}const oi=.06,Fa={loading:.85},Ua={Coastal:.82,Container:1.18,Bulk:1,Tanker:1.28,Reefer:1.12,LNG:1.34},Ga={Coastal:9e4,Container:145e3,Bulk:175e3,Tanker:19e4,Reefer:14e4,LNG:29e4};function hi(t,e,i){const n=Math.max(0,Math.min(100,Number(t?.proximity)||50)),s=String(t?.scope||"").toUpperCase(),r=Ua[e]||1,o=.75+n/100*.9,l=s==="COASTAL"?.92:s==="GOVERNMENT"?1.05:1,d=Math.round(5e4*r*o*l);return i==="own"?d:Math.round(i==="other"?d*1.15:d*1.65)}function Va(t){const e=Math.max(1,Number(t?.transit_ticks)||2),i=Math.max(1,12/(e*2)),a=Math.round(yn(t)*i),n=Math.round(hi(t,t?.vessel_class,"state")*i),s=Math.round((Ga[t?.vessel_class]||12e4)*Fa.loading),r=Math.round(a*oi),o=a-n-s-r;return{gross:a,fuel:n,maintenance:s,reserve:r,net:o}}function Wa({route:t,proposedRate:e,tierMult:i,depotTier:a}){const n=Number(e)||0,s=Math.round(n*(Number(i)||1)),r=hi(t,t?.vessel_class,a),o=s-r;return{bid:n,revenue:s,fuelPerTrip:r,netPerTrip:o}}async function Ya(){if(Z<0||!f||!N)return;var t=xi(),e=t[Z];if(!e)return;var i=_i.find(function(l){return l.route_id===e.id});if(i){alert("You have already applied for this route. Status: "+i.status);return}var a={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},n=a[f.corp_subsector]||"";if(e.shipping_subsector&&n!==e.shipping_subsector){var s=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(l){return l.toUpperCase()});alert("Your fleet specializes in "+(f.corp_subsector||"?")+" but this route requires "+s+".");return}Pe=e,Pe.destDepot=await Ha(e.destination_nation_id);const r=Vi(e.trade_volume,e.shipping_subsector),o=Math.round((Wi+r)/2);ee=Gn(Number(e.estimated_revenue)||o,r),qe=null,wi()}function $i(){Pe=null,document.getElementById("ra-modal-overlay")?.remove()}function Qa(t){qe=t,wi()}function Ka(t){ee=Number(t),wi()}function wi(){if(document.getElementById("ra-modal-overlay")?.remove(),!Pe)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#5a8aaa",green:"#5c5",gold:"#c8a832",orange:"#c84",red:"#c55",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=Pe,a=gt[i.scope]||gt.INTERNATIONAL,n=Qt(i),s=i.destDepot?.tier||"state",r=ne.filter(z=>z.status==="in_port"&&!z.active_claim_id&&z.condition>=20),o=r.find(z=>z.id===qe),l=!!o&&ee>0,d=Wa({route:i,proposedRate:ee,tierMult:n,depotTier:s}),v=d.netPerTrip>0?e.green:d.netPerTrip<0?e.red:e.dim,c=Number(o?.base_maintenance)||0,m=Number(i.transit_ticks)||0,u=c*m,g=d.netPerTrip>=u;let b=`
    <div style="width:520px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;max-height:90vh;">
        <div style="padding:12px 20px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:10px;color:${a.color}">●</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;letter-spacing:2px;color:${e.muted};">ROUTE APPLICATION</span>
            </div>
            <span onclick="raClose()" style="font-family:${t};font-size:18px;color:${e.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:14px 20px;overflow:auto;flex:1;">

            <div style="display:flex;align-items:center;gap:0;margin-bottom:12px;">
                <span style="font-size:14px;font-weight:700;color:${e.text}">${y(i.origin_port||"?")}</span>
                <div style="flex:1;display:flex;align-items:center;margin:0 10px;">
                    <div style="flex:1;height:1px;background:${a.color}44"></div>
                    <span style="font-family:${t};font-size:8px;color:${a.color};padding:0 8px">⚓ ${i.transit_ticks||"?"} tick${(i.transit_ticks||0)!==1?"s":""}</span>
                    <div style="flex:1;height:1px;background:${a.color}44"></div>
                </div>
                <span style="font-size:14px;font-weight:700;color:${e.text}">${y(i.destination_port||"?")}</span>
            </div>

            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};margin-bottom:14px;">
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">CARGO</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${y(i.goods_name||"?")}</div>
                </div>
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">VESSEL REQ.</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${y(i.vessel_class||"?")}</div>
                </div>
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">VOLUME</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${A(Number(i.trade_volume||0))}</div>
                </div>
                <div style="flex:1;padding:4px 8px;">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">COMPETITION</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${Number(i.competition_count||0)===0?e.green:e.orange};margin-top:1px;">${i.competition_count||0}</div>
                </div>
            </div>

            ${(()=>{const z=i.destDepot;if(!z)return"";const H=i.destination_port||"this port",F=hi(i,i.vessel_class,z.tier),k="$"+Math.round(F).toLocaleString()+" / refuel";let q,B;return z.tier==="own"?(q=`${H} has your Fuel Depot (${y(z.ownerName||f.faction_name||"your corp")}) — ${k}.`,B=e.green):z.tier==="other"?(q=`${H} has a Fuel Depot (${y(z.ownerName||"another corp")}) — ${k}.`,B=e.gold):(q=`${H} has no fuel depot — paying ${k} to the government-owned depot.`,B=e.orange),`<div style="padding:7px 10px;margin-bottom:14px;background:${e.card};border:1px solid ${e.border};border-left:2px solid ${B};font-family:${t};font-size:9px;color:${e.text};line-height:1.5;">
                    <span style="color:${e.dim};font-size:7px;font-weight:700;letter-spacing:0.5px;">FUEL AT DESTINATION</span><br>
                    ${q}
                </div>`})()}

            ${(()=>{const z=!!i.trade_agreement_id,H=Qt(i),F=z?e.green:e.dim,k=z?`ACTIVE TRADE AGREEMENT${i.trade_agreement_name?" · "+y(i.trade_agreement_name):""}`:"OPEN-MARKET ROUTE",q=z?`Revenue = your bid × ${H.toFixed(2)} (agreement bonus).`:`Revenue = your bid × ${H.toFixed(2)} (organic route penalty). Agreement-backed lanes pay more.`;return`<div style="padding:7px 10px;margin-bottom:14px;background:${e.card};border:1px solid ${e.border};border-left:2px solid ${F};font-family:${t};font-size:9px;color:${e.text};line-height:1.5;">
                    <span style="color:${e.dim};font-size:7px;font-weight:700;letter-spacing:0.5px;">${k}</span><br>
                    ${q}
                </div>`})()}

            <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">SELECT VESSEL</div>`;if(r.length===0)b+=`<div style="padding:14px;text-align:center;background:${e.card};border:1px solid ${e.border};margin-bottom:14px;">
            <div style="font-family:${t};font-size:10px;color:${e.red};">No available vessels</div>
            <div style="font-family:${t};font-size:8px;color:${e.dim};margin-top:4px;">You need a vessel in port, not assigned to another route, with condition ≥ 20%.</div>
        </div>`;else{b+='<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px;">';for(const z of r){const H=qe===z.id,F=z.condition>=75?e.green:z.condition>=50?e.gold:e.orange,k=z.fuel>=60?e.green:z.fuel>=30?e.gold:e.red;b+=`<div onclick="raSelectVessel('${z.id}')" style="padding:8px 10px;background:${H?e.accent+"12":e.card};border:1px solid ${H?e.accent+"44":e.border};cursor:pointer;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-size:11px;font-weight:600;color:${e.text};">${y(z.vessel_name)}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${a.color};background:${a.color}12;border:1px solid ${a.color}25;">${z.vessel_class.toUpperCase()}</span>
                </div>
                <div style="display:flex;gap:12px;font-family:${t};font-size:8px;">
                    <span style="color:${e.dim};">Condition: <span style="color:${F};font-weight:700;">${z.condition}%</span></span>
                    <span style="color:${e.dim};">Fuel: <span style="color:${k};font-weight:700;">${z.fuel}%</span></span>
                    <span style="color:${e.dim};">Capacity: <span style="color:${e.text};font-weight:700;">${(z.capacity_dwt||0).toLocaleString()} ${z.capacity_unit||"DWT"}</span></span>
                </div>
            </div>`}b+="</div>"}const p=Wi,h=Vi(i.trade_volume,i.shipping_subsector),x=Math.round((p+h)/2);(ee>h||ee<p)&&(ee=Math.min(h,Math.max(p,ee))),b+=`
            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;">PROPOSED SERVICE RATE</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.gold};">${A(ee)}/trip</span>
                </div>
                <input type="range" min="${p}" max="${h}" step="5000" value="${ee}"
                    oninput="raSetRate(this.value)"
                    style="width:100%;accent-color:${e.gold};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${t};font-size:8px;color:${e.dim};margin-top:3px;">
                    <span>Floor (${A(p)})</span>
                    <span style="color:${e.muted};">Mid (${A(x)})</span>
                    <span>Ceiling (${A(h)})</span>
                </div>
            </div>`;const $=i.destDepot?.tier==="own"?"own depot":i.destDepot?.tier==="other"?"other corp's depot +15%":"state depot (+65%)",C=Math.max(1,12/(Math.max(1,m)*2)),E=Math.round(d.revenue*C),w=Math.round(d.fuelPerTrip*C),I=o?o.status==="in_transit"?1.25:o.status==="in_port"?.55:.85:.85,L=Math.round(c*I),M=Math.round(E*oi),j=E-w-L-M,D=j>0?e.green:j<0?e.red:e.dim;b+=`
            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">ESTIMATED ECONOMICS (PER TRIP)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Bid</span>
                        <span style="font-family:${t};font-size:10px;color:${e.text};">${A(d.bid)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Revenue ×${n} (${i.trade_agreement_id?"agreement":"organic"})</span>
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.green};">${A(d.revenue)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Fuel at destination (${$})</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${A(d.fuelPerTrip)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text};">NET PER TRIP</span>
                        <span style="font-family:${t};font-size:14px;font-weight:700;color:${v};">${d.netPerTrip>=0?"+":""}${A(d.netPerTrip)}</span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">FLEET OVERHEAD (ONGOING)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    ${o?`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Vessel maintenance · ${y(o.vessel_class||"?")}</span>
                              <span style="font-family:${t};font-size:10px;color:${e.text};">${A(c)} / tick</span>
                           </div>
                           <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Accrues during ${m}-tick transit</span>
                              <span style="font-family:${t};font-size:10px;color:${e.text};">${A(u)}</span>
                           </div>
                           <div style="display:flex;justify-content:space-between;padding:5px 0;">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Net per trip vs. maint accrued</span>
                              <span style="font-family:${t};font-size:10px;font-weight:700;color:${g?e.green:e.red};">${g?"covers":"short by "+A(Math.max(0,u-d.netPerTrip))}</span>
                           </div>`:`<div style="font-family:${t};font-size:9px;color:${e.dim};line-height:1.5;">Select a vessel to see its per-tick maintenance cost. Maintenance is charged on every corp tick to every vessel regardless of activity, so higher-class ships need higher-paying routes to break even.</div>`}
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">PROFITABILITY CHECKPOINT (MONTHLY / ACTIVE SHIP)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Expected monthly gross revenue</span>
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.green};">${A(E)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Expected monthly fuel</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${A(w)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Maintenance allocation (${Math.round(I*100)}% state factor)</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${A(L)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Incident reserve (${Math.round(oi*100)}%)</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${A(M)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text};">EST. MONTHLY NET</span>
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${D};">${j>=0?"+":""}${A(j)}</span>
                    </div>
                </div>
            </div>

            <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);font-family:${t};font-size:8px;color:${e.dim};line-height:1.5;">
                Application fee: <span style="color:${e.gold};">$50k</span> (non-refundable). The government reviews applications and may approve or reject based on your rate, fleet readiness, and competition.
            </div>

        </div>
        <div style="padding:12px 20px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${t};font-size:8px;color:${e.dim};">APPLICATION FEE</div>
                <div style="font-family:${t};font-size:14px;font-weight:700;color:${e.gold};">$50k</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="raClose()" style="padding:7px 16px;font-family:${t};font-size:11px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer;">CANCEL</div>
                <div onclick="${l?"raSubmitApplication()":""}" style="padding:7px 16px;font-family:${t};font-size:11px;font-weight:700;letter-spacing:1px;color:${l?"#000":e.dim};background:${l?e.accent:"transparent"};border:1px solid ${l?e.accent:e.border};cursor:${l?"pointer":"not-allowed"};opacity:${l?1:.4};">SUBMIT APPLICATION</div>
            </div>
        </div>
    </div>`;const S=document.createElement("div");S.id="ra-modal-overlay",S.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",S.innerHTML=b,S.addEventListener("click",z=>{z.target===S&&$i()}),document.body.appendChild(S)}async function Ja(){if(ct||!Pe||!qe||!f||!N)return;ct=!0;const t=Pe,e=5e4,{data:i}=await _.from("factions").select("corp_cash_reserves").eq("id",f.id).single(),a=Number(i?.corp_cash_reserves??0);if(a<e){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(a/1e3)+"k."),ct=!1;return}try{const n=a-e,{error:s}=await _.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);if(s){alert("Failed to deduct fee.");return}const r={route_id:t.id,faction_id:f.id,vessel_id:qe,proposed_rate:ee,application_fee:e,status:"pending",applied_at_tick:N.current_tick};let{error:o}=await _.from("shipping_applications").insert(r);if(o&&/vessel_id/i.test(o.message||"")){const{vessel_id:l,...d}=r;o=(await _.from("shipping_applications").insert(d)).error}if(o){await _.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);const l=o.code==="23505"||/duplicate key|idx_shipping_applications_unique/i.test(o.message||"");alert(l?"You already have a pending or approved application on this route. Withdraw it from Route Applications before applying again.":"Application failed: "+o.message);return}try{await _.from("event_log").insert({nation_id:t.origin_nation_id,event_name:f.faction_name+" applied to service "+(t.origin_port||"?")+" → "+(t.destination_port||"?"),category:"corporate",description_chosen:f.faction_name+" submitted a shipping application for the "+(t.goods_name||"trade")+" route at a proposed rate of "+A(ee)+"/trip. Vessel: "+(ne.find(l=>l.id===qe)?.vessel_name||"Unknown"),fired_at_tick:N.current_tick})}catch(l){console.warn("[Shipping] Event log failed:",l?.message||l)}$i(),await gi(),Z=-1,await kt(),alert("Application submitted! The government will review your application.")}catch(n){alert("Application failed: "+(n.message||"Network error"))}finally{ct=!1}}async function Xa(){if(!(Dt||Z<0||!f||!N)){var t=xi(),e=t[Z];if(e){var i=Number(f.shipping_fleet_capacity??0),a=Number(f.shipping_fleet_deployed??0);if(a>=i){alert("No available vessels. Fleet capacity: "+i+", deployed: "+a+".");return}Dt=!0;var n=document.getElementById("ar-claim-btn");n.textContent="CLAIMING...",n.className="ar-claim-btn";try{var{data:s,error:r}=await _.rpc("claim_shipping_route",{p_faction_id:f.id,p_route_id:e.id,p_current_tick:N.current_tick});if(r){alert("Claim failed: "+r.message);return}if(s&&!s.success){alert(s.error||"Claim failed.");return}if(s?.claim_id){var o=(ne||[]).find(function(m){return m.status==="in_port"&&!m.active_claim_id&&m.fuel>=10});if(o){var{error:l}=await _.from("corp_vessels").update({status:"in_transit",active_claim_id:s.claim_id,current_port_nation_id:null}).eq("id",o.id);l&&console.warn("Failed to assign vessel to route:",l.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var d=e.origin_nation?.name||e.origin_nation_id||"Unknown",v=e.destination_nation?.name||e.destination_nation_id||"Unknown",c=e.goods_type||e.cargo_type||"goods";await _.from("event_log").insert({nation_id:f.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:f.faction_name+" has just signed an agreement to ship "+c+" between "+d+" and "+v+".",fired_at_tick:N.current_tick||0})}catch{}await gi(),Z=-1,await Promise.all([kt(),Et(),de()])}catch(m){alert("Claim failed: "+(m.message||"Network error"))}finally{Dt=!1,n.textContent="CLAIM ROUTE",n.className="ar-claim-btn"+(Z>=0?" active":"")}}}}let Te=[],gn="ready",Je=null,_t=-1;async function Et(){if(!f)return;const t=await jn(_,f.id);Te=t.claims,gn=t.state,Je=t.error,Je&&console.warn("Failed to load active voyages:",Je.message),_n()}function Za(t){_t=_t===t?-1:t,_n()}async function eo(t){if(!(Ot||!f||!N)){Ot=!0;try{var{data:e,error:i}=await _.rpc("release_shipping_route",{p_faction_id:f.id,p_claim_id:t,p_current_tick:N.current_tick});if(i){alert("Release failed: "+i.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:a}=await _.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",t).eq("faction_id",f.id);a&&console.warn("Failed to free vessel on release:",a.message),_t=-1,await gi(),await Promise.all([kt(),Et(),de()])}catch(n){alert("Release failed: "+(n.message||"Network error"))}finally{Ot=!1}}}function _n(){const t=N?.current_tick||0,e=Number(f?.shipping_fleet_capacity??0),i=Number(f?.shipping_fleet_deployed??0),a=f?.corp_subsector||"--";document.getElementById("av-count").textContent=Te.length+" ACTIVE";const n=Te.reduce((v,c)=>v+Number(c.total_revenue||0),0),s=Te.reduce((v,c)=>v+(c.transits_completed||0),0),r=s>0?Math.round(n/s):0;document.getElementById("av-summary").innerHTML=`
        <div class="av-summary__cell">
            <div class="av-summary__label">FLEET</div>
            <div class="av-summary__value" style="color:${i>=e?"var(--orange)":"var(--text-bright)"}">
                ${i} <span style="font-size:9px;color:var(--text-dim)">/ ${e}</span>
            </div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">TRANSITS</div>
            <div class="av-summary__value" style="color:var(--text-bright)">${s}</div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">AVG REV/TRIP</div>
            <div class="av-summary__value" style="color:var(--green)">${A(r)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=A(n),document.getElementById("av-total-revenue").style.color=n>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=i+"/"+e,document.getElementById("av-subsector").textContent=a;const o=document.getElementById("av-list");if(gn==="error"){o.innerHTML='<div class="av-empty"><div class="av-empty__text">'+y(Je&&Je.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(Te.length===0){o.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let l="";for(let v=0;v<Te.length;v++){const c=Te[v],m=c.shipping_routes||{},u=_t===v,b=(ne||[]).find(M=>M.active_claim_id===c.id)?.status,p=b==="in_port"?"loading":b==="in_transit"?"in_transit":b==="anchored"?"stranded":"idle";let h=p.toUpperCase().replace("_"," "),x="av-status--idle",$="";if(p==="loading")x="av-status--loading",h="LOADING";else if(p==="in_transit"){x="av-status--transit";const M=c.transit_started_tick||t,D=(c.transit_arrives_tick||M+(m.transit_ticks||2))-M,S=Math.max(0,Math.min(t-M,D)),z=D>0?Math.round(S/D*100):0;h="IN TRANSIT ("+S+"/"+D+")",$='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+z+'%"></div></div>'}const C=Number(c.revenue_per_transit||0),E=Number(c.market_share_pct||0),w=c.transits_completed||0,I=Number(c.total_revenue||0),L=ai[m.demand_level]||"#6a6660";if(l+='<div class="av-item" onclick="avToggle('+v+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+y(m.origin_port||"?")+" → "+y(m.destination_port||"?")+'</div><span class="av-status '+x+'">'+h+'</span></div><div class="av-item__cargo">'+y(m.goods_name||"Unknown")+" · "+y(m.vessel_class||"?")+"</div>"+$+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+A(C)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+E.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+w+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+A(I)+"</div></div></div>",u){l+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+y(m.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+y(m.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+y((m.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+y(m.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(m.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+A(Number(m.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(m.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(m.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+L+'">'+(m.demand_level||"?")+"</span></div>"+(m.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+y(m.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(c.claimed_at_tick||"?")+"</span></div>";var d=(ne||[]).find(function(M){return M.active_claim_id===c.id});d?l+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+y(d.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(d.fuel>50?"#5c5":d.fuel>20?"#ca5":"#c55")+'">'+(d.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(d.condition>50?"#5c5":d.condition>30?"#ca5":"#c55")+'">'+(d.condition||0)+"%</div></div></div></div>":l+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+c.id+"','"+(m.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`,l+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+c.id+`')">RELEASE ROUTE</button></div>`}l+="</div>"}o.innerHTML=l}let Xe=[];const to={stranded:{label:"STRANDED"},mechanical_failure:{label:"MECHANICAL"},collision:{label:"COLLISION"},fire:{label:"FIRE"},piracy:{label:"PIRACY"},storm_damage:{label:"STORM"}};async function ki(){if(!f){Xe=[],Fi();return}const{data:t,error:e}=await _.from("vessel_incidents").select("id, vessel_id, nation_id, incident_type, incident_tick, description, severity, status, corp_vessels!vessel_id(id, vessel_name, vessel_class)").eq("faction_id",f.id).eq("status","pending").order("incident_tick",{ascending:!1});e?(console.warn("[VesselIncidents] load failed:",e.message),Xe=[]):Xe=t||[],Fi()}function Fi(){const t=document.getElementById("vi-count"),e=document.getElementById("vi-list");if(!t||!e)return;const i=Xe||[];if(t.textContent=i.length+" PENDING",i.length===0){e.innerHTML=`<div class="vi-empty">
            <div class="vi-empty__text">No pending incidents.<br>Claim-eligible events on your fleet appear here.</div>
        </div>`;return}e.innerHTML=i.map(a=>{const n=to[a.incident_type]||{label:(a.incident_type||"INCIDENT").toUpperCase()},s=a.corp_vessels?.vessel_name||"Unknown Vessel",r=a.severity==="total",o=a.severity?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;margin-left:4px;color:${r?"#000":"var(--amber)"};background:${r?"var(--red)":"var(--amber-faint)"};border:1px solid ${r?"var(--red)":"var(--amber-border)"};">${r?"TOTAL LOSS":"PARTIAL"}</span>`:"";return`<div class="vi-item" data-incident-id="${a.id}">
            <div class="vi-item__head">
                <span class="vi-item__vessel">${y(s)}</span>
                <span class="vi-item__tick">Tick ${a.incident_tick}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0;margin-bottom:6px;flex-wrap:wrap;">
                <span class="vi-item__type" style="margin-bottom:0;">${y(n.label)}</span>
                ${o}
            </div>
            <div class="vi-item__desc">${y(a.description||"")}</div>
            <div class="vi-item__actions">
                <button class="vi-action-btn vi-action-btn--dismiss" onclick="viDismissIncident('${a.id}')">DISMISS</button>
                <button class="vi-action-btn vi-action-btn--file" onclick="viFileClaim('${a.id}')">FILE CLAIM</button>
            </div>
        </div>`}).join("")}let Ge=!1;async function io(t){if(Ge)return;const e=Xe.find(i=>i.id===t);if(e){Ge=!0;try{const{data:i}=await _.from("subsidiary_auto_policies").select("id, principal, deductible_pct, lender_faction_id, policy_terms").eq("insured_vessel_id",e.vessel_id).eq("status","active").limit(1).maybeSingle(),{data:a}=i?{data:null}:await _.from("finance_active_loans").select("id, principal, deductible_pct, lender_faction_id").eq("insured_vessel_id",e.vessel_id).eq("status","current").limit(1).maybeSingle(),n=i||a;if(!n){alert("No active insurance policy covers this vessel. Consider purchasing coverage before the next incident.");return}const s=e.corp_vessels?.vessel_name||"vessel",r=Number(n.principal)||0,o=e.severity==="total"||e.incident_type==="stranded"||!e.severity,l=Math.round(o?r:r*.35),d=`File claim on ${s}?

Severity:    ${o?"Total loss":"Partial loss"}
Claim:       $${l.toLocaleString()}
Deductible:  ${n.deductible_pct||10}%`;if(!confirm(d))return;const v=i?"auto":"deal",c=N?.current_tick||0,{data:m,error:u}=await _.from("insurance_claims").insert({policy_id:n.id,policy_source:v,claimant_faction_id:f.id,insurer_faction_id:n.lender_faction_id,insured_vessel_id:e.vessel_id,claim_amount:l,claim_reason:e.description||`${s} — incident ${e.incident_type}`,policy_terms:n.policy_terms||null,deductible_pct:Number(n.deductible_pct)||10,status:"filed",filed_at_tick:c}).select("id").single();if(u){alert("Failed to file claim: "+u.message);return}const{error:g}=await _.from("vessel_incidents").update({status:"filed",filed_at_tick:c,filed_claim_id:m?.id||null}).eq("id",e.id);g&&console.warn("[VesselIncidents] incident update after file failed:",g.message);try{await _.from("event_log").insert({nation_id:e.nation_id||f.nation_id,faction_id:f.id,event_name:`${f.faction_name||"A corporation"} filed an insurance claim`,category:"corporate",description_chosen:`${f.faction_name||"Corporation"} filed a claim on ${s} for $${Math.round(l).toLocaleString()}.`,fired_at_tick:c})}catch{}await ki()}catch(i){console.error("[VesselIncidents] fileClaim error:",i),alert("File claim failed: "+(i?.message||"unknown error"))}finally{Ge=!1}}}window.viFileClaim=io;async function no(t){if(!Ge&&confirm("Dismiss this incident without filing a claim? The vessel remains in whatever state the tick processor left it.")){Ge=!0;try{const{error:e}=await _.from("vessel_incidents").update({status:"dismissed",filed_at_tick:N?.current_tick||0}).eq("id",t);if(e){alert("Dismiss failed: "+e.message);return}await ki()}finally{Ge=!1}}}window.viDismissIncident=no;function ao(t,e){const i=(ne||[]).filter(function(s){return s.status==="in_port"&&!s.active_claim_id&&s.fuel>=15&&s.condition>=20});let a;i.length===0?a='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':a=i.map(function(s,r){var o=s.fuel>50?"#5c5":s.fuel>20?"#ca5":"#c55",l=s.condition>50?"#5c5":s.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+t+"','"+s.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+y(s.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+y(s.vessel_class||"?")+" · "+(s.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+o+'">'+s.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+l+'">'+s.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var n=document.createElement("div");n.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",n.onclick=function(s){s.target===n&&n.remove()},n.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+i.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+a+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(n)}async function oo(t,e){if(!Bt){Bt=!0;try{var{error:i}=await _.from("corp_vessels").update({status:"in_port",active_claim_id:t}).eq("id",e).eq("faction_id",f.id);if(i){alert("Assignment failed: "+i.message);return}var a=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');a&&a.remove(),await Promise.all([Et(),de()])}catch(n){alert("Assignment failed: "+(n.message||"Network error"))}finally{Bt=!1}}}window.openAssignVesselModal=ao;window.assignVesselToRoute=oo;function Ei(){const t=ie.reduce((o,l)=>o+(l.owned||0),0),e=ie.reduce((o,l)=>o+(l.deployed||0),0),i=Rn(ie),a=t-e;document.getElementById("eq-count").textContent=t+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${e} <span style="font-size:9px;color:var(--text-dim)">/ ${t}</span>
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">AVAILABLE</div>
            <div class="eq-summary__value" style="font-size:14px;color:${a===0?"var(--orange)":"var(--green)"}">
                ${a}
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">MAINT/TICK</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--red)">
                ${A(i)}
            </div>
        </div>`;const n={};for(const o of ie)n[o.equipment_key]=o;let s="";for(let o=1;o<=3;o++){const l=et[o],d=Yt(o),v=Zt===o,c=d.reduce((u,g)=>u+(n[g.key]?.owned||0),0),m=d.reduce((u,g)=>u+(n[g.key]?.deployed||0),0);if(s+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${o})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${v?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${y(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${c>0?`<span class="eq-tier-hdr__count">${m}/${c}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,v)for(const u of d){const g=n[u.key],b=g?.owned||0,p=g?.deployed||0,h=g?.condition||0,x=u.maintenancePerUnit*b,$=b-p,C=b>0&&$===0,E=b>0&&h<65,w=Ui(h),I=g?.assigned_projects||[],L=I.length>0?I.map(M=>M.contract_name||"Project").join(", ").slice(0,30):b>0&&p>0?p+" project"+(p>1?"s":""):"—";s+=`<div class="eq-row${b===0?" unowned":""}">`,s+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${b===0?" dim":""}">${y(u.name)}</span>
                        ${E?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${b>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${C?"var(--orange)":"var(--green)"}">${$}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${p}/${b}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,b>0?s+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${h}%;background:${w}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${w}">${h}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${y(L)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${A(x)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:s+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',s+="</div>"}}document.getElementById("eq-list").innerHTML=s;const r=[1,2,3].map(o=>{const l=et[o],d=Yt(o).reduce((v,c)=>v+(n[c.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${d>0?l.color+"33":"var(--border-0)"};background:${d>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${d>0?"var(--text-bright)":"var(--text-dim)"}">${d}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${A(i)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function so(t){Zt=Zt===t?-1:t,Ei()}async function xn(){if(!f)return;const{data:t,error:e}=await _.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",f.id);e?(console.warn("Failed to load equipment:",e.message),ie=[]):ie=t||[],Ei()}async function ro(){const{data:{user:t}}=await _.auth.getUser();if(!t){window.location.href="login.html";return}const e=new URLSearchParams(location.search).get("faction_id");if(!!e){const{data:c,error:m}=await _.from("factions").select("*").eq("id",e).single();m?console.warn("[Inspector] faction fetch failed:",m.message):c?.faction_type==="corporation"&&(f=c)}if(!f){const{data:c}=await _.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);ke=(c||[]).filter(u=>u.nation_id);const m=sessionStorage.getItem("active_faction_id");if(f=ke.find(u=>u.id===m)||ke.find(u=>u.faction_type==="corporation")||ke[0],!f){await _.auth.signOut(),window.location.href="login.html";return}if(f.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(f.corp_sector!=="Shipping"){const u=Gi[f.corp_sector];if(u){window.location.href=u;return}}}const[a,n]=await Promise.all([f.nation_id?_.from("nations").select("*").eq("id",f.nation_id).single():Promise.resolve({data:null}),_.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(R=a.data),n.error&&console.warn("Shard load failed:",n.error.message),N=n.data;let s=0;if(f?.id){const{data:c}=await _.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",f.id).in("status",["open","bidding"]);if(c)for(const m of c)s+=(m.contract_bids||[]).length}const r=document.getElementById("corp-topbar-container");if(r){const{renderCorpTopBar:c}=await Ln(async()=>{const{renderCorpTopBar:u}=await import("./corp-topbar-BVNorCyj.js");return{renderCorpTopBar:u}},__vite__mapDeps([0,1])),m={};s>0&&(m.home={color:"#c8a832",title:s+" pending bid"+(s!==1?"s":"")+" on your projects"}),c(r,{faction:f,shard:N,activeTab:"operations",allUserFactions:ke,badges:m})}if(N){if(document.getElementById("game-date").textContent=N.current_date||"—",document.getElementById("tick-number").textContent=N.current_tick||"—",N.next_tick_at){const m=(Number(N.tick_interval_hours)||8)*36e5,u=new Date(N.next_tick_at).getTime(),b=u-m+m/2;ei=new Date(b>Date.now()?b:u+m/2),ea()}const c=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");c&&(c.textContent="Next Corp Tick")}const o=document.getElementById("topbar-cash");o&&(o.textContent="CASH: "+vn(Number(f.corp_cash_reserves??0)));const l=document.getElementById("topbar-ap");l&&(l.style.display="none");const d=document.getElementById("nation-pill");d&&(d.textContent=(R?.name||f.nation||"—").toUpperCase());const v=document.getElementById("corp-faction-dropdown");if(v){let c="";for(const m of ke){const u=m.id===f.id,g=m.faction_type==="corporation"?"CORP":"PARTY",b=m.faction_type==="corporation"?"var(--teal)":"var(--amber)";c+=`<div class="corp-dd-item${u?" active":""}" onclick="switchToFaction('${m.id}', '${m.faction_type}')">
                <span class="corp-dd-type" style="color:${b}">${g}</span>
                <span class="corp-dd-name">${y(m.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${y(m.abbreviation||"—")}]</span>
            </div>`}v.innerHTML=c}await Promise.all([kt(),Et(),de(),Ii(),wn(),ki(),Xn()]),zn(f,R,N);try{await Yn(_,{faction:f,nation:R,shard:N},"auto-services-container")}catch(c){console.error("[CorpOps] Auto-services init failed:",c)}document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}async function lo(){await _.auth.signOut(),window.location.href="login.html"}function co(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function po(t,e){const i=document.getElementById("corp-faction-dropdown");if(i&&i.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),e==="corporation"){const a=(ke||[]).find(n=>n.id===t);window.location.href=Gi[a?.corp_sector]||"corp-operations.html"}else window.location.href="dashboard.html"}document.addEventListener("click",t=>{const e=document.getElementById("faction-switcher"),i=document.getElementById("corp-faction-dropdown");i&&e&&!e.contains(t.target)&&i.classList.remove("open")});document.addEventListener("keydown",t=>{t.key==="Escape"&&st()});window.doLogout=lo;window.toggleCorpDropdown=co;window.switchToFaction=po;window.setFilter=ta;window.arSetFilter=Pa;window.arSelectRoute=ja;window.arClaimRoute=Xa;window.arApplyToService=Ya;window.raClose=$i;window.raSelectVessel=Qa;window.raSetRate=Ka;window.raSubmitApplication=Ja;window.avToggle=Za;window.avRelease=eo;window.openContractDetail=ln;window.closeContractDetail=st;window.toggleWhRow=ba;window.toggleEqTier=so;window.switchEmNation=Ia;window.setEmType=Sa;window.setEmListing=Aa;window.setEmQty=Ma;window.purchaseEquipment=qa;window.setPrMat=wa;window.setPrTier=ka;window.setPrQty=Ea;window.purchaseMaterial=Ta;let ve=null,_e={},Y=120,xe=15,si={},Fe=[];async function fo(){if(!Me)return;if(Ve[Me.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}ve=Me,si={};try{const{data:i}=await _.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",f.id);for(const a of i||[])si[ft(a.material_key)]=Number(a.quantity||0)}catch{}Fe=[];try{const{data:i}=await _.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",ve.id).in("status",["pending","won"]);Fe=(i||[]).filter(a=>a.faction_id!==f?.id).map(a=>({name:a.factions?.faction_name||"Unknown",ticker:a.factions?.corp_ticker||"???",price:Number(a.bid_price||0),quality:Number(a.estimated_quality||0),status:a.status}))}catch{}_e={};const t=ve.required_materials||{};for(const i of Object.keys(t))_e[i]="STD";const e=ve.required_workforce||{};Y=Number(e.general||0)+Number(e.skilled||0)||120,xe=15,st(),Tt()}function Ti(){document.getElementById("bid-assembly-overlay")?.remove(),ve=null}function mo(t,e){_e[t]=e,Tt()}function vo(t){Y=t,Tt()}function uo(t){xe=t,Tt()}function Tt(){if(document.getElementById("bid-assembly-overlay")?.remove(),!ve)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=ve,a=i.issuer_type==="GOVERNMENT",n=R?.name||f?.nation||"—",s=Number(i.budget_ceiling||0),r=Number(i.timeline_ticks||8),o=i.required_materials||{},l=Object.keys(o),d={LOW:.5,STD:1,HIGH:2},v={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},c={LOW:"Low",STD:"Standard",HIGH:"High"},m={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},u=si||{};let g=0,b="";for(const O of l){const W=Number(o[O]||0),Mi=_e[O]||"STD",qi=m[O]||3e5,In=d[Mi],Sn=Math.round(qi*In),Ni=W*Sn;g+=Ni;const An=O.replace(/_/g," ").replace(/\b\w/g,$e=>$e.toUpperCase()),Li=Number(u[O]||0),At=Math.max(0,W-Li),Mn=At===0?e.greenBright:At<W?e.yellow:e.red,qn=At===0?"✓ IN STOCK":`${Li}/${W}`;b+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${An}</span>
                <div style="font-family:${t};font-size:7px;color:${Mn};margin-top:1px">${qn}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${t};font-size:9px;color:${e.muted}">${W.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map($e=>{const Mt=Mi===$e,zi=v[$e],Nn=T(Math.round(qi*d[$e]));return`<span onclick="bidSetGrade('${O}','${$e}')" style="padding:2px 6px;font-family:${t};font-size:7px;font-weight:700;cursor:pointer;color:${Mt?"#000":e.dim};background:${Mt?zi:"transparent"};border:1px solid ${Mt?zi:e.border}" title="${Nn}/unit">${c[$e]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${t};font-size:10px;color:${e.text}">${T(Ni)}</span></div>
        </div>`}const p=i.required_workforce||{},h=Number(p.general||0)+Number(p.skilled||0)||100,x=Math.max(40,Math.round(h*.5)),$=h*2,C=[x,Math.round(h*.75),h,Math.round(h*1.5),$],E=Math.max(0,Math.min(1,(Y-x)/($-x||1))),w=r,I=Math.round(4.5-E*8),L=Math.max(Math.round(w*.6),w+I),M=I>0?`+${I}mo`:I<0?`${I}mo`:"On schedule",j=I>0?e.red:I<0?e.greenBright:e.yellow,D=15200,S=Y*D*L,z=s,F=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:z>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:z>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:z>1e7}].filter(O=>O.required),k=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),q=F.filter(O=>!k.has(O.name)).reduce((O,W)=>O+W.cost,0),B=4e5,U=g+S+q+B,X=Math.round(U*(xe/100)),pe=U+X,G=pe>s,It=X,he=G?0:Math.max(0,Math.min(100,Math.round(100-pe/s*100+30))),Ai=he>70?e.greenBright:he>40?e.yellow:he>0?e.orange:e.red,Tn=G?"OVER CEILING":he>70?"STRONG":he>40?"COMPETITIVE":he>20?"WEAK":"UNLIKELY",St=Object.values(_e),fe=St.length>0?Math.round(St.reduce((O,W)=>O+(W==="HIGH"?85:W==="STD"?65:45),0)/St.length):50,rt=fe>=75?e.greenBright:fe>=50?e.yellow:fe>=25?e.orange:e.red,Cn=fe>=75?"EXCELLENT":fe>=50?"FAIR":fe>=25?"POOR":"BAD",Oe=document.createElement("div");Oe.id="bid-assembly-overlay",Oe.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",Oe.addEventListener("click",O=>{O.target===Oe&&Ti()}),Oe.innerHTML=`
    <div style="width:740px;max-height:94vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <!-- HEADER -->
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 8px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n.toUpperCase()}</span>
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${i.name}</span>
                    <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${a?e.accentBright:e.gold};background:${a?"rgba(163,176,126,0.1)":"rgba(200,168,50,0.08)"};border:1px solid ${a?"rgba(163,176,126,0.2)":"rgba(200,168,50,0.2)"}">${a?"GOV":"PRIVATE"}</span>
                </div>
                <span onclick="closeBidAssembly()" style="font-family:${t};font-size:14px;color:${e.dim};cursor:pointer;padding:0 4px">×</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:${t};font-size:9px;color:${e.dim}">${i.project_code||"—"}</span>
                <span style="font-family:${t};font-size:9px;color:${e.dim}">·</span>
                <span style="font-size:10px;color:${e.accent}">${i.issuer_name||"—"}</span>
                <span style="font-family:${t};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${t};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${T(s)}</span></span>
                <span style="font-family:${t};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${t};font-size:9px;color:${e.muted}">Timeline: <span style="color:${e.text};font-weight:700">${r} months</span></span>
            </div>
        </div>

        <!-- CONTENT — two columns -->
        <div style="flex:1;display:flex;overflow:hidden;">

            <!-- LEFT: Cost Assembly -->
            <div style="flex:1;border-right:1px solid ${e.border};overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Materials</span>
                </div>
                <div style="display:flex;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="flex:1.2;font-family:${t};font-size:7px;color:${e.dim}">MATERIAL</span>
                    <span style="flex:0.5;font-family:${t};font-size:7px;color:${e.dim};text-align:center">QTY</span>
                    <span style="flex:1.2;font-family:${t};font-size:7px;color:${e.dim};text-align:center">GRADE</span>
                    <span style="flex:0.8;font-family:${t};font-size:7px;color:${e.dim};text-align:right">COST</span>
                </div>
                ${b}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${t};font-size:9px;color:${e.muted}">MATERIALS TOTAL</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${T(g)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${C.map(O=>`<span onclick="bidSetWorkers(${O})" style="padding:2px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${Y===O?"#000":e.dim};background:${Y===O?e.accent:"transparent"};border:1px solid ${Y===O?e.accent:e.border}">${O}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">${Y} × $${D.toLocaleString()}/tick × ${L} ticks</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${T(S)}</span>
                    </div>
                    <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-family:${t};font-size:8px;color:${e.dim}">WORKFORCE REQUIRED</span>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <span style="font-family:${t};font-size:7px;color:#8b9a6b">General: ${Math.ceil(Y*.8)}</span>
                            <span style="font-family:${t};font-size:7px;color:#c8a832">Skilled: ${Math.ceil(Y*.15)}</span>
                            <span style="font-family:${t};font-size:7px;color:#c84">Innovative: ${Math.ceil(Y*.05)}</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${j}">${L}mo <span style="font-size:8px;opacity:0.7">(${M})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${F.map(O=>{const W=k.has(O.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${t};font-size:8px;font-weight:700;color:${W?e.greenBright:e.orange}">${W?"✓":"○"}</span>
                            <span style="font-size:10px;color:${W?e.muted:e.text}">${O.name}</span>
                        </div>
                        ${W?`<span style="font-family:${t};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${t};font-size:9px;color:${e.redDim}">${T(O.cost)}</span>
                                <span style="font-family:${t};font-size:7px;color:${e.dim};margin-left:4px">${O.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${t};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${T(q)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${T(B)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:g},{l:"Labor",v:S},{l:"Permits",v:q},{l:"Overhead",v:B}].map(O=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${O.l}</span>
                    <span style="font-family:${t};font-size:10px;color:${e.redDim}">${T(O.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${T(U)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${t};font-size:9px;color:${e.dim}">MARKUP %</span>
                        <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.gold}">${xe}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${xe}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${t};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${G?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${t};font-size:22px;font-weight:700;color:${G?e.red:e.gold}">${T(pe)}</div>
                    ${G?`<div style="font-family:${t};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${T(s)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${t};font-size:14px;font-weight:700;color:${It>0?e.greenBright:e.dim}">+${T(It)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${Ai}">${Tn}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${he}%;height:100%;background:${Ai}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${t};font-size:11px;font-weight:700;color:${rt}">${fe}</span>
                            <span style="font-family:${t};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${t};font-size:8px;font-weight:700;color:${rt}">${Cn}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${fe}%;height:100%;background:${rt}"></div></div>
                    <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${Fe.length===0?`<div style="font-family:${t};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${Fe.map(O=>`<span style="padding:2px 6px;font-family:${t};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${O.name} <span style="color:${e.dim}">Q:${O.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:3px">${Fe.length} competing bid${Fe.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${G?e.red:e.gold}">${T(pe)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${e.greenBright}">+${T(It)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${rt}">${fe}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${t};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${G?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${t};font-size:10px;font-weight:700;letter-spacing:1px;color:${G?e.dim:"#000"};background:${G?e.border:e.gold};cursor:${G?"not-allowed":"pointer"};opacity:${G?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(Oe)}let jt=!1;async function yo(){if(jt||!ve)return;const t=ve,e=t.required_materials||{},i=Object.keys(e),a=Number(t.budget_ceiling||0),n=Number(t.timeline_ticks||8),s={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},r={LOW:.5,STD:1,HIGH:2};let o=0;for(const D of i){const S=Number(e[D]||0),z=_e[D]||"STD",H=s[D]||3e5;o+=S*Math.round(H*r[z])}const l=15200,d=t.required_workforce||{},v=Number(d.general||0)+Number(d.skilled||0)||100,c=Math.max(40,Math.round(v*.5)),m=v*2,u=Math.max(0,Math.min(1,(Y-c)/(m-c||1))),g=Math.round(4.5-u*8),b=Math.max(Math.round(n*.6),n+g),p=Y*l*b,h=a,x=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:h>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:h>5e7},{name:"Fire Safety Certification",cost:12e4,required:h>1e7}],$=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),C=x.filter(D=>D.required&&!$.has(D.name)).reduce((D,S)=>D+S.cost,0),w=o+p+C+4e5,I=Math.round(w*(xe/100)),L=w+I;if(L>a){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const M=Object.values(_e),j=M.length>0?Math.round(M.reduce((D,S)=>D+(S==="HIGH"?85:S==="STD"?65:45),0)/M.length):50;if(confirm('Submit bid for "'+t.name+`"?

Bid Price: `+T(L)+`
Est. Cost: `+T(w)+`
Markup: `+xe+"% ("+T(I)+`)
Quality: `+j+`/100
Workers: `+Y+`

Once submitted, your bid cannot be changed.`)){jt=!0;try{const{data:D}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),S=D?.current_tick||0,z={};for(const F of i)z[F]=_e[F]||"STD";const{error:H}=await _.from("contract_bids").insert({contract_id:t.id,faction_id:f.id,bid_price:L,material_grades:z,labor_count:Y,markup_pct:xe,estimated_cost:w,estimated_quality:j,status:"pending",submitted_at_tick:S});if(H)throw H;t.status==="open"&&await _.from("construction_contracts").update({status:"bidding"}).eq("id",t.id).eq("status","open"),Ti(),alert(`Bid submitted successfully!

Contract: `+t.name+`
Your Bid: `+T(L)+`
Quality: `+j+`/100

Bids will be resolved when the bidding window closes (`+(t.bidding_ends_tick?"tick "+t.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Re=="function"&&await Re()}catch(D){alert("Bid submission failed: "+D.message)}finally{jt=!1}}}window.openBidAssembly=fo;window.closeBidAssembly=Ti;window.bidSetGrade=mo;window.bidSetWorkers=vo;window.bidSetMarkup=uo;window.submitBidAssembly=yo;let Ht=!1;async function go(t){if(Ht)return;const e=1e6,i=Number(f?.corp_cash_reserves??0);if(i<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){Ht=!0;try{const a=i-e,{error:n}=await _.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);if(n)throw n;const{error:s}=await _.from("contract_bids").delete().eq("contract_id",t).eq("faction_id",f.id);if(s)throw s;f.corp_cash_reserves=a,typeof subUpdateTopbarCash=="function"&&subUpdateTopbarCash(a),alert("Bid retracted. $1M penalty applied."),st(),await Re()}catch(a){alert("Failed to retract bid: "+(a.message||"Unknown error"))}finally{Ht=!1}}}window.retractBid=go;let nt=[],Ie=0,ce=null,Ft=!1,Ut=!1,Gt=!1;async function _o(){if(!Me||Ut)return;Ut=!0,ce=Me,Ie=0;const{data:t,error:e}=await _.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ce.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(Ut=!1,e){alert("Failed to load bids: "+e.message);return}nt=(t||[]).map(i=>({...i,corp:i.factions?.faction_name||"Unknown",abbr:i.factions?.corp_ticker||"???",subsector:i.factions?.corp_subsector||"—"})),st(),bn()}function Ct(){document.getElementById("bid-review-overlay")?.remove(),ce=null}function xo(t){Ie=t,bn()}async function bo(){if(Ft||nt.length===0)return;const t=nt[Ie];if(!(!t?.id||!t.faction_id)&&confirm("Accept bid from "+t.corp+`?

Bid Price: `+T(t.bid_price)+`
Quality: `+t.estimated_quality+`/100
Workers: `+t.labor_count+`

This will award the contract. The project begins immediately.`)){Ft=!0;try{const{data:e}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=e?.current_tick||0,{error:a}=await _.from("contract_bids").update({status:"won"}).eq("id",t.id);if(a)throw a;const{error:n}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",ce.id).neq("id",t.id);if(n)throw n;const{error:s}=await _.from("construction_contracts").update({status:"awarded",awarded_to_faction:t.faction_id,awarded_at_tick:i}).eq("id",ce.id);if(s)throw s;Ct(),alert("Contract awarded to "+t.corp+`!

Bid: `+T(t.bid_price)+`
Project begins immediately.`),typeof Re=="function"&&await Re()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{Ft=!1}}}async function ho(){if(!(!ce||Gt)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){Gt=!0;try{const{error:t}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",ce.id);if(t)throw t;const{error:e}=await _.from("construction_contracts").update({status:"expired"}).eq("id",ce.id);if(e)throw e;Ct(),alert("All bids declined. Contract cancelled."),typeof Re=="function"&&await Re()}catch(t){alert("Failed: "+(t.message||t))}finally{Gt=!1}}}function bn(){if(document.getElementById("bid-review-overlay")?.remove(),!ce||nt.length===0)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=ce,a=nt;Ie>=a.length&&(Ie=0);const n=a[Ie],s=Number(i.budget_ceiling||0),r=Number(i.timeline_ticks||36),o=Math.min(...a.map(u=>u.bid_price)),l=Math.max(...a.map(u=>u.estimated_quality||0));let d="";for(let u=0;u<a.length;u++){const g=a[u],b=u===Ie,p=g.bid_price===o,h=(g.estimated_quality||0)===l,x=g.bid_price>s;d+=`
        <div onclick="reviewSelectBid(${u})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${b?e.accent:"transparent"};background:${b?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${g.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${g.corp}</span>
                ${p?`<span style="font-family:${t};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${h?`<span style="font-family:${t};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${t};font-size:14px;font-weight:700;color:${x?e.red:e.text}">${T(g.bid_price)}</div>
                    ${x?`<div style="font-family:${t};font-size:7px;color:${e.red}">OVER BUDGET</div>`:""}
                </div>
                <div style="flex:0.8;padding:5px 10px;border-right:1px solid ${e.border};text-align:center">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">QUALITY</div>
                    <div style="font-family:${t};font-size:14px;font-weight:700;color:${(g.estimated_quality||0)>=75?e.greenBright:(g.estimated_quality||0)>=55?e.yellow:e.orange}">${g.estimated_quality||0}</div>
                </div>
                <div style="flex:0.8;padding:5px 10px;text-align:center">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">WORKERS</div>
                    <div style="font-family:${t};font-size:14px;font-weight:700;color:${e.text}">${g.labor_count||0}</div>
                </div>
            </div>
        </div>`}const v=n.bid_price>s,c=s>0?Math.round(n.bid_price/s*100):0,m=document.createElement("div");m.id="bid-review-overlay",m.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",m.addEventListener("click",u=>{u.target===m&&Ct()}),m.innerHTML=`
    <div style="width:640px;max-height:92vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${i.name}</span>
                    <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${e.gold};background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">YOUR PROJECT</span>
                </div>
                <span onclick="closeBidReview()" style="font-family:${t};font-size:14px;color:${e.dim};cursor:pointer">×</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:4px;font-family:${t};font-size:9px;color:${e.dim};">
                <span>${i.project_code||"—"}</span>
                <span>·</span>
                <span>Budget: <span style="color:${e.text};font-weight:700">${T(s)}</span></span>
                <span>·</span>
                <span>Timeline: <span style="color:${e.text};font-weight:700">${r}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${a.length} BID${a.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${t};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${T(o)}</span></span>
                <span>Best Quality: <span style="color:${e.accent}">${l}</span></span>
            </div>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${e.border};overflow:auto;">
                ${d}
            </div>
            <div style="width:250px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.gold}">${n.abbr}</span>
                        <span style="font-size:12px;font-weight:700;color:${e.text}">${n.corp}</span>
                    </div>
                    <div style="font-family:${t};font-size:8px;color:${e.dim};margin-top:2px">${n.subsector}</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="font-family:${t};font-size:8px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Breakdown</span>
                </div>
                ${[{l:"Materials",v:Number(n.estimated_cost||0)*.45},{l:"Labor",v:Number(n.estimated_cost||0)*.45},{l:"Overhead",v:Number(n.estimated_cost||0)*.1}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${t};font-size:10px;color:${e.muted}">${T(Math.round(u.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${v?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${t};font-size:14px;font-weight:700;color:${v?e.red:e.gold}">${T(n.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${t};font-size:9px;font-weight:700;color:${v?e.red:e.greenBright}">${v?"OVER":"WITHIN"} — ${c}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,c)}%;height:100%;background:${v?e.red:e.accent}"></div></div>
                </div>
                ${[{l:"Quality",v:n.estimated_quality+"/100",c:(n.estimated_quality||0)>=75?e.greenBright:(n.estimated_quality||0)>=55?e.yellow:e.orange},{l:"Markup",v:n.markup_pct+"%",c:e.muted},{l:"Workers",v:n.labor_count+" workers",c:e.text}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${t};font-size:10px;font-weight:700;color:${u.c}">${u.v}</span>
                </div>`).join("")}
                <div style="flex:1"></div>
            </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${e.gold}">${T(n.bid_price)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${e.text}">${n.corp}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${(n.estimated_quality||0)>=75?e.greenBright:e.yellow}">${n.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(m)}const Ne={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},$o={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function hn(t){return t>=75?"#5c5":t>=50?"#ca5":t>=25?"#c84":"#c55"}function wo(t){return t>=60?"#5c5":t>=30?"#ca5":t>=15?"#c84":"#c55"}async function de(){if(!f)return;const{data:t,error:e}=await _.from("corp_vessels").select("*").eq("faction_id",f.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),ne=t||[],it=null;const{data:i,error:a}=await _.from("vessel_orders").select("id, vessel_name, vessel_class, shipyard_nation, ordered_at_tick, delivery_tick, build_ticks, balance_due").eq("faction_id",f.id).eq("status","building").order("delivery_tick",{ascending:!0});a&&console.warn("Failed to load vessel orders:",a.message),tn=i||[],Qe={},mt={};try{const n=ne.map(s=>s.id);if(n.length>0){const{data:s}=await _.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",n).in("status",["current"]);for(const o of s||[])o.insured_vessel_id&&(Qe[o.insured_vessel_id]=!0);const{data:r}=await _.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",f.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const o of r||[])o.insured_vessel_id&&!Qe[o.insured_vessel_id]&&(mt[o.insured_vessel_id]=!0)}}catch(n){console.warn("Failed to load vessel insurance status:",n.message)}$n()}function ko(t){it=it===t?null:t,$n()}function $n(){const t=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),i=document.getElementById("fl-list"),a=document.getElementById("fl-footer");if(!t||!i)return;const n=ne,s=tn||[],r=s.length;t.textContent=n.length+" VESSEL"+(n.length!==1?"S":"")+(r>0?" · "+r+" BUILDING":"");const o=n.filter(p=>p.status==="in_transit").length,l=n.filter(p=>p.status==="in_port"||p.status==="anchored").length,d=n.filter(p=>p.status==="dry_dock").length,v=n.reduce((p,h)=>p+(h.base_maintenance||0),0),c=r>0?[{label:"TRANSIT",value:o,color:"#5a8aaa"},{label:"IN PORT",value:l,color:"#8b9a6b"},{label:"BUILDING",value:r,color:"var(--amber)"},{label:"DRY DOCK",value:d,color:"#c84"},{label:"MAINT/TICK",value:T(v),color:"#a44"}]:[{label:"TRANSIT",value:o,color:"#5a8aaa"},{label:"IN PORT",value:l,color:"#8b9a6b"},{label:"DRY DOCK",value:d,color:"#c84"},{label:"MAINT/TICK",value:T(v),color:"#a44"}];e.innerHTML=c.map((p,h)=>`<div style="flex:1;padding:5px 8px;text-align:center;${h<c.length-1?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${p.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${p.color};margin-top:1px;">${p.value}</div>
    </div>`).join("");const m=N?.current_tick||0;let u="";for(const p of s){const h=Math.max(1,Number(p.build_ticks)||1),x=Number(p.delivery_tick)||0,$=Number(p.ordered_at_tick)||0,C=Math.max(0,x-m),E=Math.max(0,Math.min(h,m-$)),w=Math.max(0,Math.min(100,Math.round(E/h*100))),I=Ne[p.vessel_class]||{color:"#9e9a92",label:(p.vessel_class||"?").toUpperCase()},L=C===0?"Delivering this tick":`Delivery in ${C} tick${C!==1?"s":""}`;u+=`<div style="border-bottom:1px solid var(--border-0);border-left:2px solid var(--amber);">
            <div style="padding:7px 14px;">
                <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(p.vessel_name||"Unnamed Vessel")}</span>
                    <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${I.color};background:${I.color}12;border:1px solid ${I.color}25;">${I.label}</span>
                    <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:var(--amber);background:var(--amber-faint);border:1px solid var(--amber-border);">BUILDING</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">
                    Shipyard: ${y(p.shipyard_nation||"—")} · ${y(L)} · Balance $${Math.round(Number(p.balance_due)||0).toLocaleString()} due on delivery
                </div>
                <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:2px;">
                    <span>BUILD PROGRESS</span>
                    <span style="color:var(--amber);font-weight:700;">${w}%</span>
                </div>
                <div style="height:5px;background:var(--bg-3);border:1px solid var(--border-0);">
                    <div style="width:${w}%;height:100%;background:var(--amber);transition:width 0.3s;"></div>
                </div>
            </div>
        </div>`}n.length===0&&s.length===0?i.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':n.length===0?i.innerHTML=u:i.innerHTML=u+n.map((p,h)=>{const x=it===h,$=Ne[p.vessel_class]||{color:"#666",label:"?"},C=$o[p.status]||{color:"#666",label:"?"},E=hn(p.condition),w=wo(p.fuel),I=p.condition<50||p.fuel<20,L=p.status==="in_transit",M=p.status==="dry_dock",j=N?.current_tick||0,D=Math.max(0,Math.floor((j-(p.built_at_tick||0))/12));let S=`<div onclick="flSelectVessel(${h})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${I?p.condition<50?E:w:"transparent"};background:${x?$.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;S+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(p.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${$.color};background:${$.color}12;border:1px solid ${$.color}25;">${$.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${C.color};background:${C.color}12;border:1px solid ${C.color}25;">${C.label}</span>
            </div>`;const z=p.current_port_nation_id?"In port":L?"At sea":"—";if(S+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${y(z)}</div>`,S+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${E};">${p.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${p.condition}%;height:100%;background:${E};"></div></div>
                </div>
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">FUEL</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${w};">${p.fuel}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${p.fuel}%;height:100%;background:${w};"></div></div>
                </div>
            </div>`,S+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(p.capacity_dwt||0).toLocaleString()} ${p.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.7;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${D}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${T(p.base_maintenance)}</div>
                </div>
            </div>`,M&&p.drydock_until_tick){const H=Math.max(0,p.drydock_until_tick-j);S+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${H} tick${H!==1?"s":""} remaining</span>
                </div>`}if(x){S+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const H=[{label:"VESSEL CLASS",value:p.vessel_class},{label:"BUILT",value:"Tick "+(p.built_at_tick||0)},{label:"FUEL CAPACITY",value:(p.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:p.last_refurbish_tick?"Tick "+p.last_refurbish_tick:"N/A"}];for(let U=0;U<H.length;U++)S+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${U<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${H[U].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${H[U].value}</span>
                    </div>`;S+="</div>";const F=L||M,k=Math.round((p.purchase_price||3e6)*.08*(1+(100-p.condition)/100)),q=Math.round((p.fuel_capacity||1e3)*50*(1-p.fuel/100)),B=Math.round((p.purchase_price||3e6)*(p.condition/100)*.6);if(S+=`<div style="display:flex;gap:4px;">
                    <div onclick="${F?"":"flRefurbish('"+p.id+"',"+k+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${F?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${F?"var(--text-dim)":"#5c5"};border:1px solid ${F?"var(--border-0)":"#2a5a3a"};background:${F?"transparent":"rgba(74,170,136,0.06)"};opacity:${F?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${T(k)}</span></div>
                    <div onclick="${L?"":"flRefuel('"+p.id+"',"+q+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${L?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${L?"var(--text-dim)":"#c86a4a"};border:1px solid ${L?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${L?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${T(q)}</span></div>
                    <div onclick="${F?"":"flSell('"+p.id+"','"+y(p.vessel_name).replace(/'/g,"")+"',"+B+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${F?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${F?"var(--text-dim)":"#c84"};border:1px solid ${F?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${F?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${T(B)}</span></div>
                </div>`,!L){const U=Qe&&Qe[p.id],X=mt&&mt[p.id];S+='<div style="display:flex;gap:4px;margin-top:4px;">',U?S+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${p.id}','${y(p.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:X?S+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':S+=`<div onclick="event.stopPropagation();flRequestInsurance('${p.id}','${y(p.vessel_name).replace(/'/g,"")}',${p.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,S+=`<div onclick="flRename('${p.id}','${y(p.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,S+="</div>"}L&&(S+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),M&&(S+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),S+="</div>"}return S+="</div></div>",S}).join("");const g={};for(const p of n)g[p.vessel_class]=(g[p.vessel_class]||0)+1;let b='<div style="display:flex;gap:6px;">';for(const[p,h]of Object.entries(Ne))g[p]&&(b+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${h.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${h.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${g[p]}</span>
        </div>`);b+="</div>",b+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${T(v)}/tick</span>`,a.innerHTML=b}let te=!1;async function Eo(t,e){if(te||!f)return;const i=(ne||[]).find(u=>u.id===t);if(!i)return;const a=i.current_port_nation_id||null;let n="state",s=3,r=3,o=null,l="State Dry Dock (3x cost, 3 ticks)";if(a){const{data:u}=await _.from("corp_properties").select("id").eq("faction_id",f.id).eq("nation_id",a).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(u)n="own",s=1,r=2,l="Your Dry Dock (base cost, 2 ticks)";else{const{data:g}=await _.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",f.id).eq("nation_id",a).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();g&&(n="other",s=1.2,r=2,o=g.faction_id,l=(g.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else l="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const d=Math.round(e*s),{data:v}=await _.from("factions").select("corp_cash_reserves").eq("id",f.id).single(),c=Number(v?.corp_cash_reserves??0);if(c<d){alert("Insufficient cash. Need "+T(d)+", have "+T(c)+".");return}if(!confirm("Send "+(i.vessel_name||"vessel")+` to dry dock?

Dock: `+l+`
Cost: `+T(d)+`
Duration: `+r+` ticks
Condition restored to 85-100%.`))return;te=!0;const m=N?.current_tick||0;try{const{error:u}=await _.from("factions").update({corp_cash_reserves:c-d}).eq("id",f.id);if(u){alert("Failed: "+u.message);return}if(n==="other"&&o){const b=d-e,{data:p}=await _.from("factions").select("corp_cash_reserves").eq("id",o).single();p&&await _.from("factions").update({corp_cash_reserves:Number(p.corp_cash_reserves||0)+b}).eq("id",o)}const{error:g}=await _.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:m+r,active_claim_id:null}).eq("id",t);if(g){await _.from("factions").update({corp_cash_reserves:c}).eq("id",f.id),alert("Failed: "+g.message);return}f.corp_cash_reserves=c-d,await de()}catch(u){alert("Dry dock failed: "+(u.message||"Error"))}finally{te=!1}}async function To(t,e){if(te||!f)return;if(e<=0){alert("Fuel tanks are already full.");return}const i=(ne||[]).find(c=>c.id===t);if(!i)return;const a=i.current_port_nation_id||f.nation_id;let n="state",s=3,r=null,o="State Fuel (3x cost) — no private depot in port";if(a){const{data:c}=await _.from("corp_properties").select("id").eq("faction_id",f.id).eq("nation_id",a).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(c)n="own",s=1,o="Your Fuel Depot (base cost)";else{const{data:m}=await _.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",f.id).eq("nation_id",a).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();m&&(n="other",s=1.15,r=m.faction_id,o=(m.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const l=Math.round(e*s),{data:d}=await _.from("factions").select("corp_cash_reserves").eq("id",f.id).single(),v=Number(d?.corp_cash_reserves??0);if(v<l){alert("Insufficient cash. Need "+T(l)+", have "+T(v)+".");return}if(confirm("Refuel "+(i.vessel_name||"vessel")+`?

Source: `+o+`
Cost: `+T(l)+`
Fuel restored to 100%.`)){te=!0;try{const{error:c}=await _.from("factions").update({corp_cash_reserves:v-l}).eq("id",f.id);if(c){alert("Failed: "+c.message);return}if(n==="other"&&r){const u=l-e,{data:g}=await _.from("factions").select("corp_cash_reserves").eq("id",r).single();g&&await _.from("factions").update({corp_cash_reserves:Number(g.corp_cash_reserves||0)+u}).eq("id",r)}const{error:m}=await _.from("corp_vessels").update({fuel:100}).eq("id",t);if(m){await _.from("factions").update({corp_cash_reserves:v}).eq("id",f.id),alert("Failed: "+m.message);return}f.corp_cash_reserves=v-l,await de()}catch(c){alert("Refuel failed: "+(c.message||"Error"))}finally{te=!1}}}async function Co(t,e,i){if(te||!f||!N||!confirm("List "+e+" on the Ship Market for "+T(i)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;te=!0;const a=N.current_tick||0,n=ne.find(l=>l.id===t);if(!n){te=!1;return}const s=Math.max(0,a-(n.built_at_tick||0)),{error:r}=await _.from("ship_market_listings").insert({nation_id:f.nation_id,vessel_name:n.vessel_name,vessel_class:n.vessel_class,capacity_dwt:n.capacity_dwt,capacity_unit:n.capacity_unit,condition:n.condition,fuel:n.fuel,age_ticks:s,fuel_capacity:n.fuel_capacity,base_maintenance:n.base_maintenance,asking_price:i,purchase_price_new:n.purchase_price||i,seller_type:"CORP",seller_name:f.faction_name,seller_faction_id:f.id,sale_reason:"Listed for sale by "+(f.faction_name||"corporation"),status:"available",listed_at_tick:a});if(r){alert("Failed to create listing: "+r.message),te=!1;return}const{error:o}=await _.from("corp_vessels").delete().eq("id",t);if(o){await _.from("ship_market_listings").delete().eq("seller_faction_id",f.id).eq("vessel_name",n.vessel_name).eq("listed_at_tick",a),alert("Failed to remove vessel: "+o.message),te=!1;return}te=!1,it=null,await Promise.all([de(),Ii()])}async function Io(t,e){const i=prompt("Rename vessel:",e);if(!i||i.trim()===e||i.trim().length<2)return;const{error:a}=await _.from("corp_vessels").update({vessel_name:i.trim().slice(0,40)}).eq("id",t);if(a){alert("Failed: "+a.message);return}await de()}async function So(t,e,i){if(!f||!N||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+T(i)))return;const a=N.current_tick||0,{error:n}=await _.from("finance_loan_requests").insert({requesting_faction_id:f.id,nation_id:f.nation_id,request_type:"insurance",insured_vessel_id:t,amount:i,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:a,expires_tick:a+12});if(n){n.message.includes("duplicate")||n.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+n.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await de()}let Vt=!1;async function Ao(t,e){if(Vt||!f||!N)return;const i=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!i||i.trim().length<5)return;const a=N.current_tick||0,{data:n}=await _.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",t).eq("status","current").limit(1).maybeSingle();if(!n){alert("No active insurance policy found for this vessel.");return}const s=Number(n.principal||0),r=Number(n.deductible_pct||10),o=Math.round(s*r/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+T(s)+`
Deductible: `+r+"% ("+T(o)+`)

Reason: `+i.trim()+`

The insurer will review this claim and determine the payout.`))return;Vt=!0;const{error:l}=await _.from("event_log").insert({nation_id:f.nation_id,faction_id:f.id,event_name:(f.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(f.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+i.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:t,vessel_name:e,policy_id:n.id,insurer_faction_id:n.lender_faction_id,coverage:s,deductible_pct:r,claim_reason:i.trim()},fired_at_tick:a});l&&console.warn("Failed to log insurance claim event:",l.message);const{error:d}=await _.from("finance_active_loans").update({claims_paid:(n.claims_paid||0)+1}).eq("id",n.id);d&&console.warn("Failed to update claims_paid:",d.message),Vt=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+T(s)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=So;window.flFileClaim=Ao;const ri={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},Mo=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let xt=[];async function wn(){if(!f)return;const{data:t}=await _.from("corp_properties").select("*, nations!nation_id(name)").eq("faction_id",f.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});xt=t||[],qo()}function qo(){const t=document.getElementById("pf-count"),e=document.getElementById("pf-list"),i=document.getElementById("pf-footer");if(!t||!e||!i)return;const a=xt;if(t.textContent=a.length+" FACILIT"+(a.length===1?"Y":"IES"),a.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let r=0;e.innerHTML=a.map(o=>{const l=ri[o.type]||ri.fuel_depot,d=o.condition>=75?"#5c5":o.condition>=50?"#ca5":"#c84";return r+=Number(o.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${l.icon}</span>
                        <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${y(o.name)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${l.color};background:${l.color}12;border:1px solid ${l.color}25;">${l.label}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:4px;">${y(o.nations?.name||"Unknown Nation")} · ${y(o.city||"Port")} · ${(o.style||"Basic").toUpperCase()}</div>
                <div style="display:flex;gap:12px;margin-bottom:4px;">
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${d};">${o.condition}%</span>
                        </div>
                        <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${o.condition}%;height:100%;background:${d};"></div></div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${T(o.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${T(o.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(f?.corp_cash_reserves??0);const n=a.some(r=>r.type==="fuel_depot"),s=a.some(r=>r.type==="dry_dock");i.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${n?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${s?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let Wt=!1;async function No(t){if(Wt||!f||!N)return;const e=Mo.filter(p=>p.type===t);if(e.length===0)return;const i=ri[t],a=f.nation_id,n=R?.name||f?.nation||"Home Nation",s=R?.capital||"Port City",r=[{id:a,name:n,capital:s,label:"National HQ"}],{data:o}=await _.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",f.id).eq("type","regional_hq").eq("is_active",!0);for(const p of o||[])p.nation_id!==a&&r.push({id:p.nation_id,name:p.nations?.name||p.city||"Unknown",capital:p.nations?.capital||p.city||"Port City",label:p.name||"Subsidiary"});let l=r[0];if(r.length>1){let p=i.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;p+=`Build in which nation?

`;for(let $=0;$<r.length;$++){const C=r[$],E=xt.filter(w=>w.type===t&&w.nation_id===C.id).length;p+=$+1+". "+C.name+"  ("+C.label+")",E>0&&(p+="  ["+E+" existing]"),p+=`
`}p+=`
Enter number (or cancel):`;const h=prompt(p);if(!h)return;const x=parseInt(h,10)-1;if(isNaN(x)||x<0||x>=r.length){alert("Invalid selection.");return}l=r[x]}const d=xt.filter(p=>p.type===t&&p.nation_id===l.id).length;let v=i.label+" CONSTRUCTION — "+l.name.toUpperCase()+`
`+"─".repeat(30)+`
`;d>0&&(v+="You already have "+d+" "+i.label.toLowerCase()+(d>1?"s":"")+` here.

`),v+=i.desc+`

`;for(let p=0;p<e.length;p++){const h=e[p];v+=p+1+". "+h.name+`
`,v+="   Cost: "+T(h.cost)+" · Maint: "+T(h.maint)+`/tick
`,v+="   "+h.desc+`

`}v+="Enter 1 or 2 to select (or cancel):";const c=prompt(v);if(!c)return;const m=parseInt(c,10)-1;if(isNaN(m)||m<0||m>=e.length){alert("Invalid selection.");return}const u=e[m];if(!confirm("Commission "+u.name+" in "+l.capital+", "+l.name+`?

Budget: `+T(u.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;Wt=!0;const g=N.current_tick||0,b=(N.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:p}=await _.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",l.id).eq("issuer_type","PRIVATE"),x=`PVT-P${(p||0)+1}-${b}`,$=u.style==="Modern",C={concrete:$?60:40,steel:$?50:30,heavy_parts:$?30:20,aggregate:$?30:20},E={trucks:5,mixers:5,excavators:5},w={general:$?240:160,skilled:$?100:60},I=$?6:4,{error:L}=await _.from("construction_contracts").insert({nation_id:l.id,template_key:t,sector:"industrial",name:u.name,project_type:i.label,project_subtype:u.style,description:`${u.name} at ${l.capital} Port — commissioned by ${f.faction_name}. ${u.desc}`,project_code:x,budget_ceiling:u.cost,timeline_ticks:I,required_materials:C,required_equipment:E,required_workforce:w,status:"open",generated_at_tick:g,bidding_ends_tick:g+3,issuer_type:"PRIVATE",issuer_name:f.faction_name,issuer_faction_id:f.id});if(L)throw L;await wn(),alert(`Construction contract posted!

Project: `+u.name+`
Location: `+l.capital+", "+l.name+`
Code: `+x+`
Budget: `+T(u.cost)+`
Timeline: `+I+` ticks

Construction corporations in `+l.name+" can now bid on this project.")}catch(p){alert("Failed to post contract: "+(p.message||"Error"))}finally{Wt=!1}}window.pfOpenBuild=No;const Ci={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function Ii(){if(!f)return;const{data:t,error:e}=await _.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),pi=t||[],vt=null,kn()}function Lo(t){vt=vt===t?null:t,kn()}function zo(t){return(Ci[f?.corp_subsector]||[]).includes(t)}function kn(){const t=document.getElementById("sm-count"),e=document.getElementById("sm-list"),i=document.getElementById("sm-footer");if(!t||!e)return;const a=pi;t.textContent=a.length+" AVAILABLE",a.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=a.map((r,o)=>{const l=vt===o,d=Ne[r.vessel_class]||{color:"#666",label:"?"},v=r.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",c=hn(r.condition),m=r.nation?.name||"—",u=zo(r.vessel_class);N?.current_tick;const g=r.age_ticks||0,b=Math.max(1,Math.floor(g/12)),p=m!==f?.nation?Number(f?.tariffs||R?.tariffs||0):0,h=Math.round(r.asking_price*p/100),x=r.asking_price+h;let $=`<div onclick="smSelectListing(${o})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${l?d.color:"transparent"};background:${l?d.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return $+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(r.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${d.color};background:${d.color}12;border:1px solid ${d.color}25;">${d.label}</span>
            </div>`,$+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${v};background:${v}12;border:1px solid ${v}25;">${r.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(r.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${m.toUpperCase().slice(0,6)}</span>
                ${p>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${p}%</span>`:""}
            </div>`,$+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(r.capacity_dwt||0).toLocaleString()} ${r.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.6;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">COND</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${c};margin-top:1px;">${r.condition}%</div>
                </div>
                <div style="flex:0.5;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${b}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${T(r.asking_price)}</div>
                </div>
            </div>`,l&&($+='<div style="margin-top:6px;">',$+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${d.color};">${(Ne[r.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${y(r.sale_reason||"—")}</div>
                    </div>
                </div>`,$+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${r.condition}%;height:100%;background:${c};"></div></div>
                    ${r.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,p>0&&($+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${p}%)</span>
                        <span style="color:#c84;">+${T(h)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${T(x)}</span>
                    </div>`),u?$+=`<div onclick="event.stopPropagation();smPurchase('${r.id}',${x})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${d.color};cursor:pointer;">${T(x)} — PURCHASE</div>`:$+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${r.vessel_class} not available for ${f?.corp_subsector||"your subsector"}</div>`,$+="</div>"),$+="</div></div>",$}).join("");const n=a.filter(r=>r.seller_type==="CORP").length,s=a.filter(r=>r.seller_type==="LOCAL").length;i.innerHTML=`<div style="display:flex;gap:6px;">
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#5a8aaa;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CORP</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${n}</span>
        </div>
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#8b9a6b;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">LOCAL</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${s}</span>
        </div>
    </div>
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let Be=!1;async function Ro(t,e){if(Be||!f||!N)return;const i=Number(f.corp_cash_reserves??0);if(i<e){alert("Insufficient cash. Need "+T(e)+".");return}if(!confirm("Purchase this vessel for "+T(e)+"?"))return;Be=!0;const a=pi.find(v=>v.id===t);if(!a){Be=!1;return}const n=N.current_tick||0,s=pt[a.vessel_class]||pt.Coastal,{error:r}=await _.from("factions").update({corp_cash_reserves:i-e}).eq("id",f.id);if(r){alert("Failed: "+r.message),Be=!1;return}const{error:o}=await _.from("corp_vessels").insert({faction_id:f.id,nation_id:f.nation_id,vessel_name:a.vessel_name,vessel_class:a.vessel_class,condition:a.condition,fuel:a.fuel||50,status:"in_port",capacity_dwt:a.capacity_dwt||s.capacity_dwt,capacity_unit:a.capacity_unit||s.capacity_unit,base_maintenance:a.base_maintenance||s.base_maintenance,fuel_capacity:a.fuel_capacity||s.fuel_capacity,purchase_price:e,built_at_tick:n-(a.age_ticks||0),current_port_nation_id:f.nation_id});if(o){await _.from("factions").update({corp_cash_reserves:i}).eq("id",f.id),alert("Failed to create vessel: "+o.message),Be=!1;return}var{error:l}=await _.from("ship_market_listings").update({status:"sold",purchased_by:f.id,purchased_at_tick:n}).eq("id",t);if(l&&console.warn("Failed to mark listing as sold:",l.message),a.seller_faction_id){const{data:v}=await _.from("factions").select("corp_cash_reserves").eq("id",a.seller_faction_id).single();if(v){var{error:d}=await _.from("factions").update({corp_cash_reserves:Number(v.corp_cash_reserves||0)+a.asking_price}).eq("id",a.seller_faction_id);d&&console.warn("Failed to credit seller:",d.message)}}f.corp_cash_reserves=i-e,Be=!1,await Promise.all([de(),Ii()])}const Ze=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let ae="Coastal",at=0,ot="",Le=[];function Po(){ae=(Ci[f?.corp_subsector]||["Coastal"])[0],at=0,ot="",Le=[],document.getElementById("comm-overlay").style.display="flex",Do()}async function Do(){const{data:t}=await _.from("nations").select("id, name, industry, infrastructure").order("name");Le=(t||[]).map(e=>{const i=Number(e.industry??50),a=Math.round((.75+i/100*.5)*100)/100,n=Math.round((1.5-i/100*.65)*100)/100,s=e.id===f?.nation_id;return{id:e.id,name:e.name,mfg:i,costMod:a,buildMod:n,isHome:s,tariffs:0}}),Le.sort((e,i)=>(i.isHome?1:0)-(e.isHome?1:0)),Si()}function En(){document.getElementById("comm-overlay").style.display="none"}function Oo(t){ae=t,Si()}function Bo(t){at=t,Si()}function jo(t){ot=t}function Si(){const t=document.getElementById("comm-content");if(!t)return;const e=N?.current_tick||0,i=Ze.find(g=>g.cls===ae)||Ze[0],a=Le[at]||{name:"—",costMod:1,buildMod:1},n=Ne[ae]||{color:"#666"},s=Math.round(i.baseCost*a.costMod),r=Math.max(2,Math.round(i.baseBuild*a.buildMod)),o=Math.round(s*.5),l=s-o,d=e+r,v=Ci[f?.corp_subsector]||[];let c="";c+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,c+='<div style="flex:1;overflow-y:auto;">',c+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const g of Ze){const b=Ne[g.cls]||{color:"#666",label:"?"},p=ae===g.cls,h=v.includes(g.cls);c+=`<div onclick="${h?"commSetClass('"+g.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${h?"pointer":"not-allowed"};background:${p?b.color+"18":"transparent"};border:1px solid ${p?b.color+"44":"var(--panel-border)"};opacity:${h?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${p?b.color:"#6a6660"};">${b.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${T(g.baseCost)} base</div>
        </div>`}c+="</div>",c+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${n.color};">${i.cargo}</div>`,c+="</div>",c+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let g=0;g<Le.length;g++){const b=Le[g],p=at===g,h=b.costMod>1?"#c84":b.costMod<1?"#5c5":"#6a6660",x=b.buildMod>1?"#c84":b.buildMod<1?"#5c5":"#6a6660";c+=`<div onclick="commSetNation(${g})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${p?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${p?"#8b9a6b44":"var(--panel-border)"};border-left:2px solid ${p?"#8b9a6b":"transparent"};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;font-weight:600;color:${p?"var(--panel-text)":"#9e9a92"};">${y(b.name)}</span>
                    ${b.isHome?'<span style="font-family:var(--font-mono);font-size:6px;padding:0 3px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2);line-height:11px;">HOME</span>':""}
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${b.isHome?"Home port — no tariff":"Foreign shipyard"}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">MFG</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#9e9a92;">${b.mfg}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">COST</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h};">×${b.costMod.toFixed(2)}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">SPEED</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${x};">×${b.buildMod.toFixed(2)}</div></div>
            </div>
        </div>`}c+="</div>",c+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Vessel Name</div>
        <input id="comm-name-input" value="${y(ot)}" oninput="commSetName(this.value)" placeholder="e.g., MV 'Sierra Nevada'" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:11px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
    </div>`,c+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Build Summary</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">`;const m=[{label:"VESSEL CLASS",value:ae,color:n.color},{label:"SHIPYARD",value:a.name,color:"#9e9a92"},{label:"BASE COST",value:T(i.baseCost)+" × "+a.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:r+" ticks",color:r>i.baseBuild?"#c84":r<i.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+d,color:"#9e9a92"}];for(const g of m)c+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${g.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g.color};">${g.value}</span>
        </div>`;c+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${T(s)}</span>
    </div>`,c+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${T(o)}</span>
    </div>`,c+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${T(l)}</span>
    </div>`,c+="</div></div>",c+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${d}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
        </div>
    </div>`,c+="</div>";const u=ot.trim().length>=2;c+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEPOSIT DUE NOW</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${T(o)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${u?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${u?"#000":"#6a6660"};background:${u?"#c8a832":"transparent"};border:1px solid ${u?"#c8a832":"var(--panel-border)"};cursor:${u?"pointer":"default"};opacity:${u?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,t.innerHTML=c}let We=!1;async function Ho(){if(We||!f||!N)return;const t=ot.trim();if(t.length<2)return;const e=Ze.find(b=>b.cls===ae)||Ze[0],i=Le[at];if(!i)return;const a=Math.round(e.baseCost*i.costMod),n=Math.max(2,Math.round(e.baseBuild*i.buildMod)),s=Math.round(a*.5),r=a-s,o=N.current_tick||0,l=Number(f.corp_cash_reserves??0);if(l<s){alert("Insufficient cash for deposit. Need "+T(s)+".");return}if(!confirm("Commission "+ae+" from "+i.name+`?

Deposit: `+T(s)+` (non-refundable)
Balance: `+T(r)+" on delivery at tick "+(o+n)))return;We=!0;const d=document.getElementById("comm-order-btn");d&&(d.style.opacity="0.4",d.style.pointerEvents="none");const{error:v}=await _.from("factions").update({corp_cash_reserves:l-s}).eq("id",f.id);if(v){alert("Failed: "+v.message),We=!1;return}const{data:c}=await _.from("nations").select("budget_reserves").eq("id",i.id).single();if(c){var{error:m}=await _.from("nations").update({budget_reserves:Number(c.budget_reserves||0)+s}).eq("id",i.id);m&&console.warn("Failed to credit shipyard nation budget:",m.message)}const u=pt[ae]||pt.Coastal,{error:g}=await _.from("vessel_orders").insert({faction_id:f.id,vessel_name:t,vessel_class:ae,capacity_dwt:u.capacity_dwt,capacity_unit:u.capacity_unit,base_maintenance:u.base_maintenance,fuel_capacity:u.fuel_capacity,purchase_price:e.baseCost,shipyard_nation_id:i.id,shipyard_nation:i.name,cost_modifier:i.costMod,build_modifier:i.buildMod,total_cost:a,deposit_paid:s,balance_due:r,ordered_at_tick:o,delivery_tick:o+n,build_ticks:n,status:"building"});if(g){await _.from("factions").update({corp_cash_reserves:l}).eq("id",f.id),alert("Failed to place order: "+g.message),We=!1;return}f.corp_cash_reserves=l-s,We=!1,En(),alert(t+` commissioned!

Class: `+ae+`
Shipyard: `+i.name+`
Deposit: `+T(s)+`
Delivery: Tick `+(o+n))}window.smSelectListing=Lo;window.smPurchase=Ro;window.smOpenCommission=Po;window.smCloseCommission=En;window.commSetClass=Oo;window.commSetNation=Bo;window.commSetName=jo;window.smPlaceOrder=Ho;window.flSelectVessel=ko;window.flRefurbish=Eo;window.flRefuel=To;window.flSell=Co;window.flRename=Io;window.openBidReview=_o;window.closeBidReview=Ct;window.reviewSelectBid=xo;window.acceptBid=bo;window.declineAllBids=ho;ro();
