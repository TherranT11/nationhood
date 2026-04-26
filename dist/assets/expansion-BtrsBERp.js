import{_supabase as b}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{hfFmtBig as y,escapeHtml as j}from"./utils-A98FEun4.js";import{renderCorpTopBar as rt}from"./corp-topbar-CPI0igZM.js";import{c as st,d as lt}from"./corp-shipping-data-DA_tOdLs.js";import{b as Oe,c as je}from"./corp-valuation-C0hsb2EQ.js";import"./preload-helper-BXl3LOEh.js";let De=null,Ue=null,Fe=null,qe=[];function F(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function dt(o){const t=String(o||"").trim().toLowerCase();return t==="amortized"||t==="amortising"||t==="amortizing"?"amortized":"flat"}function ct(o){const t=String(o?.loan_funding_model||"").trim().toLowerCase();return t==="parent_corp"?"parent_corp":t==="subsidiary_cash"?"subsidiary_cash":null}async function pt(o,t,e,r){De=o,Ue=t;const d=document.getElementById(e);if(!d)return;d.innerHTML='<div style="padding:16px;text-align:center;color:#4a4940;font-family:monospace;font-size:10px;">Loading dashboard...</div>';const[i,n]=await Promise.all([o.from("subsidiary_auto_rates").select("*").eq("subsidiary_id",r).maybeSingle(),o.from("subsidiary_auto_policies").select("*").eq("subsidiary_id",r).order("started_tick",{ascending:!1}).limit(50)]);i.error&&console.error("[SubDash] Rate fetch error:",i.error.message),n.error&&console.error("[SubDash] Policies fetch error:",n.error.message),Fe=i.data,qe=n.data||[],He(d)}function He(o){const t=Fe,e=qe,r=t?.service_type==="insurance",d=r?"#c84":"#5a8aaa",i=r?"Insurance":"Banking";if(!t){o.innerHTML=`
            <div class="csd-panel">
                <div class="csd-empty">
                    <div style="font-size:1.5rem;margin-bottom:8px;opacity:0.4;">${r?"🛡️":"🏦"}</div>
                    <div style="font-family:monospace;font-size:10px;color:#888;">Auto-rate not yet generated.</div>
                    <div style="font-family:monospace;font-size:8px;color:#4a4940;margin-top:4px;">Rates are generated automatically each tick based on national interest rates.</div>
                </div>
            </div>
        `;return}const n=e.filter(u=>u.status==="active"),g=Number(t.total_revenue??0),a=Number(t.total_claims??0),c=g-a,m=c>=0?"#5cb85c":"#d9534f",f=e.slice(0,20).map(u=>{const x=u.status==="active"?"#5cb85c":u.status==="defaulted"?"#d9534f":u.status==="repaid"?"#5a8aaa":"#666",_=dt(u.loan_interest_model||u.interest_model||u.loan_interest_type),h=ct(u);return`
            <div class="csd-policy-row">
                <span class="csd-policy-status" style="color:${x};">●</span>
                <span class="csd-policy-type">${u.service_type==="insurance"?"INS":"LOAN"}</span>
                <span class="csd-policy-rate">${u.rate_at_issue}%</span>
                <span class="csd-policy-principal">${F(u.principal)}</span>
                <span class="csd-policy-payment">${F(u.monthly_payment)}/mo</span>
                <span class="csd-policy-paid">${F(u.total_paid)} paid</span>
                ${u.service_type==="loan"?`<span class="csd-policy-type" style="color:#8ab0c7;">${_==="amortized"?"AMORTIZED":"FLAT"}</span>`:""}
                ${u.service_type==="loan"&&h?`<span class="csd-policy-type" style="color:#b9a46a;">${h==="parent_corp"?"PARENT":"SUB CASH"}</span>`:""}
                <span class="csd-policy-badge" style="color:${x};border-color:${x}44;background:${x}0a;">${u.status.toUpperCase()}</span>
            </div>
        `}).join("");o.innerHTML=`
        <div class="csd-panel">
            <!-- Header -->
            <div class="csd-header">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:8px;height:8px;border-radius:50%;background:${d};display:inline-block;"></span>
                    <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:${d};text-transform:uppercase;">${i} Services Dashboard</span>
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
                    <div class="csd-rate-card-value">${n.length}</div>
                    <div class="csd-rate-breakdown">${t.policies_issued||0} total issued</div>
                </div>
                <div class="csd-rate-card">
                    <div class="csd-rate-card-label">Net Revenue</div>
                    <div class="csd-rate-card-value" style="color:${m};">${F(c)}</div>
                    <div class="csd-rate-breakdown">
                        <span style="color:#5cb85c;">${F(g)} collected</span>
                        ${a>0?` &mdash; <span style="color:#d9534f;">${F(a)} claims</span>`:""}
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
                    <span class="csd-limits-value">${F(t.coverage_limit||0)}</span>
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
    `;const l=document.getElementById("csd-markup-slider"),s=document.getElementById("csd-markup-display");l&&s&&l.addEventListener("input",()=>{s.textContent=(l.value/10).toFixed(1)+"%"}),document.getElementById("csd-save-markup")?.addEventListener("click",async()=>{const u=Number(l?.value||0)/10,x=document.getElementById("csd-save-markup");x&&(x.disabled=!0,x.textContent="Saving...");try{const _=Ue.nation,h=st(_,t.service_type,u),{error:w}=await De.from("subsidiary_auto_rates").update({markup:h.markup,effective_rate:h.effectiveRate,updated_at:new Date().toISOString()}).eq("id",t.id);if(w){console.error("[SubDash] Save markup failed:",w.message),alert("Failed to save markup.");return}t.markup=h.markup,t.effective_rate=h.effectiveRate,He(o)}catch(_){console.error("[SubDash] Save markup error:",_)}finally{x&&(x.disabled=!1,x.textContent="Save Markup")}})}const ft=.02,Ge=30,Ne=25,mt=.05,Le=2e5,ee=50,ut=.3,yt=1.7;function gt(o=ee){const t=Number(o??ee);return Math.max(ut,Math.min(yt,(t-ee)/100+1))}function Ve({subCash:o=0,gdpGrowth:t=50,parentReputation:e=ee}={}){const r=Number(o||0),d=Number(t??50),i=Ne/100,n=gt(e),g=Math.max(0,r),a=(d-Ge)/100,c=Math.round(g*ft*(1+a)*i*n),m=Math.max(.1,1+(50-d)/100),f=Math.round(Le*m);let l=c-f;const s=Math.max(Le,Math.round(Math.abs(r)*mt));return l<0&&(l=Math.max(l,-s)),{investmentReturn:c,overhead:f,maxLoss:s,netDelta:l,gdp:d,gdpMod:a,overheadMult:m,parentRepMult:n,parentReputation:Number(e??ee)}}async function xt(){const[o,t]=await Promise.all([b.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_loans, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),b.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, sub_cash, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("role","subsidiary").eq("is_active",!0)]),e={};for(const l of o.data||[])e[l.id]=l;const r=(o.data||[]).map(l=>l.id).filter(Boolean),d={};if(r.length){const{data:l}=await b.from("finance_active_loans").select("lender_faction_id, principal, remaining_principal, finance_loan_requests!inner(request_type)").in("lender_faction_id",r).in("status",["current","late","delinquent"]);for(const s of l||[]){const u=s.lender_faction_id;(d[u]||=[]).push(s)}}const i=(o.data||[]).map(l=>{const s=(l.corp_company_type||"Private").toUpperCase(),u=Number(l.corp_cash_reserves||0),x=Number(l.corp_loans||0),_=Oe(d[l.id]||[]).total;return{...l,abbr:l.corp_ticker||l.abbreviation||l.faction_name?.slice(0,4).toUpperCase()||"???",status:s,isPlayer:!!l.linked_user_id,reputation:Math.round(Number(l.corp_reputation??50)),revenue:Math.round(u*.1),valuation:je({cash:u,loans:x,financeReceivables:_}),_isSub:!1}}),{data:n}=await b.from("nations").select("id, name, gdp_growth"),g={},a={};(n||[]).forEach(l=>{g[l.id]=l.name,a[l.id]=Number(l.gdp_growth??50)});const c=[...new Set((t.data||[]).map(l=>l.faction_id).filter(Boolean))],m=[...new Set((t.data||[]).map(l=>l.nation_id).filter(Boolean))],f={};if(c.length&&m.length){const{data:l,error:s}=await b.from("corp_properties").select("faction_id, nation_id, purchase_price, capacity").in("faction_id",c).in("nation_id",m).eq("is_active",!0);s&&console.warn("[loadAllCorporations] subsidiary props fetch failed:",s.message);for(const u of l||[]){const x=`${u.faction_id}|${u.nation_id}`;(f[x]||=[]).push(u)}}for(const l of t.data||[]){const s=e[l.faction_id];if(!s)continue;const u=(s.corp_company_type||"Private").toUpperCase(),x=Number(l.sub_cash??0),_=a[l.nation_id]??50,w=(f[`${l.faction_id}|${l.nation_id}`]||[]).reduce((S,E)=>S+Number(E.purchase_price||0),0),M=Ve({subCash:x,gdpGrowth:_,parentReputation:Number(s.corp_reputation??50)});i.push({id:l.id,faction_name:l.name||"Subsidiary",abbreviation:s.abbreviation,corp_sector:s.corp_sector,corp_subsector:l.subsector||s.corp_subsector,corp_ticker:s.corp_ticker,corp_cash_reserves:x,nation_id:l.nation_id,nation:g[l.nation_id]||"?",abbr:(s.corp_ticker||s.abbreviation||"??").slice(0,4),status:u,isPlayer:!!s.linked_user_id,reputation:Ne,revenue:M.netDelta,valuation:w,_isSub:!0,_parentName:s.faction_name})}return i}let Z=[],p=null,k=null,P=null,bt=[],I={general:0,skilled:0,innovative:0},he=!1;const G=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function We(o){const t=Number(k?.minimum_wage??50),e=Number(k?.inflation??50),r=Number(k?.standard_of_living??50),d=t/100*48e3,i=1+(e-50)/100*.5,n=1+(r-50)/100*.5;return Math.round(d*o*i*n)}function ue(){return C.reduce((t,e)=>{const r=Number(e.capacity||0),d=Number(e.condition||0)/100;return t+Math.floor(r*d)},0)+500}function vt(o,t){const e=G.find(i=>i.id===o),r=Number(p?.[e.factionKey]??0),d=I[o]+t;if(!(r+d<0)){if(t>0){const i=G.reduce((g,a)=>{const c=Number(p?.[a.factionKey]??0),m=a.id===o?d:I[a.id];return g+c+m},0),n=ue();if(i>n)return}I[o]=d,ye()}}function $t(o){o?I[o]=0:I={general:0,skilled:0,innovative:0},ye()}async function ht(){if(he||!Object.values(I).some(n=>n!==0))return;let t=0;for(const n of G){const g=I[n.id];g>0&&(t+=g*We(n.multiplier)*.1)}const e=Number(p?.corp_cash_reserves??0);if(t>e){alert("Insufficient cash reserves. Hiring cost: "+y(t)+", available: "+y(e));return}const r=G.reduce((n,g)=>n+Number(p?.[g.factionKey]??0)+I[g.id],0),d=ue();if(r>d){alert("Cannot hire beyond property capacity ("+d.toLocaleString()+"). You need more workplaces.");return}const i=t>0?`Confirm workforce changes?

Hiring fee: `+y(t)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(i)){he=!0;try{const n={};for(const c of G){const m=Number(p?.[c.factionKey]??0);n[c.factionKey]=Math.max(0,m+I[c.id])}t>0&&(n.corp_cash_reserves=Math.max(0,e-Math.round(t)));const{error:g}=await b.from("factions").update(n).eq("id",p.id);if(g)throw g;Object.assign(p,n),I={general:0,skilled:0,innovative:0};const a=document.getElementById("topbar-cash");if(a){const c=Number(p.corp_cash_reserves??0);a.textContent="CASH: "+(c>=1e6?"$"+(c/1e6).toFixed(1)+"M":"$"+Math.round(c/1e3)+"k")}ye()}catch(n){alert("Error: "+n.message)}finally{he=!1}}}function ye(){const o=document.getElementById("hf-card-container");if(!o)return;const t="'JetBrains Mono', monospace",e={bg:"var(--bg-card)",surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},r=Number(k?.minimum_wage??50),d=Number(k?.inflation??50),i=Number(k?.standard_of_living??50),n=r/100*48e3,g=(1+(d-50)/100*.5).toFixed(2),a=(1+(i-50)/100*.5).toFixed(2),c=k?.name||p?.nation||"Nation",m=Object.values(I).some(w=>w!==0),f=ue();let l=0,s=0,u=0,x=0,_="";for(const w of G){const M=Number(p?.[w.factionKey]??0),S=I[w.id],E=M+S,O=We(w.multiplier),T=S>0,U=M*O,v=E*O,z=v-U;l+=M,s+=E,u+=U,x+=v;const N=S!==0?T?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";_+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${N};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${w.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${e.text}">${w.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.text}">${M.toLocaleString()}</span>
                    ${S!==0?`<span style="font-family:${t};font-size:10px;color:${e.dim}">→</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${T?e.greenBright:e.red}">${E.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">WAGE (MIN × ${w.multiplier}.0 × ${g} × ${a})</span>
                <span style="font-family:${t};font-size:10px;color:${w.color}">${y(O)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${w.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.red};border:1px solid ${e.border};cursor:pointer;background:${e.card}">-50</div>
                <div onclick="hfSetChange('${w.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.redDim};border:1px solid ${e.border};cursor:pointer;background:${e.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${S!==0?e.card:"transparent"};border:1px solid ${S!==0?e.border:"transparent"}">
                    ${S!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${t};font-size:12px;font-weight:700;color:${T?e.greenBright:e.red}">${T?"+":""}${S}</span>
                        <span onclick="hfReset('${w.id}')" style="font-family:${t};font-size:8px;color:${e.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${t};font-size:9px;color:${e.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${w.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.greenBright};border:1px solid ${e.border};cursor:pointer;background:${e.card}">+10</div>
                <div onclick="hfSetChange('${w.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.greenBright};border:1px solid ${e.border};cursor:pointer;background:${e.card}">+50</div>
            </div>
            ${S!==0?`<div style="margin-top:6px;padding:4px 8px;background:${e.bg};border:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${z>0?e.red:e.greenBright}">${z>0?"+":""}${y(z)}/yr</span>
            </div>`:""}
        </div>`}const h=x-u;o.innerHTML=`
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
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">${y(n)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${d}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">×${g}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${i}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">×${a}</div>
                    </div>
                </div>
            </div>
            ${_}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${m?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${l>=f?e.red:e.text}">${m?s.toLocaleString():l.toLocaleString()}</span>
                        <span style="font-family:${t};font-size:9px;color:${e.dim}">/ ${f.toLocaleString()}</span>
                    </div>
                    ${l>=f&&!m?`<div style="font-family:${t};font-size:7px;color:${e.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${y(u)}</span>
                        ${m?`<span style="font-family:${t};font-size:9px;color:${e.dim}">→</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${h>0?e.red:e.greenBright}">${y(x)}</span>`:""}
                    </div>
                </div>
            </div>
            ${m?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${e.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">NET CHANGE</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${h>0?e.red:e.greenBright}">${h>0?"+":""}${y(h)}/yr</span>
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">(${h>0?"+":""}${y(Math.round(h/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function _t(){const o=document.getElementById("wf-summary-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},r=(k?.name||p?.nation||"Nation").toUpperCase(),d=Number(k?.minimum_wage??50),i=Number(k?.inflation??50),n=Number(k?.standard_of_living??50),g=d/100*48e3,a=1+(i-50)/100*.5,c=1+(n-50)/100*.5,m=[{label:"General Workforce",mult:2,color:e.accent,key:"corp_general_workforce",countColor:e.text},{label:"Skilled Workforce",mult:3,color:e.gold,key:"corp_skilled_workforce",countColor:e.blue},{label:"Innovative Workforce",mult:6,color:e.orange,key:"corp_innovative_workforce",countColor:e.gold}];let f=0,l=0,s="";for(const u of m){const x=Number(p?.[u.key]??0),_=Math.round(g*u.mult*a*c),h=x*_;f+=x,l+=h,s+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${e.text}">${u.label}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${r}</span>
                </div>
                <span style="font-family:${t};font-size:16px;font-weight:700;color:${u.countColor}">${x.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">WAGE (MIN × ${u.mult}.0 × ${a.toFixed(2)} × ${c.toFixed(2)})</span>
                <span style="font-family:${t};font-size:10px;color:${e.muted}">${y(_)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${y(h)}</span>
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
            ${s}
            <div style="padding:8px 12px;background:${e.card};border-bottom:1px solid ${e.border};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1px;color:${e.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">MINIMUM WAGE (${r})</span>
                    <span style="font-family:${t};font-size:9px;color:${e.text}">${d}/100 → ${y(g)}/yr</span>
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
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${y(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${y(Math.round(l/12))}</span>
            </div>
        </div>
    </div>`}let C=[];async function Ee(){if(!p?.id)return;const{data:o}=await b.from("corp_properties").select("*").eq("faction_id",p.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});C=o||[]}function Ie(){const o=document.getElementById("property-card-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},r=(k?.name||p?.nation||"Nation").toUpperCase();let d="",i=0,n=0;const g=k?.name||p?.nation||"Home Nation",a=5e7,c=1+(Number(k?.inflation??50)-50)/100*.3,m=.8+Number(k?.stability??50)/100*.4,f=Math.round(a*c*m),l=Math.round(f*.005);i+=f,n+=l,d+=`
    <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;font-weight:600;color:${e.text}">National Headquarters</span>
            <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:#5c5;background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">HQ</span>
        </div>
        <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px;">${g} · Headquarters</div>
        <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">CAPACITY</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">500</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">VALUE</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${y(f)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">MAINT/MO</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.red}">${y(l)}</div>
            </div>
        </div>
    </div>`;for(const s of C){const u=pe[s.style]||pe.Basic;i+=Number(s.purchase_price||0),n+=Number(s.monthly_maintenance||0),d+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${e.text}">${s.name}</span>
                <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${e.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px;">${s.city||r} · ${(s.type||"").replace(/_/g," ")} · <span style="color:${u.color}">${(s.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">CAPACITY</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${(s.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">PAID</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${y(s.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">MAINT/MO</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.red}">${y(s.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">CONDITION</span>
                <span style="font-family:${t};font-size:9px;color:${s.condition>=75?"#5c5":s.condition>=50?"#ca5":e.orange}">${s.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${e.border};margin-top:2px;"><div style="width:${s.condition}%;height:100%;background:${s.condition>=75?"#5c5":s.condition>=50?"#ca5":e.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propSell('${s.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${t};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${e.red};border:1px solid ${e.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${t};font-size:10px;color:${e.muted}">${C.length+1} ASSET${C.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${d}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.green}">${y(i)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${y(n)}/mo</span>
            </div>
        </div>
    </div>`}let Y=[],B=null;const pe={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Ae(){if(!p?.nation_id)return;const{data:o,error:t}=await b.from("available_properties").select("*, property_catalog:catalog_id(subsector_lock)").eq("nation_id",p.nation_id).eq("status","available").order("price",{ascending:!0});if(t){console.warn("[Property] Failed to load marketplace:",t.message);return}const e=p?.corp_sector==="Construction",r=(p?.corp_subsector||"").toLowerCase();Y=(o||[]).filter(d=>e||d.type!=="warehouse").filter(d=>{const i=d.property_catalog?.subsector_lock;return!i||i===r}).map(d=>({...d,adjusted_cost:d.price,adjusted_maintenance:d.monthly_maintenance}))}function ge(){const o=document.getElementById("new-property-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"};(k?.name||p?.nation||"Nation").toUpperCase();const r=Number(k?.standard_of_living??50),d=Number(k?.gdp_growth??50),i=Number(k?.inflation??50),n=k?.capital||"Capital",g={capital:n,port:n+" Port",industrial:n+" Industrial Zone",suburban:n+" Suburbs",coastal:n+" Coast"};let a="";if(Y.length===0)a=`<div style="padding:20px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let c=0;c<Y.length;c++){const m=Y[c],f=B===c,l=pe[m.style]||pe.Basic,s=g[m.city_template]||n;a+=`
            <div onclick="npSelect(${c})" style="padding:8px 14px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${f?e.accent:"transparent"};background:${f?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${e.text}">${m.name}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${l.color};background:${l.color}12;border:1px solid ${l.color}25">${l.label}</span>
                </div>
                <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:5px;">${s} · ${m.type.replace(/_/g," ")}</div>
                <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">CAPACITY</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.text};margin-top:1px">${m.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">PRICE</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.gold};margin-top:1px">${y(m.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.redDim};margin-top:1px">${y(m.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${f?`<div style="margin-top:5px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:${t};font-size:7px;color:${e.dim}">CONDITION</span>
                        <span style="font-family:${t};font-size:9px;color:${m.condition>=75?e.greenBright:m.condition>=50?e.yellow:e.orange}">${m.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${m.condition}%;height:100%;background:${m.condition>=75?e.greenBright:m.condition>=50?e.yellow:e.orange}"></div></div>
                </div>`:""}
            </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">New Property</span>
            </div>
            <span style="font-family:${t};font-size:9px;color:${e.dim}">${Y.length} AVAILABLE</span>
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
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${i<=50?e.greenBright:e.red}">${Math.round(i)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${a}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold};border:1px solid ${e.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${B!==null?"#000":e.dim};background:${B!==null?e.accent:"transparent"};border:1px solid ${B!==null?e.accent:e.border};cursor:${B!==null?"pointer":"default"};opacity:${B!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function wt(o){B=B===o?null:o,ge()}let _e=!1;async function kt(){if(B===null||_e)return;const o=Y[B];if(!o)return;const t=Number(p?.corp_cash_reserves??0);if(o.adjusted_cost>t){alert(`Insufficient cash reserves.
Property: `+y(o.adjusted_cost)+`
Cash: `+y(t));return}if(confirm('Buy "'+o.name+'" for '+y(o.adjusted_cost)+`?

Monthly maintenance: `+y(o.adjusted_maintenance)+`/mo
Condition: `+o.condition+`%

This will be deducted from your cash reserves.`)){_e=!0;try{const{error:e}=await b.from("corp_properties").insert({faction_id:p.id,nation_id:p.nation_id,catalog_id:o.catalog_id||null,name:o.name,type:o.type,role:o.type,style:o.style,capacity:o.capacity,purchase_price:o.adjusted_cost,monthly_maintenance:o.adjusted_maintenance,condition:o.condition,city:o.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(e)throw e;const r=Math.max(0,t-o.adjusted_cost),{error:d}=await b.from("factions").update({corp_cash_reserves:r}).eq("id",p.id);if(d)throw d;p.corp_cash_reserves=r,o.id&&await b.from("available_properties").update({status:"sold",purchased_by:p.id}).eq("id",o.id);const i=document.getElementById("topbar-cash");i&&(i.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),B=null,await Ae(),ge(),Ie(),alert("Property purchased: "+o.name+`

Deducted: `+y(o.adjusted_cost))}catch(e){alert("Purchase failed: "+e.message)}finally{_e=!1}}}const K={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let Te=!1,$={name:"",type:"Office Building",size:2e3,style:"Modern",nationId:null,nationName:null},we=!1,Ce=[];function Ye(){const t=1+(Number(k?.inflation??50)-50)/100*.3,e=K[$.style]?.costMod||1,r=$.type==="Warehouse"?.75:1,d=Math.round($.size*1e5*t*e*r),i=Math.round(d*.007*(K[$.style]?.maintMod||1));return{total:d,maint:i,inflMod:t,styleMod:e}}async function St(){Te=!0;const o=p?.nation_id,t=k?.name||p?.nation||"Home Nation";$={name:"",type:"Office Building",size:2e3,style:"Modern",nationId:o,nationName:t},Ce=[{id:o,name:t,label:"National HQ"}];try{const{data:e}=await b.from("corp_properties").select("nation_id, name, nations!nation_id(name)").eq("faction_id",p.id).eq("type","regional_hq").eq("is_active",!0);for(const r of e||[])r.nation_id!==o&&Ce.push({id:r.nation_id,name:r.nations?.name||"Unknown",label:r.name||"Regional HQ"})}catch{}Je()}function Be(){Te=!1,document.getElementById("cp-modal-overlay")?.remove()}function zt(o,t){$[o]=t,Je()}async function Ct(){if(!(we||!$.name.trim())){if(!$.nationId){alert("Select a location.");return}we=!0;try{const o=Ye(),t=$.nationId,e=$.nationName||"Unknown",r=K[$.style]?.repGain||1,d=await b.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),i=d.data?.current_tick||0,n=(d.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:g}=await b.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",t).eq("issuer_type","PRIVATE"),c=`PVT-C${(g||0)+1}-${n}`,{error:m}=await b.from("construction_contracts").insert({nation_id:t,template_key:"custom_building",sector:"civil_engineering",name:$.name.trim(),project_type:$.type,project_subtype:$.style,description:`${$.type} (${$.style}) — ${$.size.toLocaleString()} employees, commissioned by ${p.faction_name}`,project_code:c,budget_ceiling:o.total,timeline_ticks:Math.max(4,Math.ceil($.size/2e3)+2),required_materials:(()=>{const f=$.size/1e3,l=$.style,s={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[l]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(x,_)=>Math.max(1,Math.ceil(f*x*_));return{concrete:u(8,s.concrete),steel:u(6,s.steel),glass_facades:u(3,s.glass),em_systems:u(4,s.em),lumber:u(1,s.lumber),heavy_parts:u(2,s.heavy),aggregate:u(3,s.agg)}})(),required_equipment:(()=>{const f=$.size,l={trucks:Math.ceil(f/2e3)+1,mixers:Math.ceil(f/3e3)+1};return f>1e3&&(l.excavators=Math.ceil(f/3e3)+1,l.cranes=Math.ceil(f/4e3)+1),f>3e3&&(l.bulldozers=Math.ceil(f/4e3)+1,l.haulers=Math.ceil(f/5e3)+1),f>8e3&&(l.pile_drivers=Math.ceil(f/6e3)+1),l})(),required_workforce:{general:Math.ceil($.size*.08),skilled:Math.ceil($.size*.03)},status:"open",generated_at_tick:i,bidding_ends_tick:i+3,issuer_type:"PRIVATE",issuer_name:p.faction_name,issuer_faction_id:p.id});if(m)throw m;Be(),alert(`Construction project submitted!

Project: `+$.name.trim()+`
Code: `+c+`
Budget: `+y(o.total)+`
Expected Reputation: +`+Math.ceil(o.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+e+" can now bid on this project.")}catch(o){alert("Failed to submit project: "+o.message)}finally{we=!1}}}function Je(){if(document.getElementById("cp-modal-overlay")?.remove(),!Te)return;const o="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},e=Ye(),r=Math.ceil(e.total/1e8*3),d=r>=4?t.gold:r>=3?t.greenBright:r>=2?t.accent:t.dim,i=Object.entries(K).map(([a,c])=>{const m=$.style===a;return`<div onclick="cpSetField('style','${a}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${m?c.color+"18":"transparent"};border:1px solid ${m?c.color+"44":t.border};">
            <div style="font-family:${o};font-size:9px;font-weight:700;color:${m?c.color:t.dim}">${a}</div>
            <div style="font-family:${o};font-size:7px;color:${t.dim};margin-top:1px">×${c.costMod.toFixed(1)} cost</div>
        </div>`}).join(""),n=document.createElement("div");n.id="cp-modal-overlay",n.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",n.innerHTML=`
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
                <input id="cp-name-input" value="${$.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:8px 12px;font-family:${o};font-size:14px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Type</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${["Regional HQ","Office Building",...p?.corp_sector==="Construction"?["Warehouse"]:[],...p?.corp_subsector?.toLowerCase()==="banking"?["Branch Office"]:[],...p?.corp_subsector?.toLowerCase()==="investment"?["Trading Floor"]:[],...p?.corp_subsector?.toLowerCase()==="insurance"?["Claims Office","Insurance Office"]:[]].map(a=>{const c=["Branch Office","Trading Floor","Claims Office","Insurance Office"].includes(a),f=a==="Warehouse"?t.orange:c?"#8a6aaa":t.accent;return`<span onclick="cpSetField('type','${a}')" style="flex:1;min-width:100px;text-align:center;padding:6px 0;font-family:${o};font-size:12px;font-weight:700;cursor:pointer;color:${$.type===a?"#000":t.dim};background:${$.type===a?f:"transparent"};border:1px solid ${$.type===a?f:t.border}">${a}</span>`}).join("")}
                </div>
                ${$.type==="Warehouse"?`<div style="font-family:${o};font-size:9px;color:${t.orange};margin-top:5px;">Warehouse: 75% construction cost, stores up to $20M in materials</div>`:""}
                ${$.type==="Branch Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Branch Office: Increases lending capacity. +1 reputation per 200 employees. Enables cross-nation lending.</div>`:""}
                ${$.type==="Trading Floor"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Trading Floor: Enables secondary bond market. +1 reputation per 200 employees. Portfolio management bonuses.</div>`:""}
                ${$.type==="Claims Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Claims Office: Faster claim processing. +1 reputation per 200 employees. Local presence reduces premiums.</div>`:""}
                ${$.type==="Insurance Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Insurance Office: Required to sell private Health Insurance in this nation. Needs skilled workforce to staff (~60% of capacity). Does not operate where Universal Healthcare is in force.</div>`:""}
                ${$.type==="Regional HQ"?`<div style="font-family:${o};font-size:9px;color:${t.accent};margin-top:5px;">Regional HQ: Establishes corporate presence in another nation.</div>`:""}
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Location</div>
                <select onchange="cpSetField('nationId', this.value); cpSetField('nationName', this.options[this.selectedIndex].text)"
                    style="width:100%;padding:8px 12px;font-family:${o};font-size:12px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;">
                    ${Ce.map(a=>`<option value="${a.id}" ${$.nationId===a.id?"selected":""}>${a.name} (${a.label})</option>`).join("")}
                </select>
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${o};font-size:10px;color:${t.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${o};font-size:18px;font-weight:700;color:${t.text}">${$.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${$.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${t.accent};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${o};font-size:9px;color:${t.dim};margin-top:3px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;">${i}</div>
                <div style="margin-top:5px;font-family:${o};font-size:10px;color:${K[$.style].color}">${K[$.style].desc}</div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Estimated Cost</div>
                <div style="background:${t.card};border:1px solid ${t.border};padding:10px 12px;">
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${o};font-size:12px;font-weight:700;color:${t.text}">TOTAL BUDGET</span>
                        <span style="font-family:${o};font-size:18px;font-weight:700;color:${t.gold}">${y(e.total)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid ${t.border}">
                        <span style="font-family:${o};font-size:10px;color:${t.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${o};font-size:12px;color:${t.redDim}">${y(e.maint)}/mo</span>
                    </div>
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);margin-bottom:10px;">
                <div style="font-family:${o};font-size:10px;color:${t.gold};margin-bottom:3px">WHAT HAPPENS NEXT</div>
                <div style="font-size:12px;color:${t.dim};line-height:1.5">
                    This project will appear as a Civil Engineering bid in the Open Contracts pool for all construction corporations with an HQ or Regional HQ in ${$.nationName||"the selected nation"}. The lowest qualified bidder wins the contract and begins construction.
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:${o};font-size:12px;color:${t.accent}">EXPECTED REPUTATION GAIN</span>
                    <span style="font-family:${o};font-size:20px;font-weight:700;color:${d}">+${r}</span>
                </div>
                <div style="font-family:${o};font-size:9px;color:${t.dim};margin-top:3px">${$.style} style · ${r===5?"Maximum prestige":r>=4?"Impressive presence":r>=3?"Strong statement":r>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:12px 20px;border-top:1px solid ${t.border};background:${t.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${o};font-size:9px;color:${t.dim}">TOTAL PROJECT</div>
                <div style="font-family:${o};font-size:18px;font-weight:700;color:${t.gold}">${y(e.total)}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="cpClose()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${t.gold};cursor:pointer;opacity:${$.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(n);const g=document.getElementById("cp-name-input");g&&g.addEventListener("input",a=>{$.name=a.target.value}),n.addEventListener("click",a=>{a.target===n&&Be()})}function Mt(){const o=document.getElementById("cp-name-input");if(o&&($.name=o.value),!$.name.trim()){alert("Please enter a building name.");return}Ct()}window.cpClose=Be;window.cpSetField=zt;window.cpSubmitFromModal=Mt;window.npSelect=wt;window.npBuyProperty=kt;window.npOpenConstructionModal=St;let ke=!1;async function Nt(o){if(ke)return;const t=C.find(i=>i.id===o);if(!t)return;const e=1+(Number(k?.inflation??50)-50)/100*.3,r=(t.condition||50)/100,d=Math.round((t.purchase_price||0)*.6*r*e);if(confirm('Sell "'+t.name+`"?

Sale value: `+y(d)+" (60% × "+t.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){ke=!0;try{await b.from("corp_properties").update({is_active:!1}).eq("id",o);const n=Number(p?.corp_cash_reserves??0)+d;await b.from("factions").update({corp_cash_reserves:n}).eq("id",p.id),p.corp_cash_reserves=n;const a=(await b.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await b.from("available_properties").insert({nation_id:p.nation_id,catalog_id:t.catalog_id||null,name:t.name,type:t.type,style:t.style,capacity:t.capacity,price:Math.round(d*1.1),monthly_maintenance:t.monthly_maintenance,condition:t.condition,city:t.city,generated_at_tick:a,expires_at_tick:a+6,status:"available"});const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k")),await Ee(),Ie(),await Ae(),ge(),alert('Sold "'+t.name+'" for '+y(d))}catch(i){alert("Sale failed: "+i.message)}finally{ke=!1}}}window.propSell=Nt;const Pe={SALE:.8,DISSOLVE:.6};function Et(o){if(!o)return 0;const t=o.trim().replace(/[$,]/g,""),e=t.match(/^([\d.]+)\s*[Mm]$/),r=t.match(/^([\d.]+)\s*[Kk]$/);return Math.round(e?parseFloat(e[1])*1e6:r?parseFloat(r[1])*1e3:parseFloat(t))}function ae(o){const t=document.getElementById("topbar-cash");t&&(t.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k"))}function Ke(o){return Q.find(t=>t.id===o)?.name||"—"}function xe(o){return C.filter(t=>t.nation_id===o)}async function re(){J=0,await Ee(),Ie(),se(),le()}let A=!1,J=0,ce={};async function It(){if(p?.id)try{const{data:o}=await b.from("construction_contracts").select("nation_id").eq("awarded_to_faction",p.id).in("status",["in_progress","awarded"]);ce={};for(const t of o||[])t.nation_id&&(ce[t.nation_id]=(ce[t.nation_id]||0)+1)}catch{}}function Qe(o){const t=xe(o.nation_id),e=t.reduce((l,s)=>l+Number(s.purchase_price||0),0),r=t.reduce((l,s)=>l+Number(s.capacity||0),0),d=ce[o.nation_id]||0,i=Q.find(l=>l.id===o.nation_id),n=(o.name||"").trim().split(/\s+/),g=n.length>=2?n.map(l=>l[0]).join("").toUpperCase().slice(0,4):(o.name||"SUB").slice(0,4).toUpperCase(),a=Number(o.sub_cash||0),c=Number(i?.gdp_growth??50),m=Ve({subCash:a,gdpGrowth:c,parentReputation:Number(p?.corp_reputation??50)}),f=m.netDelta;return{id:o.id,name:o.name,abbr:g,nation:i?.name||o.city||"—",nationId:o.nation_id,sector:p?.corp_sector||"General",subsector:o.subsector||p?.corp_subsector||"—",revenue:f,debt:0,cash:a,reputation:Ne,valuation:e,workforce:r,projects:d,established:o.created_at?new Date(o.created_at).getFullYear().toString():"—",trend:f>0?"up":f<0?"down":c>=Ge&&a>0?"flat":"down",profitable:f>0,projectedInvestmentReturn:m.investmentReturn,projectedOverhead:m.overhead,hqProp:o}}function se(){const o=document.getElementById("manage-subsidiaries-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},d=C.filter(m=>m.role==="subsidiary").map(Qe);J>=d.length&&(J=0);const i=d[J]||null;let n="";d.length===0&&(n=`<div style="padding:30px 14px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let g=0,a=0;for(let m=0;m<d.length;m++){const f=d[m],l=m===J;g+=f.revenue,a+=f.valuation;const s=f.trend==="up"?e.greenBright:f.trend==="down"?e.red:e.dim,u=f.trend==="up"?"▲":f.trend==="down"?"▼":"–";n+=`
        <div onclick="selectSubsidiary(${m})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${l?e.accent:"transparent"};background:${l?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${f.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${e.text};line-height:1.2">${f.name}</div>
                <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:1px">${f.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${t};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${f.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${t};font-size:9px;font-weight:700;color:${f.profitable?e.greenBright:e.redDim};text-align:right">${y(f.revenue)}</span>
            <span style="width:40px;font-family:${t};font-size:9px;font-weight:700;color:${f.reputation>=40?e.accent:f.reputation>=25?e.yellow:e.orange};text-align:right">${f.reputation}</span>
            <span style="width:55px;font-family:${t};font-size:9px;color:${e.muted};text-align:right">${y(f.valuation)}</span>
            <span style="width:12px;font-family:${t};font-size:8px;color:${s};text-align:right">${u}</span>
        </div>`}let c="";if(i){const m=i.trend==="up"?e.greenBright:i.trend==="down"?e.red:e.dim,f=i.trend==="up"?"▲":i.trend==="down"?"▼":"–",l=i.trend==="up"?"Growing":i.trend==="down"?"Declining":"Stable",s=i.reputation>=40?e.accent:i.reputation>=25?e.yellow:e.orange,u=[{label:"Projected Revenue",value:y(i.revenue),color:i.profitable?e.greenBright:e.redDim},{label:"Projected Overhead",value:"-"+y(i.projectedOverhead),color:e.redDim},{label:"Projected Investment Return",value:"+"+y(i.projectedInvestmentReturn),color:e.greenBright},{label:"Cash",value:y(i.cash),color:e.text},{label:"Debt",value:i.debt>0?y(i.debt):"$0",color:i.debt>0?e.orange:e.dim},{label:"Reputation",value:i.reputation+"/100",color:s},{label:"Market Valuation",value:y(i.valuation),color:e.gold},{label:"Workforce",value:i.workforce.toLocaleString(),color:e.text},{label:"Active Projects",value:i.projects.toString(),color:i.projects>0?e.text:e.dim}],x=i.projects===0,_=i.hqProp?.logo_url?`<img src="${j(i.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${e.card};border:1px dashed ${e.border};border-radius:4px;cursor:pointer;font-size:14px;color:${e.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${i.hqProp?.id||""}" style="display:none;"></label>`;c=`
            <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    ${_}
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${t};font-size:12px;font-weight:700;color:${e.gold}">${i.abbr}</span>
                            <span style="font-size:12px;font-weight:700;color:${e.text}">${i.name}</span>
                        </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${t};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${i.nation.toUpperCase()}</span>
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">Est. ${i.established}</span>
                    <span style="font-family:${t};font-size:8px;color:${m}">${f} ${l}</span>
                </div>
                    </div>
                </div>
            </div>
            ${u.map(h=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                <span style="font-family:${t};font-size:9px;color:${e.dim};letter-spacing:0.5px;text-transform:uppercase">${h.label}</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;color:${h.color}">${h.value}</span>
            </div>`).join("")}
            <div style="padding:6px 14px;border-bottom:1px solid ${e.border};flex-shrink:0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">REPUTATION</span>
                    <span style="font-family:${t};font-size:8px;color:${e.muted}">75% sub / 25% parent</span>
                </div>
                <div style="width:100%;height:4px;background:${e.border}"><div style="width:${i.reputation}%;height:100%;background:${s}"></div></div>
            </div>
            ${i.subsector==="Insurance"||i.subsector==="Banking"?`<div id="sub-dashboard-${i.id}" style="flex:1;overflow-y:auto;"></div>`:'<div style="flex:1"></div>'}
            <div style="padding:6px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                <div style="font-family:${t};font-size:8px;letter-spacing:1.5px;color:${e.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
                <div style="display:flex;gap:4px;margin-bottom:4px;">
                    <div onclick="subInjectCapital('${i.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${e.greenBright};border:1px solid ${e.greenDark};background:rgba(74,170,136,0.06)">INJECT CAPITAL</div>
                    <div onclick="subWithdraw('${i.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${i.cash>0?e.gold:e.dim};border:1px solid ${i.cash>0?e.gold+"44":e.border};opacity:${i.cash>0?1:.4}">WITHDRAW</div>
                </div>
                <div style="display:flex;gap:4px;">
                    <div onclick="subMerge('${i.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${e.accent};border:1px solid ${e.accent}">MERGE</div>
                    <div onclick="subPutForSale('${i.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${e.orange};border:1px solid ${e.orange}">PUT UP FOR SALE</div>
                    <div onclick="${x?"subDissolve('"+i.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${x?e.red:e.dim};border:1px solid ${x?e.red:e.border};opacity:${x?1:.3}">DISSOLVE</div>
                </div>
                ${i.projects>0?`<div style="margin-top:4px;font-family:${t};font-size:7px;color:${e.dim}">Cannot dissolve with active projects.</div>`:""}
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
                <div style="flex:1;overflow:auto;">${n}</div>
                <div style="padding:6px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;display:flex;align-items:center;">
                    <span style="width:40px"></span>
                    <span style="flex:1.5;font-family:${t};font-size:8px;color:${e.dim}">COMBINED</span>
                    <span style="width:65px"></span>
                    <span style="width:55px;font-family:${t};font-size:9px;font-weight:700;color:${e.text};text-align:right">${y(g)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${t};font-size:9px;font-weight:700;color:${e.text};text-align:right">${y(a)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${c}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async m=>{const f=m.target.files?.[0],l=m.target.dataset.propId;if(!(!f||!l)){if(f.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const s=f.name.split(".").pop()?.toLowerCase()||"png",u=`party-logos/${p.id}/sub_${l}_${Date.now()}.${s}`,{error:x}=await b.storage.from("public-assets").upload(u,f,{contentType:f.type,upsert:!0});if(x)throw x;const{data:_}=b.storage.from("public-assets").getPublicUrl(u),h=_?.publicUrl;if(h){await b.from("corp_properties").update({logo_url:h}).eq("id",l);const w=C.find(M=>M.id===l);w&&(w.logo_url=h),se()}}catch(s){alert("Upload failed: "+(s.message||"Error"))}}}),i&&(i.subsector==="Insurance"||i.subsector==="Banking")){const m="sub-dashboard-"+i.id;setTimeout(()=>{document.getElementById(m)&&pt(b,{faction:p,nation:k,shard:P},m,i.id).catch(f=>console.error("[SubDash] Init failed:",f))},50)}}async function Xe(o,t){if(A)return;const e=C.find(s=>s.id===o);if(!e)return;const r=t==="sell",d=r?Pe.SALE:Pe.DISSOLVE,i=r?"SELL":"DISSOLVE",n=r?"sold":"dissolved",g=r?"80%":"60%",a=Ke(e.nation_id),c=xe(e.nation_id),m=c.reduce((s,u)=>s+Math.round((u.purchase_price||0)*d*(u.condition||50)/100),0),f=Number(e.sub_cash||0),l=m+f;if(confirm(i+' subsidiary "'+e.name+`"?

`+c.length+" properties at "+g+` × condition:
  Property value: `+y(m)+`
  Subsidiary cash: `+y(f)+`
  ─────────────────
  Total return: `+y(l)+`

All operations in `+a+` cease.
This cannot be undone.`)){A=!0;try{const s=c.map(x=>x.id);if(s.length===1){const{error:x}=await b.from("corp_properties").update({is_active:!1}).eq("id",s[0]);if(x)throw x}else if(s.length>1){const{error:x}=await b.from("corp_properties").update({is_active:!1}).in("id",s);if(x)throw x}await b.from("corp_properties").update({sub_cash:0}).eq("id",o).then(()=>{}).catch(()=>{});const u=Number(p?.corp_cash_reserves??0)+l;await b.from("factions").update({corp_cash_reserves:u}).eq("id",p.id),p.corp_cash_reserves=u,ae(u),await re(),alert("Subsidiary "+n+". "+c.length+` properties liquidated.
Total received: `+y(l))}catch(s){alert("Failed: "+s.message)}finally{A=!1}}}function At(o){Xe(o,"sell")}async function Tt(o){if(A)return;const t=C.find(g=>g.id===o);if(!t)return;const e=Ke(t.nation_id),d=xe(t.nation_id).reduce((g,a)=>g+Math.round((a.purchase_price||0)*.8*(a.condition||50)/100),0),i=Number(t.sub_cash||0),n=Math.round(i*.05);if(confirm('PUT UP FOR SALE: "'+t.name+`"

Nation: `+e+`
Estimated Valuation: `+y(d)+`
Subsidiary Cash: `+y(i)+`
Subsector: `+(t.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){A=!0;try{const g=P?.current_tick||0,{data:a,error:c}=await b.from("subsidiary_sales").insert({subsidiary_id:o,seller_faction_id:p.id,nation_id:t.nation_id,subsidiary_name:t.name,subsector:t.subsector||null,valuation:d,monthly_revenue:n,sub_cash_at_listing:i,employee_count:t.capacity||0,status:"listed",listed_at_tick:g}).select("*").single();if(c){alert("Failed to list: "+c.message);return}alert('"'+t.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await re()}catch(g){alert("Failed: "+g.message)}finally{A=!1}}}let fe=[],Ze="ready",te=null;async function be(){const o=await lt(b);fe=o.listings,Ze=o.state,te=o.error,te&&console.error("[SubMarket] Load failed:",te.message)}function ve(){let o=document.getElementById("sub-marketplace-card");o||(o=document.createElement("div"),o.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(o));const t=fe.filter(a=>a.seller_faction_id!==p?.id),e=fe.filter(a=>a.seller_faction_id===p?.id),r="'JetBrains Mono',monospace",d=getComputedStyle(document.body),i=(a,c)=>d.getPropertyValue(a).trim()||c,n={surface:i("--bg-2","var(--bg-card)"),card:i("--bg-3","#f0efeb"),border:i("--border-0","rgba(0,0,0,0.08)"),dim:i("--text-dim","#aaa"),muted:i("--text-muted","#888"),text:i("--text-primary","#333"),bright:i("--text-bright","#1a1a17"),orange:i("--orange","#d35400"),green:i("--green","#2d8a2d"),blue:i("--blue","#2874a6"),red:i("--red","#c0392b"),gold:i("--gold","#a88520")};let g=`<div style="width:760px;background:${n.surface};border:1px solid ${n.border};font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 14px;border-bottom:1px solid ${n.border};display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${n.orange};display:inline-block;"></span>
            <span style="font-family:${r};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${n.orange};text-transform:uppercase;">Subsidiary Marketplace</span>
            <span style="font-family:${r};font-size:9px;color:${n.dim};">${t.length} available</span>
        </div>`;if(e.length>0){g+=`<div style="padding:8px 14px;border-bottom:1px solid ${n.border};background:${n.card};">
            <div style="font-family:${r};font-size:8px;letter-spacing:1px;color:${n.gold};text-transform:uppercase;margin-bottom:6px;">YOUR LISTINGS</div>`;for(const a of e){const m=(a.subsidiary_bids||[]).filter(f=>f.status==="pending");g+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:${n.bright};">${j(a.subsidiary_name)}</span>
                    <span style="font-family:${r};font-size:8px;color:${n.dim};margin-left:6px;">${j(a.subsector||"")}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${r};font-size:9px;color:${m.length>0?n.green:n.dim};">${m.length} bid${m.length!==1?"s":""}</span>
                    ${m.length>0?`<span onclick="subViewBids('${a.id}')" style="font-family:${r};font-size:8px;font-weight:700;padding:3px 8px;color:${n.green};border:1px solid ${n.green}44;cursor:pointer;">VIEW BIDS</span>`:""}
                    <span onclick="subCancelSale('${a.id}')" style="font-family:${r};font-size:8px;font-weight:700;padding:3px 8px;color:${n.red};border:1px solid ${n.red}44;cursor:pointer;">CANCEL</span>
                </div>
            </div>`}g+="</div>"}if(Ze==="error")g+=`<div style="padding:24px 14px;text-align:center;font-family:${r};font-size:10px;color:${n.red};font-style:italic;">${j(te&&te.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(t.length===0)g+=`<div style="padding:24px 14px;text-align:center;font-family:${r};font-size:10px;color:${n.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const a of t){const c=(a.subsidiary_bids||[]).find(l=>l.bidder_faction_id===p?.id&&l.status==="pending"),f=(bt||[]).find(l=>l.id===a.nation_id)?.name||"Unknown";g+=`<div style="padding:10px 14px;border-bottom:1px solid ${n.border};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:12px;font-weight:700;color:${n.bright};">${j(a.subsidiary_name)}</span>
                        <span style="font-family:${r};font-size:7px;font-weight:700;padding:1px 5px;color:${n.orange};border:1px solid ${n.orange}44;background:${n.orange}0a;">${j(a.subsector||"General")}</span>
                    </div>
                    <span style="font-family:${r};font-size:8px;color:${n.dim};">${j(f)}</span>
                </div>
                <div style="display:flex;gap:16px;font-family:${r};font-size:8px;color:${n.muted};margin-bottom:8px;">
                    <span>Valuation: <strong style="color:${n.text};">${y(a.valuation)}</strong></span>
                    <span>Revenue: <strong style="color:${n.text};">${y(a.monthly_revenue)}/mo</strong></span>
                    <span>Cash: <strong style="color:${n.text};">${y(a.sub_cash_at_listing)}</strong></span>
                    <span>Staff: <strong style="color:${n.text};">${a.employee_count}</strong></span>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    ${c?`<span style="font-family:${r};font-size:8px;font-weight:700;color:${n.green};">✓ BID PLACED: ${y(c.bid_amount)}</span>`:`<span onclick="subPlaceBid('${a.id}','${j(a.subsidiary_name)}',${a.valuation})" style="font-family:${r};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${n.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}g+="</div>",o.innerHTML=g}async function Bt(o,t,e){const r=prompt('Place bid for "'+t+`"

Valuation: `+y(e)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!r)return;const d=Math.round(Number(r));if(isNaN(d)||d<1e6){alert("Minimum bid is $1,000,000.");return}const i=Number(p?.corp_cash_reserves??0);if(d>i){alert("Insufficient funds. You have "+y(i)+".");return}const{error:n}=await b.from("subsidiary_bids").insert({sale_id:o,bidder_faction_id:p.id,bid_amount:d,status:"pending",placed_at_tick:P?.current_tick||0});if(n){n.message.includes("duplicate")||n.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+n.message);return}alert("Bid of "+y(d)+' placed on "'+t+`".
The seller will review your bid.`),await be(),ve()}async function Rt(o){const t=fe.find(l=>l.id===o);if(!t)return;const e=(t.subsidiary_bids||[]).filter(l=>l.status==="pending");if(e.length===0){alert("No pending bids.");return}const r=e.map(l=>l.bidder_faction_id),{data:d}=await b.from("factions").select("id, faction_name").in("id",r),i={};(d||[]).forEach(l=>{i[l.id]=l.faction_name});let n='Bids for "'+t.subsidiary_name+`":

`;const g=e.sort((l,s)=>s.bid_amount-l.bid_amount);for(let l=0;l<g.length;l++){const s=g[l];n+=l+1+". "+(i[s.bidder_faction_id]||"Unknown")+": "+y(s.bid_amount)+`
`}n+=`
Enter the number of the bid to accept (or cancel):`;const a=prompt(n);if(!a)return;const c=parseInt(a,10)-1;if(isNaN(c)||c<0||c>=g.length){alert("Invalid selection.");return}const m=g[c],f=i[m.bidder_faction_id]||"Unknown";confirm("Accept bid of "+y(m.bid_amount)+" from "+f+`?

This will transfer ownership of "`+t.subsidiary_name+`" to them.
You will receive `+y(m.bid_amount)+` in cash.

This cannot be undone.`)&&await Lt(t,m)}let Se=!1;async function Lt(o,t){if(!Se){Se=!0;try{const d=P?.current_tick||0,{data:i}=await b.from("factions").select("corp_cash_reserves").eq("id",t.bidder_faction_id).single(),n=Number(i?.corp_cash_reserves??0);if(n<t.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await b.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:d}).eq("id",t.id);return}var{error:e}=await b.from("factions").update({corp_cash_reserves:n-t.bid_amount}).eq("id",t.bidder_faction_id);if(e){alert("Failed to deduct from buyer: "+e.message);return}const g=Number(p?.corp_cash_reserves??0);var{error:r}=await b.from("factions").update({corp_cash_reserves:g+t.bid_amount}).eq("id",p.id);if(r){await b.from("factions").update({corp_cash_reserves:n}).eq("id",t.bidder_faction_id),alert("Failed to credit seller: "+r.message);return}p.corp_cash_reserves=g+t.bid_amount,await b.from("corp_properties").update({faction_id:t.bidder_faction_id}).eq("id",o.subsidiary_id);const a=C.filter(c=>c.nation_id===o.nation_id&&c.faction_id===p.id);for(const c of a)await b.from("corp_properties").update({faction_id:t.bidder_faction_id}).eq("id",c.id);await b.from("subsidiary_sales").update({status:"completed",completed_at_tick:d,accepted_bid_id:t.id}).eq("id",o.id),await b.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:d}).eq("id",t.id),await b.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:d}).eq("sale_id",o.id).neq("id",t.id),ae(p.corp_cash_reserves),alert("Sale complete! Received "+y(t.bid_amount)+`.

"`+o.subsidiary_name+'" has been transferred to the buyer.'),await re(),await be(),ve()}catch(d){console.error("[SubMarket] Accept bid error:",d),alert("Transfer failed: "+d.message)}finally{Se=!1}}}async function Pt(o){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:t}=await b.from("subsidiary_sales").update({status:"cancelled"}).eq("id",o);if(t){alert("Failed: "+t.message);return}await be(),ve()}function Ot(o){Xe(o,"dissolve")}async function et(o,t){if(A)return;const e=C.find(f=>f.id===o);if(!e)return;const r=Number(p?.corp_cash_reserves??0),d=Number(e.sub_cash||0),i=t?"WITHDRAW":"INJECT CAPITAL";if(t&&d<=0){alert("This subsidiary has no cash to withdraw.");return}const n=t?d:r,g=prompt(i+(t?" from ":" into ")+e.name+`

Parent cash: `+y(r)+`
Subsidiary cash: `+y(d)+`

Enter amount (e.g., 5000000 or 5M):`);if(!g)return;const a=Et(g);if(!a||a<=0||isNaN(a)){alert("Invalid amount.");return}if(a>n){alert("Insufficient "+(t?"subsidiary":"parent")+" cash. Available: "+y(n));return}const c=t?r+a:r-a,m=t?d-a:d+a;if(confirm(i+" "+y(a)+(t?" from ":" into ")+e.name+`?

Parent: `+y(r)+" → "+y(c)+`
Subsidiary: `+y(d)+" → "+y(m))){A=!0;try{await Promise.all([b.from("factions").update({corp_cash_reserves:c}).eq("id",p.id),b.from("corp_properties").update({sub_cash:m}).eq("id",o)]),p.corp_cash_reserves=c,e.sub_cash=m,ae(c),se(),alert((t?"Withdrew ":"Injected ")+y(a)+(t?" from ":" into ")+e.name+".")}catch(f){alert("Failed: "+f.message)}finally{A=!1}}}function jt(o){et(o,!1)}function Dt(o){et(o,!0)}async function Ut(o){if(A)return;const t=C.find(x=>x.id===o);if(!t)return;const e=Qe(t);e.nation;const r=xe(t.nation_id),d=e.valuation,i=e.cash,n=e.reputation,g=e.subsector,a=Math.round(d*2.25),c=Math.round(n*.1),m=Math.round(n*.2),f=ue(),l=G.reduce((x,_)=>x+Number(p?.[_.factionKey]??0),0),s=Math.max(0,f-l),u=Number(p?.corp_cash_reserves??0);if(a>u){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+y(a)+`
Available cash: `+y(u));return}if(e.projects>0){alert("Cannot merge — subsidiary has "+e.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+t.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+y(a)+`
Subsidiary cash absorbed: `+y(i)+`
Net cost: `+y(a-i)+`

• `+r.length+` properties transferred to parent
• Subsidiary subsector "`+g+`" added to portfolio
• Workers hired to max capacity (+`+s.toLocaleString()+`)
• Reputation: +`+c+" or -"+m+" (from sub rep "+n+`)

This cannot be undone.`)){A=!0;try{const x=p.nation_id;if(r.length>0){const T=r.filter(v=>v.id!==t.id).map(v=>v.id);if(T.length===1){const{error:v}=await b.from("corp_properties").update({nation_id:x,type:"office"}).eq("id",T[0]);if(v)throw v}else if(T.length>1){const{error:v}=await b.from("corp_properties").update({nation_id:x,type:"office"}).in("id",T);if(v)throw v}const{error:U}=await b.from("corp_properties").update({nation_id:x,type:"office",sub_cash:0,subsector:null}).eq("id",t.id);if(U)throw U}const _=u-a+i,w=Number(p?.corp_general_workforce??0)+s,M=Math.random()>=.5?c:-m,S=Number(p?.standing??50),E=Math.max(0,Math.min(100,S+M)),{error:O}=await b.from("factions").update({corp_cash_reserves:_,corp_general_workforce:w,standing:E}).eq("id",p.id);if(O)throw O;p.corp_cash_reserves=_,p.corp_general_workforce=w,p.standing=E,ae(_),await re(),alert(`Merger complete!

"`+t.name+`" absorbed into your corporation.
Cost: `+y(a)+" | Cash absorbed: "+y(i)+`
Reputation `+(M>=0?"+":"")+M+" (now "+E+`)
Workers hired: +`+s.toLocaleString()+` general workforce
Properties: `+r.length+" transferred to parent")}catch(x){alert("Merge failed: "+x.message)}finally{A=!1}}}window.subDissolve=Ot;window.subInjectCapital=jt;window.subWithdraw=Dt;window.subMerge=Ut;window.subSell=At;window.subPutForSale=Tt;window.subPlaceBid=Bt;window.subViewBids=Rt;window.subCancelSale=Pt;window.selectSubsidiary=function(o){J=o,se()};let Q=[],oe={},R=null,ze=!1,V="",ie="",W="",D="";const tt={Construction:4,Finance:5,Shipping:4},Ft=["Construction","Shipping","Finance"],ot={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Shipping:[{id:"bulk_cargo",name:"Bulk Cargo",mod:0},{id:"container_freight",name:"Container Freight",mod:.2},{id:"specialized_transport",name:"Specialized Transport",mod:.35}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function qt(){const{data:o,error:t}=await b.from("nations").select("*").order("name");t&&console.warn("[Subsidiary] Failed to load nations:",t.message),Q=(o||[]).filter(r=>r.id!==p?.nation_id);const{data:e}=await b.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);oe={};for(const r of e||[])r.nation_id&&(oe[r.nation_id]=(oe[r.nation_id]||0)+1);W=p?.corp_sector||"",D=p?.corp_subsector||""}function nt(){const o=W||p?.corp_sector||"";return ot[o]||[{id:"general",name:o||"General",mod:0}]}function Ht(o){W=o;const t=ot[o];D=t?t[0].name:"",le()}function it(){const o=p?.corp_sector||"";return W===o?1:tt[W]||4}function Gt(){const t=nt().find(e=>e.name===D);return t?t.mod:0}function Me(o){const t=Number(o.standard_of_living??50);return Math.max(.5,Math.round(t/50*100)/100)}function at(o){const e=it(),r=1+Gt(),d=Me(o);return Math.round(Math.max(1e7,5e7*e*r*d))}function Vt(o){const t=oe[o]||0;return t<=1?{label:"HIGH",color:"#5c5"}:t<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function Wt(o){if(R=R===o?null:o,R){const t=Q.find(e=>e.id===R);V=(p?.faction_name||"Subsidiary")+" "+(t?.name||"")}else V="";le()}function Yt(o){D=o,le()}function Jt(o){V=o}function Kt(o){ie=o.toUpperCase().slice(0,4)}async function Qt(){if(ze||!R)return;const o=Q.find(n=>n.id===R);if(!o)return;const t=(V||"").trim(),e=(ie||"").trim();if(!t){alert("Please enter a corporation name for the subsidiary.");return}if(e.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(C.find(n=>n.nation_id===o.id&&n.role==="subsidiary")){alert("You already have a subsidiary in "+o.name);return}const d=at(o),i=Number(p?.corp_cash_reserves??0);if(d>i){alert("Insufficient cash. Entry cost: "+y(d)+", available: "+y(i));return}if(confirm("Establish subsidiary in "+o.name+`?

Name: `+t+" ("+e+`)
Subsector: `+(D||"General")+`
Entry cost: `+y(d)+`
Creates a Regional HQ (500 capacity)
Unlocks `+o.name+` for operations

Deducted from cash reserves.`)){ze=!0;try{const g=(await b.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,a=85+Math.floor(Math.random()*16),c=Math.round(d*.005),{error:m}=await b.from("corp_properties").insert({faction_id:p.id,nation_id:o.id,name:t,type:"regional_hq",role:"subsidiary",style:"Modern",capacity:500,purchase_price:d,monthly_maintenance:c,condition:a,city:o.capital||o.name,purchased_at_tick:g,is_active:!0,subsector:D||p?.corp_subsector||null});if(m)throw m;const f=Math.max(0,i-d);await b.from("factions").update({corp_cash_reserves:f}).eq("id",p.id),p.corp_cash_reserves=f,ae(f);const l=W||p?.corp_sector||"Unknown";try{await b.from("event_log").insert({nation_id:o.id,event_name:"New Subsidiary Established",category:"corporate",description_chosen:`${p.faction_name} has invested ${y(d)} to establish ${t}, a new ${l} corporation in ${o.name}.`,fired_at_tick:P?.current_tick||0})}catch{}try{const{data:s}=await b.from("nations").select("gdp_growth").eq("id",o.id).single();s&&await b.from("nations").update({gdp_growth:Math.min(100,Number(s.gdp_growth||50)+.2)}).eq("id",o.id)}catch{}R=null,V="",ie="",await re(),alert('Subsidiary "'+t+'" established in '+o.name+`!

Cost: `+y(d)+`
Regional HQ created with `+a+"% condition.")}catch(n){alert("Failed: "+n.message)}finally{ze=!1}}}function le(){const o=document.getElementById("create-subsidiary-container");if(!o)return;const t="'JetBrains Mono', monospace",e={bg:"var(--bg-card)",surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},r=p?.corp_sector||"General",d=p?.corp_subsector||"",i=nt(),n=i.find(v=>v.name===D)||i[0],g=new Set(C.filter(v=>v.role==="subsidiary").map(v=>v.nation_id)),a=Q.filter(v=>!g.has(v.id)),c=R?a.find(v=>v.id===R):null,m=V.trim().length>0&&ie.trim().length>=2&&c!==null,f=W||r,l=it();let s=`
    <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
        <div style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="display:flex;gap:3px;">
            ${Ft.map(v=>{const z=v===f,N=v===r,X=N?1:tt[v]||4,$e=N?e.greenBright:e.orange;return`<div onclick="subSetSector('${v}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${z?e.accent+"18":"transparent"};border:1px solid ${z?e.accent+"44":e.border};">
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${z?e.accentBright:e.dim}">${v}</div>
                    <div style="font-family:${t};font-size:7px;margin-top:2px;color:${$e}">${N?"PARENT · ×1":"×"+X+" COST"}</div>
                </div>`}).join("")}
        </div>
        ${l>1?`<div style="font-family:${t};font-size:7px;color:${e.orange};margin-top:4px;padding:3px 6px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">Cross-sector subsidiary: base cost ×${l}</div>`:""}
    </div>`,u=`
    <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
        <div style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${i.map(v=>{const z=v.name===D,N=v.name===d;return`<div onclick="subSetSubsector('${v.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${z?e.accent+"18":"transparent"};border:1px solid ${z?e.accent+"44":e.border};">
                    <div style="font-family:${t};font-size:8px;font-weight:700;color:${z?e.accentBright:e.dim}">${v.name}</div>
                    <div style="font-family:${t};font-size:7px;margin-top:2px;color:${N?e.greenBright:v.mod>0?e.orange:e.dim}">${N?"SAME — ±0%":v.mod>0?"+"+Math.round(v.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,x="";if(a.length===0)x=`<div style="padding:20px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">Subsidiaries in all available nations.</div>`;else for(const v of a){const z=v.id===R,N=Vt(v.id),X=oe[v.id]||0,$e=Math.round(Number(v.standard_of_living??50)),Re=Me(v);x+=`
            <div onclick="subSelectNation('${v.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${z?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${z?e.accent+"44":e.border};border-left:${z?"2px solid "+e.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${z?e.text:e.muted}">${v.name}</span>
                        <span style="font-family:${t};font-size:7px;font-weight:700;padding:0 4px;color:${N.color};background:${N.color}12;border:1px solid ${N.color}25;line-height:12px">${N.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${t};font-size:7px;color:${e.dim}">STD/LIVING: <span style="color:${e.muted}">${$e}</span></span>
                        <span style="font-family:${t};font-size:7px;color:${e.dim}">CORPS: <span style="color:${X>=4?e.red:X>=2?e.yellow:e.greenBright}">${X}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${Re>1?e.orange:e.greenBright}">×${Re.toFixed(2)}</div>
                </div>
            </div>`}let _=`
    <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(V||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(p?.faction_name||"Corp")+" "+(c?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${t};font-size:10px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(ie||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(p?.faction_name||"CORP").slice(0,2).toUpperCase()+(c?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${t};font-size:12px;font-weight:700;color:${e.gold};background:${e.card};border:1px solid ${e.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const h=[{rule:"Bid on projects in that nation",icon:"✓",color:e.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:e.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:e.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:e.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:e.gold},{rule:"Counts as domestic corporation",icon:"✓",color:e.greenBright},{rule:"Starting reputation: 25",icon:"●",color:e.muted}];let w=`
    <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
        <div style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${e.card};border:1px solid ${e.border};padding:6px 8px;">
            ${h.map((v,z)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${z<h.length-1?"border-bottom:1px solid "+e.border:""}">
                <span style="font-family:${t};font-size:9px;color:${v.color};width:12px;text-align:center">${v.icon}</span>
                <span style="font-size:9px;color:${e.muted}">${v.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const M=5e7,S=n.mod,E=c?Me(c):null,O=c?at(c):null,T=Math.round(M*l*(1+S));let U=`
    <div style="background:${e.bg};border:1px solid ${e.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${e.border};">
            <span style="font-family:${t};font-size:8px;color:${e.dim}">BASE</span>
            <span style="font-family:${t};font-size:9px;color:${e.muted}">${y(M)}</span>
        </div>
        ${l>1?`<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${e.border};">
            <span style="font-family:${t};font-size:8px;color:${e.dim}">SECTOR (${f})</span>
            <span style="font-family:${t};font-size:9px;font-weight:700;color:${e.orange}">×${l}</span>
        </div>`:""}
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${e.border};">
            <span style="font-family:${t};font-size:8px;color:${e.dim}">SUBSECTOR (${n.name})</span>
            <span style="font-family:${t};font-size:9px;color:${S===0?e.greenBright:e.orange}">${S===0?"±0%":"+"+Math.round(S*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${e.border};">
            <span style="font-family:${t};font-size:8px;color:${e.dim}">NATION (${c?c.name:"select below"})</span>
            <span style="font-family:${t};font-size:9px;color:${c?E>1?e.orange:e.greenBright:e.dim}">${c?"×"+E.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${t};font-size:9px;font-weight:700;color:${e.text}">TOTAL COST</span>
            <span style="font-family:${t};font-size:14px;font-weight:700;color:${e.gold}">${c?y(O):"~"+y(T)}</span>
        </div>
    </div>`;o.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.gold}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Create Subsidiary</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${s}
            ${u}
            <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                <div style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Nation</div>
                ${x}
            </div>
            ${_}
            ${w}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            ${U}
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">IMMEDIATE PAYMENT</span>
                <div onclick="subCreate()"
                    onmouseover="this.style.filter='brightness(1.2)';this.style.transform='scale(1.02)'"
                    onmouseout="this.style.filter='';this.style.transform=''"
                    onmousedown="this.style.transform='scale(0.97)'"
                    onmouseup="this.style.transform='scale(1.02)'"
                    style="padding:6px 22px;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${m?"#000":"#c8a832"};background:${m?e.gold:"rgba(200,168,50,0.08)"};border:1px solid ${m?e.gold:"rgba(200,168,50,0.3)"};cursor:pointer;opacity:${m?1:.7};transition:all 0.1s ease;user-select:none">CREATE SUBSIDIARY</div>
            </div>
        </div>
    </div>`}window.subSelectNation=Wt;window.subCreate=Qt;window.subSetName=Jt;window.subSetAbbr=Kt;window.subSetSector=Ht;window.subSetSubsector=Yt;let ne=[],H=0,me=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),L="ALL",q="REPUTATION";async function Xt(){ne=await xt()}function Zt(o){H=o,de()}function eo(o){L=o,H=0,de()}function to(o){q=o,H=0,de()}async function oo(o){if(!p||!P)return;const t=Number(p.corp_cash_reserves??0);if(t<5e5){alert("Insufficient cash. Need $500k.");return}const{error:e}=await b.from("factions").update({corp_cash_reserves:t-5e5}).eq("id",p.id);if(e){alert("Failed: "+e.message);return}p.corp_cash_reserves=t-5e5,me[o]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify(me));const{data:r}=await b.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",o).single();if(r){const d=ne.find(i=>i.id===o);if(d){Object.assign(d,r);const i=Number(r.corp_cash_reserves||0),n=Number(r.corp_loans||0);let g=0;try{const{data:a}=await b.from("finance_active_loans").select("principal, remaining_principal, finance_loan_requests!inner(request_type)").eq("lender_faction_id",o).in("status",["current","late","delinquent"]);g=Oe(a||[]).total}catch(a){console.warn("[corpInvestigate] receivable lookup failed:",a)}d.reputation=Math.round(Number(r.corp_reputation??50)),d.revenue=Math.round(i*.1),d.valuation=je({cash:i,loans:n,financeReceivables:g})}}de()}function de(){const o=document.getElementById("corporations-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},r={PUBLIC:{color:e.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:e.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:e.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},d=[...new Set(ne.map(s=>s.nation).filter(Boolean))];let i=[...ne];L!=="ALL"&&(i=i.filter(s=>s.nation===L)),q==="REPUTATION"?i.sort((s,u)=>(u.reputation||0)-(s.reputation||0)):q==="REVENUE"?i.sort((s,u)=>(u.revenue||0)-(s.revenue||0)):q==="VALUATION"&&i.sort((s,u)=>(u.valuation||0)-(s.valuation||0)),H>=i.length&&(H=0);const n=i[H]||null;P?.current_tick;const g=n&&!!me[n.id],a=n&&n.status==="PRIVATE"&&!g,c=n&&n.status==="STATE";let m="";i.length===0&&(m=`<div style="padding:30px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No corporations found.</div>`);for(let s=0;s<i.length;s++){const u=i[s],x=s===H,_=r[u.status]||r.PRIVATE,h=u.status==="PRIVATE"&&!me[u.id];m+=`
        <div onclick="corpSelect(${s})" style="display:flex;align-items:center;padding:7px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${x?e.accent:"transparent"};background:${x?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:42px;font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${u.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:11px;font-weight:600;color:${e.text};line-height:1.2">${u.faction_name}</div>
                <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:1px">${u._isSub?'<span style="color:#8a6aaa;">SUB</span> · ':""}${u.corp_subsector||u.corp_sector||"—"}</div>
            </div>
            <span style="width:62px"><span style="font-family:${t};font-size:8px;padding:1px 5px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(u.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:56px;font-family:${t};font-size:9px;font-weight:700;color:${h?e.dim:e.muted};text-align:right">${h?"—":y(u.revenue)}</span>
            <span style="width:34px;font-family:${t};font-size:10px;font-weight:700;color:${u.reputation>=70?e.greenBright:u.reputation>=40?e.accent:e.yellow};text-align:right">${u.reputation}</span>
            <span style="width:56px;font-family:${t};font-size:9px;color:${h?e.dim:e.muted};text-align:right">${h?"—":y(u.valuation)}</span>
            <span style="width:48px;text-align:center"><span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${_.color};background:${_.bg};border:1px solid ${_.border}">${u.status}</span></span>
        </div>`}let f="";if(n){const s=r[n.status]||r.PRIVATE,u=[...n._isSub?[{label:"Parent",value:n._parentName||"—",color:"#8a6aaa"}]:[],{label:"Sector",value:n.corp_sector||"—",color:e.text},{label:"Subsector",value:n.corp_subsector||"—",color:e.accent},{label:"Reputation",value:n.reputation+"/100",color:n.reputation>=70?e.greenBright:n.reputation>=40?e.accent:e.yellow},{label:"Revenue",value:a?"UNDISCLOSED":y(n.revenue),color:a?e.dim:e.greenBright},{label:"Cash Reserves",value:a?"UNDISCLOSED":y(n.corp_cash_reserves||0),color:a?e.dim:e.text},{label:"Market Valuation",value:a?"UNDISCLOSED":y(n.valuation),color:a?e.dim:e.gold}];f=`
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                <span style="font-family:${t};font-size:14px;font-weight:700;color:${e.gold}">${n.abbr}</span>
                <span style="font-size:14px;font-weight:700;color:${e.text}">${n.faction_name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-family:${t};font-size:8px;padding:2px 6px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(n.nation||"—").toUpperCase()}</span>
                <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${s.color};background:${s.bg};border:1px solid ${s.border}">${n.status}</span>
                ${n._isSub?`<span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:#8a6aaa;background:rgba(138,106,170,0.08);border:1px solid rgba(138,106,170,0.2)">SUBSIDIARY</span>`:""}
                ${n.isPlayer?`<span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${e.blue};background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2)">PLAYER</span>`:`<span style="font-family:${t};font-size:8px;color:${e.dim}">NPC</span>`}
            </div>
        </div>
        ${u.map(x=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${e.border};">
            <span style="font-family:${t};font-size:10px;color:${e.dim};text-transform:uppercase">${x.label}</span>
            <span style="font-family:${t};font-size:11px;font-weight:700;color:${x.value==="UNDISCLOSED"?e.dim:x.color};${x.value==="UNDISCLOSED"?"font-style:italic;":""}">${x.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${e.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${e.border}"><div style="width:${n.reputation}%;height:100%;background:${n.reputation>=70?e.greenBright:n.reputation>=40?e.accent:e.yellow}"></div></div>
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
                <div onclick="${a?`corpInvestigate('${n.id}')`:""}" style="flex:1;padding:5px 0;text-align:center;cursor:${a?"pointer":"default"};font-family:${t};font-size:8px;font-weight:700;color:${a?e.blue:g?e.greenBright:e.dim};border:1px solid ${a?e.blue+"44":g?e.greenBright+"44":e.border};opacity:${a?1:.3}">${g?"INVESTIGATED ✓":"INVESTIGATE — $500k"}</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;color:${e.accent};border:1px solid ${e.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${c?"not-allowed":"pointer"};font-family:${t};font-size:8px;font-weight:700;color:${c?e.dim:e.gold};border:1px solid ${c?e.border:e.gold+"44"};opacity:${c?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${c?"not-allowed":"pointer"};font-family:${t};font-size:8px;font-weight:700;color:${c?e.dim:e.orange};border:1px solid ${c?e.border:e.orange+"44"};opacity:${c?.3:1}">MERGER</div>
            </div>
            ${c?`<div style="margin-top:4px;font-family:${t};font-size:7px;color:${e.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else f=`<div style="padding:30px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">Select a corporation to view details.</div>`;const l=`
    <div style="padding:6px 16px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px;width:40px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${L==="ALL"?"#000":e.dim};background:${L==="ALL"?e.accent:"transparent"};border:1px solid ${L==="ALL"?e.accent:e.border}">ALL</span>
            ${d.map(s=>`<span onclick="corpFilterNation('${s}')" style="padding:3px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${L===s?"#000":e.dim};background:${L===s?e.accent:"transparent"};border:1px solid ${L===s?e.accent:e.border}">${s}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(s=>`<span onclick="corpSort('${s}')" style="padding:3px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${q===s?"#000":e.dim};background:${q===s?e.accent:"transparent"};border:1px solid ${q===s?e.accent:e.border}">${s}</span>`).join("")}
        </div>
    </div>`;o.innerHTML=`
    <div style="width:760px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${t};font-size:9px;color:${e.dim}">${ne.length} IN DATABASE</span>
        </div>
        ${l}
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
                <div style="flex:1;overflow:auto;">${m}</div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${f}
            </div>
        </div>
    </div>`}window.corpSelect=Zt;window.corpInvestigate=oo;window.corpFilterNation=eo;window.corpSort=to;window.hfSetChange=vt;window.hfReset=$t;window.hfConfirm=ht;async function no(){const{data:{user:o}}=await b.auth.getUser();if(!o){window.location.href="login.html";return}const t=new URLSearchParams(location.search).get("faction_id");if(t){const{data:i,error:n}=await b.from("factions").select("*").eq("id",t).single();n?console.warn("[Inspector] faction fetch failed:",n.message):i?.faction_type==="corporation"&&(p=i)}if(!p){const{data:i}=await b.from("factions").select("*").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`);Z=(i||[]).filter(g=>g.nation_id);const n=sessionStorage.getItem("active_faction_id");if(p=Z.find(g=>g.id===n)||Z.find(g=>g.faction_type==="corporation")||Z[0],!p){await b.auth.signOut(),window.location.href="login.html";return}if(p.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const[e,r]=await Promise.all([p.nation_id?b.from("nations").select("*").eq("id",p.nation_id).single():Promise.resolve({data:null}),b.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);e.data&&(k=e.data),P=r.data;const d=document.getElementById("corp-topbar-container");d&&rt(d,{faction:p,shard:P,activeTab:"expansion",allUserFactions:Z}),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",await Ee(),ye(),_t(),await Ae(),ge(),await qt(),await It(),le(),se(),await Xt(),de(),await be(),ve()}no();
