const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-C3V4L7WY.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as y}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as rt}from"./preload-helper-BXl3LOEh.js";import{e as $}from"./utils-CY90Gazr.js";let ne=[],m=null,G=null,$e=!1,_e=0;function je(o,t,s,a){const c=t.filter(R=>R.type==="LOAN").reduce((R,A)=>R+(A.remaining||0),0),d=t.filter(R=>R.type==="INSURE").reduce((R,A)=>R+(A.coverage||0),0),v=t.filter(R=>R.type==="BOND").reduce((R,A)=>R+(A.faceValue||0),0),p=c+d+v,f=t.reduce((R,A)=>A.type==="LOAN"?R+(Number(A.remaining)||0):A.type==="INSURE"?R+(Number(A.coverage)||0):A.type==="BOND"?R+(Number(A.faceValue)||Number(A.principal)||0):R,0),e=a?.12:.15,n=Math.round(p*e),l=Math.max(0,o-n),i=o+f,w=Math.min(100,50+(s||0)*15),h=Math.round(i*w/100),N=Math.max(0,h-f),E=Math.min(l,N),D=N<l?"lending_cap":"reserve_ratio";return{cash:o,totalExposure:p,totalDeployed:f,loanExposure:c,insureExposure:d,bondExposure:v,reserveReqPct:e,requiredReserve:n,reserveAvail:l,lendingCapPct:w,lendingCap:h,capAvail:N,deployable:E,limiter:D}}function r(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+Math.round(o).toLocaleString()}const Se={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},lt={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}};let X=[],xe="ALL",le="all",Z=-1;async function We(){if(!m||!G)return;const{data:o,error:t}=await y.from("finance_loan_requests").select("*, requesting_faction:factions!requesting_faction_id(id, faction_name, abbreviation, corp_ticker, corp_subsector, nation_id, corp_cash_reserves, corp_debt, corp_reputation), issuer_nation:nations!issuer_nation_id(id, name, stability, credit, debt, gdp, gdp_growth, corruption)").eq("status","open").order("created_tick",{ascending:!1});t&&console.error("[DealFlow] Request query error:",t.message);const s=[...new Set((o||[]).filter(e=>e.requesting_faction?.nation_id).map(e=>e.requesting_faction.nation_id))];let a={};if(s.length>0){const{data:e}=await y.from("nations").select("id, name, stability, credit, gdp, gdp_growth, corruption, debt").in("id",s);for(const n of e||[])a[n.id]=n}const{data:c}=await y.from("finance_loan_offers").select("request_id").eq("offering_faction_id",m.id),d=new Set((c||[]).map(e=>e.request_id)),v=[...new Set((o||[]).filter(e=>e.requesting_faction?.id).map(e=>e.requesting_faction.id))];let p={};if(v.length>0){const{data:e}=await y.from("finance_active_loans").select("borrower_faction_id, principal, total_paid").in("borrower_faction_id",v).in("status",["current","late","delinquent"]);for(const l of e||[]){p[l.borrower_faction_id]||(p[l.borrower_faction_id]={count:0,totalOutstanding:0}),p[l.borrower_faction_id].count++;const i=Math.max(0,Number(l.principal||0)-Number(l.total_paid||0));p[l.borrower_faction_id].totalOutstanding+=i}const{data:n}=await y.from("subsidiary_auto_policies").select("borrower_faction_id, principal, remaining_principal").in("borrower_faction_id",v).eq("service_type","loan").eq("status","active");for(const l of n||[])p[l.borrower_faction_id]||(p[l.borrower_faction_id]={count:0,totalOutstanding:0}),p[l.borrower_faction_id].count++,p[l.borrower_faction_id].totalOutstanding+=Number(l.remaining_principal||l.principal||0)}const f=(m.corp_subsector||"").toLowerCase();X=(o||[]).filter(e=>e.request_type==="bond"?f==="investment":e.request_type==="insurance"?f==="insurance":f==="banking").map(e=>{if(e.request_type==="bond"){const n=e.issuer_nation,l=Number(n?.stability??50),i=Number(n?.credit??50),w=Number(n?.gdp??1),h=Number(n?.debt??0),N=w>0?Math.round(h/w*100):0;return{id:e.id,type:"BOND",applicant:n?.name||"Unknown Nation",abbr:(n?.name||"??").slice(0,3).toUpperCase(),entity:"GOV",nation:n?.name||"N/A",nation_id:e.issuer_nation_id,amount:e.amount||0,term:e.term_months,couponRate:Number(e.coupon_rate||5),purpose:e.purpose||"Government Bond",stability:l,creditRating:i,debtToGdp:N,gdpGrowth:Number(n?.gdp_growth??50),corruption:Number(n?.corruption??50),risk:l>=60&&i>=50?"LOW":l>=35&&i>=30?"MODERATE":"HIGH",isNew:!d.has(e.id),ticksLeft:(e.expires_tick||0)-(G?.current_tick||0),requestId:e.id,alreadyOffered:d.has(e.id)}}if(e.request_type==="insurance"){const n=Number(e.requesting_faction?.corp_reputation??50),l=Number(a[e.requesting_faction?.nation_id]?.stability??50);return{id:e.id,type:"INSURE",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:a[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,amount:e.amount||0,term:e.term_months||0,purpose:e.purpose||"Construction Insurance",reputation:n,projectValue:e.amount||0,stability:l,risk:n>=60&&l>=50?"LOW":n>=35?"MODERATE":"HIGH",isNew:!d.has(e.id),ticksLeft:(e.expires_tick||0)-(G?.current_tick||0),requestId:e.id,insuredContractId:e.insured_contract_id,insuredVesselId:e.insured_vessel_id,isVesselInsurance:!!e.insured_vessel_id,alreadyOffered:d.has(e.id),requestingFactionId:e.requesting_faction?.id}}return{id:e.id,type:"LOAN",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:a[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,requestingFactionId:e.requesting_faction?.id,amount:e.amount,term:e.term_months,purpose:e.purpose||"",reputation:Number(e.requesting_faction?.corp_reputation??50),revenue:Number(e.requesting_faction?.corp_cash_reserves??0),corp_cash_reserves:Number(e.requesting_faction?.corp_cash_reserves??0),corp_debt:Number(e.requesting_faction?.corp_debt??0),activeLoans:(p[e.requesting_faction?.id]||{}).count||0,totalOutstanding:(p[e.requesting_faction?.id]||{}).totalOutstanding||0,creditRating:Number(a[e.requesting_faction?.nation_id]?.credit??50),stability:Number(a[e.requesting_faction?.nation_id]?.stability??50),risk:(()=>{const n=Number(a[e.requesting_faction?.nation_id]?.credit??50),l=Number(e.requesting_faction?.corp_reputation??50);return n>=60&&l>=60?"LOW":n>=35&&l>=35?"MODERATE":n>=20||l>=20?"ELEVATED":"HIGH"})(),isNew:!d.has(e.id),ticksLeft:(e.expires_tick||0)-(G?.current_tick||0),collateral:e.collateral_type||"unsecured",requestId:e.id,alreadyOffered:d.has(e.id)}}),Ne()}function Ve(o){if(!m)return!1;const t=(m.corp_subsector||"").toLowerCase(),s=$t[t];return o.type===s}function ct(o){xe=o,Z=-1,Ne()}function dt(o){Z=Z===o?-1:o,Ne()}function Ne(){const o=document.getElementById("df-container");if(!o)return;let t=xe==="ALL"?X:X.filter(e=>e.type===xe);le==="mine"&&m?.nation_id&&(t=t.filter(e=>e.nation_id===m.nation_id));const s=X.filter(e=>e.isNew).length,a=X.length;let c=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
            ${s>0?`<span class="df-badge df-badge-corp">${s} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:12px;color:#6a6660;">${a} OPEN</span>
        </div>
    </div>`;const d=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];c+='<div class="df-filters">';for(const e of d)c+=`<span class="df-pill${xe===e.id?" "+e.activeClass:""}" onclick="dfSetFilter('${e.id}')">${e.label}</span>`;c+=`<span style="margin-left:auto;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.5px;cursor:pointer;padding:6px 10px;border:1px solid ${le==="mine"?"#5c544":"var(--panel-border)"};color:${le==="mine"?"#5c5":"#6a6660"};background:${le==="mine"?"rgba(92,204,92,0.06)":"transparent"};" onclick="dfToggleNation()">${le==="mine"?"MY NATION":"ALL NATIONS"}</span>`,c+="</div>",c+='<div class="df-list">',t.length===0&&(c+='<div class="ap-empty">No deals available.<br>Deals appear when corporations request financing or governments issue bonds.</div>');for(let e=0;e<t.length;e++){const n=t[e],l=X.indexOf(n),i=Z===l,w=Se[n.type],h=lt[n.risk],N=Ve(n);c+=`<div class="df-deal${i?" sel-"+w.class:""}" onclick="dfSelectDeal(${l})" style="${N?"":"opacity:0.5;"}">`,n.isNew&&N&&(c+='<div class="df-new-dot"></div>'),c+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <span class="df-badge df-badge-${w.class}">${w.label}</span>
            <span style="font-size:15px;font-weight:600;color:var(--panel-text);">${$(n.applicant)}</span>
            <span class="df-badge df-badge-${n.entity.toLowerCase()}">${n.entity}</span>
            ${N?"":'<span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`;const E=h.class==="df-risk-low"?"#5c5":h.class==="df-risk-moderate"?"#ca5":h.class==="df-risk-elevated"?"#c84":"#c55";c+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span class="df-badge df-badge-nation">${$(n.nation.toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:2px 7px;line-height:16px;color:${E};background:${E}12;border:1px solid ${E}25;">${h.label}</span>
        </div>`;const D=n.type==="BOND"?"FACE VALUE":n.type==="INSURE"?"COVERAGE":"AMOUNT",R=n.type==="BOND"?"COUPON":"REP",A=n.type==="BOND"?n.couponRate+"%":n.reputation||n.stability,Y=n.type==="BOND"?n.couponRate*10:n.reputation||n.stability,C=n.type==="BOND"?"#c8a832":Y>=60?"#5c5":Y>=35?"#ca5":"#c84";if(c+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${D}</div>
                <div class="df-metrics__value" style="font-size:15px;color:var(--panel-text);">${r(n.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:14px;color:var(--panel-text);">${n.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${R}</div>
                <div class="df-metrics__value" style="font-size:14px;color:${C};">${A}</div>
            </div>
        </div>`,i){if(c+=`<div style="margin-top:8px;font-size:13px;color:#9e9a92;line-height:1.5;margin-bottom:8px;">${$(n.purpose)}</div>`,N)c+='<div class="df-detail">';else{const M=n.type==="LOAN"?"Banking":n.type==="INSURE"?"Insurance":"Investment";c+=`<div style="padding:8px 10px;background:rgba(106,102,96,0.06);border:1px solid var(--panel-border);font-family:var(--font-mono);font-size:11px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:var(--panel-text);font-weight:700;">${M}</span> subsector to underwrite.
                    ${m?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+$(m.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(N){if(n.type==="LOAN"){const M=n.corp_cash_reserves>0?Math.round(n.corp_debt/n.corp_cash_reserves*100):0,z=M>50?"#c84":"#5c5",O=n.corp_debt>n.corp_cash_reserves*.5?"#c84":"#9e9a92";c+=`<div class="df-detail-row"><span class="df-detail-label">CASH</span><span class="df-detail-value" style="color:#9e9a92;">${r(n.corp_cash_reserves)}</span></div>`,c+=`<div class="df-detail-row"><span class="df-detail-label">DEBT</span><span class="df-detail-value" style="color:${O};">${r(n.corp_debt)}</span></div>`,c+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/CASH</span><span class="df-detail-value" style="color:${z};font-weight:700;">${M}%</span></div>`}else if(n.type==="BOND"){const M=n.stability>=50?"#5c5":n.stability>=30?"#ca5":"#c84",z=n.debtToGdp>60?"#c55":n.debtToGdp>40?"#c84":"#5c5",O=n.creditRating>=60?"#5c5":n.creditRating>=35?"#ca5":"#c55";c+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${M};">${n.stability}/100</span></div>`,c+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${z};">${n.debtToGdp}%</span></div>`,c+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${O};font-weight:700;">${n.creditRating}/100</span></div>`}else if(n.type==="INSURE"){const M=n.reputation>=60?"#5c5":n.reputation>=35?"#ca5":"#c84",z=n.projectValue?"PROJECT VALUE":"FLEET VALUE",O=n.projectValue||n.fleetValue;c+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${M};">${n.reputation}/100</span></div>`,c+=`<div class="df-detail-row"><span class="df-detail-label">${z}</span><span class="df-detail-value" style="color:#9e9a92;">${r(O)}</span></div>`}c+="</div>"}}c+="</div>"}c+="</div>";const v=X.filter(e=>e.type==="LOAN").length,p=X.filter(e=>e.type==="INSURE").length,f=X.filter(e=>e.type==="BOND").length;c+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${v}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${p}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${f}</span></div>
        </div>
        ${(()=>{const e=Z>=0?X[Z]:null,n=e&&Ve(e);return n?`<div class="df-review-btn active" onclick="rdOpen(${Z})">REVIEW DEAL</div>`:e&&!n?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,o.innerHTML=c}function pt(){le=le==="all"?"mine":"all",Z=-1,Ne()}window.dfSetFilter=ct;window.dfToggleNation=pt;window.dfSelectDeal=dt;const He={CURRENT:{color:"#5c5",label:"CURRENT"},LATE:{color:"#c84",label:"LATE"},DELINQUENT:{color:"#c55",label:"DELINQUENT"},CLAIM:{color:"#c55",label:"CLAIM FILED"},ACTIVE:{color:"#5c5",label:"ACTIVE"},WATCHLIST:{color:"#ca5",label:"WATCHLIST"},DEFAULT:{color:"#c55",label:"DEFAULT"}};let T=[],he="ALL",Ee=-1;function ft(o){he=o,Ee=-1,Q()}function vt(o){Ee=Ee===o?-1:o,Q()}function Q(){const o=document.getElementById("ap-container");if(!o)return;const t=he==="ALL"?T:T.filter(l=>l.type===he),s=T.reduce((l,i)=>l+(i.remaining||i.coverage||i.faceValue||0),0),a=T.reduce((l,i)=>l+(i.earned||i.premiumsCollected||i.couponsReceived||0),0),c=T.filter(l=>l.alert).length;let d=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Active Portfolio</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${c>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:#c55;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);">${c} ALERT${c>1?"S":""}</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${T.length} ACTIVE</span>
        </div>
    </div>`;d+=`<div class="ap-summary">
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EXPOSURE</div>
            <div class="ap-summary__value" style="font-size:14px;color:#c55;">${r(s)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EARNED</div>
            <div class="ap-summary__value" style="font-size:14px;color:#5c5;">${r(a)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:0.6;">
            <div class="ap-summary__label">DEALS</div>
            <div style="display:flex;gap:4px;margin-top:3px;">
                ${["LOAN","INSURE","BOND"].map(l=>{const i=T.filter(h=>h.type===l).length;return`<div style="display:flex;align-items:center;gap:2px;"><div style="width:4px;height:4px;background:${l==="LOAN"?"#5a8aaa":l==="INSURE"?"#aa7a5a":"#8a6aaa"};border-radius:1px;"></div><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#9e9a92;">${i}</span></div>`}).join("")}
            </div>
        </div>
    </div>`,d+='<div class="df-filters">';for(const l of[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Policies",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}])d+=`<span class="df-pill${he===l.id?" "+l.activeClass:""}" onclick="apSetFilter('${l.id}')">${l.label}</span>`;d+="</div>",d+='<div class="ap-list">',t.length===0&&(d+='<div class="ap-empty">No active positions.<br>Review deals from the Deal Flow to build your portfolio.</div>');for(let l=0;l<t.length;l++){const i=t[l],w=T.indexOf(i),h=Ee===w,N=Se[i.type],E=He[i.status]||He.CURRENT,D=!!i.alert,R=i.paymentsMade||0,A=i.term||1,Y=Math.round(R/A*100),C=D?E.color==="#c55"?"alert-red":E.color==="#c84"?"alert-orange":"alert-yellow":"";d+=`<div class="ap-deal ${C}" onclick="apToggle(${w})">
            <div class="ap-deal__inner" style="${h?"background:"+(N.class==="loan"?"rgba(90,138,170,0.08)":N.class==="insure"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,d+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${N.class}">${N.label}</span>
            <span style="font-size:11px;font-weight:600;color:var(--panel-text);flex:1;">${$(i.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${E.color};background:${E.color}12;border:1px solid ${E.color}25;">${E.label}</span>
        </div>`,d+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${$((i.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${R}/${A}mo — ${Y}%</span>
        </div>`;const M=D?E.color:N.class==="loan"?"#5a8aaa":N.class==="insure"?"#aa7a5a":"#8a6aaa";d+=`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(Y,100)}%;background:${M};"></div></div>`;const z=i.type==="LOAN"?"REMAINING":i.type==="INSURE"?"COVERAGE":"FACE VALUE",O=i.remaining||i.coverage||i.faceValue||0,te=i.type==="LOAN"?"RATE":i.type==="INSURE"?"PREMIUM":"COUPON",se=i.rate||i.premiumRate||i.coupon||0,b=i.earned||i.premiumsCollected||i.couponsReceived||0,ue=i.type==="LOAN"?"INTEREST EARNED":i.type==="INSURE"?"PREMIUMS EARNED":"COUPONS EARNED",k=N.class==="loan"?"#5a8aaa":N.class==="insure"?"#aa7a5a":"#8a6aaa";if(d+=`<div class="df-metrics" style="margin-top:4px;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${z}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);margin-top:1px;">${r(O)}</div>
            </div>
            <div style="flex:0.8;padding:3px 6px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${te}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${k};margin-top:1px;">${se}%</div>
            </div>
            <div style="flex:1;padding:3px 6px;text-align:right;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${ue}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5c5;margin-top:1px;">${r(b)}</div>
            </div>
        </div>`,D&&(d+=`<div class="ap-deal__alert" style="background:${E.color}08;border:1px solid ${E.color}20;color:${E.color};">${$(i.alert)}</div>`),h){if(d+='<div class="ap-deal__expanded">',i.type==="LOAN"){const P=[{label:"PRINCIPAL",value:r(i.principal||0)},{label:"REMAINING",value:r(i.remaining||0),color:"var(--panel-text)"},{label:"MONTHLY PAYMENT",value:r(i.monthlyPayment||0)},{label:"MISSED PAYMENTS",value:String(i.missedPayments||0),color:(i.missedPayments||0)>0?"#c55":"#5c5"},{label:"NEXT DUE",value:i.nextPayment||"—",color:i.status==="LATE"?"#c55":"#9e9a92"}];for(const U of P)d+=`<div class="ap-detail-row"><span class="ap-detail-label">${U.label}</span><span class="ap-detail-value" style="color:${U.color||"#9e9a92"};">${U.value}</span></div>`;i.status!=="CURRENT"&&(d+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apRestructure('${i.id}')">RESTRUCTURE</div><div class="ap-action-btn orange" onclick="apCallLoan('${i.id}')">CALL LOAN</div><div class="ap-action-btn red" onclick="apForeclose('${i.id}')">FORECLOSE</div></div>`)}else if(i.type==="INSURE"){const P=[{label:"COVERAGE",value:r(i.coverage||0)},{label:"PREMIUMS COLLECTED",value:r(i.premiumsCollected||0),color:"#5c5"},{label:"CLAIMS FILED",value:String(i.claims||0),color:(i.claims||0)>0?"#c84":"#5c5"},{label:"PAID OUT",value:r(i.paidOut||0),color:(i.paidOut||0)>0?"#c55":"#6a6660"}];for(const U of P)d+=`<div class="ap-detail-row"><span class="ap-detail-label">${U.label}</span><span class="ap-detail-value" style="color:${U.color||"#9e9a92"};">${U.value}</span></div>`;i.status==="CLAIM"&&i.claimAmount&&(d+=`<div class="ap-claim-box"><div style="font-family:var(--font-mono);font-size:7px;color:#c55;letter-spacing:0.8px;margin-bottom:2px;">PENDING CLAIM</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${r(i.claimAmount)}</div></div>`,d+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apPayClaim('${i.id}')">PAY IN FULL</div><div class="ap-action-btn orange" onclick="apNegotiateClaim('${i.id}')">NEGOTIATE</div><div class="ap-action-btn red" onclick="apDisputeClaim('${i.id}')">DISPUTE</div></div>`)}else if(i.type==="BOND"){const P=[{label:"FACE VALUE",value:r(i.faceValue||0)},{label:"COUPONS RECEIVED",value:r(i.couponsReceived||0),color:"#5c5"},{label:"NEXT COUPON",value:i.nextCoupon||"—"},{label:"ANNUAL YIELD",value:r(Math.round((i.faceValue||0)*(i.coupon||0)/100)),color:"#8a6aaa"}];for(const U of P)d+=`<div class="ap-detail-row"><span class="ap-detail-label">${U.label}</span><span class="ap-detail-value" style="color:${U.color||"#9e9a92"};">${U.value}</span></div>`;d+=`<div class="ap-actions"><div class="ap-action-btn purple" onclick="apSellPosition('${i.id}')">SELL POSITION</div><div class="ap-action-btn olive">HOLD</div></div>`}d+="</div>"}d+="</div></div>"}d+="</div>";const v=T.reduce((l,i)=>l+(i.principal||i.coverage||i.faceValue||0),0),p=v>0?Math.round(a/v*1e4)/100:0,f=T.length>0?Math.round(T.reduce((l,i)=>l+(i.rate||0),0)/T.length*10)/10:0,e=T.filter(l=>l.status==="LATE"||l.status==="DELINQUENT").length,n=T.length>0?Math.round(e/T.length*100):0;d+=`<div class="df-footer" style="flex-direction:column;gap:6px;">
        <div style="display:flex;gap:8px;justify-content:space-between;width:100%;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EXPOSURE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${r(s)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EARNED</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;">${r(a)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">ROI</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${p>=0?"#5c5":"#c55"};">${p}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">AVG RATE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#ca5;">${f}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">RISK</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${n>20?"#c55":n>0?"#ca5":"#5c5"};">${n}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            ${["LOAN","INSURE","BOND"].map(l=>{const i=l==="LOAN"?"#5a8aaa":l==="INSURE"?"#aa7a5a":"#8a6aaa",w=T.filter(h=>h.type===l).length;return`<div style="text-align:center;padding:1px 6px;border:1px solid ${w>0?i+"33":"var(--panel-border)"};background:${w>0?i+"0a":"transparent"};"><div style="font-family:var(--font-mono);font-size:6px;color:${i};">${l}</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${w>0?"var(--panel-text)":"#6a6660"};">${w}</div></div>`}).join("")}
        </div>
    </div>`,o.innerHTML=d}window.apSetFilter=ft;window.apToggle=vt;async function ut(o){const t=prompt(`RESTRUCTURE LOAN

Enter new annual interest rate (1-20%):
(This extends the term by 12 months and resets missed payments.)`);if(!t)return;const s=parseFloat(t);if(isNaN(s)||s<1||s>20){alert("Rate must be between 1% and 20%.");return}const{data:a}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!a){alert("Loan not found.");return}const c=a.term_months+12,d=s/100/12,v=Number(a.principal)-Number(a.total_paid||0)+Number(a.total_interest_paid||0),p=d>0?Math.round(v*(d*Math.pow(1+d,c))/(Math.pow(1+d,c)-1)):Math.round(v/c);if(!confirm(`Restructure to ${s}% over ${c} months?
New monthly payment: ${r(p)}
Missed payments reset to 0.`))return;const{error:f}=await y.from("finance_active_loans").update({interest_rate:s,term_months:c,monthly_payment:p,payments_missed:0,status:"current"}).eq("id",o);if(f){alert("Failed: "+f.message);return}alert("Loan restructured."),await ee(),Q()}async function mt(o){if(!confirm(`CALL LOAN

Demand immediate full repayment of remaining principal.
The borrower will have 3 ticks to pay or default.

Proceed?`))return;const{error:t}=await y.from("finance_active_loans").update({status:"delinquent",payments_missed:3}).eq("id",o);if(t){alert("Failed: "+t.message);return}alert("Loan called. Borrower has 1 tick to pay before default."),await ee(),Q()}async function _t(o){if(!confirm(`FORECLOSE

Immediately default the loan and seize collateral.
Collateral recovery: Equipment 60%, Property 75%, Unsecured 0%.

This cannot be undone. Proceed?`))return;const{data:t}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Loan not found.");return}const s=Math.max(0,Number(t.principal)-Number(t.total_paid||0));let a=0;t.collateral_type==="equipment"?a=.6:t.collateral_type==="property"&&(a=.75);const c=Math.round(s*a);if(c>0){const{data:d}=await y.from("factions").select("corp_cash_reserves").eq("id",m.id).single();await y.from("factions").update({corp_cash_reserves:Number(d?.corp_cash_reserves||0)+c}).eq("id",m.id),m.corp_cash_reserves=Number(d?.corp_cash_reserves||0)+c}await y.from("finance_active_loans").update({status:"defaulted",completed_tick:G?.current_tick||0}).eq("id",o),alert("Foreclosed. Recovered: "+r(c)+" from "+(t.collateral_type||"unsecured")+" collateral."),await ee(),Q()}async function yt(o){const{data:t}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Policy not found.");return}const s=Number(t.principal||0)-Number(t.claims_paid||0),a=Number(t.deductible_pct||0)/100,c=Math.round(s*(1-a));if(!confirm(`PAY CLAIM IN FULL

Claim: ${r(s)}
Deductible: ${t.deductible_pct}%
Payout: ${r(c)}

This will be deducted from your cash reserves.`))return;const{data:d}=await y.from("factions").select("corp_cash_reserves").eq("id",m.id).single(),v=Number(d?.corp_cash_reserves||0);if(v<c){alert("Insufficient funds. You have "+r(v)+".");return}await y.from("factions").update({corp_cash_reserves:v-c}).eq("id",m.id),m.corp_cash_reserves=v-c;const{data:p}=await y.from("factions").select("corp_cash_reserves").eq("id",t.borrower_faction_id).single();p&&await y.from("factions").update({corp_cash_reserves:Number(p.corp_cash_reserves||0)+c}).eq("id",t.borrower_faction_id),await y.from("finance_active_loans").update({claims_paid:Number(t.claims_paid||0)+c,claims_count:(t.claims_count||0)+1}).eq("id",o),alert("Claim paid: "+r(c)),await ee(),Q()}async function bt(o){const t=prompt(`NEGOTIATE CLAIM

Offer a percentage of the claim to settle (10-90%):
(Policyholder may reject low offers.)`);if(!t)return;const s=parseInt(t);if(isNaN(s)||s<10||s>90){alert("Must be between 10% and 90%.");return}const a=s/100;if(!(Math.random()<a)){alert("Offer rejected. The policyholder wants a higher settlement.");return}const{data:d}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!d)return;const v=Number(d.principal||0)-Number(d.claims_paid||0),p=Math.round(v*s/100),{data:f}=await y.from("factions").select("corp_cash_reserves").eq("id",m.id).single(),e=Number(f?.corp_cash_reserves||0);if(e<p){alert("Insufficient funds.");return}await y.from("factions").update({corp_cash_reserves:e-p}).eq("id",m.id),m.corp_cash_reserves=e-p;const{data:n}=await y.from("factions").select("corp_cash_reserves").eq("id",d.borrower_faction_id).single();n&&await y.from("factions").update({corp_cash_reserves:Number(n.corp_cash_reserves||0)+p}).eq("id",d.borrower_faction_id),await y.from("finance_active_loans").update({claims_paid:Number(d.claims_paid||0)+p,claims_count:(d.claims_count||0)+1,status:"repaid"}).eq("id",o),alert("Claim settled at "+s+"% ("+r(p)+"). Policy closed."),await ee(),Q()}async function gt(o){if(!confirm(`DISPUTE CLAIM

Challenge the validity of this claim.
This freezes the claim for 4 ticks while investigated.
If investigation finds the claim valid, you pay in full + 10% penalty.
If investigation finds fraud, claim is dismissed.

Dispute?`))return;Math.random()<.7?alert(`Investigation complete: claim is VALID.
You must now pay the full claim.`):(await y.from("finance_active_loans").update({status:"repaid",claims_count:0}).eq("id",o),alert(`Investigation complete: FRAUDULENT CLAIM detected.
Claim dismissed. Policy remains active.`)),await ee(),Q()}async function xt(o){const{data:t}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Position not found.");return}const s=Number(t.principal||0)-Number(t.total_paid||0),a=Math.round(s*.85);if(!confirm(`SELL POSITION

Remaining value: ${r(s)}
Market price (85%): ${r(a)}

You receive ${r(a)} immediately.
The position is removed from your portfolio.`))return;const{data:c}=await y.from("factions").select("corp_cash_reserves").eq("id",m.id).single();await y.from("factions").update({corp_cash_reserves:Number(c?.corp_cash_reserves||0)+a}).eq("id",m.id),m.corp_cash_reserves=Number(c?.corp_cash_reserves||0)+a,await y.from("finance_active_loans").update({status:"repaid",completed_tick:G?.current_tick||0}).eq("id",o),alert("Position sold for "+r(a)+"."),await ee(),Q()}window.apRestructure=ut;window.apCallLoan=mt;window.apForeclose=_t;window.apPayClaim=yt;window.apNegotiateClaim=bt;window.apDisputeClaim=gt;window.apSellPosition=xt;function Ge(o,t){const s=o.reduce((a,c)=>a+c.value,0);return s===0?`<div class="rr-seg-bar" style="height:${t}px;background:var(--panel-border);"></div>`:`<div class="rr-seg-bar" style="height:${t}px;">${o.map(a=>`<div style="width:${(a.value/s*100).toFixed(1)}%;height:100%;background:${a.color};"></div>`).join("")}</div>`}function ht(){const o=document.getElementById("rr-container");if(!o)return;const t=Number(m?.corp_cash_reserves)||0,s=je(t,T,_e,$e),{totalExposure:a,requiredReserve:c,reserveReqPct:d,loanExposure:v,insureExposure:p,bondExposure:f,lendingCapPct:e,lendingCap:n,totalDeployed:l,deployable:i,limiter:w}=s,h=a,N=t+h,E=a>0?Math.round(t/a*100):100,D=Math.round(d*100),R=E>=30?"HEALTHY":E>=20?"ADEQUATE":E>=D?"THIN":"CRITICAL",A=E>=30?"#5c5":E>=20?"#ca5":E>=D?"#c84":"#c55",Y={};for(const _ of T){const x=_.nation||"Unknown",S=_.remaining||_.coverage||_.faceValue||0;Y[x]=(Y[x]||0)+S}const C=Object.entries(Y).map(([_,x])=>({name:_,exposure:x,pct:a>0?Math.round(x/a*100):0})).sort((_,x)=>x.exposure-_.exposure),M={};for(const _ of T){const x=_.type==="BOND"?"Government":_.sector||"Other",S=_.remaining||_.coverage||_.faceValue||0;M[x]=(M[x]||0)+S}const z=Object.entries(M).map(([_,x])=>({name:_,exposure:x,pct:a>0?Math.round(x/a*100):0})).sort((_,x)=>x.exposure-_.exposure),O=C.length>0?C[0].pct:0,te=O>60?"HIGH":O>40?"MODERATE":"LOW",se=te==="HIGH"?"#c55":te==="MODERATE"?"#ca5":"#5c5";let b=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Reserves & Risk</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${A};background:${A}12;border:1px solid ${A}25;">${R}</span>
    </div>`;b+='<div style="flex:1;overflow-y:auto;">',$e&&(b+=`<div style="padding:5px 14px;background:rgba(200,168,50,0.06);border-bottom:1px solid rgba(200,168,50,0.15);display:flex;align-items:center;gap:6px;">
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:#c8a832;background:rgba(200,168,50,0.12);border:1px solid rgba(200,168,50,0.25);">POLICY</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#c8a832;">Financial Sector Deregulation Act</span>
            <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">Reserve req: ${D}% &middot; Interest: +10%</span>
        </div>`),b+='<div class="rr-section-bar">Capital Position</div>',b+='<div class="rr-section">',b+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">TOTAL ASSETS</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${r(N)}</span>
    </div>`,b+=Ge([{value:t,color:"#5c5"},{value:h,color:"#8b9a6b"}],6),b+=`<div class="rr-seg-legend">
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#5c5;"></div>Cash ${r(t)}</div>
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#8b9a6b;"></div>Deployed ${r(h)}</div>
    </div>`,b+="</div>",b+='<div class="rr-section">',b+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">RESERVE RATIO</span>
        <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${A};">${E}%</span>
    </div>`,b+=`<div class="rd-bar" style="height:5px;"><div class="rd-bar__fill" style="width:${Math.min(E/60*100,100)}%;background:${A};"></div></div>`,b+=`<div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:3px;">
        <span style="color:#c55;">${D}% minimum</span><span>30% healthy</span><span style="color:#5c5;">60%+</span>
    </div>`,b+=`<div class="rr-reserve-cells">
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REQUIRED (${D}%)</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;margin-top:1px;">${r(c)}</div></div>
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">AVAILABLE TO DEPLOY</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${i>0?"#5c5":"#c55"};margin-top:1px;">${r(i)}</div></div>
    </div>`;{const _=w==="lending_cap"?`Capped at ${e}% of total capital (branch offices: ${_e}). Deployed ${r(l)} of ${r(n)}.`:`Reserve requirement binds (${D}% of exposure).`;b+=`<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:6px;letter-spacing:0.02em;">${_}</div>`}if(b+="</div>",b+='<div class="rr-section-bar">Exposure by Type</div>',b+='<div class="rr-section">',a>0){b+=Ge([{value:v,color:"#5a8aaa"},{value:p,color:"#aa7a5a"},{value:f,color:"#8a6aaa"}],6),b+='<div style="margin-top:6px;">';const _=[{label:"Loans",value:v,color:"#5a8aaa",pct:a>0?Math.round(v/a*100):0},{label:"Insurance",value:p,color:"#aa7a5a",pct:a>0?Math.round(p/a*100):0},{label:"Bonds",value:f,color:"#8a6aaa",pct:a>0?Math.round(f/a*100):0}];for(let x=0;x<_.length;x++){const S=_[x];b+=`<div class="rr-type-row">
                <div style="width:6px;height:6px;background:${S.color};margin-right:6px;"></div>
                <span style="flex:1;font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${S.label}</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${r(S.value)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;width:28px;text-align:right;">${S.pct}%</span>
            </div>`}b+="</div>"}else b+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No exposure</div>';if(b+="</div>",b+=`<div class="rr-section-bar" style="display:flex;justify-content:space-between;align-items:center;">
        <span>Concentration Risk</span>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${se};background:${se}12;border:1px solid ${se}25;">${te}</span>
    </div>`,b+='<div class="rr-section">',C.length>0){b+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">BY NATION</div>';for(const _ of C){const x=_.pct>50?"#c84":_.pct>30?"#ca5":"#5c5";b+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;width:52px;text-align:center;">${$(_.name.toUpperCase().slice(0,6))}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${_.pct}%;background:${x};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${r(_.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${_.pct>50?"#c84":"#9e9a92"};">${_.pct}%</span>
            </div>`}}if(z.length>0){b+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-top:8px;margin-bottom:4px;">BY SECTOR</div>';for(const _ of z){const x=_.pct>50?"#c84":_.pct>30?"#ca5":"#5c5";b+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:52px;">${$(_.name)}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${_.pct}%;background:${x};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${r(_.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${_.pct>50?"#c84":"#9e9a92"};">${_.pct}%</span>
            </div>`}}if(C.length===0&&z.length===0&&(b+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No positions to analyze</div>'),b+="</div>",b+='<div class="rr-section-bar">Actions</div>',b+='<div class="rr-section">',b+=`<div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Max single-deal size (${D}% reserve)</span>
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">${r(i)}</span>
    </div>`,O>50&&C.length>1){const _=C[0],x=Math.round(100/C.length),S=Math.round(a*x/100),be=_.exposure-S;b+=`<div style="padding:6px 8px;background:rgba(200,136,68,0.06);border:1px solid rgba(200,136,68,0.15);margin-bottom:6px;">
            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#c84;margin-bottom:2px;">DIVERSIFICATION TIP</div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;line-height:1.5;">
                ${$(_.name)} is ${_.pct}% of your book (target: ~${x}%).
                Reduce exposure by ~${r(be)} or grow positions in other nations.
            </div>
        </div>`}const ue=T.filter(_=>_.status==="LATE"||_.status==="DELINQUENT").length,k=[];E>=30&&k.push("reserves"),O<=40&&k.push("diversified"),ue===0&&k.push("no_delinquent"),T.length>=3&&k.push("scale");const P=k.length,U=P>=4?"EXCELLENT":P>=3?"GOOD":P>=2?"FAIR":"POOR",pe=P>=4?"#5c5":P>=3?"#ca5":P>=2?"#c84":"#c55";b+=`<div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">PORTFOLIO HEALTH</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${pe};">${U} (${P}/4)</span>
    </div>`,b+=`<div style="margin-top:4px;display:flex;gap:3px;">
        ${["Reserves","Diversified","No Defaults","Scale"].map((_,x)=>{const S=k.length>x&&k.includes(["reserves","diversified","no_delinquent","scale"][x]);return`<span style="flex:1;text-align:center;padding:2px 0;font-family:var(--font-mono);font-size:6px;font-weight:700;color:${S?"#5c5":"#6a6660"};border:1px solid ${S?"rgba(92,204,92,0.2)":"var(--panel-border)"};background:${S?"rgba(92,204,92,0.04)":"transparent"};">${S?"✓":"✗"} ${_}</span>`}).join("")}
    </div>`,b+="</div>",O>60&&C.length>0&&(b+=`<div class="rr-warning"><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c55;">CONCENTRATION WARNING: </span>${O}% of exposure is in ${$(C[0].name)}. A sovereign crisis or economic downturn in this nation would affect the majority of your portfolio. Consider diversifying across nations.</div>`),b+="</div>",b+=`<div class="df-footer" style="justify-content:space-between;">
        <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">DEPLOYABLE CAPITAL</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${i>0?"#5c5":"#c55"};">${r(i)}</div></div>
        <div style="text-align:right;"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">TOTAL EXPOSURE</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${r(a)}</div></div>
    </div>`,o.innerHTML=b}const Ye={REPAID:{color:"#5c5",label:"REPAID"},DEFAULTED:{color:"#c55",label:"DEFAULTED"},EXPIRED:{color:"#5c5",label:"EXPIRED"},CLAIMED:{color:"#c84",label:"CLAIMED"},MATURED:{color:"#5c5",label:"MATURED"},SOLD:{color:"#ca5",label:"SOLD EARLY"},FORECLOSED:{color:"#c55",label:"FORECLOSED"}};let H=[],Oe=-1;function wt(o){Oe=Oe===o?-1:o,ke()}function ke(){const o=document.getElementById("cc-container");if(!o)return;const t=H.reduce((f,e)=>f+(e.earned||0),0),s=H.reduce((f,e)=>f+(e.lost||0),0),a=H.reduce((f,e)=>f+(e.net||0),0),c=H.filter(f=>f.net>0).length,d=H.filter(f=>f.net<0).length,v=a>=0;let p=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Collections</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${H.length} RESOLVED</span>
    </div>`;if(p+=`<div class="cc-scorecard">
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">EARNED</div>
            <div class="cc-scorecard__value" style="color:#5c5;">${r(t)}</div>
        </div>
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">LOST</div>
            <div class="cc-scorecard__value" style="color:#c55;">${r(s)}</div>
        </div>
        <div class="cc-scorecard__cell" style="background:${v?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="cc-scorecard__label">NET P&amp;L</div>
            <div class="cc-scorecard__value" style="color:${v?"#5c5":"#c55"};">${v?"+":""}${r(a)}</div>
        </div>
    </div>`,H.length>0){const f=c/H.length*100;p+=`<div class="cc-winloss">
            <div class="cc-winloss__bar">
                <div style="width:${f}%;background:#5c5;height:100%;"></div>
                <div style="flex:1;background:#c55;height:100%;"></div>
            </div>
            <span class="cc-winloss__stat" style="color:#5c5;">${c}W</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&mdash;</span>
            <span class="cc-winloss__stat" style="color:#c55;">${d}L</span>
        </div>`}p+='<div class="cc-list">',H.length===0&&(p+='<div class="cc-empty">No resolved deals yet.<br>Completed loans, expired policies, and matured bonds appear here.</div>');for(let f=0;f<H.length;f++){const e=H[f],n=Se[e.type]||{class:"loan",label:e.type},l=Ye[e.outcome]||{color:"#9e9a92",label:e.outcome},i=Oe===f,w=e.net>=0;p+=`<div class="cc-deal" onclick="ccToggle(${f})" style="border-left:2px solid ${w?"#5c5":"#c55"};">
        <div class="cc-deal__inner" style="${i?"background:"+(e.type==="LOAN"?"rgba(90,138,170,0.08)":e.type==="INSURE"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,p+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${n.class}">${n.label}</span>
            <span style="font-size:11px;font-weight:600;color:var(--panel-text);flex:1;">${$(e.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${l.color};background:${l.color}12;border:1px solid ${l.color}25;">${l.label}</span>
        </div>`,p+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${$((e.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${$(e.resolved||"")}</span>
        </div>`,p+='<div class="df-metrics">',p+=`<div style="flex:1;padding:3px 8px;">
            <div class="df-metrics__label">PRINCIPAL</div>
            <div class="df-metrics__value" style="font-size:10px;color:var(--panel-text);margin-top:1px;">${r(e.principal||0)}</div>
        </div>`,p+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid var(--panel-border);">
            <div class="df-metrics__label">EARNED</div>
            <div class="df-metrics__value" style="font-size:10px;color:#5c5;margin-top:1px;">${r(e.earned||0)}</div>
        </div>`,e.lost>0&&(p+=`<div style="flex:0.8;padding:3px 8px;text-align:center;border-left:1px solid var(--panel-border);">
                <div class="df-metrics__label">LOST</div>
                <div class="df-metrics__value" style="font-size:10px;color:#c55;margin-top:1px;">${r(e.lost)}</div>
            </div>`),p+=`<div style="flex:1;padding:3px 8px;text-align:right;border-left:1px solid var(--panel-border);background:${w?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="df-metrics__label">NET</div>
            <div class="df-metrics__value" style="font-size:11px;color:${w?"#5c5":"#c55"};margin-top:1px;">${w?"+":""}${r(e.net||0)}</div>
        </div>`,p+="</div>",i&&(p+='<div class="cc-deal__expanded">',e.term&&(p+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">TERM</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${$(e.term)}</span>
                </div>`),e.rate&&(p+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">RATE</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${$(e.rate)}</span>
                </div>`),e.note&&(p+=`<div style="padding:4px 0;">
                    <div style="font-size:9px;color:${w?"#9e9a92":"#c84"};line-height:1.5;">${$(e.note)}</div>
                </div>`),p+="</div>"),p+="</div></div>"}p+="</div>",p+=`<div class="df-footer" style="justify-content:space-between;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">LIFETIME P&amp;L</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${v?"#5c5":"#c55"};">${v?"+":""}${r(a)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            ${Object.entries(H.reduce((f,e)=>(f[e.outcome]=(f[e.outcome]||0)+1,f),{})).map(([f,e])=>{const n=Ye[f]||{color:"#9e9a92",label:f};return`<div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:${n.color};letter-spacing:0.3px;">${n.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);">${e}</div>
                </div>`}).join("")}
        </div>
    </div>`,o.innerHTML=p}window.ccToggle=wt;const $t={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let g=null,L="LOAN",J=8,oe=18e6,we=24,I="equipment",ye="",ce=3.5,K=12e6,ie=10,De="",q=25e6;const Ie=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function Et(o){const t=X[o];t&&(g=t,L=t.type,t.type==="LOAN"?(J=8,oe=t.amount,we=t.term||24,I=t.collateral||"unsecured",ye=""):t.type==="INSURE"?(ce=t.isVesselInsurance?1.75:3.5,K=t.amount,ie=10,De=""):t.type==="BOND"&&(q=Math.round(t.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",de())}function Xe(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",g=null}function Nt(o){J=Number(o),de()}function At(o){I=o,de()}function Rt(o){ye=o}function Lt(o){ce=Number(o),de()}function Tt(o){K=Number(o),de()}function Ct(o){ie=Number(o),de()}function It(o){q=Number(o),de()}function me(o,t,s){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(o/t*100,100)}%;background:${s};"></div></div>`}function de(){const o=document.getElementById("rd-modal");if(!o||!g)return;const t=g,s=L==="LOAN"?"#5a8aaa":L==="INSURE"?"#aa7a5a":"#8a6aaa",a=Math.round(oe*(J/100)*(we/12)),c=Math.round((oe+a)/we),d=t.revenue||474e5,v=Math.round(c/d*1200),p=12,f=Math.max(0,(J-6)*1.5),e=oe>15e6?3:0,n=I==="none"?3:I==="full"?-2:0,l=Number(t.corp_debt||0),i=Number(t.corp_cash_reserves||1),w=l>0?Math.min(15,Math.round(l/Math.max(i,1)*5)):0,h=Math.min(60,Math.max(2,Math.round(p+f+e+n+w))),N=h<=15?"#5c5":h<=30?"#ca5":h<=45?"#c84":"#c55",E=h<=15?"LOW":h<=30?"MODERATE":h<=45?"ELEVATED":"HIGH",D=95,R=(J-4)*8,A=oe<(t.amount||18e6)?10:0,Y=I==="full"?15:I==="property"?8:I==="none"?-5:0,C=Math.max(10,Math.min(95,Math.round(D-R-A-Y))),M=C>=70?"#5c5":C>=45?"#ca5":C>=25?"#c84":"#c55",z={unsecured:"none",equipment:"equipment",property:"property"},O=Ie.find(j=>j.id===(z[I]||I))||Ie[0],te=Math.round(a*(1-h/100)),se=(t.term||18)/12,b=Math.round(K*(ce/100)*se),ue=100-(t.reputation||50),k=Math.max(5,Math.min(50,Math.round(ue*.4))),P=Math.round(K*(1-ie/100)),U=Math.round(P*(k/100)),pe=b-U,_=k<=12?"#5c5":k<=22?"#ca5":k<=35?"#c84":"#c55",x=t.couponRate||6.2,S=t.term||60,be=S/12,Qe=Math.round(q*(x/100)),Pe=Math.round(q*(x/100)*be),fe=t.stability||50,ze=t.creditRating||50,Ue=t.debtToGdp||30,Ke=Math.max(2,Math.round((100-fe)*.15+(100-ze)*.15+Math.max(0,Ue-30)*.3)),ae=Math.min(60,Ke),Ae=ae<=10?"#5c5":ae<=20?"#ca5":ae<=35?"#c84":"#c55",qe=Math.round(Pe*(1-ae/100));let u=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${s};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>`;if(u+=`<div class="rd-tabs">
        <span class="rd-tab ${L==="LOAN"?"active-loan":L==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${L==="LOAN"?"Loan":L==="INSURE"?"Insure":"Bond"} — ${$(t.applicant)}</span>
    </div></div>`,u+='<div class="rd-body">',u+='<div class="rd-left">',L==="LOAN"){const j=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84";u+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${$(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${$(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${$(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">CASH</div><div class="rd-applicant__stat-value" style="color:#5c5;">${r(t.corp_cash_reserves||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${r(t.corp_debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${j};">${t.reputation||"—"}</div></div>
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
        </div>`,u+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const W=(J-3)/15*100;u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${J}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${J}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${W}%,var(--panel-border) ${W}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`,u+=`<div class="rd-control">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">Borrower's Request</div>
            <div class="rd-risk-row"><span class="rd-risk-label">LOAN AMOUNT</span><span class="rd-risk-value" style="color:var(--panel-text);">${r(oe)}</span></div>
            <div class="rd-risk-row"><span class="rd-risk-label">TERM</span><span class="rd-risk-value" style="color:var(--panel-text);">${we}mo</span></div>
        </div>`,u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">REQUIRE COLLATERAL</span>
                <span class="rd-control__value" style="font-size:12px;color:#5a8aaa;">${O.label}</span>
            </div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                ${Ie.map(B=>`<div onclick="rdSetLoanCollateral('${B.id}')" style="
                    flex:1;padding:6px 4px;text-align:center;
                    font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;
                    background:${I===B.id||(z[I]||I)===B.id?"rgba(90,138,170,0.12)":"transparent"};
                    border:1px solid ${I===B.id||(z[I]||I)===B.id?"rgba(90,138,170,0.3)":"var(--panel-border)"};
                    color:${I===B.id||(z[I]||I)===B.id?"#5a8aaa":"#6a6660"};
                    cursor:pointer;
                ">${B.label}</div>`).join("")}
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:6px;">
                ${O.id==="none"?"No collateral. Higher risk, lower acceptance chance.":O.id==="equipment"?"Borrower pledges equipment as security. Moderate risk reduction.":"Borrower pledges property. Strongest security, highest acceptance."}
            </div>
        </div>`,u+=`<div class="rd-control">
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
        </div>`}if(L==="INSURE"){const j=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84",W=t.projectValue?"PROJECT":"FLEET",B=t.projectValue||t.fleetValue||0;u+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${$(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${$(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${$(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${j};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${W}</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${r(B)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${r(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${t.term}mo</div></div>
            </div>
        </div>`,t.purpose&&t.purpose!=="Construction Insurance"&&(u+=`<div style="padding:8px 14px;background:rgba(170,122,90,0.04);border-bottom:1px solid rgba(170,122,90,0.12);">
                <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#aa7a5a;letter-spacing:0.8px;margin-bottom:3px;">REQUESTED COVERAGE</div>
                <div style="font-size:10px;color:var(--panel-text);line-height:1.5;white-space:pre-wrap;">${$(t.purpose)}</div>
            </div>`),u+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const ve=!!g.isVesselInsurance,re=ve?.5:1,F=ve?4:8,Le=ve?.25:.5,Be=F>re?(ce-re)/(F-re)*100:0;u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${ce}%</span>
            </div>
            <input type="range" class="rd-control__range" min="${re}" max="${F}" step="${Le}" value="${ce}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${Be}%,var(--panel-border) ${Be}%);">
            <div class="rd-control__hints"><span>${re}% (competitive)</span><span>${F}% (expensive)</span></div>
        </div>`;const Te=Math.round((t.projectValue||t.fleetValue||t.amount)*.7),ge=Math.round(t.amount*.33),Fe=(K-ge)/(Te-ge)*100;u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:var(--panel-text);">${r(K)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${ge}" max="${Te}" step="1000000" value="${K}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${Fe}%,var(--panel-border) ${Fe}%);">
            <div class="rd-control__hints"><span>${r(ge)} (partial)</span><span>${r(Te)} (max)</span></div>
        </div>`,u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:var(--panel-text);">${ie}%</span>
            </div>
            <div class="rd-presets">`;for(const Ce of[5,10,15,20,25])u+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${Ce})" style="${ie===Ce?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${Ce}%</span>`;u+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${ie}% of any claim (${r(Math.round(K*ie/100))})</div>
        </div>`,u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">WHAT WE AGREE TO COVER</span>
            </div>
            <textarea id="rd-policy-terms" rows="3" placeholder="e.g., Covers weather delays, material damage, and labor disputes. Excludes negligence and acts of war. Maximum payout per claim: 50% of coverage."
                style="width:100%;box-sizing:border-box;padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--panel-text);background:var(--panel-main);border:1px solid var(--panel-border);resize:vertical;line-height:1.5;"
                oninput="rdPolicyTerms=this.value">${De||""}</textarea>
        </div>`}if(L==="BOND"){const j=fe>=50?"#5c5":fe>=30?"#ca5":fe>=15?"#c84":"#c55";u+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${$(t.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${$(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${r(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${x}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${S}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${j};">${fe}</div></div>
            </div>
        </div>`,u+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const W=t.amount,B=Math.max(5e6,Math.ceil(W*.05/5e6)*5e6),ve=(q-B)/(W-B)*100;u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${r(q)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${B}" max="${W}" step="5000000" value="${q}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${ve}%,var(--panel-border) ${ve}%);">
            <div class="rd-control__hints"><span>${r(B)} (small position)</span><span>${r(W)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,u+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const re=[{key:"stability",value:fe,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:Ue,label:"Debt burden",invert:!0},{key:"credit_rating",value:ze,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:t.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:t.corruption||62,label:"Institutional risk",invert:!0}];for(const F of re){const Le=F.invert?F.value>60?"#c55":F.value>40?"#ca5":"#5c5":F.value>=50?"#5c5":F.value>=30?"#ca5":F.value>=15?"#c84":"#c55";u+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${F.key}</span>
                <div style="width:40px;">${me(F.value,100,Le)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:18px;text-align:right;">${F.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${F.label}</span>
            </div>`}u+="</div>"}if(u+="</div>",u+='<div class="rd-right">',L==="LOAN"){u+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${N};">${h}%</span>
            </div>
            ${me(h,100,N)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${N};margin-top:4px;">${E}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,u+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${M};">${C}%</span>
            </div>
            ${me(C,100,M)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,u+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',u+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${r(oe)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${r(a)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${r(c)}</span></div>`;const j=v>30?"#c55":v>15?"#ca5":"#5c5";u+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${j};">${v}% of revenue</span></div>`,u+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${r(te)}</span></div>`,u+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${h}% default)</div>`}if(L==="INSURE"){u+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${_};">${k}%</span>
            </div>
            ${me(k,100,_)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,u+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',u+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${r(P)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${r(b)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${r(U)}</span></div>`;const j=pe>0?"":" negative",W=pe>0?"#5c5":"#c55";u+=`<div class="rd-expected${j}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${W};">${r(pe)}</span></div>`,u+=`<div class="rd-formula">Premiums (${r(b)}) − expected payout (${k}% × ${r(P)})</div>`}L==="BOND"&&(u+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${Ae};">${ae}%</span>
            </div>
            ${me(ae,100,Ae)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,u+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',u+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${r(q)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${r(Qe)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(be)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${r(Pe)}</span></div>`,u+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${r(qe)}</span></div>`,u+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${ae}% default)</div>`),u+="</div>",u+="</div>";const Je=L==="LOAN"?oe:L==="INSURE"?K:q,Ze=L==="LOAN"?te:L==="INSURE"?pe:qe,et=L==="LOAN"?h:L==="INSURE"?k:ae,tt=L==="LOAN"?N:L==="INSURE"?_:Ae,at=L==="LOAN"?"OFFER LOAN":L==="INSURE"?"WRITE POLICY":"BUY BONDS",ot=L.toLowerCase(),Re=!!t.alreadyOffered,nt=Re?"disabled":"",it=Re?' title="You already have an offer on this request."':"",st=Re?"ALREADY OFFERED":at;u+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${r(Je)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${r(Ze)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${tt};">${et}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${ot}" onclick="rdSubmitOffer()" ${nt}${it}>${st}</button>
        </div>
    </div>`,o.innerHTML=u}window.rdOpen=Et;window.rdClose=Xe;window.rdSetLoanRate=Nt;window.rdSetLoanCollateral=At;window.rdSetLoanTermsText=Rt;window.rdSetInsurePremium=Lt;window.rdSetInsureCoverage=Tt;window.rdSetInsureDeductible=Ct;window.rdSetBondAmount=It;let V=!1;async function Ot(){if(!g||!m||!G||V)return;if(g.alreadyOffered){alert("You already submitted an offer for this request.");return}V=!0;const o=G.current_tick||0,[t,s]=await Promise.all([y.from("factions").select("corp_cash_reserves").eq("id",m.id).single(),y.from("finance_active_loans").select("principal, total_paid, finance_loan_requests!inner(request_type)").eq("lender_faction_id",m.id).in("status",["current","late","delinquent"])]);if(t.error||s.error){alert("Could not verify current cash or portfolio. Try again."),V=!1;return}const a=Number(t.data?.corp_cash_reserves)||0,c=(s.data||[]).map(d=>{const v=d.finance_loan_requests?.request_type,p=v==="insurance"?"INSURE":v==="bond"?"BOND":"LOAN",f=Number(d.principal)||0,e=Number(d.total_paid)||0;return{type:p,principal:f,remaining:p==="INSURE"?0:Math.max(0,f-e),coverage:p==="INSURE"?f:0,faceValue:p==="BOND"?f:0}});if(m&&(m.corp_cash_reserves=a),g.type==="LOAN"){const d=J;if(d<1||d>20){alert("Interest rate must be 1-20%."),V=!1;return}const v=je(a,c,_e,$e);if(g.amount>v.deployable){const l=v.limiter==="lending_cap"?`Lending cap (${v.lendingCapPct}% of total capital = ${r(v.lendingCap)}). Already deployed ${r(v.totalDeployed)}.`:`Reserve requirement (${Math.round(v.reserveReqPct*100)}% of exposure = ${r(v.requiredReserve)}). Cash ${r(v.cash)}.`;alert(`Insufficient deployable capital.
${l}
Available: ${r(v.deployable)}
This loan: ${r(g.amount)}`+(v.limiter==="lending_cap"&&_e===0?`

Build a Branch Office to raise your lending cap (+15% each).`:"")),V=!1;return}if(a<g.amount){alert("Insufficient cash reserves to fund this loan."),V=!1;return}const f={none:"unsecured",equipment:"equipment",property:"property",full:"property"}[I]||"unsecured",e={request_id:g.requestId,offering_faction_id:m.id,interest_rate:d,collateral_type:f,created_tick:o};ye.trim()&&(e.offer_terms=ye.trim());const{error:n}=await y.from("finance_loan_offers").insert(e);if(n){V=!1,n.message.includes("unique")||n.message.includes("duplicate")?alert("You have already submitted an offer for this loan request."):alert("Failed to submit offer: "+n.message);return}}else if(g.type==="BOND"){if(a<q){alert("Insufficient cash reserves. Need "+r(q)+", have "+r(a)+"."),V=!1;return}const{error:d}=await y.from("finance_loan_offers").insert({request_id:g.requestId,offering_faction_id:m.id,interest_rate:g.couponRate,collateral_type:"unsecured",status:"accepted",created_tick:o});if(d){alert("Failed to buy bonds: "+d.message),V=!1;return}const v=g.couponRate/100/12;g.term;const p=Math.round(q*v),{data:f,error:e}=await y.from("finance_loan_requests").select("requesting_faction_id").eq("id",g.requestId).single();if(e||!f?.requesting_faction_id){alert("Failed to create bond position: could not resolve issuer faction."),V=!1;return}const{error:n}=await y.from("finance_active_loans").insert({request_id:g.requestId,offer_id:null,borrower_faction_id:f.requesting_faction_id,lender_faction_id:m.id,nation_id:g.nation_id||m.nation_id,principal:q,interest_rate:g.couponRate,term_months:g.term,collateral_type:"unsecured",purpose:g.purpose,monthly_payment:p,started_tick:o});if(n){alert("Failed to create bond position: "+n.message),V=!1;return}await y.from("factions").update({corp_cash_reserves:Math.max(0,a-q)}).eq("id",m.id);const{data:l}=await y.from("nations").select("debt").eq("id",g.nation_id).single();if(l){const{error:i}=await y.from("nations").update({debt:Number(l.debt||0)+q}).eq("id",g.nation_id);i&&console.warn("[Bonds] Failed to update nation debt:",i.message)}m.corp_cash_reserves=Math.max(0,a-q)}else if(g.type==="INSURE"){const d=ce,v=K,p=ie,f=Math.round(v*(d/100)/12),{error:e}=await y.from("finance_loan_offers").insert({request_id:g.requestId,offering_faction_id:m.id,interest_rate:d,collateral_type:"unsecured",status:"accepted",created_tick:o});if(e){V=!1,e.message.includes("unique")||e.message.includes("duplicate")?alert("You have already submitted a policy offer for this request."):alert("Failed to write policy: "+e.message);return}const{data:n}=await y.from("finance_loan_requests").update({status:"funded",funded_tick:o}).eq("id",g.requestId).select("requesting_faction_id").single(),l={request_id:g.requestId,offer_id:null,borrower_faction_id:n?.requesting_faction_id||g.requestingFactionId,lender_faction_id:m.id,nation_id:m.nation_id,principal:v,interest_rate:d,term_months:0,collateral_type:"unsecured",purpose:g.isVesselInsurance?"Vessel Insurance — "+g.applicant:"Insurance Policy — "+g.applicant,monthly_payment:f,started_tick:o,deductible_pct:p,policy_terms:De.trim()||null};g.insuredVesselId&&(l.insured_vessel_id=g.insuredVesselId),g.insuredContractId&&(l.insured_contract_id=g.insuredContractId);const{error:i}=await y.from("finance_active_loans").insert(l);if(i){alert("Failed to create policy record: "+i.message),V=!1;return}}else{V=!1;return}Xe(),Z=-1,await Promise.all([We(),ee()]),V=!1}window.rdSubmitOffer=Ot;async function ee(){if(!m){Q();return}const{data:o}=await y.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",m.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"},s=a=>a.finance_loan_requests?.request_type==="insurance";T=(o||[]).map(a=>({id:a.id,type:t[a.finance_loan_requests?.request_type]||"LOAN",counterparty:a.borrower?.faction_name||"Unknown",abbr:a.borrower?.abbreviation||a.borrower?.corp_ticker||"??",nation:a.loan_nation?.name||a.borrower?.nation||"Unknown",remaining:s(a)?0:a.principal-a.total_paid,principal:a.principal,earned:s(a)?(a.monthly_payment||0)*(a.payments_made||0):a.total_interest_paid||0,rate:a.interest_rate,term:a.term_months,paymentsMade:a.payments_made,paymentsMissed:a.payments_missed,monthlyPayment:a.monthly_payment,status:a.status.toUpperCase(),collateral:a.collateral_type,purpose:a.purpose||"",alert:a.status==="late"||a.status==="delinquent",alertLevel:a.status==="delinquent"?"red":a.status==="late"?"orange":null,alertMsg:a.status==="delinquent"?`${a.payments_missed} missed payments. Default imminent.`:a.status==="late"?`${a.payments_missed} missed payment${a.payments_missed>1?"s":""}. Monitor closely.`:null,coverage:s(a)?a.principal:void 0,premiumsCollected:s(a)?(a.monthly_payment||0)*(a.payments_made||0):void 0,paidOut:s(a)?a.claims_paid||0:void 0,claims:s(a)?a.claims_count||0:void 0,deductible:s(a)?a.deductible_pct||0:void 0})),Q()}async function kt(){if(!m){ke();return}const{data:o}=await y.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",m.id).in("status",["repaid","defaulted"]).order("completed_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"};H=(o||[]).map(s=>{const a=s.total_interest_paid||0,c=s.status==="defaulted"?Math.max(0,s.principal-s.total_paid):0;return{type:t[s.finance_loan_requests?.request_type]||"LOAN",counterparty:s.borrower?.faction_name||"Unknown",abbr:s.borrower?.abbreviation||s.borrower?.corp_ticker||"??",nation:s.loan_nation?.name||s.borrower?.nation||"",outcome:s.status==="repaid"?"REPAID":"DEFAULTED",principal:s.principal,earned:a,lost:c,net:a-c,resolved:s.completed_tick?"Tick "+s.completed_tick:"",term:s.term_months+"mo",rate:s.interest_rate+"%",note:s.status==="repaid"?`Fully repaid over ${s.payments_made} payments.`:`Defaulted after ${s.payments_missed} missed payments. ${s.collateral_type!=="unsecured"?"Collateral ("+s.collateral_type+") partially recovered losses.":"Unsecured — no collateral recovery."}`}}),ke()}function Me(o){const t=new URL("corp-operations.html",window.location.href);t.search=window.location.search;const s=t.searchParams;s.set("tab",o),t.search=s.toString()?`?${s.toString()}`:"",window.location.href=t.toString()}function St(o){o?.preventDefault&&o.preventDefault(),Me("expansion")}function Dt(o){o?.preventDefault&&o.preventDefault(),Me("actions")}async function Mt(){const o=new URLSearchParams(window.location.search).get("tab"),t=o==="expansion"||o==="actions",s=t?o:"operations",{data:{user:a}}=await y.auth.getUser();if(!a){window.location.href="login.html";return}const{data:c}=await y.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);ne=(c||[]).filter(e=>e.nation_id);const d=sessionStorage.getItem("active_faction_id");if(m=ne.find(e=>e.id===d)||ne.find(e=>e.faction_type==="corporation")||ne[0],!m){await y.auth.signOut(),window.location.href="login.html";return}if(m.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(m.corp_sector!=="Finance"){const e={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html"};window.location.href=(e[m.corp_sector]||"corp-operations.html")+window.location.search;return}if(t){Me(o);return}sessionStorage.setItem("active_faction_id",m.id);const[v,p]=await Promise.all([m.nation_id?y.from("nations").select("*").eq("id",m.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);v.data&&v.data,G=p.data;const f=document.getElementById("corp-topbar-container");if(f){const{renderCorpTopBar:e}=await rt(async()=>{const{renderCorpTopBar:n}=await import("./corp-topbar-C3V4L7WY.js");return{renderCorpTopBar:n}},__vite__mapDeps([0,1]));e(f,{faction:m,shard:G,activeTab:s,allUserFactions:ne})}if(Pt(),m.nation_id){const{data:e}=await y.from("active_laws").select("id, policy:policies!policy_id(policy_key)").eq("nation_id",m.nation_id).limit(100);$e=(e||[]).some(n=>n.policy?.policy_key?.startsWith("financial_sector_deregulation"))}{const{data:e}=await y.from("corp_properties").select("id").eq("faction_id",m.id).eq("type","branch_office").eq("is_active",!0);_e=e?.length||0}if(await We(),await ee(),ht(),await kt(),G?.next_tick_at){const e=(Number(G.tick_interval_hours)||8)*36e5,n=new Date(G.next_tick_at).getTime(),i=n-e+e/2,w=new Date(i>Date.now()?i:n+e/2);Bt(w)}}function Pt(){const o=document.getElementById("corp-faction-dropdown");if(!o||ne.length<=1)return;let t="";for(const s of ne){const a=s.id===m.id,c=s.faction_type==="corporation"?"CORP":"PARTY";t+=`<div class="corp-faction-dropdown__item${a?" active":""}" onclick="switchFaction('${s.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${s.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${s.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${s.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${c}</span>
            <span>${$(s.faction_name||"--")}</span>
        </div>`}o.innerHTML=t}function zt(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function Ut(o){sessionStorage.setItem("active_faction_id",o);const t=ne.find(s=>s.id===o);t&&t.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}async function qt(){await y.auth.signOut(),window.location.href="login.html"}function Bt(o){const t=document.getElementById("tick-countdown");if(!t)return;function s(){const a=new Date(o)-new Date;if(a<=0){t.textContent="Processing...";return}const c=Math.floor(a/36e5),d=Math.floor(a%36e5/6e4),v=Math.floor(a%6e4/1e3);t.textContent=`${c}h ${d}m ${v}s`}s(),setInterval(s,1e3)}window.toggleCorpDropdown=zt;window.switchFaction=Ut;window.doLogout=qt;window.switchToExpansion=St;window.switchToActions=Dt;Mt();
