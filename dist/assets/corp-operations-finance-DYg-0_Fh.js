import{_ as M}from"./supabase-client-BXEzLDpS.js";import{t as Ve,e as b}from"./utils-C2W-HleY.js";let W=[],g=null,S=null;function n(a){return Math.abs(a)>=1e6?"$"+(a/1e6).toFixed(1)+"M":Math.abs(a)>=1e3?"$"+(a/1e3).toFixed(0)+"k":"$"+Math.round(a).toLocaleString()}const be={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},qe={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}};let D=[],le="ALL",j=-1;async function Oe(){if(!g||!S)return;const{data:a}=await M.from("finance_loan_requests").select("*, requesting_faction:factions!requesting_faction_id(id, faction_name, abbreviation, corp_ticker, corp_subsector, nation_id)").eq("status","open").order("created_tick",{ascending:!1}),{data:e}=await M.from("finance_loan_offers").select("request_id").eq("offering_faction_id",g.id),p=new Set((e||[]).map(c=>c.request_id));D=(a||[]).map(c=>({id:c.id,type:"LOAN",applicant:c.requesting_faction?.faction_name||"Unknown",abbr:c.requesting_faction?.abbreviation||c.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:"N/A",amount:c.amount,term:c.term_months,purpose:c.purpose||"",reputation:50,creditRating:50,risk:"MODERATE",isNew:!p.has(c.id),ticksLeft:(c.expires_tick||0)-(S?.current_tick||0),collateral:c.collateral_type||"unsecured",requestId:c.id,alreadyOffered:p.has(c.id)})),_e()}function Re(a){if(!g)return!1;const e=(g.corp_subsector||"").toLowerCase(),p=Ke[e];return a.type===p}function He(a){le=a,j=-1,_e()}function Ye(a){j=j===a?-1:a,_e()}function _e(){const a=document.getElementById("df-container");if(!a)return;const e=le==="ALL"?D:D.filter(o=>o.type===le),p=D.filter(o=>o.isNew).length,c=D.length;let i=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${p>0?`<span class="df-badge df-badge-corp" style="font-size:8px;">${p} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${c} OPEN</span>
        </div>
    </div>`;const l=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];i+='<div class="df-filters">';for(const o of l)i+=`<span class="df-pill${le===o.id?" "+o.activeClass:""}" onclick="dfSetFilter('${o.id}')">${o.label}</span>`;i+="</div>",i+='<div class="df-list">',e.length===0&&(i+='<div class="ap-empty">No deals available.<br>Deals appear when corporations request financing or governments issue bonds.</div>');for(let o=0;o<e.length;o++){const s=e[o],y=D.indexOf(s),x=j===y,$=be[s.type],h=qe[s.risk],R=Re(s);i+=`<div class="df-deal${x?" sel-"+$.class:""}" onclick="dfSelectDeal(${y})" style="${R?"":"opacity:0.5;"}">`,s.isNew&&R&&(i+='<div class="df-new-dot"></div>'),i+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span class="df-badge df-badge-${$.class}">${$.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;">${b(s.applicant)}</span>
            <span class="df-badge df-badge-${s.entity.toLowerCase()}">${s.entity}</span>
            ${R?"":'<span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`,i+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${b(s.nation.toUpperCase())}</span>
            <span class="df-badge ${h.class}" style="font-weight:700;line-height:12px;background:currentColor;-webkit-background-clip:unset;padding:0 4px;">`,i+="</span>",i=i.slice(0,i.lastIndexOf('<span class="df-badge '+h.class));const I=h.class==="df-risk-low"?"#5c5":h.class==="df-risk-moderate"?"#ca5":h.class==="df-risk-elevated"?"#c84":"#c55";i+=`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${I};background:${I}12;border:1px solid ${I}25;">${h.label}</span>
        </div>`;const z=s.type==="BOND"?"FACE VALUE":s.type==="INSURE"?"COVERAGE":"AMOUNT",T=s.type==="BOND"?"COUPON":"REP",U=s.type==="BOND"?s.couponRate+"%":s.reputation||s.stability,m=s.type==="BOND"?s.couponRate*10:s.reputation||s.stability,r=s.type==="BOND"?"#c8a832":m>=60?"#5c5":m>=35?"#ca5":"#c84";if(i+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${z}</div>
                <div class="df-metrics__value" style="font-size:12px;color:#e8e4dc;">${n(s.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:11px;color:#e8e4dc;">${s.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${T}</div>
                <div class="df-metrics__value" style="font-size:11px;color:${r};">${U}</div>
            </div>
        </div>`,x){if(i+=`<div style="margin-top:6px;font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(s.purpose)}</div>`,R)i+='<div class="df-detail">';else{const f=s.type==="LOAN"?"Banking":s.type==="INSURE"?"Insurance":"Investment";i+=`<div style="padding:6px 8px;background:rgba(106,102,96,0.06);border:1px solid #2a2a24;font-family:var(--font-mono);font-size:8px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:#e8e4dc;font-weight:700;">${f}</span> subsector to underwrite.
                    ${g?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+b(g.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(R){if(s.type==="LOAN"){const f=Math.round(s.debt/s.revenue*100),E=f>50?"#c84":"#5c5",w=s.debt>s.revenue*.5?"#c84":"#9e9a92";i+=`<div class="df-detail-row"><span class="df-detail-label">ANNUAL REVENUE</span><span class="df-detail-value" style="color:#9e9a92;">${n(s.revenue)}</span></div>`,i+=`<div class="df-detail-row"><span class="df-detail-label">EXISTING DEBT</span><span class="df-detail-value" style="color:${w};">${n(s.debt)}</span></div>`,i+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/REVENUE</span><span class="df-detail-value" style="color:${E};font-weight:700;">${f}%</span></div>`}else if(s.type==="BOND"){const f=s.stability>=50?"#5c5":s.stability>=30?"#ca5":"#c84",E=s.debtToGdp>60?"#c55":s.debtToGdp>40?"#c84":"#5c5",w=s.creditRating>=60?"#5c5":s.creditRating>=35?"#ca5":"#c55";i+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${f};">${s.stability}/100</span></div>`,i+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${E};">${s.debtToGdp}%</span></div>`,i+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${w};font-weight:700;">${s.creditRating}/100</span></div>`}else if(s.type==="INSURE"){const f=s.reputation>=60?"#5c5":s.reputation>=35?"#ca5":"#c84",E=s.projectValue?"PROJECT VALUE":"FLEET VALUE",w=s.projectValue||s.fleetValue;i+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${f};">${s.reputation}/100</span></div>`,i+=`<div class="df-detail-row"><span class="df-detail-label">${E}</span><span class="df-detail-value" style="color:#9e9a92;">${n(w)}</span></div>`}i+="</div>"}}i+="</div>"}i+="</div>";const v=D.filter(o=>o.type==="LOAN").length,t=D.filter(o=>o.type==="INSURE").length,u=D.filter(o=>o.type==="BOND").length;i+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${v}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${t}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${u}</span></div>
        </div>
        ${(()=>{const o=j>=0?D[j]:null,s=o&&Re(o);return s?`<div class="df-review-btn active" onclick="rdOpen(${j})">REVIEW DEAL</div>`:o&&!s?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,a.innerHTML=i}window.dfSetFilter=He;window.dfSelectDeal=Ye;const Te={CURRENT:{color:"#5c5",label:"CURRENT"},LATE:{color:"#c84",label:"LATE"},DELINQUENT:{color:"#c55",label:"DELINQUENT"},CLAIM:{color:"#c55",label:"CLAIM FILED"},ACTIVE:{color:"#5c5",label:"ACTIVE"},WATCHLIST:{color:"#ca5",label:"WATCHLIST"},DEFAULT:{color:"#c55",label:"DEFAULT"}};let L=[],ie="ALL",ce=-1;function je(a){ie=a,ce=-1,de()}function Ge(a){ce=ce===a?-1:a,de()}function de(){const a=document.getElementById("ap-container");if(!a)return;const e=ie==="ALL"?L:L.filter(v=>v.type===ie),p=L.reduce((v,t)=>v+(t.remaining||t.coverage||t.faceValue||0),0),c=L.reduce((v,t)=>v+(t.earned||t.premiumsCollected||t.couponsReceived||0),0),i=L.filter(v=>v.alert).length;let l=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Active Portfolio</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${i>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:#c55;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);">${i} ALERT${i>1?"S":""}</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${L.length} ACTIVE</span>
        </div>
    </div>`;l+=`<div class="ap-summary">
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EXPOSURE</div>
            <div class="ap-summary__value" style="font-size:14px;color:#c55;">${n(p)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EARNED</div>
            <div class="ap-summary__value" style="font-size:14px;color:#5c5;">${n(c)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:0.6;">
            <div class="ap-summary__label">DEALS</div>
            <div style="display:flex;gap:4px;margin-top:3px;">
                ${["LOAN","INSURE","BOND"].map(v=>{const t=L.filter(o=>o.type===v).length;return`<div style="display:flex;align-items:center;gap:2px;"><div style="width:4px;height:4px;background:${v==="LOAN"?"#5a8aaa":v==="INSURE"?"#aa7a5a":"#8a6aaa"};border-radius:1px;"></div><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#9e9a92;">${t}</span></div>`}).join("")}
            </div>
        </div>
    </div>`,l+='<div class="df-filters">';for(const v of[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Policies",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}])l+=`<span class="df-pill${ie===v.id?" "+v.activeClass:""}" onclick="apSetFilter('${v.id}')">${v.label}</span>`;l+="</div>",l+='<div class="ap-list">',e.length===0&&(l+='<div class="ap-empty">No active positions.<br>Review deals from the Deal Flow to build your portfolio.</div>');for(let v=0;v<e.length;v++){const t=e[v],u=L.indexOf(t),o=ce===u,s=be[t.type],y=Te[t.status]||Te.CURRENT,x=!!t.alert,$=t.elapsed||0,h=t.term||1,R=Math.round($/h*100),I=x?y.color==="#c55"?"alert-red":y.color==="#c84"?"alert-orange":"alert-yellow":"";l+=`<div class="ap-deal ${I}" onclick="apToggle(${u})">
            <div class="ap-deal__inner" style="${o?"background:"+(s.class==="loan"?"rgba(90,138,170,0.08)":s.class==="insure"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,l+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${s.class}">${s.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;flex:1;">${b(t.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${y.color};background:${y.color}12;border:1px solid ${y.color}25;">${y.label}</span>
        </div>`,l+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${b((t.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${$}/${h}mo — ${R}%</span>
        </div>`;const z=x?y.color:s.class==="loan"?"#5a8aaa":s.class==="insure"?"#aa7a5a":"#8a6aaa";l+=`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(R,100)}%;background:${z};"></div></div>`;const T=t.type==="LOAN"?"REMAINING":t.type==="INSURE"?"COVERAGE":"FACE VALUE",U=t.remaining||t.coverage||t.faceValue||0,m=t.type==="LOAN"?"RATE":t.type==="INSURE"?"PREMIUM":"COUPON",r=t.rate||t.premiumRate||t.coupon||0,f=t.earned||t.premiumsCollected||t.couponsReceived||0,E=s.class==="loan"?"#5a8aaa":s.class==="insure"?"#aa7a5a":"#8a6aaa";if(l+=`<div class="df-metrics" style="margin-top:4px;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${T}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#e8e4dc;margin-top:1px;">${n(U)}</div>
            </div>
            <div style="flex:0.8;padding:3px 6px;text-align:center;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${m}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${E};margin-top:1px;">${r}%</div>
            </div>
            <div style="flex:1;padding:3px 6px;text-align:right;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">EARNED</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5c5;margin-top:1px;">${n(f)}</div>
            </div>
        </div>`,x&&(l+=`<div class="ap-deal__alert" style="background:${y.color}08;border:1px solid ${y.color}20;color:${y.color};">${b(t.alert)}</div>`),o){if(l+='<div class="ap-deal__expanded">',t.type==="LOAN"){const w=[{label:"PRINCIPAL",value:n(t.principal||0)},{label:"REMAINING",value:n(t.remaining||0),color:"#e8e4dc"},{label:"MONTHLY PAYMENT",value:n(t.monthlyPayment||0)},{label:"MISSED PAYMENTS",value:String(t.missedPayments||0),color:(t.missedPayments||0)>0?"#c55":"#5c5"},{label:"NEXT DUE",value:t.nextPayment||"—",color:t.status==="LATE"?"#c55":"#9e9a92"}];for(const N of w)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${N.label}</span><span class="ap-detail-value" style="color:${N.color||"#9e9a92"};">${N.value}</span></div>`;t.status!=="CURRENT"&&(l+='<div class="ap-actions"><div class="ap-action-btn green">RESTRUCTURE</div><div class="ap-action-btn orange">CALL LOAN</div><div class="ap-action-btn red">FORECLOSE</div></div>')}else if(t.type==="INSURE"){const w=[{label:"COVERAGE",value:n(t.coverage||0)},{label:"PREMIUMS COLLECTED",value:n(t.premiumsCollected||0),color:"#5c5"},{label:"CLAIMS FILED",value:String(t.claims||0),color:(t.claims||0)>0?"#c84":"#5c5"},{label:"PAID OUT",value:n(t.paidOut||0),color:(t.paidOut||0)>0?"#c55":"#6a6660"}];for(const N of w)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${N.label}</span><span class="ap-detail-value" style="color:${N.color||"#9e9a92"};">${N.value}</span></div>`;t.status==="CLAIM"&&t.claimAmount&&(l+=`<div class="ap-claim-box"><div style="font-family:var(--font-mono);font-size:7px;color:#c55;letter-spacing:0.8px;margin-bottom:2px;">PENDING CLAIM</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${n(t.claimAmount)}</div></div>`,l+='<div class="ap-actions"><div class="ap-action-btn green">PAY IN FULL</div><div class="ap-action-btn orange">NEGOTIATE</div><div class="ap-action-btn red">DISPUTE</div></div>')}else if(t.type==="BOND"){const w=[{label:"FACE VALUE",value:n(t.faceValue||0)},{label:"COUPONS RECEIVED",value:n(t.couponsReceived||0),color:"#5c5"},{label:"NEXT COUPON",value:t.nextCoupon||"—"},{label:"ANNUAL YIELD",value:n(Math.round((t.faceValue||0)*(t.coupon||0)/100)),color:"#8a6aaa"}];for(const N of w)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${N.label}</span><span class="ap-detail-value" style="color:${N.color||"#9e9a92"};">${N.value}</span></div>`;l+='<div class="ap-actions"><div class="ap-action-btn purple">SELL POSITION</div><div class="ap-action-btn olive">HOLD</div></div>'}l+="</div>"}l+="</div></div>"}l+="</div>",l+=`<div class="df-footer">
        <div style="display:flex;gap:10px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EXPOSURE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${n(p)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EARNED</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;">${n(c)}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            ${["LOAN","INSURE","BOND"].map(v=>{const t=v==="LOAN"?"#5a8aaa":v==="INSURE"?"#aa7a5a":"#8a6aaa",u=L.filter(o=>o.type===v).length;return`<div style="text-align:center;padding:1px 6px;border:1px solid ${u>0?t+"33":"#2a2a24"};background:${u>0?t+"0a":"transparent"};"><div style="font-family:var(--font-mono);font-size:6px;color:${t};">${v}</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${u>0?"#e8e4dc":"#6a6660"};">${u}</div></div>`}).join("")}
        </div>
    </div>`,a.innerHTML=l}window.apSetFilter=je;window.apToggle=Ge;function Ne(a,e){const p=a.reduce((c,i)=>c+i.value,0);return p===0?`<div class="rr-seg-bar" style="height:${e}px;background:#2a2a24;"></div>`:`<div class="rr-seg-bar" style="height:${e}px;">${a.map(c=>`<div style="width:${(c.value/p*100).toFixed(1)}%;height:100%;background:${c.color};"></div>`).join("")}</div>`}function Xe(){const a=document.getElementById("rr-container");if(!a)return;const e=Number(g?.corp_cash_reserves)||0,p=L.filter(r=>r.type==="LOAN").reduce((r,f)=>r+(f.remaining||0),0),c=L.filter(r=>r.type==="INSURE").reduce((r,f)=>r+(f.coverage||0),0),i=L.filter(r=>r.type==="BOND").reduce((r,f)=>r+(f.faceValue||0),0),l=p+c+i,v=l,t=e+v,u=Math.round(l*.15),o=l>0?Math.round(e/l*100):100,s=o>=30?"HEALTHY":o>=20?"ADEQUATE":o>=15?"THIN":"CRITICAL",y=o>=30?"#5c5":o>=20?"#ca5":o>=15?"#c84":"#c55",x=Math.max(0,e-u),$={};for(const r of L){const f=r.nation||"Unknown",E=r.remaining||r.coverage||r.faceValue||0;$[f]=($[f]||0)+E}const h=Object.entries($).map(([r,f])=>({name:r,exposure:f,pct:l>0?Math.round(f/l*100):0})).sort((r,f)=>f.exposure-r.exposure),R={};for(const r of L){const f=r.type==="BOND"?"Government":r.sector||"Other",E=r.remaining||r.coverage||r.faceValue||0;R[f]=(R[f]||0)+E}const I=Object.entries(R).map(([r,f])=>({name:r,exposure:f,pct:l>0?Math.round(f/l*100):0})).sort((r,f)=>f.exposure-r.exposure),z=h.length>0?h[0].pct:0,T=z>60?"HIGH":z>40?"MODERATE":"LOW",U=T==="HIGH"?"#c55":T==="MODERATE"?"#ca5":"#5c5";let m=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Reserves & Risk</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${y};background:${y}12;border:1px solid ${y}25;">${s}</span>
    </div>`;if(m+='<div style="flex:1;overflow-y:auto;">',m+='<div class="rr-section-bar">Capital Position</div>',m+='<div class="rr-section">',m+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">TOTAL ASSETS</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${n(t)}</span>
    </div>`,m+=Ne([{value:e,color:"#5c5"},{value:v,color:"#8b9a6b"}],6),m+=`<div class="rr-seg-legend">
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#5c5;"></div>Cash ${n(e)}</div>
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#8b9a6b;"></div>Deployed ${n(v)}</div>
    </div>`,m+="</div>",m+='<div class="rr-section">',m+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">RESERVE RATIO</span>
        <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${y};">${o}%</span>
    </div>`,m+=`<div class="rd-bar" style="height:5px;"><div class="rd-bar__fill" style="width:${Math.min(o/60*100,100)}%;background:${y};"></div></div>`,m+=`<div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:3px;">
        <span style="color:#c55;">15% minimum</span><span>30% healthy</span><span style="color:#5c5;">60%+</span>
    </div>`,m+=`<div class="rr-reserve-cells">
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REQUIRED (15%)</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;margin-top:1px;">${n(u)}</div></div>
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">AVAILABLE TO DEPLOY</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${x>0?"#5c5":"#c55"};margin-top:1px;">${n(x)}</div></div>
    </div>`,m+="</div>",m+='<div class="rr-section-bar">Exposure by Type</div>',m+='<div class="rr-section">',l>0){m+=Ne([{value:p,color:"#5a8aaa"},{value:c,color:"#aa7a5a"},{value:i,color:"#8a6aaa"}],6),m+='<div style="margin-top:6px;">';const r=[{label:"Loans",value:p,color:"#5a8aaa",pct:l>0?Math.round(p/l*100):0},{label:"Insurance",value:c,color:"#aa7a5a",pct:l>0?Math.round(c/l*100):0},{label:"Bonds",value:i,color:"#8a6aaa",pct:l>0?Math.round(i/l*100):0}];for(let f=0;f<r.length;f++){const E=r[f];m+=`<div class="rr-type-row">
                <div style="width:6px;height:6px;background:${E.color};margin-right:6px;"></div>
                <span style="flex:1;font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${E.label}</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${n(E.value)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;width:28px;text-align:right;">${E.pct}%</span>
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No exposure</div>';if(m+="</div>",m+=`<div class="rr-section-bar" style="display:flex;justify-content:space-between;align-items:center;">
        <span>Concentration Risk</span>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${U};background:${U}12;border:1px solid ${U}25;">${T}</span>
    </div>`,m+='<div class="rr-section">',h.length>0){m+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">BY NATION</div>';for(const r of h){const f=r.pct>50?"#c84":r.pct>30?"#ca5":"#5c5";m+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;width:52px;text-align:center;">${b(r.name.toUpperCase().slice(0,6))}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${r.pct}%;background:${f};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${n(r.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${r.pct>50?"#c84":"#9e9a92"};">${r.pct}%</span>
            </div>`}}if(I.length>0){m+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-top:8px;margin-bottom:4px;">BY SECTOR</div>';for(const r of I){const f=r.pct>50?"#c84":r.pct>30?"#ca5":"#5c5";m+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:52px;">${b(r.name)}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${r.pct}%;background:${f};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${n(r.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${r.pct>50?"#c84":"#9e9a92"};">${r.pct}%</span>
            </div>`}}h.length===0&&I.length===0&&(m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No positions to analyze</div>'),m+="</div>",z>60&&h.length>0&&(m+=`<div class="rr-warning"><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c55;">CONCENTRATION WARNING: </span>${z}% of exposure is in ${b(h[0].name)}. A sovereign crisis or economic downturn in this nation would affect the majority of your portfolio. Consider diversifying across nations.</div>`),m+="</div>",m+=`<div class="df-footer" style="justify-content:space-between;">
        <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">DEPLOYABLE CAPITAL</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${x>0?"#5c5":"#c55"};">${n(x)}</div></div>
        <div style="text-align:right;"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">TOTAL EXPOSURE</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${n(l)}</div></div>
    </div>`,a.innerHTML=m}const Ce={REPAID:{color:"#5c5",label:"REPAID"},DEFAULTED:{color:"#c55",label:"DEFAULTED"},EXPIRED:{color:"#5c5",label:"EXPIRED"},CLAIMED:{color:"#c84",label:"CLAIMED"},MATURED:{color:"#5c5",label:"MATURED"},SOLD:{color:"#ca5",label:"SOLD EARLY"},FORECLOSED:{color:"#c55",label:"FORECLOSED"}};let C=[],ye=-1;function We(a){ye=ye===a?-1:a,ge()}function ge(){const a=document.getElementById("cc-container");if(!a)return;const e=C.reduce((u,o)=>u+(o.earned||0),0),p=C.reduce((u,o)=>u+(o.lost||0),0),c=C.reduce((u,o)=>u+(o.net||0),0),i=C.filter(u=>u.net>0).length,l=C.filter(u=>u.net<0).length,v=c>=0;let t=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Collections</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${C.length} RESOLVED</span>
    </div>`;if(t+=`<div class="cc-scorecard">
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">EARNED</div>
            <div class="cc-scorecard__value" style="color:#5c5;">${n(e)}</div>
        </div>
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">LOST</div>
            <div class="cc-scorecard__value" style="color:#c55;">${n(p)}</div>
        </div>
        <div class="cc-scorecard__cell" style="background:${v?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="cc-scorecard__label">NET P&amp;L</div>
            <div class="cc-scorecard__value" style="color:${v?"#5c5":"#c55"};">${v?"+":""}${n(c)}</div>
        </div>
    </div>`,C.length>0){const u=i/C.length*100;t+=`<div class="cc-winloss">
            <div class="cc-winloss__bar">
                <div style="width:${u}%;background:#5c5;height:100%;"></div>
                <div style="flex:1;background:#c55;height:100%;"></div>
            </div>
            <span class="cc-winloss__stat" style="color:#5c5;">${i}W</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&mdash;</span>
            <span class="cc-winloss__stat" style="color:#c55;">${l}L</span>
        </div>`}t+='<div class="cc-list">',C.length===0&&(t+='<div class="cc-empty">No resolved deals yet.<br>Completed loans, expired policies, and matured bonds appear here.</div>');for(let u=0;u<C.length;u++){const o=C[u],s=be[o.type]||{class:"loan",label:o.type},y=Ce[o.outcome]||{color:"#9e9a92",label:o.outcome},x=ye===u,$=o.net>=0;t+=`<div class="cc-deal" onclick="ccToggle(${u})" style="border-left:2px solid ${$?"#5c5":"#c55"};">
        <div class="cc-deal__inner" style="${x?"background:"+(o.type==="LOAN"?"rgba(90,138,170,0.08)":o.type==="INSURE"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,t+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${s.class}">${s.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;flex:1;">${b(o.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${y.color};background:${y.color}12;border:1px solid ${y.color}25;">${y.label}</span>
        </div>`,t+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${b((o.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${b(o.resolved||"")}</span>
        </div>`,t+='<div class="df-metrics">',t+=`<div style="flex:1;padding:3px 8px;">
            <div class="df-metrics__label">PRINCIPAL</div>
            <div class="df-metrics__value" style="font-size:10px;color:#e8e4dc;margin-top:1px;">${n(o.principal||0)}</div>
        </div>`,t+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid #2a2a24;">
            <div class="df-metrics__label">EARNED</div>
            <div class="df-metrics__value" style="font-size:10px;color:#5c5;margin-top:1px;">${n(o.earned||0)}</div>
        </div>`,o.lost>0&&(t+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid #2a2a24;">
                <div class="df-metrics__label">LOST</div>
                <div class="df-metrics__value" style="font-size:10px;color:#c55;margin-top:1px;">${n(o.lost)}</div>
            </div>`),t+=`<div style="flex:1;padding:3px 8px;text-align:right;border-left:1px solid #2a2a24;background:${$?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="df-metrics__label">NET</div>
            <div class="df-metrics__value" style="font-size:11px;color:${$?"#5c5":"#c55"};margin-top:1px;">${$?"+":""}${n(o.net||0)}</div>
        </div>`,t+="</div>",x&&(t+='<div class="cc-deal__expanded">',o.term&&(t+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">TERM</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${b(o.term)}</span>
                </div>`),o.rate&&(t+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">RATE</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${b(o.rate)}</span>
                </div>`),o.note&&(t+=`<div style="padding:4px 0;">
                    <div style="font-size:9px;color:${$?"#9e9a92":"#c84"};line-height:1.5;">${b(o.note)}</div>
                </div>`),t+="</div>"),t+="</div></div>"}t+="</div>",t+=`<div class="df-footer" style="justify-content:space-between;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">LIFETIME P&amp;L</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${v?"#5c5":"#c55"};">${v?"+":""}${n(c)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            ${Object.entries(C.reduce((u,o)=>(u[o.outcome]=(u[o.outcome]||0)+1,u),{})).map(([u,o])=>{const s=Ce[u]||{color:"#9e9a92",label:u};return`<div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:${s.color};letter-spacing:0.3px;">${s.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#e8e4dc;">${o}</div>
                </div>`}).join("")}
        </div>
    </div>`,a.innerHTML=t}window.ccToggle=We;const Ke={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let G=null,_="LOAN",V=8,Y=18e6,re=24,P="equipment",Z=3.5,B=12e6,X=10,F=25e6;const Ie=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function Qe(a){const e=D[a];e&&(G=e,_=e.type,e.type==="LOAN"?(V=8,Y=e.amount,re=e.term||24,P=e.collateral||"equipment"):e.type==="INSURE"?(Z=3.5,B=e.amount,X=10):e.type==="BOND"&&(F=Math.round(e.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",ee())}function ke(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",G=null}function Je(a){V=Number(a),ee()}function Ze(a){Z=Number(a),ee()}function et(a){B=Number(a),ee()}function tt(a){X=Number(a),ee()}function at(a){F=Number(a),ee()}function oe(a,e,p){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(a/e*100,100)}%;background:${p};"></div></div>`}function ee(){const a=document.getElementById("rd-modal");if(!a||!G)return;const e=G,p=_==="LOAN"?"#5a8aaa":_==="INSURE"?"#aa7a5a":"#8a6aaa",c=Math.round(Y*(V/100)*(re/12)),i=Math.round((Y+c)/re),l=e.revenue||474e5,v=Math.round(i/l*1200),t=12,u=Math.max(0,(V-6)*1.5),o=Y>15e6?3:0,s=P==="none"?3:P==="full"?-2:0,y=Math.min(60,Math.max(2,Math.round(t+u+o+s))),x=y<=15?"#5c5":y<=30?"#ca5":y<=45?"#c84":"#c55",$=y<=15?"LOW":y<=30?"MODERATE":y<=45?"ELEVATED":"HIGH",h=95,R=(V-4)*8,I=Y<(e.amount||18e6)?10:0,z=P==="full"?15:P==="property"?8:P==="none"?-5:0,T=Math.max(10,Math.min(95,Math.round(h-R-I-z))),U=T>=70?"#5c5":T>=45?"#ca5":T>=25?"#c84":"#c55",m={unsecured:"none",equipment:"equipment",property:"property"},r=Ie.find(O=>O.id===(m[P]||P))||Ie[0],f=Math.round(c*(1-y/100)),E=(e.term||18)/12,w=Math.round(B*(Z/100)*E),N=100-(e.reputation||50),q=Math.max(5,Math.min(50,Math.round(N*.4))),pe=Math.round(B*(1-X/100)),xe=Math.round(pe*(q/100)),se=w-xe,ve=q<=12?"#5c5":q<=22?"#ca5":q<=35?"#c84":"#c55",fe=e.couponRate||6.2,he=e.term||60,$e=he/12,De=Math.round(F*(fe/100)),Ee=Math.round(F*(fe/100)*$e),K=e.stability||50,we=e.creditRating||50,Ae=e.debtToGdp||30,Se=Math.max(2,Math.round((100-K)*.15+(100-we)*.15+Math.max(0,Ae-30)*.3)),H=Math.min(60,Se),ue=H<=10?"#5c5":H<=20?"#ca5":H<=35?"#c84":"#c55",Le=Math.round(Ee*(1-H/100));let d=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${p};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>`;if(d+=`<div class="rd-tabs">
        <span class="rd-tab ${_==="LOAN"?"active-loan":_==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${_==="LOAN"?"Loan":_==="INSURE"?"Insure":"Bond"} — ${b(e.applicant)}</span>
    </div></div>`,d+='<div class="rd-body">',d+='<div class="rd-left">',_==="LOAN"){const O=(e.reputation||50)>=60?"#5c5":(e.reputation||50)>=35?"#ca5":"#c84";d+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${b(e.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${b(e.applicant)}</span>
                <span class="df-badge df-badge-${e.entity.toLowerCase()}">${e.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(e.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REVENUE</div><div class="rd-applicant__stat-value" style="color:#5c5;">${n(e.revenue||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${n(e.debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${O};">${e.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(e.amount)}</div></div>
            </div>
        </div>`,d+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const k=(V-3)/15*100;d+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${V}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${V}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${k}%,#2a2a24 ${k}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`,d+=`<div class="rd-control">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">Borrower's Terms (Fixed)</div>
            <div class="rd-risk-row"><span class="rd-risk-label">LOAN AMOUNT</span><span class="rd-risk-value" style="color:#e8e4dc;">${n(Y)}</span></div>
            <div class="rd-risk-row"><span class="rd-risk-label">TERM</span><span class="rd-risk-value" style="color:#e8e4dc;">${re}mo</span></div>
            <div class="rd-risk-row"><span class="rd-risk-label">COLLATERAL</span><span class="rd-risk-value" style="color:#e8e4dc;">${r.label}</span></div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:6px;">Amount, term, and collateral are set by the borrower. You set the interest rate.</div>
        </div>`}if(_==="INSURE"){const O=(e.reputation||50)>=60?"#5c5":(e.reputation||50)>=35?"#ca5":"#c84",k=e.projectValue?"PROJECT":"FLEET",Q=e.projectValue||e.fleetValue||0;d+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${b(e.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${b(e.applicant)}</span>
                <span class="df-badge df-badge-${e.entity.toLowerCase()}">${e.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(e.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${O};">${e.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${k}</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(Q)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(e.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${e.term}mo</div></div>
            </div>
        </div>`,d+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const te=(Z-1)/7*100;d+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${Z}%</span>
            </div>
            <input type="range" class="rd-control__range" min="1" max="8" step="0.5" value="${Z}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${te}%,#2a2a24 ${te}%);">
            <div class="rd-control__hints"><span>1% (competitive)</span><span>8% (expensive)</span></div>
        </div>`;const ae=Math.round((e.projectValue||e.fleetValue||e.amount)*.7),A=Math.round(e.amount*.33),ne=(B-A)/(ae-A)*100;d+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${n(B)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${A}" max="${ae}" step="1000000" value="${B}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${ne}%,#2a2a24 ${ne}%);">
            <div class="rd-control__hints"><span>${n(A)} (partial)</span><span>${n(ae)} (max)</span></div>
        </div>`,d+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${X}%</span>
            </div>
            <div class="rd-presets">`;for(const me of[5,10,15,20,25])d+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${me})" style="${X===me?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${me}%</span>`;d+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${X}% of any claim (${n(Math.round(B*X/100))})</div>
        </div>`}if(_==="BOND"){const O=K>=50?"#5c5":K>=30?"#ca5":K>=15?"#c84":"#c55";d+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${b(e.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(e.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(e.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${fe}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${he}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${O};">${K}</div></div>
            </div>
        </div>`,d+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const k=e.amount,Q=Math.max(5e6,Math.ceil(k*.05/5e6)*5e6),te=(F-Q)/(k-Q)*100;d+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${n(F)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${Q}" max="${k}" step="5000000" value="${F}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${te}%,#2a2a24 ${te}%);">
            <div class="rd-control__hints"><span>${n(Q)} (small position)</span><span>${n(k)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,d+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const ae=[{key:"stability",value:K,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:Ae,label:"Debt burden",invert:!0},{key:"credit_rating",value:we,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:e.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:e.corruption||62,label:"Institutional risk",invert:!0}];for(const A of ae){const ne=A.invert?A.value>60?"#c55":A.value>40?"#ca5":"#5c5":A.value>=50?"#5c5":A.value>=30?"#ca5":A.value>=15?"#c84":"#c55";d+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${A.key}</span>
                <div style="width:40px;">${oe(A.value,100,ne)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:18px;text-align:right;">${A.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${A.label}</span>
            </div>`}d+="</div>"}if(d+="</div>",d+='<div class="rd-right">',_==="LOAN"){d+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',d+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${x};">${y}%</span>
            </div>
            ${oe(y,100,x)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${x};margin-top:4px;">${$}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,d+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',d+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${U};">${T}%</span>
            </div>
            ${oe(T,100,U)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,d+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',d+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${n(Y)}</span></div>`,d+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${n(c)}</span></div>`,d+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${n(i)}</span></div>`;const O=v>30?"#c55":v>15?"#ca5":"#5c5";d+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${O};">${v}% of revenue</span></div>`,d+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${n(f)}</span></div>`,d+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${y}% default)</div>`}if(_==="INSURE"){d+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',d+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${ve};">${q}%</span>
            </div>
            ${oe(q,100,ve)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,d+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',d+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${n(pe)}</span></div>`,d+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${n(w)}</span></div>`,d+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${n(xe)}</span></div>`;const O=se>0?"":" negative",k=se>0?"#5c5":"#c55";d+=`<div class="rd-expected${O}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${k};">${n(se)}</span></div>`,d+=`<div class="rd-formula">Premiums (${n(w)}) − expected payout (${q}% × ${n(pe)})</div>`}_==="BOND"&&(d+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',d+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${ue};">${H}%</span>
            </div>
            ${oe(H,100,ue)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,d+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',d+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${n(F)}</span></div>`,d+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${n(De)}</span></div>`,d+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round($e)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${n(Ee)}</span></div>`,d+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${n(Le)}</span></div>`,d+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${H}% default)</div>`),d+="</div>",d+="</div>";const Me=_==="LOAN"?Y:_==="INSURE"?B:F,ze=_==="LOAN"?f:_==="INSURE"?se:Le,Ue=_==="LOAN"?y:_==="INSURE"?q:H,Pe=_==="LOAN"?x:_==="INSURE"?ve:ue,Be=_==="LOAN"?"OFFER LOAN":_==="INSURE"?"WRITE POLICY":"BUY BONDS",Fe=_.toLowerCase();d+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${n(Me)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${n(ze)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${Pe};">${Ue}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${Fe}" onclick="rdSubmitOffer()">${Be}</button>
        </div>
    </div>`,a.innerHTML=d}window.rdOpen=Qe;window.rdClose=ke;window.rdSetLoanRate=Je;window.rdSetInsurePremium=Ze;window.rdSetInsureCoverage=et;window.rdSetInsureDeductible=tt;window.rdSetBondAmount=at;let J=!1;async function ot(){if(!G||!g||!S||J||G.type!=="LOAN")return;J=!0;const a=V;if(a<1||a>20){alert("Interest rate must be 1-20%."),J=!1;return}if((Number(g.corp_cash_reserves)||0)<G.amount){alert("Insufficient cash reserves to fund this loan."),J=!1;return}const c={none:"unsecured",equipment:"equipment",property:"property",full:"property"}[P]||"unsecured",i=S.current_tick||0,{error:l}=await M.from("finance_loan_offers").insert({request_id:G.requestId,offering_faction_id:g.id,interest_rate:a,collateral_type:c,created_tick:i});if(l){J=!1,l.message.includes("unique")||l.message.includes("duplicate")?alert("You have already submitted an offer for this loan request."):alert("Failed to submit offer: "+l.message);return}ke(),j=-1,await Oe(),J=!1}window.rdSubmitOffer=ot;async function st(){if(!g){de();return}const{data:a}=await M.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker)").eq("lender_faction_id",g.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1});L=(a||[]).map(e=>({id:e.id,type:"LOAN",counterparty:e.borrower?.faction_name||"Unknown",abbr:e.borrower?.abbreviation||e.borrower?.corp_ticker||"??",remaining:e.principal-e.total_paid,principal:e.principal,earned:e.total_interest_paid||0,rate:e.interest_rate,term:e.term_months,paymentsMade:e.payments_made,paymentsMissed:e.payments_missed,monthlyPayment:e.monthly_payment,status:e.status.toUpperCase(),collateral:e.collateral_type,purpose:e.purpose||"",alert:e.status==="late"||e.status==="delinquent",alertLevel:e.status==="delinquent"?"red":e.status==="late"?"orange":null,alertMsg:e.status==="delinquent"?`${e.payments_missed} missed payments. Default imminent.`:e.status==="late"?`${e.payments_missed} missed payment${e.payments_missed>1?"s":""}. Monitor closely.`:null})),de()}async function nt(){if(!g){ge();return}const{data:a}=await M.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker)").eq("lender_faction_id",g.id).in("status",["repaid","defaulted"]).order("completed_tick",{ascending:!1});C=(a||[]).map(e=>{const p=e.total_interest_paid||0,c=e.status==="defaulted"?Math.max(0,e.principal-e.total_paid):0;return{type:"LOAN",counterparty:e.borrower?.faction_name||"Unknown",abbr:e.borrower?.abbreviation||e.borrower?.corp_ticker||"??",nation:"",outcome:e.status==="repaid"?"REPAID":"DEFAULTED",principal:e.principal,earned:p,lost:c,net:p-c,resolved:e.completed_tick?"Tick "+e.completed_tick:"",term:e.term_months+"mo",rate:e.interest_rate+"%",note:e.status==="repaid"?`Fully repaid over ${e.payments_made} payments.`:`Defaulted after ${e.payments_missed} missed payments. ${e.collateral_type!=="unsecured"?"Collateral ("+e.collateral_type+") partially recovered losses.":"Unsecured — no collateral recovery."}`}}),ge()}async function lt(){const{data:{user:a}}=await M.auth.getUser();if(!a){window.location.href="login.html";return}const{data:e}=await M.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);W=(e||[]).filter(l=>l.nation_id);const p=sessionStorage.getItem("active_faction_id");if(g=W.find(l=>l.id===p)||W.find(l=>l.faction_type==="corporation")||W[0],!g){await M.auth.signOut(),window.location.href="login.html";return}if(g.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(g.corp_sector!=="Finance"){window.location.href="corp-operations.html"+window.location.search;return}sessionStorage.setItem("active_faction_id",g.id);const[c,i]=await Promise.all([g.nation_id?M.from("nations").select("*").eq("id",g.nation_id).single():Promise.resolve({data:null}),M.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);c.data&&c.data,S=i.data,document.getElementById("corp-name-bar").textContent=g.faction_name||"Corp",document.getElementById("corp-name-badge").textContent=(g.abbreviation||g.corp_ticker||g.faction_name||"--").toUpperCase(),document.getElementById("topbar-cash").textContent="CASH: "+n(Number(g.corp_cash_reserves)||0),S&&(document.getElementById("game-date").textContent=S.current_date||Ve(S.current_tick),document.getElementById("tick-number").textContent=S.current_tick||"--"),it(),await Oe(),await st(),Xe(),await nt(),S?.next_tick_at&&vt(S.next_tick_at)}function it(){const a=document.getElementById("corp-faction-dropdown");if(!a||W.length<=1)return;let e="";for(const p of W){const c=p.id===g.id,i=p.faction_type==="corporation"?"CORP":"PARTY";e+=`<div class="corp-faction-dropdown__item${c?" active":""}" onclick="switchFaction('${p.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${p.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${p.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${p.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${i}</span>
            <span>${b(p.faction_name||"--")}</span>
        </div>`}a.innerHTML=e}function rt(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function ct(a){sessionStorage.setItem("active_faction_id",a);const e=W.find(p=>p.id===a);e&&e.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}function dt(){document.body.classList.toggle("light-mode");const a=document.body.classList.contains("light-mode");localStorage.setItem("theme",a?"light":"dark"),document.getElementById("theme-toggle").textContent=a?"Dark":"Light"}async function pt(){await M.auth.signOut(),window.location.href="login.html"}function vt(a){const e=document.getElementById("tick-countdown");function p(){const c=new Date(a)-new Date;if(c<=0){e.textContent="Processing...";return}const i=Math.floor(c/36e5),l=Math.floor(c%36e5/6e4),v=Math.floor(c%6e4/1e3);e.textContent=`${i}h ${l}m ${v}s`}p(),setInterval(p,1e3)}localStorage.getItem("theme")==="light"&&(document.body.classList.add("light-mode"),document.getElementById("theme-toggle").textContent="Dark");window.toggleCorpDropdown=rt;window.switchFaction=ct;window.toggleTheme=dt;window.doLogout=pt;lt();
