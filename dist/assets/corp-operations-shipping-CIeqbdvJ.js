const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BVNorCyj.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as _}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{_ as Ua}from"./preload-helper-BXl3LOEh.js";import{escapeHtml as y,hfFmtBig as E}from"./utils-A98FEun4.js";import{initMessaging as Ga}from"./messaging-Btjj7Mcp.js";import{p as Va,m as Wa,c as Ya,g as ni,E as it,a as Tt,b as ea,d as Qa,e as Ka,f as Gi}from"./loan-math-C0TdxDmt.js";import{SECTOR_OPS_PAGE as ta}from"./corp-topbar-BVNorCyj.js";import{r as oi,c as ia,M as aa,a as Ja}from"./shipping-CQiz46tZ.js";import"./government-structure-C17uG6rl.js";const na={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},he=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"industry",min:20}]},HIGH:{requirements:[{stat:"industry",min:50},{stat:"education",min:40}]}},priceDrivers:["industry","cost_of_living","workforce"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"industry",min:10}]},STD:{requirements:[{stat:"industry",min:35},{stat:"energy",min:20}]},HIGH:{requirements:[{stat:"industry",min:60},{stat:"energy",min:40},{stat:"education",min:45}]}},priceDrivers:["industry","energy","cost_of_living"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"farmland",min:10}]},STD:{requirements:[{stat:"farmland",min:30},{stat:"infrastructure",min:20}]},HIGH:{requirements:[{stat:"farmland",min:50},{stat:"industry",min:30}]}},priceDrivers:["farmland","infrastructure","cost_of_living"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"energy",min:15},{stat:"infrastructure",min:20}]},HIGH:{requirements:[{stat:"energy",min:35},{stat:"industry",min:25}]}},priceDrivers:["energy","infrastructure","cost_of_living"]},{key:"em_systems",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"industry",min:15}]},STD:{requirements:[{stat:"industry",min:40},{stat:"infrastructure",min:25}]},HIGH:{requirements:[{stat:"industry",min:55},{stat:"infrastructure",min:50},{stat:"energy",min:40}]}},priceDrivers:["industry","infrastructure","cost_of_living","energy"]},{key:"glass_facades",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"industry",min:20}]},STD:{requirements:[{stat:"industry",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"industry",min:60},{stat:"infrastructure",min:40},{stat:"education",min:50}]}},priceDrivers:["industry","standard_of_living","cost_of_living"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"energy",min:10}]},STD:{requirements:[{stat:"energy",min:30},{stat:"industry",min:25}]},HIGH:{requirements:[{stat:"energy",min:45},{stat:"industry",min:40},{stat:"infrastructure",min:40}]}},priceDrivers:["energy","industry","cost_of_living"]},{key:"heavy_parts",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"industry",min:40},{stat:"energy",min:30}]},STD:{requirements:[{stat:"industry",min:60},{stat:"energy",min:45},{stat:"education",min:40}]},HIGH:{requirements:[{stat:"industry",min:75},{stat:"energy",min:60},{stat:"education",min:55},{stat:"infrastructure",min:45}]}},priceDrivers:["industry","energy","education","infrastructure"]}];function Ae(t,e,i){const n=he.find(r=>r.key===t);if(!n)return{available:!1,failedStat:"unknown_material"};const a=n.tiers[e];if(!a)return{available:!1,failedStat:"unknown_tier"};for(const r of a.requirements){const s=Number(i?.[r.stat]??0);if(s<r.min)return{available:!1,failedStat:r.stat,failedMin:r.min,nationValue:s}}return{available:!0}}function _i(t,e,i){const a={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em_systems:{LOW:400,STD:700,HIGH:1200},glass_facades:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy_parts:{LOW:800,STD:1400,HIGH:2400}}[t]?.[e];if(!a)return 0;const r=he.find(o=>o.key===t);if(!r)return a;let s=1;for(const o of r.priceDrivers){const l=Number(i?.[o]??50);o==="cost_of_living"?s*=1+(l-50)/200:s*=1-(l-50)/250}return s=Math.max(.4,Math.min(2.5,s)),Math.round(a*s)}function oa(t,e,i){const a={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em_systems:{LOW:1e3,STD:700,HIGH:300},glass_facades:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy_parts:{LOW:400,STD:200,HIGH:80}}[t]?.[e]||0,s=he.find(c=>c.key===t)?.priceDrivers?.[0],l=.3+(s?Number(i?.[s]??50):50)/50*.7;return Math.round(a*l)}const bi=["LOW","STD","HIGH"],si={LOW:"Low",STD:"Standard",HIGH:"High"};async function Xa(t,e,i){var n=t.from("subsidiary_auto_rates").select("*, corp_properties!inner(name, subsector, faction_id)").eq("nation_id",e).eq("is_active",!0),{data:a,error:r}=await n.order("effective_rate",{ascending:!0});return r?(console.error("[SubServices] Failed to fetch rates:",r.message),[]):a||[]}async function Za(t,e){var{data:i,error:n}=await t.from("subsidiary_auto_policies").select("*").eq("borrower_faction_id",e).in("status",["active","lapsed"]).order("started_tick",{ascending:!1});return n?(console.error("[SubServices] Failed to fetch policies:",n.message),[]):i||[]}let ri=null,Ke=null,mt=[],at=[];function sa(t){if(!t)return"";const e=document.createElement("div");return e.textContent=t,e.innerHTML}function ye(t){return Math.abs(t)>=1e9?"$"+(t/1e9).toFixed(1)+"B":Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function en(t,e,i){const n=Math.max(0,Number(t)||0),a=Math.max(0,Number(e)||0),r=Math.max(1,Number(i)||1),s=a/100/12;if(s<=0)return Math.round(n/r);const o=n*(s/(1-Math.pow(1+s,-r)));return Math.round(o)}function tn(t){const e=String(t||"").trim().toLowerCase();return e==="amortized"||e==="amortising"||e==="amortizing"?"amortized":"flat"}function xi(t){return tn(t?.loan_interest_model||t?.interest_model||t?.loan_interest_type)}function ra(t){const e=String(t?.loan_funding_model||"").trim().toLowerCase();return e==="parent_corp"?"parent_corp":e==="subsidiary_cash"?"subsidiary_cash":null}function Vi(t,e,i,n){const a=Math.max(0,Number(t)||0),r=Math.max(0,Number(e)||0),s=Math.max(1,Number(i)||1),o=Wa(a,r);if(n==="amortized"){const d=en(a,r,s),u=Va(d,o),v=Math.max(0,Math.round(d*s-a));return{monthlyPayment:d,month1Interest:o,month1Principal:u,totalInterest:v}}const l=Math.round(a/s),c=Math.round(o+l),m=Math.round(o*s);return{monthlyPayment:c,month1Interest:o,month1Principal:l,totalInterest:m}}async function an(t,e,i,n){ri=t,Ke=e;const a=document.getElementById(i);if(!a)return;const r=e.nation?.id,s=e.faction?.id;if(!r||!s){a.innerHTML='<div style="padding:20px;text-align:center;color:#666;font-size:10px;">No nation data.</div>';return}a.innerHTML='<div style="padding:20px;text-align:center;color:#666;font-family:var(--font-mono,monospace);font-size:10px;">Loading available services...</div>';const[o,l]=await Promise.all([Xa(t,r),Za(t,s)]);mt=o,at=l,la(a,n)}function la(t,e){const i=mt.filter(o=>o.service_type==="insurance"),n=mt.filter(o=>o.service_type==="loan"),a=at.filter(o=>o.service_type==="insurance"),r=at.filter(o=>o.service_type==="loan");let s="";(a.length>0||r.length>0)&&(s+='<div class="cas-section"><div class="cas-section-title">Your Active Policies</div>',s+=a.concat(r).map(o=>nn(o)).join(""),s+="</div>"),s+='<div class="cas-section"><div class="cas-section-title">Available Insurance</div><div class="cas-section-body">',i.length===0?s+='<div class="cas-empty">No insurance subsidiaries operate in this nation.</div>':s+=i.map(o=>Wi(o,"insurance")).join(""),s+="</div></div>",s+='<div class="cas-section"><div class="cas-section-title">Available Credit</div><div class="cas-section-body">',n.length===0?s+='<div class="cas-empty">No banking subsidiaries operate in this nation.</div>':s+=n.map(o=>Wi(o,"loan")).join(""),s+="</div></div>",s||(s='<div class="cas-empty">No financial services available in this nation.</div>'),t.innerHTML=`<div class="cas-panel">${s}</div>`,t.addEventListener("click",o=>{const l=o.target.closest("[data-accept-rate]");if(!l)return;const c=l.dataset.acceptRate,m=l.dataset.serviceType;on(t,c,m,e)})}function Wi(t,e){const i=t.corp_properties?.name||"Unknown Subsidiary",n=e==="insurance",a=n?"#c84":"#5a8aaa",r=n?"INSURANCE":"CREDIT",s=n?"Annual Premium":"Annual Interest",o=xi(t),l=ra(t),c=at.some(m=>m.rate_id===t.id&&m.status==="active");return`
        <div class="cas-rate-card">
            <div class="cas-rate-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:6px;height:6px;border-radius:50%;background:${a};display:inline-block;"></span>
                    <span style="font-size:11px;font-weight:700;color:#f0efe6;">${sa(i)}</span>
                    <span class="cas-badge" style="color:${a};border-color:${a}44;background:${a}0a;">${r}</span>
                    ${n?"":`<span class="cas-badge" style="color:#8ab0c7;border-color:#8ab0c744;background:#8ab0c70f;">${o==="amortized"?"AMORTIZED":"FLAT"}</span>`}
                    ${!n&&l?`<span class="cas-badge" style="color:#b9a46a;border-color:#b9a46a44;background:#b9a46a0f;">${l==="parent_corp"?"PARENT FUNDED":"SUB FUNDED"}</span>`:""}
                </div>
                <span style="font-family:monospace;font-size:8px;color:#666;">${t.policies_issued||0} policies issued</span>
            </div>
            <div class="cas-rate-body">
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${s}</span>
                    <span class="cas-rate-value" style="color:${a};font-size:16px;">${t.effective_rate}%</span>
                </div>
                <div class="cas-rate-breakdown">
                    <span>Base: ${t.base_rate}%</span>
                    ${t.markup>0?`<span>+ Markup: ${t.markup}%</span>`:""}
                </div>
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${n?"Max Coverage":"Max Loan"}</span>
                    <span class="cas-rate-value">${ye(t.coverage_limit||0)}</span>
                </div>
                ${n?`<div class="cas-rate-row">
                    <span class="cas-rate-label">Deductible</span>
                    <span class="cas-rate-value">${t.deductible_pct||10}%</span>
                </div>`:""}
                <div class="cas-rate-row">
                    <span class="cas-rate-label">Term</span>
                    <span class="cas-rate-value">${t.min_term_months}-${t.max_term_months} months</span>
                </div>
            </div>
            <div class="cas-rate-footer">
                ${c?'<span style="font-family:monospace;font-size:8px;font-weight:700;color:#5cb85c;">✓ ACTIVE POLICY</span>':`<button class="cas-accept-btn" data-accept-rate="${t.id}" data-service-type="${e}" style="border-color:${a};color:${a};">Accept ${n?"Coverage":"Terms"}</button>`}
            </div>
        </div>
    `}function nn(t){const e=t.service_type==="insurance",i=e?"#c84":"#5a8aaa",n=t.status==="active"?"#5cb85c":t.status==="lapsed"?"#d9534f":"#666",a=xi(t),r=ra(t);return`
        <div class="cas-policy-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="cas-badge" style="color:${i};border-color:${i}44;background:${i}0a;">${e?"INSURANCE":"LOAN"}</span>
                    <span style="font-size:10px;font-weight:600;color:#c4c2b8;">${t.rate_at_issue}% rate</span>
                    ${e?"":`<span class="cas-badge" style="color:#8ab0c7;border-color:#8ab0c744;background:#8ab0c70f;">${a==="amortized"?"AMORTIZED":"FLAT"}</span>`}
                    ${!e&&r?`<span class="cas-badge" style="color:#b9a46a;border-color:#b9a46a44;background:#b9a46a0f;">${r==="parent_corp"?"PARENT FUNDED":"SUB FUNDED"}</span>`:""}
                </div>
                <span class="cas-badge" style="color:${n};border-color:${n}44;background:${n}0a;">${t.status.toUpperCase()}</span>
            </div>
            <div style="display:flex;gap:12px;margin-top:6px;font-family:monospace;font-size:8px;color:#888;">
                <span>${e?"Premium":"Payment"}: ${ye(t.monthly_payment)}/mo</span>
                <span>Paid: ${ye(t.total_paid)}</span>
                <span>${t.payments_made} payments</span>
            </div>
        </div>
    `}let Bt=!1;function on(t,e,i,n){const a=mt.find(v=>v.id===e);if(!a)return;const r=i==="insurance",s=r?"#c84":"#5a8aaa",o=a.corp_properties?.name||"Unknown",l=a.coverage_limit||0,c=xi(a);let m=document.getElementById("cas-accept-overlay");m||(m=document.createElement("div"),m.id="cas-accept-overlay",m.className="cas-overlay",document.body.appendChild(m)),m.innerHTML=`
        <div class="cas-modal">
            <div class="cas-modal-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:7px;height:7px;border-radius:50%;background:${s};display:inline-block;"></span>
                    <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;">Accept ${r?"Insurance":"Loan"}</span>
                </div>
                <span class="cas-modal-close" id="cas-close">&times;</span>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:${s}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${s};display:inline-block;"></span>
                <span style="font-family:monospace;font-size:9px;color:#888;">Provider:</span>
                <span style="font-family:monospace;font-size:9px;font-weight:700;color:${s};">${sa(o)}</span>
            </div>
            <div style="padding:16px;display:flex;flex-direction:column;gap:14px;">
                <div>
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${r?"Coverage Amount":"Loan Amount"}</div>
                    <input type="number" id="cas-amount" placeholder="Enter amount" max="${l}" style="width:100%;padding:7px 10px;font-family:monospace;font-size:13px;color:#f0efe6;background:#1c1c18;border:1px solid rgba(255,255,255,0.08);outline:none;box-sizing:border-box;">
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;margin-top:3px;">Max: ${ye(l)}</div>
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
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:${s};">${a.effective_rate}%</span>
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
                        ${c==="amortized"?"Amortized loan: interest is charged on remaining principal each month.":"Flat loan: interest is charged on original principal each month."}
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
                <button class="cas-btn cas-btn--submit" id="cas-submit" disabled style="background:${s};">Accept</button>
            </div>
        </div>
    `,m.classList.add("active");const d=()=>{m.classList.remove("active")};document.getElementById("cas-close")?.addEventListener("click",d),document.getElementById("cas-cancel")?.addEventListener("click",d),m.addEventListener("click",v=>{v.target===m&&d()});const u=()=>{const v=Number(document.getElementById("cas-amount")?.value)||0,g=Number(document.getElementById("cas-term")?.value)||a.min_term_months,x=document.getElementById("cas-monthly"),p=document.getElementById("cas-month1-interest"),h=document.getElementById("cas-month1-principal"),b=document.getElementById("cas-total-interest"),$=document.getElementById("cas-submit");if(v>0&&g>0){let C;if(r)C=Math.round(v*a.effective_rate/100/12);else{const T=Vi(v,a.effective_rate,g,c);C=T.monthlyPayment,p&&(p.textContent=ye(T.month1Interest)),h&&(h.textContent=ye(T.month1Principal)),b&&(b.textContent=ye(T.totalInterest))}x&&(x.textContent=ye(C)),$&&($.disabled=v<=0||v>l)}else x&&(x.textContent="—"),p&&(p.textContent="—"),h&&(h.textContent="—"),b&&(b.textContent="—"),$&&($.disabled=!0)};document.getElementById("cas-amount")?.addEventListener("input",u),document.getElementById("cas-term")?.addEventListener("input",u),document.getElementById("cas-submit")?.addEventListener("click",async()=>{if(Bt)return;Bt=!0;const v=document.getElementById("cas-submit");v&&(v.disabled=!0,v.textContent="Processing...");try{const g=Number(document.getElementById("cas-amount")?.value)||0,x=Number(document.getElementById("cas-term")?.value)||a.min_term_months;if(g<=0||g>l)return;const p=Ke.shard?.current_tick||0;let h;r?h=Math.round(g*a.effective_rate/100/12):h=Vi(g,a.effective_rate,x,c).monthlyPayment;const{data:b,error:$}=await ri.rpc("accept_subsidiary_auto_policy_txn",{p_rate_id:a.id,p_borrower_faction_id:Ke.faction?.id,p_principal:g,p_term_months:x,p_monthly_payment:h,p_started_tick:p,p_expires_tick:p+x});if($){console.error("[AutoServices] Accept failed:",$.message),alert("Failed: "+$.message);return}at.push(b),a.policies_issued=(a.policies_issued||0)+1;try{const C=Ke.faction?.faction_name||"A corporation",T=a.corp_properties?.name||"a financial institution",w=a.nation_id||Ke.faction?.nation_id;w&&await ri.from("event_log").insert({nation_id:w,event_name:r?"Insurance Policy Issued":"Loan Agreement Signed",category:"corporate",description_chosen:r?`${C} has secured an insurance policy with ${T}.`:`${C} has just agreed to terms on a substantial loan with ${T}.`,fired_at_tick:p})}catch{}d(),la(t,n)}catch(g){console.error("[AutoServices] Accept error:",g),alert("An error occurred.")}finally{Bt=!1,v&&(v.disabled=!1,v.textContent="Accept")}})}const sn=new Set(["PGRST200","PGRST201","PGRST202","PGRST204","42P01"]);function ca(t){if(!t)return!1;const e=String(t.code||"").trim(),i=String(t.message||"").toLowerCase();return sn.has(e)||i.includes("could not find a relationship")||i.includes("schema cache")||i.includes("does not exist")}function ut(t,e){return t?ca(t)?{code:t.code||"SCHEMA_MISSING",message:e||"Shipping data schema is not fully available yet.",rawMessage:t.message||null,isSchemaMissing:!0}:{code:t.code||"QUERY_FAILED",message:t.message||"Failed to load shipping data.",rawMessage:t.message||null,isSchemaMissing:!1}:null}function jt(t,e,i){return{ok:!i,state:i?"error":e.length===0?"empty":"ready",[t]:e,error:i}}const rn=1e6,ln=18e6,cn=2;function dn(t,e,i){const n=Number(t)||0;return n<e?e:n>i?i:n}function pn(t){const e=Math.max(25e4,Number(t?.estimated_revenue)||0),i=Math.max(cn,Number(t?.gov_contract_duration||t?.transit_ticks||1)||1),n=Math.round(e*i*1.35),a=Number(t?.gov_contract_value)||n;return Math.round(dn(a,rn,ln))}function fn(t){if(!t||t.scope!=="GOVERNMENT")return t;const e=pn(t);return{...t,display_contract_value:e}}async function mn(t,e,i,n={}){const r={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"}[i]||"",s=(n.routeOrigin||"all").toLowerCase(),o=Math.max(0,Number(n.offset||0)),l=Math.max(1,Math.min(Number(n.limit||200),500));let c=t.from("shipping_routes").select("*").eq("status","active").eq("shipping_subsector",r);s==="organic"?c=c.is("trade_agreement_id",null):s==="agreement"&&(c=c.not("trade_agreement_id","is",null)),c=c.order("estimated_revenue",{ascending:!1}).range(o,o+l-1);const[m,d]=await Promise.all([c,t.from("shipping_applications").select("*").eq("faction_id",e).in("status",["pending","approved"])]),u=ut(m.error,"Shipping routes are temporarily unavailable."),v=ut(d.error,"Shipping applications are temporarily unavailable."),g=u||v;return{ok:!g,state:g?"error":(m.data||[]).length===0?"empty":"ready",routes:g?[]:(m.data||[]).map(fn),applications:g?[]:d.data||[],error:g}}async function un(t,e){const i=await t.from("shipping_claims").select("*, shipping_routes(*)").eq("faction_id",e).eq("status","active").order("claimed_at_tick",{ascending:!1});if(!i.error)return jt("claims",i.data||[],null);if(!ca(i.error))return jt("claims",[],ut(i.error,"Active voyage data is temporarily unavailable."));const n=await t.from("shipping_claims").select("*").eq("faction_id",e).eq("status","active").order("claimed_at_tick",{ascending:!1});if(n.error)return jt("claims",[],ut(n.error,"Active voyage data is temporarily unavailable."));const a=n.data||[],r=[...new Set(a.map(l=>l.route_id).filter(Boolean))];let s={};if(r.length>0){const l=await t.from("shipping_routes").select("*").in("id",r);l.error||(s=Object.fromEntries((l.data||[]).map(c=>[c.id,c])))}const o=a.map(l=>({...l,shipping_routes:s[l.route_id]||null}));return{ok:!0,state:o.length===0?"empty":"ready",claims:o,error:null}}const vt={Coastal:{capacity_dwt:14e3,capacity_unit:"DWT",base_maintenance:9e4,fuel_capacity:800,purchase_price:3e6},Container:{capacity_dwt:4800,capacity_unit:"TEU",base_maintenance:145e3,fuel_capacity:2100,purchase_price:65e6},Bulk:{capacity_dwt:28e3,capacity_unit:"DWT",base_maintenance:175e3,fuel_capacity:1800,purchase_price:3e6},Tanker:{capacity_dwt:42e3,capacity_unit:"DWT",base_maintenance:19e4,fuel_capacity:2400,purchase_price:53e6},Reefer:{capacity_dwt:12e3,capacity_unit:"DWT",base_maintenance:14e4,fuel_capacity:1600,purchase_price:6e6},LNG:{capacity_dwt:18e3,capacity_unit:"DWT",base_maintenance:29e4,fuel_capacity:1400,purchase_price:78e6}};let Ee=[],f=null,z=null,M=null,He=[],Ye={},Q=[],J={},li=-1;const vn={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},yt=t=>vn[t]||t;let se="concrete",K="STD",ue=500,ie=[],da={},ci=0,pa=[];async function yn(){if(!f?.id)return;const{data:t}=await _.from("corp_properties").select("*").eq("faction_id",f.id).eq("is_active",!0);pa=t||[]}let ne=[],fa=[],nt=null,Je={},gt={},hi=[],_t=null,re="trucks",ge=0,_e=1,Te=[],Me=null,ma=[],di=null,pt=null,pi="ALL",fi="TIMELINE";function A(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function gn(t){if(t>=12){const e=Math.floor(t/12),i=t%12;return i>0?e+"y "+i+"mo":e+"y"}return t+" ticks"}function ua(t){return!t||t.length===0?"":t.map(e=>{const i=da[e];if(!i)return"";const n=i.reputation_bonus>0?"var(--green)":i.reputation_bonus<0?"var(--red)":"var(--text-dim)",a=i.reputation_bonus>0?"+"+i.reputation_bonus:i.reputation_bonus<0?String(i.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background: var(--border-hair);border:1px solid var(--border-0);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${i.icon||"📍"} ${y(i.name)}${a?` <span style="color:${n};font-weight:700;">${a} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function le(t){return Math.abs(t)>=1e9?"$"+(t/1e9).toFixed(1)+"B":Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(0)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function $i(t){return t==="civil_engineering"?"CIVIL":t==="industrial"?"INDUSTRIAL":t==="mega_project"?"MEGA":t?.toUpperCase()||"—"}function va(t){return t==="civil_engineering"?"light":t==="industrial"?"heavy":t==="mega_project"?"mega":"light"}function _n(){pt&&clearInterval(pt),pt=setInterval(()=>{if(!di)return;const t=di-Date.now();if(t<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(pt);return}const e=Math.floor(t/36e5),i=Math.floor(t%36e5/6e4),n=Math.floor(t%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+i+"m "+n+"s"},1e3)}function bn(t,e){t==="type"&&(pi=e),t==="sort"&&(fi=e),document.querySelectorAll(`.filter-pill[data-filter="${t}"]`).forEach(i=>{i.classList.toggle("active",i.dataset.value===e)}),ga()}const Yi={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function ya(t){if(!f)return!1;if(Yi[f.corp_subsector]===t.sector)return!0;const i=(pa||[]).filter(n=>n.type==="regional_hq"&&n.is_active&&n.nation_id===t.nation_id);for(const n of i)if(Yi[n.subsector]===t.sector)return!0;return!1}function ga(){const t=document.getElementById("oc-list");let e=[...He];if(pi==="GOVERNMENT"?e=e.filter(a=>a.issuer_type==="GOVERNMENT"):pi==="PRIVATE"&&(e=e.filter(a=>a.issuer_type==="PRIVATE")),fi==="TIMELINE"&&e.sort((a,r)=>(a.timeline_ticks||0)-(r.timeline_ticks||0)),fi==="BUDGET"&&e.sort((a,r)=>(r.budget_ceiling||0)-(a.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){t.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const i=M?.current_tick||0;let n="";for(const a of e){const r=a.issuer_type==="GOVERNMENT",s=r?"gov":"private",o=ya(a),l=o?"":" locked",c=va(a.sector),m=$i(a.sector),d=(a.timeline_ticks||0)>18?" warn":"",u=a.bidding_ends_tick?Math.max(0,a.bidding_ends_tick-i):"?";n+=`
            <div class="oc-item${l}" data-contract-id="${a.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${y(a.name)}</span>
                    <span class="oc-item__type-badge ${s}">${r?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${s}">${y(a.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${u} tick${u!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${le(a.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${d}">${gn(a.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${c}">${m}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${Ye[a.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${le(Ye[a.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${o?"yes":"no"}">${o?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${o?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${a.id}'))">VIEW</button>`:""}
                </div>
                ${a.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${y(a.description)}</div>`:""}
                ${a.modifiers&&a.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${ua(a.modifiers)}</div>`:""}
            </div>`}t.innerHTML=n,t.querySelectorAll(".oc-item:not(.locked)").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.contractId,s=He.find(o=>o.id===r);s&&_a(s)})})}let qe=null;function _a(t){qe=t;const e=document.getElementById("cd-overlay"),i=t.issuer_type==="GOVERNMENT",n=i?"gov":"private",a=(z?.name||f.nation||"—").toUpperCase(),r=ya(t);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${y(a)}</span>
        <span class="cd-header__name">${y(t.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${n}">${y(t.issuer_name)}</span>
        <span class="cd-header__type-badge ${n}">${i?"GOV":"PRIVATE"}</span>
    `;const s=document.getElementById("cd-blueprint");t.blueprint_svg?(s.innerHTML=t.blueprint_svg,s.style.display=""):(s.innerHTML=zn(t),s.style.display="");const o=t.permits_required||[],l=t.required_equipment||t.equipment_required||{},c=Array.isArray(l)?l.map(k=>({key:k,qty:1})):Object.entries(l).map(([k,N])=>({key:k,qty:N})),m=t.required_materials||t.materials_estimated||{},u={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[t.sector]||t.spec_category||t.sector||"—";let v="var(--teal)";t.sector==="industrial"&&(v="var(--orange)"),t.sector==="mega_project"&&(v="var(--red)");let g=A(t.budget_ceiling||t.budget||0),x=(t.timeline_ticks||t.timeline_months||0)+" Months",p="";p+=`
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
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const k of h){const N=da[k];if(!N)continue;const B=N.reputation_bonus>0?"var(--green)":N.reputation_bonus<0?"var(--red)":"var(--text-dim)",U=N.cost_multiplier>1?"+"+Math.round((N.cost_multiplier-1)*100)+"% cost":N.cost_multiplier<1?Math.round((1-N.cost_multiplier)*100)+"% cheaper":"",X=N.reputation_bonus!==0?(N.reputation_bonus>0?"+":"")+N.reputation_bonus+" rep":"",fe=N.required_permits||[];p+=`<div style="padding:6px 10px;background: var(--border-hair);border:1px solid var(--border-hair);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${N.icon||"📍"} ${y(N.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${U?`<span style="color:var(--amber);">${U}</span>`:""}
                        ${U&&X?" · ":""}
                        ${X?`<span style="color:${B};font-weight:700;">${X}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${y(N.description||"")}</div>
                ${fe.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${fe.map(G=>y(G.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}p+="</div></div>"}p+='<div class="cd-details">',t.project_type&&(p+=ke("Type",t.project_type)),t.project_subtype&&(p+=ke("Sub-Type",t.project_subtype)),p+=ke("Specialization",u,v),p+=ke("Total Budget",g,"var(--green)"),p+=ke("Timeline",x),p+=ke("Nation",z?.name||f.nation||"—"),t.region&&(p+=ke("Region",t.region)),p+="</div>",o.length>0&&(p+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${o.map(k=>{const N=k.status==="approved"?"approved":"required",B=k.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${N}">
                            <span class="cd-chip__icon">${B}</span>
                            <span class="cd-chip__label">${y(k.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),m.length>0&&(p+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${m.map(k=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${y(k.name)}</span>
                        <span class="cd-mat-row__qty">${y(String(k.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=p;const b=o.filter(k=>k.status==="approved").length,$=o.length-b,C=c.length,T=[];for(const k of c){const N=ie.find(B=>B.equipment_key===k.key);N&&N.owned>=k.qty||T.push(k)}const w=T.length,I=t.required_materials||{},L=typeof I=="object"&&!Array.isArray(I)?Object.entries(I):[],q=[];for(const[k,N]of L){const B=J[k]||{},U=(B.LOW?.qty||0)+(B.STD?.qty||0)+(B.HIGH?.qty||0);U<N&&q.push({key:k,need:N,have:U})}const j=k=>k.replace(/_/g," ").replace(/\b\w/g,N=>N.toUpperCase());let O="";if(C>0)if(w===0)O+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const k=T.map(N=>j(N.key)).join(", ");O+=`<span class="cd-footer__badge bad" title="${y(k)}">${w} SHORT: ${y(k)}</span>`}if(L.length>0)if(q.length===0)O+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const k=q.map(N=>j(N.key)+" ("+N.have+"/"+N.need+")").join(", ");O+=`<span class="cd-footer__badge bad" title="${y(k)}">${q.length} MAT SHORT: ${y(k)}</span>`}o.length>0&&($===0?O+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':O+=`<span class="cd-footer__badge warn">${$} PERMITS PENDING</span>`);const S=r,R=t.issuer_faction_id===f?.id,F=t.status==="bidding",H=Ye[t.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${O}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${R?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${F?"":"disabled"} title="${F?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:H?`<button class="cd-btn primary" onclick="retractBid('${t.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${S?"":"disabled"}
                        title="${S?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function ct(t){t&&t.target&&t.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",qe=null)}const ce=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],Qi={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},Ki={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let P=null;async function Be(t){const e=Q.find(k=>k.id===t);if(!e)return;const i=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,n=M?.current_tick||0,a=e.awarded_at_tick||n,r=e.timeline_ticks||8,s=Math.max(0,n-a),o=Math.min(100,s/r*100);let l=Math.min(ce.length-1,Math.floor(o/(100/ce.length)));const c=Math.round(o%(100/ce.length)/(100/ce.length)*100),m=e.required_materials||{},d=i?.material_grades||{};let u=[];try{const{data:k}=await _.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);u=k||[]}catch{}const v={};for(const k of u)v[k.material_key]||(v[k.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),v[k.material_key].totalAllocated+=k.quantity,v[k.material_key].totalConsumed+=k.consumed,v[k.material_key].tiers[k.quality_tier]={qty:k.quantity,consumed:k.consumed};const g=Object.entries(m).map(([k,N])=>{const B=d[k]||"STD",U=v[k]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:k,name:k.replace(/_/g," ").replace(/\b\w/g,X=>X.toUpperCase()),grade:B,required:Number(N),allocated:U.totalAllocated,consumed:U.totalConsumed,tiers:U.tiers,warehouseStock:J[k]||{}}}),x=e.required_equipment||{},p=e.equipment_condition||{},b=(Array.isArray(x)?x.map(k=>[k,1]):Object.entries(x)).map(([k,N])=>{const B=ie.find(G=>G.equipment_key===k),X=(B?.assigned_projects||[]).find(G=>G.contract_id===e.id),fe=X?X.units:0;return{key:k,name:k.replace(/_/g," ").replace(/\b\w/g,G=>G.toUpperCase()),required:Number(N)||1,ownedTotal:B?.owned||0,deployed:B?.deployed||0,available:Math.max(0,(B?.owned||0)-(B?.deployed||0)),assignedToProject:fe,condition:p[k]??(B?.condition||100)}}),$=e.budget_ceiling||0,C=i?.estimated_cost||0,T=Math.round(C*Math.min(1,s/r)),w=i?.estimated_quality||65,I=w>=75?"EXCELLENT":w>=50?"FAIR":w>=25?"POOR":"BAD",L=e.required_workforce||{},q=e.workers_assigned||{},j=(L.general||0)+(L.skilled||0)+(L.innovative||0),O=(q.general||0)+(q.skilled||0)+(q.innovative||0),S=i?.labor_count||j,R=Number(f?.corp_general_workforce??0),F=Number(f?.corp_skilled_workforce??0),H=Number(f?.corp_innovative_workforce??0);P={project:e,bid:i,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:n,awardedTick:a,totalTicks:r,ticksElapsed:s,phaseIdx:l,phaseProgress:c,materials:g,equipment:b,budget:$,estCost:C,spent:T,quality:w,qualityLabel:I,laborCount:S,wfNeeded:j,wfAssigned:O,reqWf:L,assignedWf:q,corpGeneral:R,corpSkilled:F,corpInnovative:H,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",ba(e.id).then(()=>Pe()),Pe()}let V=!1;async function xn(t,e,i){if(!(V||!P||!f)){V=!0;try{const{data:n,error:a}=await _.rpc("allocate_material_to_project",{p_contract_id:P.project.id,p_faction_id:f.id,p_material_key:t,p_quality_tier:e,p_quantity:i});if(a){alert("Allocation failed: "+a.message);return}if(n&&!n.success){alert(n.error||"Allocation failed");return}await ha(),await Be(P.project.id)}catch(n){alert("Allocation error: "+n.message)}finally{V=!1}}}async function hn(t,e,i){if(!(V||!P||!f)){V=!0;try{const{data:n,error:a}=await _.rpc("deallocate_material_from_project",{p_contract_id:P.project.id,p_faction_id:f.id,p_material_key:t,p_quality_tier:e,p_quantity:i});if(a){alert("Return failed: "+a.message);return}if(n&&!n.success){alert(n.error||"Return failed");return}await ha(),await Be(P.project.id)}catch(n){alert("Return error: "+n.message)}finally{V=!1}}}async function $n(t,e){if(!(V||!P||!f)){V=!0;try{const i=P.project,n=i.workers_assigned||{},a=Number(n[t]||0),r=Number((i.required_workforce||{})[t]||0),s=Number(f?.["corp_"+t+"_workforce"]??0);let o=0;for(const v of Q||[])v.id!==i.id&&(o+=Number((v.workers_assigned||{})[t]||0));const l=Math.max(0,s-o-a),c=Math.min(e,r-a,l);if(c<=0){alert(l<=0?"No "+t+" workers available in pool":"Already fully staffed for "+t);return}const m={...n,[t]:a+c},{error:d}=await _.from("construction_contracts").update({workers_assigned:m}).eq("id",i.id);if(d){alert("Assign failed: "+d.message);return}const u=Q.find(v=>v.id===i.id);u&&(u.workers_assigned=m),await Be(i.id)}catch(i){alert("Assign error: "+i.message)}finally{V=!1}}}async function wn(t,e){if(!(V||!P||!f)){V=!0;try{const i=P.project,n=i.workers_assigned||{},a=Number(n[t]||0),r=Math.min(e,a);if(r<=0){alert("No "+t+" assigned");return}const s={...n,[t]:a-r},{error:o}=await _.from("construction_contracts").update({workers_assigned:s}).eq("id",i.id);if(o){alert("Unassign failed: "+o.message);return}const l=Q.find(c=>c.id===i.id);l&&(l.workers_assigned=s),await Be(i.id)}catch(i){alert("Unassign error: "+i.message)}finally{V=!1}}}async function kn(t,e){if(!(V||!P||!f)){V=!0;try{const i=ie.find(l=>l.equipment_key===t);if(!i){alert("Equipment not found in inventory.");return}const n=Math.max(0,(i.owned||0)-(i.deployed||0));if(n<e){alert("Not enough available "+t+" ("+n+" available).");return}const a=(i.deployed||0)+e,r=[...i.assigned_projects||[]],s=r.find(l=>l.contract_id===P.project.id);s?s.units+=e:r.push({contract_id:P.project.id,contract_name:P.project.name,units:e});const{error:o}=await _.from("corp_equipment").update({deployed:a,assigned_projects:r}).eq("faction_id",f.id).eq("equipment_key",i.equipment_key);if(o){alert("Deploy failed: "+o.message);return}await Sa(),await Be(P.project.id)}catch(i){alert("Deploy error: "+i.message)}finally{V=!1}}}async function En(t){if(!(V||!P||!f)){V=!0;try{const e=ie.find(o=>o.equipment_key===t);if(!e){alert("Equipment not found.");return}const i=[...e.assigned_projects||[]],n=i.findIndex(o=>o.contract_id===P.project.id);if(n===-1){alert("Equipment not deployed to this project.");return}const a=i[n].units;i.splice(n,1);const r=Math.max(0,(e.deployed||0)-a),{error:s}=await _.from("corp_equipment").update({deployed:r,assigned_projects:i}).eq("faction_id",f.id).eq("equipment_key",e.equipment_key);if(s){alert("Undeploy failed: "+s.message);return}await Sa(),await Be(P.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{V=!1}}}function Tn(t){t&&t.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",P=null)}function Cn(t){P&&(P.tab=t,P.expandedEvent=-1,P.selectedResponse=null,Pe())}function In(t){P&&(P.expandedEvent=P.expandedEvent===t?-1:t,P.selectedResponse=null,Pe())}function Sn(t){P&&(P.selectedResponse=P.selectedResponse===t?null:t,Pe())}function Pe(){if(!P)return;const t=P,e=t.project,i=e.issuer_type==="GOVERNMENT",n=$i(e.sector),a=f?.nation||"Nation",r=t.awardedTick+t.totalTicks,s=Math.max(0,r-t.currentTick),o=t.currentTick>r,l=t.budget>0?Math.round(t.spent/t.budget*100):0,c=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",m=t.budget-t.spent,d=t.events.filter(p=>p.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${y(a.toUpperCase())}</span>
                <span class="pm-hdr__name">${y(e.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${y(e.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${i?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${y(e.template_key||e.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${y(n.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${y((e.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let u='<div class="pm-phase__bar">';for(let p=0;p<ce.length;p++){const h=p<t.phaseIdx,b=p===t.phaseIdx;u+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${h?"done":b?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${h?"done":b?"active":""}">${ce[p]}</span>
        </div>`}u+="</div>",u+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${ce[t.phaseIdx]} — ${t.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${o?"var(--red)":"var(--text-secondary)"}">Tick ${t.ticksElapsed} / ${t.totalTicks}${o?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=u;const v=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:d},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=v.map(p=>`<button class="pm-tab${t.tab===p.id?" active":""}" onclick="pmSetTab('${p.id}')">
            ${p.label}${p.badge>0?`<span class="pm-tab__badge">${p.badge}</span>`:""}
        </button>`).join("");let g="";t.tab==="overview"?g=An(t,e,c,l,m,s,o):t.tab==="events"?g=Mn(t):t.tab==="materials"?g=qn(t):t.tab==="equipment"&&(g=Nn(t)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${g}</div>`;let x="";d>0&&(x+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${d} EVENT${d>1?"S":""} REQUIRES RESPONSE</span>`),x+=`<span class="pm-ftr__badge" style="color:${t.quality>=75?"var(--green)":t.quality>=50?"var(--amber)":t.quality>=25?"var(--orange)":"var(--red)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${t.quality}/100 — ${t.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${x}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function An(t,e,i,n,a,r,s){const o=Ie(t.awardedTick+t.totalTicks);Ie(t.awardedTick+t.totalTicks);const l=Ie(t.awardedTick),c=[{label:"Budget",value:le(t.budget),sub:`${n}% spent`,color:i},{label:"Spent",value:le(t.spent),color:"var(--red)"},{label:"Remaining",value:le(a),color:"var(--green)"},{label:"Quality",value:`${t.quality}/100`,sub:t.qualityLabel,color:t.quality>=75?"var(--green)":t.quality>=50?"var(--amber)":t.quality>=25?"var(--orange)":"var(--red)"},{label:"Workforce",value:`${t.laborCount}/${t.wfNeeded}`,sub:`Bid: ${t.laborCount}`,color:t.laborCount<t.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${r} ticks`,sub:s?"OVERDUE":`Deadline: ${o}`,color:s?"var(--red)":"var(--text-bright)"}];let m="";m+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${y(e.description||e.name)}</div>
    </div></div>`,m+='<div class="pm-metrics">';for(const p of c)m+=`<div class="pm-metric">
            <div class="pm-metric__label">${p.label}</div>
            <div class="pm-metric__value" style="color:${p.color}">${p.value}</div>
            ${p.sub?`<div class="pm-metric__sub">${y(p.sub)}</div>`:""}
        </div>`;m+="</div>",m+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${s?"var(--red)":"var(--text-bright)"};font-weight:700">${o}</span></span>
        </div>
    </div></div>`;const d=e.modifiers||[];d.length>0&&(m+='<div style="padding:0 16px"><div class="pm-section">',m+='<div class="pm-section__title">Building Modifiers</div>',m+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',m+=ua(d),m+="</div></div></div>");const u=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(u.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),u.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&u.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),u.length>0){m+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const p of u)m+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${y(p.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;m+="</div></div>"}m+='<div style="padding:0 16px"><div class="pm-section">',m+='<div class="pm-section__title">Workforce Assignment</div>';const v=[{key:"general",label:"General Workers",corpAvail:t.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:t.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:t.corpInnovative,color:"var(--purple)"}];for(const p of v){const h=Number(t.reqWf[p.key]||0);if(h===0)continue;const b=Number(t.assignedWf[p.key]||0),C=b>=h?"var(--green)":b>0?"var(--amber)":"var(--red)",T=p.corpAvail>0&&b<h,w=Math.min(p.corpAvail,h-b),I=b>0;m+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-hair);font-size:0.72rem;">',m+="<div>",m+=`<span style="color:${p.color};font-weight:600;">${p.label}</span>`,m+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${h}</strong></span>`,m+=`<span style="color:${C};margin-left:8px;font-weight:700;">${b} assigned</span>`,m+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${p.corpAvail}</span>`,m+="</div>",m+='<div style="display:flex;gap:4px;">',T&&(m+=`<button onclick="pmAssignWorkers('${p.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${w}</button>`),I&&(m+=`<button onclick="pmUnassignWorkers('${p.key}',${b})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${b}</button>`),m+="</div></div>"}const g=Number(t.reqWf.general||0)+Number(t.reqWf.skilled||0)+Number(t.reqWf.innovative||0),x=Number(t.assignedWf.general||0)+Number(t.assignedWf.skilled||0)+Number(t.assignedWf.innovative||0);return g>0&&x<g&&(m+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),m+="</div></div>",m}function Mn(t){if(t.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let i=0;i<t.events.length;i++){const n=t.events[i],a=t.expandedEvent===i,r=n.status==="ACTIVE",s=Qi[n.type]||Qi.WEATHER,o=Ki[n.severity]||Ki.LOW;if(e+=`<div class="pm-evt ${r?"pm-evt--active":"pm-evt--resolved"}" style="${r?`border-left-color:${s.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${i})" style="${a?`background:${s.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${s.color};background:${s.bg};border:1px solid ${s.border}">${n.type}</span>
            <span class="pm-evt__sev-badge" style="color:${o}">${n.severity}</span>
            <span class="pm-evt__status" style="color:${r?"var(--red)":"var(--text-dim)"};font-weight:${r?"700":"400"}">${r?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${y(n.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${n.tick} · ${y(n.id||"")}</div>`,a){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${y(n.desc)}</div>`,n.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${y(n.impact)}</span>
                </div>`),r&&n.responses&&n.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<n.responses.length;l++){const c=n.responses[l],m=t.selectedResponse===l,u={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[c.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${m?" selected":""}" style="${m?`border-color:${u}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${y(c.label)}</span>
                            <span class="pm-resp__tag" style="color:${u};background:${u}12;border:1px solid ${u}25">${c.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${c.delay>0?"var(--orange)":"var(--green)"}">
                            ${c.delay>0?`+${c.delay} tick${c.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${y(c.detail)}</div>`,e+='<div class="pm-resp__costs">',c.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${le(c.cost)}</span>`),c.qualityImpact&&c.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${c.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${c.qualityImpact>0?"+":""}${c.qualityImpact}</span>`),!c.cost&&(!c.qualityImpact||c.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",m&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${u}" onclick="event.stopPropagation();confirmEventResponse('${n.id}','${c.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!r&&n.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${y(n.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function qn(t){if(t.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const i of t.materials){const n=i.required>0?Math.round(i.allocated/i.required*100):0;i.allocated>0&&Math.round(i.consumed/i.allocated*100);const a=i.allocated>=i.required,r=a?"var(--green)":i.allocated>0?"var(--amber)":"var(--red)",s=a?"FULLY ALLOCATED":i.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${y(i.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${r};">${i.allocated} / ${i.required} allocated · ${s}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${n}%;background:${r};"></div></div>
            <span class="pm-mat__pct">${i.consumed} consumed</span>
        </div>`;const o=["STD","LOW","HIGH"],l=i.required-i.allocated;for(const c of o){const m=i.warehouseStock[c]||{qty:0},d=i.tiers[c]||{qty:0,consumed:0},u=d.qty-d.consumed;if(m.qty===0&&d.qty===0)continue;const v=c==="HIGH"?"var(--green)":c==="LOW"?"var(--orange)":"var(--text-muted)",g=c==="HIGH"?"HIGH":c==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-hair);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${v};width:32px;">${g}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${m.qty}</strong></span>`,d.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${d.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',m.qty>0&&l>0){const x=Math.min(m.qty,l);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${i.key}','${c}',${x})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${x}</button>`}u>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${i.key}','${c}',${u})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${u}</button>`),e+="</div></div>"}e+="</div>"}return e}function Nn(t){if(t.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const i of t.equipment){const n=i.condition>=75?"var(--green)":i.condition>=50?"var(--amber)":i.condition>=25?"var(--orange)":"var(--red)",a=i.assignedToProject>=i.required,r=i.assignedToProject>0&&i.assignedToProject<i.required,s=a?"var(--green)":r||i.ownedTotal>0?"var(--amber)":"var(--red)",o=a?`${i.assignedToProject}/${i.required} DEPLOYED`:r?`${i.assignedToProject}/${i.required} PARTIAL`:i.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${y(i.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${s};margin-left:8px;">${o}</span>
                </div>
            </div>`,i.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${i.condition}%;background:${n}"></div></div>
                <span class="pm-eq__cond-val" style="color:${n}">${i.condition}%</span>
            </div>`);const l=Math.min(i.available,i.required-i.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${a?"var(--green)":"var(--red)"}">${i.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${i.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${i.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',l>0&&(e+=`<button onclick="pmDeployEquipment('${i.key}',${l})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${l}</button>`),i.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${i.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function Ie(t){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][t%12]}, ${2e3+Math.floor(t/12)}`}async function Ln(t,e){if(!f||!M)return;const i=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(i===null)return;const n=i.trim()||"Construction Insurance",a=M.current_tick||0,{error:r}=await _.from("finance_loan_requests").insert({requesting_faction_id:f.id,nation_id:f.nation_id,request_type:"insurance",insured_contract_id:t,amount:e,term_months:0,purpose:n,status:"open",created_tick:a,expires_tick:a+12});if(r){r.message.includes("duplicate")||r.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+r.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await xa()}window.requestInsurance=Ln;window.openProjectModal=Be;window.closeProjectModal=Tn;window.pmSetTab=Cn;window.pmToggleEvent=In;window.pmSelectResponse=Sn;window.pmAllocateMaterial=xn;window.pmDeallocateMaterial=hn;window.pmDeployEquipment=kn;window.pmUndeployEquipment=En;window.pmAssignWorkers=$n;window.pmUnassignWorkers=wn;async function ba(t){if(!P)return;const{data:e,error:i}=await _.from("construction_events").select("*").eq("contract_id",t).order("fired_at_tick",{ascending:!1});i?(console.warn("Failed to load project events:",i.message),P.events=[]):P.events=(e||[]).map(n=>({id:n.id,type:n.type,severity:n.severity,tick:n.fired_at_tick,title:n.title,desc:n.description,impact:n.impact,status:n.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:n.resolution,responses:n.responses||[]})),Pe()}let Ft=!1;async function Rn(t,e){if(!(Ft||!P)){Ft=!0;try{const{data:i,error:n}=await _.rpc("resolve_construction_event",{p_event_id:t,p_response_key:e});if(n){console.error("Failed to resolve event:",n.message),alert("Failed to submit response: "+n.message);return}const a=typeof i=="string"?JSON.parse(i):i;if(a?.error){alert("Error: "+a.error);return}await ba(P.project.id),await xa(),a?.quality_applied&&a.quality_applied!==0&&(P.quality=Math.max(0,Math.min(100,P.quality+a.quality_applied)),P.qualityLabel=P.quality>=75?"EXCELLENT":P.quality>=50?"FAIR":P.quality>=25?"POOR":"BAD"),Pe()}finally{Ft=!1}}}window.confirmEventResponse=Rn;function ke(t,e,i){const n=i?` style="color:${i}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${y(t)}</span>
        <span class="cd-detail-row__value"${n}>${y(e)}</span>
    </div>`}function zn(t){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},i=t.drawing_number||t.contract_number+"-A1",n=M?.current_date||"",a=n?n.replace(/,\s*/," "):"",r=t.spec_category==="Heavy Infrastructure",s=t.spec_category==="Megaproject";let o=y(t.project_subtype||t.project_type||"STRUCTURE"),l=r?"80.0m":s?"200.0m":"60.0m",c=r?"40.0m":s?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(m,d)=>`<line x1="${d*20}" y1="0" x2="${d*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(m,d)=>`<line x1="0" y1="${d*20}" x2="680" y2="${d*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

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
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${c}</text>

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
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${y(a)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}async function Oe(){if(!f||!f.nation_id)return;const{data:t,error:e}=await _.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),He=[];else{const i=Number(f.corp_reputation??0);He=(t||[]).filter(n=>i>=(n.min_reputation||0))}if(Ye={},f&&He.length>0){const i=He.map(a=>a.id),{data:n}=await _.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",f.id).in("contract_id",i);for(const a of n||[])Ye[a.contract_id]=a}ga()}function Pn(){const t=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=Q.length+" ACTIVE",Q.length===0){t.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const i=M?.current_tick||0;let n=0,a=0,r="";for(const s of Q){const o=s.issuer_type==="GOVERNMENT",l=o?"gov":"private",c=Array.isArray(s.contract_bids)?s.contract_bids[0]:s.contract_bids,m=c?.bid_price||0,d=c?.estimated_cost||0,u=c?.estimated_quality||0,v=s.budget_ceiling||0,g=s.awarded_at_tick||i,x=s.stalled_ticks||0,p=Math.max(0,i-g),h=Math.max(0,p-x),b=s.timeline_ticks||8,$=Math.max(0,b-h),C=Math.min(100,Math.round(h/b*100)),T=h>b,w=x>0;let I="";if(w){const q=s.required_workforce||{},j=s.workers_assigned||{},O=[];if((Number(j.general)||0)<(Number(q.general)||0)&&O.push("General: "+(Number(j.general)||0)+"/"+(Number(q.general)||0)),(Number(j.skilled)||0)<(Number(q.skilled)||0)&&O.push("Skilled: "+(Number(j.skilled)||0)+"/"+(Number(q.skilled)||0)),(Number(j.innovative)||0)<(Number(q.innovative)||0)&&O.push("Innovative: "+(Number(j.innovative)||0)+"/"+(Number(q.innovative)||0)),O.length>0)I="Workers needed — "+O.join(", ");else{const S=s.current_phase||ce[Math.min(ce.length-1,Math.floor(h/Math.max(1,b)*ce.length))];S==="Permits"?I="Awaiting permit approval":S==="Planning"?I="Planning phase — no materials yet":I="Materials needed — allocate from warehouse"}}va(s.sector);const L=$i(s.sector);n+=v,a+=m,r+=`<div class="ap-item" onclick="openProjectModal('${s.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${y(s.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${y(s.issuer_name||"—")} · ${L}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${o?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${w?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+x+" ticks) — "+y(I)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${T?"var(--red)":w?"var(--orange)":"var(--teal)"}">
                        ${h}/${b} ticks ${T?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${C}%;background:${T?"var(--red)":w?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${le(m)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${le(d)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${u>=70?"var(--green)":u>=40?"var(--teal)":"var(--orange)"}">${u}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${T?"var(--red)":"var(--text-bright)"}">${$} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${s._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':s._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${s.id}',${v})">INSURE</div>`}
                </div>
            </div>
        </div>`}t.innerHTML=r,e.style.display=Q.length>0?"":"none",Q.length>0&&(document.getElementById("ap-total-crew").textContent=Q.length,document.getElementById("ap-total-budget").textContent=le(n),document.getElementById("ap-total-spent").textContent=le(a))}async function xa(){if(!f)return;const{data:t,error:e}=await _.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",f.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",f.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),Q=[]):Q=t||[],Q.length>0){const i=Q.map(o=>o.id),{data:n}=await _.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",i),{data:a}=await _.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),r=new Set((a||[]).map(o=>o.finance_loan_requests?.insured_contract_id).filter(Boolean)),s=new Set((n||[]).filter(o=>o.status==="open").map(o=>o.insured_contract_id));for(const o of Q)o._hasInsurance=r.has(o.id),o._insurancePending=s.has(o.id)}Pn()}const Ct=3e4;function It(){let t=0,e=0;for(const i of he)for(const n of bi){const a=J[i.key]?.[n];a&&(t+=a.qty,e+=a.value)}return{totalUnits:t,totalValue:e}}function wi(){const t=document.getElementById("wh-list"),{totalUnits:e,totalValue:i}=It();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=A(i);const n=Math.round(e/Ct*100),a=document.getElementById("wh-capacity");a.textContent=n+"%",a.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)";let r="";for(let s=0;s<he.length;s++){const o=he[s],l=li===s,c=J[o.key]?.LOW||{qty:0,value:0},m=J[o.key]?.STD||{qty:0,value:0},d=J[o.key]?.HIGH||{qty:0,value:0},u=c.qty+m.qty+d.qty,v=c.value+m.value+d.value,g=u===0,x=Ae(o.key,"LOW",z),p=Ae(o.key,"STD",z),h=Ae(o.key,"HIGH",z),b=c.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",$=m.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",C=h.available?d.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(r+='<div class="wh-row">',r+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${s})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${g?" empty":""}">${y(o.name)}</span>
            <div class="wh-row__dots">
                <div class="${b}"></div>
                <div class="${$}"></div>
                <div class="${C}"></div>
            </div>
            <span class="wh-row__qty${g?" empty":""}">${u>0?u.toLocaleString():"—"}</span>
            <span class="wh-row__val${g?" empty":""}">${v>0?A(v):"—"}</span>
        </div>`,l){r+='<div class="wh-expand">',r+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const T=[{key:"LOW",label:"Low",data:c,avail:x,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:m,avail:p,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:d,avail:h,color:"var(--green)",dotClass:"wh-dot--high"}];for(const w of T){const I=!w.avail.available,L=w.data.qty>0,q=L?"$"+Math.round(w.data.value/w.data.qty):"—";r+=`<div class="wh-grade${I?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${w.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${I?"var(--red)":w.color}">${w.label}</span>
                        ${I?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${L?"var(--text-bright)":"var(--text-dim)"}">${L?w.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${w.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${w.data.value>0?A(w.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${q}</span>
                </div>`}for(const w of T)!w.avail.available&&w.avail.failedStat&&(r+=`<div class="wh-lock">
                        <span class="wh-lock__text">${w.label.toUpperCase()} GRADE LOCKED — ${y(w.avail.failedStat)} &lt; ${w.avail.failedMin}</span>
                    </div>`);r+="</div>"}r+="</div>"}t.innerHTML=r}function On(t){li=li===t?-1:t,wi()}async function ha(){if(!f)return;const{data:t,error:e}=await _.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",f.id);J={};const i=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(t){for(const n of t){const a=yt(n.material_key);J[a]||(J[a]={}),J[a][n.quality_tier]={qty:n.quantity||0,value:Number(n.total_value)||0},a!==n.material_key&&i.push(n)}if(i.length>0){const n=i.map(a=>({faction_id:f.id,nation_id:f.nation_id,material_key:yt(a.material_key),quality_tier:a.quality_tier,quantity:a.quantity||0,total_value:Number(a.total_value)||0,updated_at:new Date().toISOString()}));await _.from("corp_warehouse").upsert(n,{onConflict:"faction_id,material_key,quality_tier"});for(const a of i)await _.from("corp_warehouse").delete().eq("faction_id",f.id).eq("material_key",a.material_key).eq("quality_tier",a.quality_tier)}}wi()}const Dn={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Bn(){const t=(z?.name||f?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+t;const e=Number(f?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=A(e);const{totalUnits:i}=It(),n=Math.round(i/Ct*100),a=document.getElementById("pr-wh-capacity");a.textContent=n+"%",a.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)",$a(),ki(),St()}function $a(){const t=document.getElementById("pr-mat-grid");let e="";for(const i of he){const n=se===i.key,a=bi.every(s=>!Ae(i.key,s,z).available),r="pr-mat-btn"+(n?" active":"")+(a?" all-locked":"");e+=`<span class="${r}" onclick="setPrMat('${i.key}')">${y(i.name)}</span>`}t.innerHTML=e}function ki(){const t=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const i of bi){const n=Ae(se,i,z),a=K===i,r=n.available?_i(se,i,z):null,s=na[i],o=!n.available,l="pr-tier-btn"+(a?" active":"")+(o?" locked":"");e+=`<div class="${l}" onclick="${o?"":`setPrTier('${i}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${s};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${a?"var(--text-bright)":"var(--text-dim)"}">${si[i]}</span>
            </div>
            ${r!==null?`<div class="pr-tier-btn__price" style="color:${a?"var(--text-bright)":"var(--text-muted)"}">$${r}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}t.innerHTML=e}function St(){const t=document.getElementById("pr-content"),e=Ae(se,K,z),i=he.find(T=>T.key===se);if(!i)return;if(!e.available){t.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${y(i.name)} — ${si[K]} grade
                    is not produced domestically in ${y(z?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${y(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const n=_i(se,K,z),a=oa(se,K,z),r=n*ue,s=a>3e3?"LOW":a>1e3?"MODERATE":"HIGH",o=s==="LOW"?"var(--green)":s==="MODERATE"?"var(--amber)":"var(--red)",l=Number(z?.inflation??50),c=l>55?"up":l<45?"down":"flat",m=c==="up"?"&#9650;":c==="down"?"&#9660;":"&#8212;",d=c==="up"?"var(--red)":c==="down"?"var(--green)":"var(--text-dim)";let u="";u+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${n}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${d}">${m}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${a.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${o};margin-top:2px;">${s}</div>
            </div>
        </div>
    </div>`,u+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${y(z?.name||"—")})</div>`;for(const T of i.priceDrivers){const w=Number(z?.[T]??50),I=w>=50?"var(--green)":w>=30?"var(--amber)":w>=15?"var(--orange)":"var(--red)",L=Dn[T]||T;u+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${y(T)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${w}%;background:${I}"></div>
            </div>
            <span class="pr-driver-row__val">${w}</span>
            <span class="pr-driver-row__effect">${y(L)}</span>
        </div>`}u+="</div>";const g=(Number(f?.corp_cash_reserves)||0)>=r,x=ue>a,{totalUnits:p}=It(),h=Ct-p,b=ue>h,$=h<=0,C=na[K];u+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${y(i.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${C};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${C}">${si[K]}</span>
                </div>
                <span class="pr-order__mat-price">$${n}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(T=>`<span class="pr-qty-btn${ue===T?" active":""}" onclick="setPrQty(${T})">${T>=1e3?T/1e3+"k":T}</span>`).join("")}
                </div>
            </div>
            ${x?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${a.toLocaleString()} this tick</span>
            </div>`:""}
            ${$?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:b?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${h.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${A(r)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${g&&!x&&!b&&!$?"":"disabled"}
                    title="${g?x?"Exceeds supply":$?"Warehouse full":b?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,t.innerHTML=u}function jn(t){se=t,K="STD";for(const e of["STD","HIGH","LOW"])if(Ae(t,e,z).available){K=e;break}$a(),ki(),St()}function Fn(t){K=t,ki(),St()}function Hn(t){ue=t,St()}let Ht=!1;async function Un(){if(Ht||!f||!z)return;const t=_i(se,K,z),e=oa(se,K,z),i=t*ue,n=Number(f.corp_cash_reserves)||0;if(i>n){alert("Insufficient cash reserves.");return}if(ue>e){alert("Exceeds available supply this tick.");return}const{totalUnits:a}=It(),r=Ct-a;if(r<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(ue>r){alert(`Warehouse can only hold ${r.toLocaleString()} more units. Reduce quantity.`);return}Ht=!0;const s=document.querySelector(".pr-purchase-btn");s&&(s.disabled=!0,s.textContent="...");try{const o=n-i,{error:l}=await _.from("factions").update({corp_cash_reserves:o}).eq("id",f.id);if(l)throw l;const c=yt(se),m=J[c]?.[K],d=(m?.qty||0)+ue,u=(m?.value||0)+i,{error:v}=await _.from("corp_warehouse").upsert({faction_id:f.id,nation_id:f.nation_id,material_key:c,quality_tier:K,quantity:d,total_value:u,last_purchased_tick:M?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(v){const{error:g}=await _.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);throw g&&console.error("Cash refund failed after warehouse error:",g.message),v}f.corp_cash_reserves=o,J[c]||(J[c]={}),J[c][K]={qty:d,value:u},wi(),Bn(),s&&(s.textContent="PURCHASED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(o){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(o.message||"Unknown error"))}finally{Ht=!1}}function wa(t){const e=Me||z;if(!e)return[];const i=Tt(t);if(!i)return[];const n=Qa(t,e),a=[],r=50,s=50;Number(e?.industry??50);const o=Me&&z&&Me.id!==z.id;let l=null;if(o&&(l=Ka(e,z)),n.newAvailable>0){const c=Gi(t,e),m=i.basePrice,d=Math.round(m*((r-50)/200)),u=Math.round(m*((s-50)/300));let v=c;const g=[{label:"Base price",value:A(m)},d!==0?{label:`Inflation (${r})`,mod:(d>=0?"+":"")+A(Math.abs(d))}:null,u!==0?{label:`Fuel transport (${s})`,mod:(u>=0?"+":"")+A(Math.abs(u))}:null].filter(Boolean),x=c-m-d-u;if(x!==0&&!o&&g.push({label:"Demand/scarcity",mod:(x>=0?"+":"")+A(Math.abs(x))}),o&&l){const p=Math.round(c*l.tariff),h=Math.round(c*l.transport);v=c+p+h,g.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+A(p)}),g.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+A(h)})}a.push({seller:o?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:o?l?.deliveryTicks||1:0,condition:100,price:Math.round(v),available:n.newAvailable,delivery:o?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:o?l.deliveryTicks:0,used:!1,priceFactors:g,sourceNationId:e.id})}if(n.usedAvailable>0){const c=n.usedCondition,m=Gi(t,e,{used:!0,condition:c});let d=m;const u=[{label:"Base price",value:A(i.basePrice)},{label:`Condition (${c}%)`,mod:"-"+A(Math.max(0,i.basePrice-m))}];if(o&&l){const v=Math.round(m*l.tariff),g=Math.round(m*l.transport);d=m+v+g,u.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+A(v)}),u.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+A(g)})}a.push({seller:o?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:o?l?.deliveryTicks||1:0,condition:c,price:Math.round(d),available:n.usedAvailable,delivery:o?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:o?l.deliveryTicks:0,used:!0,priceFactors:u,sourceNationId:e.id})}return a}function Ei(){const t=Number(f?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=A(t);const e=Tt(re),i=it[e?.tier||1],n=document.getElementById("em-tier-badge");n&&(n.textContent=i.tag,n.style.color=i.color),n.style.background=i.color+"0a",n.style.border="1px solid "+i.color+"33";const a=document.getElementById("em-nation-select");if(a&&a.options.length===0){const o=z?.name||f?.nation||"—";let l=`<option value="">${y(o)} (HQ)</option>`;for(const c of ma)c.id!==z?.id&&(l+=`<option value="${c.id}">${y(c.name)}</option>`);a.innerHTML=l}const r=document.getElementById("em-import-tag"),s=Me&&z&&Me.id!==z.id;r&&(r.style.display=s?"":"none"),Gn(),Ti()}function Gn(){let t="";for(let e=1;e<=3;e++){const i=it[e],n=ni(e),a=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";t+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${i.color}">${i.tag}</div>
            <div class="${a}">`;for(const r of n){const s=re===r.key,o=wa(r.key).length>0;t+=`<span class="em-selector__btn${s?" active":""}${o?"":" no-listings"}"
                style="${s?"background:"+i.color+";border-color:"+i.color:""}"
                onclick="setEmType('${r.key}')">${y(r.name)}</span>`}t+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${t}</div>`}function Ti(){const t=document.getElementById("em-content");if(Te=wa(re),Te.length===0){t.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}ge>=Te.length&&(ge=0);let e="";for(let n=0;n<Te.length;n++){const a=Te[n],r=ge===n,s=a.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",o=ea(a.condition);e+=`<div class="em-listing${r?" selected":""}" style="${r?"border-left-color:"+s:""}" onclick="setEmListing(${n})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${y(a.seller)}</span>
                <span class="em-badge em-badge--${a.sellerType.toLowerCase()}">${a.sellerType}</span>
                ${a.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${y((a.nation||"").toUpperCase())}</span>
            ${a.distance>0?`<span class="em-listing__distance">${a.distance} nation${a.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${y(a.delivery)}</span>
        </div>`,e+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${a.condition}%;background:${o}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${o}">${a.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${a.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${A(a.price)}</div>
            </div>
        </div>`,r&&a.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${a.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${y(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const i=Te[ge];if(i){const n=Tt(re),a=it[n?.tier||1],r=Math.min(i.available,4),s=i.price*_e,o=(Number(f?.corp_cash_reserves)||0)>=s;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${y(n?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${y(i.seller)}</span>
                </div>
                <span class="em-purchase__price">${A(i.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:r},(l,c)=>c+1).map(l=>`<span class="em-qty-btn${_e===l?" active":""}" style="${_e===l?"background:"+a.color+";border-color:"+a.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${i.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${A(s)}</div>
                    ${i.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${y(i.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${a.color}" onclick="purchaseEquipment()"
                    ${o?"":"disabled"}
                    title="${o?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}t.innerHTML=e}async function Vn(t){if(!t)Me=null;else{let i=ma.find(n=>n.id===t);if(!i)try{const{data:n}=await _.from("nations").select("*").eq("id",t).single();i=n}catch{}Me=i||null}ge=0,_e=1;const e=document.getElementById("em-nation-select");e&&(e.value=t||""),Ei()}function Wn(t){re=t,ge=0,_e=1,Ei()}function Yn(t){ge=t,_e=1,Ti()}function Qn(t){_e=t,Ti()}let Ut=!1;async function Kn(){if(Ut)return;const t=Te[ge];if(!t||!f)return;const e=Tt(re);if(!e)return;const i=_e,n=t.price*i,a=Number(f.corp_cash_reserves)||0;if(n>a){alert("Insufficient cash reserves.");return}if(i>t.available){alert("Not enough units available.");return}const r=document.querySelector(".em-purchase-btn");r&&(r.disabled=!0,r.textContent="..."),Ut=!0;try{const s=a-n,{error:o}=await _.from("factions").update({corp_cash_reserves:s}).eq("id",f.id);if(o)throw o;const l=!t.deliveryTicks||t.deliveryTicks===0;if(l){const m=ie.find($=>$.equipment_key===re),d=(m?.owned||0)+i,u=m?.purchase_price_avg||0,v=m?.owned||0,g=v>0?Math.round((u*v+t.price*i)/d):t.price,x=e.maintenancePerUnit*d,p=m?.condition||100,h=Math.round((p*v+t.condition*i)/d),{error:b}=await _.from("corp_equipment").upsert({faction_id:f.id,nation_id:f.nation_id,equipment_key:re,tier:e.tier,owned:d,deployed:m?.deployed||0,condition:h,maintenance_per_tick:x,purchase_price_avg:g,last_purchased_tick:M?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(b){const{error:$}=await _.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);throw $&&console.error("Cash refund failed:",$.message),b}m?(m.owned=d,m.condition=h,m.maintenance_per_tick=x):ie.push({equipment_key:re,tier:e.tier,owned:d,deployed:0,condition:h,maintenance_per_tick:x,assigned_projects:[]})}else{const m=(M?.current_tick||0)+t.deliveryTicks,{error:d}=await _.from("corp_equipment_deliveries").insert({faction_id:f.id,equipment_key:re,quantity:i,condition:t.condition,delivery_tick:m,source_nation_id:t.sourceNationId||null,seller_name:t.seller,price_paid:n});if(d){const{error:u}=await _.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);throw u&&console.error("Cash refund failed:",u.message),d}}f.corp_cash_reserves=s,Li(),Ei();const c=document.getElementById("pr-cash");c&&(c.textContent=A(s)),r&&(r.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{r.isConnected&&(r.disabled=!1,r.textContent="PURCHASE")},1500))}catch(s){r&&(r.disabled=!1,r.textContent="PURCHASE"),alert("Purchase failed: "+(s.message||"Unknown error"))}finally{Ut=!1}}let Jn=-1,Ue=[],bt=[],mi=[];function Gt(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t.toLocaleString()}function Xn(t,e,i){if(i)return"var(--orange)";const n=t/(e||1)*100;return n>50?"var(--green)":n>25?"var(--amber)":"var(--red)"}function Ji(){const t=document.getElementById("pm-list"),e=Ue.length,i=bt.length,n=mi.length,a=Ue.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${i})`,document.getElementById("pm-apply-count").textContent=`(${n})`;const r=document.getElementById("pm-badges");let s="";a>0&&(s+=`<span class="pm-badge pm-badge--expiring">${a} EXPIRING</span>`),i>0&&(s+=`<span class="pm-badge pm-badge--pending">${i} PENDING</span>`),r.innerHTML=s;const o=Ue.reduce((l,c)=>l+(c.cost||0),0)+bt.reduce((l,c)=>l+(c.cost||0),0);document.getElementById("pm-total-cost").textContent=Gt(o),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=i;{if(e===0){t.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";Ue.forEach((c,m)=>{const d=Jn===m,u=Xn(c.ticks_left,c.total_ticks,c.expiring_soon),v=Math.min(c.ticks_left/(c.total_ticks||1)*100,100);l+=`<div class="pm-item ${c.expiring_soon?"pm-item--expiring":""} ${d?"expanded":""}" onclick="togglePmExpand(${m})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${y(c.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${y((c.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${u}">Expires: ${y(c.expires||"")}</span>
                        <span class="pm-item__ticks">(${c.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${v}%;background:${u}"></div></div>`,d&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${y(c.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${y(c.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Gt(c.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${c.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${c.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(c.projects||[]).map(g=>`<span class="pm-project-chip">${y(g)}</span>`).join("")}</div>
                    </div>`,c.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${y(c.note)}</span></div>`),c.expiring_soon&&c.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${c.permit_key}');">RENEW — ${Gt(c.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),t.innerHTML=l;return}}let Vt=!1;async function Zn(t){if(!(Vt||!f||!z)){Vt=!0;try{const{data:e}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=e?.current_tick||0,{data:n,error:a}=await _.rpc("apply_for_permit",{p_faction_id:f.id,p_nation_id:z.id,p_permit_key:t,p_current_tick:i});if(a){alert("Application failed: "+a.message);return}if(n&&!n.success){alert(n.error||"Application failed");return}alert("Permit application submitted! Processing: "+(n.processing_ticks||0)+" ticks."),await eo()}catch(e){alert("Error: "+e.message)}finally{Vt=!1}}}window.pmApplyForPermit=Zn;async function eo(){if(!f||!z){Ue=[],bt=[],mi=[],Ji();return}const{data:t}=await _.from("construction_permits").select("*"),e=t||[],i={};for(const d of e)i[d.permit_key]=d;const{data:n}=await _.from("corp_permits").select("*").eq("faction_id",f.id).eq("nation_id",z.id),a=n||[],{data:r}=await _.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",z.id).not("policies.permit_key","is",null),s=new Set,o={};for(const d of r||[])d.policies?.permit_key&&(s.add(d.policies.permit_key),o[d.policies.permit_key]=d.policies.policy_name);const{data:l}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),c=l?.current_tick||0;Ue=a.filter(d=>d.status==="active").map(d=>{const u=i[d.permit_key]||{},v=d.expires_at_tick?Math.max(0,d.expires_at_tick-c):999,g=u.duration_ticks||24;return{name:u.name||d.permit_key,permit_key:d.permit_key,nation:z.name,policy:o[d.permit_key]||"—",issued:d.granted_at_tick!=null?Ie(d.granted_at_tick):"—",expires:d.expires_at_tick?Ie(d.expires_at_tick):"Single-use",cost:d.cost_paid||0,ticks_left:v,total_ticks:g,expiring_soon:v<=3&&v>0,renewable:u.duration_ticks!=null,projects:[]}}),bt=a.filter(d=>d.status==="pending").map(d=>{const u=i[d.permit_key]||{},v=u.processing_ticks||2,g=c-d.applied_at_tick,x=Math.max(0,v-g);return{name:u.name||d.permit_key,permit_key:d.permit_key,nation:z.name,applied:Ie(d.applied_at_tick),status:"PROCESSING",processing_total:v,ticks_remaining:x,est_approval:Ie(d.applied_at_tick+v),cost:d.cost_paid||0,required_by:o[d.permit_key]||"—"}});const m=new Set(a.filter(d=>d.status==="active"||d.status==="pending").map(d=>d.permit_key));mi=[...s].filter(d=>!m.has(d)).map(d=>{const u=i[d]||{};return{name:u.name||d,permit_key:d,nation:z.name,description:u.description||"",policy:o[d]||"—",cost:u.cost_is_percentage?15e4:u.cost||0,processing_time:u.processing_ticks||2,duration:u.duration_ticks?u.duration_ticks+" ticks":"Single-use",category:u.category||"",difficulty:u.difficulty||"EASY"}}),Ji()}let Wt=!1,Yt=!1,Qt=!1;function ka(t){return Math.abs(t)>=1e9?"$"+(t/1e9).toFixed(1)+"B":Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+Math.round(t/1e3)+"k":"$"+Math.round(t)}async function At(){var{data:t,error:e}=await _.from("factions").select("*").eq("id",f.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}t&&(f=t);var i=document.getElementById("topbar-cash");i&&(i.textContent="CASH: "+ka(Number(f.corp_cash_reserves??0)))}let xt=[],ht=[],Kt=new Set,Ne=new Set;function to(t){const e=String(t||"").toUpperCase();return e==="CRITICAL"?"critical":e==="HIGH"?"high":e==="MODERATE"?"moderate":"low"}function Xi(t,e){const i=Math.max(0,Number(t||0)-(Number(e)||0));return i<=0?"Resolving now":`Expires in ${i} tick${i===1?"":"s"}`}function ae(t,e){document.querySelectorAll(".pi-toast").forEach(n=>n.remove());const i=document.createElement("div");i.className="pi-toast"+(e?" "+e:""),i.textContent=t,document.body.appendChild(i),setTimeout(()=>{i.classList.add("fade"),setTimeout(()=>i.remove(),280)},3e3)}async function Mt(){if(!f?.id)return;const[t,e]=await Promise.all([_.from("corp_contract_events").select("id, contract_id, type, severity, title, description, impact, responses, expires_at_tick, corp_contracts:contract_id(name)").eq("faction_id",f.id).eq("status","ACTIVE").order("expires_at_tick",{ascending:!0}),_.from("bank_loan_offers").select(`
                id, offered_apr, offered_term_ticks, expires_at_tick,
                bank:factions!bank_faction_id ( faction_name, corp_ticker ),
                request:bank_loan_requests!inner ( principal, purpose )
            `).eq("status","pending").eq("request.requesting_faction_id",f.id).eq("request.status","pending").order("expires_at_tick",{ascending:!0})]);t.error?(console.warn("[corp-shipping] Pressing Issues fetch failed:",t.error.message),xt=[]):xt=t.data||[],e.error?(console.warn("[corp-shipping] Loan offers fetch failed:",e.error.message),ht=[]):ht=e.data||[],ot()}function ot(){const t=document.getElementById("pi-list"),e=document.getElementById("pi-count");if(!t)return;const i=xt.length+ht.length;if(e&&(e.textContent=`${i} OPEN`),i===0){t.innerHTML='<div class="pi-empty"><div class="pi-empty__text">No pressing issues right now.<br>Time-sensitive decisions<br>will appear here.</div></div>';return}const n=Number(M?.current_tick)||0,a=ht.map(s=>{const o=Xi(s.expires_at_tick,n),l=s.bank||{},c=s.request||{},m=l.corp_ticker||"—",d=l.faction_name||"Lender",u=Number(s.offered_apr)||0,v=Number(s.offered_term_ticks)||0,g=Number(c.principal)||0,x=c.purpose?String(c.purpose).trim():"",p=Ne.has(s.id);return`<div class="pi-issue-card kind-loan-offer">
            <div class="pi-issue-row">
                <span class="pi-issue-tag kind-loan-offer">LOAN OFFER ◊ FINANCE</span>
                <span class="pi-issue-deadline">${y(o)}</span>
            </div>
            <div class="pi-issue-title">${y(m)} — ${y(d)}</div>
            ${x?`<div class="pi-issue-sub">— ${y(x)}</div>`:""}
            <div class="pi-issue-terms">
                <span><span class="label">PRINCIPAL</span><span class="value">${y(E(g))}</span></span>
                <span><span class="label">APR</span><span class="value">${u.toFixed(1)}%</span></span>
                <span><span class="label">TERM</span><span class="value">${v} TICKS</span></span>
            </div>
            <div class="pi-issue-actions">
                <button class="pi-btn primary" data-action="accept-offer" data-id="${y(s.id)}" ${p?"disabled":""}>
                    ${p?"Working…":"Accept ▸"}
                </button>
                <button class="pi-btn" data-action="reject-offer" data-id="${y(s.id)}" ${p?"disabled":""}>
                    Reject
                </button>
            </div>
        </div>`}),r=xt.map(s=>{const o=Xi(s.expires_at_tick,n),l=to(s.severity),c=s.corp_contracts?.name||"Project",m=String(s.severity||"LOW").toUpperCase(),d=String(s.type||"").trim(),u=d?`${m} ◊ ${d}`:m,v=Array.isArray(s.responses)&&s.responses[0]||{},g=Number(v.cost)||0,x=Number(v.delay)||0,p=[];return g>0&&p.push(`<span><span class="label">COST</span><span class="value">−${y(E(g))}</span></span>`),x>0&&p.push(`<span><span class="label">DELAY</span><span class="value">+${x}t</span></span>`),`<div class="pi-issue-card sev-${l}">
            <div class="pi-issue-row">
                <span class="pi-issue-tag sev-${l}">${y(u)}</span>
                <span class="pi-issue-deadline">${y(o)}</span>
            </div>
            <div class="pi-issue-title">${y(s.title||"Untitled")}</div>
            <div class="pi-issue-sub">— ${y(c)}</div>
            <div class="pi-issue-desc">${y(s.description||s.impact||"")}</div>
            ${p.length?`<div class="pi-issue-terms">${p.join("")}</div>`:""}
            <div class="pi-issue-actions">
                <button class="pi-btn primary" data-action="ack-issue" data-id="${y(s.id)}">Acknowledge ▸</button>
            </div>
        </div>`});t.innerHTML=a.concat(r).join("")}async function io(t){if(!(!t||Ne.has(t))){Ne.add(t),ot();try{const{data:e,error:i}=await _.rpc("accept_loan_offer",{p_offer_id:t});i?ae("Failed: "+i.message,"error"):e?.success?ae("Offer accepted. Awaiting bank disbursement.","success"):ae(e?.error||"Failed to accept","error"),await Mt()}catch(e){console.error("[corp-shipping] accept_loan_offer failed:",e),ae("Accept failed: "+(e?.message||"unknown"),"error")}finally{Ne.delete(t),ot()}}}async function ao(t){if(!(!t||Ne.has(t))){Ne.add(t),ot();try{const{data:e,error:i}=await _.rpc("reject_loan_offer",{p_offer_id:t});i?ae("Failed: "+i.message,"error"):e?.success?ae("Offer rejected.","success"):ae(e?.error||"Failed to reject","error"),await Mt()}catch(e){console.error("[corp-shipping] reject_loan_offer failed:",e),ae("Reject failed: "+(e?.message||"unknown"),"error")}finally{Ne.delete(t),ot()}}}async function no(t){if(!(!t||Kt.has(t))){Kt.add(t);try{const{data:e,error:i}=await _.rpc("acknowledge_corp_contract_event",{p_event_id:t,p_response_key:null});if(i)ae("Failed: "+i.message,"error");else if(!e?.success)ae(e?.error||"Failed to acknowledge","error");else{const n=e?.cost_applied?` − ${E(e.cost_applied)}`:"",a=e?.delay_applied?` ◊ +${e.delay_applied}t delay`:"";ae(`Acknowledged${n}${a}`,"success"),await At()}await Mt()}catch(e){console.error("[corp-shipping] acknowledge failed:",e),ae("Acknowledge failed: "+(e?.message||"unknown"),"error")}finally{Kt.delete(t)}}}function oo(){const t=document.getElementById("pi-list");!t||t.dataset.boundPi==="1"||(t.dataset.boundPi="1",t.addEventListener("click",e=>{const i=e.target.closest("[data-action]");if(!i||i.disabled)return;const n=i.getAttribute("data-action"),a=i.getAttribute("data-id");if(a){if(n==="ack-issue")return no(a);if(n==="accept-offer")return io(a);if(n==="reject-offer")return ao(a)}}))}const ui={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let Ve=[],Ci=[],Ea="ready",Xe=null,$t="ALL",Z=-1;const wt={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function so(t){$t=t,Z=-1,document.querySelectorAll(".ar-pill").forEach(e=>{const i=e.getAttribute("data-ar-filter");e.className="ar-pill"+(i===t?" active-"+(t==="ALL"?"all":t==="COASTAL"?"coastal":t==="INTERNATIONAL"?"intl":"gov"):"")}),Si()}function Ta(t){return Math.round(Number(t?.estimated_revenue||0)*oi(t))}function Ii(){return($t==="ALL"?Ve:Ve.filter(e=>e.scope===$t)).slice().sort((e,i)=>{const n=e.trade_agreement_id?0:1,a=i.trade_agreement_id?0:1;return n-a})}async function qt(){if(!f||f.corp_sector!=="Shipping")return;const t=await mn(_,f.id,f.corp_subsector);Ve=t.routes,Ci=t.applications,Ea=t.state,Xe=t.error,Xe&&console.warn("Failed to load available routes:",Xe.message),Z=-1,Si()}var ro={fuel_energy:[{stat:"industry",label:"Industry"},{stat:"workforce",label:"Workforce"}],minerals:[{stat:"industry",label:"Industry"},{stat:"industry",label:"Industry"}],grains_staples:[{stat:"farmland",label:"Farmland"},{stat:"workforce",label:"Workforce"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"farmland",label:"Farmland"}],cash_crops:[{stat:"farmland",label:"Farmland"},{stat:"service_sector",label:"Service Sector"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"workforce",label:"Workforce"}],technology:[{stat:"education",label:"Education"},{stat:"education",label:"Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"workforce",label:"Workforce"}],arms:[{stat:"industry",label:"Industry"},{stat:"control",label:"Control"}]};function lo(t){return ro[t]||[]}function co(t){var e=Number(t.competition_count||0),i=t.demand_level||"",n=t.scope==="GOVERNMENT";return n?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&i==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&i==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":i==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":i==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(t.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function Si(){const t=Ii();document.getElementById("ar-count").textContent=Ve.length+" ROUTES";var e={COASTAL:0,INTERNATIONAL:0,GOVERNMENT:0};Ve.forEach(function(h){e[h.scope]!==void 0&&e[h.scope]++});var i=e.COASTAL,n=e.INTERNATIONAL,a=e.GOVERNMENT;document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">COASTAL</span><span class="ar-footer__count-num">'+i+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">INTL</span><span class="ar-footer__count-num">'+n+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+a+"</span></div>";const r=document.getElementById("ar-claim-btn");r.className="ar-claim-btn"+(Z>=0?" active":"");const s=document.getElementById("ar-list");if(Ea==="error"){s.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+y(Xe&&Xe.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}if(t.length===0){s.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(Ve.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+$t.toLowerCase()+" routes available.")+"</div></div>";return}let o="";for(let h=0;h<t.length;h++){const b=t[h],$=Z===h,C=wt[b.scope]||wt.INTERNATIONAL,T=b.scope==="GOVERNMENT",w=b.demand_level&&ui[b.demand_level]?{color:ui[b.demand_level],label:b.demand_level}:null,I=Number(b.competition_count||0),L=I===0?"#5c5":I<=2?"#ca5":"#c84";if(o+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+($?C.color:"transparent")+";background:"+($?C.color+"08":"transparent")+';" onclick="arSelectRoute('+h+')"><div style="padding:8px 14px;">',o+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+y(b.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+C.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+C.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+C.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+y(b.destination_port||"?")+"</span></div>",o+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+C.color+";background:"+C.color+"12;border:1px solid "+C.color+'25">'+C.label+"</span>",w&&(o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+w.color+";background:"+w.color+"12;border:1px solid "+w.color+'25">'+w.label+" DEMAND</span>"),T&&b.gov_issuer&&(o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+y(b.gov_issuer)+"</span>"),I===0&&!T&&(o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>'),b.trade_agreement_id&&!T){const q=b.trade_agreement_name?" · "+y(String(b.trade_agreement_name).slice(0,28)):"";o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.1);border:1px solid rgba(92,204,92,0.3)">ACTIVE AGREEMENT ×1.2'+q+"</span>"}else!b.trade_agreement_id&&!T&&(o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#9e9a92;background:rgba(158,154,146,0.06);border:1px solid rgba(158,154,146,0.15)">OPEN MARKET ×1.0</span>');var l=Ci.find(function(q){return q.route_id===b.id});if(l){var c=l.status==="approved"?"#5c5":"#c8a832",m=l.status==="approved"?"APPROVED":"APPLIED";o+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+c+";background:"+c+"12;border:1px solid "+c+'25">'+m+"</span>"}if(o+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(b.transit_ticks||"?")+" tick"+((b.transit_ticks||0)!==1?"s":"")+" · "+y(b.vessel_class||"?")+"</span>",o+="</div>",o+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',T)o+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(b.gov_contract_duration||b.transit_ticks||"?")+" ticks</div></div>",o+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+y(b.vessel_class||"?")+"</div></div>",o+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+A(Number(b.gov_contract_value||b.estimated_revenue||0))+"</div></div>",o+="</div>";else{const q=yo(b),j=q.net>0?"#5c5":q.net<0?"#c84":"#9e9a92";o+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+A(Number(b.trade_volume||0))+"</div></div>",o+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+L+';margin-top:1px">'+I+"</div></div>",o+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(b.transit_ticks||"?")+" tick"+((b.transit_ticks||0)!==1?"s":"")+"</div></div>",o+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+(b.trade_agreement_id?"#5c5":"#b0aa9a")+';margin-top:1px">'+A(Ta(b))+"</div></div>",o+="</div>",o+='<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 8px;background:var(--bg-0);border:1px solid var(--border-0);border-top:none;"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.5px;">EST. MONTHLY MARGIN (state fuel + maint + incident reserve)</span><span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+j+';">'+(q.net>=0?"+":"")+A(q.net)+"</span></div>"}if($){if(o+='<div style="margin-top:6px;">',T&&b.goods_description&&(o+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+y(b.goods_description)+"</div>"),b.trade_agreement_name&&(o+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+y(b.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(b.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(b.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),o+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',o+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+y(b.vessel_class||"?")+"</span></div>",b.vessel_note&&(o+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+y(b.vessel_note)+"</span></div>"),o+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(b.proximity!=null?b.proximity:"?")+" / 100</span></div>",o+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+y(b.goods_name||"Unknown")+"</span></div>",b.goods_description&&!T&&(o+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+y(b.goods_description)+"</span></div>"),o+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(b.volume_physical||0).toLocaleString()+" "+y(b.volume_unit||"tons")+"</span></div>",o+="</div>",z&&!T){var d=lo(b.trade_sector);if(d.length>0){o+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var u=0;u<d.length;u++){var v=d[u],g=Number(z[v.stat]??50),x=g>=50?"#5c5":g>=30?"#ca5":"#c84";o+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+y(v.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+g+"%;height:100%;background:"+x+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(g)+"</span></div>"}o+="</div>"}}var p=co(b);p&&(o+='<div style="padding:4px 8px;background:'+C.color+"08;border:1px solid "+C.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+y(p)+"</div></div>"),o+="</div>"}o+="</div></div>"}s.innerHTML=o}function po(t){Z=Z===t?-1:t,Si()}let De=null,Le=null,ee=0,ft=!1;async function fo(t){const i=Math.round(57499.99999999999),n=5e4;if(!t)return{tier:"state",cost:15e4,ownerFactionId:null,ownerName:null};try{const{data:a}=await _.from("corp_properties").select("id, faction_id").eq("nation_id",t).eq("faction_id",f.id).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(a)return{tier:"own",cost:n,ownerFactionId:f.id,ownerName:f.faction_name};const{data:r}=await _.from("corp_properties").select("id, faction_id, factions!faction_id(faction_name)").eq("nation_id",t).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(r)return{tier:"other",cost:i,ownerFactionId:r.faction_id,ownerName:r.factions?.faction_name||"another corporation"}}catch(a){console.warn("[Depot lookup] failed:",a?.message||a)}return{tier:"state",cost:15e4,ownerFactionId:null,ownerName:null}}const vi=.06,mo={loading:.85},uo={Coastal:.82,Container:1.18,Bulk:1,Tanker:1.28,Reefer:1.12,LNG:1.34},vo={Coastal:9e4,Container:145e3,Bulk:175e3,Tanker:19e4,Reefer:14e4,LNG:29e4};function Ai(t,e,i){const a=Math.max(0,Math.min(100,Number(t?.proximity)||50)),r=String(t?.scope||"").toUpperCase(),s=uo[e]||1,o=.75+a/100*.9,l=r==="COASTAL"?.92:r==="GOVERNMENT"?1.05:1,c=Math.round(5e4*s*o*l);return i==="own"?c:Math.round(i==="other"?c*1.15:c*1.65)}function yo(t){const e=Math.max(1,Number(t?.transit_ticks)||2),i=Math.max(1,12/(e*2)),n=Math.round(Ta(t)*i),a=Math.round(Ai(t,t?.vessel_class,"state")*i),r=Math.round((vo[t?.vessel_class]||12e4)*mo.loading),s=Math.round(n*vi),o=n-a-r-s;return{gross:n,fuel:a,maintenance:r,reserve:s,net:o}}function go({route:t,proposedRate:e,tierMult:i,depotTier:n}){const a=Number(e)||0,r=Math.round(a*(Number(i)||1)),s=Ai(t,t?.vessel_class,n),o=r-s;return{bid:a,revenue:r,fuelPerTrip:s,netPerTrip:o}}async function _o(){if(Z<0||!f||!M)return;var t=Ii(),e=t[Z];if(!e)return;var i=Ci.find(function(l){return l.route_id===e.id});if(i){alert("You have already applied for this route. Status: "+i.status);return}var n={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},a=n[f.corp_subsector]||"";if(e.shipping_subsector&&a!==e.shipping_subsector){var r=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(l){return l.toUpperCase()});alert("Your fleet specializes in "+(f.corp_subsector||"?")+" but this route requires "+r+".");return}De=e,De.destDepot=await fo(e.destination_nation_id);const s=ia(e.trade_volume,e.shipping_subsector),o=Math.round((aa+s)/2);ee=Ja(Number(e.estimated_revenue)||o,s),Le=null,qi()}function Mi(){De=null,document.getElementById("ra-modal-overlay")?.remove()}function bo(t){Le=t,qi()}function xo(t){ee=Number(t),qi()}function qi(){if(document.getElementById("ra-modal-overlay")?.remove(),!De)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#5a8aaa",green:"#5c5",gold:"#c8a832",orange:"#c84",red:"#c55",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=De,n=wt[i.scope]||wt.INTERNATIONAL,a=oi(i),r=i.destDepot?.tier||"state",s=ne.filter(R=>R.status==="in_port"&&!R.active_claim_id&&R.condition>=20),o=s.find(R=>R.id===Le),l=!!o&&ee>0,c=go({route:i,proposedRate:ee,tierMult:a,depotTier:r}),m=c.netPerTrip>0?e.green:c.netPerTrip<0?e.red:e.dim,d=Number(o?.base_maintenance)||0,u=Number(i.transit_ticks)||0,v=d*u,g=c.netPerTrip>=v;let x=`
    <div style="width:520px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;max-height:90vh;">
        <div style="padding:12px 20px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:10px;color:${n.color}">●</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;letter-spacing:2px;color:${e.muted};">ROUTE APPLICATION</span>
            </div>
            <span onclick="raClose()" style="font-family:${t};font-size:18px;color:${e.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:14px 20px;overflow:auto;flex:1;">

            <div style="display:flex;align-items:center;gap:0;margin-bottom:12px;">
                <span style="font-size:14px;font-weight:700;color:${e.text}">${y(i.origin_port||"?")}</span>
                <div style="flex:1;display:flex;align-items:center;margin:0 10px;">
                    <div style="flex:1;height:1px;background:${n.color}44"></div>
                    <span style="font-family:${t};font-size:8px;color:${n.color};padding:0 8px">⚓ ${i.transit_ticks||"?"} tick${(i.transit_ticks||0)!==1?"s":""}</span>
                    <div style="flex:1;height:1px;background:${n.color}44"></div>
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

            ${(()=>{const R=i.destDepot;if(!R)return"";const F=i.destination_port||"this port",H=Ai(i,i.vessel_class,R.tier),k="$"+Math.round(H).toLocaleString()+" / refuel";let N,B;return R.tier==="own"?(N=`${F} has your Fuel Depot (${y(R.ownerName||f.faction_name||"your corp")}) — ${k}.`,B=e.green):R.tier==="other"?(N=`${F} has a Fuel Depot (${y(R.ownerName||"another corp")}) — ${k}.`,B=e.gold):(N=`${F} has no fuel depot — paying ${k} to the government-owned depot.`,B=e.orange),`<div style="padding:7px 10px;margin-bottom:14px;background:${e.card};border:1px solid ${e.border};border-left:2px solid ${B};font-family:${t};font-size:9px;color:${e.text};line-height:1.5;">
                    <span style="color:${e.dim};font-size:7px;font-weight:700;letter-spacing:0.5px;">FUEL AT DESTINATION</span><br>
                    ${N}
                </div>`})()}

            ${(()=>{const R=!!i.trade_agreement_id,F=oi(i),H=R?e.green:e.dim,k=R?`ACTIVE TRADE AGREEMENT${i.trade_agreement_name?" · "+y(i.trade_agreement_name):""}`:"OPEN-MARKET ROUTE",N=R?`Revenue = your bid × ${F.toFixed(2)} (agreement bonus).`:`Revenue = your bid × ${F.toFixed(2)} (organic route penalty). Agreement-backed lanes pay more.`;return`<div style="padding:7px 10px;margin-bottom:14px;background:${e.card};border:1px solid ${e.border};border-left:2px solid ${H};font-family:${t};font-size:9px;color:${e.text};line-height:1.5;">
                    <span style="color:${e.dim};font-size:7px;font-weight:700;letter-spacing:0.5px;">${k}</span><br>
                    ${N}
                </div>`})()}

            <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">SELECT VESSEL</div>`;if(s.length===0)x+=`<div style="padding:14px;text-align:center;background:${e.card};border:1px solid ${e.border};margin-bottom:14px;">
            <div style="font-family:${t};font-size:10px;color:${e.red};">No available vessels</div>
            <div style="font-family:${t};font-size:8px;color:${e.dim};margin-top:4px;">You need a vessel in port, not assigned to another route, with condition ≥ 20%.</div>
        </div>`;else{x+='<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px;">';for(const R of s){const F=Le===R.id,H=R.condition>=75?e.green:R.condition>=50?e.gold:e.orange,k=R.fuel>=60?e.green:R.fuel>=30?e.gold:e.red;x+=`<div onclick="raSelectVessel('${R.id}')" style="padding:8px 10px;background:${F?e.accent+"12":e.card};border:1px solid ${F?e.accent+"44":e.border};cursor:pointer;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-size:11px;font-weight:600;color:${e.text};">${y(R.vessel_name)}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${n.color};background:${n.color}12;border:1px solid ${n.color}25;">${R.vessel_class.toUpperCase()}</span>
                </div>
                <div style="display:flex;gap:12px;font-family:${t};font-size:8px;">
                    <span style="color:${e.dim};">Condition: <span style="color:${H};font-weight:700;">${R.condition}%</span></span>
                    <span style="color:${e.dim};">Fuel: <span style="color:${k};font-weight:700;">${R.fuel}%</span></span>
                    <span style="color:${e.dim};">Capacity: <span style="color:${e.text};font-weight:700;">${(R.capacity_dwt||0).toLocaleString()} ${R.capacity_unit||"DWT"}</span></span>
                </div>
            </div>`}x+="</div>"}const p=aa,h=ia(i.trade_volume,i.shipping_subsector),b=Math.round((p+h)/2);(ee>h||ee<p)&&(ee=Math.min(h,Math.max(p,ee))),x+=`
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
                    <span style="color:${e.muted};">Mid (${A(b)})</span>
                    <span>Ceiling (${A(h)})</span>
                </div>
            </div>`;const $=i.destDepot?.tier==="own"?"own depot":i.destDepot?.tier==="other"?"other corp's depot +15%":"state depot (+65%)",C=Math.max(1,12/(Math.max(1,u)*2)),T=Math.round(c.revenue*C),w=Math.round(c.fuelPerTrip*C),I=o?o.status==="in_transit"?1.25:o.status==="in_port"?.55:.85:.85,L=Math.round(d*I),q=Math.round(T*vi),j=T-w-L-q,O=j>0?e.green:j<0?e.red:e.dim;x+=`
            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">ESTIMATED ECONOMICS (PER TRIP)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Bid</span>
                        <span style="font-family:${t};font-size:10px;color:${e.text};">${A(c.bid)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Revenue ×${a} (${i.trade_agreement_id?"agreement":"organic"})</span>
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.green};">${A(c.revenue)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Fuel at destination (${$})</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${A(c.fuelPerTrip)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text};">NET PER TRIP</span>
                        <span style="font-family:${t};font-size:14px;font-weight:700;color:${m};">${c.netPerTrip>=0?"+":""}${A(c.netPerTrip)}</span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">FLEET OVERHEAD (ONGOING)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    ${o?`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Vessel maintenance · ${y(o.vessel_class||"?")}</span>
                              <span style="font-family:${t};font-size:10px;color:${e.text};">${A(d)} / tick</span>
                           </div>
                           <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Accrues during ${u}-tick transit</span>
                              <span style="font-family:${t};font-size:10px;color:${e.text};">${A(v)}</span>
                           </div>
                           <div style="display:flex;justify-content:space-between;padding:5px 0;">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Net per trip vs. maint accrued</span>
                              <span style="font-family:${t};font-size:10px;font-weight:700;color:${g?e.green:e.red};">${g?"covers":"short by "+A(Math.max(0,v-c.netPerTrip))}</span>
                           </div>`:`<div style="font-family:${t};font-size:9px;color:${e.dim};line-height:1.5;">Select a vessel to see its per-tick maintenance cost. Maintenance is charged on every corp tick to every vessel regardless of activity, so higher-class ships need higher-paying routes to break even.</div>`}
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">PROFITABILITY CHECKPOINT (MONTHLY / ACTIVE SHIP)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Expected monthly gross revenue</span>
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.green};">${A(T)}</span>
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
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Incident reserve (${Math.round(vi*100)}%)</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${A(q)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text};">EST. MONTHLY NET</span>
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${O};">${j>=0?"+":""}${A(j)}</span>
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
    </div>`;const S=document.createElement("div");S.id="ra-modal-overlay",S.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",S.innerHTML=x,S.addEventListener("click",R=>{R.target===S&&Mi()}),document.body.appendChild(S)}async function ho(){if(ft||!De||!Le||!f||!M)return;ft=!0;const t=De,e=5e4,{data:i}=await _.from("factions").select("corp_cash_reserves").eq("id",f.id).single(),n=Number(i?.corp_cash_reserves??0);if(n<e){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(n/1e3)+"k."),ft=!1;return}try{const a=n-e,{error:r}=await _.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);if(r){alert("Failed to deduct fee.");return}const s={route_id:t.id,faction_id:f.id,vessel_id:Le,proposed_rate:ee,application_fee:e,status:"pending",applied_at_tick:M.current_tick};let{error:o}=await _.from("shipping_applications").insert(s);if(o&&/vessel_id/i.test(o.message||"")){const{vessel_id:l,...c}=s;o=(await _.from("shipping_applications").insert(c)).error}if(o){await _.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);const l=o.code==="23505"||/duplicate key|idx_shipping_applications_unique/i.test(o.message||"");alert(l?"You already have a pending or approved application on this route. Withdraw it from Route Applications before applying again.":"Application failed: "+o.message);return}try{await _.from("event_log").insert({nation_id:t.origin_nation_id,event_name:f.faction_name+" applied to service "+(t.origin_port||"?")+" → "+(t.destination_port||"?"),category:"corporate",description_chosen:f.faction_name+" submitted a shipping application for the "+(t.goods_name||"trade")+" route at a proposed rate of "+A(ee)+"/trip. Vessel: "+(ne.find(l=>l.id===Le)?.vessel_name||"Unknown"),fired_at_tick:M.current_tick})}catch(l){console.warn("[Shipping] Event log failed:",l?.message||l)}Mi(),await At(),Z=-1,await qt(),alert("Application submitted! The government will review your application.")}catch(a){alert("Application failed: "+(a.message||"Network error"))}finally{ft=!1}}async function $o(){if(!(Wt||Z<0||!f||!M)){var t=Ii(),e=t[Z];if(e){var i=Number(f.shipping_fleet_capacity??0),n=Number(f.shipping_fleet_deployed??0);if(n>=i){alert("No available vessels. Fleet capacity: "+i+", deployed: "+n+".");return}Wt=!0;var a=document.getElementById("ar-claim-btn");a.textContent="CLAIMING...",a.className="ar-claim-btn";try{var{data:r,error:s}=await _.rpc("claim_shipping_route",{p_faction_id:f.id,p_route_id:e.id,p_current_tick:M.current_tick});if(s){alert("Claim failed: "+s.message);return}if(r&&!r.success){alert(r.error||"Claim failed.");return}if(r?.claim_id){var o=(ne||[]).find(function(u){return u.status==="in_port"&&!u.active_claim_id&&u.fuel>=10});if(o){var{error:l}=await _.from("corp_vessels").update({status:"in_transit",active_claim_id:r.claim_id,current_port_nation_id:null}).eq("id",o.id);l&&console.warn("Failed to assign vessel to route:",l.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var c=e.origin_nation?.name||e.origin_nation_id||"Unknown",m=e.destination_nation?.name||e.destination_nation_id||"Unknown",d=e.goods_type||e.cargo_type||"goods";await _.from("event_log").insert({nation_id:f.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:f.faction_name+" has just signed an agreement to ship "+d+" between "+c+" and "+m+".",fired_at_tick:M.current_tick||0})}catch{}await At(),Z=-1,await Promise.all([qt(),Nt(),pe()])}catch(u){alert("Claim failed: "+(u.message||"Network error"))}finally{Wt=!1,a.textContent="CLAIM ROUTE",a.className="ar-claim-btn"+(Z>=0?" active":"")}}}}let Ce=[],Ca="ready",Ze=null,kt=-1;async function Nt(){if(!f)return;const t=await un(_,f.id);Ce=t.claims,Ca=t.state,Ze=t.error,Ze&&console.warn("Failed to load active voyages:",Ze.message),Ia()}function wo(t){kt=kt===t?-1:t,Ia()}async function ko(t){if(!(Yt||!f||!M)){Yt=!0;try{var{data:e,error:i}=await _.rpc("release_shipping_route",{p_faction_id:f.id,p_claim_id:t,p_current_tick:M.current_tick});if(i){alert("Release failed: "+i.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:n}=await _.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",t).eq("faction_id",f.id);n&&console.warn("Failed to free vessel on release:",n.message),kt=-1,await At(),await Promise.all([qt(),Nt(),pe()])}catch(a){alert("Release failed: "+(a.message||"Network error"))}finally{Yt=!1}}}function Ia(){const t=M?.current_tick||0,e=Number(f?.shipping_fleet_capacity??0),i=Number(f?.shipping_fleet_deployed??0),n=f?.corp_subsector||"--";document.getElementById("av-count").textContent=Ce.length+" ACTIVE";const a=Ce.reduce((m,d)=>m+Number(d.total_revenue||0),0),r=Ce.reduce((m,d)=>m+(d.transits_completed||0),0),s=r>0?Math.round(a/r):0;document.getElementById("av-summary").innerHTML=`
        <div class="av-summary__cell">
            <div class="av-summary__label">FLEET</div>
            <div class="av-summary__value" style="color:${i>=e?"var(--orange)":"var(--text-bright)"}">
                ${i} <span style="font-size:9px;color:var(--text-dim)">/ ${e}</span>
            </div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">TRANSITS</div>
            <div class="av-summary__value" style="color:var(--text-bright)">${r}</div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">AVG REV/TRIP</div>
            <div class="av-summary__value" style="color:var(--green)">${A(s)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=A(a),document.getElementById("av-total-revenue").style.color=a>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=i+"/"+e,document.getElementById("av-subsector").textContent=n;const o=document.getElementById("av-list");if(Ca==="error"){o.innerHTML='<div class="av-empty"><div class="av-empty__text">'+y(Ze&&Ze.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(Ce.length===0){o.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let l="";for(let m=0;m<Ce.length;m++){const d=Ce[m],u=d.shipping_routes||{},v=kt===m,x=(ne||[]).find(q=>q.active_claim_id===d.id)?.status,p=x==="in_port"?"loading":x==="in_transit"?"in_transit":x==="anchored"?"stranded":"idle";let h=p.toUpperCase().replace("_"," "),b="av-status--idle",$="";if(p==="loading")b="av-status--loading",h="LOADING";else if(p==="in_transit"){b="av-status--transit";const q=d.transit_started_tick||t,O=(d.transit_arrives_tick||q+(u.transit_ticks||2))-q,S=Math.max(0,Math.min(t-q,O)),R=O>0?Math.round(S/O*100):0;h="IN TRANSIT ("+S+"/"+O+")",$='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+R+'%"></div></div>'}const C=Number(d.revenue_per_transit||0),T=Number(d.market_share_pct||0),w=d.transits_completed||0,I=Number(d.total_revenue||0),L=ui[u.demand_level]||"#6a6660";if(l+='<div class="av-item" onclick="avToggle('+m+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+y(u.origin_port||"?")+" → "+y(u.destination_port||"?")+'</div><span class="av-status '+b+'">'+h+'</span></div><div class="av-item__cargo">'+y(u.goods_name||"Unknown")+" · "+y(u.vessel_class||"?")+"</div>"+$+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+A(C)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+T.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+w+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+A(I)+"</div></div></div>",v){l+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+y(u.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+y(u.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+y((u.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+y(u.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(u.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+A(Number(u.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(u.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(u.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+L+'">'+(u.demand_level||"?")+"</span></div>"+(u.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+y(u.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(d.claimed_at_tick||"?")+"</span></div>";var c=(ne||[]).find(function(q){return q.active_claim_id===d.id});c?l+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+y(c.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(c.fuel>50?"#5c5":c.fuel>20?"#ca5":"#c55")+'">'+(c.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(c.condition>50?"#5c5":c.condition>30?"#ca5":"#c55")+'">'+(c.condition||0)+"%</div></div></div></div>":l+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+d.id+"','"+(u.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`,l+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+d.id+`')">RELEASE ROUTE</button></div>`}l+="</div>"}o.innerHTML=l}let et=[];const Eo={stranded:{label:"STRANDED"},mechanical_failure:{label:"MECHANICAL"},collision:{label:"COLLISION"},fire:{label:"FIRE"},piracy:{label:"PIRACY"},storm_damage:{label:"STORM"}};async function Ni(){if(!f){et=[],Zi();return}const{data:t,error:e}=await _.from("vessel_incidents").select("id, vessel_id, nation_id, incident_type, incident_tick, description, severity, status, corp_vessels!vessel_id(id, vessel_name, vessel_class)").eq("faction_id",f.id).eq("status","pending").order("incident_tick",{ascending:!1});e?(console.warn("[VesselIncidents] load failed:",e.message),et=[]):et=t||[],Zi()}function Zi(){const t=document.getElementById("vi-count"),e=document.getElementById("vi-list");if(!t||!e)return;const i=et||[];if(t.textContent=i.length+" PENDING",i.length===0){e.innerHTML=`<div class="vi-empty">
            <div class="vi-empty__text">No pending incidents.<br>Claim-eligible events on your fleet appear here.</div>
        </div>`;return}e.innerHTML=i.map(n=>{const a=Eo[n.incident_type]||{label:(n.incident_type||"INCIDENT").toUpperCase()},r=n.corp_vessels?.vessel_name||"Unknown Vessel",s=n.severity==="total",o=n.severity?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;margin-left:4px;color:${s?"#000":"var(--amber)"};background:${s?"var(--red)":"var(--amber-faint)"};border:1px solid ${s?"var(--red)":"var(--amber-border)"};">${s?"TOTAL LOSS":"PARTIAL"}</span>`:"";return`<div class="vi-item" data-incident-id="${n.id}">
            <div class="vi-item__head">
                <span class="vi-item__vessel">${y(r)}</span>
                <span class="vi-item__tick">Tick ${n.incident_tick}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0;margin-bottom:6px;flex-wrap:wrap;">
                <span class="vi-item__type" style="margin-bottom:0;">${y(a.label)}</span>
                ${o}
            </div>
            <div class="vi-item__desc">${y(n.description||"")}</div>
            <div class="vi-item__actions">
                <button class="vi-action-btn vi-action-btn--dismiss" onclick="viDismissIncident('${n.id}')">DISMISS</button>
                <button class="vi-action-btn vi-action-btn--file" onclick="viFileClaim('${n.id}')">FILE CLAIM</button>
            </div>
        </div>`}).join("")}let We=!1;async function To(t){if(We)return;const e=et.find(i=>i.id===t);if(e){We=!0;try{const{data:i}=await _.from("subsidiary_auto_policies").select("id, principal, deductible_pct, lender_faction_id, policy_terms").eq("insured_vessel_id",e.vessel_id).eq("status","active").limit(1).maybeSingle(),{data:n}=i?{data:null}:await _.from("finance_active_loans").select("id, principal, deductible_pct, lender_faction_id").eq("insured_vessel_id",e.vessel_id).eq("status","current").limit(1).maybeSingle(),a=i||n;if(!a){alert("No active insurance policy covers this vessel. Consider purchasing coverage before the next incident.");return}const r=e.corp_vessels?.vessel_name||"vessel",s=Number(a.principal)||0,o=e.severity==="total"||e.incident_type==="stranded"||!e.severity,l=Math.round(o?s:s*.35),c=`File claim on ${r}?

Severity:    ${o?"Total loss":"Partial loss"}
Claim:       $${l.toLocaleString()}
Deductible:  ${a.deductible_pct||10}%`;if(!confirm(c))return;const m=i?"auto":"deal",d=M?.current_tick||0,{data:u,error:v}=await _.from("insurance_claims").insert({policy_id:a.id,policy_source:m,claimant_faction_id:f.id,insurer_faction_id:a.lender_faction_id,insured_vessel_id:e.vessel_id,claim_amount:l,claim_reason:e.description||`${r} — incident ${e.incident_type}`,policy_terms:a.policy_terms||null,deductible_pct:Number(a.deductible_pct)||10,status:"filed",filed_at_tick:d}).select("id").single();if(v){alert("Failed to file claim: "+v.message);return}const{error:g}=await _.from("vessel_incidents").update({status:"filed",filed_at_tick:d,filed_claim_id:u?.id||null}).eq("id",e.id);g&&console.warn("[VesselIncidents] incident update after file failed:",g.message);try{await _.from("event_log").insert({nation_id:e.nation_id||f.nation_id,faction_id:f.id,event_name:`${f.faction_name||"A corporation"} filed an insurance claim`,category:"corporate",description_chosen:`${f.faction_name||"Corporation"} filed a claim on ${r} for $${Math.round(l).toLocaleString()}.`,fired_at_tick:d})}catch{}await Ni()}catch(i){console.error("[VesselIncidents] fileClaim error:",i),alert("File claim failed: "+(i?.message||"unknown error"))}finally{We=!1}}}window.viFileClaim=To;async function Co(t){if(!We&&confirm("Dismiss this incident without filing a claim? The vessel remains in whatever state the tick processor left it.")){We=!0;try{const{error:e}=await _.from("vessel_incidents").update({status:"dismissed",filed_at_tick:M?.current_tick||0}).eq("id",t);if(e){alert("Dismiss failed: "+e.message);return}await Ni()}finally{We=!1}}}window.viDismissIncident=Co;function Io(t,e){const i=(ne||[]).filter(function(r){return r.status==="in_port"&&!r.active_claim_id&&r.fuel>=15&&r.condition>=20});let n;i.length===0?n='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':n=i.map(function(r,s){var o=r.fuel>50?"#5c5":r.fuel>20?"#ca5":"#c55",l=r.condition>50?"#5c5":r.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+t+"','"+r.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+y(r.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+y(r.vessel_class||"?")+" · "+(r.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+o+'">'+r.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+l+'">'+r.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var a=document.createElement("div");a.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",a.onclick=function(r){r.target===a&&a.remove()},a.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+i.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+n+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(a)}async function So(t,e){if(!Qt){Qt=!0;try{var{error:i}=await _.from("corp_vessels").update({status:"in_port",active_claim_id:t}).eq("id",e).eq("faction_id",f.id);if(i){alert("Assignment failed: "+i.message);return}var n=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');n&&n.remove(),await Promise.all([Nt(),pe()])}catch(a){alert("Assignment failed: "+(a.message||"Network error"))}finally{Qt=!1}}}window.openAssignVesselModal=Io;window.assignVesselToRoute=So;function Li(){const t=ie.reduce((o,l)=>o+(l.owned||0),0),e=ie.reduce((o,l)=>o+(l.deployed||0),0),i=Ya(ie),n=t-e;document.getElementById("eq-count").textContent=t+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${e} <span style="font-size:9px;color:var(--text-dim)">/ ${t}</span>
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">AVAILABLE</div>
            <div class="eq-summary__value" style="font-size:14px;color:${n===0?"var(--orange)":"var(--green)"}">
                ${n}
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">MAINT/TICK</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--red)">
                ${A(i)}
            </div>
        </div>`;const a={};for(const o of ie)a[o.equipment_key]=o;let r="";for(let o=1;o<=3;o++){const l=it[o],c=ni(o),m=ci===o,d=c.reduce((v,g)=>v+(a[g.key]?.owned||0),0),u=c.reduce((v,g)=>v+(a[g.key]?.deployed||0),0);if(r+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${o})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${m?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${y(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${d>0?`<span class="eq-tier-hdr__count">${u}/${d}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,m)for(const v of c){const g=a[v.key],x=g?.owned||0,p=g?.deployed||0,h=g?.condition||0,b=v.maintenancePerUnit*x,$=x-p,C=x>0&&$===0,T=x>0&&h<65,w=ea(h),I=g?.assigned_projects||[],L=I.length>0?I.map(q=>q.contract_name||"Project").join(", ").slice(0,30):x>0&&p>0?p+" project"+(p>1?"s":""):"—";r+=`<div class="eq-row${x===0?" unowned":""}">`,r+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${x===0?" dim":""}">${y(v.name)}</span>
                        ${T?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${x>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${C?"var(--orange)":"var(--green)"}">${$}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${p}/${x}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,x>0?r+=`<div class="eq-detail">
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
                            <div class="eq-detail__value" style="color:var(--red)">${A(b)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:r+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',r+="</div>"}}document.getElementById("eq-list").innerHTML=r;const s=[1,2,3].map(o=>{const l=it[o],c=ni(o).reduce((m,d)=>m+(a[d.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${c>0?l.color+"33":"var(--border-0)"};background:${c>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${c>0?"var(--text-bright)":"var(--text-dim)"}">${c}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${A(i)}</div>
        </div>
        <div class="eq-footer__tiers">${s}</div>`}function Ao(t){ci=ci===t?-1:t,Li()}async function Sa(){if(!f)return;const{data:t,error:e}=await _.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",f.id);e?(console.warn("Failed to load equipment:",e.message),ie=[]):ie=t||[],Li()}async function Mo(){const{data:{user:t}}=await _.auth.getUser();if(!t){window.location.href="login.html";return}const e=new URLSearchParams(location.search).get("faction_id");if(!!e){const{data:d,error:u}=await _.from("factions").select("*").eq("id",e).single();u?console.warn("[Inspector] faction fetch failed:",u.message):d?.faction_type==="corporation"&&(f=d)}if(!f){const{data:d}=await _.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);Ee=(d||[]).filter(v=>v.nation_id);const u=sessionStorage.getItem("active_faction_id");if(f=Ee.find(v=>v.id===u)||Ee.find(v=>v.faction_type==="corporation")||Ee[0],!f){await _.auth.signOut(),window.location.href="login.html";return}if(f.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(f.corp_sector!=="Shipping"){const v=ta[f.corp_sector];if(v){window.location.href=v;return}}}const[n,a]=await Promise.all([f.nation_id?_.from("nations").select("*").eq("id",f.nation_id).single():Promise.resolve({data:null}),_.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);n.error&&console.warn("Nation load failed:",n.error.message),n.data&&(z=n.data),a.error&&console.warn("Shard load failed:",a.error.message),M=a.data;let r=0;if(f?.id){const{data:d}=await _.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",f.id).in("status",["open","bidding"]);if(d)for(const u of d)r+=(u.contract_bids||[]).length}const s=document.getElementById("corp-topbar-container");if(s){const{renderCorpTopBar:d}=await Ua(async()=>{const{renderCorpTopBar:v}=await import("./corp-topbar-BVNorCyj.js");return{renderCorpTopBar:v}},__vite__mapDeps([0,1])),u={};r>0&&(u.home={color:"#c8a832",title:r+" pending bid"+(r!==1?"s":"")+" on your projects"}),d(s,{faction:f,shard:M,activeTab:"operations",allUserFactions:Ee,badges:u})}if(M){if(document.getElementById("game-date").textContent=M.current_date||"—",document.getElementById("tick-number").textContent=M.current_tick||"—",M.next_tick_at){const u=(Number(M.tick_interval_hours)||8)*36e5,v=new Date(M.next_tick_at).getTime(),x=v-u+u/2;di=new Date(x>Date.now()?x:v+u/2),_n()}const d=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");d&&(d.textContent="Next Corp Tick")}const o=document.getElementById("topbar-cash");o&&(o.textContent="CASH: "+ka(Number(f.corp_cash_reserves??0)));const l=document.getElementById("topbar-ap");l&&(l.style.display="none");const c=document.getElementById("nation-pill");c&&(c.textContent=(z?.name||f.nation||"—").toUpperCase());const m=document.getElementById("corp-faction-dropdown");if(m){let d="";for(const u of Ee){const v=u.id===f.id,g=u.faction_type==="corporation"?"CORP":"PARTY",x=u.faction_type==="corporation"?"var(--teal)":"var(--amber)";d+=`<div class="corp-dd-item${v?" active":""}" onclick="switchToFaction('${u.id}', '${u.faction_type}')">
                <span class="corp-dd-type" style="color:${x}">${g}</span>
                <span class="corp-dd-name">${y(u.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${y(u.abbreviation||"—")}]</span>
            </div>`}m.innerHTML=d}oo(),await Promise.all([qt(),Nt(),pe(),Pi(),Na(),Ni(),yn(),Mt()]),Ga(f,z,M);try{await an(_,{faction:f,nation:z,shard:M},"auto-services-container")}catch(d){console.error("[CorpOps] Auto-services init failed:",d)}document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}async function qo(){await _.auth.signOut(),window.location.href="login.html"}function No(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function Lo(t,e){const i=document.getElementById("corp-faction-dropdown");if(i&&i.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),e==="corporation"){const n=(Ee||[]).find(a=>a.id===t);window.location.href=ta[n?.corp_sector]||"corp-operations.html"}else window.location.href="dashboard.html"}document.addEventListener("click",t=>{const e=document.getElementById("faction-switcher"),i=document.getElementById("corp-faction-dropdown");i&&e&&!e.contains(t.target)&&i.classList.remove("open")});document.addEventListener("keydown",t=>{t.key==="Escape"&&ct()});window.doLogout=qo;window.toggleCorpDropdown=No;window.switchToFaction=Lo;window.setFilter=bn;window.arSetFilter=so;window.arSelectRoute=po;window.arClaimRoute=$o;window.arApplyToService=_o;window.raClose=Mi;window.raSelectVessel=bo;window.raSetRate=xo;window.raSubmitApplication=ho;window.avToggle=wo;window.avRelease=ko;window.openContractDetail=_a;window.closeContractDetail=ct;window.toggleWhRow=On;window.toggleEqTier=Ao;window.switchEmNation=Vn;window.setEmType=Wn;window.setEmListing=Yn;window.setEmQty=Qn;window.purchaseEquipment=Kn;window.setPrMat=jn;window.setPrTier=Fn;window.setPrQty=Hn;window.purchaseMaterial=Un;let ve=null,be={},Y=120,xe=15,yi={},Ge=[];async function Ro(){if(!qe)return;if(Ye[qe.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}ve=qe,yi={};try{const{data:i}=await _.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",f.id);for(const n of i||[])yi[yt(n.material_key)]=Number(n.quantity||0)}catch{}Ge=[];try{const{data:i}=await _.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",ve.id).in("status",["pending","won"]);Ge=(i||[]).filter(n=>n.faction_id!==f?.id).map(n=>({name:n.factions?.faction_name||"Unknown",ticker:n.factions?.corp_ticker||"???",price:Number(n.bid_price||0),quality:Number(n.estimated_quality||0),status:n.status}))}catch{}be={};const t=ve.required_materials||{};for(const i of Object.keys(t))be[i]="STD";const e=ve.required_workforce||{};Y=Number(e.general||0)+Number(e.skilled||0)||120,xe=15,ct(),Lt()}function Ri(){document.getElementById("bid-assembly-overlay")?.remove(),ve=null}function zo(t,e){be[t]=e,Lt()}function Po(t){Y=t,Lt()}function Oo(t){xe=t,Lt()}function Lt(){if(document.getElementById("bid-assembly-overlay")?.remove(),!ve)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=ve,n=i.issuer_type==="GOVERNMENT",a=z?.name||f?.nation||"—",r=Number(i.budget_ceiling||0),s=Number(i.timeline_ticks||8),o=i.required_materials||{},l=Object.keys(o),c={LOW:.5,STD:1,HIGH:2},m={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},d={LOW:"Low",STD:"Standard",HIGH:"High"},u={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},v=yi||{};let g=0,x="";for(const D of l){const W=Number(o[D]||0),Bi=be[D]||"STD",ji=u[D]||3e5,Oa=c[Bi],Da=Math.round(ji*Oa),Fi=W*Da;g+=Fi;const Ba=D.replace(/_/g," ").replace(/\b\w/g,we=>we.toUpperCase()),Hi=Number(v[D]||0),Ot=Math.max(0,W-Hi),ja=Ot===0?e.greenBright:Ot<W?e.yellow:e.red,Fa=Ot===0?"✓ IN STOCK":`${Hi}/${W}`;x+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${Ba}</span>
                <div style="font-family:${t};font-size:7px;color:${ja};margin-top:1px">${Fa}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${t};font-size:9px;color:${e.muted}">${W.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(we=>{const Dt=Bi===we,Ui=m[we],Ha=E(Math.round(ji*c[we]));return`<span onclick="bidSetGrade('${D}','${we}')" style="padding:2px 6px;font-family:${t};font-size:7px;font-weight:700;cursor:pointer;color:${Dt?"#000":e.dim};background:${Dt?Ui:"transparent"};border:1px solid ${Dt?Ui:e.border}" title="${Ha}/unit">${d[we]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${t};font-size:10px;color:${e.text}">${E(Fi)}</span></div>
        </div>`}const p=i.required_workforce||{},h=Number(p.general||0)+Number(p.skilled||0)||100,b=Math.max(40,Math.round(h*.5)),$=h*2,C=[b,Math.round(h*.75),h,Math.round(h*1.5),$],T=Math.max(0,Math.min(1,(Y-b)/($-b||1))),w=s,I=Math.round(4.5-T*8),L=Math.max(Math.round(w*.6),w+I),q=I>0?`+${I}mo`:I<0?`${I}mo`:"On schedule",j=I>0?e.red:I<0?e.greenBright:e.yellow,O=15200,S=Y*O*L,R=r,H=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:R>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:R>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:R>1e7}].filter(D=>D.required),k=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),N=H.filter(D=>!k.has(D.name)).reduce((D,W)=>D+W.cost,0),B=4e5,U=g+S+N+B,X=Math.round(U*(xe/100)),fe=U+X,G=fe>r,zt=X,$e=G?0:Math.max(0,Math.min(100,Math.round(100-fe/r*100+30))),Di=$e>70?e.greenBright:$e>40?e.yellow:$e>0?e.orange:e.red,za=G?"OVER CEILING":$e>70?"STRONG":$e>40?"COMPETITIVE":$e>20?"WEAK":"UNLIKELY",Pt=Object.values(be),me=Pt.length>0?Math.round(Pt.reduce((D,W)=>D+(W==="HIGH"?85:W==="STD"?65:45),0)/Pt.length):50,dt=me>=75?e.greenBright:me>=50?e.yellow:me>=25?e.orange:e.red,Pa=me>=75?"EXCELLENT":me>=50?"FAIR":me>=25?"POOR":"BAD",je=document.createElement("div");je.id="bid-assembly-overlay",je.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",je.addEventListener("click",D=>{D.target===je&&Ri()}),je.innerHTML=`
    <div style="width:740px;max-height:94vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <!-- HEADER -->
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 8px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a.toUpperCase()}</span>
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${i.name}</span>
                    <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${n?e.accentBright:e.gold};background:${n?"rgba(163,176,126,0.1)":"rgba(200,168,50,0.08)"};border:1px solid ${n?"rgba(163,176,126,0.2)":"rgba(200,168,50,0.2)"}">${n?"GOV":"PRIVATE"}</span>
                </div>
                <span onclick="closeBidAssembly()" style="font-family:${t};font-size:14px;color:${e.dim};cursor:pointer;padding:0 4px">×</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:${t};font-size:9px;color:${e.dim}">${i.project_code||"—"}</span>
                <span style="font-family:${t};font-size:9px;color:${e.dim}">·</span>
                <span style="font-size:10px;color:${e.accent}">${i.issuer_name||"—"}</span>
                <span style="font-family:${t};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${t};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${E(r)}</span></span>
                <span style="font-family:${t};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${t};font-size:9px;color:${e.muted}">Timeline: <span style="color:${e.text};font-weight:700">${s} months</span></span>
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
                ${x}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${t};font-size:9px;color:${e.muted}">MATERIALS TOTAL</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${E(g)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${C.map(D=>`<span onclick="bidSetWorkers(${D})" style="padding:2px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${Y===D?"#000":e.dim};background:${Y===D?e.accent:"transparent"};border:1px solid ${Y===D?e.accent:e.border}">${D}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">${Y} × $${O.toLocaleString()}/tick × ${L} ticks</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${E(S)}</span>
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
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${j}">${L}mo <span style="font-size:8px;opacity:0.7">(${q})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${H.map(D=>{const W=k.has(D.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${t};font-size:8px;font-weight:700;color:${W?e.greenBright:e.orange}">${W?"✓":"○"}</span>
                            <span style="font-size:10px;color:${W?e.muted:e.text}">${D.name}</span>
                        </div>
                        ${W?`<span style="font-family:${t};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${t};font-size:9px;color:${e.redDim}">${E(D.cost)}</span>
                                <span style="font-family:${t};font-size:7px;color:${e.dim};margin-left:4px">${D.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${t};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${E(N)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${E(B)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:g},{l:"Labor",v:S},{l:"Permits",v:N},{l:"Overhead",v:B}].map(D=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${D.l}</span>
                    <span style="font-family:${t};font-size:10px;color:${e.redDim}">${E(D.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${E(U)}</span>
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
                    <div style="font-family:${t};font-size:22px;font-weight:700;color:${G?e.red:e.gold}">${E(fe)}</div>
                    ${G?`<div style="font-family:${t};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${E(r)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${t};font-size:14px;font-weight:700;color:${zt>0?e.greenBright:e.dim}">+${E(zt)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${Di}">${za}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${$e}%;height:100%;background:${Di}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${t};font-size:11px;font-weight:700;color:${dt}">${me}</span>
                            <span style="font-family:${t};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${t};font-size:8px;font-weight:700;color:${dt}">${Pa}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${me}%;height:100%;background:${dt}"></div></div>
                    <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${Ge.length===0?`<div style="font-family:${t};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${Ge.map(D=>`<span style="padding:2px 6px;font-family:${t};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${D.name} <span style="color:${e.dim}">Q:${D.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:3px">${Ge.length} competing bid${Ge.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${G?e.red:e.gold}">${E(fe)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${e.greenBright}">+${E(zt)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${dt}">${me}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${t};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${G?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${t};font-size:10px;font-weight:700;letter-spacing:1px;color:${G?e.dim:"#000"};background:${G?e.border:e.gold};cursor:${G?"not-allowed":"pointer"};opacity:${G?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(je)}let Jt=!1;async function Do(){if(Jt||!ve)return;const t=ve,e=t.required_materials||{},i=Object.keys(e),n=Number(t.budget_ceiling||0),a=Number(t.timeline_ticks||8),r={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},s={LOW:.5,STD:1,HIGH:2};let o=0;for(const O of i){const S=Number(e[O]||0),R=be[O]||"STD",F=r[O]||3e5;o+=S*Math.round(F*s[R])}const l=15200,c=t.required_workforce||{},m=Number(c.general||0)+Number(c.skilled||0)||100,d=Math.max(40,Math.round(m*.5)),u=m*2,v=Math.max(0,Math.min(1,(Y-d)/(u-d||1))),g=Math.round(4.5-v*8),x=Math.max(Math.round(a*.6),a+g),p=Y*l*x,h=n,b=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:h>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:h>5e7},{name:"Fire Safety Certification",cost:12e4,required:h>1e7}],$=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),C=b.filter(O=>O.required&&!$.has(O.name)).reduce((O,S)=>O+S.cost,0),w=o+p+C+4e5,I=Math.round(w*(xe/100)),L=w+I;if(L>n){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const q=Object.values(be),j=q.length>0?Math.round(q.reduce((O,S)=>O+(S==="HIGH"?85:S==="STD"?65:45),0)/q.length):50;if(confirm('Submit bid for "'+t.name+`"?

Bid Price: `+E(L)+`
Est. Cost: `+E(w)+`
Markup: `+xe+"% ("+E(I)+`)
Quality: `+j+`/100
Workers: `+Y+`

Once submitted, your bid cannot be changed.`)){Jt=!0;try{const{data:O}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),S=O?.current_tick||0,R={};for(const H of i)R[H]=be[H]||"STD";const{error:F}=await _.from("contract_bids").insert({contract_id:t.id,faction_id:f.id,bid_price:L,material_grades:R,labor_count:Y,markup_pct:xe,estimated_cost:w,estimated_quality:j,status:"pending",submitted_at_tick:S});if(F)throw F;t.status==="open"&&await _.from("construction_contracts").update({status:"bidding"}).eq("id",t.id).eq("status","open"),Ri(),alert(`Bid submitted successfully!

Contract: `+t.name+`
Your Bid: `+E(L)+`
Quality: `+j+`/100

Bids will be resolved when the bidding window closes (`+(t.bidding_ends_tick?"tick "+t.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Oe=="function"&&await Oe()}catch(O){alert("Bid submission failed: "+O.message)}finally{Jt=!1}}}window.openBidAssembly=Ro;window.closeBidAssembly=Ri;window.bidSetGrade=zo;window.bidSetWorkers=Po;window.bidSetMarkup=Oo;window.submitBidAssembly=Do;let Xt=!1;async function Bo(t){if(Xt)return;const e=1e6,i=Number(f?.corp_cash_reserves??0);if(i<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){Xt=!0;try{const n=i-e,{error:a}=await _.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);if(a)throw a;const{error:r}=await _.from("contract_bids").delete().eq("contract_id",t).eq("faction_id",f.id);if(r)throw r;f.corp_cash_reserves=n,typeof subUpdateTopbarCash=="function"&&subUpdateTopbarCash(n),alert("Bid retracted. $1M penalty applied."),ct(),await Oe()}catch(n){alert("Failed to retract bid: "+(n.message||"Unknown error"))}finally{Xt=!1}}}window.retractBid=Bo;let st=[],Se=0,de=null,Zt=!1,ei=!1,ti=!1;async function jo(){if(!qe||ei)return;ei=!0,de=qe,Se=0;const{data:t,error:e}=await _.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",de.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(ei=!1,e){alert("Failed to load bids: "+e.message);return}st=(t||[]).map(i=>({...i,corp:i.factions?.faction_name||"Unknown",abbr:i.factions?.corp_ticker||"???",subsector:i.factions?.corp_subsector||"—"})),ct(),Aa()}function Rt(){document.getElementById("bid-review-overlay")?.remove(),de=null}function Fo(t){Se=t,Aa()}async function Ho(){if(Zt||st.length===0)return;const t=st[Se];if(!(!t?.id||!t.faction_id)&&confirm("Accept bid from "+t.corp+`?

Bid Price: `+E(t.bid_price)+`
Quality: `+t.estimated_quality+`/100
Workers: `+t.labor_count+`

This will award the contract. The project begins immediately.`)){Zt=!0;try{const{data:e}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=e?.current_tick||0,{error:n}=await _.from("contract_bids").update({status:"won"}).eq("id",t.id);if(n)throw n;const{error:a}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",de.id).neq("id",t.id);if(a)throw a;const{error:r}=await _.from("construction_contracts").update({status:"awarded",awarded_to_faction:t.faction_id,awarded_at_tick:i}).eq("id",de.id);if(r)throw r;Rt(),alert("Contract awarded to "+t.corp+`!

Bid: `+E(t.bid_price)+`
Project begins immediately.`),typeof Oe=="function"&&await Oe()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{Zt=!1}}}async function Uo(){if(!(!de||ti)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){ti=!0;try{const{error:t}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",de.id);if(t)throw t;const{error:e}=await _.from("construction_contracts").update({status:"expired"}).eq("id",de.id);if(e)throw e;Rt(),alert("All bids declined. Contract cancelled."),typeof Oe=="function"&&await Oe()}catch(t){alert("Failed: "+(t.message||t))}finally{ti=!1}}}function Aa(){if(document.getElementById("bid-review-overlay")?.remove(),!de||st.length===0)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=de,n=st;Se>=n.length&&(Se=0);const a=n[Se],r=Number(i.budget_ceiling||0),s=Number(i.timeline_ticks||36),o=Math.min(...n.map(v=>v.bid_price)),l=Math.max(...n.map(v=>v.estimated_quality||0));let c="";for(let v=0;v<n.length;v++){const g=n[v],x=v===Se,p=g.bid_price===o,h=(g.estimated_quality||0)===l,b=g.bid_price>r;c+=`
        <div onclick="reviewSelectBid(${v})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${x?e.accent:"transparent"};background:${x?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${g.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${g.corp}</span>
                ${p?`<span style="font-family:${t};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${h?`<span style="font-family:${t};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${t};font-size:14px;font-weight:700;color:${b?e.red:e.text}">${E(g.bid_price)}</div>
                    ${b?`<div style="font-family:${t};font-size:7px;color:${e.red}">OVER BUDGET</div>`:""}
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
        </div>`}const m=a.bid_price>r,d=r>0?Math.round(a.bid_price/r*100):0,u=document.createElement("div");u.id="bid-review-overlay",u.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",u.addEventListener("click",v=>{v.target===u&&Rt()}),u.innerHTML=`
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
                <span>Budget: <span style="color:${e.text};font-weight:700">${E(r)}</span></span>
                <span>·</span>
                <span>Timeline: <span style="color:${e.text};font-weight:700">${s}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${n.length} BID${n.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${t};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${E(o)}</span></span>
                <span>Best Quality: <span style="color:${e.accent}">${l}</span></span>
            </div>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${e.border};overflow:auto;">
                ${c}
            </div>
            <div style="width:250px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.gold}">${a.abbr}</span>
                        <span style="font-size:12px;font-weight:700;color:${e.text}">${a.corp}</span>
                    </div>
                    <div style="font-family:${t};font-size:8px;color:${e.dim};margin-top:2px">${a.subsector}</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="font-family:${t};font-size:8px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Breakdown</span>
                </div>
                ${[{l:"Materials",v:Number(a.estimated_cost||0)*.45},{l:"Labor",v:Number(a.estimated_cost||0)*.45},{l:"Overhead",v:Number(a.estimated_cost||0)*.1}].map(v=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.dim};text-transform:uppercase">${v.l}</span>
                    <span style="font-family:${t};font-size:10px;color:${e.muted}">${E(Math.round(v.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${m?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${t};font-size:14px;font-weight:700;color:${m?e.red:e.gold}">${E(a.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${t};font-size:9px;font-weight:700;color:${m?e.red:e.greenBright}">${m?"OVER":"WITHIN"} — ${d}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,d)}%;height:100%;background:${m?e.red:e.accent}"></div></div>
                </div>
                ${[{l:"Quality",v:a.estimated_quality+"/100",c:(a.estimated_quality||0)>=75?e.greenBright:(a.estimated_quality||0)>=55?e.yellow:e.orange},{l:"Markup",v:a.markup_pct+"%",c:e.muted},{l:"Workers",v:a.labor_count+" workers",c:e.text}].map(v=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.dim};text-transform:uppercase">${v.l}</span>
                    <span style="font-family:${t};font-size:10px;font-weight:700;color:${v.c}">${v.v}</span>
                </div>`).join("")}
                <div style="flex:1"></div>
            </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${e.gold}">${E(a.bid_price)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${e.text}">${a.corp}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${(a.estimated_quality||0)>=75?e.greenBright:e.yellow}">${a.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(u)}const Re={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},Go={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function Ma(t){return t>=75?"#5c5":t>=50?"#ca5":t>=25?"#c84":"#c55"}function Vo(t){return t>=60?"#5c5":t>=30?"#ca5":t>=15?"#c84":"#c55"}async function pe(){if(!f)return;const{data:t,error:e}=await _.from("corp_vessels").select("*").eq("faction_id",f.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),ne=t||[],nt=null;const{data:i,error:n}=await _.from("vessel_orders").select("id, vessel_name, vessel_class, shipyard_nation, ordered_at_tick, delivery_tick, build_ticks, balance_due").eq("faction_id",f.id).eq("status","building").order("delivery_tick",{ascending:!0});n&&console.warn("Failed to load vessel orders:",n.message),fa=i||[],Je={},gt={};try{const a=ne.map(r=>r.id);if(a.length>0){const{data:r}=await _.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",a).in("status",["current"]);for(const o of r||[])o.insured_vessel_id&&(Je[o.insured_vessel_id]=!0);const{data:s}=await _.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",f.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const o of s||[])o.insured_vessel_id&&!Je[o.insured_vessel_id]&&(gt[o.insured_vessel_id]=!0)}}catch(a){console.warn("Failed to load vessel insurance status:",a.message)}qa()}function Wo(t){nt=nt===t?null:t,qa()}function qa(){const t=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),i=document.getElementById("fl-list"),n=document.getElementById("fl-footer");if(!t||!i)return;const a=ne,r=fa||[],s=r.length;t.textContent=a.length+" VESSEL"+(a.length!==1?"S":"")+(s>0?" · "+s+" BUILDING":"");const o=a.filter(p=>p.status==="in_transit").length,l=a.filter(p=>p.status==="in_port"||p.status==="anchored").length,c=a.filter(p=>p.status==="dry_dock").length,m=a.reduce((p,h)=>p+(h.base_maintenance||0),0),d=s>0?[{label:"TRANSIT",value:o,color:"#5a8aaa"},{label:"IN PORT",value:l,color:"#8b9a6b"},{label:"BUILDING",value:s,color:"var(--amber)"},{label:"DRY DOCK",value:c,color:"#c84"},{label:"MAINT/TICK",value:E(m),color:"#a44"}]:[{label:"TRANSIT",value:o,color:"#5a8aaa"},{label:"IN PORT",value:l,color:"#8b9a6b"},{label:"DRY DOCK",value:c,color:"#c84"},{label:"MAINT/TICK",value:E(m),color:"#a44"}];e.innerHTML=d.map((p,h)=>`<div style="flex:1;padding:5px 8px;text-align:center;${h<d.length-1?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${p.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${p.color};margin-top:1px;">${p.value}</div>
    </div>`).join("");const u=M?.current_tick||0;let v="";for(const p of r){const h=Math.max(1,Number(p.build_ticks)||1),b=Number(p.delivery_tick)||0,$=Number(p.ordered_at_tick)||0,C=Math.max(0,b-u),T=Math.max(0,Math.min(h,u-$)),w=Math.max(0,Math.min(100,Math.round(T/h*100))),I=Re[p.vessel_class]||{color:"#9e9a92",label:(p.vessel_class||"?").toUpperCase()},L=C===0?"Delivering this tick":`Delivery in ${C} tick${C!==1?"s":""}`;v+=`<div style="border-bottom:1px solid var(--border-0);border-left:2px solid var(--amber);">
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
        </div>`}a.length===0&&r.length===0?i.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':a.length===0?i.innerHTML=v:i.innerHTML=v+a.map((p,h)=>{const b=nt===h,$=Re[p.vessel_class]||{color:"#666",label:"?"},C=Go[p.status]||{color:"#666",label:"?"},T=Ma(p.condition),w=Vo(p.fuel),I=p.condition<50||p.fuel<20,L=p.status==="in_transit",q=p.status==="dry_dock",j=M?.current_tick||0,O=Math.max(0,Math.floor((j-(p.built_at_tick||0))/12));let S=`<div onclick="flSelectVessel(${h})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${I?p.condition<50?T:w:"transparent"};background:${b?$.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;S+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(p.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${$.color};background:${$.color}12;border:1px solid ${$.color}25;">${$.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${C.color};background:${C.color}12;border:1px solid ${C.color}25;">${C.label}</span>
            </div>`;const R=p.current_port_nation_id?"In port":L?"At sea":"—";if(S+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${y(R)}</div>`,S+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${T};">${p.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${p.condition}%;height:100%;background:${T};"></div></div>
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
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${O}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${E(p.base_maintenance)}</div>
                </div>
            </div>`,q&&p.drydock_until_tick){const F=Math.max(0,p.drydock_until_tick-j);S+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${F} tick${F!==1?"s":""} remaining</span>
                </div>`}if(b){S+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const F=[{label:"VESSEL CLASS",value:p.vessel_class},{label:"BUILT",value:"Tick "+(p.built_at_tick||0)},{label:"FUEL CAPACITY",value:(p.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:p.last_refurbish_tick?"Tick "+p.last_refurbish_tick:"N/A"}];for(let U=0;U<F.length;U++)S+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${U<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${F[U].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${F[U].value}</span>
                    </div>`;S+="</div>";const H=L||q,k=Math.round((p.purchase_price||3e6)*.08*(1+(100-p.condition)/100)),N=Math.round((p.fuel_capacity||1e3)*50*(1-p.fuel/100)),B=Math.round((p.purchase_price||3e6)*(p.condition/100)*.6);if(S+=`<div style="display:flex;gap:4px;">
                    <div onclick="${H?"":"flRefurbish('"+p.id+"',"+k+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${H?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${H?"var(--text-dim)":"#5c5"};border:1px solid ${H?"var(--border-0)":"#2a5a3a"};background:${H?"transparent":"rgba(74,170,136,0.06)"};opacity:${H?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${E(k)}</span></div>
                    <div onclick="${L?"":"flRefuel('"+p.id+"',"+N+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${L?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${L?"var(--text-dim)":"#c86a4a"};border:1px solid ${L?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${L?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${E(N)}</span></div>
                    <div onclick="${H?"":"flSell('"+p.id+"','"+y(p.vessel_name).replace(/'/g,"")+"',"+B+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${H?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${H?"var(--text-dim)":"#c84"};border:1px solid ${H?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${H?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${E(B)}</span></div>
                </div>`,!L){const U=Je&&Je[p.id],X=gt&&gt[p.id];S+='<div style="display:flex;gap:4px;margin-top:4px;">',U?S+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${p.id}','${y(p.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:X?S+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':S+=`<div onclick="event.stopPropagation();flRequestInsurance('${p.id}','${y(p.vessel_name).replace(/'/g,"")}',${p.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,S+=`<div onclick="flRename('${p.id}','${y(p.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,S+="</div>"}L&&(S+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),q&&(S+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),S+="</div>"}return S+="</div></div>",S}).join("");const g={};for(const p of a)g[p.vessel_class]=(g[p.vessel_class]||0)+1;let x='<div style="display:flex;gap:6px;">';for(const[p,h]of Object.entries(Re))g[p]&&(x+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${h.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${h.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${g[p]}</span>
        </div>`);x+="</div>",x+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${E(m)}/tick</span>`,n.innerHTML=x}let te=!1;async function Yo(t,e){if(te||!f)return;const i=(ne||[]).find(v=>v.id===t);if(!i)return;const n=i.current_port_nation_id||null;let a="state",r=3,s=3,o=null,l="State Dry Dock (3x cost, 3 ticks)";if(n){const{data:v}=await _.from("corp_properties").select("id").eq("faction_id",f.id).eq("nation_id",n).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(v)a="own",r=1,s=2,l="Your Dry Dock (base cost, 2 ticks)";else{const{data:g}=await _.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",f.id).eq("nation_id",n).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();g&&(a="other",r=1.2,s=2,o=g.faction_id,l=(g.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else l="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const c=Math.round(e*r),{data:m}=await _.from("factions").select("corp_cash_reserves").eq("id",f.id).single(),d=Number(m?.corp_cash_reserves??0);if(d<c){alert("Insufficient cash. Need "+E(c)+", have "+E(d)+".");return}if(!confirm("Send "+(i.vessel_name||"vessel")+` to dry dock?

Dock: `+l+`
Cost: `+E(c)+`
Duration: `+s+` ticks
Condition restored to 85-100%.`))return;te=!0;const u=M?.current_tick||0;try{const{error:v}=await _.from("factions").update({corp_cash_reserves:d-c}).eq("id",f.id);if(v){alert("Failed: "+v.message);return}if(a==="other"&&o){const x=c-e,{data:p}=await _.from("factions").select("corp_cash_reserves").eq("id",o).single();p&&await _.from("factions").update({corp_cash_reserves:Number(p.corp_cash_reserves||0)+x}).eq("id",o)}const{error:g}=await _.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:u+s,active_claim_id:null}).eq("id",t);if(g){await _.from("factions").update({corp_cash_reserves:d}).eq("id",f.id),alert("Failed: "+g.message);return}f.corp_cash_reserves=d-c,await pe()}catch(v){alert("Dry dock failed: "+(v.message||"Error"))}finally{te=!1}}async function Qo(t,e){if(te||!f)return;if(e<=0){alert("Fuel tanks are already full.");return}const i=(ne||[]).find(d=>d.id===t);if(!i)return;const n=i.current_port_nation_id||f.nation_id;let a="state",r=3,s=null,o="State Fuel (3x cost) — no private depot in port";if(n){const{data:d}=await _.from("corp_properties").select("id").eq("faction_id",f.id).eq("nation_id",n).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(d)a="own",r=1,o="Your Fuel Depot (base cost)";else{const{data:u}=await _.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",f.id).eq("nation_id",n).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();u&&(a="other",r=1.15,s=u.faction_id,o=(u.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const l=Math.round(e*r),{data:c}=await _.from("factions").select("corp_cash_reserves").eq("id",f.id).single(),m=Number(c?.corp_cash_reserves??0);if(m<l){alert("Insufficient cash. Need "+E(l)+", have "+E(m)+".");return}if(confirm("Refuel "+(i.vessel_name||"vessel")+`?

Source: `+o+`
Cost: `+E(l)+`
Fuel restored to 100%.`)){te=!0;try{const{error:d}=await _.from("factions").update({corp_cash_reserves:m-l}).eq("id",f.id);if(d){alert("Failed: "+d.message);return}if(a==="other"&&s){const v=l-e,{data:g}=await _.from("factions").select("corp_cash_reserves").eq("id",s).single();g&&await _.from("factions").update({corp_cash_reserves:Number(g.corp_cash_reserves||0)+v}).eq("id",s)}const{error:u}=await _.from("corp_vessels").update({fuel:100}).eq("id",t);if(u){await _.from("factions").update({corp_cash_reserves:m}).eq("id",f.id),alert("Failed: "+u.message);return}f.corp_cash_reserves=m-l,await pe()}catch(d){alert("Refuel failed: "+(d.message||"Error"))}finally{te=!1}}}async function Ko(t,e,i){if(te||!f||!M||!confirm("List "+e+" on the Ship Market for "+E(i)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;te=!0;const n=M.current_tick||0,a=ne.find(l=>l.id===t);if(!a){te=!1;return}const r=Math.max(0,n-(a.built_at_tick||0)),{error:s}=await _.from("ship_market_listings").insert({nation_id:f.nation_id,vessel_name:a.vessel_name,vessel_class:a.vessel_class,capacity_dwt:a.capacity_dwt,capacity_unit:a.capacity_unit,condition:a.condition,fuel:a.fuel,age_ticks:r,fuel_capacity:a.fuel_capacity,base_maintenance:a.base_maintenance,asking_price:i,purchase_price_new:a.purchase_price||i,seller_type:"CORP",seller_name:f.faction_name,seller_faction_id:f.id,sale_reason:"Listed for sale by "+(f.faction_name||"corporation"),status:"available",listed_at_tick:n});if(s){alert("Failed to create listing: "+s.message),te=!1;return}const{error:o}=await _.from("corp_vessels").delete().eq("id",t);if(o){await _.from("ship_market_listings").delete().eq("seller_faction_id",f.id).eq("vessel_name",a.vessel_name).eq("listed_at_tick",n),alert("Failed to remove vessel: "+o.message),te=!1;return}te=!1,nt=null,await Promise.all([pe(),Pi()])}async function Jo(t,e){const i=prompt("Rename vessel:",e);if(!i||i.trim()===e||i.trim().length<2)return;const{error:n}=await _.from("corp_vessels").update({vessel_name:i.trim().slice(0,40)}).eq("id",t);if(n){alert("Failed: "+n.message);return}await pe()}async function Xo(t,e,i){if(!f||!M||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+E(i)))return;const n=M.current_tick||0,{error:a}=await _.from("finance_loan_requests").insert({requesting_faction_id:f.id,nation_id:f.nation_id,request_type:"insurance",insured_vessel_id:t,amount:i,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:n,expires_tick:n+12});if(a){a.message.includes("duplicate")||a.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+a.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await pe()}let ii=!1;async function Zo(t,e){if(ii||!f||!M)return;const i=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!i||i.trim().length<5)return;const n=M.current_tick||0,{data:a}=await _.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",t).eq("status","current").limit(1).maybeSingle();if(!a){alert("No active insurance policy found for this vessel.");return}const r=Number(a.principal||0),s=Number(a.deductible_pct||10),o=Math.round(r*s/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+E(r)+`
Deductible: `+s+"% ("+E(o)+`)

Reason: `+i.trim()+`

The insurer will review this claim and determine the payout.`))return;ii=!0;const{error:l}=await _.from("event_log").insert({nation_id:f.nation_id,faction_id:f.id,event_name:(f.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(f.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+i.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:t,vessel_name:e,policy_id:a.id,insurer_faction_id:a.lender_faction_id,coverage:r,deductible_pct:s,claim_reason:i.trim()},fired_at_tick:n});l&&console.warn("Failed to log insurance claim event:",l.message);const{error:c}=await _.from("finance_active_loans").update({claims_paid:(a.claims_paid||0)+1}).eq("id",a.id);c&&console.warn("Failed to update claims_paid:",c.message),ii=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+E(r)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=Xo;window.flFileClaim=Zo;const gi={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},es=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let Et=[];async function Na(){if(!f)return;const{data:t}=await _.from("corp_properties").select("*, nations!nation_id(name)").eq("faction_id",f.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});Et=t||[],ts()}function ts(){const t=document.getElementById("pf-count"),e=document.getElementById("pf-list"),i=document.getElementById("pf-footer");if(!t||!e||!i)return;const n=Et;if(t.textContent=n.length+" FACILIT"+(n.length===1?"Y":"IES"),n.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let s=0;e.innerHTML=n.map(o=>{const l=gi[o.type]||gi.fuel_depot,c=o.condition>=75?"#5c5":o.condition>=50?"#ca5":"#c84";return s+=Number(o.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
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
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${c};">${o.condition}%</span>
                        </div>
                        <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${o.condition}%;height:100%;background:${c};"></div></div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${E(o.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${E(o.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(f?.corp_cash_reserves??0);const a=n.some(s=>s.type==="fuel_depot"),r=n.some(s=>s.type==="dry_dock");i.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${a?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${r?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let ai=!1;async function is(t){if(ai||!f||!M)return;const e=es.filter(p=>p.type===t);if(e.length===0)return;const i=gi[t],n=f.nation_id,a=z?.name||f?.nation||"Home Nation",r=z?.capital||"Port City",s=[{id:n,name:a,capital:r,label:"National HQ"}],{data:o}=await _.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",f.id).eq("type","regional_hq").eq("is_active",!0);for(const p of o||[])p.nation_id!==n&&s.push({id:p.nation_id,name:p.nations?.name||p.city||"Unknown",capital:p.nations?.capital||p.city||"Port City",label:p.name||"Subsidiary"});let l=s[0];if(s.length>1){let p=i.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;p+=`Build in which nation?

`;for(let $=0;$<s.length;$++){const C=s[$],T=Et.filter(w=>w.type===t&&w.nation_id===C.id).length;p+=$+1+". "+C.name+"  ("+C.label+")",T>0&&(p+="  ["+T+" existing]"),p+=`
`}p+=`
Enter number (or cancel):`;const h=prompt(p);if(!h)return;const b=parseInt(h,10)-1;if(isNaN(b)||b<0||b>=s.length){alert("Invalid selection.");return}l=s[b]}const c=Et.filter(p=>p.type===t&&p.nation_id===l.id).length;let m=i.label+" CONSTRUCTION — "+l.name.toUpperCase()+`
`+"─".repeat(30)+`
`;c>0&&(m+="You already have "+c+" "+i.label.toLowerCase()+(c>1?"s":"")+` here.

`),m+=i.desc+`

`;for(let p=0;p<e.length;p++){const h=e[p];m+=p+1+". "+h.name+`
`,m+="   Cost: "+E(h.cost)+" · Maint: "+E(h.maint)+`/tick
`,m+="   "+h.desc+`

`}m+="Enter 1 or 2 to select (or cancel):";const d=prompt(m);if(!d)return;const u=parseInt(d,10)-1;if(isNaN(u)||u<0||u>=e.length){alert("Invalid selection.");return}const v=e[u];if(!confirm("Commission "+v.name+" in "+l.capital+", "+l.name+`?

Budget: `+E(v.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;ai=!0;const g=M.current_tick||0,x=(M.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:p}=await _.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",l.id).eq("issuer_type","PRIVATE"),b=`PVT-P${(p||0)+1}-${x}`,$=v.style==="Modern",C={concrete:$?60:40,steel:$?50:30,heavy_parts:$?30:20,aggregate:$?30:20},T={trucks:5,mixers:5,excavators:5},w={general:$?240:160,skilled:$?100:60},I=$?6:4,{error:L}=await _.from("construction_contracts").insert({nation_id:l.id,template_key:t,sector:"industrial",name:v.name,project_type:i.label,project_subtype:v.style,description:`${v.name} at ${l.capital} Port — commissioned by ${f.faction_name}. ${v.desc}`,project_code:b,budget_ceiling:v.cost,timeline_ticks:I,required_materials:C,required_equipment:T,required_workforce:w,status:"open",generated_at_tick:g,bidding_ends_tick:g+3,issuer_type:"PRIVATE",issuer_name:f.faction_name,issuer_faction_id:f.id});if(L)throw L;await Na(),alert(`Construction contract posted!

Project: `+v.name+`
Location: `+l.capital+", "+l.name+`
Code: `+b+`
Budget: `+E(v.cost)+`
Timeline: `+I+` ticks

Construction corporations in `+l.name+" can now bid on this project.")}catch(p){alert("Failed to post contract: "+(p.message||"Error"))}finally{ai=!1}}window.pfOpenBuild=is;const zi={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function Pi(){if(!f)return;const{data:t,error:e}=await _.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),hi=t||[],_t=null,La()}function as(t){_t=_t===t?null:t,La()}function ns(t){return(zi[f?.corp_subsector]||[]).includes(t)}function La(){const t=document.getElementById("sm-count"),e=document.getElementById("sm-list"),i=document.getElementById("sm-footer");if(!t||!e)return;const n=hi;t.textContent=n.length+" AVAILABLE",n.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=n.map((s,o)=>{const l=_t===o,c=Re[s.vessel_class]||{color:"#666",label:"?"},m=s.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",d=Ma(s.condition),u=s.nation?.name||"—",v=ns(s.vessel_class);M?.current_tick;const g=s.age_ticks||0,x=Math.max(1,Math.floor(g/12)),p=u!==f?.nation?Number(f?.tariffs||z?.tariffs||0):0,h=Math.round(s.asking_price*p/100),b=s.asking_price+h;let $=`<div onclick="smSelectListing(${o})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${l?c.color:"transparent"};background:${l?c.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return $+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(s.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${c.color};background:${c.color}12;border:1px solid ${c.color}25;">${c.label}</span>
            </div>`,$+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${m};background:${m}12;border:1px solid ${m}25;">${s.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(s.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${u.toUpperCase().slice(0,6)}</span>
                ${p>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${p}%</span>`:""}
            </div>`,$+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(s.capacity_dwt||0).toLocaleString()} ${s.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.6;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">COND</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${d};margin-top:1px;">${s.condition}%</div>
                </div>
                <div style="flex:0.5;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${x}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${E(s.asking_price)}</div>
                </div>
            </div>`,l&&($+='<div style="margin-top:6px;">',$+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${c.color};">${(Re[s.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${y(s.sale_reason||"—")}</div>
                    </div>
                </div>`,$+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${s.condition}%;height:100%;background:${d};"></div></div>
                    ${s.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,p>0&&($+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${p}%)</span>
                        <span style="color:#c84;">+${E(h)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${E(b)}</span>
                    </div>`),v?$+=`<div onclick="event.stopPropagation();smPurchase('${s.id}',${b})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${c.color};cursor:pointer;">${E(b)} — PURCHASE</div>`:$+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${s.vessel_class} not available for ${f?.corp_subsector||"your subsector"}</div>`,$+="</div>"),$+="</div></div>",$}).join("");const a=n.filter(s=>s.seller_type==="CORP").length,r=n.filter(s=>s.seller_type==="LOCAL").length;i.innerHTML=`<div style="display:flex;gap:6px;">
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#5a8aaa;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CORP</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${a}</span>
        </div>
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#8b9a6b;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">LOCAL</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${r}</span>
        </div>
    </div>
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let Fe=!1;async function os(t,e){if(Fe||!f||!M)return;const i=Number(f.corp_cash_reserves??0);if(i<e){alert("Insufficient cash. Need "+E(e)+".");return}if(!confirm("Purchase this vessel for "+E(e)+"?"))return;Fe=!0;const n=hi.find(m=>m.id===t);if(!n){Fe=!1;return}const a=M.current_tick||0,r=vt[n.vessel_class]||vt.Coastal,{error:s}=await _.from("factions").update({corp_cash_reserves:i-e}).eq("id",f.id);if(s){alert("Failed: "+s.message),Fe=!1;return}const{error:o}=await _.from("corp_vessels").insert({faction_id:f.id,nation_id:f.nation_id,vessel_name:n.vessel_name,vessel_class:n.vessel_class,condition:n.condition,fuel:n.fuel||50,status:"in_port",capacity_dwt:n.capacity_dwt||r.capacity_dwt,capacity_unit:n.capacity_unit||r.capacity_unit,base_maintenance:n.base_maintenance||r.base_maintenance,fuel_capacity:n.fuel_capacity||r.fuel_capacity,purchase_price:e,built_at_tick:a-(n.age_ticks||0),current_port_nation_id:f.nation_id});if(o){await _.from("factions").update({corp_cash_reserves:i}).eq("id",f.id),alert("Failed to create vessel: "+o.message),Fe=!1;return}var{error:l}=await _.from("ship_market_listings").update({status:"sold",purchased_by:f.id,purchased_at_tick:a}).eq("id",t);if(l&&console.warn("Failed to mark listing as sold:",l.message),n.seller_faction_id){const{data:m}=await _.from("factions").select("corp_cash_reserves").eq("id",n.seller_faction_id).single();if(m){var{error:c}=await _.from("factions").update({corp_cash_reserves:Number(m.corp_cash_reserves||0)+n.asking_price}).eq("id",n.seller_faction_id);c&&console.warn("Failed to credit seller:",c.message)}}f.corp_cash_reserves=i-e,Fe=!1,await Promise.all([pe(),Pi()])}const tt=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let oe="Coastal",rt=0,lt="",ze=[];function ss(){oe=(zi[f?.corp_subsector]||["Coastal"])[0],rt=0,lt="",ze=[],document.getElementById("comm-overlay").style.display="flex",rs()}async function rs(){const{data:t}=await _.from("nations").select("id, name, industry, infrastructure").order("name");ze=(t||[]).map(e=>{const i=Number(e.industry??50),n=Math.round((.75+i/100*.5)*100)/100,a=Math.round((1.5-i/100*.65)*100)/100,r=e.id===f?.nation_id;return{id:e.id,name:e.name,mfg:i,costMod:n,buildMod:a,isHome:r,tariffs:0}}),ze.sort((e,i)=>(i.isHome?1:0)-(e.isHome?1:0)),Oi()}function Ra(){document.getElementById("comm-overlay").style.display="none"}function ls(t){oe=t,Oi()}function cs(t){rt=t,Oi()}function ds(t){lt=t}function Oi(){const t=document.getElementById("comm-content");if(!t)return;const e=M?.current_tick||0,i=tt.find(g=>g.cls===oe)||tt[0],n=ze[rt]||{name:"—",costMod:1,buildMod:1},a=Re[oe]||{color:"#666"},r=Math.round(i.baseCost*n.costMod),s=Math.max(2,Math.round(i.baseBuild*n.buildMod)),o=Math.round(r*.5),l=r-o,c=e+s,m=zi[f?.corp_subsector]||[];let d="";d+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,d+='<div style="flex:1;overflow-y:auto;">',d+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const g of tt){const x=Re[g.cls]||{color:"#666",label:"?"},p=oe===g.cls,h=m.includes(g.cls);d+=`<div onclick="${h?"commSetClass('"+g.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${h?"pointer":"not-allowed"};background:${p?x.color+"18":"transparent"};border:1px solid ${p?x.color+"44":"var(--panel-border)"};opacity:${h?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${p?x.color:"#6a6660"};">${x.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${E(g.baseCost)} base</div>
        </div>`}d+="</div>",d+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${a.color};">${i.cargo}</div>`,d+="</div>",d+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let g=0;g<ze.length;g++){const x=ze[g],p=rt===g,h=x.costMod>1?"#c84":x.costMod<1?"#5c5":"#6a6660",b=x.buildMod>1?"#c84":x.buildMod<1?"#5c5":"#6a6660";d+=`<div onclick="commSetNation(${g})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${p?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${p?"#8b9a6b44":"var(--panel-border)"};border-left:2px solid ${p?"#8b9a6b":"transparent"};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;font-weight:600;color:${p?"var(--panel-text)":"#9e9a92"};">${y(x.name)}</span>
                    ${x.isHome?'<span style="font-family:var(--font-mono);font-size:6px;padding:0 3px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2);line-height:11px;">HOME</span>':""}
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${x.isHome?"Home port — no tariff":"Foreign shipyard"}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">MFG</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#9e9a92;">${x.mfg}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">COST</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h};">×${x.costMod.toFixed(2)}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">SPEED</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${b};">×${x.buildMod.toFixed(2)}</div></div>
            </div>
        </div>`}d+="</div>",d+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Vessel Name</div>
        <input id="comm-name-input" value="${y(lt)}" oninput="commSetName(this.value)" placeholder="e.g., MV 'Sierra Nevada'" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:11px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
    </div>`,d+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Build Summary</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">`;const u=[{label:"VESSEL CLASS",value:oe,color:a.color},{label:"SHIPYARD",value:n.name,color:"#9e9a92"},{label:"BASE COST",value:E(i.baseCost)+" × "+n.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:s+" ticks",color:s>i.baseBuild?"#c84":s<i.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+c,color:"#9e9a92"}];for(const g of u)d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${g.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g.color};">${g.value}</span>
        </div>`;d+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${E(r)}</span>
    </div>`,d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${E(o)}</span>
    </div>`,d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${E(l)}</span>
    </div>`,d+="</div></div>",d+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${c}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
        </div>
    </div>`,d+="</div>";const v=lt.trim().length>=2;d+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEPOSIT DUE NOW</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${E(o)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${v?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${v?"#000":"#6a6660"};background:${v?"#c8a832":"transparent"};border:1px solid ${v?"#c8a832":"var(--panel-border)"};cursor:${v?"pointer":"default"};opacity:${v?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,t.innerHTML=d}let Qe=!1;async function ps(){if(Qe||!f||!M)return;const t=lt.trim();if(t.length<2)return;const e=tt.find(x=>x.cls===oe)||tt[0],i=ze[rt];if(!i)return;const n=Math.round(e.baseCost*i.costMod),a=Math.max(2,Math.round(e.baseBuild*i.buildMod)),r=Math.round(n*.5),s=n-r,o=M.current_tick||0,l=Number(f.corp_cash_reserves??0);if(l<r){alert("Insufficient cash for deposit. Need "+E(r)+".");return}if(!confirm("Commission "+oe+" from "+i.name+`?

Deposit: `+E(r)+` (non-refundable)
Balance: `+E(s)+" on delivery at tick "+(o+a)))return;Qe=!0;const c=document.getElementById("comm-order-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const{error:m}=await _.from("factions").update({corp_cash_reserves:l-r}).eq("id",f.id);if(m){alert("Failed: "+m.message),Qe=!1;return}const{data:d}=await _.from("nations").select("budget_reserves").eq("id",i.id).single();if(d){var{error:u}=await _.from("nations").update({budget_reserves:Number(d.budget_reserves||0)+r}).eq("id",i.id);u&&console.warn("Failed to credit shipyard nation budget:",u.message)}const v=vt[oe]||vt.Coastal,{error:g}=await _.from("vessel_orders").insert({faction_id:f.id,vessel_name:t,vessel_class:oe,capacity_dwt:v.capacity_dwt,capacity_unit:v.capacity_unit,base_maintenance:v.base_maintenance,fuel_capacity:v.fuel_capacity,purchase_price:e.baseCost,shipyard_nation_id:i.id,shipyard_nation:i.name,cost_modifier:i.costMod,build_modifier:i.buildMod,total_cost:n,deposit_paid:r,balance_due:s,ordered_at_tick:o,delivery_tick:o+a,build_ticks:a,status:"building"});if(g){await _.from("factions").update({corp_cash_reserves:l}).eq("id",f.id),alert("Failed to place order: "+g.message),Qe=!1;return}f.corp_cash_reserves=l-r,Qe=!1,Ra(),alert(t+` commissioned!

Class: `+oe+`
Shipyard: `+i.name+`
Deposit: `+E(r)+`
Delivery: Tick `+(o+a))}window.smSelectListing=as;window.smPurchase=os;window.smOpenCommission=ss;window.smCloseCommission=Ra;window.commSetClass=ls;window.commSetNation=cs;window.commSetName=ds;window.smPlaceOrder=ps;window.flSelectVessel=Wo;window.flRefurbish=Yo;window.flRefuel=Qo;window.flSell=Ko;window.flRename=Jo;window.openBidReview=jo;window.closeBidReview=Rt;window.reviewSelectBid=Fo;window.acceptBid=Ho;window.declineAllBids=Uo;Mo();
