import{_ as F}from"./supabase-client-BXEzLDpS.js";import{e as v}from"./utils-C2W-HleY.js";import{i as z}from"./messaging-5qyQ6ziq.js";let B=[];function c(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+Math.round(e).toLocaleString()}function O(e,s){return Number(e?.[s]??50)}async function Y(){const{data:{user:e}}=await F.auth.getUser();if(!e){window.location.href="login.html";return}const{data:s}=await F.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);B=(s||[]).filter(n=>n.nation_id);const o=sessionStorage.getItem("active_faction_id");let t=B.find(n=>n.id===o)||B.find(n=>n.faction_type==="corporation")||B[0];if(!t){console.error("Corp dashboard: no factions found"),await F.auth.signOut(),window.location.href="login.html";return}if(t.faction_type!=="corporation"){window.location.href="dashboard.html";return}let l=t.nation||"",d=null;const[a,r]=await Promise.all([t.nation_id?F.from("nations").select("*").eq("id",t.nation_id).single():Promise.resolve({data:null}),F.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(l=a.data.name,d=a.data),r.error&&console.warn("Shard load failed:",r.error.message);const i=r.data,_=t.corp_ticker||t.abbreviation||"";if(document.getElementById("corp-logo").textContent=_.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=t.faction_name||"Unnamed Corp",i){if(document.getElementById("game-date").textContent=i.current_date||"—",document.getElementById("tick-number").textContent=i.current_tick||"—",i.next_tick_at){const f=(Number(i.tick_interval_hours)||8)*36e5,k=new Date(i.next_tick_at).getTime(),w=k-f+f/2;R=new Date(w>Date.now()?w:k+f/2),Z()}const n=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");n&&(n.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(_?"["+_+"]":t.faction_name||"Corp")+" ▾";const $=document.getElementById("topbar-cash");if($){const n=Number(t.corp_cash_reserves??0),f=n>=1e9?"$"+(n/1e9).toFixed(1)+"B":n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k";$.textContent="CASH: "+f}const T=t.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+T+" AP</span>";const S=document.getElementById("corp-faction-dropdown");if(S){let n="";for(const p of B){const w=p.id===t.id,A=p.faction_type==="corporation"?"CORP":"PARTY",W=p.faction_type==="corporation"?"var(--teal)":"var(--amber)";n+=`<div class="corp-dd-item${w?" active":""}" onclick="switchToFaction('${p.id}', '${p.faction_type}')">
                <span class="corp-dd-type" style="color:${W}">${A}</span>
                <span class="corp-dd-name">${v(p.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${v(p.abbreviation||"—")}]</span>
            </div>`}B.some(p=>p.faction_type==="corporation")||(n+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),B.some(p=>p.faction_type==="party")||(n+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),S.innerHTML=n}document.getElementById("id-type-badge").textContent=t.corp_company_type||"—",document.getElementById("id-logo").textContent=_.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=t.faction_name||"Unnamed Corp";const y=t.party_description||"";document.getElementById("id-slogan").textContent=y?'"'+y+'"':'"--"';const C=i?.current_date?i.current_date.replace(/.*,\s*/,""):"—",E=t.leader_first_name&&t.leader_last_name?t.leader_first_name+" "+t.leader_last_name+(t.leader_age?" ("+t.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${v(C)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${v(l||"—")}</span>
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
            <span class="id-row__value">${v(E)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${v(t.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${v(_)}</span>
        </div>
    `;const u=t.last_rename_tick||0,h=i?.current_tick||0,x=Math.max(0,u+120-h),I=x<=0,m=document.getElementById("slogan-editor");m.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${v(y)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${I?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${I?"60 characters max. 120 tick cooldown after change.":x+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=t.id,window._currentTick=h;const M=G(d,l,t);j(d,i,M,t),J(l);const L=Q(d,l,t,i);X(d,l,t,M,L),z(t,d,i),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function G(e,s,o){const t=w=>O(e,w),l=(s||"UNKNOWN").toUpperCase(),d=Number(o?.corp_general_workforce??2250),a=Number(o?.corp_skilled_workforce??600),r=Number(o?.corp_innovative_workforce??150),i=d+a+r,_=2,$=3,T=6,S=t("minimum_wage"),y=S/100*48e3,C=t("inflation"),E=t("standard_of_living"),u=1+(C-50)/100*.5,h=1+(E-50)/100*.5,g=w=>Math.round(y*w*u*h),x=g(_),I=g($),m=g(T),M=d*x,L=a*I,n=r*m,f=M+L+n;function k(w){return"$"+Math.round(w).toLocaleString()+"/yr"}const p=`${u.toFixed(2)} &times; ${h.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=i.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${v(l)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${d.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${_}.0 &times; ${p})</span>
                <span class="wf-tier__value">${k(x)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(M)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${v(l)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${a.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${$}.0 &times; ${p})</span>
                <span class="wf-tier__value">${k(I)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(L)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${v(l)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${T}.0 &times; ${p})</span>
                <span class="wf-tier__value">${k(m)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(n)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${v(l)})</span>
                <span class="wf-tier__value">${S}/100 → ${k(y)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${u.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${h.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${i.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${c(f)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${c(f/12)}</span>
            </div>
        </div>
    `,{totalWages:f,generalTotal:M,skilledTotal:L,innovativeTotal:n,monthlyWages:Math.round(f/12)}}function j(e,s,o,t){const l=s?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+l;const d=5e7,a=b=>O(e,b),r=1+(a("gdp_growth")-50)/100*.4,i=1+(a("urbanization")-50)/100*.3,_=1+(a("population_growth")-50)/100*.2,$=1+(a("standard_of_living")-50)/100*.15,T=1+(50-a("physical_infrastructure"))/100*.1,S=1-Math.max(0,a("inflation")-50)/100*.1,y=1-Math.max(0,a("interest_rates")-50)/100*.1,C=r*i*_*$*T*S*y,E=Math.round(d*C),u=Math.round(E/12),h=0,g=0,x=h+g+u,I=o?.totalWages||0,m=Math.round(I/12),M=0,L=0,n=0,f=0,k=0,p=m+M+L+n+f+k,w=x-p,A=Number(t?.corp_cash_reserves??0),W=0,U=[{stat:"gdp_growth",value:a("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:a("urbanization"),weight:"0.3"},{stat:"population_growth",value:a("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:a("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:a("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:a("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:a("interest_rates"),weight:"-0.1",neg:!0}];function H(b){return b.neg?b.value>50?"var(--red)":"var(--green)":b.note?b.value<50?"var(--green)":"var(--red)":b.value>=50?"var(--green)":b.value>=35?"var(--amber)":"var(--red)"}const P=x||1,V=(h/P*100).toFixed(1),q=(g/P*100).toFixed(1),K=(u/P*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
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
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${c(h)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${c(g)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${c(u)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${c(x)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${c(m)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${c(M)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Facilities</span><span class="fin-row__value" style="color:#a44">${c(L)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${c(n)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${c(f)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${c(k)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${c(p)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${w>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${w>=0?"var(--green)":"var(--red)"}">${c(w)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${c(A)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${c(W)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${U.map(b=>`
                <div class="drv-row">
                    <span class="drv-row__name">${b.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${b.value}%;background:${H(b)}"></div></div>
                    <span class="drv-row__val">${b.value}</span>
                    <span class="drv-row__wt">&times;${b.weight}</span>
                    ${b.note?'<span class="drv-row__note">'+b.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${C.toFixed(2)}</span>
            </div>
        </div>
    `}function J(e){const s=e.toUpperCase(),o=[{label:"Reputation",value:65,change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:3e3,change:0,section:"Core"},{label:"Workforce Skill",value:50,change:0,decay:!0,max:100},{label:"Operational Efficiency",value:50,change:0,decay:!0,max:100},{label:"Market Share",value:5,change:0,nation:s,max:100,section:"Market & Financials"},{label:"Credit Rating",value:50,change:0,max:100},{label:"Regulatory Standing",value:50,change:0,nation:s,max:100,section:"Political Standing"},{label:"Political Influence",value:10,change:0,decay:!0,nation:s,max:100},{label:"Innovation",value:20,change:0,decay:!0,max:100,section:"Innovation"}];function t(a,r){if(!r||r>100)return"var(--text-primary)";const i=a/r*100;return i>=70?"var(--green)":i>=40?"var(--amber)":i>=20?"var(--orange, #d48a3c)":"var(--red)"}function l(a){const r=parseFloat(a),i=r>0?"var(--green)":r<0?"var(--red)":"var(--text-dim)",_=r>0?"▲":r<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${i}">${_}</span>
            <span class="stat-item__delta" style="color:${i}">${Math.abs(r).toFixed(1)}</span>
        </div>`}let d="";for(const a of o){if(a.isHero){d+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${a.label}</span>
                            ${a.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${a.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${l(a.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${a.value}%"></div></div>
                </div>`;continue}a.section&&(d+=`<div class="stats-section"><span class="stats-section__label">${a.section}</span></div>`);const r=a.max&&a.max<=100;d+=`
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
                    ${l(a.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=d}function Q(e,s,o,t){const l=x=>O(e,x),d=t?.current_tick||0,a=o.founded_tick||d,i=Math.max(0,(d-a)/12),_=8e6,$=l("inflation"),T=1+$/100*.05,S=Math.pow(T,i),y=l("stability"),C=1+(y-50)/100*.3,E=l("civil_unrest"),u=1-E/100*.2,h=Math.round(_*S*C*u),g=(s||"UNKNOWN").toUpperCase();return document.getElementById("prop-body").innerHTML=`
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
                    <span class="prop-cost-row__value" style="color:${$>50?"var(--red)":"var(--green)"}">
                        ${$}/100 &mdash; &times;${S.toFixed(2)}
                    </span>
                </div>
                <div class="prop-cost-row">
                    <span class="prop-cost-row__label">STABILITY (${v(g)})</span>
                    <span class="prop-cost-row__value" style="color:${y>=50?"var(--green)":"var(--red)"}">
                        ${y}/100 &mdash; &times;${C.toFixed(2)}
                    </span>
                </div>
                <div class="prop-cost-row">
                    <span class="prop-cost-row__label">CIVIL UNREST (${v(g)})</span>
                    <span class="prop-cost-row__value" style="color:${E>20?"var(--red)":"var(--green)"}">
                        ${E}/100 &mdash; &times;${u.toFixed(2)}
                    </span>
                </div>
                <div class="prop-cost-row" style="padding-top:4px;">
                    <span class="prop-cost-row__label" style="color:var(--text-muted);">ADJUSTED VALUE</span>
                    <span class="prop-cost-row__value" style="font-size:11px;font-weight:700;color:var(--text-bright);">${c(h)}</span>
                </div>
            </div>
        </div>
        <div style="flex:1;"></div>
        <div class="prop-total">
            <span class="prop-total__label">Total Property Value</span>
            <span class="prop-total__value">${c(h)}</span>
        </div>
    `,{propertyValue:h}}function X(e,s,o,t,l){(s||"UNKNOWN").toUpperCase();const d=o.corp_company_type||"Private",a=Number(o.corp_cash_reserves)||0,r=l?.propertyValue||0,i=0,_=0,$=a+r+i+_,T=Number(o.corp_loans)||0,y=t?.monthlyWages||0,C=0,E=T+y+C,u=$-E,g=Math.round(u*(1+.3)),x=g-u,I=x>0;document.getElementById("val-type-badge").textContent=d.toUpperCase();function m(M,L,n={}){const f=n.indent?"val-line val-line--indent":"val-line",k=n.bold?"val-line__label val-line__label--bold":"val-line__label",p=n.bold?"val-line__value val-line__value--bold":"val-line__value",w=n.color||(n.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${f}"><span class="${k}">${M}</span><span class="${p}" style="color:${w}">${c(L)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${m("Cash & Reserves",a,{indent:!0})}
        ${m("Property",r,{indent:!0})}
        ${m("Equipment",i,{indent:!0})}
        ${m("Active Contracts",_,{indent:!0})}
        ${m("Total Assets",$,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${m("Outstanding Loans",T,{indent:!0})}
        ${m("Accounts Payable",y,{indent:!0})}
        ${m("Pending Project Costs",C,{indent:!0})}
        ${m("Total Liabilities",E,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${u>=0?"var(--green)":"var(--red)"};">${c(u)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${c(g)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${I?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${I?"var(--green)":"var(--red)"};">${I?"+":""}${c(x)}</span>
            </div>
            <div class="val-market__note">${I?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let R=null,N=null;function Z(){N&&clearInterval(N),N=setInterval(D,1e3),D()}function D(){const e=document.getElementById("tick-countdown");if(!e||!R){e&&(e.textContent="—");return}const s=R-Date.now();if(s<=0){e.textContent="Tick due...",clearInterval(N);return}const o=Math.floor(s/36e5),t=Math.floor(s%36e5/6e4),l=Math.floor(s%6e4/1e3);e.textContent=o+"h "+t+"m "+l+"s"}function aa(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}async function ta(){const e=document.getElementById("slogan-input"),s=document.getElementById("slogan-hint"),o=document.getElementById("slogan-save-btn"),t=(e.value||"").trim().slice(0,60);if(t.length===0){s.textContent="Slogan cannot be empty.",s.className="slogan-hint slogan-hint--error";return}o.disabled=!0,o.textContent="...",s.textContent="";try{const{error:l}=await F.from("factions").update({party_description:t,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(l)throw l;document.getElementById("id-slogan").textContent='"'+t+'"',s.textContent="Slogan saved! Next change in 120 ticks.",s.className="slogan-hint slogan-hint--ok",o.textContent="Save"}catch(l){console.error("Slogan save failed:",l),s.textContent="Failed to save slogan.",s.className="slogan-hint slogan-hint--error",o.disabled=!1,o.textContent="Save"}}async function ea(){await F.auth.signOut(),window.location.href="login.html"}function sa(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function na(e,s){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),s==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const s=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&s&&!s.contains(e.target)&&o.classList.remove("open")});window.doLogout=ea;window.toggleTheme=aa;window.saveSlogan=ta;window.toggleCorpDropdown=sa;window.switchToFaction=na;Y();
