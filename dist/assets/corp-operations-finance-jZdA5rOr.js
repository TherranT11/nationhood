const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-5lTmaM1a.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as b}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as rt}from"./preload-helper-BXl3LOEh.js";import{e as $}from"./utils-CY90Gazr.js";let ne=[],_=null,H=null,Ee=!1,_e=0;function je(o,t,l,c){const d=t.filter(E=>E.type==="LOAN").reduce((E,R)=>E+(R.remaining||0),0),u=t.filter(E=>E.type==="INSURE").reduce((E,R)=>E+(R.coverage||0),0),a=t.filter(E=>E.type==="BOND").reduce((E,R)=>E+(R.faceValue||0),0),s=d+u+a,p=t.reduce((E,R)=>R.type==="LOAN"?E+(Number(R.remaining)||0):R.type==="INSURE"?E+(Number(R.coverage)||0):R.type==="BOND"?E+(Number(R.faceValue)||Number(R.principal)||0):E,0),e=c?.12:.15,n=Math.round(s*e),y=Math.max(0,o-n),w=o+p,f=Math.min(100,50+(l||0)*15),i=Math.round(w*f/100),N=Math.max(0,i-p),T=Math.min(y,N),C=N<y?"lending_cap":"reserve_ratio";return{cash:o,totalExposure:s,totalDeployed:p,loanExposure:d,insureExposure:u,bondExposure:a,reserveReqPct:e,requiredReserve:n,reserveAvail:y,lendingCapPct:f,lendingCap:i,capAvail:N,deployable:T,limiter:C}}function r(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+Math.round(o).toLocaleString()}const Me={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},lt={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}};let W=[],xe="ALL",le="all",J=-1;async function We(){if(!_||!H)return;const{data:o,error:t}=await b.from("finance_loan_requests").select("*, requesting_faction:factions!requesting_faction_id(id, faction_name, abbreviation, corp_ticker, corp_subsector, nation_id, corp_cash_reserves, corp_debt, corp_reputation), issuer_nation:nations!issuer_nation_id(id, name, stability, credit, debt, gdp, gdp_growth, corruption)").eq("status","open").order("created_tick",{ascending:!1});t&&console.error("[DealFlow] Request query error:",t.message);const l=[...new Set((o||[]).filter(e=>e.requesting_faction?.nation_id).map(e=>e.requesting_faction.nation_id))];let c={};if(l.length>0){const{data:e}=await b.from("nations").select("id, name, stability, credit, gdp, gdp_growth, corruption, debt").in("id",l);for(const n of e||[])c[n.id]=n}const{data:d}=await b.from("finance_loan_offers").select("request_id").eq("offering_faction_id",_.id),u=new Set((d||[]).map(e=>e.request_id)),a=[...new Set((o||[]).filter(e=>e.requesting_faction?.id).map(e=>e.requesting_faction.id))];let s={};if(a.length>0){const{data:e}=await b.from("finance_active_loans").select("borrower_faction_id, remaining_principal").in("borrower_faction_id",a).in("status",["current","late","delinquent"]);for(const y of e||[]){s[y.borrower_faction_id]||(s[y.borrower_faction_id]={count:0,totalOutstanding:0}),s[y.borrower_faction_id].count++;const w=Math.max(0,Number(y.remaining_principal||0));s[y.borrower_faction_id].totalOutstanding+=w}const{data:n}=await b.from("subsidiary_auto_policies").select("borrower_faction_id, principal, remaining_principal").in("borrower_faction_id",a).eq("service_type","loan").eq("status","active");for(const y of n||[])s[y.borrower_faction_id]||(s[y.borrower_faction_id]={count:0,totalOutstanding:0}),s[y.borrower_faction_id].count++,s[y.borrower_faction_id].totalOutstanding+=Number(y.remaining_principal||y.principal||0)}const p=(_.corp_subsector||"").toLowerCase();W=(o||[]).filter(e=>e.request_type==="bond"?p==="investment":e.request_type==="insurance"?p==="insurance":p==="banking").map(e=>{if(e.request_type==="bond"){const n=e.issuer_nation,y=Number(n?.stability??50),w=Number(n?.credit??50),f=Number(n?.gdp??1),i=Number(n?.debt??0),N=f>0?Math.round(i/f*100):0;return{id:e.id,type:"BOND",applicant:n?.name||"Unknown Nation",abbr:(n?.name||"??").slice(0,3).toUpperCase(),entity:"GOV",nation:n?.name||"N/A",nation_id:e.issuer_nation_id,amount:e.amount||0,term:e.term_months,couponRate:Number(e.coupon_rate||5),purpose:e.purpose||"Government Bond",stability:y,creditRating:w,debtToGdp:N,gdpGrowth:Number(n?.gdp_growth??50),corruption:Number(n?.corruption??50),risk:y>=60&&w>=50?"LOW":y>=35&&w>=30?"MODERATE":"HIGH",isNew:!u.has(e.id),ticksLeft:(e.expires_tick||0)-(H?.current_tick||0),requestId:e.id,alreadyOffered:u.has(e.id)}}if(e.request_type==="insurance"){const n=Number(e.requesting_faction?.corp_reputation??50),y=Number(c[e.requesting_faction?.nation_id]?.stability??50);return{id:e.id,type:"INSURE",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:c[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,amount:e.amount||0,term:e.term_months||0,purpose:e.purpose||"Construction Insurance",reputation:n,projectValue:e.amount||0,stability:y,risk:n>=60&&y>=50?"LOW":n>=35?"MODERATE":"HIGH",isNew:!u.has(e.id),ticksLeft:(e.expires_tick||0)-(H?.current_tick||0),requestId:e.id,insuredContractId:e.insured_contract_id,insuredVesselId:e.insured_vessel_id,isVesselInsurance:!!e.insured_vessel_id,alreadyOffered:u.has(e.id),requestingFactionId:e.requesting_faction?.id}}return{id:e.id,type:"LOAN",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:c[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,requestingFactionId:e.requesting_faction?.id,amount:e.amount,term:e.term_months,purpose:e.purpose||"",reputation:Number(e.requesting_faction?.corp_reputation??50),revenue:Number(e.requesting_faction?.corp_cash_reserves??0),corp_cash_reserves:Number(e.requesting_faction?.corp_cash_reserves??0),corp_debt:Number(e.requesting_faction?.corp_debt??0),activeLoans:(s[e.requesting_faction?.id]||{}).count||0,totalOutstanding:(s[e.requesting_faction?.id]||{}).totalOutstanding||0,creditRating:Number(c[e.requesting_faction?.nation_id]?.credit??50),stability:Number(c[e.requesting_faction?.nation_id]?.stability??50),risk:(()=>{const n=Number(c[e.requesting_faction?.nation_id]?.credit??50),y=Number(e.requesting_faction?.corp_reputation??50);return n>=60&&y>=60?"LOW":n>=35&&y>=35?"MODERATE":n>=20||y>=20?"ELEVATED":"HIGH"})(),isNew:!u.has(e.id),ticksLeft:(e.expires_tick||0)-(H?.current_tick||0),collateral:e.collateral_type||"unsecured",requestId:e.id,alreadyOffered:u.has(e.id)}}),Ne()}function Ve(o){if(!_)return!1;const t=(_.corp_subsector||"").toLowerCase(),l=Et[t];return o.type===l}function ct(o){xe=o,J=-1,Ne()}function dt(o){J=J===o?-1:o,Ne()}function Ne(){const o=document.getElementById("df-container");if(!o)return;let t=xe==="ALL"?W:W.filter(e=>e.type===xe);le==="mine"&&_?.nation_id&&(t=t.filter(e=>e.nation_id===_.nation_id));const l=W.filter(e=>e.isNew).length,c=W.length;let d=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
            ${l>0?`<span class="df-badge df-badge-corp">${l} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:12px;color:#6a6660;">${c} OPEN</span>
        </div>
    </div>`;const u=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];d+='<div class="df-filters">';for(const e of u)d+=`<span class="df-pill${xe===e.id?" "+e.activeClass:""}" onclick="dfSetFilter('${e.id}')">${e.label}</span>`;d+=`<span style="margin-left:auto;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.5px;cursor:pointer;padding:6px 10px;border:1px solid ${le==="mine"?"#5c544":"var(--panel-border)"};color:${le==="mine"?"#5c5":"#6a6660"};background:${le==="mine"?"rgba(92,204,92,0.06)":"transparent"};" onclick="dfToggleNation()">${le==="mine"?"MY NATION":"ALL NATIONS"}</span>`,d+="</div>",d+='<div class="df-list">',t.length===0&&(d+='<div class="ap-empty">No deals available.<br>Deals appear when corporations request financing or governments issue bonds.</div>');for(let e=0;e<t.length;e++){const n=t[e],y=W.indexOf(n),w=J===y,f=Me[n.type],i=lt[n.risk],N=Ve(n);d+=`<div class="df-deal${w?" sel-"+f.class:""}" onclick="dfSelectDeal(${y})" style="${N?"":"opacity:0.5;"}">`,n.isNew&&N&&(d+='<div class="df-new-dot"></div>'),d+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <span class="df-badge df-badge-${f.class}">${f.label}</span>
            <span style="font-size:15px;font-weight:600;color:var(--panel-text);">${$(n.applicant)}</span>
            <span class="df-badge df-badge-${n.entity.toLowerCase()}">${n.entity}</span>
            ${N?"":'<span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`;const T=i.class==="df-risk-low"?"#5c5":i.class==="df-risk-moderate"?"#ca5":i.class==="df-risk-elevated"?"#c84":"#c55";d+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span class="df-badge df-badge-nation">${$(n.nation.toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:2px 7px;line-height:16px;color:${T};background:${T}12;border:1px solid ${T}25;">${i.label}</span>
        </div>`;const C=n.type==="BOND"?"FACE VALUE":n.type==="INSURE"?"COVERAGE":"AMOUNT",E=n.type==="BOND"?"COUPON":"REP",R=n.type==="BOND"?n.couponRate+"%":n.reputation||n.stability,Y=n.type==="BOND"?n.couponRate*10:n.reputation||n.stability,I=n.type==="BOND"?"#c8a832":Y>=60?"#5c5":Y>=35?"#ca5":"#c84";if(d+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${C}</div>
                <div class="df-metrics__value" style="font-size:15px;color:var(--panel-text);">${r(n.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:14px;color:var(--panel-text);">${n.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${E}</div>
                <div class="df-metrics__value" style="font-size:14px;color:${I};">${R}</div>
            </div>
        </div>`,w){if(d+=`<div style="margin-top:8px;font-size:13px;color:#9e9a92;line-height:1.5;margin-bottom:8px;">${$(n.purpose)}</div>`,N)d+='<div class="df-detail">';else{const k=n.type==="LOAN"?"Banking":n.type==="INSURE"?"Insurance":"Investment";d+=`<div style="padding:8px 10px;background:rgba(106,102,96,0.06);border:1px solid var(--panel-border);font-family:var(--font-mono);font-size:11px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:var(--panel-text);font-weight:700;">${k}</span> subsector to underwrite.
                    ${_?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+$(_.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(N){if(n.type==="LOAN"){const k=n.corp_cash_reserves>0?Math.round(n.corp_debt/n.corp_cash_reserves*100):0,D=k>50?"#c84":"#5c5",M=n.corp_debt>n.corp_cash_reserves*.5?"#c84":"#9e9a92";d+=`<div class="df-detail-row"><span class="df-detail-label">CASH</span><span class="df-detail-value" style="color:#9e9a92;">${r(n.corp_cash_reserves)}</span></div>`,d+=`<div class="df-detail-row"><span class="df-detail-label">DEBT</span><span class="df-detail-value" style="color:${M};">${r(n.corp_debt)}</span></div>`,d+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/CASH</span><span class="df-detail-value" style="color:${D};font-weight:700;">${k}%</span></div>`}else if(n.type==="BOND"){const k=n.stability>=50?"#5c5":n.stability>=30?"#ca5":"#c84",D=n.debtToGdp>60?"#c55":n.debtToGdp>40?"#c84":"#5c5",M=n.creditRating>=60?"#5c5":n.creditRating>=35?"#ca5":"#c55";d+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${k};">${n.stability}/100</span></div>`,d+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${D};">${n.debtToGdp}%</span></div>`,d+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${M};font-weight:700;">${n.creditRating}/100</span></div>`}else if(n.type==="INSURE"){const k=n.reputation>=60?"#5c5":n.reputation>=35?"#ca5":"#c84",D=n.projectValue?"PROJECT VALUE":"FLEET VALUE",M=n.projectValue||n.fleetValue;d+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${k};">${n.reputation}/100</span></div>`,d+=`<div class="df-detail-row"><span class="df-detail-label">${D}</span><span class="df-detail-value" style="color:#9e9a92;">${r(M)}</span></div>`}d+="</div>"}}d+="</div>"}d+="</div>";const a=W.filter(e=>e.type==="LOAN").length,s=W.filter(e=>e.type==="INSURE").length,p=W.filter(e=>e.type==="BOND").length;d+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${a}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${s}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${p}</span></div>
        </div>
        ${(()=>{const e=J>=0?W[J]:null,n=e&&Ve(e);return n?`<div class="df-review-btn active" onclick="rdOpen(${J})">REVIEW DEAL</div>`:e&&!n?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,o.innerHTML=d}function pt(){le=le==="all"?"mine":"all",J=-1,Ne()}window.dfSetFilter=ct;window.dfToggleNation=pt;window.dfSelectDeal=dt;const He={CURRENT:{color:"#5c5",label:"CURRENT"},LATE:{color:"#c84",label:"LATE"},DELINQUENT:{color:"#c55",label:"DELINQUENT"},CLAIM:{color:"#c55",label:"CLAIM FILED"},ACTIVE:{color:"#5c5",label:"ACTIVE"},WATCHLIST:{color:"#ca5",label:"WATCHLIST"},DEFAULT:{color:"#c55",label:"DEFAULT"}};let A=[],he="ALL",$e=-1;function ft(o){he=o,$e=-1,X()}function vt(o){$e=$e===o?-1:o,X()}function X(){const o=document.getElementById("ap-container");if(!o)return;const t=he==="ALL"?A:A.filter(f=>f.type===he),l=A.reduce((f,i)=>f+(i.remaining||i.coverage||i.faceValue||0),0),c=A.reduce((f,i)=>f+(i.earned||i.premiumsCollected||i.couponsReceived||0),0),d=A.filter(f=>f.type==="LOAN").reduce((f,i)=>f+(i.cashCollected||0),0),u=A.filter(f=>f.type==="LOAN").reduce((f,i)=>f+(i.interestRevenue||0),0),a=A.filter(f=>f.alert).length;let s=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Active Portfolio</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${a>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:#c55;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);">${a} ALERT${a>1?"S":""}</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${A.length} ACTIVE</span>
        </div>
    </div>`;s+=`<div class="ap-summary">
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EXPOSURE</div>
            <div class="ap-summary__value" style="font-size:14px;color:#c55;">${r(l)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EARNED</div>
            <div class="ap-summary__value" style="font-size:14px;color:#5c5;">${r(c)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:0.6;">
            <div class="ap-summary__label">DEALS</div>
            <div style="display:flex;gap:4px;margin-top:3px;">
                ${["LOAN","INSURE","BOND"].map(f=>{const i=A.filter(T=>T.type===f).length;return`<div style="display:flex;align-items:center;gap:2px;"><div style="width:4px;height:4px;background:${f==="LOAN"?"#5a8aaa":f==="INSURE"?"#aa7a5a":"#8a6aaa"};border-radius:1px;"></div><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#9e9a92;">${i}</span></div>`}).join("")}
            </div>
        </div>
    </div>`,s+=`<div class="ap-summary" style="margin-top:-1px;border-top:none;">
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label" title="Total loan cash collected across active loans. Loan cash collected = interest portion + principal portion.">LOAN CASH COLLECTED (INTEREST + PRINCIPAL)</div>
            <div class="ap-summary__value" style="font-size:12px;color:var(--panel-text);">${r(d)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label" title="Interest portion of loan payments recognized as operating revenue. Principal repayment increases cash but is not profit.">LOAN INTEREST REVENUE (P&L)</div>
            <div class="ap-summary__value" style="font-size:12px;color:#5c5;">${r(u)}</div>
        </div>
    </div>`,s+='<div class="df-filters">';for(const f of[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Policies",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}])s+=`<span class="df-pill${he===f.id?" "+f.activeClass:""}" onclick="apSetFilter('${f.id}')">${f.label}</span>`;s+="</div>",s+='<div class="ap-list">',t.length===0&&(s+='<div class="ap-empty">No active positions.<br>Review deals from the Deal Flow to build your portfolio.</div>');for(let f=0;f<t.length;f++){const i=t[f],N=A.indexOf(i),T=$e===N,C=Me[i.type],E=He[i.status]||He.CURRENT,R=!!i.alert,Y=i.paymentsMade||0,I=i.term||1,k=Math.round(Y/I*100),D=R?E.color==="#c55"?"alert-red":E.color==="#c84"?"alert-orange":"alert-yellow":"";s+=`<div class="ap-deal ${D}" onclick="apToggle(${N})">
            <div class="ap-deal__inner" style="${T?"background:"+(C.class==="loan"?"rgba(90,138,170,0.08)":C.class==="insure"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,s+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${C.class}">${C.label}</span>
            <span style="font-size:11px;font-weight:600;color:var(--panel-text);flex:1;">${$(i.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${E.color};background:${E.color}12;border:1px solid ${E.color}25;">${E.label}</span>
        </div>`,s+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${$((i.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${Y}/${I}mo — ${k}%</span>
        </div>`;const M=R?E.color:C.class==="loan"?"#5a8aaa":C.class==="insure"?"#aa7a5a":"#8a6aaa";s+=`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(k,100)}%;background:${M};"></div></div>`;const ee=i.type==="LOAN"?"REMAINING":i.type==="INSURE"?"COVERAGE":"FACE VALUE",se=i.remaining||i.coverage||i.faceValue||0,g=i.type==="LOAN"?"RATE":i.type==="INSURE"?"PREMIUM":"COUPON",ue=i.rate||i.premiumRate||i.coupon||0,S=i.earned||i.premiumsCollected||i.couponsReceived||0,F=i.type==="LOAN"?"INTEREST REVENUE (P&L)":i.type==="INSURE"?"PREMIUMS EARNED":"COUPONS EARNED",pe=i.type==="LOAN"?"Loan monthly cash = interest + principal. This metric tracks interest revenue only; principal is asset repayment.":"",te=C.class==="loan"?"#5a8aaa":C.class==="insure"?"#aa7a5a":"#8a6aaa";if(s+=`<div class="df-metrics" style="margin-top:4px;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${ee}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);margin-top:1px;">${r(se)}</div>
            </div>
            <div style="flex:0.8;padding:3px 6px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${g}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${te};margin-top:1px;">${ue}%</div>
            </div>
            <div style="flex:1;padding:3px 6px;text-align:right;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;" title="${pe}">${F}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5c5;margin-top:1px;">${r(S)}</div>
            </div>
        </div>`,R&&(s+=`<div class="ap-deal__alert" style="background:${E.color}08;border:1px solid ${E.color}20;color:${E.color};">${$(i.alert)}</div>`),T){if(s+='<div class="ap-deal__expanded">',i.type==="LOAN"){const v=[{label:"PRINCIPAL",value:r(i.principal||0)},{label:"REMAINING",value:r(i.remaining||0),color:"var(--panel-text)"},{label:"MONTHLY INTEREST PORTION (P&L REVENUE)",value:r(i.monthlyInterestPortion||0),color:"#5c5",title:"Recognized operating revenue from this month's loan payment."},{label:"MONTHLY PRINCIPAL PORTION (ASSET REPAYMENT)",value:r(i.monthlyPrincipalPortion||0),title:"Principal repayment increases cash and reduces receivable; it is not profit."},{label:"TOTAL MONTHLY PAYMENT (CASH COLLECTED)",value:r(i.monthlyPayment||0),title:"Loan cash collected each month = interest portion + principal portion."},{label:"INTEREST REVENUE TO DATE (P&L)",value:r(i.interestRevenue||0),color:"#5c5",title:"Cumulative operating revenue recognized from interest."},{label:"PRINCIPAL REPAID TO DATE (ASSET REPAYMENT)",value:r(i.principalRepaid||0),title:"Cumulative principal repaid. Cash inflow, not revenue."},{label:"LOAN CASH COLLECTED TO DATE (INTEREST + PRINCIPAL)",value:r(i.cashCollected||0),title:"Cumulative loan cash collected = interest + principal."},{label:"MISSED PAYMENTS",value:String(i.missedPayments||0),color:(i.missedPayments||0)>0?"#c55":"#5c5"},{label:"NEXT DUE",value:i.nextPayment||"—",color:i.status==="LATE"?"#c55":"#9e9a92"}];for(const x of v)s+=`<div class="ap-detail-row"><span class="ap-detail-label" title="${x.title||""}">${x.label}</span><span class="ap-detail-value" style="color:${x.color||"#9e9a92"};">${x.value}</span></div>`;i.status!=="CURRENT"&&(s+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apRestructure('${i.id}')">RESTRUCTURE</div><div class="ap-action-btn orange" onclick="apCallLoan('${i.id}')">CALL LOAN</div><div class="ap-action-btn red" onclick="apForeclose('${i.id}')">FORECLOSE</div></div>`)}else if(i.type==="INSURE"){const v=[{label:"COVERAGE",value:r(i.coverage||0)},{label:"PREMIUMS COLLECTED",value:r(i.premiumsCollected||0),color:"#5c5"},{label:"CLAIMS FILED",value:String(i.claims||0),color:(i.claims||0)>0?"#c84":"#5c5"},{label:"PAID OUT",value:r(i.paidOut||0),color:(i.paidOut||0)>0?"#c55":"#6a6660"}];for(const x of v)s+=`<div class="ap-detail-row"><span class="ap-detail-label">${x.label}</span><span class="ap-detail-value" style="color:${x.color||"#9e9a92"};">${x.value}</span></div>`;i.status==="CLAIM"&&i.claimAmount&&(s+=`<div class="ap-claim-box"><div style="font-family:var(--font-mono);font-size:7px;color:#c55;letter-spacing:0.8px;margin-bottom:2px;">PENDING CLAIM</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${r(i.claimAmount)}</div></div>`,s+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apPayClaim('${i.id}')">PAY IN FULL</div><div class="ap-action-btn orange" onclick="apNegotiateClaim('${i.id}')">NEGOTIATE</div><div class="ap-action-btn red" onclick="apDisputeClaim('${i.id}')">DISPUTE</div></div>`)}else if(i.type==="BOND"){const v=[{label:"FACE VALUE",value:r(i.faceValue||0)},{label:"COUPONS RECEIVED",value:r(i.couponsReceived||0),color:"#5c5"},{label:"NEXT COUPON",value:i.nextCoupon||"—"},{label:"ANNUAL YIELD",value:r(Math.round((i.faceValue||0)*(i.coupon||0)/100)),color:"#8a6aaa"}];for(const x of v)s+=`<div class="ap-detail-row"><span class="ap-detail-label">${x.label}</span><span class="ap-detail-value" style="color:${x.color||"#9e9a92"};">${x.value}</span></div>`;s+=`<div class="ap-actions"><div class="ap-action-btn purple" onclick="apSellPosition('${i.id}')">SELL POSITION</div><div class="ap-action-btn olive">HOLD</div></div>`}s+="</div>"}s+="</div></div>"}s+="</div>";const p=A.reduce((f,i)=>f+(i.principal||i.coverage||i.faceValue||0),0),e=p>0?Math.round(c/p*1e4)/100:0,n=A.length>0?Math.round(A.reduce((f,i)=>f+(i.rate||0),0)/A.length*10)/10:0,y=A.filter(f=>f.status==="LATE"||f.status==="DELINQUENT").length,w=A.length>0?Math.round(y/A.length*100):0;s+=`<div class="df-footer" style="flex-direction:column;gap:6px;">
        <div style="display:flex;gap:8px;justify-content:space-between;width:100%;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EXPOSURE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${r(l)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EARNED</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;">${r(c)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">ROI</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${e>=0?"#5c5":"#c55"};">${e}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">AVG RATE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#ca5;">${n}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">RISK</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${w>20?"#c55":w>0?"#ca5":"#5c5"};">${w}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            ${["LOAN","INSURE","BOND"].map(f=>{const i=f==="LOAN"?"#5a8aaa":f==="INSURE"?"#aa7a5a":"#8a6aaa",N=A.filter(T=>T.type===f).length;return`<div style="text-align:center;padding:1px 6px;border:1px solid ${N>0?i+"33":"var(--panel-border)"};background:${N>0?i+"0a":"transparent"};"><div style="font-family:var(--font-mono);font-size:6px;color:${i};">${f}</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${N>0?"var(--panel-text)":"#6a6660"};">${N}</div></div>`}).join("")}
        </div>
    </div>`,o.innerHTML=s}window.apSetFilter=ft;window.apToggle=vt;async function ut(o){const t=prompt(`RESTRUCTURE LOAN

Enter new annual interest rate (1-20%):
(This extends the term by 12 months and resets missed payments.)`);if(!t)return;const l=parseFloat(t);if(isNaN(l)||l<1||l>20){alert("Rate must be between 1% and 20%.");return}const{data:c}=await b.from("finance_active_loans").select("*").eq("id",o).single();if(!c){alert("Loan not found.");return}const d=c.term_months+12,u=l/100/12,a=Number(c.remaining_principal||0)+Number(c.total_interest_paid||0),s=u>0?Math.round(a*(u*Math.pow(1+u,d))/(Math.pow(1+u,d)-1)):Math.round(a/d);if(!confirm(`Restructure to ${l}% over ${d} months?
New monthly payment: ${r(s)}
Missed payments reset to 0.`))return;const{error:p}=await b.from("finance_active_loans").update({interest_rate:l,term_months:d,monthly_payment:s,payments_missed:0,status:"current"}).eq("id",o);if(p){alert("Failed: "+p.message);return}alert("Loan restructured."),await Z(),X()}async function mt(o){if(!confirm(`CALL LOAN

Demand immediate full repayment of remaining principal.
The borrower will have 3 ticks to pay or default.

Proceed?`))return;const{error:t}=await b.from("finance_active_loans").update({status:"delinquent",payments_missed:3}).eq("id",o);if(t){alert("Failed: "+t.message);return}alert("Loan called. Borrower has 1 tick to pay before default."),await Z(),X()}async function _t(o){if(!confirm(`FORECLOSE

Immediately default the loan and seize collateral.
Collateral recovery: Equipment 60%, Property 75%, Unsecured 0%.

This cannot be undone. Proceed?`))return;const{data:t}=await b.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Loan not found.");return}const l=Math.max(0,Number(t.remaining_principal||0));let c=0;t.collateral_type==="equipment"?c=.6:t.collateral_type==="property"&&(c=.75);const d=Math.round(l*c);if(d>0){const{data:u}=await b.from("factions").select("corp_cash_reserves").eq("id",_.id).single();await b.from("factions").update({corp_cash_reserves:Number(u?.corp_cash_reserves||0)+d}).eq("id",_.id),_.corp_cash_reserves=Number(u?.corp_cash_reserves||0)+d}await b.from("finance_active_loans").update({status:"defaulted",completed_tick:H?.current_tick||0}).eq("id",o),alert("Foreclosed. Recovered: "+r(d)+" from "+(t.collateral_type||"unsecured")+" collateral."),await Z(),X()}async function yt(o){const{data:t}=await b.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Policy not found.");return}const l=Number(t.principal||0)-Number(t.claims_paid||0),c=Number(t.deductible_pct||0)/100,d=Math.round(l*(1-c));if(!confirm(`PAY CLAIM IN FULL

Claim: ${r(l)}
Deductible: ${t.deductible_pct}%
Payout: ${r(d)}

This will be deducted from your cash reserves.`))return;const{data:u}=await b.from("factions").select("corp_cash_reserves").eq("id",_.id).single(),a=Number(u?.corp_cash_reserves||0);if(a<d){alert("Insufficient funds. You have "+r(a)+".");return}await b.from("factions").update({corp_cash_reserves:a-d}).eq("id",_.id),_.corp_cash_reserves=a-d;const{data:s}=await b.from("factions").select("corp_cash_reserves").eq("id",t.borrower_faction_id).single();s&&await b.from("factions").update({corp_cash_reserves:Number(s.corp_cash_reserves||0)+d}).eq("id",t.borrower_faction_id),await b.from("finance_active_loans").update({claims_paid:Number(t.claims_paid||0)+d,claims_count:(t.claims_count||0)+1}).eq("id",o),alert("Claim paid: "+r(d)),await Z(),X()}async function bt(o){const t=prompt(`NEGOTIATE CLAIM

Offer a percentage of the claim to settle (10-90%):
(Policyholder may reject low offers.)`);if(!t)return;const l=parseInt(t);if(isNaN(l)||l<10||l>90){alert("Must be between 10% and 90%.");return}const c=l/100;if(!(Math.random()<c)){alert("Offer rejected. The policyholder wants a higher settlement.");return}const{data:u}=await b.from("finance_active_loans").select("*").eq("id",o).single();if(!u)return;const a=Number(u.principal||0)-Number(u.claims_paid||0),s=Math.round(a*l/100),{data:p}=await b.from("factions").select("corp_cash_reserves").eq("id",_.id).single(),e=Number(p?.corp_cash_reserves||0);if(e<s){alert("Insufficient funds.");return}await b.from("factions").update({corp_cash_reserves:e-s}).eq("id",_.id),_.corp_cash_reserves=e-s;const{data:n}=await b.from("factions").select("corp_cash_reserves").eq("id",u.borrower_faction_id).single();n&&await b.from("factions").update({corp_cash_reserves:Number(n.corp_cash_reserves||0)+s}).eq("id",u.borrower_faction_id),await b.from("finance_active_loans").update({claims_paid:Number(u.claims_paid||0)+s,claims_count:(u.claims_count||0)+1,status:"repaid"}).eq("id",o),alert("Claim settled at "+l+"% ("+r(s)+"). Policy closed."),await Z(),X()}async function gt(o){if(!confirm(`DISPUTE CLAIM

Challenge the validity of this claim.
This freezes the claim for 4 ticks while investigated.
If investigation finds the claim valid, you pay in full + 10% penalty.
If investigation finds fraud, claim is dismissed.

Dispute?`))return;Math.random()<.7?alert(`Investigation complete: claim is VALID.
You must now pay the full claim.`):(await b.from("finance_active_loans").update({status:"repaid",claims_count:0}).eq("id",o),alert(`Investigation complete: FRAUDULENT CLAIM detected.
Claim dismissed. Policy remains active.`)),await Z(),X()}async function xt(o){const{data:t}=await b.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Position not found.");return}const l=Number(t.principal||0)-Number(t.total_paid||0),c=Math.round(l*.85);if(!confirm(`SELL POSITION

Remaining value: ${r(l)}
Market price (85%): ${r(c)}

You receive ${r(c)} immediately.
The position is removed from your portfolio.`))return;const{data:d}=await b.from("factions").select("corp_cash_reserves").eq("id",_.id).single();await b.from("factions").update({corp_cash_reserves:Number(d?.corp_cash_reserves||0)+c}).eq("id",_.id),_.corp_cash_reserves=Number(d?.corp_cash_reserves||0)+c,await b.from("finance_active_loans").update({status:"repaid",completed_tick:H?.current_tick||0}).eq("id",o),alert("Position sold for "+r(c)+"."),await Z(),X()}window.apRestructure=ut;window.apCallLoan=mt;window.apForeclose=_t;window.apPayClaim=yt;window.apNegotiateClaim=bt;window.apDisputeClaim=gt;window.apSellPosition=xt;function Ye(o,t){const l=o.reduce((c,d)=>c+d.value,0);return l===0?`<div class="rr-seg-bar" style="height:${t}px;background:var(--panel-border);"></div>`:`<div class="rr-seg-bar" style="height:${t}px;">${o.map(c=>`<div style="width:${(c.value/l*100).toFixed(1)}%;height:100%;background:${c.color};"></div>`).join("")}</div>`}function ht(){const o=document.getElementById("rr-container");if(!o)return;const t=Number(_?.corp_cash_reserves)||0,l=je(t,A,_e,Ee),{totalExposure:c,requiredReserve:d,reserveReqPct:u,loanExposure:a,insureExposure:s,bondExposure:p,lendingCapPct:e,lendingCap:n,totalDeployed:y,deployable:w,limiter:f}=l;A.length>0&&c===0&&console.warn("[RR] Portfolio has entries but totalExposure=0. Sample:",A.slice(0,3).map(v=>({type:v.type,remaining:v.remaining,principal:v.principal})));const i=c,N=t+i,T=c>0?Math.round(t/c*100):100,C=Math.round(u*100),E=T>=30?"HEALTHY":T>=20?"ADEQUATE":T>=C?"THIN":"CRITICAL",R=T>=30?"#5c5":T>=20?"#ca5":T>=C?"#c84":"#c55",Y={};for(const v of A){const x=v.nation||"Unknown",P=v.remaining||v.coverage||v.faceValue||0;Y[x]=(Y[x]||0)+P}const I=Object.entries(Y).map(([v,x])=>({name:v,exposure:x,pct:c>0?Math.round(x/c*100):0})).sort((v,x)=>x.exposure-v.exposure),k={};for(const v of A){const x=v.type==="BOND"?"Government":v.sector||"Other",P=v.remaining||v.coverage||v.faceValue||0;k[x]=(k[x]||0)+P}const D=Object.entries(k).map(([v,x])=>({name:v,exposure:x,pct:c>0?Math.round(x/c*100):0})).sort((v,x)=>x.exposure-v.exposure),M=I.length>0?I[0].pct:0,ee=M>60?"HIGH":M>40?"MODERATE":"LOW",se=ee==="HIGH"?"#c55":ee==="MODERATE"?"#ca5":"#5c5";let g=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Reserves & Risk</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${R};background:${R}12;border:1px solid ${R}25;">${E}</span>
    </div>`;g+='<div style="flex:1;overflow-y:auto;">',Ee&&(g+=`<div style="padding:5px 14px;background:rgba(200,168,50,0.06);border-bottom:1px solid rgba(200,168,50,0.15);display:flex;align-items:center;gap:6px;">
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:#c8a832;background:rgba(200,168,50,0.12);border:1px solid rgba(200,168,50,0.25);">POLICY</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#c8a832;">Financial Sector Deregulation Act</span>
            <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">Reserve req: ${C}% &middot; Interest: +10%</span>
        </div>`),g+='<div class="rr-section-bar">Capital Position</div>',g+='<div class="rr-section">',g+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">TOTAL CAPITAL</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${r(N)}</span>
    </div>`,g+=Ye([{value:t,color:"#5c5"},{value:i,color:"#8b9a6b"}],6),g+=`<div class="rr-seg-legend">
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#5c5;"></div>Cash ${r(t)}</div>
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#8b9a6b;"></div>Deployed ${r(i)}</div>
    </div>`,g+="</div>",g+='<div class="rr-section">',g+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">RESERVE RATIO</span>
        <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${R};">${T}%</span>
    </div>`,g+=`<div class="rd-bar" style="height:5px;"><div class="rd-bar__fill" style="width:${Math.min(T/60*100,100)}%;background:${R};"></div></div>`,g+=`<div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:3px;">
        <span style="color:#c55;">${C}% minimum</span><span>30% healthy</span><span style="color:#5c5;">60%+</span>
    </div>`,g+=`<div class="rr-reserve-cells">
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REQUIRED (${C}%)</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;margin-top:1px;">${r(d)}</div></div>
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">LENDING CAP (${e}%)</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);margin-top:1px;">${r(n)}</div></div>
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">AVAILABLE TO DEPLOY</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${w>0?"#5c5":"#c55"};margin-top:1px;">${r(w)}</div></div>
    </div>`;{const v=f==="lending_cap"?`Capped at ${e}% of total capital (branch offices: ${_e}). Deployed ${r(y)} of ${r(n)}.`:`Reserve requirement binds (${C}% of exposure).`;g+=`<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:6px;letter-spacing:0.02em;">${v}</div>`}if(g+="</div>",g+='<div class="rr-section-bar">Exposure by Type</div>',g+='<div class="rr-section">',c>0){g+=Ye([{value:a,color:"#5a8aaa"},{value:s,color:"#aa7a5a"},{value:p,color:"#8a6aaa"}],6),g+='<div style="margin-top:6px;">';const v=[{label:"Loans",value:a,color:"#5a8aaa",pct:c>0?Math.round(a/c*100):0},{label:"Insurance",value:s,color:"#aa7a5a",pct:c>0?Math.round(s/c*100):0},{label:"Bonds",value:p,color:"#8a6aaa",pct:c>0?Math.round(p/c*100):0}];for(let x=0;x<v.length;x++){const P=v[x];g+=`<div class="rr-type-row">
                <div style="width:6px;height:6px;background:${P.color};margin-right:6px;"></div>
                <span style="flex:1;font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${P.label}</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${r(P.value)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;width:28px;text-align:right;">${P.pct}%</span>
            </div>`}g+="</div>"}else g+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No exposure</div>';if(g+="</div>",g+=`<div class="rr-section-bar" style="display:flex;justify-content:space-between;align-items:center;">
        <span>Concentration Risk</span>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${se};background:${se}12;border:1px solid ${se}25;">${ee}</span>
    </div>`,g+='<div class="rr-section">',I.length>0){g+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">BY NATION</div>';for(const v of I){const x=v.pct>50?"#c84":v.pct>30?"#ca5":"#5c5";g+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;width:52px;text-align:center;">${$(v.name.toUpperCase().slice(0,6))}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${v.pct}%;background:${x};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${r(v.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${v.pct>50?"#c84":"#9e9a92"};">${v.pct}%</span>
            </div>`}}if(D.length>0){g+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-top:8px;margin-bottom:4px;">BY SECTOR</div>';for(const v of D){const x=v.pct>50?"#c84":v.pct>30?"#ca5":"#5c5";g+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:52px;">${$(v.name)}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${v.pct}%;background:${x};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${r(v.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${v.pct>50?"#c84":"#9e9a92"};">${v.pct}%</span>
            </div>`}}if(I.length===0&&D.length===0&&(g+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No positions to analyze</div>'),g+="</div>",g+='<div class="rr-section-bar">Actions</div>',g+='<div class="rr-section">',g+=`<div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Max single-deal size (${C}% reserve)</span>
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">${r(w)}</span>
    </div>`,M>50&&I.length>1){const v=I[0],x=Math.round(100/I.length),P=Math.round(c*x/100),be=v.exposure-P;g+=`<div style="padding:6px 8px;background:rgba(200,136,68,0.06);border:1px solid rgba(200,136,68,0.15);margin-bottom:6px;">
            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#c84;margin-bottom:2px;">DIVERSIFICATION TIP</div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;line-height:1.5;">
                ${$(v.name)} is ${v.pct}% of your book (target: ~${x}%).
                Reduce exposure by ~${r(be)} or grow positions in other nations.
            </div>
        </div>`}const ue=A.filter(v=>v.status==="LATE"||v.status==="DELINQUENT").length,S=[];T>=30&&S.push("reserves"),M<=40&&S.push("diversified"),ue===0&&S.push("no_delinquent"),A.length>=3&&S.push("scale");const F=S.length,pe=F>=4?"EXCELLENT":F>=3?"GOOD":F>=2?"FAIR":"POOR",te=F>=4?"#5c5":F>=3?"#ca5":F>=2?"#c84":"#c55";g+=`<div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">PORTFOLIO HEALTH</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${te};">${pe} (${F}/4)</span>
    </div>`,g+=`<div style="margin-top:4px;display:flex;gap:3px;">
        ${["Reserves","Diversified","No Defaults","Scale"].map((v,x)=>{const P=S.length>x&&S.includes(["reserves","diversified","no_delinquent","scale"][x]);return`<span style="flex:1;text-align:center;padding:2px 0;font-family:var(--font-mono);font-size:6px;font-weight:700;color:${P?"#5c5":"#6a6660"};border:1px solid ${P?"rgba(92,204,92,0.2)":"var(--panel-border)"};background:${P?"rgba(92,204,92,0.04)":"transparent"};">${P?"✓":"✗"} ${v}</span>`}).join("")}
    </div>`,g+="</div>",M>60&&I.length>0&&(g+=`<div class="rr-warning"><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c55;">CONCENTRATION WARNING: </span>${M}% of exposure is in ${$(I[0].name)}. A sovereign crisis or economic downturn in this nation would affect the majority of your portfolio. Consider diversifying across nations.</div>`),g+="</div>",g+=`<div class="df-footer" style="justify-content:space-between;">
        <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">DEPLOYABLE CAPITAL</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${w>0?"#5c5":"#c55"};">${r(w)}</div></div>
        <div style="text-align:right;"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">TOTAL EXPOSURE</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${r(c)}</div></div>
    </div>`,o.innerHTML=g}const Ge={REPAID:{color:"#5c5",label:"REPAID"},DEFAULTED:{color:"#c55",label:"DEFAULTED"},EXPIRED:{color:"#5c5",label:"EXPIRED"},CLAIMED:{color:"#c84",label:"CLAIMED"},MATURED:{color:"#5c5",label:"MATURED"},SOLD:{color:"#ca5",label:"SOLD EARLY"},FORECLOSED:{color:"#c55",label:"FORECLOSED"}};let V=[],Oe=-1;function wt(o){Oe=Oe===o?-1:o,ke()}function ke(){const o=document.getElementById("cc-container");if(!o)return;const t=V.reduce((p,e)=>p+(e.earned||0),0),l=V.reduce((p,e)=>p+(e.lost||0),0),c=V.reduce((p,e)=>p+(e.net||0),0),d=V.filter(p=>p.net>0).length,u=V.filter(p=>p.net<0).length,a=c>=0;let s=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Collections</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${V.length} RESOLVED</span>
    </div>`;if(s+=`<div class="cc-scorecard">
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">EARNED</div>
            <div class="cc-scorecard__value" style="color:#5c5;">${r(t)}</div>
        </div>
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">LOST</div>
            <div class="cc-scorecard__value" style="color:#c55;">${r(l)}</div>
        </div>
        <div class="cc-scorecard__cell" style="background:${a?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="cc-scorecard__label">NET P&amp;L</div>
            <div class="cc-scorecard__value" style="color:${a?"#5c5":"#c55"};">${a?"+":""}${r(c)}</div>
        </div>
    </div>`,V.length>0){const p=d/V.length*100;s+=`<div class="cc-winloss">
            <div class="cc-winloss__bar">
                <div style="width:${p}%;background:#5c5;height:100%;"></div>
                <div style="flex:1;background:#c55;height:100%;"></div>
            </div>
            <span class="cc-winloss__stat" style="color:#5c5;">${d}W</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&mdash;</span>
            <span class="cc-winloss__stat" style="color:#c55;">${u}L</span>
        </div>`}s+='<div class="cc-list">',V.length===0&&(s+='<div class="cc-empty">No resolved deals yet.<br>Completed loans, expired policies, and matured bonds appear here.</div>');for(let p=0;p<V.length;p++){const e=V[p],n=Me[e.type]||{class:"loan",label:e.type},y=Ge[e.outcome]||{color:"#9e9a92",label:e.outcome},w=Oe===p,f=e.net>=0;s+=`<div class="cc-deal" onclick="ccToggle(${p})" style="border-left:2px solid ${f?"#5c5":"#c55"};">
        <div class="cc-deal__inner" style="${w?"background:"+(e.type==="LOAN"?"rgba(90,138,170,0.08)":e.type==="INSURE"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,s+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${n.class}">${n.label}</span>
            <span style="font-size:11px;font-weight:600;color:var(--panel-text);flex:1;">${$(e.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${y.color};background:${y.color}12;border:1px solid ${y.color}25;">${y.label}</span>
        </div>`,s+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${$((e.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${$(e.resolved||"")}</span>
        </div>`,s+='<div class="df-metrics">',s+=`<div style="flex:1;padding:3px 8px;">
            <div class="df-metrics__label">PRINCIPAL</div>
            <div class="df-metrics__value" style="font-size:10px;color:var(--panel-text);margin-top:1px;">${r(e.principal||0)}</div>
        </div>`,s+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid var(--panel-border);">
            <div class="df-metrics__label">EARNED</div>
            <div class="df-metrics__value" style="font-size:10px;color:#5c5;margin-top:1px;">${r(e.earned||0)}</div>
        </div>`,e.lost>0&&(s+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid var(--panel-border);">
                <div class="df-metrics__label">LOST</div>
                <div class="df-metrics__value" style="font-size:10px;color:#c55;margin-top:1px;">${r(e.lost)}</div>
            </div>`),s+=`<div style="flex:1;padding:3px 8px;text-align:right;border-left:1px solid var(--panel-border);background:${f?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="df-metrics__label">NET</div>
            <div class="df-metrics__value" style="font-size:11px;color:${f?"#5c5":"#c55"};margin-top:1px;">${f?"+":""}${r(e.net||0)}</div>
        </div>`,s+="</div>",w&&(s+='<div class="cc-deal__expanded">',e.term&&(s+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">TERM</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${$(e.term)}</span>
                </div>`),e.rate&&(s+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">RATE</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${$(e.rate)}</span>
                </div>`),e.note&&(s+=`<div style="padding:4px 0;">
                    <div style="font-size:9px;color:${f?"#9e9a92":"#c84"};line-height:1.5;">${$(e.note)}</div>
                </div>`),s+="</div>"),s+="</div></div>"}s+="</div>",s+=`<div class="df-footer" style="justify-content:space-between;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">LIFETIME P&amp;L</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${a?"#5c5":"#c55"};">${a?"+":""}${r(c)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            ${Object.entries(V.reduce((p,e)=>(p[e.outcome]=(p[e.outcome]||0)+1,p),{})).map(([p,e])=>{const n=Ge[p]||{color:"#9e9a92",label:p};return`<div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:${n.color};letter-spacing:0.3px;">${n.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);">${e}</div>
                </div>`}).join("")}
        </div>
    </div>`,o.innerHTML=s}window.ccToggle=wt;const Et={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let h=null,L="LOAN",K=8,oe=18e6,we=24,O="equipment",ye="",ce=3.5,Q=12e6,ie=10,Se="",z=25e6;const Ie=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function $t(o){const t=W[o];t&&(h=t,L=t.type,t.type==="LOAN"?(K=8,oe=t.amount,we=t.term||24,O=t.collateral||"unsecured",ye=""):t.type==="INSURE"?(ce=t.isVesselInsurance?1.75:3.5,Q=t.amount,ie=10,Se=""):t.type==="BOND"&&(z=Math.round(t.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",de())}function Xe(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",h=null}function Nt(o){K=Number(o),de()}function Rt(o){O=o,de()}function At(o){ye=o}function Tt(o){ce=Number(o),de()}function Lt(o){Q=Number(o),de()}function Ct(o){ie=Number(o),de()}function It(o){z=Number(o),de()}function me(o,t,l){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(o/t*100,100)}%;background:${l};"></div></div>`}function de(){const o=document.getElementById("rd-modal");if(!o||!h)return;const t=h,l=L==="LOAN"?"#5a8aaa":L==="INSURE"?"#aa7a5a":"#8a6aaa",c=Math.round(oe*(K/100)*(we/12)),d=Math.round((oe+c)/we),u=t.revenue||474e5,a=Math.round(d/u*1200),s=12,p=Math.max(0,(K-6)*1.5),e=oe>15e6?3:0,n=O==="none"?3:O==="full"?-2:0,y=Number(t.corp_debt||0),w=Number(t.corp_cash_reserves||1),f=y>0?Math.min(15,Math.round(y/Math.max(w,1)*5)):0,i=Math.min(60,Math.max(2,Math.round(s+p+e+n+f))),N=i<=15?"#5c5":i<=30?"#ca5":i<=45?"#c84":"#c55",T=i<=15?"LOW":i<=30?"MODERATE":i<=45?"ELEVATED":"HIGH",C=95,E=(K-4)*8,R=oe<(t.amount||18e6)?10:0,Y=O==="full"?15:O==="property"?8:O==="none"?-5:0,I=Math.max(10,Math.min(95,Math.round(C-E-R-Y))),k=I>=70?"#5c5":I>=45?"#ca5":I>=25?"#c84":"#c55",D={unsecured:"none",equipment:"equipment",property:"property"},M=Ie.find(G=>G.id===(D[O]||O))||Ie[0],ee=Math.round(c*(1-i/100)),se=(t.term||18)/12,g=Math.round(Q*(ce/100)*se),ue=100-(t.reputation||50),S=Math.max(5,Math.min(50,Math.round(ue*.4))),F=Math.round(Q*(1-ie/100)),pe=Math.round(F*(S/100)),te=g-pe,v=S<=12?"#5c5":S<=22?"#ca5":S<=35?"#c84":"#c55",x=t.couponRate||6.2,P=t.term||60,be=P/12,Qe=Math.round(z*(x/100)),De=Math.round(z*(x/100)*be),fe=t.stability||50,ze=t.creditRating||50,Ue=t.debtToGdp||30,Ke=Math.max(2,Math.round((100-fe)*.15+(100-ze)*.15+Math.max(0,Ue-30)*.3)),ae=Math.min(60,Ke),Re=ae<=10?"#5c5":ae<=20?"#ca5":ae<=35?"#c84":"#c55",qe=Math.round(De*(1-ae/100));let m=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${l};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>`;if(m+=`<div class="rd-tabs">
        <span class="rd-tab ${L==="LOAN"?"active-loan":L==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${L==="LOAN"?"Loan":L==="INSURE"?"Insure":"Bond"} — ${$(t.applicant)}</span>
    </div></div>`,m+='<div class="rd-body">',m+='<div class="rd-left">',L==="LOAN"){const G=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84";m+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${$(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${$(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${$(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">CASH</div><div class="rd-applicant__stat-value" style="color:#5c5;">${r(t.corp_cash_reserves||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${r(t.corp_debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${G};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${r(t.amount)}</div></div>
            </div>
            <div style="margin-top:6px;padding:6px 8px;background:rgba(200,136,68,0.04);border:1px solid rgba(200,136,68,0.12);">
                <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c84;letter-spacing:0.8px;margin-bottom:4px;">EXISTING OBLIGATIONS</div>
                <div style="display:flex;gap:16px;">
                    <div><span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">ACTIVE LOANS</span><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.activeLoans>0?"#c84":"#5c5"};">${t.activeLoans}</div></div>
                    <div><span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">OUTSTANDING</span><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.totalOutstanding>0?"#c84":"#5c5"};">${r(t.totalOutstanding)}</div></div>
                    <div><span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEBT-TO-CASH</span><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.corp_debt>t.corp_cash_reserves?"#c55":t.corp_debt>0?"#ca5":"#5c5"};">${t.corp_cash_reserves>0?(t.corp_debt/t.corp_cash_reserves*100).toFixed(0)+"%":"—"}</div></div>
                </div>
            </div>
        </div>`,m+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const j=(K-3)/15*100;m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${K}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${K}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${j}%,var(--panel-border) ${j}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`,m+=`<div class="rd-control">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">Borrower's Request</div>
            <div class="rd-risk-row"><span class="rd-risk-label">LOAN AMOUNT</span><span class="rd-risk-value" style="color:var(--panel-text);">${r(oe)}</span></div>
            <div class="rd-risk-row"><span class="rd-risk-label">TERM</span><span class="rd-risk-value" style="color:var(--panel-text);">${we}mo</span></div>
        </div>`,m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">REQUIRE COLLATERAL</span>
                <span class="rd-control__value" style="font-size:12px;color:#5a8aaa;">${M.label}</span>
            </div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                ${Ie.map(U=>`<div onclick="rdSetLoanCollateral('${U.id}')" style="
                    flex:1;padding:6px 4px;text-align:center;
                    font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;
                    background:${O===U.id||(D[O]||O)===U.id?"rgba(90,138,170,0.12)":"transparent"};
                    border:1px solid ${O===U.id||(D[O]||O)===U.id?"rgba(90,138,170,0.3)":"var(--panel-border)"};
                    color:${O===U.id||(D[O]||O)===U.id?"#5a8aaa":"#6a6660"};
                    cursor:pointer;
                ">${U.label}</div>`).join("")}
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:6px;">
                ${M.id==="none"?"No collateral. Higher risk, lower acceptance chance.":M.id==="equipment"?"Borrower pledges equipment as security. Moderate risk reduction.":"Borrower pledges property. Strongest security, highest acceptance."}
            </div>
        </div>`,m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">OFFER TERMS (OPTIONAL)</span>
            </div>
            <textarea id="rd-loan-terms" maxlength="500" rows="3" placeholder="e.g. Early repayment penalty of 2%. Quarterly reporting required..." oninput="rdSetLoanTermsText(this.value)" style="
                width:100%;margin-top:6px;padding:8px 10px;
                background:var(--panel-main);border:1px solid var(--panel-border);color:var(--panel-text);
                font-family:var(--font-sans);font-size:11px;line-height:1.5;
                resize:vertical;outline:none;box-sizing:border-box;
            ">${$(ye)}</textarea>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Visible to the borrower. 500 characters max.</div>
        </div>`}if(L==="INSURE"){const G=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84",j=t.projectValue?"PROJECT":"FLEET",U=t.projectValue||t.fleetValue||0;m+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${$(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${$(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${$(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${G};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${j}</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${r(U)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${r(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${t.term}mo</div></div>
            </div>
        </div>`,t.purpose&&t.purpose!=="Construction Insurance"&&(m+=`<div style="padding:8px 14px;background:rgba(170,122,90,0.04);border-bottom:1px solid rgba(170,122,90,0.12);">
                <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#aa7a5a;letter-spacing:0.8px;margin-bottom:3px;">REQUESTED COVERAGE</div>
                <div style="font-size:10px;color:var(--panel-text);line-height:1.5;white-space:pre-wrap;">${$(t.purpose)}</div>
            </div>`),m+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const ve=!!h.isVesselInsurance,re=ve?.5:1,q=ve?4:8,Te=ve?.25:.5,Be=q>re?(ce-re)/(q-re)*100:0;m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${ce}%</span>
            </div>
            <input type="range" class="rd-control__range" min="${re}" max="${q}" step="${Te}" value="${ce}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${Be}%,var(--panel-border) ${Be}%);">
            <div class="rd-control__hints"><span>${re}% (competitive)</span><span>${q}% (expensive)</span></div>
        </div>`;const Le=Math.round((t.projectValue||t.fleetValue||t.amount)*.7),ge=Math.round(t.amount*.33),Fe=(Q-ge)/(Le-ge)*100;m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:var(--panel-text);">${r(Q)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${ge}" max="${Le}" step="1000000" value="${Q}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${Fe}%,var(--panel-border) ${Fe}%);">
            <div class="rd-control__hints"><span>${r(ge)} (partial)</span><span>${r(Le)} (max)</span></div>
        </div>`,m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:var(--panel-text);">${ie}%</span>
            </div>
            <div class="rd-presets">`;for(const Ce of[5,10,15,20,25])m+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${Ce})" style="${ie===Ce?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${Ce}%</span>`;m+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${ie}% of any claim (${r(Math.round(Q*ie/100))})</div>
        </div>`,m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">WHAT WE AGREE TO COVER</span>
            </div>
            <textarea id="rd-policy-terms" rows="3" placeholder="e.g., Covers weather delays, material damage, and labor disputes. Excludes negligence and acts of war. Maximum payout per claim: 50% of coverage."
                style="width:100%;box-sizing:border-box;padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--panel-text);background:var(--panel-main);border:1px solid var(--panel-border);resize:vertical;line-height:1.5;"
                oninput="rdPolicyTerms=this.value">${Se||""}</textarea>
        </div>`}if(L==="BOND"){const G=fe>=50?"#5c5":fe>=30?"#ca5":fe>=15?"#c84":"#c55";m+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${$(t.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${$(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${r(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${x}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${P}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${G};">${fe}</div></div>
            </div>
        </div>`,m+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const j=t.amount,U=Math.max(5e6,Math.ceil(j*.05/5e6)*5e6),ve=(z-U)/(j-U)*100;m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${r(z)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${U}" max="${j}" step="5000000" value="${z}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${ve}%,var(--panel-border) ${ve}%);">
            <div class="rd-control__hints"><span>${r(U)} (small position)</span><span>${r(j)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,m+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const re=[{key:"stability",value:fe,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:Ue,label:"Debt burden",invert:!0},{key:"credit_rating",value:ze,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:t.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:t.corruption||62,label:"Institutional risk",invert:!0}];for(const q of re){const Te=q.invert?q.value>60?"#c55":q.value>40?"#ca5":"#5c5":q.value>=50?"#5c5":q.value>=30?"#ca5":q.value>=15?"#c84":"#c55";m+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${q.key}</span>
                <div style="width:40px;">${me(q.value,100,Te)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:18px;text-align:right;">${q.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${q.label}</span>
            </div>`}m+="</div>"}if(m+="</div>",m+='<div class="rd-right">',L==="LOAN"){m+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${N};">${i}%</span>
            </div>
            ${me(i,100,N)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${N};margin-top:4px;">${T}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,m+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${k};">${I}%</span>
            </div>
            ${me(I,100,k)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,m+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',m+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${r(oe)}</span></div>`,m+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${r(c)}</span></div>`,m+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${r(d)}</span></div>`;const G=a>30?"#c55":a>15?"#ca5":"#5c5";m+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${G};">${a}% of revenue</span></div>`,m+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${r(ee)}</span></div>`,m+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${i}% default)</div>`}if(L==="INSURE"){m+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${v};">${S}%</span>
            </div>
            ${me(S,100,v)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,m+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',m+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${r(F)}</span></div>`,m+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${r(g)}</span></div>`,m+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${r(pe)}</span></div>`;const G=te>0?"":" negative",j=te>0?"#5c5":"#c55";m+=`<div class="rd-expected${G}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${j};">${r(te)}</span></div>`,m+=`<div class="rd-formula">Premiums (${r(g)}) − expected payout (${S}% × ${r(F)})</div>`}L==="BOND"&&(m+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',m+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${Re};">${ae}%</span>
            </div>
            ${me(ae,100,Re)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,m+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',m+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${r(z)}</span></div>`,m+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${r(Qe)}</span></div>`,m+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(be)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${r(De)}</span></div>`,m+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${r(qe)}</span></div>`,m+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${ae}% default)</div>`),m+="</div>",m+="</div>";const Je=L==="LOAN"?oe:L==="INSURE"?Q:z,Ze=L==="LOAN"?ee:L==="INSURE"?te:qe,et=L==="LOAN"?i:L==="INSURE"?S:ae,tt=L==="LOAN"?N:L==="INSURE"?v:Re,at=L==="LOAN"?"OFFER LOAN":L==="INSURE"?"WRITE POLICY":"BUY BONDS",ot=L.toLowerCase(),Ae=!!t.alreadyOffered,nt=Ae?"disabled":"",it=Ae?' title="You already have an offer on this request."':"",st=Ae?"ALREADY OFFERED":at;m+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${r(Je)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${r(Ze)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${tt};">${et}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${ot}" onclick="rdSubmitOffer()" ${nt}${it}>${st}</button>
        </div>
    </div>`,o.innerHTML=m}window.rdOpen=$t;window.rdClose=Xe;window.rdSetLoanRate=Nt;window.rdSetLoanCollateral=Rt;window.rdSetLoanTermsText=At;window.rdSetInsurePremium=Tt;window.rdSetInsureCoverage=Lt;window.rdSetInsureDeductible=Ct;window.rdSetBondAmount=It;let B=!1;async function Ot(){if(!h||!_||!H||B)return;if(h.alreadyOffered){alert("You already submitted an offer for this request.");return}B=!0;const o=H.current_tick||0,[t,l]=await Promise.all([b.from("factions").select("corp_cash_reserves").eq("id",_.id).single(),b.from("finance_active_loans").select("principal, remaining_principal, finance_loan_requests!inner(request_type)").eq("lender_faction_id",_.id).in("status",["current","late","delinquent"])]);if(t.error||l.error){alert("Could not verify current cash or portfolio. Try again."),B=!1;return}const c=Number(t.data?.corp_cash_reserves)||0,d=(l.data||[]).map(u=>{const a=u.finance_loan_requests?.request_type,s=a==="insurance"?"INSURE":a==="bond"?"BOND":"LOAN",p=Number(u.principal)||0,e=Math.max(0,Number(u.remaining_principal||0));return{type:s,principal:p,remaining:s==="INSURE"?0:e,coverage:s==="INSURE"?p:0,faceValue:s==="BOND"?p:0}});if(_&&(_.corp_cash_reserves=c),h.type==="LOAN"){const u=K;if(u<1||u>20){alert("Interest rate must be 1-20%."),B=!1;return}const a=je(c,d,_e,Ee);if(h.amount>a.deployable){const y=a.limiter==="lending_cap"?`Lending cap (${a.lendingCapPct}% of total capital = ${r(a.lendingCap)}). Already deployed ${r(a.totalDeployed)}.`:`Reserve requirement (${Math.round(a.reserveReqPct*100)}% of exposure = ${r(a.requiredReserve)}). Cash ${r(a.cash)}.`;alert(`Insufficient deployable capital.
${y}
Available: ${r(a.deployable)}
This loan: ${r(h.amount)}`+(a.limiter==="lending_cap"&&_e===0?`

Build a Branch Office to raise your lending cap (+15% each).`:"")),B=!1;return}if(c<h.amount){alert("Insufficient cash reserves to fund this loan."),B=!1;return}const p={none:"unsecured",equipment:"equipment",property:"property",full:"property"}[O]||"unsecured",e={request_id:h.requestId,offering_faction_id:_.id,interest_rate:u,collateral_type:p,created_tick:o};ye.trim()&&(e.offer_terms=ye.trim());const{error:n}=await b.from("finance_loan_offers").insert(e);if(n){B=!1,n.message.includes("unique")||n.message.includes("duplicate")?alert("You have already submitted an offer for this loan request."):alert("Failed to submit offer: "+n.message);return}}else if(h.type==="BOND"){if(c<z){alert("Insufficient cash reserves. Need "+r(z)+", have "+r(c)+"."),B=!1;return}const{error:u}=await b.from("finance_loan_offers").insert({request_id:h.requestId,offering_faction_id:_.id,interest_rate:h.couponRate,collateral_type:"unsecured",status:"accepted",created_tick:o});if(u){alert("Failed to buy bonds: "+u.message),B=!1;return}const a=h.couponRate/100/12;h.term;const s=Math.round(z*a),{data:p,error:e}=await b.from("finance_loan_requests").select("requesting_faction_id").eq("id",h.requestId).single();if(e||!p?.requesting_faction_id){alert("Failed to create bond position: could not resolve issuer faction."),B=!1;return}const{error:n}=await b.from("finance_active_loans").insert({request_id:h.requestId,offer_id:null,borrower_faction_id:p.requesting_faction_id,lender_faction_id:_.id,nation_id:h.nation_id||_.nation_id,principal:z,interest_rate:h.couponRate,term_months:h.term,collateral_type:"unsecured",purpose:h.purpose,monthly_payment:s,started_tick:o});if(n){alert("Failed to create bond position: "+n.message),B=!1;return}await b.from("factions").update({corp_cash_reserves:Math.max(0,c-z)}).eq("id",_.id);const{data:y}=await b.from("nations").select("debt").eq("id",h.nation_id).single();if(y){const{error:w}=await b.from("nations").update({debt:Number(y.debt||0)+z}).eq("id",h.nation_id);w&&console.warn("[Bonds] Failed to update nation debt:",w.message)}_.corp_cash_reserves=Math.max(0,c-z)}else if(h.type==="INSURE"){const u=ce,a=Q,s=ie,p=Math.round(a*(u/100)/12),{error:e}=await b.from("finance_loan_offers").insert({request_id:h.requestId,offering_faction_id:_.id,interest_rate:u,collateral_type:"unsecured",status:"accepted",created_tick:o});if(e){B=!1,e.message.includes("unique")||e.message.includes("duplicate")?alert("You have already submitted a policy offer for this request."):alert("Failed to write policy: "+e.message);return}const{data:n}=await b.from("finance_loan_requests").update({status:"funded",funded_tick:o}).eq("id",h.requestId).select("requesting_faction_id").single(),y={request_id:h.requestId,offer_id:null,borrower_faction_id:n?.requesting_faction_id||h.requestingFactionId,lender_faction_id:_.id,nation_id:_.nation_id,principal:a,interest_rate:u,term_months:0,collateral_type:"unsecured",purpose:h.isVesselInsurance?"Vessel Insurance — "+h.applicant:"Insurance Policy — "+h.applicant,monthly_payment:p,started_tick:o,deductible_pct:s,policy_terms:Se.trim()||null};h.insuredVesselId&&(y.insured_vessel_id=h.insuredVesselId),h.insuredContractId&&(y.insured_contract_id=h.insuredContractId);const{error:w}=await b.from("finance_active_loans").insert(y);if(w){alert("Failed to create policy record: "+w.message),B=!1;return}}else{B=!1;return}Xe(),J=-1,await Promise.all([We(),Z()]),B=!1}window.rdSubmitOffer=Ot;async function Z(){if(!_){X();return}const{data:o}=await b.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",_.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"},l=a=>a.finance_loan_requests?.request_type==="insurance",c=a=>{const s=Number(a.monthly_payment||0),p=Number(a.payments_made||0),e=Number(a.total_paid||0),n=s*p;return Math.max(0,e||n)},d=a=>{const s=c(a);return Math.max(0,Math.min(s,Number(a.total_interest_paid||0)))},u=a=>Math.max(0,c(a)-d(a));A=(o||[]).map(a=>({monthlyInterestPortion:Math.max(0,Math.min(Number(a.monthly_payment||0),Math.round(Math.max(0,Number(a.remaining_principal||0))*(Number(a.interest_rate||0)/100/12)))),monthlyPrincipalPortion:Math.max(0,Number(a.monthly_payment||0)-Math.max(0,Math.min(Number(a.monthly_payment||0),Math.round(Math.max(0,Number(a.remaining_principal||0))*(Number(a.interest_rate||0)/100/12))))),id:a.id,type:t[a.finance_loan_requests?.request_type]||"LOAN",counterparty:a.borrower?.faction_name||"Unknown",abbr:a.borrower?.abbreviation||a.borrower?.corp_ticker||"??",nation:a.loan_nation?.name||a.borrower?.nation||"Unknown",remaining:l(a)?0:Math.max(0,Number(a.remaining_principal||0)),principal:a.principal,earned:l(a)?(a.monthly_payment||0)*(a.payments_made||0):d(a),cashCollected:l(a)?void 0:c(a),interestRevenue:l(a)?void 0:d(a),principalRepaid:l(a)?void 0:u(a),rate:a.interest_rate,term:a.term_months,paymentsMade:a.payments_made,paymentsMissed:a.payments_missed,monthlyPayment:a.monthly_payment,status:a.status.toUpperCase(),collateral:a.collateral_type,purpose:a.purpose||"",alert:a.status==="late"||a.status==="delinquent",alertLevel:a.status==="delinquent"?"red":a.status==="late"?"orange":null,alertMsg:a.status==="delinquent"?`${a.payments_missed} missed payments. Default imminent.`:a.status==="late"?`${a.payments_missed} missed payment${a.payments_missed>1?"s":""}. Monitor closely.`:null,coverage:l(a)?a.principal:void 0,premiumsCollected:l(a)?(a.monthly_payment||0)*(a.payments_made||0):void 0,paidOut:l(a)?a.claims_paid||0:void 0,claims:l(a)?a.claims_count||0:void 0,deductible:l(a)?a.deductible_pct||0:void 0})),X()}async function kt(){if(!_){ke();return}const{data:o}=await b.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",_.id).in("status",["repaid","defaulted"]).order("completed_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"};V=(o||[]).map(l=>{const c=l.total_interest_paid||0,d=l.status==="defaulted"?Math.max(0,Number(l.remaining_principal||0)):0;return{type:t[l.finance_loan_requests?.request_type]||"LOAN",counterparty:l.borrower?.faction_name||"Unknown",abbr:l.borrower?.abbreviation||l.borrower?.corp_ticker||"??",nation:l.loan_nation?.name||l.borrower?.nation||"",outcome:l.status==="repaid"?"REPAID":"DEFAULTED",principal:l.principal,earned:c,lost:d,net:c-d,resolved:l.completed_tick?"Tick "+l.completed_tick:"",term:l.term_months+"mo",rate:l.interest_rate+"%",note:l.status==="repaid"?`Fully repaid over ${l.payments_made} payments.`:`Defaulted after ${l.payments_missed} missed payments. ${l.collateral_type!=="unsecured"?"Collateral ("+l.collateral_type+") partially recovered losses.":"Unsecured — no collateral recovery."}`}}),ke()}function Pe(o){const t=new URL("corp-operations.html",window.location.href);t.search=window.location.search;const l=t.searchParams;l.set("tab",o),t.search=l.toString()?`?${l.toString()}`:"",window.location.href=t.toString()}function Mt(o){o?.preventDefault&&o.preventDefault(),Pe("expansion")}function St(o){o?.preventDefault&&o.preventDefault(),Pe("actions")}async function Pt(){const o=new URLSearchParams(window.location.search).get("tab"),t=o==="expansion"||o==="actions",l=t?o:"operations",{data:{user:c}}=await b.auth.getUser();if(!c){window.location.href="login.html";return}const{data:d}=await b.from("factions").select("*").or(`id.eq.${c.id},linked_user_id.eq.${c.id}`);ne=(d||[]).filter(e=>e.nation_id);const u=sessionStorage.getItem("active_faction_id");if(_=ne.find(e=>e.id===u)||ne.find(e=>e.faction_type==="corporation")||ne[0],!_){await b.auth.signOut(),window.location.href="login.html";return}if(_.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(_.corp_sector!=="Finance"){const e={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html"};window.location.href=(e[_.corp_sector]||"corp-operations.html")+window.location.search;return}if(t){Pe(o);return}sessionStorage.setItem("active_faction_id",_.id);const[a,s]=await Promise.all([_.nation_id?b.from("nations").select("*").eq("id",_.nation_id).single():Promise.resolve({data:null}),b.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.data&&a.data,H=s.data;const p=document.getElementById("corp-topbar-container");if(p){const{renderCorpTopBar:e}=await rt(async()=>{const{renderCorpTopBar:n}=await import("./corp-topbar-5lTmaM1a.js");return{renderCorpTopBar:n}},__vite__mapDeps([0,1]));e(p,{faction:_,shard:H,activeTab:l,allUserFactions:ne})}if(Dt(),_.nation_id){const{data:e}=await b.from("active_laws").select("id, policy:policies!policy_id(policy_key)").eq("nation_id",_.nation_id).limit(100);Ee=(e||[]).some(n=>n.policy?.policy_key?.startsWith("financial_sector_deregulation"))}{const{data:e}=await b.from("corp_properties").select("id").eq("faction_id",_.id).eq("type","branch_office").eq("is_active",!0);_e=e?.length||0}if(await We(),await Z(),ht(),await kt(),H?.next_tick_at){const e=(Number(H.tick_interval_hours)||8)*36e5,n=new Date(H.next_tick_at).getTime(),w=n-e+e/2,f=new Date(w>Date.now()?w:n+e/2);Bt(f)}}function Dt(){const o=document.getElementById("corp-faction-dropdown");if(!o||ne.length<=1)return;let t="";for(const l of ne){const c=l.id===_.id,d=l.faction_type==="corporation"?"CORP":"PARTY";t+=`<div class="corp-faction-dropdown__item${c?" active":""}" onclick="switchFaction('${l.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${l.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${l.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${l.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${d}</span>
            <span>${$(l.faction_name||"--")}</span>
        </div>`}o.innerHTML=t}function zt(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function Ut(o){sessionStorage.setItem("active_faction_id",o);const t=ne.find(l=>l.id===o);t&&t.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}async function qt(){await b.auth.signOut(),window.location.href="login.html"}function Bt(o){const t=document.getElementById("tick-countdown");if(!t)return;function l(){const c=new Date(o)-new Date;if(c<=0){t.textContent="Processing...";return}const d=Math.floor(c/36e5),u=Math.floor(c%36e5/6e4),a=Math.floor(c%6e4/1e3);t.textContent=`${d}h ${u}m ${a}s`}l(),setInterval(l,1e3)}window.toggleCorpDropdown=zt;window.switchFaction=Ut;window.doLogout=qt;window.switchToExpansion=Mt;window.switchToActions=St;Pt();
