import{_ as U}from"./supabase-client-BXEzLDpS.js";import{t as Ft,e as b}from"./utils-C2W-HleY.js";let J=[],g=null,z=null;function n(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+Math.round(e).toLocaleString()}const gt={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},Vt={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}};let D=[],lt="ALL",X=-1;async function It(){if(!g||!z)return;const{data:e}=await U.from("finance_loan_requests").select("*, requesting_faction:factions!requesting_faction_id(id, faction_name, abbreviation, corp_ticker, corp_subsector, corp_reputation, corp_credit_rating, nation_id)").eq("nation_id",g.nation_id).eq("status","open").order("created_tick",{ascending:!1}),{data:t}=await U.from("finance_loan_offers").select("request_id").eq("offering_faction_id",g.id),p=new Set((t||[]).map(r=>r.request_id));D=(e||[]).map(r=>({id:r.id,type:"LOAN",applicant:r.requesting_faction?.faction_name||"Unknown",abbr:r.requesting_faction?.abbreviation||r.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:"N/A",amount:r.amount,term:r.term_months,purpose:r.purpose||"",reputation:r.requesting_faction?.corp_reputation??50,creditRating:r.requesting_faction?.corp_credit_rating??50,risk:(r.requesting_faction?.corp_credit_rating??50)>=60?"LOW":(r.requesting_faction?.corp_credit_rating??50)>=40?"MODERATE":(r.requesting_faction?.corp_credit_rating??50)>=25?"ELEVATED":"HIGH",isNew:!p.has(r.id),ticksLeft:(r.expires_tick||0)-(z?.current_tick||0),requestId:r.id,alreadyOffered:p.has(r.id)})),bt()}function Lt(e){if(!g)return!1;const t=(g.corp_subsector||"").toLowerCase(),p=Xt[t];return e.type===p}function qt(e){lt=e,X=-1,bt()}function Ht(e){X=X===e?-1:e,bt()}function bt(){const e=document.getElementById("df-container");if(!e)return;const t=lt==="ALL"?D:D.filter(o=>o.type===lt),p=D.filter(o=>o.isNew).length,r=D.length;let c=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${p>0?`<span class="df-badge df-badge-corp" style="font-size:8px;">${p} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${r} OPEN</span>
        </div>
    </div>`;const l=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];c+='<div class="df-filters">';for(const o of l)c+=`<span class="df-pill${lt===o.id?" "+o.activeClass:""}" onclick="dfSetFilter('${o.id}')">${o.label}</span>`;c+="</div>",c+='<div class="df-list">',t.length===0&&(c+='<div class="ap-empty">No deals available.<br>Deals appear when corporations request financing or governments issue bonds.</div>');for(let o=0;o<t.length;o++){const s=t[o],y=D.indexOf(s),E=X===y,A=gt[s.type],w=Vt[s.risk],R=Lt(s);c+=`<div class="df-deal${E?" sel-"+A.class:""}" onclick="dfSelectDeal(${y})" style="${R?"":"opacity:0.5;"}">`,s.isNew&&R&&(c+='<div class="df-new-dot"></div>'),c+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span class="df-badge df-badge-${A.class}">${A.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;">${b(s.applicant)}</span>
            <span class="df-badge df-badge-${s.entity.toLowerCase()}">${s.entity}</span>
            ${R?"":'<span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`,c+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${b(s.nation.toUpperCase())}</span>
            <span class="df-badge ${w.class}" style="font-weight:700;line-height:12px;background:currentColor;-webkit-background-clip:unset;padding:0 4px;">`,c+="</span>",c=c.slice(0,c.lastIndexOf('<span class="df-badge '+w.class));const O=w.class==="df-risk-low"?"#5c5":w.class==="df-risk-moderate"?"#ca5":w.class==="df-risk-elevated"?"#c84":"#c55";c+=`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${O};background:${O}12;border:1px solid ${O}25;">${w.label}</span>
        </div>`;const P=s.type==="BOND"?"FACE VALUE":s.type==="INSURE"?"COVERAGE":"AMOUNT",T=s.type==="BOND"?"COUPON":"REP",B=s.type==="BOND"?s.couponRate+"%":s.reputation||s.stability,m=s.type==="BOND"?s.couponRate*10:s.reputation||s.stability,d=s.type==="BOND"?"#c8a832":m>=60?"#5c5":m>=35?"#ca5":"#c84";if(c+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${P}</div>
                <div class="df-metrics__value" style="font-size:12px;color:#e8e4dc;">${n(s.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:11px;color:#e8e4dc;">${s.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${T}</div>
                <div class="df-metrics__value" style="font-size:11px;color:${d};">${B}</div>
            </div>
        </div>`,E){if(c+=`<div style="margin-top:6px;font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(s.purpose)}</div>`,R)c+='<div class="df-detail">';else{const f=s.type==="LOAN"?"Banking":s.type==="INSURE"?"Insurance":"Investment";c+=`<div style="padding:6px 8px;background:rgba(106,102,96,0.06);border:1px solid #2a2a24;font-family:var(--font-mono);font-size:8px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:#e8e4dc;font-weight:700;">${f}</span> subsector to underwrite.
                    ${g?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+b(g.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(R){if(s.type==="LOAN"){const f=Math.round(s.debt/s.revenue*100),x=f>50?"#c84":"#5c5",N=s.debt>s.revenue*.5?"#c84":"#9e9a92";c+=`<div class="df-detail-row"><span class="df-detail-label">ANNUAL REVENUE</span><span class="df-detail-value" style="color:#9e9a92;">${n(s.revenue)}</span></div>`,c+=`<div class="df-detail-row"><span class="df-detail-label">EXISTING DEBT</span><span class="df-detail-value" style="color:${N};">${n(s.debt)}</span></div>`,c+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/REVENUE</span><span class="df-detail-value" style="color:${x};font-weight:700;">${f}%</span></div>`}else if(s.type==="BOND"){const f=s.stability>=50?"#5c5":s.stability>=30?"#ca5":"#c84",x=s.debtToGdp>60?"#c55":s.debtToGdp>40?"#c84":"#5c5",N=s.creditRating>=60?"#5c5":s.creditRating>=35?"#ca5":"#c55";c+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${f};">${s.stability}/100</span></div>`,c+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${x};">${s.debtToGdp}%</span></div>`,c+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${N};font-weight:700;">${s.creditRating}/100</span></div>`}else if(s.type==="INSURE"){const f=s.reputation>=60?"#5c5":s.reputation>=35?"#ca5":"#c84",x=s.projectValue?"PROJECT VALUE":"FLEET VALUE",N=s.projectValue||s.fleetValue;c+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${f};">${s.reputation}/100</span></div>`,c+=`<div class="df-detail-row"><span class="df-detail-label">${x}</span><span class="df-detail-value" style="color:#9e9a92;">${n(N)}</span></div>`}c+="</div>"}}c+="</div>"}c+="</div>";const v=D.filter(o=>o.type==="LOAN").length,a=D.filter(o=>o.type==="INSURE").length,u=D.filter(o=>o.type==="BOND").length;c+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${v}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${a}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${u}</span></div>
        </div>
        ${(()=>{const o=X>=0?D[X]:null,s=o&&Lt(o);return s?`<div class="df-review-btn active" onclick="rdOpen(${X})">REVIEW DEAL</div>`:o&&!s?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,e.innerHTML=c}window.dfSetFilter=qt;window.dfSelectDeal=Ht;const Rt={CURRENT:{color:"#5c5",label:"CURRENT"},LATE:{color:"#c84",label:"LATE"},DELINQUENT:{color:"#c55",label:"DELINQUENT"},CLAIM:{color:"#c55",label:"CLAIM FILED"},ACTIVE:{color:"#5c5",label:"ACTIVE"},WATCHLIST:{color:"#ca5",label:"WATCHLIST"},DEFAULT:{color:"#c55",label:"DEFAULT"}};let L=[],it="ALL",rt=-1;function jt(e){it=e,rt=-1,ct()}function Gt(e){rt=rt===e?-1:e,ct()}function ct(){const e=document.getElementById("ap-container");if(!e)return;const t=it==="ALL"?L:L.filter(v=>v.type===it),p=L.reduce((v,a)=>v+(a.remaining||a.coverage||a.faceValue||0),0),r=L.reduce((v,a)=>v+(a.earned||a.premiumsCollected||a.couponsReceived||0),0),c=L.filter(v=>v.alert).length;let l=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Active Portfolio</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${c>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:#c55;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);">${c} ALERT${c>1?"S":""}</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${L.length} ACTIVE</span>
        </div>
    </div>`;l+=`<div class="ap-summary">
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EXPOSURE</div>
            <div class="ap-summary__value" style="font-size:14px;color:#c55;">${n(p)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EARNED</div>
            <div class="ap-summary__value" style="font-size:14px;color:#5c5;">${n(r)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:0.6;">
            <div class="ap-summary__label">DEALS</div>
            <div style="display:flex;gap:4px;margin-top:3px;">
                ${["LOAN","INSURE","BOND"].map(v=>{const a=L.filter(o=>o.type===v).length;return`<div style="display:flex;align-items:center;gap:2px;"><div style="width:4px;height:4px;background:${v==="LOAN"?"#5a8aaa":v==="INSURE"?"#aa7a5a":"#8a6aaa"};border-radius:1px;"></div><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#9e9a92;">${a}</span></div>`}).join("")}
            </div>
        </div>
    </div>`,l+='<div class="df-filters">';for(const v of[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Policies",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}])l+=`<span class="df-pill${it===v.id?" "+v.activeClass:""}" onclick="apSetFilter('${v.id}')">${v.label}</span>`;l+="</div>",l+='<div class="ap-list">',t.length===0&&(l+='<div class="ap-empty">No active positions.<br>Review deals from the Deal Flow to build your portfolio.</div>');for(let v=0;v<t.length;v++){const a=t[v],u=L.indexOf(a),o=rt===u,s=gt[a.type],y=Rt[a.status]||Rt.CURRENT,E=!!a.alert,A=a.elapsed||0,w=a.term||1,R=Math.round(A/w*100),O=E?y.color==="#c55"?"alert-red":y.color==="#c84"?"alert-orange":"alert-yellow":"";l+=`<div class="ap-deal ${O}" onclick="apToggle(${u})">
            <div class="ap-deal__inner" style="${o?"background:"+(s.class==="loan"?"rgba(90,138,170,0.08)":s.class==="insure"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,l+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${s.class}">${s.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;flex:1;">${b(a.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${y.color};background:${y.color}12;border:1px solid ${y.color}25;">${y.label}</span>
        </div>`,l+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${b((a.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${A}/${w}mo — ${R}%</span>
        </div>`;const P=E?y.color:s.class==="loan"?"#5a8aaa":s.class==="insure"?"#aa7a5a":"#8a6aaa";l+=`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(R,100)}%;background:${P};"></div></div>`;const T=a.type==="LOAN"?"REMAINING":a.type==="INSURE"?"COVERAGE":"FACE VALUE",B=a.remaining||a.coverage||a.faceValue||0,m=a.type==="LOAN"?"RATE":a.type==="INSURE"?"PREMIUM":"COUPON",d=a.rate||a.premiumRate||a.coupon||0,f=a.earned||a.premiumsCollected||a.couponsReceived||0,x=s.class==="loan"?"#5a8aaa":s.class==="insure"?"#aa7a5a":"#8a6aaa";if(l+=`<div class="df-metrics" style="margin-top:4px;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${T}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#e8e4dc;margin-top:1px;">${n(B)}</div>
            </div>
            <div style="flex:0.8;padding:3px 6px;text-align:center;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${m}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${x};margin-top:1px;">${d}%</div>
            </div>
            <div style="flex:1;padding:3px 6px;text-align:right;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">EARNED</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5c5;margin-top:1px;">${n(f)}</div>
            </div>
        </div>`,E&&(l+=`<div class="ap-deal__alert" style="background:${y.color}08;border:1px solid ${y.color}20;color:${y.color};">${b(a.alert)}</div>`),o){if(l+='<div class="ap-deal__expanded">',a.type==="LOAN"){const N=[{label:"PRINCIPAL",value:n(a.principal||0)},{label:"REMAINING",value:n(a.remaining||0),color:"#e8e4dc"},{label:"MONTHLY PAYMENT",value:n(a.monthlyPayment||0)},{label:"MISSED PAYMENTS",value:String(a.missedPayments||0),color:(a.missedPayments||0)>0?"#c55":"#5c5"},{label:"NEXT DUE",value:a.nextPayment||"—",color:a.status==="LATE"?"#c55":"#9e9a92"}];for(const h of N)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${h.label}</span><span class="ap-detail-value" style="color:${h.color||"#9e9a92"};">${h.value}</span></div>`;a.status!=="CURRENT"&&(l+='<div class="ap-actions"><div class="ap-action-btn green">RESTRUCTURE</div><div class="ap-action-btn orange">CALL LOAN</div><div class="ap-action-btn red">FORECLOSE</div></div>')}else if(a.type==="INSURE"){const N=[{label:"COVERAGE",value:n(a.coverage||0)},{label:"PREMIUMS COLLECTED",value:n(a.premiumsCollected||0),color:"#5c5"},{label:"CLAIMS FILED",value:String(a.claims||0),color:(a.claims||0)>0?"#c84":"#5c5"},{label:"PAID OUT",value:n(a.paidOut||0),color:(a.paidOut||0)>0?"#c55":"#6a6660"}];for(const h of N)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${h.label}</span><span class="ap-detail-value" style="color:${h.color||"#9e9a92"};">${h.value}</span></div>`;a.status==="CLAIM"&&a.claimAmount&&(l+=`<div class="ap-claim-box"><div style="font-family:var(--font-mono);font-size:7px;color:#c55;letter-spacing:0.8px;margin-bottom:2px;">PENDING CLAIM</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${n(a.claimAmount)}</div></div>`,l+='<div class="ap-actions"><div class="ap-action-btn green">PAY IN FULL</div><div class="ap-action-btn orange">NEGOTIATE</div><div class="ap-action-btn red">DISPUTE</div></div>')}else if(a.type==="BOND"){const N=[{label:"FACE VALUE",value:n(a.faceValue||0)},{label:"COUPONS RECEIVED",value:n(a.couponsReceived||0),color:"#5c5"},{label:"NEXT COUPON",value:a.nextCoupon||"—"},{label:"ANNUAL YIELD",value:n(Math.round((a.faceValue||0)*(a.coupon||0)/100)),color:"#8a6aaa"}];for(const h of N)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${h.label}</span><span class="ap-detail-value" style="color:${h.color||"#9e9a92"};">${h.value}</span></div>`;l+='<div class="ap-actions"><div class="ap-action-btn purple">SELL POSITION</div><div class="ap-action-btn olive">HOLD</div></div>'}l+="</div>"}l+="</div></div>"}l+="</div>",l+=`<div class="df-footer">
        <div style="display:flex;gap:10px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EXPOSURE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${n(p)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EARNED</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;">${n(r)}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            ${["LOAN","INSURE","BOND"].map(v=>{const a=v==="LOAN"?"#5a8aaa":v==="INSURE"?"#aa7a5a":"#8a6aaa",u=L.filter(o=>o.type===v).length;return`<div style="text-align:center;padding:1px 6px;border:1px solid ${u>0?a+"33":"#2a2a24"};background:${u>0?a+"0a":"transparent"};"><div style="font-family:var(--font-mono);font-size:6px;color:${a};">${v}</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${u>0?"#e8e4dc":"#6a6660"};">${u}</div></div>`}).join("")}
        </div>
    </div>`,e.innerHTML=l}window.apSetFilter=jt;window.apToggle=Gt;function Tt(e,t){const p=e.reduce((r,c)=>r+c.value,0);return p===0?`<div class="rr-seg-bar" style="height:${t}px;background:#2a2a24;"></div>`:`<div class="rr-seg-bar" style="height:${t}px;">${e.map(r=>`<div style="width:${(r.value/p*100).toFixed(1)}%;height:100%;background:${r.color};"></div>`).join("")}</div>`}function Yt(){const e=document.getElementById("rr-container");if(!e)return;const t=Number(g?.corp_cash_reserves)||0,p=L.filter(d=>d.type==="LOAN").reduce((d,f)=>d+(f.remaining||0),0),r=L.filter(d=>d.type==="INSURE").reduce((d,f)=>d+(f.coverage||0),0),c=L.filter(d=>d.type==="BOND").reduce((d,f)=>d+(f.faceValue||0),0),l=p+r+c,v=l,a=t+v,u=Math.round(l*.15),o=l>0?Math.round(t/l*100):100,s=o>=30?"HEALTHY":o>=20?"ADEQUATE":o>=15?"THIN":"CRITICAL",y=o>=30?"#5c5":o>=20?"#ca5":o>=15?"#c84":"#c55",E=Math.max(0,t-u),A={};for(const d of L){const f=d.nation||"Unknown",x=d.remaining||d.coverage||d.faceValue||0;A[f]=(A[f]||0)+x}const w=Object.entries(A).map(([d,f])=>({name:d,exposure:f,pct:l>0?Math.round(f/l*100):0})).sort((d,f)=>f.exposure-d.exposure),R={};for(const d of L){const f=d.type==="BOND"?"Government":d.sector||"Other",x=d.remaining||d.coverage||d.faceValue||0;R[f]=(R[f]||0)+x}const O=Object.entries(R).map(([d,f])=>({name:d,exposure:f,pct:l>0?Math.round(f/l*100):0})).sort((d,f)=>f.exposure-d.exposure),P=w.length>0?w[0].pct:0,T=P>60?"HIGH":P>40?"MODERATE":"LOW",B=T==="HIGH"?"#c55":T==="MODERATE"?"#ca5":"#5c5";let m=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Reserves & Risk</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${y};background:${y}12;border:1px solid ${y}25;">${s}</span>
    </div>`;if(m+='<div style="flex:1;overflow-y:auto;">',m+='<div class="rr-section-bar">Capital Position</div>',m+='<div class="rr-section">',m+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">TOTAL ASSETS</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${n(a)}</span>
    </div>`,m+=Tt([{value:t,color:"#5c5"},{value:v,color:"#8b9a6b"}],6),m+=`<div class="rr-seg-legend">
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#5c5;"></div>Cash ${n(t)}</div>
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#8b9a6b;"></div>Deployed ${n(v)}</div>
    </div>`,m+="</div>",m+='<div class="rr-section">',m+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">RESERVE RATIO</span>
        <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${y};">${o}%</span>
    </div>`,m+=`<div class="rd-bar" style="height:5px;"><div class="rd-bar__fill" style="width:${Math.min(o/60*100,100)}%;background:${y};"></div></div>`,m+=`<div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:3px;">
        <span style="color:#c55;">15% minimum</span><span>30% healthy</span><span style="color:#5c5;">60%+</span>
    </div>`,m+=`<div class="rr-reserve-cells">
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REQUIRED (15%)</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;margin-top:1px;">${n(u)}</div></div>
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">AVAILABLE TO DEPLOY</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${E>0?"#5c5":"#c55"};margin-top:1px;">${n(E)}</div></div>
    </div>`,m+="</div>",m+='<div class="rr-section-bar">Exposure by Type</div>',m+='<div class="rr-section">',l>0){m+=Tt([{value:p,color:"#5a8aaa"},{value:r,color:"#aa7a5a"},{value:c,color:"#8a6aaa"}],6),m+='<div style="margin-top:6px;">';const d=[{label:"Loans",value:p,color:"#5a8aaa",pct:l>0?Math.round(p/l*100):0},{label:"Insurance",value:r,color:"#aa7a5a",pct:l>0?Math.round(r/l*100):0},{label:"Bonds",value:c,color:"#8a6aaa",pct:l>0?Math.round(c/l*100):0}];for(let f=0;f<d.length;f++){const x=d[f];m+=`<div class="rr-type-row">
                <div style="width:6px;height:6px;background:${x.color};margin-right:6px;"></div>
                <span style="flex:1;font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${x.label}</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${n(x.value)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;width:28px;text-align:right;">${x.pct}%</span>
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No exposure</div>';if(m+="</div>",m+=`<div class="rr-section-bar" style="display:flex;justify-content:space-between;align-items:center;">
        <span>Concentration Risk</span>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${B};background:${B}12;border:1px solid ${B}25;">${T}</span>
    </div>`,m+='<div class="rr-section">',w.length>0){m+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">BY NATION</div>';for(const d of w){const f=d.pct>50?"#c84":d.pct>30?"#ca5":"#5c5";m+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;width:52px;text-align:center;">${b(d.name.toUpperCase().slice(0,6))}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${d.pct}%;background:${f};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${n(d.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${d.pct>50?"#c84":"#9e9a92"};">${d.pct}%</span>
            </div>`}}if(O.length>0){m+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-top:8px;margin-bottom:4px;">BY SECTOR</div>';for(const d of O){const f=d.pct>50?"#c84":d.pct>30?"#ca5":"#5c5";m+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:52px;">${b(d.name)}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${d.pct}%;background:${f};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${n(d.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${d.pct>50?"#c84":"#9e9a92"};">${d.pct}%</span>
            </div>`}}w.length===0&&O.length===0&&(m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No positions to analyze</div>'),m+="</div>",P>60&&w.length>0&&(m+=`<div class="rr-warning"><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c55;">CONCENTRATION WARNING: </span>${P}% of exposure is in ${b(w[0].name)}. A sovereign crisis or economic downturn in this nation would affect the majority of your portfolio. Consider diversifying across nations.</div>`),m+="</div>",m+=`<div class="df-footer" style="justify-content:space-between;">
        <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">DEPLOYABLE CAPITAL</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${E>0?"#5c5":"#c55"};">${n(E)}</div></div>
        <div style="text-align:right;"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">TOTAL EXPOSURE</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${n(l)}</div></div>
    </div>`,e.innerHTML=m}const Nt={REPAID:{color:"#5c5",label:"REPAID"},DEFAULTED:{color:"#c55",label:"DEFAULTED"},EXPIRED:{color:"#5c5",label:"EXPIRED"},CLAIMED:{color:"#c84",label:"CLAIMED"},MATURED:{color:"#5c5",label:"MATURED"},SOLD:{color:"#ca5",label:"SOLD EARLY"},FORECLOSED:{color:"#c55",label:"FORECLOSED"}};let I=[],mt=-1;function Wt(e){mt=mt===e?-1:e,yt()}function yt(){const e=document.getElementById("cc-container");if(!e)return;const t=I.reduce((u,o)=>u+(o.earned||0),0),p=I.reduce((u,o)=>u+(o.lost||0),0),r=I.reduce((u,o)=>u+(o.net||0),0),c=I.filter(u=>u.net>0).length,l=I.filter(u=>u.net<0).length,v=r>=0;let a=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Collections</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${I.length} RESOLVED</span>
    </div>`;if(a+=`<div class="cc-scorecard">
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">EARNED</div>
            <div class="cc-scorecard__value" style="color:#5c5;">${n(t)}</div>
        </div>
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">LOST</div>
            <div class="cc-scorecard__value" style="color:#c55;">${n(p)}</div>
        </div>
        <div class="cc-scorecard__cell" style="background:${v?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="cc-scorecard__label">NET P&amp;L</div>
            <div class="cc-scorecard__value" style="color:${v?"#5c5":"#c55"};">${v?"+":""}${n(r)}</div>
        </div>
    </div>`,I.length>0){const u=c/I.length*100;a+=`<div class="cc-winloss">
            <div class="cc-winloss__bar">
                <div style="width:${u}%;background:#5c5;height:100%;"></div>
                <div style="flex:1;background:#c55;height:100%;"></div>
            </div>
            <span class="cc-winloss__stat" style="color:#5c5;">${c}W</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&mdash;</span>
            <span class="cc-winloss__stat" style="color:#c55;">${l}L</span>
        </div>`}a+='<div class="cc-list">',I.length===0&&(a+='<div class="cc-empty">No resolved deals yet.<br>Completed loans, expired policies, and matured bonds appear here.</div>');for(let u=0;u<I.length;u++){const o=I[u],s=gt[o.type]||{class:"loan",label:o.type},y=Nt[o.outcome]||{color:"#9e9a92",label:o.outcome},E=mt===u,A=o.net>=0;a+=`<div class="cc-deal" onclick="ccToggle(${u})" style="border-left:2px solid ${A?"#5c5":"#c55"};">
        <div class="cc-deal__inner" style="${E?"background:"+(o.type==="LOAN"?"rgba(90,138,170,0.08)":o.type==="INSURE"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,a+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${s.class}">${s.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;flex:1;">${b(o.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${y.color};background:${y.color}12;border:1px solid ${y.color}25;">${y.label}</span>
        </div>`,a+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${b((o.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${b(o.resolved||"")}</span>
        </div>`,a+='<div class="df-metrics">',a+=`<div style="flex:1;padding:3px 8px;">
            <div class="df-metrics__label">PRINCIPAL</div>
            <div class="df-metrics__value" style="font-size:10px;color:#e8e4dc;margin-top:1px;">${n(o.principal||0)}</div>
        </div>`,a+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid #2a2a24;">
            <div class="df-metrics__label">EARNED</div>
            <div class="df-metrics__value" style="font-size:10px;color:#5c5;margin-top:1px;">${n(o.earned||0)}</div>
        </div>`,o.lost>0&&(a+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid #2a2a24;">
                <div class="df-metrics__label">LOST</div>
                <div class="df-metrics__value" style="font-size:10px;color:#c55;margin-top:1px;">${n(o.lost)}</div>
            </div>`),a+=`<div style="flex:1;padding:3px 8px;text-align:right;border-left:1px solid #2a2a24;background:${A?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="df-metrics__label">NET</div>
            <div class="df-metrics__value" style="font-size:11px;color:${A?"#5c5":"#c55"};margin-top:1px;">${A?"+":""}${n(o.net||0)}</div>
        </div>`,a+="</div>",E&&(a+='<div class="cc-deal__expanded">',o.term&&(a+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">TERM</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${b(o.term)}</span>
                </div>`),o.rate&&(a+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">RATE</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${b(o.rate)}</span>
                </div>`),o.note&&(a+=`<div style="padding:4px 0;">
                    <div style="font-size:9px;color:${A?"#9e9a92":"#c84"};line-height:1.5;">${b(o.note)}</div>
                </div>`),a+="</div>"),a+="</div></div>"}a+="</div>",a+=`<div class="df-footer" style="justify-content:space-between;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">LIFETIME P&amp;L</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${v?"#5c5":"#c55"};">${v?"+":""}${n(r)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            ${Object.entries(I.reduce((u,o)=>(u[o.outcome]=(u[o.outcome]||0)+1,u),{})).map(([u,o])=>{const s=Nt[u]||{color:"#9e9a92",label:u};return`<div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:${s.color};letter-spacing:0.3px;">${s.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#e8e4dc;">${o}</div>
                </div>`}).join("")}
        </div>
    </div>`,e.innerHTML=a}window.ccToggle=Wt;const Xt={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let K=null,_="LOAN",j=8,M=18e6,at=24,F="equipment",et=3.5,q=12e6,Q=10,H=25e6;const Ct=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function Kt(e){const t=D[e];t&&(K=t,_=t.type,t.type==="LOAN"?(j=8,M=t.amount,at=t.term||24,F="equipment"):t.type==="INSURE"?(et=3.5,q=t.amount,Q=10):t.type==="BOND"&&(H=Math.round(t.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",G())}function Ot(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",K=null}function Qt(e){j=Number(e),G()}function Jt(e){M=Number(e),G()}function Zt(e){at=Number(e),G()}function ta(e){F=e,G()}function aa(e){et=Number(e),G()}function ea(e){q=Number(e),G()}function oa(e){Q=Number(e),G()}function sa(e){H=Number(e),G()}function ot(e,t,p){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(e/t*100,100)}%;background:${p};"></div></div>`}function G(){const e=document.getElementById("rd-modal");if(!e||!K)return;const t=K,p=_==="LOAN"?"#5a8aaa":_==="INSURE"?"#aa7a5a":"#8a6aaa",r=Math.round(M*(j/100)*(at/12)),c=Math.round((M+r)/at),l=t.revenue||474e5,v=Math.round(c/l*1200),a=12,u=Math.max(0,(j-6)*1.5),o=M>15e6?3:0,s=F==="none"?3:F==="full"?-2:0,y=Math.min(60,Math.max(2,Math.round(a+u+o+s))),E=y<=15?"#5c5":y<=30?"#ca5":y<=45?"#c84":"#c55",A=y<=15?"LOW":y<=30?"MODERATE":y<=45?"ELEVATED":"HIGH",w=95,R=(j-4)*8,O=M<(t.amount||18e6)?10:0,P=F==="full"?15:F==="property"?8:F==="none"?-5:0,T=Math.max(10,Math.min(95,Math.round(w-R-O-P))),B=T>=70?"#5c5":T>=45?"#ca5":T>=25?"#c84":"#c55",m=Ct.find(k=>k.id===F),d=Math.round(r*(1-y/100)),f=(t.term||18)/12,x=Math.round(q*(et/100)*f),N=100-(t.reputation||50),h=Math.max(5,Math.min(50,Math.round(N*.4))),dt=Math.round(q*(1-Q/100)),_t=Math.round(dt*(h/100)),st=x-_t,pt=h<=12?"#5c5":h<=22?"#ca5":h<=35?"#c84":"#c55",vt=t.couponRate||6.2,xt=t.term||60,ht=xt/12,kt=Math.round(H*(vt/100)),$t=Math.round(H*(vt/100)*ht),Z=t.stability||50,Et=t.creditRating||50,wt=t.debtToGdp||30,St=Math.max(2,Math.round((100-Z)*.15+(100-Et)*.15+Math.max(0,wt-30)*.3)),Y=Math.min(60,St),ft=Y<=10?"#5c5":Y<=20?"#ca5":Y<=35?"#c84":"#c55",At=Math.round($t*(1-Y/100));let i=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${p};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>`;if(i+=`<div class="rd-tabs">
        <span class="rd-tab ${_==="LOAN"?"active-loan":_==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${_==="LOAN"?"Loan":_==="INSURE"?"Insure":"Bond"} — ${b(t.applicant)}</span>
    </div></div>`,i+='<div class="rd-body">',i+='<div class="rd-left">',_==="LOAN"){const k=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84";i+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${b(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${b(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REVENUE</div><div class="rd-applicant__stat-value" style="color:#5c5;">${n(t.revenue||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${n(t.debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${k};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(t.amount)}</div></div>
            </div>
        </div>`,i+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const S=(j-3)/15*100;i+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${j}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${j}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${S}%,#2a2a24 ${S}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`;const V=15e7,W=(M-5e6)/Math.max(1,V-5e6)*100;i+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">LOAN AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${n(M)}</span>
            </div>
            <input type="range" class="rd-control__range" min="5000000" max="${V}" step="5000000" value="${M}"
                oninput="rdSetLoanAmount(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${W}%,#2a2a24 ${W}%);">
            <div class="rd-control__hints"><span>$5M</span><span>$150M</span></div>
        </div>`,i+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">TERM (MONTHS)</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${at}mo</span>
            </div>
            <div class="rd-presets">`;for(const C of[12,24,36,48,60,72,84,96,108,120])i+=`<span class="rd-preset" onclick="rdSetLoanTerm(${C})" style="${at===C?"color:#000;background:#5a8aaa;border-color:#5a8aaa;":""}">${C}</span>`;i+="</div></div>",i+=`<div class="rd-control">
            <div class="rd-control__label" style="margin-bottom:6px;">COLLATERAL REQUIREMENT</div>
            <div class="rd-presets">`;for(const C of Ct){const $=F===C.id;i+=`<div onclick="rdSetCollateral('${C.id}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${$?"rgba(90,138,170,0.09)":"transparent"};border:1px solid ${$?"rgba(90,138,170,0.27)":"#2a2a24"};">
                <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${$?"#5a8aaa":"#6a6660"};">${C.label}</div>
            </div>`}i+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">${m.desc}</div>
        </div>`}if(_==="INSURE"){const k=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84",S=t.projectValue?"PROJECT":"FLEET",V=t.projectValue||t.fleetValue||0;i+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${b(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${b(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${k};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${S}</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(V)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${t.term}mo</div></div>
            </div>
        </div>`,i+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const W=(et-1)/7*100;i+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${et}%</span>
            </div>
            <input type="range" class="rd-control__range" min="1" max="8" step="0.5" value="${et}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${W}%,#2a2a24 ${W}%);">
            <div class="rd-control__hints"><span>1% (competitive)</span><span>8% (expensive)</span></div>
        </div>`;const C=Math.round((t.projectValue||t.fleetValue||t.amount)*.7),$=Math.round(t.amount*.33),nt=(q-$)/(C-$)*100;i+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${n(q)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${$}" max="${C}" step="1000000" value="${q}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${nt}%,#2a2a24 ${nt}%);">
            <div class="rd-control__hints"><span>${n($)} (partial)</span><span>${n(C)} (max)</span></div>
        </div>`,i+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${Q}%</span>
            </div>
            <div class="rd-presets">`;for(const ut of[5,10,15,20,25])i+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${ut})" style="${Q===ut?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${ut}%</span>`;i+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${Q}% of any claim (${n(Math.round(q*Q/100))})</div>
        </div>`}if(_==="BOND"){const k=Z>=50?"#5c5":Z>=30?"#ca5":Z>=15?"#c84":"#c55";i+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${b(t.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${b(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${n(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${vt}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${xt}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${k};">${Z}</div></div>
            </div>
        </div>`,i+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const S=t.amount,V=Math.max(5e6,Math.ceil(S*.05/5e6)*5e6),W=(H-V)/(S-V)*100;i+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${n(H)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${V}" max="${S}" step="5000000" value="${H}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${W}%,#2a2a24 ${W}%);">
            <div class="rd-control__hints"><span>${n(V)} (small position)</span><span>${n(S)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,i+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const C=[{key:"stability",value:Z,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:wt,label:"Debt burden",invert:!0},{key:"credit_rating",value:Et,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:t.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:t.corruption||62,label:"Institutional risk",invert:!0}];for(const $ of C){const nt=$.invert?$.value>60?"#c55":$.value>40?"#ca5":"#5c5":$.value>=50?"#5c5":$.value>=30?"#ca5":$.value>=15?"#c84":"#c55";i+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${$.key}</span>
                <div style="width:40px;">${ot($.value,100,nt)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:18px;text-align:right;">${$.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${$.label}</span>
            </div>`}i+="</div>"}if(i+="</div>",i+='<div class="rd-right">',_==="LOAN"){i+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',i+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${E};">${y}%</span>
            </div>
            ${ot(y,100,E)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${E};margin-top:4px;">${A}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,i+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',i+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${B};">${T}%</span>
            </div>
            ${ot(T,100,B)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,i+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',i+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${n(M)}</span></div>`,i+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${n(r)}</span></div>`,i+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${n(c)}</span></div>`;const k=v>30?"#c55":v>15?"#ca5":"#5c5";i+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${k};">${v}% of revenue</span></div>`,i+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${n(d)}</span></div>`,i+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${y}% default)</div>`}if(_==="INSURE"){i+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',i+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${pt};">${h}%</span>
            </div>
            ${ot(h,100,pt)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,i+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',i+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${n(dt)}</span></div>`,i+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${n(x)}</span></div>`,i+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${n(_t)}</span></div>`;const k=st>0?"":" negative",S=st>0?"#5c5":"#c55";i+=`<div class="rd-expected${k}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${S};">${n(st)}</span></div>`,i+=`<div class="rd-formula">Premiums (${n(x)}) − expected payout (${h}% × ${n(dt)})</div>`}_==="BOND"&&(i+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',i+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${ft};">${Y}%</span>
            </div>
            ${ot(Y,100,ft)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,i+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',i+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${n(H)}</span></div>`,i+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${n(kt)}</span></div>`,i+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(ht)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${n($t)}</span></div>`,i+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${n(At)}</span></div>`,i+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${Y}% default)</div>`),i+="</div>",i+="</div>";const Dt=_==="LOAN"?M:_==="INSURE"?q:H,Mt=_==="LOAN"?d:_==="INSURE"?st:At,zt=_==="LOAN"?y:_==="INSURE"?h:Y,Ut=_==="LOAN"?E:_==="INSURE"?pt:ft,Pt=_==="LOAN"?"ISSUE LOAN":_==="INSURE"?"WRITE POLICY":"BUY BONDS",Bt=_.toLowerCase();i+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${n(Dt)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${n(Mt)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${Ut};">${zt}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${Bt}" onclick="rdSubmitOffer()">${Pt}</button>
        </div>
    </div>`,e.innerHTML=i}window.rdOpen=Kt;window.rdClose=Ot;window.rdSetLoanRate=Qt;window.rdSetLoanAmount=Jt;window.rdSetLoanTerm=Zt;window.rdSetCollateral=ta;window.rdSetInsurePremium=aa;window.rdSetInsureCoverage=ea;window.rdSetInsureDeductible=oa;window.rdSetBondAmount=sa;let tt=!1;async function na(){if(!K||!g||!z||tt||K.type!=="LOAN")return;tt=!0;const e=j;if(e<1||e>20){alert("Interest rate must be 1-20%."),tt=!1;return}if((Number(g.corp_cash_reserves)||0)<K.amount){alert("Insufficient cash reserves to fund this loan."),tt=!1;return}const r={none:"unsecured",equipment:"equipment",property:"property",full:"property"}[F]||"unsecured",c=z.current_tick||0,{error:l}=await U.from("finance_loan_offers").insert({request_id:K.requestId,offering_faction_id:g.id,interest_rate:e,collateral_type:r,created_tick:c});if(l){tt=!1,l.message.includes("unique")||l.message.includes("duplicate")?alert("You have already submitted an offer for this loan request."):alert("Failed to submit offer: "+l.message);return}Ot(),X=-1,await It(),tt=!1}window.rdSubmitOffer=na;async function la(){if(!g){ct();return}const{data:e}=await U.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker)").eq("lender_faction_id",g.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1});L=(e||[]).map(t=>({id:t.id,type:"LOAN",counterparty:t.borrower?.faction_name||"Unknown",abbr:t.borrower?.abbreviation||t.borrower?.corp_ticker||"??",remaining:t.principal-t.total_paid,principal:t.principal,earned:t.total_interest_paid||0,rate:t.interest_rate,term:t.term_months,paymentsMade:t.payments_made,paymentsMissed:t.payments_missed,monthlyPayment:t.monthly_payment,status:t.status.toUpperCase(),collateral:t.collateral_type,purpose:t.purpose||"",alert:t.status==="late"||t.status==="delinquent",alertLevel:t.status==="delinquent"?"red":t.status==="late"?"orange":null,alertMsg:t.status==="delinquent"?`${t.payments_missed} missed payments. Default imminent.`:t.status==="late"?`${t.payments_missed} missed payment${t.payments_missed>1?"s":""}. Monitor closely.`:null})),ct()}async function ia(){if(!g){yt();return}const{data:e}=await U.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker)").eq("lender_faction_id",g.id).in("status",["repaid","defaulted"]).order("completed_tick",{ascending:!1});I=(e||[]).map(t=>{const p=t.total_interest_paid||0,r=t.status==="defaulted"?Math.max(0,t.principal-t.total_paid):0;return{type:"LOAN",counterparty:t.borrower?.faction_name||"Unknown",abbr:t.borrower?.abbreviation||t.borrower?.corp_ticker||"??",nation:"",outcome:t.status==="repaid"?"REPAID":"DEFAULTED",principal:t.principal,earned:p,lost:r,net:p-r,resolved:t.completed_tick?"Tick "+t.completed_tick:"",term:t.term_months+"mo",rate:t.interest_rate+"%",note:t.status==="repaid"?`Fully repaid over ${t.payments_made} payments.`:`Defaulted after ${t.payments_missed} missed payments. ${t.collateral_type!=="unsecured"?"Collateral ("+t.collateral_type+") partially recovered losses.":"Unsecured — no collateral recovery."}`}}),yt()}async function ra(){const{data:{user:e}}=await U.auth.getUser();if(!e){window.location.href="login.html";return}const{data:t}=await U.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);J=(t||[]).filter(l=>l.nation_id);const p=sessionStorage.getItem("active_faction_id");if(g=J.find(l=>l.id===p)||J.find(l=>l.faction_type==="corporation")||J[0],!g){await U.auth.signOut(),window.location.href="login.html";return}if(g.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(g.corp_sector!=="Finance"){window.location.href="corp-operations.html"+window.location.search;return}sessionStorage.setItem("active_faction_id",g.id);const[r,c]=await Promise.all([g.nation_id?U.from("nations").select("*").eq("id",g.nation_id).single():Promise.resolve({data:null}),U.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);r.data&&r.data,z=c.data,document.getElementById("corp-name-bar").textContent=g.faction_name||"Corp",document.getElementById("corp-name-badge").textContent=(g.abbreviation||g.corp_ticker||g.faction_name||"--").toUpperCase(),document.getElementById("topbar-cash").textContent="CASH: "+n(Number(g.corp_cash_reserves)||0),z&&(document.getElementById("game-date").textContent=z.current_date||Ft(z.current_tick),document.getElementById("tick-number").textContent=z.current_tick||"--"),ca(),await It(),await la(),Yt(),await ia(),z?.next_tick_at&&ua(z.next_tick_at)}function ca(){const e=document.getElementById("corp-faction-dropdown");if(!e||J.length<=1)return;let t="";for(const p of J){const r=p.id===g.id,c=p.faction_type==="corporation"?"CORP":"PARTY";t+=`<div class="corp-faction-dropdown__item${r?" active":""}" onclick="switchFaction('${p.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${p.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${p.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${p.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${c}</span>
            <span>${b(p.faction_name||"--")}</span>
        </div>`}e.innerHTML=t}function da(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function pa(e){sessionStorage.setItem("active_faction_id",e);const t=J.find(p=>p.id===e);t&&t.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}function va(){document.body.classList.toggle("light-mode");const e=document.body.classList.contains("light-mode");localStorage.setItem("theme",e?"light":"dark"),document.getElementById("theme-toggle").textContent=e?"Dark":"Light"}async function fa(){await U.auth.signOut(),window.location.href="login.html"}function ua(e){const t=document.getElementById("tick-countdown");function p(){const r=new Date(e)-new Date;if(r<=0){t.textContent="Processing...";return}const c=Math.floor(r/36e5),l=Math.floor(r%36e5/6e4),v=Math.floor(r%6e4/1e3);t.textContent=`${c}h ${l}m ${v}s`}p(),setInterval(p,1e3)}localStorage.getItem("theme")==="light"&&(document.body.classList.add("light-mode"),document.getElementById("theme-toggle").textContent="Dark");window.toggleCorpDropdown=da;window.switchFaction=pa;window.toggleTheme=va;window.doLogout=fa;ra();
