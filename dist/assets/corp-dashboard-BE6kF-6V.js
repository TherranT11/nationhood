const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-kB28qcfr.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as c}from"./supabase-client-CiYoFhIh.js";/* empty css                    */import{_ as Ht}from"./preload-helper-BXl3LOEh.js";import{e as v,t as wt}from"./utils-CY90Gazr.js";import{initMessaging as Wt}from"./messaging-BUrQna7p.js";import{c as jt}from"./equipment-DsuDdEne.js";let it=[],f=null,F=null;function _(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(2)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(1)+"k":"$"+Math.round(t).toLocaleString()}function nt(t,e){return Number(t?.[e]??50)}async function Gt(){const{data:{user:t}}=await c.auth.getUser();if(!t){window.location.href="login.html";return}const{data:e}=await c.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);it=(e||[]).filter(y=>y.nation_id&&!y.abandoned_at);const o=sessionStorage.getItem("active_faction_id");if(f=it.find(y=>y.id===o)||it.find(y=>y.faction_type==="corporation")||it[0],!f){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",f.id),f.faction_type!=="corporation"){window.location.href="dashboard.html";return}const r={Construction:"corp-operations.html",Finance:"corp-operations-finance.html",Shipping:"corp-operations.html"}[f.corp_sector]||"corp-operations.html",i=document.getElementById("nav-operations"),s=document.getElementById("nav-expansion");i&&(i.href=r),s&&(s.href="corp-operations.html?tab=expansion");let l=f.nation||"",a=null;const[d,m]=await Promise.all([f.nation_id?c.from("nations").select("*").eq("id",f.nation_id).single():Promise.resolve({data:null}),c.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);d.error&&console.warn("Nation load failed:",d.error.message),d.data&&(l=d.data.name,a=d.data),m.error&&console.warn("Shard load failed:",m.error.message),F=m.data;let u=0;if(f?.id){const{data:y}=await c.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",f.id).in("status",["open","bidding"]);if(y)for(const g of y)u+=(g.contract_bids||[]).length}const $=document.getElementById("corp-topbar-container");if($){const{renderCorpTopBar:y}=await Ht(async()=>{const{renderCorpTopBar:P}=await import("./corp-topbar-kB28qcfr.js");return{renderCorpTopBar:P}},__vite__mapDeps([0,1])),g={};u>0&&(g.home={color:"#c8a832",title:u+" pending bid"+(u!==1?"s":"")+" on your projects"}),y($,{faction:f,shard:F,activeTab:"home",allUserFactions:it,badges:g})}document.getElementById("id-type-badge").textContent=f.corp_company_type||"—";const x=document.getElementById("id-logo"),q=(f.corp_ticker||f.abbreviation||"").toUpperCase();f.custom_logo_url?x.innerHTML=`<img src="${v(f.custom_logo_url)}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`:x.textContent=q.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=f.faction_name||"Unnamed Corp";const S=f.party_description||"";document.getElementById("id-slogan").textContent=S?'"'+S+'"':'"--"';const L=F?.current_date?F.current_date.replace(/.*,\s*/,""):"—",z=f.leader_first_name&&f.leader_last_name?f.leader_first_name+" "+f.leader_last_name+(f.leader_age?" ("+f.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${v(L)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${v(l||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${v(f.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${v(f.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${v(z)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${v(f.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${v(q)}</span>
        </div>
    `;const N=f.last_rename_tick||0,R=F?.current_tick||0,C=Math.max(0,N+120-R),A=!S||S==="-"||S==='"-"'||C<=0,h=document.getElementById("slogan-editor");h.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${v(S)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${A?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${A?"60 characters max. 120 tick cooldown after change.":C+" ticks until you can change slogan."}</div>
    `;const B=document.getElementById("corp-logo-upload");B.innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Logo</span>
            <label class="id-row__value" style="cursor:pointer;text-decoration:underline;" id="corp-logo-label">
                ${f.custom_logo_url?"Change Logo":"Upload Logo"}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" id="corp-logo-file" style="display:none;">
            </label>
        </div>
    `,document.getElementById("corp-logo-file")?.addEventListener("change",ne),window._corpFactionId=f.id,window._currentTick=R,window._nationStats=a,window._factionData=f,await ie(t,f,R);const I=Vt(a,l,f);Xt(l,f);const p=await kt(a,l,f,F);let k=0;if(f?.id){const{data:y,error:g}=await c.from("corp_equipment").select("equipment_key, owned").eq("faction_id",f.id);g||(k=jt(y||[]))}let D=0;if(f?.id){const{data:y}=await c.from("corp_executives").select("salary_per_year").eq("faction_id",f.id).eq("status","active");D=(y||[]).reduce((g,P)=>g+(Number(P.salary_per_year)||0),0)}let b=0;if(f?.id&&f.corp_sector==="Shipping"){const{data:y}=await c.from("corp_vessels").select("base_maintenance").eq("faction_id",f.id).neq("status","for_sale");b=(y||[]).reduce((g,P)=>g+(Number(P.base_maintenance)||0),0)}await Kt(a,F,I,f,p.propertyMaintenance||0,k,D,p,b),Jt(a,l,f,I,p),Wt(f,a,F),Q={nationId:f.nation_id},At(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function Vt(t,e,o){const n=k=>nt(t,k),r=(e||"UNKNOWN").toUpperCase(),i=Number(o?.corp_general_workforce??2250),s=Number(o?.corp_skilled_workforce??600),l=Number(o?.corp_innovative_workforce??150),a=i+s+l,d=2,m=3,u=6,$=n("minimum_wage"),x=$/100*48e3,q=n("inflation"),S=n("standard_of_living"),L=1+(q-50)/100*.5,z=1+(S-50)/100*.5,N=k=>Math.round(x*k*L*z),R=N(d),E=N(m),C=N(u),O=i*R,A=s*E,h=l*C,B=O+A+h;function I(k){return"$"+Math.round(k).toLocaleString()+"/yr"}const p=`${L.toFixed(2)} &times; ${z.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=a.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${v(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${i.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${d}.0 &times; ${p})</span>
                <span class="wf-tier__value">${I(R)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${_(O)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${v(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${s.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${m}.0 &times; ${p})</span>
                <span class="wf-tier__value">${I(E)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${_(A)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${v(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${u}.0 &times; ${p})</span>
                <span class="wf-tier__value">${I(C)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${_(h)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${v(r)})</span>
                <span class="wf-tier__value">${$}/100 → ${I(x)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${L.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${z.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${a.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${_(B)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${_(B/12)}</span>
            </div>
        </div>
    `,{totalWages:B,generalTotal:O,skilledTotal:A,innovativeTotal:h,monthlyWages:Math.round(B/12)}}async function Kt(t,e,o,n,r,i,s,l,a){const d=e?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+d;const m=87e6,u=T=>nt(t,T),$=1+(u("gdp_growth")-50)/100*.4,x=1+(u("urbanization")-50)/100*.3,q=1+(u("population_growth")-50)/100*.2,S=1+(u("standard_of_living")-50)/100*.15,L=1+(50-u("physical_infrastructure"))/100*.1,z=1-Math.max(0,u("inflation")-50)/100*.1,N=1-Math.max(0,u("interest_rates")-50)/100*.1,R=$*x*q*S*L*z*N,E=Math.round(m*R),C=(n.corp_general_workforce||0)+(n.corp_skilled_workforce||0)+(n.corp_innovative_workforce||0),O=Math.max(500,l?.totalCapacity||500),A=Math.min(1,C/O),h=l?.propertyRevBonus||0,B=Math.round(Math.round(E/12)*A)+h,I=0,p=0,k=I+p+B,D=o?.totalWages||0,b=Math.round(D/12),y=0,g=r||0,P=i||0,G=Number(n?.corp_loans)||0,H=.05,ct=G>0?Math.round(G*(H/12)/(1-Math.pow(1+H/12,-120))):0,rt=Math.round((s||0)/12),ot=a||0,M=75e3,w=Math.max(0,Math.min(1,Number(t?.corporate_tax??0)/100||0)),tt=b+rt+y+g+P+ot+ct+M,V=Math.max(0,k-tt),et=Math.round(V*w);let W="";try{const T=new Set([n.nation_id]),{data:dt}=await c.from("corp_properties").select("nation_id").eq("faction_id",n.id).eq("is_active",!0);if((dt||[]).forEach(Y=>{Y.nation_id&&T.add(Y.nation_id)}),T.size>0){const{data:Y}=await c.from("nations").select("id, name, corporate_tax").in("id",[...T]);Y&&Y.length>0&&(W=Y.sort((at,j)=>(at.name||"").localeCompare(j.name||"")).map(at=>{const j=Math.round(Number(at.corporate_tax??0)),ut=Math.round(V*(j/100)/Y.length),gt=j>25?"#c55":j>15?"#ca5":"#5c5";return`<div style="display:flex;justify-content:space-between;padding:1px 0;font-family:var(--font-mono);font-size:8px;">
                        <span style="color:var(--text-dim);">${at.name} (<span style="color:${gt}">${j}%</span>)</span>
                        <span style="color:#a44;">${_(ut)}</span>
                    </div>`}).join(""))}}catch{}const K=tt+et,X=k-K,U=Number(n?.corp_cash_reserves??0),_t=G,mt=[{stat:"gdp_growth",value:u("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:u("urbanization"),weight:"0.3"},{stat:"population_growth",value:u("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:u("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:u("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:u("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:u("interest_rates"),weight:"-0.1",neg:!0}];function J(T){return T.neg?T.value>50?"var(--red)":"var(--green)":T.note?T.value<50?"var(--green)":"var(--red)":T.value>=50?"var(--green)":T.value>=35?"var(--amber)":"var(--red)"}const Z=k||1,Dt=(I/Z*100).toFixed(1),Ft=(p/Z*100).toFixed(1),Ut=(B/Z*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${Dt}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${Ft}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${Ut}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${_(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${_(p)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${_(B-h)}</span></div>
            ${h>0?`<div class="fin-row"><span class="fin-row__label">Property Revenue<span class="fin-row__badge">BUILDINGS</span></span><span class="fin-row__value" style="color:var(--green)">${_(h)}</span></div>`:""}
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${_(k)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${_(b)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Executive Compensation</span><span class="fin-row__value" style="color:#a44">${_(rt)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${_(y)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${_(g)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${_(P)}</span></div>
            ${ot>0?`<div class="fin-row"><span class="fin-row__label">Fleet Maintenance</span><span class="fin-row__value" style="color:#a44">${_(ot)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${_(ct)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${_(et)}</span></div>
            ${W?`<div style="padding:2px 12px 6px 20px;border-bottom:1px solid rgba(255,255,255,0.04);">${W}</div>`:""}
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${_(K)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${X>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${X>=0?"var(--green)":"var(--red)"}">${_(X)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${_(U)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${_(_t)}</div>
            </div>
        </div>
        <!-- Purchasing Power -->
        ${(()=>{const T=Number(t?.currency_strength??50),dt=Number(t?.inflation??0),Y=T/50,at=Math.max(.5,1-dt/200),j=Math.round(U*Y*at),ut=j>=U?"var(--green)":j>=U*.8?"var(--amber)":"var(--red)",gt=U>0?Math.round(j/U*100):100;return`<div style="padding:4px 14px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-hair);">
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.5px;text-transform:uppercase;">Purchasing Power</div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${ut};">${_(j)}</span>
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${gt}% · CUR ${T} · INF ${Math.round(dt)}</span>
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
            ${mt.map(T=>`
                <div class="drv-row">
                    <span class="drv-row__name">${T.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${T.value}%;background:${J(T)}"></div></div>
                    <span class="drv-row__val">${T.value}</span>
                    <span class="drv-row__wt">&times;${T.weight}</span>
                    ${T.note?'<span class="drv-row__note">'+T.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${R.toFixed(2)}</span>
            </div>
        </div>
    `,$t()}let yt=!1;async function Yt(t,e){if(!(!f||yt)){yt=!0;try{const{data:o,error:n}=await c.from("finance_loan_offers").select("*").eq("id",t).single();if(n||!o)return;const{data:r,error:i}=await c.from("finance_loan_requests").select("*").eq("id",e).single();if(i||!r||r.status!=="open")return;const s=o.interest_rate/100/12,l=r.term_months,a=s>0?Math.round(r.amount*s/(1-Math.pow(1+s,-l))):Math.round(r.amount/l),d=F?.current_tick||0,{error:m}=await c.from("finance_loan_requests").update({status:"funded",accepted_offer_id:t,funded_tick:d}).eq("id",e);if(m)return;await c.from("finance_loan_offers").update({status:"accepted"}).eq("id",t),await c.from("finance_loan_offers").update({status:"declined"}).eq("request_id",e).neq("id",t).eq("status","pending"),await c.from("finance_active_loans").insert({request_id:e,offer_id:t,borrower_faction_id:r.requesting_faction_id,lender_faction_id:o.offering_faction_id,nation_id:r.nation_id,principal:r.amount,interest_rate:o.interest_rate,term_months:r.term_months,collateral_type:o.collateral_type,purpose:r.purpose,monthly_payment:a,started_tick:d});const{data:u}=await c.from("factions").select("corp_cash_reserves").eq("id",o.offering_faction_id).single();u&&await c.from("factions").update({corp_cash_reserves:Math.max(0,(Number(u.corp_cash_reserves)||0)-r.amount)}).eq("id",o.offering_faction_id);const{data:$}=await c.from("factions").select("corp_cash_reserves, corp_debt").eq("id",r.requesting_faction_id).single();if($){const{error:x}=await c.from("factions").update({corp_cash_reserves:(Number($.corp_cash_reserves)||0)+r.amount,corp_debt:(Number($.corp_debt)||0)+r.amount}).eq("id",r.requesting_faction_id);x&&console.error("[Loans] Failed to credit borrower + track debt:",x.message)}}finally{yt=!1}$t()}}async function Qt(t){await c.from("finance_loan_requests").update({status:"cancelled"}).eq("id",t),$t()}async function $t(){if(!f)return;const t=document.getElementById("fin-loans-list");if(t)try{const{data:e,error:o}=await c.from("finance_loan_requests").select("*, finance_loan_offers!request_id(*)").eq("requesting_faction_id",f.id).in("status",["open","funded"]).order("created_tick",{ascending:!1});o&&console.error("[Loans] Request query error:",o.message);const{data:n,error:r}=await c.from("finance_active_loans").select("*").eq("borrower_faction_id",f.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1});r&&console.error("[Loans] Active loans query error:",r.message);let i="";if(e&&e.length>0){for(const s of e)if(s.status==="open"){const l=(s.finance_loan_offers||[]).filter(a=>a.status==="pending");if(i+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span style="color:#5a8aaa;font-weight:700;">OPEN</span>
                            <span style="color:var(--text-primary);margin-left:4px;">${_(s.amount)}</span>
                            <span style="color:var(--text-dim);margin-left:4px;">${s.term_months}mo</span>
                        </div>
                        <span style="color:var(--text-dim);cursor:pointer;" onclick="cancelRequest('${s.id}')">&#10005;</span>
                    </div>
                    <div style="font-size:7px;color:var(--text-dim);margin-top:2px;">${v(s.purpose||"")}</div>`,l.length>0){i+=`<div style="margin-top:4px;font-size:7px;color:#5a8aaa;font-weight:700;">${l.length} OFFER${l.length>1?"S":""}</div>`;for(const a of l.sort((d,m)=>d.interest_rate-m.interest_rate))i+=`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-top:1px solid var(--border-hair);">
                            <span style="color:var(--text-primary);font-weight:700;">${a.interest_rate}%</span>
                            <span style="color:var(--text-dim);">${a.collateral_type}</span>
                            <span style="flex:1;"></span>
                            <span style="padding:2px 8px;cursor:pointer;color:#000;background:#5a8aaa;font-weight:700;font-size:7px;" onclick="acceptOffer('${a.id}','${s.id}')">ACCEPT</span>
                        </div>`}else i+='<div style="margin-top:2px;font-size:7px;color:var(--text-dim);">Awaiting offers from finance corporations...</div>';i+="</div>"}}if(n&&n.length>0)for(const s of n){const l=s.status==="current"?"var(--green)":s.status==="late"?"#c84":"#c55",a=s.term_months>0?Math.round(s.payments_made/s.term_months*100):0;i+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="color:${l};font-weight:700;">${s.status.toUpperCase()}</span>
                        <span style="color:var(--text-primary);margin-left:4px;">${_(s.principal)}</span>
                        <span style="color:var(--text-dim);margin-left:4px;">@ ${s.interest_rate}%</span>
                    </div>
                    <span style="color:var(--text-dim);">${a}% repaid</span>
                </div>
                <div style="height:2px;background:var(--border-0);margin-top:3px;">
                    <div style="height:100%;width:${a}%;background:${l};"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Payment: ${_(s.monthly_payment)}/mo</span>
                    <span>${s.payments_made}/${s.term_months} payments</span>
                </div>
            </div>`}i||(i='<div style="color:var(--text-dim);">No active loans.</div>'),t.innerHTML=i}catch(e){console.error("[Loans] loadLoansSection error:",e)}}window.acceptOffer=Yt;window.cancelRequest=Qt;function Xt(t,e){const o=(t||"").toUpperCase(),n=Number(e.corp_general_workforce??0)+Number(e.corp_skilled_workforce??0)+Number(e.corp_innovative_workforce??0),r=[{label:"Reputation",value:Number(e.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:n||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(e.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(e.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(e.corp_market_share??5),change:0,nation:o,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(e.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(e.corp_regulatory_standing??50),change:0,nation:o,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(e.corp_political_influence??10),change:0,decay:!0,nation:o,max:100},{label:"Innovation",value:Number(e.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function i(a,d){if(!d||d>100)return"var(--text-primary)";const m=a/d*100;return m>=70?"var(--green)":m>=40?"var(--amber)":m>=20?"var(--orange, #d48a3c)":"var(--red)"}function s(a){const d=parseFloat(a),m=d>0?"var(--green)":d<0?"var(--red)":"var(--text-dim)",u=d>0?"▲":d<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${m}">${u}</span>
            <span class="stat-item__delta" style="color:${m}">${Math.abs(d).toFixed(1)}</span>
        </div>`}let l="";for(const a of r){if(a.isHero){l+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${a.label}</span>
                            ${a.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${Math.round(a.value)}</span>
                            <span class="stats-hero__max">/100</span>
                            ${s(a.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${Math.min(100,a.value)}%"></div></div>
                </div>`;continue}a.section&&(l+=`<div class="stats-section"><span class="stats-section__label">${a.section}</span></div>`);const d=a.max&&a.max<=100;l+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${a.label}</span>
                        ${a.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${a.nation?'<span class="stat-item__nation">'+v(a.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${d?i(a.value,a.max):"var(--text-primary)"}">${typeof a.value=="number"?d?Math.round(a.value):a.value.toLocaleString():a.value}</span>
                    ${d?'<span class="stat-item__max">/100</span>':""}
                    ${s(a.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=l}async function kt(t,e,o,n){const r=(e||"UNKNOWN").toUpperCase();let i=[];if(o?.id){const{data:p}=await c.from("corp_properties").select("*").eq("faction_id",o.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});i=p||[]}const s={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,a=0;const d=Number(o?.corp_general_workforce??0)+Number(o?.corp_skilled_workforce??0)+Number(o?.corp_innovative_workforce??0),m=500,u=m+i.reduce((p,k)=>p+Number(k.capacity||0),0),$=u>0?Math.round(d*(m/u)):d,x=5e7,q=1+(nt(t,"inflation")-50)/100*.3,S=.8+nt(t,"stability")/100*.4,L=Math.round(x*q*S),z=Math.round(L*.005);l+=L,a+=z;let N=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${v(r)} · Headquarters</div>
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
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${$.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${_(L)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${_(z)}</div>
            </div>
        </div>
    </div>`,R=$;for(const p of i){const k=s[p.style]||s.Basic;l+=Number(p.purchase_price||0),a+=Number(p.monthly_maintenance||0);const D=p.condition>=75?"var(--green)":p.condition>=50?"var(--amber)":"var(--orange)",b=Number(p.capacity||0),y=u>0?Math.min(d-R,Math.round(d*(b/u))):0;R+=y,N+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${v(p.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${v(p.city||r)} · ${(p.type||"").replace(/_/g," ")} · <span style="color:${k.color}">${(p.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge" ${["branch_office","trading_floor","claims_office"].includes(p.type)?'style="background:rgba(138,106,170,0.12);color:#8a6aaa;border-color:rgba(138,106,170,0.3);"':""}>${["branch_office","trading_floor","claims_office"].includes(p.type)?p.type.replace(/_/g," ").replace(/\b\w/g,g=>g.toUpperCase()):"OWNED"}</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${b.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${y.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${_(p.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${_(p.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${D}">${p.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${p.condition}%;height:100%;background:${D};"></div></div>
            ${p.refurbish_until_tick&&p.refurbish_until_tick>(n?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${p.refurbish_until_tick-(n?.current_tick||0)} tick${p.refurbish_until_tick-(n?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${p.id}','${v(p.name).replace(/'/g,"\\'")}',${p.purchase_price||0},${p.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${p.id}','${v(p.name).replace(/'/g,"\\'")}',${p.condition},${b})">REFURBISH</button>
                ${o?.corp_sector==="Finance"&&(p.type==="office"||p.type==="regional_hq")&&!["branch_office","trading_floor","claims_office"].includes(p.type)?`<button class="prop-action-btn" style="background:rgba(138,106,170,0.08);border-color:rgba(138,106,170,0.2);color:#8a6aaa;" onclick="showConvertModal('${p.id}','${v(p.name).replace(/'/g,"\\'")}',${p.purchase_price||0})">CONVERT</button>`:""}
            </div>`}
        </div>`}let E="",C=[];if(o?.id){const{data:p}=await c.from("construction_contracts").select("*, contract_bids(id, faction_id, bid_price, estimated_quality, estimated_cost, labor_count, markup_pct, material_grades, submitted_at_tick, status, factions!faction_id(faction_name, abbreviation, corp_reputation))").eq("issuer_faction_id",o.id).in("status",["open","bidding","awarded","in_progress"]).order("generated_at_tick",{ascending:!1});C=p||[];let k={};const D=C.filter(b=>b.status==="in_progress").map(b=>b.id);if(D.length>0){const{data:b}=await c.from("construction_events").select("contract_id, status, severity, title").in("contract_id",D).eq("status","ACTIVE");for(const y of b||[])k[y.contract_id]||(k[y.contract_id]=[]),k[y.contract_id].push(y)}if(C.length>0){const b={open:{label:"OPEN",color:"#5a8aaa"},bidding:{label:"BIDDING",color:"#c8a832"},awarded:{label:"AWARDED",color:"#8b9a6b"},in_progress:{label:"IN PROGRESS",color:"#5aaa8b"}},y={LOW:"#ca5",MODERATE:"#c84",HIGH:"#c55",CRITICAL:"#f44"};E=`<div class="cp-section">
                <div class="cp-section__header">
                    <span class="cp-section__title">Construction Projects</span>
                    <span class="cp-section__count">${C.length} ACTIVE</span>
                </div>`;for(const g of C){const P=b[g.status]||b.open,G=(g.contract_bids||[]).filter(M=>M.status==="pending"),H=(g.contract_bids||[]).find(M=>M.status==="won"),ct=n?.current_tick||0,rt=k[g.id]||[],ot=g.nation_id===o.nation_id?r:"";if(E+=`<div class="cp-item">
                    <div class="cp-item__top">
                        <div>
                            <div class="cp-item__name">${v(g.name)}</div>
                            <div class="cp-item__sub">${v(g.project_code||"")} · ${v(g.sector||"")}${ot?" · "+v(ot):""}</div>
                        </div>
                        <span class="cp-badge" style="color:${P.color};border-color:${P.color}40;background:${P.color}08;">${P.label}</span>
                    </div>
                    <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:2px 0;">
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BUDGET</div>
                            <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${_(g.budget_ceiling||0)}</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">TIMELINE</div>
                            <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${g.timeline_ticks||"?"} ticks</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDS</div>
                            <div style="font-size:10px;font-weight:700;color:${G.length>0?"var(--amber)":"var(--text-dim)"};font-family:var(--font-mono);">${(g.contract_bids||[]).length}</div>
                        </div>
                    </div>`,(g.status==="awarded"||g.status==="in_progress")&&H){const M=Number(H.factions?.corp_reputation??50),w=M>=70?"#5c5":M>=40?"#ca5":"#c55",tt=H.estimated_quality>=75?"#5c5":H.estimated_quality>=50?"#ca5":"#c55";if(E+=`<div style="margin-top:6px;padding:6px 8px;background:var(--bg-3);border:1px solid var(--border-hair);">
                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.8px;margin-bottom:3px;">CONTRACTOR</div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-bright);margin-bottom:4px;">${v(H.factions?.faction_name||"Unknown")}</div>
                        <div style="display:flex;gap:0;">
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID</div>
                                <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${_(H.bid_price)}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                <div style="font-size:9px;font-weight:700;color:${tt};font-family:var(--font-mono);">${H.estimated_quality}/100</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${H.labor_count}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                <div style="font-size:9px;font-weight:700;color:${w};font-family:var(--font-mono);">${M}/100</div>
                            </div>
                        </div>`,g.status==="in_progress"&&g.awarded_at_tick!=null){const V=ct-g.awarded_at_tick,et=g.timeline_ticks||1,W=g.stalled_ticks||0,K=Math.min(100,Math.round(V/(et+W)*100)),X=K>=75?"#5c5":K>=40?"#ca5":"#5aaa8b",U=Math.max(0,et+W-V);E+=`<div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);margin-top:6px;">
                            <span style="color:var(--text-dim);">PROGRESS</span>
                            <span style="color:${X};">${K}%${W>0?" · "+W+" stalled":""} · ${U} tick${U!==1?"s":""} left</span>
                        </div>
                        <div class="cp-progress"><div class="cp-progress__bar" style="width:${K}%;background:${X};"></div></div>`}else E+='<div style="font-size:8px;font-family:var(--font-mono);color:var(--amber);margin-top:6px;text-align:center;">Awarded — construction begins next tick</div>';E+="</div>"}if(rt.length>0)for(const M of rt){const w=y[M.severity]||"#ca5";E+=`<div style="display:flex;align-items:center;gap:5px;margin-top:4px;padding:3px 6px;background:${w}08;border:1px solid ${w}20;">
                            <span class="cp-badge" style="color:${w};border-color:${w}40;background:${w}12;">${M.severity}</span>
                            <span style="font-size:8px;font-family:var(--font-mono);color:${w};">${v(M.title)}</span>
                        </div>`}if((g.status==="open"||g.status==="bidding")&&G.length>0)for(let M=0;M<G.length;M++){const w=G[M],tt=g.id.slice(0,8)+"-"+M,V=Number(w.factions?.corp_reputation??50),et=V>=70?"#5c5":V>=40?"#ca5":"#c55",W=w.estimated_quality>=75?"#5c5":w.estimated_quality>=50?"#ca5":"#c55",K=w.markup_pct<=10?"#5c5":w.markup_pct<=20?"#ca5":"#c55",X=w.material_grades||{},U=Object.entries(X),_t=J=>J.replace(/_/g," ").replace(/\b\w/g,Z=>Z.toUpperCase()),mt=J=>J==="HIGH"?"#5c5":J==="LOW"?"#c55":"var(--text-muted)";E+=`<div class="cp-bid" style="flex-direction:column;gap:0;padding:0;cursor:pointer;" onclick="cpToggleBid('${tt}')">
                            <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;">
                                <span style="flex:1;font-size:8px;font-family:var(--font-mono);color:var(--text-muted);">
                                    ${v(w.factions?.faction_name||"Unknown")}
                                    · <span style="color:var(--gold);">${_(w.bid_price)}</span>
                                    · Q: <span style="color:${W};">${w.estimated_quality}</span>
                                </span>
                                <span class="cp-bid__btn" style="color:#5c5;border-color:#5c540;background:#5c508;" onclick="event.stopPropagation();cpAcceptBid('${g.id}','${w.id}','${v((w.factions?.faction_name||"").replace(/'/g,""))}',${w.bid_price},${w.estimated_quality},${w.labor_count},'${w.faction_id}')">ACCEPT</span>
                            </div>
                            <div id="cp-bid-${tt}" style="display:none;padding:4px 8px 6px;border-top:1px solid var(--border-hair);background:rgba(255,255,255,0.01);">
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID PRICE</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${_(w.bid_price)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">EST. COST</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${_(w.estimated_cost||0)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MARKUP</div>
                                        <div style="font-size:9px;font-weight:700;color:${K};font-family:var(--font-mono);">${w.markup_pct}%</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                        <div style="font-size:9px;font-weight:700;color:${W};font-family:var(--font-mono);">${w.estimated_quality}/100</div>
                                    </div>
                                </div>
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${w.labor_count}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                        <div style="font-size:9px;font-weight:700;color:${et};font-family:var(--font-mono);">${V}/100</div>
                                    </div>
                                    <div style="flex:2;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDDER</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${v(w.factions?.faction_name||"Unknown")}</div>
                                    </div>
                                </div>
                                ${U.length>0?`<div style="padding:2px 4px;">
                                    <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;margin-bottom:2px;">MATERIAL GRADES</div>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                        ${U.map(([J,Z])=>`<span style="font-size:7px;font-family:var(--font-mono);color:${mt(Z)};">${_t(J)}: ${Z}</span>`).join("")}
                                    </div>
                                </div>`:""}
                            </div>
                        </div>`}if((g.status==="open"||g.status==="bidding")&&G.length===0){const M=(g.bidding_ends_tick||0)-(n?.current_tick||0);E+=`<div style="font-size:8px;font-family:var(--font-mono);color:var(--text-dim);margin-top:4px;text-align:center;">
                        Awaiting bids${M>0?" · "+M+" tick"+(M!==1?"s":"")+" remaining":""}
                    </div>`}E+="</div>"}E+="</div>"}}const O=document.getElementById("prop-count"),A=i.length+1,h=C.length,B=A+" ASSET"+(A!==1?"S":"")+(h>0?" · "+h+" PROJECT"+(h!==1?"S":""):"");O&&(O.textContent=B),document.getElementById("prop-body").innerHTML=`
        ${N}
        ${E}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${_(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${_(a)}/mo</span>
            </div>
        </div>
    `;let I=0;I+=Math.round(m*50);for(const p of i){if(p.refurbish_until_tick&&(n?.current_tick||0)<p.refurbish_until_tick)continue;const k=Number(p.condition||0)/100;k>=.6&&(I+=Math.round(Number(p.capacity||0)*k*50))}return{propertyValue:l,propertyMaintenance:a,totalCapacity:u,propertyRevBonus:I}}function Jt(t,e,o,n,r){(e||"UNKNOWN").toUpperCase();const i=o.corp_company_type||"Private",s=Number(o.corp_cash_reserves)||0,l=r?.propertyValue||0,a=0,d=0,m=s+l+a+d,u=Number(o.corp_loans)||0,x=n?.monthlyWages||0,q=0,S=u+x+q,L=m-S,N=Math.round(L*(1+.3)),R=N-L,E=R>0;document.getElementById("val-type-badge").textContent=i.toUpperCase();function C(O,A,h={}){const B=h.indent?"val-line val-line--indent":"val-line",I=h.bold?"val-line__label val-line__label--bold":"val-line__label",p=h.bold?"val-line__value val-line__value--bold":"val-line__value",k=h.color||(h.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${B}"><span class="${I}">${O}</span><span class="${p}" style="color:${k}">${_(A)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${C("Cash & Reserves",s,{indent:!0})}
        ${C("Property",l,{indent:!0})}
        ${C("Equipment",a,{indent:!0})}
        ${C("Active Contracts",d,{indent:!0})}
        ${C("Total Assets",m,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${C("Outstanding Loans",u,{indent:!0})}
        ${C("Accounts Payable",x,{indent:!0})}
        ${C("Pending Project Costs",q,{indent:!0})}
        ${C("Total Liabilities",S,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${L>=0?"var(--green)":"var(--red)"};">${_(L)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${_(N)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${E?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${E?"var(--green)":"var(--red)"};">${E?"+":""}${_(R)}</span>
            </div>
            <div class="val-market__note">${E?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}function Zt(){document.body.classList.toggle("light-mode");const t=document.getElementById("theme-toggle");t.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const t=document.getElementById("theme-toggle");t&&(t.textContent="Dark")}async function te(){const t=document.getElementById("slogan-input"),e=document.getElementById("slogan-hint"),o=document.getElementById("slogan-save-btn"),n=(t.value||"").trim().slice(0,60);if(n.length===0){e.textContent="Slogan cannot be empty.",e.className="slogan-hint slogan-hint--error";return}o.disabled=!0,o.textContent="...",e.textContent="";try{const{error:r}=await c.from("factions").update({party_description:n,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(r)throw r;document.getElementById("id-slogan").textContent='"'+n+'"',e.textContent="Slogan saved! Next change in 120 ticks.",e.className="slogan-hint slogan-hint--ok",o.textContent="Save"}catch(r){console.error("Slogan save failed:",r),e.textContent="Failed to save slogan.",e.className="slogan-hint slogan-hint--error",o.disabled=!1,o.textContent="Save"}}async function ee(){await c.auth.signOut(),window.location.href="login.html"}function oe(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function ae(t,e){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),e==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",t=>{const e=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&e&&!e.contains(t.target)&&o.classList.remove("open")});window.doLogout=ee;window.toggleTheme=Zt;async function ne(t){const e=t.target.files?.[0];if(!e)return;if(e.size>128*1024){alert("Logo must be under 128KB.");return}const o=window._corpFactionId;if(!o)return;const n=document.getElementById("corp-logo-label");n&&(n.textContent="Uploading...");try{const r=e.name.split(".").pop()||"png",i=`party-logos/${o}/${Date.now()}.${r}`,{error:s}=await c.storage.from("public-assets").upload(i,e,{contentType:e.type,upsert:!0});if(s)throw s;const{data:l}=c.storage.from("public-assets").getPublicUrl(i),a=l?.publicUrl||null;await c.from("factions").update({custom_logo_url:a}).eq("id",o);const d=document.getElementById("id-logo");d&&(d.innerHTML=`<img src="${a}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`);const m=document.getElementById("corp-logo");m&&(m.innerHTML=`<img src="${a}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`),n&&(n.textContent="Change Logo")}catch(r){console.error("Logo upload failed:",r),alert("Upload failed: "+(r.message||"Unknown error")),n&&(n.textContent="Upload Logo")}}window.saveSlogan=te;window.toggleCorpDropdown=oe;window.switchToFaction=ae;const Et=24,re=.5;async function Mt(t,e){const o=e-Et,{data:n}=await c.from("event_log").select("fired_at_tick, effects_applied").eq("trigger_key","corp_bankruptcy").gte("fired_at_tick",o).order("fired_at_tick",{ascending:!1}).limit(20),r=(n||[]).find(s=>s.effects_applied?.user_id===t),i=r?Math.max(0,r.fired_at_tick+Et-e):0;return{onCooldown:i>0,ticksLeft:i}}async function ie(t,e,o){const n=document.getElementById("bankruptcy-action");if(!n)return;const{onCooldown:r,ticksLeft:i}=await Mt(t.id,o);n.innerHTML=`
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border-0);">
            <div class="id-row" style="border-bottom:none;flex-direction:column;align-items:flex-start;gap:6px;">
                <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
                    <span class="id-row__label" style="color:#a44;">CEO Action</span>
                </div>
                <div style="width:100%;">
                    <button id="bankruptcy-btn" onclick="declareBankruptcy()" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:#c55;background:transparent;border:1px solid #c55;padding:6px 16px;cursor:pointer;transition:all 0.15s;width:100%;" ${r?"disabled":""}>
                        ${r?"Bankruptcy Cooldown ("+i+" ticks)":"Declare Bankruptcy"}
                    </button>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);line-height:1.5;">
                    The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:#c55;line-height:1.5;">
                    This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.
                </div>
            </div>
        </div>
    `}let bt=!1;async function se(){if(bt){console.warn("Bankruptcy already in progress");return}const{data:{user:t}}=await c.auth.getUser();if(!t){alert("Not logged in.");return}const e=sessionStorage.getItem("active_faction_id");if(!e){alert("No active faction selected.");return}const{data:o,error:n}=await c.from("factions").select("*").eq("id",e).eq("faction_type","corporation").is("abandoned_at",null).single();if(n||!o){alert("No active corporation found. It may have already been dissolved."),console.error("Bankruptcy lookup failed:",n?.message,"factionId:",e);return}const r=o,i=r.faction_name||"this corporation",{data:s,error:l}=await c.from("shard").select("current_tick").eq("name","Alpha Shard").single();if(l||!s){alert("Failed to read game tick. Please try again.");return}const a=s.current_tick||0,{onCooldown:d,ticksLeft:m}=await Mt(t.id,a);if(d){alert("Bankruptcy is on cooldown. You must wait "+m+" more tick"+(m!==1?"s":"")+" before declaring bankruptcy again.");return}if(!confirm("DECLARE BANKRUPTCY — "+i.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+i+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}bt=!0;const $=document.getElementById("bankruptcy-btn");$&&($.disabled=!0,$.textContent="DECLARING BANKRUPTCY...",$.style.opacity="0.5");try{async function x(b){const{error:y}=await b;if(y)throw y}const q=Number(r.corp_cash_reserves)||0,{data:S}=await c.from("corp_properties").select("purchase_price, condition").eq("faction_id",e);let L=0;for(const b of S||[]){const y=Number(b.condition||0)/100;L+=Math.round(Number(b.purchase_price||0)*y)}const z=q+L,N=Number(r.corp_loans)||0,R=z-N,C=Math.round(R*(1+.3)),O=Math.max(0,Math.round(C*re)),{data:A}=await c.from("finance_active_loans").select("*").eq("borrower_faction_id",e).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!0});let h=0;for(const b of A||[]){const y=b.principal-b.total_paid;if(y<=0)continue;const g=Math.min(y,O-h);if(g<=0)break;const{data:P}=await c.from("factions").select("corp_cash_reserves").eq("id",b.lender_faction_id).single();P&&await x(c.from("factions").update({corp_cash_reserves:(Number(P.corp_cash_reserves)||0)+g}).eq("id",b.lender_faction_id)),await x(c.from("finance_active_loans").update({status:"repaid",total_paid:b.total_paid+g,completed_tick:a}).eq("id",b.id)),h+=g}await x(c.from("contract_bids").delete().eq("faction_id",e)),await x(c.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",e).in("status",["open","bidding"])),await x(c.from("corp_equipment_deliveries").delete().eq("faction_id",e)),await x(c.from("corp_equipment").delete().eq("faction_id",e)),await x(c.from("corp_properties").delete().eq("faction_id",e)),await c.from("corp_material_inventory").delete().eq("faction_id",e),await c.from("corp_warehouse").delete().eq("faction_id",e),await c.from("corp_executives").delete().eq("faction_id",e),await c.from("faction_agitators").delete().eq("faction_id",e),await x(c.from("factions").delete().eq("id",e));const B=h>0?" $"+h.toLocaleString()+" was repaid to creditors.":"";await x(c.from("event_log").insert({nation_id:r.nation_id,faction_id:e,event_name:i+" — Bankruptcy",description_used:i+" has officially filed for bankruptcy. It has laid off its executive staff and ceased operations."+B,category:"business",trigger_key:"corp_bankruptcy",effects_applied:{corp_name:i,sector:r.corp_sector,user_id:t.id,loan_payback:h,valuation:C},fired_at_tick:a})),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:I,error:p}=await c.from("factions").select("id, faction_type").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);p&&console.warn("Failed to check remaining factions:",p.message);const k=(I||[]).find(b=>b.faction_type==="party"),D=(I||[]).find(b=>b.faction_type==="corporation");k?(sessionStorage.setItem("active_faction_id",k.id),alert(i+" has declared bankruptcy."+(h>0?`
$`+h.toLocaleString()+" repaid to creditors.":"")+`

Redirecting to your political party.`),window.location.href="dashboard.html"):D?(sessionStorage.setItem("active_faction_id",D.id),alert(i+" has declared bankruptcy."+(h>0?`
$`+h.toLocaleString()+" repaid to creditors.":"")+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(i+" has declared bankruptcy."+(h>0?`
$`+h.toLocaleString()+" repaid to creditors.":"")+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(x){alert("Bankruptcy failed: "+(x.message||x)+`

Please try again or contact support.`),$&&($.disabled=!1,$.textContent="Declare Bankruptcy",$.style.opacity="1")}finally{bt=!1}}window.declareBankruptcy=se;let pt=!1;function le(t,e,o,n){if(pt)return;const r=window._nationStats,s=1+(nt(r,"inflation")-50)/100*.3,l=Math.max(.1,n/100),a=Math.round(o*s*l),d=document.getElementById("prop-modal-overlay"),m=document.getElementById("prop-modal-content");m.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${v(e)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${_(o)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Inflation Modifier</span>
                <span style="color:var(--amber, #b09a5b);">${s.toFixed(3)}x</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Condition</span>
                <span style="color:${n>=75?"var(--green)":n>=50?"var(--amber)":"var(--red)"};">${n}%</span>
            </div>
            <div style="border-top:1px solid var(--border-hair);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-mono);font-weight:700;">
                <span style="color:var(--text-primary);">Sale Price</span>
                <span style="color:var(--gold, #c8a832);">${_(a)}</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-sell-confirm" onclick="confirmSellProperty('${t}', ${a})">Confirm Sale</button>
        </div>
    `,d.style.display="flex"}async function ce(t,e){if(pt)return;pt=!0;const o=document.getElementById("prop-sell-confirm");o&&(o.disabled=!0,o.textContent="Selling...");try{const n=window._corpFactionId;if(!n)throw new Error("No faction");const{error:r}=await c.from("corp_properties").update({is_active:!1}).eq("id",t).eq("faction_id",n);if(r)throw new Error("Failed to sell property: "+r.message);const{data:i}=await c.from("factions").select("corp_cash_reserves").eq("id",n).single(),s=Number(i?.corp_cash_reserves??0),{error:l}=await c.from("factions").update({corp_cash_reserves:s+e}).eq("id",n);l&&console.error("[Property] Failed to credit cash:",l.message),vt(),alert("Property sold for "+_(e)+". Cash credited."),location.reload()}catch(n){alert("Sale failed: "+n.message)}finally{pt=!1,o&&(o.disabled=!1,o.textContent="Confirm Sale")}}let ft=!1;function de(t,e,o,n){if(ft)return;const r=window._nationStats,i=window._factionData,l=1+(nt(r,"inflation")-50)/100*.3,a=Math.round(2e6*(n/1e3)),d=Math.round(a*l),m=Math.max(50,Math.round(n*.1)),u=Number(i?.corp_general_workforce??0),$=u>=m,q=Number(i?.corp_cash_reserves??0)>=d,S=document.getElementById("prop-modal-overlay"),L=document.getElementById("prop-modal-content"),z=$&&q&&o<100;let N="";o>=100?N='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property is already at 100% condition.</div>':q?$||(N='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient general workforce (need '+m.toLocaleString()+", have "+u.toLocaleString()+").</div>"):N='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>',L.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${v(e)} — Current Condition: ${o}%</div>
        ${N}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost</span>
                <span style="color:${q?"var(--gold, #c8a832)":"var(--red)"};">${_(d)}</span>
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
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${t}', ${d}, ${m})" ${z?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,S.style.display="flex"}async function pe(t,e,o){if(ft)return;ft=!0;const n=document.getElementById("prop-refurb-confirm");n&&(n.disabled=!0,n.textContent="Starting...");try{const r=window._corpFactionId,i=window._currentTick;if(!r)throw new Error("No faction");const s=Math.floor(Math.random()*6)+1,a=94+(Math.floor(Math.random()*6)+1),d=i+s,{data:m}=await c.from("factions").select("corp_cash_reserves").eq("id",r).single(),u=Number(m?.corp_cash_reserves??0);if(u<e)throw new Error("Insufficient cash");const{error:$}=await c.from("factions").update({corp_cash_reserves:u-e}).eq("id",r);if($)throw new Error("Failed to deduct cost: "+$.message);const{error:x}=await c.from("corp_properties").update({refurbish_until_tick:d,refurbish_condition:a}).eq("id",t).eq("faction_id",r);if(x)throw new Error("Failed to start refurbishment: "+x.message);vt(),alert("Refurbishment started! Duration: "+s+" tick"+(s!==1?"s":"")+". Condition will be restored to "+Math.min(100,a)+"% when complete."),location.reload()}catch(r){alert("Refurbishment failed: "+r.message)}finally{ft=!1,n&&(n.disabled=!1,n.textContent="Begin Refurbishment")}}function vt(){const t=document.getElementById("prop-modal-overlay");t&&(t.style.display="none")}window.showSellModal=le;window.confirmSellProperty=ce;window.showRefurbishModal=de;window.confirmRefurbish=pe;window.closePropModal=vt;window.showConvertModal=_e;window.confirmConvertProperty=me;let xt=!1;async function fe(t,e,o,n,r,i,s){if(!xt&&confirm("Accept bid from "+o+`?

Bid Price: `+_(n)+`
Quality: `+r+`/100
Workers: `+i+`

This will award the contract. The project begins immediately.`)){xt=!0;try{const{data:l}=await c.from("shard").select("current_tick").eq("name","Alpha Shard").single(),a=l?.current_tick||0,{error:d}=await c.from("contract_bids").update({status:"won"}).eq("id",e);if(d)throw d;const{error:m}=await c.from("contract_bids").update({status:"lost"}).eq("contract_id",t).neq("id",e);if(m)throw m;const{error:u}=await c.from("construction_contracts").update({status:"awarded",awarded_to_faction:s,awarded_at_tick:a}).eq("id",t);if(u)throw u;alert("Contract awarded to "+o+`!

Bid: `+_(n)+`
Project begins immediately.`),window._nationStats&&window._factionData&&F&&await kt(window._nationStats,window._nationStats?.name||"",window._factionData,F)}catch(l){alert("Failed to accept bid: "+(l.message||l))}finally{xt=!1}}}window.cpAcceptBid=fe;function ve(t){const e=document.getElementById("cp-bid-"+t);e&&(e.style.display=e.style.display==="none"?"":"none")}window.cpToggleBid=ve;let ht="branch_office";function _e(t,e,o){const n=(f?.corp_subsector||"").toLowerCase(),r=n==="banking"?[["branch_office","Branch Office"]]:n==="investment"?[["trading_floor","Trading Floor"]]:n==="insurance"?[["claims_office","Claims Office"]]:[];if(r.length===0)return;ht=r[0][0];const i=Math.round(o*.15),s=Math.floor(Math.random()*6)+4,l=document.getElementById("prop-modal-overlay"),a=document.getElementById("prop-modal-content");a.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Convert Property</div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:10px;">${v(e)}</div>
        <div style="display:flex;gap:4px;margin-bottom:10px;">
            ${r.map(([d,m])=>`<span onclick="_convertTargetType='${d}';document.querySelectorAll('.conv-opt').forEach(e=>e.style.background='transparent');this.style.background='rgba(138,106,170,0.15)'" class="conv-opt" style="flex:1;text-align:center;padding:6px;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(138,106,170,0.3);color:#8a6aaa;${d===ht?"background:rgba(138,106,170,0.15)":""}">${m}</span>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Cost</span>
            <span style="color:var(--gold);">${_(i)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Time</span>
            <span style="color:var(--text-bright);">${s} ticks</span>
        </div>
        <div style="font-size:8px;color:var(--text-dim);margin:8px 0;font-family:var(--font-mono);line-height:1.5;">Property will be offline during conversion. No revenue or workforce allocation until complete.</div>
        <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button class="prop-action-btn prop-action-btn--sell" onclick="closePropModal()">Cancel</button>
            <button class="prop-action-btn" style="background:rgba(138,106,170,0.12);border-color:rgba(138,106,170,0.3);color:#8a6aaa;" onclick="confirmConvertProperty('${t}',${i},${s})">Convert</button>
        </div>
    `,l.style.display="flex"}async function me(t,e,o){const n=Number(f?.corp_cash_reserves??0);if(n<e){alert("Insufficient cash. Need "+_(e)+".");return}const r=F?.current_tick||0;try{await c.from("factions").update({corp_cash_reserves:Math.max(0,n-e)}).eq("id",f.id),f.corp_cash_reserves=Math.max(0,n-e),await c.from("corp_properties").update({type:ht,refurbish_until_tick:r+o,condition:100}).eq("id",t),vt();const i=window._nationStats;await kt(i,i?.name||f?.nation,f,F)}catch(i){alert("Conversion failed: "+i.message)}}const Lt={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},Nt={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},ue={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let st="nation",lt="local",Q=null;function ge(t){return t?t.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase()):""}function Ct(t,e){if(!t)return"<em>Unknown</em>";const o=v(t);return e?`<span style="color:${e.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${o}</span>`:`<strong>${o}</strong>`}function It(t,e,o){const n=t.factions?.nation_id===(t.nation_id||e),r=t.proposer_name||(n?t.factions?.faction_name:null)||"A former party",i=t.proposer_color||(n?t.factions?.party_color:null);return{fired_at_tick:t.proposed_tick,event_name:t.bill_name,_desc_html:`${Ct(r,i)} proposed "${v(t.bill_name)}"`,category:"bill",_synthetic:!0,...o}}function St(t,e){const o=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:null,n=o?` led by <strong>${v(o)}</strong>`:"";return{fired_at_tick:0,event_name:t.faction_name,_desc_html:`${Ct(t.faction_name,t.party_color)} founded${n}`,category:"new_party",_synthetic:!0,_created_at:t.created_at,...e}}function qt(t,e){const o=ue[t.tier]||`Tier ${t.tier}`,n=t.demand_label?` demanding "${v(t.demand_label)}"`:"",r=t.status==="crisis_active",i=t.tier>=6?"#e74c3c":t.tier>=4?"#f39c12":"",s=i?`<span style="color:${i};font-weight:600">${v(o)}</span>`:`<strong>${v(o)}</strong>`;return{fired_at_tick:t.tick_resolved||t.tick_called,event_name:o,_desc_html:`${Ct(t.factions?.faction_name,t.factions?.party_color)} organised a protest${n} — ${s}${r?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...e}}function Rt(t,e,o,n,r){return[...t.map(i=>({...i,_synthetic:!1})),...e,...o,...n].sort((i,s)=>{const l=(s.fired_at_tick||0)-(i.fired_at_tick||0);if(l!==0)return l;const a=i._created_at||i.created_at||"",d=s._created_at||s.created_at||"";return d>a?1:d<a?-1:0}).slice(0,r)}function Bt(t){if(t._synthetic&&t._desc_html)return t._desc_html;const e=t.description_chosen||t.description_used||"",o=ge(t.event_name),n=o?`<strong>${v(o)}</strong>`:"",r=e?v(e):"";return n&&r?`${n} — ${r}`:r||n||"Event"}function Pt(t){return t.map(e=>{const o=wt(e.fired_at_tick),n=Lt[(e.category||"").toLowerCase()]||Nt;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${v(o)}</span>
            <span class="corp-ev-icon" style="color:${n.color}">${n.icon}</span>
            <span class="corp-ev-text">${Bt(e)}</span>
            ${n.label?`<span class="corp-ev-cat" style="color:${n.color};background:${n.bg}">${n.label}</span>`:""}
        </div>`}).join("")}const Tt=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function ye(t){let e=0;for(let o=0;o<t.length;o++)e=(e<<5)-e+t.charCodeAt(o)|0;return Tt[Math.abs(e)%Tt.length]}function zt(t){return t.map(e=>{const o=wt(e.fired_at_tick),n=Lt[(e.category||"").toLowerCase()]||Nt,r=e.nations?.name||"Unknown",i=e.nations?.nation_profiles,s=Array.isArray(i)?i[0]?.flag_url:i?.flag_url,l=ye(r),a=s?`<img src="${v(s)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${v(o)}</span>
                <span class="corp-ev-nation-badge" style="color:${l.color};background:${l.bg};border-color:${l.border};">${a}${v(r)}</span>
            </span>
            <span class="corp-ev-text">${Bt(e)}</span>
            ${n.label?`<span class="corp-ev-cat" style="color:${n.color};background:${n.bg}">${n.label}</span>`:""}
        </div>`}).join("")}async function be(){const t=document.getElementById("corp-events-list");if(!t||!Q)return;const{nationId:e}=Q;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[o,n]=await Promise.all([c.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").eq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),c.from("event_log").select("*").eq("nation_id",e).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),r=o.data||[],i=n.data||[],s=r.map(a=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${a.faction_name} [${a.corp_ticker||a.abbreviation||"??"}] was founded with a specialty in ${a.corp_subsector||a.corp_sector||"General"}. Led by CEO ${[a.leader_first_name,a.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:a.founded_tick||0})),l=[...i,...s].sort((a,d)=>(d.fired_at_tick||0)-(a.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events in this nation yet.</div>';return}t.innerHTML=Pt(l)}catch(o){console.error("Corp local events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function xe(){const t=document.getElementById("corp-events-list");if(!t||!Q)return;const{nationId:e}=Q;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[o,n]=await Promise.all([c.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),c.from("event_log").select("*, nations(name, nation_profiles(flag_url))").neq("nation_id",e).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),r=o.data||[],i=n.data||[],s=r.map(a=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${a.faction_name} [${a.corp_ticker||a.abbreviation||"??"}] was founded in ${a.nation||"Unknown"} with a specialty in ${a.corp_subsector||a.corp_sector||"General"}. Led by CEO ${[a.leader_first_name,a.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:a.founded_tick||0,nations:{name:a.nation||"Unknown"}})),l=[...i,...s].sort((a,d)=>(d.fired_at_tick||0)-(a.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=zt(l);return}catch(o){console.error("Corp world events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>';return}try{const{data:o,error:n}=await c.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(n)throw n;if(!o||o.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=he(o,!0)}catch(o){console.error("Corp world events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function he(t,e){return t.map(o=>{const n=[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown",r=o.nation||"Unknown",i=o.corp_subsector||o.corp_sector||"General",s=o.corp_ticker||o.abbreviation||"",l=o.founded_tick?wt(o.founded_tick):"";let a='<div class="corp-event-row">';return a+='<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--teal);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);padding:1px 5px;display:inline-block;margin-bottom:2px;">'+v(r.toUpperCase())+"</div>",a+='<div style="font-size:11px;color:var(--text-primary);line-height:1.5;">',a+='<span style="font-weight:600;">'+v(o.faction_name)+"</span>",s&&(a+=' <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">['+v(s)+"]</span>"),a+=' was founded in <span style="font-weight:500;">'+v(r)+"</span>",a+=' with a specialty in <span style="color:var(--teal);font-weight:500;">'+v(i)+"</span>.",a+=' Led by CEO <span style="font-weight:500;">'+v(n)+"</span>.",a+="</div>",l&&(a+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">'+v(l)+"</div>"),a+="</div>",a}).join("")}async function At(){const t=document.getElementById("corp-events-list");if(!t||!Q)return;const{nationId:e}=Q;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[o,n,r,i]=await Promise.all([c.from("event_log").select("*").eq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(50),c.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),c.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",e).order("created_at",{ascending:!1}).limit(20),c.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(o.error)throw o.error;const s=o.data||[],l=Rt(s,(n.data||[]).map(a=>It(a,e)),(r.data||[]).map(a=>St(a)),(i.data||[]).map(a=>qt(a)),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>';return}t.innerHTML=Pt(l)}catch(o){console.error("Nation events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function we(){const t=document.getElementById("corp-events-list");if(!t||!Q)return;const{nationId:e}=Q;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[o,n,r,i]=await Promise.all([c.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(60),c.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),c.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("created_at",{ascending:!1}).limit(15),c.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(o.error)throw o.error;const s=o.data||[],l=Rt(s,(n.data||[]).map(a=>It(a,null,{nations:a.nations})),(r.data||[]).map(a=>St(a,{nations:a.nations})),(i.data||[]).map(a=>qt(a,{nations:a.nations})),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>';return}t.innerHTML=zt(l)}catch(o){console.error("World events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}window.switchCorpEventsCat=function(t){t!==st&&(st=t,document.querySelectorAll("#corp-events-cat-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.cat===t)),Ot())};window.switchCorpEventsScope=function(t){t!==lt&&(lt=t,document.querySelectorAll("#corp-events-scope-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.scope===t)),Ot())};function Ot(){st==="nation"&&lt==="local"?At():st==="nation"&&lt==="world"?we():st==="corporate"&&lt==="local"?be():xe()}Gt();
