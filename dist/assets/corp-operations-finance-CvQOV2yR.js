import{_ as F}from"./supabase-client-BXEzLDpS.js";import{t as La,e as u}from"./utils-C2W-HleY.js";let B=[],c=null,P=null;function n(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+Math.round(e).toLocaleString()}const Ta={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},Ca={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}},$=[{type:"LOAN",applicant:"Salazar Construction",abbr:"SZC",entity:"CORP",nation:"Melizea",amount:18e6,purpose:"Equipment acquisition — Heavy Infrastructure expansion. 2 Tower Cranes, 3 Heavy Haulers.",term:24,reputation:65,revenue:474e5,debt:22e6,risk:"MODERATE",isNew:!0},{type:"BOND",applicant:"Republic of Melizea",abbr:"MEL",entity:"GOV",nation:"Melizea",amount:1e8,purpose:"National Infrastructure Bond — Series 2013-B. Funding highway and rail expansion over 5 years.",term:60,couponRate:6.2,stability:23,debtToGdp:42,creditRating:38,risk:"ELEVATED",isNew:!0},{type:"INSURE",applicant:"Constructora del Sur",abbr:"CDS",entity:"CORP",nation:"Melizea",amount:12e6,purpose:"Project liability insurance — San Maria Water Treatment Facility. Coverage for construction defects, delays, and third-party claims.",term:18,reputation:52,projectValue:285e5,risk:"MODERATE",isNew:!1},{type:"LOAN",applicant:"Torres & Vega Group",abbr:"TVG",entity:"CORP",nation:"Melizea",amount:5e6,purpose:"Working capital — bridge financing to cover material procurement pending contract payment.",term:6,reputation:34,revenue:148e5,debt:22e5,risk:"ELEVATED",isNew:!1},{type:"INSURE",applicant:"McKenna Construction",abbr:"MKAV",entity:"CORP",nation:"Avelia",amount:8e6,purpose:"Fleet insurance — 32 units of construction equipment across all active project sites.",term:12,reputation:38,fleetValue:164e5,risk:"LOW",isNew:!1},{type:"BOND",applicant:"Republic of Sangreza",abbr:"SNG",entity:"GOV",nation:"Sangreza",amount:45e6,purpose:"Emergency Fiscal Bond — Series 2013-A. Covering budget shortfall from commodity price collapse.",term:36,couponRate:9.8,stability:44,debtToGdp:68,creditRating:24,risk:"HIGH",isNew:!0}];let Z="ALL",z=-1;function ba(e){if(!c)return!1;const a=(c.corp_subsector||"").toLowerCase(),r=Ia[a];return e.type===r}function Na(e){Z=e,z=-1,da()}function Sa(e){z=z===e?-1:e,da()}function da(){const e=document.getElementById("df-container");if(!e)return;const a=Z==="ALL"?$:$.filter(i=>i.type===Z),r=$.filter(i=>i.isNew).length,p=$.length;let o=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${r>0?`<span class="df-badge df-badge-corp" style="font-size:8px;">${r} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${p} OPEN</span>
        </div>
    </div>`;const m=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];o+='<div class="df-filters">';for(const i of m)o+=`<span class="df-pill${Z===i.id?" "+i.activeClass:""}" onclick="dfSetFilter('${i.id}')">${i.label}</span>`;o+="</div>",o+='<div class="df-list">';for(let i=0;i<a.length;i++){const s=a[i],v=$.indexOf(s),k=z===v,q=Ta[s.type],L=Ca[s.risk],O=ba(s);o+=`<div class="df-deal${k?" sel-"+q.class:""}" onclick="dfSelectDeal(${v})" style="${O?"":"opacity:0.5;"}">`,s.isNew&&O&&(o+='<div class="df-new-dot"></div>'),o+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span class="df-badge df-badge-${q.class}">${q.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;">${u(s.applicant)}</span>
            <span class="df-badge df-badge-${s.entity.toLowerCase()}">${s.entity}</span>
            ${O?"":'<span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`,o+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${u(s.nation.toUpperCase())}</span>
            <span class="df-badge ${L.class}" style="font-weight:700;line-height:12px;background:currentColor;-webkit-background-clip:unset;padding:0 4px;">`,o+="</span>",o=o.slice(0,o.lastIndexOf('<span class="df-badge '+L.class));const j=L.class==="df-risk-low"?"#5c5":L.class==="df-risk-moderate"?"#ca5":L.class==="df-risk-elevated"?"#c84":"#c55";o+=`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${j};background:${j}12;border:1px solid ${j}25;">${L.label}</span>
        </div>`;const sa=s.type==="BOND"?"FACE VALUE":s.type==="INSURE"?"COVERAGE":"AMOUNT",M=s.type==="BOND"?"COUPON":"REP",W=s.type==="BOND"?s.couponRate+"%":s.reputation||s.stability,K=s.type==="BOND"?s.couponRate*10:s.reputation||s.stability,X=s.type==="BOND"?"#c8a832":K>=60?"#5c5":K>=35?"#ca5":"#c84";if(o+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${sa}</div>
                <div class="df-metrics__value" style="font-size:12px;color:#e8e4dc;">${n(s.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:11px;color:#e8e4dc;">${s.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${M}</div>
                <div class="df-metrics__value" style="font-size:11px;color:${X};">${W}</div>
            </div>
        </div>`,k){if(o+=`<div style="margin-top:6px;font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${u(s.purpose)}</div>`,O)o+='<div class="df-detail">';else{const g=s.type==="LOAN"?"Banking":s.type==="INSURE"?"Insurance":"Investment";o+=`<div style="padding:6px 8px;background:rgba(106,102,96,0.06);border:1px solid #2a2a24;font-family:var(--font-mono);font-size:8px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:#e8e4dc;font-weight:700;">${g}</span> subsector to underwrite.
                    ${c?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+u(c.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(O){if(s.type==="LOAN"){const g=Math.round(s.debt/s.revenue*100),E=g>50?"#c84":"#5c5",D=s.debt>s.revenue*.5?"#c84":"#9e9a92";o+=`<div class="df-detail-row"><span class="df-detail-label">ANNUAL REVENUE</span><span class="df-detail-value" style="color:#9e9a92;">${n(s.revenue)}</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">EXISTING DEBT</span><span class="df-detail-value" style="color:${D};">${n(s.debt)}</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/REVENUE</span><span class="df-detail-value" style="color:${E};font-weight:700;">${g}%</span></div>`}else if(s.type==="BOND"){const g=s.stability>=50?"#5c5":s.stability>=30?"#ca5":"#c84",E=s.debtToGdp>60?"#c55":s.debtToGdp>40?"#c84":"#5c5",D=s.creditRating>=60?"#5c5":s.creditRating>=35?"#ca5":"#c55";o+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${g};">${s.stability}/100</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${E};">${s.debtToGdp}%</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${D};font-weight:700;">${s.creditRating}/100</span></div>`}else if(s.type==="INSURE"){const g=s.reputation>=60?"#5c5":s.reputation>=35?"#ca5":"#c84",E=s.projectValue?"PROJECT VALUE":"FLEET VALUE",D=s.projectValue||s.fleetValue;o+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${g};">${s.reputation}/100</span></div>`,o+=`<div class="df-detail-row"><span class="df-detail-label">${E}</span><span class="df-detail-value" style="color:#9e9a92;">${n(D)}</span></div>`}o+="</div>"}}o+="</div>"}o+="</div>";const I=$.filter(i=>i.type==="LOAN").length,ta=$.filter(i=>i.type==="INSURE").length,ea=$.filter(i=>i.type==="BOND").length;o+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${I}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${ta}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${ea}</span></div>
        </div>
        ${(()=>{const i=z>=0?$[z]:null,s=i&&ba(i);return s?`<div class="df-review-btn active" onclick="rdOpen(${z})">REVIEW DEAL</div>`:i&&!s?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,e.innerHTML=o}window.dfSetFilter=Na;window.dfSelectDeal=Sa;const Ia={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let aa=null,l="LOAN",S=8,_=18e6,G=24,w="equipment",H=3.5,R=12e6,U=10,A=25e6;const _a=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function ka(e){const a=$[e];a&&(aa=a,l=a.type,a.type==="LOAN"?(S=8,_=a.amount,G=a.term||24,w="equipment"):a.type==="INSURE"?(H=3.5,R=a.amount,U=10):a.type==="BOND"&&(A=Math.round(a.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",h())}function Oa(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",aa=null}function Ma(e){l=e,h()}function Da(e){S=Number(e),h()}function Pa(e){_=Number(e),h()}function Ua(e){G=Number(e),h()}function Ba(e){w=e,h()}function za(e){H=Number(e),h()}function Va(e){R=Number(e),h()}function Fa(e){U=Number(e),h()}function Ga(e){A=Number(e),h()}function Y(e,a,r){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(e/a*100,100)}%;background:${r};"></div></div>`}function h(){const e=document.getElementById("rd-modal");if(!e||!aa)return;const a=aa,r=l==="LOAN"?"#5a8aaa":l==="INSURE"?"#aa7a5a":"#8a6aaa",p=Math.round(_*(S/100)*(G/12)),o=Math.round((_+p)/G),m=a.revenue||474e5,I=Math.round(o/m*1200),ta=12,ea=Math.max(0,(S-6)*1.5),i=_>15e6?3:0,s=w==="none"?3:w==="full"?-2:0,v=Math.min(60,Math.max(2,Math.round(ta+ea+i+s))),k=v<=15?"#5c5":v<=30?"#ca5":v<=45?"#c84":"#c55",q=v<=15?"LOW":v<=30?"MODERATE":v<=45?"ELEVATED":"HIGH",L=95,O=(S-4)*8,j=_<(a.amount||18e6)?10:0,sa=w==="full"?15:w==="property"?8:w==="none"?-5:0,M=Math.max(10,Math.min(95,Math.round(L-O-j-sa))),W=M>=70?"#5c5":M>=45?"#ca5":M>=25?"#c84":"#c55",K=_a.find(y=>y.id===w),X=Math.round(p*(1-v/100)),g=(a.term||18)/12,E=Math.round(R*(H/100)*g),D=100-(a.reputation||50),T=Math.max(5,Math.min(50,Math.round(D*.4))),oa=Math.round(R*(1-U/100)),ca=Math.round(oa*(T/100)),Q=E-ca,na=T<=12?"#5c5":T<=22?"#ca5":T<=35?"#c84":"#c55",la=a.couponRate||6.2,pa=a.term||60,va=pa/12,ga=Math.round(A*(la/100)),ua=Math.round(A*(la/100)*va),V=a.stability||50,fa=a.creditRating||50,ma=a.debtToGdp||30,$a=Math.max(2,Math.round((100-V)*.15+(100-fa)*.15+Math.max(0,ma-30)*.3)),C=Math.min(60,$a),ia=C<=10?"#5c5":C<=20?"#ca5":C<=35?"#c84":"#c55",ya=Math.round(ua*(1-C/100));let t=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${r};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div class="rd-tabs">`;if(t+=`<div class="rd-tabs">
        <span class="rd-tab ${l==="LOAN"?"active-loan":l==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${l==="LOAN"?"Loan":l==="INSURE"?"Insure":"Bond"} — ${u(a.applicant)}</span>
    </div></div>`,t+='<div class="rd-body">',t+='<div class="rd-left">',l==="LOAN"){const y=(a.reputation||50)>=60?"#5c5":(a.reputation||50)>=35?"#ca5":"#c84";t+=`<div class="rd-applicant">
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
        </div>`;const x=(_-5e6)/2e7*100,N=Math.round((a.amount||18e6)*1.4);t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">LOAN AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${n(_)}</span>
            </div>
            <input type="range" class="rd-control__range" min="5000000" max="${N}" step="1000000" value="${_}"
                oninput="rdSetLoanAmount(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${x}%,#2a2a24 ${x}%);">
            <div class="rd-control__hints"><span>$5M (partial)</span><span>${n(N)} (over-fund)</span></div>
        </div>`,t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">TERM (MONTHS)</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${G}mo</span>
            </div>
            <div class="rd-presets">`;for(const f of[6,12,18,24,36,48])t+=`<span class="rd-preset" onclick="rdSetLoanTerm(${f})" style="${G===f?"color:#000;background:#5a8aaa;border-color:#5a8aaa;":""}">${f}</span>`;t+="</div></div>",t+=`<div class="rd-control">
            <div class="rd-control__label" style="margin-bottom:6px;">COLLATERAL REQUIREMENT</div>
            <div class="rd-presets">`;for(const f of _a){const d=w===f.id;t+=`<div onclick="rdSetCollateral('${f.id}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${d?"rgba(90,138,170,0.09)":"transparent"};border:1px solid ${d?"rgba(90,138,170,0.27)":"#2a2a24"};">
                <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${d?"#5a8aaa":"#6a6660"};">${f.label}</div>
            </div>`}t+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">${K.desc}</div>
        </div>`}if(l==="INSURE"){const y=(a.reputation||50)>=60?"#5c5":(a.reputation||50)>=35?"#ca5":"#c84",b=a.projectValue?"PROJECT":"FLEET",x=a.projectValue||a.fleetValue||0;t+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${u(a.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${u(a.applicant)}</span>
                <span class="df-badge df-badge-${a.entity.toLowerCase()}">${a.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${u(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${y};">${a.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${b}</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(x)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(a.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${a.term}mo</div></div>
            </div>
        </div>`,t+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const N=(H-1)/7*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${H}%</span>
            </div>
            <input type="range" class="rd-control__range" min="1" max="8" step="0.5" value="${H}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${N}%,#2a2a24 ${N}%);">
            <div class="rd-control__hints"><span>1% (competitive)</span><span>8% (expensive)</span></div>
        </div>`;const f=Math.round((a.projectValue||a.fleetValue||a.amount)*.7),d=Math.round(a.amount*.33),J=(R-d)/(f-d)*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${n(R)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${d}" max="${f}" step="1000000" value="${R}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${J}%,#2a2a24 ${J}%);">
            <div class="rd-control__hints"><span>${n(d)} (partial)</span><span>${n(f)} (max)</span></div>
        </div>`,t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${U}%</span>
            </div>
            <div class="rd-presets">`;for(const ra of[5,10,15,20,25])t+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${ra})" style="${U===ra?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${ra}%</span>`;t+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${U}% of any claim (${n(Math.round(R*U/100))})</div>
        </div>`}if(l==="BOND"){const y=V>=50?"#5c5":V>=30?"#ca5":V>=15?"#c84":"#c55";t+=`<div class="rd-applicant">
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
        </div>`,t+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const b=a.amount,x=Math.round(b*.05),N=(A-x)/(b-x)*100;t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${n(A)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${x}" max="${b}" step="5000000" value="${A}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${N}%,#2a2a24 ${N}%);">
            <div class="rd-control__hints"><span>${n(x)} (small position)</span><span>${n(b)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,t+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const f=[{key:"stability",value:V,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:ma,label:"Debt burden",invert:!0},{key:"credit_rating",value:fa,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:a.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:a.corruption||62,label:"Institutional risk",invert:!0}];for(const d of f){const J=d.invert?d.value>60?"#c55":d.value>40?"#ca5":"#5c5":d.value>=50?"#5c5":d.value>=30?"#ca5":d.value>=15?"#c84":"#c55";t+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${d.key}</span>
                <div style="width:40px;">${Y(d.value,100,J)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:18px;text-align:right;">${d.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${d.label}</span>
            </div>`}t+="</div>"}if(t+="</div>",t+='<div class="rd-right">',l==="LOAN"){t+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',t+=`<div class="rd-control">
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
        </div>`,t+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',t+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${n(_)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${n(p)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${n(o)}</span></div>`;const y=I>30?"#c55":I>15?"#ca5":"#5c5";t+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${y};">${I}% of revenue</span></div>`,t+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${n(X)}</span></div>`,t+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${v}% default)</div>`}if(l==="INSURE"){t+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${na};">${T}%</span>
            </div>
            ${Y(T,100,na)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',t+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${n(oa)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${n(E)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${n(ca)}</span></div>`;const y=Q>0?"":" negative",b=Q>0?"#5c5":"#c55";t+=`<div class="rd-expected${y}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${b};">${n(Q)}</span></div>`,t+=`<div class="rd-formula">Premiums (${n(E)}) − expected payout (${T}% × ${n(oa)})</div>`}l==="BOND"&&(t+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',t+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${ia};">${C}%</span>
            </div>
            ${Y(C,100,ia)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,t+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',t+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${n(A)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${n(ga)}</span></div>`,t+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(va)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${n(ua)}</span></div>`,t+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${n(ya)}</span></div>`,t+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${C}% default)</div>`),t+="</div>",t+="</div>";const ha=l==="LOAN"?_:l==="INSURE"?R:A,Ea=l==="LOAN"?X:l==="INSURE"?Q:ya,xa=l==="LOAN"?v:l==="INSURE"?T:C,wa=l==="LOAN"?k:l==="INSURE"?na:ia,Ra=l==="LOAN"?"ISSUE LOAN":l==="INSURE"?"WRITE POLICY":"BUY BONDS",Aa=l.toLowerCase();t+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${n(ha)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${n(Ea)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${wa};">${xa}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${Aa}">${Ra}</button>
        </div>
    </div>`,e.innerHTML=t}window.rdOpen=ka;window.rdClose=Oa;window.rdSetTab=Ma;window.rdSetLoanRate=Da;window.rdSetLoanAmount=Pa;window.rdSetLoanTerm=Ua;window.rdSetCollateral=Ba;window.rdSetInsurePremium=za;window.rdSetInsureCoverage=Va;window.rdSetInsureDeductible=Fa;window.rdSetBondAmount=Ga;async function Ha(){const{data:{user:e}}=await F.auth.getUser();if(!e){window.location.href="login.html";return}const{data:a}=await F.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);B=(a||[]).filter(m=>m.nation_id);const r=sessionStorage.getItem("active_faction_id");if(c=B.find(m=>m.id===r)||B.find(m=>m.faction_type==="corporation")||B[0],!c){await F.auth.signOut(),window.location.href="login.html";return}if(c.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(c.corp_sector!=="Finance"){window.location.href="corp-operations.html"+window.location.search;return}sessionStorage.setItem("active_faction_id",c.id);const[p,o]=await Promise.all([c.nation_id?F.from("nations").select("*").eq("id",c.nation_id).single():Promise.resolve({data:null}),F.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);p.data&&p.data,P=o.data,document.getElementById("corp-name-bar").textContent=c.faction_name||"Corp",document.getElementById("corp-name-badge").textContent=(c.abbreviation||c.corp_ticker||c.faction_name||"--").toUpperCase(),document.getElementById("topbar-cash").textContent="CASH: "+n(Number(c.corp_cash_reserves)||0),P&&(document.getElementById("game-date").textContent=P.current_date||La(P.current_tick),document.getElementById("tick-number").textContent=P.current_tick||"--"),qa(),da(),P?.next_tick_at&&Xa(P.next_tick_at)}function qa(){const e=document.getElementById("corp-faction-dropdown");if(!e||B.length<=1)return;let a="";for(const r of B){const p=r.id===c.id,o=r.faction_type==="corporation"?"CORP":"PARTY";a+=`<div class="corp-faction-dropdown__item${p?" active":""}" onclick="switchFaction('${r.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${r.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${r.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${r.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${o}</span>
            <span>${u(r.faction_name||"--")}</span>
        </div>`}e.innerHTML=a}function ja(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function Ya(e){sessionStorage.setItem("active_faction_id",e);const a=B.find(r=>r.id===e);a&&a.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}function Wa(){document.body.classList.toggle("light-mode");const e=document.body.classList.contains("light-mode");localStorage.setItem("theme",e?"light":"dark"),document.getElementById("theme-toggle").textContent=e?"Dark":"Light"}async function Ka(){await F.auth.signOut(),window.location.href="login.html"}function Xa(e){const a=document.getElementById("tick-countdown");function r(){const p=new Date(e)-new Date;if(p<=0){a.textContent="Processing...";return}const o=Math.floor(p/36e5),m=Math.floor(p%36e5/6e4),I=Math.floor(p%6e4/1e3);a.textContent=`${o}h ${m}m ${I}s`}r(),setInterval(r,1e3)}localStorage.getItem("theme")==="light"&&(document.body.classList.add("light-mode"),document.getElementById("theme-toggle").textContent="Dark");window.toggleCorpDropdown=ja;window.switchFaction=Ya;window.toggleTheme=Wa;window.doLogout=Ka;Ha();
