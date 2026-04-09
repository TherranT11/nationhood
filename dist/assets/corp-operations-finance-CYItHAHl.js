import{_ as K}from"./supabase-client-BXEzLDpS.js";import{t as Oa,e as b}from"./utils-C2W-HleY.js";let Y=[],y=null,F=null;function l(s){return Math.abs(s)>=1e6?"$"+(s/1e6).toFixed(1)+"M":Math.abs(s)>=1e3?"$"+(s/1e3).toFixed(0)+"k":"$"+Math.round(s).toLocaleString()}const Aa={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},ka={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}},T=[];let sa="ALL",H=-1;function $a(s){if(!y)return!1;const a=(y.corp_subsector||"").toLowerCase(),c=za[a];return s.type===c}function Da(s){sa=s,H=-1,va()}function Ma(s){H=H===s?-1:s,va()}function va(){const s=document.getElementById("df-container");if(!s)return;const a=sa==="ALL"?T:T.filter(r=>r.type===sa),c=T.filter(r=>r.isNew).length,m=T.length;let n=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${c>0?`<span class="df-badge df-badge-corp" style="font-size:8px;">${c} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${m} OPEN</span>
        </div>
    </div>`;const i=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];n+='<div class="df-filters">';for(const r of i)n+=`<span class="df-pill${sa===r.id?" "+r.activeClass:""}" onclick="dfSetFilter('${r.id}')">${r.label}</span>`;n+="</div>",n+='<div class="df-list">',a.length===0&&(n+='<div class="ap-empty">No deals available.<br>Deals appear when corporations request financing or governments issue bonds.</div>');for(let r=0;r<a.length;r++){const e=a[r],p=T.indexOf(e),E=H===p,U=Aa[e.type],h=ka[e.risk],N=$a(e);n+=`<div class="df-deal${E?" sel-"+U.class:""}" onclick="dfSelectDeal(${p})" style="${N?"":"opacity:0.5;"}">`,e.isNew&&N&&(n+='<div class="df-new-dot"></div>'),n+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span class="df-badge df-badge-${U.class}">${U.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;">${b(e.applicant)}</span>
            <span class="df-badge df-badge-${e.entity.toLowerCase()}">${e.entity}</span>
            ${N?"":'<span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`,n+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${b(e.nation.toUpperCase())}</span>
            <span class="df-badge ${h.class}" style="font-weight:700;line-height:12px;background:currentColor;-webkit-background-clip:unset;padding:0 4px;">`,n+="</span>",n=n.slice(0,n.lastIndexOf('<span class="df-badge '+h.class));const V=h.class==="df-risk-low"?"#5c5":h.class==="df-risk-moderate"?"#ca5":h.class==="df-risk-elevated"?"#c84":"#c55";n+=`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${V};background:${V}12;border:1px solid ${V}25;">${h.label}</span>
        </div>`;const Z=e.type==="BOND"?"FACE VALUE":e.type==="INSURE"?"COVERAGE":"AMOUNT",C=e.type==="BOND"?"COUPON":"REP",j=e.type==="BOND"?e.couponRate+"%":e.reputation||e.stability,q=e.type==="BOND"?e.couponRate*10:e.reputation||e.stability,X=e.type==="BOND"?"#c8a832":q>=60?"#5c5":q>=35?"#ca5":"#c84";if(n+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${Z}</div>
                <div class="df-metrics__value" style="font-size:12px;color:#e8e4dc;">${l(e.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:11px;color:#e8e4dc;">${e.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${C}</div>
                <div class="df-metrics__value" style="font-size:11px;color:${X};">${j}</div>
            </div>
        </div>`,E){if(n+=`<div style="margin-top:6px;font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(e.purpose)}</div>`,N)n+='<div class="df-detail">';else{const $=e.type==="LOAN"?"Banking":e.type==="INSURE"?"Insurance":"Investment";n+=`<div style="padding:6px 8px;background:rgba(106,102,96,0.06);border:1px solid #2a2a24;font-family:var(--font-mono);font-size:8px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:#e8e4dc;font-weight:700;">${$}</span> subsector to underwrite.
                    ${y?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+b(y.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(N){if(e.type==="LOAN"){const $=Math.round(e.debt/e.revenue*100),A=$>50?"#c84":"#5c5",g=e.debt>e.revenue*.5?"#c84":"#9e9a92";n+=`<div class="df-detail-row"><span class="df-detail-label">ANNUAL REVENUE</span><span class="df-detail-value" style="color:#9e9a92;">${l(e.revenue)}</span></div>`,n+=`<div class="df-detail-row"><span class="df-detail-label">EXISTING DEBT</span><span class="df-detail-value" style="color:${g};">${l(e.debt)}</span></div>`,n+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/REVENUE</span><span class="df-detail-value" style="color:${A};font-weight:700;">${$}%</span></div>`}else if(e.type==="BOND"){const $=e.stability>=50?"#5c5":e.stability>=30?"#ca5":"#c84",A=e.debtToGdp>60?"#c55":e.debtToGdp>40?"#c84":"#5c5",g=e.creditRating>=60?"#5c5":e.creditRating>=35?"#ca5":"#c55";n+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${$};">${e.stability}/100</span></div>`,n+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${A};">${e.debtToGdp}%</span></div>`,n+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${g};font-weight:700;">${e.creditRating}/100</span></div>`}else if(e.type==="INSURE"){const $=e.reputation>=60?"#5c5":e.reputation>=35?"#ca5":"#c84",A=e.projectValue?"PROJECT VALUE":"FLEET VALUE",g=e.projectValue||e.fleetValue;n+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${$};">${e.reputation}/100</span></div>`,n+=`<div class="df-detail-row"><span class="df-detail-label">${A}</span><span class="df-detail-value" style="color:#9e9a92;">${l(g)}</span></div>`}n+="</div>"}}n+="</div>"}n+="</div>";const d=T.filter(r=>r.type==="LOAN").length,t=T.filter(r=>r.type==="INSURE").length,x=T.filter(r=>r.type==="BOND").length;n+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${d}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${t}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${x}</span></div>
        </div>
        ${(()=>{const r=H>=0?T[H]:null,e=r&&$a(r);return e?`<div class="df-review-btn active" onclick="rdOpen(${H})">REVIEW DEAL</div>`:r&&!e?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,s.innerHTML=n}window.dfSetFilter=Da;window.dfSelectDeal=Ma;const Ea={CURRENT:{color:"#5c5",label:"CURRENT"},LATE:{color:"#c84",label:"LATE"},DELINQUENT:{color:"#c55",label:"DELINQUENT"},CLAIM:{color:"#c55",label:"CLAIM FILED"},ACTIVE:{color:"#5c5",label:"ACTIVE"},WATCHLIST:{color:"#ca5",label:"WATCHLIST"},DEFAULT:{color:"#c55",label:"DEFAULT"}};let S=[],oa="ALL",la=-1;function Ua(s){oa=s,la=-1,fa()}function Pa(s){la=la===s?-1:s,fa()}function fa(){const s=document.getElementById("ap-container");if(!s)return;const a=oa==="ALL"?S:S.filter(d=>d.type===oa),c=S.reduce((d,t)=>d+(t.remaining||t.coverage||t.faceValue||0),0),m=S.reduce((d,t)=>d+(t.earned||t.premiumsCollected||t.couponsReceived||0),0),n=S.filter(d=>d.alert).length;let i=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Active Portfolio</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${n>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:#c55;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);">${n} ALERT${n>1?"S":""}</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${S.length} ACTIVE</span>
        </div>
    </div>`;i+=`<div class="ap-summary">
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EXPOSURE</div>
            <div class="ap-summary__value" style="font-size:14px;color:#c55;">${l(c)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EARNED</div>
            <div class="ap-summary__value" style="font-size:14px;color:#5c5;">${l(m)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:0.6;">
            <div class="ap-summary__label">DEALS</div>
            <div style="display:flex;gap:4px;margin-top:3px;">
                ${["LOAN","INSURE","BOND"].map(d=>{const t=S.filter(r=>r.type===d).length;return`<div style="display:flex;align-items:center;gap:2px;"><div style="width:4px;height:4px;background:${d==="LOAN"?"#5a8aaa":d==="INSURE"?"#aa7a5a":"#8a6aaa"};border-radius:1px;"></div><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#9e9a92;">${t}</span></div>`}).join("")}
            </div>
        </div>
    </div>`,i+='<div class="df-filters">';for(const d of[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Policies",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}])i+=`<span class="df-pill${oa===d.id?" "+d.activeClass:""}" onclick="apSetFilter('${d.id}')">${d.label}</span>`;i+="</div>",i+='<div class="ap-list">',a.length===0&&(i+='<div class="ap-empty">No active positions.<br>Review deals from the Deal Flow to build your portfolio.</div>');for(let d=0;d<a.length;d++){const t=a[d],x=S.indexOf(t),r=la===x,e=Aa[t.type],p=Ea[t.status]||Ea.CURRENT,E=!!t.alert,U=t.elapsed||0,h=t.term||1,N=Math.round(U/h*100),V=E?p.color==="#c55"?"alert-red":p.color==="#c84"?"alert-orange":"alert-yellow":"";i+=`<div class="ap-deal ${V}" onclick="apToggle(${x})">
            <div class="ap-deal__inner" style="${r?"background:"+(e.class==="loan"?"rgba(90,138,170,0.08)":e.class==="insure"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,i+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${e.class}">${e.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;flex:1;">${b(t.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${p.color};background:${p.color}12;border:1px solid ${p.color}25;">${p.label}</span>
        </div>`,i+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${b((t.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${U}/${h}mo — ${N}%</span>
        </div>`;const Z=E?p.color:e.class==="loan"?"#5a8aaa":e.class==="insure"?"#aa7a5a":"#8a6aaa";i+=`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(N,100)}%;background:${Z};"></div></div>`;const C=t.type==="LOAN"?"REMAINING":t.type==="INSURE"?"COVERAGE":"FACE VALUE",j=t.remaining||t.coverage||t.faceValue||0,q=t.type==="LOAN"?"RATE":t.type==="INSURE"?"PREMIUM":"COUPON",X=t.rate||t.premiumRate||t.coupon||0,$=t.earned||t.premiumsCollected||t.couponsReceived||0,A=e.class==="loan"?"#5a8aaa":e.class==="insure"?"#aa7a5a":"#8a6aaa";if(i+=`<div class="df-metrics" style="margin-top:4px;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${C}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#e8e4dc;margin-top:1px;">${l(j)}</div>
            </div>
            <div style="flex:0.8;padding:3px 6px;text-align:center;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${q}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${A};margin-top:1px;">${X}%</div>
            </div>
            <div style="flex:1;padding:3px 6px;text-align:right;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">EARNED</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5c5;margin-top:1px;">${l($)}</div>
            </div>
        </div>`,E&&(i+=`<div class="ap-deal__alert" style="background:${p.color}08;border:1px solid ${p.color}20;color:${p.color};">${b(t.alert)}</div>`),r){if(i+='<div class="ap-deal__expanded">',t.type==="LOAN"){const g=[{label:"PRINCIPAL",value:l(t.principal||0)},{label:"REMAINING",value:l(t.remaining||0),color:"#e8e4dc"},{label:"MONTHLY PAYMENT",value:l(t.monthlyPayment||0)},{label:"MISSED PAYMENTS",value:String(t.missedPayments||0),color:(t.missedPayments||0)>0?"#c55":"#5c5"},{label:"NEXT DUE",value:t.nextPayment||"—",color:t.status==="LATE"?"#c55":"#9e9a92"}];for(const f of g)i+=`<div class="ap-detail-row"><span class="ap-detail-label">${f.label}</span><span class="ap-detail-value" style="color:${f.color||"#9e9a92"};">${f.value}</span></div>`;t.status!=="CURRENT"&&(i+='<div class="ap-actions"><div class="ap-action-btn green">RESTRUCTURE</div><div class="ap-action-btn orange">CALL LOAN</div><div class="ap-action-btn red">FORECLOSE</div></div>')}else if(t.type==="INSURE"){const g=[{label:"COVERAGE",value:l(t.coverage||0)},{label:"PREMIUMS COLLECTED",value:l(t.premiumsCollected||0),color:"#5c5"},{label:"CLAIMS FILED",value:String(t.claims||0),color:(t.claims||0)>0?"#c84":"#5c5"},{label:"PAID OUT",value:l(t.paidOut||0),color:(t.paidOut||0)>0?"#c55":"#6a6660"}];for(const f of g)i+=`<div class="ap-detail-row"><span class="ap-detail-label">${f.label}</span><span class="ap-detail-value" style="color:${f.color||"#9e9a92"};">${f.value}</span></div>`;t.status==="CLAIM"&&t.claimAmount&&(i+=`<div class="ap-claim-box"><div style="font-family:var(--font-mono);font-size:7px;color:#c55;letter-spacing:0.8px;margin-bottom:2px;">PENDING CLAIM</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${l(t.claimAmount)}</div></div>`,i+='<div class="ap-actions"><div class="ap-action-btn green">PAY IN FULL</div><div class="ap-action-btn orange">NEGOTIATE</div><div class="ap-action-btn red">DISPUTE</div></div>')}else if(t.type==="BOND"){const g=[{label:"FACE VALUE",value:l(t.faceValue||0)},{label:"COUPONS RECEIVED",value:l(t.couponsReceived||0),color:"#5c5"},{label:"NEXT COUPON",value:t.nextCoupon||"—"},{label:"ANNUAL YIELD",value:l(Math.round((t.faceValue||0)*(t.coupon||0)/100)),color:"#8a6aaa"}];for(const f of g)i+=`<div class="ap-detail-row"><span class="ap-detail-label">${f.label}</span><span class="ap-detail-value" style="color:${f.color||"#9e9a92"};">${f.value}</span></div>`;i+='<div class="ap-actions"><div class="ap-action-btn purple">SELL POSITION</div><div class="ap-action-btn olive">HOLD</div></div>'}i+="</div>"}i+="</div></div>"}i+="</div>",i+=`<div class="df-footer">
        <div style="display:flex;gap:10px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EXPOSURE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${l(c)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EARNED</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;">${l(m)}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            ${["LOAN","INSURE","BOND"].map(d=>{const t=d==="LOAN"?"#5a8aaa":d==="INSURE"?"#aa7a5a":"#8a6aaa",x=S.filter(r=>r.type===d).length;return`<div style="text-align:center;padding:1px 6px;border:1px solid ${x>0?t+"33":"#2a2a24"};background:${x>0?t+"0a":"transparent"};"><div style="font-family:var(--font-mono);font-size:6px;color:${t};">${d}</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${x>0?"#e8e4dc":"#6a6660"};">${x}</div></div>`}).join("")}
        </div>
    </div>`,s.innerHTML=i}window.apSetFilter=Ua;window.apToggle=Pa;const za={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let na=null,v="LOAN",B=8,R=18e6,Q=24,O="equipment",J=3.5,k=12e6,G=10,D=25e6;const ha=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function Ba(s){const a=T[s];a&&(na=a,v=a.type,a.type==="LOAN"?(B=8,R=a.amount,Q=a.term||24,O="equipment"):a.type==="INSURE"?(J=3.5,k=a.amount,G=10):a.type==="BOND"&&(D=Math.round(a.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",M())}function Va(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",na=null}function Fa(s){B=Number(s),M()}function Ga(s){R=Number(s),M()}function Ya(s){Q=Number(s),M()}function Ha(s){O=s,M()}function ja(s){J=Number(s),M()}function qa(s){k=Number(s),M()}function Xa(s){G=Number(s),M()}function Wa(s){D=Number(s),M()}function aa(s,a,c){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(s/a*100,100)}%;background:${c};"></div></div>`}function M(){const s=document.getElementById("rd-modal");if(!s||!na)return;const a=na,c=v==="LOAN"?"#5a8aaa":v==="INSURE"?"#aa7a5a":"#8a6aaa",m=Math.round(R*(B/100)*(Q/12)),n=Math.round((R+m)/Q),i=a.revenue||474e5,d=Math.round(n/i*1200),t=12,x=Math.max(0,(B-6)*1.5),r=R>15e6?3:0,e=O==="none"?3:O==="full"?-2:0,p=Math.min(60,Math.max(2,Math.round(t+x+r+e))),E=p<=15?"#5c5":p<=30?"#ca5":p<=45?"#c84":"#c55",U=p<=15?"LOW":p<=30?"MODERATE":p<=45?"ELEVATED":"HIGH",h=95,N=(B-4)*8,V=R<(a.amount||18e6)?10:0,Z=O==="full"?15:O==="property"?8:O==="none"?-5:0,C=Math.max(10,Math.min(95,Math.round(h-N-V-Z))),j=C>=70?"#5c5":C>=45?"#ca5":C>=25?"#c84":"#c55",q=ha.find(L=>L.id===O),X=Math.round(m*(1-p/100)),$=(a.term||18)/12,A=Math.round(k*(J/100)*$),g=100-(a.reputation||50),f=Math.max(5,Math.min(50,Math.round(g*.4))),ia=Math.round(k*(1-G/100)),ua=Math.round(ia*(f/100)),ta=A-ua,da=f<=12?"#5c5":f<=22?"#ca5":f<=35?"#c84":"#c55",ra=a.couponRate||6.2,ma=a.term||60,ya=ma/12,La=Math.round(D*(ra/100)),ba=Math.round(D*(ra/100)*ya),W=a.stability||50,ga=a.creditRating||50,_a=a.debtToGdp||30,wa=Math.max(2,Math.round((100-W)*.15+(100-ga)*.15+Math.max(0,_a-30)*.3)),P=Math.min(60,wa),ca=P<=10?"#5c5":P<=20?"#ca5":P<=35?"#c84":"#c55",xa=Math.round(ba*(1-P/100));let o=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${c};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>`;if(o+=`<div class="rd-tabs">
        <span class="rd-tab ${v==="LOAN"?"active-loan":v==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${v==="LOAN"?"Loan":v==="INSURE"?"Insure":"Bond"} — ${b(a.applicant)}</span>
    </div></div>`,o+='<div class="rd-body">',o+='<div class="rd-left">',v==="LOAN"){const L=(a.reputation||50)>=60?"#5c5":(a.reputation||50)>=35?"#ca5":"#c84";o+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${b(a.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${b(a.applicant)}</span>
                <span class="df-badge df-badge-${a.entity.toLowerCase()}">${a.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REVENUE</div><div class="rd-applicant__stat-value" style="color:#5c5;">${l(a.revenue||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${l(a.debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${L};">${a.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${l(a.amount)}</div></div>
            </div>
        </div>`,o+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const w=(B-3)/15*100;o+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${B}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${B}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${w}%,#2a2a24 ${w}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`;const I=15e7,z=(R-5e6)/Math.max(1,I-5e6)*100;o+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">LOAN AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${l(R)}</span>
            </div>
            <input type="range" class="rd-control__range" min="5000000" max="${I}" step="5000000" value="${R}"
                oninput="rdSetLoanAmount(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${z}%,#2a2a24 ${z}%);">
            <div class="rd-control__hints"><span>$5M</span><span>$150M</span></div>
        </div>`,o+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">TERM (MONTHS)</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${Q}mo</span>
            </div>
            <div class="rd-presets">`;for(const _ of[12,24,36,48,60,72,84,96,108,120])o+=`<span class="rd-preset" onclick="rdSetLoanTerm(${_})" style="${Q===_?"color:#000;background:#5a8aaa;border-color:#5a8aaa;":""}">${_}</span>`;o+="</div></div>",o+=`<div class="rd-control">
            <div class="rd-control__label" style="margin-bottom:6px;">COLLATERAL REQUIREMENT</div>
            <div class="rd-presets">`;for(const _ of ha){const u=O===_.id;o+=`<div onclick="rdSetCollateral('${_.id}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${u?"rgba(90,138,170,0.09)":"transparent"};border:1px solid ${u?"rgba(90,138,170,0.27)":"#2a2a24"};">
                <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${u?"#5a8aaa":"#6a6660"};">${_.label}</div>
            </div>`}o+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">${q.desc}</div>
        </div>`}if(v==="INSURE"){const L=(a.reputation||50)>=60?"#5c5":(a.reputation||50)>=35?"#ca5":"#c84",w=a.projectValue?"PROJECT":"FLEET",I=a.projectValue||a.fleetValue||0;o+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${b(a.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${b(a.applicant)}</span>
                <span class="df-badge df-badge-${a.entity.toLowerCase()}">${a.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${L};">${a.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${w}</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${l(I)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${l(a.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${a.term}mo</div></div>
            </div>
        </div>`,o+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const z=(J-1)/7*100;o+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${J}%</span>
            </div>
            <input type="range" class="rd-control__range" min="1" max="8" step="0.5" value="${J}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${z}%,#2a2a24 ${z}%);">
            <div class="rd-control__hints"><span>1% (competitive)</span><span>8% (expensive)</span></div>
        </div>`;const _=Math.round((a.projectValue||a.fleetValue||a.amount)*.7),u=Math.round(a.amount*.33),ea=(k-u)/(_-u)*100;o+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${l(k)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${u}" max="${_}" step="1000000" value="${k}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${ea}%,#2a2a24 ${ea}%);">
            <div class="rd-control__hints"><span>${l(u)} (partial)</span><span>${l(_)} (max)</span></div>
        </div>`,o+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${G}%</span>
            </div>
            <div class="rd-presets">`;for(const pa of[5,10,15,20,25])o+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${pa})" style="${G===pa?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${pa}%</span>`;o+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${G}% of any claim (${l(Math.round(k*G/100))})</div>
        </div>`}if(v==="BOND"){const L=W>=50?"#5c5":W>=30?"#ca5":W>=15?"#c84":"#c55";o+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${b(a.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${l(a.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${ra}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${ma}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${L};">${W}</div></div>
            </div>
        </div>`,o+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const w=a.amount,I=Math.max(5e6,Math.ceil(w*.05/5e6)*5e6),z=(D-I)/(w-I)*100;o+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${l(D)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${I}" max="${w}" step="5000000" value="${D}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${z}%,#2a2a24 ${z}%);">
            <div class="rd-control__hints"><span>${l(I)} (small position)</span><span>${l(w)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,o+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const _=[{key:"stability",value:W,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:_a,label:"Debt burden",invert:!0},{key:"credit_rating",value:ga,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:a.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:a.corruption||62,label:"Institutional risk",invert:!0}];for(const u of _){const ea=u.invert?u.value>60?"#c55":u.value>40?"#ca5":"#5c5":u.value>=50?"#5c5":u.value>=30?"#ca5":u.value>=15?"#c84":"#c55";o+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${u.key}</span>
                <div style="width:40px;">${aa(u.value,100,ea)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:18px;text-align:right;">${u.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${u.label}</span>
            </div>`}o+="</div>"}if(o+="</div>",o+='<div class="rd-right">',v==="LOAN"){o+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',o+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${E};">${p}%</span>
            </div>
            ${aa(p,100,E)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${E};margin-top:4px;">${U}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,o+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',o+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${j};">${C}%</span>
            </div>
            ${aa(C,100,j)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,o+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',o+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${l(R)}</span></div>`,o+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${l(m)}</span></div>`,o+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${l(n)}</span></div>`;const L=d>30?"#c55":d>15?"#ca5":"#5c5";o+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${L};">${d}% of revenue</span></div>`,o+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${l(X)}</span></div>`,o+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${p}% default)</div>`}if(v==="INSURE"){o+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',o+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${da};">${f}%</span>
            </div>
            ${aa(f,100,da)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,o+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',o+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${l(ia)}</span></div>`,o+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${l(A)}</span></div>`,o+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${l(ua)}</span></div>`;const L=ta>0?"":" negative",w=ta>0?"#5c5":"#c55";o+=`<div class="rd-expected${L}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${w};">${l(ta)}</span></div>`,o+=`<div class="rd-formula">Premiums (${l(A)}) − expected payout (${f}% × ${l(ia)})</div>`}v==="BOND"&&(o+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',o+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${ca};">${P}%</span>
            </div>
            ${aa(P,100,ca)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,o+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',o+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${l(D)}</span></div>`,o+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${l(La)}</span></div>`,o+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(ya)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${l(ba)}</span></div>`,o+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${l(xa)}</span></div>`,o+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${P}% default)</div>`),o+="</div>",o+="</div>";const Ra=v==="LOAN"?R:v==="INSURE"?k:D,Na=v==="LOAN"?X:v==="INSURE"?ta:xa,Ta=v==="LOAN"?p:v==="INSURE"?f:P,Ca=v==="LOAN"?E:v==="INSURE"?da:ca,Ia=v==="LOAN"?"ISSUE LOAN":v==="INSURE"?"WRITE POLICY":"BUY BONDS",Sa=v.toLowerCase();o+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${l(Ra)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${l(Na)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${Ca};">${Ta}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${Sa}">${Ia}</button>
        </div>
    </div>`,s.innerHTML=o}window.rdOpen=Ba;window.rdClose=Va;window.rdSetLoanRate=Fa;window.rdSetLoanAmount=Ga;window.rdSetLoanTerm=Ya;window.rdSetCollateral=Ha;window.rdSetInsurePremium=ja;window.rdSetInsureCoverage=qa;window.rdSetInsureDeductible=Xa;window.rdSetBondAmount=Wa;async function Ka(){const{data:{user:s}}=await K.auth.getUser();if(!s){window.location.href="login.html";return}const{data:a}=await K.from("factions").select("*").or(`id.eq.${s.id},linked_user_id.eq.${s.id}`);Y=(a||[]).filter(i=>i.nation_id);const c=sessionStorage.getItem("active_faction_id");if(y=Y.find(i=>i.id===c)||Y.find(i=>i.faction_type==="corporation")||Y[0],!y){await K.auth.signOut(),window.location.href="login.html";return}if(y.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(y.corp_sector!=="Finance"){window.location.href="corp-operations.html"+window.location.search;return}sessionStorage.setItem("active_faction_id",y.id);const[m,n]=await Promise.all([y.nation_id?K.from("nations").select("*").eq("id",y.nation_id).single():Promise.resolve({data:null}),K.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);m.data&&m.data,F=n.data,document.getElementById("corp-name-bar").textContent=y.faction_name||"Corp",document.getElementById("corp-name-badge").textContent=(y.abbreviation||y.corp_ticker||y.faction_name||"--").toUpperCase(),document.getElementById("topbar-cash").textContent="CASH: "+l(Number(y.corp_cash_reserves)||0),F&&(document.getElementById("game-date").textContent=F.current_date||Oa(F.current_tick),document.getElementById("tick-number").textContent=F.current_tick||"--"),Qa(),va(),fa(),F?.next_tick_at&&et(F.next_tick_at)}function Qa(){const s=document.getElementById("corp-faction-dropdown");if(!s||Y.length<=1)return;let a="";for(const c of Y){const m=c.id===y.id,n=c.faction_type==="corporation"?"CORP":"PARTY";a+=`<div class="corp-faction-dropdown__item${m?" active":""}" onclick="switchFaction('${c.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${c.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${c.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${c.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${n}</span>
            <span>${b(c.faction_name||"--")}</span>
        </div>`}s.innerHTML=a}function Ja(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function Za(s){sessionStorage.setItem("active_faction_id",s);const a=Y.find(c=>c.id===s);a&&a.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}function at(){document.body.classList.toggle("light-mode");const s=document.body.classList.contains("light-mode");localStorage.setItem("theme",s?"light":"dark"),document.getElementById("theme-toggle").textContent=s?"Dark":"Light"}async function tt(){await K.auth.signOut(),window.location.href="login.html"}function et(s){const a=document.getElementById("tick-countdown");function c(){const m=new Date(s)-new Date;if(m<=0){a.textContent="Processing...";return}const n=Math.floor(m/36e5),i=Math.floor(m%36e5/6e4),d=Math.floor(m%6e4/1e3);a.textContent=`${n}h ${i}m ${d}s`}c(),setInterval(c,1e3)}localStorage.getItem("theme")==="light"&&(document.body.classList.add("light-mode"),document.getElementById("theme-toggle").textContent="Dark");window.toggleCorpDropdown=Ja;window.switchFaction=Za;window.toggleTheme=at;window.doLogout=tt;Ka();
