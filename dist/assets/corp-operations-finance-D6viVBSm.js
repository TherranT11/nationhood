const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BGmUeelO.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as g}from"./supabase-client-CiYoFhIh.js";/* empty css                    */import{_ as tt}from"./preload-helper-BXl3LOEh.js";import{e as E}from"./utils-CY90Gazr.js";let Z=[],_=null,U=null,Ae=!1;function c(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+Math.round(o).toLocaleString()}const Re={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},at={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}};let G=[],me="ALL",oe="all",Q=-1;async function Fe(){if(!_||!U)return;const{data:o,error:t}=await g.from("finance_loan_requests").select("*, requesting_faction:factions!requesting_faction_id(id, faction_name, abbreviation, corp_ticker, corp_subsector, nation_id, corp_cash_reserves, corp_debt, corp_reputation), issuer_nation:nations!issuer_nation_id(id, name, stability, credit, debt, gdp, gdp_growth, corruption)").eq("status","open").order("created_tick",{ascending:!1});t&&console.error("[DealFlow] Request query error:",t.message);const i=[...new Set((o||[]).filter(e=>e.requesting_faction?.nation_id).map(e=>e.requesting_faction.nation_id))];let a={};if(i.length>0){const{data:e}=await g.from("nations").select("id, name, stability, credit, gdp, gdp_growth, corruption, debt").in("id",i);for(const n of e||[])a[n.id]=n}const{data:r}=await g.from("finance_loan_offers").select("request_id").eq("offering_faction_id",_.id),l=new Set((r||[]).map(e=>e.request_id)),b=[...new Set((o||[]).filter(e=>e.requesting_faction?.id).map(e=>e.requesting_faction.id))];let p={};if(b.length>0){const{data:e}=await g.from("finance_active_loans").select("borrower_faction_id, principal, total_paid").in("borrower_faction_id",b).in("status",["current","late","delinquent"]);for(const d of e||[]){p[d.borrower_faction_id]||(p[d.borrower_faction_id]={count:0,totalOutstanding:0}),p[d.borrower_faction_id].count++;const s=Math.max(0,Number(d.principal||0)-Number(d.total_paid||0));p[d.borrower_faction_id].totalOutstanding+=s}const{data:n}=await g.from("subsidiary_auto_policies").select("borrower_faction_id, principal, remaining_principal").in("borrower_faction_id",b).eq("service_type","loan").eq("status","active");for(const d of n||[])p[d.borrower_faction_id]||(p[d.borrower_faction_id]={count:0,totalOutstanding:0}),p[d.borrower_faction_id].count++,p[d.borrower_faction_id].totalOutstanding+=Number(d.remaining_principal||d.principal||0)}const u=(_.corp_subsector||"").toLowerCase();G=(o||[]).filter(e=>e.request_type==="bond"?u==="investment":e.request_type==="insurance"?u==="insurance":u==="banking").map(e=>{if(e.request_type==="bond"){const n=e.issuer_nation,d=Number(n?.stability??50),s=Number(n?.credit??50),h=Number(n?.gdp??1),w=Number(n?.debt??0),N=h>0?Math.round(w/h*100):0;return{id:e.id,type:"BOND",applicant:n?.name||"Unknown Nation",abbr:(n?.name||"??").slice(0,3).toUpperCase(),entity:"GOV",nation:n?.name||"N/A",nation_id:e.issuer_nation_id,amount:e.amount||0,term:e.term_months,couponRate:Number(e.coupon_rate||5),purpose:e.purpose||"Government Bond",stability:d,creditRating:s,debtToGdp:N,gdpGrowth:Number(n?.gdp_growth??50),corruption:Number(n?.corruption??50),risk:d>=60&&s>=50?"LOW":d>=35&&s>=30?"MODERATE":"HIGH",isNew:!l.has(e.id),ticksLeft:(e.expires_tick||0)-(U?.current_tick||0),requestId:e.id,alreadyOffered:l.has(e.id)}}if(e.request_type==="insurance"){const n=Number(e.requesting_faction?.corp_reputation??50),d=Number(a[e.requesting_faction?.nation_id]?.stability??50);return{id:e.id,type:"INSURE",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:a[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,amount:e.amount||0,term:e.term_months||0,purpose:e.purpose||"Construction Insurance",reputation:n,projectValue:e.amount||0,stability:d,risk:n>=60&&d>=50?"LOW":n>=35?"MODERATE":"HIGH",isNew:!l.has(e.id),ticksLeft:(e.expires_tick||0)-(U?.current_tick||0),requestId:e.id,insuredContractId:e.insured_contract_id,insuredVesselId:e.insured_vessel_id,isVesselInsurance:!!e.insured_vessel_id,alreadyOffered:l.has(e.id),requestingFactionId:e.requesting_faction?.id}}return{id:e.id,type:"LOAN",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:a[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,requestingFactionId:e.requesting_faction?.id,amount:e.amount,term:e.term_months,purpose:e.purpose||"",reputation:Number(e.requesting_faction?.corp_reputation??50),revenue:Number(e.requesting_faction?.corp_cash_reserves??0),corp_cash_reserves:Number(e.requesting_faction?.corp_cash_reserves??0),corp_debt:Number(e.requesting_faction?.corp_debt??0),activeLoans:(p[e.requesting_faction?.id]||{}).count||0,totalOutstanding:(p[e.requesting_faction?.id]||{}).totalOutstanding||0,creditRating:Number(a[e.requesting_faction?.nation_id]?.credit??50),stability:Number(a[e.requesting_faction?.nation_id]?.stability??50),risk:(()=>{const n=Number(a[e.requesting_faction?.nation_id]?.credit??50),d=Number(e.requesting_faction?.corp_reputation??50);return n>=60&&d>=60?"LOW":n>=35&&d>=35?"MODERATE":n>=20||d>=20?"ELEVATED":"HIGH"})(),isNew:!l.has(e.id),ticksLeft:(e.expires_tick||0)-(U?.current_tick||0),collateral:e.collateral_type||"unsecured",requestId:e.id,alreadyOffered:l.has(e.id)}}),be()}function Pe(o){if(!_)return!1;const t=(_.corp_subsector||"").toLowerCase(),i=yt[t];return o.type===i}function ot(o){me=o,Q=-1,be()}function nt(o){Q=Q===o?-1:o,be()}function be(){const o=document.getElementById("df-container");if(!o)return;let t=me==="ALL"?G:G.filter(e=>e.type===me);oe==="mine"&&_?.nation_id&&(t=t.filter(e=>e.nation_id===_.nation_id));const i=G.filter(e=>e.isNew).length,a=G.length;let r=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${i>0?`<span class="df-badge df-badge-corp" style="font-size:8px;">${i} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${a} OPEN</span>
        </div>
    </div>`;const l=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];r+='<div class="df-filters">';for(const e of l)r+=`<span class="df-pill${me===e.id?" "+e.activeClass:""}" onclick="dfSetFilter('${e.id}')">${e.label}</span>`;r+=`<span style="margin-left:auto;font-family:var(--font-mono);font-size:7px;cursor:pointer;padding:2px 6px;border:1px solid ${oe==="mine"?"#5c544":"#2a2a24"};color:${oe==="mine"?"#5c5":"#6a6660"};background:${oe==="mine"?"rgba(92,204,92,0.06)":"transparent"};" onclick="dfToggleNation()">${oe==="mine"?"MY NATION":"ALL NATIONS"}</span>`,r+="</div>",r+='<div class="df-list">',t.length===0&&(r+='<div class="ap-empty">No deals available.<br>Deals appear when corporations request financing or governments issue bonds.</div>');for(let e=0;e<t.length;e++){const n=t[e],d=G.indexOf(n),s=Q===d,h=Re[n.type],w=at[n.risk],N=Pe(n);r+=`<div class="df-deal${s?" sel-"+h.class:""}" onclick="dfSelectDeal(${d})" style="${N?"":"opacity:0.5;"}">`,n.isNew&&N&&(r+='<div class="df-new-dot"></div>'),r+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span class="df-badge df-badge-${h.class}">${h.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;">${E(n.applicant)}</span>
            <span class="df-badge df-badge-${n.entity.toLowerCase()}">${n.entity}</span>
            ${N?"":'<span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`,r+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${E(n.nation.toUpperCase())}</span>
            <span class="df-badge ${w.class}" style="font-weight:700;line-height:12px;background:currentColor;-webkit-background-clip:unset;padding:0 4px;">`,r+="</span>",r=r.slice(0,r.lastIndexOf('<span class="df-badge '+w.class));const A=w.class==="df-risk-low"?"#5c5":w.class==="df-risk-moderate"?"#ca5":w.class==="df-risk-elevated"?"#c84":"#c55";r+=`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${A};background:${A}12;border:1px solid ${A}25;">${w.label}</span>
        </div>`;const B=n.type==="BOND"?"FACE VALUE":n.type==="INSURE"?"COVERAGE":"AMOUNT",j=n.type==="BOND"?"COUPON":"REP",M=n.type==="BOND"?n.couponRate+"%":n.reputation||n.stability,F=n.type==="BOND"?n.couponRate*10:n.reputation||n.stability,z=n.type==="BOND"?"#c8a832":F>=60?"#5c5":F>=35?"#ca5":"#c84";if(r+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${B}</div>
                <div class="df-metrics__value" style="font-size:12px;color:#e8e4dc;">${c(n.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:11px;color:#e8e4dc;">${n.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${j}</div>
                <div class="df-metrics__value" style="font-size:11px;color:${z};">${M}</div>
            </div>
        </div>`,s){if(r+=`<div style="margin-top:6px;font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(n.purpose)}</div>`,N)r+='<div class="df-detail">';else{const m=n.type==="LOAN"?"Banking":n.type==="INSURE"?"Insurance":"Investment";r+=`<div style="padding:6px 8px;background:rgba(106,102,96,0.06);border:1px solid #2a2a24;font-family:var(--font-mono);font-size:8px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:#e8e4dc;font-weight:700;">${m}</span> subsector to underwrite.
                    ${_?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+E(_.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(N){if(n.type==="LOAN"){const m=n.corp_cash_reserves>0?Math.round(n.corp_debt/n.corp_cash_reserves*100):0,S=m>50?"#c84":"#5c5",R=n.corp_debt>n.corp_cash_reserves*.5?"#c84":"#9e9a92";r+=`<div class="df-detail-row"><span class="df-detail-label">CASH</span><span class="df-detail-value" style="color:#9e9a92;">${c(n.corp_cash_reserves)}</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">DEBT</span><span class="df-detail-value" style="color:${R};">${c(n.corp_debt)}</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/CASH</span><span class="df-detail-value" style="color:${S};font-weight:700;">${m}%</span></div>`}else if(n.type==="BOND"){const m=n.stability>=50?"#5c5":n.stability>=30?"#ca5":"#c84",S=n.debtToGdp>60?"#c55":n.debtToGdp>40?"#c84":"#5c5",R=n.creditRating>=60?"#5c5":n.creditRating>=35?"#ca5":"#c55";r+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${m};">${n.stability}/100</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${S};">${n.debtToGdp}%</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${R};font-weight:700;">${n.creditRating}/100</span></div>`}else if(n.type==="INSURE"){const m=n.reputation>=60?"#5c5":n.reputation>=35?"#ca5":"#c84",S=n.projectValue?"PROJECT VALUE":"FLEET VALUE",R=n.projectValue||n.fleetValue;r+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${m};">${n.reputation}/100</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">${S}</span><span class="df-detail-value" style="color:#9e9a92;">${c(R)}</span></div>`}r+="</div>"}}r+="</div>"}r+="</div>";const b=G.filter(e=>e.type==="LOAN").length,p=G.filter(e=>e.type==="INSURE").length,u=G.filter(e=>e.type==="BOND").length;r+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${b}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${p}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${u}</span></div>
        </div>
        ${(()=>{const e=Q>=0?G[Q]:null,n=e&&Pe(e);return n?`<div class="df-review-btn active" onclick="rdOpen(${Q})">REVIEW DEAL</div>`:e&&!n?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,o.innerHTML=r}function it(){oe=oe==="all"?"mine":"all",Q=-1,be()}window.dfSetFilter=ot;window.dfToggleNation=it;window.dfSelectDeal=nt;const Ue={CURRENT:{color:"#5c5",label:"CURRENT"},LATE:{color:"#c84",label:"LATE"},DELINQUENT:{color:"#c55",label:"DELINQUENT"},CLAIM:{color:"#c55",label:"CLAIM FILED"},ACTIVE:{color:"#5c5",label:"ACTIVE"},WATCHLIST:{color:"#ca5",label:"WATCHLIST"},DEFAULT:{color:"#c55",label:"DEFAULT"}};let T=[],_e="ALL",ge=-1;function st(o){_e=o,ge=-1,Y()}function rt(o){ge=ge===o?-1:o,Y()}function Y(){const o=document.getElementById("ap-container");if(!o)return;const t=_e==="ALL"?T:T.filter(d=>d.type===_e),i=T.reduce((d,s)=>d+(s.remaining||s.coverage||s.faceValue||0),0),a=T.reduce((d,s)=>d+(s.earned||s.premiumsCollected||s.couponsReceived||0),0),r=T.filter(d=>d.alert).length;let l=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Active Portfolio</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${r>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:#c55;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);">${r} ALERT${r>1?"S":""}</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${T.length} ACTIVE</span>
        </div>
    </div>`;l+=`<div class="ap-summary">
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EXPOSURE</div>
            <div class="ap-summary__value" style="font-size:14px;color:#c55;">${c(i)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EARNED</div>
            <div class="ap-summary__value" style="font-size:14px;color:#5c5;">${c(a)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:0.6;">
            <div class="ap-summary__label">DEALS</div>
            <div style="display:flex;gap:4px;margin-top:3px;">
                ${["LOAN","INSURE","BOND"].map(d=>{const s=T.filter(w=>w.type===d).length;return`<div style="display:flex;align-items:center;gap:2px;"><div style="width:4px;height:4px;background:${d==="LOAN"?"#5a8aaa":d==="INSURE"?"#aa7a5a":"#8a6aaa"};border-radius:1px;"></div><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#9e9a92;">${s}</span></div>`}).join("")}
            </div>
        </div>
    </div>`,l+='<div class="df-filters">';for(const d of[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Policies",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}])l+=`<span class="df-pill${_e===d.id?" "+d.activeClass:""}" onclick="apSetFilter('${d.id}')">${d.label}</span>`;l+="</div>",l+='<div class="ap-list">',t.length===0&&(l+='<div class="ap-empty">No active positions.<br>Review deals from the Deal Flow to build your portfolio.</div>');for(let d=0;d<t.length;d++){const s=t[d],h=T.indexOf(s),w=ge===h,N=Re[s.type],A=Ue[s.status]||Ue.CURRENT,B=!!s.alert,j=s.paymentsMade||0,M=s.term||1,F=Math.round(j/M*100),z=B?A.color==="#c55"?"alert-red":A.color==="#c84"?"alert-orange":"alert-yellow":"";l+=`<div class="ap-deal ${z}" onclick="apToggle(${h})">
            <div class="ap-deal__inner" style="${w?"background:"+(N.class==="loan"?"rgba(90,138,170,0.08)":N.class==="insure"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,l+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${N.class}">${N.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;flex:1;">${E(s.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${A.color};background:${A.color}12;border:1px solid ${A.color}25;">${A.label}</span>
        </div>`,l+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${E((s.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${j}/${M}mo — ${F}%</span>
        </div>`;const m=B?A.color:N.class==="loan"?"#5a8aaa":N.class==="insure"?"#aa7a5a":"#8a6aaa";l+=`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(F,100)}%;background:${m};"></div></div>`;const S=s.type==="LOAN"?"REMAINING":s.type==="INSURE"?"COVERAGE":"FACE VALUE",R=s.remaining||s.coverage||s.faceValue||0,q=s.type==="LOAN"?"RATE":s.type==="INSURE"?"PREMIUM":"COUPON",re=s.rate||s.premiumRate||s.coupon||0,ae=s.earned||s.premiumsCollected||s.couponsReceived||0,f=N.class==="loan"?"#5a8aaa":N.class==="insure"?"#aa7a5a":"#8a6aaa";if(l+=`<div class="df-metrics" style="margin-top:4px;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${S}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#e8e4dc;margin-top:1px;">${c(R)}</div>
            </div>
            <div style="flex:0.8;padding:3px 6px;text-align:center;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${q}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${f};margin-top:1px;">${re}%</div>
            </div>
            <div style="flex:1;padding:3px 6px;text-align:right;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">EARNED</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5c5;margin-top:1px;">${c(ae)}</div>
            </div>
        </div>`,B&&(l+=`<div class="ap-deal__alert" style="background:${A.color}08;border:1px solid ${A.color}20;color:${A.color};">${E(s.alert)}</div>`),w){if(l+='<div class="ap-deal__expanded">',s.type==="LOAN"){const y=[{label:"PRINCIPAL",value:c(s.principal||0)},{label:"REMAINING",value:c(s.remaining||0),color:"#e8e4dc"},{label:"MONTHLY PAYMENT",value:c(s.monthlyPayment||0)},{label:"MISSED PAYMENTS",value:String(s.missedPayments||0),color:(s.missedPayments||0)>0?"#c55":"#5c5"},{label:"NEXT DUE",value:s.nextPayment||"—",color:s.status==="LATE"?"#c55":"#9e9a92"}];for(const $ of y)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${$.label}</span><span class="ap-detail-value" style="color:${$.color||"#9e9a92"};">${$.value}</span></div>`;s.status!=="CURRENT"&&(l+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apRestructure('${s.id}')">RESTRUCTURE</div><div class="ap-action-btn orange" onclick="apCallLoan('${s.id}')">CALL LOAN</div><div class="ap-action-btn red" onclick="apForeclose('${s.id}')">FORECLOSE</div></div>`)}else if(s.type==="INSURE"){const y=[{label:"COVERAGE",value:c(s.coverage||0)},{label:"PREMIUMS COLLECTED",value:c(s.premiumsCollected||0),color:"#5c5"},{label:"CLAIMS FILED",value:String(s.claims||0),color:(s.claims||0)>0?"#c84":"#5c5"},{label:"PAID OUT",value:c(s.paidOut||0),color:(s.paidOut||0)>0?"#c55":"#6a6660"}];for(const $ of y)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${$.label}</span><span class="ap-detail-value" style="color:${$.color||"#9e9a92"};">${$.value}</span></div>`;s.status==="CLAIM"&&s.claimAmount&&(l+=`<div class="ap-claim-box"><div style="font-family:var(--font-mono);font-size:7px;color:#c55;letter-spacing:0.8px;margin-bottom:2px;">PENDING CLAIM</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${c(s.claimAmount)}</div></div>`,l+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apPayClaim('${s.id}')">PAY IN FULL</div><div class="ap-action-btn orange" onclick="apNegotiateClaim('${s.id}')">NEGOTIATE</div><div class="ap-action-btn red" onclick="apDisputeClaim('${s.id}')">DISPUTE</div></div>`)}else if(s.type==="BOND"){const y=[{label:"FACE VALUE",value:c(s.faceValue||0)},{label:"COUPONS RECEIVED",value:c(s.couponsReceived||0),color:"#5c5"},{label:"NEXT COUPON",value:s.nextCoupon||"—"},{label:"ANNUAL YIELD",value:c(Math.round((s.faceValue||0)*(s.coupon||0)/100)),color:"#8a6aaa"}];for(const $ of y)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${$.label}</span><span class="ap-detail-value" style="color:${$.color||"#9e9a92"};">${$.value}</span></div>`;l+=`<div class="ap-actions"><div class="ap-action-btn purple" onclick="apSellPosition('${s.id}')">SELL POSITION</div><div class="ap-action-btn olive">HOLD</div></div>`}l+="</div>"}l+="</div></div>"}l+="</div>";const b=T.reduce((d,s)=>d+(s.principal||s.coverage||s.faceValue||0),0),p=b>0?Math.round(a/b*1e4)/100:0,u=T.length>0?Math.round(T.reduce((d,s)=>d+(s.rate||0),0)/T.length*10)/10:0,e=T.filter(d=>d.status==="LATE"||d.status==="DELINQUENT").length,n=T.length>0?Math.round(e/T.length*100):0;l+=`<div class="df-footer" style="flex-direction:column;gap:6px;">
        <div style="display:flex;gap:8px;justify-content:space-between;width:100%;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EXPOSURE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${c(i)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EARNED</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;">${c(a)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">ROI</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${p>=0?"#5c5":"#c55"};">${p}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">AVG RATE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#ca5;">${u}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">RISK</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${n>20?"#c55":n>0?"#ca5":"#5c5"};">${n}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            ${["LOAN","INSURE","BOND"].map(d=>{const s=d==="LOAN"?"#5a8aaa":d==="INSURE"?"#aa7a5a":"#8a6aaa",h=T.filter(w=>w.type===d).length;return`<div style="text-align:center;padding:1px 6px;border:1px solid ${h>0?s+"33":"#2a2a24"};background:${h>0?s+"0a":"transparent"};"><div style="font-family:var(--font-mono);font-size:6px;color:${s};">${d}</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h>0?"#e8e4dc":"#6a6660"};">${h}</div></div>`}).join("")}
        </div>
    </div>`,o.innerHTML=l}window.apSetFilter=st;window.apToggle=rt;async function lt(o){const t=prompt(`RESTRUCTURE LOAN

Enter new annual interest rate (1-20%):
(This extends the term by 12 months and resets missed payments.)`);if(!t)return;const i=parseFloat(t);if(isNaN(i)||i<1||i>20){alert("Rate must be between 1% and 20%.");return}const{data:a}=await g.from("finance_active_loans").select("*").eq("id",o).single();if(!a){alert("Loan not found.");return}const r=a.term_months+12,l=i/100/12,b=Number(a.principal)-Number(a.total_paid||0)+Number(a.total_interest_paid||0),p=l>0?Math.round(b*(l*Math.pow(1+l,r))/(Math.pow(1+l,r)-1)):Math.round(b/r);if(!confirm(`Restructure to ${i}% over ${r} months?
New monthly payment: ${c(p)}
Missed payments reset to 0.`))return;const{error:u}=await g.from("finance_active_loans").update({interest_rate:i,term_months:r,monthly_payment:p,payments_missed:0,status:"current"}).eq("id",o);if(u){alert("Failed: "+u.message);return}alert("Loan restructured."),await te(),Y()}async function ct(o){if(!confirm(`CALL LOAN

Demand immediate full repayment of remaining principal.
The borrower will have 3 ticks to pay or default.

Proceed?`))return;const{error:t}=await g.from("finance_active_loans").update({status:"delinquent",payments_missed:3}).eq("id",o);if(t){alert("Failed: "+t.message);return}alert("Loan called. Borrower has 1 tick to pay before default."),await te(),Y()}async function dt(o){if(!confirm(`FORECLOSE

Immediately default the loan and seize collateral.
Collateral recovery: Equipment 60%, Property 75%, Unsecured 0%.

This cannot be undone. Proceed?`))return;const{data:t}=await g.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Loan not found.");return}const i=Math.max(0,Number(t.principal)-Number(t.total_paid||0));let a=0;t.collateral_type==="equipment"?a=.6:t.collateral_type==="property"&&(a=.75);const r=Math.round(i*a);if(r>0){const{data:l}=await g.from("factions").select("corp_cash_reserves").eq("id",_.id).single();await g.from("factions").update({corp_cash_reserves:Number(l?.corp_cash_reserves||0)+r}).eq("id",_.id),_.corp_cash_reserves=Number(l?.corp_cash_reserves||0)+r}await g.from("finance_active_loans").update({status:"defaulted",completed_tick:U?.current_tick||0}).eq("id",o),alert("Foreclosed. Recovered: "+c(r)+" from "+(t.collateral_type||"unsecured")+" collateral."),await te(),Y()}async function pt(o){const{data:t}=await g.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Policy not found.");return}const i=Number(t.principal||0)-Number(t.claims_paid||0),a=Number(t.deductible_pct||0)/100,r=Math.round(i*(1-a));if(!confirm(`PAY CLAIM IN FULL

Claim: ${c(i)}
Deductible: ${t.deductible_pct}%
Payout: ${c(r)}

This will be deducted from your cash reserves.`))return;const{data:l}=await g.from("factions").select("corp_cash_reserves").eq("id",_.id).single(),b=Number(l?.corp_cash_reserves||0);if(b<r){alert("Insufficient funds. You have "+c(b)+".");return}await g.from("factions").update({corp_cash_reserves:b-r}).eq("id",_.id),_.corp_cash_reserves=b-r;const{data:p}=await g.from("factions").select("corp_cash_reserves").eq("id",t.borrower_faction_id).single();p&&await g.from("factions").update({corp_cash_reserves:Number(p.corp_cash_reserves||0)+r}).eq("id",t.borrower_faction_id),await g.from("finance_active_loans").update({claims_paid:Number(t.claims_paid||0)+r,claims_count:(t.claims_count||0)+1}).eq("id",o),alert("Claim paid: "+c(r)),await te(),Y()}async function ft(o){const t=prompt(`NEGOTIATE CLAIM

Offer a percentage of the claim to settle (10-90%):
(Policyholder may reject low offers.)`);if(!t)return;const i=parseInt(t);if(isNaN(i)||i<10||i>90){alert("Must be between 10% and 90%.");return}const a=i/100;if(!(Math.random()<a)){alert("Offer rejected. The policyholder wants a higher settlement.");return}const{data:l}=await g.from("finance_active_loans").select("*").eq("id",o).single();if(!l)return;const b=Number(l.principal||0)-Number(l.claims_paid||0),p=Math.round(b*i/100),{data:u}=await g.from("factions").select("corp_cash_reserves").eq("id",_.id).single(),e=Number(u?.corp_cash_reserves||0);if(e<p){alert("Insufficient funds.");return}await g.from("factions").update({corp_cash_reserves:e-p}).eq("id",_.id),_.corp_cash_reserves=e-p;const{data:n}=await g.from("factions").select("corp_cash_reserves").eq("id",l.borrower_faction_id).single();n&&await g.from("factions").update({corp_cash_reserves:Number(n.corp_cash_reserves||0)+p}).eq("id",l.borrower_faction_id),await g.from("finance_active_loans").update({claims_paid:Number(l.claims_paid||0)+p,claims_count:(l.claims_count||0)+1,status:"repaid"}).eq("id",o),alert("Claim settled at "+i+"% ("+c(p)+"). Policy closed."),await te(),Y()}async function vt(o){if(!confirm(`DISPUTE CLAIM

Challenge the validity of this claim.
This freezes the claim for 4 ticks while investigated.
If investigation finds the claim valid, you pay in full + 10% penalty.
If investigation finds fraud, claim is dismissed.

Dispute?`))return;Math.random()<.7?alert(`Investigation complete: claim is VALID.
You must now pay the full claim.`):(await g.from("finance_active_loans").update({status:"repaid",claims_count:0}).eq("id",o),alert(`Investigation complete: FRAUDULENT CLAIM detected.
Claim dismissed. Policy remains active.`)),await te(),Y()}async function ut(o){const{data:t}=await g.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Position not found.");return}const i=Number(t.principal||0)-Number(t.total_paid||0),a=Math.round(i*.85);if(!confirm(`SELL POSITION

Remaining value: ${c(i)}
Market price (85%): ${c(a)}

You receive ${c(a)} immediately.
The position is removed from your portfolio.`))return;const{data:r}=await g.from("factions").select("corp_cash_reserves").eq("id",_.id).single();await g.from("factions").update({corp_cash_reserves:Number(r?.corp_cash_reserves||0)+a}).eq("id",_.id),_.corp_cash_reserves=Number(r?.corp_cash_reserves||0)+a,await g.from("finance_active_loans").update({status:"repaid",completed_tick:U?.current_tick||0}).eq("id",o),alert("Position sold for "+c(a)+"."),await te(),Y()}window.apRestructure=lt;window.apCallLoan=ct;window.apForeclose=dt;window.apPayClaim=pt;window.apNegotiateClaim=ft;window.apDisputeClaim=vt;window.apSellPosition=ut;function qe(o,t){const i=o.reduce((a,r)=>a+r.value,0);return i===0?`<div class="rr-seg-bar" style="height:${t}px;background:#2a2a24;"></div>`:`<div class="rr-seg-bar" style="height:${t}px;">${o.map(a=>`<div style="width:${(a.value/i*100).toFixed(1)}%;height:100%;background:${a.color};"></div>`).join("")}</div>`}function mt(){const o=document.getElementById("rr-container");if(!o)return;const t=Number(_?.corp_cash_reserves)||0,i=T.filter(f=>f.type==="LOAN").reduce((f,y)=>f+(y.remaining||0),0),a=T.filter(f=>f.type==="INSURE").reduce((f,y)=>f+(y.coverage||0),0),r=T.filter(f=>f.type==="BOND").reduce((f,y)=>f+(y.faceValue||0),0),l=i+a+r,b=l,p=t+b,u=Ae?.12:.15,e=Math.round(l*u),n=l>0?Math.round(t/l*100):100,d=Math.round(u*100),s=n>=30?"HEALTHY":n>=20?"ADEQUATE":n>=d?"THIN":"CRITICAL",h=n>=30?"#5c5":n>=20?"#ca5":n>=d?"#c84":"#c55",w=Math.max(0,t-e),N={};for(const f of T){const y=f.nation||"Unknown",$=f.remaining||f.coverage||f.faceValue||0;N[y]=(N[y]||0)+$}const A=Object.entries(N).map(([f,y])=>({name:f,exposure:y,pct:l>0?Math.round(y/l*100):0})).sort((f,y)=>y.exposure-f.exposure),B={};for(const f of T){const y=f.type==="BOND"?"Government":f.sector||"Other",$=f.remaining||f.coverage||f.faceValue||0;B[y]=(B[y]||0)+$}const j=Object.entries(B).map(([f,y])=>({name:f,exposure:y,pct:l>0?Math.round(y/l*100):0})).sort((f,y)=>y.exposure-f.exposure),M=A.length>0?A[0].pct:0,F=M>60?"HIGH":M>40?"MODERATE":"LOW",z=F==="HIGH"?"#c55":F==="MODERATE"?"#ca5":"#5c5";let m=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Reserves & Risk</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${h};background:${h}12;border:1px solid ${h}25;">${s}</span>
    </div>`;if(m+='<div style="flex:1;overflow-y:auto;">',Ae&&(m+=`<div style="padding:5px 14px;background:rgba(200,168,50,0.06);border-bottom:1px solid rgba(200,168,50,0.15);display:flex;align-items:center;gap:6px;">
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:#c8a832;background:rgba(200,168,50,0.12);border:1px solid rgba(200,168,50,0.25);">POLICY</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#c8a832;">Financial Sector Deregulation Act</span>
            <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">Reserve req: ${d}% &middot; Interest: +10%</span>
        </div>`),m+='<div class="rr-section-bar">Capital Position</div>',m+='<div class="rr-section">',m+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">TOTAL ASSETS</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${c(p)}</span>
    </div>`,m+=qe([{value:t,color:"#5c5"},{value:b,color:"#8b9a6b"}],6),m+=`<div class="rr-seg-legend">
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#5c5;"></div>Cash ${c(t)}</div>
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#8b9a6b;"></div>Deployed ${c(b)}</div>
    </div>`,m+="</div>",m+='<div class="rr-section">',m+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">RESERVE RATIO</span>
        <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${h};">${n}%</span>
    </div>`,m+=`<div class="rd-bar" style="height:5px;"><div class="rd-bar__fill" style="width:${Math.min(n/60*100,100)}%;background:${h};"></div></div>`,m+=`<div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:3px;">
        <span style="color:#c55;">${d}% minimum</span><span>30% healthy</span><span style="color:#5c5;">60%+</span>
    </div>`,m+=`<div class="rr-reserve-cells">
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REQUIRED (${d}%)</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;margin-top:1px;">${c(e)}</div></div>
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">AVAILABLE TO DEPLOY</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${w>0?"#5c5":"#c55"};margin-top:1px;">${c(w)}</div></div>
    </div>`,m+="</div>",m+='<div class="rr-section-bar">Exposure by Type</div>',m+='<div class="rr-section">',l>0){m+=qe([{value:i,color:"#5a8aaa"},{value:a,color:"#aa7a5a"},{value:r,color:"#8a6aaa"}],6),m+='<div style="margin-top:6px;">';const f=[{label:"Loans",value:i,color:"#5a8aaa",pct:l>0?Math.round(i/l*100):0},{label:"Insurance",value:a,color:"#aa7a5a",pct:l>0?Math.round(a/l*100):0},{label:"Bonds",value:r,color:"#8a6aaa",pct:l>0?Math.round(r/l*100):0}];for(let y=0;y<f.length;y++){const $=f[y];m+=`<div class="rr-type-row">
                <div style="width:6px;height:6px;background:${$.color};margin-right:6px;"></div>
                <span style="flex:1;font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${$.label}</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${c($.value)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;width:28px;text-align:right;">${$.pct}%</span>
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No exposure</div>';if(m+="</div>",m+=`<div class="rr-section-bar" style="display:flex;justify-content:space-between;align-items:center;">
        <span>Concentration Risk</span>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${z};background:${z}12;border:1px solid ${z}25;">${F}</span>
    </div>`,m+='<div class="rr-section">',A.length>0){m+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">BY NATION</div>';for(const f of A){const y=f.pct>50?"#c84":f.pct>30?"#ca5":"#5c5";m+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;width:52px;text-align:center;">${E(f.name.toUpperCase().slice(0,6))}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${f.pct}%;background:${y};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${c(f.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${f.pct>50?"#c84":"#9e9a92"};">${f.pct}%</span>
            </div>`}}if(j.length>0){m+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-top:8px;margin-bottom:4px;">BY SECTOR</div>';for(const f of j){const y=f.pct>50?"#c84":f.pct>30?"#ca5":"#5c5";m+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:52px;">${E(f.name)}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${f.pct}%;background:${y};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${c(f.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${f.pct>50?"#c84":"#9e9a92"};">${f.pct}%</span>
            </div>`}}if(A.length===0&&j.length===0&&(m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No positions to analyze</div>'),m+="</div>",m+='<div class="rr-section-bar">Actions</div>',m+='<div class="rr-section">',m+=`<div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Max single-deal size (${d}% reserve)</span>
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">${c(w)}</span>
    </div>`,M>50&&A.length>1){const f=A[0],y=Math.round(100/A.length),$=Math.round(l*y/100),fe=f.exposure-$;m+=`<div style="padding:6px 8px;background:rgba(200,136,68,0.06);border:1px solid rgba(200,136,68,0.15);margin-bottom:6px;">
            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#c84;margin-bottom:2px;">DIVERSIFICATION TIP</div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;line-height:1.5;">
                ${E(f.name)} is ${f.pct}% of your book (target: ~${y}%).
                Reduce exposure by ~${c(fe)} or grow positions in other nations.
            </div>
        </div>`}const S=T.filter(f=>f.status==="LATE"||f.status==="DELINQUENT").length,R=[];n>=30&&R.push("reserves"),M<=40&&R.push("diversified"),S===0&&R.push("no_delinquent"),T.length>=3&&R.push("scale");const q=R.length,re=q>=4?"EXCELLENT":q>=3?"GOOD":q>=2?"FAIR":"POOR",ae=q>=4?"#5c5":q>=3?"#ca5":q>=2?"#c84":"#c55";m+=`<div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">PORTFOLIO HEALTH</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${ae};">${re} (${q}/4)</span>
    </div>`,m+=`<div style="margin-top:4px;display:flex;gap:3px;">
        ${["Reserves","Diversified","No Defaults","Scale"].map((f,y)=>{const $=R.length>y&&R.includes(["reserves","diversified","no_delinquent","scale"][y]);return`<span style="flex:1;text-align:center;padding:2px 0;font-family:var(--font-mono);font-size:6px;font-weight:700;color:${$?"#5c5":"#6a6660"};border:1px solid ${$?"rgba(92,204,92,0.2)":"#2a2a24"};background:${$?"rgba(92,204,92,0.04)":"transparent"};">${$?"✓":"✗"} ${f}</span>`}).join("")}
    </div>`,m+="</div>",M>60&&A.length>0&&(m+=`<div class="rr-warning"><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c55;">CONCENTRATION WARNING: </span>${M}% of exposure is in ${E(A[0].name)}. A sovereign crisis or economic downturn in this nation would affect the majority of your portfolio. Consider diversifying across nations.</div>`),m+="</div>",m+=`<div class="df-footer" style="justify-content:space-between;">
        <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">DEPLOYABLE CAPITAL</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${w>0?"#5c5":"#c55"};">${c(w)}</div></div>
        <div style="text-align:right;"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">TOTAL EXPOSURE</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${c(l)}</div></div>
    </div>`,o.innerHTML=m}const Be={REPAID:{color:"#5c5",label:"REPAID"},DEFAULTED:{color:"#c55",label:"DEFAULTED"},EXPIRED:{color:"#5c5",label:"EXPIRED"},CLAIMED:{color:"#c84",label:"CLAIMED"},MATURED:{color:"#5c5",label:"MATURED"},SOLD:{color:"#ca5",label:"SOLD EARLY"},FORECLOSED:{color:"#c55",label:"FORECLOSED"}};let P=[],Le=-1;function _t(o){Le=Le===o?-1:o,Te()}function Te(){const o=document.getElementById("cc-container");if(!o)return;const t=P.reduce((u,e)=>u+(e.earned||0),0),i=P.reduce((u,e)=>u+(e.lost||0),0),a=P.reduce((u,e)=>u+(e.net||0),0),r=P.filter(u=>u.net>0).length,l=P.filter(u=>u.net<0).length,b=a>=0;let p=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Collections</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${P.length} RESOLVED</span>
    </div>`;if(p+=`<div class="cc-scorecard">
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">EARNED</div>
            <div class="cc-scorecard__value" style="color:#5c5;">${c(t)}</div>
        </div>
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">LOST</div>
            <div class="cc-scorecard__value" style="color:#c55;">${c(i)}</div>
        </div>
        <div class="cc-scorecard__cell" style="background:${b?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="cc-scorecard__label">NET P&amp;L</div>
            <div class="cc-scorecard__value" style="color:${b?"#5c5":"#c55"};">${b?"+":""}${c(a)}</div>
        </div>
    </div>`,P.length>0){const u=r/P.length*100;p+=`<div class="cc-winloss">
            <div class="cc-winloss__bar">
                <div style="width:${u}%;background:#5c5;height:100%;"></div>
                <div style="flex:1;background:#c55;height:100%;"></div>
            </div>
            <span class="cc-winloss__stat" style="color:#5c5;">${r}W</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&mdash;</span>
            <span class="cc-winloss__stat" style="color:#c55;">${l}L</span>
        </div>`}p+='<div class="cc-list">',P.length===0&&(p+='<div class="cc-empty">No resolved deals yet.<br>Completed loans, expired policies, and matured bonds appear here.</div>');for(let u=0;u<P.length;u++){const e=P[u],n=Re[e.type]||{class:"loan",label:e.type},d=Be[e.outcome]||{color:"#9e9a92",label:e.outcome},s=Le===u,h=e.net>=0;p+=`<div class="cc-deal" onclick="ccToggle(${u})" style="border-left:2px solid ${h?"#5c5":"#c55"};">
        <div class="cc-deal__inner" style="${s?"background:"+(e.type==="LOAN"?"rgba(90,138,170,0.08)":e.type==="INSURE"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,p+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${n.class}">${n.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;flex:1;">${E(e.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${d.color};background:${d.color}12;border:1px solid ${d.color}25;">${d.label}</span>
        </div>`,p+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${E((e.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${E(e.resolved||"")}</span>
        </div>`,p+='<div class="df-metrics">',p+=`<div style="flex:1;padding:3px 8px;">
            <div class="df-metrics__label">PRINCIPAL</div>
            <div class="df-metrics__value" style="font-size:10px;color:#e8e4dc;margin-top:1px;">${c(e.principal||0)}</div>
        </div>`,p+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid #2a2a24;">
            <div class="df-metrics__label">EARNED</div>
            <div class="df-metrics__value" style="font-size:10px;color:#5c5;margin-top:1px;">${c(e.earned||0)}</div>
        </div>`,e.lost>0&&(p+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid #2a2a24;">
                <div class="df-metrics__label">LOST</div>
                <div class="df-metrics__value" style="font-size:10px;color:#c55;margin-top:1px;">${c(e.lost)}</div>
            </div>`),p+=`<div style="flex:1;padding:3px 8px;text-align:right;border-left:1px solid #2a2a24;background:${h?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="df-metrics__label">NET</div>
            <div class="df-metrics__value" style="font-size:11px;color:${h?"#5c5":"#c55"};margin-top:1px;">${h?"+":""}${c(e.net||0)}</div>
        </div>`,p+="</div>",s&&(p+='<div class="cc-deal__expanded">',e.term&&(p+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">TERM</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${E(e.term)}</span>
                </div>`),e.rate&&(p+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">RATE</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${E(e.rate)}</span>
                </div>`),e.note&&(p+=`<div style="padding:4px 0;">
                    <div style="font-size:9px;color:${h?"#9e9a92":"#c84"};line-height:1.5;">${E(e.note)}</div>
                </div>`),p+="</div>"),p+="</div></div>"}p+="</div>",p+=`<div class="df-footer" style="justify-content:space-between;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">LIFETIME P&amp;L</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${b?"#5c5":"#c55"};">${b?"+":""}${c(a)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            ${Object.entries(P.reduce((u,e)=>(u[e.outcome]=(u[e.outcome]||0)+1,u),{})).map(([u,e])=>{const n=Be[u]||{color:"#9e9a92",label:u};return`<div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:${n.color};letter-spacing:0.3px;">${n.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#e8e4dc;">${e}</div>
                </div>`}).join("")}
        </div>
    </div>`,o.innerHTML=p}window.ccToggle=_t;const yt={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let x=null,L="LOAN",X=8,J=18e6,ye=24,I="equipment",pe="",ne=3.5,W=12e6,ee=10,Ie="",C=25e6;const Ne=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function gt(o){const t=G[o];t&&(x=t,L=t.type,t.type==="LOAN"?(X=8,J=t.amount,ye=t.term||24,I=t.collateral||"unsecured",pe=""):t.type==="INSURE"?(ne=3.5,W=t.amount,ee=10,Ie=""):t.type==="BOND"&&(C=Math.round(t.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",ie())}function Ve(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",x=null}function bt(o){X=Number(o),ie()}function ht(o){I=o,ie()}function xt(o){pe=o}function wt(o){ne=Number(o),ie()}function $t(o){W=Number(o),ie()}function Et(o){ee=Number(o),ie()}function Nt(o){C=Number(o),ie()}function de(o,t,i){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(o/t*100,100)}%;background:${i};"></div></div>`}function ie(){const o=document.getElementById("rd-modal");if(!o||!x)return;const t=x,i=L==="LOAN"?"#5a8aaa":L==="INSURE"?"#aa7a5a":"#8a6aaa",a=Math.round(J*(X/100)*(ye/12)),r=Math.round((J+a)/ye),l=t.revenue||474e5,b=Math.round(r/l*1200),p=12,u=Math.max(0,(X-6)*1.5),e=J>15e6?3:0,n=I==="none"?3:I==="full"?-2:0,d=Number(t.corp_debt||0),s=Number(t.corp_cash_reserves||1),h=d>0?Math.min(15,Math.round(d/Math.max(s,1)*5)):0,w=Math.min(60,Math.max(2,Math.round(p+u+e+n+h))),N=w<=15?"#5c5":w<=30?"#ca5":w<=45?"#c84":"#c55",A=w<=15?"LOW":w<=30?"MODERATE":w<=45?"ELEVATED":"HIGH",B=95,j=(X-4)*8,M=J<(t.amount||18e6)?10:0,F=I==="full"?15:I==="property"?8:I==="none"?-5:0,z=Math.max(10,Math.min(95,Math.round(B-j-M-F))),m=z>=70?"#5c5":z>=45?"#ca5":z>=25?"#c84":"#c55",S={unsecured:"none",equipment:"equipment",property:"property"},R=Ne.find(V=>V.id===(S[I]||I))||Ne[0],q=Math.round(a*(1-w/100)),re=(t.term||18)/12,ae=Math.round(W*(ne/100)*re),f=100-(t.reputation||50),y=Math.max(5,Math.min(50,Math.round(f*.4))),$=Math.round(W*(1-ee/100)),fe=Math.round($*(y/100)),ve=ae-fe,he=y<=12?"#5c5":y<=22?"#ca5":y<=35?"#c84":"#c55",xe=t.couponRate||6.2,Oe=t.term||60,ke=Oe/12,He=Math.round(C*(xe/100)),Se=Math.round(C*(xe/100)*ke),se=t.stability||50,De=t.creditRating||50,Me=t.debtToGdp||30,Ge=Math.max(2,Math.round((100-se)*.15+(100-De)*.15+Math.max(0,Me-30)*.3)),K=Math.min(60,Ge),we=K<=10?"#5c5":K<=20?"#ca5":K<=35?"#c84":"#c55",ze=Math.round(Se*(1-K/100));let v=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${i};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>`;if(v+=`<div class="rd-tabs">
        <span class="rd-tab ${L==="LOAN"?"active-loan":L==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${L==="LOAN"?"Loan":L==="INSURE"?"Insure":"Bond"} — ${E(t.applicant)}</span>
    </div></div>`,v+='<div class="rd-body">',v+='<div class="rd-left">',L==="LOAN"){const V=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84";v+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${E(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${E(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">CASH</div><div class="rd-applicant__stat-value" style="color:#5c5;">${c(t.corp_cash_reserves||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${c(t.corp_debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${V};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${c(t.amount)}</div></div>
            </div>
            <div style="margin-top:6px;padding:6px 8px;background:rgba(200,136,68,0.04);border:1px solid rgba(200,136,68,0.12);">
                <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c84;letter-spacing:0.8px;margin-bottom:4px;">EXISTING OBLIGATIONS</div>
                <div style="display:flex;gap:16px;">
                    <div><span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">ACTIVE LOANS</span><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.activeLoans>0?"#c84":"#5c5"};">${t.activeLoans}</div></div>
                    <div><span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">OUTSTANDING</span><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.totalOutstanding>0?"#c84":"#5c5"};">${c(t.totalOutstanding)}</div></div>
                    <div><span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEBT-TO-CASH</span><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.corp_debt>t.corp_cash_reserves?"#c55":t.corp_debt>0?"#ca5":"#5c5"};">${t.corp_cash_reserves>0?(t.corp_debt/t.corp_cash_reserves*100).toFixed(0)+"%":"—"}</div></div>
                </div>
            </div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const H=(X-3)/15*100;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${X}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${X}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${H}%,#2a2a24 ${H}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`,v+=`<div class="rd-control">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">Borrower's Request</div>
            <div class="rd-risk-row"><span class="rd-risk-label">LOAN AMOUNT</span><span class="rd-risk-value" style="color:#e8e4dc;">${c(J)}</span></div>
            <div class="rd-risk-row"><span class="rd-risk-label">TERM</span><span class="rd-risk-value" style="color:#e8e4dc;">${ye}mo</span></div>
        </div>`,v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">REQUIRE COLLATERAL</span>
                <span class="rd-control__value" style="font-size:12px;color:#5a8aaa;">${R.label}</span>
            </div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                ${Ne.map(O=>`<div onclick="rdSetLoanCollateral('${O.id}')" style="
                    flex:1;padding:6px 4px;text-align:center;
                    font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;
                    background:${I===O.id||(S[I]||I)===O.id?"rgba(90,138,170,0.12)":"transparent"};
                    border:1px solid ${I===O.id||(S[I]||I)===O.id?"rgba(90,138,170,0.3)":"#2a2a24"};
                    color:${I===O.id||(S[I]||I)===O.id?"#5a8aaa":"#6a6660"};
                    cursor:pointer;
                ">${O.label}</div>`).join("")}
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:6px;">
                ${R.id==="none"?"No collateral. Higher risk, lower acceptance chance.":R.id==="equipment"?"Borrower pledges equipment as security. Moderate risk reduction.":"Borrower pledges property. Strongest security, highest acceptance."}
            </div>
        </div>`,v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">OFFER TERMS (OPTIONAL)</span>
            </div>
            <textarea id="rd-loan-terms" maxlength="500" rows="3" placeholder="e.g. Early repayment penalty of 2%. Quarterly reporting required..." oninput="rdSetLoanTermsText(this.value)" style="
                width:100%;margin-top:6px;padding:8px 10px;
                background:#1a1a16;border:1px solid #2a2a24;color:#e8e4dc;
                font-family:var(--font-sans);font-size:11px;line-height:1.5;
                resize:vertical;outline:none;box-sizing:border-box;
            ">${E(pe)}</textarea>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Visible to the borrower. 500 characters max.</div>
        </div>`}if(L==="INSURE"){const V=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84",H=t.projectValue?"PROJECT":"FLEET",O=t.projectValue||t.fleetValue||0;v+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${E(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${E(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${V};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${H}</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${c(O)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${c(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${t.term}mo</div></div>
            </div>
        </div>`,t.purpose&&t.purpose!=="Construction Insurance"&&(v+=`<div style="padding:8px 14px;background:rgba(170,122,90,0.04);border-bottom:1px solid rgba(170,122,90,0.12);">
                <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#aa7a5a;letter-spacing:0.8px;margin-bottom:3px;">REQUESTED COVERAGE</div>
                <div style="font-size:10px;color:#e8e4dc;line-height:1.5;white-space:pre-wrap;">${E(t.purpose)}</div>
            </div>`),v+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const le=(ne-1)/7*100;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${ne}%</span>
            </div>
            <input type="range" class="rd-control__range" min="1" max="8" step="0.5" value="${ne}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${le}%,#2a2a24 ${le}%);">
            <div class="rd-control__hints"><span>1% (competitive)</span><span>8% (expensive)</span></div>
        </div>`;const ce=Math.round((t.projectValue||t.fleetValue||t.amount)*.7),k=Math.round(t.amount*.33),ue=(W-k)/(ce-k)*100;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${c(W)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${k}" max="${ce}" step="1000000" value="${W}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${ue}%,#2a2a24 ${ue}%);">
            <div class="rd-control__hints"><span>${c(k)} (partial)</span><span>${c(ce)} (max)</span></div>
        </div>`,v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${ee}%</span>
            </div>
            <div class="rd-presets">`;for(const Ee of[5,10,15,20,25])v+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${Ee})" style="${ee===Ee?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${Ee}%</span>`;v+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${ee}% of any claim (${c(Math.round(W*ee/100))})</div>
        </div>`,v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">WHAT WE AGREE TO COVER</span>
            </div>
            <textarea id="rd-policy-terms" rows="3" placeholder="e.g., Covers weather delays, material damage, and labor disputes. Excludes negligence and acts of war. Maximum payout per claim: 50% of coverage."
                style="width:100%;box-sizing:border-box;padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:#e8e4dc;background:#1a1a16;border:1px solid #2a2a24;resize:vertical;line-height:1.5;"
                oninput="rdPolicyTerms=this.value">${Ie||""}</textarea>
        </div>`}if(L==="BOND"){const V=se>=50?"#5c5":se>=30?"#ca5":se>=15?"#c84":"#c55";v+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${E(t.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${c(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${xe}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${Oe}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${V};">${se}</div></div>
            </div>
        </div>`,v+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const H=t.amount,O=Math.max(5e6,Math.ceil(H*.05/5e6)*5e6),le=(C-O)/(H-O)*100;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${c(C)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${O}" max="${H}" step="5000000" value="${C}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${le}%,#2a2a24 ${le}%);">
            <div class="rd-control__hints"><span>${c(O)} (small position)</span><span>${c(H)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,v+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const ce=[{key:"stability",value:se,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:Me,label:"Debt burden",invert:!0},{key:"credit_rating",value:De,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:t.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:t.corruption||62,label:"Institutional risk",invert:!0}];for(const k of ce){const ue=k.invert?k.value>60?"#c55":k.value>40?"#ca5":"#5c5":k.value>=50?"#5c5":k.value>=30?"#ca5":k.value>=15?"#c84":"#c55";v+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${k.key}</span>
                <div style="width:40px;">${de(k.value,100,ue)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:18px;text-align:right;">${k.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${k.label}</span>
            </div>`}v+="</div>"}if(v+="</div>",v+='<div class="rd-right">',L==="LOAN"){v+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${N};">${w}%</span>
            </div>
            ${de(w,100,N)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${N};margin-top:4px;">${A}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${m};">${z}%</span>
            </div>
            ${de(z,100,m)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',v+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${c(J)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${c(a)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${c(r)}</span></div>`;const V=b>30?"#c55":b>15?"#ca5":"#5c5";v+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${V};">${b}% of revenue</span></div>`,v+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${c(q)}</span></div>`,v+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${w}% default)</div>`}if(L==="INSURE"){v+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${he};">${y}%</span>
            </div>
            ${de(y,100,he)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',v+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${c($)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${c(ae)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${c(fe)}</span></div>`;const V=ve>0?"":" negative",H=ve>0?"#5c5":"#c55";v+=`<div class="rd-expected${V}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${H};">${c(ve)}</span></div>`,v+=`<div class="rd-formula">Premiums (${c(ae)}) − expected payout (${y}% × ${c($)})</div>`}L==="BOND"&&(v+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${we};">${K}%</span>
            </div>
            ${de(K,100,we)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',v+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${c(C)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${c(He)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(ke)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${c(Se)}</span></div>`,v+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${c(ze)}</span></div>`,v+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${K}% default)</div>`),v+="</div>",v+="</div>";const Ye=L==="LOAN"?J:L==="INSURE"?W:C,je=L==="LOAN"?q:L==="INSURE"?ve:ze,We=L==="LOAN"?w:L==="INSURE"?y:K,Xe=L==="LOAN"?N:L==="INSURE"?he:we,Qe=L==="LOAN"?"OFFER LOAN":L==="INSURE"?"WRITE POLICY":"BUY BONDS",Ke=L.toLowerCase(),$e=!!t.alreadyOffered,Je=$e?"disabled":"",Ze=$e?' title="You already have an offer on this request."':"",et=$e?"ALREADY OFFERED":Qe;v+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${c(Ye)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${c(je)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${Xe};">${We}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${Ke}" onclick="rdSubmitOffer()" ${Je}${Ze}>${et}</button>
        </div>
    </div>`,o.innerHTML=v}window.rdOpen=gt;window.rdClose=Ve;window.rdSetLoanRate=bt;window.rdSetLoanCollateral=ht;window.rdSetLoanTermsText=xt;window.rdSetInsurePremium=wt;window.rdSetInsureCoverage=$t;window.rdSetInsureDeductible=Et;window.rdSetBondAmount=Nt;let D=!1;async function At(){if(!x||!_||!U||D)return;if(x.alreadyOffered){alert("You already submitted an offer for this request.");return}D=!0;const o=U.current_tick||0,t=Number(_.corp_cash_reserves)||0;if(x.type==="LOAN"){const i=X;if(i<1||i>20){alert("Interest rate must be 1-20%."),D=!1;return}const{data:a}=await g.from("corp_properties").select("id").eq("faction_id",_.id).eq("type","branch_office").eq("is_active",!0),r=a?.length||0,l=Math.min(100,50+r*15),b=Math.round(t*l/100),{data:p}=await g.from("finance_active_loans").select("principal").eq("lender_faction_id",_.id).in("status",["current","late","delinquent"]),u=(p||[]).reduce((w,N)=>w+Number(N.principal||0),0),e=Math.max(0,b-u);if(x.amount>e){alert(`Lending cap reached. You can deploy ${Math.round(l)}% of cash ($${(b/1e6).toFixed(1)}M).
Already deployed: $${(u/1e6).toFixed(1)}M
Available: $${(e/1e6).toFixed(1)}M
This loan: $${(x.amount/1e6).toFixed(1)}M`+(r===0?`

Build a Branch Office to increase your lending cap (+15% each).`:"")),D=!1;return}if(t<x.amount){alert("Insufficient cash reserves to fund this loan."),D=!1;return}const d={none:"unsecured",equipment:"equipment",property:"property",full:"property"}[I]||"unsecured",s={request_id:x.requestId,offering_faction_id:_.id,interest_rate:i,collateral_type:d,created_tick:o};pe.trim()&&(s.offer_terms=pe.trim());const{error:h}=await g.from("finance_loan_offers").insert(s);if(h){D=!1,h.message.includes("unique")||h.message.includes("duplicate")?alert("You have already submitted an offer for this loan request."):alert("Failed to submit offer: "+h.message);return}}else if(x.type==="BOND"){if(t<C){alert("Insufficient cash reserves. Need "+c(C)+", have "+c(t)+"."),D=!1;return}const{error:i}=await g.from("finance_loan_offers").insert({request_id:x.requestId,offering_faction_id:_.id,interest_rate:x.couponRate,collateral_type:"unsecured",status:"accepted",created_tick:o});if(i){alert("Failed to buy bonds: "+i.message),D=!1;return}const a=x.couponRate/100/12;x.term;const r=Math.round(C*a),{data:l,error:b}=await g.from("finance_loan_requests").select("requesting_faction_id").eq("id",x.requestId).single();if(b||!l?.requesting_faction_id){alert("Failed to create bond position: could not resolve issuer faction."),D=!1;return}const{error:p}=await g.from("finance_active_loans").insert({request_id:x.requestId,offer_id:null,borrower_faction_id:l.requesting_faction_id,lender_faction_id:_.id,nation_id:x.nation_id||_.nation_id,principal:C,interest_rate:x.couponRate,term_months:x.term,collateral_type:"unsecured",purpose:x.purpose,monthly_payment:r,started_tick:o});if(p){alert("Failed to create bond position: "+p.message),D=!1;return}await g.from("factions").update({corp_cash_reserves:Math.max(0,t-C)}).eq("id",_.id);const{data:u}=await g.from("nations").select("debt").eq("id",x.nation_id).single();if(u){const{error:e}=await g.from("nations").update({debt:Number(u.debt||0)+C}).eq("id",x.nation_id);e&&console.warn("[Bonds] Failed to update nation debt:",e.message)}_.corp_cash_reserves=Math.max(0,t-C)}else if(x.type==="INSURE"){const i=ne,a=W,r=ee,l=Math.round(a*(i/100)/12),{error:b}=await g.from("finance_loan_offers").insert({request_id:x.requestId,offering_faction_id:_.id,interest_rate:i,collateral_type:"unsecured",status:"accepted",created_tick:o});if(b){D=!1,b.message.includes("unique")||b.message.includes("duplicate")?alert("You have already submitted a policy offer for this request."):alert("Failed to write policy: "+b.message);return}const{data:p}=await g.from("finance_loan_requests").update({status:"funded",funded_tick:o}).eq("id",x.requestId).select("requesting_faction_id").single(),u={request_id:x.requestId,offer_id:null,borrower_faction_id:p?.requesting_faction_id||x.requestingFactionId,lender_faction_id:_.id,nation_id:_.nation_id,principal:a,interest_rate:i,term_months:0,collateral_type:"unsecured",purpose:x.isVesselInsurance?"Vessel Insurance — "+x.applicant:"Insurance Policy — "+x.applicant,monthly_payment:l,started_tick:o,deductible_pct:r,policy_terms:Ie.trim()||null};x.insuredVesselId&&(u.insured_vessel_id=x.insuredVesselId),x.insuredContractId&&(u.insured_contract_id=x.insuredContractId);const{error:e}=await g.from("finance_active_loans").insert(u);if(e){alert("Failed to create policy record: "+e.message),D=!1;return}}else{D=!1;return}Ve(),Q=-1,await Fe(),D=!1}window.rdSubmitOffer=At;async function te(){if(!_){Y();return}const{data:o}=await g.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",_.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"},i=a=>a.finance_loan_requests?.request_type==="insurance";T=(o||[]).map(a=>({id:a.id,type:t[a.finance_loan_requests?.request_type]||"LOAN",counterparty:a.borrower?.faction_name||"Unknown",abbr:a.borrower?.abbreviation||a.borrower?.corp_ticker||"??",nation:a.loan_nation?.name||a.borrower?.nation||"Unknown",remaining:i(a)?0:a.principal-a.total_paid,principal:a.principal,earned:i(a)?(a.monthly_payment||0)*(a.payments_made||0):a.total_interest_paid||0,rate:a.interest_rate,term:a.term_months,paymentsMade:a.payments_made,paymentsMissed:a.payments_missed,monthlyPayment:a.monthly_payment,status:a.status.toUpperCase(),collateral:a.collateral_type,purpose:a.purpose||"",alert:a.status==="late"||a.status==="delinquent",alertLevel:a.status==="delinquent"?"red":a.status==="late"?"orange":null,alertMsg:a.status==="delinquent"?`${a.payments_missed} missed payments. Default imminent.`:a.status==="late"?`${a.payments_missed} missed payment${a.payments_missed>1?"s":""}. Monitor closely.`:null,coverage:i(a)?a.principal:void 0,premiumsCollected:i(a)?(a.monthly_payment||0)*(a.payments_made||0):void 0,paidOut:i(a)?a.claims_paid||0:void 0,claims:i(a)?a.claims_count||0:void 0,deductible:i(a)?a.deductible_pct||0:void 0})),Y()}async function Lt(){if(!_){Te();return}const{data:o}=await g.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",_.id).in("status",["repaid","defaulted"]).order("completed_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"};P=(o||[]).map(i=>{const a=i.total_interest_paid||0,r=i.status==="defaulted"?Math.max(0,i.principal-i.total_paid):0;return{type:t[i.finance_loan_requests?.request_type]||"LOAN",counterparty:i.borrower?.faction_name||"Unknown",abbr:i.borrower?.abbreviation||i.borrower?.corp_ticker||"??",nation:i.loan_nation?.name||i.borrower?.nation||"",outcome:i.status==="repaid"?"REPAID":"DEFAULTED",principal:i.principal,earned:a,lost:r,net:a-r,resolved:i.completed_tick?"Tick "+i.completed_tick:"",term:i.term_months+"mo",rate:i.interest_rate+"%",note:i.status==="repaid"?`Fully repaid over ${i.payments_made} payments.`:`Defaulted after ${i.payments_missed} missed payments. ${i.collateral_type!=="unsecured"?"Collateral ("+i.collateral_type+") partially recovered losses.":"Unsecured — no collateral recovery."}`}}),Te()}function Ce(o){const t=new URL("corp-operations.html",window.location.href);t.search=window.location.search;const i=t.searchParams;i.set("tab",o),t.search=i.toString()?`?${i.toString()}`:"",window.location.href=t.toString()}function Tt(o){o?.preventDefault&&o.preventDefault(),Ce("expansion")}function Rt(o){o?.preventDefault&&o.preventDefault(),Ce("actions")}async function It(){const o=new URLSearchParams(window.location.search).get("tab"),t=o==="expansion"||o==="actions",i=t?o:"operations",{data:{user:a}}=await g.auth.getUser();if(!a){window.location.href="login.html";return}const{data:r}=await g.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);Z=(r||[]).filter(e=>e.nation_id);const l=sessionStorage.getItem("active_faction_id");if(_=Z.find(e=>e.id===l)||Z.find(e=>e.faction_type==="corporation")||Z[0],!_){await g.auth.signOut(),window.location.href="login.html";return}if(_.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(_.corp_sector!=="Finance"){const e={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html"};window.location.href=(e[_.corp_sector]||"corp-operations.html")+window.location.search;return}if(t){Ce(o);return}sessionStorage.setItem("active_faction_id",_.id);const[b,p]=await Promise.all([_.nation_id?g.from("nations").select("*").eq("id",_.nation_id).single():Promise.resolve({data:null}),g.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);b.data&&b.data,U=p.data;const u=document.getElementById("corp-topbar-container");if(u){const{renderCorpTopBar:e}=await tt(async()=>{const{renderCorpTopBar:n}=await import("./corp-topbar-BGmUeelO.js");return{renderCorpTopBar:n}},__vite__mapDeps([0,1]));e(u,{faction:_,shard:U,activeTab:i,allUserFactions:Z})}if(Ct(),_.nation_id){const{data:e}=await g.from("active_laws").select("id, policy:policies!policy_id(policy_key)").eq("nation_id",_.nation_id).limit(100);Ae=(e||[]).some(n=>n.policy?.policy_key?.startsWith("financial_sector_deregulation"))}if(await Fe(),await te(),mt(),await Lt(),U?.next_tick_at){const e=(Number(U.tick_interval_hours)||8)*36e5,n=new Date(U.next_tick_at).getTime(),s=n-e+e/2,h=new Date(s>Date.now()?s:n+e/2);Mt(h)}}function Ct(){const o=document.getElementById("corp-faction-dropdown");if(!o||Z.length<=1)return;let t="";for(const i of Z){const a=i.id===_.id,r=i.faction_type==="corporation"?"CORP":"PARTY";t+=`<div class="corp-faction-dropdown__item${a?" active":""}" onclick="switchFaction('${i.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${i.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${i.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${i.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${r}</span>
            <span>${E(i.faction_name||"--")}</span>
        </div>`}o.innerHTML=t}function Ot(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function kt(o){sessionStorage.setItem("active_faction_id",o);const t=Z.find(i=>i.id===o);t&&t.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}function St(){document.body.classList.toggle("light-mode");const o=document.body.classList.contains("light-mode");localStorage.setItem("theme",o?"light":"dark");const t=document.getElementById("theme-toggle");t&&(t.textContent=o?"Dark":"Light")}async function Dt(){await g.auth.signOut(),window.location.href="login.html"}function Mt(o){const t=document.getElementById("tick-countdown");if(!t)return;function i(){const a=new Date(o)-new Date;if(a<=0){t.textContent="Processing...";return}const r=Math.floor(a/36e5),l=Math.floor(a%36e5/6e4),b=Math.floor(a%6e4/1e3);t.textContent=`${r}h ${l}m ${b}s`}i(),setInterval(i,1e3)}if(localStorage.getItem("theme")==="light"){document.body.classList.add("light-mode");const o=document.getElementById("theme-toggle");o&&(o.textContent="Dark")}window.toggleCorpDropdown=Ot;window.switchFaction=kt;window.toggleTheme=St;window.doLogout=Dt;window.switchToExpansion=Tt;window.switchToActions=Rt;It();
