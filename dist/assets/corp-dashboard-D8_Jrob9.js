import{_}from"./supabase-client-BXEzLDpS.js";import{e as w}from"./utils-C2W-HleY.js";import{initMessaging as J}from"./messaging-B5Fng3EZ.js";import{c as X}from"./equipment-DsuDdEne.js";let B=[];function r(a){return Math.abs(a)>=1e6?"$"+(a/1e6).toFixed(2)+"M":Math.abs(a)>=1e3?"$"+(a/1e3).toFixed(1)+"k":"$"+Math.round(a).toLocaleString()}function O(a,n){return Number(a?.[n]??50)}async function Z(){const{data:{user:a}}=await _.auth.getUser();if(!a){window.location.href="login.html";return}const{data:n}=await _.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);B=(n||[]).filter(o=>o.nation_id&&!o.abandoned_at);const s=sessionStorage.getItem("active_faction_id");let t=B.find(o=>o.id===s)||B.find(o=>o.faction_type==="corporation")||B[0];if(!t){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",t.id),t.faction_type!=="corporation"){window.location.href="dashboard.html";return}let c=t.nation||"",d=null;const[f,l]=await Promise.all([t.nation_id?_.from("nations").select("*").eq("id",t.nation_id).single():Promise.resolve({data:null}),_.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);f.error&&console.warn("Nation load failed:",f.error.message),f.data&&(c=f.data.name,d=f.data),l.error&&console.warn("Shard load failed:",l.error.message);const e=l.data,m=t.corp_ticker||t.abbreviation||"";if(document.getElementById("corp-logo").textContent=m.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=t.faction_name||"Unnamed Corp",e){if(document.getElementById("game-date").textContent=e.current_date||"—",document.getElementById("tick-number").textContent=e.current_tick||"—",e.next_tick_at){const g=(Number(e.tick_interval_hours)||8)*36e5,T=new Date(e.next_tick_at).getTime(),A=T-g+g/2;U=new Date(A>Date.now()?A:T+g/2),ot()}const o=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");o&&(o.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(m?"["+m+"]":t.faction_name||"Corp")+" ▾";const b=document.getElementById("topbar-cash");if(b){const o=Number(t.corp_cash_reserves??0),g=o>=1e9?"$"+(o/1e9).toFixed(1)+"B":o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k";b.textContent="CASH: "+g}const $=t.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+$+" AP</span>";const h=document.getElementById("corp-faction-dropdown");if(h){let o="";for(const p of B){const A=p.id===t.id,q=p.faction_type==="corporation"?"CORP":"PARTY",W=p.faction_type==="corporation"?"var(--teal)":"var(--amber)";o+=`<div class="corp-dd-item${A?" active":""}" onclick="switchToFaction('${p.id}', '${p.faction_type}')">
                <span class="corp-dd-type" style="color:${W}">${q}</span>
                <span class="corp-dd-name">${w(p.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${w(p.abbreviation||"—")}]</span>
            </div>`}B.some(p=>p.faction_type==="corporation")||(o+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),B.some(p=>p.faction_type==="party")||(o+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),h.innerHTML=o}document.getElementById("id-type-badge").textContent=t.corp_company_type||"—",document.getElementById("id-logo").textContent=m.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=t.faction_name||"Unnamed Corp";const v=t.party_description||"";document.getElementById("id-slogan").textContent=v?'"'+v+'"':'"--"';const k=e?.current_date?e.current_date.replace(/.*,\s*/,""):"—",S=t.leader_first_name&&t.leader_last_name?t.leader_first_name+" "+t.leader_last_name+(t.leader_age?" ("+t.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${w(k)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${w(c||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${w(t.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${w(t.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${w(S)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${w(t.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${w(m)}</span>
        </div>
    `;const i=t.last_rename_tick||0,M=e?.current_tick||0,E=Math.max(0,i+120-M),I=E<=0,u=document.getElementById("slogan-editor");u.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${w(v)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${I?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${I?"60 characters max. 120 tick cooldown after change.":E+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=t.id,window._currentTick=M;const L=tt(d,c,t),N=await at(d,c,t);let x=0;if(t?.id){const{data:o,error:g}=await _.from("corp_equipment").select("equipment_key, owned").eq("faction_id",t.id);g||(x=X(o||[]))}et(d,e,L,t,N.propertyMaintenance||0,x),nt(d,c,t,L,N),J(t,d,e),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function tt(a,n,s){const t=p=>O(a,p),c=(n||"UNKNOWN").toUpperCase(),d=Number(s?.corp_general_workforce??2250),f=Number(s?.corp_skilled_workforce??600),l=Number(s?.corp_innovative_workforce??150),e=d+f+l,m=2,b=3,$=6,h=t("minimum_wage"),v=h/100*48e3,k=t("inflation"),S=t("standard_of_living"),i=1+(k-50)/100*.5,M=1+(S-50)/100*.5,C=p=>Math.round(v*p*i*M),E=C(m),I=C(b),u=C($),L=d*E,N=f*I,x=l*u,o=L+N+x;function g(p){return"$"+Math.round(p).toLocaleString()+"/yr"}const T=`${i.toFixed(2)} &times; ${M.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=e.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${w(c)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${d.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${m}.0 &times; ${T})</span>
                <span class="wf-tier__value">${g(E)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${r(L)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${w(c)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${f.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${b}.0 &times; ${T})</span>
                <span class="wf-tier__value">${g(I)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${r(N)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${w(c)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${$}.0 &times; ${T})</span>
                <span class="wf-tier__value">${g(u)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${r(x)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${w(c)})</span>
                <span class="wf-tier__value">${h}/100 → ${g(v)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${i.toFixed(2)}</span>
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
                <span class="wf-total__value" style="color:var(--red);">${r(o)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${r(o/12)}</span>
            </div>
        </div>
    `,{totalWages:o,generalTotal:L,skilledTotal:N,innovativeTotal:x,monthlyWages:Math.round(o/12)}}function et(a,n,s,t,c,d){const f=n?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+f;const l=5e7,e=y=>O(a,y),m=1+(e("gdp_growth")-50)/100*.4,b=1+(e("urbanization")-50)/100*.3,$=1+(e("population_growth")-50)/100*.2,h=1+(e("standard_of_living")-50)/100*.15,v=1+(50-e("physical_infrastructure"))/100*.1,k=1-Math.max(0,e("inflation")-50)/100*.1,S=1-Math.max(0,e("interest_rates")-50)/100*.1,i=m*b*$*h*v*k*S,M=Math.round(l*i),C=Math.round(M/12),E=0,I=0,u=E+I+C,L=s?.totalWages||0,N=Math.round(L/12),x=0,o=0,g=c||0,T=d||0,p=Number(t?.corp_loans)||0,A=.05,q=p>0?Math.round(p*(A/12)/(1-Math.pow(1+A/12,-120))):0,W=N+x+g+T+q+o,P=u-W,V=Number(t?.corp_cash_reserves??0),H=p,j=[{stat:"gdp_growth",value:e("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:e("urbanization"),weight:"0.3"},{stat:"population_growth",value:e("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:e("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:e("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:e("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:e("interest_rates"),weight:"-0.1",neg:!0}];function G(y){return y.neg?y.value>50?"var(--red)":"var(--green)":y.note?y.value<50?"var(--green)":"var(--red)":y.value>=50?"var(--green)":y.value>=35?"var(--amber)":"var(--red)"}const D=u||1,K=(E/D*100).toFixed(1),Y=(I/D*100).toFixed(1),Q=(C/D*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${K}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${Y}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${Q}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${r(E)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${r(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${r(C)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${r(u)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${r(N)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${r(x)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${r(g)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${r(T)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${r(q)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${r(o)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${r(W)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${P>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${P>=0?"var(--green)":"var(--red)"}">${r(P)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${r(V)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${r(H)}</div>
            </div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${j.map(y=>`
                <div class="drv-row">
                    <span class="drv-row__name">${y.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${y.value}%;background:${G(y)}"></div></div>
                    <span class="drv-row__val">${y.value}</span>
                    <span class="drv-row__wt">&times;${y.weight}</span>
                    ${y.note?'<span class="drv-row__note">'+y.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${i.toFixed(2)}</span>
            </div>
        </div>
    `}async function at(a,n,s,t){const c=(n||"UNKNOWN").toUpperCase();let d=[];if(s?.id){const{data:i}=await _.from("corp_properties").select("*").eq("faction_id",s.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});d=i||[]}const f={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,e=0;const m=5e7,b=1+(O(a,"inflation")-50)/100*.3,$=.8+O(a,"stability")/100*.4,h=Math.round(m*b*$),v=Math.round(h*.005);l+=h,e+=v;let k=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${w(c)} · Headquarters</div>
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
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${r(h)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${r(v)}</div>
            </div>
        </div>
    </div>`;for(const i of d){const M=f[i.style]||f.Basic;l+=Number(i.purchase_price||0),e+=Number(i.monthly_maintenance||0);const C=i.condition>=75?"var(--green)":i.condition>=50?"var(--amber)":"var(--orange)";k+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${w(i.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${w(i.city||c)} · ${(i.type||"").replace(/_/g," ")} · <span style="color:${M.color}">${(i.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge">OWNED</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${(i.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${r(i.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${r(i.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${C}">${i.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${i.condition}%;height:100%;background:${C};"></div></div>
        </div>`}const S=document.getElementById("prop-count");return S&&(S.textContent=d.length+1+" ASSET"+(d.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${k}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${r(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${r(e)}/mo</span>
            </div>
        </div>
    `,{propertyValue:l,propertyMaintenance:e}}function nt(a,n,s,t,c){(n||"UNKNOWN").toUpperCase();const d=s.corp_company_type||"Private",f=Number(s.corp_cash_reserves)||0,l=c?.propertyValue||0,e=0,m=0,b=f+l+e+m,$=Number(s.corp_loans)||0,v=t?.monthlyWages||0,k=0,S=$+v+k,i=b-S,C=Math.round(i*(1+.3)),E=C-i,I=E>0;document.getElementById("val-type-badge").textContent=d.toUpperCase();function u(L,N,x={}){const o=x.indent?"val-line val-line--indent":"val-line",g=x.bold?"val-line__label val-line__label--bold":"val-line__label",T=x.bold?"val-line__value val-line__value--bold":"val-line__value",p=x.color||(x.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${o}"><span class="${g}">${L}</span><span class="${T}" style="color:${p}">${r(N)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${u("Cash & Reserves",f,{indent:!0})}
        ${u("Property",l,{indent:!0})}
        ${u("Equipment",e,{indent:!0})}
        ${u("Active Contracts",m,{indent:!0})}
        ${u("Total Assets",b,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${u("Outstanding Loans",$,{indent:!0})}
        ${u("Accounts Payable",v,{indent:!0})}
        ${u("Pending Project Costs",k,{indent:!0})}
        ${u("Total Liabilities",S,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${i>=0?"var(--green)":"var(--red)"};">${r(i)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${r(C)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${I?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${I?"var(--green)":"var(--red)"};">${I?"+":""}${r(E)}</span>
            </div>
            <div class="val-market__note">${I?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let U=null,F=null;function ot(){F&&clearInterval(F),F=setInterval(z,1e3),z()}function z(){const a=document.getElementById("tick-countdown");if(!a||!U){a&&(a.textContent="—");return}const n=U-Date.now();if(n<=0){a.textContent="Tick due...",clearInterval(F);return}const s=Math.floor(n/36e5),t=Math.floor(n%36e5/6e4),c=Math.floor(n%6e4/1e3);a.textContent=s+"h "+t+"m "+c+"s"}function st(){document.body.classList.toggle("light-mode");const a=document.getElementById("theme-toggle");a.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const a=document.getElementById("theme-toggle");a&&(a.textContent="Dark")}async function it(){const a=document.getElementById("slogan-input"),n=document.getElementById("slogan-hint"),s=document.getElementById("slogan-save-btn"),t=(a.value||"").trim().slice(0,60);if(t.length===0){n.textContent="Slogan cannot be empty.",n.className="slogan-hint slogan-hint--error";return}s.disabled=!0,s.textContent="...",n.textContent="";try{const{error:c}=await _.from("factions").update({party_description:t,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(c)throw c;document.getElementById("id-slogan").textContent='"'+t+'"',n.textContent="Slogan saved! Next change in 120 ticks.",n.className="slogan-hint slogan-hint--ok",s.textContent="Save"}catch(c){console.error("Slogan save failed:",c),n.textContent="Failed to save slogan.",n.className="slogan-hint slogan-hint--error",s.disabled=!1,s.textContent="Save"}}async function rt(){await _.auth.signOut(),window.location.href="login.html"}function lt(){const a=document.getElementById("corp-faction-dropdown");a&&a.classList.toggle("open")}function ct(a,n){const s=document.getElementById("corp-faction-dropdown");s&&s.classList.remove("open"),sessionStorage.setItem("active_faction_id",a),n==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",a=>{const n=document.getElementById("faction-switcher"),s=document.getElementById("corp-faction-dropdown");s&&n&&!n.contains(a.target)&&s.classList.remove("open")});window.doLogout=rt;window.toggleTheme=st;window.saveSlogan=it;window.toggleCorpDropdown=lt;window.switchToFaction=ct;let R=!1;async function dt(){if(R){console.warn("Dissolve already in progress");return}const{data:{user:a}}=await _.auth.getUser();if(!a){alert("Not logged in.");return}const n=sessionStorage.getItem("active_faction_id");if(!n){alert("No active faction selected.");return}const{data:s,error:t}=await _.from("factions").select("*").eq("id",n).eq("faction_type","corporation").is("abandoned_at",null).single();if(t||!s){alert("No active corporation found. It may have already been dissolved."),console.error("Dissolve lookup failed:",t?.message,"factionId:",n);return}const d=s.faction_name||"this corporation";if(!confirm("DISSOLVE "+d.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all properties, equipment, and inventory
• Remove all cash reserves
• Outstanding debts and active projects will remain

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+d+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}R=!0;const l=document.getElementById("dissolve-btn");l&&(l.disabled=!0,l.textContent="DISSOLVING...",l.style.opacity="0.5");try{async function e(v){const{error:k}=await v;if(k)throw k}await e(_.from("contract_bids").delete().eq("faction_id",n)),await e(_.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",n).in("status",["open","bidding"])),await e(_.from("corp_equipment_deliveries").delete().eq("faction_id",n)),await e(_.from("corp_equipment").delete().eq("faction_id",n)),await e(_.from("corp_properties").delete().eq("faction_id",n)),await _.from("corp_material_inventory").delete().eq("faction_id",n),await _.from("corp_warehouse").delete().eq("faction_id",n),await e(_.from("factions").update({abandoned_at:new Date().toISOString(),corp_cash_reserves:0,corp_general_workforce:0,corp_skilled_workforce:0,corp_innovative_workforce:0,action_points:0}).eq("id",n)),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:m,error:b}=await _.from("factions").select("id, faction_type").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`).is("abandoned_at",null);b&&console.warn("Failed to check remaining factions:",b.message);const $=(m||[]).find(v=>v.faction_type==="party"),h=(m||[]).find(v=>v.faction_type==="corporation");$?(sessionStorage.setItem("active_faction_id",$.id),alert(d+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):h?(sessionStorage.setItem("active_faction_id",h.id),alert(d+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(d+` has been dissolved.

You have no remaining factions.`),window.location.href="faction-select.html")}catch(e){alert("Dissolution failed: "+(e.message||e)+`

Please try again or contact support.`),l&&(l.disabled=!1,l.textContent="Dissolve Corporation",l.style.opacity="1")}finally{R=!1}}window.dissolveCorporation=dt;Z();
