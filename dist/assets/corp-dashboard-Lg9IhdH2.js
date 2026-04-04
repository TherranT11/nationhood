import{_ as m}from"./supabase-client-BXEzLDpS.js";import{e as y}from"./utils-C2W-HleY.js";import{initMessaging as J}from"./messaging-B5Fng3EZ.js";import{c as X}from"./equipment-DsuDdEne.js";let B=[];function p(a){return Math.abs(a)>=1e6?"$"+(a/1e6).toFixed(2)+"M":Math.abs(a)>=1e3?"$"+(a/1e3).toFixed(1)+"k":"$"+Math.round(a).toLocaleString()}function O(a,n){return Number(a?.[n]??50)}async function Z(){const{data:{user:a}}=await m.auth.getUser();if(!a){window.location.href="login.html";return}const{data:n}=await m.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);B=(n||[]).filter(l=>l.nation_id&&!l.abandoned_at);const i=sessionStorage.getItem("active_faction_id");let e=B.find(l=>l.id===i)||B.find(l=>l.faction_type==="corporation")||B[0];if(!e){console.error("Corp dashboard: no factions found"),await m.auth.signOut(),window.location.href="login.html";return}if(e.faction_type!=="corporation"){window.location.href="dashboard.html";return}let d=e.nation||"",r=null;const[s,o]=await Promise.all([e.nation_id?m.from("nations").select("*").eq("id",e.nation_id).single():Promise.resolve({data:null}),m.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);s.error&&console.warn("Nation load failed:",s.error.message),s.data&&(d=s.data.name,r=s.data),o.error&&console.warn("Shard load failed:",o.error.message);const t=o.data,_=e.corp_ticker||e.abbreviation||"";if(document.getElementById("corp-logo").textContent=_.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=e.faction_name||"Unnamed Corp",t){if(document.getElementById("game-date").textContent=t.current_date||"—",document.getElementById("tick-number").textContent=t.current_tick||"—",t.next_tick_at){const g=(Number(t.tick_interval_hours)||8)*36e5,S=new Date(t.next_tick_at).getTime(),A=S-g+g/2;U=new Date(A>Date.now()?A:S+g/2),ot()}const l=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");l&&(l.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(_?"["+_+"]":e.faction_name||"Corp")+" ▾";const h=document.getElementById("topbar-cash");if(h){const l=Number(e.corp_cash_reserves??0),g=l>=1e9?"$"+(l/1e9).toFixed(1)+"B":l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k";h.textContent="CASH: "+g}const $=e.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+$+" AP</span>";const b=document.getElementById("corp-faction-dropdown");if(b){let l="";for(const v of B){const A=v.id===e.id,q=v.faction_type==="corporation"?"CORP":"PARTY",F=v.faction_type==="corporation"?"var(--teal)":"var(--amber)";l+=`<div class="corp-dd-item${A?" active":""}" onclick="switchToFaction('${v.id}', '${v.faction_type}')">
                <span class="corp-dd-type" style="color:${F}">${q}</span>
                <span class="corp-dd-name">${y(v.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${y(v.abbreviation||"—")}]</span>
            </div>`}B.some(v=>v.faction_type==="corporation")||(l+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),B.some(v=>v.faction_type==="party")||(l+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),b.innerHTML=l}document.getElementById("id-type-badge").textContent=e.corp_company_type||"—",document.getElementById("id-logo").textContent=_.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=e.faction_name||"Unnamed Corp";const f=e.party_description||"";document.getElementById("id-slogan").textContent=f?'"'+f+'"':'"--"';const k=t?.current_date?t.current_date.replace(/.*,\s*/,""):"—",M=e.leader_first_name&&e.leader_last_name?e.leader_first_name+" "+e.leader_last_name+(e.leader_age?" ("+e.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${y(k)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${y(d||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${y(e.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${y(e.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${y(M)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${y(e.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${y(_)}</span>
        </div>
    `;const c=e.last_rename_tick||0,T=t?.current_tick||0,E=Math.max(0,c+120-T),I=E<=0,u=document.getElementById("slogan-editor");u.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${y(f)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${I?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${I?"60 characters max. 120 tick cooldown after change.":E+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=e.id,window._currentTick=T;const N=tt(r,d,e);at(d);const L=await nt(r,d,e);let x=0;if(e?.id){const{data:l,error:g}=await m.from("corp_equipment").select("equipment_key, owned").eq("faction_id",e.id);g||(x=X(l||[]))}et(r,t,N,e,L.propertyMaintenance||0,x),st(r,d,e,N,L),J(e,r,t),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function tt(a,n,i){const e=v=>O(a,v),d=(n||"UNKNOWN").toUpperCase(),r=Number(i?.corp_general_workforce??2250),s=Number(i?.corp_skilled_workforce??600),o=Number(i?.corp_innovative_workforce??150),t=r+s+o,_=2,h=3,$=6,b=e("minimum_wage"),f=b/100*48e3,k=e("inflation"),M=e("standard_of_living"),c=1+(k-50)/100*.5,T=1+(M-50)/100*.5,C=v=>Math.round(f*v*c*T),E=C(_),I=C(h),u=C($),N=r*E,L=s*I,x=o*u,l=N+L+x;function g(v){return"$"+Math.round(v).toLocaleString()+"/yr"}const S=`${c.toFixed(2)} &times; ${T.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=t.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${y(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${_}.0 &times; ${S})</span>
                <span class="wf-tier__value">${g(E)}</span>
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
                    <span class="wf-tier__nation">${y(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${s.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${h}.0 &times; ${S})</span>
                <span class="wf-tier__value">${g(I)}</span>
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
                    <span class="wf-tier__nation">${y(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${o.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${$}.0 &times; ${S})</span>
                <span class="wf-tier__value">${g(u)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${p(x)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${y(d)})</span>
                <span class="wf-tier__value">${b}/100 → ${g(f)}</span>
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
                <span class="wf-total__value" style="color:var(--text-bright);">${t.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${p(l)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${p(l/12)}</span>
            </div>
        </div>
    `,{totalWages:l,generalTotal:N,skilledTotal:L,innovativeTotal:x,monthlyWages:Math.round(l/12)}}function et(a,n,i,e,d,r){const s=n?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+s;const o=5e7,t=w=>O(a,w),_=1+(t("gdp_growth")-50)/100*.4,h=1+(t("urbanization")-50)/100*.3,$=1+(t("population_growth")-50)/100*.2,b=1+(t("standard_of_living")-50)/100*.15,f=1+(50-t("physical_infrastructure"))/100*.1,k=1-Math.max(0,t("inflation")-50)/100*.1,M=1-Math.max(0,t("interest_rates")-50)/100*.1,c=_*h*$*b*f*k*M,T=Math.round(o*c),C=Math.round(T/12),E=0,I=0,u=E+I+C,N=i?.totalWages||0,L=Math.round(N/12),x=0,l=0,g=d||0,S=r||0,v=Number(e?.corp_loans)||0,A=.05,q=v>0?Math.round(v*(A/12)/(1-Math.pow(1+A/12,-120))):0,F=L+x+g+S+q+l,P=u-F,H=Number(e?.corp_cash_reserves??0),V=v,j=[{stat:"gdp_growth",value:t("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:t("urbanization"),weight:"0.3"},{stat:"population_growth",value:t("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:t("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:t("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:t("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:t("interest_rates"),weight:"-0.1",neg:!0}];function Y(w){return w.neg?w.value>50?"var(--red)":"var(--green)":w.note?w.value<50?"var(--green)":"var(--red)":w.value>=50?"var(--green)":w.value>=35?"var(--amber)":"var(--red)"}const D=u||1,G=(E/D*100).toFixed(1),K=(I/D*100).toFixed(1),Q=(C/D*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
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
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${p(E)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${p(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${p(C)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${p(u)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${p(L)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${p(x)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${p(g)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${p(S)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${p(q)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${p(l)}</span></div>
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
    `}function at(a){const n=a.toUpperCase(),i=[{label:"Reputation",value:65,change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:3e3,change:0,section:"Core"},{label:"Workforce Skill",value:50,change:0,decay:!0,max:100},{label:"Operational Efficiency",value:50,change:0,decay:!0,max:100},{label:"Market Share",value:5,change:0,nation:n,max:100,section:"Market & Financials"},{label:"Credit Rating",value:50,change:0,max:100},{label:"Regulatory Standing",value:50,change:0,nation:n,max:100,section:"Political Standing"},{label:"Political Influence",value:10,change:0,decay:!0,nation:n,max:100},{label:"Innovation",value:20,change:0,decay:!0,max:100,section:"Innovation"}];function e(s,o){if(!o||o>100)return"var(--text-primary)";const t=s/o*100;return t>=70?"var(--green)":t>=40?"var(--amber)":t>=20?"var(--orange, #d48a3c)":"var(--red)"}function d(s){const o=parseFloat(s),t=o>0?"var(--green)":o<0?"var(--red)":"var(--text-dim)",_=o>0?"▲":o<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${t}">${_}</span>
            <span class="stat-item__delta" style="color:${t}">${Math.abs(o).toFixed(1)}</span>
        </div>`}let r="";for(const s of i){if(s.isHero){r+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${s.label}</span>
                            ${s.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${s.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${d(s.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${s.value}%"></div></div>
                </div>`;continue}s.section&&(r+=`<div class="stats-section"><span class="stats-section__label">${s.section}</span></div>`);const o=s.max&&s.max<=100;r+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${s.label}</span>
                        ${s.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${s.nation?'<span class="stat-item__nation">'+y(s.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${o?e(s.value,s.max):"var(--text-primary)"}">${typeof s.value=="number"?s.value.toLocaleString():s.value}</span>
                    ${o?'<span class="stat-item__max">/100</span>':""}
                    ${d(s.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=r}async function nt(a,n,i,e){const d=(n||"UNKNOWN").toUpperCase();let r=[];if(i?.id){const{data:c}=await m.from("corp_properties").select("*").eq("faction_id",i.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});r=c||[]}const s={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let o=0,t=0;const _=5e7,h=1+(O(a,"inflation")-50)/100*.3,$=.8+O(a,"stability")/100*.4,b=Math.round(_*h*$),f=Math.round(b*.005);o+=b,t+=f;let k=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${y(d)} · Headquarters</div>
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
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${p(f)}</div>
            </div>
        </div>
    </div>`;for(const c of r){const T=s[c.style]||s.Basic;o+=Number(c.purchase_price||0),t+=Number(c.monthly_maintenance||0);const C=c.condition>=75?"var(--green)":c.condition>=50?"var(--amber)":"var(--orange)";k+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${y(c.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${y(c.city||d)} · ${(c.type||"").replace(/_/g," ")} · <span style="color:${T.color}">${(c.style||"Basic").toUpperCase()}</span></div>
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
                <span style="color:${C}">${c.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${c.condition}%;height:100%;background:${C};"></div></div>
        </div>`}const M=document.getElementById("prop-count");return M&&(M.textContent=r.length+1+" ASSET"+(r.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${k}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${p(o)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${p(t)}/mo</span>
            </div>
        </div>
    `,{propertyValue:o,propertyMaintenance:t}}function st(a,n,i,e,d){(n||"UNKNOWN").toUpperCase();const r=i.corp_company_type||"Private",s=Number(i.corp_cash_reserves)||0,o=d?.propertyValue||0,t=0,_=0,h=s+o+t+_,$=Number(i.corp_loans)||0,f=e?.monthlyWages||0,k=0,M=$+f+k,c=h-M,C=Math.round(c*(1+.3)),E=C-c,I=E>0;document.getElementById("val-type-badge").textContent=r.toUpperCase();function u(N,L,x={}){const l=x.indent?"val-line val-line--indent":"val-line",g=x.bold?"val-line__label val-line__label--bold":"val-line__label",S=x.bold?"val-line__value val-line__value--bold":"val-line__value",v=x.color||(x.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${l}"><span class="${g}">${N}</span><span class="${S}" style="color:${v}">${p(L)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${u("Cash & Reserves",s,{indent:!0})}
        ${u("Property",o,{indent:!0})}
        ${u("Equipment",t,{indent:!0})}
        ${u("Active Contracts",_,{indent:!0})}
        ${u("Total Assets",h,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${u("Outstanding Loans",$,{indent:!0})}
        ${u("Accounts Payable",f,{indent:!0})}
        ${u("Pending Project Costs",k,{indent:!0})}
        ${u("Total Liabilities",M,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${c>=0?"var(--green)":"var(--red)"};">${p(c)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${p(C)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${I?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${I?"var(--green)":"var(--red)"};">${I?"+":""}${p(E)}</span>
            </div>
            <div class="val-market__note">${I?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let U=null,W=null;function ot(){W&&clearInterval(W),W=setInterval(z,1e3),z()}function z(){const a=document.getElementById("tick-countdown");if(!a||!U){a&&(a.textContent="—");return}const n=U-Date.now();if(n<=0){a.textContent="Tick due...",clearInterval(W);return}const i=Math.floor(n/36e5),e=Math.floor(n%36e5/6e4),d=Math.floor(n%6e4/1e3);a.textContent=i+"h "+e+"m "+d+"s"}function it(){document.body.classList.toggle("light-mode");const a=document.getElementById("theme-toggle");a.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const a=document.getElementById("theme-toggle");a&&(a.textContent="Dark")}async function lt(){const a=document.getElementById("slogan-input"),n=document.getElementById("slogan-hint"),i=document.getElementById("slogan-save-btn"),e=(a.value||"").trim().slice(0,60);if(e.length===0){n.textContent="Slogan cannot be empty.",n.className="slogan-hint slogan-hint--error";return}i.disabled=!0,i.textContent="...",n.textContent="";try{const{error:d}=await m.from("factions").update({party_description:e,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(d)throw d;document.getElementById("id-slogan").textContent='"'+e+'"',n.textContent="Slogan saved! Next change in 120 ticks.",n.className="slogan-hint slogan-hint--ok",i.textContent="Save"}catch(d){console.error("Slogan save failed:",d),n.textContent="Failed to save slogan.",n.className="slogan-hint slogan-hint--error",i.disabled=!1,i.textContent="Save"}}async function rt(){await m.auth.signOut(),window.location.href="login.html"}function ct(){const a=document.getElementById("corp-faction-dropdown");a&&a.classList.toggle("open")}function dt(a,n){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.remove("open"),sessionStorage.setItem("active_faction_id",a),n==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",a=>{const n=document.getElementById("faction-switcher"),i=document.getElementById("corp-faction-dropdown");i&&n&&!n.contains(a.target)&&i.classList.remove("open")});window.doLogout=rt;window.toggleTheme=it;window.saveSlogan=lt;window.toggleCorpDropdown=ct;window.switchToFaction=dt;let R=!1;async function pt(){if(R){console.warn("Dissolve already in progress");return}const{data:{user:a}}=await m.auth.getUser();if(!a){alert("Not logged in.");return}const n=sessionStorage.getItem("active_faction_id");if(!n){alert("No active faction selected.");return}const{data:i,error:e}=await m.from("factions").select("*").eq("id",n).eq("faction_type","corporation").is("abandoned_at",null).single();if(e||!i){alert("No active corporation found. It may have already been dissolved."),console.error("Dissolve lookup failed:",e?.message,"factionId:",n);return}const r=i.faction_name||"this corporation";if(!confirm("DISSOLVE "+r.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all properties, equipment, and inventory
• Remove all cash reserves
• Outstanding debts and active projects will remain

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+r+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}R=!0;const o=document.getElementById("dissolve-btn");o&&(o.disabled=!0,o.textContent="DISSOLVING...",o.style.opacity="0.5");try{async function t(f){const{error:k}=await f;if(k)throw k}await t(m.from("contract_bids").delete().eq("faction_id",n)),await t(m.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",n).in("status",["open","bidding"])),await t(m.from("corp_equipment_deliveries").delete().eq("faction_id",n)),await t(m.from("corp_equipment").delete().eq("faction_id",n)),await t(m.from("corp_properties").delete().eq("faction_id",n)),await t(m.from("corp_material_inventory").delete().eq("faction_id",n)),await t(m.from("corp_warehouse").delete().eq("faction_id",n)),await t(m.from("factions").update({abandoned_at:new Date().toISOString(),corp_cash_reserves:0,corp_employees:0,action_points:0}).eq("id",n)),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:_,error:h}=await m.from("factions").select("id, faction_type").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`).is("abandoned_at",null);h&&console.warn("Failed to check remaining factions:",h.message);const $=(_||[]).find(f=>f.faction_type==="party"),b=(_||[]).find(f=>f.faction_type==="corporation");$?(sessionStorage.setItem("active_faction_id",$.id),alert(r+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):b?(sessionStorage.setItem("active_faction_id",b.id),alert(r+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(r+` has been dissolved.

You have no remaining factions.`),window.location.href="select-nation.html")}catch(t){alert("Dissolution failed: "+(t.message||t)+`

Please try again or contact support.`),o&&(o.disabled=!1,o.textContent="Dissolve Corporation",o.style.opacity="1")}finally{R=!1}}window.dissolveCorporation=pt;Z();
