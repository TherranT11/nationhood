import{_ as p}from"./supabase-client-BXEzLDpS.js";import{e as v,t as te}from"./utils-C2W-HleY.js";import{initMessaging as fe}from"./messaging-B5Fng3EZ.js";import{c as me}from"./equipment-DsuDdEne.js";let B=[];function f(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+Math.round(e).toLocaleString()}function q(e,t){return Number(e?.[t]??50)}async function ue(){const{data:{user:e}}=await p.auth.getUser();if(!e){window.location.href="login.html";return}const{data:t}=await p.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);B=(t||[]).filter(m=>m.nation_id&&!m.abandoned_at);const o=sessionStorage.getItem("active_faction_id");let a=B.find(m=>m.id===o)||B.find(m=>m.faction_type==="corporation")||B[0];if(!a){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",a.id),a.faction_type!=="corporation"){window.location.href="dashboard.html";return}let s=a.nation||"",r=null;const[c,i]=await Promise.all([a.nation_id?p.from("nations").select("*").eq("id",a.nation_id).single():Promise.resolve({data:null}),p.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);c.error&&console.warn("Nation load failed:",c.error.message),c.data&&(s=c.data.name,r=c.data),i.error&&console.warn("Shard load failed:",i.error.message);const n=i.data,d=a.corp_ticker||a.abbreviation||"";if(document.getElementById("corp-logo").textContent=d.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=a.faction_name||"Unnamed Corp",n){if(document.getElementById("game-date").textContent=n.current_date||"—",document.getElementById("tick-number").textContent=n.current_tick||"—",n.next_tick_at){const $=(Number(n.tick_interval_hours)||8)*36e5,M=new Date(n.next_tick_at).getTime(),P=M-$+$/2;V=new Date(P>Date.now()?P:M+$/2),xe()}const m=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");m&&(m.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(d?"["+d+"]":a.faction_name||"Corp")+" ▾";const _=document.getElementById("topbar-cash");if(_){const m=Number(a.corp_cash_reserves??0),$=m>=1e9?"$"+(m/1e9).toFixed(1)+"B":m>=1e6?"$"+(m/1e6).toFixed(1)+"M":"$"+Math.round(m/1e3)+"k";_.textContent="CASH: "+$}const g=a.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+g+" AP</span>";const b=document.getElementById("corp-faction-dropdown");if(b){let m="";for(const T of B){const P=T.id===a.id,F=T.faction_type==="corporation"?"CORP":"PARTY",D=T.faction_type==="corporation"?"var(--teal)":"var(--amber)";m+=`<div class="corp-dd-item${P?" active":""}" onclick="switchToFaction('${T.id}', '${T.faction_type}')">
                <span class="corp-dd-type" style="color:${D}">${F}</span>
                <span class="corp-dd-name">${v(T.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${v(T.abbreviation||"—")}]</span>
            </div>`}B.some(T=>T.faction_type==="corporation")||(m+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),B.some(T=>T.faction_type==="party")||(m+=`<div class="corp-dd-item corp-dd-item--create" onclick="sessionStorage.setItem('pending_faction_type','party'); window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),b.innerHTML=m}document.getElementById("id-type-badge").textContent=a.corp_company_type||"—",document.getElementById("id-logo").textContent=d.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=a.faction_name||"Unnamed Corp";const u=a.party_description||"";document.getElementById("id-slogan").textContent=u?'"'+u+'"':'"--"';const x=n?.current_date?n.current_date.replace(/.*,\s*/,""):"—",R=a.leader_first_name&&a.leader_last_name?a.leader_first_name+" "+a.leader_last_name+(a.leader_age?" ("+a.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${v(x)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${v(s||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${v(a.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${v(a.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${v(R)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${v(a.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${v(d)}</span>
        </div>
    `;const y=a.last_rename_tick||0,S=n?.current_tick||0,C=Math.max(0,y+120-S),l=!u||u==="-"||u==='"-"'||C<=0,L=document.getElementById("slogan-editor");L.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${v(u)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${l?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${l?"60 characters max. 120 tick cooldown after change.":C+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=a.id,window._currentTick=S,window._nationStats=r,window._factionData=a;const N=ge(r,s,a);ye(s,a);const w=await he(r,s,a,n);let I=0;if(a?.id){const{data:m,error:$}=await p.from("corp_equipment").select("equipment_key, owned").eq("faction_id",a.id);$||(I=me(m||[]))}be(r,n,N,a,w.propertyMaintenance||0,I),we(r,s,a,N,w),fe(a,r,n),A={nationId:a.nation_id},re(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function ge(e,t,o){const a=M=>q(e,M),s=(t||"UNKNOWN").toUpperCase(),r=Number(o?.corp_general_workforce??2250),c=Number(o?.corp_skilled_workforce??600),i=Number(o?.corp_innovative_workforce??150),n=r+c+i,d=2,_=3,g=6,b=a("minimum_wage"),u=b/100*48e3,x=a("inflation"),R=a("standard_of_living"),y=1+(x-50)/100*.5,S=1+(R-50)/100*.5,h=M=>Math.round(u*M*y*S),C=h(d),E=h(_),l=h(g),L=r*C,N=c*E,w=i*l,I=L+N+w;function m(M){return"$"+Math.round(M).toLocaleString()+"/yr"}const $=`${y.toFixed(2)} &times; ${S.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=n.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${v(s)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${d}.0 &times; ${$})</span>
                <span class="wf-tier__value">${m(C)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${f(L)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${v(s)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${c.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${_}.0 &times; ${$})</span>
                <span class="wf-tier__value">${m(E)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${f(N)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${v(s)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${i.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${g}.0 &times; ${$})</span>
                <span class="wf-tier__value">${m(l)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${f(w)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${v(s)})</span>
                <span class="wf-tier__value">${b}/100 → ${m(u)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${y.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${S.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${n.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${f(I)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${f(I/12)}</span>
            </div>
        </div>
    `,{totalWages:I,generalTotal:L,skilledTotal:N,innovativeTotal:w,monthlyWages:Math.round(I/12)}}function be(e,t,o,a,s,r){const c=t?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+c;const i=5e7,n=k=>q(e,k),d=1+(n("gdp_growth")-50)/100*.4,_=1+(n("urbanization")-50)/100*.3,g=1+(n("population_growth")-50)/100*.2,b=1+(n("standard_of_living")-50)/100*.15,u=1+(50-n("physical_infrastructure"))/100*.1,x=1-Math.max(0,n("inflation")-50)/100*.1,R=1-Math.max(0,n("interest_rates")-50)/100*.1,y=d*_*g*b*u*x*R,S=Math.round(i*y),h=Math.round(S/12),C=0,E=0,l=C+E+h,L=o?.totalWages||0,N=Math.round(L/12),w=0,I=0,m=s||0,$=r||0,M=Number(a?.corp_loans)||0,T=.05,P=M>0?Math.round(M*(T/12)/(1-Math.pow(1+T/12,-120))):0,F=N+w+m+$+P+I,D=l-F,ie=Number(a?.corp_cash_reserves??0),le=M,ce=[{stat:"gdp_growth",value:n("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:n("urbanization"),weight:"0.3"},{stat:"population_growth",value:n("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:n("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:n("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:n("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:n("interest_rates"),weight:"-0.1",neg:!0}];function de(k){return k.neg?k.value>50?"var(--red)":"var(--green)":k.note?k.value<50?"var(--green)":"var(--red)":k.value>=50?"var(--green)":k.value>=35?"var(--amber)":"var(--red)"}const H=l||1,pe=(C/H*100).toFixed(1),ve=(E/H*100).toFixed(1),_e=(h/H*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${pe}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${ve}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${_e}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${f(C)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${f(E)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${f(h)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${f(l)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${f(N)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${f(w)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${f(m)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${f($)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${f(P)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${f(I)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${f(F)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${D>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${D>=0?"var(--green)":"var(--red)"}">${f(D)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${f(ie)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${f(le)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${ce.map(k=>`
                <div class="drv-row">
                    <span class="drv-row__name">${k.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${k.value}%;background:${de(k)}"></div></div>
                    <span class="drv-row__val">${k.value}</span>
                    <span class="drv-row__wt">&times;${k.weight}</span>
                    ${k.note?'<span class="drv-row__note">'+k.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${y.toFixed(2)}</span>
            </div>
        </div>
    `}function ye(e,t){const o=(e||"").toUpperCase(),a=Number(t.corp_general_workforce??0)+Number(t.corp_skilled_workforce??0)+Number(t.corp_innovative_workforce??0),s=[{label:"Reputation",value:Number(t.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:a||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(t.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(t.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(t.corp_market_share??5),change:0,nation:o,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(t.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(t.corp_regulatory_standing??50),change:0,nation:o,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(t.corp_political_influence??10),change:0,decay:!0,nation:o,max:100},{label:"Innovation",value:Number(t.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function r(n,d){if(!d||d>100)return"var(--text-primary)";const _=n/d*100;return _>=70?"var(--green)":_>=40?"var(--amber)":_>=20?"var(--orange, #d48a3c)":"var(--red)"}function c(n){const d=parseFloat(n),_=d>0?"var(--green)":d<0?"var(--red)":"var(--text-dim)",g=d>0?"▲":d<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${_}">${g}</span>
            <span class="stat-item__delta" style="color:${_}">${Math.abs(d).toFixed(1)}</span>
        </div>`}let i="";for(const n of s){if(n.isHero){i+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${n.label}</span>
                            ${n.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${n.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${c(n.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${n.value}%"></div></div>
                </div>`;continue}n.section&&(i+=`<div class="stats-section"><span class="stats-section__label">${n.section}</span></div>`);const d=n.max&&n.max<=100;i+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${n.label}</span>
                        ${n.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${n.nation?'<span class="stat-item__nation">'+v(n.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${d?r(n.value,n.max):"var(--text-primary)"}">${typeof n.value=="number"?n.value.toLocaleString():n.value}</span>
                    ${d?'<span class="stat-item__max">/100</span>':""}
                    ${c(n.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=i}async function he(e,t,o,a){const s=(t||"UNKNOWN").toUpperCase();let r=[];if(o?.id){const{data:l}=await p.from("corp_properties").select("*").eq("faction_id",o.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});r=l||[]}const c={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let i=0,n=0;const d=Number(o?.corp_general_workforce??0)+Number(o?.corp_skilled_workforce??0)+Number(o?.corp_innovative_workforce??0),_=500,g=_+r.reduce((l,L)=>l+Number(L.capacity||0),0),b=g>0?Math.round(d*(_/g)):d,u=5e7,x=1+(q(e,"inflation")-50)/100*.3,R=.8+q(e,"stability")/100*.4,y=Math.round(u*x*R),S=Math.round(y*.005);i+=y,n+=S;let h=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${v(s)} · Headquarters</div>
            </div>
            <span class="prop-asset__badge">HQ</span>
        </div>
        <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${_}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${b.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${f(y)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${f(S)}</div>
            </div>
        </div>
    </div>`,C=b;for(const l of r){const L=c[l.style]||c.Basic;i+=Number(l.purchase_price||0),n+=Number(l.monthly_maintenance||0);const N=l.condition>=75?"var(--green)":l.condition>=50?"var(--amber)":"var(--orange)",w=Number(l.capacity||0),I=g>0?Math.min(d-C,Math.round(d*(w/g))):0;C+=I,h+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${v(l.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${v(l.city||s)} · ${(l.type||"").replace(/_/g," ")} · <span style="color:${L.color}">${(l.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge">OWNED</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${w.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${I.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${f(l.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${f(l.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${N}">${l.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${l.condition}%;height:100%;background:${N};"></div></div>
            ${l.refurbish_until_tick&&l.refurbish_until_tick>(a?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${l.refurbish_until_tick-(a?.current_tick||0)} tick${l.refurbish_until_tick-(a?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${l.id}','${v(l.name).replace(/'/g,"\\'")}',${l.purchase_price||0},${l.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${l.id}','${v(l.name).replace(/'/g,"\\'")}',${l.condition},${w})">REFURBISH</button>
            </div>`}
        </div>`}const E=document.getElementById("prop-count");return E&&(E.textContent=r.length+1+" ASSET"+(r.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${h}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${f(i)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${f(n)}/mo</span>
            </div>
        </div>
    `,{propertyValue:i,propertyMaintenance:n}}function we(e,t,o,a,s){(t||"UNKNOWN").toUpperCase();const r=o.corp_company_type||"Private",c=Number(o.corp_cash_reserves)||0,i=s?.propertyValue||0,n=0,d=0,_=c+i+n+d,g=Number(o.corp_loans)||0,u=a?.monthlyWages||0,x=0,R=g+u+x,y=_-R,h=Math.round(y*(1+.3)),C=h-y,E=C>0;document.getElementById("val-type-badge").textContent=r.toUpperCase();function l(L,N,w={}){const I=w.indent?"val-line val-line--indent":"val-line",m=w.bold?"val-line__label val-line__label--bold":"val-line__label",$=w.bold?"val-line__value val-line__value--bold":"val-line__value",M=w.color||(w.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${I}"><span class="${m}">${L}</span><span class="${$}" style="color:${M}">${f(N)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${l("Cash & Reserves",c,{indent:!0})}
        ${l("Property",i,{indent:!0})}
        ${l("Equipment",n,{indent:!0})}
        ${l("Active Contracts",d,{indent:!0})}
        ${l("Total Assets",_,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${l("Outstanding Loans",g,{indent:!0})}
        ${l("Accounts Payable",u,{indent:!0})}
        ${l("Pending Project Costs",x,{indent:!0})}
        ${l("Total Liabilities",R,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${y>=0?"var(--green)":"var(--red)"};">${f(y)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${f(h)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${E?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${E?"var(--green)":"var(--red)"};">${E?"+":""}${f(C)}</span>
            </div>
            <div class="val-market__note">${E?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let V=null,O=null;function xe(){O&&clearInterval(O),O=setInterval(Z,1e3),Z()}function Z(){const e=document.getElementById("tick-countdown");if(!e||!V){e&&(e.textContent="—");return}const t=V-Date.now();if(t<=0){e.textContent="Tick due...",clearInterval(O);return}const o=Math.floor(t/36e5),a=Math.floor(t%36e5/6e4),s=Math.floor(t%6e4/1e3);e.textContent=o+"h "+a+"m "+s+"s"}function $e(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}async function ke(){const e=document.getElementById("slogan-input"),t=document.getElementById("slogan-hint"),o=document.getElementById("slogan-save-btn"),a=(e.value||"").trim().slice(0,60);if(a.length===0){t.textContent="Slogan cannot be empty.",t.className="slogan-hint slogan-hint--error";return}o.disabled=!0,o.textContent="...",t.textContent="";try{const{error:s}=await p.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(s)throw s;document.getElementById("id-slogan").textContent='"'+a+'"',t.textContent="Slogan saved! Next change in 120 ticks.",t.className="slogan-hint slogan-hint--ok",o.textContent="Save"}catch(s){console.error("Slogan save failed:",s),t.textContent="Failed to save slogan.",t.className="slogan-hint slogan-hint--error",o.disabled=!1,o.textContent="Save"}}async function Ce(){await p.auth.signOut(),window.location.href="login.html"}function Ee(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function Ie(e,t){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),t==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const t=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&t&&!t.contains(e.target)&&o.classList.remove("open")});window.doLogout=Ce;window.toggleTheme=$e;window.saveSlogan=ke;window.toggleCorpDropdown=Ee;window.switchToFaction=Ie;let U=!1;async function Me(){if(U){console.warn("Dissolve already in progress");return}const{data:{user:e}}=await p.auth.getUser();if(!e){alert("Not logged in.");return}const t=sessionStorage.getItem("active_faction_id");if(!t){alert("No active faction selected.");return}const{data:o,error:a}=await p.from("factions").select("*").eq("id",t).eq("faction_type","corporation").is("abandoned_at",null).single();if(a||!o){alert("No active corporation found. It may have already been dissolved."),console.error("Dissolve lookup failed:",a?.message,"factionId:",t);return}const r=o.faction_name||"this corporation";if(!confirm("DISSOLVE "+r.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all properties, equipment, and inventory
• Remove all cash reserves
• Outstanding debts and active projects will remain

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+r+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}U=!0;const i=document.getElementById("dissolve-btn");i&&(i.disabled=!0,i.textContent="DISSOLVING...",i.style.opacity="0.5");try{async function n(u){const{error:x}=await u;if(x)throw x}await n(p.from("contract_bids").delete().eq("faction_id",t)),await n(p.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",t).in("status",["open","bidding"])),await n(p.from("corp_equipment_deliveries").delete().eq("faction_id",t)),await n(p.from("corp_equipment").delete().eq("faction_id",t)),await n(p.from("corp_properties").delete().eq("faction_id",t)),await p.from("corp_material_inventory").delete().eq("faction_id",t),await p.from("corp_warehouse").delete().eq("faction_id",t),await n(p.from("factions").update({abandoned_at:new Date().toISOString(),corp_cash_reserves:0,corp_general_workforce:0,corp_skilled_workforce:0,corp_innovative_workforce:0,action_points:0}).eq("id",t)),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:d,error:_}=await p.from("factions").select("id, faction_type").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`).is("abandoned_at",null);_&&console.warn("Failed to check remaining factions:",_.message);const g=(d||[]).find(u=>u.faction_type==="party"),b=(d||[]).find(u=>u.faction_type==="corporation");g?(sessionStorage.setItem("active_faction_id",g.id),alert(r+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):b?(sessionStorage.setItem("active_faction_id",b.id),alert(r+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(r+` has been dissolved.

You have no remaining factions.`),window.location.href="faction-select.html")}catch(n){alert("Dissolution failed: "+(n.message||n)+`

Please try again or contact support.`),i&&(i.disabled=!1,i.textContent="Dissolve Corporation",i.style.opacity="1")}finally{U=!1}}window.dissolveCorporation=Me;let W=!1;function Te(e,t,o,a){if(W)return;const s=window._nationStats,c=1+(q(s,"inflation")-50)/100*.3,i=Math.max(.1,a/100),n=Math.round(o*c*i),d=document.getElementById("prop-modal-overlay"),_=document.getElementById("prop-modal-content");_.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${v(t)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${f(o)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Inflation Modifier</span>
                <span style="color:var(--amber, #b09a5b);">${c.toFixed(3)}x</span>
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
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-sell-confirm" onclick="confirmSellProperty('${e}', ${n})">Confirm Sale</button>
        </div>
    `,d.style.display="flex"}async function Se(e,t){if(W)return;W=!0;const o=document.getElementById("prop-sell-confirm");o&&(o.disabled=!0,o.textContent="Selling...");try{const a=window._corpFactionId;if(!a)throw new Error("No faction");const{error:s}=await p.from("corp_properties").update({is_active:!1}).eq("id",e).eq("faction_id",a);if(s)throw new Error("Failed to sell property: "+s.message);const{data:r}=await p.from("factions").select("corp_cash_reserves").eq("id",a).single(),c=Number(r?.corp_cash_reserves??0),{error:i}=await p.from("factions").update({corp_cash_reserves:c+t}).eq("id",a);i&&console.error("[Property] Failed to credit cash:",i.message),j(),alert("Property sold for "+f(t)+". Cash credited."),location.reload()}catch(a){alert("Sale failed: "+a.message)}finally{W=!1,o&&(o.disabled=!1,o.textContent="Confirm Sale")}}let z=!1;function Ne(e,t,o,a){if(z)return;const s=window._nationStats,r=window._factionData,i=1+(q(s,"inflation")-50)/100*.3,n=Math.round(2e6*(a/1e3)),d=Math.round(n*i),_=Math.max(50,Math.round(a*.1)),g=Number(r?.corp_general_workforce??0),b=g>=_,x=Number(r?.corp_cash_reserves??0)>=d,R=document.getElementById("prop-modal-overlay"),y=document.getElementById("prop-modal-content"),S=b&&x&&o<100;let h="";o>=100?h='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property is already at 100% condition.</div>':x?b||(h='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient general workforce (need '+_.toLocaleString()+", have "+g.toLocaleString()+").</div>"):h='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>',y.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${v(t)} — Current Condition: ${o}%</div>
        ${h}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost</span>
                <span style="color:${x?"var(--gold, #c8a832)":"var(--red)"};">${f(d)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Workforce Required</span>
                <span style="color:${b?"var(--blue)":"var(--red)"};">${_.toLocaleString()} General</span>
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
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${e}', ${d}, ${_})" ${S?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,R.style.display="flex"}async function Le(e,t,o){if(z)return;z=!0;const a=document.getElementById("prop-refurb-confirm");a&&(a.disabled=!0,a.textContent="Starting...");try{const s=window._corpFactionId,r=window._currentTick;if(!s)throw new Error("No faction");const c=Math.floor(Math.random()*6)+1,n=94+(Math.floor(Math.random()*6)+1),d=r+c,{data:_}=await p.from("factions").select("corp_cash_reserves").eq("id",s).single(),g=Number(_?.corp_cash_reserves??0);if(g<t)throw new Error("Insufficient cash");const{error:b}=await p.from("factions").update({corp_cash_reserves:g-t}).eq("id",s);if(b)throw new Error("Failed to deduct cost: "+b.message);const{error:u}=await p.from("corp_properties").update({refurbish_until_tick:d,refurbish_condition:n}).eq("id",e).eq("faction_id",s);if(u)throw new Error("Failed to start refurbishment: "+u.message);j(),alert("Refurbishment started! Duration: "+c+" tick"+(c!==1?"s":"")+". Condition will be restored to "+Math.min(100,n)+"% when complete."),location.reload()}catch(s){alert("Refurbishment failed: "+s.message)}finally{z=!1,a&&(a.disabled=!1,a.textContent="Begin Refurbishment")}}function j(){const e=document.getElementById("prop-modal-overlay");e&&(e.style.display="none")}window.showSellModal=Te;window.confirmSellProperty=Se;window.showRefurbishModal=Ne;window.confirmRefurbish=Le;window.closePropModal=j;const ae={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},ne={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},Re={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let J="corporate",A=null;function Pe(e){return e?e.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase()):""}function G(e,t){if(!e)return"<em>Unknown</em>";const o=v(e);return t?`<span style="color:${t.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${o}</span>`:`<strong>${o}</strong>`}function Y(e,t,o){const a=e.factions?.nation_id===(e.nation_id||t),s=e.proposer_name||(a?e.factions?.faction_name:null)||"A former party",r=e.proposer_color||(a?e.factions?.party_color:null);return{fired_at_tick:e.proposed_tick,event_name:e.bill_name,_desc_html:`${G(s,r)} proposed "${v(e.bill_name)}"`,category:"bill",_synthetic:!0,...o}}function K(e,t){const o=e.leader_first_name&&e.leader_last_name?`${e.leader_first_name} ${e.leader_last_name}`:null,a=o?` led by <strong>${v(o)}</strong>`:"";return{fired_at_tick:0,event_name:e.faction_name,_desc_html:`${G(e.faction_name,e.party_color)} founded${a}`,category:"new_party",_synthetic:!0,_created_at:e.created_at,...t}}function Q(e,t){const o=Re[e.tier]||`Tier ${e.tier}`,a=e.demand_label?` demanding "${v(e.demand_label)}"`:"",s=e.status==="crisis_active",r=e.tier>=6?"#e74c3c":e.tier>=4?"#f39c12":"",c=r?`<span style="color:${r};font-weight:600">${v(o)}</span>`:`<strong>${v(o)}</strong>`;return{fired_at_tick:e.tick_resolved||e.tick_called,event_name:o,_desc_html:`${G(e.factions?.faction_name,e.factions?.party_color)} organised a protest${a} — ${c}${s?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...t}}function X(e,t,o,a,s){return[...e.map(r=>({...r,_synthetic:!1})),...t,...o,...a].sort((r,c)=>{const i=(c.fired_at_tick||0)-(r.fired_at_tick||0);if(i!==0)return i;const n=r._created_at||r.created_at||"",d=c._created_at||c.created_at||"";return d>n?1:d<n?-1:0}).slice(0,s)}function oe(e){if(e._synthetic&&e._desc_html)return e._desc_html;const t=e.description_chosen||e.description_used||"",o=Pe(e.event_name),a=o?`<strong>${v(o)}</strong>`:"",s=t?v(t):"";return a&&s?`${a} — ${s}`:s||a||"Event"}function se(e){return e.map(t=>{const o=te(t.fired_at_tick),a=ae[(t.category||"").toLowerCase()]||ne;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${v(o)}</span>
            <span class="corp-ev-icon" style="color:${a.color}">${a.icon}</span>
            <span class="corp-ev-text">${oe(t)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}const ee=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function Be(e){let t=0;for(let o=0;o<e.length;o++)t=(t<<5)-t+e.charCodeAt(o)|0;return ee[Math.abs(t)%ee.length]}function Ae(e){return e.map(t=>{const o=te(t.fired_at_tick),a=ae[(t.category||"").toLowerCase()]||ne,s=t.nations?.name||"Unknown",r=t.nations?.nation_profiles,c=Array.isArray(r)?r[0]?.flag_url:r?.flag_url,i=Be(s),n=c?`<img src="${v(c)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${v(o)}</span>
                <span class="corp-ev-nation-badge" style="color:${i.color};background:${i.bg};border-color:${i.border};">${n}${v(s)}</span>
            </span>
            <span class="corp-ev-text">${oe(t)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}async function re(){const e=document.getElementById("corp-events-list");e&&(e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events yet.<br>Events will appear here as your company grows.</div>')}async function qe(){const e=document.getElementById("corp-events-list");if(!e||!A)return;const{nationId:t}=A;if(!t){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[o,a,s,r]=await Promise.all([p.from("event_log").select("*").eq("nation_id",t).in("category",["political","bill","new_party","protest"]).order("fired_at_tick",{ascending:!1}).limit(40),p.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",t).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",t).order("created_at",{ascending:!1}).limit(15),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",t).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(o.error)throw o.error;const c=o.data||[],i=X(c,(a.data||[]).map(n=>Y(n,t)),(s.data||[]).map(n=>K(n)),(r.data||[]).map(n=>Q(n)),50);if(i.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No political events recorded yet.</div>';return}e.innerHTML=se(i)}catch(o){console.error("Political events error:",o),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function De(){const e=document.getElementById("corp-events-list");if(!e||!A)return;const{nationId:t}=A;if(!t){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[o,a,s,r]=await Promise.all([p.from("event_log").select("*").eq("nation_id",t).order("fired_at_tick",{ascending:!1}).limit(50),p.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",t).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",t).order("created_at",{ascending:!1}).limit(20),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",t).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(o.error)throw o.error;const c=o.data||[],i=X(c,(a.data||[]).map(n=>Y(n,t)),(s.data||[]).map(n=>K(n)),(r.data||[]).map(n=>Q(n)),60);if(i.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>';return}e.innerHTML=se(i)}catch(o){console.error("Nation events error:",o),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function Fe(){const e=document.getElementById("corp-events-list");if(!e||!A)return;const{nationId:t}=A;if(!t){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[o,a,s,r]=await Promise.all([p.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",t).order("fired_at_tick",{ascending:!1}).limit(60),p.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",t).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",t).order("created_at",{ascending:!1}).limit(15),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",t).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(o.error)throw o.error;const c=o.data||[],i=X(c,(a.data||[]).map(n=>Y(n,null,{nations:n.nations})),(s.data||[]).map(n=>K(n,{nations:n.nations})),(r.data||[]).map(n=>Q(n,{nations:n.nations})),60);if(i.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>';return}e.innerHTML=Ae(i)}catch(o){console.error("World events error:",o),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function Oe(e){e!==J&&(J=e,document.querySelectorAll(".corp-events-tab").forEach(t=>{t.classList.toggle("active",t.dataset.tab===e)}),e==="corporate"?re():e==="political"?qe():e==="nation"?De():e==="world"&&Fe())}window.switchCorpEventsTab=Oe;ue();
