import{_}from"./supabase-client-BXEzLDpS.js";import{e as p,t as Z}from"./utils-C2W-HleY.js";import{initMessaging as ye}from"./messaging-B5Fng3EZ.js";import{c as he}from"./equipment-DsuDdEne.js";let q=[];function f(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+Math.round(e).toLocaleString()}function O(e,a){return Number(e?.[a]??50)}async function we(){const{data:{user:e}}=await _.auth.getUser();if(!e){window.location.href="login.html";return}const{data:a}=await _.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);q=(a||[]).filter(g=>g.nation_id&&!g.abandoned_at);const n=sessionStorage.getItem("active_faction_id");let t=q.find(g=>g.id===n)||q.find(g=>g.faction_type==="corporation")||q[0];if(!t){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",t.id),t.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i={Construction:"corp-operations.html",Finance:"corp-operations-finance.html"}[t.corp_sector]||"corp-operations.html",d=document.getElementById("nav-operations"),r=document.getElementById("nav-expansion");d&&(d.href=i),r&&(r.href="corp-operations.html?tab=expansion");let o=t.nation||"",c=null;const[v,u]=await Promise.all([t.nation_id?_.from("nations").select("*").eq("id",t.nation_id).single():Promise.resolve({data:null}),_.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);v.error&&console.warn("Nation load failed:",v.error.message),v.data&&(o=v.data.name,c=v.data),u.error&&console.warn("Shard load failed:",u.error.message);const m=u.data,b=t.corp_ticker||t.abbreviation||"";if(document.getElementById("corp-logo").textContent=b.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=t.faction_name||"Unnamed Corp",m){if(document.getElementById("game-date").textContent=m.current_date||"—",document.getElementById("tick-number").textContent=m.current_tick||"—",m.next_tick_at){const B=(Number(m.tick_interval_hours)||8)*36e5,F=new Date(m.next_tick_at).getTime(),D=F-B+B/2;Q=new Date(D>Date.now()?D:F+B/2),Ie()}const g=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");g&&(g.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(b?"["+b+"]":t.faction_name||"Corp")+" ▾";const h=document.getElementById("topbar-cash");if(h){const g=Number(t.corp_cash_reserves??0),B=g>=1e9?"$"+(g/1e9).toFixed(1)+"B":g>=1e6?"$"+(g/1e6).toFixed(1)+"M":"$"+Math.round(g/1e3)+"k";h.textContent="CASH: "+B}const S=document.getElementById("topbar-ap");S&&(S.style.display="none");const y=document.getElementById("corp-faction-dropdown");if(y){let g="";for(const L of q){const D=L.id===t.id,H=L.faction_type==="corporation"?"CORP":"PARTY",Y=L.faction_type==="corporation"?"var(--teal)":"var(--amber)";g+=`<div class="corp-dd-item${D?" active":""}" onclick="switchToFaction('${L.id}', '${L.faction_type}')">
                <span class="corp-dd-type" style="color:${Y}">${H}</span>
                <span class="corp-dd-name">${p(L.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${p(L.abbreviation||"—")}]</span>
            </div>`}q.some(L=>L.faction_type==="corporation")||(g+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),q.some(L=>L.faction_type==="party")||(g+=`<div class="corp-dd-item corp-dd-item--create" onclick="sessionStorage.setItem('pending_faction_type','party'); window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),y.innerHTML=g}document.getElementById("id-type-badge").textContent=t.corp_company_type||"—",document.getElementById("id-logo").textContent=b.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=t.faction_name||"Unnamed Corp";const w=t.party_description||"";document.getElementById("id-slogan").textContent=w?'"'+w+'"':'"--"';const x=m?.current_date?m.current_date.replace(/.*,\s*/,""):"—",N=t.leader_first_name&&t.leader_last_name?t.leader_first_name+" "+t.leader_last_name+(t.leader_age?" ("+t.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${p(x)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${p(o||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${p(t.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${p(t.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${p(N)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${p(t.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${p(b)}</span>
        </div>
    `;const $=t.last_rename_tick||0,l=m?.current_tick||0,E=Math.max(0,$+120-l),I=!w||w==="-"||w==='"-"'||E<=0,R=document.getElementById("slogan-editor");R.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${p(w)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${I?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${I?"60 characters max. 120 tick cooldown after change.":E+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=t.id,window._currentTick=l,window._nationStats=c,window._factionData=t;const A=xe(c,o,t);ke(o,t);const T=await Ce(c,o,t,m);let z=0;if(t?.id){const{data:g,error:B}=await _.from("corp_equipment").select("equipment_key, owned").eq("faction_id",t.id);B||(z=he(g||[]))}$e(c,m,A,t,T.propertyMaintenance||0,z),Ee(c,o,t,A,T),ye(t,c,m),P={nationId:t.nation_id},pe(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function xe(e,a,n){const t=T=>O(e,T),s=(a||"UNKNOWN").toUpperCase(),i=Number(n?.corp_general_workforce??2250),d=Number(n?.corp_skilled_workforce??600),r=Number(n?.corp_innovative_workforce??150),o=i+d+r,c=2,v=3,u=6,m=t("minimum_wage"),b=m/100*48e3,h=t("inflation"),S=t("standard_of_living"),y=1+(h-50)/100*.5,w=1+(S-50)/100*.5,x=T=>Math.round(b*T*y*w),N=x(c),$=x(v),l=x(u),M=i*N,E=d*$,k=r*l,I=M+E+k;function R(T){return"$"+Math.round(T).toLocaleString()+"/yr"}const A=`${y.toFixed(2)} &times; ${w.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=o.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${p(s)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${i.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${c}.0 &times; ${A})</span>
                <span class="wf-tier__value">${R(N)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${f(M)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${p(s)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${d.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${v}.0 &times; ${A})</span>
                <span class="wf-tier__value">${R($)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${f(E)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${p(s)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${u}.0 &times; ${A})</span>
                <span class="wf-tier__value">${R(l)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${f(k)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${p(s)})</span>
                <span class="wf-tier__value">${m}/100 → ${R(b)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${y.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${w.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${o.toLocaleString()}</span>
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
    `,{totalWages:I,generalTotal:M,skilledTotal:E,innovativeTotal:k,monthlyWages:Math.round(I/12)}}function $e(e,a,n,t,s,i){const d=a?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+d;const r=5e7,o=C=>O(e,C),c=1+(o("gdp_growth")-50)/100*.4,v=1+(o("urbanization")-50)/100*.3,u=1+(o("population_growth")-50)/100*.2,m=1+(o("standard_of_living")-50)/100*.15,b=1+(50-o("physical_infrastructure"))/100*.1,h=1-Math.max(0,o("inflation")-50)/100*.1,S=1-Math.max(0,o("interest_rates")-50)/100*.1,y=c*v*u*m*b*h*S,w=Math.round(r*y),x=(t.corp_general_workforce||0)+(t.corp_skilled_workforce||0)+(t.corp_innovative_workforce||0),N=Math.min(1,x/3e3),$=Math.round(Math.round(w/12)*N),l=0,M=0,E=l+M+$,k=n?.totalWages||0,I=Math.round(k/12),R=0,A=0,T=s||0,z=i||0,g=Number(t?.corp_loans)||0,B=.05,F=g>0?Math.round(g*(B/12)/(1-Math.pow(1+B/12,-120))):0,D=I+R+T+z+F+A+75e3,H=E-D,Y=Number(t?.corp_cash_reserves??0),_e=g,fe=[{stat:"gdp_growth",value:o("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:o("urbanization"),weight:"0.3"},{stat:"population_growth",value:o("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:o("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:o("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:o("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:o("interest_rates"),weight:"-0.1",neg:!0}];function me(C){return C.neg?C.value>50?"var(--red)":"var(--green)":C.note?C.value<50?"var(--green)":"var(--red)":C.value>=50?"var(--green)":C.value>=35?"var(--amber)":"var(--red)"}const K=E||1,ue=(l/K*100).toFixed(1),ge=(M/K*100).toFixed(1),be=($/K*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${ue}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${ge}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${be}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${f(l)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${f(M)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${f($)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${f(E)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${f(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${f(R)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${f(T)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${f(z)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${f(F)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${f(A)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${f(D)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${H>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${H>=0?"var(--green)":"var(--red)"}">${f(H)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${f(Y)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${f(_e)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${fe.map(C=>`
                <div class="drv-row">
                    <span class="drv-row__name">${C.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${C.value}%;background:${me(C)}"></div></div>
                    <span class="drv-row__val">${C.value}</span>
                    <span class="drv-row__wt">&times;${C.weight}</span>
                    ${C.note?'<span class="drv-row__note">'+C.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${y.toFixed(2)}</span>
            </div>
        </div>
    `}function ke(e,a){const n=(e||"").toUpperCase(),t=Number(a.corp_general_workforce??0)+Number(a.corp_skilled_workforce??0)+Number(a.corp_innovative_workforce??0),s=[{label:"Reputation",value:Number(a.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:t||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(a.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(a.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(a.corp_market_share??5),change:0,nation:n,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(a.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(a.corp_regulatory_standing??50),change:0,nation:n,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(a.corp_political_influence??10),change:0,decay:!0,nation:n,max:100},{label:"Innovation",value:Number(a.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function i(o,c){if(!c||c>100)return"var(--text-primary)";const v=o/c*100;return v>=70?"var(--green)":v>=40?"var(--amber)":v>=20?"var(--orange, #d48a3c)":"var(--red)"}function d(o){const c=parseFloat(o),v=c>0?"var(--green)":c<0?"var(--red)":"var(--text-dim)",u=c>0?"▲":c<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${v}">${u}</span>
            <span class="stat-item__delta" style="color:${v}">${Math.abs(c).toFixed(1)}</span>
        </div>`}let r="";for(const o of s){if(o.isHero){r+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${o.label}</span>
                            ${o.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${o.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${d(o.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${o.value}%"></div></div>
                </div>`;continue}o.section&&(r+=`<div class="stats-section"><span class="stats-section__label">${o.section}</span></div>`);const c=o.max&&o.max<=100;r+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${o.label}</span>
                        ${o.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${o.nation?'<span class="stat-item__nation">'+p(o.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${c?i(o.value,o.max):"var(--text-primary)"}">${typeof o.value=="number"?o.value.toLocaleString():o.value}</span>
                    ${c?'<span class="stat-item__max">/100</span>':""}
                    ${d(o.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=r}async function Ce(e,a,n,t){const s=(a||"UNKNOWN").toUpperCase();let i=[];if(n?.id){const{data:l}=await _.from("corp_properties").select("*").eq("faction_id",n.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});i=l||[]}const d={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let r=0,o=0;const c=Number(n?.corp_general_workforce??0)+Number(n?.corp_skilled_workforce??0)+Number(n?.corp_innovative_workforce??0),v=500,u=v+i.reduce((l,M)=>l+Number(M.capacity||0),0),m=u>0?Math.round(c*(v/u)):c,b=5e7,h=1+(O(e,"inflation")-50)/100*.3,S=.8+O(e,"stability")/100*.4,y=Math.round(b*h*S),w=Math.round(y*.005);r+=y,o+=w;let x=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${p(s)} · Headquarters</div>
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
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${m.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${f(y)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${f(w)}</div>
            </div>
        </div>
    </div>`,N=m;for(const l of i){const M=d[l.style]||d.Basic;r+=Number(l.purchase_price||0),o+=Number(l.monthly_maintenance||0);const E=l.condition>=75?"var(--green)":l.condition>=50?"var(--amber)":"var(--orange)",k=Number(l.capacity||0),I=u>0?Math.min(c-N,Math.round(c*(k/u))):0;N+=I,x+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${p(l.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${p(l.city||s)} · ${(l.type||"").replace(/_/g," ")} · <span style="color:${M.color}">${(l.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge">OWNED</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${k.toLocaleString()}</div>
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
                <span style="color:${E}">${l.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${l.condition}%;height:100%;background:${E};"></div></div>
            ${l.refurbish_until_tick&&l.refurbish_until_tick>(t?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${l.refurbish_until_tick-(t?.current_tick||0)} tick${l.refurbish_until_tick-(t?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${l.id}','${p(l.name).replace(/'/g,"\\'")}',${l.purchase_price||0},${l.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${l.id}','${p(l.name).replace(/'/g,"\\'")}',${l.condition},${k})">REFURBISH</button>
            </div>`}
        </div>`}const $=document.getElementById("prop-count");return $&&($.textContent=i.length+1+" ASSET"+(i.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${x}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${f(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${f(o)}/mo</span>
            </div>
        </div>
    `,{propertyValue:r,propertyMaintenance:o}}function Ee(e,a,n,t,s){(a||"UNKNOWN").toUpperCase();const i=n.corp_company_type||"Private",d=Number(n.corp_cash_reserves)||0,r=s?.propertyValue||0,o=0,c=0,v=d+r+o+c,u=Number(n.corp_loans)||0,b=t?.monthlyWages||0,h=0,S=u+b+h,y=v-S,x=Math.round(y*(1+.3)),N=x-y,$=N>0;document.getElementById("val-type-badge").textContent=i.toUpperCase();function l(M,E,k={}){const I=k.indent?"val-line val-line--indent":"val-line",R=k.bold?"val-line__label val-line__label--bold":"val-line__label",A=k.bold?"val-line__value val-line__value--bold":"val-line__value",T=k.color||(k.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${I}"><span class="${R}">${M}</span><span class="${A}" style="color:${T}">${f(E)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${l("Cash & Reserves",d,{indent:!0})}
        ${l("Property",r,{indent:!0})}
        ${l("Equipment",o,{indent:!0})}
        ${l("Active Contracts",c,{indent:!0})}
        ${l("Total Assets",v,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${l("Outstanding Loans",u,{indent:!0})}
        ${l("Accounts Payable",b,{indent:!0})}
        ${l("Pending Project Costs",h,{indent:!0})}
        ${l("Total Liabilities",S,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${y>=0?"var(--green)":"var(--red)"};">${f(y)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${f(x)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${$?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${$?"var(--green)":"var(--red)"};">${$?"+":""}${f(N)}</span>
            </div>
            <div class="val-market__note">${$?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let Q=null,V=null;function Ie(){V&&clearInterval(V),V=setInterval(te,1e3),te()}function te(){const e=document.getElementById("tick-countdown");if(!e||!Q){e&&(e.textContent="—");return}const a=Q-Date.now();if(a<=0){e.textContent="Tick due...",clearInterval(V);return}const n=Math.floor(a/36e5),t=Math.floor(a%36e5/6e4),s=Math.floor(a%6e4/1e3);e.textContent=n+"h "+t+"m "+s+"s"}function Me(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}async function Se(){const e=document.getElementById("slogan-input"),a=document.getElementById("slogan-hint"),n=document.getElementById("slogan-save-btn"),t=(e.value||"").trim().slice(0,60);if(t.length===0){a.textContent="Slogan cannot be empty.",a.className="slogan-hint slogan-hint--error";return}n.disabled=!0,n.textContent="...",a.textContent="";try{const{error:s}=await _.from("factions").update({party_description:t,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(s)throw s;document.getElementById("id-slogan").textContent='"'+t+'"',a.textContent="Slogan saved! Next change in 120 ticks.",a.className="slogan-hint slogan-hint--ok",n.textContent="Save"}catch(s){console.error("Slogan save failed:",s),a.textContent="Failed to save slogan.",a.className="slogan-hint slogan-hint--error",n.disabled=!1,n.textContent="Save"}}async function Te(){await _.auth.signOut(),window.location.href="login.html"}function Le(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function Ne(e,a){const n=document.getElementById("corp-faction-dropdown");n&&n.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),a==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const a=document.getElementById("faction-switcher"),n=document.getElementById("corp-faction-dropdown");n&&a&&!a.contains(e.target)&&n.classList.remove("open")});window.doLogout=Te;window.toggleTheme=Me;window.saveSlogan=Se;window.toggleCorpDropdown=Le;window.switchToFaction=Ne;let X=!1;async function Re(){if(X){console.warn("Dissolve already in progress");return}const{data:{user:e}}=await _.auth.getUser();if(!e){alert("Not logged in.");return}const a=sessionStorage.getItem("active_faction_id");if(!a){alert("No active faction selected.");return}const{data:n,error:t}=await _.from("factions").select("*").eq("id",a).eq("faction_type","corporation").is("abandoned_at",null).single();if(t||!n){alert("No active corporation found. It may have already been dissolved."),console.error("Dissolve lookup failed:",t?.message,"factionId:",a);return}const i=n.faction_name||"this corporation";if(!confirm("DISSOLVE "+i.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all properties, equipment, and inventory
• Remove all cash reserves
• Outstanding debts and active projects will remain

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+i+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}X=!0;const r=document.getElementById("dissolve-btn");r&&(r.disabled=!0,r.textContent="DISSOLVING...",r.style.opacity="0.5");try{async function o(b){const{error:h}=await b;if(h)throw h}await o(_.from("contract_bids").delete().eq("faction_id",a)),await o(_.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",a).in("status",["open","bidding"])),await o(_.from("corp_equipment_deliveries").delete().eq("faction_id",a)),await o(_.from("corp_equipment").delete().eq("faction_id",a)),await o(_.from("corp_properties").delete().eq("faction_id",a)),await _.from("corp_material_inventory").delete().eq("faction_id",a),await _.from("corp_warehouse").delete().eq("faction_id",a),await o(_.from("factions").update({abandoned_at:new Date().toISOString(),corp_cash_reserves:0,corp_general_workforce:0,corp_skilled_workforce:0,corp_innovative_workforce:0,action_points:0}).eq("id",a)),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:c,error:v}=await _.from("factions").select("id, faction_type").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`).is("abandoned_at",null);v&&console.warn("Failed to check remaining factions:",v.message);const u=(c||[]).find(b=>b.faction_type==="party"),m=(c||[]).find(b=>b.faction_type==="corporation");u?(sessionStorage.setItem("active_faction_id",u.id),alert(i+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):m?(sessionStorage.setItem("active_faction_id",m.id),alert(i+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(i+` has been dissolved.

You have no remaining factions.`),window.location.href="faction-select.html")}catch(o){alert("Dissolution failed: "+(o.message||o)+`

Please try again or contact support.`),r&&(r.disabled=!1,r.textContent="Dissolve Corporation",r.style.opacity="1")}finally{X=!1}}window.dissolveCorporation=Re;let j=!1;function Ae(e,a,n,t){if(j)return;const s=window._nationStats,d=1+(O(s,"inflation")-50)/100*.3,r=Math.max(.1,t/100),o=Math.round(n*d*r),c=document.getElementById("prop-modal-overlay"),v=document.getElementById("prop-modal-content");v.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${p(a)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${f(n)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Inflation Modifier</span>
                <span style="color:var(--amber, #b09a5b);">${d.toFixed(3)}x</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Condition</span>
                <span style="color:${t>=75?"var(--green)":t>=50?"var(--amber)":"var(--red)"};">${t}%</span>
            </div>
            <div style="border-top:1px solid var(--border-hair);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-mono);font-weight:700;">
                <span style="color:var(--text-primary);">Sale Price</span>
                <span style="color:var(--gold, #c8a832);">${f(o)}</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-sell-confirm" onclick="confirmSellProperty('${e}', ${o})">Confirm Sale</button>
        </div>
    `,c.style.display="flex"}async function Be(e,a){if(j)return;j=!0;const n=document.getElementById("prop-sell-confirm");n&&(n.disabled=!0,n.textContent="Selling...");try{const t=window._corpFactionId;if(!t)throw new Error("No faction");const{error:s}=await _.from("corp_properties").update({is_active:!1}).eq("id",e).eq("faction_id",t);if(s)throw new Error("Failed to sell property: "+s.message);const{data:i}=await _.from("factions").select("corp_cash_reserves").eq("id",t).single(),d=Number(i?.corp_cash_reserves??0),{error:r}=await _.from("factions").update({corp_cash_reserves:d+a}).eq("id",t);r&&console.error("[Property] Failed to credit cash:",r.message),J(),alert("Property sold for "+f(a)+". Cash credited."),location.reload()}catch(t){alert("Sale failed: "+t.message)}finally{j=!1,n&&(n.disabled=!1,n.textContent="Confirm Sale")}}let G=!1;function Pe(e,a,n,t){if(G)return;const s=window._nationStats,i=window._factionData,r=1+(O(s,"inflation")-50)/100*.3,o=Math.round(2e6*(t/1e3)),c=Math.round(o*r),v=Math.max(50,Math.round(t*.1)),u=Number(i?.corp_general_workforce??0),m=u>=v,h=Number(i?.corp_cash_reserves??0)>=c,S=document.getElementById("prop-modal-overlay"),y=document.getElementById("prop-modal-content"),w=m&&h&&n<100;let x="";n>=100?x='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property is already at 100% condition.</div>':h?m||(x='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient general workforce (need '+v.toLocaleString()+", have "+u.toLocaleString()+").</div>"):x='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>',y.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${p(a)} — Current Condition: ${n}%</div>
        ${x}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost</span>
                <span style="color:${h?"var(--gold, #c8a832)":"var(--red)"};">${f(c)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Workforce Required</span>
                <span style="color:${m?"var(--blue)":"var(--red)"};">${v.toLocaleString()} General</span>
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
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${e}', ${c}, ${v})" ${w?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,S.style.display="flex"}async function De(e,a,n){if(G)return;G=!0;const t=document.getElementById("prop-refurb-confirm");t&&(t.disabled=!0,t.textContent="Starting...");try{const s=window._corpFactionId,i=window._currentTick;if(!s)throw new Error("No faction");const d=Math.floor(Math.random()*6)+1,o=94+(Math.floor(Math.random()*6)+1),c=i+d,{data:v}=await _.from("factions").select("corp_cash_reserves").eq("id",s).single(),u=Number(v?.corp_cash_reserves??0);if(u<a)throw new Error("Insufficient cash");const{error:m}=await _.from("factions").update({corp_cash_reserves:u-a}).eq("id",s);if(m)throw new Error("Failed to deduct cost: "+m.message);const{error:b}=await _.from("corp_properties").update({refurbish_until_tick:c,refurbish_condition:o}).eq("id",e).eq("faction_id",s);if(b)throw new Error("Failed to start refurbishment: "+b.message);J(),alert("Refurbishment started! Duration: "+d+" tick"+(d!==1?"s":"")+". Condition will be restored to "+Math.min(100,o)+"% when complete."),location.reload()}catch(s){alert("Refurbishment failed: "+s.message)}finally{G=!1,t&&(t.disabled=!1,t.textContent="Begin Refurbishment")}}function J(){const e=document.getElementById("prop-modal-overlay");e&&(e.style.display="none")}window.showSellModal=Ae;window.confirmSellProperty=Be;window.showRefurbishModal=Pe;window.confirmRefurbish=De;window.closePropModal=J;const ne={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},oe={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},qe={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let W="nation",U="local",P=null;function Fe(e){return e?e.replace(/_/g," ").replace(/\b\w/g,a=>a.toUpperCase()):""}function ee(e,a){if(!e)return"<em>Unknown</em>";const n=p(e);return a?`<span style="color:${a.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${n}</span>`:`<strong>${n}</strong>`}function se(e,a,n){const t=e.factions?.nation_id===(e.nation_id||a),s=e.proposer_name||(t?e.factions?.faction_name:null)||"A former party",i=e.proposer_color||(t?e.factions?.party_color:null);return{fired_at_tick:e.proposed_tick,event_name:e.bill_name,_desc_html:`${ee(s,i)} proposed "${p(e.bill_name)}"`,category:"bill",_synthetic:!0,...n}}function re(e,a){const n=e.leader_first_name&&e.leader_last_name?`${e.leader_first_name} ${e.leader_last_name}`:null,t=n?` led by <strong>${p(n)}</strong>`:"";return{fired_at_tick:0,event_name:e.faction_name,_desc_html:`${ee(e.faction_name,e.party_color)} founded${t}`,category:"new_party",_synthetic:!0,_created_at:e.created_at,...a}}function ie(e,a){const n=qe[e.tier]||`Tier ${e.tier}`,t=e.demand_label?` demanding "${p(e.demand_label)}"`:"",s=e.status==="crisis_active",i=e.tier>=6?"#e74c3c":e.tier>=4?"#f39c12":"",d=i?`<span style="color:${i};font-weight:600">${p(n)}</span>`:`<strong>${p(n)}</strong>`;return{fired_at_tick:e.tick_resolved||e.tick_called,event_name:n,_desc_html:`${ee(e.factions?.faction_name,e.factions?.party_color)} organised a protest${t} — ${d}${s?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...a}}function le(e,a,n,t,s){return[...e.map(i=>({...i,_synthetic:!1})),...a,...n,...t].sort((i,d)=>{const r=(d.fired_at_tick||0)-(i.fired_at_tick||0);if(r!==0)return r;const o=i._created_at||i.created_at||"",c=d._created_at||d.created_at||"";return c>o?1:c<o?-1:0}).slice(0,s)}function ce(e){if(e._synthetic&&e._desc_html)return e._desc_html;const a=e.description_chosen||e.description_used||"",n=Fe(e.event_name),t=n?`<strong>${p(n)}</strong>`:"",s=a?p(a):"";return t&&s?`${t} — ${s}`:s||t||"Event"}function Oe(e){return e.map(a=>{const n=Z(a.fired_at_tick),t=ne[(a.category||"").toLowerCase()]||oe;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${p(n)}</span>
            <span class="corp-ev-icon" style="color:${t.color}">${t.icon}</span>
            <span class="corp-ev-text">${ce(a)}</span>
            ${t.label?`<span class="corp-ev-cat" style="color:${t.color};background:${t.bg}">${t.label}</span>`:""}
        </div>`}).join("")}const ae=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function ze(e){let a=0;for(let n=0;n<e.length;n++)a=(a<<5)-a+e.charCodeAt(n)|0;return ae[Math.abs(a)%ae.length]}function He(e){return e.map(a=>{const n=Z(a.fired_at_tick),t=ne[(a.category||"").toLowerCase()]||oe,s=a.nations?.name||"Unknown",i=a.nations?.nation_profiles,d=Array.isArray(i)?i[0]?.flag_url:i?.flag_url,r=ze(s),o=d?`<img src="${p(d)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${p(n)}</span>
                <span class="corp-ev-nation-badge" style="color:${r.color};background:${r.bg};border-color:${r.border};">${o}${p(s)}</span>
            </span>
            <span class="corp-ev-text">${ce(a)}</span>
            ${t.label?`<span class="corp-ev-cat" style="color:${t.color};background:${t.bg}">${t.label}</span>`:""}
        </div>`}).join("")}async function We(){const e=document.getElementById("corp-events-list");if(!e||!P)return;const{nationId:a}=P;if(!a){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const{data:n,error:t}=await _.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").eq("nation_id",a).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(t)throw t;if(!n||n.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events in this nation yet.</div>';return}e.innerHTML=de(n,!1)}catch(n){console.error("Corp local events error:",n),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function Ue(){const e=document.getElementById("corp-events-list");if(!e||!P)return;const{nationId:a}=P;if(!a){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const{data:n,error:t}=await _.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",a).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(t)throw t;if(!n||n.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}e.innerHTML=de(n,!0)}catch(n){console.error("Corp world events error:",n),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function de(e,a){return e.map(n=>{const t=[n.leader_first_name,n.leader_last_name].filter(Boolean).join(" ")||"Unknown",s=n.nation||"Unknown",i=n.corp_subsector||n.corp_sector||"General",d=n.corp_ticker||n.abbreviation||"",r=n.founded_tick?Z(n.founded_tick):"";let o='<div class="corp-event-row">';return a&&(o+='<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--teal);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);padding:1px 5px;display:inline-block;margin-bottom:2px;">'+p(s.toUpperCase())+"</div>"),o+='<div style="font-size:11px;color:var(--text-primary);line-height:1.5;">',o+='<span style="font-weight:600;">'+p(n.faction_name)+"</span>",d&&(o+=' <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">['+p(d)+"]</span>"),o+=' was founded in <span style="font-weight:500;">'+p(s)+"</span>",o+=' with a specialty in <span style="color:var(--teal);font-weight:500;">'+p(i)+"</span>.",o+=' Led by CEO <span style="font-weight:500;">'+p(t)+"</span>.",o+="</div>",r&&(o+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">'+p(r)+"</div>"),o+="</div>",o}).join("")}async function pe(){const e=document.getElementById("corp-events-list");if(!e||!P)return;const{nationId:a}=P;if(!a){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[n,t,s,i]=await Promise.all([_.from("event_log").select("*").eq("nation_id",a).order("fired_at_tick",{ascending:!1}).limit(50),_.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",a).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),_.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",a).order("created_at",{ascending:!1}).limit(20),_.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",a).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(n.error)throw n.error;const d=n.data||[],r=le(d,(t.data||[]).map(o=>se(o,a)),(s.data||[]).map(o=>re(o)),(i.data||[]).map(o=>ie(o)),60);if(r.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>';return}e.innerHTML=Oe(r)}catch(n){console.error("Nation events error:",n),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function Ve(){const e=document.getElementById("corp-events-list");if(!e||!P)return;const{nationId:a}=P;if(!a){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[n,t,s,i]=await Promise.all([_.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",a).order("fired_at_tick",{ascending:!1}).limit(60),_.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",a).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),_.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",a).order("created_at",{ascending:!1}).limit(15),_.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",a).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(n.error)throw n.error;const d=n.data||[],r=le(d,(t.data||[]).map(o=>se(o,null,{nations:o.nations})),(s.data||[]).map(o=>re(o,{nations:o.nations})),(i.data||[]).map(o=>ie(o,{nations:o.nations})),60);if(r.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>';return}e.innerHTML=He(r)}catch(n){console.error("World events error:",n),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}window.switchCorpEventsCat=function(e){e!==W&&(W=e,document.querySelectorAll("#corp-events-cat-bar .corp-events-tab").forEach(a=>a.classList.toggle("active",a.dataset.cat===e)),ve())};window.switchCorpEventsScope=function(e){e!==U&&(U=e,document.querySelectorAll("#corp-events-scope-bar .corp-events-tab").forEach(a=>a.classList.toggle("active",a.dataset.scope===e)),ve())};function ve(){W==="nation"&&U==="local"?pe():W==="nation"&&U==="world"?Ve():W==="corporate"&&U==="local"?We():Ue()}we();
