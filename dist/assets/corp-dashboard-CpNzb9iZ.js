import{_ as p}from"./supabase-client-BXEzLDpS.js";import{e as m,t as lt}from"./utils-C2W-HleY.js";import{initMessaging as Rt}from"./messaging-B5Fng3EZ.js";import{c as zt}from"./equipment-DsuDdEne.js";let U=[],c=null,C=null;function u(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(2)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(1)+"k":"$"+Math.round(t).toLocaleString()}function W(t,e){return Number(t?.[e]??50)}async function qt(){const{data:{user:t}}=await p.auth.getUser();if(!t){window.location.href="login.html";return}const{data:e}=await p.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);U=(e||[]).filter(x=>x.nation_id&&!x.abandoned_at);const o=sessionStorage.getItem("active_faction_id");if(c=U.find(x=>x.id===o)||U.find(x=>x.faction_type==="corporation")||U[0],!c){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",c.id),c.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i={Construction:"corp-operations.html",Finance:"corp-operations-finance.html"}[c.corp_sector]||"corp-operations.html",r=document.getElementById("nav-operations"),s=document.getElementById("nav-expansion");r&&(r.href=i),s&&(s.href="corp-operations.html?tab=expansion");let l=c.nation||"",n=null;const[d,g]=await Promise.all([c.nation_id?p.from("nations").select("*").eq("id",c.nation_id).single():Promise.resolve({data:null}),p.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);d.error&&console.warn("Nation load failed:",d.error.message),d.data&&(l=d.data.name,n=d.data),g.error&&console.warn("Shard load failed:",g.error.message),C=g.data;const b=c.corp_ticker||c.abbreviation||"";if(document.getElementById("corp-logo").textContent=b.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=c.faction_name||"Unnamed Corp",C){if(document.getElementById("game-date").textContent=C.current_date||"—",document.getElementById("tick-number").textContent=C.current_tick||"—",C.next_tick_at){const O=(Number(C.tick_interval_hours)||8)*36e5,F=new Date(C.next_tick_at).getTime(),H=F-O+O/2;st=new Date(H>Date.now()?H:F+O/2),Qt()}const x=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");x&&(x.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(b?"["+b+"]":c.faction_name||"Corp")+" ▾";const h=document.getElementById("topbar-cash");if(h){const x=Number(c.corp_cash_reserves??0),O=x>=1e9?"$"+(x/1e9).toFixed(1)+"B":x>=1e6?"$"+(x/1e6).toFixed(1)+"M":"$"+Math.round(x/1e3)+"k";h.textContent="CASH: "+O}const f=document.getElementById("topbar-ap");f&&(f.style.display="none");const _=document.getElementById("corp-faction-dropdown");if(_){let x="";for(const L of U){const H=L.id===c.id,pt=L.faction_type==="corporation"?"CORP":"PARTY",Q=L.faction_type==="corporation"?"var(--teal)":"var(--amber)";x+=`<div class="corp-dd-item${H?" active":""}" onclick="switchToFaction('${L.id}', '${L.faction_type}')">
                <span class="corp-dd-type" style="color:${Q}">${pt}</span>
                <span class="corp-dd-name">${m(L.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${m(L.abbreviation||"—")}]</span>
            </div>`}U.some(L=>L.faction_type==="corporation")||(x+=`<div class="corp-dd-item corp-dd-item--create" onclick="window.location.href='corp-setup.html'">
                <span class="corp-dd-type" style="color:var(--teal)">+</span>
                <span class="corp-dd-name">Found a Corporation</span>
            </div>`),U.some(L=>L.faction_type==="party")||(x+=`<div class="corp-dd-item corp-dd-item--create" onclick="sessionStorage.setItem('pending_faction_type','party'); window.location.href='select-nation.html'">
                <span class="corp-dd-type" style="color:var(--amber)">+</span>
                <span class="corp-dd-name">Found a Political Party</span>
            </div>`),_.innerHTML=x}document.getElementById("id-type-badge").textContent=c.corp_company_type||"—",document.getElementById("id-logo").textContent=b.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=c.faction_name||"Unnamed Corp";const y=c.party_description||"";document.getElementById("id-slogan").textContent=y?'"'+y+'"':'"--"';const w=C?.current_date?C.current_date.replace(/.*,\s*/,""):"—",N=c.leader_first_name&&c.leader_last_name?c.leader_first_name+" "+c.leader_last_name+(c.leader_age?" ("+c.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${m(w)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${m(l||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${m(c.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${m(c.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${m(N)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${m(c.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${m(b)}</span>
        </div>
    `;const $=c.last_rename_tick||0,R=C?.current_tick||0,v=Math.max(0,$+120-R),S=!y||y==="-"||y==='"-"'||v<=0,k=document.getElementById("slogan-editor");k.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${m(y)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${S?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${S?"60 characters max. 120 tick cooldown after change.":v+" ticks until you can change slogan."}</div>
    `,window._corpFactionId=c.id,window._currentTick=R,window._nationStats=n,window._factionData=c;const M=At(n,l,c);Gt(l,c);const z=await Yt(n,l,c,C);let A=0;if(c?.id){const{data:x,error:O}=await p.from("corp_equipment").select("equipment_key, owned").eq("faction_id",c.id);O||(A=zt(x||[]))}Ot(n,C,M,c,z.propertyMaintenance||0,A),Kt(n,l,c,M,z),Rt(c,n,C),D={nationId:c.nation_id},kt(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function At(t,e,o){const a=x=>W(t,x),i=(e||"UNKNOWN").toUpperCase(),r=Number(o?.corp_general_workforce??2250),s=Number(o?.corp_skilled_workforce??600),l=Number(o?.corp_innovative_workforce??150),n=r+s+l,d=2,g=3,b=6,h=a("minimum_wage"),f=h/100*48e3,_=a("inflation"),y=a("standard_of_living"),w=1+(_-50)/100*.5,N=1+(y-50)/100*.5,$=x=>Math.round(f*x*w*N),R=$(d),T=$(g),v=$(b),I=r*R,S=s*T,k=l*v,M=I+S+k;function z(x){return"$"+Math.round(x).toLocaleString()+"/yr"}const A=`${w.toFixed(2)} &times; ${N.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=n.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${m(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${d}.0 &times; ${A})</span>
                <span class="wf-tier__value">${z(R)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${u(I)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${m(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${s.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${g}.0 &times; ${A})</span>
                <span class="wf-tier__value">${z(T)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${u(S)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${m(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${b}.0 &times; ${A})</span>
                <span class="wf-tier__value">${z(v)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${u(k)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${m(i)})</span>
                <span class="wf-tier__value">${h}/100 → ${z(f)}</span>
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
                <span class="wf-total__value" style="color:var(--red);">${u(M)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${u(M/12)}</span>
            </div>
        </div>
    `,{totalWages:M,generalTotal:I,skilledTotal:S,innovativeTotal:k,monthlyWages:Math.round(M/12)}}function Ot(t,e,o,a,i,r){const s=e?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+s;const l=5e7,n=E=>W(t,E),d=1+(n("gdp_growth")-50)/100*.4,g=1+(n("urbanization")-50)/100*.3,b=1+(n("population_growth")-50)/100*.2,h=1+(n("standard_of_living")-50)/100*.15,f=1+(50-n("physical_infrastructure"))/100*.1,_=1-Math.max(0,n("inflation")-50)/100*.1,y=1-Math.max(0,n("interest_rates")-50)/100*.1,w=d*g*b*h*f*_*y,N=Math.round(l*w),$=(a.corp_general_workforce||0)+(a.corp_skilled_workforce||0)+(a.corp_innovative_workforce||0),R=Math.min(1,$/3e3),T=Math.round(Math.round(N/12)*R),v=0,I=0,S=v+I+T,k=o?.totalWages||0,M=Math.round(k/12),z=0,A=0,x=i||0,O=r||0,F=Number(a?.corp_loans)||0,L=.05,H=F>0?Math.round(F*(L/12)/(1-Math.pow(1+L/12,-120))):0,Q=M+z+x+O+H+A+75e3,ot=S-Q,Ct=Number(a?.corp_cash_reserves??0),Tt=F,St=[{stat:"gdp_growth",value:n("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:n("urbanization"),weight:"0.3"},{stat:"population_growth",value:n("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:n("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:n("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:n("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:n("interest_rates"),weight:"-0.1",neg:!0}];function Mt(E){return E.neg?E.value>50?"var(--red)":"var(--green)":E.note?E.value<50?"var(--green)":"var(--red)":E.value>=50?"var(--green)":E.value>=35?"var(--amber)":"var(--red)"}const nt=S||1,Lt=(v/nt*100).toFixed(1),It=(I/nt*100).toFixed(1),Nt=(T/nt*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${Lt}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${It}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${Nt}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${u(v)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${u(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${u(T)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${u(S)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${u(M)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${u(z)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${u(x)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${u(O)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${u(H)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${u(A)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${u(Q)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${ot>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${ot>=0?"var(--green)":"var(--red)"}">${u(ot)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${u(Ct)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${u(Tt)}</div>
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
            ${St.map(E=>`
                <div class="drv-row">
                    <span class="drv-row__name">${E.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${E.value}%;background:${Mt(E)}"></div></div>
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
    `,et()}const mt=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],at=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let q=25e7,K="equipment",B=48,P="equipment",tt="",V=[];function Pt(){q=25e7,K="equipment",B=48,P="equipment",tt="",document.getElementById("lr-overlay").style.display="flex",Ut(),j()}function _t(){document.getElementById("lr-overlay").style.display="none"}function Bt(t){q=Math.max(1e6,Math.min(5e9,Number(t)||0)),j()}function Dt(t){K=t,j()}function Ft(t){B=t,j()}function Ht(t){P=t,j()}async function Ut(){if(!c)return;const{data:t}=await p.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",c.id);V=t||[],j()}function j(){const t=document.getElementById("lr-modal-content");if(!t)return;const e=Number(c?.corp_cash_reserves??0),o=Number(c?.corp_loans??0),a=Number(c?.corp_reputation??50),i=c?.faction_name||"Corporation",r=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase(),s=o+q,l=s>e*3?"#c55":s>e*1.5?"#c84":s>e?"#ca5":"#5c5",n=s>e*3?"DANGEROUS":s>e*1.5?"HEAVY":s>e?"MODERATE":"HEALTHY",d=P==="none"?"10-16%":P==="equipment"?"7-12%":P==="property"?"5-9%":"4-7%",b=Math.round(q*(P==="none"?.13:P==="equipment"?.095:P==="property"?.07:.055)/12+q/B),h=at.find(_=>_.id===P)||at[0];let f="";f+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:#5a8aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Request Loan</span>
            </div>
            <span onclick="lrClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">From:</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${m(r)}</span>
            <span style="font-size:10px;color:#e8e4dc;">${m(i)}</span>
        </div>
    </div>`,f+='<div style="flex:1;overflow-y:auto;">',f+=`<div style="padding:6px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;">
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Your Financials (visible to lenders)</span>
    </div>
    <div style="display:flex;gap:0;border-bottom:1px solid #2a2a24;">
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CASH</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;margin-top:1px;">${u(e)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CURRENT DEBT</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c84;margin-top:1px;">${u(o)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REPUTATION</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#8b9a6b;margin-top:1px;">${a}</div>
        </div>
    </div>`,f+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">LOAN AMOUNT</span>
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${u(q)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${q}"
            oninput="lrSetAmount(this.value)"
            style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">
            <span>$1M</span><span>$5B</span>
        </div>
    </div>`,f+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const _ of mt){const y=K===_.id;f+=`<div onclick="lrSetPurpose('${_.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${y?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${y?"#5a8aaa44":"#2a2a24"};border-left:2px solid ${y?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${y?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${_.icon}</span>
            <div>
                <div style="font-size:11px;font-weight:600;color:${y?"#e8e4dc":"#9e9a92"};">${_.label}</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${_.desc}</div>
            </div>
        </div>`}f+="</div></div>",f+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${B} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const _ of[12,24,36,48,60,84,120]){const y=B===_;f+=`<span onclick="lrSetTerm(${_})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${y?"#000":"#6a6660"};background:${y?"#5a8aaa":"transparent"};border:1px solid ${y?"#5a8aaa":"#2a2a24"};">${_}</span>`}f+=`</div>
        <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div>
    </div>`,f+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const _ of at){const y=P===_.id;f+=`<div onclick="lrSetCollateral('${_.id}')" style="padding:6px 8px;cursor:pointer;background:${y?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${y?"#5a8aaa44":"#2a2a24"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${y?"#5a8aaa":"#6a6660"};">${_.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${_.riskColor};">${_.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${_.desc}</div>
        </div>`}if(f+="</div></div>",f+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-sans);font-size:10px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${m(tt)}</textarea>
    </div>`,f+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Debt Impact Preview</div>
        <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CURRENT DEBT</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${u(o)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">+ THIS LOAN</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#5a8aaa;">+${u(q)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#e8e4dc;">NEW TOTAL DEBT</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${u(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT HEALTH</span>
                <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${l};background:${l}12;border:1px solid ${l}25;">${n}</span>
            </div>
        </div>
    </div>`,f+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,V.length>0){f+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const _ of V){const y=(_.corp_company_type||"").toLowerCase()==="state"?"#c84":(_.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";f+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#1c1c18;border:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${m((_.abbreviation||_.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:#e8e4dc;flex:1;">${m(_.faction_name)}</span>
                ${_.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${y};background:${y}12;border:1px solid ${y}25;">${m(_.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}f+="</div>"}else f+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';f+=`<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div>
    </div>`,f+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div>
                    <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div>
                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">${d}</div>
                </div>
                <div>
                    <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div>
                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">~${u(b)}</div>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,f+="</div>",f+=`<div style="padding:10px 16px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div>
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${u(q)}</div>
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
    </div>`,f+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',t.innerHTML=f}async function Wt(){if(!c||!C)return;const t=document.getElementById("lr-error");if(q<1e6){t.textContent="Minimum loan amount is $1M.",t.style.display="block";return}if(q>5e9){t.textContent="Maximum loan amount is $5B.",t.style.display="block";return}if(!B||B<1||B>120){t.textContent="Term must be 1-120 months.",t.style.display="block";return}const o=((mt.find(s=>s.id===K)||{}).label||K)+(tt?" — "+tt:""),a=document.getElementById("lr-submit-btn");a.style.opacity="0.5",a.style.pointerEvents="none";const i=C.current_tick||0,{error:r}=await p.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,amount:q,term_months:B,purpose:o,created_tick:i,expires_tick:i+5});if(a.style.opacity="1",a.style.pointerEvents="auto",r){t.textContent="Failed to submit: "+r.message,t.style.display="block";return}_t(),et()}window.lrOpen=Pt;window.lrClose=_t;window.lrSubmit=Wt;window.lrSetAmount=Bt;window.lrSetPurpose=Dt;window.lrSetTerm=Ft;window.lrSetCollateral=Ht;let it=!1;async function jt(t,e){if(!(!c||it)){it=!0;try{const{data:o,error:a}=await p.from("finance_loan_offers").select("*").eq("id",t).single();if(a||!o)return;const{data:i,error:r}=await p.from("finance_loan_requests").select("*").eq("id",e).single();if(r||!i||i.status!=="open")return;const s=o.interest_rate/100/12,l=i.term_months,n=s>0?Math.round(i.amount*s/(1-Math.pow(1+s,-l))):Math.round(i.amount/l),d=C?.current_tick||0,{error:g}=await p.from("finance_loan_requests").update({status:"funded",accepted_offer_id:t,funded_tick:d}).eq("id",e);if(g)return;await p.from("finance_loan_offers").update({status:"accepted"}).eq("id",t),await p.from("finance_loan_offers").update({status:"declined"}).eq("request_id",e).neq("id",t).eq("status","pending"),await p.from("finance_active_loans").insert({request_id:e,offer_id:t,borrower_faction_id:i.requesting_faction_id,lender_faction_id:o.offering_faction_id,nation_id:i.nation_id,principal:i.amount,interest_rate:o.interest_rate,term_months:i.term_months,collateral_type:o.collateral_type,purpose:i.purpose,monthly_payment:n,started_tick:d});const{data:b}=await p.from("factions").select("corp_cash_reserves").eq("id",o.offering_faction_id).single();b&&await p.from("factions").update({corp_cash_reserves:Math.max(0,(Number(b.corp_cash_reserves)||0)-i.amount)}).eq("id",o.offering_faction_id);const{data:h}=await p.from("factions").select("corp_cash_reserves").eq("id",i.requesting_faction_id).single();h&&await p.from("factions").update({corp_cash_reserves:(Number(h.corp_cash_reserves)||0)+i.amount}).eq("id",i.requesting_faction_id)}finally{it=!1}et()}}async function Vt(t){await p.from("finance_loan_requests").update({status:"cancelled"}).eq("id",t),et()}async function et(){if(!c)return;const t=document.getElementById("fin-loans-list");if(!t)return;const{data:e}=await p.from("finance_loan_requests").select("*, finance_loan_offers(*)").eq("requesting_faction_id",c.id).in("status",["open","funded"]).order("created_tick",{ascending:!1}),{data:o}=await p.from("finance_active_loans").select("*").eq("borrower_faction_id",c.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1});let a="";if(e&&e.length>0){for(const i of e)if(i.status==="open"){const r=(i.finance_loan_offers||[]).filter(s=>s.status==="pending");if(a+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span style="color:#5a8aaa;font-weight:700;">OPEN</span>
                            <span style="color:var(--text-primary);margin-left:4px;">${u(i.amount)}</span>
                            <span style="color:var(--text-dim);margin-left:4px;">${i.term_months}mo</span>
                        </div>
                        <span style="color:var(--text-dim);cursor:pointer;" onclick="cancelRequest('${i.id}')">&#10005;</span>
                    </div>
                    <div style="font-size:7px;color:var(--text-dim);margin-top:2px;">${m(i.purpose||"")}</div>`,r.length>0){a+=`<div style="margin-top:4px;font-size:7px;color:#5a8aaa;font-weight:700;">${r.length} OFFER${r.length>1?"S":""}</div>`;for(const s of r.sort((l,n)=>l.interest_rate-n.interest_rate))a+=`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-top:1px solid var(--border-hair);">
                            <span style="color:var(--text-primary);font-weight:700;">${s.interest_rate}%</span>
                            <span style="color:var(--text-dim);">${s.collateral_type}</span>
                            <span style="flex:1;"></span>
                            <span style="padding:2px 8px;cursor:pointer;color:#000;background:#5a8aaa;font-weight:700;font-size:7px;" onclick="acceptOffer('${s.id}','${i.id}')">ACCEPT</span>
                        </div>`}else a+='<div style="margin-top:2px;font-size:7px;color:var(--text-dim);">Awaiting offers from finance corporations...</div>';a+="</div>"}}if(o&&o.length>0)for(const i of o){const r=i.status==="current"?"var(--green)":i.status==="late"?"#c84":"#c55",s=i.term_months>0?Math.round(i.payments_made/i.term_months*100):0;a+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="color:${r};font-weight:700;">${i.status.toUpperCase()}</span>
                        <span style="color:var(--text-primary);margin-left:4px;">${u(i.principal)}</span>
                        <span style="color:var(--text-dim);margin-left:4px;">@ ${i.interest_rate}%</span>
                    </div>
                    <span style="color:var(--text-dim);">${s}% repaid</span>
                </div>
                <div style="height:2px;background:var(--border-0);margin-top:3px;">
                    <div style="height:100%;width:${s}%;background:${r};"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Payment: ${u(i.monthly_payment)}/mo</span>
                    <span>${i.payments_made}/${i.term_months} payments</span>
                </div>
            </div>`}a||(a='<div style="color:var(--text-dim);">No active loans.</div>'),t.innerHTML=a}window.acceptOffer=jt;window.cancelRequest=Vt;function Gt(t,e){const o=(t||"").toUpperCase(),a=Number(e.corp_general_workforce??0)+Number(e.corp_skilled_workforce??0)+Number(e.corp_innovative_workforce??0),i=[{label:"Reputation",value:Number(e.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:a||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(e.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(e.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(e.corp_market_share??5),change:0,nation:o,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(e.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(e.corp_regulatory_standing??50),change:0,nation:o,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(e.corp_political_influence??10),change:0,decay:!0,nation:o,max:100},{label:"Innovation",value:Number(e.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function r(n,d){if(!d||d>100)return"var(--text-primary)";const g=n/d*100;return g>=70?"var(--green)":g>=40?"var(--amber)":g>=20?"var(--orange, #d48a3c)":"var(--red)"}function s(n){const d=parseFloat(n),g=d>0?"var(--green)":d<0?"var(--red)":"var(--text-dim)",b=d>0?"▲":d<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${g}">${b}</span>
            <span class="stat-item__delta" style="color:${g}">${Math.abs(d).toFixed(1)}</span>
        </div>`}let l="";for(const n of i){if(n.isHero){l+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${n.label}</span>
                            ${n.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${n.value}</span>
                            <span class="stats-hero__max">/100</span>
                            ${s(n.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${n.value}%"></div></div>
                </div>`;continue}n.section&&(l+=`<div class="stats-section"><span class="stats-section__label">${n.section}</span></div>`);const d=n.max&&n.max<=100;l+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${n.label}</span>
                        ${n.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${n.nation?'<span class="stat-item__nation">'+m(n.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${d?r(n.value,n.max):"var(--text-primary)"}">${typeof n.value=="number"?n.value.toLocaleString():n.value}</span>
                    ${d?'<span class="stat-item__max">/100</span>':""}
                    ${s(n.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=l}async function Yt(t,e,o,a){const i=(e||"UNKNOWN").toUpperCase();let r=[];if(o?.id){const{data:v}=await p.from("corp_properties").select("*").eq("faction_id",o.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});r=v||[]}const s={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,n=0;const d=Number(o?.corp_general_workforce??0)+Number(o?.corp_skilled_workforce??0)+Number(o?.corp_innovative_workforce??0),g=500,b=g+r.reduce((v,I)=>v+Number(I.capacity||0),0),h=b>0?Math.round(d*(g/b)):d,f=5e7,_=1+(W(t,"inflation")-50)/100*.3,y=.8+W(t,"stability")/100*.4,w=Math.round(f*_*y),N=Math.round(w*.005);l+=w,n+=N;let $=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${m(i)} · Headquarters</div>
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
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${u(w)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${u(N)}</div>
            </div>
        </div>
    </div>`,R=h;for(const v of r){const I=s[v.style]||s.Basic;l+=Number(v.purchase_price||0),n+=Number(v.monthly_maintenance||0);const S=v.condition>=75?"var(--green)":v.condition>=50?"var(--amber)":"var(--orange)",k=Number(v.capacity||0),M=b>0?Math.min(d-R,Math.round(d*(k/b))):0;R+=M,$+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${m(v.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${m(v.city||i)} · ${(v.type||"").replace(/_/g," ")} · <span style="color:${I.color}">${(v.style||"Basic").toUpperCase()}</span></div>
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
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${M.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${u(v.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${u(v.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${S}">${v.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${v.condition}%;height:100%;background:${S};"></div></div>
            ${v.refurbish_until_tick&&v.refurbish_until_tick>(a?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${v.refurbish_until_tick-(a?.current_tick||0)} tick${v.refurbish_until_tick-(a?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${v.id}','${m(v.name).replace(/'/g,"\\'")}',${v.purchase_price||0},${v.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${v.id}','${m(v.name).replace(/'/g,"\\'")}',${v.condition},${k})">REFURBISH</button>
            </div>`}
        </div>`}const T=document.getElementById("prop-count");return T&&(T.textContent=r.length+1+" ASSET"+(r.length+1!==1?"S":"")),document.getElementById("prop-body").innerHTML=`
        ${$}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${u(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${u(n)}/mo</span>
            </div>
        </div>
    `,{propertyValue:l,propertyMaintenance:n}}function Kt(t,e,o,a,i){(e||"UNKNOWN").toUpperCase();const r=o.corp_company_type||"Private",s=Number(o.corp_cash_reserves)||0,l=i?.propertyValue||0,n=0,d=0,g=s+l+n+d,b=Number(o.corp_loans)||0,f=a?.monthlyWages||0,_=0,y=b+f+_,w=g-y,$=Math.round(w*(1+.3)),R=$-w,T=R>0;document.getElementById("val-type-badge").textContent=r.toUpperCase();function v(I,S,k={}){const M=k.indent?"val-line val-line--indent":"val-line",z=k.bold?"val-line__label val-line__label--bold":"val-line__label",A=k.bold?"val-line__value val-line__value--bold":"val-line__value",x=k.color||(k.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${M}"><span class="${z}">${I}</span><span class="${A}" style="color:${x}">${u(S)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${v("Cash & Reserves",s,{indent:!0})}
        ${v("Property",l,{indent:!0})}
        ${v("Equipment",n,{indent:!0})}
        ${v("Active Contracts",d,{indent:!0})}
        ${v("Total Assets",g,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${v("Outstanding Loans",b,{indent:!0})}
        ${v("Accounts Payable",f,{indent:!0})}
        ${v("Pending Project Costs",_,{indent:!0})}
        ${v("Total Liabilities",y,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${w>=0?"var(--green)":"var(--red)"};">${u(w)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${u($)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${T?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${T?"var(--green)":"var(--red)"};">${T?"+":""}${u(R)}</span>
            </div>
            <div class="val-market__note">${T?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `}let st=null,X=null;function Qt(){X&&clearInterval(X),X=setInterval(ft,1e3),ft()}function ft(){const t=document.getElementById("tick-countdown");if(!t||!st){t&&(t.textContent="—");return}const e=st-Date.now();if(e<=0){t.textContent="Tick due...",clearInterval(X);return}const o=Math.floor(e/36e5),a=Math.floor(e%36e5/6e4),i=Math.floor(e%6e4/1e3);t.textContent=o+"h "+a+"m "+i+"s"}function Xt(){document.body.classList.toggle("light-mode");const t=document.getElementById("theme-toggle");t.textContent=document.body.classList.contains("light-mode")?"Dark":"Light",localStorage.setItem("nationhood_theme",document.body.classList.contains("light-mode")?"light":"dark")}if(localStorage.getItem("nationhood_theme")==="light"){document.body.classList.add("light-mode");const t=document.getElementById("theme-toggle");t&&(t.textContent="Dark")}async function Zt(){const t=document.getElementById("slogan-input"),e=document.getElementById("slogan-hint"),o=document.getElementById("slogan-save-btn"),a=(t.value||"").trim().slice(0,60);if(a.length===0){e.textContent="Slogan cannot be empty.",e.className="slogan-hint slogan-hint--error";return}o.disabled=!0,o.textContent="...",e.textContent="";try{const{error:i}=await p.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(i)throw i;document.getElementById("id-slogan").textContent='"'+a+'"',e.textContent="Slogan saved! Next change in 120 ticks.",e.className="slogan-hint slogan-hint--ok",o.textContent="Save"}catch(i){console.error("Slogan save failed:",i),e.textContent="Failed to save slogan.",e.className="slogan-hint slogan-hint--error",o.disabled=!1,o.textContent="Save"}}async function Jt(){await p.auth.signOut(),window.location.href="login.html"}function te(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function ee(t,e){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),e==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",t=>{const e=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&e&&!e.contains(t.target)&&o.classList.remove("open")});window.doLogout=Jt;window.toggleTheme=Xt;window.saveSlogan=Zt;window.toggleCorpDropdown=te;window.switchToFaction=ee;let rt=!1;async function oe(){if(rt){console.warn("Dissolve already in progress");return}const{data:{user:t}}=await p.auth.getUser();if(!t){alert("Not logged in.");return}const e=sessionStorage.getItem("active_faction_id");if(!e){alert("No active faction selected.");return}const{data:o,error:a}=await p.from("factions").select("*").eq("id",e).eq("faction_type","corporation").is("abandoned_at",null).single();if(a||!o){alert("No active corporation found. It may have already been dissolved."),console.error("Dissolve lookup failed:",a?.message,"factionId:",e);return}const r=o.faction_name||"this corporation";if(!confirm("DISSOLVE "+r.toUpperCase()+`?

This will permanently:
• Remove the corporation from the game
• Delete all properties, equipment, and inventory
• Remove all cash reserves
• Outstanding debts and active projects will remain

This action CANNOT be undone.`))return;if(prompt('Type "DISSOLVE" to confirm permanent dissolution of '+r+":")!=="DISSOLVE"){alert("Dissolution cancelled.");return}rt=!0;const l=document.getElementById("dissolve-btn");l&&(l.disabled=!0,l.textContent="DISSOLVING...",l.style.opacity="0.5");try{async function n(f){const{error:_}=await f;if(_)throw _}await n(p.from("contract_bids").delete().eq("faction_id",e)),await n(p.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",e).in("status",["open","bidding"])),await n(p.from("corp_equipment_deliveries").delete().eq("faction_id",e)),await n(p.from("corp_equipment").delete().eq("faction_id",e)),await n(p.from("corp_properties").delete().eq("faction_id",e)),await p.from("corp_material_inventory").delete().eq("faction_id",e),await p.from("corp_warehouse").delete().eq("faction_id",e),await n(p.from("factions").update({abandoned_at:new Date().toISOString(),corp_cash_reserves:0,corp_general_workforce:0,corp_skilled_workforce:0,corp_innovative_workforce:0,action_points:0}).eq("id",e)),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:d,error:g}=await p.from("factions").select("id, faction_type").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`).is("abandoned_at",null);g&&console.warn("Failed to check remaining factions:",g.message);const b=(d||[]).find(f=>f.faction_type==="party"),h=(d||[]).find(f=>f.faction_type==="corporation");b?(sessionStorage.setItem("active_faction_id",b.id),alert(r+` has been dissolved.

Redirecting to your political party.`),window.location.href="dashboard.html"):h?(sessionStorage.setItem("active_faction_id",h.id),alert(r+` has been dissolved.

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(r+` has been dissolved.

You have no remaining factions.`),window.location.href="faction-select.html")}catch(n){alert("Dissolution failed: "+(n.message||n)+`

Please try again or contact support.`),l&&(l.disabled=!1,l.textContent="Dissolve Corporation",l.style.opacity="1")}finally{rt=!1}}window.dissolveCorporation=oe;let Z=!1;function ne(t,e,o,a){if(Z)return;const i=window._nationStats,s=1+(W(i,"inflation")-50)/100*.3,l=Math.max(.1,a/100),n=Math.round(o*s*l),d=document.getElementById("prop-modal-overlay"),g=document.getElementById("prop-modal-content");g.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${m(e)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${u(o)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Inflation Modifier</span>
                <span style="color:var(--amber, #b09a5b);">${s.toFixed(3)}x</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Condition</span>
                <span style="color:${a>=75?"var(--green)":a>=50?"var(--amber)":"var(--red)"};">${a}%</span>
            </div>
            <div style="border-top:1px solid var(--border-hair);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-mono);font-weight:700;">
                <span style="color:var(--text-primary);">Sale Price</span>
                <span style="color:var(--gold, #c8a832);">${u(n)}</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-sell-confirm" onclick="confirmSellProperty('${t}', ${n})">Confirm Sale</button>
        </div>
    `,d.style.display="flex"}async function ae(t,e){if(Z)return;Z=!0;const o=document.getElementById("prop-sell-confirm");o&&(o.disabled=!0,o.textContent="Selling...");try{const a=window._corpFactionId;if(!a)throw new Error("No faction");const{error:i}=await p.from("corp_properties").update({is_active:!1}).eq("id",t).eq("faction_id",a);if(i)throw new Error("Failed to sell property: "+i.message);const{data:r}=await p.from("factions").select("corp_cash_reserves").eq("id",a).single(),s=Number(r?.corp_cash_reserves??0),{error:l}=await p.from("factions").update({corp_cash_reserves:s+e}).eq("id",a);l&&console.error("[Property] Failed to credit cash:",l.message),ct(),alert("Property sold for "+u(e)+". Cash credited."),location.reload()}catch(a){alert("Sale failed: "+a.message)}finally{Z=!1,o&&(o.disabled=!1,o.textContent="Confirm Sale")}}let J=!1;function ie(t,e,o,a){if(J)return;const i=window._nationStats,r=window._factionData,l=1+(W(i,"inflation")-50)/100*.3,n=Math.round(2e6*(a/1e3)),d=Math.round(n*l),g=Math.max(50,Math.round(a*.1)),b=Number(r?.corp_general_workforce??0),h=b>=g,_=Number(r?.corp_cash_reserves??0)>=d,y=document.getElementById("prop-modal-overlay"),w=document.getElementById("prop-modal-content"),N=h&&_&&o<100;let $="";o>=100?$='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property is already at 100% condition.</div>':_?h||($='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient general workforce (need '+g.toLocaleString()+", have "+b.toLocaleString()+").</div>"):$='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>',w.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${m(e)} — Current Condition: ${o}%</div>
        ${$}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost</span>
                <span style="color:${_?"var(--gold, #c8a832)":"var(--red)"};">${u(d)}</span>
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
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${t}', ${d}, ${g})" ${N?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,y.style.display="flex"}async function re(t,e,o){if(J)return;J=!0;const a=document.getElementById("prop-refurb-confirm");a&&(a.disabled=!0,a.textContent="Starting...");try{const i=window._corpFactionId,r=window._currentTick;if(!i)throw new Error("No faction");const s=Math.floor(Math.random()*6)+1,n=94+(Math.floor(Math.random()*6)+1),d=r+s,{data:g}=await p.from("factions").select("corp_cash_reserves").eq("id",i).single(),b=Number(g?.corp_cash_reserves??0);if(b<e)throw new Error("Insufficient cash");const{error:h}=await p.from("factions").update({corp_cash_reserves:b-e}).eq("id",i);if(h)throw new Error("Failed to deduct cost: "+h.message);const{error:f}=await p.from("corp_properties").update({refurbish_until_tick:d,refurbish_condition:n}).eq("id",t).eq("faction_id",i);if(f)throw new Error("Failed to start refurbishment: "+f.message);ct(),alert("Refurbishment started! Duration: "+s+" tick"+(s!==1?"s":"")+". Condition will be restored to "+Math.min(100,n)+"% when complete."),location.reload()}catch(i){alert("Refurbishment failed: "+i.message)}finally{J=!1,a&&(a.disabled=!1,a.textContent="Begin Refurbishment")}}function ct(){const t=document.getElementById("prop-modal-overlay");t&&(t.style.display="none")}window.showSellModal=ne;window.confirmSellProperty=ae;window.showRefurbishModal=ie;window.confirmRefurbish=re;window.closePropModal=ct;const ut={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},gt={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},se={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let G="nation",Y="local",D=null;function le(t){return t?t.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase()):""}function dt(t,e){if(!t)return"<em>Unknown</em>";const o=m(t);return e?`<span style="color:${e.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${o}</span>`:`<strong>${o}</strong>`}function yt(t,e,o){const a=t.factions?.nation_id===(t.nation_id||e),i=t.proposer_name||(a?t.factions?.faction_name:null)||"A former party",r=t.proposer_color||(a?t.factions?.party_color:null);return{fired_at_tick:t.proposed_tick,event_name:t.bill_name,_desc_html:`${dt(i,r)} proposed "${m(t.bill_name)}"`,category:"bill",_synthetic:!0,...o}}function bt(t,e){const o=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:null,a=o?` led by <strong>${m(o)}</strong>`:"";return{fired_at_tick:0,event_name:t.faction_name,_desc_html:`${dt(t.faction_name,t.party_color)} founded${a}`,category:"new_party",_synthetic:!0,_created_at:t.created_at,...e}}function xt(t,e){const o=se[t.tier]||`Tier ${t.tier}`,a=t.demand_label?` demanding "${m(t.demand_label)}"`:"",i=t.status==="crisis_active",r=t.tier>=6?"#e74c3c":t.tier>=4?"#f39c12":"",s=r?`<span style="color:${r};font-weight:600">${m(o)}</span>`:`<strong>${m(o)}</strong>`;return{fired_at_tick:t.tick_resolved||t.tick_called,event_name:o,_desc_html:`${dt(t.factions?.faction_name,t.factions?.party_color)} organised a protest${a} — ${s}${i?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...e}}function ht(t,e,o,a,i){return[...t.map(r=>({...r,_synthetic:!1})),...e,...o,...a].sort((r,s)=>{const l=(s.fired_at_tick||0)-(r.fired_at_tick||0);if(l!==0)return l;const n=r._created_at||r.created_at||"",d=s._created_at||s.created_at||"";return d>n?1:d<n?-1:0}).slice(0,i)}function wt(t){if(t._synthetic&&t._desc_html)return t._desc_html;const e=t.description_chosen||t.description_used||"",o=le(t.event_name),a=o?`<strong>${m(o)}</strong>`:"",i=e?m(e):"";return a&&i?`${a} — ${i}`:i||a||"Event"}function ce(t){return t.map(e=>{const o=lt(e.fired_at_tick),a=ut[(e.category||"").toLowerCase()]||gt;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${m(o)}</span>
            <span class="corp-ev-icon" style="color:${a.color}">${a.icon}</span>
            <span class="corp-ev-text">${wt(e)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}const vt=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function de(t){let e=0;for(let o=0;o<t.length;o++)e=(e<<5)-e+t.charCodeAt(o)|0;return vt[Math.abs(e)%vt.length]}function pe(t){return t.map(e=>{const o=lt(e.fired_at_tick),a=ut[(e.category||"").toLowerCase()]||gt,i=e.nations?.name||"Unknown",r=e.nations?.nation_profiles,s=Array.isArray(r)?r[0]?.flag_url:r?.flag_url,l=de(i),n=s?`<img src="${m(s)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${m(o)}</span>
                <span class="corp-ev-nation-badge" style="color:${l.color};background:${l.bg};border-color:${l.border};">${n}${m(i)}</span>
            </span>
            <span class="corp-ev-text">${wt(e)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}async function fe(){const t=document.getElementById("corp-events-list");if(!t||!D)return;const{nationId:e}=D;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const{data:o,error:a}=await p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").eq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(a)throw a;if(!o||o.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events in this nation yet.</div>';return}t.innerHTML=$t(o,!1)}catch(o){console.error("Corp local events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function ve(){const t=document.getElementById("corp-events-list");if(!t||!D)return;const{nationId:e}=D;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const{data:o,error:a}=await p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(a)throw a;if(!o||o.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>';return}t.innerHTML=$t(o,!0)}catch(o){console.error("Corp world events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function $t(t,e){return t.map(o=>{const a=[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown",i=o.nation||"Unknown",r=o.corp_subsector||o.corp_sector||"General",s=o.corp_ticker||o.abbreviation||"",l=o.founded_tick?lt(o.founded_tick):"";let n='<div class="corp-event-row">';return e&&(n+='<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--teal);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);padding:1px 5px;display:inline-block;margin-bottom:2px;">'+m(i.toUpperCase())+"</div>"),n+='<div style="font-size:11px;color:var(--text-primary);line-height:1.5;">',n+='<span style="font-weight:600;">'+m(o.faction_name)+"</span>",s&&(n+=' <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">['+m(s)+"]</span>"),n+=' was founded in <span style="font-weight:500;">'+m(i)+"</span>",n+=' with a specialty in <span style="color:var(--teal);font-weight:500;">'+m(r)+"</span>.",n+=' Led by CEO <span style="font-weight:500;">'+m(a)+"</span>.",n+="</div>",l&&(n+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">'+m(l)+"</div>"),n+="</div>",n}).join("")}async function kt(){const t=document.getElementById("corp-events-list");if(!t||!D)return;const{nationId:e}=D;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[o,a,i,r]=await Promise.all([p.from("event_log").select("*").eq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(50),p.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",e).order("created_at",{ascending:!1}).limit(20),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(o.error)throw o.error;const s=o.data||[],l=ht(s,(a.data||[]).map(n=>yt(n,e)),(i.data||[]).map(n=>bt(n)),(r.data||[]).map(n=>xt(n)),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>';return}t.innerHTML=ce(l)}catch(o){console.error("Nation events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function me(){const t=document.getElementById("corp-events-list");if(!t||!D)return;const{nationId:e}=D;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[o,a,i,r]=await Promise.all([p.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(60),p.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("created_at",{ascending:!1}).limit(15),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(o.error)throw o.error;const s=o.data||[],l=ht(s,(a.data||[]).map(n=>yt(n,null,{nations:n.nations})),(i.data||[]).map(n=>bt(n,{nations:n.nations})),(r.data||[]).map(n=>xt(n,{nations:n.nations})),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>';return}t.innerHTML=pe(l)}catch(o){console.error("World events error:",o),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}window.switchCorpEventsCat=function(t){t!==G&&(G=t,document.querySelectorAll("#corp-events-cat-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.cat===t)),Et())};window.switchCorpEventsScope=function(t){t!==Y&&(Y=t,document.querySelectorAll("#corp-events-scope-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.scope===t)),Et())};function Et(){G==="nation"&&Y==="local"?kt():G==="nation"&&Y==="world"?me():G==="corporate"&&Y==="local"?fe():ve()}qt();
