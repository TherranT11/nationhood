import{_ as p}from"./supabase-client-BXEzLDpS.js";import{e as _,t as se}from"./utils-C2W-HleY.js";import{initMessaging as ge}from"./messaging-B5Fng3EZ.js";import{c as be}from"./equipment-DsuDdEne.js";let D=[];function f(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+Math.round(e).toLocaleString()}function O(e,t){return Number(e?.[t]??50)}async function ye(){const{data:{user:e}}=await p.auth.getUser();if(!e){window.location.href="login.html";return}const{data:t}=await p.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);D=(t||[]).filter(g=>g.nation_id&&!g.abandoned_at);const n=sessionStorage.getItem("active_faction_id");let a=D.find(g=>g.id===n)||D.find(g=>g.faction_type==="corporation")||D[0];if(!a){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",a.id),a.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i={Construction:"corp-operations.html",Finance:"corp-operations-finance.html"}[a.corp_sector]||"corp-operations.html",d=document.getElementById("nav-operations"),r=document.getElementById("nav-expansion");d&&(d.href=i),r&&(r.href="corp-operations.html?tab=expansion");let o=a.nation||"",c=null;const[v,u]=await Promise.all([a.nation_id?p.from("nations").select("*").eq("id",a.nation_id).single():Promise.resolve({data:null}),p.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);v.error&&console.warn("Nation load failed:",v.error.message),v.data&&(o=v.data.name,c=v.data),u.error&&console.warn("Shard load failed:",u.error.message);const m=u.data,b=a.corp_ticker||a.abbreviation||"";if(document.getElementById("corp-logo").textContent=b.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=a.faction_name||"Unnamed Corp",m){if(document.getElementById("game-date").textContent=m.current_date||"—",document.getElementById("tick-number").textContent=m.current_tick||"—",m.next_tick_at){const A=(Number(m.tick_interval_hours)||8)*36e5,F=new Date(m.next_tick_at).getTime(),B=F-A+A/2;K=new Date(B>Date.now()?B:F+A/2),Ce()}const g=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");g&&(g.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(b?"["+b+"]":a.faction_name||"Corp")+" ▾";const h=document.getElementById("topbar-cash");if(h){const g=Number(a.corp_cash_reserves??0),A=g>=1e9?"$"+(g/1e9).toFixed(1)+"B":g>=1e6?"$"+(g/1e6).toFixed(1)+"M":"$"+Math.round(g/1e3)+"k";h.textContent="CASH: "+A}const S=document.getElementById("topbar-ap");S&&(S.style.display="none");const y=document.getElementById("corp-faction-dropdown");if(y){let g="";for(const N of D){const B=N.id===a.id,H=N.faction_type==="corporation"?"CORP":"PARTY",j=N.faction_type==="corporation"?"var(--teal)":"var(--amber)";g+=`<div class="corp-dd-item${B?" active":""}" onclick="switchToFaction('${N.id}', '${N.faction_type}')">
                <span class="corp-dd-type" style="color:${j}">${H}</span>
                <span class="corp-dd-name">${_(N.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${_(N.abbreviation||"—")}]</span>
            </div>`}D.some(N=>N.faction_type==="corporation")||(g+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),D.some(N=>N.faction_type==="party")||(g+=`<div class="corp-dd-item corp-dd-item--create" onclick="sessionStorage.setItem('pending_faction_type','party'); window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),y.innerHTML=g}document.getElementById("id-type-badge").textContent=a.corp_company_type||"—",document.getElementById("id-logo").textContent=b.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=a.faction_name||"Unnamed Corp";const w=a.party_description||"";document.getElementById("id-slogan").textContent=w?'"'+w+'"':'"--"';const x=m?.current_date?m.current_date.replace(/.*,\s*/,""):"—",L=a.leader_first_name&&a.leader_last_name?a.leader_first_name+" "+a.leader_last_name+(a.leader_age?" ("+a.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${_(x)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${_(o||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${_(a.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${_(a.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${_(L)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${_(a.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${_(b)}</span>
        </div>
    `;const $=a.last_rename_tick||0,l=m?.current_tick||0,E=Math.max(0,$+120-l),I=!w||w==="-"||w==='"-"'||E<=0,R=document.getElementById("slogan-editor");R.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${_(w)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${I?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${I?"60 characters max. 120 tick cooldown after change.":E+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=a.id,window._currentTick=l,window._nationStats=c,window._factionData=a;const P=he(c,o,a);xe(o,a);const T=await $e(c,o,a,m);let W=0;if(a?.id){const{data:g,error:A}=await p.from("corp_equipment").select("equipment_key, owned").eq("faction_id",a.id);A||(W=be(g||[]))}we(c,m,P,a,T.propertyMaintenance||0,W),ke(c,o,a,P,T),ge(a,c,m),q={nationId:a.nation_id},de(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function he(e,t,n){const a=T=>O(e,T),s=(t||"UNKNOWN").toUpperCase(),i=Number(n?.corp_general_workforce??2250),d=Number(n?.corp_skilled_workforce??600),r=Number(n?.corp_innovative_workforce??150),o=i+d+r,c=2,v=3,u=6,m=a("minimum_wage"),b=m/100*48e3,h=a("inflation"),S=a("standard_of_living"),y=1+(h-50)/100*.5,w=1+(S-50)/100*.5,x=T=>Math.round(b*T*y*w),L=x(c),$=x(v),l=x(u),M=i*L,E=d*$,k=r*l,I=M+E+k;function R(T){return"$"+Math.round(T).toLocaleString()+"/yr"}const P=`${y.toFixed(2)} &times; ${w.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=o.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${_(s)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${i.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${c}.0 &times; ${P})</span>
                <span class="wf-tier__value">${R(L)}</span>
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
                    <span class="wf-tier__nation">${_(s)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${d.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${v}.0 &times; ${P})</span>
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
                    <span class="wf-tier__nation">${_(s)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${u}.0 &times; ${P})</span>
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
                <span class="wf-tier__label">Minimum Wage (${_(s)})</span>
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
    `,{totalWages:I,generalTotal:M,skilledTotal:E,innovativeTotal:k,monthlyWages:Math.round(I/12)}}function we(e,t,n,a,s,i){const d=t?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+d;const r=5e7,o=C=>O(e,C),c=1+(o("gdp_growth")-50)/100*.4,v=1+(o("urbanization")-50)/100*.3,u=1+(o("population_growth")-50)/100*.2,m=1+(o("standard_of_living")-50)/100*.15,b=1+(50-o("physical_infrastructure"))/100*.1,h=1-Math.max(0,o("inflation")-50)/100*.1,S=1-Math.max(0,o("interest_rates")-50)/100*.1,y=c*v*u*m*b*h*S,w=Math.round(r*y),x=(a.corp_general_workforce||0)+(a.corp_skilled_workforce||0)+(a.corp_innovative_workforce||0),L=Math.min(1,x/3e3),$=Math.round(Math.round(w/12)*L),l=0,M=0,E=l+M+$,k=n?.totalWages||0,I=Math.round(k/12),R=0,P=0,T=s||0,W=i||0,g=Number(a?.corp_loans)||0,A=.05,F=g>0?Math.round(g*(A/12)/(1-Math.pow(1+A/12,-120))):0,B=I+R+T+W+F+P+75e3,H=E-B,j=Number(a?.corp_cash_reserves??0),pe=g,ve=[{stat:"gdp_growth",value:o("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:o("urbanization"),weight:"0.3"},{stat:"population_growth",value:o("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:o("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:o("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:o("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:o("interest_rates"),weight:"-0.1",neg:!0}];function _e(C){return C.neg?C.value>50?"var(--red)":"var(--green)":C.note?C.value<50?"var(--green)":"var(--red)":C.value>=50?"var(--green)":C.value>=35?"var(--amber)":"var(--red)"}const G=E||1,fe=(l/G*100).toFixed(1),me=(M/G*100).toFixed(1),ue=($/G*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${fe}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${me}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${ue}%;background:var(--text-dim);"></div>
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
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${f(W)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${f(F)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${f(P)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${f(B)}</span>
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
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${f(j)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${f(pe)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${ve.map(C=>`
                <div class="drv-row">
                    <span class="drv-row__name">${C.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${C.value}%;background:${_e(C)}"></div></div>
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
    `}function xe(e,t){const n=(e||"").toUpperCase(),a=Number(t.corp_general_workforce??0)+Number(t.corp_skilled_workforce??0)+Number(t.corp_innovative_workforce??0),s=[{label:"Reputation",value:Number(t.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:a||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(t.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(t.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(t.corp_market_share??5),change:0,nation:n,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(t.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(t.corp_regulatory_standing??50),change:0,nation:n,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(t.corp_political_influence??10),change:0,decay:!0,nation:n,max:100},{label:"Innovation",value:Number(t.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function i(o,c){if(!c||c>100)return"var(--text-primary)";const v=o/c*100;return v>=70?"var(--green)":v>=40?"var(--amber)":v>=20?"var(--orange, #d48a3c)":"var(--red)"}function d(o){const c=parseFloat(o),v=c>0?"var(--green)":c<0?"var(--red)":"var(--text-dim)",u=c>0?"▲":c<0?"▼":"–";return`<div class="stat-item__change">
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
                    ${o.nation?'<span class="stat-item__nation">'+_(o.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${c?i(o.value,o.max):"var(--text-primary)"}">${typeof o.value=="number"?o.value.toLocaleString():o.value}</span>
                    ${c?'<span class="stat-item__max">/100</span>':""}
                    ${d(o.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=r}async function $e(e,t,n,a){const s=(t||"UNKNOWN").toUpperCase();let i=[];if(n?.id){const{data:l}=await p.from("corp_properties").select("*").eq("faction_id",n.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});i=l||[]}const d={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let r=0,o=0;const c=Number(n?.corp_general_workforce??0)+Number(n?.corp_skilled_workforce??0)+Number(n?.corp_innovative_workforce??0),v=500,u=v+i.reduce((l,M)=>l+Number(M.capacity||0),0),m=u>0?Math.round(c*(v/u)):c,b=5e7,h=1+(O(e,"inflation")-50)/100*.3,S=.8+O(e,"stability")/100*.4,y=Math.round(b*h*S),w=Math.round(y*.005);r+=y,o+=w;let x=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${_(s)} · Headquarters</div>
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
    </div>`,L=m;for(const l of i){const M=d[l.style]||d.Basic;r+=Number(l.purchase_price||0),o+=Number(l.monthly_maintenance||0);const E=l.condition>=75?"var(--green)":l.condition>=50?"var(--amber)":"var(--orange)",k=Number(l.capacity||0),I=u>0?Math.min(c-L,Math.round(c*(k/u))):0;L+=I,x+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${_(l.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${_(l.city||s)} · ${(l.type||"").replace(/_/g," ")} · <span style="color:${M.color}">${(l.style||"Basic").toUpperCase()}</span></div>
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
            ${l.refurbish_until_tick&&l.refurbish_until_tick>(a?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${l.refurbish_until_tick-(a?.current_tick||0)} tick${l.refurbish_until_tick-(a?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${l.id}','${_(l.name).replace(/'/g,"\\'")}',${l.purchase_price||0},${l.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${l.id}','${_(l.name).replace(/'/g,"\\'")}',${l.condition},${k})">REFURBISH</button>
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
    `,{propertyValue:r,propertyMaintenance:o}}function ke(e,t,n,a,s){(t||"UNKNOWN").toUpperCase();const i=n.corp_company_type||"Private",d=Number(n.corp_cash_reserves)||0,r=s?.propertyValue||0,o=0,c=0,v=d+r+o+c,u=Number(n.corp_loans)||0,b=a?.monthlyWages||0,h=0,S=u+b+h,y=v-S,x=Math.round(y*(1+.3)),L=x-y,$=L>0;document.getElementById("val-type-badge").textContent=i.toUpperCase();function l(M,E,k={}){const I=k.indent?"val-line val-line--indent":"val-line",R=k.bold?"val-line__label val-line__label--bold":"val-line__label",P=k.bold?"val-line__value val-line__value--bold":"val-line__value",T=k.color||(k.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${I}"><span class="${R}">${M}</span><span class="${P}" style="color:${T}">${f(E)}</span></div>`}document.getElementById("val-body").innerHTML=`
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
                <span class="val-market__gap-value" style="color:${$?"var(--green)":"var(--red)"};">${$?"+":""}${f(L)}</span>
            </div>
            <div class="val-market__note">${$?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let K=null,z=null;function Ce(){z&&clearInterval(z),z=setInterval(ae,1e3),ae()}function ae(){const e=document.getElementById("tick-countdown");if(!e||!K){e&&(e.textContent="—");return}const t=K-Date.now();if(t<=0){e.textContent="Tick due...",clearInterval(z);return}const n=Math.floor(t/36e5),a=Math.floor(t%36e5/6e4),s=Math.floor(t%6e4/1e3);e.textContent=n+"h "+a+"m "+s+"s"}function Ee(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}async function Ie(){const e=document.getElementById("slogan-input"),t=document.getElementById("slogan-hint"),n=document.getElementById("slogan-save-btn"),a=(e.value||"").trim().slice(0,60);if(a.length===0){t.textContent="Slogan cannot be empty.",t.className="slogan-hint slogan-hint--error";return}n.disabled=!0,n.textContent="...",t.textContent="";try{const{error:s}=await p.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(s)throw s;document.getElementById("id-slogan").textContent='"'+a+'"',t.textContent="Slogan saved! Next change in 120 ticks.",t.className="slogan-hint slogan-hint--ok",n.textContent="Save"}catch(s){console.error("Slogan save failed:",s),t.textContent="Failed to save slogan.",t.className="slogan-hint slogan-hint--error",n.disabled=!1,n.textContent="Save"}}async function Me(){await p.auth.signOut(),window.location.href="login.html"}function Se(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function Te(e,t){const n=document.getElementById("corp-faction-dropdown");n&&n.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),t==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const t=document.getElementById("faction-switcher"),n=document.getElementById("corp-faction-dropdown");n&&t&&!t.contains(e.target)&&n.classList.remove("open")});window.doLogout=Me;window.toggleTheme=Ee;window.saveSlogan=Ie;window.toggleCorpDropdown=Se;window.switchToFaction=Te;let Y=!1;async function Ne(){if(Y){console.warn("Dissolve already in progress");return}const{data:{user:e}}=await p.auth.getUser();if(!e){alert("Not logged in.");return}const t=sessionStorage.getItem("active_faction_id");if(!t){alert("No active faction selected.");return}const{data:n,error:a}=await p.from("factions").select("*").eq("id",t).eq("faction_type","corporation").is("abandoned_at",null).single();if(a||!n){alert("No active corporation found. It may have already been dissolved."),console.error("Dissolve lookup failed:",a?.message,"factionId:",t);return}const i=n.faction_name||"this corporation";if(!confirm("DISSOLVE "+i.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all properties, equipment, and inventory
• Remove all cash reserves
• Outstanding debts and active projects will remain

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+i+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}Y=!0;const r=document.getElementById("dissolve-btn");r&&(r.disabled=!0,r.textContent="DISSOLVING...",r.style.opacity="0.5");try{async function o(b){const{error:h}=await b;if(h)throw h}await o(p.from("contract_bids").delete().eq("faction_id",t)),await o(p.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",t).in("status",["open","bidding"])),await o(p.from("corp_equipment_deliveries").delete().eq("faction_id",t)),await o(p.from("corp_equipment").delete().eq("faction_id",t)),await o(p.from("corp_properties").delete().eq("faction_id",t)),await p.from("corp_material_inventory").delete().eq("faction_id",t),await p.from("corp_warehouse").delete().eq("faction_id",t),await o(p.from("factions").update({abandoned_at:new Date().toISOString(),corp_cash_reserves:0,corp_general_workforce:0,corp_skilled_workforce:0,corp_innovative_workforce:0,action_points:0}).eq("id",t)),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:c,error:v}=await p.from("factions").select("id, faction_type").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`).is("abandoned_at",null);v&&console.warn("Failed to check remaining factions:",v.message);const u=(c||[]).find(b=>b.faction_type==="party"),m=(c||[]).find(b=>b.faction_type==="corporation");u?(sessionStorage.setItem("active_faction_id",u.id),alert(i+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):m?(sessionStorage.setItem("active_faction_id",m.id),alert(i+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(i+` has been dissolved.

You have no remaining factions.`),window.location.href="faction-select.html")}catch(o){alert("Dissolution failed: "+(o.message||o)+`

Please try again or contact support.`),r&&(r.disabled=!1,r.textContent="Dissolve Corporation",r.style.opacity="1")}finally{Y=!1}}window.dissolveCorporation=Ne;let U=!1;function Le(e,t,n,a){if(U)return;const s=window._nationStats,d=1+(O(s,"inflation")-50)/100*.3,r=Math.max(.1,a/100),o=Math.round(n*d*r),c=document.getElementById("prop-modal-overlay"),v=document.getElementById("prop-modal-content");v.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${_(t)}</div>
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
                <span style="color:${a>=75?"var(--green)":a>=50?"var(--amber)":"var(--red)"};">${a}%</span>
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
    `,c.style.display="flex"}async function Re(e,t){if(U)return;U=!0;const n=document.getElementById("prop-sell-confirm");n&&(n.disabled=!0,n.textContent="Selling...");try{const a=window._corpFactionId;if(!a)throw new Error("No faction");const{error:s}=await p.from("corp_properties").update({is_active:!1}).eq("id",e).eq("faction_id",a);if(s)throw new Error("Failed to sell property: "+s.message);const{data:i}=await p.from("factions").select("corp_cash_reserves").eq("id",a).single(),d=Number(i?.corp_cash_reserves??0),{error:r}=await p.from("factions").update({corp_cash_reserves:d+t}).eq("id",a);r&&console.error("[Property] Failed to credit cash:",r.message),X(),alert("Property sold for "+f(t)+". Cash credited."),location.reload()}catch(a){alert("Sale failed: "+a.message)}finally{U=!1,n&&(n.disabled=!1,n.textContent="Confirm Sale")}}let V=!1;function Pe(e,t,n,a){if(V)return;const s=window._nationStats,i=window._factionData,r=1+(O(s,"inflation")-50)/100*.3,o=Math.round(2e6*(a/1e3)),c=Math.round(o*r),v=Math.max(50,Math.round(a*.1)),u=Number(i?.corp_general_workforce??0),m=u>=v,h=Number(i?.corp_cash_reserves??0)>=c,S=document.getElementById("prop-modal-overlay"),y=document.getElementById("prop-modal-content"),w=m&&h&&n<100;let x="";n>=100?x='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property is already at 100% condition.</div>':h?m||(x='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient general workforce (need '+v.toLocaleString()+", have "+u.toLocaleString()+").</div>"):x='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>',y.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${_(t)} — Current Condition: ${n}%</div>
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
    `,S.style.display="flex"}async function Ae(e,t,n){if(V)return;V=!0;const a=document.getElementById("prop-refurb-confirm");a&&(a.disabled=!0,a.textContent="Starting...");try{const s=window._corpFactionId,i=window._currentTick;if(!s)throw new Error("No faction");const d=Math.floor(Math.random()*6)+1,o=94+(Math.floor(Math.random()*6)+1),c=i+d,{data:v}=await p.from("factions").select("corp_cash_reserves").eq("id",s).single(),u=Number(v?.corp_cash_reserves??0);if(u<t)throw new Error("Insufficient cash");const{error:m}=await p.from("factions").update({corp_cash_reserves:u-t}).eq("id",s);if(m)throw new Error("Failed to deduct cost: "+m.message);const{error:b}=await p.from("corp_properties").update({refurbish_until_tick:c,refurbish_condition:o}).eq("id",e).eq("faction_id",s);if(b)throw new Error("Failed to start refurbishment: "+b.message);X(),alert("Refurbishment started! Duration: "+d+" tick"+(d!==1?"s":"")+". Condition will be restored to "+Math.min(100,o)+"% when complete."),location.reload()}catch(s){alert("Refurbishment failed: "+s.message)}finally{V=!1,a&&(a.disabled=!1,a.textContent="Begin Refurbishment")}}function X(){const e=document.getElementById("prop-modal-overlay");e&&(e.style.display="none")}window.showSellModal=Le;window.confirmSellProperty=Re;window.showRefurbishModal=Pe;window.confirmRefurbish=Ae;window.closePropModal=X;const re={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},ie={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},Be={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let oe="corporate",q=null;function De(e){return e?e.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase()):""}function Q(e,t){if(!e)return"<em>Unknown</em>";const n=_(e);return t?`<span style="color:${t.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${n}</span>`:`<strong>${n}</strong>`}function Z(e,t,n){const a=e.factions?.nation_id===(e.nation_id||t),s=e.proposer_name||(a?e.factions?.faction_name:null)||"A former party",i=e.proposer_color||(a?e.factions?.party_color:null);return{fired_at_tick:e.proposed_tick,event_name:e.bill_name,_desc_html:`${Q(s,i)} proposed "${_(e.bill_name)}"`,category:"bill",_synthetic:!0,...n}}function J(e,t){const n=e.leader_first_name&&e.leader_last_name?`${e.leader_first_name} ${e.leader_last_name}`:null,a=n?` led by <strong>${_(n)}</strong>`:"";return{fired_at_tick:0,event_name:e.faction_name,_desc_html:`${Q(e.faction_name,e.party_color)} founded${a}`,category:"new_party",_synthetic:!0,_created_at:e.created_at,...t}}function ee(e,t){const n=Be[e.tier]||`Tier ${e.tier}`,a=e.demand_label?` demanding "${_(e.demand_label)}"`:"",s=e.status==="crisis_active",i=e.tier>=6?"#e74c3c":e.tier>=4?"#f39c12":"",d=i?`<span style="color:${i};font-weight:600">${_(n)}</span>`:`<strong>${_(n)}</strong>`;return{fired_at_tick:e.tick_resolved||e.tick_called,event_name:n,_desc_html:`${Q(e.factions?.faction_name,e.factions?.party_color)} organised a protest${a} — ${d}${s?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...t}}function te(e,t,n,a,s){return[...e.map(i=>({...i,_synthetic:!1})),...t,...n,...a].sort((i,d)=>{const r=(d.fired_at_tick||0)-(i.fired_at_tick||0);if(r!==0)return r;const o=i._created_at||i.created_at||"",c=d._created_at||d.created_at||"";return c>o?1:c<o?-1:0}).slice(0,s)}function le(e){if(e._synthetic&&e._desc_html)return e._desc_html;const t=e.description_chosen||e.description_used||"",n=De(e.event_name),a=n?`<strong>${_(n)}</strong>`:"",s=t?_(t):"";return a&&s?`${a} — ${s}`:s||a||"Event"}function ce(e){return e.map(t=>{const n=se(t.fired_at_tick),a=re[(t.category||"").toLowerCase()]||ie;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${_(n)}</span>
            <span class="corp-ev-icon" style="color:${a.color}">${a.icon}</span>
            <span class="corp-ev-text">${le(t)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}const ne=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function qe(e){let t=0;for(let n=0;n<e.length;n++)t=(t<<5)-t+e.charCodeAt(n)|0;return ne[Math.abs(t)%ne.length]}function Fe(e){return e.map(t=>{const n=se(t.fired_at_tick),a=re[(t.category||"").toLowerCase()]||ie,s=t.nations?.name||"Unknown",i=t.nations?.nation_profiles,d=Array.isArray(i)?i[0]?.flag_url:i?.flag_url,r=qe(s),o=d?`<img src="${_(d)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${_(n)}</span>
                <span class="corp-ev-nation-badge" style="color:${r.color};background:${r.bg};border-color:${r.border};">${o}${_(s)}</span>
            </span>
            <span class="corp-ev-text">${le(t)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}async function de(){const e=document.getElementById("corp-events-list");e&&(e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events yet.<br>Events will appear here as your company grows.</div>')}async function Oe(){const e=document.getElementById("corp-events-list");if(!e||!q)return;const{nationId:t}=q;if(!t){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[n,a,s,i]=await Promise.all([p.from("event_log").select("*").eq("nation_id",t).in("category",["political","bill","new_party","protest"]).order("fired_at_tick",{ascending:!1}).limit(40),p.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",t).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",t).order("created_at",{ascending:!1}).limit(15),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",t).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(n.error)throw n.error;const d=n.data||[],r=te(d,(a.data||[]).map(o=>Z(o,t)),(s.data||[]).map(o=>J(o)),(i.data||[]).map(o=>ee(o)),50);if(r.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No political events recorded yet.</div>';return}e.innerHTML=ce(r)}catch(n){console.error("Political events error:",n),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function We(){const e=document.getElementById("corp-events-list");if(!e||!q)return;const{nationId:t}=q;if(!t){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[n,a,s,i]=await Promise.all([p.from("event_log").select("*").eq("nation_id",t).order("fired_at_tick",{ascending:!1}).limit(50),p.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",t).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",t).order("created_at",{ascending:!1}).limit(20),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",t).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(n.error)throw n.error;const d=n.data||[],r=te(d,(a.data||[]).map(o=>Z(o,t)),(s.data||[]).map(o=>J(o)),(i.data||[]).map(o=>ee(o)),60);if(r.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>';return}e.innerHTML=ce(r)}catch(n){console.error("Nation events error:",n),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function He(){const e=document.getElementById("corp-events-list");if(!e||!q)return;const{nationId:t}=q;if(!t){e.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}e.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[n,a,s,i]=await Promise.all([p.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",t).order("fired_at_tick",{ascending:!1}).limit(60),p.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",t).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",t).order("created_at",{ascending:!1}).limit(15),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",t).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(n.error)throw n.error;const d=n.data||[],r=te(d,(a.data||[]).map(o=>Z(o,null,{nations:o.nations})),(s.data||[]).map(o=>J(o,{nations:o.nations})),(i.data||[]).map(o=>ee(o,{nations:o.nations})),60);if(r.length===0){e.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>';return}e.innerHTML=Fe(r)}catch(n){console.error("World events error:",n),e.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function ze(e){e!==oe&&(oe=e,document.querySelectorAll(".corp-events-tab").forEach(t=>{t.classList.toggle("active",t.dataset.tab===e)}),e==="corporate"?de():e==="political"?Oe():e==="nation"?We():e==="world"&&He())}window.switchCorpEventsTab=ze;ye();
