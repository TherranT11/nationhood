const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-5lTmaM1a.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as p}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as re}from"./preload-helper-BXl3LOEh.js";import{e as _,t as Nt}from"./utils-CY90Gazr.js";import{initMessaging as se}from"./messaging-BUrQna7p.js";import{c as le}from"./equipment-DsuDdEne.js";import{c as ce,a as de,b as pe}from"./corp-valuation-CgQIQIJ1.js";let _t=[],v=null,K=null;function d(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(2)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(1)+"k":"$"+Math.round(t).toLocaleString()}function pt(t,n){return Number(t?.[n]??50)}async function fe(){const{data:{user:t}}=await p.auth.getUser();if(!t){window.location.href="login.html";return}const{data:n}=await p.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);_t=(n||[]).filter(w=>w.nation_id&&!w.abandoned_at);const e=sessionStorage.getItem("active_faction_id");if(v=_t.find(w=>w.id===e)||_t.find(w=>w.faction_type==="corporation")||_t[0],!v){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",v.id),v.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i={Construction:"corp-operations.html",Finance:"corp-operations-finance.html",Shipping:"corp-operations.html"}[v.corp_sector]||"corp-operations.html",s=document.getElementById("nav-operations"),r=document.getElementById("nav-expansion");s&&(s.href=i),r&&(r.href="corp-operations.html?tab=expansion");let l=v.nation||"",o=null;const[c,m]=await Promise.all([v.nation_id?p.from("nations").select("*").eq("id",v.nation_id).single():Promise.resolve({data:null}),p.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);c.error&&console.warn("Nation load failed:",c.error.message),c.data&&(l=c.data.name,o=c.data),m.error&&console.warn("Shard load failed:",m.error.message),K=m.data;let g=0;if(v?.id){const{data:w}=await p.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",v.id).in("status",["open","bidding"]);if(w)for(const y of w)g+=(y.contract_bids||[]).length}const $=document.getElementById("corp-topbar-container");if($){const{renderCorpTopBar:w}=await re(async()=>{const{renderCorpTopBar:P}=await import("./corp-topbar-5lTmaM1a.js");return{renderCorpTopBar:P}},__vite__mapDeps([0,1])),y={};g>0&&(y.home={color:"#c8a832",title:g+" pending bid"+(g!==1?"s":"")+" on your projects"}),w($,{faction:v,shard:K,activeTab:"home",allUserFactions:_t,badges:y})}document.getElementById("id-type-badge").textContent=v.corp_company_type||"—";const N=document.getElementById("id-logo"),F=(v.corp_ticker||v.abbreviation||"").toUpperCase();v.custom_logo_url?N.innerHTML=`<img src="${_(v.custom_logo_url)}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`:N.textContent=F.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=v.faction_name||"Unnamed Corp";const B=v.party_description||"";document.getElementById("id-slogan").textContent=B?'"'+B+'"':'"--"';const j=K?.current_date?K.current_date.replace(/.*,\s*/,""):"—",q=v.leader_first_name&&v.leader_last_name?v.leader_first_name+" "+v.leader_last_name+(v.leader_age?" ("+v.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${_(j)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${_(l||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${_(v.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${_(v.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${_(q)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${_(v.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${_(F)}</span>
        </div>
    `;const S=v.last_rename_tick||0,D=K?.current_tick||0,k=Math.max(0,S+120-D),O=!B||B==="-"||B==='"-"'||k<=0,U=document.getElementById("slogan-editor");U.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${_(B)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${O?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${O?"60 characters max. 120 tick cooldown after change.":k+" ticks until you can change slogan."}</div>
    `;const I=document.getElementById("corp-logo-upload");I.innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Logo</span>
            <label class="id-row__value" style="cursor:pointer;text-decoration:underline;" id="corp-logo-label">
                ${v.custom_logo_url?"Change Logo":"Upload Logo"}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" id="corp-logo-file" style="display:none;">
            </label>
        </div>
    `,document.getElementById("corp-logo-file")?.addEventListener("change",$e),window._corpFactionId=v.id,window._currentTick=D,window._nationStats=o,window._factionData=v;const H=ve(o,l,v);ge(l,v);const T=await Rt(o,l,v,K);let b=0;if(v?.id){const{data:w,error:y}=await p.from("corp_equipment").select("equipment_key, owned").eq("faction_id",v.id);y||(b=le(w||[]))}let f=0;if(v?.id){const{data:w}=await p.from("corp_executives").select("salary_per_year").eq("faction_id",v.id).eq("status","active");f=(w||[]).reduce((y,P)=>y+(Number(P.salary_per_year)||0),0)}let G=0,A=0;if(v?.id&&v.corp_sector==="Shipping"){const{data:w}=await p.from("corp_vessels").select("base_maintenance, purchase_price, condition, built_at_tick, status").eq("faction_id",v.id).neq("status","for_sale");G=(w||[]).reduce((y,P)=>y+(Number(P.base_maintenance)||0),0),A=ce(w,D)}await _e(o,K,H,v,T.propertyMaintenance||0,b,f,T,G),await ye(o,l,v,H,T,A),se(v,o,K),at={nationId:v.nation_id},Kt(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function ve(t,n,e){const a=b=>pt(t,b),i=(n||"UNKNOWN").toUpperCase(),s=Number(e?.corp_general_workforce??2250),r=Number(e?.corp_skilled_workforce??600),l=Number(e?.corp_innovative_workforce??150),o=s+r+l,c=2,m=3,g=6,$=a("minimum_wage"),N=$/100*48e3,F=a("inflation"),B=a("standard_of_living"),j=1+(F-50)/100*.5,q=1+(B-50)/100*.5,S=b=>Math.round(N*b*j*q),D=S(c),Q=S(m),k=S(g),C=s*D,O=r*Q,U=l*k,I=C+O+U;function H(b){return"$"+Math.round(b).toLocaleString()+"/yr"}const T=`${j.toFixed(2)} &times; ${q.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=o.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${_(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${s.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${c}.0 &times; ${T})</span>
                <span class="wf-tier__value">${H(D)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(C)}</span>
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
                <span class="wf-tier__label">Wage (min &times; ${m}.0 &times; ${T})</span>
                <span class="wf-tier__value">${H(Q)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(O)}</span>
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
                <span class="wf-tier__value">${H(k)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(U)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${_(i)})</span>
                <span class="wf-tier__value">${$}/100 → ${H(N)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${j.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${q.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${o.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${d(I)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${d(I/12)}</span>
            </div>
        </div>
    `,{totalWages:I,generalTotal:C,skilledTotal:O,innovativeTotal:U,monthlyWages:Math.round(I/12)}}async function _e(t,n,e,a,i,s,r,l,o){const c=n?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+c;const m=87e6,g=u=>pt(t,u),$=1+(g("gdp_growth")-50)/100*.4,N=1+(g("urbanization")-50)/100*.3,F=1+(g("population_growth")-50)/100*.2,B=1+(g("standard_of_living")-50)/100*.15,j=1+(50-g("physical_infrastructure"))/100*.1,q=1-Math.max(0,g("inflation")-50)/100*.1,S=1-Math.max(0,g("interest_rates")-50)/100*.1,D=$*N*F*B*j*q*S,Q=Math.round(m*D),k=(a.corp_general_workforce||0)+(a.corp_skilled_workforce||0)+(a.corp_innovative_workforce||0),C=Math.max(500,l?.totalCapacity||500),O=Math.min(1,k/C),U=l?.propertyRevBonus||0,I=Math.round(Math.round(Q/12)*O)+U;let H=0,T=0,b=0,f=0,G=0,A=0,w=0,y=0,P=0;if(a?.id){const u=a.corp_sector||"";if(u==="Finance"){const{data:z}=await p.from("finance_active_loans").select("monthly_payment, payments_made, total_paid, total_interest_paid, interest_rate, remaining_principal, finance_loan_requests(request_type)").eq("lender_faction_id",a.id).in("status",["current","late","delinquent"]);for(const h of z||[]){const M=h.finance_loan_requests?.request_type||"loan";if(M==="insurance"){const E=Number(h.monthly_payment||0);T+=E,y+=E}else if(M==="loan"){const E=Number(h.monthly_payment||0);G+=E;const W=Math.max(0,Number(h.remaining_principal||0)),nt=h.interest_rate/100/12,R=Math.max(0,Math.min(E,Math.round(W*nt))),V=Math.max(0,E-R);T+=R,b+=R,f+=V;const yt=Number(h.payments_made||0),ae=Number(h.total_paid||0),oe=E*yt,Bt=Math.max(0,ae||oe),ie=Math.max(0,Math.min(Bt,Number(h.total_interest_paid||0)));A+=Bt,w+=ie}else M==="bond"&&(T+=Number(h.monthly_payment||0))}}else if(u==="Construction"){const{data:z}=await p.from("construction_contracts").select("id, budget_ceiling, timeline_ticks").eq("awarded_to_faction",a.id).eq("status","in_progress"),h=[];for(const M of z||[])T+=Math.round((M.budget_ceiling||0)/(M.timeline_ticks||1)),M.id&&h.push(M.id);if(h.length>0){const{data:M}=await p.from("contract_bids").select("contract_id, estimated_cost").in("contract_id",h).eq("status","won"),E={};for(const W of M||[])E[W.contract_id]=Number(W.estimated_cost||0);for(const W of z||[]){const nt=E[W.id]||0;P+=Math.round(nt/Math.max(1,W.timeline_ticks||1))}}}else if(u==="Shipping"){const{data:z}=await p.from("shipping_claims").select("revenue_per_transit").eq("faction_id",a.id).eq("status","active");for(const h of z||[])T+=Number(h.revenue_per_transit||0)}}let X=[],Y=0;try{const{data:u}=await p.from("corp_properties").select("id, nation_id, nations!nation_id(name)").eq("faction_id",a.id).eq("type","fuel_depot").eq("is_active",!0);if(u&&u.length>0){const z=u.map(h=>h.nation_id).filter(Boolean);if(z.length>0){const{data:h}=await p.from("shipping_claims").select("faction_id, shipping_routes!inner(destination_nation_id, status)").eq("status","active").in("shipping_routes.destination_nation_id",z),M=[...new Set((h||[]).map(R=>R.faction_id).filter(R=>R&&R!==a.id))],E=new Set;if(M.length>0){const{data:R}=await p.from("corp_properties").select("faction_id, nation_id").in("faction_id",M).in("nation_id",z).eq("type","fuel_depot").eq("is_active",!0);for(const V of R||[])E.add(V.faction_id+"|"+V.nation_id)}const W={};for(const R of h||[]){const V=R.shipping_routes?.destination_nation_id;V&&R.faction_id!==a.id&&(E.has(R.faction_id+"|"+V)||(W[V]=(W[V]||0)+1))}const nt=7500;for(const R of u){const V=W[R.nation_id]||0,yt=V*nt;X.push({nation:R.nations?.name||"Unknown",revenue:yt,visitors:V}),Y+=yt}X.sort((R,V)=>V.revenue-R.revenue)}}}catch(u){console.warn("Fuel depot revenue estimate failed (non-fatal):",u?.message||u)}const ct=H+T+I+Y,gt=e?.totalWages||0,ft=Math.round(gt/12),L=0,x=i||0,rt=s||0,Z=Number(a?.corp_loans)||0,st=.05,tt=Z>0?Math.round(Z*(st/12)/(1-Math.pow(1+st/12,-120))):0;let J=0,et=0;if(a?.id)try{const{data:u}=await p.from("finance_active_loans").select("monthly_payment, finance_loan_requests(request_type)").eq("borrower_faction_id",a.id).in("status",["current","late","delinquent"]);for(const z of u||[]){const h=z.finance_loan_requests?.request_type||"loan",M=Number(z.monthly_payment||0);if(!(M<=0))if(h==="insurance")et+=M;else{if(h==="bond")continue;J+=M}}}catch(u){console.warn("[Finances] borrower finance_active_loans lookup failed:",u)}const ot=Math.round((r||0)/12),vt=o||0,wt=75e3,it=Math.max(0,Math.min(1,Number(t?.corporate_tax??0)/100||0)),lt=ft+ot+L+x+rt+vt+tt+J+et+P+wt,St=Math.max(0,ct-lt),Pt=Math.round(St*it);let $t="";try{const u=new Set([a.nation_id]),{data:z}=await p.from("corp_properties").select("nation_id").eq("faction_id",a.id).eq("is_active",!0);if((z||[]).forEach(h=>{h.nation_id&&u.add(h.nation_id)}),u.size>0){const{data:h}=await p.from("nations").select("id, name, corporate_tax").in("id",[...u]);h&&h.length>0&&($t=h.sort((M,E)=>(M.name||"").localeCompare(E.name||"")).map(M=>{const E=Math.round(Number(M.corporate_tax??0)),W=Math.round(St*(E/100)/h.length),nt=E>25?"#c55":E>15?"#ca5":"#5c5";return`<div style="display:flex;justify-content:space-between;padding:1px 0;font-family:var(--font-mono);font-size:8px;">
                        <span style="color:var(--text-dim);">${M.name} (<span style="color:${nt}">${E}%</span>)</span>
                        <span style="color:#a44;">${d(W)}</span>
                    </div>`}).join(""))}}catch{}const zt=lt+Pt,kt=ct-zt,dt=Number(a?.corp_cash_reserves??0),Qt=Z,Ct=G-(b+f),Xt=Math.abs(Ct)>.01,Jt=[{stat:"gdp_growth",value:g("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:g("urbanization"),weight:"0.3"},{stat:"population_growth",value:g("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:g("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:g("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:g("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:g("interest_rates"),weight:"-0.1",neg:!0}];function Zt(u){return u.neg?u.value>50?"var(--red)":"var(--green)":u.note?u.value<50?"var(--green)":"var(--red)":u.value>=50?"var(--green)":u.value>=35?"var(--amber)":"var(--red)"}const Et=ct||1,te=(H/Et*100).toFixed(1),ee=((T+Y)/Et*100).toFixed(1),ne=(I/Et*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue <span title="Accounting rule: loan interest and insurance premiums count as revenue. Loan principal repayments increase cash but are not revenue or profit." style="font-size:8px;color:var(--text-dim);font-family:var(--font-mono);text-transform:none;letter-spacing:0;">[?]</span></div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${te}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${ee}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${ne}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${d(H)}</span></div>
            <div class="fin-row"><span class="fin-row__label" title="Private operating revenue includes contracts plus loan interest and insurance premiums only; principal repayments are excluded.">Private Operating Revenue (contracts + loan interest/premiums only)</span><span class="fin-row__value" style="color:var(--green)">${d(T)}</span></div>
            ${a?.corp_sector==="Finance"?'<div style="padding:5px 12px 2px 12px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.4px;text-transform:uppercase;">P&L revenue</div>':""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Interest portion of this tick's loan payments recognized as operating revenue in P&L.">Loan Interest Revenue (this tick) <span class="fin-row__badge">REVENUE</span></span><span class="fin-row__value" style="color:var(--green)">${d(b)}</span></div>`:""}
            ${a?.corp_sector==="Finance"&&y>0?`<div class="fin-row"><span class="fin-row__label" title="Insurance premiums collected this tick are recognized as operating revenue in P&L.">Insurance Premium Revenue (this tick) <span class="fin-row__badge">REVENUE</span></span><span class="fin-row__value" style="color:var(--green)">${d(y)}</span></div>`:""}
            ${a?.corp_sector==="Finance"?'<div style="padding:5px 12px 2px 12px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.4px;text-transform:uppercase;">Non-revenue cash movements</div>':""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Principal repayment increases cash and reduces the loan receivable. It is not revenue or profit.">Loan Principal Repaid (this tick) <span class="fin-row__badge">ASSET→CASH</span></span><span class="fin-row__value" style="color:var(--text-bright)">${d(f)}</span></div>`:""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Loan cash collected this tick equals interest plus principal.">Loan Cash Collected (this tick) <span class="fin-row__badge">CASH</span></span><span class="fin-row__value" style="color:var(--text-bright)">${d(b+f)}</span></div>`:""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Checks this tick's scheduled loan payments against computed split. Portfolio Scheduled Loan Payments = Interest Revenue + Principal Repaid.">Loan Payment Reconciliation (this tick) <span class="fin-row__badge">CHECK</span></span><span class="fin-row__value" style="color:${Xt?"var(--red)":"var(--text-bright)"}">${d(G)} = ${d(b)} + ${d(f)} (Δ ${Ct>=0?"+":"-"}${d(Math.abs(Ct))})</span></div>`:""}
            ${a?.corp_sector==="Finance"?'<div style="padding:5px 12px 2px 12px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.4px;text-transform:uppercase;">Lifetime portfolio totals</div>':""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Portfolio cumulative cash from loans. Loan cash collected = interest + principal.">Loan Cash Collected (to date) <span class="fin-row__badge">PORTFOLIO</span></span><span class="fin-row__value" style="color:var(--text-bright)">${d(A)}</span></div>`:""}
            ${a?.corp_sector==="Finance"?`<div class="fin-row"><span class="fin-row__label" title="Portfolio cumulative interest portion collected from loans.">Loan Interest (to date) <span class="fin-row__badge">PORTFOLIO</span></span><span class="fin-row__value" style="color:var(--green)">${d(w)}</span></div>`:""}
            ${a?.corp_sector==="Finance"?'<div style="padding:2px 12px 4px 12px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.2px;">Principal repayment increases cash but does not increase profit.</div>':""}
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${d(I-U)}</span></div>
            ${U>0?`<div class="fin-row"><span class="fin-row__label">Property Revenue<span class="fin-row__badge">BUILDINGS</span></span><span class="fin-row__value" style="color:var(--green)">${d(U)}</span></div>`:""}
            ${X.map(u=>`<div class="fin-row"><span class="fin-row__label">Fuel Depot (${u.nation})<span class="fin-row__badge">${u.visitors} visitor${u.visitors!==1?"s":""}</span></span><span class="fin-row__value" style="color:var(--green)">${d(u.revenue)}</span></div>`).join("")}
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${d(ct)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${d(ft)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Executive Compensation</span><span class="fin-row__value" style="color:#a44">${d(ot)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${d(L)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${d(x)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${d(rt)}</span></div>
            ${vt>0?`<div class="fin-row"><span class="fin-row__label">Fleet Maintenance</span><span class="fin-row__value" style="color:#a44">${d(vt)}</span></div>`:""}
            ${P>0?`<div class="fin-row"><span class="fin-row__label">Project Build Costs</span><span class="fin-row__value" style="color:#a44">${d(P)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${d(tt)}</span></div>
            ${J>0?`<div class="fin-row"><span class="fin-row__label">Loan Repayments</span><span class="fin-row__value" style="color:#a44">${d(J)}</span></div>`:""}
            ${et>0?`<div class="fin-row"><span class="fin-row__label">Insurance Premiums</span><span class="fin-row__value" style="color:#a44">${d(et)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${d(Pt)}</span></div>
            ${$t?`<div style="padding:2px 12px 6px 20px;border-bottom:1px solid var(--border-hair);">${$t}</div>`:""}
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${d(zt)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${kt>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit <span title="Net Profit uses revenue rules above: loan interest counts, principal repayment does not." style="font-size:8px;color:var(--text-dim);font-family:var(--font-mono);text-transform:none;letter-spacing:0;">[?]</span></span>
            <span class="fin-net__value" style="color:${kt>=0?"var(--green)":"var(--red)"}">${d(kt)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${d(dt)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${d(Qt)}</div>
            </div>
        </div>
        <!-- Purchasing Power -->
        ${(()=>{const u=Number(t?.currency_strength??50),z=Number(t?.inflation??0),h=u/50,M=Math.max(.5,1-z/200),E=Math.round(dt*h*M),W=E>=dt?"var(--green)":E>=dt*.8?"var(--amber)":"var(--red)",nt=dt>0?Math.round(E/dt*100):100;return`<div style="padding:4px 14px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-hair);">
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.5px;text-transform:uppercase;">Purchasing Power</div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${W};">${d(E)}</span>
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${nt}% · CUR ${u} · INF ${Math.round(z)}</span>
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
            ${Jt.map(u=>`
                <div class="drv-row">
                    <span class="drv-row__name">${u.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${u.value}%;background:${Zt(u)}"></div></div>
                    <span class="drv-row__val">${u.value}</span>
                    <span class="drv-row__wt">&times;${u.weight}</span>
                    ${u.note?'<span class="drv-row__note">'+u.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${D.toFixed(2)}</span>
            </div>
        </div>
    `,It()}let Mt=!1;async function me(t,n){if(!(!v||Mt)){Mt=!0;try{const{data:e,error:a}=await p.from("finance_loan_offers").select("*").eq("id",t).single();if(a||!e)return;const{data:i,error:s}=await p.from("finance_loan_requests").select("*").eq("id",n).single();if(s||!i||i.status!=="open")return;const r=e.interest_rate/100/12,l=i.term_months,o=r>0?Math.round(i.amount*r/(1-Math.pow(1+r,-l))):Math.round(i.amount/l),c=K?.current_tick||0,{error:m}=await p.from("finance_loan_requests").update({status:"funded",accepted_offer_id:t,funded_tick:c}).eq("id",n);if(m)return;await p.from("finance_loan_offers").update({status:"accepted"}).eq("id",t),await p.from("finance_loan_offers").update({status:"declined"}).eq("request_id",n).neq("id",t).eq("status","pending"),await p.from("finance_active_loans").insert({request_id:n,offer_id:t,borrower_faction_id:i.requesting_faction_id,lender_faction_id:e.offering_faction_id,nation_id:i.nation_id,principal:i.amount,interest_rate:e.interest_rate,term_months:i.term_months,collateral_type:e.collateral_type,purpose:i.purpose,monthly_payment:o,started_tick:c});const{data:g}=await p.from("factions").select("corp_cash_reserves").eq("id",e.offering_faction_id).single();g&&await p.from("factions").update({corp_cash_reserves:Math.max(0,(Number(g.corp_cash_reserves)||0)-i.amount)}).eq("id",e.offering_faction_id);const{data:$}=await p.from("factions").select("corp_cash_reserves, corp_debt").eq("id",i.requesting_faction_id).single();if($){const{error:N}=await p.from("factions").update({corp_cash_reserves:(Number($.corp_cash_reserves)||0)+i.amount,corp_debt:(Number($.corp_debt)||0)+i.amount}).eq("id",i.requesting_faction_id);N&&console.error("[Loans] Failed to credit borrower + track debt:",N.message)}}finally{Mt=!1}It()}}async function ue(t){await p.from("finance_loan_requests").update({status:"cancelled"}).eq("id",t),It()}async function It(){if(!v)return;const t=document.getElementById("fin-loans-list");if(t)try{const{data:n,error:e}=await p.from("finance_loan_requests").select("*, finance_loan_offers!request_id(*)").eq("requesting_faction_id",v.id).in("status",["open","funded"]).order("created_tick",{ascending:!1});e&&console.error("[Loans] Request query error:",e.message);const{data:a,error:i}=await p.from("finance_active_loans").select("*").eq("borrower_faction_id",v.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1});i&&console.error("[Loans] Active loans query error:",i.message);let s="";if(n&&n.length>0){for(const r of n)if(r.status==="open"){const l=(r.finance_loan_offers||[]).filter(o=>o.status==="pending");if(s+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span style="color:#5a8aaa;font-weight:700;">OPEN</span>
                            <span style="color:var(--text-primary);margin-left:4px;">${d(r.amount)}</span>
                            <span style="color:var(--text-dim);margin-left:4px;">${r.term_months}mo</span>
                        </div>
                        <span style="color:var(--text-dim);cursor:pointer;" onclick="cancelRequest('${r.id}')">&#10005;</span>
                    </div>
                    <div style="font-size:7px;color:var(--text-dim);margin-top:2px;">${_(r.purpose||"")}</div>`,l.length>0){s+=`<div style="margin-top:4px;font-size:7px;color:#5a8aaa;font-weight:700;">${l.length} OFFER${l.length>1?"S":""}</div>`;for(const o of l.sort((c,m)=>c.interest_rate-m.interest_rate))s+=`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-top:1px solid var(--border-hair);">
                            <span style="color:var(--text-primary);font-weight:700;">${o.interest_rate}%</span>
                            <span style="color:var(--text-dim);">${o.collateral_type}</span>
                            <span style="flex:1;"></span>
                            <span style="padding:2px 8px;cursor:pointer;color:#000;background:#5a8aaa;font-weight:700;font-size:7px;" onclick="acceptOffer('${o.id}','${r.id}')">ACCEPT</span>
                        </div>`}else s+='<div style="margin-top:2px;font-size:7px;color:var(--text-dim);">Awaiting offers from finance corporations...</div>';s+="</div>"}}if(a&&a.length>0)for(const r of a){const l=r.status==="current"?"var(--green)":r.status==="late"?"#c84":"#c55",o=r.term_months>0?Math.round(r.payments_made/r.term_months*100):0,c=Number(r.monthly_payment||0),m=Number(r.interest_rate||0)/100/12,g=Math.max(0,Number(r.remaining_principal||0)),$=Math.max(0,Math.min(c,Math.round(g*m))),N=Math.max(0,c-$);s+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="color:${l};font-weight:700;">${r.status.toUpperCase()}</span>
                        <span style="color:var(--text-primary);margin-left:4px;">${d(r.principal)}</span>
                        <span style="color:var(--text-dim);margin-left:4px;">@ ${r.interest_rate}%</span>
                    </div>
                    <span style="color:var(--text-dim);">${o}% repaid</span>
                </div>
                <div style="height:2px;background:var(--border-0);margin-top:3px;">
                    <div style="height:100%;width:${o}%;background:${l};"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Total Monthly Payment (cash collected): ${d(c)}/mo</span>
                    <span>${r.payments_made}/${r.term_months} payments</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:1px;font-size:7px;color:var(--text-dim);">
                    <span>Interest Portion (P&L revenue): ${d($)}</span>
                    <span>Principal Portion (asset repayment): ${d(N)}</span>
                </div>
            </div>`}s||(s='<div style="color:var(--text-dim);">No active loans.</div>'),t.innerHTML=s}catch(n){console.error("[Loans] loadLoansSection error:",n)}}window.acceptOffer=me;window.cancelRequest=ue;function ge(t,n){const e=(t||"").toUpperCase(),a=Number(n.corp_general_workforce??0)+Number(n.corp_skilled_workforce??0)+Number(n.corp_innovative_workforce??0),i=[{label:"Reputation",value:Number(n.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:a||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(n.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(n.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(n.corp_market_share??5),change:0,nation:e,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(n.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(n.corp_regulatory_standing??50),change:0,nation:e,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(n.corp_political_influence??10),change:0,decay:!0,nation:e,max:100},{label:"Innovation",value:Number(n.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function s(o,c){if(!c||c>100)return"var(--text-primary)";const m=o/c*100;return m>=70?"var(--green)":m>=40?"var(--amber)":m>=20?"var(--orange, #d48a3c)":"var(--red)"}function r(o){const c=parseFloat(o),m=c>0?"var(--green)":c<0?"var(--red)":"var(--text-dim)",g=c>0?"▲":c<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${m}">${g}</span>
            <span class="stat-item__delta" style="color:${m}">${Math.abs(c).toFixed(1)}</span>
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
                            ${r(o.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${Math.min(100,o.value)}%"></div></div>
                </div>`;continue}o.section&&(l+=`<div class="stats-section"><span class="stats-section__label">${o.section}</span></div>`);const c=o.max&&o.max<=100;l+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${o.label}</span>
                        ${o.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${o.nation?'<span class="stat-item__nation">'+_(o.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${c?s(o.value,o.max):"var(--text-primary)"}">${typeof o.value=="number"?c?Math.round(o.value):o.value.toLocaleString():o.value}</span>
                    ${c?'<span class="stat-item__max">/100</span>':""}
                    ${r(o.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=l}async function Rt(t,n,e,a){const i=(n||"UNKNOWN").toUpperCase();let s=[];if(e?.id){const{data:b}=await p.from("corp_properties").select("*").eq("faction_id",e.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});s=b||[]}const r={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,o=0;const c=Number(e?.corp_general_workforce??0)+Number(e?.corp_skilled_workforce??0)+Number(e?.corp_innovative_workforce??0),m=500,g=s.map(b=>{const f=Number(b.capacity||0),G=Number(b.condition||0)/100;return Math.floor(f*G)}),$=m+g.reduce((b,f)=>b+f,0),N=$>0?Math.min(c,Math.round(c*(m/$))):c,F=5e7,B=1+(pt(t,"inflation")-50)/100*.3,j=.8+pt(t,"stability")/100*.4,q=Math.round(F*B*j),S=Math.round(q*.005);l+=q,o+=S;let D=`
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
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${m}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${N.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${d(q)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${d(S)}</div>
            </div>
        </div>
    </div>`,Q=N;for(let b=0;b<s.length;b++){const f=s[b],G=r[f.style]||r.Basic;l+=Number(f.purchase_price||0),o+=Number(f.monthly_maintenance||0);const A=f.condition>=75?"var(--green)":f.condition>=50?"var(--amber)":"var(--orange)",w=Number(f.capacity||0),y=g[b]||0,P=$>0?Math.min(c-Q,Math.round(c*(y/$))):0;Q+=P,D+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${_(f.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${_(f.city||i)} · ${(f.type||"").replace(/_/g," ")} · <span style="color:${G.color}">${(f.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge" ${["branch_office","trading_floor","claims_office"].includes(f.type)?'style="background:rgba(138,106,170,0.12);color:#8a6aaa;border-color:rgba(138,106,170,0.3);"':""}>${["branch_office","trading_floor","claims_office"].includes(f.type)?f.type.replace(/_/g," ").replace(/\b\w/g,X=>X.toUpperCase()):"OWNED"}</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${w.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${P.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${d(f.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${d(f.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${A}">${f.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${f.condition}%;height:100%;background:${A};"></div></div>
            ${f.refurbish_until_tick&&f.refurbish_until_tick>(a?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${f.refurbish_until_tick-(a?.current_tick||0)} tick${f.refurbish_until_tick-(a?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${f.id}','${_(f.name).replace(/'/g,"\\'")}',${f.purchase_price||0},${f.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${f.id}','${_(f.name).replace(/'/g,"\\'")}',${f.condition},${w})">REFURBISH</button>
                ${e?.corp_sector==="Finance"&&(f.type==="office"||f.type==="regional_hq")&&!["branch_office","trading_floor","claims_office"].includes(f.type)?`<button class="prop-action-btn" style="background:rgba(138,106,170,0.08);border-color:rgba(138,106,170,0.2);color:#8a6aaa;" onclick="showConvertModal('${f.id}','${_(f.name).replace(/'/g,"\\'")}',${f.purchase_price||0})">CONVERT</button>`:""}
            </div>`}
        </div>`}let k="",C=[];if(e?.id){const{data:b}=await p.from("construction_contracts").select("*, contract_bids(id, faction_id, bid_price, estimated_quality, estimated_cost, labor_count, markup_pct, material_grades, submitted_at_tick, status, factions!faction_id(faction_name, abbreviation, corp_reputation))").eq("issuer_faction_id",e.id).in("status",["open","bidding","awarded","in_progress"]).order("generated_at_tick",{ascending:!1});C=b||[];let f={};const G=C.filter(A=>A.status==="in_progress").map(A=>A.id);if(G.length>0){const{data:A}=await p.from("construction_events").select("contract_id, status, severity, title").in("contract_id",G).eq("status","ACTIVE");for(const w of A||[])f[w.contract_id]||(f[w.contract_id]=[]),f[w.contract_id].push(w)}if(C.length>0){const A={open:{label:"OPEN",color:"#5a8aaa"},bidding:{label:"BIDDING",color:"#c8a832"},awarded:{label:"AWARDED",color:"#8b9a6b"},in_progress:{label:"IN PROGRESS",color:"#5aaa8b"}},w={LOW:"#ca5",MODERATE:"#c84",HIGH:"#c55",CRITICAL:"#f44"};k=`<div class="cp-section">
                <div class="cp-section__header">
                    <span class="cp-section__title">Construction Projects</span>
                    <span class="cp-section__count">${C.length} ACTIVE</span>
                </div>`;for(const y of C){const P=A[y.status]||A.open,X=(y.contract_bids||[]).filter(L=>L.status==="pending"),Y=(y.contract_bids||[]).find(L=>L.status==="won"),ct=a?.current_tick||0,gt=f[y.id]||[],ft=y.nation_id===e.nation_id?i:"";if(k+=`<div class="cp-item">
                    <div class="cp-item__top">
                        <div>
                            <div class="cp-item__name">${_(y.name)}</div>
                            <div class="cp-item__sub">${_(y.project_code||"")} · ${_(y.sector||"")}${ft?" · "+_(ft):""}</div>
                        </div>
                        <span class="cp-badge" style="color:${P.color};border-color:${P.color}40;background:${P.color}08;">${P.label}</span>
                    </div>
                    <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:2px 0;">
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BUDGET</div>
                            <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${d(y.budget_ceiling||0)}</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">TIMELINE</div>
                            <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${y.timeline_ticks||"?"} ticks</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDS</div>
                            <div style="font-size:10px;font-weight:700;color:${X.length>0?"var(--amber)":"var(--text-dim)"};font-family:var(--font-mono);">${(y.contract_bids||[]).length}</div>
                        </div>
                    </div>`,(y.status==="awarded"||y.status==="in_progress")&&Y){const L=Number(Y.factions?.corp_reputation??50),x=L>=70?"#5c5":L>=40?"#ca5":"#c55",rt=Y.estimated_quality>=75?"#5c5":Y.estimated_quality>=50?"#ca5":"#c55";if(k+=`<div style="margin-top:6px;padding:6px 8px;background:var(--bg-3);border:1px solid var(--border-hair);">
                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.8px;margin-bottom:3px;">CONTRACTOR</div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-bright);margin-bottom:4px;">${_(Y.factions?.faction_name||"Unknown")}</div>
                        <div style="display:flex;gap:0;">
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID</div>
                                <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${d(Y.bid_price)}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                <div style="font-size:9px;font-weight:700;color:${rt};font-family:var(--font-mono);">${Y.estimated_quality}/100</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${Y.labor_count}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                <div style="font-size:9px;font-weight:700;color:${x};font-family:var(--font-mono);">${L}/100</div>
                            </div>
                        </div>`,y.status==="in_progress"&&y.awarded_at_tick!=null){const Z=ct-y.awarded_at_tick,st=y.timeline_ticks||1,tt=y.stalled_ticks||0,J=Math.min(100,Math.round(Z/(st+tt)*100)),et=J>=75?"#5c5":J>=40?"#ca5":"#5aaa8b",ot=Math.max(0,st+tt-Z);k+=`<div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);margin-top:6px;">
                            <span style="color:var(--text-dim);">PROGRESS</span>
                            <span style="color:${et};">${J}%${tt>0?" · "+tt+" stalled":""} · ${ot} tick${ot!==1?"s":""} left</span>
                        </div>
                        <div class="cp-progress"><div class="cp-progress__bar" style="width:${J}%;background:${et};"></div></div>`}else k+='<div style="font-size:8px;font-family:var(--font-mono);color:var(--amber);margin-top:6px;text-align:center;">Awarded — construction begins next tick</div>';k+="</div>"}if(gt.length>0)for(const L of gt){const x=w[L.severity]||"#ca5";k+=`<div style="display:flex;align-items:center;gap:5px;margin-top:4px;padding:3px 6px;background:${x}08;border:1px solid ${x}20;">
                            <span class="cp-badge" style="color:${x};border-color:${x}40;background:${x}12;">${L.severity}</span>
                            <span style="font-size:8px;font-family:var(--font-mono);color:${x};">${_(L.title)}</span>
                        </div>`}if((y.status==="open"||y.status==="bidding")&&X.length>0)for(let L=0;L<X.length;L++){const x=X[L],rt=y.id.slice(0,8)+"-"+L,Z=Number(x.factions?.corp_reputation??50),st=Z>=70?"#5c5":Z>=40?"#ca5":"#c55",tt=x.estimated_quality>=75?"#5c5":x.estimated_quality>=50?"#ca5":"#c55",J=x.markup_pct<=10?"#5c5":x.markup_pct<=20?"#ca5":"#c55",et=x.material_grades||{},ot=Object.entries(et),vt=it=>it.replace(/_/g," ").replace(/\b\w/g,lt=>lt.toUpperCase()),wt=it=>it==="HIGH"?"#5c5":it==="LOW"?"#c55":"var(--text-muted)";k+=`<div class="cp-bid" style="flex-direction:column;gap:0;padding:0;cursor:pointer;" onclick="cpToggleBid('${rt}')">
                            <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;">
                                <span style="flex:1;font-size:8px;font-family:var(--font-mono);color:var(--text-muted);">
                                    ${_(x.factions?.faction_name||"Unknown")}
                                    · <span style="color:var(--gold);">${d(x.bid_price)}</span>
                                    · Q: <span style="color:${tt};">${x.estimated_quality}</span>
                                </span>
                                <span class="cp-bid__btn" style="color:#5c5;border-color:#5c540;background:#5c508;" onclick="event.stopPropagation();cpAcceptBid('${y.id}','${x.id}','${_((x.factions?.faction_name||"").replace(/'/g,""))}',${x.bid_price},${x.estimated_quality},${x.labor_count},'${x.faction_id}')">ACCEPT</span>
                            </div>
                            <div id="cp-bid-${rt}" style="display:none;padding:4px 8px 6px;border-top:1px solid var(--border-hair);background: var(--border-hair);">
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID PRICE</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${d(x.bid_price)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">EST. COST</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${d(x.estimated_cost||0)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MARKUP</div>
                                        <div style="font-size:9px;font-weight:700;color:${J};font-family:var(--font-mono);">${x.markup_pct}%</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                        <div style="font-size:9px;font-weight:700;color:${tt};font-family:var(--font-mono);">${x.estimated_quality}/100</div>
                                    </div>
                                </div>
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${x.labor_count}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                        <div style="font-size:9px;font-weight:700;color:${st};font-family:var(--font-mono);">${Z}/100</div>
                                    </div>
                                    <div style="flex:2;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDDER</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${_(x.factions?.faction_name||"Unknown")}</div>
                                    </div>
                                </div>
                                ${ot.length>0?`<div style="padding:2px 4px;">
                                    <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;margin-bottom:2px;">MATERIAL GRADES</div>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                        ${ot.map(([it,lt])=>`<span style="font-size:7px;font-family:var(--font-mono);color:${wt(lt)};">${vt(it)}: ${lt}</span>`).join("")}
                                    </div>
                                </div>`:""}
                            </div>
                        </div>`}if((y.status==="open"||y.status==="bidding")&&X.length===0){const L=(y.bidding_ends_tick||0)-(a?.current_tick||0);k+=`<div style="font-size:8px;font-family:var(--font-mono);color:var(--text-dim);margin-top:4px;text-align:center;">
                        Awaiting bids${L>0?" · "+L+" tick"+(L!==1?"s":"")+" remaining":""}
                    </div>`}k+="</div>"}k+="</div>"}}const O=document.getElementById("prop-count"),U=s.length+1,I=C.length,H=U+" ASSET"+(U!==1?"S":"")+(I>0?" · "+I+" PROJECT"+(I!==1?"S":""):"");O&&(O.textContent=H),document.getElementById("prop-body").innerHTML=`
        ${D}
        ${k}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${d(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${d(o)}/mo</span>
            </div>
        </div>
    `;let T=0;T+=Math.round(m*50);for(const b of s){if(b.refurbish_until_tick&&(a?.current_tick||0)<b.refurbish_until_tick)continue;const f=Number(b.condition||0)/100;f>=.6&&(T+=Math.round(Number(b.capacity||0)*f*50))}return{propertyValue:l,propertyMaintenance:o,totalCapacity:$,propertyRevBonus:T}}async function ye(t,n,e,a,i,s=0){(n||"UNKNOWN").toUpperCase();const r=e.corp_company_type||"Private",l=Number(e.corp_cash_reserves)||0,o=i?.propertyValue||0;let c={loans:0,bonds:0,insurance:0,total:0};if(e?.id&&e.corp_sector==="Finance")try{const{data:O}=await p.from("finance_active_loans").select("principal, remaining_principal, finance_loan_requests!inner(request_type)").eq("lender_faction_id",e.id).in("status",["current","late","delinquent"]);c=de(O||[])}catch(O){console.warn("[Valuation] finance_active_loans lookup failed:",O)}const m=c.total,g=l+o+s+m,$=Number(e.corp_loans)||0,F=a?.monthlyWages||0,B=0,j=$+F+B,q=pe({cash:l,propertyValue:o,equipmentValue:s,loans:j,financeReceivables:m}),S=q.valuationBasis,D=q.valuation,Q=D-q.valuationBasis,k=Q>0;document.getElementById("val-type-badge").textContent=r.toUpperCase();function C(O,U,I={}){const H=I.indent?"val-line val-line--indent":"val-line",T=I.bold?"val-line__label val-line__label--bold":"val-line__label",b=I.bold?"val-line__value val-line__value--bold":"val-line__value",f=I.color||(I.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${H}"><span class="${T}">${O}</span><span class="${b}" style="color:${f}">${d(U)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${C("Cash & Reserves",l,{indent:!0})}
        ${C("Property",o,{indent:!0})}
        ${C("Equipment",s,{indent:!0})}
        ${C("Finance Receivables (Loans + Bonds)",m,{indent:!0})}
        ${C("Insurance Coverage (excluded)",c.insurance,{indent:!0,color:"var(--text-dim)"})}
        ${C("Total Assets",g,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${C("Outstanding Loans",$,{indent:!0})}
        ${C("Accounts Payable",F,{indent:!0})}
        ${C("Pending Project Costs",B,{indent:!0})}
        ${C("Total Liabilities",j,{bold:!0,color:"var(--red)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label">Reconciliation</span></div>
        ${C("Cash + Property + Equipment + Receivables - Liabilities",q.valuationBasis,{indent:!0})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${S>=0?"var(--green)":"var(--red)"};">${d(S)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${d(D)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${k?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${k?"var(--green)":"var(--red)"};">${k?"+":""}${d(Q)}</span>
            </div>
            <div class="val-market__note">${k?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}async function be(){const t=document.getElementById("slogan-input"),n=document.getElementById("slogan-hint"),e=document.getElementById("slogan-save-btn"),a=(t.value||"").trim().slice(0,60);if(a.length===0){n.textContent="Slogan cannot be empty.",n.className="slogan-hint slogan-hint--error";return}e.disabled=!0,e.textContent="...",n.textContent="";try{const{error:i}=await p.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(i)throw i;document.getElementById("id-slogan").textContent='"'+a+'"',n.textContent="Slogan saved! Next change in 120 ticks.",n.className="slogan-hint slogan-hint--ok",e.textContent="Save"}catch(i){console.error("Slogan save failed:",i),n.textContent="Failed to save slogan.",n.className="slogan-hint slogan-hint--error",e.disabled=!1,e.textContent="Save"}}async function xe(){await p.auth.signOut(),window.location.href="login.html"}function he(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function we(t,n){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),n==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",t=>{const n=document.getElementById("faction-switcher"),e=document.getElementById("corp-faction-dropdown");e&&n&&!n.contains(t.target)&&e.classList.remove("open")});window.doLogout=xe;async function $e(t){const n=t.target.files?.[0];if(!n)return;if(n.size>128*1024){alert("Logo must be under 128KB.");return}const e=window._corpFactionId;if(!e)return;const a=document.getElementById("corp-logo-label");a&&(a.textContent="Uploading...");try{const i=n.name.split(".").pop()||"png",s=`party-logos/${e}/${Date.now()}.${i}`,{error:r}=await p.storage.from("public-assets").upload(s,n,{contentType:n.type,upsert:!0});if(r)throw r;const{data:l}=p.storage.from("public-assets").getPublicUrl(s),o=l?.publicUrl||null;await p.from("factions").update({custom_logo_url:o}).eq("id",e);const c=document.getElementById("id-logo");c&&(c.innerHTML=`<img src="${o}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`);const m=document.getElementById("corp-logo");m&&(m.innerHTML=`<img src="${o}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`),a&&(a.textContent="Change Logo")}catch(i){console.error("Logo upload failed:",i),alert("Upload failed: "+(i.message||"Unknown error")),a&&(a.textContent="Upload Logo")}}window.saveSlogan=be;window.toggleCorpDropdown=he;window.switchToFaction=we;let bt=!1;function ke(t,n,e,a){if(bt)return;const i=window._nationStats,r=1+(pt(i,"inflation")-50)/100*.3,l=Math.max(.1,a/100),o=Math.round(e*r*l),c=document.getElementById("prop-modal-overlay"),m=document.getElementById("prop-modal-content");m.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${_(n)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${d(e)}</span>
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
                <span style="color:var(--gold, #c8a832);">${d(o)}</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-sell-confirm" onclick="confirmSellProperty('${t}', ${o})">Confirm Sale</button>
        </div>
    `,c.style.display="flex"}async function Ce(t,n){if(bt)return;bt=!0;const e=document.getElementById("prop-sell-confirm");e&&(e.disabled=!0,e.textContent="Selling...");try{const a=window._corpFactionId;if(!a)throw new Error("No faction");const{error:i}=await p.from("corp_properties").update({is_active:!1}).eq("id",t).eq("faction_id",a);if(i)throw new Error("Failed to sell property: "+i.message);const{data:s}=await p.from("factions").select("corp_cash_reserves").eq("id",a).single(),r=Number(s?.corp_cash_reserves??0),{error:l}=await p.from("factions").update({corp_cash_reserves:r+n}).eq("id",a);l&&console.error("[Property] Failed to credit cash:",l.message),ht(),alert("Property sold for "+d(n)+". Cash credited."),location.reload()}catch(a){alert("Sale failed: "+a.message)}finally{bt=!1,e&&(e.disabled=!1,e.textContent="Confirm Sale")}}let xt=!1;function Ee(t,n,e,a){if(xt)return;const i=window._nationStats,s=window._factionData,l=1+(pt(i,"inflation")-50)/100*.3,o=Math.round(2e6*(a/1e3)),c=Math.round(o*l),m=Math.max(50,Math.round(a*.1)),g=Number(s?.corp_general_workforce??0),$=g>=m,F=Number(s?.corp_cash_reserves??0)>=c,B=document.getElementById("prop-modal-overlay"),j=document.getElementById("prop-modal-content"),q=$&&F&&e<100;let S="";e>=100?S='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property is already at 100% condition.</div>':F?$||(S='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient general workforce (need '+m.toLocaleString()+", have "+g.toLocaleString()+").</div>"):S='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>',j.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${_(n)} — Current Condition: ${e}%</div>
        ${S}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost</span>
                <span style="color:${F?"var(--gold, #c8a832)":"var(--red)"};">${d(c)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Workforce Required</span>
                <span style="color:${$?"var(--blue)":"var(--red)"};">${m.toLocaleString()} General</span>
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
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${t}', ${c}, ${m})" ${q?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,B.style.display="flex"}async function Me(t,n,e){if(xt)return;xt=!0;const a=document.getElementById("prop-refurb-confirm");a&&(a.disabled=!0,a.textContent="Starting...");try{const i=window._corpFactionId,s=window._currentTick;if(!i)throw new Error("No faction");const r=Math.floor(Math.random()*6)+1,o=94+(Math.floor(Math.random()*6)+1),c=s+r,{data:m}=await p.from("factions").select("corp_cash_reserves").eq("id",i).single(),g=Number(m?.corp_cash_reserves??0);if(g<n)throw new Error("Insufficient cash");const{error:$}=await p.from("factions").update({corp_cash_reserves:g-n}).eq("id",i);if($)throw new Error("Failed to deduct cost: "+$.message);const{error:N}=await p.from("corp_properties").update({refurbish_until_tick:c,refurbish_condition:o}).eq("id",t).eq("faction_id",i);if(N)throw new Error("Failed to start refurbishment: "+N.message);ht(),alert("Refurbishment started! Duration: "+r+" tick"+(r!==1?"s":"")+". Condition will be restored to "+Math.min(100,o)+"% when complete."),location.reload()}catch(i){alert("Refurbishment failed: "+i.message)}finally{xt=!1,a&&(a.disabled=!1,a.textContent="Begin Refurbishment")}}function ht(){const t=document.getElementById("prop-modal-overlay");t&&(t.style.display="none")}window.showSellModal=ke;window.confirmSellProperty=Ce;window.showRefurbishModal=Ee;window.confirmRefurbish=Me;window.closePropModal=ht;window.showConvertModal=Ne;window.confirmConvertProperty=Ie;let Lt=!1;async function Le(t,n,e,a,i,s,r){if(!Lt&&confirm("Accept bid from "+e+`?

Bid Price: `+d(a)+`
Quality: `+i+`/100
Workers: `+s+`

This will award the contract. The project begins immediately.`)){Lt=!0;try{const{data:l}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),o=l?.current_tick||0,{error:c}=await p.from("contract_bids").update({status:"won"}).eq("id",n);if(c)throw c;const{error:m}=await p.from("contract_bids").update({status:"lost"}).eq("contract_id",t).neq("id",n);if(m)throw m;const{error:g}=await p.from("construction_contracts").update({status:"awarded",awarded_to_faction:r,awarded_at_tick:o}).eq("id",t);if(g)throw g;alert("Contract awarded to "+e+`!

Bid: `+d(a)+`
Project begins immediately.`),window._nationStats&&window._factionData&&K&&await Rt(window._nationStats,window._nationStats?.name||"",window._factionData,K)}catch(l){alert("Failed to accept bid: "+(l.message||l))}finally{Lt=!1}}}window.cpAcceptBid=Le;function Te(t){const n=document.getElementById("cp-bid-"+t);n&&(n.style.display=n.style.display==="none"?"":"none")}window.cpToggleBid=Te;let Tt="branch_office";function Ne(t,n,e){const a=(v?.corp_subsector||"").toLowerCase(),i=a==="banking"?[["branch_office","Branch Office"]]:a==="investment"?[["trading_floor","Trading Floor"]]:a==="insurance"?[["claims_office","Claims Office"]]:[];if(i.length===0)return;Tt=i[0][0];const s=Math.round(e*.15),r=Math.floor(Math.random()*6)+4,l=document.getElementById("prop-modal-overlay"),o=document.getElementById("prop-modal-content");o.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Convert Property</div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:10px;">${_(n)}</div>
        <div style="display:flex;gap:4px;margin-bottom:10px;">
            ${i.map(([c,m])=>`<span onclick="_convertTargetType='${c}';document.querySelectorAll('.conv-opt').forEach(e=>e.style.background='transparent');this.style.background='rgba(138,106,170,0.15)'" class="conv-opt" style="flex:1;text-align:center;padding:6px;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(138,106,170,0.3);color:#8a6aaa;${c===Tt?"background:rgba(138,106,170,0.15)":""}">${m}</span>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Cost</span>
            <span style="color:var(--gold);">${d(s)}</span>
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
    `,l.style.display="flex"}async function Ie(t,n,e){const a=Number(v?.corp_cash_reserves??0);if(a<n){alert("Insufficient cash. Need "+d(n)+".");return}const i=K?.current_tick||0;try{await p.from("factions").update({corp_cash_reserves:Math.max(0,a-n)}).eq("id",v.id),v.corp_cash_reserves=Math.max(0,a-n),await p.from("corp_properties").update({type:Tt,refurbish_until_tick:i+e,condition:100}).eq("id",t),ht();const s=window._nationStats;await Rt(s,s?.name||v?.nation,v,K)}catch(s){alert("Conversion failed: "+s.message)}}const At={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},Ft={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},Re={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let mt="nation",ut="local",at=null;function qe(t){return t?t.replace(/_/g," ").replace(/\b\w/g,n=>n.toUpperCase()):""}function qt(t,n){if(!t)return"<em>Unknown</em>";const e=_(t);return n?`<span style="color:${n.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${e}</span>`:`<strong>${e}</strong>`}function Dt(t,n,e){const a=t.factions?.nation_id===(t.nation_id||n),i=t.proposer_name||(a?t.factions?.faction_name:null)||"A former party",s=t.proposer_color||(a?t.factions?.party_color:null);return{fired_at_tick:t.proposed_tick,event_name:t.bill_name,_desc_html:`${qt(i,s)} proposed "${_(t.bill_name)}"`,category:"bill",_synthetic:!0,...e}}function Ut(t,n){const e=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:null,a=e?` led by <strong>${_(e)}</strong>`:"";return{fired_at_tick:0,event_name:t.faction_name,_desc_html:`${qt(t.faction_name,t.party_color)} founded${a}`,category:"new_party",_synthetic:!0,_created_at:t.created_at,...n}}function Ht(t,n){const e=Re[t.tier]||`Tier ${t.tier}`,a=t.demand_label?` demanding "${_(t.demand_label)}"`:"",i=t.status==="crisis_active",s=t.tier>=6?"#e74c3c":t.tier>=4?"#f39c12":"",r=s?`<span style="color:${s};font-weight:600">${_(e)}</span>`:`<strong>${_(e)}</strong>`;return{fired_at_tick:t.tick_resolved||t.tick_called,event_name:e,_desc_html:`${qt(t.factions?.faction_name,t.factions?.party_color)} organised a protest${a} — ${r}${i?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...n}}function Wt(t,n,e,a,i){return[...t.map(s=>({...s,_synthetic:!1})),...n,...e,...a].sort((s,r)=>{const l=(r.fired_at_tick||0)-(s.fired_at_tick||0);if(l!==0)return l;const o=s._created_at||s.created_at||"",c=r._created_at||r.created_at||"";return c>o?1:c<o?-1:0}).slice(0,i)}function jt(t){if(t._synthetic&&t._desc_html)return t._desc_html;const n=t.description_chosen||t.description_used||"",e=qe(t.event_name),a=e?`<strong>${_(e)}</strong>`:"",i=n?_(n):"";return a&&i?`${a} — ${i}`:i||a||"Event"}function Vt(t){return t.map(n=>{const e=Nt(n.fired_at_tick),a=At[(n.category||"").toLowerCase()]||Ft;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${_(e)}</span>
            <span class="corp-ev-icon" style="color:${a.color}">${a.icon}</span>
            <span class="corp-ev-text">${jt(n)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}const Ot=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function Se(t){let n=0;for(let e=0;e<t.length;e++)n=(n<<5)-n+t.charCodeAt(e)|0;return Ot[Math.abs(n)%Ot.length]}function Gt(t){return t.map(n=>{const e=Nt(n.fired_at_tick),a=At[(n.category||"").toLowerCase()]||Ft,i=n.nations?.name||"Unknown",s=n.nations?.nation_profiles,r=Array.isArray(s)?s[0]?.flag_url:s?.flag_url,l=Se(i),o=r?`<img src="${_(r)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${_(e)}</span>
                <span class="corp-ev-nation-badge" style="color:${l.color};background:${l.bg};border-color:${l.border};">${o}${_(i)}</span>
            </span>
            <span class="corp-ev-text">${jt(n)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}async function Pe(){const t=document.getElementById("corp-events-list");if(!t||!at)return;const{nationId:n}=at;if(!n){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[e,a]=await Promise.all([p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").eq("nation_id",n).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),p.from("event_log").select("*").eq("nation_id",n).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=e.data||[],s=a.data||[],r=i.map(o=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${o.faction_name} [${o.corp_ticker||o.abbreviation||"??"}] was founded with a specialty in ${o.corp_subsector||o.corp_sector||"General"}. Led by CEO ${[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:o.founded_tick||0})),l=[...s,...r].sort((o,c)=>(c.fired_at_tick||0)-(o.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events in this nation yet.</div>';return}t.innerHTML=Vt(l)}catch(e){console.error("Corp local events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function ze(){const t=document.getElementById("corp-events-list");if(!t||!at)return;const{nationId:n}=at;if(!n){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[e,a]=await Promise.all([p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",n).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),p.from("event_log").select("*, nations(name, nation_profiles(flag_url))").neq("nation_id",n).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=e.data||[],s=a.data||[],r=i.map(o=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${o.faction_name} [${o.corp_ticker||o.abbreviation||"??"}] was founded in ${o.nation||"Unknown"} with a specialty in ${o.corp_subsector||o.corp_sector||"General"}. Led by CEO ${[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:o.founded_tick||0,nations:{name:o.nation||"Unknown"}})),l=[...s,...r].sort((o,c)=>(c.fired_at_tick||0)-(o.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=Gt(l);return}catch(e){console.error("Corp world events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>';return}try{const{data:e,error:a}=await p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",n).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(a)throw a;if(!e||e.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=Be(e,!0)}catch(e){console.error("Corp world events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function Be(t,n){return t.map(e=>{const a=[e.leader_first_name,e.leader_last_name].filter(Boolean).join(" ")||"Unknown",i=e.nation||"Unknown",s=e.corp_subsector||e.corp_sector||"General",r=e.corp_ticker||e.abbreviation||"",l=e.founded_tick?Nt(e.founded_tick):"";let o='<div class="corp-event-row">';return o+='<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--teal);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);padding:1px 5px;display:inline-block;margin-bottom:2px;">'+_(i.toUpperCase())+"</div>",o+='<div style="font-size:11px;color:var(--text-primary);line-height:1.5;">',o+='<span style="font-weight:600;">'+_(e.faction_name)+"</span>",r&&(o+=' <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">['+_(r)+"]</span>"),o+=' was founded in <span style="font-weight:500;">'+_(i)+"</span>",o+=' with a specialty in <span style="color:var(--teal);font-weight:500;">'+_(s)+"</span>.",o+=' Led by CEO <span style="font-weight:500;">'+_(a)+"</span>.",o+="</div>",l&&(o+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">'+_(l)+"</div>"),o+="</div>",o}).join("")}async function Kt(){const t=document.getElementById("corp-events-list");if(!t||!at)return;const{nationId:n}=at;if(!n){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[e,a,i,s]=await Promise.all([p.from("event_log").select("*").eq("nation_id",n).order("fired_at_tick",{ascending:!1}).limit(50),p.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",n).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",n).order("created_at",{ascending:!1}).limit(20),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",n).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(e.error)throw e.error;const r=e.data||[],l=Wt(r,(a.data||[]).map(o=>Dt(o,n)),(i.data||[]).map(o=>Ut(o)),(s.data||[]).map(o=>Ht(o)),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>';return}t.innerHTML=Vt(l)}catch(e){console.error("Nation events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function Oe(){const t=document.getElementById("corp-events-list");if(!t||!at)return;const{nationId:n}=at;if(!n){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[e,a,i,s]=await Promise.all([p.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).order("fired_at_tick",{ascending:!1}).limit(60),p.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).order("created_at",{ascending:!1}).limit(15),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",n).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(e.error)throw e.error;const r=e.data||[],l=Wt(r,(a.data||[]).map(o=>Dt(o,null,{nations:o.nations})),(i.data||[]).map(o=>Ut(o,{nations:o.nations})),(s.data||[]).map(o=>Ht(o,{nations:o.nations})),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>';return}t.innerHTML=Gt(l)}catch(e){console.error("World events error:",e),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}window.switchCorpEventsCat=function(t){t!==mt&&(mt=t,document.querySelectorAll("#corp-events-cat-bar .corp-events-tab").forEach(n=>n.classList.toggle("active",n.dataset.cat===t)),Yt())};window.switchCorpEventsScope=function(t){t!==ut&&(ut=t,document.querySelectorAll("#corp-events-scope-bar .corp-events-tab").forEach(n=>n.classList.toggle("active",n.dataset.scope===t)),Yt())};function Yt(){mt==="nation"&&ut==="local"?Kt():mt==="nation"&&ut==="world"?Oe():mt==="corporate"&&ut==="local"?Pe():ze()}fe();
