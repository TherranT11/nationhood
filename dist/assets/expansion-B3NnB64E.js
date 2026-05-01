import{_supabase as b}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{hfFmtBig as y,escapeHtml as A}from"./utils-A98FEun4.js";import{renderCorpTopBar as We}from"./corp-topbar-BVNorCyj.js";import{c as Qe,d as Ye}from"./corp-shipping-data-VcbUDQfr.js";import{b as Ne,c as Me}from"./corp-valuation-CXafACL8.js";import"./preload-helper-BXl3LOEh.js";let Ee=null,Ie=null,Ae=null,Te=[];function L(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Je(o){const t=String(o||"").trim().toLowerCase();return t==="amortized"||t==="amortising"||t==="amortizing"?"amortized":"flat"}function Ke(o){const t=String(o?.loan_funding_model||"").trim().toLowerCase();return t==="parent_corp"?"parent_corp":t==="subsidiary_cash"?"subsidiary_cash":null}async function Xe(o,t,e,r){Ee=o,Ie=t;const d=document.getElementById(e);if(!d)return;d.innerHTML='<div style="padding:16px;text-align:center;color:#4a4940;font-family:monospace;font-size:10px;">Loading dashboard...</div>';const[n,i]=await Promise.all([o.from("subsidiary_auto_rates").select("*").eq("subsidiary_id",r).maybeSingle(),o.from("subsidiary_auto_policies").select("*").eq("subsidiary_id",r).order("started_tick",{ascending:!1}).limit(50)]);n.error&&console.error("[SubDash] Rate fetch error:",n.error.message),i.error&&console.error("[SubDash] Policies fetch error:",i.error.message),Ae=n.data,Te=i.data||[],Be(d)}function Be(o){const t=Ae,e=Te,r=t?.service_type==="insurance",d=r?"#c84":"#5a8aaa",n=r?"Insurance":"Banking";if(!t){o.innerHTML=`
            <div class="csd-panel">
                <div class="csd-empty">
                    <div style="font-size:1.5rem;margin-bottom:8px;opacity:0.4;">${r?"🛡️":"🏦"}</div>
                    <div style="font-family:monospace;font-size:10px;color:#888;">Auto-rate not yet generated.</div>
                    <div style="font-family:monospace;font-size:8px;color:#4a4940;margin-top:4px;">Rates are generated automatically each tick based on national interest rates.</div>
                </div>
            </div>
        `;return}const i=e.filter(u=>u.status==="active"),m=Number(t.total_revenue??0),a=Number(t.total_claims??0),c=m-a,g=c>=0?"#5cb85c":"#d9534f",f=e.slice(0,20).map(u=>{const x=u.status==="active"?"#5cb85c":u.status==="defaulted"?"#d9534f":u.status==="repaid"?"#5a8aaa":"#666",$=Je(u.loan_interest_model||u.interest_model||u.loan_interest_type),h=Ke(u);return`
            <div class="csd-policy-row">
                <span class="csd-policy-status" style="color:${x};">●</span>
                <span class="csd-policy-type">${u.service_type==="insurance"?"INS":"LOAN"}</span>
                <span class="csd-policy-rate">${u.rate_at_issue}%</span>
                <span class="csd-policy-principal">${L(u.principal)}</span>
                <span class="csd-policy-payment">${L(u.monthly_payment)}/mo</span>
                <span class="csd-policy-paid">${L(u.total_paid)} paid</span>
                ${u.service_type==="loan"?`<span class="csd-policy-type" style="color:#8ab0c7;">${$==="amortized"?"AMORTIZED":"FLAT"}</span>`:""}
                ${u.service_type==="loan"&&h?`<span class="csd-policy-type" style="color:#b9a46a;">${h==="parent_corp"?"PARENT":"SUB CASH"}</span>`:""}
                <span class="csd-policy-badge" style="color:${x};border-color:${x}44;background:${x}0a;">${u.status.toUpperCase()}</span>
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
                    <div class="csd-rate-card-value" style="color:${g};">${L(c)}</div>
                    <div class="csd-rate-breakdown">
                        <span style="color:#5cb85c;">${L(m)} collected</span>
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
    `;const l=document.getElementById("csd-markup-slider"),s=document.getElementById("csd-markup-display");l&&s&&l.addEventListener("input",()=>{s.textContent=(l.value/10).toFixed(1)+"%"}),document.getElementById("csd-save-markup")?.addEventListener("click",async()=>{const u=Number(l?.value||0)/10,x=document.getElementById("csd-save-markup");x&&(x.disabled=!0,x.textContent="Saving...");try{const $=Ie.nation,h=Qe($,t.service_type,u),{error:w}=await Ee.from("subsidiary_auto_rates").update({markup:h.markup,effective_rate:h.effectiveRate,updated_at:new Date().toISOString()}).eq("id",t.id);if(w){console.error("[SubDash] Save markup failed:",w.message),alert("Failed to save markup.");return}t.markup=h.markup,t.effective_rate=h.effectiveRate,Be(o)}catch($){console.error("[SubDash] Save markup error:",$)}finally{x&&(x.disabled=!1,x.textContent="Save Markup")}})}const Ze=.02,Re=30,be=25,et=.05,ze=2e5,W=50,tt=.3,ot=1.7;function nt(o=W){const t=Number(o??W);return Math.max(tt,Math.min(ot,(t-W)/100+1))}function Le({subCash:o=0,gdpGrowth:t=50,parentReputation:e=W}={}){const r=Number(o||0),d=Number(t??50),n=be/100,i=nt(e),m=Math.max(0,r),a=(d-Re)/100,c=Math.round(m*Ze*(1+a)*n*i),g=Math.max(.1,1+(50-d)/100),f=Math.round(ze*g);let l=c-f;const s=Math.max(ze,Math.round(Math.abs(r)*et));return l<0&&(l=Math.max(l,-s)),{investmentReturn:c,overhead:f,maxLoss:s,netDelta:l,gdp:d,gdpMod:a,overheadMult:g,parentRepMult:i,parentReputation:Number(e??W)}}async function it(){const[o,t]=await Promise.all([b.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_loans, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),b.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, sub_cash, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("role","subsidiary").eq("is_active",!0)]),e={};for(const l of o.data||[])e[l.id]=l;const r=(o.data||[]).map(l=>l.id).filter(Boolean),d={};if(r.length){const{data:l}=await b.from("finance_active_loans").select("lender_faction_id, principal, remaining_principal, finance_loan_requests!inner(request_type)").in("lender_faction_id",r).in("status",["current","late","delinquent"]);for(const s of l||[]){const u=s.lender_faction_id;(d[u]||=[]).push(s)}}const n=(o.data||[]).map(l=>{const s=(l.corp_company_type||"Private").toUpperCase(),u=Number(l.corp_cash_reserves||0),x=Number(l.corp_loans||0),$=Ne(d[l.id]||[]).total;return{...l,abbr:l.corp_ticker||l.abbreviation||l.faction_name?.slice(0,4).toUpperCase()||"???",status:s,isPlayer:!!l.linked_user_id,reputation:Math.round(Number(l.corp_reputation??50)),revenue:Math.round(u*.1),valuation:Me({cash:u,loans:x,financeReceivables:$}),_isSub:!1}}),{data:i}=await b.from("nations").select("id, name, gdp_growth"),m={},a={};(i||[]).forEach(l=>{m[l.id]=l.name,a[l.id]=Number(l.gdp_growth??50)});const c=[...new Set((t.data||[]).map(l=>l.faction_id).filter(Boolean))],g=[...new Set((t.data||[]).map(l=>l.nation_id).filter(Boolean))],f={};if(c.length&&g.length){const{data:l,error:s}=await b.from("corp_properties").select("faction_id, nation_id, purchase_price, capacity").in("faction_id",c).in("nation_id",g).eq("is_active",!0);s&&console.warn("[loadAllCorporations] subsidiary props fetch failed:",s.message);for(const u of l||[]){const x=`${u.faction_id}|${u.nation_id}`;(f[x]||=[]).push(u)}}for(const l of t.data||[]){const s=e[l.faction_id];if(!s)continue;const u=(s.corp_company_type||"Private").toUpperCase(),x=Number(l.sub_cash??0),$=a[l.nation_id]??50,w=(f[`${l.faction_id}|${l.nation_id}`]||[]).reduce((B,E)=>B+Number(E.purchase_price||0),0),C=Le({subCash:x,gdpGrowth:$,parentReputation:Number(s.corp_reputation??50)});n.push({id:l.id,faction_name:l.name||"Subsidiary",abbreviation:s.abbreviation,corp_sector:s.corp_sector,corp_subsector:l.subsector||s.corp_subsector,corp_ticker:s.corp_ticker,corp_cash_reserves:x,nation_id:l.nation_id,nation:m[l.nation_id]||"?",abbr:(s.corp_ticker||s.abbreviation||"??").slice(0,4),status:u,isPlayer:!!s.linked_user_id,reputation:be,revenue:C.netDelta,valuation:w,_isSub:!0,_parentName:s.faction_name})}return n}let G=[],p=null,_=null,T=null,at=[],z={general:0,skilled:0,innovative:0},pe=!1;const j=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Pe(o){const t=Number(_?.minimum_wage??50),e=Number(_?.inflation??50),r=Number(_?.standard_of_living??50),d=t/100*48e3,n=1+(e-50)/100*.5,i=1+(r-50)/100*.5;return Math.round(d*o*n*i)}function ae(){return k.reduce((t,e)=>{const r=Number(e.capacity||0),d=Number(e.condition||0)/100;return t+Math.floor(r*d)},0)+500}function rt(o,t){const e=j.find(n=>n.id===o),r=Number(p?.[e.factionKey]??0),d=z[o]+t;if(!(r+d<0)){if(t>0){const n=j.reduce((m,a)=>{const c=Number(p?.[a.factionKey]??0),g=a.id===o?d:z[a.id];return m+c+g},0),i=ae();if(n>i)return}z[o]=d,re()}}function st(o){o?z[o]=0:z={general:0,skilled:0,innovative:0},re()}async function lt(){if(pe||!Object.values(z).some(i=>i!==0))return;let t=0;for(const i of j){const m=z[i.id];m>0&&(t+=m*Pe(i.multiplier)*.1)}const e=Number(p?.corp_cash_reserves??0);if(t>e){alert("Insufficient cash reserves. Hiring cost: "+y(t)+", available: "+y(e));return}const r=j.reduce((i,m)=>i+Number(p?.[m.factionKey]??0)+z[m.id],0),d=ae();if(r>d){alert("Cannot hire beyond property capacity ("+d.toLocaleString()+"). You need more workplaces.");return}const n=t>0?`Confirm workforce changes?

Hiring fee: `+y(t)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(n)){pe=!0;try{const i={};for(const c of j){const g=Number(p?.[c.factionKey]??0);i[c.factionKey]=Math.max(0,g+z[c.id])}t>0&&(i.corp_cash_reserves=Math.max(0,e-Math.round(t)));const{error:m}=await b.from("factions").update(i).eq("id",p.id);if(m)throw m;Object.assign(p,i),z={general:0,skilled:0,innovative:0};const a=document.getElementById("topbar-cash");if(a){const c=Number(p.corp_cash_reserves??0);a.textContent="CASH: "+(c>=1e6?"$"+(c/1e6).toFixed(1)+"M":"$"+Math.round(c/1e3)+"k")}re()}catch(i){alert("Error: "+i.message)}finally{pe=!1}}}function re(){const o=document.getElementById("hf-card-container");if(!o)return;const t="'JetBrains Mono', monospace",e={bg:"var(--bg-card)",surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"};Number(_?.minimum_wage??50);const r=Number(_?.inflation??50),d=Number(_?.standard_of_living??50),n=(1+(r-50)/100*.5).toFixed(2),i=(1+(d-50)/100*.5).toFixed(2),m=_?.name||p?.nation||"Nation",a=Object.values(z).some($=>$!==0),c=ae();let g=0,f=0,l=0,s=0,u="";for(const $ of j){const h=Number(p?.[$.factionKey]??0),w=z[$.id],C=h+w,B=Pe($.multiplier),E=w>0,V=h*B,R=C*B,D=R-V;g+=h,f+=C,l+=V,s+=R;const N=w!==0?E?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";u+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${N};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${$.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${e.text}">${$.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.text}">${h.toLocaleString()}</span>
                    ${w!==0?`<span style="font-family:${t};font-size:10px;color:${e.dim}">→</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${E?e.greenBright:e.red}">${C.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">WAGE (MIN × ${$.multiplier}.0 × ${n} × ${i})</span>
                <span style="font-family:${t};font-size:10px;color:${$.color}">${y(B)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${$.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.red};border:1px solid ${e.border};cursor:pointer;background:${e.card}">-50</div>
                <div onclick="hfSetChange('${$.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.redDim};border:1px solid ${e.border};cursor:pointer;background:${e.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${w!==0?e.card:"transparent"};border:1px solid ${w!==0?e.border:"transparent"}">
                    ${w!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${t};font-size:12px;font-weight:700;color:${E?e.greenBright:e.red}">${E?"+":""}${w}</span>
                        <span onclick="hfReset('${$.id}')" style="font-family:${t};font-size:8px;color:${e.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${t};font-size:9px;color:${e.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${$.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.greenBright};border:1px solid ${e.border};cursor:pointer;background:${e.card}">+10</div>
                <div onclick="hfSetChange('${$.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.greenBright};border:1px solid ${e.border};cursor:pointer;background:${e.card}">+50</div>
            </div>
            ${w!==0?`<div style="margin-top:6px;padding:4px 8px;background:${e.bg};border:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${D>0?e.red:e.greenBright}">${D>0?"+":""}${y(D)}/yr</span>
            </div>`:""}
        </div>`}const x=s-l;o.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${m.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1.5px;color:${e.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${d}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">×${i}</div>
                    </div>
                </div>
            </div>
            ${u}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${a?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${g>=c?e.red:e.text}">${a?f.toLocaleString():g.toLocaleString()}</span>
                        <span style="font-family:${t};font-size:9px;color:${e.dim}">/ ${c.toLocaleString()}</span>
                    </div>
                    ${g>=c&&!a?`<div style="font-family:${t};font-size:7px;color:${e.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${y(l)}</span>
                        ${a?`<span style="font-family:${t};font-size:9px;color:${e.dim}">→</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${x>0?e.red:e.greenBright}">${y(s)}</span>`:""}
                    </div>
                </div>
            </div>
            ${a?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${e.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">NET CHANGE</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${x>0?e.red:e.greenBright}">${x>0?"+":""}${y(x)}/yr</span>
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">(${x>0?"+":""}${y(Math.round(x/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function dt(){const o=document.getElementById("wf-summary-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},r=(_?.name||p?.nation||"Nation").toUpperCase(),d=Number(_?.minimum_wage??50),n=Number(_?.inflation??50),i=Number(_?.standard_of_living??50),m=d/100*48e3,a=1+(n-50)/100*.5,c=1+(i-50)/100*.5,g=[{label:"General Workforce",mult:2,color:e.accent,key:"corp_general_workforce",countColor:e.text},{label:"Skilled Workforce",mult:3,color:e.gold,key:"corp_skilled_workforce",countColor:e.blue},{label:"Innovative Workforce",mult:6,color:e.orange,key:"corp_innovative_workforce",countColor:e.gold}];let f=0,l=0,s="";for(const u of g){const x=Number(p?.[u.key]??0),$=Math.round(m*u.mult*a*c),h=x*$;f+=x,l+=h,s+=`
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
                <span style="font-family:${t};font-size:10px;color:${e.muted}">${y($)}/yr</span>
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
    </div>`}let k=[];async function ve(){if(!p?.id)return;const{data:o}=await b.from("corp_properties").select("*").eq("faction_id",p.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});k=o||[]}function $e(){const o=document.getElementById("property-card-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},r=(_?.name||p?.nation||"Nation").toUpperCase();let d="",n=0,i=0;const m=_?.name||p?.nation||"Home Nation",a=5e7,c=1,g=.8+Number(_?.control??50)/100*.4,f=Math.round(a*c*g),l=Math.round(f*.005);n+=f,i+=l,d+=`
    <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;font-weight:600;color:${e.text}">National Headquarters</span>
            <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:#5c5;background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">HQ</span>
        </div>
        <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px;">${m} · Headquarters</div>
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
    </div>`;for(const s of k){const u=oe[s.style]||oe.Basic;n+=Number(s.purchase_price||0),i+=Number(s.monthly_maintenance||0),d+=`
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
            <span style="font-family:${t};font-size:10px;color:${e.muted}">${k.length+1} ASSET${k.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${d}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.green}">${y(n)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${y(i)}/mo</span>
            </div>
        </div>
    </div>`}let F=[],M=null;const oe={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function he(){if(!p?.nation_id)return;const{data:o,error:t}=await b.from("available_properties").select("*, property_catalog:catalog_id(subsector_lock)").eq("nation_id",p.nation_id).eq("status","available").order("price",{ascending:!0});if(t){console.warn("[Property] Failed to load marketplace:",t.message);return}const e=p?.corp_sector==="Construction",r=(p?.corp_subsector||"").toLowerCase();F=(o||[]).filter(d=>e||d.type!=="warehouse").filter(d=>{const n=d.property_catalog?.subsector_lock;return!n||n===r}).map(d=>({...d,adjusted_cost:d.price,adjusted_maintenance:d.monthly_maintenance}))}function se(){const o=document.getElementById("new-property-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"};(_?.name||p?.nation||"Nation").toUpperCase();const r=Number(_?.standard_of_living??50),d=Number(_?.gdp_growth??50),n=_?.capital||"Capital",i={capital:n,port:n+" Port",industrial:n+" Industrial Zone",suburban:n+" Suburbs",coastal:n+" Coast"};let m="";if(F.length===0)m=`<div style="padding:20px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let a=0;a<F.length;a++){const c=F[a],g=M===a,f=oe[c.style]||oe.Basic,l=i[c.city_template]||n;m+=`
            <div onclick="npSelect(${a})" style="padding:8px 14px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${g?e.accent:"transparent"};background:${g?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${e.text}">${c.name}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${f.color};background:${f.color}12;border:1px solid ${f.color}25">${f.label}</span>
                </div>
                <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:5px;">${l} · ${c.type.replace(/_/g," ")}</div>
                <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">CAPACITY</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.text};margin-top:1px">${c.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">PRICE</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.gold};margin-top:1px">${y(c.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.redDim};margin-top:1px">${y(c.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${g?`<div style="margin-top:5px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:${t};font-size:7px;color:${e.dim}">CONDITION</span>
                        <span style="font-family:${t};font-size:9px;color:${c.condition>=75?e.greenBright:c.condition>=50?e.yellow:e.orange}">${c.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${c.condition}%;height:100%;background:${c.condition>=75?e.greenBright:c.condition>=50?e.yellow:e.orange}"></div></div>
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
        </div>
        <div style="flex:1;overflow:auto;">
            ${m}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold};border:1px solid ${e.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${M!==null?"#000":e.dim};background:${M!==null?e.accent:"transparent"};border:1px solid ${M!==null?e.accent:e.border};cursor:${M!==null?"pointer":"default"};opacity:${M!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function ct(o){M=M===o?null:o,se()}let fe=!1;async function pt(){if(M===null||fe)return;const o=F[M];if(!o)return;const t=Number(p?.corp_cash_reserves??0);if(o.adjusted_cost>t){alert(`Insufficient cash reserves.
Property: `+y(o.adjusted_cost)+`
Cash: `+y(t));return}if(confirm('Buy "'+o.name+'" for '+y(o.adjusted_cost)+`?

Monthly maintenance: `+y(o.adjusted_maintenance)+`/mo
Condition: `+o.condition+`%

This will be deducted from your cash reserves.`)){fe=!0;try{const{error:e}=await b.from("corp_properties").insert({faction_id:p.id,nation_id:p.nation_id,catalog_id:o.catalog_id||null,name:o.name,type:o.type,role:o.type,style:o.style,capacity:o.capacity,purchase_price:o.adjusted_cost,monthly_maintenance:o.adjusted_maintenance,condition:o.condition,city:o.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(e)throw e;const r=Math.max(0,t-o.adjusted_cost),{error:d}=await b.from("factions").update({corp_cash_reserves:r}).eq("id",p.id);if(d)throw d;p.corp_cash_reserves=r,o.id&&await b.from("available_properties").update({status:"sold",purchased_by:p.id}).eq("id",o.id);const n=document.getElementById("topbar-cash");n&&(n.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),M=null,await he(),se(),$e(),alert("Property purchased: "+o.name+`

Deducted: `+y(o.adjusted_cost))}catch(e){alert("Purchase failed: "+e.message)}finally{fe=!1}}}const U={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let _e=!1,v={name:"",type:"Office Building",size:2e3,style:"Modern",nationId:null,nationName:null},ue=!1,xe=[];function Oe(){const t=1+(Number(_?.inflation??50)-50)/100*.3,e=U[v.style]?.costMod||1,r=v.type==="Warehouse"?.75:1,d=Math.round(v.size*1e5*t*e*r),n=Math.round(d*.007*(U[v.style]?.maintMod||1));return{total:d,maint:n,inflMod:t,styleMod:e}}async function ft(){_e=!0;const o=p?.nation_id,t=_?.name||p?.nation||"Home Nation";v={name:"",type:"Office Building",size:2e3,style:"Modern",nationId:o,nationName:t},xe=[{id:o,name:t,label:"National HQ"}];try{const{data:e}=await b.from("corp_properties").select("nation_id, name, nations!nation_id(name)").eq("faction_id",p.id).eq("type","regional_hq").eq("is_active",!0);for(const r of e||[])r.nation_id!==o&&xe.push({id:r.nation_id,name:r.nations?.name||"Unknown",label:r.name||"Regional HQ"})}catch{}je()}function we(){_e=!1,document.getElementById("cp-modal-overlay")?.remove()}function ut(o,t){v[o]=t,je()}async function mt(){if(!(ue||!v.name.trim())){if(!v.nationId){alert("Select a location.");return}ue=!0;try{const o=Oe(),t=v.nationId,e=v.nationName||"Unknown",r=U[v.style]?.repGain||1,d=await b.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),n=d.data?.current_tick||0,i=(d.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:m}=await b.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",t).eq("issuer_type","PRIVATE"),c=`PVT-C${(m||0)+1}-${i}`,{error:g}=await b.from("construction_contracts").insert({nation_id:t,template_key:"custom_building",sector:"civil_engineering",name:v.name.trim(),project_type:v.type,project_subtype:v.style,description:`${v.type} (${v.style}) — ${v.size.toLocaleString()} employees, commissioned by ${p.faction_name}`,project_code:c,budget_ceiling:o.total,timeline_ticks:Math.max(4,Math.ceil(v.size/2e3)+2),required_materials:(()=>{const f=v.size/1e3,l=v.style,s={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[l]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(x,$)=>Math.max(1,Math.ceil(f*x*$));return{concrete:u(8,s.concrete),steel:u(6,s.steel),glass_facades:u(3,s.glass),em_systems:u(4,s.em),lumber:u(1,s.lumber),heavy_parts:u(2,s.heavy),aggregate:u(3,s.agg)}})(),required_equipment:(()=>{const f=v.size,l={trucks:Math.ceil(f/2e3)+1,mixers:Math.ceil(f/3e3)+1};return f>1e3&&(l.excavators=Math.ceil(f/3e3)+1,l.cranes=Math.ceil(f/4e3)+1),f>3e3&&(l.bulldozers=Math.ceil(f/4e3)+1,l.haulers=Math.ceil(f/5e3)+1),f>8e3&&(l.pile_drivers=Math.ceil(f/6e3)+1),l})(),required_workforce:{general:Math.ceil(v.size*.08),skilled:Math.ceil(v.size*.03)},status:"open",generated_at_tick:n,bidding_ends_tick:n+3,issuer_type:"PRIVATE",issuer_name:p.faction_name,issuer_faction_id:p.id});if(g)throw g;we(),alert(`Construction project submitted!

Project: `+v.name.trim()+`
Code: `+c+`
Budget: `+y(o.total)+`
Expected Reputation: +`+Math.ceil(o.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+e+" can now bid on this project.")}catch(o){alert("Failed to submit project: "+o.message)}finally{ue=!1}}}function je(){if(document.getElementById("cp-modal-overlay")?.remove(),!_e)return;const o="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},e=Oe(),r=Math.ceil(e.total/1e8*3),d=r>=4?t.gold:r>=3?t.greenBright:r>=2?t.accent:t.dim,n=Object.entries(U).map(([a,c])=>{const g=v.style===a;return`<div onclick="cpSetField('style','${a}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${g?c.color+"18":"transparent"};border:1px solid ${g?c.color+"44":t.border};">
            <div style="font-family:${o};font-size:9px;font-weight:700;color:${g?c.color:t.dim}">${a}</div>
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
                    ${xe.map(a=>`<option value="${a.id}" ${v.nationId===a.id?"selected":""}>${a.name} (${a.label})</option>`).join("")}
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
                <div style="font-family:${o};font-size:18px;font-weight:700;color:${t.gold}">${y(e.total)}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="cpClose()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${t.gold};cursor:pointer;opacity:${v.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(i);const m=document.getElementById("cp-name-input");m&&m.addEventListener("input",a=>{v.name=a.target.value}),i.addEventListener("click",a=>{a.target===i&&we()})}function yt(){const o=document.getElementById("cp-name-input");if(o&&(v.name=o.value),!v.name.trim()){alert("Please enter a building name.");return}mt()}window.cpClose=we;window.cpSetField=ut;window.cpSubmitFromModal=yt;window.npSelect=ct;window.npBuyProperty=pt;window.npOpenConstructionModal=ft;let me=!1;async function gt(o){if(me)return;const t=k.find(n=>n.id===o);if(!t)return;const e=1+(Number(_?.inflation??50)-50)/100*.3,r=(t.condition||50)/100,d=Math.round((t.purchase_price||0)*.6*r*e);if(confirm('Sell "'+t.name+`"?

Sale value: `+y(d)+" (60% × "+t.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){me=!0;try{await b.from("corp_properties").update({is_active:!1}).eq("id",o);const i=Number(p?.corp_cash_reserves??0)+d;await b.from("factions").update({corp_cash_reserves:i}).eq("id",p.id),p.corp_cash_reserves=i;const a=(await b.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await b.from("available_properties").insert({nation_id:p.nation_id,catalog_id:t.catalog_id||null,name:t.name,type:t.type,style:t.style,capacity:t.capacity,price:Math.round(d*1.1),monthly_maintenance:t.monthly_maintenance,condition:t.condition,city:t.city,generated_at_tick:a,expires_at_tick:a+6,status:"available"});const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(i>=1e6?"$"+(i/1e6).toFixed(1)+"M":"$"+Math.round(i/1e3)+"k")),await ve(),$e(),await he(),se(),alert('Sold "'+t.name+'" for '+y(d))}catch(n){alert("Sale failed: "+n.message)}finally{me=!1}}}window.propSell=gt;const Se={SALE:.8,DISSOLVE:.6};function xt(o){if(!o)return 0;const t=o.trim().replace(/[$,]/g,""),e=t.match(/^([\d.]+)\s*[Mm]$/),r=t.match(/^([\d.]+)\s*[Kk]$/);return Math.round(e?parseFloat(e[1])*1e6:r?parseFloat(r[1])*1e3:parseFloat(t))}function H(o){const t=document.getElementById("topbar-cash");t&&(t.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k"))}function De(o){return X.find(t=>t.id===o)?.name||"—"}function le(o){return k.filter(t=>t.nation_id===o)}async function J(){q=0,await ve(),$e(),K(),Ge()}let S=!1,q=0,ee={};async function bt(){if(p?.id)try{const{data:o}=await b.from("construction_contracts").select("nation_id").eq("awarded_to_faction",p.id).in("status",["in_progress","awarded"]);ee={};for(const t of o||[])t.nation_id&&(ee[t.nation_id]=(ee[t.nation_id]||0)+1)}catch{}}function Fe(o){const t=le(o.nation_id),e=t.reduce((l,s)=>l+Number(s.purchase_price||0),0),r=t.reduce((l,s)=>l+Number(s.capacity||0),0),d=ee[o.nation_id]||0,n=X.find(l=>l.id===o.nation_id),i=(o.name||"").trim().split(/\s+/),m=i.length>=2?i.map(l=>l[0]).join("").toUpperCase().slice(0,4):(o.name||"SUB").slice(0,4).toUpperCase(),a=Number(o.sub_cash||0),c=Number(n?.gdp_growth??50),g=Le({subCash:a,gdpGrowth:c,parentReputation:Number(p?.corp_reputation??50)}),f=g.netDelta;return{id:o.id,name:o.name,abbr:m,nation:n?.name||o.city||"—",nationId:o.nation_id,sector:p?.corp_sector||"General",subsector:o.subsector||p?.corp_subsector||"—",revenue:f,debt:0,cash:a,reputation:be,valuation:e,workforce:r,projects:d,established:o.created_at?new Date(o.created_at).getFullYear().toString():"—",trend:f>0?"up":f<0?"down":c>=Re&&a>0?"flat":"down",profitable:f>0,projectedInvestmentReturn:g.investmentReturn,projectedOverhead:g.overhead,hqProp:o}}function K(){const o=document.getElementById("manage-subsidiaries-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},d=k.filter(g=>g.role==="subsidiary").map(Fe);q>=d.length&&(q=0);const n=d[q]||null;let i="";d.length===0&&(i=`<div style="padding:30px 14px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No legacy subsidiaries.<br>New expansions use Regional HQs (below).</div>`);let m=0,a=0;for(let g=0;g<d.length;g++){const f=d[g],l=g===q;m+=f.revenue,a+=f.valuation;const s=f.trend==="up"?e.greenBright:f.trend==="down"?e.red:e.dim,u=f.trend==="up"?"▲":f.trend==="down"?"▼":"–";i+=`
        <div onclick="selectSubsidiary(${g})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${l?e.accent:"transparent"};background:${l?"rgba(139,154,107,0.03)":"transparent"};">
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
        </div>`}let c="";if(n){const g=n.trend==="up"?e.greenBright:n.trend==="down"?e.red:e.dim,f=n.trend==="up"?"▲":n.trend==="down"?"▼":"–",l=n.trend==="up"?"Growing":n.trend==="down"?"Declining":"Stable",s=n.reputation>=40?e.accent:n.reputation>=25?e.yellow:e.orange,u=[{label:"Projected Revenue",value:y(n.revenue),color:n.profitable?e.greenBright:e.redDim},{label:"Projected Overhead",value:"-"+y(n.projectedOverhead),color:e.redDim},{label:"Projected Investment Return",value:"+"+y(n.projectedInvestmentReturn),color:e.greenBright},{label:"Cash",value:y(n.cash),color:e.text},{label:"Debt",value:n.debt>0?y(n.debt):"$0",color:n.debt>0?e.orange:e.dim},{label:"Reputation",value:n.reputation+"/100",color:s},{label:"Market Valuation",value:y(n.valuation),color:e.gold},{label:"Workforce",value:n.workforce.toLocaleString(),color:e.text},{label:"Active Projects",value:n.projects.toString(),color:n.projects>0?e.text:e.dim}],x=n.projects===0,$=n.hqProp?.logo_url?`<img src="${A(n.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${e.card};border:1px dashed ${e.border};border-radius:4px;cursor:pointer;font-size:14px;color:${e.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${n.hqProp?.id||""}" style="display:none;"></label>`;c=`
            <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    ${$}
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${t};font-size:12px;font-weight:700;color:${e.gold}">${n.abbr}</span>
                            <span style="font-size:12px;font-weight:700;color:${e.text}">${n.name}</span>
                        </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${t};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n.nation.toUpperCase()}</span>
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">Est. ${n.established}</span>
                    <span style="font-family:${t};font-size:8px;color:${g}">${f} ${l}</span>
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
                <div style="width:100%;height:4px;background:${e.border}"><div style="width:${n.reputation}%;height:100%;background:${s}"></div></div>
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
                    <div onclick="${x?"subDissolve('"+n.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${x?e.red:e.dim};border:1px solid ${x?e.red:e.border};opacity:${x?1:.3}">DISSOLVE</div>
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
                    <span style="width:55px;font-family:${t};font-size:9px;font-weight:700;color:${e.text};text-align:right">${y(m)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${t};font-size:9px;font-weight:700;color:${e.text};text-align:right">${y(a)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${c}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async g=>{const f=g.target.files?.[0],l=g.target.dataset.propId;if(!(!f||!l)){if(f.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const s=f.name.split(".").pop()?.toLowerCase()||"png",u=`party-logos/${p.id}/sub_${l}_${Date.now()}.${s}`,{error:x}=await b.storage.from("public-assets").upload(u,f,{contentType:f.type,upsert:!0});if(x)throw x;const{data:$}=b.storage.from("public-assets").getPublicUrl(u),h=$?.publicUrl;if(h){await b.from("corp_properties").update({logo_url:h}).eq("id",l);const w=k.find(C=>C.id===l);w&&(w.logo_url=h),K()}}catch(s){alert("Upload failed: "+(s.message||"Error"))}}}),n&&(n.subsector==="Insurance"||n.subsector==="Banking")){const g="sub-dashboard-"+n.id;setTimeout(()=>{document.getElementById(g)&&Xe(b,{faction:p,nation:_,shard:T},g,n.id).catch(f=>console.error("[SubDash] Init failed:",f))},50)}}async function qe(o,t){if(S)return;const e=k.find(s=>s.id===o);if(!e)return;const r=t==="sell",d=r?Se.SALE:Se.DISSOLVE,n=r?"SELL":"DISSOLVE",i=r?"sold":"dissolved",m=r?"80%":"60%",a=De(e.nation_id),c=le(e.nation_id),g=c.reduce((s,u)=>s+Math.round((u.purchase_price||0)*d*(u.condition||50)/100),0),f=Number(e.sub_cash||0),l=g+f;if(confirm(n+' subsidiary "'+e.name+`"?

`+c.length+" properties at "+m+` × condition:
  Property value: `+y(g)+`
  Subsidiary cash: `+y(f)+`
  ─────────────────
  Total return: `+y(l)+`

All operations in `+a+` cease.
This cannot be undone.`)){S=!0;try{const s=c.map(x=>x.id);if(s.length===1){const{error:x}=await b.from("corp_properties").update({is_active:!1}).eq("id",s[0]);if(x)throw x}else if(s.length>1){const{error:x}=await b.from("corp_properties").update({is_active:!1}).in("id",s);if(x)throw x}await b.from("corp_properties").update({sub_cash:0}).eq("id",o).then(()=>{}).catch(()=>{});const u=Number(p?.corp_cash_reserves??0)+l;await b.from("factions").update({corp_cash_reserves:u}).eq("id",p.id),p.corp_cash_reserves=u,H(u),await J(),alert("Subsidiary "+i+". "+c.length+` properties liquidated.
Total received: `+y(l))}catch(s){alert("Failed: "+s.message)}finally{S=!1}}}function vt(o){qe(o,"sell")}async function $t(o){if(S)return;const t=k.find(m=>m.id===o);if(!t)return;const e=De(t.nation_id),d=le(t.nation_id).reduce((m,a)=>m+Math.round((a.purchase_price||0)*.8*(a.condition||50)/100),0),n=Number(t.sub_cash||0),i=Math.round(n*.05);if(confirm('PUT UP FOR SALE: "'+t.name+`"

Nation: `+e+`
Estimated Valuation: `+y(d)+`
Subsidiary Cash: `+y(n)+`
Subsector: `+(t.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){S=!0;try{const m=T?.current_tick||0,{data:a,error:c}=await b.from("subsidiary_sales").insert({subsidiary_id:o,seller_faction_id:p.id,nation_id:t.nation_id,subsidiary_name:t.name,subsector:t.subsector||null,valuation:d,monthly_revenue:i,sub_cash_at_listing:n,employee_count:t.capacity||0,status:"listed",listed_at_tick:m}).select("*").single();if(c){alert("Failed to list: "+c.message);return}alert('"'+t.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await J()}catch(m){alert("Failed: "+m.message)}finally{S=!1}}}let ne=[],Ue="ready",Q=null;async function de(){const o=await Ye(b);ne=o.listings,Ue=o.state,Q=o.error,Q&&console.error("[SubMarket] Load failed:",Q.message)}function ce(){let o=document.getElementById("sub-marketplace-card");o||(o=document.createElement("div"),o.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(o));const t=ne.filter(a=>a.seller_faction_id!==p?.id),e=ne.filter(a=>a.seller_faction_id===p?.id),r="'JetBrains Mono',monospace",d=getComputedStyle(document.body),n=(a,c)=>d.getPropertyValue(a).trim()||c,i={surface:n("--bg-2","var(--bg-card)"),card:n("--bg-3","#f0efeb"),border:n("--border-0","rgba(0,0,0,0.08)"),dim:n("--text-dim","#aaa"),muted:n("--text-muted","#888"),text:n("--text-primary","#333"),bright:n("--text-bright","#1a1a17"),orange:n("--orange","#d35400"),green:n("--green","#2d8a2d"),blue:n("--blue","#2874a6"),red:n("--red","#c0392b"),gold:n("--gold","#a88520")};let m=`<div style="width:760px;background:${i.surface};border:1px solid ${i.border};font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 14px;border-bottom:1px solid ${i.border};display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${i.orange};display:inline-block;"></span>
            <span style="font-family:${r};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${i.orange};text-transform:uppercase;">Subsidiary Marketplace</span>
            <span style="font-family:${r};font-size:9px;color:${i.dim};">${t.length} available</span>
        </div>`;if(e.length>0){m+=`<div style="padding:8px 14px;border-bottom:1px solid ${i.border};background:${i.card};">
            <div style="font-family:${r};font-size:8px;letter-spacing:1px;color:${i.gold};text-transform:uppercase;margin-bottom:6px;">YOUR LISTINGS</div>`;for(const a of e){const g=(a.subsidiary_bids||[]).filter(f=>f.status==="pending");m+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:${i.bright};">${A(a.subsidiary_name)}</span>
                    <span style="font-family:${r};font-size:8px;color:${i.dim};margin-left:6px;">${A(a.subsector||"")}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${r};font-size:9px;color:${g.length>0?i.green:i.dim};">${g.length} bid${g.length!==1?"s":""}</span>
                    ${g.length>0?`<span onclick="subViewBids('${a.id}')" style="font-family:${r};font-size:8px;font-weight:700;padding:3px 8px;color:${i.green};border:1px solid ${i.green}44;cursor:pointer;">VIEW BIDS</span>`:""}
                    <span onclick="subCancelSale('${a.id}')" style="font-family:${r};font-size:8px;font-weight:700;padding:3px 8px;color:${i.red};border:1px solid ${i.red}44;cursor:pointer;">CANCEL</span>
                </div>
            </div>`}m+="</div>"}if(Ue==="error")m+=`<div style="padding:24px 14px;text-align:center;font-family:${r};font-size:10px;color:${i.red};font-style:italic;">${A(Q&&Q.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(t.length===0)m+=`<div style="padding:24px 14px;text-align:center;font-family:${r};font-size:10px;color:${i.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const a of t){const c=(a.subsidiary_bids||[]).find(l=>l.bidder_faction_id===p?.id&&l.status==="pending"),f=(at||[]).find(l=>l.id===a.nation_id)?.name||"Unknown";m+=`<div style="padding:10px 14px;border-bottom:1px solid ${i.border};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:12px;font-weight:700;color:${i.bright};">${A(a.subsidiary_name)}</span>
                        <span style="font-family:${r};font-size:7px;font-weight:700;padding:1px 5px;color:${i.orange};border:1px solid ${i.orange}44;background:${i.orange}0a;">${A(a.subsector||"General")}</span>
                    </div>
                    <span style="font-family:${r};font-size:8px;color:${i.dim};">${A(f)}</span>
                </div>
                <div style="display:flex;gap:16px;font-family:${r};font-size:8px;color:${i.muted};margin-bottom:8px;">
                    <span>Valuation: <strong style="color:${i.text};">${y(a.valuation)}</strong></span>
                    <span>Revenue: <strong style="color:${i.text};">${y(a.monthly_revenue)}/mo</strong></span>
                    <span>Cash: <strong style="color:${i.text};">${y(a.sub_cash_at_listing)}</strong></span>
                    <span>Staff: <strong style="color:${i.text};">${a.employee_count}</strong></span>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    ${c?`<span style="font-family:${r};font-size:8px;font-weight:700;color:${i.green};">✓ BID PLACED: ${y(c.bid_amount)}</span>`:`<span onclick="subPlaceBid('${a.id}','${A(a.subsidiary_name)}',${a.valuation})" style="font-family:${r};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${i.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}m+="</div>",o.innerHTML=m}async function ht(o,t,e){const r=prompt('Place bid for "'+t+`"

Valuation: `+y(e)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!r)return;const d=Math.round(Number(r));if(isNaN(d)||d<1e6){alert("Minimum bid is $1,000,000.");return}const n=Number(p?.corp_cash_reserves??0);if(d>n){alert("Insufficient funds. You have "+y(n)+".");return}const{error:i}=await b.from("subsidiary_bids").insert({sale_id:o,bidder_faction_id:p.id,bid_amount:d,status:"pending",placed_at_tick:T?.current_tick||0});if(i){i.message.includes("duplicate")||i.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+i.message);return}alert("Bid of "+y(d)+' placed on "'+t+`".
The seller will review your bid.`),await de(),ce()}async function _t(o){const t=ne.find(l=>l.id===o);if(!t)return;const e=(t.subsidiary_bids||[]).filter(l=>l.status==="pending");if(e.length===0){alert("No pending bids.");return}const r=e.map(l=>l.bidder_faction_id),{data:d}=await b.from("factions").select("id, faction_name").in("id",r),n={};(d||[]).forEach(l=>{n[l.id]=l.faction_name});let i='Bids for "'+t.subsidiary_name+`":

`;const m=e.sort((l,s)=>s.bid_amount-l.bid_amount);for(let l=0;l<m.length;l++){const s=m[l];i+=l+1+". "+(n[s.bidder_faction_id]||"Unknown")+": "+y(s.bid_amount)+`
`}i+=`
Enter the number of the bid to accept (or cancel):`;const a=prompt(i);if(!a)return;const c=parseInt(a,10)-1;if(isNaN(c)||c<0||c>=m.length){alert("Invalid selection.");return}const g=m[c],f=n[g.bidder_faction_id]||"Unknown";confirm("Accept bid of "+y(g.bid_amount)+" from "+f+`?

This will transfer ownership of "`+t.subsidiary_name+`" to them.
You will receive `+y(g.bid_amount)+` in cash.

This cannot be undone.`)&&await wt(t,g)}let ye=!1;async function wt(o,t){if(!ye){ye=!0;try{const d=T?.current_tick||0,{data:n}=await b.from("factions").select("corp_cash_reserves").eq("id",t.bidder_faction_id).single(),i=Number(n?.corp_cash_reserves??0);if(i<t.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await b.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:d}).eq("id",t.id);return}var{error:e}=await b.from("factions").update({corp_cash_reserves:i-t.bid_amount}).eq("id",t.bidder_faction_id);if(e){alert("Failed to deduct from buyer: "+e.message);return}const m=Number(p?.corp_cash_reserves??0);var{error:r}=await b.from("factions").update({corp_cash_reserves:m+t.bid_amount}).eq("id",p.id);if(r){await b.from("factions").update({corp_cash_reserves:i}).eq("id",t.bidder_faction_id),alert("Failed to credit seller: "+r.message);return}p.corp_cash_reserves=m+t.bid_amount,await b.from("corp_properties").update({faction_id:t.bidder_faction_id}).eq("id",o.subsidiary_id);const a=k.filter(c=>c.nation_id===o.nation_id&&c.faction_id===p.id);for(const c of a)await b.from("corp_properties").update({faction_id:t.bidder_faction_id}).eq("id",c.id);await b.from("subsidiary_sales").update({status:"completed",completed_at_tick:d,accepted_bid_id:t.id}).eq("id",o.id),await b.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:d}).eq("id",t.id),await b.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:d}).eq("sale_id",o.id).neq("id",t.id),H(p.corp_cash_reserves),alert("Sale complete! Received "+y(t.bid_amount)+`.

"`+o.subsidiary_name+'" has been transferred to the buyer.'),await J(),await de(),ce()}catch(d){console.error("[SubMarket] Accept bid error:",d),alert("Transfer failed: "+d.message)}finally{ye=!1}}}async function kt(o){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:t}=await b.from("subsidiary_sales").update({status:"cancelled"}).eq("id",o);if(t){alert("Failed: "+t.message);return}await de(),ce()}function zt(o){qe(o,"dissolve")}async function He(o,t){if(S)return;const e=k.find(f=>f.id===o);if(!e)return;const r=Number(p?.corp_cash_reserves??0),d=Number(e.sub_cash||0),n=t?"WITHDRAW":"INJECT CAPITAL";if(t&&d<=0){alert("This subsidiary has no cash to withdraw.");return}const i=t?d:r,m=prompt(n+(t?" from ":" into ")+e.name+`

Parent cash: `+y(r)+`
Subsidiary cash: `+y(d)+`

Enter amount (e.g., 5000000 or 5M):`);if(!m)return;const a=xt(m);if(!a||a<=0||isNaN(a)){alert("Invalid amount.");return}if(a>i){alert("Insufficient "+(t?"subsidiary":"parent")+" cash. Available: "+y(i));return}const c=t?r+a:r-a,g=t?d-a:d+a;if(confirm(n+" "+y(a)+(t?" from ":" into ")+e.name+`?

Parent: `+y(r)+" → "+y(c)+`
Subsidiary: `+y(d)+" → "+y(g))){S=!0;try{await Promise.all([b.from("factions").update({corp_cash_reserves:c}).eq("id",p.id),b.from("corp_properties").update({sub_cash:g}).eq("id",o)]),p.corp_cash_reserves=c,e.sub_cash=g,H(c),K(),alert((t?"Withdrew ":"Injected ")+y(a)+(t?" from ":" into ")+e.name+".")}catch(f){alert("Failed: "+f.message)}finally{S=!1}}}function St(o){He(o,!1)}function Ct(o){He(o,!0)}async function Nt(o){if(S)return;const t=k.find(x=>x.id===o);if(!t)return;const e=Fe(t);e.nation;const r=le(t.nation_id),d=e.valuation,n=e.cash,i=e.reputation,m=e.subsector,a=Math.round(d*2.25),c=Math.round(i*.1),g=Math.round(i*.2),f=ae(),l=j.reduce((x,$)=>x+Number(p?.[$.factionKey]??0),0),s=Math.max(0,f-l),u=Number(p?.corp_cash_reserves??0);if(a>u){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+y(a)+`
Available cash: `+y(u));return}if(e.projects>0){alert("Cannot merge — subsidiary has "+e.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+t.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+y(a)+`
Subsidiary cash absorbed: `+y(n)+`
Net cost: `+y(a-n)+`

• `+r.length+` properties transferred to parent
• Subsidiary subsector "`+m+`" added to portfolio
• Workers hired to max capacity (+`+s.toLocaleString()+`)
• Reputation: +`+c+" or -"+g+" (from sub rep "+i+`)

This cannot be undone.`)){S=!0;try{const x=p.nation_id;if(r.length>0){const R=r.filter(N=>N.id!==t.id).map(N=>N.id);if(R.length===1){const{error:N}=await b.from("corp_properties").update({nation_id:x,type:"office"}).eq("id",R[0]);if(N)throw N}else if(R.length>1){const{error:N}=await b.from("corp_properties").update({nation_id:x,type:"office"}).in("id",R);if(N)throw N}const{error:D}=await b.from("corp_properties").update({nation_id:x,type:"office",sub_cash:0,subsector:null}).eq("id",t.id);if(D)throw D}const $=u-a+n,w=Number(p?.corp_general_workforce??0)+s,C=Math.random()>=.5?c:-g,B=Number(p?.standing??50),E=Math.max(0,Math.min(100,B+C)),{error:V}=await b.from("factions").update({corp_cash_reserves:$,corp_general_workforce:w,standing:E}).eq("id",p.id);if(V)throw V;p.corp_cash_reserves=$,p.corp_general_workforce=w,p.standing=E,H($),await J(),alert(`Merger complete!

"`+t.name+`" absorbed into your corporation.
Cost: `+y(a)+" | Cash absorbed: "+y(n)+`
Reputation `+(C>=0?"+":"")+C+" (now "+E+`)
Workers hired: +`+s.toLocaleString()+` general workforce
Properties: `+r.length+" transferred to parent")}catch(x){alert("Merge failed: "+x.message)}finally{S=!1}}}window.subDissolve=zt;window.subInjectCapital=St;window.subWithdraw=Ct;window.subMerge=Nt;window.subSell=vt;window.subPutForSale=$t;window.subPlaceBid=ht;window.subViewBids=_t;window.subCancelSale=kt;window.selectSubsidiary=function(o){q=o,K()};let X=[],ge=!1;async function Mt(){const{data:o,error:t}=await b.from("nations").select("*").order("name");t&&console.warn("[RegionalHQ] Failed to load nations:",t.message),X=(o||[]).filter(e=>e.id!==p?.nation_id)}const Ve=3e7,Ce=500;function ke(o){const t=Number(o?.standard_of_living??50);return Math.min(2,Math.max(.5,Math.round(t/50*100)/100))}function te(o){return Math.round(Ve*ke(o))}async function Et(o){if(ge)return;const t=X.find(n=>n.id===o);if(!t){alert("Nation not found.");return}if(k.some(n=>n.nation_id===o&&n.type==="regional_hq")){alert("You already have a Regional HQ in "+t.name+".");return}const r=te(t),d=Number(p?.corp_cash_reserves??0);if(r>d){alert("Insufficient cash. Cost: "+y(r)+", available: "+y(d));return}if(confirm("Build Regional HQ in "+t.name+`?

Cost: `+y(r)+" ("+Ve/1e6+"M base × "+ke(t).toFixed(2)+"x "+t.name+` SoL)
Capacity: `+Ce+`

The HQ becomes a standard property asset. You can sell it later from the Properties page (60% × condition resale).`)){ge=!0;try{const{data:n}=await b.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=n?.current_tick||0,m=85+Math.floor(Math.random()*16),a=Math.round(r*.005),c=(p.faction_name||"Corp")+" — "+t.name+" HQ",g=Math.max(0,d-r),{error:f}=await b.from("factions").update({corp_cash_reserves:g}).eq("id",p.id);if(f){alert("Failed to deduct cash: "+f.message);return}p.corp_cash_reserves=g,H(g);const{error:l}=await b.from("corp_properties").insert({faction_id:p.id,nation_id:t.id,name:c,type:"regional_hq",role:"regional_hq",style:"Modern",capacity:Ce,purchase_price:r,monthly_maintenance:a,condition:m,city:t.capital||t.name,purchased_at_tick:i,is_active:!0});if(l){await b.from("factions").update({corp_cash_reserves:d}).eq("id",p.id),p.corp_cash_reserves=d,H(d),alert("Failed to create property: "+l.message+`
Cash refunded.`);return}try{await b.from("event_log").insert({nation_id:t.id,event_name:"New Regional HQ Established",category:"corporate",description_chosen:`${p.faction_name} has invested ${y(r)} to build a Regional HQ in ${t.name}.`,fired_at_tick:i})}catch{}await J(),alert("Regional HQ built in "+t.name+`.

Cost: `+y(r)+`
Condition: `+m+"%")}catch(n){alert("Failed: "+n.message)}finally{ge=!1}}}window.buildRegionalHQ=Et;async function It(){alert("Subsidiary establishment has been replaced with Regional HQs. Pick a nation from the list below.")}function Ge(){const o=document.getElementById("create-subsidiary-container");if(!o)return;const t=Number(p?.corp_cash_reserves??0),e=new Set(k.filter(n=>n.type==="regional_hq").map(n=>n.nation_id)),d=X.slice().sort((n,i)=>te(n)-te(i)).map(n=>{const i=te(n),m=e.has(n.id),a=i<=t,c=Number(n.standard_of_living??50),g=ke(n),f=m?"OWNED":a?"BUILD":"INSUFFICIENT CASH",l=m||!a,s=l?"opacity:0.4;cursor:not-allowed;background:#3a3833;color:#7a7670;":"cursor:pointer;background:#5a9abf;color:#fff;",u=l?"":`onclick="buildRegionalHQ('${n.id}')"`;return`
            <div style="display:grid;grid-template-columns:1.5fr 0.7fr 0.7fr 1fr 0.9fr;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);">
                <div style="font-weight:600;color:var(--panel-text);">${A(n.name)}</div>
                <div style="color:#9e9a92;font-size:10px;">SoL ${Math.round(c)}</div>
                <div style="color:#9e9a92;font-size:10px;">×${g.toFixed(2)}</div>
                <div style="color:${a?"#a3b07e":"#c55"};font-weight:700;">${y(i)}</div>
                <div ${u} style="text-align:center;padding:6px 10px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px;${s}">${f}</div>
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
                <div style="font-size:10px;color:#9e9a92;margin-top:6px;">Cash on hand: <span style="color:#a3b07e;font-weight:700;">${y(t)}</span></div>
            </div>
            <div style="display:grid;grid-template-columns:1.5fr 0.7fr 0.7fr 1fr 0.9fr;gap:12px;padding:6px 12px;font-size:9px;letter-spacing:1px;color:#6a6660;border-bottom:1px solid var(--panel-border);">
                <div>NATION</div><div>SOL</div><div>MULT</div><div>COST</div><div></div>
            </div>
            ${d||'<div style="padding:20px;text-align:center;color:#6a6660;font-style:italic;">No nations available.</div>'}
        </div>
    `}window.subCreate=It;let Y=[],O=0,ie=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),I="ALL",P="REPUTATION";async function At(){Y=await it()}function Tt(o){O=o,Z()}function Bt(o){I=o,O=0,Z()}function Rt(o){P=o,O=0,Z()}async function Lt(o){if(!p||!T)return;const t=Number(p.corp_cash_reserves??0);if(t<5e5){alert("Insufficient cash. Need $500k.");return}const{error:e}=await b.from("factions").update({corp_cash_reserves:t-5e5}).eq("id",p.id);if(e){alert("Failed: "+e.message);return}p.corp_cash_reserves=t-5e5,ie[o]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify(ie));const{data:r}=await b.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",o).single();if(r){const d=Y.find(n=>n.id===o);if(d){Object.assign(d,r);const n=Number(r.corp_cash_reserves||0),i=Number(r.corp_loans||0);let m=0;try{const{data:a}=await b.from("finance_active_loans").select("principal, remaining_principal, finance_loan_requests!inner(request_type)").eq("lender_faction_id",o).in("status",["current","late","delinquent"]);m=Ne(a||[]).total}catch(a){console.warn("[corpInvestigate] receivable lookup failed:",a)}d.reputation=Math.round(Number(r.corp_reputation??50)),d.revenue=Math.round(n*.1),d.valuation=Me({cash:n,loans:i,financeReceivables:m})}}Z()}function Z(){const o=document.getElementById("corporations-container");if(!o)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},r={PUBLIC:{color:e.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:e.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:e.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},d=[...new Set(Y.map(s=>s.nation).filter(Boolean))];let n=[...Y];I!=="ALL"&&(n=n.filter(s=>s.nation===I)),P==="REPUTATION"?n.sort((s,u)=>(u.reputation||0)-(s.reputation||0)):P==="REVENUE"?n.sort((s,u)=>(u.revenue||0)-(s.revenue||0)):P==="VALUATION"&&n.sort((s,u)=>(u.valuation||0)-(s.valuation||0)),O>=n.length&&(O=0);const i=n[O]||null;T?.current_tick;const m=i&&!!ie[i.id],a=i&&i.status==="PRIVATE"&&!m,c=i&&i.status==="STATE";let g="";n.length===0&&(g=`<div style="padding:30px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No corporations found.</div>`);for(let s=0;s<n.length;s++){const u=n[s],x=s===O,$=r[u.status]||r.PRIVATE,h=u.status==="PRIVATE"&&!ie[u.id];g+=`
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
            <span style="width:48px;text-align:center"><span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${$.color};background:${$.bg};border:1px solid ${$.border}">${u.status}</span></span>
        </div>`}let f="";if(i){const s=r[i.status]||r.PRIVATE,u=[...i._isSub?[{label:"Parent",value:i._parentName||"—",color:"#8a6aaa"}]:[],{label:"Sector",value:i.corp_sector||"—",color:e.text},{label:"Subsector",value:i.corp_subsector||"—",color:e.accent},{label:"Reputation",value:i.reputation+"/100",color:i.reputation>=70?e.greenBright:i.reputation>=40?e.accent:e.yellow},{label:"Revenue",value:a?"UNDISCLOSED":y(i.revenue),color:a?e.dim:e.greenBright},{label:"Cash Reserves",value:a?"UNDISCLOSED":y(i.corp_cash_reserves||0),color:a?e.dim:e.text},{label:"Market Valuation",value:a?"UNDISCLOSED":y(i.valuation),color:a?e.dim:e.gold}];f=`
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                <span style="font-family:${t};font-size:14px;font-weight:700;color:${e.gold}">${i.abbr}</span>
                <span style="font-size:14px;font-weight:700;color:${e.text}">${i.faction_name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-family:${t};font-size:8px;padding:2px 6px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(i.nation||"—").toUpperCase()}</span>
                <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${s.color};background:${s.bg};border:1px solid ${s.border}">${i.status}</span>
                ${i._isSub?`<span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:#8a6aaa;background:rgba(138,106,170,0.08);border:1px solid rgba(138,106,170,0.2)">SUBSIDIARY</span>`:""}
                ${i.isPlayer?`<span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${e.blue};background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2)">PLAYER</span>`:`<span style="font-family:${t};font-size:8px;color:${e.dim}">NPC</span>`}
            </div>
        </div>
        ${u.map(x=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${e.border};">
            <span style="font-family:${t};font-size:10px;color:${e.dim};text-transform:uppercase">${x.label}</span>
            <span style="font-family:${t};font-size:11px;font-weight:700;color:${x.value==="UNDISCLOSED"?e.dim:x.color};${x.value==="UNDISCLOSED"?"font-style:italic;":""}">${x.value}</span>
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
                <div onclick="${a?`corpInvestigate('${i.id}')`:""}" style="flex:1;padding:5px 0;text-align:center;cursor:${a?"pointer":"default"};font-family:${t};font-size:8px;font-weight:700;color:${a?e.blue:m?e.greenBright:e.dim};border:1px solid ${a?e.blue+"44":m?e.greenBright+"44":e.border};opacity:${a?1:.3}">${m?"INVESTIGATED ✓":"INVESTIGATE — $500k"}</div>
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
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${I==="ALL"?"#000":e.dim};background:${I==="ALL"?e.accent:"transparent"};border:1px solid ${I==="ALL"?e.accent:e.border}">ALL</span>
            ${d.map(s=>`<span onclick="corpFilterNation('${s}')" style="padding:3px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${I===s?"#000":e.dim};background:${I===s?e.accent:"transparent"};border:1px solid ${I===s?e.accent:e.border}">${s}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(s=>`<span onclick="corpSort('${s}')" style="padding:3px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${P===s?"#000":e.dim};background:${P===s?e.accent:"transparent"};border:1px solid ${P===s?e.accent:e.border}">${s}</span>`).join("")}
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
                <div style="flex:1;overflow:auto;">${g}</div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${f}
            </div>
        </div>
    </div>`}window.corpSelect=Tt;window.corpInvestigate=Lt;window.corpFilterNation=Bt;window.corpSort=Rt;window.hfSetChange=rt;window.hfReset=st;window.hfConfirm=lt;async function Pt(){const{data:{user:o}}=await b.auth.getUser();if(!o){window.location.href="login.html";return}const t=new URLSearchParams(location.search).get("faction_id");if(t){const{data:n,error:i}=await b.from("factions").select("*").eq("id",t).single();i?console.warn("[Inspector] faction fetch failed:",i.message):n?.faction_type==="corporation"&&(p=n)}if(!p){const{data:n}=await b.from("factions").select("*").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`);G=(n||[]).filter(m=>m.nation_id);const i=sessionStorage.getItem("active_faction_id");if(p=G.find(m=>m.id===i)||G.find(m=>m.faction_type==="corporation")||G[0],!p){await b.auth.signOut(),window.location.href="login.html";return}if(p.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const[e,r]=await Promise.all([p.nation_id?b.from("nations").select("*").eq("id",p.nation_id).single():Promise.resolve({data:null}),b.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);e.data&&(_=e.data),T=r.data;const d=document.getElementById("corp-topbar-container");d&&We(d,{faction:p,shard:T,activeTab:"expansion",allUserFactions:G}),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",await ve(),re(),dt(),await he(),se(),await Mt(),await bt(),Ge(),K(),await At(),Z(),await de(),ce()}Pt();
