const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BsVGcrAN.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as c}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as Kt}from"./preload-helper-BXl3LOEh.js";import{e as _,t as Ct}from"./utils-CY90Gazr.js";import{initMessaging as Yt}from"./messaging-BUrQna7p.js";import{c as Qt}from"./equipment-DsuDdEne.js";let _t=[],p=null,G=null;function f(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(2)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(1)+"k":"$"+Math.round(t).toLocaleString()}function ct(t,o){return Number(t?.[o]??50)}async function Xt(){const{data:{user:t}}=await c.auth.getUser();if(!t){window.location.href="login.html";return}const{data:o}=await c.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);_t=(o||[]).filter(h=>h.nation_id&&!h.abandoned_at);const e=sessionStorage.getItem("active_faction_id");if(p=_t.find(h=>h.id===e)||_t.find(h=>h.faction_type==="corporation")||_t[0],!p){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",p.id),p.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i={Construction:"corp-operations.html",Finance:"corp-operations-finance.html",Shipping:"corp-operations.html"}[p.corp_sector]||"corp-operations.html",s=document.getElementById("nav-operations"),r=document.getElementById("nav-expansion");s&&(s.href=i),r&&(r.href="corp-operations.html?tab=expansion");let l=p.nation||"",n=null;const[d,u]=await Promise.all([p.nation_id?c.from("nations").select("*").eq("id",p.nation_id).single():Promise.resolve({data:null}),c.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);d.error&&console.warn("Nation load failed:",d.error.message),d.data&&(l=d.data.name,n=d.data),u.error&&console.warn("Shard load failed:",u.error.message),G=u.data;let g=0;if(p?.id){const{data:h}=await c.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",p.id).in("status",["open","bidding"]);if(h)for(const q of h)g+=(q.contract_bids||[]).length}const k=document.getElementById("corp-topbar-container");if(k){const{renderCorpTopBar:h}=await Kt(async()=>{const{renderCorpTopBar:y}=await import("./corp-topbar-BsVGcrAN.js");return{renderCorpTopBar:y}},__vite__mapDeps([0,1])),q={};g>0&&(q.home={color:"#c8a832",title:g+" pending bid"+(g!==1?"s":"")+" on your projects"}),h(k,{faction:p,shard:G,activeTab:"home",allUserFactions:_t,badges:q})}document.getElementById("id-type-badge").textContent=p.corp_company_type||"—";const L=document.getElementById("id-logo"),O=(p.corp_ticker||p.abbreviation||"").toUpperCase();p.custom_logo_url?L.innerHTML=`<img src="${_(p.custom_logo_url)}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`:L.textContent=O.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=p.faction_name||"Unnamed Corp";const z=p.party_description||"";document.getElementById("id-slogan").textContent=z?'"'+z+'"':'"--"';const A=G?.current_date?G.current_date.replace(/.*,\s*/,""):"—",H=p.leader_first_name&&p.leader_last_name?p.leader_first_name+" "+p.leader_last_name+(p.leader_age?" ("+p.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${_(A)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${_(l||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${_(p.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${_(p.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${_(H)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${_(p.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${_(O)}</span>
        </div>
    `;const S=p.last_rename_tick||0,W=G?.current_tick||0,w=Math.max(0,S+120-W),B=!z||z==="-"||z==='"-"'||w<=0,M=document.getElementById("slogan-editor");M.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${_(z)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${B?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${B?"60 characters max. 120 tick cooldown after change.":w+" ticks until you can change slogan."}</div>
    `;const R=document.getElementById("corp-logo-upload");R.innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Logo</span>
            <label class="id-row__value" style="cursor:pointer;text-decoration:underline;" id="corp-logo-label">
                ${p.custom_logo_url?"Change Logo":"Upload Logo"}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" id="corp-logo-file" style="display:none;">
            </label>
        </div>
    `,document.getElementById("corp-logo-file")?.addEventListener("change",le),window._corpFactionId=p.id,window._currentTick=W,window._nationStats=n,window._factionData=p;const F=Jt(n,l,p);oe(l,p);const T=await Mt(n,l,p,G);let x=0;if(p?.id){const{data:h,error:q}=await c.from("corp_equipment").select("equipment_key, owned").eq("faction_id",p.id);q||(x=Qt(h||[]))}let v=0;if(p?.id){const{data:h}=await c.from("corp_executives").select("salary_per_year").eq("faction_id",p.id).eq("status","active");v=(h||[]).reduce((q,y)=>q+(Number(y.salary_per_year)||0),0)}let V=0;if(p?.id&&p.corp_sector==="Shipping"){const{data:h}=await c.from("corp_vessels").select("base_maintenance").eq("faction_id",p.id).neq("status","for_sale");V=(h||[]).reduce((q,y)=>q+(Number(y.base_maintenance)||0),0)}await Zt(n,G,F,p,T.propertyMaintenance||0,x,v,T,V),await ne(n,l,p,F,T),Yt(p,n,G),nt={nationId:p.nation_id},Ft(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function Jt(t,o,e){const a=x=>ct(t,x),i=(o||"UNKNOWN").toUpperCase(),s=Number(e?.corp_general_workforce??2250),r=Number(e?.corp_skilled_workforce??600),l=Number(e?.corp_innovative_workforce??150),n=s+r+l,d=2,u=3,g=6,k=a("minimum_wage"),L=k/100*48e3,O=a("inflation"),z=a("standard_of_living"),A=1+(O-50)/100*.5,H=1+(z-50)/100*.5,S=x=>Math.round(L*x*A*H),W=S(d),j=S(u),w=S(g),N=s*W,B=r*j,M=l*w,R=N+B+M;function F(x){return"$"+Math.round(x).toLocaleString()+"/yr"}const T=`${A.toFixed(2)} &times; ${H.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=n.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${_(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${s.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${d}.0 &times; ${T})</span>
                <span class="wf-tier__value">${F(W)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${f(N)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${_(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${u}.0 &times; ${T})</span>
                <span class="wf-tier__value">${F(j)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${f(B)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${_(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${g}.0 &times; ${T})</span>
                <span class="wf-tier__value">${F(w)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${f(M)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${_(i)})</span>
                <span class="wf-tier__value">${k}/100 → ${F(L)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${A.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${H.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${n.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${f(R)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${f(R/12)}</span>
            </div>
        </div>
    `,{totalWages:R,generalTotal:N,skilledTotal:B,innovativeTotal:M,monthlyWages:Math.round(R/12)}}async function Zt(t,o,e,a,i,s,r,l,n){const d=o?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+d;const u=87e6,g=m=>ct(t,m),k=1+(g("gdp_growth")-50)/100*.4,L=1+(g("urbanization")-50)/100*.3,O=1+(g("population_growth")-50)/100*.2,z=1+(g("standard_of_living")-50)/100*.15,A=1+(50-g("physical_infrastructure"))/100*.1,H=1-Math.max(0,g("inflation")-50)/100*.1,S=1-Math.max(0,g("interest_rates")-50)/100*.1,W=k*L*O*z*A*H*S,j=Math.round(u*W),w=(a.corp_general_workforce||0)+(a.corp_skilled_workforce||0)+(a.corp_innovative_workforce||0),N=Math.max(500,l?.totalCapacity||500),B=Math.min(1,w/N),M=l?.propertyRevBonus||0,R=Math.round(Math.round(j/12)*B)+M;let F=0,T=0,x=0;if(a?.id){const m=a.corp_sector||"";if(m==="Finance"){const{data:P}=await c.from("finance_active_loans").select("monthly_payment, interest_rate, principal, total_paid, finance_loan_requests(request_type)").eq("lender_faction_id",a.id).in("status",["current","late","delinquent"]);for(const $ of P||[]){const E=$.finance_loan_requests?.request_type||"loan";if(E==="insurance")T+=Number($.monthly_payment||0);else if(E==="loan"){const I=$.principal-($.total_paid||0),D=$.interest_rate/100/12;T+=Math.round(I*D)}else E==="bond"&&(T+=Number($.monthly_payment||0))}}else if(m==="Construction"){const{data:P}=await c.from("construction_contracts").select("id, budget_ceiling, timeline_ticks").eq("awarded_to_faction",a.id).eq("status","in_progress"),$=[];for(const E of P||[])T+=Math.round((E.budget_ceiling||0)/(E.timeline_ticks||1)),E.id&&$.push(E.id);if($.length>0){const{data:E}=await c.from("contract_bids").select("contract_id, estimated_cost").in("contract_id",$).eq("status","won"),I={};for(const D of E||[])I[D.contract_id]=Number(D.estimated_cost||0);for(const D of P||[]){const st=I[D.id]||0;x+=Math.round(st/Math.max(1,D.timeline_ticks||1))}}}else if(m==="Shipping"){const{data:P}=await c.from("shipping_claims").select("revenue_per_transit").eq("faction_id",a.id).eq("status","active");for(const $ of P||[])T+=Number($.revenue_per_transit||0)}}let v=[],V=0;try{const{data:m}=await c.from("corp_properties").select("id, nation_id, nations!nation_id(name)").eq("faction_id",a.id).eq("type","fuel_depot").eq("is_active",!0);if(m&&m.length>0){const P=m.map($=>$.nation_id).filter(Boolean);if(P.length>0){const{data:$}=await c.from("shipping_claims").select("faction_id, shipping_routes!inner(destination_nation_id, status)").eq("status","active").in("shipping_routes.destination_nation_id",P),E=[...new Set(($||[]).map(U=>U.faction_id).filter(U=>U&&U!==a.id))],I=new Set;if(E.length>0){const{data:U}=await c.from("corp_properties").select("faction_id, nation_id").in("faction_id",E).in("nation_id",P).eq("type","fuel_depot").eq("is_active",!0);for(const K of U||[])I.add(K.faction_id+"|"+K.nation_id)}const D={};for(const U of $||[]){const K=U.shipping_routes?.destination_nation_id;K&&U.faction_id!==a.id&&(I.has(U.faction_id+"|"+K)||(D[K]=(D[K]||0)+1))}const st=7500;for(const U of m){const K=D[U.nation_id]||0,qt=K*st;v.push({nation:U.nations?.name||"Unknown",revenue:qt,visitors:K}),V+=qt}v.sort((U,K)=>K.revenue-U.revenue)}}}catch(m){console.warn("Fuel depot revenue estimate failed (non-fatal):",m?.message||m)}const h=F+T+R+V,q=e?.totalWages||0,y=Math.round(q/12),X=0,J=i||0,Y=s||0,dt=Number(a?.corp_loans)||0,pt=.05,ft=dt>0?Math.round(dt*(pt/12)/(1-Math.pow(1+pt/12,-120))):0;let C=0,b=0;if(a?.id)try{const{data:m}=await c.from("finance_active_loans").select("monthly_payment, finance_loan_requests(request_type)").eq("borrower_faction_id",a.id).in("status",["current","late","delinquent"]);for(const P of m||[]){const $=P.finance_loan_requests?.request_type||"loan",E=Number(P.monthly_payment||0);if(!(E<=0))if($==="insurance")b+=E;else{if($==="bond")continue;C+=E}}}catch(m){console.warn("[Finances] borrower finance_active_loans lookup failed:",m)}const it=Math.round((r||0)/12),Z=n||0,lt=75e3,et=Math.max(0,Math.min(1,Number(t?.corporate_tax??0)/100||0)),ot=y+it+X+J+Y+Z+ft+C+b+x+lt,rt=Math.max(0,h-ot),at=Math.round(rt*et);let vt="";try{const m=new Set([a.nation_id]),{data:P}=await c.from("corp_properties").select("nation_id").eq("faction_id",a.id).eq("is_active",!0);if((P||[]).forEach($=>{$.nation_id&&m.add($.nation_id)}),m.size>0){const{data:$}=await c.from("nations").select("id, name, corporate_tax").in("id",[...m]);$&&$.length>0&&(vt=$.sort((E,I)=>(E.name||"").localeCompare(I.name||"")).map(E=>{const I=Math.round(Number(E.corporate_tax??0)),D=Math.round(rt*(I/100)/$.length),st=I>25?"#c55":I>15?"#ca5":"#5c5";return`<div style="display:flex;justify-content:space-between;padding:1px 0;font-family:var(--font-mono);font-size:8px;">
                        <span style="color:var(--text-dim);">${E.name} (<span style="color:${st}">${I}%</span>)</span>
                        <span style="color:#a44;">${f(D)}</span>
                    </div>`}).join(""))}}catch{}const gt=ot+at,tt=h-gt,Q=Number(a?.corp_cash_reserves??0),Ut=dt,Ht=[{stat:"gdp_growth",value:g("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:g("urbanization"),weight:"0.3"},{stat:"population_growth",value:g("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:g("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:g("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:g("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:g("interest_rates"),weight:"-0.1",neg:!0}];function Wt(m){return m.neg?m.value>50?"var(--red)":"var(--green)":m.note?m.value<50?"var(--green)":"var(--red)":m.value>=50?"var(--green)":m.value>=35?"var(--amber)":"var(--red)"}const ht=h||1,jt=(F/ht*100).toFixed(1),Vt=((T+V)/ht*100).toFixed(1),Gt=(R/ht*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${jt}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${Vt}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${Gt}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${f(F)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${f(T)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${f(R-M)}</span></div>
            ${M>0?`<div class="fin-row"><span class="fin-row__label">Property Revenue<span class="fin-row__badge">BUILDINGS</span></span><span class="fin-row__value" style="color:var(--green)">${f(M)}</span></div>`:""}
            ${v.map(m=>`<div class="fin-row"><span class="fin-row__label">Fuel Depot (${m.nation})<span class="fin-row__badge">${m.visitors} visitor${m.visitors!==1?"s":""}</span></span><span class="fin-row__value" style="color:var(--green)">${f(m.revenue)}</span></div>`).join("")}
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${f(h)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${f(y)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Executive Compensation</span><span class="fin-row__value" style="color:#a44">${f(it)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${f(X)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${f(J)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${f(Y)}</span></div>
            ${Z>0?`<div class="fin-row"><span class="fin-row__label">Fleet Maintenance</span><span class="fin-row__value" style="color:#a44">${f(Z)}</span></div>`:""}
            ${x>0?`<div class="fin-row"><span class="fin-row__label">Project Build Costs</span><span class="fin-row__value" style="color:#a44">${f(x)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${f(ft)}</span></div>
            ${C>0?`<div class="fin-row"><span class="fin-row__label">Loan Repayments</span><span class="fin-row__value" style="color:#a44">${f(C)}</span></div>`:""}
            ${b>0?`<div class="fin-row"><span class="fin-row__label">Insurance Premiums</span><span class="fin-row__value" style="color:#a44">${f(b)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${f(at)}</span></div>
            ${vt?`<div style="padding:2px 12px 6px 20px;border-bottom:1px solid var(--border-hair);">${vt}</div>`:""}
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${f(gt)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${tt>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${tt>=0?"var(--green)":"var(--red)"}">${f(tt)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${f(Q)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${f(Ut)}</div>
            </div>
        </div>
        <!-- Purchasing Power -->
        ${(()=>{const m=Number(t?.currency_strength??50),P=Number(t?.inflation??0),$=m/50,E=Math.max(.5,1-P/200),I=Math.round(Q*$*E),D=I>=Q?"var(--green)":I>=Q*.8?"var(--amber)":"var(--red)",st=Q>0?Math.round(I/Q*100):100;return`<div style="padding:4px 14px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-hair);">
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.5px;text-transform:uppercase;">Purchasing Power</div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${D};">${f(I)}</span>
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${st}% · CUR ${m} · INF ${Math.round(P)}</span>
                </div>
            </div>`})()}
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
            ${Ht.map(m=>`
                <div class="drv-row">
                    <span class="drv-row__name">${m.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${m.value}%;background:${Wt(m)}"></div></div>
                    <span class="drv-row__val">${m.value}</span>
                    <span class="drv-row__wt">&times;${m.weight}</span>
                    ${m.note?'<span class="drv-row__note">'+m.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${W.toFixed(2)}</span>
            </div>
        </div>
    `,Et()}let wt=!1;async function te(t,o){if(!(!p||wt)){wt=!0;try{const{data:e,error:a}=await c.from("finance_loan_offers").select("*").eq("id",t).single();if(a||!e)return;const{data:i,error:s}=await c.from("finance_loan_requests").select("*").eq("id",o).single();if(s||!i||i.status!=="open")return;const r=e.interest_rate/100/12,l=i.term_months,n=r>0?Math.round(i.amount*r/(1-Math.pow(1+r,-l))):Math.round(i.amount/l),d=G?.current_tick||0,{error:u}=await c.from("finance_loan_requests").update({status:"funded",accepted_offer_id:t,funded_tick:d}).eq("id",o);if(u)return;await c.from("finance_loan_offers").update({status:"accepted"}).eq("id",t),await c.from("finance_loan_offers").update({status:"declined"}).eq("request_id",o).neq("id",t).eq("status","pending"),await c.from("finance_active_loans").insert({request_id:o,offer_id:t,borrower_faction_id:i.requesting_faction_id,lender_faction_id:e.offering_faction_id,nation_id:i.nation_id,principal:i.amount,interest_rate:e.interest_rate,term_months:i.term_months,collateral_type:e.collateral_type,purpose:i.purpose,monthly_payment:n,started_tick:d});const{data:g}=await c.from("factions").select("corp_cash_reserves").eq("id",e.offering_faction_id).single();g&&await c.from("factions").update({corp_cash_reserves:Math.max(0,(Number(g.corp_cash_reserves)||0)-i.amount)}).eq("id",e.offering_faction_id);const{data:k}=await c.from("factions").select("corp_cash_reserves, corp_debt").eq("id",i.requesting_faction_id).single();if(k){const{error:L}=await c.from("factions").update({corp_cash_reserves:(Number(k.corp_cash_reserves)||0)+i.amount,corp_debt:(Number(k.corp_debt)||0)+i.amount}).eq("id",i.requesting_faction_id);L&&console.error("[Loans] Failed to credit borrower + track debt:",L.message)}}finally{wt=!1}Et()}}async function ee(t){await c.from("finance_loan_requests").update({status:"cancelled"}).eq("id",t),Et()}async function Et(){if(!p)return;const t=document.getElementById("fin-loans-list");if(t)try{const{data:o,error:e}=await c.from("finance_loan_requests").select("*, finance_loan_offers!request_id(*)").eq("requesting_faction_id",p.id).in("status",["open","funded"]).order("created_tick",{ascending:!1});e&&console.error("[Loans] Request query error:",e.message);const{data:a,error:i}=await c.from("finance_active_loans").select("*").eq("borrower_faction_id",p.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1});i&&console.error("[Loans] Active loans query error:",i.message);let s="";if(o&&o.length>0){for(const r of o)if(r.status==="open"){const l=(r.finance_loan_offers||[]).filter(n=>n.status==="pending");if(s+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span style="color:#5a8aaa;font-weight:700;">OPEN</span>
                            <span style="color:var(--text-primary);margin-left:4px;">${f(r.amount)}</span>
                            <span style="color:var(--text-dim);margin-left:4px;">${r.term_months}mo</span>
                        </div>
                        <span style="color:var(--text-dim);cursor:pointer;" onclick="cancelRequest('${r.id}')">&#10005;</span>
                    </div>
                    <div style="font-size:7px;color:var(--text-dim);margin-top:2px;">${_(r.purpose||"")}</div>`,l.length>0){s+=`<div style="margin-top:4px;font-size:7px;color:#5a8aaa;font-weight:700;">${l.length} OFFER${l.length>1?"S":""}</div>`;for(const n of l.sort((d,u)=>d.interest_rate-u.interest_rate))s+=`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-top:1px solid var(--border-hair);">
                            <span style="color:var(--text-primary);font-weight:700;">${n.interest_rate}%</span>
                            <span style="color:var(--text-dim);">${n.collateral_type}</span>
                            <span style="flex:1;"></span>
                            <span style="padding:2px 8px;cursor:pointer;color:#000;background:#5a8aaa;font-weight:700;font-size:7px;" onclick="acceptOffer('${n.id}','${r.id}')">ACCEPT</span>
                        </div>`}else s+='<div style="margin-top:2px;font-size:7px;color:var(--text-dim);">Awaiting offers from finance corporations...</div>';s+="</div>"}}if(a&&a.length>0)for(const r of a){const l=r.status==="current"?"var(--green)":r.status==="late"?"#c84":"#c55",n=r.term_months>0?Math.round(r.payments_made/r.term_months*100):0;s+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="color:${l};font-weight:700;">${r.status.toUpperCase()}</span>
                        <span style="color:var(--text-primary);margin-left:4px;">${f(r.principal)}</span>
                        <span style="color:var(--text-dim);margin-left:4px;">@ ${r.interest_rate}%</span>
                    </div>
                    <span style="color:var(--text-dim);">${n}% repaid</span>
                </div>
                <div style="height:2px;background:var(--border-0);margin-top:3px;">
                    <div style="height:100%;width:${n}%;background:${l};"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Payment: ${f(r.monthly_payment)}/mo</span>
                    <span>${r.payments_made}/${r.term_months} payments</span>
                </div>
            </div>`}s||(s='<div style="color:var(--text-dim);">No active loans.</div>'),t.innerHTML=s}catch(o){console.error("[Loans] loadLoansSection error:",o)}}window.acceptOffer=te;window.cancelRequest=ee;function oe(t,o){const e=(t||"").toUpperCase(),a=Number(o.corp_general_workforce??0)+Number(o.corp_skilled_workforce??0)+Number(o.corp_innovative_workforce??0),i=[{label:"Reputation",value:Number(o.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:a||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(o.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(o.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(o.corp_market_share??5),change:0,nation:e,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(o.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(o.corp_regulatory_standing??50),change:0,nation:e,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(o.corp_political_influence??10),change:0,decay:!0,nation:e,max:100},{label:"Innovation",value:Number(o.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function s(n,d){if(!d||d>100)return"var(--text-primary)";const u=n/d*100;return u>=70?"var(--green)":u>=40?"var(--amber)":u>=20?"var(--orange, #d48a3c)":"var(--red)"}function r(n){const d=parseFloat(n),u=d>0?"var(--green)":d<0?"var(--red)":"var(--text-dim)",g=d>0?"▲":d<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${u}">${g}</span>
            <span class="stat-item__delta" style="color:${u}">${Math.abs(d).toFixed(1)}</span>
        </div>`}let l="";for(const n of i){if(n.isHero){l+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${n.label}</span>
                            ${n.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${Math.round(n.value)}</span>
                            <span class="stats-hero__max">/100</span>
                            ${r(n.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${Math.min(100,n.value)}%"></div></div>
                </div>`;continue}n.section&&(l+=`<div class="stats-section"><span class="stats-section__label">${n.section}</span></div>`);const d=n.max&&n.max<=100;l+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${n.label}</span>
                        ${n.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${n.nation?'<span class="stat-item__nation">'+_(n.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${d?s(n.value,n.max):"var(--text-primary)"}">${typeof n.value=="number"?d?Math.round(n.value):n.value.toLocaleString():n.value}</span>
                    ${d?'<span class="stat-item__max">/100</span>':""}
                    ${r(n.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=l}async function Mt(t,o,e,a){const i=(o||"UNKNOWN").toUpperCase();let s=[];if(e?.id){const{data:x}=await c.from("corp_properties").select("*").eq("faction_id",e.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});s=x||[]}const r={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,n=0;const d=Number(e?.corp_general_workforce??0)+Number(e?.corp_skilled_workforce??0)+Number(e?.corp_innovative_workforce??0),u=500,g=s.map(x=>{const v=Number(x.capacity||0),V=Number(x.condition||0)/100;return Math.floor(v*V)}),k=u+g.reduce((x,v)=>x+v,0),L=k>0?Math.min(d,Math.round(d*(u/k))):d,O=5e7,z=1+(ct(t,"inflation")-50)/100*.3,A=.8+ct(t,"stability")/100*.4,H=Math.round(O*z*A),S=Math.round(H*.005);l+=H,n+=S;let W=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${_(i)} · Headquarters</div>
            </div>
            <span class="prop-asset__badge">HQ</span>
        </div>
        <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${u}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${L.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${f(H)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${f(S)}</div>
            </div>
        </div>
    </div>`,j=L;for(let x=0;x<s.length;x++){const v=s[x],V=r[v.style]||r.Basic;l+=Number(v.purchase_price||0),n+=Number(v.monthly_maintenance||0);const h=v.condition>=75?"var(--green)":v.condition>=50?"var(--amber)":"var(--orange)",q=Number(v.capacity||0),y=g[x]||0,X=k>0?Math.min(d-j,Math.round(d*(y/k))):0;j+=X,W+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${_(v.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${_(v.city||i)} · ${(v.type||"").replace(/_/g," ")} · <span style="color:${V.color}">${(v.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge" ${["branch_office","trading_floor","claims_office"].includes(v.type)?'style="background:rgba(138,106,170,0.12);color:#8a6aaa;border-color:rgba(138,106,170,0.3);"':""}>${["branch_office","trading_floor","claims_office"].includes(v.type)?v.type.replace(/_/g," ").replace(/\b\w/g,J=>J.toUpperCase()):"OWNED"}</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${q.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${X.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${f(v.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${f(v.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${h}">${v.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${v.condition}%;height:100%;background:${h};"></div></div>
            ${v.refurbish_until_tick&&v.refurbish_until_tick>(a?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${v.refurbish_until_tick-(a?.current_tick||0)} tick${v.refurbish_until_tick-(a?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${v.id}','${_(v.name).replace(/'/g,"\\'")}',${v.purchase_price||0},${v.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${v.id}','${_(v.name).replace(/'/g,"\\'")}',${v.condition},${q})">REFURBISH</button>
                ${e?.corp_sector==="Finance"&&(v.type==="office"||v.type==="regional_hq")&&!["branch_office","trading_floor","claims_office"].includes(v.type)?`<button class="prop-action-btn" style="background:rgba(138,106,170,0.08);border-color:rgba(138,106,170,0.2);color:#8a6aaa;" onclick="showConvertModal('${v.id}','${_(v.name).replace(/'/g,"\\'")}',${v.purchase_price||0})">CONVERT</button>`:""}
            </div>`}
        </div>`}let w="",N=[];if(e?.id){const{data:x}=await c.from("construction_contracts").select("*, contract_bids(id, faction_id, bid_price, estimated_quality, estimated_cost, labor_count, markup_pct, material_grades, submitted_at_tick, status, factions!faction_id(faction_name, abbreviation, corp_reputation))").eq("issuer_faction_id",e.id).in("status",["open","bidding","awarded","in_progress"]).order("generated_at_tick",{ascending:!1});N=x||[];let v={};const V=N.filter(h=>h.status==="in_progress").map(h=>h.id);if(V.length>0){const{data:h}=await c.from("construction_events").select("contract_id, status, severity, title").in("contract_id",V).eq("status","ACTIVE");for(const q of h||[])v[q.contract_id]||(v[q.contract_id]=[]),v[q.contract_id].push(q)}if(N.length>0){const h={open:{label:"OPEN",color:"#5a8aaa"},bidding:{label:"BIDDING",color:"#c8a832"},awarded:{label:"AWARDED",color:"#8b9a6b"},in_progress:{label:"IN PROGRESS",color:"#5aaa8b"}},q={LOW:"#ca5",MODERATE:"#c84",HIGH:"#c55",CRITICAL:"#f44"};w=`<div class="cp-section">
                <div class="cp-section__header">
                    <span class="cp-section__title">Construction Projects</span>
                    <span class="cp-section__count">${N.length} ACTIVE</span>
                </div>`;for(const y of N){const X=h[y.status]||h.open,J=(y.contract_bids||[]).filter(C=>C.status==="pending"),Y=(y.contract_bids||[]).find(C=>C.status==="won"),dt=a?.current_tick||0,pt=v[y.id]||[],ft=y.nation_id===e.nation_id?i:"";if(w+=`<div class="cp-item">
                    <div class="cp-item__top">
                        <div>
                            <div class="cp-item__name">${_(y.name)}</div>
                            <div class="cp-item__sub">${_(y.project_code||"")} · ${_(y.sector||"")}${ft?" · "+_(ft):""}</div>
                        </div>
                        <span class="cp-badge" style="color:${X.color};border-color:${X.color}40;background:${X.color}08;">${X.label}</span>
                    </div>
                    <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:2px 0;">
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BUDGET</div>
                            <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${f(y.budget_ceiling||0)}</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">TIMELINE</div>
                            <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${y.timeline_ticks||"?"} ticks</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDS</div>
                            <div style="font-size:10px;font-weight:700;color:${J.length>0?"var(--amber)":"var(--text-dim)"};font-family:var(--font-mono);">${(y.contract_bids||[]).length}</div>
                        </div>
                    </div>`,(y.status==="awarded"||y.status==="in_progress")&&Y){const C=Number(Y.factions?.corp_reputation??50),b=C>=70?"#5c5":C>=40?"#ca5":"#c55",it=Y.estimated_quality>=75?"#5c5":Y.estimated_quality>=50?"#ca5":"#c55";if(w+=`<div style="margin-top:6px;padding:6px 8px;background:var(--bg-3);border:1px solid var(--border-hair);">
                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.8px;margin-bottom:3px;">CONTRACTOR</div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-bright);margin-bottom:4px;">${_(Y.factions?.faction_name||"Unknown")}</div>
                        <div style="display:flex;gap:0;">
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID</div>
                                <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${f(Y.bid_price)}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                <div style="font-size:9px;font-weight:700;color:${it};font-family:var(--font-mono);">${Y.estimated_quality}/100</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${Y.labor_count}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                <div style="font-size:9px;font-weight:700;color:${b};font-family:var(--font-mono);">${C}/100</div>
                            </div>
                        </div>`,y.status==="in_progress"&&y.awarded_at_tick!=null){const Z=dt-y.awarded_at_tick,lt=y.timeline_ticks||1,et=y.stalled_ticks||0,ot=Math.min(100,Math.round(Z/(lt+et)*100)),rt=ot>=75?"#5c5":ot>=40?"#ca5":"#5aaa8b",at=Math.max(0,lt+et-Z);w+=`<div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);margin-top:6px;">
                            <span style="color:var(--text-dim);">PROGRESS</span>
                            <span style="color:${rt};">${ot}%${et>0?" · "+et+" stalled":""} · ${at} tick${at!==1?"s":""} left</span>
                        </div>
                        <div class="cp-progress"><div class="cp-progress__bar" style="width:${ot}%;background:${rt};"></div></div>`}else w+='<div style="font-size:8px;font-family:var(--font-mono);color:var(--amber);margin-top:6px;text-align:center;">Awarded — construction begins next tick</div>';w+="</div>"}if(pt.length>0)for(const C of pt){const b=q[C.severity]||"#ca5";w+=`<div style="display:flex;align-items:center;gap:5px;margin-top:4px;padding:3px 6px;background:${b}08;border:1px solid ${b}20;">
                            <span class="cp-badge" style="color:${b};border-color:${b}40;background:${b}12;">${C.severity}</span>
                            <span style="font-size:8px;font-family:var(--font-mono);color:${b};">${_(C.title)}</span>
                        </div>`}if((y.status==="open"||y.status==="bidding")&&J.length>0)for(let C=0;C<J.length;C++){const b=J[C],it=y.id.slice(0,8)+"-"+C,Z=Number(b.factions?.corp_reputation??50),lt=Z>=70?"#5c5":Z>=40?"#ca5":"#c55",et=b.estimated_quality>=75?"#5c5":b.estimated_quality>=50?"#ca5":"#c55",ot=b.markup_pct<=10?"#5c5":b.markup_pct<=20?"#ca5":"#c55",rt=b.material_grades||{},at=Object.entries(rt),vt=tt=>tt.replace(/_/g," ").replace(/\b\w/g,Q=>Q.toUpperCase()),gt=tt=>tt==="HIGH"?"#5c5":tt==="LOW"?"#c55":"var(--text-muted)";w+=`<div class="cp-bid" style="flex-direction:column;gap:0;padding:0;cursor:pointer;" onclick="cpToggleBid('${it}')">
                            <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;">
                                <span style="flex:1;font-size:8px;font-family:var(--font-mono);color:var(--text-muted);">
                                    ${_(b.factions?.faction_name||"Unknown")}
                                    · <span style="color:var(--gold);">${f(b.bid_price)}</span>
                                    · Q: <span style="color:${et};">${b.estimated_quality}</span>
                                </span>
                                <span class="cp-bid__btn" style="color:#5c5;border-color:#5c540;background:#5c508;" onclick="event.stopPropagation();cpAcceptBid('${y.id}','${b.id}','${_((b.factions?.faction_name||"").replace(/'/g,""))}',${b.bid_price},${b.estimated_quality},${b.labor_count},'${b.faction_id}')">ACCEPT</span>
                            </div>
                            <div id="cp-bid-${it}" style="display:none;padding:4px 8px 6px;border-top:1px solid var(--border-hair);background: var(--border-hair);">
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID PRICE</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${f(b.bid_price)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">EST. COST</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${f(b.estimated_cost||0)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MARKUP</div>
                                        <div style="font-size:9px;font-weight:700;color:${ot};font-family:var(--font-mono);">${b.markup_pct}%</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                        <div style="font-size:9px;font-weight:700;color:${et};font-family:var(--font-mono);">${b.estimated_quality}/100</div>
                                    </div>
                                </div>
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${b.labor_count}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                        <div style="font-size:9px;font-weight:700;color:${lt};font-family:var(--font-mono);">${Z}/100</div>
                                    </div>
                                    <div style="flex:2;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDDER</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${_(b.factions?.faction_name||"Unknown")}</div>
                                    </div>
                                </div>
                                ${at.length>0?`<div style="padding:2px 4px;">
                                    <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;margin-bottom:2px;">MATERIAL GRADES</div>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                        ${at.map(([tt,Q])=>`<span style="font-size:7px;font-family:var(--font-mono);color:${gt(Q)};">${vt(tt)}: ${Q}</span>`).join("")}
                                    </div>
                                </div>`:""}
                            </div>
                        </div>`}if((y.status==="open"||y.status==="bidding")&&J.length===0){const C=(y.bidding_ends_tick||0)-(a?.current_tick||0);w+=`<div style="font-size:8px;font-family:var(--font-mono);color:var(--text-dim);margin-top:4px;text-align:center;">
                        Awaiting bids${C>0?" · "+C+" tick"+(C!==1?"s":"")+" remaining":""}
                    </div>`}w+="</div>"}w+="</div>"}}const B=document.getElementById("prop-count"),M=s.length+1,R=N.length,F=M+" ASSET"+(M!==1?"S":"")+(R>0?" · "+R+" PROJECT"+(R!==1?"S":""):"");B&&(B.textContent=F),document.getElementById("prop-body").innerHTML=`
        ${W}
        ${w}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${f(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${f(n)}/mo</span>
            </div>
        </div>
    `;let T=0;T+=Math.round(u*50);for(const x of s){if(x.refurbish_until_tick&&(a?.current_tick||0)<x.refurbish_until_tick)continue;const v=Number(x.condition||0)/100;v>=.6&&(T+=Math.round(Number(x.capacity||0)*v*50))}return{propertyValue:l,propertyMaintenance:n,totalCapacity:k,propertyRevBonus:T}}async function ne(t,o,e,a,i){(o||"UNKNOWN").toUpperCase();const s=e.corp_company_type||"Private",r=Number(e.corp_cash_reserves)||0,l=i?.propertyValue||0,n=0;let d=0;if(e?.id&&e.corp_sector==="Finance")try{const{data:N}=await c.from("finance_active_loans").select("principal, total_paid, finance_loan_requests(request_type)").eq("lender_faction_id",e.id).in("status",["current","late","delinquent"]);for(const B of N||[]){const M=B.finance_loan_requests?.request_type||"loan";if(M==="loan"||M==="bond"){const R=Math.max(0,Number(B.principal||0)-Number(B.total_paid||0));d+=R}}}catch(N){console.warn("[Valuation] finance_active_loans lookup failed:",N)}const u=r+l+n+d,g=Number(e.corp_loans)||0,L=a?.monthlyWages||0,O=0,z=g+L+O,A=u-z,S=Math.round(A*(1+.3)),W=S-A,j=W>0;document.getElementById("val-type-badge").textContent=s.toUpperCase();function w(N,B,M={}){const R=M.indent?"val-line val-line--indent":"val-line",F=M.bold?"val-line__label val-line__label--bold":"val-line__label",T=M.bold?"val-line__value val-line__value--bold":"val-line__value",x=M.color||(M.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${R}"><span class="${F}">${N}</span><span class="${T}" style="color:${x}">${f(B)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${w("Cash & Reserves",r,{indent:!0})}
        ${w("Property",l,{indent:!0})}
        ${w("Equipment",n,{indent:!0})}
        ${w("Active Contracts",d,{indent:!0})}
        ${w("Total Assets",u,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${w("Outstanding Loans",g,{indent:!0})}
        ${w("Accounts Payable",L,{indent:!0})}
        ${w("Pending Project Costs",O,{indent:!0})}
        ${w("Total Liabilities",z,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${A>=0?"var(--green)":"var(--red)"};">${f(A)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${f(S)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${j?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${j?"var(--green)":"var(--red)"};">${j?"+":""}${f(W)}</span>
            </div>
            <div class="val-market__note">${j?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}async function ae(){const t=document.getElementById("slogan-input"),o=document.getElementById("slogan-hint"),e=document.getElementById("slogan-save-btn"),a=(t.value||"").trim().slice(0,60);if(a.length===0){o.textContent="Slogan cannot be empty.",o.className="slogan-hint slogan-hint--error";return}e.disabled=!0,e.textContent="...",o.textContent="";try{const{error:i}=await c.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(i)throw i;document.getElementById("id-slogan").textContent='"'+a+'"',o.textContent="Slogan saved! Next change in 120 ticks.",o.className="slogan-hint slogan-hint--ok",e.textContent="Save"}catch(i){console.error("Slogan save failed:",i),o.textContent="Failed to save slogan.",o.className="slogan-hint slogan-hint--error",e.disabled=!1,e.textContent="Save"}}async function ie(){await c.auth.signOut(),window.location.href="login.html"}function re(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function se(t,o){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),o==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",t=>{const o=document.getElementById("faction-switcher"),e=document.getElementById("corp-faction-dropdown");e&&o&&!o.contains(t.target)&&e.classList.remove("open")});window.doLogout=ie;async function le(t){const o=t.target.files?.[0];if(!o)return;if(o.size>128*1024){alert("Logo must be under 128KB.");return}const e=window._corpFactionId;if(!e)return;const a=document.getElementById("corp-logo-label");a&&(a.textContent="Uploading...");try{const i=o.name.split(".").pop()||"png",s=`party-logos/${e}/${Date.now()}.${i}`,{error:r}=await c.storage.from("public-assets").upload(s,o,{contentType:o.type,upsert:!0});if(r)throw r;const{data:l}=c.storage.from("public-assets").getPublicUrl(s),n=l?.publicUrl||null;await c.from("factions").update({custom_logo_url:n}).eq("id",e);const d=document.getElementById("id-logo");d&&(d.innerHTML=`<img src="${n}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`);const u=document.getElementById("corp-logo");u&&(u.innerHTML=`<img src="${n}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`),a&&(a.textContent="Change Logo")}catch(i){console.error("Logo upload failed:",i),alert("Upload failed: "+(i.message||"Unknown error")),a&&(a.textContent="Upload Logo")}}window.saveSlogan=ae;window.toggleCorpDropdown=re;window.switchToFaction=se;let yt=!1;function ce(t,o,e,a){if(yt)return;const i=window._nationStats,r=1+(ct(i,"inflation")-50)/100*.3,l=Math.max(.1,a/100),n=Math.round(e*r*l),d=document.getElementById("prop-modal-overlay"),u=document.getElementById("prop-modal-content");u.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${_(o)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${f(e)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Inflation Modifier</span>
                <span style="color:var(--amber, #b09a5b);">${r.toFixed(3)}x</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Condition</span>
                <span style="color:${a>=75?"var(--green)":a>=50?"var(--amber)":"var(--red)"};">${a}%</span>
            </div>
            <div style="border-top:1px solid var(--border-hair);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-mono);font-weight:700;">
                <span style="color:var(--text-primary);">Sale Price</span>
                <span style="color:var(--gold, #c8a832);">${f(n)}</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-sell-confirm" onclick="confirmSellProperty('${t}', ${n})">Confirm Sale</button>
        </div>
    `,d.style.display="flex"}async function de(t,o){if(yt)return;yt=!0;const e=document.getElementById("prop-sell-confirm");e&&(e.disabled=!0,e.textContent="Selling...");try{const a=window._corpFactionId;if(!a)throw new Error("No faction");const{error:i}=await c.from("corp_properties").update({is_active:!1}).eq("id",t).eq("faction_id",a);if(i)throw new Error("Failed to sell property: "+i.message);const{data:s}=await c.from("factions").select("corp_cash_reserves").eq("id",a).single(),r=Number(s?.corp_cash_reserves??0),{error:l}=await c.from("factions").update({corp_cash_reserves:r+o}).eq("id",a);l&&console.error("[Property] Failed to credit cash:",l.message),xt(),alert("Property sold for "+f(o)+". Cash credited."),location.reload()}catch(a){alert("Sale failed: "+a.message)}finally{yt=!1,e&&(e.disabled=!1,e.textContent="Confirm Sale")}}let bt=!1;function pe(t,o,e,a){if(bt)return;const i=window._nationStats,s=window._factionData,l=1+(ct(i,"inflation")-50)/100*.3,n=Math.round(2e6*(a/1e3)),d=Math.round(n*l),u=Math.max(50,Math.round(a*.1)),g=Number(s?.corp_general_workforce??0),k=g>=u,O=Number(s?.corp_cash_reserves??0)>=d,z=document.getElementById("prop-modal-overlay"),A=document.getElementById("prop-modal-content"),H=k&&O&&e<100;let S="";e>=100?S='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property is already at 100% condition.</div>':O?k||(S='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient general workforce (need '+u.toLocaleString()+", have "+g.toLocaleString()+").</div>"):S='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>',A.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${_(o)} — Current Condition: ${e}%</div>
        ${S}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost</span>
                <span style="color:${O?"var(--gold, #c8a832)":"var(--red)"};">${f(d)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Workforce Required</span>
                <span style="color:${k?"var(--blue)":"var(--red)"};">${u.toLocaleString()} General</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Duration</span>
                <span style="color:var(--amber, #b09a5b);">1–6 ticks</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">Outcome</span>
                <span style="color:var(--green);">Condition → 94–100%</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${t}', ${d}, ${u})" ${H?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,z.style.display="flex"}async function fe(t,o,e){if(bt)return;bt=!0;const a=document.getElementById("prop-refurb-confirm");a&&(a.disabled=!0,a.textContent="Starting...");try{const i=window._corpFactionId,s=window._currentTick;if(!i)throw new Error("No faction");const r=Math.floor(Math.random()*6)+1,n=94+(Math.floor(Math.random()*6)+1),d=s+r,{data:u}=await c.from("factions").select("corp_cash_reserves").eq("id",i).single(),g=Number(u?.corp_cash_reserves??0);if(g<o)throw new Error("Insufficient cash");const{error:k}=await c.from("factions").update({corp_cash_reserves:g-o}).eq("id",i);if(k)throw new Error("Failed to deduct cost: "+k.message);const{error:L}=await c.from("corp_properties").update({refurbish_until_tick:d,refurbish_condition:n}).eq("id",t).eq("faction_id",i);if(L)throw new Error("Failed to start refurbishment: "+L.message);xt(),alert("Refurbishment started! Duration: "+r+" tick"+(r!==1?"s":"")+". Condition will be restored to "+Math.min(100,n)+"% when complete."),location.reload()}catch(i){alert("Refurbishment failed: "+i.message)}finally{bt=!1,a&&(a.disabled=!1,a.textContent="Begin Refurbishment")}}function xt(){const t=document.getElementById("prop-modal-overlay");t&&(t.style.display="none")}window.showSellModal=ce;window.confirmSellProperty=de;window.showRefurbishModal=pe;window.confirmRefurbish=fe;window.closePropModal=xt;window.showConvertModal=me;window.confirmConvertProperty=ue;let $t=!1;async function ve(t,o,e,a,i,s,r){if(!$t&&confirm("Accept bid from "+e+`?

Bid Price: `+f(a)+`
Quality: `+i+`/100
Workers: `+s+`

This will award the contract. The project begins immediately.`)){$t=!0;try{const{data:l}=await c.from("shard").select("current_tick").eq("name","Alpha Shard").single(),n=l?.current_tick||0,{error:d}=await c.from("contract_bids").update({status:"won"}).eq("id",o);if(d)throw d;const{error:u}=await c.from("contract_bids").update({status:"lost"}).eq("contract_id",t).neq("id",o);if(u)throw u;const{error:g}=await c.from("construction_contracts").update({status:"awarded",awarded_to_faction:r,awarded_at_tick:n}).eq("id",t);if(g)throw g;alert("Contract awarded to "+e+`!

Bid: `+f(a)+`
Project begins immediately.`),window._nationStats&&window._factionData&&G&&await Mt(window._nationStats,window._nationStats?.name||"",window._factionData,G)}catch(l){alert("Failed to accept bid: "+(l.message||l))}finally{$t=!1}}}window.cpAcceptBid=ve;function _e(t){const o=document.getElementById("cp-bid-"+t);o&&(o.style.display=o.style.display==="none"?"":"none")}window.cpToggleBid=_e;let kt="branch_office";function me(t,o,e){const a=(p?.corp_subsector||"").toLowerCase(),i=a==="banking"?[["branch_office","Branch Office"]]:a==="investment"?[["trading_floor","Trading Floor"]]:a==="insurance"?[["claims_office","Claims Office"]]:[];if(i.length===0)return;kt=i[0][0];const s=Math.round(e*.15),r=Math.floor(Math.random()*6)+4,l=document.getElementById("prop-modal-overlay"),n=document.getElementById("prop-modal-content");n.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Convert Property</div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:10px;">${_(o)}</div>
        <div style="display:flex;gap:4px;margin-bottom:10px;">
            ${i.map(([d,u])=>`<span onclick="_convertTargetType='${d}';document.querySelectorAll('.conv-opt').forEach(e=>e.style.background='transparent');this.style.background='rgba(138,106,170,0.15)'" class="conv-opt" style="flex:1;text-align:center;padding:6px;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(138,106,170,0.3);color:#8a6aaa;${d===kt?"background:rgba(138,106,170,0.15)":""}">${u}</span>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Cost</span>
            <span style="color:var(--gold);">${f(s)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Time</span>
            <span style="color:var(--text-bright);">${r} ticks</span>
        </div>
        <div style="font-size:8px;color:var(--text-dim);margin:8px 0;font-family:var(--font-mono);line-height:1.5;">Property will be offline during conversion. No revenue or workforce allocation until complete.</div>
        <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button class="prop-action-btn prop-action-btn--sell" onclick="closePropModal()">Cancel</button>
            <button class="prop-action-btn" style="background:rgba(138,106,170,0.12);border-color:rgba(138,106,170,0.3);color:#8a6aaa;" onclick="confirmConvertProperty('${t}',${s},${r})">Convert</button>
        </div>
    `,l.style.display="flex"}async function ue(t,o,e){const a=Number(p?.corp_cash_reserves??0);if(a<o){alert("Insufficient cash. Need "+f(o)+".");return}const i=G?.current_tick||0;try{await c.from("factions").update({corp_cash_reserves:Math.max(0,a-o)}).eq("id",p.id),p.corp_cash_reserves=Math.max(0,a-o),await c.from("corp_properties").update({type:kt,refurbish_until_tick:i+e,condition:100}).eq("id",t),xt();const s=window._nationStats;await Mt(s,s?.name||p?.nation,p,G)}catch(s){alert("Conversion failed: "+s.message)}}const Nt={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},It={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},ge={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let mt="nation",ut="local",nt=null;function ye(t){return t?t.replace(/_/g," ").replace(/\b\w/g,o=>o.toUpperCase()):""}function Tt(t,o){if(!t)return"<em>Unknown</em>";const e=_(t);return o?`<span style="color:${o.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${e}</span>`:`<strong>${e}</strong>`}function St(t,o,e){const a=t.factions?.nation_id===(t.nation_id||o),i=t.proposer_name||(a?t.factions?.faction_name:null)||"A former party",s=t.proposer_color||(a?t.factions?.party_color:null);return{fired_at_tick:t.proposed_tick,event_name:t.bill_name,_desc_html:`${Tt(i,s)} proposed "${_(t.bill_name)}"`,category:"bill",_synthetic:!0,...e}}function Rt(t,o){const e=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:null,a=e?` led by <strong>${_(e)}</strong>`:"";return{fired_at_tick:0,event_name:t.faction_name,_desc_html:`${Tt(t.faction_name,t.party_color)} founded${a}`,category:"new_party",_synthetic:!0,_created_at:t.created_at,...o}}function Pt(t,o){const e=ge[t.tier]||`Tier ${t.tier}`,a=t.demand_label?` demanding "${_(t.demand_label)}"`:"",i=t.status==="crisis_active",s=t.tier>=6?"#e74c3c":t.tier>=4?"#f39c12":"",r=s?`<span style="color:${s};font-weight:600">${_(e)}</span>`:`<strong>${_(e)}</strong>`;return{fired_at_tick:t.tick_resolved||t.tick_called,event_name:e,_desc_html:`${Tt(t.factions?.faction_name,t.factions?.party_color)} organised a protest${a} — ${r}${i?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...o}}function zt(t,o,e,a,i){return[...t.map(s=>({...s,_synthetic:!1})),...o,...e,...a].sort((s,r)=>{const l=(r.fired_at_tick||0)-(s.fired_at_tick||0);if(l!==0)return l;const n=s._created_at||s.created_at||"",d=r._created_at||r.created_at||"";return d>n?1:d<n?-1:0}).slice(0,i)}function Bt(t){if(t._synthetic&&t._desc_html)return t._desc_html;const o=t.description_chosen||t.description_used||"",e=ye(t.event_name),a=e?`<strong>${_(e)}</strong>`:"",i=o?_(o):"";return a&&i?`${a} — ${i}`:i||a||"Event"}function At(t){return t.map(o=>{const e=Ct(o.fired_at_tick),a=Nt[(o.category||"").toLowerCase()]||It;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${_(e)}</span>
            <span class="corp-ev-icon" style="color:${a.color}">${a.icon}</span>
            <span class="corp-ev-text">${Bt(o)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}const Lt=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function be(t){let o=0;for(let e=0;e<t.length;e++)o=(o<<5)-o+t.charCodeAt(e)|0;return Lt[Math.abs(o)%Lt.length]}function Ot(t){return t.map(o=>{const e=Ct(o.fired_at_tick),a=Nt[(o.category||"").toLowerCase()]||It,i=o.nations?.name||"Unknown",s=o.nations?.nation_profiles,r=Array.isArray(s)?s[0]?.flag_url:s?.flag_url,l=be(i),n=r?`<img src="${_(r)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${_(e)}</span>
                <span class="corp-ev-nation-badge" style="color:${l.color};background:${l.bg};border-color:${l.border};">${n}${_(i)}</span>
            </span>
            <span class="corp-ev-text">${Bt(o)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}async function xe(){const t=document.getElementById("corp-events-list");if(!t||!nt)return;const{nationId:o}=nt;if(!o){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[e,a]=await Promise.all([c.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").eq("nation_id",o).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),c.from("event_log").select("*").eq("nation_id",o).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=e.data||[],s=a.data||[],r=i.map(n=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${n.faction_name} [${n.corp_ticker||n.abbreviation||"??"}] was founded with a specialty in ${n.corp_subsector||n.corp_sector||"General"}. Led by CEO ${[n.leader_first_name,n.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:n.founded_tick||0})),l=[...s,...r].sort((n,d)=>(d.fired_at_tick||0)-(n.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events in this nation yet.</div>';return}t.innerHTML=At(l)}catch(e){console.error("Corp local events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function he(){const t=document.getElementById("corp-events-list");if(!t||!nt)return;const{nationId:o}=nt;if(!o){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[e,a]=await Promise.all([c.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",o).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),c.from("event_log").select("*, nations(name, nation_profiles(flag_url))").neq("nation_id",o).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=e.data||[],s=a.data||[],r=i.map(n=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${n.faction_name} [${n.corp_ticker||n.abbreviation||"??"}] was founded in ${n.nation||"Unknown"} with a specialty in ${n.corp_subsector||n.corp_sector||"General"}. Led by CEO ${[n.leader_first_name,n.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:n.founded_tick||0,nations:{name:n.nation||"Unknown"}})),l=[...s,...r].sort((n,d)=>(d.fired_at_tick||0)-(n.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=Ot(l);return}catch(e){console.error("Corp world events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>';return}try{const{data:e,error:a}=await c.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",o).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(a)throw a;if(!e||e.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=we(e,!0)}catch(e){console.error("Corp world events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function we(t,o){return t.map(e=>{const a=[e.leader_first_name,e.leader_last_name].filter(Boolean).join(" ")||"Unknown",i=e.nation||"Unknown",s=e.corp_subsector||e.corp_sector||"General",r=e.corp_ticker||e.abbreviation||"",l=e.founded_tick?Ct(e.founded_tick):"";let n='<div class="corp-event-row">';return n+='<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--teal);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);padding:1px 5px;display:inline-block;margin-bottom:2px;">'+_(i.toUpperCase())+"</div>",n+='<div style="font-size:11px;color:var(--text-primary);line-height:1.5;">',n+='<span style="font-weight:600;">'+_(e.faction_name)+"</span>",r&&(n+=' <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">['+_(r)+"]</span>"),n+=' was founded in <span style="font-weight:500;">'+_(i)+"</span>",n+=' with a specialty in <span style="color:var(--teal);font-weight:500;">'+_(s)+"</span>.",n+=' Led by CEO <span style="font-weight:500;">'+_(a)+"</span>.",n+="</div>",l&&(n+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">'+_(l)+"</div>"),n+="</div>",n}).join("")}async function Ft(){const t=document.getElementById("corp-events-list");if(!t||!nt)return;const{nationId:o}=nt;if(!o){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[e,a,i,s]=await Promise.all([c.from("event_log").select("*").eq("nation_id",o).order("fired_at_tick",{ascending:!1}).limit(50),c.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",o).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),c.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",o).order("created_at",{ascending:!1}).limit(20),c.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",o).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(e.error)throw e.error;const r=e.data||[],l=zt(r,(a.data||[]).map(n=>St(n,o)),(i.data||[]).map(n=>Rt(n)),(s.data||[]).map(n=>Pt(n)),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>';return}t.innerHTML=At(l)}catch(e){console.error("Nation events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function $e(){const t=document.getElementById("corp-events-list");if(!t||!nt)return;const{nationId:o}=nt;if(!o){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[e,a,i,s]=await Promise.all([c.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",o).order("fired_at_tick",{ascending:!1}).limit(60),c.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",o).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),c.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",o).order("created_at",{ascending:!1}).limit(15),c.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",o).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(e.error)throw e.error;const r=e.data||[],l=zt(r,(a.data||[]).map(n=>St(n,null,{nations:n.nations})),(i.data||[]).map(n=>Rt(n,{nations:n.nations})),(s.data||[]).map(n=>Pt(n,{nations:n.nations})),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>';return}t.innerHTML=Ot(l)}catch(e){console.error("World events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}window.switchCorpEventsCat=function(t){t!==mt&&(mt=t,document.querySelectorAll("#corp-events-cat-bar .corp-events-tab").forEach(o=>o.classList.toggle("active",o.dataset.cat===t)),Dt())};window.switchCorpEventsScope=function(t){t!==ut&&(ut=t,document.querySelectorAll("#corp-events-scope-bar .corp-events-tab").forEach(o=>o.classList.toggle("active",o.dataset.scope===t)),Dt())};function Dt(){mt==="nation"&&ut==="local"?Ft():mt==="nation"&&ut==="world"?$e():mt==="corporate"&&ut==="local"?xe():he()}Xt();
