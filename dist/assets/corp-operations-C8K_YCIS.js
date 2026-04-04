import{_ as h}from"./supabase-client-BXEzLDpS.js";import{e as y}from"./utils-C2W-HleY.js";import{i as Qt}from"./messaging-5qyQ6ziq.js";import{c as Kt,a as Je,E as _e,b as Se,d as _t,e as Jt,f as Xt,h as vt}from"./equipment-DsuDdEne.js";const $t={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},ee=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function le(i,t,e){const a=ee.find(d=>d.key===i);if(!a)return{available:!1,failedStat:"unknown_material"};const n=a.tiers[t];if(!n)return{available:!1,failedStat:"unknown_tier"};for(const d of n.requirements){const r=Number(e?.[d.stat]??0);if(r<d.min)return{available:!1,failedStat:d.stat,failedMin:d.min,nationValue:r}}return{available:!0}}function st(i,t,e){const n={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[i]?.[t];if(!n)return 0;const d=ee.find(l=>l.key===i);if(!d)return n;let r=1;for(const l of d.priceDrivers){const s=Number(e?.[l]??50);l==="inflation"||l==="fuel_prices"?r*=1+(s-50)/200:r*=1-(s-50)/250}return r=Math.max(.4,Math.min(2.5,r)),Math.round(n*r)}function ht(i,t,e){const n={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[i]?.[t]||0,r=ee.find(o=>o.key===i)?.priceDrivers?.[0],s=.3+(r?Number(e?.[r]??50):50)/50*.7;return Math.round(n*s)}const rt=["LOW","STD","HIGH"],Xe={LOW:"Low",STD:"Standard",HIGH:"High"};let ye=[],f=null,x=null,z=null,fe=[],xe={},Y=[],R={},Ze=-1,B="concrete",P="STD",de=500,Q=[],et=0,G="trucks",J=0,X=1,ie=[],ce=null,Ie=[],tt=null,Ee=null,it="ALL",nt="TIMELINE";function q(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function Zt(i){if(i>=12){const t=Math.floor(i/12),e=i%12;return e>0?t+"y "+e+"mo":t+"y"}return i+" ticks"}function F(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(1)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(0)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function Ae(i){return i==="civil_engineering"?"CIVIL":i==="industrial"?"INDUSTRIAL":i==="mega_project"?"MEGA":i?.toUpperCase()||"—"}function wt(i){return i==="civil_engineering"?"light":i==="industrial"?"heavy":i==="mega_project"?"mega":"light"}function ei(){Ee&&clearInterval(Ee),Ee=setInterval(()=>{if(!tt)return;const i=tt-Date.now();if(i<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(Ee);return}const t=Math.floor(i/36e5),e=Math.floor(i%36e5/6e4),a=Math.floor(i%6e4/1e3);document.getElementById("tick-countdown").textContent=t+"h "+e+"m "+a+"s"},1e3)}function ti(){document.body.classList.toggle("light-mode");const i=document.getElementById("theme-toggle");i.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function ii(i,t){i==="type"&&(it=t),i==="sort"&&(nt=t),document.querySelectorAll(`.filter-pill[data-filter="${i}"]`).forEach(e=>{e.classList.toggle("active",e.dataset.value===t)}),Et()}function kt(i){return!(!f||i.sector==="mega_project"&&f.corp_subsector!=="Megaprojects"||i.sector==="industrial"&&!["Heavy Infrastructure","Megaprojects"].includes(f.corp_subsector))}function Et(){const i=document.getElementById("oc-list");let t=[...fe];if(it==="GOVERNMENT"?t=t.filter(n=>n.issuer_type==="GOVERNMENT"):it==="PRIVATE"&&(t=t.filter(n=>n.issuer_type==="PRIVATE")),nt==="TIMELINE"&&t.sort((n,d)=>(n.timeline_ticks||0)-(d.timeline_ticks||0)),nt==="BUDGET"&&t.sort((n,d)=>(d.budget_ceiling||0)-(n.budget_ceiling||0)),document.getElementById("oc-count").textContent=t.length+" AVAILABLE",t.length===0){i.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const e=z?.current_tick||0;let a="";for(const n of t){const d=n.issuer_type==="GOVERNMENT",r=d?"gov":"private",l=kt(n),s=l?"":" locked",o=wt(n.sector),c=Ae(n.sector),m=(n.timeline_ticks||0)>18?" warn":"",p=n.bidding_ends_tick?Math.max(0,n.bidding_ends_tick-e):"?";a+=`
            <div class="oc-item${s}" data-contract-id="${n.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${y(n.name)}</span>
                    <span class="oc-item__type-badge ${r}">${d?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${r}">${y(n.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${p} tick${p!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${F(n.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${m}">${Zt(n.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${o}">${c}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${xe[n.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${F(xe[n.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${l?"yes":"no"}">${l?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${l?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openBidModal(contracts.find(x=>x.id==='${n.id}'))">${xe[n.id]?"EDIT":"VIEW"}</button>`:""}
                </div>
                ${n.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${y(n.description)}</div>`:""}
            </div>`}i.innerHTML=a,i.querySelectorAll(".oc-item:not(.locked)").forEach(n=>{n.addEventListener("click",()=>{const d=n.dataset.contractId,r=fe.find(l=>l.id===d);r&&Tt(r)})})}let Ce=null;function Tt(i){Ce=i;const t=document.getElementById("cd-overlay"),e=i.issuer_type==="GOVERNMENT",a=e?"gov":"private",n=(x?.name||f.nation||"—").toUpperCase(),d=kt(i);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${y(n)}</span>
        <span class="cd-header__name">${y(i.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${a}">${y(i.issuer_name)}</span>
        <span class="cd-header__type-badge ${a}">${e?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");i.blueprint_svg?(r.innerHTML=i.blueprint_svg,r.style.display=""):(r.innerHTML=_i(i),r.style.display="");const l=i.permits_required||[],s=i.required_equipment||i.equipment_required||[],o=i.required_materials||i.materials_estimated||{},m={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[i.sector]||i.spec_category||i.sector||"—";let p="var(--teal)";i.sector==="industrial"&&(p="var(--orange)"),i.sector==="mega_project"&&(p="var(--red)");let u=q(i.budget_ceiling||i.budget||0),v=(i.timeline_ticks||i.timeline_months||0)+" Months",g="";g+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${y(i.project_code||i.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${i.project_type?`<span class="cd-tag teal">${y(i.project_type.toUpperCase())}</span>`:""}
                ${i.project_subtype?`<span class="cd-tag gold">${y(i.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,i.description&&(g+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${y(i.description)}</div>
            </div>`),g+='<div class="cd-details">',i.project_type&&(g+=te("Type",i.project_type)),i.project_subtype&&(g+=te("Sub-Type",i.project_subtype)),g+=te("Specialization",m,p),g+=te("Total Budget",u,"var(--green)"),g+=te("Timeline",v),g+=te("Nation",x?.name||f.nation||"—"),i.region&&(g+=te("Region",i.region)),g+="</div>",l.length>0&&(g+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${l.map(T=>{const I=T.status==="approved"?"approved":"required",C=T.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${I}">
                            <span class="cd-chip__icon">${C}</span>
                            <span class="cd-chip__label">${y(T.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),s.length>0&&(g+=`
            <div class="cd-items">
                <div class="cd-section-label">Required Equipment</div>
                <div class="cd-items__list">
                    ${s.map(T=>{const I=T.owned?"owned":"missing",C=T.owned?"&#10003;":"&#10007;";return`<div class="cd-chip ${I}">
                            <span class="cd-chip__icon">${C}</span>
                            <span class="cd-chip__label">${y(T.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),o.length>0&&(g+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${o.map(T=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${y(T.name)}</span>
                        <span class="cd-mat-row__qty">${y(String(T.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=g;const w=l.filter(T=>T.status==="approved").length,$=l.length-w,k=s.filter(T=>T.owned).length,A=s.length-k;let b="";s.length>0&&(A===0?b+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':b+=`<span class="cd-footer__badge bad">${A} EQUIPMENT MISSING</span>`),l.length>0&&($===0?b+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':b+=`<span class="cd-footer__badge warn">${$} PERMITS PENDING</span>`);const S=d,M=(f.action_points??0)>=2;document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${b}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            <button class="cd-btn primary" onclick="placeBid()" ${S&&M?"":"disabled"}
                title="${S?M?"Place a bid (2 AP)":"Need 2 AP to bid":"Not qualified for this contract"}">BID</button>
        </div>
    `,t.classList.add("open"),document.body.style.overflow="hidden"}function It(i){i&&i.target&&i.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Ce=null)}const ni=[{key:"concrete",name:"Concrete",unit:"units"},{key:"steel",name:"Steel",unit:"units"},{key:"lumber",name:"Lumber",unit:"units"},{key:"aggregate",name:"Aggregate",unit:"units"},{key:"em_systems",name:"E&M Systems",unit:"units"},{key:"glass_facades",name:"Glass & Facades",unit:"units"},{key:"asphalt",name:"Asphalt",unit:"units"},{key:"heavy_parts",name:"Heavy Machinery Parts",unit:"units"}],ai=[{key:"work_trucks",name:"Work Trucks",tier:1},{key:"excavators",name:"Excavators",tier:1},{key:"bulldozers",name:"Bulldozers",tier:1},{key:"concrete_mixers",name:"Concrete Mixers",tier:1},{key:"tower_cranes",name:"Tower Cranes",tier:2},{key:"heavy_haulers",name:"Heavy Haulers",tier:2},{key:"pile_drivers",name:"Pile Drivers",tier:2},{key:"asphalt_plants",name:"Asphalt Plants",tier:2}],Ct={LOW:.7,STANDARD:1,HIGH:1.4},Mt={LOW:35,STANDARD:65,HIGH:90},Oe=15;let O=null;function oi(i){if(!i)return;const t=i.required_materials||{},e=i.required_equipment||[],a=i.required_workforce||{},n={concrete:18e4,steel:25e4,lumber:12e4,aggregate:8e4,em_systems:32e4,glass_facades:28e4,asphalt:14e4,heavy_parts:4e5},d=ni.filter(c=>t[c.key]>0).map(c=>({...c,qty:t[c.key],basePrice:n[c.key]||2e5,grade:c.key==="aggregate"?"LOW":"STANDARD",highDisabled:!1})),r=ai.filter(c=>e.includes(c.key)).map(c=>({...c,owned:(Q||[]).some(m=>m.equipment_key===c.key&&m.quantity>0)})),l=(a.general||100)+(a.skilled||20),s=i.budget_ceiling||1e8,o=Math.round(s*.03);O={contract:i,budgetCeiling:s,materials:d,laborCount:l,laborRate:15200,estimatedTicks:i.timeline_ticks||8,equipment:r,permits:[],overhead:o,markupPct:15,competitors:[],playerRep:f?.standing||50,requiredWorkforce:a},document.getElementById("bid-title").textContent="BID ASSEMBLY",document.getElementById("bid-subtitle").textContent=(i.name||"Contract")+" — "+Ae(i.sector)+" — "+(i.issuer_name||"Government"),document.getElementById("bid-overlay").classList.add("open"),document.body.style.overflow="hidden",Le()}function St(i){i&&i.target!==document.getElementById("bid-overlay")||(document.getElementById("bid-overlay").classList.remove("open"),document.body.style.overflow="",O=null)}function N(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(2)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function si(i,t){if(!O)return;const e=O.materials[i];t==="HIGH"&&e.highDisabled||(e.grade=t,Le())}function ri(i){O&&(O.laborCount=i,Le())}function li(i){O&&(O.markupPct=Number(i),Le())}function Le(){if(!O)return;const i=O;let t=0;for(const C of i.materials)C.lineCost=Math.round(C.qty*C.basePrice*Ct[C.grade]),t+=C.lineCost;const e=Math.round(i.laborCount*i.laborRate*i.estimatedTicks),a=Math.round(i.equipment.filter(C=>C.owned).length*12e3*i.estimatedTicks);let n=0;const d=i.overhead,r=t+e+a+n+d,l=Math.round(r*i.markupPct/100),s=r+l,o=s>i.budgetCeiling,c=l,m=Math.round(i.materials.reduce((C,D)=>C+Mt[D.grade],0)/i.materials.length),p=m>=80?"STRONG":m>=60?"PROMISING":m>=40?"UNCERTAIN":"POOR",u=m>=80?"var(--green)":m>=60?"var(--teal)":m>=40?"var(--orange)":"var(--red)",v=i.budgetCeiling>0?s/i.budgetCeiling:1,g=Math.max(0,Math.min(100,Math.round((1-v)*150))),w=g>=70?"STRONG":g>=40?"COMPETITIVE":g>=15?"WEAK":"UNLIKELY",$=g>=70?"var(--green)":g>=40?"var(--teal)":g>=15?"var(--orange)":"var(--red)",k=Math.round(r*(1-Oe/100)),A=Math.round(r*(1+Oe/100));let b="";b+='<div class="bid-section"><div class="bid-section__title">Materials</div>',i.materials.forEach((C,D)=>{const W=me=>{const Vt=C.grade===me,Yt=me==="HIGH"&&C.highDisabled;return`<button class="bid-grade-btn ${Vt?me==="LOW"?"active-low":me==="HIGH"?"active-high":"active":""} ${Yt?"disabled":""}" onclick="setBidGrade(${D},'${me}')">${me[0]}</button>`};b+=`<div class="bid-mat-row">
            <span class="bid-mat-row__name">${y(C.name)}</span>
            <span class="bid-mat-row__qty">×${C.qty}</span>
            <div class="bid-grade-btns">${W("LOW")}${W("STANDARD")}${W("HIGH")}</div>
            <span class="bid-mat-row__cost">${N(C.lineCost)}</span>
        </div>`}),b+=`<div class="bid-line-total"><span class="bid-line-total__label">MATERIALS TOTAL</span><span class="bid-line-total__value">${N(t)}</span></div></div>`;const S=(i.requiredWorkforce?.general||80)+(i.requiredWorkforce?.skilled||20),M=[Math.round(S*.8),S,Math.round(S*1.2),Math.round(S*1.4),Math.round(S*1.6)];b+='<div class="bid-section"><div class="bid-section__title">Labor</div>',b+='<div class="bid-labor-presets">',M.forEach(C=>{b+=`<button class="bid-labor-btn ${i.laborCount===C?"active":""}" onclick="setBidLabor(${C})">${C}</button>`}),b+="</div>";const T=i.requiredWorkforce||{};b+=`<div class="bid-labor-formula">Required: ${T.general||"?"} general + ${T.skilled||"?"} skilled<br>`,b+=`${i.laborCount} workers × ${N(i.laborRate)}/tick × ${i.estimatedTicks} ticks = <strong>${N(e)}</strong></div>`,b+=`<div class="bid-line-total"><span class="bid-line-total__label">LABOR TOTAL</span><span class="bid-line-total__value">${N(e)}</span></div></div>`,b+='<div class="bid-section"><div class="bid-section__title">Equipment</div>',i.equipment.forEach(C=>{const D=C.owned?"bid-equip-row__status--owned":"bid-equip-row__status--missing",W=C.owned?"✓ OWNED":"✗ NOT OWNED";b+=`<div class="bid-equip-row"><span class="bid-equip-row__name">${y(C.name)}</span><span class="bid-equip-row__status ${D}">${W}</span></div>`}),b+=`<div class="bid-line-total"><span class="bid-line-total__label">MAINTENANCE (${i.estimatedTicks}t)</span><span class="bid-line-total__value">${N(a)}</span></div></div>`,b+='<div class="bid-section"><div class="bid-section__title">Permits</div>',b+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:8px 0;">No permits required yet.</div>',b+='<div class="bid-line-total"><span class="bid-line-total__label">PERMITS TOTAL</span><span class="bid-line-total__value">$0</span></div></div>',b+='<div class="bid-section"><div class="bid-section__title">Overhead &amp; Contingency</div>',b+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Site management, insurance, admin</div>',b+=`<div class="bid-line-total"><span class="bid-line-total__label">OVERHEAD</span><span class="bid-line-total__value">${N(d)}</span></div></div>`,document.getElementById("bid-left").innerHTML=b;let I="";I+='<div class="bid-section"><div class="bid-section__title">Cost Summary</div>',I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Materials</span><span class="bid-summary-row__value">${N(t)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Labor</span><span class="bid-summary-row__value">${N(e)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Equipment Maint.</span><span class="bid-summary-row__value">${N(a)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Permits</span><span class="bid-summary-row__value">${N(n)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Overhead</span><span class="bid-summary-row__value">${N(d)}</span></div>`,I+=`<div class="bid-cost-total"><span class="bid-cost-total__label">ESTIMATED COST</span><span class="bid-cost-total__value">${N(r)}</span></div>`,I+=`<div class="bid-accuracy">⚠ Estimate accuracy: ±${Oe}%<br>Actual cost range: ${N(k)} — ${N(A)}</div>`,I+="</div>",I+='<div class="bid-section"><div class="bid-section__title">Markup</div>',I+=`<div class="bid-slider-wrap">
        <div class="bid-slider-label"><span class="bid-slider-label__pct">${i.markupPct}%</span><span style="color:var(--text-dim)">${N(l)}</span></div>
        <input type="range" class="bid-slider" min="0" max="40" value="${i.markupPct}" oninput="setBidMarkup(this.value)">
    </div></div>`,I+=`<div class="bid-price-hero ${o?"bid-price-hero--over":""}">
        <div class="bid-price-hero__label">YOUR BID PRICE</div>
        <div class="bid-price-hero__value">${N(s)}</div>
        ${o?'<div class="bid-price-hero__warning">EXCEEDS BUDGET CEILING ('+N(i.budgetCeiling)+")</div>":""}
    </div>`,I+=`<div class="bid-profit"><span class="bid-profit__label">PROJECTED PROFIT</span><span class="bid-profit__value">+${N(c)}</span></div>`,I+=`<div class="bid-compete">
        <div style="display:flex;justify-content:space-between;"><span class="bid-compete__label" style="color:${$}">${w}</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Competitiveness</span></div>
        <div class="bid-compete__bar-wrap"><div class="bid-compete__bar" style="width:${g}%;background:${$}"></div></div>
    </div>`,I+=`<div class="bid-quality">
        <div style="display:flex;justify-content:space-between;"><span class="bid-quality__label" style="color:${u}">${p} (${m}/100)</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Quality Estimate</span></div>
        <div class="bid-quality__bar-wrap"><div class="bid-quality__bar" style="width:${m}%;background:${u}"></div></div>
    </div>`,I+='<div class="bid-section" style="margin-top:8px;"><div class="bid-section__title">Competing Bids</div>',i.competitors.forEach(C=>{I+=`<div class="bid-competitor"><span class="bid-competitor__name">${y(C.name)}</span><span class="bid-competitor__rep">Rep ${C.rep}</span></div>`}),I+=`<div class="bid-competitor" style="color:var(--gold);"><span class="bid-competitor__name">You</span><span class="bid-competitor__rep">Rep ${i.playerRep}</span></div>`,I+="</div>",document.getElementById("bid-right").innerHTML=I,document.getElementById("bid-footer-price").textContent=N(s),document.getElementById("bid-footer-price").style.color=o?"var(--red)":"var(--gold)",document.getElementById("bid-footer-profit").textContent="+"+N(c),document.getElementById("bid-footer-quality").textContent=m+"/100",document.getElementById("bid-footer-quality").style.color=u,document.getElementById("bid-submit-btn").disabled=o}window.openBidModal=oi;window.closeBidModal=St;window.setBidGrade=si;window.setBidLabor=ri;window.setBidMarkup=li;let De=!1;async function di(){if(!O||!f||De)return;const i=O,t=i.contract;let e=0;const a={};for(const m of i.materials)e+=Math.round(m.qty*m.basePrice*Ct[m.grade]),a[m.key]=m.grade;const n=Math.round(i.laborCount*i.laborRate*i.estimatedTicks),d=Math.round(i.equipment.filter(m=>m.owned).length*12e3*i.estimatedTicks),r=e+n+d+i.overhead,l=Math.round(r*i.markupPct/100),s=r+l,o=Math.round(i.materials.reduce((m,p)=>m+Mt[p.grade],0)/(i.materials.length||1));if(s>i.budgetCeiling){alert("Bid exceeds budget ceiling. Lower your costs or markup.");return}const c=document.getElementById("bid-submit-btn");c.disabled=!0,c.textContent="SUBMITTING...",De=!0;try{const{data:m}=await h.from("shard").select("current_tick").eq("name","Alpha Shard").single(),p=m?.current_tick||0,{data:u}=await h.from("contract_bids").select("id").eq("contract_id",t.id).eq("faction_id",f.id).maybeSingle();if(u){const{error:g}=await h.from("contract_bids").update({bid_price:s,material_grades:a,labor_count:i.laborCount,markup_pct:i.markupPct,estimated_cost:r,estimated_quality:o,submitted_at_tick:p}).eq("id",u.id);if(g)throw g}else{const{error:g}=await h.from("contract_bids").insert({contract_id:t.id,faction_id:f.id,bid_price:s,material_grades:a,labor_count:i.laborCount,markup_pct:i.markupPct,estimated_cost:r,estimated_quality:o,status:"pending",submitted_at_tick:p});if(g)throw g}St();const v=document.getElementById("oc-count");if(v){const g=v.textContent;v.textContent="✓ BID SUBMITTED",v.style.color="var(--green)",setTimeout(()=>{v.textContent=g,v.style.color=""},2e3)}await Lt()}catch(m){console.error("Bid submission failed:",m),alert("Failed to submit bid: "+(m.message||"Unknown error")),c.disabled=!1,c.textContent="SUBMIT BID"}finally{De=!1}}window.submitBid=di;const ae=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],yt={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},gt={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let L=null;function ci(i){const t=Y.find(T=>T.id===i);if(!t)return;const e=Array.isArray(t.contract_bids)?t.contract_bids[0]:t.contract_bids,a=z?.current_tick||0,n=t.awarded_at_tick||a,d=t.timeline_ticks||8,r=Math.max(0,a-n),l=Math.min(100,r/d*100);let s=Math.min(ae.length-1,Math.floor(l/(100/ae.length)));const o=Math.round(l%(100/ae.length)/(100/ae.length)*100),c=t.required_materials||{},m=e?.material_grades||{},p=Object.entries(c).map(([T,I])=>{const C=m[T]||"STANDARD",D=Math.round(I*(l/100)*(.6+Math.random()*.4));return{key:T,name:T.replace(/_/g," ").replace(/\b\w/g,W=>W.toUpperCase()),grade:C,allocated:I,used:Math.min(D,I)}}),v=(t.required_equipment||[]).map(T=>({key:T,name:T.replace(/_/g," ").replace(/\b\w/g,I=>I.toUpperCase()),qty:1+Math.floor(Math.random()*3),condition:55+Math.floor(Math.random()*40)})),g=t.budget_ceiling||0,w=e?.estimated_cost||0,$=Math.round(w*Math.min(1,r/d)),k=e?.estimated_quality||65,A=k>=80?"STRONG":k>=60?"PROMISING":k>=40?"FAIR":"UNCERTAIN",b=t.required_workforce||{},S=(b.general||0)+(b.skilled||0),M=e?.labor_count||S;L={project:t,bid:e,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:a,awardedTick:n,totalTicks:d,ticksElapsed:r,phaseIdx:s,phaseProgress:o,materials:p,equipment:v,budget:g,estCost:w,spent:$,quality:k,qualityLabel:A,laborCount:M,wfNeeded:S,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",At(t.id).then(()=>pe()),pe()}function pi(i){i&&i.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",L=null)}function mi(i){L&&(L.tab=i,L.expandedEvent=-1,L.selectedResponse=null,pe())}function fi(i){L&&(L.expandedEvent=L.expandedEvent===i?-1:i,L.selectedResponse=null,pe())}function ui(i){L&&(L.selectedResponse=L.selectedResponse===i?null:i,pe())}function pe(){if(!L)return;const i=L,t=i.project,e=t.issuer_type==="GOVERNMENT",a=Ae(t.sector),n=f?.nation||"Nation",d=i.awardedTick+i.totalTicks,r=Math.max(0,d-i.currentTick),l=i.currentTick>d,s=i.budget>0?Math.round(i.spent/i.budget*100):0,o=s>85?"var(--red)":s>60?"var(--amber)":"var(--teal)",c=i.budget-i.spent,m=i.events.filter(w=>w.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${y(n.toUpperCase())}</span>
                <span class="pm-hdr__name">${y(t.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${y(t.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${e?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${y(t.template_key||t.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${y(a.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${y((t.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let p='<div class="pm-phase__bar">';for(let w=0;w<ae.length;w++){const $=w<i.phaseIdx,k=w===i.phaseIdx;p+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${$?"done":k?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${$?"done":k?"active":""}">${ae[w]}</span>
        </div>`}p+="</div>",p+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${ae[i.phaseIdx]} — ${i.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${l?"var(--red)":"var(--text-secondary)"}">Tick ${i.ticksElapsed} / ${i.totalTicks}${l?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=p;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:m},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map(w=>`<button class="pm-tab${i.tab===w.id?" active":""}" onclick="pmSetTab('${w.id}')">
            ${w.label}${w.badge>0?`<span class="pm-tab__badge">${w.badge}</span>`:""}
        </button>`).join("");let v="";i.tab==="overview"?v=vi(i,t,o,s,c,r,l):i.tab==="events"?v=yi(i):i.tab==="materials"?v=gi(i):i.tab==="equipment"&&(v=bi(i)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${v}</div>`;let g="";m>0&&(g+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${m} EVENT${m>1?"S":""} REQUIRES RESPONSE</span>`),g+=`<span class="pm-ftr__badge" style="color:${i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${i.quality}/100 — ${i.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${g}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function vi(i,t,e,a,n,d,r){const l=He(i.awardedTick+i.totalTicks);He(i.awardedTick+i.totalTicks);const s=He(i.awardedTick),o=[{label:"Budget",value:F(i.budget),sub:`${a}% spent`,color:e},{label:"Spent",value:F(i.spent),color:"var(--red)"},{label:"Remaining",value:F(n),color:"var(--green)"},{label:"Quality",value:`${i.quality}/100`,sub:i.qualityLabel,color:i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${i.laborCount}/${i.wfNeeded}`,sub:`Bid: ${i.laborCount}`,color:i.laborCount<i.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${d} ticks`,sub:r?"OVERDUE":`Deadline: ${l}`,color:r?"var(--red)":"var(--text-bright)"}];let c="";c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${y(t.description||t.name)}</div>
    </div></div>`,c+='<div class="pm-metrics">';for(const p of o)c+=`<div class="pm-metric">
            <div class="pm-metric__label">${p.label}</div>
            <div class="pm-metric__value" style="color:${p.color}">${p.value}</div>
            ${p.sub?`<div class="pm-metric__sub">${y(p.sub)}</div>`:""}
        </div>`;c+="</div>",c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${s}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${l}</span></span>
        </div>
    </div></div>`;const m=[];if((t.sector==="civil_engineering"||t.sector==="industrial"||t.sector==="mega_project")&&(m.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),m.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),t.sector!=="civil_engineering"&&m.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),m.length>0){c+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const p of m)c+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${y(p.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;c+="</div></div>"}return c}function yi(i){if(i.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let t="";for(let e=0;e<i.events.length;e++){const a=i.events[e],n=i.expandedEvent===e,d=a.status==="ACTIVE",r=yt[a.type]||yt.WEATHER,l=gt[a.severity]||gt.LOW;if(t+=`<div class="pm-evt ${d?"pm-evt--active":"pm-evt--resolved"}" style="${d?`border-left-color:${r.color}`:""}">`,t+=`<div class="pm-evt__header" onclick="pmToggleEvent(${e})" style="${n?`background:${r.bg}`:""}">`,t+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${a.type}</span>
            <span class="pm-evt__sev-badge" style="color:${l}">${a.severity}</span>
            <span class="pm-evt__status" style="color:${d?"var(--red)":"var(--text-dim)"};font-weight:${d?"700":"400"}">${d?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,t+=`<div class="pm-evt__title">${y(a.title)}</div>`,t+=`<div class="pm-evt__meta">Tick ${a.tick} · ${y(a.id||"")}</div>`,n){if(t+='<div class="pm-evt__body">',t+=`<div class="pm-evt__desc">${y(a.desc)}</div>`,a.impact&&(t+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${y(a.impact)}</span>
                </div>`),d&&a.responses&&a.responses.length>0){t+='<div class="pm-evt__resp-title">Response Options</div>';for(let s=0;s<a.responses.length;s++){const o=a.responses[s],c=i.selectedResponse===s,p={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[o.tag]||"var(--text-secondary)";t+=`<div class="pm-resp${c?" selected":""}" style="${c?`border-color:${p}`:""}" onclick="event.stopPropagation();pmSelectResponse(${s})">`,t+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${y(o.label)}</span>
                            <span class="pm-resp__tag" style="color:${p};background:${p}12;border:1px solid ${p}25">${o.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${o.delay>0?"var(--orange)":"var(--green)"}">
                            ${o.delay>0?`+${o.delay} tick${o.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,t+=`<div class="pm-resp__detail">${y(o.detail)}</div>`,t+='<div class="pm-resp__costs">',o.cost&&(t+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${F(o.cost)}</span>`),o.qualityImpact&&o.qualityImpact!==0&&(t+=`<span class="pm-resp__cost" style="color:${o.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${o.qualityImpact>0?"+":""}${o.qualityImpact}</span>`),!o.cost&&(!o.qualityImpact||o.qualityImpact===0)&&(t+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),t+="</div>",c&&(t+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${p}" onclick="event.stopPropagation();confirmEventResponse('${a.id}','${o.key}')">CONFIRM</button>
                        </div>`),t+="</div>"}}!d&&a.resolution&&(t+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${y(a.resolution)}</div>
                </div>`),t+="</div>"}t+="</div></div>"}return t}function gi(i){if(i.materials.length===0)return'<div class="pm-evt-empty">No materials allocated to this project.</div>';let t='<div class="pm-tab-header">Allocated Materials</div>';for(const e of i.materials){const a=e.allocated>0?Math.round(e.used/e.allocated*100):0,n=e.grade==="HIGH"?"high":e.grade==="LOW"?"low":"std",d=e.grade==="HIGH"?"var(--green)":e.grade==="LOW"?"var(--orange)":"var(--amber)";t+=`<div class="pm-mat">
            <div class="pm-mat__row1">
                <div class="pm-mat__left">
                    <span class="pm-mat__name">${y(e.name)}</span>
                    <div class="pm-mat__grade-dot pm-mat__grade-dot--${n}"></div>
                    <span class="pm-mat__grade" style="color:${d}">${e.grade}</span>
                </div>
                <span class="pm-mat__qty">${e.used.toLocaleString()} / ${e.allocated.toLocaleString()}</span>
            </div>
            <div class="pm-mat__bar-row">
                <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${a}%"></div></div>
                <span class="pm-mat__pct">${a}% consumed</span>
            </div>
        </div>`}return t}function bi(i){if(i.equipment.length===0)return'<div class="pm-evt-empty">No equipment deployed to this project.</div>';let t='<div class="pm-tab-header">Deployed Equipment</div>';for(const e of i.equipment){const a=e.condition>=75?"var(--green)":e.condition>=50?"var(--amber)":e.condition>=25?"var(--orange)":"var(--red)",n=e.condition<60;t+=`<div class="pm-eq">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${y(e.name)}</span>
                    <span class="pm-eq__qty">×${e.qty}</span>
                    ${n?'<span class="pm-eq__wear">WEAR</span>':""}
                </div>
            </div>
            <div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${e.condition}%;background:${a}"></div></div>
                <span class="pm-eq__cond-val" style="color:${a}">${e.condition}%</span>
            </div>
        </div>`}return t}function He(i){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][i%12]}, ${2e3+Math.floor(i/12)}`}window.openProjectModal=ci;window.closeProjectModal=pi;window.pmSetTab=mi;window.pmToggleEvent=fi;window.pmSelectResponse=ui;async function At(i){if(!L)return;const{data:t,error:e}=await h.from("construction_events").select("*").eq("contract_id",i).order("fired_at_tick",{ascending:!1});e?(console.warn("Failed to load project events:",e.message),L.events=[]):L.events=(t||[]).map(a=>({id:a.id,type:a.type,severity:a.severity,tick:a.fired_at_tick,title:a.title,desc:a.description,impact:a.impact,status:a.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:a.resolution,responses:a.responses||[]})),pe()}let je=!1;async function xi(i,t){if(!(je||!L)){je=!0;try{const{data:e,error:a}=await h.rpc("resolve_construction_event",{p_event_id:i,p_response_key:t});if(a){console.error("Failed to resolve event:",a.message),alert("Failed to submit response: "+a.message);return}const n=typeof e=="string"?JSON.parse(e):e;if(n?.error){alert("Error: "+n.error);return}await At(L.project.id),await qt(),n?.quality_applied&&n.quality_applied!==0&&(L.quality=Math.max(0,Math.min(100,L.quality+n.quality_applied)),L.qualityLabel=L.quality>=80?"STRONG":L.quality>=60?"PROMISING":L.quality>=40?"FAIR":"UNCERTAIN"),pe()}finally{je=!1}}}window.confirmEventResponse=xi;function te(i,t,e){const a=e?` style="color:${e}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${y(i)}</span>
        <span class="cd-detail-row__value"${a}>${y(t)}</span>
    </div>`}function _i(i){const t={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},e=i.drawing_number||i.contract_number+"-A1",a=z?.current_date||"",n=a?a.replace(/,\s*/," "):"",d=i.spec_category==="Heavy Infrastructure",r=i.spec_category==="Megaproject";let l=y(i.project_subtype||i.project_type||"STRUCTURE"),s=d?"80.0m":r?"200.0m":"60.0m",o=d?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${t.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(c,m)=>`<line x1="${m*20}" y1="0" x2="${m*20}" y2="200" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(c,m)=>`<line x1="0" y1="${m*20}" x2="680" y2="${m*20}" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${t.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${t.accent}" font-family="var(--font-mono)" font-weight="700">${l.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${t.text}" font-family="var(--font-mono)">${y(i.name)}</text>

        <!-- Internal divisions -->
        <line x1="200" y1="30" x2="200" y2="150" stroke="${t.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="340" y1="30" x2="340" y2="150" stroke="${t.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="480" y1="30" x2="480" y2="150" stroke="${t.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="60" y1="90" x2="620" y2="90" stroke="${t.line}" stroke-width="0.4" stroke-dasharray="4,2"/>

        <!-- Dimension: top -->
        <line x1="60" y1="20" x2="620" y2="20" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="60" y1="17" x2="60" y2="23" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="620" y1="17" x2="620" y2="23" stroke="${t.dim}" stroke-width="0.5"/>
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)">${s}</text>

        <!-- Dimension: right -->
        <line x1="630" y1="30" x2="630" y2="150" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="627" y1="30" x2="633" y2="30" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="627" y1="150" x2="633" y2="150" stroke="${t.dim}" stroke-width="0.5"/>
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${o}</text>

        <!-- Scale bar -->
        <line x1="60" y1="175" x2="160" y2="175" stroke="${t.accent}" stroke-width="0.8"/>
        <line x1="60" y1="172" x2="60" y2="178" stroke="${t.accent}" stroke-width="0.8"/>
        <line x1="110" y1="173" x2="110" y2="177" stroke="${t.accent}" stroke-width="0.5"/>
        <line x1="160" y1="172" x2="160" y2="178" stroke="${t.accent}" stroke-width="0.8"/>
        <text x="60" y="186" font-size="5" fill="${t.text}" font-family="var(--font-mono)">0m</text>
        <text x="107" y="186" font-size="5" fill="${t.text}" font-family="var(--font-mono)">5m</text>
        <text x="154" y="186" font-size="5" fill="${t.text}" font-family="var(--font-mono)">10m</text>

        <!-- Title block -->
        <rect x="490" y="165" width="180" height="24" fill="${t.bg}" stroke="${t.line}" stroke-width="0.5"/>
        <text x="500" y="175" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">DWG NO.</text>
        <text x="540" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${y(e)}</text>
        <text x="500" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${y(n)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${t.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${t.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${t.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}let Ue=!1;async function $i(){if(Ue||!Ce||!f)return;if((f.action_points??0)<2){alert("You need at least 2 AP to place a bid.");return}Ue=!0;const i=document.querySelector(".cd-btn.primary");i&&(i.disabled=!0,i.textContent="...");try{const{data:t,error:e}=await h.rpc("deduct_ap",{p_faction_id:f.id,p_cost:2});if(e)throw e;if(t<0){const n=-t-1;f.action_points=n,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+n+" AP</span>",i&&(i.disabled=!1,i.textContent="BID"),alert("Insufficient AP. You have "+n+" AP, need 2.");return}const{error:a}=await h.from("corp_contract_bids").insert({contract_id:Ce.id,faction_id:f.id,nation_id:f.nation_id,ap_spent:2,created_at_tick:z?.current_tick||null});if(a)throw await h.rpc("deduct_ap",{p_faction_id:f.id,p_cost:-2}),f.action_points=t+2,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+(t+2)+" AP</span>",a;f.action_points=t,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+t+" AP</span>",i&&(i.textContent="BID PLACED")}catch(t){i&&(i.disabled=!1,i.textContent="BID"),t.code==="23505"?alert("You have already placed a bid on this contract."):alert("Failed to place bid: "+(t.message||"Unknown error"))}finally{Ue=!1}}async function Lt(){if(!f||!f.nation_id)return;const{data:i,error:t}=await h.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(t?(console.warn("Failed to load contracts:",t.message),fe=[]):fe=i||[],xe={},f&&fe.length>0){const e=fe.map(n=>n.id),{data:a}=await h.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",f.id).in("contract_id",e);for(const n of a||[])xe[n.contract_id]=n}Et()}function hi(){const i=document.getElementById("ap-list"),t=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=Y.length+" ACTIVE",Y.length===0){i.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,t.style.display="none";return}const e=z?.current_tick||0;let a=0,n=0,d="";for(const r of Y){const l=r.issuer_type==="GOVERNMENT",s=l?"gov":"private",o=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,c=o?.bid_price||0,m=o?.estimated_cost||0,p=o?.estimated_quality||0,u=r.budget_ceiling||0,v=r.awarded_at_tick||e,g=v+(r.timeline_ticks||8),w=Math.max(0,g-e),$=Math.max(0,e-v),k=r.timeline_ticks||8,A=Math.min(100,Math.round($/k*100)),b=e>g;wt(r.sector);const S=Ae(r.sector);a+=u,n+=c,d+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${y(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${y(r.issuer_name||"—")} · ${S}</div>
                </div>
                <span class="oc-item__type-badge ${s}">${l?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS</span>
                    <span class="ap-budget__values" style="color:${b?"var(--red)":"var(--teal)"}">
                        ${$}/${k} ticks ${b?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${A}%;background:${b?"var(--red)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${F(c)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${F(m)}</div>
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
        </div>`}i.innerHTML=d,t.style.display=Y.length>0?"":"none",Y.length>0&&(document.getElementById("ap-total-crew").textContent=Y.length,document.getElementById("ap-total-budget").textContent=F(a),document.getElementById("ap-total-spent").textContent=F(n))}async function qt(){if(!f)return;const{data:i,error:t}=await h.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",f.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",f.id).order("awarded_at_tick",{ascending:!0});t?(console.warn("Failed to load active projects:",t.message),Y=[]):Y=i||[],hi()}const Nt=3e4;function zt(){let i=0,t=0;for(const e of ee)for(const a of rt){const n=R[e.key]?.[a];n&&(i+=n.qty,t+=n.value)}return{totalUnits:i,totalValue:t}}function lt(){const i=document.getElementById("wh-list"),{totalUnits:t,totalValue:e}=zt();document.getElementById("wh-count").textContent=t.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=q(e);const a=Math.round(t/Nt*100),n=document.getElementById("wh-capacity");n.textContent=a+"%",n.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)";let d="";for(let r=0;r<ee.length;r++){const l=ee[r],s=Ze===r,o=R[l.key]?.LOW||{qty:0,value:0},c=R[l.key]?.STD||{qty:0,value:0},m=R[l.key]?.HIGH||{qty:0,value:0},p=o.qty+c.qty+m.qty,u=o.value+c.value+m.value,v=p===0,g=le(l.key,"LOW",x),w=le(l.key,"STD",x),$=le(l.key,"HIGH",x),k=o.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",A=c.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",b=$.available?m.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(d+='<div class="wh-row">',d+=`<div class="wh-row__collapsed${s?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${s?"▾":"▸"}</span>
            <span class="wh-row__name${v?" empty":""}">${y(l.name)}</span>
            <div class="wh-row__dots">
                <div class="${k}"></div>
                <div class="${A}"></div>
                <div class="${b}"></div>
            </div>
            <span class="wh-row__qty${v?" empty":""}">${p>0?p.toLocaleString():"—"}</span>
            <span class="wh-row__val${v?" empty":""}">${u>0?q(u):"—"}</span>
        </div>`,s){d+='<div class="wh-expand">',d+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const S=[{key:"LOW",label:"Low",data:o,avail:g,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:c,avail:w,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:m,avail:$,color:"var(--green)",dotClass:"wh-dot--high"}];for(const M of S){const T=!M.avail.available,I=M.data.qty>0,C=I?"$"+Math.round(M.data.value/M.data.qty):"—";d+=`<div class="wh-grade${T?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${M.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${T?"var(--red)":M.color}">${M.label}</span>
                        ${T?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${I?"var(--text-bright)":"var(--text-dim)"}">${I?M.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${M.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${M.data.value>0?q(M.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${C}</span>
                </div>`}for(const M of S)!M.avail.available&&M.avail.failedStat&&(d+=`<div class="wh-lock">
                        <span class="wh-lock__text">${M.label.toUpperCase()} GRADE LOCKED — ${y(M.avail.failedStat)} &lt; ${M.avail.failedMin}</span>
                    </div>`);d+="</div>"}d+="</div>"}i.innerHTML=d}function wi(i){Ze=Ze===i?-1:i,lt()}async function ki(){if(!f)return;const{data:i,error:t}=await h.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",f.id);if(R={},t)console.warn("Failed to load warehouse:",t.message);else if(i)for(const e of i)R[e.material_key]||(R[e.material_key]={}),R[e.material_key][e.quality_tier]={qty:e.quantity||0,value:Number(e.total_value)||0};lt()}const Ei={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Bt(){const i=(x?.name||f?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+i;const t=Number(f?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=q(t);const{totalUnits:e}=zt(),a=Math.round(e/Nt*100),n=document.getElementById("pr-wh-capacity");n.textContent=a+"%",n.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)",Pt(),dt(),qe()}function Pt(){const i=document.getElementById("pr-mat-grid");let t="";for(const e of ee){const a=B===e.key,n=rt.every(r=>!le(e.key,r,x).available),d="pr-mat-btn"+(a?" active":"")+(n?" all-locked":"");t+=`<span class="${d}" onclick="setPrMat('${e.key}')">${y(e.name)}</span>`}i.innerHTML=t}function dt(){const i=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const e of rt){const a=le(B,e,x),n=P===e,d=a.available?st(B,e,x):null,r=$t[e],l=!a.available,s="pr-tier-btn"+(n?" active":"")+(l?" locked":"");t+=`<div class="${s}" onclick="${l?"":`setPrTier('${e}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${n?"var(--text-bright)":"var(--text-dim)"}">${Xe[e]}</span>
            </div>
            ${d!==null?`<div class="pr-tier-btn__price" style="color:${n?"var(--text-bright)":"var(--text-muted)"}">$${d}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}i.innerHTML=t}function qe(){const i=document.getElementById("pr-content"),t=le(B,P,x),e=ee.find($=>$.key===B);if(!e)return;if(!t.available){i.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${y(e.name)} — ${Xe[P]} grade
                    is not produced domestically in ${y(x?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${y(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const a=st(B,P,x),n=ht(B,P,x),d=a*de,r=n>3e3?"LOW":n>1e3?"MODERATE":"HIGH",l=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",s=Number(x?.inflation??50),o=s>55?"up":s<45?"down":"flat",c=o==="up"?"&#9650;":o==="down"?"&#9660;":"&#8212;",m=o==="up"?"var(--red)":o==="down"?"var(--green)":"var(--text-dim)";let p="";p+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
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
                <div class="pr-market-cell__value" style="font-size:12px;color:${l};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,p+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${y(x?.name||"—")})</div>`;for(const $ of e.priceDrivers){const k=Number(x?.[$]??50),A=k>=50?"var(--green)":k>=30?"var(--amber)":k>=15?"var(--orange)":"var(--red)",b=Ei[$]||$;p+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${y($)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${k}%;background:${A}"></div>
            </div>
            <span class="pr-driver-row__val">${k}</span>
            <span class="pr-driver-row__effect">${y(b)}</span>
        </div>`}p+="</div>";const v=(Number(f?.corp_cash_reserves)||0)>=d,g=de>n,w=$t[P];p+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${y(e.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${w};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${w}">${Xe[P]}</span>
                </div>
                <span class="pr-order__mat-price">$${a}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map($=>`<span class="pr-qty-btn${de===$?" active":""}" onclick="setPrQty(${$})">${$>=1e3?$/1e3+"k":$}</span>`).join("")}
                </div>
            </div>
            ${g?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${n.toLocaleString()} this tick</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${q(d)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${v&&!g?"":"disabled"}
                    title="${v?g?"Exceeds supply":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,i.innerHTML=p}function Ti(i){B=i,P="STD";for(const t of["STD","HIGH","LOW"])if(le(i,t,x).available){P=t;break}Pt(),dt(),qe()}function Ii(i){P=i,dt(),qe()}function Ci(i){de=i,qe()}let Ge=!1;async function Mi(){if(Ge||!f||!x)return;const i=st(B,P,x),t=ht(B,P,x),e=i*de,a=Number(f.corp_cash_reserves)||0;if(e>a){alert("Insufficient cash reserves.");return}if(de>t){alert("Exceeds available supply this tick.");return}Ge=!0;const n=document.querySelector(".pr-purchase-btn");n&&(n.disabled=!0,n.textContent="...");try{const d=a-e,{error:r}=await h.from("factions").update({corp_cash_reserves:d}).eq("id",f.id);if(r)throw r;const l=R[B]?.[P],s=(l?.qty||0)+de,o=(l?.value||0)+e,{error:c}=await h.from("corp_warehouse").upsert({faction_id:f.id,nation_id:f.nation_id,material_key:B,quality_tier:P,quantity:s,total_value:o,last_purchased_tick:z?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(c){const{error:m}=await h.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);throw m&&console.error("Cash refund failed after warehouse error:",m.message),c}f.corp_cash_reserves=d,R[B]||(R[B]={}),R[B][P]={qty:s,value:o},lt(),Bt(),n&&(n.textContent="PURCHASED",setTimeout(()=>{n.isConnected&&(n.disabled=!1,n.textContent="PURCHASE")},1500))}catch(d){n&&(n.disabled=!1,n.textContent="PURCHASE"),alert("Purchase failed: "+(d.message||"Unknown error"))}finally{Ge=!1}}function Rt(i){const t=ce||x;if(!t)return[];const e=Se(i);if(!e)return[];const a=Jt(i,t),n=[],d=Number(t?.inflation??50),r=Number(t?.fuel_prices??50);Number(t?.manufacturing_output??50);const l=ce&&x&&ce.id!==x.id;let s=null;if(l&&(s=Xt(t,x)),a.newAvailable>0){const o=vt(i,t),c=e.basePrice,m=Math.round(c*((d-50)/200)),p=Math.round(c*((r-50)/300));let u=o;const v=[{label:"Base price",value:q(c)},m!==0?{label:`Inflation (${d})`,mod:(m>=0?"+":"")+q(Math.abs(m))}:null,p!==0?{label:`Fuel transport (${r})`,mod:(p>=0?"+":"")+q(Math.abs(p))}:null].filter(Boolean),g=o-c-m-p;if(g!==0&&!l&&v.push({label:"Demand/scarcity",mod:(g>=0?"+":"")+q(Math.abs(g))}),l&&s){const w=Math.round(o*s.tariff),$=Math.round(o*s.transport);u=o+w+$,v.push({label:`Import tariff (${Math.round(s.tariff*100)}%)`,mod:"+"+q(w)}),v.push({label:`Transport (${s.deliveryTicks} tick${s.deliveryTicks>1?"s":""})`,mod:"+"+q($)})}n.push({seller:l?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:l?s?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:a.newAvailable,delivery:l?s.deliveryTicks+" tick"+(s.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:l?s.deliveryTicks:0,used:!1,priceFactors:v,sourceNationId:t.id})}if(a.usedAvailable>0){const o=a.usedCondition,c=vt(i,t,{used:!0,condition:o});let m=c;const p=[{label:"Base price",value:q(e.basePrice)},{label:`Condition (${o}%)`,mod:"-"+q(Math.max(0,e.basePrice-c))}];if(l&&s){const u=Math.round(c*s.tariff),v=Math.round(c*s.transport);m=c+u+v,p.push({label:`Import tariff (${Math.round(s.tariff*100)}%)`,mod:"+"+q(u)}),p.push({label:`Transport (${s.deliveryTicks} tick${s.deliveryTicks>1?"s":""})`,mod:"+"+q(v)})}n.push({seller:l?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:l?s?.deliveryTicks||1:0,condition:o,price:Math.round(m),available:a.usedAvailable,delivery:l?s.deliveryTicks+" tick"+(s.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:l?s.deliveryTicks:0,used:!0,priceFactors:p,sourceNationId:t.id})}return n}function Ne(){const i=Number(f?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=q(i);const t=Se(G),e=_e[t?.tier||1],a=document.getElementById("em-tier-badge");a&&(a.textContent=e.tag,a.style.color=e.color),a.style.background=e.color+"0a",a.style.border="1px solid "+e.color+"33";const n=document.getElementById("em-nation-select");if(n&&n.options.length===0){const l=x?.name||f?.nation||"—";let s=`<option value="">${y(l)} (HQ)</option>`;for(const o of Ie)o.id!==x?.id&&(s+=`<option value="${o.id}">${y(o.name)}</option>`);n.innerHTML=s}const d=document.getElementById("em-import-tag"),r=ce&&x&&ce.id!==x.id;d&&(d.style.display=r?"":"none"),Si(),ct()}function Si(){let i="";for(let t=1;t<=3;t++){const e=_e[t],a=Je(t),n=t===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";i+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${e.color}">${e.tag}</div>
            <div class="${n}">`;for(const d of a){const r=G===d.key,l=Rt(d.key).length>0;i+=`<span class="em-selector__btn${r?" active":""}${l?"":" no-listings"}"
                style="${r?"background:"+e.color+";border-color:"+e.color:""}"
                onclick="setEmType('${d.key}')">${y(d.name)}</span>`}i+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${i}</div>`}function ct(){const i=document.getElementById("em-content");if(ie=Rt(G),ie.length===0){i.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}J>=ie.length&&(J=0);let t="";for(let a=0;a<ie.length;a++){const n=ie[a],d=J===a,r=n.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",l=_t(n.condition);t+=`<div class="em-listing${d?" selected":""}" style="${d?"border-left-color:"+r:""}" onclick="setEmListing(${a})">`,t+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${y(n.seller)}</span>
                <span class="em-badge em-badge--${n.sellerType.toLowerCase()}">${n.sellerType}</span>
                ${n.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,t+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${y((n.nation||"").toUpperCase())}</span>
            ${n.distance>0?`<span class="em-listing__distance">${n.distance} nation${n.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${y(n.delivery)}</span>
        </div>`,t+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${n.condition}%;background:${l}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${l}">${n.condition}%</span>
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
        </div>`,d&&n.priceFactors&&(t+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${n.priceFactors.map(s=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${y(s.label)}</span>
                    <span class="em-breakdown__mod" style="color:${s.mod?s.mod.startsWith("-")?"var(--green)":s.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${s.mod||s.value}</span>
                </div>`).join("")}
            </div>`),t+="</div>"}const e=ie[J];if(e){const a=Se(G),n=_e[a?.tier||1],d=Math.min(e.available,4),r=e.price*X,l=(Number(f?.corp_cash_reserves)||0)>=r;t+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${y(a?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${y(e.seller)}</span>
                </div>
                <span class="em-purchase__price">${q(e.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:d},(s,o)=>o+1).map(s=>`<span class="em-qty-btn${X===s?" active":""}" style="${X===s?"background:"+n.color+";border-color:"+n.color:""}" onclick="setEmQty(${s})">${s}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${e.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${q(r)}</div>
                    ${e.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${y(e.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${n.color}" onclick="purchaseEquipment()"
                    ${l?"":"disabled"}
                    title="${l?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}i.innerHTML=t}async function Ai(i){if(!i)ce=null;else{let e=Ie.find(a=>a.id===i);if(!e)try{const{data:a}=await h.from("nations").select("*").eq("id",i).single();e=a}catch{}ce=e||null}J=0,X=1;const t=document.getElementById("em-nation-select");t&&(t.value=i||""),Ne()}function Li(i){G=i,J=0,X=1,Ne()}function qi(i){J=i,X=1,ct()}function Ni(i){X=i,ct()}let Fe=!1;async function zi(){if(Fe)return;const i=ie[J];if(!i||!f)return;const t=Se(G);if(!t)return;const e=X,a=i.price*e,n=Number(f.corp_cash_reserves)||0;if(a>n){alert("Insufficient cash reserves.");return}if(e>i.available){alert("Not enough units available.");return}const d=document.querySelector(".em-purchase-btn");d&&(d.disabled=!0,d.textContent="..."),Fe=!0;try{const r=n-a,{error:l}=await h.from("factions").update({corp_cash_reserves:r}).eq("id",f.id);if(l)throw l;const s=!i.deliveryTicks||i.deliveryTicks===0;if(s){const c=Q.find(A=>A.equipment_key===G),m=(c?.owned||0)+e,p=c?.purchase_price_avg||0,u=c?.owned||0,v=u>0?Math.round((p*u+i.price*e)/m):i.price,g=t.maintenancePerUnit*m,w=c?.condition||100,$=Math.round((w*u+i.condition*e)/m),{error:k}=await h.from("corp_equipment").upsert({faction_id:f.id,nation_id:f.nation_id,equipment_key:G,tier:t.tier,owned:m,deployed:c?.deployed||0,condition:$,maintenance_per_tick:g,purchase_price_avg:v,last_purchased_tick:z?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(k){const{error:A}=await h.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);throw A&&console.error("Cash refund failed:",A.message),k}c?(c.owned=m,c.condition=$,c.maintenance_per_tick=g):Q.push({equipment_key:G,tier:t.tier,owned:m,deployed:0,condition:$,maintenance_per_tick:g,assigned_projects:[]})}else{const c=(z?.current_tick||0)+i.deliveryTicks,{error:m}=await h.from("corp_equipment_deliveries").insert({faction_id:f.id,equipment_key:G,quantity:e,condition:i.condition,delivery_tick:c,source_nation_id:i.sourceNationId||null,seller_name:i.seller,price_paid:a});if(m){const{error:p}=await h.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);throw p&&console.error("Cash refund failed:",p.message),m}}f.corp_cash_reserves=r,pt(),Ne();const o=document.getElementById("pr-cash");o&&(o.textContent=q(r)),d&&(d.textContent=s?"PURCHASED":"ORDERED",setTimeout(()=>{d.isConnected&&(d.disabled=!1,d.textContent="PURCHASE")},1500))}catch(r){d&&(d.disabled=!1,d.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{Fe=!1}}let Bi=-1,ge=[],at=[],Ot=[];function We(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function Pi(i,t,e){if(e)return"var(--orange)";const a=i/(t||1)*100;return a>50?"var(--green)":a>25?"var(--amber)":"var(--red)"}function Ri(){const i=document.getElementById("pm-list"),t=ge.length,e=at.length,a=Ot.length,n=ge.filter(s=>s.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${t})`,document.getElementById("pm-pending-count").textContent=`(${e})`,document.getElementById("pm-apply-count").textContent=`(${a})`;const d=document.getElementById("pm-badges");let r="";n>0&&(r+=`<span class="pm-badge pm-badge--expiring">${n} EXPIRING</span>`),e>0&&(r+=`<span class="pm-badge pm-badge--pending">${e} PENDING</span>`),d.innerHTML=r;const l=ge.reduce((s,o)=>s+(o.cost||0),0)+at.reduce((s,o)=>s+(o.cost||0),0);document.getElementById("pm-total-cost").textContent=We(l),document.getElementById("pm-footer-active").textContent=t,document.getElementById("pm-footer-pending").textContent=e;{if(t===0){i.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let s="";ge.forEach((o,c)=>{const m=Bi===c,p=Pi(o.ticks_left,o.total_ticks,o.expiring_soon),u=Math.min(o.ticks_left/(o.total_ticks||1)*100,100);s+=`<div class="pm-item ${o.expiring_soon?"pm-item--expiring":""} ${m?"expanded":""}" onclick="togglePmExpand(${c})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${y(o.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${y((o.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${p}">Expires: ${y(o.expires||"")}</span>
                        <span class="pm-item__ticks">(${o.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${u}%;background:${p}"></div></div>`,m&&(s+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${y(o.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${y(o.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${We(o.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${o.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${o.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(o.projects||[]).map(v=>`<span class="pm-project-chip">${y(v)}</span>`).join("")}</div>
                    </div>`,o.note&&(s+=`<div class="pm-note"><span class="pm-note__text">${y(o.note)}</span></div>`),o.expiring_soon&&o.renewable&&(s+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${We(o.cost||0)}</button></div>`),s+="</div>"),s+="</div></div>"}),i.innerHTML=s;return}}function Oi(){ge=[],at=[],Ot=[],Ri()}let oe=[],Di=-1;function K(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function bt(i){return i>=85?"var(--gold)":i>=60?"var(--green)":i>=40?"var(--orange)":"var(--red)"}function Hi(i){return"dl-result--"+i.toLowerCase()}function xt(){const i=document.getElementById("dl-list"),t=oe.length;document.getElementById("dl-count").textContent=`${t} COMPLETED`;const e=oe.reduce((l,s)=>{const o=s.financials||{};return l+((o.payment||0)+(o.bonus||0)-(o.penalty||0)-(o.total_cost||0))},0),a=document.getElementById("dl-lifetime-profit");a.textContent=(e>=0?"+":"")+K(e),a.style.color=e>=0?"var(--green)":"var(--red)";const n={};oe.forEach(l=>{n[l.result]=(n[l.result]||0)+1});const d=document.getElementById("dl-footer-results");if(d.innerHTML=Object.entries(n).map(([l,s])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[l]||"var(--text-dim)"}">${y(l)}</div>
            <div class="dl-footer__result-count">${s}</div>
        </div>`).join(""),t===0){i.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let r="";oe.forEach((l,s)=>{const o=Di===s,c=l.financials||{},m=(c.payment||0)+(c.bonus||0)-(c.penalty||0)-(c.total_cost||0),p=m>=0,u=Hi(l.result),g={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[l.result]||"var(--text-dim)",w=l.type==="GOVERNMENT";if(r+=`<div class="dl-item ${o?"expanded":""}" onclick="toggleDlExpand(${s})">
            <div class="dl-item__inner" style="border-left:2px solid ${g}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${y(l.name)}</span>
                    <span class="dl-result-badge ${u}">${y(l.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${y(l.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${w?"var(--green)":"var(--gold)"}">${y(l.issuer)}</span>
                    <span class="dl-item__date">${y(l.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${bt(l.quality_score)}">${l.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${l.rep_change>0?"var(--green)":l.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${l.rep_change>0?"+":""}${l.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${p?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${p?"var(--green)":"var(--red)"};margin-top:2px;">${p?"+":""}${K(m)}</div>
                    </div>
                </div>`,o){const $=l.inspection||{};r+='<div style="margin-top:8px;">',r+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(S=>{const M=$[S]||{score:0,issues:[]},T=bt(M.score),I=Math.min(M.score/100*100,100);r+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${y(S.charAt(0).toUpperCase()+S.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${I}%;background:${T}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${T}">${M.score}</span>
                        </div>
                    </div>
                    ${(M.issues||[]).map(C=>`<div class="dl-inspect-issue">${y(C)}</div>`).join("")}
                </div>`});const k=$.permits||{passed:!0,issues:[]};r+=`<div class="dl-permits-row ${k.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${k.passed?"var(--green)":"var(--red)"}">${k.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(k.issues||[]).map(S=>`<div class="dl-inspect-issue dl-inspect-issue--red">${y(S)}</div>`).join("")}
            </div>`,r+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',r+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(l.materials_used||[]).forEach(S=>{const M=S.grade==="HIGH"?"var(--green)":S.grade==="STANDARD"?"var(--amber)":"var(--orange)",T=S.impact==="positive"?"▲":S.impact==="negative"?"▼":"–",I=S.impact==="positive"?"var(--green)":S.impact==="negative"?"var(--red)":"var(--text-dim)";r+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${y(S.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${M}"></div>
                    <span class="dl-mat-tag__grade" style="color:${M}">${y(S.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${I}">${T}</span>
                </div>`}),r+="</div>",r+='<div class="dl-section-label">Financial Summary</div>',r+='<div class="dl-fin-panel">',r+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${K(c.contract_value||0)}</span></div>`,(c.bonus||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${K(c.bonus)}</span></div>`),(c.penalty||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${K(c.penalty)}</span></div>`);const A=(c.payment||0)+(c.bonus||0)-(c.penalty||0);r+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${K(A)}</span></div>`,r+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${K(c.total_cost||0)}</span></div>`,r+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${p?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${p?"var(--green)":"var(--red)"}">${p?"+":""}${K(m)}</span>
            </div>`,r+="</div>";const b=l.timeline||{};r+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${b.actual||0}/${b.expected||0} ticks</span>`,b.early?r+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(b.expected||0)-(b.actual||0)} TICK${b.expected-b.actual!==1?"S":""} EARLY</span>`:!b.on_time&&b.actual>b.expected&&(r+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(b.actual||0)-(b.expected||0)} TICK${b.actual-b.expected!==1?"S":""} LATE</span>`),r+="</div>",r+="</div>"}r+="</div></div>"}),i.innerHTML=r}async function ji(){if(!f){oe=[],xt();return}const{data:i,error:t}=await h.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",f.id).order("delivered_at_tick",{ascending:!1}).limit(20);t?(console.warn("Failed to load deliveries:",t.message),oe=[]):oe=(i||[]).map(e=>{const a=e.construction_contracts||{};return{id:e.contract_id,name:a.name||"Project",type:a.issuer_type||"GOVERNMENT",issuer:a.issuer_name||"Government",delivered:"Tick "+(e.delivered_at_tick||0),result:e.result,quality_score:e.quality_score,rep_change:e.rep_change,financials:{contract_value:e.contract_value||0,bonus:e.quality_bonus||0,penalty:e.penalties||0,payment:e.payment_received||0,total_cost:e.total_cost||0},inspection:e.inspection||{},materials_used:e.materials_used||[],timeline:{expected:e.timeline_expected||0,actual:e.timeline_actual||0,on_time:e.on_time,early:e.timeline_actual<e.timeline_expected}}}),xt()}function pt(){const i=Q.reduce((l,s)=>l+(s.owned||0),0),t=Q.reduce((l,s)=>l+(s.deployed||0),0),e=Kt(Q),a=i-t;document.getElementById("eq-count").textContent=i+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${t} <span style="font-size:9px;color:var(--text-dim)">/ ${i}</span>
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
                ${q(e)}
            </div>
        </div>`;const n={};for(const l of Q)n[l.equipment_key]=l;let d="";for(let l=1;l<=3;l++){const s=_e[l],o=Je(l),c=et===l,m=o.reduce((u,v)=>u+(n[v.key]?.owned||0),0),p=o.reduce((u,v)=>u+(n[v.key]?.deployed||0),0);if(d+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${l})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${c?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${s.color}">${y(s.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${s.color};border:1px solid ${s.color}33;background:${s.color}0a">${s.tag}</span>
            </div>
            ${m>0?`<span class="eq-tier-hdr__count">${p}/${m}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,c)for(const u of o){const v=n[u.key],g=v?.owned||0,w=v?.deployed||0,$=v?.condition||0,k=u.maintenancePerUnit*g,A=g-w,b=g>0&&A===0,S=g>0&&$<65,M=_t($),T=v?.assigned_projects||[],I=T.length>0?T.map(C=>C.contract_name||"Project").join(", ").slice(0,30):g>0&&w>0?w+" project"+(w>1?"s":""):"—";d+=`<div class="eq-row${g===0?" unowned":""}">`,d+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${g===0?" dim":""}">${y(u.name)}</span>
                        ${S?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${g>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${b?"var(--orange)":"var(--green)"}">${A}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${w}/${g}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,g>0?d+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${$}%;background:${M}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${M}">${$}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${y(I)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${q(k)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:d+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',d+="</div>"}}document.getElementById("eq-list").innerHTML=d;const r=[1,2,3].map(l=>{const s=_e[l],o=Je(l).reduce((c,m)=>c+(n[m.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${o>0?s.color+"33":"var(--border-0)"};background:${o>0?s.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${s.color}">${s.tag}</div>
            <div class="eq-footer__tier-count" style="color:${o>0?"var(--text-bright)":"var(--text-dim)"}">${o}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${q(e)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function Ui(i){et=et===i?-1:i,pt()}async function Gi(){if(!f)return;const{data:i,error:t}=await h.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",f.id);t?(console.warn("Failed to load equipment:",t.message),Q=[]):Q=i||[],pt()}async function Fi(){const{data:{user:i}}=await h.auth.getUser();if(!i){window.location.href="login.html";return}const{data:t}=await h.from("factions").select("*").or(`id.eq.${i.id},linked_user_id.eq.${i.id}`);ye=(t||[]).filter(o=>o.nation_id);const e=sessionStorage.getItem("active_faction_id");if(f=ye.find(o=>o.id===e)||ye.find(o=>o.faction_type==="corporation")||ye[0],!f){await h.auth.signOut(),window.location.href="login.html";return}if(f.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[a,n]=await Promise.all([f.nation_id?h.from("nations").select("*").eq("id",f.nation_id).single():Promise.resolve({data:null}),h.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(x=a.data),n.error&&console.warn("Shard load failed:",n.error.message),z=n.data;const d=f.corp_ticker||f.abbreviation||"";if(document.getElementById("corp-logo").textContent=d.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=f.faction_name||"Unnamed Corp",z){if(document.getElementById("game-date").textContent=z.current_date||"—",document.getElementById("tick-number").textContent=z.current_tick||"—",z.next_tick_at){const c=(Number(z.tick_interval_hours)||8)*36e5,m=new Date(z.next_tick_at).getTime(),u=m-c+c/2;tt=new Date(u>Date.now()?u:m+c/2),ei()}const o=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");o&&(o.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(d?"["+d+"]":f.faction_name||"Corp")+" ▾";const r=document.getElementById("topbar-cash");if(r){const o=Number(f.corp_cash_reserves??0),c=o>=1e9?"$"+(o/1e9).toFixed(1)+"B":o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k";r.textContent="CASH: "+c}const l=f.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+l+" AP</span>",document.getElementById("nation-pill").textContent=(x?.name||f.nation||"—").toUpperCase();const s=document.getElementById("corp-faction-dropdown");if(s){let o="";for(const c of ye){const m=c.id===f.id,p=c.faction_type==="corporation"?"CORP":"PARTY",u=c.faction_type==="corporation"?"var(--teal)":"var(--amber)";o+=`<div class="corp-dd-item${m?" active":""}" onclick="switchToFaction('${c.id}', '${c.faction_type}')">
                <span class="corp-dd-type" style="color:${u}">${p}</span>
                <span class="corp-dd-name">${y(c.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${y(c.abbreviation||"—")}]</span>
            </div>`}s.innerHTML=o}await Promise.all([Lt(),qt(),ki(),Gi(),Oi(),ji()]);try{const{data:o}=await h.from("nations").select("*").order("name");Ie=o||[]}catch{Ie=[]}if(Bt(),Ne(),Qt(f,x,z),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const o=document.querySelector('[data-tab="expansion"]');o&&Ht({preventDefault:()=>{},target:o})}}async function Wi(){await h.auth.signOut(),window.location.href="login.html"}function Vi(){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.toggle("open")}function Yi(i,t){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.remove("open"),sessionStorage.setItem("active_faction_id",i),t==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",i=>{const t=document.getElementById("faction-switcher"),e=document.getElementById("corp-faction-dropdown");e&&t&&!t.contains(i.target)&&e.classList.remove("open")});document.addEventListener("keydown",i=>{i.key==="Escape"&&It()});window.doLogout=Wi;window.toggleTheme=ti;window.toggleCorpDropdown=Vi;window.switchToFaction=Yi;window.setFilter=ii;window.openContractDetail=Tt;window.closeContractDetail=It;window.placeBid=$i;window.toggleWhRow=wi;window.toggleEqTier=Ui;window.switchEmNation=Ai;window.setEmType=Li;window.setEmListing=qi;window.setEmQty=Ni;window.purchaseEquipment=zi;window.setPrMat=Ti;window.setPrTier=Ii;window.setPrQty=Ci;window.purchaseMaterial=Mi;let j={general:0,skilled:0,innovative:0},Ve=!1;const $e=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Dt(i){const t=Number(x?.minimum_wage??50),e=Number(x?.inflation??50),a=Number(x?.standard_of_living??50),n=t/100*48e3,d=1+(e-50)/100*.5,r=1+(a-50)/100*.5;return Math.round(n*i*d*r)}function _(i){const t=Math.abs(i),e=i<0?"-":"";return t>=1e9?e+"$"+(t/1e9).toFixed(2)+"B":t>=1e6?e+"$"+(t/1e6).toFixed(2)+"M":t>=1e3?e+"$"+(t/1e3).toFixed(1)+"k":e+"$"+t.toLocaleString()}async function Ht(i){i.preventDefault(),document.getElementById("operations-content").style.display="none";const t=document.getElementById("expansion-content");t.style.display="flex",t.style.justifyContent="center",t.style.gap="12px",t.style.alignItems="flex-start",t.style.flexWrap="wrap",document.querySelectorAll(".corp-nav__tab").forEach(e=>e.classList.remove("active")),i.target.classList.add("active"),ze(),Xi(),await we(),await mt(),Be(),await dn(),Pe(),Wt(),await mn(),Re()}function jt(i){i&&i.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function Ut(){return U.reduce((t,e)=>{const a=Number(e.capacity||0),n=Number(e.condition||0)/100;return t+Math.floor(a*n)},0)+500}function Qi(i,t){const e=$e.find(d=>d.id===i),a=Number(f?.[e.factionKey]??0),n=j[i]+t;if(!(a+n<0)){if(t>0){const d=$e.reduce((l,s)=>{const o=Number(f?.[s.factionKey]??0),c=s.id===i?n:j[s.id];return l+o+c},0),r=Ut();if(d>r)return}j[i]=n,ze()}}function Ki(i){i?j[i]=0:j={general:0,skilled:0,innovative:0},ze()}async function Ji(){if(Ve||!Object.values(j).some(n=>n!==0))return;let t=0;for(const n of $e){const d=j[n.id];d>0&&(t+=d*Dt(n.multiplier)*.1)}const e=Number(f?.corp_cash_reserves??0);if(t>e){alert("Insufficient cash reserves. Hiring cost: "+_(t)+", available: "+_(e));return}const a=t>0?`Confirm workforce changes?

Hiring fee: `+_(t)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){Ve=!0;try{const n={};for(const l of $e){const s=Number(f?.[l.factionKey]??0);n[l.factionKey]=Math.max(0,s+j[l.id])}t>0&&(n.corp_cash_reserves=Math.max(0,e-Math.round(t)));const{error:d}=await h.from("factions").update(n).eq("id",f.id);if(d)throw d;Object.assign(f,n),j={general:0,skilled:0,innovative:0};const r=document.getElementById("topbar-cash");if(r){const l=Number(f.corp_cash_reserves??0);r.textContent="CASH: "+(l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k")}ze()}catch(n){alert("Error: "+n.message)}finally{Ve=!1}}}function ze(){const i=document.getElementById("hf-card-container");if(!i)return;const t="'JetBrains Mono', monospace",e={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=Number(x?.minimum_wage??50),n=Number(x?.inflation??50),d=Number(x?.standard_of_living??50),r=a/100*48e3,l=(1+(n-50)/100*.5).toFixed(2),s=(1+(d-50)/100*.5).toFixed(2),o=x?.name||f?.nation||"Nation",c=Object.values(j).some(k=>k!==0),m=Ut();let p=0,u=0,v=0,g=0,w="";for(const k of $e){const A=Number(f?.[k.factionKey]??0),b=j[k.id],S=A+b,M=Dt(k.multiplier),T=b>0,I=A*M,C=S*M,D=C-I;p+=A,u+=S,v+=I,g+=C;const W=b!==0?T?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";w+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${W};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${k.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${e.text}">${k.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.text}">${A.toLocaleString()}</span>
                    ${b!==0?`<span style="font-family:${t};font-size:10px;color:${e.dim}">→</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${T?e.greenBright:e.red}">${S.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">WAGE (MIN × ${k.multiplier}.0 × ${l} × ${s})</span>
                <span style="font-family:${t};font-size:10px;color:${k.color}">${_(M)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${k.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.red};border:1px solid ${e.border};cursor:pointer;background:${e.card}">-50</div>
                <div onclick="hfSetChange('${k.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.redDim};border:1px solid ${e.border};cursor:pointer;background:${e.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${b!==0?e.card:"transparent"};border:1px solid ${b!==0?e.border:"transparent"}">
                    ${b!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${t};font-size:12px;font-weight:700;color:${T?e.greenBright:e.red}">${T?"+":""}${b}</span>
                        <span onclick="hfReset('${k.id}')" style="font-family:${t};font-size:8px;color:${e.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${t};font-size:9px;color:${e.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${k.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.greenBright};border:1px solid ${e.border};cursor:pointer;background:${e.card}">+10</div>
                <div onclick="hfSetChange('${k.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.greenBright};border:1px solid ${e.border};cursor:pointer;background:${e.card}">+50</div>
            </div>
            ${b!==0?`<div style="margin-top:6px;padding:4px 8px;background:${e.bg};border:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${D>0?e.red:e.greenBright}">${D>0?"+":""}${_(D)}/yr</span>
            </div>`:""}
        </div>`}const $=g-v;i.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${o.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1.5px;color:${e.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">MIN WAGE</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${a}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">${_(r)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${n}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">×${l}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${d}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">×${s}</div>
                    </div>
                </div>
            </div>
            ${w}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${c?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${p>=m?e.red:e.text}">${c?u.toLocaleString():p.toLocaleString()}</span>
                        <span style="font-family:${t};font-size:9px;color:${e.dim}">/ ${m.toLocaleString()}</span>
                    </div>
                    ${p>=m&&!c?`<div style="font-family:${t};font-size:7px;color:${e.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${_(v)}</span>
                        ${c?`<span style="font-family:${t};font-size:9px;color:${e.dim}">→</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${$>0?e.red:e.greenBright}">${_(g)}</span>`:""}
                    </div>
                </div>
            </div>
            ${c?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${e.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">NET CHANGE</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${$>0?e.red:e.greenBright}">${$>0?"+":""}${_($)}/yr</span>
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">(${$>0?"+":""}${_(Math.round($/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function Xi(){const i=document.getElementById("wf-summary-container");if(!i)return;const t="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},a=(x?.name||f?.nation||"Nation").toUpperCase(),n=Number(x?.minimum_wage??50),d=Number(x?.inflation??50),r=Number(x?.standard_of_living??50),l=n/100*48e3,s=1+(d-50)/100*.5,o=1+(r-50)/100*.5,c=[{label:"General Workforce",mult:2,color:e.accent,key:"corp_general_workforce",countColor:e.text},{label:"Skilled Workforce",mult:3,color:e.gold,key:"corp_skilled_workforce",countColor:e.blue},{label:"Innovative Workforce",mult:6,color:e.orange,key:"corp_innovative_workforce",countColor:e.gold}];let m=0,p=0,u="";for(const v of c){const g=Number(f?.[v.key]??0),w=Math.round(l*v.mult*s*o),$=g*w;m+=g,p+=$,u+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${e.text}">${v.label}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a}</span>
                </div>
                <span style="font-family:${t};font-size:16px;font-weight:700;color:${v.countColor}">${g.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">WAGE (MIN × ${v.mult}.0 × ${s.toFixed(2)} × ${o.toFixed(2)})</span>
                <span style="font-family:${t};font-size:10px;color:${e.muted}">${_(w)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${_($)}</span>
            </div>
        </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Workforce</span>
            </div>
            <span style="font-family:${t};font-size:12px;font-weight:700;color:${e.text}">${m.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${u}
            <div style="padding:8px 12px;background:${e.card};border-bottom:1px solid ${e.border};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1px;color:${e.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">MINIMUM WAGE (${a})</span>
                    <span style="font-family:${t};font-size:9px;color:${e.text}">${n}/100 → ${_(l)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${e.text}">×${s.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${e.text}">×${o.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL WORKFORCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.text}">${m.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL ANNUAL WAGES</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${_(p)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${_(Math.round(p/12))}</span>
            </div>
        </div>
    </div>`}let U=[];async function we(){if(!f?.id)return;const{data:i}=await h.from("corp_properties").select("*").eq("faction_id",f.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});U=i||[]}function ke(){const i=document.getElementById("property-card-container");if(!i)return;const t="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=(x?.name||f?.nation||"Nation").toUpperCase(),n=1+(Number(x?.inflation??50)-50)/100*.3;let d="",r=0,l=0;const s=x?.name||f?.nation||"Home Nation",o=5e7,c=1+(Number(x?.inflation??50)-50)/100*.3,m=.8+Number(x?.stability??50)/100*.4,p=Math.round(o*c*m),u=Math.round(p*.005);r+=p,l+=u,d+=`
    <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;font-weight:600;color:${e.text}">National Headquarters</span>
            <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:#5c5;background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">HQ</span>
        </div>
        <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px;">${s} · Headquarters</div>
        <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">CAPACITY</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">500</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">VALUE</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${_(p)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">MAINT/MO</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.red}">${_(u)}</div>
            </div>
        </div>
    </div>`;for(const v of U){const g=Me[v.style]||Me.Basic;r+=Number(v.purchase_price||0),l+=Number(v.monthly_maintenance||0),d+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${e.text}">${v.name}</span>
                <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${e.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px;">${v.city||a} · ${(v.type||"").replace(/_/g," ")} · <span style="color:${g.color}">${(v.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">CAPACITY</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${(v.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">PAID</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${_(v.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">MAINT/MO</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.red}">${_(v.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">CONDITION</span>
                <span style="font-family:${t};font-size:9px;color:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":e.orange}">${v.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${e.border};margin-top:2px;"><div style="width:${v.condition}%;height:100%;background:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":e.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${t};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${e.accent};border:1px solid ${e.accent}33;cursor:pointer;">REFURBISH (${_(Math.round((v.purchase_price||0)*.1*n))})</div>
                <div onclick="propSell('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${t};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${e.red};border:1px solid ${e.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${t};font-size:10px;color:${e.muted}">${U.length+1} ASSET${U.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${d}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.green}">${_(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${_(l)}/mo</span>
            </div>
        </div>
    </div>`}let ue=[],H=null;const Me={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function mt(){if(!f?.nation_id)return;const{data:i,error:t}=await h.from("available_properties").select("*").eq("nation_id",f.nation_id).eq("status","available").order("price",{ascending:!0});if(t){console.warn("[Property] Failed to load marketplace:",t.message);return}ue=(i||[]).map(e=>({...e,adjusted_cost:e.price,adjusted_maintenance:e.monthly_maintenance}))}function Be(){const i=document.getElementById("new-property-container");if(!i)return;const t="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(x?.name||f?.nation||"Nation").toUpperCase();const a=Number(x?.standard_of_living??50),n=Number(x?.gdp_growth??50),d=Number(x?.inflation??50),r=x?.capital||"Capital",l={capital:r,port:r+" Port",industrial:r+" Industrial Zone",suburban:r+" Suburbs",coastal:r+" Coast"};let s="";if(ue.length===0)s=`<div style="padding:20px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let o=0;o<ue.length;o++){const c=ue[o],m=H===o,p=Me[c.style]||Me.Basic,u=l[c.city_template]||r;s+=`
            <div onclick="npSelect(${o})" style="padding:8px 14px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${m?e.accent:"transparent"};background:${m?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${e.text}">${c.name}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${p.color};background:${p.color}12;border:1px solid ${p.color}25">${p.label}</span>
                </div>
                <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:5px;">${u} · ${c.type.replace(/_/g," ")}</div>
                <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">CAPACITY</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.text};margin-top:1px">${c.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">PRICE</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.gold};margin-top:1px">${_(c.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.redDim};margin-top:1px">${_(c.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${m?`<div style="margin-top:5px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:${t};font-size:7px;color:${e.dim}">CONDITION</span>
                        <span style="font-family:${t};font-size:9px;color:${c.condition>=75?e.greenBright:c.condition>=50?e.yellow:e.orange}">${c.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${c.condition}%;height:100%;background:${c.condition>=75?e.greenBright:c.condition>=50?e.yellow:e.orange}"></div></div>
                </div>`:""}
            </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">New Property</span>
            </div>
            <span style="font-family:${t};font-size:9px;color:${e.dim}">${ue.length} AVAILABLE</span>
        </div>
        <div style="padding:4px 14px;border-bottom:1px solid ${e.border};display:flex;gap:12px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">STD OF LIVING</span>
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${a>=50?e.greenBright:e.yellow}">${Math.round(a)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">GDP GROWTH</span>
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${n>=50?e.greenBright:e.yellow}">${Math.round(n)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">INFLATION</span>
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${d<=50?e.greenBright:e.red}">${Math.round(d)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${s}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold};border:1px solid ${e.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${H!==null?"#000":e.dim};background:${H!==null?e.accent:"transparent"};border:1px solid ${H!==null?e.accent:e.border};cursor:${H!==null?"pointer":"default"};opacity:${H!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function Zi(i){H=H===i?null:i,Be()}let Ye=!1;async function en(){if(H===null||Ye)return;const i=ue[H];if(!i)return;const t=Number(f?.corp_cash_reserves??0);if(i.adjusted_cost>t){alert(`Insufficient cash reserves.
Property: `+_(i.adjusted_cost)+`
Cash: `+_(t));return}if(confirm('Buy "'+i.name+'" for '+_(i.adjusted_cost)+`?

Monthly maintenance: `+_(i.adjusted_maintenance)+`/mo
Condition: `+i.condition+`%

This will be deducted from your cash reserves.`)){Ye=!0;try{const{error:e}=await h.from("corp_properties").insert({faction_id:f.id,nation_id:f.nation_id,catalog_id:i.catalog_id||null,name:i.name,type:i.type,style:i.style,capacity:i.capacity,purchase_price:i.adjusted_cost,monthly_maintenance:i.adjusted_maintenance,condition:i.condition,city:i.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(e)throw e;const a=Math.max(0,t-i.adjusted_cost),{error:n}=await h.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);if(n)throw n;f.corp_cash_reserves=a,i.id&&await h.from("available_properties").update({status:"sold",purchased_by:f.id}).eq("id",i.id);const d=document.getElementById("topbar-cash");d&&(d.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),H=null,await mt(),Be(),ke(),alert("Property purchased: "+i.name+`

Deducted: `+_(i.adjusted_cost))}catch(e){alert("Purchase failed: "+e.message)}finally{Ye=!1}}}const se={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let ft=!1,E={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Qe=!1;function Gt(){const t=1+(Number(x?.inflation??50)-50)/100*.3,e=se[E.style]?.costMod||1,a=E.type==="Warehouse"?.75:1,n=Math.round(E.size*1e5*t*e*a),d=Math.round(n*(1+E.budgetMod/100)),r=Math.round(d*.007*(se[E.style]?.maintMod||1));return{baseBudget:n,adjusted:d,maint:r,inflMod:t,styleMod:e}}function tn(){ft=!0,E={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Ft()}function ut(){ft=!1,document.getElementById("cp-modal-overlay")?.remove()}function nn(i,t){E[i]=t,Ft()}async function an(){if(!(Qe||!E.name.trim())){Qe=!0;try{const i=Gt(),t=x?.name||f?.nation||"Unknown",e=se[E.style]?.repGain||1,a=await h.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),n=a.data?.current_tick||0,d=(a.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:r}=await h.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",f.nation_id).eq("issuer_type","PRIVATE"),s=`PVT-C${(r||0)+1}-${d}`,{error:o}=await h.from("construction_contracts").insert({nation_id:f.nation_id,template_key:"custom_building",sector:"civil_engineering",name:E.name.trim(),description:`${E.type} (${E.style}) — ${E.size.toLocaleString()} employees, commissioned by ${f.faction_name}`,project_code:s,budget_ceiling:i.adjusted,timeline_ticks:E.timeline,required_materials:(()=>{const c=E.size/1e3,m=E.style,p={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[m]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(v,g)=>Math.max(1,Math.ceil(c*v*g));return{concrete:u(8,p.concrete),steel:u(6,p.steel),glass_facades:u(3,p.glass),em_systems:u(4,p.em),lumber:u(1,p.lumber),heavy_parts:u(2,p.heavy),aggregate:u(3,p.agg)}})(),required_equipment:(()=>{const c=["work_trucks","concrete_mixers"];return E.size>1e3&&c.push("excavators","tower_cranes"),E.size>3e3&&c.push("bulldozers","heavy_haulers"),E.size>8e3&&c.push("pile_drivers"),c})(),required_workforce:{general:Math.ceil(E.size*.08),skilled:Math.ceil(E.size*.03)},status:"open",generated_at_tick:n,bidding_ends_tick:n+3,issuer_type:"PRIVATE",issuer_name:f.faction_name,issuer_faction_id:f.id});if(o)throw o;ut(),alert(`Construction project submitted!

Project: `+E.name.trim()+`
Code: `+s+`
Budget: `+_(i.adjusted)+`
Expected Reputation: +`+e+`

All construction corporations in `+t+" can now bid on this project.")}catch(i){alert("Failed to submit project: "+i.message)}finally{Qe=!1}}}function Ft(){if(document.getElementById("cp-modal-overlay")?.remove(),!ft)return;const i="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},e=Gt(),a=x?.name||f?.nation||"Nation",n=se[E.style]?.repGain||1,d=n>=4?t.gold:n>=3?t.greenBright:n>=2?t.accent:t.dim,r=Object.entries(se).map(([o,c])=>{const m=E.style===o;return`<div onclick="cpSetField('style','${o}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${m?c.color+"18":"transparent"};border:1px solid ${m?c.color+"44":t.border};">
            <div style="font-family:${i};font-size:9px;font-weight:700;color:${m?c.color:t.dim}">${o}</div>
            <div style="font-family:${i};font-size:7px;color:${t.dim};margin-top:1px">×${c.costMod.toFixed(1)} cost</div>
        </div>`}).join(""),l=document.createElement("div");l.id="cp-modal-overlay",l.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",l.innerHTML=`
    <div style="width:440px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;max-height:90vh;">
        <div style="padding:10px 16px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.gold}">●</span>
                <span style="font-family:${i};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Construction Project</span>
            </div>
            <span onclick="cpClose()" style="font-family:${i};font-size:14px;color:${t.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:12px 16px;overflow:auto;flex:1;">

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Building Name</div>
                <input id="cp-name-input" value="${E.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:6px 10px;font-family:${i};font-size:11px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Type</div>
                <div style="display:flex;gap:4px;">
                    ${["Regional HQ","Office Building",...f?.corp_sector==="Construction"?["Warehouse"]:[]].map(o=>`<span onclick="cpSetField('type','${o}')" style="flex:1;text-align:center;padding:5px 0;font-family:${i};font-size:9px;font-weight:700;cursor:pointer;color:${E.type===o?"#000":t.dim};background:${E.type===o?o==="Warehouse"?t.orange:t.accent:"transparent"};border:1px solid ${E.type===o?o==="Warehouse"?t.orange:t.accent:t.border}">${o}</span>`).join("")}
                    ${f?.corp_sector==="Construction"?`<div style="font-family:${i};font-size:7px;color:${t.orange};margin-top:3px;">Construction: Warehouse available (75% cost, stores up to $20M materials)</div>`:""}
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${i};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${i};font-size:14px;font-weight:700;color:${t.text}">${E.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${E.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${t.accent};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${t.dim};margin-top:2px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">${r}</div>
                <div style="margin-top:4px;font-family:${i};font-size:8px;color:${se[E.style].color}">${se[E.style].desc}</div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${i};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase">Timeline</span>
                    <span style="font-family:${i};font-size:12px;font-weight:700;color:${t.text}">${E.timeline} months</span>
                </div>
                <input type="range" min="24" max="60" step="6" value="${E.timeline}" oninput="cpSetField('timeline',+this.value)"
                    style="width:100%;accent-color:${t.gold};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${t.dim};margin-top:2px">
                    <span>24 months</span><span>60 months</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Budget</div>
                <div style="background:${t.card};border:1px solid ${t.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border}">
                        <span style="font-family:${i};font-size:8px;color:${t.dim}">BASE (${E.size.toLocaleString()} × $100k × ${e.inflMod.toFixed(2)} × ${e.styleMod.toFixed(1)})</span>
                        <span style="font-family:${i};font-size:9px;color:${t.muted}">${_(e.baseBudget)}</span>
                    </div>
                    <div style="padding:6px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                            <span style="font-family:${i};font-size:8px;color:${t.dim}">ADJUSTMENT</span>
                            <span style="font-family:${i};font-size:10px;font-weight:700;color:${E.budgetMod>0?t.greenBright:E.budgetMod<0?t.red:t.dim}">${E.budgetMod>0?"+":""}${E.budgetMod}%</span>
                        </div>
                        <input type="range" min="-15" max="15" step="1" value="${E.budgetMod}" oninput="cpSetField('budgetMod',+this.value)"
                            style="width:100%;accent-color:${t.accent};height:4px;" />
                        <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${t.dim};margin-top:2px">
                            <span>-15% (budget cut)</span><span>+15% (quality invest)</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid ${t.border}">
                        <span style="font-family:${i};font-size:9px;font-weight:700;color:${t.text}">TOTAL BUDGET</span>
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${t.gold}">${_(e.adjusted)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0">
                        <span style="font-family:${i};font-size:8px;color:${t.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${i};font-size:9px;color:${t.redDim}">${_(e.maint)}/mo</span>
                    </div>
                </div>
            </div>

            <div style="padding:6px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);margin-bottom:8px;">
                <div style="font-family:${i};font-size:8px;color:${t.gold};margin-bottom:2px">WHAT HAPPENS NEXT</div>
                <div style="font-size:9px;color:${t.dim};line-height:1.5">
                    This project will appear as a Civil Engineering bid in the Open Contracts pool for all construction corporations with an HQ or Regional HQ in ${a}. The lowest qualified bidder wins the contract and begins construction.
                </div>
            </div>

            <div style="padding:6px 8px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:${i};font-size:9px;color:${t.accent}">EXPECTED REPUTATION GAIN</span>
                    <span style="font-family:${i};font-size:16px;font-weight:700;color:${d}">+${n}</span>
                </div>
                <div style="font-family:${i};font-size:7px;color:${t.dim};margin-top:2px">${E.style} style · ${n===5?"Maximum prestige":n>=4?"Impressive presence":n>=3?"Strong statement":n>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:10px 16px;border-top:1px solid ${t.border};background:${t.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${i};font-size:7px;color:${t.dim}">TOTAL PROJECT</div>
                <div style="font-family:${i};font-size:14px;font-weight:700;color:${t.gold}">${_(e.adjusted)}</div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="cpClose()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${t.gold};cursor:pointer;opacity:${E.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(l);const s=document.getElementById("cp-name-input");s&&s.addEventListener("input",o=>{E.name=o.target.value}),l.addEventListener("click",o=>{o.target===l&&ut()})}function on(){const i=document.getElementById("cp-name-input");if(i&&(E.name=i.value),!E.name.trim()){alert("Please enter a building name.");return}an()}window.cpClose=ut;window.cpSetField=nn;window.cpSubmitFromModal=on;window.npSelect=Zi;window.npBuyProperty=en;window.npOpenConstructionModal=tn;let ve=!1;async function sn(i){if(ve)return;const t=U.find(l=>l.id===i);if(!t)return;const e=1+(Number(x?.inflation??50)-50)/100*.3,a=Math.round((t.purchase_price||0)*.1*e),n=Number(f?.corp_cash_reserves??0);if(a>n){alert("Insufficient cash. Refurbishment costs "+_(a)+" (inflation-adjusted), you have "+_(n));return}if(t.condition>=95){alert("Property is already in excellent condition ("+t.condition+"%).");return}const d=5+Math.floor(Math.random()*21),r=Math.min(100,t.condition+d);if(confirm('Refurbish "'+t.name+`"?

Cost: `+_(a)+`
Expected improvement: +`+d+"% condition ("+t.condition+"% → "+r+"%)")){ve=!0;try{await h.from("corp_properties").update({condition:r}).eq("id",i);const l=Math.max(0,n-a);await h.from("factions").update({corp_cash_reserves:l}).eq("id",f.id),f.corp_cash_reserves=l;const s=document.getElementById("topbar-cash");s&&(s.textContent="CASH: "+(l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k")),await we(),ke(),alert("Refurbished! Condition: "+t.condition+"% → "+r+"%")}catch(l){alert("Refurbishment failed: "+l.message)}finally{ve=!1}}}async function rn(i){if(ve)return;const t=U.find(d=>d.id===i);if(!t)return;const e=1+(Number(x?.inflation??50)-50)/100*.3,a=(t.condition||50)/100,n=Math.round((t.purchase_price||0)*.6*a*e);if(confirm('Sell "'+t.name+`"?

Sale value: `+_(n)+" (60% × "+t.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){ve=!0;try{await h.from("corp_properties").update({is_active:!1}).eq("id",i);const r=Number(f?.corp_cash_reserves??0)+n;await h.from("factions").update({corp_cash_reserves:r}).eq("id",f.id),f.corp_cash_reserves=r;const s=(await h.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await h.from("available_properties").insert({nation_id:f.nation_id,catalog_id:t.catalog_id||null,name:t.name,type:t.type,style:t.style,capacity:t.capacity,price:Math.round(n*1.1),monthly_maintenance:t.monthly_maintenance,condition:t.condition,city:t.city,generated_at_tick:s,expires_at_tick:s+6,status:"available"});const o=document.getElementById("topbar-cash");o&&(o.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await we(),ke(),await mt(),Be(),alert('Sold "'+t.name+'" for '+_(n))}catch(d){alert("Sale failed: "+d.message)}finally{ve=!1}}}window.propRefurbish=sn;window.propSell=rn;let be=0;function Wt(){const i=document.getElementById("manage-subsidiaries-container");if(!i)return;const t="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a9abf",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=U.filter(s=>s.type==="regional_hq");be>=a.length&&(be=0);const n=a[be]||null;let d="";a.length===0&&(d=`<div style="padding:30px 14px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let r=0;for(let s=0;s<a.length;s++){const o=a[s],c=s===be,m=Number(o.purchase_price||0);r+=m;const p=he.find(u=>u.id===o.nation_id)?.name||o.city||"—";d+=`
        <div onclick="_mSubSelected=${s};renderManageSubsidiariesCard();" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${c?e.accent:"transparent"};background:${c?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${t};font-size:9px;font-weight:700;color:${e.gold}">${(o.name||"").split("—")[0]?.trim().split(" ").map(u=>u[0]).join("").slice(0,4)||"SUB"}</span>
            <div style="flex:1.2;">
                <div style="font-size:10px;font-weight:600;color:${e.text};line-height:1.2">${o.name}</div>
                <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:1px">${o.style||"Modern"}</div>
            </div>
            <span style="width:60px"><span style="font-family:${t};font-size:7px;padding:1px 4px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${p.toUpperCase().slice(0,8)}</span></span>
            <span style="width:50px;font-family:${t};font-size:9px;font-weight:700;color:${e.gold};text-align:right">${_(m)}</span>
            <span style="width:35px;font-family:${t};font-size:9px;font-weight:700;color:${o.condition>=75?e.greenBright:o.condition>=50?e.yellow:e.orange};text-align:right">${o.condition}%</span>
        </div>`}let l="";if(n){const s=he.find(m=>m.id===n.nation_id)?.name||n.city||"—",o=n.condition>=75?e.greenBright:n.condition>=50?e.yellow:e.orange,c=[{label:"Valuation",value:_(n.purchase_price||0),color:e.gold},{label:"Maintenance/Mo",value:_(n.monthly_maintenance||0),color:e.red},{label:"Capacity",value:(n.capacity||0).toLocaleString(),color:e.text},{label:"Condition",value:n.condition+"%",color:o},{label:"Nation",value:s,color:e.accent},{label:"Style",value:n.style||"Modern",color:e.muted}];l=`
            <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                <div style="font-size:12px;font-weight:700;color:${e.text};margin-bottom:2px">${n.name}</div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${t};font-size:7px;padding:1px 5px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${s.toUpperCase()}</span>
                    <span style="font-family:${t};font-size:7px;padding:1px 5px;color:${e.blue};background:rgba(90,154,191,0.08);border:1px solid rgba(90,154,191,0.15)">SUBSIDIARY</span>
                </div>
            </div>
            ${c.map(m=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                <span style="font-family:${t};font-size:9px;color:${e.dim};text-transform:uppercase">${m.label}</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;color:${m.color}">${m.value}</span>
            </div>`).join("")}
            <div style="padding:6px 14px;border-bottom:1px solid ${e.border};flex-shrink:0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-family:${t};font-size:7px;color:${e.dim}">CONDITION</span>
                    <span style="font-family:${t};font-size:8px;color:${o}">${n.condition}%</span>
                </div>
                <div style="width:100%;height:4px;background:${e.border}"><div style="width:${n.condition}%;height:100%;background:${o}"></div></div>
            </div>
            <div style="flex:1"></div>
            <div style="padding:6px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                <div style="font-family:${t};font-size:8px;letter-spacing:1.5px;color:${e.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
                <div style="display:flex;gap:4px;margin-bottom:4px;">
                    <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;color:${e.greenBright};border:1px solid ${e.greenDark};background:rgba(74,170,136,0.06)">INJECT CAPITAL</div>
                    <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;color:${e.gold};border:1px solid ${e.gold}44">WITHDRAW</div>
                </div>
                <div style="display:flex;gap:4px;">
                    <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;color:${e.accent};border:1px solid ${e.accent}44">MERGE</div>
                    <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;color:${e.orange};border:1px solid ${e.orange}44">SELL</div>
                    <div onclick="subDissolve('${n.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;color:${e.red};border:1px solid ${e.red}44">DISSOLVE</div>
                </div>
            </div>`}else l=`<div style="padding:30px 14px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">Select a subsidiary to manage.</div>`;i.innerHTML=`
    <div style="width:760px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Manage Subsidiaries</span>
            </div>
            <span style="font-family:${t};font-size:9px;color:${e.dim}">${a.length} ACTIVE</span>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${e.border};display:flex;flex-direction:column;">
                <div style="display:flex;padding:5px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="width:40px;font-family:${t};font-size:7px;color:${e.dim}">ABBR</span>
                    <span style="flex:1.2;font-family:${t};font-size:7px;color:${e.dim}">NAME</span>
                    <span style="width:60px;font-family:${t};font-size:7px;color:${e.dim}">NATION</span>
                    <span style="width:50px;font-family:${t};font-size:7px;color:${e.dim};text-align:right">VALUE</span>
                    <span style="width:35px;font-family:${t};font-size:7px;color:${e.dim};text-align:right">COND</span>
                </div>
                <div style="flex:1;overflow:auto;">${d}</div>
                <div style="padding:6px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;display:flex;">
                    <span style="width:40px"></span>
                    <span style="flex:1.2;font-family:${t};font-size:8px;color:${e.dim}">COMBINED</span>
                    <span style="width:60px"></span>
                    <span style="width:50px;font-family:${t};font-size:9px;font-weight:700;color:${e.text};text-align:right">${_(r)}</span>
                    <span style="width:35px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${l}
            </div>
        </div>
    </div>`}async function ln(i){const t=U.find(a=>a.id===i);if(!t)return;const e=Math.round((t.purchase_price||0)*.6*(t.condition||50)/100);if(confirm('Dissolve subsidiary "'+t.name+`"?

Assets liquidated at 60% × condition: `+_(e)+`
All operations in this nation cease.

This cannot be undone.`))try{await h.from("corp_properties").update({is_active:!1}).eq("id",i);const a=Number(f?.corp_cash_reserves??0)+e;await h.from("factions").update({corp_cash_reserves:a}).eq("id",f.id),f.corp_cash_reserves=a;const n=document.getElementById("topbar-cash");n&&(n.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),be=0,await we(),ke(),Wt(),Pe(),alert("Subsidiary dissolved. Received: "+_(e))}catch(a){alert("Failed: "+a.message)}}window.subDissolve=ln;let he=[],Z=null,Ke=!1;async function dn(){const{data:i}=await h.from("nations").select("*").order("name");he=(i||[]).filter(t=>t.id!==f?.nation_id)}function ot(i){const e=u=>Number(i[u]??50),a=e("standard_of_living"),n=e("cost_of_living"),d=e("corporate_tax"),r=e("minimum_wage"),l=e("urbanization"),s=e("union_strength"),o=e("corruption"),c=e("unemployment"),m=e("stability"),p=5e7*(1+(a-50)/100*.4)*(1+(n-50)/100*.3)*(1+(d-50)/100*.2)*(1+(r-50)/100*.15)*(1+(l-50)/100*.1)*(1+(s-50)/100*.1)*(1-(o-50)/100*.15)*(1-(c-50)/100*.1)*(1+(50-m)/100*.3);return Math.round(Math.max(1e7,p))}function cn(i){Z=Z===i?null:i,Pe()}async function pn(){if(Ke||!Z)return;const i=he.find(n=>n.id===Z);if(!i)return;if(U.find(n=>n.nation_id===i.id&&n.type==="regional_hq")){alert("You already have a subsidiary in "+i.name);return}const e=ot(i),a=Number(f?.corp_cash_reserves??0);if(e>a){alert("Insufficient cash. Entry cost: "+_(e)+", available: "+_(a));return}if(confirm("Establish subsidiary in "+i.name+`?

Entry cost: `+_(e)+`
Creates a Regional HQ (500 capacity)
Unlocks `+i.name+` for operations

Deducted from cash reserves.`)){Ke=!0;try{const d=(await h.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,r=85+Math.floor(Math.random()*16),l=Math.round(e*.005),{error:s}=await h.from("corp_properties").insert({faction_id:f.id,nation_id:i.id,name:"Regional Headquarters — "+i.name,type:"regional_hq",style:"Modern",capacity:500,purchase_price:e,monthly_maintenance:l,condition:r,city:i.capital||i.name,purchased_at_tick:d,is_active:!0});if(s)throw s;const o=Math.max(0,a-e);await h.from("factions").update({corp_cash_reserves:o}).eq("id",f.id),f.corp_cash_reserves=o;const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k")),Z=null,await we(),ke(),renderSubsidiariesCard(),Pe(),alert("Subsidiary established in "+i.name+`!

Cost: `+_(e)+`
Regional HQ created with `+r+"% condition.")}catch(n){alert("Failed: "+n.message)}finally{Ke=!1}}}function Pe(){const i=document.getElementById("create-subsidiary-container");if(!i)return;const t="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",blue:"#5a9abf",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=new Set(U.filter(s=>s.type==="regional_hq").map(s=>s.nation_id)),n=he.filter(s=>!a.has(s.id)),d=Z?n.find(s=>s.id===Z):null;let r="";for(const s of n){const o=s.id===Z,c=ot(s),m=Number(s.standard_of_living??50),p=Number(s.stability??50),u=c>6e7?e.red:c>4e7?e.orange:e.greenBright;r+=`
        <div onclick="subSelectNation('${s.id}')" style="padding:6px 12px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${o?e.blue:"transparent"};background:${o?"rgba(90,154,191,0.03)":"transparent"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;font-weight:600;color:${e.text}">${s.name}</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${u}">${_(c)}</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:2px;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">SoL <span style="color:${m>=50?e.greenBright:e.orange}">${Math.round(m)}</span></span>
                <span style="font-family:${t};font-size:7px;color:${e.dim}">STAB <span style="color:${p>=50?e.greenBright:e.red}">${Math.round(p)}</span></span>
                <span style="font-family:${t};font-size:7px;color:${e.dim}">GDP <span style="color:${e.muted}">${Math.round(Number(s.gdp_growth??50))}</span></span>
                <span style="font-family:${t};font-size:7px;color:${e.dim}">INFL <span style="color:${Number(s.inflation??50)<=50?e.greenBright:e.red}">${Math.round(Number(s.inflation??50))}</span></span>
            </div>
        </div>`}let l="";if(d){const s=ot(d),o=m=>Number(d[m]??50),c=[{label:"STD OF LIVING",val:o("standard_of_living"),weight:"×0.4",inc:!0},{label:"COST OF LIVING",val:o("cost_of_living"),weight:"×0.3",inc:!0},{label:"CORPORATE TAX",val:o("corporate_tax"),weight:"×0.2",inc:!0},{label:"MINIMUM WAGE",val:o("minimum_wage"),weight:"×0.15",inc:!0},{label:"URBANIZATION",val:o("urbanization"),weight:"×0.1",inc:!0},{label:"UNION STRENGTH",val:o("union_strength"),weight:"×0.1",inc:!0},{label:"CORRUPTION",val:o("corruption"),weight:"×0.15",inc:!1},{label:"UNEMPLOYMENT",val:o("unemployment"),weight:"×0.1",inc:!1},{label:"STABILITY",val:o("stability"),weight:"×0.3",inc:!1}];l=`<div style="padding:6px 12px;background:${e.card};border-bottom:1px solid ${e.border};">
            <div style="font-family:${t};font-size:8px;letter-spacing:1px;color:${e.dim};text-transform:uppercase;margin-bottom:4px">COST BREAKDOWN — ${d.name.toUpperCase()}</div>
            ${c.map(m=>{const p=m.inc?m.val-50:50-m.val,u=p>0?m.inc?e.red:e.greenBright:m.inc?e.greenBright:e.red;return`<div style="display:flex;justify-content:space-between;padding:1px 0;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">${m.label} (${m.weight})</span>
                    <span style="font-family:${t};font-size:8px;color:${u}">${m.val}/100 ${p>=0?"↑":"↓"} cost</span>
                </div>`}).join("")}
            <div style="display:flex;justify-content:space-between;padding:4px 0;margin-top:4px;border-top:1px solid ${e.border};">
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${e.text}">ENTRY COST</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.gold}">${_(s)}</span>
            </div>
            <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:2px;">Creates Regional HQ (500 capacity) · Unlocks ${d.name} for operations</div>
        </div>`}n.length===0&&(r=`<div style="padding:30px 20px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">Subsidiaries established in all available nations.</div>`),i.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.blue}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Create Subsidiary</span>
            </div>
            <span style="font-family:${t};font-size:9px;color:${e.dim}">${n.length} MARKET${n.length!==1?"S":""}</span>
        </div>
        ${l}
        <div style="flex:1;overflow:auto;">
            ${r}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div onclick="subCreate()" style="width:100%;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${d?"#000":e.dim};background:${d?e.blue:"transparent"};border:1px solid ${d?e.blue:e.border};cursor:${d?"pointer":"default"};opacity:${d?1:.4}">ESTABLISH SUBSIDIARY</div>
        </div>
    </div>`}window.subSelectNation=cn;window.subCreate=pn;let Te=[],re=0,V="ALL",ne="REPUTATION";async function mn(){const{data:i}=await h.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name");Te=(i||[]).map(t=>({...t,abbr:t.corp_ticker||t.abbreviation||t.faction_name?.slice(0,4).toUpperCase()||"???",status:(t.corp_company_type||"Private").toUpperCase(),isPlayer:!!t.linked_user_id,reputation:50,revenue:t.status==="PUBLIC"?Number(t.corp_cash_reserves||0)*.1:null,valuation:t.status==="PUBLIC"?Number(t.corp_cash_reserves||0)*3:null}))}function fn(i){re=i,Re()}function un(i){V=i,re=0,Re()}function vn(i){ne=i,re=0,Re()}function Re(){const i=document.getElementById("corporations-container");if(!i)return;const t="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a={PUBLIC:{color:e.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:e.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:e.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},n=[...new Set(Te.map(p=>p.nation).filter(Boolean))];let d=[...Te];V!=="ALL"&&(d=d.filter(p=>p.nation===V)),ne==="REPUTATION"?d.sort((p,u)=>(u.reputation||0)-(p.reputation||0)):ne==="REVENUE"?d.sort((p,u)=>(u.revenue||0)-(p.revenue||0)):ne==="VALUATION"&&d.sort((p,u)=>(u.valuation||0)-(p.valuation||0)),re>=d.length&&(re=0);const r=d[re]||null,l=r&&r.status==="PRIVATE",s=r&&r.status==="STATE";let o="";d.length===0&&(o=`<div style="padding:30px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No corporations found.</div>`);for(let p=0;p<d.length;p++){const u=d[p],v=p===re,g=a[u.status]||a.PRIVATE,w=u.status==="PRIVATE";o+=`
        <div onclick="corpSelect(${p})" style="display:flex;align-items:center;padding:6px 14px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${v?e.accent:"transparent"};background:${v?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:36px;font-family:${t};font-size:9px;font-weight:700;color:${e.gold}">${u.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:10px;font-weight:600;color:${e.text};line-height:1.2">${u.faction_name}</div>
                <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:1px">${u.corp_subsector||u.corp_sector||"—"}</div>
            </div>
            <span style="width:55px"><span style="font-family:${t};font-size:7px;padding:1px 4px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(u.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:50px;font-family:${t};font-size:8px;font-weight:700;color:${w?e.dim:e.muted};text-align:right">${w?"—":_(u.revenue)}</span>
            <span style="width:30px;font-family:${t};font-size:9px;font-weight:700;color:${u.reputation>=70?e.greenBright:u.reputation>=40?e.accent:e.yellow};text-align:right">${u.reputation}</span>
            <span style="width:50px;font-family:${t};font-size:8px;color:${w?e.dim:e.muted};text-align:right">${w?"—":_(u.valuation)}</span>
            <span style="width:42px;text-align:center"><span style="font-family:${t};font-size:6px;font-weight:700;padding:1px 4px;color:${g.color};background:${g.bg};border:1px solid ${g.border}">${u.status}</span></span>
        </div>`}let c="";if(r){const p=a[r.status]||a.PRIVATE,u=[{label:"Sector",value:r.corp_sector||"—",color:e.text},{label:"Subsector",value:r.corp_subsector||"—",color:e.accent},{label:"Reputation",value:r.reputation+"/100",color:r.reputation>=70?e.greenBright:r.reputation>=40?e.accent:e.yellow},{label:"Revenue",value:l?"UNDISCLOSED":_(r.revenue),color:l?e.dim:e.greenBright},{label:"Cash Reserves",value:l?"UNDISCLOSED":_(r.corp_cash_reserves||0),color:l?e.dim:e.text},{label:"Market Valuation",value:l?"UNDISCLOSED":_(r.valuation),color:l?e.dim:e.gold}];c=`
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                <span style="font-family:${t};font-size:12px;font-weight:700;color:${e.gold}">${r.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${r.faction_name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-family:${t};font-size:7px;padding:1px 5px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(r.nation||"—").toUpperCase()}</span>
                <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${p.color};background:${p.bg};border:1px solid ${p.border}">${r.status}</span>
                ${r.isPlayer?`<span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${e.blue};background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2)">PLAYER</span>`:`<span style="font-family:${t};font-size:7px;color:${e.dim}">NPC</span>`}
            </div>
        </div>
        ${u.map(v=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
            <span style="font-family:${t};font-size:9px;color:${e.dim};text-transform:uppercase">${v.label}</span>
            <span style="font-family:${t};font-size:${v.label==="Market Valuation"?12:10}px;font-weight:700;color:${v.color};${v.value==="UNDISCLOSED"?"font-style:italic;":""}">${v.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${e.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${e.border}"><div style="width:${r.reputation}%;height:100%;background:${r.reputation>=70?e.greenBright:r.reputation>=40?e.accent:e.yellow}"></div></div>
        </div>
        ${l?`<div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(200,168,50,0.03);">
            <div style="font-family:${t};font-size:8px;color:${e.gold};margin-bottom:2px">PRIVATE — FINANCIALS UNDISCLOSED</div>
            <div style="font-size:9px;color:${e.dim};line-height:1.4">Use INVESTIGATE to reveal financial data for 12 ticks.</div>
        </div>`:""}
        ${s?`<div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,136,68,0.03);">
            <div style="font-family:${t};font-size:8px;color:${e.orange};margin-bottom:2px">STATE-OWNED ENTERPRISE</div>
            <div style="font-size:9px;color:${e.dim};line-height:1.4">Government-controlled. Cannot be acquired directly. May be privatized by parliamentary vote.</div>
        </div>`:""}
        <div style="flex:1"></div>
        <div style="padding:6px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="font-family:${t};font-size:8px;letter-spacing:1.5px;color:${e.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
            <div style="display:flex;gap:4px;margin-bottom:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${l?"pointer":"default"};font-family:${t};font-size:8px;font-weight:700;color:${l?e.blue:e.dim};border:1px solid ${l?e.blue+"44":e.border};opacity:${l?1:.3}">INVESTIGATE — $500k</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${t};font-size:8px;font-weight:700;color:${e.accent};border:1px solid ${e.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${s?"not-allowed":"pointer"};font-family:${t};font-size:8px;font-weight:700;color:${s?e.dim:e.gold};border:1px solid ${s?e.border:e.gold+"44"};opacity:${s?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${s?"not-allowed":"pointer"};font-family:${t};font-size:8px;font-weight:700;color:${s?e.dim:e.orange};border:1px solid ${s?e.border:e.orange+"44"};opacity:${s?.3:1}">MERGER</div>
            </div>
            ${s?`<div style="margin-top:4px;font-family:${t};font-size:7px;color:${e.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else c=`<div style="padding:30px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">Select a corporation to view details.</div>`;const m=`
    <div style="padding:5px 14px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px;width:32px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:2px 7px;font-family:${t};font-size:7px;font-weight:700;cursor:pointer;color:${V==="ALL"?"#000":e.dim};background:${V==="ALL"?e.accent:"transparent"};border:1px solid ${V==="ALL"?e.accent:e.border}">ALL</span>
            ${n.map(p=>`<span onclick="corpFilterNation('${p}')" style="padding:2px 7px;font-family:${t};font-size:7px;font-weight:700;cursor:pointer;color:${V===p?"#000":e.dim};background:${V===p?e.accent:"transparent"};border:1px solid ${V===p?e.accent:e.border}">${p}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(p=>`<span onclick="corpSort('${p}')" style="padding:2px 7px;font-family:${t};font-size:7px;font-weight:700;cursor:pointer;color:${ne===p?"#000":e.dim};background:${ne===p?e.accent:"transparent"};border:1px solid ${ne===p?e.accent:e.border}">${p}</span>`).join("")}
        </div>
    </div>`;i.innerHTML=`
    <div style="width:760px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${t};font-size:9px;color:${e.dim}">${Te.length} IN DATABASE</span>
        </div>
        ${m}
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${e.border};display:flex;flex-direction:column;">
                <div style="display:flex;padding:4px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="width:36px;font-family:${t};font-size:7px;color:${e.dim}">ABBR</span>
                    <span style="flex:1.3;font-family:${t};font-size:7px;color:${e.dim}">CORPORATION</span>
                    <span style="width:55px;font-family:${t};font-size:7px;color:${e.dim}">NATION</span>
                    <span style="width:50px;font-family:${t};font-size:7px;color:${e.dim};text-align:right">REV</span>
                    <span style="width:30px;font-family:${t};font-size:7px;color:${e.dim};text-align:right">REP</span>
                    <span style="width:50px;font-family:${t};font-size:7px;color:${e.dim};text-align:right">VALUE</span>
                    <span style="width:42px;font-family:${t};font-size:7px;color:${e.dim};text-align:center">STATUS</span>
                </div>
                <div style="flex:1;overflow:auto;">${o}</div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${c}
            </div>
        </div>
    </div>`}window.corpSelect=fn;window.corpFilterNation=un;window.corpSort=vn;window.switchToExpansion=Ht;window.switchToOperations=jt;window.hfSetChange=Qi;window.hfReset=Ki;window.hfConfirm=Ji;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(i){this.classList.contains("active")||(i.preventDefault(),jt(i))});Fi();
