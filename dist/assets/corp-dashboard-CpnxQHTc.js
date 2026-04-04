import{_}from"./supabase-client-BXEzLDpS.js";import{e as u}from"./utils-C2W-HleY.js";import{initMessaging as K}from"./messaging-B5Fng3EZ.js";import{c as Q}from"./equipment-DsuDdEne.js";let F=[];function d(a){return Math.abs(a)>=1e6?"$"+(a/1e6).toFixed(2)+"M":Math.abs(a)>=1e3?"$"+(a/1e3).toFixed(1)+"k":"$"+Math.round(a).toLocaleString()}function U(a,n){return Number(a?.[n]??50)}async function J(){const{data:{user:a}}=await _.auth.getUser();if(!a){window.location.href="login.html";return}const{data:n}=await _.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);F=(n||[]).filter(v=>v.nation_id);const o=sessionStorage.getItem("active_faction_id");let t=F.find(v=>v.id===o)||F.find(v=>v.faction_type==="corporation")||F[0];if(!t){console.error("Corp dashboard: no factions found"),await _.auth.signOut(),window.location.href="login.html";return}if(t.faction_type!=="corporation"){window.location.href="dashboard.html";return}let r=t.nation||"",p=null;const[s,l]=await Promise.all([t.nation_id?_.from("nations").select("*").eq("id",t.nation_id).single():Promise.resolve({data:null}),_.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);s.error&&console.warn("Nation load failed:",s.error.message),s.data&&(r=s.data.name,p=s.data),l.error&&console.warn("Shard load failed:",l.error.message);const e=l.data,i=t.corp_ticker||t.abbreviation||"";if(document.getElementById("corp-logo").textContent=i.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=t.faction_name||"Unnamed Corp",e){if(document.getElementById("game-date").textContent=e.current_date||"—",document.getElementById("tick-number").textContent=e.current_tick||"—",e.next_tick_at){const W=(Number(e.tick_interval_hours)||8)*36e5,D=new Date(e.next_tick_at).getTime(),O=D-W+W/2;j=new Date(O>Date.now()?O:D+W/2),nt()}const v=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");v&&(v.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(i?"["+i+"]":t.faction_name||"Corp")+" ▾";const y=document.getElementById("topbar-cash");if(y){const v=Number(t.corp_cash_reserves??0),W=v>=1e9?"$"+(v/1e9).toFixed(1)+"B":v>=1e6?"$"+(v/1e6).toFixed(1)+"M":"$"+Math.round(v/1e3)+"k";y.textContent="CASH: "+W}const b=t.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+b+" AP</span>";const w=document.getElementById("corp-faction-dropdown");if(w){let v="";for(const I of F){const O=I.id===t.id,H=I.faction_type==="corporation"?"CORP":"PARTY",z=I.faction_type==="corporation"?"var(--teal)":"var(--amber)";v+=`<div class="corp-dd-item${O?" active":""}" onclick="switchToFaction('${I.id}', '${I.faction_type}')">
                <span class="corp-dd-type" style="color:${z}">${H}</span>
                <span class="corp-dd-name">${u(I.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${u(I.abbreviation||"—")}]</span>
            </div>`}F.some(I=>I.faction_type==="corporation")||(v+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),F.some(I=>I.faction_type==="party")||(v+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),w.innerHTML=v}document.getElementById("id-type-badge").textContent=t.corp_company_type||"—",document.getElementById("id-logo").textContent=i.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=t.faction_name||"Unnamed Corp";const f=t.party_description||"";document.getElementById("id-slogan").textContent=f?'"'+f+'"':'"--"';const x=e?.current_date?e.current_date.replace(/.*,\s*/,""):"—",T=t.leader_first_name&&t.leader_last_name?t.leader_first_name+" "+t.leader_last_name+(t.leader_age?" ("+t.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${u(x)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${u(r||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${u(t.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${u(t.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${u(T)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${u(t.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${u(i)}</span>
        </div>
    `;const c=t.last_rename_tick||0,S=e?.current_tick||0,E=Math.max(0,c+120-S),k=E<=0,m=document.getElementById("slogan-editor");m.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${u(f)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${k?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${k?"60 characters max. 120 tick cooldown after change.":E+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=t.id,window._currentTick=S;const B=X(p,r,t);tt(r);const M=await et(p,r,t);let h=0;if(t?.id){const{data:v,error:W}=await _.from("corp_equipment").select("equipment_key, owned").eq("faction_id",t.id);W||(h=Q(v||[]))}Z(p,e,B,t,M.propertyMaintenance||0,h),at(p,r,t,B,M),K(t,p,e);const L=60,N=t.founded_tick||0,A=e?.current_tick||0,C=Math.max(0,L-(A-N)),q=document.getElementById("dissolve-btn"),P=document.getElementById("dissolve-info");q&&(C>0?(q.disabled=!0,q.style.opacity="0.4",q.style.cursor="not-allowed",P&&(P.innerHTML=`<span style="color:#a44;">Available in ${C} tick${C!==1?"s":""}</span><br>Corporations must operate for 60 ticks before dissolution.`)):(q.disabled=!1,q.style.opacity="1",q.style.cursor="pointer")),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function X(a,n,o){const t=C=>U(a,C),r=(n||"UNKNOWN").toUpperCase(),p=Number(o?.corp_general_workforce??2250),s=Number(o?.corp_skilled_workforce??600),l=Number(o?.corp_innovative_workforce??150),e=p+s+l,i=2,y=3,b=6,w=t("minimum_wage"),f=w/100*48e3,x=t("inflation"),T=t("standard_of_living"),c=1+(x-50)/100*.5,S=1+(T-50)/100*.5,$=C=>Math.round(f*C*c*S),E=$(i),k=$(y),m=$(b),B=p*E,M=s*k,h=l*m,L=B+M+h;function N(C){return"$"+Math.round(C).toLocaleString()+"/yr"}const A=`${c.toFixed(2)} &times; ${S.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=e.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${u(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${p.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${i}.0 &times; ${A})</span>
                <span class="wf-tier__value">${N(E)}</span>
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
                    <span class="wf-tier__nation">${u(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${s.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${y}.0 &times; ${A})</span>
                <span class="wf-tier__value">${N(k)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(M)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${u(r)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${b}.0 &times; ${A})</span>
                <span class="wf-tier__value">${N(m)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${d(h)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${u(r)})</span>
                <span class="wf-tier__value">${w}/100 → ${N(f)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${c.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${S.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${e.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${d(L)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${d(L/12)}</span>
            </div>
        </div>
    `,{totalWages:L,generalTotal:B,skilledTotal:M,innovativeTotal:h,monthlyWages:Math.round(L/12)}}function Z(a,n,o,t,r,p){const s=n?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+s;const l=5e7,e=g=>U(a,g),i=1+(e("gdp_growth")-50)/100*.4,y=1+(e("urbanization")-50)/100*.3,b=1+(e("population_growth")-50)/100*.2,w=1+(e("standard_of_living")-50)/100*.15,f=1+(50-e("physical_infrastructure"))/100*.1,x=1-Math.max(0,e("inflation")-50)/100*.1,T=1-Math.max(0,e("interest_rates")-50)/100*.1,c=i*y*b*w*f*x*T,S=Math.round(l*c),$=Math.round(S/12),E=0,k=0,m=E+k+$,B=o?.totalWages||0,M=Math.round(B/12),h=0,L=0,N=0,A=r||0,C=p||0,q=M+h+A+C+L+N,P=m-q,v=Number(t?.corp_cash_reserves??0),W=0,D=[{stat:"gdp_growth",value:e("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:e("urbanization"),weight:"0.3"},{stat:"population_growth",value:e("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:e("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:e("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:e("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:e("interest_rates"),weight:"-0.1",neg:!0}];function I(g){return g.neg?g.value>50?"var(--red)":"var(--green)":g.note?g.value<50?"var(--green)":"var(--red)":g.value>=50?"var(--green)":g.value>=35?"var(--amber)":"var(--red)"}const O=m||1,H=(E/O*100).toFixed(1),z=(k/O*100).toFixed(1),G=($/O*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${H}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${z}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${G}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${d(E)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${d(k)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${d($)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${d(m)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${d(M)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${d(h)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${d(A)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${d(C)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${d(L)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${d(N)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${d(q)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${P>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${P>=0?"var(--green)":"var(--red)"}">${d(P)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${d(v)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${d(W)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${D.map(g=>`
                <div class="drv-row">
                    <span class="drv-row__name">${g.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${g.value}%;background:${I(g)}"></div></div>
                    <span class="drv-row__val">${g.value}</span>
                    <span class="drv-row__wt">&times;${g.weight}</span>
                    ${g.note?'<span class="drv-row__note">'+g.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${c.toFixed(2)}</span>
            </div>
        </div>
    `}function tt(a){const n=a.toUpperCase(),o=[{label:"Reputation",value:65,change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:3e3,change:0,section:"Core"},{label:"Workforce Skill",value:50,change:0,decay:!0,max:100},{label:"Operational Efficiency",value:50,change:0,decay:!0,max:100},{label:"Market Share",value:5,change:0,nation:n,max:100,section:"Market & Financials"},{label:"Credit Rating",value:50,change:0,max:100},{label:"Regulatory Standing",value:50,change:0,nation:n,max:100,section:"Political Standing"},{label:"Political Influence",value:10,change:0,decay:!0,nation:n,max:100},{label:"Innovation",value:20,change:0,decay:!0,max:100,section:"Innovation"}];function t(s,l){if(!l||l>100)return"var(--text-primary)";const e=s/l*100;return e>=70?"var(--green)":e>=40?"var(--amber)":e>=20?"var(--orange, #d48a3c)":"var(--red)"}function r(s){const l=parseFloat(s),e=l>0?"var(--green)":l<0?"var(--red)":"var(--text-dim)",i=l>0?"▲":l<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${e}">${i}</span>
            <span class="stat-item__delta" style="color:${e}">${Math.abs(l).toFixed(1)}</span>
        </div>`}let p="";for(const s of o){if(s.isHero){p+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${s.label}</span>
                            ${s.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${s.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${r(s.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${s.value}%"></div></div>
                </div>`;continue}s.section&&(p+=`<div class="stats-section"><span class="stats-section__label">${s.section}</span></div>`);const l=s.max&&s.max<=100;p+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${s.label}</span>
                        ${s.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${s.nation?'<span class="stat-item__nation">'+u(s.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${l?t(s.value,s.max):"var(--text-primary)"}">${typeof s.value=="number"?s.value.toLocaleString():s.value}</span>
                    ${l?'<span class="stat-item__max">/100</span>':""}
                    ${r(s.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=p}async function et(a,n,o,t){const r=(n||"UNKNOWN").toUpperCase();let p=[];if(o?.id){const{data:c}=await _.from("corp_properties").select("*").eq("faction_id",o.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});p=c||[]}const s={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,e=0;const i=5e7,y=1+(U(a,"inflation")-50)/100*.3,b=.8+U(a,"stability")/100*.4,w=Math.round(i*y*b),f=Math.round(w*.005);l+=w,e+=f;let x=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${u(r)} · Headquarters</div>
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
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${d(w)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${d(f)}</div>
            </div>
        </div>
    </div>`;for(const c of p){const S=s[c.style]||s.Basic;l+=Number(c.purchase_price||0),e+=Number(c.monthly_maintenance||0);const $=c.condition>=75?"var(--green)":c.condition>=50?"var(--amber)":"var(--orange)";x+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${u(c.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${u(c.city||r)} · ${(c.type||"").replace(/_/g," ")} · <span style="color:${S.color}">${(c.style||"Basic").toUpperCase()}</span></div>
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
                <span style="color:${$}">${c.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${c.condition}%;height:100%;background:${$};"></div></div>
        </div>`}const T=document.getElementById("prop-count");return T&&(T.textContent=p.length+1+" ASSET"+(p.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${x}
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
    `,{propertyValue:l,propertyMaintenance:e}}function at(a,n,o,t,r){(n||"UNKNOWN").toUpperCase();const p=o.corp_company_type||"Private",s=Number(o.corp_cash_reserves)||0,l=r?.propertyValue||0,e=0,i=0,y=s+l+e+i,b=Number(o.corp_loans)||0,f=t?.monthlyWages||0,x=0,T=b+f+x,c=y-T,$=Math.round(c*(1+.3)),E=$-c,k=E>0;document.getElementById("val-type-badge").textContent=p.toUpperCase();function m(B,M,h={}){const L=h.indent?"val-line val-line--indent":"val-line",N=h.bold?"val-line__label val-line__label--bold":"val-line__label",A=h.bold?"val-line__value val-line__value--bold":"val-line__value",C=h.color||(h.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${L}"><span class="${N}">${B}</span><span class="${A}" style="color:${C}">${d(M)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${m("Cash & Reserves",s,{indent:!0})}
        ${m("Property",l,{indent:!0})}
        ${m("Equipment",e,{indent:!0})}
        ${m("Active Contracts",i,{indent:!0})}
        ${m("Total Assets",y,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${m("Outstanding Loans",b,{indent:!0})}
        ${m("Accounts Payable",f,{indent:!0})}
        ${m("Pending Project Costs",x,{indent:!0})}
        ${m("Total Liabilities",T,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${c>=0?"var(--green)":"var(--red)"};">${d(c)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${d($)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${k?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${k?"var(--green)":"var(--red)"};">${k?"+":""}${d(E)}</span>
            </div>
            <div class="val-market__note">${k?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let j=null,R=null;function nt(){R&&clearInterval(R),R=setInterval(Y,1e3),Y()}function Y(){const a=document.getElementById("tick-countdown");if(!a||!j){a&&(a.textContent="—");return}const n=j-Date.now();if(n<=0){a.textContent="Tick due...",clearInterval(R);return}const o=Math.floor(n/36e5),t=Math.floor(n%36e5/6e4),r=Math.floor(n%6e4/1e3);a.textContent=o+"h "+t+"m "+r+"s"}function st(){document.body.classList.toggle("light-mode");const a=document.getElementById("theme-toggle");a.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const a=document.getElementById("theme-toggle");a&&(a.textContent="Dark")}async function ot(){const a=document.getElementById("slogan-input"),n=document.getElementById("slogan-hint"),o=document.getElementById("slogan-save-btn"),t=(a.value||"").trim().slice(0,60);if(t.length===0){n.textContent="Slogan cannot be empty.",n.className="slogan-hint slogan-hint--error";return}o.disabled=!0,o.textContent="...",n.textContent="";try{const{error:r}=await _.from("factions").update({party_description:t,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(r)throw r;document.getElementById("id-slogan").textContent='"'+t+'"',n.textContent="Slogan saved! Next change in 120 ticks.",n.className="slogan-hint slogan-hint--ok",o.textContent="Save"}catch(r){console.error("Slogan save failed:",r),n.textContent="Failed to save slogan.",n.className="slogan-hint slogan-hint--error",o.disabled=!1,o.textContent="Save"}}async function it(){await _.auth.signOut(),window.location.href="login.html"}function lt(){const a=document.getElementById("corp-faction-dropdown");a&&a.classList.toggle("open")}function rt(a,n){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",a),n==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",a=>{const n=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&n&&!n.contains(a.target)&&o.classList.remove("open")});window.doLogout=it;window.toggleTheme=st;window.saveSlogan=ot;window.toggleCorpDropdown=lt;window.switchToFaction=rt;let V=!1;async function ct(){if(V)return;const{data:{user:a}}=await _.auth.getUser();if(!a)return;const n=sessionStorage.getItem("active_faction_id");if(!n)return;const o=F.find(i=>i.id===n&&i.faction_type==="corporation");if(!o){alert("No active corporation found.");return}const t=o.faction_name||"this corporation",{data:r}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),s=(r?.current_tick||0)-(o.founded_tick||0);if(s<60){alert(`Corporation must be at least 60 ticks old to dissolve.

`+(60-s)+" ticks remaining.");return}if(!confirm("DISSOLVE "+t.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all bids, equipment, properties, and inventory
• Cancel all active construction projects
• Detach this corporation from your account

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+t+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}V=!0;const e=document.getElementById("dissolve-btn");e&&(e.disabled=!0,e.textContent="DISSOLVING...",e.style.opacity="0.5");try{async function i(f){const{error:x}=await f;if(x)throw x}await i(_.from("contract_bids").delete().eq("faction_id",n)),await i(_.from("construction_contracts").update({status:"completed"}).eq("awarded_to_faction",n).in("status",["awarded","in_progress"])),await i(_.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",n).in("status",["open","bidding"])),await i(_.from("corp_equipment_deliveries").delete().eq("faction_id",n)),await i(_.from("corp_equipment").delete().eq("faction_id",n)),await i(_.from("corp_properties").delete().eq("faction_id",n)),await i(_.from("corp_material_inventory").delete().eq("faction_id",n)),await i(_.from("corp_warehouse").delete().eq("faction_id",n)),await i(_.from("factions").delete().eq("id",n)),sessionStorage.removeItem("active_faction_id");const{data:y}=await _.from("factions").select("id, faction_type").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`),b=(y||[]).find(f=>f.faction_type==="party"),w=(y||[]).find(f=>f.faction_type==="corporation");b?(sessionStorage.setItem("active_faction_id",b.id),alert(t+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):w?(sessionStorage.setItem("active_faction_id",w.id),alert(t+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(t+` has been dissolved.

You have no remaining factions. Redirecting to faction select.`),window.location.href="select-nation.html")}catch(i){alert("Dissolution failed at step: "+(i.message||i)+`

Please contact support if the corporation is in a broken state.`),e&&(e.disabled=!1,e.textContent="Dissolve Corporation",e.style.opacity="1")}finally{V=!1}}window.dissolveCorporation=ct;J();
