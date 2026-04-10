import{_ as u}from"./supabase-client-BXEzLDpS.js";import{e as v,t as rt}from"./utils-C2W-HleY.js";import{initMessaging as Lt}from"./messaging-B5Fng3EZ.js";import{c as Nt}from"./equipment-DsuDdEne.js";let W=[],p=null,I=null;function _(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(2)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(1)+"k":"$"+Math.round(t).toLocaleString()}function U(t,e){return Number(t?.[e]??50)}async function Rt(){const{data:{user:t}}=await u.auth.getUser();if(!t){window.location.href="login.html";return}const{data:e}=await u.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);W=(e||[]).filter(b=>b.nation_id&&!b.abandoned_at);const o=sessionStorage.getItem("active_faction_id");if(p=W.find(b=>b.id===o)||W.find(b=>b.faction_type==="corporation")||W[0],!p){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",p.id),p.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i={Construction:"corp-operations.html",Finance:"corp-operations-finance.html"}[p.corp_sector]||"corp-operations.html",s=document.getElementById("nav-operations"),l=document.getElementById("nav-expansion");s&&(s.href=i),l&&(l.href="corp-operations.html?tab=expansion");let r=p.nation||"",n=null;const[f,g]=await Promise.all([p.nation_id?u.from("nations").select("*").eq("id",p.nation_id).single():Promise.resolve({data:null}),u.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);f.error&&console.warn("Nation load failed:",f.error.message),f.data&&(r=f.data.name,n=f.data),g.error&&console.warn("Shard load failed:",g.error.message),I=g.data;const x=p.corp_ticker||p.abbreviation||"";if(document.getElementById("corp-logo").textContent=x.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=p.faction_name||"Unnamed Corp",I){if(document.getElementById("game-date").textContent=I.current_date||"—",document.getElementById("tick-number").textContent=I.current_tick||"—",I.next_tick_at){const q=(Number(I.tick_interval_hours)||8)*36e5,F=new Date(I.next_tick_at).getTime(),H=F-q+q/2;it=new Date(H>Date.now()?H:F+q/2),Vt()}const b=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");b&&(b.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(x?"["+x+"]":p.faction_name||"Corp")+" ▾";const h=document.getElementById("topbar-cash");if(h){const b=Number(p.corp_cash_reserves??0),q=b>=1e9?"$"+(b/1e9).toFixed(1)+"B":b>=1e6?"$"+(b/1e6).toFixed(1)+"M":"$"+Math.round(b/1e3)+"k";h.textContent="CASH: "+q}const c=document.getElementById("topbar-ap");c&&(c.style.display="none");const m=document.getElementById("corp-faction-dropdown");if(m){let b="";for(const M of W){const H=M.id===p.id,ct=M.faction_type==="corporation"?"CORP":"PARTY",Q=M.faction_type==="corporation"?"var(--teal)":"var(--amber)";b+=`<div class="corp-dd-item${H?" active":""}" onclick="switchToFaction('${M.id}', '${M.faction_type}')">
                <span class="corp-dd-type" style="color:${Q}">${ct}</span>
                <span class="corp-dd-name">${v(M.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${v(M.abbreviation||"—")}]</span>
            </div>`}W.some(M=>M.faction_type==="corporation")||(b+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),W.some(M=>M.faction_type==="party")||(b+=`<div class="corp-dd-item corp-dd-item--create" onclick="sessionStorage.setItem('pending_faction_type','party'); window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),m.innerHTML=b}document.getElementById("id-type-badge").textContent=p.corp_company_type||"—",document.getElementById("id-logo").textContent=x.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=p.faction_name||"Unnamed Corp";const y=p.party_description||"";document.getElementById("id-slogan").textContent=y?'"'+y+'"':'"--"';const w=I?.current_date?I.current_date.replace(/.*,\s*/,""):"—",N=p.leader_first_name&&p.leader_last_name?p.leader_first_name+" "+p.leader_last_name+(p.leader_age?" ("+p.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${v(w)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${v(r||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${v(p.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${v(p.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${v(N)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${v(p.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${v(x)}</span>
        </div>
    `;const $=p.last_rename_tick||0,R=I?.current_tick||0,d=Math.max(0,$+120-R),T=!y||y==="-"||y==='"-"'||d<=0,k=document.getElementById("slogan-editor");k.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${v(y)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${T?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${T?"60 characters max. 120 tick cooldown after change.":d+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=p.id,window._currentTick=R,window._nationStats=n,window._factionData=p;const S=zt(n,r,p);Wt(r,p);const z=await Ut(n,r,p,I);let O=0;if(p?.id){const{data:b,error:q}=await u.from("corp_equipment").select("equipment_key, owned").eq("faction_id",p.id);q||(O=Nt(b||[]))}At(n,I,S,p,z.propertyMaintenance||0,O),jt(n,r,p,S,z),Lt(p,n,I),D={nationId:p.nation_id},wt(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function zt(t,e,o){const a=b=>U(t,b),i=(e||"UNKNOWN").toUpperCase(),s=Number(o?.corp_general_workforce??2250),l=Number(o?.corp_skilled_workforce??600),r=Number(o?.corp_innovative_workforce??150),n=s+l+r,f=2,g=3,x=6,h=a("minimum_wage"),c=h/100*48e3,m=a("inflation"),y=a("standard_of_living"),w=1+(m-50)/100*.5,N=1+(y-50)/100*.5,$=b=>Math.round(c*b*w*N),R=$(f),C=$(g),d=$(x),L=s*R,T=l*C,k=r*d,S=L+T+k;function z(b){return"$"+Math.round(b).toLocaleString()+"/yr"}const O=`${w.toFixed(2)} &times; ${N.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=n.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${v(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${s.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${f}.0 &times; ${O})</span>
                <span class="wf-tier__value">${z(R)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${_(L)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${v(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${g}.0 &times; ${O})</span>
                <span class="wf-tier__value">${z(C)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${_(T)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${v(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${x}.0 &times; ${O})</span>
                <span class="wf-tier__value">${z(d)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${_(k)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${v(i)})</span>
                <span class="wf-tier__value">${h}/100 → ${z(c)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${w.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${N.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${n.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${_(S)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${_(S/12)}</span>
            </div>
        </div>
    `,{totalWages:S,generalTotal:L,skilledTotal:T,innovativeTotal:k,monthlyWages:Math.round(S/12)}}function At(t,e,o,a,i,s){const l=e?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+l;const r=5e7,n=E=>U(t,E),f=1+(n("gdp_growth")-50)/100*.4,g=1+(n("urbanization")-50)/100*.3,x=1+(n("population_growth")-50)/100*.2,h=1+(n("standard_of_living")-50)/100*.15,c=1+(50-n("physical_infrastructure"))/100*.1,m=1-Math.max(0,n("inflation")-50)/100*.1,y=1-Math.max(0,n("interest_rates")-50)/100*.1,w=f*g*x*h*c*m*y,N=Math.round(r*w),$=(a.corp_general_workforce||0)+(a.corp_skilled_workforce||0)+(a.corp_innovative_workforce||0),R=Math.min(1,$/3e3),C=Math.round(Math.round(N/12)*R),d=0,L=0,T=d+L+C,k=o?.totalWages||0,S=Math.round(k/12),z=0,O=0,b=i||0,q=s||0,F=Number(a?.corp_loans)||0,M=.05,H=F>0?Math.round(F*(M/12)/(1-Math.pow(1+M/12,-120))):0,Q=S+z+b+q+H+O+75e3,et=T-Q,kt=Number(a?.corp_cash_reserves??0),Et=F,Ct=[{stat:"gdp_growth",value:n("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:n("urbanization"),weight:"0.3"},{stat:"population_growth",value:n("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:n("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:n("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:n("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:n("interest_rates"),weight:"-0.1",neg:!0}];function Tt(E){return E.neg?E.value>50?"var(--red)":"var(--green)":E.note?E.value<50?"var(--green)":"var(--red)":E.value>=50?"var(--green)":E.value>=35?"var(--amber)":"var(--red)"}const ot=T||1,St=(d/ot*100).toFixed(1),Mt=(L/ot*100).toFixed(1),It=(C/ot*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${St}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${Mt}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${It}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${_(d)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${_(L)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${_(C)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${_(T)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${_(S)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${_(z)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${_(b)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${_(q)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${_(H)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${_(O)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${_(Q)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${et>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${et>=0?"var(--green)":"var(--red)"}">${_(et)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${_(kt)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${_(Et)}</div>
            </div>
        </div>
        <!-- Loans Section -->
        <div style="padding:8px 14px;border-top:1px solid var(--border-0);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;">Loans</span>
                <div style="padding:3px 10px;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#000;background:#5a8aaa;border:1px solid #5a8aaa;" onclick="lrOpen()">REQUEST LOAN</div>
            </div>
            <div id="fin-loans-list" style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">No active loans.</div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${Ct.map(E=>`
                <div class="drv-row">
                    <span class="drv-row__name">${E.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${E.value}%;background:${Tt(E)}"></div></div>
                    <span class="drv-row__val">${E.value}</span>
                    <span class="drv-row__wt">&times;${E.weight}</span>
                    ${E.note?'<span class="drv-row__note">'+E.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${w.toFixed(2)}</span>
            </div>
        </div>
    `,loadLoansSection()}const ft=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],nt=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let A=25e7,K="equipment",B=48,P="equipment",tt="",V=[];function Ot(){A=25e7,K="equipment",B=48,P="equipment",tt="",document.getElementById("lr-overlay").style.display="flex",Ft(),j()}function vt(){document.getElementById("lr-overlay").style.display="none"}function qt(t){A=Math.max(1e6,Math.min(5e9,Number(t)||0)),j()}function Pt(t){K=t,j()}function Bt(t){B=t,j()}function Dt(t){P=t,j()}async function Ft(){if(!p)return;const{data:t}=await u.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("nation_id",p.nation_id).eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null);V=t||[],j()}function j(){const t=document.getElementById("lr-modal-content");if(!t)return;const e=Number(p?.corp_cash_reserves??0),o=Number(p?.corp_loans??0),a=Number(p?.corp_reputation??50),i=p?.faction_name||"Corporation",s=(p?.abbreviation||p?.corp_ticker||"??").toUpperCase(),l=o+A,r=l>e*3?"#c55":l>e*1.5?"#c84":l>e?"#ca5":"#5c5",n=l>e*3?"DANGEROUS":l>e*1.5?"HEAVY":l>e?"MODERATE":"HEALTHY",f=P==="none"?"10-16%":P==="equipment"?"7-12%":P==="property"?"5-9%":"4-7%",x=Math.round(A*(P==="none"?.13:P==="equipment"?.095:P==="property"?.07:.055)/12+A/B),h=nt.find(m=>m.id===P)||nt[0];let c="";c+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:#5a8aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Request Loan</span>
            </div>
            <span onclick="lrClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">From:</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${v(s)}</span>
            <span style="font-size:10px;color:#e8e4dc;">${v(i)}</span>
        </div>
    </div>`,c+='<div style="flex:1;overflow-y:auto;">',c+=`<div style="padding:6px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;">
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Your Financials (visible to lenders)</span>
    </div>
    <div style="display:flex;gap:0;border-bottom:1px solid #2a2a24;">
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CASH</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;margin-top:1px;">${_(e)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CURRENT DEBT</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c84;margin-top:1px;">${_(o)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REPUTATION</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#8b9a6b;margin-top:1px;">${a}</div>
        </div>
    </div>`,c+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">LOAN AMOUNT</span>
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${_(A)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${A}"
            oninput="lrSetAmount(this.value)"
            style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">
            <span>$1M</span><span>$5B</span>
        </div>
    </div>`,c+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const m of ft){const y=K===m.id;c+=`<div onclick="lrSetPurpose('${m.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${y?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${y?"#5a8aaa44":"#2a2a24"};border-left:2px solid ${y?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${y?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${m.icon}</span>
            <div>
                <div style="font-size:11px;font-weight:600;color:${y?"#e8e4dc":"#9e9a92"};">${m.label}</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${m.desc}</div>
            </div>
        </div>`}c+="</div></div>",c+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${B} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const m of[12,24,36,48,60,84,120]){const y=B===m;c+=`<span onclick="lrSetTerm(${m})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${y?"#000":"#6a6660"};background:${y?"#5a8aaa":"transparent"};border:1px solid ${y?"#5a8aaa":"#2a2a24"};">${m}</span>`}c+=`</div>
        <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div>
    </div>`,c+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const m of nt){const y=P===m.id;c+=`<div onclick="lrSetCollateral('${m.id}')" style="padding:6px 8px;cursor:pointer;background:${y?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${y?"#5a8aaa44":"#2a2a24"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${y?"#5a8aaa":"#6a6660"};">${m.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${m.riskColor};">${m.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${m.desc}</div>
        </div>`}if(c+="</div></div>",c+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-sans);font-size:10px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${v(tt)}</textarea>
    </div>`,c+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Debt Impact Preview</div>
        <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CURRENT DEBT</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${_(o)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">+ THIS LOAN</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#5a8aaa;">+${_(A)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#e8e4dc;">NEW TOTAL DEBT</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${_(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT HEALTH</span>
                <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${r};background:${r}12;border:1px solid ${r}25;">${n}</span>
            </div>
        </div>
    </div>`,c+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,V.length>0){c+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const m of V){const y=(m.corp_company_type||"").toLowerCase()==="state"?"#c84":(m.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";c+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#1c1c18;border:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${v((m.abbreviation||m.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:#e8e4dc;flex:1;">${v(m.faction_name)}</span>
                ${m.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${y};background:${y}12;border:1px solid ${y}25;">${v(m.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}c+="</div>"}else c+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';c+=`<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div>
    </div>`,c+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div>
                    <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div>
                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">${f}</div>
                </div>
                <div>
                    <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div>
                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">~${_(x)}</div>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,c+="</div>",c+=`<div style="padding:10px 16px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div>
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${_(A)}</div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div>
                <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${h.label}</div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div>
                <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${V.length} lender${V.length!==1?"s":""}</div>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,c+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',t.innerHTML=c}async function Ht(){if(!p||!I)return;const t=document.getElementById("lr-error");if(A<1e6){t.textContent="Minimum loan amount is $1M.",t.style.display="block";return}if(A>5e9){t.textContent="Maximum loan amount is $5B.",t.style.display="block";return}if(!B||B<1||B>120){t.textContent="Term must be 1-120 months.",t.style.display="block";return}const o=((ft.find(l=>l.id===K)||{}).label||K)+(tt?" — "+tt:""),a=document.getElementById("lr-submit-btn");a.style.opacity="0.5",a.style.pointerEvents="none";const i=I.current_tick||0,{error:s}=await u.from("finance_loan_requests").insert({requesting_faction_id:p.id,nation_id:p.nation_id,amount:A,term_months:B,purpose:o,created_tick:i,expires_tick:i+5});if(a.style.opacity="1",a.style.pointerEvents="auto",s){t.textContent="Failed to submit: "+s.message,t.style.display="block";return}vt(),loadLoansSection()}window.lrOpen=Ot;window.lrClose=vt;window.lrSubmit=Ht;window.lrSetAmount=qt;window.lrSetPurpose=Pt;window.lrSetTerm=Bt;window.lrSetCollateral=Dt;window.acceptOffer=acceptOffer;window.cancelRequest=cancelRequest;function Wt(t,e){const o=(t||"").toUpperCase(),a=Number(e.corp_general_workforce??0)+Number(e.corp_skilled_workforce??0)+Number(e.corp_innovative_workforce??0),i=[{label:"Reputation",value:Number(e.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:a||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(e.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(e.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(e.corp_market_share??5),change:0,nation:o,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(e.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(e.corp_regulatory_standing??50),change:0,nation:o,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(e.corp_political_influence??10),change:0,decay:!0,nation:o,max:100},{label:"Innovation",value:Number(e.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function s(n,f){if(!f||f>100)return"var(--text-primary)";const g=n/f*100;return g>=70?"var(--green)":g>=40?"var(--amber)":g>=20?"var(--orange, #d48a3c)":"var(--red)"}function l(n){const f=parseFloat(n),g=f>0?"var(--green)":f<0?"var(--red)":"var(--text-dim)",x=f>0?"▲":f<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${g}">${x}</span>
            <span class="stat-item__delta" style="color:${g}">${Math.abs(f).toFixed(1)}</span>
        </div>`}let r="";for(const n of i){if(n.isHero){r+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${n.label}</span>
                            ${n.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${n.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${l(n.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${n.value}%"></div></div>
                </div>`;continue}n.section&&(r+=`<div class="stats-section"><span class="stats-section__label">${n.section}</span></div>`);const f=n.max&&n.max<=100;r+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${n.label}</span>
                        ${n.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${n.nation?'<span class="stat-item__nation">'+v(n.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${f?s(n.value,n.max):"var(--text-primary)"}">${typeof n.value=="number"?n.value.toLocaleString():n.value}</span>
                    ${f?'<span class="stat-item__max">/100</span>':""}
                    ${l(n.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=r}async function Ut(t,e,o,a){const i=(e||"UNKNOWN").toUpperCase();let s=[];if(o?.id){const{data:d}=await u.from("corp_properties").select("*").eq("faction_id",o.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});s=d||[]}const l={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let r=0,n=0;const f=Number(o?.corp_general_workforce??0)+Number(o?.corp_skilled_workforce??0)+Number(o?.corp_innovative_workforce??0),g=500,x=g+s.reduce((d,L)=>d+Number(L.capacity||0),0),h=x>0?Math.round(f*(g/x)):f,c=5e7,m=1+(U(t,"inflation")-50)/100*.3,y=.8+U(t,"stability")/100*.4,w=Math.round(c*m*y),N=Math.round(w*.005);r+=w,n+=N;let $=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${v(i)} · Headquarters</div>
            </div>
            <span class="prop-asset__badge">HQ</span>
        </div>
        <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${g}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${h.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${_(w)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${_(N)}</div>
            </div>
        </div>
    </div>`,R=h;for(const d of s){const L=l[d.style]||l.Basic;r+=Number(d.purchase_price||0),n+=Number(d.monthly_maintenance||0);const T=d.condition>=75?"var(--green)":d.condition>=50?"var(--amber)":"var(--orange)",k=Number(d.capacity||0),S=x>0?Math.min(f-R,Math.round(f*(k/x))):0;R+=S,$+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${v(d.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${v(d.city||i)} · ${(d.type||"").replace(/_/g," ")} · <span style="color:${L.color}">${(d.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge">OWNED</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${k.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${S.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${_(d.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${_(d.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${T}">${d.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${d.condition}%;height:100%;background:${T};"></div></div>
            ${d.refurbish_until_tick&&d.refurbish_until_tick>(a?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${d.refurbish_until_tick-(a?.current_tick||0)} tick${d.refurbish_until_tick-(a?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${d.id}','${v(d.name).replace(/'/g,"\\'")}',${d.purchase_price||0},${d.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${d.id}','${v(d.name).replace(/'/g,"\\'")}',${d.condition},${k})">REFURBISH</button>
            </div>`}
        </div>`}const C=document.getElementById("prop-count");return C&&(C.textContent=s.length+1+" ASSET"+(s.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${$}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${_(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${_(n)}/mo</span>
            </div>
        </div>
    `,{propertyValue:r,propertyMaintenance:n}}function jt(t,e,o,a,i){(e||"UNKNOWN").toUpperCase();const s=o.corp_company_type||"Private",l=Number(o.corp_cash_reserves)||0,r=i?.propertyValue||0,n=0,f=0,g=l+r+n+f,x=Number(o.corp_loans)||0,c=a?.monthlyWages||0,m=0,y=x+c+m,w=g-y,$=Math.round(w*(1+.3)),R=$-w,C=R>0;document.getElementById("val-type-badge").textContent=s.toUpperCase();function d(L,T,k={}){const S=k.indent?"val-line val-line--indent":"val-line",z=k.bold?"val-line__label val-line__label--bold":"val-line__label",O=k.bold?"val-line__value val-line__value--bold":"val-line__value",b=k.color||(k.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${S}"><span class="${z}">${L}</span><span class="${O}" style="color:${b}">${_(T)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${d("Cash & Reserves",l,{indent:!0})}
        ${d("Property",r,{indent:!0})}
        ${d("Equipment",n,{indent:!0})}
        ${d("Active Contracts",f,{indent:!0})}
        ${d("Total Assets",g,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${d("Outstanding Loans",x,{indent:!0})}
        ${d("Accounts Payable",c,{indent:!0})}
        ${d("Pending Project Costs",m,{indent:!0})}
        ${d("Total Liabilities",y,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${w>=0?"var(--green)":"var(--red)"};">${_(w)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${_($)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${C?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${C?"var(--green)":"var(--red)"};">${C?"+":""}${_(R)}</span>
            </div>
            <div class="val-market__note">${C?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let it=null,X=null;function Vt(){X&&clearInterval(X),X=setInterval(dt,1e3),dt()}function dt(){const t=document.getElementById("tick-countdown");if(!t||!it){t&&(t.textContent="—");return}const e=it-Date.now();if(e<=0){t.textContent="Tick due...",clearInterval(X);return}const o=Math.floor(e/36e5),a=Math.floor(e%36e5/6e4),i=Math.floor(e%6e4/1e3);t.textContent=o+"h "+a+"m "+i+"s"}function Gt(){document.body.classList.toggle("light-mode");const t=document.getElementById("theme-toggle");t.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const t=document.getElementById("theme-toggle");t&&(t.textContent="Dark")}async function Yt(){const t=document.getElementById("slogan-input"),e=document.getElementById("slogan-hint"),o=document.getElementById("slogan-save-btn"),a=(t.value||"").trim().slice(0,60);if(a.length===0){e.textContent="Slogan cannot be empty.",e.className="slogan-hint slogan-hint--error";return}o.disabled=!0,o.textContent="...",e.textContent="";try{const{error:i}=await u.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(i)throw i;document.getElementById("id-slogan").textContent='"'+a+'"',e.textContent="Slogan saved! Next change in 120 ticks.",e.className="slogan-hint slogan-hint--ok",o.textContent="Save"}catch(i){console.error("Slogan save failed:",i),e.textContent="Failed to save slogan.",e.className="slogan-hint slogan-hint--error",o.disabled=!1,o.textContent="Save"}}async function Kt(){await u.auth.signOut(),window.location.href="login.html"}function Qt(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function Xt(t,e){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),e==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",t=>{const e=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&e&&!e.contains(t.target)&&o.classList.remove("open")});window.doLogout=Kt;window.toggleTheme=Gt;window.saveSlogan=Yt;window.toggleCorpDropdown=Qt;window.switchToFaction=Xt;let at=!1;async function Zt(){if(at){console.warn("Dissolve already in progress");return}const{data:{user:t}}=await u.auth.getUser();if(!t){alert("Not logged in.");return}const e=sessionStorage.getItem("active_faction_id");if(!e){alert("No active faction selected.");return}const{data:o,error:a}=await u.from("factions").select("*").eq("id",e).eq("faction_type","corporation").is("abandoned_at",null).single();if(a||!o){alert("No active corporation found. It may have already been dissolved."),console.error("Dissolve lookup failed:",a?.message,"factionId:",e);return}const s=o.faction_name||"this corporation";if(!confirm("DISSOLVE "+s.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all properties, equipment, and inventory
• Remove all cash reserves
• Outstanding debts and active projects will remain

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+s+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}at=!0;const r=document.getElementById("dissolve-btn");r&&(r.disabled=!0,r.textContent="DISSOLVING...",r.style.opacity="0.5");try{async function n(c){const{error:m}=await c;if(m)throw m}await n(u.from("contract_bids").delete().eq("faction_id",e)),await n(u.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",e).in("status",["open","bidding"])),await n(u.from("corp_equipment_deliveries").delete().eq("faction_id",e)),await n(u.from("corp_equipment").delete().eq("faction_id",e)),await n(u.from("corp_properties").delete().eq("faction_id",e)),await u.from("corp_material_inventory").delete().eq("faction_id",e),await u.from("corp_warehouse").delete().eq("faction_id",e),await n(u.from("factions").update({abandoned_at:new Date().toISOString(),corp_cash_reserves:0,corp_general_workforce:0,corp_skilled_workforce:0,corp_innovative_workforce:0,action_points:0}).eq("id",e)),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:f,error:g}=await u.from("factions").select("id, faction_type").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`).is("abandoned_at",null);g&&console.warn("Failed to check remaining factions:",g.message);const x=(f||[]).find(c=>c.faction_type==="party"),h=(f||[]).find(c=>c.faction_type==="corporation");x?(sessionStorage.setItem("active_faction_id",x.id),alert(s+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):h?(sessionStorage.setItem("active_faction_id",h.id),alert(s+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(s+` has been dissolved.

You have no remaining factions.`),window.location.href="faction-select.html")}catch(n){alert("Dissolution failed: "+(n.message||n)+`

Please try again or contact support.`),r&&(r.disabled=!1,r.textContent="Dissolve Corporation",r.style.opacity="1")}finally{at=!1}}window.dissolveCorporation=Zt;let Z=!1;function Jt(t,e,o,a){if(Z)return;const i=window._nationStats,l=1+(U(i,"inflation")-50)/100*.3,r=Math.max(.1,a/100),n=Math.round(o*l*r),f=document.getElementById("prop-modal-overlay"),g=document.getElementById("prop-modal-content");g.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${v(e)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${_(o)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Inflation Modifier</span>
                <span style="color:var(--amber, #b09a5b);">${l.toFixed(3)}x</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Condition</span>
                <span style="color:${a>=75?"var(--green)":a>=50?"var(--amber)":"var(--red)"};">${a}%</span>
            </div>
            <div style="border-top:1px solid var(--border-hair);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-mono);font-weight:700;">
                <span style="color:var(--text-primary);">Sale Price</span>
                <span style="color:var(--gold, #c8a832);">${_(n)}</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-sell-confirm" onclick="confirmSellProperty('${t}', ${n})">Confirm Sale</button>
        </div>
    `,f.style.display="flex"}async function te(t,e){if(Z)return;Z=!0;const o=document.getElementById("prop-sell-confirm");o&&(o.disabled=!0,o.textContent="Selling...");try{const a=window._corpFactionId;if(!a)throw new Error("No faction");const{error:i}=await u.from("corp_properties").update({is_active:!1}).eq("id",t).eq("faction_id",a);if(i)throw new Error("Failed to sell property: "+i.message);const{data:s}=await u.from("factions").select("corp_cash_reserves").eq("id",a).single(),l=Number(s?.corp_cash_reserves??0),{error:r}=await u.from("factions").update({corp_cash_reserves:l+e}).eq("id",a);r&&console.error("[Property] Failed to credit cash:",r.message),st(),alert("Property sold for "+_(e)+". Cash credited."),location.reload()}catch(a){alert("Sale failed: "+a.message)}finally{Z=!1,o&&(o.disabled=!1,o.textContent="Confirm Sale")}}let J=!1;function ee(t,e,o,a){if(J)return;const i=window._nationStats,s=window._factionData,r=1+(U(i,"inflation")-50)/100*.3,n=Math.round(2e6*(a/1e3)),f=Math.round(n*r),g=Math.max(50,Math.round(a*.1)),x=Number(s?.corp_general_workforce??0),h=x>=g,m=Number(s?.corp_cash_reserves??0)>=f,y=document.getElementById("prop-modal-overlay"),w=document.getElementById("prop-modal-content"),N=h&&m&&o<100;let $="";o>=100?$='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property is already at 100% condition.</div>':m?h||($='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient general workforce (need '+g.toLocaleString()+", have "+x.toLocaleString()+").</div>"):$='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>',w.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${v(e)} — Current Condition: ${o}%</div>
        ${$}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost</span>
                <span style="color:${m?"var(--gold, #c8a832)":"var(--red)"};">${_(f)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Workforce Required</span>
                <span style="color:${h?"var(--blue)":"var(--red)"};">${g.toLocaleString()} General</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Duration</span>
                <span style="color:var(--amber, #b09a5b);">1–6 ticks</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">Outcome</span>
                <span style="color:var(--green);">Condition → 94–100%</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${t}', ${f}, ${g})" ${N?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,y.style.display="flex"}async function oe(t,e,o){if(J)return;J=!0;const a=document.getElementById("prop-refurb-confirm");a&&(a.disabled=!0,a.textContent="Starting...");try{const i=window._corpFactionId,s=window._currentTick;if(!i)throw new Error("No faction");const l=Math.floor(Math.random()*6)+1,n=94+(Math.floor(Math.random()*6)+1),f=s+l,{data:g}=await u.from("factions").select("corp_cash_reserves").eq("id",i).single(),x=Number(g?.corp_cash_reserves??0);if(x<e)throw new Error("Insufficient cash");const{error:h}=await u.from("factions").update({corp_cash_reserves:x-e}).eq("id",i);if(h)throw new Error("Failed to deduct cost: "+h.message);const{error:c}=await u.from("corp_properties").update({refurbish_until_tick:f,refurbish_condition:n}).eq("id",t).eq("faction_id",i);if(c)throw new Error("Failed to start refurbishment: "+c.message);st(),alert("Refurbishment started! Duration: "+l+" tick"+(l!==1?"s":"")+". Condition will be restored to "+Math.min(100,n)+"% when complete."),location.reload()}catch(i){alert("Refurbishment failed: "+i.message)}finally{J=!1,a&&(a.disabled=!1,a.textContent="Begin Refurbishment")}}function st(){const t=document.getElementById("prop-modal-overlay");t&&(t.style.display="none")}window.showSellModal=Jt;window.confirmSellProperty=te;window.showRefurbishModal=ee;window.confirmRefurbish=oe;window.closePropModal=st;const mt={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},_t={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},ne={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let G="nation",Y="local",D=null;function ae(t){return t?t.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase()):""}function lt(t,e){if(!t)return"<em>Unknown</em>";const o=v(t);return e?`<span style="color:${e.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${o}</span>`:`<strong>${o}</strong>`}function ut(t,e,o){const a=t.factions?.nation_id===(t.nation_id||e),i=t.proposer_name||(a?t.factions?.faction_name:null)||"A former party",s=t.proposer_color||(a?t.factions?.party_color:null);return{fired_at_tick:t.proposed_tick,event_name:t.bill_name,_desc_html:`${lt(i,s)} proposed "${v(t.bill_name)}"`,category:"bill",_synthetic:!0,...o}}function gt(t,e){const o=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:null,a=o?` led by <strong>${v(o)}</strong>`:"";return{fired_at_tick:0,event_name:t.faction_name,_desc_html:`${lt(t.faction_name,t.party_color)} founded${a}`,category:"new_party",_synthetic:!0,_created_at:t.created_at,...e}}function yt(t,e){const o=ne[t.tier]||`Tier ${t.tier}`,a=t.demand_label?` demanding "${v(t.demand_label)}"`:"",i=t.status==="crisis_active",s=t.tier>=6?"#e74c3c":t.tier>=4?"#f39c12":"",l=s?`<span style="color:${s};font-weight:600">${v(o)}</span>`:`<strong>${v(o)}</strong>`;return{fired_at_tick:t.tick_resolved||t.tick_called,event_name:o,_desc_html:`${lt(t.factions?.faction_name,t.factions?.party_color)} organised a protest${a} — ${l}${i?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...e}}function bt(t,e,o,a,i){return[...t.map(s=>({...s,_synthetic:!1})),...e,...o,...a].sort((s,l)=>{const r=(l.fired_at_tick||0)-(s.fired_at_tick||0);if(r!==0)return r;const n=s._created_at||s.created_at||"",f=l._created_at||l.created_at||"";return f>n?1:f<n?-1:0}).slice(0,i)}function xt(t){if(t._synthetic&&t._desc_html)return t._desc_html;const e=t.description_chosen||t.description_used||"",o=ae(t.event_name),a=o?`<strong>${v(o)}</strong>`:"",i=e?v(e):"";return a&&i?`${a} — ${i}`:i||a||"Event"}function ie(t){return t.map(e=>{const o=rt(e.fired_at_tick),a=mt[(e.category||"").toLowerCase()]||_t;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${v(o)}</span>
            <span class="corp-ev-icon" style="color:${a.color}">${a.icon}</span>
            <span class="corp-ev-text">${xt(e)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}const pt=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function re(t){let e=0;for(let o=0;o<t.length;o++)e=(e<<5)-e+t.charCodeAt(o)|0;return pt[Math.abs(e)%pt.length]}function se(t){return t.map(e=>{const o=rt(e.fired_at_tick),a=mt[(e.category||"").toLowerCase()]||_t,i=e.nations?.name||"Unknown",s=e.nations?.nation_profiles,l=Array.isArray(s)?s[0]?.flag_url:s?.flag_url,r=re(i),n=l?`<img src="${v(l)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${v(o)}</span>
                <span class="corp-ev-nation-badge" style="color:${r.color};background:${r.bg};border-color:${r.border};">${n}${v(i)}</span>
            </span>
            <span class="corp-ev-text">${xt(e)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}async function le(){const t=document.getElementById("corp-events-list");if(!t||!D)return;const{nationId:e}=D;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const{data:o,error:a}=await u.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").eq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(a)throw a;if(!o||o.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events in this nation yet.</div>';return}t.innerHTML=ht(o,!1)}catch(o){console.error("Corp local events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function ce(){const t=document.getElementById("corp-events-list");if(!t||!D)return;const{nationId:e}=D;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const{data:o,error:a}=await u.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(a)throw a;if(!o||o.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=ht(o,!0)}catch(o){console.error("Corp world events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function ht(t,e){return t.map(o=>{const a=[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown",i=o.nation||"Unknown",s=o.corp_subsector||o.corp_sector||"General",l=o.corp_ticker||o.abbreviation||"",r=o.founded_tick?rt(o.founded_tick):"";let n='<div class="corp-event-row">';return e&&(n+='<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--teal);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);padding:1px 5px;display:inline-block;margin-bottom:2px;">'+v(i.toUpperCase())+"</div>"),n+='<div style="font-size:11px;color:var(--text-primary);line-height:1.5;">',n+='<span style="font-weight:600;">'+v(o.faction_name)+"</span>",l&&(n+=' <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">['+v(l)+"]</span>"),n+=' was founded in <span style="font-weight:500;">'+v(i)+"</span>",n+=' with a specialty in <span style="color:var(--teal);font-weight:500;">'+v(s)+"</span>.",n+=' Led by CEO <span style="font-weight:500;">'+v(a)+"</span>.",n+="</div>",r&&(n+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">'+v(r)+"</div>"),n+="</div>",n}).join("")}async function wt(){const t=document.getElementById("corp-events-list");if(!t||!D)return;const{nationId:e}=D;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[o,a,i,s]=await Promise.all([u.from("event_log").select("*").eq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(50),u.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),u.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",e).order("created_at",{ascending:!1}).limit(20),u.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(o.error)throw o.error;const l=o.data||[],r=bt(l,(a.data||[]).map(n=>ut(n,e)),(i.data||[]).map(n=>gt(n)),(s.data||[]).map(n=>yt(n)),60);if(r.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>';return}t.innerHTML=ie(r)}catch(o){console.error("Nation events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function de(){const t=document.getElementById("corp-events-list");if(!t||!D)return;const{nationId:e}=D;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[o,a,i,s]=await Promise.all([u.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(60),u.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),u.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("created_at",{ascending:!1}).limit(15),u.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(o.error)throw o.error;const l=o.data||[],r=bt(l,(a.data||[]).map(n=>ut(n,null,{nations:n.nations})),(i.data||[]).map(n=>gt(n,{nations:n.nations})),(s.data||[]).map(n=>yt(n,{nations:n.nations})),60);if(r.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>';return}t.innerHTML=se(r)}catch(o){console.error("World events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}window.switchCorpEventsCat=function(t){t!==G&&(G=t,document.querySelectorAll("#corp-events-cat-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.cat===t)),$t())};window.switchCorpEventsScope=function(t){t!==Y&&(Y=t,document.querySelectorAll("#corp-events-scope-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.scope===t)),$t())};function $t(){G==="nation"&&Y==="local"?wt():G==="nation"&&Y==="world"?de():G==="corporate"&&Y==="local"?le():ce()}Rt();
