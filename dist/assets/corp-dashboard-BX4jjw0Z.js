import{_ as L}from"./supabase-client-BXEzLDpS.js";import{e as v}from"./utils-C2W-HleY.js";import{i as z}from"./messaging-5qyQ6ziq.js";let M=[];function d(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+Math.round(e).toLocaleString()}function O(e,s){return Number(e?.[s]??50)}async function Y(){const{data:{user:e}}=await L.auth.getUser();if(!e){window.location.href="login.html";return}const{data:s}=await L.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);M=(s||[]).filter(c=>c.nation_id);const l=sessionStorage.getItem("active_faction_id");let t=M.find(c=>c.id===l)||M.find(c=>c.faction_type==="corporation")||M[0];if(!t){console.error("Corp dashboard: no factions found"),await L.auth.signOut(),window.location.href="login.html";return}if(t.faction_type!=="corporation"){window.location.href="dashboard.html";return}let n=t.nation||"",i=null;const[a,r]=await Promise.all([t.nation_id?L.from("nations").select("*").eq("id",t.nation_id).single():Promise.resolve({data:null}),L.from("shard").select("current_tick, current_date, next_tick_at").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(n=a.data.name,i=a.data),r.error&&console.warn("Shard load failed:",r.error.message);const o=r.data,_=t.corp_ticker||t.abbreviation||"";document.getElementById("corp-logo").textContent=_.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=t.faction_name||"Unnamed Corp",o&&(document.getElementById("game-date").textContent=o.current_date||"—",document.getElementById("tick-number").textContent=o.current_tick||"—",o.next_tick_at&&(P=new Date(o.next_tick_at),Z())),document.getElementById("corp-name-badge").textContent=(_?"["+_+"]":t.faction_name||"Corp")+" ▾";const h=document.getElementById("topbar-cash");if(h){const c=Number(t.corp_cash_reserves??0),T=c>=1e9?"$"+(c/1e9).toFixed(1)+"B":c>=1e6?"$"+(c/1e6).toFixed(1)+"M":"$"+Math.round(c/1e3)+"k";h.textContent="CASH: "+T}const k=t.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+k+" AP</span>";const E=document.getElementById("corp-faction-dropdown");if(E){let c="";for(const f of M){const S=f.id===t.id,W=f.faction_type==="corporation"?"CORP":"PARTY",A=f.faction_type==="corporation"?"var(--teal)":"var(--amber)";c+=`<div class="corp-dd-item${S?" active":""}" onclick="switchToFaction('${f.id}', '${f.faction_type}')">
                <span class="corp-dd-type" style="color:${A}">${W}</span>
                <span class="corp-dd-name">${v(f.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${v(f.abbreviation||"—")}]</span>
            </div>`}M.some(f=>f.faction_type==="corporation")||(c+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),M.some(f=>f.faction_type==="party")||(c+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),E.innerHTML=c}document.getElementById("id-type-badge").textContent=t.corp_company_type||"—",document.getElementById("id-logo").textContent=_.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=t.faction_name||"Unnamed Corp";const u=t.party_description||"";document.getElementById("id-slogan").textContent=u?'"'+u+'"':'"--"';const x=o?.current_date?o.current_date.replace(/.*,\s*/,""):"—",C=t.leader_first_name&&t.leader_last_name?t.leader_first_name+" "+t.leader_last_name+(t.leader_age?" ("+t.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
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
            <span class="id-row__value">${v(t.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${v(t.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${v(C)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${v(t.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${v(_)}</span>
        </div>
    `;const m=t.last_rename_tick||0,b=o?.current_tick||0,y=Math.max(0,m+120-b),$=y<=0,p=document.getElementById("slogan-editor");p.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${v(u)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${$?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${$?"60 characters max. 120 tick cooldown after change.":y+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=t.id,window._currentTick=b;const I=G(i,n);j(i,o,I,t),J(n);const F=Q(i,n,t,o);X(i,n,t,I,F),z(t,i,o),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function G(e,s){const l=I=>O(e,I),t=(s||"UNKNOWN").toUpperCase(),n=3e3,i=.2,a=Math.round(n*.75),r=Math.round(n*.2),o=n-a-r,_=1,h=1.5,k=2.75,E=l("minimum_wage"),u=8e3+E/100*32e3,x=u*_*i,C=u*h*i,m=u*k*i,b=a*x,g=r*C,y=o*m,$=b+g+y;function p(I){return"$"+Math.round(I).toLocaleString()+"/yr"}return document.getElementById("wf-total-header").textContent=n.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${v(t)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${a.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${_.toFixed(2)} &times; ${i.toFixed(2)})</span>
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
                    <span class="wf-tier__nation">${v(t)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${h.toFixed(2)} &times; ${i.toFixed(2)})</span>
                <span class="wf-tier__value">${p(C)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(g)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${v(t)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${o.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${k.toFixed(2)} &times; ${i.toFixed(2)})</span>
                <span class="wf-tier__value">${p(m)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(y)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${v(t)})</span>
                <span class="wf-tier__value">${E}/100 → ${p(u)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Sector Multiplier (Construction)</span>
                <span class="wf-tier__value">&times;${i.toFixed(2)}</span>
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
    `,{totalWages:$,generalTotal:b,skilledTotal:g,innovativeTotal:y,monthlyWages:Math.round($/12)}}function j(e,s,l,t){const n=s?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+n;const i=5e7,a=w=>O(e,w),r=1+(a("gdp_growth")-50)/100*.4,o=1+(a("urbanization")-50)/100*.3,_=1+(a("population_growth")-50)/100*.2,h=1+(a("standard_of_living")-50)/100*.15,k=1+(50-a("physical_infrastructure"))/100*.1,E=1-Math.max(0,a("inflation")-50)/100*.1,u=1-Math.max(0,a("interest_rates")-50)/100*.1,x=r*o*_*h*k*E*u,C=Math.round(i*x),m=Math.round(C/12),b=0,g=0,y=b+g+m,$=l?.totalWages||0,p=Math.round($/12),I=0,F=0,c=0,T=0,B=0,f=p+I+F+c+T+B,S=y-f,W=Number(t?.corp_cash_reserves??0),A=0,U=[{stat:"gdp_growth",value:a("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:a("urbanization"),weight:"0.3"},{stat:"population_growth",value:a("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:a("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:a("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:a("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:a("interest_rates"),weight:"-0.1",neg:!0}];function H(w){return w.neg?w.value>50?"var(--red)":"var(--green)":w.note?w.value<50?"var(--green)":"var(--red)":w.value>=50?"var(--green)":w.value>=35?"var(--amber)":"var(--red)"}const R=y||1,V=(b/R*100).toFixed(1),q=(g/R*100).toFixed(1),K=(m/R*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
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
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${d(g)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${d(m)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${d(y)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${d(p)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${d(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Facilities</span><span class="fin-row__value" style="color:#a44">${d(F)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${d(c)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${d(T)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${d(B)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${d(f)}</span>
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
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${d(W)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${d(A)}</div>
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
    `}function J(e){const s=e.toUpperCase(),l=[{label:"Reputation",value:65,change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:3e3,change:0,section:"Core"},{label:"Workforce Skill",value:50,change:0,decay:!0,max:100},{label:"Operational Efficiency",value:50,change:0,decay:!0,max:100},{label:"Market Share",value:5,change:0,nation:s,max:100,section:"Market & Financials"},{label:"Credit Rating",value:50,change:0,max:100},{label:"Regulatory Standing",value:50,change:0,nation:s,max:100,section:"Political Standing"},{label:"Political Influence",value:10,change:0,decay:!0,nation:s,max:100},{label:"Innovation",value:20,change:0,decay:!0,max:100,section:"Innovation"}];function t(a,r){if(!r||r>100)return"var(--text-primary)";const o=a/r*100;return o>=70?"var(--green)":o>=40?"var(--amber)":o>=20?"var(--orange, #d48a3c)":"var(--red)"}function n(a){const r=parseFloat(a),o=r>0?"var(--green)":r<0?"var(--red)":"var(--text-dim)",_=r>0?"▲":r<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${o}">${_}</span>
            <span class="stat-item__delta" style="color:${o}">${Math.abs(r).toFixed(1)}</span>
        </div>`}let i="";for(const a of l){if(a.isHero){i+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${a.label}</span>
                            ${a.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${a.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${n(a.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${a.value}%"></div></div>
                </div>`;continue}a.section&&(i+=`<div class="stats-section"><span class="stats-section__label">${a.section}</span></div>`);const r=a.max&&a.max<=100;i+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${a.label}</span>
                        ${a.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${a.nation?'<span class="stat-item__nation">'+v(a.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${r?t(a.value,a.max):"var(--text-primary)"}">${typeof a.value=="number"?a.value.toLocaleString():a.value}</span>
                    ${r?'<span class="stat-item__max">/100</span>':""}
                    ${n(a.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=i}function Q(e,s,l,t){const n=y=>O(e,y),i=t?.current_tick||0,a=l.founded_tick||i,o=Math.max(0,(i-a)/12),_=8e6,h=n("inflation"),k=1+h/100*.05,E=Math.pow(k,o),u=n("stability"),x=1+(u-50)/100*.3,C=n("civil_unrest"),m=1-C/100*.2,b=Math.round(_*E*x*m),g=(s||"UNKNOWN").toUpperCase();return document.getElementById("prop-body").innerHTML=`
        <div class="prop-asset">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">Corporate Headquarters</div>
                    <span class="prop-asset__nation">${v(g)}</span>
                </div>
                <span class="prop-asset__badge">OWNED</span>
            </div>
            <div class="prop-cost-box">
                <div class="prop-cost-row">
                    <span class="prop-cost-row__label">BASE COST</span>
                    <span class="prop-cost-row__value" style="color:var(--text-muted);">$8,000,000</span>
                </div>
                <div class="prop-cost-row">
                    <span class="prop-cost-row__label">INFLATION (${v(g)})</span>
                    <span class="prop-cost-row__value" style="color:${h>50?"var(--red)":"var(--green)"}">
                        ${h}/100 &mdash; &times;${E.toFixed(2)}
                    </span>
                </div>
                <div class="prop-cost-row">
                    <span class="prop-cost-row__label">STABILITY (${v(g)})</span>
                    <span class="prop-cost-row__value" style="color:${u>=50?"var(--green)":"var(--red)"}">
                        ${u}/100 &mdash; &times;${x.toFixed(2)}
                    </span>
                </div>
                <div class="prop-cost-row">
                    <span class="prop-cost-row__label">CIVIL UNREST (${v(g)})</span>
                    <span class="prop-cost-row__value" style="color:${C>20?"var(--red)":"var(--green)"}">
                        ${C}/100 &mdash; &times;${m.toFixed(2)}
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
    `,{propertyValue:b}}function X(e,s,l,t,n){(s||"UNKNOWN").toUpperCase();const i=l.corp_company_type||"Private",a=Number(l.corp_cash_reserves)||0,r=n?.propertyValue||0,o=0,_=0,h=a+r+o+_,k=Number(l.corp_loans)||0,u=t?.monthlyWages||0,x=0,C=k+u+x,m=h-C,g=Math.round(m*(1+.3)),y=g-m,$=y>0;document.getElementById("val-type-badge").textContent=i.toUpperCase();function p(I,F,c={}){const T=c.indent?"val-line val-line--indent":"val-line",B=c.bold?"val-line__label val-line__label--bold":"val-line__label",f=c.bold?"val-line__value val-line__value--bold":"val-line__value",S=c.color||(c.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${T}"><span class="${B}">${I}</span><span class="${f}" style="color:${S}">${d(F)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${p("Cash & Reserves",a,{indent:!0})}
        ${p("Property",r,{indent:!0})}
        ${p("Equipment",o,{indent:!0})}
        ${p("Active Contracts",_,{indent:!0})}
        ${p("Total Assets",h,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${p("Outstanding Loans",k,{indent:!0})}
        ${p("Accounts Payable",u,{indent:!0})}
        ${p("Pending Project Costs",x,{indent:!0})}
        ${p("Total Liabilities",C,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${m>=0?"var(--green)":"var(--red)"};">${d(m)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${d(g)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${$?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${$?"var(--green)":"var(--red)"};">${$?"+":""}${d(y)}</span>
            </div>
            <div class="val-market__note">${$?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let P=null,N=null;function Z(){N&&clearInterval(N),N=setInterval(D,1e3),D()}function D(){const e=document.getElementById("tick-countdown");if(!e||!P){e&&(e.textContent="—");return}const s=P-Date.now();if(s<=0){e.textContent="Tick due...",clearInterval(N);return}const l=Math.floor(s/36e5),t=Math.floor(s%36e5/6e4),n=Math.floor(s%6e4/1e3);e.textContent=l+"h "+t+"m "+n+"s"}function aa(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}async function ta(){const e=document.getElementById("slogan-input"),s=document.getElementById("slogan-hint"),l=document.getElementById("slogan-save-btn"),t=(e.value||"").trim().slice(0,60);if(t.length===0){s.textContent="Slogan cannot be empty.",s.className="slogan-hint slogan-hint--error";return}l.disabled=!0,l.textContent="...",s.textContent="";try{const{error:n}=await L.from("factions").update({party_description:t,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(n)throw n;document.getElementById("id-slogan").textContent='"'+t+'"',s.textContent="Slogan saved! Next change in 120 ticks.",s.className="slogan-hint slogan-hint--ok",l.textContent="Save"}catch(n){console.error("Slogan save failed:",n),s.textContent="Failed to save slogan.",s.className="slogan-hint slogan-hint--error",l.disabled=!1,l.textContent="Save"}}async function ea(){await L.auth.signOut(),window.location.href="login.html"}function sa(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function na(e,s){const l=document.getElementById("corp-faction-dropdown");l&&l.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),s==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const s=document.getElementById("faction-switcher"),l=document.getElementById("corp-faction-dropdown");l&&s&&!s.contains(e.target)&&l.classList.remove("open")});window.doLogout=ea;window.toggleTheme=aa;window.saveSlogan=ta;window.toggleCorpDropdown=sa;window.switchToFaction=na;Y();
