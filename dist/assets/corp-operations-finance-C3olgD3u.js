import{_ as Q}from"./supabase-client-BXEzLDpS.js";import{t as ka,e as _}from"./utils-C2W-HleY.js";let W=[],$=null,j=null;function s(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+Math.round(t).toLocaleString()}const Aa={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},Ma={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}},z=[];let oa="ALL",X=-1;function ha(t){if(!$)return!1;const a=($.corp_subsector||"").toLowerCase(),f=Va[a];return t.type===f}function Da(t){oa=t,X=-1,va()}function za(t){X=X===t?-1:t,va()}function va(){const t=document.getElementById("df-container");if(!t)return;const a=oa==="ALL"?z:z.filter(c=>c.type===oa),f=z.filter(c=>c.isNew).length,m=z.length;let r=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${f>0?`<span class="df-badge df-badge-corp" style="font-size:8px;">${f} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${m} OPEN</span>
        </div>
    </div>`;const i=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];r+='<div class="df-filters">';for(const c of i)r+=`<span class="df-pill${oa===c.id?" "+c.activeClass:""}" onclick="dfSetFilter('${c.id}')">${c.label}</span>`;r+="</div>",r+='<div class="df-list">',a.length===0&&(r+='<div class="ap-empty">No deals available.<br>Deals appear when corporations request financing or governments issue bonds.</div>');for(let c=0;c<a.length;c++){const o=a[c],u=z.indexOf(o),E=X===u,C=Aa[o.type],h=Ma[o.risk],A=ha(o);r+=`<div class="df-deal${E?" sel-"+C.class:""}" onclick="dfSelectDeal(${u})" style="${A?"":"opacity:0.5;"}">`,o.isNew&&A&&(r+='<div class="df-new-dot"></div>'),r+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span class="df-badge df-badge-${C.class}">${C.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;">${_(o.applicant)}</span>
            <span class="df-badge df-badge-${o.entity.toLowerCase()}">${o.entity}</span>
            ${A?"":'<span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`,r+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${_(o.nation.toUpperCase())}</span>
            <span class="df-badge ${h.class}" style="font-weight:700;line-height:12px;background:currentColor;-webkit-background-clip:unset;padding:0 4px;">`,r+="</span>",r=r.slice(0,r.lastIndexOf('<span class="df-badge '+h.class));const I=h.class==="df-risk-low"?"#5c5":h.class==="df-risk-moderate"?"#ca5":h.class==="df-risk-elevated"?"#c84":"#c55";r+=`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${I};background:${I}12;border:1px solid ${I}25;">${h.label}</span>
        </div>`;const M=o.type==="BOND"?"FACE VALUE":o.type==="INSURE"?"COVERAGE":"AMOUNT",R=o.type==="BOND"?"COUPON":"REP",D=o.type==="BOND"?o.couponRate+"%":o.reputation||o.stability,p=o.type==="BOND"?o.couponRate*10:o.reputation||o.stability,l=o.type==="BOND"?"#c8a832":p>=60?"#5c5":p>=35?"#ca5":"#c84";if(r+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${M}</div>
                <div class="df-metrics__value" style="font-size:12px;color:#e8e4dc;">${s(o.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:11px;color:#e8e4dc;">${o.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${R}</div>
                <div class="df-metrics__value" style="font-size:11px;color:${l};">${D}</div>
            </div>
        </div>`,E){if(r+=`<div style="margin-top:6px;font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${_(o.purpose)}</div>`,A)r+='<div class="df-detail">';else{const d=o.type==="LOAN"?"Banking":o.type==="INSURE"?"Insurance":"Investment";r+=`<div style="padding:6px 8px;background:rgba(106,102,96,0.06);border:1px solid #2a2a24;font-family:var(--font-mono);font-size:8px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:#e8e4dc;font-weight:700;">${d}</span> subsector to underwrite.
                    ${$?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+_($.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(A){if(o.type==="LOAN"){const d=Math.round(o.debt/o.revenue*100),g=d>50?"#c84":"#5c5",N=o.debt>o.revenue*.5?"#c84":"#9e9a92";r+=`<div class="df-detail-row"><span class="df-detail-label">ANNUAL REVENUE</span><span class="df-detail-value" style="color:#9e9a92;">${s(o.revenue)}</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">EXISTING DEBT</span><span class="df-detail-value" style="color:${N};">${s(o.debt)}</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/REVENUE</span><span class="df-detail-value" style="color:${g};font-weight:700;">${d}%</span></div>`}else if(o.type==="BOND"){const d=o.stability>=50?"#5c5":o.stability>=30?"#ca5":"#c84",g=o.debtToGdp>60?"#c55":o.debtToGdp>40?"#c84":"#5c5",N=o.creditRating>=60?"#5c5":o.creditRating>=35?"#ca5":"#c55";r+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${d};">${o.stability}/100</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${g};">${o.debtToGdp}%</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${N};font-weight:700;">${o.creditRating}/100</span></div>`}else if(o.type==="INSURE"){const d=o.reputation>=60?"#5c5":o.reputation>=35?"#ca5":"#c84",g=o.projectValue?"PROJECT VALUE":"FLEET VALUE",N=o.projectValue||o.fleetValue;r+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${d};">${o.reputation}/100</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">${g}</span><span class="df-detail-value" style="color:#9e9a92;">${s(N)}</span></div>`}r+="</div>"}}r+="</div>"}r+="</div>";const v=z.filter(c=>c.type==="LOAN").length,e=z.filter(c=>c.type==="INSURE").length,w=z.filter(c=>c.type==="BOND").length;r+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${v}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${e}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${w}</span></div>
        </div>
        ${(()=>{const c=X>=0?z[X]:null,o=c&&ha(c);return o?`<div class="df-review-btn active" onclick="rdOpen(${X})">REVIEW DEAL</div>`:c&&!o?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,t.innerHTML=r}window.dfSetFilter=Da;window.dfSelectDeal=za;const $a={CURRENT:{color:"#5c5",label:"CURRENT"},LATE:{color:"#c84",label:"LATE"},DELINQUENT:{color:"#c55",label:"DELINQUENT"},CLAIM:{color:"#c55",label:"CLAIM FILED"},ACTIVE:{color:"#5c5",label:"ACTIVE"},WATCHLIST:{color:"#ca5",label:"WATCHLIST"},DEFAULT:{color:"#c55",label:"DEFAULT"}};let L=[],sa="ALL",na=-1;function Ua(t){sa=t,na=-1,fa()}function Pa(t){na=na===t?-1:t,fa()}function fa(){const t=document.getElementById("ap-container");if(!t)return;const a=sa==="ALL"?L:L.filter(v=>v.type===sa),f=L.reduce((v,e)=>v+(e.remaining||e.coverage||e.faceValue||0),0),m=L.reduce((v,e)=>v+(e.earned||e.premiumsCollected||e.couponsReceived||0),0),r=L.filter(v=>v.alert).length;let i=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Active Portfolio</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${r>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:#c55;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);">${r} ALERT${r>1?"S":""}</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${L.length} ACTIVE</span>
        </div>
    </div>`;i+=`<div class="ap-summary">
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EXPOSURE</div>
            <div class="ap-summary__value" style="font-size:14px;color:#c55;">${s(f)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EARNED</div>
            <div class="ap-summary__value" style="font-size:14px;color:#5c5;">${s(m)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:0.6;">
            <div class="ap-summary__label">DEALS</div>
            <div style="display:flex;gap:4px;margin-top:3px;">
                ${["LOAN","INSURE","BOND"].map(v=>{const e=L.filter(c=>c.type===v).length;return`<div style="display:flex;align-items:center;gap:2px;"><div style="width:4px;height:4px;background:${v==="LOAN"?"#5a8aaa":v==="INSURE"?"#aa7a5a":"#8a6aaa"};border-radius:1px;"></div><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#9e9a92;">${e}</span></div>`}).join("")}
            </div>
        </div>
    </div>`,i+='<div class="df-filters">';for(const v of[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Policies",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}])i+=`<span class="df-pill${sa===v.id?" "+v.activeClass:""}" onclick="apSetFilter('${v.id}')">${v.label}</span>`;i+="</div>",i+='<div class="ap-list">',a.length===0&&(i+='<div class="ap-empty">No active positions.<br>Review deals from the Deal Flow to build your portfolio.</div>');for(let v=0;v<a.length;v++){const e=a[v],w=L.indexOf(e),c=na===w,o=Aa[e.type],u=$a[e.status]||$a.CURRENT,E=!!e.alert,C=e.elapsed||0,h=e.term||1,A=Math.round(C/h*100),I=E?u.color==="#c55"?"alert-red":u.color==="#c84"?"alert-orange":"alert-yellow":"";i+=`<div class="ap-deal ${I}" onclick="apToggle(${w})">
            <div class="ap-deal__inner" style="${c?"background:"+(o.class==="loan"?"rgba(90,138,170,0.08)":o.class==="insure"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,i+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${o.class}">${o.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;flex:1;">${_(e.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${u.color};background:${u.color}12;border:1px solid ${u.color}25;">${u.label}</span>
        </div>`,i+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${_((e.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${C}/${h}mo — ${A}%</span>
        </div>`;const M=E?u.color:o.class==="loan"?"#5a8aaa":o.class==="insure"?"#aa7a5a":"#8a6aaa";i+=`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(A,100)}%;background:${M};"></div></div>`;const R=e.type==="LOAN"?"REMAINING":e.type==="INSURE"?"COVERAGE":"FACE VALUE",D=e.remaining||e.coverage||e.faceValue||0,p=e.type==="LOAN"?"RATE":e.type==="INSURE"?"PREMIUM":"COUPON",l=e.rate||e.premiumRate||e.coupon||0,d=e.earned||e.premiumsCollected||e.couponsReceived||0,g=o.class==="loan"?"#5a8aaa":o.class==="insure"?"#aa7a5a":"#8a6aaa";if(i+=`<div class="df-metrics" style="margin-top:4px;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${R}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#e8e4dc;margin-top:1px;">${s(D)}</div>
            </div>
            <div style="flex:0.8;padding:3px 6px;text-align:center;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${p}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${g};margin-top:1px;">${l}%</div>
            </div>
            <div style="flex:1;padding:3px 6px;text-align:right;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">EARNED</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5c5;margin-top:1px;">${s(d)}</div>
            </div>
        </div>`,E&&(i+=`<div class="ap-deal__alert" style="background:${u.color}08;border:1px solid ${u.color}20;color:${u.color};">${_(e.alert)}</div>`),c){if(i+='<div class="ap-deal__expanded">',e.type==="LOAN"){const N=[{label:"PRINCIPAL",value:s(e.principal||0)},{label:"REMAINING",value:s(e.remaining||0),color:"#e8e4dc"},{label:"MONTHLY PAYMENT",value:s(e.monthlyPayment||0)},{label:"MISSED PAYMENTS",value:String(e.missedPayments||0),color:(e.missedPayments||0)>0?"#c55":"#5c5"},{label:"NEXT DUE",value:e.nextPayment||"—",color:e.status==="LATE"?"#c55":"#9e9a92"}];for(const b of N)i+=`<div class="ap-detail-row"><span class="ap-detail-label">${b.label}</span><span class="ap-detail-value" style="color:${b.color||"#9e9a92"};">${b.value}</span></div>`;e.status!=="CURRENT"&&(i+='<div class="ap-actions"><div class="ap-action-btn green">RESTRUCTURE</div><div class="ap-action-btn orange">CALL LOAN</div><div class="ap-action-btn red">FORECLOSE</div></div>')}else if(e.type==="INSURE"){const N=[{label:"COVERAGE",value:s(e.coverage||0)},{label:"PREMIUMS COLLECTED",value:s(e.premiumsCollected||0),color:"#5c5"},{label:"CLAIMS FILED",value:String(e.claims||0),color:(e.claims||0)>0?"#c84":"#5c5"},{label:"PAID OUT",value:s(e.paidOut||0),color:(e.paidOut||0)>0?"#c55":"#6a6660"}];for(const b of N)i+=`<div class="ap-detail-row"><span class="ap-detail-label">${b.label}</span><span class="ap-detail-value" style="color:${b.color||"#9e9a92"};">${b.value}</span></div>`;e.status==="CLAIM"&&e.claimAmount&&(i+=`<div class="ap-claim-box"><div style="font-family:var(--font-mono);font-size:7px;color:#c55;letter-spacing:0.8px;margin-bottom:2px;">PENDING CLAIM</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${s(e.claimAmount)}</div></div>`,i+='<div class="ap-actions"><div class="ap-action-btn green">PAY IN FULL</div><div class="ap-action-btn orange">NEGOTIATE</div><div class="ap-action-btn red">DISPUTE</div></div>')}else if(e.type==="BOND"){const N=[{label:"FACE VALUE",value:s(e.faceValue||0)},{label:"COUPONS RECEIVED",value:s(e.couponsReceived||0),color:"#5c5"},{label:"NEXT COUPON",value:e.nextCoupon||"—"},{label:"ANNUAL YIELD",value:s(Math.round((e.faceValue||0)*(e.coupon||0)/100)),color:"#8a6aaa"}];for(const b of N)i+=`<div class="ap-detail-row"><span class="ap-detail-label">${b.label}</span><span class="ap-detail-value" style="color:${b.color||"#9e9a92"};">${b.value}</span></div>`;i+='<div class="ap-actions"><div class="ap-action-btn purple">SELL POSITION</div><div class="ap-action-btn olive">HOLD</div></div>'}i+="</div>"}i+="</div></div>"}i+="</div>",i+=`<div class="df-footer">
        <div style="display:flex;gap:10px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EXPOSURE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${s(f)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EARNED</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;">${s(m)}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            ${["LOAN","INSURE","BOND"].map(v=>{const e=v==="LOAN"?"#5a8aaa":v==="INSURE"?"#aa7a5a":"#8a6aaa",w=L.filter(c=>c.type===v).length;return`<div style="text-align:center;padding:1px 6px;border:1px solid ${w>0?e+"33":"#2a2a24"};background:${w>0?e+"0a":"transparent"};"><div style="font-family:var(--font-mono);font-size:6px;color:${e};">${v}</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${w>0?"#e8e4dc":"#6a6660"};">${w}</div></div>`}).join("")}
        </div>
    </div>`,t.innerHTML=i}window.apSetFilter=Ua;window.apToggle=Pa;function Ea(t,a){const f=t.reduce((m,r)=>m+r.value,0);return f===0?`<div class="rr-seg-bar" style="height:${a}px;background:#2a2a24;"></div>`:`<div class="rr-seg-bar" style="height:${a}px;">${t.map(m=>`<div style="width:${(m.value/f*100).toFixed(1)}%;height:100%;background:${m.color};"></div>`).join("")}</div>`}function Ba(){const t=document.getElementById("rr-container");if(!t)return;const a=Number($?.corp_cash_reserves)||0,f=L.filter(l=>l.type==="LOAN").reduce((l,d)=>l+(d.remaining||0),0),m=L.filter(l=>l.type==="INSURE").reduce((l,d)=>l+(d.coverage||0),0),r=L.filter(l=>l.type==="BOND").reduce((l,d)=>l+(d.faceValue||0),0),i=f+m+r,v=i,e=a+v,w=Math.round(i*.15),c=i>0?Math.round(a/i*100):100,o=c>=30?"HEALTHY":c>=20?"ADEQUATE":c>=15?"THIN":"CRITICAL",u=c>=30?"#5c5":c>=20?"#ca5":c>=15?"#c84":"#c55",E=Math.max(0,a-w),C={};for(const l of L){const d=l.nation||"Unknown",g=l.remaining||l.coverage||l.faceValue||0;C[d]=(C[d]||0)+g}const h=Object.entries(C).map(([l,d])=>({name:l,exposure:d,pct:i>0?Math.round(d/i*100):0})).sort((l,d)=>d.exposure-l.exposure),A={};for(const l of L){const d=l.type==="BOND"?"Government":l.sector||"Other",g=l.remaining||l.coverage||l.faceValue||0;A[d]=(A[d]||0)+g}const I=Object.entries(A).map(([l,d])=>({name:l,exposure:d,pct:i>0?Math.round(d/i*100):0})).sort((l,d)=>d.exposure-l.exposure),M=h.length>0?h[0].pct:0,R=M>60?"HIGH":M>40?"MODERATE":"LOW",D=R==="HIGH"?"#c55":R==="MODERATE"?"#ca5":"#5c5";let p=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Reserves & Risk</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${u};background:${u}12;border:1px solid ${u}25;">${o}</span>
    </div>`;if(p+='<div style="flex:1;overflow-y:auto;">',p+='<div class="rr-section-bar">Capital Position</div>',p+='<div class="rr-section">',p+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">TOTAL ASSETS</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${s(e)}</span>
    </div>`,p+=Ea([{value:a,color:"#5c5"},{value:v,color:"#8b9a6b"}],6),p+=`<div class="rr-seg-legend">
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#5c5;"></div>Cash ${s(a)}</div>
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#8b9a6b;"></div>Deployed ${s(v)}</div>
    </div>`,p+="</div>",p+='<div class="rr-section">',p+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">RESERVE RATIO</span>
        <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${u};">${c}%</span>
    </div>`,p+=`<div class="rd-bar" style="height:5px;"><div class="rd-bar__fill" style="width:${Math.min(c/60*100,100)}%;background:${u};"></div></div>`,p+=`<div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:3px;">
        <span style="color:#c55;">15% minimum</span><span>30% healthy</span><span style="color:#5c5;">60%+</span>
    </div>`,p+=`<div class="rr-reserve-cells">
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REQUIRED (15%)</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;margin-top:1px;">${s(w)}</div></div>
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">AVAILABLE TO DEPLOY</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${E>0?"#5c5":"#c55"};margin-top:1px;">${s(E)}</div></div>
    </div>`,p+="</div>",p+='<div class="rr-section-bar">Exposure by Type</div>',p+='<div class="rr-section">',i>0){p+=Ea([{value:f,color:"#5a8aaa"},{value:m,color:"#aa7a5a"},{value:r,color:"#8a6aaa"}],6),p+='<div style="margin-top:6px;">';const l=[{label:"Loans",value:f,color:"#5a8aaa",pct:i>0?Math.round(f/i*100):0},{label:"Insurance",value:m,color:"#aa7a5a",pct:i>0?Math.round(m/i*100):0},{label:"Bonds",value:r,color:"#8a6aaa",pct:i>0?Math.round(r/i*100):0}];for(let d=0;d<l.length;d++){const g=l[d];p+=`<div class="rr-type-row">
                <div style="width:6px;height:6px;background:${g.color};margin-right:6px;"></div>
                <span style="flex:1;font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${g.label}</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${s(g.value)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;width:28px;text-align:right;">${g.pct}%</span>
            </div>`}p+="</div>"}else p+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No exposure</div>';if(p+="</div>",p+=`<div class="rr-section-bar" style="display:flex;justify-content:space-between;align-items:center;">
        <span>Concentration Risk</span>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${D};background:${D}12;border:1px solid ${D}25;">${R}</span>
    </div>`,p+='<div class="rr-section">',h.length>0){p+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">BY NATION</div>';for(const l of h){const d=l.pct>50?"#c84":l.pct>30?"#ca5":"#5c5";p+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;width:52px;text-align:center;">${_(l.name.toUpperCase().slice(0,6))}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${l.pct}%;background:${d};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${s(l.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${l.pct>50?"#c84":"#9e9a92"};">${l.pct}%</span>
            </div>`}}if(I.length>0){p+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-top:8px;margin-bottom:4px;">BY SECTOR</div>';for(const l of I){const d=l.pct>50?"#c84":l.pct>30?"#ca5":"#5c5";p+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:52px;">${_(l.name)}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${l.pct}%;background:${d};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${s(l.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${l.pct>50?"#c84":"#9e9a92"};">${l.pct}%</span>
            </div>`}}h.length===0&&I.length===0&&(p+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No positions to analyze</div>'),p+="</div>",M>60&&h.length>0&&(p+=`<div class="rr-warning"><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c55;">CONCENTRATION WARNING: </span>${M}% of exposure is in ${_(h[0].name)}. A sovereign crisis or economic downturn in this nation would affect the majority of your portfolio. Consider diversifying across nations.</div>`),p+="</div>",p+=`<div class="df-footer" style="justify-content:space-between;">
        <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">DEPLOYABLE CAPITAL</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${E>0?"#5c5":"#c55"};">${s(E)}</div></div>
        <div style="text-align:right;"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">TOTAL EXPOSURE</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${s(i)}</div></div>
    </div>`,t.innerHTML=p}const Va={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let la=null,y="LOAN",Y=8,k=18e6,J=24,P="equipment",Z=3.5,B=12e6,q=10,V=25e6;const wa=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function Fa(t){const a=z[t];a&&(la=a,y=a.type,a.type==="LOAN"?(Y=8,k=a.amount,J=a.term||24,P="equipment"):a.type==="INSURE"?(Z=3.5,B=a.amount,q=10):a.type==="BOND"&&(V=Math.round(a.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",F())}function Ha(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",la=null}function Ga(t){Y=Number(t),F()}function Ya(t){k=Number(t),F()}function ja(t){J=Number(t),F()}function qa(t){P=t,F()}function Wa(t){Z=Number(t),F()}function Xa(t){B=Number(t),F()}function Ka(t){q=Number(t),F()}function Qa(t){V=Number(t),F()}function aa(t,a,f){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(t/a*100,100)}%;background:${f};"></div></div>`}function F(){const t=document.getElementById("rd-modal");if(!t||!la)return;const a=la,f=y==="LOAN"?"#5a8aaa":y==="INSURE"?"#aa7a5a":"#8a6aaa",m=Math.round(k*(Y/100)*(J/12)),r=Math.round((k+m)/J),i=a.revenue||474e5,v=Math.round(r/i*1200),e=12,w=Math.max(0,(Y-6)*1.5),c=k>15e6?3:0,o=P==="none"?3:P==="full"?-2:0,u=Math.min(60,Math.max(2,Math.round(e+w+c+o))),E=u<=15?"#5c5":u<=30?"#ca5":u<=45?"#c84":"#c55",C=u<=15?"LOW":u<=30?"MODERATE":u<=45?"ELEVATED":"HIGH",h=95,A=(Y-4)*8,I=k<(a.amount||18e6)?10:0,M=P==="full"?15:P==="property"?8:P==="none"?-5:0,R=Math.max(10,Math.min(95,Math.round(h-A-I-M))),D=R>=70?"#5c5":R>=45?"#ca5":R>=25?"#c84":"#c55",p=wa.find(O=>O.id===P),l=Math.round(m*(1-u/100)),d=(a.term||18)/12,g=Math.round(B*(Z/100)*d),N=100-(a.reputation||50),b=Math.max(5,Math.min(50,Math.round(N*.4))),ia=Math.round(B*(1-q/100)),ua=Math.round(ia*(b/100)),ta=g-ua,ra=b<=12?"#5c5":b<=22?"#ca5":b<=35?"#c84":"#c55",da=a.couponRate||6.2,ma=a.term||60,ya=ma/12,La=Math.round(V*(da/100)),ga=Math.round(V*(da/100)*ya),K=a.stability||50,ba=a.creditRating||50,xa=a.debtToGdp||30,Ra=Math.max(2,Math.round((100-K)*.15+(100-ba)*.15+Math.max(0,xa-30)*.3)),H=Math.min(60,Ra),ca=H<=10?"#5c5":H<=20?"#ca5":H<=35?"#c84":"#c55",_a=Math.round(ga*(1-H/100));let n=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${f};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>`;if(n+=`<div class="rd-tabs">
        <span class="rd-tab ${y==="LOAN"?"active-loan":y==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${y==="LOAN"?"Loan":y==="INSURE"?"Insure":"Bond"} — ${_(a.applicant)}</span>
    </div></div>`,n+='<div class="rd-body">',n+='<div class="rd-left">',y==="LOAN"){const O=(a.reputation||50)>=60?"#5c5":(a.reputation||50)>=35?"#ca5":"#c84";n+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${_(a.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${_(a.applicant)}</span>
                <span class="df-badge df-badge-${a.entity.toLowerCase()}">${a.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${_(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REVENUE</div><div class="rd-applicant__stat-value" style="color:#5c5;">${s(a.revenue||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${s(a.debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${O};">${a.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${s(a.amount)}</div></div>
            </div>
        </div>`,n+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const S=(Y-3)/15*100;n+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${Y}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${Y}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${S}%,#2a2a24 ${S}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`;const U=15e7,G=(k-5e6)/Math.max(1,U-5e6)*100;n+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">LOAN AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${s(k)}</span>
            </div>
            <input type="range" class="rd-control__range" min="5000000" max="${U}" step="5000000" value="${k}"
                oninput="rdSetLoanAmount(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${G}%,#2a2a24 ${G}%);">
            <div class="rd-control__hints"><span>$5M</span><span>$150M</span></div>
        </div>`,n+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">TERM (MONTHS)</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${J}mo</span>
            </div>
            <div class="rd-presets">`;for(const T of[12,24,36,48,60,72,84,96,108,120])n+=`<span class="rd-preset" onclick="rdSetLoanTerm(${T})" style="${J===T?"color:#000;background:#5a8aaa;border-color:#5a8aaa;":""}">${T}</span>`;n+="</div></div>",n+=`<div class="rd-control">
            <div class="rd-control__label" style="margin-bottom:6px;">COLLATERAL REQUIREMENT</div>
            <div class="rd-presets">`;for(const T of wa){const x=P===T.id;n+=`<div onclick="rdSetCollateral('${T.id}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${x?"rgba(90,138,170,0.09)":"transparent"};border:1px solid ${x?"rgba(90,138,170,0.27)":"#2a2a24"};">
                <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${x?"#5a8aaa":"#6a6660"};">${T.label}</div>
            </div>`}n+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">${p.desc}</div>
        </div>`}if(y==="INSURE"){const O=(a.reputation||50)>=60?"#5c5":(a.reputation||50)>=35?"#ca5":"#c84",S=a.projectValue?"PROJECT":"FLEET",U=a.projectValue||a.fleetValue||0;n+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${_(a.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${_(a.applicant)}</span>
                <span class="df-badge df-badge-${a.entity.toLowerCase()}">${a.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${_(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${O};">${a.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${S}</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${s(U)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${s(a.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${a.term}mo</div></div>
            </div>
        </div>`,n+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const G=(Z-1)/7*100;n+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${Z}%</span>
            </div>
            <input type="range" class="rd-control__range" min="1" max="8" step="0.5" value="${Z}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${G}%,#2a2a24 ${G}%);">
            <div class="rd-control__hints"><span>1% (competitive)</span><span>8% (expensive)</span></div>
        </div>`;const T=Math.round((a.projectValue||a.fleetValue||a.amount)*.7),x=Math.round(a.amount*.33),ea=(B-x)/(T-x)*100;n+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${s(B)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${x}" max="${T}" step="1000000" value="${B}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${ea}%,#2a2a24 ${ea}%);">
            <div class="rd-control__hints"><span>${s(x)} (partial)</span><span>${s(T)} (max)</span></div>
        </div>`,n+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${q}%</span>
            </div>
            <div class="rd-presets">`;for(const pa of[5,10,15,20,25])n+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${pa})" style="${q===pa?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${pa}%</span>`;n+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${q}% of any claim (${s(Math.round(B*q/100))})</div>
        </div>`}if(y==="BOND"){const O=K>=50?"#5c5":K>=30?"#ca5":K>=15?"#c84":"#c55";n+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${_(a.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${_(a.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${s(a.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${da}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${ma}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${O};">${K}</div></div>
            </div>
        </div>`,n+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const S=a.amount,U=Math.max(5e6,Math.ceil(S*.05/5e6)*5e6),G=(V-U)/(S-U)*100;n+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${s(V)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${U}" max="${S}" step="5000000" value="${V}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${G}%,#2a2a24 ${G}%);">
            <div class="rd-control__hints"><span>${s(U)} (small position)</span><span>${s(S)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,n+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const T=[{key:"stability",value:K,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:xa,label:"Debt burden",invert:!0},{key:"credit_rating",value:ba,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:a.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:a.corruption||62,label:"Institutional risk",invert:!0}];for(const x of T){const ea=x.invert?x.value>60?"#c55":x.value>40?"#ca5":"#5c5":x.value>=50?"#5c5":x.value>=30?"#ca5":x.value>=15?"#c84":"#c55";n+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${x.key}</span>
                <div style="width:40px;">${aa(x.value,100,ea)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:18px;text-align:right;">${x.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${x.label}</span>
            </div>`}n+="</div>"}if(n+="</div>",n+='<div class="rd-right">',y==="LOAN"){n+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',n+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${E};">${u}%</span>
            </div>
            ${aa(u,100,E)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${E};margin-top:4px;">${C}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,n+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',n+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${D};">${R}%</span>
            </div>
            ${aa(R,100,D)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,n+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',n+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${s(k)}</span></div>`,n+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${s(m)}</span></div>`,n+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${s(r)}</span></div>`;const O=v>30?"#c55":v>15?"#ca5":"#5c5";n+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${O};">${v}% of revenue</span></div>`,n+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${s(l)}</span></div>`,n+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${u}% default)</div>`}if(y==="INSURE"){n+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',n+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${ra};">${b}%</span>
            </div>
            ${aa(b,100,ra)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,n+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',n+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${s(ia)}</span></div>`,n+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${s(g)}</span></div>`,n+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${s(ua)}</span></div>`;const O=ta>0?"":" negative",S=ta>0?"#5c5":"#c55";n+=`<div class="rd-expected${O}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${S};">${s(ta)}</span></div>`,n+=`<div class="rd-formula">Premiums (${s(g)}) − expected payout (${b}% × ${s(ia)})</div>`}y==="BOND"&&(n+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',n+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${ca};">${H}%</span>
            </div>
            ${aa(H,100,ca)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,n+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',n+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${s(V)}</span></div>`,n+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${s(La)}</span></div>`,n+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(ya)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${s(ga)}</span></div>`,n+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${s(_a)}</span></div>`,n+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${H}% default)</div>`),n+="</div>",n+="</div>";const Na=y==="LOAN"?k:y==="INSURE"?B:V,Ta=y==="LOAN"?l:y==="INSURE"?ta:_a,Ca=y==="LOAN"?u:y==="INSURE"?b:H,Ia=y==="LOAN"?E:y==="INSURE"?ra:ca,Oa=y==="LOAN"?"ISSUE LOAN":y==="INSURE"?"WRITE POLICY":"BUY BONDS",Sa=y.toLowerCase();n+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${s(Na)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${s(Ta)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${Ia};">${Ca}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${Sa}">${Oa}</button>
        </div>
    </div>`,t.innerHTML=n}window.rdOpen=Fa;window.rdClose=Ha;window.rdSetLoanRate=Ga;window.rdSetLoanAmount=Ya;window.rdSetLoanTerm=ja;window.rdSetCollateral=qa;window.rdSetInsurePremium=Wa;window.rdSetInsureCoverage=Xa;window.rdSetInsureDeductible=Ka;window.rdSetBondAmount=Qa;async function Ja(){const{data:{user:t}}=await Q.auth.getUser();if(!t){window.location.href="login.html";return}const{data:a}=await Q.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);W=(a||[]).filter(i=>i.nation_id);const f=sessionStorage.getItem("active_faction_id");if($=W.find(i=>i.id===f)||W.find(i=>i.faction_type==="corporation")||W[0],!$){await Q.auth.signOut(),window.location.href="login.html";return}if($.faction_type!=="corporation"){window.location.href="dashboard.html";return}if($.corp_sector!=="Finance"){window.location.href="corp-operations.html"+window.location.search;return}sessionStorage.setItem("active_faction_id",$.id);const[m,r]=await Promise.all([$.nation_id?Q.from("nations").select("*").eq("id",$.nation_id).single():Promise.resolve({data:null}),Q.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);m.data&&m.data,j=r.data,document.getElementById("corp-name-bar").textContent=$.faction_name||"Corp",document.getElementById("corp-name-badge").textContent=($.abbreviation||$.corp_ticker||$.faction_name||"--").toUpperCase(),document.getElementById("topbar-cash").textContent="CASH: "+s(Number($.corp_cash_reserves)||0),j&&(document.getElementById("game-date").textContent=j.current_date||ka(j.current_tick),document.getElementById("tick-number").textContent=j.current_tick||"--"),Za(),va(),fa(),Ba(),j?.next_tick_at&&st(j.next_tick_at)}function Za(){const t=document.getElementById("corp-faction-dropdown");if(!t||W.length<=1)return;let a="";for(const f of W){const m=f.id===$.id,r=f.faction_type==="corporation"?"CORP":"PARTY";a+=`<div class="corp-faction-dropdown__item${m?" active":""}" onclick="switchFaction('${f.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${f.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${f.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${f.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${r}</span>
            <span>${_(f.faction_name||"--")}</span>
        </div>`}t.innerHTML=a}function at(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function tt(t){sessionStorage.setItem("active_faction_id",t);const a=W.find(f=>f.id===t);a&&a.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}function et(){document.body.classList.toggle("light-mode");const t=document.body.classList.contains("light-mode");localStorage.setItem("theme",t?"light":"dark"),document.getElementById("theme-toggle").textContent=t?"Dark":"Light"}async function ot(){await Q.auth.signOut(),window.location.href="login.html"}function st(t){const a=document.getElementById("tick-countdown");function f(){const m=new Date(t)-new Date;if(m<=0){a.textContent="Processing...";return}const r=Math.floor(m/36e5),i=Math.floor(m%36e5/6e4),v=Math.floor(m%6e4/1e3);a.textContent=`${r}h ${i}m ${v}s`}f(),setInterval(f,1e3)}localStorage.getItem("theme")==="light"&&(document.body.classList.add("light-mode"),document.getElementById("theme-toggle").textContent="Dark");window.toggleCorpDropdown=at;window.switchFaction=tt;window.toggleTheme=et;window.doLogout=ot;Ja();
