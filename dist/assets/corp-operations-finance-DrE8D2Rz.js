const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BsVGcrAN.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as y}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as it}from"./preload-helper-BXl3LOEh.js";import{e as $}from"./utils-CY90Gazr.js";let ee=[],_=null,q=null,Le=!1;function c(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+Math.round(o).toLocaleString()}const Oe={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},st={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}};let Y=[],me="ALL",ie="all",K=-1;async function Ye(){if(!_||!q)return;const{data:o,error:t}=await y.from("finance_loan_requests").select("*, requesting_faction:factions!requesting_faction_id(id, faction_name, abbreviation, corp_ticker, corp_subsector, nation_id, corp_cash_reserves, corp_debt, corp_reputation), issuer_nation:nations!issuer_nation_id(id, name, stability, credit, debt, gdp, gdp_growth, corruption)").eq("status","open").order("created_tick",{ascending:!1});t&&console.error("[DealFlow] Request query error:",t.message);const i=[...new Set((o||[]).filter(e=>e.requesting_faction?.nation_id).map(e=>e.requesting_faction.nation_id))];let a={};if(i.length>0){const{data:e}=await y.from("nations").select("id, name, stability, credit, gdp, gdp_growth, corruption, debt").in("id",i);for(const n of e||[])a[n.id]=n}const{data:l}=await y.from("finance_loan_offers").select("request_id").eq("offering_faction_id",_.id),r=new Set((l||[]).map(e=>e.request_id)),b=[...new Set((o||[]).filter(e=>e.requesting_faction?.id).map(e=>e.requesting_faction.id))];let p={};if(b.length>0){const{data:e}=await y.from("finance_active_loans").select("borrower_faction_id, principal, total_paid").in("borrower_faction_id",b).in("status",["current","late","delinquent"]);for(const d of e||[]){p[d.borrower_faction_id]||(p[d.borrower_faction_id]={count:0,totalOutstanding:0}),p[d.borrower_faction_id].count++;const s=Math.max(0,Number(d.principal||0)-Number(d.total_paid||0));p[d.borrower_faction_id].totalOutstanding+=s}const{data:n}=await y.from("subsidiary_auto_policies").select("borrower_faction_id, principal, remaining_principal").in("borrower_faction_id",b).eq("service_type","loan").eq("status","active");for(const d of n||[])p[d.borrower_faction_id]||(p[d.borrower_faction_id]={count:0,totalOutstanding:0}),p[d.borrower_faction_id].count++,p[d.borrower_faction_id].totalOutstanding+=Number(d.remaining_principal||d.principal||0)}const u=(_.corp_subsector||"").toLowerCase();Y=(o||[]).filter(e=>e.request_type==="bond"?u==="investment":e.request_type==="insurance"?u==="insurance":u==="banking").map(e=>{if(e.request_type==="bond"){const n=e.issuer_nation,d=Number(n?.stability??50),s=Number(n?.credit??50),h=Number(n?.gdp??1),w=Number(n?.debt??0),E=h>0?Math.round(w/h*100):0;return{id:e.id,type:"BOND",applicant:n?.name||"Unknown Nation",abbr:(n?.name||"??").slice(0,3).toUpperCase(),entity:"GOV",nation:n?.name||"N/A",nation_id:e.issuer_nation_id,amount:e.amount||0,term:e.term_months,couponRate:Number(e.coupon_rate||5),purpose:e.purpose||"Government Bond",stability:d,creditRating:s,debtToGdp:E,gdpGrowth:Number(n?.gdp_growth??50),corruption:Number(n?.corruption??50),risk:d>=60&&s>=50?"LOW":d>=35&&s>=30?"MODERATE":"HIGH",isNew:!r.has(e.id),ticksLeft:(e.expires_tick||0)-(q?.current_tick||0),requestId:e.id,alreadyOffered:r.has(e.id)}}if(e.request_type==="insurance"){const n=Number(e.requesting_faction?.corp_reputation??50),d=Number(a[e.requesting_faction?.nation_id]?.stability??50);return{id:e.id,type:"INSURE",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:a[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,amount:e.amount||0,term:e.term_months||0,purpose:e.purpose||"Construction Insurance",reputation:n,projectValue:e.amount||0,stability:d,risk:n>=60&&d>=50?"LOW":n>=35?"MODERATE":"HIGH",isNew:!r.has(e.id),ticksLeft:(e.expires_tick||0)-(q?.current_tick||0),requestId:e.id,insuredContractId:e.insured_contract_id,insuredVesselId:e.insured_vessel_id,isVesselInsurance:!!e.insured_vessel_id,alreadyOffered:r.has(e.id),requestingFactionId:e.requesting_faction?.id}}return{id:e.id,type:"LOAN",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:a[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,requestingFactionId:e.requesting_faction?.id,amount:e.amount,term:e.term_months,purpose:e.purpose||"",reputation:Number(e.requesting_faction?.corp_reputation??50),revenue:Number(e.requesting_faction?.corp_cash_reserves??0),corp_cash_reserves:Number(e.requesting_faction?.corp_cash_reserves??0),corp_debt:Number(e.requesting_faction?.corp_debt??0),activeLoans:(p[e.requesting_faction?.id]||{}).count||0,totalOutstanding:(p[e.requesting_faction?.id]||{}).totalOutstanding||0,creditRating:Number(a[e.requesting_faction?.nation_id]?.credit??50),stability:Number(a[e.requesting_faction?.nation_id]?.stability??50),risk:(()=>{const n=Number(a[e.requesting_faction?.nation_id]?.credit??50),d=Number(e.requesting_faction?.corp_reputation??50);return n>=60&&d>=60?"LOW":n>=35&&d>=35?"MODERATE":n>=20||d>=20?"ELEVATED":"HIGH"})(),isNew:!r.has(e.id),ticksLeft:(e.expires_tick||0)-(q?.current_tick||0),collateral:e.collateral_type||"unsecured",requestId:e.id,alreadyOffered:r.has(e.id)}}),ge()}function Be(o){if(!_)return!1;const t=(_.corp_subsector||"").toLowerCase(),i=ht[t];return o.type===i}function rt(o){me=o,K=-1,ge()}function lt(o){K=K===o?-1:o,ge()}function ge(){const o=document.getElementById("df-container");if(!o)return;let t=me==="ALL"?Y:Y.filter(e=>e.type===me);ie==="mine"&&_?.nation_id&&(t=t.filter(e=>e.nation_id===_.nation_id));const i=Y.filter(e=>e.isNew).length,a=Y.length;let l=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
            ${i>0?`<span class="df-badge df-badge-corp">${i} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:12px;color:#6a6660;">${a} OPEN</span>
        </div>
    </div>`;const r=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];l+='<div class="df-filters">';for(const e of r)l+=`<span class="df-pill${me===e.id?" "+e.activeClass:""}" onclick="dfSetFilter('${e.id}')">${e.label}</span>`;l+=`<span style="margin-left:auto;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.5px;cursor:pointer;padding:6px 10px;border:1px solid ${ie==="mine"?"#5c544":"var(--panel-border)"};color:${ie==="mine"?"#5c5":"#6a6660"};background:${ie==="mine"?"rgba(92,204,92,0.06)":"transparent"};" onclick="dfToggleNation()">${ie==="mine"?"MY NATION":"ALL NATIONS"}</span>`,l+="</div>",l+='<div class="df-list">',t.length===0&&(l+='<div class="ap-empty">No deals available.<br>Deals appear when corporations request financing or governments issue bonds.</div>');for(let e=0;e<t.length;e++){const n=t[e],d=Y.indexOf(n),s=K===d,h=Oe[n.type],w=st[n.risk],E=Be(n);l+=`<div class="df-deal${s?" sel-"+h.class:""}" onclick="dfSelectDeal(${d})" style="${E?"":"opacity:0.5;"}">`,n.isNew&&E&&(l+='<div class="df-new-dot"></div>'),l+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <span class="df-badge df-badge-${h.class}">${h.label}</span>
            <span style="font-size:15px;font-weight:600;color:var(--panel-text);">${$(n.applicant)}</span>
            <span class="df-badge df-badge-${n.entity.toLowerCase()}">${n.entity}</span>
            ${E?"":'<span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`;const N=w.class==="df-risk-low"?"#5c5":w.class==="df-risk-moderate"?"#ca5":w.class==="df-risk-elevated"?"#c84":"#c55";l+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span class="df-badge df-badge-nation">${$(n.nation.toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:2px 7px;line-height:16px;color:${N};background:${N}12;border:1px solid ${N}25;">${w.label}</span>
        </div>`;const B=n.type==="BOND"?"FACE VALUE":n.type==="INSURE"?"COVERAGE":"AMOUNT",W=n.type==="BOND"?"COUPON":"REP",P=n.type==="BOND"?n.couponRate+"%":n.reputation||n.stability,V=n.type==="BOND"?n.couponRate*10:n.reputation||n.stability,z=n.type==="BOND"?"#c8a832":V>=60?"#5c5":V>=35?"#ca5":"#c84";if(l+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${B}</div>
                <div class="df-metrics__value" style="font-size:15px;color:var(--panel-text);">${c(n.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:14px;color:var(--panel-text);">${n.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${W}</div>
                <div class="df-metrics__value" style="font-size:14px;color:${z};">${P}</div>
            </div>
        </div>`,s){if(l+=`<div style="margin-top:8px;font-size:13px;color:#9e9a92;line-height:1.5;margin-bottom:8px;">${$(n.purpose)}</div>`,E)l+='<div class="df-detail">';else{const m=n.type==="LOAN"?"Banking":n.type==="INSURE"?"Insurance":"Investment";l+=`<div style="padding:8px 10px;background:rgba(106,102,96,0.06);border:1px solid var(--panel-border);font-family:var(--font-mono);font-size:11px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:var(--panel-text);font-weight:700;">${m}</span> subsector to underwrite.
                    ${_?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+$(_.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(E){if(n.type==="LOAN"){const m=n.corp_cash_reserves>0?Math.round(n.corp_debt/n.corp_cash_reserves*100):0,M=m>50?"#c84":"#5c5",T=n.corp_debt>n.corp_cash_reserves*.5?"#c84":"#9e9a92";l+=`<div class="df-detail-row"><span class="df-detail-label">CASH</span><span class="df-detail-value" style="color:#9e9a92;">${c(n.corp_cash_reserves)}</span></div>`,l+=`<div class="df-detail-row"><span class="df-detail-label">DEBT</span><span class="df-detail-value" style="color:${T};">${c(n.corp_debt)}</span></div>`,l+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/CASH</span><span class="df-detail-value" style="color:${M};font-weight:700;">${m}%</span></div>`}else if(n.type==="BOND"){const m=n.stability>=50?"#5c5":n.stability>=30?"#ca5":"#c84",M=n.debtToGdp>60?"#c55":n.debtToGdp>40?"#c84":"#5c5",T=n.creditRating>=60?"#5c5":n.creditRating>=35?"#ca5":"#c55";l+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${m};">${n.stability}/100</span></div>`,l+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${M};">${n.debtToGdp}%</span></div>`,l+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${T};font-weight:700;">${n.creditRating}/100</span></div>`}else if(n.type==="INSURE"){const m=n.reputation>=60?"#5c5":n.reputation>=35?"#ca5":"#c84",M=n.projectValue?"PROJECT VALUE":"FLEET VALUE",T=n.projectValue||n.fleetValue;l+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${m};">${n.reputation}/100</span></div>`,l+=`<div class="df-detail-row"><span class="df-detail-label">${M}</span><span class="df-detail-value" style="color:#9e9a92;">${c(T)}</span></div>`}l+="</div>"}}l+="</div>"}l+="</div>";const b=Y.filter(e=>e.type==="LOAN").length,p=Y.filter(e=>e.type==="INSURE").length,u=Y.filter(e=>e.type==="BOND").length;l+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${b}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${p}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${u}</span></div>
        </div>
        ${(()=>{const e=K>=0?Y[K]:null,n=e&&Be(e);return n?`<div class="df-review-btn active" onclick="rdOpen(${K})">REVIEW DEAL</div>`:e&&!n?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,o.innerHTML=l}function ct(){ie=ie==="all"?"mine":"all",K=-1,ge()}window.dfSetFilter=rt;window.dfToggleNation=ct;window.dfSelectDeal=lt;const Ve={CURRENT:{color:"#5c5",label:"CURRENT"},LATE:{color:"#c84",label:"LATE"},DELINQUENT:{color:"#c55",label:"DELINQUENT"},CLAIM:{color:"#c55",label:"CLAIM FILED"},ACTIVE:{color:"#5c5",label:"ACTIVE"},WATCHLIST:{color:"#ca5",label:"WATCHLIST"},DEFAULT:{color:"#c55",label:"DEFAULT"}};let L=[],_e="ALL",be=-1;function dt(o){_e=o,be=-1,j()}function pt(o){be=be===o?-1:o,j()}function j(){const o=document.getElementById("ap-container");if(!o)return;const t=_e==="ALL"?L:L.filter(d=>d.type===_e),i=L.reduce((d,s)=>d+(s.remaining||s.coverage||s.faceValue||0),0),a=L.reduce((d,s)=>d+(s.earned||s.premiumsCollected||s.couponsReceived||0),0),l=L.filter(d=>d.alert).length;let r=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Active Portfolio</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${l>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:#c55;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);">${l} ALERT${l>1?"S":""}</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${L.length} ACTIVE</span>
        </div>
    </div>`;r+=`<div class="ap-summary">
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
                ${["LOAN","INSURE","BOND"].map(d=>{const s=L.filter(w=>w.type===d).length;return`<div style="display:flex;align-items:center;gap:2px;"><div style="width:4px;height:4px;background:${d==="LOAN"?"#5a8aaa":d==="INSURE"?"#aa7a5a":"#8a6aaa"};border-radius:1px;"></div><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#9e9a92;">${s}</span></div>`}).join("")}
            </div>
        </div>
    </div>`,r+='<div class="df-filters">';for(const d of[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Policies",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}])r+=`<span class="df-pill${_e===d.id?" "+d.activeClass:""}" onclick="apSetFilter('${d.id}')">${d.label}</span>`;r+="</div>",r+='<div class="ap-list">',t.length===0&&(r+='<div class="ap-empty">No active positions.<br>Review deals from the Deal Flow to build your portfolio.</div>');for(let d=0;d<t.length;d++){const s=t[d],h=L.indexOf(s),w=be===h,E=Oe[s.type],N=Ve[s.status]||Ve.CURRENT,B=!!s.alert,W=s.paymentsMade||0,P=s.term||1,V=Math.round(W/P*100),z=B?N.color==="#c55"?"alert-red":N.color==="#c84"?"alert-orange":"alert-yellow":"";r+=`<div class="ap-deal ${z}" onclick="apToggle(${h})">
            <div class="ap-deal__inner" style="${w?"background:"+(E.class==="loan"?"rgba(90,138,170,0.08)":E.class==="insure"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,r+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${E.class}">${E.label}</span>
            <span style="font-size:11px;font-weight:600;color:var(--panel-text);flex:1;">${$(s.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${N.color};background:${N.color}12;border:1px solid ${N.color}25;">${N.label}</span>
        </div>`,r+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${$((s.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${W}/${P}mo — ${V}%</span>
        </div>`;const m=B?N.color:E.class==="loan"?"#5a8aaa":E.class==="insure"?"#aa7a5a":"#8a6aaa";r+=`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(V,100)}%;background:${m};"></div></div>`;const M=s.type==="LOAN"?"REMAINING":s.type==="INSURE"?"COVERAGE":"FACE VALUE",T=s.remaining||s.coverage||s.faceValue||0,F=s.type==="LOAN"?"RATE":s.type==="INSURE"?"PREMIUM":"COUPON",de=s.rate||s.premiumRate||s.coupon||0,oe=s.earned||s.premiumsCollected||s.couponsReceived||0,f=s.type==="LOAN"?"INTEREST EARNED":s.type==="INSURE"?"PREMIUMS EARNED":"COUPONS EARNED",g=E.class==="loan"?"#5a8aaa":E.class==="insure"?"#aa7a5a":"#8a6aaa";if(r+=`<div class="df-metrics" style="margin-top:4px;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${M}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);margin-top:1px;">${c(T)}</div>
            </div>
            <div style="flex:0.8;padding:3px 6px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${F}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${g};margin-top:1px;">${de}%</div>
            </div>
            <div style="flex:1;padding:3px 6px;text-align:right;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${f}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5c5;margin-top:1px;">${c(oe)}</div>
            </div>
        </div>`,B&&(r+=`<div class="ap-deal__alert" style="background:${N.color}08;border:1px solid ${N.color}20;color:${N.color};">${$(s.alert)}</div>`),w){if(r+='<div class="ap-deal__expanded">',s.type==="LOAN"){const A=[{label:"PRINCIPAL",value:c(s.principal||0)},{label:"REMAINING",value:c(s.remaining||0),color:"var(--panel-text)"},{label:"MONTHLY PAYMENT",value:c(s.monthlyPayment||0)},{label:"MISSED PAYMENTS",value:String(s.missedPayments||0),color:(s.missedPayments||0)>0?"#c55":"#5c5"},{label:"NEXT DUE",value:s.nextPayment||"—",color:s.status==="LATE"?"#c55":"#9e9a92"}];for(const O of A)r+=`<div class="ap-detail-row"><span class="ap-detail-label">${O.label}</span><span class="ap-detail-value" style="color:${O.color||"#9e9a92"};">${O.value}</span></div>`;s.status!=="CURRENT"&&(r+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apRestructure('${s.id}')">RESTRUCTURE</div><div class="ap-action-btn orange" onclick="apCallLoan('${s.id}')">CALL LOAN</div><div class="ap-action-btn red" onclick="apForeclose('${s.id}')">FORECLOSE</div></div>`)}else if(s.type==="INSURE"){const A=[{label:"COVERAGE",value:c(s.coverage||0)},{label:"PREMIUMS COLLECTED",value:c(s.premiumsCollected||0),color:"#5c5"},{label:"CLAIMS FILED",value:String(s.claims||0),color:(s.claims||0)>0?"#c84":"#5c5"},{label:"PAID OUT",value:c(s.paidOut||0),color:(s.paidOut||0)>0?"#c55":"#6a6660"}];for(const O of A)r+=`<div class="ap-detail-row"><span class="ap-detail-label">${O.label}</span><span class="ap-detail-value" style="color:${O.color||"#9e9a92"};">${O.value}</span></div>`;s.status==="CLAIM"&&s.claimAmount&&(r+=`<div class="ap-claim-box"><div style="font-family:var(--font-mono);font-size:7px;color:#c55;letter-spacing:0.8px;margin-bottom:2px;">PENDING CLAIM</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${c(s.claimAmount)}</div></div>`,r+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apPayClaim('${s.id}')">PAY IN FULL</div><div class="ap-action-btn orange" onclick="apNegotiateClaim('${s.id}')">NEGOTIATE</div><div class="ap-action-btn red" onclick="apDisputeClaim('${s.id}')">DISPUTE</div></div>`)}else if(s.type==="BOND"){const A=[{label:"FACE VALUE",value:c(s.faceValue||0)},{label:"COUPONS RECEIVED",value:c(s.couponsReceived||0),color:"#5c5"},{label:"NEXT COUPON",value:s.nextCoupon||"—"},{label:"ANNUAL YIELD",value:c(Math.round((s.faceValue||0)*(s.coupon||0)/100)),color:"#8a6aaa"}];for(const O of A)r+=`<div class="ap-detail-row"><span class="ap-detail-label">${O.label}</span><span class="ap-detail-value" style="color:${O.color||"#9e9a92"};">${O.value}</span></div>`;r+=`<div class="ap-actions"><div class="ap-action-btn purple" onclick="apSellPosition('${s.id}')">SELL POSITION</div><div class="ap-action-btn olive">HOLD</div></div>`}r+="</div>"}r+="</div></div>"}r+="</div>";const b=L.reduce((d,s)=>d+(s.principal||s.coverage||s.faceValue||0),0),p=b>0?Math.round(a/b*1e4)/100:0,u=L.length>0?Math.round(L.reduce((d,s)=>d+(s.rate||0),0)/L.length*10)/10:0,e=L.filter(d=>d.status==="LATE"||d.status==="DELINQUENT").length,n=L.length>0?Math.round(e/L.length*100):0;r+=`<div class="df-footer" style="flex-direction:column;gap:6px;">
        <div style="display:flex;gap:8px;justify-content:space-between;width:100%;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EXPOSURE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${c(i)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EARNED</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;">${c(a)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">ROI</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${p>=0?"#5c5":"#c55"};">${p}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">AVG RATE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#ca5;">${u}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">RISK</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${n>20?"#c55":n>0?"#ca5":"#5c5"};">${n}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            ${["LOAN","INSURE","BOND"].map(d=>{const s=d==="LOAN"?"#5a8aaa":d==="INSURE"?"#aa7a5a":"#8a6aaa",h=L.filter(w=>w.type===d).length;return`<div style="text-align:center;padding:1px 6px;border:1px solid ${h>0?s+"33":"var(--panel-border)"};background:${h>0?s+"0a":"transparent"};"><div style="font-family:var(--font-mono);font-size:6px;color:${s};">${d}</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h>0?"var(--panel-text)":"#6a6660"};">${h}</div></div>`}).join("")}
        </div>
    </div>`,o.innerHTML=r}window.apSetFilter=dt;window.apToggle=pt;async function ft(o){const t=prompt(`RESTRUCTURE LOAN

Enter new annual interest rate (1-20%):
(This extends the term by 12 months and resets missed payments.)`);if(!t)return;const i=parseFloat(t);if(isNaN(i)||i<1||i>20){alert("Rate must be between 1% and 20%.");return}const{data:a}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!a){alert("Loan not found.");return}const l=a.term_months+12,r=i/100/12,b=Number(a.principal)-Number(a.total_paid||0)+Number(a.total_interest_paid||0),p=r>0?Math.round(b*(r*Math.pow(1+r,l))/(Math.pow(1+r,l)-1)):Math.round(b/l);if(!confirm(`Restructure to ${i}% over ${l} months?
New monthly payment: ${c(p)}
Missed payments reset to 0.`))return;const{error:u}=await y.from("finance_active_loans").update({interest_rate:i,term_months:l,monthly_payment:p,payments_missed:0,status:"current"}).eq("id",o);if(u){alert("Failed: "+u.message);return}alert("Loan restructured."),await ae(),j()}async function vt(o){if(!confirm(`CALL LOAN

Demand immediate full repayment of remaining principal.
The borrower will have 3 ticks to pay or default.

Proceed?`))return;const{error:t}=await y.from("finance_active_loans").update({status:"delinquent",payments_missed:3}).eq("id",o);if(t){alert("Failed: "+t.message);return}alert("Loan called. Borrower has 1 tick to pay before default."),await ae(),j()}async function ut(o){if(!confirm(`FORECLOSE

Immediately default the loan and seize collateral.
Collateral recovery: Equipment 60%, Property 75%, Unsecured 0%.

This cannot be undone. Proceed?`))return;const{data:t}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Loan not found.");return}const i=Math.max(0,Number(t.principal)-Number(t.total_paid||0));let a=0;t.collateral_type==="equipment"?a=.6:t.collateral_type==="property"&&(a=.75);const l=Math.round(i*a);if(l>0){const{data:r}=await y.from("factions").select("corp_cash_reserves").eq("id",_.id).single();await y.from("factions").update({corp_cash_reserves:Number(r?.corp_cash_reserves||0)+l}).eq("id",_.id),_.corp_cash_reserves=Number(r?.corp_cash_reserves||0)+l}await y.from("finance_active_loans").update({status:"defaulted",completed_tick:q?.current_tick||0}).eq("id",o),alert("Foreclosed. Recovered: "+c(l)+" from "+(t.collateral_type||"unsecured")+" collateral."),await ae(),j()}async function mt(o){const{data:t}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Policy not found.");return}const i=Number(t.principal||0)-Number(t.claims_paid||0),a=Number(t.deductible_pct||0)/100,l=Math.round(i*(1-a));if(!confirm(`PAY CLAIM IN FULL

Claim: ${c(i)}
Deductible: ${t.deductible_pct}%
Payout: ${c(l)}

This will be deducted from your cash reserves.`))return;const{data:r}=await y.from("factions").select("corp_cash_reserves").eq("id",_.id).single(),b=Number(r?.corp_cash_reserves||0);if(b<l){alert("Insufficient funds. You have "+c(b)+".");return}await y.from("factions").update({corp_cash_reserves:b-l}).eq("id",_.id),_.corp_cash_reserves=b-l;const{data:p}=await y.from("factions").select("corp_cash_reserves").eq("id",t.borrower_faction_id).single();p&&await y.from("factions").update({corp_cash_reserves:Number(p.corp_cash_reserves||0)+l}).eq("id",t.borrower_faction_id),await y.from("finance_active_loans").update({claims_paid:Number(t.claims_paid||0)+l,claims_count:(t.claims_count||0)+1}).eq("id",o),alert("Claim paid: "+c(l)),await ae(),j()}async function _t(o){const t=prompt(`NEGOTIATE CLAIM

Offer a percentage of the claim to settle (10-90%):
(Policyholder may reject low offers.)`);if(!t)return;const i=parseInt(t);if(isNaN(i)||i<10||i>90){alert("Must be between 10% and 90%.");return}const a=i/100;if(!(Math.random()<a)){alert("Offer rejected. The policyholder wants a higher settlement.");return}const{data:r}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!r)return;const b=Number(r.principal||0)-Number(r.claims_paid||0),p=Math.round(b*i/100),{data:u}=await y.from("factions").select("corp_cash_reserves").eq("id",_.id).single(),e=Number(u?.corp_cash_reserves||0);if(e<p){alert("Insufficient funds.");return}await y.from("factions").update({corp_cash_reserves:e-p}).eq("id",_.id),_.corp_cash_reserves=e-p;const{data:n}=await y.from("factions").select("corp_cash_reserves").eq("id",r.borrower_faction_id).single();n&&await y.from("factions").update({corp_cash_reserves:Number(n.corp_cash_reserves||0)+p}).eq("id",r.borrower_faction_id),await y.from("finance_active_loans").update({claims_paid:Number(r.claims_paid||0)+p,claims_count:(r.claims_count||0)+1,status:"repaid"}).eq("id",o),alert("Claim settled at "+i+"% ("+c(p)+"). Policy closed."),await ae(),j()}async function yt(o){if(!confirm(`DISPUTE CLAIM

Challenge the validity of this claim.
This freezes the claim for 4 ticks while investigated.
If investigation finds the claim valid, you pay in full + 10% penalty.
If investigation finds fraud, claim is dismissed.

Dispute?`))return;Math.random()<.7?alert(`Investigation complete: claim is VALID.
You must now pay the full claim.`):(await y.from("finance_active_loans").update({status:"repaid",claims_count:0}).eq("id",o),alert(`Investigation complete: FRAUDULENT CLAIM detected.
Claim dismissed. Policy remains active.`)),await ae(),j()}async function bt(o){const{data:t}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Position not found.");return}const i=Number(t.principal||0)-Number(t.total_paid||0),a=Math.round(i*.85);if(!confirm(`SELL POSITION

Remaining value: ${c(i)}
Market price (85%): ${c(a)}

You receive ${c(a)} immediately.
The position is removed from your portfolio.`))return;const{data:l}=await y.from("factions").select("corp_cash_reserves").eq("id",_.id).single();await y.from("factions").update({corp_cash_reserves:Number(l?.corp_cash_reserves||0)+a}).eq("id",_.id),_.corp_cash_reserves=Number(l?.corp_cash_reserves||0)+a,await y.from("finance_active_loans").update({status:"repaid",completed_tick:q?.current_tick||0}).eq("id",o),alert("Position sold for "+c(a)+"."),await ae(),j()}window.apRestructure=ft;window.apCallLoan=vt;window.apForeclose=ut;window.apPayClaim=mt;window.apNegotiateClaim=_t;window.apDisputeClaim=yt;window.apSellPosition=bt;function He(o,t){const i=o.reduce((a,l)=>a+l.value,0);return i===0?`<div class="rr-seg-bar" style="height:${t}px;background:var(--panel-border);"></div>`:`<div class="rr-seg-bar" style="height:${t}px;">${o.map(a=>`<div style="width:${(a.value/i*100).toFixed(1)}%;height:100%;background:${a.color};"></div>`).join("")}</div>`}function gt(){const o=document.getElementById("rr-container");if(!o)return;const t=Number(_?.corp_cash_reserves)||0,i=L.filter(f=>f.type==="LOAN").reduce((f,g)=>f+(g.remaining||0),0),a=L.filter(f=>f.type==="INSURE").reduce((f,g)=>f+(g.coverage||0),0),l=L.filter(f=>f.type==="BOND").reduce((f,g)=>f+(g.faceValue||0),0),r=i+a+l,b=r,p=t+b,u=Le?.12:.15,e=Math.round(r*u),n=r>0?Math.round(t/r*100):100,d=Math.round(u*100),s=n>=30?"HEALTHY":n>=20?"ADEQUATE":n>=d?"THIN":"CRITICAL",h=n>=30?"#5c5":n>=20?"#ca5":n>=d?"#c84":"#c55",w=Math.max(0,t-e),E={};for(const f of L){const g=f.nation||"Unknown",A=f.remaining||f.coverage||f.faceValue||0;E[g]=(E[g]||0)+A}const N=Object.entries(E).map(([f,g])=>({name:f,exposure:g,pct:r>0?Math.round(g/r*100):0})).sort((f,g)=>g.exposure-f.exposure),B={};for(const f of L){const g=f.type==="BOND"?"Government":f.sector||"Other",A=f.remaining||f.coverage||f.faceValue||0;B[g]=(B[g]||0)+A}const W=Object.entries(B).map(([f,g])=>({name:f,exposure:g,pct:r>0?Math.round(g/r*100):0})).sort((f,g)=>g.exposure-f.exposure),P=N.length>0?N[0].pct:0,V=P>60?"HIGH":P>40?"MODERATE":"LOW",z=V==="HIGH"?"#c55":V==="MODERATE"?"#ca5":"#5c5";let m=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Reserves & Risk</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${h};background:${h}12;border:1px solid ${h}25;">${s}</span>
    </div>`;if(m+='<div style="flex:1;overflow-y:auto;">',Le&&(m+=`<div style="padding:5px 14px;background:rgba(200,168,50,0.06);border-bottom:1px solid rgba(200,168,50,0.15);display:flex;align-items:center;gap:6px;">
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:#c8a832;background:rgba(200,168,50,0.12);border:1px solid rgba(200,168,50,0.25);">POLICY</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#c8a832;">Financial Sector Deregulation Act</span>
            <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">Reserve req: ${d}% &middot; Interest: +10%</span>
        </div>`),m+='<div class="rr-section-bar">Capital Position</div>',m+='<div class="rr-section">',m+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">TOTAL ASSETS</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${c(p)}</span>
    </div>`,m+=He([{value:t,color:"#5c5"},{value:b,color:"#8b9a6b"}],6),m+=`<div class="rr-seg-legend">
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
    </div>`,m+="</div>",m+='<div class="rr-section-bar">Exposure by Type</div>',m+='<div class="rr-section">',r>0){m+=He([{value:i,color:"#5a8aaa"},{value:a,color:"#aa7a5a"},{value:l,color:"#8a6aaa"}],6),m+='<div style="margin-top:6px;">';const f=[{label:"Loans",value:i,color:"#5a8aaa",pct:r>0?Math.round(i/r*100):0},{label:"Insurance",value:a,color:"#aa7a5a",pct:r>0?Math.round(a/r*100):0},{label:"Bonds",value:l,color:"#8a6aaa",pct:r>0?Math.round(l/r*100):0}];for(let g=0;g<f.length;g++){const A=f[g];m+=`<div class="rr-type-row">
                <div style="width:6px;height:6px;background:${A.color};margin-right:6px;"></div>
                <span style="flex:1;font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${A.label}</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${c(A.value)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;width:28px;text-align:right;">${A.pct}%</span>
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No exposure</div>';if(m+="</div>",m+=`<div class="rr-section-bar" style="display:flex;justify-content:space-between;align-items:center;">
        <span>Concentration Risk</span>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${z};background:${z}12;border:1px solid ${z}25;">${V}</span>
    </div>`,m+='<div class="rr-section">',N.length>0){m+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">BY NATION</div>';for(const f of N){const g=f.pct>50?"#c84":f.pct>30?"#ca5":"#5c5";m+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;width:52px;text-align:center;">${$(f.name.toUpperCase().slice(0,6))}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${f.pct}%;background:${g};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${c(f.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${f.pct>50?"#c84":"#9e9a92"};">${f.pct}%</span>
            </div>`}}if(W.length>0){m+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-top:8px;margin-bottom:4px;">BY SECTOR</div>';for(const f of W){const g=f.pct>50?"#c84":f.pct>30?"#ca5":"#5c5";m+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:52px;">${$(f.name)}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${f.pct}%;background:${g};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${c(f.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${f.pct>50?"#c84":"#9e9a92"};">${f.pct}%</span>
            </div>`}}if(N.length===0&&W.length===0&&(m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No positions to analyze</div>'),m+="</div>",m+='<div class="rr-section-bar">Actions</div>',m+='<div class="rr-section">',m+=`<div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Max single-deal size (${d}% reserve)</span>
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">${c(w)}</span>
    </div>`,P>50&&N.length>1){const f=N[0],g=Math.round(100/N.length),A=Math.round(r*g/100),O=f.exposure-A;m+=`<div style="padding:6px 8px;background:rgba(200,136,68,0.06);border:1px solid rgba(200,136,68,0.15);margin-bottom:6px;">
            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#c84;margin-bottom:2px;">DIVERSIFICATION TIP</div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;line-height:1.5;">
                ${$(f.name)} is ${f.pct}% of your book (target: ~${g}%).
                Reduce exposure by ~${c(O)} or grow positions in other nations.
            </div>
        </div>`}const M=L.filter(f=>f.status==="LATE"||f.status==="DELINQUENT").length,T=[];n>=30&&T.push("reserves"),P<=40&&T.push("diversified"),M===0&&T.push("no_delinquent"),L.length>=3&&T.push("scale");const F=T.length,de=F>=4?"EXCELLENT":F>=3?"GOOD":F>=2?"FAIR":"POOR",oe=F>=4?"#5c5":F>=3?"#ca5":F>=2?"#c84":"#c55";m+=`<div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">PORTFOLIO HEALTH</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${oe};">${de} (${F}/4)</span>
    </div>`,m+=`<div style="margin-top:4px;display:flex;gap:3px;">
        ${["Reserves","Diversified","No Defaults","Scale"].map((f,g)=>{const A=T.length>g&&T.includes(["reserves","diversified","no_delinquent","scale"][g]);return`<span style="flex:1;text-align:center;padding:2px 0;font-family:var(--font-mono);font-size:6px;font-weight:700;color:${A?"#5c5":"#6a6660"};border:1px solid ${A?"rgba(92,204,92,0.2)":"var(--panel-border)"};background:${A?"rgba(92,204,92,0.04)":"transparent"};">${A?"✓":"✗"} ${f}</span>`}).join("")}
    </div>`,m+="</div>",P>60&&N.length>0&&(m+=`<div class="rr-warning"><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c55;">CONCENTRATION WARNING: </span>${P}% of exposure is in ${$(N[0].name)}. A sovereign crisis or economic downturn in this nation would affect the majority of your portfolio. Consider diversifying across nations.</div>`),m+="</div>",m+=`<div class="df-footer" style="justify-content:space-between;">
        <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">DEPLOYABLE CAPITAL</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${w>0?"#5c5":"#c55"};">${c(w)}</div></div>
        <div style="text-align:right;"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">TOTAL EXPOSURE</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${c(r)}</div></div>
    </div>`,o.innerHTML=m}const Ge={REPAID:{color:"#5c5",label:"REPAID"},DEFAULTED:{color:"#c55",label:"DEFAULTED"},EXPIRED:{color:"#5c5",label:"EXPIRED"},CLAIMED:{color:"#c84",label:"CLAIMED"},MATURED:{color:"#5c5",label:"MATURED"},SOLD:{color:"#ca5",label:"SOLD EARLY"},FORECLOSED:{color:"#c55",label:"FORECLOSED"}};let U=[],Te=-1;function xt(o){Te=Te===o?-1:o,Ie()}function Ie(){const o=document.getElementById("cc-container");if(!o)return;const t=U.reduce((u,e)=>u+(e.earned||0),0),i=U.reduce((u,e)=>u+(e.lost||0),0),a=U.reduce((u,e)=>u+(e.net||0),0),l=U.filter(u=>u.net>0).length,r=U.filter(u=>u.net<0).length,b=a>=0;let p=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Collections</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${U.length} RESOLVED</span>
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
    </div>`,U.length>0){const u=l/U.length*100;p+=`<div class="cc-winloss">
            <div class="cc-winloss__bar">
                <div style="width:${u}%;background:#5c5;height:100%;"></div>
                <div style="flex:1;background:#c55;height:100%;"></div>
            </div>
            <span class="cc-winloss__stat" style="color:#5c5;">${l}W</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&mdash;</span>
            <span class="cc-winloss__stat" style="color:#c55;">${r}L</span>
        </div>`}p+='<div class="cc-list">',U.length===0&&(p+='<div class="cc-empty">No resolved deals yet.<br>Completed loans, expired policies, and matured bonds appear here.</div>');for(let u=0;u<U.length;u++){const e=U[u],n=Oe[e.type]||{class:"loan",label:e.type},d=Ge[e.outcome]||{color:"#9e9a92",label:e.outcome},s=Te===u,h=e.net>=0;p+=`<div class="cc-deal" onclick="ccToggle(${u})" style="border-left:2px solid ${h?"#5c5":"#c55"};">
        <div class="cc-deal__inner" style="${s?"background:"+(e.type==="LOAN"?"rgba(90,138,170,0.08)":e.type==="INSURE"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,p+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${n.class}">${n.label}</span>
            <span style="font-size:11px;font-weight:600;color:var(--panel-text);flex:1;">${$(e.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${d.color};background:${d.color}12;border:1px solid ${d.color}25;">${d.label}</span>
        </div>`,p+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${$((e.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${$(e.resolved||"")}</span>
        </div>`,p+='<div class="df-metrics">',p+=`<div style="flex:1;padding:3px 8px;">
            <div class="df-metrics__label">PRINCIPAL</div>
            <div class="df-metrics__value" style="font-size:10px;color:var(--panel-text);margin-top:1px;">${c(e.principal||0)}</div>
        </div>`,p+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid var(--panel-border);">
            <div class="df-metrics__label">EARNED</div>
            <div class="df-metrics__value" style="font-size:10px;color:#5c5;margin-top:1px;">${c(e.earned||0)}</div>
        </div>`,e.lost>0&&(p+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid var(--panel-border);">
                <div class="df-metrics__label">LOST</div>
                <div class="df-metrics__value" style="font-size:10px;color:#c55;margin-top:1px;">${c(e.lost)}</div>
            </div>`),p+=`<div style="flex:1;padding:3px 8px;text-align:right;border-left:1px solid var(--panel-border);background:${h?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="df-metrics__label">NET</div>
            <div class="df-metrics__value" style="font-size:11px;color:${h?"#5c5":"#c55"};margin-top:1px;">${h?"+":""}${c(e.net||0)}</div>
        </div>`,p+="</div>",s&&(p+='<div class="cc-deal__expanded">',e.term&&(p+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">TERM</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${$(e.term)}</span>
                </div>`),e.rate&&(p+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">RATE</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${$(e.rate)}</span>
                </div>`),e.note&&(p+=`<div style="padding:4px 0;">
                    <div style="font-size:9px;color:${h?"#9e9a92":"#c84"};line-height:1.5;">${$(e.note)}</div>
                </div>`),p+="</div>"),p+="</div></div>"}p+="</div>",p+=`<div class="df-footer" style="justify-content:space-between;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">LIFETIME P&amp;L</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${b?"#5c5":"#c55"};">${b?"+":""}${c(a)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            ${Object.entries(U.reduce((u,e)=>(u[e.outcome]=(u[e.outcome]||0)+1,u),{})).map(([u,e])=>{const n=Ge[u]||{color:"#9e9a92",label:u};return`<div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:${n.color};letter-spacing:0.3px;">${n.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);">${e}</div>
                </div>`}).join("")}
        </div>
    </div>`,o.innerHTML=p}window.ccToggle=xt;const ht={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let x=null,R="LOAN",Q=8,Z=18e6,ye=24,I="equipment",fe="",se=3.5,X=12e6,te=10,Ce="",C=25e6;const Re=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function wt(o){const t=Y[o];t&&(x=t,R=t.type,t.type==="LOAN"?(Q=8,Z=t.amount,ye=t.term||24,I=t.collateral||"unsecured",fe=""):t.type==="INSURE"?(se=t.isVesselInsurance?1.75:3.5,X=t.amount,te=10,Ce=""):t.type==="BOND"&&(C=Math.round(t.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",re())}function je(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",x=null}function $t(o){Q=Number(o),re()}function Et(o){I=o,re()}function Nt(o){fe=o}function At(o){se=Number(o),re()}function Rt(o){X=Number(o),re()}function Lt(o){te=Number(o),re()}function Tt(o){C=Number(o),re()}function pe(o,t,i){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(o/t*100,100)}%;background:${i};"></div></div>`}function re(){const o=document.getElementById("rd-modal");if(!o||!x)return;const t=x,i=R==="LOAN"?"#5a8aaa":R==="INSURE"?"#aa7a5a":"#8a6aaa",a=Math.round(Z*(Q/100)*(ye/12)),l=Math.round((Z+a)/ye),r=t.revenue||474e5,b=Math.round(l/r*1200),p=12,u=Math.max(0,(Q-6)*1.5),e=Z>15e6?3:0,n=I==="none"?3:I==="full"?-2:0,d=Number(t.corp_debt||0),s=Number(t.corp_cash_reserves||1),h=d>0?Math.min(15,Math.round(d/Math.max(s,1)*5)):0,w=Math.min(60,Math.max(2,Math.round(p+u+e+n+h))),E=w<=15?"#5c5":w<=30?"#ca5":w<=45?"#c84":"#c55",N=w<=15?"LOW":w<=30?"MODERATE":w<=45?"ELEVATED":"HIGH",B=95,W=(Q-4)*8,P=Z<(t.amount||18e6)?10:0,V=I==="full"?15:I==="property"?8:I==="none"?-5:0,z=Math.max(10,Math.min(95,Math.round(B-W-P-V))),m=z>=70?"#5c5":z>=45?"#ca5":z>=25?"#c84":"#c55",M={unsecured:"none",equipment:"equipment",property:"property"},T=Re.find(H=>H.id===(M[I]||I))||Re[0],F=Math.round(a*(1-w/100)),de=(t.term||18)/12,oe=Math.round(X*(se/100)*de),f=100-(t.reputation||50),g=Math.max(5,Math.min(50,Math.round(f*.4))),A=Math.round(X*(1-te/100)),O=Math.round(A*(g/100)),ve=oe-O,xe=g<=12?"#5c5":g<=22?"#ca5":g<=35?"#c84":"#c55",he=t.couponRate||6.2,Se=t.term||60,Me=Se/12,We=Math.round(C*(he/100)),De=Math.round(C*(he/100)*Me),le=t.stability||50,Pe=t.creditRating||50,ze=t.debtToGdp||30,Xe=Math.max(2,Math.round((100-le)*.15+(100-Pe)*.15+Math.max(0,ze-30)*.3)),J=Math.min(60,Xe),we=J<=10?"#5c5":J<=20?"#ca5":J<=35?"#c84":"#c55",Ue=Math.round(De*(1-J/100));let v=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${i};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>`;if(v+=`<div class="rd-tabs">
        <span class="rd-tab ${R==="LOAN"?"active-loan":R==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${R==="LOAN"?"Loan":R==="INSURE"?"Insure":"Bond"} — ${$(t.applicant)}</span>
    </div></div>`,v+='<div class="rd-body">',v+='<div class="rd-left">',R==="LOAN"){const H=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84";v+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${$(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${$(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${$(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">CASH</div><div class="rd-applicant__stat-value" style="color:#5c5;">${c(t.corp_cash_reserves||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${c(t.corp_debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${H};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${c(t.amount)}</div></div>
            </div>
            <div style="margin-top:6px;padding:6px 8px;background:rgba(200,136,68,0.04);border:1px solid rgba(200,136,68,0.12);">
                <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c84;letter-spacing:0.8px;margin-bottom:4px;">EXISTING OBLIGATIONS</div>
                <div style="display:flex;gap:16px;">
                    <div><span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">ACTIVE LOANS</span><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.activeLoans>0?"#c84":"#5c5"};">${t.activeLoans}</div></div>
                    <div><span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">OUTSTANDING</span><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.totalOutstanding>0?"#c84":"#5c5"};">${c(t.totalOutstanding)}</div></div>
                    <div><span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEBT-TO-CASH</span><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.corp_debt>t.corp_cash_reserves?"#c55":t.corp_debt>0?"#ca5":"#5c5"};">${t.corp_cash_reserves>0?(t.corp_debt/t.corp_cash_reserves*100).toFixed(0)+"%":"—"}</div></div>
                </div>
            </div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const G=(Q-3)/15*100;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${Q}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${Q}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${G}%,var(--panel-border) ${G}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`,v+=`<div class="rd-control">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">Borrower's Request</div>
            <div class="rd-risk-row"><span class="rd-risk-label">LOAN AMOUNT</span><span class="rd-risk-value" style="color:var(--panel-text);">${c(Z)}</span></div>
            <div class="rd-risk-row"><span class="rd-risk-label">TERM</span><span class="rd-risk-value" style="color:var(--panel-text);">${ye}mo</span></div>
        </div>`,v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">REQUIRE COLLATERAL</span>
                <span class="rd-control__value" style="font-size:12px;color:#5a8aaa;">${T.label}</span>
            </div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                ${Re.map(k=>`<div onclick="rdSetLoanCollateral('${k.id}')" style="
                    flex:1;padding:6px 4px;text-align:center;
                    font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;
                    background:${I===k.id||(M[I]||I)===k.id?"rgba(90,138,170,0.12)":"transparent"};
                    border:1px solid ${I===k.id||(M[I]||I)===k.id?"rgba(90,138,170,0.3)":"var(--panel-border)"};
                    color:${I===k.id||(M[I]||I)===k.id?"#5a8aaa":"#6a6660"};
                    cursor:pointer;
                ">${k.label}</div>`).join("")}
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:6px;">
                ${T.id==="none"?"No collateral. Higher risk, lower acceptance chance.":T.id==="equipment"?"Borrower pledges equipment as security. Moderate risk reduction.":"Borrower pledges property. Strongest security, highest acceptance."}
            </div>
        </div>`,v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">OFFER TERMS (OPTIONAL)</span>
            </div>
            <textarea id="rd-loan-terms" maxlength="500" rows="3" placeholder="e.g. Early repayment penalty of 2%. Quarterly reporting required..." oninput="rdSetLoanTermsText(this.value)" style="
                width:100%;margin-top:6px;padding:8px 10px;
                background:var(--panel-main);border:1px solid var(--panel-border);color:var(--panel-text);
                font-family:var(--font-sans);font-size:11px;line-height:1.5;
                resize:vertical;outline:none;box-sizing:border-box;
            ">${$(fe)}</textarea>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Visible to the borrower. 500 characters max.</div>
        </div>`}if(R==="INSURE"){const H=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84",G=t.projectValue?"PROJECT":"FLEET",k=t.projectValue||t.fleetValue||0;v+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${$(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${$(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${$(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${H};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${G}</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${c(k)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${c(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${t.term}mo</div></div>
            </div>
        </div>`,t.purpose&&t.purpose!=="Construction Insurance"&&(v+=`<div style="padding:8px 14px;background:rgba(170,122,90,0.04);border-bottom:1px solid rgba(170,122,90,0.12);">
                <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#aa7a5a;letter-spacing:0.8px;margin-bottom:3px;">REQUESTED COVERAGE</div>
                <div style="font-size:10px;color:var(--panel-text);line-height:1.5;white-space:pre-wrap;">${$(t.purpose)}</div>
            </div>`),v+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const ce=!!x.isVesselInsurance,ne=ce?.5:1,S=ce?4:8,Ee=ce?.25:.5,qe=S>ne?(se-ne)/(S-ne)*100:0;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${se}%</span>
            </div>
            <input type="range" class="rd-control__range" min="${ne}" max="${S}" step="${Ee}" value="${se}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${qe}%,var(--panel-border) ${qe}%);">
            <div class="rd-control__hints"><span>${ne}% (competitive)</span><span>${S}% (expensive)</span></div>
        </div>`;const Ne=Math.round((t.projectValue||t.fleetValue||t.amount)*.7),ue=Math.round(t.amount*.33),Fe=(X-ue)/(Ne-ue)*100;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:var(--panel-text);">${c(X)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${ue}" max="${Ne}" step="1000000" value="${X}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${Fe}%,var(--panel-border) ${Fe}%);">
            <div class="rd-control__hints"><span>${c(ue)} (partial)</span><span>${c(Ne)} (max)</span></div>
        </div>`,v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:var(--panel-text);">${te}%</span>
            </div>
            <div class="rd-presets">`;for(const Ae of[5,10,15,20,25])v+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${Ae})" style="${te===Ae?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${Ae}%</span>`;v+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${te}% of any claim (${c(Math.round(X*te/100))})</div>
        </div>`,v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">WHAT WE AGREE TO COVER</span>
            </div>
            <textarea id="rd-policy-terms" rows="3" placeholder="e.g., Covers weather delays, material damage, and labor disputes. Excludes negligence and acts of war. Maximum payout per claim: 50% of coverage."
                style="width:100%;box-sizing:border-box;padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--panel-text);background:var(--panel-main);border:1px solid var(--panel-border);resize:vertical;line-height:1.5;"
                oninput="rdPolicyTerms=this.value">${Ce||""}</textarea>
        </div>`}if(R==="BOND"){const H=le>=50?"#5c5":le>=30?"#ca5":le>=15?"#c84":"#c55";v+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${$(t.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${$(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${c(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${he}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${Se}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${H};">${le}</div></div>
            </div>
        </div>`,v+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const G=t.amount,k=Math.max(5e6,Math.ceil(G*.05/5e6)*5e6),ce=(C-k)/(G-k)*100;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${c(C)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${k}" max="${G}" step="5000000" value="${C}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${ce}%,var(--panel-border) ${ce}%);">
            <div class="rd-control__hints"><span>${c(k)} (small position)</span><span>${c(G)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,v+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const ne=[{key:"stability",value:le,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:ze,label:"Debt burden",invert:!0},{key:"credit_rating",value:Pe,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:t.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:t.corruption||62,label:"Institutional risk",invert:!0}];for(const S of ne){const Ee=S.invert?S.value>60?"#c55":S.value>40?"#ca5":"#5c5":S.value>=50?"#5c5":S.value>=30?"#ca5":S.value>=15?"#c84":"#c55";v+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${S.key}</span>
                <div style="width:40px;">${pe(S.value,100,Ee)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:18px;text-align:right;">${S.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${S.label}</span>
            </div>`}v+="</div>"}if(v+="</div>",v+='<div class="rd-right">',R==="LOAN"){v+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${E};">${w}%</span>
            </div>
            ${pe(w,100,E)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${E};margin-top:4px;">${N}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${m};">${z}%</span>
            </div>
            ${pe(z,100,m)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',v+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${c(Z)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${c(a)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${c(l)}</span></div>`;const H=b>30?"#c55":b>15?"#ca5":"#5c5";v+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${H};">${b}% of revenue</span></div>`,v+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${c(F)}</span></div>`,v+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${w}% default)</div>`}if(R==="INSURE"){v+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${xe};">${g}%</span>
            </div>
            ${pe(g,100,xe)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',v+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${c(A)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${c(oe)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${c(O)}</span></div>`;const H=ve>0?"":" negative",G=ve>0?"#5c5":"#c55";v+=`<div class="rd-expected${H}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${G};">${c(ve)}</span></div>`,v+=`<div class="rd-formula">Premiums (${c(oe)}) − expected payout (${g}% × ${c(A)})</div>`}R==="BOND"&&(v+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${we};">${J}%</span>
            </div>
            ${pe(J,100,we)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',v+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${c(C)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${c(We)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(Me)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${c(De)}</span></div>`,v+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${c(Ue)}</span></div>`,v+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${J}% default)</div>`),v+="</div>",v+="</div>";const Qe=R==="LOAN"?Z:R==="INSURE"?X:C,Ke=R==="LOAN"?F:R==="INSURE"?ve:Ue,Je=R==="LOAN"?w:R==="INSURE"?g:J,Ze=R==="LOAN"?E:R==="INSURE"?xe:we,et=R==="LOAN"?"OFFER LOAN":R==="INSURE"?"WRITE POLICY":"BUY BONDS",tt=R.toLowerCase(),$e=!!t.alreadyOffered,at=$e?"disabled":"",ot=$e?' title="You already have an offer on this request."':"",nt=$e?"ALREADY OFFERED":et;v+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${c(Qe)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${c(Ke)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${Ze};">${Je}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${tt}" onclick="rdSubmitOffer()" ${at}${ot}>${nt}</button>
        </div>
    </div>`,o.innerHTML=v}window.rdOpen=wt;window.rdClose=je;window.rdSetLoanRate=$t;window.rdSetLoanCollateral=Et;window.rdSetLoanTermsText=Nt;window.rdSetInsurePremium=At;window.rdSetInsureCoverage=Rt;window.rdSetInsureDeductible=Lt;window.rdSetBondAmount=Tt;let D=!1;async function It(){if(!x||!_||!q||D)return;if(x.alreadyOffered){alert("You already submitted an offer for this request.");return}D=!0;const o=q.current_tick||0,t=Number(_.corp_cash_reserves)||0;if(x.type==="LOAN"){const i=Q;if(i<1||i>20){alert("Interest rate must be 1-20%."),D=!1;return}const{data:a}=await y.from("corp_properties").select("id").eq("faction_id",_.id).eq("type","branch_office").eq("is_active",!0),l=a?.length||0,r=Math.min(100,50+l*15),b=Math.round(t*r/100),{data:p}=await y.from("finance_active_loans").select("principal").eq("lender_faction_id",_.id).in("status",["current","late","delinquent"]),u=(p||[]).reduce((w,E)=>w+Number(E.principal||0),0),e=Math.max(0,b-u);if(x.amount>e){alert(`Lending cap reached. You can deploy ${Math.round(r)}% of cash ($${(b/1e6).toFixed(1)}M).
Already deployed: $${(u/1e6).toFixed(1)}M
Available: $${(e/1e6).toFixed(1)}M
This loan: $${(x.amount/1e6).toFixed(1)}M`+(l===0?`

Build a Branch Office to increase your lending cap (+15% each).`:"")),D=!1;return}if(t<x.amount){alert("Insufficient cash reserves to fund this loan."),D=!1;return}const d={none:"unsecured",equipment:"equipment",property:"property",full:"property"}[I]||"unsecured",s={request_id:x.requestId,offering_faction_id:_.id,interest_rate:i,collateral_type:d,created_tick:o};fe.trim()&&(s.offer_terms=fe.trim());const{error:h}=await y.from("finance_loan_offers").insert(s);if(h){D=!1,h.message.includes("unique")||h.message.includes("duplicate")?alert("You have already submitted an offer for this loan request."):alert("Failed to submit offer: "+h.message);return}}else if(x.type==="BOND"){if(t<C){alert("Insufficient cash reserves. Need "+c(C)+", have "+c(t)+"."),D=!1;return}const{error:i}=await y.from("finance_loan_offers").insert({request_id:x.requestId,offering_faction_id:_.id,interest_rate:x.couponRate,collateral_type:"unsecured",status:"accepted",created_tick:o});if(i){alert("Failed to buy bonds: "+i.message),D=!1;return}const a=x.couponRate/100/12;x.term;const l=Math.round(C*a),{data:r,error:b}=await y.from("finance_loan_requests").select("requesting_faction_id").eq("id",x.requestId).single();if(b||!r?.requesting_faction_id){alert("Failed to create bond position: could not resolve issuer faction."),D=!1;return}const{error:p}=await y.from("finance_active_loans").insert({request_id:x.requestId,offer_id:null,borrower_faction_id:r.requesting_faction_id,lender_faction_id:_.id,nation_id:x.nation_id||_.nation_id,principal:C,interest_rate:x.couponRate,term_months:x.term,collateral_type:"unsecured",purpose:x.purpose,monthly_payment:l,started_tick:o});if(p){alert("Failed to create bond position: "+p.message),D=!1;return}await y.from("factions").update({corp_cash_reserves:Math.max(0,t-C)}).eq("id",_.id);const{data:u}=await y.from("nations").select("debt").eq("id",x.nation_id).single();if(u){const{error:e}=await y.from("nations").update({debt:Number(u.debt||0)+C}).eq("id",x.nation_id);e&&console.warn("[Bonds] Failed to update nation debt:",e.message)}_.corp_cash_reserves=Math.max(0,t-C)}else if(x.type==="INSURE"){const i=se,a=X,l=te,r=Math.round(a*(i/100)/12),{error:b}=await y.from("finance_loan_offers").insert({request_id:x.requestId,offering_faction_id:_.id,interest_rate:i,collateral_type:"unsecured",status:"accepted",created_tick:o});if(b){D=!1,b.message.includes("unique")||b.message.includes("duplicate")?alert("You have already submitted a policy offer for this request."):alert("Failed to write policy: "+b.message);return}const{data:p}=await y.from("finance_loan_requests").update({status:"funded",funded_tick:o}).eq("id",x.requestId).select("requesting_faction_id").single(),u={request_id:x.requestId,offer_id:null,borrower_faction_id:p?.requesting_faction_id||x.requestingFactionId,lender_faction_id:_.id,nation_id:_.nation_id,principal:a,interest_rate:i,term_months:0,collateral_type:"unsecured",purpose:x.isVesselInsurance?"Vessel Insurance — "+x.applicant:"Insurance Policy — "+x.applicant,monthly_payment:r,started_tick:o,deductible_pct:l,policy_terms:Ce.trim()||null};x.insuredVesselId&&(u.insured_vessel_id=x.insuredVesselId),x.insuredContractId&&(u.insured_contract_id=x.insuredContractId);const{error:e}=await y.from("finance_active_loans").insert(u);if(e){alert("Failed to create policy record: "+e.message),D=!1;return}}else{D=!1;return}je(),K=-1,await Ye(),D=!1}window.rdSubmitOffer=It;async function ae(){if(!_){j();return}const{data:o}=await y.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",_.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"},i=a=>a.finance_loan_requests?.request_type==="insurance";L=(o||[]).map(a=>({id:a.id,type:t[a.finance_loan_requests?.request_type]||"LOAN",counterparty:a.borrower?.faction_name||"Unknown",abbr:a.borrower?.abbreviation||a.borrower?.corp_ticker||"??",nation:a.loan_nation?.name||a.borrower?.nation||"Unknown",remaining:i(a)?0:a.principal-a.total_paid,principal:a.principal,earned:i(a)?(a.monthly_payment||0)*(a.payments_made||0):a.total_interest_paid||0,rate:a.interest_rate,term:a.term_months,paymentsMade:a.payments_made,paymentsMissed:a.payments_missed,monthlyPayment:a.monthly_payment,status:a.status.toUpperCase(),collateral:a.collateral_type,purpose:a.purpose||"",alert:a.status==="late"||a.status==="delinquent",alertLevel:a.status==="delinquent"?"red":a.status==="late"?"orange":null,alertMsg:a.status==="delinquent"?`${a.payments_missed} missed payments. Default imminent.`:a.status==="late"?`${a.payments_missed} missed payment${a.payments_missed>1?"s":""}. Monitor closely.`:null,coverage:i(a)?a.principal:void 0,premiumsCollected:i(a)?(a.monthly_payment||0)*(a.payments_made||0):void 0,paidOut:i(a)?a.claims_paid||0:void 0,claims:i(a)?a.claims_count||0:void 0,deductible:i(a)?a.deductible_pct||0:void 0})),j()}async function Ot(){if(!_){Ie();return}const{data:o}=await y.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",_.id).in("status",["repaid","defaulted"]).order("completed_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"};U=(o||[]).map(i=>{const a=i.total_interest_paid||0,l=i.status==="defaulted"?Math.max(0,i.principal-i.total_paid):0;return{type:t[i.finance_loan_requests?.request_type]||"LOAN",counterparty:i.borrower?.faction_name||"Unknown",abbr:i.borrower?.abbreviation||i.borrower?.corp_ticker||"??",nation:i.loan_nation?.name||i.borrower?.nation||"",outcome:i.status==="repaid"?"REPAID":"DEFAULTED",principal:i.principal,earned:a,lost:l,net:a-l,resolved:i.completed_tick?"Tick "+i.completed_tick:"",term:i.term_months+"mo",rate:i.interest_rate+"%",note:i.status==="repaid"?`Fully repaid over ${i.payments_made} payments.`:`Defaulted after ${i.payments_missed} missed payments. ${i.collateral_type!=="unsecured"?"Collateral ("+i.collateral_type+") partially recovered losses.":"Unsecured — no collateral recovery."}`}}),Ie()}function ke(o){const t=new URL("corp-operations.html",window.location.href);t.search=window.location.search;const i=t.searchParams;i.set("tab",o),t.search=i.toString()?`?${i.toString()}`:"",window.location.href=t.toString()}function Ct(o){o?.preventDefault&&o.preventDefault(),ke("expansion")}function kt(o){o?.preventDefault&&o.preventDefault(),ke("actions")}async function St(){const o=new URLSearchParams(window.location.search).get("tab"),t=o==="expansion"||o==="actions",i=t?o:"operations",{data:{user:a}}=await y.auth.getUser();if(!a){window.location.href="login.html";return}const{data:l}=await y.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);ee=(l||[]).filter(e=>e.nation_id);const r=sessionStorage.getItem("active_faction_id");if(_=ee.find(e=>e.id===r)||ee.find(e=>e.faction_type==="corporation")||ee[0],!_){await y.auth.signOut(),window.location.href="login.html";return}if(_.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(_.corp_sector!=="Finance"){const e={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html"};window.location.href=(e[_.corp_sector]||"corp-operations.html")+window.location.search;return}if(t){ke(o);return}sessionStorage.setItem("active_faction_id",_.id);const[b,p]=await Promise.all([_.nation_id?y.from("nations").select("*").eq("id",_.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);b.data&&b.data,q=p.data;const u=document.getElementById("corp-topbar-container");if(u){const{renderCorpTopBar:e}=await it(async()=>{const{renderCorpTopBar:n}=await import("./corp-topbar-BsVGcrAN.js");return{renderCorpTopBar:n}},__vite__mapDeps([0,1]));e(u,{faction:_,shard:q,activeTab:i,allUserFactions:ee})}if(Mt(),_.nation_id){const{data:e}=await y.from("active_laws").select("id, policy:policies!policy_id(policy_key)").eq("nation_id",_.nation_id).limit(100);Le=(e||[]).some(n=>n.policy?.policy_key?.startsWith("financial_sector_deregulation"))}if(await Ye(),await ae(),gt(),await Ot(),q?.next_tick_at){const e=(Number(q.tick_interval_hours)||8)*36e5,n=new Date(q.next_tick_at).getTime(),s=n-e+e/2,h=new Date(s>Date.now()?s:n+e/2);Ut(h)}}function Mt(){const o=document.getElementById("corp-faction-dropdown");if(!o||ee.length<=1)return;let t="";for(const i of ee){const a=i.id===_.id,l=i.faction_type==="corporation"?"CORP":"PARTY";t+=`<div class="corp-faction-dropdown__item${a?" active":""}" onclick="switchFaction('${i.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${i.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${i.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${i.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${l}</span>
            <span>${$(i.faction_name||"--")}</span>
        </div>`}o.innerHTML=t}function Dt(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function Pt(o){sessionStorage.setItem("active_faction_id",o);const t=ee.find(i=>i.id===o);t&&t.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}async function zt(){await y.auth.signOut(),window.location.href="login.html"}function Ut(o){const t=document.getElementById("tick-countdown");if(!t)return;function i(){const a=new Date(o)-new Date;if(a<=0){t.textContent="Processing...";return}const l=Math.floor(a/36e5),r=Math.floor(a%36e5/6e4),b=Math.floor(a%6e4/1e3);t.textContent=`${l}h ${r}m ${b}s`}i(),setInterval(i,1e3)}window.toggleCorpDropdown=Dt;window.switchFaction=Pt;window.doLogout=zt;window.switchToExpansion=Ct;window.switchToActions=kt;St();
