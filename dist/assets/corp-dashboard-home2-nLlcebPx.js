import{_supabase as _}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{i as ze}from"./factions-1eoRseVF.js";import{e as u,t as ve}from"./utils-oN1e812_.js";import{initMessaging as Oe}from"./messaging-BK1yGt10.js";import{b as De}from"./corp-valuation-DGlSNvB8.js";import{m as $e,l as Ae}from"./loan-math-10uuKJZJ.js";import"./government-structure-DBjJ7E-l.js";import"./government-types-BeJIFjWQ.js";const He=[{key:"trucks",name:"Work Trucks",tier:1,basePrice:28e4,maintenancePerUnit:1500,conditionDecayRate:2,startingOwned:4},{key:"excavators",name:"Excavators",tier:1,basePrice:15e5,maintenancePerUnit:5500,conditionDecayRate:2,startingOwned:2},{key:"bulldozers",name:"Bulldozers",tier:1,basePrice:12e5,maintenancePerUnit:7e3,conditionDecayRate:2,startingOwned:1},{key:"mixers",name:"Concrete Mixers",tier:1,basePrice:8e5,maintenancePerUnit:4500,conditionDecayRate:2,startingOwned:2},{key:"cranes",name:"Tower Cranes",tier:2,basePrice:72e5,maintenancePerUnit:32500,conditionDecayRate:2,startingOwned:0},{key:"haulers",name:"Heavy Haulers",tier:2,basePrice:35e5,maintenancePerUnit:15e3,conditionDecayRate:2,startingOwned:0},{key:"piledrivers",name:"Pile Drivers",tier:2,basePrice:48e5,maintenancePerUnit:18e3,conditionDecayRate:2,startingOwned:0},{key:"asphalt",name:"Asphalt Plants",tier:2,basePrice:55e5,maintenancePerUnit:22e3,conditionDecayRate:2,startingOwned:0},{key:"industrial",name:"Industrial Cranes",tier:3,basePrice:18e6,maintenancePerUnit:85e3,conditionDecayRate:2,startingOwned:0},{key:"tbm",name:"Tunnel Boring Machines",tier:3,basePrice:45e6,maintenancePerUnit:2e5,conditionDecayRate:2,startingOwned:0},{key:"dredge",name:"Dredging Equipment",tier:3,basePrice:22e6,maintenancePerUnit:95e3,conditionDecayRate:2,startingOwned:0}];function Ue(e){return He.find(n=>n.key===e)}function Fe(e){let n=0;for(const t of e||[]){const a=Ue(t.equipment_key);a&&t.owned>0&&(n+=a.maintenancePerUnit*t.owned)}return n}function ke(e,n){var t=Number(e?.purchase_price)||0,a=Number(e?.refurbish_count)||0,i=t*.1*(Number(n)||1);return Math.round(i*Math.pow(1.25,a))}async function je(e,n,t,a,i){if(!n||!t?.id)return{ok:!1,error:"Missing faction or property."};if(Number(t.condition)>=95)return{ok:!1,error:"Property already at excellent condition."};var l=ke(t,i),{data:m,error:d}=await e.from("factions").select("corp_cash_reserves").eq("id",n).single();if(d)return{ok:!1,error:"Failed to read cash: "+d.message};var o=Number(m?.corp_cash_reserves??0);if(o<l)return{ok:!1,error:"Insufficient cash.",cost:l};var r=4+Math.floor(Math.random()*6),v=95+Math.floor(Math.random()*4),b=Number(a||0)+r,w=Math.max(0,o-l),{error:C}=await e.from("factions").update({corp_cash_reserves:w}).eq("id",n);if(C)return{ok:!1,error:"Cash deduct failed: "+C.message};var{data:T,error:B}=await e.from("corp_properties").update({refurbish_until_tick:b,refurbish_condition:v}).eq("id",t.id).is("refurbish_until_tick",null).select("id");return B||!T||T.length===0?(await e.from("factions").update({corp_cash_reserves:o}).eq("id",n),{ok:!1,error:B?.message||"Refurbishment already in progress on this property."}):{ok:!0,cost:l,duration:r,targetCondition:v,newCash:w}}let de=[],f=null,Y=null;function y(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+Math.round(e).toLocaleString()}function ae(e){const n=Number(e)||0,t=Math.abs(n);return t>=1e9?{main:"$"+(n/1e9).toFixed(2),unit:"B"}:t>=1e6?{main:"$"+(n/1e6).toFixed(2),unit:"M"}:t>=1e3?{main:"$"+(n/1e3).toFixed(1),unit:"k"}:{main:"$"+Math.round(n).toLocaleString(),unit:""}}function We(e){const n=Math.max(0,Math.min(100,Number(e)||0));return n>=90?{tag:"Aaa",tone:"good"}:n>=80?{tag:"Aa1",tone:"good"}:n>=70?{tag:"A1",tone:"good"}:n>=60?{tag:"Baa1",tone:"gold"}:n>=50?{tag:"Baa3",tone:"gold"}:n>=40?{tag:"Ba1",tone:"gold"}:n>=30?{tag:"Ba3",tone:"red"}:n>=20?{tag:"B2",tone:"red"}:n>=10?{tag:"Caa1",tone:"red"}:{tag:"Ca",tone:"red"}}function se(e,n){return Number(e?.[n]??50)}async function Ve(){const{data:{user:e}}=await _.auth.getUser();if(!e){window.location.href="login.html";return}const{data:n}=await _.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);de=(n||[]).filter(E=>!ze(E));const t=sessionStorage.getItem("active_faction_id");if(f=de.find(E=>E.id===t)||de.find(E=>E.faction_type==="corporation")||de[0],!f){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",f.id),f.faction_type!=="corporation"){window.location.href="dashboard.html";return}let a=f.nation||"",i=null;const[l,m]=await Promise.all([f.nation_id?_.from("nations").select("*").eq("id",f.nation_id).single():Promise.resolve({data:null}),_.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);l.error&&console.warn("Nation load failed:",l.error.message),l.data&&(a=l.data.name,i=l.data),m.error&&console.warn("Shard load failed:",m.error.message),Y=m.data,Oe(f,i,Y);let d=0;if(f?.id){const{data:E}=await _.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",f.id).in("status",["open","bidding"]);if(E)for(const k of E)d+=(k.contract_bids||[]).length}(function(){const k=(f.corp_ticker||f.abbreviation||"").toUpperCase(),p=Y?.current_date||"",A=p?p.replace(/.*,\s*/,""):"",D=Y?.current_tick,P=document.getElementById("h2-plate-logo");P&&(f.custom_logo_url?P.innerHTML=`<img src="${u(f.custom_logo_url)}" alt="logo">`:P.textContent=k.slice(0,3)||"—");const x=document.getElementById("h2-eyebrow-loc");x&&(x.textContent=a?`The Boardroom · ${a}`:"The Boardroom");const W=document.getElementById("h2-tick-date");if(W){const g=[];D!=null&&g.push("Tick "+D),p&&g.push(p),W.textContent=g.length?g.join(" · "):"Tick — · —"}const V=document.getElementById("h2-next-close");V&&(V.textContent="Next close —");const G=document.getElementById("h2-ceo");if(G){const g=[f.leader_first_name,f.leader_last_name].filter(Boolean);if(g.length){const h=f.leader_age?" ("+f.leader_age+")":"",$=f.leader_role||"Chairman & Chief Executive";G.textContent=`${g.join(" ")} · ${$}${h}`}else G.textContent="—"}const te=document.getElementById("h2-brand");if(te){const g=f.faction_name||"Unnamed Corporation",h=g.split(" ");if(h.length>1){const $=h.slice(0,-1).join(" "),M=h[h.length-1];te.innerHTML=`${u($)} <em>${u(M)}</em>`}else te.textContent=g}const Z=document.getElementById("h2-brand-sub");if(Z){const g=[];f.corp_company_type&&g.push(f.corp_company_type),A&&g.push("Est. "+A);const h=f.corp_subsector||f.corp_sector;h&&g.push(h),Z.textContent=g.length?g.join(" · "):"—"}const ne=document.getElementById("h2-tail-code");if(ne){const g=(a||"").split(" ").map(M=>M[0]||"").join("").toUpperCase().slice(0,4),h=f.party_description?'"'+f.party_description+'"':"",$=[];k&&$.push(k),g&&$.push(g+" EXCH"),h&&$.push(h),ne.textContent=$.length?$.join(" · "):"—"}const I=document.getElementById("h2-wire-corp");if(I){const g=(f.faction_name||"your corp").split(" ").slice(0,2).join(" ");I.textContent=g}const c=document.getElementById("h2-edit-toggle");c&&c.addEventListener("click",()=>{const g=document.body.classList.toggle("h2-edit-open");c.classList.toggle("on",g),c.textContent=g?"Close ✕":"Logo"})})(),(function(){const k=document.getElementById("h2-logout-btn");if(k&&k.addEventListener("click",async()=>{try{sessionStorage.clear(),await _.auth.signOut()}catch{}window.location.href="login.html"}),d>0){const p=document.getElementById("h2-nav-actions-badge");p&&(p.textContent=d,p.style.display="",p.classList.add("ok"))}})(),document.getElementById("id-type-badge").textContent=f.corp_company_type||"—";const o=document.getElementById("id-logo"),r=(f.corp_ticker||f.abbreviation||"").toUpperCase();f.custom_logo_url?o.innerHTML=`<img src="${u(f.custom_logo_url)}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`:o.textContent=r.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=f.faction_name||"Unnamed Corp";const v=f.party_description||"";document.getElementById("id-slogan").textContent=v?'"'+v+'"':'"--"';const b=Y?.current_date?Y.current_date.replace(/.*,\s*/,""):"—",w=f.leader_first_name&&f.leader_last_name?f.leader_first_name+" "+f.leader_last_name+(f.leader_age?" ("+f.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${u(b)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${u(a||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${u(f.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${u(f.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${u(w)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${u(f.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${u(r)}</span>
        </div>
    `;const C=f.last_rename_tick||0,T=Y?.current_tick||0,O=Math.max(0,C+120-T),S=!v||v==="-"||v==='"-"'||O<=0,L=document.getElementById("slogan-editor");L.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${u(v)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${S?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${S?"60 characters max. 120 tick cooldown after change.":O+" ticks until you can change slogan."}</div>
    `;const z=document.getElementById("corp-logo-upload");z.innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Logo</span>
            <label class="id-row__value" style="cursor:pointer;text-decoration:underline;" id="corp-logo-label">
                ${f.custom_logo_url?"Change Logo":"Upload Logo"}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" id="corp-logo-file" style="display:none;">
            </label>
        </div>
    `,document.getElementById("corp-logo-file")?.addEventListener("change",it),window._corpFactionId=f.id,window._currentTick=T,window._nationStats=i,window._factionData=f,Ge(i,a,f),Xe(a,f);const q=await he(i,a,f,Y);let N=0;if(f?.id){const{data:E,error:k}=await _.from("corp_equipment").select("equipment_key, owned").eq("faction_id",f.id);k||(N=Fe(E||[]))}let H=0;if(f?.id){const{data:E}=await _.from("corp_executives").select("salary_per_year").eq("faction_id",f.id).eq("status","active");H=(E||[]).reduce((k,p)=>k+(Number(p.salary_per_year)||0),0)}let F=0,U=0;if(f?.id&&f.corp_sector==="Shipping"){const{data:E}=await _.from("corp_vessels").select("base_maintenance, purchase_price, condition, built_at_tick, status").eq("faction_id",f.id).neq("status","for_sale");F=(E||[]).reduce((k,p)=>k+(Number(p.base_maintenance)||0),0),U=De(E,T)}await Ke(i,Y,f,q.propertyMaintenance||0,N,H,q,F),await Je(i,a,f,q,U),J={nationId:f.nation_id},Re(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function Ge(e,n,t){const a=(n||"UNKNOWN").toUpperCase(),i=Number(t?.corp_general_workforce??0),l=Number(t?.corp_skilled_workforce??0),m=Number(t?.corp_innovative_workforce??0),d=i+l+m;document.getElementById("wf-total-header").textContent=d.toLocaleString();const o=(r,v,b)=>`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">${r}</span>
                    <span class="wf-tier__nation">${u(a)}</span>
                </div>
                <span class="wf-tier__count" style="color:${b};">${v.toLocaleString()}</span>
            </div>
        </div>
    `;document.getElementById("wf-body").innerHTML=`
        ${o("General Workforce",i,"var(--text-primary)")}
        ${o("Skilled Workforce",l,"var(--blue)")}
        ${o("Innovative Workforce",m,"var(--amber)")}
        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${d.toLocaleString()}</span>
            </div>
        </div>
    `}async function Ke(e,n,t,a,i,l,m,d){const o=n?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+o;let r=0,v=0;if(t?.id){const c=t.corp_sector||"";if(c==="Finance"){const{data:g,error:h}=await _.from("finance_active_loans").select("monthly_payment, interest_rate, principal, original_principal, finance_loan_requests(request_type)").eq("lender_faction_id",t.id).in("status",["current","late","delinquent"]);h&&console.warn("[Finances] finance_active_loans query failed:",h.message);for(const $ of g||[]){const M=$.finance_loan_requests?.request_type||"loan";M==="insurance"?v+=Number($.monthly_payment||0):M==="loan"?v+=$e(Ae($),$.interest_rate):M==="bond"&&(v+=Number($.monthly_payment||0))}}else if(c!=="Construction"){if(c==="Shipping"){const{data:g}=await _.from("shipping_claims").select("revenue_per_transit").eq("faction_id",t.id).eq("status","active");for(const h of g||[])v+=Number(h.revenue_per_transit||0)}}}let b=[],w=0;try{const{data:c}=await _.from("corp_properties").select("id, nation_id, nations!nation_id(name)").eq("faction_id",t.id).eq("type","fuel_depot").eq("is_active",!0);if(c&&c.length>0){const g=c.map(h=>h.nation_id).filter(Boolean);if(g.length>0){const{data:h}=await _.from("shipping_claims").select("faction_id, shipping_routes!inner(destination_nation_id, status)").eq("status","active").in("shipping_routes.destination_nation_id",g),$=[...new Set((h||[]).map(R=>R.faction_id).filter(R=>R&&R!==t.id))],M=new Set;if($.length>0){const{data:R}=await _.from("corp_properties").select("faction_id, nation_id").in("faction_id",$).in("nation_id",g).eq("type","fuel_depot").eq("is_active",!0);for(const K of R||[])M.add(K.faction_id+"|"+K.nation_id)}const Q={};for(const R of h||[]){const K=R.shipping_routes?.destination_nation_id;K&&R.faction_id!==t.id&&(M.has(R.faction_id+"|"+K)||(Q[K]=(Q[K]||0)+1))}const ee=7500;for(const R of c){const K=Q[R.nation_id]||0,le=K*ee;b.push({nation:R.nations?.name||"Unknown",revenue:le,visitors:K}),w+=le}b.sort((R,K)=>K.revenue-R.revenue)}}}catch(c){console.warn("Fuel depot revenue estimate failed (non-fatal):",c?.message||c)}const C=r+v+w,T=0,B=a||0,O=i||0,j=Number(t?.corp_debt)||0;let S=0,L=0;if(t?.id)try{const{data:c}=await _.from("finance_active_loans").select("monthly_payment, finance_loan_requests(request_type)").eq("borrower_faction_id",t.id).in("status",["current","late","delinquent"]);for(const g of c||[]){const h=g.finance_loan_requests?.request_type||"loan",$=Number(g.monthly_payment||0);if(!($<=0))if(h==="insurance")L+=$;else{if(h==="bond")continue;S+=$}}}catch(c){console.warn("[Finances] borrower finance_active_loans lookup failed:",c)}const z=Math.round((l||0)/12),q=d||0,N=Math.max(0,Math.min(1,Number(e?.corporate_tax??0)/100||0)),H=z+T+B+O+q+S+L,F=Math.max(0,C-H),U=Math.round(F*N);let E="";try{const c=new Set([t.nation_id]),{data:g}=await _.from("corp_properties").select("nation_id").eq("faction_id",t.id).eq("is_active",!0);if((g||[]).forEach(h=>{h.nation_id&&c.add(h.nation_id)}),c.size>0){const{data:h}=await _.from("nations").select("id, name, corporate_tax").in("id",[...c]);h&&h.length>0&&(E=h.sort(($,M)=>($.name||"").localeCompare(M.name||"")).map($=>{const M=Math.round(Number($.corporate_tax??0)),Q=Math.round(F*(M/100)/h.length),ee=M>25?"#c55":M>15?"#ca5":"#5c5";return`<div style="display:flex;justify-content:space-between;padding:1px 0;font-family:var(--font-mono);font-size:8px;">
                        <span style="color:var(--text-dim);">${$.name} (<span style="color:${ee}">${M}%</span>)</span>
                        <span style="color:#a44;">${y(Q)}</span>
                    </div>`}).join(""))}}catch{}const k=H+U;let p=0;if(t?.id&&o>0)try{const{data:c,error:g}=await _.from("corp_cash_events").select("delta").eq("corp_id",t.id).eq("tick",o-1);g&&console.warn("[home2] corp_cash_events lookup failed:",g.message),p=(c||[]).reduce((h,$)=>h+(Number($.delta)||0),0)}catch(c){console.warn("[home2] netProfit lookup threw:",c?.message||c)}const A=Number(t?.corp_cash_reserves??0),D=j;let P=null,x=null,W=null,V="Does not include all capital/financing cash transfers.";if(t?.id)try{const{data:c}=await _.from("corp_cash_history").select("tick, cash_start, cash_end, cash_delta, non_pnl_cash_movements").eq("faction_id",t.id).lte("tick",o).order("tick",{ascending:!1}).limit(2),g=(c||[]).find($=>Number($.tick)===Number(o))||(c||[])[0]||null,h=(c||[]).find($=>Number($.tick)<Number(g?.tick??o))||null;g?(P=g.cash_start!=null?Number(g.cash_start):h?.cash_end!=null?Number(h.cash_end):null,x=g.cash_delta!=null?Number(g.cash_delta):P!=null?A-P:null,W=g.non_pnl_cash_movements!=null?Number(g.non_pnl_cash_movements):x!=null?x-p:null):V="Does not include all capital/financing cash transfers. Cash history snapshot not yet available."}catch(c){console.warn("[Finances] corp_cash_history lookup failed:",c),V="Does not include all capital/financing cash transfers. Cash history snapshot unavailable."}Ze(C,p);const G=[{stat:"gdp_growth",value:s("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:s("urbanization"),weight:"0.3"},{stat:"population_growth",value:s("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:s("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:s("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:s("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:s("interest_rates"),weight:"-0.1",neg:!0}];function te(c){return c.neg?c.value>50?"var(--red)":"var(--green)":c.note?c.value<50?"var(--green)":"var(--red)":c.value>=50?"var(--green)":c.value>=35?"var(--amber)":"var(--red)"}const Z=C||1,ne=(r/Z*100).toFixed(1),I=((v+w)/Z*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${ne}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${I}%;background:var(--amber);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${y(r)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${y(v)}</span></div>
            ${b.map(c=>`<div class="fin-row"><span class="fin-row__label">Fuel Depot (${c.nation})<span class="fin-row__badge">${c.visitors} visitor${c.visitors!==1?"s":""}</span></span><span class="fin-row__value" style="color:var(--green)">${y(c.revenue)}</span></div>`).join("")}
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${y(C)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Executive Compensation</span><span class="fin-row__value" style="color:#a44">${y(z)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${y(T)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${y(B)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${y(O)}</span></div>
            ${q>0?`<div class="fin-row"><span class="fin-row__label">Fleet Maintenance</span><span class="fin-row__value" style="color:#a44">${y(q)}</span></div>`:""}
            ${S>0?`<div class="fin-row"><span class="fin-row__label">Loan Repayments</span><span class="fin-row__value" style="color:#a44">${y(S)}</span></div>`:""}
            ${L>0?`<div class="fin-row"><span class="fin-row__label">Insurance Premiums</span><span class="fin-row__value" style="color:#a44">${y(L)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${y(U)}</span></div>
            ${E?`<div style="padding:2px 12px 6px 20px;border-bottom:1px solid var(--border-hair);">${E}</div>`:""}
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${y(k)}</span>
            </div>
        </div>
        <!-- Last Tick Cash Change — primary bottom-line signal. Uses cashDelta
             (cash_end - cash_start from corp_cash_history) so the top-line
             figure captures operating P&L plus non-P&L cash movements. -->
        <div class="fin-net" style="background:${x==null?"transparent":x>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"};">
            <span class="fin-net__label">Last Tick Cash Change</span>
            <span class="fin-net__value" style="color:${x==null?"var(--text-dim)":x>=0?"var(--green)":"var(--red)"};">${x==null?"—":y(x)}</span>
        </div>
        <div style="padding:2px 14px 8px 14px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.2px;">${V}</div>
        <!-- Cash Reconciliation -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--text-bright);">Cash Change This Tick</div>
            <div class="fin-row"><span class="fin-row__label">Last Tick Net Profit</span><span class="fin-row__value" style="color:${p>=0?"var(--green)":"var(--red)"}">${y(p)}</span></div>
            <div class="fin-row"><span class="fin-row__label">+/- Non-P&amp;L cash movements</span><span class="fin-row__value" style="color:var(--text-bright)">${W==null?"—":y(W)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">= Actual Cash Change</span>
                <span class="fin-total__value" style="color:${(x||0)>=0?"var(--green)":"var(--red)"}">${x==null?"—":y(x)}</span>
            </div>
            <div style="padding:2px 12px 4px 12px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.2px;">Computed from cash snapshots: current cash (${y(A)}) ${P==null?"with no prior snapshot":"- previous tick cash ("+y(P)+")"}.</div>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${y(A)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${y(D)}</div>
            </div>
        </div>
        <!-- Purchasing Power widget removed: built on currency_strength + inflation, both drop in Phase 9. -->

        <!-- Loans Section -->
        <div style="padding:8px 14px;border-top:1px solid var(--border-0);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;">Loans</span>
                <a href="corp-operations.html?tab=actions" style="padding:3px 10px;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);text-decoration:none;">CFO &rarr; ACTIONS</a>
            </div>
            <div id="fin-loans-list" style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">No active loans.</div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${G.map(c=>`
                <div class="drv-row">
                    <span class="drv-row__name">${c.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${c.value}%;background:${te(c)}"></div></div>
                    <span class="drv-row__val">${c.value}</span>
                    <span class="drv-row__wt">&times;${c.weight}</span>
                    ${c.note?'<span class="drv-row__note">'+c.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${multiplier.toFixed(2)}</span>
            </div>
        </div>
    `,be()}let ue=!1;async function Ye(e,n){if(!(!f||ue)){ue=!0;try{const{data:t,error:a}=await _.from("finance_loan_offers").select("*").eq("id",e).single();if(a||!t)return;const{data:i,error:l}=await _.from("finance_loan_requests").select("*").eq("id",n).single();if(l||!i||i.status!=="open")return;const m=i.term_months,d=$e(i.amount,t.interest_rate),o=Math.round(i.amount/m),r=d+o,v=Y?.current_tick||0,{error:b}=await _.from("finance_loan_requests").update({status:"funded",accepted_offer_id:e,funded_tick:v}).eq("id",n);if(b)return;await _.from("finance_loan_offers").update({status:"accepted"}).eq("id",e),await _.from("finance_loan_offers").update({status:"declined"}).eq("request_id",n).neq("id",e).eq("status","pending"),await _.from("finance_active_loans").insert({request_id:n,offer_id:e,borrower_faction_id:i.requesting_faction_id,lender_faction_id:t.offering_faction_id,nation_id:i.nation_id,principal:i.amount,interest_rate:t.interest_rate,term_months:i.term_months,collateral_type:t.collateral_type,purpose:i.purpose,monthly_payment:r,started_tick:v});const{data:w}=await _.from("factions").select("corp_cash_reserves").eq("id",t.offering_faction_id).single();w&&await _.from("factions").update({corp_cash_reserves:Math.max(0,(Number(w.corp_cash_reserves)||0)-i.amount)}).eq("id",t.offering_faction_id);const{data:C}=await _.from("factions").select("corp_cash_reserves, corp_debt").eq("id",i.requesting_faction_id).single();if(C){const{error:T}=await _.from("factions").update({corp_cash_reserves:(Number(C.corp_cash_reserves)||0)+i.amount,corp_debt:(Number(C.corp_debt)||0)+i.amount}).eq("id",i.requesting_faction_id);T&&console.error("[Loans] Failed to credit borrower + track debt:",T.message)}}finally{ue=!1}be()}}async function Qe(e){await _.from("finance_loan_requests").update({status:"cancelled"}).eq("id",e),be()}async function be(){if(!f)return;const e=document.getElementById("fin-loans-list");if(e)try{const{data:n,error:t}=await _.from("finance_loan_requests").select("*, finance_loan_offers!request_id(*)").eq("requesting_faction_id",f.id).in("status",["open","funded"]).neq("request_type","equity").order("created_tick",{ascending:!1});t&&console.error("[Loans] Request query error:",t.message);const{data:a,error:i}=await _.from("finance_active_loans").select("*, finance_loan_requests!inner(request_type, insured_contract_id), lender:factions!lender_faction_id(faction_name, abbreviation)").eq("borrower_faction_id",f.id).in("status",["current","late","delinquent"]).is("equity_pct",null).order("started_tick",{ascending:!1});i&&console.error("[Loans] Active loans query error:",i.message);const l=[];for(const r of a||[]){const v=r.finance_loan_requests?.insured_contract_id;v&&l.push(v)}const m=[...new Set(l)];let d={};if(m.length>0){const{data:r,error:v}=await _.from("construction_contracts").select("id, status").in("id",m);v?console.error("[Loans] Contract status query error:",v.message):d=Object.fromEntries((r||[]).map(b=>[b.id,b.status]))}let o="";if(n&&n.length>0){for(const r of n)if(r.status==="open"){const v=(r.finance_loan_offers||[]).filter(b=>b.status==="pending");if(o+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span style="color:#5a8aaa;font-weight:700;">OPEN</span>
                            <span style="color:var(--text-primary);margin-left:4px;">${y(r.amount)}</span>
                            <span style="color:var(--text-dim);margin-left:4px;">${r.term_months}mo</span>
                        </div>
                        <span style="color:var(--text-dim);cursor:pointer;" onclick="cancelRequest('${r.id}')">&#10005;</span>
                    </div>
                    <div style="font-size:7px;color:var(--text-dim);margin-top:2px;">${u(r.purpose||"")}</div>`,v.length>0){o+=`<div style="margin-top:4px;font-size:7px;color:#5a8aaa;font-weight:700;">${v.length} OFFER${v.length>1?"S":""}</div>`;for(const b of v.sort((w,C)=>w.interest_rate-C.interest_rate))o+=`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-top:1px solid var(--border-hair);">
                            <span style="color:var(--text-primary);font-weight:700;">${b.interest_rate}%</span>
                            <span style="color:var(--text-dim);">${b.collateral_type}</span>
                            <span style="flex:1;"></span>
                            <span style="padding:2px 8px;cursor:pointer;color:#000;background:#5a8aaa;font-weight:700;font-size:7px;" onclick="acceptOffer('${b.id}','${r.id}')">ACCEPT</span>
                        </div>`}else o+='<div style="margin-top:2px;font-size:7px;color:var(--text-dim);">Awaiting offers from finance corporations...</div>';o+="</div>"}}if(a&&a.length>0)for(const r of a){const v=r.finance_loan_requests?.request_type||"loan",b=r.finance_loan_requests?.insured_contract_id,w=b?d[b]:null;if(v==="insurance"){const S=(r.status==="late"||r.status==="delinquent")&&Number(r.payments_missed||0)===0,L=S?"#d9a441":r.status==="current"?"var(--green)":r.status==="late"?"#c84":"#c55",z=w==="completed"?"Project Completed":w==="in_progress"?"Project In Progress":null;o+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            <span style="color:#5a8aaa;font-weight:700;">INSURANCE</span>
                            <span style="color:${L};font-weight:700;">${r.status.toUpperCase()}</span>
                            ${S?'<span style="color:#d9a441;background:rgba(217,164,65,0.14);border:1px solid rgba(217,164,65,0.32);padding:1px 6px;font-size:7px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">Status drift</span>':""}
                        </div>
                        ${w==="completed"?'<span style="color:#c8a64e;background:rgba(200,166,78,0.14);border:1px solid rgba(200,166,78,0.3);padding:1px 6px;font-size:7px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">Pending auto-close</span>':""}
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;font-size:7px;color:var(--text-dim);">
                        <span>Monthly Premium: ${y(r.monthly_payment)}/mo</span>
                        <span>Coverage: ${y(r.principal)}</span>
                    </div>
                    ${z?`<div style="margin-top:4px;">
                            <span style="color:#5a8aaa;background:rgba(90,138,170,0.14);border:1px solid rgba(90,138,170,0.32);padding:1px 6px;font-size:7px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">${z}</span>
                        </div>`:""}
                </div>`;continue}const C=(r.status==="late"||r.status==="delinquent")&&Number(r.payments_missed||0)===0,T=C?"#d9a441":r.status==="current"?"var(--green)":r.status==="late"?"#c84":"#c55",B=r.term_months>0?Math.round(r.payments_made/r.term_months*100):0,O=r.lender?.faction_name||"Unknown bank",j=ve(r.started_tick);o+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="color:${T};font-weight:700;">${r.status.toUpperCase()}</span>
                        ${C?'<span style="color:#d9a441;background:rgba(217,164,65,0.14);border:1px solid rgba(217,164,65,0.32);padding:1px 6px;font-size:7px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;margin-left:4px;">Status drift</span>':""}
                        <span style="color:var(--text-primary);margin-left:4px;">${y(r.principal)}</span>
                        <span style="color:var(--text-dim);margin-left:4px;">@ ${r.interest_rate}%</span>
                    </div>
                    <span style="color:var(--text-dim);">${B}% repaid</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Bank: <span style="color:var(--text-primary);">${u(O)}</span></span>
                    <span>Issued: <span style="color:var(--text-primary);">${u(j)}</span></span>
                </div>
                <div style="height:2px;background:var(--border-0);margin-top:3px;">
                    <div style="height:100%;width:${B}%;background:${T};"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Payment: ${y(r.monthly_payment)}/mo</span>
                    <span>${r.payments_made}/${r.term_months} payments</span>
                </div>
            </div>`}o||(o='<div style="color:var(--text-dim);">No active loans.</div>'),e.innerHTML=o}catch(n){console.error("[Loans] loadLoansSection error:",n)}}window.acceptOffer=Ye;window.cancelRequest=Qe;function Xe(e,n){const t=(e||"").toUpperCase(),a=Number(n.corp_general_workforce??0)+Number(n.corp_skilled_workforce??0)+Number(n.corp_innovative_workforce??0),i=[{label:"Reputation",value:Number(n.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:a||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(n.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(n.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(n.corp_market_share??5),change:0,nation:t,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(n.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(n.corp_regulatory_standing??50),change:0,nation:t,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(n.corp_political_influence??10),change:0,decay:!0,nation:t,max:100},{label:"Innovation",value:Number(n.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function l(o,r){if(!r||r>100)return"var(--text-primary)";const v=o/r*100;return v>=70?"var(--green)":v>=40?"var(--amber)":v>=20?"var(--orange, #d48a3c)":"var(--red)"}function m(o){const r=parseFloat(o),v=r>0?"var(--green)":r<0?"var(--red)":"var(--text-dim)",b=r>0?"▲":r<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${v}">${b}</span>
            <span class="stat-item__delta" style="color:${v}">${Math.abs(r).toFixed(1)}</span>
        </div>`}let d="";for(const o of i){if(o.isHero){d+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${o.label}</span>
                            ${o.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${Math.round(o.value)}</span>
                            <span class="stats-hero__max">/100</span>
                            ${m(o.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${Math.min(100,o.value)}%"></div></div>
                </div>`;continue}o.section&&(d+=`<div class="stats-section"><span class="stats-section__label">${o.section}</span></div>`);const r=o.max&&o.max<=100;d+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${o.label}</span>
                        ${o.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${o.nation?'<span class="stat-item__nation">'+u(o.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${r?l(o.value,o.max):"var(--text-primary)"}">${typeof o.value=="number"?r?Math.round(o.value):o.value.toLocaleString():o.value}</span>
                    ${r?'<span class="stat-item__max">/100</span>':""}
                    ${m(o.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=d}async function he(e,n,t,a){const i=(n||"UNKNOWN").toUpperCase();let l=[];if(t?.id){const{data:k}=await _.from("corp_properties").select("*").eq("faction_id",t.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});l=k||[]}const m={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let d=0,o=0;const r=Number(t?.corp_general_workforce??0)+Number(t?.corp_skilled_workforce??0)+Number(t?.corp_innovative_workforce??0),v=500,b=l.map(k=>{const p=Number(k.capacity||0),A=Number(k.condition||0)/100;return Math.floor(p*A)}),w=v+b.reduce((k,p)=>k+p,0),C=w>0?Math.min(r,Math.round(r*(v/w))):r,T=5e7,B=1+(se(e,"inflation")-50)/100*.3,O=.8+se(e,"stability")/100*.4,j=Math.round(T*B*O),S=Math.round(j*.005);d+=j,o+=S;let L=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${u(i)} · Headquarters</div>
            </div>
            <span class="prop-asset__badge">HQ</span>
        </div>
        <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${v}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${C.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${y(j)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${y(S)}</div>
            </div>
        </div>
    </div>`,z=C;for(let k=0;k<l.length;k++){const p=l[k],A=m[p.style]||m.Basic;d+=Number(p.purchase_price||0),o+=Number(p.monthly_maintenance||0);const D=p.condition>=75?"var(--green)":p.condition>=50?"var(--amber)":"var(--orange)",P=Number(p.capacity||0),x=b[k]||0,W=w>0?Math.min(r-z,Math.round(r*(x/w))):0;z+=W,L+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${u(p.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${u(p.city||i)} · ${(p.type||"").replace(/_/g," ")} · <span style="color:${A.color}">${(p.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge" ${["branch_office","trading_floor","claims_office"].includes(p.type)?'style="background:rgba(138,106,170,0.12);color:#8a6aaa;border-color:rgba(138,106,170,0.3);"':""}>${["branch_office","trading_floor","claims_office"].includes(p.type)?p.type.replace(/_/g," ").replace(/\b\w/g,V=>V.toUpperCase()):"OWNED"}</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${P.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${W.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${y(p.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${y(p.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${D}">${p.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${p.condition}%;height:100%;background:${D};"></div></div>
            ${p.refurbish_until_tick&&p.refurbish_until_tick>(a?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${p.refurbish_until_tick-(a?.current_tick||0)} tick${p.refurbish_until_tick-(a?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${p.id}','${u(p.name).replace(/'/g,"\\'")}',${p.purchase_price||0},${p.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${p.id}','${u(p.name).replace(/'/g,"\\'")}',${p.condition},${p.purchase_price||0},${p.refurbish_count||0})">REFURBISH</button>
                ${t?.corp_sector==="Finance"&&(p.type==="office"||p.type==="regional_hq")&&!["branch_office","trading_floor","claims_office"].includes(p.type)?`<button class="prop-action-btn" style="background:rgba(138,106,170,0.08);border-color:rgba(138,106,170,0.2);color:#8a6aaa;" onclick="showConvertModal('${p.id}','${u(p.name).replace(/'/g,"\\'")}',${p.purchase_price||0})">CONVERT</button>`:""}
            </div>`}
        </div>`}let q="",N=[];if(t?.id){const{data:k}=await _.from("construction_contracts").select("*, contract_bids(id, faction_id, bid_price, estimated_quality, estimated_cost, labor_count, markup_pct, material_grades, submitted_at_tick, status, factions!faction_id(faction_name, abbreviation, corp_reputation))").eq("issuer_faction_id",t.id).in("status",["open","bidding","awarded","in_progress"]).order("generated_at_tick",{ascending:!1});N=k||[];let p={};const A=N.filter(D=>D.status==="in_progress").map(D=>D.id);if(A.length>0){const{data:D}=await _.from("construction_events").select("contract_id, status, severity, title").in("contract_id",A).eq("status","ACTIVE");for(const P of D||[])p[P.contract_id]||(p[P.contract_id]=[]),p[P.contract_id].push(P)}if(N.length>0){const D={open:{label:"OPEN",color:"#5a8aaa"},bidding:{label:"BIDDING",color:"#c8a832"},awarded:{label:"AWARDED",color:"#8b9a6b"},in_progress:{label:"IN PROGRESS",color:"#5aaa8b"}},P={LOW:"#ca5",MODERATE:"#c84",HIGH:"#c55",CRITICAL:"#f44"};q=`<div class="cp-section">
                <div class="cp-section__header">
                    <span class="cp-section__title">Construction Projects</span>
                    <span class="cp-section__count">${N.length} ACTIVE</span>
                </div>`;for(const x of N){const W=D[x.status]||D.open,V=(x.contract_bids||[]).filter(I=>I.status==="pending"),G=(x.contract_bids||[]).find(I=>I.status==="won"),te=a?.current_tick||0,Z=p[x.id]||[],ne=x.nation_id===t.nation_id?i:"";if(q+=`<div class="cp-item">
                    <div class="cp-item__top">
                        <div>
                            <div class="cp-item__name">${u(x.name)}</div>
                            <div class="cp-item__sub">${u(x.project_code||"")} · ${u(x.sector||"")}${ne?" · "+u(ne):""}</div>
                        </div>
                        <span class="cp-badge" style="color:${W.color};border-color:${W.color}40;background:${W.color}08;">${W.label}</span>
                    </div>
                    <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:2px 0;">
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BUDGET</div>
                            <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${y(x.budget_ceiling||0)}</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">TIMELINE</div>
                            <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${x.timeline_ticks||"?"} ticks</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDS</div>
                            <div style="font-size:10px;font-weight:700;color:${V.length>0?"var(--amber)":"var(--text-dim)"};font-family:var(--font-mono);">${(x.contract_bids||[]).length}</div>
                        </div>
                    </div>`,(x.status==="awarded"||x.status==="in_progress")&&G){const I=Number(G.factions?.corp_reputation??50),c=I>=70?"#5c5":I>=40?"#ca5":"#c55",g=G.estimated_quality>=75?"#5c5":G.estimated_quality>=50?"#ca5":"#c55";if(q+=`<div style="margin-top:6px;padding:6px 8px;background:var(--bg-3);border:1px solid var(--border-hair);">
                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.8px;margin-bottom:3px;">CONTRACTOR</div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-bright);margin-bottom:4px;">${u(G.factions?.faction_name||"Unknown")}</div>
                        <div style="display:flex;gap:0;">
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID</div>
                                <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${y(G.bid_price)}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                <div style="font-size:9px;font-weight:700;color:${g};font-family:var(--font-mono);">${G.estimated_quality}/100</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${G.labor_count}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                <div style="font-size:9px;font-weight:700;color:${c};font-family:var(--font-mono);">${I}/100</div>
                            </div>
                        </div>`,x.status==="in_progress"&&x.awarded_at_tick!=null){const h=te-x.awarded_at_tick,$=x.timeline_ticks||1,M=x.stalled_ticks||0,Q=Math.min(100,Math.round(h/($+M)*100)),ee=Q>=75?"#5c5":Q>=40?"#ca5":"#5aaa8b",R=Math.max(0,$+M-h);q+=`<div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);margin-top:6px;">
                            <span style="color:var(--text-dim);">PROGRESS</span>
                            <span style="color:${ee};">${Q}%${M>0?" · "+M+" stalled":""} · ${R} tick${R!==1?"s":""} left</span>
                        </div>
                        <div class="cp-progress"><div class="cp-progress__bar" style="width:${Q}%;background:${ee};"></div></div>`}else q+='<div style="font-size:8px;font-family:var(--font-mono);color:var(--amber);margin-top:6px;text-align:center;">Awarded — construction begins next tick</div>';q+="</div>"}if(Z.length>0)for(const I of Z){const c=P[I.severity]||"#ca5";q+=`<div style="display:flex;align-items:center;gap:5px;margin-top:4px;padding:3px 6px;background:${c}08;border:1px solid ${c}20;">
                            <span class="cp-badge" style="color:${c};border-color:${c}40;background:${c}12;">${I.severity}</span>
                            <span style="font-size:8px;font-family:var(--font-mono);color:${c};">${u(I.title)}</span>
                        </div>`}if((x.status==="open"||x.status==="bidding")&&V.length>0)for(let I=0;I<V.length;I++){const c=V[I],g=x.id.slice(0,8)+"-"+I,h=Number(c.factions?.corp_reputation??50),$=h>=70?"#5c5":h>=40?"#ca5":"#c55",M=c.estimated_quality>=75?"#5c5":c.estimated_quality>=50?"#ca5":"#c55",Q=c.markup_pct<=10?"#5c5":c.markup_pct<=20?"#ca5":"#c55",ee=c.material_grades||{},R=Object.entries(ee),K=oe=>oe.replace(/_/g," ").replace(/\b\w/g,ce=>ce.toUpperCase()),le=oe=>oe==="HIGH"?"#5c5":oe==="LOW"?"#c55":"var(--text-muted)";q+=`<div class="cp-bid" style="flex-direction:column;gap:0;padding:0;cursor:pointer;" onclick="cpToggleBid('${g}')">
                            <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;">
                                <span style="flex:1;font-size:8px;font-family:var(--font-mono);color:var(--text-muted);">
                                    ${u(c.factions?.faction_name||"Unknown")}
                                    · <span style="color:var(--gold);">${y(c.bid_price)}</span>
                                    · Q: <span style="color:${M};">${c.estimated_quality}</span>
                                </span>
                                <span class="cp-bid__btn" style="color:#5c5;border-color:#5c540;background:#5c508;" onclick="event.stopPropagation();cpAcceptBid('${x.id}','${c.id}','${u((c.factions?.faction_name||"").replace(/'/g,""))}',${c.bid_price},${c.estimated_quality},${c.labor_count},'${c.faction_id}')">ACCEPT</span>
                            </div>
                            <div id="cp-bid-${g}" style="display:none;padding:4px 8px 6px;border-top:1px solid var(--border-hair);background: var(--border-hair);">
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID PRICE</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${y(c.bid_price)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">EST. COST</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${y(c.estimated_cost||0)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MARKUP</div>
                                        <div style="font-size:9px;font-weight:700;color:${Q};font-family:var(--font-mono);">${c.markup_pct}%</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                        <div style="font-size:9px;font-weight:700;color:${M};font-family:var(--font-mono);">${c.estimated_quality}/100</div>
                                    </div>
                                </div>
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${c.labor_count}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                        <div style="font-size:9px;font-weight:700;color:${$};font-family:var(--font-mono);">${h}/100</div>
                                    </div>
                                    <div style="flex:2;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDDER</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${u(c.factions?.faction_name||"Unknown")}</div>
                                    </div>
                                </div>
                                ${R.length>0?`<div style="padding:2px 4px;">
                                    <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;margin-bottom:2px;">MATERIAL GRADES</div>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                        ${R.map(([oe,ce])=>`<span style="font-size:7px;font-family:var(--font-mono);color:${le(ce)};">${K(oe)}: ${ce}</span>`).join("")}
                                    </div>
                                </div>`:""}
                            </div>
                        </div>`}if((x.status==="open"||x.status==="bidding")&&V.length===0){const I=(x.bidding_ends_tick||0)-(a?.current_tick||0);q+=`<div style="font-size:8px;font-family:var(--font-mono);color:var(--text-dim);margin-top:4px;text-align:center;">
                        Awaiting bids${I>0?" · "+I+" tick"+(I!==1?"s":"")+" remaining":""}
                    </div>`}q+="</div>"}q+="</div>"}}const H=document.getElementById("prop-count"),F=l.length+1,U=N.length,E=F+" ASSET"+(F!==1?"S":"")+(U>0?" · "+U+" PROJECT"+(U!==1?"S":""):"");return H&&(H.textContent=E),document.getElementById("prop-body").innerHTML=`
        ${L}
        ${q}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${y(d)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${y(o)}/mo</span>
            </div>
        </div>
    `,{propertyValue:d,propertyMaintenance:o,totalCapacity:w}}async function Je(e,n,t,a,i=0){(n||"UNKNOWN").toUpperCase();const l=t.corp_company_type||"Private",m=Number(t.corp_cash_reserves)||0,d=a?.propertyValue||0;let o=0;if(t?.id&&t.corp_sector==="Finance")try{const{data:z}=await _.from("finance_active_loans").select("remaining_principal, finance_loan_requests(request_type)").eq("lender_faction_id",t.id).in("status",["current","late","delinquent"]);for(const q of z||[]){const N=q.finance_loan_requests?.request_type||"loan";if(N==="loan"||N==="bond"){const H=Math.max(0,Number(q.remaining_principal||0));o+=H}}}catch(z){console.warn("[Valuation] finance_active_loans lookup failed:",z)}const r=m+d+i+o,v=Number(t.corp_debt)||0,b=0,w=0,C=v+b+w,T=r-C,O=Math.round(T*(1+.3)),j=O-T,S=j>0;document.getElementById("val-type-badge").textContent=l.toUpperCase();function L(z,q,N={}){const H=N.indent?"val-line val-line--indent":"val-line",F=N.bold?"val-line__label val-line__label--bold":"val-line__label",U=N.bold?"val-line__value val-line__value--bold":"val-line__value",E=N.color||(N.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${H}"><span class="${F}">${z}</span><span class="${U}" style="color:${E}">${y(q)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${L("Cash & Reserves",m,{indent:!0})}
        ${L("Property",d,{indent:!0})}
        ${L("Equipment",i,{indent:!0})}
        ${L("Active Contracts",o,{indent:!0})}
        ${L("Total Assets",r,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${L("Outstanding Loans",v,{indent:!0})}
        ${L("Accounts Payable",b,{indent:!0})}
        ${L("Pending Project Costs",w,{indent:!0})}
        ${L("Total Liabilities",C,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${T>=0?"var(--green)":"var(--red)"};">${y(T)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${y(O)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${S?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${S?"var(--green)":"var(--red)"};">${S?"+":""}${y(j)}</span>
            </div>
            <div class="val-market__note">${S?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `,et({faction:t,nationName:n,cashReserves:m,propertyValue:d,equipmentValue:i,outstandingLoans:v,accountsPayable:b,totalLiabilities:C,netWorth:T,currentTickDate:e?._h2_close_label})}function Ze(e,n){const t=document.getElementById("h2-kpi-rev"),a=document.getElementById("h2-kpi-rev-d");if(!t)return;const i=ae(e);if(t.innerHTML=`${i.main}<small>${i.unit}</small>`,a){const l=ae(Math.abs(n)),m=n>=0?"+":"−",d=n>=0?"up":"down";a.className="delta "+d,a.textContent=`${m}${l.main}${l.unit} net`}}function et({faction:e,nationName:n,cashReserves:t,propertyValue:a,equipmentValue:i,outstandingLoans:l,accountsPayable:m,totalLiabilities:d,netWorth:o}){if(!document.getElementById("h2-kpi-cash"))return;const r=ae(t);document.getElementById("h2-kpi-cash").innerHTML=`${r.main}<small>${r.unit}</small>`;const v=document.getElementById("h2-kpi-cash-d");v&&(v.textContent=d>0?`Liab. ${ae(d).main}${ae(d).unit}`:"No liabilities");const b=ae(o);document.getElementById("h2-kpi-nw").innerHTML=`${b.main}<small>${b.unit}</small>`;const w=document.getElementById("h2-kpi-nw-d");if(w){const p=o>=0?"up":"down";w.className="delta "+p,w.textContent=o>=0?"positive equity":"negative equity"}const C=Number(e.corp_reputation??0),T=document.getElementById("h2-kpi-rep");T&&(T.innerHTML=`${Math.round(C)}<small> / 100</small>`);const B=document.getElementById("h2-kpi-rep-d");B&&(B.className="delta "+(C>=70?"up":C>=40?"flat":"down"),B.textContent=C>=70?"strong":C>=40?"steady":"weak");const O=Number(e.corp_market_share??0),j=document.getElementById("h2-kpi-mkt");j&&(j.innerHTML=`${Math.round(O)}<small>%</small>`);const S=document.getElementById("h2-kpi-mkt-d");S&&(S.className="delta "+(O>=15?"up":O>=5?"flat":"down"),S.textContent=O>=15?"major player":O>=5?"mid-tier":"niche");const L=(e.corp_ticker||e.abbreviation||"CORP").toUpperCase(),z=document.getElementById("h2-nw-sym");z&&(z.textContent=L);const q=document.getElementById("h2-nw-ex");if(q){const p=(n||"").split(" ").map(A=>A[0]||"").join("").toUpperCase().slice(0,4);q.textContent=`${e.corp_company_type||"Private"}${p?" · "+p+" EXCH":""}`}const N=document.getElementById("h2-nw-price");N&&(N.innerHTML=`${b.main}<small>${b.unit}</small>`);const H=document.getElementById("h2-nw-d");H&&(H.className="d flat",H.textContent="no history yet");const F=(p,A,D)=>{const P=document.getElementById(p);P&&(P.textContent=y(A))};F("h2-tr-cash",t),F("h2-tr-property",a),F("h2-tr-equipment",i);const U=document.getElementById("h2-tr-loans");U&&(U.textContent=y(l),U.classList.toggle("good",l===0),U.classList.toggle("red",l>0)),F("h2-tr-payable",m);const E=We(e.corp_credit_rating??50),k=document.getElementById("h2-tr-credit");k&&(k.textContent=`${E.tag} · ${E.tone==="good"?"stable":E.tone==="gold"?"watch":"caution"}`,k.classList.remove("good","gold","red"),k.classList.add(E.tone))}async function tt(){const e=document.getElementById("slogan-input"),n=document.getElementById("slogan-hint"),t=document.getElementById("slogan-save-btn"),a=(e.value||"").trim().slice(0,60);if(a.length===0){n.textContent="Slogan cannot be empty.",n.className="slogan-hint slogan-hint--error";return}t.disabled=!0,t.textContent="...",n.textContent="";try{const{error:i}=await _.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(i)throw i;document.getElementById("id-slogan").textContent='"'+a+'"',n.textContent="Slogan saved! Next change in 120 ticks.",n.className="slogan-hint slogan-hint--ok",t.textContent="Save"}catch(i){console.error("Slogan save failed:",i),n.textContent="Failed to save slogan.",n.className="slogan-hint slogan-hint--error",t.disabled=!1,t.textContent="Save"}}async function nt(){await _.auth.signOut(),window.location.href="login.html"}function ot(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function at(e,n){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),n==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const n=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&n&&!n.contains(e.target)&&t.classList.remove("open")});window.doLogout=nt;async function it(e){const n=e.target.files?.[0];if(!n)return;if(n.size>128*1024){alert("Logo must be under 128KB.");return}const t=window._corpFactionId;if(!t)return;const a=document.getElementById("corp-logo-label");a&&(a.textContent="Uploading...");try{const i=n.name.split(".").pop()||"png",l=`party-logos/${t}/${Date.now()}.${i}`,{error:m}=await _.storage.from("public-assets").upload(l,n,{contentType:n.type,upsert:!0});if(m)throw m;const{data:d}=_.storage.from("public-assets").getPublicUrl(l),o=d?.publicUrl||null;await _.from("factions").update({custom_logo_url:o}).eq("id",t);const r=document.getElementById("id-logo");r&&(r.innerHTML=`<img src="${o}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`);const v=document.getElementById("corp-logo");v&&(v.innerHTML=`<img src="${o}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`),a&&(a.textContent="Change Logo")}catch(i){console.error("Logo upload failed:",i),alert("Upload failed: "+(i.message||"Unknown error")),a&&(a.textContent="Upload Logo")}}window.saveSlogan=tt;window.toggleCorpDropdown=ot;window.switchToFaction=at;let pe=!1;function rt(e,n,t,a){if(pe)return;const i=window._nationStats,m=1+(se(i,"inflation")-50)/100*.3,d=Math.max(.1,a/100),o=Math.round(t*m*d),r=document.getElementById("prop-modal-overlay"),v=document.getElementById("prop-modal-content");v.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${u(n)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${y(t)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Inflation Modifier</span>
                <span style="color:var(--amber, #b09a5b);">${m.toFixed(3)}x</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Condition</span>
                <span style="color:${a>=75?"var(--green)":a>=50?"var(--amber)":"var(--red)"};">${a}%</span>
            </div>
            <div style="border-top:1px solid var(--border-hair);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-mono);font-weight:700;">
                <span style="color:var(--text-primary);">Sale Price</span>
                <span style="color:var(--gold, #c8a832);">${y(o)}</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-sell-confirm" onclick="confirmSellProperty('${e}', ${o})">Confirm Sale</button>
        </div>
    `,r.style.display="flex"}async function st(e,n){if(pe)return;pe=!0;const t=document.getElementById("prop-sell-confirm");t&&(t.disabled=!0,t.textContent="Selling...");try{const a=window._corpFactionId;if(!a)throw new Error("No faction");const{error:i}=await _.from("corp_properties").update({is_active:!1}).eq("id",e).eq("faction_id",a);if(i)throw new Error("Failed to sell property: "+i.message);const{data:l}=await _.from("factions").select("corp_cash_reserves").eq("id",a).single(),m=Number(l?.corp_cash_reserves??0),{error:d}=await _.from("factions").update({corp_cash_reserves:m+n}).eq("id",a);d&&console.error("[Property] Failed to credit cash:",d.message),_e(),alert("Property sold for "+y(n)+". Cash credited."),location.reload()}catch(a){alert("Sale failed: "+a.message)}finally{pe=!1,t&&(t.disabled=!1,t.textContent="Confirm Sale")}}let fe=!1;function lt(e,n,t,a,i){if(fe)return;const l=window._nationStats,m=window._factionData,o=1+(se(l,"inflation")-50)/100*.3,r=ke({purchase_price:a,refurbish_count:i},o),b=Number(m?.corp_cash_reserves??0)>=r,w=document.getElementById("prop-modal-overlay"),C=document.getElementById("prop-modal-content"),T=b&&t<95;let B="";t>=95?B='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property already at excellent condition ('+t+"%).</div>":b||(B='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>'),C.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${u(n)} — Refurbishment #${i+1} — Current Condition: ${t}%</div>
        ${B}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost${i>0?` (1.25<sup>${i}</sup> ×)`:""}</span>
                <span style="color:${b?"var(--gold, #c8a832)":"var(--red)"};">${y(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Duration</span>
                <span style="color:var(--amber, #b09a5b);">4–9 ticks</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">Outcome</span>
                <span style="color:var(--green);">Condition → 95–98%</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${e}', ${a}, ${i}, ${t})" ${T?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,w.style.display="flex"}async function ct(e,n,t,a){if(fe)return;fe=!0;const i=document.getElementById("prop-refurb-confirm");i&&(i.disabled=!0,i.textContent="Starting...");try{const l=window._corpFactionId,m=window._currentTick,d=window._factionData,o=window._nationStats;if(!l)throw new Error("No faction");const v=1+(se(o,"inflation")-50)/100*.3,w=await je(_,l,{id:e,purchase_price:n,refurbish_count:t,condition:a},m,v);if(!w.ok)throw new Error(w.error||"Refurbishment failed.");d&&(d.corp_cash_reserves=w.newCash),_e(),alert(`Refurbishment started! Duration: ${w.duration} ticks. Target condition: ${w.targetCondition}%. Cost: ${y(w.cost)}.`),location.reload()}catch(l){alert("Refurbishment failed: "+l.message)}finally{fe=!1,i&&(i.disabled=!1,i.textContent="Begin Refurbishment")}}function _e(){const e=document.getElementById("prop-modal-overlay");e&&(e.style.display="none")}window.showSellModal=rt;window.confirmSellProperty=st;window.showRefurbishModal=lt;window.confirmRefurbish=ct;window.closePropModal=_e;window.showConvertModal=ft;window.confirmConvertProperty=mt;let ge=!1;async function dt(e,n,t,a,i,l,m){if(!ge&&confirm("Accept bid from "+t+`?

Bid Price: `+y(a)+`
Quality: `+i+`/100
Workers: `+l+`

This will award the contract. The project begins immediately.`)){ge=!0;try{const{data:d}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),o=d?.current_tick||0,{error:r}=await _.from("contract_bids").update({status:"won"}).eq("id",n);if(r)throw r;const{error:v}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",e).neq("id",n);if(v)throw v;const{error:b}=await _.from("construction_contracts").update({status:"awarded",awarded_to_faction:m,awarded_at_tick:o}).eq("id",e);if(b)throw b;alert("Contract awarded to "+t+`!

Bid: `+y(a)+`
Project begins immediately.`),window._nationStats&&window._factionData&&Y&&await he(window._nationStats,window._nationStats?.name||"",window._factionData,Y)}catch(d){alert("Failed to accept bid: "+(d.message||d))}finally{ge=!1}}}window.cpAcceptBid=dt;function pt(e){const n=document.getElementById("cp-bid-"+e);n&&(n.style.display=n.style.display==="none"?"":"none")}window.cpToggleBid=pt;let me="branch_office",ye=!1;function ft(e,n,t){const a=(f?.corp_subsector||"").toLowerCase(),i=a==="banking"?[["branch_office","Branch Office"]]:a==="investment"?[["trading_floor","Trading Floor"]]:[];if(i.length===0)return;me=i[0][0];const l=Math.round(t*.15),m=Math.floor(Math.random()*6)+4,d=document.getElementById("prop-modal-overlay"),o=document.getElementById("prop-modal-content");o.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Convert Property</div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:10px;">${u(n)}</div>
        <div style="display:flex;gap:4px;margin-bottom:10px;">
            ${i.map(([r,v])=>`<span onclick="_convertTargetType='${r}';document.querySelectorAll('.conv-opt').forEach(e=>e.style.background='transparent');this.style.background='rgba(138,106,170,0.15)'" class="conv-opt" style="flex:1;text-align:center;padding:6px;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(138,106,170,0.3);color:#8a6aaa;${r===me?"background:rgba(138,106,170,0.15)":""}">${v}</span>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Cost</span>
            <span style="color:var(--gold);">${y(l)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Time</span>
            <span style="color:var(--text-bright);">${m} ticks</span>
        </div>
        <div style="font-size:8px;color:var(--text-dim);margin:8px 0;font-family:var(--font-mono);line-height:1.5;">Property will be offline during conversion. No revenue or workforce allocation until complete.</div>
        <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button class="prop-action-btn prop-action-btn--sell" onclick="closePropModal()">Cancel</button>
            <button class="prop-action-btn" style="background:rgba(138,106,170,0.12);border-color:rgba(138,106,170,0.3);color:#8a6aaa;" onclick="confirmConvertProperty('${e}',${l},${m})">Convert</button>
        </div>
    `,d.style.display="flex"}async function mt(e,n,t){if(!ye){ye=!0;try{const a=Number(f?.corp_cash_reserves??0);if(a<n){alert("Insufficient cash. Need "+y(n)+".");return}const i=Y?.current_tick||0,l=Math.max(0,a-n),{error:m}=await _.from("factions").update({corp_cash_reserves:l}).eq("id",f.id);if(m){alert("Conversion failed: "+m.message);return}f.corp_cash_reserves=l;const{data:d,error:o}=await _.from("corp_properties").update({type:me,role:me,refurbish_until_tick:i+t,condition:100}).eq("id",e).select("id");if(o||!d||d.length===0){const{error:v}=await _.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);v||(f.corp_cash_reserves=a);const b=o?.message||"property no longer exists";alert("Conversion failed: "+b+(v?" (refund also failed — contact admin)":""));return}_e();const r=window._nationStats;await he(r,r?.name||f?.nation,f,Y)}catch(a){alert("Conversion failed: "+a.message)}finally{ye=!1}}}const Ce={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},Ee={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},vt={crisis:"alert",protest:"alert",trade:"fin",economy:"fin",corporate:"fin",executive_order:"ops",military:"ops",bill:"pr",government:"pr",political:"pr",diplomatic:"pr",new_party:"pr"},_t={alert:"Alert",fin:"Fin",ops:"Ops",pr:"PR",crew:"Crew"};function ut(e){return vt[(e||"").toLowerCase()]||"crew"}function X(e){const n=document.getElementById("h2-wire-dispatches"),t=document.getElementById("h2-wire-live");if(!n)return;const a=Array.isArray(e)?e:[];if(a.length===0){n.innerHTML='<div class="h2-wire-empty">No dispatches</div>',t&&(t.textContent="0 events");return}t&&(t.textContent=`${a.length} event${a.length!==1?"s":""}`);const i=a.slice(0,12);n.innerHTML=i.map(l=>{const m=ut(l.category),d=l.fired_at_tick!=null?`T${l.fired_at_tick}`:"—",o=l.description_chosen||l.description_used||"",r=Te(l.event_name),v=r&&o?`<b>${u(r)}</b> — ${u(o)}`:u(r||o||"Event");return`<div class="h2-disp">
            <span class="h2-when">${u(d)}</span>
            <span class="h2-src ${m}">${_t[m]}</span>
            <span class="h2-ln">${v}</span>
        </div>`}).join("")}const gt={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let ie="nation",re="local",J=null;function Te(e){return e?e.replace(/_/g," ").replace(/\b\w/g,n=>n.toUpperCase()):""}function xe(e,n){if(!e)return"<em>Unknown</em>";const t=u(e);return n?`<span style="color:${n.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${t}</span>`:`<strong>${t}</strong>`}function qe(e,n,t){const a=e.factions?.nation_id===(e.nation_id||n),i=e.proposer_name||(a?e.factions?.faction_name:null)||"A former party",l=e.proposer_color||(a?e.factions?.party_color:null);return{fired_at_tick:e.proposed_tick,event_name:e.bill_name,_desc_html:`${xe(i,l)} proposed "${u(e.bill_name)}"`,category:"bill",_synthetic:!0,...t}}function Ie(e,n){const t=e.leader_first_name&&e.leader_last_name?`${e.leader_first_name} ${e.leader_last_name}`:null,a=t?` led by <strong>${u(t)}</strong>`:"";return{fired_at_tick:0,event_name:e.faction_name,_desc_html:`${xe(e.faction_name,e.party_color)} founded${a}`,category:"new_party",_synthetic:!0,_created_at:e.created_at,...n}}function Me(e,n){const t=gt[e.tier]||`Tier ${e.tier}`,a=e.demand_label?` demanding "${u(e.demand_label)}"`:"",i=e.status==="crisis_active",l=e.tier>=6?"#e74c3c":e.tier>=4?"#f39c12":"",m=l?`<span style="color:${l};font-weight:600">${u(t)}</span>`:`<strong>${u(t)}</strong>`;return{fired_at_tick:e.tick_resolved||e.tick_called,event_name:t,_desc_html:`${xe(e.factions?.faction_name,e.factions?.party_color)} organised a protest${a} — ${m}${i?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...n}}function Le(e,n,t,a,i){return[...e.map(l=>({...l,_synthetic:!1})),...n,...t,...a].sort((l,m)=>{const d=(m.fired_at_tick||0)-(l.fired_at_tick||0);if(d!==0)return d;const o=l._created_at||l.created_at||"",r=m._created_at||m.created_at||"";return r>o?1:r<o?-1:0}).slice(0,i)}function Ne(e){if(e._synthetic&&e._desc_html)return e._desc_html;const n=e.description_chosen||e.description_used||"",t=Te(e.event_name),a=t?`<strong>${u(t)}</strong>`:"",i=n?u(n):"";return a&&i?`${a} — ${i}`:i||a||"Event"}function Se(e){return e.map(n=>{const t=ve(n.fired_at_tick),a=Ce[(n.category||"").toLowerCase()]||Ee;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${u(t)}</span>
            <span class="corp-ev-icon" style="color:${a.color}">${a.icon}</span>
            <span class="corp-ev-text">${Ne(n)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}const we=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function yt(e){let n=0;for(let t=0;t<e.length;t++)n=(n<<5)-n+e.charCodeAt(t)|0;return we[Math.abs(n)%we.length]}function Pe(e){return e.map(n=>{const t=ve(n.fired_at_tick),a=Ce[(n.category||"").toLowerCase()]||Ee,i=n.nations?.name||"Unknown",l=n.nations?.nation_profiles,m=Array.isArray(l)?l[0]?.flag_url:l?.flag_url,d=yt(i),o=m?`<img src="${u(m)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${u(t)}</span>
                <span class="corp-ev-nation-badge" style="color:${d.color};background:${d.bg};border-color:${d.border};">${o}${u(i)}</span>
            </span>
            <span class="corp-ev-text">${Ne(n)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}async function bt(){const e=document.getElementById("corp-events-list");if(!e||!J)return;const{nationId:n}=J;if(!n){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[t,a]=await Promise.all([_.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").eq("nation_id",n).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),_.from("event_log").select("*").eq("nation_id",n).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=t.data||[],l=a.data||[],m=i.map(o=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${o.faction_name} [${o.corp_ticker||o.abbreviation||"??"}] was founded with a specialty in ${o.corp_subsector||o.corp_sector||"General"}. Led by CEO ${[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:o.founded_tick||0})),d=[...l,...m].sort((o,r)=>(r.fired_at_tick||0)-(o.fired_at_tick||0)).slice(0,40);if(d.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events in this nation yet.</div>',X([]);return}e.innerHTML=Se(d),X(d)}catch(t){console.error("Corp local events error:",t),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function ht(){const e=document.getElementById("corp-events-list");if(!e||!J)return;const{nationId:n}=J;if(!n){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[t,a]=await Promise.all([_.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",n).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),_.from("event_log").select("*, nations(name, nation_profiles(flag_url))").neq("nation_id",n).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=t.data||[],l=a.data||[],m=i.map(o=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${o.faction_name} [${o.corp_ticker||o.abbreviation||"??"}] was founded in ${o.nation||"Unknown"} with a specialty in ${o.corp_subsector||o.corp_sector||"General"}. Led by CEO ${[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:o.founded_tick||0,nations:{name:o.nation||"Unknown"}})),d=[...l,...m].sort((o,r)=>(r.fired_at_tick||0)-(o.fired_at_tick||0)).slice(0,40);if(d.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>',X([]);return}e.innerHTML=Pe(d),X(d);return}catch(t){console.error("Corp world events error:",t),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>';return}try{const{data:t,error:a}=await _.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",n).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(a)throw a;if(!t||t.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>',X([]);return}e.innerHTML=xt(t,!0)}catch(t){console.error("Corp world events error:",t),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function xt(e,n){return e.map(t=>{const a=[t.leader_first_name,t.leader_last_name].filter(Boolean).join(" ")||"Unknown",i=t.nation||"Unknown",l=t.corp_subsector||t.corp_sector||"General",m=t.corp_ticker||t.abbreviation||"",d=t.founded_tick?ve(t.founded_tick):"";let o='<div class="corp-event-row">';return o+='<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--teal);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);padding:1px 5px;display:inline-block;margin-bottom:2px;">'+u(i.toUpperCase())+"</div>",o+='<div style="font-size:11px;color:var(--text-primary);line-height:1.5;">',o+='<span style="font-weight:600;">'+u(t.faction_name)+"</span>",m&&(o+=' <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">['+u(m)+"]</span>"),o+=' was founded in <span style="font-weight:500;">'+u(i)+"</span>",o+=' with a specialty in <span style="color:var(--teal);font-weight:500;">'+u(l)+"</span>.",o+=' Led by CEO <span style="font-weight:500;">'+u(a)+"</span>.",o+="</div>",d&&(o+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">'+u(d)+"</div>"),o+="</div>",o}).join("")}async function Re(){const e=document.getElementById("corp-events-list");if(!e||!J)return;const{nationId:n}=J;if(!n){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[t,a,i,l]=await Promise.all([_.from("event_log").select("*").eq("nation_id",n).order("fired_at_tick",{ascending:!1}).limit(50),_.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",n).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),_.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",n).order("created_at",{ascending:!1}).limit(20),_.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",n).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(t.error)throw t.error;const m=t.data||[],d=Le(m,(a.data||[]).map(o=>qe(o,n)),(i.data||[]).map(o=>Ie(o)),(l.data||[]).map(o=>Me(o)),60);if(d.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>',X([]);return}e.innerHTML=Se(d),X(d)}catch(t){console.error("Nation events error:",t),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function wt(){const e=document.getElementById("corp-events-list");if(!e||!J)return;const{nationId:n}=J;if(!n){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[t,a,i,l]=await Promise.all([_.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).order("fired_at_tick",{ascending:!1}).limit(60),_.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),_.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).order("created_at",{ascending:!1}).limit(15),_.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(t.error)throw t.error;const m=t.data||[],d=Le(m,(a.data||[]).map(o=>qe(o,null,{nations:o.nations})),(i.data||[]).map(o=>Ie(o,{nations:o.nations})),(l.data||[]).map(o=>Me(o,{nations:o.nations})),60);if(d.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>',X([]);return}e.innerHTML=Pe(d),X(d)}catch(t){console.error("World events error:",t),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}window.switchCorpEventsCat=function(e){e!==ie&&(ie=e,document.querySelectorAll("#corp-events-cat-bar .corp-events-tab").forEach(n=>n.classList.toggle("active",n.dataset.cat===e)),Be())};window.switchCorpEventsScope=function(e){e!==re&&(re=e,document.querySelectorAll("#corp-events-scope-bar .corp-events-tab").forEach(n=>n.classList.toggle("active",n.dataset.scope===e)),Be())};function Be(){ie==="nation"&&re==="local"?Re():ie==="nation"&&re==="world"?wt():ie==="corporate"&&re==="local"?bt():ht()}Ve();
