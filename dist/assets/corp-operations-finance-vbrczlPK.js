import{_ as F}from"./supabase-client-BXEzLDpS.js";import{t as La,e as u}from"./utils-C2W-HleY.js";let B=[],c=null,P=null;function n(s){return Math.abs(s)>=1e6?"$"+(s/1e6).toFixed(1)+"M":Math.abs(s)>=1e3?"$"+(s/1e3).toFixed(0)+"k":"$"+Math.round(s).toLocaleString()}const Ca={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},Na={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}},$=[{type:"LOAN",applicant:"Salazar Construction",abbr:"SZC",entity:"CORP",nation:"Melizea",amount:18e6,purpose:"Equipment acquisition — Heavy Infrastructure expansion. 2 Tower Cranes, 3 Heavy Haulers.",term:24,reputation:65,revenue:474e5,debt:22e6,risk:"MODERATE",isNew:!0},{type:"BOND",applicant:"Republic of Melizea",abbr:"MEL",entity:"GOV",nation:"Melizea",amount:1e8,purpose:"National Infrastructure Bond — Series 2013-B. Funding highway and rail expansion over 5 years.",term:60,couponRate:6.2,stability:23,debtToGdp:42,creditRating:38,risk:"ELEVATED",isNew:!0},{type:"INSURE",applicant:"Constructora del Sur",abbr:"CDS",entity:"CORP",nation:"Melizea",amount:12e6,purpose:"Project liability insurance — San Maria Water Treatment Facility. Coverage for construction defects, delays, and third-party claims.",term:18,reputation:52,projectValue:285e5,risk:"MODERATE",isNew:!1},{type:"LOAN",applicant:"Torres & Vega Group",abbr:"TVG",entity:"CORP",nation:"Melizea",amount:5e6,purpose:"Working capital — bridge financing to cover material procurement pending contract payment.",term:6,reputation:34,revenue:148e5,debt:22e5,risk:"ELEVATED",isNew:!1},{type:"INSURE",applicant:"McKenna Construction",abbr:"MKAV",entity:"CORP",nation:"Avelia",amount:8e6,purpose:"Fleet insurance — 32 units of construction equipment across all active project sites.",term:12,reputation:38,fleetValue:164e5,risk:"LOW",isNew:!1},{type:"BOND",applicant:"Republic of Sangreza",abbr:"SNG",entity:"GOV",nation:"Sangreza",amount:45e6,purpose:"Emergency Fiscal Bond — Series 2013-A. Covering budget shortfall from commodity price collapse.",term:36,couponRate:9.8,stability:44,debtToGdp:68,creditRating:24,risk:"HIGH",isNew:!0}];let Z="ALL",z=-1;function ba(s){if(!c)return!1;const a=(c.corp_subsector||"").toLowerCase(),r=Ia[a];return s.type===r}function Ta(s){Z=s,z=-1,da()}function Sa(s){z=z===s?-1:s,da()}function da(){const s=document.getElementById("df-container");if(!s)return;const a=Z==="ALL"?$:$.filter(l=>l.type===Z),r=$.filter(l=>l.isNew).length,p=$.length;let o=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${r>0?`<span class="df-badge df-badge-corp" style="font-size:8px;">${r} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${p} OPEN</span>
        </div>
    </div>`;const m=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];o+='<div class="df-filters">';for(const l of m)o+=`<span class="df-pill${Z===l.id?" "+l.activeClass:""}" onclick="dfSetFilter('${l.id}')">${l.label}</span>`;o+="</div>",o+='<div class="df-list">';for(let l=0;l<a.length;l++){const e=a[l],v=$.indexOf(e),k=z===v,q=Ca[e.type],L=Na[e.risk],O=ba(e);o+=`<div class="df-deal${k?" sel-"+q.class:""}" onclick="dfSelectDeal(${v})" style="${O?"":"opacity:0.5;"}">`,e.isNew&&O&&(o+='<div class="df-new-dot"></div>'),o+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span class="df-badge df-badge-${q.class}">${q.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;">${u(e.applicant)}</span>
            <span class="df-badge df-badge-${e.entity.toLowerCase()}">${e.entity}</span>
            ${O?"":'<span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`,o+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${u(e.nation.toUpperCase())}</span>
            <span class="df-badge ${L.class}" style="font-weight:700;line-height:12px;background:currentColor;-webkit-background-clip:unset;padding:0 4px;">`,o+="</span>",o=o.slice(0,o.lastIndexOf('<span class="df-badge '+L.class));const j=L.class==="df-risk-low"?"#5c5":L.class==="df-risk-moderate"?"#ca5":L.class==="df-risk-elevated"?"#c84":"#c55";o+=`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${j};background:${j}12;border:1px solid ${j}25;">${L.label}</span>
        </div>`;const sa=e.type==="BOND"?"FACE VALUE":e.type==="INSURE"?"COVERAGE":"AMOUNT",M=e.type==="BOND"?"COUPON":"REP",W=e.type==="BOND"?e.couponRate+"%":e.reputation||e.stability,K=e.type==="BOND"?e.couponRate*10:e.reputation||e.stability,X=e.type==="BOND"?"#c8a832":K>=60?"#5c5":K>=35?"#ca5":"#c84";if(o+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${sa}</div>
                <div class="df-metrics__value" style="font-size:12px;color:#e8e4dc;">${n(e.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:11px;color:#e8e4dc;">${e.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${M}</div>
                <div class="df-metrics__value" style="font-size:11px;color:${X};">${W}</div>
            </div>
        </div>`,k){if(o+=`<div style="margin-top:6px;font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${u(e.purpose)}</div>`,O)o+='<div class="df-detail">';else{const g=e.type==="LOAN"?"Banking":e.type==="INSURE"?"Insurance":"Investment";o+=`<div style="padding:6px 8px;background:rgba(106,102,96,0.06);border:1px solid #2a2a24;font-family:var(--font-mono);font-size:8px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:#e8e4dc;font-weight:700;">${g}</span> subsector to underwrite.
                    ${c?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+u(c.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(O){if(e.type==="LOAN"){const g=Math.round(e.debt/e.revenue*100),h=g>50?"#c84":"#5c5",D=e.debt>e.revenue*.5?"#c84":"#9e9a92";o+=`<div class="df-detail-row"><span class="df-detail-label">ANNUAL REVENUE</span><span class="df-detail-value" style="color:#9e9a92;">${n(e.revenue)}</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">EXISTING DEBT</span><span class="df-detail-value" style="color:${D};">${n(e.debt)}</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/REVENUE</span><span class="df-detail-value" style="color:${h};font-weight:700;">${g}%</span></div>`}else if(e.type==="BOND"){const g=e.stability>=50?"#5c5":e.stability>=30?"#ca5":"#c84",h=e.debtToGdp>60?"#c55":e.debtToGdp>40?"#c84":"#5c5",D=e.creditRating>=60?"#5c5":e.creditRating>=35?"#ca5":"#c55";o+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${g};">${e.stability}/100</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${h};">${e.debtToGdp}%</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${D};font-weight:700;">${e.creditRating}/100</span></div>`}else if(e.type==="INSURE"){const g=e.reputation>=60?"#5c5":e.reputation>=35?"#ca5":"#c84",h=e.projectValue?"PROJECT VALUE":"FLEET VALUE",D=e.projectValue||e.fleetValue;o+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${g};">${e.reputation}/100</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">${h}</span><span class="df-detail-value" style="color:#9e9a92;">${n(D)}</span></div>`}o+="</div>"}}o+="</div>"}o+="</div>";const I=$.filter(l=>l.type==="LOAN").length,ta=$.filter(l=>l.type==="INSURE").length,ea=$.filter(l=>l.type==="BOND").length;o+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${I}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${ta}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${ea}</span></div>
        </div>
        ${(()=>{const l=z>=0?$[z]:null,e=l&&ba(l);return e?`<div class="df-review-btn active" onclick="rdOpen(${z})">REVIEW DEAL</div>`:l&&!e?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,s.innerHTML=o}window.dfSetFilter=Ta;window.dfSelectDeal=Sa;const Ia={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let aa=null,i="LOAN",S=8,_=18e6,G=24,x="equipment",H=3.5,w=12e6,U=10,R=25e6;const _a=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function ka(s){const a=$[s];a&&(aa=a,i=a.type,a.type==="LOAN"?(S=8,_=a.amount,G=a.term||24,x="equipment"):a.type==="INSURE"?(H=3.5,w=a.amount,U=10):a.type==="BOND"&&(R=Math.round(a.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",A())}function Oa(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",aa=null}function Ma(s){S=Number(s),A()}function Da(s){_=Number(s),A()}function Pa(s){G=Number(s),A()}function Ua(s){x=s,A()}function Ba(s){H=Number(s),A()}function za(s){w=Number(s),A()}function Va(s){U=Number(s),A()}function Fa(s){R=Number(s),A()}function Y(s,a,r){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(s/a*100,100)}%;background:${r};"></div></div>`}function A(){const s=document.getElementById("rd-modal");if(!s||!aa)return;const a=aa,r=i==="LOAN"?"#5a8aaa":i==="INSURE"?"#aa7a5a":"#8a6aaa",p=Math.round(_*(S/100)*(G/12)),o=Math.round((_+p)/G),m=a.revenue||474e5,I=Math.round(o/m*1200),ta=12,ea=Math.max(0,(S-6)*1.5),l=_>15e6?3:0,e=x==="none"?3:x==="full"?-2:0,v=Math.min(60,Math.max(2,Math.round(ta+ea+l+e))),k=v<=15?"#5c5":v<=30?"#ca5":v<=45?"#c84":"#c55",q=v<=15?"LOW":v<=30?"MODERATE":v<=45?"ELEVATED":"HIGH",L=95,O=(S-4)*8,j=_<(a.amount||18e6)?10:0,sa=x==="full"?15:x==="property"?8:x==="none"?-5:0,M=Math.max(10,Math.min(95,Math.round(L-O-j-sa))),W=M>=70?"#5c5":M>=45?"#ca5":M>=25?"#c84":"#c55",K=_a.find(y=>y.id===x),X=Math.round(p*(1-v/100)),g=(a.term||18)/12,h=Math.round(w*(H/100)*g),D=100-(a.reputation||50),C=Math.max(5,Math.min(50,Math.round(D*.4))),oa=Math.round(w*(1-U/100)),ca=Math.round(oa*(C/100)),Q=h-ca,na=C<=12?"#5c5":C<=22?"#ca5":C<=35?"#c84":"#c55",la=a.couponRate||6.2,pa=a.term||60,va=pa/12,ga=Math.round(R*(la/100)),ua=Math.round(R*(la/100)*va),V=a.stability||50,fa=a.creditRating||50,ma=a.debtToGdp||30,$a=Math.max(2,Math.round((100-V)*.15+(100-fa)*.15+Math.max(0,ma-30)*.3)),N=Math.min(60,$a),ia=N<=10?"#5c5":N<=20?"#ca5":N<=35?"#c84":"#c55",ya=Math.round(ua*(1-N/100));let t=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${r};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>`;if(t+=`<div class="rd-tabs">
        <span class="rd-tab ${i==="LOAN"?"active-loan":i==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${i==="LOAN"?"Loan":i==="INSURE"?"Insure":"Bond"} — ${u(a.applicant)}</span>
    </div></div>`,t+='<div class="rd-body">',t+='<div class="rd-left">',i==="LOAN"){const y=(a.reputation||50)>=60?"#5c5":(a.reputation||50)>=35?"#ca5":"#c84";t+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${u(a.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${u(a.applicant)}</span>
                <span class="df-badge df-badge-${a.entity.toLowerCase()}">${a.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${u(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REVENUE</div><div class="rd-applicant__stat-value" style="color:#5c5;">${n(a.revenue||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${n(a.debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${y};">${a.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(a.amount)}</div></div>
            </div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const b=(S-3)/15*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${S}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${S}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${b}%,#2a2a24 ${b}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`;const E=15e7,T=(_-5e6)/Math.max(1,E-5e6)*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">LOAN AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${n(_)}</span>
            </div>
            <input type="range" class="rd-control__range" min="5000000" max="${E}" step="5000000" value="${_}"
                oninput="rdSetLoanAmount(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${T}%,#2a2a24 ${T}%);">
            <div class="rd-control__hints"><span>$5M</span><span>$150M</span></div>
        </div>`,t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">TERM (MONTHS)</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${G}mo</span>
            </div>
            <div class="rd-presets">`;for(const f of[12,24,36,48,60,72,84,96,108,120])t+=`<span class="rd-preset" onclick="rdSetLoanTerm(${f})" style="${G===f?"color:#000;background:#5a8aaa;border-color:#5a8aaa;":""}">${f}</span>`;t+="</div></div>",t+=`<div class="rd-control">
            <div class="rd-control__label" style="margin-bottom:6px;">COLLATERAL REQUIREMENT</div>
            <div class="rd-presets">`;for(const f of _a){const d=x===f.id;t+=`<div onclick="rdSetCollateral('${f.id}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${d?"rgba(90,138,170,0.09)":"transparent"};border:1px solid ${d?"rgba(90,138,170,0.27)":"#2a2a24"};">
                <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${d?"#5a8aaa":"#6a6660"};">${f.label}</div>
            </div>`}t+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">${K.desc}</div>
        </div>`}if(i==="INSURE"){const y=(a.reputation||50)>=60?"#5c5":(a.reputation||50)>=35?"#ca5":"#c84",b=a.projectValue?"PROJECT":"FLEET",E=a.projectValue||a.fleetValue||0;t+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${u(a.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${u(a.applicant)}</span>
                <span class="df-badge df-badge-${a.entity.toLowerCase()}">${a.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${u(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${y};">${a.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${b}</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(E)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(a.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${a.term}mo</div></div>
            </div>
        </div>`,t+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const T=(H-1)/7*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${H}%</span>
            </div>
            <input type="range" class="rd-control__range" min="1" max="8" step="0.5" value="${H}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${T}%,#2a2a24 ${T}%);">
            <div class="rd-control__hints"><span>1% (competitive)</span><span>8% (expensive)</span></div>
        </div>`;const f=Math.round((a.projectValue||a.fleetValue||a.amount)*.7),d=Math.round(a.amount*.33),J=(w-d)/(f-d)*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${n(w)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${d}" max="${f}" step="1000000" value="${w}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${J}%,#2a2a24 ${J}%);">
            <div class="rd-control__hints"><span>${n(d)} (partial)</span><span>${n(f)} (max)</span></div>
        </div>`,t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${U}%</span>
            </div>
            <div class="rd-presets">`;for(const ra of[5,10,15,20,25])t+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${ra})" style="${U===ra?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${ra}%</span>`;t+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${U}% of any claim (${n(Math.round(w*U/100))})</div>
        </div>`}if(i==="BOND"){const y=V>=50?"#5c5":V>=30?"#ca5":V>=15?"#c84":"#c55";t+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${u(a.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${u(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(a.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${la}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${pa}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${y};">${V}</div></div>
            </div>
        </div>`,t+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const b=a.amount,E=Math.max(5e6,Math.ceil(b*.05/5e6)*5e6),T=(R-E)/(b-E)*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${n(R)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${E}" max="${b}" step="5000000" value="${R}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${T}%,#2a2a24 ${T}%);">
            <div class="rd-control__hints"><span>${n(E)} (small position)</span><span>${n(b)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,t+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const f=[{key:"stability",value:V,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:ma,label:"Debt burden",invert:!0},{key:"credit_rating",value:fa,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:a.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:a.corruption||62,label:"Institutional risk",invert:!0}];for(const d of f){const J=d.invert?d.value>60?"#c55":d.value>40?"#ca5":"#5c5":d.value>=50?"#5c5":d.value>=30?"#ca5":d.value>=15?"#c84":"#c55";t+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${d.key}</span>
                <div style="width:40px;">${Y(d.value,100,J)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:18px;text-align:right;">${d.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${d.label}</span>
            </div>`}t+="</div>"}if(t+="</div>",t+='<div class="rd-right">',i==="LOAN"){t+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${k};">${v}%</span>
            </div>
            ${Y(v,100,k)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${k};margin-top:4px;">${q}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${W};">${M}%</span>
            </div>
            ${Y(M,100,W)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',t+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${n(_)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${n(p)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${n(o)}</span></div>`;const y=I>30?"#c55":I>15?"#ca5":"#5c5";t+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${y};">${I}% of revenue</span></div>`,t+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${n(X)}</span></div>`,t+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${v}% default)</div>`}if(i==="INSURE"){t+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${na};">${C}%</span>
            </div>
            ${Y(C,100,na)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',t+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${n(oa)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${n(h)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${n(ca)}</span></div>`;const y=Q>0?"":" negative",b=Q>0?"#5c5":"#c55";t+=`<div class="rd-expected${y}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${b};">${n(Q)}</span></div>`,t+=`<div class="rd-formula">Premiums (${n(h)}) − expected payout (${C}% × ${n(oa)})</div>`}i==="BOND"&&(t+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${ia};">${N}%</span>
            </div>
            ${Y(N,100,ia)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',t+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${n(R)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${n(ga)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(va)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${n(ua)}</span></div>`,t+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${n(ya)}</span></div>`,t+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${N}% default)</div>`),t+="</div>",t+="</div>";const ha=i==="LOAN"?_:i==="INSURE"?w:R,Ea=i==="LOAN"?X:i==="INSURE"?Q:ya,xa=i==="LOAN"?v:i==="INSURE"?C:N,wa=i==="LOAN"?k:i==="INSURE"?na:ia,Ra=i==="LOAN"?"ISSUE LOAN":i==="INSURE"?"WRITE POLICY":"BUY BONDS",Aa=i.toLowerCase();t+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${n(ha)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${n(Ea)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${wa};">${xa}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${Aa}">${Ra}</button>
        </div>
    </div>`,s.innerHTML=t}window.rdOpen=ka;window.rdClose=Oa;window.rdSetLoanRate=Ma;window.rdSetLoanAmount=Da;window.rdSetLoanTerm=Pa;window.rdSetCollateral=Ua;window.rdSetInsurePremium=Ba;window.rdSetInsureCoverage=za;window.rdSetInsureDeductible=Va;window.rdSetBondAmount=Fa;async function Ga(){const{data:{user:s}}=await F.auth.getUser();if(!s){window.location.href="login.html";return}const{data:a}=await F.from("factions").select("*").or(`id.eq.${s.id},linked_user_id.eq.${s.id}`);B=(a||[]).filter(m=>m.nation_id);const r=sessionStorage.getItem("active_faction_id");if(c=B.find(m=>m.id===r)||B.find(m=>m.faction_type==="corporation")||B[0],!c){await F.auth.signOut(),window.location.href="login.html";return}if(c.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(c.corp_sector!=="Finance"){window.location.href="corp-operations.html"+window.location.search;return}sessionStorage.setItem("active_faction_id",c.id);const[p,o]=await Promise.all([c.nation_id?F.from("nations").select("*").eq("id",c.nation_id).single():Promise.resolve({data:null}),F.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);p.data&&p.data,P=o.data,document.getElementById("corp-name-bar").textContent=c.faction_name||"Corp",document.getElementById("corp-name-badge").textContent=(c.abbreviation||c.corp_ticker||c.faction_name||"--").toUpperCase(),document.getElementById("topbar-cash").textContent="CASH: "+n(Number(c.corp_cash_reserves)||0),P&&(document.getElementById("game-date").textContent=P.current_date||La(P.current_tick),document.getElementById("tick-number").textContent=P.current_tick||"--"),Ha(),da(),P?.next_tick_at&&Ka(P.next_tick_at)}function Ha(){const s=document.getElementById("corp-faction-dropdown");if(!s||B.length<=1)return;let a="";for(const r of B){const p=r.id===c.id,o=r.faction_type==="corporation"?"CORP":"PARTY";a+=`<div class="corp-faction-dropdown__item${p?" active":""}" onclick="switchFaction('${r.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${r.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${r.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${r.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${o}</span>
            <span>${u(r.faction_name||"--")}</span>
        </div>`}s.innerHTML=a}function qa(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function ja(s){sessionStorage.setItem("active_faction_id",s);const a=B.find(r=>r.id===s);a&&a.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}function Ya(){document.body.classList.toggle("light-mode");const s=document.body.classList.contains("light-mode");localStorage.setItem("theme",s?"light":"dark"),document.getElementById("theme-toggle").textContent=s?"Dark":"Light"}async function Wa(){await F.auth.signOut(),window.location.href="login.html"}function Ka(s){const a=document.getElementById("tick-countdown");function r(){const p=new Date(s)-new Date;if(p<=0){a.textContent="Processing...";return}const o=Math.floor(p/36e5),m=Math.floor(p%36e5/6e4),I=Math.floor(p%6e4/1e3);a.textContent=`${o}h ${m}m ${I}s`}r(),setInterval(r,1e3)}localStorage.getItem("theme")==="light"&&(document.body.classList.add("light-mode"),document.getElementById("theme-toggle").textContent="Dark");window.toggleCorpDropdown=qa;window.switchFaction=ja;window.toggleTheme=Ya;window.doLogout=Wa;Ga();
