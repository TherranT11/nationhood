import{_ as T}from"./supabase-client-BXEzLDpS.js";import{e as f}from"./utils-C2W-HleY.js";import{i as Nt}from"./messaging-5qyQ6ziq.js";import{c as Bt,a as Oe,E as fe,b as $e,d as st,e as Pt,f as Ot,h as et}from"./equipment-DsuDdEne.js";const ot={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},K=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function ae(e,t,i){const n=K.find(d=>d.key===e);if(!n)return{available:!1,failedStat:"unknown_material"};const a=n.tiers[t];if(!a)return{available:!1,failedStat:"unknown_tier"};for(const d of a.requirements){const r=Number(i?.[d.stat]??0);if(r<d.min)return{available:!1,failedStat:d.stat,failedMin:d.min,nationValue:r}}return{available:!0}}function We(e,t,i){const a={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[e]?.[t];if(!a)return 0;const d=K.find(o=>o.key===e);if(!d)return a;let r=1;for(const o of d.priceDrivers){const l=Number(i?.[o]??50);o==="inflation"||o==="fuel_prices"?r*=1+(l-50)/200:r*=1-(l-50)/250}return r=Math.max(.4,Math.min(2.5,r)),Math.round(a*r)}function rt(e,t,i){const a={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[e]?.[t]||0,r=K.find(s=>s.key===e)?.priceDrivers?.[0],l=.3+(r?Number(i?.[r]??50):50)/50*.7;return Math.round(a*l)}const Fe=["LOW","STD","HIGH"],De={LOW:"Low",STD:"Standard",HIGH:"High"};let ce=[],m=null,$=null,B=null,le=[],ue={},W=[],D={},ze=-1,P="concrete",O="STD",ne=500,F=[],Re=0,H="trucks",Y=0,Q=1,Z=[],se=null,ye=[],He=null,ve=null,je="ALL",Ge="TIMELINE";function L(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function Dt(e){if(e>=12){const t=Math.floor(e/12),i=e%12;return i>0?t+"y "+i+"mo":t+"y"}return e+" ticks"}function j(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(0)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function xe(e){return e==="civil_engineering"?"CIVIL":e==="industrial"?"INDUSTRIAL":e==="mega_project"?"MEGA":e?.toUpperCase()||"—"}function lt(e){return e==="civil_engineering"?"light":e==="industrial"?"heavy":e==="mega_project"?"mega":"light"}function zt(){ve&&clearInterval(ve),ve=setInterval(()=>{if(!He)return;const e=He-Date.now();if(e<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(ve);return}const t=Math.floor(e/36e5),i=Math.floor(e%36e5/6e4),n=Math.floor(e%6e4/1e3);document.getElementById("tick-countdown").textContent=t+"h "+i+"m "+n+"s"},1e3)}function Rt(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function Ht(e,t){e==="type"&&(je=t),e==="sort"&&(Ge=t),document.querySelectorAll(`.filter-pill[data-filter="${e}"]`).forEach(i=>{i.classList.toggle("active",i.dataset.value===t)}),ct()}function dt(e){return!(!m||e.sector==="mega_project"&&m.corp_subsector!=="Megaprojects"||e.sector==="industrial"&&!["Heavy Infrastructure","Megaprojects"].includes(m.corp_subsector))}function ct(){const e=document.getElementById("oc-list");let t=[...le];if(je==="GOVERNMENT"?t=t.filter(a=>a.issuer_type==="GOVERNMENT"):je==="PRIVATE"&&(t=t.filter(a=>a.issuer_type==="PRIVATE")),Ge==="TIMELINE"&&t.sort((a,d)=>(a.timeline_ticks||0)-(d.timeline_ticks||0)),Ge==="BUDGET"&&t.sort((a,d)=>(d.budget_ceiling||0)-(a.budget_ceiling||0)),document.getElementById("oc-count").textContent=t.length+" AVAILABLE",t.length===0){e.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const i=B?.current_tick||0;let n="";for(const a of t){const d=a.issuer_type==="GOVERNMENT",r=d?"gov":"private",o=dt(a),l=o?"":" locked",s=lt(a.sector),c=xe(a.sector),p=(a.timeline_ticks||0)>18?" warn":"",u=a.bidding_ends_tick?Math.max(0,a.bidding_ends_tick-i):"?";n+=`
            <div class="oc-item${l}" data-contract-id="${a.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${f(a.name)}</span>
                    <span class="oc-item__type-badge ${r}">${d?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${r}">${f(a.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${u} tick${u!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${j(a.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${p}">${Dt(a.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${s}">${c}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${ue[a.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${j(ue[a.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${o?"yes":"no"}">${o?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${o?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openBidModal(contracts.find(x=>x.id==='${a.id}'))">${ue[a.id]?"EDIT":"VIEW"}</button>`:""}
                </div>
                ${a.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${f(a.description)}</div>`:""}
            </div>`}e.innerHTML=n,e.querySelectorAll(".oc-item:not(.locked)").forEach(a=>{a.addEventListener("click",()=>{const d=a.dataset.contractId,r=le.find(o=>o.id===d);r&&pt(r)})})}let ge=null;function pt(e){ge=e;const t=document.getElementById("cd-overlay"),i=e.contract_type==="GOVERNMENT",n=i?"gov":"private",a=($?.name||m.nation||"—").toUpperCase(),d=dt(e);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${f(a)}</span>
        <span class="cd-header__name">${f(e.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${n}">${f(e.issuer_name)}</span>
        <span class="cd-header__type-badge ${n}">${i?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");e.blueprint_svg?(r.innerHTML=e.blueprint_svg,r.style.display=""):(r.innerHTML=si(e),r.style.display="");const o=e.permits_required||[],l=e.equipment_required||[],s=e.materials_estimated||[];let c="var(--teal)";e.spec_category==="Heavy Infrastructure"&&(c="var(--orange)"),e.spec_category==="Megaproject"&&(c="var(--red)");let p=L(e.budget),u=e.timeline_months+" Months",v="";v+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${f(e.contract_number)}</span>
            </div>
            <div class="cd-issue__tags">
                ${e.project_type?`<span class="cd-tag teal">${f(e.project_type.toUpperCase())}</span>`:""}
                ${e.project_subtype?`<span class="cd-tag gold">${f(e.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,e.description&&(v+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${f(e.description)}</div>
            </div>`),v+='<div class="cd-details">',e.project_type&&(v+=X("Type",e.project_type)),e.project_subtype&&(v+=X("Sub-Type",e.project_subtype)),v+=X("Specialization",e.spec_category,c),v+=X("Total Budget",p,"var(--green)"),v+=X("Timeline",u),v+=X("Nation",$?.name||m.nation||"—"),e.region&&(v+=X("Region",e.region)),v+="</div>",o.length>0&&(v+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${o.map(h=>{const k=h.status==="approved"?"approved":"required",q=h.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${k}">
                            <span class="cd-chip__icon">${q}</span>
                            <span class="cd-chip__label">${f(h.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),l.length>0&&(v+=`
            <div class="cd-items">
                <div class="cd-section-label">Required Equipment</div>
                <div class="cd-items__list">
                    ${l.map(h=>{const k=h.owned?"owned":"missing",q=h.owned?"&#10003;":"&#10007;";return`<div class="cd-chip ${k}">
                            <span class="cd-chip__icon">${q}</span>
                            <span class="cd-chip__label">${f(h.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),s.length>0&&(v+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${s.map(h=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${f(h.name)}</span>
                        <span class="cd-mat-row__qty">${f(String(h.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=v;const _=o.filter(h=>h.status==="approved").length,g=o.length-_,x=l.filter(h=>h.owned).length,y=l.length-x;let w="";l.length>0&&(y===0?w+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':w+=`<span class="cd-footer__badge bad">${y} EQUIPMENT MISSING</span>`),o.length>0&&(g===0?w+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':w+=`<span class="cd-footer__badge warn">${g} PERMITS PENDING</span>`);const M=d,b=(m.action_points??0)>=2;document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${w}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            <button class="cd-btn primary" onclick="placeBid()" ${M&&b?"":"disabled"}
                title="${M?b?"Place a bid (2 AP)":"Need 2 AP to bid":"Not qualified for this contract"}">BID</button>
        </div>
    `,t.classList.add("open"),document.body.style.overflow="hidden"}function mt(e){e&&e.target&&e.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",ge=null)}const jt=[{key:"concrete",name:"Concrete",unit:"units"},{key:"steel",name:"Steel",unit:"units"},{key:"lumber",name:"Lumber",unit:"units"},{key:"aggregate",name:"Aggregate",unit:"units"},{key:"em_systems",name:"E&M Systems",unit:"units"},{key:"glass_facades",name:"Glass & Facades",unit:"units"},{key:"asphalt",name:"Asphalt",unit:"units"},{key:"heavy_parts",name:"Heavy Machinery Parts",unit:"units"}],Gt=[{key:"work_trucks",name:"Work Trucks",tier:1},{key:"excavators",name:"Excavators",tier:1},{key:"bulldozers",name:"Bulldozers",tier:1},{key:"concrete_mixers",name:"Concrete Mixers",tier:1},{key:"tower_cranes",name:"Tower Cranes",tier:2},{key:"heavy_haulers",name:"Heavy Haulers",tier:2},{key:"pile_drivers",name:"Pile Drivers",tier:2},{key:"asphalt_plants",name:"Asphalt Plants",tier:2}],ut={LOW:.7,STANDARD:1,HIGH:1.4},ft={LOW:35,STANDARD:65,HIGH:90},Te=15;let z=null;function Ut(e){if(!e)return;const t=e.required_materials||{},i=e.required_equipment||[],n=e.required_workforce||{},a={concrete:18e4,steel:25e4,lumber:12e4,aggregate:8e4,em_systems:32e4,glass_facades:28e4,asphalt:14e4,heavy_parts:4e5},d=jt.filter(c=>t[c.key]>0).map(c=>({...c,qty:t[c.key],basePrice:a[c.key]||2e5,grade:c.key==="aggregate"?"LOW":"STANDARD",highDisabled:!1})),r=Gt.filter(c=>i.includes(c.key)).map(c=>({...c,owned:(F||[]).some(p=>p.equipment_key===c.key&&p.quantity>0)})),o=(n.general||100)+(n.skilled||20),l=e.budget_ceiling||1e8,s=Math.round(l*.03);z={contract:e,budgetCeiling:l,materials:d,laborCount:o,laborRate:15200,estimatedTicks:e.timeline_ticks||8,equipment:r,permits:[],overhead:s,markupPct:15,competitors:[],playerRep:m?.standing||50,requiredWorkforce:n},document.getElementById("bid-title").textContent="BID ASSEMBLY",document.getElementById("bid-subtitle").textContent=(e.name||"Contract")+" — "+xe(e.sector)+" — "+(e.issuer_name||"Government"),document.getElementById("bid-overlay").classList.add("open"),document.body.style.overflow="hidden",he()}function vt(e){e&&e.target!==document.getElementById("bid-overlay")||(document.getElementById("bid-overlay").classList.remove("open"),document.body.style.overflow="",z=null)}function N(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(2)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function Wt(e,t){if(!z)return;const i=z.materials[e];t==="HIGH"&&i.highDisabled||(i.grade=t,he())}function Ft(e){z&&(z.laborCount=e,he())}function Vt(e){z&&(z.markupPct=Number(e),he())}function he(){if(!z)return;const e=z;let t=0;for(const C of e.materials)C.lineCost=Math.round(C.qty*C.basePrice*ut[C.grade]),t+=C.lineCost;const i=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),n=Math.round(e.equipment.filter(C=>C.owned).length*12e3*e.estimatedTicks);let a=0;const d=e.overhead,r=t+i+n+a+d,o=Math.round(r*e.markupPct/100),l=r+o,s=l>e.budgetCeiling,c=o,p=Math.round(e.materials.reduce((C,U)=>C+ft[U.grade],0)/e.materials.length),u=p>=80?"STRONG":p>=60?"PROMISING":p>=40?"UNCERTAIN":"POOR",v=p>=80?"var(--green)":p>=60?"var(--teal)":p>=40?"var(--orange)":"var(--red)",_=e.budgetCeiling>0?l/e.budgetCeiling:1,g=Math.max(0,Math.min(100,Math.round((1-_)*150))),x=g>=70?"STRONG":g>=40?"COMPETITIVE":g>=15?"WEAK":"UNLIKELY",y=g>=70?"var(--green)":g>=40?"var(--teal)":g>=15?"var(--orange)":"var(--red)",w=Math.round(r*(1-Te/100)),M=Math.round(r*(1+Te/100));let b="";b+='<div class="bid-section"><div class="bid-section__title">Materials</div>',e.materials.forEach((C,U)=>{const J=re=>{const At=C.grade===re,Lt=re==="HIGH"&&C.highDisabled;return`<button class="bid-grade-btn ${At?re==="LOW"?"active-low":re==="HIGH"?"active-high":"active":""} ${Lt?"disabled":""}" onclick="setBidGrade(${U},'${re}')">${re[0]}</button>`};b+=`<div class="bid-mat-row">
            <span class="bid-mat-row__name">${f(C.name)}</span>
            <span class="bid-mat-row__qty">×${C.qty}</span>
            <div class="bid-grade-btns">${J("LOW")}${J("STANDARD")}${J("HIGH")}</div>
            <span class="bid-mat-row__cost">${N(C.lineCost)}</span>
        </div>`}),b+=`<div class="bid-line-total"><span class="bid-line-total__label">MATERIALS TOTAL</span><span class="bid-line-total__value">${N(t)}</span></div></div>`;const h=(e.requiredWorkforce?.general||80)+(e.requiredWorkforce?.skilled||20),k=[Math.round(h*.8),h,Math.round(h*1.2),Math.round(h*1.4),Math.round(h*1.6)];b+='<div class="bid-section"><div class="bid-section__title">Labor</div>',b+='<div class="bid-labor-presets">',k.forEach(C=>{b+=`<button class="bid-labor-btn ${e.laborCount===C?"active":""}" onclick="setBidLabor(${C})">${C}</button>`}),b+="</div>";const q=e.requiredWorkforce||{};b+=`<div class="bid-labor-formula">Required: ${q.general||"?"} general + ${q.skilled||"?"} skilled<br>`,b+=`${e.laborCount} workers × ${N(e.laborRate)}/tick × ${e.estimatedTicks} ticks = <strong>${N(i)}</strong></div>`,b+=`<div class="bid-line-total"><span class="bid-line-total__label">LABOR TOTAL</span><span class="bid-line-total__value">${N(i)}</span></div></div>`,b+='<div class="bid-section"><div class="bid-section__title">Equipment</div>',e.equipment.forEach(C=>{const U=C.owned?"bid-equip-row__status--owned":"bid-equip-row__status--missing",J=C.owned?"✓ OWNED":"✗ NOT OWNED";b+=`<div class="bid-equip-row"><span class="bid-equip-row__name">${f(C.name)}</span><span class="bid-equip-row__status ${U}">${J}</span></div>`}),b+=`<div class="bid-line-total"><span class="bid-line-total__label">MAINTENANCE (${e.estimatedTicks}t)</span><span class="bid-line-total__value">${N(n)}</span></div></div>`,b+='<div class="bid-section"><div class="bid-section__title">Permits</div>',b+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:8px 0;">No permits required yet.</div>',b+='<div class="bid-line-total"><span class="bid-line-total__label">PERMITS TOTAL</span><span class="bid-line-total__value">$0</span></div></div>',b+='<div class="bid-section"><div class="bid-section__title">Overhead &amp; Contingency</div>',b+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Site management, insurance, admin</div>',b+=`<div class="bid-line-total"><span class="bid-line-total__label">OVERHEAD</span><span class="bid-line-total__value">${N(d)}</span></div></div>`,document.getElementById("bid-left").innerHTML=b;let I="";I+='<div class="bid-section"><div class="bid-section__title">Cost Summary</div>',I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Materials</span><span class="bid-summary-row__value">${N(t)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Labor</span><span class="bid-summary-row__value">${N(i)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Equipment Maint.</span><span class="bid-summary-row__value">${N(n)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Permits</span><span class="bid-summary-row__value">${N(a)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Overhead</span><span class="bid-summary-row__value">${N(d)}</span></div>`,I+=`<div class="bid-cost-total"><span class="bid-cost-total__label">ESTIMATED COST</span><span class="bid-cost-total__value">${N(r)}</span></div>`,I+=`<div class="bid-accuracy">⚠ Estimate accuracy: ±${Te}%<br>Actual cost range: ${N(w)} — ${N(M)}</div>`,I+="</div>",I+='<div class="bid-section"><div class="bid-section__title">Markup</div>',I+=`<div class="bid-slider-wrap">
        <div class="bid-slider-label"><span class="bid-slider-label__pct">${e.markupPct}%</span><span style="color:var(--text-dim)">${N(o)}</span></div>
        <input type="range" class="bid-slider" min="0" max="40" value="${e.markupPct}" oninput="setBidMarkup(this.value)">
    </div></div>`,I+=`<div class="bid-price-hero ${s?"bid-price-hero--over":""}">
        <div class="bid-price-hero__label">YOUR BID PRICE</div>
        <div class="bid-price-hero__value">${N(l)}</div>
        ${s?'<div class="bid-price-hero__warning">EXCEEDS BUDGET CEILING ('+N(e.budgetCeiling)+")</div>":""}
    </div>`,I+=`<div class="bid-profit"><span class="bid-profit__label">PROJECTED PROFIT</span><span class="bid-profit__value">+${N(c)}</span></div>`,I+=`<div class="bid-compete">
        <div style="display:flex;justify-content:space-between;"><span class="bid-compete__label" style="color:${y}">${x}</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Competitiveness</span></div>
        <div class="bid-compete__bar-wrap"><div class="bid-compete__bar" style="width:${g}%;background:${y}"></div></div>
    </div>`,I+=`<div class="bid-quality">
        <div style="display:flex;justify-content:space-between;"><span class="bid-quality__label" style="color:${v}">${u} (${p}/100)</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Quality Estimate</span></div>
        <div class="bid-quality__bar-wrap"><div class="bid-quality__bar" style="width:${p}%;background:${v}"></div></div>
    </div>`,I+='<div class="bid-section" style="margin-top:8px;"><div class="bid-section__title">Competing Bids</div>',e.competitors.forEach(C=>{I+=`<div class="bid-competitor"><span class="bid-competitor__name">${f(C.name)}</span><span class="bid-competitor__rep">Rep ${C.rep}</span></div>`}),I+=`<div class="bid-competitor" style="color:var(--gold);"><span class="bid-competitor__name">You</span><span class="bid-competitor__rep">Rep ${e.playerRep}</span></div>`,I+="</div>",document.getElementById("bid-right").innerHTML=I,document.getElementById("bid-footer-price").textContent=N(l),document.getElementById("bid-footer-price").style.color=s?"var(--red)":"var(--gold)",document.getElementById("bid-footer-profit").textContent="+"+N(c),document.getElementById("bid-footer-quality").textContent=p+"/100",document.getElementById("bid-footer-quality").style.color=v,document.getElementById("bid-submit-btn").disabled=s}window.openBidModal=Ut;window.closeBidModal=vt;window.setBidGrade=Wt;window.setBidLabor=Ft;window.setBidMarkup=Vt;let Ie=!1;async function Yt(){if(!z||!m||Ie)return;const e=z,t=e.contract;let i=0;const n={};for(const p of e.materials)i+=Math.round(p.qty*p.basePrice*ut[p.grade]),n[p.key]=p.grade;const a=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),d=Math.round(e.equipment.filter(p=>p.owned).length*12e3*e.estimatedTicks),r=i+a+d+e.overhead,o=Math.round(r*e.markupPct/100),l=r+o,s=Math.round(e.materials.reduce((p,u)=>p+ft[u.grade],0)/(e.materials.length||1));if(l>e.budgetCeiling){alert("Bid exceeds budget ceiling. Lower your costs or markup.");return}const c=document.getElementById("bid-submit-btn");c.disabled=!0,c.textContent="SUBMITTING...",Ie=!0;try{const{data:p}=await T.from("shard").select("current_tick").eq("name","Alpha Shard").single(),u=p?.current_tick||0,{data:v}=await T.from("contract_bids").select("id").eq("contract_id",t.id).eq("faction_id",m.id).maybeSingle();if(v){const{error:g}=await T.from("contract_bids").update({bid_price:l,material_grades:n,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:r,estimated_quality:s,submitted_at_tick:u}).eq("id",v.id);if(g)throw g}else{const{error:g}=await T.from("contract_bids").insert({contract_id:t.id,faction_id:m.id,bid_price:l,material_grades:n,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:r,estimated_quality:s,status:"pending",submitted_at_tick:u});if(g)throw g}vt();const _=document.getElementById("oc-count");if(_){const g=_.textContent;_.textContent="✓ BID SUBMITTED",_.style.color="var(--green)",setTimeout(()=>{_.textContent=g,_.style.color=""},2e3)}await gt()}catch(p){console.error("Bid submission failed:",p),alert("Failed to submit bid: "+(p.message||"Unknown error")),c.disabled=!1,c.textContent="SUBMIT BID"}finally{Ie=!1}}window.submitBid=Yt;const ee=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],tt={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},it={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let A=null;function Qt(e){const t=W.find(q=>q.id===e);if(!t)return;const i=Array.isArray(t.contract_bids)?t.contract_bids[0]:t.contract_bids,n=B?.current_tick||0,a=t.awarded_at_tick||n,d=t.timeline_ticks||8,r=Math.max(0,n-a),o=Math.min(100,r/d*100);let l=Math.min(ee.length-1,Math.floor(o/(100/ee.length)));const s=Math.round(o%(100/ee.length)/(100/ee.length)*100),c=t.required_materials||{},p=i?.material_grades||{},u=Object.entries(c).map(([q,I])=>{const C=p[q]||"STANDARD",U=Math.round(I*(o/100)*(.6+Math.random()*.4));return{key:q,name:q.replace(/_/g," ").replace(/\b\w/g,J=>J.toUpperCase()),grade:C,allocated:I,used:Math.min(U,I)}}),_=(t.required_equipment||[]).map(q=>({key:q,name:q.replace(/_/g," ").replace(/\b\w/g,I=>I.toUpperCase()),qty:1+Math.floor(Math.random()*3),condition:55+Math.floor(Math.random()*40)})),g=t.budget_ceiling||0,x=i?.estimated_cost||0,y=Math.round(x*Math.min(1,r/d)),w=i?.estimated_quality||65,M=w>=80?"STRONG":w>=60?"PROMISING":w>=40?"FAIR":"UNCERTAIN",b=t.required_workforce||{},h=(b.general||0)+(b.skilled||0),k=i?.labor_count||h;A={project:t,bid:i,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:n,awardedTick:a,totalTicks:d,ticksElapsed:r,phaseIdx:l,phaseProgress:s,materials:u,equipment:_,budget:g,estCost:x,spent:y,quality:w,qualityLabel:M,laborCount:k,wfNeeded:h,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",yt(t.id).then(()=>oe()),oe()}function Kt(e){e&&e.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",A=null)}function Jt(e){A&&(A.tab=e,A.expandedEvent=-1,A.selectedResponse=null,oe())}function Xt(e){A&&(A.expandedEvent=A.expandedEvent===e?-1:e,A.selectedResponse=null,oe())}function Zt(e){A&&(A.selectedResponse=A.selectedResponse===e?null:e,oe())}function oe(){if(!A)return;const e=A,t=e.project,i=t.issuer_type==="GOVERNMENT",n=xe(t.sector),a=m?.nation||"Nation",d=e.awardedTick+e.totalTicks,r=Math.max(0,d-e.currentTick),o=e.currentTick>d,l=e.budget>0?Math.round(e.spent/e.budget*100):0,s=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",c=e.budget-e.spent,p=e.events.filter(x=>x.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${f(a.toUpperCase())}</span>
                <span class="pm-hdr__name">${f(t.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${f(t.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${i?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${f(t.template_key||t.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${f(n.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${f((t.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let u='<div class="pm-phase__bar">';for(let x=0;x<ee.length;x++){const y=x<e.phaseIdx,w=x===e.phaseIdx;u+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${y?"done":w?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${y?"done":w?"active":""}">${ee[x]}</span>
        </div>`}u+="</div>",u+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${ee[e.phaseIdx]} — ${e.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${o?"var(--red)":"var(--text-secondary)"}">Tick ${e.ticksElapsed} / ${e.totalTicks}${o?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=u;const v=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:p},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=v.map(x=>`<button class="pm-tab${e.tab===x.id?" active":""}" onclick="pmSetTab('${x.id}')">
            ${x.label}${x.badge>0?`<span class="pm-tab__badge">${x.badge}</span>`:""}
        </button>`).join("");let _="";e.tab==="overview"?_=ei(e,t,s,l,c,r,o):e.tab==="events"?_=ti(e):e.tab==="materials"?_=ii(e):e.tab==="equipment"&&(_=ai(e)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${_}</div>`;let g="";p>0&&(g+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${p} EVENT${p>1?"S":""} REQUIRES RESPONSE</span>`),g+=`<span class="pm-ftr__badge" style="color:${e.quality>=70?"var(--green)":e.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${e.quality}/100 — ${e.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${g}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function ei(e,t,i,n,a,d,r){const o=Ce(e.awardedTick+e.totalTicks);Ce(e.awardedTick+e.totalTicks);const l=Ce(e.awardedTick),s=[{label:"Budget",value:j(e.budget),sub:`${n}% spent`,color:i},{label:"Spent",value:j(e.spent),color:"var(--red)"},{label:"Remaining",value:j(a),color:"var(--green)"},{label:"Quality",value:`${e.quality}/100`,sub:e.qualityLabel,color:e.quality>=70?"var(--green)":e.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${e.laborCount}/${e.wfNeeded}`,sub:`Bid: ${e.laborCount}`,color:e.laborCount<e.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${d} ticks`,sub:r?"OVERDUE":`Deadline: ${o}`,color:r?"var(--red)":"var(--text-bright)"}];let c="";c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${f(t.description||t.name)}</div>
    </div></div>`,c+='<div class="pm-metrics">';for(const u of s)c+=`<div class="pm-metric">
            <div class="pm-metric__label">${u.label}</div>
            <div class="pm-metric__value" style="color:${u.color}">${u.value}</div>
            ${u.sub?`<div class="pm-metric__sub">${f(u.sub)}</div>`:""}
        </div>`;c+="</div>",c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${o}</span></span>
        </div>
    </div></div>`;const p=[];if((t.sector==="civil_engineering"||t.sector==="industrial"||t.sector==="mega_project")&&(p.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),p.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),t.sector!=="civil_engineering"&&p.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),p.length>0){c+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const u of p)c+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${f(u.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;c+="</div></div>"}return c}function ti(e){if(e.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let t="";for(let i=0;i<e.events.length;i++){const n=e.events[i],a=e.expandedEvent===i,d=n.status==="ACTIVE",r=tt[n.type]||tt.WEATHER,o=it[n.severity]||it.LOW;if(t+=`<div class="pm-evt ${d?"pm-evt--active":"pm-evt--resolved"}" style="${d?`border-left-color:${r.color}`:""}">`,t+=`<div class="pm-evt__header" onclick="pmToggleEvent(${i})" style="${a?`background:${r.bg}`:""}">`,t+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${n.type}</span>
            <span class="pm-evt__sev-badge" style="color:${o}">${n.severity}</span>
            <span class="pm-evt__status" style="color:${d?"var(--red)":"var(--text-dim)"};font-weight:${d?"700":"400"}">${d?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,t+=`<div class="pm-evt__title">${f(n.title)}</div>`,t+=`<div class="pm-evt__meta">Tick ${n.tick} · ${f(n.id||"")}</div>`,a){if(t+='<div class="pm-evt__body">',t+=`<div class="pm-evt__desc">${f(n.desc)}</div>`,n.impact&&(t+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${f(n.impact)}</span>
                </div>`),d&&n.responses&&n.responses.length>0){t+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<n.responses.length;l++){const s=n.responses[l],c=e.selectedResponse===l,u={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[s.tag]||"var(--text-secondary)";t+=`<div class="pm-resp${c?" selected":""}" style="${c?`border-color:${u}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,t+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${f(s.label)}</span>
                            <span class="pm-resp__tag" style="color:${u};background:${u}12;border:1px solid ${u}25">${s.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${s.delay>0?"var(--orange)":"var(--green)"}">
                            ${s.delay>0?`+${s.delay} tick${s.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,t+=`<div class="pm-resp__detail">${f(s.detail)}</div>`,t+='<div class="pm-resp__costs">',s.cost&&(t+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${j(s.cost)}</span>`),s.qualityImpact&&s.qualityImpact!==0&&(t+=`<span class="pm-resp__cost" style="color:${s.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${s.qualityImpact>0?"+":""}${s.qualityImpact}</span>`),!s.cost&&(!s.qualityImpact||s.qualityImpact===0)&&(t+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),t+="</div>",c&&(t+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${u}" onclick="event.stopPropagation();confirmEventResponse('${n.id}','${s.key}')">CONFIRM</button>
                        </div>`),t+="</div>"}}!d&&n.resolution&&(t+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${f(n.resolution)}</div>
                </div>`),t+="</div>"}t+="</div></div>"}return t}function ii(e){if(e.materials.length===0)return'<div class="pm-evt-empty">No materials allocated to this project.</div>';let t='<div class="pm-tab-header">Allocated Materials</div>';for(const i of e.materials){const n=i.allocated>0?Math.round(i.used/i.allocated*100):0,a=i.grade==="HIGH"?"high":i.grade==="LOW"?"low":"std",d=i.grade==="HIGH"?"var(--green)":i.grade==="LOW"?"var(--orange)":"var(--amber)";t+=`<div class="pm-mat">
            <div class="pm-mat__row1">
                <div class="pm-mat__left">
                    <span class="pm-mat__name">${f(i.name)}</span>
                    <div class="pm-mat__grade-dot pm-mat__grade-dot--${a}"></div>
                    <span class="pm-mat__grade" style="color:${d}">${i.grade}</span>
                </div>
                <span class="pm-mat__qty">${i.used.toLocaleString()} / ${i.allocated.toLocaleString()}</span>
            </div>
            <div class="pm-mat__bar-row">
                <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${n}%"></div></div>
                <span class="pm-mat__pct">${n}% consumed</span>
            </div>
        </div>`}return t}function ai(e){if(e.equipment.length===0)return'<div class="pm-evt-empty">No equipment deployed to this project.</div>';let t='<div class="pm-tab-header">Deployed Equipment</div>';for(const i of e.equipment){const n=i.condition>=75?"var(--green)":i.condition>=50?"var(--amber)":i.condition>=25?"var(--orange)":"var(--red)",a=i.condition<60;t+=`<div class="pm-eq">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${f(i.name)}</span>
                    <span class="pm-eq__qty">×${i.qty}</span>
                    ${a?'<span class="pm-eq__wear">WEAR</span>':""}
                </div>
            </div>
            <div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${i.condition}%;background:${n}"></div></div>
                <span class="pm-eq__cond-val" style="color:${n}">${i.condition}%</span>
            </div>
        </div>`}return t}function Ce(e){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]}, ${2e3+Math.floor(e/12)}`}window.openProjectModal=Qt;window.closeProjectModal=Kt;window.pmSetTab=Jt;window.pmToggleEvent=Xt;window.pmSelectResponse=Zt;async function yt(e){if(!A)return;const{data:t,error:i}=await T.from("construction_events").select("*").eq("contract_id",e).order("fired_at_tick",{ascending:!1});i?(console.warn("Failed to load project events:",i.message),A.events=[]):A.events=(t||[]).map(n=>({id:n.id,type:n.type,severity:n.severity,tick:n.fired_at_tick,title:n.title,desc:n.description,impact:n.impact,status:n.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:n.resolution,responses:n.responses||[]})),oe()}let Me=!1;async function ni(e,t){if(!(Me||!A)){Me=!0;try{const{data:i,error:n}=await T.rpc("resolve_construction_event",{p_event_id:e,p_response_key:t});if(n){console.error("Failed to resolve event:",n.message),alert("Failed to submit response: "+n.message);return}const a=typeof i=="string"?JSON.parse(i):i;if(a?.error){alert("Error: "+a.error);return}await yt(A.project.id),await _t(),a?.quality_applied&&a.quality_applied!==0&&(A.quality=Math.max(0,Math.min(100,A.quality+a.quality_applied)),A.qualityLabel=A.quality>=80?"STRONG":A.quality>=60?"PROMISING":A.quality>=40?"FAIR":"UNCERTAIN"),oe()}finally{Me=!1}}}window.confirmEventResponse=ni;function X(e,t,i){const n=i?` style="color:${i}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${f(e)}</span>
        <span class="cd-detail-row__value"${n}>${f(t)}</span>
    </div>`}function si(e){const t={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},i=e.drawing_number||e.contract_number+"-A1",n=B?.current_date||"",a=n?n.replace(/,\s*/," "):"",d=e.spec_category==="Heavy Infrastructure",r=e.spec_category==="Megaproject";let o=f(e.project_subtype||e.project_type||"STRUCTURE"),l=d?"80.0m":r?"200.0m":"60.0m",s=d?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${t.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(c,p)=>`<line x1="${p*20}" y1="0" x2="${p*20}" y2="200" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(c,p)=>`<line x1="0" y1="${p*20}" x2="680" y2="${p*20}" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${t.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${t.accent}" font-family="var(--font-mono)" font-weight="700">${o.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${t.text}" font-family="var(--font-mono)">${f(e.name)}</text>

        <!-- Internal divisions -->
        <line x1="200" y1="30" x2="200" y2="150" stroke="${t.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="340" y1="30" x2="340" y2="150" stroke="${t.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="480" y1="30" x2="480" y2="150" stroke="${t.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="60" y1="90" x2="620" y2="90" stroke="${t.line}" stroke-width="0.4" stroke-dasharray="4,2"/>

        <!-- Dimension: top -->
        <line x1="60" y1="20" x2="620" y2="20" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="60" y1="17" x2="60" y2="23" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="620" y1="17" x2="620" y2="23" stroke="${t.dim}" stroke-width="0.5"/>
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)">${l}</text>

        <!-- Dimension: right -->
        <line x1="630" y1="30" x2="630" y2="150" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="627" y1="30" x2="633" y2="30" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="627" y1="150" x2="633" y2="150" stroke="${t.dim}" stroke-width="0.5"/>
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${s}</text>

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
        <text x="540" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${f(i)}</text>
        <text x="500" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${f(a)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${t.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${t.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${t.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}let Se=!1;async function oi(){if(Se||!ge||!m)return;if((m.action_points??0)<2){alert("You need at least 2 AP to place a bid.");return}Se=!0;const e=document.querySelector(".cd-btn.primary");e&&(e.disabled=!0,e.textContent="...");try{const{data:t,error:i}=await T.rpc("deduct_ap",{p_faction_id:m.id,p_cost:2});if(i)throw i;if(t<0){const a=-t-1;m.action_points=a,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+a+" AP</span>",e&&(e.disabled=!1,e.textContent="BID"),alert("Insufficient AP. You have "+a+" AP, need 2.");return}const{error:n}=await T.from("corp_contract_bids").insert({contract_id:ge.id,faction_id:m.id,nation_id:m.nation_id,ap_spent:2,created_at_tick:B?.current_tick||null});if(n)throw await T.rpc("deduct_ap",{p_faction_id:m.id,p_cost:-2}),m.action_points=t+2,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+(t+2)+" AP</span>",n;m.action_points=t,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+t+" AP</span>",e&&(e.textContent="BID PLACED")}catch(t){e&&(e.disabled=!1,e.textContent="BID"),t.code==="23505"?alert("You have already placed a bid on this contract."):alert("Failed to place bid: "+(t.message||"Unknown error"))}finally{Se=!1}}async function gt(){if(!m||!m.nation_id)return;const{data:e,error:t}=await T.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(t?(console.warn("Failed to load contracts:",t.message),le=[]):le=e||[],ue={},m&&le.length>0){const i=le.map(a=>a.id),{data:n}=await T.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",m.id).in("contract_id",i);for(const a of n||[])ue[a.contract_id]=a}ct()}function ri(){const e=document.getElementById("ap-list"),t=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=W.length+" ACTIVE",W.length===0){e.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,t.style.display="none";return}const i=B?.current_tick||0;let n=0,a=0,d="";for(const r of W){const o=r.issuer_type==="GOVERNMENT",l=o?"gov":"private",s=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,c=s?.bid_price||0,p=s?.estimated_cost||0,u=s?.estimated_quality||0,v=r.budget_ceiling||0,_=r.awarded_at_tick||i,g=_+(r.timeline_ticks||8),x=Math.max(0,g-i),y=Math.max(0,i-_),w=r.timeline_ticks||8,M=Math.min(100,Math.round(y/w*100)),b=i>g;lt(r.sector);const h=xe(r.sector);n+=v,a+=c,d+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${f(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${f(r.issuer_name||"—")} · ${h}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${o?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS</span>
                    <span class="ap-budget__values" style="color:${b?"var(--red)":"var(--teal)"}">
                        ${y}/${w} ticks ${b?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${M}%;background:${b?"var(--red)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${j(c)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${j(p)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${u>=70?"var(--green)":u>=40?"var(--teal)":"var(--orange)"}">${u}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${b?"var(--red)":"var(--text-bright)"}">${x} ticks</div>
                </div>
            </div>
        </div>`}e.innerHTML=d,t.style.display=W.length>0?"":"none",W.length>0&&(document.getElementById("ap-total-crew").textContent=W.length,document.getElementById("ap-total-budget").textContent=j(n),document.getElementById("ap-total-spent").textContent=j(a))}async function _t(){if(!m)return;const{data:e,error:t}=await T.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",m.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",m.id).order("awarded_at_tick",{ascending:!0});t?(console.warn("Failed to load active projects:",t.message),W=[]):W=e||[],ri()}const bt=3e4;function $t(){let e=0,t=0;for(const i of K)for(const n of Fe){const a=D[i.key]?.[n];a&&(e+=a.qty,t+=a.value)}return{totalUnits:e,totalValue:t}}function Ve(){const e=document.getElementById("wh-list"),{totalUnits:t,totalValue:i}=$t();document.getElementById("wh-count").textContent=t.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=L(i);const n=Math.round(t/bt*100),a=document.getElementById("wh-capacity");a.textContent=n+"%",a.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)";let d="";for(let r=0;r<K.length;r++){const o=K[r],l=ze===r,s=D[o.key]?.LOW||{qty:0,value:0},c=D[o.key]?.STD||{qty:0,value:0},p=D[o.key]?.HIGH||{qty:0,value:0},u=s.qty+c.qty+p.qty,v=s.value+c.value+p.value,_=u===0,g=ae(o.key,"LOW",$),x=ae(o.key,"STD",$),y=ae(o.key,"HIGH",$),w=s.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",M=c.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",b=y.available?p.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(d+='<div class="wh-row">',d+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${_?" empty":""}">${f(o.name)}</span>
            <div class="wh-row__dots">
                <div class="${w}"></div>
                <div class="${M}"></div>
                <div class="${b}"></div>
            </div>
            <span class="wh-row__qty${_?" empty":""}">${u>0?u.toLocaleString():"—"}</span>
            <span class="wh-row__val${_?" empty":""}">${v>0?L(v):"—"}</span>
        </div>`,l){d+='<div class="wh-expand">',d+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const h=[{key:"LOW",label:"Low",data:s,avail:g,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:c,avail:x,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:p,avail:y,color:"var(--green)",dotClass:"wh-dot--high"}];for(const k of h){const q=!k.avail.available,I=k.data.qty>0,C=I?"$"+Math.round(k.data.value/k.data.qty):"—";d+=`<div class="wh-grade${q?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${k.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${q?"var(--red)":k.color}">${k.label}</span>
                        ${q?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${I?"var(--text-bright)":"var(--text-dim)"}">${I?k.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${k.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${k.data.value>0?L(k.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${C}</span>
                </div>`}for(const k of h)!k.avail.available&&k.avail.failedStat&&(d+=`<div class="wh-lock">
                        <span class="wh-lock__text">${k.label.toUpperCase()} GRADE LOCKED — ${f(k.avail.failedStat)} &lt; ${k.avail.failedMin}</span>
                    </div>`);d+="</div>"}d+="</div>"}e.innerHTML=d}function li(e){ze=ze===e?-1:e,Ve()}async function di(){if(!m)return;const{data:e,error:t}=await T.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",m.id);if(D={},t)console.warn("Failed to load warehouse:",t.message);else if(e)for(const i of e)D[i.material_key]||(D[i.material_key]={}),D[i.material_key][i.quality_tier]={qty:i.quantity||0,value:Number(i.total_value)||0};Ve()}const ci={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function xt(){const e=($?.name||m?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+e;const t=Number(m?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=L(t);const{totalUnits:i}=$t(),n=Math.round(i/bt*100),a=document.getElementById("pr-wh-capacity");a.textContent=n+"%",a.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)",ht(),Ye(),we()}function ht(){const e=document.getElementById("pr-mat-grid");let t="";for(const i of K){const n=P===i.key,a=Fe.every(r=>!ae(i.key,r,$).available),d="pr-mat-btn"+(n?" active":"")+(a?" all-locked":"");t+=`<span class="${d}" onclick="setPrMat('${i.key}')">${f(i.name)}</span>`}e.innerHTML=t}function Ye(){const e=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const i of Fe){const n=ae(P,i,$),a=O===i,d=n.available?We(P,i,$):null,r=ot[i],o=!n.available,l="pr-tier-btn"+(a?" active":"")+(o?" locked":"");t+=`<div class="${l}" onclick="${o?"":`setPrTier('${i}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${a?"var(--text-bright)":"var(--text-dim)"}">${De[i]}</span>
            </div>
            ${d!==null?`<div class="pr-tier-btn__price" style="color:${a?"var(--text-bright)":"var(--text-muted)"}">$${d}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}e.innerHTML=t}function we(){const e=document.getElementById("pr-content"),t=ae(P,O,$),i=K.find(y=>y.key===P);if(!i)return;if(!t.available){e.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${f(i.name)} — ${De[O]} grade
                    is not produced domestically in ${f($?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${f(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const n=We(P,O,$),a=rt(P,O,$),d=n*ne,r=a>3e3?"LOW":a>1e3?"MODERATE":"HIGH",o=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",l=Number($?.inflation??50),s=l>55?"up":l<45?"down":"flat",c=s==="up"?"&#9650;":s==="down"?"&#9660;":"&#8212;",p=s==="up"?"var(--red)":s==="down"?"var(--green)":"var(--text-dim)";let u="";u+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${n}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${p}">${c}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${a.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${o};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,u+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${f($?.name||"—")})</div>`;for(const y of i.priceDrivers){const w=Number($?.[y]??50),M=w>=50?"var(--green)":w>=30?"var(--amber)":w>=15?"var(--orange)":"var(--red)",b=ci[y]||y;u+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${f(y)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${w}%;background:${M}"></div>
            </div>
            <span class="pr-driver-row__val">${w}</span>
            <span class="pr-driver-row__effect">${f(b)}</span>
        </div>`}u+="</div>";const _=(Number(m?.corp_cash_reserves)||0)>=d,g=ne>a,x=ot[O];u+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${f(i.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${x};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${x}">${De[O]}</span>
                </div>
                <span class="pr-order__mat-price">$${n}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(y=>`<span class="pr-qty-btn${ne===y?" active":""}" onclick="setPrQty(${y})">${y>=1e3?y/1e3+"k":y}</span>`).join("")}
                </div>
            </div>
            ${g?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${a.toLocaleString()} this tick</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${L(d)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${_&&!g?"":"disabled"}
                    title="${_?g?"Exceeds supply":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,e.innerHTML=u}function pi(e){P=e,O="STD";for(const t of["STD","HIGH","LOW"])if(ae(e,t,$).available){O=t;break}ht(),Ye(),we()}function mi(e){O=e,Ye(),we()}function ui(e){ne=e,we()}let qe=!1;async function fi(){if(qe||!m||!$)return;const e=We(P,O,$),t=rt(P,O,$),i=e*ne,n=Number(m.corp_cash_reserves)||0;if(i>n){alert("Insufficient cash reserves.");return}if(ne>t){alert("Exceeds available supply this tick.");return}qe=!0;const a=document.querySelector(".pr-purchase-btn");a&&(a.disabled=!0,a.textContent="...");try{const d=n-i,{error:r}=await T.from("factions").update({corp_cash_reserves:d}).eq("id",m.id);if(r)throw r;const o=D[P]?.[O],l=(o?.qty||0)+ne,s=(o?.value||0)+i,{error:c}=await T.from("corp_warehouse").upsert({faction_id:m.id,nation_id:m.nation_id,material_key:P,quality_tier:O,quantity:l,total_value:s,last_purchased_tick:B?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(c){const{error:p}=await T.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);throw p&&console.error("Cash refund failed after warehouse error:",p.message),c}m.corp_cash_reserves=d,D[P]||(D[P]={}),D[P][O]={qty:l,value:s},Ve(),xt(),a&&(a.textContent="PURCHASED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(d){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(d.message||"Unknown error"))}finally{qe=!1}}function wt(e){const t=se||$;if(!t)return[];const i=$e(e);if(!i)return[];const n=Pt(e,t),a=[],d=Number(t?.inflation??50),r=Number(t?.fuel_prices??50);Number(t?.manufacturing_output??50);const o=se&&$&&se.id!==$.id;let l=null;if(o&&(l=Ot(t,$)),n.newAvailable>0){const s=et(e,t),c=i.basePrice,p=Math.round(c*((d-50)/200)),u=Math.round(c*((r-50)/300));let v=s;const _=[{label:"Base price",value:L(c)},p!==0?{label:`Inflation (${d})`,mod:(p>=0?"+":"")+L(Math.abs(p))}:null,u!==0?{label:`Fuel transport (${r})`,mod:(u>=0?"+":"")+L(Math.abs(u))}:null].filter(Boolean),g=s-c-p-u;if(g!==0&&!o&&_.push({label:"Demand/scarcity",mod:(g>=0?"+":"")+L(Math.abs(g))}),o&&l){const x=Math.round(s*l.tariff),y=Math.round(s*l.transport);v=s+x+y,_.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+L(x)}),_.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+L(y)})}a.push({seller:o?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:o?l?.deliveryTicks||1:0,condition:100,price:Math.round(v),available:n.newAvailable,delivery:o?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:o?l.deliveryTicks:0,used:!1,priceFactors:_,sourceNationId:t.id})}if(n.usedAvailable>0){const s=n.usedCondition,c=et(e,t,{used:!0,condition:s});let p=c;const u=[{label:"Base price",value:L(i.basePrice)},{label:`Condition (${s}%)`,mod:"-"+L(Math.max(0,i.basePrice-c))}];if(o&&l){const v=Math.round(c*l.tariff),_=Math.round(c*l.transport);p=c+v+_,u.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+L(v)}),u.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+L(_)})}a.push({seller:o?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:o?l?.deliveryTicks||1:0,condition:s,price:Math.round(p),available:n.usedAvailable,delivery:o?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:o?l.deliveryTicks:0,used:!0,priceFactors:u,sourceNationId:t.id})}return a}function ke(){const e=Number(m?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=L(e);const t=$e(H),i=fe[t?.tier||1],n=document.getElementById("em-tier-badge");n&&(n.textContent=i.tag,n.style.color=i.color),n.style.background=i.color+"0a",n.style.border="1px solid "+i.color+"33";const a=document.getElementById("em-nation-select");if(a&&a.options.length===0){const o=$?.name||m?.nation||"—";let l=`<option value="">${f(o)} (HQ)</option>`;for(const s of ye)s.id!==$?.id&&(l+=`<option value="${s.id}">${f(s.name)}</option>`);a.innerHTML=l}const d=document.getElementById("em-import-tag"),r=se&&$&&se.id!==$.id;d&&(d.style.display=r?"":"none"),vi(),Qe()}function vi(){let e="";for(let t=1;t<=3;t++){const i=fe[t],n=Oe(t),a=t===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";e+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${i.color}">${i.tag}</div>
            <div class="${a}">`;for(const d of n){const r=H===d.key,o=wt(d.key).length>0;e+=`<span class="em-selector__btn${r?" active":""}${o?"":" no-listings"}"
                style="${r?"background:"+i.color+";border-color:"+i.color:""}"
                onclick="setEmType('${d.key}')">${f(d.name)}</span>`}e+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${e}</div>`}function Qe(){const e=document.getElementById("em-content");if(Z=wt(H),Z.length===0){e.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}Y>=Z.length&&(Y=0);let t="";for(let n=0;n<Z.length;n++){const a=Z[n],d=Y===n,r=a.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",o=st(a.condition);t+=`<div class="em-listing${d?" selected":""}" style="${d?"border-left-color:"+r:""}" onclick="setEmListing(${n})">`,t+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${f(a.seller)}</span>
                <span class="em-badge em-badge--${a.sellerType.toLowerCase()}">${a.sellerType}</span>
                ${a.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,t+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${f((a.nation||"").toUpperCase())}</span>
            ${a.distance>0?`<span class="em-listing__distance">${a.distance} nation${a.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${f(a.delivery)}</span>
        </div>`,t+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${a.condition}%;background:${o}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${o}">${a.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${a.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${L(a.price)}</div>
            </div>
        </div>`,d&&a.priceFactors&&(t+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${a.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${f(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),t+="</div>"}const i=Z[Y];if(i){const n=$e(H),a=fe[n?.tier||1],d=Math.min(i.available,4),r=i.price*Q,o=(Number(m?.corp_cash_reserves)||0)>=r;t+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${f(n?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${f(i.seller)}</span>
                </div>
                <span class="em-purchase__price">${L(i.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:d},(l,s)=>s+1).map(l=>`<span class="em-qty-btn${Q===l?" active":""}" style="${Q===l?"background:"+a.color+";border-color:"+a.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${i.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${L(r)}</div>
                    ${i.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${f(i.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${a.color}" onclick="purchaseEquipment()"
                    ${o?"":"disabled"}
                    title="${o?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}e.innerHTML=t}async function yi(e){if(!e)se=null;else{let i=ye.find(n=>n.id===e);if(!i)try{const{data:n}=await T.from("nations").select("*").eq("id",e).single();i=n}catch{}se=i||null}Y=0,Q=1;const t=document.getElementById("em-nation-select");t&&(t.value=e||""),ke()}function gi(e){H=e,Y=0,Q=1,ke()}function _i(e){Y=e,Q=1,Qe()}function bi(e){Q=e,Qe()}let Ae=!1;async function $i(){if(Ae)return;const e=Z[Y];if(!e||!m)return;const t=$e(H);if(!t)return;const i=Q,n=e.price*i,a=Number(m.corp_cash_reserves)||0;if(n>a){alert("Insufficient cash reserves.");return}if(i>e.available){alert("Not enough units available.");return}const d=document.querySelector(".em-purchase-btn");d&&(d.disabled=!0,d.textContent="..."),Ae=!0;try{const r=a-n,{error:o}=await T.from("factions").update({corp_cash_reserves:r}).eq("id",m.id);if(o)throw o;const l=!e.deliveryTicks||e.deliveryTicks===0;if(l){const c=F.find(M=>M.equipment_key===H),p=(c?.owned||0)+i,u=c?.purchase_price_avg||0,v=c?.owned||0,_=v>0?Math.round((u*v+e.price*i)/p):e.price,g=t.maintenancePerUnit*p,x=c?.condition||100,y=Math.round((x*v+e.condition*i)/p),{error:w}=await T.from("corp_equipment").upsert({faction_id:m.id,nation_id:m.nation_id,equipment_key:H,tier:t.tier,owned:p,deployed:c?.deployed||0,condition:y,maintenance_per_tick:g,purchase_price_avg:_,last_purchased_tick:B?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(w){const{error:M}=await T.from("factions").update({corp_cash_reserves:a}).eq("id",m.id);throw M&&console.error("Cash refund failed:",M.message),w}c?(c.owned=p,c.condition=y,c.maintenance_per_tick=g):F.push({equipment_key:H,tier:t.tier,owned:p,deployed:0,condition:y,maintenance_per_tick:g,assigned_projects:[]})}else{const c=(B?.current_tick||0)+e.deliveryTicks,{error:p}=await T.from("corp_equipment_deliveries").insert({faction_id:m.id,equipment_key:H,quantity:i,condition:e.condition,delivery_tick:c,source_nation_id:e.sourceNationId||null,seller_name:e.seller,price_paid:n});if(p){const{error:u}=await T.from("factions").update({corp_cash_reserves:a}).eq("id",m.id);throw u&&console.error("Cash refund failed:",u.message),p}}m.corp_cash_reserves=r,Ke(),ke();const s=document.getElementById("pr-cash");s&&(s.textContent=L(r)),d&&(d.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{d.isConnected&&(d.disabled=!1,d.textContent="PURCHASE")},1500))}catch(r){d&&(d.disabled=!1,d.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{Ae=!1}}let xi=-1,pe=[],Ue=[],kt=[];function Le(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function hi(e,t,i){if(i)return"var(--orange)";const n=e/(t||1)*100;return n>50?"var(--green)":n>25?"var(--amber)":"var(--red)"}function wi(){const e=document.getElementById("pm-list"),t=pe.length,i=Ue.length,n=kt.length,a=pe.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${t})`,document.getElementById("pm-pending-count").textContent=`(${i})`,document.getElementById("pm-apply-count").textContent=`(${n})`;const d=document.getElementById("pm-badges");let r="";a>0&&(r+=`<span class="pm-badge pm-badge--expiring">${a} EXPIRING</span>`),i>0&&(r+=`<span class="pm-badge pm-badge--pending">${i} PENDING</span>`),d.innerHTML=r;const o=pe.reduce((l,s)=>l+(s.cost||0),0)+Ue.reduce((l,s)=>l+(s.cost||0),0);document.getElementById("pm-total-cost").textContent=Le(o),document.getElementById("pm-footer-active").textContent=t,document.getElementById("pm-footer-pending").textContent=i;{if(t===0){e.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";pe.forEach((s,c)=>{const p=xi===c,u=hi(s.ticks_left,s.total_ticks,s.expiring_soon),v=Math.min(s.ticks_left/(s.total_ticks||1)*100,100);l+=`<div class="pm-item ${s.expiring_soon?"pm-item--expiring":""} ${p?"expanded":""}" onclick="togglePmExpand(${c})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${f(s.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${f((s.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${u}">Expires: ${f(s.expires||"")}</span>
                        <span class="pm-item__ticks">(${s.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${v}%;background:${u}"></div></div>`,p&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${f(s.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${f(s.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Le(s.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${s.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${s.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(s.projects||[]).map(_=>`<span class="pm-project-chip">${f(_)}</span>`).join("")}</div>
                    </div>`,s.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${f(s.note)}</span></div>`),s.expiring_soon&&s.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${Le(s.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),e.innerHTML=l;return}}function ki(){pe=[],Ue=[],kt=[],wi()}let te=[],Ei=-1;function V(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function at(e){return e>=85?"var(--gold)":e>=60?"var(--green)":e>=40?"var(--orange)":"var(--red)"}function Ti(e){return"dl-result--"+e.toLowerCase()}function nt(){const e=document.getElementById("dl-list"),t=te.length;document.getElementById("dl-count").textContent=`${t} COMPLETED`;const i=te.reduce((o,l)=>{const s=l.financials||{};return o+((s.payment||0)+(s.bonus||0)-(s.penalty||0)-(s.total_cost||0))},0),n=document.getElementById("dl-lifetime-profit");n.textContent=(i>=0?"+":"")+V(i),n.style.color=i>=0?"var(--green)":"var(--red)";const a={};te.forEach(o=>{a[o.result]=(a[o.result]||0)+1});const d=document.getElementById("dl-footer-results");if(d.innerHTML=Object.entries(a).map(([o,l])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[o]||"var(--text-dim)"}">${f(o)}</div>
            <div class="dl-footer__result-count">${l}</div>
        </div>`).join(""),t===0){e.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let r="";te.forEach((o,l)=>{const s=Ei===l,c=o.financials||{},p=(c.payment||0)+(c.bonus||0)-(c.penalty||0)-(c.total_cost||0),u=p>=0,v=Ti(o.result),g={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[o.result]||"var(--text-dim)",x=o.type==="GOVERNMENT";if(r+=`<div class="dl-item ${s?"expanded":""}" onclick="toggleDlExpand(${l})">
            <div class="dl-item__inner" style="border-left:2px solid ${g}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${f(o.name)}</span>
                    <span class="dl-result-badge ${v}">${f(o.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${f(o.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${x?"var(--green)":"var(--gold)"}">${f(o.issuer)}</span>
                    <span class="dl-item__date">${f(o.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${at(o.quality_score)}">${o.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${o.rep_change>0?"var(--green)":o.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${o.rep_change>0?"+":""}${o.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${u?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${u?"var(--green)":"var(--red)"};margin-top:2px;">${u?"+":""}${V(p)}</div>
                    </div>
                </div>`,s){const y=o.inspection||{};r+='<div style="margin-top:8px;">',r+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(h=>{const k=y[h]||{score:0,issues:[]},q=at(k.score),I=Math.min(k.score/100*100,100);r+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${f(h.charAt(0).toUpperCase()+h.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${I}%;background:${q}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${q}">${k.score}</span>
                        </div>
                    </div>
                    ${(k.issues||[]).map(C=>`<div class="dl-inspect-issue">${f(C)}</div>`).join("")}
                </div>`});const w=y.permits||{passed:!0,issues:[]};r+=`<div class="dl-permits-row ${w.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${w.passed?"var(--green)":"var(--red)"}">${w.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(w.issues||[]).map(h=>`<div class="dl-inspect-issue dl-inspect-issue--red">${f(h)}</div>`).join("")}
            </div>`,r+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',r+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(o.materials_used||[]).forEach(h=>{const k=h.grade==="HIGH"?"var(--green)":h.grade==="STANDARD"?"var(--amber)":"var(--orange)",q=h.impact==="positive"?"▲":h.impact==="negative"?"▼":"–",I=h.impact==="positive"?"var(--green)":h.impact==="negative"?"var(--red)":"var(--text-dim)";r+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${f(h.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${k}"></div>
                    <span class="dl-mat-tag__grade" style="color:${k}">${f(h.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${I}">${q}</span>
                </div>`}),r+="</div>",r+='<div class="dl-section-label">Financial Summary</div>',r+='<div class="dl-fin-panel">',r+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${V(c.contract_value||0)}</span></div>`,(c.bonus||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${V(c.bonus)}</span></div>`),(c.penalty||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${V(c.penalty)}</span></div>`);const M=(c.payment||0)+(c.bonus||0)-(c.penalty||0);r+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${V(M)}</span></div>`,r+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${V(c.total_cost||0)}</span></div>`,r+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${u?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${u?"var(--green)":"var(--red)"}">${u?"+":""}${V(p)}</span>
            </div>`,r+="</div>";const b=o.timeline||{};r+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${b.actual||0}/${b.expected||0} ticks</span>`,b.early?r+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(b.expected||0)-(b.actual||0)} TICK${b.expected-b.actual!==1?"S":""} EARLY</span>`:!b.on_time&&b.actual>b.expected&&(r+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(b.actual||0)-(b.expected||0)} TICK${b.actual-b.expected!==1?"S":""} LATE</span>`),r+="</div>",r+="</div>"}r+="</div></div>"}),e.innerHTML=r}async function Ii(){if(!m){te=[],nt();return}const{data:e,error:t}=await T.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",m.id).order("delivered_at_tick",{ascending:!1}).limit(20);t?(console.warn("Failed to load deliveries:",t.message),te=[]):te=(e||[]).map(i=>{const n=i.construction_contracts||{};return{id:i.contract_id,name:n.name||"Project",type:n.issuer_type||"GOVERNMENT",issuer:n.issuer_name||"Government",delivered:"Tick "+(i.delivered_at_tick||0),result:i.result,quality_score:i.quality_score,rep_change:i.rep_change,financials:{contract_value:i.contract_value||0,bonus:i.quality_bonus||0,penalty:i.penalties||0,payment:i.payment_received||0,total_cost:i.total_cost||0},inspection:i.inspection||{},materials_used:i.materials_used||[],timeline:{expected:i.timeline_expected||0,actual:i.timeline_actual||0,on_time:i.on_time,early:i.timeline_actual<i.timeline_expected}}}),nt()}function Ke(){const e=F.reduce((o,l)=>o+(l.owned||0),0),t=F.reduce((o,l)=>o+(l.deployed||0),0),i=Bt(F),n=e-t;document.getElementById("eq-count").textContent=e+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${t} <span style="font-size:9px;color:var(--text-dim)">/ ${e}</span>
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">AVAILABLE</div>
            <div class="eq-summary__value" style="font-size:14px;color:${n===0?"var(--orange)":"var(--green)"}">
                ${n}
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">MAINT/TICK</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--red)">
                ${L(i)}
            </div>
        </div>`;const a={};for(const o of F)a[o.equipment_key]=o;let d="";for(let o=1;o<=3;o++){const l=fe[o],s=Oe(o),c=Re===o,p=s.reduce((v,_)=>v+(a[_.key]?.owned||0),0),u=s.reduce((v,_)=>v+(a[_.key]?.deployed||0),0);if(d+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${o})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${c?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${f(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${p>0?`<span class="eq-tier-hdr__count">${u}/${p}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,c)for(const v of s){const _=a[v.key],g=_?.owned||0,x=_?.deployed||0,y=_?.condition||0,w=v.maintenancePerUnit*g,M=g-x,b=g>0&&M===0,h=g>0&&y<65,k=st(y),q=_?.assigned_projects||[],I=q.length>0?q.map(C=>C.contract_name||"Project").join(", ").slice(0,30):g>0&&x>0?x+" project"+(x>1?"s":""):"—";d+=`<div class="eq-row${g===0?" unowned":""}">`,d+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${g===0?" dim":""}">${f(v.name)}</span>
                        ${h?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${g>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${b?"var(--orange)":"var(--green)"}">${M}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${x}/${g}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,g>0?d+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${y}%;background:${k}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${k}">${y}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${f(I)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${L(w)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:d+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',d+="</div>"}}document.getElementById("eq-list").innerHTML=d;const r=[1,2,3].map(o=>{const l=fe[o],s=Oe(o).reduce((c,p)=>c+(a[p.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${s>0?l.color+"33":"var(--border-0)"};background:${s>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${s>0?"var(--text-bright)":"var(--text-dim)"}">${s}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${L(i)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function Ci(e){Re=Re===e?-1:e,Ke()}async function Mi(){if(!m)return;const{data:e,error:t}=await T.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",m.id);t?(console.warn("Failed to load equipment:",t.message),F=[]):F=e||[],Ke()}async function Si(){const{data:{user:e}}=await T.auth.getUser();if(!e){window.location.href="login.html";return}const{data:t}=await T.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);ce=(t||[]).filter(s=>s.nation_id);const i=sessionStorage.getItem("active_faction_id");if(m=ce.find(s=>s.id===i)||ce.find(s=>s.faction_type==="corporation")||ce[0],!m){await T.auth.signOut(),window.location.href="login.html";return}if(m.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[n,a]=await Promise.all([m.nation_id?T.from("nations").select("*").eq("id",m.nation_id).single():Promise.resolve({data:null}),T.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);n.error&&console.warn("Nation load failed:",n.error.message),n.data&&($=n.data),a.error&&console.warn("Shard load failed:",a.error.message),B=a.data;const d=m.corp_ticker||m.abbreviation||"";if(document.getElementById("corp-logo").textContent=d.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=m.faction_name||"Unnamed Corp",B){if(document.getElementById("game-date").textContent=B.current_date||"—",document.getElementById("tick-number").textContent=B.current_tick||"—",B.next_tick_at){const c=(Number(B.tick_interval_hours)||8)*36e5,p=new Date(B.next_tick_at).getTime(),v=p-c+c/2;He=new Date(v>Date.now()?v:p+c/2),zt()}const s=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");s&&(s.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(d?"["+d+"]":m.faction_name||"Corp")+" ▾";const r=document.getElementById("topbar-cash");if(r){const s=Number(m.corp_cash_reserves??0),c=s>=1e9?"$"+(s/1e9).toFixed(1)+"B":s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k";r.textContent="CASH: "+c}const o=m.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+o+" AP</span>",document.getElementById("nation-pill").textContent=($?.name||m.nation||"—").toUpperCase();const l=document.getElementById("corp-faction-dropdown");if(l){let s="";for(const c of ce){const p=c.id===m.id,u=c.faction_type==="corporation"?"CORP":"PARTY",v=c.faction_type==="corporation"?"var(--teal)":"var(--amber)";s+=`<div class="corp-dd-item${p?" active":""}" onclick="switchToFaction('${c.id}', '${c.faction_type}')">
                <span class="corp-dd-type" style="color:${v}">${u}</span>
                <span class="corp-dd-name">${f(c.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${f(c.abbreviation||"—")}]</span>
            </div>`}l.innerHTML=s}await Promise.all([gt(),_t(),di(),Mi(),ki(),Ii()]);try{const{data:s}=await T.from("nations").select("*").order("name");ye=s||[]}catch{ye=[]}if(xt(),ke(),Nt(m,$,B),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const s=document.querySelector('[data-tab="expansion"]');s&&Tt({preventDefault:()=>{},target:s})}}async function qi(){await T.auth.signOut(),window.location.href="login.html"}function Ai(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function Li(e,t){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),t==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const t=document.getElementById("faction-switcher"),i=document.getElementById("corp-faction-dropdown");i&&t&&!t.contains(e.target)&&i.classList.remove("open")});document.addEventListener("keydown",e=>{e.key==="Escape"&&mt()});window.doLogout=qi;window.toggleTheme=Rt;window.toggleCorpDropdown=Ai;window.switchToFaction=Li;window.setFilter=Ht;window.openContractDetail=pt;window.closeContractDetail=mt;window.placeBid=oi;window.toggleWhRow=li;window.toggleEqTier=Ci;window.switchEmNation=yi;window.setEmType=gi;window.setEmListing=_i;window.setEmQty=bi;window.purchaseEquipment=$i;window.setPrMat=pi;window.setPrTier=mi;window.setPrQty=ui;window.purchaseMaterial=fi;let G={general:0,skilled:0,innovative:0},Ne=!1;const _e=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Et(e){const t=Number($?.minimum_wage??50),i=Number($?.inflation??50),n=Number($?.standard_of_living??50),a=t/100*48e3,d=1+(i-50)/100*.5,r=1+(n-50)/100*.5;return Math.round(a*e*d*r)}function S(e){const t=Math.abs(e),i=e<0?"-":"";return t>=1e9?i+"$"+(t/1e9).toFixed(2)+"B":t>=1e6?i+"$"+(t/1e6).toFixed(2)+"M":t>=1e3?i+"$"+(t/1e3).toFixed(1)+"k":i+"$"+t.toLocaleString()}async function Tt(e){e.preventDefault(),document.getElementById("operations-content").style.display="none";const t=document.getElementById("expansion-content");t.style.display="flex",t.style.justifyContent="center",t.style.gap="12px",t.style.alignItems="flex-start",t.style.flexWrap="wrap",document.querySelectorAll(".corp-nav__tab").forEach(i=>i.classList.remove("active")),e.target.classList.add("active"),Ee(),Oi(),await Di(),Ct(),await Mt(),Je()}function It(e){e&&e.preventDefault(),document.getElementById("operations-content").style.display="",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function Ni(e,t){const i=_e.find(d=>d.id===e),n=Number(m?.[i.factionKey]??0),a=G[e]+t;n+a<0||(G[e]=a,Ee())}function Bi(e){e?G[e]=0:G={general:0,skilled:0,innovative:0},Ee()}async function Pi(){if(Ne||!Object.values(G).some(a=>a!==0))return;let t=0;for(const a of _e){const d=G[a.id];d>0&&(t+=d*Et(a.multiplier)*.1)}const i=Number(m?.corp_cash_reserves??0);if(t>i){alert("Insufficient cash reserves. Hiring cost: "+S(t)+", available: "+S(i));return}const n=t>0?`Confirm workforce changes?

Hiring fee: `+S(t)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(n)){Ne=!0;try{const a={};for(const o of _e){const l=Number(m?.[o.factionKey]??0);a[o.factionKey]=Math.max(0,l+G[o.id])}t>0&&(a.corp_cash_reserves=Math.max(0,i-Math.round(t)));const{error:d}=await T.from("factions").update(a).eq("id",m.id);if(d)throw d;Object.assign(m,a),G={general:0,skilled:0,innovative:0};const r=document.getElementById("topbar-cash");if(r){const o=Number(m.corp_cash_reserves??0);r.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k")}Ee()}catch(a){alert("Error: "+a.message)}finally{Ne=!1}}}function Ee(){const e=document.getElementById("hf-card-container");if(!e)return;const t="'JetBrains Mono', monospace",i={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=Number($?.minimum_wage??50),a=Number($?.inflation??50),d=Number($?.standard_of_living??50),r=n/100*48e3,o=(1+(a-50)/100*.5).toFixed(2),l=(1+(d-50)/100*.5).toFixed(2),s=$?.name||m?.nation||"Nation",c=Object.values(G).some(y=>y!==0);let p=0,u=0,v=0,_=0,g="";for(const y of _e){const w=Number(m?.[y.factionKey]??0),M=G[y.id],b=w+M,h=Et(y.multiplier),k=M>0,q=w*h,I=b*h,C=I-q;p+=w,u+=b,v+=q,_+=I;const U=M!==0?k?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";g+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${i.border};background:${U};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${y.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${i.text}">${y.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${i.text}">${w.toLocaleString()}</span>
                    ${M!==0?`<span style="font-family:${t};font-size:10px;color:${i.dim}">→</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${k?i.greenBright:i.red}">${b.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${t};font-size:8px;color:${i.dim}">WAGE (MIN × ${y.multiplier}.0 × ${o} × ${l})</span>
                <span style="font-family:${t};font-size:10px;color:${y.color}">${S(h)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${y.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${i.red};border:1px solid ${i.border};cursor:pointer;background:${i.card}">-50</div>
                <div onclick="hfSetChange('${y.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${i.redDim};border:1px solid ${i.border};cursor:pointer;background:${i.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${M!==0?i.card:"transparent"};border:1px solid ${M!==0?i.border:"transparent"}">
                    ${M!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${t};font-size:12px;font-weight:700;color:${k?i.greenBright:i.red}">${k?"+":""}${M}</span>
                        <span onclick="hfReset('${y.id}')" style="font-family:${t};font-size:8px;color:${i.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${t};font-size:9px;color:${i.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${y.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${i.greenBright};border:1px solid ${i.border};cursor:pointer;background:${i.card}">+10</div>
                <div onclick="hfSetChange('${y.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${i.greenBright};border:1px solid ${i.border};cursor:pointer;background:${i.card}">+50</div>
            </div>
            ${M!==0?`<div style="margin-top:6px;padding:4px 8px;background:${i.bg};border:1px solid ${i.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${i.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${C>0?i.red:i.greenBright}">${C>0?"+":""}${S(C)}/yr</span>
            </div>`:""}
        </div>`}const x=_-v;e.innerHTML=`
    <div style="width:380px;height:450px;background:${i.surface};border:1px solid ${i.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${i.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${i.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${i.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${i.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${s.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${i.border};background:${i.card};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1.5px;color:${i.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${i.border}">
                        <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.5px">MIN WAGE</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${i.text}">${n}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${i.dim}">${S(r)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${i.border}">
                        <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${i.text}">${a}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${i.dim}">×${o}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${i.text}">${d}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${i.dim}">×${l}</div>
                    </div>
                </div>
            </div>
            ${g}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${i.border};background:${i.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${c?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.8px">TOTAL WORKFORCE</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${i.text}">${p.toLocaleString()}</span>
                        ${c?`<span style="font-family:${t};font-size:9px;color:${i.dim}">→</span>
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${u>p?i.greenBright:u<p?i.red:i.text}">${u.toLocaleString()}</span>`:""}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${i.text}">${S(v)}</span>
                        ${c?`<span style="font-family:${t};font-size:9px;color:${i.dim}">→</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${x>0?i.red:i.greenBright}">${S(_)}</span>`:""}
                    </div>
                </div>
            </div>
            ${c?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${i.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${t};font-size:8px;color:${i.dim}">NET CHANGE</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${x>0?i.red:i.greenBright}">${x>0?"+":""}${S(x)}/yr</span>
                    <span style="font-family:${t};font-size:8px;color:${i.dim}">(${x>0?"+":""}${S(Math.round(x/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:${i.dim};border:1px solid ${i.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${i.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function Oi(){const e=document.getElementById("wf-summary-container");if(!e)return;const t="'JetBrains Mono', monospace",i={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},n=($?.name||m?.nation||"Nation").toUpperCase(),a=Number($?.minimum_wage??50),d=Number($?.inflation??50),r=Number($?.standard_of_living??50),o=a/100*48e3,l=1+(d-50)/100*.5,s=1+(r-50)/100*.5,c=[{label:"General Workforce",mult:2,color:i.accent,key:"corp_general_workforce",countColor:i.text},{label:"Skilled Workforce",mult:3,color:i.gold,key:"corp_skilled_workforce",countColor:i.blue},{label:"Innovative Workforce",mult:6,color:i.orange,key:"corp_innovative_workforce",countColor:i.gold}];let p=0,u=0,v="";for(const _ of c){const g=Number(m?.[_.key]??0),x=Math.round(o*_.mult*l*s),y=g*x;p+=g,u+=y,v+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${i.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${i.text}">${_.label}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${i.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n}</span>
                </div>
                <span style="font-family:${t};font-size:16px;font-weight:700;color:${_.countColor}">${g.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${t};font-size:8px;color:${i.dim}">WAGE (MIN × ${_.mult}.0 × ${l.toFixed(2)} × ${s.toFixed(2)})</span>
                <span style="font-family:${t};font-size:10px;color:${i.muted}">${S(x)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${t};font-size:8px;color:${i.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${i.text}">${S(y)}</span>
            </div>
        </div>`}e.innerHTML=`
    <div style="width:380px;height:450px;background:${i.surface};border:1px solid ${i.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${i.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${i.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${i.muted};text-transform:uppercase">Workforce</span>
            </div>
            <span style="font-family:${t};font-size:12px;font-weight:700;color:${i.text}">${p.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${v}
            <div style="padding:8px 12px;background:${i.card};border-bottom:1px solid ${i.border};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1px;color:${i.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${t};font-size:8px;color:${i.dim}">MINIMUM WAGE (${n})</span>
                    <span style="font-family:${t};font-size:9px;color:${i.text}">${a}/100 → ${S(o)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${i.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${i.text}">×${l.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${i.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${i.text}">×${s.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${i.border};background:${i.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${i.dim};letter-spacing:0.8px">TOTAL WORKFORCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${i.text}">${p.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${i.dim};letter-spacing:0.8px">TOTAL ANNUAL WAGES</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${i.red}">${S(u)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:8px;color:${i.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${i.red}">${S(Math.round(u/12))}</span>
            </div>
        </div>
    </div>`}let me=[];async function Di(){if(!m?.id)return;const{data:e}=await T.from("corp_properties").select("*").eq("faction_id",m.id).eq("is_active",!0).order("purchased_at_tick",{ascending:!1});me=e||[]}function Ct(){const e=document.getElementById("property-card-container");if(!e)return;const t="'JetBrains Mono', monospace",i={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=($?.name||m?.nation||"Nation").toUpperCase();let a="",d=0,r=0;me.length===0&&(a=`<div style="padding:20px;text-align:center;font-family:${t};font-size:10px;color:${i.dim}">No properties owned.<br>Purchase from the marketplace →</div>`);for(const o of me){const l=be[o.style]||be.Basic;d+=Number(o.purchase_price||0),r+=Number(o.monthly_maintenance||0),a+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${i.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${i.text}">${o.name}</span>
                <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${i.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${t};font-size:8px;color:${i.dim};margin-bottom:4px;">${o.city||n} · ${(o.type||"").replace(/_/g," ")} · <span style="color:${l.color}">${(o.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${i.card};border:1px solid ${i.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${i.border}">
                    <div style="font-family:${t};font-size:7px;color:${i.dim}">CAPACITY</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${i.text}">${(o.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${i.border}">
                    <div style="font-family:${t};font-size:7px;color:${i.dim}">PAID</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${i.gold}">${S(o.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${t};font-size:7px;color:${i.dim}">MAINT/MO</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${i.red}">${S(o.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:7px;color:${i.dim}">CONDITION</span>
                <span style="font-family:${t};font-size:9px;color:${o.condition>=75?"#5c5":o.condition>=50?"#ca5":i.orange}">${o.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${i.border};margin-top:2px;"><div style="width:${o.condition}%;height:100%;background:${o.condition>=75?"#5c5":o.condition>=50?"#ca5":i.orange}"></div></div>
        </div>`}e.innerHTML=`
    <div style="width:380px;height:450px;background:${i.surface};border:1px solid ${i.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${i.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${i.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${i.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${t};font-size:10px;color:${i.muted}">${me.length} ASSET${me.length!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${a}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${i.border};background:${i.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${i.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${i.green}">${S(d)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${i.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${i.red}">${S(r)}/mo</span>
            </div>
        </div>
    </div>`}let de=[],R=null;const be={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Mt(){if(!m?.nation_id)return;const{data:e,error:t}=await T.from("available_properties").select("*").eq("nation_id",m.nation_id).eq("status","available").order("price",{ascending:!0});if(t){console.warn("[Property] Failed to load marketplace:",t.message);return}de=(e||[]).map(i=>({...i,adjusted_cost:i.price,adjusted_maintenance:i.monthly_maintenance}))}function Je(){const e=document.getElementById("new-property-container");if(!e)return;const t="'JetBrains Mono', monospace",i={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};($?.name||m?.nation||"Nation").toUpperCase();const n=Number($?.standard_of_living??50),a=Number($?.gdp_growth??50),d=Number($?.inflation??50),r=$?.capital||"Capital",o={capital:r,port:r+" Port",industrial:r+" Industrial Zone",suburban:r+" Suburbs",coastal:r+" Coast"};let l="";if(de.length===0)l=`<div style="padding:20px;text-align:center;font-family:${t};font-size:10px;color:${i.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let s=0;s<de.length;s++){const c=de[s],p=R===s,u=be[c.style]||be.Basic,v=o[c.city_template]||r;l+=`
            <div onclick="npSelect(${s})" style="padding:8px 14px;border-bottom:1px solid ${i.border};cursor:pointer;border-left:2px solid ${p?i.accent:"transparent"};background:${p?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${i.text}">${c.name}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${u.color};background:${u.color}12;border:1px solid ${u.color}25">${u.label}</span>
                </div>
                <div style="font-family:${t};font-size:8px;color:${i.dim};margin-bottom:5px;">${v} · ${c.type.replace(/_/g," ")}</div>
                <div style="display:flex;gap:0;background:${i.card};border:1px solid ${i.border}">
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${i.border}">
                        <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.5px">CAPACITY</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${i.text};margin-top:1px">${c.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${i.border}">
                        <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.5px">PRICE</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${i.gold};margin-top:1px">${S(c.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${i.redDim};margin-top:1px">${S(c.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${p?`<div style="margin-top:5px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:${t};font-size:7px;color:${i.dim}">CONDITION</span>
                        <span style="font-family:${t};font-size:9px;color:${c.condition>=75?i.greenBright:c.condition>=50?i.yellow:i.orange}">${c.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${i.border}"><div style="width:${c.condition}%;height:100%;background:${c.condition>=75?i.greenBright:c.condition>=50?i.yellow:i.orange}"></div></div>
                </div>`:""}
            </div>`}e.innerHTML=`
    <div style="width:380px;height:450px;background:${i.surface};border:1px solid ${i.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${i.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${i.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${i.muted};text-transform:uppercase">New Property</span>
            </div>
            <span style="font-family:${t};font-size:9px;color:${i.dim}">${de.length} AVAILABLE</span>
        </div>
        <div style="padding:4px 14px;border-bottom:1px solid ${i.border};display:flex;gap:12px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${t};font-size:7px;color:${i.dim}">STD OF LIVING</span>
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${n>=50?i.greenBright:i.yellow}">${Math.round(n)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${t};font-size:7px;color:${i.dim}">GDP GROWTH</span>
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${a>=50?i.greenBright:i.yellow}">${Math.round(a)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${t};font-size:7px;color:${i.dim}">INFLATION</span>
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${d<=50?i.greenBright:i.red}">${Math.round(d)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${l}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${i.border};background:${i.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${i.gold};border:1px solid ${i.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${R!==null?"#000":i.dim};background:${R!==null?i.accent:"transparent"};border:1px solid ${R!==null?i.accent:i.border};cursor:${R!==null?"pointer":"default"};opacity:${R!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function zi(e){R=R===e?null:e,Je()}let Be=!1;async function Ri(){if(R===null||Be)return;const e=de[R];if(!e)return;const t=Number(m?.corp_cash_reserves??0);if(e.adjusted_cost>t){alert(`Insufficient cash reserves.
Property: `+S(e.adjusted_cost)+`
Cash: `+S(t));return}if(confirm('Buy "'+e.name+'" for '+S(e.adjusted_cost)+`?

Monthly maintenance: `+S(e.adjusted_maintenance)+`/mo
Condition: `+e.condition+`%

This will be deducted from your cash reserves.`)){Be=!0;try{const{error:i}=await T.from("corp_properties").insert({faction_id:m.id,nation_id:m.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,purchase_price:e.adjusted_cost,monthly_maintenance:e.adjusted_maintenance,condition:e.condition,city:e.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(i)throw i;const n=Math.max(0,t-e.adjusted_cost),{error:a}=await T.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);if(a)throw a;m.corp_cash_reserves=n,e.id&&await T.from("available_properties").update({status:"sold",purchased_by:m.id}).eq("id",e.id);const d=document.getElementById("topbar-cash");d&&(d.textContent="CASH: "+(n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k")),R=null,await Mt(),Je(),Ct(),alert("Property purchased: "+e.name+`

Deducted: `+S(e.adjusted_cost))}catch(i){alert("Purchase failed: "+i.message)}finally{Be=!1}}}const ie={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let Xe=!1,E={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Pe=!1;function St(){const t=1+(Number($?.inflation??50)-50)/100*.3,i=ie[E.style]?.costMod||1,n=Math.round(E.size*1e5*t*i),a=Math.round(n*(1+E.budgetMod/100)),d=Math.round(a*.007*(ie[E.style]?.maintMod||1));return{baseBudget:n,adjusted:a,maint:d,inflMod:t,styleMod:i}}function Hi(){Xe=!0,E={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},qt()}function Ze(){Xe=!1,document.getElementById("cp-modal-overlay")?.remove()}function ji(e,t){E[e]=t,qt()}async function Gi(){if(!(Pe||!E.name.trim())){Pe=!0;try{const e=St(),t=$?.name||m?.nation||"Unknown",i=ie[E.style]?.repGain||1,n=await T.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),a=n.data?.current_tick||0,d=(n.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:r}=await T.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",m.nation_id).eq("issuer_type","PRIVATE"),l=`PVT-C${(r||0)+1}-${d}`,{error:s}=await T.from("construction_contracts").insert({nation_id:m.nation_id,template_key:"custom_building",sector:"civil_engineering",name:E.name.trim(),description:`${E.type} (${E.style}) — ${E.size.toLocaleString()} employees, commissioned by ${m.faction_name}`,project_code:l,budget_ceiling:e.adjusted,timeline_ticks:E.timeline,required_materials:{concrete:Math.ceil(E.size/200),steel:Math.ceil(E.size/300)},required_equipment:["work_trucks","excavators","concrete_mixers","tower_cranes"],required_workforce:{general:Math.ceil(E.size/15),skilled:Math.ceil(E.size/50)},status:"open",generated_at_tick:a,bidding_ends_tick:a+3,issuer_type:"PRIVATE",issuer_name:m.faction_name,issuer_faction_id:m.id});if(s)throw s;Ze(),alert(`Construction project submitted!

Project: `+E.name.trim()+`
Code: `+l+`
Budget: `+S(e.adjusted)+`
Expected Reputation: +`+i+`

All construction corporations in `+t+" can now bid on this project.")}catch(e){alert("Failed to submit project: "+e.message)}finally{Pe=!1}}}function qt(){if(document.getElementById("cp-modal-overlay")?.remove(),!Xe)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=St(),n=$?.name||m?.nation||"Nation",a=ie[E.style]?.repGain||1,d=a>=4?t.gold:a>=3?t.greenBright:a>=2?t.accent:t.dim,r=Object.entries(ie).map(([s,c])=>{const p=E.style===s;return`<div onclick="cpSetField('style','${s}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${p?c.color+"18":"transparent"};border:1px solid ${p?c.color+"44":t.border};">
            <div style="font-family:${e};font-size:9px;font-weight:700;color:${p?c.color:t.dim}">${s}</div>
            <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">×${c.costMod.toFixed(1)} cost</div>
        </div>`}).join(""),o=document.createElement("div");o.id="cp-modal-overlay",o.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",o.innerHTML=`
    <div style="width:440px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;max-height:90vh;">
        <div style="padding:10px 16px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.gold}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Construction Project</span>
            </div>
            <span onclick="cpClose()" style="font-family:${e};font-size:14px;color:${t.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:12px 16px;overflow:auto;flex:1;">

            <div style="margin-bottom:12px;">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Building Name</div>
                <input id="cp-name-input" value="${E.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:6px 10px;font-family:${e};font-size:11px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Type</div>
                <div style="display:flex;gap:4px;">
                    ${["Regional HQ","Office Building"].map(s=>`<span onclick="cpSetField('type','${s}')" style="flex:1;text-align:center;padding:5px 0;font-family:${e};font-size:9px;font-weight:700;cursor:pointer;color:${E.type===s?"#000":t.dim};background:${E.type===s?t.accent:"transparent"};border:1px solid ${E.type===s?t.accent:t.border}">${s}</span>`).join("")}
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.text}">${E.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${E.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${t.accent};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${e};font-size:7px;color:${t.dim};margin-top:2px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">${r}</div>
                <div style="margin-top:4px;font-family:${e};font-size:8px;color:${ie[E.style].color}">${ie[E.style].desc}</div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase">Timeline</span>
                    <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.text}">${E.timeline} months</span>
                </div>
                <input type="range" min="24" max="60" step="6" value="${E.timeline}" oninput="cpSetField('timeline',+this.value)"
                    style="width:100%;accent-color:${t.gold};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${e};font-size:7px;color:${t.dim};margin-top:2px">
                    <span>24 months</span><span>60 months</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Budget</div>
                <div style="background:${t.card};border:1px solid ${t.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border}">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE (${E.size.toLocaleString()} × $100k × ${i.inflMod.toFixed(2)} × ${i.styleMod.toFixed(1)})</span>
                        <span style="font-family:${e};font-size:9px;color:${t.muted}">${S(i.baseBudget)}</span>
                    </div>
                    <div style="padding:6px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                            <span style="font-family:${e};font-size:8px;color:${t.dim}">ADJUSTMENT</span>
                            <span style="font-family:${e};font-size:10px;font-weight:700;color:${E.budgetMod>0?t.greenBright:E.budgetMod<0?t.red:t.dim}">${E.budgetMod>0?"+":""}${E.budgetMod}%</span>
                        </div>
                        <input type="range" min="-15" max="15" step="1" value="${E.budgetMod}" oninput="cpSetField('budgetMod',+this.value)"
                            style="width:100%;accent-color:${t.accent};height:4px;" />
                        <div style="display:flex;justify-content:space-between;font-family:${e};font-size:7px;color:${t.dim};margin-top:2px">
                            <span>-15% (budget cut)</span><span>+15% (quality invest)</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid ${t.border}">
                        <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL BUDGET</span>
                        <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${S(i.adjusted)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${e};font-size:9px;color:${t.redDim}">${S(i.maint)}/mo</span>
                    </div>
                </div>
            </div>

            <div style="padding:6px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);margin-bottom:8px;">
                <div style="font-family:${e};font-size:8px;color:${t.gold};margin-bottom:2px">WHAT HAPPENS NEXT</div>
                <div style="font-size:9px;color:${t.dim};line-height:1.5">
                    This project will appear as a Civil Engineering bid in the Open Contracts pool for all construction corporations with an HQ or Regional HQ in ${n}. The lowest qualified bidder wins the contract and begins construction.
                </div>
            </div>

            <div style="padding:6px 8px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:${e};font-size:9px;color:${t.accent}">EXPECTED REPUTATION GAIN</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${d}">+${a}</span>
                </div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:2px">${E.style} style · ${a===5?"Maximum prestige":a>=4?"Impressive presence":a>=3?"Strong statement":a>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:10px 16px;border-top:1px solid ${t.border};background:${t.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${e};font-size:7px;color:${t.dim}">TOTAL PROJECT</div>
                <div style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${S(i.adjusted)}</div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="cpClose()" style="padding:5px 16px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:5px 16px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${t.gold};cursor:pointer;opacity:${E.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(o);const l=document.getElementById("cp-name-input");l&&l.addEventListener("input",s=>{E.name=s.target.value}),o.addEventListener("click",s=>{s.target===o&&Ze()})}function Ui(){const e=document.getElementById("cp-name-input");if(e&&(E.name=e.value),!E.name.trim()){alert("Please enter a building name.");return}Gi()}window.cpClose=Ze;window.cpSetField=ji;window.cpSubmitFromModal=Ui;window.npSelect=zi;window.npBuyProperty=Ri;window.npOpenConstructionModal=Hi;window.switchToExpansion=Tt;window.switchToOperations=It;window.hfSetChange=Ni;window.hfReset=Bi;window.hfConfirm=Pi;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(e){this.classList.contains("active")||(e.preventDefault(),It(e))});Si();
