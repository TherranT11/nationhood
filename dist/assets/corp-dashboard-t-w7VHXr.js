import{_ as u}from"./supabase-client-BXEzLDpS.js";import{e as y}from"./utils-C2W-HleY.js";import{initMessaging as J}from"./messaging-B5Fng3EZ.js";import{c as X}from"./equipment-DsuDdEne.js";let q=[];function c(n){return Math.abs(n)>=1e6?"$"+(n/1e6).toFixed(2)+"M":Math.abs(n)>=1e3?"$"+(n/1e3).toFixed(1)+"k":"$"+Math.round(n).toLocaleString()}function P(n,a){return Number(n?.[a]??50)}async function Z(){const{data:{user:n}}=await u.auth.getUser();if(!n){window.location.href="login.html";return}const{data:a}=await u.from("factions").select("*").or(`id.eq.${n.id},linked_user_id.eq.${n.id}`);q=(a||[]).filter(r=>r.nation_id&&!r.abandoned_at);const o=sessionStorage.getItem("active_faction_id");let e=q.find(r=>r.id===o)||q.find(r=>r.faction_type==="corporation")||q[0];if(!e){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",e.id),e.faction_type!=="corporation"){window.location.href="dashboard.html";return}let d=e.nation||"",p=null;const[f,l]=await Promise.all([e.nation_id?u.from("nations").select("*").eq("id",e.nation_id).single():Promise.resolve({data:null}),u.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);f.error&&console.warn("Nation load failed:",f.error.message),f.data&&(d=f.data.name,p=f.data),l.error&&console.warn("Shard load failed:",l.error.message);const t=l.data,i=e.corp_ticker||e.abbreviation||"";if(document.getElementById("corp-logo").textContent=i.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=e.faction_name||"Unnamed Corp",t){if(document.getElementById("game-date").textContent=t.current_date||"—",document.getElementById("tick-number").textContent=t.current_tick||"—",t.next_tick_at){const b=(Number(t.tick_interval_hours)||8)*36e5,C=new Date(t.next_tick_at).getTime(),B=C-b+b/2;z=new Date(B>Date.now()?B:C+b/2),st()}const r=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");r&&(r.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(i?"["+i+"]":e.faction_name||"Corp")+" ▾";const v=document.getElementById("topbar-cash");if(v){const r=Number(e.corp_cash_reserves??0),b=r>=1e9?"$"+(r/1e9).toFixed(1)+"B":r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k";v.textContent="CASH: "+b}const m=e.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+m+" AP</span>";const E=document.getElementById("corp-faction-dropdown");if(E){let r="";for(const I of q){const B=I.id===e.id,W=I.faction_type==="corporation"?"CORP":"PARTY",F=I.faction_type==="corporation"?"var(--teal)":"var(--amber)";r+=`<div class="corp-dd-item${B?" active":""}" onclick="switchToFaction('${I.id}', '${I.faction_type}')">
                <span class="corp-dd-type" style="color:${F}">${W}</span>
                <span class="corp-dd-name">${y(I.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${y(I.abbreviation||"—")}]</span>
            </div>`}q.some(I=>I.faction_type==="corporation")||(r+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),q.some(I=>I.faction_type==="party")||(r+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),E.innerHTML=r}document.getElementById("id-type-badge").textContent=e.corp_company_type||"—",document.getElementById("id-logo").textContent=i.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=e.faction_name||"Unnamed Corp";const _=e.party_description||"";document.getElementById("id-slogan").textContent=_?'"'+_+'"':'"--"';const N=t?.current_date?t.current_date.replace(/.*,\s*/,""):"—",A=e.leader_first_name&&e.leader_last_name?e.leader_first_name+" "+e.leader_last_name+(e.leader_age?" ("+e.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${y(N)}</span>
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
            <span class="id-row__value">${y(A)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${y(e.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${y(i)}</span>
        </div>
    `;const w=e.last_rename_tick||0,L=t?.current_tick||0,x=Math.max(0,w+120-L),s=!_||_==="-"||_==='"-"'||x<=0,T=document.getElementById("slogan-editor");T.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${y(_)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${s?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${s?"60 characters max. 120 tick cooldown after change.":x+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=e.id,window._currentTick=L;const M=tt(p,d,e);at(d,e);const g=await nt(p,d,e);let k=0;if(e?.id){const{data:r,error:b}=await u.from("corp_equipment").select("equipment_key, owned").eq("faction_id",e.id);b||(k=X(r||[]))}et(p,t,M,e,g.propertyMaintenance||0,k),ot(p,d,e,M,g),J(e,p,t),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function tt(n,a,o){const e=C=>P(n,C),d=(a||"UNKNOWN").toUpperCase(),p=Number(o?.corp_general_workforce??2250),f=Number(o?.corp_skilled_workforce??600),l=Number(o?.corp_innovative_workforce??150),t=p+f+l,i=2,v=3,m=6,E=e("minimum_wage"),_=E/100*48e3,N=e("inflation"),A=e("standard_of_living"),w=1+(N-50)/100*.5,L=1+(A-50)/100*.5,S=C=>Math.round(_*C*w*L),x=S(i),$=S(v),s=S(m),T=p*x,M=f*$,g=l*s,k=T+M+g;function r(C){return"$"+Math.round(C).toLocaleString()+"/yr"}const b=`${w.toFixed(2)} &times; ${L.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=t.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${y(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${p.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${i}.0 &times; ${b})</span>
                <span class="wf-tier__value">${r(x)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(T)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${y(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${f.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${v}.0 &times; ${b})</span>
                <span class="wf-tier__value">${r($)}</span>
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
                    <span class="wf-tier__nation">${y(d)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${m}.0 &times; ${b})</span>
                <span class="wf-tier__value">${r(s)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${c(g)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${y(d)})</span>
                <span class="wf-tier__value">${E}/100 → ${r(_)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${w.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${L.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${t.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${c(k)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${c(k/12)}</span>
            </div>
        </div>
    `,{totalWages:k,generalTotal:T,skilledTotal:M,innovativeTotal:g,monthlyWages:Math.round(k/12)}}function et(n,a,o,e,d,p){const f=a?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+f;const l=5e7,t=h=>P(n,h),i=1+(t("gdp_growth")-50)/100*.4,v=1+(t("urbanization")-50)/100*.3,m=1+(t("population_growth")-50)/100*.2,E=1+(t("standard_of_living")-50)/100*.15,_=1+(50-t("physical_infrastructure"))/100*.1,N=1-Math.max(0,t("inflation")-50)/100*.1,A=1-Math.max(0,t("interest_rates")-50)/100*.1,w=i*v*m*E*_*N*A,L=Math.round(l*w),S=Math.round(L/12),x=0,$=0,s=x+$+S,T=o?.totalWages||0,M=Math.round(T/12),g=0,k=0,r=d||0,b=p||0,C=Number(e?.corp_loans)||0,I=.05,B=C>0?Math.round(C*(I/12)/(1-Math.pow(1+I/12,-120))):0,W=M+g+r+b+B+k,F=s-W,H=Number(e?.corp_cash_reserves??0),V=C,j=[{stat:"gdp_growth",value:t("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:t("urbanization"),weight:"0.3"},{stat:"population_growth",value:t("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:t("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:t("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:t("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:t("interest_rates"),weight:"-0.1",neg:!0}];function K(h){return h.neg?h.value>50?"var(--red)":"var(--green)":h.note?h.value<50?"var(--green)":"var(--red)":h.value>=50?"var(--green)":h.value>=35?"var(--amber)":"var(--red)"}const R=s||1,Y=(x/R*100).toFixed(1),G=($/R*100).toFixed(1),Q=(S/R*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${Y}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${G}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${Q}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${c(x)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${c($)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${c(S)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${c(s)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${c(M)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${c(g)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${c(r)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${c(b)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${c(B)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${c(k)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${c(W)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${F>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${F>=0?"var(--green)":"var(--red)"}">${c(F)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${c(H)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${c(V)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${j.map(h=>`
                <div class="drv-row">
                    <span class="drv-row__name">${h.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${h.value}%;background:${K(h)}"></div></div>
                    <span class="drv-row__val">${h.value}</span>
                    <span class="drv-row__wt">&times;${h.weight}</span>
                    ${h.note?'<span class="drv-row__note">'+h.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${w.toFixed(2)}</span>
            </div>
        </div>
    `}function at(n,a){const o=(n||"").toUpperCase(),e=Number(a.corp_general_workforce??0)+Number(a.corp_skilled_workforce??0)+Number(a.corp_innovative_workforce??0),d=[{label:"Reputation",value:Number(a.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:e||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(a.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(a.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(a.corp_market_share??5),change:0,nation:o,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(a.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(a.corp_regulatory_standing??50),change:0,nation:o,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(a.corp_political_influence??10),change:0,decay:!0,nation:o,max:100},{label:"Innovation",value:Number(a.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function p(t,i){if(!i||i>100)return"var(--text-primary)";const v=t/i*100;return v>=70?"var(--green)":v>=40?"var(--amber)":v>=20?"var(--orange, #d48a3c)":"var(--red)"}function f(t){const i=parseFloat(t),v=i>0?"var(--green)":i<0?"var(--red)":"var(--text-dim)",m=i>0?"▲":i<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${v}">${m}</span>
            <span class="stat-item__delta" style="color:${v}">${Math.abs(i).toFixed(1)}</span>
        </div>`}let l="";for(const t of d){if(t.isHero){l+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${t.label}</span>
                            ${t.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${t.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${f(t.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${t.value}%"></div></div>
                </div>`;continue}t.section&&(l+=`<div class="stats-section"><span class="stats-section__label">${t.section}</span></div>`);const i=t.max&&t.max<=100;l+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${t.label}</span>
                        ${t.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${t.nation?'<span class="stat-item__nation">'+y(t.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${i?p(t.value,t.max):"var(--text-primary)"}">${typeof t.value=="number"?t.value.toLocaleString():t.value}</span>
                    ${i?'<span class="stat-item__max">/100</span>':""}
                    ${f(t.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=l}async function nt(n,a,o,e){const d=(a||"UNKNOWN").toUpperCase();let p=[];if(o?.id){const{data:s}=await u.from("corp_properties").select("*").eq("faction_id",o.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});p=s||[]}const f={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,t=0;const i=Number(o?.corp_general_workforce??0)+Number(o?.corp_skilled_workforce??0)+Number(o?.corp_innovative_workforce??0),v=500,m=v+p.reduce((s,T)=>s+Number(T.capacity||0),0),E=m>0?Math.round(i*(v/m)):i,_=5e7,N=1+(P(n,"inflation")-50)/100*.3,A=.8+P(n,"stability")/100*.4,w=Math.round(_*N*A),L=Math.round(w*.005);l+=w,t+=L;let S=`
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
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${v}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${E.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c(w)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(L)}</div>
            </div>
        </div>
    </div>`,x=E;for(const s of p){const T=f[s.style]||f.Basic;l+=Number(s.purchase_price||0),t+=Number(s.monthly_maintenance||0);const M=s.condition>=75?"var(--green)":s.condition>=50?"var(--amber)":"var(--orange)",g=Number(s.capacity||0),k=m>0?Math.min(i-x,Math.round(i*(g/m))):0;x+=k,S+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${y(s.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${y(s.city||d)} · ${(s.type||"").replace(/_/g," ")} · <span style="color:${T.color}">${(s.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge">OWNED</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${g.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${k.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${c(s.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(s.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${M}">${s.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${s.condition}%;height:100%;background:${M};"></div></div>
        </div>`}const $=document.getElementById("prop-count");return $&&($.textContent=p.length+1+" ASSET"+(p.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${S}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${c(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${c(t)}/mo</span>
            </div>
        </div>
    `,{propertyValue:l,propertyMaintenance:t}}function ot(n,a,o,e,d){(a||"UNKNOWN").toUpperCase();const p=o.corp_company_type||"Private",f=Number(o.corp_cash_reserves)||0,l=d?.propertyValue||0,t=0,i=0,v=f+l+t+i,m=Number(o.corp_loans)||0,_=e?.monthlyWages||0,N=0,A=m+_+N,w=v-A,S=Math.round(w*(1+.3)),x=S-w,$=x>0;document.getElementById("val-type-badge").textContent=p.toUpperCase();function s(T,M,g={}){const k=g.indent?"val-line val-line--indent":"val-line",r=g.bold?"val-line__label val-line__label--bold":"val-line__label",b=g.bold?"val-line__value val-line__value--bold":"val-line__value",C=g.color||(g.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${k}"><span class="${r}">${T}</span><span class="${b}" style="color:${C}">${c(M)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${s("Cash & Reserves",f,{indent:!0})}
        ${s("Property",l,{indent:!0})}
        ${s("Equipment",t,{indent:!0})}
        ${s("Active Contracts",i,{indent:!0})}
        ${s("Total Assets",v,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${s("Outstanding Loans",m,{indent:!0})}
        ${s("Accounts Payable",_,{indent:!0})}
        ${s("Pending Project Costs",N,{indent:!0})}
        ${s("Total Liabilities",A,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${w>=0?"var(--green)":"var(--red)"};">${c(w)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${c(S)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${$?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${$?"var(--green)":"var(--red)"};">${$?"+":""}${c(x)}</span>
            </div>
            <div class="val-market__note">${$?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let z=null,O=null;function st(){O&&clearInterval(O),O=setInterval(U,1e3),U()}function U(){const n=document.getElementById("tick-countdown");if(!n||!z){n&&(n.textContent="—");return}const a=z-Date.now();if(a<=0){n.textContent="Tick due...",clearInterval(O);return}const o=Math.floor(a/36e5),e=Math.floor(a%36e5/6e4),d=Math.floor(a%6e4/1e3);n.textContent=o+"h "+e+"m "+d+"s"}function it(){document.body.classList.toggle("light-mode");const n=document.getElementById("theme-toggle");n.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const n=document.getElementById("theme-toggle");n&&(n.textContent="Dark")}async function rt(){const n=document.getElementById("slogan-input"),a=document.getElementById("slogan-hint"),o=document.getElementById("slogan-save-btn"),e=(n.value||"").trim().slice(0,60);if(e.length===0){a.textContent="Slogan cannot be empty.",a.className="slogan-hint slogan-hint--error";return}o.disabled=!0,o.textContent="...",a.textContent="";try{const{error:d}=await u.from("factions").update({party_description:e,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(d)throw d;document.getElementById("id-slogan").textContent='"'+e+'"',a.textContent="Slogan saved! Next change in 120 ticks.",a.className="slogan-hint slogan-hint--ok",o.textContent="Save"}catch(d){console.error("Slogan save failed:",d),a.textContent="Failed to save slogan.",a.className="slogan-hint slogan-hint--error",o.disabled=!1,o.textContent="Save"}}async function lt(){await u.auth.signOut(),window.location.href="login.html"}function ct(){const n=document.getElementById("corp-faction-dropdown");n&&n.classList.toggle("open")}function dt(n,a){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",n),a==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",n=>{const a=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&a&&!a.contains(n.target)&&o.classList.remove("open")});window.doLogout=lt;window.toggleTheme=it;window.saveSlogan=rt;window.toggleCorpDropdown=ct;window.switchToFaction=dt;let D=!1;async function pt(){if(D){console.warn("Dissolve already in progress");return}const{data:{user:n}}=await u.auth.getUser();if(!n){alert("Not logged in.");return}const a=sessionStorage.getItem("active_faction_id");if(!a){alert("No active faction selected.");return}const{data:o,error:e}=await u.from("factions").select("*").eq("id",a).eq("faction_type","corporation").is("abandoned_at",null).single();if(e||!o){alert("No active corporation found. It may have already been dissolved."),console.error("Dissolve lookup failed:",e?.message,"factionId:",a);return}const p=o.faction_name||"this corporation";if(!confirm("DISSOLVE "+p.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all properties, equipment, and inventory
• Remove all cash reserves
• Outstanding debts and active projects will remain

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+p+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}D=!0;const l=document.getElementById("dissolve-btn");l&&(l.disabled=!0,l.textContent="DISSOLVING...",l.style.opacity="0.5");try{async function t(_){const{error:N}=await _;if(N)throw N}await t(u.from("contract_bids").delete().eq("faction_id",a)),await t(u.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",a).in("status",["open","bidding"])),await t(u.from("corp_equipment_deliveries").delete().eq("faction_id",a)),await t(u.from("corp_equipment").delete().eq("faction_id",a)),await t(u.from("corp_properties").delete().eq("faction_id",a)),await u.from("corp_material_inventory").delete().eq("faction_id",a),await u.from("corp_warehouse").delete().eq("faction_id",a),await t(u.from("factions").update({abandoned_at:new Date().toISOString(),corp_cash_reserves:0,corp_general_workforce:0,corp_skilled_workforce:0,corp_innovative_workforce:0,action_points:0}).eq("id",a)),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:i,error:v}=await u.from("factions").select("id, faction_type").or(`id.eq.${n.id},linked_user_id.eq.${n.id}`).is("abandoned_at",null);v&&console.warn("Failed to check remaining factions:",v.message);const m=(i||[]).find(_=>_.faction_type==="party"),E=(i||[]).find(_=>_.faction_type==="corporation");m?(sessionStorage.setItem("active_faction_id",m.id),alert(p+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):E?(sessionStorage.setItem("active_faction_id",E.id),alert(p+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(p+` has been dissolved.

You have no remaining factions.`),window.location.href="faction-select.html")}catch(t){alert("Dissolution failed: "+(t.message||t)+`

Please try again or contact support.`),l&&(l.disabled=!1,l.textContent="Dissolve Corporation",l.style.opacity="1")}finally{D=!1}}window.dissolveCorporation=pt;Z();
