const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-C3V4L7WY.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as y}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as rt}from"./preload-helper-BXl3LOEh.js";import{e as E}from"./utils-CY90Gazr.js";let oe=[],_=null,H=null,$e=!1,_e=0;function je(o,t,n,a){const l=t.filter($=>$.type==="LOAN").reduce(($,I)=>$+(I.remaining||0),0),d=t.filter($=>$.type==="INSURE").reduce(($,I)=>$+(I.coverage||0),0),m=t.filter($=>$.type==="BOND").reduce(($,I)=>$+(I.faceValue||0),0),p=l+d+m,f=t.reduce(($,I)=>$+(I.principal||I.coverage||I.faceValue||0),0),e=a?.12:.15,s=Math.round(p*e),c=Math.max(0,o-s),i=Math.min(100,50+(n||0)*15),w=Math.round(o*i/100),x=Math.max(0,w-f),A=Math.min(c,x),N=x<c?"lending_cap":"reserve_ratio";return{cash:o,totalExposure:p,totalDeployed:f,loanExposure:l,insureExposure:d,bondExposure:m,reserveReqPct:e,requiredReserve:s,reserveAvail:c,lendingCapPct:i,lendingCap:w,capAvail:x,deployable:A,limiter:N}}function r(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+Math.round(o).toLocaleString()}const De={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},lt={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}};let X=[],xe="ALL",le="all",Z=-1;async function We(){if(!_||!H)return;const{data:o,error:t}=await y.from("finance_loan_requests").select("*, requesting_faction:factions!requesting_faction_id(id, faction_name, abbreviation, corp_ticker, corp_subsector, nation_id, corp_cash_reserves, corp_debt, corp_reputation), issuer_nation:nations!issuer_nation_id(id, name, stability, credit, debt, gdp, gdp_growth, corruption)").eq("status","open").order("created_tick",{ascending:!1});t&&console.error("[DealFlow] Request query error:",t.message);const n=[...new Set((o||[]).filter(e=>e.requesting_faction?.nation_id).map(e=>e.requesting_faction.nation_id))];let a={};if(n.length>0){const{data:e}=await y.from("nations").select("id, name, stability, credit, gdp, gdp_growth, corruption, debt").in("id",n);for(const s of e||[])a[s.id]=s}const{data:l}=await y.from("finance_loan_offers").select("request_id").eq("offering_faction_id",_.id),d=new Set((l||[]).map(e=>e.request_id)),m=[...new Set((o||[]).filter(e=>e.requesting_faction?.id).map(e=>e.requesting_faction.id))];let p={};if(m.length>0){const{data:e}=await y.from("finance_active_loans").select("borrower_faction_id, principal, total_paid").in("borrower_faction_id",m).in("status",["current","late","delinquent"]);for(const c of e||[]){p[c.borrower_faction_id]||(p[c.borrower_faction_id]={count:0,totalOutstanding:0}),p[c.borrower_faction_id].count++;const i=Math.max(0,Number(c.principal||0)-Number(c.total_paid||0));p[c.borrower_faction_id].totalOutstanding+=i}const{data:s}=await y.from("subsidiary_auto_policies").select("borrower_faction_id, principal, remaining_principal").in("borrower_faction_id",m).eq("service_type","loan").eq("status","active");for(const c of s||[])p[c.borrower_faction_id]||(p[c.borrower_faction_id]={count:0,totalOutstanding:0}),p[c.borrower_faction_id].count++,p[c.borrower_faction_id].totalOutstanding+=Number(c.remaining_principal||c.principal||0)}const f=(_.corp_subsector||"").toLowerCase();X=(o||[]).filter(e=>e.request_type==="bond"?f==="investment":e.request_type==="insurance"?f==="insurance":f==="banking").map(e=>{if(e.request_type==="bond"){const s=e.issuer_nation,c=Number(s?.stability??50),i=Number(s?.credit??50),w=Number(s?.gdp??1),x=Number(s?.debt??0),A=w>0?Math.round(x/w*100):0;return{id:e.id,type:"BOND",applicant:s?.name||"Unknown Nation",abbr:(s?.name||"??").slice(0,3).toUpperCase(),entity:"GOV",nation:s?.name||"N/A",nation_id:e.issuer_nation_id,amount:e.amount||0,term:e.term_months,couponRate:Number(e.coupon_rate||5),purpose:e.purpose||"Government Bond",stability:c,creditRating:i,debtToGdp:A,gdpGrowth:Number(s?.gdp_growth??50),corruption:Number(s?.corruption??50),risk:c>=60&&i>=50?"LOW":c>=35&&i>=30?"MODERATE":"HIGH",isNew:!d.has(e.id),ticksLeft:(e.expires_tick||0)-(H?.current_tick||0),requestId:e.id,alreadyOffered:d.has(e.id)}}if(e.request_type==="insurance"){const s=Number(e.requesting_faction?.corp_reputation??50),c=Number(a[e.requesting_faction?.nation_id]?.stability??50);return{id:e.id,type:"INSURE",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:a[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,amount:e.amount||0,term:e.term_months||0,purpose:e.purpose||"Construction Insurance",reputation:s,projectValue:e.amount||0,stability:c,risk:s>=60&&c>=50?"LOW":s>=35?"MODERATE":"HIGH",isNew:!d.has(e.id),ticksLeft:(e.expires_tick||0)-(H?.current_tick||0),requestId:e.id,insuredContractId:e.insured_contract_id,insuredVesselId:e.insured_vessel_id,isVesselInsurance:!!e.insured_vessel_id,alreadyOffered:d.has(e.id),requestingFactionId:e.requesting_faction?.id}}return{id:e.id,type:"LOAN",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:a[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,requestingFactionId:e.requesting_faction?.id,amount:e.amount,term:e.term_months,purpose:e.purpose||"",reputation:Number(e.requesting_faction?.corp_reputation??50),revenue:Number(e.requesting_faction?.corp_cash_reserves??0),corp_cash_reserves:Number(e.requesting_faction?.corp_cash_reserves??0),corp_debt:Number(e.requesting_faction?.corp_debt??0),activeLoans:(p[e.requesting_faction?.id]||{}).count||0,totalOutstanding:(p[e.requesting_faction?.id]||{}).totalOutstanding||0,creditRating:Number(a[e.requesting_faction?.nation_id]?.credit??50),stability:Number(a[e.requesting_faction?.nation_id]?.stability??50),risk:(()=>{const s=Number(a[e.requesting_faction?.nation_id]?.credit??50),c=Number(e.requesting_faction?.corp_reputation??50);return s>=60&&c>=60?"LOW":s>=35&&c>=35?"MODERATE":s>=20||c>=20?"ELEVATED":"HIGH"})(),isNew:!d.has(e.id),ticksLeft:(e.expires_tick||0)-(H?.current_tick||0),collateral:e.collateral_type||"unsecured",requestId:e.id,alreadyOffered:d.has(e.id)}}),Ne()}function Ve(o){if(!_)return!1;const t=(_.corp_subsector||"").toLowerCase(),n=$t[t];return o.type===n}function ct(o){xe=o,Z=-1,Ne()}function dt(o){Z=Z===o?-1:o,Ne()}function Ne(){const o=document.getElementById("df-container");if(!o)return;let t=xe==="ALL"?X:X.filter(e=>e.type===xe);le==="mine"&&_?.nation_id&&(t=t.filter(e=>e.nation_id===_.nation_id));const n=X.filter(e=>e.isNew).length,a=X.length;let l=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
            ${n>0?`<span class="df-badge df-badge-corp">${n} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:12px;color:#6a6660;">${a} OPEN</span>
        </div>
    </div>`;const d=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];l+='<div class="df-filters">';for(const e of d)l+=`<span class="df-pill${xe===e.id?" "+e.activeClass:""}" onclick="dfSetFilter('${e.id}')">${e.label}</span>`;l+=`<span style="margin-left:auto;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.5px;cursor:pointer;padding:6px 10px;border:1px solid ${le==="mine"?"#5c544":"var(--panel-border)"};color:${le==="mine"?"#5c5":"#6a6660"};background:${le==="mine"?"rgba(92,204,92,0.06)":"transparent"};" onclick="dfToggleNation()">${le==="mine"?"MY NATION":"ALL NATIONS"}</span>`,l+="</div>",l+='<div class="df-list">',t.length===0&&(l+='<div class="ap-empty">No deals available.<br>Deals appear when corporations request financing or governments issue bonds.</div>');for(let e=0;e<t.length;e++){const s=t[e],c=X.indexOf(s),i=Z===c,w=De[s.type],x=lt[s.risk],A=Ve(s);l+=`<div class="df-deal${i?" sel-"+w.class:""}" onclick="dfSelectDeal(${c})" style="${A?"":"opacity:0.5;"}">`,s.isNew&&A&&(l+='<div class="df-new-dot"></div>'),l+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <span class="df-badge df-badge-${w.class}">${w.label}</span>
            <span style="font-size:15px;font-weight:600;color:var(--panel-text);">${E(s.applicant)}</span>
            <span class="df-badge df-badge-${s.entity.toLowerCase()}">${s.entity}</span>
            ${A?"":'<span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`;const N=x.class==="df-risk-low"?"#5c5":x.class==="df-risk-moderate"?"#ca5":x.class==="df-risk-elevated"?"#c84":"#c55";l+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span class="df-badge df-badge-nation">${E(s.nation.toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:2px 7px;line-height:16px;color:${N};background:${N}12;border:1px solid ${N}25;">${x.label}</span>
        </div>`;const $=s.type==="BOND"?"FACE VALUE":s.type==="INSURE"?"COVERAGE":"AMOUNT",I=s.type==="BOND"?"COUPON":"REP",G=s.type==="BOND"?s.couponRate+"%":s.reputation||s.stability,Y=s.type==="BOND"?s.couponRate*10:s.reputation||s.stability,L=s.type==="BOND"?"#c8a832":Y>=60?"#5c5":Y>=35?"#ca5":"#c84";if(l+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${$}</div>
                <div class="df-metrics__value" style="font-size:15px;color:var(--panel-text);">${r(s.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:14px;color:var(--panel-text);">${s.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${I}</div>
                <div class="df-metrics__value" style="font-size:14px;color:${L};">${G}</div>
            </div>
        </div>`,i){if(l+=`<div style="margin-top:8px;font-size:13px;color:#9e9a92;line-height:1.5;margin-bottom:8px;">${E(s.purpose)}</div>`,A)l+='<div class="df-detail">';else{const S=s.type==="LOAN"?"Banking":s.type==="INSURE"?"Insurance":"Investment";l+=`<div style="padding:8px 10px;background:rgba(106,102,96,0.06);border:1px solid var(--panel-border);font-family:var(--font-mono);font-size:11px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:var(--panel-text);font-weight:700;">${S}</span> subsector to underwrite.
                    ${_?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+E(_.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(A){if(s.type==="LOAN"){const S=s.corp_cash_reserves>0?Math.round(s.corp_debt/s.corp_cash_reserves*100):0,P=S>50?"#c84":"#5c5",O=s.corp_debt>s.corp_cash_reserves*.5?"#c84":"#9e9a92";l+=`<div class="df-detail-row"><span class="df-detail-label">CASH</span><span class="df-detail-value" style="color:#9e9a92;">${r(s.corp_cash_reserves)}</span></div>`,l+=`<div class="df-detail-row"><span class="df-detail-label">DEBT</span><span class="df-detail-value" style="color:${O};">${r(s.corp_debt)}</span></div>`,l+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/CASH</span><span class="df-detail-value" style="color:${P};font-weight:700;">${S}%</span></div>`}else if(s.type==="BOND"){const S=s.stability>=50?"#5c5":s.stability>=30?"#ca5":"#c84",P=s.debtToGdp>60?"#c55":s.debtToGdp>40?"#c84":"#5c5",O=s.creditRating>=60?"#5c5":s.creditRating>=35?"#ca5":"#c55";l+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${S};">${s.stability}/100</span></div>`,l+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${P};">${s.debtToGdp}%</span></div>`,l+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${O};font-weight:700;">${s.creditRating}/100</span></div>`}else if(s.type==="INSURE"){const S=s.reputation>=60?"#5c5":s.reputation>=35?"#ca5":"#c84",P=s.projectValue?"PROJECT VALUE":"FLEET VALUE",O=s.projectValue||s.fleetValue;l+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${S};">${s.reputation}/100</span></div>`,l+=`<div class="df-detail-row"><span class="df-detail-label">${P}</span><span class="df-detail-value" style="color:#9e9a92;">${r(O)}</span></div>`}l+="</div>"}}l+="</div>"}l+="</div>";const m=X.filter(e=>e.type==="LOAN").length,p=X.filter(e=>e.type==="INSURE").length,f=X.filter(e=>e.type==="BOND").length;l+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${m}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${p}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${f}</span></div>
        </div>
        ${(()=>{const e=Z>=0?X[Z]:null,s=e&&Ve(e);return s?`<div class="df-review-btn active" onclick="rdOpen(${Z})">REVIEW DEAL</div>`:e&&!s?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,o.innerHTML=l}function pt(){le=le==="all"?"mine":"all",Z=-1,Ne()}window.dfSetFilter=ct;window.dfToggleNation=pt;window.dfSelectDeal=dt;const He={CURRENT:{color:"#5c5",label:"CURRENT"},LATE:{color:"#c84",label:"LATE"},DELINQUENT:{color:"#c55",label:"DELINQUENT"},CLAIM:{color:"#c55",label:"CLAIM FILED"},ACTIVE:{color:"#5c5",label:"ACTIVE"},WATCHLIST:{color:"#ca5",label:"WATCHLIST"},DEFAULT:{color:"#c55",label:"DEFAULT"}};let T=[],he="ALL",Ee=-1;function ft(o){he=o,Ee=-1,Q()}function vt(o){Ee=Ee===o?-1:o,Q()}function Q(){const o=document.getElementById("ap-container");if(!o)return;const t=he==="ALL"?T:T.filter(c=>c.type===he),n=T.reduce((c,i)=>c+(i.remaining||i.coverage||i.faceValue||0),0),a=T.reduce((c,i)=>c+(i.earned||i.premiumsCollected||i.couponsReceived||0),0),l=T.filter(c=>c.alert).length;let d=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Active Portfolio</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${l>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:#c55;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);">${l} ALERT${l>1?"S":""}</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${T.length} ACTIVE</span>
        </div>
    </div>`;d+=`<div class="ap-summary">
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EXPOSURE</div>
            <div class="ap-summary__value" style="font-size:14px;color:#c55;">${r(n)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EARNED</div>
            <div class="ap-summary__value" style="font-size:14px;color:#5c5;">${r(a)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:0.6;">
            <div class="ap-summary__label">DEALS</div>
            <div style="display:flex;gap:4px;margin-top:3px;">
                ${["LOAN","INSURE","BOND"].map(c=>{const i=T.filter(x=>x.type===c).length;return`<div style="display:flex;align-items:center;gap:2px;"><div style="width:4px;height:4px;background:${c==="LOAN"?"#5a8aaa":c==="INSURE"?"#aa7a5a":"#8a6aaa"};border-radius:1px;"></div><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#9e9a92;">${i}</span></div>`}).join("")}
            </div>
        </div>
    </div>`,d+='<div class="df-filters">';for(const c of[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Policies",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}])d+=`<span class="df-pill${he===c.id?" "+c.activeClass:""}" onclick="apSetFilter('${c.id}')">${c.label}</span>`;d+="</div>",d+='<div class="ap-list">',t.length===0&&(d+='<div class="ap-empty">No active positions.<br>Review deals from the Deal Flow to build your portfolio.</div>');for(let c=0;c<t.length;c++){const i=t[c],w=T.indexOf(i),x=Ee===w,A=De[i.type],N=He[i.status]||He.CURRENT,$=!!i.alert,I=i.paymentsMade||0,G=i.term||1,Y=Math.round(I/G*100),L=$?N.color==="#c55"?"alert-red":N.color==="#c84"?"alert-orange":"alert-yellow":"";d+=`<div class="ap-deal ${L}" onclick="apToggle(${w})">
            <div class="ap-deal__inner" style="${x?"background:"+(A.class==="loan"?"rgba(90,138,170,0.08)":A.class==="insure"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,d+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${A.class}">${A.label}</span>
            <span style="font-size:11px;font-weight:600;color:var(--panel-text);flex:1;">${E(i.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${N.color};background:${N.color}12;border:1px solid ${N.color}25;">${N.label}</span>
        </div>`,d+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${E((i.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${I}/${G}mo — ${Y}%</span>
        </div>`;const S=$?N.color:A.class==="loan"?"#5a8aaa":A.class==="insure"?"#aa7a5a":"#8a6aaa";d+=`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(Y,100)}%;background:${S};"></div></div>`;const P=i.type==="LOAN"?"REMAINING":i.type==="INSURE"?"COVERAGE":"FACE VALUE",O=i.remaining||i.coverage||i.faceValue||0,ee=i.type==="LOAN"?"RATE":i.type==="INSURE"?"PREMIUM":"COUPON",ie=i.rate||i.premiumRate||i.coupon||0,b=i.earned||i.premiumsCollected||i.couponsReceived||0,ue=i.type==="LOAN"?"INTEREST EARNED":i.type==="INSURE"?"PREMIUMS EARNED":"COUPONS EARNED",k=A.class==="loan"?"#5a8aaa":A.class==="insure"?"#aa7a5a":"#8a6aaa";if(d+=`<div class="df-metrics" style="margin-top:4px;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${P}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);margin-top:1px;">${r(O)}</div>
            </div>
            <div style="flex:0.8;padding:3px 6px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${ee}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${k};margin-top:1px;">${ie}%</div>
            </div>
            <div style="flex:1;padding:3px 6px;text-align:right;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${ue}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5c5;margin-top:1px;">${r(b)}</div>
            </div>
        </div>`,$&&(d+=`<div class="ap-deal__alert" style="background:${N.color}08;border:1px solid ${N.color}20;color:${N.color};">${E(i.alert)}</div>`),x){if(d+='<div class="ap-deal__expanded">',i.type==="LOAN"){const M=[{label:"PRINCIPAL",value:r(i.principal||0)},{label:"REMAINING",value:r(i.remaining||0),color:"var(--panel-text)"},{label:"MONTHLY PAYMENT",value:r(i.monthlyPayment||0)},{label:"MISSED PAYMENTS",value:String(i.missedPayments||0),color:(i.missedPayments||0)>0?"#c55":"#5c5"},{label:"NEXT DUE",value:i.nextPayment||"—",color:i.status==="LATE"?"#c55":"#9e9a92"}];for(const z of M)d+=`<div class="ap-detail-row"><span class="ap-detail-label">${z.label}</span><span class="ap-detail-value" style="color:${z.color||"#9e9a92"};">${z.value}</span></div>`;i.status!=="CURRENT"&&(d+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apRestructure('${i.id}')">RESTRUCTURE</div><div class="ap-action-btn orange" onclick="apCallLoan('${i.id}')">CALL LOAN</div><div class="ap-action-btn red" onclick="apForeclose('${i.id}')">FORECLOSE</div></div>`)}else if(i.type==="INSURE"){const M=[{label:"COVERAGE",value:r(i.coverage||0)},{label:"PREMIUMS COLLECTED",value:r(i.premiumsCollected||0),color:"#5c5"},{label:"CLAIMS FILED",value:String(i.claims||0),color:(i.claims||0)>0?"#c84":"#5c5"},{label:"PAID OUT",value:r(i.paidOut||0),color:(i.paidOut||0)>0?"#c55":"#6a6660"}];for(const z of M)d+=`<div class="ap-detail-row"><span class="ap-detail-label">${z.label}</span><span class="ap-detail-value" style="color:${z.color||"#9e9a92"};">${z.value}</span></div>`;i.status==="CLAIM"&&i.claimAmount&&(d+=`<div class="ap-claim-box"><div style="font-family:var(--font-mono);font-size:7px;color:#c55;letter-spacing:0.8px;margin-bottom:2px;">PENDING CLAIM</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${r(i.claimAmount)}</div></div>`,d+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apPayClaim('${i.id}')">PAY IN FULL</div><div class="ap-action-btn orange" onclick="apNegotiateClaim('${i.id}')">NEGOTIATE</div><div class="ap-action-btn red" onclick="apDisputeClaim('${i.id}')">DISPUTE</div></div>`)}else if(i.type==="BOND"){const M=[{label:"FACE VALUE",value:r(i.faceValue||0)},{label:"COUPONS RECEIVED",value:r(i.couponsReceived||0),color:"#5c5"},{label:"NEXT COUPON",value:i.nextCoupon||"—"},{label:"ANNUAL YIELD",value:r(Math.round((i.faceValue||0)*(i.coupon||0)/100)),color:"#8a6aaa"}];for(const z of M)d+=`<div class="ap-detail-row"><span class="ap-detail-label">${z.label}</span><span class="ap-detail-value" style="color:${z.color||"#9e9a92"};">${z.value}</span></div>`;d+=`<div class="ap-actions"><div class="ap-action-btn purple" onclick="apSellPosition('${i.id}')">SELL POSITION</div><div class="ap-action-btn olive">HOLD</div></div>`}d+="</div>"}d+="</div></div>"}d+="</div>";const m=T.reduce((c,i)=>c+(i.principal||i.coverage||i.faceValue||0),0),p=m>0?Math.round(a/m*1e4)/100:0,f=T.length>0?Math.round(T.reduce((c,i)=>c+(i.rate||0),0)/T.length*10)/10:0,e=T.filter(c=>c.status==="LATE"||c.status==="DELINQUENT").length,s=T.length>0?Math.round(e/T.length*100):0;d+=`<div class="df-footer" style="flex-direction:column;gap:6px;">
        <div style="display:flex;gap:8px;justify-content:space-between;width:100%;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EXPOSURE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${r(n)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EARNED</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;">${r(a)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">ROI</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${p>=0?"#5c5":"#c55"};">${p}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">AVG RATE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#ca5;">${f}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">RISK</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${s>20?"#c55":s>0?"#ca5":"#5c5"};">${s}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            ${["LOAN","INSURE","BOND"].map(c=>{const i=c==="LOAN"?"#5a8aaa":c==="INSURE"?"#aa7a5a":"#8a6aaa",w=T.filter(x=>x.type===c).length;return`<div style="text-align:center;padding:1px 6px;border:1px solid ${w>0?i+"33":"var(--panel-border)"};background:${w>0?i+"0a":"transparent"};"><div style="font-family:var(--font-mono);font-size:6px;color:${i};">${c}</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${w>0?"var(--panel-text)":"#6a6660"};">${w}</div></div>`}).join("")}
        </div>
    </div>`,o.innerHTML=d}window.apSetFilter=ft;window.apToggle=vt;async function ut(o){const t=prompt(`RESTRUCTURE LOAN

Enter new annual interest rate (1-20%):
(This extends the term by 12 months and resets missed payments.)`);if(!t)return;const n=parseFloat(t);if(isNaN(n)||n<1||n>20){alert("Rate must be between 1% and 20%.");return}const{data:a}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!a){alert("Loan not found.");return}const l=a.term_months+12,d=n/100/12,m=Number(a.principal)-Number(a.total_paid||0)+Number(a.total_interest_paid||0),p=d>0?Math.round(m*(d*Math.pow(1+d,l))/(Math.pow(1+d,l)-1)):Math.round(m/l);if(!confirm(`Restructure to ${n}% over ${l} months?
New monthly payment: ${r(p)}
Missed payments reset to 0.`))return;const{error:f}=await y.from("finance_active_loans").update({interest_rate:n,term_months:l,monthly_payment:p,payments_missed:0,status:"current"}).eq("id",o);if(f){alert("Failed: "+f.message);return}alert("Loan restructured."),await se(),Q()}async function mt(o){if(!confirm(`CALL LOAN

Demand immediate full repayment of remaining principal.
The borrower will have 3 ticks to pay or default.

Proceed?`))return;const{error:t}=await y.from("finance_active_loans").update({status:"delinquent",payments_missed:3}).eq("id",o);if(t){alert("Failed: "+t.message);return}alert("Loan called. Borrower has 1 tick to pay before default."),await se(),Q()}async function _t(o){if(!confirm(`FORECLOSE

Immediately default the loan and seize collateral.
Collateral recovery: Equipment 60%, Property 75%, Unsecured 0%.

This cannot be undone. Proceed?`))return;const{data:t}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Loan not found.");return}const n=Math.max(0,Number(t.principal)-Number(t.total_paid||0));let a=0;t.collateral_type==="equipment"?a=.6:t.collateral_type==="property"&&(a=.75);const l=Math.round(n*a);if(l>0){const{data:d}=await y.from("factions").select("corp_cash_reserves").eq("id",_.id).single();await y.from("factions").update({corp_cash_reserves:Number(d?.corp_cash_reserves||0)+l}).eq("id",_.id),_.corp_cash_reserves=Number(d?.corp_cash_reserves||0)+l}await y.from("finance_active_loans").update({status:"defaulted",completed_tick:H?.current_tick||0}).eq("id",o),alert("Foreclosed. Recovered: "+r(l)+" from "+(t.collateral_type||"unsecured")+" collateral."),await se(),Q()}async function yt(o){const{data:t}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Policy not found.");return}const n=Number(t.principal||0)-Number(t.claims_paid||0),a=Number(t.deductible_pct||0)/100,l=Math.round(n*(1-a));if(!confirm(`PAY CLAIM IN FULL

Claim: ${r(n)}
Deductible: ${t.deductible_pct}%
Payout: ${r(l)}

This will be deducted from your cash reserves.`))return;const{data:d}=await y.from("factions").select("corp_cash_reserves").eq("id",_.id).single(),m=Number(d?.corp_cash_reserves||0);if(m<l){alert("Insufficient funds. You have "+r(m)+".");return}await y.from("factions").update({corp_cash_reserves:m-l}).eq("id",_.id),_.corp_cash_reserves=m-l;const{data:p}=await y.from("factions").select("corp_cash_reserves").eq("id",t.borrower_faction_id).single();p&&await y.from("factions").update({corp_cash_reserves:Number(p.corp_cash_reserves||0)+l}).eq("id",t.borrower_faction_id),await y.from("finance_active_loans").update({claims_paid:Number(t.claims_paid||0)+l,claims_count:(t.claims_count||0)+1}).eq("id",o),alert("Claim paid: "+r(l)),await se(),Q()}async function bt(o){const t=prompt(`NEGOTIATE CLAIM

Offer a percentage of the claim to settle (10-90%):
(Policyholder may reject low offers.)`);if(!t)return;const n=parseInt(t);if(isNaN(n)||n<10||n>90){alert("Must be between 10% and 90%.");return}const a=n/100;if(!(Math.random()<a)){alert("Offer rejected. The policyholder wants a higher settlement.");return}const{data:d}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!d)return;const m=Number(d.principal||0)-Number(d.claims_paid||0),p=Math.round(m*n/100),{data:f}=await y.from("factions").select("corp_cash_reserves").eq("id",_.id).single(),e=Number(f?.corp_cash_reserves||0);if(e<p){alert("Insufficient funds.");return}await y.from("factions").update({corp_cash_reserves:e-p}).eq("id",_.id),_.corp_cash_reserves=e-p;const{data:s}=await y.from("factions").select("corp_cash_reserves").eq("id",d.borrower_faction_id).single();s&&await y.from("factions").update({corp_cash_reserves:Number(s.corp_cash_reserves||0)+p}).eq("id",d.borrower_faction_id),await y.from("finance_active_loans").update({claims_paid:Number(d.claims_paid||0)+p,claims_count:(d.claims_count||0)+1,status:"repaid"}).eq("id",o),alert("Claim settled at "+n+"% ("+r(p)+"). Policy closed."),await se(),Q()}async function gt(o){if(!confirm(`DISPUTE CLAIM

Challenge the validity of this claim.
This freezes the claim for 4 ticks while investigated.
If investigation finds the claim valid, you pay in full + 10% penalty.
If investigation finds fraud, claim is dismissed.

Dispute?`))return;Math.random()<.7?alert(`Investigation complete: claim is VALID.
You must now pay the full claim.`):(await y.from("finance_active_loans").update({status:"repaid",claims_count:0}).eq("id",o),alert(`Investigation complete: FRAUDULENT CLAIM detected.
Claim dismissed. Policy remains active.`)),await se(),Q()}async function xt(o){const{data:t}=await y.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Position not found.");return}const n=Number(t.principal||0)-Number(t.total_paid||0),a=Math.round(n*.85);if(!confirm(`SELL POSITION

Remaining value: ${r(n)}
Market price (85%): ${r(a)}

You receive ${r(a)} immediately.
The position is removed from your portfolio.`))return;const{data:l}=await y.from("factions").select("corp_cash_reserves").eq("id",_.id).single();await y.from("factions").update({corp_cash_reserves:Number(l?.corp_cash_reserves||0)+a}).eq("id",_.id),_.corp_cash_reserves=Number(l?.corp_cash_reserves||0)+a,await y.from("finance_active_loans").update({status:"repaid",completed_tick:H?.current_tick||0}).eq("id",o),alert("Position sold for "+r(a)+"."),await se(),Q()}window.apRestructure=ut;window.apCallLoan=mt;window.apForeclose=_t;window.apPayClaim=yt;window.apNegotiateClaim=bt;window.apDisputeClaim=gt;window.apSellPosition=xt;function Ge(o,t){const n=o.reduce((a,l)=>a+l.value,0);return n===0?`<div class="rr-seg-bar" style="height:${t}px;background:var(--panel-border);"></div>`:`<div class="rr-seg-bar" style="height:${t}px;">${o.map(a=>`<div style="width:${(a.value/n*100).toFixed(1)}%;height:100%;background:${a.color};"></div>`).join("")}</div>`}function ht(){const o=document.getElementById("rr-container");if(!o)return;const t=Number(_?.corp_cash_reserves)||0,n=je(t,T,_e,$e),{totalExposure:a,requiredReserve:l,reserveReqPct:d,loanExposure:m,insureExposure:p,bondExposure:f,lendingCapPct:e,lendingCap:s,totalDeployed:c,deployable:i,limiter:w}=n,x=a,A=t+x,N=a>0?Math.round(t/a*100):100,$=Math.round(d*100),I=N>=30?"HEALTHY":N>=20?"ADEQUATE":N>=$?"THIN":"CRITICAL",G=N>=30?"#5c5":N>=20?"#ca5":N>=$?"#c84":"#c55",Y={};for(const u of T){const h=u.nation||"Unknown",D=u.remaining||u.coverage||u.faceValue||0;Y[h]=(Y[h]||0)+D}const L=Object.entries(Y).map(([u,h])=>({name:u,exposure:h,pct:a>0?Math.round(h/a*100):0})).sort((u,h)=>h.exposure-u.exposure),S={};for(const u of T){const h=u.type==="BOND"?"Government":u.sector||"Other",D=u.remaining||u.coverage||u.faceValue||0;S[h]=(S[h]||0)+D}const P=Object.entries(S).map(([u,h])=>({name:u,exposure:h,pct:a>0?Math.round(h/a*100):0})).sort((u,h)=>h.exposure-u.exposure),O=L.length>0?L[0].pct:0,ee=O>60?"HIGH":O>40?"MODERATE":"LOW",ie=ee==="HIGH"?"#c55":ee==="MODERATE"?"#ca5":"#5c5";let b=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Reserves & Risk</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${G};background:${G}12;border:1px solid ${G}25;">${I}</span>
    </div>`;b+='<div style="flex:1;overflow-y:auto;">',$e&&(b+=`<div style="padding:5px 14px;background:rgba(200,168,50,0.06);border-bottom:1px solid rgba(200,168,50,0.15);display:flex;align-items:center;gap:6px;">
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:#c8a832;background:rgba(200,168,50,0.12);border:1px solid rgba(200,168,50,0.25);">POLICY</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#c8a832;">Financial Sector Deregulation Act</span>
            <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">Reserve req: ${$}% &middot; Interest: +10%</span>
        </div>`),b+='<div class="rr-section-bar">Capital Position</div>',b+='<div class="rr-section">',b+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">TOTAL ASSETS</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${r(A)}</span>
    </div>`,b+=Ge([{value:t,color:"#5c5"},{value:x,color:"#8b9a6b"}],6),b+=`<div class="rr-seg-legend">
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#5c5;"></div>Cash ${r(t)}</div>
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#8b9a6b;"></div>Deployed ${r(x)}</div>
    </div>`,b+="</div>",b+='<div class="rr-section">',b+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">RESERVE RATIO</span>
        <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${G};">${N}%</span>
    </div>`,b+=`<div class="rd-bar" style="height:5px;"><div class="rd-bar__fill" style="width:${Math.min(N/60*100,100)}%;background:${G};"></div></div>`,b+=`<div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:3px;">
        <span style="color:#c55;">${$}% minimum</span><span>30% healthy</span><span style="color:#5c5;">60%+</span>
    </div>`,b+=`<div class="rr-reserve-cells">
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REQUIRED (${$}%)</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;margin-top:1px;">${r(l)}</div></div>
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">AVAILABLE TO DEPLOY</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${i>0?"#5c5":"#c55"};margin-top:1px;">${r(i)}</div></div>
    </div>`;{const u=w==="lending_cap"?`Capped at ${e}% of cash (branch offices: ${_e}). Deployed ${r(c)} of ${r(s)}.`:`Reserve requirement binds (${$}% of exposure).`;b+=`<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:6px;letter-spacing:0.02em;">${u}</div>`}if(b+="</div>",b+='<div class="rr-section-bar">Exposure by Type</div>',b+='<div class="rr-section">',a>0){b+=Ge([{value:m,color:"#5a8aaa"},{value:p,color:"#aa7a5a"},{value:f,color:"#8a6aaa"}],6),b+='<div style="margin-top:6px;">';const u=[{label:"Loans",value:m,color:"#5a8aaa",pct:a>0?Math.round(m/a*100):0},{label:"Insurance",value:p,color:"#aa7a5a",pct:a>0?Math.round(p/a*100):0},{label:"Bonds",value:f,color:"#8a6aaa",pct:a>0?Math.round(f/a*100):0}];for(let h=0;h<u.length;h++){const D=u[h];b+=`<div class="rr-type-row">
                <div style="width:6px;height:6px;background:${D.color};margin-right:6px;"></div>
                <span style="flex:1;font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${D.label}</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${r(D.value)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;width:28px;text-align:right;">${D.pct}%</span>
            </div>`}b+="</div>"}else b+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No exposure</div>';if(b+="</div>",b+=`<div class="rr-section-bar" style="display:flex;justify-content:space-between;align-items:center;">
        <span>Concentration Risk</span>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${ie};background:${ie}12;border:1px solid ${ie}25;">${ee}</span>
    </div>`,b+='<div class="rr-section">',L.length>0){b+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">BY NATION</div>';for(const u of L){const h=u.pct>50?"#c84":u.pct>30?"#ca5":"#5c5";b+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;width:52px;text-align:center;">${E(u.name.toUpperCase().slice(0,6))}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${u.pct}%;background:${h};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${r(u.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${u.pct>50?"#c84":"#9e9a92"};">${u.pct}%</span>
            </div>`}}if(P.length>0){b+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-top:8px;margin-bottom:4px;">BY SECTOR</div>';for(const u of P){const h=u.pct>50?"#c84":u.pct>30?"#ca5":"#5c5";b+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:52px;">${E(u.name)}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${u.pct}%;background:${h};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:50px;text-align:right;">${r(u.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${u.pct>50?"#c84":"#9e9a92"};">${u.pct}%</span>
            </div>`}}if(L.length===0&&P.length===0&&(b+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No positions to analyze</div>'),b+="</div>",b+='<div class="rr-section-bar">Actions</div>',b+='<div class="rr-section">',b+=`<div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Max single-deal size (${$}% reserve)</span>
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">${r(i)}</span>
    </div>`,O>50&&L.length>1){const u=L[0],h=Math.round(100/L.length),D=Math.round(a*h/100),be=u.exposure-D;b+=`<div style="padding:6px 8px;background:rgba(200,136,68,0.06);border:1px solid rgba(200,136,68,0.15);margin-bottom:6px;">
            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#c84;margin-bottom:2px;">DIVERSIFICATION TIP</div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;line-height:1.5;">
                ${E(u.name)} is ${u.pct}% of your book (target: ~${h}%).
                Reduce exposure by ~${r(be)} or grow positions in other nations.
            </div>
        </div>`}const ue=T.filter(u=>u.status==="LATE"||u.status==="DELINQUENT").length,k=[];N>=30&&k.push("reserves"),O<=40&&k.push("diversified"),ue===0&&k.push("no_delinquent"),T.length>=3&&k.push("scale");const M=k.length,z=M>=4?"EXCELLENT":M>=3?"GOOD":M>=2?"FAIR":"POOR",pe=M>=4?"#5c5":M>=3?"#ca5":M>=2?"#c84":"#c55";b+=`<div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">PORTFOLIO HEALTH</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${pe};">${z} (${M}/4)</span>
    </div>`,b+=`<div style="margin-top:4px;display:flex;gap:3px;">
        ${["Reserves","Diversified","No Defaults","Scale"].map((u,h)=>{const D=k.length>h&&k.includes(["reserves","diversified","no_delinquent","scale"][h]);return`<span style="flex:1;text-align:center;padding:2px 0;font-family:var(--font-mono);font-size:6px;font-weight:700;color:${D?"#5c5":"#6a6660"};border:1px solid ${D?"rgba(92,204,92,0.2)":"var(--panel-border)"};background:${D?"rgba(92,204,92,0.04)":"transparent"};">${D?"✓":"✗"} ${u}</span>`}).join("")}
    </div>`,b+="</div>",O>60&&L.length>0&&(b+=`<div class="rr-warning"><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c55;">CONCENTRATION WARNING: </span>${O}% of exposure is in ${E(L[0].name)}. A sovereign crisis or economic downturn in this nation would affect the majority of your portfolio. Consider diversifying across nations.</div>`),b+="</div>",b+=`<div class="df-footer" style="justify-content:space-between;">
        <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">DEPLOYABLE CAPITAL</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${i>0?"#5c5":"#c55"};">${r(i)}</div></div>
        <div style="text-align:right;"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">TOTAL EXPOSURE</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${r(a)}</div></div>
    </div>`,o.innerHTML=b}const Ye={REPAID:{color:"#5c5",label:"REPAID"},DEFAULTED:{color:"#c55",label:"DEFAULTED"},EXPIRED:{color:"#5c5",label:"EXPIRED"},CLAIMED:{color:"#c84",label:"CLAIMED"},MATURED:{color:"#5c5",label:"MATURED"},SOLD:{color:"#ca5",label:"SOLD EARLY"},FORECLOSED:{color:"#c55",label:"FORECLOSED"}};let V=[],Oe=-1;function wt(o){Oe=Oe===o?-1:o,ke()}function ke(){const o=document.getElementById("cc-container");if(!o)return;const t=V.reduce((f,e)=>f+(e.earned||0),0),n=V.reduce((f,e)=>f+(e.lost||0),0),a=V.reduce((f,e)=>f+(e.net||0),0),l=V.filter(f=>f.net>0).length,d=V.filter(f=>f.net<0).length,m=a>=0;let p=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Collections</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${V.length} RESOLVED</span>
    </div>`;if(p+=`<div class="cc-scorecard">
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">EARNED</div>
            <div class="cc-scorecard__value" style="color:#5c5;">${r(t)}</div>
        </div>
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">LOST</div>
            <div class="cc-scorecard__value" style="color:#c55;">${r(n)}</div>
        </div>
        <div class="cc-scorecard__cell" style="background:${m?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="cc-scorecard__label">NET P&amp;L</div>
            <div class="cc-scorecard__value" style="color:${m?"#5c5":"#c55"};">${m?"+":""}${r(a)}</div>
        </div>
    </div>`,V.length>0){const f=l/V.length*100;p+=`<div class="cc-winloss">
            <div class="cc-winloss__bar">
                <div style="width:${f}%;background:#5c5;height:100%;"></div>
                <div style="flex:1;background:#c55;height:100%;"></div>
            </div>
            <span class="cc-winloss__stat" style="color:#5c5;">${l}W</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&mdash;</span>
            <span class="cc-winloss__stat" style="color:#c55;">${d}L</span>
        </div>`}p+='<div class="cc-list">',V.length===0&&(p+='<div class="cc-empty">No resolved deals yet.<br>Completed loans, expired policies, and matured bonds appear here.</div>');for(let f=0;f<V.length;f++){const e=V[f],s=De[e.type]||{class:"loan",label:e.type},c=Ye[e.outcome]||{color:"#9e9a92",label:e.outcome},i=Oe===f,w=e.net>=0;p+=`<div class="cc-deal" onclick="ccToggle(${f})" style="border-left:2px solid ${w?"#5c5":"#c55"};">
        <div class="cc-deal__inner" style="${i?"background:"+(e.type==="LOAN"?"rgba(90,138,170,0.08)":e.type==="INSURE"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,p+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${s.class}">${s.label}</span>
            <span style="font-size:11px;font-weight:600;color:var(--panel-text);flex:1;">${E(e.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${c.color};background:${c.color}12;border:1px solid ${c.color}25;">${c.label}</span>
        </div>`,p+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${E((e.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${E(e.resolved||"")}</span>
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
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${E(e.term)}</span>
                </div>`),e.rate&&(p+=`<div class="cc-detail-row">
                    <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">RATE</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${E(e.rate)}</span>
                </div>`),e.note&&(p+=`<div style="padding:4px 0;">
                    <div style="font-size:9px;color:${w?"#9e9a92":"#c84"};line-height:1.5;">${E(e.note)}</div>
                </div>`),p+="</div>"),p+="</div></div>"}p+="</div>",p+=`<div class="df-footer" style="justify-content:space-between;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">LIFETIME P&amp;L</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${m?"#5c5":"#c55"};">${m?"+":""}${r(a)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            ${Object.entries(V.reduce((f,e)=>(f[e.outcome]=(f[e.outcome]||0)+1,f),{})).map(([f,e])=>{const s=Ye[f]||{color:"#9e9a92",label:f};return`<div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:${s.color};letter-spacing:0.3px;">${s.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);">${e}</div>
                </div>`}).join("")}
        </div>
    </div>`,o.innerHTML=p}window.ccToggle=wt;const $t={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let g=null,R="LOAN",J=8,ae=18e6,we=24,C="equipment",ye="",ce=3.5,K=12e6,ne=10,Se="",U=25e6;const Ie=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function Et(o){const t=X[o];t&&(g=t,R=t.type,t.type==="LOAN"?(J=8,ae=t.amount,we=t.term||24,C=t.collateral||"unsecured",ye=""):t.type==="INSURE"?(ce=t.isVesselInsurance?1.75:3.5,K=t.amount,ne=10,Se=""):t.type==="BOND"&&(U=Math.round(t.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",de())}function Xe(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",g=null}function Nt(o){J=Number(o),de()}function At(o){C=o,de()}function Rt(o){ye=o}function Tt(o){ce=Number(o),de()}function Lt(o){K=Number(o),de()}function Ct(o){ne=Number(o),de()}function It(o){U=Number(o),de()}function me(o,t,n){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(o/t*100,100)}%;background:${n};"></div></div>`}function de(){const o=document.getElementById("rd-modal");if(!o||!g)return;const t=g,n=R==="LOAN"?"#5a8aaa":R==="INSURE"?"#aa7a5a":"#8a6aaa",a=Math.round(ae*(J/100)*(we/12)),l=Math.round((ae+a)/we),d=t.revenue||474e5,m=Math.round(l/d*1200),p=12,f=Math.max(0,(J-6)*1.5),e=ae>15e6?3:0,s=C==="none"?3:C==="full"?-2:0,c=Number(t.corp_debt||0),i=Number(t.corp_cash_reserves||1),w=c>0?Math.min(15,Math.round(c/Math.max(i,1)*5)):0,x=Math.min(60,Math.max(2,Math.round(p+f+e+s+w))),A=x<=15?"#5c5":x<=30?"#ca5":x<=45?"#c84":"#c55",N=x<=15?"LOW":x<=30?"MODERATE":x<=45?"ELEVATED":"HIGH",$=95,I=(J-4)*8,G=ae<(t.amount||18e6)?10:0,Y=C==="full"?15:C==="property"?8:C==="none"?-5:0,L=Math.max(10,Math.min(95,Math.round($-I-G-Y))),S=L>=70?"#5c5":L>=45?"#ca5":L>=25?"#c84":"#c55",P={unsecured:"none",equipment:"equipment",property:"property"},O=Ie.find(j=>j.id===(P[C]||C))||Ie[0],ee=Math.round(a*(1-x/100)),ie=(t.term||18)/12,b=Math.round(K*(ce/100)*ie),ue=100-(t.reputation||50),k=Math.max(5,Math.min(50,Math.round(ue*.4))),M=Math.round(K*(1-ne/100)),z=Math.round(M*(k/100)),pe=b-z,u=k<=12?"#5c5":k<=22?"#ca5":k<=35?"#c84":"#c55",h=t.couponRate||6.2,D=t.term||60,be=D/12,Qe=Math.round(U*(h/100)),Pe=Math.round(U*(h/100)*be),fe=t.stability||50,ze=t.creditRating||50,Ue=t.debtToGdp||30,Ke=Math.max(2,Math.round((100-fe)*.15+(100-ze)*.15+Math.max(0,Ue-30)*.3)),te=Math.min(60,Ke),Ae=te<=10?"#5c5":te<=20?"#ca5":te<=35?"#c84":"#c55",qe=Math.round(Pe*(1-te/100));let v=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${n};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>`;if(v+=`<div class="rd-tabs">
        <span class="rd-tab ${R==="LOAN"?"active-loan":R==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${R==="LOAN"?"Loan":R==="INSURE"?"Insure":"Bond"} — ${E(t.applicant)}</span>
    </div></div>`,v+='<div class="rd-body">',v+='<div class="rd-left">',R==="LOAN"){const j=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84";v+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${E(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${E(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(t.purpose)}</div>
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
        </div>`,v+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const W=(J-3)/15*100;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${J}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${J}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${W}%,var(--panel-border) ${W}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`,v+=`<div class="rd-control">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">Borrower's Request</div>
            <div class="rd-risk-row"><span class="rd-risk-label">LOAN AMOUNT</span><span class="rd-risk-value" style="color:var(--panel-text);">${r(ae)}</span></div>
            <div class="rd-risk-row"><span class="rd-risk-label">TERM</span><span class="rd-risk-value" style="color:var(--panel-text);">${we}mo</span></div>
        </div>`,v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">REQUIRE COLLATERAL</span>
                <span class="rd-control__value" style="font-size:12px;color:#5a8aaa;">${O.label}</span>
            </div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                ${Ie.map(q=>`<div onclick="rdSetLoanCollateral('${q.id}')" style="
                    flex:1;padding:6px 4px;text-align:center;
                    font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;
                    background:${C===q.id||(P[C]||C)===q.id?"rgba(90,138,170,0.12)":"transparent"};
                    border:1px solid ${C===q.id||(P[C]||C)===q.id?"rgba(90,138,170,0.3)":"var(--panel-border)"};
                    color:${C===q.id||(P[C]||C)===q.id?"#5a8aaa":"#6a6660"};
                    cursor:pointer;
                ">${q.label}</div>`).join("")}
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:6px;">
                ${O.id==="none"?"No collateral. Higher risk, lower acceptance chance.":O.id==="equipment"?"Borrower pledges equipment as security. Moderate risk reduction.":"Borrower pledges property. Strongest security, highest acceptance."}
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
            ">${E(ye)}</textarea>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Visible to the borrower. 500 characters max.</div>
        </div>`}if(R==="INSURE"){const j=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84",W=t.projectValue?"PROJECT":"FLEET",q=t.projectValue||t.fleetValue||0;v+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${E(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${E(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${j};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${W}</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${r(q)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${r(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${t.term}mo</div></div>
            </div>
        </div>`,t.purpose&&t.purpose!=="Construction Insurance"&&(v+=`<div style="padding:8px 14px;background:rgba(170,122,90,0.04);border-bottom:1px solid rgba(170,122,90,0.12);">
                <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#aa7a5a;letter-spacing:0.8px;margin-bottom:3px;">REQUESTED COVERAGE</div>
                <div style="font-size:10px;color:var(--panel-text);line-height:1.5;white-space:pre-wrap;">${E(t.purpose)}</div>
            </div>`),v+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const ve=!!g.isVesselInsurance,re=ve?.5:1,B=ve?4:8,Te=ve?.25:.5,Be=B>re?(ce-re)/(B-re)*100:0;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${ce}%</span>
            </div>
            <input type="range" class="rd-control__range" min="${re}" max="${B}" step="${Te}" value="${ce}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${Be}%,var(--panel-border) ${Be}%);">
            <div class="rd-control__hints"><span>${re}% (competitive)</span><span>${B}% (expensive)</span></div>
        </div>`;const Le=Math.round((t.projectValue||t.fleetValue||t.amount)*.7),ge=Math.round(t.amount*.33),Fe=(K-ge)/(Le-ge)*100;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:var(--panel-text);">${r(K)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${ge}" max="${Le}" step="1000000" value="${K}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${Fe}%,var(--panel-border) ${Fe}%);">
            <div class="rd-control__hints"><span>${r(ge)} (partial)</span><span>${r(Le)} (max)</span></div>
        </div>`,v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:var(--panel-text);">${ne}%</span>
            </div>
            <div class="rd-presets">`;for(const Ce of[5,10,15,20,25])v+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${Ce})" style="${ne===Ce?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${Ce}%</span>`;v+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${ne}% of any claim (${r(Math.round(K*ne/100))})</div>
        </div>`,v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">WHAT WE AGREE TO COVER</span>
            </div>
            <textarea id="rd-policy-terms" rows="3" placeholder="e.g., Covers weather delays, material damage, and labor disputes. Excludes negligence and acts of war. Maximum payout per claim: 50% of coverage."
                style="width:100%;box-sizing:border-box;padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--panel-text);background:var(--panel-main);border:1px solid var(--panel-border);resize:vertical;line-height:1.5;"
                oninput="rdPolicyTerms=this.value">${Se||""}</textarea>
        </div>`}if(R==="BOND"){const j=fe>=50?"#5c5":fe>=30?"#ca5":fe>=15?"#c84":"#c55";v+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:var(--panel-text);">${E(t.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${r(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${h}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:var(--panel-text);">${D}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${j};">${fe}</div></div>
            </div>
        </div>`,v+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const W=t.amount,q=Math.max(5e6,Math.ceil(W*.05/5e6)*5e6),ve=(U-q)/(W-q)*100;v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${r(U)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${q}" max="${W}" step="5000000" value="${U}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${ve}%,var(--panel-border) ${ve}%);">
            <div class="rd-control__hints"><span>${r(q)} (small position)</span><span>${r(W)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,v+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const re=[{key:"stability",value:fe,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:Ue,label:"Debt burden",invert:!0},{key:"credit_rating",value:ze,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:t.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:t.corruption||62,label:"Institutional risk",invert:!0}];for(const B of re){const Te=B.invert?B.value>60?"#c55":B.value>40?"#ca5":"#5c5":B.value>=50?"#5c5":B.value>=30?"#ca5":B.value>=15?"#c84":"#c55";v+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${B.key}</span>
                <div style="width:40px;">${me(B.value,100,Te)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--panel-text);width:18px;text-align:right;">${B.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${B.label}</span>
            </div>`}v+="</div>"}if(v+="</div>",v+='<div class="rd-right">',R==="LOAN"){v+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${A};">${x}%</span>
            </div>
            ${me(x,100,A)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${A};margin-top:4px;">${N}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${S};">${L}%</span>
            </div>
            ${me(L,100,S)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',v+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${r(ae)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${r(a)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${r(l)}</span></div>`;const j=m>30?"#c55":m>15?"#ca5":"#5c5";v+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${j};">${m}% of revenue</span></div>`,v+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${r(ee)}</span></div>`,v+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${x}% default)</div>`}if(R==="INSURE"){v+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${u};">${k}%</span>
            </div>
            ${me(k,100,u)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',v+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${r(M)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${r(b)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${r(z)}</span></div>`;const j=pe>0?"":" negative",W=pe>0?"#5c5":"#c55";v+=`<div class="rd-expected${j}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${W};">${r(pe)}</span></div>`,v+=`<div class="rd-formula">Premiums (${r(b)}) − expected payout (${k}% × ${r(M)})</div>`}R==="BOND"&&(v+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',v+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${Ae};">${te}%</span>
            </div>
            ${me(te,100,Ae)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,v+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',v+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${r(U)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${r(Qe)}</span></div>`,v+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(be)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${r(Pe)}</span></div>`,v+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${r(qe)}</span></div>`,v+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${te}% default)</div>`),v+="</div>",v+="</div>";const Je=R==="LOAN"?ae:R==="INSURE"?K:U,Ze=R==="LOAN"?ee:R==="INSURE"?pe:qe,et=R==="LOAN"?x:R==="INSURE"?k:te,tt=R==="LOAN"?A:R==="INSURE"?u:Ae,at=R==="LOAN"?"OFFER LOAN":R==="INSURE"?"WRITE POLICY":"BUY BONDS",ot=R.toLowerCase(),Re=!!t.alreadyOffered,nt=Re?"disabled":"",st=Re?' title="You already have an offer on this request."':"",it=Re?"ALREADY OFFERED":at;v+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${r(Je)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${r(Ze)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${tt};">${et}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${ot}" onclick="rdSubmitOffer()" ${nt}${st}>${it}</button>
        </div>
    </div>`,o.innerHTML=v}window.rdOpen=Et;window.rdClose=Xe;window.rdSetLoanRate=Nt;window.rdSetLoanCollateral=At;window.rdSetLoanTermsText=Rt;window.rdSetInsurePremium=Tt;window.rdSetInsureCoverage=Lt;window.rdSetInsureDeductible=Ct;window.rdSetBondAmount=It;let F=!1;async function Ot(){if(!g||!_||!H||F)return;if(g.alreadyOffered){alert("You already submitted an offer for this request.");return}F=!0;const o=H.current_tick||0,t=Number(_.corp_cash_reserves)||0;if(g.type==="LOAN"){const n=J;if(n<1||n>20){alert("Interest rate must be 1-20%."),F=!1;return}const a=je(t,T,_e,$e);if(g.amount>a.deployable){const f=a.limiter==="lending_cap"?`Lending cap (${a.lendingCapPct}% of cash = ${r(a.lendingCap)}). Already deployed ${r(a.totalDeployed)}.`:`Reserve requirement (${Math.round(a.reserveReqPct*100)}% of exposure = ${r(a.requiredReserve)}). Cash ${r(a.cash)}.`;alert(`Insufficient deployable capital.
${f}
Available: ${r(a.deployable)}
This loan: ${r(g.amount)}`+(a.limiter==="lending_cap"&&_e===0?`

Build a Branch Office to raise your lending cap (+15% each).`:"")),F=!1;return}if(t<g.amount){alert("Insufficient cash reserves to fund this loan."),F=!1;return}const d={none:"unsecured",equipment:"equipment",property:"property",full:"property"}[C]||"unsecured",m={request_id:g.requestId,offering_faction_id:_.id,interest_rate:n,collateral_type:d,created_tick:o};ye.trim()&&(m.offer_terms=ye.trim());const{error:p}=await y.from("finance_loan_offers").insert(m);if(p){F=!1,p.message.includes("unique")||p.message.includes("duplicate")?alert("You have already submitted an offer for this loan request."):alert("Failed to submit offer: "+p.message);return}}else if(g.type==="BOND"){if(t<U){alert("Insufficient cash reserves. Need "+r(U)+", have "+r(t)+"."),F=!1;return}const{error:n}=await y.from("finance_loan_offers").insert({request_id:g.requestId,offering_faction_id:_.id,interest_rate:g.couponRate,collateral_type:"unsecured",status:"accepted",created_tick:o});if(n){alert("Failed to buy bonds: "+n.message),F=!1;return}const a=g.couponRate/100/12;g.term;const l=Math.round(U*a),{data:d,error:m}=await y.from("finance_loan_requests").select("requesting_faction_id").eq("id",g.requestId).single();if(m||!d?.requesting_faction_id){alert("Failed to create bond position: could not resolve issuer faction."),F=!1;return}const{error:p}=await y.from("finance_active_loans").insert({request_id:g.requestId,offer_id:null,borrower_faction_id:d.requesting_faction_id,lender_faction_id:_.id,nation_id:g.nation_id||_.nation_id,principal:U,interest_rate:g.couponRate,term_months:g.term,collateral_type:"unsecured",purpose:g.purpose,monthly_payment:l,started_tick:o});if(p){alert("Failed to create bond position: "+p.message),F=!1;return}await y.from("factions").update({corp_cash_reserves:Math.max(0,t-U)}).eq("id",_.id);const{data:f}=await y.from("nations").select("debt").eq("id",g.nation_id).single();if(f){const{error:e}=await y.from("nations").update({debt:Number(f.debt||0)+U}).eq("id",g.nation_id);e&&console.warn("[Bonds] Failed to update nation debt:",e.message)}_.corp_cash_reserves=Math.max(0,t-U)}else if(g.type==="INSURE"){const n=ce,a=K,l=ne,d=Math.round(a*(n/100)/12),{error:m}=await y.from("finance_loan_offers").insert({request_id:g.requestId,offering_faction_id:_.id,interest_rate:n,collateral_type:"unsecured",status:"accepted",created_tick:o});if(m){F=!1,m.message.includes("unique")||m.message.includes("duplicate")?alert("You have already submitted a policy offer for this request."):alert("Failed to write policy: "+m.message);return}const{data:p}=await y.from("finance_loan_requests").update({status:"funded",funded_tick:o}).eq("id",g.requestId).select("requesting_faction_id").single(),f={request_id:g.requestId,offer_id:null,borrower_faction_id:p?.requesting_faction_id||g.requestingFactionId,lender_faction_id:_.id,nation_id:_.nation_id,principal:a,interest_rate:n,term_months:0,collateral_type:"unsecured",purpose:g.isVesselInsurance?"Vessel Insurance — "+g.applicant:"Insurance Policy — "+g.applicant,monthly_payment:d,started_tick:o,deductible_pct:l,policy_terms:Se.trim()||null};g.insuredVesselId&&(f.insured_vessel_id=g.insuredVesselId),g.insuredContractId&&(f.insured_contract_id=g.insuredContractId);const{error:e}=await y.from("finance_active_loans").insert(f);if(e){alert("Failed to create policy record: "+e.message),F=!1;return}}else{F=!1;return}Xe(),Z=-1,await We(),F=!1}window.rdSubmitOffer=Ot;async function se(){if(!_){Q();return}const{data:o}=await y.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",_.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"},n=a=>a.finance_loan_requests?.request_type==="insurance";T=(o||[]).map(a=>({id:a.id,type:t[a.finance_loan_requests?.request_type]||"LOAN",counterparty:a.borrower?.faction_name||"Unknown",abbr:a.borrower?.abbreviation||a.borrower?.corp_ticker||"??",nation:a.loan_nation?.name||a.borrower?.nation||"Unknown",remaining:n(a)?0:a.principal-a.total_paid,principal:a.principal,earned:n(a)?(a.monthly_payment||0)*(a.payments_made||0):a.total_interest_paid||0,rate:a.interest_rate,term:a.term_months,paymentsMade:a.payments_made,paymentsMissed:a.payments_missed,monthlyPayment:a.monthly_payment,status:a.status.toUpperCase(),collateral:a.collateral_type,purpose:a.purpose||"",alert:a.status==="late"||a.status==="delinquent",alertLevel:a.status==="delinquent"?"red":a.status==="late"?"orange":null,alertMsg:a.status==="delinquent"?`${a.payments_missed} missed payments. Default imminent.`:a.status==="late"?`${a.payments_missed} missed payment${a.payments_missed>1?"s":""}. Monitor closely.`:null,coverage:n(a)?a.principal:void 0,premiumsCollected:n(a)?(a.monthly_payment||0)*(a.payments_made||0):void 0,paidOut:n(a)?a.claims_paid||0:void 0,claims:n(a)?a.claims_count||0:void 0,deductible:n(a)?a.deductible_pct||0:void 0})),Q()}async function kt(){if(!_){ke();return}const{data:o}=await y.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",_.id).in("status",["repaid","defaulted"]).order("completed_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"};V=(o||[]).map(n=>{const a=n.total_interest_paid||0,l=n.status==="defaulted"?Math.max(0,n.principal-n.total_paid):0;return{type:t[n.finance_loan_requests?.request_type]||"LOAN",counterparty:n.borrower?.faction_name||"Unknown",abbr:n.borrower?.abbreviation||n.borrower?.corp_ticker||"??",nation:n.loan_nation?.name||n.borrower?.nation||"",outcome:n.status==="repaid"?"REPAID":"DEFAULTED",principal:n.principal,earned:a,lost:l,net:a-l,resolved:n.completed_tick?"Tick "+n.completed_tick:"",term:n.term_months+"mo",rate:n.interest_rate+"%",note:n.status==="repaid"?`Fully repaid over ${n.payments_made} payments.`:`Defaulted after ${n.payments_missed} missed payments. ${n.collateral_type!=="unsecured"?"Collateral ("+n.collateral_type+") partially recovered losses.":"Unsecured — no collateral recovery."}`}}),ke()}function Me(o){const t=new URL("corp-operations.html",window.location.href);t.search=window.location.search;const n=t.searchParams;n.set("tab",o),t.search=n.toString()?`?${n.toString()}`:"",window.location.href=t.toString()}function Dt(o){o?.preventDefault&&o.preventDefault(),Me("expansion")}function St(o){o?.preventDefault&&o.preventDefault(),Me("actions")}async function Mt(){const o=new URLSearchParams(window.location.search).get("tab"),t=o==="expansion"||o==="actions",n=t?o:"operations",{data:{user:a}}=await y.auth.getUser();if(!a){window.location.href="login.html";return}const{data:l}=await y.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);oe=(l||[]).filter(e=>e.nation_id);const d=sessionStorage.getItem("active_faction_id");if(_=oe.find(e=>e.id===d)||oe.find(e=>e.faction_type==="corporation")||oe[0],!_){await y.auth.signOut(),window.location.href="login.html";return}if(_.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(_.corp_sector!=="Finance"){const e={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html"};window.location.href=(e[_.corp_sector]||"corp-operations.html")+window.location.search;return}if(t){Me(o);return}sessionStorage.setItem("active_faction_id",_.id);const[m,p]=await Promise.all([_.nation_id?y.from("nations").select("*").eq("id",_.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);m.data&&m.data,H=p.data;const f=document.getElementById("corp-topbar-container");if(f){const{renderCorpTopBar:e}=await rt(async()=>{const{renderCorpTopBar:s}=await import("./corp-topbar-C3V4L7WY.js");return{renderCorpTopBar:s}},__vite__mapDeps([0,1]));e(f,{faction:_,shard:H,activeTab:n,allUserFactions:oe})}if(Pt(),_.nation_id){const{data:e}=await y.from("active_laws").select("id, policy:policies!policy_id(policy_key)").eq("nation_id",_.nation_id).limit(100);$e=(e||[]).some(s=>s.policy?.policy_key?.startsWith("financial_sector_deregulation"))}{const{data:e}=await y.from("corp_properties").select("id").eq("faction_id",_.id).eq("type","branch_office").eq("is_active",!0);_e=e?.length||0}if(await We(),await se(),ht(),await kt(),H?.next_tick_at){const e=(Number(H.tick_interval_hours)||8)*36e5,s=new Date(H.next_tick_at).getTime(),i=s-e+e/2,w=new Date(i>Date.now()?i:s+e/2);Bt(w)}}function Pt(){const o=document.getElementById("corp-faction-dropdown");if(!o||oe.length<=1)return;let t="";for(const n of oe){const a=n.id===_.id,l=n.faction_type==="corporation"?"CORP":"PARTY";t+=`<div class="corp-faction-dropdown__item${a?" active":""}" onclick="switchFaction('${n.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${n.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${n.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${n.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${l}</span>
            <span>${E(n.faction_name||"--")}</span>
        </div>`}o.innerHTML=t}function zt(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function Ut(o){sessionStorage.setItem("active_faction_id",o);const t=oe.find(n=>n.id===o);t&&t.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}async function qt(){await y.auth.signOut(),window.location.href="login.html"}function Bt(o){const t=document.getElementById("tick-countdown");if(!t)return;function n(){const a=new Date(o)-new Date;if(a<=0){t.textContent="Processing...";return}const l=Math.floor(a/36e5),d=Math.floor(a%36e5/6e4),m=Math.floor(a%6e4/1e3);t.textContent=`${l}h ${d}m ${m}s`}n(),setInterval(n,1e3)}window.toggleCorpDropdown=zt;window.switchFaction=Ut;window.doLogout=qt;window.switchToExpansion=Dt;window.switchToActions=St;Mt();
