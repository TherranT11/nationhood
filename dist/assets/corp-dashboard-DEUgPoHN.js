import{_}from"./supabase-client-BXEzLDpS.js";import{e as m}from"./utils-C2W-HleY.js";import{initMessaging as J}from"./messaging-B5Fng3EZ.js";import{c as X}from"./equipment-DsuDdEne.js";let W=[];function d(a){return Math.abs(a)>=1e6?"$"+(a/1e6).toFixed(2)+"M":Math.abs(a)>=1e3?"$"+(a/1e3).toFixed(1)+"k":"$"+Math.round(a).toLocaleString()}function H(a,s){return Number(a?.[s]??50)}async function Z(){const{data:{user:a}}=await _.auth.getUser();if(!a){window.location.href="login.html";return}const{data:s}=await _.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);W=(s||[]).filter(v=>v.nation_id&&!v.abandoned_at);const o=sessionStorage.getItem("active_faction_id");let t=W.find(v=>v.id===o)||W.find(v=>v.faction_type==="corporation")||W[0];if(!t){console.error("Corp dashboard: no factions found"),await _.auth.signOut(),window.location.href="login.html";return}if(t.faction_type!=="corporation"){window.location.href="dashboard.html";return}let r=t.nation||"",p=null;const[n,l]=await Promise.all([t.nation_id?_.from("nations").select("*").eq("id",t.nation_id).single():Promise.resolve({data:null}),_.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);n.error&&console.warn("Nation load failed:",n.error.message),n.data&&(r=n.data.name,p=n.data),l.error&&console.warn("Shard load failed:",l.error.message);const e=l.data,i=t.corp_ticker||t.abbreviation||"";if(document.getElementById("corp-logo").textContent=i.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=t.faction_name||"Unnamed Corp",e){if(document.getElementById("game-date").textContent=e.current_date||"—",document.getElementById("tick-number").textContent=e.current_tick||"—",e.next_tick_at){const T=(Number(e.tick_interval_hours)||8)*36e5,P=new Date(e.next_tick_at).getTime(),F=P-T+T/2;j=new Date(F>Date.now()?F:P+T/2),ot()}const v=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");v&&(v.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(i?"["+i+"]":t.faction_name||"Corp")+" ▾";const w=document.getElementById("topbar-cash");if(w){const v=Number(t.corp_cash_reserves??0),T=v>=1e9?"$"+(v/1e9).toFixed(1)+"B":v>=1e6?"$"+(v/1e6).toFixed(1)+"M":"$"+Math.round(v/1e3)+"k";w.textContent="CASH: "+T}const $=t.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+$+" AP</span>";const h=document.getElementById("corp-faction-dropdown");if(h){let v="";for(const E of W){const F=E.id===t.id,z=E.faction_type==="corporation"?"CORP":"PARTY",R=E.faction_type==="corporation"?"var(--teal)":"var(--amber)";v+=`<div class="corp-dd-item${F?" active":""}" onclick="switchToFaction('${E.id}', '${E.faction_type}')">
                <span class="corp-dd-type" style="color:${R}">${z}</span>
                <span class="corp-dd-name">${m(E.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${m(E.abbreviation||"—")}]</span>
            </div>`}W.some(E=>E.faction_type==="corporation")||(v+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),W.some(E=>E.faction_type==="party")||(v+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),h.innerHTML=v}document.getElementById("id-type-badge").textContent=t.corp_company_type||"—",document.getElementById("id-logo").textContent=i.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=t.faction_name||"Unnamed Corp";const u=t.party_description||"";document.getElementById("id-slogan").textContent=u?'"'+u+'"':'"--"';const g=e?.current_date?e.current_date.replace(/.*,\s*/,""):"—",k=t.leader_first_name&&t.leader_last_name?t.leader_first_name+" "+t.leader_last_name+(t.leader_age?" ("+t.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${m(g)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${m(r||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${m(t.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${m(t.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${m(k)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${m(t.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${m(i)}</span>
        </div>
    `;const c=t.last_rename_tick||0,M=e?.current_tick||0,S=Math.max(0,c+120-M),I=S<=0,f=document.getElementById("slogan-editor");f.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${m(u)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${I?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${I?"60 characters max. 120 tick cooldown after change.":S+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=t.id,window._currentTick=M;const B=tt(p,r,t);at(r);const L=await nt(p,r,t);let b=0;if(t?.id){const{data:v,error:T}=await _.from("corp_equipment").select("equipment_key, owned").eq("faction_id",t.id);T||(b=X(v||[]))}et(p,e,B,t,L.propertyMaintenance||0,b),st(p,r,t,B,L),J(t,p,e);const N=60,A=t.founded_tick||0,q=e?.current_tick||0,x=Math.max(0,N-(q-A)),O=document.getElementById("dissolve-btn"),D=document.getElementById("dissolve-info");O&&(x>0?(O.disabled=!0,O.style.opacity="0.4",O.style.cursor="not-allowed",D&&(D.innerHTML=`<span style="color:#a44;">Available in ${x} tick${x!==1?"s":""}</span><br>Corporations must operate for 60 ticks before dissolution.`)):(O.disabled=!1,O.style.opacity="1",O.style.cursor="pointer")),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function tt(a,s,o){const t=x=>H(a,x),r=(s||"UNKNOWN").toUpperCase(),p=Number(o?.corp_general_workforce??2250),n=Number(o?.corp_skilled_workforce??600),l=Number(o?.corp_innovative_workforce??150),e=p+n+l,i=2,w=3,$=6,h=t("minimum_wage"),u=h/100*48e3,g=t("inflation"),k=t("standard_of_living"),c=1+(g-50)/100*.5,M=1+(k-50)/100*.5,C=x=>Math.round(u*x*c*M),S=C(i),I=C(w),f=C($),B=p*S,L=n*I,b=l*f,N=B+L+b;function A(x){return"$"+Math.round(x).toLocaleString()+"/yr"}const q=`${c.toFixed(2)} &times; ${M.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=e.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${m(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${p.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${i}.0 &times; ${q})</span>
                <span class="wf-tier__value">${A(S)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(B)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${m(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${n.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${w}.0 &times; ${q})</span>
                <span class="wf-tier__value">${A(I)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(L)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${m(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${$}.0 &times; ${q})</span>
                <span class="wf-tier__value">${A(f)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(b)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${m(r)})</span>
                <span class="wf-tier__value">${h}/100 → ${A(u)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${c.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${M.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${e.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${d(N)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${d(N/12)}</span>
            </div>
        </div>
    `,{totalWages:N,generalTotal:B,skilledTotal:L,innovativeTotal:b,monthlyWages:Math.round(N/12)}}function et(a,s,o,t,r,p){const n=s?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+n;const l=5e7,e=y=>H(a,y),i=1+(e("gdp_growth")-50)/100*.4,w=1+(e("urbanization")-50)/100*.3,$=1+(e("population_growth")-50)/100*.2,h=1+(e("standard_of_living")-50)/100*.15,u=1+(50-e("physical_infrastructure"))/100*.1,g=1-Math.max(0,e("inflation")-50)/100*.1,k=1-Math.max(0,e("interest_rates")-50)/100*.1,c=i*w*$*h*u*g*k,M=Math.round(l*c),C=Math.round(M/12),S=0,I=0,f=S+I+C,B=o?.totalWages||0,L=Math.round(B/12),b=0,N=0,A=r||0,q=p||0,x=Number(t?.corp_loans)||0,O=.05,D=x>0?Math.round(x*(O/12)/(1-Math.pow(1+O/12,-120))):0,v=L+b+A+q+D+N,T=f-v,P=Number(t?.corp_cash_reserves??0),E=x,F=[{stat:"gdp_growth",value:e("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:e("urbanization"),weight:"0.3"},{stat:"population_growth",value:e("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:e("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:e("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:e("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:e("interest_rates"),weight:"-0.1",neg:!0}];function z(y){return y.neg?y.value>50?"var(--red)":"var(--green)":y.note?y.value<50?"var(--green)":"var(--red)":y.value>=50?"var(--green)":y.value>=35?"var(--amber)":"var(--red)"}const R=f||1,G=(S/R*100).toFixed(1),K=(I/R*100).toFixed(1),Q=(C/R*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
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
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${d(S)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${d(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${d(C)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${d(f)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${d(L)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${d(b)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${d(A)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${d(q)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${d(D)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${d(N)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${d(v)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${T>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${T>=0?"var(--green)":"var(--red)"}">${d(T)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${d(P)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${d(E)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${F.map(y=>`
                <div class="drv-row">
                    <span class="drv-row__name">${y.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${y.value}%;background:${z(y)}"></div></div>
                    <span class="drv-row__val">${y.value}</span>
                    <span class="drv-row__wt">&times;${y.weight}</span>
                    ${y.note?'<span class="drv-row__note">'+y.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${c.toFixed(2)}</span>
            </div>
        </div>
    `}function at(a){const s=a.toUpperCase(),o=[{label:"Reputation",value:65,change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:3e3,change:0,section:"Core"},{label:"Workforce Skill",value:50,change:0,decay:!0,max:100},{label:"Operational Efficiency",value:50,change:0,decay:!0,max:100},{label:"Market Share",value:5,change:0,nation:s,max:100,section:"Market & Financials"},{label:"Credit Rating",value:50,change:0,max:100},{label:"Regulatory Standing",value:50,change:0,nation:s,max:100,section:"Political Standing"},{label:"Political Influence",value:10,change:0,decay:!0,nation:s,max:100},{label:"Innovation",value:20,change:0,decay:!0,max:100,section:"Innovation"}];function t(n,l){if(!l||l>100)return"var(--text-primary)";const e=n/l*100;return e>=70?"var(--green)":e>=40?"var(--amber)":e>=20?"var(--orange, #d48a3c)":"var(--red)"}function r(n){const l=parseFloat(n),e=l>0?"var(--green)":l<0?"var(--red)":"var(--text-dim)",i=l>0?"▲":l<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${e}">${i}</span>
            <span class="stat-item__delta" style="color:${e}">${Math.abs(l).toFixed(1)}</span>
        </div>`}let p="";for(const n of o){if(n.isHero){p+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${n.label}</span>
                            ${n.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${n.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${r(n.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${n.value}%"></div></div>
                </div>`;continue}n.section&&(p+=`<div class="stats-section"><span class="stats-section__label">${n.section}</span></div>`);const l=n.max&&n.max<=100;p+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${n.label}</span>
                        ${n.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${n.nation?'<span class="stat-item__nation">'+m(n.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${l?t(n.value,n.max):"var(--text-primary)"}">${typeof n.value=="number"?n.value.toLocaleString():n.value}</span>
                    ${l?'<span class="stat-item__max">/100</span>':""}
                    ${r(n.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=p}async function nt(a,s,o,t){const r=(s||"UNKNOWN").toUpperCase();let p=[];if(o?.id){const{data:c}=await _.from("corp_properties").select("*").eq("faction_id",o.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});p=c||[]}const n={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,e=0;const i=5e7,w=1+(H(a,"inflation")-50)/100*.3,$=.8+H(a,"stability")/100*.4,h=Math.round(i*w*$),u=Math.round(h*.005);l+=h,e+=u;let g=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${m(r)} · Headquarters</div>
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
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${d(h)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${d(u)}</div>
            </div>
        </div>
    </div>`;for(const c of p){const M=n[c.style]||n.Basic;l+=Number(c.purchase_price||0),e+=Number(c.monthly_maintenance||0);const C=c.condition>=75?"var(--green)":c.condition>=50?"var(--amber)":"var(--orange)";g+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${m(c.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${m(c.city||r)} · ${(c.type||"").replace(/_/g," ")} · <span style="color:${M.color}">${(c.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge">OWNED</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${(c.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${d(c.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${d(c.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${C}">${c.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${c.condition}%;height:100%;background:${C};"></div></div>
        </div>`}const k=document.getElementById("prop-count");return k&&(k.textContent=p.length+1+" ASSET"+(p.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${g}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${d(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${d(e)}/mo</span>
            </div>
        </div>
    `,{propertyValue:l,propertyMaintenance:e}}function st(a,s,o,t,r){(s||"UNKNOWN").toUpperCase();const p=o.corp_company_type||"Private",n=Number(o.corp_cash_reserves)||0,l=r?.propertyValue||0,e=0,i=0,w=n+l+e+i,$=Number(o.corp_loans)||0,u=t?.monthlyWages||0,g=0,k=$+u+g,c=w-k,C=Math.round(c*(1+.3)),S=C-c,I=S>0;document.getElementById("val-type-badge").textContent=p.toUpperCase();function f(B,L,b={}){const N=b.indent?"val-line val-line--indent":"val-line",A=b.bold?"val-line__label val-line__label--bold":"val-line__label",q=b.bold?"val-line__value val-line__value--bold":"val-line__value",x=b.color||(b.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${N}"><span class="${A}">${B}</span><span class="${q}" style="color:${x}">${d(L)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${f("Cash & Reserves",n,{indent:!0})}
        ${f("Property",l,{indent:!0})}
        ${f("Equipment",e,{indent:!0})}
        ${f("Active Contracts",i,{indent:!0})}
        ${f("Total Assets",w,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${f("Outstanding Loans",$,{indent:!0})}
        ${f("Accounts Payable",u,{indent:!0})}
        ${f("Pending Project Costs",g,{indent:!0})}
        ${f("Total Liabilities",k,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${c>=0?"var(--green)":"var(--red)"};">${d(c)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${d(C)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${I?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${I?"var(--green)":"var(--red)"};">${I?"+":""}${d(S)}</span>
            </div>
            <div class="val-market__note">${I?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let j=null,U=null;function ot(){U&&clearInterval(U),U=setInterval(Y,1e3),Y()}function Y(){const a=document.getElementById("tick-countdown");if(!a||!j){a&&(a.textContent="—");return}const s=j-Date.now();if(s<=0){a.textContent="Tick due...",clearInterval(U);return}const o=Math.floor(s/36e5),t=Math.floor(s%36e5/6e4),r=Math.floor(s%6e4/1e3);a.textContent=o+"h "+t+"m "+r+"s"}function it(){document.body.classList.toggle("light-mode");const a=document.getElementById("theme-toggle");a.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const a=document.getElementById("theme-toggle");a&&(a.textContent="Dark")}async function lt(){const a=document.getElementById("slogan-input"),s=document.getElementById("slogan-hint"),o=document.getElementById("slogan-save-btn"),t=(a.value||"").trim().slice(0,60);if(t.length===0){s.textContent="Slogan cannot be empty.",s.className="slogan-hint slogan-hint--error";return}o.disabled=!0,o.textContent="...",s.textContent="";try{const{error:r}=await _.from("factions").update({party_description:t,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(r)throw r;document.getElementById("id-slogan").textContent='"'+t+'"',s.textContent="Slogan saved! Next change in 120 ticks.",s.className="slogan-hint slogan-hint--ok",o.textContent="Save"}catch(r){console.error("Slogan save failed:",r),s.textContent="Failed to save slogan.",s.className="slogan-hint slogan-hint--error",o.disabled=!1,o.textContent="Save"}}async function rt(){await _.auth.signOut(),window.location.href="login.html"}function ct(){const a=document.getElementById("corp-faction-dropdown");a&&a.classList.toggle("open")}function dt(a,s){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",a),s==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",a=>{const s=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&s&&!s.contains(a.target)&&o.classList.remove("open")});window.doLogout=rt;window.toggleTheme=it;window.saveSlogan=lt;window.toggleCorpDropdown=ct;window.switchToFaction=dt;let V=!1;async function pt(){if(V)return;const{data:{user:a}}=await _.auth.getUser();if(!a)return;const s=sessionStorage.getItem("active_faction_id");if(!s)return;const o=W.find(i=>i.id===s&&i.faction_type==="corporation");if(!o){alert("No active corporation found.");return}const t=o.faction_name||"this corporation",{data:r}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),n=(r?.current_tick||0)-(o.founded_tick||0);if(n<60){alert(`Corporation must be at least 60 ticks old to dissolve.

`+(60-n)+" ticks remaining.");return}if(!confirm("DISSOLVE "+t.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all properties, equipment, and inventory
• Remove all cash reserves
• Outstanding debts and active projects will remain

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+t+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}V=!0;const e=document.getElementById("dissolve-btn");e&&(e.disabled=!0,e.textContent="DISSOLVING...",e.style.opacity="0.5");try{async function i(g){const{error:k}=await g;if(k)throw k}await i(_.from("contract_bids").delete().eq("faction_id",s)),await i(_.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",s).in("status",["open","bidding"])),await i(_.from("corp_equipment_deliveries").delete().eq("faction_id",s)),await i(_.from("corp_equipment").delete().eq("faction_id",s)),await i(_.from("corp_properties").delete().eq("faction_id",s)),await i(_.from("corp_material_inventory").delete().eq("faction_id",s)),await i(_.from("corp_warehouse").delete().eq("faction_id",s)),await i(_.from("factions").update({abandoned_at:new Date().toISOString(),corp_cash_reserves:0,corp_employees:0,action_points:0}).eq("id",s)),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:w,error:$}=await _.from("factions").select("id, faction_type").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`).is("abandoned_at",null);$&&console.warn("Failed to check remaining factions:",$.message);const h=(w||[]).find(g=>g.faction_type==="party"),u=(w||[]).find(g=>g.faction_type==="corporation");h?(sessionStorage.setItem("active_faction_id",h.id),alert(t+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):u?(sessionStorage.setItem("active_faction_id",u.id),alert(t+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(t+` has been dissolved.

You have no remaining factions.`),window.location.href="select-nation.html")}catch(i){alert("Dissolution failed: "+(i.message||i)+`

Please try again or contact support.`),e&&(e.disabled=!1,e.textContent="Dissolve Corporation",e.style.opacity="1")}finally{V=!1}}window.dissolveCorporation=pt;Z();
