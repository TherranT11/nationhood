import{_ as f}from"./supabase-client-BXEzLDpS.js";import{e as g}from"./utils-C2W-HleY.js";import{initMessaging as J}from"./messaging-B5Fng3EZ.js";import{c as X}from"./equipment-DsuDdEne.js";let A=[];function p(n){return Math.abs(n)>=1e6?"$"+(n/1e6).toFixed(2)+"M":Math.abs(n)>=1e3?"$"+(n/1e3).toFixed(1)+"k":"$"+Math.round(n).toLocaleString()}function O(n,s){return Number(n?.[s]??50)}async function Z(){const{data:{user:n}}=await f.auth.getUser();if(!n){window.location.href="login.html";return}const{data:s}=await f.from("factions").select("*").or(`id.eq.${n.id},linked_user_id.eq.${n.id}`);A=(s||[]).filter(r=>r.nation_id&&!r.abandoned_at);const o=sessionStorage.getItem("active_faction_id");let t=A.find(r=>r.id===o)||A.find(r=>r.faction_type==="corporation")||A[0];if(!t){console.error("Corp dashboard: no factions found"),await f.auth.signOut(),window.location.href="login.html";return}if(t.faction_type!=="corporation"){window.location.href="dashboard.html";return}let d=t.nation||"",i=null;const[e,l]=await Promise.all([t.nation_id?f.from("nations").select("*").eq("id",t.nation_id).single():Promise.resolve({data:null}),f.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);e.error&&console.warn("Nation load failed:",e.error.message),e.data&&(d=e.data.name,i=e.data),l.error&&console.warn("Shard load failed:",l.error.message);const a=l.data,_=t.corp_ticker||t.abbreviation||"";if(document.getElementById("corp-logo").textContent=_.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=t.faction_name||"Unnamed Corp",a){if(document.getElementById("game-date").textContent=a.current_date||"—",document.getElementById("tick-number").textContent=a.current_tick||"—",a.next_tick_at){const u=(Number(a.tick_interval_hours)||8)*36e5,E=new Date(a.next_tick_at).getTime(),B=E-u+u/2;U=new Date(B>Date.now()?B:E+u/2),ot()}const r=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");r&&(r.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(_?"["+_+"]":t.faction_name||"Corp")+" ▾";const h=document.getElementById("topbar-cash");if(h){const r=Number(t.corp_cash_reserves??0),u=r>=1e9?"$"+(r/1e9).toFixed(1)+"B":r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k";h.textContent="CASH: "+u}const y=t.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+y+" AP</span>";const b=document.getElementById("corp-faction-dropdown");if(b){let r="";for(const v of A){const B=v.id===t.id,q=v.faction_type==="corporation"?"CORP":"PARTY",F=v.faction_type==="corporation"?"var(--teal)":"var(--amber)";r+=`<div class="corp-dd-item${B?" active":""}" onclick="switchToFaction('${v.id}', '${v.faction_type}')">
                <span class="corp-dd-type" style="color:${F}">${q}</span>
                <span class="corp-dd-name">${g(v.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${g(v.abbreviation||"—")}]</span>
            </div>`}A.some(v=>v.faction_type==="corporation")||(r+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),A.some(v=>v.faction_type==="party")||(r+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),b.innerHTML=r}document.getElementById("id-type-badge").textContent=t.corp_company_type||"—",document.getElementById("id-logo").textContent=_.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=t.faction_name||"Unnamed Corp";const $=t.party_description||"";document.getElementById("id-slogan").textContent=$?'"'+$+'"':'"--"';const S=a?.current_date?a.current_date.replace(/.*,\s*/,""):"—",M=t.leader_first_name&&t.leader_last_name?t.leader_first_name+" "+t.leader_last_name+(t.leader_age?" ("+t.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${g(S)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${g(d||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${g(t.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${g(t.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${g(M)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${g(t.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${g(_)}</span>
        </div>
    `;const c=t.last_rename_tick||0,T=a?.current_tick||0,I=Math.max(0,c+120-T),C=I<=0,m=document.getElementById("slogan-editor");m.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${g($)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${C?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${C?"60 characters max. 120 tick cooldown after change.":I+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=t.id,window._currentTick=T;const N=tt(i,d,t);at(d);const L=await nt(i,d,t);let x=0;if(t?.id){const{data:r,error:u}=await f.from("corp_equipment").select("equipment_key, owned").eq("faction_id",t.id);u||(x=X(r||[]))}et(i,a,N,t,L.propertyMaintenance||0,x),st(i,d,t,N,L),J(t,i,a),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function tt(n,s,o){const t=v=>O(n,v),d=(s||"UNKNOWN").toUpperCase(),i=Number(o?.corp_general_workforce??2250),e=Number(o?.corp_skilled_workforce??600),l=Number(o?.corp_innovative_workforce??150),a=i+e+l,_=2,h=3,y=6,b=t("minimum_wage"),$=b/100*48e3,S=t("inflation"),M=t("standard_of_living"),c=1+(S-50)/100*.5,T=1+(M-50)/100*.5,k=v=>Math.round($*v*c*T),I=k(_),C=k(h),m=k(y),N=i*I,L=e*C,x=l*m,r=N+L+x;function u(v){return"$"+Math.round(v).toLocaleString()+"/yr"}const E=`${c.toFixed(2)} &times; ${T.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=a.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${g(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${i.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${_}.0 &times; ${E})</span>
                <span class="wf-tier__value">${u(I)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${p(N)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${g(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${e.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${h}.0 &times; ${E})</span>
                <span class="wf-tier__value">${u(C)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${p(L)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${g(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${y}.0 &times; ${E})</span>
                <span class="wf-tier__value">${u(m)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${p(x)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${g(d)})</span>
                <span class="wf-tier__value">${b}/100 → ${u($)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${c.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${T.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${a.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${p(r)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${p(r/12)}</span>
            </div>
        </div>
    `,{totalWages:r,generalTotal:N,skilledTotal:L,innovativeTotal:x,monthlyWages:Math.round(r/12)}}function et(n,s,o,t,d,i){const e=s?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+e;const l=5e7,a=w=>O(n,w),_=1+(a("gdp_growth")-50)/100*.4,h=1+(a("urbanization")-50)/100*.3,y=1+(a("population_growth")-50)/100*.2,b=1+(a("standard_of_living")-50)/100*.15,$=1+(50-a("physical_infrastructure"))/100*.1,S=1-Math.max(0,a("inflation")-50)/100*.1,M=1-Math.max(0,a("interest_rates")-50)/100*.1,c=_*h*y*b*$*S*M,T=Math.round(l*c),k=Math.round(T/12),I=0,C=0,m=I+C+k,N=o?.totalWages||0,L=Math.round(N/12),x=0,r=0,u=d||0,E=i||0,v=Number(t?.corp_loans)||0,B=.05,q=v>0?Math.round(v*(B/12)/(1-Math.pow(1+B/12,-120))):0,F=L+x+u+E+q+r,P=m-F,H=Number(t?.corp_cash_reserves??0),V=v,j=[{stat:"gdp_growth",value:a("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:a("urbanization"),weight:"0.3"},{stat:"population_growth",value:a("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:a("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:a("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:a("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:a("interest_rates"),weight:"-0.1",neg:!0}];function Y(w){return w.neg?w.value>50?"var(--red)":"var(--green)":w.note?w.value<50?"var(--green)":"var(--red)":w.value>=50?"var(--green)":w.value>=35?"var(--amber)":"var(--red)"}const D=m||1,G=(I/D*100).toFixed(1),K=(C/D*100).toFixed(1),Q=(k/D*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
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
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${p(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${p(C)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${p(k)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${p(m)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${p(L)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${p(x)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${p(u)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${p(E)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${p(q)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${p(r)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${p(F)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${P>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${P>=0?"var(--green)":"var(--red)"}">${p(P)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${p(H)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${p(V)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${j.map(w=>`
                <div class="drv-row">
                    <span class="drv-row__name">${w.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${w.value}%;background:${Y(w)}"></div></div>
                    <span class="drv-row__val">${w.value}</span>
                    <span class="drv-row__wt">&times;${w.weight}</span>
                    ${w.note?'<span class="drv-row__note">'+w.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${c.toFixed(2)}</span>
            </div>
        </div>
    `}function at(n){const s=n.toUpperCase(),o=[{label:"Reputation",value:65,change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:3e3,change:0,section:"Core"},{label:"Workforce Skill",value:50,change:0,decay:!0,max:100},{label:"Operational Efficiency",value:50,change:0,decay:!0,max:100},{label:"Market Share",value:5,change:0,nation:s,max:100,section:"Market & Financials"},{label:"Credit Rating",value:50,change:0,max:100},{label:"Regulatory Standing",value:50,change:0,nation:s,max:100,section:"Political Standing"},{label:"Political Influence",value:10,change:0,decay:!0,nation:s,max:100},{label:"Innovation",value:20,change:0,decay:!0,max:100,section:"Innovation"}];function t(e,l){if(!l||l>100)return"var(--text-primary)";const a=e/l*100;return a>=70?"var(--green)":a>=40?"var(--amber)":a>=20?"var(--orange, #d48a3c)":"var(--red)"}function d(e){const l=parseFloat(e),a=l>0?"var(--green)":l<0?"var(--red)":"var(--text-dim)",_=l>0?"▲":l<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${a}">${_}</span>
            <span class="stat-item__delta" style="color:${a}">${Math.abs(l).toFixed(1)}</span>
        </div>`}let i="";for(const e of o){if(e.isHero){i+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${e.label}</span>
                            ${e.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${e.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${d(e.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${e.value}%"></div></div>
                </div>`;continue}e.section&&(i+=`<div class="stats-section"><span class="stats-section__label">${e.section}</span></div>`);const l=e.max&&e.max<=100;i+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${e.label}</span>
                        ${e.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${e.nation?'<span class="stat-item__nation">'+g(e.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${l?t(e.value,e.max):"var(--text-primary)"}">${typeof e.value=="number"?e.value.toLocaleString():e.value}</span>
                    ${l?'<span class="stat-item__max">/100</span>':""}
                    ${d(e.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=i}async function nt(n,s,o,t){const d=(s||"UNKNOWN").toUpperCase();let i=[];if(o?.id){const{data:c}=await f.from("corp_properties").select("*").eq("faction_id",o.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});i=c||[]}const e={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,a=0;const _=5e7,h=1+(O(n,"inflation")-50)/100*.3,y=.8+O(n,"stability")/100*.4,b=Math.round(_*h*y),$=Math.round(b*.005);l+=b,a+=$;let S=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${g(d)} · Headquarters</div>
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
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${p(b)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${p($)}</div>
            </div>
        </div>
    </div>`;for(const c of i){const T=e[c.style]||e.Basic;l+=Number(c.purchase_price||0),a+=Number(c.monthly_maintenance||0);const k=c.condition>=75?"var(--green)":c.condition>=50?"var(--amber)":"var(--orange)";S+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${g(c.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${g(c.city||d)} · ${(c.type||"").replace(/_/g," ")} · <span style="color:${T.color}">${(c.style||"Basic").toUpperCase()}</span></div>
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
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${p(c.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${p(c.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${k}">${c.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${c.condition}%;height:100%;background:${k};"></div></div>
        </div>`}const M=document.getElementById("prop-count");return M&&(M.textContent=i.length+1+" ASSET"+(i.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${S}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${p(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${p(a)}/mo</span>
            </div>
        </div>
    `,{propertyValue:l,propertyMaintenance:a}}function st(n,s,o,t,d){(s||"UNKNOWN").toUpperCase();const i=o.corp_company_type||"Private",e=Number(o.corp_cash_reserves)||0,l=d?.propertyValue||0,a=0,_=0,h=e+l+a+_,y=Number(o.corp_loans)||0,$=t?.monthlyWages||0,S=0,M=y+$+S,c=h-M,k=Math.round(c*(1+.3)),I=k-c,C=I>0;document.getElementById("val-type-badge").textContent=i.toUpperCase();function m(N,L,x={}){const r=x.indent?"val-line val-line--indent":"val-line",u=x.bold?"val-line__label val-line__label--bold":"val-line__label",E=x.bold?"val-line__value val-line__value--bold":"val-line__value",v=x.color||(x.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${r}"><span class="${u}">${N}</span><span class="${E}" style="color:${v}">${p(L)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${m("Cash & Reserves",e,{indent:!0})}
        ${m("Property",l,{indent:!0})}
        ${m("Equipment",a,{indent:!0})}
        ${m("Active Contracts",_,{indent:!0})}
        ${m("Total Assets",h,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${m("Outstanding Loans",y,{indent:!0})}
        ${m("Accounts Payable",$,{indent:!0})}
        ${m("Pending Project Costs",S,{indent:!0})}
        ${m("Total Liabilities",M,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${c>=0?"var(--green)":"var(--red)"};">${p(c)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${p(k)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${C?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${C?"var(--green)":"var(--red)"};">${C?"+":""}${p(I)}</span>
            </div>
            <div class="val-market__note">${C?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let U=null,W=null;function ot(){W&&clearInterval(W),W=setInterval(z,1e3),z()}function z(){const n=document.getElementById("tick-countdown");if(!n||!U){n&&(n.textContent="—");return}const s=U-Date.now();if(s<=0){n.textContent="Tick due...",clearInterval(W);return}const o=Math.floor(s/36e5),t=Math.floor(s%36e5/6e4),d=Math.floor(s%6e4/1e3);n.textContent=o+"h "+t+"m "+d+"s"}function it(){document.body.classList.toggle("light-mode");const n=document.getElementById("theme-toggle");n.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const n=document.getElementById("theme-toggle");n&&(n.textContent="Dark")}async function lt(){const n=document.getElementById("slogan-input"),s=document.getElementById("slogan-hint"),o=document.getElementById("slogan-save-btn"),t=(n.value||"").trim().slice(0,60);if(t.length===0){s.textContent="Slogan cannot be empty.",s.className="slogan-hint slogan-hint--error";return}o.disabled=!0,o.textContent="...",s.textContent="";try{const{error:d}=await f.from("factions").update({party_description:t,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(d)throw d;document.getElementById("id-slogan").textContent='"'+t+'"',s.textContent="Slogan saved! Next change in 120 ticks.",s.className="slogan-hint slogan-hint--ok",o.textContent="Save"}catch(d){console.error("Slogan save failed:",d),s.textContent="Failed to save slogan.",s.className="slogan-hint slogan-hint--error",o.disabled=!1,o.textContent="Save"}}async function rt(){await f.auth.signOut(),window.location.href="login.html"}function ct(){const n=document.getElementById("corp-faction-dropdown");n&&n.classList.toggle("open")}function dt(n,s){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",n),s==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",n=>{const s=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&s&&!s.contains(n.target)&&o.classList.remove("open")});window.doLogout=rt;window.toggleTheme=it;window.saveSlogan=lt;window.toggleCorpDropdown=ct;window.switchToFaction=dt;let R=!1;async function pt(){if(R)return;const{data:{user:n}}=await f.auth.getUser();if(!n)return;const s=sessionStorage.getItem("active_faction_id");if(!s)return;const o=A.find(e=>e.id===s&&e.faction_type==="corporation");if(!o){alert("No active corporation found.");return}const t=o.faction_name||"this corporation";if(!confirm("DISSOLVE "+t.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all properties, equipment, and inventory
• Remove all cash reserves
• Outstanding debts and active projects will remain

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+t+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}R=!0;const i=document.getElementById("dissolve-btn");i&&(i.disabled=!0,i.textContent="DISSOLVING...",i.style.opacity="0.5");try{async function e(y){const{error:b}=await y;if(b)throw b}await e(f.from("contract_bids").delete().eq("faction_id",s)),await e(f.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",s).in("status",["open","bidding"])),await e(f.from("corp_equipment_deliveries").delete().eq("faction_id",s)),await e(f.from("corp_equipment").delete().eq("faction_id",s)),await e(f.from("corp_properties").delete().eq("faction_id",s)),await e(f.from("corp_material_inventory").delete().eq("faction_id",s)),await e(f.from("corp_warehouse").delete().eq("faction_id",s)),await e(f.from("factions").update({abandoned_at:new Date().toISOString(),corp_cash_reserves:0,corp_employees:0,action_points:0}).eq("id",s)),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:l,error:a}=await f.from("factions").select("id, faction_type").or(`id.eq.${n.id},linked_user_id.eq.${n.id}`).is("abandoned_at",null);a&&console.warn("Failed to check remaining factions:",a.message);const _=(l||[]).find(y=>y.faction_type==="party"),h=(l||[]).find(y=>y.faction_type==="corporation");_?(sessionStorage.setItem("active_faction_id",_.id),alert(t+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):h?(sessionStorage.setItem("active_faction_id",h.id),alert(t+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(t+` has been dissolved.

You have no remaining factions.`),window.location.href="select-nation.html")}catch(e){alert("Dissolution failed: "+(e.message||e)+`

Please try again or contact support.`),i&&(i.disabled=!1,i.textContent="Dissolve Corporation",i.style.opacity="1")}finally{R=!1}}window.dissolveCorporation=pt;Z();
