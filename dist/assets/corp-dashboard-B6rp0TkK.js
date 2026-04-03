import{_ as F}from"./supabase-client-BXEzLDpS.js";import{e as v}from"./utils-C2W-HleY.js";import{i as z}from"./messaging-5qyQ6ziq.js";let L=[];function d(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+Math.round(e).toLocaleString()}function O(e,s){return Number(e?.[s]??50)}async function Y(){const{data:{user:e}}=await F.auth.getUser();if(!e){window.location.href="login.html";return}const{data:s}=await F.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);L=(s||[]).filter(l=>l.nation_id);const i=sessionStorage.getItem("active_faction_id");let a=L.find(l=>l.id===i)||L.find(l=>l.faction_type==="corporation")||L[0];if(!a){console.error("Corp dashboard: no factions found"),await F.auth.signOut(),window.location.href="login.html";return}if(a.faction_type!=="corporation"){window.location.href="dashboard.html";return}let n=a.nation||"",r=null;const[t,c]=await Promise.all([a.nation_id?F.from("nations").select("*").eq("id",a.nation_id).single():Promise.resolve({data:null}),F.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);t.error&&console.warn("Nation load failed:",t.error.message),t.data&&(n=t.data.name,r=t.data),c.error&&console.warn("Shard load failed:",c.error.message);const o=c.data,_=a.corp_ticker||a.abbreviation||"";if(document.getElementById("corp-logo").textContent=_.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=a.faction_name||"Unnamed Corp",o){if(document.getElementById("game-date").textContent=o.current_date||"—",document.getElementById("tick-number").textContent=o.current_tick||"—",o.next_tick_at){const I=(Number(o.tick_interval_hours)||8)*36e5,M=new Date(o.next_tick_at).getTime(),S=M-I+I/2;P=new Date(S>Date.now()?S:M+I/2),Z()}const l=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");l&&(l.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(_?"["+_+"]":a.faction_name||"Corp")+" ▾";const h=document.getElementById("topbar-cash");if(h){const l=Number(a.corp_cash_reserves??0),I=l>=1e9?"$"+(l/1e9).toFixed(1)+"B":l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k";h.textContent="CASH: "+I}const C=a.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+C+" AP</span>";const E=document.getElementById("corp-faction-dropdown");if(E){let l="";for(const m of L){const S=m.id===a.id,N=m.faction_type==="corporation"?"CORP":"PARTY",W=m.faction_type==="corporation"?"var(--teal)":"var(--amber)";l+=`<div class="corp-dd-item${S?" active":""}" onclick="switchToFaction('${m.id}', '${m.faction_type}')">
                <span class="corp-dd-type" style="color:${W}">${N}</span>
                <span class="corp-dd-name">${v(m.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${v(m.abbreviation||"—")}]</span>
            </div>`}L.some(m=>m.faction_type==="corporation")||(l+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),L.some(m=>m.faction_type==="party")||(l+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),E.innerHTML=l}document.getElementById("id-type-badge").textContent=a.corp_company_type||"—",document.getElementById("id-logo").textContent=_.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=a.faction_name||"Unnamed Corp";const u=a.party_description||"";document.getElementById("id-slogan").textContent=u?'"'+u+'"':'"--"';const x=o?.current_date?o.current_date.replace(/.*,\s*/,""):"—",k=a.leader_first_name&&a.leader_last_name?a.leader_first_name+" "+a.leader_last_name+(a.leader_age?" ("+a.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${v(x)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${v(n||"—")}</span>
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
            <span class="id-row__value">${v(k)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${v(a.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${v(_)}</span>
        </div>
    `;const g=a.last_rename_tick||0,b=o?.current_tick||0,y=Math.max(0,g+120-b),$=y<=0,p=document.getElementById("slogan-editor");p.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${v(u)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${$?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${$?"60 characters max. 120 tick cooldown after change.":y+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=a.id,window._currentTick=b;const T=G(r,n);j(r,o,T,a),J(n);const B=Q(r,n,a,o);X(r,n,a,T,B),z(a,r,o),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function G(e,s){const i=T=>O(e,T),a=(s||"UNKNOWN").toUpperCase(),n=3e3,r=.2,t=Math.round(n*.75),c=Math.round(n*.2),o=n-t-c,_=1,h=1.5,C=2.75,E=i("minimum_wage"),u=8e3+E/100*32e3,x=u*_*r,k=u*h*r,g=u*C*r,b=t*x,f=c*k,y=o*g,$=b+f+y;function p(T){return"$"+Math.round(T).toLocaleString()+"/yr"}return document.getElementById("wf-total-header").textContent=n.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${v(a)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${t.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${_.toFixed(2)} &times; ${r.toFixed(2)})</span>
                <span class="wf-tier__value">${p(x)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(b)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${v(a)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${c.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${h.toFixed(2)} &times; ${r.toFixed(2)})</span>
                <span class="wf-tier__value">${p(k)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(f)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${v(a)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${o.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${C.toFixed(2)} &times; ${r.toFixed(2)})</span>
                <span class="wf-tier__value">${p(g)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(y)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${v(a)})</span>
                <span class="wf-tier__value">${E}/100 → ${p(u)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Sector Multiplier (Construction)</span>
                <span class="wf-tier__value">&times;${r.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${n.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${d($)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${d($/12)}</span>
            </div>
        </div>
    `,{totalWages:$,generalTotal:b,skilledTotal:f,innovativeTotal:y,monthlyWages:Math.round($/12)}}function j(e,s,i,a){const n=s?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+n;const r=5e7,t=w=>O(e,w),c=1+(t("gdp_growth")-50)/100*.4,o=1+(t("urbanization")-50)/100*.3,_=1+(t("population_growth")-50)/100*.2,h=1+(t("standard_of_living")-50)/100*.15,C=1+(50-t("physical_infrastructure"))/100*.1,E=1-Math.max(0,t("inflation")-50)/100*.1,u=1-Math.max(0,t("interest_rates")-50)/100*.1,x=c*o*_*h*C*E*u,k=Math.round(r*x),g=Math.round(k/12),b=0,f=0,y=b+f+g,$=i?.totalWages||0,p=Math.round($/12),T=0,B=0,l=0,I=0,M=0,m=p+T+B+l+I+M,S=y-m,N=Number(a?.corp_cash_reserves??0),W=0,U=[{stat:"gdp_growth",value:t("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:t("urbanization"),weight:"0.3"},{stat:"population_growth",value:t("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:t("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:t("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:t("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:t("interest_rates"),weight:"-0.1",neg:!0}];function H(w){return w.neg?w.value>50?"var(--red)":"var(--green)":w.note?w.value<50?"var(--green)":"var(--red)":w.value>=50?"var(--green)":w.value>=35?"var(--amber)":"var(--red)"}const R=y||1,V=(b/R*100).toFixed(1),q=(f/R*100).toFixed(1),K=(g/R*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${V}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${q}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${K}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${d(b)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${d(f)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${d(g)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${d(y)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${d(p)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${d(T)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Facilities</span><span class="fin-row__value" style="color:#a44">${d(B)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${d(l)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${d(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${d(M)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${d(m)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${S>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${S>=0?"var(--green)":"var(--red)"}">${d(S)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${d(N)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${d(W)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${U.map(w=>`
                <div class="drv-row">
                    <span class="drv-row__name">${w.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${w.value}%;background:${H(w)}"></div></div>
                    <span class="drv-row__val">${w.value}</span>
                    <span class="drv-row__wt">&times;${w.weight}</span>
                    ${w.note?'<span class="drv-row__note">'+w.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${x.toFixed(2)}</span>
            </div>
        </div>
    `}function J(e){const s=e.toUpperCase(),i=[{label:"Reputation",value:65,change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:3e3,change:0,section:"Core"},{label:"Workforce Skill",value:50,change:0,decay:!0,max:100},{label:"Operational Efficiency",value:50,change:0,decay:!0,max:100},{label:"Market Share",value:5,change:0,nation:s,max:100,section:"Market & Financials"},{label:"Credit Rating",value:50,change:0,max:100},{label:"Regulatory Standing",value:50,change:0,nation:s,max:100,section:"Political Standing"},{label:"Political Influence",value:10,change:0,decay:!0,nation:s,max:100},{label:"Innovation",value:20,change:0,decay:!0,max:100,section:"Innovation"}];function a(t,c){if(!c||c>100)return"var(--text-primary)";const o=t/c*100;return o>=70?"var(--green)":o>=40?"var(--amber)":o>=20?"var(--orange, #d48a3c)":"var(--red)"}function n(t){const c=parseFloat(t),o=c>0?"var(--green)":c<0?"var(--red)":"var(--text-dim)",_=c>0?"▲":c<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${o}">${_}</span>
            <span class="stat-item__delta" style="color:${o}">${Math.abs(c).toFixed(1)}</span>
        </div>`}let r="";for(const t of i){if(t.isHero){r+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${t.label}</span>
                            ${t.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${t.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${n(t.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${t.value}%"></div></div>
                </div>`;continue}t.section&&(r+=`<div class="stats-section"><span class="stats-section__label">${t.section}</span></div>`);const c=t.max&&t.max<=100;r+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${t.label}</span>
                        ${t.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${t.nation?'<span class="stat-item__nation">'+v(t.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${c?a(t.value,t.max):"var(--text-primary)"}">${typeof t.value=="number"?t.value.toLocaleString():t.value}</span>
                    ${c?'<span class="stat-item__max">/100</span>':""}
                    ${n(t.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=r}function Q(e,s,i,a){const n=y=>O(e,y),r=a?.current_tick||0,t=i.founded_tick||r,o=Math.max(0,(r-t)/12),_=8e6,h=n("inflation"),C=1+h/100*.05,E=Math.pow(C,o),u=n("stability"),x=1+(u-50)/100*.3,k=n("civil_unrest"),g=1-k/100*.2,b=Math.round(_*E*x*g),f=(s||"UNKNOWN").toUpperCase();return document.getElementById("prop-body").innerHTML=`
        <div class="prop-asset">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">Corporate Headquarters</div>
                    <span class="prop-asset__nation">${v(f)}</span>
                </div>
                <span class="prop-asset__badge">OWNED</span>
            </div>
            <div class="prop-cost-box">
                <div class="prop-cost-row">
                    <span class="prop-cost-row__label">BASE COST</span>
                    <span class="prop-cost-row__value" style="color:var(--text-muted);">$8,000,000</span>
                </div>
                <div class="prop-cost-row">
                    <span class="prop-cost-row__label">INFLATION (${v(f)})</span>
                    <span class="prop-cost-row__value" style="color:${h>50?"var(--red)":"var(--green)"}">
                        ${h}/100 &mdash; &times;${E.toFixed(2)}
                    </span>
                </div>
                <div class="prop-cost-row">
                    <span class="prop-cost-row__label">STABILITY (${v(f)})</span>
                    <span class="prop-cost-row__value" style="color:${u>=50?"var(--green)":"var(--red)"}">
                        ${u}/100 &mdash; &times;${x.toFixed(2)}
                    </span>
                </div>
                <div class="prop-cost-row">
                    <span class="prop-cost-row__label">CIVIL UNREST (${v(f)})</span>
                    <span class="prop-cost-row__value" style="color:${k>20?"var(--red)":"var(--green)"}">
                        ${k}/100 &mdash; &times;${g.toFixed(2)}
                    </span>
                </div>
                <div class="prop-cost-row" style="padding-top:4px;">
                    <span class="prop-cost-row__label" style="color:var(--text-muted);">ADJUSTED VALUE</span>
                    <span class="prop-cost-row__value" style="font-size:11px;font-weight:700;color:var(--text-bright);">${d(b)}</span>
                </div>
            </div>
        </div>
        <div style="flex:1;"></div>
        <div class="prop-total">
            <span class="prop-total__label">Total Property Value</span>
            <span class="prop-total__value">${d(b)}</span>
        </div>
    `,{propertyValue:b}}function X(e,s,i,a,n){(s||"UNKNOWN").toUpperCase();const r=i.corp_company_type||"Private",t=Number(i.corp_cash_reserves)||0,c=n?.propertyValue||0,o=0,_=0,h=t+c+o+_,C=Number(i.corp_loans)||0,u=a?.monthlyWages||0,x=0,k=C+u+x,g=h-k,f=Math.round(g*(1+.3)),y=f-g,$=y>0;document.getElementById("val-type-badge").textContent=r.toUpperCase();function p(T,B,l={}){const I=l.indent?"val-line val-line--indent":"val-line",M=l.bold?"val-line__label val-line__label--bold":"val-line__label",m=l.bold?"val-line__value val-line__value--bold":"val-line__value",S=l.color||(l.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${I}"><span class="${M}">${T}</span><span class="${m}" style="color:${S}">${d(B)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${p("Cash & Reserves",t,{indent:!0})}
        ${p("Property",c,{indent:!0})}
        ${p("Equipment",o,{indent:!0})}
        ${p("Active Contracts",_,{indent:!0})}
        ${p("Total Assets",h,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${p("Outstanding Loans",C,{indent:!0})}
        ${p("Accounts Payable",u,{indent:!0})}
        ${p("Pending Project Costs",x,{indent:!0})}
        ${p("Total Liabilities",k,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${g>=0?"var(--green)":"var(--red)"};">${d(g)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${d(f)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${$?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${$?"var(--green)":"var(--red)"};">${$?"+":""}${d(y)}</span>
            </div>
            <div class="val-market__note">${$?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let P=null,A=null;function Z(){A&&clearInterval(A),A=setInterval(D,1e3),D()}function D(){const e=document.getElementById("tick-countdown");if(!e||!P){e&&(e.textContent="—");return}const s=P-Date.now();if(s<=0){e.textContent="Tick due...",clearInterval(A);return}const i=Math.floor(s/36e5),a=Math.floor(s%36e5/6e4),n=Math.floor(s%6e4/1e3);e.textContent=i+"h "+a+"m "+n+"s"}function tt(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}async function at(){const e=document.getElementById("slogan-input"),s=document.getElementById("slogan-hint"),i=document.getElementById("slogan-save-btn"),a=(e.value||"").trim().slice(0,60);if(a.length===0){s.textContent="Slogan cannot be empty.",s.className="slogan-hint slogan-hint--error";return}i.disabled=!0,i.textContent="...",s.textContent="";try{const{error:n}=await F.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(n)throw n;document.getElementById("id-slogan").textContent='"'+a+'"',s.textContent="Slogan saved! Next change in 120 ticks.",s.className="slogan-hint slogan-hint--ok",i.textContent="Save"}catch(n){console.error("Slogan save failed:",n),s.textContent="Failed to save slogan.",s.className="slogan-hint slogan-hint--error",i.disabled=!1,i.textContent="Save"}}async function et(){await F.auth.signOut(),window.location.href="login.html"}function st(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function nt(e,s){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),s==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const s=document.getElementById("faction-switcher"),i=document.getElementById("corp-faction-dropdown");i&&s&&!s.contains(e.target)&&i.classList.remove("open")});window.doLogout=et;window.toggleTheme=tt;window.saveSlogan=at;window.toggleCorpDropdown=st;window.switchToFaction=nt;Y();
