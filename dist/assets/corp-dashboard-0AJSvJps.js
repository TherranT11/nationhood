import{_ as N}from"./supabase-client-BXEzLDpS.js";import{e as m}from"./utils-C2W-HleY.js";import{i as j}from"./messaging-5qyQ6ziq.js";let B=[];function c(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+Math.round(e).toLocaleString()}function D(e,n){return Number(e?.[n]??50)}async function G(){const{data:{user:e}}=await N.auth.getUser();if(!e){window.location.href="login.html";return}const{data:n}=await N.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);B=(n||[]).filter(s=>s.nation_id);const o=sessionStorage.getItem("active_faction_id");let a=B.find(s=>s.id===o)||B.find(s=>s.faction_type==="corporation")||B[0];if(!a){console.error("Corp dashboard: no factions found"),await N.auth.signOut(),window.location.href="login.html";return}if(a.faction_type!=="corporation"){window.location.href="dashboard.html";return}let r=a.nation||"",p=null;const[t,i]=await Promise.all([a.nation_id?N.from("nations").select("*").eq("id",a.nation_id).single():Promise.resolve({data:null}),N.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);t.error&&console.warn("Nation load failed:",t.error.message),t.data&&(r=t.data.name,p=t.data),i.error&&console.warn("Shard load failed:",i.error.message);const l=i.data,_=a.corp_ticker||a.abbreviation||"";if(document.getElementById("corp-logo").textContent=_.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=a.faction_name||"Unnamed Corp",l){if(document.getElementById("game-date").textContent=l.current_date||"—",document.getElementById("tick-number").textContent=l.current_tick||"—",l.next_tick_at){const f=(Number(l.tick_interval_hours)||8)*36e5,x=new Date(l.next_tick_at).getTime(),g=x-f+f/2;O=new Date(g>Date.now()?g:x+f/2),Z()}const s=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");s&&(s.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(_?"["+_+"]":a.faction_name||"Corp")+" ▾";const h=document.getElementById("topbar-cash");if(h){const s=Number(a.corp_cash_reserves??0),f=s>=1e9?"$"+(s/1e9).toFixed(1)+"B":s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k";h.textContent="CASH: "+f}const d=a.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+d+" AP</span>";const T=document.getElementById("corp-faction-dropdown");if(T){let s="";for(const v of B){const g=v.id===a.id,F=v.faction_type==="corporation"?"CORP":"PARTY",W=v.faction_type==="corporation"?"var(--teal)":"var(--amber)";s+=`<div class="corp-dd-item${g?" active":""}" onclick="switchToFaction('${v.id}', '${v.faction_type}')">
                <span class="corp-dd-type" style="color:${W}">${F}</span>
                <span class="corp-dd-name">${m(v.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${m(v.abbreviation||"—")}]</span>
            </div>`}B.some(v=>v.faction_type==="corporation")||(s+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),B.some(v=>v.faction_type==="party")||(s+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),T.innerHTML=s}document.getElementById("id-type-badge").textContent=a.corp_company_type||"—",document.getElementById("id-logo").textContent=_.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=a.faction_name||"Unnamed Corp";const w=a.party_description||"";document.getElementById("id-slogan").textContent=w?'"'+w+'"':'"--"';const S=l?.current_date?l.current_date.replace(/.*,\s*/,""):"—",L=a.leader_first_name&&a.leader_last_name?a.leader_first_name+" "+a.leader_last_name+(a.leader_age?" ("+a.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${m(S)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${m(r||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${m(a.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${m(a.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${m(L)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${m(a.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${m(_)}</span>
        </div>
    `;const b=a.last_rename_tick||0,C=l?.current_tick||0,$=Math.max(0,b+120-C),k=$<=0,u=document.getElementById("slogan-editor");u.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${m(w)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${k?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${k?"60 characters max. 120 tick cooldown after change.":$+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=a.id,window._currentTick=C;const I=K(p,r,a);Y(p,l,I,a),J(r);const M=await Q(p,r,a);X(p,r,a,I,M),j(a,p,l),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function K(e,n,o){const a=g=>D(e,g),r=(n||"UNKNOWN").toUpperCase(),p=Number(o?.corp_general_workforce??2250),t=Number(o?.corp_skilled_workforce??600),i=Number(o?.corp_innovative_workforce??150),l=p+t+i,_=2,h=3,d=6,T=a("minimum_wage"),w=T/100*48e3,S=a("inflation"),L=a("standard_of_living"),b=1+(S-50)/100*.5,C=1+(L-50)/100*.5,E=g=>Math.round(w*g*b*C),$=E(_),k=E(h),u=E(d),I=p*$,M=t*k,s=i*u,f=I+M+s;function x(g){return"$"+Math.round(g).toLocaleString()+"/yr"}const v=`${b.toFixed(2)} &times; ${C.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=l.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${m(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${p.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${_}.0 &times; ${v})</span>
                <span class="wf-tier__value">${x($)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(I)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${m(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${t.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${h}.0 &times; ${v})</span>
                <span class="wf-tier__value">${x(k)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(M)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${m(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${i.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${d}.0 &times; ${v})</span>
                <span class="wf-tier__value">${x(u)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(s)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${m(r)})</span>
                <span class="wf-tier__value">${T}/100 → ${x(w)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${b.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${C.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${l.toLocaleString()}</span>
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
    `,{totalWages:f,generalTotal:I,skilledTotal:M,innovativeTotal:s,monthlyWages:Math.round(f/12)}}function Y(e,n,o,a){const r=n?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+r;const p=5e7,t=y=>D(e,y),i=1+(t("gdp_growth")-50)/100*.4,l=1+(t("urbanization")-50)/100*.3,_=1+(t("population_growth")-50)/100*.2,h=1+(t("standard_of_living")-50)/100*.15,d=1+(50-t("physical_infrastructure"))/100*.1,T=1-Math.max(0,t("inflation")-50)/100*.1,w=1-Math.max(0,t("interest_rates")-50)/100*.1,S=i*l*_*h*d*T*w,L=Math.round(p*S),b=Math.round(L/12),C=0,E=0,$=C+E+b,k=o?.totalWages||0,u=Math.round(k/12),I=0,M=0,s=0,f=0,x=0,v=u+I+M+s+f+x,g=$-v,F=Number(a?.corp_cash_reserves??0),W=0,U=[{stat:"gdp_growth",value:t("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:t("urbanization"),weight:"0.3"},{stat:"population_growth",value:t("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:t("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:t("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:t("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:t("interest_rates"),weight:"-0.1",neg:!0}];function H(y){return y.neg?y.value>50?"var(--red)":"var(--green)":y.note?y.value<50?"var(--green)":"var(--red)":y.value>=50?"var(--green)":y.value>=35?"var(--amber)":"var(--red)"}const P=$||1,z=(C/P*100).toFixed(1),V=(E/P*100).toFixed(1),q=(b/P*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${z}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${V}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${q}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${c(C)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${c(E)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${c(b)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${c($)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${c(u)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${c(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Facilities</span><span class="fin-row__value" style="color:#a44">${c(M)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${c(s)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${c(f)}</span></div>
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
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${c(F)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${c(W)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${U.map(y=>`
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
                <span class="drv-multiplier__value">&times;${S.toFixed(2)}</span>
            </div>
        </div>
    `}function J(e){const n=e.toUpperCase(),o=[{label:"Reputation",value:65,change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:3e3,change:0,section:"Core"},{label:"Workforce Skill",value:50,change:0,decay:!0,max:100},{label:"Operational Efficiency",value:50,change:0,decay:!0,max:100},{label:"Market Share",value:5,change:0,nation:n,max:100,section:"Market & Financials"},{label:"Credit Rating",value:50,change:0,max:100},{label:"Regulatory Standing",value:50,change:0,nation:n,max:100,section:"Political Standing"},{label:"Political Influence",value:10,change:0,decay:!0,nation:n,max:100},{label:"Innovation",value:20,change:0,decay:!0,max:100,section:"Innovation"}];function a(t,i){if(!i||i>100)return"var(--text-primary)";const l=t/i*100;return l>=70?"var(--green)":l>=40?"var(--amber)":l>=20?"var(--orange, #d48a3c)":"var(--red)"}function r(t){const i=parseFloat(t),l=i>0?"var(--green)":i<0?"var(--red)":"var(--text-dim)",_=i>0?"▲":i<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${l}">${_}</span>
            <span class="stat-item__delta" style="color:${l}">${Math.abs(i).toFixed(1)}</span>
        </div>`}let p="";for(const t of o){if(t.isHero){p+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${t.label}</span>
                            ${t.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${t.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${r(t.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${t.value}%"></div></div>
                </div>`;continue}t.section&&(p+=`<div class="stats-section"><span class="stats-section__label">${t.section}</span></div>`);const i=t.max&&t.max<=100;p+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${t.label}</span>
                        ${t.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${t.nation?'<span class="stat-item__nation">'+m(t.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${i?a(t.value,t.max):"var(--text-primary)"}">${typeof t.value=="number"?t.value.toLocaleString():t.value}</span>
                    ${i?'<span class="stat-item__max">/100</span>':""}
                    ${r(t.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=p}async function Q(e,n,o,a){const r=(n||"UNKNOWN").toUpperCase();let p=[];if(o?.id){const{data:d}=await N.from("corp_properties").select("*").eq("faction_id",o.id).eq("is_active",!0).order("purchased_at_tick",{ascending:!1});p=d||[]}const t={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let i=0,l=0,_="";p.length===0&&(_='<div style="padding:20px;text-align:center;font-size:11px;color:var(--text-dim);">No properties owned.<br>Visit the Expansion tab to purchase.</div>');for(const d of p){const T=t[d.style]||t.Basic;i+=Number(d.purchase_price||0),l+=Number(d.monthly_maintenance||0);const w=d.condition>=75?"var(--green)":d.condition>=50?"var(--amber)":"var(--orange)";_+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${m(d.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${m(d.city||r)} · ${(d.type||"").replace(/_/g," ")} · <span style="color:${T.color}">${(d.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge">OWNED</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${(d.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c(d.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(d.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${w}">${d.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${d.condition}%;height:100%;background:${w};"></div></div>
        </div>`}const h=document.getElementById("prop-count");return h&&(h.textContent=p.length+" ASSET"+(p.length!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${_}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${c(i)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(l)}/mo</span>
            </div>
        </div>
    `,{propertyValue:i}}function X(e,n,o,a,r){(n||"UNKNOWN").toUpperCase();const p=o.corp_company_type||"Private",t=Number(o.corp_cash_reserves)||0,i=r?.propertyValue||0,l=0,_=0,h=t+i+l+_,d=Number(o.corp_loans)||0,w=a?.monthlyWages||0,S=0,L=d+w+S,b=h-L,E=Math.round(b*(1+.3)),$=E-b,k=$>0;document.getElementById("val-type-badge").textContent=p.toUpperCase();function u(I,M,s={}){const f=s.indent?"val-line val-line--indent":"val-line",x=s.bold?"val-line__label val-line__label--bold":"val-line__label",v=s.bold?"val-line__value val-line__value--bold":"val-line__value",g=s.color||(s.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${f}"><span class="${x}">${I}</span><span class="${v}" style="color:${g}">${c(M)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${u("Cash & Reserves",t,{indent:!0})}
        ${u("Property",i,{indent:!0})}
        ${u("Equipment",l,{indent:!0})}
        ${u("Active Contracts",_,{indent:!0})}
        ${u("Total Assets",h,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${u("Outstanding Loans",d,{indent:!0})}
        ${u("Accounts Payable",w,{indent:!0})}
        ${u("Pending Project Costs",S,{indent:!0})}
        ${u("Total Liabilities",L,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${b>=0?"var(--green)":"var(--red)"};">${c(b)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${c(E)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${k?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${k?"var(--green)":"var(--red)"};">${k?"+":""}${c($)}</span>
            </div>
            <div class="val-market__note">${k?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let O=null,A=null;function Z(){A&&clearInterval(A),A=setInterval(R,1e3),R()}function R(){const e=document.getElementById("tick-countdown");if(!e||!O){e&&(e.textContent="—");return}const n=O-Date.now();if(n<=0){e.textContent="Tick due...",clearInterval(A);return}const o=Math.floor(n/36e5),a=Math.floor(n%36e5/6e4),r=Math.floor(n%6e4/1e3);e.textContent=o+"h "+a+"m "+r+"s"}function tt(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const e=document.getElementById("theme-toggle");e&&(e.textContent="Dark")}async function at(){const e=document.getElementById("slogan-input"),n=document.getElementById("slogan-hint"),o=document.getElementById("slogan-save-btn"),a=(e.value||"").trim().slice(0,60);if(a.length===0){n.textContent="Slogan cannot be empty.",n.className="slogan-hint slogan-hint--error";return}o.disabled=!0,o.textContent="...",n.textContent="";try{const{error:r}=await N.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(r)throw r;document.getElementById("id-slogan").textContent='"'+a+'"',n.textContent="Slogan saved! Next change in 120 ticks.",n.className="slogan-hint slogan-hint--ok",o.textContent="Save"}catch(r){console.error("Slogan save failed:",r),n.textContent="Failed to save slogan.",n.className="slogan-hint slogan-hint--error",o.disabled=!1,o.textContent="Save"}}async function et(){await N.auth.signOut(),window.location.href="login.html"}function nt(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function st(e,n){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),n==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const n=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&n&&!n.contains(e.target)&&o.classList.remove("open")});window.doLogout=et;window.toggleTheme=tt;window.saveSlogan=at;window.toggleCorpDropdown=nt;window.switchToFaction=st;G();
