import{_ as C}from"./supabase-client-BXEzLDpS.js";import{t as et,e as E}from"./utils-C2W-HleY.js";let R=[],p=null,A=null;function r(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+Math.round(e).toLocaleString()}const at={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},ot={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}},y=[{type:"LOAN",applicant:"Salazar Construction",abbr:"SZC",entity:"CORP",nation:"Melizea",amount:18e6,purpose:"Equipment acquisition — Heavy Infrastructure expansion. 2 Tower Cranes, 3 Heavy Haulers.",term:24,reputation:65,revenue:474e5,debt:22e6,risk:"MODERATE",isNew:!0},{type:"BOND",applicant:"Republic of Melizea",abbr:"MEL",entity:"GOV",nation:"Melizea",amount:1e8,purpose:"National Infrastructure Bond — Series 2013-B. Funding highway and rail expansion over 5 years.",term:60,couponRate:6.2,stability:23,debtToGdp:42,creditRating:38,risk:"ELEVATED",isNew:!0},{type:"INSURE",applicant:"Constructora del Sur",abbr:"CDS",entity:"CORP",nation:"Melizea",amount:12e6,purpose:"Project liability insurance — San Maria Water Treatment Facility. Coverage for construction defects, delays, and third-party claims.",term:18,reputation:52,projectValue:285e5,risk:"MODERATE",isNew:!1},{type:"LOAN",applicant:"Torres & Vega Group",abbr:"TVG",entity:"CORP",nation:"Melizea",amount:5e6,purpose:"Working capital — bridge financing to cover material procurement pending contract payment.",term:6,reputation:34,revenue:148e5,debt:22e5,risk:"ELEVATED",isNew:!1},{type:"INSURE",applicant:"McKenna Construction",abbr:"MKAV",entity:"CORP",nation:"Avelia",amount:8e6,purpose:"Fleet insurance — 32 units of construction equipment across all active project sites.",term:12,reputation:38,fleetValue:164e5,risk:"LOW",isNew:!1},{type:"BOND",applicant:"Republic of Sangreza",abbr:"SNG",entity:"GOV",nation:"Sangreza",amount:45e6,purpose:"Emergency Fiscal Bond — Series 2013-A. Covering budget shortfall from commodity price collapse.",term:36,couponRate:9.8,stability:44,debtToGdp:68,creditRating:24,risk:"HIGH",isNew:!0}];let B="ALL",N=-1;function st(e){B=e,N=-1,G()}function nt(e){N=N===e?-1:e,G()}function G(){const e=document.getElementById("df-container");if(!e)return;const a=B==="ALL"?y:y.filter(l=>l.type===B),n=y.filter(l=>l.isNew).length,i=y.length;let o=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${n>0?`<span class="df-badge df-badge-corp" style="font-size:8px;">${n} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${i} OPEN</span>
        </div>
    </div>`;const f=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];o+='<div class="df-filters">';for(const l of f)o+=`<span class="df-pill${B===l.id?" "+l.activeClass:""}" onclick="dfSetFilter('${l.id}')">${l.label}</span>`;o+="</div>",o+='<div class="df-list">';for(let l=0;l<a.length;l++){const t=a[l],d=y.indexOf(t),$=N===d,S=at[t.type],_=ot[t.risk];o+=`<div class="df-deal${$?" sel-"+S.class:""}" onclick="dfSelectDeal(${d})">`,t.isNew&&(o+='<div class="df-new-dot"></div>'),o+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span class="df-badge df-badge-${S.class}">${S.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;">${E(t.applicant)}</span>
            <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
        </div>`,o+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${E(t.nation.toUpperCase())}</span>
            <span class="df-badge ${_.class}" style="font-weight:700;line-height:12px;background:currentColor;-webkit-background-clip:unset;padding:0 4px;">`,o+="</span>",o=o.slice(0,o.lastIndexOf('<span class="df-badge '+_.class));const k=_.class==="df-risk-low"?"#5c5":_.class==="df-risk-moderate"?"#ca5":_.class==="df-risk-elevated"?"#c84":"#c55";o+=`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${k};background:${k}12;border:1px solid ${k}25;">${_.label}</span>
        </div>`;const F=t.type==="BOND"?"FACE VALUE":t.type==="INSURE"?"COVERAGE":"AMOUNT",V=t.type==="BOND"?"COUPON":"REP",w=t.type==="BOND"?t.couponRate+"%":t.reputation||t.stability,I=t.type==="BOND"?t.couponRate*10:t.reputation||t.stability,H=t.type==="BOND"?"#c8a832":I>=60?"#5c5":I>=35?"#ca5":"#c84";if(o+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${F}</div>
                <div class="df-metrics__value" style="font-size:12px;color:#e8e4dc;">${r(t.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:11px;color:#e8e4dc;">${t.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${V}</div>
                <div class="df-metrics__value" style="font-size:11px;color:${H};">${w}</div>
            </div>
        </div>`,$){if(o+=`<div style="margin-top:6px;font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(t.purpose)}</div>`,o+='<div class="df-detail">',t.type==="LOAN"){const m=Math.round(t.debt/t.revenue*100),s=m>50?"#c84":"#5c5",L=t.debt>t.revenue*.5?"#c84":"#9e9a92";o+=`<div class="df-detail-row"><span class="df-detail-label">ANNUAL REVENUE</span><span class="df-detail-value" style="color:#9e9a92;">${r(t.revenue)}</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">EXISTING DEBT</span><span class="df-detail-value" style="color:${L};">${r(t.debt)}</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/REVENUE</span><span class="df-detail-value" style="color:${s};font-weight:700;">${m}%</span></div>`}else if(t.type==="BOND"){const m=t.stability>=50?"#5c5":t.stability>=30?"#ca5":"#c84",s=t.debtToGdp>60?"#c55":t.debtToGdp>40?"#c84":"#5c5",L=t.creditRating>=60?"#5c5":t.creditRating>=35?"#ca5":"#c55";o+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${m};">${t.stability}/100</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${s};">${t.debtToGdp}%</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${L};font-weight:700;">${t.creditRating}/100</span></div>`}else if(t.type==="INSURE"){const m=t.reputation>=60?"#5c5":t.reputation>=35?"#ca5":"#c84",s=t.projectValue?"PROJECT VALUE":"FLEET VALUE",L=t.projectValue||t.fleetValue;o+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${m};">${t.reputation}/100</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">${s}</span><span class="df-detail-value" style="color:#9e9a92;">${r(L)}</span></div>`}o+="</div>"}o+="</div>"}o+="</div>";const h=y.filter(l=>l.type==="LOAN").length,P=y.filter(l=>l.type==="INSURE").length,U=y.filter(l=>l.type==="BOND").length;o+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${h}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${P}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${U}</span></div>
        </div>
        <div class="df-review-btn${N>=0?" active":""}" ${N>=0?`onclick="rdOpen(${N})"`:""}>REVIEW DEAL</div>
    </div>`,e.innerHTML=o}window.dfSetFilter=st;window.dfSelectDeal=nt;let z=null,c="LOAN",g=8,u=18e6,T=24,b="equipment";const j=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function lt(e){const a=y[e];a&&(z=a,c=a.type,a.type==="LOAN"&&(g=8,u=a.amount,T=a.term||24,b="equipment"),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",O())}function it(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",z=null}function rt(e){c=e,O()}function dt(e){g=Number(e),O()}function ct(e){u=Number(e),O()}function pt(e){T=Number(e),O()}function ft(e){b=e,O()}function K(e,a,n){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(e/a*100,100)}%;background:${n};"></div></div>`}function O(){const e=document.getElementById("rd-modal");if(!e||!z)return;const a=z,n=c==="LOAN"?"#5a8aaa":c==="INSURE"?"#aa7a5a":"#8a6aaa",i=Math.round(u*(g/100)*(T/12)),o=Math.round((u+i)/T),f=a.revenue||474e5,h=Math.round(o/f*1200),P=12,U=Math.max(0,(g-6)*1.5),l=u>15e6?3:0,t=b==="none"?3:b==="full"?-2:0,d=Math.min(60,Math.max(2,Math.round(P+U+l+t))),$=d<=15?"#5c5":d<=30?"#ca5":d<=45?"#c84":"#c55",S=d<=15?"LOW":d<=30?"MODERATE":d<=45?"ELEVATED":"HIGH",_=95,k=(g-4)*8,F=u<(a.amount||18e6)?10:0,V=b==="full"?15:b==="property"?8:b==="none"?-5:0,w=Math.max(10,Math.min(95,Math.round(_-k-F-V))),I=w>=70?"#5c5":w>=45?"#ca5":w>=25?"#c84":"#c55",H=j.find(v=>v.id===b),m=Math.round(i*(1-d/100));let s=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${n};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div class="rd-tabs">`;const L=[{id:"LOAN",label:"Loan",color:"#5a8aaa",name:a.type==="LOAN"?a.applicant:"Loan"}];for(const v of L){const D=c===v.id;s+=`<span class="rd-tab${D?" active-"+v.id.toLowerCase():""}" onclick="rdSetTab('${v.id}')">${v.label} — ${E(v.name)}</span>`}if(s+="</div></div>",s+='<div class="rd-body">',s+='<div class="rd-left">',c==="LOAN"){const v=(a.reputation||50)>=60?"#5c5":(a.reputation||50)>=35?"#ca5":"#c84";s+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${E(a.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${E(a.applicant)}</span>
                <span class="df-badge df-badge-${a.entity.toLowerCase()}">${a.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REVENUE</div><div class="rd-applicant__stat-value" style="color:#5c5;">${r(a.revenue||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${r(a.debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${v};">${a.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${r(a.amount)}</div></div>
            </div>
        </div>`,s+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const D=(g-3)/15*100;s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${g}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${g}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${D}%,#2a2a24 ${D}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`;const q=(u-5e6)/2e7*100,W=Math.round((a.amount||18e6)*1.4);s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">LOAN AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${r(u)}</span>
            </div>
            <input type="range" class="rd-control__range" min="5000000" max="${W}" step="1000000" value="${u}"
                oninput="rdSetLoanAmount(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${q}%,#2a2a24 ${q}%);">
            <div class="rd-control__hints"><span>$5M (partial)</span><span>${r(W)} (over-fund)</span></div>
        </div>`,s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">TERM (MONTHS)</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${T}mo</span>
            </div>
            <div class="rd-presets">`;for(const x of[6,12,18,24,36,48])s+=`<span class="rd-preset" onclick="rdSetLoanTerm(${x})" style="${T===x?"color:#000;background:#5a8aaa;border-color:#5a8aaa;":""}">${x}</span>`;s+="</div></div>",s+=`<div class="rd-control">
            <div class="rd-control__label" style="margin-bottom:6px;">COLLATERAL REQUIREMENT</div>
            <div class="rd-presets">`;for(const x of j){const M=b===x.id;s+=`<div onclick="rdSetCollateral('${x.id}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${M?"rgba(90,138,170,0.09)":"transparent"};border:1px solid ${M?"rgba(90,138,170,0.27)":"#2a2a24"};">
                <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${M?"#5a8aaa":"#6a6660"};">${x.label}</div>
            </div>`}s+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">${H.desc}</div>
        </div>`}if(s+="</div>",s+='<div class="rd-right">',c==="LOAN"){s+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${$};">${d}%</span>
            </div>
            ${K(d,100,$)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${$};margin-top:4px;">${S}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,s+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${I};">${w}%</span>
            </div>
            ${K(w,100,I)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,s+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',s+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${r(u)}</span></div>`,s+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${r(i)}</span></div>`,s+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${r(o)}</span></div>`;const v=h>30?"#c55":h>15?"#ca5":"#5c5";s+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${v};">${h}% of revenue</span></div>`,s+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${r(m)}</span></div>`,s+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${d}% default)</div>`}s+="</div>",s+="</div>";const Y=c==="LOAN"?u:0,X=c==="LOAN"?m:0,Q=c==="LOAN"?d:0,J=c==="LOAN"?$:"#6a6660",Z=c==="LOAN"?"ISSUE LOAN":c==="INSURE"?"WRITE POLICY":"BUY BONDS",tt=c.toLowerCase();s+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${r(Y)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${r(X)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${J};">${Q}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${tt}">${Z}</button>
        </div>
    </div>`,e.innerHTML=s}window.rdOpen=lt;window.rdClose=it;window.rdSetTab=rt;window.rdSetLoanRate=dt;window.rdSetLoanAmount=ct;window.rdSetLoanTerm=pt;window.rdSetCollateral=ft;async function vt(){const{data:{user:e}}=await C.auth.getUser();if(!e){window.location.href="login.html";return}const{data:a}=await C.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);R=(a||[]).filter(f=>f.nation_id);const n=sessionStorage.getItem("active_faction_id");if(p=R.find(f=>f.id===n)||R.find(f=>f.faction_type==="corporation")||R[0],!p){await C.auth.signOut(),window.location.href="login.html";return}if(p.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(p.corp_sector!=="Finance"){window.location.href="corp-operations.html"+window.location.search;return}sessionStorage.setItem("active_faction_id",p.id);const[i,o]=await Promise.all([p.nation_id?C.from("nations").select("*").eq("id",p.nation_id).single():Promise.resolve({data:null}),C.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);i.data&&i.data,A=o.data,document.getElementById("corp-name-bar").textContent=p.faction_name||"Corp",document.getElementById("corp-name-badge").textContent=(p.abbreviation||p.corp_ticker||p.faction_name||"--").toUpperCase(),document.getElementById("topbar-cash").textContent="CASH: "+r(Number(p.corp_cash_reserves)||0),A&&(document.getElementById("game-date").textContent=A.current_date||et(A.current_tick),document.getElementById("tick-number").textContent=A.current_tick||"--"),ut(),G(),A?.next_tick_at&&gt(A.next_tick_at)}function ut(){const e=document.getElementById("corp-faction-dropdown");if(!e||R.length<=1)return;let a="";for(const n of R){const i=n.id===p.id,o=n.faction_type==="corporation"?"CORP":"PARTY";a+=`<div class="corp-faction-dropdown__item${i?" active":""}" onclick="switchFaction('${n.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${n.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${n.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${n.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${o}</span>
            <span>${E(n.faction_name||"--")}</span>
        </div>`}e.innerHTML=a}function mt(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function yt(e){sessionStorage.setItem("active_faction_id",e);const a=R.find(n=>n.id===e);a&&a.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}function bt(){document.body.classList.toggle("light-mode");const e=document.body.classList.contains("light-mode");localStorage.setItem("theme",e?"light":"dark"),document.getElementById("theme-toggle").textContent=e?"Dark":"Light"}async function _t(){await C.auth.signOut(),window.location.href="login.html"}function gt(e){const a=document.getElementById("tick-countdown");function n(){const i=new Date(e)-new Date;if(i<=0){a.textContent="Processing...";return}const o=Math.floor(i/36e5),f=Math.floor(i%36e5/6e4),h=Math.floor(i%6e4/1e3);a.textContent=`${o}h ${f}m ${h}s`}n(),setInterval(n,1e3)}localStorage.getItem("theme")==="light"&&(document.body.classList.add("light-mode"),document.getElementById("theme-toggle").textContent="Dark");window.toggleCorpDropdown=mt;window.switchFaction=yt;window.toggleTheme=bt;window.doLogout=_t;vt();
