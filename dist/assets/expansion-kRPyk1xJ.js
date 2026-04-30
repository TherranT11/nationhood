import{_supabase as x}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{hfFmtBig as g,escapeHtml as B}from"./utils-A98FEun4.js";import{renderCorpTopBar as Ye}from"./corp-topbar-CYaKZ_BF.js";import{c as Je,d as Ke}from"./corp-shipping-data-DA_tOdLs.js";import{b as Me,c as Ie}from"./corp-valuation-C0hsb2EQ.js";import"./preload-helper-BXl3LOEh.js";let Ee=null,Ae=null,Te=null,Be=[];function L(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Xe(o){const t=String(o||"").trim().toLowerCase();return t==="amortized"||t==="amortising"||t==="amortizing"?"amortized":"flat"}function Ze(o){const t=String(o?.loan_funding_model||"").trim().toLowerCase();return t==="parent_corp"?"parent_corp":t==="subsidiary_cash"?"subsidiary_cash":null}async function et(o,t,e,r){Ee=o,Ae=t;const d=document.getElementById(e);if(!d)return;d.innerHTML='<div style="padding:16px;text-align:center;color:#4a4940;font-family:monospace;font-size:10px;">Loading dashboard...</div>';const[n,i]=await Promise.all([o.from("subsidiary_auto_rates").select("*").eq("subsidiary_id",r).maybeSingle(),o.from("subsidiary_auto_policies").select("*").eq("subsidiary_id",r).order("started_tick",{ascending:!1}).limit(50)]);n.error&&console.error("[SubDash] Rate fetch error:",n.error.message),i.error&&console.error("[SubDash] Policies fetch error:",i.error.message),Te=n.data,Be=i.data||[],Re(d)}function Re(o){const t=Te,e=Be,r=t?.service_type==="insurance",d=r?"#c84":"#5a8aaa",n=r?"Insurance":"Banking";if(!t){o.innerHTML=`
            <div class="csd-panel">
                <div class="csd-empty">
                    <div style="font-size:1.5rem;margin-bottom:8px;opacity:0.4;">${r?"🛡️":"🏦"}</div>
                    <div style="font-family:monospace;font-size:10px;color:#888;">Auto-rate not yet generated.</div>
                    <div style="font-family:monospace;font-size:8px;color:#4a4940;margin-top:4px;">Rates are generated automatically each tick based on national interest rates.</div>
                </div>
            </div>
        `;return}const i=e.filter(m=>m.status==="active"),y=Number(t.total_revenue??0),a=Number(t.total_claims??0),c=y-a,u=c>=0?"#5cb85c":"#d9534f",f=e.slice(0,20).map(m=>{const b=m.status==="active"?"#5cb85c":m.status==="defaulted"?"#d9534f":m.status==="repaid"?"#5a8aaa":"#666",h=Xe(m.loan_interest_model||m.interest_model||m.loan_interest_type),$=Ze(m);return`
            <div class="csd-policy-row">
                <span class="csd-policy-status" style="color:${b};">●</span>
                <span class="csd-policy-type">${m.service_type==="insurance"?"INS":"LOAN"}</span>
                <span class="csd-policy-rate">${m.rate_at_issue}%</span>
                <span class="csd-policy-principal">${L(m.principal)}</span>
                <span class="csd-policy-payment">${L(m.monthly_payment)}/mo</span>
                <span class="csd-policy-paid">${L(m.total_paid)} paid</span>
                ${m.service_type==="loan"?`<span class="csd-policy-type" style="color:#8ab0c7;">${h==="amortized"?"AMORTIZED":"FLAT"}</span>`:""}
                ${m.service_type==="loan"&&$?`<span class="csd-policy-type" style="color:#b9a46a;">${$==="parent_corp"?"PARENT":"SUB CASH"}</span>`:""}
                <span class="csd-policy-badge" style="color:${b};border-color:${b}44;background:${b}0a;">${m.status.toUpperCase()}</span>
            </div>
        `}).join("");o.innerHTML=`
        <div class="csd-panel">
            <!-- Header -->
            <div class="csd-header">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:8px;height:8px;border-radius:50%;background:${d};display:inline-block;"></span>
                    <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:${d};text-transform:uppercase;">${n} Services Dashboard</span>
                </div>
                <span style="font-family:monospace;font-size:8px;color:#666;">${t.is_active?"ACTIVE":"INACTIVE"}</span>
            </div>

            <!-- Rate overview -->
            <div class="csd-rate-section">
                <div class="csd-rate-card">
                    <div class="csd-rate-card-label">Effective Rate</div>
                    <div class="csd-rate-card-value" style="color:${d};font-size:24px;">${t.effective_rate}%</div>
                    <div class="csd-rate-breakdown">
                        Base: ${t.base_rate}% ${Number(t.markup)>0?"+ Markup: "+t.markup+"%":""}
                    </div>
                </div>
                <div class="csd-rate-card">
                    <div class="csd-rate-card-label">Active Policies</div>
                    <div class="csd-rate-card-value">${i.length}</div>
                    <div class="csd-rate-breakdown">${t.policies_issued||0} total issued</div>
                </div>
                <div class="csd-rate-card">
                    <div class="csd-rate-card-label">Net Revenue</div>
                    <div class="csd-rate-card-value" style="color:${u};">${L(c)}</div>
                    <div class="csd-rate-breakdown">
                        <span style="color:#5cb85c;">${L(y)} collected</span>
                        ${a>0?` &mdash; <span style="color:#d9534f;">${L(a)} claims</span>`:""}
                    </div>
                </div>
                ${r?`<div class="csd-rate-card">
                    <div class="csd-rate-card-label">Deductible</div>
                    <div class="csd-rate-card-value">${t.deductible_pct}%</div>
                    <div class="csd-rate-breakdown">Applied to claim payouts</div>
                </div>`:""}
            </div>

            <!-- Markup control -->
            <div class="csd-markup-section">
                <div class="csd-markup-header">
                    <span class="csd-markup-label">Owner Markup</span>
                    <span class="csd-markup-value" id="csd-markup-display">${t.markup}%</span>
                </div>
                <div class="csd-markup-slider-row">
                    <span style="font-family:monospace;font-size:7px;color:#4a4940;">0%</span>
                    <input type="range" min="0" max="50" step="1" value="${Math.round(Number(t.markup)*10)}" id="csd-markup-slider" class="csd-slider">
                    <span style="font-family:monospace;font-size:7px;color:#4a4940;">5%</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
                    <span style="font-family:monospace;font-size:7px;color:#4a4940;">Higher markup = more revenue per policy, fewer customers</span>
                    <button class="csd-save-btn" id="csd-save-markup">Save Markup</button>
                </div>
            </div>

            <!-- Service limits -->
            <div class="csd-limits-section">
                <div class="csd-limits-row">
                    <span class="csd-limits-label">${r?"Max Coverage":"Max Loan"}</span>
                    <span class="csd-limits-value">${L(t.coverage_limit||0)}</span>
                </div>
                <div class="csd-limits-row">
                    <span class="csd-limits-label">Term Range</span>
                    <span class="csd-limits-value">${t.min_term_months}-${t.max_term_months} months</span>
                </div>
            </div>

            <!-- Policies table -->
            <div class="csd-policies-section">
                <div class="csd-policies-title">Issued Policies (${e.length})</div>
                ${e.length===0?'<div style="font-family:monospace;font-size:9px;color:#4a4940;font-style:italic;padding:8px 0;">No policies issued yet. Corporations in this nation will see your rates and can accept coverage.</div>':`<div class="csd-policies-list">${f}</div>`}
            </div>
        </div>
    `;const s=document.getElementById("csd-markup-slider"),l=document.getElementById("csd-markup-display");s&&l&&s.addEventListener("input",()=>{l.textContent=(s.value/10).toFixed(1)+"%"}),document.getElementById("csd-save-markup")?.addEventListener("click",async()=>{const m=Number(s?.value||0)/10,b=document.getElementById("csd-save-markup");b&&(b.disabled=!0,b.textContent="Saving...");try{const h=Ae.nation,$=Je(h,t.service_type,m),{error:_}=await Ee.from("subsidiary_auto_rates").update({markup:$.markup,effective_rate:$.effectiveRate,updated_at:new Date().toISOString()}).eq("id",t.id);if(_){console.error("[SubDash] Save markup failed:",_.message),alert("Failed to save markup.");return}t.markup=$.markup,t.effective_rate=$.effectiveRate,Re(o)}catch(h){console.error("[SubDash] Save markup error:",h)}finally{b&&(b.disabled=!1,b.textContent="Save Markup")}})}const tt=.02,Le=30,ve=25,ot=.05,Se=2e5,W=50,nt=.3,it=1.7;function at(o=W){const t=Number(o??W);return Math.max(nt,Math.min(it,(t-W)/100+1))}function Pe({subCash:o=0,gdpGrowth:t=50,parentReputation:e=W}={}){const r=Number(o||0),d=Number(t??50),n=ve/100,i=at(e),y=Math.max(0,r),a=(d-Le)/100,c=Math.round(y*tt*(1+a)*n*i),u=Math.max(.1,1+(50-d)/100),f=Math.round(Se*u);let s=c-f;const l=Math.max(Se,Math.round(Math.abs(r)*ot));return s<0&&(s=Math.max(s,-l)),{investmentReturn:c,overhead:f,maxLoss:l,netDelta:s,gdp:d,gdpMod:a,overheadMult:u,parentRepMult:i,parentReputation:Number(e??W)}}async function rt(){const[o,t]=await Promise.all([x.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_loans, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),x.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, sub_cash, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("role","subsidiary").eq("is_active",!0)]),e={};for(const s of o.data||[])e[s.id]=s;const r=(o.data||[]).map(s=>s.id).filter(Boolean),d={};if(r.length){const{data:s}=await x.from("finance_active_loans").select("lender_faction_id, principal, remaining_principal, finance_loan_requests!inner(request_type)").in("lender_faction_id",r).in("status",["current","late","delinquent"]);for(const l of s||[]){const m=l.lender_faction_id;(d[m]||=[]).push(l)}}const n=(o.data||[]).map(s=>{const l=(s.corp_company_type||"Private").toUpperCase(),m=Number(s.corp_cash_reserves||0),b=Number(s.corp_loans||0),h=Me(d[s.id]||[]).total;return{...s,abbr:s.corp_ticker||s.abbreviation||s.faction_name?.slice(0,4).toUpperCase()||"???",status:l,isPlayer:!!s.linked_user_id,reputation:Math.round(Number(s.corp_reputation??50)),revenue:Math.round(m*.1),valuation:Ie({cash:m,loans:b,financeReceivables:h}),_isSub:!1}}),{data:i}=await x.from("nations").select("id, name, gdp_growth"),y={},a={};(i||[]).forEach(s=>{y[s.id]=s.name,a[s.id]=Number(s.gdp_growth??50)});const c=[...new Set((t.data||[]).map(s=>s.faction_id).filter(Boolean))],u=[...new Set((t.data||[]).map(s=>s.nation_id).filter(Boolean))],f={};if(c.length&&u.length){const{data:s,error:l}=await x.from("corp_properties").select("faction_id, nation_id, purchase_price, capacity").in("faction_id",c).in("nation_id",u).eq("is_active",!0);l&&console.warn("[loadAllCorporations] subsidiary props fetch failed:",l.message);for(const m of s||[]){const b=`${m.faction_id}|${m.nation_id}`;(f[b]||=[]).push(m)}}for(const s of t.data||[]){const l=e[s.faction_id];if(!l)continue;const m=(l.corp_company_type||"Private").toUpperCase(),b=Number(s.sub_cash??0),h=a[s.nation_id]??50,_=(f[`${s.faction_id}|${s.nation_id}`]||[]).reduce((z,E)=>z+Number(E.purchase_price||0),0),S=Pe({subCash:b,gdpGrowth:h,parentReputation:Number(l.corp_reputation??50)});n.push({id:s.id,faction_name:s.name||"Subsidiary",abbreviation:l.abbreviation,corp_sector:l.corp_sector,corp_subsector:s.subsector||l.corp_subsector,corp_ticker:l.corp_ticker,corp_cash_reserves:b,nation_id:s.nation_id,nation:y[s.nation_id]||"?",abbr:(l.corp_ticker||l.abbreviation||"??").slice(0,4),status:m,isPlayer:!!l.linked_user_id,reputation:ve,revenue:S.netDelta,valuation:_,_isSub:!0,_parentName:l.faction_name})}return n}let V=[],p=null,w=null,R=null,st=[],N={general:0,skilled:0,innovative:0},fe=!1;const j=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Oe(o){const t=Number(w?.minimum_wage??50),e=Number(w?.inflation??50),r=Number(w?.standard_of_living??50),d=t/100*48e3,n=1+(e-50)/100*.5,i=1+(r-50)/100*.5;return Math.round(d*o*n*i)}function ae(){return k.reduce((t,e)=>{const r=Number(e.capacity||0),d=Number(e.condition||0)/100;return t+Math.floor(r*d)},0)+500}function lt(o,t){const e=j.find(n=>n.id===o),r=Number(p?.[e.factionKey]??0),d=N[o]+t;if(!(r+d<0)){if(t>0){const n=j.reduce((y,a)=>{const c=Number(p?.[a.factionKey]??0),u=a.id===o?d:N[a.id];return y+c+u},0),i=ae();if(n>i)return}N[o]=d,re()}}function dt(o){o?N[o]=0:N={general:0,skilled:0,innovative:0},re()}async function ct(){if(fe||!Object.values(N).some(i=>i!==0))return;let t=0;for(const i of j){const y=N[i.id];y>0&&(t+=y*Oe(i.multiplier)*.1)}const e=Number(p?.corp_cash_reserves??0);if(t>e){alert("Insufficient cash reserves. Hiring cost: "+g(t)+", available: "+g(e));return}const r=j.reduce((i,y)=>i+Number(p?.[y.factionKey]??0)+N[y.id],0),d=ae();if(r>d){alert("Cannot hire beyond property capacity ("+d.toLocaleString()+"). You need more workplaces.");return}const n=t>0?`Confirm workforce changes?

Hiring fee: `+g(t)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(n)){fe=!0;try{const i={};for(const c of j){const u=Number(p?.[c.factionKey]??0);i[c.factionKey]=Math.max(0,u+N[c.id])}t>0&&(i.corp_cash_reserves=Math.max(0,e-Math.round(t)));const{error:y}=await x.from("factions").update(i).eq("id",p.id);if(y)throw y;Object.assign(p,i),N={general:0,skilled:0,innovative:0};const a=document.getElementById("topbar-cash");if(a){const c=Number(p.corp_cash_reserves??0);a.textContent="CASH: "+(c>=1e6?"$"+(c/1e6).toFixed(1)+"M":"$"+Math.round(c/1e3)+"k")}re()}catch(i){alert("Error: "+i.message)}finally{fe=!1}}}function re(){const o=document.getElementById("hf-card-container");if(!o)return;const t="'JetBrains Mono', monospace",e={bg:"var(--bg-card)",surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},r=Number(w?.minimum_wage??50),d=Number(w?.inflation??50),n=Number(w?.standard_of_living??50),i=r/100*48e3,y=(1+(d-50)/100*.5).toFixed(2),a=(1+(n-50)/100*.5).toFixed(2),c=w?.name||p?.nation||"Nation",u=Object.values(N).some(_=>_!==0),f=ae();let s=0,l=0,m=0,b=0,h="";for(const _ of j){const S=Number(p?.[_.factionKey]??0),z=N[_.id],E=S+z,D=Oe(_.multiplier),A=z>0,G=S*D,C=E*D,pe=C-G;s+=S,l+=E,m+=G,b+=C;const Qe=z!==0?A?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";h+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${Qe};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${_.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${e.text}">${_.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.text}">${S.toLocaleString()}</span>
                    ${z!==0?`<span style="font-family:${t};font-size:10px;color:${e.dim}">→</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${A?e.greenBright:e.red}">${E.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">WAGE (MIN × ${_.multiplier}.0 × ${y} × ${a})</span>
                <span style="font-family:${t};font-size:10px;color:${_.color}">${g(D)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${_.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.red};border:1px solid ${e.border};cursor:pointer;background:${e.card}">-50</div>
                <div onclick="hfSetChange('${_.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.redDim};border:1px solid ${e.border};cursor:pointer;background:${e.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${z!==0?e.card:"transparent"};border:1px solid ${z!==0?e.border:"transparent"}">
                    ${z!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${t};font-size:12px;font-weight:700;color:${A?e.greenBright:e.red}">${A?"+":""}${z}</span>
                        <span onclick="hfReset('${_.id}')" style="font-family:${t};font-size:8px;color:${e.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${t};font-size:9px;color:${e.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${_.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.greenBright};border:1px solid ${e.border};cursor:pointer;background:${e.card}">+10</div>
                <div onclick="hfSetChange('${_.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.greenBright};border:1px solid ${e.border};cursor:pointer;background:${e.card}">+50</div>
            </div>
            ${z!==0?`<div style="margin-top:6px;padding:4px 8px;background:${e.bg};border:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${pe>0?e.red:e.greenBright}">${pe>0?"+":""}${g(pe)}/yr</span>
            </div>`:""}
        </div>`}const $=b-m;o.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${c.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1.5px;color:${e.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">MIN WAGE</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${r}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">${g(i)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${d}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">×${y}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${n}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">×${a}</div>
                    </div>
                </div>
            </div>
            ${h}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${u?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${s>=f?e.red:e.text}">${u?l.toLocaleString():s.toLocaleString()}</span>
                        <span style="font-family:${t};font-size:9px;color:${e.dim}">/ ${f.toLocaleString()}</span>
                    </div>
                    ${s>=f&&!u?`<div style="font-family:${t};font-size:7px;color:${e.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${g(m)}</span>
                        ${u?`<span style="font-family:${t};font-size:9px;color:${e.dim}">→</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${$>0?e.red:e.greenBright}">${g(b)}</span>`:""}
                    </div>
                </div>
            </div>
            ${u?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${e.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">NET CHANGE</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${$>0?e.red:e.greenBright}">${$>0?"+":""}${g($)}/yr</span>
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">(${$>0?"+":""}${g(Math.round($/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function pt(){const o=document.getElementById("wf-summary-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},r=(w?.name||p?.nation||"Nation").toUpperCase(),d=Number(w?.minimum_wage??50),n=Number(w?.inflation??50),i=Number(w?.standard_of_living??50),y=d/100*48e3,a=1+(n-50)/100*.5,c=1+(i-50)/100*.5,u=[{label:"General Workforce",mult:2,color:e.accent,key:"corp_general_workforce",countColor:e.text},{label:"Skilled Workforce",mult:3,color:e.gold,key:"corp_skilled_workforce",countColor:e.blue},{label:"Innovative Workforce",mult:6,color:e.orange,key:"corp_innovative_workforce",countColor:e.gold}];let f=0,s=0,l="";for(const m of u){const b=Number(p?.[m.key]??0),h=Math.round(y*m.mult*a*c),$=b*h;f+=b,s+=$,l+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${e.text}">${m.label}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${r}</span>
                </div>
                <span style="font-family:${t};font-size:16px;font-weight:700;color:${m.countColor}">${b.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">WAGE (MIN × ${m.mult}.0 × ${a.toFixed(2)} × ${c.toFixed(2)})</span>
                <span style="font-family:${t};font-size:10px;color:${e.muted}">${g(h)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${g($)}</span>
            </div>
        </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Workforce</span>
            </div>
            <span style="font-family:${t};font-size:12px;font-weight:700;color:${e.text}">${f.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${l}
            <div style="padding:8px 12px;background:${e.card};border-bottom:1px solid ${e.border};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1px;color:${e.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">MINIMUM WAGE (${r})</span>
                    <span style="font-family:${t};font-size:9px;color:${e.text}">${d}/100 → ${g(y)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${e.text}">×${a.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${e.text}">×${c.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL WORKFORCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.text}">${f.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL ANNUAL WAGES</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${g(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${g(Math.round(s/12))}</span>
            </div>
        </div>
    </div>`}let k=[];async function $e(){if(!p?.id)return;const{data:o}=await x.from("corp_properties").select("*").eq("faction_id",p.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});k=o||[]}function he(){const o=document.getElementById("property-card-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},r=(w?.name||p?.nation||"Nation").toUpperCase();let d="",n=0,i=0;const y=w?.name||p?.nation||"Home Nation",a=5e7,c=1+(Number(w?.inflation??50)-50)/100*.3,u=.8+Number(w?.stability??50)/100*.4,f=Math.round(a*c*u),s=Math.round(f*.005);n+=f,i+=s,d+=`
    <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;font-weight:600;color:${e.text}">National Headquarters</span>
            <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:#5c5;background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">HQ</span>
        </div>
        <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px;">${y} · Headquarters</div>
        <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">CAPACITY</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">500</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">VALUE</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${g(f)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">MAINT/MO</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.red}">${g(s)}</div>
            </div>
        </div>
    </div>`;for(const l of k){const m=oe[l.style]||oe.Basic;n+=Number(l.purchase_price||0),i+=Number(l.monthly_maintenance||0),d+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${e.text}">${l.name}</span>
                <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${e.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px;">${l.city||r} · ${(l.type||"").replace(/_/g," ")} · <span style="color:${m.color}">${(l.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">CAPACITY</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${(l.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">PAID</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${g(l.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">MAINT/MO</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.red}">${g(l.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">CONDITION</span>
                <span style="font-family:${t};font-size:9px;color:${l.condition>=75?"#5c5":l.condition>=50?"#ca5":e.orange}">${l.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${e.border};margin-top:2px;"><div style="width:${l.condition}%;height:100%;background:${l.condition>=75?"#5c5":l.condition>=50?"#ca5":e.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propSell('${l.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${t};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${e.red};border:1px solid ${e.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${t};font-size:10px;color:${e.muted}">${k.length+1} ASSET${k.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${d}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.green}">${g(n)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${g(i)}/mo</span>
            </div>
        </div>
    </div>`}let F=[],I=null;const oe={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function _e(){if(!p?.nation_id)return;const{data:o,error:t}=await x.from("available_properties").select("*, property_catalog:catalog_id(subsector_lock)").eq("nation_id",p.nation_id).eq("status","available").order("price",{ascending:!0});if(t){console.warn("[Property] Failed to load marketplace:",t.message);return}const e=p?.corp_sector==="Construction",r=(p?.corp_subsector||"").toLowerCase();F=(o||[]).filter(d=>e||d.type!=="warehouse").filter(d=>{const n=d.property_catalog?.subsector_lock;return!n||n===r}).map(d=>({...d,adjusted_cost:d.price,adjusted_maintenance:d.monthly_maintenance}))}function se(){const o=document.getElementById("new-property-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"};(w?.name||p?.nation||"Nation").toUpperCase();const r=Number(w?.standard_of_living??50),d=Number(w?.gdp_growth??50),n=Number(w?.inflation??50),i=w?.capital||"Capital",y={capital:i,port:i+" Port",industrial:i+" Industrial Zone",suburban:i+" Suburbs",coastal:i+" Coast"};let a="";if(F.length===0)a=`<div style="padding:20px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let c=0;c<F.length;c++){const u=F[c],f=I===c,s=oe[u.style]||oe.Basic,l=y[u.city_template]||i;a+=`
            <div onclick="npSelect(${c})" style="padding:8px 14px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${f?e.accent:"transparent"};background:${f?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${e.text}">${u.name}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${s.color};background:${s.color}12;border:1px solid ${s.color}25">${s.label}</span>
                </div>
                <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:5px;">${l} · ${u.type.replace(/_/g," ")}</div>
                <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">CAPACITY</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.text};margin-top:1px">${u.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">PRICE</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.gold};margin-top:1px">${g(u.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.redDim};margin-top:1px">${g(u.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${f?`<div style="margin-top:5px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:${t};font-size:7px;color:${e.dim}">CONDITION</span>
                        <span style="font-family:${t};font-size:9px;color:${u.condition>=75?e.greenBright:u.condition>=50?e.yellow:e.orange}">${u.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${u.condition}%;height:100%;background:${u.condition>=75?e.greenBright:u.condition>=50?e.yellow:e.orange}"></div></div>
                </div>`:""}
            </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">New Property</span>
            </div>
            <span style="font-family:${t};font-size:9px;color:${e.dim}">${F.length} AVAILABLE</span>
        </div>
        <div style="padding:4px 14px;border-bottom:1px solid ${e.border};display:flex;gap:12px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">STD OF LIVING</span>
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${r>=50?e.greenBright:e.yellow}">${Math.round(r)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">GDP GROWTH</span>
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${d>=50?e.greenBright:e.yellow}">${Math.round(d)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">INFLATION</span>
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${n<=50?e.greenBright:e.red}">${Math.round(n)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${a}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold};border:1px solid ${e.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${I!==null?"#000":e.dim};background:${I!==null?e.accent:"transparent"};border:1px solid ${I!==null?e.accent:e.border};cursor:${I!==null?"pointer":"default"};opacity:${I!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function ft(o){I=I===o?null:o,se()}let ue=!1;async function ut(){if(I===null||ue)return;const o=F[I];if(!o)return;const t=Number(p?.corp_cash_reserves??0);if(o.adjusted_cost>t){alert(`Insufficient cash reserves.
Property: `+g(o.adjusted_cost)+`
Cash: `+g(t));return}if(confirm('Buy "'+o.name+'" for '+g(o.adjusted_cost)+`?

Monthly maintenance: `+g(o.adjusted_maintenance)+`/mo
Condition: `+o.condition+`%

This will be deducted from your cash reserves.`)){ue=!0;try{const{error:e}=await x.from("corp_properties").insert({faction_id:p.id,nation_id:p.nation_id,catalog_id:o.catalog_id||null,name:o.name,type:o.type,role:o.type,style:o.style,capacity:o.capacity,purchase_price:o.adjusted_cost,monthly_maintenance:o.adjusted_maintenance,condition:o.condition,city:o.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(e)throw e;const r=Math.max(0,t-o.adjusted_cost),{error:d}=await x.from("factions").update({corp_cash_reserves:r}).eq("id",p.id);if(d)throw d;p.corp_cash_reserves=r,o.id&&await x.from("available_properties").update({status:"sold",purchased_by:p.id}).eq("id",o.id);const n=document.getElementById("topbar-cash");n&&(n.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),I=null,await _e(),se(),he(),alert("Property purchased: "+o.name+`

Deducted: `+g(o.adjusted_cost))}catch(e){alert("Purchase failed: "+e.message)}finally{ue=!1}}}const U={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let we=!1,v={name:"",type:"Office Building",size:2e3,style:"Modern",nationId:null,nationName:null},me=!1,be=[];function je(){const t=1+(Number(w?.inflation??50)-50)/100*.3,e=U[v.style]?.costMod||1,r=v.type==="Warehouse"?.75:1,d=Math.round(v.size*1e5*t*e*r),n=Math.round(d*.007*(U[v.style]?.maintMod||1));return{total:d,maint:n,inflMod:t,styleMod:e}}async function mt(){we=!0;const o=p?.nation_id,t=w?.name||p?.nation||"Home Nation";v={name:"",type:"Office Building",size:2e3,style:"Modern",nationId:o,nationName:t},be=[{id:o,name:t,label:"National HQ"}];try{const{data:e}=await x.from("corp_properties").select("nation_id, name, nations!nation_id(name)").eq("faction_id",p.id).eq("type","regional_hq").eq("is_active",!0);for(const r of e||[])r.nation_id!==o&&be.push({id:r.nation_id,name:r.nations?.name||"Unknown",label:r.name||"Regional HQ"})}catch{}De()}function ke(){we=!1,document.getElementById("cp-modal-overlay")?.remove()}function yt(o,t){v[o]=t,De()}async function gt(){if(!(me||!v.name.trim())){if(!v.nationId){alert("Select a location.");return}me=!0;try{const o=je(),t=v.nationId,e=v.nationName||"Unknown",r=U[v.style]?.repGain||1,d=await x.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),n=d.data?.current_tick||0,i=(d.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:y}=await x.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",t).eq("issuer_type","PRIVATE"),c=`PVT-C${(y||0)+1}-${i}`,{error:u}=await x.from("construction_contracts").insert({nation_id:t,template_key:"custom_building",sector:"civil_engineering",name:v.name.trim(),project_type:v.type,project_subtype:v.style,description:`${v.type} (${v.style}) — ${v.size.toLocaleString()} employees, commissioned by ${p.faction_name}`,project_code:c,budget_ceiling:o.total,timeline_ticks:Math.max(4,Math.ceil(v.size/2e3)+2),required_materials:(()=>{const f=v.size/1e3,s=v.style,l={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[s]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},m=(b,h)=>Math.max(1,Math.ceil(f*b*h));return{concrete:m(8,l.concrete),steel:m(6,l.steel),glass_facades:m(3,l.glass),em_systems:m(4,l.em),lumber:m(1,l.lumber),heavy_parts:m(2,l.heavy),aggregate:m(3,l.agg)}})(),required_equipment:(()=>{const f=v.size,s={trucks:Math.ceil(f/2e3)+1,mixers:Math.ceil(f/3e3)+1};return f>1e3&&(s.excavators=Math.ceil(f/3e3)+1,s.cranes=Math.ceil(f/4e3)+1),f>3e3&&(s.bulldozers=Math.ceil(f/4e3)+1,s.haulers=Math.ceil(f/5e3)+1),f>8e3&&(s.pile_drivers=Math.ceil(f/6e3)+1),s})(),required_workforce:{general:Math.ceil(v.size*.08),skilled:Math.ceil(v.size*.03)},status:"open",generated_at_tick:n,bidding_ends_tick:n+3,issuer_type:"PRIVATE",issuer_name:p.faction_name,issuer_faction_id:p.id});if(u)throw u;ke(),alert(`Construction project submitted!

Project: `+v.name.trim()+`
Code: `+c+`
Budget: `+g(o.total)+`
Expected Reputation: +`+Math.ceil(o.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+e+" can now bid on this project.")}catch(o){alert("Failed to submit project: "+o.message)}finally{me=!1}}}function De(){if(document.getElementById("cp-modal-overlay")?.remove(),!we)return;const o="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},e=je(),r=Math.ceil(e.total/1e8*3),d=r>=4?t.gold:r>=3?t.greenBright:r>=2?t.accent:t.dim,n=Object.entries(U).map(([a,c])=>{const u=v.style===a;return`<div onclick="cpSetField('style','${a}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${u?c.color+"18":"transparent"};border:1px solid ${u?c.color+"44":t.border};">
            <div style="font-family:${o};font-size:9px;font-weight:700;color:${u?c.color:t.dim}">${a}</div>
            <div style="font-family:${o};font-size:7px;color:${t.dim};margin-top:1px">×${c.costMod.toFixed(1)} cost</div>
        </div>`}).join(""),i=document.createElement("div");i.id="cp-modal-overlay",i.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",i.innerHTML=`
    <div style="width:570px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;max-height:90vh;">
        <div style="padding:12px 20px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:10px;color:${t.gold}">●</span>
                <span style="font-family:${o};font-size:14px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Construction Project</span>
            </div>
            <span onclick="cpClose()" style="font-family:${o};font-size:18px;color:${t.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:14px 20px;overflow:auto;flex:1;">

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Building Name</div>
                <input id="cp-name-input" value="${v.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:8px 12px;font-family:${o};font-size:14px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Type</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${["Regional HQ","Office Building",...p?.corp_sector==="Construction"?["Warehouse"]:[],...p?.corp_subsector?.toLowerCase()==="banking"?["Branch Office"]:[],...p?.corp_subsector?.toLowerCase()==="investment"?["Trading Floor"]:[],...p?.corp_subsector?.toLowerCase()==="insurance"?["Claims Office","Insurance Office"]:[]].map(a=>{const c=["Branch Office","Trading Floor","Claims Office","Insurance Office"].includes(a),f=a==="Warehouse"?t.orange:c?"#8a6aaa":t.accent;return`<span onclick="cpSetField('type','${a}')" style="flex:1;min-width:100px;text-align:center;padding:6px 0;font-family:${o};font-size:12px;font-weight:700;cursor:pointer;color:${v.type===a?"#000":t.dim};background:${v.type===a?f:"transparent"};border:1px solid ${v.type===a?f:t.border}">${a}</span>`}).join("")}
                </div>
                ${v.type==="Warehouse"?`<div style="font-family:${o};font-size:9px;color:${t.orange};margin-top:5px;">Warehouse: 75% construction cost, stores up to $20M in materials</div>`:""}
                ${v.type==="Branch Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Branch Office: Increases lending capacity. +1 reputation per 200 employees. Enables cross-nation lending.</div>`:""}
                ${v.type==="Trading Floor"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Trading Floor: Enables secondary bond market. +1 reputation per 200 employees. Portfolio management bonuses.</div>`:""}
                ${v.type==="Claims Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Claims Office: Faster claim processing. +1 reputation per 200 employees. Local presence reduces premiums.</div>`:""}
                ${v.type==="Insurance Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Insurance Office: Required to sell private Health Insurance in this nation. Needs skilled workforce to staff (~60% of capacity). Does not operate where Universal Healthcare is in force.</div>`:""}
                ${v.type==="Regional HQ"?`<div style="font-family:${o};font-size:9px;color:${t.accent};margin-top:5px;">Regional HQ: Establishes corporate presence in another nation.</div>`:""}
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Location</div>
                <select onchange="cpSetField('nationId', this.value); cpSetField('nationName', this.options[this.selectedIndex].text)"
                    style="width:100%;padding:8px 12px;font-family:${o};font-size:12px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;">
                    ${be.map(a=>`<option value="${a.id}" ${v.nationId===a.id?"selected":""}>${a.name} (${a.label})</option>`).join("")}
                </select>
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${o};font-size:10px;color:${t.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${o};font-size:18px;font-weight:700;color:${t.text}">${v.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${v.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${t.accent};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${o};font-size:9px;color:${t.dim};margin-top:3px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;">${n}</div>
                <div style="margin-top:5px;font-family:${o};font-size:10px;color:${U[v.style].color}">${U[v.style].desc}</div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Estimated Cost</div>
                <div style="background:${t.card};border:1px solid ${t.border};padding:10px 12px;">
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${o};font-size:12px;font-weight:700;color:${t.text}">TOTAL BUDGET</span>
                        <span style="font-family:${o};font-size:18px;font-weight:700;color:${t.gold}">${g(e.total)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid ${t.border}">
                        <span style="font-family:${o};font-size:10px;color:${t.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${o};font-size:12px;color:${t.redDim}">${g(e.maint)}/mo</span>
                    </div>
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);margin-bottom:10px;">
                <div style="font-family:${o};font-size:10px;color:${t.gold};margin-bottom:3px">WHAT HAPPENS NEXT</div>
                <div style="font-size:12px;color:${t.dim};line-height:1.5">
                    This project will appear as a Civil Engineering bid in the Open Contracts pool for all construction corporations with an HQ or Regional HQ in ${v.nationName||"the selected nation"}. The lowest qualified bidder wins the contract and begins construction.
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:${o};font-size:12px;color:${t.accent}">EXPECTED REPUTATION GAIN</span>
                    <span style="font-family:${o};font-size:20px;font-weight:700;color:${d}">+${r}</span>
                </div>
                <div style="font-family:${o};font-size:9px;color:${t.dim};margin-top:3px">${v.style} style · ${r===5?"Maximum prestige":r>=4?"Impressive presence":r>=3?"Strong statement":r>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:12px 20px;border-top:1px solid ${t.border};background:${t.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${o};font-size:9px;color:${t.dim}">TOTAL PROJECT</div>
                <div style="font-family:${o};font-size:18px;font-weight:700;color:${t.gold}">${g(e.total)}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="cpClose()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${t.gold};cursor:pointer;opacity:${v.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(i);const y=document.getElementById("cp-name-input");y&&y.addEventListener("input",a=>{v.name=a.target.value}),i.addEventListener("click",a=>{a.target===i&&ke()})}function xt(){const o=document.getElementById("cp-name-input");if(o&&(v.name=o.value),!v.name.trim()){alert("Please enter a building name.");return}gt()}window.cpClose=ke;window.cpSetField=yt;window.cpSubmitFromModal=xt;window.npSelect=ft;window.npBuyProperty=ut;window.npOpenConstructionModal=mt;let ye=!1;async function bt(o){if(ye)return;const t=k.find(n=>n.id===o);if(!t)return;const e=1+(Number(w?.inflation??50)-50)/100*.3,r=(t.condition||50)/100,d=Math.round((t.purchase_price||0)*.6*r*e);if(confirm('Sell "'+t.name+`"?

Sale value: `+g(d)+" (60% × "+t.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){ye=!0;try{await x.from("corp_properties").update({is_active:!1}).eq("id",o);const i=Number(p?.corp_cash_reserves??0)+d;await x.from("factions").update({corp_cash_reserves:i}).eq("id",p.id),p.corp_cash_reserves=i;const a=(await x.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await x.from("available_properties").insert({nation_id:p.nation_id,catalog_id:t.catalog_id||null,name:t.name,type:t.type,style:t.style,capacity:t.capacity,price:Math.round(d*1.1),monthly_maintenance:t.monthly_maintenance,condition:t.condition,city:t.city,generated_at_tick:a,expires_at_tick:a+6,status:"available"});const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(i>=1e6?"$"+(i/1e6).toFixed(1)+"M":"$"+Math.round(i/1e3)+"k")),await $e(),he(),await _e(),se(),alert('Sold "'+t.name+'" for '+g(d))}catch(n){alert("Sale failed: "+n.message)}finally{ye=!1}}}window.propSell=bt;const Ce={SALE:.8,DISSOLVE:.6};function vt(o){if(!o)return 0;const t=o.trim().replace(/[$,]/g,""),e=t.match(/^([\d.]+)\s*[Mm]$/),r=t.match(/^([\d.]+)\s*[Kk]$/);return Math.round(e?parseFloat(e[1])*1e6:r?parseFloat(r[1])*1e3:parseFloat(t))}function H(o){const t=document.getElementById("topbar-cash");t&&(t.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k"))}function Fe(o){return X.find(t=>t.id===o)?.name||"—"}function le(o){return k.filter(t=>t.nation_id===o)}async function J(){q=0,await $e(),he(),K(),We()}let M=!1,q=0,ee={};async function $t(){if(p?.id)try{const{data:o}=await x.from("construction_contracts").select("nation_id").eq("awarded_to_faction",p.id).in("status",["in_progress","awarded"]);ee={};for(const t of o||[])t.nation_id&&(ee[t.nation_id]=(ee[t.nation_id]||0)+1)}catch{}}function qe(o){const t=le(o.nation_id),e=t.reduce((s,l)=>s+Number(l.purchase_price||0),0),r=t.reduce((s,l)=>s+Number(l.capacity||0),0),d=ee[o.nation_id]||0,n=X.find(s=>s.id===o.nation_id),i=(o.name||"").trim().split(/\s+/),y=i.length>=2?i.map(s=>s[0]).join("").toUpperCase().slice(0,4):(o.name||"SUB").slice(0,4).toUpperCase(),a=Number(o.sub_cash||0),c=Number(n?.gdp_growth??50),u=Pe({subCash:a,gdpGrowth:c,parentReputation:Number(p?.corp_reputation??50)}),f=u.netDelta;return{id:o.id,name:o.name,abbr:y,nation:n?.name||o.city||"—",nationId:o.nation_id,sector:p?.corp_sector||"General",subsector:o.subsector||p?.corp_subsector||"—",revenue:f,debt:0,cash:a,reputation:ve,valuation:e,workforce:r,projects:d,established:o.created_at?new Date(o.created_at).getFullYear().toString():"—",trend:f>0?"up":f<0?"down":c>=Le&&a>0?"flat":"down",profitable:f>0,projectedInvestmentReturn:u.investmentReturn,projectedOverhead:u.overhead,hqProp:o}}function K(){const o=document.getElementById("manage-subsidiaries-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},d=k.filter(u=>u.role==="subsidiary").map(qe);q>=d.length&&(q=0);const n=d[q]||null;let i="";d.length===0&&(i=`<div style="padding:30px 14px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No legacy subsidiaries.<br>New expansions use Regional HQs (below).</div>`);let y=0,a=0;for(let u=0;u<d.length;u++){const f=d[u],s=u===q;y+=f.revenue,a+=f.valuation;const l=f.trend==="up"?e.greenBright:f.trend==="down"?e.red:e.dim,m=f.trend==="up"?"▲":f.trend==="down"?"▼":"–";i+=`
        <div onclick="selectSubsidiary(${u})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${s?e.accent:"transparent"};background:${s?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${f.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${e.text};line-height:1.2">${f.name}</div>
                <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:1px">${f.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${t};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${f.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${t};font-size:9px;font-weight:700;color:${f.profitable?e.greenBright:e.redDim};text-align:right">${g(f.revenue)}</span>
            <span style="width:40px;font-family:${t};font-size:9px;font-weight:700;color:${f.reputation>=40?e.accent:f.reputation>=25?e.yellow:e.orange};text-align:right">${f.reputation}</span>
            <span style="width:55px;font-family:${t};font-size:9px;color:${e.muted};text-align:right">${g(f.valuation)}</span>
            <span style="width:12px;font-family:${t};font-size:8px;color:${l};text-align:right">${m}</span>
        </div>`}let c="";if(n){const u=n.trend==="up"?e.greenBright:n.trend==="down"?e.red:e.dim,f=n.trend==="up"?"▲":n.trend==="down"?"▼":"–",s=n.trend==="up"?"Growing":n.trend==="down"?"Declining":"Stable",l=n.reputation>=40?e.accent:n.reputation>=25?e.yellow:e.orange,m=[{label:"Projected Revenue",value:g(n.revenue),color:n.profitable?e.greenBright:e.redDim},{label:"Projected Overhead",value:"-"+g(n.projectedOverhead),color:e.redDim},{label:"Projected Investment Return",value:"+"+g(n.projectedInvestmentReturn),color:e.greenBright},{label:"Cash",value:g(n.cash),color:e.text},{label:"Debt",value:n.debt>0?g(n.debt):"$0",color:n.debt>0?e.orange:e.dim},{label:"Reputation",value:n.reputation+"/100",color:l},{label:"Market Valuation",value:g(n.valuation),color:e.gold},{label:"Workforce",value:n.workforce.toLocaleString(),color:e.text},{label:"Active Projects",value:n.projects.toString(),color:n.projects>0?e.text:e.dim}],b=n.projects===0,h=n.hqProp?.logo_url?`<img src="${B(n.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${e.card};border:1px dashed ${e.border};border-radius:4px;cursor:pointer;font-size:14px;color:${e.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${n.hqProp?.id||""}" style="display:none;"></label>`;c=`
            <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    ${h}
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${t};font-size:12px;font-weight:700;color:${e.gold}">${n.abbr}</span>
                            <span style="font-size:12px;font-weight:700;color:${e.text}">${n.name}</span>
                        </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${t};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n.nation.toUpperCase()}</span>
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">Est. ${n.established}</span>
                    <span style="font-family:${t};font-size:8px;color:${u}">${f} ${s}</span>
                </div>
                    </div>
                </div>
            </div>
            ${m.map($=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                <span style="font-family:${t};font-size:9px;color:${e.dim};letter-spacing:0.5px;text-transform:uppercase">${$.label}</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;color:${$.color}">${$.value}</span>
            </div>`).join("")}
            <div style="padding:6px 14px;border-bottom:1px solid ${e.border};flex-shrink:0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">REPUTATION</span>
                    <span style="font-family:${t};font-size:8px;color:${e.muted}">75% sub / 25% parent</span>
                </div>
                <div style="width:100%;height:4px;background:${e.border}"><div style="width:${n.reputation}%;height:100%;background:${l}"></div></div>
            </div>
            ${n.subsector==="Insurance"||n.subsector==="Banking"?`<div id="sub-dashboard-${n.id}" style="flex:1;overflow-y:auto;"></div>`:'<div style="flex:1"></div>'}
            <div style="padding:6px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                <div style="font-family:${t};font-size:8px;letter-spacing:1.5px;color:${e.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
                <div style="display:flex;gap:4px;margin-bottom:4px;">
                    <div onclick="subInjectCapital('${n.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${e.greenBright};border:1px solid ${e.greenDark};background:rgba(74,170,136,0.06)">INJECT CAPITAL</div>
                    <div onclick="subWithdraw('${n.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${n.cash>0?e.gold:e.dim};border:1px solid ${n.cash>0?e.gold+"44":e.border};opacity:${n.cash>0?1:.4}">WITHDRAW</div>
                </div>
                <div style="display:flex;gap:4px;">
                    <div onclick="subMerge('${n.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${e.accent};border:1px solid ${e.accent}">MERGE</div>
                    <div onclick="subPutForSale('${n.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${e.orange};border:1px solid ${e.orange}">PUT UP FOR SALE</div>
                    <div onclick="${b?"subDissolve('"+n.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${b?e.red:e.dim};border:1px solid ${b?e.red:e.border};opacity:${b?1:.3}">DISSOLVE</div>
                </div>
                ${n.projects>0?`<div style="margin-top:4px;font-family:${t};font-size:7px;color:${e.dim}">Cannot dissolve with active projects.</div>`:""}
            </div>`}else c=`<div style="padding:30px 14px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">Select a subsidiary to manage.</div>`;if(o.innerHTML=`
    <div style="width:760px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Manage Subsidiaries</span>
            </div>
            <span style="font-family:${t};font-size:9px;color:${e.dim}">${d.length} ACTIVE</span>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${e.border};display:flex;flex-direction:column;">
                <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="width:40px;font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">ABBR</span>
                    <span style="flex:1.5;font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">NAME</span>
                    <span style="width:65px;font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">NATION</span>
                    <span style="width:55px;font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px;text-align:right">REVENUE</span>
                    <span style="width:40px;font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px;text-align:right">REP</span>
                    <span style="width:55px;font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px;text-align:right">VALUE</span>
                    <span style="width:12px"></span>
                </div>
                <div style="flex:1;overflow:auto;">${i}</div>
                <div style="padding:6px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;display:flex;align-items:center;">
                    <span style="width:40px"></span>
                    <span style="flex:1.5;font-family:${t};font-size:8px;color:${e.dim}">COMBINED</span>
                    <span style="width:65px"></span>
                    <span style="width:55px;font-family:${t};font-size:9px;font-weight:700;color:${e.text};text-align:right">${g(y)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${t};font-size:9px;font-weight:700;color:${e.text};text-align:right">${g(a)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${c}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async u=>{const f=u.target.files?.[0],s=u.target.dataset.propId;if(!(!f||!s)){if(f.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const l=f.name.split(".").pop()?.toLowerCase()||"png",m=`party-logos/${p.id}/sub_${s}_${Date.now()}.${l}`,{error:b}=await x.storage.from("public-assets").upload(m,f,{contentType:f.type,upsert:!0});if(b)throw b;const{data:h}=x.storage.from("public-assets").getPublicUrl(m),$=h?.publicUrl;if($){await x.from("corp_properties").update({logo_url:$}).eq("id",s);const _=k.find(S=>S.id===s);_&&(_.logo_url=$),K()}}catch(l){alert("Upload failed: "+(l.message||"Error"))}}}),n&&(n.subsector==="Insurance"||n.subsector==="Banking")){const u="sub-dashboard-"+n.id;setTimeout(()=>{document.getElementById(u)&&et(x,{faction:p,nation:w,shard:R},u,n.id).catch(f=>console.error("[SubDash] Init failed:",f))},50)}}async function Ue(o,t){if(M)return;const e=k.find(l=>l.id===o);if(!e)return;const r=t==="sell",d=r?Ce.SALE:Ce.DISSOLVE,n=r?"SELL":"DISSOLVE",i=r?"sold":"dissolved",y=r?"80%":"60%",a=Fe(e.nation_id),c=le(e.nation_id),u=c.reduce((l,m)=>l+Math.round((m.purchase_price||0)*d*(m.condition||50)/100),0),f=Number(e.sub_cash||0),s=u+f;if(confirm(n+' subsidiary "'+e.name+`"?

`+c.length+" properties at "+y+` × condition:
  Property value: `+g(u)+`
  Subsidiary cash: `+g(f)+`
  ─────────────────
  Total return: `+g(s)+`

All operations in `+a+` cease.
This cannot be undone.`)){M=!0;try{const l=c.map(b=>b.id);if(l.length===1){const{error:b}=await x.from("corp_properties").update({is_active:!1}).eq("id",l[0]);if(b)throw b}else if(l.length>1){const{error:b}=await x.from("corp_properties").update({is_active:!1}).in("id",l);if(b)throw b}await x.from("corp_properties").update({sub_cash:0}).eq("id",o).then(()=>{}).catch(()=>{});const m=Number(p?.corp_cash_reserves??0)+s;await x.from("factions").update({corp_cash_reserves:m}).eq("id",p.id),p.corp_cash_reserves=m,H(m),await J(),alert("Subsidiary "+i+". "+c.length+` properties liquidated.
Total received: `+g(s))}catch(l){alert("Failed: "+l.message)}finally{M=!1}}}function ht(o){Ue(o,"sell")}async function _t(o){if(M)return;const t=k.find(y=>y.id===o);if(!t)return;const e=Fe(t.nation_id),d=le(t.nation_id).reduce((y,a)=>y+Math.round((a.purchase_price||0)*.8*(a.condition||50)/100),0),n=Number(t.sub_cash||0),i=Math.round(n*.05);if(confirm('PUT UP FOR SALE: "'+t.name+`"

Nation: `+e+`
Estimated Valuation: `+g(d)+`
Subsidiary Cash: `+g(n)+`
Subsector: `+(t.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){M=!0;try{const y=R?.current_tick||0,{data:a,error:c}=await x.from("subsidiary_sales").insert({subsidiary_id:o,seller_faction_id:p.id,nation_id:t.nation_id,subsidiary_name:t.name,subsector:t.subsector||null,valuation:d,monthly_revenue:i,sub_cash_at_listing:n,employee_count:t.capacity||0,status:"listed",listed_at_tick:y}).select("*").single();if(c){alert("Failed to list: "+c.message);return}alert('"'+t.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await J()}catch(y){alert("Failed: "+y.message)}finally{M=!1}}}let ne=[],He="ready",Q=null;async function de(){const o=await Ke(x);ne=o.listings,He=o.state,Q=o.error,Q&&console.error("[SubMarket] Load failed:",Q.message)}function ce(){let o=document.getElementById("sub-marketplace-card");o||(o=document.createElement("div"),o.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(o));const t=ne.filter(a=>a.seller_faction_id!==p?.id),e=ne.filter(a=>a.seller_faction_id===p?.id),r="'JetBrains Mono',monospace",d=getComputedStyle(document.body),n=(a,c)=>d.getPropertyValue(a).trim()||c,i={surface:n("--bg-2","var(--bg-card)"),card:n("--bg-3","#f0efeb"),border:n("--border-0","rgba(0,0,0,0.08)"),dim:n("--text-dim","#aaa"),muted:n("--text-muted","#888"),text:n("--text-primary","#333"),bright:n("--text-bright","#1a1a17"),orange:n("--orange","#d35400"),green:n("--green","#2d8a2d"),blue:n("--blue","#2874a6"),red:n("--red","#c0392b"),gold:n("--gold","#a88520")};let y=`<div style="width:760px;background:${i.surface};border:1px solid ${i.border};font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 14px;border-bottom:1px solid ${i.border};display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${i.orange};display:inline-block;"></span>
            <span style="font-family:${r};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${i.orange};text-transform:uppercase;">Subsidiary Marketplace</span>
            <span style="font-family:${r};font-size:9px;color:${i.dim};">${t.length} available</span>
        </div>`;if(e.length>0){y+=`<div style="padding:8px 14px;border-bottom:1px solid ${i.border};background:${i.card};">
            <div style="font-family:${r};font-size:8px;letter-spacing:1px;color:${i.gold};text-transform:uppercase;margin-bottom:6px;">YOUR LISTINGS</div>`;for(const a of e){const u=(a.subsidiary_bids||[]).filter(f=>f.status==="pending");y+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:${i.bright};">${B(a.subsidiary_name)}</span>
                    <span style="font-family:${r};font-size:8px;color:${i.dim};margin-left:6px;">${B(a.subsector||"")}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${r};font-size:9px;color:${u.length>0?i.green:i.dim};">${u.length} bid${u.length!==1?"s":""}</span>
                    ${u.length>0?`<span onclick="subViewBids('${a.id}')" style="font-family:${r};font-size:8px;font-weight:700;padding:3px 8px;color:${i.green};border:1px solid ${i.green}44;cursor:pointer;">VIEW BIDS</span>`:""}
                    <span onclick="subCancelSale('${a.id}')" style="font-family:${r};font-size:8px;font-weight:700;padding:3px 8px;color:${i.red};border:1px solid ${i.red}44;cursor:pointer;">CANCEL</span>
                </div>
            </div>`}y+="</div>"}if(He==="error")y+=`<div style="padding:24px 14px;text-align:center;font-family:${r};font-size:10px;color:${i.red};font-style:italic;">${B(Q&&Q.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(t.length===0)y+=`<div style="padding:24px 14px;text-align:center;font-family:${r};font-size:10px;color:${i.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const a of t){const c=(a.subsidiary_bids||[]).find(s=>s.bidder_faction_id===p?.id&&s.status==="pending"),f=(st||[]).find(s=>s.id===a.nation_id)?.name||"Unknown";y+=`<div style="padding:10px 14px;border-bottom:1px solid ${i.border};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:12px;font-weight:700;color:${i.bright};">${B(a.subsidiary_name)}</span>
                        <span style="font-family:${r};font-size:7px;font-weight:700;padding:1px 5px;color:${i.orange};border:1px solid ${i.orange}44;background:${i.orange}0a;">${B(a.subsector||"General")}</span>
                    </div>
                    <span style="font-family:${r};font-size:8px;color:${i.dim};">${B(f)}</span>
                </div>
                <div style="display:flex;gap:16px;font-family:${r};font-size:8px;color:${i.muted};margin-bottom:8px;">
                    <span>Valuation: <strong style="color:${i.text};">${g(a.valuation)}</strong></span>
                    <span>Revenue: <strong style="color:${i.text};">${g(a.monthly_revenue)}/mo</strong></span>
                    <span>Cash: <strong style="color:${i.text};">${g(a.sub_cash_at_listing)}</strong></span>
                    <span>Staff: <strong style="color:${i.text};">${a.employee_count}</strong></span>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    ${c?`<span style="font-family:${r};font-size:8px;font-weight:700;color:${i.green};">✓ BID PLACED: ${g(c.bid_amount)}</span>`:`<span onclick="subPlaceBid('${a.id}','${B(a.subsidiary_name)}',${a.valuation})" style="font-family:${r};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${i.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}y+="</div>",o.innerHTML=y}async function wt(o,t,e){const r=prompt('Place bid for "'+t+`"

Valuation: `+g(e)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!r)return;const d=Math.round(Number(r));if(isNaN(d)||d<1e6){alert("Minimum bid is $1,000,000.");return}const n=Number(p?.corp_cash_reserves??0);if(d>n){alert("Insufficient funds. You have "+g(n)+".");return}const{error:i}=await x.from("subsidiary_bids").insert({sale_id:o,bidder_faction_id:p.id,bid_amount:d,status:"pending",placed_at_tick:R?.current_tick||0});if(i){i.message.includes("duplicate")||i.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+i.message);return}alert("Bid of "+g(d)+' placed on "'+t+`".
The seller will review your bid.`),await de(),ce()}async function kt(o){const t=ne.find(s=>s.id===o);if(!t)return;const e=(t.subsidiary_bids||[]).filter(s=>s.status==="pending");if(e.length===0){alert("No pending bids.");return}const r=e.map(s=>s.bidder_faction_id),{data:d}=await x.from("factions").select("id, faction_name").in("id",r),n={};(d||[]).forEach(s=>{n[s.id]=s.faction_name});let i='Bids for "'+t.subsidiary_name+`":

`;const y=e.sort((s,l)=>l.bid_amount-s.bid_amount);for(let s=0;s<y.length;s++){const l=y[s];i+=s+1+". "+(n[l.bidder_faction_id]||"Unknown")+": "+g(l.bid_amount)+`
`}i+=`
Enter the number of the bid to accept (or cancel):`;const a=prompt(i);if(!a)return;const c=parseInt(a,10)-1;if(isNaN(c)||c<0||c>=y.length){alert("Invalid selection.");return}const u=y[c],f=n[u.bidder_faction_id]||"Unknown";confirm("Accept bid of "+g(u.bid_amount)+" from "+f+`?

This will transfer ownership of "`+t.subsidiary_name+`" to them.
You will receive `+g(u.bid_amount)+` in cash.

This cannot be undone.`)&&await zt(t,u)}let ge=!1;async function zt(o,t){if(!ge){ge=!0;try{const d=R?.current_tick||0,{data:n}=await x.from("factions").select("corp_cash_reserves").eq("id",t.bidder_faction_id).single(),i=Number(n?.corp_cash_reserves??0);if(i<t.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await x.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:d}).eq("id",t.id);return}var{error:e}=await x.from("factions").update({corp_cash_reserves:i-t.bid_amount}).eq("id",t.bidder_faction_id);if(e){alert("Failed to deduct from buyer: "+e.message);return}const y=Number(p?.corp_cash_reserves??0);var{error:r}=await x.from("factions").update({corp_cash_reserves:y+t.bid_amount}).eq("id",p.id);if(r){await x.from("factions").update({corp_cash_reserves:i}).eq("id",t.bidder_faction_id),alert("Failed to credit seller: "+r.message);return}p.corp_cash_reserves=y+t.bid_amount,await x.from("corp_properties").update({faction_id:t.bidder_faction_id}).eq("id",o.subsidiary_id);const a=k.filter(c=>c.nation_id===o.nation_id&&c.faction_id===p.id);for(const c of a)await x.from("corp_properties").update({faction_id:t.bidder_faction_id}).eq("id",c.id);await x.from("subsidiary_sales").update({status:"completed",completed_at_tick:d,accepted_bid_id:t.id}).eq("id",o.id),await x.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:d}).eq("id",t.id),await x.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:d}).eq("sale_id",o.id).neq("id",t.id),H(p.corp_cash_reserves),alert("Sale complete! Received "+g(t.bid_amount)+`.

"`+o.subsidiary_name+'" has been transferred to the buyer.'),await J(),await de(),ce()}catch(d){console.error("[SubMarket] Accept bid error:",d),alert("Transfer failed: "+d.message)}finally{ge=!1}}}async function St(o){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:t}=await x.from("subsidiary_sales").update({status:"cancelled"}).eq("id",o);if(t){alert("Failed: "+t.message);return}await de(),ce()}function Ct(o){Ue(o,"dissolve")}async function Ge(o,t){if(M)return;const e=k.find(f=>f.id===o);if(!e)return;const r=Number(p?.corp_cash_reserves??0),d=Number(e.sub_cash||0),n=t?"WITHDRAW":"INJECT CAPITAL";if(t&&d<=0){alert("This subsidiary has no cash to withdraw.");return}const i=t?d:r,y=prompt(n+(t?" from ":" into ")+e.name+`

Parent cash: `+g(r)+`
Subsidiary cash: `+g(d)+`

Enter amount (e.g., 5000000 or 5M):`);if(!y)return;const a=vt(y);if(!a||a<=0||isNaN(a)){alert("Invalid amount.");return}if(a>i){alert("Insufficient "+(t?"subsidiary":"parent")+" cash. Available: "+g(i));return}const c=t?r+a:r-a,u=t?d-a:d+a;if(confirm(n+" "+g(a)+(t?" from ":" into ")+e.name+`?

Parent: `+g(r)+" → "+g(c)+`
Subsidiary: `+g(d)+" → "+g(u))){M=!0;try{await Promise.all([x.from("factions").update({corp_cash_reserves:c}).eq("id",p.id),x.from("corp_properties").update({sub_cash:u}).eq("id",o)]),p.corp_cash_reserves=c,e.sub_cash=u,H(c),K(),alert((t?"Withdrew ":"Injected ")+g(a)+(t?" from ":" into ")+e.name+".")}catch(f){alert("Failed: "+f.message)}finally{M=!1}}}function Nt(o){Ge(o,!1)}function Mt(o){Ge(o,!0)}async function It(o){if(M)return;const t=k.find(b=>b.id===o);if(!t)return;const e=qe(t);e.nation;const r=le(t.nation_id),d=e.valuation,n=e.cash,i=e.reputation,y=e.subsector,a=Math.round(d*2.25),c=Math.round(i*.1),u=Math.round(i*.2),f=ae(),s=j.reduce((b,h)=>b+Number(p?.[h.factionKey]??0),0),l=Math.max(0,f-s),m=Number(p?.corp_cash_reserves??0);if(a>m){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+g(a)+`
Available cash: `+g(m));return}if(e.projects>0){alert("Cannot merge — subsidiary has "+e.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+t.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+g(a)+`
Subsidiary cash absorbed: `+g(n)+`
Net cost: `+g(a-n)+`

• `+r.length+` properties transferred to parent
• Subsidiary subsector "`+y+`" added to portfolio
• Workers hired to max capacity (+`+l.toLocaleString()+`)
• Reputation: +`+c+" or -"+u+" (from sub rep "+i+`)

This cannot be undone.`)){M=!0;try{const b=p.nation_id;if(r.length>0){const A=r.filter(C=>C.id!==t.id).map(C=>C.id);if(A.length===1){const{error:C}=await x.from("corp_properties").update({nation_id:b,type:"office"}).eq("id",A[0]);if(C)throw C}else if(A.length>1){const{error:C}=await x.from("corp_properties").update({nation_id:b,type:"office"}).in("id",A);if(C)throw C}const{error:G}=await x.from("corp_properties").update({nation_id:b,type:"office",sub_cash:0,subsector:null}).eq("id",t.id);if(G)throw G}const h=m-a+n,_=Number(p?.corp_general_workforce??0)+l,S=Math.random()>=.5?c:-u,z=Number(p?.standing??50),E=Math.max(0,Math.min(100,z+S)),{error:D}=await x.from("factions").update({corp_cash_reserves:h,corp_general_workforce:_,standing:E}).eq("id",p.id);if(D)throw D;p.corp_cash_reserves=h,p.corp_general_workforce=_,p.standing=E,H(h),await J(),alert(`Merger complete!

"`+t.name+`" absorbed into your corporation.
Cost: `+g(a)+" | Cash absorbed: "+g(n)+`
Reputation `+(S>=0?"+":"")+S+" (now "+E+`)
Workers hired: +`+l.toLocaleString()+` general workforce
Properties: `+r.length+" transferred to parent")}catch(b){alert("Merge failed: "+b.message)}finally{M=!1}}}window.subDissolve=Ct;window.subInjectCapital=Nt;window.subWithdraw=Mt;window.subMerge=It;window.subSell=ht;window.subPutForSale=_t;window.subPlaceBid=wt;window.subViewBids=kt;window.subCancelSale=St;window.selectSubsidiary=function(o){q=o,K()};let X=[],xe=!1;async function Et(){const{data:o,error:t}=await x.from("nations").select("*").order("name");t&&console.warn("[RegionalHQ] Failed to load nations:",t.message),X=(o||[]).filter(e=>e.id!==p?.nation_id)}const Ve=3e7,Ne=500;function ze(o){const t=Number(o?.standard_of_living??50);return Math.min(2,Math.max(.5,Math.round(t/50*100)/100))}function te(o){return Math.round(Ve*ze(o))}async function At(o){if(xe)return;const t=X.find(n=>n.id===o);if(!t){alert("Nation not found.");return}if(k.some(n=>n.nation_id===o&&n.type==="regional_hq")){alert("You already have a Regional HQ in "+t.name+".");return}const r=te(t),d=Number(p?.corp_cash_reserves??0);if(r>d){alert("Insufficient cash. Cost: "+g(r)+", available: "+g(d));return}if(confirm("Build Regional HQ in "+t.name+`?

Cost: `+g(r)+" ("+Ve/1e6+"M base × "+ze(t).toFixed(2)+"x "+t.name+` SoL)
Capacity: `+Ne+`

The HQ becomes a standard property asset. You can sell it later from the Properties page (60% × condition resale).`)){xe=!0;try{const{data:n}=await x.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=n?.current_tick||0,y=85+Math.floor(Math.random()*16),a=Math.round(r*.005),c=(p.faction_name||"Corp")+" — "+t.name+" HQ",u=Math.max(0,d-r),{error:f}=await x.from("factions").update({corp_cash_reserves:u}).eq("id",p.id);if(f){alert("Failed to deduct cash: "+f.message);return}p.corp_cash_reserves=u,H(u);const{error:s}=await x.from("corp_properties").insert({faction_id:p.id,nation_id:t.id,name:c,type:"regional_hq",role:"regional_hq",style:"Modern",capacity:Ne,purchase_price:r,monthly_maintenance:a,condition:y,city:t.capital||t.name,purchased_at_tick:i,is_active:!0});if(s){await x.from("factions").update({corp_cash_reserves:d}).eq("id",p.id),p.corp_cash_reserves=d,H(d),alert("Failed to create property: "+s.message+`
Cash refunded.`);return}try{await x.from("event_log").insert({nation_id:t.id,event_name:"New Regional HQ Established",category:"corporate",description_chosen:`${p.faction_name} has invested ${g(r)} to build a Regional HQ in ${t.name}.`,fired_at_tick:i})}catch{}await J(),alert("Regional HQ built in "+t.name+`.

Cost: `+g(r)+`
Condition: `+y+"%")}catch(n){alert("Failed: "+n.message)}finally{xe=!1}}}window.buildRegionalHQ=At;async function Tt(){alert("Subsidiary establishment has been replaced with Regional HQs. Pick a nation from the list below.")}function We(){const o=document.getElementById("create-subsidiary-container");if(!o)return;const t=Number(p?.corp_cash_reserves??0),e=new Set(k.filter(n=>n.type==="regional_hq").map(n=>n.nation_id)),d=X.slice().sort((n,i)=>te(n)-te(i)).map(n=>{const i=te(n),y=e.has(n.id),a=i<=t,c=Number(n.standard_of_living??50),u=ze(n),f=y?"OWNED":a?"BUILD":"INSUFFICIENT CASH",s=y||!a,l=s?"opacity:0.4;cursor:not-allowed;background:#3a3833;color:#7a7670;":"cursor:pointer;background:#5a9abf;color:#fff;",m=s?"":`onclick="buildRegionalHQ('${n.id}')"`;return`
            <div style="display:grid;grid-template-columns:1.5fr 0.7fr 0.7fr 1fr 0.9fr;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);">
                <div style="font-weight:600;color:var(--panel-text);">${B(n.name)}</div>
                <div style="color:#9e9a92;font-size:10px;">SoL ${Math.round(c)}</div>
                <div style="color:#9e9a92;font-size:10px;">×${u.toFixed(2)}</div>
                <div style="color:${a?"#a3b07e":"#c55"};font-weight:700;">${g(i)}</div>
                <div ${m} style="text-align:center;padding:6px 10px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px;${l}">${f}</div>
            </div>
        `}).join("");o.innerHTML=`
        <div style="border:1px solid var(--panel-border);background:var(--bg-card);font-family:'JetBrains Mono', monospace;color:var(--panel-text);">
            <div style="padding:14px 16px;border-bottom:1px solid var(--panel-border);">
                <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;color:#a3b07e;">BUILD REGIONAL HQ</div>
                <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-top:6px;">
                    A Regional HQ lets your corporation operate in another nation. Cost scales with the
                    host nation's standard of living. The HQ is a standard property asset — sell it later
                    from the Properties page if you want out (60% × condition resale).
                </div>
                <div style="font-size:10px;color:#9e9a92;margin-top:6px;">Cash on hand: <span style="color:#a3b07e;font-weight:700;">${g(t)}</span></div>
            </div>
            <div style="display:grid;grid-template-columns:1.5fr 0.7fr 0.7fr 1fr 0.9fr;gap:12px;padding:6px 12px;font-size:9px;letter-spacing:1px;color:#6a6660;border-bottom:1px solid var(--panel-border);">
                <div>NATION</div><div>SOL</div><div>MULT</div><div>COST</div><div></div>
            </div>
            ${d||'<div style="padding:20px;text-align:center;color:#6a6660;font-style:italic;">No nations available.</div>'}
        </div>
    `}window.subCreate=Tt;let Y=[],O=0,ie=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),T="ALL",P="REPUTATION";async function Bt(){Y=await rt()}function Rt(o){O=o,Z()}function Lt(o){T=o,O=0,Z()}function Pt(o){P=o,O=0,Z()}async function Ot(o){if(!p||!R)return;const t=Number(p.corp_cash_reserves??0);if(t<5e5){alert("Insufficient cash. Need $500k.");return}const{error:e}=await x.from("factions").update({corp_cash_reserves:t-5e5}).eq("id",p.id);if(e){alert("Failed: "+e.message);return}p.corp_cash_reserves=t-5e5,ie[o]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify(ie));const{data:r}=await x.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",o).single();if(r){const d=Y.find(n=>n.id===o);if(d){Object.assign(d,r);const n=Number(r.corp_cash_reserves||0),i=Number(r.corp_loans||0);let y=0;try{const{data:a}=await x.from("finance_active_loans").select("principal, remaining_principal, finance_loan_requests!inner(request_type)").eq("lender_faction_id",o).in("status",["current","late","delinquent"]);y=Me(a||[]).total}catch(a){console.warn("[corpInvestigate] receivable lookup failed:",a)}d.reputation=Math.round(Number(r.corp_reputation??50)),d.revenue=Math.round(n*.1),d.valuation=Ie({cash:n,loans:i,financeReceivables:y})}}Z()}function Z(){const o=document.getElementById("corporations-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},r={PUBLIC:{color:e.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:e.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:e.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},d=[...new Set(Y.map(l=>l.nation).filter(Boolean))];let n=[...Y];T!=="ALL"&&(n=n.filter(l=>l.nation===T)),P==="REPUTATION"?n.sort((l,m)=>(m.reputation||0)-(l.reputation||0)):P==="REVENUE"?n.sort((l,m)=>(m.revenue||0)-(l.revenue||0)):P==="VALUATION"&&n.sort((l,m)=>(m.valuation||0)-(l.valuation||0)),O>=n.length&&(O=0);const i=n[O]||null;R?.current_tick;const y=i&&!!ie[i.id],a=i&&i.status==="PRIVATE"&&!y,c=i&&i.status==="STATE";let u="";n.length===0&&(u=`<div style="padding:30px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No corporations found.</div>`);for(let l=0;l<n.length;l++){const m=n[l],b=l===O,h=r[m.status]||r.PRIVATE,$=m.status==="PRIVATE"&&!ie[m.id];u+=`
        <div onclick="corpSelect(${l})" style="display:flex;align-items:center;padding:7px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${b?e.accent:"transparent"};background:${b?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:42px;font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${m.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:11px;font-weight:600;color:${e.text};line-height:1.2">${m.faction_name}</div>
                <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:1px">${m._isSub?'<span style="color:#8a6aaa;">SUB</span> · ':""}${m.corp_subsector||m.corp_sector||"—"}</div>
            </div>
            <span style="width:62px"><span style="font-family:${t};font-size:8px;padding:1px 5px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(m.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:56px;font-family:${t};font-size:9px;font-weight:700;color:${$?e.dim:e.muted};text-align:right">${$?"—":g(m.revenue)}</span>
            <span style="width:34px;font-family:${t};font-size:10px;font-weight:700;color:${m.reputation>=70?e.greenBright:m.reputation>=40?e.accent:e.yellow};text-align:right">${m.reputation}</span>
            <span style="width:56px;font-family:${t};font-size:9px;color:${$?e.dim:e.muted};text-align:right">${$?"—":g(m.valuation)}</span>
            <span style="width:48px;text-align:center"><span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${h.color};background:${h.bg};border:1px solid ${h.border}">${m.status}</span></span>
        </div>`}let f="";if(i){const l=r[i.status]||r.PRIVATE,m=[...i._isSub?[{label:"Parent",value:i._parentName||"—",color:"#8a6aaa"}]:[],{label:"Sector",value:i.corp_sector||"—",color:e.text},{label:"Subsector",value:i.corp_subsector||"—",color:e.accent},{label:"Reputation",value:i.reputation+"/100",color:i.reputation>=70?e.greenBright:i.reputation>=40?e.accent:e.yellow},{label:"Revenue",value:a?"UNDISCLOSED":g(i.revenue),color:a?e.dim:e.greenBright},{label:"Cash Reserves",value:a?"UNDISCLOSED":g(i.corp_cash_reserves||0),color:a?e.dim:e.text},{label:"Market Valuation",value:a?"UNDISCLOSED":g(i.valuation),color:a?e.dim:e.gold}];f=`
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                <span style="font-family:${t};font-size:14px;font-weight:700;color:${e.gold}">${i.abbr}</span>
                <span style="font-size:14px;font-weight:700;color:${e.text}">${i.faction_name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-family:${t};font-size:8px;padding:2px 6px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(i.nation||"—").toUpperCase()}</span>
                <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${l.color};background:${l.bg};border:1px solid ${l.border}">${i.status}</span>
                ${i._isSub?`<span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:#8a6aaa;background:rgba(138,106,170,0.08);border:1px solid rgba(138,106,170,0.2)">SUBSIDIARY</span>`:""}
                ${i.isPlayer?`<span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${e.blue};background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2)">PLAYER</span>`:`<span style="font-family:${t};font-size:8px;color:${e.dim}">NPC</span>`}
            </div>
        </div>
        ${m.map(b=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${e.border};">
            <span style="font-family:${t};font-size:10px;color:${e.dim};text-transform:uppercase">${b.label}</span>
            <span style="font-family:${t};font-size:11px;font-weight:700;color:${b.value==="UNDISCLOSED"?e.dim:b.color};${b.value==="UNDISCLOSED"?"font-style:italic;":""}">${b.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${e.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${e.border}"><div style="width:${i.reputation}%;height:100%;background:${i.reputation>=70?e.greenBright:i.reputation>=40?e.accent:e.yellow}"></div></div>
        </div>
        ${a?`<div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(200,168,50,0.03);">
            <div style="font-family:${t};font-size:8px;color:${e.gold};margin-bottom:2px">PRIVATE — FINANCIALS UNDISCLOSED</div>
            <div style="font-size:9px;color:${e.dim};line-height:1.4">Use INVESTIGATE to reveal financial data for 12 ticks.</div>
        </div>`:""}
        ${c?`<div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,136,68,0.03);">
            <div style="font-family:${t};font-size:8px;color:${e.orange};margin-bottom:2px">STATE-OWNED ENTERPRISE</div>
            <div style="font-size:9px;color:${e.dim};line-height:1.4">Government-controlled. Cannot be acquired directly. May be privatized by parliamentary vote.</div>
        </div>`:""}
        <div style="flex:1"></div>
        <div style="padding:6px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="font-family:${t};font-size:8px;letter-spacing:1.5px;color:${e.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
            <div style="display:flex;gap:4px;margin-bottom:4px;">
                <div onclick="${a?`corpInvestigate('${i.id}')`:""}" style="flex:1;padding:5px 0;text-align:center;cursor:${a?"pointer":"default"};font-family:${t};font-size:8px;font-weight:700;color:${a?e.blue:y?e.greenBright:e.dim};border:1px solid ${a?e.blue+"44":y?e.greenBright+"44":e.border};opacity:${a?1:.3}">${y?"INVESTIGATED ✓":"INVESTIGATE — $500k"}</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;color:${e.accent};border:1px solid ${e.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${c?"not-allowed":"pointer"};font-family:${t};font-size:8px;font-weight:700;color:${c?e.dim:e.gold};border:1px solid ${c?e.border:e.gold+"44"};opacity:${c?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${c?"not-allowed":"pointer"};font-family:${t};font-size:8px;font-weight:700;color:${c?e.dim:e.orange};border:1px solid ${c?e.border:e.orange+"44"};opacity:${c?.3:1}">MERGER</div>
            </div>
            ${c?`<div style="margin-top:4px;font-family:${t};font-size:7px;color:${e.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else f=`<div style="padding:30px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">Select a corporation to view details.</div>`;const s=`
    <div style="padding:6px 16px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px;width:40px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${T==="ALL"?"#000":e.dim};background:${T==="ALL"?e.accent:"transparent"};border:1px solid ${T==="ALL"?e.accent:e.border}">ALL</span>
            ${d.map(l=>`<span onclick="corpFilterNation('${l}')" style="padding:3px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${T===l?"#000":e.dim};background:${T===l?e.accent:"transparent"};border:1px solid ${T===l?e.accent:e.border}">${l}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(l=>`<span onclick="corpSort('${l}')" style="padding:3px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${P===l?"#000":e.dim};background:${P===l?e.accent:"transparent"};border:1px solid ${P===l?e.accent:e.border}">${l}</span>`).join("")}
        </div>
    </div>`;o.innerHTML=`
    <div style="width:760px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${t};font-size:9px;color:${e.dim}">${Y.length} IN DATABASE</span>
        </div>
        ${s}
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${e.border};display:flex;flex-direction:column;">
                <div style="display:flex;padding:5px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="width:42px;font-family:${t};font-size:8px;color:${e.dim}">ABBR</span>
                    <span style="flex:1.3;font-family:${t};font-size:8px;color:${e.dim}">CORPORATION</span>
                    <span style="width:62px;font-family:${t};font-size:8px;color:${e.dim}">NATION</span>
                    <span style="width:56px;font-family:${t};font-size:8px;color:${e.dim};text-align:right">REV</span>
                    <span style="width:34px;font-family:${t};font-size:8px;color:${e.dim};text-align:right">REP</span>
                    <span style="width:56px;font-family:${t};font-size:8px;color:${e.dim};text-align:right">VALUE</span>
                    <span style="width:48px;font-family:${t};font-size:8px;color:${e.dim};text-align:center">STATUS</span>
                </div>
                <div style="flex:1;overflow:auto;">${u}</div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${f}
            </div>
        </div>
    </div>`}window.corpSelect=Rt;window.corpInvestigate=Ot;window.corpFilterNation=Lt;window.corpSort=Pt;window.hfSetChange=lt;window.hfReset=dt;window.hfConfirm=ct;async function jt(){const{data:{user:o}}=await x.auth.getUser();if(!o){window.location.href="login.html";return}const t=new URLSearchParams(location.search).get("faction_id");if(t){const{data:n,error:i}=await x.from("factions").select("*").eq("id",t).single();i?console.warn("[Inspector] faction fetch failed:",i.message):n?.faction_type==="corporation"&&(p=n)}if(!p){const{data:n}=await x.from("factions").select("*").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`);V=(n||[]).filter(y=>y.nation_id);const i=sessionStorage.getItem("active_faction_id");if(p=V.find(y=>y.id===i)||V.find(y=>y.faction_type==="corporation")||V[0],!p){await x.auth.signOut(),window.location.href="login.html";return}if(p.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const[e,r]=await Promise.all([p.nation_id?x.from("nations").select("*").eq("id",p.nation_id).single():Promise.resolve({data:null}),x.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);e.data&&(w=e.data),R=r.data;const d=document.getElementById("corp-topbar-container");d&&Ye(d,{faction:p,shard:R,activeTab:"expansion",allUserFactions:V}),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",await $e(),re(),pt(),await _e(),se(),await Et(),await $t(),We(),K(),await Bt(),Z(),await de(),ce()}jt();
