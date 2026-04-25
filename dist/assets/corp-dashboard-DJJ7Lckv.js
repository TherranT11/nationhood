const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-rMK78I65.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as p}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{_ as ve}from"./preload-helper-BXl3LOEh.js";import{escapeHtml as v,tickToDate as Ct}from"./utils-A98FEun4.js";import{initMessaging as _e}from"./messaging-1y3PTVCT.js";import{c as me}from"./equipment-DsuDdEne.js";import{a as ue,b as ge,d as ye}from"./corp-valuation-C0hsb2EQ.js";import{m as St,p as jt}from"./loan-math-Q4nHfU_i.js";import{c as be,s as xe}from"./corp-refurbish-eZ1qOCh2.js";let ut=[],_=null,V=null;function c(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(2)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(1)+"k":"$"+Math.round(t).toLocaleString()}function pt(t,n){return Number(t?.[n]??50)}async function he(){const{data:{user:t}}=await p.auth.getUser();if(!t){window.location.href="login.html";return}const n=new URLSearchParams(location.search).get("faction_id");if(n){const{data:x,error:g}=await p.from("factions").select("*").eq("id",n).single();g?console.warn("[Inspector] faction fetch failed:",g.message):x?.faction_type==="corporation"&&(_=x)}if(!_){const{data:x}=await p.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);ut=(x||[]).filter(d=>d.nation_id&&!d.abandoned_at);const g=sessionStorage.getItem("active_faction_id");if(_=ut.find(d=>d.id===g)||ut.find(d=>d.faction_type==="corporation")||ut[0],!_){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",_.id),_.faction_type!=="corporation"){window.location.href="dashboard.html";return}}let e=_.nation||"",a=null;const[i,r]=await Promise.all([_.nation_id?p.from("nations").select("*").eq("id",_.nation_id).single():Promise.resolve({data:null}),p.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);i.error&&console.warn("Nation load failed:",i.error.message),i.data&&(e=i.data.name,a=i.data),r.error&&console.warn("Shard load failed:",r.error.message),V=r.data;let s=0;if(_?.id){const{data:x}=await p.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",_.id).in("status",["open","bidding"]);if(x)for(const g of x)s+=(g.contract_bids||[]).length}const l=document.getElementById("corp-topbar-container");if(l){const{renderCorpTopBar:x}=await ve(async()=>{const{renderCorpTopBar:d}=await import("./corp-topbar-rMK78I65.js");return{renderCorpTopBar:d}},__vite__mapDeps([0,1])),g={};s>0&&(g.home={color:"#c8a832",title:s+" pending bid"+(s!==1?"s":"")+" on your projects"}),x(l,{faction:_,shard:V,activeTab:"home",allUserFactions:ut,badges:g})}document.getElementById("id-type-badge").textContent=_.corp_company_type||"—";const o=document.getElementById("id-logo"),f=(_.corp_ticker||_.abbreviation||"").toUpperCase();_.custom_logo_url?o.innerHTML=`<img src="${v(_.custom_logo_url)}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`:o.textContent=f.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=_.faction_name||"Unnamed Corp";const y=_.party_description||"";document.getElementById("id-slogan").textContent=y?'"'+y+'"':'"--"';const b=V?.current_date?V.current_date.replace(/.*,\s*/,""):"—",k=_.leader_first_name&&_.leader_last_name?_.leader_first_name+" "+_.leader_last_name+(_.leader_age?" ("+_.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${v(b)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${v(e||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${v(_.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${v(_.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${v(k)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${v(_.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${v(f)}</span>
        </div>
    `;const R=_.last_rename_tick||0,I=V?.current_tick||0,j=Math.max(0,R+120-I),O=!y||y==="-"||y==='"-"'||j<=0,W=document.getElementById("slogan-editor");W.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${v(y)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${O?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${O?"60 characters max. 120 tick cooldown after change.":j+" ticks until you can change slogan."}</div>
    `;const G=document.getElementById("corp-logo-upload");G.innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Logo</span>
            <label class="id-row__value" style="cursor:pointer;text-decoration:underline;" id="corp-logo-label">
                ${_.custom_logo_url?"Change Logo":"Upload Logo"}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" id="corp-logo-file" style="display:none;">
            </label>
        </div>
    `,document.getElementById("corp-logo-file")?.addEventListener("change",Re),window._corpFactionId=_.id,window._currentTick=I,window._nationStats=a,window._factionData=_;const M=we(a,e,_);Ee(e,_);const E=await At(a,e,_,V);let P=0;if(_?.id){const{data:x,error:g}=await p.from("corp_equipment").select("equipment_key, owned").eq("faction_id",_.id);g||(P=me(x||[]))}let z=0;if(_?.id){const{data:x}=await p.from("corp_executives").select("salary_per_year").eq("faction_id",_.id).eq("status","active");z=(x||[]).reduce((g,d)=>g+(Number(d.salary_per_year)||0),0)}let N=0,B=0;if(_?.id&&_.corp_sector==="Shipping"){const{data:x}=await p.from("corp_vessels").select("base_maintenance, purchase_price, condition, built_at_tick, status").eq("faction_id",_.id).neq("status","for_sale");N=(x||[]).reduce((g,d)=>g+(Number(d.base_maintenance)||0),0),B=ue(x,I)}await $e(a,V,M,_,E.propertyMaintenance||0,P,z,E,N),await Te(a,e,_,M,E,B),_e(_,a,V),st={nationId:_.nation_id},te(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function we(t,n,e){const a=g=>pt(t,g),i=(n||"UNKNOWN").toUpperCase(),r=Number(e?.corp_general_workforce??2250),s=Number(e?.corp_skilled_workforce??600),l=Number(e?.corp_innovative_workforce??150),o=r+s+l,f=2,y=3,b=6,k=a("minimum_wage"),R=k/100*48e3,I=a("inflation"),H=a("standard_of_living"),j=1+(I-50)/100*.5,A=1+(H-50)/100*.5,O=g=>Math.round(R*g*j*A),W=O(f),G=O(y),M=O(b),E=r*W,P=s*G,z=l*M,N=E+P+z;function B(g){return"$"+Math.round(g).toLocaleString()+"/yr"}const x=`${j.toFixed(2)} &times; ${A.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=o.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${v(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${f}.0 &times; ${x})</span>
                <span class="wf-tier__value">${B(W)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(E)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${v(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${s.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${y}.0 &times; ${x})</span>
                <span class="wf-tier__value">${B(G)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(P)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${v(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${b}.0 &times; ${x})</span>
                <span class="wf-tier__value">${B(M)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(z)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${v(i)})</span>
                <span class="wf-tier__value">${k}/100 → ${B(R)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${j.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${A.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${o.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${c(N)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${c(N/12)}</span>
            </div>
        </div>
    `,{totalWages:N,generalTotal:E,skilledTotal:P,innovativeTotal:z,monthlyWages:Math.round(N/12)}}async function $e(t,n,e,a,i,r,s,l,o){const f=n?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+f;const y=87e6,b=u=>pt(t,u),k=1+(b("gdp_growth")-50)/100*.4,R=1+(b("urbanization")-50)/100*.3,I=1+(b("population_growth")-50)/100*.2,H=1+(b("standard_of_living")-50)/100*.15,j=1+(50-b("physical_infrastructure"))/100*.1,A=1-Math.max(0,b("inflation")-50)/100*.1,O=1-Math.max(0,b("interest_rates")-50)/100*.1,W=k*R*I*H*j*A*O,G=Math.round(y*W),M=(a.corp_general_workforce||0)+(a.corp_skilled_workforce||0)+(a.corp_innovative_workforce||0),E=Math.max(500,l?.totalCapacity||500),P=Math.min(1,M/E),z=l?.propertyRevBonus||0,N=Math.round(Math.round(G/12)*P)+z;let B=0,x=0,g=0,d=0,tt=0,F=0,X=0,$=0,K=0;if(a?.id){const u=a.corp_sector||"";if(u==="Finance"){const{data:T}=await p.from("finance_active_loans").select("monthly_payment, payments_made, total_paid, total_interest_paid, interest_rate, remaining_principal, finance_loan_requests(request_type)").eq("lender_faction_id",a.id).in("status",["current","late","delinquent"]);for(const m of T||[]){const h=m.finance_loan_requests?.request_type||"loan";if(h==="insurance"){const C=Number(m.monthly_payment||0);x+=C,$+=C}else if(h==="loan"){const C=Number(m.monthly_payment||0);tt+=C;const q=Math.max(0,Number(m.remaining_principal||0)),D=Math.min(C,St(q,m.interest_rate)),S=jt(C,D);x+=D,g+=D,d+=S;const U=Number(m.payments_made||0),ht=Number(m.total_paid||0),pe=C*U,Ut=Math.max(0,ht||pe),fe=Math.max(0,Math.min(Ut,Number(m.total_interest_paid||0)));F+=Ut,X+=fe}else h==="bond"&&(x+=Number(m.monthly_payment||0))}}else if(u==="Construction"){const{data:T}=await p.from("construction_contracts").select("id, budget_ceiling, timeline_ticks").eq("awarded_to_faction",a.id).eq("status","in_progress"),m=[];for(const h of T||[])x+=Math.round((h.budget_ceiling||0)/(h.timeline_ticks||1)),h.id&&m.push(h.id);if(m.length>0){const{data:h}=await p.from("contract_bids").select("contract_id, estimated_cost").in("contract_id",m).eq("status","won"),C={};for(const q of h||[])C[q.contract_id]=Number(q.estimated_cost||0);for(const q of T||[]){const D=C[q.id]||0;K+=Math.round(D/Math.max(1,q.timeline_ticks||1))}}}else if(u==="Shipping"){const{data:T}=await p.from("shipping_claims").select("revenue_per_transit").eq("faction_id",a.id).eq("status","active");for(const m of T||[])x+=Number(m.revenue_per_transit||0)}}let J=[],Y=0;try{const{data:u}=await p.from("corp_properties").select("id, nation_id, nations!nation_id(name)").eq("faction_id",a.id).eq("type","fuel_depot").eq("is_active",!0);if(u&&u.length>0){const T=u.map(m=>m.nation_id).filter(Boolean);if(T.length>0){const{data:m}=await p.from("shipping_claims").select("faction_id, shipping_routes!inner(destination_nation_id, status)").eq("status","active").in("shipping_routes.destination_nation_id",T),h=[...new Set((m||[]).map(S=>S.faction_id).filter(S=>S&&S!==a.id))],C=new Set;if(h.length>0){const{data:S}=await p.from("corp_properties").select("faction_id, nation_id").in("faction_id",h).in("nation_id",T).eq("type","fuel_depot").eq("is_active",!0);for(const U of S||[])C.add(U.faction_id+"|"+U.nation_id)}const q={};for(const S of m||[]){const U=S.shipping_routes?.destination_nation_id;U&&S.faction_id!==a.id&&(C.has(S.faction_id+"|"+U)||(q[U]=(q[U]||0)+1))}const D=7500;for(const S of u){const U=q[S.nation_id]||0,ht=U*D;J.push({nation:S.nations?.name||"Unknown",revenue:ht,visitors:U}),Y+=ht}J.sort((S,U)=>U.revenue-S.revenue)}}}catch(u){console.warn("Fuel depot revenue estimate failed (non-fatal):",u?.message||u)}const vt=B+x+N+Y,bt=e?.totalWages||0,_t=Math.round(bt/12),L=0,w=i||0,ct=r||0,et=Number(a?.corp_loans)||0,dt=.05,at=et>0?Math.round(et*(dt/12)/(1-Math.pow(1+dt/12,-120))):0;let Z=0,it=0,nt=0,rt=[];if(a?.id)try{const{data:u}=await p.from("finance_active_loans").select("monthly_payment, equity_pct, series, total_paid, finance_loan_requests(request_type), lender:factions!lender_faction_id(faction_name)").eq("borrower_faction_id",a.id).in("status",["current","late","delinquent"]),T=Math.max(0,Number(a?.monthly_profit||0));for(const m of u||[]){const h=m.finance_loan_requests?.request_type||"loan";if(h==="equity"){const q=Number(m.equity_pct||0),D=Math.floor(T*q/100);nt+=D,rt.push({investor:m.lender?.faction_name||"Unknown",stakePct:q,series:m.series||"?",paidToDate:Number(m.total_paid||0),nextDividend:D});continue}const C=Number(m.monthly_payment||0);if(!(C<=0))if(h==="insurance")it+=C;else{if(h==="bond")continue;Z+=C}}rt.sort((m,h)=>h.stakePct-m.stakePct)}catch(u){console.warn("[Finances] borrower finance_active_loans lookup failed:",u)}const xt=Math.round((s||0)/12),ot=o||0,ft=75e3,ae=Math.max(0,Math.min(1,Number(t?.corporate_tax??0)/100||0)),Ot=_t+xt+L+w+ct+ot+at+Z+it+nt+K+ft,Ft=Math.max(0,vt-Ot),Dt=Math.round(Ft*ae);let Tt="";try{const u=new Set([a.nation_id]),{data:T}=await p.from("corp_properties").select("nation_id").eq("faction_id",a.id).eq("is_active",!0);if((T||[]).forEach(m=>{m.nation_id&&u.add(m.nation_id)}),u.size>0){const{data:m}=await p.from("nations").select("id, name, corporate_tax").in("id",[...u]);m&&m.length>0&&(Tt=m.sort((h,C)=>(h.name||"").localeCompare(C.name||"")).map(h=>{const C=Math.round(Number(h.corporate_tax??0)),q=Math.round(Ft*(C/100)/m.length),D=C>25?"#c55":C>15?"#ca5":"#5c5";return`<div style="display:flex;justify-content:space-between;padding:1px 0;font-family:var(--font-mono);font-size:8px;">
                        <span style="color:var(--text-dim);">${h.name} (<span style="color:${D}">${C}%</span>)</span>
                        <span style="color:#a44;">${c(q)}</span>
                    </div>`}).join(""))}}catch{}const ne=Ot+Dt,Mt=Number(a?.monthly_profit||0),lt=Number(a?.corp_cash_reserves??0),oe=et;let mt=null,Q=null,Lt=null,Nt="Does not include all capital/financing cash transfers.";if(a?.id)try{const{data:u}=await p.from("corp_cash_history").select("tick, cash_start, cash_end, cash_delta, non_pnl_cash_movements").eq("faction_id",a.id).lte("tick",f).order("tick",{ascending:!1}).limit(2),T=(u||[]).find(h=>Number(h.tick)===Number(f))||(u||[])[0]||null,m=(u||[]).find(h=>Number(h.tick)<Number(T?.tick??f))||null;T?(mt=T.cash_start!=null?Number(T.cash_start):m?.cash_end!=null?Number(m.cash_end):null,Q=T.cash_delta!=null?Number(T.cash_delta):mt!=null?lt-mt:null,Lt=T.non_pnl_cash_movements!=null?Number(T.non_pnl_cash_movements):Q!=null?Q-Mt:null):Nt="Does not include all capital/financing cash transfers. Cash history snapshot not yet available."}catch(u){console.warn("[Finances] corp_cash_history lookup failed:",u),Nt="Does not include all capital/financing cash transfers. Cash history snapshot unavailable."}const It=tt-(g+d),ie=Math.abs(It)>.01,se=[{stat:"gdp_growth",value:b("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:b("urbanization"),weight:"0.3"},{stat:"population_growth",value:b("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:b("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:b("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:b("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:b("interest_rates"),weight:"-0.1",neg:!0}];function re(u){return u.neg?u.value>50?"var(--red)":"var(--green)":u.note?u.value<50?"var(--green)":"var(--red)":u.value>=50?"var(--green)":u.value>=35?"var(--amber)":"var(--red)"}const Rt=vt||1,le=(B/Rt*100).toFixed(1),ce=((x+Y)/Rt*100).toFixed(1),de=(N/Rt*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue <span title="Accounting rule: loan interest and insurance premiums count as revenue. Loan principal repayments increase cash but are not revenue or profit." style="font-size:8px;color:var(--text-dim);font-family:var(--font-mono);text-transform:none;letter-spacing:0;">[?]</span></div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${le}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${ce}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${de}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${c(B)}</span></div>
            <div class="fin-row"><span class="fin-row__label" title="Private operating revenue includes contracts plus loan interest and insurance premiums only; principal repayments are excluded.">Private Operating Revenue (contracts + loan interest/premiums only)</span><span class="fin-row__value" style="color:var(--green)">${c(x)}</span></div>
            ${a?.corp_sector==="Finance"?'<div style="padding:5px 12px 2px 12px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.4px;text-transform:uppercase;">P&L revenue</div>':""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Interest portion of this tick's loan payments recognized as operating revenue in P&L.">Loan Interest Revenue (this tick) <span class="fin-row__badge">REVENUE</span></span><span class="fin-row__value" style="color:var(--green)">${c(g)}</span></div>`:""}
            ${a?.corp_sector==="Finance"&&$>0?`<div class="fin-row"><span class="fin-row__label" title="Insurance premiums collected this tick are recognized as operating revenue in P&L.">Insurance Premium Revenue (this tick) <span class="fin-row__badge">REVENUE</span></span><span class="fin-row__value" style="color:var(--green)">${c($)}</span></div>`:""}
            ${a?.corp_sector==="Finance"?'<div style="padding:5px 12px 2px 12px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.4px;text-transform:uppercase;">Non-revenue cash movements</div>':""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Principal repayment increases cash and reduces the loan receivable. It is not revenue or profit.">Loan Principal Repaid (this tick) <span class="fin-row__badge">ASSET→CASH</span></span><span class="fin-row__value" style="color:var(--text-bright)">${c(d)}</span></div>`:""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Loan cash collected this tick equals interest plus principal.">Loan Cash Collected (this tick) <span class="fin-row__badge">CASH</span></span><span class="fin-row__value" style="color:var(--text-bright)">${c(g+d)}</span></div>`:""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Checks this tick's scheduled loan payments against computed split. Portfolio Scheduled Loan Payments = Interest Revenue + Principal Repaid.">Loan Payment Reconciliation (this tick) <span class="fin-row__badge">CHECK</span></span><span class="fin-row__value" style="color:${ie?"var(--red)":"var(--text-bright)"}">${c(tt)} = ${c(g)} + ${c(d)} (Δ ${It>=0?"+":"-"}${c(Math.abs(It))})</span></div>`:""}
            ${a?.corp_sector==="Finance"?'<div style="padding:5px 12px 2px 12px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.4px;text-transform:uppercase;">Lifetime portfolio totals</div>':""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Portfolio cumulative cash from loans. Loan cash collected = interest + principal.">Loan Cash Collected (to date) <span class="fin-row__badge">PORTFOLIO</span></span><span class="fin-row__value" style="color:var(--text-bright)">${c(F)}</span></div>`:""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Portfolio cumulative interest portion collected from loans.">Loan Interest (to date) <span class="fin-row__badge">PORTFOLIO</span></span><span class="fin-row__value" style="color:var(--green)">${c(X)}</span></div>`:""}
            ${a?.corp_sector==="Finance"?'<div style="padding:2px 12px 4px 12px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.2px;">Principal repayment increases cash but does not increase profit.</div>':""}
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${c(N-z)}</span></div>
            ${z>0?`<div class="fin-row"><span class="fin-row__label">Property Revenue<span class="fin-row__badge">BUILDINGS</span></span><span class="fin-row__value" style="color:var(--green)">${c(z)}</span></div>`:""}
            ${J.map(u=>`<div class="fin-row"><span class="fin-row__label">Fuel Depot (${u.nation})<span class="fin-row__badge">${u.visitors} visitor${u.visitors!==1?"s":""}</span></span><span class="fin-row__value" style="color:var(--green)">${c(u.revenue)}</span></div>`).join("")}
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${c(vt)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${c(_t)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Executive Compensation</span><span class="fin-row__value" style="color:#a44">${c(xt)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${c(L)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${c(w)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${c(ct)}</span></div>
            ${ot>0?`<div class="fin-row"><span class="fin-row__label">Fleet Maintenance</span><span class="fin-row__value" style="color:#a44">${c(ot)}</span></div>`:""}
            ${K>0?`<div class="fin-row"><span class="fin-row__label">Project Build Costs</span><span class="fin-row__value" style="color:#a44">${c(K)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${c(at)}</span></div>
            ${Z>0?`<div class="fin-row"><span class="fin-row__label">Loan Repayments</span><span class="fin-row__value" style="color:#a44">${c(Z)}</span></div>`:""}
            ${it>0?`<div class="fin-row"><span class="fin-row__label">Insurance Premiums</span><span class="fin-row__value" style="color:#a44">${c(it)}</span></div>`:""}
            ${nt>0?`<div class="fin-row"><span class="fin-row__label" title="Dividends to equity holders. Each tick: equity_pct × last tick's monthly profit. $0 on loss ticks.">Equity Dividends</span><span class="fin-row__value" style="color:#a44">${c(nt)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${c(Dt)}</span></div>
            ${Tt?`<div style="padding:2px 12px 6px 20px;border-bottom:1px solid var(--border-hair);">${Tt}</div>`:""}
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${c(ne)}</span>
            </div>
        </div>
        <!-- Last Tick Cash Change — primary bottom-line signal. Uses cashDelta
             (cash_end - cash_start from corp_cash_history) so the top-line
             figure captures everything: operating P&L *plus* non-P&L cash
             movements like loan principal, capex, dividends, tax credits.
             Shows '—' when no prior-tick snapshot exists. -->
        <div class="fin-net" style="background:${Q==null?"transparent":Q>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"};">
            <span class="fin-net__label">Last Tick Cash Change <span title="The actual change in the corporation's cash reserves between this tick and the previous tick. Includes operating profit/loss plus non-P&L cash movements (loan principal, capex, dividends, tax credits). Computed from the corp_cash_history snapshots written at tick-exit." style="font-size:8px;color:var(--text-dim);font-family:var(--font-mono);text-transform:none;letter-spacing:0;">[?]</span></span>
            <span class="fin-net__value" style="color:${Q==null?"var(--text-dim)":Q>=0?"var(--green)":"var(--red)"};">${Q==null?"—":c(Q)}</span>
        </div>
        <div style="padding:2px 14px 8px 14px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.2px;">${Nt}</div>
        <!-- Cash Reconciliation -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--text-bright);">Cash Change This Tick</div>
            <div class="fin-row"><span class="fin-row__label">Last Tick Net Profit</span><span class="fin-row__value" style="color:${Mt>=0?"var(--green)":"var(--red)"}">${c(Mt)}</span></div>
            <div class="fin-row"><span class="fin-row__label">+/- Non-P&amp;L cash movements</span><span class="fin-row__value" style="color:var(--text-bright)">${Lt==null?"—":c(Lt)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">= Actual Cash Change</span>
                <span class="fin-total__value" style="color:${(Q||0)>=0?"var(--green)":"var(--red)"}">${Q==null?"—":c(Q)}</span>
            </div>
            <div style="padding:2px 12px 4px 12px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.2px;">Computed from cash snapshots: current cash (${c(lt)}) ${mt==null?"with no prior snapshot":"- previous tick cash ("+c(mt)+")"}.</div>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${c(lt)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${c(oe)}</div>
            </div>
        </div>
        <!-- Purchasing Power -->
        ${(()=>{const u=Number(t?.currency_strength??50),T=Number(t?.inflation??0),m=u/50,h=Math.max(.5,1-T/200),C=Math.round(lt*m*h),q=C>=lt?"var(--green)":C>=lt*.8?"var(--amber)":"var(--red)",D=lt>0?Math.round(C/lt*100):100;return`<div style="padding:4px 14px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-hair);">
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.5px;text-transform:uppercase;">Purchasing Power</div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${q};">${c(C)}</span>
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${D}% · CUR ${u} · INF ${Math.round(T)}</span>
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
        ${rt.length>0?(()=>{const u=rt.reduce((m,h)=>m+(h.stakePct||0),0),T=rt.reduce((m,h)=>m+(h.paidToDate||0),0);return`<div style="padding:8px 14px;border-top:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;">Private Investment</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c89a4a;">${u.toFixed(2)}% STAKED &middot; ${c(T)} PAID TO DATE</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 50px 40px 1fr 1fr;gap:4px;font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;padding:0 2px 3px;border-bottom:1px solid var(--border-hair);">
                    <span>INVESTOR</span>
                    <span style="text-align:right;">STAKE</span>
                    <span style="text-align:center;">SERIES</span>
                    <span style="text-align:right;">PAID TO DATE</span>
                    <span style="text-align:right;" title="Projected next dividend = stake × last tick's profit.">NEXT DIVIDEND</span>
                </div>
                ${rt.map(m=>`
                    <div style="display:grid;grid-template-columns:1fr 50px 40px 1fr 1fr;gap:4px;font-family:var(--font-mono);font-size:8px;padding:2px;border-bottom:1px solid var(--border-hair);">
                        <span style="color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${v(m.investor)}">${v(m.investor)}</span>
                        <span style="color:#c89a4a;text-align:right;">${m.stakePct.toFixed(2)}%</span>
                        <span style="color:#c89a4a;text-align:center;">${v(m.series)}</span>
                        <span style="color:var(--green);text-align:right;">${c(m.paidToDate)}</span>
                        <span style="color:${m.nextDividend>0?"var(--green)":"var(--text-dim)"};text-align:right;">${c(m.nextDividend)}</span>
                    </div>
                `).join("")}
            </div>`})():""}
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${se.map(u=>`
                <div class="drv-row">
                    <span class="drv-row__name">${u.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${u.value}%;background:${re(u)}"></div></div>
                    <span class="drv-row__val">${u.value}</span>
                    <span class="drv-row__wt">&times;${u.weight}</span>
                    ${u.note?'<span class="drv-row__note">'+u.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${W.toFixed(2)}</span>
            </div>
        </div>
    `,zt()}let qt=!1;async function ke(t,n){if(!(!_||qt)){qt=!0;try{const{data:e,error:a}=await p.from("finance_loan_offers").select("*").eq("id",t).single();if(a||!e)return;const{data:i,error:r}=await p.from("finance_loan_requests").select("*").eq("id",n).single();if(r||!i||i.status!=="open")return;const s=i.term_months,l=St(i.amount,e.interest_rate),o=Math.round(i.amount/s),f=l+o,y=V?.current_tick||0,{error:b}=await p.from("finance_loan_requests").update({status:"funded",accepted_offer_id:t,funded_tick:y}).eq("id",n);if(b)return;await p.from("finance_loan_offers").update({status:"accepted"}).eq("id",t),await p.from("finance_loan_offers").update({status:"declined"}).eq("request_id",n).neq("id",t).eq("status","pending"),await p.from("finance_active_loans").insert({request_id:n,offer_id:t,borrower_faction_id:i.requesting_faction_id,lender_faction_id:e.offering_faction_id,nation_id:i.nation_id,principal:i.amount,interest_rate:e.interest_rate,term_months:i.term_months,collateral_type:e.collateral_type,purpose:i.purpose,monthly_payment:f,started_tick:y});const{data:k}=await p.from("factions").select("corp_cash_reserves").eq("id",e.offering_faction_id).single();k&&await p.from("factions").update({corp_cash_reserves:Math.max(0,(Number(k.corp_cash_reserves)||0)-i.amount)}).eq("id",e.offering_faction_id);const{data:R}=await p.from("factions").select("corp_cash_reserves, corp_debt").eq("id",i.requesting_faction_id).single();if(R){const{error:I}=await p.from("factions").update({corp_cash_reserves:(Number(R.corp_cash_reserves)||0)+i.amount,corp_debt:(Number(R.corp_debt)||0)+i.amount}).eq("id",i.requesting_faction_id);I&&console.error("[Loans] Failed to credit borrower + track debt:",I.message)}}finally{qt=!1}zt()}}async function Ce(t){await p.from("finance_loan_requests").update({status:"cancelled"}).eq("id",t),zt()}async function zt(){if(!_)return;const t=document.getElementById("fin-loans-list");if(t)try{const{data:n,error:e}=await p.from("finance_loan_requests").select("*, finance_loan_offers!request_id(*)").eq("requesting_faction_id",_.id).in("status",["open","funded"]).neq("request_type","equity").order("created_tick",{ascending:!1});e&&console.error("[Loans] Request query error:",e.message);const{data:a,error:i}=await p.from("finance_active_loans").select("*, lender:factions!lender_faction_id(faction_name, abbreviation)").eq("borrower_faction_id",_.id).in("status",["current","late","delinquent"]).is("equity_pct",null).order("started_tick",{ascending:!1});i&&console.error("[Loans] Active loans query error:",i.message);let r="";if(n&&n.length>0){for(const s of n)if(s.status==="open"){const l=(s.finance_loan_offers||[]).filter(o=>o.status==="pending");if(r+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span style="color:#5a8aaa;font-weight:700;">OPEN</span>
                            <span style="color:var(--text-primary);margin-left:4px;">${c(s.amount)}</span>
                            <span style="color:var(--text-dim);margin-left:4px;">${s.term_months}mo</span>
                        </div>
                        <span style="color:var(--text-dim);cursor:pointer;" onclick="cancelRequest('${s.id}')">&#10005;</span>
                    </div>
                    <div style="font-size:7px;color:var(--text-dim);margin-top:2px;">${v(s.purpose||"")}</div>`,l.length>0){r+=`<div style="margin-top:4px;font-size:7px;color:#5a8aaa;font-weight:700;">${l.length} OFFER${l.length>1?"S":""}</div>`;for(const o of l.sort((f,y)=>f.interest_rate-y.interest_rate))r+=`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-top:1px solid var(--border-hair);">
                            <span style="color:var(--text-primary);font-weight:700;">${o.interest_rate}%</span>
                            <span style="color:var(--text-dim);">${o.collateral_type}</span>
                            <span style="flex:1;"></span>
                            <span style="padding:2px 8px;cursor:pointer;color:#000;background:#5a8aaa;font-weight:700;font-size:7px;" onclick="acceptOffer('${o.id}','${s.id}')">ACCEPT</span>
                        </div>`}else r+='<div style="margin-top:2px;font-size:7px;color:var(--text-dim);">Awaiting offers from finance corporations...</div>';r+="</div>"}}if(a&&a.length>0)for(const s of a){const l=s.status==="current"?"var(--green)":s.status==="late"?"#c84":"#c55",o=s.term_months>0?Math.round(s.payments_made/s.term_months*100):0,f=Number(s.monthly_payment||0),y=Math.max(0,Number(s.remaining_principal||0)),b=Math.max(0,Math.min(f,St(y,s.interest_rate))),k=jt(f,b),R=s.lender?.faction_name||"Unknown bank",I=Ct(s.started_tick);r+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="color:${l};font-weight:700;">${s.status.toUpperCase()}</span>
                        <span style="color:var(--text-primary);margin-left:4px;">${c(s.principal)}</span>
                        <span style="color:var(--text-dim);margin-left:4px;">@ ${s.interest_rate}%</span>
                    </div>
                    <span style="color:var(--text-dim);">${o}% repaid</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Bank: <span style="color:var(--text-primary);">${v(R)}</span></span>
                    <span>Issued: <span style="color:var(--text-primary);">${v(I)}</span></span>
                </div>
                <div style="height:2px;background:var(--border-0);margin-top:3px;">
                    <div style="height:100%;width:${o}%;background:${l};"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Total Monthly Payment (cash collected): ${c(f)}/mo</span>
                    <span>${s.payments_made}/${s.term_months} payments</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:1px;font-size:7px;color:var(--text-dim);">
                    <span>Interest Portion (P&L revenue): ${c(b)}</span>
                    <span>Principal Portion (asset repayment): ${c(k)}</span>
                </div>
            </div>`}r||(r='<div style="color:var(--text-dim);">No active loans.</div>'),t.innerHTML=r}catch(n){console.error("[Loans] loadLoansSection error:",n)}}window.acceptOffer=ke;window.cancelRequest=Ce;function Ee(t,n){const e=(t||"").toUpperCase(),a=Number(n.corp_general_workforce??0)+Number(n.corp_skilled_workforce??0)+Number(n.corp_innovative_workforce??0),i=[{label:"Reputation",value:Number(n.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:a||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(n.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(n.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(n.corp_market_share??5),change:0,nation:e,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(n.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(n.corp_regulatory_standing??50),change:0,nation:e,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(n.corp_political_influence??10),change:0,decay:!0,nation:e,max:100},{label:"Innovation",value:Number(n.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function r(o,f){if(!f||f>100)return"var(--text-primary)";const y=o/f*100;return y>=70?"var(--green)":y>=40?"var(--amber)":y>=20?"var(--orange, #d48a3c)":"var(--red)"}function s(o){const f=parseFloat(o),y=f>0?"var(--green)":f<0?"var(--red)":"var(--text-dim)",b=f>0?"▲":f<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${y}">${b}</span>
            <span class="stat-item__delta" style="color:${y}">${Math.abs(f).toFixed(1)}</span>
        </div>`}let l="";for(const o of i){if(o.isHero){l+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${o.label}</span>
                            ${o.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${Math.round(o.value)}</span>
                            <span class="stats-hero__max">/100</span>
                            ${s(o.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${Math.min(100,o.value)}%"></div></div>
                </div>`;continue}o.section&&(l+=`<div class="stats-section"><span class="stats-section__label">${o.section}</span></div>`);const f=o.max&&o.max<=100;l+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${o.label}</span>
                        ${o.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${o.nation?'<span class="stat-item__nation">'+v(o.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${f?r(o.value,o.max):"var(--text-primary)"}">${typeof o.value=="number"?f?Math.round(o.value):o.value.toLocaleString():o.value}</span>
                    ${f?'<span class="stat-item__max">/100</span>':""}
                    ${s(o.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=l}async function At(t,n,e,a){const i=(n||"UNKNOWN").toUpperCase();let r=[];if(e?.id){const{data:g}=await p.from("corp_properties").select("*").eq("faction_id",e.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});r=g||[]}const s={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,o=0;const f=Number(e?.corp_general_workforce??0)+Number(e?.corp_skilled_workforce??0)+Number(e?.corp_innovative_workforce??0),y=500,b=r.map(g=>{const d=Number(g.capacity||0),tt=Number(g.condition||0)/100;return Math.floor(d*tt)}),k=y+b.reduce((g,d)=>g+d,0),R=k>0?Math.min(f,Math.round(f*(y/k))):f,I=5e7,H=1+(pt(t,"inflation")-50)/100*.3,j=.8+pt(t,"stability")/100*.4,A=Math.round(I*H*j),O=Math.round(A*.005);l+=A,o+=O;let W=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${v(i)} · Headquarters</div>
            </div>
            <span class="prop-asset__badge">HQ</span>
        </div>
        <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${y}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${R.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c(A)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(O)}</div>
            </div>
        </div>
    </div>`,G=R;for(let g=0;g<r.length;g++){const d=r[g],tt=s[d.style]||s.Basic;l+=Number(d.purchase_price||0),o+=Number(d.monthly_maintenance||0);const F=d.condition>=75?"var(--green)":d.condition>=50?"var(--amber)":"var(--orange)",X=Number(d.capacity||0),$=b[g]||0,K=k>0?Math.min(f-G,Math.round(f*($/k))):0;G+=K,W+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${v(d.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${v(d.city||i)} · ${(d.type||"").replace(/_/g," ")} · <span style="color:${tt.color}">${(d.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge" ${["branch_office","trading_floor","claims_office"].includes(d.type)?'style="background:rgba(138,106,170,0.12);color:#8a6aaa;border-color:rgba(138,106,170,0.3);"':""}>${["branch_office","trading_floor","claims_office"].includes(d.type)?d.type.replace(/_/g," ").replace(/\b\w/g,J=>J.toUpperCase()):"OWNED"}</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${X.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${K.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c(d.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(d.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${F}">${d.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${d.condition}%;height:100%;background:${F};"></div></div>
            ${d.refurbish_until_tick&&d.refurbish_until_tick>(a?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${d.refurbish_until_tick-(a?.current_tick||0)} tick${d.refurbish_until_tick-(a?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${d.id}','${v(d.name).replace(/'/g,"\\'")}',${d.purchase_price||0},${d.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${d.id}','${v(d.name).replace(/'/g,"\\'")}',${d.condition},${d.purchase_price||0},${d.refurbish_count||0})">REFURBISH</button>
                ${e?.corp_sector==="Finance"&&(d.type==="office"||d.type==="regional_hq")&&d.role!=="subsidiary"&&!["branch_office","trading_floor","claims_office"].includes(d.type)?`<button class="prop-action-btn" style="background:rgba(138,106,170,0.08);border-color:rgba(138,106,170,0.2);color:#8a6aaa;" onclick="showConvertModal('${d.id}','${v(d.name).replace(/'/g,"\\'")}',${d.purchase_price||0})">CONVERT</button>`:""}
            </div>`}
        </div>`}let M="",E=[];if(e?.id){const{data:g}=await p.from("construction_contracts").select("*, contract_bids(id, faction_id, bid_price, estimated_quality, estimated_cost, labor_count, markup_pct, material_grades, submitted_at_tick, status, factions!faction_id(faction_name, abbreviation, corp_reputation))").eq("issuer_faction_id",e.id).in("status",["open","bidding","awarded","in_progress"]).order("generated_at_tick",{ascending:!1});E=g||[];let d={};const tt=E.filter(F=>F.status==="in_progress").map(F=>F.id);if(tt.length>0){const{data:F}=await p.from("construction_events").select("contract_id, status, severity, title").in("contract_id",tt).eq("status","ACTIVE");for(const X of F||[])d[X.contract_id]||(d[X.contract_id]=[]),d[X.contract_id].push(X)}if(E.length>0){const F={open:{label:"OPEN",color:"#5a8aaa"},bidding:{label:"BIDDING",color:"#c8a832"},awarded:{label:"AWARDED",color:"#8b9a6b"},in_progress:{label:"IN PROGRESS",color:"#5aaa8b"}},X={LOW:"#ca5",MODERATE:"#c84",HIGH:"#c55",CRITICAL:"#f44"};M=`<div class="cp-section">
                <div class="cp-section__header">
                    <span class="cp-section__title">Construction Projects</span>
                    <span class="cp-section__count">${E.length} ACTIVE</span>
                </div>`;for(const $ of E){const K=F[$.status]||F.open,J=($.contract_bids||[]).filter(L=>L.status==="pending"),Y=($.contract_bids||[]).find(L=>L.status==="won"),vt=a?.current_tick||0,bt=d[$.id]||[],_t=$.nation_id===e.nation_id?i:"";if(M+=`<div class="cp-item">
                    <div class="cp-item__top">
                        <div>
                            <div class="cp-item__name">${v($.name)}</div>
                            <div class="cp-item__sub">${v($.project_code||"")} · ${v($.sector||"")}${_t?" · "+v(_t):""}</div>
                        </div>
                        <span class="cp-badge" style="color:${K.color};border-color:${K.color}40;background:${K.color}08;">${K.label}</span>
                    </div>
                    <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:2px 0;">
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BUDGET</div>
                            <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c($.budget_ceiling||0)}</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">TIMELINE</div>
                            <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${$.timeline_ticks||"?"} ticks</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDS</div>
                            <div style="font-size:10px;font-weight:700;color:${J.length>0?"var(--amber)":"var(--text-dim)"};font-family:var(--font-mono);">${($.contract_bids||[]).length}</div>
                        </div>
                    </div>`,($.status==="awarded"||$.status==="in_progress")&&Y){const L=Number(Y.factions?.corp_reputation??50),w=L>=70?"#5c5":L>=40?"#ca5":"#c55",ct=Y.estimated_quality>=75?"#5c5":Y.estimated_quality>=50?"#ca5":"#c55";if(M+=`<div style="margin-top:6px;padding:6px 8px;background:var(--bg-3);border:1px solid var(--border-hair);">
                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.8px;margin-bottom:3px;">CONTRACTOR</div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-bright);margin-bottom:4px;">${v(Y.factions?.faction_name||"Unknown")}</div>
                        <div style="display:flex;gap:0;">
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID</div>
                                <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c(Y.bid_price)}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                <div style="font-size:9px;font-weight:700;color:${ct};font-family:var(--font-mono);">${Y.estimated_quality}/100</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${Y.labor_count}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                <div style="font-size:9px;font-weight:700;color:${w};font-family:var(--font-mono);">${L}/100</div>
                            </div>
                        </div>`,$.status==="in_progress"&&$.awarded_at_tick!=null){const et=vt-$.awarded_at_tick,dt=$.timeline_ticks||1,at=$.stalled_ticks||0,Z=Math.min(100,Math.round(et/(dt+at)*100)),it=Z>=75?"#5c5":Z>=40?"#ca5":"#5aaa8b",nt=Math.max(0,dt+at-et);M+=`<div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);margin-top:6px;">
                            <span style="color:var(--text-dim);">PROGRESS</span>
                            <span style="color:${it};">${Z}%${at>0?" · "+at+" stalled":""} · ${nt} tick${nt!==1?"s":""} left</span>
                        </div>
                        <div class="cp-progress"><div class="cp-progress__bar" style="width:${Z}%;background:${it};"></div></div>`}else M+='<div style="font-size:8px;font-family:var(--font-mono);color:var(--amber);margin-top:6px;text-align:center;">Awarded — construction begins next tick</div>';M+="</div>"}if(bt.length>0)for(const L of bt){const w=X[L.severity]||"#ca5";M+=`<div style="display:flex;align-items:center;gap:5px;margin-top:4px;padding:3px 6px;background:${w}08;border:1px solid ${w}20;">
                            <span class="cp-badge" style="color:${w};border-color:${w}40;background:${w}12;">${L.severity}</span>
                            <span style="font-size:8px;font-family:var(--font-mono);color:${w};">${v(L.title)}</span>
                        </div>`}if(($.status==="open"||$.status==="bidding")&&J.length>0)for(let L=0;L<J.length;L++){const w=J[L],ct=$.id.slice(0,8)+"-"+L,et=Number(w.factions?.corp_reputation??50),dt=et>=70?"#5c5":et>=40?"#ca5":"#c55",at=w.estimated_quality>=75?"#5c5":w.estimated_quality>=50?"#ca5":"#c55",Z=w.markup_pct<=10?"#5c5":w.markup_pct<=20?"#ca5":"#c55",it=w.material_grades||{},nt=Object.entries(it),rt=ot=>ot.replace(/_/g," ").replace(/\b\w/g,ft=>ft.toUpperCase()),xt=ot=>ot==="HIGH"?"#5c5":ot==="LOW"?"#c55":"var(--text-muted)";M+=`<div class="cp-bid" style="flex-direction:column;gap:0;padding:0;cursor:pointer;" onclick="cpToggleBid('${ct}')">
                            <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;">
                                <span style="flex:1;font-size:8px;font-family:var(--font-mono);color:var(--text-muted);">
                                    ${v(w.factions?.faction_name||"Unknown")}
                                    · <span style="color:var(--gold);">${c(w.bid_price)}</span>
                                    · Q: <span style="color:${at};">${w.estimated_quality}</span>
                                </span>
                                <span class="cp-bid__btn" style="color:#5c5;border-color:#5c540;background:#5c508;" onclick="event.stopPropagation();cpAcceptBid('${$.id}','${w.id}','${v((w.factions?.faction_name||"").replace(/'/g,""))}',${w.bid_price},${w.estimated_quality},${w.labor_count},'${w.faction_id}')">ACCEPT</span>
                            </div>
                            <div id="cp-bid-${ct}" style="display:none;padding:4px 8px 6px;border-top:1px solid var(--border-hair);background: var(--border-hair);">
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID PRICE</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c(w.bid_price)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">EST. COST</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${c(w.estimated_cost||0)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MARKUP</div>
                                        <div style="font-size:9px;font-weight:700;color:${Z};font-family:var(--font-mono);">${w.markup_pct}%</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                        <div style="font-size:9px;font-weight:700;color:${at};font-family:var(--font-mono);">${w.estimated_quality}/100</div>
                                    </div>
                                </div>
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${w.labor_count}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                        <div style="font-size:9px;font-weight:700;color:${dt};font-family:var(--font-mono);">${et}/100</div>
                                    </div>
                                    <div style="flex:2;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDDER</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${v(w.factions?.faction_name||"Unknown")}</div>
                                    </div>
                                </div>
                                ${nt.length>0?`<div style="padding:2px 4px;">
                                    <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;margin-bottom:2px;">MATERIAL GRADES</div>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                        ${nt.map(([ot,ft])=>`<span style="font-size:7px;font-family:var(--font-mono);color:${xt(ft)};">${rt(ot)}: ${ft}</span>`).join("")}
                                    </div>
                                </div>`:""}
                            </div>
                        </div>`}if(($.status==="open"||$.status==="bidding")&&J.length===0){const L=($.bidding_ends_tick||0)-(a?.current_tick||0);M+=`<div style="font-size:8px;font-family:var(--font-mono);color:var(--text-dim);margin-top:4px;text-align:center;">
                        Awaiting bids${L>0?" · "+L+" tick"+(L!==1?"s":"")+" remaining":""}
                    </div>`}M+="</div>"}M+="</div>"}}const P=document.getElementById("prop-count"),z=r.length+1,N=E.length,B=z+" ASSET"+(z!==1?"S":"")+(N>0?" · "+N+" PROJECT"+(N!==1?"S":""):"");P&&(P.textContent=B),document.getElementById("prop-body").innerHTML=`
        ${W}
        ${M}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${c(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(o)}/mo</span>
            </div>
        </div>
    `;let x=0;x+=Math.round(y*50);for(const g of r){if(g.refurbish_until_tick&&(a?.current_tick||0)<g.refurbish_until_tick)continue;const d=Number(g.condition||0)/100;d>=.6&&(x+=Math.round(Number(g.capacity||0)*d*50))}return{propertyValue:l,propertyMaintenance:o,totalCapacity:k,propertyRevBonus:x}}async function Te(t,n,e,a,i,r=0){(n||"UNKNOWN").toUpperCase();const s=e.corp_company_type||"Private",l=Number(e.corp_cash_reserves)||0,o=i?.propertyValue||0;let f={loans:0,bonds:0,insurance:0,total:0};if(e?.id&&e.corp_sector==="Finance")try{const{data:P}=await p.from("finance_active_loans").select("principal, remaining_principal, finance_loan_requests!inner(request_type)").eq("lender_faction_id",e.id).in("status",["current","late","delinquent"]);f=ge(P||[])}catch(P){console.warn("[Valuation] finance_active_loans lookup failed:",P)}const y=f.total,b=l+o+r+y,k=Number(e.corp_loans)||0,I=a?.monthlyWages||0,H=0,j=k+I+H,A=ye({cash:l,propertyValue:o,equipmentValue:r,loans:j,financeReceivables:y}),O=A.valuationBasis,W=A.valuation,G=W-A.valuationBasis,M=G>0;document.getElementById("val-type-badge").textContent=s.toUpperCase();function E(P,z,N={}){const B=N.indent?"val-line val-line--indent":"val-line",x=N.bold?"val-line__label val-line__label--bold":"val-line__label",g=N.bold?"val-line__value val-line__value--bold":"val-line__value",d=N.color||(N.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${B}"><span class="${x}">${P}</span><span class="${g}" style="color:${d}">${c(z)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${E("Cash & Reserves",l,{indent:!0})}
        ${E("Property",o,{indent:!0})}
        ${E("Equipment",r,{indent:!0})}
        ${E("Finance Receivables (Loans + Bonds)",y,{indent:!0})}
        ${E("Insurance Coverage (excluded)",f.insurance,{indent:!0,color:"var(--text-dim)"})}
        ${E("Total Assets",b,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${E("Outstanding Loans",k,{indent:!0})}
        ${E("Accounts Payable",I,{indent:!0})}
        ${E("Pending Project Costs",H,{indent:!0})}
        ${E("Total Liabilities",j,{bold:!0,color:"var(--red)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label">Reconciliation</span></div>
        ${E("Cash + Property + Equipment + Receivables - Liabilities",A.valuationBasis,{indent:!0})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${O>=0?"var(--green)":"var(--red)"};">${c(O)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${c(W)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${M?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${M?"var(--green)":"var(--red)"};">${M?"+":""}${c(G)}</span>
            </div>
            <div class="val-market__note">${M?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}async function Me(){const t=document.getElementById("slogan-input"),n=document.getElementById("slogan-hint"),e=document.getElementById("slogan-save-btn"),a=(t.value||"").trim().slice(0,60);if(a.length===0){n.textContent="Slogan cannot be empty.",n.className="slogan-hint slogan-hint--error";return}e.disabled=!0,e.textContent="...",n.textContent="";try{const{error:i}=await p.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(i)throw i;document.getElementById("id-slogan").textContent='"'+a+'"',n.textContent="Slogan saved! Next change in 120 ticks.",n.className="slogan-hint slogan-hint--ok",e.textContent="Save"}catch(i){console.error("Slogan save failed:",i),n.textContent="Failed to save slogan.",n.className="slogan-hint slogan-hint--error",e.disabled=!1,e.textContent="Save"}}async function Le(){await p.auth.signOut(),window.location.href="login.html"}function Ne(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function Ie(t,n){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),n==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",t=>{const n=document.getElementById("faction-switcher"),e=document.getElementById("corp-faction-dropdown");e&&n&&!n.contains(t.target)&&e.classList.remove("open")});window.doLogout=Le;async function Re(t){const n=t.target.files?.[0];if(!n)return;if(n.size>128*1024){alert("Logo must be under 128KB.");return}const e=window._corpFactionId;if(!e)return;const a=document.getElementById("corp-logo-label");a&&(a.textContent="Uploading...");try{const i=n.name.split(".").pop()||"png",r=`party-logos/${e}/${Date.now()}.${i}`,{error:s}=await p.storage.from("public-assets").upload(r,n,{contentType:n.type,upsert:!0});if(s)throw s;const{data:l}=p.storage.from("public-assets").getPublicUrl(r),o=l?.publicUrl||null;await p.from("factions").update({custom_logo_url:o}).eq("id",e);const f=document.getElementById("id-logo");f&&(f.innerHTML=`<img src="${o}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`);const y=document.getElementById("corp-logo");y&&(y.innerHTML=`<img src="${o}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`),a&&(a.textContent="Change Logo")}catch(i){console.error("Logo upload failed:",i),alert("Upload failed: "+(i.message||"Unknown error")),a&&(a.textContent="Upload Logo")}}window.saveSlogan=Me;window.toggleCorpDropdown=Ne;window.switchToFaction=Ie;let wt=!1;function qe(t,n,e,a){if(wt)return;const i=window._nationStats,s=1+(pt(i,"inflation")-50)/100*.3,l=Math.max(.1,a/100),o=Math.round(e*s*l),f=document.getElementById("prop-modal-overlay"),y=document.getElementById("prop-modal-content");y.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${v(n)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${c(e)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Inflation Modifier</span>
                <span style="color:var(--amber, #b09a5b);">${s.toFixed(3)}x</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Condition</span>
                <span style="color:${a>=75?"var(--green)":a>=50?"var(--amber)":"var(--red)"};">${a}%</span>
            </div>
            <div style="border-top:1px solid var(--border-hair);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-mono);font-weight:700;">
                <span style="color:var(--text-primary);">Sale Price</span>
                <span style="color:var(--gold, #c8a832);">${c(o)}</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-sell-confirm" onclick="confirmSellProperty('${t}', ${o})">Confirm Sale</button>
        </div>
    `,f.style.display="flex"}async function Pe(t,n){if(wt)return;wt=!0;const e=document.getElementById("prop-sell-confirm");e&&(e.disabled=!0,e.textContent="Selling...");try{const a=window._corpFactionId;if(!a)throw new Error("No faction");const{error:i}=await p.from("corp_properties").update({is_active:!1}).eq("id",t).eq("faction_id",a);if(i)throw new Error("Failed to sell property: "+i.message);const{data:r}=await p.from("factions").select("corp_cash_reserves").eq("id",a).single(),s=Number(r?.corp_cash_reserves??0),{error:l}=await p.from("factions").update({corp_cash_reserves:s+n}).eq("id",a);l&&console.error("[Property] Failed to credit cash:",l.message),Et(),alert("Property sold for "+c(n)+". Cash credited."),location.reload()}catch(a){alert("Sale failed: "+a.message)}finally{wt=!1,e&&(e.disabled=!1,e.textContent="Confirm Sale")}}let $t=!1;function Se(t,n,e,a,i){if($t)return;const r=window._nationStats,s=window._factionData,o=1+(pt(r,"inflation")-50)/100*.3,f=be({purchase_price:a,refurbish_count:i},o),b=Number(s?.corp_cash_reserves??0)>=f,k=document.getElementById("prop-modal-overlay"),R=document.getElementById("prop-modal-content"),I=b&&e<95;let H="";e>=95?H='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property already at excellent condition ('+e+"%).</div>":b||(H='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>'),R.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${v(n)} — Refurbishment #${i+1} — Current Condition: ${e}%</div>
        ${H}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost${i>0?` (1.25<sup>${i}</sup> ×)`:""}</span>
                <span style="color:${b?"var(--gold, #c8a832)":"var(--red)"};">${c(f)}</span>
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
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${t}', ${a}, ${i}, ${e})" ${I?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,k.style.display="flex"}async function ze(t,n,e,a){if($t)return;$t=!0;const i=document.getElementById("prop-refurb-confirm");i&&(i.disabled=!0,i.textContent="Starting...");try{const r=window._corpFactionId,s=window._currentTick,l=window._factionData,o=window._nationStats;if(!r)throw new Error("No faction");const y=1+(pt(o,"inflation")-50)/100*.3,k=await xe(p,r,{id:t,purchase_price:n,refurbish_count:e,condition:a},s,y);if(!k.ok)throw new Error(k.error||"Refurbishment failed.");l&&(l.corp_cash_reserves=k.newCash),Et(),alert(`Refurbishment started! Duration: ${k.duration} ticks. Target condition: ${k.targetCondition}%. Cost: ${c(k.cost)}.`),location.reload()}catch(r){alert("Refurbishment failed: "+r.message)}finally{$t=!1,i&&(i.disabled=!1,i.textContent="Begin Refurbishment")}}function Et(){const t=document.getElementById("prop-modal-overlay");t&&(t.style.display="none")}window.showSellModal=qe;window.confirmSellProperty=Pe;window.showRefurbishModal=Se;window.confirmRefurbish=ze;window.closePropModal=Et;window.showConvertModal=Oe;window.confirmConvertProperty=Fe;let Pt=!1;async function Ae(t,n,e,a,i,r,s){if(!Pt&&confirm("Accept bid from "+e+`?

Bid Price: `+c(a)+`
Quality: `+i+`/100
Workers: `+r+`

This will award the contract. The project begins immediately.`)){Pt=!0;try{const{data:l}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),o=l?.current_tick||0,{error:f}=await p.from("contract_bids").update({status:"won"}).eq("id",n);if(f)throw f;const{error:y}=await p.from("contract_bids").update({status:"lost"}).eq("contract_id",t).neq("id",n);if(y)throw y;const{error:b}=await p.from("construction_contracts").update({status:"awarded",awarded_to_faction:s,awarded_at_tick:o}).eq("id",t);if(b)throw b;alert("Contract awarded to "+e+`!

Bid: `+c(a)+`
Project begins immediately.`),window._nationStats&&window._factionData&&V&&await At(window._nationStats,window._nationStats?.name||"",window._factionData,V)}catch(l){alert("Failed to accept bid: "+(l.message||l))}finally{Pt=!1}}}window.cpAcceptBid=Ae;function Be(t){const n=document.getElementById("cp-bid-"+t);n&&(n.style.display=n.style.display==="none"?"":"none")}window.cpToggleBid=Be;let kt="branch_office";function Oe(t,n,e){const a=(_?.corp_subsector||"").toLowerCase(),i=a==="banking"?[["branch_office","Branch Office"]]:a==="investment"?[["trading_floor","Trading Floor"]]:a==="insurance"?[["claims_office","Claims Office"],["insurance_office","Insurance Office"]]:[];if(i.length===0)return;kt=i[0][0];const r=Math.round(e*.15),s=Math.floor(Math.random()*6)+4,l=document.getElementById("prop-modal-overlay"),o=document.getElementById("prop-modal-content");o.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Convert Property</div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:10px;">${v(n)}</div>
        <div style="display:flex;gap:4px;margin-bottom:10px;">
            ${i.map(([f,y])=>`<span onclick="_convertTargetType='${f}';document.querySelectorAll('.conv-opt').forEach(e=>e.style.background='transparent');this.style.background='rgba(138,106,170,0.15)'" class="conv-opt" style="flex:1;text-align:center;padding:6px;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(138,106,170,0.3);color:#8a6aaa;${f===kt?"background:rgba(138,106,170,0.15)":""}">${y}</span>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Cost</span>
            <span style="color:var(--gold);">${c(r)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Time</span>
            <span style="color:var(--text-bright);">${s} ticks</span>
        </div>
        <div style="font-size:8px;color:var(--text-dim);margin:8px 0;font-family:var(--font-mono);line-height:1.5;">Property will be offline during conversion. No revenue or workforce allocation until complete.</div>
        <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button class="prop-action-btn prop-action-btn--sell" onclick="closePropModal()">Cancel</button>
            <button class="prop-action-btn" style="background:rgba(138,106,170,0.12);border-color:rgba(138,106,170,0.3);color:#8a6aaa;" onclick="confirmConvertProperty('${t}',${r},${s})">Convert</button>
        </div>
    `,l.style.display="flex"}async function Fe(t,n,e){const a=Number(_?.corp_cash_reserves??0);if(a<n){alert("Insufficient cash. Need "+c(n)+".");return}const{data:i,error:r}=await p.from("corp_properties").select("role").eq("id",t).single();if(r){alert("Conversion failed: "+r.message);return}if(i?.role==="subsidiary"){alert("Subsidiary HQs cannot be converted.");return}const s=V?.current_tick||0;try{await p.from("factions").update({corp_cash_reserves:Math.max(0,a-n)}).eq("id",_.id),_.corp_cash_reserves=Math.max(0,a-n),await p.from("corp_properties").update({type:kt,role:kt,refurbish_until_tick:s+e,condition:100}).eq("id",t),Et();const l=window._nationStats;await At(l,l?.name||_?.nation,_,V)}catch(l){alert("Conversion failed: "+l.message)}}const Wt={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},Vt={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},De={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let gt="nation",yt="local",st=null;function Ue(t){return t?t.replace(/_/g," ").replace(/\b\w/g,n=>n.toUpperCase()):""}function Bt(t,n){if(!t)return"<em>Unknown</em>";const e=v(t);return n?`<span style="color:${n.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${e}</span>`:`<strong>${e}</strong>`}function Gt(t,n,e){const a=t.factions?.nation_id===(t.nation_id||n),i=t.proposer_name||(a?t.factions?.faction_name:null)||"A former party",r=t.proposer_color||(a?t.factions?.party_color:null);return{fired_at_tick:t.proposed_tick,event_name:t.bill_name,_desc_html:`${Bt(i,r)} proposed "${v(t.bill_name)}"`,category:"bill",_synthetic:!0,...e}}function Kt(t,n){const e=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:null,a=e?` led by <strong>${v(e)}</strong>`:"";return{fired_at_tick:0,event_name:t.faction_name,_desc_html:`${Bt(t.faction_name,t.party_color)} founded${a}`,category:"new_party",_synthetic:!0,_created_at:t.created_at,...n}}function Yt(t,n){const e=De[t.tier]||`Tier ${t.tier}`,a=t.demand_label?` demanding "${v(t.demand_label)}"`:"",i=t.status==="crisis_active",r=t.tier>=6?"#e74c3c":t.tier>=4?"#f39c12":"",s=r?`<span style="color:${r};font-weight:600">${v(e)}</span>`:`<strong>${v(e)}</strong>`;return{fired_at_tick:t.tick_resolved||t.tick_called,event_name:e,_desc_html:`${Bt(t.factions?.faction_name,t.factions?.party_color)} organised a protest${a} — ${s}${i?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...n}}function Qt(t,n,e,a,i){return[...t.map(r=>({...r,_synthetic:!1})),...n,...e,...a].sort((r,s)=>{const l=(s.fired_at_tick||0)-(r.fired_at_tick||0);if(l!==0)return l;const o=r._created_at||r.created_at||"",f=s._created_at||s.created_at||"";return f>o?1:f<o?-1:0}).slice(0,i)}function Xt(t){if(t._synthetic&&t._desc_html)return t._desc_html;const n=t.description_chosen||t.description_used||"",e=Ue(t.event_name),a=e?`<strong>${v(e)}</strong>`:"",i=n?v(n):"";return a&&i?`${a} — ${i}`:i||a||"Event"}function Jt(t){return t.map(n=>{const e=Ct(n.fired_at_tick),a=Wt[(n.category||"").toLowerCase()]||Vt;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${v(e)}</span>
            <span class="corp-ev-icon" style="color:${a.color}">${a.icon}</span>
            <span class="corp-ev-text">${Xt(n)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}const Ht=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function He(t){let n=0;for(let e=0;e<t.length;e++)n=(n<<5)-n+t.charCodeAt(e)|0;return Ht[Math.abs(n)%Ht.length]}function Zt(t){return t.map(n=>{const e=Ct(n.fired_at_tick),a=Wt[(n.category||"").toLowerCase()]||Vt,i=n.nations?.name||"Unknown",r=n.nations?.nation_profiles,s=Array.isArray(r)?r[0]?.flag_url:r?.flag_url,l=He(i),o=s?`<img src="${v(s)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${v(e)}</span>
                <span class="corp-ev-nation-badge" style="color:${l.color};background:${l.bg};border-color:${l.border};">${o}${v(i)}</span>
            </span>
            <span class="corp-ev-text">${Xt(n)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}async function je(){const t=document.getElementById("corp-events-list");if(!t||!st)return;const{nationId:n}=st;if(!n){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[e,a]=await Promise.all([p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").eq("nation_id",n).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),p.from("event_log").select("*").eq("nation_id",n).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=e.data||[],r=a.data||[],s=i.map(o=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${o.faction_name} [${o.corp_ticker||o.abbreviation||"??"}] was founded with a specialty in ${o.corp_subsector||o.corp_sector||"General"}. Led by CEO ${[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:o.founded_tick||0})),l=[...r,...s].sort((o,f)=>(f.fired_at_tick||0)-(o.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events in this nation yet.</div>';return}t.innerHTML=Jt(l)}catch(e){console.error("Corp local events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function We(){const t=document.getElementById("corp-events-list");if(!t||!st)return;const{nationId:n}=st;if(!n){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[e,a]=await Promise.all([p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",n).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),p.from("event_log").select("*, nations(name, nation_profiles(flag_url))").neq("nation_id",n).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=e.data||[],r=a.data||[],s=i.map(o=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${o.faction_name} [${o.corp_ticker||o.abbreviation||"??"}] was founded in ${o.nation||"Unknown"} with a specialty in ${o.corp_subsector||o.corp_sector||"General"}. Led by CEO ${[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:o.founded_tick||0,nations:{name:o.nation||"Unknown"}})),l=[...r,...s].sort((o,f)=>(f.fired_at_tick||0)-(o.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=Zt(l);return}catch(e){console.error("Corp world events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>';return}try{const{data:e,error:a}=await p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",n).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(a)throw a;if(!e||e.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=Ve(e,!0)}catch(e){console.error("Corp world events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function Ve(t,n){return t.map(e=>{const a=[e.leader_first_name,e.leader_last_name].filter(Boolean).join(" ")||"Unknown",i=e.nation||"Unknown",r=e.corp_subsector||e.corp_sector||"General",s=e.corp_ticker||e.abbreviation||"",l=e.founded_tick?Ct(e.founded_tick):"";let o='<div class="corp-event-row">';return o+='<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--teal);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);padding:1px 5px;display:inline-block;margin-bottom:2px;">'+v(i.toUpperCase())+"</div>",o+='<div style="font-size:11px;color:var(--text-primary);line-height:1.5;">',o+='<span style="font-weight:600;">'+v(e.faction_name)+"</span>",s&&(o+=' <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">['+v(s)+"]</span>"),o+=' was founded in <span style="font-weight:500;">'+v(i)+"</span>",o+=' with a specialty in <span style="color:var(--teal);font-weight:500;">'+v(r)+"</span>.",o+=' Led by CEO <span style="font-weight:500;">'+v(a)+"</span>.",o+="</div>",l&&(o+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">'+v(l)+"</div>"),o+="</div>",o}).join("")}async function te(){const t=document.getElementById("corp-events-list");if(!t||!st)return;const{nationId:n}=st;if(!n){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[e,a,i,r]=await Promise.all([p.from("event_log").select("*").eq("nation_id",n).order("fired_at_tick",{ascending:!1}).limit(50),p.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",n).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",n).order("created_at",{ascending:!1}).limit(20),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",n).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(e.error)throw e.error;const s=e.data||[],l=Qt(s,(a.data||[]).map(o=>Gt(o,n)),(i.data||[]).map(o=>Kt(o)),(r.data||[]).map(o=>Yt(o)),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>';return}t.innerHTML=Jt(l)}catch(e){console.error("Nation events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function Ge(){const t=document.getElementById("corp-events-list");if(!t||!st)return;const{nationId:n}=st;if(!n){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[e,a,i,r]=await Promise.all([p.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).order("fired_at_tick",{ascending:!1}).limit(60),p.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).order("created_at",{ascending:!1}).limit(15),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(e.error)throw e.error;const s=e.data||[],l=Qt(s,(a.data||[]).map(o=>Gt(o,null,{nations:o.nations})),(i.data||[]).map(o=>Kt(o,{nations:o.nations})),(r.data||[]).map(o=>Yt(o,{nations:o.nations})),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>';return}t.innerHTML=Zt(l)}catch(e){console.error("World events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}window.switchCorpEventsCat=function(t){t!==gt&&(gt=t,document.querySelectorAll("#corp-events-cat-bar .corp-events-tab").forEach(n=>n.classList.toggle("active",n.dataset.cat===t)),ee())};window.switchCorpEventsScope=function(t){t!==yt&&(yt=t,document.querySelectorAll("#corp-events-scope-bar .corp-events-tab").forEach(n=>n.classList.toggle("active",n.dataset.scope===t)),ee())};function ee(){gt==="nation"&&yt==="local"?te():gt==="nation"&&yt==="world"?Ge():gt==="corporate"&&yt==="local"?je():We()}he();
