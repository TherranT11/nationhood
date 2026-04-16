const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-kB28qcfr.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as g}from"./supabase-client-CiYoFhIh.js";/* empty css                    */import{_ as et}from"./preload-helper-BXl3LOEh.js";import{e as E}from"./utils-CY90Gazr.js";let J=[],_=null,S=null,Ee=!1;function c(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+Math.round(o).toLocaleString()}const Le={LOAN:{class:"loan",label:"LOAN"},INSURE:{class:"insure",label:"INSURE"},BOND:{class:"bond",label:"BOND"}},tt={LOW:{class:"df-risk-low",label:"LOW RISK"},MODERATE:{class:"df-risk-moderate",label:"MODERATE"},ELEVATED:{class:"df-risk-elevated",label:"ELEVATED"},HIGH:{class:"df-risk-high",label:"HIGH RISK"}};let V=[],ue="ALL",ae="all",X=-1;async function Be(){if(!_||!S)return;const{data:o,error:t}=await g.from("finance_loan_requests").select("*, requesting_faction:factions!requesting_faction_id(id, faction_name, abbreviation, corp_ticker, corp_subsector, nation_id, corp_cash_reserves, corp_debt, corp_reputation), issuer_nation:nations!issuer_nation_id(id, name, stability, credit, debt, gdp, gdp_growth, corruption)").eq("status","open").order("created_tick",{ascending:!1});t&&console.error("[DealFlow] Request query error:",t.message);const s=[...new Set((o||[]).filter(e=>e.requesting_faction?.nation_id).map(e=>e.requesting_faction.nation_id))];let a={};if(s.length>0){const{data:e}=await g.from("nations").select("id, name, stability, credit, gdp, gdp_growth, corruption, debt").in("id",s);for(const n of e||[])a[n.id]=n}const{data:r}=await g.from("finance_loan_offers").select("request_id").eq("offering_faction_id",_.id),l=new Set((r||[]).map(e=>e.request_id)),b=[...new Set((o||[]).filter(e=>e.requesting_faction?.id).map(e=>e.requesting_faction.id))];let p={};if(b.length>0){const{data:e}=await g.from("finance_active_loans").select("borrower_faction_id, principal, total_paid").in("borrower_faction_id",b).in("status",["current","late","delinquent"]);for(const d of e||[]){p[d.borrower_faction_id]||(p[d.borrower_faction_id]={count:0,totalOutstanding:0}),p[d.borrower_faction_id].count++;const i=Math.max(0,Number(d.principal||0)-Number(d.total_paid||0));p[d.borrower_faction_id].totalOutstanding+=i}const{data:n}=await g.from("subsidiary_auto_policies").select("borrower_faction_id, principal, remaining_principal").in("borrower_faction_id",b).eq("service_type","loan").eq("status","active");for(const d of n||[])p[d.borrower_faction_id]||(p[d.borrower_faction_id]={count:0,totalOutstanding:0}),p[d.borrower_faction_id].count++,p[d.borrower_faction_id].totalOutstanding+=Number(d.remaining_principal||d.principal||0)}const m=(_.corp_subsector||"").toLowerCase();V=(o||[]).filter(e=>e.request_type==="bond"?m==="investment":e.request_type==="insurance"?m==="insurance":m==="banking").map(e=>{if(e.request_type==="bond"){const n=e.issuer_nation,d=Number(n?.stability??50),i=Number(n?.credit??50),w=Number(n?.gdp??1),x=Number(n?.debt??0),A=w>0?Math.round(x/w*100):0;return{id:e.id,type:"BOND",applicant:n?.name||"Unknown Nation",abbr:(n?.name||"??").slice(0,3).toUpperCase(),entity:"GOV",nation:n?.name||"N/A",nation_id:e.issuer_nation_id,amount:e.amount||0,term:e.term_months,couponRate:Number(e.coupon_rate||5),purpose:e.purpose||"Government Bond",stability:d,creditRating:i,debtToGdp:A,gdpGrowth:Number(n?.gdp_growth??50),corruption:Number(n?.corruption??50),risk:d>=60&&i>=50?"LOW":d>=35&&i>=30?"MODERATE":"HIGH",isNew:!l.has(e.id),ticksLeft:(e.expires_tick||0)-(S?.current_tick||0),requestId:e.id,alreadyOffered:l.has(e.id)}}if(e.request_type==="insurance"){const n=Number(e.requesting_faction?.corp_reputation??50),d=Number(a[e.requesting_faction?.nation_id]?.stability??50);return{id:e.id,type:"INSURE",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:a[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,amount:e.amount||0,term:e.term_months||0,purpose:e.purpose||"Construction Insurance",reputation:n,projectValue:e.amount||0,stability:d,risk:n>=60&&d>=50?"LOW":n>=35?"MODERATE":"HIGH",isNew:!l.has(e.id),ticksLeft:(e.expires_tick||0)-(S?.current_tick||0),requestId:e.id,insuredContractId:e.insured_contract_id,insuredVesselId:e.insured_vessel_id,isVesselInsurance:!!e.insured_vessel_id,alreadyOffered:l.has(e.id)}}return{id:e.id,type:"LOAN",applicant:e.requesting_faction?.faction_name||"Unknown",abbr:e.requesting_faction?.abbreviation||e.requesting_faction?.corp_ticker||"??",entity:"CORP",nation:a[e.requesting_faction?.nation_id]?.name||"N/A",nation_id:e.requesting_faction?.nation_id,amount:e.amount,term:e.term_months,purpose:e.purpose||"",reputation:Number(e.requesting_faction?.corp_reputation??50),revenue:Number(e.requesting_faction?.corp_cash_reserves??0),corp_cash_reserves:Number(e.requesting_faction?.corp_cash_reserves??0),corp_debt:Number(e.requesting_faction?.corp_debt??0),activeLoans:(p[e.requesting_faction?.id]||{}).count||0,totalOutstanding:(p[e.requesting_faction?.id]||{}).totalOutstanding||0,creditRating:Number(a[e.requesting_faction?.nation_id]?.credit??50),stability:Number(a[e.requesting_faction?.nation_id]?.stability??50),risk:(()=>{const n=Number(a[e.requesting_faction?.nation_id]?.credit??50),d=Number(e.requesting_faction?.corp_reputation??50);return n>=60&&d>=60?"LOW":n>=35&&d>=35?"MODERATE":n>=20||d>=20?"ELEVATED":"HIGH"})(),isNew:!l.has(e.id),ticksLeft:(e.expires_tick||0)-(S?.current_tick||0),collateral:e.collateral_type||"unsecured",requestId:e.id,alreadyOffered:l.has(e.id)}}),ge()}function Se(o){if(!_)return!1;const t=(_.corp_subsector||"").toLowerCase(),s=_t[t];return o.type===s}function at(o){ue=o,X=-1,ge()}function ot(o){X=X===o?-1:o,ge()}function ge(){const o=document.getElementById("df-container");if(!o)return;let t=ue==="ALL"?V:V.filter(e=>e.type===ue);ae==="mine"&&_?.nation_id&&(t=t.filter(e=>e.nation_id===_.nation_id));const s=V.filter(e=>e.isNew).length,a=V.length;let r=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Deal Flow</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
            ${s>0?`<span class="df-badge df-badge-corp" style="font-size:8px;">${s} NEW</span>`:""}
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${a} OPEN</span>
        </div>
    </div>`;const l=[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Insurance",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}];r+='<div class="df-filters">';for(const e of l)r+=`<span class="df-pill${ue===e.id?" "+e.activeClass:""}" onclick="dfSetFilter('${e.id}')">${e.label}</span>`;r+=`<span style="margin-left:auto;font-family:var(--font-mono);font-size:7px;cursor:pointer;padding:2px 6px;border:1px solid ${ae==="mine"?"#5c544":"#2a2a24"};color:${ae==="mine"?"#5c5":"#6a6660"};background:${ae==="mine"?"rgba(92,204,92,0.06)":"transparent"};" onclick="dfToggleNation()">${ae==="mine"?"MY NATION":"ALL NATIONS"}</span>`,r+="</div>",r+='<div class="df-list">',t.length===0&&(r+='<div class="ap-empty">No deals available.<br>Deals appear when corporations request financing or governments issue bonds.</div>');for(let e=0;e<t.length;e++){const n=t[e],d=V.indexOf(n),i=X===d,w=Le[n.type],x=tt[n.risk],A=Se(n);r+=`<div class="df-deal${i?" sel-"+w.class:""}" onclick="dfSelectDeal(${d})" style="${A?"":"opacity:0.5;"}">`,n.isNew&&A&&(r+='<div class="df-new-dot"></div>'),r+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span class="df-badge df-badge-${w.class}">${w.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;">${E(n.applicant)}</span>
            <span class="df-badge df-badge-${n.entity.toLowerCase()}">${n.entity}</span>
            ${A?"":'<span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-left:auto;">&#128274;</span>'}
        </div>`,r+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${E(n.nation.toUpperCase())}</span>
            <span class="df-badge ${x.class}" style="font-weight:700;line-height:12px;background:currentColor;-webkit-background-clip:unset;padding:0 4px;">`,r+="</span>",r=r.slice(0,r.lastIndexOf('<span class="df-badge '+x.class));const N=x.class==="df-risk-low"?"#5c5":x.class==="df-risk-moderate"?"#ca5":x.class==="df-risk-elevated"?"#c84":"#c55";r+=`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${N};background:${N}12;border:1px solid ${N}25;">${x.label}</span>
        </div>`;const z=n.type==="BOND"?"FACE VALUE":n.type==="INSURE"?"COVERAGE":"AMOUNT",G=n.type==="BOND"?"COUPON":"REP",O=n.type==="BOND"?n.couponRate+"%":n.reputation||n.stability,U=n.type==="BOND"?n.couponRate*10:n.reputation||n.stability,k=n.type==="BOND"?"#c8a832":U>=60?"#5c5":U>=35?"#ca5":"#c84";if(r+=`<div class="df-metrics">
            <div style="flex:1;">
                <div class="df-metrics__label">${z}</div>
                <div class="df-metrics__value" style="font-size:12px;color:#e8e4dc;">${c(n.amount)}</div>
            </div>
            <div style="flex:0.7;text-align:center;">
                <div class="df-metrics__label">TERM</div>
                <div class="df-metrics__value" style="font-size:11px;color:#e8e4dc;">${n.term}mo</div>
            </div>
            <div style="flex:0.8;text-align:center;">
                <div class="df-metrics__label">${G}</div>
                <div class="df-metrics__value" style="font-size:11px;color:${k};">${O}</div>
            </div>
        </div>`,i){if(r+=`<div style="margin-top:6px;font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(n.purpose)}</div>`,A)r+='<div class="df-detail">';else{const v=n.type==="LOAN"?"Banking":n.type==="INSURE"?"Insurance":"Investment";r+=`<div style="padding:6px 8px;background:rgba(106,102,96,0.06);border:1px solid #2a2a24;font-family:var(--font-mono);font-size:8px;color:#6a6660;line-height:1.5;">
                    &#128274; Requires <span style="color:#e8e4dc;font-weight:700;">${v}</span> subsector to underwrite.
                    ${_?.corp_subsector?'Your subsector: <span style="color:#aa7a5a;">'+E(_.corp_subsector)+"</span>.":""}
                    Establish a subsidiary with this subsector to access these deals.
                </div>`}if(A){if(n.type==="LOAN"){const v=n.corp_cash_reserves>0?Math.round(n.corp_debt/n.corp_cash_reserves*100):0,q=v>50?"#c84":"#5c5",R=n.corp_debt>n.corp_cash_reserves*.5?"#c84":"#9e9a92";r+=`<div class="df-detail-row"><span class="df-detail-label">CASH</span><span class="df-detail-value" style="color:#9e9a92;">${c(n.corp_cash_reserves)}</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">DEBT</span><span class="df-detail-value" style="color:${R};">${c(n.corp_debt)}</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/CASH</span><span class="df-detail-value" style="color:${q};font-weight:700;">${v}%</span></div>`}else if(n.type==="BOND"){const v=n.stability>=50?"#5c5":n.stability>=30?"#ca5":"#c84",q=n.debtToGdp>60?"#c55":n.debtToGdp>40?"#c84":"#5c5",R=n.creditRating>=60?"#5c5":n.creditRating>=35?"#ca5":"#c55";r+=`<div class="df-detail-row"><span class="df-detail-label">STABILITY</span><span class="df-detail-value" style="color:${v};">${n.stability}/100</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">DEBT/GDP</span><span class="df-detail-value" style="color:${q};">${n.debtToGdp}%</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">CREDIT RATING</span><span class="df-detail-value" style="color:${R};font-weight:700;">${n.creditRating}/100</span></div>`}else if(n.type==="INSURE"){const v=n.reputation>=60?"#5c5":n.reputation>=35?"#ca5":"#c84",q=n.projectValue?"PROJECT VALUE":"FLEET VALUE",R=n.projectValue||n.fleetValue;r+=`<div class="df-detail-row"><span class="df-detail-label">REPUTATION</span><span class="df-detail-value" style="color:${v};">${n.reputation}/100</span></div>`,r+=`<div class="df-detail-row"><span class="df-detail-label">${q}</span><span class="df-detail-value" style="color:#9e9a92;">${c(R)}</span></div>`}r+="</div>"}}r+="</div>"}r+="</div>";const b=V.filter(e=>e.type==="LOAN").length,p=V.filter(e=>e.type==="INSURE").length,m=V.filter(e=>e.type==="BOND").length;r+=`<div class="df-footer">
        <div class="df-footer__counts">
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#5a8aaa;"></div><span class="df-footer__count-label">LOAN</span><span class="df-footer__count-num">${b}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#aa7a5a;"></div><span class="df-footer__count-label">INSURE</span><span class="df-footer__count-num">${p}</span></div>
            <div class="df-footer__count"><div class="df-footer__count-dot" style="background:#8a6aaa;"></div><span class="df-footer__count-label">BOND</span><span class="df-footer__count-num">${m}</span></div>
        </div>
        ${(()=>{const e=X>=0?V[X]:null,n=e&&Se(e);return n?`<div class="df-review-btn active" onclick="rdOpen(${X})">REVIEW DEAL</div>`:e&&!n?'<div class="df-review-btn" style="opacity:0.4;cursor:not-allowed;" title="Requires matching subsector">&#128274; LOCKED</div>':'<div class="df-review-btn">REVIEW DEAL</div>'})()}
    </div>`,o.innerHTML=r}function nt(){ae=ae==="all"?"mine":"all",X=-1,ge()}window.dfSetFilter=at;window.dfToggleNation=nt;window.dfSelectDeal=ot;const Pe={CURRENT:{color:"#5c5",label:"CURRENT"},LATE:{color:"#c84",label:"LATE"},DELINQUENT:{color:"#c55",label:"DELINQUENT"},CLAIM:{color:"#c55",label:"CLAIM FILED"},ACTIVE:{color:"#5c5",label:"ACTIVE"},WATCHLIST:{color:"#ca5",label:"WATCHLIST"},DEFAULT:{color:"#c55",label:"DEFAULT"}};let T=[],me="ALL",ye=-1;function st(o){me=o,ye=-1,Y()}function it(o){ye=ye===o?-1:o,Y()}function Y(){const o=document.getElementById("ap-container");if(!o)return;const t=me==="ALL"?T:T.filter(d=>d.type===me),s=T.reduce((d,i)=>d+(i.remaining||i.coverage||i.faceValue||0),0),a=T.reduce((d,i)=>d+(i.earned||i.premiumsCollected||i.couponsReceived||0),0),r=T.filter(d=>d.alert).length;let l=`<div class="df-header">
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
            <div class="ap-summary__value" style="font-size:14px;color:#c55;">${c(s)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:1;">
            <div class="ap-summary__label">TOTAL EARNED</div>
            <div class="ap-summary__value" style="font-size:14px;color:#5c5;">${c(a)}</div>
        </div>
        <div class="ap-summary__cell" style="flex:0.6;">
            <div class="ap-summary__label">DEALS</div>
            <div style="display:flex;gap:4px;margin-top:3px;">
                ${["LOAN","INSURE","BOND"].map(d=>{const i=T.filter(x=>x.type===d).length;return`<div style="display:flex;align-items:center;gap:2px;"><div style="width:4px;height:4px;background:${d==="LOAN"?"#5a8aaa":d==="INSURE"?"#aa7a5a":"#8a6aaa"};border-radius:1px;"></div><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#9e9a92;">${i}</span></div>`}).join("")}
            </div>
        </div>
    </div>`,l+='<div class="df-filters">';for(const d of[{id:"ALL",label:"All",activeClass:"active-all"},{id:"LOAN",label:"Loans",activeClass:"active-loan"},{id:"INSURE",label:"Policies",activeClass:"active-insure"},{id:"BOND",label:"Bonds",activeClass:"active-bond"}])l+=`<span class="df-pill${me===d.id?" "+d.activeClass:""}" onclick="apSetFilter('${d.id}')">${d.label}</span>`;l+="</div>",l+='<div class="ap-list">',t.length===0&&(l+='<div class="ap-empty">No active positions.<br>Review deals from the Deal Flow to build your portfolio.</div>');for(let d=0;d<t.length;d++){const i=t[d],w=T.indexOf(i),x=ye===w,A=Le[i.type],N=Pe[i.status]||Pe.CURRENT,z=!!i.alert,G=i.elapsed||0,O=i.term||1,U=Math.round(G/O*100),k=z?N.color==="#c55"?"alert-red":N.color==="#c84"?"alert-orange":"alert-yellow":"";l+=`<div class="ap-deal ${k}" onclick="apToggle(${w})">
            <div class="ap-deal__inner" style="${x?"background:"+(A.class==="loan"?"rgba(90,138,170,0.08)":A.class==="insure"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,l+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span class="df-badge df-badge-${A.class}">${A.label}</span>
            <span style="font-size:11px;font-weight:600;color:#e8e4dc;flex:1;">${E(i.counterparty)}</span>
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 5px;line-height:12px;color:${N.color};background:${N.color}12;border:1px solid ${N.color}25;">${N.label}</span>
        </div>`,l+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="df-badge df-badge-nation" style="line-height:12px;">${E((i.nation||"").toUpperCase())}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${G}/${O}mo — ${U}%</span>
        </div>`;const v=z?N.color:A.class==="loan"?"#5a8aaa":A.class==="insure"?"#aa7a5a":"#8a6aaa";l+=`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(U,100)}%;background:${v};"></div></div>`;const q=i.type==="LOAN"?"REMAINING":i.type==="INSURE"?"COVERAGE":"FACE VALUE",R=i.remaining||i.coverage||i.faceValue||0,P=i.type==="LOAN"?"RATE":i.type==="INSURE"?"PREMIUM":"COUPON",re=i.rate||i.premiumRate||i.coupon||0,te=i.earned||i.premiumsCollected||i.couponsReceived||0,f=A.class==="loan"?"#5a8aaa":A.class==="insure"?"#aa7a5a":"#8a6aaa";if(l+=`<div class="df-metrics" style="margin-top:4px;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${q}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#e8e4dc;margin-top:1px;">${c(R)}</div>
            </div>
            <div style="flex:0.8;padding:3px 6px;text-align:center;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">${P}</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${f};margin-top:1px;">${re}%</div>
            </div>
            <div style="flex:1;padding:3px 6px;text-align:right;">
                <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;letter-spacing:0.5px;">EARNED</div>
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5c5;margin-top:1px;">${c(te)}</div>
            </div>
        </div>`,z&&(l+=`<div class="ap-deal__alert" style="background:${N.color}08;border:1px solid ${N.color}20;color:${N.color};">${E(i.alert)}</div>`),x){if(l+='<div class="ap-deal__expanded">',i.type==="LOAN"){const y=[{label:"PRINCIPAL",value:c(i.principal||0)},{label:"REMAINING",value:c(i.remaining||0),color:"#e8e4dc"},{label:"MONTHLY PAYMENT",value:c(i.monthlyPayment||0)},{label:"MISSED PAYMENTS",value:String(i.missedPayments||0),color:(i.missedPayments||0)>0?"#c55":"#5c5"},{label:"NEXT DUE",value:i.nextPayment||"—",color:i.status==="LATE"?"#c55":"#9e9a92"}];for(const $ of y)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${$.label}</span><span class="ap-detail-value" style="color:${$.color||"#9e9a92"};">${$.value}</span></div>`;i.status!=="CURRENT"&&(l+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apRestructure('${i.id}')">RESTRUCTURE</div><div class="ap-action-btn orange" onclick="apCallLoan('${i.id}')">CALL LOAN</div><div class="ap-action-btn red" onclick="apForeclose('${i.id}')">FORECLOSE</div></div>`)}else if(i.type==="INSURE"){const y=[{label:"COVERAGE",value:c(i.coverage||0)},{label:"PREMIUMS COLLECTED",value:c(i.premiumsCollected||0),color:"#5c5"},{label:"CLAIMS FILED",value:String(i.claims||0),color:(i.claims||0)>0?"#c84":"#5c5"},{label:"PAID OUT",value:c(i.paidOut||0),color:(i.paidOut||0)>0?"#c55":"#6a6660"}];for(const $ of y)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${$.label}</span><span class="ap-detail-value" style="color:${$.color||"#9e9a92"};">${$.value}</span></div>`;i.status==="CLAIM"&&i.claimAmount&&(l+=`<div class="ap-claim-box"><div style="font-family:var(--font-mono);font-size:7px;color:#c55;letter-spacing:0.8px;margin-bottom:2px;">PENDING CLAIM</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${c(i.claimAmount)}</div></div>`,l+=`<div class="ap-actions"><div class="ap-action-btn green" onclick="apPayClaim('${i.id}')">PAY IN FULL</div><div class="ap-action-btn orange" onclick="apNegotiateClaim('${i.id}')">NEGOTIATE</div><div class="ap-action-btn red" onclick="apDisputeClaim('${i.id}')">DISPUTE</div></div>`)}else if(i.type==="BOND"){const y=[{label:"FACE VALUE",value:c(i.faceValue||0)},{label:"COUPONS RECEIVED",value:c(i.couponsReceived||0),color:"#5c5"},{label:"NEXT COUPON",value:i.nextCoupon||"—"},{label:"ANNUAL YIELD",value:c(Math.round((i.faceValue||0)*(i.coupon||0)/100)),color:"#8a6aaa"}];for(const $ of y)l+=`<div class="ap-detail-row"><span class="ap-detail-label">${$.label}</span><span class="ap-detail-value" style="color:${$.color||"#9e9a92"};">${$.value}</span></div>`;l+=`<div class="ap-actions"><div class="ap-action-btn purple" onclick="apSellPosition('${i.id}')">SELL POSITION</div><div class="ap-action-btn olive">HOLD</div></div>`}l+="</div>"}l+="</div></div>"}l+="</div>";const b=T.reduce((d,i)=>d+(i.principal||i.coverage||i.faceValue||0),0),p=b>0?Math.round(a/b*1e4)/100:0,m=T.length>0?Math.round(T.reduce((d,i)=>d+(i.rate||0),0)/T.length*10)/10:0,e=T.filter(d=>d.status==="LATE"||d.status==="DELINQUENT").length,n=T.length>0?Math.round(e/T.length*100):0;l+=`<div class="df-footer" style="flex-direction:column;gap:6px;">
        <div style="display:flex;gap:8px;justify-content:space-between;width:100%;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EXPOSURE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${c(s)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">EARNED</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;">${c(a)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">ROI</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${p>=0?"#5c5":"#c55"};">${p}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">AVG RATE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#ca5;">${m}%</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">RISK</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${n>20?"#c55":n>0?"#ca5":"#5c5"};">${n}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            ${["LOAN","INSURE","BOND"].map(d=>{const i=d==="LOAN"?"#5a8aaa":d==="INSURE"?"#aa7a5a":"#8a6aaa",w=T.filter(x=>x.type===d).length;return`<div style="text-align:center;padding:1px 6px;border:1px solid ${w>0?i+"33":"#2a2a24"};background:${w>0?i+"0a":"transparent"};"><div style="font-family:var(--font-mono);font-size:6px;color:${i};">${d}</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${w>0?"#e8e4dc":"#6a6660"};">${w}</div></div>`}).join("")}
        </div>
    </div>`,o.innerHTML=l}window.apSetFilter=st;window.apToggle=it;async function rt(o){const t=prompt(`RESTRUCTURE LOAN

Enter new annual interest rate (1-20%):
(This extends the term by 12 months and resets missed payments.)`);if(!t)return;const s=parseFloat(t);if(isNaN(s)||s<1||s>20){alert("Rate must be between 1% and 20%.");return}const{data:a}=await g.from("finance_active_loans").select("*").eq("id",o).single();if(!a){alert("Loan not found.");return}const r=a.term_months+12,l=s/100/12,b=Number(a.principal)-Number(a.total_paid||0)+Number(a.total_interest_paid||0),p=l>0?Math.round(b*(l*Math.pow(1+l,r))/(Math.pow(1+l,r)-1)):Math.round(b/r);if(!confirm(`Restructure to ${s}% over ${r} months?
New monthly payment: ${c(p)}
Missed payments reset to 0.`))return;const{error:m}=await g.from("finance_active_loans").update({interest_rate:s,term_months:r,monthly_payment:p,payments_missed:0,status:"current"}).eq("id",o);if(m){alert("Failed: "+m.message);return}alert("Loan restructured."),await ee(),Y()}async function lt(o){if(!confirm(`CALL LOAN

Demand immediate full repayment of remaining principal.
The borrower will have 3 ticks to pay or default.

Proceed?`))return;const{error:t}=await g.from("finance_active_loans").update({status:"delinquent",payments_missed:3}).eq("id",o);if(t){alert("Failed: "+t.message);return}alert("Loan called. Borrower has 1 tick to pay before default."),await ee(),Y()}async function ct(o){if(!confirm(`FORECLOSE

Immediately default the loan and seize collateral.
Collateral recovery: Equipment 60%, Property 75%, Unsecured 0%.

This cannot be undone. Proceed?`))return;const{data:t}=await g.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Loan not found.");return}const s=Math.max(0,Number(t.principal)-Number(t.total_paid||0));let a=0;t.collateral_type==="equipment"?a=.6:t.collateral_type==="property"&&(a=.75);const r=Math.round(s*a);if(r>0){const{data:l}=await g.from("factions").select("corp_cash_reserves").eq("id",_.id).single();await g.from("factions").update({corp_cash_reserves:Number(l?.corp_cash_reserves||0)+r}).eq("id",_.id),_.corp_cash_reserves=Number(l?.corp_cash_reserves||0)+r}await g.from("finance_active_loans").update({status:"defaulted",completed_tick:S?.current_tick||0}).eq("id",o),alert("Foreclosed. Recovered: "+c(r)+" from "+(t.collateral_type||"unsecured")+" collateral."),await ee(),Y()}async function dt(o){const{data:t}=await g.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Policy not found.");return}const s=Number(t.principal||0)-Number(t.claims_paid||0),a=Number(t.deductible_pct||0)/100,r=Math.round(s*(1-a));if(!confirm(`PAY CLAIM IN FULL

Claim: ${c(s)}
Deductible: ${t.deductible_pct}%
Payout: ${c(r)}

This will be deducted from your cash reserves.`))return;const{data:l}=await g.from("factions").select("corp_cash_reserves").eq("id",_.id).single(),b=Number(l?.corp_cash_reserves||0);if(b<r){alert("Insufficient funds. You have "+c(b)+".");return}await g.from("factions").update({corp_cash_reserves:b-r}).eq("id",_.id),_.corp_cash_reserves=b-r;const{data:p}=await g.from("factions").select("corp_cash_reserves").eq("id",t.borrower_faction_id).single();p&&await g.from("factions").update({corp_cash_reserves:Number(p.corp_cash_reserves||0)+r}).eq("id",t.borrower_faction_id),await g.from("finance_active_loans").update({claims_paid:Number(t.claims_paid||0)+r,claims_count:(t.claims_count||0)+1}).eq("id",o),alert("Claim paid: "+c(r)),await ee(),Y()}async function pt(o){const t=prompt(`NEGOTIATE CLAIM

Offer a percentage of the claim to settle (10-90%):
(Policyholder may reject low offers.)`);if(!t)return;const s=parseInt(t);if(isNaN(s)||s<10||s>90){alert("Must be between 10% and 90%.");return}const a=s/100;if(!(Math.random()<a)){alert("Offer rejected. The policyholder wants a higher settlement.");return}const{data:l}=await g.from("finance_active_loans").select("*").eq("id",o).single();if(!l)return;const b=Number(l.principal||0)-Number(l.claims_paid||0),p=Math.round(b*s/100),{data:m}=await g.from("factions").select("corp_cash_reserves").eq("id",_.id).single(),e=Number(m?.corp_cash_reserves||0);if(e<p){alert("Insufficient funds.");return}await g.from("factions").update({corp_cash_reserves:e-p}).eq("id",_.id),_.corp_cash_reserves=e-p;const{data:n}=await g.from("factions").select("corp_cash_reserves").eq("id",l.borrower_faction_id).single();n&&await g.from("factions").update({corp_cash_reserves:Number(n.corp_cash_reserves||0)+p}).eq("id",l.borrower_faction_id),await g.from("finance_active_loans").update({claims_paid:Number(l.claims_paid||0)+p,claims_count:(l.claims_count||0)+1,status:"repaid"}).eq("id",o),alert("Claim settled at "+s+"% ("+c(p)+"). Policy closed."),await ee(),Y()}async function ft(o){if(!confirm(`DISPUTE CLAIM

Challenge the validity of this claim.
This freezes the claim for 4 ticks while investigated.
If investigation finds the claim valid, you pay in full + 10% penalty.
If investigation finds fraud, claim is dismissed.

Dispute?`))return;Math.random()<.7?alert(`Investigation complete: claim is VALID.
You must now pay the full claim.`):(await g.from("finance_active_loans").update({status:"repaid",claims_count:0}).eq("id",o),alert(`Investigation complete: FRAUDULENT CLAIM detected.
Claim dismissed. Policy remains active.`)),await ee(),Y()}async function vt(o){const{data:t}=await g.from("finance_active_loans").select("*").eq("id",o).single();if(!t){alert("Position not found.");return}const s=Number(t.principal||0)-Number(t.total_paid||0),a=Math.round(s*.85);if(!confirm(`SELL POSITION

Remaining value: ${c(s)}
Market price (85%): ${c(a)}

You receive ${c(a)} immediately.
The position is removed from your portfolio.`))return;const{data:r}=await g.from("factions").select("corp_cash_reserves").eq("id",_.id).single();await g.from("factions").update({corp_cash_reserves:Number(r?.corp_cash_reserves||0)+a}).eq("id",_.id),_.corp_cash_reserves=Number(r?.corp_cash_reserves||0)+a,await g.from("finance_active_loans").update({status:"repaid",completed_tick:S?.current_tick||0}).eq("id",o),alert("Position sold for "+c(a)+"."),await ee(),Y()}window.apRestructure=rt;window.apCallLoan=lt;window.apForeclose=ct;window.apPayClaim=dt;window.apNegotiateClaim=pt;window.apDisputeClaim=ft;window.apSellPosition=vt;function ze(o,t){const s=o.reduce((a,r)=>a+r.value,0);return s===0?`<div class="rr-seg-bar" style="height:${t}px;background:#2a2a24;"></div>`:`<div class="rr-seg-bar" style="height:${t}px;">${o.map(a=>`<div style="width:${(a.value/s*100).toFixed(1)}%;height:100%;background:${a.color};"></div>`).join("")}</div>`}function ut(){const o=document.getElementById("rr-container");if(!o)return;const t=Number(_?.corp_cash_reserves)||0,s=T.filter(f=>f.type==="LOAN").reduce((f,y)=>f+(y.remaining||0),0),a=T.filter(f=>f.type==="INSURE").reduce((f,y)=>f+(y.coverage||0),0),r=T.filter(f=>f.type==="BOND").reduce((f,y)=>f+(y.faceValue||0),0),l=s+a+r,b=l,p=t+b,m=Ee?.12:.15,e=Math.round(l*m),n=l>0?Math.round(t/l*100):100,d=Math.round(m*100),i=n>=30?"HEALTHY":n>=20?"ADEQUATE":n>=d?"THIN":"CRITICAL",w=n>=30?"#5c5":n>=20?"#ca5":n>=d?"#c84":"#c55",x=Math.max(0,t-e),A={};for(const f of T){const y=f.nation||"Unknown",$=f.remaining||f.coverage||f.faceValue||0;A[y]=(A[y]||0)+$}const N=Object.entries(A).map(([f,y])=>({name:f,exposure:y,pct:l>0?Math.round(y/l*100):0})).sort((f,y)=>y.exposure-f.exposure),z={};for(const f of T){const y=f.type==="BOND"?"Government":f.sector||"Other",$=f.remaining||f.coverage||f.faceValue||0;z[y]=(z[y]||0)+$}const G=Object.entries(z).map(([f,y])=>({name:f,exposure:y,pct:l>0?Math.round(y/l*100):0})).sort((f,y)=>y.exposure-f.exposure),O=N.length>0?N[0].pct:0,U=O>60?"HIGH":O>40?"MODERATE":"LOW",k=U==="HIGH"?"#c55":U==="MODERATE"?"#ca5":"#5c5";let v=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Reserves & Risk</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${w};background:${w}12;border:1px solid ${w}25;">${i}</span>
    </div>`;if(v+='<div style="flex:1;overflow-y:auto;">',Ee&&(v+=`<div style="padding:5px 14px;background:rgba(200,168,50,0.06);border-bottom:1px solid rgba(200,168,50,0.15);display:flex;align-items:center;gap:6px;">
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:#c8a832;background:rgba(200,168,50,0.12);border:1px solid rgba(200,168,50,0.25);">POLICY</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#c8a832;">Financial Sector Deregulation Act</span>
            <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">Reserve req: ${d}% &middot; Interest: +10%</span>
        </div>`),v+='<div class="rr-section-bar">Capital Position</div>',v+='<div class="rr-section">',v+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">TOTAL ASSETS</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${c(p)}</span>
    </div>`,v+=ze([{value:t,color:"#5c5"},{value:b,color:"#8b9a6b"}],6),v+=`<div class="rr-seg-legend">
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#5c5;"></div>Cash ${c(t)}</div>
        <div class="rr-seg-legend-item"><div class="rr-seg-legend-dot" style="background:#8b9a6b;"></div>Deployed ${c(b)}</div>
    </div>`,v+="</div>",v+='<div class="rr-section">',v+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;">RESERVE RATIO</span>
        <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${w};">${n}%</span>
    </div>`,v+=`<div class="rd-bar" style="height:5px;"><div class="rd-bar__fill" style="width:${Math.min(n/60*100,100)}%;background:${w};"></div></div>`,v+=`<div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:3px;">
        <span style="color:#c55;">${d}% minimum</span><span>30% healthy</span><span style="color:#5c5;">60%+</span>
    </div>`,v+=`<div class="rr-reserve-cells">
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REQUIRED (${d}%)</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;margin-top:1px;">${c(e)}</div></div>
        <div class="rr-reserve-cell"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">AVAILABLE TO DEPLOY</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${x>0?"#5c5":"#c55"};margin-top:1px;">${c(x)}</div></div>
    </div>`,v+="</div>",v+='<div class="rr-section-bar">Exposure by Type</div>',v+='<div class="rr-section">',l>0){v+=ze([{value:s,color:"#5a8aaa"},{value:a,color:"#aa7a5a"},{value:r,color:"#8a6aaa"}],6),v+='<div style="margin-top:6px;">';const f=[{label:"Loans",value:s,color:"#5a8aaa",pct:l>0?Math.round(s/l*100):0},{label:"Insurance",value:a,color:"#aa7a5a",pct:l>0?Math.round(a/l*100):0},{label:"Bonds",value:r,color:"#8a6aaa",pct:l>0?Math.round(r/l*100):0}];for(let y=0;y<f.length;y++){const $=f[y];v+=`<div class="rr-type-row">
                <div style="width:6px;height:6px;background:${$.color};margin-right:6px;"></div>
                <span style="flex:1;font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${$.label}</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${c($.value)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;width:28px;text-align:right;">${$.pct}%</span>
            </div>`}v+="</div>"}else v+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No exposure</div>';if(v+="</div>",v+=`<div class="rr-section-bar" style="display:flex;justify-content:space-between;align-items:center;">
        <span>Concentration Risk</span>
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 6px;color:${k};background:${k}12;border:1px solid ${k}25;">${U}</span>
    </div>`,v+='<div class="rr-section">',N.length>0){v+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">BY NATION</div>';for(const f of N){const y=f.pct>50?"#c84":f.pct>30?"#ca5":"#5c5";v+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;width:52px;text-align:center;">${E(f.name.toUpperCase().slice(0,6))}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${f.pct}%;background:${y};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${c(f.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${f.pct>50?"#c84":"#9e9a92"};">${f.pct}%</span>
            </div>`}}if(G.length>0){v+='<div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:0.8px;margin-top:8px;margin-bottom:4px;">BY SECTOR</div>';for(const f of G){const y=f.pct>50?"#c84":f.pct>30?"#ca5":"#5c5";v+=`<div class="rr-conc-row">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:52px;">${E(f.name)}</span>
                <div style="flex:1;margin:0 6px;"><div class="rd-bar"><div class="rd-bar__fill" style="width:${f.pct}%;background:${y};"></div></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:50px;text-align:right;">${c(f.exposure)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;width:28px;text-align:right;color:${f.pct>50?"#c84":"#9e9a92"};">${f.pct}%</span>
            </div>`}}if(N.length===0&&G.length===0&&(v+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No positions to analyze</div>'),v+="</div>",v+='<div class="rr-section-bar">Actions</div>',v+='<div class="rr-section">',v+=`<div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Max single-deal size (${d}% reserve)</span>
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">${c(x)}</span>
    </div>`,O>50&&N.length>1){const f=N[0],y=Math.round(100/N.length),$=Math.round(l*y/100),pe=f.exposure-$;v+=`<div style="padding:6px 8px;background:rgba(200,136,68,0.06);border:1px solid rgba(200,136,68,0.15);margin-bottom:6px;">
            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#c84;margin-bottom:2px;">DIVERSIFICATION TIP</div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;line-height:1.5;">
                ${E(f.name)} is ${f.pct}% of your book (target: ~${y}%).
                Reduce exposure by ~${c(pe)} or grow positions in other nations.
            </div>
        </div>`}const q=T.filter(f=>f.status==="LATE"||f.status==="DELINQUENT").length,R=[];n>=30&&R.push("reserves"),O<=40&&R.push("diversified"),q===0&&R.push("no_delinquent"),T.length>=3&&R.push("scale");const P=R.length,re=P>=4?"EXCELLENT":P>=3?"GOOD":P>=2?"FAIR":"POOR",te=P>=4?"#5c5":P>=3?"#ca5":P>=2?"#c84":"#c55";v+=`<div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">PORTFOLIO HEALTH</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${te};">${re} (${P}/4)</span>
    </div>`,v+=`<div style="margin-top:4px;display:flex;gap:3px;">
        ${["Reserves","Diversified","No Defaults","Scale"].map((f,y)=>{const $=R.length>y&&R.includes(["reserves","diversified","no_delinquent","scale"][y]);return`<span style="flex:1;text-align:center;padding:2px 0;font-family:var(--font-mono);font-size:6px;font-weight:700;color:${$?"#5c5":"#6a6660"};border:1px solid ${$?"rgba(92,204,92,0.2)":"#2a2a24"};background:${$?"rgba(92,204,92,0.04)":"transparent"};">${$?"✓":"✗"} ${f}</span>`}).join("")}
    </div>`,v+="</div>",O>60&&N.length>0&&(v+=`<div class="rr-warning"><span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c55;">CONCENTRATION WARNING: </span>${O}% of exposure is in ${E(N[0].name)}. A sovereign crisis or economic downturn in this nation would affect the majority of your portfolio. Consider diversifying across nations.</div>`),v+="</div>",v+=`<div class="df-footer" style="justify-content:space-between;">
        <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">DEPLOYABLE CAPITAL</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${x>0?"#5c5":"#c55"};">${c(x)}</div></div>
        <div style="text-align:right;"><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">TOTAL EXPOSURE</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${c(l)}</div></div>
    </div>`,o.innerHTML=v}const Ue={REPAID:{color:"#5c5",label:"REPAID"},DEFAULTED:{color:"#c55",label:"DEFAULTED"},EXPIRED:{color:"#5c5",label:"EXPIRED"},CLAIMED:{color:"#c84",label:"CLAIMED"},MATURED:{color:"#5c5",label:"MATURED"},SOLD:{color:"#ca5",label:"SOLD EARLY"},FORECLOSED:{color:"#c55",label:"FORECLOSED"}};let M=[],Ne=-1;function mt(o){Ne=Ne===o?-1:o,Ae()}function Ae(){const o=document.getElementById("cc-container");if(!o)return;const t=M.reduce((m,e)=>m+(e.earned||0),0),s=M.reduce((m,e)=>m+(e.lost||0),0),a=M.reduce((m,e)=>m+(e.net||0),0),r=M.filter(m=>m.net>0).length,l=M.filter(m=>m.net<0).length,b=a>=0;let p=`<div class="df-header">
        <div class="df-header__left">
            <span class="df-header__dot">&#9679;</span>
            <span class="df-header__title">Collections</span>
        </div>
        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${M.length} RESOLVED</span>
    </div>`;if(p+=`<div class="cc-scorecard">
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">EARNED</div>
            <div class="cc-scorecard__value" style="color:#5c5;">${c(t)}</div>
        </div>
        <div class="cc-scorecard__cell">
            <div class="cc-scorecard__label">LOST</div>
            <div class="cc-scorecard__value" style="color:#c55;">${c(s)}</div>
        </div>
        <div class="cc-scorecard__cell" style="background:${b?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="cc-scorecard__label">NET P&amp;L</div>
            <div class="cc-scorecard__value" style="color:${b?"#5c5":"#c55"};">${b?"+":""}${c(a)}</div>
        </div>
    </div>`,M.length>0){const m=r/M.length*100;p+=`<div class="cc-winloss">
            <div class="cc-winloss__bar">
                <div style="width:${m}%;background:#5c5;height:100%;"></div>
                <div style="flex:1;background:#c55;height:100%;"></div>
            </div>
            <span class="cc-winloss__stat" style="color:#5c5;">${r}W</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&mdash;</span>
            <span class="cc-winloss__stat" style="color:#c55;">${l}L</span>
        </div>`}p+='<div class="cc-list">',M.length===0&&(p+='<div class="cc-empty">No resolved deals yet.<br>Completed loans, expired policies, and matured bonds appear here.</div>');for(let m=0;m<M.length;m++){const e=M[m],n=Le[e.type]||{class:"loan",label:e.type},d=Ue[e.outcome]||{color:"#9e9a92",label:e.outcome},i=Ne===m,w=e.net>=0;p+=`<div class="cc-deal" onclick="ccToggle(${m})" style="border-left:2px solid ${w?"#5c5":"#c55"};">
        <div class="cc-deal__inner" style="${i?"background:"+(e.type==="LOAN"?"rgba(90,138,170,0.08)":e.type==="INSURE"?"rgba(170,122,90,0.08)":"rgba(138,106,170,0.08)"):""}">`,p+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
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
            </div>`),p+=`<div style="flex:1;padding:3px 8px;text-align:right;border-left:1px solid #2a2a24;background:${w?"rgba(92,204,92,0.03)":"rgba(204,85,85,0.03)"};">
            <div class="df-metrics__label">NET</div>
            <div class="df-metrics__value" style="font-size:11px;color:${w?"#5c5":"#c55"};margin-top:1px;">${w?"+":""}${c(e.net||0)}</div>
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
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${b?"#5c5":"#c55"};">${b?"+":""}${c(a)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            ${Object.entries(M.reduce((m,e)=>(m[e.outcome]=(m[e.outcome]||0)+1,m),{})).map(([m,e])=>{const n=Ue[m]||{color:"#9e9a92",label:m};return`<div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:${n.color};letter-spacing:0.3px;">${n.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#e8e4dc;">${e}</div>
                </div>`}).join("")}
        </div>
    </div>`,o.innerHTML=p}window.ccToggle=mt;const _t={banking:"LOAN",insurance:"INSURE",investment:"BOND"};let h=null,L="LOAN",W=8,Q=18e6,_e=24,j="equipment",oe=3.5,H=12e6,Z=10,Te="",C=25e6;const qe=[{id:"none",label:"None",recovery:0,desc:"Unsecured loan. No recovery on default."},{id:"equipment",label:"Equipment",recovery:60,desc:"Seize financed equipment on default — recover ~60%."},{id:"property",label:"Property",recovery:75,desc:"Corporate property lien — recover ~75%."},{id:"full",label:"Full Assets",recovery:90,desc:"Full asset claim — recover ~90% but harder sell."}];function yt(o){const t=V[o];t&&(h=t,L=t.type,t.type==="LOAN"?(W=8,Q=t.amount,_e=t.term||24,j=t.collateral||"equipment"):t.type==="INSURE"?(oe=3.5,H=t.amount,Z=10,Te=""):t.type==="BOND"&&(C=Math.round(t.amount*.25)),document.getElementById("rd-overlay").classList.add("open"),document.body.style.overflow="hidden",ie())}function Fe(){document.getElementById("rd-overlay").classList.remove("open"),document.body.style.overflow="",h=null}function gt(o){W=Number(o),ie()}function bt(o){oe=Number(o),ie()}function ht(o){H=Number(o),ie()}function xt(o){Z=Number(o),ie()}function wt(o){C=Number(o),ie()}function de(o,t,s){return`<div class="rd-bar"><div class="rd-bar__fill" style="width:${Math.min(o/t*100,100)}%;background:${s};"></div></div>`}function ie(){const o=document.getElementById("rd-modal");if(!o||!h)return;const t=h,s=L==="LOAN"?"#5a8aaa":L==="INSURE"?"#aa7a5a":"#8a6aaa",a=Math.round(Q*(W/100)*(_e/12)),r=Math.round((Q+a)/_e),l=t.revenue||474e5,b=Math.round(r/l*1200),p=12,m=Math.max(0,(W-6)*1.5),e=Q>15e6?3:0,n=j==="none"?3:j==="full"?-2:0,d=Number(t.corp_debt||0),i=Number(t.corp_cash_reserves||1),w=d>0?Math.min(15,Math.round(d/Math.max(i,1)*5)):0,x=Math.min(60,Math.max(2,Math.round(p+m+e+n+w))),A=x<=15?"#5c5":x<=30?"#ca5":x<=45?"#c84":"#c55",N=x<=15?"LOW":x<=30?"MODERATE":x<=45?"ELEVATED":"HIGH",z=95,G=(W-4)*8,O=Q<(t.amount||18e6)?10:0,U=j==="full"?15:j==="property"?8:j==="none"?-5:0,k=Math.max(10,Math.min(95,Math.round(z-G-O-U))),v=k>=70?"#5c5":k>=45?"#ca5":k>=25?"#c84":"#c55",q={unsecured:"none",equipment:"equipment",property:"property"},R=qe.find(B=>B.id===(q[j]||j))||qe[0],P=Math.round(a*(1-x/100)),re=(t.term||18)/12,te=Math.round(H*(oe/100)*re),f=100-(t.reputation||50),y=Math.max(5,Math.min(50,Math.round(f*.4))),$=Math.round(H*(1-Z/100)),pe=Math.round($*(y/100)),fe=te-pe,be=y<=12?"#5c5":y<=22?"#ca5":y<=35?"#c84":"#c55",he=t.couponRate||6.2,Ce=t.term||60,Ie=Ce/12,Ve=Math.round(C*(he/100)),Oe=Math.round(C*(he/100)*Ie),ne=t.stability||50,ke=t.creditRating||50,De=t.debtToGdp||30,Ye=Math.max(2,Math.round((100-ne)*.15+(100-ke)*.15+Math.max(0,De-30)*.3)),K=Math.min(60,Ye),xe=K<=10?"#5c5":K<=20?"#ca5":K<=35?"#c84":"#c55",Me=Math.round(Oe*(1-K/100));let u=`<div class="rd-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:${s};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Review Deal</span>
            </div>
            <span onclick="rdClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>`;if(u+=`<div class="rd-tabs">
        <span class="rd-tab ${L==="LOAN"?"active-loan":L==="INSURE"?"active-insure":"active-bond"}" style="cursor:default;">${L==="LOAN"?"Loan":L==="INSURE"?"Insure":"Bond"} — ${E(t.applicant)}</span>
    </div></div>`,u+='<div class="rd-body">',u+='<div class="rd-left">',L==="LOAN"){const B=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84";u+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${E(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${E(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">CASH</div><div class="rd-applicant__stat-value" style="color:#5c5;">${c(t.corp_cash_reserves||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL DEBT</div><div class="rd-applicant__stat-value" style="color:#c84;">${c(t.corp_debt||0)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${B};">${t.reputation||"—"}</div></div>
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
        </div>`,u+='<div class="rd-section-bar" style="color:#5a8aaa;">Set Loan Terms</div>';const F=(W-3)/15*100;u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">INTEREST RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#5a8aaa;">${W}%</span>
            </div>
            <input type="range" class="rd-control__range" min="3" max="18" step="0.5" value="${W}"
                oninput="rdSetLoanRate(this.value)"
                style="background:linear-gradient(90deg,#5a8aaa ${F}%,#2a2a24 ${F}%);">
            <div class="rd-control__hints"><span>3% (generous)</span><span>18% (predatory)</span></div>
        </div>`,u+=`<div class="rd-control">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">Borrower's Terms (Fixed)</div>
            <div class="rd-risk-row"><span class="rd-risk-label">LOAN AMOUNT</span><span class="rd-risk-value" style="color:#e8e4dc;">${c(Q)}</span></div>
            <div class="rd-risk-row"><span class="rd-risk-label">TERM</span><span class="rd-risk-value" style="color:#e8e4dc;">${_e}mo</span></div>
            <div class="rd-risk-row"><span class="rd-risk-label">COLLATERAL</span><span class="rd-risk-value" style="color:#e8e4dc;">${R.label}</span></div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:6px;">Amount, term, and collateral are set by the borrower. You set the interest rate.</div>
        </div>`}if(L==="INSURE"){const B=(t.reputation||50)>=60?"#5c5":(t.reputation||50)>=35?"#ca5":"#c84",F=t.projectValue?"PROJECT":"FLEET",se=t.projectValue||t.fleetValue||0;u+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${E(t.abbr)}</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${E(t.applicant)}</span>
                <span class="df-badge df-badge-${t.entity.toLowerCase()}">${t.entity}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REP</div><div class="rd-applicant__stat-value" style="color:${B};">${t.reputation||"—"}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">${F}</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${c(se)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">REQUESTED</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${c(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${t.term}mo</div></div>
            </div>
        </div>`,t.purpose&&t.purpose!=="Construction Insurance"&&(u+=`<div style="padding:8px 14px;background:rgba(170,122,90,0.04);border-bottom:1px solid rgba(170,122,90,0.12);">
                <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#aa7a5a;letter-spacing:0.8px;margin-bottom:3px;">REQUESTED COVERAGE</div>
                <div style="font-size:10px;color:#e8e4dc;line-height:1.5;white-space:pre-wrap;">${E(t.purpose)}</div>
            </div>`),u+='<div class="rd-section-bar" style="color:#aa7a5a;">Set Policy Terms</div>';const le=(oe-1)/7*100;u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">PREMIUM RATE (ANNUAL)</span>
                <span class="rd-control__value" style="font-size:16px;color:#aa7a5a;">${oe}%</span>
            </div>
            <input type="range" class="rd-control__range" min="1" max="8" step="0.5" value="${oe}"
                oninput="rdSetInsurePremium(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${le}%,#2a2a24 ${le}%);">
            <div class="rd-control__hints"><span>1% (competitive)</span><span>8% (expensive)</span></div>
        </div>`;const ce=Math.round((t.projectValue||t.fleetValue||t.amount)*.7),I=Math.round(t.amount*.33),ve=(H-I)/(ce-I)*100;u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">COVERAGE AMOUNT</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${c(H)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${I}" max="${ce}" step="1000000" value="${H}"
                oninput="rdSetInsureCoverage(this.value)"
                style="background:linear-gradient(90deg,#aa7a5a ${ve}%,#2a2a24 ${ve}%);">
            <div class="rd-control__hints"><span>${c(I)} (partial)</span><span>${c(ce)} (max)</span></div>
        </div>`,u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEDUCTIBLE</span>
                <span class="rd-control__value" style="font-size:14px;color:#e8e4dc;">${Z}%</span>
            </div>
            <div class="rd-presets">`;for(const $e of[5,10,15,20,25])u+=`<span class="rd-preset" onclick="rdSetInsureDeductible(${$e})" style="${Z===$e?"color:#000;background:#aa7a5a;border-color:#aa7a5a;":""}">${$e}%</span>`;u+=`</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Policyholder pays first ${Z}% of any claim (${c(Math.round(H*Z/100))})</div>
        </div>`,u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">WHAT WE AGREE TO COVER</span>
            </div>
            <textarea id="rd-policy-terms" rows="3" placeholder="e.g., Covers weather delays, material damage, and labor disputes. Excludes negligence and acts of war. Maximum payout per claim: 50% of coverage."
                style="width:100%;box-sizing:border-box;padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:#e8e4dc;background:#1a1a16;border:1px solid #2a2a24;resize:vertical;line-height:1.5;"
                oninput="rdPolicyTerms=this.value">${Te||""}</textarea>
        </div>`}if(L==="BOND"){const B=ne>=50?"#5c5":ne>=30?"#ca5":ne>=15?"#c84":"#c55";u+=`<div class="rd-applicant">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span class="df-badge df-badge-gov" style="font-size:8px;padding:2px 6px;">GOV</span>
                <span style="font-size:13px;font-weight:700;color:#e8e4dc;">${E(t.applicant)}</span>
            </div>
            <div style="font-size:10px;color:#9e9a92;line-height:1.5;margin-bottom:6px;">${E(t.purpose)}</div>
            <div class="rd-applicant__stats">
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TOTAL ISSUE</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${c(t.amount)}</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">COUPON</div><div class="rd-applicant__stat-value" style="color:#8a6aaa;">${he}%</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">TERM</div><div class="rd-applicant__stat-value" style="color:#e8e4dc;">${Ce}mo</div></div>
                <div class="rd-applicant__stat"><div class="rd-applicant__stat-label">STABILITY</div><div class="rd-applicant__stat-value" style="color:${B};">${ne}</div></div>
            </div>
        </div>`,u+='<div class="rd-section-bar" style="color:#8a6aaa;">Purchase Amount</div>';const F=t.amount,se=Math.max(5e6,Math.ceil(F*.05/5e6)*5e6),le=(C-se)/(F-se)*100;u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BUY AMOUNT</span>
                <span class="rd-control__value" style="font-size:16px;color:#8a6aaa;">${c(C)}</span>
            </div>
            <input type="range" class="rd-control__range" min="${se}" max="${F}" step="5000000" value="${C}"
                oninput="rdSetBondAmount(this.value)"
                style="background:linear-gradient(90deg,#8a6aaa ${le}%,#2a2a24 ${le}%);">
            <div class="rd-control__hints"><span>${c(se)} (small position)</span><span>${c(F)} (full issuance)</span></div>
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;margin-top:6px;">Coupon rate and term are set by issuer. You choose how much to buy.</div>
        </div>`,u+=`<div class="rd-control" style="padding-top:8px;">
            <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">Nation Risk Profile</div>`;const ce=[{key:"stability",value:ne,label:"Political stability",invert:!1},{key:"debt_to_gdp",value:De,label:"Debt burden",invert:!0},{key:"credit_rating",value:ke,label:"Creditworthiness",invert:!1},{key:"gdp_growth",value:t.gdpGrowth||54,label:"Economic trajectory",invert:!1},{key:"corruption",value:t.corruption||62,label:"Institutional risk",invert:!0}];for(const I of ce){const ve=I.invert?I.value>60?"#c55":I.value>40?"#ca5":"#5c5":I.value>=50?"#5c5":I.value>=30?"#ca5":I.value>=15?"#c84":"#c55";u+=`<div class="rd-nation-stat">
                <span style="font-family:var(--font-mono);font-size:8px;color:#9e9a92;width:90px;">${I.key}</span>
                <div style="width:40px;">${de(I.value,100,ve)}</div>
                <span style="font-family:var(--font-mono);font-size:9px;color:#e8e4dc;width:18px;text-align:right;">${I.value}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${I.label}</span>
            </div>`}u+="</div>"}if(u+="</div>",u+='<div class="rd-right">',L==="LOAN"){u+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">DEFAULT PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${A};">${x}%</span>
            </div>
            ${de(x,100,A)}
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${A};margin-top:4px;">${N}</div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">Higher rates and larger amounts increase default risk.</div>
        </div>`,u+='<div class="rd-section-bar" style="color:#5a8aaa;">Acceptance Likelihood</div>',u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">BORROWER ACCEPTS</span>
                <span class="rd-control__value" style="font-size:14px;color:${v};">${k}%</span>
            </div>
            ${de(k,100,v)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">High rates and restrictive collateral reduce acceptance.</div>
        </div>`,u+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',u+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${c(Q)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL INTEREST</span><span class="rd-risk-value" style="color:#5c5;">${c(a)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">MONTHLY PAYMENT</span><span class="rd-risk-value" style="color:#9e9a92;">${c(r)}</span></div>`;const B=b>30?"#c55":b>15?"#ca5":"#5c5";u+=`<div class="rd-risk-row"><span class="rd-risk-label">BORROWER DEBT SERVICE</span><span class="rd-risk-value" style="color:${B};">${b}% of revenue</span></div>`,u+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${c(P)}</span></div>`,u+=`<div class="rd-formula">Risk-adjusted: total interest × (1 - ${x}% default)</div>`}if(L==="INSURE"){u+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">CLAIM PROBABILITY</span>
                <span class="rd-control__value" style="font-size:14px;color:${be};">${y}%</span>
            </div>
            ${de(y,100,be)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on contractor reputation, project complexity, and nation stability.</div>
        </div>`,u+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',u+=`<div class="rd-risk-row"><span class="rd-risk-label">MAX EXPOSURE</span><span class="rd-risk-value" style="color:#c55;">${c($)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL PREMIUMS</span><span class="rd-risk-value" style="color:#5c5;">${c(te)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">EXPECTED PAYOUT</span><span class="rd-risk-value" style="color:#c84;">${c(pe)}</span></div>`;const B=fe>0?"":" negative",F=fe>0?"#5c5":"#c55";u+=`<div class="rd-expected${B}"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED PROFIT</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${F};">${c(fe)}</span></div>`,u+=`<div class="rd-formula">Premiums (${c(te)}) − expected payout (${y}% × ${c($)})</div>`}L==="BOND"&&(u+='<div class="rd-section-bar" style="color:#a3b07e;">Risk Assessment</div>',u+=`<div class="rd-control">
            <div class="rd-control__header">
                <span class="rd-control__label">SOVEREIGN DEFAULT RISK</span>
                <span class="rd-control__value" style="font-size:14px;color:${xe};">${K}%</span>
            </div>
            ${de(K,100,xe)}
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Based on stability, debt/GDP, credit rating, and economic trajectory.</div>
        </div>`,u+='<div class="rd-section-bar" style="color:#5c5;">Projected Returns</div>',u+=`<div class="rd-risk-row"><span class="rd-risk-label">CAPITAL AT RISK</span><span class="rd-risk-value" style="color:#c55;">${c(C)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">ANNUAL COUPON</span><span class="rd-risk-value" style="color:#5c5;">${c(Ve)}</span></div>`,u+=`<div class="rd-risk-row"><span class="rd-risk-label">TOTAL RETURN (${Math.round(Ie)}yr)</span><span class="rd-risk-value" style="color:#5c5;">${c(Oe)}</span></div>`,u+=`<div class="rd-expected"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">EXPECTED RETURN</span><span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5c5;">${c(Me)}</span></div>`,u+=`<div class="rd-formula">Risk-adjusted: total coupon × (1 - ${K}% default)</div>`),u+="</div>",u+="</div>";const Ge=L==="LOAN"?Q:L==="INSURE"?H:C,He=L==="LOAN"?P:L==="INSURE"?fe:Me,je=L==="LOAN"?x:L==="INSURE"?y:K,We=L==="LOAN"?A:L==="INSURE"?be:xe,Xe=L==="LOAN"?"OFFER LOAN":L==="INSURE"?"WRITE POLICY":"BUY BONDS",Ke=L.toLowerCase(),we=!!t.alreadyOffered,Qe=we?"disabled":"",Je=we?' title="You already have an offer on this request."':"",Ze=we?"ALREADY OFFERED":Xe;u+=`<div class="rd-footer">
        <div style="display:flex;gap:12px;">
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">CAPITAL AT RISK</div><div class="rd-footer__metric-value" style="color:#c55;">${c(Ge)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">EXPECTED RETURN</div><div class="rd-footer__metric-value" style="color:#5c5;">${c(He)}</div></div>
            <div class="rd-footer__metric"><div class="rd-footer__metric-label">RISK</div><div class="rd-footer__metric-value" style="color:${We};">${je}%</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="rd-btn-decline" onclick="rdClose()">DECLINE</button>
            <button class="rd-btn-action ${Ke}" onclick="rdSubmitOffer()" ${Qe}${Je}>${Ze}</button>
        </div>
    </div>`,o.innerHTML=u}window.rdOpen=yt;window.rdClose=Fe;window.rdSetLoanRate=gt;window.rdSetInsurePremium=bt;window.rdSetInsureCoverage=ht;window.rdSetInsureDeductible=xt;window.rdSetBondAmount=wt;let D=!1;async function $t(){if(!h||!_||!S||D)return;if(h.alreadyOffered){alert("You already submitted an offer for this request.");return}D=!0;const o=S.current_tick||0,t=Number(_.corp_cash_reserves)||0;if(h.type==="LOAN"){const s=W;if(s<1||s>20){alert("Interest rate must be 1-20%."),D=!1;return}const{data:a}=await g.from("corp_properties").select("id").eq("faction_id",_.id).eq("type","branch_office").eq("is_active",!0),r=a?.length||0,l=Math.min(100,50+r*15),b=Math.round(t*l/100),{data:p}=await g.from("finance_active_loans").select("principal").eq("lender_faction_id",_.id).in("status",["current","late","delinquent"]),m=(p||[]).reduce((w,x)=>w+Number(x.principal||0),0),e=Math.max(0,b-m);if(h.amount>e){alert(`Lending cap reached. You can deploy ${Math.round(l)}% of cash ($${(b/1e6).toFixed(1)}M).
Already deployed: $${(m/1e6).toFixed(1)}M
Available: $${(e/1e6).toFixed(1)}M
This loan: $${(h.amount/1e6).toFixed(1)}M`+(r===0?`

Build a Branch Office to increase your lending cap (+15% each).`:"")),D=!1;return}if(t<h.amount){alert("Insufficient cash reserves to fund this loan."),D=!1;return}const d={none:"unsecured",equipment:"equipment",property:"property",full:"property"}[j]||"unsecured",{error:i}=await g.from("finance_loan_offers").insert({request_id:h.requestId,offering_faction_id:_.id,interest_rate:s,collateral_type:d,created_tick:o});if(i){D=!1,i.message.includes("unique")||i.message.includes("duplicate")?alert("You have already submitted an offer for this loan request."):alert("Failed to submit offer: "+i.message);return}}else if(h.type==="BOND"){if(t<C){alert("Insufficient cash reserves. Need "+c(C)+", have "+c(t)+"."),D=!1;return}const{error:s}=await g.from("finance_loan_offers").insert({request_id:h.requestId,offering_faction_id:_.id,interest_rate:h.couponRate,collateral_type:"unsecured",status:"accepted",created_tick:o});if(s){alert("Failed to buy bonds: "+s.message),D=!1;return}const a=h.couponRate/100/12;h.term;const r=Math.round(C*a),{error:l}=await g.from("finance_active_loans").insert({request_id:h.requestId,offer_id:null,borrower_faction_id:h.requestId,lender_faction_id:_.id,nation_id:h.nation_id||_.nation_id,principal:C,interest_rate:h.couponRate,term_months:h.term,collateral_type:"unsecured",purpose:h.purpose,monthly_payment:r,started_tick:o});if(l){alert("Failed to create bond position: "+l.message),D=!1;return}await g.from("factions").update({corp_cash_reserves:Math.max(0,t-C)}).eq("id",_.id);const{data:b}=await g.from("nations").select("debt").eq("id",h.nation_id).single();if(b){const{error:p}=await g.from("nations").update({debt:Number(b.debt||0)+C}).eq("id",h.nation_id);p&&console.warn("[Bonds] Failed to update nation debt:",p.message)}_.corp_cash_reserves=Math.max(0,t-C)}else if(h.type==="INSURE"){const s=oe,a=H,r=Z,l=Math.round(a*(s/100)/12),{error:b}=await g.from("finance_loan_offers").insert({request_id:h.requestId,offering_faction_id:_.id,interest_rate:s,collateral_type:"unsecured",status:"accepted",created_tick:o});if(b){D=!1,b.message.includes("unique")||b.message.includes("duplicate")?alert("You have already submitted a policy offer for this request."):alert("Failed to write policy: "+b.message);return}const{data:p}=await g.from("finance_loan_requests").update({status:"funded",funded_tick:o}).eq("id",h.requestId).select("requesting_faction_id").single(),m={request_id:h.requestId,offer_id:null,borrower_faction_id:p?.requesting_faction_id||h.requestId,lender_faction_id:_.id,nation_id:_.nation_id,principal:a,interest_rate:s,term_months:0,collateral_type:"unsecured",purpose:h.isVesselInsurance?"Vessel Insurance — "+h.applicant:"Insurance Policy — "+h.applicant,monthly_payment:l,started_tick:o,deductible_pct:r,policy_terms:Te.trim()||null};h.insuredVesselId&&(m.insured_vessel_id=h.insuredVesselId),h.insuredContractId&&(m.insured_contract_id=h.insuredContractId);const{error:e}=await g.from("finance_active_loans").insert(m);if(e){alert("Failed to create policy record: "+e.message),D=!1;return}}else{D=!1;return}Fe(),X=-1,await Be(),D=!1}window.rdSubmitOffer=$t;async function ee(){if(!_){Y();return}const{data:o}=await g.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",_.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"},s=a=>a.finance_loan_requests?.request_type==="insurance";T=(o||[]).map(a=>({id:a.id,type:t[a.finance_loan_requests?.request_type]||"LOAN",counterparty:a.borrower?.faction_name||"Unknown",abbr:a.borrower?.abbreviation||a.borrower?.corp_ticker||"??",nation:a.loan_nation?.name||a.borrower?.nation||"Unknown",remaining:s(a)?0:a.principal-a.total_paid,principal:a.principal,earned:s(a)?(a.monthly_payment||0)*(a.payments_made||0):a.total_interest_paid||0,rate:a.interest_rate,term:a.term_months,paymentsMade:a.payments_made,paymentsMissed:a.payments_missed,monthlyPayment:a.monthly_payment,status:a.status.toUpperCase(),collateral:a.collateral_type,purpose:a.purpose||"",alert:a.status==="late"||a.status==="delinquent",alertLevel:a.status==="delinquent"?"red":a.status==="late"?"orange":null,alertMsg:a.status==="delinquent"?`${a.payments_missed} missed payments. Default imminent.`:a.status==="late"?`${a.payments_missed} missed payment${a.payments_missed>1?"s":""}. Monitor closely.`:null,coverage:s(a)?a.principal:void 0,premiumsCollected:s(a)?(a.monthly_payment||0)*(a.payments_made||0):void 0,paidOut:s(a)?a.claims_paid||0:void 0,claims:s(a)?a.claims_count||0:void 0,deductible:s(a)?a.deductible_pct||0:void 0})),Y()}async function Et(){if(!_){Ae();return}const{data:o}=await g.from("finance_active_loans").select("*, borrower:factions!borrower_faction_id(id, faction_name, abbreviation, corp_ticker, nation), loan_nation:nations!nation_id(name), finance_loan_requests!inner(request_type)").eq("lender_faction_id",_.id).in("status",["repaid","defaulted"]).order("completed_tick",{ascending:!1}),t={loan:"LOAN",bond:"BOND",insurance:"INSURE"};M=(o||[]).map(s=>{const a=s.total_interest_paid||0,r=s.status==="defaulted"?Math.max(0,s.principal-s.total_paid):0;return{type:t[s.finance_loan_requests?.request_type]||"LOAN",counterparty:s.borrower?.faction_name||"Unknown",abbr:s.borrower?.abbreviation||s.borrower?.corp_ticker||"??",nation:s.loan_nation?.name||s.borrower?.nation||"",outcome:s.status==="repaid"?"REPAID":"DEFAULTED",principal:s.principal,earned:a,lost:r,net:a-r,resolved:s.completed_tick?"Tick "+s.completed_tick:"",term:s.term_months+"mo",rate:s.interest_rate+"%",note:s.status==="repaid"?`Fully repaid over ${s.payments_made} payments.`:`Defaulted after ${s.payments_missed} missed payments. ${s.collateral_type!=="unsecured"?"Collateral ("+s.collateral_type+") partially recovered losses.":"Unsecured — no collateral recovery."}`}}),Ae()}function Re(o){const t=new URL("corp-operations.html",window.location.href);t.search=window.location.search;const s=t.searchParams;s.set("tab",o),t.search=s.toString()?`?${s.toString()}`:"",window.location.href=t.toString()}function Nt(o){o?.preventDefault&&o.preventDefault(),Re("expansion")}function At(o){o?.preventDefault&&o.preventDefault(),Re("actions")}async function Lt(){const o=new URLSearchParams(window.location.search).get("tab"),t=o==="expansion"||o==="actions",s=t?o:"operations",{data:{user:a}}=await g.auth.getUser();if(!a){window.location.href="login.html";return}const{data:r}=await g.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);J=(r||[]).filter(e=>e.nation_id);const l=sessionStorage.getItem("active_faction_id");if(_=J.find(e=>e.id===l)||J.find(e=>e.faction_type==="corporation")||J[0],!_){await g.auth.signOut(),window.location.href="login.html";return}if(_.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(_.corp_sector!=="Finance"){const e={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html"};window.location.href=(e[_.corp_sector]||"corp-operations.html")+window.location.search;return}if(t){Re(o);return}sessionStorage.setItem("active_faction_id",_.id);const[b,p]=await Promise.all([_.nation_id?g.from("nations").select("*").eq("id",_.nation_id).single():Promise.resolve({data:null}),g.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);b.data&&b.data,S=p.data;const m=document.getElementById("corp-topbar-container");if(m){const{renderCorpTopBar:e}=await et(async()=>{const{renderCorpTopBar:n}=await import("./corp-topbar-kB28qcfr.js");return{renderCorpTopBar:n}},__vite__mapDeps([0,1]));e(m,{faction:_,shard:S,activeTab:s,allUserFactions:J})}if(Tt(),_.nation_id){const{data:e}=await g.from("active_laws").select("id, policy:policies!policy_id(policy_key)").eq("nation_id",_.nation_id).limit(100);Ee=(e||[]).some(n=>n.policy?.policy_key?.startsWith("financial_sector_deregulation"))}if(await Be(),await ee(),ut(),await Et(),S?.next_tick_at){const e=(Number(S.tick_interval_hours)||8)*36e5,n=new Date(S.next_tick_at).getTime(),i=n-e+e/2,w=new Date(i>Date.now()?i:n+e/2);kt(w)}}function Tt(){const o=document.getElementById("corp-faction-dropdown");if(!o||J.length<=1)return;let t="";for(const s of J){const a=s.id===_.id,r=s.faction_type==="corporation"?"CORP":"PARTY";t+=`<div class="corp-faction-dropdown__item${a?" active":""}" onclick="switchFaction('${s.id}')">
            <span style="font-size:7px;padding:1px 4px;background:${s.faction_type==="corporation"?"rgba(90,175,165,0.1)":"rgba(200,168,50,0.1)"};border:1px solid ${s.faction_type==="corporation"?"var(--teal-border)":"rgba(200,168,50,0.2)"};color:${s.faction_type==="corporation"?"var(--teal)":"var(--amber)"}">${r}</span>
            <span>${E(s.faction_name||"--")}</span>
        </div>`}o.innerHTML=t}function Rt(){document.getElementById("corp-faction-dropdown").classList.toggle("open")}function Ct(o){sessionStorage.setItem("active_faction_id",o);const t=J.find(s=>s.id===o);t&&t.faction_type==="party"?window.location.href="dashboard.html":window.location.reload()}function It(){document.body.classList.toggle("light-mode");const o=document.body.classList.contains("light-mode");localStorage.setItem("theme",o?"light":"dark");const t=document.getElementById("theme-toggle");t&&(t.textContent=o?"Dark":"Light")}async function Ot(){await g.auth.signOut(),window.location.href="login.html"}function kt(o){const t=document.getElementById("tick-countdown");if(!t)return;function s(){const a=new Date(o)-new Date;if(a<=0){t.textContent="Processing...";return}const r=Math.floor(a/36e5),l=Math.floor(a%36e5/6e4),b=Math.floor(a%6e4/1e3);t.textContent=`${r}h ${l}m ${b}s`}s(),setInterval(s,1e3)}if(localStorage.getItem("theme")==="light"){document.body.classList.add("light-mode");const o=document.getElementById("theme-toggle");o&&(o.textContent="Dark")}window.toggleCorpDropdown=Rt;window.switchFaction=Ct;window.toggleTheme=It;window.doLogout=Ot;window.switchToExpansion=Nt;window.switchToActions=At;Lt();
