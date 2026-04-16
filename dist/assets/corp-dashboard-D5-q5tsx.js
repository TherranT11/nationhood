const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BNWh-zwV.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as p}from"./supabase-client-CiYoFhIh.js";/* empty css                    */import{_ as Ft}from"./preload-helper-BXl3LOEh.js";import{e as v,t as ht}from"./utils-CY90Gazr.js";import{initMessaging as Dt}from"./messaging-BUrQna7p.js";import{c as Ut}from"./equipment-DsuDdEne.js";let it=[],f=null,O=null;function _(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(2)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(1)+"k":"$"+Math.round(t).toLocaleString()}function nt(t,e){return Number(t?.[e]??50)}async function Ht(){const{data:{user:t}}=await p.auth.getUser();if(!t){window.location.href="login.html";return}const{data:e}=await p.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);it=(e||[]).filter(b=>b.nation_id&&!b.abandoned_at);const o=sessionStorage.getItem("active_faction_id");if(f=it.find(b=>b.id===o)||it.find(b=>b.faction_type==="corporation")||it[0],!f){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",f.id),f.faction_type!=="corporation"){window.location.href="dashboard.html";return}const r={Construction:"corp-operations.html",Finance:"corp-operations-finance.html",Shipping:"corp-operations.html"}[f.corp_sector]||"corp-operations.html",s=document.getElementById("nav-operations"),i=document.getElementById("nav-expansion");s&&(s.href=r),i&&(i.href="corp-operations.html?tab=expansion");let l=f.nation||"",a=null;const[c,u]=await Promise.all([f.nation_id?p.from("nations").select("*").eq("id",f.nation_id).single():Promise.resolve({data:null}),p.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);c.error&&console.warn("Nation load failed:",c.error.message),c.data&&(l=c.data.name,a=c.data),u.error&&console.warn("Shard load failed:",u.error.message),O=u.data;let m=0;if(f?.id){const{data:b}=await p.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",f.id).in("status",["open","bidding"]);if(b)for(const g of b)m+=(g.contract_bids||[]).length}const k=document.getElementById("corp-topbar-container");if(k){const{renderCorpTopBar:b}=await Ft(async()=>{const{renderCorpTopBar:A}=await import("./corp-topbar-BNWh-zwV.js");return{renderCorpTopBar:A}},__vite__mapDeps([0,1])),g={};m>0&&(g.home={color:"#c8a832",title:m+" pending bid"+(m!==1?"s":"")+" on your projects"}),b(k,{faction:f,shard:O,activeTab:"home",allUserFactions:it,badges:g})}document.getElementById("id-type-badge").textContent=f.corp_company_type||"—";const M=document.getElementById("id-logo"),R=(f.corp_ticker||f.abbreviation||"").toUpperCase();f.custom_logo_url?M.innerHTML=`<img src="${v(f.custom_logo_url)}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`:M.textContent=R.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=f.faction_name||"Unnamed Corp";const S=f.party_description||"";document.getElementById("id-slogan").textContent=S?'"'+S+'"':'"--"';const T=O?.current_date?O.current_date.replace(/.*,\s*/,""):"—",P=f.leader_first_name&&f.leader_last_name?f.leader_first_name+" "+f.leader_last_name+(f.leader_age?" ("+f.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${v(T)}</span>
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
            <span class="id-row__value">${v(P)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${v(f.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${v(R)}</span>
        </div>
    `;const L=f.last_rename_tick||0,q=O?.current_tick||0,h=Math.max(0,L+120-q),B=!S||S==="-"||S==='"-"'||h<=0,E=document.getElementById("slogan-editor");E.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${v(S)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${B?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${B?"60 characters max. 120 tick cooldown after change.":h+" ticks until you can change slogan."}</div>
    `;const z=document.getElementById("corp-logo-upload");z.innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Logo</span>
            <label class="id-row__value" style="cursor:pointer;text-decoration:underline;" id="corp-logo-label">
                ${f.custom_logo_url?"Change Logo":"Upload Logo"}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" id="corp-logo-file" style="display:none;">
            </label>
        </div>
    `,document.getElementById("corp-logo-file")?.addEventListener("change",ee),window._corpFactionId=f.id,window._currentTick=q,window._nationStats=a,window._factionData=f;const N=Wt(a,l,f);Kt(l,f);const d=await $t(a,l,f,O);let x=0;if(f?.id){const{data:b,error:g}=await p.from("corp_equipment").select("equipment_key, owned").eq("faction_id",f.id);g||(x=Ut(b||[]))}let j=0;if(f?.id){const{data:b}=await p.from("corp_executives").select("salary_per_year").eq("faction_id",f.id).eq("status","active");j=(b||[]).reduce((g,A)=>g+(Number(A.salary_per_year)||0),0)}let I=0;if(f?.id&&f.corp_sector==="Shipping"){const{data:b}=await p.from("corp_vessels").select("base_maintenance").eq("faction_id",f.id).neq("status","for_sale");I=(b||[]).reduce((g,A)=>g+(Number(A.base_maintenance)||0),0)}await jt(a,O,N,f,d.propertyMaintenance||0,x,j,d,I),Yt(a,l,f,N,d),Dt(f,a,O),Q={nationId:f.nation_id},zt(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function Wt(t,e,o){const n=x=>nt(t,x),r=(e||"UNKNOWN").toUpperCase(),s=Number(o?.corp_general_workforce??2250),i=Number(o?.corp_skilled_workforce??600),l=Number(o?.corp_innovative_workforce??150),a=s+i+l,c=2,u=3,m=6,k=n("minimum_wage"),M=k/100*48e3,R=n("inflation"),S=n("standard_of_living"),T=1+(R-50)/100*.5,P=1+(S-50)/100*.5,L=x=>Math.round(M*x*T*P),q=L(c),$=L(u),h=L(m),D=s*q,B=i*$,E=l*h,z=D+B+E;function N(x){return"$"+Math.round(x).toLocaleString()+"/yr"}const d=`${T.toFixed(2)} &times; ${P.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=a.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${v(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${s.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${c}.0 &times; ${d})</span>
                <span class="wf-tier__value">${N(q)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${_(D)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${v(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${i.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${u}.0 &times; ${d})</span>
                <span class="wf-tier__value">${N($)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${_(B)}</span>
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
                <span class="wf-tier__label">Wage (min &times; ${m}.0 &times; ${d})</span>
                <span class="wf-tier__value">${N(h)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${_(E)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${v(r)})</span>
                <span class="wf-tier__value">${k}/100 → ${N(M)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${T.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${P.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${a.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${_(z)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${_(z/12)}</span>
            </div>
        </div>
    `,{totalWages:z,generalTotal:D,skilledTotal:B,innovativeTotal:E,monthlyWages:Math.round(z/12)}}async function jt(t,e,o,n,r,s,i,l,a){const c=e?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+c;const u=87e6,m=w=>nt(t,w),k=1+(m("gdp_growth")-50)/100*.4,M=1+(m("urbanization")-50)/100*.3,R=1+(m("population_growth")-50)/100*.2,S=1+(m("standard_of_living")-50)/100*.15,T=1+(50-m("physical_infrastructure"))/100*.1,P=1-Math.max(0,m("inflation")-50)/100*.1,L=1-Math.max(0,m("interest_rates")-50)/100*.1,q=k*M*R*S*T*P*L,$=Math.round(u*q),h=(n.corp_general_workforce||0)+(n.corp_skilled_workforce||0)+(n.corp_innovative_workforce||0),D=Math.max(500,l?.totalCapacity||500),B=Math.min(1,h/D),E=l?.propertyRevBonus||0,z=Math.round(Math.round($/12)*B)+E,N=0,d=0,x=N+d+z,j=o?.totalWages||0,I=Math.round(j/12),b=0,g=r||0,A=s||0,G=Number(n?.corp_loans)||0,U=.05,ct=G>0?Math.round(G*(U/12)/(1-Math.pow(1+U/12,-120))):0,rt=Math.round((i||0)/12),ot=a||0,C=75e3,y=Math.max(0,Math.min(1,Number(t?.corporate_tax??0)/100||0)),tt=I+rt+b+g+A+ot+ct+C,V=Math.max(0,x-tt),et=Math.round(V*y);let H="";try{const w=new Set([n.nation_id]),{data:dt}=await p.from("corp_properties").select("nation_id").eq("faction_id",n.id).eq("is_active",!0);if((dt||[]).forEach(Y=>{Y.nation_id&&w.add(Y.nation_id)}),w.size>0){const{data:Y}=await p.from("nations").select("id, name, corporate_tax").in("id",[...w]);Y&&Y.length>0&&(H=Y.sort((at,W)=>(at.name||"").localeCompare(W.name||"")).map(at=>{const W=Math.round(Number(at.corporate_tax??0)),ut=Math.round(V*(W/100)/Y.length),gt=W>25?"#c55":W>15?"#ca5":"#5c5";return`<div style="display:flex;justify-content:space-between;padding:1px 0;font-family:var(--font-mono);font-size:8px;">
                        <span style="color:var(--text-dim);">${at.name} (<span style="color:${gt}">${W}%</span>)</span>
                        <span style="color:#a44;">${_(ut)}</span>
                    </div>`}).join(""))}}catch{}const K=tt+et,X=x-K,F=Number(n?.corp_cash_reserves??0),_t=G,mt=[{stat:"gdp_growth",value:m("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:m("urbanization"),weight:"0.3"},{stat:"population_growth",value:m("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:m("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:m("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:m("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:m("interest_rates"),weight:"-0.1",neg:!0}];function J(w){return w.neg?w.value>50?"var(--red)":"var(--green)":w.note?w.value<50?"var(--green)":"var(--red)":w.value>=50?"var(--green)":w.value>=35?"var(--amber)":"var(--red)"}const Z=x||1,Bt=(N/Z*100).toFixed(1),At=(d/Z*100).toFixed(1),Ot=(z/Z*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${Bt}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${At}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${Ot}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${_(N)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${_(d)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${_(z-E)}</span></div>
            ${E>0?`<div class="fin-row"><span class="fin-row__label">Property Revenue<span class="fin-row__badge">BUILDINGS</span></span><span class="fin-row__value" style="color:var(--green)">${_(E)}</span></div>`:""}
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${_(x)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${_(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Executive Compensation</span><span class="fin-row__value" style="color:#a44">${_(rt)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${_(b)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${_(g)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${_(A)}</span></div>
            ${ot>0?`<div class="fin-row"><span class="fin-row__label">Fleet Maintenance</span><span class="fin-row__value" style="color:#a44">${_(ot)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${_(ct)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${_(et)}</span></div>
            ${H?`<div style="padding:2px 12px 6px 20px;border-bottom:1px solid rgba(255,255,255,0.04);">${H}</div>`:""}
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
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${_(F)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${_(_t)}</div>
            </div>
        </div>
        <!-- Purchasing Power -->
        ${(()=>{const w=Number(t?.currency_strength??50),dt=Number(t?.inflation??0),Y=w/50,at=Math.max(.5,1-dt/200),W=Math.round(F*Y*at),ut=W>=F?"var(--green)":W>=F*.8?"var(--amber)":"var(--red)",gt=F>0?Math.round(W/F*100):100;return`<div style="padding:4px 14px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-hair);">
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.5px;text-transform:uppercase;">Purchasing Power</div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${ut};">${_(W)}</span>
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${gt}% · CUR ${w} · INF ${Math.round(dt)}</span>
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
            ${mt.map(w=>`
                <div class="drv-row">
                    <span class="drv-row__name">${w.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${w.value}%;background:${J(w)}"></div></div>
                    <span class="drv-row__val">${w.value}</span>
                    <span class="drv-row__wt">&times;${w.weight}</span>
                    ${w.note?'<span class="drv-row__note">'+w.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${q.toFixed(2)}</span>
            </div>
        </div>
    `,wt()}let yt=!1;async function Gt(t,e){if(!(!f||yt)){yt=!0;try{const{data:o,error:n}=await p.from("finance_loan_offers").select("*").eq("id",t).single();if(n||!o)return;const{data:r,error:s}=await p.from("finance_loan_requests").select("*").eq("id",e).single();if(s||!r||r.status!=="open")return;const i=o.interest_rate/100/12,l=r.term_months,a=i>0?Math.round(r.amount*i/(1-Math.pow(1+i,-l))):Math.round(r.amount/l),c=O?.current_tick||0,{error:u}=await p.from("finance_loan_requests").update({status:"funded",accepted_offer_id:t,funded_tick:c}).eq("id",e);if(u)return;await p.from("finance_loan_offers").update({status:"accepted"}).eq("id",t),await p.from("finance_loan_offers").update({status:"declined"}).eq("request_id",e).neq("id",t).eq("status","pending"),await p.from("finance_active_loans").insert({request_id:e,offer_id:t,borrower_faction_id:r.requesting_faction_id,lender_faction_id:o.offering_faction_id,nation_id:r.nation_id,principal:r.amount,interest_rate:o.interest_rate,term_months:r.term_months,collateral_type:o.collateral_type,purpose:r.purpose,monthly_payment:a,started_tick:c});const{data:m}=await p.from("factions").select("corp_cash_reserves").eq("id",o.offering_faction_id).single();m&&await p.from("factions").update({corp_cash_reserves:Math.max(0,(Number(m.corp_cash_reserves)||0)-r.amount)}).eq("id",o.offering_faction_id);const{data:k}=await p.from("factions").select("corp_cash_reserves, corp_debt").eq("id",r.requesting_faction_id).single();if(k){const{error:M}=await p.from("factions").update({corp_cash_reserves:(Number(k.corp_cash_reserves)||0)+r.amount,corp_debt:(Number(k.corp_debt)||0)+r.amount}).eq("id",r.requesting_faction_id);M&&console.error("[Loans] Failed to credit borrower + track debt:",M.message)}}finally{yt=!1}wt()}}async function Vt(t){await p.from("finance_loan_requests").update({status:"cancelled"}).eq("id",t),wt()}async function wt(){if(!f)return;const t=document.getElementById("fin-loans-list");if(t)try{const{data:e,error:o}=await p.from("finance_loan_requests").select("*, finance_loan_offers!request_id(*)").eq("requesting_faction_id",f.id).in("status",["open","funded"]).order("created_tick",{ascending:!1});o&&console.error("[Loans] Request query error:",o.message);const{data:n,error:r}=await p.from("finance_active_loans").select("*").eq("borrower_faction_id",f.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1});r&&console.error("[Loans] Active loans query error:",r.message);let s="";if(e&&e.length>0){for(const i of e)if(i.status==="open"){const l=(i.finance_loan_offers||[]).filter(a=>a.status==="pending");if(s+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span style="color:#5a8aaa;font-weight:700;">OPEN</span>
                            <span style="color:var(--text-primary);margin-left:4px;">${_(i.amount)}</span>
                            <span style="color:var(--text-dim);margin-left:4px;">${i.term_months}mo</span>
                        </div>
                        <span style="color:var(--text-dim);cursor:pointer;" onclick="cancelRequest('${i.id}')">&#10005;</span>
                    </div>
                    <div style="font-size:7px;color:var(--text-dim);margin-top:2px;">${v(i.purpose||"")}</div>`,l.length>0){s+=`<div style="margin-top:4px;font-size:7px;color:#5a8aaa;font-weight:700;">${l.length} OFFER${l.length>1?"S":""}</div>`;for(const a of l.sort((c,u)=>c.interest_rate-u.interest_rate))s+=`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-top:1px solid var(--border-hair);">
                            <span style="color:var(--text-primary);font-weight:700;">${a.interest_rate}%</span>
                            <span style="color:var(--text-dim);">${a.collateral_type}</span>
                            <span style="flex:1;"></span>
                            <span style="padding:2px 8px;cursor:pointer;color:#000;background:#5a8aaa;font-weight:700;font-size:7px;" onclick="acceptOffer('${a.id}','${i.id}')">ACCEPT</span>
                        </div>`}else s+='<div style="margin-top:2px;font-size:7px;color:var(--text-dim);">Awaiting offers from finance corporations...</div>';s+="</div>"}}if(n&&n.length>0)for(const i of n){const l=i.status==="current"?"var(--green)":i.status==="late"?"#c84":"#c55",a=i.term_months>0?Math.round(i.payments_made/i.term_months*100):0;s+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="color:${l};font-weight:700;">${i.status.toUpperCase()}</span>
                        <span style="color:var(--text-primary);margin-left:4px;">${_(i.principal)}</span>
                        <span style="color:var(--text-dim);margin-left:4px;">@ ${i.interest_rate}%</span>
                    </div>
                    <span style="color:var(--text-dim);">${a}% repaid</span>
                </div>
                <div style="height:2px;background:var(--border-0);margin-top:3px;">
                    <div style="height:100%;width:${a}%;background:${l};"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Payment: ${_(i.monthly_payment)}/mo</span>
                    <span>${i.payments_made}/${i.term_months} payments</span>
                </div>
            </div>`}s||(s='<div style="color:var(--text-dim);">No active loans.</div>'),t.innerHTML=s}catch(e){console.error("[Loans] loadLoansSection error:",e)}}window.acceptOffer=Gt;window.cancelRequest=Vt;function Kt(t,e){const o=(t||"").toUpperCase(),n=Number(e.corp_general_workforce??0)+Number(e.corp_skilled_workforce??0)+Number(e.corp_innovative_workforce??0),r=[{label:"Reputation",value:Number(e.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:n||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(e.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(e.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(e.corp_market_share??5),change:0,nation:o,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(e.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(e.corp_regulatory_standing??50),change:0,nation:o,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(e.corp_political_influence??10),change:0,decay:!0,nation:o,max:100},{label:"Innovation",value:Number(e.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function s(a,c){if(!c||c>100)return"var(--text-primary)";const u=a/c*100;return u>=70?"var(--green)":u>=40?"var(--amber)":u>=20?"var(--orange, #d48a3c)":"var(--red)"}function i(a){const c=parseFloat(a),u=c>0?"var(--green)":c<0?"var(--red)":"var(--text-dim)",m=c>0?"▲":c<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${u}">${m}</span>
            <span class="stat-item__delta" style="color:${u}">${Math.abs(c).toFixed(1)}</span>
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
                            ${i(a.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${Math.min(100,a.value)}%"></div></div>
                </div>`;continue}a.section&&(l+=`<div class="stats-section"><span class="stats-section__label">${a.section}</span></div>`);const c=a.max&&a.max<=100;l+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${a.label}</span>
                        ${a.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${a.nation?'<span class="stat-item__nation">'+v(a.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${c?s(a.value,a.max):"var(--text-primary)"}">${typeof a.value=="number"?c?Math.round(a.value):a.value.toLocaleString():a.value}</span>
                    ${c?'<span class="stat-item__max">/100</span>':""}
                    ${i(a.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=l}async function $t(t,e,o,n){const r=(e||"UNKNOWN").toUpperCase();let s=[];if(o?.id){const{data:d}=await p.from("corp_properties").select("*").eq("faction_id",o.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});s=d||[]}const i={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,a=0;const c=Number(o?.corp_general_workforce??0)+Number(o?.corp_skilled_workforce??0)+Number(o?.corp_innovative_workforce??0),u=500,m=u+s.reduce((d,x)=>d+Number(x.capacity||0),0),k=m>0?Math.round(c*(u/m)):c,M=5e7,R=1+(nt(t,"inflation")-50)/100*.3,S=.8+nt(t,"stability")/100*.4,T=Math.round(M*R*S),P=Math.round(T*.005);l+=T,a+=P;let L=`
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
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${u}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${k.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${_(T)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${_(P)}</div>
            </div>
        </div>
    </div>`,q=k;for(const d of s){const x=i[d.style]||i.Basic;l+=Number(d.purchase_price||0),a+=Number(d.monthly_maintenance||0);const j=d.condition>=75?"var(--green)":d.condition>=50?"var(--amber)":"var(--orange)",I=Number(d.capacity||0),b=m>0?Math.min(c-q,Math.round(c*(I/m))):0;q+=b,L+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${v(d.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${v(d.city||r)} · ${(d.type||"").replace(/_/g," ")} · <span style="color:${x.color}">${(d.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge" ${["branch_office","trading_floor","claims_office"].includes(d.type)?'style="background:rgba(138,106,170,0.12);color:#8a6aaa;border-color:rgba(138,106,170,0.3);"':""}>${["branch_office","trading_floor","claims_office"].includes(d.type)?d.type.replace(/_/g," ").replace(/\b\w/g,g=>g.toUpperCase()):"OWNED"}</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${I.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${b.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${_(d.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${_(d.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${j}">${d.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${d.condition}%;height:100%;background:${j};"></div></div>
            ${d.refurbish_until_tick&&d.refurbish_until_tick>(n?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${d.refurbish_until_tick-(n?.current_tick||0)} tick${d.refurbish_until_tick-(n?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${d.id}','${v(d.name).replace(/'/g,"\\'")}',${d.purchase_price||0},${d.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${d.id}','${v(d.name).replace(/'/g,"\\'")}',${d.condition},${I})">REFURBISH</button>
                ${o?.corp_sector==="Finance"&&(d.type==="office"||d.type==="regional_hq")&&!["branch_office","trading_floor","claims_office"].includes(d.type)?`<button class="prop-action-btn" style="background:rgba(138,106,170,0.08);border-color:rgba(138,106,170,0.2);color:#8a6aaa;" onclick="showConvertModal('${d.id}','${v(d.name).replace(/'/g,"\\'")}',${d.purchase_price||0})">CONVERT</button>`:""}
            </div>`}
        </div>`}let $="",h=[];if(o?.id){const{data:d}=await p.from("construction_contracts").select("*, contract_bids(id, faction_id, bid_price, estimated_quality, estimated_cost, labor_count, markup_pct, material_grades, submitted_at_tick, status, factions!faction_id(faction_name, abbreviation, corp_reputation))").eq("issuer_faction_id",o.id).in("status",["open","bidding","awarded","in_progress"]).order("generated_at_tick",{ascending:!1});h=d||[];let x={};const j=h.filter(I=>I.status==="in_progress").map(I=>I.id);if(j.length>0){const{data:I}=await p.from("construction_events").select("contract_id, status, severity, title").in("contract_id",j).eq("status","ACTIVE");for(const b of I||[])x[b.contract_id]||(x[b.contract_id]=[]),x[b.contract_id].push(b)}if(h.length>0){const I={open:{label:"OPEN",color:"#5a8aaa"},bidding:{label:"BIDDING",color:"#c8a832"},awarded:{label:"AWARDED",color:"#8b9a6b"},in_progress:{label:"IN PROGRESS",color:"#5aaa8b"}},b={LOW:"#ca5",MODERATE:"#c84",HIGH:"#c55",CRITICAL:"#f44"};$=`<div class="cp-section">
                <div class="cp-section__header">
                    <span class="cp-section__title">Construction Projects</span>
                    <span class="cp-section__count">${h.length} ACTIVE</span>
                </div>`;for(const g of h){const A=I[g.status]||I.open,G=(g.contract_bids||[]).filter(C=>C.status==="pending"),U=(g.contract_bids||[]).find(C=>C.status==="won"),ct=n?.current_tick||0,rt=x[g.id]||[],ot=g.nation_id===o.nation_id?r:"";if($+=`<div class="cp-item">
                    <div class="cp-item__top">
                        <div>
                            <div class="cp-item__name">${v(g.name)}</div>
                            <div class="cp-item__sub">${v(g.project_code||"")} · ${v(g.sector||"")}${ot?" · "+v(ot):""}</div>
                        </div>
                        <span class="cp-badge" style="color:${A.color};border-color:${A.color}40;background:${A.color}08;">${A.label}</span>
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
                    </div>`,(g.status==="awarded"||g.status==="in_progress")&&U){const C=Number(U.factions?.corp_reputation??50),y=C>=70?"#5c5":C>=40?"#ca5":"#c55",tt=U.estimated_quality>=75?"#5c5":U.estimated_quality>=50?"#ca5":"#c55";if($+=`<div style="margin-top:6px;padding:6px 8px;background:var(--bg-3);border:1px solid var(--border-hair);">
                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.8px;margin-bottom:3px;">CONTRACTOR</div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-bright);margin-bottom:4px;">${v(U.factions?.faction_name||"Unknown")}</div>
                        <div style="display:flex;gap:0;">
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID</div>
                                <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${_(U.bid_price)}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                <div style="font-size:9px;font-weight:700;color:${tt};font-family:var(--font-mono);">${U.estimated_quality}/100</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${U.labor_count}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                <div style="font-size:9px;font-weight:700;color:${y};font-family:var(--font-mono);">${C}/100</div>
                            </div>
                        </div>`,g.status==="in_progress"&&g.awarded_at_tick!=null){const V=ct-g.awarded_at_tick,et=g.timeline_ticks||1,H=g.stalled_ticks||0,K=Math.min(100,Math.round(V/(et+H)*100)),X=K>=75?"#5c5":K>=40?"#ca5":"#5aaa8b",F=Math.max(0,et+H-V);$+=`<div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);margin-top:6px;">
                            <span style="color:var(--text-dim);">PROGRESS</span>
                            <span style="color:${X};">${K}%${H>0?" · "+H+" stalled":""} · ${F} tick${F!==1?"s":""} left</span>
                        </div>
                        <div class="cp-progress"><div class="cp-progress__bar" style="width:${K}%;background:${X};"></div></div>`}else $+='<div style="font-size:8px;font-family:var(--font-mono);color:var(--amber);margin-top:6px;text-align:center;">Awarded — construction begins next tick</div>';$+="</div>"}if(rt.length>0)for(const C of rt){const y=b[C.severity]||"#ca5";$+=`<div style="display:flex;align-items:center;gap:5px;margin-top:4px;padding:3px 6px;background:${y}08;border:1px solid ${y}20;">
                            <span class="cp-badge" style="color:${y};border-color:${y}40;background:${y}12;">${C.severity}</span>
                            <span style="font-size:8px;font-family:var(--font-mono);color:${y};">${v(C.title)}</span>
                        </div>`}if((g.status==="open"||g.status==="bidding")&&G.length>0)for(let C=0;C<G.length;C++){const y=G[C],tt=g.id.slice(0,8)+"-"+C,V=Number(y.factions?.corp_reputation??50),et=V>=70?"#5c5":V>=40?"#ca5":"#c55",H=y.estimated_quality>=75?"#5c5":y.estimated_quality>=50?"#ca5":"#c55",K=y.markup_pct<=10?"#5c5":y.markup_pct<=20?"#ca5":"#c55",X=y.material_grades||{},F=Object.entries(X),_t=J=>J.replace(/_/g," ").replace(/\b\w/g,Z=>Z.toUpperCase()),mt=J=>J==="HIGH"?"#5c5":J==="LOW"?"#c55":"var(--text-muted)";$+=`<div class="cp-bid" style="flex-direction:column;gap:0;padding:0;cursor:pointer;" onclick="cpToggleBid('${tt}')">
                            <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;">
                                <span style="flex:1;font-size:8px;font-family:var(--font-mono);color:var(--text-muted);">
                                    ${v(y.factions?.faction_name||"Unknown")}
                                    · <span style="color:var(--gold);">${_(y.bid_price)}</span>
                                    · Q: <span style="color:${H};">${y.estimated_quality}</span>
                                </span>
                                <span class="cp-bid__btn" style="color:#5c5;border-color:#5c540;background:#5c508;" onclick="event.stopPropagation();cpAcceptBid('${g.id}','${y.id}','${v((y.factions?.faction_name||"").replace(/'/g,""))}',${y.bid_price},${y.estimated_quality},${y.labor_count},'${y.faction_id}')">ACCEPT</span>
                            </div>
                            <div id="cp-bid-${tt}" style="display:none;padding:4px 8px 6px;border-top:1px solid var(--border-hair);background:rgba(255,255,255,0.01);">
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID PRICE</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${_(y.bid_price)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">EST. COST</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${_(y.estimated_cost||0)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MARKUP</div>
                                        <div style="font-size:9px;font-weight:700;color:${K};font-family:var(--font-mono);">${y.markup_pct}%</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                        <div style="font-size:9px;font-weight:700;color:${H};font-family:var(--font-mono);">${y.estimated_quality}/100</div>
                                    </div>
                                </div>
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${y.labor_count}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                        <div style="font-size:9px;font-weight:700;color:${et};font-family:var(--font-mono);">${V}/100</div>
                                    </div>
                                    <div style="flex:2;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDDER</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${v(y.factions?.faction_name||"Unknown")}</div>
                                    </div>
                                </div>
                                ${F.length>0?`<div style="padding:2px 4px;">
                                    <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;margin-bottom:2px;">MATERIAL GRADES</div>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                        ${F.map(([J,Z])=>`<span style="font-size:7px;font-family:var(--font-mono);color:${mt(Z)};">${_t(J)}: ${Z}</span>`).join("")}
                                    </div>
                                </div>`:""}
                            </div>
                        </div>`}if((g.status==="open"||g.status==="bidding")&&G.length===0){const C=(g.bidding_ends_tick||0)-(n?.current_tick||0);$+=`<div style="font-size:8px;font-family:var(--font-mono);color:var(--text-dim);margin-top:4px;text-align:center;">
                        Awaiting bids${C>0?" · "+C+" tick"+(C!==1?"s":"")+" remaining":""}
                    </div>`}$+="</div>"}$+="</div>"}}const D=document.getElementById("prop-count"),B=s.length+1,E=h.length,z=B+" ASSET"+(B!==1?"S":"")+(E>0?" · "+E+" PROJECT"+(E!==1?"S":""):"");D&&(D.textContent=z),document.getElementById("prop-body").innerHTML=`
        ${L}
        ${$}
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
    `;let N=0;N+=Math.round(u*50);for(const d of s){if(d.refurbish_until_tick&&(n?.current_tick||0)<d.refurbish_until_tick)continue;const x=Number(d.condition||0)/100;x>=.6&&(N+=Math.round(Number(d.capacity||0)*x*50))}return{propertyValue:l,propertyMaintenance:a,totalCapacity:m,propertyRevBonus:N}}function Yt(t,e,o,n,r){(e||"UNKNOWN").toUpperCase();const s=o.corp_company_type||"Private",i=Number(o.corp_cash_reserves)||0,l=r?.propertyValue||0,a=0,c=0,u=i+l+a+c,m=Number(o.corp_loans)||0,M=n?.monthlyWages||0,R=0,S=m+M+R,T=u-S,L=Math.round(T*(1+.3)),q=L-T,$=q>0;document.getElementById("val-type-badge").textContent=s.toUpperCase();function h(D,B,E={}){const z=E.indent?"val-line val-line--indent":"val-line",N=E.bold?"val-line__label val-line__label--bold":"val-line__label",d=E.bold?"val-line__value val-line__value--bold":"val-line__value",x=E.color||(E.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${z}"><span class="${N}">${D}</span><span class="${d}" style="color:${x}">${_(B)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${h("Cash & Reserves",i,{indent:!0})}
        ${h("Property",l,{indent:!0})}
        ${h("Equipment",a,{indent:!0})}
        ${h("Active Contracts",c,{indent:!0})}
        ${h("Total Assets",u,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${h("Outstanding Loans",m,{indent:!0})}
        ${h("Accounts Payable",M,{indent:!0})}
        ${h("Pending Project Costs",R,{indent:!0})}
        ${h("Total Liabilities",S,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${T>=0?"var(--green)":"var(--red)"};">${_(T)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${_(L)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${$?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${$?"var(--green)":"var(--red)"};">${$?"+":""}${_(q)}</span>
            </div>
            <div class="val-market__note">${$?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}function Qt(){document.body.classList.toggle("light-mode");const t=document.getElementById("theme-toggle");t.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const t=document.getElementById("theme-toggle");t&&(t.textContent="Dark")}async function Xt(){const t=document.getElementById("slogan-input"),e=document.getElementById("slogan-hint"),o=document.getElementById("slogan-save-btn"),n=(t.value||"").trim().slice(0,60);if(n.length===0){e.textContent="Slogan cannot be empty.",e.className="slogan-hint slogan-hint--error";return}o.disabled=!0,o.textContent="...",e.textContent="";try{const{error:r}=await p.from("factions").update({party_description:n,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(r)throw r;document.getElementById("id-slogan").textContent='"'+n+'"',e.textContent="Slogan saved! Next change in 120 ticks.",e.className="slogan-hint slogan-hint--ok",o.textContent="Save"}catch(r){console.error("Slogan save failed:",r),e.textContent="Failed to save slogan.",e.className="slogan-hint slogan-hint--error",o.disabled=!1,o.textContent="Save"}}async function Jt(){await p.auth.signOut(),window.location.href="login.html"}function Zt(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function te(t,e){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),e==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",t=>{const e=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&e&&!e.contains(t.target)&&o.classList.remove("open")});window.doLogout=Jt;window.toggleTheme=Qt;async function ee(t){const e=t.target.files?.[0];if(!e)return;if(e.size>128*1024){alert("Logo must be under 128KB.");return}const o=window._corpFactionId;if(!o)return;const n=document.getElementById("corp-logo-label");n&&(n.textContent="Uploading...");try{const r=e.name.split(".").pop()||"png",s=`party-logos/${o}/${Date.now()}.${r}`,{error:i}=await p.storage.from("public-assets").upload(s,e,{contentType:e.type,upsert:!0});if(i)throw i;const{data:l}=p.storage.from("public-assets").getPublicUrl(s),a=l?.publicUrl||null;await p.from("factions").update({custom_logo_url:a}).eq("id",o);const c=document.getElementById("id-logo");c&&(c.innerHTML=`<img src="${a}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`);const u=document.getElementById("corp-logo");u&&(u.innerHTML=`<img src="${a}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`),n&&(n.textContent="Change Logo")}catch(r){console.error("Logo upload failed:",r),alert("Upload failed: "+(r.message||"Unknown error")),n&&(n.textContent="Upload Logo")}}window.saveSlogan=Xt;window.toggleCorpDropdown=Zt;window.switchToFaction=te;let pt=!1;function oe(t,e,o,n){if(pt)return;const r=window._nationStats,i=1+(nt(r,"inflation")-50)/100*.3,l=Math.max(.1,n/100),a=Math.round(o*i*l),c=document.getElementById("prop-modal-overlay"),u=document.getElementById("prop-modal-content");u.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${v(e)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${_(o)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Inflation Modifier</span>
                <span style="color:var(--amber, #b09a5b);">${i.toFixed(3)}x</span>
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
    `,c.style.display="flex"}async function ae(t,e){if(pt)return;pt=!0;const o=document.getElementById("prop-sell-confirm");o&&(o.disabled=!0,o.textContent="Selling...");try{const n=window._corpFactionId;if(!n)throw new Error("No faction");const{error:r}=await p.from("corp_properties").update({is_active:!1}).eq("id",t).eq("faction_id",n);if(r)throw new Error("Failed to sell property: "+r.message);const{data:s}=await p.from("factions").select("corp_cash_reserves").eq("id",n).single(),i=Number(s?.corp_cash_reserves??0),{error:l}=await p.from("factions").update({corp_cash_reserves:i+e}).eq("id",n);l&&console.error("[Property] Failed to credit cash:",l.message),vt(),alert("Property sold for "+_(e)+". Cash credited."),location.reload()}catch(n){alert("Sale failed: "+n.message)}finally{pt=!1,o&&(o.disabled=!1,o.textContent="Confirm Sale")}}let ft=!1;function ne(t,e,o,n){if(ft)return;const r=window._nationStats,s=window._factionData,l=1+(nt(r,"inflation")-50)/100*.3,a=Math.round(2e6*(n/1e3)),c=Math.round(a*l),u=Math.max(50,Math.round(n*.1)),m=Number(s?.corp_general_workforce??0),k=m>=u,R=Number(s?.corp_cash_reserves??0)>=c,S=document.getElementById("prop-modal-overlay"),T=document.getElementById("prop-modal-content"),P=k&&R&&o<100;let L="";o>=100?L='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property is already at 100% condition.</div>':R?k||(L='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient general workforce (need '+u.toLocaleString()+", have "+m.toLocaleString()+").</div>"):L='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>',T.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${v(e)} — Current Condition: ${o}%</div>
        ${L}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost</span>
                <span style="color:${R?"var(--gold, #c8a832)":"var(--red)"};">${_(c)}</span>
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
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${t}', ${c}, ${u})" ${P?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,S.style.display="flex"}async function re(t,e,o){if(ft)return;ft=!0;const n=document.getElementById("prop-refurb-confirm");n&&(n.disabled=!0,n.textContent="Starting...");try{const r=window._corpFactionId,s=window._currentTick;if(!r)throw new Error("No faction");const i=Math.floor(Math.random()*6)+1,a=94+(Math.floor(Math.random()*6)+1),c=s+i,{data:u}=await p.from("factions").select("corp_cash_reserves").eq("id",r).single(),m=Number(u?.corp_cash_reserves??0);if(m<e)throw new Error("Insufficient cash");const{error:k}=await p.from("factions").update({corp_cash_reserves:m-e}).eq("id",r);if(k)throw new Error("Failed to deduct cost: "+k.message);const{error:M}=await p.from("corp_properties").update({refurbish_until_tick:c,refurbish_condition:a}).eq("id",t).eq("faction_id",r);if(M)throw new Error("Failed to start refurbishment: "+M.message);vt(),alert("Refurbishment started! Duration: "+i+" tick"+(i!==1?"s":"")+". Condition will be restored to "+Math.min(100,a)+"% when complete."),location.reload()}catch(r){alert("Refurbishment failed: "+r.message)}finally{ft=!1,n&&(n.disabled=!1,n.textContent="Begin Refurbishment")}}function vt(){const t=document.getElementById("prop-modal-overlay");t&&(t.style.display="none")}window.showSellModal=oe;window.confirmSellProperty=ae;window.showRefurbishModal=ne;window.confirmRefurbish=re;window.closePropModal=vt;window.showConvertModal=le;window.confirmConvertProperty=ce;let bt=!1;async function ie(t,e,o,n,r,s,i){if(!bt&&confirm("Accept bid from "+o+`?

Bid Price: `+_(n)+`
Quality: `+r+`/100
Workers: `+s+`

This will award the contract. The project begins immediately.`)){bt=!0;try{const{data:l}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),a=l?.current_tick||0,{error:c}=await p.from("contract_bids").update({status:"won"}).eq("id",e);if(c)throw c;const{error:u}=await p.from("contract_bids").update({status:"lost"}).eq("contract_id",t).neq("id",e);if(u)throw u;const{error:m}=await p.from("construction_contracts").update({status:"awarded",awarded_to_faction:i,awarded_at_tick:a}).eq("id",t);if(m)throw m;alert("Contract awarded to "+o+`!

Bid: `+_(n)+`
Project begins immediately.`),window._nationStats&&window._factionData&&O&&await $t(window._nationStats,window._nationStats?.name||"",window._factionData,O)}catch(l){alert("Failed to accept bid: "+(l.message||l))}finally{bt=!1}}}window.cpAcceptBid=ie;function se(t){const e=document.getElementById("cp-bid-"+t);e&&(e.style.display=e.style.display==="none"?"":"none")}window.cpToggleBid=se;let xt="branch_office";function le(t,e,o){const n=(f?.corp_subsector||"").toLowerCase(),r=n==="banking"?[["branch_office","Branch Office"]]:n==="investment"?[["trading_floor","Trading Floor"]]:n==="insurance"?[["claims_office","Claims Office"]]:[];if(r.length===0)return;xt=r[0][0];const s=Math.round(o*.15),i=Math.floor(Math.random()*6)+4,l=document.getElementById("prop-modal-overlay"),a=document.getElementById("prop-modal-content");a.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Convert Property</div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:10px;">${v(e)}</div>
        <div style="display:flex;gap:4px;margin-bottom:10px;">
            ${r.map(([c,u])=>`<span onclick="_convertTargetType='${c}';document.querySelectorAll('.conv-opt').forEach(e=>e.style.background='transparent');this.style.background='rgba(138,106,170,0.15)'" class="conv-opt" style="flex:1;text-align:center;padding:6px;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(138,106,170,0.3);color:#8a6aaa;${c===xt?"background:rgba(138,106,170,0.15)":""}">${u}</span>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Cost</span>
            <span style="color:var(--gold);">${_(s)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Time</span>
            <span style="color:var(--text-bright);">${i} ticks</span>
        </div>
        <div style="font-size:8px;color:var(--text-dim);margin:8px 0;font-family:var(--font-mono);line-height:1.5;">Property will be offline during conversion. No revenue or workforce allocation until complete.</div>
        <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button class="prop-action-btn prop-action-btn--sell" onclick="closePropModal()">Cancel</button>
            <button class="prop-action-btn" style="background:rgba(138,106,170,0.12);border-color:rgba(138,106,170,0.3);color:#8a6aaa;" onclick="confirmConvertProperty('${t}',${s},${i})">Convert</button>
        </div>
    `,l.style.display="flex"}async function ce(t,e,o){const n=Number(f?.corp_cash_reserves??0);if(n<e){alert("Insufficient cash. Need "+_(e)+".");return}const r=O?.current_tick||0;try{await p.from("factions").update({corp_cash_reserves:Math.max(0,n-e)}).eq("id",f.id),f.corp_cash_reserves=Math.max(0,n-e),await p.from("corp_properties").update({type:xt,refurbish_until_tick:r+o,condition:100}).eq("id",t),vt();const s=window._nationStats;await $t(s,s?.name||f?.nation,f,O)}catch(s){alert("Conversion failed: "+s.message)}}const Et={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},Mt={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},de={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let st="nation",lt="local",Q=null;function pe(t){return t?t.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase()):""}function kt(t,e){if(!t)return"<em>Unknown</em>";const o=v(t);return e?`<span style="color:${e.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${o}</span>`:`<strong>${o}</strong>`}function Tt(t,e,o){const n=t.factions?.nation_id===(t.nation_id||e),r=t.proposer_name||(n?t.factions?.faction_name:null)||"A former party",s=t.proposer_color||(n?t.factions?.party_color:null);return{fired_at_tick:t.proposed_tick,event_name:t.bill_name,_desc_html:`${kt(r,s)} proposed "${v(t.bill_name)}"`,category:"bill",_synthetic:!0,...o}}function Lt(t,e){const o=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:null,n=o?` led by <strong>${v(o)}</strong>`:"";return{fired_at_tick:0,event_name:t.faction_name,_desc_html:`${kt(t.faction_name,t.party_color)} founded${n}`,category:"new_party",_synthetic:!0,_created_at:t.created_at,...e}}function It(t,e){const o=de[t.tier]||`Tier ${t.tier}`,n=t.demand_label?` demanding "${v(t.demand_label)}"`:"",r=t.status==="crisis_active",s=t.tier>=6?"#e74c3c":t.tier>=4?"#f39c12":"",i=s?`<span style="color:${s};font-weight:600">${v(o)}</span>`:`<strong>${v(o)}</strong>`;return{fired_at_tick:t.tick_resolved||t.tick_called,event_name:o,_desc_html:`${kt(t.factions?.faction_name,t.factions?.party_color)} organised a protest${n} — ${i}${r?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...e}}function St(t,e,o,n,r){return[...t.map(s=>({...s,_synthetic:!1})),...e,...o,...n].sort((s,i)=>{const l=(i.fired_at_tick||0)-(s.fired_at_tick||0);if(l!==0)return l;const a=s._created_at||s.created_at||"",c=i._created_at||i.created_at||"";return c>a?1:c<a?-1:0}).slice(0,r)}function Nt(t){if(t._synthetic&&t._desc_html)return t._desc_html;const e=t.description_chosen||t.description_used||"",o=pe(t.event_name),n=o?`<strong>${v(o)}</strong>`:"",r=e?v(e):"";return n&&r?`${n} — ${r}`:r||n||"Event"}function Rt(t){return t.map(e=>{const o=ht(e.fired_at_tick),n=Et[(e.category||"").toLowerCase()]||Mt;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${v(o)}</span>
            <span class="corp-ev-icon" style="color:${n.color}">${n.icon}</span>
            <span class="corp-ev-text">${Nt(e)}</span>
            ${n.label?`<span class="corp-ev-cat" style="color:${n.color};background:${n.bg}">${n.label}</span>`:""}
        </div>`}).join("")}const Ct=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function fe(t){let e=0;for(let o=0;o<t.length;o++)e=(e<<5)-e+t.charCodeAt(o)|0;return Ct[Math.abs(e)%Ct.length]}function qt(t){return t.map(e=>{const o=ht(e.fired_at_tick),n=Et[(e.category||"").toLowerCase()]||Mt,r=e.nations?.name||"Unknown",s=e.nations?.nation_profiles,i=Array.isArray(s)?s[0]?.flag_url:s?.flag_url,l=fe(r),a=i?`<img src="${v(i)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${v(o)}</span>
                <span class="corp-ev-nation-badge" style="color:${l.color};background:${l.bg};border-color:${l.border};">${a}${v(r)}</span>
            </span>
            <span class="corp-ev-text">${Nt(e)}</span>
            ${n.label?`<span class="corp-ev-cat" style="color:${n.color};background:${n.bg}">${n.label}</span>`:""}
        </div>`}).join("")}async function ve(){const t=document.getElementById("corp-events-list");if(!t||!Q)return;const{nationId:e}=Q;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[o,n]=await Promise.all([p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").eq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),p.from("event_log").select("*").eq("nation_id",e).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),r=o.data||[],s=n.data||[],i=r.map(a=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${a.faction_name} [${a.corp_ticker||a.abbreviation||"??"}] was founded with a specialty in ${a.corp_subsector||a.corp_sector||"General"}. Led by CEO ${[a.leader_first_name,a.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:a.founded_tick||0})),l=[...s,...i].sort((a,c)=>(c.fired_at_tick||0)-(a.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events in this nation yet.</div>';return}t.innerHTML=Rt(l)}catch(o){console.error("Corp local events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function _e(){const t=document.getElementById("corp-events-list");if(!t||!Q)return;const{nationId:e}=Q;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[o,n]=await Promise.all([p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),p.from("event_log").select("*, nations(name, nation_profiles(flag_url))").neq("nation_id",e).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),r=o.data||[],s=n.data||[],i=r.map(a=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${a.faction_name} [${a.corp_ticker||a.abbreviation||"??"}] was founded in ${a.nation||"Unknown"} with a specialty in ${a.corp_subsector||a.corp_sector||"General"}. Led by CEO ${[a.leader_first_name,a.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:a.founded_tick||0,nations:{name:a.nation||"Unknown"}})),l=[...s,...i].sort((a,c)=>(c.fired_at_tick||0)-(a.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=qt(l);return}catch(o){console.error("Corp world events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>';return}try{const{data:o,error:n}=await p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(n)throw n;if(!o||o.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=me(o,!0)}catch(o){console.error("Corp world events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function me(t,e){return t.map(o=>{const n=[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown",r=o.nation||"Unknown",s=o.corp_subsector||o.corp_sector||"General",i=o.corp_ticker||o.abbreviation||"",l=o.founded_tick?ht(o.founded_tick):"";let a='<div class="corp-event-row">';return a+='<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--teal);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);padding:1px 5px;display:inline-block;margin-bottom:2px;">'+v(r.toUpperCase())+"</div>",a+='<div style="font-size:11px;color:var(--text-primary);line-height:1.5;">',a+='<span style="font-weight:600;">'+v(o.faction_name)+"</span>",i&&(a+=' <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">['+v(i)+"]</span>"),a+=' was founded in <span style="font-weight:500;">'+v(r)+"</span>",a+=' with a specialty in <span style="color:var(--teal);font-weight:500;">'+v(s)+"</span>.",a+=' Led by CEO <span style="font-weight:500;">'+v(n)+"</span>.",a+="</div>",l&&(a+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">'+v(l)+"</div>"),a+="</div>",a}).join("")}async function zt(){const t=document.getElementById("corp-events-list");if(!t||!Q)return;const{nationId:e}=Q;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[o,n,r,s]=await Promise.all([p.from("event_log").select("*").eq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(50),p.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",e).order("created_at",{ascending:!1}).limit(20),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(o.error)throw o.error;const i=o.data||[],l=St(i,(n.data||[]).map(a=>Tt(a,e)),(r.data||[]).map(a=>Lt(a)),(s.data||[]).map(a=>It(a)),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>';return}t.innerHTML=Rt(l)}catch(o){console.error("Nation events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function ue(){const t=document.getElementById("corp-events-list");if(!t||!Q)return;const{nationId:e}=Q;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[o,n,r,s]=await Promise.all([p.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(60),p.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("created_at",{ascending:!1}).limit(15),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(o.error)throw o.error;const i=o.data||[],l=St(i,(n.data||[]).map(a=>Tt(a,null,{nations:a.nations})),(r.data||[]).map(a=>Lt(a,{nations:a.nations})),(s.data||[]).map(a=>It(a,{nations:a.nations})),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>';return}t.innerHTML=qt(l)}catch(o){console.error("World events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}window.switchCorpEventsCat=function(t){t!==st&&(st=t,document.querySelectorAll("#corp-events-cat-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.cat===t)),Pt())};window.switchCorpEventsScope=function(t){t!==lt&&(lt=t,document.querySelectorAll("#corp-events-scope-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.scope===t)),Pt())};function Pt(){st==="nation"&&lt==="local"?zt():st==="nation"&&lt==="world"?ue():st==="corporate"&&lt==="local"?ve():_e()}Ht();
