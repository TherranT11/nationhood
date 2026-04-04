import{_}from"./supabase-client-BXEzLDpS.js";import{e as g}from"./utils-C2W-HleY.js";import{initMessaging as Gi}from"./messaging-B5Fng3EZ.js";import{c as Wi,a as At,E as De,b as Xe,d as ci,e as Fi,f as Vi,h as oi}from"./equipment-DsuDdEne.js";const pi={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},ce=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function Ee(i,e,t){const a=ce.find(l=>l.key===i);if(!a)return{available:!1,failedStat:"unknown_material"};const n=a.tiers[e];if(!n)return{available:!1,failedStat:"unknown_tier"};for(const l of n.requirements){const s=Number(t?.[l.stat]??0);if(s<l.min)return{available:!1,failedStat:l.stat,failedMin:l.min,nationValue:s}}return{available:!0}}function Ht(i,e,t){const n={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[i]?.[e];if(!n)return 0;const l=ce.find(d=>d.key===i);if(!l)return n;let s=1;for(const d of l.priceDrivers){const r=Number(t?.[d]??50);d==="inflation"||d==="fuel_prices"?s*=1+(r-50)/200:s*=1-(r-50)/250}return s=Math.max(.4,Math.min(2.5,s)),Math.round(n*s)}function mi(i,e,t){const n={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[i]?.[e]||0,s=ce.find(o=>o.key===i)?.priceDrivers?.[0],r=.3+(s?Number(t?.[s]??50):50)/50*.7;return Math.round(n*r)}const jt=["LOW","STD","HIGH"],zt={LOW:"Low",STD:"Standard",HIGH:"High"};let Ne=[],f=null,k=null,O=null,Ae=[],Oe={},te=[],G={},Lt=-1,H="concrete",j="STD",Te=500,ie=[],Bt=0,J="trucks",oe=0,se=1,xe=[],Ce=null,Ke=[],qt=null,Ye=null,Nt="ALL",Rt="TIMELINE";function q(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function Yi(i){if(i>=12){const e=Math.floor(i/12),t=i%12;return t>0?e+"y "+t+"mo":e+"y"}return i+" ticks"}function X(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(1)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(0)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function Ze(i){return i==="civil_engineering"?"CIVIL":i==="industrial"?"INDUSTRIAL":i==="mega_project"?"MEGA":i?.toUpperCase()||"—"}function fi(i){return i==="civil_engineering"?"light":i==="industrial"?"heavy":i==="mega_project"?"mega":"light"}function Qi(){Ye&&clearInterval(Ye),Ye=setInterval(()=>{if(!qt)return;const i=qt-Date.now();if(i<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(Ye);return}const e=Math.floor(i/36e5),t=Math.floor(i%36e5/6e4),a=Math.floor(i%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+a+"s"},1e3)}function Ki(){document.body.classList.toggle("light-mode");const i=document.getElementById("theme-toggle");i.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function Ji(i,e){i==="type"&&(Nt=e),i==="sort"&&(Rt=e),document.querySelectorAll(`.filter-pill[data-filter="${i}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),yi()}function ui(i){return!(!f||i.sector==="mega_project"&&f.corp_subsector!=="Megaprojects"||i.sector==="industrial"&&!["Heavy Infrastructure","Megaprojects"].includes(f.corp_subsector))}function yi(){const i=document.getElementById("oc-list");let e=[...Ae];if(Nt==="GOVERNMENT"?e=e.filter(n=>n.issuer_type==="GOVERNMENT"):Nt==="PRIVATE"&&(e=e.filter(n=>n.issuer_type==="PRIVATE")),Rt==="TIMELINE"&&e.sort((n,l)=>(n.timeline_ticks||0)-(l.timeline_ticks||0)),Rt==="BUDGET"&&e.sort((n,l)=>(l.budget_ceiling||0)-(n.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){i.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=O?.current_tick||0;let a="";for(const n of e){const l=n.issuer_type==="GOVERNMENT",s=l?"gov":"private",d=ui(n),r=d?"":" locked",o=fi(n.sector),c=Ze(n.sector),m=(n.timeline_ticks||0)>18?" warn":"",p=n.bidding_ends_tick?Math.max(0,n.bidding_ends_tick-t):"?";a+=`
            <div class="oc-item${r}" data-contract-id="${n.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${g(n.name)}</span>
                    <span class="oc-item__type-badge ${s}">${l?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${s}">${g(n.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${p} tick${p!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${X(n.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${m}">${Yi(n.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${o}">${c}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${Oe[n.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${X(Oe[n.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${d?"yes":"no"}">${d?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${d?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openBidModal(contracts.find(x=>x.id==='${n.id}'))">${Oe[n.id]?"EDIT":"VIEW"}</button>`:""}
                </div>
                ${n.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${g(n.description)}</div>`:""}
            </div>`}i.innerHTML=a,i.querySelectorAll(".oc-item:not(.locked)").forEach(n=>{n.addEventListener("click",()=>{const l=n.dataset.contractId,s=Ae.find(d=>d.id===l);s&&vi(s)})})}let pe=null;function vi(i){pe=i;const e=document.getElementById("cd-overlay"),t=i.issuer_type==="GOVERNMENT",a=t?"gov":"private",n=(k?.name||f.nation||"—").toUpperCase(),l=ui(i);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${g(n)}</span>
        <span class="cd-header__name">${g(i.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${a}">${g(i.issuer_name)}</span>
        <span class="cd-header__type-badge ${a}">${t?"GOV":"PRIVATE"}</span>
    `;const s=document.getElementById("cd-blueprint");i.blueprint_svg?(s.innerHTML=i.blueprint_svg,s.style.display=""):(s.innerHTML=vn(i),s.style.display="");const d=i.permits_required||[],r=i.required_equipment||i.equipment_required||[],o=i.required_materials||i.materials_estimated||{},m={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[i.sector]||i.spec_category||i.sector||"—";let p="var(--teal)";i.sector==="industrial"&&(p="var(--orange)"),i.sector==="mega_project"&&(p="var(--red)");let u=q(i.budget_ceiling||i.budget||0),y=(i.timeline_ticks||i.timeline_months||0)+" Months",v="";v+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${g(i.project_code||i.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${i.project_type?`<span class="cd-tag teal">${g(i.project_type.toUpperCase())}</span>`:""}
                ${i.project_subtype?`<span class="cd-tag gold">${g(i.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,i.description&&(v+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${g(i.description)}</div>
            </div>`),v+='<div class="cd-details">',i.project_type&&(v+=ge("Type",i.project_type)),i.project_subtype&&(v+=ge("Sub-Type",i.project_subtype)),v+=ge("Specialization",m,p),v+=ge("Total Budget",u,"var(--green)"),v+=ge("Timeline",y),v+=ge("Nation",k?.name||f.nation||"—"),i.region&&(v+=ge("Region",i.region)),v+="</div>",d.length>0&&(v+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${d.map(h=>{const C=h.status==="approved"?"approved":"required",R=h.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${C}">
                            <span class="cd-chip__icon">${R}</span>
                            <span class="cd-chip__label">${g(h.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),o.length>0&&(v+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${o.map(h=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${g(h.name)}</span>
                        <span class="cd-mat-row__qty">${g(String(h.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=v;const w=d.filter(h=>h.status==="approved").length,$=d.length-w,E=r.filter(h=>h.owned).length,A=r.length-E;let b="";r.length>0&&(A===0?b+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':b+=`<span class="cd-footer__badge bad">${A} EQUIPMENT MISSING</span>`),d.length>0&&($===0?b+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':b+=`<span class="cd-footer__badge warn">${$} PERMITS PENDING</span>`);const S=l;(f.action_points??0)>=2;const T=i.issuer_faction_id===f?.id,M=i.status==="bidding";document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${b}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${T?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${M?"":"disabled"} title="${M?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${S?"":"disabled"}
                    title="${S?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function et(i){i&&i.target&&i.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",pe=null)}const Xi=[{key:"concrete",name:"Concrete",unit:"units"},{key:"steel",name:"Steel",unit:"units"},{key:"lumber",name:"Lumber",unit:"units"},{key:"aggregate",name:"Aggregate",unit:"units"},{key:"em_systems",name:"E&M Systems",unit:"units"},{key:"glass_facades",name:"Glass & Facades",unit:"units"},{key:"asphalt",name:"Asphalt",unit:"units"},{key:"heavy_parts",name:"Heavy Machinery Parts",unit:"units"}],Zi=[{key:"work_trucks",name:"Work Trucks",tier:1},{key:"excavators",name:"Excavators",tier:1},{key:"bulldozers",name:"Bulldozers",tier:1},{key:"concrete_mixers",name:"Concrete Mixers",tier:1},{key:"tower_cranes",name:"Tower Cranes",tier:2},{key:"heavy_haulers",name:"Heavy Haulers",tier:2},{key:"pile_drivers",name:"Pile Drivers",tier:2},{key:"asphalt_plants",name:"Asphalt Plants",tier:2}],gi={LOW:.7,STANDARD:1,HIGH:1.4},xi={LOW:35,STANDARD:65,HIGH:90},gt=15;let W=null;function en(i){if(!i)return;const e=i.required_materials||{},t=i.required_equipment||[],a=i.required_workforce||{},n={concrete:18e4,steel:25e4,lumber:12e4,aggregate:8e4,em_systems:32e4,glass_facades:28e4,asphalt:14e4,heavy_parts:4e5},l=Xi.filter(c=>e[c.key]>0).map(c=>({...c,qty:e[c.key],basePrice:n[c.key]||2e5,grade:c.key==="aggregate"?"LOW":"STANDARD",highDisabled:!1})),s=Zi.filter(c=>t.includes(c.key)).map(c=>({...c,owned:(ie||[]).some(m=>m.equipment_key===c.key&&m.quantity>0)})),d=(a.general||100)+(a.skilled||20),r=i.budget_ceiling||1e8,o=Math.round(r*.03);W={contract:i,budgetCeiling:r,materials:l,laborCount:d,laborRate:15200,estimatedTicks:i.timeline_ticks||8,equipment:s,permits:[],overhead:o,markupPct:15,competitors:[],playerRep:f?.standing||50,requiredWorkforce:a},document.getElementById("bid-title").textContent="BID ASSEMBLY",document.getElementById("bid-subtitle").textContent=(i.name||"Contract")+" — "+Ze(i.sector)+" — "+(i.issuer_name||"Government"),document.getElementById("bid-overlay").classList.add("open"),document.body.style.overflow="hidden",tt()}function bi(i){i&&i.target!==document.getElementById("bid-overlay")||(document.getElementById("bid-overlay").classList.remove("open"),document.body.style.overflow="",W=null)}function N(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(2)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function tn(i,e){if(!W)return;const t=W.materials[i];e==="HIGH"&&t.highDisabled||(t.grade=e,tt())}function nn(i){W&&(W.laborCount=i,tt())}function an(i){W&&(W.markupPct=Number(i),tt())}function tt(){if(!W)return;const i=W;let e=0;for(const C of i.materials)C.lineCost=Math.round(C.qty*C.basePrice*gi[C.grade]),e+=C.lineCost;const t=Math.round(i.laborCount*i.laborRate*i.estimatedTicks),a=Math.round(i.equipment.filter(C=>C.owned).length*12e3*i.estimatedTicks);let n=0;const l=i.overhead,s=e+t+a+n+l,d=Math.round(s*i.markupPct/100),r=s+d,o=r>i.budgetCeiling,c=d,m=Math.round(i.materials.reduce((C,R)=>C+xi[R.grade],0)/i.materials.length),p=m>=80?"STRONG":m>=60?"PROMISING":m>=40?"UNCERTAIN":"POOR",u=m>=80?"var(--green)":m>=60?"var(--teal)":m>=40?"var(--orange)":"var(--red)",y=i.budgetCeiling>0?r/i.budgetCeiling:1,v=Math.max(0,Math.min(100,Math.round((1-y)*150))),w=v>=70?"STRONG":v>=40?"COMPETITIVE":v>=15?"WEAK":"UNLIKELY",$=v>=70?"var(--green)":v>=40?"var(--teal)":v>=15?"var(--orange)":"var(--red)",E=Math.round(s*(1-gt/100)),A=Math.round(s*(1+gt/100));let b="";b+='<div class="bid-section"><div class="bid-section__title">Materials</div>',i.materials.forEach((C,R)=>{const L=P=>{const K=C.grade===P,fe=P==="HIGH"&&C.highDisabled;return`<button class="bid-grade-btn ${K?P==="LOW"?"active-low":P==="HIGH"?"active-high":"active":""} ${fe?"disabled":""}" onclick="setBidGrade(${R},'${P}')">${P[0]}</button>`};b+=`<div class="bid-mat-row">
            <span class="bid-mat-row__name">${g(C.name)}</span>
            <span class="bid-mat-row__qty">×${C.qty}</span>
            <div class="bid-grade-btns">${L("LOW")}${L("STANDARD")}${L("HIGH")}</div>
            <span class="bid-mat-row__cost">${N(C.lineCost)}</span>
        </div>`}),b+=`<div class="bid-line-total"><span class="bid-line-total__label">MATERIALS TOTAL</span><span class="bid-line-total__value">${N(e)}</span></div></div>`;const S=(i.requiredWorkforce?.general||80)+(i.requiredWorkforce?.skilled||20),T=[Math.round(S*.8),S,Math.round(S*1.2),Math.round(S*1.4),Math.round(S*1.6)];b+='<div class="bid-section"><div class="bid-section__title">Labor</div>',b+='<div class="bid-labor-presets">',T.forEach(C=>{b+=`<button class="bid-labor-btn ${i.laborCount===C?"active":""}" onclick="setBidLabor(${C})">${C}</button>`}),b+="</div>";const M=i.requiredWorkforce||{};b+=`<div class="bid-labor-formula">Required: ${M.general||"?"} general + ${M.skilled||"?"} skilled<br>`,b+=`${i.laborCount} workers × ${N(i.laborRate)}/tick × ${i.estimatedTicks} ticks = <strong>${N(t)}</strong></div>`,b+=`<div class="bid-line-total"><span class="bid-line-total__label">LABOR TOTAL</span><span class="bid-line-total__value">${N(t)}</span></div></div>`,b+='<div class="bid-section"><div class="bid-section__title">Equipment</div>',i.equipment.forEach(C=>{const R=C.owned?"bid-equip-row__status--owned":"bid-equip-row__status--missing",L=C.owned?"✓ OWNED":"✗ NOT OWNED";b+=`<div class="bid-equip-row"><span class="bid-equip-row__name">${g(C.name)}</span><span class="bid-equip-row__status ${R}">${L}</span></div>`}),b+=`<div class="bid-line-total"><span class="bid-line-total__label">MAINTENANCE (${i.estimatedTicks}t)</span><span class="bid-line-total__value">${N(a)}</span></div></div>`,b+='<div class="bid-section"><div class="bid-section__title">Permits</div>',b+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:8px 0;">No permits required yet.</div>',b+='<div class="bid-line-total"><span class="bid-line-total__label">PERMITS TOTAL</span><span class="bid-line-total__value">$0</span></div></div>',b+='<div class="bid-section"><div class="bid-section__title">Overhead &amp; Contingency</div>',b+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Site management, insurance, admin</div>',b+=`<div class="bid-line-total"><span class="bid-line-total__label">OVERHEAD</span><span class="bid-line-total__value">${N(l)}</span></div></div>`,document.getElementById("bid-left").innerHTML=b;let h="";h+='<div class="bid-section"><div class="bid-section__title">Cost Summary</div>',h+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Materials</span><span class="bid-summary-row__value">${N(e)}</span></div>`,h+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Labor</span><span class="bid-summary-row__value">${N(t)}</span></div>`,h+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Equipment Maint.</span><span class="bid-summary-row__value">${N(a)}</span></div>`,h+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Permits</span><span class="bid-summary-row__value">${N(n)}</span></div>`,h+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Overhead</span><span class="bid-summary-row__value">${N(l)}</span></div>`,h+=`<div class="bid-cost-total"><span class="bid-cost-total__label">ESTIMATED COST</span><span class="bid-cost-total__value">${N(s)}</span></div>`,h+=`<div class="bid-accuracy">⚠ Estimate accuracy: ±${gt}%<br>Actual cost range: ${N(E)} — ${N(A)}</div>`,h+="</div>",h+='<div class="bid-section"><div class="bid-section__title">Markup</div>',h+=`<div class="bid-slider-wrap">
        <div class="bid-slider-label"><span class="bid-slider-label__pct">${i.markupPct}%</span><span style="color:var(--text-dim)">${N(d)}</span></div>
        <input type="range" class="bid-slider" min="0" max="40" value="${i.markupPct}" oninput="setBidMarkup(this.value)">
    </div></div>`,h+=`<div class="bid-price-hero ${o?"bid-price-hero--over":""}">
        <div class="bid-price-hero__label">YOUR BID PRICE</div>
        <div class="bid-price-hero__value">${N(r)}</div>
        ${o?'<div class="bid-price-hero__warning">EXCEEDS BUDGET CEILING ('+N(i.budgetCeiling)+")</div>":""}
    </div>`,h+=`<div class="bid-profit"><span class="bid-profit__label">PROJECTED PROFIT</span><span class="bid-profit__value">+${N(c)}</span></div>`,h+=`<div class="bid-compete">
        <div style="display:flex;justify-content:space-between;"><span class="bid-compete__label" style="color:${$}">${w}</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Competitiveness</span></div>
        <div class="bid-compete__bar-wrap"><div class="bid-compete__bar" style="width:${v}%;background:${$}"></div></div>
    </div>`,h+=`<div class="bid-quality">
        <div style="display:flex;justify-content:space-between;"><span class="bid-quality__label" style="color:${u}">${p} (${m}/100)</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Quality Estimate</span></div>
        <div class="bid-quality__bar-wrap"><div class="bid-quality__bar" style="width:${m}%;background:${u}"></div></div>
    </div>`,h+='<div class="bid-section" style="margin-top:8px;"><div class="bid-section__title">Competing Bids</div>',i.competitors.forEach(C=>{h+=`<div class="bid-competitor"><span class="bid-competitor__name">${g(C.name)}</span><span class="bid-competitor__rep">Rep ${C.rep}</span></div>`}),h+=`<div class="bid-competitor" style="color:var(--gold);"><span class="bid-competitor__name">You</span><span class="bid-competitor__rep">Rep ${i.playerRep}</span></div>`,h+="</div>",document.getElementById("bid-right").innerHTML=h,document.getElementById("bid-footer-price").textContent=N(r),document.getElementById("bid-footer-price").style.color=o?"var(--red)":"var(--gold)",document.getElementById("bid-footer-profit").textContent="+"+N(c),document.getElementById("bid-footer-quality").textContent=m+"/100",document.getElementById("bid-footer-quality").style.color=u,document.getElementById("bid-submit-btn").disabled=o}window.openBidModal=en;window.closeBidModal=bi;window.setBidGrade=tn;window.setBidLabor=nn;window.setBidMarkup=an;async function on(){if(!W||!f||qe)return;const i=W,e=i.contract;let t=0;const a={};for(const m of i.materials)t+=Math.round(m.qty*m.basePrice*gi[m.grade]),a[m.key]=m.grade;const n=Math.round(i.laborCount*i.laborRate*i.estimatedTicks),l=Math.round(i.equipment.filter(m=>m.owned).length*12e3*i.estimatedTicks),s=t+n+l+i.overhead,d=Math.round(s*i.markupPct/100),r=s+d,o=Math.round(i.materials.reduce((m,p)=>m+xi[p.grade],0)/(i.materials.length||1));if(r>i.budgetCeiling){alert("Bid exceeds budget ceiling. Lower your costs or markup.");return}const c=document.getElementById("bid-submit-btn");c.disabled=!0,c.textContent="SUBMITTING...",qe=!0;try{const{data:m}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),p=m?.current_tick||0,{data:u}=await _.from("contract_bids").select("id").eq("contract_id",e.id).eq("faction_id",f.id).maybeSingle();if(u){const{error:v}=await _.from("contract_bids").update({bid_price:r,material_grades:a,labor_count:i.laborCount,markup_pct:i.markupPct,estimated_cost:s,estimated_quality:o,submitted_at_tick:p}).eq("id",u.id);if(v)throw v}else{const{error:v}=await _.from("contract_bids").insert({contract_id:e.id,faction_id:f.id,bid_price:r,material_grades:a,labor_count:i.laborCount,markup_pct:i.markupPct,estimated_cost:s,estimated_quality:o,status:"pending",submitted_at_tick:p});if(v)throw v}bi();const y=document.getElementById("oc-count");if(y){const v=y.textContent;y.textContent="✓ BID SUBMITTED",y.style.color="var(--green)",setTimeout(()=>{y.textContent=v,y.style.color=""},2e3)}await me()}catch(m){console.error("Bid submission failed:",m),alert("Failed to submit bid: "+(m.message||"Unknown error")),c.disabled=!1,c.textContent="SUBMIT BID"}finally{qe=!1}}window.submitBid=on;const $e=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],si={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},ri={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let B=null;function sn(i){const e=te.find(M=>M.id===i);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,a=O?.current_tick||0,n=e.awarded_at_tick||a,l=e.timeline_ticks||8,s=Math.max(0,a-n),d=Math.min(100,s/l*100);let r=Math.min($e.length-1,Math.floor(d/(100/$e.length)));const o=Math.round(d%(100/$e.length)/(100/$e.length)*100),c=e.required_materials||{},m=t?.material_grades||{},p=Object.entries(c).map(([M,h])=>{const C=m[M]||"STANDARD",R=Math.round(h*(d/100)*(.6+Math.random()*.4));return{key:M,name:M.replace(/_/g," ").replace(/\b\w/g,L=>L.toUpperCase()),grade:C,allocated:h,used:Math.min(R,h)}}),y=(e.required_equipment||[]).map(M=>({key:M,name:M.replace(/_/g," ").replace(/\b\w/g,h=>h.toUpperCase()),qty:1+Math.floor(Math.random()*3),condition:55+Math.floor(Math.random()*40)})),v=e.budget_ceiling||0,w=t?.estimated_cost||0,$=Math.round(w*Math.min(1,s/l)),E=t?.estimated_quality||65,A=E>=80?"STRONG":E>=60?"PROMISING":E>=40?"FAIR":"UNCERTAIN",b=e.required_workforce||{},S=(b.general||0)+(b.skilled||0),T=t?.labor_count||S;B={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:a,awardedTick:n,totalTicks:l,ticksElapsed:s,phaseIdx:r,phaseProgress:o,materials:p,equipment:y,budget:v,estCost:w,spent:$,quality:E,qualityLabel:A,laborCount:T,wfNeeded:S,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",$i(e.id).then(()=>Ie()),Ie()}function rn(i){i&&i.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",B=null)}function ln(i){B&&(B.tab=i,B.expandedEvent=-1,B.selectedResponse=null,Ie())}function dn(i){B&&(B.expandedEvent=B.expandedEvent===i?-1:i,B.selectedResponse=null,Ie())}function cn(i){B&&(B.selectedResponse=B.selectedResponse===i?null:i,Ie())}function Ie(){if(!B)return;const i=B,e=i.project,t=e.issuer_type==="GOVERNMENT",a=Ze(e.sector),n=f?.nation||"Nation",l=i.awardedTick+i.totalTicks,s=Math.max(0,l-i.currentTick),d=i.currentTick>l,r=i.budget>0?Math.round(i.spent/i.budget*100):0,o=r>85?"var(--red)":r>60?"var(--amber)":"var(--teal)",c=i.budget-i.spent,m=i.events.filter(w=>w.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${g(n.toUpperCase())}</span>
                <span class="pm-hdr__name">${g(e.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${g(e.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${t?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${g(e.template_key||e.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${g(a.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${g((e.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let p='<div class="pm-phase__bar">';for(let w=0;w<$e.length;w++){const $=w<i.phaseIdx,E=w===i.phaseIdx;p+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${$?"done":E?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${$?"done":E?"active":""}">${$e[w]}</span>
        </div>`}p+="</div>",p+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${$e[i.phaseIdx]} — ${i.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${d?"var(--red)":"var(--text-secondary)"}">Tick ${i.ticksElapsed} / ${i.totalTicks}${d?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=p;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:m},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map(w=>`<button class="pm-tab${i.tab===w.id?" active":""}" onclick="pmSetTab('${w.id}')">
            ${w.label}${w.badge>0?`<span class="pm-tab__badge">${w.badge}</span>`:""}
        </button>`).join("");let y="";i.tab==="overview"?y=pn(i,e,o,r,c,s,d):i.tab==="events"?y=mn(i):i.tab==="materials"?y=fn(i):i.tab==="equipment"&&(y=un(i)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${y}</div>`;let v="";m>0&&(v+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${m} EVENT${m>1?"S":""} REQUIRES RESPONSE</span>`),v+=`<span class="pm-ftr__badge" style="color:${i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${i.quality}/100 — ${i.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${v}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function pn(i,e,t,a,n,l,s){const d=xt(i.awardedTick+i.totalTicks);xt(i.awardedTick+i.totalTicks);const r=xt(i.awardedTick),o=[{label:"Budget",value:X(i.budget),sub:`${a}% spent`,color:t},{label:"Spent",value:X(i.spent),color:"var(--red)"},{label:"Remaining",value:X(n),color:"var(--green)"},{label:"Quality",value:`${i.quality}/100`,sub:i.qualityLabel,color:i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${i.laborCount}/${i.wfNeeded}`,sub:`Bid: ${i.laborCount}`,color:i.laborCount<i.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${l} ticks`,sub:s?"OVERDUE":`Deadline: ${d}`,color:s?"var(--red)":"var(--text-bright)"}];let c="";c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${g(e.description||e.name)}</div>
    </div></div>`,c+='<div class="pm-metrics">';for(const p of o)c+=`<div class="pm-metric">
            <div class="pm-metric__label">${p.label}</div>
            <div class="pm-metric__value" style="color:${p.color}">${p.value}</div>
            ${p.sub?`<div class="pm-metric__sub">${g(p.sub)}</div>`:""}
        </div>`;c+="</div>",c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${r}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${s?"var(--red)":"var(--text-bright)"};font-weight:700">${d}</span></span>
        </div>
    </div></div>`;const m=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(m.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),m.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&m.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),m.length>0){c+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const p of m)c+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${g(p.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;c+="</div></div>"}return c}function mn(i){if(i.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<i.events.length;t++){const a=i.events[t],n=i.expandedEvent===t,l=a.status==="ACTIVE",s=si[a.type]||si.WEATHER,d=ri[a.severity]||ri.LOW;if(e+=`<div class="pm-evt ${l?"pm-evt--active":"pm-evt--resolved"}" style="${l?`border-left-color:${s.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${n?`background:${s.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${s.color};background:${s.bg};border:1px solid ${s.border}">${a.type}</span>
            <span class="pm-evt__sev-badge" style="color:${d}">${a.severity}</span>
            <span class="pm-evt__status" style="color:${l?"var(--red)":"var(--text-dim)"};font-weight:${l?"700":"400"}">${l?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${g(a.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${a.tick} · ${g(a.id||"")}</div>`,n){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${g(a.desc)}</div>`,a.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${g(a.impact)}</span>
                </div>`),l&&a.responses&&a.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let r=0;r<a.responses.length;r++){const o=a.responses[r],c=i.selectedResponse===r,p={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[o.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${c?" selected":""}" style="${c?`border-color:${p}`:""}" onclick="event.stopPropagation();pmSelectResponse(${r})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${g(o.label)}</span>
                            <span class="pm-resp__tag" style="color:${p};background:${p}12;border:1px solid ${p}25">${o.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${o.delay>0?"var(--orange)":"var(--green)"}">
                            ${o.delay>0?`+${o.delay} tick${o.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${g(o.detail)}</div>`,e+='<div class="pm-resp__costs">',o.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${X(o.cost)}</span>`),o.qualityImpact&&o.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${o.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${o.qualityImpact>0?"+":""}${o.qualityImpact}</span>`),!o.cost&&(!o.qualityImpact||o.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",c&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${p}" onclick="event.stopPropagation();confirmEventResponse('${a.id}','${o.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!l&&a.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${g(a.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function fn(i){if(i.materials.length===0)return'<div class="pm-evt-empty">No materials allocated to this project.</div>';let e='<div class="pm-tab-header">Allocated Materials</div>';for(const t of i.materials){const a=t.allocated>0?Math.round(t.used/t.allocated*100):0,n=t.grade==="HIGH"?"high":t.grade==="LOW"?"low":"std",l=t.grade==="HIGH"?"var(--green)":t.grade==="LOW"?"var(--orange)":"var(--amber)";e+=`<div class="pm-mat">
            <div class="pm-mat__row1">
                <div class="pm-mat__left">
                    <span class="pm-mat__name">${g(t.name)}</span>
                    <div class="pm-mat__grade-dot pm-mat__grade-dot--${n}"></div>
                    <span class="pm-mat__grade" style="color:${l}">${t.grade}</span>
                </div>
                <span class="pm-mat__qty">${t.used.toLocaleString()} / ${t.allocated.toLocaleString()}</span>
            </div>
            <div class="pm-mat__bar-row">
                <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${a}%"></div></div>
                <span class="pm-mat__pct">${a}% consumed</span>
            </div>
        </div>`}return e}function un(i){if(i.equipment.length===0)return'<div class="pm-evt-empty">No equipment deployed to this project.</div>';let e='<div class="pm-tab-header">Deployed Equipment</div>';for(const t of i.equipment){const a=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",n=t.condition<60;e+=`<div class="pm-eq">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${g(t.name)}</span>
                    <span class="pm-eq__qty">×${t.qty}</span>
                    ${n?'<span class="pm-eq__wear">WEAR</span>':""}
                </div>
            </div>
            <div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${a}"></div></div>
                <span class="pm-eq__cond-val" style="color:${a}">${t.condition}%</span>
            </div>
        </div>`}return e}function xt(i){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][i%12]}, ${2e3+Math.floor(i/12)}`}window.openProjectModal=sn;window.closeProjectModal=rn;window.pmSetTab=ln;window.pmToggleEvent=dn;window.pmSelectResponse=cn;async function $i(i){if(!B)return;const{data:e,error:t}=await _.from("construction_events").select("*").eq("contract_id",i).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),B.events=[]):B.events=(e||[]).map(a=>({id:a.id,type:a.type,severity:a.severity,tick:a.fired_at_tick,title:a.title,desc:a.description,impact:a.impact,status:a.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:a.resolution,responses:a.responses||[]})),Ie()}let bt=!1;async function yn(i,e){if(!(bt||!B)){bt=!0;try{const{data:t,error:a}=await _.rpc("resolve_construction_event",{p_event_id:i,p_response_key:e});if(a){console.error("Failed to resolve event:",a.message),alert("Failed to submit response: "+a.message);return}const n=typeof t=="string"?JSON.parse(t):t;if(n?.error){alert("Error: "+n.error);return}await $i(B.project.id),await _i(),n?.quality_applied&&n.quality_applied!==0&&(B.quality=Math.max(0,Math.min(100,B.quality+n.quality_applied)),B.qualityLabel=B.quality>=80?"STRONG":B.quality>=60?"PROMISING":B.quality>=40?"FAIR":"UNCERTAIN"),Ie()}finally{bt=!1}}}window.confirmEventResponse=yn;function ge(i,e,t){const a=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${g(i)}</span>
        <span class="cd-detail-row__value"${a}>${g(e)}</span>
    </div>`}function vn(i){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=i.drawing_number||i.contract_number+"-A1",a=O?.current_date||"",n=a?a.replace(/,\s*/," "):"",l=i.spec_category==="Heavy Infrastructure",s=i.spec_category==="Megaproject";let d=g(i.project_subtype||i.project_type||"STRUCTURE"),r=l?"80.0m":s?"200.0m":"60.0m",o=l?"40.0m":s?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(c,m)=>`<line x1="${m*20}" y1="0" x2="${m*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(c,m)=>`<line x1="0" y1="${m*20}" x2="680" y2="${m*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${d.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${e.text}" font-family="var(--font-mono)">${g(i.name)}</text>

        <!-- Internal divisions -->
        <line x1="200" y1="30" x2="200" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="340" y1="30" x2="340" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="480" y1="30" x2="480" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="60" y1="90" x2="620" y2="90" stroke="${e.line}" stroke-width="0.4" stroke-dasharray="4,2"/>

        <!-- Dimension: top -->
        <line x1="60" y1="20" x2="620" y2="20" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="60" y1="17" x2="60" y2="23" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="620" y1="17" x2="620" y2="23" stroke="${e.dim}" stroke-width="0.5"/>
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)">${r}</text>

        <!-- Dimension: right -->
        <line x1="630" y1="30" x2="630" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="30" x2="633" y2="30" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="150" x2="633" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${o}</text>

        <!-- Scale bar -->
        <line x1="60" y1="175" x2="160" y2="175" stroke="${e.accent}" stroke-width="0.8"/>
        <line x1="60" y1="172" x2="60" y2="178" stroke="${e.accent}" stroke-width="0.8"/>
        <line x1="110" y1="173" x2="110" y2="177" stroke="${e.accent}" stroke-width="0.5"/>
        <line x1="160" y1="172" x2="160" y2="178" stroke="${e.accent}" stroke-width="0.8"/>
        <text x="60" y="186" font-size="5" fill="${e.text}" font-family="var(--font-mono)">0m</text>
        <text x="107" y="186" font-size="5" fill="${e.text}" font-family="var(--font-mono)">5m</text>
        <text x="154" y="186" font-size="5" fill="${e.text}" font-family="var(--font-mono)">10m</text>

        <!-- Title block -->
        <rect x="490" y="165" width="180" height="24" fill="${e.bg}" stroke="${e.line}" stroke-width="0.5"/>
        <text x="500" y="175" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">DWG NO.</text>
        <text x="540" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${g(t)}</text>
        <text x="500" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${g(n)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}let $t=!1;async function gn(){if($t||!pe||!f)return;if((f.action_points??0)<2){alert("You need at least 2 AP to place a bid.");return}$t=!0;const i=document.querySelector(".cd-btn.primary");i&&(i.disabled=!0,i.textContent="...");try{const{data:e,error:t}=await _.rpc("deduct_ap",{p_faction_id:f.id,p_cost:2});if(t)throw t;if(e<0){const n=-e-1;f.action_points=n,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+n+" AP</span>",i&&(i.disabled=!1,i.textContent="BID"),alert("Insufficient AP. You have "+n+" AP, need 2.");return}const{error:a}=await _.from("corp_contract_bids").insert({contract_id:pe.id,faction_id:f.id,nation_id:f.nation_id,ap_spent:2,created_at_tick:O?.current_tick||null});if(a)throw await _.rpc("deduct_ap",{p_faction_id:f.id,p_cost:-2}),f.action_points=e+2,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+(e+2)+" AP</span>",a;f.action_points=e,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+e+" AP</span>",i&&(i.textContent="BID PLACED")}catch(e){i&&(i.disabled=!1,i.textContent="BID"),e.code==="23505"?alert("You have already placed a bid on this contract."):alert("Failed to place bid: "+(e.message||"Unknown error"))}finally{$t=!1}}async function me(){if(!f||!f.nation_id)return;const{data:i,error:e}=await _.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e?(console.warn("Failed to load contracts:",e.message),Ae=[]):Ae=i||[],Oe={},f&&Ae.length>0){const t=Ae.map(n=>n.id),{data:a}=await _.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",f.id).in("contract_id",t);for(const n of a||[])Oe[n.contract_id]=n}yi()}function xn(){const i=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=te.length+" ACTIVE",te.length===0){i.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=O?.current_tick||0;let a=0,n=0,l="";for(const s of te){const d=s.issuer_type==="GOVERNMENT",r=d?"gov":"private",o=Array.isArray(s.contract_bids)?s.contract_bids[0]:s.contract_bids,c=o?.bid_price||0,m=o?.estimated_cost||0,p=o?.estimated_quality||0,u=s.budget_ceiling||0,y=s.awarded_at_tick||t,v=y+(s.timeline_ticks||8),w=Math.max(0,v-t),$=Math.max(0,t-y),E=s.timeline_ticks||8,A=Math.min(100,Math.round($/E*100)),b=t>v;fi(s.sector);const S=Ze(s.sector);a+=u,n+=c,l+=`<div class="ap-item" onclick="openProjectModal('${s.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${g(s.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${g(s.issuer_name||"—")} · ${S}</div>
                </div>
                <span class="oc-item__type-badge ${r}">${d?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS</span>
                    <span class="ap-budget__values" style="color:${b?"var(--red)":"var(--teal)"}">
                        ${$}/${E} ticks ${b?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${A}%;background:${b?"var(--red)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${X(c)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${X(m)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${p>=70?"var(--green)":p>=40?"var(--teal)":"var(--orange)"}">${p}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${b?"var(--red)":"var(--text-bright)"}">${w} ticks</div>
                </div>
            </div>
        </div>`}i.innerHTML=l,e.style.display=te.length>0?"":"none",te.length>0&&(document.getElementById("ap-total-crew").textContent=te.length,document.getElementById("ap-total-budget").textContent=X(a),document.getElementById("ap-total-spent").textContent=X(n))}async function _i(){if(!f)return;const{data:i,error:e}=await _.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",f.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",f.id).order("awarded_at_tick",{ascending:!0});e?(console.warn("Failed to load active projects:",e.message),te=[]):te=i||[],xn()}const hi=3e4;function wi(){let i=0,e=0;for(const t of ce)for(const a of jt){const n=G[t.key]?.[a];n&&(i+=n.qty,e+=n.value)}return{totalUnits:i,totalValue:e}}function Ut(){const i=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=wi();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=q(t);const a=Math.round(e/hi*100),n=document.getElementById("wh-capacity");n.textContent=a+"%",n.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)";let l="";for(let s=0;s<ce.length;s++){const d=ce[s],r=Lt===s,o=G[d.key]?.LOW||{qty:0,value:0},c=G[d.key]?.STD||{qty:0,value:0},m=G[d.key]?.HIGH||{qty:0,value:0},p=o.qty+c.qty+m.qty,u=o.value+c.value+m.value,y=p===0,v=Ee(d.key,"LOW",k),w=Ee(d.key,"STD",k),$=Ee(d.key,"HIGH",k),E=o.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",A=c.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",b=$.available?m.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(l+='<div class="wh-row">',l+=`<div class="wh-row__collapsed${r?" expanded":""}" onclick="toggleWhRow(${s})">
            <span class="wh-row__arrow">${r?"▾":"▸"}</span>
            <span class="wh-row__name${y?" empty":""}">${g(d.name)}</span>
            <div class="wh-row__dots">
                <div class="${E}"></div>
                <div class="${A}"></div>
                <div class="${b}"></div>
            </div>
            <span class="wh-row__qty${y?" empty":""}">${p>0?p.toLocaleString():"—"}</span>
            <span class="wh-row__val${y?" empty":""}">${u>0?q(u):"—"}</span>
        </div>`,r){l+='<div class="wh-expand">',l+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const S=[{key:"LOW",label:"Low",data:o,avail:v,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:c,avail:w,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:m,avail:$,color:"var(--green)",dotClass:"wh-dot--high"}];for(const T of S){const M=!T.avail.available,h=T.data.qty>0,C=h?"$"+Math.round(T.data.value/T.data.qty):"—";l+=`<div class="wh-grade${M?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${T.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${M?"var(--red)":T.color}">${T.label}</span>
                        ${M?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${h?"var(--text-bright)":"var(--text-dim)"}">${h?T.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${T.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${T.data.value>0?q(T.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${C}</span>
                </div>`}for(const T of S)!T.avail.available&&T.avail.failedStat&&(l+=`<div class="wh-lock">
                        <span class="wh-lock__text">${T.label.toUpperCase()} GRADE LOCKED — ${g(T.avail.failedStat)} &lt; ${T.avail.failedMin}</span>
                    </div>`);l+="</div>"}l+="</div>"}i.innerHTML=l}function bn(i){Lt=Lt===i?-1:i,Ut()}async function $n(){if(!f)return;const{data:i,error:e}=await _.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",f.id);if(G={},e)console.warn("Failed to load warehouse:",e.message);else if(i)for(const t of i)G[t.material_key]||(G[t.material_key]={}),G[t.material_key][t.quality_tier]={qty:t.quantity||0,value:Number(t.total_value)||0};Ut()}const _n={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function ki(){const i=(k?.name||f?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+i;const e=Number(f?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=q(e);const{totalUnits:t}=wi(),a=Math.round(t/hi*100),n=document.getElementById("pr-wh-capacity");n.textContent=a+"%",n.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)",Ei(),Gt(),it()}function Ei(){const i=document.getElementById("pr-mat-grid");let e="";for(const t of ce){const a=H===t.key,n=jt.every(s=>!Ee(t.key,s,k).available),l="pr-mat-btn"+(a?" active":"")+(n?" all-locked":"");e+=`<span class="${l}" onclick="setPrMat('${t.key}')">${g(t.name)}</span>`}i.innerHTML=e}function Gt(){const i=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const t of jt){const a=Ee(H,t,k),n=j===t,l=a.available?Ht(H,t,k):null,s=pi[t],d=!a.available,r="pr-tier-btn"+(n?" active":"")+(d?" locked":"");e+=`<div class="${r}" onclick="${d?"":`setPrTier('${t}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${s};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${n?"var(--text-bright)":"var(--text-dim)"}">${zt[t]}</span>
            </div>
            ${l!==null?`<div class="pr-tier-btn__price" style="color:${n?"var(--text-bright)":"var(--text-muted)"}">$${l}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}i.innerHTML=e}function it(){const i=document.getElementById("pr-content"),e=Ee(H,j,k),t=ce.find($=>$.key===H);if(!t)return;if(!e.available){i.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${g(t.name)} — ${zt[j]} grade
                    is not produced domestically in ${g(k?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${g(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const a=Ht(H,j,k),n=mi(H,j,k),l=a*Te,s=n>3e3?"LOW":n>1e3?"MODERATE":"HIGH",d=s==="LOW"?"var(--green)":s==="MODERATE"?"var(--amber)":"var(--red)",r=Number(k?.inflation??50),o=r>55?"up":r<45?"down":"flat",c=o==="up"?"&#9650;":o==="down"?"&#9660;":"&#8212;",m=o==="up"?"var(--red)":o==="down"?"var(--green)":"var(--text-dim)";let p="";p+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${a}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${m}">${c}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${n.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${d};margin-top:2px;">${s}</div>
            </div>
        </div>
    </div>`,p+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${g(k?.name||"—")})</div>`;for(const $ of t.priceDrivers){const E=Number(k?.[$]??50),A=E>=50?"var(--green)":E>=30?"var(--amber)":E>=15?"var(--orange)":"var(--red)",b=_n[$]||$;p+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${g($)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${E}%;background:${A}"></div>
            </div>
            <span class="pr-driver-row__val">${E}</span>
            <span class="pr-driver-row__effect">${g(b)}</span>
        </div>`}p+="</div>";const y=(Number(f?.corp_cash_reserves)||0)>=l,v=Te>n,w=pi[j];p+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${g(t.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${w};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${w}">${zt[j]}</span>
                </div>
                <span class="pr-order__mat-price">$${a}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map($=>`<span class="pr-qty-btn${Te===$?" active":""}" onclick="setPrQty(${$})">${$>=1e3?$/1e3+"k":$}</span>`).join("")}
                </div>
            </div>
            ${v?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${n.toLocaleString()} this tick</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${q(l)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${y&&!v?"":"disabled"}
                    title="${y?v?"Exceeds supply":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,i.innerHTML=p}function hn(i){H=i,j="STD";for(const e of["STD","HIGH","LOW"])if(Ee(i,e,k).available){j=e;break}Ei(),Gt(),it()}function wn(i){j=i,Gt(),it()}function kn(i){Te=i,it()}let _t=!1;async function En(){if(_t||!f||!k)return;const i=Ht(H,j,k),e=mi(H,j,k),t=i*Te,a=Number(f.corp_cash_reserves)||0;if(t>a){alert("Insufficient cash reserves.");return}if(Te>e){alert("Exceeds available supply this tick.");return}_t=!0;const n=document.querySelector(".pr-purchase-btn");n&&(n.disabled=!0,n.textContent="...");try{const l=a-t,{error:s}=await _.from("factions").update({corp_cash_reserves:l}).eq("id",f.id);if(s)throw s;const d=G[H]?.[j],r=(d?.qty||0)+Te,o=(d?.value||0)+t,{error:c}=await _.from("corp_warehouse").upsert({faction_id:f.id,nation_id:f.nation_id,material_key:H,quality_tier:j,quantity:r,total_value:o,last_purchased_tick:O?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(c){const{error:m}=await _.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);throw m&&console.error("Cash refund failed after warehouse error:",m.message),c}f.corp_cash_reserves=l,G[H]||(G[H]={}),G[H][j]={qty:r,value:o},Ut(),ki(),n&&(n.textContent="PURCHASED",setTimeout(()=>{n.isConnected&&(n.disabled=!1,n.textContent="PURCHASE")},1500))}catch(l){n&&(n.disabled=!1,n.textContent="PURCHASE"),alert("Purchase failed: "+(l.message||"Unknown error"))}finally{_t=!1}}function Ti(i){const e=Ce||k;if(!e)return[];const t=Xe(i);if(!t)return[];const a=Fi(i,e),n=[],l=Number(e?.inflation??50),s=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const d=Ce&&k&&Ce.id!==k.id;let r=null;if(d&&(r=Vi(e,k)),a.newAvailable>0){const o=oi(i,e),c=t.basePrice,m=Math.round(c*((l-50)/200)),p=Math.round(c*((s-50)/300));let u=o;const y=[{label:"Base price",value:q(c)},m!==0?{label:`Inflation (${l})`,mod:(m>=0?"+":"")+q(Math.abs(m))}:null,p!==0?{label:`Fuel transport (${s})`,mod:(p>=0?"+":"")+q(Math.abs(p))}:null].filter(Boolean),v=o-c-m-p;if(v!==0&&!d&&y.push({label:"Demand/scarcity",mod:(v>=0?"+":"")+q(Math.abs(v))}),d&&r){const w=Math.round(o*r.tariff),$=Math.round(o*r.transport);u=o+w+$,y.push({label:`Import tariff (${Math.round(r.tariff*100)}%)`,mod:"+"+q(w)}),y.push({label:`Transport (${r.deliveryTicks} tick${r.deliveryTicks>1?"s":""})`,mod:"+"+q($)})}n.push({seller:d?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:d?r?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:a.newAvailable,delivery:d?r.deliveryTicks+" tick"+(r.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:d?r.deliveryTicks:0,used:!1,priceFactors:y,sourceNationId:e.id})}if(a.usedAvailable>0){const o=a.usedCondition,c=oi(i,e,{used:!0,condition:o});let m=c;const p=[{label:"Base price",value:q(t.basePrice)},{label:`Condition (${o}%)`,mod:"-"+q(Math.max(0,t.basePrice-c))}];if(d&&r){const u=Math.round(c*r.tariff),y=Math.round(c*r.transport);m=c+u+y,p.push({label:`Import tariff (${Math.round(r.tariff*100)}%)`,mod:"+"+q(u)}),p.push({label:`Transport (${r.deliveryTicks} tick${r.deliveryTicks>1?"s":""})`,mod:"+"+q(y)})}n.push({seller:d?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:d?r?.deliveryTicks||1:0,condition:o,price:Math.round(m),available:a.usedAvailable,delivery:d?r.deliveryTicks+" tick"+(r.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:d?r.deliveryTicks:0,used:!0,priceFactors:p,sourceNationId:e.id})}return n}function nt(){const i=Number(f?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=q(i);const e=Xe(J),t=De[e?.tier||1],a=document.getElementById("em-tier-badge");a&&(a.textContent=t.tag,a.style.color=t.color),a.style.background=t.color+"0a",a.style.border="1px solid "+t.color+"33";const n=document.getElementById("em-nation-select");if(n&&n.options.length===0){const d=k?.name||f?.nation||"—";let r=`<option value="">${g(d)} (HQ)</option>`;for(const o of Ke)o.id!==k?.id&&(r+=`<option value="${o.id}">${g(o.name)}</option>`);n.innerHTML=r}const l=document.getElementById("em-import-tag"),s=Ce&&k&&Ce.id!==k.id;l&&(l.style.display=s?"":"none"),Tn(),Wt()}function Tn(){let i="";for(let e=1;e<=3;e++){const t=De[e],a=At(e),n=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";i+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${n}">`;for(const l of a){const s=J===l.key,d=Ti(l.key).length>0;i+=`<span class="em-selector__btn${s?" active":""}${d?"":" no-listings"}"
                style="${s?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${l.key}')">${g(l.name)}</span>`}i+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${i}</div>`}function Wt(){const i=document.getElementById("em-content");if(xe=Ti(J),xe.length===0){i.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}oe>=xe.length&&(oe=0);let e="";for(let a=0;a<xe.length;a++){const n=xe[a],l=oe===a,s=n.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",d=ci(n.condition);e+=`<div class="em-listing${l?" selected":""}" style="${l?"border-left-color:"+s:""}" onclick="setEmListing(${a})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${g(n.seller)}</span>
                <span class="em-badge em-badge--${n.sellerType.toLowerCase()}">${n.sellerType}</span>
                ${n.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${g((n.nation||"").toUpperCase())}</span>
            ${n.distance>0?`<span class="em-listing__distance">${n.distance} nation${n.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${g(n.delivery)}</span>
        </div>`,e+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${n.condition}%;background:${d}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${d}">${n.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${n.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${q(n.price)}</div>
            </div>
        </div>`,l&&n.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${n.priceFactors.map(r=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${g(r.label)}</span>
                    <span class="em-breakdown__mod" style="color:${r.mod?r.mod.startsWith("-")?"var(--green)":r.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${r.mod||r.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=xe[oe];if(t){const a=Xe(J),n=De[a?.tier||1],l=Math.min(t.available,4),s=t.price*se,d=(Number(f?.corp_cash_reserves)||0)>=s;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${g(a?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${g(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${q(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:l},(r,o)=>o+1).map(r=>`<span class="em-qty-btn${se===r?" active":""}" style="${se===r?"background:"+n.color+";border-color:"+n.color:""}" onclick="setEmQty(${r})">${r}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${q(s)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${g(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${n.color}" onclick="purchaseEquipment()"
                    ${d?"":"disabled"}
                    title="${d?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}i.innerHTML=e}async function Cn(i){if(!i)Ce=null;else{let t=Ke.find(a=>a.id===i);if(!t)try{const{data:a}=await _.from("nations").select("*").eq("id",i).single();t=a}catch{}Ce=t||null}oe=0,se=1;const e=document.getElementById("em-nation-select");e&&(e.value=i||""),nt()}function In(i){J=i,oe=0,se=1,nt()}function Mn(i){oe=i,se=1,Wt()}function Sn(i){se=i,Wt()}let ht=!1;async function An(){if(ht)return;const i=xe[oe];if(!i||!f)return;const e=Xe(J);if(!e)return;const t=se,a=i.price*t,n=Number(f.corp_cash_reserves)||0;if(a>n){alert("Insufficient cash reserves.");return}if(t>i.available){alert("Not enough units available.");return}const l=document.querySelector(".em-purchase-btn");l&&(l.disabled=!0,l.textContent="..."),ht=!0;try{const s=n-a,{error:d}=await _.from("factions").update({corp_cash_reserves:s}).eq("id",f.id);if(d)throw d;const r=!i.deliveryTicks||i.deliveryTicks===0;if(r){const c=ie.find(A=>A.equipment_key===J),m=(c?.owned||0)+t,p=c?.purchase_price_avg||0,u=c?.owned||0,y=u>0?Math.round((p*u+i.price*t)/m):i.price,v=e.maintenancePerUnit*m,w=c?.condition||100,$=Math.round((w*u+i.condition*t)/m),{error:E}=await _.from("corp_equipment").upsert({faction_id:f.id,nation_id:f.nation_id,equipment_key:J,tier:e.tier,owned:m,deployed:c?.deployed||0,condition:$,maintenance_per_tick:v,purchase_price_avg:y,last_purchased_tick:O?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(E){const{error:A}=await _.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);throw A&&console.error("Cash refund failed:",A.message),E}c?(c.owned=m,c.condition=$,c.maintenance_per_tick=v):ie.push({equipment_key:J,tier:e.tier,owned:m,deployed:0,condition:$,maintenance_per_tick:v,assigned_projects:[]})}else{const c=(O?.current_tick||0)+i.deliveryTicks,{error:m}=await _.from("corp_equipment_deliveries").insert({faction_id:f.id,equipment_key:J,quantity:t,condition:i.condition,delivery_tick:c,source_nation_id:i.sourceNationId||null,seller_name:i.seller,price_paid:a});if(m){const{error:p}=await _.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);throw p&&console.error("Cash refund failed:",p.message),m}}f.corp_cash_reserves=s,Ft(),nt();const o=document.getElementById("pr-cash");o&&(o.textContent=q(s)),l&&(l.textContent=r?"PURCHASED":"ORDERED",setTimeout(()=>{l.isConnected&&(l.disabled=!1,l.textContent="PURCHASE")},1500))}catch(s){l&&(l.disabled=!1,l.textContent="PURCHASE"),alert("Purchase failed: "+(s.message||"Unknown error"))}finally{ht=!1}}let zn=-1,Re=[],Pt=[],Ci=[];function wt(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function Ln(i,e,t){if(t)return"var(--orange)";const a=i/(e||1)*100;return a>50?"var(--green)":a>25?"var(--amber)":"var(--red)"}function Bn(){const i=document.getElementById("pm-list"),e=Re.length,t=Pt.length,a=Ci.length,n=Re.filter(r=>r.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${a})`;const l=document.getElementById("pm-badges");let s="";n>0&&(s+=`<span class="pm-badge pm-badge--expiring">${n} EXPIRING</span>`),t>0&&(s+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),l.innerHTML=s;const d=Re.reduce((r,o)=>r+(o.cost||0),0)+Pt.reduce((r,o)=>r+(o.cost||0),0);document.getElementById("pm-total-cost").textContent=wt(d),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){i.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let r="";Re.forEach((o,c)=>{const m=zn===c,p=Ln(o.ticks_left,o.total_ticks,o.expiring_soon),u=Math.min(o.ticks_left/(o.total_ticks||1)*100,100);r+=`<div class="pm-item ${o.expiring_soon?"pm-item--expiring":""} ${m?"expanded":""}" onclick="togglePmExpand(${c})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${g(o.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${g((o.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${p}">Expires: ${g(o.expires||"")}</span>
                        <span class="pm-item__ticks">(${o.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${u}%;background:${p}"></div></div>`,m&&(r+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${g(o.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${g(o.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${wt(o.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${o.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${o.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(o.projects||[]).map(y=>`<span class="pm-project-chip">${g(y)}</span>`).join("")}</div>
                    </div>`,o.note&&(r+=`<div class="pm-note"><span class="pm-note__text">${g(o.note)}</span></div>`),o.expiring_soon&&o.renewable&&(r+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${wt(o.cost||0)}</button></div>`),r+="</div>"),r+="</div></div>"}),i.innerHTML=r;return}}function qn(){Re=[],Pt=[],Ci=[],Bn()}let _e=[],Nn=-1;function ae(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function li(i){return i>=85?"var(--gold)":i>=60?"var(--green)":i>=40?"var(--orange)":"var(--red)"}function Rn(i){return"dl-result--"+i.toLowerCase()}function di(){const i=document.getElementById("dl-list"),e=_e.length;document.getElementById("dl-count").textContent=`${e} COMPLETED`;const t=_e.reduce((d,r)=>{const o=r.financials||{};return d+((o.payment||0)+(o.bonus||0)-(o.penalty||0)-(o.total_cost||0))},0),a=document.getElementById("dl-lifetime-profit");a.textContent=(t>=0?"+":"")+ae(t),a.style.color=t>=0?"var(--green)":"var(--red)";const n={};_e.forEach(d=>{n[d.result]=(n[d.result]||0)+1});const l=document.getElementById("dl-footer-results");if(l.innerHTML=Object.entries(n).map(([d,r])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[d]||"var(--text-dim)"}">${g(d)}</div>
            <div class="dl-footer__result-count">${r}</div>
        </div>`).join(""),e===0){i.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let s="";_e.forEach((d,r)=>{const o=Nn===r,c=d.financials||{},m=(c.payment||0)+(c.bonus||0)-(c.penalty||0)-(c.total_cost||0),p=m>=0,u=Rn(d.result),v={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[d.result]||"var(--text-dim)",w=d.type==="GOVERNMENT";if(s+=`<div class="dl-item ${o?"expanded":""}" onclick="toggleDlExpand(${r})">
            <div class="dl-item__inner" style="border-left:2px solid ${v}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${g(d.name)}</span>
                    <span class="dl-result-badge ${u}">${g(d.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${g(d.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${w?"var(--green)":"var(--gold)"}">${g(d.issuer)}</span>
                    <span class="dl-item__date">${g(d.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${li(d.quality_score)}">${d.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${d.rep_change>0?"var(--green)":d.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${d.rep_change>0?"+":""}${d.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${p?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${p?"var(--green)":"var(--red)"};margin-top:2px;">${p?"+":""}${ae(m)}</div>
                    </div>
                </div>`,o){const $=d.inspection||{};s+='<div style="margin-top:8px;">',s+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(S=>{const T=$[S]||{score:0,issues:[]},M=li(T.score),h=Math.min(T.score/100*100,100);s+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${g(S.charAt(0).toUpperCase()+S.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${h}%;background:${M}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${M}">${T.score}</span>
                        </div>
                    </div>
                    ${(T.issues||[]).map(C=>`<div class="dl-inspect-issue">${g(C)}</div>`).join("")}
                </div>`});const E=$.permits||{passed:!0,issues:[]};s+=`<div class="dl-permits-row ${E.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${E.passed?"var(--green)":"var(--red)"}">${E.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(E.issues||[]).map(S=>`<div class="dl-inspect-issue dl-inspect-issue--red">${g(S)}</div>`).join("")}
            </div>`,s+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',s+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(d.materials_used||[]).forEach(S=>{const T=S.grade==="HIGH"?"var(--green)":S.grade==="STANDARD"?"var(--amber)":"var(--orange)",M=S.impact==="positive"?"▲":S.impact==="negative"?"▼":"–",h=S.impact==="positive"?"var(--green)":S.impact==="negative"?"var(--red)":"var(--text-dim)";s+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${g(S.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${T}"></div>
                    <span class="dl-mat-tag__grade" style="color:${T}">${g(S.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${h}">${M}</span>
                </div>`}),s+="</div>",s+='<div class="dl-section-label">Financial Summary</div>',s+='<div class="dl-fin-panel">',s+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${ae(c.contract_value||0)}</span></div>`,(c.bonus||0)>0&&(s+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${ae(c.bonus)}</span></div>`),(c.penalty||0)>0&&(s+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${ae(c.penalty)}</span></div>`);const A=(c.payment||0)+(c.bonus||0)-(c.penalty||0);s+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${ae(A)}</span></div>`,s+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${ae(c.total_cost||0)}</span></div>`,s+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${p?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${p?"var(--green)":"var(--red)"}">${p?"+":""}${ae(m)}</span>
            </div>`,s+="</div>";const b=d.timeline||{};s+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${b.actual||0}/${b.expected||0} ticks</span>`,b.early?s+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(b.expected||0)-(b.actual||0)} TICK${b.expected-b.actual!==1?"S":""} EARLY</span>`:!b.on_time&&b.actual>b.expected&&(s+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(b.actual||0)-(b.expected||0)} TICK${b.actual-b.expected!==1?"S":""} LATE</span>`),s+="</div>",s+="</div>"}s+="</div></div>"}),i.innerHTML=s}async function Pn(){if(!f){_e=[],di();return}const{data:i,error:e}=await _.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",f.id).order("delivered_at_tick",{ascending:!1}).limit(20);e?(console.warn("Failed to load deliveries:",e.message),_e=[]):_e=(i||[]).map(t=>{const a=t.construction_contracts||{};return{id:t.contract_id,name:a.name||"Project",type:a.issuer_type||"GOVERNMENT",issuer:a.issuer_name||"Government",delivered:"Tick "+(t.delivered_at_tick||0),result:t.result,quality_score:t.quality_score,rep_change:t.rep_change,financials:{contract_value:t.contract_value||0,bonus:t.quality_bonus||0,penalty:t.penalties||0,payment:t.payment_received||0,total_cost:t.total_cost||0},inspection:t.inspection||{},materials_used:t.materials_used||[],timeline:{expected:t.timeline_expected||0,actual:t.timeline_actual||0,on_time:t.on_time,early:t.timeline_actual<t.timeline_expected}}}),di()}function Ft(){const i=ie.reduce((d,r)=>d+(r.owned||0),0),e=ie.reduce((d,r)=>d+(r.deployed||0),0),t=Wi(ie),a=i-e;document.getElementById("eq-count").textContent=i+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${e} <span style="font-size:9px;color:var(--text-dim)">/ ${i}</span>
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">AVAILABLE</div>
            <div class="eq-summary__value" style="font-size:14px;color:${a===0?"var(--orange)":"var(--green)"}">
                ${a}
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">MAINT/TICK</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--red)">
                ${q(t)}
            </div>
        </div>`;const n={};for(const d of ie)n[d.equipment_key]=d;let l="";for(let d=1;d<=3;d++){const r=De[d],o=At(d),c=Bt===d,m=o.reduce((u,y)=>u+(n[y.key]?.owned||0),0),p=o.reduce((u,y)=>u+(n[y.key]?.deployed||0),0);if(l+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${d})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${c?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${r.color}">${g(r.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${r.color};border:1px solid ${r.color}33;background:${r.color}0a">${r.tag}</span>
            </div>
            ${m>0?`<span class="eq-tier-hdr__count">${p}/${m}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,c)for(const u of o){const y=n[u.key],v=y?.owned||0,w=y?.deployed||0,$=y?.condition||0,E=u.maintenancePerUnit*v,A=v-w,b=v>0&&A===0,S=v>0&&$<65,T=ci($),M=y?.assigned_projects||[],h=M.length>0?M.map(C=>C.contract_name||"Project").join(", ").slice(0,30):v>0&&w>0?w+" project"+(w>1?"s":""):"—";l+=`<div class="eq-row${v===0?" unowned":""}">`,l+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${v===0?" dim":""}">${g(u.name)}</span>
                        ${S?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${v>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${b?"var(--orange)":"var(--green)"}">${A}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${w}/${v}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,v>0?l+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${$}%;background:${T}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${T}">${$}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${g(h)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${q(E)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:l+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',l+="</div>"}}document.getElementById("eq-list").innerHTML=l;const s=[1,2,3].map(d=>{const r=De[d],o=At(d).reduce((c,m)=>c+(n[m.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${o>0?r.color+"33":"var(--border-0)"};background:${o>0?r.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${r.color}">${r.tag}</div>
            <div class="eq-footer__tier-count" style="color:${o>0?"var(--text-bright)":"var(--text-dim)"}">${o}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${q(t)}</div>
        </div>
        <div class="eq-footer__tiers">${s}</div>`}function On(i){Bt=Bt===i?-1:i,Ft()}async function Dn(){if(!f)return;const{data:i,error:e}=await _.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",f.id);e?(console.warn("Failed to load equipment:",e.message),ie=[]):ie=i||[],Ft()}async function Hn(){const{data:{user:i}}=await _.auth.getUser();if(!i){window.location.href="login.html";return}const{data:e}=await _.from("factions").select("*").or(`id.eq.${i.id},linked_user_id.eq.${i.id}`);Ne=(e||[]).filter(o=>o.nation_id);const t=sessionStorage.getItem("active_faction_id");if(f=Ne.find(o=>o.id===t)||Ne.find(o=>o.faction_type==="corporation")||Ne[0],!f){await _.auth.signOut(),window.location.href="login.html";return}if(f.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[a,n]=await Promise.all([f.nation_id?_.from("nations").select("*").eq("id",f.nation_id).single():Promise.resolve({data:null}),_.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(k=a.data),n.error&&console.warn("Shard load failed:",n.error.message),O=n.data;const l=f.corp_ticker||f.abbreviation||"";if(document.getElementById("corp-logo").textContent=l.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=f.faction_name||"Unnamed Corp",O){if(document.getElementById("game-date").textContent=O.current_date||"—",document.getElementById("tick-number").textContent=O.current_tick||"—",O.next_tick_at){const c=(Number(O.tick_interval_hours)||8)*36e5,m=new Date(O.next_tick_at).getTime(),u=m-c+c/2;qt=new Date(u>Date.now()?u:m+c/2),Qi()}const o=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");o&&(o.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(l?"["+l+"]":f.faction_name||"Corp")+" ▾";const s=document.getElementById("topbar-cash");if(s){const o=Number(f.corp_cash_reserves??0),c=o>=1e9?"$"+(o/1e9).toFixed(1)+"B":o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k";s.textContent="CASH: "+c}const d=f.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+d+" AP</span>",document.getElementById("nation-pill").textContent=(k?.name||f.nation||"—").toUpperCase();const r=document.getElementById("corp-faction-dropdown");if(r){let o="";for(const c of Ne){const m=c.id===f.id,p=c.faction_type==="corporation"?"CORP":"PARTY",u=c.faction_type==="corporation"?"var(--teal)":"var(--amber)";o+=`<div class="corp-dd-item${m?" active":""}" onclick="switchToFaction('${c.id}', '${c.faction_type}')">
                <span class="corp-dd-type" style="color:${u}">${p}</span>
                <span class="corp-dd-name">${g(c.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${g(c.abbreviation||"—")}]</span>
            </div>`}r.innerHTML=o}await Promise.all([me(),_i(),$n(),Dn(),qn(),Pn()]);try{const{data:o}=await _.from("nations").select("*").order("name");Ke=o||[]}catch{Ke=[]}if(ki(),nt(),Gi(f,k,O),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const o=document.querySelector('[data-tab="expansion"]');o&&Mi({preventDefault:()=>{},target:o})}}async function jn(){await _.auth.signOut(),window.location.href="login.html"}function Un(){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.toggle("open")}function Gn(i,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",i),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",i=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(i.target)&&t.classList.remove("open")});document.addEventListener("keydown",i=>{i.key==="Escape"&&et()});window.doLogout=jn;window.toggleTheme=Ki;window.toggleCorpDropdown=Un;window.switchToFaction=Gn;window.setFilter=Ji;window.openContractDetail=vi;window.closeContractDetail=et;window.placeBid=gn;window.toggleWhRow=bn;window.toggleEqTier=On;window.switchEmNation=Cn;window.setEmType=In;window.setEmListing=Mn;window.setEmQty=Sn;window.purchaseEquipment=An;window.setPrMat=hn;window.setPrTier=wn;window.setPrQty=kn;window.purchaseMaterial=En;let Y={general:0,skilled:0,innovative:0},kt=!1;const He=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Ii(i){const e=Number(k?.minimum_wage??50),t=Number(k?.inflation??50),a=Number(k?.standard_of_living??50),n=e/100*48e3,l=1+(t-50)/100*.5,s=1+(a-50)/100*.5;return Math.round(n*i*l*s)}function x(i){const e=Math.abs(i),t=i<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function Mi(i){i.preventDefault(),document.getElementById("operations-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),i.target.classList.add("active"),at(),Yn(),await Ge(),await Vt(),ot(),await aa(),st(),Bi(),await ra(),rt()}function Si(i){i&&i.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(e=>e.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function Ai(){return Q.reduce((e,t)=>{const a=Number(t.capacity||0),n=Number(t.condition||0)/100;return e+Math.floor(a*n)},0)+500}function Wn(i,e){const t=He.find(l=>l.id===i),a=Number(f?.[t.factionKey]??0),n=Y[i]+e;if(!(a+n<0)){if(e>0){const l=He.reduce((d,r)=>{const o=Number(f?.[r.factionKey]??0),c=r.id===i?n:Y[r.id];return d+o+c},0),s=Ai();if(l>s)return}Y[i]=n,at()}}function Fn(i){i?Y[i]=0:Y={general:0,skilled:0,innovative:0},at()}async function Vn(){if(kt||!Object.values(Y).some(n=>n!==0))return;let e=0;for(const n of He){const l=Y[n.id];l>0&&(e+=l*Ii(n.multiplier)*.1)}const t=Number(f?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+x(e)+", available: "+x(t));return}const a=e>0?`Confirm workforce changes?

Hiring fee: `+x(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){kt=!0;try{const n={};for(const d of He){const r=Number(f?.[d.factionKey]??0);n[d.factionKey]=Math.max(0,r+Y[d.id])}e>0&&(n.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:l}=await _.from("factions").update(n).eq("id",f.id);if(l)throw l;Object.assign(f,n),Y={general:0,skilled:0,innovative:0};const s=document.getElementById("topbar-cash");if(s){const d=Number(f.corp_cash_reserves??0);s.textContent="CASH: "+(d>=1e6?"$"+(d/1e6).toFixed(1)+"M":"$"+Math.round(d/1e3)+"k")}at()}catch(n){alert("Error: "+n.message)}finally{kt=!1}}}function at(){const i=document.getElementById("hf-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=Number(k?.minimum_wage??50),n=Number(k?.inflation??50),l=Number(k?.standard_of_living??50),s=a/100*48e3,d=(1+(n-50)/100*.5).toFixed(2),r=(1+(l-50)/100*.5).toFixed(2),o=k?.name||f?.nation||"Nation",c=Object.values(Y).some(E=>E!==0),m=Ai();let p=0,u=0,y=0,v=0,w="";for(const E of He){const A=Number(f?.[E.factionKey]??0),b=Y[E.id],S=A+b,T=Ii(E.multiplier),M=b>0,h=A*T,C=S*T,R=C-h;p+=A,u+=S,y+=h,v+=C;const L=b!==0?M?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";w+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${L};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${E.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${E.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${A.toLocaleString()}</span>
                    ${b!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${M?t.greenBright:t.red}">${S.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${E.multiplier}.0 × ${d} × ${r})</span>
                <span style="font-family:${e};font-size:10px;color:${E.color}">${x(T)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${E.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${E.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${b!==0?t.card:"transparent"};border:1px solid ${b!==0?t.border:"transparent"}">
                    ${b!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${M?t.greenBright:t.red}">${M?"+":""}${b}</span>
                        <span onclick="hfReset('${E.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${E.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${E.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${b!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${R>0?t.red:t.greenBright}">${R>0?"+":""}${x(R)}/yr</span>
            </div>`:""}
        </div>`}const $=v-y;i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${o.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">MIN WAGE</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${a}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">${x(s)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${n}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${d}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${l}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${r}</div>
                    </div>
                </div>
            </div>
            ${w}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${c?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${e};font-size:13px;font-weight:700;color:${p>=m?t.red:t.text}">${c?u.toLocaleString():p.toLocaleString()}</span>
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">/ ${m.toLocaleString()}</span>
                    </div>
                    ${p>=m&&!c?`<div style="font-family:${e};font-size:7px;color:${t.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${x(y)}</span>
                        ${c?`<span style="font-family:${e};font-size:9px;color:${t.dim}">→</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?t.red:t.greenBright}">${x(v)}</span>`:""}
                    </div>
                </div>
            </div>
            ${c?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${t.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">NET CHANGE</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?t.red:t.greenBright}">${$>0?"+":""}${x($)}/yr</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">(${$>0?"+":""}${x(Math.round($/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${t.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function Yn(){const i=document.getElementById("wf-summary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},a=(k?.name||f?.nation||"Nation").toUpperCase(),n=Number(k?.minimum_wage??50),l=Number(k?.inflation??50),s=Number(k?.standard_of_living??50),d=n/100*48e3,r=1+(l-50)/100*.5,o=1+(s-50)/100*.5,c=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let m=0,p=0,u="";for(const y of c){const v=Number(f?.[y.key]??0),w=Math.round(d*y.mult*r*o),$=v*w;m+=v,p+=$,u+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${y.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${y.countColor}">${v.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${y.mult}.0 × ${r.toFixed(2)} × ${o.toFixed(2)})</span>
                <span style="font-family:${e};font-size:10px;color:${t.muted}">${x(w)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${x($)}</span>
            </div>
        </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Workforce</span>
            </div>
            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.text}">${m.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${u}
            <div style="padding:8px 12px;background:${t.card};border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">MINIMUM WAGE (${a})</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${n}/100 → ${x(d)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${r.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${o.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL WORKFORCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.text}">${m.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL ANNUAL WAGES</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${x(p)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${x(Math.round(p/12))}</span>
            </div>
        </div>
    </div>`}let Q=[];async function Ge(){if(!f?.id)return;const{data:i}=await _.from("corp_properties").select("*").eq("faction_id",f.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});Q=i||[]}function We(){const i=document.getElementById("property-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=(k?.name||f?.nation||"Nation").toUpperCase(),n=1+(Number(k?.inflation??50)-50)/100*.3;let l="",s=0,d=0;const r=k?.name||f?.nation||"Home Nation",o=5e7,c=1+(Number(k?.inflation??50)-50)/100*.3,m=.8+Number(k?.stability??50)/100*.4,p=Math.round(o*c*m),u=Math.round(p*.005);s+=p,d+=u,l+=`
    <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;font-weight:600;color:${t.text}">National Headquarters</span>
            <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:#5c5;background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">HQ</span>
        </div>
        <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${r} · Headquarters</div>
        <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">500</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">VALUE</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${x(p)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${x(u)}</div>
            </div>
        </div>
    </div>`;for(const y of Q){const v=Je[y.style]||Je.Basic;s+=Number(y.purchase_price||0),d+=Number(y.monthly_maintenance||0),l+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${y.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${y.city||a} · ${(y.type||"").replace(/_/g," ")} · <span style="color:${v.color}">${(y.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${(y.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">PAID</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${x(y.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${x(y.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                <span style="font-family:${e};font-size:9px;color:${y.condition>=75?"#5c5":y.condition>=50?"#ca5":t.orange}">${y.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${t.border};margin-top:2px;"><div style="width:${y.condition}%;height:100%;background:${y.condition>=75?"#5c5":y.condition>=50?"#ca5":t.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${y.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${x(Math.round((y.purchase_price||0)*.1*n))})</div>
                <div onclick="propSell('${y.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.red};border:1px solid ${t.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${e};font-size:10px;color:${t.muted}">${Q.length+1} ASSET${Q.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${l}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.green}">${x(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${x(d)}/mo</span>
            </div>
        </div>
    </div>`}let ze=[],V=null;const Je={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Vt(){if(!f?.nation_id)return;const{data:i,error:e}=await _.from("available_properties").select("*").eq("nation_id",f.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}ze=(i||[]).map(t=>({...t,adjusted_cost:t.price,adjusted_maintenance:t.monthly_maintenance}))}function ot(){const i=document.getElementById("new-property-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(k?.name||f?.nation||"Nation").toUpperCase();const a=Number(k?.standard_of_living??50),n=Number(k?.gdp_growth??50),l=Number(k?.inflation??50),s=k?.capital||"Capital",d={capital:s,port:s+" Port",industrial:s+" Industrial Zone",suburban:s+" Suburbs",coastal:s+" Coast"};let r="";if(ze.length===0)r=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let o=0;o<ze.length;o++){const c=ze[o],m=V===o,p=Je[c.style]||Je.Basic,u=d[c.city_template]||s;r+=`
            <div onclick="npSelect(${o})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${m?t.accent:"transparent"};background:${m?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${t.text}">${c.name}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${p.color};background:${p.color}12;border:1px solid ${p.color}25">${p.label}</span>
                </div>
                <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:5px;">${u} · ${c.type.replace(/_/g," ")}</div>
                <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">CAPACITY</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.text};margin-top:1px">${c.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">PRICE</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.gold};margin-top:1px">${x(c.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.redDim};margin-top:1px">${x(c.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${m?`<div style="margin-top:5px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                        <span style="font-family:${e};font-size:9px;color:${c.condition>=75?t.greenBright:c.condition>=50?t.yellow:t.orange}">${c.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${t.border}"><div style="width:${c.condition}%;height:100%;background:${c.condition>=75?t.greenBright:c.condition>=50?t.yellow:t.orange}"></div></div>
                </div>`:""}
            </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">New Property</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${ze.length} AVAILABLE</span>
        </div>
        <div style="padding:4px 14px;border-bottom:1px solid ${t.border};display:flex;gap:12px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">STD OF LIVING</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${a>=50?t.greenBright:t.yellow}">${Math.round(a)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">GDP GROWTH</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${n>=50?t.greenBright:t.yellow}">${Math.round(n)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">INFLATION</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${l<=50?t.greenBright:t.red}">${Math.round(l)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${r}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.gold};border:1px solid ${t.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${V!==null?"#000":t.dim};background:${V!==null?t.accent:"transparent"};border:1px solid ${V!==null?t.accent:t.border};cursor:${V!==null?"pointer":"default"};opacity:${V!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function Qn(i){V=V===i?null:i,ot()}let Et=!1;async function Kn(){if(V===null||Et)return;const i=ze[V];if(!i)return;const e=Number(f?.corp_cash_reserves??0);if(i.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+x(i.adjusted_cost)+`
Cash: `+x(e));return}if(confirm('Buy "'+i.name+'" for '+x(i.adjusted_cost)+`?

Monthly maintenance: `+x(i.adjusted_maintenance)+`/mo
Condition: `+i.condition+`%

This will be deducted from your cash reserves.`)){Et=!0;try{const{error:t}=await _.from("corp_properties").insert({faction_id:f.id,nation_id:f.nation_id,catalog_id:i.catalog_id||null,name:i.name,type:i.type,style:i.style,capacity:i.capacity,purchase_price:i.adjusted_cost,monthly_maintenance:i.adjusted_maintenance,condition:i.condition,city:i.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const a=Math.max(0,e-i.adjusted_cost),{error:n}=await _.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);if(n)throw n;f.corp_cash_reserves=a,i.id&&await _.from("available_properties").update({status:"sold",purchased_by:f.id}).eq("id",i.id);const l=document.getElementById("topbar-cash");l&&(l.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),V=null,await Vt(),ot(),We(),alert("Property purchased: "+i.name+`

Deducted: `+x(i.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{Et=!1}}}const he={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let Yt=!1,I={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Tt=!1;function zi(){const e=1+(Number(k?.inflation??50)-50)/100*.3,t=he[I.style]?.costMod||1,a=I.type==="Warehouse"?.75:1,n=Math.round(I.size*1e5*e*t*a),l=Math.round(n*(1+I.budgetMod/100)),s=Math.round(l*.007*(he[I.style]?.maintMod||1));return{baseBudget:n,adjusted:l,maint:s,inflMod:e,styleMod:t}}function Jn(){Yt=!0,I={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Li()}function Qt(){Yt=!1,document.getElementById("cp-modal-overlay")?.remove()}function Xn(i,e){I[i]=e,Li()}async function Zn(){if(!(Tt||!I.name.trim())){Tt=!0;try{const i=zi(),e=k?.name||f?.nation||"Unknown",t=he[I.style]?.repGain||1,a=await _.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),n=a.data?.current_tick||0,l=(a.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:s}=await _.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",f.nation_id).eq("issuer_type","PRIVATE"),r=`PVT-C${(s||0)+1}-${l}`,{error:o}=await _.from("construction_contracts").insert({nation_id:f.nation_id,template_key:"custom_building",sector:"civil_engineering",name:I.name.trim(),description:`${I.type} (${I.style}) — ${I.size.toLocaleString()} employees, commissioned by ${f.faction_name}`,project_code:r,budget_ceiling:i.adjusted,timeline_ticks:I.timeline,required_materials:(()=>{const c=I.size/1e3,m=I.style,p={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[m]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(y,v)=>Math.max(1,Math.ceil(c*y*v));return{concrete:u(8,p.concrete),steel:u(6,p.steel),glass_facades:u(3,p.glass),em_systems:u(4,p.em),lumber:u(1,p.lumber),heavy_parts:u(2,p.heavy),aggregate:u(3,p.agg)}})(),required_equipment:(()=>{const c=["work_trucks","concrete_mixers"];return I.size>1e3&&c.push("excavators","tower_cranes"),I.size>3e3&&c.push("bulldozers","heavy_haulers"),I.size>8e3&&c.push("pile_drivers"),c})(),required_workforce:{general:Math.ceil(I.size*.08),skilled:Math.ceil(I.size*.03)},status:"open",generated_at_tick:n,bidding_ends_tick:n+3,issuer_type:"PRIVATE",issuer_name:f.faction_name,issuer_faction_id:f.id});if(o)throw o;Qt(),alert(`Construction project submitted!

Project: `+I.name.trim()+`
Code: `+r+`
Budget: `+x(i.adjusted)+`
Expected Reputation: +`+t+`

All construction corporations in `+e+" can now bid on this project.")}catch(i){alert("Failed to submit project: "+i.message)}finally{Tt=!1}}}function Li(){if(document.getElementById("cp-modal-overlay")?.remove(),!Yt)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=zi(),a=k?.name||f?.nation||"Nation",n=he[I.style]?.repGain||1,l=n>=4?e.gold:n>=3?e.greenBright:n>=2?e.accent:e.dim,s=Object.entries(he).map(([o,c])=>{const m=I.style===o;return`<div onclick="cpSetField('style','${o}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${m?c.color+"18":"transparent"};border:1px solid ${m?c.color+"44":e.border};">
            <div style="font-family:${i};font-size:9px;font-weight:700;color:${m?c.color:e.dim}">${o}</div>
            <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:1px">×${c.costMod.toFixed(1)} cost</div>
        </div>`}).join(""),d=document.createElement("div");d.id="cp-modal-overlay",d.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",d.innerHTML=`
    <div style="width:440px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;max-height:90vh;">
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.gold}">●</span>
                <span style="font-family:${i};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Construction Project</span>
            </div>
            <span onclick="cpClose()" style="font-family:${i};font-size:14px;color:${e.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:12px 16px;overflow:auto;flex:1;">

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Building Name</div>
                <input id="cp-name-input" value="${I.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:6px 10px;font-family:${i};font-size:11px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Type</div>
                <div style="display:flex;gap:4px;">
                    ${["Regional HQ","Office Building",...f?.corp_sector==="Construction"?["Warehouse"]:[]].map(o=>`<span onclick="cpSetField('type','${o}')" style="flex:1;text-align:center;padding:5px 0;font-family:${i};font-size:9px;font-weight:700;cursor:pointer;color:${I.type===o?"#000":e.dim};background:${I.type===o?o==="Warehouse"?e.orange:e.accent:"transparent"};border:1px solid ${I.type===o?o==="Warehouse"?e.orange:e.accent:e.border}">${o}</span>`).join("")}
                    ${f?.corp_sector==="Construction"?`<div style="font-family:${i};font-size:7px;color:${e.orange};margin-top:3px;">Construction: Warehouse available (75% cost, stores up to $20M materials)</div>`:""}
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${i};font-size:14px;font-weight:700;color:${e.text}">${I.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${I.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${e.accent};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">${s}</div>
                <div style="margin-top:4px;font-family:${i};font-size:8px;color:${he[I.style].color}">${he[I.style].desc}</div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Timeline</span>
                    <span style="font-family:${i};font-size:12px;font-weight:700;color:${e.text}">${I.timeline} months</span>
                </div>
                <input type="range" min="24" max="60" step="6" value="${I.timeline}" oninput="cpSetField('timeline',+this.value)"
                    style="width:100%;accent-color:${e.gold};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">
                    <span>24 months</span><span>60 months</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Budget</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${e.border}">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">BASE (${I.size.toLocaleString()} × $100k × ${t.inflMod.toFixed(2)} × ${t.styleMod.toFixed(1)})</span>
                        <span style="font-family:${i};font-size:9px;color:${e.muted}">${x(t.baseBudget)}</span>
                    </div>
                    <div style="padding:6px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">ADJUSTMENT</span>
                            <span style="font-family:${i};font-size:10px;font-weight:700;color:${I.budgetMod>0?e.greenBright:I.budgetMod<0?e.red:e.dim}">${I.budgetMod>0?"+":""}${I.budgetMod}%</span>
                        </div>
                        <input type="range" min="-15" max="15" step="1" value="${I.budgetMod}" oninput="cpSetField('budgetMod',+this.value)"
                            style="width:100%;accent-color:${e.accent};height:4px;" />
                        <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">
                            <span>-15% (budget cut)</span><span>+15% (quality invest)</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid ${e.border}">
                        <span style="font-family:${i};font-size:9px;font-weight:700;color:${e.text}">TOTAL BUDGET</span>
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${e.gold}">${x(t.adjusted)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${i};font-size:9px;color:${e.redDim}">${x(t.maint)}/mo</span>
                    </div>
                </div>
            </div>

            <div style="padding:6px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);margin-bottom:8px;">
                <div style="font-family:${i};font-size:8px;color:${e.gold};margin-bottom:2px">WHAT HAPPENS NEXT</div>
                <div style="font-size:9px;color:${e.dim};line-height:1.5">
                    This project will appear as a Civil Engineering bid in the Open Contracts pool for all construction corporations with an HQ or Regional HQ in ${a}. The lowest qualified bidder wins the contract and begins construction.
                </div>
            </div>

            <div style="padding:6px 8px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:${i};font-size:9px;color:${e.accent}">EXPECTED REPUTATION GAIN</span>
                    <span style="font-family:${i};font-size:16px;font-weight:700;color:${l}">+${n}</span>
                </div>
                <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">${I.style} style · ${n===5?"Maximum prestige":n>=4?"Impressive presence":n>=3?"Strong statement":n>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${i};font-size:7px;color:${e.dim}">TOTAL PROJECT</div>
                <div style="font-family:${i};font-size:14px;font-weight:700;color:${e.gold}">${x(t.adjusted)}</div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="cpClose()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${I.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(d);const r=document.getElementById("cp-name-input");r&&r.addEventListener("input",o=>{I.name=o.target.value}),d.addEventListener("click",o=>{o.target===d&&Qt()})}function ea(){const i=document.getElementById("cp-name-input");if(i&&(I.name=i.value),!I.name.trim()){alert("Please enter a building name.");return}Zn()}window.cpClose=Qt;window.cpSetField=Xn;window.cpSubmitFromModal=ea;window.npSelect=Qn;window.npBuyProperty=Kn;window.npOpenConstructionModal=Jn;let Be=!1;async function ta(i){if(Be)return;const e=Q.find(d=>d.id===i);if(!e)return;const t=1+(Number(k?.inflation??50)-50)/100*.3,a=Math.round((e.purchase_price||0)*.1*t),n=Number(f?.corp_cash_reserves??0);if(a>n){alert("Insufficient cash. Refurbishment costs "+x(a)+" (inflation-adjusted), you have "+x(n));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const l=5+Math.floor(Math.random()*21),s=Math.min(100,e.condition+l);if(confirm('Refurbish "'+e.name+`"?

Cost: `+x(a)+`
Expected improvement: +`+l+"% condition ("+e.condition+"% → "+s+"%)")){Be=!0;try{await _.from("corp_properties").update({condition:s}).eq("id",i);const d=Math.max(0,n-a);await _.from("factions").update({corp_cash_reserves:d}).eq("id",f.id),f.corp_cash_reserves=d;const r=document.getElementById("topbar-cash");r&&(r.textContent="CASH: "+(d>=1e6?"$"+(d/1e6).toFixed(1)+"M":"$"+Math.round(d/1e3)+"k")),await Ge(),We(),alert("Refurbished! Condition: "+e.condition+"% → "+s+"%")}catch(d){alert("Refurbishment failed: "+d.message)}finally{Be=!1}}}async function ia(i){if(Be)return;const e=Q.find(l=>l.id===i);if(!e)return;const t=1+(Number(k?.inflation??50)-50)/100*.3,a=(e.condition||50)/100,n=Math.round((e.purchase_price||0)*.6*a*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+x(n)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){Be=!0;try{await _.from("corp_properties").update({is_active:!1}).eq("id",i);const s=Number(f?.corp_cash_reserves??0)+n;await _.from("factions").update({corp_cash_reserves:s}).eq("id",f.id),f.corp_cash_reserves=s;const r=(await _.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await _.from("available_properties").insert({nation_id:f.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(n*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:r,expires_at_tick:r+6,status:"available"});const o=document.getElementById("topbar-cash");o&&(o.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),await Ge(),We(),await Vt(),ot(),alert('Sold "'+e.name+'" for '+x(n))}catch(l){alert("Sale failed: "+l.message)}finally{Be=!1}}}window.propRefurbish=ta;window.propSell=ia;let Pe=0;function Bi(){const i=document.getElementById("manage-subsidiaries-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a9abf",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=Q.filter(r=>r.type==="regional_hq");Pe>=a.length&&(Pe=0);const n=a[Pe]||null;let l="";a.length===0&&(l=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let s=0;for(let r=0;r<a.length;r++){const o=a[r],c=r===Pe,m=Number(o.purchase_price||0);s+=m;const p=je.find(u=>u.id===o.nation_id)?.name||o.city||"—";l+=`
        <div onclick="_mSubSelected=${r};renderManageSubsidiariesCard();" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${c?t.accent:"transparent"};background:${c?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${t.gold}">${(o.name||"").split("—")[0]?.trim().split(" ").map(u=>u[0]).join("").slice(0,4)||"SUB"}</span>
            <div style="flex:1.2;">
                <div style="font-size:10px;font-weight:600;color:${t.text};line-height:1.2">${o.name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${o.style||"Modern"}</div>
            </div>
            <span style="width:60px"><span style="font-family:${e};font-size:7px;padding:1px 4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${p.toUpperCase().slice(0,8)}</span></span>
            <span style="width:50px;font-family:${e};font-size:9px;font-weight:700;color:${t.gold};text-align:right">${x(m)}</span>
            <span style="width:35px;font-family:${e};font-size:9px;font-weight:700;color:${o.condition>=75?t.greenBright:o.condition>=50?t.yellow:t.orange};text-align:right">${o.condition}%</span>
        </div>`}let d="";if(n){const r=je.find(m=>m.id===n.nation_id)?.name||n.city||"—",o=n.condition>=75?t.greenBright:n.condition>=50?t.yellow:t.orange,c=[{label:"Valuation",value:x(n.purchase_price||0),color:t.gold},{label:"Maintenance/Mo",value:x(n.monthly_maintenance||0),color:t.red},{label:"Capacity",value:(n.capacity||0).toLocaleString(),color:t.text},{label:"Condition",value:n.condition+"%",color:o},{label:"Nation",value:r,color:t.accent},{label:"Style",value:n.style||"Modern",color:t.muted}];d=`
            <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="font-size:12px;font-weight:700;color:${t.text};margin-bottom:2px">${n.name}</div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${e};font-size:7px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${r.toUpperCase()}</span>
                    <span style="font-family:${e};font-size:7px;padding:1px 5px;color:${t.blue};background:rgba(90,154,191,0.08);border:1px solid rgba(90,154,191,0.15)">SUBSIDIARY</span>
                </div>
            </div>
            ${c.map(m=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${t.border};">
                <span style="font-family:${e};font-size:9px;color:${t.dim};text-transform:uppercase">${m.label}</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;color:${m.color}">${m.value}</span>
            </div>`).join("")}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                    <span style="font-family:${e};font-size:8px;color:${o}">${n.condition}%</span>
                </div>
                <div style="width:100%;height:4px;background:${t.border}"><div style="width:${n.condition}%;height:100%;background:${o}"></div></div>
            </div>
            <div style="flex:1"></div>
            <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
                <div style="display:flex;gap:4px;margin-bottom:4px;">
                    <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.greenDark};background:rgba(74,170,136,0.06)">INJECT CAPITAL</div>
                    <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.gold};border:1px solid ${t.gold}44">WITHDRAW</div>
                </div>
                <div style="display:flex;gap:4px;">
                    <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.accent};border:1px solid ${t.accent}44">MERGE</div>
                    <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.orange};border:1px solid ${t.orange}44">SELL</div>
                    <div onclick="subDissolve('${n.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.red}44">DISSOLVE</div>
                </div>
            </div>`}else d=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a subsidiary to manage.</div>`;i.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Manage Subsidiaries</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${a.length} ACTIVE</span>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${t.border};display:flex;flex-direction:column;">
                <div style="display:flex;padding:5px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                    <span style="width:40px;font-family:${e};font-size:7px;color:${t.dim}">ABBR</span>
                    <span style="flex:1.2;font-family:${e};font-size:7px;color:${t.dim}">NAME</span>
                    <span style="width:60px;font-family:${e};font-size:7px;color:${t.dim}">NATION</span>
                    <span style="width:50px;font-family:${e};font-size:7px;color:${t.dim};text-align:right">VALUE</span>
                    <span style="width:35px;font-family:${e};font-size:7px;color:${t.dim};text-align:right">COND</span>
                </div>
                <div style="flex:1;overflow:auto;">${l}</div>
                <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;display:flex;">
                    <span style="width:40px"></span>
                    <span style="flex:1.2;font-family:${e};font-size:8px;color:${t.dim}">COMBINED</span>
                    <span style="width:60px"></span>
                    <span style="width:50px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${x(s)}</span>
                    <span style="width:35px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${d}
            </div>
        </div>
    </div>`}async function na(i){const e=Q.find(a=>a.id===i);if(!e)return;const t=Math.round((e.purchase_price||0)*.6*(e.condition||50)/100);if(confirm('Dissolve subsidiary "'+e.name+`"?

Assets liquidated at 60% × condition: `+x(t)+`
All operations in this nation cease.

This cannot be undone.`))try{await _.from("corp_properties").update({is_active:!1}).eq("id",i);const a=Number(f?.corp_cash_reserves??0)+t;await _.from("factions").update({corp_cash_reserves:a}).eq("id",f.id),f.corp_cash_reserves=a;const n=document.getElementById("topbar-cash");n&&(n.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),Pe=0,await Ge(),We(),Bi(),st(),alert("Subsidiary dissolved. Received: "+x(t))}catch(a){alert("Failed: "+a.message)}}window.subDissolve=na;let je=[],re=null,Ct=!1;async function aa(){const{data:i}=await _.from("nations").select("*").order("name");je=(i||[]).filter(e=>e.id!==f?.nation_id)}function Ot(i){const t=u=>Number(i[u]??50),a=t("standard_of_living"),n=t("cost_of_living"),l=t("corporate_tax"),s=t("minimum_wage"),d=t("urbanization"),r=t("union_strength"),o=t("corruption"),c=t("unemployment"),m=t("stability"),p=5e7*(1+(a-50)/100*.4)*(1+(n-50)/100*.3)*(1+(l-50)/100*.2)*(1+(s-50)/100*.15)*(1+(d-50)/100*.1)*(1+(r-50)/100*.1)*(1-(o-50)/100*.15)*(1-(c-50)/100*.1)*(1+(50-m)/100*.3);return Math.round(Math.max(1e7,p))}function oa(i){re=re===i?null:i,st()}async function sa(){if(Ct||!re)return;const i=je.find(n=>n.id===re);if(!i)return;if(Q.find(n=>n.nation_id===i.id&&n.type==="regional_hq")){alert("You already have a subsidiary in "+i.name);return}const t=Ot(i),a=Number(f?.corp_cash_reserves??0);if(t>a){alert("Insufficient cash. Entry cost: "+x(t)+", available: "+x(a));return}if(confirm("Establish subsidiary in "+i.name+`?

Entry cost: `+x(t)+`
Creates a Regional HQ (500 capacity)
Unlocks `+i.name+` for operations

Deducted from cash reserves.`)){Ct=!0;try{const l=(await _.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,s=85+Math.floor(Math.random()*16),d=Math.round(t*.005),{error:r}=await _.from("corp_properties").insert({faction_id:f.id,nation_id:i.id,name:"Regional Headquarters — "+i.name,type:"regional_hq",style:"Modern",capacity:500,purchase_price:t,monthly_maintenance:d,condition:s,city:i.capital||i.name,purchased_at_tick:l,is_active:!0});if(r)throw r;const o=Math.max(0,a-t);await _.from("factions").update({corp_cash_reserves:o}).eq("id",f.id),f.corp_cash_reserves=o;const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k")),re=null,await Ge(),We(),renderSubsidiariesCard(),st(),alert("Subsidiary established in "+i.name+`!

Cost: `+x(t)+`
Regional HQ created with `+s+"% condition.")}catch(n){alert("Failed: "+n.message)}finally{Ct=!1}}}function st(){const i=document.getElementById("create-subsidiary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",blue:"#5a9abf",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=new Set(Q.filter(r=>r.type==="regional_hq").map(r=>r.nation_id)),n=je.filter(r=>!a.has(r.id)),l=re?n.find(r=>r.id===re):null;let s="";for(const r of n){const o=r.id===re,c=Ot(r),m=Number(r.standard_of_living??50),p=Number(r.stability??50),u=c>6e7?t.red:c>4e7?t.orange:t.greenBright;s+=`
        <div onclick="subSelectNation('${r.id}')" style="padding:6px 12px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${o?t.blue:"transparent"};background:${o?"rgba(90,154,191,0.03)":"transparent"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${r.name}</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${u}">${x(c)}</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:2px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">SoL <span style="color:${m>=50?t.greenBright:t.orange}">${Math.round(m)}</span></span>
                <span style="font-family:${e};font-size:7px;color:${t.dim}">STAB <span style="color:${p>=50?t.greenBright:t.red}">${Math.round(p)}</span></span>
                <span style="font-family:${e};font-size:7px;color:${t.dim}">GDP <span style="color:${t.muted}">${Math.round(Number(r.gdp_growth??50))}</span></span>
                <span style="font-family:${e};font-size:7px;color:${t.dim}">INFL <span style="color:${Number(r.inflation??50)<=50?t.greenBright:t.red}">${Math.round(Number(r.inflation??50))}</span></span>
            </div>
        </div>`}let d="";if(l){const r=Ot(l),o=m=>Number(l[m]??50),c=[{label:"STD OF LIVING",val:o("standard_of_living"),weight:"×0.4",inc:!0},{label:"COST OF LIVING",val:o("cost_of_living"),weight:"×0.3",inc:!0},{label:"CORPORATE TAX",val:o("corporate_tax"),weight:"×0.2",inc:!0},{label:"MINIMUM WAGE",val:o("minimum_wage"),weight:"×0.15",inc:!0},{label:"URBANIZATION",val:o("urbanization"),weight:"×0.1",inc:!0},{label:"UNION STRENGTH",val:o("union_strength"),weight:"×0.1",inc:!0},{label:"CORRUPTION",val:o("corruption"),weight:"×0.15",inc:!1},{label:"UNEMPLOYMENT",val:o("unemployment"),weight:"×0.1",inc:!1},{label:"STABILITY",val:o("stability"),weight:"×0.3",inc:!1}];d=`<div style="padding:6px 12px;background:${t.card};border-bottom:1px solid ${t.border};">
            <div style="font-family:${e};font-size:8px;letter-spacing:1px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">COST BREAKDOWN — ${l.name.toUpperCase()}</div>
            ${c.map(m=>{const p=m.inc?m.val-50:50-m.val,u=p>0?m.inc?t.red:t.greenBright:m.inc?t.greenBright:t.red;return`<div style="display:flex;justify-content:space-between;padding:1px 0;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">${m.label} (${m.weight})</span>
                    <span style="font-family:${e};font-size:8px;color:${u}">${m.val}/100 ${p>=0?"↑":"↓"} cost</span>
                </div>`}).join("")}
            <div style="display:flex;justify-content:space-between;padding:4px 0;margin-top:4px;border-top:1px solid ${t.border};">
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">ENTRY COST</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.gold}">${x(r)}</span>
            </div>
            <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:2px;">Creates Regional HQ (500 capacity) · Unlocks ${l.name} for operations</div>
        </div>`}n.length===0&&(s=`<div style="padding:30px 20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries established in all available nations.</div>`),i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.blue}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Create Subsidiary</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${n.length} MARKET${n.length!==1?"S":""}</span>
        </div>
        ${d}
        <div style="flex:1;overflow:auto;">
            ${s}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div onclick="subCreate()" style="width:100%;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${l?"#000":t.dim};background:${l?t.blue:"transparent"};border:1px solid ${l?t.blue:t.border};cursor:${l?"pointer":"default"};opacity:${l?1:.4}">ESTABLISH SUBSIDIARY</div>
        </div>
    </div>`}window.subSelectNation=oa;window.subCreate=sa;let Qe=[],we=0,ee="ALL",be="REPUTATION";async function ra(){const{data:i}=await _.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name");Qe=(i||[]).map(e=>({...e,abbr:e.corp_ticker||e.abbreviation||e.faction_name?.slice(0,4).toUpperCase()||"???",status:(e.corp_company_type||"Private").toUpperCase(),isPlayer:!!e.linked_user_id,reputation:50,revenue:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*.1:null,valuation:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*3:null}))}function la(i){we=i,rt()}function da(i){ee=i,we=0,rt()}function ca(i){be=i,we=0,rt()}function rt(){const i=document.getElementById("corporations-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},n=[...new Set(Qe.map(p=>p.nation).filter(Boolean))];let l=[...Qe];ee!=="ALL"&&(l=l.filter(p=>p.nation===ee)),be==="REPUTATION"?l.sort((p,u)=>(u.reputation||0)-(p.reputation||0)):be==="REVENUE"?l.sort((p,u)=>(u.revenue||0)-(p.revenue||0)):be==="VALUATION"&&l.sort((p,u)=>(u.valuation||0)-(p.valuation||0)),we>=l.length&&(we=0);const s=l[we]||null,d=s&&s.status==="PRIVATE",r=s&&s.status==="STATE";let o="";l.length===0&&(o=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let p=0;p<l.length;p++){const u=l[p],y=p===we,v=a[u.status]||a.PRIVATE,w=u.status==="PRIVATE";o+=`
        <div onclick="corpSelect(${p})" style="display:flex;align-items:center;padding:6px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${y?t.accent:"transparent"};background:${y?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:36px;font-family:${e};font-size:9px;font-weight:700;color:${t.gold}">${u.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:10px;font-weight:600;color:${t.text};line-height:1.2">${u.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${u.corp_subsector||u.corp_sector||"—"}</div>
            </div>
            <span style="width:55px"><span style="font-family:${e};font-size:7px;padding:1px 4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(u.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:50px;font-family:${e};font-size:8px;font-weight:700;color:${w?t.dim:t.muted};text-align:right">${w?"—":x(u.revenue)}</span>
            <span style="width:30px;font-family:${e};font-size:9px;font-weight:700;color:${u.reputation>=70?t.greenBright:u.reputation>=40?t.accent:t.yellow};text-align:right">${u.reputation}</span>
            <span style="width:50px;font-family:${e};font-size:8px;color:${w?t.dim:t.muted};text-align:right">${w?"—":x(u.valuation)}</span>
            <span style="width:42px;text-align:center"><span style="font-family:${e};font-size:6px;font-weight:700;padding:1px 4px;color:${v.color};background:${v.bg};border:1px solid ${v.border}">${u.status}</span></span>
        </div>`}let c="";if(s){const p=a[s.status]||a.PRIVATE,u=[{label:"Sector",value:s.corp_sector||"—",color:t.text},{label:"Subsector",value:s.corp_subsector||"—",color:t.accent},{label:"Reputation",value:s.reputation+"/100",color:s.reputation>=70?t.greenBright:s.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:d?"UNDISCLOSED":x(s.revenue),color:d?t.dim:t.greenBright},{label:"Cash Reserves",value:d?"UNDISCLOSED":x(s.corp_cash_reserves||0),color:d?t.dim:t.text},{label:"Market Valuation",value:d?"UNDISCLOSED":x(s.valuation),color:d?t.dim:t.gold}];c=`
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${s.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${t.text}">${s.faction_name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-family:${e};font-size:7px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(s.nation||"—").toUpperCase()}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${p.color};background:${p.bg};border:1px solid ${p.border}">${s.status}</span>
                ${s.isPlayer?`<span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.blue};background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2)">PLAYER</span>`:`<span style="font-family:${e};font-size:7px;color:${t.dim}">NPC</span>`}
            </div>
        </div>
        ${u.map(y=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:9px;color:${t.dim};text-transform:uppercase">${y.label}</span>
            <span style="font-family:${e};font-size:${y.label==="Market Valuation"?12:10}px;font-weight:700;color:${y.color};${y.value==="UNDISCLOSED"?"font-style:italic;":""}">${y.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${t.border}"><div style="width:${s.reputation}%;height:100%;background:${s.reputation>=70?t.greenBright:s.reputation>=40?t.accent:t.yellow}"></div></div>
        </div>
        ${d?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(200,168,50,0.03);">
            <div style="font-family:${e};font-size:8px;color:${t.gold};margin-bottom:2px">PRIVATE — FINANCIALS UNDISCLOSED</div>
            <div style="font-size:9px;color:${t.dim};line-height:1.4">Use INVESTIGATE to reveal financial data for 12 ticks.</div>
        </div>`:""}
        ${r?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(204,136,68,0.03);">
            <div style="font-family:${e};font-size:8px;color:${t.orange};margin-bottom:2px">STATE-OWNED ENTERPRISE</div>
            <div style="font-size:9px;color:${t.dim};line-height:1.4">Government-controlled. Cannot be acquired directly. May be privatized by parliamentary vote.</div>
        </div>`:""}
        <div style="flex:1"></div>
        <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
            <div style="display:flex;gap:4px;margin-bottom:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${d?"pointer":"default"};font-family:${e};font-size:8px;font-weight:700;color:${d?t.blue:t.dim};border:1px solid ${d?t.blue+"44":t.border};opacity:${d?1:.3}">INVESTIGATE — $500k</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.accent};border:1px solid ${t.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${r?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${r?t.dim:t.gold};border:1px solid ${r?t.border:t.gold+"44"};opacity:${r?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${r?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${r?t.dim:t.orange};border:1px solid ${r?t.border:t.orange+"44"};opacity:${r?.3:1}">MERGER</div>
            </div>
            ${r?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else c=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const m=`
    <div style="padding:5px 14px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px;width:32px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${ee==="ALL"?"#000":t.dim};background:${ee==="ALL"?t.accent:"transparent"};border:1px solid ${ee==="ALL"?t.accent:t.border}">ALL</span>
            ${n.map(p=>`<span onclick="corpFilterNation('${p}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${ee===p?"#000":t.dim};background:${ee===p?t.accent:"transparent"};border:1px solid ${ee===p?t.accent:t.border}">${p}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(p=>`<span onclick="corpSort('${p}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${be===p?"#000":t.dim};background:${be===p?t.accent:"transparent"};border:1px solid ${be===p?t.accent:t.border}">${p}</span>`).join("")}
        </div>
    </div>`;i.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${Qe.length} IN DATABASE</span>
        </div>
        ${m}
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${t.border};display:flex;flex-direction:column;">
                <div style="display:flex;padding:4px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                    <span style="width:36px;font-family:${e};font-size:7px;color:${t.dim}">ABBR</span>
                    <span style="flex:1.3;font-family:${e};font-size:7px;color:${t.dim}">CORPORATION</span>
                    <span style="width:55px;font-family:${e};font-size:7px;color:${t.dim}">NATION</span>
                    <span style="width:50px;font-family:${e};font-size:7px;color:${t.dim};text-align:right">REV</span>
                    <span style="width:30px;font-family:${e};font-size:7px;color:${t.dim};text-align:right">REP</span>
                    <span style="width:50px;font-family:${e};font-size:7px;color:${t.dim};text-align:right">VALUE</span>
                    <span style="width:42px;font-family:${e};font-size:7px;color:${t.dim};text-align:center">STATUS</span>
                </div>
                <div style="flex:1;overflow:auto;">${o}</div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${c}
            </div>
        </div>
    </div>`}window.corpSelect=la;window.corpFilterNation=da;window.corpSort=ca;let ne=null,le={},U=120,de=15,Dt={},Le=[];async function pa(){if(!pe)return;ne=pe,Dt={};try{const{data:t}=await _.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",f.id);for(const a of t||[])Dt[a.material_key]=Number(a.quantity||0)}catch{}Le=[];try{const{data:t}=await _.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",ne.id).in("status",["pending","won"]);Le=(t||[]).filter(a=>a.faction_id!==f?.id).map(a=>({name:a.factions?.faction_name||"Unknown",ticker:a.factions?.corp_ticker||"???",price:Number(a.bid_price||0),quality:Number(a.estimated_quality||0),status:a.status}))}catch{}le={};const i=ne.required_materials||{};for(const t of Object.keys(i))le[t]="STD";const e=ne.required_workforce||{};U=Number(e.general||0)+Number(e.skilled||0)||120,de=15,et(),lt()}function Kt(){document.getElementById("bid-assembly-overlay")?.remove(),ne=null}function ma(i,e){le[i]=e,lt()}function fa(i){U=i,lt()}function ua(i){de=i,lt()}function lt(){if(document.getElementById("bid-assembly-overlay")?.remove(),!ne)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ne,a=t.issuer_type==="GOVERNMENT",n=k?.name||f?.nation||"—",l=Number(t.budget_ceiling||0),s=Number(t.timeline_ticks||8),d=t.required_materials||{},r=Object.keys(d),o={LOW:.5,STD:1,HIGH:2},c={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},m={LOW:"Low",STD:"Standard",HIGH:"High"},p={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},u=Dt||{};let y=0,v="";for(const z of r){const D=Number(d[z]||0),ei=le[z]||"STD",ti=p[z]||3e5,Pi=o[ei],Oi=Math.round(ti*Pi),ii=D*Oi;y+=ii;const Di=z.replace(/_/g," ").replace(/\b\w/g,ve=>ve.toUpperCase()),ni=Number(u[z]||0),yt=Math.max(0,D-ni),Hi=yt===0?e.greenBright:yt<D?e.yellow:e.red,ji=yt===0?"✓ IN STOCK":`${ni}/${D}`;v+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${Di}</span>
                <div style="font-family:${i};font-size:7px;color:${Hi};margin-top:1px">${ji}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${i};font-size:9px;color:${e.muted}">${D.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(ve=>{const vt=ei===ve,ai=c[ve],Ui=x(Math.round(ti*o[ve]));return`<span onclick="bidSetGrade('${z}','${ve}')" style="padding:2px 6px;font-family:${i};font-size:7px;font-weight:700;cursor:pointer;color:${vt?"#000":e.dim};background:${vt?ai:"transparent"};border:1px solid ${vt?ai:e.border}" title="${Ui}/unit">${m[ve]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${i};font-size:10px;color:${e.text}">${x(ii)}</span></div>
        </div>`}const w=t.required_workforce||{},$=Number(w.general||0)+Number(w.skilled||0)||100,E=Math.max(40,Math.round($*.5)),A=$*2,b=[E,Math.round($*.75),$,Math.round($*1.5),A],S=Math.max(0,Math.min(1,(U-E)/(A-E||1))),T=s,M=Math.round(4.5-S*8),h=Math.max(Math.round(T*.6),T+M),C=M>0?`+${M}mo`:M<0?`${M}mo`:"On schedule",R=M>0?e.red:M<0?e.greenBright:e.yellow,L=15200,P=U*L*h,K=l,Me=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:K>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:K>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:K>1e7}].filter(z=>z.required),Jt=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),ct=Me.filter(z=>!Jt.has(z.name)).reduce((z,D)=>z+D.cost,0),pt=4e5,mt=y+P+ct+pt,Xt=Math.round(mt*(de/100)),Fe=mt+Xt,F=Fe>l,ft=Xt,ue=F?0:Math.max(0,Math.min(100,Math.round(100-Fe/l*100+30))),Zt=ue>70?e.greenBright:ue>40?e.yellow:ue>0?e.orange:e.red,Ni=F?"OVER CEILING":ue>70?"STRONG":ue>40?"COMPETITIVE":ue>20?"WEAK":"UNLIKELY",ut=Object.values(le),ye=ut.length>0?Math.round(ut.reduce((z,D)=>z+(D==="HIGH"?85:D==="STD"?65:45),0)/ut.length):50,Ve=ye>=75?e.greenBright:ye>=55?e.yellow:e.orange,Ri=ye>=75?"STRONG":ye>=55?"PROMISING":"UNCERTAIN",Se=document.createElement("div");Se.id="bid-assembly-overlay",Se.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",Se.addEventListener("click",z=>{z.target===Se&&Kt()}),Se.innerHTML=`
    <div style="width:740px;max-height:94vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <!-- HEADER -->
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${i};font-size:8px;font-weight:700;padding:2px 8px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n.toUpperCase()}</span>
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${t.name}</span>
                    <span style="font-family:${i};font-size:8px;font-weight:700;padding:2px 6px;color:${a?e.accentBright:e.gold};background:${a?"rgba(163,176,126,0.1)":"rgba(200,168,50,0.08)"};border:1px solid ${a?"rgba(163,176,126,0.2)":"rgba(200,168,50,0.2)"}">${a?"GOV":"PRIVATE"}</span>
                </div>
                <span onclick="closeBidAssembly()" style="font-family:${i};font-size:14px;color:${e.dim};cursor:pointer;padding:0 4px">×</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:${i};font-size:9px;color:${e.dim}">${t.project_code||"—"}</span>
                <span style="font-family:${i};font-size:9px;color:${e.dim}">·</span>
                <span style="font-size:10px;color:${e.accent}">${t.issuer_name||"—"}</span>
                <span style="font-family:${i};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${i};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${x(l)}</span></span>
                <span style="font-family:${i};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${i};font-size:9px;color:${e.muted}">Timeline: <span style="color:${e.text};font-weight:700">${s} months</span></span>
            </div>
        </div>

        <!-- CONTENT — two columns -->
        <div style="flex:1;display:flex;overflow:hidden;">

            <!-- LEFT: Cost Assembly -->
            <div style="flex:1;border-right:1px solid ${e.border};overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Materials</span>
                </div>
                <div style="display:flex;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="flex:1.2;font-family:${i};font-size:7px;color:${e.dim}">MATERIAL</span>
                    <span style="flex:0.5;font-family:${i};font-size:7px;color:${e.dim};text-align:center">QTY</span>
                    <span style="flex:1.2;font-family:${i};font-size:7px;color:${e.dim};text-align:center">GRADE</span>
                    <span style="flex:0.8;font-family:${i};font-size:7px;color:${e.dim};text-align:right">COST</span>
                </div>
                ${v}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">MATERIALS TOTAL</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${x(y)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${b.map(z=>`<span onclick="bidSetWorkers(${z})" style="padding:2px 8px;font-family:${i};font-size:8px;font-weight:700;cursor:pointer;color:${U===z?"#000":e.dim};background:${U===z?e.accent:"transparent"};border:1px solid ${U===z?e.accent:e.border}">${z}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">${U} × $${L.toLocaleString()}/tick × ${h} ticks</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${x(P)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${i};font-size:10px;font-weight:700;color:${R}">${h}mo <span style="font-size:8px;opacity:0.7">(${C})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${Me.map(z=>{const D=Jt.has(z.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${i};font-size:8px;font-weight:700;color:${D?e.greenBright:e.orange}">${D?"✓":"○"}</span>
                            <span style="font-size:10px;color:${D?e.muted:e.text}">${z.name}</span>
                        </div>
                        ${D?`<span style="font-family:${i};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${i};font-size:9px;color:${e.redDim}">${x(z.cost)}</span>
                                <span style="font-family:${i};font-size:7px;color:${e.dim};margin-left:4px">${z.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${x(ct)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${x(pt)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:y},{l:"Labor",v:P},{l:"Permits",v:ct},{l:"Overhead",v:pt}].map(z=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${z.l}</span>
                    <span style="font-family:${i};font-size:10px;color:${e.redDim}">${x(z.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${i};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${i};font-size:13px;font-weight:700;color:${e.red}">${x(mt)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${i};font-size:9px;color:${e.dim}">MARKUP %</span>
                        <span style="font-family:${i};font-size:16px;font-weight:700;color:${e.gold}">${de}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${de}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${F?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${i};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${i};font-size:22px;font-weight:700;color:${F?e.red:e.gold}">${x(Fe)}</div>
                    ${F?`<div style="font-family:${i};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${x(l)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${ft>0?e.greenBright:e.dim}">+${x(ft)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${Zt}">${Ni}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${ue}%;height:100%;background:${Zt}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${i};font-size:11px;font-weight:700;color:${Ve}">${ye}</span>
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${i};font-size:8px;font-weight:700;color:${Ve}">${Ri}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${ye}%;height:100%;background:${Ve}"></div></div>
                    <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${Le.length===0?`<div style="font-family:${i};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${Le.map(z=>`<span style="padding:2px 6px;font-family:${i};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${z.name} <span style="color:${e.dim}">Q:${z.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:3px">${Le.length} competing bid${Le.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${F?e.red:e.gold}">${x(Fe)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${e.greenBright}">+${x(ft)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${Ve}">${ye}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${F?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${F?e.dim:"#000"};background:${F?e.border:e.gold};cursor:${F?"not-allowed":"pointer"};opacity:${F?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(Se)}let qe=!1;async function ya(){if(qe||!ne)return;const i=ne,e=i.required_materials||{},t=Object.keys(e),a=Number(i.budget_ceiling||0),n=Number(i.timeline_ticks||8),l={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},s={LOW:.5,STD:1,HIGH:2};let d=0;for(const L of t){const P=Number(e[L]||0),K=le[L]||"STD",fe=l[L]||3e5;d+=P*Math.round(fe*s[K])}const r=15200,o=i.required_workforce||{},c=Number(o.general||0)+Number(o.skilled||0)||100,m=Math.max(40,Math.round(c*.5)),p=c*2,u=Math.max(0,Math.min(1,(U-m)/(p-m||1))),y=Math.round(4.5-u*8),v=Math.max(Math.round(n*.6),n+y),w=U*r*v,$=a,E=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:$>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:$>5e7},{name:"Fire Safety Certification",cost:12e4,required:$>1e7}],A=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),b=E.filter(L=>L.required&&!A.has(L.name)).reduce((L,P)=>L+P.cost,0),T=d+w+b+4e5,M=Math.round(T*(de/100)),h=T+M;if(h>a){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const C=Object.values(le),R=C.length>0?Math.round(C.reduce((L,P)=>L+(P==="HIGH"?85:P==="STD"?65:45),0)/C.length):50;if(confirm('Submit bid for "'+i.name+`"?

Bid Price: `+x(h)+`
Est. Cost: `+x(T)+`
Markup: `+de+"% ("+x(M)+`)
Quality: `+R+`/100
Workers: `+U+`

Once submitted, your bid cannot be changed.`)){qe=!0;try{const{data:L}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),P=L?.current_tick||0,K={};for(const Me of t)K[Me]=le[Me]||"STD";const{error:fe}=await _.from("contract_bids").insert({contract_id:i.id,faction_id:f.id,bid_price:h,material_grades:K,labor_count:U,markup_pct:de,estimated_cost:T,estimated_quality:R,status:"pending",submitted_at_tick:P});if(fe)throw fe;i.status==="open"&&await _.from("construction_contracts").update({status:"bidding"}).eq("id",i.id).eq("status","open"),Kt(),alert(`Bid submitted successfully!

Contract: `+i.name+`
Your Bid: `+x(h)+`
Quality: `+R+`/100

Bids will be resolved when the bidding window closes (`+(i.bidding_ends_tick?"tick "+i.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof me=="function"&&await me()}catch(L){alert("Bid submission failed: "+L.message)}finally{qe=!1}}}window.openBidAssembly=pa;window.closeBidAssembly=Kt;window.bidSetGrade=ma;window.bidSetWorkers=fa;window.bidSetMarkup=ua;window.submitBidAssembly=ya;let Ue=[],ke=0,Z=null,It=!1,Mt=!1,St=!1;async function va(){if(!pe||Mt)return;Mt=!0,Z=pe,ke=0;const{data:i,error:e}=await _.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",Z.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(Mt=!1,e){alert("Failed to load bids: "+e.message);return}Ue=(i||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),et(),qi()}function dt(){document.getElementById("bid-review-overlay")?.remove(),Z=null}function ga(i){ke=i,qi()}async function xa(){if(It||Ue.length===0)return;const i=Ue[ke];if(!(!i?.id||!i.faction_id)&&confirm("Accept bid from "+i.corp+`?

Bid Price: `+x(i.bid_price)+`
Quality: `+i.estimated_quality+`/100
Workers: `+i.labor_count+`

This will award the contract. The project begins immediately.`)){It=!0;try{const{data:e}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:a}=await _.from("contract_bids").update({status:"won"}).eq("id",i.id);if(a)throw a;const{error:n}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",Z.id).neq("id",i.id);if(n)throw n;const{error:l}=await _.from("construction_contracts").update({status:"awarded",awarded_to_faction:i.faction_id,awarded_at_tick:t}).eq("id",Z.id);if(l)throw l;dt(),alert("Contract awarded to "+i.corp+`!

Bid: `+x(i.bid_price)+`
Project begins immediately.`),typeof me=="function"&&await me()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{It=!1}}}async function ba(){if(!(!Z||St)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){St=!0;try{const{error:i}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",Z.id);if(i)throw i;const{error:e}=await _.from("construction_contracts").update({status:"expired"}).eq("id",Z.id);if(e)throw e;dt(),alert("All bids declined. Contract cancelled."),typeof me=="function"&&await me()}catch(i){alert("Failed: "+(i.message||i))}finally{St=!1}}}function qi(){if(document.getElementById("bid-review-overlay")?.remove(),!Z||Ue.length===0)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=Z,a=Ue;ke>=a.length&&(ke=0);const n=a[ke],l=Number(t.budget_ceiling||0),s=Number(t.timeline_ticks||36),d=Math.min(...a.map(u=>u.bid_price)),r=Math.max(...a.map(u=>u.estimated_quality||0));let o="";for(let u=0;u<a.length;u++){const y=a[u],v=u===ke,w=y.bid_price===d,$=(y.estimated_quality||0)===r,E=y.bid_price>l;o+=`
        <div onclick="reviewSelectBid(${u})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${v?e.accent:"transparent"};background:${v?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${i};font-size:10px;font-weight:700;color:${e.gold}">${y.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${y.corp}</span>
                ${w?`<span style="font-family:${i};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${$?`<span style="font-family:${i};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${i};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${i};font-size:14px;font-weight:700;color:${E?e.red:e.text}">${x(y.bid_price)}</div>
                    ${E?`<div style="font-family:${i};font-size:7px;color:${e.red}">OVER BUDGET</div>`:""}
                </div>
                <div style="flex:0.8;padding:5px 10px;border-right:1px solid ${e.border};text-align:center">
                    <div style="font-family:${i};font-size:7px;color:${e.dim}">QUALITY</div>
                    <div style="font-family:${i};font-size:14px;font-weight:700;color:${(y.estimated_quality||0)>=75?e.greenBright:(y.estimated_quality||0)>=55?e.yellow:e.orange}">${y.estimated_quality||0}</div>
                </div>
                <div style="flex:0.8;padding:5px 10px;text-align:center">
                    <div style="font-family:${i};font-size:7px;color:${e.dim}">WORKERS</div>
                    <div style="font-family:${i};font-size:14px;font-weight:700;color:${e.text}">${y.labor_count||0}</div>
                </div>
            </div>
        </div>`}const c=n.bid_price>l,m=l>0?Math.round(n.bid_price/l*100):0,p=document.createElement("div");p.id="bid-review-overlay",p.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",p.addEventListener("click",u=>{u.target===p&&dt()}),p.innerHTML=`
    <div style="width:640px;max-height:92vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${t.name}</span>
                    <span style="font-family:${i};font-size:8px;font-weight:700;padding:2px 6px;color:${e.gold};background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">YOUR PROJECT</span>
                </div>
                <span onclick="closeBidReview()" style="font-family:${i};font-size:14px;color:${e.dim};cursor:pointer">×</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:4px;font-family:${i};font-size:9px;color:${e.dim};">
                <span>${t.project_code||"—"}</span>
                <span>·</span>
                <span>Budget: <span style="color:${e.text};font-weight:700">${x(l)}</span></span>
                <span>·</span>
                <span>Timeline: <span style="color:${e.text};font-weight:700">${s}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${a.length} BID${a.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${i};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${x(d)}</span></span>
                <span>Best Quality: <span style="color:${e.accent}">${r}</span></span>
            </div>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${e.border};overflow:auto;">
                ${o}
            </div>
            <div style="width:250px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.gold}">${n.abbr}</span>
                        <span style="font-size:12px;font-weight:700;color:${e.text}">${n.corp}</span>
                    </div>
                    <div style="font-family:${i};font-size:8px;color:${e.dim};margin-top:2px">${n.subsector}</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="font-family:${i};font-size:8px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Breakdown</span>
                </div>
                ${[{l:"Materials",v:Number(n.estimated_cost||0)*.45},{l:"Labor",v:Number(n.estimated_cost||0)*.45},{l:"Overhead",v:Number(n.estimated_cost||0)*.1}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${i};font-size:9px;color:${e.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${i};font-size:10px;color:${e.muted}">${x(Math.round(u.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${c?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${i};font-size:14px;font-weight:700;color:${c?e.red:e.gold}">${x(n.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${i};font-size:9px;font-weight:700;color:${c?e.red:e.greenBright}">${c?"OVER":"WITHIN"} — ${m}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,m)}%;height:100%;background:${c?e.red:e.accent}"></div></div>
                </div>
                ${[{l:"Quality",v:n.estimated_quality+"/100",c:(n.estimated_quality||0)>=75?e.greenBright:(n.estimated_quality||0)>=55?e.yellow:e.orange},{l:"Markup",v:n.markup_pct+"%",c:e.muted},{l:"Workers",v:n.labor_count+" workers",c:e.text}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${i};font-size:9px;color:${e.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${i};font-size:10px;font-weight:700;color:${u.c}">${u.v}</span>
                </div>`).join("")}
                <div style="flex:1"></div>
            </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${i};font-size:12px;font-weight:700;color:${e.gold}">${x(n.bid_price)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${i};font-size:12px;font-weight:700;color:${e.text}">${n.corp}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${i};font-size:12px;font-weight:700;color:${(n.estimated_quality||0)>=75?e.greenBright:e.yellow}">${n.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(p)}window.openBidReview=va;window.closeBidReview=dt;window.reviewSelectBid=ga;window.acceptBid=xa;window.declineAllBids=ba;window.switchToExpansion=Mi;window.switchToOperations=Si;window.hfSetChange=Wn;window.hfReset=Fn;window.hfConfirm=Vn;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(i){this.classList.contains("active")||(i.preventDefault(),Si(i))});Hn();
