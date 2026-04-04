import{_ as u}from"./supabase-client-BXEzLDpS.js";import{e as w}from"./utils-C2W-HleY.js";import{initMessaging as J}from"./messaging-B5Fng3EZ.js";import{c as X}from"./equipment-DsuDdEne.js";let B=[];function c(n){return Math.abs(n)>=1e6?"$"+(n/1e6).toFixed(2)+"M":Math.abs(n)>=1e3?"$"+(n/1e3).toFixed(1)+"k":"$"+Math.round(n).toLocaleString()}function P(n,a){return Number(n?.[a]??50)}async function Z(){const{data:{user:n}}=await u.auth.getUser();if(!n){window.location.href="login.html";return}const{data:a}=await u.from("factions").select("*").or(`id.eq.${n.id},linked_user_id.eq.${n.id}`);B=(a||[]).filter(o=>o.nation_id&&!o.abandoned_at);const s=sessionStorage.getItem("active_faction_id");let e=B.find(o=>o.id===s)||B.find(o=>o.faction_type==="corporation")||B[0];if(!e){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",e.id),e.faction_type!=="corporation"){window.location.href="dashboard.html";return}let d=e.nation||"",p=null;const[m,i]=await Promise.all([e.nation_id?u.from("nations").select("*").eq("id",e.nation_id).single():Promise.resolve({data:null}),u.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);m.error&&console.warn("Nation load failed:",m.error.message),m.data&&(d=m.data.name,p=m.data),i.error&&console.warn("Shard load failed:",i.error.message);const t=i.data,r=e.corp_ticker||e.abbreviation||"";if(document.getElementById("corp-logo").textContent=r.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=e.faction_name||"Unnamed Corp",t){if(document.getElementById("game-date").textContent=t.current_date||"—",document.getElementById("tick-number").textContent=t.current_tick||"—",t.next_tick_at){const y=(Number(t.tick_interval_hours)||8)*36e5,S=new Date(t.next_tick_at).getTime(),A=S-y+y/2;U=new Date(A>Date.now()?A:S+y/2),ot()}const o=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");o&&(o.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(r?"["+r+"]":e.faction_name||"Corp")+" ▾";const _=document.getElementById("topbar-cash");if(_){const o=Number(e.corp_cash_reserves??0),y=o>=1e9?"$"+(o/1e9).toFixed(1)+"B":o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k";_.textContent="CASH: "+y}const b=e.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+b+" AP</span>";const x=document.getElementById("corp-faction-dropdown");if(x){let o="";for(const v of B){const A=v.id===e.id,q=v.faction_type==="corporation"?"CORP":"PARTY",W=v.faction_type==="corporation"?"var(--teal)":"var(--amber)";o+=`<div class="corp-dd-item${A?" active":""}" onclick="switchToFaction('${v.id}', '${v.faction_type}')">
                <span class="corp-dd-type" style="color:${W}">${q}</span>
                <span class="corp-dd-name">${w(v.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${w(v.abbreviation||"—")}]</span>
            </div>`}B.some(v=>v.faction_type==="corporation")||(o+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),B.some(v=>v.faction_type==="party")||(o+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),x.innerHTML=o}document.getElementById("id-type-badge").textContent=e.corp_company_type||"—",document.getElementById("id-logo").textContent=r.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=e.faction_name||"Unnamed Corp";const f=e.party_description||"";document.getElementById("id-slogan").textContent=f?'"'+f+'"':'"--"';const k=t?.current_date?t.current_date.replace(/.*,\s*/,""):"—",M=e.leader_first_name&&e.leader_last_name?e.leader_first_name+" "+e.leader_last_name+(e.leader_age?" ("+e.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${w(k)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${w(d||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${w(e.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${w(e.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${w(M)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${w(e.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${w(r)}</span>
        </div>
    `;const l=e.last_rename_tick||0,T=t?.current_tick||0,E=Math.max(0,l+120-T),I=E<=0,g=document.getElementById("slogan-editor");g.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${w(f)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${I?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${I?"60 characters max. 120 tick cooldown after change.":E+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=e.id,window._currentTick=T;const L=tt(p,d,e);at(d,e);const N=await nt(p,d,e);let $=0;if(e?.id){const{data:o,error:y}=await u.from("corp_equipment").select("equipment_key, owned").eq("faction_id",e.id);y||($=X(o||[]))}et(p,t,L,e,N.propertyMaintenance||0,$),st(p,d,e,L,N),J(e,p,t),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function tt(n,a,s){const e=v=>P(n,v),d=(a||"UNKNOWN").toUpperCase(),p=Number(s?.corp_general_workforce??2250),m=Number(s?.corp_skilled_workforce??600),i=Number(s?.corp_innovative_workforce??150),t=p+m+i,r=2,_=3,b=6,x=e("minimum_wage"),f=x/100*48e3,k=e("inflation"),M=e("standard_of_living"),l=1+(k-50)/100*.5,T=1+(M-50)/100*.5,C=v=>Math.round(f*v*l*T),E=C(r),I=C(_),g=C(b),L=p*E,N=m*I,$=i*g,o=L+N+$;function y(v){return"$"+Math.round(v).toLocaleString()+"/yr"}const S=`${l.toFixed(2)} &times; ${T.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=t.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${w(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${p.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${r}.0 &times; ${S})</span>
                <span class="wf-tier__value">${y(E)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(L)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${w(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${m.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${_}.0 &times; ${S})</span>
                <span class="wf-tier__value">${y(I)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(N)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${w(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${i.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${b}.0 &times; ${S})</span>
                <span class="wf-tier__value">${y(g)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c($)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${w(d)})</span>
                <span class="wf-tier__value">${x}/100 → ${y(f)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${l.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${T.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${t.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${c(o)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${c(o/12)}</span>
            </div>
        </div>
    `,{totalWages:o,generalTotal:L,skilledTotal:N,innovativeTotal:$,monthlyWages:Math.round(o/12)}}function et(n,a,s,e,d,p){const m=a?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+m;const i=5e7,t=h=>P(n,h),r=1+(t("gdp_growth")-50)/100*.4,_=1+(t("urbanization")-50)/100*.3,b=1+(t("population_growth")-50)/100*.2,x=1+(t("standard_of_living")-50)/100*.15,f=1+(50-t("physical_infrastructure"))/100*.1,k=1-Math.max(0,t("inflation")-50)/100*.1,M=1-Math.max(0,t("interest_rates")-50)/100*.1,l=r*_*b*x*f*k*M,T=Math.round(i*l),C=Math.round(T/12),E=0,I=0,g=E+I+C,L=s?.totalWages||0,N=Math.round(L/12),$=0,o=0,y=d||0,S=p||0,v=Number(e?.corp_loans)||0,A=.05,q=v>0?Math.round(v*(A/12)/(1-Math.pow(1+A/12,-120))):0,W=N+$+y+S+q+o,D=g-W,H=Number(e?.corp_cash_reserves??0),V=v,j=[{stat:"gdp_growth",value:t("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:t("urbanization"),weight:"0.3"},{stat:"population_growth",value:t("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:t("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:t("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:t("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:t("interest_rates"),weight:"-0.1",neg:!0}];function Y(h){return h.neg?h.value>50?"var(--red)":"var(--green)":h.note?h.value<50?"var(--green)":"var(--red)":h.value>=50?"var(--green)":h.value>=35?"var(--amber)":"var(--red)"}const O=g||1,G=(E/O*100).toFixed(1),K=(I/O*100).toFixed(1),Q=(C/O*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${G}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${K}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${Q}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${c(E)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${c(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${c(C)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${c(g)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${c(N)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${c($)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${c(y)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${c(S)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${c(q)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${c(o)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${c(W)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${D>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${D>=0?"var(--green)":"var(--red)"}">${c(D)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${c(H)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${c(V)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${j.map(h=>`
                <div class="drv-row">
                    <span class="drv-row__name">${h.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${h.value}%;background:${Y(h)}"></div></div>
                    <span class="drv-row__val">${h.value}</span>
                    <span class="drv-row__wt">&times;${h.weight}</span>
                    ${h.note?'<span class="drv-row__note">'+h.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${l.toFixed(2)}</span>
            </div>
        </div>
    `}function at(n,a){const s=(n||"").toUpperCase(),e=Number(a.corp_general_workforce??0)+Number(a.corp_skilled_workforce??0)+Number(a.corp_innovative_workforce??0),d=[{label:"Reputation",value:Number(a.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:e||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(a.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(a.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(a.corp_market_share??5),change:0,nation:s,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(a.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(a.corp_regulatory_standing??50),change:0,nation:s,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(a.corp_political_influence??10),change:0,decay:!0,nation:s,max:100},{label:"Innovation",value:Number(a.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function p(t,r){if(!r||r>100)return"var(--text-primary)";const _=t/r*100;return _>=70?"var(--green)":_>=40?"var(--amber)":_>=20?"var(--orange, #d48a3c)":"var(--red)"}function m(t){const r=parseFloat(t),_=r>0?"var(--green)":r<0?"var(--red)":"var(--text-dim)",b=r>0?"▲":r<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${_}">${b}</span>
            <span class="stat-item__delta" style="color:${_}">${Math.abs(r).toFixed(1)}</span>
        </div>`}let i="";for(const t of d){if(t.isHero){i+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${t.label}</span>
                            ${t.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${t.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${m(t.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${t.value}%"></div></div>
                </div>`;continue}t.section&&(i+=`<div class="stats-section"><span class="stats-section__label">${t.section}</span></div>`);const r=t.max&&t.max<=100;i+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${t.label}</span>
                        ${t.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${t.nation?'<span class="stat-item__nation">'+w(t.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${r?p(t.value,t.max):"var(--text-primary)"}">${typeof t.value=="number"?t.value.toLocaleString():t.value}</span>
                    ${r?'<span class="stat-item__max">/100</span>':""}
                    ${m(t.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=i}async function nt(n,a,s,e){const d=(a||"UNKNOWN").toUpperCase();let p=[];if(s?.id){const{data:l}=await u.from("corp_properties").select("*").eq("faction_id",s.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});p=l||[]}const m={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let i=0,t=0;const r=5e7,_=1+(P(n,"inflation")-50)/100*.3,b=.8+P(n,"stability")/100*.4,x=Math.round(r*_*b),f=Math.round(x*.005);i+=x,t+=f;let k=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${w(d)} · Headquarters</div>
            </div>
            <span class="prop-asset__badge">HQ</span>
        </div>
        <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">500</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c(x)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(f)}</div>
            </div>
        </div>
    </div>`;for(const l of p){const T=m[l.style]||m.Basic;i+=Number(l.purchase_price||0),t+=Number(l.monthly_maintenance||0);const C=l.condition>=75?"var(--green)":l.condition>=50?"var(--amber)":"var(--orange)";k+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${w(l.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${w(l.city||d)} · ${(l.type||"").replace(/_/g," ")} · <span style="color:${T.color}">${(l.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge">OWNED</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${(l.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c(l.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(l.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${C}">${l.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${l.condition}%;height:100%;background:${C};"></div></div>
        </div>`}const M=document.getElementById("prop-count");return M&&(M.textContent=p.length+1+" ASSET"+(p.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${k}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${c(i)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(t)}/mo</span>
            </div>
        </div>
    `,{propertyValue:i,propertyMaintenance:t}}function st(n,a,s,e,d){(a||"UNKNOWN").toUpperCase();const p=s.corp_company_type||"Private",m=Number(s.corp_cash_reserves)||0,i=d?.propertyValue||0,t=0,r=0,_=m+i+t+r,b=Number(s.corp_loans)||0,f=e?.monthlyWages||0,k=0,M=b+f+k,l=_-M,C=Math.round(l*(1+.3)),E=C-l,I=E>0;document.getElementById("val-type-badge").textContent=p.toUpperCase();function g(L,N,$={}){const o=$.indent?"val-line val-line--indent":"val-line",y=$.bold?"val-line__label val-line__label--bold":"val-line__label",S=$.bold?"val-line__value val-line__value--bold":"val-line__value",v=$.color||($.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${o}"><span class="${y}">${L}</span><span class="${S}" style="color:${v}">${c(N)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${g("Cash & Reserves",m,{indent:!0})}
        ${g("Property",i,{indent:!0})}
        ${g("Equipment",t,{indent:!0})}
        ${g("Active Contracts",r,{indent:!0})}
        ${g("Total Assets",_,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${g("Outstanding Loans",b,{indent:!0})}
        ${g("Accounts Payable",f,{indent:!0})}
        ${g("Pending Project Costs",k,{indent:!0})}
        ${g("Total Liabilities",M,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${l>=0?"var(--green)":"var(--red)"};">${c(l)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${c(C)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${I?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${I?"var(--green)":"var(--red)"};">${I?"+":""}${c(E)}</span>
            </div>
            <div class="val-market__note">${I?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let U=null,F=null;function ot(){F&&clearInterval(F),F=setInterval(z,1e3),z()}function z(){const n=document.getElementById("tick-countdown");if(!n||!U){n&&(n.textContent="—");return}const a=U-Date.now();if(a<=0){n.textContent="Tick due...",clearInterval(F);return}const s=Math.floor(a/36e5),e=Math.floor(a%36e5/6e4),d=Math.floor(a%6e4/1e3);n.textContent=s+"h "+e+"m "+d+"s"}function it(){document.body.classList.toggle("light-mode");const n=document.getElementById("theme-toggle");n.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const n=document.getElementById("theme-toggle");n&&(n.textContent="Dark")}async function rt(){const n=document.getElementById("slogan-input"),a=document.getElementById("slogan-hint"),s=document.getElementById("slogan-save-btn"),e=(n.value||"").trim().slice(0,60);if(e.length===0){a.textContent="Slogan cannot be empty.",a.className="slogan-hint slogan-hint--error";return}s.disabled=!0,s.textContent="...",a.textContent="";try{const{error:d}=await u.from("factions").update({party_description:e,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(d)throw d;document.getElementById("id-slogan").textContent='"'+e+'"',a.textContent="Slogan saved! Next change in 120 ticks.",a.className="slogan-hint slogan-hint--ok",s.textContent="Save"}catch(d){console.error("Slogan save failed:",d),a.textContent="Failed to save slogan.",a.className="slogan-hint slogan-hint--error",s.disabled=!1,s.textContent="Save"}}async function lt(){await u.auth.signOut(),window.location.href="login.html"}function ct(){const n=document.getElementById("corp-faction-dropdown");n&&n.classList.toggle("open")}function dt(n,a){const s=document.getElementById("corp-faction-dropdown");s&&s.classList.remove("open"),sessionStorage.setItem("active_faction_id",n),a==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",n=>{const a=document.getElementById("faction-switcher"),s=document.getElementById("corp-faction-dropdown");s&&a&&!a.contains(n.target)&&s.classList.remove("open")});window.doLogout=lt;window.toggleTheme=it;window.saveSlogan=rt;window.toggleCorpDropdown=ct;window.switchToFaction=dt;let R=!1;async function pt(){if(R){console.warn("Dissolve already in progress");return}const{data:{user:n}}=await u.auth.getUser();if(!n){alert("Not logged in.");return}const a=sessionStorage.getItem("active_faction_id");if(!a){alert("No active faction selected.");return}const{data:s,error:e}=await u.from("factions").select("*").eq("id",a).eq("faction_type","corporation").is("abandoned_at",null).single();if(e||!s){alert("No active corporation found. It may have already been dissolved."),console.error("Dissolve lookup failed:",e?.message,"factionId:",a);return}const p=s.faction_name||"this corporation";if(!confirm("DISSOLVE "+p.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all properties, equipment, and inventory
• Remove all cash reserves
• Outstanding debts and active projects will remain

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+p+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}R=!0;const i=document.getElementById("dissolve-btn");i&&(i.disabled=!0,i.textContent="DISSOLVING...",i.style.opacity="0.5");try{async function t(f){const{error:k}=await f;if(k)throw k}await t(u.from("contract_bids").delete().eq("faction_id",a)),await t(u.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",a).in("status",["open","bidding"])),await t(u.from("corp_equipment_deliveries").delete().eq("faction_id",a)),await t(u.from("corp_equipment").delete().eq("faction_id",a)),await t(u.from("corp_properties").delete().eq("faction_id",a)),await u.from("corp_material_inventory").delete().eq("faction_id",a),await u.from("corp_warehouse").delete().eq("faction_id",a),await t(u.from("factions").update({abandoned_at:new Date().toISOString(),corp_cash_reserves:0,corp_general_workforce:0,corp_skilled_workforce:0,corp_innovative_workforce:0,action_points:0}).eq("id",a)),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:r,error:_}=await u.from("factions").select("id, faction_type").or(`id.eq.${n.id},linked_user_id.eq.${n.id}`).is("abandoned_at",null);_&&console.warn("Failed to check remaining factions:",_.message);const b=(r||[]).find(f=>f.faction_type==="party"),x=(r||[]).find(f=>f.faction_type==="corporation");b?(sessionStorage.setItem("active_faction_id",b.id),alert(p+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):x?(sessionStorage.setItem("active_faction_id",x.id),alert(p+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(p+` has been dissolved.

You have no remaining factions.`),window.location.href="faction-select.html")}catch(t){alert("Dissolution failed: "+(t.message||t)+`

Please try again or contact support.`),i&&(i.disabled=!1,i.textContent="Dissolve Corporation",i.style.opacity="1")}finally{R=!1}}window.dissolveCorporation=pt;Z();
