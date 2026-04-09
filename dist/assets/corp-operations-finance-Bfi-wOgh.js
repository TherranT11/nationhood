import{_ as D}from"./supabase-client-BXEzLDpS.js";import{t as ut,e as y}from"./utils-C2W-HleY.js";let O=[],v=null,S=null;function n(a){return Math.abs(a)>=1e6?"$"+(a/1e6).toFixed(1)+"M":Math.abs(a)>=1e3?"$"+(a/1e3).toFixed(0)+"k":"$"+Math.round(a).toLocaleString()}const mt={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},yt={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}},E=[{type:"LOAN",applicant:"Salazar Construction",abbr:"SZC",entity:"CORP",nation:"Melizea",amount:18e6,purpose:"Equipment acquisition — Heavy Infrastructure expansion. 2 Tower Cranes, 3 Heavy Haulers.",term:24,reputation:65,revenue:474e5,debt:22e6,risk:"MODERATE",isNew:!0},{type:"BOND",applicant:"Republic of Melizea",abbr:"MEL",entity:"GOV",nation:"Melizea",amount:1e8,purpose:"National Infrastructure Bond — Series 2013-B. Funding highway and rail expansion over 5 years.",term:60,couponRate:6.2,stability:23,debtToGdp:42,creditRating:38,risk:"ELEVATED",isNew:!0},{type:"INSURE",applicant:"Constructora del Sur",abbr:"CDS",entity:"CORP",nation:"Melizea",amount:12e6,purpose:"Project liability insurance — San Maria Water Treatment Facility. Coverage for construction defects, delays, and third-party claims.",term:18,reputation:52,projectValue:285e5,risk:"MODERATE",isNew:!1},{type:"LOAN",applicant:"Torres & Vega Group",abbr:"TVG",entity:"CORP",nation:"Melizea",amount:5e6,purpose:"Working capital — bridge financing to cover material procurement pending contract payment.",term:6,reputation:34,revenue:148e5,debt:22e5,risk:"ELEVATED",isNew:!1},{type:"INSURE",applicant:"McKenna Construction",abbr:"MKAV",entity:"CORP",nation:"Avelia",amount:8e6,purpose:"Fleet insurance — 32 units of construction equipment across all active project sites.",term:12,reputation:38,fleetValue:164e5,risk:"LOW",isNew:!1},{type:"BOND",applicant:"Republic of Sangreza",abbr:"SNG",entity:"GOV",nation:"Sangreza",amount:45e6,purpose:"Emergency Fiscal Bond — Series 2013-A. Covering budget shortfall from commodity price collapse.",term:36,couponRate:9.8,stability:44,debtToGdp:68,creditRating:24,risk:"HIGH",isNew:!0}];let q="ALL",M=-1;function _t(a){q=a,M=-1,et()}function bt(a){M=M===a?-1:a,et()}function et(){const a=document.getElementById("df-container");if(!a)return;const t=q==="ALL"?E:E.filter(i=>i.type===q),l=E.filter(i=>i.isNew).length,d=E.length;let o=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${l>0?`<span class="df-badge df-badge-corp" style="font-size:8px;">${l} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${d} OPEN</span>
        </div>
    </div>`;const f=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];o+='<div class="df-filters">';for(const i of f)o+=`<span class="df-pill${q===i.id?" "+i.activeClass:""}" onclick="dfSetFilter('${i.id}')">${i.label}</span>`;o+="</div>",o+='<div class="df-list">';for(let i=0;i<t.length;i++){const e=t[i],p=E.indexOf(e),N=M===p,B=mt[e.type],w=yt[e.risk];o+=`<div class="df-deal${N?" sel-"+B.class:""}" onclick="dfSelectDeal(${p})">`,e.isNew&&(o+='<div class="df-new-dot"></div>'),o+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span class="df-badge df-badge-${B.class}">${B.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;">${y(e.applicant)}</span>
            <span class="df-badge df-badge-${e.entity.toLowerCase()}">${e.entity}</span>
        </div>`,o+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${y(e.nation.toUpperCase())}</span>
            <span class="df-badge ${w.class}" style="font-weight:700;line-height:12px;background:currentColor;-webkit-background-clip:unset;padding:0 4px;">`,o+="</span>",o=o.slice(0,o.lastIndexOf('<span class="df-badge '+w.class));const z=w.class==="df-risk-low"?"#5c5":w.class==="df-risk-moderate"?"#ca5":w.class==="df-risk-elevated"?"#c84":"#c55";o+=`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${z};background:${z}12;border:1px solid ${z}25;">${w.label}</span>
        </div>`;const K=e.type==="BOND"?"FACE VALUE":e.type==="INSURE"?"COVERAGE":"AMOUNT",X=e.type==="BOND"?"COUPON":"REP",T=e.type==="BOND"?e.couponRate+"%":e.reputation||e.stability,V=e.type==="BOND"?e.couponRate*10:e.reputation||e.stability,Q=e.type==="BOND"?"#c8a832":V>=60?"#5c5":V>=35?"#ca5":"#c84";if(o+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${K}</div>
                <div class="df-metrics__value" style="font-size:12px;color:#e8e4dc;">${n(e.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:11px;color:#e8e4dc;">${e.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${X}</div>
                <div class="df-metrics__value" style="font-size:11px;color:${Q};">${T}</div>
            </div>
        </div>`,N){if(o+=`<div style="margin-top:6px;font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${y(e.purpose)}</div>`,o+='<div class="df-detail">',e.type==="LOAN"){const _=Math.round(e.debt/e.revenue*100),I=_>50?"#c84":"#5c5",b=e.debt>e.revenue*.5?"#c84":"#9e9a92";o+=`<div class="df-detail-row"><span class="df-detail-label">ANNUAL REVENUE</span><span class="df-detail-value" style="color:#9e9a92;">${n(e.revenue)}</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">EXISTING DEBT</span><span class="df-detail-value" style="color:${b};">${n(e.debt)}</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/REVENUE</span><span class="df-detail-value" style="color:${I};font-weight:700;">${_}%</span></div>`}else if(e.type==="BOND"){const _=e.stability>=50?"#5c5":e.stability>=30?"#ca5":"#c84",I=e.debtToGdp>60?"#c55":e.debtToGdp>40?"#c84":"#5c5",b=e.creditRating>=60?"#5c5":e.creditRating>=35?"#ca5":"#c55";o+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${_};">${e.stability}/100</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${I};">${e.debtToGdp}%</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${b};font-weight:700;">${e.creditRating}/100</span></div>`}else if(e.type==="INSURE"){const _=e.reputation>=60?"#5c5":e.reputation>=35?"#ca5":"#c84",I=e.projectValue?"PROJECT VALUE":"FLEET VALUE",b=e.projectValue||e.fleetValue;o+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${_};">${e.reputation}/100</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">${I}</span><span class="df-detail-value" style="color:#9e9a92;">${n(b)}</span></div>`}o+="</div>"}o+="</div>"}o+="</div>";const C=E.filter(i=>i.type==="LOAN").length,W=E.filter(i=>i.type==="INSURE").length,Y=E.filter(i=>i.type==="BOND").length;o+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${C}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${W}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${Y}</span></div>
        </div>
        <div class="df-review-btn${M>=0?" active":""}" ${M>=0?`onclick="rdOpen(${M})"`:""}>REVIEW DEAL</div>
    </div>`,a.innerHTML=o}window.dfSetFilter=_t;window.dfSelectDeal=bt;let j=null,r="LOAN",A=8,m=18e6,P=24,$="equipment",U=3.5,h=12e6,k=10;const nt=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function gt(a){const t=E[a];t&&(j=t,r=t.type,t.type==="LOAN"?(A=8,m=t.amount,P=t.term||24,$="equipment"):t.type==="INSURE"&&(U=3.5,h=t.amount,k=10),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",x())}function Et(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",j=null}function $t(a){r=a,x()}function ht(a){A=Number(a),x()}function xt(a){m=Number(a),x()}function wt(a){P=Number(a),x()}function Lt(a){$=a,x()}function Rt(a){U=Number(a),x()}function At(a){h=Number(a),x()}function Ct(a){k=Number(a),x()}function at(a,t,l){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(a/t*100,100)}%;background:${l};"></div></div>`}function x(){const a=document.getElementById("rd-modal");if(!a||!j)return;const t=j,l=r==="LOAN"?"#5a8aaa":r==="INSURE"?"#aa7a5a":"#8a6aaa",d=Math.round(m*(A/100)*(P/12)),o=Math.round((m+d)/P),f=t.revenue||474e5,C=Math.round(o/f*1200),W=12,Y=Math.max(0,(A-6)*1.5),i=m>15e6?3:0,e=$==="none"?3:$==="full"?-2:0,p=Math.min(60,Math.max(2,Math.round(W+Y+i+e))),N=p<=15?"#5c5":p<=30?"#ca5":p<=45?"#c84":"#c55",B=p<=15?"LOW":p<=30?"MODERATE":p<=45?"ELEVATED":"HIGH",w=95,z=(A-4)*8,K=m<(t.amount||18e6)?10:0,X=$==="full"?15:$==="property"?8:$==="none"?-5:0,T=Math.max(10,Math.min(95,Math.round(w-z-K-X))),V=T>=70?"#5c5":T>=45?"#ca5":T>=25?"#c84":"#c55",Q=nt.find(c=>c.id===$),_=Math.round(d*(1-p/100)),I=(t.term||18)/12,b=Math.round(h*(U/100)*I),lt=100-(t.reputation||50),L=Math.max(5,Math.min(50,Math.round(lt*.4))),J=Math.round(h*(1-k/100)),st=Math.round(J*(L/100)),H=b-st,Z=L<=12?"#5c5":L<=22?"#ca5":L<=35?"#c84":"#c55";let s=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${l};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div class="rd-tabs">`;const it=[{id:"LOAN",label:"Loan",name:t.type==="LOAN"?t.applicant:"Loan"},{id:"INSURE",label:"Insure",name:t.type==="INSURE"?t.applicant:"Insure"}];for(const c of it){const R=r===c.id;s+=`<span class="rd-tab${R?" active-"+c.id.toLowerCase():""}" onclick="rdSetTab('${c.id}')">${c.label} — ${y(c.name)}</span>`}if(s+="</div></div>",s+='<div class="rd-body">',s+='<div class="rd-left">',r==="LOAN"){const c=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84";s+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${y(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${y(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${y(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REVENUE</div><div class="rd-applicant__stat-value" style="color:#5c5;">${n(t.revenue||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${n(t.debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${c};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(t.amount)}</div></div>
            </div>
        </div>`,s+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const R=(A-3)/15*100;s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${A}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${A}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${R}%,#2a2a24 ${R}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`;const G=(m-5e6)/2e7*100,F=Math.round((t.amount||18e6)*1.4);s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">LOAN AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${n(m)}</span>
            </div>
            <input type="range" class="rd-control__range" min="5000000" max="${F}" step="1000000" value="${m}"
                oninput="rdSetLoanAmount(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${G}%,#2a2a24 ${G}%);">
            <div class="rd-control__hints"><span>$5M (partial)</span><span>${n(F)} (over-fund)</span></div>
        </div>`,s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">TERM (MONTHS)</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${P}mo</span>
            </div>
            <div class="rd-presets">`;for(const u of[6,12,18,24,36,48])s+=`<span class="rd-preset" onclick="rdSetLoanTerm(${u})" style="${P===u?"color:#000;background:#5a8aaa;border-color:#5a8aaa;":""}">${u}</span>`;s+="</div></div>",s+=`<div class="rd-control">
            <div class="rd-control__label" style="margin-bottom:6px;">COLLATERAL REQUIREMENT</div>
            <div class="rd-presets">`;for(const u of nt){const g=$===u.id;s+=`<div onclick="rdSetCollateral('${u.id}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${g?"rgba(90,138,170,0.09)":"transparent"};border:1px solid ${g?"rgba(90,138,170,0.27)":"#2a2a24"};">
                <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${g?"#5a8aaa":"#6a6660"};">${u.label}</div>
            </div>`}s+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">${Q.desc}</div>
        </div>`}if(r==="INSURE"){const c=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84",R=t.projectValue?"PROJECT":"FLEET",G=t.projectValue||t.fleetValue||0;s+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${y(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${y(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${y(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${c};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${R}</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(G)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${t.term}mo</div></div>
            </div>
        </div>`,s+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const F=(U-1)/7*100;s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${U}%</span>
            </div>
            <input type="range" class="rd-control__range" min="1" max="8" step="0.5" value="${U}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${F}%,#2a2a24 ${F}%);">
            <div class="rd-control__hints"><span>1% (competitive)</span><span>8% (expensive)</span></div>
        </div>`;const u=Math.round((t.projectValue||t.fleetValue||t.amount)*.7),g=Math.round(t.amount*.33),ot=(h-g)/(u-g)*100;s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${n(h)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${g}" max="${u}" step="1000000" value="${h}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${ot}%,#2a2a24 ${ot}%);">
            <div class="rd-control__hints"><span>${n(g)} (partial)</span><span>${n(u)} (max)</span></div>
        </div>`,s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${k}%</span>
            </div>
            <div class="rd-presets">`;for(const tt of[5,10,15,20,25])s+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${tt})" style="${k===tt?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${tt}%</span>`;s+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${k}% of any claim (${n(Math.round(h*k/100))})</div>
        </div>`}if(s+="</div>",s+='<div class="rd-right">',r==="LOAN"){s+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${N};">${p}%</span>
            </div>
            ${at(p,100,N)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${N};margin-top:4px;">${B}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,s+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${V};">${T}%</span>
            </div>
            ${at(T,100,V)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,s+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',s+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${n(m)}</span></div>`,s+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${n(d)}</span></div>`,s+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${n(o)}</span></div>`;const c=C>30?"#c55":C>15?"#ca5":"#5c5";s+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${c};">${C}% of revenue</span></div>`,s+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${n(_)}</span></div>`,s+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${p}% default)</div>`}if(r==="INSURE"){s+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',s+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${Z};">${L}%</span>
            </div>
            ${at(L,100,Z)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,s+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',s+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${n(J)}</span></div>`,s+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${n(b)}</span></div>`,s+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${n(st)}</span></div>`;const c=H>0?"":" negative",R=H>0?"#5c5":"#c55";s+=`<div class="rd-expected${c}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${R};">${n(H)}</span></div>`,s+=`<div class="rd-formula">Premiums (${n(b)}) − expected payout (${L}% × ${n(J)})</div>`}s+="</div>",s+="</div>";const rt=r==="LOAN"?m:r==="INSURE"?h:0,dt=r==="LOAN"?_:r==="INSURE"?H:0,ct=r==="LOAN"?p:r==="INSURE"?L:0,pt=r==="LOAN"?N:r==="INSURE"?Z:"#6a6660",vt=r==="LOAN"?"ISSUE LOAN":r==="INSURE"?"WRITE POLICY":"BUY BONDS",ft=r.toLowerCase();s+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${n(rt)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${n(dt)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${pt};">${ct}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${ft}">${vt}</button>
        </div>
    </div>`,a.innerHTML=s}window.rdOpen=gt;window.rdClose=Et;window.rdSetTab=$t;window.rdSetLoanRate=ht;window.rdSetLoanAmount=xt;window.rdSetLoanTerm=wt;window.rdSetCollateral=Lt;window.rdSetInsurePremium=Rt;window.rdSetInsureCoverage=At;window.rdSetInsureDeductible=Ct;async function Nt(){const{data:{user:a}}=await D.auth.getUser();if(!a){window.location.href="login.html";return}const{data:t}=await D.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);O=(t||[]).filter(f=>f.nation_id);const l=sessionStorage.getItem("active_faction_id");if(v=O.find(f=>f.id===l)||O.find(f=>f.faction_type==="corporation")||O[0],!v){await D.auth.signOut(),window.location.href="login.html";return}if(v.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(v.corp_sector!=="Finance"){window.location.href="corp-operations.html"+window.location.search;return}sessionStorage.setItem("active_faction_id",v.id);const[d,o]=await Promise.all([v.nation_id?D.from("nations").select("*").eq("id",v.nation_id).single():Promise.resolve({data:null}),D.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);d.data&&d.data,S=o.data,document.getElementById("corp-name-bar").textContent=v.faction_name||"Corp",document.getElementById("corp-name-badge").textContent=(v.abbreviation||v.corp_ticker||v.faction_name||"--").toUpperCase(),document.getElementById("topbar-cash").textContent="CASH: "+n(Number(v.corp_cash_reserves)||0),S&&(document.getElementById("game-date").textContent=S.current_date||ut(S.current_tick),document.getElementById("tick-number").textContent=S.current_tick||"--"),Tt(),et(),S?.next_tick_at&&Mt(S.next_tick_at)}function Tt(){const a=document.getElementById("corp-faction-dropdown");if(!a||O.length<=1)return;let t="";for(const l of O){const d=l.id===v.id,o=l.faction_type==="corporation"?"CORP":"PARTY";t+=`<div class="corp-faction-dropdown__item${d?" active":""}" onclick="switchFaction('${l.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${l.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${l.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${l.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${o}</span>
            <span>${y(l.faction_name||"--")}</span>
        </div>`}a.innerHTML=t}function It(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function St(a){sessionStorage.setItem("active_faction_id",a);const t=O.find(l=>l.id===a);t&&t.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}function kt(){document.body.classList.toggle("light-mode");const a=document.body.classList.contains("light-mode");localStorage.setItem("theme",a?"light":"dark"),document.getElementById("theme-toggle").textContent=a?"Dark":"Light"}async function Ot(){await D.auth.signOut(),window.location.href="login.html"}function Mt(a){const t=document.getElementById("tick-countdown");function l(){const d=new Date(a)-new Date;if(d<=0){t.textContent="Processing...";return}const o=Math.floor(d/36e5),f=Math.floor(d%36e5/6e4),C=Math.floor(d%6e4/1e3);t.textContent=`${o}h ${f}m ${C}s`}l(),setInterval(l,1e3)}localStorage.getItem("theme")==="light"&&(document.body.classList.add("light-mode"),document.getElementById("theme-toggle").textContent="Dark");window.toggleCorpDropdown=It;window.switchFaction=St;window.toggleTheme=kt;window.doLogout=Ot;Nt();
