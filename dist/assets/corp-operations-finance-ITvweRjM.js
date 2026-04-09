import{_ as V}from"./supabase-client-BXEzLDpS.js";import{t as Ta,e as y}from"./utils-C2W-HleY.js";let B=[],m=null,D=null;function n(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+Math.round(e).toLocaleString()}const La={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},Na={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}},x=[{type:"LOAN",applicant:"Salazar Construction",abbr:"SZC",entity:"CORP",nation:"Melizea",amount:18e6,purpose:"Equipment acquisition — Heavy Infrastructure expansion. 2 Tower Cranes, 3 Heavy Haulers.",term:24,reputation:65,revenue:474e5,debt:22e6,risk:"MODERATE",isNew:!0},{type:"BOND",applicant:"Republic of Melizea",abbr:"MEL",entity:"GOV",nation:"Melizea",amount:1e8,purpose:"National Infrastructure Bond — Series 2013-B. Funding highway and rail expansion over 5 years.",term:60,couponRate:6.2,stability:23,debtToGdp:42,creditRating:38,risk:"ELEVATED",isNew:!0},{type:"INSURE",applicant:"Constructora del Sur",abbr:"CDS",entity:"CORP",nation:"Melizea",amount:12e6,purpose:"Project liability insurance — San Maria Water Treatment Facility. Coverage for construction defects, delays, and third-party claims.",term:18,reputation:52,projectValue:285e5,risk:"MODERATE",isNew:!1},{type:"LOAN",applicant:"Torres & Vega Group",abbr:"TVG",entity:"CORP",nation:"Melizea",amount:5e6,purpose:"Working capital — bridge financing to cover material procurement pending contract payment.",term:6,reputation:34,revenue:148e5,debt:22e5,risk:"ELEVATED",isNew:!1},{type:"INSURE",applicant:"McKenna Construction",abbr:"MKAV",entity:"CORP",nation:"Avelia",amount:8e6,purpose:"Fleet insurance — 32 units of construction equipment across all active project sites.",term:12,reputation:38,fleetValue:164e5,risk:"LOW",isNew:!1},{type:"BOND",applicant:"Republic of Sangreza",abbr:"SNG",entity:"GOV",nation:"Sangreza",amount:45e6,purpose:"Emergency Fiscal Bond — Series 2013-A. Covering budget shortfall from commodity price collapse.",term:36,couponRate:9.8,stability:44,debtToGdp:68,creditRating:24,risk:"HIGH",isNew:!0}];let X="ALL",U=-1;function Ca(e){X=e,U=-1,ra()}function Sa(e){U=U===e?-1:e,ra()}function ra(){const e=document.getElementById("df-container");if(!e)return;const a=X==="ALL"?x:x.filter(r=>r.type===X),i=x.filter(r=>r.isNew).length,p=x.length;let o=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${i>0?`<span class="df-badge df-badge-corp" style="font-size:8px;">${i} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${p} OPEN</span>
        </div>
    </div>`;const b=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];o+='<div class="df-filters">';for(const r of b)o+=`<span class="df-pill${X===r.id?" "+r.activeClass:""}" onclick="dfSetFilter('${r.id}')">${r.label}</span>`;o+="</div>",o+='<div class="df-list">';for(let r=0;r<a.length;r++){const s=a[r],v=x.indexOf(s),I=U===v,H=La[s.type],T=Na[s.risk];o+=`<div class="df-deal${I?" sel-"+H.class:""}" onclick="dfSelectDeal(${v})">`,s.isNew&&(o+='<div class="df-new-dot"></div>'),o+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span class="df-badge df-badge-${H.class}">${H.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;">${y(s.applicant)}</span>
            <span class="df-badge df-badge-${s.entity.toLowerCase()}">${s.entity}</span>
        </div>`,o+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${y(s.nation.toUpperCase())}</span>
            <span class="df-badge ${T.class}" style="font-weight:700;line-height:12px;background:currentColor;-webkit-background-clip:unset;padding:0 4px;">`,o+="</span>",o=o.slice(0,o.lastIndexOf('<span class="df-badge '+T.class));const j=T.class==="df-risk-low"?"#5c5":T.class==="df-risk-moderate"?"#ca5":T.class==="df-risk-elevated"?"#c84":"#c55";o+=`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${j};background:${j}12;border:1px solid ${j}25;">${T.label}</span>
        </div>`;const aa=s.type==="BOND"?"FACE VALUE":s.type==="INSURE"?"COVERAGE":"AMOUNT",ta=s.type==="BOND"?"COUPON":"REP",O=s.type==="BOND"?s.couponRate+"%":s.reputation||s.stability,q=s.type==="BOND"?s.couponRate*10:s.reputation||s.stability,ea=s.type==="BOND"?"#c8a832":q>=60?"#5c5":q>=35?"#ca5":"#c84";if(o+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${aa}</div>
                <div class="df-metrics__value" style="font-size:12px;color:#e8e4dc;">${n(s.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:11px;color:#e8e4dc;">${s.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${ta}</div>
                <div class="df-metrics__value" style="font-size:11px;color:${ea};">${O}</div>
            </div>
        </div>`,I){if(o+=`<div style="margin-top:6px;font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${y(s.purpose)}</div>`,o+='<div class="df-detail">',s.type==="LOAN"){const $=Math.round(s.debt/s.revenue*100),M=$>50?"#c84":"#5c5",h=s.debt>s.revenue*.5?"#c84":"#9e9a92";o+=`<div class="df-detail-row"><span class="df-detail-label">ANNUAL REVENUE</span><span class="df-detail-value" style="color:#9e9a92;">${n(s.revenue)}</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">EXISTING DEBT</span><span class="df-detail-value" style="color:${h};">${n(s.debt)}</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/REVENUE</span><span class="df-detail-value" style="color:${M};font-weight:700;">${$}%</span></div>`}else if(s.type==="BOND"){const $=s.stability>=50?"#5c5":s.stability>=30?"#ca5":"#c84",M=s.debtToGdp>60?"#c55":s.debtToGdp>40?"#c84":"#5c5",h=s.creditRating>=60?"#5c5":s.creditRating>=35?"#ca5":"#c55";o+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${$};">${s.stability}/100</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${M};">${s.debtToGdp}%</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${h};font-weight:700;">${s.creditRating}/100</span></div>`}else if(s.type==="INSURE"){const $=s.reputation>=60?"#5c5":s.reputation>=35?"#ca5":"#c84",M=s.projectValue?"PROJECT VALUE":"FLEET VALUE",h=s.projectValue||s.fleetValue;o+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${$};">${s.reputation}/100</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">${M}</span><span class="df-detail-value" style="color:#9e9a92;">${n(h)}</span></div>`}o+="</div>"}o+="</div>"}o+="</div>";const k=x.filter(r=>r.type==="LOAN").length,J=x.filter(r=>r.type==="INSURE").length,Z=x.filter(r=>r.type==="BOND").length;o+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${k}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${J}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${Z}</span></div>
        </div>
        <div class="df-review-btn${U>=0?" active":""}" ${U>=0?`onclick="rdOpen(${U})"`:""}>REVIEW DEAL</div>
    </div>`,e.innerHTML=o}window.dfSetFilter=Ca;window.dfSelectDeal=Sa;let Q=null,l="LOAN",S=8,_=18e6,F=24,w="equipment",G=3.5,R=12e6,P=10,A=25e6;const ya=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function ka(e){const a=x[e];a&&(Q=a,l=a.type,a.type==="LOAN"?(S=8,_=a.amount,F=a.term||24,w="equipment"):a.type==="INSURE"?(G=3.5,R=a.amount,P=10):a.type==="BOND"&&(A=Math.round(a.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",g())}function Ia(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",Q=null}function Oa(e){l=e,g()}function Ma(e){S=Number(e),g()}function Da(e){_=Number(e),g()}function Pa(e){F=Number(e),g()}function Ba(e){w=e,g()}function Ua(e){G=Number(e),g()}function za(e){R=Number(e),g()}function Va(e){P=Number(e),g()}function Fa(e){A=Number(e),g()}function Y(e,a,i){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(e/a*100,100)}%;background:${i};"></div></div>`}function g(){const e=document.getElementById("rd-modal");if(!e||!Q)return;const a=Q,i=l==="LOAN"?"#5a8aaa":l==="INSURE"?"#aa7a5a":"#8a6aaa",p=Math.round(_*(S/100)*(F/12)),o=Math.round((_+p)/F),b=a.revenue||474e5,k=Math.round(o/b*1200),J=12,Z=Math.max(0,(S-6)*1.5),r=_>15e6?3:0,s=w==="none"?3:w==="full"?-2:0,v=Math.min(60,Math.max(2,Math.round(J+Z+r+s))),I=v<=15?"#5c5":v<=30?"#ca5":v<=45?"#c84":"#c55",H=v<=15?"LOW":v<=30?"MODERATE":v<=45?"ELEVATED":"HIGH",T=95,j=(S-4)*8,aa=_<(a.amount||18e6)?10:0,ta=w==="full"?15:w==="property"?8:w==="none"?-5:0,O=Math.max(10,Math.min(95,Math.round(T-j-aa-ta))),q=O>=70?"#5c5":O>=45?"#ca5":O>=25?"#c84":"#c55",ea=ya.find(c=>c.id===w),$=Math.round(p*(1-v/100)),M=(a.term||18)/12,h=Math.round(R*(G/100)*M),ba=100-(a.reputation||50),L=Math.max(5,Math.min(50,Math.round(ba*.4))),sa=Math.round(R*(1-P/100)),da=Math.round(sa*(L/100)),W=h-da,oa=L<=12?"#5c5":L<=22?"#ca5":L<=35?"#c84":"#c55",na=a.couponRate||6.2,ca=a.term||60,pa=ca/12,_a=Math.round(A*(na/100)),va=Math.round(A*(na/100)*pa),z=a.stability||50,fa=a.creditRating||50,ua=a.debtToGdp||30,ga=Math.max(2,Math.round((100-z)*.15+(100-fa)*.15+Math.max(0,ua-30)*.3)),N=Math.min(60,ga),la=N<=10?"#5c5":N<=20?"#ca5":N<=35?"#c84":"#c55",ma=Math.round(va*(1-N/100));let t=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${i};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div class="rd-tabs">`;const $a=[{id:"LOAN",label:"Loan",name:a.type==="LOAN"?a.applicant:"Loan"},{id:"INSURE",label:"Insure",name:a.type==="INSURE"?a.applicant:"Insure"},{id:"BOND",label:"Bond",name:a.type==="BOND"?a.applicant:"Bond"}];for(const c of $a){const f=l===c.id;t+=`<span class="rd-tab${f?" active-"+c.id.toLowerCase():""}" onclick="rdSetTab('${c.id}')">${c.label} — ${y(c.name)}</span>`}if(t+="</div></div>",t+='<div class="rd-body">',t+='<div class="rd-left">',l==="LOAN"){const c=(a.reputation||50)>=60?"#5c5":(a.reputation||50)>=35?"#ca5":"#c84";t+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${y(a.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${y(a.applicant)}</span>
                <span class="df-badge df-badge-${a.entity.toLowerCase()}">${a.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${y(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REVENUE</div><div class="rd-applicant__stat-value" style="color:#5c5;">${n(a.revenue||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${n(a.debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${c};">${a.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(a.amount)}</div></div>
            </div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const f=(S-3)/15*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${S}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${S}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${f}%,#2a2a24 ${f}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`;const E=(_-5e6)/2e7*100,C=Math.round((a.amount||18e6)*1.4);t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">LOAN AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${n(_)}</span>
            </div>
            <input type="range" class="rd-control__range" min="5000000" max="${C}" step="1000000" value="${_}"
                oninput="rdSetLoanAmount(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${E}%,#2a2a24 ${E}%);">
            <div class="rd-control__hints"><span>$5M (partial)</span><span>${n(C)} (over-fund)</span></div>
        </div>`,t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">TERM (MONTHS)</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${F}mo</span>
            </div>
            <div class="rd-presets">`;for(const u of[6,12,18,24,36,48])t+=`<span class="rd-preset" onclick="rdSetLoanTerm(${u})" style="${F===u?"color:#000;background:#5a8aaa;border-color:#5a8aaa;":""}">${u}</span>`;t+="</div></div>",t+=`<div class="rd-control">
            <div class="rd-control__label" style="margin-bottom:6px;">COLLATERAL REQUIREMENT</div>
            <div class="rd-presets">`;for(const u of ya){const d=w===u.id;t+=`<div onclick="rdSetCollateral('${u.id}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${d?"rgba(90,138,170,0.09)":"transparent"};border:1px solid ${d?"rgba(90,138,170,0.27)":"#2a2a24"};">
                <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${d?"#5a8aaa":"#6a6660"};">${u.label}</div>
            </div>`}t+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">${ea.desc}</div>
        </div>`}if(l==="INSURE"){const c=(a.reputation||50)>=60?"#5c5":(a.reputation||50)>=35?"#ca5":"#c84",f=a.projectValue?"PROJECT":"FLEET",E=a.projectValue||a.fleetValue||0;t+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${y(a.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${y(a.applicant)}</span>
                <span class="df-badge df-badge-${a.entity.toLowerCase()}">${a.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${y(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${c};">${a.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${f}</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(E)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(a.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${a.term}mo</div></div>
            </div>
        </div>`,t+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const C=(G-1)/7*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${G}%</span>
            </div>
            <input type="range" class="rd-control__range" min="1" max="8" step="0.5" value="${G}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${C}%,#2a2a24 ${C}%);">
            <div class="rd-control__hints"><span>1% (competitive)</span><span>8% (expensive)</span></div>
        </div>`;const u=Math.round((a.projectValue||a.fleetValue||a.amount)*.7),d=Math.round(a.amount*.33),K=(R-d)/(u-d)*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${n(R)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${d}" max="${u}" step="1000000" value="${R}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${K}%,#2a2a24 ${K}%);">
            <div class="rd-control__hints"><span>${n(d)} (partial)</span><span>${n(u)} (max)</span></div>
        </div>`,t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${P}%</span>
            </div>
            <div class="rd-presets">`;for(const ia of[5,10,15,20,25])t+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${ia})" style="${P===ia?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${ia}%</span>`;t+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${P}% of any claim (${n(Math.round(R*P/100))})</div>
        </div>`}if(l==="BOND"){const c=z>=50?"#5c5":z>=30?"#ca5":z>=15?"#c84":"#c55";t+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${y(a.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${y(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(a.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${na}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${ca}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${c};">${z}</div></div>
            </div>
        </div>`,t+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const f=a.amount,E=Math.round(f*.05),C=(A-E)/(f-E)*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${n(A)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${E}" max="${f}" step="5000000" value="${A}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${C}%,#2a2a24 ${C}%);">
            <div class="rd-control__hints"><span>${n(E)} (small position)</span><span>${n(f)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,t+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const u=[{key:"stability",value:z,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:ua,label:"Debt burden",invert:!0},{key:"credit_rating",value:fa,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:a.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:a.corruption||62,label:"Institutional risk",invert:!0}];for(const d of u){const K=d.invert?d.value>60?"#c55":d.value>40?"#ca5":"#5c5":d.value>=50?"#5c5":d.value>=30?"#ca5":d.value>=15?"#c84":"#c55";t+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${d.key}</span>
                <div style="width:40px;">${Y(d.value,100,K)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:18px;text-align:right;">${d.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${d.label}</span>
            </div>`}t+="</div>"}if(t+="</div>",t+='<div class="rd-right">',l==="LOAN"){t+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${I};">${v}%</span>
            </div>
            ${Y(v,100,I)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${I};margin-top:4px;">${H}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${q};">${O}%</span>
            </div>
            ${Y(O,100,q)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',t+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${n(_)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${n(p)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${n(o)}</span></div>`;const c=k>30?"#c55":k>15?"#ca5":"#5c5";t+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${c};">${k}% of revenue</span></div>`,t+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${n($)}</span></div>`,t+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${v}% default)</div>`}if(l==="INSURE"){t+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${oa};">${L}%</span>
            </div>
            ${Y(L,100,oa)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',t+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${n(sa)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${n(h)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${n(da)}</span></div>`;const c=W>0?"":" negative",f=W>0?"#5c5":"#c55";t+=`<div class="rd-expected${c}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${f};">${n(W)}</span></div>`,t+=`<div class="rd-formula">Premiums (${n(h)}) − expected payout (${L}% × ${n(sa)})</div>`}l==="BOND"&&(t+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${la};">${N}%</span>
            </div>
            ${Y(N,100,la)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',t+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${n(A)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${n(_a)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(pa)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${n(va)}</span></div>`,t+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${n(ma)}</span></div>`,t+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${N}% default)</div>`),t+="</div>",t+="</div>";const ha=l==="LOAN"?_:l==="INSURE"?R:A,Ea=l==="LOAN"?$:l==="INSURE"?W:ma,xa=l==="LOAN"?v:l==="INSURE"?L:N,wa=l==="LOAN"?I:l==="INSURE"?oa:la,Ra=l==="LOAN"?"ISSUE LOAN":l==="INSURE"?"WRITE POLICY":"BUY BONDS",Aa=l.toLowerCase();t+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${n(ha)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${n(Ea)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${wa};">${xa}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${Aa}">${Ra}</button>
        </div>
    </div>`,e.innerHTML=t}window.rdOpen=ka;window.rdClose=Ia;window.rdSetTab=Oa;window.rdSetLoanRate=Ma;window.rdSetLoanAmount=Da;window.rdSetLoanTerm=Pa;window.rdSetCollateral=Ba;window.rdSetInsurePremium=Ua;window.rdSetInsureCoverage=za;window.rdSetInsureDeductible=Va;window.rdSetBondAmount=Fa;async function Ga(){const{data:{user:e}}=await V.auth.getUser();if(!e){window.location.href="login.html";return}const{data:a}=await V.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);B=(a||[]).filter(b=>b.nation_id);const i=sessionStorage.getItem("active_faction_id");if(m=B.find(b=>b.id===i)||B.find(b=>b.faction_type==="corporation")||B[0],!m){await V.auth.signOut(),window.location.href="login.html";return}if(m.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(m.corp_sector!=="Finance"){window.location.href="corp-operations.html"+window.location.search;return}sessionStorage.setItem("active_faction_id",m.id);const[p,o]=await Promise.all([m.nation_id?V.from("nations").select("*").eq("id",m.nation_id).single():Promise.resolve({data:null}),V.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);p.data&&p.data,D=o.data,document.getElementById("corp-name-bar").textContent=m.faction_name||"Corp",document.getElementById("corp-name-badge").textContent=(m.abbreviation||m.corp_ticker||m.faction_name||"--").toUpperCase(),document.getElementById("topbar-cash").textContent="CASH: "+n(Number(m.corp_cash_reserves)||0),D&&(document.getElementById("game-date").textContent=D.current_date||Ta(D.current_tick),document.getElementById("tick-number").textContent=D.current_tick||"--"),Ha(),ra(),D?.next_tick_at&&Ka(D.next_tick_at)}function Ha(){const e=document.getElementById("corp-faction-dropdown");if(!e||B.length<=1)return;let a="";for(const i of B){const p=i.id===m.id,o=i.faction_type==="corporation"?"CORP":"PARTY";a+=`<div class="corp-faction-dropdown__item${p?" active":""}" onclick="switchFaction('${i.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${i.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${i.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${i.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${o}</span>
            <span>${y(i.faction_name||"--")}</span>
        </div>`}e.innerHTML=a}function ja(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function qa(e){sessionStorage.setItem("active_faction_id",e);const a=B.find(i=>i.id===e);a&&a.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}function Ya(){document.body.classList.toggle("light-mode");const e=document.body.classList.contains("light-mode");localStorage.setItem("theme",e?"light":"dark"),document.getElementById("theme-toggle").textContent=e?"Dark":"Light"}async function Wa(){await V.auth.signOut(),window.location.href="login.html"}function Ka(e){const a=document.getElementById("tick-countdown");function i(){const p=new Date(e)-new Date;if(p<=0){a.textContent="Processing...";return}const o=Math.floor(p/36e5),b=Math.floor(p%36e5/6e4),k=Math.floor(p%6e4/1e3);a.textContent=`${o}h ${b}m ${k}s`}i(),setInterval(i,1e3)}localStorage.getItem("theme")==="light"&&(document.body.classList.add("light-mode"),document.getElementById("theme-toggle").textContent="Dark");window.toggleCorpDropdown=ja;window.switchFaction=qa;window.toggleTheme=Ya;window.doLogout=Wa;Ga();
