import{_ as N}from"./supabase-client-BXEzLDpS.js";import{e as _}from"./utils-C2W-HleY.js";import{initMessaging as j}from"./messaging-B5Fng3EZ.js";let B=[];function c(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+Math.round(e).toLocaleString()}function F(e,n){return Number(e?.[n]??50)}async function Y(){const{data:{user:e}}=await N.auth.getUser();if(!e){window.location.href="login.html";return}const{data:n}=await N.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);B=(n||[]).filter(s=>s.nation_id);const i=sessionStorage.getItem("active_faction_id");let a=B.find(s=>s.id===i)||B.find(s=>s.faction_type==="corporation")||B[0];if(!a){console.error("Corp dashboard: no factions found"),await N.auth.signOut(),window.location.href="login.html";return}if(a.faction_type!=="corporation"){window.location.href="dashboard.html";return}let d=a.nation||"",p=null;const[t,l]=await Promise.all([a.nation_id?N.from("nations").select("*").eq("id",a.nation_id).single():Promise.resolve({data:null}),N.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);t.error&&console.warn("Nation load failed:",t.error.message),t.data&&(d=t.data.name,p=t.data),l.error&&console.warn("Shard load failed:",l.error.message);const r=l.data,m=a.corp_ticker||a.abbreviation||"";if(document.getElementById("corp-logo").textContent=m.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=a.faction_name||"Unnamed Corp",r){if(document.getElementById("game-date").textContent=r.current_date||"—",document.getElementById("tick-number").textContent=r.current_tick||"—",r.next_tick_at){const u=(Number(r.tick_interval_hours)||8)*36e5,x=new Date(r.next_tick_at).getTime(),g=x-u+u/2;R=new Date(g>Date.now()?g:x+u/2),Z()}const s=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");s&&(s.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(m?"["+m+"]":a.faction_name||"Corp")+" ▾";const $=document.getElementById("topbar-cash");if($){const s=Number(a.corp_cash_reserves??0),u=s>=1e9?"$"+(s/1e9).toFixed(1)+"B":s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k";$.textContent="CASH: "+u}const M=a.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+M+" AP</span>";const k=document.getElementById("corp-faction-dropdown");if(k){let s="";for(const v of B){const g=v.id===a.id,W=v.faction_type==="corporation"?"CORP":"PARTY",P=v.faction_type==="corporation"?"var(--teal)":"var(--amber)";s+=`<div class="corp-dd-item${g?" active":""}" onclick="switchToFaction('${v.id}', '${v.faction_type}')">
                <span class="corp-dd-type" style="color:${P}">${W}</span>
                <span class="corp-dd-name">${_(v.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${_(v.abbreviation||"—")}]</span>
            </div>`}B.some(v=>v.faction_type==="corporation")||(s+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),B.some(v=>v.faction_type==="party")||(s+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),k.innerHTML=s}document.getElementById("id-type-badge").textContent=a.corp_company_type||"—",document.getElementById("id-logo").textContent=m.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=a.faction_name||"Unnamed Corp";const w=a.party_description||"";document.getElementById("id-slogan").textContent=w?'"'+w+'"':'"--"';const C=r?.current_date?r.current_date.replace(/.*,\s*/,""):"—",T=a.leader_first_name&&a.leader_last_name?a.leader_first_name+" "+a.leader_last_name+(a.leader_age?" ("+a.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${_(C)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${_(d||"—")}</span>
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
            <span class="id-row__value">${_(T)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${_(a.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${_(m)}</span>
        </div>
    `;const o=a.last_rename_tick||0,h=r?.current_tick||0,E=Math.max(0,o+120-h),I=E<=0,f=document.getElementById("slogan-editor");f.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${_(w)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${I?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${I?"60 characters max. 120 tick cooldown after change.":E+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=a.id,window._currentTick=h;const S=G(p,d,a);K(p,r,S,a),Q(d);const L=await J(p,d,a);X(p,d,a,S,L),j(a,p,r),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function G(e,n,i){const a=g=>F(e,g),d=(n||"UNKNOWN").toUpperCase(),p=Number(i?.corp_general_workforce??2250),t=Number(i?.corp_skilled_workforce??600),l=Number(i?.corp_innovative_workforce??150),r=p+t+l,m=2,$=3,M=6,k=a("minimum_wage"),w=k/100*48e3,C=a("inflation"),T=a("standard_of_living"),o=1+(C-50)/100*.5,h=1+(T-50)/100*.5,b=g=>Math.round(w*g*o*h),E=b(m),I=b($),f=b(M),S=p*E,L=t*I,s=l*f,u=S+L+s;function x(g){return"$"+Math.round(g).toLocaleString()+"/yr"}const v=`${o.toFixed(2)} &times; ${h.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=r.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${_(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${p.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${m}.0 &times; ${v})</span>
                <span class="wf-tier__value">${x(E)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(S)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${_(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${t.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${$}.0 &times; ${v})</span>
                <span class="wf-tier__value">${x(I)}</span>
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
                    <span class="wf-tier__nation">${_(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${M}.0 &times; ${v})</span>
                <span class="wf-tier__value">${x(f)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(s)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${_(d)})</span>
                <span class="wf-tier__value">${k}/100 → ${x(w)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${o.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${h.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${c(u)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${c(u/12)}</span>
            </div>
        </div>
    `,{totalWages:u,generalTotal:S,skilledTotal:L,innovativeTotal:s,monthlyWages:Math.round(u/12)}}function K(e,n,i,a){const d=n?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+d;const p=5e7,t=y=>F(e,y),l=1+(t("gdp_growth")-50)/100*.4,r=1+(t("urbanization")-50)/100*.3,m=1+(t("population_growth")-50)/100*.2,$=1+(t("standard_of_living")-50)/100*.15,M=1+(50-t("physical_infrastructure"))/100*.1,k=1-Math.max(0,t("inflation")-50)/100*.1,w=1-Math.max(0,t("interest_rates")-50)/100*.1,C=l*r*m*$*M*k*w,T=Math.round(p*C),o=Math.round(T/12),h=0,b=0,E=h+b+o,I=i?.totalWages||0,f=Math.round(I/12),S=0,L=0,s=0,u=0,x=0,v=f+S+L+s+u+x,g=E-v,W=Number(a?.corp_cash_reserves??0),P=0,z=[{stat:"gdp_growth",value:t("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:t("urbanization"),weight:"0.3"},{stat:"population_growth",value:t("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:t("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:t("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:t("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:t("interest_rates"),weight:"-0.1",neg:!0}];function H(y){return y.neg?y.value>50?"var(--red)":"var(--green)":y.note?y.value<50?"var(--green)":"var(--red)":y.value>=50?"var(--green)":y.value>=35?"var(--amber)":"var(--red)"}const O=E||1,q=(h/O*100).toFixed(1),U=(b/O*100).toFixed(1),V=(o/O*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${q}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${U}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${V}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${c(h)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${c(b)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${c(o)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${c(E)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${c(f)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${c(S)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Facilities</span><span class="fin-row__value" style="color:#a44">${c(L)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${c(s)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${c(u)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${c(x)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${c(v)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${g>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${g>=0?"var(--green)":"var(--red)"}">${c(g)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${c(W)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${c(P)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${z.map(y=>`
                <div class="drv-row">
                    <span class="drv-row__name">${y.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${y.value}%;background:${H(y)}"></div></div>
                    <span class="drv-row__val">${y.value}</span>
                    <span class="drv-row__wt">&times;${y.weight}</span>
                    ${y.note?'<span class="drv-row__note">'+y.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${C.toFixed(2)}</span>
            </div>
        </div>
    `}function Q(e){const n=e.toUpperCase(),i=[{label:"Reputation",value:65,change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:3e3,change:0,section:"Core"},{label:"Workforce Skill",value:50,change:0,decay:!0,max:100},{label:"Operational Efficiency",value:50,change:0,decay:!0,max:100},{label:"Market Share",value:5,change:0,nation:n,max:100,section:"Market & Financials"},{label:"Credit Rating",value:50,change:0,max:100},{label:"Regulatory Standing",value:50,change:0,nation:n,max:100,section:"Political Standing"},{label:"Political Influence",value:10,change:0,decay:!0,nation:n,max:100},{label:"Innovation",value:20,change:0,decay:!0,max:100,section:"Innovation"}];function a(t,l){if(!l||l>100)return"var(--text-primary)";const r=t/l*100;return r>=70?"var(--green)":r>=40?"var(--amber)":r>=20?"var(--orange, #d48a3c)":"var(--red)"}function d(t){const l=parseFloat(t),r=l>0?"var(--green)":l<0?"var(--red)":"var(--text-dim)",m=l>0?"▲":l<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${r}">${m}</span>
            <span class="stat-item__delta" style="color:${r}">${Math.abs(l).toFixed(1)}</span>
        </div>`}let p="";for(const t of i){if(t.isHero){p+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${t.label}</span>
                            ${t.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${t.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${d(t.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${t.value}%"></div></div>
                </div>`;continue}t.section&&(p+=`<div class="stats-section"><span class="stats-section__label">${t.section}</span></div>`);const l=t.max&&t.max<=100;p+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${t.label}</span>
                        ${t.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${t.nation?'<span class="stat-item__nation">'+_(t.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${l?a(t.value,t.max):"var(--text-primary)"}">${typeof t.value=="number"?t.value.toLocaleString():t.value}</span>
                    ${l?'<span class="stat-item__max">/100</span>':""}
                    ${d(t.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=p}async function J(e,n,i,a){const d=(n||"UNKNOWN").toUpperCase();let p=[];if(i?.id){const{data:o}=await N.from("corp_properties").select("*").eq("faction_id",i.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});p=o||[]}const t={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,r=0;const m=3e8,$=1+(F(e,"inflation")-50)/100*.3,M=.8+F(e,"stability")/100*.4,k=Math.round(m*$*M),w=Math.round(k*.005);l+=k,r+=w;let C=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${_(d)} · Headquarters</div>
            </div>
            <span class="prop-asset__badge">HQ</span>
        </div>
        <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">3,000</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c(k)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(w)}</div>
            </div>
        </div>
    </div>`;for(const o of p){const h=t[o.style]||t.Basic;l+=Number(o.purchase_price||0),r+=Number(o.monthly_maintenance||0);const b=o.condition>=75?"var(--green)":o.condition>=50?"var(--amber)":"var(--orange)";C+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${_(o.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${_(o.city||d)} · ${(o.type||"").replace(/_/g," ")} · <span style="color:${h.color}">${(o.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge">OWNED</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${(o.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c(o.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(o.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${b}">${o.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${o.condition}%;height:100%;background:${b};"></div></div>
        </div>`}const T=document.getElementById("prop-count");return T&&(T.textContent=p.length+1+" ASSET"+(p.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${C}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${c(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(r)}/mo</span>
            </div>
        </div>
    `,{propertyValue:l}}function X(e,n,i,a,d){(n||"UNKNOWN").toUpperCase();const p=i.corp_company_type||"Private",t=Number(i.corp_cash_reserves)||0,l=d?.propertyValue||0,r=0,m=0,$=t+l+r+m,M=Number(i.corp_loans)||0,w=a?.monthlyWages||0,C=0,T=M+w+C,o=$-T,b=Math.round(o*(1+.3)),E=b-o,I=E>0;document.getElementById("val-type-badge").textContent=p.toUpperCase();function f(S,L,s={}){const u=s.indent?"val-line val-line--indent":"val-line",x=s.bold?"val-line__label val-line__label--bold":"val-line__label",v=s.bold?"val-line__value val-line__value--bold":"val-line__value",g=s.color||(s.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${u}"><span class="${x}">${S}</span><span class="${v}" style="color:${g}">${c(L)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${f("Cash & Reserves",t,{indent:!0})}
        ${f("Property",l,{indent:!0})}
        ${f("Equipment",r,{indent:!0})}
        ${f("Active Contracts",m,{indent:!0})}
        ${f("Total Assets",$,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${f("Outstanding Loans",M,{indent:!0})}
        ${f("Accounts Payable",w,{indent:!0})}
        ${f("Pending Project Costs",C,{indent:!0})}
        ${f("Total Liabilities",T,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${o>=0?"var(--green)":"var(--red)"};">${c(o)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${c(b)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${I?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${I?"var(--green)":"var(--red)"};">${I?"+":""}${c(E)}</span>
            </div>
            <div class="val-market__note">${I?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let R=null,A=null;function Z(){A&&clearInterval(A),A=setInterval(D,1e3),D()}function D(){const e=document.getElementById("tick-countdown");if(!e||!R){e&&(e.textContent="—");return}const n=R-Date.now();if(n<=0){e.textContent="Tick due...",clearInterval(A);return}const i=Math.floor(n/36e5),a=Math.floor(n%36e5/6e4),d=Math.floor(n%6e4/1e3);e.textContent=i+"h "+a+"m "+d+"s"}function tt(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}async function at(){const e=document.getElementById("slogan-input"),n=document.getElementById("slogan-hint"),i=document.getElementById("slogan-save-btn"),a=(e.value||"").trim().slice(0,60);if(a.length===0){n.textContent="Slogan cannot be empty.",n.className="slogan-hint slogan-hint--error";return}i.disabled=!0,i.textContent="...",n.textContent="";try{const{error:d}=await N.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(d)throw d;document.getElementById("id-slogan").textContent='"'+a+'"',n.textContent="Slogan saved! Next change in 120 ticks.",n.className="slogan-hint slogan-hint--ok",i.textContent="Save"}catch(d){console.error("Slogan save failed:",d),n.textContent="Failed to save slogan.",n.className="slogan-hint slogan-hint--error",i.disabled=!1,i.textContent="Save"}}async function et(){await N.auth.signOut(),window.location.href="login.html"}function nt(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function st(e,n){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),n==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const n=document.getElementById("faction-switcher"),i=document.getElementById("corp-faction-dropdown");i&&n&&!n.contains(e.target)&&i.classList.remove("open")});window.doLogout=et;window.toggleTheme=tt;window.saveSlogan=at;window.toggleCorpDropdown=nt;window.switchToFaction=st;Y();
